var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension/extension.js
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode5 = __toESM(require("vscode"), 1);

// src/extension/log.js
var vscode = __toESM(require("vscode"), 1);

// src/core/log/redact.js
var MAX_FIELD_LENGTH = 500;
var MAX_FIELDS = 20;
var MAX_DEPTH = 3;
var SECRET_KEY_PATTERN = /(pass(word)?|secret|token|api[-_]?key|apikey|credential|authorization|cookie|private[-_]?key)/i;
var SECRET_VALUE_PATTERNS = [
  [/\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, "gh*_***"],
  [/\bgithub_pat_[A-Za-z0-9_]{20,}\b/g, "github_pat_***"],
  [/\bsk-[A-Za-z0-9]{20,}\b/g, "sk-***"],
  [/\bAKIA[0-9A-Z]{16}\b/g, "AKIA***"],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, "xox*-***"]
];
function redactString(input) {
  let output = input;
  for (const [pattern, replacement] of SECRET_VALUE_PATTERNS) {
    output = output.replace(pattern, replacement);
  }
  if (output.length > MAX_FIELD_LENGTH) {
    const removed = output.length - MAX_FIELD_LENGTH;
    output = `${output.slice(0, MAX_FIELD_LENGTH)}\u2026(+${removed} chars)`;
  }
  return output;
}
function redactValue(value, depth = 0) {
  if (value === null || value === void 0) {
    return value;
  }
  if (typeof value === "string") {
    return redactString(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "bigint") {
    return `${value.toString()}n`;
  }
  if (typeof value === "function") {
    return "[function]";
  }
  if (value instanceof Error) {
    return { name: value.name, message: redactString(value.message) };
  }
  if (depth >= MAX_DEPTH) {
    return Array.isArray(value) ? "[array]" : "[object]";
  }
  if (Array.isArray(value)) {
    return value.slice(0, MAX_FIELDS).map((item) => redactValue(item, depth + 1));
  }
  if (typeof value === "object") {
    const output = {};
    const entries = Object.entries(value).slice(0, MAX_FIELDS);
    for (const [key, child] of entries) {
      output[key] = SECRET_KEY_PATTERN.test(key) ? "***" : redactValue(child, depth + 1);
    }
    return output;
  }
  return String(value);
}
function redactFields(fields) {
  if (!fields) {
    return {};
  }
  const output = {};
  for (const [key, value] of Object.entries(fields).slice(0, MAX_FIELDS)) {
    output[key] = SECRET_KEY_PATTERN.test(key) ? "***" : redactValue(value);
  }
  return output;
}
function formatLogLine(entry) {
  const timestamp = (entry.timestamp ?? /* @__PURE__ */ new Date()).toISOString();
  const level = entry.level.toUpperCase().padEnd(5);
  const fields = redactFields(entry.fields);
  const fieldKeys = Object.keys(fields);
  const suffix = fieldKeys.length > 0 ? ` ${JSON.stringify(fields)}` : "";
  return `[${timestamp}] ${level} ${redactString(entry.message)}${suffix}`;
}

// src/extension/log.js
var LEVEL_RANK = { off: 0, error: 1, warn: 2, info: 3, debug: 4 };
function coerceLevel(value) {
  return typeof value === "string" && value in LEVEL_RANK ? (
    /** @type {LogLevel} */
    value
  ) : "warn";
}
function createLogger(context) {
  const channel = vscode.window.createOutputChannel("CodeFlow");
  let level = coerceLevel(vscode.workspace.getConfiguration("codeflow").get("logLevel", "warn"));
  const configListener = vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("codeflow.logLevel")) {
      level = coerceLevel(vscode.workspace.getConfiguration("codeflow").get("logLevel", "warn"));
    }
  });
  context.subscriptions.push(channel, configListener);
  function write(entryLevel, message, fields) {
    if (LEVEL_RANK[entryLevel] > LEVEL_RANK[level] || level === "off") {
      return;
    }
    channel.appendLine(formatLogLine({ level: entryLevel, message, fields }));
  }
  return {
    debug: (message, fields) => write("debug", message, fields),
    info: (message, fields) => write("info", message, fields),
    warn: (message, fields) => write("warn", message, fields),
    error: (message, fields) => write("error", message, fields),
    show: () => channel.show(true),
    level: () => level,
    dispose: () => {
      configListener.dispose();
      channel.dispose();
    }
  };
}

// src/core/csr/types.js
var CSR_VERSION = "1.1.0";
var CSR_SUPPORTED_MAJOR = 1;
function parseCsrVersion(value) {
  if (typeof value !== "string") {
    return null;
  }
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  if (!match) {
    return null;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3])
  };
}
function isCompatibleCsrVersion(value) {
  const parsed = parseCsrVersion(value);
  return parsed !== null && parsed.major === CSR_SUPPORTED_MAJOR;
}
function isNewerMinor(value) {
  const parsed = parseCsrVersion(value);
  const current = parseCsrVersion(CSR_VERSION);
  if (!parsed || !current) {
    return false;
  }
  return parsed.major === current.major && parsed.minor > current.minor;
}
var SYMBOL_KINDS = Object.freeze([
  "file",
  "namespace",
  "module",
  "class",
  "struct",
  "interface",
  "function",
  "method",
  "constructor",
  "destructor",
  "lambda",
  "closure",
  "variable",
  "parameter",
  "field",
  "property",
  "enum",
  "enum_member",
  "type_alias",
  "macro",
  "unknown"
]);
var RELATIONSHIP_TYPES = Object.freeze([
  "calls",
  "references",
  "defines",
  "declares",
  "imports",
  "exports",
  "includes",
  "inherits",
  "implements",
  "overrides",
  "instantiates",
  "reads",
  "writes",
  "assigns",
  "parameter_of",
  "captures"
]);
var DERIVED_RELATIONSHIP_TYPES = Object.freeze([
  "called_by",
  "defined_in",
  "referenced_by",
  "declared_by",
  "read_by",
  "written_by",
  "captured_by"
]);
var RESOLUTION_STATUSES = Object.freeze([
  "resolved",
  "inferred",
  "possible",
  "unresolved",
  "stale"
]);
var REASON_CODES = Object.freeze([
  "dynamic_dispatch",
  "function_pointer",
  "missing_compile_db",
  "missing_system_headers",
  "toolchain_version_mismatch",
  "template_dependent",
  "unsupported_construct",
  "header_without_tu",
  "macro_expansion",
  "unknown_import_target",
  "external_package",
  "path_alias_unresolved",
  "exports_map_unsupported",
  "reexport_depth_exceeded",
  "overload_ambiguous",
  "out_of_scope",
  "parse_error",
  "unsupported_syntax",
  "unknown_receiver",
  "computed_member",
  "eval_scope",
  "dynamic_scope",
  "prototype_mutation",
  "callback_parameter",
  "deferred_invocation",
  "mixed_module_system",
  "index_stale",
  "too_deep",
  "generated_source",
  "unsupported_language",
  "budget_exceeded",
  "cancelled",
  "adapter_error",
  "internal_error",
  "mock_data"
]);
var REASON_CODE_DESCRIPTIONS = Object.freeze({
  dynamic_dispatch: "The target depends on a value that is only known at runtime.",
  function_pointer: "The call goes through a function pointer, callback, or bound method.",
  missing_compile_db: "No compile database or include configuration was available.",
  missing_system_headers: "System headers were not available, so some declarations could not be resolved.",
  toolchain_version_mismatch: "The installed toolchain is outside the supported version range.",
  template_dependent: "The target depends on a template parameter that is not known here.",
  unsupported_construct: "The construct is outside the supported analysis boundaries.",
  header_without_tu: "No translation unit includes this header, so it was analyzed syntactically.",
  macro_expansion: "The fact comes from macro-expanded code, not user-written source.",
  unknown_import_target: "The imported module could not be resolved inside the scope.",
  external_package: "The target is in an external package and is not analyzed in this phase.",
  path_alias_unresolved: "A bundler or tsconfig path alias could not be resolved.",
  exports_map_unsupported: "The package exports map is unsupported or could not be resolved.",
  reexport_depth_exceeded: "The re-export chain exceeded the configured depth budget.",
  overload_ambiguous: "More than one declaration matches and the adapter cannot choose.",
  out_of_scope: "The target is real but outside the analysed scope.",
  parse_error: "The source could not be parsed completely.",
  unsupported_syntax: "The file uses syntax this adapter does not support.",
  unknown_receiver: "The receiver of the member call has no statically known shape.",
  computed_member: "The member name is computed and cannot be resolved statically.",
  eval_scope: "An eval or Function constructor makes the surrounding scope dynamic.",
  dynamic_scope: "A with statement makes the surrounding scope dynamic.",
  prototype_mutation: "A prototype was mutated, so the target set is uncertain.",
  callback_parameter: "The call goes through a callback parameter rather than a direct call.",
  deferred_invocation: "The call is scheduled for later by a timer or event loop.",
  mixed_module_system: "The file mixes ESM and CommonJS semantics.",
  index_stale: "The fact was produced by an older analysis and may no longer hold.",
  too_deep: "The adapter stopped following references at its depth budget.",
  generated_source: "The file is generated output and is excluded by policy.",
  unsupported_language: "No adapter in this build understands the language.",
  budget_exceeded: "The analysis stopped because a time, memory, or size budget was reached.",
  cancelled: "The user or host cancelled the analysis.",
  adapter_error: "The adapter failed while analysing; output may be incomplete.",
  internal_error: "CodeFlow hit an internal error while building this result.",
  mock_data: "This fact comes from the demonstration fixture, not real code."
});
var COMPLETENESS_LEVELS = Object.freeze(["full", "partial", "syntactic_only"]);
var DIAGNOSTIC_SEVERITIES = Object.freeze(["info", "warning", "error"]);
var VISIBILITIES = Object.freeze([
  "public",
  "protected",
  "private",
  "internal",
  "package",
  "local",
  "unknown"
]);
var CONTROL_CONSTRUCT_KINDS = Object.freeze([
  "entry",
  "exit",
  "sequence",
  "block",
  "if",
  "else",
  "switch",
  "case",
  "loop",
  "for",
  "while",
  "do_while",
  "try",
  "catch",
  "finally",
  "return",
  "throw",
  "break",
  "continue",
  "await",
  "yield",
  "jump",
  "unknown"
]);
var DATA_FACT_KINDS = Object.freeze([
  "definition",
  "use",
  "assignment",
  "read",
  "write",
  "parameter",
  "return",
  "capture"
]);
var EVIDENCE_KINDS = Object.freeze([
  "source_range",
  "symbol",
  "relationship",
  "diagnostic",
  "macro_expansion",
  "import",
  "heuristic"
]);
var CAPABILITY_KEYS = Object.freeze([
  "parse",
  "discoverDeclarations",
  "resolveSymbols",
  "resolveTypes",
  "resolveCalls",
  "generateCFG",
  "generateDFG",
  "resolveImports",
  "mapSourceLocations",
  "reportDiagnostics"
]);

// src/core/csr/limits.js
var CSR_LIMITS = Object.freeze({
  maxFiles: 5e3,
  maxSymbols: 2e5,
  maxRelationships: 5e5,
  maxConstructs: 2e5,
  maxDataFacts: 5e5,
  maxDiagnostics: 1e4,
  maxEvidencePerRelationship: 32,
  maxAffectsPerDiagnostic: 64,
  maxStringLength: 4096,
  maxPathLength: 1024,
  maxNameLength: 512,
  maxMessageLength: 2e3,
  maxExtensionsKeys: 128,
  maxSerializedBytes: 8e6
});
function checkArray(value, max, path4, label, issues) {
  if (Array.isArray(value) && value.length > max) {
    issues.push({
      path: path4,
      code: "E_LIMIT",
      message: `${label} has ${value.length} entries; the limit is ${max}.`
    });
  }
}
function checkString(value, max, path4, label, issues) {
  if (typeof value === "string" && value.length > max) {
    issues.push({
      path: path4,
      code: "E_LIMIT",
      message: `${label} is ${value.length} code units; the limit is ${max}.`
    });
  }
}
function enforceLimits(run) {
  const issues = [];
  if (typeof run !== "object" || run === null || Array.isArray(run)) {
    return { ok: true };
  }
  const candidate = (
    /** @type {Record<string, unknown>} */
    run
  );
  checkArray(candidate.files, CSR_LIMITS.maxFiles, "files", "files", issues);
  checkArray(candidate.symbols, CSR_LIMITS.maxSymbols, "symbols", "symbols", issues);
  checkArray(
    candidate.relationships,
    CSR_LIMITS.maxRelationships,
    "relationships",
    "relationships",
    issues
  );
  checkArray(
    candidate.controlConstructs,
    CSR_LIMITS.maxConstructs,
    "controlConstructs",
    "controlConstructs",
    issues
  );
  checkArray(candidate.dataFacts, CSR_LIMITS.maxDataFacts, "dataFacts", "dataFacts", issues);
  checkArray(
    candidate.diagnostics,
    CSR_LIMITS.maxDiagnostics,
    "diagnostics",
    "diagnostics",
    issues
  );
  checkString(candidate.runId, CSR_LIMITS.maxStringLength, "runId", "runId", issues);
  checkString(candidate.adapterId, CSR_LIMITS.maxStringLength, "adapterId", "adapterId", issues);
  checkString(candidate.language, CSR_LIMITS.maxStringLength, "language", "language", issues);
  if (Array.isArray(candidate.files)) {
    candidate.files.forEach((file, index) => {
      if (typeof file !== "object" || file === null) {
        return;
      }
      const record = (
        /** @type {Record<string, unknown>} */
        file
      );
      checkString(record.path, CSR_LIMITS.maxPathLength, `files[${index}].path`, "path", issues);
      checkString(
        record.contentHash,
        CSR_LIMITS.maxStringLength,
        `files[${index}].contentHash`,
        "contentHash",
        issues
      );
    });
  }
  if (Array.isArray(candidate.symbols)) {
    candidate.symbols.forEach((symbol2, index) => {
      if (typeof symbol2 !== "object" || symbol2 === null) {
        return;
      }
      const record = (
        /** @type {Record<string, unknown>} */
        symbol2
      );
      checkString(record.name, CSR_LIMITS.maxNameLength, `symbols[${index}].name`, "name", issues);
      checkString(
        record.qualifiedName,
        CSR_LIMITS.maxNameLength,
        `symbols[${index}].qualifiedName`,
        "qualifiedName",
        issues
      );
      checkString(
        record.signature,
        CSR_LIMITS.maxStringLength,
        `symbols[${index}].signature`,
        "signature",
        issues
      );
    });
  }
  if (Array.isArray(candidate.relationships)) {
    candidate.relationships.forEach((relationship2, index) => {
      if (typeof relationship2 !== "object" || relationship2 === null) {
        return;
      }
      const record = (
        /** @type {Record<string, unknown>} */
        relationship2
      );
      checkArray(
        record.evidence,
        CSR_LIMITS.maxEvidencePerRelationship,
        `relationships[${index}].evidence`,
        "evidence",
        issues
      );
    });
  }
  if (Array.isArray(candidate.diagnostics)) {
    candidate.diagnostics.forEach((diagnostic, index) => {
      if (typeof diagnostic !== "object" || diagnostic === null) {
        return;
      }
      const record = (
        /** @type {Record<string, unknown>} */
        diagnostic
      );
      checkString(
        record.message,
        CSR_LIMITS.maxMessageLength,
        `diagnostics[${index}].message`,
        "message",
        issues
      );
      checkArray(
        record.affects,
        CSR_LIMITS.maxAffectsPerDiagnostic,
        `diagnostics[${index}].affects`,
        "affects",
        issues
      );
    });
  }
  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}

// src/core/csr/reasons.js
var CODE_SET = new Set(REASON_CODES);
function isReasonCode(value) {
  return typeof value === "string" && CODE_SET.has(value);
}
var FAILURE_REASON_CODES = Object.freeze([
  "adapter_error",
  "cancelled",
  "budget_exceeded",
  "internal_error",
  "parse_error"
]);

// src/core/csr/provenance.js
function rangeShapeIssues(range) {
  if (typeof range !== "object" || range === null || Array.isArray(range)) {
    return ["must be an object."];
  }
  const record = (
    /** @type {Record<string, unknown>} */
    range
  );
  const issues = [];
  if (typeof record.fileId !== "string" || record.fileId.length === 0) {
    issues.push("fileId must be a non-empty string.");
  }
  for (const field of ["startLine", "startColumn", "endLine", "endColumn"]) {
    if (!Number.isInteger(record[field]) || Number(record[field]) < 0) {
      issues.push(`${field} must be a non-negative integer.`);
    }
  }
  if (Number.isInteger(record.startLine) && Number.isInteger(record.endLine) && Number(record.endLine) < Number(record.startLine)) {
    issues.push("endLine must be >= startLine.");
  }
  if (Number.isInteger(record.startLine) && Number.isInteger(record.endLine) && Number(record.startLine) === Number(record.endLine) && Number.isInteger(record.startColumn) && Number.isInteger(record.endColumn) && Number(record.endColumn) < Number(record.startColumn)) {
    issues.push("endColumn must be >= startColumn on a single line.");
  }
  return issues;
}

// src/core/csr/validate.js
function validateAnalysisRun(run, options = {}) {
  const mode = options.mode === "defensive" ? "defensive" : "strict";
  const defensive = mode === "defensive";
  const issues = [];
  const dropped = [];
  if (!isPlainObject(run)) {
    return {
      ok: false,
      issues: [{ path: "$", message: "Analysis run must be an object.", code: "E_VALIDATION" }],
      dropped
    };
  }
  const candidate = (
    /** @type {Record<string, unknown>} */
    run
  );
  for (const field of ["runId", "adapterId", "adapterVersion", "language"]) {
    if (typeof candidate[field] !== "string" || candidate[field].length === 0) {
      issues.push({
        path: field,
        message: `${field} must be a non-empty string.`,
        code: "E_VALIDATION"
      });
    }
  }
  if (options.expectedAdapterId && candidate.adapterId !== options.expectedAdapterId) {
    issues.push({
      path: "adapterId",
      message: `adapterId must be "${options.expectedAdapterId}", received "${String(
        candidate.adapterId
      )}".`,
      code: "E_VALIDATION"
    });
  }
  if (!isCompatibleCsrVersion(candidate.csrVersion)) {
    issues.push({
      path: "csrVersion",
      message: `Unsupported csrVersion "${String(
        candidate.csrVersion
      )}"; this build supports major ${CSR_VERSION.split(".")[0]}.`,
      code: "E_VALIDATION"
    });
  }
  if (!COMPLETENESS_LEVELS.includes(String(candidate.completeness))) {
    issues.push({
      path: "completeness",
      message: `completeness must be one of ${COMPLETENESS_LEVELS.join(", ")}.`,
      code: "E_VALIDATION"
    });
  }
  validateScope(candidate.scope, issues);
  for (const collection of [
    "files",
    "symbols",
    "relationships",
    "controlConstructs",
    "dataFacts",
    "diagnostics"
  ]) {
    if (candidate[collection] !== void 0 && !Array.isArray(candidate[collection])) {
      issues.push({
        path: collection,
        message: `${collection} must be an array.`,
        code: "E_VALIDATION"
      });
    }
  }
  if (issues.length > 0) {
    return { ok: false, issues, dropped };
  }
  const limits = enforceLimits(candidate);
  if (!limits.ok) {
    return {
      ok: false,
      issues: limits.issues.map((issue) => ({ ...issue, code: "E_LIMIT" })),
      dropped
    };
  }
  const completeness = (
    /** @type {import('./entities.js').AnalysisRun['completeness']} */
    candidate.completeness
  );
  const files = [];
  const fileById = /* @__PURE__ */ new Map();
  for (const [index, entry] of arrayOf(candidate.files).entries()) {
    const path4 = `files[${index}]`;
    const local = [];
    validateFile(entry, path4, local);
    const id = isPlainObject(entry) ? (
      /** @type {Record<string, unknown>} */
      entry.fileId
    ) : "";
    if (typeof id === "string" && fileById.has(id)) {
      local.push({ path: `${path4}.fileId`, message: `Duplicate fileId "${id}".` });
    }
    if (local.length === 0) {
      const record = (
        /** @type {Record<string, unknown>} */
        entry
      );
      files.push(record);
      fileById.set(String(record.fileId), record);
    } else {
      collect(mode, issues, dropped, "files", path4, id, local);
    }
  }
  const symbols = [];
  const symbolById = /* @__PURE__ */ new Map();
  const identityOwner = /* @__PURE__ */ new Map();
  for (const [index, entry] of arrayOf(candidate.symbols).entries()) {
    const path4 = `symbols[${index}]`;
    const local = [];
    validateSymbol(entry, path4, fileById, local);
    const record = isPlainObject(entry) ? (
      /** @type {Record<string, unknown>} */
      entry
    ) : {};
    const id = typeof record.symbolId === "string" ? record.symbolId : "";
    if (id && symbolById.has(id)) {
      local.push({ path: `${path4}.symbolId`, message: `Duplicate symbolId "${id}".` });
    }
    const identityKey = symbolIdentityKey(record);
    if (identityKey && identityOwner.has(identityKey)) {
      local.push({
        path: `${path4}.qualifiedName`,
        message: `Duplicate symbol identity (file, kind, qualifiedName, disambiguator) shared with "${identityOwner.get(
          identityKey
        )}".`
      });
    }
    if (local.length === 0) {
      symbols.push(record);
      symbolById.set(String(record.symbolId), record);
      if (identityKey) {
        identityOwner.set(identityKey, String(record.symbolId));
      }
    } else {
      collect(mode, issues, dropped, "symbols", path4, id, local);
    }
  }
  const parentIssues = validateParents(symbols, symbolById);
  if (parentIssues.length > 0) {
    if (defensive) {
      const doomed = new Set(parentIssues.map((entry) => entry.id));
      let changed = true;
      while (changed) {
        changed = false;
        for (const symbol2 of symbols) {
          if (!doomed.has(String(symbol2.symbolId)) && typeof symbol2.parentId === "string" && doomed.has(symbol2.parentId)) {
            doomed.add(String(symbol2.symbolId));
            changed = true;
          }
        }
      }
      const indexById = new Map(symbols.map((symbol2, index) => [String(symbol2.symbolId), index]));
      for (const entry of parentIssues) {
        dropped.push({
          collection: "symbols",
          path: `symbols[${indexById.get(entry.id) ?? 0}]`,
          id: entry.id,
          issues: [entry.issue]
        });
        issues.push({ ...entry.issue, dropped: true });
      }
      for (let index = symbols.length - 1; index >= 0; index -= 1) {
        if (doomed.has(String(symbols[index].symbolId))) {
          symbolById.delete(String(symbols[index].symbolId));
          symbols.splice(index, 1);
        }
      }
    } else {
      for (const entry of parentIssues) {
        issues.push(entry.issue);
      }
    }
  }
  const relationships2 = [];
  const relationshipIds = /* @__PURE__ */ new Set();
  for (const [index, entry] of arrayOf(candidate.relationships).entries()) {
    const path4 = `relationships[${index}]`;
    const local = [];
    validateRelationship(entry, path4, fileById, symbolById, local);
    const record = isPlainObject(entry) ? (
      /** @type {Record<string, unknown>} */
      entry
    ) : {};
    const id = typeof record.relationshipId === "string" ? record.relationshipId : "";
    if (id && relationshipIds.has(id)) {
      local.push({ path: `${path4}.relationshipId`, message: `Duplicate relationshipId "${id}".` });
    }
    if (local.length === 0) {
      relationships2.push(record);
      relationshipIds.add(String(record.relationshipId));
    } else {
      collect(mode, issues, dropped, "relationships", path4, id, local);
    }
  }
  const constructs = [];
  const constructById = /* @__PURE__ */ new Map();
  for (const [index, entry] of arrayOf(candidate.controlConstructs).entries()) {
    const path4 = `controlConstructs[${index}]`;
    const local = [];
    validateConstruct(entry, path4, fileById, symbolById, local);
    const record = isPlainObject(entry) ? (
      /** @type {Record<string, unknown>} */
      entry
    ) : {};
    const id = typeof record.constructId === "string" ? record.constructId : "";
    if (id && constructById.has(id)) {
      local.push({ path: `${path4}.constructId`, message: `Duplicate constructId "${id}".` });
    }
    if (local.length === 0) {
      constructs.push(record);
      constructById.set(String(record.constructId), record);
    } else {
      collect(mode, issues, dropped, "controlConstructs", path4, id, local);
    }
  }
  const constructLinks = validateConstructLinks(constructs, constructById);
  let survivingConstructs = constructs;
  if (constructLinks.length > 0) {
    if (defensive) {
      const doomed = new Set(constructLinks.map((entry) => entry.id));
      let changed = true;
      while (changed) {
        changed = false;
        for (const construct of constructs) {
          const id = String(construct.constructId);
          if (doomed.has(id)) {
            continue;
          }
          const parentId = typeof construct.parentId === "string" ? construct.parentId : "";
          const children = Array.isArray(construct.children) ? construct.children.map(String) : [];
          if (doomed.has(parentId) || children.some((child) => doomed.has(child))) {
            doomed.add(id);
            changed = true;
          }
        }
      }
      for (const entry of constructLinks) {
        dropped.push({
          collection: "controlConstructs",
          path: "controlConstructs",
          id: entry.id,
          issues: [entry.issue]
        });
        issues.push({ ...entry.issue, dropped: true });
      }
      survivingConstructs = constructs.filter(
        (construct) => !doomed.has(String(construct.constructId))
      );
    } else {
      for (const entry of constructLinks) {
        issues.push(entry.issue);
      }
    }
  }
  const dataFacts = [];
  const factIds = /* @__PURE__ */ new Set();
  for (const [index, entry] of arrayOf(candidate.dataFacts).entries()) {
    const path4 = `dataFacts[${index}]`;
    const local = [];
    validateDataFact(entry, path4, fileById, symbolById, local);
    const record = isPlainObject(entry) ? (
      /** @type {Record<string, unknown>} */
      entry
    ) : {};
    const id = typeof record.factId === "string" ? record.factId : "";
    if (id && factIds.has(id)) {
      local.push({ path: `${path4}.factId`, message: `Duplicate factId "${id}".` });
    }
    if (local.length === 0) {
      dataFacts.push(record);
      factIds.add(String(record.factId));
    } else {
      collect(mode, issues, dropped, "dataFacts", path4, id, local);
    }
  }
  const diagnostics = [];
  const knownIds = /* @__PURE__ */ new Set([
    ...fileById.keys(),
    ...symbolById.keys(),
    ...relationshipIds,
    ...constructById.keys(),
    ...factIds
  ]);
  for (const [index, entry] of arrayOf(candidate.diagnostics).entries()) {
    const path4 = `diagnostics[${index}]`;
    const local = [];
    validateDiagnostic(entry, path4, fileById, knownIds, local);
    if (local.length === 0) {
      diagnostics.push(
        /** @type {Record<string, unknown>} */
        entry
      );
    } else {
      collect(mode, issues, dropped, "diagnostics", path4, "", local);
    }
  }
  if (issues.length > 0 && !defensive) {
    return { ok: false, issues, dropped };
  }
  let finalCompleteness = completeness;
  if (dropped.length > 0 && finalCompleteness === "full") {
    finalCompleteness = "partial";
  }
  for (const entry of dropped) {
    diagnostics.push({
      severity: "warning",
      code: "csr_record_dropped",
      message: `Dropped ${entry.path}${entry.id ? ` (${entry.id})` : ""}: ${entry.issues[0]?.message ?? "invalid record"}`,
      affects: entry.id ? [entry.id] : []
    });
  }
  const normalized = normalizeRun({
    candidate,
    completeness: finalCompleteness,
    files,
    symbols,
    relationships: relationships2,
    controlConstructs: survivingConstructs,
    dataFacts,
    diagnostics
  });
  if (isNewerMinor(candidate.csrVersion)) {
    normalized.diagnostics.push({
      severity: "info",
      code: "csr_newer_minor",
      message: `The adapter emitted CSR ${String(
        candidate.csrVersion
      )}; this build reads it as ${CSR_VERSION} and ignores newer fields.`,
      affects: []
    });
  }
  return { ok: true, run: normalized, issues, dropped };
}
function collect(mode, issues, dropped, collection, path4, id, local) {
  if (mode === "strict") {
    issues.push(...local);
    return;
  }
  dropped.push({
    collection,
    path: path4,
    id: typeof id === "string" && id.length > 0 ? id : void 0,
    issues: local
  });
  issues.push(...local.map((issue) => ({ ...issue, dropped: true })));
}
function arrayOf(value) {
  return Array.isArray(value) ? value : [];
}
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function validateScope(scope, issues) {
  if (scope === void 0) {
    return;
  }
  if (!isPlainObject(scope)) {
    issues.push({ path: "scope", message: "scope must be an object." });
    return;
  }
  if (scope.kind !== "file" && scope.kind !== "workspace") {
    issues.push({ path: "scope.kind", message: 'scope.kind must be "file" or "workspace".' });
  }
  if (scope.path !== void 0 && typeof scope.path !== "string") {
    issues.push({ path: "scope.path", message: "scope.path must be a string when present." });
  }
}
function validateFile(entry, path4, issues) {
  if (!isPlainObject(entry)) {
    issues.push({ path: path4, message: "File record must be an object." });
    return;
  }
  const record = (
    /** @type {Record<string, unknown>} */
    entry
  );
  requireString(record.fileId, `${path4}.fileId`, "fileId", issues);
  if (typeof record.fileId === "string" && !record.fileId.startsWith("file:")) {
    issues.push({ path: `${path4}.fileId`, message: 'fileId must start with "file:".' });
  }
  const pathIssues = workspacePathIssues(record.path);
  for (const message of pathIssues) {
    issues.push({ path: `${path4}.path`, message });
  }
  requireString(record.language, `${path4}.language`, "language", issues);
  requireString(record.contentHash, `${path4}.contentHash`, "contentHash", issues);
  if (!Number.isInteger(record.sizeBytes) || Number(record.sizeBytes) < 0) {
    issues.push({
      path: `${path4}.sizeBytes`,
      message: "sizeBytes must be a non-negative integer."
    });
  }
  if (!Number.isInteger(record.lineCount) || Number(record.lineCount) < 1) {
    issues.push({ path: `${path4}.lineCount`, message: "lineCount must be a positive integer." });
  }
  if (record.generated !== void 0 && typeof record.generated !== "boolean") {
    issues.push({
      path: `${path4}.generated`,
      message: "generated must be a boolean when present."
    });
  }
  if (record.extensions !== void 0 && !isPlainObject(record.extensions)) {
    issues.push({
      path: `${path4}.extensions`,
      message: "extensions must be an object when present."
    });
  }
}
function validateSymbol(entry, path4, fileById, issues) {
  if (!isPlainObject(entry)) {
    issues.push({ path: path4, message: "Symbol must be an object." });
    return;
  }
  const record = (
    /** @type {Record<string, unknown>} */
    entry
  );
  requireString(record.symbolId, `${path4}.symbolId`, "symbolId", issues);
  if (typeof record.symbolId === "string" && !record.symbolId.startsWith("symbol:")) {
    issues.push({ path: `${path4}.symbolId`, message: 'symbolId must start with "symbol:".' });
  }
  if (!SYMBOL_KINDS.includes(String(record.kind))) {
    issues.push({
      path: `${path4}.kind`,
      message: `Unknown symbol kind "${String(record.kind)}"; expected one of ${SYMBOL_KINDS.join(
        ", "
      )}.`
    });
  }
  if (typeof record.name !== "string") {
    issues.push({ path: `${path4}.name`, message: "name must be a string." });
  }
  requireString(record.qualifiedName, `${path4}.qualifiedName`, "qualifiedName", issues);
  requireString(record.language, `${path4}.language`, "language", issues);
  if (record.declaration === void 0) {
    issues.push({ path: `${path4}.declaration`, message: "declaration range is required." });
  } else {
    validateRange(record.declaration, `${path4}.declaration`, fileById, issues);
  }
  if (record.signature !== void 0 && typeof record.signature !== "string") {
    issues.push({ path: `${path4}.signature`, message: "signature must be a string when present." });
  }
  if (record.parentId !== void 0 && typeof record.parentId !== "string") {
    issues.push({ path: `${path4}.parentId`, message: "parentId must be a string when present." });
  }
  if (record.visibility !== void 0 && !VISIBILITIES.includes(String(record.visibility))) {
    issues.push({
      path: `${path4}.visibility`,
      message: `visibility must be one of ${VISIBILITIES.join(", ")}.`
    });
  }
  if (record.disambiguator !== void 0) {
    if (typeof record.disambiguator !== "string" || !/^[A-Za-z0-9_.+~-]+$/.test(record.disambiguator)) {
      issues.push({
        path: `${path4}.disambiguator`,
        message: 'disambiguator must be a stable token of A-Z, a-z, 0-9, "_", ".", "+", "~" or "-".'
      });
    }
  }
  if (record.extensions !== void 0 && !isPlainObject(record.extensions)) {
    issues.push({
      path: `${path4}.extensions`,
      message: "extensions must be an object when present."
    });
  }
}
function symbolIdentityKey(record) {
  if (typeof record.kind !== "string" || typeof record.qualifiedName !== "string") {
    return "";
  }
  const declaration = isPlainObject(record.declaration) ? record.declaration : {};
  const fileId = typeof declaration.fileId === "string" ? declaration.fileId : "";
  if (!fileId) {
    return "";
  }
  return [
    fileId,
    record.kind,
    record.qualifiedName,
    typeof record.disambiguator === "string" ? record.disambiguator : ""
  ].join("|");
}
function validateParents(symbols, symbolById) {
  const problems = [];
  for (const [index, symbol2] of symbols.entries()) {
    const parentId = symbol2.parentId;
    if (typeof parentId === "string" && parentId.length > 0 && !symbolById.has(parentId)) {
      problems.push({
        id: String(symbol2.symbolId),
        issue: {
          path: `symbols[${index}].parentId`,
          message: `parentId "${parentId}" is not a declared symbol.`
        }
      });
    }
  }
  const state = /* @__PURE__ */ new Map();
  function visit(id, trail) {
    if (state.get(id) === "done") {
      return null;
    }
    if (state.get(id) === "visiting") {
      return id;
    }
    state.set(id, "visiting");
    const symbol2 = symbolById.get(id);
    const parentId = symbol2 && typeof symbol2.parentId === "string" ? symbol2.parentId : "";
    if (parentId && symbolById.has(parentId)) {
      const cycle = visit(parentId, [...trail, id]);
      if (cycle) {
        return cycle;
      }
    }
    state.set(id, "done");
    return null;
  }
  for (const symbol2 of symbols) {
    const id = String(symbol2.symbolId);
    const cycle = visit(id, []);
    if (cycle) {
      const index = symbols.indexOf(symbol2);
      problems.push({
        id,
        issue: {
          path: `symbols[${index}].parentId`,
          message: `Cyclic parentId chain detected at "${cycle}".`
        }
      });
      break;
    }
  }
  return problems;
}
function validateRelationship(entry, path4, fileById, symbolById, issues) {
  if (!isPlainObject(entry)) {
    issues.push({ path: path4, message: "Relationship must be an object." });
    return;
  }
  const record = (
    /** @type {Record<string, unknown>} */
    entry
  );
  requireString(record.relationshipId, `${path4}.relationshipId`, "relationshipId", issues);
  if (!RELATIONSHIP_TYPES.includes(String(record.type))) {
    issues.push({
      path: `${path4}.type`,
      message: `Unknown relationship type "${String(
        record.type
      )}"; expected one of ${RELATIONSHIP_TYPES.join(", ")}.`
    });
  }
  const status = String(record.status);
  if (!RESOLUTION_STATUSES.includes(status)) {
    issues.push({
      path: `${path4}.status`,
      message: `status must be one of ${RESOLUTION_STATUSES.join(", ")}.`
    });
  } else if (status !== "resolved") {
    if (typeof record.reasonCode !== "string" || record.reasonCode.length === 0) {
      issues.push({
        path: `${path4}.reasonCode`,
        message: `A "${status}" relationship must carry a reasonCode.`
      });
    } else if (!isReasonCode(record.reasonCode)) {
      issues.push({
        path: `${path4}.reasonCode`,
        message: `Unknown reasonCode "${record.reasonCode}".`
      });
    }
  } else if (record.reasonCode !== void 0 && !isReasonCode(record.reasonCode)) {
    issues.push({
      path: `${path4}.reasonCode`,
      message: `Unknown reasonCode "${String(record.reasonCode)}".`
    });
  }
  const from = record.from;
  if (typeof from !== "string" || from.length === 0) {
    issues.push({ path: `${path4}.from`, message: "from must be a symbolId." });
  } else if (!symbolById.has(from)) {
    issues.push({ path: `${path4}.from`, message: `Unknown source symbol "${from}".` });
  }
  const to = record.to;
  if (typeof to !== "string" || to.length === 0) {
    issues.push({ path: `${path4}.to`, message: "to must be a symbolId or external target id." });
  } else if (status === "resolved" && !symbolById.has(to)) {
    issues.push({
      path: `${path4}.to`,
      message: `A resolved relationship must target a declared symbol; "${to}" is unknown.`
    });
  }
  if (record.site !== void 0) {
    validateRange(record.site, `${path4}.site`, fileById, issues);
  }
  if (record.evidence !== void 0) {
    if (!Array.isArray(record.evidence)) {
      issues.push({ path: `${path4}.evidence`, message: "evidence must be an array when present." });
    } else {
      record.evidence.forEach((evidence, index) => {
        const evidencePath = `${path4}.evidence[${index}]`;
        if (!isPlainObject(evidence)) {
          issues.push({ path: evidencePath, message: "Evidence must be an object." });
          return;
        }
        if (!EVIDENCE_KINDS.includes(String(evidence.kind))) {
          issues.push({
            path: `${evidencePath}.kind`,
            message: `Unknown evidence kind "${String(evidence.kind)}".`
          });
        }
        if (evidence.range !== void 0) {
          validateRange(evidence.range, `${evidencePath}.range`, fileById, issues);
        }
        for (const field of ["symbolId", "relationshipId", "diagnosticCode", "note"]) {
          if (evidence[field] !== void 0 && typeof evidence[field] !== "string") {
            issues.push({
              path: `${evidencePath}.${field}`,
              message: `${field} must be a string when present.`
            });
          }
        }
      });
    }
  }
  if (record.extensions !== void 0 && !isPlainObject(record.extensions)) {
    issues.push({
      path: `${path4}.extensions`,
      message: "extensions must be an object when present."
    });
  }
}
function validateConstruct(entry, path4, fileById, symbolById, issues) {
  if (!isPlainObject(entry)) {
    issues.push({ path: path4, message: "Control construct must be an object." });
    return;
  }
  const record = (
    /** @type {Record<string, unknown>} */
    entry
  );
  requireString(record.constructId, `${path4}.constructId`, "constructId", issues);
  if (!CONTROL_CONSTRUCT_KINDS.includes(String(record.kind))) {
    issues.push({
      path: `${path4}.kind`,
      message: `Unknown control construct kind "${String(record.kind)}".`
    });
  }
  if (record.parentId !== void 0 && typeof record.parentId !== "string") {
    issues.push({ path: `${path4}.parentId`, message: "parentId must be a string when present." });
  }
  if (!Array.isArray(record.children)) {
    issues.push({ path: `${path4}.children`, message: "children must be an array." });
  } else {
    record.children.forEach((child, index) => {
      if (typeof child !== "string") {
        issues.push({
          path: `${path4}.children[${index}]`,
          message: "child construct ids must be strings."
        });
      }
    });
  }
  if (record.symbolId !== void 0) {
    if (typeof record.symbolId !== "string" || !symbolById.has(record.symbolId)) {
      issues.push({
        path: `${path4}.symbolId`,
        message: `symbolId "${String(record.symbolId)}" is not a declared symbol.`
      });
    }
  }
  if (record.condition !== void 0) {
    validateRange(record.condition, `${path4}.condition`, fileById, issues);
  }
  validateRange(record.sourceRange, `${path4}.sourceRange`, fileById, issues);
}
function validateConstructLinks(constructs, constructById) {
  const problems = [];
  for (const [index, construct] of constructs.entries()) {
    const id = String(construct.constructId);
    if (typeof construct.parentId === "string" && !constructById.has(construct.parentId)) {
      problems.push({
        id,
        issue: {
          path: `controlConstructs[${index}].parentId`,
          message: `parentId "${construct.parentId}" is not a declared construct.`
        }
      });
    }
    if (Array.isArray(construct.children)) {
      for (const child of construct.children) {
        if (!constructById.has(child)) {
          problems.push({
            id,
            issue: {
              path: `controlConstructs[${index}].children`,
              message: `child "${String(child)}" is not a declared construct.`
            }
          });
        }
      }
    }
  }
  const state = /* @__PURE__ */ new Map();
  function hasCycle(id) {
    if (state.get(id) === "done") {
      return false;
    }
    if (state.get(id) === "visiting") {
      return true;
    }
    state.set(id, "visiting");
    const construct = constructById.get(id);
    const children = construct && Array.isArray(construct.children) ? construct.children : [];
    for (const child of children) {
      if (constructById.has(child) && hasCycle(child)) {
        return true;
      }
    }
    state.set(id, "done");
    return false;
  }
  for (const construct of constructs) {
    const id = String(construct.constructId);
    if (hasCycle(id)) {
      problems.push({
        id,
        issue: {
          path: "controlConstructs",
          message: `Cyclic children chain detected at "${id}".`
        }
      });
      break;
    }
  }
  return problems;
}
function validateDataFact(entry, path4, fileById, symbolById, issues) {
  if (!isPlainObject(entry)) {
    issues.push({ path: path4, message: "Data fact must be an object." });
    return;
  }
  const record = (
    /** @type {Record<string, unknown>} */
    entry
  );
  requireString(record.factId, `${path4}.factId`, "factId", issues);
  if (!DATA_FACT_KINDS.includes(String(record.kind))) {
    issues.push({
      path: `${path4}.kind`,
      message: `Unknown data fact kind "${String(record.kind)}".`
    });
  }
  if (typeof record.symbolId !== "string" || !symbolById.has(record.symbolId)) {
    issues.push({
      path: `${path4}.symbolId`,
      message: `symbolId "${String(record.symbolId)}" is not a declared symbol.`
    });
  }
  validateRange(record.at, `${path4}.at`, fileById, issues);
  if (record.relatedSymbolId !== void 0) {
    if (typeof record.relatedSymbolId !== "string" || !symbolById.has(record.relatedSymbolId)) {
      issues.push({
        path: `${path4}.relatedSymbolId`,
        message: `relatedSymbolId "${String(record.relatedSymbolId)}" is not a declared symbol.`
      });
    }
  }
  const status = String(record.status);
  if (!RESOLUTION_STATUSES.includes(status)) {
    issues.push({
      path: `${path4}.status`,
      message: `status must be one of ${RESOLUTION_STATUSES.join(", ")}.`
    });
  } else if (status !== "resolved") {
    if (typeof record.reasonCode !== "string" || !isReasonCode(record.reasonCode)) {
      issues.push({
        path: `${path4}.reasonCode`,
        message: `A "${status}" data fact must carry a known reasonCode.`
      });
    }
  }
}
function validateDiagnostic(entry, path4, fileById, knownIds, issues) {
  if (!isPlainObject(entry)) {
    issues.push({ path: path4, message: "Diagnostic must be an object." });
    return;
  }
  const record = (
    /** @type {Record<string, unknown>} */
    entry
  );
  if (!DIAGNOSTIC_SEVERITIES.includes(String(record.severity))) {
    issues.push({
      path: `${path4}.severity`,
      message: `severity must be one of ${DIAGNOSTIC_SEVERITIES.join(", ")}.`
    });
  }
  requireString(record.code, `${path4}.code`, "code", issues);
  requireString(record.message, `${path4}.message`, "message", issues);
  if (record.sourceRange !== void 0) {
    validateRange(record.sourceRange, `${path4}.sourceRange`, fileById, issues);
  }
  if (record.affects !== void 0) {
    if (!Array.isArray(record.affects)) {
      issues.push({ path: `${path4}.affects`, message: "affects must be an array." });
    } else {
      record.affects.forEach((id, index) => {
        if (typeof id !== "string") {
          issues.push({
            path: `${path4}.affects[${index}]`,
            message: "affects entries must be strings."
          });
        } else if ((id.startsWith("symbol:") || id.startsWith("rel:") || id.startsWith("file:")) && !knownIds.has(id)) {
          issues.push({
            path: `${path4}.affects[${index}]`,
            message: `affects references unknown id "${id}".`
          });
        }
      });
    }
  }
}
function validateRange(range, path4, fileById, issues) {
  const shapeIssues = rangeShapeIssues(range);
  const fields = ["fileId", "startLine", "startColumn", "endLine", "endColumn"];
  for (const message of shapeIssues) {
    const field = fields.find((candidate) => message.startsWith(candidate));
    issues.push({ path: field ? `${path4}.${field}` : path4, message });
  }
  if (shapeIssues.length > 0 || !isPlainObject(range)) {
    return;
  }
  const record = (
    /** @type {Record<string, unknown>} */
    range
  );
  if (fileById) {
    if (!fileById.has(record.fileId)) {
      issues.push({
        path: `${path4}.fileId`,
        message: `Unknown fileId "${String(record.fileId)}".`
      });
    } else {
      const file = (
        /** @type {Record<string, unknown>} */
        fileById.get(record.fileId)
      );
      if (Number.isInteger(record.endLine) && Number(record.endLine) >= Number(file.lineCount)) {
        issues.push({
          path: `${path4}.endLine`,
          message: `endLine ${String(record.endLine)} exceeds lineCount ${String(file.lineCount)}.`
        });
      }
      if (Number.isInteger(record.startLine) && Number(record.startLine) >= Number(file.lineCount)) {
        issues.push({
          path: `${path4}.startLine`,
          message: `startLine ${String(
            record.startLine
          )} exceeds lineCount ${String(file.lineCount)}.`
        });
      }
    }
  }
  for (const field of ["startOffset", "endOffset"]) {
    if (record[field] !== void 0) {
      if (!Number.isInteger(record[field]) || Number(record[field]) < 0) {
        issues.push({
          path: `${path4}.${field}`,
          message: `${field} must be a non-negative integer.`
        });
      }
    }
  }
}
function requireString(value, path4, label, issues) {
  if (typeof value !== "string" || value.length === 0) {
    issues.push({ path: path4, message: `${label} must be a non-empty string.` });
  }
}
function workspacePathIssues(value) {
  if (typeof value !== "string" || value.length === 0) {
    return ["path must be a non-empty string."];
  }
  const issues = [];
  if (value.length > CSR_LIMITS.maxPathLength) {
    issues.push(`path exceeds ${CSR_LIMITS.maxPathLength} code units.`);
  }
  if (value.includes("\\")) {
    issues.push("path must use forward slashes.");
  }
  if (value.startsWith("/") || /^[A-Za-z]:/.test(value)) {
    issues.push("path must be workspace-relative, not absolute.");
  }
  const segments = value.split("/");
  if (segments.includes("..")) {
    issues.push('path must not contain ".." segments.');
  }
  if (segments.includes("")) {
    issues.push("path must not contain empty segments.");
  }
  if (containsControlCharacters(value)) {
    issues.push("path must not contain control characters.");
  }
  return issues;
}
function containsControlCharacters(value) {
  for (let index = 0; index < value.length; index += 1) {
    if (value.charCodeAt(index) < 32) {
      return true;
    }
  }
  return false;
}
function normalizeRun(input) {
  const candidate = input.candidate;
  const run = {
    runId: String(candidate.runId),
    adapterId: String(candidate.adapterId),
    adapterVersion: String(candidate.adapterVersion),
    language: String(candidate.language),
    csrVersion: String(candidate.csrVersion ?? CSR_VERSION),
    scope: normalizeScope(candidate.scope),
    completeness: input.completeness,
    files: input.files.map(normalizeFile),
    symbols: input.symbols.map(normalizeSymbol),
    relationships: input.relationships.map(normalizeRelationship),
    controlConstructs: input.controlConstructs.map(normalizeConstruct),
    dataFacts: input.dataFacts.map(normalizeDataFact),
    diagnostics: input.diagnostics.map(normalizeDiagnostic)
  };
  if (typeof candidate.startedAt === "string") {
    run.startedAt = candidate.startedAt;
  }
  if (Number.isFinite(candidate.durationMs)) {
    run.durationMs = Number(candidate.durationMs);
  }
  if (isPlainObject(candidate.extensions)) {
    run.extensions = cloneValue(candidate.extensions);
  }
  return run;
}
function normalizeScope(scope) {
  if (!isPlainObject(scope)) {
    return { kind: "workspace" };
  }
  const normalized = { kind: scope.kind === "file" ? "file" : "workspace" };
  if (typeof scope.path === "string" && scope.path.length > 0) {
    normalized.path = scope.path;
  }
  return normalized;
}
function normalizeFile(record) {
  const file = {
    fileId: String(record.fileId),
    path: String(record.path),
    language: String(record.language),
    contentHash: String(record.contentHash),
    sizeBytes: Number(record.sizeBytes),
    lineCount: Number(record.lineCount),
    generated: record.generated === true
  };
  if (isPlainObject(record.extensions)) {
    file.extensions = cloneValue(record.extensions);
  }
  return file;
}
function normalizeSymbol(record) {
  const symbol2 = {
    symbolId: String(record.symbolId),
    kind: String(record.kind),
    name: typeof record.name === "string" ? record.name : "",
    qualifiedName: String(record.qualifiedName),
    language: String(record.language),
    declaration: normalizeRange(record.declaration)
  };
  if (typeof record.signature === "string") {
    symbol2.signature = record.signature;
  }
  if (typeof record.parentId === "string" && record.parentId.length > 0) {
    symbol2.parentId = record.parentId;
  }
  if (typeof record.visibility === "string") {
    symbol2.visibility = /** @type {import('./entities.js').SymbolRecord['visibility']} */
    record.visibility;
  }
  if (typeof record.disambiguator === "string") {
    symbol2.disambiguator = record.disambiguator;
  }
  if (isPlainObject(record.extensions)) {
    symbol2.extensions = cloneValue(record.extensions);
  }
  return symbol2;
}
function normalizeRelationship(record) {
  const relationship2 = {
    relationshipId: String(record.relationshipId),
    type: String(record.type),
    from: String(record.from),
    to: String(record.to),
    status: (
      /** @type {import('./entities.js').Relationship['status']} */
      record.status
    ),
    evidence: Array.isArray(record.evidence) ? record.evidence.map(
      (evidence) => normalizeEvidence(
        /** @type {Record<string, unknown>} */
        evidence
      )
    ) : []
  };
  if (typeof record.reasonCode === "string") {
    relationship2.reasonCode = record.reasonCode;
  }
  if (isPlainObject(record.site)) {
    relationship2.site = normalizeRange(record.site);
  }
  if (isPlainObject(record.extensions)) {
    relationship2.extensions = cloneValue(record.extensions);
  }
  return relationship2;
}
function normalizeEvidence(record) {
  const evidence = {
    kind: (
      /** @type {import('./entities.js').Evidence['kind']} */
      record.kind ?? "source_range"
    )
  };
  if (isPlainObject(record.range)) {
    evidence.range = normalizeRange(record.range);
  }
  for (const field of ["symbolId", "relationshipId", "diagnosticCode", "note"]) {
    if (typeof record[field] === "string") {
      evidence[field] = record[field];
    }
  }
  return evidence;
}
function normalizeConstruct(record) {
  const construct = {
    constructId: String(record.constructId),
    kind: String(record.kind),
    children: Array.isArray(record.children) ? record.children.map(String) : [],
    sourceRange: normalizeRange(record.sourceRange)
  };
  if (typeof record.parentId === "string" && record.parentId.length > 0) {
    construct.parentId = record.parentId;
  }
  if (typeof record.symbolId === "string" && record.symbolId.length > 0) {
    construct.symbolId = record.symbolId;
  }
  if (isPlainObject(record.condition)) {
    construct.condition = normalizeRange(record.condition);
  }
  if (isPlainObject(record.extensions)) {
    construct.extensions = cloneValue(record.extensions);
  }
  return construct;
}
function normalizeDataFact(record) {
  const fact = {
    factId: String(record.factId),
    kind: String(record.kind),
    symbolId: String(record.symbolId),
    at: normalizeRange(record.at),
    status: (
      /** @type {import('./entities.js').DataFact['status']} */
      record.status
    )
  };
  if (typeof record.relatedSymbolId === "string") {
    fact.relatedSymbolId = record.relatedSymbolId;
  }
  if (typeof record.reasonCode === "string") {
    fact.reasonCode = record.reasonCode;
  }
  if (isPlainObject(record.extensions)) {
    fact.extensions = cloneValue(record.extensions);
  }
  return fact;
}
function normalizeDiagnostic(record) {
  const diagnostic = {
    severity: (
      /** @type {import('./entities.js').Diagnostic['severity']} */
      record.severity
    ),
    code: String(record.code),
    message: String(record.message),
    affects: Array.isArray(record.affects) ? record.affects.map(String) : []
  };
  if (isPlainObject(record.sourceRange)) {
    diagnostic.sourceRange = normalizeRange(record.sourceRange);
  }
  return diagnostic;
}
function normalizeRange(record) {
  const range = {
    fileId: String(record.fileId),
    startLine: Number(record.startLine),
    startColumn: Number(record.startColumn),
    endLine: Number(record.endLine),
    endColumn: Number(record.endColumn)
  };
  if (Number.isInteger(record.startOffset)) {
    range.startOffset = Number(record.startOffset);
  }
  if (Number.isInteger(record.endOffset)) {
    range.endOffset = Number(record.endOffset);
  }
  return range;
}
function cloneValue(value) {
  if (Array.isArray(value)) {
    return (
      /** @type {T} */
      value.map((entry) => cloneValue(entry))
    );
  }
  if (isPlainObject(value)) {
    const copy = {};
    for (const [key, entry] of Object.entries(value)) {
      copy[key] = cloneValue(entry);
    }
    return (
      /** @type {T} */
      copy
    );
  }
  return value;
}

// src/core/csr/entities.js
function createSourceRange(input = {}) {
  const range = {
    fileId: String(input.fileId ?? ""),
    startLine: Number(input.startLine ?? 0),
    startColumn: Number(input.startColumn ?? 0),
    endLine: Number(input.endLine ?? 0),
    endColumn: Number(input.endColumn ?? 0)
  };
  if (Number.isInteger(input.startOffset)) {
    range.startOffset = Number(input.startOffset);
  }
  if (Number.isInteger(input.endOffset)) {
    range.endOffset = Number(input.endOffset);
  }
  return range;
}
function createFileRecord(input = {}) {
  const file = {
    fileId: String(input.fileId ?? ""),
    path: String(input.path ?? ""),
    language: String(input.language ?? ""),
    contentHash: String(input.contentHash ?? ""),
    sizeBytes: Number(input.sizeBytes ?? 0),
    lineCount: Number(input.lineCount ?? 1),
    generated: input.generated === true
  };
  if (isPlainObject2(input.extensions)) {
    file.extensions = cloneJson(input.extensions);
  }
  return file;
}
function createSymbol(input = {}) {
  const symbol2 = {
    symbolId: String(input.symbolId ?? ""),
    kind: String(input.kind ?? "unknown"),
    name: String(input.name ?? ""),
    qualifiedName: String(input.qualifiedName ?? input.name ?? ""),
    language: String(input.language ?? ""),
    declaration: createSourceRange(input.declaration)
  };
  if (typeof input.signature === "string" && input.signature.length > 0) {
    symbol2.signature = input.signature;
  }
  if (typeof input.parentId === "string" && input.parentId.length > 0) {
    symbol2.parentId = input.parentId;
  }
  if (typeof input.visibility === "string" && input.visibility.length > 0) {
    symbol2.visibility = /** @type {SymbolRecord['visibility']} */
    input.visibility;
  }
  if (typeof input.disambiguator === "string") {
    symbol2.disambiguator = input.disambiguator;
  }
  if (isPlainObject2(input.extensions)) {
    symbol2.extensions = cloneJson(input.extensions);
  }
  return symbol2;
}
function createEvidence(input = {}) {
  const evidence = { kind: (
    /** @type {Evidence['kind']} */
    input.kind ?? "source_range"
  ) };
  if (input.range) {
    evidence.range = createSourceRange(input.range);
  }
  for (const field of ["symbolId", "relationshipId", "diagnosticCode", "note"]) {
    if (typeof input[field] === "string" && input[field].length > 0) {
      evidence[field] = input[field];
    }
  }
  return evidence;
}
function createRelationship(input = {}) {
  const relationship2 = {
    relationshipId: String(input.relationshipId ?? ""),
    type: String(input.type ?? "references"),
    from: String(input.from ?? ""),
    to: String(input.to ?? ""),
    status: (
      /** @type {Relationship['status']} */
      input.status ?? "unresolved"
    ),
    evidence: Array.isArray(input.evidence) ? input.evidence.map(createEvidence) : []
  };
  if (typeof input.reasonCode === "string" && input.reasonCode.length > 0) {
    relationship2.reasonCode = input.reasonCode;
  }
  if (input.site) {
    relationship2.site = createSourceRange(input.site);
  }
  if (isPlainObject2(input.extensions)) {
    relationship2.extensions = cloneJson(input.extensions);
  }
  return relationship2;
}
function createControlConstruct(input = {}) {
  const construct = {
    constructId: String(input.constructId ?? ""),
    kind: String(input.kind ?? "unknown"),
    children: Array.isArray(input.children) ? input.children.map(String) : [],
    sourceRange: createSourceRange(input.sourceRange)
  };
  if (typeof input.parentId === "string" && input.parentId.length > 0) {
    construct.parentId = input.parentId;
  }
  if (typeof input.symbolId === "string" && input.symbolId.length > 0) {
    construct.symbolId = input.symbolId;
  }
  if (input.condition) {
    construct.condition = createSourceRange(input.condition);
  }
  if (isPlainObject2(input.extensions)) {
    construct.extensions = cloneJson(input.extensions);
  }
  return construct;
}
function createDataFact(input = {}) {
  const fact = {
    factId: String(input.factId ?? ""),
    kind: String(input.kind ?? "use"),
    symbolId: String(input.symbolId ?? ""),
    at: createSourceRange(input.at),
    status: (
      /** @type {DataFact['status']} */
      input.status ?? "resolved"
    )
  };
  if (typeof input.relatedSymbolId === "string" && input.relatedSymbolId.length > 0) {
    fact.relatedSymbolId = input.relatedSymbolId;
  }
  if (typeof input.reasonCode === "string" && input.reasonCode.length > 0) {
    fact.reasonCode = input.reasonCode;
  }
  if (isPlainObject2(input.extensions)) {
    fact.extensions = cloneJson(input.extensions);
  }
  return fact;
}
function createDiagnostic(input = {}) {
  const diagnostic = {
    severity: (
      /** @type {Diagnostic['severity']} */
      input.severity ?? "warning"
    ),
    code: String(input.code ?? ""),
    message: String(input.message ?? ""),
    affects: Array.isArray(input.affects) ? input.affects.map(String) : []
  };
  if (input.sourceRange) {
    diagnostic.sourceRange = createSourceRange(input.sourceRange);
  }
  return diagnostic;
}
function createAnalysisRun(input = {}) {
  const run = {
    runId: String(input.runId ?? ""),
    adapterId: String(input.adapterId ?? ""),
    adapterVersion: String(input.adapterVersion ?? "unknown"),
    language: String(input.language ?? ""),
    csrVersion: String(input.csrVersion ?? CSR_VERSION),
    scope: {
      kind: input.scope?.kind === "file" ? "file" : "workspace"
    },
    completeness: (
      /** @type {AnalysisRun['completeness']} */
      input.completeness ?? "partial"
    ),
    files: Array.isArray(input.files) ? input.files.map(createFileRecord) : [],
    symbols: Array.isArray(input.symbols) ? input.symbols.map(createSymbol) : [],
    relationships: Array.isArray(input.relationships) ? input.relationships.map(createRelationship) : [],
    controlConstructs: Array.isArray(input.controlConstructs) ? input.controlConstructs.map(createControlConstruct) : [],
    dataFacts: Array.isArray(input.dataFacts) ? input.dataFacts.map(createDataFact) : [],
    diagnostics: Array.isArray(input.diagnostics) ? input.diagnostics.map(createDiagnostic) : []
  };
  if (typeof input.scope?.path === "string" && input.scope.path.length > 0) {
    run.scope.path = input.scope.path;
  }
  if (typeof input.startedAt === "string" && input.startedAt.length > 0) {
    run.startedAt = input.startedAt;
  }
  if (Number.isFinite(input.durationMs)) {
    run.durationMs = Number(input.durationMs);
  }
  if (isPlainObject2(input.extensions)) {
    run.extensions = cloneJson(input.extensions);
  }
  return run;
}
function createDegradedRun(input) {
  return createAnalysisRun({
    runId: input.runId,
    adapterId: input.adapterId,
    adapterVersion: input.adapterVersion ?? "unknown",
    language: input.language ?? "unknown",
    scope: input.scope,
    completeness: "partial",
    diagnostics: [
      createDiagnostic({
        severity: "error",
        code: input.code,
        message: input.message,
        affects: []
      })
    ]
  });
}
function isPlainObject2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function cloneJson(value) {
  if (Array.isArray(value)) {
    return (
      /** @type {T} */
      value.map((entry) => cloneJson(entry))
    );
  }
  if (isPlainObject2(value)) {
    const copy = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry !== void 0) {
        copy[key] = cloneJson(entry);
      }
    }
    return (
      /** @type {T} */
      copy
    );
  }
  return value;
}

// src/core/csr/cancellation.js
var CancellationError = class extends Error {
  /** @param {string} [message] */
  constructor(message = "Analysis was cancelled.") {
    super(message);
    this.name = "CancellationError";
    this.code = "E_CANCELLED";
  }
};
function isCancellationRequested(source) {
  if (!source) {
    return false;
  }
  if (typeof source.isCancelled === "function") {
    return source.isCancelled() === true;
  }
  return source.aborted === true;
}
function tokenFromAbortSignal(signal) {
  if (!signal) {
    return void 0;
  }
  return {
    isCancelled: () => signal.aborted === true,
    onCancel(listener) {
      if (signal.aborted) {
        listener();
        return () => {
        };
      }
      signal.addEventListener("abort", listener, { once: true });
      return () => signal.removeEventListener("abort", listener);
    },
    throwIfCancelled() {
      if (signal.aborted) {
        throw new CancellationError();
      }
    }
  };
}

// src/core/csr/migrate.js
var MIGRATIONS = [
  {
    from: "1.0.0",
    to: "1.1.0",
    description: "Rename provisional symbol/relationship fields and fill fields that became required.",
    migrate(run) {
      const next = cloneValue2(run);
      next.csrVersion = "1.1.0";
      const language = typeof next.language === "string" ? next.language : "unknown";
      next.adapterVersion = typeof next.adapterVersion === "string" && next.adapterVersion.length > 0 ? next.adapterVersion : "legacy";
      next.scope = isPlainObject3(next.scope) ? next.scope : { kind: "workspace" };
      next.diagnostics = Array.isArray(next.diagnostics) ? next.diagnostics : [];
      next.controlConstructs = Array.isArray(next.controlConstructs) ? next.controlConstructs : [];
      next.dataFacts = Array.isArray(next.dataFacts) ? next.dataFacts : [];
      if (Array.isArray(next.files)) {
        next.files = next.files.map((file) => {
          if (!isPlainObject3(file)) {
            return file;
          }
          return {
            ...file,
            sizeBytes: Number.isInteger(file.sizeBytes) ? file.sizeBytes : 0,
            generated: file.generated === true
          };
        });
      }
      if (Array.isArray(next.symbols)) {
        next.symbols = next.symbols.map((symbol2) => {
          if (!isPlainObject3(symbol2)) {
            return symbol2;
          }
          const migrated = { ...symbol2 };
          if (migrated.declaration === void 0 && migrated.range !== void 0) {
            migrated.declaration = migrated.range;
          }
          delete migrated.range;
          if (typeof migrated.language !== "string" || migrated.language.length === 0) {
            migrated.language = language;
          }
          return migrated;
        });
      }
      if (Array.isArray(next.relationships)) {
        next.relationships = next.relationships.map((relationship2) => {
          if (!isPlainObject3(relationship2)) {
            return relationship2;
          }
          const migrated = { ...relationship2 };
          if (migrated.reasonCode === void 0 && typeof migrated.reason === "string") {
            migrated.reasonCode = migrated.reason;
          }
          delete migrated.reason;
          if (migrated.status === "unknown") {
            migrated.status = "unresolved";
            if (typeof migrated.reasonCode !== "string" || migrated.reasonCode.length === 0) {
              migrated.reasonCode = "parse_error";
            }
          }
          if (!Array.isArray(migrated.evidence)) {
            migrated.evidence = [];
          }
          return migrated;
        });
      }
      return next;
    }
  }
];
function migrateRun(run, targetVersion = CSR_VERSION) {
  if (!isPlainObject3(run)) {
    return { ok: false, code: "E_VERSION", message: "Analysis run must be an object." };
  }
  const from = typeof run.csrVersion === "string" ? run.csrVersion : "";
  const source = parseCsrVersion(from);
  const target = parseCsrVersion(targetVersion);
  if (!source || !target) {
    return {
      ok: false,
      code: "E_VERSION",
      message: `Cannot migrate CSR version "${from}" to "${targetVersion}".`
    };
  }
  if (source.major !== target.major) {
    return {
      ok: false,
      code: "E_VERSION",
      message: `Refusing to migrate across major versions: "${from}" to "${targetVersion}".`
    };
  }
  if (compareVersions(source, target) > 0) {
    return {
      ok: false,
      code: "E_VERSION",
      message: `Refusing to downgrade CSR from "${from}" to "${targetVersion}".`
    };
  }
  let current = cloneValue2(run);
  const applied = [];
  let version3 = from;
  let guard = 0;
  while (version3 !== targetVersion && guard < 256) {
    guard += 1;
    const step = MIGRATIONS.find((candidate) => candidate.from === version3);
    if (!step) {
      return {
        ok: false,
        code: "E_MIGRATION_MISSING",
        message: `No migration step from CSR ${version3}; cannot reach ${targetVersion}.`
      };
    }
    current = step.migrate(current);
    applied.push(`${step.from} -> ${step.to}`);
    version3 = step.to;
  }
  if (version3 !== targetVersion) {
    return {
      ok: false,
      code: "E_MIGRATION_MISSING",
      message: `Migration did not reach ${targetVersion} (stopped at ${version3}).`
    };
  }
  const validation = validateAnalysisRun(current, { mode: "strict" });
  if (!validation.ok) {
    return {
      ok: false,
      code: "E_VALIDATION",
      message: `Migrated run is not valid CSR ${targetVersion}.`,
      issues: validation.issues
    };
  }
  return {
    ok: true,
    run: validation.run,
    from,
    to: targetVersion,
    applied
  };
}
function compareVersions(a, b) {
  if (a.major !== b.major) {
    return a.major - b.major;
  }
  if (a.minor !== b.minor) {
    return a.minor - b.minor;
  }
  return a.patch - b.patch;
}
function isPlainObject3(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function cloneValue2(value) {
  if (Array.isArray(value)) {
    return (
      /** @type {T} */
      value.map((entry) => cloneValue2(entry))
    );
  }
  if (isPlainObject3(value)) {
    const copy = {};
    for (const [key, entry] of Object.entries(value)) {
      copy[key] = cloneValue2(entry);
    }
    return (
      /** @type {T} */
      copy
    );
  }
  return value;
}

// src/core/csr/query.js
var INVERSE_OF = Object.freeze({
  calls: "called_by",
  defines: "defined_in",
  references: "referenced_by",
  declares: "declared_by",
  reads: "read_by",
  writes: "written_by",
  captures: "captured_by"
});
function createQueryLayer(run, options = {}) {
  const capabilities = Object.freeze({ ...options.capabilities ?? {} });
  const symbols = new Map(run.symbols.map((symbol2) => [symbol2.symbolId, symbol2]));
  const symbolsByFile = /* @__PURE__ */ new Map();
  for (const symbol2 of run.symbols) {
    const list = symbolsByFile.get(symbol2.declaration.fileId) ?? [];
    list.push(symbol2);
    symbolsByFile.set(symbol2.declaration.fileId, list);
  }
  for (const list of symbolsByFile.values()) {
    list.sort(bySymbolId);
  }
  const outgoingBySymbol = /* @__PURE__ */ new Map();
  const incomingBySymbol = /* @__PURE__ */ new Map();
  for (const relationship2 of run.relationships) {
    const outgoing2 = outgoingBySymbol.get(relationship2.from) ?? [];
    outgoing2.push(relationship2);
    outgoingBySymbol.set(relationship2.from, outgoing2);
    const incoming2 = incomingBySymbol.get(relationship2.to) ?? [];
    incoming2.push(relationship2);
    incomingBySymbol.set(relationship2.to, incoming2);
  }
  const factsBySymbol = /* @__PURE__ */ new Map();
  for (const fact of run.dataFacts) {
    const list = factsBySymbol.get(fact.symbolId) ?? [];
    list.push(fact);
    factsBySymbol.set(fact.symbolId, list);
  }
  const constructsBySymbol = /* @__PURE__ */ new Map();
  const constructById = new Map(run.controlConstructs.map((item) => [item.constructId, item]));
  for (const construct of run.controlConstructs) {
    if (!construct.symbolId) {
      continue;
    }
    const list = constructsBySymbol.get(construct.symbolId) ?? [];
    list.push(construct);
    constructsBySymbol.set(construct.symbolId, list);
  }
  let inverseCache = /* @__PURE__ */ new Map();
  let cacheVersion = 0;
  let cacheHits = 0;
  function fail(code, message) {
    return { ok: false, code, message };
  }
  function requireCapability(capability, feature) {
    const value = capabilities[capability];
    if (value === true || value === "partial") {
      return { ok: true };
    }
    return fail(
      "E_UNSUPPORTED",
      `${feature} is not available: adapter "${run.adapterId}" does not declare ${capability}.`
    );
  }
  function allSymbols() {
    return { ok: true, value: [...run.symbols].sort(bySymbolId) };
  }
  function allRelationships() {
    return { ok: true, value: [...run.relationships].sort(byRelationshipKey) };
  }
  function diagnostics() {
    return { ok: true, value: [...run.diagnostics] };
  }
  function runInfo() {
    return {
      ok: true,
      value: {
        runId: run.runId,
        language: run.language,
        adapterId: run.adapterId,
        adapterVersion: run.adapterVersion,
        csrVersion: run.csrVersion,
        completeness: run.completeness,
        scope: { ...run.scope }
      }
    };
  }
  function symbolById(symbolId) {
    if (typeof symbolId !== "string" || symbolId.length === 0) {
      return fail("E_QUERY", "symbolId must be a non-empty string.");
    }
    const symbol2 = symbols.get(symbolId);
    return symbol2 ? { ok: true, value: symbol2 } : fail("E_NOT_FOUND", `No symbol "${symbolId}".`);
  }
  function symbolsInFile(fileId) {
    if (typeof fileId !== "string" || fileId.length === 0) {
      return fail("E_QUERY", "fileId must be a non-empty string.");
    }
    return { ok: true, value: [...symbolsByFile.get(fileId) ?? []] };
  }
  function normalizeFilter(filter = {}) {
    const types = filter.types === void 0 ? null : filter.types;
    const statuses = filter.statuses === void 0 ? null : filter.statuses;
    if (types !== null && (!Array.isArray(types) || types.some((type) => typeof type !== "string"))) {
      return fail("E_QUERY", "types must be an array of relationship types.");
    }
    if (statuses !== null && (!Array.isArray(statuses) || statuses.some((status) => typeof status !== "string"))) {
      return fail("E_QUERY", "statuses must be an array of resolution statuses.");
    }
    return { ok: true, value: { types, statuses } };
  }
  function matches(relationship2, filter) {
    if (filter.types && !filter.types.includes(relationship2.type)) {
      return false;
    }
    if (filter.statuses && !filter.statuses.includes(relationship2.status)) {
      return false;
    }
    return true;
  }
  function outgoing(symbolId, filter) {
    if (typeof symbolId !== "string" || !symbols.has(symbolId)) {
      return fail("E_NOT_FOUND", `No symbol "${String(symbolId)}".`);
    }
    const normalized = normalizeFilter(filter);
    if (!normalized.ok) {
      return normalized;
    }
    return {
      ok: true,
      value: (outgoingBySymbol.get(symbolId) ?? []).filter(
        (relationship2) => matches(relationship2, normalized.value)
      )
    };
  }
  function incoming(symbolId, filter) {
    if (typeof symbolId !== "string" || !symbols.has(symbolId)) {
      return fail("E_NOT_FOUND", `No symbol "${String(symbolId)}".`);
    }
    const normalized = normalizeFilter(filter);
    if (!normalized.ok) {
      return normalized;
    }
    const key = `${cacheVersion}|${symbolId}|${JSON.stringify(normalized.value)}`;
    const cached = inverseCache.get(key);
    if (cached) {
      cacheHits += 1;
      return { ok: true, value: cached };
    }
    const derived = (incomingBySymbol.get(symbolId) ?? []).filter(
      (relationship2) => normalized.value.statuses === null || normalized.value.statuses.includes(relationship2.status)
    ).filter(
      (relationship2) => normalized.value.types === null || normalized.value.types.includes(relationship2.type) || normalized.value.types.includes(INVERSE_OF[relationship2.type])
    ).map((relationship2) => invertRelationship(relationship2));
    inverseCache.set(key, derived);
    return { ok: true, value: derived };
  }
  function callers(symbolId, filter) {
    const capability = requireCapability("resolveCalls", "Caller queries");
    if (!capability.ok) {
      return capability;
    }
    const derived = incoming(symbolId, {
      types: ["calls", "called_by"],
      statuses: filter?.statuses
    });
    if (!derived.ok) {
      return derived;
    }
    const result = [];
    for (const relationship2 of derived.value) {
      const caller = symbols.get(relationship2.to);
      if (caller) {
        result.push({ symbol: caller, relationship: relationship2 });
      }
    }
    return { ok: true, value: result };
  }
  function callees(symbolId, filter) {
    const capability = requireCapability("resolveCalls", "Callee queries");
    if (!capability.ok) {
      return capability;
    }
    const stored = outgoing(symbolId, { types: ["calls"], statuses: filter?.statuses });
    if (!stored.ok) {
      return stored;
    }
    const result = [];
    for (const relationship2 of stored.value) {
      const target = symbols.get(relationship2.to);
      if (target) {
        result.push({ symbol: target, relationship: relationship2, external: false });
      } else {
        result.push({
          symbol: {
            symbolId: relationship2.to,
            kind: "unknown",
            name: relationship2.to,
            qualifiedName: relationship2.to,
            language: run.language,
            declaration: { fileId: "", startLine: 0, startColumn: 0, endLine: 0, endColumn: 0 },
            visibility: "unknown"
          },
          relationship: relationship2,
          external: true
        });
      }
    }
    return { ok: true, value: result };
  }
  function constructsOf(symbolId) {
    const capability = requireCapability("generateCFG", "Control-flow queries");
    if (!capability.ok) {
      return capability;
    }
    if (typeof symbolId !== "string" || !symbols.has(symbolId)) {
      return fail("E_NOT_FOUND", `No symbol "${String(symbolId)}".`);
    }
    const constructs = constructsBySymbol.get(symbolId) ?? [];
    const roots = constructs.filter(
      (construct) => !construct.parentId || !constructById.has(construct.parentId)
    );
    const byId2 = {};
    for (const construct of constructs) {
      byId2[construct.constructId] = construct;
    }
    return { ok: true, value: { constructs, roots, byId: byId2 } };
  }
  function dataFactsOf(symbolId) {
    const capability = requireCapability("generateDFG", "Data-flow queries");
    if (!capability.ok) {
      return capability;
    }
    if (typeof symbolId !== "string" || !symbols.has(symbolId)) {
      return fail("E_NOT_FOUND", `No symbol "${String(symbolId)}".`);
    }
    return { ok: true, value: [...factsBySymbol.get(symbolId) ?? []] };
  }
  function capabilitiesOf() {
    return { ok: true, value: { ...capabilities } };
  }
  return {
    allSymbols,
    allRelationships,
    diagnostics,
    runInfo,
    symbolById,
    symbolsInFile,
    outgoing,
    incoming,
    callers,
    callees,
    constructsOf,
    dataFactsOf,
    capabilities: capabilitiesOf,
    invalidate() {
      inverseCache = /* @__PURE__ */ new Map();
      cacheVersion += 1;
    },
    stats: () => ({ cacheHits, cacheVersion, inverseEntries: inverseCache.size })
  };
}
function invertRelationship(relationship2) {
  const inverse = {
    relationshipId: `inverse:${relationship2.relationshipId}`,
    type: INVERSE_OF[relationship2.type] ?? relationship2.type,
    from: relationship2.to,
    to: relationship2.from,
    status: relationship2.status,
    evidence: relationship2.evidence ?? []
  };
  if (relationship2.reasonCode) {
    inverse.reasonCode = relationship2.reasonCode;
  }
  if (relationship2.site) {
    inverse.site = relationship2.site;
  }
  return inverse;
}
function bySymbolId(a, b) {
  return a.symbolId < b.symbolId ? -1 : a.symbolId > b.symbolId ? 1 : 0;
}
function byRelationshipKey(a, b) {
  for (const [left, right] of [
    [a.type, b.type],
    [a.from, b.from],
    [a.to, b.to],
    [a.relationshipId, b.relationshipId]
  ]) {
    if (left < right) {
      return -1;
    }
    if (left > right) {
      return 1;
    }
  }
  return 0;
}

// src/core/adapterRegistry.js
var CAPABILITY_VALUES = /* @__PURE__ */ new Set([true, false, "partial"]);
function createCapabilities(input = {}) {
  const capabilities = {};
  for (const key of CAPABILITY_KEYS) {
    const value = input[key];
    capabilities[key] = CAPABILITY_VALUES.has(value) ? (
      /** @type {boolean|'partial'} */
      value
    ) : false;
  }
  return (
    /** @type {CapabilitySet} */
    capabilities
  );
}
function createAdapterRegistry() {
  const adapters = /* @__PURE__ */ new Map();
  function register(descriptor) {
    if (!descriptor || typeof descriptor !== "object") {
      throw new TypeError("Adapter descriptor must be an object.");
    }
    if (typeof descriptor.id !== "string" || descriptor.id.length === 0) {
      throw new TypeError("Adapter descriptor requires a non-empty id.");
    }
    if (adapters.has(descriptor.id)) {
      throw new Error(`Adapter "${descriptor.id}" is already registered.`);
    }
    if (typeof descriptor.displayName !== "string" || descriptor.displayName.length === 0) {
      throw new TypeError(`Adapter "${descriptor.id}" requires a displayName.`);
    }
    if (typeof descriptor.version !== "string" || descriptor.version.length === 0) {
      throw new TypeError(`Adapter "${descriptor.id}" requires a version.`);
    }
    if (!Array.isArray(descriptor.languages) || descriptor.languages.length === 0) {
      throw new TypeError(`Adapter "${descriptor.id}" must declare at least one language.`);
    }
    const extensions = descriptor.extensions;
    if (!Array.isArray(extensions) || extensions.length === 0) {
      throw new TypeError(`Adapter "${descriptor.id}" must declare at least one file extension.`);
    }
    for (const extension of extensions) {
      if (typeof extension !== "string" || !extension.startsWith(".") || extension !== extension.toLowerCase()) {
        throw new TypeError(
          `Adapter "${descriptor.id}" has an invalid extension "${String(
            extension
          )}"; use lower case with a leading dot.`
        );
      }
    }
    if (typeof descriptor.analyze !== "function") {
      throw new TypeError(`Adapter "${descriptor.id}" must provide an analyze function.`);
    }
    const capabilities = createCapabilities(descriptor.capabilities);
    adapters.set(
      descriptor.id,
      Object.freeze({
        ...descriptor,
        extensions: [...extensions],
        languages: [...descriptor.languages],
        capabilities
      })
    );
  }
  function resolve(filePath) {
    if (typeof filePath !== "string" || filePath.length === 0) {
      return null;
    }
    const lower = filePath.toLowerCase();
    let best = null;
    let bestLength = 0;
    for (const adapter of adapters.values()) {
      for (const extension of adapter.extensions) {
        if (lower.endsWith(extension) && extension.length > bestLength) {
          best = adapter;
          bestLength = extension.length;
        }
      }
    }
    return best;
  }
  async function analyze(input, options = {}) {
    const inputIssues = validateInput(input);
    if (inputIssues.length > 0) {
      return {
        ok: false,
        code: "E_INPUT",
        message: "Invalid analysis input.",
        issues: inputIssues
      };
    }
    const adapter = resolve(input.path);
    if (!adapter) {
      return {
        ok: false,
        code: "E_UNSUPPORTED",
        message: `No adapter is registered for "${input.path}".`
      };
    }
    const token = input.cancellation && typeof input.cancellation === "object" ? "isCancelled" in input.cancellation ? (
      /** @type {import('./csr/cancellation.js').CancellationToken} */
      input.cancellation
    ) : tokenFromAbortSignal(
      /** @type {AbortSignal} */
      input.cancellation
    ) : void 0;
    const startedAt = Date.now();
    if (isCancellationRequested(token)) {
      return degraded(adapter, input, startedAt, "E_CANCELLED", "Analysis was cancelled.");
    }
    let output;
    try {
      output = await adapter.analyze({ ...input, cancellation: token });
    } catch (error) {
      if (error instanceof CancellationError || isCancellationRequested(token)) {
        return degraded(adapter, input, startedAt, "E_CANCELLED", "Analysis was cancelled.");
      }
      return degraded(
        adapter,
        input,
        startedAt,
        "E_ADAPTER",
        `Adapter "${adapter.id}" failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    if (isCancellationRequested(token)) {
      return degraded(adapter, input, startedAt, "E_CANCELLED", "Analysis was cancelled.");
    }
    if (typeof output !== "object" || output === null || Array.isArray(output)) {
      return {
        ok: false,
        code: "E_VALIDATION",
        message: `Adapter "${adapter.id}" did not return an AnalysisRun object.`,
        issues: [{ path: "$", message: "Adapter output must be an object." }]
      };
    }
    const candidate = (
      /** @type {Record<string, unknown>} */
      output
    );
    if (typeof candidate.adapterId !== "string" || candidate.adapterId.length === 0) {
      candidate.adapterId = adapter.id;
    }
    if (typeof candidate.adapterVersion !== "string" || candidate.adapterVersion.length === 0) {
      candidate.adapterVersion = adapter.version;
    }
    if (typeof candidate.csrVersion === "string" && isCompatibleCsrVersion(candidate.csrVersion) && candidate.csrVersion !== CSR_VERSION) {
      const migration = migrateRun(candidate, CSR_VERSION);
      if (!migration.ok) {
        return {
          ok: false,
          code: "E_VERSION",
          message: migration.message,
          issues: migration.issues
        };
      }
      output = migration.run;
    }
    if (
      /** @type {Record<string, unknown>} */
      output.runId !== input.runId
    ) {
      return {
        ok: false,
        code: "E_VALIDATION",
        message: `Adapter "${adapter.id}" returned runId "${String(
          /** @type {Record<string, unknown>} */
          output.runId
        )}" but the caller requested "${input.runId}".`,
        issues: [{ path: "runId", message: "runId must match the caller-supplied value." }]
      };
    }
    const validation = validateAnalysisRun(output, {
      mode: options.mode ?? "defensive",
      expectedAdapterId: adapter.id
    });
    if (!validation.ok) {
      const limitIssue = validation.issues.some((issue) => issue.code === "E_LIMIT");
      return {
        ok: false,
        code: limitIssue ? "E_LIMIT" : "E_VALIDATION",
        message: `Adapter "${adapter.id}" produced invalid CSR.`,
        issues: validation.issues
      };
    }
    const run = validation.run;
    run.adapterVersion = adapter.version;
    run.language = run.language || input.language || adapter.languages[0];
    const result = {
      ok: true,
      run,
      adapterId: adapter.id,
      durationMs: Date.now() - startedAt
    };
    if (validation.issues.length > 0) {
      result.issues = validation.issues.map((issue) => ({
        path: issue.path,
        message: issue.message
      }));
    }
    if (validation.dropped.length > 0) {
      result.dropped = validation.dropped.map((entry) => ({
        collection: entry.collection,
        path: entry.path,
        id: entry.id
      }));
      result.degraded = {
        code: "E_VALIDATION",
        message: `Dropped ${validation.dropped.length} invalid record(s) from adapter "${adapter.id}".`
      };
    }
    return result;
  }
  function degraded(adapter, input, startedAt, code, message) {
    const run = createDegradedRun({
      runId: input.runId,
      adapterId: adapter.id,
      adapterVersion: adapter.version,
      language: input.language ?? adapter.languages[0],
      scope: { kind: "file", path: input.path },
      code,
      message
    });
    return {
      ok: true,
      run,
      adapterId: adapter.id,
      durationMs: Date.now() - startedAt,
      degraded: { code, message }
    };
  }
  function dryRun(paths) {
    const values = Array.isArray(paths) ? paths : [];
    return {
      ok: true,
      value: values.filter((path4) => typeof path4 === "string").map((path4) => ({ path: path4, adapterId: resolve(path4)?.id ?? null }))
    };
  }
  function query(run) {
    const adapter = adapters.get(run.adapterId);
    return createQueryLayer(run, {
      capabilities: adapter?.capabilities ?? createCapabilities({})
    });
  }
  return {
    register,
    list: () => [...adapters.values()],
    resolve,
    analyze,
    dryRun,
    query,
    capabilityMatrix: () => [...adapters.values()].map((adapter) => ({
      id: adapter.id,
      languages: [...adapter.languages],
      capabilities: { ...adapter.capabilities }
    }))
  };
}
function validateInput(input) {
  const issues = [];
  if (!input || typeof input !== "object") {
    return [{ path: "$", message: "Analyze input must be an object." }];
  }
  if (typeof input.runId !== "string" || input.runId.length === 0) {
    issues.push({ path: "runId", message: "runId must be a non-empty string." });
  }
  if (typeof input.path !== "string" || input.path.length === 0) {
    issues.push({ path: "path", message: "path must be a non-empty string." });
  }
  if (input.text !== void 0 && typeof input.text !== "string") {
    issues.push({ path: "text", message: "text must be a string when present." });
  }
  if (typeof input.progress === "function") {
  }
  return issues;
}

// src/core/csr/hash.js
var FNV_OFFSET_A = 2166136261;
var FNV_OFFSET_B = 16777619;
var FNV_PRIME = 16777619;
function fnv1a32(text, seed) {
  let hash = seed >>> 0;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
function hashHex(text) {
  const value = String(text);
  return `${fnv1a32(value, FNV_OFFSET_A)}${fnv1a32(value, FNV_OFFSET_B)}`;
}
function shortHash(text) {
  return fnv1a32(String(text), FNV_OFFSET_A);
}

// src/core/csr/identity.js
function normalizePath(path4) {
  return String(path4 ?? "").replace(/\\/g, "/").replace(/\/{2,}/g, "/").replace(/^\.\//, "");
}
function normalizeQualifiedName(name) {
  return String(name ?? "").replace(/::/g, ".").replace(/\.{2,}/g, ".").replace(/^\./, "").replace(/\.$/, "");
}
function escapeIdSegment(value) {
  return String(value ?? "").replace(/%/g, "%25").replace(/:/g, "%3A").replace(/#/g, "%23");
}
function createFileId(path4) {
  return `file:${escapeIdSegment(normalizePath(path4))}`;
}
function createSymbolId(input) {
  const base = [
    "symbol",
    escapeIdSegment(input.language),
    escapeIdSegment(normalizePath(input.path)),
    escapeIdSegment(input.kind),
    escapeIdSegment(normalizeQualifiedName(input.qualifiedName))
  ].join(":");
  const disambiguator = input.disambiguator ? `#${escapeIdSegment(input.disambiguator)}` : "";
  return `${base}${disambiguator}`;
}
function createIdentityKey(input) {
  return [
    normalizePath(input.path),
    String(input.kind),
    normalizeQualifiedName(input.qualifiedName),
    String(input.disambiguator ?? "")
  ].join("|");
}
function createOverloadDisambiguator(parameterKinds) {
  const kinds = Array.isArray(parameterKinds) ? parameterKinds : [];
  const normalized = kinds.map(
    (kind) => String(kind ?? "unknown").trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "") || "unknown"
  );
  return normalized.length === 0 ? "arity0" : `arity${normalized.length}.${normalized.join("+")}`;
}
function createAnonymousDisambiguator(ordinal) {
  const safe = Number.isInteger(ordinal) && ordinal > 0 ? ordinal : 1;
  return `anon.${safe}`;
}
function createIdentityAllocator({ language }) {
  const usedIds = /* @__PURE__ */ new Set();
  const bases = /* @__PURE__ */ new Map();
  function symbol2(input) {
    const explicit = input.disambiguator ? String(input.disambiguator) : "";
    const baseKey = createIdentityKey({
      path: input.path,
      kind: input.kind,
      qualifiedName: input.qualifiedName,
      disambiguator: ""
    });
    let disambiguator = explicit;
    let symbolId = createSymbolId({ ...input, language, disambiguator });
    let identityKey = createIdentityKey({ ...input, disambiguator });
    if (usedIds.has(symbolId)) {
      let ordinal = bases.get(`${baseKey}#${explicit}`) ?? 1;
      do {
        disambiguator = explicit ? `${explicit}.${ordinal}` : String(ordinal);
        symbolId = createSymbolId({ ...input, language, disambiguator });
        identityKey = createIdentityKey({ ...input, disambiguator });
        ordinal += 1;
      } while (usedIds.has(symbolId) && ordinal < 1e4);
      bases.set(`${baseKey}#${explicit}`, ordinal);
    } else if (!explicit) {
      disambiguator = "0";
      identityKey = createIdentityKey({ ...input, disambiguator });
    }
    usedIds.add(symbolId);
    return { symbolId, identityKey, disambiguator };
  }
  return { symbol: symbol2 };
}
function createRelationshipId(input) {
  return `rel:${escapeIdSegment(input.type)}:${shortHash(`${input.from}|${input.to}`)}`;
}
function createRelationshipAllocator() {
  const counts = /* @__PURE__ */ new Map();
  return {
    relationship(input) {
      const base = createRelationshipId(input);
      const seen = counts.get(base) ?? 0;
      counts.set(base, seen + 1);
      return seen === 0 ? base : `${base}#${seen + 1}`;
    }
  };
}

// src/adapters/mock/index.js
var MOCK_RUN_ID = "run:mock-1";
var MOCK_LANGUAGE = "mock";
var DB_PATH = "src/DBHandler.js";
var SQLITE_PATH = "src/SQLiteHelper.js";
var DB_FILE_ID = createFileId(DB_PATH);
var SQLITE_FILE_ID = createFileId(SQLITE_PATH);
var identity = createIdentityAllocator({ language: MOCK_LANGUAGE });
var relationships = createRelationshipAllocator();
function symbol(input) {
  const fileId = input.path === DB_PATH ? DB_FILE_ID : SQLITE_FILE_ID;
  const identityValue = identity.symbol({
    path: input.path,
    kind: input.kind,
    qualifiedName: input.qualifiedName,
    disambiguator: input.disambiguator
  });
  return createSymbol({
    symbolId: identityValue.symbolId,
    kind: input.kind,
    name: input.name ?? input.qualifiedName.split(".").pop() ?? input.qualifiedName,
    qualifiedName: input.qualifiedName,
    language: MOCK_LANGUAGE,
    declaration: {
      fileId,
      startLine: input.startLine,
      startColumn: input.startColumn ?? 0,
      endLine: input.endLine,
      endColumn: input.endColumn ?? 0
    },
    signature: input.signature,
    parentId: input.parentId,
    visibility: input.visibility,
    disambiguator: identityValue.disambiguator,
    extensions: input.extensions
  });
}
var DBHANDLER = symbol({
  path: DB_PATH,
  kind: "class",
  qualifiedName: "DBHandler",
  startLine: 3,
  startColumn: 0,
  endLine: 30,
  endColumn: 1,
  visibility: "public",
  extensions: { exported: true }
});
var CHECK_DB = symbol({
  path: DB_PATH,
  kind: "method",
  qualifiedName: "DBHandler.check_db_exists",
  startLine: 9,
  startColumn: 2,
  endLine: 22,
  endColumn: 3,
  parentId: DBHANDLER.symbolId,
  visibility: "public",
  signature: "check_db_exists(path: string): Promise<boolean>",
  extensions: { async: true }
});
var OPEN_ONE = symbol({
  path: DB_PATH,
  kind: "method",
  qualifiedName: "DBHandler.open",
  startLine: 24,
  startColumn: 2,
  endLine: 26,
  endColumn: 3,
  parentId: DBHANDLER.symbolId,
  visibility: "public",
  disambiguator: createOverloadDisambiguator(["path"]),
  signature: "open(path: string): void"
});
var OPEN_TWO = symbol({
  path: DB_PATH,
  kind: "method",
  qualifiedName: "DBHandler.open",
  startLine: 27,
  startColumn: 2,
  endLine: 29,
  endColumn: 3,
  parentId: DBHANDLER.symbolId,
  visibility: "public",
  disambiguator: createOverloadDisambiguator(["path", "encoding"]),
  signature: "open(path: string, encoding: string): void"
});
var CHECK_I = symbol({
  path: DB_PATH,
  kind: "variable",
  qualifiedName: "DBHandler.check_db_exists.i",
  startLine: 12,
  startColumn: 4,
  endLine: 12,
  endColumn: 5,
  parentId: CHECK_DB.symbolId,
  visibility: "local"
});
var MAIN = symbol({
  path: DB_PATH,
  kind: "function",
  qualifiedName: "main",
  startLine: 33,
  startColumn: 0,
  endLine: 40,
  endColumn: 1,
  visibility: "public",
  signature: "main(): void"
});
var MAIN_I = symbol({
  path: DB_PATH,
  kind: "variable",
  qualifiedName: "main.i",
  startLine: 35,
  startColumn: 4,
  endLine: 35,
  endColumn: 5,
  parentId: MAIN.symbolId,
  visibility: "local"
});
var MAIN_LAMBDA = symbol({
  path: DB_PATH,
  kind: "lambda",
  name: "<anonymous>",
  qualifiedName: "main.<anonymous>",
  startLine: 36,
  startColumn: 4,
  endLine: 38,
  endColumn: 5,
  parentId: MAIN.symbolId,
  visibility: "local",
  disambiguator: createAnonymousDisambiguator(1)
});
var SQLITE = symbol({
  path: SQLITE_PATH,
  kind: "class",
  qualifiedName: "SQLiteHelper",
  startLine: 2,
  startColumn: 0,
  endLine: 24,
  endColumn: 1,
  visibility: "public"
});
var CHECK_DATA = symbol({
  path: SQLITE_PATH,
  kind: "method",
  qualifiedName: "SQLiteHelper.checkData",
  startLine: 6,
  startColumn: 2,
  endLine: 20,
  endColumn: 3,
  parentId: SQLITE.symbolId,
  visibility: "public",
  signature: "checkData(data: unknown): boolean"
});
var NAIVE = symbol({
  path: SQLITE_PATH,
  kind: "function",
  qualifiedName: "na\xEFve",
  startLine: 1,
  startColumn: 0,
  endLine: 3,
  endColumn: 1,
  visibility: "public"
});
var SYMBOLS = [
  SQLITE,
  CHECK_DATA,
  NAIVE,
  DBHANDLER,
  CHECK_DB,
  OPEN_ONE,
  OPEN_TWO,
  CHECK_I,
  MAIN,
  MAIN_I,
  MAIN_LAMBDA
];
function relationship(input) {
  return createRelationship({
    relationshipId: input.id ?? relationships.relationship(input),
    type: input.type,
    from: input.from,
    to: input.to,
    status: input.status,
    reasonCode: input.reasonCode,
    site: input.site,
    evidence: input.evidence ?? []
  });
}
var site = (fileId, startLine, startColumn, endLine, endColumn) => ({
  fileId,
  startLine,
  startColumn,
  endLine,
  endColumn
});
var RELATIONSHIPS = [
  relationship({
    type: "calls",
    from: MAIN.symbolId,
    to: CHECK_DB.symbolId,
    status: "resolved",
    site: site(DB_FILE_ID, 37, 2, 37, 37),
    evidence: [
      createEvidence({ kind: "source_range", range: site(DB_FILE_ID, 37, 2, 37, 37) }),
      createEvidence({ kind: "symbol", symbolId: MAIN.symbolId })
    ]
  }),
  relationship({
    type: "calls",
    from: CHECK_DB.symbolId,
    to: CHECK_DATA.symbolId,
    status: "resolved",
    site: site(DB_FILE_ID, 15, 4, 15, 27)
  }),
  relationship({
    type: "calls",
    from: CHECK_DB.symbolId,
    to: "external:logger.info",
    status: "unresolved",
    reasonCode: "unknown_import_target",
    site: site(DB_FILE_ID, 19, 4, 19, 18)
  }),
  relationship({
    type: "calls",
    from: CHECK_DB.symbolId,
    to: "external:fs.readFile",
    status: "unresolved",
    reasonCode: "out_of_scope",
    site: site(DB_FILE_ID, 20, 4, 20, 22)
  }),
  relationship({
    type: "defines",
    from: DBHANDLER.symbolId,
    to: CHECK_DB.symbolId,
    status: "resolved"
  }),
  relationship({
    type: "defines",
    from: DBHANDLER.symbolId,
    to: OPEN_ONE.symbolId,
    status: "resolved"
  }),
  relationship({
    type: "defines",
    from: DBHANDLER.symbolId,
    to: OPEN_TWO.symbolId,
    status: "resolved"
  }),
  relationship({
    type: "calls",
    from: MAIN.symbolId,
    to: OPEN_ONE.symbolId,
    status: "possible",
    reasonCode: "overload_ambiguous",
    site: site(DB_FILE_ID, 36, 2, 36, 20)
  }),
  relationship({
    type: "references",
    from: MAIN.symbolId,
    to: NAIVE.symbolId,
    status: "inferred",
    reasonCode: "function_pointer",
    site: site(DB_FILE_ID, 38, 4, 38, 12)
  }),
  relationship({
    type: "captures",
    from: MAIN_LAMBDA.symbolId,
    to: MAIN_I.symbolId,
    status: "stale",
    reasonCode: "index_stale",
    site: site(DB_FILE_ID, 36, 4, 38, 5)
  })
];
var CONSTRUCTS = [
  createControlConstruct({
    constructId: "construct:mock:main:entry",
    kind: "entry",
    symbolId: MAIN.symbolId,
    children: ["construct:mock:main:if"],
    sourceRange: site(DB_FILE_ID, 33, 0, 40, 1)
  }),
  createControlConstruct({
    constructId: "construct:mock:main:if",
    kind: "if",
    parentId: "construct:mock:main:entry",
    symbolId: MAIN.symbolId,
    children: ["construct:mock:main:return"],
    condition: site(DB_FILE_ID, 35, 6, 35, 20),
    sourceRange: site(DB_FILE_ID, 35, 2, 38, 3)
  }),
  createControlConstruct({
    constructId: "construct:mock:main:return",
    kind: "return",
    parentId: "construct:mock:main:if",
    symbolId: MAIN.symbolId,
    sourceRange: site(DB_FILE_ID, 39, 2, 39, 3)
  }),
  createControlConstruct({
    constructId: "construct:mock:check:entry",
    kind: "entry",
    symbolId: CHECK_DB.symbolId,
    children: ["construct:mock:check:try"],
    sourceRange: site(DB_FILE_ID, 9, 2, 22, 3)
  }),
  createControlConstruct({
    constructId: "construct:mock:check:try",
    kind: "try",
    parentId: "construct:mock:check:entry",
    symbolId: CHECK_DB.symbolId,
    sourceRange: site(DB_FILE_ID, 11, 4, 21, 5)
  })
];
var DATA_FACTS = [
  createDataFact({
    factId: "fact:mock:i1:definition",
    kind: "definition",
    symbolId: CHECK_I.symbolId,
    at: site(DB_FILE_ID, 12, 8, 12, 9),
    status: "resolved"
  }),
  createDataFact({
    factId: "fact:mock:i1:use",
    kind: "use",
    symbolId: CHECK_I.symbolId,
    at: site(DB_FILE_ID, 13, 8, 13, 9),
    status: "resolved"
  }),
  createDataFact({
    factId: "fact:mock:i2:assignment",
    kind: "assignment",
    symbolId: MAIN_I.symbolId,
    at: site(DB_FILE_ID, 35, 4, 35, 9),
    relatedSymbolId: CHECK_I.symbolId,
    status: "inferred",
    reasonCode: "dynamic_dispatch"
  })
];
var DIAGNOSTICS = [
  createDiagnostic({
    severity: "warning",
    code: "mock_data",
    message: "This graph comes from the mock adapter. It demonstrates the CSR contract; it is not analysis of your code.",
    affects: [MAIN.symbolId]
  }),
  createDiagnostic({
    severity: "info",
    code: "partial_coverage",
    message: "Mock analysis intentionally covers only the sample fixtures.",
    affects: []
  })
];
function createMockAnalysis() {
  return createAnalysisRun({
    runId: MOCK_RUN_ID,
    adapterId: "mock",
    adapterVersion: "0.1.0",
    language: MOCK_LANGUAGE,
    scope: { kind: "workspace" },
    completeness: "partial",
    files: [
      createFileRecord({
        fileId: DB_FILE_ID,
        path: DB_PATH,
        language: MOCK_LANGUAGE,
        contentHash: "fnv1a:mock-dbhandler",
        sizeBytes: 812,
        lineCount: 41
      }),
      createFileRecord({
        fileId: SQLITE_FILE_ID,
        path: SQLITE_PATH,
        language: MOCK_LANGUAGE,
        contentHash: "fnv1a:mock-sqlitehelper",
        sizeBytes: 504,
        lineCount: 27
      })
    ],
    symbols: SYMBOLS.map((entry) => ({ ...entry, declaration: { ...entry.declaration } })),
    relationships: RELATIONSHIPS.map((entry) => ({
      ...entry,
      evidence: entry.evidence.map((item) => ({ ...item }))
    })),
    controlConstructs: CONSTRUCTS.map((entry) => ({ ...entry })),
    dataFacts: DATA_FACTS.map((entry) => ({ ...entry })),
    diagnostics: DIAGNOSTICS.map((entry) => ({ ...entry }))
  });
}
var MOCK_FILE_TEXT = [
  "// Phase 1 mock fixture \u2014 not real project source.",
  "function na\xEFve(value) {",
  "  return value;",
  "}",
  "class DBHandler {",
  "  open(path) {}",
  "  open(path, encoding) {}",
  "  async check_db_exists(path) {",
  "    let i = 0;",
  "    i += 1;",
  "    return this.open(path);",
  "  }",
  "}",
  "",
  "function main() {",
  "  let i = 0;",
  "  const callback = () => i;",
  '  new DBHandler().check_db_exists("./data.db");',
  "  na\xEFve(callback);",
  "}"
].join("\n");
var mockAdapter = {
  id: "mock",
  displayName: "Mock adapter (Phase 1)",
  version: "0.1.0",
  languages: [MOCK_LANGUAGE],
  extensions: [".mock"],
  capabilities: createCapabilities({
    parse: true,
    discoverDeclarations: true,
    resolveSymbols: true,
    resolveCalls: true,
    resolveImports: true,
    mapSourceLocations: true,
    reportDiagnostics: true
  }),
  /**
   * @param {{path: string, text?: string, runId: string}} input
   * @returns {import('../../core/csr/entities.js').AnalysisRun}
   */
  analyze(input) {
    const analysis = createMockAnalysis();
    return { ...analysis, runId: input.runId };
  }
};

// src/adapters/cpp/locator.js
function createSourceLocator({ workspaceRoot, tuPath, text, language = "cpp" }) {
  const root = typeof workspaceRoot === "string" ? toPosix(workspaceRoot).replace(/\/$/, "") : "";
  const normalizedTu = toPosix(tuPath);
  const tuLines = splitLines(stripBom(typeof text === "string" ? text : ""));
  const files = /* @__PURE__ */ new Map();
  function toWorkspacePath(raw, fallback) {
    const value = typeof raw === "string" && raw.length > 0 ? toPosix(raw) : toPosix(fallback ?? "");
    if (value.length === 0) {
      return null;
    }
    if (root.length > 0) {
      const lowerRoot = root.toLowerCase();
      const lowerValue = value.toLowerCase();
      if (lowerValue === lowerRoot) {
        return "";
      }
      if (lowerValue.startsWith(`${lowerRoot}/`)) {
        return normalizeRelative(value.slice(root.length + 1));
      }
    }
    if (/^[A-Za-z]:\//.test(value) || value.startsWith("/")) {
      return null;
    }
    return normalizeRelative(value);
  }
  function ensureFile(filePath, lineHint) {
    if (!filePath) {
      return null;
    }
    const existing = files.get(filePath);
    const maxLine = Math.max(
      0,
      Number.isInteger(lineHint) ? lineHint - 1 : 0,
      filePath === normalizedTu ? Math.max(0, countLines(text ?? "") - 1) : 0
    );
    if (existing) {
      existing.maxLine = Math.max(existing.maxLine, maxLine);
      return createFileId(filePath);
    }
    files.set(filePath, {
      maxLine,
      language: extensionLanguage(filePath, language)
    });
    return createFileId(filePath);
  }
  function position(loc, inheritedFile) {
    const record = isObject(loc) ? loc : {};
    const file = toWorkspacePath(
      typeof record.file === "string" ? record.file : void 0,
      inheritedFile
    );
    const line = Math.max(0, Number(record.line ?? 1) - 1);
    const byteColumn = Math.max(0, Number(record.col ?? 1) - 1);
    const column = file === normalizedTu && tuLines.length > 0 ? utf16Column(tuLines[Math.min(line, tuLines.length - 1)] ?? "", byteColumn) : byteColumn;
    return { file, line, column };
  }
  function rangeFor(node, inheritedFile) {
    if (!isObject(node)) {
      return null;
    }
    const range = isObject(node.range) ? node.range : null;
    if (range) {
      const begin = position(isObject(range.begin) ? range.begin : void 0, inheritedFile);
      const end = position(
        isObject(range.end) ? range.end : void 0,
        begin.file ?? inheritedFile
      );
      const file = begin.file ?? end.file ?? toWorkspacePath(void 0, inheritedFile);
      if (!file) {
        return null;
      }
      const fileId2 = ensureFile(file, begin.line + 1);
      ensureFile(file, end.line + 1);
      const endLine = Math.max(begin.line, end.line);
      let endColumn = end.column;
      if (endLine === begin.line && endColumn <= begin.column) {
        endColumn = begin.column + 1;
      }
      return {
        fileId: fileId2 ?? createFileId(file),
        startLine: begin.line,
        startColumn: begin.column,
        endLine,
        endColumn
      };
    }
    const only = position(isObject(node.loc) ? node.loc : void 0, inheritedFile);
    if (!only.file) {
      return null;
    }
    const fileId = ensureFile(only.file, only.line + 1);
    return {
      fileId: fileId ?? createFileId(only.file),
      startLine: only.line,
      startColumn: only.column,
      endLine: only.line,
      endColumn: only.column + 1
    };
  }
  function fileRecords() {
    return [...files.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([filePath, meta]) => ({
      fileId: createFileId(filePath),
      path: filePath,
      language: meta.language,
      contentHash: `clang:${filePath}`,
      sizeBytes: filePath === normalizedTu ? byteLength(text ?? "") : 0,
      lineCount: Math.max(1, meta.maxLine + 1),
      generated: false
    }));
  }
  return {
    tuPath: normalizedTu,
    toWorkspacePath,
    ensureFile,
    position,
    rangeFor,
    fileIdFor: (filePath) => createFileId(filePath),
    fileRecords,
    files: () => new Map(files)
  };
}
function splitLines(value) {
  return value.split(/\r\n|\r|\n/);
}
function countLines(value) {
  if (typeof value !== "string" || value.length === 0) {
    return 1;
  }
  const lines = splitLines(value);
  if (lines.length > 1 && lines[lines.length - 1] === "" && /(?:\r\n|\r|\n)$/.test(value)) {
    return lines.length - 1;
  }
  return lines.length;
}
function stripBom(value) {
  return value.charCodeAt(0) === 65279 ? value.slice(1) : value;
}
function utf16Column(line, byteColumn) {
  if (byteColumn <= 0) {
    return 0;
  }
  let bytes = 0;
  let index = 0;
  for (const character of line) {
    if (bytes >= byteColumn) {
      break;
    }
    const codePoint = character.codePointAt(0) ?? 0;
    const width = utf8Width(codePoint);
    if (bytes + width > byteColumn) {
      break;
    }
    bytes += width;
    index += character.length;
  }
  return index;
}
function utf8Width(codePoint) {
  if (codePoint <= 127) {
    return 1;
  }
  if (codePoint <= 2047) {
    return 2;
  }
  if (codePoint <= 65535) {
    return 3;
  }
  return 4;
}
function toPosix(value) {
  return String(value).replace(/\\/g, "/");
}
function normalizeRelative(value) {
  const segments = [];
  for (const segment of value.split("/")) {
    if (segment === "" || segment === ".") {
      continue;
    }
    if (segment === "..") {
      segments.pop();
      continue;
    }
    segments.push(segment);
  }
  return segments.join("/");
}
function extensionLanguage(filePath, fallback) {
  if (/\.(c|h)$/i.test(filePath)) {
    return "c";
  }
  return /\.(cpp|cc|cxx|c\+\+|hpp|hh|hxx|ipp)$/i.test(filePath) ? "cpp" : fallback;
}
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function byteLength(value) {
  let bytes = 0;
  for (const character of value) {
    bytes += utf8Width(character.codePointAt(0) ?? 0);
  }
  return bytes;
}

// src/adapters/cpp/mapper.js
function mapClangAst(options) {
  const {
    runId,
    path: tuPath,
    text = "",
    workspaceRoot,
    adapterId = "cpp-clang",
    adapterVersion = "0.1.0",
    mode = "compile-db",
    warnings = [],
    stderr = "",
    headerMap = {},
    toolchain = "clang"
  } = options;
  const locator = createSourceLocator({ workspaceRoot, tuPath, text, language: "cpp" });
  const language = "cpp";
  const allocator = createIdentityAllocator({ language });
  const relationshipIds = createRelationshipAllocator();
  const relationships2 = [];
  const symbols = [];
  const byId2 = /* @__PURE__ */ new Map();
  const byNodeId = /* @__PURE__ */ new Map();
  const byScopeKey = /* @__PURE__ */ new Map();
  const fileSymbols = /* @__PURE__ */ new Map();
  const pendingFileSymbols = [];
  const diagnostics = warnings.map(
    (warning) => createDiagnostic({
      severity: warning.code === "missing_compile_db" ? "warning" : "warning",
      code: warning.code,
      message: warning.message
    })
  );
  const callSites = [];
  const includes = scanIncludes(text);
  let templateSeen = false;
  let unsupportedSeen = false;
  function fileSymbol(filePath) {
    const path4 = filePath ?? locator.tuPath;
    const existing = fileSymbols.get(path4);
    if (existing) {
      return existing;
    }
    locator.ensureFile(path4, 1);
    const fileId = locator.fileIdFor(path4);
    const declaration = {
      fileId,
      startLine: 0,
      startColumn: 0,
      endLine: 0,
      endColumn: 1
    };
    const identity2 = allocator.symbol({
      path: path4,
      kind: "file",
      qualifiedName: path4
    });
    const symbol2 = createSymbol({
      symbolId: identity2.symbolId,
      kind: "file",
      name: basename(path4),
      qualifiedName: path4,
      language,
      declaration,
      visibility: "public"
    });
    symbols.push(symbol2);
    byId2.set(symbol2.symbolId, symbol2);
    fileSymbols.set(path4, symbol2);
    pendingFileSymbols.push(symbol2);
    return symbol2;
  }
  function declare(input) {
    fileSymbol(input.file);
    const qualifiedName = input.parent ? `${input.parent.qualifiedName}::${input.name}` : input.name;
    const scopeKey = `${input.file}|${input.kind}|${qualifiedName}|${input.disambiguator ?? ""}`;
    const existing = byScopeKey.get(scopeKey);
    if (existing) {
      if (input.node.id) {
        byNodeId.set(String(input.node.id), existing);
      }
      if (input.node.completeDefinition === true && existing.declaration.startLine === 0 && existing.declaration.endLine === 0) {
        existing.declaration = input.declaration;
      }
      return existing;
    }
    const identity2 = allocator.symbol({
      path: input.file,
      kind: input.kind,
      qualifiedName,
      disambiguator: input.disambiguator
    });
    const symbol2 = createSymbol({
      symbolId: identity2.symbolId,
      kind: input.kind,
      name: input.name,
      qualifiedName,
      language,
      declaration: input.declaration,
      ...input.parent ? { parentId: input.parent.symbolId } : {},
      ...input.visibility ? { visibility: input.visibility } : {},
      ...input.signature ? { signature: input.signature } : {},
      ...input.disambiguator ? { disambiguator: input.disambiguator } : {},
      ...input.extensions ? { extensions: input.extensions } : {}
    });
    symbols.push(symbol2);
    byId2.set(symbol2.symbolId, symbol2);
    byScopeKey.set(scopeKey, symbol2);
    if (input.node.id) {
      byNodeId.set(String(input.node.id), symbol2);
    }
    return symbol2;
  }
  function visit(node, context) {
    if (!isObject2(node) || typeof node.kind !== "string") {
      return;
    }
    if (node.isImplicit === true) {
      return;
    }
    const rawFile = typeof node.loc?.file === "string" ? node.loc.file : typeof node.range?.begin?.file === "string" ? node.range.begin.file : void 0;
    const file = rawFile ? locator.toWorkspacePath(rawFile) : context.file;
    if (file === null) {
      return;
    }
    const range = locator.rangeFor(node, file);
    const kind = node.kind;
    const name = typeof node.name === "string" ? node.name : "";
    const parent = context.scope[context.scope.length - 1] ?? null;
    if (kind === "ClassTemplateDecl") {
      templateSeen = true;
      for (const child of inner(node)) {
        visit(child, { ...context, file, template: true });
      }
      return;
    }
    if (kind === "FunctionTemplateDecl") {
      templateSeen = true;
      for (const child of inner(node)) {
        visit(child, { ...context, file, template: true });
      }
      return;
    }
    if (kind === "NamespaceDecl") {
      if (!name || !range) {
        for (const child of inner(node)) {
          visit(child, { ...context, file });
        }
        return;
      }
      const symbol2 = declare({
        node,
        name,
        kind: "namespace",
        file,
        parent,
        declaration: range,
        visibility: "public"
      });
      const frame = {
        name,
        qualifiedName: symbol2.qualifiedName,
        symbolId: symbol2.symbolId,
        kind: "namespace"
      };
      for (const child of inner(node)) {
        visit(child, { ...context, file, scope: [...context.scope, frame] });
      }
      return;
    }
    if (kind === "CXXRecordDecl" || kind === "RecordDecl") {
      const isLambdaRecord = context.inLambda && /lambda|operator\(\)/i.test(name);
      if (isLambdaRecord) {
        return;
      }
      if (!name || !range) {
        for (const child of inner(node)) {
          visit(child, { ...context, file });
        }
        return;
      }
      const recordKind = String(node.tagUsed ?? (kind === "RecordDecl" ? "struct" : "class"));
      const symbolKind = recordKind === "union" ? "class" : recordKind === "struct" ? "struct" : "class";
      const visibility = typeof node.access === "string" ? String(node.access) : recordKind === "class" ? "private" : "public";
      const symbol2 = declare({
        node,
        name,
        kind: symbolKind,
        file,
        parent,
        declaration: range,
        visibility,
        extensions: {
          cpp: {
            recordKind,
            completeDefinition: node.completeDefinition === true,
            ...context.template ? { template: true } : {}
          }
        }
      });
      const frame = {
        name,
        qualifiedName: symbol2.qualifiedName,
        symbolId: symbol2.symbolId,
        kind: symbolKind
      };
      let memberVisibility = visibility;
      for (const child of inner(node)) {
        if (child.kind === "AccessSpecDecl") {
          if (typeof child.access === "string") {
            memberVisibility = child.access;
          }
          continue;
        }
        visit(child, {
          ...context,
          file,
          scope: [...context.scope, frame],
          classId: symbol2.symbolId,
          visibility: memberVisibility
        });
      }
      return;
    }
    if (kind === "FunctionDecl" || kind === "CXXMethodDecl" || kind === "CXXConstructorDecl" || kind === "CXXDestructorDecl" || kind === "CXXConversionDecl") {
      if (!name || !range) {
        for (const child of inner(node)) {
          visit(child, { ...context, file });
        }
        return;
      }
      const parameterTypes = inner(node).filter((child) => child.kind === "ParmVarDecl").map((child) => String(child.type?.qualType ?? "unknown"));
      const symbolKind = functionKind(kind);
      const disambiguator = createOverloadDisambiguator(parameterTypes);
      const symbol2 = declare({
        node,
        name,
        kind: symbolKind,
        file,
        parent,
        declaration: range,
        visibility: context.visibility,
        disambiguator,
        signature: typeof node.type?.qualType === "string" ? node.type.qualType : void 0,
        extensions: {
          cpp: {
            ...context.template ? { template: true } : {},
            ...node.virtual === true ? { virtual: true } : {},
            ...node.pure === true ? { pure: true } : {}
          }
        }
      });
      const frame = {
        name,
        qualifiedName: symbol2.qualifiedName,
        symbolId: symbol2.symbolId,
        kind: symbolKind
      };
      for (const child of inner(node)) {
        visit(child, {
          ...context,
          file,
          scope: [...context.scope, frame],
          functionId: symbol2.symbolId,
          classId: context.classId
        });
      }
      return;
    }
    if (kind === "ParmVarDecl") {
      if (name && range) {
        declare({
          node,
          name,
          kind: "parameter",
          file,
          parent,
          declaration: range,
          visibility: context.visibility,
          extensions: {
            cpp: {
              ...typeof node.type?.qualType === "string" ? { type: node.type.qualType } : {}
            }
          }
        });
      }
      for (const child of inner(node)) {
        visit(child, { ...context, file });
      }
      return;
    }
    if (kind === "VarDecl") {
      if (name && range) {
        const parentKind = parent?.kind;
        declare({
          node,
          name,
          kind: parentKind === "namespace" || parentKind === "class" || parentKind === "struct" ? "variable" : "variable",
          file,
          parent,
          declaration: range,
          visibility: context.visibility,
          extensions: {
            cpp: {
              ...typeof node.type?.qualType === "string" ? { type: node.type.qualType } : {},
              ...parentKind === "namespace" || parentKind === "class" || parentKind === "struct" ? { linkage: "external" } : { local: true }
            }
          }
        });
      }
      for (const child of inner(node)) {
        visit(child, { ...context, file });
      }
      return;
    }
    if (kind === "FieldDecl") {
      if (name && range) {
        declare({
          node,
          name,
          kind: "field",
          file,
          parent,
          declaration: range,
          visibility: context.visibility,
          extensions: {
            cpp: {
              ...typeof node.type?.qualType === "string" ? { type: node.type.qualType } : {}
            }
          }
        });
      }
      for (const child of inner(node)) {
        visit(child, { ...context, file });
      }
      return;
    }
    if (kind === "EnumDecl") {
      if (name && range) {
        const symbol2 = declare({
          node,
          name,
          kind: "enum",
          file,
          parent,
          declaration: range,
          visibility: context.visibility
        });
        const frame = {
          name,
          qualifiedName: symbol2.qualifiedName,
          symbolId: symbol2.symbolId,
          kind: "enum"
        };
        for (const child of inner(node)) {
          visit(child, { ...context, file, scope: [...context.scope, frame] });
        }
        return;
      }
      for (const child of inner(node)) {
        visit(child, { ...context, file });
      }
      return;
    }
    if (kind === "EnumConstantDecl") {
      if (name && range) {
        declare({
          node,
          name,
          kind: "enum_member",
          file,
          parent,
          declaration: range,
          visibility: context.visibility
        });
      }
      return;
    }
    if (kind === "TypedefDecl" || kind === "TypeAliasDecl") {
      if (name && range) {
        declare({
          node,
          name,
          kind: "type_alias",
          file,
          parent,
          declaration: range,
          visibility: context.visibility,
          extensions: {
            cpp: {
              ...typeof node.type?.qualType === "string" ? { type: node.type.qualType } : {}
            }
          }
        });
      }
      return;
    }
    if (kind === "LambdaExpr") {
      const ordinal = countLambdas(context.scope);
      if (range) {
        const symbol2 = declare({
          node,
          name: "<lambda>",
          kind: "closure",
          file,
          parent,
          declaration: range,
          visibility: context.visibility,
          disambiguator: createAnonymousDisambiguator(ordinal),
          extensions: { cpp: { anonymous: true } }
        });
        const frame = {
          name: `<lambda>`,
          qualifiedName: symbol2.qualifiedName,
          symbolId: symbol2.symbolId,
          kind: "closure"
        };
        for (const child of inner(node)) {
          visit(child, {
            ...context,
            file,
            scope: [...context.scope, frame],
            functionId: symbol2.symbolId,
            inLambda: true
          });
        }
        return;
      }
    }
    if (kind === "CallExpr" || kind === "CXXMemberCallExpr" || kind === "CXXOperatorCallExpr" || kind === "CXXConstructExpr") {
      callSites.push({
        node,
        file,
        functionId: context.functionId,
        range
      });
    }
    if (kind === "GotoStmt" || kind === "IndirectGotoStmt" || kind === "CXXTryStmt" || kind === "CXXThrowExpr") {
      unsupportedSeen = true;
    }
    for (const child of inner(node)) {
      visit(child, { ...context, file });
    }
  }
  function countLambdas(scope) {
    return symbols.filter(
      (symbol2) => symbol2.kind === "closure" && symbol2.qualifiedName.startsWith(scope[scope.length - 1]?.qualifiedName ?? "")
    ).length + 1;
  }
  const root = typeof options.ast === "string" ? parseAst(options.ast) : options.ast;
  if (!isObject2(root)) {
    diagnostics.push(
      createDiagnostic({
        severity: "error",
        code: "parse_error",
        message: "Clang did not produce a JSON AST for this translation unit."
      })
    );
    return finish();
  }
  fileSymbol(locator.tuPath);
  visit(root, {
    file: locator.tuPath,
    scope: [],
    functionId: null,
    classId: null,
    visibility: "public",
    template: false,
    inLambda: false
  });
  for (const file of locator.fileRecords()) {
    const after = locator.ensureFile(file.path);
    void after;
  }
  for (const symbol2 of pendingFileSymbols) {
    const record = locator.fileRecords().find((entry) => entry.fileId === symbol2.declaration.fileId);
    if (record) {
      symbol2.declaration.endLine = Math.max(0, record.lineCount - 1);
      symbol2.declaration.endColumn = 1;
    }
  }
  for (const call of callSites) {
    const relationship2 = callRelationship(call);
    if (relationship2) {
      relationships2.push(relationship2);
    }
  }
  for (const include of includes) {
    const relationship2 = includeRelationship(include);
    if (relationship2) {
      relationships2.push(relationship2);
    }
  }
  if (templateSeen) {
    diagnostics.push(
      createDiagnostic({
        severity: "info",
        code: "unsupported_construct",
        message: "Template declarations are modeled; template instantiations are not expanded."
      })
    );
  }
  if (unsupportedSeen) {
    diagnostics.push(
      createDiagnostic({
        severity: "info",
        code: "unsupported_construct",
        message: "goto, exception paths, and computed jumps are recorded only as constructs; full control flow is Phase 4."
      })
    );
  }
  if (typeof stderr === "string" && stderr.trim().length > 0) {
    diagnostics.push(...parseStderr(stderr, locator.tuPath));
  }
  const unmappedHeaders = Object.entries(headerMap).filter(([, value]) => !value || typeof value !== "object" || typeof value.tuPath !== "string").map(([header]) => header);
  if (unmappedHeaders.length > 0) {
    diagnostics.push(
      createDiagnostic({
        severity: "warning",
        code: "header_without_tu",
        message: `No translation unit includes ${unmappedHeaders.slice(0, 3).join(", ")}; those headers were analyzed syntactically only.`
      })
    );
  }
  return finish();
  function callRelationship(call) {
    const from = call.functionId ?? fileSymbol(call.file).symbolId;
    if (!from) {
      return null;
    }
    const site2 = call.range ?? void 0;
    const target = resolveCallee(call.node);
    if (!target) {
      return null;
    }
    if (target.kind === "construct") {
      const classSymbol = findClassByType(target.typeName);
      if (classSymbol) {
        return createRelationship({
          relationshipId: relationshipIds.relationship({
            type: "instantiates",
            from,
            to: classSymbol.symbolId
          }),
          type: "instantiates",
          from,
          to: classSymbol.symbolId,
          status: "resolved",
          evidence: [createEvidence({ kind: "source_range", ...site2 ? { range: site2 } : {} })],
          ...site2 ? { site: site2 } : {}
        });
      }
      return null;
    }
    if (target.status === "resolved" && target.symbol) {
      if (target.virtual || target.functionPointer) {
        return createRelationship({
          relationshipId: relationshipIds.relationship({
            type: "calls",
            from,
            to: target.symbol.symbolId
          }),
          type: "calls",
          from,
          to: target.symbol.symbolId,
          status: target.functionPointer ? "unresolved" : "possible",
          reasonCode: target.functionPointer ? "function_pointer" : "dynamic_dispatch",
          evidence: [createEvidence({ kind: "source_range", ...site2 ? { range: site2 } : {} })],
          ...site2 ? { site: site2 } : {},
          extensions: { cpp: { candidates: [target.symbol.symbolId] } }
        });
      }
      return createRelationship({
        relationshipId: relationshipIds.relationship({
          type: "calls",
          from,
          to: target.symbol.symbolId
        }),
        type: "calls",
        from,
        to: target.symbol.symbolId,
        status: "resolved",
        evidence: [createEvidence({ kind: "source_range", ...site2 ? { range: site2 } : {} })],
        ...site2 ? { site: site2 } : {}
      });
    }
    const externalName = target.name || "(anonymous)";
    return createRelationship({
      relationshipId: relationshipIds.relationship({
        type: "calls",
        from,
        to: `external:${externalName}`
      }),
      type: "calls",
      from,
      to: `external:${externalName}`,
      status: "unresolved",
      reasonCode: target.functionPointer ? "function_pointer" : "out_of_scope",
      evidence: [createEvidence({ kind: "source_range", ...site2 ? { range: site2 } : {} })],
      ...site2 ? { site: site2 } : {}
    });
  }
  function includeRelationship(include) {
    if (include.system) {
      return null;
    }
    const from = fileSymbol(locator.tuPath).symbolId;
    const target = findFileSymbolByInclude(include.name);
    const site2 = {
      fileId: locator.fileIdFor(locator.tuPath),
      startLine: include.line,
      startColumn: 0,
      endLine: include.line,
      endColumn: Math.max(1, include.lineText.length)
    };
    if (target) {
      return createRelationship({
        relationshipId: relationshipIds.relationship({
          type: "includes",
          from,
          to: target.symbolId
        }),
        type: "includes",
        from,
        to: target.symbolId,
        status: "resolved",
        evidence: [createEvidence({ kind: "import", range: site2 })],
        site: site2
      });
    }
    return createRelationship({
      relationshipId: relationshipIds.relationship({
        type: "includes",
        from,
        to: `external:${include.name}`
      }),
      type: "includes",
      from,
      to: `external:${include.name}`,
      status: "unresolved",
      reasonCode: "out_of_scope",
      evidence: [createEvidence({ kind: "import", range: site2 })],
      site: site2
    });
  }
  function findFileSymbolByInclude(includeName) {
    const needle = includeName.replace(/\\/g, "/");
    for (const [path4, symbol2] of fileSymbols) {
      if (path4 === needle || path4.endsWith(`/${needle}`) || basename(path4) === needle) {
        return symbol2;
      }
    }
    return null;
  }
  function findClassByType(typeName) {
    const clean = String(typeName).replace(/^class\s+/, "").replace(/^struct\s+/, "").replace(/<.*$/, "").replace(/\s*\*+$/, "").trim();
    const short = clean.split("::").pop() ?? clean;
    for (const symbol2 of symbols) {
      if (symbol2.kind === "class" || symbol2.kind === "struct") {
        if (symbol2.qualifiedName === clean || symbol2.name === short) {
          return symbol2;
        }
      }
    }
    return null;
  }
  function resolveCallee(node) {
    if (node.kind === "CXXConstructExpr") {
      return { kind: "construct", typeName: String(node.type?.qualType ?? "") };
    }
    const referenced = findReferencedDecl(node);
    if (referenced?.id) {
      const symbol2 = byNodeId.get(String(referenced.id));
      if (symbol2) {
        return {
          kind: "symbol",
          symbol: symbol2,
          name: symbol2.name,
          status: "resolved",
          virtual: symbol2.extensions?.cpp?.virtual === true,
          functionPointer: isFunctionPointerType(referenced.type)
        };
      }
    }
    const name = calleeName(node) || referenced?.name || "";
    if (!name) {
      return null;
    }
    const candidate = findFunctionByName(name);
    if (candidate) {
      return {
        kind: "symbol",
        symbol: candidate,
        name,
        status: "resolved",
        virtual: candidate.extensions?.cpp?.virtual === true,
        functionPointer: false
      };
    }
    return {
      kind: "symbol",
      name,
      status: "unresolved",
      functionPointer: isFunctionPointerType(referenced?.type)
    };
  }
  function findFunctionByName(name) {
    const matches = symbols.filter(
      (symbol2) => (symbol2.kind === "function" || symbol2.kind === "method" || symbol2.kind === "constructor" || symbol2.kind === "destructor") && (symbol2.name === name || symbol2.name.endsWith(`::${name}`))
    );
    return matches.length === 1 ? matches[0] : null;
  }
  function finish(_unused) {
    const files = dedupeFiles([
      ...locator.fileRecords(),
      ...symbols.filter((symbol2) => symbol2.kind === "file").map((symbol2) => {
        const record = locator.fileRecords().find((entry) => entry.fileId === symbol2.declaration.fileId);
        return record ?? createFileRecord({
          fileId: symbol2.declaration.fileId,
          path: symbol2.qualifiedName,
          language,
          contentHash: `clang:${symbol2.qualifiedName}`,
          sizeBytes: 0,
          lineCount: 1
        });
      })
    ]);
    const partial = mode === "heuristic" || diagnostics.some((diagnostic) => diagnostic.severity === "error") || diagnostics.some((diagnostic) => diagnostic.code === "missing_compile_db");
    return createAnalysisRun({
      runId,
      adapterId,
      adapterVersion,
      language,
      csrVersion: CSR_VERSION,
      scope: { kind: "file", path: locator.tuPath },
      completeness: partial ? "partial" : "full",
      files,
      symbols,
      relationships: relationships2,
      controlConstructs: [],
      dataFacts: [],
      diagnostics,
      extensions: {
        cpp: {
          toolchain,
          mode,
          headerMap
        }
      }
    });
  }
}
function inner(node) {
  return Array.isArray(node.inner) ? node.inner.filter(isObject2) : [];
}
function functionKind(kind) {
  switch (kind) {
    case "CXXMethodDecl":
      return "method";
    case "CXXConstructorDecl":
      return "constructor";
    case "CXXDestructorDecl":
      return "destructor";
    case "CXXConversionDecl":
      return "method";
    default:
      return "function";
  }
}
function parseAst(text) {
  try {
    const value = JSON.parse(text);
    return isObject2(value) ? value : null;
  } catch {
    return null;
  }
}
function scanIncludes(text) {
  const found = [];
  if (typeof text !== "string" || text.length === 0) {
    return found;
  }
  const lines = text.split(/\r\n|\r|\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^\s*#\s*include\s*([<"])([^>"]+)[>"]/);
    if (match) {
      found.push({
        file: "",
        name: match[2].trim(),
        system: match[1] === "<",
        line: index,
        lineText: lines[index]
      });
    }
  }
  return found;
}
function parseStderr(stderr, tuPath) {
  const diagnostics = [];
  const lines = stderr.split(/\r\n|\r|\n/);
  for (const line of lines) {
    if (!/error:/i.test(line)) {
      continue;
    }
    const message = line.replace(/^.*?error:\s*/i, "").replace(new RegExp(escapeRegExp(tuPath), "g"), basename(tuPath)).trim();
    if (message.length === 0) {
      continue;
    }
    diagnostics.push(
      createDiagnostic({
        severity: "error",
        code: "parse_error",
        message: message.slice(0, 500)
      })
    );
    if (diagnostics.length >= 20) {
      break;
    }
  }
  if (diagnostics.length === 0) {
    diagnostics.push(
      createDiagnostic({
        severity: "warning",
        code: "parse_error",
        message: "Clang reported diagnostics for this translation unit."
      })
    );
  }
  return diagnostics;
}
function findReferencedDecl(node, depth = 0) {
  if (depth > 4 || !isObject2(node)) {
    return null;
  }
  if (isObject2(node.referencedDecl)) {
    return {
      id: typeof node.referencedDecl.id === "string" ? node.referencedDecl.id : void 0,
      name: typeof node.referencedDecl.name === "string" ? node.referencedDecl.name : void 0,
      kind: typeof node.referencedDecl.kind === "string" ? node.referencedDecl.kind : void 0,
      type: typeof node.referencedDecl.type?.qualType === "string" ? node.referencedDecl.type.qualType : void 0
    };
  }
  if (typeof node.referencedMemberDecl === "string") {
    return { id: node.referencedMemberDecl, name: node.name, kind: "CXXMethodDecl" };
  }
  for (const child of inner(node)) {
    const found = findReferencedDecl(child, depth + 1);
    if (found) {
      return found;
    }
  }
  return null;
}
function calleeName(node) {
  const name = typeof node.name === "string" ? node.name : "";
  if (name) {
    return name;
  }
  for (const child of inner(node)) {
    const found = calleeName(child);
    if (found) {
      return found;
    }
  }
  return "";
}
function isFunctionPointerType(type) {
  if (typeof type !== "string") {
    return false;
  }
  return /\(\s*\*/.test(type) || /std::function/.test(type) || /member function pointer/.test(type);
}
function dedupeFiles(records) {
  const byId2 = /* @__PURE__ */ new Map();
  for (const record of records) {
    if (!byId2.has(record.fileId)) {
      byId2.set(record.fileId, record);
    }
  }
  return [...byId2.values()].sort((left, right) => left.fileId.localeCompare(right.fileId));
}
function basename(filePath) {
  const parts = String(filePath).split(/[\\/]/);
  return parts[parts.length - 1] || filePath;
}
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function isObject2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// src/adapters/cpp/index.js
var CPP_ADAPTER_ID = "cpp-clang";
var CPP_ADAPTER_VERSION = "0.1.0";
var CPP_EXTENSIONS = Object.freeze([
  ".cpp",
  ".cc",
  ".cxx",
  ".c++",
  ".hpp",
  ".hh",
  ".hxx",
  ".ipp",
  ".h"
]);
var cppAdapter = {
  id: CPP_ADAPTER_ID,
  displayName: "C++ (Clang AST)",
  version: CPP_ADAPTER_VERSION,
  languages: ["cpp"],
  extensions: [...CPP_EXTENSIONS],
  capabilities: createCapabilities({
    // Parsing is real (Clang), but configuration and templates can make it
    // incomplete; declarations and calls are therefore honestly partial.
    parse: "partial",
    discoverDeclarations: true,
    resolveSymbols: "partial",
    resolveTypes: "partial",
    resolveCalls: "partial",
    generateCFG: false,
    generateDFG: false,
    resolveImports: "partial",
    mapSourceLocations: true,
    reportDiagnostics: true
  }),
  /**
   * @param {CppAnalyzeInput} input
   * @returns {import('../../core/csr/entities.js').AnalysisRun}
   */
  analyze(input) {
    return mapClangAst({
      runId: input.runId,
      path: input.path,
      text: input.text ?? "",
      workspaceRoot: input.workspaceRoot,
      ast: input.cppAst ?? null,
      mode: input.cppMode ?? "heuristic",
      warnings: Array.isArray(input.cppWarnings) ? input.cppWarnings : [],
      headerMap: input.cppHeaderMap ?? {},
      toolchain: input.cppToolchain ?? "clang",
      stderr: input.cppStderr ?? "",
      adapterId: CPP_ADAPTER_ID,
      adapterVersion: CPP_ADAPTER_VERSION
    });
  }
};

// src/extension/cpp/pipeline.js
var import_promises2 = __toESM(require("node:fs/promises"), 1);
var import_node_path3 = __toESM(require("node:path"), 1);

// src/core/csr/focus.js
function focusRunOnPath(run, path4) {
  const file = run.files.find((entry) => entry.path === path4);
  const source = (
    /** @type {AnalysisRun} */
    run
  );
  if (!file) {
    return {
      run: {
        ...source,
        scope: { kind: "file", path: path4 },
        symbols: [],
        relationships: [],
        controlConstructs: [],
        dataFacts: []
      },
      keptSymbols: 0,
      droppedSymbols: source.symbols.length,
      droppedRelationships: source.relationships.length
    };
  }
  const kept = source.symbols.filter((symbol2) => symbol2.declaration.fileId === file.fileId);
  const keptIds = new Set(kept.map((symbol2) => symbol2.symbolId));
  const symbols = kept.map((symbol2) => {
    if (symbol2.parentId && !keptIds.has(symbol2.parentId)) {
      const copy = { ...symbol2 };
      delete copy.parentId;
      return copy;
    }
    return symbol2;
  });
  const relationships2 = source.relationships.filter((relationship2) => {
    if (!keptIds.has(relationship2.from)) {
      return false;
    }
    if (relationship2.to.startsWith("external:")) {
      return true;
    }
    return keptIds.has(relationship2.to);
  });
  return {
    run: {
      ...source,
      scope: { kind: "file", path: path4 },
      symbols,
      relationships: relationships2,
      controlConstructs: source.controlConstructs.filter(
        (construct) => keptIds.has(construct.symbolId ?? "")
      ),
      dataFacts: source.dataFacts.filter((fact) => keptIds.has(fact.symbolId))
    },
    keptSymbols: symbols.length,
    droppedSymbols: source.symbols.length - symbols.length,
    droppedRelationships: source.relationships.length - relationships2.length
  };
}

// src/extension/security/paths.js
var import_node_path = __toESM(require("node:path"), 1);
var PathSafetyError = class extends Error {
  /**
   * @param {string} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = "PathSafetyError";
    this.code = code;
  }
};
function pathApi(platform) {
  return platform === "win32" ? import_node_path.default.win32 : import_node_path.default.posix;
}
function normalizeForCompare(value, platform = process.platform) {
  const api = pathApi(platform);
  const normalized = api.normalize(value);
  return platform === "win32" ? normalized.toLowerCase() : normalized;
}
function isPathInside(root, candidate, platform = process.platform) {
  if (typeof root !== "string" || typeof candidate !== "string") {
    return false;
  }
  if (candidate.includes("\0")) {
    return false;
  }
  const api = pathApi(platform);
  const normalizedRoot = normalizeForCompare(api.resolve(root), platform);
  const normalizedCandidate = normalizeForCompare(api.resolve(candidate), platform);
  if (normalizedRoot === normalizedCandidate) {
    return true;
  }
  const rootWithSeparator = normalizedRoot.endsWith(api.sep) ? normalizedRoot : `${normalizedRoot}${api.sep}`;
  return normalizedCandidate.startsWith(rootWithSeparator);
}
function toWorkspaceRelative(root, absolutePath, platform = process.platform) {
  if (!isPathInside(root, absolutePath, platform)) {
    throw new PathSafetyError("E_PATH", "Path is outside the workspace.");
  }
  const api = pathApi(platform);
  const relative = api.relative(api.resolve(root), api.resolve(absolutePath));
  return relative.split(api.sep).join("/");
}

// src/extension/cpp/compileDb.js
var import_promises = __toESM(require("node:fs/promises"), 1);
var import_node_path2 = __toESM(require("node:path"), 1);
var COMPILE_COMMANDS_FILENAME = "compile_commands.json";
function parseCompileCommands(json, workspaceRoot) {
  if (!Array.isArray(json)) {
    return {
      ok: false,
      code: "E_COMPILE_DB",
      message: "compile_commands.json must contain an array."
    };
  }
  const entries = [];
  const issues = [];
  for (let index = 0; index < json.length; index += 1) {
    const raw = json[index];
    if (!raw || typeof raw !== "object") {
      issues.push(`entries[${index}] is not an object`);
      continue;
    }
    const record = (
      /** @type {Record<string, unknown>} */
      raw
    );
    const directory = typeof record.directory === "string" ? record.directory : "";
    const file = typeof record.file === "string" ? record.file : "";
    if (directory.length === 0 || file.length === 0) {
      issues.push(`entries[${index}] is missing directory or file`);
      continue;
    }
    let args = [];
    if (Array.isArray(record.arguments) && record.arguments.every((arg) => typeof arg === "string")) {
      args = [...record.arguments];
    } else if (typeof record.command === "string") {
      args = splitCommandLine(record.command);
    }
    if (args.length === 0) {
      issues.push(`entries[${index}] has neither arguments nor a usable command`);
      continue;
    }
    const absoluteFile = import_node_path2.default.isAbsolute(file) ? import_node_path2.default.normalize(file) : import_node_path2.default.resolve(directory, file);
    const relative = import_node_path2.default.relative(workspaceRoot, absoluteFile);
    entries.push({
      directory,
      absoluteFile,
      path: toPosix2(relative),
      arguments: args,
      flags: flagsFromArguments(args, absoluteFile, file)
    });
  }
  return { ok: true, entries, issues };
}
function splitCommandLine(text) {
  const tokens = [];
  let current = "";
  let quote = "";
  let started = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quote) {
      if (character === quote) {
        quote = "";
      } else if (character === "\\" && index + 1 < text.length && text[index + 1] === quote) {
        current += quote;
        index += 1;
      } else {
        current += character;
      }
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      started = true;
      continue;
    }
    if (character === " " || character === "	" || character === "\r" || character === "\n") {
      if (started) {
        tokens.push(current);
        current = "";
        started = false;
      }
      continue;
    }
    current += character;
    started = true;
  }
  if (started) {
    tokens.push(current);
  }
  return tokens;
}
function flagsFromArguments(args, absoluteFile, sourceToken) {
  const flags = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (index === 0) {
      continue;
    }
    if (arg === absoluteFile || arg === sourceToken || arg === import_node_path2.default.basename(absoluteFile)) {
      continue;
    }
    if (arg === "-o" || arg === "/Fo" || arg === "/Fe") {
      index += 1;
      continue;
    }
    if (arg.startsWith("-o") && arg.length > 2) {
      continue;
    }
    if (arg === "-c" || arg === "/c") {
      continue;
    }
    if (arg === "-MD" || arg === "-MMD" || arg === "-MP" || arg === "-MF") {
      if (arg === "-MF") {
        index += 1;
      }
      continue;
    }
    flags.push(arg);
  }
  return flags;
}
function heuristicFlags(options = {}) {
  const flags = [];
  const standard = options.standard ?? "c++17";
  flags.push(`-std=${standard}`);
  for (const define of options.defines ?? []) {
    flags.push(`-D${define}`);
  }
  for (const includePath of options.includePaths ?? []) {
    flags.push(`-I${includePath}`);
  }
  return flags;
}
async function discoverCompileDb(options) {
  const { workspaceRoot, configuredPath } = options;
  const readFile = options.readFile ?? import_promises.default.readFile;
  const readDir = options.readDir ?? import_promises.default.readdir;
  const candidates = [];
  if (typeof configuredPath === "string" && configuredPath.trim().length > 0) {
    candidates.push(import_node_path2.default.resolve(workspaceRoot, configuredPath.trim()));
  }
  candidates.push(import_node_path2.default.join(workspaceRoot, COMPILE_COMMANDS_FILENAME));
  for (const child of await safeReadDir(workspaceRoot, readDir)) {
    if (child.isDirectory() && /^cmake-build-/.test(child.name)) {
      candidates.push(import_node_path2.default.join(workspaceRoot, child.name, COMPILE_COMMANDS_FILENAME));
    }
  }
  for (const directory of ["build", "out"]) {
    candidates.push(import_node_path2.default.join(workspaceRoot, directory, COMPILE_COMMANDS_FILENAME));
  }
  for (const found of await findCompileCommands(workspaceRoot, 3, readDir)) {
    candidates.push(found);
  }
  const unique = [...new Set(candidates)];
  const databases = [];
  const issues = [];
  for (const candidate of unique) {
    let text;
    try {
      text = await readFile(candidate, "utf8");
    } catch {
      continue;
    }
    let parsedJson;
    try {
      parsedJson = JSON.parse(String(text));
    } catch (error) {
      issues.push(`${candidate}: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    const parsed = parseCompileCommands(parsedJson, workspaceRoot);
    if (!parsed.ok) {
      issues.push(`${candidate}: ${parsed.message}`);
      continue;
    }
    issues.push(...parsed.issues.map((issue) => `${candidate}: ${issue}`));
    databases.push({ path: candidate, entries: parsed.entries });
  }
  if (databases.length === 0) {
    return {
      ok: false,
      code: "E_COMPILE_DB",
      message: "No readable compile_commands.json was found; heuristic mode is required.",
      candidates: unique,
      issues
    };
  }
  databases.sort(
    (left, right) => right.entries.length - left.entries.length || left.path.localeCompare(right.path)
  );
  return {
    ok: true,
    choice: databases[0],
    candidates: unique,
    issues
  };
}
function matchCompileEntry(entries, absoluteFile, platform = process.platform) {
  const normalized = import_node_path2.default.normalize(absoluteFile);
  for (const entry of entries) {
    if (import_node_path2.default.normalize(entry.absoluteFile) === normalized) {
      return entry;
    }
  }
  if (platform === "win32") {
    const lower = normalized.toLowerCase();
    for (const entry of entries) {
      if (import_node_path2.default.normalize(entry.absoluteFile).toLowerCase() === lower) {
        return entry;
      }
    }
  }
  return null;
}
async function findCompileCommands(root, maxDepth, readDir) {
  const found = [];
  const queue = [{ directory: root, depth: 0 }];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }
    const entries = await safeReadDir(current.directory, readDir);
    for (const entry of entries) {
      if (entry.isFile() && entry.name === COMPILE_COMMANDS_FILENAME) {
        found.push(import_node_path2.default.join(current.directory, entry.name));
      }
      if (entry.isDirectory() && current.depth < maxDepth && !["node_modules", ".git", "dist", ".codeflow"].includes(entry.name)) {
        queue.push({
          directory: import_node_path2.default.join(current.directory, entry.name),
          depth: current.depth + 1
        });
      }
    }
  }
  return found;
}
async function safeReadDir(directory, readDir) {
  try {
    return await readDir(directory, { withFileTypes: true });
  } catch {
    return [];
  }
}
function toPosix2(value) {
  return value.split(import_node_path2.default.sep).join("/");
}

// src/extension/cpp/analysisConfig.js
function decideAnalysisConfig({ absoluteFile, compileDb, settings = {}, platform }) {
  const entry = compileDb ? matchCompileEntry(compileDb.entries, absoluteFile, platform) : null;
  if (entry) {
    return {
      mode: "compile-db",
      flags: [...entry.flags],
      entry,
      warnings: []
    };
  }
  return {
    mode: "heuristic",
    flags: heuristicFlags({
      includePaths: settings.includePaths ?? [],
      defines: settings.defines ?? [],
      standard: settings.standard ?? standardForFile(absoluteFile)
    }),
    entry: null,
    warnings: [
      {
        code: "missing_compile_db",
        message: "No compilation database entry covers this file. Flags are inferred, so system headers and macros may be unresolved."
      }
    ]
  };
}
function standardForFile(absoluteFile) {
  return /\.(c|h)$/i.test(absoluteFile) ? "c11" : "c++17";
}
function buildClangArgs({ absoluteFile, config, extraArgs = [] }) {
  const args = [];
  const sanitized = sanitizeFlags(config.flags);
  if (!sanitized.some((flag) => flag.startsWith("-std="))) {
    const standard = standardForFile(absoluteFile);
    args.push(`-std=${standard}`);
  }
  args.push("-fsyntax-only");
  args.push(...extraArgs);
  args.push("-Xclang", "-ast-dump=json");
  args.push(...sanitized);
  args.push(absoluteFile);
  return args;
}
function sanitizeFlags(flags) {
  const output = [];
  for (let index = 0; index < flags.length; index += 1) {
    const flag = flags[index];
    if (typeof flag !== "string" || flag.length === 0) {
      continue;
    }
    if (flag.startsWith("@")) {
      continue;
    }
    if (flag === "-Xclang") {
      const next = flags[index + 1];
      if (next === "-load" || next === "-plugin" || next === "-add-plugin") {
        index += flags[index + 2] === "-Xclang" ? 4 : 2;
        continue;
      }
      output.push(flag);
      continue;
    }
    if (flag.startsWith("-fplugin=") || flag.startsWith("-load")) {
      continue;
    }
    if (flag === "-fplugin") {
      index += 1;
      continue;
    }
    if (flag === "-o" || flag === "/o" || flag === "/Fo") {
      index += 1;
      continue;
    }
    if (flag === "-MJ" || flag === "--serialize-diagnostics") {
      index += 1;
      continue;
    }
    if (flag.startsWith("-MJ")) {
      continue;
    }
    output.push(flag);
  }
  return output;
}

// src/extension/cpp/clang.js
var MIN_CLANG_MAJOR = 15;
function parseClangVersion(text) {
  if (typeof text !== "string") {
    return null;
  }
  const match = text.match(/(?:Apple\s+)?clang(?:-cl)?\s+version\s+(\d+)\.(\d+)(?:\.(\d+))?/i);
  if (!match) {
    return null;
  }
  return {
    version: `${match[1]}.${match[2]}${match[3] ? `.${match[3]}` : ""}`,
    major: Number(match[1])
  };
}
function defaultClangCandidates(platform = process.platform) {
  if (platform === "win32") {
    return ["clang++.exe", "clang.exe", "clang-cl.exe"];
  }
  return ["clang++", "clang"];
}
async function discoverClang({ runTool: runTool2, configuredPath, candidates }) {
  const list = [];
  if (typeof configuredPath === "string" && configuredPath.trim().length > 0) {
    list.push(configuredPath.trim());
  }
  for (const candidate of candidates ?? defaultClangCandidates()) {
    if (typeof candidate === "string" && candidate.length > 0 && !list.includes(candidate)) {
      list.push(candidate);
    }
  }
  for (const command of list) {
    const probe = await runTool2({
      command,
      args: ["--version"],
      timeoutMs: 5e3,
      maxOutputBytes: 64 * 1024
    });
    if (!probe.ok || probe.exitCode !== 0) {
      continue;
    }
    const parsed = parseClangVersion(probe.stdout) ?? parseClangVersion(probe.stderr);
    if (!parsed) {
      continue;
    }
    const compatible = parsed.major !== null && parsed.major >= MIN_CLANG_MAJOR;
    const result = {
      ok: true,
      clang: {
        path: command,
        version: parsed.version,
        major: parsed.major,
        compatible
      }
    };
    if (!compatible) {
      result.warning = {
        code: "toolchain_version_mismatch",
        message: `Clang ${parsed.version} is older than the supported minimum ${MIN_CLANG_MAJOR}. Analysis will be partial.`
      };
    }
    return result;
  }
  return {
    ok: false,
    code: "E_UNSUPPORTED",
    message: 'No Clang toolchain was found. Set "codeflow.cpp.clangPath" or add clang++ to PATH. CodeFlow never runs your build system; see docs/LANGUAGE_ADAPTERS.md for setup.'
  };
}

// src/extension/cpp/headers.js
function extractIncludes(text) {
  if (typeof text !== "string") {
    return [];
  }
  const includes = [];
  const pattern = /^[ \t]*#[ \t]*include[ \t]*([<"])([^>"]+)[>"]/gm;
  for (const match of text.matchAll(pattern)) {
    const before = text.slice(0, match.index ?? 0);
    const line = before.split("\n").length - 1;
    includes.push({
      name: match[2].trim(),
      system: match[1] === "<",
      line
    });
  }
  return includes;
}
function isHeaderPath(filePath) {
  return /\.(h|hh|hpp|hxx|ipp)$/i.test(String(filePath));
}
function selectRepresentativeTu({ headerPath, entries, includesByTu }) {
  const normalizedHeader = toPosix3(headerPath);
  const headerName = basename2(normalizedHeader);
  const matches = [];
  for (const entry of entries) {
    const includes = includesByTu[entry.path] ?? [];
    for (const include of includes) {
      if (include.system) {
        continue;
      }
      const includeName = toPosix3(include.name);
      const tuDirectory = dirname(toPosix3(entry.path));
      const resolvedRelative = normalize(`${tuDirectory}/${includeName}`);
      if (resolvedRelative === normalizedHeader) {
        matches.push({ entry, reason: "same_directory" });
        break;
      }
      if (basename2(includeName) === headerName) {
        matches.push({ entry, reason: "basename" });
        break;
      }
    }
  }
  if (matches.length === 0) {
    return null;
  }
  matches.sort(
    (left, right) => (left.reason === right.reason ? 0 : left.reason === "same_directory" ? -1 : 1) || left.entry.path.localeCompare(right.entry.path)
  );
  const best = matches[0];
  return {
    tu: best.entry,
    candidates: matches.map((match) => match.entry.path),
    reason: best.reason
  };
}
function buildHeaderMap({ headerPaths, entries, includesByTu }) {
  const map = {};
  const unmapped = [];
  for (const headerPath of [...headerPaths].sort()) {
    const selected = selectRepresentativeTu({ headerPath, entries, includesByTu });
    if (!selected) {
      unmapped.push(headerPath);
      continue;
    }
    map[headerPath] = {
      tuPath: selected.tu.path,
      candidates: selected.candidates,
      reason: selected.reason
    };
  }
  return { map, unmapped };
}
function toPosix3(value) {
  return String(value).replace(/\\/g, "/");
}
function basename2(value) {
  const parts = value.split("/");
  return parts[parts.length - 1];
}
function dirname(value) {
  const index = value.lastIndexOf("/");
  return index === -1 ? "" : value.slice(0, index);
}
function normalize(value) {
  const output = [];
  for (const segment of value.split("/")) {
    if (segment === "" || segment === ".") {
      continue;
    }
    if (segment === "..") {
      output.pop();
      continue;
    }
    output.push(segment);
  }
  return output.join("/");
}

// src/extension/cpp/pipeline.js
var DEFAULT_TIMEOUT_MS = 6e4;
var DEFAULT_MAX_OUTPUT_BYTES = 64 * 1024 * 1024;
var DEFAULT_MAX_TU_BYTES = 4 * 1024 * 1024;
var DEFAULT_MAX_HEADER_CANDIDATES = 200;
var DISCOVERY_TTL_MS = 3e4;
function createCppAnalysisService(options) {
  const {
    registry,
    runTool: runTool2,
    readFile = import_promises2.default.readFile,
    readDir = import_promises2.default.readdir,
    logger = {},
    discoverClangFn = discoverClang,
    discoverCompileDbFn = discoverCompileDb,
    now = () => Date.now(),
    platform = process.platform
  } = options;
  const compileCache = /* @__PURE__ */ new Map();
  const clangCache = /* @__PURE__ */ new Map();
  function currentSettings() {
    const value = typeof options.settings === "function" ? options.settings() : options.settings;
    return normalizeSettings(value ?? {});
  }
  async function analyze(input) {
    const adapter = registry.resolve(input?.path ?? "");
    if (!adapter || adapter.id !== CPP_ADAPTER_ID) {
      return registry.analyze(input);
    }
    let prepared;
    try {
      prepared = await prepare(input);
    } catch (error) {
      logger.error?.("cpp.prepare_failed", {
        error: error instanceof Error ? error.message : String(error)
      });
      return {
        ok: false,
        code: "E_INTERNAL",
        message: `C++ analysis could not be prepared: ${error instanceof Error ? error.message : String(error)}`
      };
    }
    if (!prepared.ok) {
      return prepared;
    }
    const result = await registry.analyze(prepared.value.input);
    if (!result.ok || !prepared.value.focused) {
      return result;
    }
    const focused = focusRunOnPath(result.run, prepared.value.focusPath);
    focused.run.completeness = "partial";
    focused.run.diagnostics = [
      ...focused.run.diagnostics,
      {
        severity: "info",
        code: "out_of_scope",
        message: `The header was analysed through the representative translation unit "${prepared.value.targetPath}". Declarations from other files are excluded.`,
        affects: []
      }
    ];
    return { ...result, run: focused.run };
  }
  async function prepare(input) {
    const settings = currentSettings();
    if (!input || typeof input !== "object") {
      return failure("E_INPUT", "Analysis input must be an object.");
    }
    const workspaceRoot = input.workspaceRoot;
    if (typeof workspaceRoot !== "string" || workspaceRoot.length === 0) {
      return failure("E_INPUT", "Open a workspace folder before analysing C++ files.");
    }
    if (input.trusted === false) {
      return failure(
        "E_UNTRUSTED",
        "CodeFlow does not read workspace files in Restricted Mode. Trust the workspace first."
      );
    }
    if (typeof input.path !== "string" || input.path.length === 0) {
      return failure("E_INPUT", "A file path is required.");
    }
    if (input.path.includes("\0")) {
      return failure("E_INPUT", "The file path contains an invalid character.");
    }
    const absolutePath = import_node_path3.default.isAbsolute(input.path) ? import_node_path3.default.normalize(input.path) : import_node_path3.default.resolve(workspaceRoot, input.path);
    if (!isPathInside(workspaceRoot, absolutePath, platform)) {
      return failure("E_INPUT", "The file is outside the workspace.");
    }
    let relativePath;
    try {
      relativePath = toWorkspaceRelative(workspaceRoot, absolutePath, platform);
    } catch {
      return failure("E_INPUT", "The file is outside the workspace.");
    }
    const source = await readSource(absolutePath, settings.maxTuBytes);
    if (!source.ok) {
      return failure("E_INPUT", source.message);
    }
    const [compileDb, clang] = await Promise.all([
      getCompileDb(workspaceRoot, settings),
      getClang(settings)
    ]);
    if (!clang.ok) {
      return failure(clang.code, clang.message);
    }
    let targetAbsolute = absolutePath;
    let targetPath = relativePath;
    let targetText = source.text;
    let headerMap = {};
    const warnings = [];
    const header = isHeaderPath(relativePath);
    if (header && compileDb.ok && compileDb.choice.entries.length > 0) {
      const includesByTu = await readIncludesForEntries(
        workspaceRoot,
        compileDb.choice.entries,
        settings
      );
      const mapped = buildHeaderMap({
        headerPaths: [relativePath],
        entries: compileDb.choice.entries,
        includesByTu
      });
      const choice = mapped.map[relativePath];
      if (choice) {
        const entry = compileDb.choice.entries.find(
          (candidate) => candidate.path === choice.tuPath
        );
        if (entry) {
          targetAbsolute = entry.absoluteFile;
          targetPath = entry.path;
          const tuSource = await readSource(targetAbsolute, settings.maxTuBytes);
          if (!tuSource.ok) {
            return failure("E_INPUT", tuSource.message);
          }
          targetText = tuSource.text;
          headerMap = { [relativePath]: choice };
        }
      } else {
        pushWarning(
          warnings,
          "header_without_tu",
          `No translation unit in the compilation database includes "${relativePath}". The header is analysed syntactically and may be incomplete.`
        );
      }
    } else if (header) {
      pushWarning(
        warnings,
        "header_without_tu",
        `No translation unit was available for "${relativePath}". The header is analysed syntactically and may be incomplete.`
      );
    }
    const config = decideAnalysisConfig({
      absoluteFile: targetAbsolute,
      compileDb: compileDb.ok ? compileDb.choice : null,
      settings: {
        includePaths: settings.fallbackIncludePaths,
        defines: settings.fallbackDefines,
        standard: settings.fallbackStandard || void 0
      },
      platform
    });
    for (const warning of config.warnings) {
      pushWarning(warnings, warning.code, warning.message);
    }
    if (!clang.clang.compatible) {
      pushWarning(
        warnings,
        "toolchain_version_mismatch",
        `Clang ${clang.clang.version} is outside the supported range. Results may be incomplete.`
      );
    }
    const args = buildClangArgs({
      absoluteFile: targetAbsolute,
      config
    });
    const tool = await runTool2({
      command: clang.clang.path,
      args,
      cwd: workspaceRoot,
      timeoutMs: settings.timeoutMs,
      maxOutputBytes: settings.maxOutputBytes,
      ...isAbortSignal(input.cancellation) ? { signal: input.cancellation } : {}
    });
    let ast = null;
    let stderr = "";
    if (tool.ok) {
      stderr = sanitizeDiagnostics(tool.stderr ?? "", workspaceRoot, targetAbsolute, targetPath);
      if (typeof tool.stdout === "string" && tool.stdout.trim().length > 0) {
        try {
          ast = JSON.parse(tool.stdout);
        } catch {
          pushWarning(
            warnings,
            "parse_error",
            "Clang produced output that was not a complete JSON AST; the run is limited to diagnostics."
          );
        }
      }
      if (/file not found/i.test(tool.stderr ?? "")) {
        pushWarning(
          warnings,
          "missing_system_headers",
          "Clang could not find one or more headers. Add the include paths your build uses, or generate a compilation database."
        );
      }
    } else if (tool.code === "E_TOOL_NOT_FOUND") {
      return failure("E_UNSUPPORTED", tool.message);
    } else if (tool.code === "E_TOOL_TIMEOUT") {
      pushWarning(
        warnings,
        "budget_exceeded",
        tool.message || "Clang exceeded the analysis time budget."
      );
      stderr = sanitizeDiagnostics(tool.stderr ?? "", workspaceRoot, targetAbsolute, targetPath);
    } else if (tool.code === "E_TOOL_LIMIT") {
      pushWarning(
        warnings,
        "budget_exceeded",
        tool.message || "The AST exceeded the output size budget."
      );
      stderr = sanitizeDiagnostics(tool.stderr ?? "", workspaceRoot, targetAbsolute, targetPath);
    } else if (tool.code === "E_CANCELLED") {
      pushWarning(warnings, "cancelled", "The analysis was cancelled.");
    } else {
      pushWarning(warnings, "adapter_error", tool.message || "Clang could not be executed.");
    }
    const focused = header && targetPath !== relativePath;
    return {
      ok: true,
      value: {
        targetPath,
        focusPath: focused ? relativePath : relativePath,
        focused,
        input: {
          ...input,
          path: relativePath,
          workspaceRoot,
          text: targetText,
          cppAst: ast,
          cppMode: config.mode,
          cppWarnings: warnings,
          cppHeaderMap: headerMap,
          cppToolchain: `clang ${clang.clang.version}`,
          cppStderr: stderr.slice(0, 16 * 1024)
        }
      }
    };
  }
  async function getCompileDb(workspaceRoot, settings) {
    const key = `${workspaceRoot}|${settings.compileCommandsPath}`;
    const cached = compileCache.get(key);
    if (cached && now() - cached.at < DISCOVERY_TTL_MS) {
      return cached.value;
    }
    const value = await discoverCompileDbFn({
      workspaceRoot,
      configuredPath: settings.compileCommandsPath,
      readFile,
      readDir
    });
    compileCache.set(key, { at: now(), value });
    return value;
  }
  async function getClang(settings) {
    const key = settings.clangPath;
    const cached = clangCache.get(key);
    if (cached && now() - cached.at < DISCOVERY_TTL_MS) {
      return cached.value;
    }
    const value = await discoverClangFn({ runTool: runTool2, configuredPath: key });
    clangCache.set(key, { at: now(), value });
    return value;
  }
  async function readIncludesForEntries(workspaceRoot, entries, settings) {
    const includesByTu = {};
    const candidates = [...entries].filter((entry) => isPathInside(workspaceRoot, entry.absoluteFile, platform)).sort((left, right) => left.path.localeCompare(right.path)).slice(0, DEFAULT_MAX_HEADER_CANDIDATES);
    for (const entry of candidates) {
      const text = await readSource(entry.absoluteFile, settings.maxTuBytes);
      if (text.ok) {
        includesByTu[entry.path] = extractIncludes(text.text);
      }
    }
    return includesByTu;
  }
  async function readSource(absolutePath, maxBytes) {
    let text;
    try {
      text = await readFile(absolutePath, "utf8");
    } catch {
      return { ok: false, message: `Could not read "${import_node_path3.default.basename(absolutePath)}".` };
    }
    if (typeof text !== "string") {
      return { ok: false, message: `Could not read "${import_node_path3.default.basename(absolutePath)}" as text.` };
    }
    if (Buffer.byteLength(text, "utf8") > maxBytes) {
      return {
        ok: false,
        message: `"${import_node_path3.default.basename(absolutePath)}" is larger than the ${Math.round(
          maxBytes / (1024 * 1024)
        )} MiB analysis budget.`
      };
    }
    return { ok: true, text };
  }
  return {
    analyze,
    prepare,
    reset() {
      compileCache.clear();
      clangCache.clear();
    },
    /** Test/telemetry hook. */
    cacheSizes: () => ({ compile: compileCache.size, clang: clangCache.size })
  };
}
function isAbortSignal(value) {
  return Boolean(value) && typeof value === "object" && "aborted" in value;
}
function failure(code, message) {
  return { ok: false, code, message };
}
function normalizeSettings(input) {
  return {
    clangPath: typeof input.clangPath === "string" ? input.clangPath.trim() : "",
    compileCommandsPath: typeof input.compileCommandsPath === "string" ? input.compileCommandsPath.trim() : "",
    fallbackIncludePaths: stringArray(input.fallbackIncludePaths),
    fallbackDefines: stringArray(input.fallbackDefines),
    fallbackStandard: typeof input.fallbackStandard === "string" ? input.fallbackStandard : "",
    timeoutMs: Number.isFinite(input.timeoutMs) && input.timeoutMs > 0 ? input.timeoutMs : DEFAULT_TIMEOUT_MS,
    maxOutputBytes: Number.isFinite(input.maxOutputBytes) && input.maxOutputBytes > 0 ? input.maxOutputBytes : DEFAULT_MAX_OUTPUT_BYTES,
    maxTuBytes: Number.isFinite(input.maxTuBytes) && input.maxTuBytes > 0 ? input.maxTuBytes : DEFAULT_MAX_TU_BYTES
  };
}
function stringArray(value) {
  return Array.isArray(value) ? value.filter((entry) => typeof entry === "string" && entry.length > 0) : [];
}
function pushWarning(warnings, code, message) {
  if (!warnings.some((warning) => warning.code === code && warning.message === message)) {
    warnings.push({ code, message });
  }
}
function sanitizeDiagnostics(text, workspaceRoot, absoluteFile, relativeFile) {
  if (typeof text !== "string" || text.length === 0) {
    return "";
  }
  const forms = (value) => [String(value), String(value).replace(/\\/g, "/")];
  let output = text;
  for (const form of forms(absoluteFile)) {
    output = output.split(form).join(relativeFile);
  }
  for (const form of forms(workspaceRoot)) {
    output = output.split(form).join("<workspace>");
  }
  return output.slice(0, 32 * 1024);
}

// src/extension/tooling/runTool.js
var import_node_child_process = require("node:child_process");
var DEFAULT_TIMEOUT_MS2 = 6e4;
var DEFAULT_MAX_OUTPUT_BYTES2 = 64 * 1024 * 1024;
var ENV_ALLOWLIST = Object.freeze([
  "PATH",
  "Path",
  "PATHEXT",
  "SystemRoot",
  "SYSTEMROOT",
  "WINDIR",
  "TEMP",
  "TMP",
  "HOME",
  "USERPROFILE",
  "LOCALAPPDATA",
  "PROGRAMDATA",
  "PROGRAMFILES",
  "PROGRAMFILES(X86)",
  "INCLUDE",
  "LIB",
  "LIBPATH",
  "LANG",
  "LC_ALL"
]);
function runTool(options) {
  const {
    command,
    args = [],
    cwd,
    timeoutMs = DEFAULT_TIMEOUT_MS2,
    maxOutputBytes = DEFAULT_MAX_OUTPUT_BYTES2,
    signal,
    env
  } = options ?? {};
  if (typeof command !== "string" || command.length === 0) {
    return Promise.resolve({
      ok: false,
      code: "E_TOOL_ERROR",
      message: "runTool requires a non-empty command."
    });
  }
  if (!Array.isArray(args) || args.some((arg) => typeof arg !== "string")) {
    return Promise.resolve({
      ok: false,
      code: "E_TOOL_ERROR",
      message: "runTool args must be an array of strings."
    });
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return Promise.resolve({
      ok: false,
      code: "E_TOOL_ERROR",
      message: "runTool timeoutMs must be a positive number."
    });
  }
  if (!Number.isFinite(maxOutputBytes) || maxOutputBytes <= 0) {
    return Promise.resolve({
      ok: false,
      code: "E_TOOL_ERROR",
      message: "runTool maxOutputBytes must be a positive number."
    });
  }
  if (signal?.aborted) {
    return Promise.resolve({
      ok: false,
      code: "E_CANCELLED",
      message: "Tool execution was cancelled before it started."
    });
  }
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const stdoutChunks = [];
    const stderrChunks = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let settled = false;
    const timers = {};
    const finish = (result) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timers.handle) {
        clearTimeout(timers.handle);
      }
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
      resolve({ ...result, durationMs: result.durationMs ?? Date.now() - startedAt });
    };
    let child;
    try {
      child = (0, import_node_child_process.spawn)(command, args, {
        cwd,
        shell: false,
        windowsHide: true,
        detached: process.platform !== "win32",
        stdio: ["ignore", "pipe", "pipe"],
        env: buildEnvironment(env)
      });
    } catch (error) {
      finish({
        ok: false,
        code: "E_TOOL_ERROR",
        message: `Could not start "${command}": ${error instanceof Error ? error.message : String(error)}`
      });
      return;
    }
    const onAbort = () => {
      killTree(child);
      finish({
        ok: false,
        code: "E_CANCELLED",
        message: "Tool execution was cancelled.",
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: Buffer.concat(stderrChunks).toString("utf8")
      });
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    timers.handle = setTimeout(() => {
      killTree(child);
      finish({
        ok: false,
        code: "E_TOOL_TIMEOUT",
        message: `Tool "${command}" exceeded the ${timeoutMs} ms budget.`,
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: Buffer.concat(stderrChunks).toString("utf8")
      });
    }, timeoutMs);
    timers.handle.unref?.();
    child.stdout?.on("data", (chunk) => {
      if (settled) {
        return;
      }
      stdoutBytes += chunk.length;
      if (stdoutBytes > maxOutputBytes) {
        killTree(child);
        finish({
          ok: false,
          code: "E_TOOL_LIMIT",
          message: `Tool "${command}" exceeded the ${maxOutputBytes}-byte output cap.`,
          stdout: Buffer.concat(stdoutChunks).toString("utf8"),
          stderr: Buffer.concat(stderrChunks).toString("utf8")
        });
        return;
      }
      stdoutChunks.push(chunk);
    });
    child.stderr?.on("data", (chunk) => {
      if (settled) {
        return;
      }
      stderrBytes += chunk.length;
      if (stderrBytes > maxOutputBytes) {
        killTree(child);
        finish({
          ok: false,
          code: "E_TOOL_LIMIT",
          message: `Tool "${command}" exceeded the ${maxOutputBytes}-byte stderr cap.`,
          stdout: Buffer.concat(stdoutChunks).toString("utf8"),
          stderr: Buffer.concat(stderrChunks).toString("utf8")
        });
        return;
      }
      stderrChunks.push(chunk);
    });
    child.on("error", (error) => {
      const notFound = (
        /** @type {{code?: string}} */
        error.code === "ENOENT" ? "E_TOOL_NOT_FOUND" : "E_TOOL_ERROR"
      );
      finish({
        ok: false,
        code: notFound,
        message: notFound === "E_TOOL_NOT_FOUND" ? `Tool "${command}" was not found.` : `Tool "${command}" failed to start: ${error.message}`
      });
    });
    child.on("close", (exitCode, exitSignal) => {
      finish({
        ok: true,
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: Buffer.concat(stderrChunks).toString("utf8"),
        exitCode,
        signal: exitSignal
      });
    });
  });
}
function buildEnvironment(extra) {
  const env = {};
  for (const key of ENV_ALLOWLIST) {
    if (typeof process.env[key] === "string") {
      env[key] = process.env[key];
    }
  }
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (typeof value === "string") {
        env[key] = value;
      }
    }
  }
  return env;
}
function killTree(child) {
  if (!child || child.killed || typeof child.pid !== "number") {
    return;
  }
  if (process.platform === "win32") {
    try {
      (0, import_node_child_process.spawn)("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        windowsHide: true,
        stdio: "ignore",
        shell: false
      });
    } catch {
      child.kill();
    }
    return;
  }
  try {
    process.kill(-child.pid, "SIGKILL");
  } catch {
    child.kill("SIGKILL");
  }
}

// src/extension/panel.js
var vscode2 = __toESM(require("vscode"), 1);
var import_node_crypto = __toESM(require("node:crypto"), 1);

// src/extension/panelTemplate.js
function renderPanelHtml({ nonce, cspSource, scriptUri, styleUri, title = "CodeFlow" }) {
  const csp = [
    "default-src 'none'",
    `img-src ${cspSource} data:`,
    `style-src ${cspSource}`,
    `font-src ${cspSource}`,
    `script-src 'nonce-${nonce}'`,
    "connect-src 'none'",
    "base-uri 'none'",
    "form-action 'none'"
  ].join("; ");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="${csp}" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="${styleUri}" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
    <header class="cf-header">
      <div class="cf-title">
        <span class="cf-mark" aria-hidden="true"></span>
        <span id="cf-title-text">CodeFlow</span>
      </div>
      <div id="cf-meta" class="cf-meta" role="status" aria-live="polite">Loading\u2026</div>
      <div class="cf-actions">
        <button id="cf-refresh" type="button" class="cf-button" title="Reload the graph">
          Reload
        </button>
      </div>
    </header>

    <div id="cf-banner" class="cf-banner" role="alert" hidden></div>

    <main class="cf-main">
      <section class="cf-canvas-wrap" aria-label="Graph">
        <svg
          id="cf-graph"
          class="cf-graph"
          role="img"
          aria-label="CodeFlow graph"
          tabindex="0"
        ></svg>
        <div id="cf-empty" class="cf-empty" hidden>
          <p>No graph loaded.</p>
        </div>
      </section>
      <aside class="cf-detail" aria-label="Selection details">
        <h2 class="cf-detail-title">Selection</h2>
        <div id="cf-detail-body" class="cf-detail-body">
          <p class="cf-muted">Select a node to inspect it.</p>
        </div>
        <h2 class="cf-detail-title">Legend</h2>
        <ul id="cf-legend" class="cf-legend"></ul>
      </aside>
    </main>

    <footer class="cf-footer">
      <span id="cf-status" class="cf-status">Starting\u2026</span>
      <span class="cf-hint">Pan: drag \xB7 Zoom: wheel \xB7 Select: click</span>
    </footer>

    <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>`;
}
function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// src/core/protocol/envelope.js
var PROTOCOL_VERSION = 1;
var MAX_PAYLOAD_BYTES = 1e6;
var KIND_PATTERN = /^[a-z]+(\.[a-z]+)+$/;
var REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
var WEBVIEW_TO_HOST = Object.freeze([
  "webview.ready",
  "graph.load",
  "csr.load",
  "node.select",
  "panel.ping",
  "query.symbol",
  "query.symbols",
  "query.callers",
  "query.callees",
  "query.constructs",
  "query.capabilities"
]);
var HOST_TO_WEBVIEW = Object.freeze([
  "graph.data",
  "capabilities.data",
  "csr.data",
  "query.data",
  "analysis.progress",
  "protocol.error",
  "protocol.ack",
  "panel.pong"
]);
var DIRECTIONS = Object.freeze({
  WEBVIEW_TO_HOST: "webview_to_host",
  HOST_TO_WEBVIEW: "host_to_webview"
});
var KIND_ALLOWLIST = Object.freeze({
  [DIRECTIONS.WEBVIEW_TO_HOST]: new Set(WEBVIEW_TO_HOST),
  [DIRECTIONS.HOST_TO_WEBVIEW]: new Set(HOST_TO_WEBVIEW)
});
var UNSAFE_KEYS = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);
var MAX_KEY_SCAN_DEPTH = 8;
function createEnvelope(kind, payload, requestId) {
  const envelope = {
    protocolVersion: PROTOCOL_VERSION,
    kind,
    payload: payload ?? {}
  };
  if (requestId) {
    envelope.requestId = requestId;
  }
  return envelope;
}
function createErrorPayload(code, message, detail) {
  const payload = { code, message };
  if (detail) {
    payload.detail = detail;
  }
  return payload;
}
function messageSize(value) {
  try {
    const json = JSON.stringify(value);
    return typeof json === "string" ? json.length : 0;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}
function isPlainObject4(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function scanUnsafeKeys(value, path4, depth) {
  if (depth > MAX_KEY_SCAN_DEPTH || value === null || typeof value !== "object") {
    return { ok: true };
  }
  const entries = Array.isArray(value) ? value.entries() : Object.entries(value);
  for (const [key, child] of entries) {
    const childPath = Array.isArray(value) ? `${path4}[${key}]` : `${path4}.${key}`;
    if (!Array.isArray(value) && UNSAFE_KEYS.has(String(key))) {
      return { ok: false, path: childPath, key: String(key) };
    }
    const nested = scanUnsafeKeys(child, childPath, depth + 1);
    if (!nested.ok) {
      return nested;
    }
  }
  return { ok: true };
}
function validateEnvelope(raw, options) {
  const direction = options?.direction;
  const allowlist = KIND_ALLOWLIST[direction];
  if (!allowlist) {
    return {
      ok: false,
      code: "E_PROTOCOL",
      reason: "unknown_direction",
      message: `Unknown protocol direction: ${String(direction)}`
    };
  }
  if (!isPlainObject4(raw)) {
    return {
      ok: false,
      code: "E_PROTOCOL",
      reason: "not_an_object",
      message: "Message must be a plain object."
    };
  }
  const candidate = (
    /** @type {Record<string, unknown>} */
    raw
  );
  if (candidate.protocolVersion !== PROTOCOL_VERSION) {
    return {
      ok: false,
      code: "E_PROTOCOL",
      reason: "version_mismatch",
      message: `Unsupported protocol version: expected ${PROTOCOL_VERSION}, received ${String(
        candidate.protocolVersion
      )}.`
    };
  }
  const kind = candidate.kind;
  if (typeof kind !== "string" || !KIND_PATTERN.test(kind)) {
    return {
      ok: false,
      code: "E_PROTOCOL",
      reason: "invalid_kind",
      message: 'Message kind must look like "domain.action" in lower case.',
      path: "kind"
    };
  }
  if (!allowlist.has(kind)) {
    return {
      ok: false,
      code: "E_PROTOCOL",
      reason: "unknown_kind",
      message: `Kind "${kind}" is not accepted in direction "${direction}".`,
      path: "kind"
    };
  }
  const requestId = candidate.requestId;
  if (requestId !== void 0) {
    if (typeof requestId !== "string" || !REQUEST_ID_PATTERN.test(requestId)) {
      return {
        ok: false,
        code: "E_PROTOCOL",
        reason: "invalid_request_id",
        message: 'requestId must be 1-128 characters of A-Z, a-z, 0-9, "_" or "-".',
        path: "requestId"
      };
    }
  }
  const payload = candidate.payload ?? {};
  if (!isPlainObject4(payload)) {
    return {
      ok: false,
      code: "E_PROTOCOL",
      reason: "invalid_payload",
      message: "payload must be a plain object.",
      path: "payload",
      requestId: typeof requestId === "string" ? requestId : void 0
    };
  }
  const keyScan = scanUnsafeKeys(payload, "payload", 0);
  if (!keyScan.ok) {
    return {
      ok: false,
      code: "E_PROTOCOL",
      reason: "unsafe_key",
      message: `Payload contains a forbidden key "${keyScan.key}".`,
      path: keyScan.path,
      requestId: typeof requestId === "string" ? requestId : void 0
    };
  }
  if (messageSize(candidate) > MAX_PAYLOAD_BYTES) {
    return {
      ok: false,
      code: "E_LIMIT",
      reason: "payload_too_large",
      message: `Message exceeds the ${MAX_PAYLOAD_BYTES} byte limit.`,
      requestId: typeof requestId === "string" ? requestId : void 0
    };
  }
  const envelope = {
    protocolVersion: PROTOCOL_VERSION,
    kind,
    payload
  };
  if (typeof requestId === "string") {
    envelope.requestId = requestId;
  }
  return { ok: true, envelope };
}

// src/core/protocol/bridge.js
var ProtocolError = class extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {Record<string, unknown>} [detail]
   */
  constructor(code, message, detail) {
    super(message);
    this.name = "ProtocolError";
    this.code = code;
    if (detail) {
      this.detail = detail;
    }
  }
};
var NOOP_LOGGER = {
  debug() {
  },
  warn() {
  },
  error() {
  }
};
function createBridge(options) {
  const { post, inboundDirection, logger = NOOP_LOGGER } = options;
  const timeoutMs = options.timeoutMs ?? 5e3;
  const maxInFlight = options.maxInFlight ?? 32;
  const outboundDirection = inboundDirection === DIRECTIONS.WEBVIEW_TO_HOST ? DIRECTIONS.HOST_TO_WEBVIEW : DIRECTIONS.WEBVIEW_TO_HOST;
  const outboundKinds = new Set(
    outboundDirection === DIRECTIONS.HOST_TO_WEBVIEW ? HOST_TO_WEBVIEW : WEBVIEW_TO_HOST
  );
  let sequence = 0;
  const createRequestId = options.createRequestId ?? (() => {
    sequence += 1;
    return `r${sequence.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  });
  const pending = /* @__PURE__ */ new Map();
  const handlers = /* @__PURE__ */ new Map();
  const reportedKinds = /* @__PURE__ */ new Set();
  let disposed = false;
  function send(kind, payload, requestId) {
    if (disposed) {
      throw new ProtocolError("E_CANCELLED", "Bridge is disposed.");
    }
    if (!outboundKinds.has(kind)) {
      throw new ProtocolError("E_PROTOCOL", `Kind "${kind}" is not sendable in this direction.`);
    }
    const envelope = createEnvelope(kind, payload, requestId);
    if (messageSize(envelope) > 1e6) {
      throw new ProtocolError("E_LIMIT", "Refusing to send an oversized message.");
    }
    post(envelope);
    logger.debug("protocol.send", {
      kind,
      requestId: requestId ?? null,
      bytes: messageSize(envelope)
    });
  }
  function sendError(code, message, requestId, detail) {
    try {
      send("protocol.error", createErrorPayload(code, message, detail), requestId);
    } catch {
    }
  }
  function on(kind, handler) {
    handlers.set(kind, handler);
    return () => {
      if (handlers.get(kind) === handler) {
        handlers.delete(kind);
      }
    };
  }
  function request(kind, payload = {}, requestOptions = {}) {
    if (disposed) {
      return Promise.reject(new ProtocolError("E_CANCELLED", "Bridge is disposed."));
    }
    if (pending.size >= maxInFlight) {
      return Promise.reject(
        new ProtocolError("E_LIMIT", `Too many in-flight requests (${maxInFlight}).`)
      );
    }
    const requestId = createRequestId();
    const effectiveTimeout = requestOptions.timeoutMs ?? timeoutMs;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(requestId);
        reject(
          new ProtocolError(
            "E_TIMEOUT",
            `No response to "${kind}" within ${effectiveTimeout} ms.`,
            {
              kind,
              requestId
            }
          )
        );
      }, effectiveTimeout);
      pending.set(requestId, { resolve, reject, timer });
      try {
        send(kind, payload, requestId);
      } catch (error) {
        clearTimeout(timer);
        pending.delete(requestId);
        reject(error);
      }
    });
  }
  async function handleMessage(raw) {
    if (disposed) {
      return { ok: false, code: "E_CANCELLED", reason: "disposed" };
    }
    const validation = validateEnvelope(raw, { direction: inboundDirection });
    if (!validation.ok) {
      if (!reportedKinds.has(validation.reason)) {
        reportedKinds.add(validation.reason);
        logger.warn("protocol.rejected", {
          reason: validation.reason,
          path: validation.path ?? null
        });
      }
      sendError(validation.code, validation.message, validation.requestId, {
        reason: validation.reason
      });
      return { ok: false, code: validation.code, reason: validation.reason };
    }
    const envelope = validation.envelope;
    const { kind, requestId, payload } = envelope;
    logger.debug("protocol.receive", {
      kind,
      requestId: requestId ?? null,
      bytes: messageSize(envelope)
    });
    if (kind === "protocol.error") {
      if (requestId && pending.has(requestId)) {
        const entry = pending.get(requestId);
        if (entry) {
          clearTimeout(entry.timer);
          pending.delete(requestId);
          const code = typeof payload.code === "string" ? payload.code : "E_PROTOCOL";
          const message = typeof payload.message === "string" ? payload.message : "The other side reported an error.";
          entry.reject(new ProtocolError(code, message, { requestId }));
        }
      }
      return { ok: true };
    }
    if (requestId && pending.has(requestId)) {
      const entry = pending.get(requestId);
      if (entry) {
        clearTimeout(entry.timer);
        pending.delete(requestId);
        entry.resolve({ kind, payload });
      }
      return { ok: true };
    }
    const handler = handlers.get(kind);
    if (!handler) {
      logger.debug("protocol.unhandled", { kind, requestId: requestId ?? null });
      return { ok: true };
    }
    try {
      await handler(payload, { requestId });
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const code = error instanceof ProtocolError ? error.code : (
        /** @type {{code?: string}} */
        error?.code ?? "E_PROTOCOL"
      );
      logger.error("protocol.handler_failed", { kind, error: message });
      sendError(code, message, requestId);
      return { ok: false, code };
    }
  }
  function dispose(reason = "disposed") {
    if (disposed) {
      return;
    }
    disposed = true;
    for (const [, entry] of pending) {
      clearTimeout(entry.timer);
      entry.reject(new ProtocolError("E_CANCELLED", `Bridge closed: ${reason}`));
    }
    pending.clear();
    handlers.clear();
  }
  return {
    on,
    request,
    respond: send,
    handleMessage,
    dispose,
    pendingCount: () => pending.size,
    isDisposed: () => disposed,
    direction: inboundDirection
  };
}

// src/core/graph/model.js
function buildGraph(run) {
  const query = createQueryLayer(run);
  const info = valueOf(query.runInfo(), {
    runId: "",
    language: "",
    adapterId: "",
    completeness: "partial"
  });
  const diagnostics = valueOf(query.diagnostics(), []);
  const symbols = valueOf(query.allSymbols(), []);
  const relationships2 = valueOf(query.allRelationships(), []);
  const nodes = /* @__PURE__ */ new Map();
  for (const symbol2 of symbols) {
    nodes.set(symbol2.symbolId, {
      id: symbol2.symbolId,
      label: displayName(symbol2),
      kind: symbol2.kind,
      status: "resolved",
      range: symbol2.declaration,
      fileId: symbol2.declaration.fileId,
      external: false
    });
  }
  const edges = [];
  const edgeIds = /* @__PURE__ */ new Set();
  const skippedRelationships = [];
  for (const relationship2 of relationships2) {
    if (!nodes.has(relationship2.to)) {
      nodes.set(relationship2.to, {
        id: relationship2.to,
        label: placeholderLabel(relationship2.to),
        kind: "unknown",
        status: relationship2.status === "resolved" ? "unresolved" : relationship2.status,
        range: null,
        fileId: null,
        external: true,
        badge: relationship2.reasonCode
      });
    }
    if (!nodes.has(relationship2.from)) {
      skippedRelationships.push(relationship2.relationshipId);
      continue;
    }
    if (edgeIds.has(relationship2.relationshipId)) {
      continue;
    }
    edgeIds.add(relationship2.relationshipId);
    edges.push({
      id: relationship2.relationshipId,
      from: relationship2.from,
      to: relationship2.to,
      type: relationship2.type,
      status: relationship2.status,
      reasonCode: relationship2.reasonCode,
      label: relationship2.reasonCode ? `${relationship2.type} \xB7 ${relationship2.reasonCode}` : relationship2.type
    });
  }
  const degradations = [];
  if (info.completeness !== "full") {
    degradations.push(`Analysis completeness: ${info.completeness}`);
  }
  for (const relationshipId of skippedRelationships) {
    degradations.push(
      `Skipped relationship ${relationshipId}: its source symbol was not declared.`
    );
  }
  for (const diagnostic of diagnostics) {
    if (diagnostic.severity !== "info") {
      degradations.push(`${diagnostic.code}: ${diagnostic.message}`);
    }
  }
  return {
    graphId: `graph:${info.runId}`,
    runId: info.runId,
    language: info.language,
    adapterId: info.adapterId,
    completeness: info.completeness,
    nodes: [...nodes.values()].sort(byId),
    edges: edges.sort(byId),
    diagnostics: diagnostics.map((diagnostic) => ({
      code: diagnostic.code,
      message: diagnostic.message,
      severity: diagnostic.severity
    })),
    degradations
  };
}
function valueOf(result, fallback) {
  return result.ok ? result.value : fallback;
}
function byId(a, b) {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}
function displayName(symbol2) {
  if (symbol2.kind === "file") {
    return symbol2.name || symbol2.qualifiedName;
  }
  return symbol2.name || symbol2.qualifiedName || symbol2.symbolId;
}
function placeholderLabel(targetId) {
  const segments = String(targetId).split(/[.:/]/).filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : String(targetId);
}

// src/core/graph/layout.js
var LAYOUT_DEFAULTS = Object.freeze({
  nodeWidth: 190,
  nodeHeight: 54,
  horizontalGap: 90,
  verticalGap: 26,
  maxLayers: 40
});
function computeLayout(graph, options = {}) {
  const config = { ...LAYOUT_DEFAULTS, ...options };
  const nodeIds = graph.nodes.map((node) => node.id);
  const layerOf = /* @__PURE__ */ new Map();
  const incoming = new Map(nodeIds.map((id) => [id, []]));
  const outgoing = new Map(nodeIds.map((id) => [id, []]));
  for (const edge of graph.edges) {
    if (!incoming.has(edge.to) || !incoming.has(edge.from) || edge.from === edge.to) {
      continue;
    }
    incoming.get(edge.to)?.push(edge.from);
    outgoing.get(edge.from)?.push(edge.to);
  }
  const indegree = new Map(nodeIds.map((id) => [id, incoming.get(id)?.length ?? 0]));
  const ready = nodeIds.filter((id) => (indegree.get(id) ?? 0) === 0).sort();
  const order = [];
  while (ready.length > 0) {
    const id = (
      /** @type {string} */
      ready.shift()
    );
    order.push(id);
    for (const next of (outgoing.get(id) ?? []).slice().sort()) {
      const remaining = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, remaining);
      if (remaining === 0) {
        ready.push(next);
        ready.sort();
      }
    }
  }
  let maxLayer = 0;
  for (const id of order) {
    const predecessors = incoming.get(id) ?? [];
    const layer = predecessors.length === 0 ? 0 : Math.max(...predecessors.map((pred) => layerOf.get(pred) ?? 0)) + 1;
    layerOf.set(id, layer);
    maxLayer = Math.max(maxLayer, layer);
  }
  const cyclic = nodeIds.filter((id) => !layerOf.has(id)).sort();
  for (const id of cyclic) {
    layerOf.set(id, Math.min(maxLayer + 1, config.maxLayers));
  }
  const byLayer = /* @__PURE__ */ new Map();
  for (const id of nodeIds.slice().sort()) {
    const layer = Math.min(layerOf.get(id) ?? 0, config.maxLayers);
    if (!byLayer.has(layer)) {
      byLayer.set(layer, []);
    }
    byLayer.get(layer)?.push(id);
  }
  const positions = {};
  const layers = [];
  let tallest = 0;
  for (const layer of [...byLayer.keys()].sort((a, b) => a - b)) {
    const ids = byLayer.get(layer) ?? [];
    layers.push(ids);
    ids.forEach((id, index) => {
      positions[id] = {
        x: layer * (config.nodeWidth + config.horizontalGap),
        y: index * (config.nodeHeight + config.verticalGap),
        width: config.nodeWidth,
        height: config.nodeHeight,
        layer
      };
    });
    tallest = Math.max(tallest, ids.length);
  }
  return {
    positions,
    width: Math.max(1, layers.length) * (config.nodeWidth + config.horizontalGap),
    height: Math.max(1, tallest) * (config.nodeHeight + config.verticalGap),
    layers
  };
}

// src/core/graph/dto.js
var GRAPH_DTO_VERSION = 1;
function toDto(graph) {
  const layout = computeLayout(graph);
  const nodes = graph.nodes.map((node) => ({
    id: node.id,
    label: node.label,
    kind: node.kind,
    status: node.status,
    badge: node.badge ?? "",
    external: node.external,
    range: node.range ? {
      fileId: node.range.fileId,
      startLine: node.range.startLine,
      endLine: node.range.endLine
    } : null,
    position: layout.positions[node.id] ?? { x: 0, y: 0, width: 190, height: 54, layer: 0 }
  }));
  const statuses = [...new Set(nodes.map((node) => node.status))].sort();
  const kinds = [...new Set(nodes.map((node) => node.kind))].sort();
  return {
    dtoVersion: GRAPH_DTO_VERSION,
    graphId: graph.graphId,
    runId: graph.runId,
    language: graph.language,
    adapterId: graph.adapterId,
    completeness: graph.completeness,
    nodes,
    edges: graph.edges.map((edge) => {
      const dtoEdge = {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        type: edge.type,
        status: edge.status,
        label: edge.label
      };
      if (edge.reasonCode) {
        dtoEdge.reasonCode = edge.reasonCode;
      }
      return dtoEdge;
    }),
    diagnostics: graph.diagnostics,
    degradations: graph.degradations,
    extent: { width: layout.width, height: layout.height },
    legend: { statuses, kinds }
  };
}

// src/core/csr/serialize.js
function canonicalRun(run) {
  const candidate = (
    /** @type {Record<string, unknown>} */
    run
  );
  const canonical = {
    runId: candidate.runId,
    adapterId: candidate.adapterId,
    adapterVersion: candidate.adapterVersion,
    language: candidate.language,
    csrVersion: candidate.csrVersion,
    scope: candidate.scope,
    completeness: candidate.completeness,
    files: sortBy(arrayOf2(candidate.files), (file) => String(file.fileId)),
    symbols: sortBy(arrayOf2(candidate.symbols), (symbol2) => String(symbol2.symbolId)),
    relationships: sortBy(
      arrayOf2(candidate.relationships),
      (relationship2) => `${String(relationship2.type)}\0${String(relationship2.from)}\0${String(
        relationship2.to
      )}\0${String(relationship2.relationshipId)}`
    ),
    controlConstructs: sortBy(
      arrayOf2(candidate.controlConstructs),
      (construct) => String(construct.constructId)
    ),
    dataFacts: sortBy(arrayOf2(candidate.dataFacts), (fact) => String(fact.factId)),
    diagnostics: sortBy(
      arrayOf2(candidate.diagnostics),
      (diagnostic) => `${String(diagnostic.severity)}\0${String(diagnostic.code)}\0${String(
        diagnostic.message
      )}\0${Array.isArray(diagnostic.affects) ? diagnostic.affects.join(",") : ""}`
    )
  };
  if (isPlainObject5(candidate.extensions)) {
    canonical.extensions = candidate.extensions;
  }
  return (
    /** @type {import('./entities.js').AnalysisRun} */
    canonical
  );
}
function serializeRun(run) {
  return stableStringify(canonicalRun(run));
}
function hashRun(run) {
  return hashHex(serializeRun(run));
}
function stableStringify(value) {
  return JSON.stringify(sortKeys(value));
}
function sortKeys(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => sortKeys(entry));
  }
  if (isPlainObject5(value)) {
    const sorted = {};
    for (const key of Object.keys(value).sort()) {
      if (value[key] !== void 0) {
        sorted[key] = sortKeys(value[key]);
      }
    }
    return sorted;
  }
  return value;
}
function sortBy(values, key) {
  return values.map((value) => ({ value, key: key(
    /** @type {T} */
    value
  ) })).sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0).map((entry) => entry.value);
}
function arrayOf2(value) {
  return Array.isArray(value) ? value : [];
}
function isPlainObject5(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// src/extension/panelWire.js
function createPanelWire({
  logger,
  registry,
  extensionVersion,
  loadRun,
  defaultPath = () => "sample.mock"
}) {
  return function wire(target) {
    if (!target?.webview || typeof target.webview.onDidReceiveMessage !== "function") {
      throw new TypeError("Panel target must expose webview.onDidReceiveMessage.");
    }
    const loggerProxy = {
      debug: (
        /** @param {string} message @param {Record<string, unknown>} [fields] */
        (message, fields) => logger.debug(message, fields)
      ),
      warn: (message, fields) => logger.warn(message, fields),
      error: (message, fields) => logger.error(message, fields)
    };
    const bridge = createBridge({
      post: (message) => {
        void Promise.resolve(target.webview.postMessage(message)).then(
          (delivered) => {
            if (!delivered) {
              logger.debug("panel.post_undelivered", { kind: message.kind });
            }
          },
          (error) => {
            logger.debug("panel.post_failed", {
              kind: message.kind,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        );
      },
      inboundDirection: DIRECTIONS.WEBVIEW_TO_HOST,
      logger: loggerProxy
    });
    let current = null;
    async function ensureRun(path4 = defaultPath()) {
      if (current && current.path === path4) {
        return { ok: true, run: current.run, query: current.query };
      }
      const loaded = await loadRun(path4);
      if (!loaded.ok) {
        return loaded;
      }
      const query = registry.query(loaded.run);
      current = {
        path: path4,
        run: loaded.run,
        query,
        hash: hashRun(loaded.run)
      };
      return { ok: true, run: current.run, query };
    }
    bridge.on("webview.ready", async (_payload, { requestId }) => {
      bridge.respond(
        "capabilities.data",
        {
          protocolVersion: PROTOCOL_VERSION,
          extensionVersion,
          adapters: registry.capabilityMatrix(),
          capabilities: {
            cfp: false,
            callGraph: true,
            dataFlow: false,
            hoverPreview: false,
            projectIndex: false
          },
          demoMode: true
        },
        requestId
      );
    });
    bridge.on("graph.load", async (_payload, { requestId }) => {
      const loaded = await ensureRun();
      if (!loaded.ok) {
        bridge.respond(
          "protocol.error",
          createErrorPayload(loaded.code, loaded.message, { issues: loaded.issues }),
          requestId
        );
        return;
      }
      bridge.respond("graph.data", { dto: toDto(buildGraph(loaded.run)) }, requestId);
    });
    bridge.on("csr.load", async (payload, { requestId }) => {
      const loaded = await ensureRun(typeof payload.path === "string" ? payload.path : void 0);
      if (!loaded.ok) {
        bridge.respond(
          "protocol.error",
          createErrorPayload(loaded.code, loaded.message, { issues: loaded.issues }),
          requestId
        );
        return;
      }
      bridge.respond(
        "csr.data",
        {
          run: loaded.run,
          hash: current?.hash ?? hashRun(loaded.run)
        },
        requestId
      );
    });
    function queryHandler(kind, run) {
      bridge.on(kind, async (payload, { requestId }) => {
        const loaded = await ensureRun();
        if (!loaded.ok) {
          bridge.respond(
            "protocol.error",
            createErrorPayload(loaded.code, loaded.message, { issues: loaded.issues }),
            requestId
          );
          return;
        }
        const result = run(payload, loaded.query);
        bridge.respond("query.data", result, requestId);
      });
    }
    queryHandler(
      "query.symbol",
      (payload, query) => query.symbolById(typeof payload.symbolId === "string" ? payload.symbolId : "")
    );
    queryHandler(
      "query.symbols",
      (payload, query) => query.symbolsInFile(typeof payload.fileId === "string" ? payload.fileId : "")
    );
    queryHandler(
      "query.callers",
      (payload, query) => query.callers(typeof payload.symbolId === "string" ? payload.symbolId : "", {
        statuses: Array.isArray(payload.statuses) ? payload.statuses : void 0
      })
    );
    queryHandler(
      "query.callees",
      (payload, query) => query.callees(typeof payload.symbolId === "string" ? payload.symbolId : "", {
        statuses: Array.isArray(payload.statuses) ? payload.statuses : void 0
      })
    );
    queryHandler(
      "query.constructs",
      (payload, query) => query.constructsOf(typeof payload.symbolId === "string" ? payload.symbolId : "")
    );
    queryHandler("query.capabilities", (_payload, query) => query.capabilities());
    bridge.on("node.select", async (payload) => {
      logger.debug("panel.node_selected", { nodeId: payload.nodeId ?? null });
    });
    bridge.on("panel.ping", async (_payload, { requestId }) => {
      bridge.respond("panel.pong", { at: Date.now() }, requestId);
    });
    target.webview.onDidReceiveMessage((message) => {
      void bridge.handleMessage(message);
    });
    target.onDidDispose(() => {
      current = null;
      bridge.dispose("panel_disposed");
    });
    bridge.emitProgress = (progress) => {
      if (!bridge.isDisposed()) {
        bridge.respond("analysis.progress", progress);
      }
    };
    return bridge;
  };
}

// src/extension/panel.js
function createPanelManager({ context, logger, registry, analysis, extensionVersion }) {
  let panel = null;
  let bridge = null;
  let runCounter = 0;
  let preferredPath = null;
  const analyzer = analysis ?? registry;
  const wire = createPanelWire({
    logger,
    registry,
    extensionVersion,
    loadRun: (path4) => analyzeRun(path4),
    defaultPath: () => preferredPath ?? "sample.mock"
  });
  function webviewRoot() {
    return vscode2.Uri.joinPath(context.extensionUri, "dist", "webview");
  }
  async function analyzeRun(path4) {
    runCounter += 1;
    const runId = `run:${Date.now().toString(36)}-${runCounter}`;
    const workspaceRoot = vscode2.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const result = await analyzer.analyze({
      path: path4,
      runId,
      ...workspaceRoot ? { workspaceRoot } : {},
      trusted: vscode2.workspace.isTrusted
    });
    if (!result.ok) {
      return {
        ok: false,
        code: result.code,
        message: result.message,
        issues: result.issues
      };
    }
    return { ok: true, run: result.run };
  }
  function applyHtml(target) {
    const nonce = import_node_crypto.default.randomBytes(16).toString("base64");
    const webview = target.webview;
    const root = webviewRoot();
    webview.options = {
      enableScripts: true,
      retainContextWhenHidden: Boolean(
        vscode2.workspace.getConfiguration("codeflow").get("explorer.retainContext", false)
      ),
      localResourceRoots: [root]
    };
    webview.html = renderPanelHtml({
      nonce,
      cspSource: webview.cspSource,
      scriptUri: webview.asWebviewUri(vscode2.Uri.joinPath(root, "main.js")).toString(),
      styleUri: webview.asWebviewUri(vscode2.Uri.joinPath(root, "styles.css")).toString(),
      title: "CodeFlow"
    });
  }
  function show() {
    if (panel) {
      panel.reveal(void 0, false);
      return panel;
    }
    const created = vscode2.window.createWebviewPanel(
      "codeflow.graph",
      "CodeFlow",
      { viewColumn: vscode2.ViewColumn.Beside, preserveFocus: false },
      {
        enableScripts: true,
        localResourceRoots: [webviewRoot()]
      }
    );
    panel = created;
    applyHtml(created);
    bridge = wire(created);
    created.onDidDispose(() => {
      if (panel === created) {
        panel = null;
        bridge = null;
      }
    });
    return created;
  }
  return {
    show,
    /**
     * Show the panel and analyze a specific file. Re-applying the HTML makes
     * the webview request its graph again, now with the preferred path.
     *
     * @param {string} filePath
     */
    showFile(filePath) {
      preferredPath = filePath;
      if (panel) {
        applyHtml(panel);
        panel.reveal(void 0, false);
        return panel;
      }
      return show();
    },
    dispose() {
      if (bridge) {
        bridge.dispose("extension_disposed");
        bridge = null;
      }
      if (panel) {
        panel.dispose();
        panel = null;
      }
    },
    isOpen: () => panel !== null,
    pendingRequests: () => bridge ? bridge.pendingCount() : 0,
    /** Test hook: rebuild the HTML for the open panel. */
    reload() {
      if (panel) {
        applyHtml(panel);
      }
    }
  };
}

// src/extension/commands.js
var vscode4 = __toESM(require("vscode"), 1);

// src/extension/diagnostics.js
var vscode3 = __toESM(require("vscode"), 1);
function buildDiagnosticsReport({ registry, panelManager, logger, extensionVersion }) {
  const versions = process.versions ?? {};
  const configuration = vscode3.workspace.getConfiguration("codeflow");
  const workspaceFolders = (vscode3.workspace.workspaceFolders ?? []).map((folder) => folder.name);
  const lines = [
    "# CodeFlow diagnostics",
    "",
    "Copy this report when filing an issue. It contains no source text.",
    "",
    "## Build",
    "",
    `- Extension: ${extensionVersion}`,
    `- VS Code: ${vscode3.version}`,
    `- Protocol: v${PROTOCOL_VERSION}`,
    `- Node: ${versions.node ?? "unknown"}`,
    `- Electron: ${versions.electron ?? "n/a"}`,
    `- Chromium: ${versions.chrome ?? "n/a"}`,
    `- Platform: ${process.platform} ${process.arch}`,
    "",
    "## Workspace",
    "",
    `- Folders: ${workspaceFolders.length > 0 ? workspaceFolders.join(", ") : "(none)"}`,
    `- Workspace trusted: ${vscode3.workspace.isTrusted ? "yes" : "no"}`,
    "",
    "## Runtime",
    "",
    `- Log level: ${logger.level()}`,
    `- Graph panel open: ${panelManager.isOpen() ? "yes" : "no"}`,
    `- Pending webview requests: ${panelManager.pendingRequests()}`,
    "",
    "## Adapters",
    ""
  ];
  const adapters = registry.capabilityMatrix();
  if (adapters.length === 0) {
    lines.push("- No adapters registered.");
  } else {
    for (const adapter of adapters) {
      const enabled = Object.entries(adapter.capabilities).filter(([, value]) => value).map(([key]) => key);
      lines.push(
        `- ${adapter.id} (${adapter.languages.join(", ")}): ${enabled.length > 0 ? enabled.join(", ") : "no capabilities"}`
      );
    }
  }
  lines.push("", "## Settings", "");
  for (const key of ["logLevel", "protocol.traceMessages", "explorer.retainContext"]) {
    lines.push(`- codeflow.${key}: ${JSON.stringify(configuration.get(key))}`);
  }
  lines.push(
    "",
    "## Known Phase 0 limits",
    "",
    "- Graph data comes from the mock adapter; no real C++ or JavaScript analysis exists yet.",
    "- No source preview, call graph, data flow, indexing, or explanations yet.",
    "- Capability flags above reflect adapter declarations, not shipped features.",
    ""
  );
  return lines.join("\n");
}
async function openDiagnosticsDocument(content) {
  const document = await vscode3.workspace.openTextDocument({
    content,
    language: "markdown"
  });
  await vscode3.window.showTextDocument(document, { preview: true });
}

// src/extension/commands.js
function registerCommands({ context, logger, panelManager, registry, extensionVersion }) {
  function register(commandId, handler) {
    const disposable = vscode4.commands.registerCommand(commandId, async () => {
      try {
        return await handler();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const code = (
          /** @type {{code?: string}} */
          error?.code ?? "E_INTERNAL"
        );
        logger.error("command.failed", { commandId, code, error: message });
        const choice = await vscode4.window.showErrorMessage(`CodeFlow: ${message}`, "Show log");
        if (choice === "Show log") {
          logger.show();
        }
        return void 0;
      }
    });
    context.subscriptions.push(disposable);
  }
  register("codeflow.openExplorer", () => {
    logger.info("command.openExplorer");
    panelManager.show();
  });
  register("codeflow.analyzeActiveFile", () => {
    const editor = vscode4.window.activeTextEditor;
    if (!editor || editor.document.uri.scheme !== "file") {
      void vscode4.window.showWarningMessage(
        "CodeFlow: open a file in the workspace before analysing it."
      );
      return;
    }
    logger.info("command.analyzeActiveFile", {
      extension: editor.document.uri.path.split(".").pop()
    });
    panelManager.showFile(editor.document.uri.fsPath);
  });
  register("codeflow.showDiagnostics", async () => {
    const report = buildDiagnosticsReport({
      registry,
      panelManager,
      logger,
      extensionVersion
    });
    await openDiagnosticsDocument(report);
  });
  register("codeflow.showLog", () => {
    logger.show();
  });
}

// src/extension/extension.js
var EXTENSION_VERSION = "0.0.1";
function cppSettings() {
  const config = vscode5.workspace.getConfiguration("codeflow");
  return {
    clangPath: config.get("cpp.clangPath", ""),
    compileCommandsPath: config.get("cpp.compileCommandsPath", ""),
    fallbackIncludePaths: config.get("cpp.fallbackIncludePaths", []),
    fallbackDefines: config.get("cpp.fallbackDefines", []),
    fallbackStandard: config.get("cpp.fallbackStandard", ""),
    timeoutMs: config.get("cpp.timeoutMs", 6e4),
    maxOutputBytes: config.get("cpp.maxOutputBytes", 64 * 1024 * 1024),
    maxTuBytes: config.get("cpp.maxFileBytes", 4 * 1024 * 1024)
  };
}
async function activate(context) {
  const startedAt = Date.now();
  const logger = createLogger(context);
  const registry = createAdapterRegistry();
  registry.register(mockAdapter);
  registry.register(cppAdapter);
  const analysis = createCppAnalysisService({
    registry,
    runTool,
    settings: cppSettings,
    logger
  });
  const panelManager = createPanelManager({
    context,
    logger,
    registry,
    analysis,
    extensionVersion: EXTENSION_VERSION
  });
  registerCommands({
    context,
    logger,
    panelManager,
    registry,
    extensionVersion: EXTENSION_VERSION
  });
  context.subscriptions.push({
    dispose() {
      panelManager.dispose();
    }
  });
  logger.info("extension.activated", {
    ms: Date.now() - startedAt,
    version: EXTENSION_VERSION,
    vscode: vscode5.version,
    trusted: vscode5.workspace.isTrusted
  });
  return {
    version: EXTENSION_VERSION,
    protocolVersion: PROTOCOL_VERSION,
    registry,
    analysis,
    panelManager,
    logger
  };
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2V4dGVuc2lvbi9leHRlbnNpb24uanMiLCAiLi4vc3JjL2V4dGVuc2lvbi9sb2cuanMiLCAiLi4vc3JjL2NvcmUvbG9nL3JlZGFjdC5qcyIsICIuLi9zcmMvY29yZS9jc3IvdHlwZXMuanMiLCAiLi4vc3JjL2NvcmUvY3NyL2xpbWl0cy5qcyIsICIuLi9zcmMvY29yZS9jc3IvcmVhc29ucy5qcyIsICIuLi9zcmMvY29yZS9jc3IvcHJvdmVuYW5jZS5qcyIsICIuLi9zcmMvY29yZS9jc3IvdmFsaWRhdGUuanMiLCAiLi4vc3JjL2NvcmUvY3NyL2VudGl0aWVzLmpzIiwgIi4uL3NyYy9jb3JlL2Nzci9jYW5jZWxsYXRpb24uanMiLCAiLi4vc3JjL2NvcmUvY3NyL21pZ3JhdGUuanMiLCAiLi4vc3JjL2NvcmUvY3NyL3F1ZXJ5LmpzIiwgIi4uL3NyYy9jb3JlL2FkYXB0ZXJSZWdpc3RyeS5qcyIsICIuLi9zcmMvY29yZS9jc3IvaGFzaC5qcyIsICIuLi9zcmMvY29yZS9jc3IvaWRlbnRpdHkuanMiLCAiLi4vc3JjL2FkYXB0ZXJzL21vY2svaW5kZXguanMiLCAiLi4vc3JjL2FkYXB0ZXJzL2NwcC9sb2NhdG9yLmpzIiwgIi4uL3NyYy9hZGFwdGVycy9jcHAvbWFwcGVyLmpzIiwgIi4uL3NyYy9hZGFwdGVycy9jcHAvaW5kZXguanMiLCAiLi4vc3JjL2V4dGVuc2lvbi9jcHAvcGlwZWxpbmUuanMiLCAiLi4vc3JjL2NvcmUvY3NyL2ZvY3VzLmpzIiwgIi4uL3NyYy9leHRlbnNpb24vc2VjdXJpdHkvcGF0aHMuanMiLCAiLi4vc3JjL2V4dGVuc2lvbi9jcHAvY29tcGlsZURiLmpzIiwgIi4uL3NyYy9leHRlbnNpb24vY3BwL2FuYWx5c2lzQ29uZmlnLmpzIiwgIi4uL3NyYy9leHRlbnNpb24vY3BwL2NsYW5nLmpzIiwgIi4uL3NyYy9leHRlbnNpb24vY3BwL2hlYWRlcnMuanMiLCAiLi4vc3JjL2V4dGVuc2lvbi90b29saW5nL3J1blRvb2wuanMiLCAiLi4vc3JjL2V4dGVuc2lvbi9wYW5lbC5qcyIsICIuLi9zcmMvZXh0ZW5zaW9uL3BhbmVsVGVtcGxhdGUuanMiLCAiLi4vc3JjL2NvcmUvcHJvdG9jb2wvZW52ZWxvcGUuanMiLCAiLi4vc3JjL2NvcmUvcHJvdG9jb2wvYnJpZGdlLmpzIiwgIi4uL3NyYy9jb3JlL2dyYXBoL21vZGVsLmpzIiwgIi4uL3NyYy9jb3JlL2dyYXBoL2xheW91dC5qcyIsICIuLi9zcmMvY29yZS9ncmFwaC9kdG8uanMiLCAiLi4vc3JjL2NvcmUvY3NyL3NlcmlhbGl6ZS5qcyIsICIuLi9zcmMvZXh0ZW5zaW9uL3BhbmVsV2lyZS5qcyIsICIuLi9zcmMvZXh0ZW5zaW9uL2NvbW1hbmRzLmpzIiwgIi4uL3NyYy9leHRlbnNpb24vZGlhZ25vc3RpY3MuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKlxuICogRXh0ZW5zaW9uIGVudHJ5IHBvaW50LlxuICpcbiAqIEFjdGl2YXRpb24gaXMgZGVsaWJlcmF0ZWx5IGNoZWFwOiBjcmVhdGUgYSBsb2dnZXIsIGJ1aWxkIHRoZSBhZGFwdGVyIHJlZ2lzdHJ5LFxuICogcmVnaXN0ZXIgdGhyZWUgY29tbWFuZHMuIE5vdGhpbmcgdG91Y2hlcyB0aGUgZmlsZSBzeXN0ZW0sIHNwYXducyBhIHByb2Nlc3MsIG9yXG4gKiByZWFkcyB3b3Jrc3BhY2UgY29udGVudHMgdW50aWwgdGhlIHVzZXIgaW52b2tlcyBhIGNvbW1hbmQuIFRoYXQga2VlcHMgc3RhcnR1cFxuICogZmFzdCBhbmQga2VlcHMgUmVzdHJpY3RlZCBNb2RlIGluZXJ0LlxuICovXG5cbmltcG9ydCAqIGFzIHZzY29kZSBmcm9tICd2c2NvZGUnO1xuaW1wb3J0IHsgY3JlYXRlTG9nZ2VyIH0gZnJvbSAnLi9sb2cuanMnO1xuaW1wb3J0IHsgY3JlYXRlQWRhcHRlclJlZ2lzdHJ5IH0gZnJvbSAnLi4vY29yZS9hZGFwdGVyUmVnaXN0cnkuanMnO1xuaW1wb3J0IHsgbW9ja0FkYXB0ZXIgfSBmcm9tICcuLi9hZGFwdGVycy9tb2NrL2luZGV4LmpzJztcbmltcG9ydCB7IGNwcEFkYXB0ZXIgfSBmcm9tICcuLi9hZGFwdGVycy9jcHAvaW5kZXguanMnO1xuaW1wb3J0IHsgY3JlYXRlQ3BwQW5hbHlzaXNTZXJ2aWNlIH0gZnJvbSAnLi9jcHAvcGlwZWxpbmUuanMnO1xuaW1wb3J0IHsgcnVuVG9vbCB9IGZyb20gJy4vdG9vbGluZy9ydW5Ub29sLmpzJztcbmltcG9ydCB7IGNyZWF0ZVBhbmVsTWFuYWdlciB9IGZyb20gJy4vcGFuZWwuanMnO1xuaW1wb3J0IHsgcmVnaXN0ZXJDb21tYW5kcyB9IGZyb20gJy4vY29tbWFuZHMuanMnO1xuaW1wb3J0IHsgUFJPVE9DT0xfVkVSU0lPTiB9IGZyb20gJy4uL2NvcmUvcHJvdG9jb2wvZW52ZWxvcGUuanMnO1xuXG5jb25zdCBFWFRFTlNJT05fVkVSU0lPTiA9ICcwLjAuMSc7XG5cbi8qKlxuICogUmVhZCB0aGUgQysrIHNldHRpbmdzLiBDYWxsZWQgcGVyIGFuYWx5c2lzIHNvIGEgc2V0dGluZ3MgY2hhbmdlIHRha2VzIGVmZmVjdFxuICogd2l0aG91dCByZWxvYWRpbmcgdGhlIHdpbmRvdy5cbiAqXG4gKiBAcmV0dXJucyB7aW1wb3J0KCcuL2NwcC9waXBlbGluZS5qcycpLkNwcFNldHRpbmdzfVxuICovXG5mdW5jdGlvbiBjcHBTZXR0aW5ncygpIHtcbiAgY29uc3QgY29uZmlnID0gdnNjb2RlLndvcmtzcGFjZS5nZXRDb25maWd1cmF0aW9uKCdjb2RlZmxvdycpO1xuICByZXR1cm4ge1xuICAgIGNsYW5nUGF0aDogY29uZmlnLmdldCgnY3BwLmNsYW5nUGF0aCcsICcnKSxcbiAgICBjb21waWxlQ29tbWFuZHNQYXRoOiBjb25maWcuZ2V0KCdjcHAuY29tcGlsZUNvbW1hbmRzUGF0aCcsICcnKSxcbiAgICBmYWxsYmFja0luY2x1ZGVQYXRoczogY29uZmlnLmdldCgnY3BwLmZhbGxiYWNrSW5jbHVkZVBhdGhzJywgW10pLFxuICAgIGZhbGxiYWNrRGVmaW5lczogY29uZmlnLmdldCgnY3BwLmZhbGxiYWNrRGVmaW5lcycsIFtdKSxcbiAgICBmYWxsYmFja1N0YW5kYXJkOiBjb25maWcuZ2V0KCdjcHAuZmFsbGJhY2tTdGFuZGFyZCcsICcnKSxcbiAgICB0aW1lb3V0TXM6IGNvbmZpZy5nZXQoJ2NwcC50aW1lb3V0TXMnLCA2MF8wMDApLFxuICAgIG1heE91dHB1dEJ5dGVzOiBjb25maWcuZ2V0KCdjcHAubWF4T3V0cHV0Qnl0ZXMnLCA2NCAqIDEwMjQgKiAxMDI0KSxcbiAgICBtYXhUdUJ5dGVzOiBjb25maWcuZ2V0KCdjcHAubWF4RmlsZUJ5dGVzJywgNCAqIDEwMjQgKiAxMDI0KSxcbiAgfTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3ZzY29kZS5FeHRlbnNpb25Db250ZXh0fSBjb250ZXh0XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhY3RpdmF0ZShjb250ZXh0KSB7XG4gIGNvbnN0IHN0YXJ0ZWRBdCA9IERhdGUubm93KCk7XG4gIGNvbnN0IGxvZ2dlciA9IGNyZWF0ZUxvZ2dlcihjb250ZXh0KTtcblxuICBjb25zdCByZWdpc3RyeSA9IGNyZWF0ZUFkYXB0ZXJSZWdpc3RyeSgpO1xuICByZWdpc3RyeS5yZWdpc3Rlcihtb2NrQWRhcHRlcik7XG4gIHJlZ2lzdHJ5LnJlZ2lzdGVyKGNwcEFkYXB0ZXIpO1xuXG4gIGNvbnN0IGFuYWx5c2lzID0gY3JlYXRlQ3BwQW5hbHlzaXNTZXJ2aWNlKHtcbiAgICByZWdpc3RyeSxcbiAgICBydW5Ub29sLFxuICAgIHNldHRpbmdzOiBjcHBTZXR0aW5ncyxcbiAgICBsb2dnZXIsXG4gIH0pO1xuXG4gIGNvbnN0IHBhbmVsTWFuYWdlciA9IGNyZWF0ZVBhbmVsTWFuYWdlcih7XG4gICAgY29udGV4dCxcbiAgICBsb2dnZXIsXG4gICAgcmVnaXN0cnksXG4gICAgYW5hbHlzaXMsXG4gICAgZXh0ZW5zaW9uVmVyc2lvbjogRVhURU5TSU9OX1ZFUlNJT04sXG4gIH0pO1xuXG4gIHJlZ2lzdGVyQ29tbWFuZHMoe1xuICAgIGNvbnRleHQsXG4gICAgbG9nZ2VyLFxuICAgIHBhbmVsTWFuYWdlcixcbiAgICByZWdpc3RyeSxcbiAgICBleHRlbnNpb25WZXJzaW9uOiBFWFRFTlNJT05fVkVSU0lPTixcbiAgfSk7XG5cbiAgY29udGV4dC5zdWJzY3JpcHRpb25zLnB1c2goe1xuICAgIGRpc3Bvc2UoKSB7XG4gICAgICBwYW5lbE1hbmFnZXIuZGlzcG9zZSgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIGxvZ2dlci5pbmZvKCdleHRlbnNpb24uYWN0aXZhdGVkJywge1xuICAgIG1zOiBEYXRlLm5vdygpIC0gc3RhcnRlZEF0LFxuICAgIHZlcnNpb246IEVYVEVOU0lPTl9WRVJTSU9OLFxuICAgIHZzY29kZTogdnNjb2RlLnZlcnNpb24sXG4gICAgdHJ1c3RlZDogdnNjb2RlLndvcmtzcGFjZS5pc1RydXN0ZWQsXG4gIH0pO1xuXG4gIC8vIFJldHVybmVkIGZvciBpbnRlZ3JhdGlvbiB0ZXN0cyBhbmQgZnV0dXJlIGNvbW1hbmRzOyBub3QgYSBwdWJsaWMgQVBJLlxuICByZXR1cm4ge1xuICAgIHZlcnNpb246IEVYVEVOU0lPTl9WRVJTSU9OLFxuICAgIHByb3RvY29sVmVyc2lvbjogUFJPVE9DT0xfVkVSU0lPTixcbiAgICByZWdpc3RyeSxcbiAgICBhbmFseXNpcyxcbiAgICBwYW5lbE1hbmFnZXIsXG4gICAgbG9nZ2VyLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVhY3RpdmF0ZSgpIHtcbiAgLy8gRGlzcG9zYWJsZXMgcmVnaXN0ZXJlZCBpbiBgY29udGV4dC5zdWJzY3JpcHRpb25zYCBoYW5kbGUgdGVhcmRvd24uXG59XG4iLCAiLyoqXG4gKiBPdXRwdXQtY2hhbm5lbCBsb2dnZXIuXG4gKlxuICogVGhlIG9ubHkgcGxhY2UgaW4gdGhlIGV4dGVuc2lvbiB0aGF0IGtub3dzIGhvdyB0byB3cml0ZSB0byBWUyBDb2RlLiBGb3JtYXR0aW5nXG4gKiBhbmQgcmVkYWN0aW9uIGxpdmUgaW4gYHNyYy9jb3JlL2xvZy9yZWRhY3QuanNgIHNvIHRoZXkgY2FuIGJlIHRlc3RlZCB3aXRob3V0IGFcbiAqIGhvc3QuXG4gKi9cblxuaW1wb3J0ICogYXMgdnNjb2RlIGZyb20gJ3ZzY29kZSc7XG5pbXBvcnQgeyBmb3JtYXRMb2dMaW5lIH0gZnJvbSAnLi4vY29yZS9sb2cvcmVkYWN0LmpzJztcblxuLyoqIEB0eXBlZGVmIHsnb2ZmJ3wnZXJyb3InfCd3YXJuJ3wnaW5mbyd8J2RlYnVnJ30gTG9nTGV2ZWwgKi9cblxuLyoqIEB0eXBlIHtSZWNvcmQ8TG9nTGV2ZWwsIG51bWJlcj59ICovXG5jb25zdCBMRVZFTF9SQU5LID0geyBvZmY6IDAsIGVycm9yOiAxLCB3YXJuOiAyLCBpbmZvOiAzLCBkZWJ1ZzogNCB9O1xuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEByZXR1cm5zIHtMb2dMZXZlbH1cbiAqL1xuZnVuY3Rpb24gY29lcmNlTGV2ZWwodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgJiYgdmFsdWUgaW4gTEVWRUxfUkFOS1xuICAgID8gLyoqIEB0eXBlIHtMb2dMZXZlbH0gKi8gKHZhbHVlKVxuICAgIDogJ3dhcm4nO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7dnNjb2RlLkV4dGVuc2lvbkNvbnRleHR9IGNvbnRleHRcbiAqIEByZXR1cm5zIHt7XG4gKiAgIGRlYnVnOiAobWVzc2FnZTogc3RyaW5nLCBmaWVsZHM/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT4gdm9pZCxcbiAqICAgaW5mbzogKG1lc3NhZ2U6IHN0cmluZywgZmllbGRzPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID0+IHZvaWQsXG4gKiAgIHdhcm46IChtZXNzYWdlOiBzdHJpbmcsIGZpZWxkcz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSA9PiB2b2lkLFxuICogICBlcnJvcjogKG1lc3NhZ2U6IHN0cmluZywgZmllbGRzPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID0+IHZvaWQsXG4gKiAgIHNob3c6ICgpID0+IHZvaWQsXG4gKiAgIGxldmVsOiAoKSA9PiBMb2dMZXZlbCxcbiAqICAgZGlzcG9zZTogKCkgPT4gdm9pZCxcbiAqIH19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMb2dnZXIoY29udGV4dCkge1xuICBjb25zdCBjaGFubmVsID0gdnNjb2RlLndpbmRvdy5jcmVhdGVPdXRwdXRDaGFubmVsKCdDb2RlRmxvdycpO1xuICBsZXQgbGV2ZWwgPSBjb2VyY2VMZXZlbCh2c2NvZGUud29ya3NwYWNlLmdldENvbmZpZ3VyYXRpb24oJ2NvZGVmbG93JykuZ2V0KCdsb2dMZXZlbCcsICd3YXJuJykpO1xuXG4gIGNvbnN0IGNvbmZpZ0xpc3RlbmVyID0gdnNjb2RlLndvcmtzcGFjZS5vbkRpZENoYW5nZUNvbmZpZ3VyYXRpb24oKGV2ZW50KSA9PiB7XG4gICAgaWYgKGV2ZW50LmFmZmVjdHNDb25maWd1cmF0aW9uKCdjb2RlZmxvdy5sb2dMZXZlbCcpKSB7XG4gICAgICBsZXZlbCA9IGNvZXJjZUxldmVsKHZzY29kZS53b3Jrc3BhY2UuZ2V0Q29uZmlndXJhdGlvbignY29kZWZsb3cnKS5nZXQoJ2xvZ0xldmVsJywgJ3dhcm4nKSk7XG4gICAgfVxuICB9KTtcbiAgY29udGV4dC5zdWJzY3JpcHRpb25zLnB1c2goY2hhbm5lbCwgY29uZmlnTGlzdGVuZXIpO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0xvZ0xldmVsfSBlbnRyeUxldmVsXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IFtmaWVsZHNdXG4gICAqL1xuICBmdW5jdGlvbiB3cml0ZShlbnRyeUxldmVsLCBtZXNzYWdlLCBmaWVsZHMpIHtcbiAgICBpZiAoTEVWRUxfUkFOS1tlbnRyeUxldmVsXSA+IExFVkVMX1JBTktbbGV2ZWxdIHx8IGxldmVsID09PSAnb2ZmJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjaGFubmVsLmFwcGVuZExpbmUoZm9ybWF0TG9nTGluZSh7IGxldmVsOiBlbnRyeUxldmVsLCBtZXNzYWdlLCBmaWVsZHMgfSkpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBkZWJ1ZzogKG1lc3NhZ2UsIGZpZWxkcykgPT4gd3JpdGUoJ2RlYnVnJywgbWVzc2FnZSwgZmllbGRzKSxcbiAgICBpbmZvOiAobWVzc2FnZSwgZmllbGRzKSA9PiB3cml0ZSgnaW5mbycsIG1lc3NhZ2UsIGZpZWxkcyksXG4gICAgd2FybjogKG1lc3NhZ2UsIGZpZWxkcykgPT4gd3JpdGUoJ3dhcm4nLCBtZXNzYWdlLCBmaWVsZHMpLFxuICAgIGVycm9yOiAobWVzc2FnZSwgZmllbGRzKSA9PiB3cml0ZSgnZXJyb3InLCBtZXNzYWdlLCBmaWVsZHMpLFxuICAgIHNob3c6ICgpID0+IGNoYW5uZWwuc2hvdyh0cnVlKSxcbiAgICBsZXZlbDogKCkgPT4gbGV2ZWwsXG4gICAgZGlzcG9zZTogKCkgPT4ge1xuICAgICAgY29uZmlnTGlzdGVuZXIuZGlzcG9zZSgpO1xuICAgICAgY2hhbm5lbC5kaXNwb3NlKCk7XG4gICAgfSxcbiAgfTtcbn1cbiIsICIvKipcbiAqIExvZyByZWRhY3Rpb24uXG4gKlxuICogTG9ncyBhcmUgZm9yIGRpYWdub3NpbmcgQ29kZUZsb3csIG5vdCBmb3IgcmVwcm9kdWNpbmcgcHJvamVjdCBjb250ZW50cy5cbiAqIFRoaXMgbW9kdWxlIGlzIHRoZSBzaW5nbGUgcGxhY2Ugd2hlcmUgYSB2YWx1ZSBiZWNvbWVzIGxvZyB0ZXh0LCBzbyB0aGUgcnVsZXNcbiAqIGxpdmUgaW4gb25lIHRlc3RlZCBmdW5jdGlvbiBpbnN0ZWFkIG9mIGJlaW5nIHJlLWltcGxlbWVudGVkIGF0IGNhbGwgc2l0ZXMuXG4gKlxuICogQWJzb2x1dGUgcnVsZXM6XG4gKiAtIE5ldmVyIGxvZyBhbmFseXplZCBzb3VyY2UgdGV4dC5cbiAqIC0gTmV2ZXIgbG9nIGNyZWRlbnRpYWxzLCB0b2tlbnMsIG9yIGtleXMsIGV2ZW4gaWYgYSBjYWxsZXIgcGFzc2VzIHRoZW0uXG4gKiAtIENhcCBldmVyeSB2YWx1ZSBzbyBvbmUgYmFkIGZpZWxkIGNhbm5vdCBmbG9vZCB0aGUgb3V0cHV0IGNoYW5uZWwuXG4gKi9cblxuZXhwb3J0IGNvbnN0IE1BWF9GSUVMRF9MRU5HVEggPSA1MDA7XG5leHBvcnQgY29uc3QgTUFYX0ZJRUxEUyA9IDIwO1xuY29uc3QgTUFYX0RFUFRIID0gMztcblxuY29uc3QgU0VDUkVUX0tFWV9QQVRURVJOID1cbiAgLyhwYXNzKHdvcmQpP3xzZWNyZXR8dG9rZW58YXBpWy1fXT9rZXl8YXBpa2V5fGNyZWRlbnRpYWx8YXV0aG9yaXphdGlvbnxjb29raWV8cHJpdmF0ZVstX10/a2V5KS9pO1xuXG5jb25zdCBTRUNSRVRfVkFMVUVfUEFUVEVSTlMgPSBbXG4gIFsvXFxiZ2hbcG91c3JdX1tBLVphLXowLTldezIwLH1cXGIvZywgJ2doKl8qKionXSxcbiAgWy9cXGJnaXRodWJfcGF0X1tBLVphLXowLTlfXXsyMCx9XFxiL2csICdnaXRodWJfcGF0XyoqKiddLFxuICBbL1xcYnNrLVtBLVphLXowLTldezIwLH1cXGIvZywgJ3NrLSoqKiddLFxuICBbL1xcYkFLSUFbMC05QS1aXXsxNn1cXGIvZywgJ0FLSUEqKionXSxcbiAgWy9cXGJ4b3hbYmFwcnNdLVtBLVphLXowLTktXXsxMCx9XFxiL2csICd4b3gqLSoqKiddLFxuXTtcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gaW5wdXRcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWRhY3RTdHJpbmcoaW5wdXQpIHtcbiAgbGV0IG91dHB1dCA9IGlucHV0O1xuICBmb3IgKGNvbnN0IFtwYXR0ZXJuLCByZXBsYWNlbWVudF0gb2YgU0VDUkVUX1ZBTFVFX1BBVFRFUk5TKSB7XG4gICAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UocGF0dGVybiwgcmVwbGFjZW1lbnQpO1xuICB9XG4gIGlmIChvdXRwdXQubGVuZ3RoID4gTUFYX0ZJRUxEX0xFTkdUSCkge1xuICAgIGNvbnN0IHJlbW92ZWQgPSBvdXRwdXQubGVuZ3RoIC0gTUFYX0ZJRUxEX0xFTkdUSDtcbiAgICBvdXRwdXQgPSBgJHtvdXRwdXQuc2xpY2UoMCwgTUFYX0ZJRUxEX0xFTkdUSCl9XHUyMDI2KCske3JlbW92ZWR9IGNoYXJzKWA7XG4gIH1cbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcGFyYW0ge251bWJlcn0gZGVwdGhcbiAqIEByZXR1cm5zIHt1bmtub3dufVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVkYWN0VmFsdWUodmFsdWUsIGRlcHRoID0gMCkge1xuICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiByZWRhY3RTdHJpbmcodmFsdWUpO1xuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdiaWdpbnQnKSB7XG4gICAgcmV0dXJuIGAke3ZhbHVlLnRvU3RyaW5nKCl9bmA7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiAnW2Z1bmN0aW9uXSc7XG4gIH1cbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICByZXR1cm4geyBuYW1lOiB2YWx1ZS5uYW1lLCBtZXNzYWdlOiByZWRhY3RTdHJpbmcodmFsdWUubWVzc2FnZSkgfTtcbiAgfVxuICBpZiAoZGVwdGggPj0gTUFYX0RFUFRIKSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpID8gJ1thcnJheV0nIDogJ1tvYmplY3RdJztcbiAgfVxuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUuc2xpY2UoMCwgTUFYX0ZJRUxEUykubWFwKChpdGVtKSA9PiByZWRhY3RWYWx1ZShpdGVtLCBkZXB0aCArIDEpKTtcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgIC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovXG4gICAgY29uc3Qgb3V0cHV0ID0ge307XG4gICAgY29uc3QgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKHZhbHVlKS5zbGljZSgwLCBNQVhfRklFTERTKTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIGNoaWxkXSBvZiBlbnRyaWVzKSB7XG4gICAgICBvdXRwdXRba2V5XSA9IFNFQ1JFVF9LRVlfUEFUVEVSTi50ZXN0KGtleSkgPyAnKioqJyA6IHJlZGFjdFZhbHVlKGNoaWxkLCBkZXB0aCArIDEpO1xuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0O1xuICB9XG4gIHJldHVybiBTdHJpbmcodmFsdWUpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCB1bmRlZmluZWR9IGZpZWxkc1xuICogQHJldHVybnMge1JlY29yZDxzdHJpbmcsIHVua25vd24+fVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVkYWN0RmllbGRzKGZpZWxkcykge1xuICBpZiAoIWZpZWxkcykge1xuICAgIHJldHVybiB7fTtcbiAgfVxuICAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqL1xuICBjb25zdCBvdXRwdXQgPSB7fTtcbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoZmllbGRzKS5zbGljZSgwLCBNQVhfRklFTERTKSkge1xuICAgIG91dHB1dFtrZXldID0gU0VDUkVUX0tFWV9QQVRURVJOLnRlc3Qoa2V5KSA/ICcqKionIDogcmVkYWN0VmFsdWUodmFsdWUpO1xuICB9XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cbi8qKlxuICogUmVuZGVyIG9uZSBsb2cgbGluZS4gU3RhYmxlIGZvcm1hdDogdGltZXN0YW1wLCBsZXZlbCwgbWVzc2FnZSwgZmllbGRzLlxuICpcbiAqIEBwYXJhbSB7e2xldmVsOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZywgZmllbGRzPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sIHRpbWVzdGFtcD86IERhdGV9fSBlbnRyeVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdExvZ0xpbmUoZW50cnkpIHtcbiAgY29uc3QgdGltZXN0YW1wID0gKGVudHJ5LnRpbWVzdGFtcCA/PyBuZXcgRGF0ZSgpKS50b0lTT1N0cmluZygpO1xuICBjb25zdCBsZXZlbCA9IGVudHJ5LmxldmVsLnRvVXBwZXJDYXNlKCkucGFkRW5kKDUpO1xuICBjb25zdCBmaWVsZHMgPSByZWRhY3RGaWVsZHMoZW50cnkuZmllbGRzKTtcbiAgY29uc3QgZmllbGRLZXlzID0gT2JqZWN0LmtleXMoZmllbGRzKTtcbiAgY29uc3Qgc3VmZml4ID0gZmllbGRLZXlzLmxlbmd0aCA+IDAgPyBgICR7SlNPTi5zdHJpbmdpZnkoZmllbGRzKX1gIDogJyc7XG4gIHJldHVybiBgWyR7dGltZXN0YW1wfV0gJHtsZXZlbH0gJHtyZWRhY3RTdHJpbmcoZW50cnkubWVzc2FnZSl9JHtzdWZmaXh9YDtcbn1cbiIsICIvKipcbiAqIENvZGVGbG93IFNlbWFudGljIFJlcHJlc2VudGF0aW9uIChDU1IpIFx1MjAxNCBub3JtYXRpdmUgdm9jYWJ1bGFyeSwgdmVyc2lvbiAxLjEuXG4gKlxuICogU1RBVFVTOiBOT1JNQVRJVkUuIGBkb2NzL0NTUl9TUEVDSUZJQ0FUSU9OLm1kYCBpcyB0aGUgcHJvc2UgY29udHJhY3Q7IHRoaXNcbiAqIG1vZHVsZSBpcyB0aGUgZXhlY3V0YWJsZSBoYWxmIG9mIGl0LiBFdmVyeSBjb25zdW1lciB0cmVhdHMgdGhlc2UgZW51bXMgYXNcbiAqIGNsb3NlZC4gQWRkaW5nIGEgdmFsdWUgcmVxdWlyZXMgdXBkYXRpbmcgdGhlIHNwZWMsIHRoZSB2YWxpZGF0b3IsIHRoZSBncmFwaFxuICogbGVnZW5kLCBhbmQgdGhlIHRlc3RzIGluIG9uZSBjaGFuZ2UuXG4gKlxuICogVmVyc2lvbiBwb2xpY3k6XG4gKiAtIGFkZGl0aXZlIGZpZWxkcyBhcmUgYSBtaW5vciBidW1wO1xuICogLSBzZW1hbnRpYyBjaGFuZ2VzIGFyZSBhIG1ham9yIGJ1bXA7XG4gKiAtIGNvbnN1bWVycyByZWplY3QgYW4gdW5rbm93biBtYWpvciBhbmQgaWdub3JlIGFuIHVua25vd24gbWlub3IuXG4gKi9cblxuZXhwb3J0IGNvbnN0IENTUl9WRVJTSU9OID0gJzEuMS4wJztcblxuLyoqIFRoZSBvbmx5IG1ham9yIHZlcnNpb24gdGhpcyBidWlsZCB1bmRlcnN0YW5kcy4gKi9cbmV4cG9ydCBjb25zdCBDU1JfU1VQUE9SVEVEX01BSk9SID0gMTtcblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcmV0dXJucyB7e21ham9yOiBudW1iZXIsIG1pbm9yOiBudW1iZXIsIHBhdGNoOiBudW1iZXJ9IHwgbnVsbH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQ3NyVmVyc2lvbih2YWx1ZSkge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnN0IG1hdGNoID0gL14oXFxkKylcXC4oXFxkKylcXC4oXFxkKykkLy5leGVjKHZhbHVlKTtcbiAgaWYgKCFtYXRjaCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiB7XG4gICAgbWFqb3I6IE51bWJlcihtYXRjaFsxXSksXG4gICAgbWlub3I6IE51bWJlcihtYXRjaFsyXSksXG4gICAgcGF0Y2g6IE51bWJlcihtYXRjaFszXSksXG4gIH07XG59XG5cbi8qKlxuICogQSBjb25zdW1lciBhY2NlcHRzIGFueSBtaW5vci9wYXRjaCBvZiBpdHMgc3VwcG9ydGVkIG1ham9yLiBJdCByZXBvcnRzIGFuXG4gKiB1bmtub3duIG5ld2VyIG1pbm9yIGFzIGEgZGlhZ25vc3RpYyByYXRoZXIgdGhhbiByZWplY3RpbmcgaXQsIGJlY2F1c2VcbiAqIGFkZGl0aXZlIGZpZWxkcyBtdXN0IG5vdCBicmVhayBvbGRlciBjb25zdW1lcnMuXG4gKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbXBhdGlibGVDc3JWZXJzaW9uKHZhbHVlKSB7XG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlQ3NyVmVyc2lvbih2YWx1ZSk7XG4gIHJldHVybiBwYXJzZWQgIT09IG51bGwgJiYgcGFyc2VkLm1ham9yID09PSBDU1JfU1VQUE9SVEVEX01BSk9SO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIHdoZW4gdGhlIHZlcnNpb24gaXMgbmV3ZXIgdGhhbiB0aGlzIGJ1aWxkJ3MgbWlub3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTmV3ZXJNaW5vcih2YWx1ZSkge1xuICBjb25zdCBwYXJzZWQgPSBwYXJzZUNzclZlcnNpb24odmFsdWUpO1xuICBjb25zdCBjdXJyZW50ID0gcGFyc2VDc3JWZXJzaW9uKENTUl9WRVJTSU9OKTtcbiAgaWYgKCFwYXJzZWQgfHwgIWN1cnJlbnQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHBhcnNlZC5tYWpvciA9PT0gY3VycmVudC5tYWpvciAmJiBwYXJzZWQubWlub3IgPiBjdXJyZW50Lm1pbm9yO1xufVxuXG4vKiogQHR5cGUge3JlYWRvbmx5IHN0cmluZ1tdfSAqL1xuZXhwb3J0IGNvbnN0IFNZTUJPTF9LSU5EUyA9IE9iamVjdC5mcmVlemUoW1xuICAnZmlsZScsXG4gICduYW1lc3BhY2UnLFxuICAnbW9kdWxlJyxcbiAgJ2NsYXNzJyxcbiAgJ3N0cnVjdCcsXG4gICdpbnRlcmZhY2UnLFxuICAnZnVuY3Rpb24nLFxuICAnbWV0aG9kJyxcbiAgJ2NvbnN0cnVjdG9yJyxcbiAgJ2Rlc3RydWN0b3InLFxuICAnbGFtYmRhJyxcbiAgJ2Nsb3N1cmUnLFxuICAndmFyaWFibGUnLFxuICAncGFyYW1ldGVyJyxcbiAgJ2ZpZWxkJyxcbiAgJ3Byb3BlcnR5JyxcbiAgJ2VudW0nLFxuICAnZW51bV9tZW1iZXInLFxuICAndHlwZV9hbGlhcycsXG4gICdtYWNybycsXG4gICd1bmtub3duJyxcbl0pO1xuXG4vKipcbiAqIFN0b3JlZCByZWxhdGlvbnNoaXAgdHlwZXMuIEludmVyc2UgdHlwZXMgKGBjYWxsZWRfYnlgLCBgZGVmaW5lZF9pbmAsXG4gKiBgcmVmZXJlbmNlZF9ieWApIGFyZSBkZXJpdmVkIGJ5IHRoZSBxdWVyeSBsYXllciBhbmQgbXVzdCBuZXZlciBiZSBzdG9yZWQ6XG4gKiBzdG9yaW5nIGJvdGggZGlyZWN0aW9ucyBpbnZpdGVzIGRyaWZ0LlxuICpcbiAqIEB0eXBlIHtyZWFkb25seSBzdHJpbmdbXX1cbiAqL1xuZXhwb3J0IGNvbnN0IFJFTEFUSU9OU0hJUF9UWVBFUyA9IE9iamVjdC5mcmVlemUoW1xuICAnY2FsbHMnLFxuICAncmVmZXJlbmNlcycsXG4gICdkZWZpbmVzJyxcbiAgJ2RlY2xhcmVzJyxcbiAgJ2ltcG9ydHMnLFxuICAnZXhwb3J0cycsXG4gICdpbmNsdWRlcycsXG4gICdpbmhlcml0cycsXG4gICdpbXBsZW1lbnRzJyxcbiAgJ292ZXJyaWRlcycsXG4gICdpbnN0YW50aWF0ZXMnLFxuICAncmVhZHMnLFxuICAnd3JpdGVzJyxcbiAgJ2Fzc2lnbnMnLFxuICAncGFyYW1ldGVyX29mJyxcbiAgJ2NhcHR1cmVzJyxcbl0pO1xuXG4vKiogUmVsYXRpb25zaGlwIHR5cGVzIHRoZSBxdWVyeSBsYXllciBjYW4gc3ludGhlc2lzZS4gTmV2ZXIgc3RvcmVkLiAqL1xuZXhwb3J0IGNvbnN0IERFUklWRURfUkVMQVRJT05TSElQX1RZUEVTID0gT2JqZWN0LmZyZWV6ZShbXG4gICdjYWxsZWRfYnknLFxuICAnZGVmaW5lZF9pbicsXG4gICdyZWZlcmVuY2VkX2J5JyxcbiAgJ2RlY2xhcmVkX2J5JyxcbiAgJ3JlYWRfYnknLFxuICAnd3JpdHRlbl9ieScsXG4gICdjYXB0dXJlZF9ieScsXG5dKTtcblxuLyoqIENlcnRhaW50eSBtb2RlbC4gYHJlc29sdmVkYCBpcyB0aGUgb25seSBzdGF0dXMgdGhhdCBpbXBsaWVzIGNlcnRhaW50eS4gKi9cbmV4cG9ydCBjb25zdCBSRVNPTFVUSU9OX1NUQVRVU0VTID0gT2JqZWN0LmZyZWV6ZShbXG4gICdyZXNvbHZlZCcsXG4gICdpbmZlcnJlZCcsXG4gICdwb3NzaWJsZScsXG4gICd1bnJlc29sdmVkJyxcbiAgJ3N0YWxlJyxcbl0pO1xuXG4vKipcbiAqIENsb3NlZCByZWFzb24tY29kZSB2b2NhYnVsYXJ5LiBGcmVlLXRleHQgZXhwbGFuYXRpb25zIGJlbG9uZyBpbiBkaWFnbm9zdGljcztcbiAqIHJlYXNvbiBjb2RlcyBhcmUgYSBmaWx0ZXJhYmxlLCBncm91cGFibGUgZW51bS5cbiAqXG4gKiBAdHlwZSB7cmVhZG9ubHkgc3RyaW5nW119XG4gKi9cbmV4cG9ydCBjb25zdCBSRUFTT05fQ09ERVMgPSBPYmplY3QuZnJlZXplKFtcbiAgJ2R5bmFtaWNfZGlzcGF0Y2gnLFxuICAnZnVuY3Rpb25fcG9pbnRlcicsXG4gICdtaXNzaW5nX2NvbXBpbGVfZGInLFxuICAnbWlzc2luZ19zeXN0ZW1faGVhZGVycycsXG4gICd0b29sY2hhaW5fdmVyc2lvbl9taXNtYXRjaCcsXG4gICd0ZW1wbGF0ZV9kZXBlbmRlbnQnLFxuICAndW5zdXBwb3J0ZWRfY29uc3RydWN0JyxcbiAgJ2hlYWRlcl93aXRob3V0X3R1JyxcbiAgJ21hY3JvX2V4cGFuc2lvbicsXG4gICd1bmtub3duX2ltcG9ydF90YXJnZXQnLFxuICAnZXh0ZXJuYWxfcGFja2FnZScsXG4gICdwYXRoX2FsaWFzX3VucmVzb2x2ZWQnLFxuICAnZXhwb3J0c19tYXBfdW5zdXBwb3J0ZWQnLFxuICAncmVleHBvcnRfZGVwdGhfZXhjZWVkZWQnLFxuICAnb3ZlcmxvYWRfYW1iaWd1b3VzJyxcbiAgJ291dF9vZl9zY29wZScsXG4gICdwYXJzZV9lcnJvcicsXG4gICd1bnN1cHBvcnRlZF9zeW50YXgnLFxuICAndW5rbm93bl9yZWNlaXZlcicsXG4gICdjb21wdXRlZF9tZW1iZXInLFxuICAnZXZhbF9zY29wZScsXG4gICdkeW5hbWljX3Njb3BlJyxcbiAgJ3Byb3RvdHlwZV9tdXRhdGlvbicsXG4gICdjYWxsYmFja19wYXJhbWV0ZXInLFxuICAnZGVmZXJyZWRfaW52b2NhdGlvbicsXG4gICdtaXhlZF9tb2R1bGVfc3lzdGVtJyxcbiAgJ2luZGV4X3N0YWxlJyxcbiAgJ3Rvb19kZWVwJyxcbiAgJ2dlbmVyYXRlZF9zb3VyY2UnLFxuICAndW5zdXBwb3J0ZWRfbGFuZ3VhZ2UnLFxuICAnYnVkZ2V0X2V4Y2VlZGVkJyxcbiAgJ2NhbmNlbGxlZCcsXG4gICdhZGFwdGVyX2Vycm9yJyxcbiAgJ2ludGVybmFsX2Vycm9yJyxcbiAgJ21vY2tfZGF0YScsXG5dKTtcblxuLyoqIEh1bWFuIGRlc2NyaXB0aW9ucyB1c2VkIGJ5IGRpYWdub3N0aWNzIGFuZCB0aGUgY2FwYWJpbGl0eSBVSS4gKi9cbmV4cG9ydCBjb25zdCBSRUFTT05fQ09ERV9ERVNDUklQVElPTlMgPSBPYmplY3QuZnJlZXplKHtcbiAgZHluYW1pY19kaXNwYXRjaDogJ1RoZSB0YXJnZXQgZGVwZW5kcyBvbiBhIHZhbHVlIHRoYXQgaXMgb25seSBrbm93biBhdCBydW50aW1lLicsXG4gIGZ1bmN0aW9uX3BvaW50ZXI6ICdUaGUgY2FsbCBnb2VzIHRocm91Z2ggYSBmdW5jdGlvbiBwb2ludGVyLCBjYWxsYmFjaywgb3IgYm91bmQgbWV0aG9kLicsXG4gIG1pc3NpbmdfY29tcGlsZV9kYjogJ05vIGNvbXBpbGUgZGF0YWJhc2Ugb3IgaW5jbHVkZSBjb25maWd1cmF0aW9uIHdhcyBhdmFpbGFibGUuJyxcbiAgbWlzc2luZ19zeXN0ZW1faGVhZGVyczpcbiAgICAnU3lzdGVtIGhlYWRlcnMgd2VyZSBub3QgYXZhaWxhYmxlLCBzbyBzb21lIGRlY2xhcmF0aW9ucyBjb3VsZCBub3QgYmUgcmVzb2x2ZWQuJyxcbiAgdG9vbGNoYWluX3ZlcnNpb25fbWlzbWF0Y2g6ICdUaGUgaW5zdGFsbGVkIHRvb2xjaGFpbiBpcyBvdXRzaWRlIHRoZSBzdXBwb3J0ZWQgdmVyc2lvbiByYW5nZS4nLFxuICB0ZW1wbGF0ZV9kZXBlbmRlbnQ6ICdUaGUgdGFyZ2V0IGRlcGVuZHMgb24gYSB0ZW1wbGF0ZSBwYXJhbWV0ZXIgdGhhdCBpcyBub3Qga25vd24gaGVyZS4nLFxuICB1bnN1cHBvcnRlZF9jb25zdHJ1Y3Q6ICdUaGUgY29uc3RydWN0IGlzIG91dHNpZGUgdGhlIHN1cHBvcnRlZCBhbmFseXNpcyBib3VuZGFyaWVzLicsXG4gIGhlYWRlcl93aXRob3V0X3R1OiAnTm8gdHJhbnNsYXRpb24gdW5pdCBpbmNsdWRlcyB0aGlzIGhlYWRlciwgc28gaXQgd2FzIGFuYWx5emVkIHN5bnRhY3RpY2FsbHkuJyxcbiAgbWFjcm9fZXhwYW5zaW9uOiAnVGhlIGZhY3QgY29tZXMgZnJvbSBtYWNyby1leHBhbmRlZCBjb2RlLCBub3QgdXNlci13cml0dGVuIHNvdXJjZS4nLFxuICB1bmtub3duX2ltcG9ydF90YXJnZXQ6ICdUaGUgaW1wb3J0ZWQgbW9kdWxlIGNvdWxkIG5vdCBiZSByZXNvbHZlZCBpbnNpZGUgdGhlIHNjb3BlLicsXG4gIGV4dGVybmFsX3BhY2thZ2U6ICdUaGUgdGFyZ2V0IGlzIGluIGFuIGV4dGVybmFsIHBhY2thZ2UgYW5kIGlzIG5vdCBhbmFseXplZCBpbiB0aGlzIHBoYXNlLicsXG4gIHBhdGhfYWxpYXNfdW5yZXNvbHZlZDogJ0EgYnVuZGxlciBvciB0c2NvbmZpZyBwYXRoIGFsaWFzIGNvdWxkIG5vdCBiZSByZXNvbHZlZC4nLFxuICBleHBvcnRzX21hcF91bnN1cHBvcnRlZDogJ1RoZSBwYWNrYWdlIGV4cG9ydHMgbWFwIGlzIHVuc3VwcG9ydGVkIG9yIGNvdWxkIG5vdCBiZSByZXNvbHZlZC4nLFxuICByZWV4cG9ydF9kZXB0aF9leGNlZWRlZDogJ1RoZSByZS1leHBvcnQgY2hhaW4gZXhjZWVkZWQgdGhlIGNvbmZpZ3VyZWQgZGVwdGggYnVkZ2V0LicsXG4gIG92ZXJsb2FkX2FtYmlndW91czogJ01vcmUgdGhhbiBvbmUgZGVjbGFyYXRpb24gbWF0Y2hlcyBhbmQgdGhlIGFkYXB0ZXIgY2Fubm90IGNob29zZS4nLFxuICBvdXRfb2Zfc2NvcGU6ICdUaGUgdGFyZ2V0IGlzIHJlYWwgYnV0IG91dHNpZGUgdGhlIGFuYWx5c2VkIHNjb3BlLicsXG4gIHBhcnNlX2Vycm9yOiAnVGhlIHNvdXJjZSBjb3VsZCBub3QgYmUgcGFyc2VkIGNvbXBsZXRlbHkuJyxcbiAgdW5zdXBwb3J0ZWRfc3ludGF4OiAnVGhlIGZpbGUgdXNlcyBzeW50YXggdGhpcyBhZGFwdGVyIGRvZXMgbm90IHN1cHBvcnQuJyxcbiAgdW5rbm93bl9yZWNlaXZlcjogJ1RoZSByZWNlaXZlciBvZiB0aGUgbWVtYmVyIGNhbGwgaGFzIG5vIHN0YXRpY2FsbHkga25vd24gc2hhcGUuJyxcbiAgY29tcHV0ZWRfbWVtYmVyOiAnVGhlIG1lbWJlciBuYW1lIGlzIGNvbXB1dGVkIGFuZCBjYW5ub3QgYmUgcmVzb2x2ZWQgc3RhdGljYWxseS4nLFxuICBldmFsX3Njb3BlOiAnQW4gZXZhbCBvciBGdW5jdGlvbiBjb25zdHJ1Y3RvciBtYWtlcyB0aGUgc3Vycm91bmRpbmcgc2NvcGUgZHluYW1pYy4nLFxuICBkeW5hbWljX3Njb3BlOiAnQSB3aXRoIHN0YXRlbWVudCBtYWtlcyB0aGUgc3Vycm91bmRpbmcgc2NvcGUgZHluYW1pYy4nLFxuICBwcm90b3R5cGVfbXV0YXRpb246ICdBIHByb3RvdHlwZSB3YXMgbXV0YXRlZCwgc28gdGhlIHRhcmdldCBzZXQgaXMgdW5jZXJ0YWluLicsXG4gIGNhbGxiYWNrX3BhcmFtZXRlcjogJ1RoZSBjYWxsIGdvZXMgdGhyb3VnaCBhIGNhbGxiYWNrIHBhcmFtZXRlciByYXRoZXIgdGhhbiBhIGRpcmVjdCBjYWxsLicsXG4gIGRlZmVycmVkX2ludm9jYXRpb246ICdUaGUgY2FsbCBpcyBzY2hlZHVsZWQgZm9yIGxhdGVyIGJ5IGEgdGltZXIgb3IgZXZlbnQgbG9vcC4nLFxuICBtaXhlZF9tb2R1bGVfc3lzdGVtOiAnVGhlIGZpbGUgbWl4ZXMgRVNNIGFuZCBDb21tb25KUyBzZW1hbnRpY3MuJyxcbiAgaW5kZXhfc3RhbGU6ICdUaGUgZmFjdCB3YXMgcHJvZHVjZWQgYnkgYW4gb2xkZXIgYW5hbHlzaXMgYW5kIG1heSBubyBsb25nZXIgaG9sZC4nLFxuICB0b29fZGVlcDogJ1RoZSBhZGFwdGVyIHN0b3BwZWQgZm9sbG93aW5nIHJlZmVyZW5jZXMgYXQgaXRzIGRlcHRoIGJ1ZGdldC4nLFxuICBnZW5lcmF0ZWRfc291cmNlOiAnVGhlIGZpbGUgaXMgZ2VuZXJhdGVkIG91dHB1dCBhbmQgaXMgZXhjbHVkZWQgYnkgcG9saWN5LicsXG4gIHVuc3VwcG9ydGVkX2xhbmd1YWdlOiAnTm8gYWRhcHRlciBpbiB0aGlzIGJ1aWxkIHVuZGVyc3RhbmRzIHRoZSBsYW5ndWFnZS4nLFxuICBidWRnZXRfZXhjZWVkZWQ6ICdUaGUgYW5hbHlzaXMgc3RvcHBlZCBiZWNhdXNlIGEgdGltZSwgbWVtb3J5LCBvciBzaXplIGJ1ZGdldCB3YXMgcmVhY2hlZC4nLFxuICBjYW5jZWxsZWQ6ICdUaGUgdXNlciBvciBob3N0IGNhbmNlbGxlZCB0aGUgYW5hbHlzaXMuJyxcbiAgYWRhcHRlcl9lcnJvcjogJ1RoZSBhZGFwdGVyIGZhaWxlZCB3aGlsZSBhbmFseXNpbmc7IG91dHB1dCBtYXkgYmUgaW5jb21wbGV0ZS4nLFxuICBpbnRlcm5hbF9lcnJvcjogJ0NvZGVGbG93IGhpdCBhbiBpbnRlcm5hbCBlcnJvciB3aGlsZSBidWlsZGluZyB0aGlzIHJlc3VsdC4nLFxuICBtb2NrX2RhdGE6ICdUaGlzIGZhY3QgY29tZXMgZnJvbSB0aGUgZGVtb25zdHJhdGlvbiBmaXh0dXJlLCBub3QgcmVhbCBjb2RlLicsXG59KTtcblxuZXhwb3J0IGNvbnN0IENPTVBMRVRFTkVTU19MRVZFTFMgPSBPYmplY3QuZnJlZXplKFsnZnVsbCcsICdwYXJ0aWFsJywgJ3N5bnRhY3RpY19vbmx5J10pO1xuXG5leHBvcnQgY29uc3QgRElBR05PU1RJQ19TRVZFUklUSUVTID0gT2JqZWN0LmZyZWV6ZShbJ2luZm8nLCAnd2FybmluZycsICdlcnJvciddKTtcblxuZXhwb3J0IGNvbnN0IFZJU0lCSUxJVElFUyA9IE9iamVjdC5mcmVlemUoW1xuICAncHVibGljJyxcbiAgJ3Byb3RlY3RlZCcsXG4gICdwcml2YXRlJyxcbiAgJ2ludGVybmFsJyxcbiAgJ3BhY2thZ2UnLFxuICAnbG9jYWwnLFxuICAndW5rbm93bicsXG5dKTtcblxuLyoqIExhbmd1YWdlLW5ldXRyYWwgY29udHJvbCBzdHJ1Y3R1cmUgdm9jYWJ1bGFyeSAoUGhhc2UgNCBjb25zdW1lcyB0aGlzKS4gKi9cbmV4cG9ydCBjb25zdCBDT05UUk9MX0NPTlNUUlVDVF9LSU5EUyA9IE9iamVjdC5mcmVlemUoW1xuICAnZW50cnknLFxuICAnZXhpdCcsXG4gICdzZXF1ZW5jZScsXG4gICdibG9jaycsXG4gICdpZicsXG4gICdlbHNlJyxcbiAgJ3N3aXRjaCcsXG4gICdjYXNlJyxcbiAgJ2xvb3AnLFxuICAnZm9yJyxcbiAgJ3doaWxlJyxcbiAgJ2RvX3doaWxlJyxcbiAgJ3RyeScsXG4gICdjYXRjaCcsXG4gICdmaW5hbGx5JyxcbiAgJ3JldHVybicsXG4gICd0aHJvdycsXG4gICdicmVhaycsXG4gICdjb250aW51ZScsXG4gICdhd2FpdCcsXG4gICd5aWVsZCcsXG4gICdqdW1wJyxcbiAgJ3Vua25vd24nLFxuXSk7XG5cbi8qKiBEYXRhLWZsb3cgZmFjdCBraW5kcyAoUGhhc2UgMTEgY29uc3VtZXMgdGhlc2UpLiAqL1xuZXhwb3J0IGNvbnN0IERBVEFfRkFDVF9LSU5EUyA9IE9iamVjdC5mcmVlemUoW1xuICAnZGVmaW5pdGlvbicsXG4gICd1c2UnLFxuICAnYXNzaWdubWVudCcsXG4gICdyZWFkJyxcbiAgJ3dyaXRlJyxcbiAgJ3BhcmFtZXRlcicsXG4gICdyZXR1cm4nLFxuICAnY2FwdHVyZScsXG5dKTtcblxuZXhwb3J0IGNvbnN0IEVWSURFTkNFX0tJTkRTID0gT2JqZWN0LmZyZWV6ZShbXG4gICdzb3VyY2VfcmFuZ2UnLFxuICAnc3ltYm9sJyxcbiAgJ3JlbGF0aW9uc2hpcCcsXG4gICdkaWFnbm9zdGljJyxcbiAgJ21hY3JvX2V4cGFuc2lvbicsXG4gICdpbXBvcnQnLFxuICAnaGV1cmlzdGljJyxcbl0pO1xuXG4vKiogQ2FwYWJpbGl0aWVzIGFuIGFkYXB0ZXIgbWF5IGRlY2xhcmUuIFZhbHVlcyBhcmUgYHRydWVgLCBgJ3BhcnRpYWwnYCwgb3IgZmFsc2UuICovXG5leHBvcnQgY29uc3QgQ0FQQUJJTElUWV9LRVlTID0gT2JqZWN0LmZyZWV6ZShbXG4gICdwYXJzZScsXG4gICdkaXNjb3ZlckRlY2xhcmF0aW9ucycsXG4gICdyZXNvbHZlU3ltYm9scycsXG4gICdyZXNvbHZlVHlwZXMnLFxuICAncmVzb2x2ZUNhbGxzJyxcbiAgJ2dlbmVyYXRlQ0ZHJyxcbiAgJ2dlbmVyYXRlREZHJyxcbiAgJ3Jlc29sdmVJbXBvcnRzJyxcbiAgJ21hcFNvdXJjZUxvY2F0aW9ucycsXG4gICdyZXBvcnREaWFnbm9zdGljcycsXG5dKTtcblxuLyoqIFByZWZpeGVzIHRoYXQgbWFyayBhIHRhcmdldCBhcyBvdXRzaWRlIHRoZSBhbmFseXNlZCBydW4uICovXG5leHBvcnQgY29uc3QgRVhURVJOQUxfVEFSR0VUX1BSRUZJWCA9ICdleHRlcm5hbDonO1xuIiwgIi8qKlxuICogU2l6ZSBjZWlsaW5ncyBmb3IgYSBzaW5nbGUgQ1NSIHJ1bi5cbiAqXG4gKiBUaGVzZSBhcmUgY29ycmVjdG5lc3MgbGltaXRzLCBub3QgcGVyZm9ybWFuY2UgdHVuaW5nOiBhbiBhZGFwdGVyIHRoYXQgZW1pdHNcbiAqIGFuIHVuYm91bmRlZCBhcnJheSBtdXN0IGJlIHN0b3BwZWQgYXQgdGhlIGJvdW5kYXJ5IHJhdGhlciB0aGFuIGFsbG93ZWQgdG9cbiAqIGV4aGF1c3QgbWVtb3J5IGluIHRoZSBob3N0LiBPdmVyc2l6ZWQgaW5wdXQgaXMgcmVqZWN0ZWQgd2l0aCBgRV9MSU1JVGA7IGl0IGlzXG4gKiBuZXZlciB0cnVuY2F0ZWQsIGJlY2F1c2Ugc2lsZW50IHRydW5jYXRpb24gd291bGQgdHVybiBhbiBpbmNvbXBsZXRlIGdyYXBoIGludG9cbiAqIGEgZ3JhcGggdGhhdCBtZXJlbHkgbG9va3MgY29tcGxldGUuXG4gKlxuICogUGhhc2UgOC85IG1heSByYWlzZSB0aGUgY29sbGVjdGlvbiBsaW1pdHMgZm9yIGxhcmdlIHdvcmtzcGFjZXMsIGJ1dCB0aGVcbiAqIGludmFyaWFudCBzdGF5czogdGhlIHJlZ2lzdHJ5IHJlZnVzZXMgYmVmb3JlIHRoZSBkYXRhIHJlYWNoZXMgY29uc3VtZXJzLlxuICovXG5cbmV4cG9ydCBjb25zdCBDU1JfTElNSVRTID0gT2JqZWN0LmZyZWV6ZSh7XG4gIG1heEZpbGVzOiA1XzAwMCxcbiAgbWF4U3ltYm9sczogMjAwXzAwMCxcbiAgbWF4UmVsYXRpb25zaGlwczogNTAwXzAwMCxcbiAgbWF4Q29uc3RydWN0czogMjAwXzAwMCxcbiAgbWF4RGF0YUZhY3RzOiA1MDBfMDAwLFxuICBtYXhEaWFnbm9zdGljczogMTBfMDAwLFxuICBtYXhFdmlkZW5jZVBlclJlbGF0aW9uc2hpcDogMzIsXG4gIG1heEFmZmVjdHNQZXJEaWFnbm9zdGljOiA2NCxcbiAgbWF4U3RyaW5nTGVuZ3RoOiA0XzA5NixcbiAgbWF4UGF0aExlbmd0aDogMV8wMjQsXG4gIG1heE5hbWVMZW5ndGg6IDUxMixcbiAgbWF4TWVzc2FnZUxlbmd0aDogMl8wMDAsXG4gIG1heEV4dGVuc2lvbnNLZXlzOiAxMjgsXG4gIG1heFNlcmlhbGl6ZWRCeXRlczogOF8wMDBfMDAwLFxufSk7XG5cbi8qKlxuICogQHR5cGVkZWYge3twYXRoOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZywgY29kZTogJ0VfTElNSVQnfX0gTGltaXRJc3N1ZVxuICovXG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHBhcmFtIHtudW1iZXJ9IG1heFxuICogQHBhcmFtIHtzdHJpbmd9IHBhdGhcbiAqIEBwYXJhbSB7c3RyaW5nfSBsYWJlbFxuICogQHBhcmFtIHtMaW1pdElzc3VlW119IGlzc3Vlc1xuICovXG5mdW5jdGlvbiBjaGVja0FycmF5KHZhbHVlLCBtYXgsIHBhdGgsIGxhYmVsLCBpc3N1ZXMpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA+IG1heCkge1xuICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgIHBhdGgsXG4gICAgICBjb2RlOiAnRV9MSU1JVCcsXG4gICAgICBtZXNzYWdlOiBgJHtsYWJlbH0gaGFzICR7dmFsdWUubGVuZ3RofSBlbnRyaWVzOyB0aGUgbGltaXQgaXMgJHttYXh9LmAsXG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcGFyYW0ge251bWJlcn0gbWF4XG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aFxuICogQHBhcmFtIHtzdHJpbmd9IGxhYmVsXG4gKiBAcGFyYW0ge0xpbWl0SXNzdWVbXX0gaXNzdWVzXG4gKi9cbmZ1bmN0aW9uIGNoZWNrU3RyaW5nKHZhbHVlLCBtYXgsIHBhdGgsIGxhYmVsLCBpc3N1ZXMpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgJiYgdmFsdWUubGVuZ3RoID4gbWF4KSB7XG4gICAgaXNzdWVzLnB1c2goe1xuICAgICAgcGF0aCxcbiAgICAgIGNvZGU6ICdFX0xJTUlUJyxcbiAgICAgIG1lc3NhZ2U6IGAke2xhYmVsfSBpcyAke3ZhbHVlLmxlbmd0aH0gY29kZSB1bml0czsgdGhlIGxpbWl0IGlzICR7bWF4fS5gLFxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSBydW5cbiAqIEByZXR1cm5zIHt7b2s6IHRydWV9IHwge29rOiBmYWxzZSwgaXNzdWVzOiBMaW1pdElzc3VlW119fVxuICovXG5leHBvcnQgZnVuY3Rpb24gZW5mb3JjZUxpbWl0cyhydW4pIHtcbiAgLyoqIEB0eXBlIHtMaW1pdElzc3VlW119ICovXG4gIGNvbnN0IGlzc3VlcyA9IFtdO1xuXG4gIGlmICh0eXBlb2YgcnVuICE9PSAnb2JqZWN0JyB8fCBydW4gPT09IG51bGwgfHwgQXJyYXkuaXNBcnJheShydW4pKSB7XG4gICAgcmV0dXJuIHsgb2s6IHRydWUgfTtcbiAgfVxuICBjb25zdCBjYW5kaWRhdGUgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAocnVuKTtcblxuICBjaGVja0FycmF5KGNhbmRpZGF0ZS5maWxlcywgQ1NSX0xJTUlUUy5tYXhGaWxlcywgJ2ZpbGVzJywgJ2ZpbGVzJywgaXNzdWVzKTtcbiAgY2hlY2tBcnJheShjYW5kaWRhdGUuc3ltYm9scywgQ1NSX0xJTUlUUy5tYXhTeW1ib2xzLCAnc3ltYm9scycsICdzeW1ib2xzJywgaXNzdWVzKTtcbiAgY2hlY2tBcnJheShcbiAgICBjYW5kaWRhdGUucmVsYXRpb25zaGlwcyxcbiAgICBDU1JfTElNSVRTLm1heFJlbGF0aW9uc2hpcHMsXG4gICAgJ3JlbGF0aW9uc2hpcHMnLFxuICAgICdyZWxhdGlvbnNoaXBzJyxcbiAgICBpc3N1ZXMsXG4gICk7XG4gIGNoZWNrQXJyYXkoXG4gICAgY2FuZGlkYXRlLmNvbnRyb2xDb25zdHJ1Y3RzLFxuICAgIENTUl9MSU1JVFMubWF4Q29uc3RydWN0cyxcbiAgICAnY29udHJvbENvbnN0cnVjdHMnLFxuICAgICdjb250cm9sQ29uc3RydWN0cycsXG4gICAgaXNzdWVzLFxuICApO1xuICBjaGVja0FycmF5KGNhbmRpZGF0ZS5kYXRhRmFjdHMsIENTUl9MSU1JVFMubWF4RGF0YUZhY3RzLCAnZGF0YUZhY3RzJywgJ2RhdGFGYWN0cycsIGlzc3Vlcyk7XG4gIGNoZWNrQXJyYXkoXG4gICAgY2FuZGlkYXRlLmRpYWdub3N0aWNzLFxuICAgIENTUl9MSU1JVFMubWF4RGlhZ25vc3RpY3MsXG4gICAgJ2RpYWdub3N0aWNzJyxcbiAgICAnZGlhZ25vc3RpY3MnLFxuICAgIGlzc3VlcyxcbiAgKTtcblxuICBjaGVja1N0cmluZyhjYW5kaWRhdGUucnVuSWQsIENTUl9MSU1JVFMubWF4U3RyaW5nTGVuZ3RoLCAncnVuSWQnLCAncnVuSWQnLCBpc3N1ZXMpO1xuICBjaGVja1N0cmluZyhjYW5kaWRhdGUuYWRhcHRlcklkLCBDU1JfTElNSVRTLm1heFN0cmluZ0xlbmd0aCwgJ2FkYXB0ZXJJZCcsICdhZGFwdGVySWQnLCBpc3N1ZXMpO1xuICBjaGVja1N0cmluZyhjYW5kaWRhdGUubGFuZ3VhZ2UsIENTUl9MSU1JVFMubWF4U3RyaW5nTGVuZ3RoLCAnbGFuZ3VhZ2UnLCAnbGFuZ3VhZ2UnLCBpc3N1ZXMpO1xuXG4gIGlmIChBcnJheS5pc0FycmF5KGNhbmRpZGF0ZS5maWxlcykpIHtcbiAgICBjYW5kaWRhdGUuZmlsZXMuZm9yRWFjaCgoZmlsZSwgaW5kZXgpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgZmlsZSAhPT0gJ29iamVjdCcgfHwgZmlsZSA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCByZWNvcmQgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAoZmlsZSk7XG4gICAgICBjaGVja1N0cmluZyhyZWNvcmQucGF0aCwgQ1NSX0xJTUlUUy5tYXhQYXRoTGVuZ3RoLCBgZmlsZXNbJHtpbmRleH1dLnBhdGhgLCAncGF0aCcsIGlzc3Vlcyk7XG4gICAgICBjaGVja1N0cmluZyhcbiAgICAgICAgcmVjb3JkLmNvbnRlbnRIYXNoLFxuICAgICAgICBDU1JfTElNSVRTLm1heFN0cmluZ0xlbmd0aCxcbiAgICAgICAgYGZpbGVzWyR7aW5kZXh9XS5jb250ZW50SGFzaGAsXG4gICAgICAgICdjb250ZW50SGFzaCcsXG4gICAgICAgIGlzc3VlcyxcbiAgICAgICk7XG4gICAgfSk7XG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShjYW5kaWRhdGUuc3ltYm9scykpIHtcbiAgICBjYW5kaWRhdGUuc3ltYm9scy5mb3JFYWNoKChzeW1ib2wsIGluZGV4KSA9PiB7XG4gICAgICBpZiAodHlwZW9mIHN5bWJvbCAhPT0gJ29iamVjdCcgfHwgc3ltYm9sID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlY29yZCA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChzeW1ib2wpO1xuICAgICAgY2hlY2tTdHJpbmcocmVjb3JkLm5hbWUsIENTUl9MSU1JVFMubWF4TmFtZUxlbmd0aCwgYHN5bWJvbHNbJHtpbmRleH1dLm5hbWVgLCAnbmFtZScsIGlzc3Vlcyk7XG4gICAgICBjaGVja1N0cmluZyhcbiAgICAgICAgcmVjb3JkLnF1YWxpZmllZE5hbWUsXG4gICAgICAgIENTUl9MSU1JVFMubWF4TmFtZUxlbmd0aCxcbiAgICAgICAgYHN5bWJvbHNbJHtpbmRleH1dLnF1YWxpZmllZE5hbWVgLFxuICAgICAgICAncXVhbGlmaWVkTmFtZScsXG4gICAgICAgIGlzc3VlcyxcbiAgICAgICk7XG4gICAgICBjaGVja1N0cmluZyhcbiAgICAgICAgcmVjb3JkLnNpZ25hdHVyZSxcbiAgICAgICAgQ1NSX0xJTUlUUy5tYXhTdHJpbmdMZW5ndGgsXG4gICAgICAgIGBzeW1ib2xzWyR7aW5kZXh9XS5zaWduYXR1cmVgLFxuICAgICAgICAnc2lnbmF0dXJlJyxcbiAgICAgICAgaXNzdWVzLFxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuXG4gIGlmIChBcnJheS5pc0FycmF5KGNhbmRpZGF0ZS5yZWxhdGlvbnNoaXBzKSkge1xuICAgIGNhbmRpZGF0ZS5yZWxhdGlvbnNoaXBzLmZvckVhY2goKHJlbGF0aW9uc2hpcCwgaW5kZXgpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgcmVsYXRpb25zaGlwICE9PSAnb2JqZWN0JyB8fCByZWxhdGlvbnNoaXAgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgcmVjb3JkID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKHJlbGF0aW9uc2hpcCk7XG4gICAgICBjaGVja0FycmF5KFxuICAgICAgICByZWNvcmQuZXZpZGVuY2UsXG4gICAgICAgIENTUl9MSU1JVFMubWF4RXZpZGVuY2VQZXJSZWxhdGlvbnNoaXAsXG4gICAgICAgIGByZWxhdGlvbnNoaXBzWyR7aW5kZXh9XS5ldmlkZW5jZWAsXG4gICAgICAgICdldmlkZW5jZScsXG4gICAgICAgIGlzc3VlcyxcbiAgICAgICk7XG4gICAgfSk7XG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheShjYW5kaWRhdGUuZGlhZ25vc3RpY3MpKSB7XG4gICAgY2FuZGlkYXRlLmRpYWdub3N0aWNzLmZvckVhY2goKGRpYWdub3N0aWMsIGluZGV4KSA9PiB7XG4gICAgICBpZiAodHlwZW9mIGRpYWdub3N0aWMgIT09ICdvYmplY3QnIHx8IGRpYWdub3N0aWMgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgcmVjb3JkID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKGRpYWdub3N0aWMpO1xuICAgICAgY2hlY2tTdHJpbmcoXG4gICAgICAgIHJlY29yZC5tZXNzYWdlLFxuICAgICAgICBDU1JfTElNSVRTLm1heE1lc3NhZ2VMZW5ndGgsXG4gICAgICAgIGBkaWFnbm9zdGljc1ske2luZGV4fV0ubWVzc2FnZWAsXG4gICAgICAgICdtZXNzYWdlJyxcbiAgICAgICAgaXNzdWVzLFxuICAgICAgKTtcbiAgICAgIGNoZWNrQXJyYXkoXG4gICAgICAgIHJlY29yZC5hZmZlY3RzLFxuICAgICAgICBDU1JfTElNSVRTLm1heEFmZmVjdHNQZXJEaWFnbm9zdGljLFxuICAgICAgICBgZGlhZ25vc3RpY3NbJHtpbmRleH1dLmFmZmVjdHNgLFxuICAgICAgICAnYWZmZWN0cycsXG4gICAgICAgIGlzc3VlcyxcbiAgICAgICk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gaXNzdWVzLmxlbmd0aCA9PT0gMCA/IHsgb2s6IHRydWUgfSA6IHsgb2s6IGZhbHNlLCBpc3N1ZXMgfTtcbn1cbiIsICIvKipcbiAqIFJlYXNvbiBjb2RlcyBmb3IgZXZlcnkgbm9uLWNlcnRhaW4gZmFjdC5cbiAqXG4gKiBBIHJlYXNvbiBjb2RlIGFuc3dlcnMgXCJ3aHkgaXMgdGhpcyBub3QgY2VydGFpbj9cIiBpbiBhIGZvcm0gdGhlIFVJIGNhbiBncm91cFxuICogYW5kIGZpbHRlci4gSXQgaXMgZGVsaWJlcmF0ZWx5IG5vdCBmcmVlIHRleHQ6IGRpYWdub3N0aWNzIGNhcnJ5IHByb3NlLlxuICovXG5cbmltcG9ydCB7IFJFQVNPTl9DT0RFUywgUkVBU09OX0NPREVfREVTQ1JJUFRJT05TIH0gZnJvbSAnLi90eXBlcy5qcyc7XG5cbi8qKiBAdHlwZSB7UmVhZG9ubHlTZXQ8c3RyaW5nPn0gKi9cbmNvbnN0IENPREVfU0VUID0gbmV3IFNldChSRUFTT05fQ09ERVMpO1xuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNSZWFzb25Db2RlKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICYmIENPREVfU0VULmhhcyh2YWx1ZSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGNvZGVcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXNjcmliZVJlYXNvbihjb2RlKSB7XG4gIHJldHVybiBSRUFTT05fQ09ERV9ERVNDUklQVElPTlNbY29kZV0gPz8gYFVua25vd24gcmVhc29uIGNvZGUgXCIke2NvZGV9XCIuYDtcbn1cblxuLyoqXG4gKiBHcm91cCByZWFzb24gY29kZXMgaW50byB0aGUgY2F0ZWdvcmllcyB0aGUgVUkgZXhwb3Nlcy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICogQHJldHVybnMgeydkeW5hbWljJ3wnZW52aXJvbm1lbnQnfCdzY29wZSd8J3NvdXJjZSd8J2ludGVybmFsJ3wndW5rbm93bid9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFzb25DYXRlZ29yeShjb2RlKSB7XG4gIHN3aXRjaCAoY29kZSkge1xuICAgIGNhc2UgJ2R5bmFtaWNfZGlzcGF0Y2gnOlxuICAgIGNhc2UgJ2Z1bmN0aW9uX3BvaW50ZXInOlxuICAgIGNhc2UgJ3Vua25vd25fcmVjZWl2ZXInOlxuICAgIGNhc2UgJ2NvbXB1dGVkX21lbWJlcic6XG4gICAgY2FzZSAncHJvdG90eXBlX211dGF0aW9uJzpcbiAgICBjYXNlICdjYWxsYmFja19wYXJhbWV0ZXInOlxuICAgIGNhc2UgJ2RlZmVycmVkX2ludm9jYXRpb24nOlxuICAgICAgcmV0dXJuICdkeW5hbWljJztcbiAgICBjYXNlICdtaXNzaW5nX2NvbXBpbGVfZGInOlxuICAgIGNhc2UgJ21pc3Npbmdfc3lzdGVtX2hlYWRlcnMnOlxuICAgIGNhc2UgJ3Rvb2xjaGFpbl92ZXJzaW9uX21pc21hdGNoJzpcbiAgICBjYXNlICd1bmtub3duX2ltcG9ydF90YXJnZXQnOlxuICAgIGNhc2UgJ2V4dGVybmFsX3BhY2thZ2UnOlxuICAgIGNhc2UgJ3BhdGhfYWxpYXNfdW5yZXNvbHZlZCc6XG4gICAgY2FzZSAnZXhwb3J0c19tYXBfdW5zdXBwb3J0ZWQnOlxuICAgIGNhc2UgJ3Vuc3VwcG9ydGVkX2xhbmd1YWdlJzpcbiAgICAgIHJldHVybiAnZW52aXJvbm1lbnQnO1xuICAgIGNhc2UgJ291dF9vZl9zY29wZSc6XG4gICAgY2FzZSAndG9vX2RlZXAnOlxuICAgIGNhc2UgJ292ZXJsb2FkX2FtYmlndW91cyc6XG4gICAgY2FzZSAndGVtcGxhdGVfZGVwZW5kZW50JzpcbiAgICBjYXNlICdoZWFkZXJfd2l0aG91dF90dSc6XG4gICAgY2FzZSAncmVleHBvcnRfZGVwdGhfZXhjZWVkZWQnOlxuICAgICAgcmV0dXJuICdzY29wZSc7XG4gICAgY2FzZSAnbWFjcm9fZXhwYW5zaW9uJzpcbiAgICBjYXNlICdnZW5lcmF0ZWRfc291cmNlJzpcbiAgICBjYXNlICdwYXJzZV9lcnJvcic6XG4gICAgY2FzZSAndW5zdXBwb3J0ZWRfY29uc3RydWN0JzpcbiAgICBjYXNlICd1bnN1cHBvcnRlZF9zeW50YXgnOlxuICAgIGNhc2UgJ2V2YWxfc2NvcGUnOlxuICAgIGNhc2UgJ2R5bmFtaWNfc2NvcGUnOlxuICAgIGNhc2UgJ21peGVkX21vZHVsZV9zeXN0ZW0nOlxuICAgIGNhc2UgJ2luZGV4X3N0YWxlJzpcbiAgICAgIHJldHVybiAnc291cmNlJztcbiAgICBjYXNlICdidWRnZXRfZXhjZWVkZWQnOlxuICAgIGNhc2UgJ2NhbmNlbGxlZCc6XG4gICAgY2FzZSAnYWRhcHRlcl9lcnJvcic6XG4gICAgY2FzZSAnaW50ZXJuYWxfZXJyb3InOlxuICAgICAgcmV0dXJuICdpbnRlcm5hbCc7XG4gICAgY2FzZSAnbW9ja19kYXRhJzpcbiAgICAgIHJldHVybiAndW5rbm93bic7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAndW5rbm93bic7XG4gIH1cbn1cblxuLyoqXG4gKiBUaGUgc2V0IG9mIHJlYXNvbiBjb2RlcyB0aGF0IG1ha2Ugc2Vuc2UgZm9yIGFkYXB0ZXIgZmFpbHVyZSBzdGF0ZXMuXG4gKiBVc2VkIGJ5IHRoZSByZWdpc3RyeSB3aGVuIGl0IHN5bnRoZXNpc2VzIGEgZGVncmFkZWQgcnVuLlxuICovXG5leHBvcnQgY29uc3QgRkFJTFVSRV9SRUFTT05fQ09ERVMgPSBPYmplY3QuZnJlZXplKFtcbiAgJ2FkYXB0ZXJfZXJyb3InLFxuICAnY2FuY2VsbGVkJyxcbiAgJ2J1ZGdldF9leGNlZWRlZCcsXG4gICdpbnRlcm5hbF9lcnJvcicsXG4gICdwYXJzZV9lcnJvcicsXG5dKTtcbiIsICIvKipcbiAqIFNvdXJjZSBwcm92ZW5hbmNlIGhlbHBlcnMuXG4gKlxuICogQ29vcmRpbmF0ZSBjb250cmFjdCAobm9ybWF0aXZlKTpcbiAqIC0gbGluZXMgYXJlIDAtYmFzZWQ7XG4gKiAtIGNvbHVtbnMgYXJlIDAtYmFzZWQgVVRGLTE2IGNvZGUgdW5pdHMsIG1hdGNoaW5nIEphdmFTY3JpcHQgc3RyaW5nIGluZGV4aW5nXG4gKiAgIGFuZCBWUyBDb2RlJ3MgYFBvc2l0aW9uYDtcbiAqIC0gYGVuZExpbmVgL2BlbmRDb2x1bW5gIGFyZSBleGNsdXNpdmU7XG4gKiAtIGEgQk9NIGlzIG5vdCBwYXJ0IG9mIGNvbHVtbiAwLiBgbGluZUluZGV4LmJvbUxlbmd0aGAgcmVwb3J0cyBob3cgbWFueVxuICogICBVVEYtMTYgdW5pdHMgd2VyZSBza2lwcGVkLCBhbmQgb2Zmc2V0cyBhcmUgcmVsYXRpdmUgdG8gdGhlIEJPTS1zdHJpcHBlZFxuICogICB0ZXh0LiBDb252ZXJ0IGF0IHRoZSBmaWxlIGJvdW5kYXJ5LCBuZXZlciBpbnNpZGUgQ1NSLlxuICpcbiAqIENSTEYsIExGLCBhbmQgbG9uZSBDUiBhcmUgYWxsIGxpbmUgYnJlYWtzLiBBIHBvc2l0aW9uIHRoYXQgZmFsbHMgaW5zaWRlIGFcbiAqIGxpbmUgYnJlYWsgaXMgY2xhbXBlZCB0byB0aGUgZW5kIG9mIHRoZSBwcmVjZWRpbmcgbGluZSwgYmVjYXVzZSB0aGVyZSBpcyBub1xuICogY3Vyc29yIHBvc2l0aW9uIGJldHdlZW4gYFxccmAgYW5kIGBcXG5gLlxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge3tsaW5lOiBudW1iZXIsIGNvbHVtbjogbnVtYmVyfX0gUG9zaXRpb25cbiAqIEB0eXBlZGVmIHt7ZmlsZUlkOiBzdHJpbmcsIHN0YXJ0TGluZTogbnVtYmVyLCBzdGFydENvbHVtbjogbnVtYmVyLCBlbmRMaW5lOiBudW1iZXIsIGVuZENvbHVtbjogbnVtYmVyfX0gU291cmNlUmFuZ2VcbiAqIEB0eXBlZGVmIHtSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVMaW5lSW5kZXg+fSBMaW5lSW5kZXhcbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gdGV4dFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTGluZUluZGV4KHRleHQpIHtcbiAgY29uc3Qgc291cmNlID0gU3RyaW5nKHRleHQgPz8gJycpO1xuICBjb25zdCBib21MZW5ndGggPSBzb3VyY2UuY2hhckNvZGVBdCgwKSA9PT0gMHhmZWZmID8gMSA6IDA7XG4gIGNvbnN0IGJvZHkgPSBib21MZW5ndGggPT09IDEgPyBzb3VyY2Uuc2xpY2UoMSkgOiBzb3VyY2U7XG5cbiAgLyoqIEB0eXBlIHtudW1iZXJbXX0gKi9cbiAgY29uc3QgbGluZVN0YXJ0cyA9IFswXTtcbiAgLyoqIEB0eXBlIHtudW1iZXJbXX0gKi9cbiAgY29uc3QgbGluZUVuZHMgPSBbXTtcbiAgLyoqIEB0eXBlIHtudW1iZXJbXX0gKi9cbiAgY29uc3QgYnJlYWtMZW5ndGhzID0gW107XG5cbiAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGJvZHkubGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgY29uc3QgY29kZSA9IGJvZHkuY2hhckNvZGVBdChpbmRleCk7XG4gICAgaWYgKGNvZGUgIT09IDEwICYmIGNvZGUgIT09IDEzKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgbGluZUVuZHMucHVzaChpbmRleCk7XG4gICAgaWYgKGNvZGUgPT09IDEzICYmIGJvZHkuY2hhckNvZGVBdChpbmRleCArIDEpID09PSAxMCkge1xuICAgICAgYnJlYWtMZW5ndGhzLnB1c2goMik7XG4gICAgICBpbmRleCArPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBicmVha0xlbmd0aHMucHVzaCgxKTtcbiAgICB9XG4gICAgbGluZVN0YXJ0cy5wdXNoKGluZGV4ICsgMSk7XG4gIH1cbiAgbGluZUVuZHMucHVzaChib2R5Lmxlbmd0aCk7XG4gIGJyZWFrTGVuZ3Rocy5wdXNoKDApO1xuXG4gIGNvbnN0IGxhc3RMaW5lID0gbGluZVN0YXJ0cy5sZW5ndGggLSAxO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcn0gbGluZVxuICAgKiBAcmV0dXJucyB7e3N0YXJ0OiBudW1iZXIsIGNvbnRlbnRFbmQ6IG51bWJlciwgZW5kOiBudW1iZXJ9fVxuICAgKi9cbiAgZnVuY3Rpb24gbGluZUJvdW5kcyhsaW5lKSB7XG4gICAgY29uc3Qgc2FmZUxpbmUgPSBjbGFtcEludGVnZXIobGluZSwgMCwgbGFzdExpbmUpO1xuICAgIGNvbnN0IHN0YXJ0ID0gbGluZVN0YXJ0c1tzYWZlTGluZV07XG4gICAgY29uc3QgY29udGVudEVuZCA9IGxpbmVFbmRzW3NhZmVMaW5lXTtcbiAgICBjb25zdCBlbmQgPSBzdGFydCArIChjb250ZW50RW5kIC0gc3RhcnQpICsgYnJlYWtMZW5ndGhzW3NhZmVMaW5lXTtcbiAgICByZXR1cm4geyBzdGFydCwgY29udGVudEVuZCwgZW5kIH07XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldFxuICAgKiBAcmV0dXJucyB7UG9zaXRpb259XG4gICAqL1xuICBmdW5jdGlvbiBwb3NpdGlvbkF0KG9mZnNldCkge1xuICAgIGNvbnN0IHNhZmVPZmZzZXQgPSBjbGFtcEludGVnZXIob2Zmc2V0LCAwLCBib2R5Lmxlbmd0aCk7XG4gICAgLy8gQmluYXJ5IHNlYXJjaCB0aGUgbGluZSB3aG9zZSBzdGFydCBpcyA8PSBvZmZzZXQuXG4gICAgbGV0IGxvdyA9IDA7XG4gICAgbGV0IGhpZ2ggPSBsYXN0TGluZTtcbiAgICB3aGlsZSAobG93IDwgaGlnaCkge1xuICAgICAgY29uc3QgbWlkZGxlID0gTWF0aC5jZWlsKChsb3cgKyBoaWdoKSAvIDIpO1xuICAgICAgaWYgKGxpbmVTdGFydHNbbWlkZGxlXSA8PSBzYWZlT2Zmc2V0KSB7XG4gICAgICAgIGxvdyA9IG1pZGRsZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGhpZ2ggPSBtaWRkbGUgLSAxO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBsaW5lID0gbG93O1xuICAgIGNvbnN0IGJvdW5kcyA9IGxpbmVCb3VuZHMobGluZSk7XG4gICAgY29uc3QgY2xhbXBlZCA9IE1hdGgubWluKHNhZmVPZmZzZXQsIGJvdW5kcy5jb250ZW50RW5kKTtcbiAgICByZXR1cm4geyBsaW5lLCBjb2x1bW46IGNsYW1wZWQgLSBib3VuZHMuc3RhcnQgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3Vua25vd259IHBvc2l0aW9uXG4gICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAqL1xuICBmdW5jdGlvbiBvZmZzZXRBdChwb3NpdGlvbikge1xuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IC8qKiBAdHlwZSB7UGFydGlhbDxQb3NpdGlvbj59ICovIChwb3NpdGlvbiA/PyB7fSk7XG4gICAgY29uc3QgbGluZSA9IGNsYW1wSW50ZWdlcihjYW5kaWRhdGUubGluZSA/PyAwLCAwLCBsYXN0TGluZSk7XG4gICAgY29uc3QgYm91bmRzID0gbGluZUJvdW5kcyhsaW5lKTtcbiAgICBjb25zdCBjb2x1bW4gPSBjbGFtcEludGVnZXIoY2FuZGlkYXRlLmNvbHVtbiA/PyAwLCAwLCBib3VuZHMuY29udGVudEVuZCAtIGJvdW5kcy5zdGFydCk7XG4gICAgcmV0dXJuIGJvdW5kcy5zdGFydCArIGNvbHVtbjtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgdGV4dDogYm9keSxcbiAgICBib21MZW5ndGgsXG4gICAgbGluZVN0YXJ0czogT2JqZWN0LmZyZWV6ZShbLi4ubGluZVN0YXJ0c10pLFxuICAgIGxpbmVDb3VudDogbGluZVN0YXJ0cy5sZW5ndGgsXG4gICAgbGluZUJvdW5kcyxcbiAgICBwb3NpdGlvbkF0LFxuICAgIG9mZnNldEF0LFxuICAgIGxlbmd0aDogYm9keS5sZW5ndGgsXG4gIH07XG59XG5cbi8qKlxuICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlXG4gKiBAcGFyYW0ge251bWJlcn0gbWluXG4gKiBAcGFyYW0ge251bWJlcn0gbWF4XG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiBjbGFtcEludGVnZXIodmFsdWUsIG1pbiwgbWF4KSB7XG4gIGlmICghTnVtYmVyLmlzRmluaXRlKHZhbHVlKSkge1xuICAgIHJldHVybiBtaW47XG4gIH1cbiAgcmV0dXJuIE1hdGgubWF4KG1pbiwgTWF0aC5taW4obWF4LCBNYXRoLnRydW5jKHZhbHVlKSkpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7U291cmNlUmFuZ2V9IHJhbmdlXG4gKiBAcmV0dXJucyB7e2xpbmU6IG51bWJlciwgY29sdW1uOiBudW1iZXJ9fVxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RhcnRQb3NpdGlvbihyYW5nZSkge1xuICByZXR1cm4geyBsaW5lOiByYW5nZS5zdGFydExpbmUsIGNvbHVtbjogcmFuZ2Uuc3RhcnRDb2x1bW4gfTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1NvdXJjZVJhbmdlfSByYW5nZVxuICogQHJldHVybnMge3tsaW5lOiBudW1iZXIsIGNvbHVtbjogbnVtYmVyfX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuZFBvc2l0aW9uKHJhbmdlKSB7XG4gIHJldHVybiB7IGxpbmU6IHJhbmdlLmVuZExpbmUsIGNvbHVtbjogcmFuZ2UuZW5kQ29sdW1uIH07XG59XG5cbi8qKlxuICogQHBhcmFtIHtQb3NpdGlvbn0gYVxuICogQHBhcmFtIHtQb3NpdGlvbn0gYlxuICogQHJldHVybnMge251bWJlcn0gbmVnYXRpdmUgd2hlbiBhIGlzIGJlZm9yZSBiXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wYXJlUG9zaXRpb25zKGEsIGIpIHtcbiAgaWYgKGEubGluZSAhPT0gYi5saW5lKSB7XG4gICAgcmV0dXJuIGEubGluZSAtIGIubGluZTtcbiAgfVxuICByZXR1cm4gYS5jb2x1bW4gLSBiLmNvbHVtbjtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1NvdXJjZVJhbmdlfSBvdXRlclxuICogQHBhcmFtIHtTb3VyY2VSYW5nZX0gaW5uZXJcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmFuZ2VDb250YWlucyhvdXRlciwgaW5uZXIpIHtcbiAgaWYgKG91dGVyLmZpbGVJZCAhPT0gaW5uZXIuZmlsZUlkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiAoXG4gICAgY29tcGFyZVBvc2l0aW9ucyhzdGFydFBvc2l0aW9uKG91dGVyKSwgc3RhcnRQb3NpdGlvbihpbm5lcikpIDw9IDAgJiZcbiAgICBjb21wYXJlUG9zaXRpb25zKGVuZFBvc2l0aW9uKGlubmVyKSwgZW5kUG9zaXRpb24ob3V0ZXIpKSA8PSAwXG4gICk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtTb3VyY2VSYW5nZX0gYVxuICogQHBhcmFtIHtTb3VyY2VSYW5nZX0gYlxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByYW5nZXNJbnRlcnNlY3QoYSwgYikge1xuICBpZiAoYS5maWxlSWQgIT09IGIuZmlsZUlkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiAoXG4gICAgY29tcGFyZVBvc2l0aW9ucyhzdGFydFBvc2l0aW9uKGEpLCBlbmRQb3NpdGlvbihiKSkgPCAwICYmXG4gICAgY29tcGFyZVBvc2l0aW9ucyhzdGFydFBvc2l0aW9uKGIpLCBlbmRQb3NpdGlvbihhKSkgPCAwXG4gICk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtMaW5lSW5kZXh9IGluZGV4XG4gKiBAcGFyYW0ge1NvdXJjZVJhbmdlfSByYW5nZVxuICogQHJldHVybnMge3tzdGFydE9mZnNldDogbnVtYmVyLCBlbmRPZmZzZXQ6IG51bWJlcn19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByYW5nZVRvT2Zmc2V0cyhpbmRleCwgcmFuZ2UpIHtcbiAgY29uc3Qgc3RhcnRPZmZzZXQgPSBpbmRleC5vZmZzZXRBdChzdGFydFBvc2l0aW9uKHJhbmdlKSk7XG4gIGNvbnN0IGVuZE9mZnNldCA9IGluZGV4Lm9mZnNldEF0KGVuZFBvc2l0aW9uKHJhbmdlKSk7XG4gIHJldHVybiB7IHN0YXJ0T2Zmc2V0LCBlbmRPZmZzZXQ6IE1hdGgubWF4KHN0YXJ0T2Zmc2V0LCBlbmRPZmZzZXQpIH07XG59XG5cbi8qKlxuICogQnVpbGQgYSByYW5nZSBmcm9tIGhhbGYtb3BlbiBVVEYtMTYgb2Zmc2V0cy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gZmlsZUlkXG4gKiBAcGFyYW0ge0xpbmVJbmRleH0gaW5kZXhcbiAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydE9mZnNldFxuICogQHBhcmFtIHtudW1iZXJ9IGVuZE9mZnNldFxuICogQHJldHVybnMge1NvdXJjZVJhbmdlfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmFuZ2VGcm9tT2Zmc2V0cyhmaWxlSWQsIGluZGV4LCBzdGFydE9mZnNldCwgZW5kT2Zmc2V0KSB7XG4gIGNvbnN0IHN0YXJ0ID0gaW5kZXgucG9zaXRpb25BdChzdGFydE9mZnNldCk7XG4gIGNvbnN0IGVuZCA9IGluZGV4LnBvc2l0aW9uQXQoTWF0aC5tYXgoc3RhcnRPZmZzZXQsIGVuZE9mZnNldCkpO1xuICByZXR1cm4ge1xuICAgIGZpbGVJZCxcbiAgICBzdGFydExpbmU6IHN0YXJ0LmxpbmUsXG4gICAgc3RhcnRDb2x1bW46IHN0YXJ0LmNvbHVtbixcbiAgICBlbmRMaW5lOiBlbmQubGluZSxcbiAgICBlbmRDb2x1bW46IGVuZC5jb2x1bW4sXG4gIH07XG59XG5cbi8qKlxuICogTGl0ZXJhbCBzb3VyY2Ugc2xpY2UgZm9yIGEgcmFuZ2UuIFBoYXNlIDUgcmVuZGVycyB0aGlzOyBpdCBtdXN0IHRoZXJlZm9yZVxuICogY29tZSBmcm9tIHRoZSBzYW1lIGxpbmUgaW5kZXggdGhlIGFkYXB0ZXIgdXNlZC5cbiAqXG4gKiBAcGFyYW0ge0xpbmVJbmRleH0gaW5kZXhcbiAqIEBwYXJhbSB7U291cmNlUmFuZ2V9IHJhbmdlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2xpY2VSYW5nZShpbmRleCwgcmFuZ2UpIHtcbiAgY29uc3QgeyBzdGFydE9mZnNldCwgZW5kT2Zmc2V0IH0gPSByYW5nZVRvT2Zmc2V0cyhpbmRleCwgcmFuZ2UpO1xuICByZXR1cm4gaW5kZXgudGV4dC5zbGljZShzdGFydE9mZnNldCwgZW5kT2Zmc2V0KTtcbn1cblxuLyoqXG4gKiBTdHJ1Y3R1cmFsIGNoZWNrcyB0aGF0IGRvIG5vdCBuZWVkIGZpbGUgY29udGVudHMuXG4gKlxuICogQHBhcmFtIHt1bmtub3dufSByYW5nZVxuICogQHJldHVybnMge3N0cmluZ1tdfSBwcmVjaXNlIGlzc3VlIG1lc3NhZ2VzLCBlbXB0eSB3aGVuIHZhbGlkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByYW5nZVNoYXBlSXNzdWVzKHJhbmdlKSB7XG4gIGlmICh0eXBlb2YgcmFuZ2UgIT09ICdvYmplY3QnIHx8IHJhbmdlID09PSBudWxsIHx8IEFycmF5LmlzQXJyYXkocmFuZ2UpKSB7XG4gICAgcmV0dXJuIFsnbXVzdCBiZSBhbiBvYmplY3QuJ107XG4gIH1cbiAgY29uc3QgcmVjb3JkID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKHJhbmdlKTtcbiAgLyoqIEB0eXBlIHtzdHJpbmdbXX0gKi9cbiAgY29uc3QgaXNzdWVzID0gW107XG4gIGlmICh0eXBlb2YgcmVjb3JkLmZpbGVJZCAhPT0gJ3N0cmluZycgfHwgcmVjb3JkLmZpbGVJZC5sZW5ndGggPT09IDApIHtcbiAgICBpc3N1ZXMucHVzaCgnZmlsZUlkIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nLicpO1xuICB9XG4gIGZvciAoY29uc3QgZmllbGQgb2YgWydzdGFydExpbmUnLCAnc3RhcnRDb2x1bW4nLCAnZW5kTGluZScsICdlbmRDb2x1bW4nXSkge1xuICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihyZWNvcmRbZmllbGRdKSB8fCBOdW1iZXIocmVjb3JkW2ZpZWxkXSkgPCAwKSB7XG4gICAgICBpc3N1ZXMucHVzaChgJHtmaWVsZH0gbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyLmApO1xuICAgIH1cbiAgfVxuICBpZiAoXG4gICAgTnVtYmVyLmlzSW50ZWdlcihyZWNvcmQuc3RhcnRMaW5lKSAmJlxuICAgIE51bWJlci5pc0ludGVnZXIocmVjb3JkLmVuZExpbmUpICYmXG4gICAgTnVtYmVyKHJlY29yZC5lbmRMaW5lKSA8IE51bWJlcihyZWNvcmQuc3RhcnRMaW5lKVxuICApIHtcbiAgICBpc3N1ZXMucHVzaCgnZW5kTGluZSBtdXN0IGJlID49IHN0YXJ0TGluZS4nKTtcbiAgfVxuICBpZiAoXG4gICAgTnVtYmVyLmlzSW50ZWdlcihyZWNvcmQuc3RhcnRMaW5lKSAmJlxuICAgIE51bWJlci5pc0ludGVnZXIocmVjb3JkLmVuZExpbmUpICYmXG4gICAgTnVtYmVyKHJlY29yZC5zdGFydExpbmUpID09PSBOdW1iZXIocmVjb3JkLmVuZExpbmUpICYmXG4gICAgTnVtYmVyLmlzSW50ZWdlcihyZWNvcmQuc3RhcnRDb2x1bW4pICYmXG4gICAgTnVtYmVyLmlzSW50ZWdlcihyZWNvcmQuZW5kQ29sdW1uKSAmJlxuICAgIE51bWJlcihyZWNvcmQuZW5kQ29sdW1uKSA8IE51bWJlcihyZWNvcmQuc3RhcnRDb2x1bW4pXG4gICkge1xuICAgIGlzc3Vlcy5wdXNoKCdlbmRDb2x1bW4gbXVzdCBiZSA+PSBzdGFydENvbHVtbiBvbiBhIHNpbmdsZSBsaW5lLicpO1xuICB9XG4gIHJldHVybiBpc3N1ZXM7XG59XG4iLCAiLyoqXG4gKiBDU1IgdmFsaWRhdGlvbi5cbiAqXG4gKiBUd28gbW9kZXM6XG4gKiAtIGBzdHJpY3RgICh0ZXN0cywgQ0ksIGRldmVsb3BtZW50KTogZmFpbCBmYXN0LCByZXR1cm4gZXZlcnkgaXNzdWUgd2l0aCBhXG4gKiAgIHByZWNpc2UgSlNPTiBwYXRoLlxuICogLSBgZGVmZW5zaXZlYCAocHJvZHVjdGlvbiBhZGFwdGVyIGJvdW5kYXJ5KTogZHJvcCBpbnZhbGlkIHJlY29yZHMgb25lIGF0IGFcbiAqICAgdGltZSwgcmVwb3J0IGEgZGlhZ25vc3RpYyBwZXIgZHJvcHBlZCByZWNvcmQsIGFuZCBtYXJrIHRoZSBydW4gYHBhcnRpYWxgLlxuICogICBEcm9wcGluZyBpcyBuZXZlciBzaWxlbnQuXG4gKlxuICogVmFsaWRhdGlvbiBpcyB0b3RhbDogaXQgcmV0dXJucyB0eXBlZCBpc3N1ZXMgYW5kIG5ldmVyIHRocm93cy4gSXQgcnVucyBvbmNlLFxuICogYXQgdGhlIGFkYXB0ZXIgYm91bmRhcnk7IGNvcmUtdG8tY29yZSBjYWxscyB0cnVzdCB2YWxpZGF0ZWQgZGF0YS5cbiAqL1xuXG5pbXBvcnQgeyBDU1JfTElNSVRTLCBlbmZvcmNlTGltaXRzIH0gZnJvbSAnLi9saW1pdHMuanMnO1xuaW1wb3J0IHsgaXNSZWFzb25Db2RlIH0gZnJvbSAnLi9yZWFzb25zLmpzJztcbmltcG9ydCB7IHJhbmdlU2hhcGVJc3N1ZXMgfSBmcm9tICcuL3Byb3ZlbmFuY2UuanMnO1xuaW1wb3J0IHtcbiAgQ09NUExFVEVORVNTX0xFVkVMUyxcbiAgQ09OVFJPTF9DT05TVFJVQ1RfS0lORFMsXG4gIENTUl9WRVJTSU9OLFxuICBEQVRBX0ZBQ1RfS0lORFMsXG4gIERJQUdOT1NUSUNfU0VWRVJJVElFUyxcbiAgRVZJREVOQ0VfS0lORFMsXG4gIGlzQ29tcGF0aWJsZUNzclZlcnNpb24sXG4gIGlzTmV3ZXJNaW5vcixcbiAgUkVMQVRJT05TSElQX1RZUEVTLFxuICBSRVNPTFVUSU9OX1NUQVRVU0VTLFxuICBTWU1CT0xfS0lORFMsXG4gIFZJU0lCSUxJVElFUyxcbn0gZnJvbSAnLi90eXBlcy5qcyc7XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gVmFsaWRhdGlvbklzc3VlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gcGF0aFxuICogQHByb3BlcnR5IHtzdHJpbmd9IG1lc3NhZ2VcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbY29kZV1cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW2Ryb3BwZWRdXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBEcm9wcGVkUmVjb3JkXG4gKiBAcHJvcGVydHkgeydmaWxlcyd8J3N5bWJvbHMnfCdyZWxhdGlvbnNoaXBzJ3wnY29udHJvbENvbnN0cnVjdHMnfCdkYXRhRmFjdHMnfCdkaWFnbm9zdGljcyd9IGNvbGxlY3Rpb25cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBwYXRoXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW2lkXVxuICogQHByb3BlcnR5IHtWYWxpZGF0aW9uSXNzdWVbXX0gaXNzdWVzXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBWYWxpZGF0aW9uT3B0aW9uc1xuICogQHByb3BlcnR5IHsnc3RyaWN0J3wnZGVmZW5zaXZlJ30gW21vZGVdXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW2V4cGVjdGVkQWRhcHRlcklkXVxuICovXG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSBydW5cbiAqIEBwYXJhbSB7VmFsaWRhdGlvbk9wdGlvbnN9IFtvcHRpb25zXVxuICogQHJldHVybnMge3tvazogdHJ1ZSwgcnVuOiBpbXBvcnQoJy4vZW50aXRpZXMuanMnKS5BbmFseXNpc1J1biwgaXNzdWVzOiBWYWxpZGF0aW9uSXNzdWVbXSwgZHJvcHBlZDogRHJvcHBlZFJlY29yZFtdfSB8IHtvazogZmFsc2UsIGlzc3VlczogVmFsaWRhdGlvbklzc3VlW10sIGRyb3BwZWQ6IERyb3BwZWRSZWNvcmRbXX19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUFuYWx5c2lzUnVuKHJ1biwgb3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IG1vZGUgPSBvcHRpb25zLm1vZGUgPT09ICdkZWZlbnNpdmUnID8gJ2RlZmVuc2l2ZScgOiAnc3RyaWN0JztcbiAgY29uc3QgZGVmZW5zaXZlID0gbW9kZSA9PT0gJ2RlZmVuc2l2ZSc7XG4gIC8qKiBAdHlwZSB7VmFsaWRhdGlvbklzc3VlW119ICovXG4gIGNvbnN0IGlzc3VlcyA9IFtdO1xuICAvKiogQHR5cGUge0Ryb3BwZWRSZWNvcmRbXX0gKi9cbiAgY29uc3QgZHJvcHBlZCA9IFtdO1xuXG4gIGlmICghaXNQbGFpbk9iamVjdChydW4pKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGlzc3VlczogW3sgcGF0aDogJyQnLCBtZXNzYWdlOiAnQW5hbHlzaXMgcnVuIG11c3QgYmUgYW4gb2JqZWN0LicsIGNvZGU6ICdFX1ZBTElEQVRJT04nIH1dLFxuICAgICAgZHJvcHBlZCxcbiAgICB9O1xuICB9XG4gIGNvbnN0IGNhbmRpZGF0ZSA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChydW4pO1xuXG4gIC8vIC0tLSB0b3AtbGV2ZWwsIGZhdGFsIGNoZWNrcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGZvciAoY29uc3QgZmllbGQgb2YgWydydW5JZCcsICdhZGFwdGVySWQnLCAnYWRhcHRlclZlcnNpb24nLCAnbGFuZ3VhZ2UnXSkge1xuICAgIGlmICh0eXBlb2YgY2FuZGlkYXRlW2ZpZWxkXSAhPT0gJ3N0cmluZycgfHwgY2FuZGlkYXRlW2ZpZWxkXS5sZW5ndGggPT09IDApIHtcbiAgICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgICAgcGF0aDogZmllbGQsXG4gICAgICAgIG1lc3NhZ2U6IGAke2ZpZWxkfSBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZy5gLFxuICAgICAgICBjb2RlOiAnRV9WQUxJREFUSU9OJyxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBpZiAob3B0aW9ucy5leHBlY3RlZEFkYXB0ZXJJZCAmJiBjYW5kaWRhdGUuYWRhcHRlcklkICE9PSBvcHRpb25zLmV4cGVjdGVkQWRhcHRlcklkKSB7XG4gICAgaXNzdWVzLnB1c2goe1xuICAgICAgcGF0aDogJ2FkYXB0ZXJJZCcsXG4gICAgICBtZXNzYWdlOiBgYWRhcHRlcklkIG11c3QgYmUgXCIke29wdGlvbnMuZXhwZWN0ZWRBZGFwdGVySWR9XCIsIHJlY2VpdmVkIFwiJHtTdHJpbmcoXG4gICAgICAgIGNhbmRpZGF0ZS5hZGFwdGVySWQsXG4gICAgICApfVwiLmAsXG4gICAgICBjb2RlOiAnRV9WQUxJREFUSU9OJyxcbiAgICB9KTtcbiAgfVxuICBpZiAoIWlzQ29tcGF0aWJsZUNzclZlcnNpb24oY2FuZGlkYXRlLmNzclZlcnNpb24pKSB7XG4gICAgaXNzdWVzLnB1c2goe1xuICAgICAgcGF0aDogJ2NzclZlcnNpb24nLFxuICAgICAgbWVzc2FnZTogYFVuc3VwcG9ydGVkIGNzclZlcnNpb24gXCIke1N0cmluZyhcbiAgICAgICAgY2FuZGlkYXRlLmNzclZlcnNpb24sXG4gICAgICApfVwiOyB0aGlzIGJ1aWxkIHN1cHBvcnRzIG1ham9yICR7Q1NSX1ZFUlNJT04uc3BsaXQoJy4nKVswXX0uYCxcbiAgICAgIGNvZGU6ICdFX1ZBTElEQVRJT04nLFxuICAgIH0pO1xuICB9XG4gIGlmICghQ09NUExFVEVORVNTX0xFVkVMUy5pbmNsdWRlcyhTdHJpbmcoY2FuZGlkYXRlLmNvbXBsZXRlbmVzcykpKSB7XG4gICAgaXNzdWVzLnB1c2goe1xuICAgICAgcGF0aDogJ2NvbXBsZXRlbmVzcycsXG4gICAgICBtZXNzYWdlOiBgY29tcGxldGVuZXNzIG11c3QgYmUgb25lIG9mICR7Q09NUExFVEVORVNTX0xFVkVMUy5qb2luKCcsICcpfS5gLFxuICAgICAgY29kZTogJ0VfVkFMSURBVElPTicsXG4gICAgfSk7XG4gIH1cbiAgdmFsaWRhdGVTY29wZShjYW5kaWRhdGUuc2NvcGUsIGlzc3Vlcyk7XG5cbiAgZm9yIChjb25zdCBjb2xsZWN0aW9uIG9mIFtcbiAgICAnZmlsZXMnLFxuICAgICdzeW1ib2xzJyxcbiAgICAncmVsYXRpb25zaGlwcycsXG4gICAgJ2NvbnRyb2xDb25zdHJ1Y3RzJyxcbiAgICAnZGF0YUZhY3RzJyxcbiAgICAnZGlhZ25vc3RpY3MnLFxuICBdKSB7XG4gICAgaWYgKGNhbmRpZGF0ZVtjb2xsZWN0aW9uXSAhPT0gdW5kZWZpbmVkICYmICFBcnJheS5pc0FycmF5KGNhbmRpZGF0ZVtjb2xsZWN0aW9uXSkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgICAgcGF0aDogY29sbGVjdGlvbixcbiAgICAgICAgbWVzc2FnZTogYCR7Y29sbGVjdGlvbn0gbXVzdCBiZSBhbiBhcnJheS5gLFxuICAgICAgICBjb2RlOiAnRV9WQUxJREFUSU9OJyxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBpZiAoaXNzdWVzLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4geyBvazogZmFsc2UsIGlzc3VlcywgZHJvcHBlZCB9O1xuICB9XG5cbiAgY29uc3QgbGltaXRzID0gZW5mb3JjZUxpbWl0cyhjYW5kaWRhdGUpO1xuICBpZiAoIWxpbWl0cy5vaykge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBpc3N1ZXM6IGxpbWl0cy5pc3N1ZXMubWFwKChpc3N1ZSkgPT4gKHsgLi4uaXNzdWUsIGNvZGU6ICdFX0xJTUlUJyB9KSksXG4gICAgICBkcm9wcGVkLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBjb21wbGV0ZW5lc3MgPSAvKiogQHR5cGUge2ltcG9ydCgnLi9lbnRpdGllcy5qcycpLkFuYWx5c2lzUnVuWydjb21wbGV0ZW5lc3MnXX0gKi8gKFxuICAgIGNhbmRpZGF0ZS5jb21wbGV0ZW5lc3NcbiAgKTtcblxuICAvLyAtLS0gZmlsZXMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+W119ICovXG4gIGNvbnN0IGZpbGVzID0gW107XG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywgUmVjb3JkPHN0cmluZywgdW5rbm93bj4+fSAqL1xuICBjb25zdCBmaWxlQnlJZCA9IG5ldyBNYXAoKTtcbiAgZm9yIChjb25zdCBbaW5kZXgsIGVudHJ5XSBvZiBhcnJheU9mKGNhbmRpZGF0ZS5maWxlcykuZW50cmllcygpKSB7XG4gICAgY29uc3QgcGF0aCA9IGBmaWxlc1ske2luZGV4fV1gO1xuICAgIC8qKiBAdHlwZSB7VmFsaWRhdGlvbklzc3VlW119ICovXG4gICAgY29uc3QgbG9jYWwgPSBbXTtcbiAgICB2YWxpZGF0ZUZpbGUoZW50cnksIHBhdGgsIGxvY2FsKTtcbiAgICBjb25zdCBpZCA9IGlzUGxhaW5PYmplY3QoZW50cnkpID8gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKGVudHJ5KS5maWxlSWQgOiAnJztcbiAgICBpZiAodHlwZW9mIGlkID09PSAnc3RyaW5nJyAmJiBmaWxlQnlJZC5oYXMoaWQpKSB7XG4gICAgICBsb2NhbC5wdXNoKHsgcGF0aDogYCR7cGF0aH0uZmlsZUlkYCwgbWVzc2FnZTogYER1cGxpY2F0ZSBmaWxlSWQgXCIke2lkfVwiLmAgfSk7XG4gICAgfVxuICAgIGlmIChsb2NhbC5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnN0IHJlY29yZCA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChlbnRyeSk7XG4gICAgICBmaWxlcy5wdXNoKHJlY29yZCk7XG4gICAgICBmaWxlQnlJZC5zZXQoU3RyaW5nKHJlY29yZC5maWxlSWQpLCByZWNvcmQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb2xsZWN0KG1vZGUsIGlzc3VlcywgZHJvcHBlZCwgJ2ZpbGVzJywgcGF0aCwgaWQsIGxvY2FsKTtcbiAgICB9XG4gIH1cblxuICAvLyAtLS0gc3ltYm9scyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+W119ICovXG4gIGNvbnN0IHN5bWJvbHMgPSBbXTtcbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj59ICovXG4gIGNvbnN0IHN5bWJvbEJ5SWQgPSBuZXcgTWFwKCk7XG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywgc3RyaW5nPn0gKi9cbiAgY29uc3QgaWRlbnRpdHlPd25lciA9IG5ldyBNYXAoKTtcbiAgZm9yIChjb25zdCBbaW5kZXgsIGVudHJ5XSBvZiBhcnJheU9mKGNhbmRpZGF0ZS5zeW1ib2xzKS5lbnRyaWVzKCkpIHtcbiAgICBjb25zdCBwYXRoID0gYHN5bWJvbHNbJHtpbmRleH1dYDtcbiAgICAvKiogQHR5cGUge1ZhbGlkYXRpb25Jc3N1ZVtdfSAqL1xuICAgIGNvbnN0IGxvY2FsID0gW107XG4gICAgdmFsaWRhdGVTeW1ib2woZW50cnksIHBhdGgsIGZpbGVCeUlkLCBsb2NhbCk7XG4gICAgY29uc3QgcmVjb3JkID0gaXNQbGFpbk9iamVjdChlbnRyeSkgPyAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAoZW50cnkpIDoge307XG4gICAgY29uc3QgaWQgPSB0eXBlb2YgcmVjb3JkLnN5bWJvbElkID09PSAnc3RyaW5nJyA/IHJlY29yZC5zeW1ib2xJZCA6ICcnO1xuICAgIGlmIChpZCAmJiBzeW1ib2xCeUlkLmhhcyhpZCkpIHtcbiAgICAgIGxvY2FsLnB1c2goeyBwYXRoOiBgJHtwYXRofS5zeW1ib2xJZGAsIG1lc3NhZ2U6IGBEdXBsaWNhdGUgc3ltYm9sSWQgXCIke2lkfVwiLmAgfSk7XG4gICAgfVxuICAgIGNvbnN0IGlkZW50aXR5S2V5ID0gc3ltYm9sSWRlbnRpdHlLZXkocmVjb3JkKTtcbiAgICBpZiAoaWRlbnRpdHlLZXkgJiYgaWRlbnRpdHlPd25lci5oYXMoaWRlbnRpdHlLZXkpKSB7XG4gICAgICBsb2NhbC5wdXNoKHtcbiAgICAgICAgcGF0aDogYCR7cGF0aH0ucXVhbGlmaWVkTmFtZWAsXG4gICAgICAgIG1lc3NhZ2U6IGBEdXBsaWNhdGUgc3ltYm9sIGlkZW50aXR5IChmaWxlLCBraW5kLCBxdWFsaWZpZWROYW1lLCBkaXNhbWJpZ3VhdG9yKSBzaGFyZWQgd2l0aCBcIiR7aWRlbnRpdHlPd25lci5nZXQoXG4gICAgICAgICAgaWRlbnRpdHlLZXksXG4gICAgICAgICl9XCIuYCxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAobG9jYWwubGVuZ3RoID09PSAwKSB7XG4gICAgICBzeW1ib2xzLnB1c2gocmVjb3JkKTtcbiAgICAgIHN5bWJvbEJ5SWQuc2V0KFN0cmluZyhyZWNvcmQuc3ltYm9sSWQpLCByZWNvcmQpO1xuICAgICAgaWYgKGlkZW50aXR5S2V5KSB7XG4gICAgICAgIGlkZW50aXR5T3duZXIuc2V0KGlkZW50aXR5S2V5LCBTdHJpbmcocmVjb3JkLnN5bWJvbElkKSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbGxlY3QobW9kZSwgaXNzdWVzLCBkcm9wcGVkLCAnc3ltYm9scycsIHBhdGgsIGlkLCBsb2NhbCk7XG4gICAgfVxuICB9XG5cbiAgLy8gUGFyZW50IHJlZmVyZW5jZXMgYW5kIGN5Y2xlcyBhcmUgY2hlY2tlZCBhZnRlciBhbGwgc3ltYm9scyBhcmUga25vd24uXG4gIGNvbnN0IHBhcmVudElzc3VlcyA9IHZhbGlkYXRlUGFyZW50cyhzeW1ib2xzLCBzeW1ib2xCeUlkKTtcbiAgaWYgKHBhcmVudElzc3Vlcy5sZW5ndGggPiAwKSB7XG4gICAgaWYgKGRlZmVuc2l2ZSkge1xuICAgICAgY29uc3QgZG9vbWVkID0gbmV3IFNldChwYXJlbnRJc3N1ZXMubWFwKChlbnRyeSkgPT4gZW50cnkuaWQpKTtcbiAgICAgIC8vIERyb3BwaW5nIGEgcGFyZW50IG9ycGhhbnMgaXRzIGRlc2NlbmRhbnRzOyBkcm9wIHRoZW0gdG9vIHJhdGhlciB0aGFuXG4gICAgICAvLyBsZWF2aW5nIHJlY29yZHMgdGhhdCBwb2ludCBhdCBzeW1ib2xzIHRoYXQgbm8gbG9uZ2VyIGV4aXN0LlxuICAgICAgbGV0IGNoYW5nZWQgPSB0cnVlO1xuICAgICAgd2hpbGUgKGNoYW5nZWQpIHtcbiAgICAgICAgY2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICBmb3IgKGNvbnN0IHN5bWJvbCBvZiBzeW1ib2xzKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgIWRvb21lZC5oYXMoU3RyaW5nKHN5bWJvbC5zeW1ib2xJZCkpICYmXG4gICAgICAgICAgICB0eXBlb2Ygc3ltYm9sLnBhcmVudElkID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAgICAgZG9vbWVkLmhhcyhzeW1ib2wucGFyZW50SWQpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBkb29tZWQuYWRkKFN0cmluZyhzeW1ib2wuc3ltYm9sSWQpKTtcbiAgICAgICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgaW5kZXhCeUlkID0gbmV3IE1hcChzeW1ib2xzLm1hcCgoc3ltYm9sLCBpbmRleCkgPT4gW1N0cmluZyhzeW1ib2wuc3ltYm9sSWQpLCBpbmRleF0pKTtcbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgcGFyZW50SXNzdWVzKSB7XG4gICAgICAgIGRyb3BwZWQucHVzaCh7XG4gICAgICAgICAgY29sbGVjdGlvbjogJ3N5bWJvbHMnLFxuICAgICAgICAgIHBhdGg6IGBzeW1ib2xzWyR7aW5kZXhCeUlkLmdldChlbnRyeS5pZCkgPz8gMH1dYCxcbiAgICAgICAgICBpZDogZW50cnkuaWQsXG4gICAgICAgICAgaXNzdWVzOiBbZW50cnkuaXNzdWVdLFxuICAgICAgICB9KTtcbiAgICAgICAgaXNzdWVzLnB1c2goeyAuLi5lbnRyeS5pc3N1ZSwgZHJvcHBlZDogdHJ1ZSB9KTtcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGluZGV4ID0gc3ltYm9scy5sZW5ndGggLSAxOyBpbmRleCA+PSAwOyBpbmRleCAtPSAxKSB7XG4gICAgICAgIGlmIChkb29tZWQuaGFzKFN0cmluZyhzeW1ib2xzW2luZGV4XS5zeW1ib2xJZCkpKSB7XG4gICAgICAgICAgc3ltYm9sQnlJZC5kZWxldGUoU3RyaW5nKHN5bWJvbHNbaW5kZXhdLnN5bWJvbElkKSk7XG4gICAgICAgICAgc3ltYm9scy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgcGFyZW50SXNzdWVzKSB7XG4gICAgICAgIGlzc3Vlcy5wdXNoKGVudHJ5Lmlzc3VlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyAtLS0gcmVsYXRpb25zaGlwcyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+W119ICovXG4gIGNvbnN0IHJlbGF0aW9uc2hpcHMgPSBbXTtcbiAgLyoqIEB0eXBlIHtTZXQ8c3RyaW5nPn0gKi9cbiAgY29uc3QgcmVsYXRpb25zaGlwSWRzID0gbmV3IFNldCgpO1xuICBmb3IgKGNvbnN0IFtpbmRleCwgZW50cnldIG9mIGFycmF5T2YoY2FuZGlkYXRlLnJlbGF0aW9uc2hpcHMpLmVudHJpZXMoKSkge1xuICAgIGNvbnN0IHBhdGggPSBgcmVsYXRpb25zaGlwc1ske2luZGV4fV1gO1xuICAgIC8qKiBAdHlwZSB7VmFsaWRhdGlvbklzc3VlW119ICovXG4gICAgY29uc3QgbG9jYWwgPSBbXTtcbiAgICB2YWxpZGF0ZVJlbGF0aW9uc2hpcChlbnRyeSwgcGF0aCwgZmlsZUJ5SWQsIHN5bWJvbEJ5SWQsIGxvY2FsKTtcbiAgICBjb25zdCByZWNvcmQgPSBpc1BsYWluT2JqZWN0KGVudHJ5KSA/IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChlbnRyeSkgOiB7fTtcbiAgICBjb25zdCBpZCA9IHR5cGVvZiByZWNvcmQucmVsYXRpb25zaGlwSWQgPT09ICdzdHJpbmcnID8gcmVjb3JkLnJlbGF0aW9uc2hpcElkIDogJyc7XG4gICAgaWYgKGlkICYmIHJlbGF0aW9uc2hpcElkcy5oYXMoaWQpKSB7XG4gICAgICBsb2NhbC5wdXNoKHsgcGF0aDogYCR7cGF0aH0ucmVsYXRpb25zaGlwSWRgLCBtZXNzYWdlOiBgRHVwbGljYXRlIHJlbGF0aW9uc2hpcElkIFwiJHtpZH1cIi5gIH0pO1xuICAgIH1cbiAgICBpZiAobG9jYWwubGVuZ3RoID09PSAwKSB7XG4gICAgICByZWxhdGlvbnNoaXBzLnB1c2gocmVjb3JkKTtcbiAgICAgIHJlbGF0aW9uc2hpcElkcy5hZGQoU3RyaW5nKHJlY29yZC5yZWxhdGlvbnNoaXBJZCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb2xsZWN0KG1vZGUsIGlzc3VlcywgZHJvcHBlZCwgJ3JlbGF0aW9uc2hpcHMnLCBwYXRoLCBpZCwgbG9jYWwpO1xuICAgIH1cbiAgfVxuXG4gIC8vIC0tLSBjb250cm9sIGNvbnN0cnVjdHMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj5bXX0gKi9cbiAgY29uc3QgY29uc3RydWN0cyA9IFtdO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIHVua25vd24+Pn0gKi9cbiAgY29uc3QgY29uc3RydWN0QnlJZCA9IG5ldyBNYXAoKTtcbiAgZm9yIChjb25zdCBbaW5kZXgsIGVudHJ5XSBvZiBhcnJheU9mKGNhbmRpZGF0ZS5jb250cm9sQ29uc3RydWN0cykuZW50cmllcygpKSB7XG4gICAgY29uc3QgcGF0aCA9IGBjb250cm9sQ29uc3RydWN0c1ske2luZGV4fV1gO1xuICAgIC8qKiBAdHlwZSB7VmFsaWRhdGlvbklzc3VlW119ICovXG4gICAgY29uc3QgbG9jYWwgPSBbXTtcbiAgICB2YWxpZGF0ZUNvbnN0cnVjdChlbnRyeSwgcGF0aCwgZmlsZUJ5SWQsIHN5bWJvbEJ5SWQsIGxvY2FsKTtcbiAgICBjb25zdCByZWNvcmQgPSBpc1BsYWluT2JqZWN0KGVudHJ5KSA/IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChlbnRyeSkgOiB7fTtcbiAgICBjb25zdCBpZCA9IHR5cGVvZiByZWNvcmQuY29uc3RydWN0SWQgPT09ICdzdHJpbmcnID8gcmVjb3JkLmNvbnN0cnVjdElkIDogJyc7XG4gICAgaWYgKGlkICYmIGNvbnN0cnVjdEJ5SWQuaGFzKGlkKSkge1xuICAgICAgbG9jYWwucHVzaCh7IHBhdGg6IGAke3BhdGh9LmNvbnN0cnVjdElkYCwgbWVzc2FnZTogYER1cGxpY2F0ZSBjb25zdHJ1Y3RJZCBcIiR7aWR9XCIuYCB9KTtcbiAgICB9XG4gICAgaWYgKGxvY2FsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc3RydWN0cy5wdXNoKHJlY29yZCk7XG4gICAgICBjb25zdHJ1Y3RCeUlkLnNldChTdHJpbmcocmVjb3JkLmNvbnN0cnVjdElkKSwgcmVjb3JkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29sbGVjdChtb2RlLCBpc3N1ZXMsIGRyb3BwZWQsICdjb250cm9sQ29uc3RydWN0cycsIHBhdGgsIGlkLCBsb2NhbCk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgY29uc3RydWN0TGlua3MgPSB2YWxpZGF0ZUNvbnN0cnVjdExpbmtzKGNvbnN0cnVjdHMsIGNvbnN0cnVjdEJ5SWQpO1xuICBsZXQgc3Vydml2aW5nQ29uc3RydWN0cyA9IGNvbnN0cnVjdHM7XG4gIGlmIChjb25zdHJ1Y3RMaW5rcy5sZW5ndGggPiAwKSB7XG4gICAgaWYgKGRlZmVuc2l2ZSkge1xuICAgICAgY29uc3QgZG9vbWVkID0gbmV3IFNldChjb25zdHJ1Y3RMaW5rcy5tYXAoKGVudHJ5KSA9PiBlbnRyeS5pZCkpO1xuICAgICAgbGV0IGNoYW5nZWQgPSB0cnVlO1xuICAgICAgd2hpbGUgKGNoYW5nZWQpIHtcbiAgICAgICAgY2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICBmb3IgKGNvbnN0IGNvbnN0cnVjdCBvZiBjb25zdHJ1Y3RzKSB7XG4gICAgICAgICAgY29uc3QgaWQgPSBTdHJpbmcoY29uc3RydWN0LmNvbnN0cnVjdElkKTtcbiAgICAgICAgICBpZiAoZG9vbWVkLmhhcyhpZCkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBwYXJlbnRJZCA9IHR5cGVvZiBjb25zdHJ1Y3QucGFyZW50SWQgPT09ICdzdHJpbmcnID8gY29uc3RydWN0LnBhcmVudElkIDogJyc7XG4gICAgICAgICAgY29uc3QgY2hpbGRyZW4gPSBBcnJheS5pc0FycmF5KGNvbnN0cnVjdC5jaGlsZHJlbikgPyBjb25zdHJ1Y3QuY2hpbGRyZW4ubWFwKFN0cmluZykgOiBbXTtcbiAgICAgICAgICBpZiAoZG9vbWVkLmhhcyhwYXJlbnRJZCkgfHwgY2hpbGRyZW4uc29tZSgoY2hpbGQpID0+IGRvb21lZC5oYXMoY2hpbGQpKSkge1xuICAgICAgICAgICAgZG9vbWVkLmFkZChpZCk7XG4gICAgICAgICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgY29uc3RydWN0TGlua3MpIHtcbiAgICAgICAgZHJvcHBlZC5wdXNoKHtcbiAgICAgICAgICBjb2xsZWN0aW9uOiAnY29udHJvbENvbnN0cnVjdHMnLFxuICAgICAgICAgIHBhdGg6ICdjb250cm9sQ29uc3RydWN0cycsXG4gICAgICAgICAgaWQ6IGVudHJ5LmlkLFxuICAgICAgICAgIGlzc3VlczogW2VudHJ5Lmlzc3VlXSxcbiAgICAgICAgfSk7XG4gICAgICAgIGlzc3Vlcy5wdXNoKHsgLi4uZW50cnkuaXNzdWUsIGRyb3BwZWQ6IHRydWUgfSk7XG4gICAgICB9XG4gICAgICBzdXJ2aXZpbmdDb25zdHJ1Y3RzID0gY29uc3RydWN0cy5maWx0ZXIoXG4gICAgICAgIChjb25zdHJ1Y3QpID0+ICFkb29tZWQuaGFzKFN0cmluZyhjb25zdHJ1Y3QuY29uc3RydWN0SWQpKSxcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgY29uc3RydWN0TGlua3MpIHtcbiAgICAgICAgaXNzdWVzLnB1c2goZW50cnkuaXNzdWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIC0tLSBkYXRhIGZhY3RzIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj5bXX0gKi9cbiAgY29uc3QgZGF0YUZhY3RzID0gW107XG4gIC8qKiBAdHlwZSB7U2V0PHN0cmluZz59ICovXG4gIGNvbnN0IGZhY3RJZHMgPSBuZXcgU2V0KCk7XG4gIGZvciAoY29uc3QgW2luZGV4LCBlbnRyeV0gb2YgYXJyYXlPZihjYW5kaWRhdGUuZGF0YUZhY3RzKS5lbnRyaWVzKCkpIHtcbiAgICBjb25zdCBwYXRoID0gYGRhdGFGYWN0c1ske2luZGV4fV1gO1xuICAgIC8qKiBAdHlwZSB7VmFsaWRhdGlvbklzc3VlW119ICovXG4gICAgY29uc3QgbG9jYWwgPSBbXTtcbiAgICB2YWxpZGF0ZURhdGFGYWN0KGVudHJ5LCBwYXRoLCBmaWxlQnlJZCwgc3ltYm9sQnlJZCwgbG9jYWwpO1xuICAgIGNvbnN0IHJlY29yZCA9IGlzUGxhaW5PYmplY3QoZW50cnkpID8gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKGVudHJ5KSA6IHt9O1xuICAgIGNvbnN0IGlkID0gdHlwZW9mIHJlY29yZC5mYWN0SWQgPT09ICdzdHJpbmcnID8gcmVjb3JkLmZhY3RJZCA6ICcnO1xuICAgIGlmIChpZCAmJiBmYWN0SWRzLmhhcyhpZCkpIHtcbiAgICAgIGxvY2FsLnB1c2goeyBwYXRoOiBgJHtwYXRofS5mYWN0SWRgLCBtZXNzYWdlOiBgRHVwbGljYXRlIGZhY3RJZCBcIiR7aWR9XCIuYCB9KTtcbiAgICB9XG4gICAgaWYgKGxvY2FsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgZGF0YUZhY3RzLnB1c2gocmVjb3JkKTtcbiAgICAgIGZhY3RJZHMuYWRkKFN0cmluZyhyZWNvcmQuZmFjdElkKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbGxlY3QobW9kZSwgaXNzdWVzLCBkcm9wcGVkLCAnZGF0YUZhY3RzJywgcGF0aCwgaWQsIGxvY2FsKTtcbiAgICB9XG4gIH1cblxuICAvLyAtLS0gZGlhZ25vc3RpY3MgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+W119ICovXG4gIGNvbnN0IGRpYWdub3N0aWNzID0gW107XG4gIGNvbnN0IGtub3duSWRzID0gbmV3IFNldChbXG4gICAgLi4uZmlsZUJ5SWQua2V5cygpLFxuICAgIC4uLnN5bWJvbEJ5SWQua2V5cygpLFxuICAgIC4uLnJlbGF0aW9uc2hpcElkcyxcbiAgICAuLi5jb25zdHJ1Y3RCeUlkLmtleXMoKSxcbiAgICAuLi5mYWN0SWRzLFxuICBdKTtcbiAgZm9yIChjb25zdCBbaW5kZXgsIGVudHJ5XSBvZiBhcnJheU9mKGNhbmRpZGF0ZS5kaWFnbm9zdGljcykuZW50cmllcygpKSB7XG4gICAgY29uc3QgcGF0aCA9IGBkaWFnbm9zdGljc1ske2luZGV4fV1gO1xuICAgIC8qKiBAdHlwZSB7VmFsaWRhdGlvbklzc3VlW119ICovXG4gICAgY29uc3QgbG9jYWwgPSBbXTtcbiAgICB2YWxpZGF0ZURpYWdub3N0aWMoZW50cnksIHBhdGgsIGZpbGVCeUlkLCBrbm93bklkcywgbG9jYWwpO1xuICAgIGlmIChsb2NhbC5sZW5ndGggPT09IDApIHtcbiAgICAgIGRpYWdub3N0aWNzLnB1c2goLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKGVudHJ5KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbGxlY3QobW9kZSwgaXNzdWVzLCBkcm9wcGVkLCAnZGlhZ25vc3RpY3MnLCBwYXRoLCAnJywgbG9jYWwpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChpc3N1ZXMubGVuZ3RoID4gMCAmJiAhZGVmZW5zaXZlKSB7XG4gICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBpc3N1ZXMsIGRyb3BwZWQgfTtcbiAgfVxuXG4gIC8qKiBAdHlwZSB7aW1wb3J0KCcuL2VudGl0aWVzLmpzJykuQW5hbHlzaXNSdW5bJ2NvbXBsZXRlbmVzcyddfSAqL1xuICBsZXQgZmluYWxDb21wbGV0ZW5lc3MgPSBjb21wbGV0ZW5lc3M7XG4gIGlmIChkcm9wcGVkLmxlbmd0aCA+IDAgJiYgZmluYWxDb21wbGV0ZW5lc3MgPT09ICdmdWxsJykge1xuICAgIGZpbmFsQ29tcGxldGVuZXNzID0gJ3BhcnRpYWwnO1xuICB9XG4gIGZvciAoY29uc3QgZW50cnkgb2YgZHJvcHBlZCkge1xuICAgIGRpYWdub3N0aWNzLnB1c2goe1xuICAgICAgc2V2ZXJpdHk6ICd3YXJuaW5nJyxcbiAgICAgIGNvZGU6ICdjc3JfcmVjb3JkX2Ryb3BwZWQnLFxuICAgICAgbWVzc2FnZTogYERyb3BwZWQgJHtlbnRyeS5wYXRofSR7ZW50cnkuaWQgPyBgICgke2VudHJ5LmlkfSlgIDogJyd9OiAke1xuICAgICAgICBlbnRyeS5pc3N1ZXNbMF0/Lm1lc3NhZ2UgPz8gJ2ludmFsaWQgcmVjb3JkJ1xuICAgICAgfWAsXG4gICAgICBhZmZlY3RzOiBlbnRyeS5pZCA/IFtlbnRyeS5pZF0gOiBbXSxcbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVSdW4oe1xuICAgIGNhbmRpZGF0ZSxcbiAgICBjb21wbGV0ZW5lc3M6IGZpbmFsQ29tcGxldGVuZXNzLFxuICAgIGZpbGVzLFxuICAgIHN5bWJvbHMsXG4gICAgcmVsYXRpb25zaGlwcyxcbiAgICBjb250cm9sQ29uc3RydWN0czogc3Vydml2aW5nQ29uc3RydWN0cyxcbiAgICBkYXRhRmFjdHMsXG4gICAgZGlhZ25vc3RpY3MsXG4gIH0pO1xuXG4gIGlmIChpc05ld2VyTWlub3IoY2FuZGlkYXRlLmNzclZlcnNpb24pKSB7XG4gICAgbm9ybWFsaXplZC5kaWFnbm9zdGljcy5wdXNoKHtcbiAgICAgIHNldmVyaXR5OiAnaW5mbycsXG4gICAgICBjb2RlOiAnY3NyX25ld2VyX21pbm9yJyxcbiAgICAgIG1lc3NhZ2U6IGBUaGUgYWRhcHRlciBlbWl0dGVkIENTUiAke1N0cmluZyhcbiAgICAgICAgY2FuZGlkYXRlLmNzclZlcnNpb24sXG4gICAgICApfTsgdGhpcyBidWlsZCByZWFkcyBpdCBhcyAke0NTUl9WRVJTSU9OfSBhbmQgaWdub3JlcyBuZXdlciBmaWVsZHMuYCxcbiAgICAgIGFmZmVjdHM6IFtdLFxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHsgb2s6IHRydWUsIHJ1bjogbm9ybWFsaXplZCwgaXNzdWVzLCBkcm9wcGVkIH07XG59XG5cbi8qKlxuICogQHBhcmFtIHsnc3RyaWN0J3wnZGVmZW5zaXZlJ30gbW9kZVxuICogQHBhcmFtIHtWYWxpZGF0aW9uSXNzdWVbXX0gaXNzdWVzXG4gKiBAcGFyYW0ge0Ryb3BwZWRSZWNvcmRbXX0gZHJvcHBlZFxuICogQHBhcmFtIHtEcm9wcGVkUmVjb3JkWydjb2xsZWN0aW9uJ119IGNvbGxlY3Rpb25cbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoXG4gKiBAcGFyYW0ge3Vua25vd259IGlkXG4gKiBAcGFyYW0ge1ZhbGlkYXRpb25Jc3N1ZVtdfSBsb2NhbFxuICovXG5mdW5jdGlvbiBjb2xsZWN0KG1vZGUsIGlzc3VlcywgZHJvcHBlZCwgY29sbGVjdGlvbiwgcGF0aCwgaWQsIGxvY2FsKSB7XG4gIGlmIChtb2RlID09PSAnc3RyaWN0Jykge1xuICAgIGlzc3Vlcy5wdXNoKC4uLmxvY2FsKTtcbiAgICByZXR1cm47XG4gIH1cbiAgZHJvcHBlZC5wdXNoKHtcbiAgICBjb2xsZWN0aW9uLFxuICAgIHBhdGgsXG4gICAgaWQ6IHR5cGVvZiBpZCA9PT0gJ3N0cmluZycgJiYgaWQubGVuZ3RoID4gMCA/IGlkIDogdW5kZWZpbmVkLFxuICAgIGlzc3VlczogbG9jYWwsXG4gIH0pO1xuICBpc3N1ZXMucHVzaCguLi5sb2NhbC5tYXAoKGlzc3VlKSA9PiAoeyAuLi5pc3N1ZSwgZHJvcHBlZDogdHJ1ZSB9KSkpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEByZXR1cm5zIHt1bmtub3duW119XG4gKi9cbmZ1bmN0aW9uIGFycmF5T2YodmFsdWUpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWUgOiBbXTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcmV0dXJucyB7dmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj59XG4gKi9cbmZ1bmN0aW9uIGlzUGxhaW5PYmplY3QodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gc2NvcGVcbiAqIEBwYXJhbSB7VmFsaWRhdGlvbklzc3VlW119IGlzc3Vlc1xuICovXG5mdW5jdGlvbiB2YWxpZGF0ZVNjb3BlKHNjb3BlLCBpc3N1ZXMpIHtcbiAgaWYgKHNjb3BlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKCFpc1BsYWluT2JqZWN0KHNjb3BlKSkge1xuICAgIGlzc3Vlcy5wdXNoKHsgcGF0aDogJ3Njb3BlJywgbWVzc2FnZTogJ3Njb3BlIG11c3QgYmUgYW4gb2JqZWN0LicgfSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChzY29wZS5raW5kICE9PSAnZmlsZScgJiYgc2NvcGUua2luZCAhPT0gJ3dvcmtzcGFjZScpIHtcbiAgICBpc3N1ZXMucHVzaCh7IHBhdGg6ICdzY29wZS5raW5kJywgbWVzc2FnZTogJ3Njb3BlLmtpbmQgbXVzdCBiZSBcImZpbGVcIiBvciBcIndvcmtzcGFjZVwiLicgfSk7XG4gIH1cbiAgaWYgKHNjb3BlLnBhdGggIT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygc2NvcGUucGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICBpc3N1ZXMucHVzaCh7IHBhdGg6ICdzY29wZS5wYXRoJywgbWVzc2FnZTogJ3Njb3BlLnBhdGggbXVzdCBiZSBhIHN0cmluZyB3aGVuIHByZXNlbnQuJyB9KTtcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gZW50cnlcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoXG4gKiBAcGFyYW0ge1ZhbGlkYXRpb25Jc3N1ZVtdfSBpc3N1ZXNcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVGaWxlKGVudHJ5LCBwYXRoLCBpc3N1ZXMpIHtcbiAgaWYgKCFpc1BsYWluT2JqZWN0KGVudHJ5KSkge1xuICAgIGlzc3Vlcy5wdXNoKHsgcGF0aCwgbWVzc2FnZTogJ0ZpbGUgcmVjb3JkIG11c3QgYmUgYW4gb2JqZWN0LicgfSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHJlY29yZCA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChlbnRyeSk7XG4gIHJlcXVpcmVTdHJpbmcocmVjb3JkLmZpbGVJZCwgYCR7cGF0aH0uZmlsZUlkYCwgJ2ZpbGVJZCcsIGlzc3Vlcyk7XG4gIGlmICh0eXBlb2YgcmVjb3JkLmZpbGVJZCA9PT0gJ3N0cmluZycgJiYgIXJlY29yZC5maWxlSWQuc3RhcnRzV2l0aCgnZmlsZTonKSkge1xuICAgIGlzc3Vlcy5wdXNoKHsgcGF0aDogYCR7cGF0aH0uZmlsZUlkYCwgbWVzc2FnZTogJ2ZpbGVJZCBtdXN0IHN0YXJ0IHdpdGggXCJmaWxlOlwiLicgfSk7XG4gIH1cbiAgY29uc3QgcGF0aElzc3VlcyA9IHdvcmtzcGFjZVBhdGhJc3N1ZXMocmVjb3JkLnBhdGgpO1xuICBmb3IgKGNvbnN0IG1lc3NhZ2Ugb2YgcGF0aElzc3Vlcykge1xuICAgIGlzc3Vlcy5wdXNoKHsgcGF0aDogYCR7cGF0aH0ucGF0aGAsIG1lc3NhZ2UgfSk7XG4gIH1cbiAgcmVxdWlyZVN0cmluZyhyZWNvcmQubGFuZ3VhZ2UsIGAke3BhdGh9Lmxhbmd1YWdlYCwgJ2xhbmd1YWdlJywgaXNzdWVzKTtcbiAgcmVxdWlyZVN0cmluZyhyZWNvcmQuY29udGVudEhhc2gsIGAke3BhdGh9LmNvbnRlbnRIYXNoYCwgJ2NvbnRlbnRIYXNoJywgaXNzdWVzKTtcbiAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKHJlY29yZC5zaXplQnl0ZXMpIHx8IE51bWJlcihyZWNvcmQuc2l6ZUJ5dGVzKSA8IDApIHtcbiAgICBpc3N1ZXMucHVzaCh7XG4gICAgICBwYXRoOiBgJHtwYXRofS5zaXplQnl0ZXNgLFxuICAgICAgbWVzc2FnZTogJ3NpemVCeXRlcyBtdXN0IGJlIGEgbm9uLW5lZ2F0aXZlIGludGVnZXIuJyxcbiAgICB9KTtcbiAgfVxuICBpZiAoIU51bWJlci5pc0ludGVnZXIocmVjb3JkLmxpbmVDb3VudCkgfHwgTnVtYmVyKHJlY29yZC5saW5lQ291bnQpIDwgMSkge1xuICAgIGlzc3Vlcy5wdXNoKHsgcGF0aDogYCR7cGF0aH0ubGluZUNvdW50YCwgbWVzc2FnZTogJ2xpbmVDb3VudCBtdXN0IGJlIGEgcG9zaXRpdmUgaW50ZWdlci4nIH0pO1xuICB9XG4gIGlmIChyZWNvcmQuZ2VuZXJhdGVkICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIHJlY29yZC5nZW5lcmF0ZWQgIT09ICdib29sZWFuJykge1xuICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgIHBhdGg6IGAke3BhdGh9LmdlbmVyYXRlZGAsXG4gICAgICBtZXNzYWdlOiAnZ2VuZXJhdGVkIG11c3QgYmUgYSBib29sZWFuIHdoZW4gcHJlc2VudC4nLFxuICAgIH0pO1xuICB9XG4gIGlmIChyZWNvcmQuZXh0ZW5zaW9ucyAhPT0gdW5kZWZpbmVkICYmICFpc1BsYWluT2JqZWN0KHJlY29yZC5leHRlbnNpb25zKSkge1xuICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgIHBhdGg6IGAke3BhdGh9LmV4dGVuc2lvbnNgLFxuICAgICAgbWVzc2FnZTogJ2V4dGVuc2lvbnMgbXVzdCBiZSBhbiBvYmplY3Qgd2hlbiBwcmVzZW50LicsXG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IGVudHJ5XG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aFxuICogQHBhcmFtIHtNYXA8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj59IGZpbGVCeUlkXG4gKiBAcGFyYW0ge1ZhbGlkYXRpb25Jc3N1ZVtdfSBpc3N1ZXNcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVTeW1ib2woZW50cnksIHBhdGgsIGZpbGVCeUlkLCBpc3N1ZXMpIHtcbiAgaWYgKCFpc1BsYWluT2JqZWN0KGVudHJ5KSkge1xuICAgIGlzc3Vlcy5wdXNoKHsgcGF0aCwgbWVzc2FnZTogJ1N5bWJvbCBtdXN0IGJlIGFuIG9iamVjdC4nIH0pO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCByZWNvcmQgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAoZW50cnkpO1xuICByZXF1aXJlU3RyaW5nKHJlY29yZC5zeW1ib2xJZCwgYCR7cGF0aH0uc3ltYm9sSWRgLCAnc3ltYm9sSWQnLCBpc3N1ZXMpO1xuICBpZiAodHlwZW9mIHJlY29yZC5zeW1ib2xJZCA9PT0gJ3N0cmluZycgJiYgIXJlY29yZC5zeW1ib2xJZC5zdGFydHNXaXRoKCdzeW1ib2w6JykpIHtcbiAgICBpc3N1ZXMucHVzaCh7IHBhdGg6IGAke3BhdGh9LnN5bWJvbElkYCwgbWVzc2FnZTogJ3N5bWJvbElkIG11c3Qgc3RhcnQgd2l0aCBcInN5bWJvbDpcIi4nIH0pO1xuICB9XG4gIGlmICghU1lNQk9MX0tJTkRTLmluY2x1ZGVzKFN0cmluZyhyZWNvcmQua2luZCkpKSB7XG4gICAgaXNzdWVzLnB1c2goe1xuICAgICAgcGF0aDogYCR7cGF0aH0ua2luZGAsXG4gICAgICBtZXNzYWdlOiBgVW5rbm93biBzeW1ib2wga2luZCBcIiR7U3RyaW5nKHJlY29yZC5raW5kKX1cIjsgZXhwZWN0ZWQgb25lIG9mICR7U1lNQk9MX0tJTkRTLmpvaW4oXG4gICAgICAgICcsICcsXG4gICAgICApfS5gLFxuICAgIH0pO1xuICB9XG4gIGlmICh0eXBlb2YgcmVjb3JkLm5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgaXNzdWVzLnB1c2goeyBwYXRoOiBgJHtwYXRofS5uYW1lYCwgbWVzc2FnZTogJ25hbWUgbXVzdCBiZSBhIHN0cmluZy4nIH0pO1xuICB9XG4gIHJlcXVpcmVTdHJpbmcocmVjb3JkLnF1YWxpZmllZE5hbWUsIGAke3BhdGh9LnF1YWxpZmllZE5hbWVgLCAncXVhbGlmaWVkTmFtZScsIGlzc3Vlcyk7XG4gIHJlcXVpcmVTdHJpbmcocmVjb3JkLmxhbmd1YWdlLCBgJHtwYXRofS5sYW5ndWFnZWAsICdsYW5ndWFnZScsIGlzc3Vlcyk7XG5cbiAgaWYgKHJlY29yZC5kZWNsYXJhdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgaXNzdWVzLnB1c2goeyBwYXRoOiBgJHtwYXRofS5kZWNsYXJhdGlvbmAsIG1lc3NhZ2U6ICdkZWNsYXJhdGlvbiByYW5nZSBpcyByZXF1aXJlZC4nIH0pO1xuICB9IGVsc2Uge1xuICAgIHZhbGlkYXRlUmFuZ2UocmVjb3JkLmRlY2xhcmF0aW9uLCBgJHtwYXRofS5kZWNsYXJhdGlvbmAsIGZpbGVCeUlkLCBpc3N1ZXMpO1xuICB9XG4gIGlmIChyZWNvcmQuc2lnbmF0dXJlICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIHJlY29yZC5zaWduYXR1cmUgIT09ICdzdHJpbmcnKSB7XG4gICAgaXNzdWVzLnB1c2goeyBwYXRoOiBgJHtwYXRofS5zaWduYXR1cmVgLCBtZXNzYWdlOiAnc2lnbmF0dXJlIG11c3QgYmUgYSBzdHJpbmcgd2hlbiBwcmVzZW50LicgfSk7XG4gIH1cbiAgaWYgKHJlY29yZC5wYXJlbnRJZCAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiByZWNvcmQucGFyZW50SWQgIT09ICdzdHJpbmcnKSB7XG4gICAgaXNzdWVzLnB1c2goeyBwYXRoOiBgJHtwYXRofS5wYXJlbnRJZGAsIG1lc3NhZ2U6ICdwYXJlbnRJZCBtdXN0IGJlIGEgc3RyaW5nIHdoZW4gcHJlc2VudC4nIH0pO1xuICB9XG4gIGlmIChyZWNvcmQudmlzaWJpbGl0eSAhPT0gdW5kZWZpbmVkICYmICFWSVNJQklMSVRJRVMuaW5jbHVkZXMoU3RyaW5nKHJlY29yZC52aXNpYmlsaXR5KSkpIHtcbiAgICBpc3N1ZXMucHVzaCh7XG4gICAgICBwYXRoOiBgJHtwYXRofS52aXNpYmlsaXR5YCxcbiAgICAgIG1lc3NhZ2U6IGB2aXNpYmlsaXR5IG11c3QgYmUgb25lIG9mICR7VklTSUJJTElUSUVTLmpvaW4oJywgJyl9LmAsXG4gICAgfSk7XG4gIH1cbiAgaWYgKHJlY29yZC5kaXNhbWJpZ3VhdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAoXG4gICAgICB0eXBlb2YgcmVjb3JkLmRpc2FtYmlndWF0b3IgIT09ICdzdHJpbmcnIHx8XG4gICAgICAhL15bQS1aYS16MC05Xy4rfi1dKyQvLnRlc3QocmVjb3JkLmRpc2FtYmlndWF0b3IpXG4gICAgKSB7XG4gICAgICBpc3N1ZXMucHVzaCh7XG4gICAgICAgIHBhdGg6IGAke3BhdGh9LmRpc2FtYmlndWF0b3JgLFxuICAgICAgICBtZXNzYWdlOlxuICAgICAgICAgICdkaXNhbWJpZ3VhdG9yIG11c3QgYmUgYSBzdGFibGUgdG9rZW4gb2YgQS1aLCBhLXosIDAtOSwgXCJfXCIsIFwiLlwiLCBcIitcIiwgXCJ+XCIgb3IgXCItXCIuJyxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBpZiAocmVjb3JkLmV4dGVuc2lvbnMgIT09IHVuZGVmaW5lZCAmJiAhaXNQbGFpbk9iamVjdChyZWNvcmQuZXh0ZW5zaW9ucykpIHtcbiAgICBpc3N1ZXMucHVzaCh7XG4gICAgICBwYXRoOiBgJHtwYXRofS5leHRlbnNpb25zYCxcbiAgICAgIG1lc3NhZ2U6ICdleHRlbnNpb25zIG11c3QgYmUgYW4gb2JqZWN0IHdoZW4gcHJlc2VudC4nLFxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gcmVjb3JkXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBzeW1ib2xJZGVudGl0eUtleShyZWNvcmQpIHtcbiAgaWYgKHR5cGVvZiByZWNvcmQua2luZCAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIHJlY29yZC5xdWFsaWZpZWROYW1lICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiAnJztcbiAgfVxuICBjb25zdCBkZWNsYXJhdGlvbiA9IGlzUGxhaW5PYmplY3QocmVjb3JkLmRlY2xhcmF0aW9uKSA/IHJlY29yZC5kZWNsYXJhdGlvbiA6IHt9O1xuICBjb25zdCBmaWxlSWQgPSB0eXBlb2YgZGVjbGFyYXRpb24uZmlsZUlkID09PSAnc3RyaW5nJyA/IGRlY2xhcmF0aW9uLmZpbGVJZCA6ICcnO1xuICBpZiAoIWZpbGVJZCkge1xuICAgIHJldHVybiAnJztcbiAgfVxuICByZXR1cm4gW1xuICAgIGZpbGVJZCxcbiAgICByZWNvcmQua2luZCxcbiAgICByZWNvcmQucXVhbGlmaWVkTmFtZSxcbiAgICB0eXBlb2YgcmVjb3JkLmRpc2FtYmlndWF0b3IgPT09ICdzdHJpbmcnID8gcmVjb3JkLmRpc2FtYmlndWF0b3IgOiAnJyxcbiAgXS5qb2luKCd8Jyk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdfSBzeW1ib2xzXG4gKiBAcGFyYW0ge01hcDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIHVua25vd24+Pn0gc3ltYm9sQnlJZFxuICogQHJldHVybnMge0FycmF5PHtpZDogc3RyaW5nLCBpc3N1ZTogVmFsaWRhdGlvbklzc3VlfT59XG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlUGFyZW50cyhzeW1ib2xzLCBzeW1ib2xCeUlkKSB7XG4gIC8qKiBAdHlwZSB7QXJyYXk8e2lkOiBzdHJpbmcsIGlzc3VlOiBWYWxpZGF0aW9uSXNzdWV9Pn0gKi9cbiAgY29uc3QgcHJvYmxlbXMgPSBbXTtcbiAgZm9yIChjb25zdCBbaW5kZXgsIHN5bWJvbF0gb2Ygc3ltYm9scy5lbnRyaWVzKCkpIHtcbiAgICBjb25zdCBwYXJlbnRJZCA9IHN5bWJvbC5wYXJlbnRJZDtcbiAgICBpZiAodHlwZW9mIHBhcmVudElkID09PSAnc3RyaW5nJyAmJiBwYXJlbnRJZC5sZW5ndGggPiAwICYmICFzeW1ib2xCeUlkLmhhcyhwYXJlbnRJZCkpIHtcbiAgICAgIHByb2JsZW1zLnB1c2goe1xuICAgICAgICBpZDogU3RyaW5nKHN5bWJvbC5zeW1ib2xJZCksXG4gICAgICAgIGlzc3VlOiB7XG4gICAgICAgICAgcGF0aDogYHN5bWJvbHNbJHtpbmRleH1dLnBhcmVudElkYCxcbiAgICAgICAgICBtZXNzYWdlOiBgcGFyZW50SWQgXCIke3BhcmVudElkfVwiIGlzIG5vdCBhIGRlY2xhcmVkIHN5bWJvbC5gLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc3RhdGUgPSBuZXcgTWFwKCk7XG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gaWRcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gdHJhaWxcbiAgICogQHJldHVybnMge3N0cmluZyB8IG51bGx9XG4gICAqL1xuICBmdW5jdGlvbiB2aXNpdChpZCwgdHJhaWwpIHtcbiAgICBpZiAoc3RhdGUuZ2V0KGlkKSA9PT0gJ2RvbmUnKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaWYgKHN0YXRlLmdldChpZCkgPT09ICd2aXNpdGluZycpIHtcbiAgICAgIHJldHVybiBpZDtcbiAgICB9XG4gICAgc3RhdGUuc2V0KGlkLCAndmlzaXRpbmcnKTtcbiAgICBjb25zdCBzeW1ib2wgPSBzeW1ib2xCeUlkLmdldChpZCk7XG4gICAgY29uc3QgcGFyZW50SWQgPSBzeW1ib2wgJiYgdHlwZW9mIHN5bWJvbC5wYXJlbnRJZCA9PT0gJ3N0cmluZycgPyBzeW1ib2wucGFyZW50SWQgOiAnJztcbiAgICBpZiAocGFyZW50SWQgJiYgc3ltYm9sQnlJZC5oYXMocGFyZW50SWQpKSB7XG4gICAgICBjb25zdCBjeWNsZSA9IHZpc2l0KHBhcmVudElkLCBbLi4udHJhaWwsIGlkXSk7XG4gICAgICBpZiAoY3ljbGUpIHtcbiAgICAgICAgcmV0dXJuIGN5Y2xlO1xuICAgICAgfVxuICAgIH1cbiAgICBzdGF0ZS5zZXQoaWQsICdkb25lJyk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBmb3IgKGNvbnN0IHN5bWJvbCBvZiBzeW1ib2xzKSB7XG4gICAgY29uc3QgaWQgPSBTdHJpbmcoc3ltYm9sLnN5bWJvbElkKTtcbiAgICBjb25zdCBjeWNsZSA9IHZpc2l0KGlkLCBbXSk7XG4gICAgaWYgKGN5Y2xlKSB7XG4gICAgICBjb25zdCBpbmRleCA9IHN5bWJvbHMuaW5kZXhPZihzeW1ib2wpO1xuICAgICAgcHJvYmxlbXMucHVzaCh7XG4gICAgICAgIGlkLFxuICAgICAgICBpc3N1ZToge1xuICAgICAgICAgIHBhdGg6IGBzeW1ib2xzWyR7aW5kZXh9XS5wYXJlbnRJZGAsXG4gICAgICAgICAgbWVzc2FnZTogYEN5Y2xpYyBwYXJlbnRJZCBjaGFpbiBkZXRlY3RlZCBhdCBcIiR7Y3ljbGV9XCIuYCxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiBwcm9ibGVtcztcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IGVudHJ5XG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aFxuICogQHBhcmFtIHtNYXA8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj59IGZpbGVCeUlkXG4gKiBAcGFyYW0ge01hcDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIHVua25vd24+Pn0gc3ltYm9sQnlJZFxuICogQHBhcmFtIHtWYWxpZGF0aW9uSXNzdWVbXX0gaXNzdWVzXG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlUmVsYXRpb25zaGlwKGVudHJ5LCBwYXRoLCBmaWxlQnlJZCwgc3ltYm9sQnlJZCwgaXNzdWVzKSB7XG4gIGlmICghaXNQbGFpbk9iamVjdChlbnRyeSkpIHtcbiAgICBpc3N1ZXMucHVzaCh7IHBhdGgsIG1lc3NhZ2U6ICdSZWxhdGlvbnNoaXAgbXVzdCBiZSBhbiBvYmplY3QuJyB9KTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgcmVjb3JkID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKGVudHJ5KTtcbiAgcmVxdWlyZVN0cmluZyhyZWNvcmQucmVsYXRpb25zaGlwSWQsIGAke3BhdGh9LnJlbGF0aW9uc2hpcElkYCwgJ3JlbGF0aW9uc2hpcElkJywgaXNzdWVzKTtcbiAgaWYgKCFSRUxBVElPTlNISVBfVFlQRVMuaW5jbHVkZXMoU3RyaW5nKHJlY29yZC50eXBlKSkpIHtcbiAgICBpc3N1ZXMucHVzaCh7XG4gICAgICBwYXRoOiBgJHtwYXRofS50eXBlYCxcbiAgICAgIG1lc3NhZ2U6IGBVbmtub3duIHJlbGF0aW9uc2hpcCB0eXBlIFwiJHtTdHJpbmcoXG4gICAgICAgIHJlY29yZC50eXBlLFxuICAgICAgKX1cIjsgZXhwZWN0ZWQgb25lIG9mICR7UkVMQVRJT05TSElQX1RZUEVTLmpvaW4oJywgJyl9LmAsXG4gICAgfSk7XG4gIH1cbiAgY29uc3Qgc3RhdHVzID0gU3RyaW5nKHJlY29yZC5zdGF0dXMpO1xuICBpZiAoIVJFU09MVVRJT05fU1RBVFVTRVMuaW5jbHVkZXMoc3RhdHVzKSkge1xuICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgIHBhdGg6IGAke3BhdGh9LnN0YXR1c2AsXG4gICAgICBtZXNzYWdlOiBgc3RhdHVzIG11c3QgYmUgb25lIG9mICR7UkVTT0xVVElPTl9TVEFUVVNFUy5qb2luKCcsICcpfS5gLFxuICAgIH0pO1xuICB9IGVsc2UgaWYgKHN0YXR1cyAhPT0gJ3Jlc29sdmVkJykge1xuICAgIGlmICh0eXBlb2YgcmVjb3JkLnJlYXNvbkNvZGUgIT09ICdzdHJpbmcnIHx8IHJlY29yZC5yZWFzb25Db2RlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgaXNzdWVzLnB1c2goe1xuICAgICAgICBwYXRoOiBgJHtwYXRofS5yZWFzb25Db2RlYCxcbiAgICAgICAgbWVzc2FnZTogYEEgXCIke3N0YXR1c31cIiByZWxhdGlvbnNoaXAgbXVzdCBjYXJyeSBhIHJlYXNvbkNvZGUuYCxcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAoIWlzUmVhc29uQ29kZShyZWNvcmQucmVhc29uQ29kZSkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgICAgcGF0aDogYCR7cGF0aH0ucmVhc29uQ29kZWAsXG4gICAgICAgIG1lc3NhZ2U6IGBVbmtub3duIHJlYXNvbkNvZGUgXCIke3JlY29yZC5yZWFzb25Db2RlfVwiLmAsXG4gICAgICB9KTtcbiAgICB9XG4gIH0gZWxzZSBpZiAocmVjb3JkLnJlYXNvbkNvZGUgIT09IHVuZGVmaW5lZCAmJiAhaXNSZWFzb25Db2RlKHJlY29yZC5yZWFzb25Db2RlKSkge1xuICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgIHBhdGg6IGAke3BhdGh9LnJlYXNvbkNvZGVgLFxuICAgICAgbWVzc2FnZTogYFVua25vd24gcmVhc29uQ29kZSBcIiR7U3RyaW5nKHJlY29yZC5yZWFzb25Db2RlKX1cIi5gLFxuICAgIH0pO1xuICB9XG5cbiAgY29uc3QgZnJvbSA9IHJlY29yZC5mcm9tO1xuICBpZiAodHlwZW9mIGZyb20gIT09ICdzdHJpbmcnIHx8IGZyb20ubGVuZ3RoID09PSAwKSB7XG4gICAgaXNzdWVzLnB1c2goeyBwYXRoOiBgJHtwYXRofS5mcm9tYCwgbWVzc2FnZTogJ2Zyb20gbXVzdCBiZSBhIHN5bWJvbElkLicgfSk7XG4gIH0gZWxzZSBpZiAoIXN5bWJvbEJ5SWQuaGFzKGZyb20pKSB7XG4gICAgaXNzdWVzLnB1c2goeyBwYXRoOiBgJHtwYXRofS5mcm9tYCwgbWVzc2FnZTogYFVua25vd24gc291cmNlIHN5bWJvbCBcIiR7ZnJvbX1cIi5gIH0pO1xuICB9XG4gIGNvbnN0IHRvID0gcmVjb3JkLnRvO1xuICBpZiAodHlwZW9mIHRvICE9PSAnc3RyaW5nJyB8fCB0by5sZW5ndGggPT09IDApIHtcbiAgICBpc3N1ZXMucHVzaCh7IHBhdGg6IGAke3BhdGh9LnRvYCwgbWVzc2FnZTogJ3RvIG11c3QgYmUgYSBzeW1ib2xJZCBvciBleHRlcm5hbCB0YXJnZXQgaWQuJyB9KTtcbiAgfSBlbHNlIGlmIChzdGF0dXMgPT09ICdyZXNvbHZlZCcgJiYgIXN5bWJvbEJ5SWQuaGFzKHRvKSkge1xuICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgIHBhdGg6IGAke3BhdGh9LnRvYCxcbiAgICAgIG1lc3NhZ2U6IGBBIHJlc29sdmVkIHJlbGF0aW9uc2hpcCBtdXN0IHRhcmdldCBhIGRlY2xhcmVkIHN5bWJvbDsgXCIke3RvfVwiIGlzIHVua25vd24uYCxcbiAgICB9KTtcbiAgfVxuXG4gIGlmIChyZWNvcmQuc2l0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgdmFsaWRhdGVSYW5nZShyZWNvcmQuc2l0ZSwgYCR7cGF0aH0uc2l0ZWAsIGZpbGVCeUlkLCBpc3N1ZXMpO1xuICB9XG4gIGlmIChyZWNvcmQuZXZpZGVuY2UgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICghQXJyYXkuaXNBcnJheShyZWNvcmQuZXZpZGVuY2UpKSB7XG4gICAgICBpc3N1ZXMucHVzaCh7IHBhdGg6IGAke3BhdGh9LmV2aWRlbmNlYCwgbWVzc2FnZTogJ2V2aWRlbmNlIG11c3QgYmUgYW4gYXJyYXkgd2hlbiBwcmVzZW50LicgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlY29yZC5ldmlkZW5jZS5mb3JFYWNoKChldmlkZW5jZSwgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc3QgZXZpZGVuY2VQYXRoID0gYCR7cGF0aH0uZXZpZGVuY2VbJHtpbmRleH1dYDtcbiAgICAgICAgaWYgKCFpc1BsYWluT2JqZWN0KGV2aWRlbmNlKSkge1xuICAgICAgICAgIGlzc3Vlcy5wdXNoKHsgcGF0aDogZXZpZGVuY2VQYXRoLCBtZXNzYWdlOiAnRXZpZGVuY2UgbXVzdCBiZSBhbiBvYmplY3QuJyB9KTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFFVklERU5DRV9LSU5EUy5pbmNsdWRlcyhTdHJpbmcoZXZpZGVuY2Uua2luZCkpKSB7XG4gICAgICAgICAgaXNzdWVzLnB1c2goe1xuICAgICAgICAgICAgcGF0aDogYCR7ZXZpZGVuY2VQYXRofS5raW5kYCxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGBVbmtub3duIGV2aWRlbmNlIGtpbmQgXCIke1N0cmluZyhldmlkZW5jZS5raW5kKX1cIi5gLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChldmlkZW5jZS5yYW5nZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgdmFsaWRhdGVSYW5nZShldmlkZW5jZS5yYW5nZSwgYCR7ZXZpZGVuY2VQYXRofS5yYW5nZWAsIGZpbGVCeUlkLCBpc3N1ZXMpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgZmllbGQgb2YgWydzeW1ib2xJZCcsICdyZWxhdGlvbnNoaXBJZCcsICdkaWFnbm9zdGljQ29kZScsICdub3RlJ10pIHtcbiAgICAgICAgICBpZiAoZXZpZGVuY2VbZmllbGRdICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGV2aWRlbmNlW2ZpZWxkXSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgICAgICAgICAgcGF0aDogYCR7ZXZpZGVuY2VQYXRofS4ke2ZpZWxkfWAsXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IGAke2ZpZWxkfSBtdXN0IGJlIGEgc3RyaW5nIHdoZW4gcHJlc2VudC5gLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgaWYgKHJlY29yZC5leHRlbnNpb25zICE9PSB1bmRlZmluZWQgJiYgIWlzUGxhaW5PYmplY3QocmVjb3JkLmV4dGVuc2lvbnMpKSB7XG4gICAgaXNzdWVzLnB1c2goe1xuICAgICAgcGF0aDogYCR7cGF0aH0uZXh0ZW5zaW9uc2AsXG4gICAgICBtZXNzYWdlOiAnZXh0ZW5zaW9ucyBtdXN0IGJlIGFuIG9iamVjdCB3aGVuIHByZXNlbnQuJyxcbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gZW50cnlcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoXG4gKiBAcGFyYW0ge01hcDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIHVua25vd24+Pn0gZmlsZUJ5SWRcbiAqIEBwYXJhbSB7TWFwPHN0cmluZywgUmVjb3JkPHN0cmluZywgdW5rbm93bj4+fSBzeW1ib2xCeUlkXG4gKiBAcGFyYW0ge1ZhbGlkYXRpb25Jc3N1ZVtdfSBpc3N1ZXNcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVDb25zdHJ1Y3QoZW50cnksIHBhdGgsIGZpbGVCeUlkLCBzeW1ib2xCeUlkLCBpc3N1ZXMpIHtcbiAgaWYgKCFpc1BsYWluT2JqZWN0KGVudHJ5KSkge1xuICAgIGlzc3Vlcy5wdXNoKHsgcGF0aCwgbWVzc2FnZTogJ0NvbnRyb2wgY29uc3RydWN0IG11c3QgYmUgYW4gb2JqZWN0LicgfSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHJlY29yZCA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChlbnRyeSk7XG4gIHJlcXVpcmVTdHJpbmcocmVjb3JkLmNvbnN0cnVjdElkLCBgJHtwYXRofS5jb25zdHJ1Y3RJZGAsICdjb25zdHJ1Y3RJZCcsIGlzc3Vlcyk7XG4gIGlmICghQ09OVFJPTF9DT05TVFJVQ1RfS0lORFMuaW5jbHVkZXMoU3RyaW5nKHJlY29yZC5raW5kKSkpIHtcbiAgICBpc3N1ZXMucHVzaCh7XG4gICAgICBwYXRoOiBgJHtwYXRofS5raW5kYCxcbiAgICAgIG1lc3NhZ2U6IGBVbmtub3duIGNvbnRyb2wgY29uc3RydWN0IGtpbmQgXCIke1N0cmluZyhyZWNvcmQua2luZCl9XCIuYCxcbiAgICB9KTtcbiAgfVxuICBpZiAocmVjb3JkLnBhcmVudElkICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIHJlY29yZC5wYXJlbnRJZCAhPT0gJ3N0cmluZycpIHtcbiAgICBpc3N1ZXMucHVzaCh7IHBhdGg6IGAke3BhdGh9LnBhcmVudElkYCwgbWVzc2FnZTogJ3BhcmVudElkIG11c3QgYmUgYSBzdHJpbmcgd2hlbiBwcmVzZW50LicgfSk7XG4gIH1cbiAgaWYgKCFBcnJheS5pc0FycmF5KHJlY29yZC5jaGlsZHJlbikpIHtcbiAgICBpc3N1ZXMucHVzaCh7IHBhdGg6IGAke3BhdGh9LmNoaWxkcmVuYCwgbWVzc2FnZTogJ2NoaWxkcmVuIG11c3QgYmUgYW4gYXJyYXkuJyB9KTtcbiAgfSBlbHNlIHtcbiAgICByZWNvcmQuY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQsIGluZGV4KSA9PiB7XG4gICAgICBpZiAodHlwZW9mIGNoaWxkICE9PSAnc3RyaW5nJykge1xuICAgICAgICBpc3N1ZXMucHVzaCh7XG4gICAgICAgICAgcGF0aDogYCR7cGF0aH0uY2hpbGRyZW5bJHtpbmRleH1dYCxcbiAgICAgICAgICBtZXNzYWdlOiAnY2hpbGQgY29uc3RydWN0IGlkcyBtdXN0IGJlIHN0cmluZ3MuJyxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgaWYgKHJlY29yZC5zeW1ib2xJZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKHR5cGVvZiByZWNvcmQuc3ltYm9sSWQgIT09ICdzdHJpbmcnIHx8ICFzeW1ib2xCeUlkLmhhcyhyZWNvcmQuc3ltYm9sSWQpKSB7XG4gICAgICBpc3N1ZXMucHVzaCh7XG4gICAgICAgIHBhdGg6IGAke3BhdGh9LnN5bWJvbElkYCxcbiAgICAgICAgbWVzc2FnZTogYHN5bWJvbElkIFwiJHtTdHJpbmcocmVjb3JkLnN5bWJvbElkKX1cIiBpcyBub3QgYSBkZWNsYXJlZCBzeW1ib2wuYCxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBpZiAocmVjb3JkLmNvbmRpdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgdmFsaWRhdGVSYW5nZShyZWNvcmQuY29uZGl0aW9uLCBgJHtwYXRofS5jb25kaXRpb25gLCBmaWxlQnlJZCwgaXNzdWVzKTtcbiAgfVxuICB2YWxpZGF0ZVJhbmdlKHJlY29yZC5zb3VyY2VSYW5nZSwgYCR7cGF0aH0uc291cmNlUmFuZ2VgLCBmaWxlQnlJZCwgaXNzdWVzKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+W119IGNvbnN0cnVjdHNcbiAqIEBwYXJhbSB7TWFwPHN0cmluZywgUmVjb3JkPHN0cmluZywgdW5rbm93bj4+fSBjb25zdHJ1Y3RCeUlkXG4gKiBAcmV0dXJucyB7QXJyYXk8e2lkOiBzdHJpbmcsIGlzc3VlOiBWYWxpZGF0aW9uSXNzdWV9Pn1cbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVDb25zdHJ1Y3RMaW5rcyhjb25zdHJ1Y3RzLCBjb25zdHJ1Y3RCeUlkKSB7XG4gIC8qKiBAdHlwZSB7QXJyYXk8e2lkOiBzdHJpbmcsIGlzc3VlOiBWYWxpZGF0aW9uSXNzdWV9Pn0gKi9cbiAgY29uc3QgcHJvYmxlbXMgPSBbXTtcbiAgZm9yIChjb25zdCBbaW5kZXgsIGNvbnN0cnVjdF0gb2YgY29uc3RydWN0cy5lbnRyaWVzKCkpIHtcbiAgICBjb25zdCBpZCA9IFN0cmluZyhjb25zdHJ1Y3QuY29uc3RydWN0SWQpO1xuICAgIGlmICh0eXBlb2YgY29uc3RydWN0LnBhcmVudElkID09PSAnc3RyaW5nJyAmJiAhY29uc3RydWN0QnlJZC5oYXMoY29uc3RydWN0LnBhcmVudElkKSkge1xuICAgICAgcHJvYmxlbXMucHVzaCh7XG4gICAgICAgIGlkLFxuICAgICAgICBpc3N1ZToge1xuICAgICAgICAgIHBhdGg6IGBjb250cm9sQ29uc3RydWN0c1ske2luZGV4fV0ucGFyZW50SWRgLFxuICAgICAgICAgIG1lc3NhZ2U6IGBwYXJlbnRJZCBcIiR7Y29uc3RydWN0LnBhcmVudElkfVwiIGlzIG5vdCBhIGRlY2xhcmVkIGNvbnN0cnVjdC5gLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KGNvbnN0cnVjdC5jaGlsZHJlbikpIHtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgY29uc3RydWN0LmNoaWxkcmVuKSB7XG4gICAgICAgIGlmICghY29uc3RydWN0QnlJZC5oYXMoY2hpbGQpKSB7XG4gICAgICAgICAgcHJvYmxlbXMucHVzaCh7XG4gICAgICAgICAgICBpZCxcbiAgICAgICAgICAgIGlzc3VlOiB7XG4gICAgICAgICAgICAgIHBhdGg6IGBjb250cm9sQ29uc3RydWN0c1ske2luZGV4fV0uY2hpbGRyZW5gLFxuICAgICAgICAgICAgICBtZXNzYWdlOiBgY2hpbGQgXCIke1N0cmluZyhjaGlsZCl9XCIgaXMgbm90IGEgZGVjbGFyZWQgY29uc3RydWN0LmAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgc3RhdGUgPSBuZXcgTWFwKCk7XG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gaWRcbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuICBmdW5jdGlvbiBoYXNDeWNsZShpZCkge1xuICAgIGlmIChzdGF0ZS5nZXQoaWQpID09PSAnZG9uZScpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHN0YXRlLmdldChpZCkgPT09ICd2aXNpdGluZycpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBzdGF0ZS5zZXQoaWQsICd2aXNpdGluZycpO1xuICAgIGNvbnN0IGNvbnN0cnVjdCA9IGNvbnN0cnVjdEJ5SWQuZ2V0KGlkKTtcbiAgICBjb25zdCBjaGlsZHJlbiA9IGNvbnN0cnVjdCAmJiBBcnJheS5pc0FycmF5KGNvbnN0cnVjdC5jaGlsZHJlbikgPyBjb25zdHJ1Y3QuY2hpbGRyZW4gOiBbXTtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGNoaWxkcmVuKSB7XG4gICAgICBpZiAoY29uc3RydWN0QnlJZC5oYXMoY2hpbGQpICYmIGhhc0N5Y2xlKGNoaWxkKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgc3RhdGUuc2V0KGlkLCAnZG9uZScpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGZvciAoY29uc3QgY29uc3RydWN0IG9mIGNvbnN0cnVjdHMpIHtcbiAgICBjb25zdCBpZCA9IFN0cmluZyhjb25zdHJ1Y3QuY29uc3RydWN0SWQpO1xuICAgIGlmIChoYXNDeWNsZShpZCkpIHtcbiAgICAgIHByb2JsZW1zLnB1c2goe1xuICAgICAgICBpZCxcbiAgICAgICAgaXNzdWU6IHtcbiAgICAgICAgICBwYXRoOiAnY29udHJvbENvbnN0cnVjdHMnLFxuICAgICAgICAgIG1lc3NhZ2U6IGBDeWNsaWMgY2hpbGRyZW4gY2hhaW4gZGV0ZWN0ZWQgYXQgXCIke2lkfVwiLmAsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcHJvYmxlbXM7XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSBlbnRyeVxuICogQHBhcmFtIHtzdHJpbmd9IHBhdGhcbiAqIEBwYXJhbSB7TWFwPHN0cmluZywgUmVjb3JkPHN0cmluZywgdW5rbm93bj4+fSBmaWxlQnlJZFxuICogQHBhcmFtIHtNYXA8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj59IHN5bWJvbEJ5SWRcbiAqIEBwYXJhbSB7VmFsaWRhdGlvbklzc3VlW119IGlzc3Vlc1xuICovXG5mdW5jdGlvbiB2YWxpZGF0ZURhdGFGYWN0KGVudHJ5LCBwYXRoLCBmaWxlQnlJZCwgc3ltYm9sQnlJZCwgaXNzdWVzKSB7XG4gIGlmICghaXNQbGFpbk9iamVjdChlbnRyeSkpIHtcbiAgICBpc3N1ZXMucHVzaCh7IHBhdGgsIG1lc3NhZ2U6ICdEYXRhIGZhY3QgbXVzdCBiZSBhbiBvYmplY3QuJyB9KTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgcmVjb3JkID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKGVudHJ5KTtcbiAgcmVxdWlyZVN0cmluZyhyZWNvcmQuZmFjdElkLCBgJHtwYXRofS5mYWN0SWRgLCAnZmFjdElkJywgaXNzdWVzKTtcbiAgaWYgKCFEQVRBX0ZBQ1RfS0lORFMuaW5jbHVkZXMoU3RyaW5nKHJlY29yZC5raW5kKSkpIHtcbiAgICBpc3N1ZXMucHVzaCh7XG4gICAgICBwYXRoOiBgJHtwYXRofS5raW5kYCxcbiAgICAgIG1lc3NhZ2U6IGBVbmtub3duIGRhdGEgZmFjdCBraW5kIFwiJHtTdHJpbmcocmVjb3JkLmtpbmQpfVwiLmAsXG4gICAgfSk7XG4gIH1cbiAgaWYgKHR5cGVvZiByZWNvcmQuc3ltYm9sSWQgIT09ICdzdHJpbmcnIHx8ICFzeW1ib2xCeUlkLmhhcyhyZWNvcmQuc3ltYm9sSWQpKSB7XG4gICAgaXNzdWVzLnB1c2goe1xuICAgICAgcGF0aDogYCR7cGF0aH0uc3ltYm9sSWRgLFxuICAgICAgbWVzc2FnZTogYHN5bWJvbElkIFwiJHtTdHJpbmcocmVjb3JkLnN5bWJvbElkKX1cIiBpcyBub3QgYSBkZWNsYXJlZCBzeW1ib2wuYCxcbiAgICB9KTtcbiAgfVxuICB2YWxpZGF0ZVJhbmdlKHJlY29yZC5hdCwgYCR7cGF0aH0uYXRgLCBmaWxlQnlJZCwgaXNzdWVzKTtcbiAgaWYgKHJlY29yZC5yZWxhdGVkU3ltYm9sSWQgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh0eXBlb2YgcmVjb3JkLnJlbGF0ZWRTeW1ib2xJZCAhPT0gJ3N0cmluZycgfHwgIXN5bWJvbEJ5SWQuaGFzKHJlY29yZC5yZWxhdGVkU3ltYm9sSWQpKSB7XG4gICAgICBpc3N1ZXMucHVzaCh7XG4gICAgICAgIHBhdGg6IGAke3BhdGh9LnJlbGF0ZWRTeW1ib2xJZGAsXG4gICAgICAgIG1lc3NhZ2U6IGByZWxhdGVkU3ltYm9sSWQgXCIke1N0cmluZyhyZWNvcmQucmVsYXRlZFN5bWJvbElkKX1cIiBpcyBub3QgYSBkZWNsYXJlZCBzeW1ib2wuYCxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBjb25zdCBzdGF0dXMgPSBTdHJpbmcocmVjb3JkLnN0YXR1cyk7XG4gIGlmICghUkVTT0xVVElPTl9TVEFUVVNFUy5pbmNsdWRlcyhzdGF0dXMpKSB7XG4gICAgaXNzdWVzLnB1c2goe1xuICAgICAgcGF0aDogYCR7cGF0aH0uc3RhdHVzYCxcbiAgICAgIG1lc3NhZ2U6IGBzdGF0dXMgbXVzdCBiZSBvbmUgb2YgJHtSRVNPTFVUSU9OX1NUQVRVU0VTLmpvaW4oJywgJyl9LmAsXG4gICAgfSk7XG4gIH0gZWxzZSBpZiAoc3RhdHVzICE9PSAncmVzb2x2ZWQnKSB7XG4gICAgaWYgKHR5cGVvZiByZWNvcmQucmVhc29uQ29kZSAhPT0gJ3N0cmluZycgfHwgIWlzUmVhc29uQ29kZShyZWNvcmQucmVhc29uQ29kZSkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgICAgcGF0aDogYCR7cGF0aH0ucmVhc29uQ29kZWAsXG4gICAgICAgIG1lc3NhZ2U6IGBBIFwiJHtzdGF0dXN9XCIgZGF0YSBmYWN0IG11c3QgY2FycnkgYSBrbm93biByZWFzb25Db2RlLmAsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IGVudHJ5XG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aFxuICogQHBhcmFtIHtNYXA8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj59IGZpbGVCeUlkXG4gKiBAcGFyYW0ge1NldDxzdHJpbmc+fSBrbm93bklkc1xuICogQHBhcmFtIHtWYWxpZGF0aW9uSXNzdWVbXX0gaXNzdWVzXG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlRGlhZ25vc3RpYyhlbnRyeSwgcGF0aCwgZmlsZUJ5SWQsIGtub3duSWRzLCBpc3N1ZXMpIHtcbiAgaWYgKCFpc1BsYWluT2JqZWN0KGVudHJ5KSkge1xuICAgIGlzc3Vlcy5wdXNoKHsgcGF0aCwgbWVzc2FnZTogJ0RpYWdub3N0aWMgbXVzdCBiZSBhbiBvYmplY3QuJyB9KTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgcmVjb3JkID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKGVudHJ5KTtcbiAgaWYgKCFESUFHTk9TVElDX1NFVkVSSVRJRVMuaW5jbHVkZXMoU3RyaW5nKHJlY29yZC5zZXZlcml0eSkpKSB7XG4gICAgaXNzdWVzLnB1c2goe1xuICAgICAgcGF0aDogYCR7cGF0aH0uc2V2ZXJpdHlgLFxuICAgICAgbWVzc2FnZTogYHNldmVyaXR5IG11c3QgYmUgb25lIG9mICR7RElBR05PU1RJQ19TRVZFUklUSUVTLmpvaW4oJywgJyl9LmAsXG4gICAgfSk7XG4gIH1cbiAgcmVxdWlyZVN0cmluZyhyZWNvcmQuY29kZSwgYCR7cGF0aH0uY29kZWAsICdjb2RlJywgaXNzdWVzKTtcbiAgcmVxdWlyZVN0cmluZyhyZWNvcmQubWVzc2FnZSwgYCR7cGF0aH0ubWVzc2FnZWAsICdtZXNzYWdlJywgaXNzdWVzKTtcbiAgaWYgKHJlY29yZC5zb3VyY2VSYW5nZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgdmFsaWRhdGVSYW5nZShyZWNvcmQuc291cmNlUmFuZ2UsIGAke3BhdGh9LnNvdXJjZVJhbmdlYCwgZmlsZUJ5SWQsIGlzc3Vlcyk7XG4gIH1cbiAgaWYgKHJlY29yZC5hZmZlY3RzICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkocmVjb3JkLmFmZmVjdHMpKSB7XG4gICAgICBpc3N1ZXMucHVzaCh7IHBhdGg6IGAke3BhdGh9LmFmZmVjdHNgLCBtZXNzYWdlOiAnYWZmZWN0cyBtdXN0IGJlIGFuIGFycmF5LicgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlY29yZC5hZmZlY3RzLmZvckVhY2goKGlkLCBpbmRleCkgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGlkICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgICAgICAgIHBhdGg6IGAke3BhdGh9LmFmZmVjdHNbJHtpbmRleH1dYCxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdhZmZlY3RzIGVudHJpZXMgbXVzdCBiZSBzdHJpbmdzLicsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgKGlkLnN0YXJ0c1dpdGgoJ3N5bWJvbDonKSB8fCBpZC5zdGFydHNXaXRoKCdyZWw6JykgfHwgaWQuc3RhcnRzV2l0aCgnZmlsZTonKSkgJiZcbiAgICAgICAgICAha25vd25JZHMuaGFzKGlkKVxuICAgICAgICApIHtcbiAgICAgICAgICBpc3N1ZXMucHVzaCh7XG4gICAgICAgICAgICBwYXRoOiBgJHtwYXRofS5hZmZlY3RzWyR7aW5kZXh9XWAsXG4gICAgICAgICAgICBtZXNzYWdlOiBgYWZmZWN0cyByZWZlcmVuY2VzIHVua25vd24gaWQgXCIke2lkfVwiLmAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gcmFuZ2VcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoXG4gKiBAcGFyYW0ge01hcDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIHVua25vd24+PiB8IG51bGx9IGZpbGVCeUlkXG4gKiBAcGFyYW0ge1ZhbGlkYXRpb25Jc3N1ZVtdfSBpc3N1ZXNcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVSYW5nZShyYW5nZSwgcGF0aCwgZmlsZUJ5SWQsIGlzc3Vlcykge1xuICBjb25zdCBzaGFwZUlzc3VlcyA9IHJhbmdlU2hhcGVJc3N1ZXMocmFuZ2UpO1xuICBjb25zdCBmaWVsZHMgPSBbJ2ZpbGVJZCcsICdzdGFydExpbmUnLCAnc3RhcnRDb2x1bW4nLCAnZW5kTGluZScsICdlbmRDb2x1bW4nXTtcbiAgZm9yIChjb25zdCBtZXNzYWdlIG9mIHNoYXBlSXNzdWVzKSB7XG4gICAgY29uc3QgZmllbGQgPSBmaWVsZHMuZmluZCgoY2FuZGlkYXRlKSA9PiBtZXNzYWdlLnN0YXJ0c1dpdGgoY2FuZGlkYXRlKSk7XG4gICAgaXNzdWVzLnB1c2goeyBwYXRoOiBmaWVsZCA/IGAke3BhdGh9LiR7ZmllbGR9YCA6IHBhdGgsIG1lc3NhZ2UgfSk7XG4gIH1cbiAgaWYgKHNoYXBlSXNzdWVzLmxlbmd0aCA+IDAgfHwgIWlzUGxhaW5PYmplY3QocmFuZ2UpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHJlY29yZCA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChyYW5nZSk7XG4gIGlmIChmaWxlQnlJZCkge1xuICAgIGlmICghZmlsZUJ5SWQuaGFzKHJlY29yZC5maWxlSWQpKSB7XG4gICAgICBpc3N1ZXMucHVzaCh7XG4gICAgICAgIHBhdGg6IGAke3BhdGh9LmZpbGVJZGAsXG4gICAgICAgIG1lc3NhZ2U6IGBVbmtub3duIGZpbGVJZCBcIiR7U3RyaW5nKHJlY29yZC5maWxlSWQpfVwiLmAsXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZmlsZSA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChmaWxlQnlJZC5nZXQocmVjb3JkLmZpbGVJZCkpO1xuICAgICAgaWYgKE51bWJlci5pc0ludGVnZXIocmVjb3JkLmVuZExpbmUpICYmIE51bWJlcihyZWNvcmQuZW5kTGluZSkgPj0gTnVtYmVyKGZpbGUubGluZUNvdW50KSkge1xuICAgICAgICBpc3N1ZXMucHVzaCh7XG4gICAgICAgICAgcGF0aDogYCR7cGF0aH0uZW5kTGluZWAsXG4gICAgICAgICAgbWVzc2FnZTogYGVuZExpbmUgJHtTdHJpbmcocmVjb3JkLmVuZExpbmUpfSBleGNlZWRzIGxpbmVDb3VudCAke1N0cmluZyhmaWxlLmxpbmVDb3VudCl9LmAsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKFxuICAgICAgICBOdW1iZXIuaXNJbnRlZ2VyKHJlY29yZC5zdGFydExpbmUpICYmXG4gICAgICAgIE51bWJlcihyZWNvcmQuc3RhcnRMaW5lKSA+PSBOdW1iZXIoZmlsZS5saW5lQ291bnQpXG4gICAgICApIHtcbiAgICAgICAgaXNzdWVzLnB1c2goe1xuICAgICAgICAgIHBhdGg6IGAke3BhdGh9LnN0YXJ0TGluZWAsXG4gICAgICAgICAgbWVzc2FnZTogYHN0YXJ0TGluZSAke1N0cmluZyhcbiAgICAgICAgICAgIHJlY29yZC5zdGFydExpbmUsXG4gICAgICAgICAgKX0gZXhjZWVkcyBsaW5lQ291bnQgJHtTdHJpbmcoZmlsZS5saW5lQ291bnQpfS5gLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZm9yIChjb25zdCBmaWVsZCBvZiBbJ3N0YXJ0T2Zmc2V0JywgJ2VuZE9mZnNldCddKSB7XG4gICAgaWYgKHJlY29yZFtmaWVsZF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKHJlY29yZFtmaWVsZF0pIHx8IE51bWJlcihyZWNvcmRbZmllbGRdKSA8IDApIHtcbiAgICAgICAgaXNzdWVzLnB1c2goe1xuICAgICAgICAgIHBhdGg6IGAke3BhdGh9LiR7ZmllbGR9YCxcbiAgICAgICAgICBtZXNzYWdlOiBgJHtmaWVsZH0gbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyLmAsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoXG4gKiBAcGFyYW0ge3N0cmluZ30gbGFiZWxcbiAqIEBwYXJhbSB7VmFsaWRhdGlvbklzc3VlW119IGlzc3Vlc1xuICovXG5mdW5jdGlvbiByZXF1aXJlU3RyaW5nKHZhbHVlLCBwYXRoLCBsYWJlbCwgaXNzdWVzKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnIHx8IHZhbHVlLmxlbmd0aCA9PT0gMCkge1xuICAgIGlzc3Vlcy5wdXNoKHsgcGF0aCwgbWVzc2FnZTogYCR7bGFiZWx9IG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nLmAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcmV0dXJucyB7c3RyaW5nW119XG4gKi9cbmZ1bmN0aW9uIHdvcmtzcGFjZVBhdGhJc3N1ZXModmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycgfHwgdmFsdWUubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIFsncGF0aCBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZy4nXTtcbiAgfVxuICAvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuICBjb25zdCBpc3N1ZXMgPSBbXTtcbiAgaWYgKHZhbHVlLmxlbmd0aCA+IENTUl9MSU1JVFMubWF4UGF0aExlbmd0aCkge1xuICAgIGlzc3Vlcy5wdXNoKGBwYXRoIGV4Y2VlZHMgJHtDU1JfTElNSVRTLm1heFBhdGhMZW5ndGh9IGNvZGUgdW5pdHMuYCk7XG4gIH1cbiAgaWYgKHZhbHVlLmluY2x1ZGVzKCdcXFxcJykpIHtcbiAgICBpc3N1ZXMucHVzaCgncGF0aCBtdXN0IHVzZSBmb3J3YXJkIHNsYXNoZXMuJyk7XG4gIH1cbiAgaWYgKHZhbHVlLnN0YXJ0c1dpdGgoJy8nKSB8fCAvXltBLVphLXpdOi8udGVzdCh2YWx1ZSkpIHtcbiAgICBpc3N1ZXMucHVzaCgncGF0aCBtdXN0IGJlIHdvcmtzcGFjZS1yZWxhdGl2ZSwgbm90IGFic29sdXRlLicpO1xuICB9XG4gIGNvbnN0IHNlZ21lbnRzID0gdmFsdWUuc3BsaXQoJy8nKTtcbiAgaWYgKHNlZ21lbnRzLmluY2x1ZGVzKCcuLicpKSB7XG4gICAgaXNzdWVzLnB1c2goJ3BhdGggbXVzdCBub3QgY29udGFpbiBcIi4uXCIgc2VnbWVudHMuJyk7XG4gIH1cbiAgaWYgKHNlZ21lbnRzLmluY2x1ZGVzKCcnKSkge1xuICAgIGlzc3Vlcy5wdXNoKCdwYXRoIG11c3Qgbm90IGNvbnRhaW4gZW1wdHkgc2VnbWVudHMuJyk7XG4gIH1cbiAgaWYgKGNvbnRhaW5zQ29udHJvbENoYXJhY3RlcnModmFsdWUpKSB7XG4gICAgaXNzdWVzLnB1c2goJ3BhdGggbXVzdCBub3QgY29udGFpbiBjb250cm9sIGNoYXJhY3RlcnMuJyk7XG4gIH1cbiAgcmV0dXJuIGlzc3Vlcztcbn1cblxuLyoqXG4gKiBDb250cm9sIGNoYXJhY3RlcnMgYXJlIGNoZWNrZWQgYnkgY29kZSB1bml0IHNvIHRoZSBydWxlIHN0YXlzIHJlYWRhYmxlIGFuZFxuICogdGhlIHJlZ2V4IGxpbnRlciBkb2VzIG5vdCBoYXZlIHRvIHJlYXNvbiBhYm91dCBhbiBlc2NhcGUgcmFuZ2UuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gY29udGFpbnNDb250cm9sQ2hhcmFjdGVycyh2YWx1ZSkge1xuICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgdmFsdWUubGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgaWYgKHZhbHVlLmNoYXJDb2RlQXQoaW5kZXgpIDwgMzIpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogQHBhcmFtIHt7Y2FuZGlkYXRlOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgY29tcGxldGVuZXNzOiBpbXBvcnQoJy4vZW50aXRpZXMuanMnKS5BbmFseXNpc1J1blsnY29tcGxldGVuZXNzJ10sIGZpbGVzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdLCBzeW1ib2xzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdLCByZWxhdGlvbnNoaXBzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdLCBjb250cm9sQ29uc3RydWN0czogUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXSwgZGF0YUZhY3RzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPltdLCBkaWFnbm9zdGljczogUmVjb3JkPHN0cmluZywgdW5rbm93bj5bXX19IGlucHV0XG4gKiBAcmV0dXJucyB7aW1wb3J0KCcuL2VudGl0aWVzLmpzJykuQW5hbHlzaXNSdW59XG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZVJ1bihpbnB1dCkge1xuICBjb25zdCBjYW5kaWRhdGUgPSBpbnB1dC5jYW5kaWRhdGU7XG4gIC8qKiBAdHlwZSB7aW1wb3J0KCcuL2VudGl0aWVzLmpzJykuQW5hbHlzaXNSdW59ICovXG4gIGNvbnN0IHJ1biA9IHtcbiAgICBydW5JZDogU3RyaW5nKGNhbmRpZGF0ZS5ydW5JZCksXG4gICAgYWRhcHRlcklkOiBTdHJpbmcoY2FuZGlkYXRlLmFkYXB0ZXJJZCksXG4gICAgYWRhcHRlclZlcnNpb246IFN0cmluZyhjYW5kaWRhdGUuYWRhcHRlclZlcnNpb24pLFxuICAgIGxhbmd1YWdlOiBTdHJpbmcoY2FuZGlkYXRlLmxhbmd1YWdlKSxcbiAgICBjc3JWZXJzaW9uOiBTdHJpbmcoY2FuZGlkYXRlLmNzclZlcnNpb24gPz8gQ1NSX1ZFUlNJT04pLFxuICAgIHNjb3BlOiBub3JtYWxpemVTY29wZShjYW5kaWRhdGUuc2NvcGUpLFxuICAgIGNvbXBsZXRlbmVzczogaW5wdXQuY29tcGxldGVuZXNzLFxuICAgIGZpbGVzOiBpbnB1dC5maWxlcy5tYXAobm9ybWFsaXplRmlsZSksXG4gICAgc3ltYm9sczogaW5wdXQuc3ltYm9scy5tYXAobm9ybWFsaXplU3ltYm9sKSxcbiAgICByZWxhdGlvbnNoaXBzOiBpbnB1dC5yZWxhdGlvbnNoaXBzLm1hcChub3JtYWxpemVSZWxhdGlvbnNoaXApLFxuICAgIGNvbnRyb2xDb25zdHJ1Y3RzOiBpbnB1dC5jb250cm9sQ29uc3RydWN0cy5tYXAobm9ybWFsaXplQ29uc3RydWN0KSxcbiAgICBkYXRhRmFjdHM6IGlucHV0LmRhdGFGYWN0cy5tYXAobm9ybWFsaXplRGF0YUZhY3QpLFxuICAgIGRpYWdub3N0aWNzOiBpbnB1dC5kaWFnbm9zdGljcy5tYXAobm9ybWFsaXplRGlhZ25vc3RpYyksXG4gIH07XG4gIGlmICh0eXBlb2YgY2FuZGlkYXRlLnN0YXJ0ZWRBdCA9PT0gJ3N0cmluZycpIHtcbiAgICBydW4uc3RhcnRlZEF0ID0gY2FuZGlkYXRlLnN0YXJ0ZWRBdDtcbiAgfVxuICBpZiAoTnVtYmVyLmlzRmluaXRlKGNhbmRpZGF0ZS5kdXJhdGlvbk1zKSkge1xuICAgIHJ1bi5kdXJhdGlvbk1zID0gTnVtYmVyKGNhbmRpZGF0ZS5kdXJhdGlvbk1zKTtcbiAgfVxuICBpZiAoaXNQbGFpbk9iamVjdChjYW5kaWRhdGUuZXh0ZW5zaW9ucykpIHtcbiAgICBydW4uZXh0ZW5zaW9ucyA9IGNsb25lVmFsdWUoY2FuZGlkYXRlLmV4dGVuc2lvbnMpO1xuICB9XG4gIHJldHVybiBydW47XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSBzY29wZVxuICogQHJldHVybnMge2ltcG9ydCgnLi9lbnRpdGllcy5qcycpLkFuYWx5c2lzU2NvcGV9XG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZVNjb3BlKHNjb3BlKSB7XG4gIGlmICghaXNQbGFpbk9iamVjdChzY29wZSkpIHtcbiAgICByZXR1cm4geyBraW5kOiAnd29ya3NwYWNlJyB9O1xuICB9XG4gIC8qKiBAdHlwZSB7aW1wb3J0KCcuL2VudGl0aWVzLmpzJykuQW5hbHlzaXNTY29wZX0gKi9cbiAgY29uc3Qgbm9ybWFsaXplZCA9IHsga2luZDogc2NvcGUua2luZCA9PT0gJ2ZpbGUnID8gJ2ZpbGUnIDogJ3dvcmtzcGFjZScgfTtcbiAgaWYgKHR5cGVvZiBzY29wZS5wYXRoID09PSAnc3RyaW5nJyAmJiBzY29wZS5wYXRoLmxlbmd0aCA+IDApIHtcbiAgICBub3JtYWxpemVkLnBhdGggPSBzY29wZS5wYXRoO1xuICB9XG4gIHJldHVybiBub3JtYWxpemVkO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IHJlY29yZFxuICogQHJldHVybnMge2ltcG9ydCgnLi9lbnRpdGllcy5qcycpLkZpbGVSZWNvcmR9XG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZUZpbGUocmVjb3JkKSB7XG4gIC8qKiBAdHlwZSB7aW1wb3J0KCcuL2VudGl0aWVzLmpzJykuRmlsZVJlY29yZH0gKi9cbiAgY29uc3QgZmlsZSA9IHtcbiAgICBmaWxlSWQ6IFN0cmluZyhyZWNvcmQuZmlsZUlkKSxcbiAgICBwYXRoOiBTdHJpbmcocmVjb3JkLnBhdGgpLFxuICAgIGxhbmd1YWdlOiBTdHJpbmcocmVjb3JkLmxhbmd1YWdlKSxcbiAgICBjb250ZW50SGFzaDogU3RyaW5nKHJlY29yZC5jb250ZW50SGFzaCksXG4gICAgc2l6ZUJ5dGVzOiBOdW1iZXIocmVjb3JkLnNpemVCeXRlcyksXG4gICAgbGluZUNvdW50OiBOdW1iZXIocmVjb3JkLmxpbmVDb3VudCksXG4gICAgZ2VuZXJhdGVkOiByZWNvcmQuZ2VuZXJhdGVkID09PSB0cnVlLFxuICB9O1xuICBpZiAoaXNQbGFpbk9iamVjdChyZWNvcmQuZXh0ZW5zaW9ucykpIHtcbiAgICBmaWxlLmV4dGVuc2lvbnMgPSBjbG9uZVZhbHVlKHJlY29yZC5leHRlbnNpb25zKTtcbiAgfVxuICByZXR1cm4gZmlsZTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSByZWNvcmRcbiAqIEByZXR1cm5zIHtpbXBvcnQoJy4vZW50aXRpZXMuanMnKS5TeW1ib2xSZWNvcmR9XG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZVN5bWJvbChyZWNvcmQpIHtcbiAgLyoqIEB0eXBlIHtpbXBvcnQoJy4vZW50aXRpZXMuanMnKS5TeW1ib2xSZWNvcmR9ICovXG4gIGNvbnN0IHN5bWJvbCA9IHtcbiAgICBzeW1ib2xJZDogU3RyaW5nKHJlY29yZC5zeW1ib2xJZCksXG4gICAga2luZDogU3RyaW5nKHJlY29yZC5raW5kKSxcbiAgICBuYW1lOiB0eXBlb2YgcmVjb3JkLm5hbWUgPT09ICdzdHJpbmcnID8gcmVjb3JkLm5hbWUgOiAnJyxcbiAgICBxdWFsaWZpZWROYW1lOiBTdHJpbmcocmVjb3JkLnF1YWxpZmllZE5hbWUpLFxuICAgIGxhbmd1YWdlOiBTdHJpbmcocmVjb3JkLmxhbmd1YWdlKSxcbiAgICBkZWNsYXJhdGlvbjogbm9ybWFsaXplUmFuZ2UocmVjb3JkLmRlY2xhcmF0aW9uKSxcbiAgfTtcbiAgaWYgKHR5cGVvZiByZWNvcmQuc2lnbmF0dXJlID09PSAnc3RyaW5nJykge1xuICAgIHN5bWJvbC5zaWduYXR1cmUgPSByZWNvcmQuc2lnbmF0dXJlO1xuICB9XG4gIGlmICh0eXBlb2YgcmVjb3JkLnBhcmVudElkID09PSAnc3RyaW5nJyAmJiByZWNvcmQucGFyZW50SWQubGVuZ3RoID4gMCkge1xuICAgIHN5bWJvbC5wYXJlbnRJZCA9IHJlY29yZC5wYXJlbnRJZDtcbiAgfVxuICBpZiAodHlwZW9mIHJlY29yZC52aXNpYmlsaXR5ID09PSAnc3RyaW5nJykge1xuICAgIHN5bWJvbC52aXNpYmlsaXR5ID0gLyoqIEB0eXBlIHtpbXBvcnQoJy4vZW50aXRpZXMuanMnKS5TeW1ib2xSZWNvcmRbJ3Zpc2liaWxpdHknXX0gKi8gKFxuICAgICAgcmVjb3JkLnZpc2liaWxpdHlcbiAgICApO1xuICB9XG4gIGlmICh0eXBlb2YgcmVjb3JkLmRpc2FtYmlndWF0b3IgPT09ICdzdHJpbmcnKSB7XG4gICAgc3ltYm9sLmRpc2FtYmlndWF0b3IgPSByZWNvcmQuZGlzYW1iaWd1YXRvcjtcbiAgfVxuICBpZiAoaXNQbGFpbk9iamVjdChyZWNvcmQuZXh0ZW5zaW9ucykpIHtcbiAgICBzeW1ib2wuZXh0ZW5zaW9ucyA9IGNsb25lVmFsdWUocmVjb3JkLmV4dGVuc2lvbnMpO1xuICB9XG4gIHJldHVybiBzeW1ib2w7XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gcmVjb3JkXG4gKiBAcmV0dXJucyB7aW1wb3J0KCcuL2VudGl0aWVzLmpzJykuUmVsYXRpb25zaGlwfVxuICovXG5mdW5jdGlvbiBub3JtYWxpemVSZWxhdGlvbnNoaXAocmVjb3JkKSB7XG4gIC8qKiBAdHlwZSB7aW1wb3J0KCcuL2VudGl0aWVzLmpzJykuUmVsYXRpb25zaGlwfSAqL1xuICBjb25zdCByZWxhdGlvbnNoaXAgPSB7XG4gICAgcmVsYXRpb25zaGlwSWQ6IFN0cmluZyhyZWNvcmQucmVsYXRpb25zaGlwSWQpLFxuICAgIHR5cGU6IFN0cmluZyhyZWNvcmQudHlwZSksXG4gICAgZnJvbTogU3RyaW5nKHJlY29yZC5mcm9tKSxcbiAgICB0bzogU3RyaW5nKHJlY29yZC50byksXG4gICAgc3RhdHVzOiAvKiogQHR5cGUge2ltcG9ydCgnLi9lbnRpdGllcy5qcycpLlJlbGF0aW9uc2hpcFsnc3RhdHVzJ119ICovIChyZWNvcmQuc3RhdHVzKSxcbiAgICBldmlkZW5jZTogQXJyYXkuaXNBcnJheShyZWNvcmQuZXZpZGVuY2UpXG4gICAgICA/IHJlY29yZC5ldmlkZW5jZS5tYXAoKGV2aWRlbmNlKSA9PlxuICAgICAgICAgIG5vcm1hbGl6ZUV2aWRlbmNlKC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChldmlkZW5jZSkpLFxuICAgICAgICApXG4gICAgICA6IFtdLFxuICB9O1xuICBpZiAodHlwZW9mIHJlY29yZC5yZWFzb25Db2RlID09PSAnc3RyaW5nJykge1xuICAgIHJlbGF0aW9uc2hpcC5yZWFzb25Db2RlID0gcmVjb3JkLnJlYXNvbkNvZGU7XG4gIH1cbiAgaWYgKGlzUGxhaW5PYmplY3QocmVjb3JkLnNpdGUpKSB7XG4gICAgcmVsYXRpb25zaGlwLnNpdGUgPSBub3JtYWxpemVSYW5nZShyZWNvcmQuc2l0ZSk7XG4gIH1cbiAgaWYgKGlzUGxhaW5PYmplY3QocmVjb3JkLmV4dGVuc2lvbnMpKSB7XG4gICAgcmVsYXRpb25zaGlwLmV4dGVuc2lvbnMgPSBjbG9uZVZhbHVlKHJlY29yZC5leHRlbnNpb25zKTtcbiAgfVxuICByZXR1cm4gcmVsYXRpb25zaGlwO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IHJlY29yZFxuICogQHJldHVybnMge2ltcG9ydCgnLi9lbnRpdGllcy5qcycpLkV2aWRlbmNlfVxuICovXG5mdW5jdGlvbiBub3JtYWxpemVFdmlkZW5jZShyZWNvcmQpIHtcbiAgLyoqIEB0eXBlIHtpbXBvcnQoJy4vZW50aXRpZXMuanMnKS5FdmlkZW5jZX0gKi9cbiAgY29uc3QgZXZpZGVuY2UgPSB7XG4gICAga2luZDogLyoqIEB0eXBlIHtpbXBvcnQoJy4vZW50aXRpZXMuanMnKS5FdmlkZW5jZVsna2luZCddfSAqLyAocmVjb3JkLmtpbmQgPz8gJ3NvdXJjZV9yYW5nZScpLFxuICB9O1xuICBpZiAoaXNQbGFpbk9iamVjdChyZWNvcmQucmFuZ2UpKSB7XG4gICAgZXZpZGVuY2UucmFuZ2UgPSBub3JtYWxpemVSYW5nZShyZWNvcmQucmFuZ2UpO1xuICB9XG4gIGZvciAoY29uc3QgZmllbGQgb2YgWydzeW1ib2xJZCcsICdyZWxhdGlvbnNoaXBJZCcsICdkaWFnbm9zdGljQ29kZScsICdub3RlJ10pIHtcbiAgICBpZiAodHlwZW9mIHJlY29yZFtmaWVsZF0gPT09ICdzdHJpbmcnKSB7XG4gICAgICBldmlkZW5jZVtmaWVsZF0gPSByZWNvcmRbZmllbGRdO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZXZpZGVuY2U7XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gcmVjb3JkXG4gKiBAcmV0dXJucyB7aW1wb3J0KCcuL2VudGl0aWVzLmpzJykuQ29udHJvbENvbnN0cnVjdH1cbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplQ29uc3RydWN0KHJlY29yZCkge1xuICAvKiogQHR5cGUge2ltcG9ydCgnLi9lbnRpdGllcy5qcycpLkNvbnRyb2xDb25zdHJ1Y3R9ICovXG4gIGNvbnN0IGNvbnN0cnVjdCA9IHtcbiAgICBjb25zdHJ1Y3RJZDogU3RyaW5nKHJlY29yZC5jb25zdHJ1Y3RJZCksXG4gICAga2luZDogU3RyaW5nKHJlY29yZC5raW5kKSxcbiAgICBjaGlsZHJlbjogQXJyYXkuaXNBcnJheShyZWNvcmQuY2hpbGRyZW4pID8gcmVjb3JkLmNoaWxkcmVuLm1hcChTdHJpbmcpIDogW10sXG4gICAgc291cmNlUmFuZ2U6IG5vcm1hbGl6ZVJhbmdlKHJlY29yZC5zb3VyY2VSYW5nZSksXG4gIH07XG4gIGlmICh0eXBlb2YgcmVjb3JkLnBhcmVudElkID09PSAnc3RyaW5nJyAmJiByZWNvcmQucGFyZW50SWQubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0cnVjdC5wYXJlbnRJZCA9IHJlY29yZC5wYXJlbnRJZDtcbiAgfVxuICBpZiAodHlwZW9mIHJlY29yZC5zeW1ib2xJZCA9PT0gJ3N0cmluZycgJiYgcmVjb3JkLnN5bWJvbElkLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdHJ1Y3Quc3ltYm9sSWQgPSByZWNvcmQuc3ltYm9sSWQ7XG4gIH1cbiAgaWYgKGlzUGxhaW5PYmplY3QocmVjb3JkLmNvbmRpdGlvbikpIHtcbiAgICBjb25zdHJ1Y3QuY29uZGl0aW9uID0gbm9ybWFsaXplUmFuZ2UocmVjb3JkLmNvbmRpdGlvbik7XG4gIH1cbiAgaWYgKGlzUGxhaW5PYmplY3QocmVjb3JkLmV4dGVuc2lvbnMpKSB7XG4gICAgY29uc3RydWN0LmV4dGVuc2lvbnMgPSBjbG9uZVZhbHVlKHJlY29yZC5leHRlbnNpb25zKTtcbiAgfVxuICByZXR1cm4gY29uc3RydWN0O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IHJlY29yZFxuICogQHJldHVybnMge2ltcG9ydCgnLi9lbnRpdGllcy5qcycpLkRhdGFGYWN0fVxuICovXG5mdW5jdGlvbiBub3JtYWxpemVEYXRhRmFjdChyZWNvcmQpIHtcbiAgLyoqIEB0eXBlIHtpbXBvcnQoJy4vZW50aXRpZXMuanMnKS5EYXRhRmFjdH0gKi9cbiAgY29uc3QgZmFjdCA9IHtcbiAgICBmYWN0SWQ6IFN0cmluZyhyZWNvcmQuZmFjdElkKSxcbiAgICBraW5kOiBTdHJpbmcocmVjb3JkLmtpbmQpLFxuICAgIHN5bWJvbElkOiBTdHJpbmcocmVjb3JkLnN5bWJvbElkKSxcbiAgICBhdDogbm9ybWFsaXplUmFuZ2UocmVjb3JkLmF0KSxcbiAgICBzdGF0dXM6IC8qKiBAdHlwZSB7aW1wb3J0KCcuL2VudGl0aWVzLmpzJykuRGF0YUZhY3RbJ3N0YXR1cyddfSAqLyAocmVjb3JkLnN0YXR1cyksXG4gIH07XG4gIGlmICh0eXBlb2YgcmVjb3JkLnJlbGF0ZWRTeW1ib2xJZCA9PT0gJ3N0cmluZycpIHtcbiAgICBmYWN0LnJlbGF0ZWRTeW1ib2xJZCA9IHJlY29yZC5yZWxhdGVkU3ltYm9sSWQ7XG4gIH1cbiAgaWYgKHR5cGVvZiByZWNvcmQucmVhc29uQ29kZSA9PT0gJ3N0cmluZycpIHtcbiAgICBmYWN0LnJlYXNvbkNvZGUgPSByZWNvcmQucmVhc29uQ29kZTtcbiAgfVxuICBpZiAoaXNQbGFpbk9iamVjdChyZWNvcmQuZXh0ZW5zaW9ucykpIHtcbiAgICBmYWN0LmV4dGVuc2lvbnMgPSBjbG9uZVZhbHVlKHJlY29yZC5leHRlbnNpb25zKTtcbiAgfVxuICByZXR1cm4gZmFjdDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSByZWNvcmRcbiAqIEByZXR1cm5zIHtpbXBvcnQoJy4vZW50aXRpZXMuanMnKS5EaWFnbm9zdGljfVxuICovXG5mdW5jdGlvbiBub3JtYWxpemVEaWFnbm9zdGljKHJlY29yZCkge1xuICAvKiogQHR5cGUge2ltcG9ydCgnLi9lbnRpdGllcy5qcycpLkRpYWdub3N0aWN9ICovXG4gIGNvbnN0IGRpYWdub3N0aWMgPSB7XG4gICAgc2V2ZXJpdHk6IC8qKiBAdHlwZSB7aW1wb3J0KCcuL2VudGl0aWVzLmpzJykuRGlhZ25vc3RpY1snc2V2ZXJpdHknXX0gKi8gKHJlY29yZC5zZXZlcml0eSksXG4gICAgY29kZTogU3RyaW5nKHJlY29yZC5jb2RlKSxcbiAgICBtZXNzYWdlOiBTdHJpbmcocmVjb3JkLm1lc3NhZ2UpLFxuICAgIGFmZmVjdHM6IEFycmF5LmlzQXJyYXkocmVjb3JkLmFmZmVjdHMpID8gcmVjb3JkLmFmZmVjdHMubWFwKFN0cmluZykgOiBbXSxcbiAgfTtcbiAgaWYgKGlzUGxhaW5PYmplY3QocmVjb3JkLnNvdXJjZVJhbmdlKSkge1xuICAgIGRpYWdub3N0aWMuc291cmNlUmFuZ2UgPSBub3JtYWxpemVSYW5nZShyZWNvcmQuc291cmNlUmFuZ2UpO1xuICB9XG4gIHJldHVybiBkaWFnbm9zdGljO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IHJlY29yZFxuICogQHJldHVybnMge2ltcG9ydCgnLi9lbnRpdGllcy5qcycpLlNvdXJjZVJhbmdlfVxuICovXG5mdW5jdGlvbiBub3JtYWxpemVSYW5nZShyZWNvcmQpIHtcbiAgLyoqIEB0eXBlIHtpbXBvcnQoJy4vZW50aXRpZXMuanMnKS5Tb3VyY2VSYW5nZX0gKi9cbiAgY29uc3QgcmFuZ2UgPSB7XG4gICAgZmlsZUlkOiBTdHJpbmcocmVjb3JkLmZpbGVJZCksXG4gICAgc3RhcnRMaW5lOiBOdW1iZXIocmVjb3JkLnN0YXJ0TGluZSksXG4gICAgc3RhcnRDb2x1bW46IE51bWJlcihyZWNvcmQuc3RhcnRDb2x1bW4pLFxuICAgIGVuZExpbmU6IE51bWJlcihyZWNvcmQuZW5kTGluZSksXG4gICAgZW5kQ29sdW1uOiBOdW1iZXIocmVjb3JkLmVuZENvbHVtbiksXG4gIH07XG4gIGlmIChOdW1iZXIuaXNJbnRlZ2VyKHJlY29yZC5zdGFydE9mZnNldCkpIHtcbiAgICByYW5nZS5zdGFydE9mZnNldCA9IE51bWJlcihyZWNvcmQuc3RhcnRPZmZzZXQpO1xuICB9XG4gIGlmIChOdW1iZXIuaXNJbnRlZ2VyKHJlY29yZC5lbmRPZmZzZXQpKSB7XG4gICAgcmFuZ2UuZW5kT2Zmc2V0ID0gTnVtYmVyKHJlY29yZC5lbmRPZmZzZXQpO1xuICB9XG4gIHJldHVybiByYW5nZTtcbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtUfSB2YWx1ZVxuICogQHJldHVybnMge1R9XG4gKi9cbmZ1bmN0aW9uIGNsb25lVmFsdWUodmFsdWUpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7VH0gKi8gKHZhbHVlLm1hcCgoZW50cnkpID0+IGNsb25lVmFsdWUoZW50cnkpKSk7XG4gIH1cbiAgaWYgKGlzUGxhaW5PYmplY3QodmFsdWUpKSB7XG4gICAgLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi9cbiAgICBjb25zdCBjb3B5ID0ge307XG4gICAgZm9yIChjb25zdCBba2V5LCBlbnRyeV0gb2YgT2JqZWN0LmVudHJpZXModmFsdWUpKSB7XG4gICAgICBjb3B5W2tleV0gPSBjbG9uZVZhbHVlKGVudHJ5KTtcbiAgICB9XG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7VH0gKi8gKGNvcHkpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cbiIsICIvKipcbiAqIENTUiBlbnRpdHkgZmFjdG9yaWVzLlxuICpcbiAqIEV2ZXJ5IGZhY3RvcnkgaXMgdG90YWw6IGl0IGFjY2VwdHMgYSBwYXJ0aWFsIG9iamVjdCBhbmQgcmV0dXJucyBhIGNvbXBsZXRlLFxuICogSlNPTi1zaGFwZWQgZW50aXR5IHdpdGggZG9jdW1lbnRlZCBkZWZhdWx0cy4gRmFjdG9yaWVzIG5ldmVyIGludmVudCBjZXJ0YWludHk6XG4gKiBhIHJlbGF0aW9uc2hpcCB3aXRob3V0IGEgYHJlYXNvbkNvZGVgIHN0YXlzIHdpdGhvdXQgb25lIHNvIHZhbGlkYXRpb24gcmVqZWN0c1xuICogaXQsIGFuZCBhbiBvbWl0dGVkIGRlY2xhcmF0aW9uIGJlY29tZXMgdGhlIHplcm8gcmFuZ2UgYXQgdGhlIHN0YXJ0IG9mIGFuXG4gKiB1bm5hbWVkIGZpbGUgcmF0aGVyIHRoYW4gYSBwbGF1c2libGUtbG9va2luZyBndWVzcy5cbiAqXG4gKiBWYWxpZGF0aW9uIGxpdmVzIGluIGB2YWxpZGF0ZS5qc2AgYW5kIGlzIHJlLWV4cG9ydGVkIGhlcmUgZm9yIGNhbGxlcnMgdGhhdFxuICogYWxyZWFkeSBpbXBvcnQgdGhlIGVudGl0eSBtb2R1bGUuXG4gKi9cblxuaW1wb3J0IHsgQ1NSX1ZFUlNJT04gfSBmcm9tICcuL3R5cGVzLmpzJztcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBTb3VyY2VSYW5nZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGZpbGVJZFxuICogQHByb3BlcnR5IHtudW1iZXJ9IHN0YXJ0TGluZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IHN0YXJ0Q29sdW1uXG4gKiBAcHJvcGVydHkge251bWJlcn0gZW5kTGluZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IGVuZENvbHVtblxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtzdGFydE9mZnNldF1cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbZW5kT2Zmc2V0XVxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gRmlsZVJlY29yZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGZpbGVJZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IHBhdGhcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBsYW5ndWFnZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGNvbnRlbnRIYXNoXG4gKiBAcHJvcGVydHkge251bWJlcn0gc2l6ZUJ5dGVzXG4gKiBAcHJvcGVydHkge251bWJlcn0gbGluZUNvdW50XG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IGdlbmVyYXRlZFxuICogQHByb3BlcnR5IHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW2V4dGVuc2lvbnNdXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBTeW1ib2xSZWNvcmRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBzeW1ib2xJZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGtpbmRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBuYW1lXG4gKiBAcHJvcGVydHkge3N0cmluZ30gcXVhbGlmaWVkTmFtZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGxhbmd1YWdlXG4gKiBAcHJvcGVydHkge1NvdXJjZVJhbmdlfSBkZWNsYXJhdGlvblxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtzaWduYXR1cmVdXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3BhcmVudElkXVxuICogQHByb3BlcnR5IHsncHVibGljJ3wncHJvdGVjdGVkJ3wncHJpdmF0ZSd8J2ludGVybmFsJ3wncGFja2FnZSd8J2xvY2FsJ3wndW5rbm93bid9IFt2aXNpYmlsaXR5XVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtkaXNhbWJpZ3VhdG9yXVxuICogQHByb3BlcnR5IHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW2V4dGVuc2lvbnNdXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBFdmlkZW5jZVxuICogQHByb3BlcnR5IHsnc291cmNlX3JhbmdlJ3wnc3ltYm9sJ3wncmVsYXRpb25zaGlwJ3wnZGlhZ25vc3RpYyd8J21hY3JvX2V4cGFuc2lvbid8J2ltcG9ydCd8J2hldXJpc3RpYyd9IGtpbmRcbiAqIEBwcm9wZXJ0eSB7U291cmNlUmFuZ2V9IFtyYW5nZV1cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbc3ltYm9sSWRdXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3JlbGF0aW9uc2hpcElkXVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtkaWFnbm9zdGljQ29kZV1cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbbm90ZV1cbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFJlbGF0aW9uc2hpcFxuICogQHByb3BlcnR5IHtzdHJpbmd9IHJlbGF0aW9uc2hpcElkXG4gKiBAcHJvcGVydHkge3N0cmluZ30gdHlwZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGZyb21cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSB0b1xuICogQHByb3BlcnR5IHsncmVzb2x2ZWQnfCdpbmZlcnJlZCd8J3Bvc3NpYmxlJ3wndW5yZXNvbHZlZCd8J3N0YWxlJ30gc3RhdHVzXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3JlYXNvbkNvZGVdXG4gKiBAcHJvcGVydHkge0V2aWRlbmNlW119IGV2aWRlbmNlXG4gKiBAcHJvcGVydHkge1NvdXJjZVJhbmdlfSBbc2l0ZV1cbiAqIEBwcm9wZXJ0eSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IFtleHRlbnNpb25zXVxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gQ29udHJvbENvbnN0cnVjdFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGNvbnN0cnVjdElkXG4gKiBAcHJvcGVydHkge3N0cmluZ30ga2luZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtwYXJlbnRJZF1cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nW119IGNoaWxkcmVuXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3N5bWJvbElkXVxuICogQHByb3BlcnR5IHtTb3VyY2VSYW5nZX0gW2NvbmRpdGlvbl1cbiAqIEBwcm9wZXJ0eSB7U291cmNlUmFuZ2V9IHNvdXJjZVJhbmdlXG4gKiBAcHJvcGVydHkge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBbZXh0ZW5zaW9uc11cbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IERhdGFGYWN0XG4gKiBAcHJvcGVydHkge3N0cmluZ30gZmFjdElkXG4gKiBAcHJvcGVydHkge3N0cmluZ30ga2luZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IHN5bWJvbElkXG4gKiBAcHJvcGVydHkge1NvdXJjZVJhbmdlfSBhdFxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtyZWxhdGVkU3ltYm9sSWRdXG4gKiBAcHJvcGVydHkgeydyZXNvbHZlZCd8J2luZmVycmVkJ3wncG9zc2libGUnfCd1bnJlc29sdmVkJ3wnc3RhbGUnfSBzdGF0dXNcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbcmVhc29uQ29kZV1cbiAqIEBwcm9wZXJ0eSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IFtleHRlbnNpb25zXVxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gRGlhZ25vc3RpY1xuICogQHByb3BlcnR5IHsnaW5mbyd8J3dhcm5pbmcnfCdlcnJvcid9IHNldmVyaXR5XG4gKiBAcHJvcGVydHkge3N0cmluZ30gY29kZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IG1lc3NhZ2VcbiAqIEBwcm9wZXJ0eSB7U291cmNlUmFuZ2V9IFtzb3VyY2VSYW5nZV1cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nW119IGFmZmVjdHNcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEFuYWx5c2lzU2NvcGVcbiAqIEBwcm9wZXJ0eSB7J2ZpbGUnfCd3b3Jrc3BhY2UnfSBraW5kXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3BhdGhdXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBBbmFseXNpc1J1blxuICogQHByb3BlcnR5IHtzdHJpbmd9IHJ1bklkXG4gKiBAcHJvcGVydHkge3N0cmluZ30gYWRhcHRlcklkXG4gKiBAcHJvcGVydHkge3N0cmluZ30gYWRhcHRlclZlcnNpb25cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBsYW5ndWFnZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGNzclZlcnNpb25cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbc3RhcnRlZEF0XVxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtkdXJhdGlvbk1zXVxuICogQHByb3BlcnR5IHtBbmFseXNpc1Njb3BlfSBzY29wZVxuICogQHByb3BlcnR5IHsnZnVsbCd8J3BhcnRpYWwnfCdzeW50YWN0aWNfb25seSd9IGNvbXBsZXRlbmVzc1xuICogQHByb3BlcnR5IHtGaWxlUmVjb3JkW119IGZpbGVzXG4gKiBAcHJvcGVydHkge1N5bWJvbFJlY29yZFtdfSBzeW1ib2xzXG4gKiBAcHJvcGVydHkge1JlbGF0aW9uc2hpcFtdfSByZWxhdGlvbnNoaXBzXG4gKiBAcHJvcGVydHkge0NvbnRyb2xDb25zdHJ1Y3RbXX0gY29udHJvbENvbnN0cnVjdHNcbiAqIEBwcm9wZXJ0eSB7RGF0YUZhY3RbXX0gZGF0YUZhY3RzXG4gKiBAcHJvcGVydHkge0RpYWdub3N0aWNbXX0gZGlhZ25vc3RpY3NcbiAqIEBwcm9wZXJ0eSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IFtleHRlbnNpb25zXVxuICovXG5cbi8qKlxuICogQHBhcmFtIHtQYXJ0aWFsPFNvdXJjZVJhbmdlPn0gW2lucHV0XVxuICogQHJldHVybnMge1NvdXJjZVJhbmdlfVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU291cmNlUmFuZ2UoaW5wdXQgPSB7fSkge1xuICAvKiogQHR5cGUge1NvdXJjZVJhbmdlfSAqL1xuICBjb25zdCByYW5nZSA9IHtcbiAgICBmaWxlSWQ6IFN0cmluZyhpbnB1dC5maWxlSWQgPz8gJycpLFxuICAgIHN0YXJ0TGluZTogTnVtYmVyKGlucHV0LnN0YXJ0TGluZSA/PyAwKSxcbiAgICBzdGFydENvbHVtbjogTnVtYmVyKGlucHV0LnN0YXJ0Q29sdW1uID8/IDApLFxuICAgIGVuZExpbmU6IE51bWJlcihpbnB1dC5lbmRMaW5lID8/IDApLFxuICAgIGVuZENvbHVtbjogTnVtYmVyKGlucHV0LmVuZENvbHVtbiA/PyAwKSxcbiAgfTtcbiAgaWYgKE51bWJlci5pc0ludGVnZXIoaW5wdXQuc3RhcnRPZmZzZXQpKSB7XG4gICAgcmFuZ2Uuc3RhcnRPZmZzZXQgPSBOdW1iZXIoaW5wdXQuc3RhcnRPZmZzZXQpO1xuICB9XG4gIGlmIChOdW1iZXIuaXNJbnRlZ2VyKGlucHV0LmVuZE9mZnNldCkpIHtcbiAgICByYW5nZS5lbmRPZmZzZXQgPSBOdW1iZXIoaW5wdXQuZW5kT2Zmc2V0KTtcbiAgfVxuICByZXR1cm4gcmFuZ2U7XG59XG5cbi8qKlxuICogQHBhcmFtIHtQYXJ0aWFsPEZpbGVSZWNvcmQ+fSBbaW5wdXRdXG4gKiBAcmV0dXJucyB7RmlsZVJlY29yZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZpbGVSZWNvcmQoaW5wdXQgPSB7fSkge1xuICAvKiogQHR5cGUge0ZpbGVSZWNvcmR9ICovXG4gIGNvbnN0IGZpbGUgPSB7XG4gICAgZmlsZUlkOiBTdHJpbmcoaW5wdXQuZmlsZUlkID8/ICcnKSxcbiAgICBwYXRoOiBTdHJpbmcoaW5wdXQucGF0aCA/PyAnJyksXG4gICAgbGFuZ3VhZ2U6IFN0cmluZyhpbnB1dC5sYW5ndWFnZSA/PyAnJyksXG4gICAgY29udGVudEhhc2g6IFN0cmluZyhpbnB1dC5jb250ZW50SGFzaCA/PyAnJyksXG4gICAgc2l6ZUJ5dGVzOiBOdW1iZXIoaW5wdXQuc2l6ZUJ5dGVzID8/IDApLFxuICAgIGxpbmVDb3VudDogTnVtYmVyKGlucHV0LmxpbmVDb3VudCA/PyAxKSxcbiAgICBnZW5lcmF0ZWQ6IGlucHV0LmdlbmVyYXRlZCA9PT0gdHJ1ZSxcbiAgfTtcbiAgaWYgKGlzUGxhaW5PYmplY3QoaW5wdXQuZXh0ZW5zaW9ucykpIHtcbiAgICBmaWxlLmV4dGVuc2lvbnMgPSBjbG9uZUpzb24oaW5wdXQuZXh0ZW5zaW9ucyk7XG4gIH1cbiAgcmV0dXJuIGZpbGU7XG59XG5cbi8qKlxuICogQHBhcmFtIHtQYXJ0aWFsPFN5bWJvbFJlY29yZD4gJiB7ZGVjbGFyYXRpb24/OiBTb3VyY2VSYW5nZX19IFtpbnB1dF1cbiAqIEByZXR1cm5zIHtTeW1ib2xSZWNvcmR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTeW1ib2woaW5wdXQgPSB7fSkge1xuICAvKiogQHR5cGUge1N5bWJvbFJlY29yZH0gKi9cbiAgY29uc3Qgc3ltYm9sID0ge1xuICAgIHN5bWJvbElkOiBTdHJpbmcoaW5wdXQuc3ltYm9sSWQgPz8gJycpLFxuICAgIGtpbmQ6IFN0cmluZyhpbnB1dC5raW5kID8/ICd1bmtub3duJyksXG4gICAgbmFtZTogU3RyaW5nKGlucHV0Lm5hbWUgPz8gJycpLFxuICAgIHF1YWxpZmllZE5hbWU6IFN0cmluZyhpbnB1dC5xdWFsaWZpZWROYW1lID8/IGlucHV0Lm5hbWUgPz8gJycpLFxuICAgIGxhbmd1YWdlOiBTdHJpbmcoaW5wdXQubGFuZ3VhZ2UgPz8gJycpLFxuICAgIGRlY2xhcmF0aW9uOiBjcmVhdGVTb3VyY2VSYW5nZShpbnB1dC5kZWNsYXJhdGlvbiksXG4gIH07XG4gIGlmICh0eXBlb2YgaW5wdXQuc2lnbmF0dXJlID09PSAnc3RyaW5nJyAmJiBpbnB1dC5zaWduYXR1cmUubGVuZ3RoID4gMCkge1xuICAgIHN5bWJvbC5zaWduYXR1cmUgPSBpbnB1dC5zaWduYXR1cmU7XG4gIH1cbiAgaWYgKHR5cGVvZiBpbnB1dC5wYXJlbnRJZCA9PT0gJ3N0cmluZycgJiYgaW5wdXQucGFyZW50SWQubGVuZ3RoID4gMCkge1xuICAgIHN5bWJvbC5wYXJlbnRJZCA9IGlucHV0LnBhcmVudElkO1xuICB9XG4gIGlmICh0eXBlb2YgaW5wdXQudmlzaWJpbGl0eSA9PT0gJ3N0cmluZycgJiYgaW5wdXQudmlzaWJpbGl0eS5sZW5ndGggPiAwKSB7XG4gICAgc3ltYm9sLnZpc2liaWxpdHkgPSAvKiogQHR5cGUge1N5bWJvbFJlY29yZFsndmlzaWJpbGl0eSddfSAqLyAoaW5wdXQudmlzaWJpbGl0eSk7XG4gIH1cbiAgaWYgKHR5cGVvZiBpbnB1dC5kaXNhbWJpZ3VhdG9yID09PSAnc3RyaW5nJykge1xuICAgIHN5bWJvbC5kaXNhbWJpZ3VhdG9yID0gaW5wdXQuZGlzYW1iaWd1YXRvcjtcbiAgfVxuICBpZiAoaXNQbGFpbk9iamVjdChpbnB1dC5leHRlbnNpb25zKSkge1xuICAgIHN5bWJvbC5leHRlbnNpb25zID0gY2xvbmVKc29uKGlucHV0LmV4dGVuc2lvbnMpO1xuICB9XG4gIHJldHVybiBzeW1ib2w7XG59XG5cbi8qKlxuICogQHBhcmFtIHtQYXJ0aWFsPEV2aWRlbmNlPn0gW2lucHV0XVxuICogQHJldHVybnMge0V2aWRlbmNlfVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRXZpZGVuY2UoaW5wdXQgPSB7fSkge1xuICAvKiogQHR5cGUge0V2aWRlbmNlfSAqL1xuICBjb25zdCBldmlkZW5jZSA9IHsga2luZDogLyoqIEB0eXBlIHtFdmlkZW5jZVsna2luZCddfSAqLyAoaW5wdXQua2luZCA/PyAnc291cmNlX3JhbmdlJykgfTtcbiAgaWYgKGlucHV0LnJhbmdlKSB7XG4gICAgZXZpZGVuY2UucmFuZ2UgPSBjcmVhdGVTb3VyY2VSYW5nZShpbnB1dC5yYW5nZSk7XG4gIH1cbiAgZm9yIChjb25zdCBmaWVsZCBvZiBbJ3N5bWJvbElkJywgJ3JlbGF0aW9uc2hpcElkJywgJ2RpYWdub3N0aWNDb2RlJywgJ25vdGUnXSkge1xuICAgIGlmICh0eXBlb2YgaW5wdXRbZmllbGRdID09PSAnc3RyaW5nJyAmJiBpbnB1dFtmaWVsZF0ubGVuZ3RoID4gMCkge1xuICAgICAgZXZpZGVuY2VbZmllbGRdID0gaW5wdXRbZmllbGRdO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZXZpZGVuY2U7XG59XG5cbi8qKlxuICogQHBhcmFtIHtQYXJ0aWFsPFJlbGF0aW9uc2hpcD59IFtpbnB1dF1cbiAqIEByZXR1cm5zIHtSZWxhdGlvbnNoaXB9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSZWxhdGlvbnNoaXAoaW5wdXQgPSB7fSkge1xuICAvKiogQHR5cGUge1JlbGF0aW9uc2hpcH0gKi9cbiAgY29uc3QgcmVsYXRpb25zaGlwID0ge1xuICAgIHJlbGF0aW9uc2hpcElkOiBTdHJpbmcoaW5wdXQucmVsYXRpb25zaGlwSWQgPz8gJycpLFxuICAgIHR5cGU6IFN0cmluZyhpbnB1dC50eXBlID8/ICdyZWZlcmVuY2VzJyksXG4gICAgZnJvbTogU3RyaW5nKGlucHV0LmZyb20gPz8gJycpLFxuICAgIHRvOiBTdHJpbmcoaW5wdXQudG8gPz8gJycpLFxuICAgIHN0YXR1czogLyoqIEB0eXBlIHtSZWxhdGlvbnNoaXBbJ3N0YXR1cyddfSAqLyAoaW5wdXQuc3RhdHVzID8/ICd1bnJlc29sdmVkJyksXG4gICAgZXZpZGVuY2U6IEFycmF5LmlzQXJyYXkoaW5wdXQuZXZpZGVuY2UpID8gaW5wdXQuZXZpZGVuY2UubWFwKGNyZWF0ZUV2aWRlbmNlKSA6IFtdLFxuICB9O1xuICBpZiAodHlwZW9mIGlucHV0LnJlYXNvbkNvZGUgPT09ICdzdHJpbmcnICYmIGlucHV0LnJlYXNvbkNvZGUubGVuZ3RoID4gMCkge1xuICAgIHJlbGF0aW9uc2hpcC5yZWFzb25Db2RlID0gaW5wdXQucmVhc29uQ29kZTtcbiAgfVxuICBpZiAoaW5wdXQuc2l0ZSkge1xuICAgIHJlbGF0aW9uc2hpcC5zaXRlID0gY3JlYXRlU291cmNlUmFuZ2UoaW5wdXQuc2l0ZSk7XG4gIH1cbiAgaWYgKGlzUGxhaW5PYmplY3QoaW5wdXQuZXh0ZW5zaW9ucykpIHtcbiAgICByZWxhdGlvbnNoaXAuZXh0ZW5zaW9ucyA9IGNsb25lSnNvbihpbnB1dC5leHRlbnNpb25zKTtcbiAgfVxuICByZXR1cm4gcmVsYXRpb25zaGlwO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UGFydGlhbDxDb250cm9sQ29uc3RydWN0Pn0gW2lucHV0XVxuICogQHJldHVybnMge0NvbnRyb2xDb25zdHJ1Y3R9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb250cm9sQ29uc3RydWN0KGlucHV0ID0ge30pIHtcbiAgLyoqIEB0eXBlIHtDb250cm9sQ29uc3RydWN0fSAqL1xuICBjb25zdCBjb25zdHJ1Y3QgPSB7XG4gICAgY29uc3RydWN0SWQ6IFN0cmluZyhpbnB1dC5jb25zdHJ1Y3RJZCA/PyAnJyksXG4gICAga2luZDogU3RyaW5nKGlucHV0LmtpbmQgPz8gJ3Vua25vd24nKSxcbiAgICBjaGlsZHJlbjogQXJyYXkuaXNBcnJheShpbnB1dC5jaGlsZHJlbikgPyBpbnB1dC5jaGlsZHJlbi5tYXAoU3RyaW5nKSA6IFtdLFxuICAgIHNvdXJjZVJhbmdlOiBjcmVhdGVTb3VyY2VSYW5nZShpbnB1dC5zb3VyY2VSYW5nZSksXG4gIH07XG4gIGlmICh0eXBlb2YgaW5wdXQucGFyZW50SWQgPT09ICdzdHJpbmcnICYmIGlucHV0LnBhcmVudElkLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdHJ1Y3QucGFyZW50SWQgPSBpbnB1dC5wYXJlbnRJZDtcbiAgfVxuICBpZiAodHlwZW9mIGlucHV0LnN5bWJvbElkID09PSAnc3RyaW5nJyAmJiBpbnB1dC5zeW1ib2xJZC5sZW5ndGggPiAwKSB7XG4gICAgY29uc3RydWN0LnN5bWJvbElkID0gaW5wdXQuc3ltYm9sSWQ7XG4gIH1cbiAgaWYgKGlucHV0LmNvbmRpdGlvbikge1xuICAgIGNvbnN0cnVjdC5jb25kaXRpb24gPSBjcmVhdGVTb3VyY2VSYW5nZShpbnB1dC5jb25kaXRpb24pO1xuICB9XG4gIGlmIChpc1BsYWluT2JqZWN0KGlucHV0LmV4dGVuc2lvbnMpKSB7XG4gICAgY29uc3RydWN0LmV4dGVuc2lvbnMgPSBjbG9uZUpzb24oaW5wdXQuZXh0ZW5zaW9ucyk7XG4gIH1cbiAgcmV0dXJuIGNvbnN0cnVjdDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1BhcnRpYWw8RGF0YUZhY3Q+fSBbaW5wdXRdXG4gKiBAcmV0dXJucyB7RGF0YUZhY3R9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVEYXRhRmFjdChpbnB1dCA9IHt9KSB7XG4gIC8qKiBAdHlwZSB7RGF0YUZhY3R9ICovXG4gIGNvbnN0IGZhY3QgPSB7XG4gICAgZmFjdElkOiBTdHJpbmcoaW5wdXQuZmFjdElkID8/ICcnKSxcbiAgICBraW5kOiBTdHJpbmcoaW5wdXQua2luZCA/PyAndXNlJyksXG4gICAgc3ltYm9sSWQ6IFN0cmluZyhpbnB1dC5zeW1ib2xJZCA/PyAnJyksXG4gICAgYXQ6IGNyZWF0ZVNvdXJjZVJhbmdlKGlucHV0LmF0KSxcbiAgICBzdGF0dXM6IC8qKiBAdHlwZSB7RGF0YUZhY3RbJ3N0YXR1cyddfSAqLyAoaW5wdXQuc3RhdHVzID8/ICdyZXNvbHZlZCcpLFxuICB9O1xuICBpZiAodHlwZW9mIGlucHV0LnJlbGF0ZWRTeW1ib2xJZCA9PT0gJ3N0cmluZycgJiYgaW5wdXQucmVsYXRlZFN5bWJvbElkLmxlbmd0aCA+IDApIHtcbiAgICBmYWN0LnJlbGF0ZWRTeW1ib2xJZCA9IGlucHV0LnJlbGF0ZWRTeW1ib2xJZDtcbiAgfVxuICBpZiAodHlwZW9mIGlucHV0LnJlYXNvbkNvZGUgPT09ICdzdHJpbmcnICYmIGlucHV0LnJlYXNvbkNvZGUubGVuZ3RoID4gMCkge1xuICAgIGZhY3QucmVhc29uQ29kZSA9IGlucHV0LnJlYXNvbkNvZGU7XG4gIH1cbiAgaWYgKGlzUGxhaW5PYmplY3QoaW5wdXQuZXh0ZW5zaW9ucykpIHtcbiAgICBmYWN0LmV4dGVuc2lvbnMgPSBjbG9uZUpzb24oaW5wdXQuZXh0ZW5zaW9ucyk7XG4gIH1cbiAgcmV0dXJuIGZhY3Q7XG59XG5cbi8qKlxuICogQHBhcmFtIHtQYXJ0aWFsPERpYWdub3N0aWM+fSBbaW5wdXRdXG4gKiBAcmV0dXJucyB7RGlhZ25vc3RpY31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZURpYWdub3N0aWMoaW5wdXQgPSB7fSkge1xuICAvKiogQHR5cGUge0RpYWdub3N0aWN9ICovXG4gIGNvbnN0IGRpYWdub3N0aWMgPSB7XG4gICAgc2V2ZXJpdHk6IC8qKiBAdHlwZSB7RGlhZ25vc3RpY1snc2V2ZXJpdHknXX0gKi8gKGlucHV0LnNldmVyaXR5ID8/ICd3YXJuaW5nJyksXG4gICAgY29kZTogU3RyaW5nKGlucHV0LmNvZGUgPz8gJycpLFxuICAgIG1lc3NhZ2U6IFN0cmluZyhpbnB1dC5tZXNzYWdlID8/ICcnKSxcbiAgICBhZmZlY3RzOiBBcnJheS5pc0FycmF5KGlucHV0LmFmZmVjdHMpID8gaW5wdXQuYWZmZWN0cy5tYXAoU3RyaW5nKSA6IFtdLFxuICB9O1xuICBpZiAoaW5wdXQuc291cmNlUmFuZ2UpIHtcbiAgICBkaWFnbm9zdGljLnNvdXJjZVJhbmdlID0gY3JlYXRlU291cmNlUmFuZ2UoaW5wdXQuc291cmNlUmFuZ2UpO1xuICB9XG4gIHJldHVybiBkaWFnbm9zdGljO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UGFydGlhbDxBbmFseXNpc1J1bj59IFtpbnB1dF1cbiAqIEByZXR1cm5zIHtBbmFseXNpc1J1bn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUFuYWx5c2lzUnVuKGlucHV0ID0ge30pIHtcbiAgLyoqIEB0eXBlIHtBbmFseXNpc1J1bn0gKi9cbiAgY29uc3QgcnVuID0ge1xuICAgIHJ1bklkOiBTdHJpbmcoaW5wdXQucnVuSWQgPz8gJycpLFxuICAgIGFkYXB0ZXJJZDogU3RyaW5nKGlucHV0LmFkYXB0ZXJJZCA/PyAnJyksXG4gICAgYWRhcHRlclZlcnNpb246IFN0cmluZyhpbnB1dC5hZGFwdGVyVmVyc2lvbiA/PyAndW5rbm93bicpLFxuICAgIGxhbmd1YWdlOiBTdHJpbmcoaW5wdXQubGFuZ3VhZ2UgPz8gJycpLFxuICAgIGNzclZlcnNpb246IFN0cmluZyhpbnB1dC5jc3JWZXJzaW9uID8/IENTUl9WRVJTSU9OKSxcbiAgICBzY29wZToge1xuICAgICAga2luZDogaW5wdXQuc2NvcGU/LmtpbmQgPT09ICdmaWxlJyA/ICdmaWxlJyA6ICd3b3Jrc3BhY2UnLFxuICAgIH0sXG4gICAgY29tcGxldGVuZXNzOiAvKiogQHR5cGUge0FuYWx5c2lzUnVuWydjb21wbGV0ZW5lc3MnXX0gKi8gKGlucHV0LmNvbXBsZXRlbmVzcyA/PyAncGFydGlhbCcpLFxuICAgIGZpbGVzOiBBcnJheS5pc0FycmF5KGlucHV0LmZpbGVzKSA/IGlucHV0LmZpbGVzLm1hcChjcmVhdGVGaWxlUmVjb3JkKSA6IFtdLFxuICAgIHN5bWJvbHM6IEFycmF5LmlzQXJyYXkoaW5wdXQuc3ltYm9scykgPyBpbnB1dC5zeW1ib2xzLm1hcChjcmVhdGVTeW1ib2wpIDogW10sXG4gICAgcmVsYXRpb25zaGlwczogQXJyYXkuaXNBcnJheShpbnB1dC5yZWxhdGlvbnNoaXBzKVxuICAgICAgPyBpbnB1dC5yZWxhdGlvbnNoaXBzLm1hcChjcmVhdGVSZWxhdGlvbnNoaXApXG4gICAgICA6IFtdLFxuICAgIGNvbnRyb2xDb25zdHJ1Y3RzOiBBcnJheS5pc0FycmF5KGlucHV0LmNvbnRyb2xDb25zdHJ1Y3RzKVxuICAgICAgPyBpbnB1dC5jb250cm9sQ29uc3RydWN0cy5tYXAoY3JlYXRlQ29udHJvbENvbnN0cnVjdClcbiAgICAgIDogW10sXG4gICAgZGF0YUZhY3RzOiBBcnJheS5pc0FycmF5KGlucHV0LmRhdGFGYWN0cykgPyBpbnB1dC5kYXRhRmFjdHMubWFwKGNyZWF0ZURhdGFGYWN0KSA6IFtdLFxuICAgIGRpYWdub3N0aWNzOiBBcnJheS5pc0FycmF5KGlucHV0LmRpYWdub3N0aWNzKSA/IGlucHV0LmRpYWdub3N0aWNzLm1hcChjcmVhdGVEaWFnbm9zdGljKSA6IFtdLFxuICB9O1xuICBpZiAodHlwZW9mIGlucHV0LnNjb3BlPy5wYXRoID09PSAnc3RyaW5nJyAmJiBpbnB1dC5zY29wZS5wYXRoLmxlbmd0aCA+IDApIHtcbiAgICBydW4uc2NvcGUucGF0aCA9IGlucHV0LnNjb3BlLnBhdGg7XG4gIH1cbiAgaWYgKHR5cGVvZiBpbnB1dC5zdGFydGVkQXQgPT09ICdzdHJpbmcnICYmIGlucHV0LnN0YXJ0ZWRBdC5sZW5ndGggPiAwKSB7XG4gICAgcnVuLnN0YXJ0ZWRBdCA9IGlucHV0LnN0YXJ0ZWRBdDtcbiAgfVxuICBpZiAoTnVtYmVyLmlzRmluaXRlKGlucHV0LmR1cmF0aW9uTXMpKSB7XG4gICAgcnVuLmR1cmF0aW9uTXMgPSBOdW1iZXIoaW5wdXQuZHVyYXRpb25Ncyk7XG4gIH1cbiAgaWYgKGlzUGxhaW5PYmplY3QoaW5wdXQuZXh0ZW5zaW9ucykpIHtcbiAgICBydW4uZXh0ZW5zaW9ucyA9IGNsb25lSnNvbihpbnB1dC5leHRlbnNpb25zKTtcbiAgfVxuICByZXR1cm4gcnVuO1xufVxuXG4vKipcbiAqIEJ1aWxkIGEgZGVncmFkZWQgcnVuIGZyb20gYW4gYWRhcHRlciBmYWlsdXJlLiBUaGUgcnVuIGlzIHZhbGlkIENTUiB3aXRoXG4gKiBgY29tcGxldGVuZXNzOiAncGFydGlhbCdgIGFuZCBhbiBlcnJvciBkaWFnbm9zdGljLCBzbyBjb25zdW1lcnMgY2FuIHJlbmRlciBhblxuICogaG9uZXN0IGVtcHR5IHN0YXRlIGluc3RlYWQgb2YgY3Jhc2hpbmcuXG4gKlxuICogQHBhcmFtIHt7cnVuSWQ6IHN0cmluZywgYWRhcHRlcklkOiBzdHJpbmcsIGFkYXB0ZXJWZXJzaW9uPzogc3RyaW5nLCBsYW5ndWFnZT86IHN0cmluZywgc2NvcGU/OiBBbmFseXNpc1Njb3BlLCBjb2RlOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZywgcmVhc29uQ29kZT86IHN0cmluZ319IGlucHV0XG4gKiBAcmV0dXJucyB7QW5hbHlzaXNSdW59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVEZWdyYWRlZFJ1bihpbnB1dCkge1xuICByZXR1cm4gY3JlYXRlQW5hbHlzaXNSdW4oe1xuICAgIHJ1bklkOiBpbnB1dC5ydW5JZCxcbiAgICBhZGFwdGVySWQ6IGlucHV0LmFkYXB0ZXJJZCxcbiAgICBhZGFwdGVyVmVyc2lvbjogaW5wdXQuYWRhcHRlclZlcnNpb24gPz8gJ3Vua25vd24nLFxuICAgIGxhbmd1YWdlOiBpbnB1dC5sYW5ndWFnZSA/PyAndW5rbm93bicsXG4gICAgc2NvcGU6IGlucHV0LnNjb3BlLFxuICAgIGNvbXBsZXRlbmVzczogJ3BhcnRpYWwnLFxuICAgIGRpYWdub3N0aWNzOiBbXG4gICAgICBjcmVhdGVEaWFnbm9zdGljKHtcbiAgICAgICAgc2V2ZXJpdHk6ICdlcnJvcicsXG4gICAgICAgIGNvZGU6IGlucHV0LmNvZGUsXG4gICAgICAgIG1lc3NhZ2U6IGlucHV0Lm1lc3NhZ2UsXG4gICAgICAgIGFmZmVjdHM6IFtdLFxuICAgICAgfSksXG4gICAgXSxcbiAgfSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHJldHVybnMge3ZhbHVlIGlzIFJlY29yZDxzdHJpbmcsIHVua25vd24+fVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNQbGFpbk9iamVjdCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCAmJiAhQXJyYXkuaXNBcnJheSh2YWx1ZSk7XG59XG5cbi8qKlxuICogSlNPTi1zaGFwZWQgZGVlcCBjbG9uZSB0aGF0IHByZXNlcnZlcyBgdW5kZWZpbmVkYC1mcmVlIHN0cnVjdHVyZS4gRmFzdGVyIGFuZFxuICogbW9yZSBwcmVkaWN0YWJsZSB0aGFuIGBzdHJ1Y3R1cmVkQ2xvbmVgIGZvciBwbGFpbiBDU1IgZGF0YS5cbiAqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtUfSB2YWx1ZVxuICogQHJldHVybnMge1R9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZUpzb24odmFsdWUpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7VH0gKi8gKHZhbHVlLm1hcCgoZW50cnkpID0+IGNsb25lSnNvbihlbnRyeSkpKTtcbiAgfVxuICBpZiAoaXNQbGFpbk9iamVjdCh2YWx1ZSkpIHtcbiAgICAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqL1xuICAgIGNvbnN0IGNvcHkgPSB7fTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIGVudHJ5XSBvZiBPYmplY3QuZW50cmllcyh2YWx1ZSkpIHtcbiAgICAgIGlmIChlbnRyeSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvcHlba2V5XSA9IGNsb25lSnNvbihlbnRyeSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAvKiogQHR5cGUge1R9ICovIChjb3B5KTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmV4cG9ydCB7IHZhbGlkYXRlQW5hbHlzaXNSdW4gfSBmcm9tICcuL3ZhbGlkYXRlLmpzJztcbiIsICIvKipcbiAqIENhbmNlbGxhdGlvbiBwbHVtYmluZyBzaGFyZWQgYnkgdGhlIHJlZ2lzdHJ5IGFuZCBhZGFwdGVycy5cbiAqXG4gKiBBZGFwdGVycyByZWNlaXZlIGEgdG9rZW4sIG5vdCBhIGdsb2JhbC4gVGhleSBtYXkgcG9sbCBgaXNDYW5jZWxsZWQoKWAgb3IgY2FsbFxuICogYHRocm93SWZDYW5jZWxsZWQoKWAgYXQgc2FmZSBwb2ludHMuIFRoZSByZWdpc3RyeSBjb252ZXJ0cyBhIGNhbmNlbGxhdGlvbiBpbnRvXG4gKiBhIHBhcnRpYWwgcnVuLCBzbyBjYW5jZWxsYXRpb24gaXMgbmV2ZXIgYW4gdW5oYW5kbGVkIHJlamVjdGlvbi5cbiAqL1xuXG5leHBvcnQgY2xhc3MgQ2FuY2VsbGF0aW9uRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIC8qKiBAcGFyYW0ge3N0cmluZ30gW21lc3NhZ2VdICovXG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2UgPSAnQW5hbHlzaXMgd2FzIGNhbmNlbGxlZC4nKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5uYW1lID0gJ0NhbmNlbGxhdGlvbkVycm9yJztcbiAgICB0aGlzLmNvZGUgPSAnRV9DQU5DRUxMRUQnO1xuICB9XG59XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gQ2FuY2VsbGF0aW9uVG9rZW5cbiAqIEBwcm9wZXJ0eSB7KCkgPT4gYm9vbGVhbn0gaXNDYW5jZWxsZWRcbiAqIEBwcm9wZXJ0eSB7KGxpc3RlbmVyOiAoKSA9PiB2b2lkKSA9PiAoKSA9PiB2b2lkfSBvbkNhbmNlbFxuICogQHByb3BlcnR5IHsoKSA9PiB2b2lkfSB0aHJvd0lmQ2FuY2VsbGVkXG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge0Fib3J0U2lnbmFsIHwge2Fib3J0ZWQ/OiBib29sZWFuLCBpc0NhbmNlbGxlZD86ICgpID0+IGJvb2xlYW59IHwgbnVsbCB8IHVuZGVmaW5lZH0gc291cmNlXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzQ2FuY2VsbGF0aW9uUmVxdWVzdGVkKHNvdXJjZSkge1xuICBpZiAoIXNvdXJjZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodHlwZW9mIHNvdXJjZS5pc0NhbmNlbGxlZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBzb3VyY2UuaXNDYW5jZWxsZWQoKSA9PT0gdHJ1ZTtcbiAgfVxuICByZXR1cm4gc291cmNlLmFib3J0ZWQgPT09IHRydWU7XG59XG5cbi8qKlxuICogQHBhcmFtIHtBYm9ydFNpZ25hbCB8IHthYm9ydGVkPzogYm9vbGVhbiwgaXNDYW5jZWxsZWQ/OiAoKSA9PiBib29sZWFufSB8IG51bGwgfCB1bmRlZmluZWR9IHNvdXJjZVxuICovXG5leHBvcnQgZnVuY3Rpb24gdGhyb3dJZkNhbmNlbGxlZChzb3VyY2UpIHtcbiAgaWYgKGlzQ2FuY2VsbGF0aW9uUmVxdWVzdGVkKHNvdXJjZSkpIHtcbiAgICB0aHJvdyBuZXcgQ2FuY2VsbGF0aW9uRXJyb3IoKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZSBhIHRva2VuIHBsdXMgYSBgY2FuY2VsKClgIGZ1bmN0aW9uIGZvciB0ZXN0cyBhbmQgaG9zdCBjb21tYW5kcy5cbiAqXG4gKiBAcmV0dXJucyB7e3Rva2VuOiBDYW5jZWxsYXRpb25Ub2tlbiwgY2FuY2VsOiAocmVhc29uPzogc3RyaW5nKSA9PiB2b2lkLCBkaXNwb3NlOiAoKSA9PiB2b2lkfX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNhbmNlbGxhdGlvblNvdXJjZSgpIHtcbiAgLyoqIEB0eXBlIHtTZXQ8KCkgPT4gdm9pZD59ICovXG4gIGNvbnN0IGxpc3RlbmVycyA9IG5ldyBTZXQoKTtcbiAgbGV0IGNhbmNlbGxlZCA9IGZhbHNlO1xuICBsZXQgcmVhc29uID0gJyc7XG5cbiAgLyoqIEB0eXBlIHtDYW5jZWxsYXRpb25Ub2tlbn0gKi9cbiAgY29uc3QgdG9rZW4gPSB7XG4gICAgaXNDYW5jZWxsZWQ6ICgpID0+IGNhbmNlbGxlZCxcbiAgICBvbkNhbmNlbChsaXN0ZW5lcikge1xuICAgICAgaWYgKGNhbmNlbGxlZCkge1xuICAgICAgICBsaXN0ZW5lcigpO1xuICAgICAgICByZXR1cm4gKCkgPT4ge307XG4gICAgICB9XG4gICAgICBsaXN0ZW5lcnMuYWRkKGxpc3RlbmVyKTtcbiAgICAgIHJldHVybiAoKSA9PiBsaXN0ZW5lcnMuZGVsZXRlKGxpc3RlbmVyKTtcbiAgICB9LFxuICAgIHRocm93SWZDYW5jZWxsZWQoKSB7XG4gICAgICB0aHJvd0lmQ2FuY2VsbGVkKHRva2VuKTtcbiAgICB9LFxuICB9O1xuXG4gIHJldHVybiB7XG4gICAgdG9rZW4sXG4gICAgY2FuY2VsKG5leHRSZWFzb24gPSAnY2FuY2VsbGVkJykge1xuICAgICAgaWYgKGNhbmNlbGxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjYW5jZWxsZWQgPSB0cnVlO1xuICAgICAgcmVhc29uID0gbmV4dFJlYXNvbjtcbiAgICAgIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgWy4uLmxpc3RlbmVyc10pIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBsaXN0ZW5lcigpO1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAvLyBMaXN0ZW5lcnMgYXJlIGFkYXB0ZXIgY29kZTsgb25lIGZhaWxpbmcgbGlzdGVuZXIgbXVzdCBub3Qgc3RvcCBvdGhlcnMuXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGxpc3RlbmVycy5jbGVhcigpO1xuICAgIH0sXG4gICAgZGlzcG9zZSgpIHtcbiAgICAgIGxpc3RlbmVycy5jbGVhcigpO1xuICAgICAgY2FuY2VsbGVkID0gdHJ1ZTtcbiAgICB9LFxuICAgIGdldCByZWFzb24oKSB7XG4gICAgICByZXR1cm4gcmVhc29uO1xuICAgIH0sXG4gIH07XG59XG5cbi8qKlxuICogQnJpZGdlIGFuIGBBYm9ydFNpZ25hbGAgdG8gYSB0b2tlbi5cbiAqXG4gKiBAcGFyYW0ge0Fib3J0U2lnbmFsIHwgdW5kZWZpbmVkfSBzaWduYWxcbiAqIEByZXR1cm5zIHtDYW5jZWxsYXRpb25Ub2tlbiB8IHVuZGVmaW5lZH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRva2VuRnJvbUFib3J0U2lnbmFsKHNpZ25hbCkge1xuICBpZiAoIXNpZ25hbCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBpc0NhbmNlbGxlZDogKCkgPT4gc2lnbmFsLmFib3J0ZWQgPT09IHRydWUsXG4gICAgb25DYW5jZWwobGlzdGVuZXIpIHtcbiAgICAgIGlmIChzaWduYWwuYWJvcnRlZCkge1xuICAgICAgICBsaXN0ZW5lcigpO1xuICAgICAgICByZXR1cm4gKCkgPT4ge307XG4gICAgICB9XG4gICAgICBzaWduYWwuYWRkRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBsaXN0ZW5lciwgeyBvbmNlOiB0cnVlIH0pO1xuICAgICAgcmV0dXJuICgpID0+IHNpZ25hbC5yZW1vdmVFdmVudExpc3RlbmVyKCdhYm9ydCcsIGxpc3RlbmVyKTtcbiAgICB9LFxuICAgIHRocm93SWZDYW5jZWxsZWQoKSB7XG4gICAgICBpZiAoc2lnbmFsLmFib3J0ZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IENhbmNlbGxhdGlvbkVycm9yKCk7XG4gICAgICB9XG4gICAgfSxcbiAgfTtcbn1cbiIsICIvKipcbiAqIENTUiBtaWdyYXRpb24gaGFybmVzcy5cbiAqXG4gKiBBIG1pZ3JhdGlvbiBpcyBhbiBleHBsaWNpdCwgc2luZ2xlLXN0ZXAgZnVuY3Rpb24uIENoYWlucyBhcmUgYnVpbHQgYnkgd2Fsa2luZ1xuICogYWRqYWNlbnQgdmVyc2lvbnM7IGEgbWlzc2luZyBzdGVwIGlzIGFuIGVycm9yLCBuZXZlciBhIHNpbGVudCBza2lwLiBQaGFzZSA4XG4gKiB3aWxsIHBlcnNpc3QgcnVucywgc28gdGhpcyBtZWNoYW5pc20gaGFzIHRvIGV4aXN0IGJlZm9yZSB0aGUgZmlyc3Qgcm93IGlzXG4gKiB3cml0dGVuLlxuICpcbiAqIFRoZSBgMS4wLjAgLT4gMS4xLjBgIHN0ZXAgaXMgcmVhbDogMS4wLjAgd2FzIHRoZSBQaGFzZSAwIHByb3Zpc2lvbmFsIHNoYXBlLFxuICogd2hpY2ggdXNlZCBgc3ltYm9sc1tdLnJhbmdlYCwgYHJlbGF0aW9uc2hpcHNbXS5yZWFzb25gLCBhbmQgYW4gYHVua25vd25gXG4gKiByZWxhdGlvbnNoaXAgc3RhdHVzLiAxLjEuMCBpcyB0aGUgbm9ybWF0aXZlIFBoYXNlIDEgc2hhcGUuXG4gKi9cblxuaW1wb3J0IHsgQ1NSX1ZFUlNJT04sIHBhcnNlQ3NyVmVyc2lvbiB9IGZyb20gJy4vdHlwZXMuanMnO1xuaW1wb3J0IHsgdmFsaWRhdGVBbmFseXNpc1J1biB9IGZyb20gJy4vdmFsaWRhdGUuanMnO1xuXG4vKipcbiAqIEB0eXBlZGVmIHsocnVuOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT4gUmVjb3JkPHN0cmluZywgdW5rbm93bj59IE1pZ3JhdGlvblN0ZXBcbiAqIEB0eXBlZGVmIHt7ZnJvbTogc3RyaW5nLCB0bzogc3RyaW5nLCBkZXNjcmlwdGlvbjogc3RyaW5nLCBtaWdyYXRlOiBNaWdyYXRpb25TdGVwfX0gTWlncmF0aW9uXG4gKi9cblxuLyoqIEB0eXBlIHtNaWdyYXRpb25bXX0gKi9cbmV4cG9ydCBjb25zdCBNSUdSQVRJT05TID0gW1xuICB7XG4gICAgZnJvbTogJzEuMC4wJyxcbiAgICB0bzogJzEuMS4wJyxcbiAgICBkZXNjcmlwdGlvbjpcbiAgICAgICdSZW5hbWUgcHJvdmlzaW9uYWwgc3ltYm9sL3JlbGF0aW9uc2hpcCBmaWVsZHMgYW5kIGZpbGwgZmllbGRzIHRoYXQgYmVjYW1lIHJlcXVpcmVkLicsXG4gICAgbWlncmF0ZShydW4pIHtcbiAgICAgIGNvbnN0IG5leHQgPSBjbG9uZVZhbHVlKHJ1bik7XG4gICAgICBuZXh0LmNzclZlcnNpb24gPSAnMS4xLjAnO1xuICAgICAgY29uc3QgbGFuZ3VhZ2UgPSB0eXBlb2YgbmV4dC5sYW5ndWFnZSA9PT0gJ3N0cmluZycgPyBuZXh0Lmxhbmd1YWdlIDogJ3Vua25vd24nO1xuICAgICAgbmV4dC5hZGFwdGVyVmVyc2lvbiA9XG4gICAgICAgIHR5cGVvZiBuZXh0LmFkYXB0ZXJWZXJzaW9uID09PSAnc3RyaW5nJyAmJiBuZXh0LmFkYXB0ZXJWZXJzaW9uLmxlbmd0aCA+IDBcbiAgICAgICAgICA/IG5leHQuYWRhcHRlclZlcnNpb25cbiAgICAgICAgICA6ICdsZWdhY3knO1xuICAgICAgbmV4dC5zY29wZSA9IGlzUGxhaW5PYmplY3QobmV4dC5zY29wZSkgPyBuZXh0LnNjb3BlIDogeyBraW5kOiAnd29ya3NwYWNlJyB9O1xuICAgICAgbmV4dC5kaWFnbm9zdGljcyA9IEFycmF5LmlzQXJyYXkobmV4dC5kaWFnbm9zdGljcykgPyBuZXh0LmRpYWdub3N0aWNzIDogW107XG4gICAgICBuZXh0LmNvbnRyb2xDb25zdHJ1Y3RzID0gQXJyYXkuaXNBcnJheShuZXh0LmNvbnRyb2xDb25zdHJ1Y3RzKSA/IG5leHQuY29udHJvbENvbnN0cnVjdHMgOiBbXTtcbiAgICAgIG5leHQuZGF0YUZhY3RzID0gQXJyYXkuaXNBcnJheShuZXh0LmRhdGFGYWN0cykgPyBuZXh0LmRhdGFGYWN0cyA6IFtdO1xuXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShuZXh0LmZpbGVzKSkge1xuICAgICAgICBuZXh0LmZpbGVzID0gbmV4dC5maWxlcy5tYXAoKGZpbGUpID0+IHtcbiAgICAgICAgICBpZiAoIWlzUGxhaW5PYmplY3QoZmlsZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWxlO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4uZmlsZSxcbiAgICAgICAgICAgIHNpemVCeXRlczogTnVtYmVyLmlzSW50ZWdlcihmaWxlLnNpemVCeXRlcykgPyBmaWxlLnNpemVCeXRlcyA6IDAsXG4gICAgICAgICAgICBnZW5lcmF0ZWQ6IGZpbGUuZ2VuZXJhdGVkID09PSB0cnVlLFxuICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShuZXh0LnN5bWJvbHMpKSB7XG4gICAgICAgIG5leHQuc3ltYm9scyA9IG5leHQuc3ltYm9scy5tYXAoKHN5bWJvbCkgPT4ge1xuICAgICAgICAgIGlmICghaXNQbGFpbk9iamVjdChzeW1ib2wpKSB7XG4gICAgICAgICAgICByZXR1cm4gc3ltYm9sO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBtaWdyYXRlZCA9IHsgLi4uc3ltYm9sIH07XG4gICAgICAgICAgaWYgKG1pZ3JhdGVkLmRlY2xhcmF0aW9uID09PSB1bmRlZmluZWQgJiYgbWlncmF0ZWQucmFuZ2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgbWlncmF0ZWQuZGVjbGFyYXRpb24gPSBtaWdyYXRlZC5yYW5nZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGVsZXRlIG1pZ3JhdGVkLnJhbmdlO1xuICAgICAgICAgIGlmICh0eXBlb2YgbWlncmF0ZWQubGFuZ3VhZ2UgIT09ICdzdHJpbmcnIHx8IG1pZ3JhdGVkLmxhbmd1YWdlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgbWlncmF0ZWQubGFuZ3VhZ2UgPSBsYW5ndWFnZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG1pZ3JhdGVkO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkobmV4dC5yZWxhdGlvbnNoaXBzKSkge1xuICAgICAgICBuZXh0LnJlbGF0aW9uc2hpcHMgPSBuZXh0LnJlbGF0aW9uc2hpcHMubWFwKChyZWxhdGlvbnNoaXApID0+IHtcbiAgICAgICAgICBpZiAoIWlzUGxhaW5PYmplY3QocmVsYXRpb25zaGlwKSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlbGF0aW9uc2hpcDtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgbWlncmF0ZWQgPSB7IC4uLnJlbGF0aW9uc2hpcCB9O1xuICAgICAgICAgIGlmIChtaWdyYXRlZC5yZWFzb25Db2RlID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIG1pZ3JhdGVkLnJlYXNvbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIG1pZ3JhdGVkLnJlYXNvbkNvZGUgPSBtaWdyYXRlZC5yZWFzb247XG4gICAgICAgICAgfVxuICAgICAgICAgIGRlbGV0ZSBtaWdyYXRlZC5yZWFzb247XG4gICAgICAgICAgaWYgKG1pZ3JhdGVkLnN0YXR1cyA9PT0gJ3Vua25vd24nKSB7XG4gICAgICAgICAgICBtaWdyYXRlZC5zdGF0dXMgPSAndW5yZXNvbHZlZCc7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG1pZ3JhdGVkLnJlYXNvbkNvZGUgIT09ICdzdHJpbmcnIHx8IG1pZ3JhdGVkLnJlYXNvbkNvZGUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgIG1pZ3JhdGVkLnJlYXNvbkNvZGUgPSAncGFyc2VfZXJyb3InO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkobWlncmF0ZWQuZXZpZGVuY2UpKSB7XG4gICAgICAgICAgICBtaWdyYXRlZC5ldmlkZW5jZSA9IFtdO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbWlncmF0ZWQ7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV4dDtcbiAgICB9LFxuICB9LFxuXTtcblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHJ1blxuICogQHBhcmFtIHtzdHJpbmd9IFt0YXJnZXRWZXJzaW9uXVxuICogQHJldHVybnMge3tvazogdHJ1ZSwgcnVuOiBpbXBvcnQoJy4vZW50aXRpZXMuanMnKS5BbmFseXNpc1J1biwgZnJvbTogc3RyaW5nLCB0bzogc3RyaW5nLCBhcHBsaWVkOiBzdHJpbmdbXX0gfCB7b2s6IGZhbHNlLCBjb2RlOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZywgaXNzdWVzPzogQXJyYXk8e3BhdGg6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nfT59fVxuICovXG5leHBvcnQgZnVuY3Rpb24gbWlncmF0ZVJ1bihydW4sIHRhcmdldFZlcnNpb24gPSBDU1JfVkVSU0lPTikge1xuICBpZiAoIWlzUGxhaW5PYmplY3QocnVuKSkge1xuICAgIHJldHVybiB7IG9rOiBmYWxzZSwgY29kZTogJ0VfVkVSU0lPTicsIG1lc3NhZ2U6ICdBbmFseXNpcyBydW4gbXVzdCBiZSBhbiBvYmplY3QuJyB9O1xuICB9XG4gIGNvbnN0IGZyb20gPSB0eXBlb2YgcnVuLmNzclZlcnNpb24gPT09ICdzdHJpbmcnID8gcnVuLmNzclZlcnNpb24gOiAnJztcbiAgY29uc3Qgc291cmNlID0gcGFyc2VDc3JWZXJzaW9uKGZyb20pO1xuICBjb25zdCB0YXJnZXQgPSBwYXJzZUNzclZlcnNpb24odGFyZ2V0VmVyc2lvbik7XG4gIGlmICghc291cmNlIHx8ICF0YXJnZXQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfVkVSU0lPTicsXG4gICAgICBtZXNzYWdlOiBgQ2Fubm90IG1pZ3JhdGUgQ1NSIHZlcnNpb24gXCIke2Zyb219XCIgdG8gXCIke3RhcmdldFZlcnNpb259XCIuYCxcbiAgICB9O1xuICB9XG4gIGlmIChzb3VyY2UubWFqb3IgIT09IHRhcmdldC5tYWpvcikge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9WRVJTSU9OJyxcbiAgICAgIG1lc3NhZ2U6IGBSZWZ1c2luZyB0byBtaWdyYXRlIGFjcm9zcyBtYWpvciB2ZXJzaW9uczogXCIke2Zyb219XCIgdG8gXCIke3RhcmdldFZlcnNpb259XCIuYCxcbiAgICB9O1xuICB9XG4gIGlmIChjb21wYXJlVmVyc2lvbnMoc291cmNlLCB0YXJnZXQpID4gMCkge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9WRVJTSU9OJyxcbiAgICAgIG1lc3NhZ2U6IGBSZWZ1c2luZyB0byBkb3duZ3JhZGUgQ1NSIGZyb20gXCIke2Zyb219XCIgdG8gXCIke3RhcmdldFZlcnNpb259XCIuYCxcbiAgICB9O1xuICB9XG5cbiAgbGV0IGN1cnJlbnQgPSBjbG9uZVZhbHVlKHJ1bik7XG4gIC8qKiBAdHlwZSB7c3RyaW5nW119ICovXG4gIGNvbnN0IGFwcGxpZWQgPSBbXTtcbiAgbGV0IHZlcnNpb24gPSBmcm9tO1xuICBsZXQgZ3VhcmQgPSAwO1xuXG4gIHdoaWxlICh2ZXJzaW9uICE9PSB0YXJnZXRWZXJzaW9uICYmIGd1YXJkIDwgMjU2KSB7XG4gICAgZ3VhcmQgKz0gMTtcbiAgICBjb25zdCBzdGVwID0gTUlHUkFUSU9OUy5maW5kKChjYW5kaWRhdGUpID0+IGNhbmRpZGF0ZS5mcm9tID09PSB2ZXJzaW9uKTtcbiAgICBpZiAoIXN0ZXApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgY29kZTogJ0VfTUlHUkFUSU9OX01JU1NJTkcnLFxuICAgICAgICBtZXNzYWdlOiBgTm8gbWlncmF0aW9uIHN0ZXAgZnJvbSBDU1IgJHt2ZXJzaW9ufTsgY2Fubm90IHJlYWNoICR7dGFyZ2V0VmVyc2lvbn0uYCxcbiAgICAgIH07XG4gICAgfVxuICAgIGN1cnJlbnQgPSBzdGVwLm1pZ3JhdGUoY3VycmVudCk7XG4gICAgYXBwbGllZC5wdXNoKGAke3N0ZXAuZnJvbX0gLT4gJHtzdGVwLnRvfWApO1xuICAgIHZlcnNpb24gPSBzdGVwLnRvO1xuICB9XG5cbiAgaWYgKHZlcnNpb24gIT09IHRhcmdldFZlcnNpb24pIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfTUlHUkFUSU9OX01JU1NJTkcnLFxuICAgICAgbWVzc2FnZTogYE1pZ3JhdGlvbiBkaWQgbm90IHJlYWNoICR7dGFyZ2V0VmVyc2lvbn0gKHN0b3BwZWQgYXQgJHt2ZXJzaW9ufSkuYCxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgdmFsaWRhdGlvbiA9IHZhbGlkYXRlQW5hbHlzaXNSdW4oY3VycmVudCwgeyBtb2RlOiAnc3RyaWN0JyB9KTtcbiAgaWYgKCF2YWxpZGF0aW9uLm9rKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX1ZBTElEQVRJT04nLFxuICAgICAgbWVzc2FnZTogYE1pZ3JhdGVkIHJ1biBpcyBub3QgdmFsaWQgQ1NSICR7dGFyZ2V0VmVyc2lvbn0uYCxcbiAgICAgIGlzc3VlczogdmFsaWRhdGlvbi5pc3N1ZXMsXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgb2s6IHRydWUsXG4gICAgcnVuOiB2YWxpZGF0aW9uLnJ1bixcbiAgICBmcm9tLFxuICAgIHRvOiB0YXJnZXRWZXJzaW9uLFxuICAgIGFwcGxpZWQsXG4gIH07XG59XG5cbi8qKlxuICogQHBhcmFtIHt7bWFqb3I6IG51bWJlciwgbWlub3I6IG51bWJlciwgcGF0Y2g6IG51bWJlcn19IGFcbiAqIEBwYXJhbSB7e21ham9yOiBudW1iZXIsIG1pbm9yOiBudW1iZXIsIHBhdGNoOiBudW1iZXJ9fSBiXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiBjb21wYXJlVmVyc2lvbnMoYSwgYikge1xuICBpZiAoYS5tYWpvciAhPT0gYi5tYWpvcikge1xuICAgIHJldHVybiBhLm1ham9yIC0gYi5tYWpvcjtcbiAgfVxuICBpZiAoYS5taW5vciAhPT0gYi5taW5vcikge1xuICAgIHJldHVybiBhLm1pbm9yIC0gYi5taW5vcjtcbiAgfVxuICByZXR1cm4gYS5wYXRjaCAtIGIucGF0Y2g7XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHJldHVybnMge3ZhbHVlIGlzIFJlY29yZDxzdHJpbmcsIHVua25vd24+fVxuICovXG5mdW5jdGlvbiBpc1BsYWluT2JqZWN0KHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKTtcbn1cblxuLyoqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtUfSB2YWx1ZVxuICogQHJldHVybnMge1R9XG4gKi9cbmZ1bmN0aW9uIGNsb25lVmFsdWUodmFsdWUpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7VH0gKi8gKHZhbHVlLm1hcCgoZW50cnkpID0+IGNsb25lVmFsdWUoZW50cnkpKSk7XG4gIH1cbiAgaWYgKGlzUGxhaW5PYmplY3QodmFsdWUpKSB7XG4gICAgLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi9cbiAgICBjb25zdCBjb3B5ID0ge307XG4gICAgZm9yIChjb25zdCBba2V5LCBlbnRyeV0gb2YgT2JqZWN0LmVudHJpZXModmFsdWUpKSB7XG4gICAgICBjb3B5W2tleV0gPSBjbG9uZVZhbHVlKGVudHJ5KTtcbiAgICB9XG4gICAgcmV0dXJuIC8qKiBAdHlwZSB7VH0gKi8gKGNvcHkpO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cbiIsICIvKipcbiAqIExhbmd1YWdlLWFnbm9zdGljIENTUiBxdWVyaWVzLlxuICpcbiAqIENvbnN1bWVycyBuZXZlciB3YWxrIENTUiBhcnJheXMgZGlyZWN0bHkuIFRoZXkgYXNrIHRoaXMgbGF5ZXIsIHdoaWNoOlxuICogLSBjaGVja3MgY2FwYWJpbGl0aWVzIGJlZm9yZSBhbnN3ZXJpbmcgKGEgbWlzc2luZyBjYXBhYmlsaXR5IGlzIGEgdHlwZWRcbiAqICAgZGVncmFkYXRpb24sIG5ldmVyIGFuIGVtcHR5IGFycmF5IHRoYXQgbG9va3MgbGlrZSBcIm5vIHJlc3VsdHNcIik7XG4gKiAtIGRlcml2ZXMgaW52ZXJzZSByZWxhdGlvbnNoaXBzIGZyb20gdGhlIHNpbmdsZSBzdG9yZWQgZGlyZWN0aW9uO1xuICogLSBjYWNoZXMgZGVyaXZlZCByZXN1bHRzIHVudGlsIHRoZSBydW4gY2hhbmdlcy5cbiAqXG4gKiBFdmVyeSBxdWVyeSByZXR1cm5zIGB7b2s6IHRydWUsIHZhbHVlfWAgb3IgYHtvazogZmFsc2UsIGNvZGUsIG1lc3NhZ2V9YC4gTm9cbiAqIHF1ZXJ5IHRocm93cyBhY3Jvc3MgdGhlIGJvdW5kYXJ5LlxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge2ltcG9ydCgnLi9lbnRpdGllcy5qcycpLkFuYWx5c2lzUnVufSBBbmFseXNpc1J1blxuICogQHR5cGVkZWYge2ltcG9ydCgnLi9lbnRpdGllcy5qcycpLlJlbGF0aW9uc2hpcH0gUmVsYXRpb25zaGlwXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuL2VudGl0aWVzLmpzJykuU3ltYm9sUmVjb3JkfSBTeW1ib2xSZWNvcmRcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4vZW50aXRpZXMuanMnKS5Db250cm9sQ29uc3RydWN0fSBDb250cm9sQ29uc3RydWN0XG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuL2VudGl0aWVzLmpzJykuRGF0YUZhY3R9IERhdGFGYWN0XG4gKiBAdHlwZWRlZiB7e29rOiB0cnVlLCB2YWx1ZTogVH0gfCB7b2s6IGZhbHNlLCBjb2RlOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZ319IFF1ZXJ5UmVzdWx0XG4gKiBAdGVtcGxhdGUgVFxuICovXG5cbmNvbnN0IElOVkVSU0VfT0YgPSBPYmplY3QuZnJlZXplKHtcbiAgY2FsbHM6ICdjYWxsZWRfYnknLFxuICBkZWZpbmVzOiAnZGVmaW5lZF9pbicsXG4gIHJlZmVyZW5jZXM6ICdyZWZlcmVuY2VkX2J5JyxcbiAgZGVjbGFyZXM6ICdkZWNsYXJlZF9ieScsXG4gIHJlYWRzOiAncmVhZF9ieScsXG4gIHdyaXRlczogJ3dyaXR0ZW5fYnknLFxuICBjYXB0dXJlczogJ2NhcHR1cmVkX2J5Jyxcbn0pO1xuXG4vKipcbiAqIEBwYXJhbSB7QW5hbHlzaXNSdW59IHJ1blxuICogQHBhcmFtIHt7Y2FwYWJpbGl0aWVzPzogUmVjb3JkPHN0cmluZywgYm9vbGVhbnwncGFydGlhbCc+fX0gW29wdGlvbnNdXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVRdWVyeUxheWVyKHJ1biwgb3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IGNhcGFiaWxpdGllcyA9IE9iamVjdC5mcmVlemUoeyAuLi4ob3B0aW9ucy5jYXBhYmlsaXRpZXMgPz8ge30pIH0pO1xuICBjb25zdCBzeW1ib2xzID0gbmV3IE1hcChydW4uc3ltYm9scy5tYXAoKHN5bWJvbCkgPT4gW3N5bWJvbC5zeW1ib2xJZCwgc3ltYm9sXSkpO1xuICBjb25zdCBzeW1ib2xzQnlGaWxlID0gbmV3IE1hcCgpO1xuICBmb3IgKGNvbnN0IHN5bWJvbCBvZiBydW4uc3ltYm9scykge1xuICAgIGNvbnN0IGxpc3QgPSBzeW1ib2xzQnlGaWxlLmdldChzeW1ib2wuZGVjbGFyYXRpb24uZmlsZUlkKSA/PyBbXTtcbiAgICBsaXN0LnB1c2goc3ltYm9sKTtcbiAgICBzeW1ib2xzQnlGaWxlLnNldChzeW1ib2wuZGVjbGFyYXRpb24uZmlsZUlkLCBsaXN0KTtcbiAgfVxuICBmb3IgKGNvbnN0IGxpc3Qgb2Ygc3ltYm9sc0J5RmlsZS52YWx1ZXMoKSkge1xuICAgIGxpc3Quc29ydChieVN5bWJvbElkKTtcbiAgfVxuXG4gIGNvbnN0IG91dGdvaW5nQnlTeW1ib2wgPSBuZXcgTWFwKCk7XG4gIGNvbnN0IGluY29taW5nQnlTeW1ib2wgPSBuZXcgTWFwKCk7XG4gIGZvciAoY29uc3QgcmVsYXRpb25zaGlwIG9mIHJ1bi5yZWxhdGlvbnNoaXBzKSB7XG4gICAgY29uc3Qgb3V0Z29pbmcgPSBvdXRnb2luZ0J5U3ltYm9sLmdldChyZWxhdGlvbnNoaXAuZnJvbSkgPz8gW107XG4gICAgb3V0Z29pbmcucHVzaChyZWxhdGlvbnNoaXApO1xuICAgIG91dGdvaW5nQnlTeW1ib2wuc2V0KHJlbGF0aW9uc2hpcC5mcm9tLCBvdXRnb2luZyk7XG4gICAgY29uc3QgaW5jb21pbmcgPSBpbmNvbWluZ0J5U3ltYm9sLmdldChyZWxhdGlvbnNoaXAudG8pID8/IFtdO1xuICAgIGluY29taW5nLnB1c2gocmVsYXRpb25zaGlwKTtcbiAgICBpbmNvbWluZ0J5U3ltYm9sLnNldChyZWxhdGlvbnNoaXAudG8sIGluY29taW5nKTtcbiAgfVxuXG4gIGNvbnN0IGZhY3RzQnlTeW1ib2wgPSBuZXcgTWFwKCk7XG4gIGZvciAoY29uc3QgZmFjdCBvZiBydW4uZGF0YUZhY3RzKSB7XG4gICAgY29uc3QgbGlzdCA9IGZhY3RzQnlTeW1ib2wuZ2V0KGZhY3Quc3ltYm9sSWQpID8/IFtdO1xuICAgIGxpc3QucHVzaChmYWN0KTtcbiAgICBmYWN0c0J5U3ltYm9sLnNldChmYWN0LnN5bWJvbElkLCBsaXN0KTtcbiAgfVxuXG4gIGNvbnN0IGNvbnN0cnVjdHNCeVN5bWJvbCA9IG5ldyBNYXAoKTtcbiAgY29uc3QgY29uc3RydWN0QnlJZCA9IG5ldyBNYXAocnVuLmNvbnRyb2xDb25zdHJ1Y3RzLm1hcCgoaXRlbSkgPT4gW2l0ZW0uY29uc3RydWN0SWQsIGl0ZW1dKSk7XG4gIGZvciAoY29uc3QgY29uc3RydWN0IG9mIHJ1bi5jb250cm9sQ29uc3RydWN0cykge1xuICAgIGlmICghY29uc3RydWN0LnN5bWJvbElkKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgbGlzdCA9IGNvbnN0cnVjdHNCeVN5bWJvbC5nZXQoY29uc3RydWN0LnN5bWJvbElkKSA/PyBbXTtcbiAgICBsaXN0LnB1c2goY29uc3RydWN0KTtcbiAgICBjb25zdHJ1Y3RzQnlTeW1ib2wuc2V0KGNvbnN0cnVjdC5zeW1ib2xJZCwgbGlzdCk7XG4gIH1cblxuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIFJlbGF0aW9uc2hpcFtdPn0gKi9cbiAgbGV0IGludmVyc2VDYWNoZSA9IG5ldyBNYXAoKTtcbiAgbGV0IGNhY2hlVmVyc2lvbiA9IDA7XG4gIGxldCBjYWNoZUhpdHMgPSAwO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxuICAgKiBAcmV0dXJucyB7e29rOiBmYWxzZSwgY29kZTogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmd9fVxuICAgKi9cbiAgZnVuY3Rpb24gZmFpbChjb2RlLCBtZXNzYWdlKSB7XG4gICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBjb2RlLCBtZXNzYWdlIH07XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNhcGFiaWxpdHlcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZlYXR1cmVcbiAgICogQHJldHVybnMge3tvazogdHJ1ZX0gfCB7b2s6IGZhbHNlLCBjb2RlOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZ319XG4gICAqL1xuICBmdW5jdGlvbiByZXF1aXJlQ2FwYWJpbGl0eShjYXBhYmlsaXR5LCBmZWF0dXJlKSB7XG4gICAgY29uc3QgdmFsdWUgPSBjYXBhYmlsaXRpZXNbY2FwYWJpbGl0eV07XG4gICAgaWYgKHZhbHVlID09PSB0cnVlIHx8IHZhbHVlID09PSAncGFydGlhbCcpIHtcbiAgICAgIHJldHVybiB7IG9rOiB0cnVlIH07XG4gICAgfVxuICAgIHJldHVybiBmYWlsKFxuICAgICAgJ0VfVU5TVVBQT1JURUQnLFxuICAgICAgYCR7ZmVhdHVyZX0gaXMgbm90IGF2YWlsYWJsZTogYWRhcHRlciBcIiR7cnVuLmFkYXB0ZXJJZH1cIiBkb2VzIG5vdCBkZWNsYXJlICR7Y2FwYWJpbGl0eX0uYCxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEV2ZXJ5IGRlY2xhcmVkIHN5bWJvbCBpbiBkZXRlcm1pbmlzdGljIGlkIG9yZGVyLiBDb25zdW1lcnMgdGhhdCBuZWVkIHRoZVxuICAgKiB3aG9sZSBzZXQgKHRoZSBncmFwaCBidWlsZGVyKSB1c2UgdGhpcyBpbnN0ZWFkIG9mIHdhbGtpbmcgYHJ1bi5zeW1ib2xzYCxcbiAgICogc28gY29yZSBsYXllcnMgbmV2ZXIgYWNxdWlyZSBhIHNlY29uZCwgdW52YWxpZGF0ZWQgdmlldyBvZiBDU1IuXG4gICAqXG4gICAqIEByZXR1cm5zIHtRdWVyeVJlc3VsdDxTeW1ib2xSZWNvcmRbXT59XG4gICAqL1xuICBmdW5jdGlvbiBhbGxTeW1ib2xzKCkge1xuICAgIHJldHVybiB7IG9rOiB0cnVlLCB2YWx1ZTogWy4uLnJ1bi5zeW1ib2xzXS5zb3J0KGJ5U3ltYm9sSWQpIH07XG4gIH1cblxuICAvKipcbiAgICogRXZlcnkgc3RvcmVkIHJlbGF0aW9uc2hpcCBpbiBkZXRlcm1pbmlzdGljIGAodHlwZSwgZnJvbSwgdG8sIGlkKWAgb3JkZXIuXG4gICAqXG4gICAqIEByZXR1cm5zIHtRdWVyeVJlc3VsdDxSZWxhdGlvbnNoaXBbXT59XG4gICAqL1xuICBmdW5jdGlvbiBhbGxSZWxhdGlvbnNoaXBzKCkge1xuICAgIHJldHVybiB7IG9rOiB0cnVlLCB2YWx1ZTogWy4uLnJ1bi5yZWxhdGlvbnNoaXBzXS5zb3J0KGJ5UmVsYXRpb25zaGlwS2V5KSB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIHtRdWVyeVJlc3VsdDxBbmFseXNpc1J1blsnZGlhZ25vc3RpY3MnXT59XG4gICAqL1xuICBmdW5jdGlvbiBkaWFnbm9zdGljcygpIHtcbiAgICByZXR1cm4geyBvazogdHJ1ZSwgdmFsdWU6IFsuLi5ydW4uZGlhZ25vc3RpY3NdIH07XG4gIH1cblxuICAvKipcbiAgICogUnVuIG1ldGFkYXRhIHRoYXQgaXMgbm90IGEgcXVlcnkgcmVzdWx0OiBpZGVudGl0eSwgbGFuZ3VhZ2UsIHNjb3BlLCBhbmRcbiAgICogY29tcGxldGVuZXNzLiBDb3B5aW5nIGl0IHByZXZlbnRzIGEgY29uc3VtZXIgZnJvbSBtdXRhdGluZyB0aGUgcnVuLlxuICAgKlxuICAgKiBAcmV0dXJucyB7UXVlcnlSZXN1bHQ8e3J1bklkOiBzdHJpbmcsIGxhbmd1YWdlOiBzdHJpbmcsIGFkYXB0ZXJJZDogc3RyaW5nLCBhZGFwdGVyVmVyc2lvbjogc3RyaW5nLCBjc3JWZXJzaW9uOiBzdHJpbmcsIGNvbXBsZXRlbmVzczogc3RyaW5nLCBzY29wZToge2tpbmQ6IHN0cmluZywgcGF0aD86IHN0cmluZ319Pn1cbiAgICovXG4gIGZ1bmN0aW9uIHJ1bkluZm8oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiB0cnVlLFxuICAgICAgdmFsdWU6IHtcbiAgICAgICAgcnVuSWQ6IHJ1bi5ydW5JZCxcbiAgICAgICAgbGFuZ3VhZ2U6IHJ1bi5sYW5ndWFnZSxcbiAgICAgICAgYWRhcHRlcklkOiBydW4uYWRhcHRlcklkLFxuICAgICAgICBhZGFwdGVyVmVyc2lvbjogcnVuLmFkYXB0ZXJWZXJzaW9uLFxuICAgICAgICBjc3JWZXJzaW9uOiBydW4uY3NyVmVyc2lvbixcbiAgICAgICAgY29tcGxldGVuZXNzOiBydW4uY29tcGxldGVuZXNzLFxuICAgICAgICBzY29wZTogeyAuLi5ydW4uc2NvcGUgfSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3ltYm9sSWRcbiAgICogQHJldHVybnMge1F1ZXJ5UmVzdWx0PFN5bWJvbFJlY29yZD59XG4gICAqL1xuICBmdW5jdGlvbiBzeW1ib2xCeUlkKHN5bWJvbElkKSB7XG4gICAgaWYgKHR5cGVvZiBzeW1ib2xJZCAhPT0gJ3N0cmluZycgfHwgc3ltYm9sSWQubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gZmFpbCgnRV9RVUVSWScsICdzeW1ib2xJZCBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZy4nKTtcbiAgICB9XG4gICAgY29uc3Qgc3ltYm9sID0gc3ltYm9scy5nZXQoc3ltYm9sSWQpO1xuICAgIHJldHVybiBzeW1ib2wgPyB7IG9rOiB0cnVlLCB2YWx1ZTogc3ltYm9sIH0gOiBmYWlsKCdFX05PVF9GT1VORCcsIGBObyBzeW1ib2wgXCIke3N5bWJvbElkfVwiLmApO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlSWRcbiAgICogQHJldHVybnMge1F1ZXJ5UmVzdWx0PFN5bWJvbFJlY29yZFtdPn1cbiAgICovXG4gIGZ1bmN0aW9uIHN5bWJvbHNJbkZpbGUoZmlsZUlkKSB7XG4gICAgaWYgKHR5cGVvZiBmaWxlSWQgIT09ICdzdHJpbmcnIHx8IGZpbGVJZC5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBmYWlsKCdFX1FVRVJZJywgJ2ZpbGVJZCBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZy4nKTtcbiAgICB9XG4gICAgcmV0dXJuIHsgb2s6IHRydWUsIHZhbHVlOiBbLi4uKHN5bWJvbHNCeUZpbGUuZ2V0KGZpbGVJZCkgPz8gW10pXSB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7e3R5cGVzPzogc3RyaW5nW10sIHN0YXR1c2VzPzogc3RyaW5nW119fSBbZmlsdGVyXVxuICAgKiBAcmV0dXJucyB7UXVlcnlSZXN1bHQ8e3R5cGVzOiBzdHJpbmdbXXxudWxsLCBzdGF0dXNlczogc3RyaW5nW118bnVsbH0+fVxuICAgKi9cbiAgZnVuY3Rpb24gbm9ybWFsaXplRmlsdGVyKGZpbHRlciA9IHt9KSB7XG4gICAgY29uc3QgdHlwZXMgPSBmaWx0ZXIudHlwZXMgPT09IHVuZGVmaW5lZCA/IG51bGwgOiBmaWx0ZXIudHlwZXM7XG4gICAgY29uc3Qgc3RhdHVzZXMgPSBmaWx0ZXIuc3RhdHVzZXMgPT09IHVuZGVmaW5lZCA/IG51bGwgOiBmaWx0ZXIuc3RhdHVzZXM7XG4gICAgaWYgKFxuICAgICAgdHlwZXMgIT09IG51bGwgJiZcbiAgICAgICghQXJyYXkuaXNBcnJheSh0eXBlcykgfHwgdHlwZXMuc29tZSgodHlwZSkgPT4gdHlwZW9mIHR5cGUgIT09ICdzdHJpbmcnKSlcbiAgICApIHtcbiAgICAgIHJldHVybiBmYWlsKCdFX1FVRVJZJywgJ3R5cGVzIG11c3QgYmUgYW4gYXJyYXkgb2YgcmVsYXRpb25zaGlwIHR5cGVzLicpO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICBzdGF0dXNlcyAhPT0gbnVsbCAmJlxuICAgICAgKCFBcnJheS5pc0FycmF5KHN0YXR1c2VzKSB8fCBzdGF0dXNlcy5zb21lKChzdGF0dXMpID0+IHR5cGVvZiBzdGF0dXMgIT09ICdzdHJpbmcnKSlcbiAgICApIHtcbiAgICAgIHJldHVybiBmYWlsKCdFX1FVRVJZJywgJ3N0YXR1c2VzIG11c3QgYmUgYW4gYXJyYXkgb2YgcmVzb2x1dGlvbiBzdGF0dXNlcy4nKTtcbiAgICB9XG4gICAgcmV0dXJuIHsgb2s6IHRydWUsIHZhbHVlOiB7IHR5cGVzLCBzdGF0dXNlcyB9IH07XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtSZWxhdGlvbnNoaXB9IHJlbGF0aW9uc2hpcFxuICAgKiBAcGFyYW0ge3t0eXBlczogc3RyaW5nW118bnVsbCwgc3RhdHVzZXM6IHN0cmluZ1tdfG51bGx9fSBmaWx0ZXJcbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuICBmdW5jdGlvbiBtYXRjaGVzKHJlbGF0aW9uc2hpcCwgZmlsdGVyKSB7XG4gICAgaWYgKGZpbHRlci50eXBlcyAmJiAhZmlsdGVyLnR5cGVzLmluY2x1ZGVzKHJlbGF0aW9uc2hpcC50eXBlKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoZmlsdGVyLnN0YXR1c2VzICYmICFmaWx0ZXIuc3RhdHVzZXMuaW5jbHVkZXMocmVsYXRpb25zaGlwLnN0YXR1cykpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogU3RvcmVkIHJlbGF0aW9uc2hpcHMgdGhhdCBsZWF2ZSBhIHN5bWJvbC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN5bWJvbElkXG4gICAqIEBwYXJhbSB7e3R5cGVzPzogc3RyaW5nW10sIHN0YXR1c2VzPzogc3RyaW5nW119fSBbZmlsdGVyXVxuICAgKiBAcmV0dXJucyB7UXVlcnlSZXN1bHQ8UmVsYXRpb25zaGlwW10+fVxuICAgKi9cbiAgZnVuY3Rpb24gb3V0Z29pbmcoc3ltYm9sSWQsIGZpbHRlcikge1xuICAgIGlmICh0eXBlb2Ygc3ltYm9sSWQgIT09ICdzdHJpbmcnIHx8ICFzeW1ib2xzLmhhcyhzeW1ib2xJZCkpIHtcbiAgICAgIHJldHVybiBmYWlsKCdFX05PVF9GT1VORCcsIGBObyBzeW1ib2wgXCIke1N0cmluZyhzeW1ib2xJZCl9XCIuYCk7XG4gICAgfVxuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVGaWx0ZXIoZmlsdGVyKTtcbiAgICBpZiAoIW5vcm1hbGl6ZWQub2spIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVkO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgb2s6IHRydWUsXG4gICAgICB2YWx1ZTogKG91dGdvaW5nQnlTeW1ib2wuZ2V0KHN5bWJvbElkKSA/PyBbXSkuZmlsdGVyKChyZWxhdGlvbnNoaXApID0+XG4gICAgICAgIG1hdGNoZXMocmVsYXRpb25zaGlwLCBub3JtYWxpemVkLnZhbHVlKSxcbiAgICAgICksXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXZlcnNlIHZpZXcgb2Ygc3RvcmVkIHJlbGF0aW9uc2hpcHMuIFRoZSByZXN1bHQgaXMgZGVyaXZlZCwgbmV2ZXIgc3RvcmVkLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3ltYm9sSWRcbiAgICogQHBhcmFtIHt7dHlwZXM/OiBzdHJpbmdbXSwgc3RhdHVzZXM/OiBzdHJpbmdbXX19IFtmaWx0ZXJdXG4gICAqIEByZXR1cm5zIHtRdWVyeVJlc3VsdDxSZWxhdGlvbnNoaXBbXT59XG4gICAqL1xuICBmdW5jdGlvbiBpbmNvbWluZyhzeW1ib2xJZCwgZmlsdGVyKSB7XG4gICAgaWYgKHR5cGVvZiBzeW1ib2xJZCAhPT0gJ3N0cmluZycgfHwgIXN5bWJvbHMuaGFzKHN5bWJvbElkKSkge1xuICAgICAgcmV0dXJuIGZhaWwoJ0VfTk9UX0ZPVU5EJywgYE5vIHN5bWJvbCBcIiR7U3RyaW5nKHN5bWJvbElkKX1cIi5gKTtcbiAgICB9XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZUZpbHRlcihmaWx0ZXIpO1xuICAgIGlmICghbm9ybWFsaXplZC5vaykge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG4gICAgfVxuICAgIGNvbnN0IGtleSA9IGAke2NhY2hlVmVyc2lvbn18JHtzeW1ib2xJZH18JHtKU09OLnN0cmluZ2lmeShub3JtYWxpemVkLnZhbHVlKX1gO1xuICAgIGNvbnN0IGNhY2hlZCA9IGludmVyc2VDYWNoZS5nZXQoa2V5KTtcbiAgICBpZiAoY2FjaGVkKSB7XG4gICAgICBjYWNoZUhpdHMgKz0gMTtcbiAgICAgIHJldHVybiB7IG9rOiB0cnVlLCB2YWx1ZTogY2FjaGVkIH07XG4gICAgfVxuICAgIGNvbnN0IGRlcml2ZWQgPSAoaW5jb21pbmdCeVN5bWJvbC5nZXQoc3ltYm9sSWQpID8/IFtdKVxuICAgICAgLmZpbHRlcihcbiAgICAgICAgKHJlbGF0aW9uc2hpcCkgPT5cbiAgICAgICAgICBub3JtYWxpemVkLnZhbHVlLnN0YXR1c2VzID09PSBudWxsIHx8XG4gICAgICAgICAgbm9ybWFsaXplZC52YWx1ZS5zdGF0dXNlcy5pbmNsdWRlcyhyZWxhdGlvbnNoaXAuc3RhdHVzKSxcbiAgICAgIClcbiAgICAgIC5maWx0ZXIoXG4gICAgICAgIChyZWxhdGlvbnNoaXApID0+XG4gICAgICAgICAgbm9ybWFsaXplZC52YWx1ZS50eXBlcyA9PT0gbnVsbCB8fFxuICAgICAgICAgIG5vcm1hbGl6ZWQudmFsdWUudHlwZXMuaW5jbHVkZXMocmVsYXRpb25zaGlwLnR5cGUpIHx8XG4gICAgICAgICAgbm9ybWFsaXplZC52YWx1ZS50eXBlcy5pbmNsdWRlcyhJTlZFUlNFX09GW3JlbGF0aW9uc2hpcC50eXBlXSksXG4gICAgICApXG4gICAgICAubWFwKChyZWxhdGlvbnNoaXApID0+IGludmVydFJlbGF0aW9uc2hpcChyZWxhdGlvbnNoaXApKTtcbiAgICBpbnZlcnNlQ2FjaGUuc2V0KGtleSwgZGVyaXZlZCk7XG4gICAgcmV0dXJuIHsgb2s6IHRydWUsIHZhbHVlOiBkZXJpdmVkIH07XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN5bWJvbElkXG4gICAqIEBwYXJhbSB7e3N0YXR1c2VzPzogc3RyaW5nW119fSBbZmlsdGVyXVxuICAgKiBAcmV0dXJucyB7UXVlcnlSZXN1bHQ8QXJyYXk8e3N5bWJvbDogU3ltYm9sUmVjb3JkLCByZWxhdGlvbnNoaXA6IFJlbGF0aW9uc2hpcH0+Pn1cbiAgICovXG4gIGZ1bmN0aW9uIGNhbGxlcnMoc3ltYm9sSWQsIGZpbHRlcikge1xuICAgIGNvbnN0IGNhcGFiaWxpdHkgPSByZXF1aXJlQ2FwYWJpbGl0eSgncmVzb2x2ZUNhbGxzJywgJ0NhbGxlciBxdWVyaWVzJyk7XG4gICAgaWYgKCFjYXBhYmlsaXR5Lm9rKSB7XG4gICAgICByZXR1cm4gY2FwYWJpbGl0eTtcbiAgICB9XG4gICAgY29uc3QgZGVyaXZlZCA9IGluY29taW5nKHN5bWJvbElkLCB7XG4gICAgICB0eXBlczogWydjYWxscycsICdjYWxsZWRfYnknXSxcbiAgICAgIHN0YXR1c2VzOiBmaWx0ZXI/LnN0YXR1c2VzLFxuICAgIH0pO1xuICAgIGlmICghZGVyaXZlZC5vaykge1xuICAgICAgcmV0dXJuIGRlcml2ZWQ7XG4gICAgfVxuICAgIC8qKiBAdHlwZSB7QXJyYXk8e3N5bWJvbDogU3ltYm9sUmVjb3JkLCByZWxhdGlvbnNoaXA6IFJlbGF0aW9uc2hpcH0+fSAqL1xuICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xuICAgIGZvciAoY29uc3QgcmVsYXRpb25zaGlwIG9mIGRlcml2ZWQudmFsdWUpIHtcbiAgICAgIC8vIGBjYWxsZWRfYnlgIGlzIHNvdXJjZWQgYXQgdGhlIGNhbGxlZSBhbmQgdGFyZ2V0cyB0aGUgY2FsbGVyLCBzbyB0aGVcbiAgICAgIC8vIGNhbGxlciBpcyB0aGUgaW52ZXJzZSByZWxhdGlvbnNoaXAncyBgdG9gLlxuICAgICAgY29uc3QgY2FsbGVyID0gc3ltYm9scy5nZXQocmVsYXRpb25zaGlwLnRvKTtcbiAgICAgIGlmIChjYWxsZXIpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goeyBzeW1ib2w6IGNhbGxlciwgcmVsYXRpb25zaGlwIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4geyBvazogdHJ1ZSwgdmFsdWU6IHJlc3VsdCB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzeW1ib2xJZFxuICAgKiBAcGFyYW0ge3tzdGF0dXNlcz86IHN0cmluZ1tdfX0gW2ZpbHRlcl1cbiAgICogQHJldHVybnMge1F1ZXJ5UmVzdWx0PEFycmF5PHtzeW1ib2w6IFN5bWJvbFJlY29yZCwgcmVsYXRpb25zaGlwOiBSZWxhdGlvbnNoaXAsIGV4dGVybmFsOiBib29sZWFufT4+fVxuICAgKi9cbiAgZnVuY3Rpb24gY2FsbGVlcyhzeW1ib2xJZCwgZmlsdGVyKSB7XG4gICAgY29uc3QgY2FwYWJpbGl0eSA9IHJlcXVpcmVDYXBhYmlsaXR5KCdyZXNvbHZlQ2FsbHMnLCAnQ2FsbGVlIHF1ZXJpZXMnKTtcbiAgICBpZiAoIWNhcGFiaWxpdHkub2spIHtcbiAgICAgIHJldHVybiBjYXBhYmlsaXR5O1xuICAgIH1cbiAgICBjb25zdCBzdG9yZWQgPSBvdXRnb2luZyhzeW1ib2xJZCwgeyB0eXBlczogWydjYWxscyddLCBzdGF0dXNlczogZmlsdGVyPy5zdGF0dXNlcyB9KTtcbiAgICBpZiAoIXN0b3JlZC5vaykge1xuICAgICAgcmV0dXJuIHN0b3JlZDtcbiAgICB9XG4gICAgLyoqIEB0eXBlIHtBcnJheTx7c3ltYm9sOiBTeW1ib2xSZWNvcmQsIHJlbGF0aW9uc2hpcDogUmVsYXRpb25zaGlwLCBleHRlcm5hbDogYm9vbGVhbn0+fSAqL1xuICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xuICAgIGZvciAoY29uc3QgcmVsYXRpb25zaGlwIG9mIHN0b3JlZC52YWx1ZSkge1xuICAgICAgY29uc3QgdGFyZ2V0ID0gc3ltYm9scy5nZXQocmVsYXRpb25zaGlwLnRvKTtcbiAgICAgIGlmICh0YXJnZXQpIHtcbiAgICAgICAgcmVzdWx0LnB1c2goeyBzeW1ib2w6IHRhcmdldCwgcmVsYXRpb25zaGlwLCBleHRlcm5hbDogZmFsc2UgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQucHVzaCh7XG4gICAgICAgICAgc3ltYm9sOiB7XG4gICAgICAgICAgICBzeW1ib2xJZDogcmVsYXRpb25zaGlwLnRvLFxuICAgICAgICAgICAga2luZDogJ3Vua25vd24nLFxuICAgICAgICAgICAgbmFtZTogcmVsYXRpb25zaGlwLnRvLFxuICAgICAgICAgICAgcXVhbGlmaWVkTmFtZTogcmVsYXRpb25zaGlwLnRvLFxuICAgICAgICAgICAgbGFuZ3VhZ2U6IHJ1bi5sYW5ndWFnZSxcbiAgICAgICAgICAgIGRlY2xhcmF0aW9uOiB7IGZpbGVJZDogJycsIHN0YXJ0TGluZTogMCwgc3RhcnRDb2x1bW46IDAsIGVuZExpbmU6IDAsIGVuZENvbHVtbjogMCB9LFxuICAgICAgICAgICAgdmlzaWJpbGl0eTogJ3Vua25vd24nLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVsYXRpb25zaGlwLFxuICAgICAgICAgIGV4dGVybmFsOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHsgb2s6IHRydWUsIHZhbHVlOiByZXN1bHQgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBIGZsYXQgY29uc3RydWN0IGxpc3QgcGx1cyBhIHJlc29sdmVkIHRyZWUuIFBoYXNlIDQgcmVuZGVycyB0aGUgdHJlZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN5bWJvbElkXG4gICAqIEByZXR1cm5zIHtRdWVyeVJlc3VsdDx7Y29uc3RydWN0czogQ29udHJvbENvbnN0cnVjdFtdLCByb290czogQ29udHJvbENvbnN0cnVjdFtdLCBieUlkOiBSZWNvcmQ8c3RyaW5nLCBDb250cm9sQ29uc3RydWN0Pn0+fVxuICAgKi9cbiAgZnVuY3Rpb24gY29uc3RydWN0c09mKHN5bWJvbElkKSB7XG4gICAgY29uc3QgY2FwYWJpbGl0eSA9IHJlcXVpcmVDYXBhYmlsaXR5KCdnZW5lcmF0ZUNGRycsICdDb250cm9sLWZsb3cgcXVlcmllcycpO1xuICAgIGlmICghY2FwYWJpbGl0eS5vaykge1xuICAgICAgcmV0dXJuIGNhcGFiaWxpdHk7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygc3ltYm9sSWQgIT09ICdzdHJpbmcnIHx8ICFzeW1ib2xzLmhhcyhzeW1ib2xJZCkpIHtcbiAgICAgIHJldHVybiBmYWlsKCdFX05PVF9GT1VORCcsIGBObyBzeW1ib2wgXCIke1N0cmluZyhzeW1ib2xJZCl9XCIuYCk7XG4gICAgfVxuICAgIGNvbnN0IGNvbnN0cnVjdHMgPSBjb25zdHJ1Y3RzQnlTeW1ib2wuZ2V0KHN5bWJvbElkKSA/PyBbXTtcbiAgICBjb25zdCByb290cyA9IGNvbnN0cnVjdHMuZmlsdGVyKFxuICAgICAgKGNvbnN0cnVjdCkgPT4gIWNvbnN0cnVjdC5wYXJlbnRJZCB8fCAhY29uc3RydWN0QnlJZC5oYXMoY29uc3RydWN0LnBhcmVudElkKSxcbiAgICApO1xuICAgIC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgQ29udHJvbENvbnN0cnVjdD59ICovXG4gICAgY29uc3QgYnlJZCA9IHt9O1xuICAgIGZvciAoY29uc3QgY29uc3RydWN0IG9mIGNvbnN0cnVjdHMpIHtcbiAgICAgIGJ5SWRbY29uc3RydWN0LmNvbnN0cnVjdElkXSA9IGNvbnN0cnVjdDtcbiAgICB9XG4gICAgcmV0dXJuIHsgb2s6IHRydWUsIHZhbHVlOiB7IGNvbnN0cnVjdHMsIHJvb3RzLCBieUlkIH0gfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3ltYm9sSWRcbiAgICogQHJldHVybnMge1F1ZXJ5UmVzdWx0PERhdGFGYWN0W10+fVxuICAgKi9cbiAgZnVuY3Rpb24gZGF0YUZhY3RzT2Yoc3ltYm9sSWQpIHtcbiAgICBjb25zdCBjYXBhYmlsaXR5ID0gcmVxdWlyZUNhcGFiaWxpdHkoJ2dlbmVyYXRlREZHJywgJ0RhdGEtZmxvdyBxdWVyaWVzJyk7XG4gICAgaWYgKCFjYXBhYmlsaXR5Lm9rKSB7XG4gICAgICByZXR1cm4gY2FwYWJpbGl0eTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBzeW1ib2xJZCAhPT0gJ3N0cmluZycgfHwgIXN5bWJvbHMuaGFzKHN5bWJvbElkKSkge1xuICAgICAgcmV0dXJuIGZhaWwoJ0VfTk9UX0ZPVU5EJywgYE5vIHN5bWJvbCBcIiR7U3RyaW5nKHN5bWJvbElkKX1cIi5gKTtcbiAgICB9XG4gICAgcmV0dXJuIHsgb2s6IHRydWUsIHZhbHVlOiBbLi4uKGZhY3RzQnlTeW1ib2wuZ2V0KHN5bWJvbElkKSA/PyBbXSldIH07XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMge1F1ZXJ5UmVzdWx0PFJlY29yZDxzdHJpbmcsIGJvb2xlYW58J3BhcnRpYWwnPj59XG4gICAqL1xuICBmdW5jdGlvbiBjYXBhYmlsaXRpZXNPZigpIHtcbiAgICByZXR1cm4geyBvazogdHJ1ZSwgdmFsdWU6IHsgLi4uY2FwYWJpbGl0aWVzIH0gfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgYWxsU3ltYm9scyxcbiAgICBhbGxSZWxhdGlvbnNoaXBzLFxuICAgIGRpYWdub3N0aWNzLFxuICAgIHJ1bkluZm8sXG4gICAgc3ltYm9sQnlJZCxcbiAgICBzeW1ib2xzSW5GaWxlLFxuICAgIG91dGdvaW5nLFxuICAgIGluY29taW5nLFxuICAgIGNhbGxlcnMsXG4gICAgY2FsbGVlcyxcbiAgICBjb25zdHJ1Y3RzT2YsXG4gICAgZGF0YUZhY3RzT2YsXG4gICAgY2FwYWJpbGl0aWVzOiBjYXBhYmlsaXRpZXNPZixcbiAgICBpbnZhbGlkYXRlKCkge1xuICAgICAgaW52ZXJzZUNhY2hlID0gbmV3IE1hcCgpO1xuICAgICAgY2FjaGVWZXJzaW9uICs9IDE7XG4gICAgfSxcbiAgICBzdGF0czogKCkgPT4gKHsgY2FjaGVIaXRzLCBjYWNoZVZlcnNpb24sIGludmVyc2VFbnRyaWVzOiBpbnZlcnNlQ2FjaGUuc2l6ZSB9KSxcbiAgfTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlbGF0aW9uc2hpcH0gcmVsYXRpb25zaGlwXG4gKiBAcmV0dXJucyB7UmVsYXRpb25zaGlwfVxuICovXG5mdW5jdGlvbiBpbnZlcnRSZWxhdGlvbnNoaXAocmVsYXRpb25zaGlwKSB7XG4gIC8qKiBAdHlwZSB7UmVsYXRpb25zaGlwfSAqL1xuICBjb25zdCBpbnZlcnNlID0ge1xuICAgIHJlbGF0aW9uc2hpcElkOiBgaW52ZXJzZToke3JlbGF0aW9uc2hpcC5yZWxhdGlvbnNoaXBJZH1gLFxuICAgIHR5cGU6IElOVkVSU0VfT0ZbcmVsYXRpb25zaGlwLnR5cGVdID8/IHJlbGF0aW9uc2hpcC50eXBlLFxuICAgIGZyb206IHJlbGF0aW9uc2hpcC50byxcbiAgICB0bzogcmVsYXRpb25zaGlwLmZyb20sXG4gICAgc3RhdHVzOiByZWxhdGlvbnNoaXAuc3RhdHVzLFxuICAgIGV2aWRlbmNlOiByZWxhdGlvbnNoaXAuZXZpZGVuY2UgPz8gW10sXG4gIH07XG4gIGlmIChyZWxhdGlvbnNoaXAucmVhc29uQ29kZSkge1xuICAgIGludmVyc2UucmVhc29uQ29kZSA9IHJlbGF0aW9uc2hpcC5yZWFzb25Db2RlO1xuICB9XG4gIGlmIChyZWxhdGlvbnNoaXAuc2l0ZSkge1xuICAgIGludmVyc2Uuc2l0ZSA9IHJlbGF0aW9uc2hpcC5zaXRlO1xuICB9XG4gIHJldHVybiBpbnZlcnNlO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7U3ltYm9sUmVjb3JkfSBhXG4gKiBAcGFyYW0ge1N5bWJvbFJlY29yZH0gYlxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gYnlTeW1ib2xJZChhLCBiKSB7XG4gIHJldHVybiBhLnN5bWJvbElkIDwgYi5zeW1ib2xJZCA/IC0xIDogYS5zeW1ib2xJZCA+IGIuc3ltYm9sSWQgPyAxIDogMDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlbGF0aW9uc2hpcH0gYVxuICogQHBhcmFtIHtSZWxhdGlvbnNoaXB9IGJcbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIGJ5UmVsYXRpb25zaGlwS2V5KGEsIGIpIHtcbiAgZm9yIChjb25zdCBbbGVmdCwgcmlnaHRdIG9mIFtcbiAgICBbYS50eXBlLCBiLnR5cGVdLFxuICAgIFthLmZyb20sIGIuZnJvbV0sXG4gICAgW2EudG8sIGIudG9dLFxuICAgIFthLnJlbGF0aW9uc2hpcElkLCBiLnJlbGF0aW9uc2hpcElkXSxcbiAgXSkge1xuICAgIGlmIChsZWZ0IDwgcmlnaHQpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgaWYgKGxlZnQgPiByaWdodCkge1xuICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICB9XG4gIHJldHVybiAwO1xufVxuIiwgIi8qKlxuICogTGFuZ3VhZ2UgYWRhcHRlciByZWdpc3RyeS5cbiAqXG4gKiBUaGUgcmVnaXN0cnkgaXMgdGhlIG9ubHkgcGxhY2UgdGhhdCBrbm93cyB3aGljaCBhZGFwdGVycyBleGlzdC4gRXZlcnl0aGluZ1xuICogYWJvdmUgaXQgKHF1ZXJpZXMsIGdyYXBoIGNvbnN0cnVjdGlvbiwgcmVuZGVyaW5nLCBwcm90b2NvbCkgd29ya3MgZnJvbSBDU1JcbiAqIGFsb25lLlxuICpcbiAqIFJlc3BvbnNpYmlsaXRpZXM6XG4gKiAtIHJlZ2lzdHJhdGlvbiB3aXRoIGNhcGFiaWxpdHkgZGVjbGFyYXRpb24gYW5kIGV4dGVuc2lvbiBwcmVjZWRlbmNlO1xuICogLSBpbnB1dCB2YWxpZGF0aW9uIGFuZCBjYW5jZWxsYXRpb24gcGx1bWJpbmc7XG4gKiAtIGZhdWx0IGlzb2xhdGlvbjogYSB0aHJvd2luZyBhZGFwdGVyIGJlY29tZXMgYSBwYXJ0aWFsIHJ1biBwbHVzIGRpYWdub3N0aWM7XG4gKiAtIG1pZ3JhdGlvbiBhbmQgZGVmZW5zaXZlIHZhbGlkYXRpb24gYXQgdGhlIGJvdW5kYXJ5O1xuICogLSBhIGRyeS1ydW4gbW9kZSB0aGF0IG1hcHMgZmlsZXMgdG8gYWRhcHRlcnMgd2l0aG91dCBhbmFseXNpbmcgYW55dGhpbmcuXG4gKi9cblxuaW1wb3J0IHsgY3JlYXRlRGVncmFkZWRSdW4gfSBmcm9tICcuL2Nzci9lbnRpdGllcy5qcyc7XG5pbXBvcnQge1xuICBDYW5jZWxsYXRpb25FcnJvcixcbiAgaXNDYW5jZWxsYXRpb25SZXF1ZXN0ZWQsXG4gIHRva2VuRnJvbUFib3J0U2lnbmFsLFxufSBmcm9tICcuL2Nzci9jYW5jZWxsYXRpb24uanMnO1xuaW1wb3J0IHsgbWlncmF0ZVJ1biB9IGZyb20gJy4vY3NyL21pZ3JhdGUuanMnO1xuaW1wb3J0IHsgY3JlYXRlUXVlcnlMYXllciB9IGZyb20gJy4vY3NyL3F1ZXJ5LmpzJztcbmltcG9ydCB7IENTUl9WRVJTSU9OLCBDQVBBQklMSVRZX0tFWVMsIGlzQ29tcGF0aWJsZUNzclZlcnNpb24gfSBmcm9tICcuL2Nzci90eXBlcy5qcyc7XG5pbXBvcnQgeyB2YWxpZGF0ZUFuYWx5c2lzUnVuIH0gZnJvbSAnLi9jc3IvdmFsaWRhdGUuanMnO1xuXG4vKiogQHR5cGVkZWYge2ltcG9ydCgnLi9jc3IvZW50aXRpZXMuanMnKS5BbmFseXNpc1J1bn0gQW5hbHlzaXNSdW4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBDYXBhYmlsaXR5U2V0XG4gKiBAcHJvcGVydHkge2Jvb2xlYW58J3BhcnRpYWwnfSBwYXJzZVxuICogQHByb3BlcnR5IHtib29sZWFufCdwYXJ0aWFsJ30gZGlzY292ZXJEZWNsYXJhdGlvbnNcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbnwncGFydGlhbCd9IHJlc29sdmVTeW1ib2xzXG4gKiBAcHJvcGVydHkge2Jvb2xlYW58J3BhcnRpYWwnfSByZXNvbHZlVHlwZXNcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbnwncGFydGlhbCd9IHJlc29sdmVDYWxsc1xuICogQHByb3BlcnR5IHtib29sZWFufCdwYXJ0aWFsJ30gZ2VuZXJhdGVDRkdcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbnwncGFydGlhbCd9IGdlbmVyYXRlREZHXG4gKiBAcHJvcGVydHkge2Jvb2xlYW58J3BhcnRpYWwnfSByZXNvbHZlSW1wb3J0c1xuICogQHByb3BlcnR5IHtib29sZWFufCdwYXJ0aWFsJ30gbWFwU291cmNlTG9jYXRpb25zXG4gKiBAcHJvcGVydHkge2Jvb2xlYW58J3BhcnRpYWwnfSByZXBvcnREaWFnbm9zdGljc1xuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gQWRhcHRlckRlc2NyaXB0b3JcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBpZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGRpc3BsYXlOYW1lXG4gKiBAcHJvcGVydHkge3N0cmluZ30gdmVyc2lvblxuICogQHByb3BlcnR5IHtzdHJpbmdbXX0gbGFuZ3VhZ2VzXG4gKiBAcHJvcGVydHkge3N0cmluZ1tdfSBleHRlbnNpb25zXG4gKiBAcHJvcGVydHkge0NhcGFiaWxpdHlTZXR9IGNhcGFiaWxpdGllc1xuICogQHByb3BlcnR5IHsoaW5wdXQ6IEFuYWx5emVJbnB1dCkgPT4gQW5hbHlzaXNSdW4gfCBQcm9taXNlPEFuYWx5c2lzUnVuPn0gYW5hbHl6ZVxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gQW5hbHl6ZUlucHV0XG4gKiBAcHJvcGVydHkge3N0cmluZ30gcnVuSWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBwYXRoXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRdXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW2xhbmd1YWdlXVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFt3b3Jrc3BhY2VSb290XVxuICogQHByb3BlcnR5IHt7cmVhZEZpbGU6IChwYXRoOiBzdHJpbmcpID0+IFByb21pc2U8c3RyaW5nPn19IFtzb3VyY2VdXG4gKiBAcHJvcGVydHkge2ltcG9ydCgnLi9jc3IvY2FuY2VsbGF0aW9uLmpzJykuQ2FuY2VsbGF0aW9uVG9rZW4gfCBBYm9ydFNpZ25hbH0gW2NhbmNlbGxhdGlvbl1cbiAqIEBwcm9wZXJ0eSB7KHByb2dyZXNzOiB7cGhhc2U6IHN0cmluZywgZnJhY3Rpb24/OiBudW1iZXJ9KSA9PiB2b2lkfSBbcHJvZ3Jlc3NdXG4gKi9cblxuY29uc3QgQ0FQQUJJTElUWV9WQUxVRVMgPSBuZXcgU2V0KFt0cnVlLCBmYWxzZSwgJ3BhcnRpYWwnXSk7XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW2lucHV0XVxuICogQHJldHVybnMge0NhcGFiaWxpdHlTZXR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDYXBhYmlsaXRpZXMoaW5wdXQgPSB7fSkge1xuICAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIGJvb2xlYW58J3BhcnRpYWwnPn0gKi9cbiAgY29uc3QgY2FwYWJpbGl0aWVzID0ge307XG4gIGZvciAoY29uc3Qga2V5IG9mIENBUEFCSUxJVFlfS0VZUykge1xuICAgIGNvbnN0IHZhbHVlID0gaW5wdXRba2V5XTtcbiAgICBjYXBhYmlsaXRpZXNba2V5XSA9IENBUEFCSUxJVFlfVkFMVUVTLmhhcyh2YWx1ZSlcbiAgICAgID8gLyoqIEB0eXBlIHtib29sZWFufCdwYXJ0aWFsJ30gKi8gKHZhbHVlKVxuICAgICAgOiBmYWxzZTtcbiAgfVxuICByZXR1cm4gLyoqIEB0eXBlIHtDYXBhYmlsaXR5U2V0fSAqLyAoY2FwYWJpbGl0aWVzKTtcbn1cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBBbmFseXplU3VjY2Vzc1xuICogQHByb3BlcnR5IHt0cnVlfSBva1xuICogQHByb3BlcnR5IHtBbmFseXNpc1J1bn0gcnVuXG4gKiBAcHJvcGVydHkge3N0cmluZ30gYWRhcHRlcklkXG4gKiBAcHJvcGVydHkge251bWJlcn0gZHVyYXRpb25Nc1xuICogQHByb3BlcnR5IHt7Y29kZTogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmd9fSBbZGVncmFkZWRdXG4gKiBAcHJvcGVydHkge0FycmF5PHtwYXRoOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZ30+fSBbaXNzdWVzXVxuICogQHByb3BlcnR5IHtBcnJheTx7Y29sbGVjdGlvbjogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIGlkPzogc3RyaW5nfT59IFtkcm9wcGVkXVxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gQW5hbHl6ZUZhaWx1cmVcbiAqIEBwcm9wZXJ0eSB7ZmFsc2V9IG9rXG4gKiBAcHJvcGVydHkgeydFX1VOU1VQUE9SVEVEJ3wnRV9JTlBVVCd8J0VfQURBUFRFUid8J0VfVkFMSURBVElPTid8J0VfVkVSU0lPTid8J0VfTElNSVQnfSBjb2RlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbWVzc2FnZVxuICogQHByb3BlcnR5IHtBcnJheTx7cGF0aDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmd9Pn0gW2lzc3Vlc11cbiAqL1xuXG4vKipcbiAqIEByZXR1cm5zIHt7XG4gKiAgIHJlZ2lzdGVyOiAoZGVzY3JpcHRvcjogQWRhcHRlckRlc2NyaXB0b3IpID0+IHZvaWQsXG4gKiAgIGxpc3Q6ICgpID0+IEFkYXB0ZXJEZXNjcmlwdG9yW10sXG4gKiAgIHJlc29sdmU6IChmaWxlUGF0aDogc3RyaW5nKSA9PiBBZGFwdGVyRGVzY3JpcHRvciB8IG51bGwsXG4gKiAgIGFuYWx5emU6IChpbnB1dDogQW5hbHl6ZUlucHV0LCBvcHRpb25zPzoge21vZGU/OiAnc3RyaWN0J3wnZGVmZW5zaXZlJ30pID0+IFByb21pc2U8QW5hbHl6ZVN1Y2Nlc3MgfCBBbmFseXplRmFpbHVyZT4sXG4gKiAgIGRyeVJ1bjogKHBhdGhzOiBzdHJpbmdbXSkgPT4ge29rOiB0cnVlLCB2YWx1ZTogQXJyYXk8e3BhdGg6IHN0cmluZywgYWRhcHRlcklkOiBzdHJpbmd8bnVsbH0+fSxcbiAqICAgcXVlcnk6IChydW46IEFuYWx5c2lzUnVuKSA9PiBSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVRdWVyeUxheWVyPixcbiAqICAgY2FwYWJpbGl0eU1hdHJpeDogKCkgPT4gQXJyYXk8e2lkOiBzdHJpbmcsIGxhbmd1YWdlczogc3RyaW5nW10sIGNhcGFiaWxpdGllczogQ2FwYWJpbGl0eVNldH0+LFxuICogfX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUFkYXB0ZXJSZWdpc3RyeSgpIHtcbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBBZGFwdGVyRGVzY3JpcHRvcj59ICovXG4gIGNvbnN0IGFkYXB0ZXJzID0gbmV3IE1hcCgpO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0FkYXB0ZXJEZXNjcmlwdG9yfSBkZXNjcmlwdG9yXG4gICAqL1xuICBmdW5jdGlvbiByZWdpc3RlcihkZXNjcmlwdG9yKSB7XG4gICAgaWYgKCFkZXNjcmlwdG9yIHx8IHR5cGVvZiBkZXNjcmlwdG9yICE9PSAnb2JqZWN0Jykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQWRhcHRlciBkZXNjcmlwdG9yIG11c3QgYmUgYW4gb2JqZWN0LicpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGRlc2NyaXB0b3IuaWQgIT09ICdzdHJpbmcnIHx8IGRlc2NyaXB0b3IuaWQubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBZGFwdGVyIGRlc2NyaXB0b3IgcmVxdWlyZXMgYSBub24tZW1wdHkgaWQuJyk7XG4gICAgfVxuICAgIGlmIChhZGFwdGVycy5oYXMoZGVzY3JpcHRvci5pZCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQWRhcHRlciBcIiR7ZGVzY3JpcHRvci5pZH1cIiBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQuYCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgZGVzY3JpcHRvci5kaXNwbGF5TmFtZSAhPT0gJ3N0cmluZycgfHwgZGVzY3JpcHRvci5kaXNwbGF5TmFtZS5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYEFkYXB0ZXIgXCIke2Rlc2NyaXB0b3IuaWR9XCIgcmVxdWlyZXMgYSBkaXNwbGF5TmFtZS5gKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBkZXNjcmlwdG9yLnZlcnNpb24gIT09ICdzdHJpbmcnIHx8IGRlc2NyaXB0b3IudmVyc2lvbi5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYEFkYXB0ZXIgXCIke2Rlc2NyaXB0b3IuaWR9XCIgcmVxdWlyZXMgYSB2ZXJzaW9uLmApO1xuICAgIH1cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoZGVzY3JpcHRvci5sYW5ndWFnZXMpIHx8IGRlc2NyaXB0b3IubGFuZ3VhZ2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgQWRhcHRlciBcIiR7ZGVzY3JpcHRvci5pZH1cIiBtdXN0IGRlY2xhcmUgYXQgbGVhc3Qgb25lIGxhbmd1YWdlLmApO1xuICAgIH1cbiAgICBjb25zdCBleHRlbnNpb25zID0gZGVzY3JpcHRvci5leHRlbnNpb25zO1xuICAgIGlmICghQXJyYXkuaXNBcnJheShleHRlbnNpb25zKSB8fCBleHRlbnNpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgQWRhcHRlciBcIiR7ZGVzY3JpcHRvci5pZH1cIiBtdXN0IGRlY2xhcmUgYXQgbGVhc3Qgb25lIGZpbGUgZXh0ZW5zaW9uLmApO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGV4dGVuc2lvbiBvZiBleHRlbnNpb25zKSB7XG4gICAgICBpZiAoXG4gICAgICAgIHR5cGVvZiBleHRlbnNpb24gIT09ICdzdHJpbmcnIHx8XG4gICAgICAgICFleHRlbnNpb24uc3RhcnRzV2l0aCgnLicpIHx8XG4gICAgICAgIGV4dGVuc2lvbiAhPT0gZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKClcbiAgICAgICkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgIGBBZGFwdGVyIFwiJHtkZXNjcmlwdG9yLmlkfVwiIGhhcyBhbiBpbnZhbGlkIGV4dGVuc2lvbiBcIiR7U3RyaW5nKFxuICAgICAgICAgICAgZXh0ZW5zaW9uLFxuICAgICAgICAgICl9XCI7IHVzZSBsb3dlciBjYXNlIHdpdGggYSBsZWFkaW5nIGRvdC5gLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodHlwZW9mIGRlc2NyaXB0b3IuYW5hbHl6ZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgQWRhcHRlciBcIiR7ZGVzY3JpcHRvci5pZH1cIiBtdXN0IHByb3ZpZGUgYW4gYW5hbHl6ZSBmdW5jdGlvbi5gKTtcbiAgICB9XG4gICAgY29uc3QgY2FwYWJpbGl0aWVzID0gY3JlYXRlQ2FwYWJpbGl0aWVzKGRlc2NyaXB0b3IuY2FwYWJpbGl0aWVzKTtcbiAgICBhZGFwdGVycy5zZXQoXG4gICAgICBkZXNjcmlwdG9yLmlkLFxuICAgICAgT2JqZWN0LmZyZWV6ZSh7XG4gICAgICAgIC4uLmRlc2NyaXB0b3IsXG4gICAgICAgIGV4dGVuc2lvbnM6IFsuLi5leHRlbnNpb25zXSxcbiAgICAgICAgbGFuZ3VhZ2VzOiBbLi4uZGVzY3JpcHRvci5sYW5ndWFnZXNdLFxuICAgICAgICBjYXBhYmlsaXRpZXMsXG4gICAgICB9KSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIExvbmdlc3QgZXh0ZW5zaW9uIHdpbnMgc28gdGhhdCBhIGZ1dHVyZSBgLmQudHNgIGFkYXB0ZXIgY2FuIGNvZXhpc3Qgd2l0aCBgLnRzYC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVQYXRoXG4gICAqIEByZXR1cm5zIHtBZGFwdGVyRGVzY3JpcHRvciB8IG51bGx9XG4gICAqL1xuICBmdW5jdGlvbiByZXNvbHZlKGZpbGVQYXRoKSB7XG4gICAgaWYgKHR5cGVvZiBmaWxlUGF0aCAhPT0gJ3N0cmluZycgfHwgZmlsZVBhdGgubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgbG93ZXIgPSBmaWxlUGF0aC50b0xvd2VyQ2FzZSgpO1xuICAgIGxldCBiZXN0ID0gbnVsbDtcbiAgICBsZXQgYmVzdExlbmd0aCA9IDA7XG4gICAgZm9yIChjb25zdCBhZGFwdGVyIG9mIGFkYXB0ZXJzLnZhbHVlcygpKSB7XG4gICAgICBmb3IgKGNvbnN0IGV4dGVuc2lvbiBvZiBhZGFwdGVyLmV4dGVuc2lvbnMpIHtcbiAgICAgICAgaWYgKGxvd2VyLmVuZHNXaXRoKGV4dGVuc2lvbikgJiYgZXh0ZW5zaW9uLmxlbmd0aCA+IGJlc3RMZW5ndGgpIHtcbiAgICAgICAgICBiZXN0ID0gYWRhcHRlcjtcbiAgICAgICAgICBiZXN0TGVuZ3RoID0gZXh0ZW5zaW9uLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYmVzdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSdW4gYW4gYWRhcHRlciBhbmQgdmFsaWRhdGUgaXRzIG91dHB1dC4gTmV2ZXIgdGhyb3dzLlxuICAgKlxuICAgKiBAcGFyYW0ge0FuYWx5emVJbnB1dH0gaW5wdXRcbiAgICogQHBhcmFtIHt7bW9kZT86ICdzdHJpY3QnfCdkZWZlbnNpdmUnfX0gW29wdGlvbnNdXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPEFuYWx5emVTdWNjZXNzIHwgQW5hbHl6ZUZhaWx1cmU+fVxuICAgKi9cbiAgYXN5bmMgZnVuY3Rpb24gYW5hbHl6ZShpbnB1dCwgb3B0aW9ucyA9IHt9KSB7XG4gICAgY29uc3QgaW5wdXRJc3N1ZXMgPSB2YWxpZGF0ZUlucHV0KGlucHV0KTtcbiAgICBpZiAoaW5wdXRJc3N1ZXMubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb2s6IGZhbHNlLFxuICAgICAgICBjb2RlOiAnRV9JTlBVVCcsXG4gICAgICAgIG1lc3NhZ2U6ICdJbnZhbGlkIGFuYWx5c2lzIGlucHV0LicsXG4gICAgICAgIGlzc3VlczogaW5wdXRJc3N1ZXMsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IGFkYXB0ZXIgPSByZXNvbHZlKGlucHV0LnBhdGgpO1xuICAgIGlmICghYWRhcHRlcikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb2s6IGZhbHNlLFxuICAgICAgICBjb2RlOiAnRV9VTlNVUFBPUlRFRCcsXG4gICAgICAgIG1lc3NhZ2U6IGBObyBhZGFwdGVyIGlzIHJlZ2lzdGVyZWQgZm9yIFwiJHtpbnB1dC5wYXRofVwiLmAsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHRva2VuID1cbiAgICAgIGlucHV0LmNhbmNlbGxhdGlvbiAmJiB0eXBlb2YgaW5wdXQuY2FuY2VsbGF0aW9uID09PSAnb2JqZWN0J1xuICAgICAgICA/ICdpc0NhbmNlbGxlZCcgaW4gaW5wdXQuY2FuY2VsbGF0aW9uXG4gICAgICAgICAgPyAvKiogQHR5cGUge2ltcG9ydCgnLi9jc3IvY2FuY2VsbGF0aW9uLmpzJykuQ2FuY2VsbGF0aW9uVG9rZW59ICovIChpbnB1dC5jYW5jZWxsYXRpb24pXG4gICAgICAgICAgOiB0b2tlbkZyb21BYm9ydFNpZ25hbCgvKiogQHR5cGUge0Fib3J0U2lnbmFsfSAqLyAoaW5wdXQuY2FuY2VsbGF0aW9uKSlcbiAgICAgICAgOiB1bmRlZmluZWQ7XG5cbiAgICBjb25zdCBzdGFydGVkQXQgPSBEYXRlLm5vdygpO1xuICAgIGlmIChpc0NhbmNlbGxhdGlvblJlcXVlc3RlZCh0b2tlbikpIHtcbiAgICAgIHJldHVybiBkZWdyYWRlZChhZGFwdGVyLCBpbnB1dCwgc3RhcnRlZEF0LCAnRV9DQU5DRUxMRUQnLCAnQW5hbHlzaXMgd2FzIGNhbmNlbGxlZC4nKTtcbiAgICB9XG5cbiAgICBsZXQgb3V0cHV0O1xuICAgIHRyeSB7XG4gICAgICBvdXRwdXQgPSBhd2FpdCBhZGFwdGVyLmFuYWx5emUoeyAuLi5pbnB1dCwgY2FuY2VsbGF0aW9uOiB0b2tlbiB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgQ2FuY2VsbGF0aW9uRXJyb3IgfHwgaXNDYW5jZWxsYXRpb25SZXF1ZXN0ZWQodG9rZW4pKSB7XG4gICAgICAgIHJldHVybiBkZWdyYWRlZChhZGFwdGVyLCBpbnB1dCwgc3RhcnRlZEF0LCAnRV9DQU5DRUxMRUQnLCAnQW5hbHlzaXMgd2FzIGNhbmNlbGxlZC4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZWdyYWRlZChcbiAgICAgICAgYWRhcHRlcixcbiAgICAgICAgaW5wdXQsXG4gICAgICAgIHN0YXJ0ZWRBdCxcbiAgICAgICAgJ0VfQURBUFRFUicsXG4gICAgICAgIGBBZGFwdGVyIFwiJHthZGFwdGVyLmlkfVwiIGZhaWxlZDogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKGlzQ2FuY2VsbGF0aW9uUmVxdWVzdGVkKHRva2VuKSkge1xuICAgICAgcmV0dXJuIGRlZ3JhZGVkKGFkYXB0ZXIsIGlucHV0LCBzdGFydGVkQXQsICdFX0NBTkNFTExFRCcsICdBbmFseXNpcyB3YXMgY2FuY2VsbGVkLicpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb3V0cHV0ICE9PSAnb2JqZWN0JyB8fCBvdXRwdXQgPT09IG51bGwgfHwgQXJyYXkuaXNBcnJheShvdXRwdXQpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvazogZmFsc2UsXG4gICAgICAgIGNvZGU6ICdFX1ZBTElEQVRJT04nLFxuICAgICAgICBtZXNzYWdlOiBgQWRhcHRlciBcIiR7YWRhcHRlci5pZH1cIiBkaWQgbm90IHJldHVybiBhbiBBbmFseXNpc1J1biBvYmplY3QuYCxcbiAgICAgICAgaXNzdWVzOiBbeyBwYXRoOiAnJCcsIG1lc3NhZ2U6ICdBZGFwdGVyIG91dHB1dCBtdXN0IGJlIGFuIG9iamVjdC4nIH1dLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCBjYW5kaWRhdGUgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAob3V0cHV0KTtcbiAgICBpZiAodHlwZW9mIGNhbmRpZGF0ZS5hZGFwdGVySWQgIT09ICdzdHJpbmcnIHx8IGNhbmRpZGF0ZS5hZGFwdGVySWQubGVuZ3RoID09PSAwKSB7XG4gICAgICBjYW5kaWRhdGUuYWRhcHRlcklkID0gYWRhcHRlci5pZDtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBjYW5kaWRhdGUuYWRhcHRlclZlcnNpb24gIT09ICdzdHJpbmcnIHx8IGNhbmRpZGF0ZS5hZGFwdGVyVmVyc2lvbi5sZW5ndGggPT09IDApIHtcbiAgICAgIGNhbmRpZGF0ZS5hZGFwdGVyVmVyc2lvbiA9IGFkYXB0ZXIudmVyc2lvbjtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICB0eXBlb2YgY2FuZGlkYXRlLmNzclZlcnNpb24gPT09ICdzdHJpbmcnICYmXG4gICAgICBpc0NvbXBhdGlibGVDc3JWZXJzaW9uKGNhbmRpZGF0ZS5jc3JWZXJzaW9uKSAmJlxuICAgICAgY2FuZGlkYXRlLmNzclZlcnNpb24gIT09IENTUl9WRVJTSU9OXG4gICAgKSB7XG4gICAgICBjb25zdCBtaWdyYXRpb24gPSBtaWdyYXRlUnVuKGNhbmRpZGF0ZSwgQ1NSX1ZFUlNJT04pO1xuICAgICAgaWYgKCFtaWdyYXRpb24ub2spIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBvazogZmFsc2UsXG4gICAgICAgICAgY29kZTogJ0VfVkVSU0lPTicsXG4gICAgICAgICAgbWVzc2FnZTogbWlncmF0aW9uLm1lc3NhZ2UsXG4gICAgICAgICAgaXNzdWVzOiBtaWdyYXRpb24uaXNzdWVzLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgb3V0cHV0ID0gbWlncmF0aW9uLnJ1bjtcbiAgICB9XG5cbiAgICBpZiAoLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKG91dHB1dCkucnVuSWQgIT09IGlucHV0LnJ1bklkKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvazogZmFsc2UsXG4gICAgICAgIGNvZGU6ICdFX1ZBTElEQVRJT04nLFxuICAgICAgICBtZXNzYWdlOiBgQWRhcHRlciBcIiR7YWRhcHRlci5pZH1cIiByZXR1cm5lZCBydW5JZCBcIiR7U3RyaW5nKFxuICAgICAgICAgIC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChvdXRwdXQpLnJ1bklkLFxuICAgICAgICApfVwiIGJ1dCB0aGUgY2FsbGVyIHJlcXVlc3RlZCBcIiR7aW5wdXQucnVuSWR9XCIuYCxcbiAgICAgICAgaXNzdWVzOiBbeyBwYXRoOiAncnVuSWQnLCBtZXNzYWdlOiAncnVuSWQgbXVzdCBtYXRjaCB0aGUgY2FsbGVyLXN1cHBsaWVkIHZhbHVlLicgfV0sXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHZhbGlkYXRpb24gPSB2YWxpZGF0ZUFuYWx5c2lzUnVuKG91dHB1dCwge1xuICAgICAgbW9kZTogb3B0aW9ucy5tb2RlID8/ICdkZWZlbnNpdmUnLFxuICAgICAgZXhwZWN0ZWRBZGFwdGVySWQ6IGFkYXB0ZXIuaWQsXG4gICAgfSk7XG4gICAgaWYgKCF2YWxpZGF0aW9uLm9rKSB7XG4gICAgICBjb25zdCBsaW1pdElzc3VlID0gdmFsaWRhdGlvbi5pc3N1ZXMuc29tZSgoaXNzdWUpID0+IGlzc3VlLmNvZGUgPT09ICdFX0xJTUlUJyk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvazogZmFsc2UsXG4gICAgICAgIGNvZGU6IGxpbWl0SXNzdWUgPyAnRV9MSU1JVCcgOiAnRV9WQUxJREFUSU9OJyxcbiAgICAgICAgbWVzc2FnZTogYEFkYXB0ZXIgXCIke2FkYXB0ZXIuaWR9XCIgcHJvZHVjZWQgaW52YWxpZCBDU1IuYCxcbiAgICAgICAgaXNzdWVzOiB2YWxpZGF0aW9uLmlzc3VlcyxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3QgcnVuID0gdmFsaWRhdGlvbi5ydW47XG4gICAgcnVuLmFkYXB0ZXJWZXJzaW9uID0gYWRhcHRlci52ZXJzaW9uO1xuICAgIHJ1bi5sYW5ndWFnZSA9IHJ1bi5sYW5ndWFnZSB8fCBpbnB1dC5sYW5ndWFnZSB8fCBhZGFwdGVyLmxhbmd1YWdlc1swXTtcblxuICAgIC8qKiBAdHlwZSB7QW5hbHl6ZVN1Y2Nlc3N9ICovXG4gICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgb2s6IHRydWUsXG4gICAgICBydW4sXG4gICAgICBhZGFwdGVySWQ6IGFkYXB0ZXIuaWQsXG4gICAgICBkdXJhdGlvbk1zOiBEYXRlLm5vdygpIC0gc3RhcnRlZEF0LFxuICAgIH07XG4gICAgaWYgKHZhbGlkYXRpb24uaXNzdWVzLmxlbmd0aCA+IDApIHtcbiAgICAgIHJlc3VsdC5pc3N1ZXMgPSB2YWxpZGF0aW9uLmlzc3Vlcy5tYXAoKGlzc3VlKSA9PiAoe1xuICAgICAgICBwYXRoOiBpc3N1ZS5wYXRoLFxuICAgICAgICBtZXNzYWdlOiBpc3N1ZS5tZXNzYWdlLFxuICAgICAgfSkpO1xuICAgIH1cbiAgICBpZiAodmFsaWRhdGlvbi5kcm9wcGVkLmxlbmd0aCA+IDApIHtcbiAgICAgIHJlc3VsdC5kcm9wcGVkID0gdmFsaWRhdGlvbi5kcm9wcGVkLm1hcCgoZW50cnkpID0+ICh7XG4gICAgICAgIGNvbGxlY3Rpb246IGVudHJ5LmNvbGxlY3Rpb24sXG4gICAgICAgIHBhdGg6IGVudHJ5LnBhdGgsXG4gICAgICAgIGlkOiBlbnRyeS5pZCxcbiAgICAgIH0pKTtcbiAgICAgIHJlc3VsdC5kZWdyYWRlZCA9IHtcbiAgICAgICAgY29kZTogJ0VfVkFMSURBVElPTicsXG4gICAgICAgIG1lc3NhZ2U6IGBEcm9wcGVkICR7dmFsaWRhdGlvbi5kcm9wcGVkLmxlbmd0aH0gaW52YWxpZCByZWNvcmQocykgZnJvbSBhZGFwdGVyIFwiJHthZGFwdGVyLmlkfVwiLmAsXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7QWRhcHRlckRlc2NyaXB0b3J9IGFkYXB0ZXJcbiAgICogQHBhcmFtIHtBbmFseXplSW5wdXR9IGlucHV0XG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzdGFydGVkQXRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAgICogQHJldHVybnMge0FuYWx5emVTdWNjZXNzfVxuICAgKi9cbiAgZnVuY3Rpb24gZGVncmFkZWQoYWRhcHRlciwgaW5wdXQsIHN0YXJ0ZWRBdCwgY29kZSwgbWVzc2FnZSkge1xuICAgIGNvbnN0IHJ1biA9IGNyZWF0ZURlZ3JhZGVkUnVuKHtcbiAgICAgIHJ1bklkOiBpbnB1dC5ydW5JZCxcbiAgICAgIGFkYXB0ZXJJZDogYWRhcHRlci5pZCxcbiAgICAgIGFkYXB0ZXJWZXJzaW9uOiBhZGFwdGVyLnZlcnNpb24sXG4gICAgICBsYW5ndWFnZTogaW5wdXQubGFuZ3VhZ2UgPz8gYWRhcHRlci5sYW5ndWFnZXNbMF0sXG4gICAgICBzY29wZTogeyBraW5kOiAnZmlsZScsIHBhdGg6IGlucHV0LnBhdGggfSxcbiAgICAgIGNvZGUsXG4gICAgICBtZXNzYWdlLFxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICBvazogdHJ1ZSxcbiAgICAgIHJ1bixcbiAgICAgIGFkYXB0ZXJJZDogYWRhcHRlci5pZCxcbiAgICAgIGR1cmF0aW9uTXM6IERhdGUubm93KCkgLSBzdGFydGVkQXQsXG4gICAgICBkZWdyYWRlZDogeyBjb2RlLCBtZXNzYWdlIH0sXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBwYXRoc1xuICAgKiBAcmV0dXJucyB7e29rOiB0cnVlLCB2YWx1ZTogQXJyYXk8e3BhdGg6IHN0cmluZywgYWRhcHRlcklkOiBzdHJpbmd8bnVsbH0+fX1cbiAgICovXG4gIGZ1bmN0aW9uIGRyeVJ1bihwYXRocykge1xuICAgIGNvbnN0IHZhbHVlcyA9IEFycmF5LmlzQXJyYXkocGF0aHMpID8gcGF0aHMgOiBbXTtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IHRydWUsXG4gICAgICB2YWx1ZTogdmFsdWVzXG4gICAgICAgIC5maWx0ZXIoKHBhdGgpID0+IHR5cGVvZiBwYXRoID09PSAnc3RyaW5nJylcbiAgICAgICAgLm1hcCgocGF0aCkgPT4gKHsgcGF0aCwgYWRhcHRlcklkOiByZXNvbHZlKHBhdGgpPy5pZCA/PyBudWxsIH0pKSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7QW5hbHlzaXNSdW59IHJ1blxuICAgKiBAcmV0dXJucyB7UmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlUXVlcnlMYXllcj59XG4gICAqL1xuICBmdW5jdGlvbiBxdWVyeShydW4pIHtcbiAgICBjb25zdCBhZGFwdGVyID0gYWRhcHRlcnMuZ2V0KHJ1bi5hZGFwdGVySWQpO1xuICAgIHJldHVybiBjcmVhdGVRdWVyeUxheWVyKHJ1biwge1xuICAgICAgY2FwYWJpbGl0aWVzOiBhZGFwdGVyPy5jYXBhYmlsaXRpZXMgPz8gY3JlYXRlQ2FwYWJpbGl0aWVzKHt9KSxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcmVnaXN0ZXIsXG4gICAgbGlzdDogKCkgPT4gWy4uLmFkYXB0ZXJzLnZhbHVlcygpXSxcbiAgICByZXNvbHZlLFxuICAgIGFuYWx5emUsXG4gICAgZHJ5UnVuLFxuICAgIHF1ZXJ5LFxuICAgIGNhcGFiaWxpdHlNYXRyaXg6ICgpID0+XG4gICAgICBbLi4uYWRhcHRlcnMudmFsdWVzKCldLm1hcCgoYWRhcHRlcikgPT4gKHtcbiAgICAgICAgaWQ6IGFkYXB0ZXIuaWQsXG4gICAgICAgIGxhbmd1YWdlczogWy4uLmFkYXB0ZXIubGFuZ3VhZ2VzXSxcbiAgICAgICAgY2FwYWJpbGl0aWVzOiB7IC4uLmFkYXB0ZXIuY2FwYWJpbGl0aWVzIH0sXG4gICAgICB9KSksXG4gIH07XG59XG5cbi8qKlxuICogQHBhcmFtIHtBbmFseXplSW5wdXR9IGlucHV0XG4gKiBAcmV0dXJucyB7QXJyYXk8e3BhdGg6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nfT59XG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlSW5wdXQoaW5wdXQpIHtcbiAgLyoqIEB0eXBlIHtBcnJheTx7cGF0aDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmd9Pn0gKi9cbiAgY29uc3QgaXNzdWVzID0gW107XG4gIGlmICghaW5wdXQgfHwgdHlwZW9mIGlucHV0ICE9PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBbeyBwYXRoOiAnJCcsIG1lc3NhZ2U6ICdBbmFseXplIGlucHV0IG11c3QgYmUgYW4gb2JqZWN0LicgfV07XG4gIH1cbiAgaWYgKHR5cGVvZiBpbnB1dC5ydW5JZCAhPT0gJ3N0cmluZycgfHwgaW5wdXQucnVuSWQubGVuZ3RoID09PSAwKSB7XG4gICAgaXNzdWVzLnB1c2goeyBwYXRoOiAncnVuSWQnLCBtZXNzYWdlOiAncnVuSWQgbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcuJyB9KTtcbiAgfVxuICBpZiAodHlwZW9mIGlucHV0LnBhdGggIT09ICdzdHJpbmcnIHx8IGlucHV0LnBhdGgubGVuZ3RoID09PSAwKSB7XG4gICAgaXNzdWVzLnB1c2goeyBwYXRoOiAncGF0aCcsIG1lc3NhZ2U6ICdwYXRoIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nLicgfSk7XG4gIH1cbiAgaWYgKGlucHV0LnRleHQgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgaW5wdXQudGV4dCAhPT0gJ3N0cmluZycpIHtcbiAgICBpc3N1ZXMucHVzaCh7IHBhdGg6ICd0ZXh0JywgbWVzc2FnZTogJ3RleHQgbXVzdCBiZSBhIHN0cmluZyB3aGVuIHByZXNlbnQuJyB9KTtcbiAgfVxuICBpZiAodHlwZW9mIGlucHV0LnByb2dyZXNzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gUHJvZ3Jlc3MgaXMgb3B0aW9uYWw7IG5vIHZhbGlkYXRpb24gbmVlZGVkIGJleW9uZCBiZWluZyBjYWxsYWJsZS5cbiAgfVxuICByZXR1cm4gaXNzdWVzO1xufVxuIiwgIi8qKlxuICogU21hbGwsIGRlcGVuZGVuY3ktZnJlZSBoYXNoaW5nIHVzZWQgZm9yIGlkZW50aXR5IGFuZCBjaGFuZ2UgZGV0ZWN0aW9uLlxuICpcbiAqIFRoZXNlIGFyZSBub3QgY3J5cHRvZ3JhcGhpYyBoYXNoZXMuIFRoZXkgZXhpc3Qgc28gdGhhdCByZXBlYXRlZCBydW5zIGNhbiBiZVxuICogY29tcGFyZWQgY2hlYXBseSBhbmQgc28gdGhhdCBpZHMgYXJlIHNob3J0IGFuZCBkZXRlcm1pbmlzdGljLiBTZWN1cml0eS1mYWNpbmdcbiAqIGhhc2hlcyAoZmlsZSBjb250ZW50LCBleHRlbnNpb25zKSBhcmUgcHJvZHVjZWQgYnkgdGhlIGhvc3QsIG5vdCBoZXJlLlxuICovXG5cbmNvbnN0IEZOVl9PRkZTRVRfQSA9IDB4ODExYzlkYzU7XG5jb25zdCBGTlZfT0ZGU0VUX0IgPSAweDAxMDAwMTkzO1xuY29uc3QgRk5WX1BSSU1FID0gMHgwMTAwMDE5MztcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dFxuICogQHBhcmFtIHtudW1iZXJ9IHNlZWRcbiAqIEByZXR1cm5zIHtzdHJpbmd9IGVpZ2h0IGxvd2VyLWNhc2UgaGV4IGNoYXJhY3RlcnNcbiAqL1xuZnVuY3Rpb24gZm52MWEzMih0ZXh0LCBzZWVkKSB7XG4gIGxldCBoYXNoID0gc2VlZCA+Pj4gMDtcbiAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHRleHQubGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgaGFzaCBePSB0ZXh0LmNoYXJDb2RlQXQoaW5kZXgpO1xuICAgIGhhc2ggPSBNYXRoLmltdWwoaGFzaCwgRk5WX1BSSU1FKSA+Pj4gMDtcbiAgfVxuICByZXR1cm4gaGFzaC50b1N0cmluZygxNikucGFkU3RhcnQoOCwgJzAnKTtcbn1cblxuLyoqXG4gKiA2NC1iaXQtaXNoIGhhc2ggYnVpbHQgZnJvbSB0d28gaW5kZXBlbmRlbnQgMzItYml0IHBhc3Nlcy4gU3RhYmxlIGFjcm9zc1xuICogcHJvY2Vzc2VzIGFuZCBwbGF0Zm9ybXMgYmVjYXVzZSBpdCBvbmx5IHVzZXMgY2hhciBjb2RlcyBhbmQgaW50ZWdlciBtYXRoLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gKiBAcmV0dXJucyB7c3RyaW5nfSBzaXh0ZWVuIGxvd2VyLWNhc2UgaGV4IGNoYXJhY3RlcnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhc2hIZXgodGV4dCkge1xuICBjb25zdCB2YWx1ZSA9IFN0cmluZyh0ZXh0KTtcbiAgcmV0dXJuIGAke2ZudjFhMzIodmFsdWUsIEZOVl9PRkZTRVRfQSl9JHtmbnYxYTMyKHZhbHVlLCBGTlZfT0ZGU0VUX0IpfWA7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAqIEByZXR1cm5zIHtzdHJpbmd9IGVpZ2h0IGxvd2VyLWNhc2UgaGV4IGNoYXJhY3RlcnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNob3J0SGFzaCh0ZXh0KSB7XG4gIHJldHVybiBmbnYxYTMyKFN0cmluZyh0ZXh0KSwgRk5WX09GRlNFVF9BKTtcbn1cbiIsICIvKipcbiAqIFN0YWJsZSBzeW1ib2wgaWRlbnRpdHkuXG4gKlxuICogU2NoZW1lIChub3JtYXRpdmUpOlxuICpcbiAqICAgc3ltYm9sOjxsYW5ndWFnZT46PHdvcmtzcGFjZS1wYXRoPjo8a2luZD46PHF1YWxpZmllZC1uYW1lPlsjPGRpc2FtYmlndWF0b3I+XVxuICpcbiAqIFJ1bGVzOlxuICogLSBMaW5lIG51bWJlcnMgbmV2ZXIgYXBwZWFyIGluIGFuIGlkLiBXaGl0ZXNwYWNlLCBjb21tZW50LCBhbmQgbGluZS1zaGlmdFxuICogICBlZGl0cyBtdXN0IGxlYXZlIGlkZW50aXR5IHVudG91Y2hlZCAoUGhhc2UgOSBkZXBlbmRzIG9uIHRoYXQpLlxuICogLSBgcXVhbGlmaWVkTmFtZWAgdXNlcyB0aGUgcHJvZHVjZXIncyBuYXRpdmUgc2VwYXJhdG9yIChgOjpgIG9yIGAuYCkgaW4gdGhlXG4gKiAgIHJlY29yZDsgdGhlIGlkIG5vcm1hbGlzZXMgaXQgdG8gYC5gLlxuICogLSBPdmVybG9hZHMgdXNlIGEgZGlzYW1iaWd1YXRvciBtYWRlIG9mIGFyaXR5IHBsdXMgbm9ybWFsaXNlZCBwYXJhbWV0ZXIga2luZHMuXG4gKiAtIEFub255bW91cyBjb25zdHJ1Y3RzIHVzZSBgYW5vbi48b3JkaW5hbC13aXRoaW4tcGFyZW50PmAuXG4gKiAtIEEgY29sbGlzaW9uIHRoYXQgdGhlIGV4cGxpY2l0IGRpc2FtYmlndWF0b3IgY2Fubm90IGV4cGxhaW4gZmFsbHMgYmFjayB0byBhXG4gKiAgIGRlY2xhcmF0aW9uLW9yZGVyIG9yZGluYWwuIFRoYXQgaXMgc3RhYmxlIHVuZGVyIHdoaXRlc3BhY2UgZWRpdHMgYnV0IG5vdFxuICogICB1bmRlciByZW9yZGVyaW5nOyBpdCBpcyB0aGUgZG9jdW1lbnRlZCBsYXN0IHJlc29ydC5cbiAqIC0gUmVuYW1lcyBjaGFuZ2UgaWRlbnRpdHkuIFRoZSBvbGQgaWQgaXMgcmVtb3ZlZCBhbmQgdGhlIG5ldyBvbmUgaXMgYWRkZWQ7XG4gKiAgIGlkcyBhcmUgbmV2ZXIgc2lsZW50bHkgcmV1c2VkLlxuICpcbiAqIFRoZSBpZCBpcyBodW1hbi1yZWFkYWJsZSBieSBkZXNpZ24sIGJlY2F1c2UgZGVidWdnaW5nIGlkZW50aXR5IGlzIGV4cGVuc2l2ZS5cbiAqIEl0IGlzIHN0aWxsIG9wYXF1ZSB0byBjb25zdW1lcnM6IG5vdGhpbmcgbWF5IHBhcnNlIGl0IHRvIGRpc2NvdmVyIGEgcmFuZ2UuXG4gKi9cblxuaW1wb3J0IHsgc2hvcnRIYXNoIH0gZnJvbSAnLi9oYXNoLmpzJztcblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHBhdGhcbiAqIEByZXR1cm5zIHtzdHJpbmd9IGZvcndhcmQtc2xhc2ggcGF0aCB3aXRob3V0IGEgbGVhZGluZyBgLi9gXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVQYXRoKHBhdGgpIHtcbiAgcmV0dXJuIFN0cmluZyhwYXRoID8/ICcnKVxuICAgIC5yZXBsYWNlKC9cXFxcL2csICcvJylcbiAgICAucmVwbGFjZSgvXFwvezIsfS9nLCAnLycpXG4gICAgLnJlcGxhY2UoL15cXC5cXC8vLCAnJyk7XG59XG5cbi8qKlxuICogTm9ybWFsaXNlIGEgcXVhbGlmaWVkIG5hbWUgZm9yIHVzZSBpbnNpZGUgYW4gaWQuXG4gKlxuICogQHBhcmFtIHt1bmtub3dufSBuYW1lXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplUXVhbGlmaWVkTmFtZShuYW1lKSB7XG4gIHJldHVybiBTdHJpbmcobmFtZSA/PyAnJylcbiAgICAucmVwbGFjZSgvOjovZywgJy4nKVxuICAgIC5yZXBsYWNlKC9cXC57Mix9L2csICcuJylcbiAgICAucmVwbGFjZSgvXlxcLi8sICcnKVxuICAgIC5yZXBsYWNlKC9cXC4kLywgJycpO1xufVxuXG4vKipcbiAqIEVzY2FwZSBvbmx5IHRoZSBjaGFyYWN0ZXJzIHRoYXQgd291bGQgbWFrZSB0aGUgaWQgYW1iaWd1b3VzLiBVbmljb2RlIGlzIGxlZnRcbiAqIHJlYWRhYmxlIG9uIHB1cnBvc2UuXG4gKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVzY2FwZUlkU2VnbWVudCh2YWx1ZSkge1xuICByZXR1cm4gU3RyaW5nKHZhbHVlID8/ICcnKVxuICAgIC5yZXBsYWNlKC8lL2csICclMjUnKVxuICAgIC5yZXBsYWNlKC86L2csICclM0EnKVxuICAgIC5yZXBsYWNlKC8jL2csICclMjMnKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHBhdGhcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVGaWxlSWQocGF0aCkge1xuICByZXR1cm4gYGZpbGU6JHtlc2NhcGVJZFNlZ21lbnQobm9ybWFsaXplUGF0aChwYXRoKSl9YDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3tsYW5ndWFnZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcsIGtpbmQ6IHN0cmluZywgcXVhbGlmaWVkTmFtZTogc3RyaW5nLCBkaXNhbWJpZ3VhdG9yPzogc3RyaW5nfX0gaW5wdXRcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTeW1ib2xJZChpbnB1dCkge1xuICBjb25zdCBiYXNlID0gW1xuICAgICdzeW1ib2wnLFxuICAgIGVzY2FwZUlkU2VnbWVudChpbnB1dC5sYW5ndWFnZSksXG4gICAgZXNjYXBlSWRTZWdtZW50KG5vcm1hbGl6ZVBhdGgoaW5wdXQucGF0aCkpLFxuICAgIGVzY2FwZUlkU2VnbWVudChpbnB1dC5raW5kKSxcbiAgICBlc2NhcGVJZFNlZ21lbnQobm9ybWFsaXplUXVhbGlmaWVkTmFtZShpbnB1dC5xdWFsaWZpZWROYW1lKSksXG4gIF0uam9pbignOicpO1xuICBjb25zdCBkaXNhbWJpZ3VhdG9yID0gaW5wdXQuZGlzYW1iaWd1YXRvciA/IGAjJHtlc2NhcGVJZFNlZ21lbnQoaW5wdXQuZGlzYW1iaWd1YXRvcil9YCA6ICcnO1xuICByZXR1cm4gYCR7YmFzZX0ke2Rpc2FtYmlndWF0b3J9YDtcbn1cblxuLyoqXG4gKiBUaGUgaWRlbnRpdHkgdHVwbGUgQy0wMyBjaGVja3MgZm9yIHVuaXF1ZW5lc3MuXG4gKlxuICogQHBhcmFtIHt7cGF0aDogc3RyaW5nLCBraW5kOiBzdHJpbmcsIHF1YWxpZmllZE5hbWU6IHN0cmluZywgZGlzYW1iaWd1YXRvcj86IHN0cmluZ319IGlucHV0XG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSWRlbnRpdHlLZXkoaW5wdXQpIHtcbiAgcmV0dXJuIFtcbiAgICBub3JtYWxpemVQYXRoKGlucHV0LnBhdGgpLFxuICAgIFN0cmluZyhpbnB1dC5raW5kKSxcbiAgICBub3JtYWxpemVRdWFsaWZpZWROYW1lKGlucHV0LnF1YWxpZmllZE5hbWUpLFxuICAgIFN0cmluZyhpbnB1dC5kaXNhbWJpZ3VhdG9yID8/ICcnKSxcbiAgXS5qb2luKCd8Jyk7XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3duW119IHBhcmFtZXRlcktpbmRzXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlT3ZlcmxvYWREaXNhbWJpZ3VhdG9yKHBhcmFtZXRlcktpbmRzKSB7XG4gIGNvbnN0IGtpbmRzID0gQXJyYXkuaXNBcnJheShwYXJhbWV0ZXJLaW5kcykgPyBwYXJhbWV0ZXJLaW5kcyA6IFtdO1xuICBjb25zdCBub3JtYWxpemVkID0ga2luZHMubWFwKFxuICAgIChraW5kKSA9PlxuICAgICAgU3RyaW5nKGtpbmQgPz8gJ3Vua25vd24nKVxuICAgICAgICAudHJpbSgpXG4gICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgIC5yZXBsYWNlKC9bXmEtejAtOV9dKy9nLCAnXycpXG4gICAgICAgIC5yZXBsYWNlKC9eXyt8XyskL2csICcnKSB8fCAndW5rbm93bicsXG4gICk7XG4gIHJldHVybiBub3JtYWxpemVkLmxlbmd0aCA9PT0gMCA/ICdhcml0eTAnIDogYGFyaXR5JHtub3JtYWxpemVkLmxlbmd0aH0uJHtub3JtYWxpemVkLmpvaW4oJysnKX1gO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7bnVtYmVyfSBvcmRpbmFsIDEtYmFzZWQgb3JkaW5hbCB3aXRoaW4gdGhlIHBhcmVudCBzY29wZVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUFub255bW91c0Rpc2FtYmlndWF0b3Iob3JkaW5hbCkge1xuICBjb25zdCBzYWZlID0gTnVtYmVyLmlzSW50ZWdlcihvcmRpbmFsKSAmJiBvcmRpbmFsID4gMCA/IG9yZGluYWwgOiAxO1xuICByZXR1cm4gYGFub24uJHtzYWZlfWA7XG59XG5cbi8qKlxuICogQSBwZXItcnVuIGFsbG9jYXRvci4gSXQgaXMgZGVsaWJlcmF0ZWx5IHN0YXRlZnVsOiB0d28gZGVjbGFyYXRpb25zIHRoYXRcbiAqIGNvbGxpZGUgbXVzdCByZWNlaXZlIGRpZmZlcmVudCBpZHMsIGFuZCB0aGUgYWxsb2NhdG9yIGlzIHRoZSBvbmx5IHBsYWNlIHRoYXRcbiAqIGtub3dzIGFib3V0IGVhcmxpZXIgZGVjbGFyYXRpb25zLlxuICpcbiAqIEBwYXJhbSB7e2xhbmd1YWdlOiBzdHJpbmd9fSBvcHRpb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVJZGVudGl0eUFsbG9jYXRvcih7IGxhbmd1YWdlIH0pIHtcbiAgLyoqIEB0eXBlIHtTZXQ8c3RyaW5nPn0gKi9cbiAgY29uc3QgdXNlZElkcyA9IG5ldyBTZXQoKTtcbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBudW1iZXI+fSAqL1xuICBjb25zdCBiYXNlcyA9IG5ldyBNYXAoKTtcblxuICAvKipcbiAgICogQHBhcmFtIHt7cGF0aDogc3RyaW5nLCBraW5kOiBzdHJpbmcsIHF1YWxpZmllZE5hbWU6IHN0cmluZywgZGlzYW1iaWd1YXRvcj86IHN0cmluZ319IGlucHV0XG4gICAqIEByZXR1cm5zIHt7c3ltYm9sSWQ6IHN0cmluZywgaWRlbnRpdHlLZXk6IHN0cmluZywgZGlzYW1iaWd1YXRvcjogc3RyaW5nfX1cbiAgICovXG4gIGZ1bmN0aW9uIHN5bWJvbChpbnB1dCkge1xuICAgIGNvbnN0IGV4cGxpY2l0ID0gaW5wdXQuZGlzYW1iaWd1YXRvciA/IFN0cmluZyhpbnB1dC5kaXNhbWJpZ3VhdG9yKSA6ICcnO1xuICAgIGNvbnN0IGJhc2VLZXkgPSBjcmVhdGVJZGVudGl0eUtleSh7XG4gICAgICBwYXRoOiBpbnB1dC5wYXRoLFxuICAgICAga2luZDogaW5wdXQua2luZCxcbiAgICAgIHF1YWxpZmllZE5hbWU6IGlucHV0LnF1YWxpZmllZE5hbWUsXG4gICAgICBkaXNhbWJpZ3VhdG9yOiAnJyxcbiAgICB9KTtcblxuICAgIGxldCBkaXNhbWJpZ3VhdG9yID0gZXhwbGljaXQ7XG4gICAgbGV0IHN5bWJvbElkID0gY3JlYXRlU3ltYm9sSWQoeyAuLi5pbnB1dCwgbGFuZ3VhZ2UsIGRpc2FtYmlndWF0b3IgfSk7XG4gICAgbGV0IGlkZW50aXR5S2V5ID0gY3JlYXRlSWRlbnRpdHlLZXkoeyAuLi5pbnB1dCwgZGlzYW1iaWd1YXRvciB9KTtcblxuICAgIGlmICh1c2VkSWRzLmhhcyhzeW1ib2xJZCkpIHtcbiAgICAgIC8vIExhc3QgcmVzb3J0OiBkZWNsYXJhdGlvbi1vcmRlciBpbmRleCwgbmV2ZXIgYSBsaW5lIG51bWJlci5cbiAgICAgIGxldCBvcmRpbmFsID0gYmFzZXMuZ2V0KGAke2Jhc2VLZXl9IyR7ZXhwbGljaXR9YCkgPz8gMTtcbiAgICAgIGRvIHtcbiAgICAgICAgZGlzYW1iaWd1YXRvciA9IGV4cGxpY2l0ID8gYCR7ZXhwbGljaXR9LiR7b3JkaW5hbH1gIDogU3RyaW5nKG9yZGluYWwpO1xuICAgICAgICBzeW1ib2xJZCA9IGNyZWF0ZVN5bWJvbElkKHsgLi4uaW5wdXQsIGxhbmd1YWdlLCBkaXNhbWJpZ3VhdG9yIH0pO1xuICAgICAgICBpZGVudGl0eUtleSA9IGNyZWF0ZUlkZW50aXR5S2V5KHsgLi4uaW5wdXQsIGRpc2FtYmlndWF0b3IgfSk7XG4gICAgICAgIG9yZGluYWwgKz0gMTtcbiAgICAgIH0gd2hpbGUgKHVzZWRJZHMuaGFzKHN5bWJvbElkKSAmJiBvcmRpbmFsIDwgMTBfMDAwKTtcbiAgICAgIGJhc2VzLnNldChgJHtiYXNlS2V5fSMke2V4cGxpY2l0fWAsIG9yZGluYWwpO1xuICAgIH0gZWxzZSBpZiAoIWV4cGxpY2l0KSB7XG4gICAgICBkaXNhbWJpZ3VhdG9yID0gJzAnO1xuICAgICAgaWRlbnRpdHlLZXkgPSBjcmVhdGVJZGVudGl0eUtleSh7IC4uLmlucHV0LCBkaXNhbWJpZ3VhdG9yIH0pO1xuICAgIH1cblxuICAgIHVzZWRJZHMuYWRkKHN5bWJvbElkKTtcbiAgICByZXR1cm4geyBzeW1ib2xJZCwgaWRlbnRpdHlLZXksIGRpc2FtYmlndWF0b3IgfTtcbiAgfVxuXG4gIHJldHVybiB7IHN5bWJvbCB9O1xufVxuXG4vKipcbiAqIERldGVybWluaXN0aWMsIHJlYWRhYmxlIHJlbGF0aW9uc2hpcCBpZC4gVHdvIGNhbGxzIGJldHdlZW4gdGhlIHNhbWUgcGFpciBnZXRcbiAqIGRpc3RpbmN0IGlkcyB0aHJvdWdoIHRoZSBhbGxvY2F0b3IncyBvcmRpbmFsIHN1ZmZpeC5cbiAqXG4gKiBAcGFyYW0ge3t0eXBlOiBzdHJpbmcsIGZyb206IHN0cmluZywgdG86IHN0cmluZ319IGlucHV0XG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUmVsYXRpb25zaGlwSWQoaW5wdXQpIHtcbiAgcmV0dXJuIGByZWw6JHtlc2NhcGVJZFNlZ21lbnQoaW5wdXQudHlwZSl9OiR7c2hvcnRIYXNoKGAke2lucHV0LmZyb219fCR7aW5wdXQudG99YCl9YDtcbn1cblxuLyoqXG4gKiBAcmV0dXJucyB7e3JlbGF0aW9uc2hpcDogKGlucHV0OiB7dHlwZTogc3RyaW5nLCBmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmd9KSA9PiBzdHJpbmd9fVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUmVsYXRpb25zaGlwQWxsb2NhdG9yKCkge1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIG51bWJlcj59ICovXG4gIGNvbnN0IGNvdW50cyA9IG5ldyBNYXAoKTtcbiAgcmV0dXJuIHtcbiAgICByZWxhdGlvbnNoaXAoaW5wdXQpIHtcbiAgICAgIGNvbnN0IGJhc2UgPSBjcmVhdGVSZWxhdGlvbnNoaXBJZChpbnB1dCk7XG4gICAgICBjb25zdCBzZWVuID0gY291bnRzLmdldChiYXNlKSA/PyAwO1xuICAgICAgY291bnRzLnNldChiYXNlLCBzZWVuICsgMSk7XG4gICAgICByZXR1cm4gc2VlbiA9PT0gMCA/IGJhc2UgOiBgJHtiYXNlfSMke3NlZW4gKyAxfWA7XG4gICAgfSxcbiAgfTtcbn1cbiIsICIvKipcbiAqIE1vY2sgbGFuZ3VhZ2UgYWRhcHRlci5cbiAqXG4gKiBQaGFzZSAwIHByb3ZlZCB0aGUgcGlwZWxpbmUgd2l0aCBmaXZlIGhhbmQtd3JpdHRlbiBzeW1ib2xzLiBQaGFzZSAxIHVwZ3JhZGVzXG4gKiB0aGUgZml4dHVyZSB0byB0aGUgbm9ybWF0aXZlIENTUiBzbyB0aGUgY29uZm9ybWFuY2Ugc3VpdGUgaGFzIHNvbWV0aGluZyByZWFsXG4gKiB0byBleGVyY2lzZTogb3ZlcmxvYWRzLCBhbm9ueW1vdXMgY29uc3RydWN0cywgZXZlcnkgcmVzb2x1dGlvbiBzdGF0dXMsIGFuXG4gKiBleHRlcm5hbCB0YXJnZXQsIGV2aWRlbmNlLCBjb250cm9sIGNvbnN0cnVjdHMsIGRhdGEgZmFjdHMsIGFuZCBkaWFnbm9zdGljcy5cbiAqXG4gKiBJdCBpcyByZWdpc3RlcmVkIGZvciBgLm1vY2tgIGZpbGVzIG9ubHkuIEl0IG11c3QgbmV2ZXIgY2xhaW0gdG8gYW5hbHl6ZSByZWFsXG4gKiBgLmpzYCBvciBgLmNwcGAgc291cmNlcyBcdTIwMTQgdGhhdCB3b3VsZCBtYWtlIHRoZSBleHRlbnNpb24gbG9vayBtb3JlIGNhcGFibGUgdGhhblxuICogaXQgaXMuXG4gKi9cblxuaW1wb3J0IHtcbiAgY3JlYXRlQW5hbHlzaXNSdW4sXG4gIGNyZWF0ZUNvbnRyb2xDb25zdHJ1Y3QsXG4gIGNyZWF0ZURhdGFGYWN0LFxuICBjcmVhdGVEaWFnbm9zdGljLFxuICBjcmVhdGVFdmlkZW5jZSxcbiAgY3JlYXRlRmlsZVJlY29yZCxcbiAgY3JlYXRlUmVsYXRpb25zaGlwLFxuICBjcmVhdGVTeW1ib2wsXG59IGZyb20gJy4uLy4uL2NvcmUvY3NyL2VudGl0aWVzLmpzJztcbmltcG9ydCB7XG4gIGNyZWF0ZUFub255bW91c0Rpc2FtYmlndWF0b3IsXG4gIGNyZWF0ZUZpbGVJZCxcbiAgY3JlYXRlSWRlbnRpdHlBbGxvY2F0b3IsXG4gIGNyZWF0ZU92ZXJsb2FkRGlzYW1iaWd1YXRvcixcbiAgY3JlYXRlUmVsYXRpb25zaGlwQWxsb2NhdG9yLFxufSBmcm9tICcuLi8uLi9jb3JlL2Nzci9pZGVudGl0eS5qcyc7XG5pbXBvcnQgeyBjcmVhdGVDYXBhYmlsaXRpZXMgfSBmcm9tICcuLi8uLi9jb3JlL2FkYXB0ZXJSZWdpc3RyeS5qcyc7XG5cbmV4cG9ydCBjb25zdCBNT0NLX1JVTl9JRCA9ICdydW46bW9jay0xJztcbmV4cG9ydCBjb25zdCBNT0NLX0xBTkdVQUdFID0gJ21vY2snO1xuXG5jb25zdCBEQl9QQVRIID0gJ3NyYy9EQkhhbmRsZXIuanMnO1xuY29uc3QgU1FMSVRFX1BBVEggPSAnc3JjL1NRTGl0ZUhlbHBlci5qcyc7XG5cbmNvbnN0IERCX0ZJTEVfSUQgPSBjcmVhdGVGaWxlSWQoREJfUEFUSCk7XG5jb25zdCBTUUxJVEVfRklMRV9JRCA9IGNyZWF0ZUZpbGVJZChTUUxJVEVfUEFUSCk7XG5cbmNvbnN0IGlkZW50aXR5ID0gY3JlYXRlSWRlbnRpdHlBbGxvY2F0b3IoeyBsYW5ndWFnZTogTU9DS19MQU5HVUFHRSB9KTtcbmNvbnN0IHJlbGF0aW9uc2hpcHMgPSBjcmVhdGVSZWxhdGlvbnNoaXBBbGxvY2F0b3IoKTtcblxuLyoqXG4gKiBAcGFyYW0ge3twYXRoOiBzdHJpbmcsIGtpbmQ6IHN0cmluZywgbmFtZT86IHN0cmluZywgcXVhbGlmaWVkTmFtZTogc3RyaW5nLCBzdGFydExpbmU6IG51bWJlciwgc3RhcnRDb2x1bW4/OiBudW1iZXIsIGVuZExpbmU6IG51bWJlciwgZW5kQ29sdW1uPzogbnVtYmVyLCBwYXJlbnRJZD86IHN0cmluZywgZGlzYW1iaWd1YXRvcj86IHN0cmluZywgc2lnbmF0dXJlPzogc3RyaW5nLCB2aXNpYmlsaXR5PzogJ3B1YmxpYyd8J3ByaXZhdGUnfCdwcm90ZWN0ZWQnfCdsb2NhbCcsIGV4dGVuc2lvbnM/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn19IGlucHV0XG4gKi9cbmZ1bmN0aW9uIHN5bWJvbChpbnB1dCkge1xuICBjb25zdCBmaWxlSWQgPSBpbnB1dC5wYXRoID09PSBEQl9QQVRIID8gREJfRklMRV9JRCA6IFNRTElURV9GSUxFX0lEO1xuICBjb25zdCBpZGVudGl0eVZhbHVlID0gaWRlbnRpdHkuc3ltYm9sKHtcbiAgICBwYXRoOiBpbnB1dC5wYXRoLFxuICAgIGtpbmQ6IGlucHV0LmtpbmQsXG4gICAgcXVhbGlmaWVkTmFtZTogaW5wdXQucXVhbGlmaWVkTmFtZSxcbiAgICBkaXNhbWJpZ3VhdG9yOiBpbnB1dC5kaXNhbWJpZ3VhdG9yLFxuICB9KTtcbiAgcmV0dXJuIGNyZWF0ZVN5bWJvbCh7XG4gICAgc3ltYm9sSWQ6IGlkZW50aXR5VmFsdWUuc3ltYm9sSWQsXG4gICAga2luZDogaW5wdXQua2luZCxcbiAgICBuYW1lOiBpbnB1dC5uYW1lID8/IGlucHV0LnF1YWxpZmllZE5hbWUuc3BsaXQoJy4nKS5wb3AoKSA/PyBpbnB1dC5xdWFsaWZpZWROYW1lLFxuICAgIHF1YWxpZmllZE5hbWU6IGlucHV0LnF1YWxpZmllZE5hbWUsXG4gICAgbGFuZ3VhZ2U6IE1PQ0tfTEFOR1VBR0UsXG4gICAgZGVjbGFyYXRpb246IHtcbiAgICAgIGZpbGVJZCxcbiAgICAgIHN0YXJ0TGluZTogaW5wdXQuc3RhcnRMaW5lLFxuICAgICAgc3RhcnRDb2x1bW46IGlucHV0LnN0YXJ0Q29sdW1uID8/IDAsXG4gICAgICBlbmRMaW5lOiBpbnB1dC5lbmRMaW5lLFxuICAgICAgZW5kQ29sdW1uOiBpbnB1dC5lbmRDb2x1bW4gPz8gMCxcbiAgICB9LFxuICAgIHNpZ25hdHVyZTogaW5wdXQuc2lnbmF0dXJlLFxuICAgIHBhcmVudElkOiBpbnB1dC5wYXJlbnRJZCxcbiAgICB2aXNpYmlsaXR5OiBpbnB1dC52aXNpYmlsaXR5LFxuICAgIGRpc2FtYmlndWF0b3I6IGlkZW50aXR5VmFsdWUuZGlzYW1iaWd1YXRvcixcbiAgICBleHRlbnNpb25zOiBpbnB1dC5leHRlbnNpb25zLFxuICB9KTtcbn1cblxuY29uc3QgREJIQU5ETEVSID0gc3ltYm9sKHtcbiAgcGF0aDogREJfUEFUSCxcbiAga2luZDogJ2NsYXNzJyxcbiAgcXVhbGlmaWVkTmFtZTogJ0RCSGFuZGxlcicsXG4gIHN0YXJ0TGluZTogMyxcbiAgc3RhcnRDb2x1bW46IDAsXG4gIGVuZExpbmU6IDMwLFxuICBlbmRDb2x1bW46IDEsXG4gIHZpc2liaWxpdHk6ICdwdWJsaWMnLFxuICBleHRlbnNpb25zOiB7IGV4cG9ydGVkOiB0cnVlIH0sXG59KTtcblxuY29uc3QgQ0hFQ0tfREIgPSBzeW1ib2woe1xuICBwYXRoOiBEQl9QQVRILFxuICBraW5kOiAnbWV0aG9kJyxcbiAgcXVhbGlmaWVkTmFtZTogJ0RCSGFuZGxlci5jaGVja19kYl9leGlzdHMnLFxuICBzdGFydExpbmU6IDksXG4gIHN0YXJ0Q29sdW1uOiAyLFxuICBlbmRMaW5lOiAyMixcbiAgZW5kQ29sdW1uOiAzLFxuICBwYXJlbnRJZDogREJIQU5ETEVSLnN5bWJvbElkLFxuICB2aXNpYmlsaXR5OiAncHVibGljJyxcbiAgc2lnbmF0dXJlOiAnY2hlY2tfZGJfZXhpc3RzKHBhdGg6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4nLFxuICBleHRlbnNpb25zOiB7IGFzeW5jOiB0cnVlIH0sXG59KTtcblxuY29uc3QgT1BFTl9PTkUgPSBzeW1ib2woe1xuICBwYXRoOiBEQl9QQVRILFxuICBraW5kOiAnbWV0aG9kJyxcbiAgcXVhbGlmaWVkTmFtZTogJ0RCSGFuZGxlci5vcGVuJyxcbiAgc3RhcnRMaW5lOiAyNCxcbiAgc3RhcnRDb2x1bW46IDIsXG4gIGVuZExpbmU6IDI2LFxuICBlbmRDb2x1bW46IDMsXG4gIHBhcmVudElkOiBEQkhBTkRMRVIuc3ltYm9sSWQsXG4gIHZpc2liaWxpdHk6ICdwdWJsaWMnLFxuICBkaXNhbWJpZ3VhdG9yOiBjcmVhdGVPdmVybG9hZERpc2FtYmlndWF0b3IoWydwYXRoJ10pLFxuICBzaWduYXR1cmU6ICdvcGVuKHBhdGg6IHN0cmluZyk6IHZvaWQnLFxufSk7XG5cbmNvbnN0IE9QRU5fVFdPID0gc3ltYm9sKHtcbiAgcGF0aDogREJfUEFUSCxcbiAga2luZDogJ21ldGhvZCcsXG4gIHF1YWxpZmllZE5hbWU6ICdEQkhhbmRsZXIub3BlbicsXG4gIHN0YXJ0TGluZTogMjcsXG4gIHN0YXJ0Q29sdW1uOiAyLFxuICBlbmRMaW5lOiAyOSxcbiAgZW5kQ29sdW1uOiAzLFxuICBwYXJlbnRJZDogREJIQU5ETEVSLnN5bWJvbElkLFxuICB2aXNpYmlsaXR5OiAncHVibGljJyxcbiAgZGlzYW1iaWd1YXRvcjogY3JlYXRlT3ZlcmxvYWREaXNhbWJpZ3VhdG9yKFsncGF0aCcsICdlbmNvZGluZyddKSxcbiAgc2lnbmF0dXJlOiAnb3BlbihwYXRoOiBzdHJpbmcsIGVuY29kaW5nOiBzdHJpbmcpOiB2b2lkJyxcbn0pO1xuXG5jb25zdCBDSEVDS19JID0gc3ltYm9sKHtcbiAgcGF0aDogREJfUEFUSCxcbiAga2luZDogJ3ZhcmlhYmxlJyxcbiAgcXVhbGlmaWVkTmFtZTogJ0RCSGFuZGxlci5jaGVja19kYl9leGlzdHMuaScsXG4gIHN0YXJ0TGluZTogMTIsXG4gIHN0YXJ0Q29sdW1uOiA0LFxuICBlbmRMaW5lOiAxMixcbiAgZW5kQ29sdW1uOiA1LFxuICBwYXJlbnRJZDogQ0hFQ0tfREIuc3ltYm9sSWQsXG4gIHZpc2liaWxpdHk6ICdsb2NhbCcsXG59KTtcblxuY29uc3QgTUFJTiA9IHN5bWJvbCh7XG4gIHBhdGg6IERCX1BBVEgsXG4gIGtpbmQ6ICdmdW5jdGlvbicsXG4gIHF1YWxpZmllZE5hbWU6ICdtYWluJyxcbiAgc3RhcnRMaW5lOiAzMyxcbiAgc3RhcnRDb2x1bW46IDAsXG4gIGVuZExpbmU6IDQwLFxuICBlbmRDb2x1bW46IDEsXG4gIHZpc2liaWxpdHk6ICdwdWJsaWMnLFxuICBzaWduYXR1cmU6ICdtYWluKCk6IHZvaWQnLFxufSk7XG5cbmNvbnN0IE1BSU5fSSA9IHN5bWJvbCh7XG4gIHBhdGg6IERCX1BBVEgsXG4gIGtpbmQ6ICd2YXJpYWJsZScsXG4gIHF1YWxpZmllZE5hbWU6ICdtYWluLmknLFxuICBzdGFydExpbmU6IDM1LFxuICBzdGFydENvbHVtbjogNCxcbiAgZW5kTGluZTogMzUsXG4gIGVuZENvbHVtbjogNSxcbiAgcGFyZW50SWQ6IE1BSU4uc3ltYm9sSWQsXG4gIHZpc2liaWxpdHk6ICdsb2NhbCcsXG59KTtcblxuY29uc3QgTUFJTl9MQU1CREEgPSBzeW1ib2woe1xuICBwYXRoOiBEQl9QQVRILFxuICBraW5kOiAnbGFtYmRhJyxcbiAgbmFtZTogJzxhbm9ueW1vdXM+JyxcbiAgcXVhbGlmaWVkTmFtZTogJ21haW4uPGFub255bW91cz4nLFxuICBzdGFydExpbmU6IDM2LFxuICBzdGFydENvbHVtbjogNCxcbiAgZW5kTGluZTogMzgsXG4gIGVuZENvbHVtbjogNSxcbiAgcGFyZW50SWQ6IE1BSU4uc3ltYm9sSWQsXG4gIHZpc2liaWxpdHk6ICdsb2NhbCcsXG4gIGRpc2FtYmlndWF0b3I6IGNyZWF0ZUFub255bW91c0Rpc2FtYmlndWF0b3IoMSksXG59KTtcblxuY29uc3QgU1FMSVRFID0gc3ltYm9sKHtcbiAgcGF0aDogU1FMSVRFX1BBVEgsXG4gIGtpbmQ6ICdjbGFzcycsXG4gIHF1YWxpZmllZE5hbWU6ICdTUUxpdGVIZWxwZXInLFxuICBzdGFydExpbmU6IDIsXG4gIHN0YXJ0Q29sdW1uOiAwLFxuICBlbmRMaW5lOiAyNCxcbiAgZW5kQ29sdW1uOiAxLFxuICB2aXNpYmlsaXR5OiAncHVibGljJyxcbn0pO1xuXG5jb25zdCBDSEVDS19EQVRBID0gc3ltYm9sKHtcbiAgcGF0aDogU1FMSVRFX1BBVEgsXG4gIGtpbmQ6ICdtZXRob2QnLFxuICBxdWFsaWZpZWROYW1lOiAnU1FMaXRlSGVscGVyLmNoZWNrRGF0YScsXG4gIHN0YXJ0TGluZTogNixcbiAgc3RhcnRDb2x1bW46IDIsXG4gIGVuZExpbmU6IDIwLFxuICBlbmRDb2x1bW46IDMsXG4gIHBhcmVudElkOiBTUUxJVEUuc3ltYm9sSWQsXG4gIHZpc2liaWxpdHk6ICdwdWJsaWMnLFxuICBzaWduYXR1cmU6ICdjaGVja0RhdGEoZGF0YTogdW5rbm93bik6IGJvb2xlYW4nLFxufSk7XG5cbi8vIE5vbi1BU0NJSSBpZGVudGlmaWVyOiByYW5nZXMgYW5kIGlkcyBtdXN0IHN1cnZpdmUgd2l0aG91dCBub3JtYWxpc2F0aW9uLlxuY29uc3QgTkFJVkUgPSBzeW1ib2woe1xuICBwYXRoOiBTUUxJVEVfUEFUSCxcbiAga2luZDogJ2Z1bmN0aW9uJyxcbiAgcXVhbGlmaWVkTmFtZTogJ25hXHUwMEVGdmUnLFxuICBzdGFydExpbmU6IDEsXG4gIHN0YXJ0Q29sdW1uOiAwLFxuICBlbmRMaW5lOiAzLFxuICBlbmRDb2x1bW46IDEsXG4gIHZpc2liaWxpdHk6ICdwdWJsaWMnLFxufSk7XG5cbi8qKiBAdHlwZSB7aW1wb3J0KCcuLi8uLi9jb3JlL2Nzci9lbnRpdGllcy5qcycpLlN5bWJvbFJlY29yZFtdfSAqL1xuY29uc3QgU1lNQk9MUyA9IFtcbiAgU1FMSVRFLFxuICBDSEVDS19EQVRBLFxuICBOQUlWRSxcbiAgREJIQU5ETEVSLFxuICBDSEVDS19EQixcbiAgT1BFTl9PTkUsXG4gIE9QRU5fVFdPLFxuICBDSEVDS19JLFxuICBNQUlOLFxuICBNQUlOX0ksXG4gIE1BSU5fTEFNQkRBLFxuXTtcblxuLyoqXG4gKiBAcGFyYW0ge3tpZD86IHN0cmluZywgdHlwZTogc3RyaW5nLCBmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcsIHN0YXR1czogJ3Jlc29sdmVkJ3wnaW5mZXJyZWQnfCdwb3NzaWJsZSd8J3VucmVzb2x2ZWQnfCdzdGFsZScsIHJlYXNvbkNvZGU/OiBzdHJpbmcsIHNpdGU/OiB7ZmlsZUlkOiBzdHJpbmcsIHN0YXJ0TGluZTogbnVtYmVyLCBzdGFydENvbHVtbjogbnVtYmVyLCBlbmRMaW5lOiBudW1iZXIsIGVuZENvbHVtbjogbnVtYmVyfSwgZXZpZGVuY2U/OiBBcnJheTx7a2luZDogJ3NvdXJjZV9yYW5nZSd8J3N5bWJvbCcsIHJhbmdlPzogb2JqZWN0LCBzeW1ib2xJZD86IHN0cmluZ30+fX0gaW5wdXRcbiAqL1xuZnVuY3Rpb24gcmVsYXRpb25zaGlwKGlucHV0KSB7XG4gIHJldHVybiBjcmVhdGVSZWxhdGlvbnNoaXAoe1xuICAgIHJlbGF0aW9uc2hpcElkOiBpbnB1dC5pZCA/PyByZWxhdGlvbnNoaXBzLnJlbGF0aW9uc2hpcChpbnB1dCksXG4gICAgdHlwZTogaW5wdXQudHlwZSxcbiAgICBmcm9tOiBpbnB1dC5mcm9tLFxuICAgIHRvOiBpbnB1dC50byxcbiAgICBzdGF0dXM6IGlucHV0LnN0YXR1cyxcbiAgICByZWFzb25Db2RlOiBpbnB1dC5yZWFzb25Db2RlLFxuICAgIHNpdGU6IGlucHV0LnNpdGUsXG4gICAgZXZpZGVuY2U6IGlucHV0LmV2aWRlbmNlID8/IFtdLFxuICB9KTtcbn1cblxuY29uc3Qgc2l0ZSA9IChmaWxlSWQsIHN0YXJ0TGluZSwgc3RhcnRDb2x1bW4sIGVuZExpbmUsIGVuZENvbHVtbikgPT4gKHtcbiAgZmlsZUlkLFxuICBzdGFydExpbmUsXG4gIHN0YXJ0Q29sdW1uLFxuICBlbmRMaW5lLFxuICBlbmRDb2x1bW4sXG59KTtcblxuLyoqIEB0eXBlIHtpbXBvcnQoJy4uLy4uL2NvcmUvY3NyL2VudGl0aWVzLmpzJykuUmVsYXRpb25zaGlwW119ICovXG5jb25zdCBSRUxBVElPTlNISVBTID0gW1xuICByZWxhdGlvbnNoaXAoe1xuICAgIHR5cGU6ICdjYWxscycsXG4gICAgZnJvbTogTUFJTi5zeW1ib2xJZCxcbiAgICB0bzogQ0hFQ0tfREIuc3ltYm9sSWQsXG4gICAgc3RhdHVzOiAncmVzb2x2ZWQnLFxuICAgIHNpdGU6IHNpdGUoREJfRklMRV9JRCwgMzcsIDIsIDM3LCAzNyksXG4gICAgZXZpZGVuY2U6IFtcbiAgICAgIGNyZWF0ZUV2aWRlbmNlKHsga2luZDogJ3NvdXJjZV9yYW5nZScsIHJhbmdlOiBzaXRlKERCX0ZJTEVfSUQsIDM3LCAyLCAzNywgMzcpIH0pLFxuICAgICAgY3JlYXRlRXZpZGVuY2UoeyBraW5kOiAnc3ltYm9sJywgc3ltYm9sSWQ6IE1BSU4uc3ltYm9sSWQgfSksXG4gICAgXSxcbiAgfSksXG4gIHJlbGF0aW9uc2hpcCh7XG4gICAgdHlwZTogJ2NhbGxzJyxcbiAgICBmcm9tOiBDSEVDS19EQi5zeW1ib2xJZCxcbiAgICB0bzogQ0hFQ0tfREFUQS5zeW1ib2xJZCxcbiAgICBzdGF0dXM6ICdyZXNvbHZlZCcsXG4gICAgc2l0ZTogc2l0ZShEQl9GSUxFX0lELCAxNSwgNCwgMTUsIDI3KSxcbiAgfSksXG4gIHJlbGF0aW9uc2hpcCh7XG4gICAgdHlwZTogJ2NhbGxzJyxcbiAgICBmcm9tOiBDSEVDS19EQi5zeW1ib2xJZCxcbiAgICB0bzogJ2V4dGVybmFsOmxvZ2dlci5pbmZvJyxcbiAgICBzdGF0dXM6ICd1bnJlc29sdmVkJyxcbiAgICByZWFzb25Db2RlOiAndW5rbm93bl9pbXBvcnRfdGFyZ2V0JyxcbiAgICBzaXRlOiBzaXRlKERCX0ZJTEVfSUQsIDE5LCA0LCAxOSwgMTgpLFxuICB9KSxcbiAgcmVsYXRpb25zaGlwKHtcbiAgICB0eXBlOiAnY2FsbHMnLFxuICAgIGZyb206IENIRUNLX0RCLnN5bWJvbElkLFxuICAgIHRvOiAnZXh0ZXJuYWw6ZnMucmVhZEZpbGUnLFxuICAgIHN0YXR1czogJ3VucmVzb2x2ZWQnLFxuICAgIHJlYXNvbkNvZGU6ICdvdXRfb2Zfc2NvcGUnLFxuICAgIHNpdGU6IHNpdGUoREJfRklMRV9JRCwgMjAsIDQsIDIwLCAyMiksXG4gIH0pLFxuICByZWxhdGlvbnNoaXAoe1xuICAgIHR5cGU6ICdkZWZpbmVzJyxcbiAgICBmcm9tOiBEQkhBTkRMRVIuc3ltYm9sSWQsXG4gICAgdG86IENIRUNLX0RCLnN5bWJvbElkLFxuICAgIHN0YXR1czogJ3Jlc29sdmVkJyxcbiAgfSksXG4gIHJlbGF0aW9uc2hpcCh7XG4gICAgdHlwZTogJ2RlZmluZXMnLFxuICAgIGZyb206IERCSEFORExFUi5zeW1ib2xJZCxcbiAgICB0bzogT1BFTl9PTkUuc3ltYm9sSWQsXG4gICAgc3RhdHVzOiAncmVzb2x2ZWQnLFxuICB9KSxcbiAgcmVsYXRpb25zaGlwKHtcbiAgICB0eXBlOiAnZGVmaW5lcycsXG4gICAgZnJvbTogREJIQU5ETEVSLnN5bWJvbElkLFxuICAgIHRvOiBPUEVOX1RXTy5zeW1ib2xJZCxcbiAgICBzdGF0dXM6ICdyZXNvbHZlZCcsXG4gIH0pLFxuICByZWxhdGlvbnNoaXAoe1xuICAgIHR5cGU6ICdjYWxscycsXG4gICAgZnJvbTogTUFJTi5zeW1ib2xJZCxcbiAgICB0bzogT1BFTl9PTkUuc3ltYm9sSWQsXG4gICAgc3RhdHVzOiAncG9zc2libGUnLFxuICAgIHJlYXNvbkNvZGU6ICdvdmVybG9hZF9hbWJpZ3VvdXMnLFxuICAgIHNpdGU6IHNpdGUoREJfRklMRV9JRCwgMzYsIDIsIDM2LCAyMCksXG4gIH0pLFxuICByZWxhdGlvbnNoaXAoe1xuICAgIHR5cGU6ICdyZWZlcmVuY2VzJyxcbiAgICBmcm9tOiBNQUlOLnN5bWJvbElkLFxuICAgIHRvOiBOQUlWRS5zeW1ib2xJZCxcbiAgICBzdGF0dXM6ICdpbmZlcnJlZCcsXG4gICAgcmVhc29uQ29kZTogJ2Z1bmN0aW9uX3BvaW50ZXInLFxuICAgIHNpdGU6IHNpdGUoREJfRklMRV9JRCwgMzgsIDQsIDM4LCAxMiksXG4gIH0pLFxuICByZWxhdGlvbnNoaXAoe1xuICAgIHR5cGU6ICdjYXB0dXJlcycsXG4gICAgZnJvbTogTUFJTl9MQU1CREEuc3ltYm9sSWQsXG4gICAgdG86IE1BSU5fSS5zeW1ib2xJZCxcbiAgICBzdGF0dXM6ICdzdGFsZScsXG4gICAgcmVhc29uQ29kZTogJ2luZGV4X3N0YWxlJyxcbiAgICBzaXRlOiBzaXRlKERCX0ZJTEVfSUQsIDM2LCA0LCAzOCwgNSksXG4gIH0pLFxuXTtcblxuLyoqIEB0eXBlIHtpbXBvcnQoJy4uLy4uL2NvcmUvY3NyL2VudGl0aWVzLmpzJykuQ29udHJvbENvbnN0cnVjdFtdfSAqL1xuY29uc3QgQ09OU1RSVUNUUyA9IFtcbiAgY3JlYXRlQ29udHJvbENvbnN0cnVjdCh7XG4gICAgY29uc3RydWN0SWQ6ICdjb25zdHJ1Y3Q6bW9jazptYWluOmVudHJ5JyxcbiAgICBraW5kOiAnZW50cnknLFxuICAgIHN5bWJvbElkOiBNQUlOLnN5bWJvbElkLFxuICAgIGNoaWxkcmVuOiBbJ2NvbnN0cnVjdDptb2NrOm1haW46aWYnXSxcbiAgICBzb3VyY2VSYW5nZTogc2l0ZShEQl9GSUxFX0lELCAzMywgMCwgNDAsIDEpLFxuICB9KSxcbiAgY3JlYXRlQ29udHJvbENvbnN0cnVjdCh7XG4gICAgY29uc3RydWN0SWQ6ICdjb25zdHJ1Y3Q6bW9jazptYWluOmlmJyxcbiAgICBraW5kOiAnaWYnLFxuICAgIHBhcmVudElkOiAnY29uc3RydWN0Om1vY2s6bWFpbjplbnRyeScsXG4gICAgc3ltYm9sSWQ6IE1BSU4uc3ltYm9sSWQsXG4gICAgY2hpbGRyZW46IFsnY29uc3RydWN0Om1vY2s6bWFpbjpyZXR1cm4nXSxcbiAgICBjb25kaXRpb246IHNpdGUoREJfRklMRV9JRCwgMzUsIDYsIDM1LCAyMCksXG4gICAgc291cmNlUmFuZ2U6IHNpdGUoREJfRklMRV9JRCwgMzUsIDIsIDM4LCAzKSxcbiAgfSksXG4gIGNyZWF0ZUNvbnRyb2xDb25zdHJ1Y3Qoe1xuICAgIGNvbnN0cnVjdElkOiAnY29uc3RydWN0Om1vY2s6bWFpbjpyZXR1cm4nLFxuICAgIGtpbmQ6ICdyZXR1cm4nLFxuICAgIHBhcmVudElkOiAnY29uc3RydWN0Om1vY2s6bWFpbjppZicsXG4gICAgc3ltYm9sSWQ6IE1BSU4uc3ltYm9sSWQsXG4gICAgc291cmNlUmFuZ2U6IHNpdGUoREJfRklMRV9JRCwgMzksIDIsIDM5LCAzKSxcbiAgfSksXG4gIGNyZWF0ZUNvbnRyb2xDb25zdHJ1Y3Qoe1xuICAgIGNvbnN0cnVjdElkOiAnY29uc3RydWN0Om1vY2s6Y2hlY2s6ZW50cnknLFxuICAgIGtpbmQ6ICdlbnRyeScsXG4gICAgc3ltYm9sSWQ6IENIRUNLX0RCLnN5bWJvbElkLFxuICAgIGNoaWxkcmVuOiBbJ2NvbnN0cnVjdDptb2NrOmNoZWNrOnRyeSddLFxuICAgIHNvdXJjZVJhbmdlOiBzaXRlKERCX0ZJTEVfSUQsIDksIDIsIDIyLCAzKSxcbiAgfSksXG4gIGNyZWF0ZUNvbnRyb2xDb25zdHJ1Y3Qoe1xuICAgIGNvbnN0cnVjdElkOiAnY29uc3RydWN0Om1vY2s6Y2hlY2s6dHJ5JyxcbiAgICBraW5kOiAndHJ5JyxcbiAgICBwYXJlbnRJZDogJ2NvbnN0cnVjdDptb2NrOmNoZWNrOmVudHJ5JyxcbiAgICBzeW1ib2xJZDogQ0hFQ0tfREIuc3ltYm9sSWQsXG4gICAgc291cmNlUmFuZ2U6IHNpdGUoREJfRklMRV9JRCwgMTEsIDQsIDIxLCA1KSxcbiAgfSksXG5dO1xuXG4vKiogQHR5cGUge2ltcG9ydCgnLi4vLi4vY29yZS9jc3IvZW50aXRpZXMuanMnKS5EYXRhRmFjdFtdfSAqL1xuY29uc3QgREFUQV9GQUNUUyA9IFtcbiAgY3JlYXRlRGF0YUZhY3Qoe1xuICAgIGZhY3RJZDogJ2ZhY3Q6bW9jazppMTpkZWZpbml0aW9uJyxcbiAgICBraW5kOiAnZGVmaW5pdGlvbicsXG4gICAgc3ltYm9sSWQ6IENIRUNLX0kuc3ltYm9sSWQsXG4gICAgYXQ6IHNpdGUoREJfRklMRV9JRCwgMTIsIDgsIDEyLCA5KSxcbiAgICBzdGF0dXM6ICdyZXNvbHZlZCcsXG4gIH0pLFxuICBjcmVhdGVEYXRhRmFjdCh7XG4gICAgZmFjdElkOiAnZmFjdDptb2NrOmkxOnVzZScsXG4gICAga2luZDogJ3VzZScsXG4gICAgc3ltYm9sSWQ6IENIRUNLX0kuc3ltYm9sSWQsXG4gICAgYXQ6IHNpdGUoREJfRklMRV9JRCwgMTMsIDgsIDEzLCA5KSxcbiAgICBzdGF0dXM6ICdyZXNvbHZlZCcsXG4gIH0pLFxuICBjcmVhdGVEYXRhRmFjdCh7XG4gICAgZmFjdElkOiAnZmFjdDptb2NrOmkyOmFzc2lnbm1lbnQnLFxuICAgIGtpbmQ6ICdhc3NpZ25tZW50JyxcbiAgICBzeW1ib2xJZDogTUFJTl9JLnN5bWJvbElkLFxuICAgIGF0OiBzaXRlKERCX0ZJTEVfSUQsIDM1LCA0LCAzNSwgOSksXG4gICAgcmVsYXRlZFN5bWJvbElkOiBDSEVDS19JLnN5bWJvbElkLFxuICAgIHN0YXR1czogJ2luZmVycmVkJyxcbiAgICByZWFzb25Db2RlOiAnZHluYW1pY19kaXNwYXRjaCcsXG4gIH0pLFxuXTtcblxuY29uc3QgRElBR05PU1RJQ1MgPSBbXG4gIGNyZWF0ZURpYWdub3N0aWMoe1xuICAgIHNldmVyaXR5OiAnd2FybmluZycsXG4gICAgY29kZTogJ21vY2tfZGF0YScsXG4gICAgbWVzc2FnZTpcbiAgICAgICdUaGlzIGdyYXBoIGNvbWVzIGZyb20gdGhlIG1vY2sgYWRhcHRlci4gSXQgZGVtb25zdHJhdGVzIHRoZSBDU1IgY29udHJhY3Q7IGl0IGlzIG5vdCBhbmFseXNpcyBvZiB5b3VyIGNvZGUuJyxcbiAgICBhZmZlY3RzOiBbTUFJTi5zeW1ib2xJZF0sXG4gIH0pLFxuICBjcmVhdGVEaWFnbm9zdGljKHtcbiAgICBzZXZlcml0eTogJ2luZm8nLFxuICAgIGNvZGU6ICdwYXJ0aWFsX2NvdmVyYWdlJyxcbiAgICBtZXNzYWdlOiAnTW9jayBhbmFseXNpcyBpbnRlbnRpb25hbGx5IGNvdmVycyBvbmx5IHRoZSBzYW1wbGUgZml4dHVyZXMuJyxcbiAgICBhZmZlY3RzOiBbXSxcbiAgfSksXG5dO1xuXG4vKipcbiAqIEByZXR1cm5zIHtpbXBvcnQoJy4uLy4uL2NvcmUvY3NyL2VudGl0aWVzLmpzJykuQW5hbHlzaXNSdW59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVNb2NrQW5hbHlzaXMoKSB7XG4gIHJldHVybiBjcmVhdGVBbmFseXNpc1J1bih7XG4gICAgcnVuSWQ6IE1PQ0tfUlVOX0lELFxuICAgIGFkYXB0ZXJJZDogJ21vY2snLFxuICAgIGFkYXB0ZXJWZXJzaW9uOiAnMC4xLjAnLFxuICAgIGxhbmd1YWdlOiBNT0NLX0xBTkdVQUdFLFxuICAgIHNjb3BlOiB7IGtpbmQ6ICd3b3Jrc3BhY2UnIH0sXG4gICAgY29tcGxldGVuZXNzOiAncGFydGlhbCcsXG4gICAgZmlsZXM6IFtcbiAgICAgIGNyZWF0ZUZpbGVSZWNvcmQoe1xuICAgICAgICBmaWxlSWQ6IERCX0ZJTEVfSUQsXG4gICAgICAgIHBhdGg6IERCX1BBVEgsXG4gICAgICAgIGxhbmd1YWdlOiBNT0NLX0xBTkdVQUdFLFxuICAgICAgICBjb250ZW50SGFzaDogJ2ZudjFhOm1vY2stZGJoYW5kbGVyJyxcbiAgICAgICAgc2l6ZUJ5dGVzOiA4MTIsXG4gICAgICAgIGxpbmVDb3VudDogNDEsXG4gICAgICB9KSxcbiAgICAgIGNyZWF0ZUZpbGVSZWNvcmQoe1xuICAgICAgICBmaWxlSWQ6IFNRTElURV9GSUxFX0lELFxuICAgICAgICBwYXRoOiBTUUxJVEVfUEFUSCxcbiAgICAgICAgbGFuZ3VhZ2U6IE1PQ0tfTEFOR1VBR0UsXG4gICAgICAgIGNvbnRlbnRIYXNoOiAnZm52MWE6bW9jay1zcWxpdGVoZWxwZXInLFxuICAgICAgICBzaXplQnl0ZXM6IDUwNCxcbiAgICAgICAgbGluZUNvdW50OiAyNyxcbiAgICAgIH0pLFxuICAgIF0sXG4gICAgc3ltYm9sczogU1lNQk9MUy5tYXAoKGVudHJ5KSA9PiAoeyAuLi5lbnRyeSwgZGVjbGFyYXRpb246IHsgLi4uZW50cnkuZGVjbGFyYXRpb24gfSB9KSksXG4gICAgcmVsYXRpb25zaGlwczogUkVMQVRJT05TSElQUy5tYXAoKGVudHJ5KSA9PiAoe1xuICAgICAgLi4uZW50cnksXG4gICAgICBldmlkZW5jZTogZW50cnkuZXZpZGVuY2UubWFwKChpdGVtKSA9PiAoeyAuLi5pdGVtIH0pKSxcbiAgICB9KSksXG4gICAgY29udHJvbENvbnN0cnVjdHM6IENPTlNUUlVDVFMubWFwKChlbnRyeSkgPT4gKHsgLi4uZW50cnkgfSkpLFxuICAgIGRhdGFGYWN0czogREFUQV9GQUNUUy5tYXAoKGVudHJ5KSA9PiAoeyAuLi5lbnRyeSB9KSksXG4gICAgZGlhZ25vc3RpY3M6IERJQUdOT1NUSUNTLm1hcCgoZW50cnkpID0+ICh7IC4uLmVudHJ5IH0pKSxcbiAgfSk7XG59XG5cbmV4cG9ydCBjb25zdCBNT0NLX0ZJTEVfVEVYVCA9IFtcbiAgJy8vIFBoYXNlIDEgbW9jayBmaXh0dXJlIFx1MjAxNCBub3QgcmVhbCBwcm9qZWN0IHNvdXJjZS4nLFxuICAnZnVuY3Rpb24gbmFcdTAwRUZ2ZSh2YWx1ZSkgeycsXG4gICcgIHJldHVybiB2YWx1ZTsnLFxuICAnfScsXG4gICdjbGFzcyBEQkhhbmRsZXIgeycsXG4gICcgIG9wZW4ocGF0aCkge30nLFxuICAnICBvcGVuKHBhdGgsIGVuY29kaW5nKSB7fScsXG4gICcgIGFzeW5jIGNoZWNrX2RiX2V4aXN0cyhwYXRoKSB7JyxcbiAgJyAgICBsZXQgaSA9IDA7JyxcbiAgJyAgICBpICs9IDE7JyxcbiAgJyAgICByZXR1cm4gdGhpcy5vcGVuKHBhdGgpOycsXG4gICcgIH0nLFxuICAnfScsXG4gICcnLFxuICAnZnVuY3Rpb24gbWFpbigpIHsnLFxuICAnICBsZXQgaSA9IDA7JyxcbiAgJyAgY29uc3QgY2FsbGJhY2sgPSAoKSA9PiBpOycsXG4gICcgIG5ldyBEQkhhbmRsZXIoKS5jaGVja19kYl9leGlzdHMoXCIuL2RhdGEuZGJcIik7JyxcbiAgJyAgbmFcdTAwRUZ2ZShjYWxsYmFjayk7JyxcbiAgJ30nLFxuXS5qb2luKCdcXG4nKTtcblxuLyoqIEB0eXBlIHtpbXBvcnQoJy4uLy4uL2NvcmUvYWRhcHRlclJlZ2lzdHJ5LmpzJykuQWRhcHRlckRlc2NyaXB0b3J9ICovXG5leHBvcnQgY29uc3QgbW9ja0FkYXB0ZXIgPSB7XG4gIGlkOiAnbW9jaycsXG4gIGRpc3BsYXlOYW1lOiAnTW9jayBhZGFwdGVyIChQaGFzZSAxKScsXG4gIHZlcnNpb246ICcwLjEuMCcsXG4gIGxhbmd1YWdlczogW01PQ0tfTEFOR1VBR0VdLFxuICBleHRlbnNpb25zOiBbJy5tb2NrJ10sXG4gIGNhcGFiaWxpdGllczogY3JlYXRlQ2FwYWJpbGl0aWVzKHtcbiAgICBwYXJzZTogdHJ1ZSxcbiAgICBkaXNjb3ZlckRlY2xhcmF0aW9uczogdHJ1ZSxcbiAgICByZXNvbHZlU3ltYm9sczogdHJ1ZSxcbiAgICByZXNvbHZlQ2FsbHM6IHRydWUsXG4gICAgcmVzb2x2ZUltcG9ydHM6IHRydWUsXG4gICAgbWFwU291cmNlTG9jYXRpb25zOiB0cnVlLFxuICAgIHJlcG9ydERpYWdub3N0aWNzOiB0cnVlLFxuICB9KSxcbiAgLyoqXG4gICAqIEBwYXJhbSB7e3BhdGg6IHN0cmluZywgdGV4dD86IHN0cmluZywgcnVuSWQ6IHN0cmluZ319IGlucHV0XG4gICAqIEByZXR1cm5zIHtpbXBvcnQoJy4uLy4uL2NvcmUvY3NyL2VudGl0aWVzLmpzJykuQW5hbHlzaXNSdW59XG4gICAqL1xuICBhbmFseXplKGlucHV0KSB7XG4gICAgY29uc3QgYW5hbHlzaXMgPSBjcmVhdGVNb2NrQW5hbHlzaXMoKTtcbiAgICByZXR1cm4geyAuLi5hbmFseXNpcywgcnVuSWQ6IGlucHV0LnJ1bklkIH07XG4gIH0sXG59O1xuIiwgIi8qKlxuICogU291cmNlLWxvY2F0aW9uIGNvbnZlcnNpb24gZm9yIENsYW5nIEFTVCBKU09OLlxuICpcbiAqIENsYW5nIHJlcG9ydHMgYnl0ZS1iYXNlZCBjb2x1bW5zIGFuZCAxLWJhc2VkIGxpbmVzLiBDU1IgcmVxdWlyZXMgMC1iYXNlZFxuICogbGluZXMgYW5kIFVURi0xNiBjb2x1bW5zLiBXaGVuIHRoZSBzb3VyY2UgdGV4dCBpcyBhdmFpbGFibGUgKHRoZSB0cmFuc2xhdGlvblxuICogdW5pdCksIGNvbHVtbnMgYXJlIGNvbnZlcnRlZCBleGFjdGx5OyBmb3IgZmlsZXMgd2hvc2UgdGV4dCB3YXMgbm90IHN1cHBsaWVkLFxuICogQVNDSUkgY29sdW1ucyBhcmUgYXNzdW1lZCBhbmQgdGhlIGxpbWl0YXRpb24gaXMgZG9jdW1lbnRlZC5cbiAqL1xuXG5pbXBvcnQgeyBjcmVhdGVGaWxlSWQgfSBmcm9tICcuLi8uLi9jb3JlL2Nzci9pZGVudGl0eS5qcyc7XG5cbi8qKlxuICogQHR5cGVkZWYge2ltcG9ydCgnLi4vLi4vY29yZS9jc3IvZW50aXRpZXMuanMnKS5Tb3VyY2VSYW5nZX0gU291cmNlUmFuZ2VcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4uLy4uL2NvcmUvY3NyL2VudGl0aWVzLmpzJykuRmlsZVJlY29yZH0gRmlsZVJlY29yZFxuICovXG5cbi8qKlxuICogQHBhcmFtIHt7XG4gKiAgIHdvcmtzcGFjZVJvb3Q/OiBzdHJpbmcsXG4gKiAgIHR1UGF0aDogc3RyaW5nLFxuICogICB0ZXh0Pzogc3RyaW5nLFxuICogICBsYW5ndWFnZT86IHN0cmluZyxcbiAqIH19IG9wdGlvbnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNvdXJjZUxvY2F0b3IoeyB3b3Jrc3BhY2VSb290LCB0dVBhdGgsIHRleHQsIGxhbmd1YWdlID0gJ2NwcCcgfSkge1xuICBjb25zdCByb290ID0gdHlwZW9mIHdvcmtzcGFjZVJvb3QgPT09ICdzdHJpbmcnID8gdG9Qb3NpeCh3b3Jrc3BhY2VSb290KS5yZXBsYWNlKC9cXC8kLywgJycpIDogJyc7XG4gIGNvbnN0IG5vcm1hbGl6ZWRUdSA9IHRvUG9zaXgodHVQYXRoKTtcbiAgY29uc3QgdHVMaW5lcyA9IHNwbGl0TGluZXMoc3RyaXBCb20odHlwZW9mIHRleHQgPT09ICdzdHJpbmcnID8gdGV4dCA6ICcnKSk7XG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywge21heExpbmU6IG51bWJlciwgbGFuZ3VhZ2U6IHN0cmluZ30+fSAqL1xuICBjb25zdCBmaWxlcyA9IG5ldyBNYXAoKTtcblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJhd1xuICAgKiBAcGFyYW0ge3N0cmluZ30gW2ZhbGxiYWNrXVxuICAgKiBAcmV0dXJucyB7c3RyaW5nfG51bGx9XG4gICAqL1xuICBmdW5jdGlvbiB0b1dvcmtzcGFjZVBhdGgocmF3LCBmYWxsYmFjaykge1xuICAgIGNvbnN0IHZhbHVlID1cbiAgICAgIHR5cGVvZiByYXcgPT09ICdzdHJpbmcnICYmIHJhdy5sZW5ndGggPiAwID8gdG9Qb3NpeChyYXcpIDogdG9Qb3NpeChmYWxsYmFjayA/PyAnJyk7XG4gICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmIChyb290Lmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IGxvd2VyUm9vdCA9IHJvb3QudG9Mb3dlckNhc2UoKTtcbiAgICAgIGNvbnN0IGxvd2VyVmFsdWUgPSB2YWx1ZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgaWYgKGxvd2VyVmFsdWUgPT09IGxvd2VyUm9vdCkge1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9XG4gICAgICBpZiAobG93ZXJWYWx1ZS5zdGFydHNXaXRoKGAke2xvd2VyUm9vdH0vYCkpIHtcbiAgICAgICAgcmV0dXJuIG5vcm1hbGl6ZVJlbGF0aXZlKHZhbHVlLnNsaWNlKHJvb3QubGVuZ3RoICsgMSkpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoL15bQS1aYS16XTpcXC8vLnRlc3QodmFsdWUpIHx8IHZhbHVlLnN0YXJ0c1dpdGgoJy8nKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBub3JtYWxpemVSZWxhdGl2ZSh2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd8bnVsbH0gZmlsZVBhdGhcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtsaW5lSGludF0gMS1iYXNlZCBDbGFuZyBsaW5lXG4gICAqIEByZXR1cm5zIHtzdHJpbmd8bnVsbH1cbiAgICovXG4gIGZ1bmN0aW9uIGVuc3VyZUZpbGUoZmlsZVBhdGgsIGxpbmVIaW50KSB7XG4gICAgaWYgKCFmaWxlUGF0aCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGV4aXN0aW5nID0gZmlsZXMuZ2V0KGZpbGVQYXRoKTtcbiAgICBjb25zdCBtYXhMaW5lID0gTWF0aC5tYXgoXG4gICAgICAwLFxuICAgICAgTnVtYmVyLmlzSW50ZWdlcihsaW5lSGludCkgPyBsaW5lSGludCAtIDEgOiAwLFxuICAgICAgZmlsZVBhdGggPT09IG5vcm1hbGl6ZWRUdSA/IE1hdGgubWF4KDAsIGNvdW50TGluZXModGV4dCA/PyAnJykgLSAxKSA6IDAsXG4gICAgKTtcbiAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgIGV4aXN0aW5nLm1heExpbmUgPSBNYXRoLm1heChleGlzdGluZy5tYXhMaW5lLCBtYXhMaW5lKTtcbiAgICAgIHJldHVybiBjcmVhdGVGaWxlSWQoZmlsZVBhdGgpO1xuICAgIH1cbiAgICBmaWxlcy5zZXQoZmlsZVBhdGgsIHtcbiAgICAgIG1heExpbmUsXG4gICAgICBsYW5ndWFnZTogZXh0ZW5zaW9uTGFuZ3VhZ2UoZmlsZVBhdGgsIGxhbmd1YWdlKSxcbiAgICB9KTtcbiAgICByZXR1cm4gY3JlYXRlRmlsZUlkKGZpbGVQYXRoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkfSBsb2NcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtpbmhlcml0ZWRGaWxlXVxuICAgKiBAcmV0dXJucyB7e2ZpbGU6IHN0cmluZ3xudWxsLCBsaW5lOiBudW1iZXIsIGNvbHVtbjogbnVtYmVyfX1cbiAgICovXG4gIGZ1bmN0aW9uIHBvc2l0aW9uKGxvYywgaW5oZXJpdGVkRmlsZSkge1xuICAgIGNvbnN0IHJlY29yZCA9IGlzT2JqZWN0KGxvYykgPyBsb2MgOiB7fTtcbiAgICBjb25zdCBmaWxlID0gdG9Xb3Jrc3BhY2VQYXRoKFxuICAgICAgdHlwZW9mIHJlY29yZC5maWxlID09PSAnc3RyaW5nJyA/IHJlY29yZC5maWxlIDogdW5kZWZpbmVkLFxuICAgICAgaW5oZXJpdGVkRmlsZSxcbiAgICApO1xuICAgIGNvbnN0IGxpbmUgPSBNYXRoLm1heCgwLCBOdW1iZXIocmVjb3JkLmxpbmUgPz8gMSkgLSAxKTtcbiAgICBjb25zdCBieXRlQ29sdW1uID0gTWF0aC5tYXgoMCwgTnVtYmVyKHJlY29yZC5jb2wgPz8gMSkgLSAxKTtcbiAgICBjb25zdCBjb2x1bW4gPVxuICAgICAgZmlsZSA9PT0gbm9ybWFsaXplZFR1ICYmIHR1TGluZXMubGVuZ3RoID4gMFxuICAgICAgICA/IHV0ZjE2Q29sdW1uKHR1TGluZXNbTWF0aC5taW4obGluZSwgdHVMaW5lcy5sZW5ndGggLSAxKV0gPz8gJycsIGJ5dGVDb2x1bW4pXG4gICAgICAgIDogYnl0ZUNvbHVtbjtcbiAgICByZXR1cm4geyBmaWxlLCBsaW5lLCBjb2x1bW4gfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+IHwgdW5kZWZpbmVkfSBub2RlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbaW5oZXJpdGVkRmlsZV1cbiAgICogQHJldHVybnMge1NvdXJjZVJhbmdlfG51bGx9XG4gICAqL1xuICBmdW5jdGlvbiByYW5nZUZvcihub2RlLCBpbmhlcml0ZWRGaWxlKSB7XG4gICAgaWYgKCFpc09iamVjdChub2RlKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IHJhbmdlID0gaXNPYmplY3Qobm9kZS5yYW5nZSkgPyBub2RlLnJhbmdlIDogbnVsbDtcbiAgICBpZiAocmFuZ2UpIHtcbiAgICAgIGNvbnN0IGJlZ2luID0gcG9zaXRpb24oaXNPYmplY3QocmFuZ2UuYmVnaW4pID8gcmFuZ2UuYmVnaW4gOiB1bmRlZmluZWQsIGluaGVyaXRlZEZpbGUpO1xuICAgICAgY29uc3QgZW5kID0gcG9zaXRpb24oXG4gICAgICAgIGlzT2JqZWN0KHJhbmdlLmVuZCkgPyByYW5nZS5lbmQgOiB1bmRlZmluZWQsXG4gICAgICAgIGJlZ2luLmZpbGUgPz8gaW5oZXJpdGVkRmlsZSxcbiAgICAgICk7XG4gICAgICBjb25zdCBmaWxlID0gYmVnaW4uZmlsZSA/PyBlbmQuZmlsZSA/PyB0b1dvcmtzcGFjZVBhdGgodW5kZWZpbmVkLCBpbmhlcml0ZWRGaWxlKTtcbiAgICAgIGlmICghZmlsZSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGZpbGVJZCA9IGVuc3VyZUZpbGUoZmlsZSwgYmVnaW4ubGluZSArIDEpO1xuICAgICAgZW5zdXJlRmlsZShmaWxlLCBlbmQubGluZSArIDEpO1xuICAgICAgY29uc3QgZW5kTGluZSA9IE1hdGgubWF4KGJlZ2luLmxpbmUsIGVuZC5saW5lKTtcbiAgICAgIGxldCBlbmRDb2x1bW4gPSBlbmQuY29sdW1uO1xuICAgICAgaWYgKGVuZExpbmUgPT09IGJlZ2luLmxpbmUgJiYgZW5kQ29sdW1uIDw9IGJlZ2luLmNvbHVtbikge1xuICAgICAgICBlbmRDb2x1bW4gPSBiZWdpbi5jb2x1bW4gKyAxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZmlsZUlkOiBmaWxlSWQgPz8gY3JlYXRlRmlsZUlkKGZpbGUpLFxuICAgICAgICBzdGFydExpbmU6IGJlZ2luLmxpbmUsXG4gICAgICAgIHN0YXJ0Q29sdW1uOiBiZWdpbi5jb2x1bW4sXG4gICAgICAgIGVuZExpbmUsXG4gICAgICAgIGVuZENvbHVtbixcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3Qgb25seSA9IHBvc2l0aW9uKGlzT2JqZWN0KG5vZGUubG9jKSA/IG5vZGUubG9jIDogdW5kZWZpbmVkLCBpbmhlcml0ZWRGaWxlKTtcbiAgICBpZiAoIW9ubHkuZmlsZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGZpbGVJZCA9IGVuc3VyZUZpbGUob25seS5maWxlLCBvbmx5LmxpbmUgKyAxKTtcbiAgICByZXR1cm4ge1xuICAgICAgZmlsZUlkOiBmaWxlSWQgPz8gY3JlYXRlRmlsZUlkKG9ubHkuZmlsZSksXG4gICAgICBzdGFydExpbmU6IG9ubHkubGluZSxcbiAgICAgIHN0YXJ0Q29sdW1uOiBvbmx5LmNvbHVtbixcbiAgICAgIGVuZExpbmU6IG9ubHkubGluZSxcbiAgICAgIGVuZENvbHVtbjogb25seS5jb2x1bW4gKyAxLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMge0ZpbGVSZWNvcmRbXX1cbiAgICovXG4gIGZ1bmN0aW9uIGZpbGVSZWNvcmRzKCkge1xuICAgIHJldHVybiBbLi4uZmlsZXMuZW50cmllcygpXVxuICAgICAgLnNvcnQoKFtsZWZ0XSwgW3JpZ2h0XSkgPT4gbGVmdC5sb2NhbGVDb21wYXJlKHJpZ2h0KSlcbiAgICAgIC5tYXAoKFtmaWxlUGF0aCwgbWV0YV0pID0+ICh7XG4gICAgICAgIGZpbGVJZDogY3JlYXRlRmlsZUlkKGZpbGVQYXRoKSxcbiAgICAgICAgcGF0aDogZmlsZVBhdGgsXG4gICAgICAgIGxhbmd1YWdlOiBtZXRhLmxhbmd1YWdlLFxuICAgICAgICBjb250ZW50SGFzaDogYGNsYW5nOiR7ZmlsZVBhdGh9YCxcbiAgICAgICAgc2l6ZUJ5dGVzOiBmaWxlUGF0aCA9PT0gbm9ybWFsaXplZFR1ID8gYnl0ZUxlbmd0aCh0ZXh0ID8/ICcnKSA6IDAsXG4gICAgICAgIGxpbmVDb3VudDogTWF0aC5tYXgoMSwgbWV0YS5tYXhMaW5lICsgMSksXG4gICAgICAgIGdlbmVyYXRlZDogZmFsc2UsXG4gICAgICB9KSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHR1UGF0aDogbm9ybWFsaXplZFR1LFxuICAgIHRvV29ya3NwYWNlUGF0aCxcbiAgICBlbnN1cmVGaWxlLFxuICAgIHBvc2l0aW9uLFxuICAgIHJhbmdlRm9yLFxuICAgIGZpbGVJZEZvcjogKGZpbGVQYXRoKSA9PiBjcmVhdGVGaWxlSWQoZmlsZVBhdGgpLFxuICAgIGZpbGVSZWNvcmRzLFxuICAgIGZpbGVzOiAoKSA9PiBuZXcgTWFwKGZpbGVzKSxcbiAgfTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAqIEByZXR1cm5zIHtzdHJpbmdbXX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNwbGl0TGluZXModmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlLnNwbGl0KC9cXHJcXG58XFxyfFxcbi8pO1xufVxuXG4vKipcbiAqIENvdW50IGxvZ2ljYWwgbGluZXMuIEEgdHJhaWxpbmcgbmV3bGluZSB0ZXJtaW5hdGVzIHRoZSBwcmV2aW91cyBsaW5lIHJhdGhlclxuICogdGhhbiBzdGFydGluZyBhbiBleHRyYSBlbXB0eSBvbmUsIHdoaWNoIGtlZXBzIGBsaW5lQ291bnRgIGFsaWduZWQgd2l0aCB3aGF0XG4gKiBhbiBlZGl0b3Igc2hvd3MuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gY291bnRMaW5lcyh2YWx1ZSkge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyB8fCB2YWx1ZS5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICBjb25zdCBsaW5lcyA9IHNwbGl0TGluZXModmFsdWUpO1xuICBpZiAobGluZXMubGVuZ3RoID4gMSAmJiBsaW5lc1tsaW5lcy5sZW5ndGggLSAxXSA9PT0gJycgJiYgLyg/OlxcclxcbnxcXHJ8XFxuKSQvLnRlc3QodmFsdWUpKSB7XG4gICAgcmV0dXJuIGxpbmVzLmxlbmd0aCAtIDE7XG4gIH1cbiAgcmV0dXJuIGxpbmVzLmxlbmd0aDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHN0cmlwQm9tKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZS5jaGFyQ29kZUF0KDApID09PSAweGZlZmYgPyB2YWx1ZS5zbGljZSgxKSA6IHZhbHVlO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBsaW5lXG4gKiBAcGFyYW0ge251bWJlcn0gYnl0ZUNvbHVtblxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHV0ZjE2Q29sdW1uKGxpbmUsIGJ5dGVDb2x1bW4pIHtcbiAgaWYgKGJ5dGVDb2x1bW4gPD0gMCkge1xuICAgIHJldHVybiAwO1xuICB9XG4gIGxldCBieXRlcyA9IDA7XG4gIGxldCBpbmRleCA9IDA7XG4gIGZvciAoY29uc3QgY2hhcmFjdGVyIG9mIGxpbmUpIHtcbiAgICBpZiAoYnl0ZXMgPj0gYnl0ZUNvbHVtbikge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNvbnN0IGNvZGVQb2ludCA9IGNoYXJhY3Rlci5jb2RlUG9pbnRBdCgwKSA/PyAwO1xuICAgIGNvbnN0IHdpZHRoID0gdXRmOFdpZHRoKGNvZGVQb2ludCk7XG4gICAgaWYgKGJ5dGVzICsgd2lkdGggPiBieXRlQ29sdW1uKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgYnl0ZXMgKz0gd2lkdGg7XG4gICAgaW5kZXggKz0gY2hhcmFjdGVyLmxlbmd0aDtcbiAgfVxuICByZXR1cm4gaW5kZXg7XG59XG5cbi8qKlxuICogQHBhcmFtIHtudW1iZXJ9IGNvZGVQb2ludFxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gdXRmOFdpZHRoKGNvZGVQb2ludCkge1xuICBpZiAoY29kZVBvaW50IDw9IDB4N2YpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICBpZiAoY29kZVBvaW50IDw9IDB4N2ZmKSB7XG4gICAgcmV0dXJuIDI7XG4gIH1cbiAgaWYgKGNvZGVQb2ludCA8PSAweGZmZmYpIHtcbiAgICByZXR1cm4gMztcbiAgfVxuICByZXR1cm4gNDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHRvUG9zaXgodmFsdWUpIHtcbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSkucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplUmVsYXRpdmUodmFsdWUpIHtcbiAgLyoqIEB0eXBlIHtzdHJpbmdbXX0gKi9cbiAgY29uc3Qgc2VnbWVudHMgPSBbXTtcbiAgZm9yIChjb25zdCBzZWdtZW50IG9mIHZhbHVlLnNwbGl0KCcvJykpIHtcbiAgICBpZiAoc2VnbWVudCA9PT0gJycgfHwgc2VnbWVudCA9PT0gJy4nKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKHNlZ21lbnQgPT09ICcuLicpIHtcbiAgICAgIHNlZ21lbnRzLnBvcCgpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIHNlZ21lbnRzLnB1c2goc2VnbWVudCk7XG4gIH1cbiAgcmV0dXJuIHNlZ21lbnRzLmpvaW4oJy8nKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gZmlsZVBhdGhcbiAqIEBwYXJhbSB7c3RyaW5nfSBmYWxsYmFja1xuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZXh0ZW5zaW9uTGFuZ3VhZ2UoZmlsZVBhdGgsIGZhbGxiYWNrKSB7XG4gIGlmICgvXFwuKGN8aCkkL2kudGVzdChmaWxlUGF0aCkpIHtcbiAgICByZXR1cm4gJ2MnO1xuICB9XG4gIHJldHVybiAvXFwuKGNwcHxjY3xjeHh8Y1xcK1xcK3xocHB8aGh8aHh4fGlwcCkkL2kudGVzdChmaWxlUGF0aCkgPyAnY3BwJyA6IGZhbGxiYWNrO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEByZXR1cm5zIHt2YWx1ZSBpcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn1cbiAqL1xuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gYnl0ZUxlbmd0aCh2YWx1ZSkge1xuICBsZXQgYnl0ZXMgPSAwO1xuICBmb3IgKGNvbnN0IGNoYXJhY3RlciBvZiB2YWx1ZSkge1xuICAgIGJ5dGVzICs9IHV0ZjhXaWR0aChjaGFyYWN0ZXIuY29kZVBvaW50QXQoMCkgPz8gMCk7XG4gIH1cbiAgcmV0dXJuIGJ5dGVzO1xufVxuIiwgIi8qKlxuICogQ2xhbmcgQVNUIEpTT04gLT4gQ1NSLlxuICpcbiAqIFRoZSBtYXBwZXIgaXMgZGVsaWJlcmF0ZWx5IGNvbnNlcnZhdGl2ZS4gSXQgZW1pdHMgYHJlc29sdmVkYCBvbmx5IHdoZW5cbiAqIENsYW5nJ3Mgb3duIGRlY2xhcmF0aW9uIGlkIGxpbmtzIHRoZSBjYWxsIHRvIGEgZGVjbGFyYXRpb24gd2UgbWFwcGVkLlxuICogRXZlcnl0aGluZyBlbHNlIGtlZXBzIGFuIGhvbmVzdCBzdGF0dXMgYW5kIGEgcmVhc29uIGNvZGUuXG4gKlxuICogSXQgZG9lcyBub3QgcmVhZCBmaWxlcywgc3Bhd24gdG9vbHMsIG9yIGtub3cgYWJvdXQgdGhlIGhvc3QuIFRoZSBob3N0IHJ1bnNcbiAqIENsYW5nIGFuZCBwYXNzZXMgdGhlIEFTVCB0ZXh0IGhlcmUuXG4gKi9cblxuaW1wb3J0IHsgQ1NSX1ZFUlNJT04gfSBmcm9tICcuLi8uLi9jb3JlL2Nzci90eXBlcy5qcyc7XG5pbXBvcnQge1xuICBjcmVhdGVBbmFseXNpc1J1bixcbiAgY3JlYXRlRGlhZ25vc3RpYyxcbiAgY3JlYXRlRXZpZGVuY2UsXG4gIGNyZWF0ZUZpbGVSZWNvcmQsXG4gIGNyZWF0ZVJlbGF0aW9uc2hpcCxcbiAgY3JlYXRlU3ltYm9sLFxufSBmcm9tICcuLi8uLi9jb3JlL2Nzci9lbnRpdGllcy5qcyc7XG5pbXBvcnQge1xuICBjcmVhdGVBbm9ueW1vdXNEaXNhbWJpZ3VhdG9yLFxuICBjcmVhdGVJZGVudGl0eUFsbG9jYXRvcixcbiAgY3JlYXRlT3ZlcmxvYWREaXNhbWJpZ3VhdG9yLFxuICBjcmVhdGVSZWxhdGlvbnNoaXBBbGxvY2F0b3IsXG59IGZyb20gJy4uLy4uL2NvcmUvY3NyL2lkZW50aXR5LmpzJztcbmltcG9ydCB7IGNyZWF0ZVNvdXJjZUxvY2F0b3IgfSBmcm9tICcuL2xvY2F0b3IuanMnO1xuXG4vKipcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4uLy4uL2NvcmUvY3NyL2VudGl0aWVzLmpzJykuQW5hbHlzaXNSdW59IEFuYWx5c2lzUnVuXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuLi8uLi9jb3JlL2Nzci9lbnRpdGllcy5qcycpLlN5bWJvbFJlY29yZH0gU3ltYm9sUmVjb3JkXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuLi8uLi9jb3JlL2Nzci9lbnRpdGllcy5qcycpLlJlbGF0aW9uc2hpcH0gUmVsYXRpb25zaGlwXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuLi8uLi9jb3JlL2Nzci9lbnRpdGllcy5qcycpLkRpYWdub3N0aWN9IERpYWdub3N0aWNcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4uLy4uL2NvcmUvY3NyL2VudGl0aWVzLmpzJykuU291cmNlUmFuZ2V9IFNvdXJjZVJhbmdlXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBNYXBDcHBPcHRpb25zXG4gKiBAcHJvcGVydHkge3N0cmluZ30gcnVuSWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfFJlY29yZDxzdHJpbmcsIHVua25vd24+fSBhc3RcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBwYXRoICAgICAgICAgICAgICAgIFdvcmtzcGFjZS1yZWxhdGl2ZSB0cmFuc2xhdGlvbiB1bml0XG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRdICAgICAgICAgICAgICBUcmFuc2xhdGlvbi11bml0IHNvdXJjZSB0ZXh0XG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3dvcmtzcGFjZVJvb3RdXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW2FkYXB0ZXJJZF1cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbYWRhcHRlclZlcnNpb25dXG4gKiBAcHJvcGVydHkgeydjb21waWxlLWRiJ3wnaGV1cmlzdGljJ30gW21vZGVdXG4gKiBAcHJvcGVydHkge0FycmF5PHtjb2RlOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZ30+fSBbd2FybmluZ3NdXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3N0ZGVycl1cbiAqIEBwcm9wZXJ0eSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IFtoZWFkZXJNYXBdXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3Rvb2xjaGFpbl1cbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7TWFwQ3BwT3B0aW9uc30gb3B0aW9uc1xuICogQHJldHVybnMge0FuYWx5c2lzUnVufVxuICovXG5leHBvcnQgZnVuY3Rpb24gbWFwQ2xhbmdBc3Qob3B0aW9ucykge1xuICBjb25zdCB7XG4gICAgcnVuSWQsXG4gICAgcGF0aDogdHVQYXRoLFxuICAgIHRleHQgPSAnJyxcbiAgICB3b3Jrc3BhY2VSb290LFxuICAgIGFkYXB0ZXJJZCA9ICdjcHAtY2xhbmcnLFxuICAgIGFkYXB0ZXJWZXJzaW9uID0gJzAuMS4wJyxcbiAgICBtb2RlID0gJ2NvbXBpbGUtZGInLFxuICAgIHdhcm5pbmdzID0gW10sXG4gICAgc3RkZXJyID0gJycsXG4gICAgaGVhZGVyTWFwID0ge30sXG4gICAgdG9vbGNoYWluID0gJ2NsYW5nJyxcbiAgfSA9IG9wdGlvbnM7XG5cbiAgY29uc3QgbG9jYXRvciA9IGNyZWF0ZVNvdXJjZUxvY2F0b3IoeyB3b3Jrc3BhY2VSb290LCB0dVBhdGgsIHRleHQsIGxhbmd1YWdlOiAnY3BwJyB9KTtcbiAgY29uc3QgbGFuZ3VhZ2UgPSAnY3BwJztcbiAgY29uc3QgYWxsb2NhdG9yID0gY3JlYXRlSWRlbnRpdHlBbGxvY2F0b3IoeyBsYW5ndWFnZSB9KTtcbiAgY29uc3QgcmVsYXRpb25zaGlwSWRzID0gY3JlYXRlUmVsYXRpb25zaGlwQWxsb2NhdG9yKCk7XG4gIC8qKiBAdHlwZSB7UmVsYXRpb25zaGlwW119ICovXG4gIGNvbnN0IHJlbGF0aW9uc2hpcHMgPSBbXTtcblxuICAvKiogQHR5cGUge1N5bWJvbFJlY29yZFtdfSAqL1xuICBjb25zdCBzeW1ib2xzID0gW107XG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywgU3ltYm9sUmVjb3JkPn0gKi9cbiAgY29uc3QgYnlJZCA9IG5ldyBNYXAoKTtcbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBTeW1ib2xSZWNvcmQ+fSAqL1xuICBjb25zdCBieU5vZGVJZCA9IG5ldyBNYXAoKTtcbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBTeW1ib2xSZWNvcmQ+fSAqL1xuICBjb25zdCBieVNjb3BlS2V5ID0gbmV3IE1hcCgpO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIFN5bWJvbFJlY29yZD59ICovXG4gIGNvbnN0IGZpbGVTeW1ib2xzID0gbmV3IE1hcCgpO1xuICAvKiogQHR5cGUge1N5bWJvbFJlY29yZFtdfSAqL1xuICBjb25zdCBwZW5kaW5nRmlsZVN5bWJvbHMgPSBbXTtcblxuICAvKiogQHR5cGUge0RpYWdub3N0aWNbXX0gKi9cbiAgY29uc3QgZGlhZ25vc3RpY3MgPSB3YXJuaW5ncy5tYXAoKHdhcm5pbmcpID0+XG4gICAgY3JlYXRlRGlhZ25vc3RpYyh7XG4gICAgICBzZXZlcml0eTogd2FybmluZy5jb2RlID09PSAnbWlzc2luZ19jb21waWxlX2RiJyA/ICd3YXJuaW5nJyA6ICd3YXJuaW5nJyxcbiAgICAgIGNvZGU6IHdhcm5pbmcuY29kZSxcbiAgICAgIG1lc3NhZ2U6IHdhcm5pbmcubWVzc2FnZSxcbiAgICB9KSxcbiAgKTtcblxuICAvKiogQHR5cGUge0FycmF5PHtub2RlOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgZmlsZTogc3RyaW5nLCBmdW5jdGlvbklkOiBzdHJpbmd8bnVsbCwgcmFuZ2U6IFNvdXJjZVJhbmdlfG51bGx9Pn0gKi9cbiAgY29uc3QgY2FsbFNpdGVzID0gW107XG4gIC8qKiBAdHlwZSB7QXJyYXk8e2ZpbGU6IHN0cmluZywgbmFtZTogc3RyaW5nLCBzeXN0ZW06IGJvb2xlYW4sIGxpbmU6IG51bWJlciwgbGluZVRleHQ6IHN0cmluZ30+fSAqL1xuICBjb25zdCBpbmNsdWRlcyA9IHNjYW5JbmNsdWRlcyh0ZXh0KTtcblxuICBsZXQgdGVtcGxhdGVTZWVuID0gZmFsc2U7XG4gIGxldCB1bnN1cHBvcnRlZFNlZW4gPSBmYWxzZTtcblxuICAvKipcbiAgICogQHR5cGVkZWYge09iamVjdH0gU2NvcGVGcmFtZVxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gbmFtZVxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gcXVhbGlmaWVkTmFtZVxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gc3ltYm9sSWRcbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IGtpbmRcbiAgICovXG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfG51bGx9IGZpbGVQYXRoXG4gICAqIEByZXR1cm5zIHtTeW1ib2xSZWNvcmR9XG4gICAqL1xuICBmdW5jdGlvbiBmaWxlU3ltYm9sKGZpbGVQYXRoKSB7XG4gICAgY29uc3QgcGF0aCA9IGZpbGVQYXRoID8/IGxvY2F0b3IudHVQYXRoO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gZmlsZVN5bWJvbHMuZ2V0KHBhdGgpO1xuICAgIGlmIChleGlzdGluZykge1xuICAgICAgcmV0dXJuIGV4aXN0aW5nO1xuICAgIH1cbiAgICAvLyBFbnN1cmUgdGhlIGZpbGUgaXMgcmVjb3JkZWQgZXZlbiB3aGVuIG5vIGRlY2xhcmF0aW9uIHBvc2l0aW9uIHdhcyByZWFkXG4gICAgLy8gZnJvbSB0aGUgQVNUIChmb3IgZXhhbXBsZSBhbiBlbXB0eSB0cmFuc2xhdGlvbiB1bml0KS5cbiAgICBsb2NhdG9yLmVuc3VyZUZpbGUocGF0aCwgMSk7XG4gICAgY29uc3QgZmlsZUlkID0gbG9jYXRvci5maWxlSWRGb3IocGF0aCk7XG4gICAgY29uc3QgZGVjbGFyYXRpb24gPSB7XG4gICAgICBmaWxlSWQsXG4gICAgICBzdGFydExpbmU6IDAsXG4gICAgICBzdGFydENvbHVtbjogMCxcbiAgICAgIGVuZExpbmU6IDAsXG4gICAgICBlbmRDb2x1bW46IDEsXG4gICAgfTtcbiAgICBjb25zdCBpZGVudGl0eSA9IGFsbG9jYXRvci5zeW1ib2woe1xuICAgICAgcGF0aCxcbiAgICAgIGtpbmQ6ICdmaWxlJyxcbiAgICAgIHF1YWxpZmllZE5hbWU6IHBhdGgsXG4gICAgfSk7XG4gICAgY29uc3Qgc3ltYm9sID0gY3JlYXRlU3ltYm9sKHtcbiAgICAgIHN5bWJvbElkOiBpZGVudGl0eS5zeW1ib2xJZCxcbiAgICAgIGtpbmQ6ICdmaWxlJyxcbiAgICAgIG5hbWU6IGJhc2VuYW1lKHBhdGgpLFxuICAgICAgcXVhbGlmaWVkTmFtZTogcGF0aCxcbiAgICAgIGxhbmd1YWdlLFxuICAgICAgZGVjbGFyYXRpb24sXG4gICAgICB2aXNpYmlsaXR5OiAncHVibGljJyxcbiAgICB9KTtcbiAgICBzeW1ib2xzLnB1c2goc3ltYm9sKTtcbiAgICBieUlkLnNldChzeW1ib2wuc3ltYm9sSWQsIHN5bWJvbCk7XG4gICAgZmlsZVN5bWJvbHMuc2V0KHBhdGgsIHN5bWJvbCk7XG4gICAgcGVuZGluZ0ZpbGVTeW1ib2xzLnB1c2goc3ltYm9sKTtcbiAgICByZXR1cm4gc3ltYm9sO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7e1xuICAgKiAgIG5vZGU6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgKiAgIG5hbWU6IHN0cmluZyxcbiAgICogICBraW5kOiBzdHJpbmcsXG4gICAqICAgZmlsZTogc3RyaW5nLFxuICAgKiAgIHBhcmVudDogU2NvcGVGcmFtZSB8IG51bGwsXG4gICAqICAgZGVjbGFyYXRpb246IFNvdXJjZVJhbmdlLFxuICAgKiAgIHZpc2liaWxpdHk/OiBzdHJpbmcsXG4gICAqICAgZGlzYW1iaWd1YXRvcj86IHN0cmluZyxcbiAgICogICBzaWduYXR1cmU/OiBzdHJpbmcsXG4gICAqICAgZXh0ZW5zaW9ucz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgKiB9fSBpbnB1dFxuICAgKiBAcmV0dXJucyB7U3ltYm9sUmVjb3JkfVxuICAgKi9cbiAgZnVuY3Rpb24gZGVjbGFyZShpbnB1dCkge1xuICAgIC8vIEV2ZXJ5IGRlY2xhcmF0aW9uIGltcGxpZXMgaXRzIGZpbGUgZXhpc3RzLCBldmVuIHdoZW4gdGhlIGZpbGUgY2FycmllcyBub1xuICAgIC8vIGhlYWRlciBzeW1ib2wgb3RoZXJ3aXNlLiBUaGlzIG1ha2VzIGluY2x1ZGUgZWRnZXMgcmVzb2x2YWJsZSBsYXRlci5cbiAgICBmaWxlU3ltYm9sKGlucHV0LmZpbGUpO1xuICAgIGNvbnN0IHF1YWxpZmllZE5hbWUgPSBpbnB1dC5wYXJlbnRcbiAgICAgID8gYCR7aW5wdXQucGFyZW50LnF1YWxpZmllZE5hbWV9Ojoke2lucHV0Lm5hbWV9YFxuICAgICAgOiBpbnB1dC5uYW1lO1xuICAgIGNvbnN0IHNjb3BlS2V5ID0gYCR7aW5wdXQuZmlsZX18JHtpbnB1dC5raW5kfXwke3F1YWxpZmllZE5hbWV9fCR7aW5wdXQuZGlzYW1iaWd1YXRvciA/PyAnJ31gO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gYnlTY29wZUtleS5nZXQoc2NvcGVLZXkpO1xuICAgIGlmIChleGlzdGluZykge1xuICAgICAgaWYgKGlucHV0Lm5vZGUuaWQpIHtcbiAgICAgICAgYnlOb2RlSWQuc2V0KFN0cmluZyhpbnB1dC5ub2RlLmlkKSwgZXhpc3RpbmcpO1xuICAgICAgfVxuICAgICAgaWYgKFxuICAgICAgICBpbnB1dC5ub2RlLmNvbXBsZXRlRGVmaW5pdGlvbiA9PT0gdHJ1ZSAmJlxuICAgICAgICBleGlzdGluZy5kZWNsYXJhdGlvbi5zdGFydExpbmUgPT09IDAgJiZcbiAgICAgICAgZXhpc3RpbmcuZGVjbGFyYXRpb24uZW5kTGluZSA9PT0gMFxuICAgICAgKSB7XG4gICAgICAgIGV4aXN0aW5nLmRlY2xhcmF0aW9uID0gaW5wdXQuZGVjbGFyYXRpb247XG4gICAgICB9XG4gICAgICByZXR1cm4gZXhpc3Rpbmc7XG4gICAgfVxuXG4gICAgY29uc3QgaWRlbnRpdHkgPSBhbGxvY2F0b3Iuc3ltYm9sKHtcbiAgICAgIHBhdGg6IGlucHV0LmZpbGUsXG4gICAgICBraW5kOiBpbnB1dC5raW5kLFxuICAgICAgcXVhbGlmaWVkTmFtZSxcbiAgICAgIGRpc2FtYmlndWF0b3I6IGlucHV0LmRpc2FtYmlndWF0b3IsXG4gICAgfSk7XG4gICAgY29uc3Qgc3ltYm9sID0gY3JlYXRlU3ltYm9sKHtcbiAgICAgIHN5bWJvbElkOiBpZGVudGl0eS5zeW1ib2xJZCxcbiAgICAgIGtpbmQ6IGlucHV0LmtpbmQsXG4gICAgICBuYW1lOiBpbnB1dC5uYW1lLFxuICAgICAgcXVhbGlmaWVkTmFtZSxcbiAgICAgIGxhbmd1YWdlLFxuICAgICAgZGVjbGFyYXRpb246IGlucHV0LmRlY2xhcmF0aW9uLFxuICAgICAgLi4uKGlucHV0LnBhcmVudCA/IHsgcGFyZW50SWQ6IGlucHV0LnBhcmVudC5zeW1ib2xJZCB9IDoge30pLFxuICAgICAgLi4uKGlucHV0LnZpc2liaWxpdHkgPyB7IHZpc2liaWxpdHk6IGlucHV0LnZpc2liaWxpdHkgfSA6IHt9KSxcbiAgICAgIC4uLihpbnB1dC5zaWduYXR1cmUgPyB7IHNpZ25hdHVyZTogaW5wdXQuc2lnbmF0dXJlIH0gOiB7fSksXG4gICAgICAuLi4oaW5wdXQuZGlzYW1iaWd1YXRvciA/IHsgZGlzYW1iaWd1YXRvcjogaW5wdXQuZGlzYW1iaWd1YXRvciB9IDoge30pLFxuICAgICAgLi4uKGlucHV0LmV4dGVuc2lvbnMgPyB7IGV4dGVuc2lvbnM6IGlucHV0LmV4dGVuc2lvbnMgfSA6IHt9KSxcbiAgICB9KTtcbiAgICBzeW1ib2xzLnB1c2goc3ltYm9sKTtcbiAgICBieUlkLnNldChzeW1ib2wuc3ltYm9sSWQsIHN5bWJvbCk7XG4gICAgYnlTY29wZUtleS5zZXQoc2NvcGVLZXksIHN5bWJvbCk7XG4gICAgaWYgKGlucHV0Lm5vZGUuaWQpIHtcbiAgICAgIGJ5Tm9kZUlkLnNldChTdHJpbmcoaW5wdXQubm9kZS5pZCksIHN5bWJvbCk7XG4gICAgfVxuICAgIHJldHVybiBzeW1ib2w7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gbm9kZVxuICAgKiBAcGFyYW0ge3tcbiAgICogICBmaWxlOiBzdHJpbmcsXG4gICAqICAgc2NvcGU6IFNjb3BlRnJhbWVbXSxcbiAgICogICBmdW5jdGlvbklkOiBzdHJpbmd8bnVsbCxcbiAgICogICBjbGFzc0lkOiBzdHJpbmd8bnVsbCxcbiAgICogICB2aXNpYmlsaXR5OiBzdHJpbmcsXG4gICAqICAgdGVtcGxhdGU6IGJvb2xlYW4sXG4gICAqICAgaW5MYW1iZGE6IGJvb2xlYW4sXG4gICAqIH19IGNvbnRleHRcbiAgICovXG4gIGZ1bmN0aW9uIHZpc2l0KG5vZGUsIGNvbnRleHQpIHtcbiAgICBpZiAoIWlzT2JqZWN0KG5vZGUpIHx8IHR5cGVvZiBub2RlLmtpbmQgIT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChub2RlLmlzSW1wbGljaXQgPT09IHRydWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCByYXdGaWxlID1cbiAgICAgIHR5cGVvZiBub2RlLmxvYz8uZmlsZSA9PT0gJ3N0cmluZydcbiAgICAgICAgPyBub2RlLmxvYy5maWxlXG4gICAgICAgIDogdHlwZW9mIG5vZGUucmFuZ2U/LmJlZ2luPy5maWxlID09PSAnc3RyaW5nJ1xuICAgICAgICAgID8gbm9kZS5yYW5nZS5iZWdpbi5maWxlXG4gICAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgZmlsZSA9IHJhd0ZpbGUgPyBsb2NhdG9yLnRvV29ya3NwYWNlUGF0aChyYXdGaWxlKSA6IGNvbnRleHQuZmlsZTtcbiAgICBpZiAoZmlsZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuOyAvLyBzeXN0ZW0gb3Igb3V0LW9mLXdvcmtzcGFjZSBmaWxlXG4gICAgfVxuXG4gICAgY29uc3QgcmFuZ2UgPSBsb2NhdG9yLnJhbmdlRm9yKG5vZGUsIGZpbGUpO1xuICAgIGNvbnN0IGtpbmQgPSBub2RlLmtpbmQ7XG4gICAgY29uc3QgbmFtZSA9IHR5cGVvZiBub2RlLm5hbWUgPT09ICdzdHJpbmcnID8gbm9kZS5uYW1lIDogJyc7XG4gICAgY29uc3QgcGFyZW50ID0gY29udGV4dC5zY29wZVtjb250ZXh0LnNjb3BlLmxlbmd0aCAtIDFdID8/IG51bGw7XG5cbiAgICBpZiAoa2luZCA9PT0gJ0NsYXNzVGVtcGxhdGVEZWNsJykge1xuICAgICAgdGVtcGxhdGVTZWVuID0gdHJ1ZTtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgaW5uZXIobm9kZSkpIHtcbiAgICAgICAgdmlzaXQoY2hpbGQsIHsgLi4uY29udGV4dCwgZmlsZSwgdGVtcGxhdGU6IHRydWUgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGtpbmQgPT09ICdGdW5jdGlvblRlbXBsYXRlRGVjbCcpIHtcbiAgICAgIHRlbXBsYXRlU2VlbiA9IHRydWU7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGlubmVyKG5vZGUpKSB7XG4gICAgICAgIHZpc2l0KGNoaWxkLCB7IC4uLmNvbnRleHQsIGZpbGUsIHRlbXBsYXRlOiB0cnVlIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChraW5kID09PSAnTmFtZXNwYWNlRGVjbCcpIHtcbiAgICAgIGlmICghbmFtZSB8fCAhcmFuZ2UpIHtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBpbm5lcihub2RlKSkge1xuICAgICAgICAgIHZpc2l0KGNoaWxkLCB7IC4uLmNvbnRleHQsIGZpbGUgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3Qgc3ltYm9sID0gZGVjbGFyZSh7XG4gICAgICAgIG5vZGUsXG4gICAgICAgIG5hbWUsXG4gICAgICAgIGtpbmQ6ICduYW1lc3BhY2UnLFxuICAgICAgICBmaWxlLFxuICAgICAgICBwYXJlbnQsXG4gICAgICAgIGRlY2xhcmF0aW9uOiByYW5nZSxcbiAgICAgICAgdmlzaWJpbGl0eTogJ3B1YmxpYycsXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGZyYW1lID0ge1xuICAgICAgICBuYW1lLFxuICAgICAgICBxdWFsaWZpZWROYW1lOiBzeW1ib2wucXVhbGlmaWVkTmFtZSxcbiAgICAgICAgc3ltYm9sSWQ6IHN5bWJvbC5zeW1ib2xJZCxcbiAgICAgICAga2luZDogJ25hbWVzcGFjZScsXG4gICAgICB9O1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBpbm5lcihub2RlKSkge1xuICAgICAgICB2aXNpdChjaGlsZCwgeyAuLi5jb250ZXh0LCBmaWxlLCBzY29wZTogWy4uLmNvbnRleHQuc2NvcGUsIGZyYW1lXSB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoa2luZCA9PT0gJ0NYWFJlY29yZERlY2wnIHx8IGtpbmQgPT09ICdSZWNvcmREZWNsJykge1xuICAgICAgY29uc3QgaXNMYW1iZGFSZWNvcmQgPSBjb250ZXh0LmluTGFtYmRhICYmIC9sYW1iZGF8b3BlcmF0b3JcXChcXCkvaS50ZXN0KG5hbWUpO1xuICAgICAgaWYgKGlzTGFtYmRhUmVjb3JkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICghbmFtZSB8fCAhcmFuZ2UpIHtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBpbm5lcihub2RlKSkge1xuICAgICAgICAgIHZpc2l0KGNoaWxkLCB7IC4uLmNvbnRleHQsIGZpbGUgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgcmVjb3JkS2luZCA9IFN0cmluZyhub2RlLnRhZ1VzZWQgPz8gKGtpbmQgPT09ICdSZWNvcmREZWNsJyA/ICdzdHJ1Y3QnIDogJ2NsYXNzJykpO1xuICAgICAgY29uc3Qgc3ltYm9sS2luZCA9XG4gICAgICAgIHJlY29yZEtpbmQgPT09ICd1bmlvbicgPyAnY2xhc3MnIDogcmVjb3JkS2luZCA9PT0gJ3N0cnVjdCcgPyAnc3RydWN0JyA6ICdjbGFzcyc7XG4gICAgICBjb25zdCB2aXNpYmlsaXR5ID1cbiAgICAgICAgdHlwZW9mIG5vZGUuYWNjZXNzID09PSAnc3RyaW5nJ1xuICAgICAgICAgID8gU3RyaW5nKG5vZGUuYWNjZXNzKVxuICAgICAgICAgIDogcmVjb3JkS2luZCA9PT0gJ2NsYXNzJ1xuICAgICAgICAgICAgPyAncHJpdmF0ZSdcbiAgICAgICAgICAgIDogJ3B1YmxpYyc7XG4gICAgICBjb25zdCBzeW1ib2wgPSBkZWNsYXJlKHtcbiAgICAgICAgbm9kZSxcbiAgICAgICAgbmFtZSxcbiAgICAgICAga2luZDogc3ltYm9sS2luZCxcbiAgICAgICAgZmlsZSxcbiAgICAgICAgcGFyZW50LFxuICAgICAgICBkZWNsYXJhdGlvbjogcmFuZ2UsXG4gICAgICAgIHZpc2liaWxpdHksXG4gICAgICAgIGV4dGVuc2lvbnM6IHtcbiAgICAgICAgICBjcHA6IHtcbiAgICAgICAgICAgIHJlY29yZEtpbmQsXG4gICAgICAgICAgICBjb21wbGV0ZURlZmluaXRpb246IG5vZGUuY29tcGxldGVEZWZpbml0aW9uID09PSB0cnVlLFxuICAgICAgICAgICAgLi4uKGNvbnRleHQudGVtcGxhdGUgPyB7IHRlbXBsYXRlOiB0cnVlIH0gOiB7fSksXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZnJhbWUgPSB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIHF1YWxpZmllZE5hbWU6IHN5bWJvbC5xdWFsaWZpZWROYW1lLFxuICAgICAgICBzeW1ib2xJZDogc3ltYm9sLnN5bWJvbElkLFxuICAgICAgICBraW5kOiBzeW1ib2xLaW5kLFxuICAgICAgfTtcbiAgICAgIGxldCBtZW1iZXJWaXNpYmlsaXR5ID0gdmlzaWJpbGl0eTtcbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgaW5uZXIobm9kZSkpIHtcbiAgICAgICAgaWYgKGNoaWxkLmtpbmQgPT09ICdBY2Nlc3NTcGVjRGVjbCcpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNoaWxkLmFjY2VzcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIG1lbWJlclZpc2liaWxpdHkgPSBjaGlsZC5hY2Nlc3M7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHZpc2l0KGNoaWxkLCB7XG4gICAgICAgICAgLi4uY29udGV4dCxcbiAgICAgICAgICBmaWxlLFxuICAgICAgICAgIHNjb3BlOiBbLi4uY29udGV4dC5zY29wZSwgZnJhbWVdLFxuICAgICAgICAgIGNsYXNzSWQ6IHN5bWJvbC5zeW1ib2xJZCxcbiAgICAgICAgICB2aXNpYmlsaXR5OiBtZW1iZXJWaXNpYmlsaXR5LFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICBraW5kID09PSAnRnVuY3Rpb25EZWNsJyB8fFxuICAgICAga2luZCA9PT0gJ0NYWE1ldGhvZERlY2wnIHx8XG4gICAgICBraW5kID09PSAnQ1hYQ29uc3RydWN0b3JEZWNsJyB8fFxuICAgICAga2luZCA9PT0gJ0NYWERlc3RydWN0b3JEZWNsJyB8fFxuICAgICAga2luZCA9PT0gJ0NYWENvbnZlcnNpb25EZWNsJ1xuICAgICkge1xuICAgICAgaWYgKCFuYW1lIHx8ICFyYW5nZSkge1xuICAgICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGlubmVyKG5vZGUpKSB7XG4gICAgICAgICAgdmlzaXQoY2hpbGQsIHsgLi4uY29udGV4dCwgZmlsZSB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCBwYXJhbWV0ZXJUeXBlcyA9IGlubmVyKG5vZGUpXG4gICAgICAgIC5maWx0ZXIoKGNoaWxkKSA9PiBjaGlsZC5raW5kID09PSAnUGFybVZhckRlY2wnKVxuICAgICAgICAubWFwKChjaGlsZCkgPT4gU3RyaW5nKGNoaWxkLnR5cGU/LnF1YWxUeXBlID8/ICd1bmtub3duJykpO1xuICAgICAgY29uc3Qgc3ltYm9sS2luZCA9IGZ1bmN0aW9uS2luZChraW5kKTtcbiAgICAgIGNvbnN0IGRpc2FtYmlndWF0b3IgPSBjcmVhdGVPdmVybG9hZERpc2FtYmlndWF0b3IocGFyYW1ldGVyVHlwZXMpO1xuICAgICAgY29uc3Qgc3ltYm9sID0gZGVjbGFyZSh7XG4gICAgICAgIG5vZGUsXG4gICAgICAgIG5hbWUsXG4gICAgICAgIGtpbmQ6IHN5bWJvbEtpbmQsXG4gICAgICAgIGZpbGUsXG4gICAgICAgIHBhcmVudCxcbiAgICAgICAgZGVjbGFyYXRpb246IHJhbmdlLFxuICAgICAgICB2aXNpYmlsaXR5OiBjb250ZXh0LnZpc2liaWxpdHksXG4gICAgICAgIGRpc2FtYmlndWF0b3IsXG4gICAgICAgIHNpZ25hdHVyZTogdHlwZW9mIG5vZGUudHlwZT8ucXVhbFR5cGUgPT09ICdzdHJpbmcnID8gbm9kZS50eXBlLnF1YWxUeXBlIDogdW5kZWZpbmVkLFxuICAgICAgICBleHRlbnNpb25zOiB7XG4gICAgICAgICAgY3BwOiB7XG4gICAgICAgICAgICAuLi4oY29udGV4dC50ZW1wbGF0ZSA/IHsgdGVtcGxhdGU6IHRydWUgfSA6IHt9KSxcbiAgICAgICAgICAgIC4uLihub2RlLnZpcnR1YWwgPT09IHRydWUgPyB7IHZpcnR1YWw6IHRydWUgfSA6IHt9KSxcbiAgICAgICAgICAgIC4uLihub2RlLnB1cmUgPT09IHRydWUgPyB7IHB1cmU6IHRydWUgfSA6IHt9KSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBjb25zdCBmcmFtZSA9IHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgcXVhbGlmaWVkTmFtZTogc3ltYm9sLnF1YWxpZmllZE5hbWUsXG4gICAgICAgIHN5bWJvbElkOiBzeW1ib2wuc3ltYm9sSWQsXG4gICAgICAgIGtpbmQ6IHN5bWJvbEtpbmQsXG4gICAgICB9O1xuICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBpbm5lcihub2RlKSkge1xuICAgICAgICB2aXNpdChjaGlsZCwge1xuICAgICAgICAgIC4uLmNvbnRleHQsXG4gICAgICAgICAgZmlsZSxcbiAgICAgICAgICBzY29wZTogWy4uLmNvbnRleHQuc2NvcGUsIGZyYW1lXSxcbiAgICAgICAgICBmdW5jdGlvbklkOiBzeW1ib2wuc3ltYm9sSWQsXG4gICAgICAgICAgY2xhc3NJZDogY29udGV4dC5jbGFzc0lkLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoa2luZCA9PT0gJ1Bhcm1WYXJEZWNsJykge1xuICAgICAgaWYgKG5hbWUgJiYgcmFuZ2UpIHtcbiAgICAgICAgZGVjbGFyZSh7XG4gICAgICAgICAgbm9kZSxcbiAgICAgICAgICBuYW1lLFxuICAgICAgICAgIGtpbmQ6ICdwYXJhbWV0ZXInLFxuICAgICAgICAgIGZpbGUsXG4gICAgICAgICAgcGFyZW50LFxuICAgICAgICAgIGRlY2xhcmF0aW9uOiByYW5nZSxcbiAgICAgICAgICB2aXNpYmlsaXR5OiBjb250ZXh0LnZpc2liaWxpdHksXG4gICAgICAgICAgZXh0ZW5zaW9uczoge1xuICAgICAgICAgICAgY3BwOiB7XG4gICAgICAgICAgICAgIC4uLih0eXBlb2Ygbm9kZS50eXBlPy5xdWFsVHlwZSA9PT0gJ3N0cmluZycgPyB7IHR5cGU6IG5vZGUudHlwZS5xdWFsVHlwZSB9IDoge30pLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgaW5uZXIobm9kZSkpIHtcbiAgICAgICAgdmlzaXQoY2hpbGQsIHsgLi4uY29udGV4dCwgZmlsZSB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoa2luZCA9PT0gJ1ZhckRlY2wnKSB7XG4gICAgICBpZiAobmFtZSAmJiByYW5nZSkge1xuICAgICAgICBjb25zdCBwYXJlbnRLaW5kID0gcGFyZW50Py5raW5kO1xuICAgICAgICBkZWNsYXJlKHtcbiAgICAgICAgICBub2RlLFxuICAgICAgICAgIG5hbWUsXG4gICAgICAgICAga2luZDpcbiAgICAgICAgICAgIHBhcmVudEtpbmQgPT09ICduYW1lc3BhY2UnIHx8IHBhcmVudEtpbmQgPT09ICdjbGFzcycgfHwgcGFyZW50S2luZCA9PT0gJ3N0cnVjdCdcbiAgICAgICAgICAgICAgPyAndmFyaWFibGUnXG4gICAgICAgICAgICAgIDogJ3ZhcmlhYmxlJyxcbiAgICAgICAgICBmaWxlLFxuICAgICAgICAgIHBhcmVudCxcbiAgICAgICAgICBkZWNsYXJhdGlvbjogcmFuZ2UsXG4gICAgICAgICAgdmlzaWJpbGl0eTogY29udGV4dC52aXNpYmlsaXR5LFxuICAgICAgICAgIGV4dGVuc2lvbnM6IHtcbiAgICAgICAgICAgIGNwcDoge1xuICAgICAgICAgICAgICAuLi4odHlwZW9mIG5vZGUudHlwZT8ucXVhbFR5cGUgPT09ICdzdHJpbmcnID8geyB0eXBlOiBub2RlLnR5cGUucXVhbFR5cGUgfSA6IHt9KSxcbiAgICAgICAgICAgICAgLi4uKHBhcmVudEtpbmQgPT09ICduYW1lc3BhY2UnIHx8IHBhcmVudEtpbmQgPT09ICdjbGFzcycgfHwgcGFyZW50S2luZCA9PT0gJ3N0cnVjdCdcbiAgICAgICAgICAgICAgICA/IHsgbGlua2FnZTogJ2V4dGVybmFsJyB9XG4gICAgICAgICAgICAgICAgOiB7IGxvY2FsOiB0cnVlIH0pLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgaW5uZXIobm9kZSkpIHtcbiAgICAgICAgdmlzaXQoY2hpbGQsIHsgLi4uY29udGV4dCwgZmlsZSB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoa2luZCA9PT0gJ0ZpZWxkRGVjbCcpIHtcbiAgICAgIGlmIChuYW1lICYmIHJhbmdlKSB7XG4gICAgICAgIGRlY2xhcmUoe1xuICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICBraW5kOiAnZmllbGQnLFxuICAgICAgICAgIGZpbGUsXG4gICAgICAgICAgcGFyZW50LFxuICAgICAgICAgIGRlY2xhcmF0aW9uOiByYW5nZSxcbiAgICAgICAgICB2aXNpYmlsaXR5OiBjb250ZXh0LnZpc2liaWxpdHksXG4gICAgICAgICAgZXh0ZW5zaW9uczoge1xuICAgICAgICAgICAgY3BwOiB7XG4gICAgICAgICAgICAgIC4uLih0eXBlb2Ygbm9kZS50eXBlPy5xdWFsVHlwZSA9PT0gJ3N0cmluZycgPyB7IHR5cGU6IG5vZGUudHlwZS5xdWFsVHlwZSB9IDoge30pLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgaW5uZXIobm9kZSkpIHtcbiAgICAgICAgdmlzaXQoY2hpbGQsIHsgLi4uY29udGV4dCwgZmlsZSB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoa2luZCA9PT0gJ0VudW1EZWNsJykge1xuICAgICAgaWYgKG5hbWUgJiYgcmFuZ2UpIHtcbiAgICAgICAgY29uc3Qgc3ltYm9sID0gZGVjbGFyZSh7XG4gICAgICAgICAgbm9kZSxcbiAgICAgICAgICBuYW1lLFxuICAgICAgICAgIGtpbmQ6ICdlbnVtJyxcbiAgICAgICAgICBmaWxlLFxuICAgICAgICAgIHBhcmVudCxcbiAgICAgICAgICBkZWNsYXJhdGlvbjogcmFuZ2UsXG4gICAgICAgICAgdmlzaWJpbGl0eTogY29udGV4dC52aXNpYmlsaXR5LFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgZnJhbWUgPSB7XG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICBxdWFsaWZpZWROYW1lOiBzeW1ib2wucXVhbGlmaWVkTmFtZSxcbiAgICAgICAgICBzeW1ib2xJZDogc3ltYm9sLnN5bWJvbElkLFxuICAgICAgICAgIGtpbmQ6ICdlbnVtJyxcbiAgICAgICAgfTtcbiAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBpbm5lcihub2RlKSkge1xuICAgICAgICAgIHZpc2l0KGNoaWxkLCB7IC4uLmNvbnRleHQsIGZpbGUsIHNjb3BlOiBbLi4uY29udGV4dC5zY29wZSwgZnJhbWVdIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgaW5uZXIobm9kZSkpIHtcbiAgICAgICAgdmlzaXQoY2hpbGQsIHsgLi4uY29udGV4dCwgZmlsZSB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoa2luZCA9PT0gJ0VudW1Db25zdGFudERlY2wnKSB7XG4gICAgICBpZiAobmFtZSAmJiByYW5nZSkge1xuICAgICAgICBkZWNsYXJlKHtcbiAgICAgICAgICBub2RlLFxuICAgICAgICAgIG5hbWUsXG4gICAgICAgICAga2luZDogJ2VudW1fbWVtYmVyJyxcbiAgICAgICAgICBmaWxlLFxuICAgICAgICAgIHBhcmVudCxcbiAgICAgICAgICBkZWNsYXJhdGlvbjogcmFuZ2UsXG4gICAgICAgICAgdmlzaWJpbGl0eTogY29udGV4dC52aXNpYmlsaXR5LFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoa2luZCA9PT0gJ1R5cGVkZWZEZWNsJyB8fCBraW5kID09PSAnVHlwZUFsaWFzRGVjbCcpIHtcbiAgICAgIGlmIChuYW1lICYmIHJhbmdlKSB7XG4gICAgICAgIGRlY2xhcmUoe1xuICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICBraW5kOiAndHlwZV9hbGlhcycsXG4gICAgICAgICAgZmlsZSxcbiAgICAgICAgICBwYXJlbnQsXG4gICAgICAgICAgZGVjbGFyYXRpb246IHJhbmdlLFxuICAgICAgICAgIHZpc2liaWxpdHk6IGNvbnRleHQudmlzaWJpbGl0eSxcbiAgICAgICAgICBleHRlbnNpb25zOiB7XG4gICAgICAgICAgICBjcHA6IHtcbiAgICAgICAgICAgICAgLi4uKHR5cGVvZiBub2RlLnR5cGU/LnF1YWxUeXBlID09PSAnc3RyaW5nJyA/IHsgdHlwZTogbm9kZS50eXBlLnF1YWxUeXBlIH0gOiB7fSksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChraW5kID09PSAnTGFtYmRhRXhwcicpIHtcbiAgICAgIGNvbnN0IG9yZGluYWwgPSBjb3VudExhbWJkYXMoY29udGV4dC5zY29wZSk7XG4gICAgICBpZiAocmFuZ2UpIHtcbiAgICAgICAgY29uc3Qgc3ltYm9sID0gZGVjbGFyZSh7XG4gICAgICAgICAgbm9kZSxcbiAgICAgICAgICBuYW1lOiAnPGxhbWJkYT4nLFxuICAgICAgICAgIGtpbmQ6ICdjbG9zdXJlJyxcbiAgICAgICAgICBmaWxlLFxuICAgICAgICAgIHBhcmVudCxcbiAgICAgICAgICBkZWNsYXJhdGlvbjogcmFuZ2UsXG4gICAgICAgICAgdmlzaWJpbGl0eTogY29udGV4dC52aXNpYmlsaXR5LFxuICAgICAgICAgIGRpc2FtYmlndWF0b3I6IGNyZWF0ZUFub255bW91c0Rpc2FtYmlndWF0b3Iob3JkaW5hbCksXG4gICAgICAgICAgZXh0ZW5zaW9uczogeyBjcHA6IHsgYW5vbnltb3VzOiB0cnVlIH0gfSxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGZyYW1lID0ge1xuICAgICAgICAgIG5hbWU6IGA8bGFtYmRhPmAsXG4gICAgICAgICAgcXVhbGlmaWVkTmFtZTogc3ltYm9sLnF1YWxpZmllZE5hbWUsXG4gICAgICAgICAgc3ltYm9sSWQ6IHN5bWJvbC5zeW1ib2xJZCxcbiAgICAgICAgICBraW5kOiAnY2xvc3VyZScsXG4gICAgICAgIH07XG4gICAgICAgIGZvciAoY29uc3QgY2hpbGQgb2YgaW5uZXIobm9kZSkpIHtcbiAgICAgICAgICB2aXNpdChjaGlsZCwge1xuICAgICAgICAgICAgLi4uY29udGV4dCxcbiAgICAgICAgICAgIGZpbGUsXG4gICAgICAgICAgICBzY29wZTogWy4uLmNvbnRleHQuc2NvcGUsIGZyYW1lXSxcbiAgICAgICAgICAgIGZ1bmN0aW9uSWQ6IHN5bWJvbC5zeW1ib2xJZCxcbiAgICAgICAgICAgIGluTGFtYmRhOiB0cnVlLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICBraW5kID09PSAnQ2FsbEV4cHInIHx8XG4gICAgICBraW5kID09PSAnQ1hYTWVtYmVyQ2FsbEV4cHInIHx8XG4gICAgICBraW5kID09PSAnQ1hYT3BlcmF0b3JDYWxsRXhwcicgfHxcbiAgICAgIGtpbmQgPT09ICdDWFhDb25zdHJ1Y3RFeHByJ1xuICAgICkge1xuICAgICAgY2FsbFNpdGVzLnB1c2goe1xuICAgICAgICBub2RlLFxuICAgICAgICBmaWxlLFxuICAgICAgICBmdW5jdGlvbklkOiBjb250ZXh0LmZ1bmN0aW9uSWQsXG4gICAgICAgIHJhbmdlLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAga2luZCA9PT0gJ0dvdG9TdG10JyB8fFxuICAgICAga2luZCA9PT0gJ0luZGlyZWN0R290b1N0bXQnIHx8XG4gICAgICBraW5kID09PSAnQ1hYVHJ5U3RtdCcgfHxcbiAgICAgIGtpbmQgPT09ICdDWFhUaHJvd0V4cHInXG4gICAgKSB7XG4gICAgICB1bnN1cHBvcnRlZFNlZW4gPSB0cnVlO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgaW5uZXIobm9kZSkpIHtcbiAgICAgIHZpc2l0KGNoaWxkLCB7IC4uLmNvbnRleHQsIGZpbGUgfSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY291bnRMYW1iZGFzKHNjb3BlKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIHN5bWJvbHMuZmlsdGVyKFxuICAgICAgICAoc3ltYm9sKSA9PlxuICAgICAgICAgIHN5bWJvbC5raW5kID09PSAnY2xvc3VyZScgJiZcbiAgICAgICAgICBzeW1ib2wucXVhbGlmaWVkTmFtZS5zdGFydHNXaXRoKHNjb3BlW3Njb3BlLmxlbmd0aCAtIDFdPy5xdWFsaWZpZWROYW1lID8/ICcnKSxcbiAgICAgICkubGVuZ3RoICsgMVxuICAgICk7XG4gIH1cblxuICAvLyBSb290IHRyYXZlcnNhbCBzdGFydHMgaW4gdGhlIFRVLlxuICBjb25zdCByb290ID0gdHlwZW9mIG9wdGlvbnMuYXN0ID09PSAnc3RyaW5nJyA/IHBhcnNlQXN0KG9wdGlvbnMuYXN0KSA6IG9wdGlvbnMuYXN0O1xuICBpZiAoIWlzT2JqZWN0KHJvb3QpKSB7XG4gICAgZGlhZ25vc3RpY3MucHVzaChcbiAgICAgIGNyZWF0ZURpYWdub3N0aWMoe1xuICAgICAgICBzZXZlcml0eTogJ2Vycm9yJyxcbiAgICAgICAgY29kZTogJ3BhcnNlX2Vycm9yJyxcbiAgICAgICAgbWVzc2FnZTogJ0NsYW5nIGRpZCBub3QgcHJvZHVjZSBhIEpTT04gQVNUIGZvciB0aGlzIHRyYW5zbGF0aW9uIHVuaXQuJyxcbiAgICAgIH0pLFxuICAgICk7XG4gICAgcmV0dXJuIGZpbmlzaCgpO1xuICB9XG5cbiAgZmlsZVN5bWJvbChsb2NhdG9yLnR1UGF0aCk7XG4gIHZpc2l0KHJvb3QsIHtcbiAgICBmaWxlOiBsb2NhdG9yLnR1UGF0aCxcbiAgICBzY29wZTogW10sXG4gICAgZnVuY3Rpb25JZDogbnVsbCxcbiAgICBjbGFzc0lkOiBudWxsLFxuICAgIHZpc2liaWxpdHk6ICdwdWJsaWMnLFxuICAgIHRlbXBsYXRlOiBmYWxzZSxcbiAgICBpbkxhbWJkYTogZmFsc2UsXG4gIH0pO1xuXG4gIC8vIEZpbGUgc3ltYm9scyBmb3IgZXZlcnkgZmlsZSB0aGF0IGFwcGVhcmVkIGluIHRoZSBBU1QuXG4gIGZvciAoY29uc3QgZmlsZSBvZiBsb2NhdG9yLmZpbGVSZWNvcmRzKCkpIHtcbiAgICBjb25zdCBhZnRlciA9IGxvY2F0b3IuZW5zdXJlRmlsZShmaWxlLnBhdGgpO1xuICAgIHZvaWQgYWZ0ZXI7XG4gIH1cblxuICAvLyBFeHRlbmQgZmlsZSBzeW1ib2xzIHRvIHRoZWlyIHJlYWwgcmFuZ2Ugb25jZSBsaW5lIGNvdW50cyBhcmUga25vd24uXG4gIGZvciAoY29uc3Qgc3ltYm9sIG9mIHBlbmRpbmdGaWxlU3ltYm9scykge1xuICAgIGNvbnN0IHJlY29yZCA9IGxvY2F0b3JcbiAgICAgIC5maWxlUmVjb3JkcygpXG4gICAgICAuZmluZCgoZW50cnkpID0+IGVudHJ5LmZpbGVJZCA9PT0gc3ltYm9sLmRlY2xhcmF0aW9uLmZpbGVJZCk7XG4gICAgaWYgKHJlY29yZCkge1xuICAgICAgc3ltYm9sLmRlY2xhcmF0aW9uLmVuZExpbmUgPSBNYXRoLm1heCgwLCByZWNvcmQubGluZUNvdW50IC0gMSk7XG4gICAgICBzeW1ib2wuZGVjbGFyYXRpb24uZW5kQ29sdW1uID0gMTtcbiAgICB9XG4gIH1cblxuICAvLyBDYWxscyBhbmQgaW5jbHVkZXMgbmVlZCB0aGUgY29tcGxldGUgc3ltYm9sIHRhYmxlLlxuICBmb3IgKGNvbnN0IGNhbGwgb2YgY2FsbFNpdGVzKSB7XG4gICAgY29uc3QgcmVsYXRpb25zaGlwID0gY2FsbFJlbGF0aW9uc2hpcChjYWxsKTtcbiAgICBpZiAocmVsYXRpb25zaGlwKSB7XG4gICAgICByZWxhdGlvbnNoaXBzLnB1c2gocmVsYXRpb25zaGlwKTtcbiAgICB9XG4gIH1cbiAgZm9yIChjb25zdCBpbmNsdWRlIG9mIGluY2x1ZGVzKSB7XG4gICAgY29uc3QgcmVsYXRpb25zaGlwID0gaW5jbHVkZVJlbGF0aW9uc2hpcChpbmNsdWRlKTtcbiAgICBpZiAocmVsYXRpb25zaGlwKSB7XG4gICAgICByZWxhdGlvbnNoaXBzLnB1c2gocmVsYXRpb25zaGlwKTtcbiAgICB9XG4gIH1cblxuICBpZiAodGVtcGxhdGVTZWVuKSB7XG4gICAgZGlhZ25vc3RpY3MucHVzaChcbiAgICAgIGNyZWF0ZURpYWdub3N0aWMoe1xuICAgICAgICBzZXZlcml0eTogJ2luZm8nLFxuICAgICAgICBjb2RlOiAndW5zdXBwb3J0ZWRfY29uc3RydWN0JyxcbiAgICAgICAgbWVzc2FnZTogJ1RlbXBsYXRlIGRlY2xhcmF0aW9ucyBhcmUgbW9kZWxlZDsgdGVtcGxhdGUgaW5zdGFudGlhdGlvbnMgYXJlIG5vdCBleHBhbmRlZC4nLFxuICAgICAgfSksXG4gICAgKTtcbiAgfVxuICBpZiAodW5zdXBwb3J0ZWRTZWVuKSB7XG4gICAgZGlhZ25vc3RpY3MucHVzaChcbiAgICAgIGNyZWF0ZURpYWdub3N0aWMoe1xuICAgICAgICBzZXZlcml0eTogJ2luZm8nLFxuICAgICAgICBjb2RlOiAndW5zdXBwb3J0ZWRfY29uc3RydWN0JyxcbiAgICAgICAgbWVzc2FnZTpcbiAgICAgICAgICAnZ290bywgZXhjZXB0aW9uIHBhdGhzLCBhbmQgY29tcHV0ZWQganVtcHMgYXJlIHJlY29yZGVkIG9ubHkgYXMgY29uc3RydWN0czsgZnVsbCBjb250cm9sIGZsb3cgaXMgUGhhc2UgNC4nLFxuICAgICAgfSksXG4gICAgKTtcbiAgfVxuXG4gIGlmICh0eXBlb2Ygc3RkZXJyID09PSAnc3RyaW5nJyAmJiBzdGRlcnIudHJpbSgpLmxlbmd0aCA+IDApIHtcbiAgICBkaWFnbm9zdGljcy5wdXNoKC4uLnBhcnNlU3RkZXJyKHN0ZGVyciwgbG9jYXRvci50dVBhdGgpKTtcbiAgfVxuXG4gIGNvbnN0IHVubWFwcGVkSGVhZGVycyA9IE9iamVjdC5lbnRyaWVzKGhlYWRlck1hcClcbiAgICAuZmlsdGVyKChbLCB2YWx1ZV0pID0+ICF2YWx1ZSB8fCB0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnIHx8IHR5cGVvZiB2YWx1ZS50dVBhdGggIT09ICdzdHJpbmcnKVxuICAgIC5tYXAoKFtoZWFkZXJdKSA9PiBoZWFkZXIpO1xuICBpZiAodW5tYXBwZWRIZWFkZXJzLmxlbmd0aCA+IDApIHtcbiAgICBkaWFnbm9zdGljcy5wdXNoKFxuICAgICAgY3JlYXRlRGlhZ25vc3RpYyh7XG4gICAgICAgIHNldmVyaXR5OiAnd2FybmluZycsXG4gICAgICAgIGNvZGU6ICdoZWFkZXJfd2l0aG91dF90dScsXG4gICAgICAgIG1lc3NhZ2U6IGBObyB0cmFuc2xhdGlvbiB1bml0IGluY2x1ZGVzICR7dW5tYXBwZWRIZWFkZXJzLnNsaWNlKDAsIDMpLmpvaW4oJywgJyl9OyB0aG9zZSBoZWFkZXJzIHdlcmUgYW5hbHl6ZWQgc3ludGFjdGljYWxseSBvbmx5LmAsXG4gICAgICB9KSxcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIGZpbmlzaCgpO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBjYWxsXG4gICAqIEByZXR1cm5zIHtSZWxhdGlvbnNoaXB8bnVsbH1cbiAgICovXG4gIGZ1bmN0aW9uIGNhbGxSZWxhdGlvbnNoaXAoY2FsbCkge1xuICAgIGNvbnN0IGZyb20gPSBjYWxsLmZ1bmN0aW9uSWQgPz8gZmlsZVN5bWJvbChjYWxsLmZpbGUpLnN5bWJvbElkO1xuICAgIGlmICghZnJvbSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IHNpdGUgPSBjYWxsLnJhbmdlID8/IHVuZGVmaW5lZDtcbiAgICBjb25zdCB0YXJnZXQgPSByZXNvbHZlQ2FsbGVlKGNhbGwubm9kZSk7XG4gICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICh0YXJnZXQua2luZCA9PT0gJ2NvbnN0cnVjdCcpIHtcbiAgICAgIGNvbnN0IGNsYXNzU3ltYm9sID0gZmluZENsYXNzQnlUeXBlKHRhcmdldC50eXBlTmFtZSk7XG4gICAgICBpZiAoY2xhc3NTeW1ib2wpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZVJlbGF0aW9uc2hpcCh7XG4gICAgICAgICAgcmVsYXRpb25zaGlwSWQ6IHJlbGF0aW9uc2hpcElkcy5yZWxhdGlvbnNoaXAoe1xuICAgICAgICAgICAgdHlwZTogJ2luc3RhbnRpYXRlcycsXG4gICAgICAgICAgICBmcm9tLFxuICAgICAgICAgICAgdG86IGNsYXNzU3ltYm9sLnN5bWJvbElkLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIHR5cGU6ICdpbnN0YW50aWF0ZXMnLFxuICAgICAgICAgIGZyb20sXG4gICAgICAgICAgdG86IGNsYXNzU3ltYm9sLnN5bWJvbElkLFxuICAgICAgICAgIHN0YXR1czogJ3Jlc29sdmVkJyxcbiAgICAgICAgICBldmlkZW5jZTogW2NyZWF0ZUV2aWRlbmNlKHsga2luZDogJ3NvdXJjZV9yYW5nZScsIC4uLihzaXRlID8geyByYW5nZTogc2l0ZSB9IDoge30pIH0pXSxcbiAgICAgICAgICAuLi4oc2l0ZSA/IHsgc2l0ZSB9IDoge30pLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICh0YXJnZXQuc3RhdHVzID09PSAncmVzb2x2ZWQnICYmIHRhcmdldC5zeW1ib2wpIHtcbiAgICAgIGlmICh0YXJnZXQudmlydHVhbCB8fCB0YXJnZXQuZnVuY3Rpb25Qb2ludGVyKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVSZWxhdGlvbnNoaXAoe1xuICAgICAgICAgIHJlbGF0aW9uc2hpcElkOiByZWxhdGlvbnNoaXBJZHMucmVsYXRpb25zaGlwKHtcbiAgICAgICAgICAgIHR5cGU6ICdjYWxscycsXG4gICAgICAgICAgICBmcm9tLFxuICAgICAgICAgICAgdG86IHRhcmdldC5zeW1ib2wuc3ltYm9sSWQsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgdHlwZTogJ2NhbGxzJyxcbiAgICAgICAgICBmcm9tLFxuICAgICAgICAgIHRvOiB0YXJnZXQuc3ltYm9sLnN5bWJvbElkLFxuICAgICAgICAgIHN0YXR1czogdGFyZ2V0LmZ1bmN0aW9uUG9pbnRlciA/ICd1bnJlc29sdmVkJyA6ICdwb3NzaWJsZScsXG4gICAgICAgICAgcmVhc29uQ29kZTogdGFyZ2V0LmZ1bmN0aW9uUG9pbnRlciA/ICdmdW5jdGlvbl9wb2ludGVyJyA6ICdkeW5hbWljX2Rpc3BhdGNoJyxcbiAgICAgICAgICBldmlkZW5jZTogW2NyZWF0ZUV2aWRlbmNlKHsga2luZDogJ3NvdXJjZV9yYW5nZScsIC4uLihzaXRlID8geyByYW5nZTogc2l0ZSB9IDoge30pIH0pXSxcbiAgICAgICAgICAuLi4oc2l0ZSA/IHsgc2l0ZSB9IDoge30pLFxuICAgICAgICAgIGV4dGVuc2lvbnM6IHsgY3BwOiB7IGNhbmRpZGF0ZXM6IFt0YXJnZXQuc3ltYm9sLnN5bWJvbElkXSB9IH0sXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNyZWF0ZVJlbGF0aW9uc2hpcCh7XG4gICAgICAgIHJlbGF0aW9uc2hpcElkOiByZWxhdGlvbnNoaXBJZHMucmVsYXRpb25zaGlwKHtcbiAgICAgICAgICB0eXBlOiAnY2FsbHMnLFxuICAgICAgICAgIGZyb20sXG4gICAgICAgICAgdG86IHRhcmdldC5zeW1ib2wuc3ltYm9sSWQsXG4gICAgICAgIH0pLFxuICAgICAgICB0eXBlOiAnY2FsbHMnLFxuICAgICAgICBmcm9tLFxuICAgICAgICB0bzogdGFyZ2V0LnN5bWJvbC5zeW1ib2xJZCxcbiAgICAgICAgc3RhdHVzOiAncmVzb2x2ZWQnLFxuICAgICAgICBldmlkZW5jZTogW2NyZWF0ZUV2aWRlbmNlKHsga2luZDogJ3NvdXJjZV9yYW5nZScsIC4uLihzaXRlID8geyByYW5nZTogc2l0ZSB9IDoge30pIH0pXSxcbiAgICAgICAgLi4uKHNpdGUgPyB7IHNpdGUgfSA6IHt9KSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGV4dGVybmFsTmFtZSA9IHRhcmdldC5uYW1lIHx8ICcoYW5vbnltb3VzKSc7XG4gICAgcmV0dXJuIGNyZWF0ZVJlbGF0aW9uc2hpcCh7XG4gICAgICByZWxhdGlvbnNoaXBJZDogcmVsYXRpb25zaGlwSWRzLnJlbGF0aW9uc2hpcCh7XG4gICAgICAgIHR5cGU6ICdjYWxscycsXG4gICAgICAgIGZyb20sXG4gICAgICAgIHRvOiBgZXh0ZXJuYWw6JHtleHRlcm5hbE5hbWV9YCxcbiAgICAgIH0pLFxuICAgICAgdHlwZTogJ2NhbGxzJyxcbiAgICAgIGZyb20sXG4gICAgICB0bzogYGV4dGVybmFsOiR7ZXh0ZXJuYWxOYW1lfWAsXG4gICAgICBzdGF0dXM6ICd1bnJlc29sdmVkJyxcbiAgICAgIHJlYXNvbkNvZGU6IHRhcmdldC5mdW5jdGlvblBvaW50ZXIgPyAnZnVuY3Rpb25fcG9pbnRlcicgOiAnb3V0X29mX3Njb3BlJyxcbiAgICAgIGV2aWRlbmNlOiBbY3JlYXRlRXZpZGVuY2UoeyBraW5kOiAnc291cmNlX3JhbmdlJywgLi4uKHNpdGUgPyB7IHJhbmdlOiBzaXRlIH0gOiB7fSkgfSldLFxuICAgICAgLi4uKHNpdGUgPyB7IHNpdGUgfSA6IHt9KSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3tmaWxlOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgc3lzdGVtOiBib29sZWFuLCBsaW5lOiBudW1iZXIsIGxpbmVUZXh0OiBzdHJpbmd9fSBpbmNsdWRlXG4gICAqIEByZXR1cm5zIHtSZWxhdGlvbnNoaXB8bnVsbH1cbiAgICovXG4gIGZ1bmN0aW9uIGluY2x1ZGVSZWxhdGlvbnNoaXAoaW5jbHVkZSkge1xuICAgIGlmIChpbmNsdWRlLnN5c3RlbSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGZyb20gPSBmaWxlU3ltYm9sKGxvY2F0b3IudHVQYXRoKS5zeW1ib2xJZDtcbiAgICBjb25zdCB0YXJnZXQgPSBmaW5kRmlsZVN5bWJvbEJ5SW5jbHVkZShpbmNsdWRlLm5hbWUpO1xuICAgIGNvbnN0IHNpdGUgPSB7XG4gICAgICBmaWxlSWQ6IGxvY2F0b3IuZmlsZUlkRm9yKGxvY2F0b3IudHVQYXRoKSxcbiAgICAgIHN0YXJ0TGluZTogaW5jbHVkZS5saW5lLFxuICAgICAgc3RhcnRDb2x1bW46IDAsXG4gICAgICBlbmRMaW5lOiBpbmNsdWRlLmxpbmUsXG4gICAgICBlbmRDb2x1bW46IE1hdGgubWF4KDEsIGluY2x1ZGUubGluZVRleHQubGVuZ3RoKSxcbiAgICB9O1xuICAgIGlmICh0YXJnZXQpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSZWxhdGlvbnNoaXAoe1xuICAgICAgICByZWxhdGlvbnNoaXBJZDogcmVsYXRpb25zaGlwSWRzLnJlbGF0aW9uc2hpcCh7XG4gICAgICAgICAgdHlwZTogJ2luY2x1ZGVzJyxcbiAgICAgICAgICBmcm9tLFxuICAgICAgICAgIHRvOiB0YXJnZXQuc3ltYm9sSWQsXG4gICAgICAgIH0pLFxuICAgICAgICB0eXBlOiAnaW5jbHVkZXMnLFxuICAgICAgICBmcm9tLFxuICAgICAgICB0bzogdGFyZ2V0LnN5bWJvbElkLFxuICAgICAgICBzdGF0dXM6ICdyZXNvbHZlZCcsXG4gICAgICAgIGV2aWRlbmNlOiBbY3JlYXRlRXZpZGVuY2UoeyBraW5kOiAnaW1wb3J0JywgcmFuZ2U6IHNpdGUgfSldLFxuICAgICAgICBzaXRlLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBjcmVhdGVSZWxhdGlvbnNoaXAoe1xuICAgICAgcmVsYXRpb25zaGlwSWQ6IHJlbGF0aW9uc2hpcElkcy5yZWxhdGlvbnNoaXAoe1xuICAgICAgICB0eXBlOiAnaW5jbHVkZXMnLFxuICAgICAgICBmcm9tLFxuICAgICAgICB0bzogYGV4dGVybmFsOiR7aW5jbHVkZS5uYW1lfWAsXG4gICAgICB9KSxcbiAgICAgIHR5cGU6ICdpbmNsdWRlcycsXG4gICAgICBmcm9tLFxuICAgICAgdG86IGBleHRlcm5hbDoke2luY2x1ZGUubmFtZX1gLFxuICAgICAgc3RhdHVzOiAndW5yZXNvbHZlZCcsXG4gICAgICByZWFzb25Db2RlOiAnb3V0X29mX3Njb3BlJyxcbiAgICAgIGV2aWRlbmNlOiBbY3JlYXRlRXZpZGVuY2UoeyBraW5kOiAnaW1wb3J0JywgcmFuZ2U6IHNpdGUgfSldLFxuICAgICAgc2l0ZSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gaW5jbHVkZU5hbWVcbiAgICogQHJldHVybnMge1N5bWJvbFJlY29yZHxudWxsfVxuICAgKi9cbiAgZnVuY3Rpb24gZmluZEZpbGVTeW1ib2xCeUluY2x1ZGUoaW5jbHVkZU5hbWUpIHtcbiAgICBjb25zdCBuZWVkbGUgPSBpbmNsdWRlTmFtZS5yZXBsYWNlKC9cXFxcL2csICcvJyk7XG4gICAgZm9yIChjb25zdCBbcGF0aCwgc3ltYm9sXSBvZiBmaWxlU3ltYm9scykge1xuICAgICAgaWYgKHBhdGggPT09IG5lZWRsZSB8fCBwYXRoLmVuZHNXaXRoKGAvJHtuZWVkbGV9YCkgfHwgYmFzZW5hbWUocGF0aCkgPT09IG5lZWRsZSkge1xuICAgICAgICByZXR1cm4gc3ltYm9sO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZU5hbWVcbiAgICogQHJldHVybnMge1N5bWJvbFJlY29yZHxudWxsfVxuICAgKi9cbiAgZnVuY3Rpb24gZmluZENsYXNzQnlUeXBlKHR5cGVOYW1lKSB7XG4gICAgY29uc3QgY2xlYW4gPSBTdHJpbmcodHlwZU5hbWUpXG4gICAgICAucmVwbGFjZSgvXmNsYXNzXFxzKy8sICcnKVxuICAgICAgLnJlcGxhY2UoL15zdHJ1Y3RcXHMrLywgJycpXG4gICAgICAucmVwbGFjZSgvPC4qJC8sICcnKVxuICAgICAgLnJlcGxhY2UoL1xccypcXCorJC8sICcnKVxuICAgICAgLnRyaW0oKTtcbiAgICBjb25zdCBzaG9ydCA9IGNsZWFuLnNwbGl0KCc6OicpLnBvcCgpID8/IGNsZWFuO1xuICAgIGZvciAoY29uc3Qgc3ltYm9sIG9mIHN5bWJvbHMpIHtcbiAgICAgIGlmIChzeW1ib2wua2luZCA9PT0gJ2NsYXNzJyB8fCBzeW1ib2wua2luZCA9PT0gJ3N0cnVjdCcpIHtcbiAgICAgICAgaWYgKHN5bWJvbC5xdWFsaWZpZWROYW1lID09PSBjbGVhbiB8fCBzeW1ib2wubmFtZSA9PT0gc2hvcnQpIHtcbiAgICAgICAgICByZXR1cm4gc3ltYm9sO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IG5vZGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IGZpbGVcbiAgICogQHJldHVybnMge3traW5kOiAnY29uc3RydWN0JywgdHlwZU5hbWU6IHN0cmluZ30gfCB7a2luZDogJ3N5bWJvbCcsIHN5bWJvbD86IFN5bWJvbFJlY29yZCwgbmFtZTogc3RyaW5nLCBzdGF0dXM6IHN0cmluZywgdmlydHVhbD86IGJvb2xlYW4sIGZ1bmN0aW9uUG9pbnRlcj86IGJvb2xlYW59IHwgbnVsbH1cbiAgICovXG4gIGZ1bmN0aW9uIHJlc29sdmVDYWxsZWUobm9kZSkge1xuICAgIGlmIChub2RlLmtpbmQgPT09ICdDWFhDb25zdHJ1Y3RFeHByJykge1xuICAgICAgcmV0dXJuIHsga2luZDogJ2NvbnN0cnVjdCcsIHR5cGVOYW1lOiBTdHJpbmcobm9kZS50eXBlPy5xdWFsVHlwZSA/PyAnJykgfTtcbiAgICB9XG4gICAgY29uc3QgcmVmZXJlbmNlZCA9IGZpbmRSZWZlcmVuY2VkRGVjbChub2RlKTtcbiAgICBpZiAocmVmZXJlbmNlZD8uaWQpIHtcbiAgICAgIGNvbnN0IHN5bWJvbCA9IGJ5Tm9kZUlkLmdldChTdHJpbmcocmVmZXJlbmNlZC5pZCkpO1xuICAgICAgaWYgKHN5bWJvbCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGtpbmQ6ICdzeW1ib2wnLFxuICAgICAgICAgIHN5bWJvbCxcbiAgICAgICAgICBuYW1lOiBzeW1ib2wubmFtZSxcbiAgICAgICAgICBzdGF0dXM6ICdyZXNvbHZlZCcsXG4gICAgICAgICAgdmlydHVhbDogc3ltYm9sLmV4dGVuc2lvbnM/LmNwcD8udmlydHVhbCA9PT0gdHJ1ZSxcbiAgICAgICAgICBmdW5jdGlvblBvaW50ZXI6IGlzRnVuY3Rpb25Qb2ludGVyVHlwZShyZWZlcmVuY2VkLnR5cGUpLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBuYW1lID0gY2FsbGVlTmFtZShub2RlKSB8fCByZWZlcmVuY2VkPy5uYW1lIHx8ICcnO1xuICAgIGlmICghbmFtZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGZpbmRGdW5jdGlvbkJ5TmFtZShuYW1lKTtcbiAgICBpZiAoY2FuZGlkYXRlKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBraW5kOiAnc3ltYm9sJyxcbiAgICAgICAgc3ltYm9sOiBjYW5kaWRhdGUsXG4gICAgICAgIG5hbWUsXG4gICAgICAgIHN0YXR1czogJ3Jlc29sdmVkJyxcbiAgICAgICAgdmlydHVhbDogY2FuZGlkYXRlLmV4dGVuc2lvbnM/LmNwcD8udmlydHVhbCA9PT0gdHJ1ZSxcbiAgICAgICAgZnVuY3Rpb25Qb2ludGVyOiBmYWxzZSxcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBraW5kOiAnc3ltYm9sJyxcbiAgICAgIG5hbWUsXG4gICAgICBzdGF0dXM6ICd1bnJlc29sdmVkJyxcbiAgICAgIGZ1bmN0aW9uUG9pbnRlcjogaXNGdW5jdGlvblBvaW50ZXJUeXBlKHJlZmVyZW5jZWQ/LnR5cGUpLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICogQHJldHVybnMge1N5bWJvbFJlY29yZHxudWxsfVxuICAgKi9cbiAgZnVuY3Rpb24gZmluZEZ1bmN0aW9uQnlOYW1lKG5hbWUpIHtcbiAgICBjb25zdCBtYXRjaGVzID0gc3ltYm9scy5maWx0ZXIoXG4gICAgICAoc3ltYm9sKSA9PlxuICAgICAgICAoc3ltYm9sLmtpbmQgPT09ICdmdW5jdGlvbicgfHxcbiAgICAgICAgICBzeW1ib2wua2luZCA9PT0gJ21ldGhvZCcgfHxcbiAgICAgICAgICBzeW1ib2wua2luZCA9PT0gJ2NvbnN0cnVjdG9yJyB8fFxuICAgICAgICAgIHN5bWJvbC5raW5kID09PSAnZGVzdHJ1Y3RvcicpICYmXG4gICAgICAgIChzeW1ib2wubmFtZSA9PT0gbmFtZSB8fCBzeW1ib2wubmFtZS5lbmRzV2l0aChgOjoke25hbWV9YCkpLFxuICAgICk7XG4gICAgcmV0dXJuIG1hdGNoZXMubGVuZ3RoID09PSAxID8gbWF0Y2hlc1swXSA6IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtTeW1ib2xSZWNvcmRbXX0gX3VudXNlZFxuICAgKiBAcmV0dXJucyB7QW5hbHlzaXNSdW59XG4gICAqL1xuICBmdW5jdGlvbiBmaW5pc2goX3VudXNlZCkge1xuICAgIGNvbnN0IGZpbGVzID0gZGVkdXBlRmlsZXMoW1xuICAgICAgLi4ubG9jYXRvci5maWxlUmVjb3JkcygpLFxuICAgICAgLi4uc3ltYm9sc1xuICAgICAgICAuZmlsdGVyKChzeW1ib2wpID0+IHN5bWJvbC5raW5kID09PSAnZmlsZScpXG4gICAgICAgIC5tYXAoKHN5bWJvbCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHJlY29yZCA9IGxvY2F0b3JcbiAgICAgICAgICAgIC5maWxlUmVjb3JkcygpXG4gICAgICAgICAgICAuZmluZCgoZW50cnkpID0+IGVudHJ5LmZpbGVJZCA9PT0gc3ltYm9sLmRlY2xhcmF0aW9uLmZpbGVJZCk7XG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIHJlY29yZCA/P1xuICAgICAgICAgICAgY3JlYXRlRmlsZVJlY29yZCh7XG4gICAgICAgICAgICAgIGZpbGVJZDogc3ltYm9sLmRlY2xhcmF0aW9uLmZpbGVJZCxcbiAgICAgICAgICAgICAgcGF0aDogc3ltYm9sLnF1YWxpZmllZE5hbWUsXG4gICAgICAgICAgICAgIGxhbmd1YWdlLFxuICAgICAgICAgICAgICBjb250ZW50SGFzaDogYGNsYW5nOiR7c3ltYm9sLnF1YWxpZmllZE5hbWV9YCxcbiAgICAgICAgICAgICAgc2l6ZUJ5dGVzOiAwLFxuICAgICAgICAgICAgICBsaW5lQ291bnQ6IDEsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICk7XG4gICAgICAgIH0pLFxuICAgIF0pO1xuXG4gICAgY29uc3QgcGFydGlhbCA9XG4gICAgICBtb2RlID09PSAnaGV1cmlzdGljJyB8fFxuICAgICAgZGlhZ25vc3RpY3Muc29tZSgoZGlhZ25vc3RpYykgPT4gZGlhZ25vc3RpYy5zZXZlcml0eSA9PT0gJ2Vycm9yJykgfHxcbiAgICAgIGRpYWdub3N0aWNzLnNvbWUoKGRpYWdub3N0aWMpID0+IGRpYWdub3N0aWMuY29kZSA9PT0gJ21pc3NpbmdfY29tcGlsZV9kYicpO1xuICAgIHJldHVybiBjcmVhdGVBbmFseXNpc1J1bih7XG4gICAgICBydW5JZCxcbiAgICAgIGFkYXB0ZXJJZCxcbiAgICAgIGFkYXB0ZXJWZXJzaW9uLFxuICAgICAgbGFuZ3VhZ2UsXG4gICAgICBjc3JWZXJzaW9uOiBDU1JfVkVSU0lPTixcbiAgICAgIHNjb3BlOiB7IGtpbmQ6ICdmaWxlJywgcGF0aDogbG9jYXRvci50dVBhdGggfSxcbiAgICAgIGNvbXBsZXRlbmVzczogcGFydGlhbCA/ICdwYXJ0aWFsJyA6ICdmdWxsJyxcbiAgICAgIGZpbGVzLFxuICAgICAgc3ltYm9scyxcbiAgICAgIHJlbGF0aW9uc2hpcHMsXG4gICAgICBjb250cm9sQ29uc3RydWN0czogW10sXG4gICAgICBkYXRhRmFjdHM6IFtdLFxuICAgICAgZGlhZ25vc3RpY3MsXG4gICAgICBleHRlbnNpb25zOiB7XG4gICAgICAgIGNwcDoge1xuICAgICAgICAgIHRvb2xjaGFpbixcbiAgICAgICAgICBtb2RlLFxuICAgICAgICAgIGhlYWRlck1hcCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBub2RlXG4gKiBAcmV0dXJucyB7UmVjb3JkPHN0cmluZywgdW5rbm93bj5bXX1cbiAqL1xuZnVuY3Rpb24gaW5uZXIobm9kZSkge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShub2RlLmlubmVyKSA/IG5vZGUuaW5uZXIuZmlsdGVyKGlzT2JqZWN0KSA6IFtdO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBraW5kXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBmdW5jdGlvbktpbmQoa2luZCkge1xuICBzd2l0Y2ggKGtpbmQpIHtcbiAgICBjYXNlICdDWFhNZXRob2REZWNsJzpcbiAgICAgIHJldHVybiAnbWV0aG9kJztcbiAgICBjYXNlICdDWFhDb25zdHJ1Y3RvckRlY2wnOlxuICAgICAgcmV0dXJuICdjb25zdHJ1Y3Rvcic7XG4gICAgY2FzZSAnQ1hYRGVzdHJ1Y3RvckRlY2wnOlxuICAgICAgcmV0dXJuICdkZXN0cnVjdG9yJztcbiAgICBjYXNlICdDWFhDb252ZXJzaW9uRGVjbCc6XG4gICAgICByZXR1cm4gJ21ldGhvZCc7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAnZnVuY3Rpb24nO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAqIEByZXR1cm5zIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPnxudWxsfVxuICovXG5mdW5jdGlvbiBwYXJzZUFzdCh0ZXh0KSB7XG4gIHRyeSB7XG4gICAgY29uc3QgdmFsdWUgPSBKU09OLnBhcnNlKHRleHQpO1xuICAgIHJldHVybiBpc09iamVjdCh2YWx1ZSkgPyB2YWx1ZSA6IG51bGw7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAqIEByZXR1cm5zIHtBcnJheTx7ZmlsZTogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIHN5c3RlbTogYm9vbGVhbiwgbGluZTogbnVtYmVyLCBsaW5lVGV4dDogc3RyaW5nfT59XG4gKi9cbmZ1bmN0aW9uIHNjYW5JbmNsdWRlcyh0ZXh0KSB7XG4gIC8qKiBAdHlwZSB7QXJyYXk8e2ZpbGU6IHN0cmluZywgbmFtZTogc3RyaW5nLCBzeXN0ZW06IGJvb2xlYW4sIGxpbmU6IG51bWJlciwgbGluZVRleHQ6IHN0cmluZ30+fSAqL1xuICBjb25zdCBmb3VuZCA9IFtdO1xuICBpZiAodHlwZW9mIHRleHQgIT09ICdzdHJpbmcnIHx8IHRleHQubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGZvdW5kO1xuICB9XG4gIGNvbnN0IGxpbmVzID0gdGV4dC5zcGxpdCgvXFxyXFxufFxccnxcXG4vKTtcbiAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGxpbmVzLmxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIGNvbnN0IG1hdGNoID0gbGluZXNbaW5kZXhdLm1hdGNoKC9eXFxzKiNcXHMqaW5jbHVkZVxccyooWzxcIl0pKFtePlwiXSspWz5cIl0vKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIGZvdW5kLnB1c2goe1xuICAgICAgICBmaWxlOiAnJyxcbiAgICAgICAgbmFtZTogbWF0Y2hbMl0udHJpbSgpLFxuICAgICAgICBzeXN0ZW06IG1hdGNoWzFdID09PSAnPCcsXG4gICAgICAgIGxpbmU6IGluZGV4LFxuICAgICAgICBsaW5lVGV4dDogbGluZXNbaW5kZXhdLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBmb3VuZDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RkZXJyXG4gKiBAcGFyYW0ge3N0cmluZ30gdHVQYXRoXG4gKiBAcmV0dXJucyB7RGlhZ25vc3RpY1tdfVxuICovXG5mdW5jdGlvbiBwYXJzZVN0ZGVycihzdGRlcnIsIHR1UGF0aCkge1xuICAvKiogQHR5cGUge0RpYWdub3N0aWNbXX0gKi9cbiAgY29uc3QgZGlhZ25vc3RpY3MgPSBbXTtcbiAgY29uc3QgbGluZXMgPSBzdGRlcnIuc3BsaXQoL1xcclxcbnxcXHJ8XFxuLyk7XG4gIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuICAgIGlmICghL2Vycm9yOi9pLnRlc3QobGluZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBtZXNzYWdlID0gbGluZVxuICAgICAgLnJlcGxhY2UoL14uKj9lcnJvcjpcXHMqL2ksICcnKVxuICAgICAgLnJlcGxhY2UobmV3IFJlZ0V4cChlc2NhcGVSZWdFeHAodHVQYXRoKSwgJ2cnKSwgYmFzZW5hbWUodHVQYXRoKSlcbiAgICAgIC50cmltKCk7XG4gICAgaWYgKG1lc3NhZ2UubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgZGlhZ25vc3RpY3MucHVzaChcbiAgICAgIGNyZWF0ZURpYWdub3N0aWMoe1xuICAgICAgICBzZXZlcml0eTogJ2Vycm9yJyxcbiAgICAgICAgY29kZTogJ3BhcnNlX2Vycm9yJyxcbiAgICAgICAgbWVzc2FnZTogbWVzc2FnZS5zbGljZSgwLCA1MDApLFxuICAgICAgfSksXG4gICAgKTtcbiAgICBpZiAoZGlhZ25vc3RpY3MubGVuZ3RoID49IDIwKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgaWYgKGRpYWdub3N0aWNzLmxlbmd0aCA9PT0gMCkge1xuICAgIGRpYWdub3N0aWNzLnB1c2goXG4gICAgICBjcmVhdGVEaWFnbm9zdGljKHtcbiAgICAgICAgc2V2ZXJpdHk6ICd3YXJuaW5nJyxcbiAgICAgICAgY29kZTogJ3BhcnNlX2Vycm9yJyxcbiAgICAgICAgbWVzc2FnZTogJ0NsYW5nIHJlcG9ydGVkIGRpYWdub3N0aWNzIGZvciB0aGlzIHRyYW5zbGF0aW9uIHVuaXQuJyxcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cbiAgcmV0dXJuIGRpYWdub3N0aWNzO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IG5vZGVcbiAqIEBwYXJhbSB7bnVtYmVyfSBbZGVwdGhdXG4gKiBAcmV0dXJucyB7e2lkPzogc3RyaW5nLCBuYW1lPzogc3RyaW5nLCBraW5kPzogc3RyaW5nLCB0eXBlPzogc3RyaW5nfXxudWxsfVxuICovXG5mdW5jdGlvbiBmaW5kUmVmZXJlbmNlZERlY2wobm9kZSwgZGVwdGggPSAwKSB7XG4gIGlmIChkZXB0aCA+IDQgfHwgIWlzT2JqZWN0KG5vZGUpKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgaWYgKGlzT2JqZWN0KG5vZGUucmVmZXJlbmNlZERlY2wpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiB0eXBlb2Ygbm9kZS5yZWZlcmVuY2VkRGVjbC5pZCA9PT0gJ3N0cmluZycgPyBub2RlLnJlZmVyZW5jZWREZWNsLmlkIDogdW5kZWZpbmVkLFxuICAgICAgbmFtZTogdHlwZW9mIG5vZGUucmVmZXJlbmNlZERlY2wubmFtZSA9PT0gJ3N0cmluZycgPyBub2RlLnJlZmVyZW5jZWREZWNsLm5hbWUgOiB1bmRlZmluZWQsXG4gICAgICBraW5kOiB0eXBlb2Ygbm9kZS5yZWZlcmVuY2VkRGVjbC5raW5kID09PSAnc3RyaW5nJyA/IG5vZGUucmVmZXJlbmNlZERlY2wua2luZCA6IHVuZGVmaW5lZCxcbiAgICAgIHR5cGU6XG4gICAgICAgIHR5cGVvZiBub2RlLnJlZmVyZW5jZWREZWNsLnR5cGU/LnF1YWxUeXBlID09PSAnc3RyaW5nJ1xuICAgICAgICAgID8gbm9kZS5yZWZlcmVuY2VkRGVjbC50eXBlLnF1YWxUeXBlXG4gICAgICAgICAgOiB1bmRlZmluZWQsXG4gICAgfTtcbiAgfVxuICBpZiAodHlwZW9mIG5vZGUucmVmZXJlbmNlZE1lbWJlckRlY2wgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHsgaWQ6IG5vZGUucmVmZXJlbmNlZE1lbWJlckRlY2wsIG5hbWU6IG5vZGUubmFtZSwga2luZDogJ0NYWE1ldGhvZERlY2wnIH07XG4gIH1cbiAgZm9yIChjb25zdCBjaGlsZCBvZiBpbm5lcihub2RlKSkge1xuICAgIGNvbnN0IGZvdW5kID0gZmluZFJlZmVyZW5jZWREZWNsKGNoaWxkLCBkZXB0aCArIDEpO1xuICAgIGlmIChmb3VuZCkge1xuICAgICAgcmV0dXJuIGZvdW5kO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBub2RlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBjYWxsZWVOYW1lKG5vZGUpIHtcbiAgY29uc3QgbmFtZSA9IHR5cGVvZiBub2RlLm5hbWUgPT09ICdzdHJpbmcnID8gbm9kZS5uYW1lIDogJyc7XG4gIGlmIChuYW1lKSB7XG4gICAgcmV0dXJuIG5hbWU7XG4gIH1cbiAgZm9yIChjb25zdCBjaGlsZCBvZiBpbm5lcihub2RlKSkge1xuICAgIGNvbnN0IGZvdW5kID0gY2FsbGVlTmFtZShjaGlsZCk7XG4gICAgaWYgKGZvdW5kKSB7XG4gICAgICByZXR1cm4gZm91bmQ7XG4gICAgfVxuICB9XG4gIHJldHVybiAnJztcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IHR5cGVcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBpc0Z1bmN0aW9uUG9pbnRlclR5cGUodHlwZSkge1xuICBpZiAodHlwZW9mIHR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiAvXFwoXFxzKlxcKi8udGVzdCh0eXBlKSB8fCAvc3RkOjpmdW5jdGlvbi8udGVzdCh0eXBlKSB8fCAvbWVtYmVyIGZ1bmN0aW9uIHBvaW50ZXIvLnRlc3QodHlwZSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtpbXBvcnQoJy4uLy4uL2NvcmUvY3NyL2VudGl0aWVzLmpzJykuRmlsZVJlY29yZFtdfSByZWNvcmRzXG4gKiBAcmV0dXJucyB7aW1wb3J0KCcuLi8uLi9jb3JlL2Nzci9lbnRpdGllcy5qcycpLkZpbGVSZWNvcmRbXX1cbiAqL1xuZnVuY3Rpb24gZGVkdXBlRmlsZXMocmVjb3Jkcykge1xuICBjb25zdCBieUlkID0gbmV3IE1hcCgpO1xuICBmb3IgKGNvbnN0IHJlY29yZCBvZiByZWNvcmRzKSB7XG4gICAgaWYgKCFieUlkLmhhcyhyZWNvcmQuZmlsZUlkKSkge1xuICAgICAgYnlJZC5zZXQocmVjb3JkLmZpbGVJZCwgcmVjb3JkKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIFsuLi5ieUlkLnZhbHVlcygpXS5zb3J0KChsZWZ0LCByaWdodCkgPT4gbGVmdC5maWxlSWQubG9jYWxlQ29tcGFyZShyaWdodC5maWxlSWQpKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gZmlsZVBhdGhcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGJhc2VuYW1lKGZpbGVQYXRoKSB7XG4gIGNvbnN0IHBhcnRzID0gU3RyaW5nKGZpbGVQYXRoKS5zcGxpdCgvW1xcXFwvXS8pO1xuICByZXR1cm4gcGFydHNbcGFydHMubGVuZ3RoIC0gMV0gfHwgZmlsZVBhdGg7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBlc2NhcGVSZWdFeHAodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCAnXFxcXCQmJyk7XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHJldHVybnMge3ZhbHVlIGlzIFJlY29yZDxzdHJpbmcsIGFueT59XG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKTtcbn1cbiIsICIvKipcbiAqIEMrKyBsYW5ndWFnZSBhZGFwdGVyLlxuICpcbiAqIFRoZSBhZGFwdGVyIGlzIHB1cmU6IGl0IG1hcHMgYSBDbGFuZyBBU1QgdGhhdCB0aGUgaG9zdCBwcm9kdWNlZCBpbnRvIENTUi4gSXRcbiAqIG5ldmVyIHNwYXducyBhIGNvbXBpbGVyLCByZWFkcyB3b3Jrc3BhY2UgZmlsZXMsIG9yIHJ1bnMgYSBidWlsZCBzeXN0ZW0uIFdoZW5cbiAqIHRoZSBob3N0IGNvdWxkIG5vdCBwcm9kdWNlIGFuIEFTVCwgdGhlIGFkYXB0ZXIgcmV0dXJucyBhbiBlbXB0eSBidXQgdmFsaWQgYW5kXG4gKiBkaWFnbm9zZWQgcnVuIHNvIHRoZSBVSSBjYW4gZXhwbGFpbiB0aGUgZ2FwIGluc3RlYWQgb2Ygc2hvd2luZyBhIGZhbHNlIHN1Y2Nlc3MuXG4gKi9cblxuaW1wb3J0IHsgY3JlYXRlQ2FwYWJpbGl0aWVzIH0gZnJvbSAnLi4vLi4vY29yZS9hZGFwdGVyUmVnaXN0cnkuanMnO1xuaW1wb3J0IHsgbWFwQ2xhbmdBc3QgfSBmcm9tICcuL21hcHBlci5qcyc7XG5cbmV4cG9ydCBjb25zdCBDUFBfQURBUFRFUl9JRCA9ICdjcHAtY2xhbmcnO1xuZXhwb3J0IGNvbnN0IENQUF9BREFQVEVSX1ZFUlNJT04gPSAnMC4xLjAnO1xuXG4vKiogSGVhZGVycyBhcmUgbGlzdGVkIGJlY2F1c2UgVjEgYW5hbHlzZXMgdGhlbSB0aHJvdWdoIGEgcmVwcmVzZW50YXRpdmUgVFUuICovXG5leHBvcnQgY29uc3QgQ1BQX0VYVEVOU0lPTlMgPSBPYmplY3QuZnJlZXplKFtcbiAgJy5jcHAnLFxuICAnLmNjJyxcbiAgJy5jeHgnLFxuICAnLmMrKycsXG4gICcuaHBwJyxcbiAgJy5oaCcsXG4gICcuaHh4JyxcbiAgJy5pcHAnLFxuICAnLmgnLFxuXSk7XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gQ3BwQW5hbHl6ZUlucHV0XG4gKiBAcHJvcGVydHkge3N0cmluZ30gcnVuSWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBwYXRoXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3RleHRdXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3dvcmtzcGFjZVJvb3RdXG4gKiBAcHJvcGVydHkge3N0cmluZ3xSZWNvcmQ8c3RyaW5nLCB1bmtub3duPnxudWxsfSBbY3BwQXN0XVxuICogQHByb3BlcnR5IHsnY29tcGlsZS1kYid8J2hldXJpc3RpYyd9IFtjcHBNb2RlXVxuICogQHByb3BlcnR5IHtBcnJheTx7Y29kZTogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmd9Pn0gW2NwcFdhcm5pbmdzXVxuICogQHByb3BlcnR5IHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW2NwcEhlYWRlck1hcF1cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbY3BwVG9vbGNoYWluXVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtjcHBTdGRlcnJdXG4gKi9cblxuZXhwb3J0IGNvbnN0IGNwcEFkYXB0ZXIgPSB7XG4gIGlkOiBDUFBfQURBUFRFUl9JRCxcbiAgZGlzcGxheU5hbWU6ICdDKysgKENsYW5nIEFTVCknLFxuICB2ZXJzaW9uOiBDUFBfQURBUFRFUl9WRVJTSU9OLFxuICBsYW5ndWFnZXM6IFsnY3BwJ10sXG4gIGV4dGVuc2lvbnM6IFsuLi5DUFBfRVhURU5TSU9OU10sXG4gIGNhcGFiaWxpdGllczogY3JlYXRlQ2FwYWJpbGl0aWVzKHtcbiAgICAvLyBQYXJzaW5nIGlzIHJlYWwgKENsYW5nKSwgYnV0IGNvbmZpZ3VyYXRpb24gYW5kIHRlbXBsYXRlcyBjYW4gbWFrZSBpdFxuICAgIC8vIGluY29tcGxldGU7IGRlY2xhcmF0aW9ucyBhbmQgY2FsbHMgYXJlIHRoZXJlZm9yZSBob25lc3RseSBwYXJ0aWFsLlxuICAgIHBhcnNlOiAncGFydGlhbCcsXG4gICAgZGlzY292ZXJEZWNsYXJhdGlvbnM6IHRydWUsXG4gICAgcmVzb2x2ZVN5bWJvbHM6ICdwYXJ0aWFsJyxcbiAgICByZXNvbHZlVHlwZXM6ICdwYXJ0aWFsJyxcbiAgICByZXNvbHZlQ2FsbHM6ICdwYXJ0aWFsJyxcbiAgICBnZW5lcmF0ZUNGRzogZmFsc2UsXG4gICAgZ2VuZXJhdGVERkc6IGZhbHNlLFxuICAgIHJlc29sdmVJbXBvcnRzOiAncGFydGlhbCcsXG4gICAgbWFwU291cmNlTG9jYXRpb25zOiB0cnVlLFxuICAgIHJlcG9ydERpYWdub3N0aWNzOiB0cnVlLFxuICB9KSxcblxuICAvKipcbiAgICogQHBhcmFtIHtDcHBBbmFseXplSW5wdXR9IGlucHV0XG4gICAqIEByZXR1cm5zIHtpbXBvcnQoJy4uLy4uL2NvcmUvY3NyL2VudGl0aWVzLmpzJykuQW5hbHlzaXNSdW59XG4gICAqL1xuICBhbmFseXplKGlucHV0KSB7XG4gICAgcmV0dXJuIG1hcENsYW5nQXN0KHtcbiAgICAgIHJ1bklkOiBpbnB1dC5ydW5JZCxcbiAgICAgIHBhdGg6IGlucHV0LnBhdGgsXG4gICAgICB0ZXh0OiBpbnB1dC50ZXh0ID8/ICcnLFxuICAgICAgd29ya3NwYWNlUm9vdDogaW5wdXQud29ya3NwYWNlUm9vdCxcbiAgICAgIGFzdDogaW5wdXQuY3BwQXN0ID8/IG51bGwsXG4gICAgICBtb2RlOiBpbnB1dC5jcHBNb2RlID8/ICdoZXVyaXN0aWMnLFxuICAgICAgd2FybmluZ3M6IEFycmF5LmlzQXJyYXkoaW5wdXQuY3BwV2FybmluZ3MpID8gaW5wdXQuY3BwV2FybmluZ3MgOiBbXSxcbiAgICAgIGhlYWRlck1hcDogaW5wdXQuY3BwSGVhZGVyTWFwID8/IHt9LFxuICAgICAgdG9vbGNoYWluOiBpbnB1dC5jcHBUb29sY2hhaW4gPz8gJ2NsYW5nJyxcbiAgICAgIHN0ZGVycjogaW5wdXQuY3BwU3RkZXJyID8/ICcnLFxuICAgICAgYWRhcHRlcklkOiBDUFBfQURBUFRFUl9JRCxcbiAgICAgIGFkYXB0ZXJWZXJzaW9uOiBDUFBfQURBUFRFUl9WRVJTSU9OLFxuICAgIH0pO1xuICB9LFxufTtcbiIsICIvKipcbiAqIEhvc3Qtc2lkZSBDKysgYW5hbHlzaXMgcGlwZWxpbmUuXG4gKlxuICogVGhpcyBtb2R1bGUgaXMgdGhlIG9ubHkgcGxhY2UgdGhhdCBkZWNpZGVzIGhvdyBhIEMrKyBmaWxlIGlzIGFuYWx5c2VkLiBJdFxuICogZGlzY292ZXJzIGEgdG9vbGNoYWluLCByZWFkcyBjb25maWd1cmF0aW9uIHRoYXQgYWxyZWFkeSBleGlzdHMsIHJ1bnMgQ2xhbmdcbiAqIHRocm91Z2ggYHJ1blRvb2xgLCBhbmQgaGFuZHMgdGhlIHJlc3VsdGluZyBBU1QgdG8gdGhlIHB1cmUgYWRhcHRlci5cbiAqXG4gKiBJdCBuZXZlciBpbnZva2VzIGEgYnVpbGQgc3lzdGVtLCBuZXZlciBpbnRlcnBvbGF0ZXMgYSBzaGVsbCBjb21tYW5kLCBhbmRcbiAqIGRvd25ncmFkZXMgZXZlcnkgZmFpbHVyZSBpbnRvIGVpdGhlciBhIHR5cGVkIGVycm9yIGJlZm9yZSBhbmFseXNpcyBvciBhXG4gKiBwYXJ0aWFsLCBkaWFnbm9zZWQgcnVuIGFmdGVyd2FyZHMuXG4gKi9cblxuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcblxuaW1wb3J0IHsgZm9jdXNSdW5PblBhdGggfSBmcm9tICcuLi8uLi9jb3JlL2Nzci9mb2N1cy5qcyc7XG5pbXBvcnQgeyBpc1BhdGhJbnNpZGUsIHRvV29ya3NwYWNlUmVsYXRpdmUgfSBmcm9tICcuLi9zZWN1cml0eS9wYXRocy5qcyc7XG5pbXBvcnQgeyBDUFBfQURBUFRFUl9JRCB9IGZyb20gJy4uLy4uL2FkYXB0ZXJzL2NwcC9pbmRleC5qcyc7XG5pbXBvcnQgeyBidWlsZENsYW5nQXJncywgZGVjaWRlQW5hbHlzaXNDb25maWcgfSBmcm9tICcuL2FuYWx5c2lzQ29uZmlnLmpzJztcbmltcG9ydCB7IGRpc2NvdmVyQ2xhbmcgfSBmcm9tICcuL2NsYW5nLmpzJztcbmltcG9ydCB7IGRpc2NvdmVyQ29tcGlsZURiIH0gZnJvbSAnLi9jb21waWxlRGIuanMnO1xuaW1wb3J0IHsgYnVpbGRIZWFkZXJNYXAsIGV4dHJhY3RJbmNsdWRlcywgaXNIZWFkZXJQYXRoIH0gZnJvbSAnLi9oZWFkZXJzLmpzJztcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfVElNRU9VVF9NUyA9IDYwXzAwMDtcbmV4cG9ydCBjb25zdCBERUZBVUxUX01BWF9PVVRQVVRfQllURVMgPSA2NCAqIDEwMjQgKiAxMDI0O1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfTUFYX1RVX0JZVEVTID0gNCAqIDEwMjQgKiAxMDI0O1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfTUFYX0hFQURFUl9DQU5ESURBVEVTID0gMjAwO1xuZXhwb3J0IGNvbnN0IERJU0NPVkVSWV9UVExfTVMgPSAzMF8wMDA7XG5cbi8qKlxuICogQHR5cGVkZWYge2ltcG9ydCgnLi4vLi4vY29yZS9hZGFwdGVyUmVnaXN0cnkuanMnKS5BbmFseXplU3VjY2Vzc30gQW5hbHl6ZVN1Y2Nlc3NcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4uLy4uL2NvcmUvYWRhcHRlclJlZ2lzdHJ5LmpzJykuQW5hbHl6ZUZhaWx1cmV9IEFuYWx5emVGYWlsdXJlXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuLi8uLi9jb3JlL2Nzci9lbnRpdGllcy5qcycpLkFuYWx5c2lzUnVufSBBbmFseXNpc1J1blxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gQ3BwU2V0dGluZ3NcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbY2xhbmdQYXRoXVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtjb21waWxlQ29tbWFuZHNQYXRoXVxuICogQHByb3BlcnR5IHtzdHJpbmdbXX0gW2ZhbGxiYWNrSW5jbHVkZVBhdGhzXVxuICogQHByb3BlcnR5IHtzdHJpbmdbXX0gW2ZhbGxiYWNrRGVmaW5lc11cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbZmFsbGJhY2tTdGFuZGFyZF1cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbdGltZW91dE1zXVxuICogQHByb3BlcnR5IHtudW1iZXJ9IFttYXhPdXRwdXRCeXRlc11cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbbWF4VHVCeXRlc11cbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFByZXBhcmVkQ3BwXG4gKiBAcHJvcGVydHkge3N0cmluZ30gdGFyZ2V0UGF0aFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGZvY3VzUGF0aFxuICogQHByb3BlcnR5IHtib29sZWFufSBmb2N1c2VkXG4gKiBAcHJvcGVydHkge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBpbnB1dFxuICovXG5cbi8qKlxuICogQHBhcmFtIHt7XG4gKiAgIHJlZ2lzdHJ5OiBSZXR1cm5UeXBlPHR5cGVvZiBpbXBvcnQoJy4uLy4uL2NvcmUvYWRhcHRlclJlZ2lzdHJ5LmpzJykuY3JlYXRlQWRhcHRlclJlZ2lzdHJ5PixcbiAqICAgcnVuVG9vbDogdHlwZW9mIGltcG9ydCgnLi4vdG9vbGluZy9ydW5Ub29sLmpzJykucnVuVG9vbCxcbiAqICAgcmVhZEZpbGU/OiB0eXBlb2YgZnMucmVhZEZpbGUsXG4gKiAgIHJlYWREaXI/OiB0eXBlb2YgZnMucmVhZGRpcixcbiAqICAgc2V0dGluZ3M/OiBDcHBTZXR0aW5ncyB8ICgoKSA9PiBDcHBTZXR0aW5ncyksXG4gKiAgIGxvZ2dlcj86IHtkZWJ1Zz86IEZ1bmN0aW9uLCB3YXJuPzogRnVuY3Rpb24sIGVycm9yPzogRnVuY3Rpb259LFxuICogICBkaXNjb3ZlckNsYW5nRm4/OiB0eXBlb2YgZGlzY292ZXJDbGFuZyxcbiAqICAgZGlzY292ZXJDb21waWxlRGJGbj86IHR5cGVvZiBkaXNjb3ZlckNvbXBpbGVEYixcbiAqICAgbm93PzogKCkgPT4gbnVtYmVyLFxuICogICBwbGF0Zm9ybT86IE5vZGVKUy5QbGF0Zm9ybSxcbiAqIH19IG9wdGlvbnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNwcEFuYWx5c2lzU2VydmljZShvcHRpb25zKSB7XG4gIGNvbnN0IHtcbiAgICByZWdpc3RyeSxcbiAgICBydW5Ub29sLFxuICAgIHJlYWRGaWxlID0gZnMucmVhZEZpbGUsXG4gICAgcmVhZERpciA9IGZzLnJlYWRkaXIsXG4gICAgbG9nZ2VyID0ge30sXG4gICAgZGlzY292ZXJDbGFuZ0ZuID0gZGlzY292ZXJDbGFuZyxcbiAgICBkaXNjb3ZlckNvbXBpbGVEYkZuID0gZGlzY292ZXJDb21waWxlRGIsXG4gICAgbm93ID0gKCkgPT4gRGF0ZS5ub3coKSxcbiAgICBwbGF0Zm9ybSA9IHByb2Nlc3MucGxhdGZvcm0sXG4gIH0gPSBvcHRpb25zO1xuXG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywge2F0OiBudW1iZXIsIHZhbHVlOiBhbnl9Pn0gKi9cbiAgY29uc3QgY29tcGlsZUNhY2hlID0gbmV3IE1hcCgpO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIHthdDogbnVtYmVyLCB2YWx1ZTogYW55fT59ICovXG4gIGNvbnN0IGNsYW5nQ2FjaGUgPSBuZXcgTWFwKCk7XG5cbiAgZnVuY3Rpb24gY3VycmVudFNldHRpbmdzKCkge1xuICAgIGNvbnN0IHZhbHVlID0gdHlwZW9mIG9wdGlvbnMuc2V0dGluZ3MgPT09ICdmdW5jdGlvbicgPyBvcHRpb25zLnNldHRpbmdzKCkgOiBvcHRpb25zLnNldHRpbmdzO1xuICAgIHJldHVybiBub3JtYWxpemVTZXR0aW5ncyh2YWx1ZSA/PyB7fSk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHt7cGF0aDogc3RyaW5nLCBydW5JZDogc3RyaW5nLCB3b3Jrc3BhY2VSb290OiBzdHJpbmcsIHRydXN0ZWQ/OiBib29sZWFuLCBjYW5jZWxsYXRpb24/OiB1bmtub3dufX0gaW5wdXRcbiAgICogQHJldHVybnMge1Byb21pc2U8QW5hbHl6ZVN1Y2Nlc3MgfCBBbmFseXplRmFpbHVyZT59XG4gICAqL1xuICBhc3luYyBmdW5jdGlvbiBhbmFseXplKGlucHV0KSB7XG4gICAgY29uc3QgYWRhcHRlciA9IHJlZ2lzdHJ5LnJlc29sdmUoaW5wdXQ/LnBhdGggPz8gJycpO1xuICAgIGlmICghYWRhcHRlciB8fCBhZGFwdGVyLmlkICE9PSBDUFBfQURBUFRFUl9JRCkge1xuICAgICAgcmV0dXJuIHJlZ2lzdHJ5LmFuYWx5emUoaW5wdXQpO1xuICAgIH1cbiAgICBsZXQgcHJlcGFyZWQ7XG4gICAgdHJ5IHtcbiAgICAgIHByZXBhcmVkID0gYXdhaXQgcHJlcGFyZShpbnB1dCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGxvZ2dlci5lcnJvcj8uKCdjcHAucHJlcGFyZV9mYWlsZWQnLCB7XG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICB9KTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgY29kZTogJ0VfSU5URVJOQUwnLFxuICAgICAgICBtZXNzYWdlOiBgQysrIGFuYWx5c2lzIGNvdWxkIG5vdCBiZSBwcmVwYXJlZDogJHtcbiAgICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcbiAgICAgICAgfWAsXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAoIXByZXBhcmVkLm9rKSB7XG4gICAgICByZXR1cm4gcHJlcGFyZWQ7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVnaXN0cnkuYW5hbHl6ZShwcmVwYXJlZC52YWx1ZS5pbnB1dCk7XG4gICAgaWYgKCFyZXN1bHQub2sgfHwgIXByZXBhcmVkLnZhbHVlLmZvY3VzZWQpIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgY29uc3QgZm9jdXNlZCA9IGZvY3VzUnVuT25QYXRoKHJlc3VsdC5ydW4sIHByZXBhcmVkLnZhbHVlLmZvY3VzUGF0aCk7XG4gICAgZm9jdXNlZC5ydW4uY29tcGxldGVuZXNzID0gJ3BhcnRpYWwnO1xuICAgIGZvY3VzZWQucnVuLmRpYWdub3N0aWNzID0gW1xuICAgICAgLi4uZm9jdXNlZC5ydW4uZGlhZ25vc3RpY3MsXG4gICAgICB7XG4gICAgICAgIHNldmVyaXR5OiAnaW5mbycsXG4gICAgICAgIGNvZGU6ICdvdXRfb2Zfc2NvcGUnLFxuICAgICAgICBtZXNzYWdlOiBgVGhlIGhlYWRlciB3YXMgYW5hbHlzZWQgdGhyb3VnaCB0aGUgcmVwcmVzZW50YXRpdmUgdHJhbnNsYXRpb24gdW5pdCBcIiR7cHJlcGFyZWQudmFsdWUudGFyZ2V0UGF0aH1cIi4gRGVjbGFyYXRpb25zIGZyb20gb3RoZXIgZmlsZXMgYXJlIGV4Y2x1ZGVkLmAsXG4gICAgICAgIGFmZmVjdHM6IFtdLFxuICAgICAgfSxcbiAgICBdO1xuICAgIHJldHVybiB7IC4uLnJlc3VsdCwgcnVuOiBmb2N1c2VkLnJ1biB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7e3BhdGg6IHN0cmluZywgcnVuSWQ6IHN0cmluZywgd29ya3NwYWNlUm9vdDogc3RyaW5nLCB0cnVzdGVkPzogYm9vbGVhbiwgY2FuY2VsbGF0aW9uPzogdW5rbm93bn19IGlucHV0XG4gICAqIEByZXR1cm5zIHtQcm9taXNlPHtvazogdHJ1ZSwgdmFsdWU6IFByZXBhcmVkQ3BwfSB8IEFuYWx5emVGYWlsdXJlPn1cbiAgICovXG4gIGFzeW5jIGZ1bmN0aW9uIHByZXBhcmUoaW5wdXQpIHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IGN1cnJlbnRTZXR0aW5ncygpO1xuICAgIGlmICghaW5wdXQgfHwgdHlwZW9mIGlucHV0ICE9PSAnb2JqZWN0Jykge1xuICAgICAgcmV0dXJuIGZhaWx1cmUoJ0VfSU5QVVQnLCAnQW5hbHlzaXMgaW5wdXQgbXVzdCBiZSBhbiBvYmplY3QuJyk7XG4gICAgfVxuICAgIGNvbnN0IHdvcmtzcGFjZVJvb3QgPSBpbnB1dC53b3Jrc3BhY2VSb290O1xuICAgIGlmICh0eXBlb2Ygd29ya3NwYWNlUm9vdCAhPT0gJ3N0cmluZycgfHwgd29ya3NwYWNlUm9vdC5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBmYWlsdXJlKCdFX0lOUFVUJywgJ09wZW4gYSB3b3Jrc3BhY2UgZm9sZGVyIGJlZm9yZSBhbmFseXNpbmcgQysrIGZpbGVzLicpO1xuICAgIH1cbiAgICBpZiAoaW5wdXQudHJ1c3RlZCA9PT0gZmFsc2UpIHtcbiAgICAgIHJldHVybiBmYWlsdXJlKFxuICAgICAgICAnRV9VTlRSVVNURUQnLFxuICAgICAgICAnQ29kZUZsb3cgZG9lcyBub3QgcmVhZCB3b3Jrc3BhY2UgZmlsZXMgaW4gUmVzdHJpY3RlZCBNb2RlLiBUcnVzdCB0aGUgd29ya3NwYWNlIGZpcnN0LicsXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGlucHV0LnBhdGggIT09ICdzdHJpbmcnIHx8IGlucHV0LnBhdGgubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gZmFpbHVyZSgnRV9JTlBVVCcsICdBIGZpbGUgcGF0aCBpcyByZXF1aXJlZC4nKTtcbiAgICB9XG4gICAgaWYgKGlucHV0LnBhdGguaW5jbHVkZXMoJ1xcdTAwMDAnKSkge1xuICAgICAgcmV0dXJuIGZhaWx1cmUoJ0VfSU5QVVQnLCAnVGhlIGZpbGUgcGF0aCBjb250YWlucyBhbiBpbnZhbGlkIGNoYXJhY3Rlci4nKTtcbiAgICB9XG5cbiAgICBjb25zdCBhYnNvbHV0ZVBhdGggPSBwYXRoLmlzQWJzb2x1dGUoaW5wdXQucGF0aClcbiAgICAgID8gcGF0aC5ub3JtYWxpemUoaW5wdXQucGF0aClcbiAgICAgIDogcGF0aC5yZXNvbHZlKHdvcmtzcGFjZVJvb3QsIGlucHV0LnBhdGgpO1xuICAgIGlmICghaXNQYXRoSW5zaWRlKHdvcmtzcGFjZVJvb3QsIGFic29sdXRlUGF0aCwgcGxhdGZvcm0pKSB7XG4gICAgICByZXR1cm4gZmFpbHVyZSgnRV9JTlBVVCcsICdUaGUgZmlsZSBpcyBvdXRzaWRlIHRoZSB3b3Jrc3BhY2UuJyk7XG4gICAgfVxuICAgIGxldCByZWxhdGl2ZVBhdGg7XG4gICAgdHJ5IHtcbiAgICAgIHJlbGF0aXZlUGF0aCA9IHRvV29ya3NwYWNlUmVsYXRpdmUod29ya3NwYWNlUm9vdCwgYWJzb2x1dGVQYXRoLCBwbGF0Zm9ybSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gZmFpbHVyZSgnRV9JTlBVVCcsICdUaGUgZmlsZSBpcyBvdXRzaWRlIHRoZSB3b3Jrc3BhY2UuJyk7XG4gICAgfVxuXG4gICAgY29uc3Qgc291cmNlID0gYXdhaXQgcmVhZFNvdXJjZShhYnNvbHV0ZVBhdGgsIHNldHRpbmdzLm1heFR1Qnl0ZXMpO1xuICAgIGlmICghc291cmNlLm9rKSB7XG4gICAgICByZXR1cm4gZmFpbHVyZSgnRV9JTlBVVCcsIHNvdXJjZS5tZXNzYWdlKTtcbiAgICB9XG5cbiAgICBjb25zdCBbY29tcGlsZURiLCBjbGFuZ10gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICBnZXRDb21waWxlRGIod29ya3NwYWNlUm9vdCwgc2V0dGluZ3MpLFxuICAgICAgZ2V0Q2xhbmcoc2V0dGluZ3MpLFxuICAgIF0pO1xuICAgIGlmICghY2xhbmcub2spIHtcbiAgICAgIHJldHVybiBmYWlsdXJlKGNsYW5nLmNvZGUsIGNsYW5nLm1lc3NhZ2UpO1xuICAgIH1cblxuICAgIC8qKiBAdHlwZSB7c3RyaW5nfSAqL1xuICAgIGxldCB0YXJnZXRBYnNvbHV0ZSA9IGFic29sdXRlUGF0aDtcbiAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cbiAgICBsZXQgdGFyZ2V0UGF0aCA9IHJlbGF0aXZlUGF0aDtcbiAgICAvKiogQHR5cGUge3N0cmluZ30gKi9cbiAgICBsZXQgdGFyZ2V0VGV4dCA9IHNvdXJjZS50ZXh0O1xuICAgIC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovXG4gICAgbGV0IGhlYWRlck1hcCA9IHt9O1xuICAgIGNvbnN0IHdhcm5pbmdzID0gW107XG4gICAgY29uc3QgaGVhZGVyID0gaXNIZWFkZXJQYXRoKHJlbGF0aXZlUGF0aCk7XG5cbiAgICBpZiAoaGVhZGVyICYmIGNvbXBpbGVEYi5vayAmJiBjb21waWxlRGIuY2hvaWNlLmVudHJpZXMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgaW5jbHVkZXNCeVR1ID0gYXdhaXQgcmVhZEluY2x1ZGVzRm9yRW50cmllcyhcbiAgICAgICAgd29ya3NwYWNlUm9vdCxcbiAgICAgICAgY29tcGlsZURiLmNob2ljZS5lbnRyaWVzLFxuICAgICAgICBzZXR0aW5ncyxcbiAgICAgICk7XG4gICAgICBjb25zdCBtYXBwZWQgPSBidWlsZEhlYWRlck1hcCh7XG4gICAgICAgIGhlYWRlclBhdGhzOiBbcmVsYXRpdmVQYXRoXSxcbiAgICAgICAgZW50cmllczogY29tcGlsZURiLmNob2ljZS5lbnRyaWVzLFxuICAgICAgICBpbmNsdWRlc0J5VHUsXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGNob2ljZSA9IG1hcHBlZC5tYXBbcmVsYXRpdmVQYXRoXTtcbiAgICAgIGlmIChjaG9pY2UpIHtcbiAgICAgICAgY29uc3QgZW50cnkgPSBjb21waWxlRGIuY2hvaWNlLmVudHJpZXMuZmluZChcbiAgICAgICAgICAoY2FuZGlkYXRlKSA9PiBjYW5kaWRhdGUucGF0aCA9PT0gY2hvaWNlLnR1UGF0aCxcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKGVudHJ5KSB7XG4gICAgICAgICAgdGFyZ2V0QWJzb2x1dGUgPSBlbnRyeS5hYnNvbHV0ZUZpbGU7XG4gICAgICAgICAgdGFyZ2V0UGF0aCA9IGVudHJ5LnBhdGg7XG4gICAgICAgICAgY29uc3QgdHVTb3VyY2UgPSBhd2FpdCByZWFkU291cmNlKHRhcmdldEFic29sdXRlLCBzZXR0aW5ncy5tYXhUdUJ5dGVzKTtcbiAgICAgICAgICBpZiAoIXR1U291cmNlLm9rKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFpbHVyZSgnRV9JTlBVVCcsIHR1U291cmNlLm1lc3NhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0YXJnZXRUZXh0ID0gdHVTb3VyY2UudGV4dDtcbiAgICAgICAgICBoZWFkZXJNYXAgPSB7IFtyZWxhdGl2ZVBhdGhdOiBjaG9pY2UgfTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHVzaFdhcm5pbmcoXG4gICAgICAgICAgd2FybmluZ3MsXG4gICAgICAgICAgJ2hlYWRlcl93aXRob3V0X3R1JyxcbiAgICAgICAgICBgTm8gdHJhbnNsYXRpb24gdW5pdCBpbiB0aGUgY29tcGlsYXRpb24gZGF0YWJhc2UgaW5jbHVkZXMgXCIke3JlbGF0aXZlUGF0aH1cIi4gVGhlIGhlYWRlciBpcyBhbmFseXNlZCBzeW50YWN0aWNhbGx5IGFuZCBtYXkgYmUgaW5jb21wbGV0ZS5gLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaGVhZGVyKSB7XG4gICAgICBwdXNoV2FybmluZyhcbiAgICAgICAgd2FybmluZ3MsXG4gICAgICAgICdoZWFkZXJfd2l0aG91dF90dScsXG4gICAgICAgIGBObyB0cmFuc2xhdGlvbiB1bml0IHdhcyBhdmFpbGFibGUgZm9yIFwiJHtyZWxhdGl2ZVBhdGh9XCIuIFRoZSBoZWFkZXIgaXMgYW5hbHlzZWQgc3ludGFjdGljYWxseSBhbmQgbWF5IGJlIGluY29tcGxldGUuYCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgY29uZmlnID0gZGVjaWRlQW5hbHlzaXNDb25maWcoe1xuICAgICAgYWJzb2x1dGVGaWxlOiB0YXJnZXRBYnNvbHV0ZSxcbiAgICAgIGNvbXBpbGVEYjogY29tcGlsZURiLm9rID8gY29tcGlsZURiLmNob2ljZSA6IG51bGwsXG4gICAgICBzZXR0aW5nczoge1xuICAgICAgICBpbmNsdWRlUGF0aHM6IHNldHRpbmdzLmZhbGxiYWNrSW5jbHVkZVBhdGhzLFxuICAgICAgICBkZWZpbmVzOiBzZXR0aW5ncy5mYWxsYmFja0RlZmluZXMsXG4gICAgICAgIHN0YW5kYXJkOiBzZXR0aW5ncy5mYWxsYmFja1N0YW5kYXJkIHx8IHVuZGVmaW5lZCxcbiAgICAgIH0sXG4gICAgICBwbGF0Zm9ybSxcbiAgICB9KTtcbiAgICBmb3IgKGNvbnN0IHdhcm5pbmcgb2YgY29uZmlnLndhcm5pbmdzKSB7XG4gICAgICBwdXNoV2FybmluZyh3YXJuaW5ncywgd2FybmluZy5jb2RlLCB3YXJuaW5nLm1lc3NhZ2UpO1xuICAgIH1cbiAgICBpZiAoIWNsYW5nLmNsYW5nLmNvbXBhdGlibGUpIHtcbiAgICAgIHB1c2hXYXJuaW5nKFxuICAgICAgICB3YXJuaW5ncyxcbiAgICAgICAgJ3Rvb2xjaGFpbl92ZXJzaW9uX21pc21hdGNoJyxcbiAgICAgICAgYENsYW5nICR7Y2xhbmcuY2xhbmcudmVyc2lvbn0gaXMgb3V0c2lkZSB0aGUgc3VwcG9ydGVkIHJhbmdlLiBSZXN1bHRzIG1heSBiZSBpbmNvbXBsZXRlLmAsXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGFyZ3MgPSBidWlsZENsYW5nQXJncyh7XG4gICAgICBhYnNvbHV0ZUZpbGU6IHRhcmdldEFic29sdXRlLFxuICAgICAgY29uZmlnLFxuICAgIH0pO1xuXG4gICAgY29uc3QgdG9vbCA9IGF3YWl0IHJ1blRvb2woe1xuICAgICAgY29tbWFuZDogY2xhbmcuY2xhbmcucGF0aCxcbiAgICAgIGFyZ3MsXG4gICAgICBjd2Q6IHdvcmtzcGFjZVJvb3QsXG4gICAgICB0aW1lb3V0TXM6IHNldHRpbmdzLnRpbWVvdXRNcyxcbiAgICAgIG1heE91dHB1dEJ5dGVzOiBzZXR0aW5ncy5tYXhPdXRwdXRCeXRlcyxcbiAgICAgIC4uLihpc0Fib3J0U2lnbmFsKGlucHV0LmNhbmNlbGxhdGlvbikgPyB7IHNpZ25hbDogaW5wdXQuY2FuY2VsbGF0aW9uIH0gOiB7fSksXG4gICAgfSk7XG5cbiAgICBsZXQgYXN0ID0gbnVsbDtcbiAgICBsZXQgc3RkZXJyID0gJyc7XG4gICAgaWYgKHRvb2wub2spIHtcbiAgICAgIHN0ZGVyciA9IHNhbml0aXplRGlhZ25vc3RpY3ModG9vbC5zdGRlcnIgPz8gJycsIHdvcmtzcGFjZVJvb3QsIHRhcmdldEFic29sdXRlLCB0YXJnZXRQYXRoKTtcbiAgICAgIGlmICh0eXBlb2YgdG9vbC5zdGRvdXQgPT09ICdzdHJpbmcnICYmIHRvb2wuc3Rkb3V0LnRyaW0oKS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXN0ID0gSlNPTi5wYXJzZSh0b29sLnN0ZG91dCk7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgIHB1c2hXYXJuaW5nKFxuICAgICAgICAgICAgd2FybmluZ3MsXG4gICAgICAgICAgICAncGFyc2VfZXJyb3InLFxuICAgICAgICAgICAgJ0NsYW5nIHByb2R1Y2VkIG91dHB1dCB0aGF0IHdhcyBub3QgYSBjb21wbGV0ZSBKU09OIEFTVDsgdGhlIHJ1biBpcyBsaW1pdGVkIHRvIGRpYWdub3N0aWNzLicsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKC9maWxlIG5vdCBmb3VuZC9pLnRlc3QodG9vbC5zdGRlcnIgPz8gJycpKSB7XG4gICAgICAgIHB1c2hXYXJuaW5nKFxuICAgICAgICAgIHdhcm5pbmdzLFxuICAgICAgICAgICdtaXNzaW5nX3N5c3RlbV9oZWFkZXJzJyxcbiAgICAgICAgICAnQ2xhbmcgY291bGQgbm90IGZpbmQgb25lIG9yIG1vcmUgaGVhZGVycy4gQWRkIHRoZSBpbmNsdWRlIHBhdGhzIHlvdXIgYnVpbGQgdXNlcywgb3IgZ2VuZXJhdGUgYSBjb21waWxhdGlvbiBkYXRhYmFzZS4nLFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodG9vbC5jb2RlID09PSAnRV9UT09MX05PVF9GT1VORCcpIHtcbiAgICAgIHJldHVybiBmYWlsdXJlKCdFX1VOU1VQUE9SVEVEJywgdG9vbC5tZXNzYWdlKTtcbiAgICB9IGVsc2UgaWYgKHRvb2wuY29kZSA9PT0gJ0VfVE9PTF9USU1FT1VUJykge1xuICAgICAgcHVzaFdhcm5pbmcoXG4gICAgICAgIHdhcm5pbmdzLFxuICAgICAgICAnYnVkZ2V0X2V4Y2VlZGVkJyxcbiAgICAgICAgdG9vbC5tZXNzYWdlIHx8ICdDbGFuZyBleGNlZWRlZCB0aGUgYW5hbHlzaXMgdGltZSBidWRnZXQuJyxcbiAgICAgICk7XG4gICAgICBzdGRlcnIgPSBzYW5pdGl6ZURpYWdub3N0aWNzKHRvb2wuc3RkZXJyID8/ICcnLCB3b3Jrc3BhY2VSb290LCB0YXJnZXRBYnNvbHV0ZSwgdGFyZ2V0UGF0aCk7XG4gICAgfSBlbHNlIGlmICh0b29sLmNvZGUgPT09ICdFX1RPT0xfTElNSVQnKSB7XG4gICAgICBwdXNoV2FybmluZyhcbiAgICAgICAgd2FybmluZ3MsXG4gICAgICAgICdidWRnZXRfZXhjZWVkZWQnLFxuICAgICAgICB0b29sLm1lc3NhZ2UgfHwgJ1RoZSBBU1QgZXhjZWVkZWQgdGhlIG91dHB1dCBzaXplIGJ1ZGdldC4nLFxuICAgICAgKTtcbiAgICAgIHN0ZGVyciA9IHNhbml0aXplRGlhZ25vc3RpY3ModG9vbC5zdGRlcnIgPz8gJycsIHdvcmtzcGFjZVJvb3QsIHRhcmdldEFic29sdXRlLCB0YXJnZXRQYXRoKTtcbiAgICB9IGVsc2UgaWYgKHRvb2wuY29kZSA9PT0gJ0VfQ0FOQ0VMTEVEJykge1xuICAgICAgcHVzaFdhcm5pbmcod2FybmluZ3MsICdjYW5jZWxsZWQnLCAnVGhlIGFuYWx5c2lzIHdhcyBjYW5jZWxsZWQuJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHB1c2hXYXJuaW5nKHdhcm5pbmdzLCAnYWRhcHRlcl9lcnJvcicsIHRvb2wubWVzc2FnZSB8fCAnQ2xhbmcgY291bGQgbm90IGJlIGV4ZWN1dGVkLicpO1xuICAgIH1cblxuICAgIGNvbnN0IGZvY3VzZWQgPSBoZWFkZXIgJiYgdGFyZ2V0UGF0aCAhPT0gcmVsYXRpdmVQYXRoO1xuICAgIHJldHVybiB7XG4gICAgICBvazogdHJ1ZSxcbiAgICAgIHZhbHVlOiB7XG4gICAgICAgIHRhcmdldFBhdGgsXG4gICAgICAgIGZvY3VzUGF0aDogZm9jdXNlZCA/IHJlbGF0aXZlUGF0aCA6IHJlbGF0aXZlUGF0aCxcbiAgICAgICAgZm9jdXNlZCxcbiAgICAgICAgaW5wdXQ6IHtcbiAgICAgICAgICAuLi5pbnB1dCxcbiAgICAgICAgICBwYXRoOiByZWxhdGl2ZVBhdGgsXG4gICAgICAgICAgd29ya3NwYWNlUm9vdCxcbiAgICAgICAgICB0ZXh0OiB0YXJnZXRUZXh0LFxuICAgICAgICAgIGNwcEFzdDogYXN0LFxuICAgICAgICAgIGNwcE1vZGU6IGNvbmZpZy5tb2RlLFxuICAgICAgICAgIGNwcFdhcm5pbmdzOiB3YXJuaW5ncyxcbiAgICAgICAgICBjcHBIZWFkZXJNYXA6IGhlYWRlck1hcCxcbiAgICAgICAgICBjcHBUb29sY2hhaW46IGBjbGFuZyAke2NsYW5nLmNsYW5nLnZlcnNpb259YCxcbiAgICAgICAgICBjcHBTdGRlcnI6IHN0ZGVyci5zbGljZSgwLCAxNiAqIDEwMjQpLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB3b3Jrc3BhY2VSb290XG4gICAqIEBwYXJhbSB7Q3BwU2V0dGluZ3N9IHNldHRpbmdzXG4gICAqL1xuICBhc3luYyBmdW5jdGlvbiBnZXRDb21waWxlRGIod29ya3NwYWNlUm9vdCwgc2V0dGluZ3MpIHtcbiAgICBjb25zdCBrZXkgPSBgJHt3b3Jrc3BhY2VSb290fXwke3NldHRpbmdzLmNvbXBpbGVDb21tYW5kc1BhdGh9YDtcbiAgICBjb25zdCBjYWNoZWQgPSBjb21waWxlQ2FjaGUuZ2V0KGtleSk7XG4gICAgaWYgKGNhY2hlZCAmJiBub3coKSAtIGNhY2hlZC5hdCA8IERJU0NPVkVSWV9UVExfTVMpIHtcbiAgICAgIHJldHVybiBjYWNoZWQudmFsdWU7XG4gICAgfVxuICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgZGlzY292ZXJDb21waWxlRGJGbih7XG4gICAgICB3b3Jrc3BhY2VSb290LFxuICAgICAgY29uZmlndXJlZFBhdGg6IHNldHRpbmdzLmNvbXBpbGVDb21tYW5kc1BhdGgsXG4gICAgICByZWFkRmlsZSxcbiAgICAgIHJlYWREaXIsXG4gICAgfSk7XG4gICAgY29tcGlsZUNhY2hlLnNldChrZXksIHsgYXQ6IG5vdygpLCB2YWx1ZSB9KTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtDcHBTZXR0aW5nc30gc2V0dGluZ3NcbiAgICovXG4gIGFzeW5jIGZ1bmN0aW9uIGdldENsYW5nKHNldHRpbmdzKSB7XG4gICAgY29uc3Qga2V5ID0gc2V0dGluZ3MuY2xhbmdQYXRoO1xuICAgIGNvbnN0IGNhY2hlZCA9IGNsYW5nQ2FjaGUuZ2V0KGtleSk7XG4gICAgaWYgKGNhY2hlZCAmJiBub3coKSAtIGNhY2hlZC5hdCA8IERJU0NPVkVSWV9UVExfTVMpIHtcbiAgICAgIHJldHVybiBjYWNoZWQudmFsdWU7XG4gICAgfVxuICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgZGlzY292ZXJDbGFuZ0ZuKHsgcnVuVG9vbCwgY29uZmlndXJlZFBhdGg6IGtleSB9KTtcbiAgICBjbGFuZ0NhY2hlLnNldChrZXksIHsgYXQ6IG5vdygpLCB2YWx1ZSB9KTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICAvKipcbiAgICogUmVhZCB0aGUgVFVzIGluIHRoZSBjb21waWxhdGlvbiBkYXRhYmFzZSBzbyBoZWFkZXJzIGNhbiBiZSBtYXBwZWQgdG8gb25lXG4gICAqIHJlcHJlc2VudGF0aXZlIHVuaXQuIFRoZSBudW1iZXIgb2YgY2FuZGlkYXRlcyBpcyBib3VuZGVkOyBhIGxhcmdlIHByb2plY3RcbiAgICogZGVncmFkZXMgdG8gYSBzeW50YWN0aWMgaGVhZGVyIGFuYWx5c2lzIHJhdGhlciB0aGFuIHJlYWRpbmcgZXZlcnl0aGluZy5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHdvcmtzcGFjZVJvb3RcbiAgICogQHBhcmFtIHtpbXBvcnQoJy4vY29tcGlsZURiLmpzJykuQ29tcGlsZUVudHJ5W119IGVudHJpZXNcbiAgICogQHBhcmFtIHtDcHBTZXR0aW5nc30gc2V0dGluZ3NcbiAgICovXG4gIGFzeW5jIGZ1bmN0aW9uIHJlYWRJbmNsdWRlc0ZvckVudHJpZXMod29ya3NwYWNlUm9vdCwgZW50cmllcywgc2V0dGluZ3MpIHtcbiAgICAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIGltcG9ydCgnLi9oZWFkZXJzLmpzJykuSW5jbHVkZURpcmVjdGl2ZVtdPn0gKi9cbiAgICBjb25zdCBpbmNsdWRlc0J5VHUgPSB7fTtcbiAgICBjb25zdCBjYW5kaWRhdGVzID0gWy4uLmVudHJpZXNdXG4gICAgICAuZmlsdGVyKChlbnRyeSkgPT4gaXNQYXRoSW5zaWRlKHdvcmtzcGFjZVJvb3QsIGVudHJ5LmFic29sdXRlRmlsZSwgcGxhdGZvcm0pKVxuICAgICAgLnNvcnQoKGxlZnQsIHJpZ2h0KSA9PiBsZWZ0LnBhdGgubG9jYWxlQ29tcGFyZShyaWdodC5wYXRoKSlcbiAgICAgIC5zbGljZSgwLCBERUZBVUxUX01BWF9IRUFERVJfQ0FORElEQVRFUyk7XG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBjYW5kaWRhdGVzKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgcmVhZFNvdXJjZShlbnRyeS5hYnNvbHV0ZUZpbGUsIHNldHRpbmdzLm1heFR1Qnl0ZXMpO1xuICAgICAgaWYgKHRleHQub2spIHtcbiAgICAgICAgaW5jbHVkZXNCeVR1W2VudHJ5LnBhdGhdID0gZXh0cmFjdEluY2x1ZGVzKHRleHQudGV4dCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpbmNsdWRlc0J5VHU7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFic29sdXRlUGF0aFxuICAgKiBAcGFyYW0ge251bWJlcn0gbWF4Qnl0ZXNcbiAgICogQHJldHVybnMge1Byb21pc2U8e29rOiB0cnVlLCB0ZXh0OiBzdHJpbmd9IHwge29rOiBmYWxzZSwgbWVzc2FnZTogc3RyaW5nfT59XG4gICAqL1xuICBhc3luYyBmdW5jdGlvbiByZWFkU291cmNlKGFic29sdXRlUGF0aCwgbWF4Qnl0ZXMpIHtcbiAgICBsZXQgdGV4dDtcbiAgICB0cnkge1xuICAgICAgdGV4dCA9IGF3YWl0IHJlYWRGaWxlKGFic29sdXRlUGF0aCwgJ3V0ZjgnKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiB7IG9rOiBmYWxzZSwgbWVzc2FnZTogYENvdWxkIG5vdCByZWFkIFwiJHtwYXRoLmJhc2VuYW1lKGFic29sdXRlUGF0aCl9XCIuYCB9O1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHRleHQgIT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4geyBvazogZmFsc2UsIG1lc3NhZ2U6IGBDb3VsZCBub3QgcmVhZCBcIiR7cGF0aC5iYXNlbmFtZShhYnNvbHV0ZVBhdGgpfVwiIGFzIHRleHQuYCB9O1xuICAgIH1cbiAgICBpZiAoQnVmZmVyLmJ5dGVMZW5ndGgodGV4dCwgJ3V0ZjgnKSA+IG1heEJ5dGVzKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvazogZmFsc2UsXG4gICAgICAgIG1lc3NhZ2U6IGBcIiR7cGF0aC5iYXNlbmFtZShhYnNvbHV0ZVBhdGgpfVwiIGlzIGxhcmdlciB0aGFuIHRoZSAke01hdGgucm91bmQoXG4gICAgICAgICAgbWF4Qnl0ZXMgLyAoMTAyNCAqIDEwMjQpLFxuICAgICAgICApfSBNaUIgYW5hbHlzaXMgYnVkZ2V0LmAsXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4geyBvazogdHJ1ZSwgdGV4dCB9O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBhbmFseXplLFxuICAgIHByZXBhcmUsXG4gICAgcmVzZXQoKSB7XG4gICAgICBjb21waWxlQ2FjaGUuY2xlYXIoKTtcbiAgICAgIGNsYW5nQ2FjaGUuY2xlYXIoKTtcbiAgICB9LFxuICAgIC8qKiBUZXN0L3RlbGVtZXRyeSBob29rLiAqL1xuICAgIGNhY2hlU2l6ZXM6ICgpID0+ICh7IGNvbXBpbGU6IGNvbXBpbGVDYWNoZS5zaXplLCBjbGFuZzogY2xhbmdDYWNoZS5zaXplIH0pLFxuICB9O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEByZXR1cm5zIHt2YWx1ZSBpcyBBYm9ydFNpZ25hbH1cbiAqL1xuZnVuY3Rpb24gaXNBYm9ydFNpZ25hbCh2YWx1ZSkge1xuICByZXR1cm4gQm9vbGVhbih2YWx1ZSkgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiAnYWJvcnRlZCcgaW4gdmFsdWU7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGNvZGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gKiBAcmV0dXJucyB7QW5hbHl6ZUZhaWx1cmV9XG4gKi9cbmZ1bmN0aW9uIGZhaWx1cmUoY29kZSwgbWVzc2FnZSkge1xuICByZXR1cm4geyBvazogZmFsc2UsIGNvZGUsIG1lc3NhZ2UgfTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0NwcFNldHRpbmdzfSBpbnB1dFxuICovXG5mdW5jdGlvbiBub3JtYWxpemVTZXR0aW5ncyhpbnB1dCkge1xuICByZXR1cm4ge1xuICAgIGNsYW5nUGF0aDogdHlwZW9mIGlucHV0LmNsYW5nUGF0aCA9PT0gJ3N0cmluZycgPyBpbnB1dC5jbGFuZ1BhdGgudHJpbSgpIDogJycsXG4gICAgY29tcGlsZUNvbW1hbmRzUGF0aDpcbiAgICAgIHR5cGVvZiBpbnB1dC5jb21waWxlQ29tbWFuZHNQYXRoID09PSAnc3RyaW5nJyA/IGlucHV0LmNvbXBpbGVDb21tYW5kc1BhdGgudHJpbSgpIDogJycsXG4gICAgZmFsbGJhY2tJbmNsdWRlUGF0aHM6IHN0cmluZ0FycmF5KGlucHV0LmZhbGxiYWNrSW5jbHVkZVBhdGhzKSxcbiAgICBmYWxsYmFja0RlZmluZXM6IHN0cmluZ0FycmF5KGlucHV0LmZhbGxiYWNrRGVmaW5lcyksXG4gICAgZmFsbGJhY2tTdGFuZGFyZDogdHlwZW9mIGlucHV0LmZhbGxiYWNrU3RhbmRhcmQgPT09ICdzdHJpbmcnID8gaW5wdXQuZmFsbGJhY2tTdGFuZGFyZCA6ICcnLFxuICAgIHRpbWVvdXRNczpcbiAgICAgIE51bWJlci5pc0Zpbml0ZShpbnB1dC50aW1lb3V0TXMpICYmIGlucHV0LnRpbWVvdXRNcyA+IDBcbiAgICAgICAgPyBpbnB1dC50aW1lb3V0TXNcbiAgICAgICAgOiBERUZBVUxUX1RJTUVPVVRfTVMsXG4gICAgbWF4T3V0cHV0Qnl0ZXM6XG4gICAgICBOdW1iZXIuaXNGaW5pdGUoaW5wdXQubWF4T3V0cHV0Qnl0ZXMpICYmIGlucHV0Lm1heE91dHB1dEJ5dGVzID4gMFxuICAgICAgICA/IGlucHV0Lm1heE91dHB1dEJ5dGVzXG4gICAgICAgIDogREVGQVVMVF9NQVhfT1VUUFVUX0JZVEVTLFxuICAgIG1heFR1Qnl0ZXM6XG4gICAgICBOdW1iZXIuaXNGaW5pdGUoaW5wdXQubWF4VHVCeXRlcykgJiYgaW5wdXQubWF4VHVCeXRlcyA+IDBcbiAgICAgICAgPyBpbnB1dC5tYXhUdUJ5dGVzXG4gICAgICAgIDogREVGQVVMVF9NQVhfVFVfQllURVMsXG4gIH07XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHJldHVybnMge3N0cmluZ1tdfVxuICovXG5mdW5jdGlvbiBzdHJpbmdBcnJheSh2YWx1ZSkge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSlcbiAgICA/IHZhbHVlLmZpbHRlcigoZW50cnkpID0+IHR5cGVvZiBlbnRyeSA9PT0gJ3N0cmluZycgJiYgZW50cnkubGVuZ3RoID4gMClcbiAgICA6IFtdO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7QXJyYXk8e2NvZGU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nfT59IHdhcm5pbmdzXG4gKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAqL1xuZnVuY3Rpb24gcHVzaFdhcm5pbmcod2FybmluZ3MsIGNvZGUsIG1lc3NhZ2UpIHtcbiAgaWYgKCF3YXJuaW5ncy5zb21lKCh3YXJuaW5nKSA9PiB3YXJuaW5nLmNvZGUgPT09IGNvZGUgJiYgd2FybmluZy5tZXNzYWdlID09PSBtZXNzYWdlKSkge1xuICAgIHdhcm5pbmdzLnB1c2goeyBjb2RlLCBtZXNzYWdlIH0pO1xuICB9XG59XG5cbi8qKlxuICogS2VlcCBkaWFnbm9zdGljcyBhY3Rpb25hYmxlOiBubyBhYnNvbHV0ZSB3b3Jrc3BhY2UgcGF0aHMsIG5vIGdpYW50IGR1bXBzLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gKiBAcGFyYW0ge3N0cmluZ30gd29ya3NwYWNlUm9vdFxuICogQHBhcmFtIHtzdHJpbmd9IGFic29sdXRlRmlsZVxuICogQHBhcmFtIHtzdHJpbmd9IHJlbGF0aXZlRmlsZVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gc2FuaXRpemVEaWFnbm9zdGljcyh0ZXh0LCB3b3Jrc3BhY2VSb290LCBhYnNvbHV0ZUZpbGUsIHJlbGF0aXZlRmlsZSkge1xuICBpZiAodHlwZW9mIHRleHQgIT09ICdzdHJpbmcnIHx8IHRleHQubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG4gIGNvbnN0IGZvcm1zID0gKHZhbHVlKSA9PiBbU3RyaW5nKHZhbHVlKSwgU3RyaW5nKHZhbHVlKS5yZXBsYWNlKC9cXFxcL2csICcvJyldO1xuICBsZXQgb3V0cHV0ID0gdGV4dDtcbiAgZm9yIChjb25zdCBmb3JtIG9mIGZvcm1zKGFic29sdXRlRmlsZSkpIHtcbiAgICBvdXRwdXQgPSBvdXRwdXQuc3BsaXQoZm9ybSkuam9pbihyZWxhdGl2ZUZpbGUpO1xuICB9XG4gIGZvciAoY29uc3QgZm9ybSBvZiBmb3Jtcyh3b3Jrc3BhY2VSb290KSkge1xuICAgIG91dHB1dCA9IG91dHB1dC5zcGxpdChmb3JtKS5qb2luKCc8d29ya3NwYWNlPicpO1xuICB9XG4gIHJldHVybiBvdXRwdXQuc2xpY2UoMCwgMzIgKiAxMDI0KTtcbn1cbiIsICIvKipcbiAqIEZvY3VzIGEgcnVuIG9uIG9uZSBmaWxlLlxuICpcbiAqIEEgaGVhZGVyIGlzIGFuYWx5c2VkIHRocm91Z2ggYSB0cmFuc2xhdGlvbiB1bml0IHRoYXQgaW5jbHVkZXMgaXQsIHNvIHRoZSByYXdcbiAqIHJ1biBjb250YWlucyBkZWNsYXJhdGlvbnMgYW5kIGNhbGxzIGZyb20gYm90aCBmaWxlcy4gQ29uc3VtZXJzIHRoYXQgYXNrZWQgZm9yXG4gKiB0aGUgaGVhZGVyIG11c3Qgbm90IGJlIHNob3duIHRoZSBUVSdzIHN5bWJvbHMgYXMgaWYgdGhleSBsaXZlZCBpbiB0aGUgaGVhZGVyLlxuICogVGhpcyBtb2R1bGUgcHJvZHVjZXMgdGhlIGhvbmVzdCBzdWJzZXQ6IHN5bWJvbHMgZGVjbGFyZWQgaW4gdGhlIHJlcXVlc3RlZFxuICogZmlsZSwgcmVsYXRpb25zaGlwcyB3aG9zZSBlbmRwb2ludHMgc3Vydml2ZSwgYW5kIGV2ZXJ5IGZpbGUgcmVjb3JkIChyYW5nZXNcbiAqIHN0aWxsIG5lZWQgdG8gcmVzb2x2ZSkuXG4gKlxuICogSXQgaXMgYSBwdXJlIHRyYW5zZm9ybWF0aW9uIGFuZCBkb2VzIG5vdCByZS12YWxpZGF0ZTsgY2FsbGVycyB0aGF0IG5lZWQgdGhlXG4gKiBkZWZlbnNpdmUgZ3VhcmFudGVlIHJ1biBgdmFsaWRhdGVBbmFseXNpc1J1bmAgYWdhaW4gYXQgdGhlIGJvdW5kYXJ5LlxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge2ltcG9ydCgnLi9lbnRpdGllcy5qcycpLkFuYWx5c2lzUnVufSBBbmFseXNpc1J1blxuICogQHR5cGVkZWYge2ltcG9ydCgnLi9lbnRpdGllcy5qcycpLlN5bWJvbFJlY29yZH0gU3ltYm9sUmVjb3JkXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuL2VudGl0aWVzLmpzJykuUmVsYXRpb25zaGlwfSBSZWxhdGlvbnNoaXBcbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7QW5hbHlzaXNSdW59IHJ1blxuICogQHBhcmFtIHtzdHJpbmd9IHBhdGggV29ya3NwYWNlLXJlbGF0aXZlLCBmb3J3YXJkLXNsYXNoIHBhdGhcbiAqIEByZXR1cm5zIHt7cnVuOiBBbmFseXNpc1J1biwga2VwdFN5bWJvbHM6IG51bWJlciwgZHJvcHBlZFN5bWJvbHM6IG51bWJlciwgZHJvcHBlZFJlbGF0aW9uc2hpcHM6IG51bWJlcn19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb2N1c1J1bk9uUGF0aChydW4sIHBhdGgpIHtcbiAgY29uc3QgZmlsZSA9IHJ1bi5maWxlcy5maW5kKChlbnRyeSkgPT4gZW50cnkucGF0aCA9PT0gcGF0aCk7XG4gIGNvbnN0IHNvdXJjZSA9IC8qKiBAdHlwZSB7QW5hbHlzaXNSdW59ICovIChydW4pO1xuXG4gIGlmICghZmlsZSkge1xuICAgIHJldHVybiB7XG4gICAgICBydW46IHtcbiAgICAgICAgLi4uc291cmNlLFxuICAgICAgICBzY29wZTogeyBraW5kOiAnZmlsZScsIHBhdGggfSxcbiAgICAgICAgc3ltYm9sczogW10sXG4gICAgICAgIHJlbGF0aW9uc2hpcHM6IFtdLFxuICAgICAgICBjb250cm9sQ29uc3RydWN0czogW10sXG4gICAgICAgIGRhdGFGYWN0czogW10sXG4gICAgICB9LFxuICAgICAga2VwdFN5bWJvbHM6IDAsXG4gICAgICBkcm9wcGVkU3ltYm9sczogc291cmNlLnN5bWJvbHMubGVuZ3RoLFxuICAgICAgZHJvcHBlZFJlbGF0aW9uc2hpcHM6IHNvdXJjZS5yZWxhdGlvbnNoaXBzLmxlbmd0aCxcbiAgICB9O1xuICB9XG5cbiAgY29uc3Qga2VwdCA9IHNvdXJjZS5zeW1ib2xzLmZpbHRlcigoc3ltYm9sKSA9PiBzeW1ib2wuZGVjbGFyYXRpb24uZmlsZUlkID09PSBmaWxlLmZpbGVJZCk7XG4gIGNvbnN0IGtlcHRJZHMgPSBuZXcgU2V0KGtlcHQubWFwKChzeW1ib2wpID0+IHN5bWJvbC5zeW1ib2xJZCkpO1xuXG4gIGNvbnN0IHN5bWJvbHMgPSBrZXB0Lm1hcCgoc3ltYm9sKSA9PiB7XG4gICAgaWYgKHN5bWJvbC5wYXJlbnRJZCAmJiAha2VwdElkcy5oYXMoc3ltYm9sLnBhcmVudElkKSkge1xuICAgICAgY29uc3QgY29weSA9IHsgLi4uc3ltYm9sIH07XG4gICAgICBkZWxldGUgY29weS5wYXJlbnRJZDtcbiAgICAgIHJldHVybiBjb3B5O1xuICAgIH1cbiAgICByZXR1cm4gc3ltYm9sO1xuICB9KTtcblxuICBjb25zdCByZWxhdGlvbnNoaXBzID0gc291cmNlLnJlbGF0aW9uc2hpcHMuZmlsdGVyKChyZWxhdGlvbnNoaXApID0+IHtcbiAgICBpZiAoIWtlcHRJZHMuaGFzKHJlbGF0aW9uc2hpcC5mcm9tKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAocmVsYXRpb25zaGlwLnRvLnN0YXJ0c1dpdGgoJ2V4dGVybmFsOicpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGtlcHRJZHMuaGFzKHJlbGF0aW9uc2hpcC50byk7XG4gIH0pO1xuXG4gIHJldHVybiB7XG4gICAgcnVuOiB7XG4gICAgICAuLi5zb3VyY2UsXG4gICAgICBzY29wZTogeyBraW5kOiAnZmlsZScsIHBhdGggfSxcbiAgICAgIHN5bWJvbHMsXG4gICAgICByZWxhdGlvbnNoaXBzLFxuICAgICAgY29udHJvbENvbnN0cnVjdHM6IHNvdXJjZS5jb250cm9sQ29uc3RydWN0cy5maWx0ZXIoKGNvbnN0cnVjdCkgPT5cbiAgICAgICAga2VwdElkcy5oYXMoY29uc3RydWN0LnN5bWJvbElkID8/ICcnKSxcbiAgICAgICksXG4gICAgICBkYXRhRmFjdHM6IHNvdXJjZS5kYXRhRmFjdHMuZmlsdGVyKChmYWN0KSA9PiBrZXB0SWRzLmhhcyhmYWN0LnN5bWJvbElkKSksXG4gICAgfSxcbiAgICBrZXB0U3ltYm9sczogc3ltYm9scy5sZW5ndGgsXG4gICAgZHJvcHBlZFN5bWJvbHM6IHNvdXJjZS5zeW1ib2xzLmxlbmd0aCAtIHN5bWJvbHMubGVuZ3RoLFxuICAgIGRyb3BwZWRSZWxhdGlvbnNoaXBzOiBzb3VyY2UucmVsYXRpb25zaGlwcy5sZW5ndGggLSByZWxhdGlvbnNoaXBzLmxlbmd0aCxcbiAgfTtcbn1cbiIsICIvKipcbiAqIFdvcmtzcGFjZSBwYXRoIHNhZmV0eS5cbiAqXG4gKiBXb3Jrc3BhY2UgY29udGVudHMgYXJlIHVudHJ1c3RlZCBpbnB1dCAoUm9hZG1hcCBzZWN0aW9uIDIxKS4gRXZlcnkgcGF0aCB0aGF0XG4gKiBvcmlnaW5hdGVzIGZyb20gY29uZmlndXJhdGlvbiwgdGhlIGluZGV4LCBvciB0aGUgd2VidmlldyBwYXNzZXMgdGhyb3VnaCB0aGlzXG4gKiBtb2R1bGUgYmVmb3JlIGFueSBmaWxlIGlzIHJlYWQuXG4gKlxuICogUGxhdGZvcm0gaXMgYSBwYXJhbWV0ZXIgc28gdGhlIFdpbmRvd3MgcnVsZXMgY2FuIGJlIHRlc3RlZCBvbiBhbnkgbWFjaGluZS5cbiAqL1xuXG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuXG5leHBvcnQgY2xhc3MgUGF0aFNhZmV0eUVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNvZGUsIG1lc3NhZ2UpIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSAnUGF0aFNhZmV0eUVycm9yJztcbiAgICB0aGlzLmNvZGUgPSBjb2RlO1xuICB9XG59XG5cbmNvbnN0IFdJTkRPV1NfRFJJVkVfUEFUVEVSTiA9IC9eW0EtWmEtel06LztcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gcGxhdGZvcm1cbiAqIEByZXR1cm5zIHt0eXBlb2YgcGF0aC5wb3NpeCB8IHR5cGVvZiBwYXRoLndpbjMyfVxuICovXG5mdW5jdGlvbiBwYXRoQXBpKHBsYXRmb3JtKSB7XG4gIHJldHVybiBwbGF0Zm9ybSA9PT0gJ3dpbjMyJyA/IHBhdGgud2luMzIgOiBwYXRoLnBvc2l4O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICogQHBhcmFtIHtzdHJpbmd9IHBsYXRmb3JtXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplRm9yQ29tcGFyZSh2YWx1ZSwgcGxhdGZvcm0gPSBwcm9jZXNzLnBsYXRmb3JtKSB7XG4gIGNvbnN0IGFwaSA9IHBhdGhBcGkocGxhdGZvcm0pO1xuICBjb25zdCBub3JtYWxpemVkID0gYXBpLm5vcm1hbGl6ZSh2YWx1ZSk7XG4gIHJldHVybiBwbGF0Zm9ybSA9PT0gJ3dpbjMyJyA/IG5vcm1hbGl6ZWQudG9Mb3dlckNhc2UoKSA6IG5vcm1hbGl6ZWQ7XG59XG5cbi8qKlxuICogVHJ1ZSBmb3IgUE9TSVggYWJzb2x1dGUgcGF0aHMsIFdpbmRvd3MgZHJpdmUgcGF0aHMsIGFuZCBVTkMgcGF0aHMsIHJlZ2FyZGxlc3NcbiAqIG9mIHRoZSBob3N0IHBsYXRmb3JtLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0Fic29sdXRlQW55d2hlcmUodmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycgfHwgdmFsdWUubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiAoXG4gICAgV0lORE9XU19EUklWRV9QQVRURVJOLnRlc3QodmFsdWUpIHx8XG4gICAgdmFsdWUuc3RhcnRzV2l0aCgnXFxcXFxcXFwnKSB8fFxuICAgIHZhbHVlLnN0YXJ0c1dpdGgoJy8vJykgfHxcbiAgICB2YWx1ZS5zdGFydHNXaXRoKCcvJylcbiAgKTtcbn1cblxuLyoqXG4gKiBUcnVlIHdoZW4gYGNhbmRpZGF0ZWAgcmVzb2x2ZXMgdG8gdGhlIHJvb3QgaXRzZWxmIG9yIHNvbWV0aGluZyBiZW5lYXRoIGl0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSByb290XG4gKiBAcGFyYW0ge3N0cmluZ30gY2FuZGlkYXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gW3BsYXRmb3JtXVxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1BhdGhJbnNpZGUocm9vdCwgY2FuZGlkYXRlLCBwbGF0Zm9ybSA9IHByb2Nlc3MucGxhdGZvcm0pIHtcbiAgaWYgKHR5cGVvZiByb290ICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgY2FuZGlkYXRlICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAoY2FuZGlkYXRlLmluY2x1ZGVzKCdcXHUwMDAwJykpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgYXBpID0gcGF0aEFwaShwbGF0Zm9ybSk7XG4gIGNvbnN0IG5vcm1hbGl6ZWRSb290ID0gbm9ybWFsaXplRm9yQ29tcGFyZShhcGkucmVzb2x2ZShyb290KSwgcGxhdGZvcm0pO1xuICBjb25zdCBub3JtYWxpemVkQ2FuZGlkYXRlID0gbm9ybWFsaXplRm9yQ29tcGFyZShhcGkucmVzb2x2ZShjYW5kaWRhdGUpLCBwbGF0Zm9ybSk7XG4gIGlmIChub3JtYWxpemVkUm9vdCA9PT0gbm9ybWFsaXplZENhbmRpZGF0ZSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGNvbnN0IHJvb3RXaXRoU2VwYXJhdG9yID0gbm9ybWFsaXplZFJvb3QuZW5kc1dpdGgoYXBpLnNlcClcbiAgICA/IG5vcm1hbGl6ZWRSb290XG4gICAgOiBgJHtub3JtYWxpemVkUm9vdH0ke2FwaS5zZXB9YDtcbiAgcmV0dXJuIG5vcm1hbGl6ZWRDYW5kaWRhdGUuc3RhcnRzV2l0aChyb290V2l0aFNlcGFyYXRvcik7XG59XG5cbi8qKlxuICogQ29udmVydCBhbiBhYnNvbHV0ZSBwYXRoIHRvIGEgd29ya3NwYWNlLXJlbGF0aXZlLCBmb3J3YXJkLXNsYXNoIHBhdGguXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHJvb3RcbiAqIEBwYXJhbSB7c3RyaW5nfSBhYnNvbHV0ZVBhdGhcbiAqIEBwYXJhbSB7c3RyaW5nfSBbcGxhdGZvcm1dXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICogQHRocm93cyB7UGF0aFNhZmV0eUVycm9yfSB3aGVuIHRoZSBwYXRoIGVzY2FwZXMgdGhlIHdvcmtzcGFjZVxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9Xb3Jrc3BhY2VSZWxhdGl2ZShyb290LCBhYnNvbHV0ZVBhdGgsIHBsYXRmb3JtID0gcHJvY2Vzcy5wbGF0Zm9ybSkge1xuICBpZiAoIWlzUGF0aEluc2lkZShyb290LCBhYnNvbHV0ZVBhdGgsIHBsYXRmb3JtKSkge1xuICAgIHRocm93IG5ldyBQYXRoU2FmZXR5RXJyb3IoJ0VfUEFUSCcsICdQYXRoIGlzIG91dHNpZGUgdGhlIHdvcmtzcGFjZS4nKTtcbiAgfVxuICBjb25zdCBhcGkgPSBwYXRoQXBpKHBsYXRmb3JtKTtcbiAgY29uc3QgcmVsYXRpdmUgPSBhcGkucmVsYXRpdmUoYXBpLnJlc29sdmUocm9vdCksIGFwaS5yZXNvbHZlKGFic29sdXRlUGF0aCkpO1xuICByZXR1cm4gcmVsYXRpdmUuc3BsaXQoYXBpLnNlcCkuam9pbignLycpO1xufVxuXG4vKipcbiAqIFJlamVjdCByZWxhdGl2ZSBwYXRocyB0aGF0IGFyZSBhYnNvbHV0ZSwgdHJhdmVyc2luZywgb3IgdW5wcmludGFibGUuXG4gKlxuICogVXNlZCBmb3IgaW5kZXgga2V5cywgYGZpbGVJZGAgbG9va3VwcyBmcm9tIHRoZSB3ZWJ2aWV3LCBhbmQgY29uZmlndXJhdGlvblxuICogcGF0dGVybnMuIFJlamVjdHMgcmF0aGVyIHRoYW4gcmVwYWlycy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNTYWZlUmVsYXRpdmVQYXRoKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnIHx8IHZhbHVlLmxlbmd0aCA9PT0gMCB8fCB2YWx1ZS5sZW5ndGggPiAxMDI0KSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmICh2YWx1ZS5pbmNsdWRlcygnXFx1MDAwMCcpIHx8IHZhbHVlLmluY2x1ZGVzKCdcXFxcJykpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGlzQWJzb2x1dGVBbnl3aGVyZSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3Qgc2VnbWVudHMgPSB2YWx1ZS5zcGxpdCgnLycpO1xuICByZXR1cm4gc2VnbWVudHMuZXZlcnkoKHNlZ21lbnQpID0+IHNlZ21lbnQubGVuZ3RoID4gMCAmJiBzZWdtZW50ICE9PSAnLicgJiYgc2VnbWVudCAhPT0gJy4uJyk7XG59XG4iLCAiLyoqXG4gKiBDb21waWxhdGlvbi1kYXRhYmFzZSBkaXNjb3ZlcnkgYW5kIHBhcnNpbmcuXG4gKlxuICogQ29kZUZsb3cgcmVhZHMgYGNvbXBpbGVfY29tbWFuZHMuanNvbmA7IGl0IG5ldmVyIGludm9rZXMgQ01ha2UsIE1ha2UsIE5pbmphLFxuICogb3IgYSBidWlsZCBzY3JpcHQuIEEgbWlzc2luZyBvciBtYWxmb3JtZWQgZGF0YWJhc2UgZGVncmFkZXMgdG8gaGV1cmlzdGljIG1vZGVcbiAqIHJhdGhlciB0aGFuIGd1ZXNzaW5nIHRoYXQgYSBwcm9qZWN0IGlzIGNvbmZpZ3VyZWQuXG4gKi9cblxuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcblxuZXhwb3J0IGNvbnN0IENPTVBJTEVfQ09NTUFORFNfRklMRU5BTUUgPSAnY29tcGlsZV9jb21tYW5kcy5qc29uJztcbmV4cG9ydCBjb25zdCBNQVhfU0VBUkNIX0RFUFRIID0gMztcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBDb21waWxlRW50cnlcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBkaXJlY3RvcnkgICAgICBBYnNvbHV0ZSB3b3JraW5nIGRpcmVjdG9yeVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGFic29sdXRlRmlsZSAgIEFic29sdXRlIHNvdXJjZSBwYXRoXG4gKiBAcHJvcGVydHkge3N0cmluZ30gcGF0aCAgICAgICAgICAgV29ya3NwYWNlLXJlbGF0aXZlLCBmb3J3YXJkIHNsYXNoZXMgd2hlbiBpbnNpZGVcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nW119IGFyZ3VtZW50cyAgICBGdWxsIGFyZ3VtZW50IHZlY3RvciBmcm9tIHRoZSBkYXRhYmFzZVxuICogQHByb3BlcnR5IHtzdHJpbmdbXX0gZmxhZ3MgICAgICAgIEFyZ3VtZW50cyBtaW51cyBjb21waWxlci9zb3VyY2Uvb3V0cHV0XG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBDb21waWxlRGJDaG9pY2VcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBwYXRoXG4gKiBAcHJvcGVydHkge0NvbXBpbGVFbnRyeVtdfSBlbnRyaWVzXG4gKi9cblxuLyoqXG4gKiBQYXJzZSBhIGNvbXBpbGUgZGF0YWJhc2UuIEludmFsaWQgZW50cmllcyBhcmUgc2tpcHBlZCB3aXRoIGFuIGlzc3VlOyBhXG4gKiBub24tYXJyYXkgZG9jdW1lbnQgaXMgcmVqZWN0ZWQuXG4gKlxuICogQHBhcmFtIHt1bmtub3dufSBqc29uXG4gKiBAcGFyYW0ge3N0cmluZ30gd29ya3NwYWNlUm9vdFxuICogQHJldHVybnMge3tvazogdHJ1ZSwgZW50cmllczogQ29tcGlsZUVudHJ5W10sIGlzc3Vlczogc3RyaW5nW119IHwge29rOiBmYWxzZSwgY29kZTogJ0VfQ09NUElMRV9EQicsIG1lc3NhZ2U6IHN0cmluZywgaXNzdWVzPzogc3RyaW5nW119fVxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VDb21waWxlQ29tbWFuZHMoanNvbiwgd29ya3NwYWNlUm9vdCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkoanNvbikpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfQ09NUElMRV9EQicsXG4gICAgICBtZXNzYWdlOiAnY29tcGlsZV9jb21tYW5kcy5qc29uIG11c3QgY29udGFpbiBhbiBhcnJheS4nLFxuICAgIH07XG4gIH1cblxuICAvKiogQHR5cGUge0NvbXBpbGVFbnRyeVtdfSAqL1xuICBjb25zdCBlbnRyaWVzID0gW107XG4gIC8qKiBAdHlwZSB7c3RyaW5nW119ICovXG4gIGNvbnN0IGlzc3VlcyA9IFtdO1xuXG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBqc29uLmxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIGNvbnN0IHJhdyA9IGpzb25baW5kZXhdO1xuICAgIGlmICghcmF3IHx8IHR5cGVvZiByYXcgIT09ICdvYmplY3QnKSB7XG4gICAgICBpc3N1ZXMucHVzaChgZW50cmllc1ske2luZGV4fV0gaXMgbm90IGFuIG9iamVjdGApO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IHJlY29yZCA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChyYXcpO1xuICAgIGNvbnN0IGRpcmVjdG9yeSA9IHR5cGVvZiByZWNvcmQuZGlyZWN0b3J5ID09PSAnc3RyaW5nJyA/IHJlY29yZC5kaXJlY3RvcnkgOiAnJztcbiAgICBjb25zdCBmaWxlID0gdHlwZW9mIHJlY29yZC5maWxlID09PSAnc3RyaW5nJyA/IHJlY29yZC5maWxlIDogJyc7XG4gICAgaWYgKGRpcmVjdG9yeS5sZW5ndGggPT09IDAgfHwgZmlsZS5sZW5ndGggPT09IDApIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBlbnRyaWVzWyR7aW5kZXh9XSBpcyBtaXNzaW5nIGRpcmVjdG9yeSBvciBmaWxlYCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuICAgIGxldCBhcmdzID0gW107XG4gICAgaWYgKFxuICAgICAgQXJyYXkuaXNBcnJheShyZWNvcmQuYXJndW1lbnRzKSAmJlxuICAgICAgcmVjb3JkLmFyZ3VtZW50cy5ldmVyeSgoYXJnKSA9PiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJylcbiAgICApIHtcbiAgICAgIGFyZ3MgPSBbLi4ucmVjb3JkLmFyZ3VtZW50c107XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgcmVjb3JkLmNvbW1hbmQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBhcmdzID0gc3BsaXRDb21tYW5kTGluZShyZWNvcmQuY29tbWFuZCk7XG4gICAgfVxuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgaXNzdWVzLnB1c2goYGVudHJpZXNbJHtpbmRleH1dIGhhcyBuZWl0aGVyIGFyZ3VtZW50cyBub3IgYSB1c2FibGUgY29tbWFuZGApO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgYWJzb2x1dGVGaWxlID0gcGF0aC5pc0Fic29sdXRlKGZpbGUpXG4gICAgICA/IHBhdGgubm9ybWFsaXplKGZpbGUpXG4gICAgICA6IHBhdGgucmVzb2x2ZShkaXJlY3RvcnksIGZpbGUpO1xuICAgIGNvbnN0IHJlbGF0aXZlID0gcGF0aC5yZWxhdGl2ZSh3b3Jrc3BhY2VSb290LCBhYnNvbHV0ZUZpbGUpO1xuICAgIGVudHJpZXMucHVzaCh7XG4gICAgICBkaXJlY3RvcnksXG4gICAgICBhYnNvbHV0ZUZpbGUsXG4gICAgICBwYXRoOiB0b1Bvc2l4KHJlbGF0aXZlKSxcbiAgICAgIGFyZ3VtZW50czogYXJncyxcbiAgICAgIGZsYWdzOiBmbGFnc0Zyb21Bcmd1bWVudHMoYXJncywgYWJzb2x1dGVGaWxlLCBmaWxlKSxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiB7IG9rOiB0cnVlLCBlbnRyaWVzLCBpc3N1ZXMgfTtcbn1cblxuLyoqXG4gKiBUb2tlbml6ZSBhIGNvbXBpbGUgY29tbWFuZCB3aXRob3V0IGludm9raW5nIGEgc2hlbGwuIFF1b3RlcyBncm91cCB0b2tlbnM7XG4gKiBiYWNrc2xhc2hlcyBhcmUgcHJlc2VydmVkIGV4Y2VwdCBiZWZvcmUgYSBxdW90ZSwgd2hpY2gga2VlcHMgV2luZG93cyBwYXRoc1xuICogc3VjaCBhcyBgQzpcXHdvcmtcXHNyY2AgaW50YWN0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gKiBAcmV0dXJucyB7c3RyaW5nW119XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzcGxpdENvbW1hbmRMaW5lKHRleHQpIHtcbiAgLyoqIEB0eXBlIHtzdHJpbmdbXX0gKi9cbiAgY29uc3QgdG9rZW5zID0gW107XG4gIGxldCBjdXJyZW50ID0gJyc7XG4gIGxldCBxdW90ZSA9ICcnO1xuICBsZXQgc3RhcnRlZCA9IGZhbHNlO1xuXG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCB0ZXh0Lmxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIGNvbnN0IGNoYXJhY3RlciA9IHRleHRbaW5kZXhdO1xuICAgIGlmIChxdW90ZSkge1xuICAgICAgaWYgKGNoYXJhY3RlciA9PT0gcXVvdGUpIHtcbiAgICAgICAgcXVvdGUgPSAnJztcbiAgICAgIH0gZWxzZSBpZiAoY2hhcmFjdGVyID09PSAnXFxcXCcgJiYgaW5kZXggKyAxIDwgdGV4dC5sZW5ndGggJiYgdGV4dFtpbmRleCArIDFdID09PSBxdW90ZSkge1xuICAgICAgICBjdXJyZW50ICs9IHF1b3RlO1xuICAgICAgICBpbmRleCArPSAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY3VycmVudCArPSBjaGFyYWN0ZXI7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGNoYXJhY3RlciA9PT0gJ1wiJyB8fCBjaGFyYWN0ZXIgPT09IFwiJ1wiKSB7XG4gICAgICBxdW90ZSA9IGNoYXJhY3RlcjtcbiAgICAgIHN0YXJ0ZWQgPSB0cnVlO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChjaGFyYWN0ZXIgPT09ICcgJyB8fCBjaGFyYWN0ZXIgPT09ICdcXHQnIHx8IGNoYXJhY3RlciA9PT0gJ1xccicgfHwgY2hhcmFjdGVyID09PSAnXFxuJykge1xuICAgICAgaWYgKHN0YXJ0ZWQpIHtcbiAgICAgICAgdG9rZW5zLnB1c2goY3VycmVudCk7XG4gICAgICAgIGN1cnJlbnQgPSAnJztcbiAgICAgICAgc3RhcnRlZCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGN1cnJlbnQgKz0gY2hhcmFjdGVyO1xuICAgIHN0YXJ0ZWQgPSB0cnVlO1xuICB9XG4gIGlmIChzdGFydGVkKSB7XG4gICAgdG9rZW5zLnB1c2goY3VycmVudCk7XG4gIH1cbiAgcmV0dXJuIHRva2Vucztcbn1cblxuLyoqXG4gKiBLZWVwIHRoZSBmbGFncyB0aGF0IGFmZmVjdCBwYXJzaW5nIGFuZCBkcm9wIHRoZSBjb21waWxlciwgdGhlIHNvdXJjZSBmaWxlLFxuICogYW5kIG91dHB1dC9kZXBlbmRlbmN5LXByb2R1Y2luZyBvcHRpb25zLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nW119IGFyZ3NcbiAqIEBwYXJhbSB7c3RyaW5nfSBhYnNvbHV0ZUZpbGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBbc291cmNlVG9rZW5dXG4gKiBAcmV0dXJucyB7c3RyaW5nW119XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmbGFnc0Zyb21Bcmd1bWVudHMoYXJncywgYWJzb2x1dGVGaWxlLCBzb3VyY2VUb2tlbikge1xuICAvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuICBjb25zdCBmbGFncyA9IFtdO1xuICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgYXJncy5sZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICBjb25zdCBhcmcgPSBhcmdzW2luZGV4XTtcbiAgICBpZiAoaW5kZXggPT09IDApIHtcbiAgICAgIGNvbnRpbnVlOyAvLyBjb21waWxlciBleGVjdXRhYmxlXG4gICAgfVxuICAgIGlmIChhcmcgPT09IGFic29sdXRlRmlsZSB8fCBhcmcgPT09IHNvdXJjZVRva2VuIHx8IGFyZyA9PT0gcGF0aC5iYXNlbmFtZShhYnNvbHV0ZUZpbGUpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGFyZyA9PT0gJy1vJyB8fCBhcmcgPT09ICcvRm8nIHx8IGFyZyA9PT0gJy9GZScpIHtcbiAgICAgIGluZGV4ICs9IDE7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGFyZy5zdGFydHNXaXRoKCctbycpICYmIGFyZy5sZW5ndGggPiAyKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGFyZyA9PT0gJy1jJyB8fCBhcmcgPT09ICcvYycpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICAvLyBEZXBlbmRlbmN5LWZpbGUgYW5kIHJlc3BvbnNlLWZpbGUgZmxhZ3MgZGVwZW5kIG9uIHRoZSBidWlsZCBzeXN0ZW0gYW5kXG4gICAgLy8gYWRkIG5vIHN5bnRheCBpbmZvcm1hdGlvbi5cbiAgICBpZiAoYXJnID09PSAnLU1EJyB8fCBhcmcgPT09ICctTU1EJyB8fCBhcmcgPT09ICctTVAnIHx8IGFyZyA9PT0gJy1NRicpIHtcbiAgICAgIGlmIChhcmcgPT09ICctTUYnKSB7XG4gICAgICAgIGluZGV4ICs9IDE7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgZmxhZ3MucHVzaChhcmcpO1xuICB9XG4gIHJldHVybiBmbGFncztcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBmbGFnc1xuICogQHJldHVybnMge3N0cmluZ1tdfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEluY2x1ZGVQYXRocyhmbGFncykge1xuICAvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuICBjb25zdCBwYXRocyA9IFtdO1xuICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgZmxhZ3MubGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgY29uc3QgZmxhZyA9IGZsYWdzW2luZGV4XTtcbiAgICBpZiAoZmxhZyA9PT0gJy1JJyB8fCBmbGFnID09PSAnLWlzeXN0ZW0nIHx8IGZsYWcgPT09ICcvSScpIHtcbiAgICAgIGlmICh0eXBlb2YgZmxhZ3NbaW5kZXggKyAxXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcGF0aHMucHVzaChmbGFnc1tpbmRleCArIDFdKTtcbiAgICAgICAgaW5kZXggKz0gMTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoZmxhZy5zdGFydHNXaXRoKCctSScpICYmIGZsYWcubGVuZ3RoID4gMikge1xuICAgICAgcGF0aHMucHVzaChmbGFnLnNsaWNlKDIpKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHBhdGhzO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nW119IGZsYWdzXG4gKiBAcmV0dXJucyB7c3RyaW5nW119XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0RGVmaW5lcyhmbGFncykge1xuICAvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuICBjb25zdCBkZWZpbmVzID0gW107XG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBmbGFncy5sZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICBjb25zdCBmbGFnID0gZmxhZ3NbaW5kZXhdO1xuICAgIGlmIChmbGFnID09PSAnLUQnIHx8IGZsYWcgPT09ICcvRCcpIHtcbiAgICAgIGlmICh0eXBlb2YgZmxhZ3NbaW5kZXggKyAxXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgZGVmaW5lcy5wdXNoKGZsYWdzW2luZGV4ICsgMV0pO1xuICAgICAgICBpbmRleCArPSAxO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChmbGFnLnN0YXJ0c1dpdGgoJy1EJykgJiYgZmxhZy5sZW5ndGggPiAyKSB7XG4gICAgICBkZWZpbmVzLnB1c2goZmxhZy5zbGljZSgyKSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWZpbmVzO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nW119IGZsYWdzXG4gKiBAcmV0dXJucyB7c3RyaW5nfG51bGx9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0U3RhbmRhcmQoZmxhZ3MpIHtcbiAgZm9yIChjb25zdCBmbGFnIG9mIGZsYWdzKSB7XG4gICAgaWYgKGZsYWcuc3RhcnRzV2l0aCgnLXN0ZD0nKSkge1xuICAgICAgcmV0dXJuIGZsYWcuc2xpY2UoJy1zdGQ9Jy5sZW5ndGgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBIZXVyaXN0aWMgZmxhZ3MgZm9yIGEgZmlsZSB3aXRoIG5vIGNvbXBpbGUgZGF0YWJhc2UuIFRoZSBjYWxsZXIgbXVzdCBtYXJrIHRoZVxuICogcmVzdWx0aW5nIHJ1biBwYXJ0aWFsOyBzeXN0ZW0gaGVhZGVycyBhcmUgbGlrZWx5IHVucmVzb2x2ZWQuXG4gKlxuICogQHBhcmFtIHt7aW5jbHVkZVBhdGhzPzogc3RyaW5nW10sIGRlZmluZXM/OiBzdHJpbmdbXSwgc3RhbmRhcmQ/OiBzdHJpbmd9fSBbb3B0aW9uc11cbiAqIEByZXR1cm5zIHtzdHJpbmdbXX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhldXJpc3RpY0ZsYWdzKG9wdGlvbnMgPSB7fSkge1xuICAvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuICBjb25zdCBmbGFncyA9IFtdO1xuICBjb25zdCBzdGFuZGFyZCA9IG9wdGlvbnMuc3RhbmRhcmQgPz8gJ2MrKzE3JztcbiAgZmxhZ3MucHVzaChgLXN0ZD0ke3N0YW5kYXJkfWApO1xuICBmb3IgKGNvbnN0IGRlZmluZSBvZiBvcHRpb25zLmRlZmluZXMgPz8gW10pIHtcbiAgICBmbGFncy5wdXNoKGAtRCR7ZGVmaW5lfWApO1xuICB9XG4gIGZvciAoY29uc3QgaW5jbHVkZVBhdGggb2Ygb3B0aW9ucy5pbmNsdWRlUGF0aHMgPz8gW10pIHtcbiAgICBmbGFncy5wdXNoKGAtSSR7aW5jbHVkZVBhdGh9YCk7XG4gIH1cbiAgcmV0dXJuIGZsYWdzO1xufVxuXG4vKipcbiAqIERpc2NvdmVyIGNvbXBpbGUgZGF0YWJhc2VzIGluIHRoZSBkb2N1bWVudGVkIG9yZGVyLiBUaGUgc2VhcmNoIGlzIGJvdW5kZWQgdG9cbiAqIGRlcHRoIHRocmVlIGFuZCBuZXZlciBsZWF2ZXMgdGhlIHdvcmtzcGFjZS5cbiAqXG4gKiBAcGFyYW0ge3tcbiAqICAgd29ya3NwYWNlUm9vdDogc3RyaW5nLFxuICogICBjb25maWd1cmVkUGF0aD86IHN0cmluZyxcbiAqICAgcmVhZEZpbGU/OiB0eXBlb2YgZnMucmVhZEZpbGUsXG4gKiAgIHJlYWREaXI/OiB0eXBlb2YgZnMucmVhZGRpcixcbiAqIH19IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtQcm9taXNlPFxuICogICB7b2s6IHRydWUsIGNob2ljZTogQ29tcGlsZURiQ2hvaWNlLCBjYW5kaWRhdGVzOiBzdHJpbmdbXSwgaXNzdWVzOiBzdHJpbmdbXX0gfFxuICogICB7b2s6IGZhbHNlLCBjb2RlOiAnRV9DT01QSUxFX0RCJywgbWVzc2FnZTogc3RyaW5nLCBjYW5kaWRhdGVzOiBzdHJpbmdbXSwgaXNzdWVzOiBzdHJpbmdbXX1cbiAqID59XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkaXNjb3ZlckNvbXBpbGVEYihvcHRpb25zKSB7XG4gIGNvbnN0IHsgd29ya3NwYWNlUm9vdCwgY29uZmlndXJlZFBhdGggfSA9IG9wdGlvbnM7XG4gIGNvbnN0IHJlYWRGaWxlID0gb3B0aW9ucy5yZWFkRmlsZSA/PyBmcy5yZWFkRmlsZTtcbiAgY29uc3QgcmVhZERpciA9IG9wdGlvbnMucmVhZERpciA/PyBmcy5yZWFkZGlyO1xuXG4gIC8qKiBAdHlwZSB7c3RyaW5nW119ICovXG4gIGNvbnN0IGNhbmRpZGF0ZXMgPSBbXTtcbiAgaWYgKHR5cGVvZiBjb25maWd1cmVkUGF0aCA9PT0gJ3N0cmluZycgJiYgY29uZmlndXJlZFBhdGgudHJpbSgpLmxlbmd0aCA+IDApIHtcbiAgICBjYW5kaWRhdGVzLnB1c2gocGF0aC5yZXNvbHZlKHdvcmtzcGFjZVJvb3QsIGNvbmZpZ3VyZWRQYXRoLnRyaW0oKSkpO1xuICB9XG4gIGNhbmRpZGF0ZXMucHVzaChwYXRoLmpvaW4od29ya3NwYWNlUm9vdCwgQ09NUElMRV9DT01NQU5EU19GSUxFTkFNRSkpO1xuXG4gIGZvciAoY29uc3QgY2hpbGQgb2YgYXdhaXQgc2FmZVJlYWREaXIod29ya3NwYWNlUm9vdCwgcmVhZERpcikpIHtcbiAgICBpZiAoY2hpbGQuaXNEaXJlY3RvcnkoKSAmJiAvXmNtYWtlLWJ1aWxkLS8udGVzdChjaGlsZC5uYW1lKSkge1xuICAgICAgY2FuZGlkYXRlcy5wdXNoKHBhdGguam9pbih3b3Jrc3BhY2VSb290LCBjaGlsZC5uYW1lLCBDT01QSUxFX0NPTU1BTkRTX0ZJTEVOQU1FKSk7XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3QgZGlyZWN0b3J5IG9mIFsnYnVpbGQnLCAnb3V0J10pIHtcbiAgICBjYW5kaWRhdGVzLnB1c2gocGF0aC5qb2luKHdvcmtzcGFjZVJvb3QsIGRpcmVjdG9yeSwgQ09NUElMRV9DT01NQU5EU19GSUxFTkFNRSkpO1xuICB9XG4gIGZvciAoY29uc3QgZm91bmQgb2YgYXdhaXQgZmluZENvbXBpbGVDb21tYW5kcyh3b3Jrc3BhY2VSb290LCAzLCByZWFkRGlyKSkge1xuICAgIGNhbmRpZGF0ZXMucHVzaChmb3VuZCk7XG4gIH1cblxuICBjb25zdCB1bmlxdWUgPSBbLi4ubmV3IFNldChjYW5kaWRhdGVzKV07XG4gIC8qKiBAdHlwZSB7QXJyYXk8e3BhdGg6IHN0cmluZywgZW50cmllczogQ29tcGlsZUVudHJ5W119Pn0gKi9cbiAgY29uc3QgZGF0YWJhc2VzID0gW107XG4gIC8qKiBAdHlwZSB7c3RyaW5nW119ICovXG4gIGNvbnN0IGlzc3VlcyA9IFtdO1xuXG4gIGZvciAoY29uc3QgY2FuZGlkYXRlIG9mIHVuaXF1ZSkge1xuICAgIGxldCB0ZXh0O1xuICAgIHRyeSB7XG4gICAgICB0ZXh0ID0gYXdhaXQgcmVhZEZpbGUoY2FuZGlkYXRlLCAndXRmOCcpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGxldCBwYXJzZWRKc29uO1xuICAgIHRyeSB7XG4gICAgICBwYXJzZWRKc29uID0gSlNPTi5wYXJzZShTdHJpbmcodGV4dCkpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpc3N1ZXMucHVzaChgJHtjYW5kaWRhdGV9OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUNvbXBpbGVDb21tYW5kcyhwYXJzZWRKc29uLCB3b3Jrc3BhY2VSb290KTtcbiAgICBpZiAoIXBhcnNlZC5vaykge1xuICAgICAgaXNzdWVzLnB1c2goYCR7Y2FuZGlkYXRlfTogJHtwYXJzZWQubWVzc2FnZX1gKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpc3N1ZXMucHVzaCguLi5wYXJzZWQuaXNzdWVzLm1hcCgoaXNzdWUpID0+IGAke2NhbmRpZGF0ZX06ICR7aXNzdWV9YCkpO1xuICAgIGRhdGFiYXNlcy5wdXNoKHsgcGF0aDogY2FuZGlkYXRlLCBlbnRyaWVzOiBwYXJzZWQuZW50cmllcyB9KTtcbiAgfVxuXG4gIGlmIChkYXRhYmFzZXMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX0NPTVBJTEVfREInLFxuICAgICAgbWVzc2FnZTogJ05vIHJlYWRhYmxlIGNvbXBpbGVfY29tbWFuZHMuanNvbiB3YXMgZm91bmQ7IGhldXJpc3RpYyBtb2RlIGlzIHJlcXVpcmVkLicsXG4gICAgICBjYW5kaWRhdGVzOiB1bmlxdWUsXG4gICAgICBpc3N1ZXMsXG4gICAgfTtcbiAgfVxuXG4gIGRhdGFiYXNlcy5zb3J0KFxuICAgIChsZWZ0LCByaWdodCkgPT5cbiAgICAgIHJpZ2h0LmVudHJpZXMubGVuZ3RoIC0gbGVmdC5lbnRyaWVzLmxlbmd0aCB8fCBsZWZ0LnBhdGgubG9jYWxlQ29tcGFyZShyaWdodC5wYXRoKSxcbiAgKTtcbiAgcmV0dXJuIHtcbiAgICBvazogdHJ1ZSxcbiAgICBjaG9pY2U6IGRhdGFiYXNlc1swXSxcbiAgICBjYW5kaWRhdGVzOiB1bmlxdWUsXG4gICAgaXNzdWVzLFxuICB9O1xufVxuXG4vKipcbiAqIE1hdGNoIGEgZmlsZSB0byBpdHMgY29tcGlsZS1kYXRhYmFzZSBlbnRyeS4gRXhhY3QgYWJzb2x1dGUgbWF0Y2ggZmlyc3QsIHRoZW5cbiAqIGEgY2FzZS1pbnNlbnNpdGl2ZSBtYXRjaCBvbiBXaW5kb3dzIChmbGFnZ2VkIGJ5IHRoZSBjYWxsZXIgaWYgaXQgbWF0dGVycykuXG4gKlxuICogQHBhcmFtIHtDb21waWxlRW50cnlbXX0gZW50cmllc1xuICogQHBhcmFtIHtzdHJpbmd9IGFic29sdXRlRmlsZVxuICogQHBhcmFtIHtOb2RlSlMuUGxhdGZvcm19IFtwbGF0Zm9ybV1cbiAqIEByZXR1cm5zIHtDb21waWxlRW50cnkgfCBudWxsfVxuICovXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hDb21waWxlRW50cnkoZW50cmllcywgYWJzb2x1dGVGaWxlLCBwbGF0Zm9ybSA9IHByb2Nlc3MucGxhdGZvcm0pIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IHBhdGgubm9ybWFsaXplKGFic29sdXRlRmlsZSk7XG4gIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgIGlmIChwYXRoLm5vcm1hbGl6ZShlbnRyeS5hYnNvbHV0ZUZpbGUpID09PSBub3JtYWxpemVkKSB7XG4gICAgICByZXR1cm4gZW50cnk7XG4gICAgfVxuICB9XG4gIGlmIChwbGF0Zm9ybSA9PT0gJ3dpbjMyJykge1xuICAgIGNvbnN0IGxvd2VyID0gbm9ybWFsaXplZC50b0xvd2VyQ2FzZSgpO1xuICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgaWYgKHBhdGgubm9ybWFsaXplKGVudHJ5LmFic29sdXRlRmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gbG93ZXIpIHtcbiAgICAgICAgcmV0dXJuIGVudHJ5O1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gcm9vdFxuICogQHBhcmFtIHtudW1iZXJ9IG1heERlcHRoXG4gKiBAcGFyYW0ge3R5cGVvZiBmcy5yZWFkZGlyfSByZWFkRGlyXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxzdHJpbmdbXT59XG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGZpbmRDb21waWxlQ29tbWFuZHMocm9vdCwgbWF4RGVwdGgsIHJlYWREaXIpIHtcbiAgLyoqIEB0eXBlIHtzdHJpbmdbXX0gKi9cbiAgY29uc3QgZm91bmQgPSBbXTtcbiAgLyoqIEB0eXBlIHtBcnJheTx7ZGlyZWN0b3J5OiBzdHJpbmcsIGRlcHRoOiBudW1iZXJ9Pn0gKi9cbiAgY29uc3QgcXVldWUgPSBbeyBkaXJlY3Rvcnk6IHJvb3QsIGRlcHRoOiAwIH1dO1xuXG4gIHdoaWxlIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgY3VycmVudCA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgaWYgKCFjdXJyZW50KSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY29uc3QgZW50cmllcyA9IGF3YWl0IHNhZmVSZWFkRGlyKGN1cnJlbnQuZGlyZWN0b3J5LCByZWFkRGlyKTtcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgIGlmIChlbnRyeS5pc0ZpbGUoKSAmJiBlbnRyeS5uYW1lID09PSBDT01QSUxFX0NPTU1BTkRTX0ZJTEVOQU1FKSB7XG4gICAgICAgIGZvdW5kLnB1c2gocGF0aC5qb2luKGN1cnJlbnQuZGlyZWN0b3J5LCBlbnRyeS5uYW1lKSk7XG4gICAgICB9XG4gICAgICBpZiAoXG4gICAgICAgIGVudHJ5LmlzRGlyZWN0b3J5KCkgJiZcbiAgICAgICAgY3VycmVudC5kZXB0aCA8IG1heERlcHRoICYmXG4gICAgICAgICFbJ25vZGVfbW9kdWxlcycsICcuZ2l0JywgJ2Rpc3QnLCAnLmNvZGVmbG93J10uaW5jbHVkZXMoZW50cnkubmFtZSlcbiAgICAgICkge1xuICAgICAgICBxdWV1ZS5wdXNoKHtcbiAgICAgICAgICBkaXJlY3Rvcnk6IHBhdGguam9pbihjdXJyZW50LmRpcmVjdG9yeSwgZW50cnkubmFtZSksXG4gICAgICAgICAgZGVwdGg6IGN1cnJlbnQuZGVwdGggKyAxLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZvdW5kO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBkaXJlY3RvcnlcbiAqIEBwYXJhbSB7dHlwZW9mIGZzLnJlYWRkaXJ9IHJlYWREaXJcbiAqL1xuYXN5bmMgZnVuY3Rpb24gc2FmZVJlYWREaXIoZGlyZWN0b3J5LCByZWFkRGlyKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGF3YWl0IHJlYWREaXIoZGlyZWN0b3J5LCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBbXTtcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gdG9Qb3NpeCh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUuc3BsaXQocGF0aC5zZXApLmpvaW4oJy8nKTtcbn1cbiIsICIvKipcbiAqIERlY2lkZSBob3cgYSB0cmFuc2xhdGlvbiB1bml0IGlzIGNvbmZpZ3VyZWQgYW5kIGJ1aWxkIHRoZSBDbGFuZyBhcmd2LlxuICpcbiAqIFRoZSBhcmd2IGlzIGFzc2VtYmxlZCBhcyBhbiBhcnJheSBhbmQgbmV2ZXIgcGFzc2VkIHRocm91Z2ggYSBzaGVsbC4gRmxhZ3NcbiAqIHRoYXQgY2FuIGxvYWQgYSBjb21waWxlciBwbHVnaW4gb3IgYSByZXNwb25zZSBmaWxlIGFyZSBkcm9wcGVkOiBhbmFseXNpcyBtdXN0XG4gKiBub3QgYmUgYSBjb2RlLWV4ZWN1dGlvbiB2ZWN0b3IgZm9yIGEgd29ya3NwYWNlLlxuICovXG5cbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5cbmltcG9ydCB7XG4gIGV4dHJhY3REZWZpbmVzLFxuICBleHRyYWN0SW5jbHVkZVBhdGhzLFxuICBoZXVyaXN0aWNGbGFncyxcbiAgbWF0Y2hDb21waWxlRW50cnksXG59IGZyb20gJy4vY29tcGlsZURiLmpzJztcblxuLyoqXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuL2NvbXBpbGVEYi5qcycpLkNvbXBpbGVFbnRyeX0gQ29tcGlsZUVudHJ5XG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuL2NvbXBpbGVEYi5qcycpLkNvbXBpbGVEYkNob2ljZX0gQ29tcGlsZURiQ2hvaWNlXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBBbmFseXNpc0NvbmZpZ1xuICogQHByb3BlcnR5IHsnY29tcGlsZS1kYid8J2hldXJpc3RpYyd9IG1vZGVcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nW119IGZsYWdzXG4gKiBAcHJvcGVydHkge0NvbXBpbGVFbnRyeSB8IG51bGx9IGVudHJ5XG4gKiBAcHJvcGVydHkge0FycmF5PHtjb2RlOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZ30+fSB3YXJuaW5nc1xuICovXG5cbi8qKlxuICogQHBhcmFtIHt7XG4gKiAgIGFic29sdXRlRmlsZTogc3RyaW5nLFxuICogICBjb21waWxlRGI/OiBDb21waWxlRGJDaG9pY2UgfCBudWxsLFxuICogICBzZXR0aW5ncz86IHtcbiAqICAgICBpbmNsdWRlUGF0aHM/OiBzdHJpbmdbXSxcbiAqICAgICBkZWZpbmVzPzogc3RyaW5nW10sXG4gKiAgICAgc3RhbmRhcmQ/OiBzdHJpbmcsXG4gKiAgIH0sXG4gKiAgIHBsYXRmb3JtPzogTm9kZUpTLlBsYXRmb3JtLFxuICogfX0gb3B0aW9uc1xuICogQHJldHVybnMge0FuYWx5c2lzQ29uZmlnfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVjaWRlQW5hbHlzaXNDb25maWcoeyBhYnNvbHV0ZUZpbGUsIGNvbXBpbGVEYiwgc2V0dGluZ3MgPSB7fSwgcGxhdGZvcm0gfSkge1xuICBjb25zdCBlbnRyeSA9IGNvbXBpbGVEYiA/IG1hdGNoQ29tcGlsZUVudHJ5KGNvbXBpbGVEYi5lbnRyaWVzLCBhYnNvbHV0ZUZpbGUsIHBsYXRmb3JtKSA6IG51bGw7XG4gIGlmIChlbnRyeSkge1xuICAgIHJldHVybiB7XG4gICAgICBtb2RlOiAnY29tcGlsZS1kYicsXG4gICAgICBmbGFnczogWy4uLmVudHJ5LmZsYWdzXSxcbiAgICAgIGVudHJ5LFxuICAgICAgd2FybmluZ3M6IFtdLFxuICAgIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG1vZGU6ICdoZXVyaXN0aWMnLFxuICAgIGZsYWdzOiBoZXVyaXN0aWNGbGFncyh7XG4gICAgICBpbmNsdWRlUGF0aHM6IHNldHRpbmdzLmluY2x1ZGVQYXRocyA/PyBbXSxcbiAgICAgIGRlZmluZXM6IHNldHRpbmdzLmRlZmluZXMgPz8gW10sXG4gICAgICBzdGFuZGFyZDogc2V0dGluZ3Muc3RhbmRhcmQgPz8gc3RhbmRhcmRGb3JGaWxlKGFic29sdXRlRmlsZSksXG4gICAgfSksXG4gICAgZW50cnk6IG51bGwsXG4gICAgd2FybmluZ3M6IFtcbiAgICAgIHtcbiAgICAgICAgY29kZTogJ21pc3NpbmdfY29tcGlsZV9kYicsXG4gICAgICAgIG1lc3NhZ2U6XG4gICAgICAgICAgJ05vIGNvbXBpbGF0aW9uIGRhdGFiYXNlIGVudHJ5IGNvdmVycyB0aGlzIGZpbGUuIEZsYWdzIGFyZSBpbmZlcnJlZCwgc28gc3lzdGVtIGhlYWRlcnMgYW5kIG1hY3JvcyBtYXkgYmUgdW5yZXNvbHZlZC4nLFxuICAgICAgfSxcbiAgICBdLFxuICB9O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBhYnNvbHV0ZUZpbGVcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGFuZGFyZEZvckZpbGUoYWJzb2x1dGVGaWxlKSB7XG4gIHJldHVybiAvXFwuKGN8aCkkL2kudGVzdChhYnNvbHV0ZUZpbGUpID8gJ2MxMScgOiAnYysrMTcnO1xufVxuXG4vKipcbiAqIEJ1aWxkIHRoZSBDbGFuZyBhcmd1bWVudCBhcnJheSBmb3Igb25lIHRyYW5zbGF0aW9uIHVuaXQuXG4gKlxuICogQHBhcmFtIHt7XG4gKiAgIGFic29sdXRlRmlsZTogc3RyaW5nLFxuICogICBjb25maWc6IEFuYWx5c2lzQ29uZmlnLFxuICogICBleHRyYUFyZ3M/OiBzdHJpbmdbXSxcbiAqIH19IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtzdHJpbmdbXX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkQ2xhbmdBcmdzKHsgYWJzb2x1dGVGaWxlLCBjb25maWcsIGV4dHJhQXJncyA9IFtdIH0pIHtcbiAgLyoqIEB0eXBlIHtzdHJpbmdbXX0gKi9cbiAgY29uc3QgYXJncyA9IFtdO1xuICBjb25zdCBzYW5pdGl6ZWQgPSBzYW5pdGl6ZUZsYWdzKGNvbmZpZy5mbGFncyk7XG5cbiAgaWYgKCFzYW5pdGl6ZWQuc29tZSgoZmxhZykgPT4gZmxhZy5zdGFydHNXaXRoKCctc3RkPScpKSkge1xuICAgIGNvbnN0IHN0YW5kYXJkID0gc3RhbmRhcmRGb3JGaWxlKGFic29sdXRlRmlsZSk7XG4gICAgYXJncy5wdXNoKGAtc3RkPSR7c3RhbmRhcmR9YCk7XG4gIH1cbiAgYXJncy5wdXNoKCctZnN5bnRheC1vbmx5Jyk7XG4gIGFyZ3MucHVzaCguLi5leHRyYUFyZ3MpO1xuICBhcmdzLnB1c2goJy1YY2xhbmcnLCAnLWFzdC1kdW1wPWpzb24nKTtcbiAgYXJncy5wdXNoKC4uLnNhbml0aXplZCk7XG4gIGFyZ3MucHVzaChhYnNvbHV0ZUZpbGUpO1xuICByZXR1cm4gYXJncztcbn1cblxuLyoqXG4gKiBEcm9wIGZsYWdzIHRoYXQgY2FuIGV4ZWN1dGUgY29kZSBvciByZWFkIGFyYml0cmFyeSByZXNwb25zZSBmaWxlcy4gVGhpcyBpcyBhXG4gKiBjb25zZXJ2YXRpdmUgZGVueWxpc3QsIG5vdCBhIGNsYWltIHRoYXQgZXZlcnkgcmVtYWluaW5nIGZsYWcgaXMgaGFybWxlc3MuXG4gKlxuICogQHBhcmFtIHtzdHJpbmdbXX0gZmxhZ3NcbiAqIEByZXR1cm5zIHtzdHJpbmdbXX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhbml0aXplRmxhZ3MoZmxhZ3MpIHtcbiAgLyoqIEB0eXBlIHtzdHJpbmdbXX0gKi9cbiAgY29uc3Qgb3V0cHV0ID0gW107XG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBmbGFncy5sZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICBjb25zdCBmbGFnID0gZmxhZ3NbaW5kZXhdO1xuICAgIGlmICh0eXBlb2YgZmxhZyAhPT0gJ3N0cmluZycgfHwgZmxhZy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoZmxhZy5zdGFydHNXaXRoKCdAJykpIHtcbiAgICAgIGNvbnRpbnVlOyAvLyByZXNwb25zZSBmaWxlOiBjb250ZW50cyBhcmUgbm90IHZhbGlkYXRlZCBieSB0aGUgY29tcGlsZSBEQlxuICAgIH1cbiAgICBpZiAoZmxhZyA9PT0gJy1YY2xhbmcnKSB7XG4gICAgICBjb25zdCBuZXh0ID0gZmxhZ3NbaW5kZXggKyAxXTtcbiAgICAgIGlmIChuZXh0ID09PSAnLWxvYWQnIHx8IG5leHQgPT09ICctcGx1Z2luJyB8fCBuZXh0ID09PSAnLWFkZC1wbHVnaW4nKSB7XG4gICAgICAgIC8vIENvbnN1bWUgdGhlIG9wdGlvbiBhbmQgaXRzIHBhdGguIENsYW5nIGFjY2VwdHMgZWl0aGVyXG4gICAgICAgIC8vIGAtWGNsYW5nIC1sb2FkIC1YY2xhbmcgUEFUSGAgb3IgYC1YY2xhbmcgLWxvYWQgUEFUSGAuXG4gICAgICAgIGluZGV4ICs9IGZsYWdzW2luZGV4ICsgMl0gPT09ICctWGNsYW5nJyA/IDQgOiAyO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8vIE9yZGluYXJ5IC1YY2xhbmcgcGFpcnMgYXJlIHVzZWQgZm9yIEFTVCBvcHRpb25zIG91cnNlbHZlcy5cbiAgICAgIG91dHB1dC5wdXNoKGZsYWcpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChmbGFnLnN0YXJ0c1dpdGgoJy1mcGx1Z2luPScpIHx8IGZsYWcuc3RhcnRzV2l0aCgnLWxvYWQnKSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChmbGFnID09PSAnLWZwbHVnaW4nKSB7XG4gICAgICBpbmRleCArPSAxO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChmbGFnID09PSAnLW8nIHx8IGZsYWcgPT09ICcvbycgfHwgZmxhZyA9PT0gJy9GbycpIHtcbiAgICAgIGluZGV4ICs9IDE7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGZsYWcgPT09ICctTUonIHx8IGZsYWcgPT09ICctLXNlcmlhbGl6ZS1kaWFnbm9zdGljcycpIHtcbiAgICAgIGluZGV4ICs9IDE7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGZsYWcuc3RhcnRzV2l0aCgnLU1KJykpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBvdXRwdXQucHVzaChmbGFnKTtcbiAgfVxuICByZXR1cm4gb3V0cHV0O1xufVxuXG4vKipcbiAqIENvbnZlbmllbmNlIGZvciBjYWxsZXJzIHRoYXQgbmVlZCB0aGUgaW5jbHVkZSByb290cyBhbmQgZGVmaW5lcyBvZiB0aGVcbiAqIGNob3NlbiBjb25maWd1cmF0aW9uIChoZWFkZXIgbWFwcGluZyBhbmQgZGlhZ25vc3RpY3MpLlxuICpcbiAqIEBwYXJhbSB7QW5hbHlzaXNDb25maWd9IGNvbmZpZ1xuICogQHBhcmFtIHtzdHJpbmd9IHdvcmtzcGFjZVJvb3RcbiAqIEByZXR1cm5zIHt7aW5jbHVkZVBhdGhzOiBzdHJpbmdbXSwgZGVmaW5lczogc3RyaW5nW10sIHN0YW5kYXJkOiBzdHJpbmd8bnVsbH19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXNjcmliZUNvbmZpZyhjb25maWcsIHdvcmtzcGFjZVJvb3QpIHtcbiAgY29uc3QgaW5jbHVkZVBhdGhzID0gZXh0cmFjdEluY2x1ZGVQYXRocyhjb25maWcuZmxhZ3MpLm1hcCgoZW50cnkpID0+XG4gICAgcGF0aC5pc0Fic29sdXRlKGVudHJ5KSA/IHBhdGgubm9ybWFsaXplKGVudHJ5KSA6IHBhdGgucmVzb2x2ZSh3b3Jrc3BhY2VSb290LCBlbnRyeSksXG4gICk7XG4gIHJldHVybiB7XG4gICAgaW5jbHVkZVBhdGhzLFxuICAgIGRlZmluZXM6IGV4dHJhY3REZWZpbmVzKGNvbmZpZy5mbGFncyksXG4gICAgc3RhbmRhcmQ6IGNvbmZpZy5mbGFncy5maW5kKChmbGFnKSA9PiBmbGFnLnN0YXJ0c1dpdGgoJy1zdGQ9JykpPy5zbGljZSg1KSA/PyBudWxsLFxuICB9O1xufVxuIiwgIi8qKlxuICogQ2xhbmcgZGlzY292ZXJ5IGFuZCB2ZXJzaW9uIHBvbGljeS5cbiAqXG4gKiBEaXNjb3ZlcnkgbmV2ZXIgZ3Vlc3NlcyB0aGF0IGEgY29tcGlsZXIgZXhpc3RzOiBpdCBleGVjdXRlcyBgLS12ZXJzaW9uYCBhbmRcbiAqIHBhcnNlcyB0aGUgYW5zd2VyLiBBbiBpbnN0YWxsZWQgYnV0IHRvby1vbGQgQ2xhbmcgaXMgcmVwb3J0ZWQgYXMgYSB3YXJuaW5nLFxuICogbm90IGEgaGFyZCBmYWlsdXJlIFx1MjAxNCB0aGUgY2FsbGVyIGF0dGVtcHRzIGFuYWx5c2lzIGFuZCBtYXJrcyB0aGUgcnVuIHBhcnRpYWwuXG4gKi9cblxuZXhwb3J0IGNvbnN0IE1JTl9DTEFOR19NQUpPUiA9IDE1O1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IENsYW5nSW5mb1xuICogQHByb3BlcnR5IHtzdHJpbmd9IHBhdGhcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSB2ZXJzaW9uXG4gKiBAcHJvcGVydHkge251bWJlcnxudWxsfSBtYWpvclxuICogQHByb3BlcnR5IHtib29sZWFufSBjb21wYXRpYmxlXG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dFxuICogQHJldHVybnMge3t2ZXJzaW9uOiBzdHJpbmcsIG1ham9yOiBudW1iZXJ8bnVsbH18bnVsbH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQ2xhbmdWZXJzaW9uKHRleHQpIHtcbiAgaWYgKHR5cGVvZiB0ZXh0ICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnN0IG1hdGNoID0gdGV4dC5tYXRjaCgvKD86QXBwbGVcXHMrKT9jbGFuZyg/Oi1jbCk/XFxzK3ZlcnNpb25cXHMrKFxcZCspXFwuKFxcZCspKD86XFwuKFxcZCspKT8vaSk7XG4gIGlmICghbWF0Y2gpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4ge1xuICAgIHZlcnNpb246IGAke21hdGNoWzFdfS4ke21hdGNoWzJdfSR7bWF0Y2hbM10gPyBgLiR7bWF0Y2hbM119YCA6ICcnfWAsXG4gICAgbWFqb3I6IE51bWJlcihtYXRjaFsxXSksXG4gIH07XG59XG5cbi8qKlxuICogUGxhdGZvcm0tc3BlY2lmaWMgZGVmYXVsdCBjYW5kaWRhdGVzLCBpbiBwcm9iaW5nIG9yZGVyLlxuICpcbiAqIEBwYXJhbSB7Tm9kZUpTLlBsYXRmb3JtfSBbcGxhdGZvcm1dXG4gKiBAcmV0dXJucyB7c3RyaW5nW119XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWZhdWx0Q2xhbmdDYW5kaWRhdGVzKHBsYXRmb3JtID0gcHJvY2Vzcy5wbGF0Zm9ybSkge1xuICBpZiAocGxhdGZvcm0gPT09ICd3aW4zMicpIHtcbiAgICByZXR1cm4gWydjbGFuZysrLmV4ZScsICdjbGFuZy5leGUnLCAnY2xhbmctY2wuZXhlJ107XG4gIH1cbiAgcmV0dXJuIFsnY2xhbmcrKycsICdjbGFuZyddO1xufVxuXG4vKipcbiAqIFByb2JlIGEgbGlzdCBvZiBjYW5kaWRhdGVzIGFuZCByZXR1cm4gdGhlIGZpcnN0IGV4ZWN1dGFibGUgdGhhdCBhbnN3ZXJzLlxuICpcbiAqIEBwYXJhbSB7e1xuICogICBydW5Ub29sOiB0eXBlb2YgaW1wb3J0KCcuLi90b29saW5nL3J1blRvb2wuanMnKS5ydW5Ub29sLFxuICogICBjb25maWd1cmVkUGF0aD86IHN0cmluZyxcbiAqICAgY2FuZGlkYXRlcz86IHN0cmluZ1tdLFxuICogfX0gb3B0aW9uc1xuICogQHJldHVybnMge1Byb21pc2U8XG4gKiAgIHtvazogdHJ1ZSwgY2xhbmc6IENsYW5nSW5mbywgd2FybmluZz86IHtjb2RlOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZ319IHxcbiAqICAge29rOiBmYWxzZSwgY29kZTogJ0VfVU5TVVBQT1JURUQnLCBtZXNzYWdlOiBzdHJpbmd9XG4gKiA+fVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGlzY292ZXJDbGFuZyh7IHJ1blRvb2wsIGNvbmZpZ3VyZWRQYXRoLCBjYW5kaWRhdGVzIH0pIHtcbiAgY29uc3QgbGlzdCA9IFtdO1xuICBpZiAodHlwZW9mIGNvbmZpZ3VyZWRQYXRoID09PSAnc3RyaW5nJyAmJiBjb25maWd1cmVkUGF0aC50cmltKCkubGVuZ3RoID4gMCkge1xuICAgIGxpc3QucHVzaChjb25maWd1cmVkUGF0aC50cmltKCkpO1xuICB9XG4gIGZvciAoY29uc3QgY2FuZGlkYXRlIG9mIGNhbmRpZGF0ZXMgPz8gZGVmYXVsdENsYW5nQ2FuZGlkYXRlcygpKSB7XG4gICAgaWYgKHR5cGVvZiBjYW5kaWRhdGUgPT09ICdzdHJpbmcnICYmIGNhbmRpZGF0ZS5sZW5ndGggPiAwICYmICFsaXN0LmluY2x1ZGVzKGNhbmRpZGF0ZSkpIHtcbiAgICAgIGxpc3QucHVzaChjYW5kaWRhdGUpO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoY29uc3QgY29tbWFuZCBvZiBsaXN0KSB7XG4gICAgY29uc3QgcHJvYmUgPSBhd2FpdCBydW5Ub29sKHtcbiAgICAgIGNvbW1hbmQsXG4gICAgICBhcmdzOiBbJy0tdmVyc2lvbiddLFxuICAgICAgdGltZW91dE1zOiA1XzAwMCxcbiAgICAgIG1heE91dHB1dEJ5dGVzOiA2NCAqIDEwMjQsXG4gICAgfSk7XG4gICAgaWYgKCFwcm9iZS5vayB8fCBwcm9iZS5leGl0Q29kZSAhPT0gMCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlQ2xhbmdWZXJzaW9uKHByb2JlLnN0ZG91dCkgPz8gcGFyc2VDbGFuZ1ZlcnNpb24ocHJvYmUuc3RkZXJyKTtcbiAgICBpZiAoIXBhcnNlZCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IGNvbXBhdGlibGUgPSBwYXJzZWQubWFqb3IgIT09IG51bGwgJiYgcGFyc2VkLm1ham9yID49IE1JTl9DTEFOR19NQUpPUjtcbiAgICAvKiogQHR5cGUge3tvazogdHJ1ZSwgY2xhbmc6IENsYW5nSW5mbywgd2FybmluZz86IHtjb2RlOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZ319fSAqL1xuICAgIGNvbnN0IHJlc3VsdCA9IHtcbiAgICAgIG9rOiB0cnVlLFxuICAgICAgY2xhbmc6IHtcbiAgICAgICAgcGF0aDogY29tbWFuZCxcbiAgICAgICAgdmVyc2lvbjogcGFyc2VkLnZlcnNpb24sXG4gICAgICAgIG1ham9yOiBwYXJzZWQubWFqb3IsXG4gICAgICAgIGNvbXBhdGlibGUsXG4gICAgICB9LFxuICAgIH07XG4gICAgaWYgKCFjb21wYXRpYmxlKSB7XG4gICAgICByZXN1bHQud2FybmluZyA9IHtcbiAgICAgICAgY29kZTogJ3Rvb2xjaGFpbl92ZXJzaW9uX21pc21hdGNoJyxcbiAgICAgICAgbWVzc2FnZTogYENsYW5nICR7cGFyc2VkLnZlcnNpb259IGlzIG9sZGVyIHRoYW4gdGhlIHN1cHBvcnRlZCBtaW5pbXVtICR7TUlOX0NMQU5HX01BSk9SfS4gQW5hbHlzaXMgd2lsbCBiZSBwYXJ0aWFsLmAsXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvazogZmFsc2UsXG4gICAgY29kZTogJ0VfVU5TVVBQT1JURUQnLFxuICAgIG1lc3NhZ2U6XG4gICAgICAnTm8gQ2xhbmcgdG9vbGNoYWluIHdhcyBmb3VuZC4gU2V0IFwiY29kZWZsb3cuY3BwLmNsYW5nUGF0aFwiIG9yIGFkZCBjbGFuZysrIHRvIFBBVEguICcgK1xuICAgICAgJ0NvZGVGbG93IG5ldmVyIHJ1bnMgeW91ciBidWlsZCBzeXN0ZW07IHNlZSBkb2NzL0xBTkdVQUdFX0FEQVBURVJTLm1kIGZvciBzZXR1cC4nLFxuICB9O1xufVxuIiwgIi8qKlxuICogSGVhZGVyLXRvLXRyYW5zbGF0aW9uLXVuaXQgbWFwcGluZy5cbiAqXG4gKiBBIGhlYWRlciBpcyBub3QgYSBwcm9ncmFtLiBJdCBpcyBhbmFseXplZCBpbiB0aGUgY29udGV4dCBvZiBhIFRVIHRoYXRcbiAqIGluY2x1ZGVzIGl0OyB3aGVuIG5vIFRVIGRvZXMsIHRoZSBoZWFkZXIgaXMgYW5hbHl6ZWQgc3ludGFjdGljYWxseSBvbmx5IGFuZFxuICogdGhlIHJ1biBtdXN0IHNheSBzby5cbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4vY29tcGlsZURiLmpzJykuQ29tcGlsZUVudHJ5fSBDb21waWxlRW50cnlcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEluY2x1ZGVEaXJlY3RpdmVcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBuYW1lICAgVGV4dCBiZXR3ZWVuIHRoZSBkZWxpbWl0ZXJzXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IHN5c3RlbSBUcnVlIGZvciBgPC4uLj5gXG4gKiBAcHJvcGVydHkge251bWJlcn0gbGluZSAgICAwLWJhc2VkIGxpbmUgbnVtYmVyXG4gKi9cblxuLyoqXG4gKiBFeHRyYWN0IGAjaW5jbHVkZWAgZGlyZWN0aXZlcyB3aXRob3V0IHByZXByb2Nlc3NpbmcuIEFuZ2xlIGluY2x1ZGVzIGFyZVxuICogc3lzdGVtIGluY2x1ZGVzIGFuZCBhcmUgbmV2ZXIgdXNlZCB0byBjbGFpbSB3b3Jrc3BhY2Ugb3duZXJzaGlwLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gKiBAcmV0dXJucyB7SW5jbHVkZURpcmVjdGl2ZVtdfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdEluY2x1ZGVzKHRleHQpIHtcbiAgaWYgKHR5cGVvZiB0ZXh0ICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICAvKiogQHR5cGUge0luY2x1ZGVEaXJlY3RpdmVbXX0gKi9cbiAgY29uc3QgaW5jbHVkZXMgPSBbXTtcbiAgY29uc3QgcGF0dGVybiA9IC9eWyBcXHRdKiNbIFxcdF0qaW5jbHVkZVsgXFx0XSooWzxcIl0pKFtePlwiXSspWz5cIl0vZ207XG4gIGZvciAoY29uc3QgbWF0Y2ggb2YgdGV4dC5tYXRjaEFsbChwYXR0ZXJuKSkge1xuICAgIGNvbnN0IGJlZm9yZSA9IHRleHQuc2xpY2UoMCwgbWF0Y2guaW5kZXggPz8gMCk7XG4gICAgY29uc3QgbGluZSA9IGJlZm9yZS5zcGxpdCgnXFxuJykubGVuZ3RoIC0gMTtcbiAgICBpbmNsdWRlcy5wdXNoKHtcbiAgICAgIG5hbWU6IG1hdGNoWzJdLnRyaW0oKSxcbiAgICAgIHN5c3RlbTogbWF0Y2hbMV0gPT09ICc8JyxcbiAgICAgIGxpbmUsXG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIGluY2x1ZGVzO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlUGF0aFxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0hlYWRlclBhdGgoZmlsZVBhdGgpIHtcbiAgcmV0dXJuIC9cXC4oaHxoaHxocHB8aHh4fGlwcCkkL2kudGVzdChTdHJpbmcoZmlsZVBhdGgpKTtcbn1cblxuLyoqXG4gKiBDaG9vc2Ugb25lIHJlcHJlc2VudGF0aXZlIFRVIGZvciBhIGhlYWRlci4gUXVvdGVkIGluY2x1ZGVzIGFyZSBtYXRjaGVkIGJ5XG4gKiBiYXNlbmFtZSBhbmQgYnkgdGhlIHBhdGggcmVsYXRpdmUgdG8gdGhlIFRVJ3MgZGlyZWN0b3J5LiBUaGUgY2hvaWNlIGlzXG4gKiBkZXRlcm1pbmlzdGljOiBleGFjdCBkaXJlY3RvcnkgbWF0Y2hlcyB3aW4sIHRoZW4gbGV4aWNvZ3JhcGhpYyBwYXRoIG9yZGVyLlxuICpcbiAqIEBwYXJhbSB7e1xuICogICBoZWFkZXJQYXRoOiBzdHJpbmcsXG4gKiAgIGVudHJpZXM6IENvbXBpbGVFbnRyeVtdLFxuICogICBpbmNsdWRlc0J5VHU6IFJlY29yZDxzdHJpbmcsIEluY2x1ZGVEaXJlY3RpdmVbXT4sXG4gKiB9fSBvcHRpb25zXG4gKiBAcmV0dXJucyB7e3R1OiBDb21waWxlRW50cnksIGNhbmRpZGF0ZXM6IHN0cmluZ1tdLCByZWFzb246ICdzYW1lX2RpcmVjdG9yeSd8J2Jhc2VuYW1lJ318bnVsbH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdFJlcHJlc2VudGF0aXZlVHUoeyBoZWFkZXJQYXRoLCBlbnRyaWVzLCBpbmNsdWRlc0J5VHUgfSkge1xuICBjb25zdCBub3JtYWxpemVkSGVhZGVyID0gdG9Qb3NpeChoZWFkZXJQYXRoKTtcbiAgY29uc3QgaGVhZGVyTmFtZSA9IGJhc2VuYW1lKG5vcm1hbGl6ZWRIZWFkZXIpO1xuICAvKiogQHR5cGUge0FycmF5PHtlbnRyeTogQ29tcGlsZUVudHJ5LCByZWFzb246ICdzYW1lX2RpcmVjdG9yeSd8J2Jhc2VuYW1lJ30+fSAqL1xuICBjb25zdCBtYXRjaGVzID0gW107XG5cbiAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgY29uc3QgaW5jbHVkZXMgPSBpbmNsdWRlc0J5VHVbZW50cnkucGF0aF0gPz8gW107XG4gICAgZm9yIChjb25zdCBpbmNsdWRlIG9mIGluY2x1ZGVzKSB7XG4gICAgICBpZiAoaW5jbHVkZS5zeXN0ZW0pIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBpbmNsdWRlTmFtZSA9IHRvUG9zaXgoaW5jbHVkZS5uYW1lKTtcbiAgICAgIGNvbnN0IHR1RGlyZWN0b3J5ID0gZGlybmFtZSh0b1Bvc2l4KGVudHJ5LnBhdGgpKTtcbiAgICAgIGNvbnN0IHJlc29sdmVkUmVsYXRpdmUgPSBub3JtYWxpemUoYCR7dHVEaXJlY3Rvcnl9LyR7aW5jbHVkZU5hbWV9YCk7XG4gICAgICBpZiAocmVzb2x2ZWRSZWxhdGl2ZSA9PT0gbm9ybWFsaXplZEhlYWRlcikge1xuICAgICAgICBtYXRjaGVzLnB1c2goeyBlbnRyeSwgcmVhc29uOiAnc2FtZV9kaXJlY3RvcnknIH0pO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmIChiYXNlbmFtZShpbmNsdWRlTmFtZSkgPT09IGhlYWRlck5hbWUpIHtcbiAgICAgICAgbWF0Y2hlcy5wdXNoKHsgZW50cnksIHJlYXNvbjogJ2Jhc2VuYW1lJyB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKG1hdGNoZXMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgbWF0Y2hlcy5zb3J0KFxuICAgIChsZWZ0LCByaWdodCkgPT5cbiAgICAgIChsZWZ0LnJlYXNvbiA9PT0gcmlnaHQucmVhc29uID8gMCA6IGxlZnQucmVhc29uID09PSAnc2FtZV9kaXJlY3RvcnknID8gLTEgOiAxKSB8fFxuICAgICAgbGVmdC5lbnRyeS5wYXRoLmxvY2FsZUNvbXBhcmUocmlnaHQuZW50cnkucGF0aCksXG4gICk7XG4gIGNvbnN0IGJlc3QgPSBtYXRjaGVzWzBdO1xuICByZXR1cm4ge1xuICAgIHR1OiBiZXN0LmVudHJ5LFxuICAgIGNhbmRpZGF0ZXM6IG1hdGNoZXMubWFwKChtYXRjaCkgPT4gbWF0Y2guZW50cnkucGF0aCksXG4gICAgcmVhc29uOiBiZXN0LnJlYXNvbixcbiAgfTtcbn1cblxuLyoqXG4gKiBCdWlsZCB0aGUgY29tcGxldGUgbWFwIGZvciBhIHNldCBvZiBoZWFkZXJzLlxuICpcbiAqIEBwYXJhbSB7e1xuICogICBoZWFkZXJQYXRoczogc3RyaW5nW10sXG4gKiAgIGVudHJpZXM6IENvbXBpbGVFbnRyeVtdLFxuICogICBpbmNsdWRlc0J5VHU6IFJlY29yZDxzdHJpbmcsIEluY2x1ZGVEaXJlY3RpdmVbXT4sXG4gKiB9fSBvcHRpb25zXG4gKiBAcmV0dXJucyB7e1xuICogICBtYXA6IFJlY29yZDxzdHJpbmcsIHt0dVBhdGg6IHN0cmluZywgY2FuZGlkYXRlczogc3RyaW5nW10sIHJlYXNvbjogc3RyaW5nfT4sXG4gKiAgIHVubWFwcGVkOiBzdHJpbmdbXSxcbiAqIH19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEhlYWRlck1hcCh7IGhlYWRlclBhdGhzLCBlbnRyaWVzLCBpbmNsdWRlc0J5VHUgfSkge1xuICAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHt0dVBhdGg6IHN0cmluZywgY2FuZGlkYXRlczogc3RyaW5nW10sIHJlYXNvbjogc3RyaW5nfT59ICovXG4gIGNvbnN0IG1hcCA9IHt9O1xuICAvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuICBjb25zdCB1bm1hcHBlZCA9IFtdO1xuXG4gIGZvciAoY29uc3QgaGVhZGVyUGF0aCBvZiBbLi4uaGVhZGVyUGF0aHNdLnNvcnQoKSkge1xuICAgIGNvbnN0IHNlbGVjdGVkID0gc2VsZWN0UmVwcmVzZW50YXRpdmVUdSh7IGhlYWRlclBhdGgsIGVudHJpZXMsIGluY2x1ZGVzQnlUdSB9KTtcbiAgICBpZiAoIXNlbGVjdGVkKSB7XG4gICAgICB1bm1hcHBlZC5wdXNoKGhlYWRlclBhdGgpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIG1hcFtoZWFkZXJQYXRoXSA9IHtcbiAgICAgIHR1UGF0aDogc2VsZWN0ZWQudHUucGF0aCxcbiAgICAgIGNhbmRpZGF0ZXM6IHNlbGVjdGVkLmNhbmRpZGF0ZXMsXG4gICAgICByZWFzb246IHNlbGVjdGVkLnJlYXNvbixcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHsgbWFwLCB1bm1hcHBlZCB9O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gdG9Qb3NpeCh2YWx1ZSkge1xuICByZXR1cm4gU3RyaW5nKHZhbHVlKS5yZXBsYWNlKC9cXFxcL2csICcvJyk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBiYXNlbmFtZSh2YWx1ZSkge1xuICBjb25zdCBwYXJ0cyA9IHZhbHVlLnNwbGl0KCcvJyk7XG4gIHJldHVybiBwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGRpcm5hbWUodmFsdWUpIHtcbiAgY29uc3QgaW5kZXggPSB2YWx1ZS5sYXN0SW5kZXhPZignLycpO1xuICByZXR1cm4gaW5kZXggPT09IC0xID8gJycgOiB2YWx1ZS5zbGljZSgwLCBpbmRleCk7XG59XG5cbi8qKlxuICogUmVzb2x2ZSBgLmAgYW5kIGAuLmAgc2VnbWVudHMgaW4gYSBQT1NJWCBwYXRoIHdpdGhvdXQgdG91Y2hpbmcgdGhlIGZpbGVcbiAqIHN5c3RlbS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZSh2YWx1ZSkge1xuICAvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuICBjb25zdCBvdXRwdXQgPSBbXTtcbiAgZm9yIChjb25zdCBzZWdtZW50IG9mIHZhbHVlLnNwbGl0KCcvJykpIHtcbiAgICBpZiAoc2VnbWVudCA9PT0gJycgfHwgc2VnbWVudCA9PT0gJy4nKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKHNlZ21lbnQgPT09ICcuLicpIHtcbiAgICAgIG91dHB1dC5wb3AoKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBvdXRwdXQucHVzaChzZWdtZW50KTtcbiAgfVxuICByZXR1cm4gb3V0cHV0LmpvaW4oJy8nKTtcbn1cbiIsICIvKipcbiAqIFNhZmUgcHJvY2VzcyBleGVjdXRpb24uXG4gKlxuICogVGhpcyBpcyB0aGUgb25seSBtb2R1bGUgYWxsb3dlZCB0byBzcGF3biBhIGNoaWxkIHByb2Nlc3MgZm9yIGFuYWx5c2lzLiBFdmVyeVxuICogY2FsbCB1c2VzIGFuIGFyZ3VtZW50IGFycmF5IChuZXZlciBhIHNoZWxsIHN0cmluZyksIGEgZml4ZWQgd29ya2luZ1xuICogZGlyZWN0b3J5LCBhbiBleHBsaWNpdCBlbnZpcm9ubWVudCBhbGxvd2xpc3QsIGEgaGFyZCB0aW1lb3V0LCBhbiBvdXRwdXQgY2FwLFxuICogYW5kIGNvb3BlcmF0aXZlIGNhbmNlbGxhdGlvbi4gQSBraWxsZWQgY2hpbGQgaXMga2lsbGVkIGFzIGEgdHJlZSBzbyBhXG4gKiBjb21waWxlcidzIHN1YnByb2Nlc3NlcyBjYW5ub3Qgb3V0bGl2ZSB0aGUgcmVxdWVzdC5cbiAqXG4gKiBUaGUgZnVuY3Rpb24gcmV0dXJucyBhIHJlc3VsdCBvYmplY3Q7IGl0IG5ldmVyIHJlamVjdHMuIENhbGxlcnMgZGVjaWRlXG4gKiB3aGV0aGVyIGEgbm9uLXplcm8gZXhpdCBpcyBmYXRhbCAoY2xhbmcgZXhpdHMgbm9uLXplcm8gb24gcGFyc2UgZXJyb3JzIGJ1dFxuICogbWF5IHN0aWxsIGVtaXQgYSB1c2FibGUgQVNUKS5cbiAqL1xuXG5pbXBvcnQgeyBzcGF3biB9IGZyb20gJ25vZGU6Y2hpbGRfcHJvY2Vzcyc7XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1RJTUVPVVRfTVMgPSA2MF8wMDA7XG5leHBvcnQgY29uc3QgREVGQVVMVF9NQVhfT1VUUFVUX0JZVEVTID0gNjQgKiAxMDI0ICogMTAyNDtcblxuLyoqXG4gKiBFbnZpcm9ubWVudCB2YXJpYWJsZXMgYSB0b29sIG1heSBpbmhlcml0LiBFdmVyeXRoaW5nIGVsc2UgaXMgZHJvcHBlZCBzbyBhXG4gKiB3b3Jrc3BhY2UgY2Fubm90IGluZmx1ZW5jZSBhbmFseXNpcyB0aHJvdWdoIHVucmVsYXRlZCBlbnZpcm9ubWVudCBzdGF0ZS5cbiAqL1xuY29uc3QgRU5WX0FMTE9XTElTVCA9IE9iamVjdC5mcmVlemUoW1xuICAnUEFUSCcsXG4gICdQYXRoJyxcbiAgJ1BBVEhFWFQnLFxuICAnU3lzdGVtUm9vdCcsXG4gICdTWVNURU1ST09UJyxcbiAgJ1dJTkRJUicsXG4gICdURU1QJyxcbiAgJ1RNUCcsXG4gICdIT01FJyxcbiAgJ1VTRVJQUk9GSUxFJyxcbiAgJ0xPQ0FMQVBQREFUQScsXG4gICdQUk9HUkFNREFUQScsXG4gICdQUk9HUkFNRklMRVMnLFxuICAnUFJPR1JBTUZJTEVTKFg4NiknLFxuICAnSU5DTFVERScsXG4gICdMSUInLFxuICAnTElCUEFUSCcsXG4gICdMQU5HJyxcbiAgJ0xDX0FMTCcsXG5dKTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBSdW5Ub29sT3B0aW9uc1xuICogQHByb3BlcnR5IHtzdHJpbmd9IGNvbW1hbmRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nW119IFthcmdzXVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtjd2RdXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3RpbWVvdXRNc11cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbbWF4T3V0cHV0Qnl0ZXNdXG4gKiBAcHJvcGVydHkge0Fib3J0U2lnbmFsfSBbc2lnbmFsXVxuICogQHByb3BlcnR5IHtSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+fSBbZW52XSBFeHRyYSBhbGxvd2xpc3RlZCB2YWx1ZXMgZm9yIHRlc3RzXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBSdW5Ub29sU3VjY2Vzc1xuICogQHByb3BlcnR5IHt0cnVlfSBva1xuICogQHByb3BlcnR5IHtzdHJpbmd9IHN0ZG91dFxuICogQHByb3BlcnR5IHtzdHJpbmd9IHN0ZGVyclxuICogQHByb3BlcnR5IHtudW1iZXJ8bnVsbH0gZXhpdENvZGVcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfG51bGx9IHNpZ25hbFxuICogQHByb3BlcnR5IHtudW1iZXJ9IGR1cmF0aW9uTXNcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFJ1blRvb2xGYWlsdXJlXG4gKiBAcHJvcGVydHkge2ZhbHNlfSBva1xuICogQHByb3BlcnR5IHsnRV9UT09MX05PVF9GT1VORCd8J0VfVE9PTF9USU1FT1VUJ3wnRV9UT09MX0xJTUlUJ3wnRV9UT09MX0VSUk9SJ3wnRV9DQU5DRUxMRUQnfSBjb2RlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbWVzc2FnZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtzdGRvdXRdXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3N0ZGVycl1cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbZHVyYXRpb25Nc11cbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7UnVuVG9vbE9wdGlvbnN9IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtQcm9taXNlPFJ1blRvb2xTdWNjZXNzIHwgUnVuVG9vbEZhaWx1cmU+fVxuICovXG5leHBvcnQgZnVuY3Rpb24gcnVuVG9vbChvcHRpb25zKSB7XG4gIGNvbnN0IHtcbiAgICBjb21tYW5kLFxuICAgIGFyZ3MgPSBbXSxcbiAgICBjd2QsXG4gICAgdGltZW91dE1zID0gREVGQVVMVF9USU1FT1VUX01TLFxuICAgIG1heE91dHB1dEJ5dGVzID0gREVGQVVMVF9NQVhfT1VUUFVUX0JZVEVTLFxuICAgIHNpZ25hbCxcbiAgICBlbnYsXG4gIH0gPSBvcHRpb25zID8/IHt9O1xuXG4gIGlmICh0eXBlb2YgY29tbWFuZCAhPT0gJ3N0cmluZycgfHwgY29tbWFuZC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX1RPT0xfRVJST1InLFxuICAgICAgbWVzc2FnZTogJ3J1blRvb2wgcmVxdWlyZXMgYSBub24tZW1wdHkgY29tbWFuZC4nLFxuICAgIH0pO1xuICB9XG4gIGlmICghQXJyYXkuaXNBcnJheShhcmdzKSB8fCBhcmdzLnNvbWUoKGFyZykgPT4gdHlwZW9mIGFyZyAhPT0gJ3N0cmluZycpKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9UT09MX0VSUk9SJyxcbiAgICAgIG1lc3NhZ2U6ICdydW5Ub29sIGFyZ3MgbXVzdCBiZSBhbiBhcnJheSBvZiBzdHJpbmdzLicsXG4gICAgfSk7XG4gIH1cbiAgaWYgKCFOdW1iZXIuaXNGaW5pdGUodGltZW91dE1zKSB8fCB0aW1lb3V0TXMgPD0gMCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfVE9PTF9FUlJPUicsXG4gICAgICBtZXNzYWdlOiAncnVuVG9vbCB0aW1lb3V0TXMgbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlci4nLFxuICAgIH0pO1xuICB9XG4gIGlmICghTnVtYmVyLmlzRmluaXRlKG1heE91dHB1dEJ5dGVzKSB8fCBtYXhPdXRwdXRCeXRlcyA8PSAwKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9UT09MX0VSUk9SJyxcbiAgICAgIG1lc3NhZ2U6ICdydW5Ub29sIG1heE91dHB1dEJ5dGVzIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXIuJyxcbiAgICB9KTtcbiAgfVxuICBpZiAoc2lnbmFsPy5hYm9ydGVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9DQU5DRUxMRUQnLFxuICAgICAgbWVzc2FnZTogJ1Rvb2wgZXhlY3V0aW9uIHdhcyBjYW5jZWxsZWQgYmVmb3JlIGl0IHN0YXJ0ZWQuJyxcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIGNvbnN0IHN0YXJ0ZWRBdCA9IERhdGUubm93KCk7XG4gICAgLyoqIEB0eXBlIHtCdWZmZXJbXX0gKi9cbiAgICBjb25zdCBzdGRvdXRDaHVua3MgPSBbXTtcbiAgICAvKiogQHR5cGUge0J1ZmZlcltdfSAqL1xuICAgIGNvbnN0IHN0ZGVyckNodW5rcyA9IFtdO1xuICAgIGxldCBzdGRvdXRCeXRlcyA9IDA7XG4gICAgbGV0IHN0ZGVyckJ5dGVzID0gMDtcbiAgICBsZXQgc2V0dGxlZCA9IGZhbHNlO1xuICAgIC8qKiBAdHlwZSB7e2hhbmRsZT86IE5vZGVKUy5UaW1lb3V0fX0gKi9cbiAgICBjb25zdCB0aW1lcnMgPSB7fTtcblxuICAgIC8qKiBAcGFyYW0ge1J1blRvb2xTdWNjZXNzIHwgUnVuVG9vbEZhaWx1cmV9IHJlc3VsdCAqL1xuICAgIGNvbnN0IGZpbmlzaCA9IChyZXN1bHQpID0+IHtcbiAgICAgIGlmIChzZXR0bGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHNldHRsZWQgPSB0cnVlO1xuICAgICAgaWYgKHRpbWVycy5oYW5kbGUpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVycy5oYW5kbGUpO1xuICAgICAgfVxuICAgICAgaWYgKHNpZ25hbCkge1xuICAgICAgICBzaWduYWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBvbkFib3J0KTtcbiAgICAgIH1cbiAgICAgIHJlc29sdmUoeyAuLi5yZXN1bHQsIGR1cmF0aW9uTXM6IHJlc3VsdC5kdXJhdGlvbk1zID8/IERhdGUubm93KCkgLSBzdGFydGVkQXQgfSk7XG4gICAgfTtcblxuICAgIC8qKiBAdHlwZSB7aW1wb3J0KCdub2RlOmNoaWxkX3Byb2Nlc3MnKS5DaGlsZFByb2Nlc3N9ICovXG4gICAgbGV0IGNoaWxkO1xuICAgIHRyeSB7XG4gICAgICBjaGlsZCA9IHNwYXduKGNvbW1hbmQsIGFyZ3MsIHtcbiAgICAgICAgY3dkLFxuICAgICAgICBzaGVsbDogZmFsc2UsXG4gICAgICAgIHdpbmRvd3NIaWRlOiB0cnVlLFxuICAgICAgICBkZXRhY2hlZDogcHJvY2Vzcy5wbGF0Zm9ybSAhPT0gJ3dpbjMyJyxcbiAgICAgICAgc3RkaW86IFsnaWdub3JlJywgJ3BpcGUnLCAncGlwZSddLFxuICAgICAgICBlbnY6IGJ1aWxkRW52aXJvbm1lbnQoZW52KSxcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBmaW5pc2goe1xuICAgICAgICBvazogZmFsc2UsXG4gICAgICAgIGNvZGU6ICdFX1RPT0xfRVJST1InLFxuICAgICAgICBtZXNzYWdlOiBgQ291bGQgbm90IHN0YXJ0IFwiJHtjb21tYW5kfVwiOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgb25BYm9ydCA9ICgpID0+IHtcbiAgICAgIGtpbGxUcmVlKGNoaWxkKTtcbiAgICAgIGZpbmlzaCh7XG4gICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgY29kZTogJ0VfQ0FOQ0VMTEVEJyxcbiAgICAgICAgbWVzc2FnZTogJ1Rvb2wgZXhlY3V0aW9uIHdhcyBjYW5jZWxsZWQuJyxcbiAgICAgICAgc3Rkb3V0OiBCdWZmZXIuY29uY2F0KHN0ZG91dENodW5rcykudG9TdHJpbmcoJ3V0ZjgnKSxcbiAgICAgICAgc3RkZXJyOiBCdWZmZXIuY29uY2F0KHN0ZGVyckNodW5rcykudG9TdHJpbmcoJ3V0ZjgnKSxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgc2lnbmFsPy5hZGRFdmVudExpc3RlbmVyKCdhYm9ydCcsIG9uQWJvcnQsIHsgb25jZTogdHJ1ZSB9KTtcblxuICAgIHRpbWVycy5oYW5kbGUgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGtpbGxUcmVlKGNoaWxkKTtcbiAgICAgIGZpbmlzaCh7XG4gICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgY29kZTogJ0VfVE9PTF9USU1FT1VUJyxcbiAgICAgICAgbWVzc2FnZTogYFRvb2wgXCIke2NvbW1hbmR9XCIgZXhjZWVkZWQgdGhlICR7dGltZW91dE1zfSBtcyBidWRnZXQuYCxcbiAgICAgICAgc3Rkb3V0OiBCdWZmZXIuY29uY2F0KHN0ZG91dENodW5rcykudG9TdHJpbmcoJ3V0ZjgnKSxcbiAgICAgICAgc3RkZXJyOiBCdWZmZXIuY29uY2F0KHN0ZGVyckNodW5rcykudG9TdHJpbmcoJ3V0ZjgnKSxcbiAgICAgIH0pO1xuICAgIH0sIHRpbWVvdXRNcyk7XG4gICAgLy8gVGltZXJzIG11c3Qgbm90IGtlZXAgdGhlIGV4dGVuc2lvbiBob3N0IGFsaXZlIG9uIHRoZWlyIG93bi5cbiAgICB0aW1lcnMuaGFuZGxlLnVucmVmPy4oKTtcblxuICAgIGNoaWxkLnN0ZG91dD8ub24oJ2RhdGEnLCAoY2h1bmspID0+IHtcbiAgICAgIGlmIChzZXR0bGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHN0ZG91dEJ5dGVzICs9IGNodW5rLmxlbmd0aDtcbiAgICAgIGlmIChzdGRvdXRCeXRlcyA+IG1heE91dHB1dEJ5dGVzKSB7XG4gICAgICAgIGtpbGxUcmVlKGNoaWxkKTtcbiAgICAgICAgZmluaXNoKHtcbiAgICAgICAgICBvazogZmFsc2UsXG4gICAgICAgICAgY29kZTogJ0VfVE9PTF9MSU1JVCcsXG4gICAgICAgICAgbWVzc2FnZTogYFRvb2wgXCIke2NvbW1hbmR9XCIgZXhjZWVkZWQgdGhlICR7bWF4T3V0cHV0Qnl0ZXN9LWJ5dGUgb3V0cHV0IGNhcC5gLFxuICAgICAgICAgIHN0ZG91dDogQnVmZmVyLmNvbmNhdChzdGRvdXRDaHVua3MpLnRvU3RyaW5nKCd1dGY4JyksXG4gICAgICAgICAgc3RkZXJyOiBCdWZmZXIuY29uY2F0KHN0ZGVyckNodW5rcykudG9TdHJpbmcoJ3V0ZjgnKSxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHN0ZG91dENodW5rcy5wdXNoKGNodW5rKTtcbiAgICB9KTtcblxuICAgIGNoaWxkLnN0ZGVycj8ub24oJ2RhdGEnLCAoY2h1bmspID0+IHtcbiAgICAgIGlmIChzZXR0bGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHN0ZGVyckJ5dGVzICs9IGNodW5rLmxlbmd0aDtcbiAgICAgIC8vIHN0ZGVyciBpcyBkaWFnbm9zdGljIHRleHQsIG5vdCB0aGUgcGF5bG9hZDsgY2FwIGl0IHNlcGFyYXRlbHkgc28gYVxuICAgICAgLy8gbm9pc3kgY29tcGlsZXIgY2Fubm90IGV4aGF1c3QgbWVtb3J5IHRocm91Z2ggd2FybmluZ3MgYWxvbmUuXG4gICAgICBpZiAoc3RkZXJyQnl0ZXMgPiBtYXhPdXRwdXRCeXRlcykge1xuICAgICAgICBraWxsVHJlZShjaGlsZCk7XG4gICAgICAgIGZpbmlzaCh7XG4gICAgICAgICAgb2s6IGZhbHNlLFxuICAgICAgICAgIGNvZGU6ICdFX1RPT0xfTElNSVQnLFxuICAgICAgICAgIG1lc3NhZ2U6IGBUb29sIFwiJHtjb21tYW5kfVwiIGV4Y2VlZGVkIHRoZSAke21heE91dHB1dEJ5dGVzfS1ieXRlIHN0ZGVyciBjYXAuYCxcbiAgICAgICAgICBzdGRvdXQ6IEJ1ZmZlci5jb25jYXQoc3Rkb3V0Q2h1bmtzKS50b1N0cmluZygndXRmOCcpLFxuICAgICAgICAgIHN0ZGVycjogQnVmZmVyLmNvbmNhdChzdGRlcnJDaHVua3MpLnRvU3RyaW5nKCd1dGY4JyksXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBzdGRlcnJDaHVua3MucHVzaChjaHVuayk7XG4gICAgfSk7XG5cbiAgICBjaGlsZC5vbignZXJyb3InLCAoZXJyb3IpID0+IHtcbiAgICAgIGNvbnN0IG5vdEZvdW5kID1cbiAgICAgICAgLyoqIEB0eXBlIHt7Y29kZT86IHN0cmluZ319ICovIChlcnJvcikuY29kZSA9PT0gJ0VOT0VOVCdcbiAgICAgICAgICA/ICdFX1RPT0xfTk9UX0ZPVU5EJ1xuICAgICAgICAgIDogJ0VfVE9PTF9FUlJPUic7XG4gICAgICBmaW5pc2goe1xuICAgICAgICBvazogZmFsc2UsXG4gICAgICAgIGNvZGU6IG5vdEZvdW5kLFxuICAgICAgICBtZXNzYWdlOlxuICAgICAgICAgIG5vdEZvdW5kID09PSAnRV9UT09MX05PVF9GT1VORCdcbiAgICAgICAgICAgID8gYFRvb2wgXCIke2NvbW1hbmR9XCIgd2FzIG5vdCBmb3VuZC5gXG4gICAgICAgICAgICA6IGBUb29sIFwiJHtjb21tYW5kfVwiIGZhaWxlZCB0byBzdGFydDogJHtlcnJvci5tZXNzYWdlfWAsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGNoaWxkLm9uKCdjbG9zZScsIChleGl0Q29kZSwgZXhpdFNpZ25hbCkgPT4ge1xuICAgICAgZmluaXNoKHtcbiAgICAgICAgb2s6IHRydWUsXG4gICAgICAgIHN0ZG91dDogQnVmZmVyLmNvbmNhdChzdGRvdXRDaHVua3MpLnRvU3RyaW5nKCd1dGY4JyksXG4gICAgICAgIHN0ZGVycjogQnVmZmVyLmNvbmNhdChzdGRlcnJDaHVua3MpLnRvU3RyaW5nKCd1dGY4JyksXG4gICAgICAgIGV4aXRDb2RlLFxuICAgICAgICBzaWduYWw6IGV4aXRTaWduYWwsXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+fSBbZXh0cmFdXG4gKiBAcmV0dXJucyB7UmVjb3JkPHN0cmluZywgc3RyaW5nPn1cbiAqL1xuZnVuY3Rpb24gYnVpbGRFbnZpcm9ubWVudChleHRyYSkge1xuICAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHN0cmluZz59ICovXG4gIGNvbnN0IGVudiA9IHt9O1xuICBmb3IgKGNvbnN0IGtleSBvZiBFTlZfQUxMT1dMSVNUKSB7XG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzLmVudltrZXldID09PSAnc3RyaW5nJykge1xuICAgICAgZW52W2tleV0gPSBwcm9jZXNzLmVudltrZXldO1xuICAgIH1cbiAgfVxuICBpZiAoZXh0cmEpIHtcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhleHRyYSkpIHtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGVudltrZXldID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBlbnY7XG59XG5cbi8qKlxuICogS2lsbCBhIGNoaWxkIGFuZCBpdHMgZGVzY2VuZGFudHMuIE9uIFdpbmRvd3MsIGB0YXNra2lsbCAvVGAgaXMgdGhlIG9ubHlcbiAqIHJlbGlhYmxlIHdheSB0byByZWFjaCBncmFuZGNoaWxkcmVuLiBPbiBQT1NJWCB0aGUgY2hpbGQgaXMgYSBwcm9jZXNzLWdyb3VwXG4gKiBsZWFkZXIsIHNvIGEgbmVnYXRpdmUgcGlkIHJlYWNoZXMgdGhlIGdyb3VwLlxuICpcbiAqIEBwYXJhbSB7aW1wb3J0KCdub2RlOmNoaWxkX3Byb2Nlc3MnKS5DaGlsZFByb2Nlc3N9IGNoaWxkXG4gKi9cbmZ1bmN0aW9uIGtpbGxUcmVlKGNoaWxkKSB7XG4gIGlmICghY2hpbGQgfHwgY2hpbGQua2lsbGVkIHx8IHR5cGVvZiBjaGlsZC5waWQgIT09ICdudW1iZXInKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG4gICAgdHJ5IHtcbiAgICAgIHNwYXduKCd0YXNra2lsbCcsIFsnL3BpZCcsIFN0cmluZyhjaGlsZC5waWQpLCAnL1QnLCAnL0YnXSwge1xuICAgICAgICB3aW5kb3dzSGlkZTogdHJ1ZSxcbiAgICAgICAgc3RkaW86ICdpZ25vcmUnLFxuICAgICAgICBzaGVsbDogZmFsc2UsXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIGNoaWxkLmtpbGwoKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG4gIHRyeSB7XG4gICAgcHJvY2Vzcy5raWxsKC1jaGlsZC5waWQsICdTSUdLSUxMJyk7XG4gIH0gY2F0Y2gge1xuICAgIGNoaWxkLmtpbGwoJ1NJR0tJTEwnKTtcbiAgfVxufVxuIiwgIi8qKlxuICogV2VidmlldyBwYW5lbCBob3N0LlxuICpcbiAqIE93bnMgZXhhY3RseSBvbmUgZ3JhcGggcGFuZWwgcGVyIHdpbmRvdy4gQ3JlYXRpbmcgYSBzZWNvbmQgcGFuZWwgd291bGRcbiAqIGR1cGxpY2F0ZSBhbmFseXNpcyB3b3JrIGFuZCBzcGxpdCBuYXZpZ2F0aW9uIHN0YXRlLCBzbyBgc2hvdygpYCByZXZlYWxzIHRoZVxuICogZXhpc3RpbmcgcGFuZWwgaW5zdGVhZC5cbiAqXG4gKiBBbGwgbWVzc2FnZSBoYW5kbGluZyBnb2VzIHRocm91Z2ggdGhlIHZhbGlkYXRlZCBicmlkZ2U7IG5vdGhpbmcgaW4gdGhpcyBmaWxlXG4gKiBwYXJzZXMgcmF3IHdlYnZpZXcgbWVzc2FnZXMuXG4gKi9cblxuaW1wb3J0ICogYXMgdnNjb2RlIGZyb20gJ3ZzY29kZSc7XG5pbXBvcnQgY3J5cHRvIGZyb20gJ25vZGU6Y3J5cHRvJztcbmltcG9ydCB7IHJlbmRlclBhbmVsSHRtbCB9IGZyb20gJy4vcGFuZWxUZW1wbGF0ZS5qcyc7XG5pbXBvcnQgeyBjcmVhdGVQYW5lbFdpcmUgfSBmcm9tICcuL3BhbmVsV2lyZS5qcyc7XG5cbi8qKlxuICogQHBhcmFtIHt7XG4gKiAgIGNvbnRleHQ6IHZzY29kZS5FeHRlbnNpb25Db250ZXh0LFxuICogICBsb2dnZXI6IHtkZWJ1ZzogRnVuY3Rpb24sIHdhcm46IEZ1bmN0aW9uLCBlcnJvcjogRnVuY3Rpb259LFxuICogICByZWdpc3RyeTogUmV0dXJuVHlwZTx0eXBlb2YgaW1wb3J0KCcuLi9jb3JlL2FkYXB0ZXJSZWdpc3RyeS5qcycpLmNyZWF0ZUFkYXB0ZXJSZWdpc3RyeT4sXG4gKiAgIGFuYWx5c2lzPzoge2FuYWx5emU6IChpbnB1dDogb2JqZWN0KSA9PiBQcm9taXNlPGFueT59LFxuICogICBleHRlbnNpb25WZXJzaW9uOiBzdHJpbmcsXG4gKiB9fSBvcHRpb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQYW5lbE1hbmFnZXIoeyBjb250ZXh0LCBsb2dnZXIsIHJlZ2lzdHJ5LCBhbmFseXNpcywgZXh0ZW5zaW9uVmVyc2lvbiB9KSB7XG4gIC8qKiBAdHlwZSB7dnNjb2RlLldlYnZpZXdQYW5lbCB8IG51bGx9ICovXG4gIGxldCBwYW5lbCA9IG51bGw7XG4gIC8qKiBAdHlwZSB7e2Rpc3Bvc2U6IEZ1bmN0aW9uLCByZXNwb25kOiBGdW5jdGlvbiwgcGVuZGluZ0NvdW50OiBGdW5jdGlvbn0gfCBudWxsfSAqL1xuICBsZXQgYnJpZGdlID0gbnVsbDtcbiAgbGV0IHJ1bkNvdW50ZXIgPSAwO1xuICAvKiogQHR5cGUge3N0cmluZyB8IG51bGx9ICovXG4gIGxldCBwcmVmZXJyZWRQYXRoID0gbnVsbDtcbiAgY29uc3QgYW5hbHl6ZXIgPSBhbmFseXNpcyA/PyByZWdpc3RyeTtcblxuICBjb25zdCB3aXJlID0gY3JlYXRlUGFuZWxXaXJlKHtcbiAgICBsb2dnZXIsXG4gICAgcmVnaXN0cnksXG4gICAgZXh0ZW5zaW9uVmVyc2lvbixcbiAgICBsb2FkUnVuOiAocGF0aCkgPT4gYW5hbHl6ZVJ1bihwYXRoKSxcbiAgICBkZWZhdWx0UGF0aDogKCkgPT4gcHJlZmVycmVkUGF0aCA/PyAnc2FtcGxlLm1vY2snLFxuICB9KTtcblxuICBmdW5jdGlvbiB3ZWJ2aWV3Um9vdCgpIHtcbiAgICByZXR1cm4gdnNjb2RlLlVyaS5qb2luUGF0aChjb250ZXh0LmV4dGVuc2lvblVyaSwgJ2Rpc3QnLCAnd2VidmlldycpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPFxuICAgKiAgIHtvazogdHJ1ZSwgcnVuOiBpbXBvcnQoJy4uL2NvcmUvY3NyL2VudGl0aWVzLmpzJykuQW5hbHlzaXNSdW59IHxcbiAgICogICB7b2s6IGZhbHNlLCBjb2RlOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZywgaXNzdWVzPzogdW5rbm93bn1cbiAgICogPn1cbiAgICovXG4gIGFzeW5jIGZ1bmN0aW9uIGFuYWx5emVSdW4ocGF0aCkge1xuICAgIHJ1bkNvdW50ZXIgKz0gMTtcbiAgICBjb25zdCBydW5JZCA9IGBydW46JHtEYXRlLm5vdygpLnRvU3RyaW5nKDM2KX0tJHtydW5Db3VudGVyfWA7XG4gICAgY29uc3Qgd29ya3NwYWNlUm9vdCA9IHZzY29kZS53b3Jrc3BhY2Uud29ya3NwYWNlRm9sZGVycz8uWzBdPy51cmkuZnNQYXRoO1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGFuYWx5emVyLmFuYWx5emUoe1xuICAgICAgcGF0aCxcbiAgICAgIHJ1bklkLFxuICAgICAgLi4uKHdvcmtzcGFjZVJvb3QgPyB7IHdvcmtzcGFjZVJvb3QgfSA6IHt9KSxcbiAgICAgIHRydXN0ZWQ6IHZzY29kZS53b3Jrc3BhY2UuaXNUcnVzdGVkLFxuICAgIH0pO1xuICAgIGlmICghcmVzdWx0Lm9rKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvazogZmFsc2UsXG4gICAgICAgIGNvZGU6IHJlc3VsdC5jb2RlLFxuICAgICAgICBtZXNzYWdlOiByZXN1bHQubWVzc2FnZSxcbiAgICAgICAgaXNzdWVzOiByZXN1bHQuaXNzdWVzLFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHsgb2s6IHRydWUsIHJ1bjogcmVzdWx0LnJ1biB9O1xuICB9XG5cbiAgZnVuY3Rpb24gYXBwbHlIdG1sKHRhcmdldCkge1xuICAgIGNvbnN0IG5vbmNlID0gY3J5cHRvLnJhbmRvbUJ5dGVzKDE2KS50b1N0cmluZygnYmFzZTY0Jyk7XG4gICAgY29uc3Qgd2VidmlldyA9IHRhcmdldC53ZWJ2aWV3O1xuICAgIGNvbnN0IHJvb3QgPSB3ZWJ2aWV3Um9vdCgpO1xuICAgIHdlYnZpZXcub3B0aW9ucyA9IHtcbiAgICAgIGVuYWJsZVNjcmlwdHM6IHRydWUsXG4gICAgICByZXRhaW5Db250ZXh0V2hlbkhpZGRlbjogQm9vbGVhbihcbiAgICAgICAgdnNjb2RlLndvcmtzcGFjZS5nZXRDb25maWd1cmF0aW9uKCdjb2RlZmxvdycpLmdldCgnZXhwbG9yZXIucmV0YWluQ29udGV4dCcsIGZhbHNlKSxcbiAgICAgICksXG4gICAgICBsb2NhbFJlc291cmNlUm9vdHM6IFtyb290XSxcbiAgICB9O1xuICAgIHdlYnZpZXcuaHRtbCA9IHJlbmRlclBhbmVsSHRtbCh7XG4gICAgICBub25jZSxcbiAgICAgIGNzcFNvdXJjZTogd2Vidmlldy5jc3BTb3VyY2UsXG4gICAgICBzY3JpcHRVcmk6IHdlYnZpZXcuYXNXZWJ2aWV3VXJpKHZzY29kZS5Vcmkuam9pblBhdGgocm9vdCwgJ21haW4uanMnKSkudG9TdHJpbmcoKSxcbiAgICAgIHN0eWxlVXJpOiB3ZWJ2aWV3LmFzV2Vidmlld1VyaSh2c2NvZGUuVXJpLmpvaW5QYXRoKHJvb3QsICdzdHlsZXMuY3NzJykpLnRvU3RyaW5nKCksXG4gICAgICB0aXRsZTogJ0NvZGVGbG93JyxcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3coKSB7XG4gICAgaWYgKHBhbmVsKSB7XG4gICAgICBwYW5lbC5yZXZlYWwodW5kZWZpbmVkLCBmYWxzZSk7XG4gICAgICByZXR1cm4gcGFuZWw7XG4gICAgfVxuXG4gICAgY29uc3QgY3JlYXRlZCA9IHZzY29kZS53aW5kb3cuY3JlYXRlV2Vidmlld1BhbmVsKFxuICAgICAgJ2NvZGVmbG93LmdyYXBoJyxcbiAgICAgICdDb2RlRmxvdycsXG4gICAgICB7IHZpZXdDb2x1bW46IHZzY29kZS5WaWV3Q29sdW1uLkJlc2lkZSwgcHJlc2VydmVGb2N1czogZmFsc2UgfSxcbiAgICAgIHtcbiAgICAgICAgZW5hYmxlU2NyaXB0czogdHJ1ZSxcbiAgICAgICAgbG9jYWxSZXNvdXJjZVJvb3RzOiBbd2Vidmlld1Jvb3QoKV0sXG4gICAgICB9LFxuICAgICk7XG4gICAgcGFuZWwgPSBjcmVhdGVkO1xuICAgIGFwcGx5SHRtbChjcmVhdGVkKTtcbiAgICBicmlkZ2UgPSB3aXJlKGNyZWF0ZWQpO1xuICAgIGNyZWF0ZWQub25EaWREaXNwb3NlKCgpID0+IHtcbiAgICAgIGlmIChwYW5lbCA9PT0gY3JlYXRlZCkge1xuICAgICAgICBwYW5lbCA9IG51bGw7XG4gICAgICAgIGJyaWRnZSA9IG51bGw7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGNyZWF0ZWQ7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHNob3csXG4gICAgLyoqXG4gICAgICogU2hvdyB0aGUgcGFuZWwgYW5kIGFuYWx5emUgYSBzcGVjaWZpYyBmaWxlLiBSZS1hcHBseWluZyB0aGUgSFRNTCBtYWtlc1xuICAgICAqIHRoZSB3ZWJ2aWV3IHJlcXVlc3QgaXRzIGdyYXBoIGFnYWluLCBub3cgd2l0aCB0aGUgcHJlZmVycmVkIHBhdGguXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZVBhdGhcbiAgICAgKi9cbiAgICBzaG93RmlsZShmaWxlUGF0aCkge1xuICAgICAgcHJlZmVycmVkUGF0aCA9IGZpbGVQYXRoO1xuICAgICAgaWYgKHBhbmVsKSB7XG4gICAgICAgIGFwcGx5SHRtbChwYW5lbCk7XG4gICAgICAgIHBhbmVsLnJldmVhbCh1bmRlZmluZWQsIGZhbHNlKTtcbiAgICAgICAgcmV0dXJuIHBhbmVsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNob3coKTtcbiAgICB9LFxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICBpZiAoYnJpZGdlKSB7XG4gICAgICAgIGJyaWRnZS5kaXNwb3NlKCdleHRlbnNpb25fZGlzcG9zZWQnKTtcbiAgICAgICAgYnJpZGdlID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmIChwYW5lbCkge1xuICAgICAgICBwYW5lbC5kaXNwb3NlKCk7XG4gICAgICAgIHBhbmVsID0gbnVsbDtcbiAgICAgIH1cbiAgICB9LFxuICAgIGlzT3BlbjogKCkgPT4gcGFuZWwgIT09IG51bGwsXG4gICAgcGVuZGluZ1JlcXVlc3RzOiAoKSA9PiAoYnJpZGdlID8gYnJpZGdlLnBlbmRpbmdDb3VudCgpIDogMCksXG4gICAgLyoqIFRlc3QgaG9vazogcmVidWlsZCB0aGUgSFRNTCBmb3IgdGhlIG9wZW4gcGFuZWwuICovXG4gICAgcmVsb2FkKCkge1xuICAgICAgaWYgKHBhbmVsKSB7XG4gICAgICAgIGFwcGx5SHRtbChwYW5lbCk7XG4gICAgICB9XG4gICAgfSxcbiAgfTtcbn1cbiIsICIvKipcbiAqIFdlYnZpZXcgSFRNTCB0ZW1wbGF0ZS5cbiAqXG4gKiBLZXB0IGFzIGEgc3RyaW5nIG1vZHVsZSAobm90IGEgZmlsZSByZWFkKSBzbyBpdCBpcyBhdmFpbGFibGUgaW4gdGhlIGJ1bmRsZWRcbiAqIGV4dGVuc2lvbiBhbmQgaW4gdW5pdCB0ZXN0cyB3aXRob3V0IHBhdGggcmVzb2x1dGlvbiBnYW1lcy5cbiAqXG4gKiBUaGUgdGVtcGxhdGUgY29udGFpbnMgbm8gaW5saW5lIHNjcmlwdC4gVGhlIHNpbmdsZSBzY3JpcHQgdGFnIGNhcnJpZXMgYVxuICogcGVyLWxvYWQgbm9uY2UgdGhhdCBhbHNvIGFwcGVhcnMgaW4gdGhlIENvbnRlbnQtU2VjdXJpdHktUG9saWN5LlxuICovXG5cbi8qKlxuICogQHBhcmFtIHt7bm9uY2U6IHN0cmluZywgY3NwU291cmNlOiBzdHJpbmcsIHNjcmlwdFVyaTogc3RyaW5nLCBzdHlsZVVyaTogc3RyaW5nLCB0aXRsZT86IHN0cmluZ319IGlucHV0XG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyUGFuZWxIdG1sKHsgbm9uY2UsIGNzcFNvdXJjZSwgc2NyaXB0VXJpLCBzdHlsZVVyaSwgdGl0bGUgPSAnQ29kZUZsb3cnIH0pIHtcbiAgY29uc3QgY3NwID0gW1xuICAgIFwiZGVmYXVsdC1zcmMgJ25vbmUnXCIsXG4gICAgYGltZy1zcmMgJHtjc3BTb3VyY2V9IGRhdGE6YCxcbiAgICBgc3R5bGUtc3JjICR7Y3NwU291cmNlfWAsXG4gICAgYGZvbnQtc3JjICR7Y3NwU291cmNlfWAsXG4gICAgYHNjcmlwdC1zcmMgJ25vbmNlLSR7bm9uY2V9J2AsXG4gICAgXCJjb25uZWN0LXNyYyAnbm9uZSdcIixcbiAgICBcImJhc2UtdXJpICdub25lJ1wiLFxuICAgIFwiZm9ybS1hY3Rpb24gJ25vbmUnXCIsXG4gIF0uam9pbignOyAnKTtcblxuICByZXR1cm4gYDwhZG9jdHlwZSBodG1sPlxuPGh0bWwgbGFuZz1cImVuXCI+XG4gIDxoZWFkPlxuICAgIDxtZXRhIGNoYXJzZXQ9XCJ1dGYtOFwiIC8+XG4gICAgPG1ldGEgaHR0cC1lcXVpdj1cIkNvbnRlbnQtU2VjdXJpdHktUG9saWN5XCIgY29udGVudD1cIiR7Y3NwfVwiIC8+XG4gICAgPG1ldGEgbmFtZT1cInZpZXdwb3J0XCIgY29udGVudD1cIndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLjBcIiAvPlxuICAgIDxsaW5rIHJlbD1cInN0eWxlc2hlZXRcIiBocmVmPVwiJHtzdHlsZVVyaX1cIiAvPlxuICAgIDx0aXRsZT4ke2VzY2FwZUh0bWwodGl0bGUpfTwvdGl0bGU+XG4gIDwvaGVhZD5cbiAgPGJvZHk+XG4gICAgPGhlYWRlciBjbGFzcz1cImNmLWhlYWRlclwiPlxuICAgICAgPGRpdiBjbGFzcz1cImNmLXRpdGxlXCI+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwiY2YtbWFya1wiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4gaWQ9XCJjZi10aXRsZS10ZXh0XCI+Q29kZUZsb3c8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgaWQ9XCJjZi1tZXRhXCIgY2xhc3M9XCJjZi1tZXRhXCIgcm9sZT1cInN0YXR1c1wiIGFyaWEtbGl2ZT1cInBvbGl0ZVwiPkxvYWRpbmdcdTIwMjY8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjZi1hY3Rpb25zXCI+XG4gICAgICAgIDxidXR0b24gaWQ9XCJjZi1yZWZyZXNoXCIgdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiY2YtYnV0dG9uXCIgdGl0bGU9XCJSZWxvYWQgdGhlIGdyYXBoXCI+XG4gICAgICAgICAgUmVsb2FkXG4gICAgICAgIDwvYnV0dG9uPlxuICAgICAgPC9kaXY+XG4gICAgPC9oZWFkZXI+XG5cbiAgICA8ZGl2IGlkPVwiY2YtYmFubmVyXCIgY2xhc3M9XCJjZi1iYW5uZXJcIiByb2xlPVwiYWxlcnRcIiBoaWRkZW4+PC9kaXY+XG5cbiAgICA8bWFpbiBjbGFzcz1cImNmLW1haW5cIj5cbiAgICAgIDxzZWN0aW9uIGNsYXNzPVwiY2YtY2FudmFzLXdyYXBcIiBhcmlhLWxhYmVsPVwiR3JhcGhcIj5cbiAgICAgICAgPHN2Z1xuICAgICAgICAgIGlkPVwiY2YtZ3JhcGhcIlxuICAgICAgICAgIGNsYXNzPVwiY2YtZ3JhcGhcIlxuICAgICAgICAgIHJvbGU9XCJpbWdcIlxuICAgICAgICAgIGFyaWEtbGFiZWw9XCJDb2RlRmxvdyBncmFwaFwiXG4gICAgICAgICAgdGFiaW5kZXg9XCIwXCJcbiAgICAgICAgPjwvc3ZnPlxuICAgICAgICA8ZGl2IGlkPVwiY2YtZW1wdHlcIiBjbGFzcz1cImNmLWVtcHR5XCIgaGlkZGVuPlxuICAgICAgICAgIDxwPk5vIGdyYXBoIGxvYWRlZC48L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9zZWN0aW9uPlxuICAgICAgPGFzaWRlIGNsYXNzPVwiY2YtZGV0YWlsXCIgYXJpYS1sYWJlbD1cIlNlbGVjdGlvbiBkZXRhaWxzXCI+XG4gICAgICAgIDxoMiBjbGFzcz1cImNmLWRldGFpbC10aXRsZVwiPlNlbGVjdGlvbjwvaDI+XG4gICAgICAgIDxkaXYgaWQ9XCJjZi1kZXRhaWwtYm9keVwiIGNsYXNzPVwiY2YtZGV0YWlsLWJvZHlcIj5cbiAgICAgICAgICA8cCBjbGFzcz1cImNmLW11dGVkXCI+U2VsZWN0IGEgbm9kZSB0byBpbnNwZWN0IGl0LjwvcD5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxoMiBjbGFzcz1cImNmLWRldGFpbC10aXRsZVwiPkxlZ2VuZDwvaDI+XG4gICAgICAgIDx1bCBpZD1cImNmLWxlZ2VuZFwiIGNsYXNzPVwiY2YtbGVnZW5kXCI+PC91bD5cbiAgICAgIDwvYXNpZGU+XG4gICAgPC9tYWluPlxuXG4gICAgPGZvb3RlciBjbGFzcz1cImNmLWZvb3RlclwiPlxuICAgICAgPHNwYW4gaWQ9XCJjZi1zdGF0dXNcIiBjbGFzcz1cImNmLXN0YXR1c1wiPlN0YXJ0aW5nXHUyMDI2PC9zcGFuPlxuICAgICAgPHNwYW4gY2xhc3M9XCJjZi1oaW50XCI+UGFuOiBkcmFnIFx1MDBCNyBab29tOiB3aGVlbCBcdTAwQjcgU2VsZWN0OiBjbGljazwvc3Bhbj5cbiAgICA8L2Zvb3Rlcj5cblxuICAgIDxzY3JpcHQgbm9uY2U9XCIke25vbmNlfVwiIHNyYz1cIiR7c2NyaXB0VXJpfVwiPjwvc2NyaXB0PlxuICA8L2JvZHk+XG48L2h0bWw+YDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVzY2FwZUh0bWwodmFsdWUpIHtcbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSlcbiAgICAucmVwbGFjZSgvJi9nLCAnJmFtcDsnKVxuICAgIC5yZXBsYWNlKC88L2csICcmbHQ7JylcbiAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpXG4gICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxuICAgIC5yZXBsYWNlKC8nL2csICcmIzM5OycpO1xufVxuIiwgIi8qKlxuICogQ29kZUZsb3cgd2VidmlldyBwcm90b2NvbC5cbiAqXG4gKiBUaGUgZXh0ZW5zaW9uIGhvc3QgYW5kIHRoZSB3ZWJ2aWV3IGFyZSBzZXBhcmF0ZSBKYXZhU2NyaXB0IGNvbnRleHRzLiBFdmVyeVxuICogbWVzc2FnZSB0aGF0IGNyb3NzZXMgdGhhdCBib3VuZGFyeSBtdXN0IHBhc3MgdGhyb3VnaCB0aGlzIG1vZHVsZSBzbyB0aGF0IGFcbiAqIHNpbmdsZSwgdmVyc2lvbmVkIGNvbnRyYWN0IGRlY2lkZXMgd2hhdCBpcyBsZWdhbC5cbiAqXG4gKiBUaGlzIG1vZHVsZSBpcyBpbnRlbnRpb25hbGx5IGRlcGVuZGVuY3ktZnJlZTogaXQgaXMgYnVuZGxlZCBpbnRvIGJvdGggdGhlXG4gKiBleHRlbnNpb24gaG9zdCBhbmQgdGhlIHdlYnZpZXcuXG4gKi9cblxuZXhwb3J0IGNvbnN0IFBST1RPQ09MX1ZFUlNJT04gPSAxO1xuXG4vKiogSGFyZCBjZWlsaW5nIG9uIGEgc2VyaWFsaXplZCBtZXNzYWdlLiBMYXJnZXIgbWVzc2FnZXMgYXJlIHJlamVjdGVkLCBuZXZlciB0cnVuY2F0ZWQuICovXG5leHBvcnQgY29uc3QgTUFYX1BBWUxPQURfQllURVMgPSAxXzAwMF8wMDA7XG5cbi8qKiBgZG9tYWluLmFjdGlvbmAgaW4gbG93ZXIgY2FzZSwgYXQgbGVhc3QgdHdvIHNlZ21lbnRzLiAqL1xuZXhwb3J0IGNvbnN0IEtJTkRfUEFUVEVSTiA9IC9eW2Etel0rKFxcLlthLXpdKykrJC87XG5cbmV4cG9ydCBjb25zdCBSRVFVRVNUX0lEX1BBVFRFUk4gPSAvXltBLVphLXowLTlfLV17MSwxMjh9JC87XG5cbi8qKiBLaW5kcyBhIHdlYnZpZXcgbWF5IHNlbmQgdG8gdGhlIGhvc3QuICovXG5leHBvcnQgY29uc3QgV0VCVklFV19UT19IT1NUID0gT2JqZWN0LmZyZWV6ZShbXG4gICd3ZWJ2aWV3LnJlYWR5JyxcbiAgJ2dyYXBoLmxvYWQnLFxuICAnY3NyLmxvYWQnLFxuICAnbm9kZS5zZWxlY3QnLFxuICAncGFuZWwucGluZycsXG4gICdxdWVyeS5zeW1ib2wnLFxuICAncXVlcnkuc3ltYm9scycsXG4gICdxdWVyeS5jYWxsZXJzJyxcbiAgJ3F1ZXJ5LmNhbGxlZXMnLFxuICAncXVlcnkuY29uc3RydWN0cycsXG4gICdxdWVyeS5jYXBhYmlsaXRpZXMnLFxuXSk7XG5cbi8qKiBLaW5kcyB0aGUgaG9zdCBtYXkgc2VuZCB0byB0aGUgd2Vidmlldy4gKi9cbmV4cG9ydCBjb25zdCBIT1NUX1RPX1dFQlZJRVcgPSBPYmplY3QuZnJlZXplKFtcbiAgJ2dyYXBoLmRhdGEnLFxuICAnY2FwYWJpbGl0aWVzLmRhdGEnLFxuICAnY3NyLmRhdGEnLFxuICAncXVlcnkuZGF0YScsXG4gICdhbmFseXNpcy5wcm9ncmVzcycsXG4gICdwcm90b2NvbC5lcnJvcicsXG4gICdwcm90b2NvbC5hY2snLFxuICAncGFuZWwucG9uZycsXG5dKTtcblxuZXhwb3J0IGNvbnN0IERJUkVDVElPTlMgPSBPYmplY3QuZnJlZXplKHtcbiAgV0VCVklFV19UT19IT1NUOiAnd2Vidmlld190b19ob3N0JyxcbiAgSE9TVF9UT19XRUJWSUVXOiAnaG9zdF90b193ZWJ2aWV3Jyxcbn0pO1xuXG5jb25zdCBLSU5EX0FMTE9XTElTVCA9IE9iamVjdC5mcmVlemUoe1xuICBbRElSRUNUSU9OUy5XRUJWSUVXX1RPX0hPU1RdOiBuZXcgU2V0KFdFQlZJRVdfVE9fSE9TVCksXG4gIFtESVJFQ1RJT05TLkhPU1RfVE9fV0VCVklFV106IG5ldyBTZXQoSE9TVF9UT19XRUJWSUVXKSxcbn0pO1xuXG5jb25zdCBVTlNBRkVfS0VZUyA9IG5ldyBTZXQoWydfX3Byb3RvX18nLCAnY29uc3RydWN0b3InLCAncHJvdG90eXBlJ10pO1xuXG5jb25zdCBNQVhfS0VZX1NDQU5fREVQVEggPSA4O1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEVudmVsb3BlXG4gKiBAcHJvcGVydHkge251bWJlcn0gcHJvdG9jb2xWZXJzaW9uXG4gKiBAcHJvcGVydHkge3N0cmluZ30ga2luZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtyZXF1ZXN0SWRdXG4gKiBAcHJvcGVydHkge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBwYXlsb2FkXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBWYWxpZGF0aW9uU3VjY2Vzc1xuICogQHByb3BlcnR5IHt0cnVlfSBva1xuICogQHByb3BlcnR5IHtFbnZlbG9wZX0gZW52ZWxvcGVcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFZhbGlkYXRpb25GYWlsdXJlXG4gKiBAcHJvcGVydHkge2ZhbHNlfSBva1xuICogQHByb3BlcnR5IHsnRV9QUk9UT0NPTCd8J0VfTElNSVQnfSBjb2RlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gcmVhc29uXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbWVzc2FnZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtwYXRoXVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtyZXF1ZXN0SWRdXG4gKi9cblxuLyoqXG4gKiBCdWlsZCBhIHdlbGwtZm9ybWVkIGVudmVsb3BlLiBQcm9kdWNlcnMgc2hvdWxkIHVzZSB0aGlzIGluc3RlYWQgb2Ygd3JpdGluZ1xuICogb2JqZWN0IGxpdGVyYWxzIHNvIHRoYXQgdGhlIHZlcnNpb24gZmllbGQgY2FuIG5ldmVyIGJlIGZvcmdvdHRlbi5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30ga2luZFxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW3BheWxvYWRdXG4gKiBAcGFyYW0ge3N0cmluZ30gW3JlcXVlc3RJZF1cbiAqIEByZXR1cm5zIHtFbnZlbG9wZX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVudmVsb3BlKGtpbmQsIHBheWxvYWQsIHJlcXVlc3RJZCkge1xuICAvKiogQHR5cGUge0VudmVsb3BlfSAqL1xuICBjb25zdCBlbnZlbG9wZSA9IHtcbiAgICBwcm90b2NvbFZlcnNpb246IFBST1RPQ09MX1ZFUlNJT04sXG4gICAga2luZCxcbiAgICBwYXlsb2FkOiBwYXlsb2FkID8/IHt9LFxuICB9O1xuICBpZiAocmVxdWVzdElkKSB7XG4gICAgZW52ZWxvcGUucmVxdWVzdElkID0gcmVxdWVzdElkO1xuICB9XG4gIHJldHVybiBlbnZlbG9wZTtcbn1cblxuLyoqXG4gKiBCdWlsZCBhIHR5cGVkIGVycm9yIHBheWxvYWQuIGBkZXRhaWxgIG11c3QgbmV2ZXIgY29udGFpbiBzb3VyY2UgdGV4dC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IFtkZXRhaWxdXG4gKiBAcmV0dXJucyB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFcnJvclBheWxvYWQoY29kZSwgbWVzc2FnZSwgZGV0YWlsKSB7XG4gIC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovXG4gIGNvbnN0IHBheWxvYWQgPSB7IGNvZGUsIG1lc3NhZ2UgfTtcbiAgaWYgKGRldGFpbCkge1xuICAgIHBheWxvYWQuZGV0YWlsID0gZGV0YWlsO1xuICB9XG4gIHJldHVybiBwYXlsb2FkO1xufVxuXG4vKipcbiAqIEFwcHJveGltYXRlIHNlcmlhbGl6ZWQgc2l6ZSBvZiBhIG1lc3NhZ2UuIFVzZWQgZm9yIGxpbWl0IGVuZm9yY2VtZW50OyB0aGVcbiAqIGV4YWN0IGJ5dGVzIGRvIG5vdCBtYXR0ZXIsIG9ubHkgdGhhdCBvdmVyc2l6ZWQgbWVzc2FnZXMgYXJlIHJlZnVzZWQgYmVmb3JlXG4gKiB0aGV5IGFyZSBwb3N0ZWQuXG4gKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lc3NhZ2VTaXplKHZhbHVlKSB7XG4gIHRyeSB7XG4gICAgY29uc3QganNvbiA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcbiAgICByZXR1cm4gdHlwZW9mIGpzb24gPT09ICdzdHJpbmcnID8ganNvbi5sZW5ndGggOiAwO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHJldHVybnMge3ZhbHVlIGlzIFJlY29yZDxzdHJpbmcsIHVua25vd24+fVxuICovXG5mdW5jdGlvbiBpc1BsYWluT2JqZWN0KHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKTtcbn1cblxuLyoqXG4gKiBSZWplY3QgcGF5bG9hZHMgdGhhdCBjb3VsZCBwb2lzb24gcHJvdG90eXBlcyB3aGVuIG1lcmdlZCBvciBzcHJlYWQuXG4gKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHBhcmFtIHtzdHJpbmd9IHBhdGhcbiAqIEBwYXJhbSB7bnVtYmVyfSBkZXB0aFxuICogQHJldHVybnMge3tvazogdHJ1ZX0gfCB7b2s6IGZhbHNlLCBwYXRoOiBzdHJpbmcsIGtleTogc3RyaW5nfX1cbiAqL1xuZnVuY3Rpb24gc2NhblVuc2FmZUtleXModmFsdWUsIHBhdGgsIGRlcHRoKSB7XG4gIGlmIChkZXB0aCA+IE1BWF9LRVlfU0NBTl9ERVBUSCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIHsgb2s6IHRydWUgfTtcbiAgfVxuICBjb25zdCBlbnRyaWVzID0gQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyB2YWx1ZS5lbnRyaWVzKCkgOiBPYmplY3QuZW50cmllcyh2YWx1ZSk7XG4gIGZvciAoY29uc3QgW2tleSwgY2hpbGRdIG9mIGVudHJpZXMpIHtcbiAgICBjb25zdCBjaGlsZFBhdGggPSBBcnJheS5pc0FycmF5KHZhbHVlKSA/IGAke3BhdGh9WyR7a2V5fV1gIDogYCR7cGF0aH0uJHtrZXl9YDtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpICYmIFVOU0FGRV9LRVlTLmhhcyhTdHJpbmcoa2V5KSkpIHtcbiAgICAgIHJldHVybiB7IG9rOiBmYWxzZSwgcGF0aDogY2hpbGRQYXRoLCBrZXk6IFN0cmluZyhrZXkpIH07XG4gICAgfVxuICAgIGNvbnN0IG5lc3RlZCA9IHNjYW5VbnNhZmVLZXlzKGNoaWxkLCBjaGlsZFBhdGgsIGRlcHRoICsgMSk7XG4gICAgaWYgKCFuZXN0ZWQub2spIHtcbiAgICAgIHJldHVybiBuZXN0ZWQ7XG4gICAgfVxuICB9XG4gIHJldHVybiB7IG9rOiB0cnVlIH07XG59XG5cbi8qKlxuICogVmFsaWRhdGUgYW4gaW5ib3VuZCBtZXNzYWdlIGFnYWluc3QgdGhlIHByb3RvY29sIGNvbnRyYWN0LlxuICpcbiAqIFZhbGlkYXRpb24gaXMgdG90YWw6IGV2ZXJ5IHJlamVjdGlvbiByZXR1cm5zIGEgdHlwZWQgZmFpbHVyZSB3aXRoIGEgc3RhYmxlXG4gKiByZWFzb24gY29kZSwgYW5kIG5ldmVyIHRocm93cy5cbiAqXG4gKiBAcGFyYW0ge3Vua25vd259IHJhd1xuICogQHBhcmFtIHt7ZGlyZWN0aW9uOiAnd2Vidmlld190b19ob3N0JyB8ICdob3N0X3RvX3dlYnZpZXcnfX0gb3B0aW9uc1xuICogQHJldHVybnMge1ZhbGlkYXRpb25TdWNjZXNzIHwgVmFsaWRhdGlvbkZhaWx1cmV9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUVudmVsb3BlKHJhdywgb3B0aW9ucykge1xuICBjb25zdCBkaXJlY3Rpb24gPSBvcHRpb25zPy5kaXJlY3Rpb247XG4gIGNvbnN0IGFsbG93bGlzdCA9IEtJTkRfQUxMT1dMSVNUW2RpcmVjdGlvbl07XG4gIGlmICghYWxsb3dsaXN0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgIHJlYXNvbjogJ3Vua25vd25fZGlyZWN0aW9uJyxcbiAgICAgIG1lc3NhZ2U6IGBVbmtub3duIHByb3RvY29sIGRpcmVjdGlvbjogJHtTdHJpbmcoZGlyZWN0aW9uKX1gLFxuICAgIH07XG4gIH1cblxuICBpZiAoIWlzUGxhaW5PYmplY3QocmF3KSkge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9QUk9UT0NPTCcsXG4gICAgICByZWFzb246ICdub3RfYW5fb2JqZWN0JyxcbiAgICAgIG1lc3NhZ2U6ICdNZXNzYWdlIG11c3QgYmUgYSBwbGFpbiBvYmplY3QuJyxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgY2FuZGlkYXRlID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKHJhdyk7XG5cbiAgaWYgKGNhbmRpZGF0ZS5wcm90b2NvbFZlcnNpb24gIT09IFBST1RPQ09MX1ZFUlNJT04pIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAndmVyc2lvbl9taXNtYXRjaCcsXG4gICAgICBtZXNzYWdlOiBgVW5zdXBwb3J0ZWQgcHJvdG9jb2wgdmVyc2lvbjogZXhwZWN0ZWQgJHtQUk9UT0NPTF9WRVJTSU9OfSwgcmVjZWl2ZWQgJHtTdHJpbmcoXG4gICAgICAgIGNhbmRpZGF0ZS5wcm90b2NvbFZlcnNpb24sXG4gICAgICApfS5gLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBraW5kID0gY2FuZGlkYXRlLmtpbmQ7XG4gIGlmICh0eXBlb2Yga2luZCAhPT0gJ3N0cmluZycgfHwgIUtJTkRfUEFUVEVSTi50ZXN0KGtpbmQpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgIHJlYXNvbjogJ2ludmFsaWRfa2luZCcsXG4gICAgICBtZXNzYWdlOiAnTWVzc2FnZSBraW5kIG11c3QgbG9vayBsaWtlIFwiZG9tYWluLmFjdGlvblwiIGluIGxvd2VyIGNhc2UuJyxcbiAgICAgIHBhdGg6ICdraW5kJyxcbiAgICB9O1xuICB9XG5cbiAgaWYgKCFhbGxvd2xpc3QuaGFzKGtpbmQpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgIHJlYXNvbjogJ3Vua25vd25fa2luZCcsXG4gICAgICBtZXNzYWdlOiBgS2luZCBcIiR7a2luZH1cIiBpcyBub3QgYWNjZXB0ZWQgaW4gZGlyZWN0aW9uIFwiJHtkaXJlY3Rpb259XCIuYCxcbiAgICAgIHBhdGg6ICdraW5kJyxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgcmVxdWVzdElkID0gY2FuZGlkYXRlLnJlcXVlc3RJZDtcbiAgaWYgKHJlcXVlc3RJZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKHR5cGVvZiByZXF1ZXN0SWQgIT09ICdzdHJpbmcnIHx8ICFSRVFVRVNUX0lEX1BBVFRFUk4udGVzdChyZXF1ZXN0SWQpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvazogZmFsc2UsXG4gICAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgICAgcmVhc29uOiAnaW52YWxpZF9yZXF1ZXN0X2lkJyxcbiAgICAgICAgbWVzc2FnZTogJ3JlcXVlc3RJZCBtdXN0IGJlIDEtMTI4IGNoYXJhY3RlcnMgb2YgQS1aLCBhLXosIDAtOSwgXCJfXCIgb3IgXCItXCIuJyxcbiAgICAgICAgcGF0aDogJ3JlcXVlc3RJZCcsXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHBheWxvYWQgPSBjYW5kaWRhdGUucGF5bG9hZCA/PyB7fTtcbiAgaWYgKCFpc1BsYWluT2JqZWN0KHBheWxvYWQpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgIHJlYXNvbjogJ2ludmFsaWRfcGF5bG9hZCcsXG4gICAgICBtZXNzYWdlOiAncGF5bG9hZCBtdXN0IGJlIGEgcGxhaW4gb2JqZWN0LicsXG4gICAgICBwYXRoOiAncGF5bG9hZCcsXG4gICAgICByZXF1ZXN0SWQ6IHR5cGVvZiByZXF1ZXN0SWQgPT09ICdzdHJpbmcnID8gcmVxdWVzdElkIDogdW5kZWZpbmVkLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBrZXlTY2FuID0gc2NhblVuc2FmZUtleXMocGF5bG9hZCwgJ3BheWxvYWQnLCAwKTtcbiAgaWYgKCFrZXlTY2FuLm9rKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgIHJlYXNvbjogJ3Vuc2FmZV9rZXknLFxuICAgICAgbWVzc2FnZTogYFBheWxvYWQgY29udGFpbnMgYSBmb3JiaWRkZW4ga2V5IFwiJHtrZXlTY2FuLmtleX1cIi5gLFxuICAgICAgcGF0aDoga2V5U2Nhbi5wYXRoLFxuICAgICAgcmVxdWVzdElkOiB0eXBlb2YgcmVxdWVzdElkID09PSAnc3RyaW5nJyA/IHJlcXVlc3RJZCA6IHVuZGVmaW5lZCxcbiAgICB9O1xuICB9XG5cbiAgaWYgKG1lc3NhZ2VTaXplKGNhbmRpZGF0ZSkgPiBNQVhfUEFZTE9BRF9CWVRFUykge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9MSU1JVCcsXG4gICAgICByZWFzb246ICdwYXlsb2FkX3Rvb19sYXJnZScsXG4gICAgICBtZXNzYWdlOiBgTWVzc2FnZSBleGNlZWRzIHRoZSAke01BWF9QQVlMT0FEX0JZVEVTfSBieXRlIGxpbWl0LmAsXG4gICAgICByZXF1ZXN0SWQ6IHR5cGVvZiByZXF1ZXN0SWQgPT09ICdzdHJpbmcnID8gcmVxdWVzdElkIDogdW5kZWZpbmVkLFxuICAgIH07XG4gIH1cblxuICAvKiogQHR5cGUge0VudmVsb3BlfSAqL1xuICBjb25zdCBlbnZlbG9wZSA9IHtcbiAgICBwcm90b2NvbFZlcnNpb246IFBST1RPQ09MX1ZFUlNJT04sXG4gICAga2luZCxcbiAgICBwYXlsb2FkLFxuICB9O1xuICBpZiAodHlwZW9mIHJlcXVlc3RJZCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbnZlbG9wZS5yZXF1ZXN0SWQgPSByZXF1ZXN0SWQ7XG4gIH1cblxuICByZXR1cm4geyBvazogdHJ1ZSwgZW52ZWxvcGUgfTtcbn1cbiIsICIvKipcbiAqIFdlYnZpZXcgbWVzc2FnZSBicmlkZ2UuXG4gKlxuICogU3ltbWV0cmljIGltcGxlbWVudGF0aW9uIHVzZWQgYnkgYm90aCB0aGUgZXh0ZW5zaW9uIGhvc3QgYW5kIHRoZSB3ZWJ2aWV3LlxuICogUmVzcG9uc2liaWxpdGllczpcbiAqIC0gVmFsaWRhdGUgZXZlcnkgaW5ib3VuZCBtZXNzYWdlIGJlZm9yZSBhbnkgaGFuZGxlciBzZWVzIGl0LlxuICogLSBDb3JyZWxhdGUgcmVxdWVzdHMgd2l0aCByZXNwb25zZXMsIHdpdGggYSB0aW1lb3V0IHBlciByZXF1ZXN0LlxuICogLSBDb250YWluIGhhbmRsZXIgZmFpbHVyZXMgYW5kIHJlcG9ydCB0aGVtIGFzIHR5cGVkIHByb3RvY29sIGVycm9ycy5cbiAqIC0gUmVqZWN0IHdvcmsgYWZ0ZXIgZGlzcG9zYWwgc28gYSBjbG9zZWQgcGFuZWwgY2Fubm90IGxlYWsgdGltZXJzLlxuICpcbiAqIFRoZSBicmlkZ2UgaGFzIG5vIGRlcGVuZGVuY3kgb24gdGhlIGB2c2NvZGVgIG1vZHVsZTogdGhlIHRyYW5zcG9ydCAoYHBvc3RgKVxuICogaXMgaW5qZWN0ZWQuIFRoYXQgbWFrZXMgdGhlIHdob2xlIHJlcXVlc3QvcmVzcG9uc2UgY29udHJhY3QgdW5pdC10ZXN0YWJsZSBpblxuICogcGxhaW4gTm9kZS5cbiAqL1xuXG5pbXBvcnQge1xuICBESVJFQ1RJT05TLFxuICBIT1NUX1RPX1dFQlZJRVcsXG4gIFdFQlZJRVdfVE9fSE9TVCxcbiAgY3JlYXRlRW52ZWxvcGUsXG4gIGNyZWF0ZUVycm9yUGF5bG9hZCxcbiAgbWVzc2FnZVNpemUsXG4gIHZhbGlkYXRlRW52ZWxvcGUsXG59IGZyb20gJy4vZW52ZWxvcGUuanMnO1xuXG5leHBvcnQgY2xhc3MgUHJvdG9jb2xFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IFtkZXRhaWxdXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjb2RlLCBtZXNzYWdlLCBkZXRhaWwpIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSAnUHJvdG9jb2xFcnJvcic7XG4gICAgdGhpcy5jb2RlID0gY29kZTtcbiAgICBpZiAoZGV0YWlsKSB7XG4gICAgICB0aGlzLmRldGFpbCA9IGRldGFpbDtcbiAgICB9XG4gIH1cbn1cblxuLyoqIEB0eXBlIHt7ZGVidWc6IEZ1bmN0aW9uLCB3YXJuOiBGdW5jdGlvbiwgZXJyb3I6IEZ1bmN0aW9ufX0gKi9cbmNvbnN0IE5PT1BfTE9HR0VSID0ge1xuICBkZWJ1ZygpIHt9LFxuICB3YXJuKCkge30sXG4gIGVycm9yKCkge30sXG59O1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEJyaWRnZU9wdGlvbnNcbiAqIEBwcm9wZXJ0eSB7KG1lc3NhZ2U6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSA9PiB2b2lkfSBwb3N0ICBUcmFuc3BvcnQgdG8gdGhlIG90aGVyIHNpZGUuXG4gKiBAcHJvcGVydHkgeyd3ZWJ2aWV3X3RvX2hvc3QnIHwgJ2hvc3RfdG9fd2Vidmlldyd9IGluYm91bmREaXJlY3Rpb25cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbdGltZW91dE1zXVxuICogQHByb3BlcnR5IHtudW1iZXJ9IFttYXhJbkZsaWdodF1cbiAqIEBwcm9wZXJ0eSB7KCkgPT4gc3RyaW5nfSBbY3JlYXRlUmVxdWVzdElkXVxuICogQHByb3BlcnR5IHt0eXBlb2YgTk9PUF9MT0dHRVJ9IFtsb2dnZXJdXG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge0JyaWRnZU9wdGlvbnN9IG9wdGlvbnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUJyaWRnZShvcHRpb25zKSB7XG4gIGNvbnN0IHsgcG9zdCwgaW5ib3VuZERpcmVjdGlvbiwgbG9nZ2VyID0gTk9PUF9MT0dHRVIgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IHRpbWVvdXRNcyA9IG9wdGlvbnMudGltZW91dE1zID8/IDUwMDA7XG4gIGNvbnN0IG1heEluRmxpZ2h0ID0gb3B0aW9ucy5tYXhJbkZsaWdodCA/PyAzMjtcbiAgY29uc3Qgb3V0Ym91bmREaXJlY3Rpb24gPVxuICAgIGluYm91bmREaXJlY3Rpb24gPT09IERJUkVDVElPTlMuV0VCVklFV19UT19IT1NUXG4gICAgICA/IERJUkVDVElPTlMuSE9TVF9UT19XRUJWSUVXXG4gICAgICA6IERJUkVDVElPTlMuV0VCVklFV19UT19IT1NUO1xuICBjb25zdCBvdXRib3VuZEtpbmRzID0gbmV3IFNldChcbiAgICBvdXRib3VuZERpcmVjdGlvbiA9PT0gRElSRUNUSU9OUy5IT1NUX1RPX1dFQlZJRVcgPyBIT1NUX1RPX1dFQlZJRVcgOiBXRUJWSUVXX1RPX0hPU1QsXG4gICk7XG5cbiAgbGV0IHNlcXVlbmNlID0gMDtcbiAgY29uc3QgY3JlYXRlUmVxdWVzdElkID1cbiAgICBvcHRpb25zLmNyZWF0ZVJlcXVlc3RJZCA/P1xuICAgICgoKSA9PiB7XG4gICAgICBzZXF1ZW5jZSArPSAxO1xuICAgICAgcmV0dXJuIGByJHtzZXF1ZW5jZS50b1N0cmluZygzNil9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgMTApfWA7XG4gICAgfSk7XG5cbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCB7cmVzb2x2ZTogRnVuY3Rpb24sIHJlamVjdDogRnVuY3Rpb24sIHRpbWVyOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0Pn0+fSAqL1xuICBjb25zdCBwZW5kaW5nID0gbmV3IE1hcCgpO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIChwYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgbWV0YToge3JlcXVlc3RJZD86IHN0cmluZ30pID0+IHVua25vd24+fSAqL1xuICBjb25zdCBoYW5kbGVycyA9IG5ldyBNYXAoKTtcbiAgY29uc3QgcmVwb3J0ZWRLaW5kcyA9IG5ldyBTZXQoKTtcbiAgbGV0IGRpc3Bvc2VkID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBraW5kXG4gICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IHBheWxvYWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtyZXF1ZXN0SWRdXG4gICAqL1xuICBmdW5jdGlvbiBzZW5kKGtpbmQsIHBheWxvYWQsIHJlcXVlc3RJZCkge1xuICAgIGlmIChkaXNwb3NlZCkge1xuICAgICAgdGhyb3cgbmV3IFByb3RvY29sRXJyb3IoJ0VfQ0FOQ0VMTEVEJywgJ0JyaWRnZSBpcyBkaXNwb3NlZC4nKTtcbiAgICB9XG4gICAgaWYgKCFvdXRib3VuZEtpbmRzLmhhcyhraW5kKSkge1xuICAgICAgdGhyb3cgbmV3IFByb3RvY29sRXJyb3IoJ0VfUFJPVE9DT0wnLCBgS2luZCBcIiR7a2luZH1cIiBpcyBub3Qgc2VuZGFibGUgaW4gdGhpcyBkaXJlY3Rpb24uYCk7XG4gICAgfVxuICAgIGNvbnN0IGVudmVsb3BlID0gY3JlYXRlRW52ZWxvcGUoa2luZCwgcGF5bG9hZCwgcmVxdWVzdElkKTtcbiAgICBpZiAobWVzc2FnZVNpemUoZW52ZWxvcGUpID4gMV8wMDBfMDAwKSB7XG4gICAgICB0aHJvdyBuZXcgUHJvdG9jb2xFcnJvcignRV9MSU1JVCcsICdSZWZ1c2luZyB0byBzZW5kIGFuIG92ZXJzaXplZCBtZXNzYWdlLicpO1xuICAgIH1cbiAgICBwb3N0KGVudmVsb3BlKTtcbiAgICBsb2dnZXIuZGVidWcoJ3Byb3RvY29sLnNlbmQnLCB7XG4gICAgICBraW5kLFxuICAgICAgcmVxdWVzdElkOiByZXF1ZXN0SWQgPz8gbnVsbCxcbiAgICAgIGJ5dGVzOiBtZXNzYWdlU2l6ZShlbnZlbG9wZSksXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtyZXF1ZXN0SWRdXG4gICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IFtkZXRhaWxdXG4gICAqL1xuICBmdW5jdGlvbiBzZW5kRXJyb3IoY29kZSwgbWVzc2FnZSwgcmVxdWVzdElkLCBkZXRhaWwpIHtcbiAgICB0cnkge1xuICAgICAgc2VuZCgncHJvdG9jb2wuZXJyb3InLCBjcmVhdGVFcnJvclBheWxvYWQoY29kZSwgbWVzc2FnZSwgZGV0YWlsKSwgcmVxdWVzdElkKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFRoZSBwYW5lbCBtYXkgYWxyZWFkeSBiZSBnb25lLiBOb3RoaW5nIHVzZWZ1bCByZW1haW5zIHRvIGRvLlxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2luZFxuICAgKiBAcGFyYW0geyhwYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgbWV0YToge3JlcXVlc3RJZD86IHN0cmluZ30pID0+IHVua25vd259IGhhbmRsZXJcbiAgICogQHJldHVybnMgeygpID0+IHZvaWR9IHVuc3Vic2NyaWJlXG4gICAqL1xuICBmdW5jdGlvbiBvbihraW5kLCBoYW5kbGVyKSB7XG4gICAgaGFuZGxlcnMuc2V0KGtpbmQsIGhhbmRsZXIpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBpZiAoaGFuZGxlcnMuZ2V0KGtpbmQpID09PSBoYW5kbGVyKSB7XG4gICAgICAgIGhhbmRsZXJzLmRlbGV0ZShraW5kKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSByZXF1ZXN0IGFuZCBhd2FpdCB0aGUgY29ycmVsYXRlZCByZXNwb25zZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtpbmRcbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW3BheWxvYWRdXG4gICAqIEBwYXJhbSB7e3RpbWVvdXRNcz86IG51bWJlcn19IFtyZXF1ZXN0T3B0aW9uc11cbiAgICogQHJldHVybnMge1Byb21pc2U8e2tpbmQ6IHN0cmluZywgcGF5bG9hZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj59Pn1cbiAgICovXG4gIGZ1bmN0aW9uIHJlcXVlc3Qoa2luZCwgcGF5bG9hZCA9IHt9LCByZXF1ZXN0T3B0aW9ucyA9IHt9KSB7XG4gICAgaWYgKGRpc3Bvc2VkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IFByb3RvY29sRXJyb3IoJ0VfQ0FOQ0VMTEVEJywgJ0JyaWRnZSBpcyBkaXNwb3NlZC4nKSk7XG4gICAgfVxuICAgIGlmIChwZW5kaW5nLnNpemUgPj0gbWF4SW5GbGlnaHQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcbiAgICAgICAgbmV3IFByb3RvY29sRXJyb3IoJ0VfTElNSVQnLCBgVG9vIG1hbnkgaW4tZmxpZ2h0IHJlcXVlc3RzICgke21heEluRmxpZ2h0fSkuYCksXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCByZXF1ZXN0SWQgPSBjcmVhdGVSZXF1ZXN0SWQoKTtcbiAgICBjb25zdCBlZmZlY3RpdmVUaW1lb3V0ID0gcmVxdWVzdE9wdGlvbnMudGltZW91dE1zID8/IHRpbWVvdXRNcztcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBwZW5kaW5nLmRlbGV0ZShyZXF1ZXN0SWQpO1xuICAgICAgICByZWplY3QoXG4gICAgICAgICAgbmV3IFByb3RvY29sRXJyb3IoXG4gICAgICAgICAgICAnRV9USU1FT1VUJyxcbiAgICAgICAgICAgIGBObyByZXNwb25zZSB0byBcIiR7a2luZH1cIiB3aXRoaW4gJHtlZmZlY3RpdmVUaW1lb3V0fSBtcy5gLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBraW5kLFxuICAgICAgICAgICAgICByZXF1ZXN0SWQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICksXG4gICAgICAgICk7XG4gICAgICB9LCBlZmZlY3RpdmVUaW1lb3V0KTtcbiAgICAgIHBlbmRpbmcuc2V0KHJlcXVlc3RJZCwgeyByZXNvbHZlLCByZWplY3QsIHRpbWVyIH0pO1xuICAgICAgdHJ5IHtcbiAgICAgICAgc2VuZChraW5kLCBwYXlsb2FkLCByZXF1ZXN0SWQpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgcGVuZGluZy5kZWxldGUocmVxdWVzdElkKTtcbiAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3Vua25vd259IHJhd1xuICAgKiBAcmV0dXJucyB7UHJvbWlzZTx7b2s6IGJvb2xlYW4sIGNvZGU/OiBzdHJpbmcsIHJlYXNvbj86IHN0cmluZ30+fVxuICAgKi9cbiAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlTWVzc2FnZShyYXcpIHtcbiAgICBpZiAoZGlzcG9zZWQpIHtcbiAgICAgIHJldHVybiB7IG9rOiBmYWxzZSwgY29kZTogJ0VfQ0FOQ0VMTEVEJywgcmVhc29uOiAnZGlzcG9zZWQnIH07XG4gICAgfVxuXG4gICAgY29uc3QgdmFsaWRhdGlvbiA9IHZhbGlkYXRlRW52ZWxvcGUocmF3LCB7IGRpcmVjdGlvbjogaW5ib3VuZERpcmVjdGlvbiB9KTtcbiAgICBpZiAoIXZhbGlkYXRpb24ub2spIHtcbiAgICAgIGlmICghcmVwb3J0ZWRLaW5kcy5oYXModmFsaWRhdGlvbi5yZWFzb24pKSB7XG4gICAgICAgIHJlcG9ydGVkS2luZHMuYWRkKHZhbGlkYXRpb24ucmVhc29uKTtcbiAgICAgICAgbG9nZ2VyLndhcm4oJ3Byb3RvY29sLnJlamVjdGVkJywge1xuICAgICAgICAgIHJlYXNvbjogdmFsaWRhdGlvbi5yZWFzb24sXG4gICAgICAgICAgcGF0aDogdmFsaWRhdGlvbi5wYXRoID8/IG51bGwsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgc2VuZEVycm9yKHZhbGlkYXRpb24uY29kZSwgdmFsaWRhdGlvbi5tZXNzYWdlLCB2YWxpZGF0aW9uLnJlcXVlc3RJZCwge1xuICAgICAgICByZWFzb246IHZhbGlkYXRpb24ucmVhc29uLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4geyBvazogZmFsc2UsIGNvZGU6IHZhbGlkYXRpb24uY29kZSwgcmVhc29uOiB2YWxpZGF0aW9uLnJlYXNvbiB9O1xuICAgIH1cblxuICAgIGNvbnN0IGVudmVsb3BlID0gdmFsaWRhdGlvbi5lbnZlbG9wZTtcbiAgICBjb25zdCB7IGtpbmQsIHJlcXVlc3RJZCwgcGF5bG9hZCB9ID0gZW52ZWxvcGU7XG4gICAgbG9nZ2VyLmRlYnVnKCdwcm90b2NvbC5yZWNlaXZlJywge1xuICAgICAga2luZCxcbiAgICAgIHJlcXVlc3RJZDogcmVxdWVzdElkID8/IG51bGwsXG4gICAgICBieXRlczogbWVzc2FnZVNpemUoZW52ZWxvcGUpLFxuICAgIH0pO1xuXG4gICAgaWYgKGtpbmQgPT09ICdwcm90b2NvbC5lcnJvcicpIHtcbiAgICAgIGlmIChyZXF1ZXN0SWQgJiYgcGVuZGluZy5oYXMocmVxdWVzdElkKSkge1xuICAgICAgICBjb25zdCBlbnRyeSA9IHBlbmRpbmcuZ2V0KHJlcXVlc3RJZCk7XG4gICAgICAgIGlmIChlbnRyeSkge1xuICAgICAgICAgIGNsZWFyVGltZW91dChlbnRyeS50aW1lcik7XG4gICAgICAgICAgcGVuZGluZy5kZWxldGUocmVxdWVzdElkKTtcbiAgICAgICAgICBjb25zdCBjb2RlID0gdHlwZW9mIHBheWxvYWQuY29kZSA9PT0gJ3N0cmluZycgPyBwYXlsb2FkLmNvZGUgOiAnRV9QUk9UT0NPTCc7XG4gICAgICAgICAgY29uc3QgbWVzc2FnZSA9XG4gICAgICAgICAgICB0eXBlb2YgcGF5bG9hZC5tZXNzYWdlID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICA/IHBheWxvYWQubWVzc2FnZVxuICAgICAgICAgICAgICA6ICdUaGUgb3RoZXIgc2lkZSByZXBvcnRlZCBhbiBlcnJvci4nO1xuICAgICAgICAgIGVudHJ5LnJlamVjdChuZXcgUHJvdG9jb2xFcnJvcihjb2RlLCBtZXNzYWdlLCB7IHJlcXVlc3RJZCB9KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB7IG9rOiB0cnVlIH07XG4gICAgfVxuXG4gICAgaWYgKHJlcXVlc3RJZCAmJiBwZW5kaW5nLmhhcyhyZXF1ZXN0SWQpKSB7XG4gICAgICBjb25zdCBlbnRyeSA9IHBlbmRpbmcuZ2V0KHJlcXVlc3RJZCk7XG4gICAgICBpZiAoZW50cnkpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGVudHJ5LnRpbWVyKTtcbiAgICAgICAgcGVuZGluZy5kZWxldGUocmVxdWVzdElkKTtcbiAgICAgICAgZW50cnkucmVzb2x2ZSh7IGtpbmQsIHBheWxvYWQgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4geyBvazogdHJ1ZSB9O1xuICAgIH1cblxuICAgIGNvbnN0IGhhbmRsZXIgPSBoYW5kbGVycy5nZXQoa2luZCk7XG4gICAgaWYgKCFoYW5kbGVyKSB7XG4gICAgICAvLyBBIHJlc3BvbnNlIHdob3NlIHJlcXVlc3QgYWxyZWFkeSB0aW1lZCBvdXQgaXMgZXhwZWN0ZWQgYW5kIGhhcm1sZXNzLlxuICAgICAgbG9nZ2VyLmRlYnVnKCdwcm90b2NvbC51bmhhbmRsZWQnLCB7IGtpbmQsIHJlcXVlc3RJZDogcmVxdWVzdElkID8/IG51bGwgfSk7XG4gICAgICByZXR1cm4geyBvazogdHJ1ZSB9O1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBoYW5kbGVyKHBheWxvYWQsIHsgcmVxdWVzdElkIH0pO1xuICAgICAgcmV0dXJuIHsgb2s6IHRydWUgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgIGNvbnN0IGNvZGUgPVxuICAgICAgICBlcnJvciBpbnN0YW5jZW9mIFByb3RvY29sRXJyb3JcbiAgICAgICAgICA/IGVycm9yLmNvZGVcbiAgICAgICAgICA6ICgvKiogQHR5cGUge3tjb2RlPzogc3RyaW5nfX0gKi8gKGVycm9yKT8uY29kZSA/PyAnRV9QUk9UT0NPTCcpO1xuICAgICAgbG9nZ2VyLmVycm9yKCdwcm90b2NvbC5oYW5kbGVyX2ZhaWxlZCcsIHsga2luZCwgZXJyb3I6IG1lc3NhZ2UgfSk7XG4gICAgICBzZW5kRXJyb3IoY29kZSwgbWVzc2FnZSwgcmVxdWVzdElkKTtcbiAgICAgIHJldHVybiB7IG9rOiBmYWxzZSwgY29kZSB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcmVhc29uXG4gICAqL1xuICBmdW5jdGlvbiBkaXNwb3NlKHJlYXNvbiA9ICdkaXNwb3NlZCcpIHtcbiAgICBpZiAoZGlzcG9zZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZGlzcG9zZWQgPSB0cnVlO1xuICAgIGZvciAoY29uc3QgWywgZW50cnldIG9mIHBlbmRpbmcpIHtcbiAgICAgIGNsZWFyVGltZW91dChlbnRyeS50aW1lcik7XG4gICAgICBlbnRyeS5yZWplY3QobmV3IFByb3RvY29sRXJyb3IoJ0VfQ0FOQ0VMTEVEJywgYEJyaWRnZSBjbG9zZWQ6ICR7cmVhc29ufWApKTtcbiAgICB9XG4gICAgcGVuZGluZy5jbGVhcigpO1xuICAgIGhhbmRsZXJzLmNsZWFyKCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG9uLFxuICAgIHJlcXVlc3QsXG4gICAgcmVzcG9uZDogc2VuZCxcbiAgICBoYW5kbGVNZXNzYWdlLFxuICAgIGRpc3Bvc2UsXG4gICAgcGVuZGluZ0NvdW50OiAoKSA9PiBwZW5kaW5nLnNpemUsXG4gICAgaXNEaXNwb3NlZDogKCkgPT4gZGlzcG9zZWQsXG4gICAgZGlyZWN0aW9uOiBpbmJvdW5kRGlyZWN0aW9uLFxuICB9O1xufVxuIiwgIi8qKlxuICogR3JhcGggbW9kZWwuXG4gKlxuICogVHVybnMgYSB2YWxpZGF0ZWQgYW5hbHlzaXMgcnVuIGludG8gYSByZW5kZXJhYmxlIGdyYXBoLiBUaGlzIG1vZHVsZSBrbm93c1xuICogYWJvdXQgc3ltYm9scywgcmVsYXRpb25zaGlwcywgYW5kIHByb3ZlbmFuY2UgXHUyMDE0IGFuZCBub3RoaW5nIGFib3V0IEMrKywgSmF2YVNjcmlwdCxcbiAqIHBhcnNlcnMsIG9yIHRoZSB3ZWJ2aWV3LlxuICpcbiAqIFBsYWNlaG9sZGVyIG5vZGVzIGFyZSBjcmVhdGVkIGZvciB0YXJnZXRzIHRoYXQgd2VyZSBub3QgcmVzb2x2ZWQgdG8gYSBkZWNsYXJlZFxuICogc3ltYm9sLiBUaGF0IGlzIGRlbGliZXJhdGU6IGhpZGluZyBhbiB1bnJlc29sdmVkIGNhbGwgd291bGQgcHJlc2VudCBhIGdyYXBoXG4gKiB0aGF0IGxvb2tzIG1vcmUgY29tcGxldGUgdGhhbiB0aGUgYW5hbHlzaXMgaXMuXG4gKi9cblxuaW1wb3J0IHsgY3JlYXRlUXVlcnlMYXllciB9IGZyb20gJy4uL2Nzci9xdWVyeS5qcyc7XG5cbi8qKlxuICogQHR5cGVkZWYge2ltcG9ydCgnLi4vY3NyL2VudGl0aWVzLmpzJykuQW5hbHlzaXNSdW59IEFuYWx5c2lzUnVuXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuLi9jc3IvZW50aXRpZXMuanMnKS5TeW1ib2xSZWNvcmR9IFN5bWJvbFJlY29yZFxuICogQHR5cGVkZWYge2ltcG9ydCgnLi4vY3NyL2VudGl0aWVzLmpzJykuUmVsYXRpb25zaGlwfSBSZWxhdGlvbnNoaXBcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4uL2Nzci9lbnRpdGllcy5qcycpLlNvdXJjZVJhbmdlfSBTb3VyY2VSYW5nZVxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gR3JhcGhOb2RlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gaWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBsYWJlbFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGtpbmRcbiAqIEBwcm9wZXJ0eSB7J3Jlc29sdmVkJ3wnaW5mZXJyZWQnfCdwb3NzaWJsZSd8J3VucmVzb2x2ZWQnfCdzdGFsZSd9IHN0YXR1c1xuICogQHByb3BlcnR5IHtTb3VyY2VSYW5nZSB8IG51bGx9IHJhbmdlXG4gKiBAcHJvcGVydHkge3N0cmluZyB8IG51bGx9IGZpbGVJZFxuICogQHByb3BlcnR5IHtib29sZWFufSBleHRlcm5hbFxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtiYWRnZV1cbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEdyYXBoRWRnZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGlkXG4gKiBAcHJvcGVydHkge3N0cmluZ30gZnJvbVxuICogQHByb3BlcnR5IHtzdHJpbmd9IHRvXG4gKiBAcHJvcGVydHkge3N0cmluZ30gdHlwZVxuICogQHByb3BlcnR5IHsncmVzb2x2ZWQnfCdpbmZlcnJlZCd8J3Bvc3NpYmxlJ3wndW5yZXNvbHZlZCd8J3N0YWxlJ30gc3RhdHVzXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3JlYXNvbkNvZGVdXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbGFiZWxcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEdyYXBoXG4gKiBAcHJvcGVydHkge3N0cmluZ30gZ3JhcGhJZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IHJ1bklkXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbGFuZ3VhZ2VcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBhZGFwdGVySWRcbiAqIEBwcm9wZXJ0eSB7J2Z1bGwnfCdwYXJ0aWFsJ3wnc3ludGFjdGljX29ubHknfSBjb21wbGV0ZW5lc3NcbiAqIEBwcm9wZXJ0eSB7R3JhcGhOb2RlW119IG5vZGVzXG4gKiBAcHJvcGVydHkge0dyYXBoRWRnZVtdfSBlZGdlc1xuICogQHByb3BlcnR5IHtBcnJheTx7Y29kZTogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcsIHNldmVyaXR5OiBzdHJpbmd9Pn0gZGlhZ25vc3RpY3NcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nW119IGRlZ3JhZGF0aW9uc1xuICovXG5cbi8qKlxuICogQHBhcmFtIHtBbmFseXNpc1J1bn0gcnVuXG4gKiBAcmV0dXJucyB7R3JhcGh9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEdyYXBoKHJ1bikge1xuICAvLyBDb3JlLXRvLWNvcmUgcmVhZHMgZ28gdGhyb3VnaCB0aGUgcXVlcnkgbGF5ZXIuIFRoZSBncmFwaCBuZXZlciB3YWxrcyBDU1JcbiAgLy8gYXJyYXlzIGl0c2VsZiwgc28gYSB2YWxpZGF0ZWQgcnVuIHJlbWFpbnMgdGhlIHNpbmdsZSBzb3VyY2Ugb2YgdHJ1dGguXG4gIGNvbnN0IHF1ZXJ5ID0gY3JlYXRlUXVlcnlMYXllcihydW4pO1xuICBjb25zdCBpbmZvID0gdmFsdWVPZihxdWVyeS5ydW5JbmZvKCksIHtcbiAgICBydW5JZDogJycsXG4gICAgbGFuZ3VhZ2U6ICcnLFxuICAgIGFkYXB0ZXJJZDogJycsXG4gICAgY29tcGxldGVuZXNzOiAncGFydGlhbCcsXG4gIH0pO1xuICBjb25zdCBkaWFnbm9zdGljcyA9IHZhbHVlT2YocXVlcnkuZGlhZ25vc3RpY3MoKSwgW10pO1xuICBjb25zdCBzeW1ib2xzID0gdmFsdWVPZihxdWVyeS5hbGxTeW1ib2xzKCksIFtdKTtcbiAgY29uc3QgcmVsYXRpb25zaGlwcyA9IHZhbHVlT2YocXVlcnkuYWxsUmVsYXRpb25zaGlwcygpLCBbXSk7XG5cbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBHcmFwaE5vZGU+fSAqL1xuICBjb25zdCBub2RlcyA9IG5ldyBNYXAoKTtcblxuICBmb3IgKGNvbnN0IHN5bWJvbCBvZiBzeW1ib2xzKSB7XG4gICAgbm9kZXMuc2V0KHN5bWJvbC5zeW1ib2xJZCwge1xuICAgICAgaWQ6IHN5bWJvbC5zeW1ib2xJZCxcbiAgICAgIGxhYmVsOiBkaXNwbGF5TmFtZShzeW1ib2wpLFxuICAgICAga2luZDogc3ltYm9sLmtpbmQsXG4gICAgICBzdGF0dXM6ICdyZXNvbHZlZCcsXG4gICAgICByYW5nZTogc3ltYm9sLmRlY2xhcmF0aW9uLFxuICAgICAgZmlsZUlkOiBzeW1ib2wuZGVjbGFyYXRpb24uZmlsZUlkLFxuICAgICAgZXh0ZXJuYWw6IGZhbHNlLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqIEB0eXBlIHtHcmFwaEVkZ2VbXX0gKi9cbiAgY29uc3QgZWRnZXMgPSBbXTtcbiAgY29uc3QgZWRnZUlkcyA9IG5ldyBTZXQoKTtcbiAgLyoqIEB0eXBlIHtzdHJpbmdbXX0gKi9cbiAgY29uc3Qgc2tpcHBlZFJlbGF0aW9uc2hpcHMgPSBbXTtcblxuICBmb3IgKGNvbnN0IHJlbGF0aW9uc2hpcCBvZiByZWxhdGlvbnNoaXBzKSB7XG4gICAgaWYgKCFub2Rlcy5oYXMocmVsYXRpb25zaGlwLnRvKSkge1xuICAgICAgbm9kZXMuc2V0KHJlbGF0aW9uc2hpcC50bywge1xuICAgICAgICBpZDogcmVsYXRpb25zaGlwLnRvLFxuICAgICAgICBsYWJlbDogcGxhY2Vob2xkZXJMYWJlbChyZWxhdGlvbnNoaXAudG8pLFxuICAgICAgICBraW5kOiAndW5rbm93bicsXG4gICAgICAgIHN0YXR1czogcmVsYXRpb25zaGlwLnN0YXR1cyA9PT0gJ3Jlc29sdmVkJyA/ICd1bnJlc29sdmVkJyA6IHJlbGF0aW9uc2hpcC5zdGF0dXMsXG4gICAgICAgIHJhbmdlOiBudWxsLFxuICAgICAgICBmaWxlSWQ6IG51bGwsXG4gICAgICAgIGV4dGVybmFsOiB0cnVlLFxuICAgICAgICBiYWRnZTogcmVsYXRpb25zaGlwLnJlYXNvbkNvZGUsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoIW5vZGVzLmhhcyhyZWxhdGlvbnNoaXAuZnJvbSkpIHtcbiAgICAgIC8vIEFuIGVkZ2Ugd2l0aCBubyBzb3VyY2Ugc3ltYm9sIGNhbm5vdCBiZSBzaG93biB0cnV0aGZ1bGx5LiBTa2lwIGl0IGFuZFxuICAgICAgLy8gcmVjb3JkIGl0IGFzIGEgZGVncmFkYXRpb24gaW5zdGVhZCBvZiBpbnZlbnRpbmcgYSBub2RlLlxuICAgICAgc2tpcHBlZFJlbGF0aW9uc2hpcHMucHVzaChyZWxhdGlvbnNoaXAucmVsYXRpb25zaGlwSWQpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGVkZ2VJZHMuaGFzKHJlbGF0aW9uc2hpcC5yZWxhdGlvbnNoaXBJZCkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBlZGdlSWRzLmFkZChyZWxhdGlvbnNoaXAucmVsYXRpb25zaGlwSWQpO1xuXG4gICAgZWRnZXMucHVzaCh7XG4gICAgICBpZDogcmVsYXRpb25zaGlwLnJlbGF0aW9uc2hpcElkLFxuICAgICAgZnJvbTogcmVsYXRpb25zaGlwLmZyb20sXG4gICAgICB0bzogcmVsYXRpb25zaGlwLnRvLFxuICAgICAgdHlwZTogcmVsYXRpb25zaGlwLnR5cGUsXG4gICAgICBzdGF0dXM6IHJlbGF0aW9uc2hpcC5zdGF0dXMsXG4gICAgICByZWFzb25Db2RlOiByZWxhdGlvbnNoaXAucmVhc29uQ29kZSxcbiAgICAgIGxhYmVsOiByZWxhdGlvbnNoaXAucmVhc29uQ29kZVxuICAgICAgICA/IGAke3JlbGF0aW9uc2hpcC50eXBlfSBcdTAwQjcgJHtyZWxhdGlvbnNoaXAucmVhc29uQ29kZX1gXG4gICAgICAgIDogcmVsYXRpb25zaGlwLnR5cGUsXG4gICAgfSk7XG4gIH1cblxuICBjb25zdCBkZWdyYWRhdGlvbnMgPSBbXTtcbiAgaWYgKGluZm8uY29tcGxldGVuZXNzICE9PSAnZnVsbCcpIHtcbiAgICBkZWdyYWRhdGlvbnMucHVzaChgQW5hbHlzaXMgY29tcGxldGVuZXNzOiAke2luZm8uY29tcGxldGVuZXNzfWApO1xuICB9XG4gIGZvciAoY29uc3QgcmVsYXRpb25zaGlwSWQgb2Ygc2tpcHBlZFJlbGF0aW9uc2hpcHMpIHtcbiAgICBkZWdyYWRhdGlvbnMucHVzaChcbiAgICAgIGBTa2lwcGVkIHJlbGF0aW9uc2hpcCAke3JlbGF0aW9uc2hpcElkfTogaXRzIHNvdXJjZSBzeW1ib2wgd2FzIG5vdCBkZWNsYXJlZC5gLFxuICAgICk7XG4gIH1cbiAgZm9yIChjb25zdCBkaWFnbm9zdGljIG9mIGRpYWdub3N0aWNzKSB7XG4gICAgaWYgKGRpYWdub3N0aWMuc2V2ZXJpdHkgIT09ICdpbmZvJykge1xuICAgICAgZGVncmFkYXRpb25zLnB1c2goYCR7ZGlhZ25vc3RpYy5jb2RlfTogJHtkaWFnbm9zdGljLm1lc3NhZ2V9YCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBncmFwaElkOiBgZ3JhcGg6JHtpbmZvLnJ1bklkfWAsXG4gICAgcnVuSWQ6IGluZm8ucnVuSWQsXG4gICAgbGFuZ3VhZ2U6IGluZm8ubGFuZ3VhZ2UsXG4gICAgYWRhcHRlcklkOiBpbmZvLmFkYXB0ZXJJZCxcbiAgICBjb21wbGV0ZW5lc3M6IGluZm8uY29tcGxldGVuZXNzLFxuICAgIG5vZGVzOiBbLi4ubm9kZXMudmFsdWVzKCldLnNvcnQoYnlJZCksXG4gICAgZWRnZXM6IGVkZ2VzLnNvcnQoYnlJZCksXG4gICAgZGlhZ25vc3RpY3M6IGRpYWdub3N0aWNzLm1hcCgoZGlhZ25vc3RpYykgPT4gKHtcbiAgICAgIGNvZGU6IGRpYWdub3N0aWMuY29kZSxcbiAgICAgIG1lc3NhZ2U6IGRpYWdub3N0aWMubWVzc2FnZSxcbiAgICAgIHNldmVyaXR5OiBkaWFnbm9zdGljLnNldmVyaXR5LFxuICAgIH0pKSxcbiAgICBkZWdyYWRhdGlvbnMsXG4gIH07XG59XG5cbi8qKlxuICogQWdncmVnYXRlIHF1ZXJpZXMgY2Fubm90IGZhaWwgZm9yIGEgdmFsaWRhdGVkIHJ1bi4gVGhpcyBndWFyZCBrZWVwcyB0aGUgZ3JhcGhcbiAqIHRvdGFsIGlmIHRoYXQgaW52YXJpYW50IGV2ZXIgY2hhbmdlcy5cbiAqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHt7b2s6IHRydWUsIHZhbHVlOiBUfSB8IHtvazogZmFsc2UsIGNvZGU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nfX0gcmVzdWx0XG4gKiBAcGFyYW0ge1R9IGZhbGxiYWNrXG4gKiBAcmV0dXJucyB7VH1cbiAqL1xuZnVuY3Rpb24gdmFsdWVPZihyZXN1bHQsIGZhbGxiYWNrKSB7XG4gIHJldHVybiByZXN1bHQub2sgPyByZXN1bHQudmFsdWUgOiBmYWxsYmFjaztcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gYVxuICogQHBhcmFtIHtzdHJpbmd9IGJcbiAqL1xuZnVuY3Rpb24gYnlJZChhLCBiKSB7XG4gIHJldHVybiBhLmlkIDwgYi5pZCA/IC0xIDogYS5pZCA+IGIuaWQgPyAxIDogMDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1N5bWJvbFJlY29yZH0gc3ltYm9sXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBkaXNwbGF5TmFtZShzeW1ib2wpIHtcbiAgaWYgKHN5bWJvbC5raW5kID09PSAnZmlsZScpIHtcbiAgICByZXR1cm4gc3ltYm9sLm5hbWUgfHwgc3ltYm9sLnF1YWxpZmllZE5hbWU7XG4gIH1cbiAgcmV0dXJuIHN5bWJvbC5uYW1lIHx8IHN5bWJvbC5xdWFsaWZpZWROYW1lIHx8IHN5bWJvbC5zeW1ib2xJZDtcbn1cblxuLyoqXG4gKiBEZXJpdmUgYSByZWFkYWJsZSBsYWJlbCBmcm9tIGFuIHVucmVzb2x2ZWQgdGFyZ2V0IGlkIHdpdGhvdXQgcHJldGVuZGluZyB0b1xuICoga25vdyB3aGF0IGl0IGlzLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YXJnZXRJZFxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gcGxhY2Vob2xkZXJMYWJlbCh0YXJnZXRJZCkge1xuICBjb25zdCBzZWdtZW50cyA9IFN0cmluZyh0YXJnZXRJZCkuc3BsaXQoL1suOi9dLykuZmlsdGVyKEJvb2xlYW4pO1xuICByZXR1cm4gc2VnbWVudHMubGVuZ3RoID4gMCA/IHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdIDogU3RyaW5nKHRhcmdldElkKTtcbn1cbiIsICIvKipcbiAqIERldGVybWluaXN0aWMgbGF5ZXJlZCBsYXlvdXQuXG4gKlxuICogUGhhc2UgMCBuZWVkcyBwb3NpdGlvbnMgc28gdGhlIHdlYnZpZXcgY2FuIGRyYXcgc29tZXRoaW5nIHdpdGhvdXQgb3duaW5nIGFcbiAqIGxheW91dCBhbGdvcml0aG0uIFBoYXNlIDQgYmVuY2htYXJrcyByZWFsIGVuZ2luZXMgKEN5dG9zY2FwZS9FTEsvZGFncmUpIGFuZFxuICogcmVwbGFjZXMgdGhpcyBiZWhpbmQgdGhlIHJlbmRlcmVyIGJvdW5kYXJ5OyB1bnRpbCB0aGVuLCBkZXRlcm1pbmlzdGljIG91dHB1dFxuICogaXMgbW9yZSB2YWx1YWJsZSB0aGFuIHByZXR0eSBvdXRwdXQgYmVjYXVzZSBpdCBtYWtlcyB0ZXN0cyBzdGFibGUuXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuL21vZGVsLmpzJykuR3JhcGh9IEdyYXBoXG4gKiBAdHlwZWRlZiB7e3g6IG51bWJlciwgeTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgbGF5ZXI6IG51bWJlcn19IFBvc2l0aW9uXG4gKi9cblxuZXhwb3J0IGNvbnN0IExBWU9VVF9ERUZBVUxUUyA9IE9iamVjdC5mcmVlemUoe1xuICBub2RlV2lkdGg6IDE5MCxcbiAgbm9kZUhlaWdodDogNTQsXG4gIGhvcml6b250YWxHYXA6IDkwLFxuICB2ZXJ0aWNhbEdhcDogMjYsXG4gIG1heExheWVyczogNDAsXG59KTtcblxuLyoqXG4gKiBAcGFyYW0ge0dyYXBofSBncmFwaFxuICogQHBhcmFtIHtQYXJ0aWFsPHR5cGVvZiBMQVlPVVRfREVGQVVMVFM+fSBbb3B0aW9uc11cbiAqIEByZXR1cm5zIHt7cG9zaXRpb25zOiBSZWNvcmQ8c3RyaW5nLCBQb3NpdGlvbj4sIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBsYXllcnM6IHN0cmluZ1tdW119fVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUxheW91dChncmFwaCwgb3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IGNvbmZpZyA9IHsgLi4uTEFZT1VUX0RFRkFVTFRTLCAuLi5vcHRpb25zIH07XG4gIGNvbnN0IG5vZGVJZHMgPSBncmFwaC5ub2Rlcy5tYXAoKG5vZGUpID0+IG5vZGUuaWQpO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIG51bWJlcj59ICovXG4gIGNvbnN0IGxheWVyT2YgPSBuZXcgTWFwKCk7XG5cbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBzdHJpbmdbXT59ICovXG4gIGNvbnN0IGluY29taW5nID0gbmV3IE1hcChub2RlSWRzLm1hcCgoaWQpID0+IFtpZCwgW11dKSk7XG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywgc3RyaW5nW10+fSAqL1xuICBjb25zdCBvdXRnb2luZyA9IG5ldyBNYXAobm9kZUlkcy5tYXAoKGlkKSA9PiBbaWQsIFtdXSkpO1xuXG4gIGZvciAoY29uc3QgZWRnZSBvZiBncmFwaC5lZGdlcykge1xuICAgIGlmICghaW5jb21pbmcuaGFzKGVkZ2UudG8pIHx8ICFpbmNvbWluZy5oYXMoZWRnZS5mcm9tKSB8fCBlZGdlLmZyb20gPT09IGVkZ2UudG8pIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpbmNvbWluZy5nZXQoZWRnZS50byk/LnB1c2goZWRnZS5mcm9tKTtcbiAgICBvdXRnb2luZy5nZXQoZWRnZS5mcm9tKT8ucHVzaChlZGdlLnRvKTtcbiAgfVxuXG4gIC8vIEthaG4ncyBhbGdvcml0aG0gZ2l2ZXMgYSB0b3BvbG9naWNhbCBvcmRlcjsgY3ljbGVzIGFyZSBoYW5kbGVkIGFmdGVyd2FyZHMuXG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywgbnVtYmVyPn0gKi9cbiAgY29uc3QgaW5kZWdyZWUgPSBuZXcgTWFwKG5vZGVJZHMubWFwKChpZCkgPT4gW2lkLCBpbmNvbWluZy5nZXQoaWQpPy5sZW5ndGggPz8gMF0pKTtcbiAgY29uc3QgcmVhZHkgPSBub2RlSWRzLmZpbHRlcigoaWQpID0+IChpbmRlZ3JlZS5nZXQoaWQpID8/IDApID09PSAwKS5zb3J0KCk7XG4gIC8qKiBAdHlwZSB7c3RyaW5nW119ICovXG4gIGNvbnN0IG9yZGVyID0gW107XG5cbiAgd2hpbGUgKHJlYWR5Lmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBpZCA9IC8qKiBAdHlwZSB7c3RyaW5nfSAqLyAocmVhZHkuc2hpZnQoKSk7XG4gICAgb3JkZXIucHVzaChpZCk7XG4gICAgZm9yIChjb25zdCBuZXh0IG9mIChvdXRnb2luZy5nZXQoaWQpID8/IFtdKS5zbGljZSgpLnNvcnQoKSkge1xuICAgICAgY29uc3QgcmVtYWluaW5nID0gKGluZGVncmVlLmdldChuZXh0KSA/PyAwKSAtIDE7XG4gICAgICBpbmRlZ3JlZS5zZXQobmV4dCwgcmVtYWluaW5nKTtcbiAgICAgIGlmIChyZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgcmVhZHkucHVzaChuZXh0KTtcbiAgICAgICAgcmVhZHkuc29ydCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGxldCBtYXhMYXllciA9IDA7XG4gIGZvciAoY29uc3QgaWQgb2Ygb3JkZXIpIHtcbiAgICBjb25zdCBwcmVkZWNlc3NvcnMgPSBpbmNvbWluZy5nZXQoaWQpID8/IFtdO1xuICAgIGNvbnN0IGxheWVyID1cbiAgICAgIHByZWRlY2Vzc29ycy5sZW5ndGggPT09IDBcbiAgICAgICAgPyAwXG4gICAgICAgIDogTWF0aC5tYXgoLi4ucHJlZGVjZXNzb3JzLm1hcCgocHJlZCkgPT4gbGF5ZXJPZi5nZXQocHJlZCkgPz8gMCkpICsgMTtcbiAgICBsYXllck9mLnNldChpZCwgbGF5ZXIpO1xuICAgIG1heExheWVyID0gTWF0aC5tYXgobWF4TGF5ZXIsIGxheWVyKTtcbiAgfVxuXG4gIC8vIE5vZGVzIGluc2lkZSBhIGN5Y2xlIG5ldmVyIHJlYWNoIGluZGVncmVlIDAuIFBsYWNlIHRoZW0gYWZ0ZXIgZXZlcnl0aGluZ1xuICAvLyB0aGF0IGNvdWxkIGJlIG9yZGVyZWQsIHJhdGhlciB0aGFuIGRyb3BwaW5nIHRoZW0uXG4gIGNvbnN0IGN5Y2xpYyA9IG5vZGVJZHMuZmlsdGVyKChpZCkgPT4gIWxheWVyT2YuaGFzKGlkKSkuc29ydCgpO1xuICBmb3IgKGNvbnN0IGlkIG9mIGN5Y2xpYykge1xuICAgIGxheWVyT2Yuc2V0KGlkLCBNYXRoLm1pbihtYXhMYXllciArIDEsIGNvbmZpZy5tYXhMYXllcnMpKTtcbiAgfVxuXG4gIC8qKiBAdHlwZSB7TWFwPG51bWJlciwgc3RyaW5nW10+fSAqL1xuICBjb25zdCBieUxheWVyID0gbmV3IE1hcCgpO1xuICBmb3IgKGNvbnN0IGlkIG9mIG5vZGVJZHMuc2xpY2UoKS5zb3J0KCkpIHtcbiAgICBjb25zdCBsYXllciA9IE1hdGgubWluKGxheWVyT2YuZ2V0KGlkKSA/PyAwLCBjb25maWcubWF4TGF5ZXJzKTtcbiAgICBpZiAoIWJ5TGF5ZXIuaGFzKGxheWVyKSkge1xuICAgICAgYnlMYXllci5zZXQobGF5ZXIsIFtdKTtcbiAgICB9XG4gICAgYnlMYXllci5nZXQobGF5ZXIpPy5wdXNoKGlkKTtcbiAgfVxuXG4gIC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgUG9zaXRpb24+fSAqL1xuICBjb25zdCBwb3NpdGlvbnMgPSB7fTtcbiAgLyoqIEB0eXBlIHtzdHJpbmdbXVtdfSAqL1xuICBjb25zdCBsYXllcnMgPSBbXTtcbiAgbGV0IHRhbGxlc3QgPSAwO1xuXG4gIGZvciAoY29uc3QgbGF5ZXIgb2YgWy4uLmJ5TGF5ZXIua2V5cygpXS5zb3J0KChhLCBiKSA9PiBhIC0gYikpIHtcbiAgICBjb25zdCBpZHMgPSBieUxheWVyLmdldChsYXllcikgPz8gW107XG4gICAgbGF5ZXJzLnB1c2goaWRzKTtcbiAgICBpZHMuZm9yRWFjaCgoaWQsIGluZGV4KSA9PiB7XG4gICAgICBwb3NpdGlvbnNbaWRdID0ge1xuICAgICAgICB4OiBsYXllciAqIChjb25maWcubm9kZVdpZHRoICsgY29uZmlnLmhvcml6b250YWxHYXApLFxuICAgICAgICB5OiBpbmRleCAqIChjb25maWcubm9kZUhlaWdodCArIGNvbmZpZy52ZXJ0aWNhbEdhcCksXG4gICAgICAgIHdpZHRoOiBjb25maWcubm9kZVdpZHRoLFxuICAgICAgICBoZWlnaHQ6IGNvbmZpZy5ub2RlSGVpZ2h0LFxuICAgICAgICBsYXllcixcbiAgICAgIH07XG4gICAgfSk7XG4gICAgdGFsbGVzdCA9IE1hdGgubWF4KHRhbGxlc3QsIGlkcy5sZW5ndGgpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBwb3NpdGlvbnMsXG4gICAgd2lkdGg6IE1hdGgubWF4KDEsIGxheWVycy5sZW5ndGgpICogKGNvbmZpZy5ub2RlV2lkdGggKyBjb25maWcuaG9yaXpvbnRhbEdhcCksXG4gICAgaGVpZ2h0OiBNYXRoLm1heCgxLCB0YWxsZXN0KSAqIChjb25maWcubm9kZUhlaWdodCArIGNvbmZpZy52ZXJ0aWNhbEdhcCksXG4gICAgbGF5ZXJzLFxuICB9O1xufVxuIiwgIi8qKlxuICogR3JhcGggdmlldy1tb2RlbCAoRFRPKS5cbiAqXG4gKiBUaGUgRFRPIGlzIHRoZSBvbmx5IGdyYXBoIHNoYXBlIHRoZSB3ZWJ2aWV3IHVuZGVyc3RhbmRzLiBJdCBpcyBwbGFpbiBKU09OOlxuICogbm8gZnVuY3Rpb25zLCBubyBpZHMgdGhhdCByZXF1aXJlIGEgbG9va3VwLCBubyBzb3VyY2UgdGV4dC5cbiAqXG4gKiBTb3VyY2UgdGV4dCBpcyBmZXRjaGVkIG9uIGRlbWFuZCBpbiBQaGFzZSA1IHRocm91Z2ggYSBzZXBhcmF0ZSwgdmFsaWRhdGVkXG4gKiByZXF1ZXN0LiBLZWVwaW5nIHRoZSBEVE8gZnJlZSBvZiBzb3VyY2UgcHJldmVudHMgYWNjaWRlbnRhbCBsZWFrYWdlIGludG9cbiAqIGNhY2hlcyBhbmQga2VlcHMgbWVzc2FnZSBzaXplcyBwcmVkaWN0YWJsZS5cbiAqL1xuXG5pbXBvcnQgeyBjb21wdXRlTGF5b3V0IH0gZnJvbSAnLi9sYXlvdXQuanMnO1xuXG5leHBvcnQgY29uc3QgR1JBUEhfRFRPX1ZFUlNJT04gPSAxO1xuXG4vKipcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4vbW9kZWwuanMnKS5HcmFwaH0gR3JhcGhcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IER0b05vZGVcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBpZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGxhYmVsXG4gKiBAcHJvcGVydHkge3N0cmluZ30ga2luZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IHN0YXR1c1xuICogQHByb3BlcnR5IHtzdHJpbmd9IGJhZGdlXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IGV4dGVybmFsXG4gKiBAcHJvcGVydHkge3tmaWxlSWQ6IHN0cmluZywgc3RhcnRMaW5lOiBudW1iZXIsIGVuZExpbmU6IG51bWJlcn0gfCBudWxsfSByYW5nZVxuICogQHByb3BlcnR5IHt7eDogbnVtYmVyLCB5OiBudW1iZXIsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBsYXllcjogbnVtYmVyfX0gcG9zaXRpb25cbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEdyYXBoRHRvXG4gKiBAcHJvcGVydHkge251bWJlcn0gZHRvVmVyc2lvblxuICogQHByb3BlcnR5IHtzdHJpbmd9IGdyYXBoSWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBydW5JZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGxhbmd1YWdlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gYWRhcHRlcklkXG4gKiBAcHJvcGVydHkge3N0cmluZ30gY29tcGxldGVuZXNzXG4gKiBAcHJvcGVydHkge0R0b05vZGVbXX0gbm9kZXNcbiAqIEBwcm9wZXJ0eSB7QXJyYXk8e2lkOiBzdHJpbmcsIGZyb206IHN0cmluZywgdG86IHN0cmluZywgdHlwZTogc3RyaW5nLCBzdGF0dXM6IHN0cmluZywgbGFiZWw6IHN0cmluZywgcmVhc29uQ29kZT86IHN0cmluZ30+fSBlZGdlc1xuICogQHByb3BlcnR5IHtBcnJheTx7Y29kZTogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcsIHNldmVyaXR5OiBzdHJpbmd9Pn0gZGlhZ25vc3RpY3NcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nW119IGRlZ3JhZGF0aW9uc1xuICogQHByb3BlcnR5IHt7d2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXJ9fSBleHRlbnRcbiAqIEBwcm9wZXJ0eSB7e3N0YXR1c2VzOiBzdHJpbmdbXSwga2luZHM6IHN0cmluZ1tdfX0gbGVnZW5kXG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge0dyYXBofSBncmFwaFxuICogQHJldHVybnMge0dyYXBoRHRvfVxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9EdG8oZ3JhcGgpIHtcbiAgY29uc3QgbGF5b3V0ID0gY29tcHV0ZUxheW91dChncmFwaCk7XG5cbiAgY29uc3Qgbm9kZXMgPSBncmFwaC5ub2Rlcy5tYXAoKG5vZGUpID0+ICh7XG4gICAgaWQ6IG5vZGUuaWQsXG4gICAgbGFiZWw6IG5vZGUubGFiZWwsXG4gICAga2luZDogbm9kZS5raW5kLFxuICAgIHN0YXR1czogbm9kZS5zdGF0dXMsXG4gICAgYmFkZ2U6IG5vZGUuYmFkZ2UgPz8gJycsXG4gICAgZXh0ZXJuYWw6IG5vZGUuZXh0ZXJuYWwsXG4gICAgcmFuZ2U6IG5vZGUucmFuZ2VcbiAgICAgID8ge1xuICAgICAgICAgIGZpbGVJZDogbm9kZS5yYW5nZS5maWxlSWQsXG4gICAgICAgICAgc3RhcnRMaW5lOiBub2RlLnJhbmdlLnN0YXJ0TGluZSxcbiAgICAgICAgICBlbmRMaW5lOiBub2RlLnJhbmdlLmVuZExpbmUsXG4gICAgICAgIH1cbiAgICAgIDogbnVsbCxcbiAgICBwb3NpdGlvbjogbGF5b3V0LnBvc2l0aW9uc1tub2RlLmlkXSA/PyB7IHg6IDAsIHk6IDAsIHdpZHRoOiAxOTAsIGhlaWdodDogNTQsIGxheWVyOiAwIH0sXG4gIH0pKTtcblxuICBjb25zdCBzdGF0dXNlcyA9IFsuLi5uZXcgU2V0KG5vZGVzLm1hcCgobm9kZSkgPT4gbm9kZS5zdGF0dXMpKV0uc29ydCgpO1xuICBjb25zdCBraW5kcyA9IFsuLi5uZXcgU2V0KG5vZGVzLm1hcCgobm9kZSkgPT4gbm9kZS5raW5kKSldLnNvcnQoKTtcblxuICByZXR1cm4ge1xuICAgIGR0b1ZlcnNpb246IEdSQVBIX0RUT19WRVJTSU9OLFxuICAgIGdyYXBoSWQ6IGdyYXBoLmdyYXBoSWQsXG4gICAgcnVuSWQ6IGdyYXBoLnJ1bklkLFxuICAgIGxhbmd1YWdlOiBncmFwaC5sYW5ndWFnZSxcbiAgICBhZGFwdGVySWQ6IGdyYXBoLmFkYXB0ZXJJZCxcbiAgICBjb21wbGV0ZW5lc3M6IGdyYXBoLmNvbXBsZXRlbmVzcyxcbiAgICBub2RlcyxcbiAgICBlZGdlczogZ3JhcGguZWRnZXMubWFwKChlZGdlKSA9PiB7XG4gICAgICAvKiogQHR5cGUge3tpZDogc3RyaW5nLCBmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcsIHR5cGU6IHN0cmluZywgc3RhdHVzOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcsIHJlYXNvbkNvZGU/OiBzdHJpbmd9fSAqL1xuICAgICAgY29uc3QgZHRvRWRnZSA9IHtcbiAgICAgICAgaWQ6IGVkZ2UuaWQsXG4gICAgICAgIGZyb206IGVkZ2UuZnJvbSxcbiAgICAgICAgdG86IGVkZ2UudG8sXG4gICAgICAgIHR5cGU6IGVkZ2UudHlwZSxcbiAgICAgICAgc3RhdHVzOiBlZGdlLnN0YXR1cyxcbiAgICAgICAgbGFiZWw6IGVkZ2UubGFiZWwsXG4gICAgICB9O1xuICAgICAgLy8gT21pdCB0aGUga2V5IGVudGlyZWx5IHdoZW4gYWJzZW50IHNvIHRoZSBEVE8gc3Vydml2ZXMgYSBKU09OIHJvdW5kLXRyaXBcbiAgICAgIC8vIHVuY2hhbmdlZCAoSlNPTiBjYW5ub3QgcmVwcmVzZW50IGB1bmRlZmluZWRgKS5cbiAgICAgIGlmIChlZGdlLnJlYXNvbkNvZGUpIHtcbiAgICAgICAgZHRvRWRnZS5yZWFzb25Db2RlID0gZWRnZS5yZWFzb25Db2RlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGR0b0VkZ2U7XG4gICAgfSksXG4gICAgZGlhZ25vc3RpY3M6IGdyYXBoLmRpYWdub3N0aWNzLFxuICAgIGRlZ3JhZGF0aW9uczogZ3JhcGguZGVncmFkYXRpb25zLFxuICAgIGV4dGVudDogeyB3aWR0aDogbGF5b3V0LndpZHRoLCBoZWlnaHQ6IGxheW91dC5oZWlnaHQgfSxcbiAgICBsZWdlbmQ6IHsgc3RhdHVzZXMsIGtpbmRzIH0sXG4gIH07XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSBkdG9cbiAqIEByZXR1cm5zIHt7b2s6IHRydWUsIGR0bzogR3JhcGhEdG99IHwge29rOiBmYWxzZSwgaXNzdWVzOiBzdHJpbmdbXX19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUR0byhkdG8pIHtcbiAgLyoqIEB0eXBlIHtzdHJpbmdbXX0gKi9cbiAgY29uc3QgaXNzdWVzID0gW107XG4gIGlmICh0eXBlb2YgZHRvICE9PSAnb2JqZWN0JyB8fCBkdG8gPT09IG51bGwgfHwgQXJyYXkuaXNBcnJheShkdG8pKSB7XG4gICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBpc3N1ZXM6IFsnRFRPIG11c3QgYmUgYW4gb2JqZWN0LiddIH07XG4gIH1cbiAgY29uc3QgY2FuZGlkYXRlID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKGR0byk7XG4gIGlmIChjYW5kaWRhdGUuZHRvVmVyc2lvbiAhPT0gR1JBUEhfRFRPX1ZFUlNJT04pIHtcbiAgICBpc3N1ZXMucHVzaChgVW5zdXBwb3J0ZWQgZHRvVmVyc2lvbjogJHtTdHJpbmcoY2FuZGlkYXRlLmR0b1ZlcnNpb24pfS5gKTtcbiAgfVxuICBjb25zdCBub2RlcyA9IGNhbmRpZGF0ZS5ub2RlcztcbiAgY29uc3QgZWRnZXMgPSBjYW5kaWRhdGUuZWRnZXM7XG4gIGlmICghQXJyYXkuaXNBcnJheShub2RlcykpIHtcbiAgICBpc3N1ZXMucHVzaCgnbm9kZXMgbXVzdCBiZSBhbiBhcnJheS4nKTtcbiAgfVxuICBpZiAoIUFycmF5LmlzQXJyYXkoZWRnZXMpKSB7XG4gICAgaXNzdWVzLnB1c2goJ2VkZ2VzIG11c3QgYmUgYW4gYXJyYXkuJyk7XG4gIH1cbiAgaWYgKEFycmF5LmlzQXJyYXkobm9kZXMpICYmIEFycmF5LmlzQXJyYXkoZWRnZXMpKSB7XG4gICAgY29uc3QgaWRzID0gbmV3IFNldCgpO1xuICAgIGZvciAoY29uc3Qgbm9kZSBvZiBub2Rlcykge1xuICAgICAgY29uc3QgaWQgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAobm9kZSkuaWQ7XG4gICAgICBpZiAodHlwZW9mIGlkICE9PSAnc3RyaW5nJykge1xuICAgICAgICBpc3N1ZXMucHVzaCgnRXZlcnkgbm9kZSBuZWVkcyBhIHN0cmluZyBpZC4nKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoaWRzLmhhcyhpZCkpIHtcbiAgICAgICAgaXNzdWVzLnB1c2goYER1cGxpY2F0ZSBub2RlIGlkIFwiJHtpZH1cIi5gKTtcbiAgICAgIH1cbiAgICAgIGlkcy5hZGQoaWQpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGVkZ2Ugb2YgZWRnZXMpIHtcbiAgICAgIGNvbnN0IHJlY29yZCA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChlZGdlKTtcbiAgICAgIGlmICh0eXBlb2YgcmVjb3JkLmZyb20gIT09ICdzdHJpbmcnIHx8ICFpZHMuaGFzKHJlY29yZC5mcm9tKSkge1xuICAgICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7U3RyaW5nKHJlY29yZC5pZCl9XCIgaGFzIGFuIHVua25vd24gc291cmNlIG5vZGUuYCk7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIHJlY29yZC50byAhPT0gJ3N0cmluZycgfHwgIWlkcy5oYXMocmVjb3JkLnRvKSkge1xuICAgICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7U3RyaW5nKHJlY29yZC5pZCl9XCIgaGFzIGFuIHVua25vd24gdGFyZ2V0IG5vZGUuYCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChpc3N1ZXMubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiB7IG9rOiBmYWxzZSwgaXNzdWVzIH07XG4gIH1cbiAgcmV0dXJuIHsgb2s6IHRydWUsIGR0bzogLyoqIEB0eXBlIHtHcmFwaER0b30gKi8gKGR0bykgfTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0dyYXBoRHRvfSBkdG9cbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVEdG8oZHRvKSB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShkdG8pO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBqc29uXG4gKiBAcmV0dXJucyB7R3JhcGhEdG99XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUR0byhqc29uKSB7XG4gIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoanNvbik7XG4gIGNvbnN0IHZhbGlkYXRpb24gPSB2YWxpZGF0ZUR0byhwYXJzZWQpO1xuICBpZiAoIXZhbGlkYXRpb24ub2spIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZ3JhcGggRFRPOiAke3ZhbGlkYXRpb24uaXNzdWVzLmpvaW4oJzsgJyl9YCk7XG4gIH1cbiAgcmV0dXJuIHZhbGlkYXRpb24uZHRvO1xufVxuIiwgIi8qKlxuICogRGV0ZXJtaW5pc3RpYyBDU1Igc2VyaWFsaXphdGlvbi5cbiAqXG4gKiBUd28gcnVucyBvdmVyIGlkZW50aWNhbCBpbnB1dCBtdXN0IHNlcmlhbGl6ZSB0byBpZGVudGljYWwgYnl0ZXMuIFRoYXQgaXMgYVxuICogaGFyZCByZXF1aXJlbWVudCBmb3IgUGhhc2UgOTogbm9uLWRldGVybWluaXN0aWMgb3JkZXJpbmcgd291bGQgbG9vayBsaWtlXG4gKiBjaGFuZ2UgYW5kIGNyZWF0ZSBwaGFudG9tIGludmFsaWRhdGlvbnMuXG4gKlxuICogUnVsZXM6XG4gKiAtIGNvbGxlY3Rpb25zIGFyZSBzb3J0ZWQgYnkgZG9jdW1lbnRlZCBrZXlzIGJlZm9yZSBvdXRwdXQ7XG4gKiAtIG9iamVjdCBrZXlzIGFyZSBlbWl0dGVkIGluIHNvcnRlZCBvcmRlciwgaW5jbHVkaW5nIGluc2lkZSBgZXh0ZW5zaW9uc2A7XG4gKiAtIHRpbWluZ3MgKGBzdGFydGVkQXRgLCBgZHVyYXRpb25Nc2ApIGFyZSBleGNsdWRlZCBmcm9tIHRoZSBkZXRlcm1pbmlzdGljXG4gKiAgIHBheWxvYWQ7IHRoZXkgYXJlIG1ldGFkYXRhLCBub3QgZmFjdHM7XG4gKiAtIHRoZSBzZXJpYWxpemVkIHBheWxvYWQgaXMgdmVyc2lvbmVkIGJ5IHRoZSBydW4ncyBgY3NyVmVyc2lvbmAuXG4gKi9cblxuaW1wb3J0IHsgaGFzaEhleCB9IGZyb20gJy4vaGFzaC5qcyc7XG5pbXBvcnQgeyB2YWxpZGF0ZUFuYWx5c2lzUnVuIH0gZnJvbSAnLi92YWxpZGF0ZS5qcyc7XG5cbi8qKlxuICogQHBhcmFtIHtpbXBvcnQoJy4vZW50aXRpZXMuanMnKS5BbmFseXNpc1J1bn0gcnVuXG4gKiBAcmV0dXJucyB7aW1wb3J0KCcuL2VudGl0aWVzLmpzJykuQW5hbHlzaXNSdW59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5vbmljYWxSdW4ocnVuKSB7XG4gIGNvbnN0IGNhbmRpZGF0ZSA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChydW4pO1xuICAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqL1xuICBjb25zdCBjYW5vbmljYWwgPSB7XG4gICAgcnVuSWQ6IGNhbmRpZGF0ZS5ydW5JZCxcbiAgICBhZGFwdGVySWQ6IGNhbmRpZGF0ZS5hZGFwdGVySWQsXG4gICAgYWRhcHRlclZlcnNpb246IGNhbmRpZGF0ZS5hZGFwdGVyVmVyc2lvbixcbiAgICBsYW5ndWFnZTogY2FuZGlkYXRlLmxhbmd1YWdlLFxuICAgIGNzclZlcnNpb246IGNhbmRpZGF0ZS5jc3JWZXJzaW9uLFxuICAgIHNjb3BlOiBjYW5kaWRhdGUuc2NvcGUsXG4gICAgY29tcGxldGVuZXNzOiBjYW5kaWRhdGUuY29tcGxldGVuZXNzLFxuICAgIGZpbGVzOiBzb3J0QnkoYXJyYXlPZihjYW5kaWRhdGUuZmlsZXMpLCAoZmlsZSkgPT4gU3RyaW5nKGZpbGUuZmlsZUlkKSksXG4gICAgc3ltYm9sczogc29ydEJ5KGFycmF5T2YoY2FuZGlkYXRlLnN5bWJvbHMpLCAoc3ltYm9sKSA9PiBTdHJpbmcoc3ltYm9sLnN5bWJvbElkKSksXG4gICAgcmVsYXRpb25zaGlwczogc29ydEJ5KFxuICAgICAgYXJyYXlPZihjYW5kaWRhdGUucmVsYXRpb25zaGlwcyksXG4gICAgICAocmVsYXRpb25zaGlwKSA9PlxuICAgICAgICBgJHtTdHJpbmcocmVsYXRpb25zaGlwLnR5cGUpfVxcdTAwMDAke1N0cmluZyhyZWxhdGlvbnNoaXAuZnJvbSl9XFx1MDAwMCR7U3RyaW5nKFxuICAgICAgICAgIHJlbGF0aW9uc2hpcC50byxcbiAgICAgICAgKX1cXHUwMDAwJHtTdHJpbmcocmVsYXRpb25zaGlwLnJlbGF0aW9uc2hpcElkKX1gLFxuICAgICksXG4gICAgY29udHJvbENvbnN0cnVjdHM6IHNvcnRCeShhcnJheU9mKGNhbmRpZGF0ZS5jb250cm9sQ29uc3RydWN0cyksIChjb25zdHJ1Y3QpID0+XG4gICAgICBTdHJpbmcoY29uc3RydWN0LmNvbnN0cnVjdElkKSxcbiAgICApLFxuICAgIGRhdGFGYWN0czogc29ydEJ5KGFycmF5T2YoY2FuZGlkYXRlLmRhdGFGYWN0cyksIChmYWN0KSA9PiBTdHJpbmcoZmFjdC5mYWN0SWQpKSxcbiAgICBkaWFnbm9zdGljczogc29ydEJ5KFxuICAgICAgYXJyYXlPZihjYW5kaWRhdGUuZGlhZ25vc3RpY3MpLFxuICAgICAgKGRpYWdub3N0aWMpID0+XG4gICAgICAgIGAke1N0cmluZyhkaWFnbm9zdGljLnNldmVyaXR5KX1cXHUwMDAwJHtTdHJpbmcoZGlhZ25vc3RpYy5jb2RlKX1cXHUwMDAwJHtTdHJpbmcoXG4gICAgICAgICAgZGlhZ25vc3RpYy5tZXNzYWdlLFxuICAgICAgICApfVxcdTAwMDAke0FycmF5LmlzQXJyYXkoZGlhZ25vc3RpYy5hZmZlY3RzKSA/IGRpYWdub3N0aWMuYWZmZWN0cy5qb2luKCcsJykgOiAnJ31gLFxuICAgICksXG4gIH07XG4gIGlmIChpc1BsYWluT2JqZWN0KGNhbmRpZGF0ZS5leHRlbnNpb25zKSkge1xuICAgIGNhbm9uaWNhbC5leHRlbnNpb25zID0gY2FuZGlkYXRlLmV4dGVuc2lvbnM7XG4gIH1cbiAgcmV0dXJuIC8qKiBAdHlwZSB7aW1wb3J0KCcuL2VudGl0aWVzLmpzJykuQW5hbHlzaXNSdW59ICovIChjYW5vbmljYWwpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7aW1wb3J0KCcuL2VudGl0aWVzLmpzJykuQW5hbHlzaXNSdW59IHJ1blxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZVJ1bihydW4pIHtcbiAgcmV0dXJuIHN0YWJsZVN0cmluZ2lmeShjYW5vbmljYWxSdW4ocnVuKSk7XG59XG5cbi8qKlxuICogQ2hhbmdlLWRldGVjdGlvbiBoYXNoLiBTdGFibGUgYWNyb3NzIHByb2Nlc3NlcyBhbmQgcGxhdGZvcm1zLlxuICpcbiAqIEBwYXJhbSB7aW1wb3J0KCcuL2VudGl0aWVzLmpzJykuQW5hbHlzaXNSdW59IHJ1blxuICogQHJldHVybnMge3N0cmluZ30gc2l4dGVlbiBoZXggY2hhcmFjdGVyc1xuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzaFJ1bihydW4pIHtcbiAgcmV0dXJuIGhhc2hIZXgoc2VyaWFsaXplUnVuKHJ1bikpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBqc29uXG4gKiBAcGFyYW0ge3ttb2RlPzogJ3N0cmljdCd8J2RlZmVuc2l2ZSd9fSBbb3B0aW9uc11cbiAqIEByZXR1cm5zIHt7b2s6IHRydWUsIHJ1bjogaW1wb3J0KCcuL2VudGl0aWVzLmpzJykuQW5hbHlzaXNSdW59IHwge29rOiBmYWxzZSwgaXNzdWVzOiBBcnJheTx7cGF0aDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmd9Pn19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVJ1bihqc29uLCBvcHRpb25zID0ge30pIHtcbiAgbGV0IHBhcnNlZDtcbiAgdHJ5IHtcbiAgICBwYXJzZWQgPSBKU09OLnBhcnNlKGpzb24pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBpc3N1ZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHBhdGg6ICckJyxcbiAgICAgICAgICBtZXNzYWdlOiBgSW52YWxpZCBKU09OOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9O1xuICB9XG4gIGNvbnN0IHZhbGlkYXRpb24gPSB2YWxpZGF0ZUFuYWx5c2lzUnVuKHBhcnNlZCwgeyBtb2RlOiBvcHRpb25zLm1vZGUgPz8gJ3N0cmljdCcgfSk7XG4gIGlmICghdmFsaWRhdGlvbi5vaykge1xuICAgIHJldHVybiB7IG9rOiBmYWxzZSwgaXNzdWVzOiB2YWxpZGF0aW9uLmlzc3VlcyB9O1xuICB9XG4gIHJldHVybiB7IG9rOiB0cnVlLCBydW46IHZhbGlkYXRpb24ucnVuIH07XG59XG5cbi8qKlxuICogSlNPTiB3aXRoIHJlY3Vyc2l2ZWx5IHNvcnRlZCBvYmplY3Qga2V5cy4gQXJyYXlzIGtlZXAgdGhlaXIgKGFscmVhZHkgc29ydGVkKVxuICogb3JkZXIuXG4gKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0YWJsZVN0cmluZ2lmeSh2YWx1ZSkge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoc29ydEtleXModmFsdWUpKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcmV0dXJucyB7dW5rbm93bn1cbiAqL1xuZnVuY3Rpb24gc29ydEtleXModmFsdWUpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLm1hcCgoZW50cnkpID0+IHNvcnRLZXlzKGVudHJ5KSk7XG4gIH1cbiAgaWYgKGlzUGxhaW5PYmplY3QodmFsdWUpKSB7XG4gICAgLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi9cbiAgICBjb25zdCBzb3J0ZWQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyh2YWx1ZSkuc29ydCgpKSB7XG4gICAgICBpZiAodmFsdWVba2V5XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHNvcnRlZFtrZXldID0gc29ydEtleXModmFsdWVba2V5XSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzb3J0ZWQ7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIEB0ZW1wbGF0ZSBUXG4gKiBAcGFyYW0ge1RbXX0gdmFsdWVzXG4gKiBAcGFyYW0geyh2YWx1ZTogVCkgPT4gc3RyaW5nfSBrZXlcbiAqIEByZXR1cm5zIHtUW119XG4gKi9cbmZ1bmN0aW9uIHNvcnRCeSh2YWx1ZXMsIGtleSkge1xuICByZXR1cm4gdmFsdWVzXG4gICAgLm1hcCgodmFsdWUpID0+ICh7IHZhbHVlLCBrZXk6IGtleSgvKiogQHR5cGUge1R9ICovICh2YWx1ZSkpIH0pKVxuICAgIC5zb3J0KChhLCBiKSA9PiAoYS5rZXkgPCBiLmtleSA/IC0xIDogYS5rZXkgPiBiLmtleSA/IDEgOiAwKSlcbiAgICAubWFwKChlbnRyeSkgPT4gZW50cnkudmFsdWUpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEByZXR1cm5zIHt1bmtub3duW119XG4gKi9cbmZ1bmN0aW9uIGFycmF5T2YodmFsdWUpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWUgOiBbXTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcmV0dXJucyB7dmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj59XG4gKi9cbmZ1bmN0aW9uIGlzUGxhaW5PYmplY3QodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpO1xufVxuIiwgIi8qKlxuICogUGFuZWwgYnJpZGdlIHdpcmluZy5cbiAqXG4gKiBLZXB0IGZyZWUgb2YgdGhlIGB2c2NvZGVgIG1vZHVsZSBzbyB0aGUgc3Vic2NyaXB0aW9uIGNvbnRyYWN0IFx1MjAxNCBzdWJzY3JpYmUgb25cbiAqIGBwYW5lbC53ZWJ2aWV3YCwgbmV2ZXIgb24gdGhlIHBhbmVsIGl0c2VsZiBcdTIwMTQgY2FuIGJlIHVuaXQtdGVzdGVkIGluIHBsYWluIE5vZGUuXG4gKiBHZXR0aW5nIHRoaXMgd3JvbmcgaXMgc2lsZW50OiBtZXNzYWdlcyBzaW1wbHkgbmV2ZXIgcmVhY2ggdGhlIGJyaWRnZSBhbmQgZXZlcnlcbiAqIHJlcXVlc3QgdGltZXMgb3V0LlxuICpcbiAqIFRoZSBob3N0IG93bnMgdGhlIGN1cnJlbnQgdmFsaWRhdGVkIHJ1biBhbmQgaXRzIHF1ZXJ5IGxheWVyLiBUaGUgd2VidmlldyBhc2tzXG4gKiBmb3IgZ3JhcGggZGF0YSwgQ1NSLCBvciBpbmRpdmlkdWFsIHF1ZXJpZXM7IGl0IG5ldmVyIHJlY2VpdmVzIGFkYXB0ZXIgb2JqZWN0c1xuICogYW5kIG5ldmVyIGltcG9ydHMgb25lLlxuICovXG5cbmltcG9ydCB7IGNyZWF0ZUJyaWRnZSB9IGZyb20gJy4uL2NvcmUvcHJvdG9jb2wvYnJpZGdlLmpzJztcbmltcG9ydCB7IERJUkVDVElPTlMsIFBST1RPQ09MX1ZFUlNJT04sIGNyZWF0ZUVycm9yUGF5bG9hZCB9IGZyb20gJy4uL2NvcmUvcHJvdG9jb2wvZW52ZWxvcGUuanMnO1xuaW1wb3J0IHsgYnVpbGRHcmFwaCB9IGZyb20gJy4uL2NvcmUvZ3JhcGgvbW9kZWwuanMnO1xuaW1wb3J0IHsgdG9EdG8gfSBmcm9tICcuLi9jb3JlL2dyYXBoL2R0by5qcyc7XG5pbXBvcnQgeyBoYXNoUnVuIH0gZnJvbSAnLi4vY29yZS9jc3Ivc2VyaWFsaXplLmpzJztcblxuLyoqIEB0eXBlZGVmIHtSZXR1cm5UeXBlPHR5cGVvZiBpbXBvcnQoJy4uL2NvcmUvY3NyL3F1ZXJ5LmpzJykuY3JlYXRlUXVlcnlMYXllcj59IFF1ZXJ5TGF5ZXIgKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBXaXJlT3B0aW9uc1xuICogQHByb3BlcnR5IHt7ZGVidWc6IEZ1bmN0aW9uLCB3YXJuOiBGdW5jdGlvbiwgZXJyb3I6IEZ1bmN0aW9ufX0gbG9nZ2VyXG4gKiBAcHJvcGVydHkge3tjYXBhYmlsaXR5TWF0cml4OiAoKSA9PiB1bmtub3duW10sIHF1ZXJ5OiAocnVuOiBvYmplY3QpID0+IFF1ZXJ5TGF5ZXJ9fSByZWdpc3RyeVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGV4dGVuc2lvblZlcnNpb25cbiAqIEBwcm9wZXJ0eSB7KHBhdGg6IHN0cmluZykgPT4gUHJvbWlzZTxcbiAqICAge29rOiB0cnVlLCBydW46IGltcG9ydCgnLi4vY29yZS9jc3IvZW50aXRpZXMuanMnKS5BbmFseXNpc1J1bn0gfFxuICogICB7b2s6IGZhbHNlLCBjb2RlOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZywgaXNzdWVzPzogdW5rbm93bn1cbiAqID59IGxvYWRSdW5cbiAqIEBwcm9wZXJ0eSB7KCkgPT4gc3RyaW5nfSBbZGVmYXVsdFBhdGhdXG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge1dpcmVPcHRpb25zfSBvcHRpb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQYW5lbFdpcmUoe1xuICBsb2dnZXIsXG4gIHJlZ2lzdHJ5LFxuICBleHRlbnNpb25WZXJzaW9uLFxuICBsb2FkUnVuLFxuICBkZWZhdWx0UGF0aCA9ICgpID0+ICdzYW1wbGUubW9jaycsXG59KSB7XG4gIHJldHVybiBmdW5jdGlvbiB3aXJlKHRhcmdldCkge1xuICAgIGlmICghdGFyZ2V0Py53ZWJ2aWV3IHx8IHR5cGVvZiB0YXJnZXQud2Vidmlldy5vbkRpZFJlY2VpdmVNZXNzYWdlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdQYW5lbCB0YXJnZXQgbXVzdCBleHBvc2Ugd2Vidmlldy5vbkRpZFJlY2VpdmVNZXNzYWdlLicpO1xuICAgIH1cblxuICAgIGNvbnN0IGxvZ2dlclByb3h5ID0ge1xuICAgICAgZGVidWc6IC8qKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBbZmllbGRzXSAqLyAoXG4gICAgICAgIG1lc3NhZ2UsXG4gICAgICAgIGZpZWxkcyxcbiAgICAgICkgPT4gbG9nZ2VyLmRlYnVnKG1lc3NhZ2UsIGZpZWxkcyksXG4gICAgICB3YXJuOiAobWVzc2FnZSwgZmllbGRzKSA9PiBsb2dnZXIud2FybihtZXNzYWdlLCBmaWVsZHMpLFxuICAgICAgZXJyb3I6IChtZXNzYWdlLCBmaWVsZHMpID0+IGxvZ2dlci5lcnJvcihtZXNzYWdlLCBmaWVsZHMpLFxuICAgIH07XG5cbiAgICBjb25zdCBicmlkZ2UgPSBjcmVhdGVCcmlkZ2Uoe1xuICAgICAgcG9zdDogKG1lc3NhZ2UpID0+IHtcbiAgICAgICAgdm9pZCBQcm9taXNlLnJlc29sdmUodGFyZ2V0LndlYnZpZXcucG9zdE1lc3NhZ2UobWVzc2FnZSkpLnRoZW4oXG4gICAgICAgICAgKGRlbGl2ZXJlZCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFkZWxpdmVyZWQpIHtcbiAgICAgICAgICAgICAgbG9nZ2VyLmRlYnVnKCdwYW5lbC5wb3N0X3VuZGVsaXZlcmVkJywgeyBraW5kOiBtZXNzYWdlLmtpbmQgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICAoZXJyb3IpID0+IHtcbiAgICAgICAgICAgIGxvZ2dlci5kZWJ1ZygncGFuZWwucG9zdF9mYWlsZWQnLCB7XG4gICAgICAgICAgICAgIGtpbmQ6IG1lc3NhZ2Uua2luZCxcbiAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG4gICAgICAgICk7XG4gICAgICB9LFxuICAgICAgaW5ib3VuZERpcmVjdGlvbjogRElSRUNUSU9OUy5XRUJWSUVXX1RPX0hPU1QsXG4gICAgICBsb2dnZXI6IGxvZ2dlclByb3h5LFxuICAgIH0pO1xuXG4gICAgLyoqIEB0eXBlIHt7cGF0aDogc3RyaW5nLCBydW46IGltcG9ydCgnLi4vY29yZS9jc3IvZW50aXRpZXMuanMnKS5BbmFseXNpc1J1biwgcXVlcnk6IFF1ZXJ5TGF5ZXIsIGhhc2g6IHN0cmluZ30gfCBudWxsfSAqL1xuICAgIGxldCBjdXJyZW50ID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbcGF0aF1cbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxcbiAgICAgKiAgIHtvazogdHJ1ZSwgcnVuOiBpbXBvcnQoJy4uL2NvcmUvY3NyL2VudGl0aWVzLmpzJykuQW5hbHlzaXNSdW4sIHF1ZXJ5OiBRdWVyeUxheWVyfSB8XG4gICAgICogICB7b2s6IGZhbHNlLCBjb2RlOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZywgaXNzdWVzPzogdW5rbm93bn1cbiAgICAgKiA+fVxuICAgICAqL1xuICAgIGFzeW5jIGZ1bmN0aW9uIGVuc3VyZVJ1bihwYXRoID0gZGVmYXVsdFBhdGgoKSkge1xuICAgICAgaWYgKGN1cnJlbnQgJiYgY3VycmVudC5wYXRoID09PSBwYXRoKSB7XG4gICAgICAgIHJldHVybiB7IG9rOiB0cnVlLCBydW46IGN1cnJlbnQucnVuLCBxdWVyeTogY3VycmVudC5xdWVyeSB9O1xuICAgICAgfVxuICAgICAgY29uc3QgbG9hZGVkID0gYXdhaXQgbG9hZFJ1bihwYXRoKTtcbiAgICAgIGlmICghbG9hZGVkLm9rKSB7XG4gICAgICAgIHJldHVybiBsb2FkZWQ7XG4gICAgICB9XG4gICAgICBjb25zdCBxdWVyeSA9IHJlZ2lzdHJ5LnF1ZXJ5KGxvYWRlZC5ydW4pO1xuICAgICAgY3VycmVudCA9IHtcbiAgICAgICAgcGF0aCxcbiAgICAgICAgcnVuOiBsb2FkZWQucnVuLFxuICAgICAgICBxdWVyeSxcbiAgICAgICAgaGFzaDogaGFzaFJ1bihsb2FkZWQucnVuKSxcbiAgICAgIH07XG4gICAgICByZXR1cm4geyBvazogdHJ1ZSwgcnVuOiBjdXJyZW50LnJ1biwgcXVlcnkgfTtcbiAgICB9XG5cbiAgICBicmlkZ2Uub24oJ3dlYnZpZXcucmVhZHknLCBhc3luYyAoX3BheWxvYWQsIHsgcmVxdWVzdElkIH0pID0+IHtcbiAgICAgIGJyaWRnZS5yZXNwb25kKFxuICAgICAgICAnY2FwYWJpbGl0aWVzLmRhdGEnLFxuICAgICAgICB7XG4gICAgICAgICAgcHJvdG9jb2xWZXJzaW9uOiBQUk9UT0NPTF9WRVJTSU9OLFxuICAgICAgICAgIGV4dGVuc2lvblZlcnNpb24sXG4gICAgICAgICAgYWRhcHRlcnM6IHJlZ2lzdHJ5LmNhcGFiaWxpdHlNYXRyaXgoKSxcbiAgICAgICAgICBjYXBhYmlsaXRpZXM6IHtcbiAgICAgICAgICAgIGNmcDogZmFsc2UsXG4gICAgICAgICAgICBjYWxsR3JhcGg6IHRydWUsXG4gICAgICAgICAgICBkYXRhRmxvdzogZmFsc2UsXG4gICAgICAgICAgICBob3ZlclByZXZpZXc6IGZhbHNlLFxuICAgICAgICAgICAgcHJvamVjdEluZGV4OiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGRlbW9Nb2RlOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICByZXF1ZXN0SWQsXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgYnJpZGdlLm9uKCdncmFwaC5sb2FkJywgYXN5bmMgKF9wYXlsb2FkLCB7IHJlcXVlc3RJZCB9KSA9PiB7XG4gICAgICBjb25zdCBsb2FkZWQgPSBhd2FpdCBlbnN1cmVSdW4oKTtcbiAgICAgIGlmICghbG9hZGVkLm9rKSB7XG4gICAgICAgIGJyaWRnZS5yZXNwb25kKFxuICAgICAgICAgICdwcm90b2NvbC5lcnJvcicsXG4gICAgICAgICAgY3JlYXRlRXJyb3JQYXlsb2FkKGxvYWRlZC5jb2RlLCBsb2FkZWQubWVzc2FnZSwgeyBpc3N1ZXM6IGxvYWRlZC5pc3N1ZXMgfSksXG4gICAgICAgICAgcmVxdWVzdElkLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBicmlkZ2UucmVzcG9uZCgnZ3JhcGguZGF0YScsIHsgZHRvOiB0b0R0byhidWlsZEdyYXBoKGxvYWRlZC5ydW4pKSB9LCByZXF1ZXN0SWQpO1xuICAgIH0pO1xuXG4gICAgYnJpZGdlLm9uKCdjc3IubG9hZCcsIGFzeW5jIChwYXlsb2FkLCB7IHJlcXVlc3RJZCB9KSA9PiB7XG4gICAgICBjb25zdCBsb2FkZWQgPSBhd2FpdCBlbnN1cmVSdW4odHlwZW9mIHBheWxvYWQucGF0aCA9PT0gJ3N0cmluZycgPyBwYXlsb2FkLnBhdGggOiB1bmRlZmluZWQpO1xuICAgICAgaWYgKCFsb2FkZWQub2spIHtcbiAgICAgICAgYnJpZGdlLnJlc3BvbmQoXG4gICAgICAgICAgJ3Byb3RvY29sLmVycm9yJyxcbiAgICAgICAgICBjcmVhdGVFcnJvclBheWxvYWQobG9hZGVkLmNvZGUsIGxvYWRlZC5tZXNzYWdlLCB7IGlzc3VlczogbG9hZGVkLmlzc3VlcyB9KSxcbiAgICAgICAgICByZXF1ZXN0SWQsXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGJyaWRnZS5yZXNwb25kKFxuICAgICAgICAnY3NyLmRhdGEnLFxuICAgICAgICB7XG4gICAgICAgICAgcnVuOiBsb2FkZWQucnVuLFxuICAgICAgICAgIGhhc2g6IGN1cnJlbnQ/Lmhhc2ggPz8gaGFzaFJ1bihsb2FkZWQucnVuKSxcbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWVzdElkLFxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFJ1biBhIHR5cGVkIHF1ZXJ5IGFnYWluc3QgdGhlIGN1cnJlbnQgcnVuLiBRdWVyeS1sZXZlbCBkZWdyYWRhdGlvbiBpc1xuICAgICAqIGNhcnJpZWQgaW4gYHF1ZXJ5LmRhdGFgLCBub3QgYXMgYSB0cmFuc3BvcnQgZXJyb3IuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30ga2luZFxuICAgICAqIEBwYXJhbSB7KHBheWxvYWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCBxdWVyeTogUXVlcnlMYXllcikgPT4ge29rOiB0cnVlLCB2YWx1ZTogdW5rbm93bn0gfCB7b2s6IGZhbHNlLCBjb2RlOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZ319IHJ1blxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHF1ZXJ5SGFuZGxlcihraW5kLCBydW4pIHtcbiAgICAgIGJyaWRnZS5vbihraW5kLCBhc3luYyAocGF5bG9hZCwgeyByZXF1ZXN0SWQgfSkgPT4ge1xuICAgICAgICBjb25zdCBsb2FkZWQgPSBhd2FpdCBlbnN1cmVSdW4oKTtcbiAgICAgICAgaWYgKCFsb2FkZWQub2spIHtcbiAgICAgICAgICBicmlkZ2UucmVzcG9uZChcbiAgICAgICAgICAgICdwcm90b2NvbC5lcnJvcicsXG4gICAgICAgICAgICBjcmVhdGVFcnJvclBheWxvYWQobG9hZGVkLmNvZGUsIGxvYWRlZC5tZXNzYWdlLCB7IGlzc3VlczogbG9hZGVkLmlzc3VlcyB9KSxcbiAgICAgICAgICAgIHJlcXVlc3RJZCxcbiAgICAgICAgICApO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXN1bHQgPSBydW4ocGF5bG9hZCwgbG9hZGVkLnF1ZXJ5KTtcbiAgICAgICAgYnJpZGdlLnJlc3BvbmQoJ3F1ZXJ5LmRhdGEnLCByZXN1bHQsIHJlcXVlc3RJZCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBxdWVyeUhhbmRsZXIoJ3F1ZXJ5LnN5bWJvbCcsIChwYXlsb2FkLCBxdWVyeSkgPT5cbiAgICAgIHF1ZXJ5LnN5bWJvbEJ5SWQodHlwZW9mIHBheWxvYWQuc3ltYm9sSWQgPT09ICdzdHJpbmcnID8gcGF5bG9hZC5zeW1ib2xJZCA6ICcnKSxcbiAgICApO1xuICAgIHF1ZXJ5SGFuZGxlcigncXVlcnkuc3ltYm9scycsIChwYXlsb2FkLCBxdWVyeSkgPT5cbiAgICAgIHF1ZXJ5LnN5bWJvbHNJbkZpbGUodHlwZW9mIHBheWxvYWQuZmlsZUlkID09PSAnc3RyaW5nJyA/IHBheWxvYWQuZmlsZUlkIDogJycpLFxuICAgICk7XG4gICAgcXVlcnlIYW5kbGVyKCdxdWVyeS5jYWxsZXJzJywgKHBheWxvYWQsIHF1ZXJ5KSA9PlxuICAgICAgcXVlcnkuY2FsbGVycyh0eXBlb2YgcGF5bG9hZC5zeW1ib2xJZCA9PT0gJ3N0cmluZycgPyBwYXlsb2FkLnN5bWJvbElkIDogJycsIHtcbiAgICAgICAgc3RhdHVzZXM6IEFycmF5LmlzQXJyYXkocGF5bG9hZC5zdGF0dXNlcykgPyBwYXlsb2FkLnN0YXR1c2VzIDogdW5kZWZpbmVkLFxuICAgICAgfSksXG4gICAgKTtcbiAgICBxdWVyeUhhbmRsZXIoJ3F1ZXJ5LmNhbGxlZXMnLCAocGF5bG9hZCwgcXVlcnkpID0+XG4gICAgICBxdWVyeS5jYWxsZWVzKHR5cGVvZiBwYXlsb2FkLnN5bWJvbElkID09PSAnc3RyaW5nJyA/IHBheWxvYWQuc3ltYm9sSWQgOiAnJywge1xuICAgICAgICBzdGF0dXNlczogQXJyYXkuaXNBcnJheShwYXlsb2FkLnN0YXR1c2VzKSA/IHBheWxvYWQuc3RhdHVzZXMgOiB1bmRlZmluZWQsXG4gICAgICB9KSxcbiAgICApO1xuICAgIHF1ZXJ5SGFuZGxlcigncXVlcnkuY29uc3RydWN0cycsIChwYXlsb2FkLCBxdWVyeSkgPT5cbiAgICAgIHF1ZXJ5LmNvbnN0cnVjdHNPZih0eXBlb2YgcGF5bG9hZC5zeW1ib2xJZCA9PT0gJ3N0cmluZycgPyBwYXlsb2FkLnN5bWJvbElkIDogJycpLFxuICAgICk7XG4gICAgcXVlcnlIYW5kbGVyKCdxdWVyeS5jYXBhYmlsaXRpZXMnLCAoX3BheWxvYWQsIHF1ZXJ5KSA9PiBxdWVyeS5jYXBhYmlsaXRpZXMoKSk7XG5cbiAgICBicmlkZ2Uub24oJ25vZGUuc2VsZWN0JywgYXN5bmMgKHBheWxvYWQpID0+IHtcbiAgICAgIGxvZ2dlci5kZWJ1ZygncGFuZWwubm9kZV9zZWxlY3RlZCcsIHsgbm9kZUlkOiBwYXlsb2FkLm5vZGVJZCA/PyBudWxsIH0pO1xuICAgIH0pO1xuXG4gICAgYnJpZGdlLm9uKCdwYW5lbC5waW5nJywgYXN5bmMgKF9wYXlsb2FkLCB7IHJlcXVlc3RJZCB9KSA9PiB7XG4gICAgICBicmlkZ2UucmVzcG9uZCgncGFuZWwucG9uZycsIHsgYXQ6IERhdGUubm93KCkgfSwgcmVxdWVzdElkKTtcbiAgICB9KTtcblxuICAgIHRhcmdldC53ZWJ2aWV3Lm9uRGlkUmVjZWl2ZU1lc3NhZ2UoKG1lc3NhZ2UpID0+IHtcbiAgICAgIHZvaWQgYnJpZGdlLmhhbmRsZU1lc3NhZ2UobWVzc2FnZSk7XG4gICAgfSk7XG5cbiAgICB0YXJnZXQub25EaWREaXNwb3NlKCgpID0+IHtcbiAgICAgIGN1cnJlbnQgPSBudWxsO1xuICAgICAgYnJpZGdlLmRpc3Bvc2UoJ3BhbmVsX2Rpc3Bvc2VkJyk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBQdXNoIHByb2dyZXNzIHdpdGhvdXQgYSByZXF1ZXN0LiBSZXNlcnZlZCBmb3IgUGhhc2UgMiBsb25nLXJ1bm5pbmdcbiAgICAgKiBhbmFseXNlczsgdGhlIGtpbmQgYW5kIGRpcmVjdGlvbiBhcmUgcGFydCBvZiB0aGUgcHJvdG9jb2wgbm93LlxuICAgICAqXG4gICAgICogQHBhcmFtIHt7cGhhc2U6IHN0cmluZywgZnJhY3Rpb24/OiBudW1iZXJ9fSBwcm9ncmVzc1xuICAgICAqL1xuICAgIGJyaWRnZS5lbWl0UHJvZ3Jlc3MgPSAocHJvZ3Jlc3MpID0+IHtcbiAgICAgIGlmICghYnJpZGdlLmlzRGlzcG9zZWQoKSkge1xuICAgICAgICBicmlkZ2UucmVzcG9uZCgnYW5hbHlzaXMucHJvZ3Jlc3MnLCBwcm9ncmVzcyk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBicmlkZ2U7XG4gIH07XG59XG4iLCAiLyoqXG4gKiBDb21tYW5kIHJlZ2lzdHJhdGlvbi5cbiAqXG4gKiBFdmVyeSBjb21tYW5kIGdvZXMgdGhyb3VnaCBgZ3VhcmRgLCB3aGljaCBtZWFucyBubyBjb21tYW5kIGhhbmRsZXIgY2FuIHRha2VcbiAqIGRvd24gdGhlIGV4dGVuc2lvbiBob3N0OiBmYWlsdXJlcyBiZWNvbWUgYSBsb2cgZW50cnkgYW5kIG9uZSB1c2VyLXZpc2libGVcbiAqIG1lc3NhZ2UuXG4gKi9cblxuaW1wb3J0ICogYXMgdnNjb2RlIGZyb20gJ3ZzY29kZSc7XG5pbXBvcnQgeyBidWlsZERpYWdub3N0aWNzUmVwb3J0LCBvcGVuRGlhZ25vc3RpY3NEb2N1bWVudCB9IGZyb20gJy4vZGlhZ25vc3RpY3MuanMnO1xuXG4vKipcbiAqIEBwYXJhbSB7e1xuICogICBjb250ZXh0OiB2c2NvZGUuRXh0ZW5zaW9uQ29udGV4dCxcbiAqICAgbG9nZ2VyOiB7aW5mbzogRnVuY3Rpb24sIHdhcm46IEZ1bmN0aW9uLCBlcnJvcjogRnVuY3Rpb24sIHNob3c6IEZ1bmN0aW9uLCBsZXZlbDogKCkgPT4gc3RyaW5nfSxcbiAqICAgcGFuZWxNYW5hZ2VyOiB7c2hvdzogKCkgPT4gdW5rbm93biwgc2hvd0ZpbGU6IChwYXRoOiBzdHJpbmcpID0+IHVua25vd24sIGlzT3BlbjogKCkgPT4gYm9vbGVhbiwgcGVuZGluZ1JlcXVlc3RzOiAoKSA9PiBudW1iZXJ9LFxuICogICByZWdpc3RyeTogUmV0dXJuVHlwZTx0eXBlb2YgaW1wb3J0KCcuLi9jb3JlL2FkYXB0ZXJSZWdpc3RyeS5qcycpLmNyZWF0ZUFkYXB0ZXJSZWdpc3RyeT4sXG4gKiAgIGV4dGVuc2lvblZlcnNpb246IHN0cmluZyxcbiAqIH19IG9wdGlvbnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ29tbWFuZHMoeyBjb250ZXh0LCBsb2dnZXIsIHBhbmVsTWFuYWdlciwgcmVnaXN0cnksIGV4dGVuc2lvblZlcnNpb24gfSkge1xuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvbW1hbmRJZFxuICAgKiBAcGFyYW0geygpID0+IHVua25vd24gfCBQcm9taXNlPHVua25vd24+fSBoYW5kbGVyXG4gICAqL1xuICBmdW5jdGlvbiByZWdpc3Rlcihjb21tYW5kSWQsIGhhbmRsZXIpIHtcbiAgICBjb25zdCBkaXNwb3NhYmxlID0gdnNjb2RlLmNvbW1hbmRzLnJlZ2lzdGVyQ29tbWFuZChjb21tYW5kSWQsIGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBoYW5kbGVyKCk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuICAgICAgICBjb25zdCBjb2RlID0gLyoqIEB0eXBlIHt7Y29kZT86IHN0cmluZ319ICovIChlcnJvcik/LmNvZGUgPz8gJ0VfSU5URVJOQUwnO1xuICAgICAgICBsb2dnZXIuZXJyb3IoJ2NvbW1hbmQuZmFpbGVkJywgeyBjb21tYW5kSWQsIGNvZGUsIGVycm9yOiBtZXNzYWdlIH0pO1xuICAgICAgICBjb25zdCBjaG9pY2UgPSBhd2FpdCB2c2NvZGUud2luZG93LnNob3dFcnJvck1lc3NhZ2UoYENvZGVGbG93OiAke21lc3NhZ2V9YCwgJ1Nob3cgbG9nJyk7XG4gICAgICAgIGlmIChjaG9pY2UgPT09ICdTaG93IGxvZycpIHtcbiAgICAgICAgICBsb2dnZXIuc2hvdygpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgfSk7XG4gICAgY29udGV4dC5zdWJzY3JpcHRpb25zLnB1c2goZGlzcG9zYWJsZSk7XG4gIH1cblxuICByZWdpc3RlcignY29kZWZsb3cub3BlbkV4cGxvcmVyJywgKCkgPT4ge1xuICAgIGxvZ2dlci5pbmZvKCdjb21tYW5kLm9wZW5FeHBsb3JlcicpO1xuICAgIHBhbmVsTWFuYWdlci5zaG93KCk7XG4gIH0pO1xuXG4gIHJlZ2lzdGVyKCdjb2RlZmxvdy5hbmFseXplQWN0aXZlRmlsZScsICgpID0+IHtcbiAgICBjb25zdCBlZGl0b3IgPSB2c2NvZGUud2luZG93LmFjdGl2ZVRleHRFZGl0b3I7XG4gICAgaWYgKCFlZGl0b3IgfHwgZWRpdG9yLmRvY3VtZW50LnVyaS5zY2hlbWUgIT09ICdmaWxlJykge1xuICAgICAgdm9pZCB2c2NvZGUud2luZG93LnNob3dXYXJuaW5nTWVzc2FnZShcbiAgICAgICAgJ0NvZGVGbG93OiBvcGVuIGEgZmlsZSBpbiB0aGUgd29ya3NwYWNlIGJlZm9yZSBhbmFseXNpbmcgaXQuJyxcbiAgICAgICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGxvZ2dlci5pbmZvKCdjb21tYW5kLmFuYWx5emVBY3RpdmVGaWxlJywge1xuICAgICAgZXh0ZW5zaW9uOiBlZGl0b3IuZG9jdW1lbnQudXJpLnBhdGguc3BsaXQoJy4nKS5wb3AoKSxcbiAgICB9KTtcbiAgICBwYW5lbE1hbmFnZXIuc2hvd0ZpbGUoZWRpdG9yLmRvY3VtZW50LnVyaS5mc1BhdGgpO1xuICB9KTtcblxuICByZWdpc3RlcignY29kZWZsb3cuc2hvd0RpYWdub3N0aWNzJywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHJlcG9ydCA9IGJ1aWxkRGlhZ25vc3RpY3NSZXBvcnQoe1xuICAgICAgcmVnaXN0cnksXG4gICAgICBwYW5lbE1hbmFnZXIsXG4gICAgICBsb2dnZXIsXG4gICAgICBleHRlbnNpb25WZXJzaW9uLFxuICAgIH0pO1xuICAgIGF3YWl0IG9wZW5EaWFnbm9zdGljc0RvY3VtZW50KHJlcG9ydCk7XG4gIH0pO1xuXG4gIHJlZ2lzdGVyKCdjb2RlZmxvdy5zaG93TG9nJywgKCkgPT4ge1xuICAgIGxvZ2dlci5zaG93KCk7XG4gIH0pO1xufVxuIiwgIi8qKlxuICogRGlhZ25vc3RpY3MgcmVwb3J0LlxuICpcbiAqIE11c3QgYW5zd2VyIFwid2h5IGlzbid0IHRoaXMgd29ya2luZz9cIiB3aXRob3V0IGFza2luZyB0aGUgdXNlciB0byBvcGVuIGFuXG4gKiBlZGl0b3IncyBkZXZlbG9wZXIgdG9vbHMuIEl0IGNvbnRhaW5zIHZlcnNpb25zLCBjYXBhYmlsaXR5IHN0YXRlLCBhbmQgc2V0dGluZ1xuICogdmFsdWVzIFx1MjAxNCBuZXZlciBzb3VyY2UgdGV4dCBhbmQgbmV2ZXIgc2VjcmV0cy5cbiAqL1xuXG5pbXBvcnQgKiBhcyB2c2NvZGUgZnJvbSAndnNjb2RlJztcbmltcG9ydCB7IFBST1RPQ09MX1ZFUlNJT04gfSBmcm9tICcuLi9jb3JlL3Byb3RvY29sL2VudmVsb3BlLmpzJztcblxuLyoqXG4gKiBAcGFyYW0ge3tcbiAqICAgcmVnaXN0cnk6IFJldHVyblR5cGU8dHlwZW9mIGltcG9ydCgnLi4vY29yZS9hZGFwdGVyUmVnaXN0cnkuanMnKS5jcmVhdGVBZGFwdGVyUmVnaXN0cnk+LFxuICogICBwYW5lbE1hbmFnZXI6IHtpc09wZW46ICgpID0+IGJvb2xlYW4sIHBlbmRpbmdSZXF1ZXN0czogKCkgPT4gbnVtYmVyfSxcbiAqICAgbG9nZ2VyOiB7bGV2ZWw6ICgpID0+IHN0cmluZ30sXG4gKiAgIGV4dGVuc2lvblZlcnNpb246IHN0cmluZyxcbiAqIH19IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZERpYWdub3N0aWNzUmVwb3J0KHsgcmVnaXN0cnksIHBhbmVsTWFuYWdlciwgbG9nZ2VyLCBleHRlbnNpb25WZXJzaW9uIH0pIHtcbiAgY29uc3QgdmVyc2lvbnMgPSBwcm9jZXNzLnZlcnNpb25zID8/IHt9O1xuICBjb25zdCBjb25maWd1cmF0aW9uID0gdnNjb2RlLndvcmtzcGFjZS5nZXRDb25maWd1cmF0aW9uKCdjb2RlZmxvdycpO1xuICBjb25zdCB3b3Jrc3BhY2VGb2xkZXJzID0gKHZzY29kZS53b3Jrc3BhY2Uud29ya3NwYWNlRm9sZGVycyA/PyBbXSkubWFwKChmb2xkZXIpID0+IGZvbGRlci5uYW1lKTtcblxuICBjb25zdCBsaW5lcyA9IFtcbiAgICAnIyBDb2RlRmxvdyBkaWFnbm9zdGljcycsXG4gICAgJycsXG4gICAgJ0NvcHkgdGhpcyByZXBvcnQgd2hlbiBmaWxpbmcgYW4gaXNzdWUuIEl0IGNvbnRhaW5zIG5vIHNvdXJjZSB0ZXh0LicsXG4gICAgJycsXG4gICAgJyMjIEJ1aWxkJyxcbiAgICAnJyxcbiAgICBgLSBFeHRlbnNpb246ICR7ZXh0ZW5zaW9uVmVyc2lvbn1gLFxuICAgIGAtIFZTIENvZGU6ICR7dnNjb2RlLnZlcnNpb259YCxcbiAgICBgLSBQcm90b2NvbDogdiR7UFJPVE9DT0xfVkVSU0lPTn1gLFxuICAgIGAtIE5vZGU6ICR7dmVyc2lvbnMubm9kZSA/PyAndW5rbm93bid9YCxcbiAgICBgLSBFbGVjdHJvbjogJHt2ZXJzaW9ucy5lbGVjdHJvbiA/PyAnbi9hJ31gLFxuICAgIGAtIENocm9taXVtOiAke3ZlcnNpb25zLmNocm9tZSA/PyAnbi9hJ31gLFxuICAgIGAtIFBsYXRmb3JtOiAke3Byb2Nlc3MucGxhdGZvcm19ICR7cHJvY2Vzcy5hcmNofWAsXG4gICAgJycsXG4gICAgJyMjIFdvcmtzcGFjZScsXG4gICAgJycsXG4gICAgYC0gRm9sZGVyczogJHt3b3Jrc3BhY2VGb2xkZXJzLmxlbmd0aCA+IDAgPyB3b3Jrc3BhY2VGb2xkZXJzLmpvaW4oJywgJykgOiAnKG5vbmUpJ31gLFxuICAgIGAtIFdvcmtzcGFjZSB0cnVzdGVkOiAke3ZzY29kZS53b3Jrc3BhY2UuaXNUcnVzdGVkID8gJ3llcycgOiAnbm8nfWAsXG4gICAgJycsXG4gICAgJyMjIFJ1bnRpbWUnLFxuICAgICcnLFxuICAgIGAtIExvZyBsZXZlbDogJHtsb2dnZXIubGV2ZWwoKX1gLFxuICAgIGAtIEdyYXBoIHBhbmVsIG9wZW46ICR7cGFuZWxNYW5hZ2VyLmlzT3BlbigpID8gJ3llcycgOiAnbm8nfWAsXG4gICAgYC0gUGVuZGluZyB3ZWJ2aWV3IHJlcXVlc3RzOiAke3BhbmVsTWFuYWdlci5wZW5kaW5nUmVxdWVzdHMoKX1gLFxuICAgICcnLFxuICAgICcjIyBBZGFwdGVycycsXG4gICAgJycsXG4gIF07XG5cbiAgY29uc3QgYWRhcHRlcnMgPSByZWdpc3RyeS5jYXBhYmlsaXR5TWF0cml4KCk7XG4gIGlmIChhZGFwdGVycy5sZW5ndGggPT09IDApIHtcbiAgICBsaW5lcy5wdXNoKCctIE5vIGFkYXB0ZXJzIHJlZ2lzdGVyZWQuJyk7XG4gIH0gZWxzZSB7XG4gICAgZm9yIChjb25zdCBhZGFwdGVyIG9mIGFkYXB0ZXJzKSB7XG4gICAgICBjb25zdCBlbmFibGVkID0gT2JqZWN0LmVudHJpZXMoYWRhcHRlci5jYXBhYmlsaXRpZXMpXG4gICAgICAgIC5maWx0ZXIoKFssIHZhbHVlXSkgPT4gdmFsdWUpXG4gICAgICAgIC5tYXAoKFtrZXldKSA9PiBrZXkpO1xuICAgICAgbGluZXMucHVzaChcbiAgICAgICAgYC0gJHthZGFwdGVyLmlkfSAoJHthZGFwdGVyLmxhbmd1YWdlcy5qb2luKCcsICcpfSk6ICR7XG4gICAgICAgICAgZW5hYmxlZC5sZW5ndGggPiAwID8gZW5hYmxlZC5qb2luKCcsICcpIDogJ25vIGNhcGFiaWxpdGllcydcbiAgICAgICAgfWAsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGxpbmVzLnB1c2goJycsICcjIyBTZXR0aW5ncycsICcnKTtcbiAgZm9yIChjb25zdCBrZXkgb2YgWydsb2dMZXZlbCcsICdwcm90b2NvbC50cmFjZU1lc3NhZ2VzJywgJ2V4cGxvcmVyLnJldGFpbkNvbnRleHQnXSkge1xuICAgIGxpbmVzLnB1c2goYC0gY29kZWZsb3cuJHtrZXl9OiAke0pTT04uc3RyaW5naWZ5KGNvbmZpZ3VyYXRpb24uZ2V0KGtleSkpfWApO1xuICB9XG5cbiAgbGluZXMucHVzaChcbiAgICAnJyxcbiAgICAnIyMgS25vd24gUGhhc2UgMCBsaW1pdHMnLFxuICAgICcnLFxuICAgICctIEdyYXBoIGRhdGEgY29tZXMgZnJvbSB0aGUgbW9jayBhZGFwdGVyOyBubyByZWFsIEMrKyBvciBKYXZhU2NyaXB0IGFuYWx5c2lzIGV4aXN0cyB5ZXQuJyxcbiAgICAnLSBObyBzb3VyY2UgcHJldmlldywgY2FsbCBncmFwaCwgZGF0YSBmbG93LCBpbmRleGluZywgb3IgZXhwbGFuYXRpb25zIHlldC4nLFxuICAgICctIENhcGFiaWxpdHkgZmxhZ3MgYWJvdmUgcmVmbGVjdCBhZGFwdGVyIGRlY2xhcmF0aW9ucywgbm90IHNoaXBwZWQgZmVhdHVyZXMuJyxcbiAgICAnJyxcbiAgKTtcblxuICByZXR1cm4gbGluZXMuam9pbignXFxuJyk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGNvbnRlbnRcbiAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb3BlbkRpYWdub3N0aWNzRG9jdW1lbnQoY29udGVudCkge1xuICBjb25zdCBkb2N1bWVudCA9IGF3YWl0IHZzY29kZS53b3Jrc3BhY2Uub3BlblRleHREb2N1bWVudCh7XG4gICAgY29udGVudCxcbiAgICBsYW5ndWFnZTogJ21hcmtkb3duJyxcbiAgfSk7XG4gIGF3YWl0IHZzY29kZS53aW5kb3cuc2hvd1RleHREb2N1bWVudChkb2N1bWVudCwgeyBwcmV2aWV3OiB0cnVlIH0pO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFTQSxJQUFBQSxVQUF3Qjs7O0FDRHhCLGFBQXdCOzs7QUNLakIsSUFB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QSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFDRixDQUFDO0FBU00sSUFBTSxxQkFBcUIsT0FBTyxPQUFPO0FBQUEsRUFDOUM7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFDRixDQUFDO0FBR00sSUFBTSw2QkFBNkIsT0FBTyxPQUFPO0FBQUEsRUFDdEQ7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFDRixDQUFDO0FBR00sSUFBTSxzQkFBc0IsT0FBTyxPQUFPO0FBQUEsRUFDL0M7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQ0YsQ0FBQztBQVFNLElBQU0sZUFBZSxPQUFPLE9BQU87QUFBQSxFQUN4QztBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFDRixDQUFDO0FBR00sSUFBTSwyQkFBMkIsT0FBTyxPQUFPO0FBQUEsRUFDcEQsa0JBQWtCO0FBQUEsRUFD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QWUsbUJBQW1CO0FBQUEsSUFDdEM7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBLGtCQUFrQjtBQUFBLEVBQ3BCLENBQUM7QUFFRCxtQkFBaUI7QUFBQSxJQUNmO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQSxrQkFBa0I7QUFBQSxFQUNwQixDQUFDO0FBRUQsVUFBUSxjQUFjLEtBQUs7QUFBQSxJQUN6QixVQUFVO0FBQ1IsbUJBQWEsUUFBUTtBQUFBLElBQ3ZCO0FBQUEsRUFDRixDQUFDO0FBRUQsU0FBTyxLQUFLLHVCQUF1QjtBQUFBLElBQ2pDLElBQUksS0FBSyxJQUFJLElBQUk7QUFBQSxJQUNqQixTQUFTO0FBQUEsSUFDVCxRQUFlO0FBQUEsSUFDZixTQUFnQixrQkFBVTtBQUFBLEVBQzVCLENBQUM7QUFHRCxTQUFPO0FBQUEsSUFDTCxTQUFTO0FBQUEsSUFDVCxpQkFBaUI7QUFBQSxJQUNqQjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0Y7QUFDRjtBQUVPLFNBQVMsYUFBYTtBQUU3QjsiLAogICJuYW1lcyI6IFsidnNjb2RlIiwgInBhdGgiLCAic3ltYm9sIiwgInJlbGF0aW9uc2hpcCIsICJwYXRoIiwgInN5bWJvbCIsICJyZWxhdGlvbnNoaXBzIiwgInJlbGF0aW9uc2hpcCIsICJpc1BsYWluT2JqZWN0IiwgInN5bWJvbCIsICJyZWxhdGlvbnNoaXAiLCAiY2xvbmVWYWx1ZSIsICJpc1BsYWluT2JqZWN0IiwgInN5bWJvbCIsICJyZWxhdGlvbnNoaXAiLCAidmVyc2lvbiIsICJzeW1ib2wiLCAicmVsYXRpb25zaGlwIiwgIm91dGdvaW5nIiwgImluY29taW5nIiwgImJ5SWQiLCAicGF0aCIsICJwYXRoIiwgInN5bWJvbCIsICJmaWxlSWQiLCAicmVsYXRpb25zaGlwcyIsICJieUlkIiwgInBhdGgiLCAiaWRlbnRpdHkiLCAic3ltYm9sIiwgImlzT2JqZWN0IiwgInJlbGF0aW9uc2hpcCIsICJzaXRlIiwgImltcG9ydF9wcm9taXNlcyIsICJpbXBvcnRfbm9kZV9wYXRoIiwgInBhdGgiLCAic3ltYm9sIiwgInJlbGF0aW9uc2hpcHMiLCAicmVsYXRpb25zaGlwIiwgInBhdGgiLCAiaW1wb3J0X25vZGVfcGF0aCIsICJwYXRoIiwgInRvUG9zaXgiLCAiZnMiLCAicGF0aCIsICJ0b1Bvc2l4IiwgInJ1blRvb2wiLCAidG9Qb3NpeCIsICJiYXNlbmFtZSIsICJydW5Ub29sIiwgImZzIiwgInBhdGgiLCAiREVGQVVMVF9USU1FT1VUX01TIiwgIkRFRkFVTFRfTUFYX09VVFBVVF9CWVRFUyIsICJ2c2NvZGUiLCAiaXNQbGFpbk9iamVjdCIsICJwYXRoIiwgInJlbGF0aW9uc2hpcHMiLCAic3ltYm9sIiwgInJlbGF0aW9uc2hpcCIsICJhcnJheU9mIiwgInN5bWJvbCIsICJyZWxhdGlvbnNoaXAiLCAiaXNQbGFpbk9iamVjdCIsICJpc1BsYWluT2JqZWN0IiwgImFycmF5T2YiLCAicGF0aCIsICJwYXRoIiwgImNyeXB0byIsICJ2c2NvZGUiLCAidnNjb2RlIl0KfQo=
