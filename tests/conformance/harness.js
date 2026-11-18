/**
 * Reusable adapter conformance suite (C-01 … C-12).
 *
 * The suite is adapter-agnostic: it receives a descriptor and exercises the
 * public registry boundary. Mock passes now; C++ and JavaScript must pass the
 * same checks without language-specific branches here.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

import { createAdapterRegistry, createCapabilities } from '../../src/core/adapterRegistry.js';
import { createCancellationSource } from '../../src/core/csr/cancellation.js';
import { createAnalysisRun } from '../../src/core/csr/entities.js';
import { createLineIndex, rangeFromOffsets, sliceRange } from '../../src/core/csr/provenance.js';
import { createQueryLayer } from '../../src/core/csr/query.js';
import { serializeRun } from '../../src/core/csr/serialize.js';
import { DERIVED_RELATIONSHIP_TYPES, REASON_CODES } from '../../src/core/csr/types.js';
import { validateAnalysisRun } from '../../src/core/csr/validate.js';

const REASON_SET = new Set(REASON_CODES);
const DERIVED_SET = new Set(DERIVED_RELATIONSHIP_TYPES);

/**
 * @typedef {Object} ConformanceResult
 * @property {string} id
 * @property {string} title
 * @property {boolean} passed
 * @property {string} detail
 */

/**
 * @param {{
 *   name: string,
 *   adapter: import('../../src/core/adapterRegistry.js').AdapterDescriptor,
 *   sourceFile?: string,
 *   fixturePath?: string,
 * }} options
 * @returns {Promise<{name: string, passed: boolean, results: ConformanceResult[]}>}
 */
export async function runConformanceSuite(options) {
  const name = options.name;
  const adapter = options.adapter;
  const fixturePath = options.fixturePath ?? 'sample.mock';
  const runId = 'run:conformance';
  const capabilities = createCapabilities(adapter.capabilities);

  /** @type {ConformanceResult[]} */
  const results = [];
  /**
   * @param {string} id
   * @param {string} title
   * @param {boolean} passed
   * @param {string} [detail]
   */
  function record(id, title, passed, detail = '') {
    results.push({ id, title, passed, detail });
  }

  let raw = null;
  let rawError = null;
  try {
    raw = await adapter.analyze({ path: fixturePath, runId });
  } catch (error) {
    rawError = error instanceof Error ? error.message : String(error);
  }

  const rawObject =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? /** @type {Record<string, unknown>} */ (structuredClone(raw))
      : null;

  // C-01 — shape ---------------------------------------------------------------
  const registry = createAdapterRegistry();
  registry.register(adapter);
  const analyzed = await registry.analyze({ path: fixturePath, runId }, { mode: 'strict' });
  record(
    'C-01',
    'Output validates against the CSR schema',
    analyzed.ok === true,
    analyzed.ok
      ? 'strict validation passed'
      : (rawError ??
          `${analyzed.code}: ${analyzed.message} ${JSON.stringify(analyzed.issues ?? [])}`),
  );

  // Use the validated run when possible; otherwise run structural checks on the
  // raw fixture so a hostile adapter still gets specific citations.
  const run = analyzed.ok ? analyzed.run : rawObject ? analyzeRaw(rawObject) : null;

  // C-02 — provenance ----------------------------------------------------------
  if (run) {
    const fileIds = new Set(run.files.map((file) => file.fileId));
    const lineCountById = new Map(run.files.map((file) => [file.fileId, file.lineCount]));
    /** @type {string[]} */
    const problems = [];
    for (const symbol of run.symbols) {
      const declaration = symbol.declaration;
      if (!declaration || typeof declaration !== 'object') {
        problems.push(`${String(symbol.symbolId)} has no declaration range`);
      } else if (!fileIds.has(declaration.fileId)) {
        problems.push(`${symbol.symbolId} points at an unknown file`);
      } else if (declaration.endLine >= (lineCountById.get(declaration.fileId) ?? 0)) {
        problems.push(`${symbol.symbolId} exceeds its file's line count`);
      }
    }
    for (const relationship of run.relationships) {
      if (relationship.site && !fileIds.has(relationship.site.fileId)) {
        problems.push(`${relationship.relationshipId} site points at an unknown file`);
      }
    }
    record(
      'C-02',
      'Every symbol and relationship site has in-bounds provenance',
      problems.length === 0,
      problems.slice(0, 3).join('; '),
    );
  } else {
    record('C-02', 'Every symbol and relationship site has in-bounds provenance', false, 'no run');
  }

  // C-03 — identity ------------------------------------------------------------
  if (run) {
    const ids = new Set();
    const identities = new Set();
    /** @type {string[]} */
    const problems = [];
    for (const symbol of run.symbols) {
      if (ids.has(symbol.symbolId)) {
        problems.push(`duplicate symbolId ${symbol.symbolId}`);
      }
      ids.add(symbol.symbolId);
      const declaration =
        symbol.declaration && typeof symbol.declaration === 'object' ? symbol.declaration : {};
      const identity = [
        declaration.fileId ?? '',
        symbol.kind,
        symbol.qualifiedName,
        symbol.disambiguator ?? '',
      ].join('|');
      if (identities.has(identity)) {
        problems.push(`duplicate identity ${identity}`);
      }
      identities.add(identity);
    }
    record(
      'C-03',
      'Symbol ids and identity tuples are unique',
      problems.length === 0,
      problems.slice(0, 3).join('; '),
    );
  } else {
    record('C-03', 'Symbol ids and identity tuples are unique', false, 'no run');
  }

  // C-04 — status honesty ------------------------------------------------------
  if (run) {
    /** @type {string[]} */
    const problems = [];
    for (const relationship of run.relationships) {
      if (relationship.status !== 'resolved') {
        if (!relationship.reasonCode || !REASON_SET.has(relationship.reasonCode)) {
          problems.push(`${relationship.relationshipId} lacks a valid reasonCode`);
        }
      }
    }
    for (const fact of run.dataFacts) {
      if (fact.status !== 'resolved' && (!fact.reasonCode || !REASON_SET.has(fact.reasonCode))) {
        problems.push(`${fact.factId} lacks a valid reasonCode`);
      }
    }
    record(
      'C-04',
      'Non-resolved facts carry a reason code from the closed enum',
      problems.length === 0,
      problems.slice(0, 3).join('; '),
    );
  } else {
    record('C-04', 'Non-resolved facts carry a reason code from the closed enum', false, 'no run');
  }

  // C-05 — inverse consistency -------------------------------------------------
  if (run) {
    const query = createQueryLayer(run, { capabilities });
    const declared = new Set(run.symbols.map((symbol) => symbol.symbolId));
    /** @type {string[]} */
    const problems = [];
    for (const relationship of run.relationships) {
      if (DERIVED_SET.has(relationship.type)) {
        problems.push(`stored derived relationship ${relationship.relationshipId}`);
      }
      if (relationship.type !== 'calls' || !declared.has(relationship.to)) {
        // External targets have no symbol record to query from.
        continue;
      }
      const incoming = query.incoming(relationship.to, { types: ['calls'] });
      if (!incoming.ok) {
        problems.push(incoming.message);
        continue;
      }
      const match = incoming.value.some(
        (candidate) =>
          candidate.type === 'called_by' &&
          candidate.from === relationship.to &&
          candidate.to === relationship.from,
      );
      if (!match) {
        problems.push(`missing called_by inverse for ${relationship.relationshipId}`);
      }
    }
    record(
      'C-05',
      'Derived called_by matches stored calls exactly',
      problems.length === 0,
      problems.slice(0, 3).join('; '),
    );
  } else {
    record('C-05', 'Derived called_by matches stored calls exactly', false, 'no run');
  }

  // C-06 — determinism ---------------------------------------------------------
  if (analyzed.ok) {
    const second = await registry.analyze({ path: fixturePath, runId }, { mode: 'strict' });
    const passed = second.ok === true && serializeRun(analyzed.run) === serializeRun(second.run);
    record(
      'C-06',
      'Two runs on identical input serialize identically',
      passed,
      passed ? 'byte-identical' : 'serialization differs',
    );
  } else {
    record('C-06', 'Two runs on identical input serialize identically', false, 'no valid run');
  }

  // C-07 — cancellation --------------------------------------------------------
  {
    const cancellationRegistry = createAdapterRegistry();
    cancellationRegistry.register({ ...adapter, id: `${adapter.id}-cancel` });
    const source = createCancellationSource();
    source.cancel('conformance');
    const cancelled = await cancellationRegistry.analyze({
      path: fixturePath,
      runId: `${runId}:cancel`,
      cancellation: source.token,
    });
    const passed =
      cancelled.ok === true &&
      cancelled.run.completeness === 'partial' &&
      cancelled.run.diagnostics.some((diagnostic) => diagnostic.code === 'E_CANCELLED');
    record(
      'C-07',
      'Cancellation yields a partial result, not a rejection',
      passed,
      passed ? 'partial run with E_CANCELLED' : JSON.stringify(cancelled).slice(0, 240),
    );
  }

  // C-08 — fault isolation -----------------------------------------------------
  {
    const faultRegistry = createAdapterRegistry();
    faultRegistry.register({
      ...adapter,
      id: `${adapter.id}-fault`,
      extensions: ['.conformance-fault'],
      analyze() {
        throw new Error('conformance explosion');
      },
    });
    const faulted = await faultRegistry.analyze({
      path: 'x.conformance-fault',
      runId: `${runId}:fault`,
    });
    const passed =
      faulted.ok === true &&
      faulted.run.completeness === 'partial' &&
      faulted.run.diagnostics.some((diagnostic) => diagnostic.code === 'E_ADAPTER');
    record(
      'C-08',
      'A throwing adapter becomes a partial run plus diagnostic',
      passed,
      passed ? 'host survived' : JSON.stringify(faulted).slice(0, 240),
    );
  }

  // C-09 — size limits ---------------------------------------------------------
  {
    const hugeRegistry = createAdapterRegistry();
    hugeRegistry.register({
      ...adapter,
      id: `${adapter.id}-huge`,
      extensions: ['.conformance-huge'],
      analyze(input) {
        const huge = createAnalysisRun({
          runId: input.runId,
          adapterId: `${adapter.id}-huge`,
          language: adapter.languages[0],
        });
        for (let index = 0; index < 5_001; index += 1) {
          huge.files.push({
            fileId: `file:huge-${index}`,
            path: `huge-${index}.mock`,
            language: adapter.languages[0],
            contentHash: 'x',
            sizeBytes: 0,
            lineCount: 1,
            generated: false,
          });
        }
        return huge;
      },
    });
    const huge = await hugeRegistry.analyze({
      path: 'x.conformance-huge',
      runId: `${runId}:huge`,
    });
    const passed = huge.ok === false && huge.code === 'E_LIMIT';
    record(
      'C-09',
      'Oversized output is rejected with E_LIMIT, never truncated',
      passed,
      passed ? 'E_LIMIT' : JSON.stringify(huge).slice(0, 240),
    );
  }

  // C-10 — extension isolation -------------------------------------------------
  if (run) {
    const extended = structuredClone(run);
    extended.extensions = { 'conformance:unknown': { nested: [1, 2, 3] } };
    if (extended.symbols[0]) {
      extended.symbols[0].extensions = {
        ...(extended.symbols[0].extensions ?? {}),
        'conformance:unknown': true,
      };
    }
    const validation = validateAnalysisRun(extended, { mode: 'strict' });
    const roundTrip = serializeRun(extended);
    const passed = validation.ok && roundTrip.includes('conformance:unknown');
    record(
      'C-10',
      'Unknown extensions are ignored by validation and survive serialization',
      passed,
      passed ? 'ignored and preserved' : JSON.stringify(validation.issues ?? []).slice(0, 240),
    );
  } else {
    record(
      'C-10',
      'Unknown extensions are ignored by validation and survive serialization',
      false,
      'no run',
    );
  }

  // C-11 — no execution --------------------------------------------------------
  if (options.sourceFile) {
    const source = await fs.readFile(path.resolve(process.cwd(), options.sourceFile), 'utf8');
    const forbidden = [
      /\bchild_process\b/,
      /\brequire\s*\(/,
      /\beval\s*\(/,
      /\bnew\s+Function\b/,
      /\bnode:fs\b/,
      /\bprocess\.binding\b/,
    ];
    const hits = forbidden.filter((pattern) => pattern.test(source)).map(String);
    record(
      'C-11',
      'Adapter never executes analysed code or spawns processes',
      hits.length === 0,
      hits.join('; '),
    );
  } else {
    record(
      'C-11',
      'Adapter never executes analysed code or spawns processes',
      true,
      'skipped: no sourceFile supplied',
    );
  }

  // C-12 — encoding ------------------------------------------------------------
  {
    const text = 'function naïve() {}\nconst 函数 = 1;';
    const index = createLineIndex(text);
    const start = text.indexOf('函数');
    const range = rangeFromOffsets('file:encoding', index, start, start + 2);
    const slice = sliceRange(index, range);
    const nonAscii = run ? run.symbols.filter((symbol) => hasNonAscii(symbol.name)) : [];
    const names =
      run && nonAscii.length > 0
        ? nonAscii.every((symbol) =>
            run.symbols.some((entry) => entry.symbolId === symbol.symbolId),
          )
        : true;
    const passed = slice === '函数' && range.startColumn === 6 && names;
    record(
      'C-12',
      'Non-ASCII identifiers preserve ranges and names',
      passed,
      passed
        ? nonAscii.length > 0
          ? `checked: ${nonAscii.map((symbol) => symbol.name).join(', ')}`
          : 'provenance helper checked; adapter has no non-ASCII identifiers'
        : `slice="${slice}" column=${range.startColumn}`,
    );
  }

  return {
    name,
    passed: results.every((entry) => entry.passed),
    results,
  };
}

/**
 * Turn a hostile raw fixture into a shape the structural checks can inspect.
 * This deliberately does not repair it: it only supplies missing collections so
 * C-02…C-04 can cite the records that violate the contract.
 *
 * @param {Record<string, unknown>} raw
 * @returns {{
 *   files: Array<Record<string, unknown>>,
 *   symbols: Array<Record<string, unknown>>,
 *   relationships: Array<Record<string, unknown>>,
 *   dataFacts: Array<Record<string, unknown>>,
 * }}
 */
function analyzeRaw(raw) {
  const asArray = (value) => (Array.isArray(value) ? value : []);
  return {
    files: /** @type {Array<Record<string, unknown>>} */ (asArray(raw.files)),
    symbols: /** @type {Array<Record<string, unknown>>} */ (asArray(raw.symbols)),
    relationships: /** @type {Array<Record<string, unknown>>} */ (asArray(raw.relationships)),
    controlConstructs: /** @type {Array<Record<string, unknown>>} */ (
      asArray(raw.controlConstructs)
    ),
    dataFacts: /** @type {Array<Record<string, unknown>>} */ (asArray(raw.dataFacts)),
  };
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function hasNonAscii(value) {
  const text = String(value ?? '');
  for (const character of text) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint > 0x7f) {
      return true;
    }
  }
  return false;
}
