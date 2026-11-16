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
  let level = coerceLevel(
    vscode.workspace.getConfiguration("codeflow").get("logLevel", "warn")
  );
  const configListener = vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("codeflow.logLevel")) {
      level = coerceLevel(
        vscode.workspace.getConfiguration("codeflow").get("logLevel", "warn")
      );
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
var CSR_VERSION = "0.1.0-draft";
var SYMBOL_KINDS = Object.freeze([
  "file",
  "namespace",
  "module",
  "class",
  "struct",
  "function",
  "method",
  "constructor",
  "destructor",
  "closure",
  "variable",
  "parameter",
  "field",
  "property",
  "enum",
  "enum_member",
  "type_alias",
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
  "macro_expansion",
  "unknown_import_target",
  "overload_ambiguous",
  "out_of_scope",
  "parse_error",
  "index_stale",
  "too_deep",
  "mock_data"
]);
var COMPLETENESS_LEVELS = Object.freeze(["full", "partial", "syntactic_only"]);
var DIAGNOSTIC_SEVERITIES = Object.freeze(["info", "warning", "error"]);

// src/core/csr/entities.js
function createAnalysisRun(input) {
  return {
    runId: String(input.runId ?? ""),
    adapterId: String(input.adapterId ?? ""),
    language: String(input.language ?? ""),
    csrVersion: String(input.csrVersion ?? CSR_VERSION),
    completeness: (
      /** @type {AnalysisRun['completeness']} */
      input.completeness ?? "partial"
    ),
    files: Array.isArray(input.files) ? input.files : [],
    symbols: Array.isArray(input.symbols) ? input.symbols : [],
    relationships: Array.isArray(input.relationships) ? input.relationships : [],
    diagnostics: Array.isArray(input.diagnostics) ? input.diagnostics : []
  };
}
function validateAnalysisRun(run) {
  const issues = [];
  if (typeof run !== "object" || run === null || Array.isArray(run)) {
    return { ok: false, issues: [{ path: "$", message: "Analysis run must be an object." }] };
  }
  const candidate = (
    /** @type {Record<string, unknown>} */
    run
  );
  for (const field of ["runId", "adapterId", "language", "csrVersion"]) {
    if (typeof candidate[field] !== "string" || candidate[field].length === 0) {
      issues.push({ path: field, message: `${field} must be a non-empty string.` });
    }
  }
  if (!COMPLETENESS_LEVELS.includes(String(candidate.completeness))) {
    issues.push({
      path: "completeness",
      message: `completeness must be one of ${COMPLETENESS_LEVELS.join(", ")}.`
    });
  }
  const files = Array.isArray(candidate.files) ? candidate.files : [];
  if (!Array.isArray(candidate.files)) {
    issues.push({ path: "files", message: "files must be an array." });
  }
  const fileById = /* @__PURE__ */ new Map();
  files.forEach((file, index) => {
    const path = `files[${index}]`;
    if (typeof file !== "object" || file === null) {
      issues.push({ path, message: "File record must be an object." });
      return;
    }
    const record = (
      /** @type {Record<string, unknown>} */
      file
    );
    const fileId = record.fileId;
    if (typeof fileId !== "string" || fileId.length === 0) {
      issues.push({ path: `${path}.fileId`, message: "fileId must be a non-empty string." });
      return;
    }
    if (fileById.has(fileId)) {
      issues.push({ path: `${path}.fileId`, message: `Duplicate fileId "${fileId}".` });
      return;
    }
    fileById.set(fileId, record);
    if (typeof record.path !== "string" || record.path.length === 0) {
      issues.push({ path: `${path}.path`, message: "path must be a non-empty string." });
    }
    if (!Number.isInteger(record.lineCount) || Number(record.lineCount) < 1) {
      issues.push({ path: `${path}.lineCount`, message: "lineCount must be a positive integer." });
    }
  });
  const symbols = Array.isArray(candidate.symbols) ? candidate.symbols : [];
  if (!Array.isArray(candidate.symbols)) {
    issues.push({ path: "symbols", message: "symbols must be an array." });
  }
  const symbolIds = /* @__PURE__ */ new Set();
  symbols.forEach((symbol, index) => {
    const path = `symbols[${index}]`;
    if (typeof symbol !== "object" || symbol === null) {
      issues.push({ path, message: "Symbol must be an object." });
      return;
    }
    const record = (
      /** @type {Record<string, unknown>} */
      symbol
    );
    const symbolId = record.symbolId;
    if (typeof symbolId !== "string" || symbolId.length === 0) {
      issues.push({ path: `${path}.symbolId`, message: "symbolId must be a non-empty string." });
      return;
    }
    if (symbolIds.has(symbolId)) {
      issues.push({ path: `${path}.symbolId`, message: `Duplicate symbolId "${symbolId}".` });
      return;
    }
    symbolIds.add(symbolId);
    if (!SYMBOL_KINDS.includes(String(record.kind))) {
      issues.push({ path: `${path}.kind`, message: `Unknown symbol kind "${String(record.kind)}".` });
    }
    const declaration = record.declaration;
    if (typeof declaration !== "object" || declaration === null) {
      issues.push({ path: `${path}.declaration`, message: "declaration range is required." });
      return;
    }
    issues.push(...validateRange(declaration, `${path}.declaration`, fileById));
  });
  const relationships = Array.isArray(candidate.relationships) ? candidate.relationships : [];
  if (!Array.isArray(candidate.relationships)) {
    issues.push({ path: "relationships", message: "relationships must be an array." });
  }
  const relationshipIds = /* @__PURE__ */ new Set();
  relationships.forEach((relationship, index) => {
    const path = `relationships[${index}]`;
    if (typeof relationship !== "object" || relationship === null) {
      issues.push({ path, message: "Relationship must be an object." });
      return;
    }
    const record = (
      /** @type {Record<string, unknown>} */
      relationship
    );
    const id = record.relationshipId;
    if (typeof id !== "string" || id.length === 0) {
      issues.push({
        path: `${path}.relationshipId`,
        message: "relationshipId must be a non-empty string."
      });
      return;
    }
    if (relationshipIds.has(id)) {
      issues.push({ path: `${path}.relationshipId`, message: `Duplicate relationshipId "${id}".` });
      return;
    }
    relationshipIds.add(id);
    if (!RELATIONSHIP_TYPES.includes(String(record.type))) {
      issues.push({
        path: `${path}.type`,
        message: `Unknown relationship type "${String(record.type)}".`
      });
    }
    const status = String(record.status);
    if (!RESOLUTION_STATUSES.includes(status)) {
      issues.push({
        path: `${path}.status`,
        message: `status must be one of ${RESOLUTION_STATUSES.join(", ")}.`
      });
    } else if (status !== "resolved") {
      const reason = record.reasonCode;
      if (typeof reason !== "string" || reason.length === 0) {
        issues.push({
          path: `${path}.reasonCode`,
          message: `A "${status}" relationship must carry a reasonCode.`
        });
      } else if (!REASON_CODES.includes(reason)) {
        issues.push({
          path: `${path}.reasonCode`,
          message: `Unknown reasonCode "${reason}".`
        });
      }
    }
    const from = record.from;
    const to = record.to;
    if (typeof from !== "string" || from.length === 0) {
      issues.push({ path: `${path}.from`, message: "from must be a symbolId." });
    } else if (!symbolIds.has(from)) {
      issues.push({ path: `${path}.from`, message: `Unknown source symbol "${from}".` });
    }
    if (typeof to !== "string" || to.length === 0) {
      issues.push({ path: `${path}.to`, message: "to must be a symbolId or external target id." });
    } else if (status === "resolved" && !symbolIds.has(to)) {
      issues.push({
        path: `${path}.to`,
        message: `A resolved relationship must target a declared symbol; "${to}" is unknown.`
      });
    }
    if (record.site !== void 0) {
      if (typeof record.site !== "object" || record.site === null) {
        issues.push({ path: `${path}.site`, message: "site must be a range object." });
      } else {
        issues.push(...validateRange(record.site, `${path}.site`, fileById));
      }
    }
  });
  const diagnostics = Array.isArray(candidate.diagnostics) ? candidate.diagnostics : [];
  if (!Array.isArray(candidate.diagnostics)) {
    issues.push({ path: "diagnostics", message: "diagnostics must be an array." });
  }
  diagnostics.forEach((diagnostic, index) => {
    const path = `diagnostics[${index}]`;
    if (typeof diagnostic !== "object" || diagnostic === null) {
      issues.push({ path, message: "Diagnostic must be an object." });
      return;
    }
    const record = (
      /** @type {Record<string, unknown>} */
      diagnostic
    );
    if (!DIAGNOSTIC_SEVERITIES.includes(String(record.severity))) {
      issues.push({ path: `${path}.severity`, message: "Unknown diagnostic severity." });
    }
    if (typeof record.code !== "string" || record.code.length === 0) {
      issues.push({ path: `${path}.code`, message: "Diagnostic code is required." });
    }
    if (typeof record.message !== "string" || record.message.length === 0) {
      issues.push({ path: `${path}.message`, message: "Diagnostic message is required." });
    }
  });
  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return { ok: true, run: createAnalysisRun(candidate) };
}
function validateRange(range, path, fileById) {
  const issues = [];
  if (typeof range !== "object" || range === null) {
    return [{ path, message: "Range must be an object." }];
  }
  const record = (
    /** @type {Record<string, unknown>} */
    range
  );
  const fileId = record.fileId;
  if (typeof fileId !== "string" || !fileById.has(fileId)) {
    issues.push({ path: `${path}.fileId`, message: `Unknown fileId "${String(fileId)}".` });
  }
  for (const field of ["startLine", "startColumn", "endLine", "endColumn"]) {
    if (!Number.isInteger(record[field]) || Number(record[field]) < 0) {
      issues.push({ path: `${path}.${field}`, message: `${field} must be a non-negative integer.` });
    }
  }
  if (Number.isInteger(record.startLine) && Number.isInteger(record.endLine) && Number(record.endLine) < Number(record.startLine)) {
    issues.push({ path: `${path}.endLine`, message: "endLine must be >= startLine." });
  }
  if (Number.isInteger(record.startLine) && Number.isInteger(record.endLine) && Number(record.startLine) === Number(record.endLine) && Number.isInteger(record.startColumn) && Number.isInteger(record.endColumn) && Number(record.endColumn) < Number(record.startColumn)) {
    issues.push({ path: `${path}.endColumn`, message: "endColumn must be >= startColumn." });
  }
  const file = typeof fileId === "string" ? fileById.get(fileId) : void 0;
  if (file && Number.isInteger(record.endLine) && Number(record.endLine) >= Number(file.lineCount)) {
    issues.push({
      path: `${path}.endLine`,
      message: `endLine ${String(record.endLine)} exceeds lineCount ${String(file.lineCount)}.`
    });
  }
  return issues;
}

// src/core/adapterRegistry.js
var CAPABILITY_KEYS = [
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
];
function createCapabilities(input = {}) {
  const capabilities = {};
  for (const key of CAPABILITY_KEYS) {
    capabilities[key] = input[key] === true;
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
    if (!Array.isArray(descriptor.extensions) || descriptor.extensions.length === 0) {
      throw new TypeError(`Adapter "${descriptor.id}" must declare at least one file extension.`);
    }
    for (const extension of descriptor.extensions) {
      if (typeof extension !== "string" || !extension.startsWith(".") || extension !== extension.toLowerCase()) {
        throw new TypeError(
          `Adapter "${descriptor.id}" has an invalid extension "${String(extension)}"; use lower case with a leading dot.`
        );
      }
    }
    if (typeof descriptor.analyze !== "function") {
      throw new TypeError(`Adapter "${descriptor.id}" must provide an analyze function.`);
    }
    const capabilities = createCapabilities(descriptor.capabilities);
    adapters.set(descriptor.id, Object.freeze({ ...descriptor, capabilities }));
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
  async function analyze(input) {
    const adapter = resolve(input.path);
    if (!adapter) {
      return {
        ok: false,
        code: "E_UNSUPPORTED",
        message: `No adapter is registered for "${input.path}".`
      };
    }
    const startedAt = Date.now();
    let output;
    try {
      output = await adapter.analyze(input);
    } catch (error) {
      return {
        ok: false,
        code: "E_ADAPTER",
        message: `Adapter "${adapter.id}" failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
    const validation = validateAnalysisRun(output);
    if (!validation.ok) {
      return {
        ok: false,
        code: "E_VALIDATION",
        message: `Adapter "${adapter.id}" produced invalid CSR.`,
        issues: validation.issues
      };
    }
    return {
      ok: true,
      run: validation.run,
      adapterId: adapter.id,
      durationMs: Date.now() - startedAt
    };
  }
  return {
    register,
    list: () => [...adapters.values()],
    resolve,
    analyze,
    capabilityMatrix: () => [...adapters.values()].map((adapter) => ({
      id: adapter.id,
      languages: [...adapter.languages],
      capabilities: { ...adapter.capabilities }
    }))
  };
}

// src/adapters/mock/index.js
var MOCK_RUN_ID = "run:mock-1";
var FILES = [
  {
    fileId: "file:src/DBHandler.js",
    path: "src/DBHandler.js",
    language: "mock",
    contentHash: "sha256:mock-dbhandler",
    lineCount: 41
  },
  {
    fileId: "file:src/SQLiteHelper.js",
    path: "src/SQLiteHelper.js",
    language: "mock",
    contentHash: "sha256:mock-sqlitehelper",
    lineCount: 27
  }
];
var SYMBOLS = [
  {
    symbolId: "symbol:js:src/DBHandler.js:class:DBHandler",
    kind: "class",
    name: "DBHandler",
    qualifiedName: "DBHandler",
    declaration: {
      fileId: "file:src/DBHandler.js",
      startLine: 3,
      startColumn: 0,
      endLine: 30,
      endColumn: 1
    }
  },
  {
    symbolId: "symbol:js:src/DBHandler.js:method:DBHandler.check_db_exists",
    kind: "method",
    name: "check_db_exists",
    qualifiedName: "DBHandler.check_db_exists",
    declaration: {
      fileId: "file:src/DBHandler.js",
      startLine: 9,
      startColumn: 2,
      endLine: 22,
      endColumn: 3
    },
    extensions: { async: true, parameters: 1 }
  },
  {
    symbolId: "symbol:js:src/DBHandler.js:function:main",
    kind: "function",
    name: "main",
    qualifiedName: "main",
    declaration: {
      fileId: "file:src/DBHandler.js",
      startLine: 33,
      startColumn: 0,
      endLine: 40,
      endColumn: 1
    }
  },
  {
    symbolId: "symbol:js:src/SQLiteHelper.js:method:SQLiteHelper.checkData",
    kind: "method",
    name: "checkData",
    qualifiedName: "SQLiteHelper.checkData",
    declaration: {
      fileId: "file:src/SQLiteHelper.js",
      startLine: 6,
      startColumn: 2,
      endLine: 20,
      endColumn: 3
    }
  },
  {
    symbolId: "symbol:js:src/SQLiteHelper.js:class:SQLiteHelper",
    kind: "class",
    name: "SQLiteHelper",
    qualifiedName: "SQLiteHelper",
    declaration: {
      fileId: "file:src/SQLiteHelper.js",
      startLine: 2,
      startColumn: 0,
      endLine: 24,
      endColumn: 1
    }
  }
];
var RELATIONSHIPS = [
  {
    relationshipId: "rel:main-calls-check",
    type: "calls",
    from: "symbol:js:src/DBHandler.js:function:main",
    to: "symbol:js:src/DBHandler.js:method:DBHandler.check_db_exists",
    status: "resolved",
    site: {
      fileId: "file:src/DBHandler.js",
      startLine: 36,
      startColumn: 2,
      endLine: 36,
      endColumn: 20
    }
  },
  {
    relationshipId: "rel:check-calls-checkdata",
    type: "calls",
    from: "symbol:js:src/DBHandler.js:method:DBHandler.check_db_exists",
    to: "symbol:js:src/SQLiteHelper.js:method:SQLiteHelper.checkData",
    status: "resolved",
    site: {
      fileId: "file:src/DBHandler.js",
      startLine: 15,
      startColumn: 4,
      endLine: 15,
      endColumn: 27
    }
  },
  {
    relationshipId: "rel:check-calls-logger",
    type: "calls",
    from: "symbol:js:src/DBHandler.js:method:DBHandler.check_db_exists",
    to: "external:logger.info",
    status: "unresolved",
    reasonCode: "unknown_import_target",
    site: {
      fileId: "file:src/DBHandler.js",
      startLine: 19,
      startColumn: 4,
      endLine: 19,
      endColumn: 18
    }
  },
  {
    relationshipId: "rel:dbhandler-defines-method",
    type: "defines",
    from: "symbol:js:src/DBHandler.js:class:DBHandler",
    to: "symbol:js:src/DBHandler.js:method:DBHandler.check_db_exists",
    status: "resolved"
  }
];
var DIAGNOSTICS = [
  {
    severity: "warning",
    code: "mock_data",
    message: "This graph comes from the Phase 0 mock adapter. It demonstrates the pipeline; it is not analysis of your code.",
    affects: ["symbol:js:src/DBHandler.js:function:main"]
  },
  {
    severity: "info",
    code: "partial_coverage",
    message: "Mock analysis intentionally covers only the sample fixtures."
  }
];
function createMockAnalysis() {
  return {
    runId: MOCK_RUN_ID,
    adapterId: "mock",
    language: "mock",
    csrVersion: CSR_VERSION,
    completeness: "partial",
    files: FILES.map((file) => ({ ...file })),
    symbols: SYMBOLS.map((symbol) => ({ ...symbol, declaration: { ...symbol.declaration } })),
    relationships: RELATIONSHIPS.map((relationship) => ({
      ...relationship,
      site: relationship.site ? { ...relationship.site } : void 0
    })),
    diagnostics: DIAGNOSTICS.map((diagnostic) => ({ ...diagnostic }))
  };
}
var MOCK_FILE_TEXT = [
  "// Phase 0 mock fixture \u2014 not real project source.",
  "class DBHandler {",
  "  async check_db_exists(path) {",
  "    // ...",
  "  }",
  "}",
  "",
  "function main() {",
  '  new DBHandler().check_db_exists("./data.db");',
  "}"
].join("\n");
var mockAdapter = {
  id: "mock",
  displayName: "Mock adapter (Phase 0)",
  version: "0.0.1",
  languages: ["mock"],
  extensions: [".mock"],
  capabilities: createCapabilities({
    parse: true,
    discoverDeclarations: true,
    resolveCalls: true,
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

// src/extension/panel.js
var vscode2 = __toESM(require("vscode"), 1);
var import_node_crypto = __toESM(require("node:crypto"), 1);

// src/core/protocol/envelope.js
var PROTOCOL_VERSION = 1;
var MAX_PAYLOAD_BYTES = 1e6;
var KIND_PATTERN = /^[a-z]+(\.[a-z]+)+$/;
var REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
var WEBVIEW_TO_HOST = Object.freeze([
  "webview.ready",
  "graph.load",
  "node.select",
  "panel.ping"
]);
var HOST_TO_WEBVIEW = Object.freeze([
  "graph.data",
  "capabilities.data",
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
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function scanUnsafeKeys(value, path, depth) {
  if (depth > MAX_KEY_SCAN_DEPTH || value === null || typeof value !== "object") {
    return { ok: true };
  }
  const entries = Array.isArray(value) ? value.entries() : Object.entries(value);
  for (const [key, child] of entries) {
    const childPath = Array.isArray(value) ? `${path}[${key}]` : `${path}.${key}`;
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
  if (!isPlainObject(raw)) {
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
  if (!isPlainObject(payload)) {
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
          new ProtocolError("E_TIMEOUT", `No response to "${kind}" within ${effectiveTimeout} ms.`, {
            kind,
            requestId
          })
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

// src/core/graph/model.js
function buildGraph(run) {
  const nodes = /* @__PURE__ */ new Map();
  for (const symbol of run.symbols) {
    nodes.set(symbol.symbolId, {
      id: symbol.symbolId,
      label: displayName(symbol),
      kind: symbol.kind,
      status: "resolved",
      range: symbol.declaration,
      fileId: symbol.declaration.fileId,
      external: false
    });
  }
  const edges = [];
  const edgeIds = /* @__PURE__ */ new Set();
  for (const relationship of run.relationships) {
    if (!nodes.has(relationship.to)) {
      nodes.set(relationship.to, {
        id: relationship.to,
        label: placeholderLabel(relationship.to),
        kind: "unknown",
        status: relationship.status === "resolved" ? "unresolved" : relationship.status,
        range: null,
        fileId: null,
        external: true,
        badge: relationship.reasonCode
      });
    }
    if (!nodes.has(relationship.from)) {
      continue;
    }
    if (edgeIds.has(relationship.relationshipId)) {
      continue;
    }
    edgeIds.add(relationship.relationshipId);
    edges.push({
      id: relationship.relationshipId,
      from: relationship.from,
      to: relationship.to,
      type: relationship.type,
      status: relationship.status,
      reasonCode: relationship.reasonCode,
      label: relationship.reasonCode ? `${relationship.type} \xB7 ${relationship.reasonCode}` : relationship.type
    });
  }
  const degradations = [];
  if (run.completeness !== "full") {
    degradations.push(`Analysis completeness: ${run.completeness}`);
  }
  for (const diagnostic of run.diagnostics) {
    if (diagnostic.severity !== "info") {
      degradations.push(`${diagnostic.code}: ${diagnostic.message}`);
    }
  }
  return {
    graphId: `graph:${run.runId}`,
    runId: run.runId,
    language: run.language,
    adapterId: run.adapterId,
    completeness: run.completeness,
    nodes: [...nodes.values()].sort(byId),
    edges: edges.sort(byId),
    diagnostics: run.diagnostics.map((diagnostic) => ({
      code: diagnostic.code,
      message: diagnostic.message,
      severity: diagnostic.severity
    })),
    degradations
  };
}
function byId(a, b) {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}
function displayName(symbol) {
  if (symbol.kind === "file") {
    return symbol.name || symbol.qualifiedName;
  }
  return symbol.name || symbol.qualifiedName || symbol.symbolId;
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
    edges: graph.edges.map((edge) => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      type: edge.type,
      status: edge.status,
      label: edge.label,
      reasonCode: edge.reasonCode ?? null
    })),
    diagnostics: graph.diagnostics,
    degradations: graph.degradations,
    extent: { width: layout.width, height: layout.height },
    legend: { statuses, kinds }
  };
}

// src/extension/panel.js
function createPanelManager({ context, logger, registry, extensionVersion }) {
  let panel = null;
  let bridge = null;
  let runCounter = 0;
  function webviewRoot() {
    return vscode2.Uri.joinPath(context.extensionUri, "dist", "webview");
  }
  async function buildGraphDto(path) {
    runCounter += 1;
    const runId = `run:${Date.now().toString(36)}-${runCounter}`;
    const analysis = await registry.analyze({ path, runId });
    if (!analysis.ok) {
      return {
        ok: false,
        code: analysis.code,
        message: analysis.message,
        issues: analysis.issues
      };
    }
    return { ok: true, dto: toDto(buildGraph(analysis.run)) };
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
  function wire(target) {
    const loggerProxy = {
      debug: (
        /** @param {string} message @param {Record<string, unknown>} [fields] */
        (message, fields) => logger.debug(message, fields)
      ),
      warn: (message, fields) => logger.warn(message, fields),
      error: (message, fields) => logger.error(message, fields)
    };
    const nextBridge = createBridge({
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
    nextBridge.on("webview.ready", async (_payload, { requestId }) => {
      nextBridge.respond(
        "capabilities.data",
        {
          protocolVersion: PROTOCOL_VERSION,
          extensionVersion,
          adapters: registry.capabilityMatrix(),
          capabilities: {
            cfp: false,
            callGraph: false,
            dataFlow: false,
            hoverPreview: false,
            projectIndex: false
          },
          demoMode: true
        },
        requestId
      );
    });
    nextBridge.on("graph.load", async (_payload, { requestId }) => {
      const result = await buildGraphDto("sample.mock");
      if (!result.ok) {
        nextBridge.respond(
          "protocol.error",
          createErrorPayload(result.code, result.message, { issues: result.issues }),
          requestId
        );
        return;
      }
      nextBridge.respond("graph.data", { dto: result.dto }, requestId);
    });
    nextBridge.on("node.select", async (payload) => {
      logger.debug("panel.node_selected", { nodeId: payload.nodeId ?? null });
    });
    nextBridge.on("panel.ping", async (_payload, { requestId }) => {
      nextBridge.respond("panel.pong", { at: Date.now() }, requestId);
    });
    target.onDidReceiveMessage((message) => {
      void nextBridge.handleMessage(message);
    });
    target.onDidDispose(() => {
      nextBridge.dispose("panel_disposed");
      if (panel === target) {
        panel = null;
        bridge = null;
      }
    });
    return nextBridge;
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
    return created;
  }
  return {
    show,
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
  const workspaceFolders = (vscode3.workspace.workspaceFolders ?? []).map(
    (folder) => folder.name
  );
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
        const choice = await vscode4.window.showErrorMessage(
          `CodeFlow: ${message}`,
          "Show log"
        );
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
async function activate(context) {
  const startedAt = Date.now();
  const logger = createLogger(context);
  const registry = createAdapterRegistry();
  registry.register(mockAdapter);
  const panelManager = createPanelManager({
    context,
    logger,
    registry,
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2V4dGVuc2lvbi9leHRlbnNpb24uanMiLCAiLi4vc3JjL2V4dGVuc2lvbi9sb2cuanMiLCAiLi4vc3JjL2NvcmUvbG9nL3JlZGFjdC5qcyIsICIuLi9zcmMvY29yZS9jc3IvdHlwZXMuanMiLCAiLi4vc3JjL2NvcmUvY3NyL2VudGl0aWVzLmpzIiwgIi4uL3NyYy9jb3JlL2FkYXB0ZXJSZWdpc3RyeS5qcyIsICIuLi9zcmMvYWRhcHRlcnMvbW9jay9pbmRleC5qcyIsICIuLi9zcmMvZXh0ZW5zaW9uL3BhbmVsLmpzIiwgIi4uL3NyYy9jb3JlL3Byb3RvY29sL2VudmVsb3BlLmpzIiwgIi4uL3NyYy9jb3JlL3Byb3RvY29sL2JyaWRnZS5qcyIsICIuLi9zcmMvZXh0ZW5zaW9uL3BhbmVsVGVtcGxhdGUuanMiLCAiLi4vc3JjL2NvcmUvZ3JhcGgvbW9kZWwuanMiLCAiLi4vc3JjL2NvcmUvZ3JhcGgvbGF5b3V0LmpzIiwgIi4uL3NyYy9jb3JlL2dyYXBoL2R0by5qcyIsICIuLi9zcmMvZXh0ZW5zaW9uL2NvbW1hbmRzLmpzIiwgIi4uL3NyYy9leHRlbnNpb24vZGlhZ25vc3RpY3MuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKlxuICogRXh0ZW5zaW9uIGVudHJ5IHBvaW50LlxuICpcbiAqIEFjdGl2YXRpb24gaXMgZGVsaWJlcmF0ZWx5IGNoZWFwOiBjcmVhdGUgYSBsb2dnZXIsIGJ1aWxkIHRoZSBhZGFwdGVyIHJlZ2lzdHJ5LFxuICogcmVnaXN0ZXIgdGhyZWUgY29tbWFuZHMuIE5vdGhpbmcgdG91Y2hlcyB0aGUgZmlsZSBzeXN0ZW0sIHNwYXducyBhIHByb2Nlc3MsIG9yXG4gKiByZWFkcyB3b3Jrc3BhY2UgY29udGVudHMgdW50aWwgdGhlIHVzZXIgaW52b2tlcyBhIGNvbW1hbmQuIFRoYXQga2VlcHMgc3RhcnR1cFxuICogZmFzdCBhbmQga2VlcHMgUmVzdHJpY3RlZCBNb2RlIGluZXJ0LlxuICovXG5cbmltcG9ydCAqIGFzIHZzY29kZSBmcm9tICd2c2NvZGUnO1xuaW1wb3J0IHsgY3JlYXRlTG9nZ2VyIH0gZnJvbSAnLi9sb2cuanMnO1xuaW1wb3J0IHsgY3JlYXRlQWRhcHRlclJlZ2lzdHJ5IH0gZnJvbSAnLi4vY29yZS9hZGFwdGVyUmVnaXN0cnkuanMnO1xuaW1wb3J0IHsgbW9ja0FkYXB0ZXIgfSBmcm9tICcuLi9hZGFwdGVycy9tb2NrL2luZGV4LmpzJztcbmltcG9ydCB7IGNyZWF0ZVBhbmVsTWFuYWdlciB9IGZyb20gJy4vcGFuZWwuanMnO1xuaW1wb3J0IHsgcmVnaXN0ZXJDb21tYW5kcyB9IGZyb20gJy4vY29tbWFuZHMuanMnO1xuaW1wb3J0IHsgUFJPVE9DT0xfVkVSU0lPTiB9IGZyb20gJy4uL2NvcmUvcHJvdG9jb2wvZW52ZWxvcGUuanMnO1xuXG5jb25zdCBFWFRFTlNJT05fVkVSU0lPTiA9ICcwLjAuMSc7XG5cbi8qKlxuICogQHBhcmFtIHt2c2NvZGUuRXh0ZW5zaW9uQ29udGV4dH0gY29udGV4dFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYWN0aXZhdGUoY29udGV4dCkge1xuICBjb25zdCBzdGFydGVkQXQgPSBEYXRlLm5vdygpO1xuICBjb25zdCBsb2dnZXIgPSBjcmVhdGVMb2dnZXIoY29udGV4dCk7XG5cbiAgY29uc3QgcmVnaXN0cnkgPSBjcmVhdGVBZGFwdGVyUmVnaXN0cnkoKTtcbiAgcmVnaXN0cnkucmVnaXN0ZXIobW9ja0FkYXB0ZXIpO1xuXG4gIGNvbnN0IHBhbmVsTWFuYWdlciA9IGNyZWF0ZVBhbmVsTWFuYWdlcih7XG4gICAgY29udGV4dCxcbiAgICBsb2dnZXIsXG4gICAgcmVnaXN0cnksXG4gICAgZXh0ZW5zaW9uVmVyc2lvbjogRVhURU5TSU9OX1ZFUlNJT04sXG4gIH0pO1xuXG4gIHJlZ2lzdGVyQ29tbWFuZHMoe1xuICAgIGNvbnRleHQsXG4gICAgbG9nZ2VyLFxuICAgIHBhbmVsTWFuYWdlcixcbiAgICByZWdpc3RyeSxcbiAgICBleHRlbnNpb25WZXJzaW9uOiBFWFRFTlNJT05fVkVSU0lPTixcbiAgfSk7XG5cbiAgY29udGV4dC5zdWJzY3JpcHRpb25zLnB1c2goe1xuICAgIGRpc3Bvc2UoKSB7XG4gICAgICBwYW5lbE1hbmFnZXIuZGlzcG9zZSgpO1xuICAgIH0sXG4gIH0pO1xuXG4gIGxvZ2dlci5pbmZvKCdleHRlbnNpb24uYWN0aXZhdGVkJywge1xuICAgIG1zOiBEYXRlLm5vdygpIC0gc3RhcnRlZEF0LFxuICAgIHZlcnNpb246IEVYVEVOU0lPTl9WRVJTSU9OLFxuICAgIHZzY29kZTogdnNjb2RlLnZlcnNpb24sXG4gICAgdHJ1c3RlZDogdnNjb2RlLndvcmtzcGFjZS5pc1RydXN0ZWQsXG4gIH0pO1xuXG4gIC8vIFJldHVybmVkIGZvciBpbnRlZ3JhdGlvbiB0ZXN0cyBhbmQgZnV0dXJlIGNvbW1hbmRzOyBub3QgYSBwdWJsaWMgQVBJLlxuICByZXR1cm4ge1xuICAgIHZlcnNpb246IEVYVEVOU0lPTl9WRVJTSU9OLFxuICAgIHByb3RvY29sVmVyc2lvbjogUFJPVE9DT0xfVkVSU0lPTixcbiAgICByZWdpc3RyeSxcbiAgICBwYW5lbE1hbmFnZXIsXG4gICAgbG9nZ2VyLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVhY3RpdmF0ZSgpIHtcbiAgLy8gRGlzcG9zYWJsZXMgcmVnaXN0ZXJlZCBpbiBgY29udGV4dC5zdWJzY3JpcHRpb25zYCBoYW5kbGUgdGVhcmRvd24uXG59XG4iLCAiLyoqXG4gKiBPdXRwdXQtY2hhbm5lbCBsb2dnZXIuXG4gKlxuICogVGhlIG9ubHkgcGxhY2UgaW4gdGhlIGV4dGVuc2lvbiB0aGF0IGtub3dzIGhvdyB0byB3cml0ZSB0byBWUyBDb2RlLiBGb3JtYXR0aW5nXG4gKiBhbmQgcmVkYWN0aW9uIGxpdmUgaW4gYHNyYy9jb3JlL2xvZy9yZWRhY3QuanNgIHNvIHRoZXkgY2FuIGJlIHRlc3RlZCB3aXRob3V0IGFcbiAqIGhvc3QuXG4gKi9cblxuaW1wb3J0ICogYXMgdnNjb2RlIGZyb20gJ3ZzY29kZSc7XG5pbXBvcnQgeyBmb3JtYXRMb2dMaW5lIH0gZnJvbSAnLi4vY29yZS9sb2cvcmVkYWN0LmpzJztcblxuLyoqIEB0eXBlZGVmIHsnb2ZmJ3wnZXJyb3InfCd3YXJuJ3wnaW5mbyd8J2RlYnVnJ30gTG9nTGV2ZWwgKi9cblxuLyoqIEB0eXBlIHtSZWNvcmQ8TG9nTGV2ZWwsIG51bWJlcj59ICovXG5jb25zdCBMRVZFTF9SQU5LID0geyBvZmY6IDAsIGVycm9yOiAxLCB3YXJuOiAyLCBpbmZvOiAzLCBkZWJ1ZzogNCB9O1xuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEByZXR1cm5zIHtMb2dMZXZlbH1cbiAqL1xuZnVuY3Rpb24gY29lcmNlTGV2ZWwodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgJiYgdmFsdWUgaW4gTEVWRUxfUkFOSyA/IC8qKiBAdHlwZSB7TG9nTGV2ZWx9ICovICh2YWx1ZSkgOiAnd2Fybic7XG59XG5cbi8qKlxuICogQHBhcmFtIHt2c2NvZGUuRXh0ZW5zaW9uQ29udGV4dH0gY29udGV4dFxuICogQHJldHVybnMge3tcbiAqICAgZGVidWc6IChtZXNzYWdlOiBzdHJpbmcsIGZpZWxkcz86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSA9PiB2b2lkLFxuICogICBpbmZvOiAobWVzc2FnZTogc3RyaW5nLCBmaWVsZHM/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT4gdm9pZCxcbiAqICAgd2FybjogKG1lc3NhZ2U6IHN0cmluZywgZmllbGRzPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID0+IHZvaWQsXG4gKiAgIGVycm9yOiAobWVzc2FnZTogc3RyaW5nLCBmaWVsZHM/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT4gdm9pZCxcbiAqICAgc2hvdzogKCkgPT4gdm9pZCxcbiAqICAgbGV2ZWw6ICgpID0+IExvZ0xldmVsLFxuICogICBkaXNwb3NlOiAoKSA9PiB2b2lkLFxuICogfX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxvZ2dlcihjb250ZXh0KSB7XG4gIGNvbnN0IGNoYW5uZWwgPSB2c2NvZGUud2luZG93LmNyZWF0ZU91dHB1dENoYW5uZWwoJ0NvZGVGbG93Jyk7XG4gIGxldCBsZXZlbCA9IGNvZXJjZUxldmVsKFxuICAgIHZzY29kZS53b3Jrc3BhY2UuZ2V0Q29uZmlndXJhdGlvbignY29kZWZsb3cnKS5nZXQoJ2xvZ0xldmVsJywgJ3dhcm4nKSxcbiAgKTtcblxuICBjb25zdCBjb25maWdMaXN0ZW5lciA9IHZzY29kZS53b3Jrc3BhY2Uub25EaWRDaGFuZ2VDb25maWd1cmF0aW9uKChldmVudCkgPT4ge1xuICAgIGlmIChldmVudC5hZmZlY3RzQ29uZmlndXJhdGlvbignY29kZWZsb3cubG9nTGV2ZWwnKSkge1xuICAgICAgbGV2ZWwgPSBjb2VyY2VMZXZlbChcbiAgICAgICAgdnNjb2RlLndvcmtzcGFjZS5nZXRDb25maWd1cmF0aW9uKCdjb2RlZmxvdycpLmdldCgnbG9nTGV2ZWwnLCAnd2FybicpLFxuICAgICAgKTtcbiAgICB9XG4gIH0pO1xuICBjb250ZXh0LnN1YnNjcmlwdGlvbnMucHVzaChjaGFubmVsLCBjb25maWdMaXN0ZW5lcik7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7TG9nTGV2ZWx9IGVudHJ5TGV2ZWxcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW2ZpZWxkc11cbiAgICovXG4gIGZ1bmN0aW9uIHdyaXRlKGVudHJ5TGV2ZWwsIG1lc3NhZ2UsIGZpZWxkcykge1xuICAgIGlmIChMRVZFTF9SQU5LW2VudHJ5TGV2ZWxdID4gTEVWRUxfUkFOS1tsZXZlbF0gfHwgbGV2ZWwgPT09ICdvZmYnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNoYW5uZWwuYXBwZW5kTGluZShmb3JtYXRMb2dMaW5lKHsgbGV2ZWw6IGVudHJ5TGV2ZWwsIG1lc3NhZ2UsIGZpZWxkcyB9KSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGRlYnVnOiAobWVzc2FnZSwgZmllbGRzKSA9PiB3cml0ZSgnZGVidWcnLCBtZXNzYWdlLCBmaWVsZHMpLFxuICAgIGluZm86IChtZXNzYWdlLCBmaWVsZHMpID0+IHdyaXRlKCdpbmZvJywgbWVzc2FnZSwgZmllbGRzKSxcbiAgICB3YXJuOiAobWVzc2FnZSwgZmllbGRzKSA9PiB3cml0ZSgnd2FybicsIG1lc3NhZ2UsIGZpZWxkcyksXG4gICAgZXJyb3I6IChtZXNzYWdlLCBmaWVsZHMpID0+IHdyaXRlKCdlcnJvcicsIG1lc3NhZ2UsIGZpZWxkcyksXG4gICAgc2hvdzogKCkgPT4gY2hhbm5lbC5zaG93KHRydWUpLFxuICAgIGxldmVsOiAoKSA9PiBsZXZlbCxcbiAgICBkaXNwb3NlOiAoKSA9PiB7XG4gICAgICBjb25maWdMaXN0ZW5lci5kaXNwb3NlKCk7XG4gICAgICBjaGFubmVsLmRpc3Bvc2UoKTtcbiAgICB9LFxuICB9O1xufVxuIiwgIi8qKlxuICogTG9nIHJlZGFjdGlvbi5cbiAqXG4gKiBMb2dzIGFyZSBmb3IgZGlhZ25vc2luZyBDb2RlRmxvdywgbm90IGZvciByZXByb2R1Y2luZyBwcm9qZWN0IGNvbnRlbnRzLlxuICogVGhpcyBtb2R1bGUgaXMgdGhlIHNpbmdsZSBwbGFjZSB3aGVyZSBhIHZhbHVlIGJlY29tZXMgbG9nIHRleHQsIHNvIHRoZSBydWxlc1xuICogbGl2ZSBpbiBvbmUgdGVzdGVkIGZ1bmN0aW9uIGluc3RlYWQgb2YgYmVpbmcgcmUtaW1wbGVtZW50ZWQgYXQgY2FsbCBzaXRlcy5cbiAqXG4gKiBBYnNvbHV0ZSBydWxlczpcbiAqIC0gTmV2ZXIgbG9nIGFuYWx5emVkIHNvdXJjZSB0ZXh0LlxuICogLSBOZXZlciBsb2cgY3JlZGVudGlhbHMsIHRva2Vucywgb3Iga2V5cywgZXZlbiBpZiBhIGNhbGxlciBwYXNzZXMgdGhlbS5cbiAqIC0gQ2FwIGV2ZXJ5IHZhbHVlIHNvIG9uZSBiYWQgZmllbGQgY2Fubm90IGZsb29kIHRoZSBvdXRwdXQgY2hhbm5lbC5cbiAqL1xuXG5leHBvcnQgY29uc3QgTUFYX0ZJRUxEX0xFTkdUSCA9IDUwMDtcbmV4cG9ydCBjb25zdCBNQVhfRklFTERTID0gMjA7XG5jb25zdCBNQVhfREVQVEggPSAzO1xuXG5jb25zdCBTRUNSRVRfS0VZX1BBVFRFUk4gPVxuICAvKHBhc3Mod29yZCk/fHNlY3JldHx0b2tlbnxhcGlbLV9dP2tleXxhcGlrZXl8Y3JlZGVudGlhbHxhdXRob3JpemF0aW9ufGNvb2tpZXxwcml2YXRlWy1fXT9rZXkpL2k7XG5cbmNvbnN0IFNFQ1JFVF9WQUxVRV9QQVRURVJOUyA9IFtcbiAgWy9cXGJnaFtwb3Vzcl1fW0EtWmEtejAtOV17MjAsfVxcYi9nLCAnZ2gqXyoqKiddLFxuICBbL1xcYmdpdGh1Yl9wYXRfW0EtWmEtejAtOV9dezIwLH1cXGIvZywgJ2dpdGh1Yl9wYXRfKioqJ10sXG4gIFsvXFxic2stW0EtWmEtejAtOV17MjAsfVxcYi9nLCAnc2stKioqJ10sXG4gIFsvXFxiQUtJQVswLTlBLVpdezE2fVxcYi9nLCAnQUtJQSoqKiddLFxuICBbL1xcYnhveFtiYXByc10tW0EtWmEtejAtOS1dezEwLH1cXGIvZywgJ3hveCotKioqJ10sXG5dO1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBpbnB1dFxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZGFjdFN0cmluZyhpbnB1dCkge1xuICBsZXQgb3V0cHV0ID0gaW5wdXQ7XG4gIGZvciAoY29uc3QgW3BhdHRlcm4sIHJlcGxhY2VtZW50XSBvZiBTRUNSRVRfVkFMVUVfUEFUVEVSTlMpIHtcbiAgICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZShwYXR0ZXJuLCByZXBsYWNlbWVudCk7XG4gIH1cbiAgaWYgKG91dHB1dC5sZW5ndGggPiBNQVhfRklFTERfTEVOR1RIKSB7XG4gICAgY29uc3QgcmVtb3ZlZCA9IG91dHB1dC5sZW5ndGggLSBNQVhfRklFTERfTEVOR1RIO1xuICAgIG91dHB1dCA9IGAke291dHB1dC5zbGljZSgwLCBNQVhfRklFTERfTEVOR1RIKX1cdTIwMjYoKyR7cmVtb3ZlZH0gY2hhcnMpYDtcbiAgfVxuICByZXR1cm4gb3V0cHV0O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEBwYXJhbSB7bnVtYmVyfSBkZXB0aFxuICogQHJldHVybnMge3Vua25vd259XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWRhY3RWYWx1ZSh2YWx1ZSwgZGVwdGggPSAwKSB7XG4gIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHJlZGFjdFN0cmluZyh2YWx1ZSk7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgfHwgdHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbicpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2JpZ2ludCcpIHtcbiAgICByZXR1cm4gYCR7dmFsdWUudG9TdHJpbmcoKX1uYDtcbiAgfVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuICdbZnVuY3Rpb25dJztcbiAgfVxuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgIHJldHVybiB7IG5hbWU6IHZhbHVlLm5hbWUsIG1lc3NhZ2U6IHJlZGFjdFN0cmluZyh2YWx1ZS5tZXNzYWdlKSB9O1xuICB9XG4gIGlmIChkZXB0aCA+PSBNQVhfREVQVEgpIHtcbiAgICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyAnW2FycmF5XScgOiAnW29iamVjdF0nO1xuICB9XG4gIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZS5zbGljZSgwLCBNQVhfRklFTERTKS5tYXAoKGl0ZW0pID0+IHJlZGFjdFZhbHVlKGl0ZW0sIGRlcHRoICsgMSkpO1xuICB9XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG4gICAgLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi9cbiAgICBjb25zdCBvdXRwdXQgPSB7fTtcbiAgICBjb25zdCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXModmFsdWUpLnNsaWNlKDAsIE1BWF9GSUVMRFMpO1xuICAgIGZvciAoY29uc3QgW2tleSwgY2hpbGRdIG9mIGVudHJpZXMpIHtcbiAgICAgIG91dHB1dFtrZXldID0gU0VDUkVUX0tFWV9QQVRURVJOLnRlc3Qoa2V5KSA/ICcqKionIDogcmVkYWN0VmFsdWUoY2hpbGQsIGRlcHRoICsgMSk7XG4gICAgfVxuICAgIHJldHVybiBvdXRwdXQ7XG4gIH1cbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IHVuZGVmaW5lZH0gZmllbGRzXG4gKiBAcmV0dXJucyB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWRhY3RGaWVsZHMoZmllbGRzKSB7XG4gIGlmICghZmllbGRzKSB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG4gIC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovXG4gIGNvbnN0IG91dHB1dCA9IHt9O1xuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhmaWVsZHMpLnNsaWNlKDAsIE1BWF9GSUVMRFMpKSB7XG4gICAgb3V0cHV0W2tleV0gPSBTRUNSRVRfS0VZX1BBVFRFUk4udGVzdChrZXkpID8gJyoqKicgOiByZWRhY3RWYWx1ZSh2YWx1ZSk7XG4gIH1cbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuLyoqXG4gKiBSZW5kZXIgb25lIGxvZyBsaW5lLiBTdGFibGUgZm9ybWF0OiB0aW1lc3RhbXAsIGxldmVsLCBtZXNzYWdlLCBmaWVsZHMuXG4gKlxuICogQHBhcmFtIHt7bGV2ZWw6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nLCBmaWVsZHM/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgdGltZXN0YW1wPzogRGF0ZX19IGVudHJ5XG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0TG9nTGluZShlbnRyeSkge1xuICBjb25zdCB0aW1lc3RhbXAgPSAoZW50cnkudGltZXN0YW1wID8/IG5ldyBEYXRlKCkpLnRvSVNPU3RyaW5nKCk7XG4gIGNvbnN0IGxldmVsID0gZW50cnkubGV2ZWwudG9VcHBlckNhc2UoKS5wYWRFbmQoNSk7XG4gIGNvbnN0IGZpZWxkcyA9IHJlZGFjdEZpZWxkcyhlbnRyeS5maWVsZHMpO1xuICBjb25zdCBmaWVsZEtleXMgPSBPYmplY3Qua2V5cyhmaWVsZHMpO1xuICBjb25zdCBzdWZmaXggPSBmaWVsZEtleXMubGVuZ3RoID4gMCA/IGAgJHtKU09OLnN0cmluZ2lmeShmaWVsZHMpfWAgOiAnJztcbiAgcmV0dXJuIGBbJHt0aW1lc3RhbXB9XSAke2xldmVsfSAke3JlZGFjdFN0cmluZyhlbnRyeS5tZXNzYWdlKX0ke3N1ZmZpeH1gO1xufVxuIiwgIi8qKlxuICogQ29kZUZsb3cgU2VtYW50aWMgUmVwcmVzZW50YXRpb24gKENTUikgXHUyMDE0IGRyYWZ0IHZvY2FidWxhcnkuXG4gKlxuICogU1RBVFVTOiBEUkFGVC4gUGhhc2UgMCBuZWVkcyBqdXN0IGVub3VnaCBzdHJ1Y3R1cmUgdG8gcHJvdmUgdGhhdCB0aGUgZ3JhcGhcbiAqIGxheWVyIGlzIGxhbmd1YWdlLWluZGVwZW5kZW50LiBQaGFzZSAxIHJlcGxhY2VzIHRoaXMgd2l0aCB0aGUgbm9ybWF0aXZlXG4gKiBtb2RlbCwgdmFsaWRhdG9ycywgaWRlbnRpdHkgc3RyYXRlZ3ksIGFuZCBtaWdyYXRpb24gbWVjaGFuaXNtLlxuICpcbiAqIENvbnN1bWVycyBtdXN0IHRyZWF0IHRoZXNlIGVudW1zIGFzIGNsb3NlZC4gQWRkaW5nIGEgdmFsdWUgaXMgYSBzY2hlbWEgY2hhbmdlLFxuICogbm90IGEgbG9jYWwgZGVjaXNpb24uXG4gKi9cblxuZXhwb3J0IGNvbnN0IENTUl9WRVJTSU9OID0gJzAuMS4wLWRyYWZ0JztcblxuLyoqIEB0eXBlIHtyZWFkb25seSBzdHJpbmdbXX0gKi9cbmV4cG9ydCBjb25zdCBTWU1CT0xfS0lORFMgPSBPYmplY3QuZnJlZXplKFtcbiAgJ2ZpbGUnLFxuICAnbmFtZXNwYWNlJyxcbiAgJ21vZHVsZScsXG4gICdjbGFzcycsXG4gICdzdHJ1Y3QnLFxuICAnZnVuY3Rpb24nLFxuICAnbWV0aG9kJyxcbiAgJ2NvbnN0cnVjdG9yJyxcbiAgJ2Rlc3RydWN0b3InLFxuICAnY2xvc3VyZScsXG4gICd2YXJpYWJsZScsXG4gICdwYXJhbWV0ZXInLFxuICAnZmllbGQnLFxuICAncHJvcGVydHknLFxuICAnZW51bScsXG4gICdlbnVtX21lbWJlcicsXG4gICd0eXBlX2FsaWFzJyxcbiAgJ3Vua25vd24nLFxuXSk7XG5cbi8qKiBTdG9yZSBvbmUgZGlyZWN0aW9uIG9ubHk7IGludmVyc2UgcmVsYXRpb25zaGlwcyBhcmUgZGVyaXZlZC4gKi9cbmV4cG9ydCBjb25zdCBSRUxBVElPTlNISVBfVFlQRVMgPSBPYmplY3QuZnJlZXplKFtcbiAgJ2NhbGxzJyxcbiAgJ3JlZmVyZW5jZXMnLFxuICAnZGVmaW5lcycsXG4gICdkZWNsYXJlcycsXG4gICdpbXBvcnRzJyxcbiAgJ2V4cG9ydHMnLFxuICAnaW5jbHVkZXMnLFxuICAnaW5oZXJpdHMnLFxuICAnaW1wbGVtZW50cycsXG4gICdvdmVycmlkZXMnLFxuICAnaW5zdGFudGlhdGVzJyxcbiAgJ3JlYWRzJyxcbiAgJ3dyaXRlcycsXG4gICdhc3NpZ25zJyxcbiAgJ3BhcmFtZXRlcl9vZicsXG4gICdjYXB0dXJlcycsXG5dKTtcblxuLyoqIENlcnRhaW50eSBtb2RlbCBmcm9tIFJvYWRtYXAgc2VjdGlvbiAyMC4gKi9cbmV4cG9ydCBjb25zdCBSRVNPTFVUSU9OX1NUQVRVU0VTID0gT2JqZWN0LmZyZWV6ZShbXG4gICdyZXNvbHZlZCcsXG4gICdpbmZlcnJlZCcsXG4gICdwb3NzaWJsZScsXG4gICd1bnJlc29sdmVkJyxcbiAgJ3N0YWxlJyxcbl0pO1xuXG4vKipcbiAqIENsb3NlZCByZWFzb24tY29kZSB2b2NhYnVsYXJ5LiBGcmVlIHRleHQgYmVsb25ncyBpbiBkaWFnbm9zdGljcywgbm90IGhlcmUuXG4gKiBQaGFzZSAxIG93bnMgdGhlIGZ1bGwgbGlzdDsgdGhlc2UgYXJlIHRoZSBjb2RlcyB0aGUgbW9jayBhZGFwdGVyIHVzZXMuXG4gKi9cbmV4cG9ydCBjb25zdCBSRUFTT05fQ09ERVMgPSBPYmplY3QuZnJlZXplKFtcbiAgJ2R5bmFtaWNfZGlzcGF0Y2gnLFxuICAnZnVuY3Rpb25fcG9pbnRlcicsXG4gICdtaXNzaW5nX2NvbXBpbGVfZGInLFxuICAnbWFjcm9fZXhwYW5zaW9uJyxcbiAgJ3Vua25vd25faW1wb3J0X3RhcmdldCcsXG4gICdvdmVybG9hZF9hbWJpZ3VvdXMnLFxuICAnb3V0X29mX3Njb3BlJyxcbiAgJ3BhcnNlX2Vycm9yJyxcbiAgJ2luZGV4X3N0YWxlJyxcbiAgJ3Rvb19kZWVwJyxcbiAgJ21vY2tfZGF0YScsXG5dKTtcblxuZXhwb3J0IGNvbnN0IENPTVBMRVRFTkVTU19MRVZFTFMgPSBPYmplY3QuZnJlZXplKFsnZnVsbCcsICdwYXJ0aWFsJywgJ3N5bnRhY3RpY19vbmx5J10pO1xuXG5leHBvcnQgY29uc3QgRElBR05PU1RJQ19TRVZFUklUSUVTID0gT2JqZWN0LmZyZWV6ZShbJ2luZm8nLCAnd2FybmluZycsICdlcnJvciddKTtcbiIsICIvKipcbiAqIENTUiBlbnRpdHkgZmFjdG9yaWVzIGFuZCBkcmFmdCB2YWxpZGF0aW9uLlxuICpcbiAqIERSQUZUIChQaGFzZSAwKS4gVGhlIHBvaW50IG9mIHRoaXMgbW9kdWxlIGlzIHRvIHByb3ZlIHR3byB0aGluZ3MgZWFybHk6XG4gKiAxLiBFbnRpdGllcyBjYW4gYmUgY3JlYXRlZCB3aXRob3V0IGFueSBsYW5ndWFnZSBrbm93bGVkZ2UuXG4gKiAyLiBJbnZhbGlkIGFkYXB0ZXIgb3V0cHV0IGNhbiBiZSByZWplY3RlZCB3aXRoIGFuIGFjdGlvbmFibGUgbWVzc2FnZS5cbiAqXG4gKiBQaGFzZSAxIHJlcGxhY2VzIHRoaXMgd2l0aCB0aGUgbm9ybWF0aXZlIG1vZGVsLiBCZWhhdmlvdXIgdGhhdCBQaGFzZSAxIGtlZXBzOlxuICogdmFsaWRhdGlvbiByZXR1cm5zIHN0cnVjdHVyZWQgZXJyb3JzIGluc3RlYWQgb2YgdGhyb3dpbmcsIGFuZCBwcm92ZW5hbmNlIGlzXG4gKiBtYW5kYXRvcnkgZm9yIGV2ZXJ5IHN5bWJvbC5cbiAqL1xuXG5pbXBvcnQge1xuICBDT01QTEVURU5FU1NfTEVWRUxTLFxuICBDU1JfVkVSU0lPTixcbiAgRElBR05PU1RJQ19TRVZFUklUSUVTLFxuICBSRUFTT05fQ09ERVMsXG4gIFJFTEFUSU9OU0hJUF9UWVBFUyxcbiAgUkVTT0xVVElPTl9TVEFUVVNFUyxcbiAgU1lNQk9MX0tJTkRTLFxufSBmcm9tICcuL3R5cGVzLmpzJztcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBTb3VyY2VSYW5nZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGZpbGVJZFxuICogQHByb3BlcnR5IHtudW1iZXJ9IHN0YXJ0TGluZSAgIDAtYmFzZWRcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBzdGFydENvbHVtbiAwLWJhc2VkLCBVVEYtMTYgY29kZSB1bml0c1xuICogQHByb3BlcnR5IHtudW1iZXJ9IGVuZExpbmUgICAgIDAtYmFzZWQsIGluY2x1c2l2ZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IGVuZENvbHVtbiAgIDAtYmFzZWQsIGV4Y2x1c2l2ZVxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gU3ltYm9sUmVjb3JkXG4gKiBAcHJvcGVydHkge3N0cmluZ30gc3ltYm9sSWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBraW5kXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbmFtZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IHF1YWxpZmllZE5hbWVcbiAqIEBwcm9wZXJ0eSB7U291cmNlUmFuZ2V9IGRlY2xhcmF0aW9uXG4gKiBAcHJvcGVydHkge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBbZXh0ZW5zaW9uc11cbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFJlbGF0aW9uc2hpcFxuICogQHByb3BlcnR5IHtzdHJpbmd9IHJlbGF0aW9uc2hpcElkXG4gKiBAcHJvcGVydHkge3N0cmluZ30gdHlwZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGZyb21cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSB0b1xuICogQHByb3BlcnR5IHsncmVzb2x2ZWQnfCdpbmZlcnJlZCd8J3Bvc3NpYmxlJ3wndW5yZXNvbHZlZCd8J3N0YWxlJ30gc3RhdHVzXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3JlYXNvbkNvZGVdXG4gKiBAcHJvcGVydHkge1NvdXJjZVJhbmdlfSBbc2l0ZV1cbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEZpbGVSZWNvcmRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBmaWxlSWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBwYXRoICAgICAgIHdvcmtzcGFjZS1yZWxhdGl2ZSwgZm9yd2FyZCBzbGFzaGVzXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbGFuZ3VhZ2VcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBjb250ZW50SGFzaFxuICogQHByb3BlcnR5IHtudW1iZXJ9IGxpbmVDb3VudFxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gRGlhZ25vc3RpY1xuICogQHByb3BlcnR5IHsnaW5mbyd8J3dhcm5pbmcnfCdlcnJvcid9IHNldmVyaXR5XG4gKiBAcHJvcGVydHkge3N0cmluZ30gY29kZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IG1lc3NhZ2VcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nW119IFthZmZlY3RzXVxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gQW5hbHlzaXNSdW5cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBydW5JZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGFkYXB0ZXJJZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGxhbmd1YWdlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gY3NyVmVyc2lvblxuICogQHByb3BlcnR5IHsnZnVsbCd8J3BhcnRpYWwnfCdzeW50YWN0aWNfb25seSd9IGNvbXBsZXRlbmVzc1xuICogQHByb3BlcnR5IHtGaWxlUmVjb3JkW119IGZpbGVzXG4gKiBAcHJvcGVydHkge1N5bWJvbFJlY29yZFtdfSBzeW1ib2xzXG4gKiBAcHJvcGVydHkge1JlbGF0aW9uc2hpcFtdfSByZWxhdGlvbnNoaXBzXG4gKiBAcHJvcGVydHkge0RpYWdub3N0aWNbXX0gZGlhZ25vc3RpY3NcbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7UGFydGlhbDxTb3VyY2VSYW5nZT59IGlucHV0XG4gKiBAcmV0dXJucyB7U291cmNlUmFuZ2V9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTb3VyY2VSYW5nZShpbnB1dCkge1xuICByZXR1cm4ge1xuICAgIGZpbGVJZDogU3RyaW5nKGlucHV0LmZpbGVJZCA/PyAnJyksXG4gICAgc3RhcnRMaW5lOiBOdW1iZXIoaW5wdXQuc3RhcnRMaW5lID8/IDApLFxuICAgIHN0YXJ0Q29sdW1uOiBOdW1iZXIoaW5wdXQuc3RhcnRDb2x1bW4gPz8gMCksXG4gICAgZW5kTGluZTogTnVtYmVyKGlucHV0LmVuZExpbmUgPz8gMCksXG4gICAgZW5kQ29sdW1uOiBOdW1iZXIoaW5wdXQuZW5kQ29sdW1uID8/IDApLFxuICB9O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UGFydGlhbDxTeW1ib2xSZWNvcmQ+ICYge2RlY2xhcmF0aW9uOiBTb3VyY2VSYW5nZX19IGlucHV0XG4gKiBAcmV0dXJucyB7U3ltYm9sUmVjb3JkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU3ltYm9sKGlucHV0KSB7XG4gIC8qKiBAdHlwZSB7U3ltYm9sUmVjb3JkfSAqL1xuICBjb25zdCBzeW1ib2wgPSB7XG4gICAgc3ltYm9sSWQ6IFN0cmluZyhpbnB1dC5zeW1ib2xJZCA/PyAnJyksXG4gICAga2luZDogU3RyaW5nKGlucHV0LmtpbmQgPz8gJ3Vua25vd24nKSxcbiAgICBuYW1lOiBTdHJpbmcoaW5wdXQubmFtZSA/PyAnJyksXG4gICAgcXVhbGlmaWVkTmFtZTogU3RyaW5nKGlucHV0LnF1YWxpZmllZE5hbWUgPz8gaW5wdXQubmFtZSA/PyAnJyksXG4gICAgZGVjbGFyYXRpb246IGlucHV0LmRlY2xhcmF0aW9uLFxuICB9O1xuICBpZiAoaW5wdXQuZXh0ZW5zaW9ucykge1xuICAgIHN5bWJvbC5leHRlbnNpb25zID0gaW5wdXQuZXh0ZW5zaW9ucztcbiAgfVxuICByZXR1cm4gc3ltYm9sO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UGFydGlhbDxSZWxhdGlvbnNoaXA+fSBpbnB1dFxuICogQHJldHVybnMge1JlbGF0aW9uc2hpcH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJlbGF0aW9uc2hpcChpbnB1dCkge1xuICAvKiogQHR5cGUge1JlbGF0aW9uc2hpcH0gKi9cbiAgY29uc3QgcmVsYXRpb25zaGlwID0ge1xuICAgIHJlbGF0aW9uc2hpcElkOiBTdHJpbmcoaW5wdXQucmVsYXRpb25zaGlwSWQgPz8gJycpLFxuICAgIHR5cGU6IFN0cmluZyhpbnB1dC50eXBlID8/ICdyZWZlcmVuY2VzJyksXG4gICAgZnJvbTogU3RyaW5nKGlucHV0LmZyb20gPz8gJycpLFxuICAgIHRvOiBTdHJpbmcoaW5wdXQudG8gPz8gJycpLFxuICAgIHN0YXR1czogLyoqIEB0eXBlIHtSZWxhdGlvbnNoaXBbJ3N0YXR1cyddfSAqLyAoaW5wdXQuc3RhdHVzID8/ICd1bnJlc29sdmVkJyksXG4gIH07XG4gIGlmIChpbnB1dC5yZWFzb25Db2RlKSB7XG4gICAgcmVsYXRpb25zaGlwLnJlYXNvbkNvZGUgPSBpbnB1dC5yZWFzb25Db2RlO1xuICB9XG4gIGlmIChpbnB1dC5zaXRlKSB7XG4gICAgcmVsYXRpb25zaGlwLnNpdGUgPSBpbnB1dC5zaXRlO1xuICB9XG4gIHJldHVybiByZWxhdGlvbnNoaXA7XG59XG5cbi8qKlxuICogQHBhcmFtIHtQYXJ0aWFsPEFuYWx5c2lzUnVuPn0gaW5wdXRcbiAqIEByZXR1cm5zIHtBbmFseXNpc1J1bn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUFuYWx5c2lzUnVuKGlucHV0KSB7XG4gIHJldHVybiB7XG4gICAgcnVuSWQ6IFN0cmluZyhpbnB1dC5ydW5JZCA/PyAnJyksXG4gICAgYWRhcHRlcklkOiBTdHJpbmcoaW5wdXQuYWRhcHRlcklkID8/ICcnKSxcbiAgICBsYW5ndWFnZTogU3RyaW5nKGlucHV0Lmxhbmd1YWdlID8/ICcnKSxcbiAgICBjc3JWZXJzaW9uOiBTdHJpbmcoaW5wdXQuY3NyVmVyc2lvbiA/PyBDU1JfVkVSU0lPTiksXG4gICAgY29tcGxldGVuZXNzOiAvKiogQHR5cGUge0FuYWx5c2lzUnVuWydjb21wbGV0ZW5lc3MnXX0gKi8gKGlucHV0LmNvbXBsZXRlbmVzcyA/PyAncGFydGlhbCcpLFxuICAgIGZpbGVzOiBBcnJheS5pc0FycmF5KGlucHV0LmZpbGVzKSA/IGlucHV0LmZpbGVzIDogW10sXG4gICAgc3ltYm9sczogQXJyYXkuaXNBcnJheShpbnB1dC5zeW1ib2xzKSA/IGlucHV0LnN5bWJvbHMgOiBbXSxcbiAgICByZWxhdGlvbnNoaXBzOiBBcnJheS5pc0FycmF5KGlucHV0LnJlbGF0aW9uc2hpcHMpID8gaW5wdXQucmVsYXRpb25zaGlwcyA6IFtdLFxuICAgIGRpYWdub3N0aWNzOiBBcnJheS5pc0FycmF5KGlucHV0LmRpYWdub3N0aWNzKSA/IGlucHV0LmRpYWdub3N0aWNzIDogW10sXG4gIH07XG59XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gVmFsaWRhdGlvbklzc3VlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gcGF0aFxuICogQHByb3BlcnR5IHtzdHJpbmd9IG1lc3NhZ2VcbiAqL1xuXG4vKipcbiAqIFZhbGlkYXRlIGFuIGFuYWx5c2lzIHJ1biBhdCB0aGUgYWRhcHRlciBib3VuZGFyeS5cbiAqXG4gKiBSdWxlcyBlbmZvcmNlZCBpbiB0aGlzIGRyYWZ0OlxuICogLSBSZXF1aXJlZCBzY2FsYXJzIGFyZSBwcmVzZW50LlxuICogLSBFbnVtcyBhcmUgY2xvc2VkLlxuICogLSBTeW1ib2wgSURzIGFyZSB1bmlxdWUgYW5kIGV2ZXJ5IHN5bWJvbCBoYXMgYSB2YWxpZCByYW5nZSBpbnNpZGUgYSBrbm93biBmaWxlLlxuICogLSBOb24tYHJlc29sdmVkYCByZWxhdGlvbnNoaXBzIGNhcnJ5IGEgcmVhc29uIGNvZGUgZnJvbSB0aGUgY2xvc2VkIGxpc3QuXG4gKiAtIEEgYHJlc29sdmVkYCByZWxhdGlvbnNoaXAgbXVzdCBwb2ludCBhdCBhIGRlY2xhcmVkIHN5bWJvbC5cbiAqXG4gKiBAcGFyYW0ge3Vua25vd259IHJ1blxuICogQHJldHVybnMge3tvazogdHJ1ZSwgcnVuOiBBbmFseXNpc1J1bn0gfCB7b2s6IGZhbHNlLCBpc3N1ZXM6IFZhbGlkYXRpb25Jc3N1ZVtdfX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlQW5hbHlzaXNSdW4ocnVuKSB7XG4gIC8qKiBAdHlwZSB7VmFsaWRhdGlvbklzc3VlW119ICovXG4gIGNvbnN0IGlzc3VlcyA9IFtdO1xuXG4gIGlmICh0eXBlb2YgcnVuICE9PSAnb2JqZWN0JyB8fCBydW4gPT09IG51bGwgfHwgQXJyYXkuaXNBcnJheShydW4pKSB7XG4gICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBpc3N1ZXM6IFt7IHBhdGg6ICckJywgbWVzc2FnZTogJ0FuYWx5c2lzIHJ1biBtdXN0IGJlIGFuIG9iamVjdC4nIH1dIH07XG4gIH1cblxuICBjb25zdCBjYW5kaWRhdGUgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAocnVuKTtcblxuICBmb3IgKGNvbnN0IGZpZWxkIG9mIFsncnVuSWQnLCAnYWRhcHRlcklkJywgJ2xhbmd1YWdlJywgJ2NzclZlcnNpb24nXSkge1xuICAgIGlmICh0eXBlb2YgY2FuZGlkYXRlW2ZpZWxkXSAhPT0gJ3N0cmluZycgfHwgY2FuZGlkYXRlW2ZpZWxkXS5sZW5ndGggPT09IDApIHtcbiAgICAgIGlzc3Vlcy5wdXNoKHsgcGF0aDogZmllbGQsIG1lc3NhZ2U6IGAke2ZpZWxkfSBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZy5gIH0pO1xuICAgIH1cbiAgfVxuXG4gIGlmICghQ09NUExFVEVORVNTX0xFVkVMUy5pbmNsdWRlcyhTdHJpbmcoY2FuZGlkYXRlLmNvbXBsZXRlbmVzcykpKSB7XG4gICAgaXNzdWVzLnB1c2goe1xuICAgICAgcGF0aDogJ2NvbXBsZXRlbmVzcycsXG4gICAgICBtZXNzYWdlOiBgY29tcGxldGVuZXNzIG11c3QgYmUgb25lIG9mICR7Q09NUExFVEVORVNTX0xFVkVMUy5qb2luKCcsICcpfS5gLFxuICAgIH0pO1xuICB9XG5cbiAgY29uc3QgZmlsZXMgPSBBcnJheS5pc0FycmF5KGNhbmRpZGF0ZS5maWxlcykgPyBjYW5kaWRhdGUuZmlsZXMgOiBbXTtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGNhbmRpZGF0ZS5maWxlcykpIHtcbiAgICBpc3N1ZXMucHVzaCh7IHBhdGg6ICdmaWxlcycsIG1lc3NhZ2U6ICdmaWxlcyBtdXN0IGJlIGFuIGFycmF5LicgfSk7XG4gIH1cblxuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIHVua25vd24+Pn0gKi9cbiAgY29uc3QgZmlsZUJ5SWQgPSBuZXcgTWFwKCk7XG4gIGZpbGVzLmZvckVhY2goKGZpbGUsIGluZGV4KSA9PiB7XG4gICAgY29uc3QgcGF0aCA9IGBmaWxlc1ske2luZGV4fV1gO1xuICAgIGlmICh0eXBlb2YgZmlsZSAhPT0gJ29iamVjdCcgfHwgZmlsZSA9PT0gbnVsbCkge1xuICAgICAgaXNzdWVzLnB1c2goeyBwYXRoLCBtZXNzYWdlOiAnRmlsZSByZWNvcmQgbXVzdCBiZSBhbiBvYmplY3QuJyB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcmVjb3JkID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKGZpbGUpO1xuICAgIGNvbnN0IGZpbGVJZCA9IHJlY29yZC5maWxlSWQ7XG4gICAgaWYgKHR5cGVvZiBmaWxlSWQgIT09ICdzdHJpbmcnIHx8IGZpbGVJZC5sZW5ndGggPT09IDApIHtcbiAgICAgIGlzc3Vlcy5wdXNoKHsgcGF0aDogYCR7cGF0aH0uZmlsZUlkYCwgbWVzc2FnZTogJ2ZpbGVJZCBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZy4nIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZmlsZUJ5SWQuaGFzKGZpbGVJZCkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKHsgcGF0aDogYCR7cGF0aH0uZmlsZUlkYCwgbWVzc2FnZTogYER1cGxpY2F0ZSBmaWxlSWQgXCIke2ZpbGVJZH1cIi5gIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmaWxlQnlJZC5zZXQoZmlsZUlkLCByZWNvcmQpO1xuICAgIGlmICh0eXBlb2YgcmVjb3JkLnBhdGggIT09ICdzdHJpbmcnIHx8IHJlY29yZC5wYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgICAgaXNzdWVzLnB1c2goeyBwYXRoOiBgJHtwYXRofS5wYXRoYCwgbWVzc2FnZTogJ3BhdGggbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcuJyB9KTtcbiAgICB9XG4gICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKHJlY29yZC5saW5lQ291bnQpIHx8IE51bWJlcihyZWNvcmQubGluZUNvdW50KSA8IDEpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKHsgcGF0aDogYCR7cGF0aH0ubGluZUNvdW50YCwgbWVzc2FnZTogJ2xpbmVDb3VudCBtdXN0IGJlIGEgcG9zaXRpdmUgaW50ZWdlci4nIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgY29uc3Qgc3ltYm9scyA9IEFycmF5LmlzQXJyYXkoY2FuZGlkYXRlLnN5bWJvbHMpID8gY2FuZGlkYXRlLnN5bWJvbHMgOiBbXTtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGNhbmRpZGF0ZS5zeW1ib2xzKSkge1xuICAgIGlzc3Vlcy5wdXNoKHsgcGF0aDogJ3N5bWJvbHMnLCBtZXNzYWdlOiAnc3ltYm9scyBtdXN0IGJlIGFuIGFycmF5LicgfSk7XG4gIH1cblxuICAvKiogQHR5cGUge1NldDxzdHJpbmc+fSAqL1xuICBjb25zdCBzeW1ib2xJZHMgPSBuZXcgU2V0KCk7XG4gIHN5bWJvbHMuZm9yRWFjaCgoc3ltYm9sLCBpbmRleCkgPT4ge1xuICAgIGNvbnN0IHBhdGggPSBgc3ltYm9sc1ske2luZGV4fV1gO1xuICAgIGlmICh0eXBlb2Ygc3ltYm9sICE9PSAnb2JqZWN0JyB8fCBzeW1ib2wgPT09IG51bGwpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKHsgcGF0aCwgbWVzc2FnZTogJ1N5bWJvbCBtdXN0IGJlIGFuIG9iamVjdC4nIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCByZWNvcmQgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAoc3ltYm9sKTtcbiAgICBjb25zdCBzeW1ib2xJZCA9IHJlY29yZC5zeW1ib2xJZDtcbiAgICBpZiAodHlwZW9mIHN5bWJvbElkICE9PSAnc3RyaW5nJyB8fCBzeW1ib2xJZC5sZW5ndGggPT09IDApIHtcbiAgICAgIGlzc3Vlcy5wdXNoKHsgcGF0aDogYCR7cGF0aH0uc3ltYm9sSWRgLCBtZXNzYWdlOiAnc3ltYm9sSWQgbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcuJyB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHN5bWJvbElkcy5oYXMoc3ltYm9sSWQpKSB7XG4gICAgICBpc3N1ZXMucHVzaCh7IHBhdGg6IGAke3BhdGh9LnN5bWJvbElkYCwgbWVzc2FnZTogYER1cGxpY2F0ZSBzeW1ib2xJZCBcIiR7c3ltYm9sSWR9XCIuYCB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc3ltYm9sSWRzLmFkZChzeW1ib2xJZCk7XG5cbiAgICBpZiAoIVNZTUJPTF9LSU5EUy5pbmNsdWRlcyhTdHJpbmcocmVjb3JkLmtpbmQpKSkge1xuICAgICAgaXNzdWVzLnB1c2goeyBwYXRoOiBgJHtwYXRofS5raW5kYCwgbWVzc2FnZTogYFVua25vd24gc3ltYm9sIGtpbmQgXCIke1N0cmluZyhyZWNvcmQua2luZCl9XCIuYCB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBkZWNsYXJhdGlvbiA9IHJlY29yZC5kZWNsYXJhdGlvbjtcbiAgICBpZiAodHlwZW9mIGRlY2xhcmF0aW9uICE9PSAnb2JqZWN0JyB8fCBkZWNsYXJhdGlvbiA9PT0gbnVsbCkge1xuICAgICAgaXNzdWVzLnB1c2goeyBwYXRoOiBgJHtwYXRofS5kZWNsYXJhdGlvbmAsIG1lc3NhZ2U6ICdkZWNsYXJhdGlvbiByYW5nZSBpcyByZXF1aXJlZC4nIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpc3N1ZXMucHVzaCguLi52YWxpZGF0ZVJhbmdlKGRlY2xhcmF0aW9uLCBgJHtwYXRofS5kZWNsYXJhdGlvbmAsIGZpbGVCeUlkKSk7XG4gIH0pO1xuXG4gIGNvbnN0IHJlbGF0aW9uc2hpcHMgPSBBcnJheS5pc0FycmF5KGNhbmRpZGF0ZS5yZWxhdGlvbnNoaXBzKSA/IGNhbmRpZGF0ZS5yZWxhdGlvbnNoaXBzIDogW107XG4gIGlmICghQXJyYXkuaXNBcnJheShjYW5kaWRhdGUucmVsYXRpb25zaGlwcykpIHtcbiAgICBpc3N1ZXMucHVzaCh7IHBhdGg6ICdyZWxhdGlvbnNoaXBzJywgbWVzc2FnZTogJ3JlbGF0aW9uc2hpcHMgbXVzdCBiZSBhbiBhcnJheS4nIH0pO1xuICB9XG5cbiAgLyoqIEB0eXBlIHtTZXQ8c3RyaW5nPn0gKi9cbiAgY29uc3QgcmVsYXRpb25zaGlwSWRzID0gbmV3IFNldCgpO1xuICByZWxhdGlvbnNoaXBzLmZvckVhY2goKHJlbGF0aW9uc2hpcCwgaW5kZXgpID0+IHtcbiAgICBjb25zdCBwYXRoID0gYHJlbGF0aW9uc2hpcHNbJHtpbmRleH1dYDtcbiAgICBpZiAodHlwZW9mIHJlbGF0aW9uc2hpcCAhPT0gJ29iamVjdCcgfHwgcmVsYXRpb25zaGlwID09PSBudWxsKSB7XG4gICAgICBpc3N1ZXMucHVzaCh7IHBhdGgsIG1lc3NhZ2U6ICdSZWxhdGlvbnNoaXAgbXVzdCBiZSBhbiBvYmplY3QuJyB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcmVjb3JkID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKHJlbGF0aW9uc2hpcCk7XG4gICAgY29uc3QgaWQgPSByZWNvcmQucmVsYXRpb25zaGlwSWQ7XG4gICAgaWYgKHR5cGVvZiBpZCAhPT0gJ3N0cmluZycgfHwgaWQubGVuZ3RoID09PSAwKSB7XG4gICAgICBpc3N1ZXMucHVzaCh7XG4gICAgICAgIHBhdGg6IGAke3BhdGh9LnJlbGF0aW9uc2hpcElkYCxcbiAgICAgICAgbWVzc2FnZTogJ3JlbGF0aW9uc2hpcElkIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nLicsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHJlbGF0aW9uc2hpcElkcy5oYXMoaWQpKSB7XG4gICAgICBpc3N1ZXMucHVzaCh7IHBhdGg6IGAke3BhdGh9LnJlbGF0aW9uc2hpcElkYCwgbWVzc2FnZTogYER1cGxpY2F0ZSByZWxhdGlvbnNoaXBJZCBcIiR7aWR9XCIuYCB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmVsYXRpb25zaGlwSWRzLmFkZChpZCk7XG5cbiAgICBpZiAoIVJFTEFUSU9OU0hJUF9UWVBFUy5pbmNsdWRlcyhTdHJpbmcocmVjb3JkLnR5cGUpKSkge1xuICAgICAgaXNzdWVzLnB1c2goe1xuICAgICAgICBwYXRoOiBgJHtwYXRofS50eXBlYCxcbiAgICAgICAgbWVzc2FnZTogYFVua25vd24gcmVsYXRpb25zaGlwIHR5cGUgXCIke1N0cmluZyhyZWNvcmQudHlwZSl9XCIuYCxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHN0YXR1cyA9IFN0cmluZyhyZWNvcmQuc3RhdHVzKTtcbiAgICBpZiAoIVJFU09MVVRJT05fU1RBVFVTRVMuaW5jbHVkZXMoc3RhdHVzKSkge1xuICAgICAgaXNzdWVzLnB1c2goe1xuICAgICAgICBwYXRoOiBgJHtwYXRofS5zdGF0dXNgLFxuICAgICAgICBtZXNzYWdlOiBgc3RhdHVzIG11c3QgYmUgb25lIG9mICR7UkVTT0xVVElPTl9TVEFUVVNFUy5qb2luKCcsICcpfS5gLFxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChzdGF0dXMgIT09ICdyZXNvbHZlZCcpIHtcbiAgICAgIGNvbnN0IHJlYXNvbiA9IHJlY29yZC5yZWFzb25Db2RlO1xuICAgICAgaWYgKHR5cGVvZiByZWFzb24gIT09ICdzdHJpbmcnIHx8IHJlYXNvbi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgaXNzdWVzLnB1c2goe1xuICAgICAgICAgIHBhdGg6IGAke3BhdGh9LnJlYXNvbkNvZGVgLFxuICAgICAgICAgIG1lc3NhZ2U6IGBBIFwiJHtzdGF0dXN9XCIgcmVsYXRpb25zaGlwIG11c3QgY2FycnkgYSByZWFzb25Db2RlLmAsXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmICghUkVBU09OX0NPREVTLmluY2x1ZGVzKHJlYXNvbikpIHtcbiAgICAgICAgaXNzdWVzLnB1c2goe1xuICAgICAgICAgIHBhdGg6IGAke3BhdGh9LnJlYXNvbkNvZGVgLFxuICAgICAgICAgIG1lc3NhZ2U6IGBVbmtub3duIHJlYXNvbkNvZGUgXCIke3JlYXNvbn1cIi5gLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBmcm9tID0gcmVjb3JkLmZyb207XG4gICAgY29uc3QgdG8gPSByZWNvcmQudG87XG4gICAgaWYgKHR5cGVvZiBmcm9tICE9PSAnc3RyaW5nJyB8fCBmcm9tLmxlbmd0aCA9PT0gMCkge1xuICAgICAgaXNzdWVzLnB1c2goeyBwYXRoOiBgJHtwYXRofS5mcm9tYCwgbWVzc2FnZTogJ2Zyb20gbXVzdCBiZSBhIHN5bWJvbElkLicgfSk7XG4gICAgfSBlbHNlIGlmICghc3ltYm9sSWRzLmhhcyhmcm9tKSkge1xuICAgICAgaXNzdWVzLnB1c2goeyBwYXRoOiBgJHtwYXRofS5mcm9tYCwgbWVzc2FnZTogYFVua25vd24gc291cmNlIHN5bWJvbCBcIiR7ZnJvbX1cIi5gIH0pO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHRvICE9PSAnc3RyaW5nJyB8fCB0by5sZW5ndGggPT09IDApIHtcbiAgICAgIGlzc3Vlcy5wdXNoKHsgcGF0aDogYCR7cGF0aH0udG9gLCBtZXNzYWdlOiAndG8gbXVzdCBiZSBhIHN5bWJvbElkIG9yIGV4dGVybmFsIHRhcmdldCBpZC4nIH0pO1xuICAgIH0gZWxzZSBpZiAoc3RhdHVzID09PSAncmVzb2x2ZWQnICYmICFzeW1ib2xJZHMuaGFzKHRvKSkge1xuICAgICAgaXNzdWVzLnB1c2goe1xuICAgICAgICBwYXRoOiBgJHtwYXRofS50b2AsXG4gICAgICAgIG1lc3NhZ2U6IGBBIHJlc29sdmVkIHJlbGF0aW9uc2hpcCBtdXN0IHRhcmdldCBhIGRlY2xhcmVkIHN5bWJvbDsgXCIke3RvfVwiIGlzIHVua25vd24uYCxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChyZWNvcmQuc2l0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAodHlwZW9mIHJlY29yZC5zaXRlICE9PSAnb2JqZWN0JyB8fCByZWNvcmQuc2l0ZSA9PT0gbnVsbCkge1xuICAgICAgICBpc3N1ZXMucHVzaCh7IHBhdGg6IGAke3BhdGh9LnNpdGVgLCBtZXNzYWdlOiAnc2l0ZSBtdXN0IGJlIGEgcmFuZ2Ugb2JqZWN0LicgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpc3N1ZXMucHVzaCguLi52YWxpZGF0ZVJhbmdlKHJlY29yZC5zaXRlLCBgJHtwYXRofS5zaXRlYCwgZmlsZUJ5SWQpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIGNvbnN0IGRpYWdub3N0aWNzID0gQXJyYXkuaXNBcnJheShjYW5kaWRhdGUuZGlhZ25vc3RpY3MpID8gY2FuZGlkYXRlLmRpYWdub3N0aWNzIDogW107XG4gIGlmICghQXJyYXkuaXNBcnJheShjYW5kaWRhdGUuZGlhZ25vc3RpY3MpKSB7XG4gICAgaXNzdWVzLnB1c2goeyBwYXRoOiAnZGlhZ25vc3RpY3MnLCBtZXNzYWdlOiAnZGlhZ25vc3RpY3MgbXVzdCBiZSBhbiBhcnJheS4nIH0pO1xuICB9XG4gIGRpYWdub3N0aWNzLmZvckVhY2goKGRpYWdub3N0aWMsIGluZGV4KSA9PiB7XG4gICAgY29uc3QgcGF0aCA9IGBkaWFnbm9zdGljc1ske2luZGV4fV1gO1xuICAgIGlmICh0eXBlb2YgZGlhZ25vc3RpYyAhPT0gJ29iamVjdCcgfHwgZGlhZ25vc3RpYyA9PT0gbnVsbCkge1xuICAgICAgaXNzdWVzLnB1c2goeyBwYXRoLCBtZXNzYWdlOiAnRGlhZ25vc3RpYyBtdXN0IGJlIGFuIG9iamVjdC4nIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCByZWNvcmQgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAoZGlhZ25vc3RpYyk7XG4gICAgaWYgKCFESUFHTk9TVElDX1NFVkVSSVRJRVMuaW5jbHVkZXMoU3RyaW5nKHJlY29yZC5zZXZlcml0eSkpKSB7XG4gICAgICBpc3N1ZXMucHVzaCh7IHBhdGg6IGAke3BhdGh9LnNldmVyaXR5YCwgbWVzc2FnZTogJ1Vua25vd24gZGlhZ25vc3RpYyBzZXZlcml0eS4nIH0pO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHJlY29yZC5jb2RlICE9PSAnc3RyaW5nJyB8fCByZWNvcmQuY29kZS5sZW5ndGggPT09IDApIHtcbiAgICAgIGlzc3Vlcy5wdXNoKHsgcGF0aDogYCR7cGF0aH0uY29kZWAsIG1lc3NhZ2U6ICdEaWFnbm9zdGljIGNvZGUgaXMgcmVxdWlyZWQuJyB9KTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiByZWNvcmQubWVzc2FnZSAhPT0gJ3N0cmluZycgfHwgcmVjb3JkLm1lc3NhZ2UubGVuZ3RoID09PSAwKSB7XG4gICAgICBpc3N1ZXMucHVzaCh7IHBhdGg6IGAke3BhdGh9Lm1lc3NhZ2VgLCBtZXNzYWdlOiAnRGlhZ25vc3RpYyBtZXNzYWdlIGlzIHJlcXVpcmVkLicgfSk7XG4gICAgfVxuICB9KTtcblxuICBpZiAoaXNzdWVzLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4geyBvazogZmFsc2UsIGlzc3VlcyB9O1xuICB9XG5cbiAgcmV0dXJuIHsgb2s6IHRydWUsIHJ1bjogY3JlYXRlQW5hbHlzaXNSdW4oY2FuZGlkYXRlKSB9O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gcmFuZ2VcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoXG4gKiBAcGFyYW0ge01hcDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIHVua25vd24+Pn0gZmlsZUJ5SWRcbiAqIEByZXR1cm5zIHtWYWxpZGF0aW9uSXNzdWVbXX1cbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVSYW5nZShyYW5nZSwgcGF0aCwgZmlsZUJ5SWQpIHtcbiAgLyoqIEB0eXBlIHtWYWxpZGF0aW9uSXNzdWVbXX0gKi9cbiAgY29uc3QgaXNzdWVzID0gW107XG4gIGlmICh0eXBlb2YgcmFuZ2UgIT09ICdvYmplY3QnIHx8IHJhbmdlID09PSBudWxsKSB7XG4gICAgcmV0dXJuIFt7IHBhdGgsIG1lc3NhZ2U6ICdSYW5nZSBtdXN0IGJlIGFuIG9iamVjdC4nIH1dO1xuICB9XG4gIGNvbnN0IHJlY29yZCA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChyYW5nZSk7XG4gIGNvbnN0IGZpbGVJZCA9IHJlY29yZC5maWxlSWQ7XG4gIGlmICh0eXBlb2YgZmlsZUlkICE9PSAnc3RyaW5nJyB8fCAhZmlsZUJ5SWQuaGFzKGZpbGVJZCkpIHtcbiAgICBpc3N1ZXMucHVzaCh7IHBhdGg6IGAke3BhdGh9LmZpbGVJZGAsIG1lc3NhZ2U6IGBVbmtub3duIGZpbGVJZCBcIiR7U3RyaW5nKGZpbGVJZCl9XCIuYCB9KTtcbiAgfVxuICBmb3IgKGNvbnN0IGZpZWxkIG9mIFsnc3RhcnRMaW5lJywgJ3N0YXJ0Q29sdW1uJywgJ2VuZExpbmUnLCAnZW5kQ29sdW1uJ10pIHtcbiAgICBpZiAoIU51bWJlci5pc0ludGVnZXIocmVjb3JkW2ZpZWxkXSkgfHwgTnVtYmVyKHJlY29yZFtmaWVsZF0pIDwgMCkge1xuICAgICAgaXNzdWVzLnB1c2goeyBwYXRoOiBgJHtwYXRofS4ke2ZpZWxkfWAsIG1lc3NhZ2U6IGAke2ZpZWxkfSBtdXN0IGJlIGEgbm9uLW5lZ2F0aXZlIGludGVnZXIuYCB9KTtcbiAgICB9XG4gIH1cbiAgaWYgKFxuICAgIE51bWJlci5pc0ludGVnZXIocmVjb3JkLnN0YXJ0TGluZSkgJiZcbiAgICBOdW1iZXIuaXNJbnRlZ2VyKHJlY29yZC5lbmRMaW5lKSAmJlxuICAgIE51bWJlcihyZWNvcmQuZW5kTGluZSkgPCBOdW1iZXIocmVjb3JkLnN0YXJ0TGluZSlcbiAgKSB7XG4gICAgaXNzdWVzLnB1c2goeyBwYXRoOiBgJHtwYXRofS5lbmRMaW5lYCwgbWVzc2FnZTogJ2VuZExpbmUgbXVzdCBiZSA+PSBzdGFydExpbmUuJyB9KTtcbiAgfVxuICBpZiAoXG4gICAgTnVtYmVyLmlzSW50ZWdlcihyZWNvcmQuc3RhcnRMaW5lKSAmJlxuICAgIE51bWJlci5pc0ludGVnZXIocmVjb3JkLmVuZExpbmUpICYmXG4gICAgTnVtYmVyKHJlY29yZC5zdGFydExpbmUpID09PSBOdW1iZXIocmVjb3JkLmVuZExpbmUpICYmXG4gICAgTnVtYmVyLmlzSW50ZWdlcihyZWNvcmQuc3RhcnRDb2x1bW4pICYmXG4gICAgTnVtYmVyLmlzSW50ZWdlcihyZWNvcmQuZW5kQ29sdW1uKSAmJlxuICAgIE51bWJlcihyZWNvcmQuZW5kQ29sdW1uKSA8IE51bWJlcihyZWNvcmQuc3RhcnRDb2x1bW4pXG4gICkge1xuICAgIGlzc3Vlcy5wdXNoKHsgcGF0aDogYCR7cGF0aH0uZW5kQ29sdW1uYCwgbWVzc2FnZTogJ2VuZENvbHVtbiBtdXN0IGJlID49IHN0YXJ0Q29sdW1uLicgfSk7XG4gIH1cbiAgY29uc3QgZmlsZSA9IHR5cGVvZiBmaWxlSWQgPT09ICdzdHJpbmcnID8gZmlsZUJ5SWQuZ2V0KGZpbGVJZCkgOiB1bmRlZmluZWQ7XG4gIGlmIChmaWxlICYmIE51bWJlci5pc0ludGVnZXIocmVjb3JkLmVuZExpbmUpICYmIE51bWJlcihyZWNvcmQuZW5kTGluZSkgPj0gTnVtYmVyKGZpbGUubGluZUNvdW50KSkge1xuICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgIHBhdGg6IGAke3BhdGh9LmVuZExpbmVgLFxuICAgICAgbWVzc2FnZTogYGVuZExpbmUgJHtTdHJpbmcocmVjb3JkLmVuZExpbmUpfSBleGNlZWRzIGxpbmVDb3VudCAke1N0cmluZyhmaWxlLmxpbmVDb3VudCl9LmAsXG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIGlzc3Vlcztcbn1cbiIsICIvKipcbiAqIExhbmd1YWdlIGFkYXB0ZXIgcmVnaXN0cnkuXG4gKlxuICogVGhlIHJlZ2lzdHJ5IGlzIHRoZSBvbmx5IHBsYWNlIHRoYXQga25vd3Mgd2hpY2ggYWRhcHRlcnMgZXhpc3QuIEV2ZXJ5dGhpbmdcbiAqIGFib3ZlIGl0IChncmFwaCBidWlsZGluZywgcmVuZGVyaW5nLCBwcm90b2NvbCkgbXVzdCB3b3JrIGZyb20gQ1NSIGFsb25lLlxuICpcbiAqIFBoYXNlIDAgcmVnaXN0ZXJzIGEgbW9jayBhZGFwdGVyLiBQaGFzZXMgMiBhbmQgMyByZWdpc3RlciByZWFsIG9uZXMgd2l0aG91dFxuICogY2hhbmdpbmcgdGhpcyBmaWxlIG9yIGFueSBjb25zdW1lci5cbiAqL1xuXG5pbXBvcnQgeyB2YWxpZGF0ZUFuYWx5c2lzUnVuIH0gZnJvbSAnLi9jc3IvZW50aXRpZXMuanMnO1xuXG4vKiogQHR5cGVkZWYge2ltcG9ydCgnLi9jc3IvZW50aXRpZXMuanMnKS5BbmFseXNpc1J1bn0gQW5hbHlzaXNSdW4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBDYXBhYmlsaXR5U2V0XG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IHBhcnNlXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IGRpc2NvdmVyRGVjbGFyYXRpb25zXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IHJlc29sdmVTeW1ib2xzXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IHJlc29sdmVUeXBlc1xuICogQHByb3BlcnR5IHtib29sZWFufSByZXNvbHZlQ2FsbHNcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gZ2VuZXJhdGVDRkdcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gZ2VuZXJhdGVERkdcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gcmVzb2x2ZUltcG9ydHNcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gbWFwU291cmNlTG9jYXRpb25zXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IHJlcG9ydERpYWdub3N0aWNzXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBBZGFwdGVyRGVzY3JpcHRvclxuICogQHByb3BlcnR5IHtzdHJpbmd9IGlkXG4gKiBAcHJvcGVydHkge3N0cmluZ30gZGlzcGxheU5hbWVcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSB2ZXJzaW9uXG4gKiBAcHJvcGVydHkge3N0cmluZ1tdfSBsYW5ndWFnZXNcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nW119IGV4dGVuc2lvbnMgICAgICBsb3dlciBjYXNlLCBpbmNsdWRpbmcgdGhlIGxlYWRpbmcgZG90XG4gKiBAcHJvcGVydHkge0NhcGFiaWxpdHlTZXR9IGNhcGFiaWxpdGllc1xuICogQHByb3BlcnR5IHsoaW5wdXQ6IHtwYXRoOiBzdHJpbmcsIHRleHQ/OiBzdHJpbmcsIHJ1bklkOiBzdHJpbmcsIHdvcmtzcGFjZVJvb3Q/OiBzdHJpbmd9KSA9PiBBbmFseXNpc1J1biB8IFByb21pc2U8QW5hbHlzaXNSdW4+fSBhbmFseXplXG4gKi9cblxuY29uc3QgQ0FQQUJJTElUWV9LRVlTID0gW1xuICAncGFyc2UnLFxuICAnZGlzY292ZXJEZWNsYXJhdGlvbnMnLFxuICAncmVzb2x2ZVN5bWJvbHMnLFxuICAncmVzb2x2ZVR5cGVzJyxcbiAgJ3Jlc29sdmVDYWxscycsXG4gICdnZW5lcmF0ZUNGRycsXG4gICdnZW5lcmF0ZURGRycsXG4gICdyZXNvbHZlSW1wb3J0cycsXG4gICdtYXBTb3VyY2VMb2NhdGlvbnMnLFxuICAncmVwb3J0RGlhZ25vc3RpY3MnLFxuXTtcblxuLyoqXG4gKiBAcGFyYW0ge1BhcnRpYWw8Q2FwYWJpbGl0eVNldD59IFtpbnB1dF1cbiAqIEByZXR1cm5zIHtDYXBhYmlsaXR5U2V0fVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ2FwYWJpbGl0aWVzKGlucHV0ID0ge30pIHtcbiAgLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCBib29sZWFuPn0gKi9cbiAgY29uc3QgY2FwYWJpbGl0aWVzID0ge307XG4gIGZvciAoY29uc3Qga2V5IG9mIENBUEFCSUxJVFlfS0VZUykge1xuICAgIGNhcGFiaWxpdGllc1trZXldID0gaW5wdXRba2V5XSA9PT0gdHJ1ZTtcbiAgfVxuICByZXR1cm4gLyoqIEB0eXBlIHtDYXBhYmlsaXR5U2V0fSAqLyAoY2FwYWJpbGl0aWVzKTtcbn1cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBBbmFseXplU3VjY2Vzc1xuICogQHByb3BlcnR5IHt0cnVlfSBva1xuICogQHByb3BlcnR5IHtBbmFseXNpc1J1bn0gcnVuXG4gKiBAcHJvcGVydHkge3N0cmluZ30gYWRhcHRlcklkXG4gKiBAcHJvcGVydHkge3N0cmluZ30gZHVyYXRpb25Nc1xuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gQW5hbHl6ZUZhaWx1cmVcbiAqIEBwcm9wZXJ0eSB7ZmFsc2V9IG9rXG4gKiBAcHJvcGVydHkgeydFX1VOU1VQUE9SVEVEJ3wnRV9BREFQVEVSJ3wnRV9WQUxJREFUSU9OJ30gY29kZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IG1lc3NhZ2VcbiAqIEBwcm9wZXJ0eSB7QXJyYXk8e3BhdGg6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nfT59IFtpc3N1ZXNdXG4gKi9cblxuLyoqXG4gKiBAcmV0dXJucyB7e1xuICogICByZWdpc3RlcjogKGRlc2NyaXB0b3I6IEFkYXB0ZXJEZXNjcmlwdG9yKSA9PiB2b2lkLFxuICogICBsaXN0OiAoKSA9PiBBZGFwdGVyRGVzY3JpcHRvcltdLFxuICogICByZXNvbHZlOiAoZmlsZVBhdGg6IHN0cmluZykgPT4gQWRhcHRlckRlc2NyaXB0b3IgfCBudWxsLFxuICogICBhbmFseXplOiAoaW5wdXQ6IHtwYXRoOiBzdHJpbmcsIHRleHQ/OiBzdHJpbmcsIHJ1bklkOiBzdHJpbmcsIHdvcmtzcGFjZVJvb3Q/OiBzdHJpbmd9KSA9PiBQcm9taXNlPEFuYWx5emVTdWNjZXNzIHwgQW5hbHl6ZUZhaWx1cmU+LFxuICogICBjYXBhYmlsaXR5TWF0cml4OiAoKSA9PiBBcnJheTx7aWQ6IHN0cmluZywgbGFuZ3VhZ2VzOiBzdHJpbmdbXSwgY2FwYWJpbGl0aWVzOiBDYXBhYmlsaXR5U2V0fT4sXG4gKiB9fVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQWRhcHRlclJlZ2lzdHJ5KCkge1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIEFkYXB0ZXJEZXNjcmlwdG9yPn0gKi9cbiAgY29uc3QgYWRhcHRlcnMgPSBuZXcgTWFwKCk7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7QWRhcHRlckRlc2NyaXB0b3J9IGRlc2NyaXB0b3JcbiAgICovXG4gIGZ1bmN0aW9uIHJlZ2lzdGVyKGRlc2NyaXB0b3IpIHtcbiAgICBpZiAoIWRlc2NyaXB0b3IgfHwgdHlwZW9mIGRlc2NyaXB0b3IgIT09ICdvYmplY3QnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBZGFwdGVyIGRlc2NyaXB0b3IgbXVzdCBiZSBhbiBvYmplY3QuJyk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgZGVzY3JpcHRvci5pZCAhPT0gJ3N0cmluZycgfHwgZGVzY3JpcHRvci5pZC5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FkYXB0ZXIgZGVzY3JpcHRvciByZXF1aXJlcyBhIG5vbi1lbXB0eSBpZC4nKTtcbiAgICB9XG4gICAgaWYgKGFkYXB0ZXJzLmhhcyhkZXNjcmlwdG9yLmlkKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBBZGFwdGVyIFwiJHtkZXNjcmlwdG9yLmlkfVwiIGlzIGFscmVhZHkgcmVnaXN0ZXJlZC5gKTtcbiAgICB9XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGRlc2NyaXB0b3IuZXh0ZW5zaW9ucykgfHwgZGVzY3JpcHRvci5leHRlbnNpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgQWRhcHRlciBcIiR7ZGVzY3JpcHRvci5pZH1cIiBtdXN0IGRlY2xhcmUgYXQgbGVhc3Qgb25lIGZpbGUgZXh0ZW5zaW9uLmApO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGV4dGVuc2lvbiBvZiBkZXNjcmlwdG9yLmV4dGVuc2lvbnMpIHtcbiAgICAgIGlmICh0eXBlb2YgZXh0ZW5zaW9uICE9PSAnc3RyaW5nJyB8fCAhZXh0ZW5zaW9uLnN0YXJ0c1dpdGgoJy4nKSB8fCBleHRlbnNpb24gIT09IGV4dGVuc2lvbi50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgYEFkYXB0ZXIgXCIke2Rlc2NyaXB0b3IuaWR9XCIgaGFzIGFuIGludmFsaWQgZXh0ZW5zaW9uIFwiJHtTdHJpbmcoZXh0ZW5zaW9uKX1cIjsgdXNlIGxvd2VyIGNhc2Ugd2l0aCBhIGxlYWRpbmcgZG90LmAsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0eXBlb2YgZGVzY3JpcHRvci5hbmFseXplICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBBZGFwdGVyIFwiJHtkZXNjcmlwdG9yLmlkfVwiIG11c3QgcHJvdmlkZSBhbiBhbmFseXplIGZ1bmN0aW9uLmApO1xuICAgIH1cbiAgICBjb25zdCBjYXBhYmlsaXRpZXMgPSBjcmVhdGVDYXBhYmlsaXRpZXMoZGVzY3JpcHRvci5jYXBhYmlsaXRpZXMpO1xuICAgIGFkYXB0ZXJzLnNldChkZXNjcmlwdG9yLmlkLCBPYmplY3QuZnJlZXplKHsgLi4uZGVzY3JpcHRvciwgY2FwYWJpbGl0aWVzIH0pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb25nZXN0IGV4dGVuc2lvbiB3aW5zIHNvIHRoYXQgYSBmdXR1cmUgYC5kLnRzYCBhZGFwdGVyIGNhbiBjb2V4aXN0IHdpdGggYC50c2AuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlUGF0aFxuICAgKiBAcmV0dXJucyB7QWRhcHRlckRlc2NyaXB0b3IgfCBudWxsfVxuICAgKi9cbiAgZnVuY3Rpb24gcmVzb2x2ZShmaWxlUGF0aCkge1xuICAgIGlmICh0eXBlb2YgZmlsZVBhdGggIT09ICdzdHJpbmcnIHx8IGZpbGVQYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGxvd2VyID0gZmlsZVBhdGgudG9Mb3dlckNhc2UoKTtcbiAgICBsZXQgYmVzdCA9IG51bGw7XG4gICAgbGV0IGJlc3RMZW5ndGggPSAwO1xuICAgIGZvciAoY29uc3QgYWRhcHRlciBvZiBhZGFwdGVycy52YWx1ZXMoKSkge1xuICAgICAgZm9yIChjb25zdCBleHRlbnNpb24gb2YgYWRhcHRlci5leHRlbnNpb25zKSB7XG4gICAgICAgIGlmIChsb3dlci5lbmRzV2l0aChleHRlbnNpb24pICYmIGV4dGVuc2lvbi5sZW5ndGggPiBiZXN0TGVuZ3RoKSB7XG4gICAgICAgICAgYmVzdCA9IGFkYXB0ZXI7XG4gICAgICAgICAgYmVzdExlbmd0aCA9IGV4dGVuc2lvbi5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGJlc3Q7XG4gIH1cblxuICAvKipcbiAgICogUnVuIGFuIGFkYXB0ZXIgYW5kIHZhbGlkYXRlIGl0cyBvdXRwdXQuIE5ldmVyIHRocm93czogYSBtaXNiZWhhdmluZ1xuICAgKiBhZGFwdGVyIGJlY29tZXMgYSB0eXBlZCBmYWlsdXJlIHdpdGggYSBkaWFnbm9zdGljLCBub3QgYSBjcmFzaGVkIGhvc3QuXG4gICAqXG4gICAqIEBwYXJhbSB7e3BhdGg6IHN0cmluZywgdGV4dD86IHN0cmluZywgcnVuSWQ6IHN0cmluZywgd29ya3NwYWNlUm9vdD86IHN0cmluZ319IGlucHV0XG4gICAqIEByZXR1cm5zIHtQcm9taXNlPEFuYWx5emVTdWNjZXNzIHwgQW5hbHl6ZUZhaWx1cmU+fVxuICAgKi9cbiAgYXN5bmMgZnVuY3Rpb24gYW5hbHl6ZShpbnB1dCkge1xuICAgIGNvbnN0IGFkYXB0ZXIgPSByZXNvbHZlKGlucHV0LnBhdGgpO1xuICAgIGlmICghYWRhcHRlcikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb2s6IGZhbHNlLFxuICAgICAgICBjb2RlOiAnRV9VTlNVUFBPUlRFRCcsXG4gICAgICAgIG1lc3NhZ2U6IGBObyBhZGFwdGVyIGlzIHJlZ2lzdGVyZWQgZm9yIFwiJHtpbnB1dC5wYXRofVwiLmAsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHN0YXJ0ZWRBdCA9IERhdGUubm93KCk7XG4gICAgbGV0IG91dHB1dDtcbiAgICB0cnkge1xuICAgICAgb3V0cHV0ID0gYXdhaXQgYWRhcHRlci5hbmFseXplKGlucHV0KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb2s6IGZhbHNlLFxuICAgICAgICBjb2RlOiAnRV9BREFQVEVSJyxcbiAgICAgICAgbWVzc2FnZTogYEFkYXB0ZXIgXCIke2FkYXB0ZXIuaWR9XCIgZmFpbGVkOiAke1xuICAgICAgICAgIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKVxuICAgICAgICB9YCxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3QgdmFsaWRhdGlvbiA9IHZhbGlkYXRlQW5hbHlzaXNSdW4ob3V0cHV0KTtcbiAgICBpZiAoIXZhbGlkYXRpb24ub2spIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgY29kZTogJ0VfVkFMSURBVElPTicsXG4gICAgICAgIG1lc3NhZ2U6IGBBZGFwdGVyIFwiJHthZGFwdGVyLmlkfVwiIHByb2R1Y2VkIGludmFsaWQgQ1NSLmAsXG4gICAgICAgIGlzc3VlczogdmFsaWRhdGlvbi5pc3N1ZXMsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBvazogdHJ1ZSxcbiAgICAgIHJ1bjogdmFsaWRhdGlvbi5ydW4sXG4gICAgICBhZGFwdGVySWQ6IGFkYXB0ZXIuaWQsXG4gICAgICBkdXJhdGlvbk1zOiBEYXRlLm5vdygpIC0gc3RhcnRlZEF0LFxuICAgIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHJlZ2lzdGVyLFxuICAgIGxpc3Q6ICgpID0+IFsuLi5hZGFwdGVycy52YWx1ZXMoKV0sXG4gICAgcmVzb2x2ZSxcbiAgICBhbmFseXplLFxuICAgIGNhcGFiaWxpdHlNYXRyaXg6ICgpID0+XG4gICAgICBbLi4uYWRhcHRlcnMudmFsdWVzKCldLm1hcCgoYWRhcHRlcikgPT4gKHtcbiAgICAgICAgaWQ6IGFkYXB0ZXIuaWQsXG4gICAgICAgIGxhbmd1YWdlczogWy4uLmFkYXB0ZXIubGFuZ3VhZ2VzXSxcbiAgICAgICAgY2FwYWJpbGl0aWVzOiB7IC4uLmFkYXB0ZXIuY2FwYWJpbGl0aWVzIH0sXG4gICAgICB9KSksXG4gIH07XG59XG4iLCAiLyoqXG4gKiBNb2NrIGxhbmd1YWdlIGFkYXB0ZXIuXG4gKlxuICogUGhhc2UgMCBleGlzdHMgdG8gcHJvdmUgdGhlIHBpcGVsaW5lLCBub3QgdG8gYW5hbHl6ZSBhbnl0aGluZy4gVGhpcyBhZGFwdGVyXG4gKiBlbWl0cyBhIHNtYWxsLCBoYW5kLXdyaXR0ZW4gYW5hbHlzaXMgcnVuIHNvIHRoYXQgdGhlIGdyYXBoIG1vZGVsLCBEVE8sXG4gKiByZW5kZXJlciwgYW5kIHByb3RvY29sIGNhbiBiZSBidWlsdCBhbmQgdGVzdGVkIGJlZm9yZSByZWFsIHBhcnNlcnMgZXhpc3QuXG4gKlxuICogSXQgaXMgcmVnaXN0ZXJlZCBmb3IgYC5tb2NrYCBmaWxlcyBvbmx5LiBJdCBtdXN0IG5ldmVyIGNsYWltIHRvIGFuYWx5emUgcmVhbFxuICogYC5qc2Agb3IgYC5jcHBgIHNvdXJjZXMgXHUyMDE0IHRoYXQgd291bGQgbWFrZSB0aGUgZXh0ZW5zaW9uIGxvb2sgbW9yZSBjYXBhYmxlIHRoYW5cbiAqIGl0IGlzLlxuICovXG5cbmltcG9ydCB7IENTUl9WRVJTSU9OIH0gZnJvbSAnLi4vLi4vY29yZS9jc3IvdHlwZXMuanMnO1xuaW1wb3J0IHsgY3JlYXRlQ2FwYWJpbGl0aWVzIH0gZnJvbSAnLi4vLi4vY29yZS9hZGFwdGVyUmVnaXN0cnkuanMnO1xuXG5leHBvcnQgY29uc3QgTU9DS19SVU5fSUQgPSAncnVuOm1vY2stMSc7XG5cbmNvbnN0IEZJTEVTID0gW1xuICB7XG4gICAgZmlsZUlkOiAnZmlsZTpzcmMvREJIYW5kbGVyLmpzJyxcbiAgICBwYXRoOiAnc3JjL0RCSGFuZGxlci5qcycsXG4gICAgbGFuZ3VhZ2U6ICdtb2NrJyxcbiAgICBjb250ZW50SGFzaDogJ3NoYTI1Njptb2NrLWRiaGFuZGxlcicsXG4gICAgbGluZUNvdW50OiA0MSxcbiAgfSxcbiAge1xuICAgIGZpbGVJZDogJ2ZpbGU6c3JjL1NRTGl0ZUhlbHBlci5qcycsXG4gICAgcGF0aDogJ3NyYy9TUUxpdGVIZWxwZXIuanMnLFxuICAgIGxhbmd1YWdlOiAnbW9jaycsXG4gICAgY29udGVudEhhc2g6ICdzaGEyNTY6bW9jay1zcWxpdGVoZWxwZXInLFxuICAgIGxpbmVDb3VudDogMjcsXG4gIH0sXG5dO1xuXG5jb25zdCBTWU1CT0xTID0gW1xuICB7XG4gICAgc3ltYm9sSWQ6ICdzeW1ib2w6anM6c3JjL0RCSGFuZGxlci5qczpjbGFzczpEQkhhbmRsZXInLFxuICAgIGtpbmQ6ICdjbGFzcycsXG4gICAgbmFtZTogJ0RCSGFuZGxlcicsXG4gICAgcXVhbGlmaWVkTmFtZTogJ0RCSGFuZGxlcicsXG4gICAgZGVjbGFyYXRpb246IHtcbiAgICAgIGZpbGVJZDogJ2ZpbGU6c3JjL0RCSGFuZGxlci5qcycsXG4gICAgICBzdGFydExpbmU6IDMsXG4gICAgICBzdGFydENvbHVtbjogMCxcbiAgICAgIGVuZExpbmU6IDMwLFxuICAgICAgZW5kQ29sdW1uOiAxLFxuICAgIH0sXG4gIH0sXG4gIHtcbiAgICBzeW1ib2xJZDogJ3N5bWJvbDpqczpzcmMvREJIYW5kbGVyLmpzOm1ldGhvZDpEQkhhbmRsZXIuY2hlY2tfZGJfZXhpc3RzJyxcbiAgICBraW5kOiAnbWV0aG9kJyxcbiAgICBuYW1lOiAnY2hlY2tfZGJfZXhpc3RzJyxcbiAgICBxdWFsaWZpZWROYW1lOiAnREJIYW5kbGVyLmNoZWNrX2RiX2V4aXN0cycsXG4gICAgZGVjbGFyYXRpb246IHtcbiAgICAgIGZpbGVJZDogJ2ZpbGU6c3JjL0RCSGFuZGxlci5qcycsXG4gICAgICBzdGFydExpbmU6IDksXG4gICAgICBzdGFydENvbHVtbjogMixcbiAgICAgIGVuZExpbmU6IDIyLFxuICAgICAgZW5kQ29sdW1uOiAzLFxuICAgIH0sXG4gICAgZXh0ZW5zaW9uczogeyBhc3luYzogdHJ1ZSwgcGFyYW1ldGVyczogMSB9LFxuICB9LFxuICB7XG4gICAgc3ltYm9sSWQ6ICdzeW1ib2w6anM6c3JjL0RCSGFuZGxlci5qczpmdW5jdGlvbjptYWluJyxcbiAgICBraW5kOiAnZnVuY3Rpb24nLFxuICAgIG5hbWU6ICdtYWluJyxcbiAgICBxdWFsaWZpZWROYW1lOiAnbWFpbicsXG4gICAgZGVjbGFyYXRpb246IHtcbiAgICAgIGZpbGVJZDogJ2ZpbGU6c3JjL0RCSGFuZGxlci5qcycsXG4gICAgICBzdGFydExpbmU6IDMzLFxuICAgICAgc3RhcnRDb2x1bW46IDAsXG4gICAgICBlbmRMaW5lOiA0MCxcbiAgICAgIGVuZENvbHVtbjogMSxcbiAgICB9LFxuICB9LFxuICB7XG4gICAgc3ltYm9sSWQ6ICdzeW1ib2w6anM6c3JjL1NRTGl0ZUhlbHBlci5qczptZXRob2Q6U1FMaXRlSGVscGVyLmNoZWNrRGF0YScsXG4gICAga2luZDogJ21ldGhvZCcsXG4gICAgbmFtZTogJ2NoZWNrRGF0YScsXG4gICAgcXVhbGlmaWVkTmFtZTogJ1NRTGl0ZUhlbHBlci5jaGVja0RhdGEnLFxuICAgIGRlY2xhcmF0aW9uOiB7XG4gICAgICBmaWxlSWQ6ICdmaWxlOnNyYy9TUUxpdGVIZWxwZXIuanMnLFxuICAgICAgc3RhcnRMaW5lOiA2LFxuICAgICAgc3RhcnRDb2x1bW46IDIsXG4gICAgICBlbmRMaW5lOiAyMCxcbiAgICAgIGVuZENvbHVtbjogMyxcbiAgICB9LFxuICB9LFxuICB7XG4gICAgc3ltYm9sSWQ6ICdzeW1ib2w6anM6c3JjL1NRTGl0ZUhlbHBlci5qczpjbGFzczpTUUxpdGVIZWxwZXInLFxuICAgIGtpbmQ6ICdjbGFzcycsXG4gICAgbmFtZTogJ1NRTGl0ZUhlbHBlcicsXG4gICAgcXVhbGlmaWVkTmFtZTogJ1NRTGl0ZUhlbHBlcicsXG4gICAgZGVjbGFyYXRpb246IHtcbiAgICAgIGZpbGVJZDogJ2ZpbGU6c3JjL1NRTGl0ZUhlbHBlci5qcycsXG4gICAgICBzdGFydExpbmU6IDIsXG4gICAgICBzdGFydENvbHVtbjogMCxcbiAgICAgIGVuZExpbmU6IDI0LFxuICAgICAgZW5kQ29sdW1uOiAxLFxuICAgIH0sXG4gIH0sXG5dO1xuXG5jb25zdCBSRUxBVElPTlNISVBTID0gW1xuICB7XG4gICAgcmVsYXRpb25zaGlwSWQ6ICdyZWw6bWFpbi1jYWxscy1jaGVjaycsXG4gICAgdHlwZTogJ2NhbGxzJyxcbiAgICBmcm9tOiAnc3ltYm9sOmpzOnNyYy9EQkhhbmRsZXIuanM6ZnVuY3Rpb246bWFpbicsXG4gICAgdG86ICdzeW1ib2w6anM6c3JjL0RCSGFuZGxlci5qczptZXRob2Q6REJIYW5kbGVyLmNoZWNrX2RiX2V4aXN0cycsXG4gICAgc3RhdHVzOiAncmVzb2x2ZWQnLFxuICAgIHNpdGU6IHtcbiAgICAgIGZpbGVJZDogJ2ZpbGU6c3JjL0RCSGFuZGxlci5qcycsXG4gICAgICBzdGFydExpbmU6IDM2LFxuICAgICAgc3RhcnRDb2x1bW46IDIsXG4gICAgICBlbmRMaW5lOiAzNixcbiAgICAgIGVuZENvbHVtbjogMjAsXG4gICAgfSxcbiAgfSxcbiAge1xuICAgIHJlbGF0aW9uc2hpcElkOiAncmVsOmNoZWNrLWNhbGxzLWNoZWNrZGF0YScsXG4gICAgdHlwZTogJ2NhbGxzJyxcbiAgICBmcm9tOiAnc3ltYm9sOmpzOnNyYy9EQkhhbmRsZXIuanM6bWV0aG9kOkRCSGFuZGxlci5jaGVja19kYl9leGlzdHMnLFxuICAgIHRvOiAnc3ltYm9sOmpzOnNyYy9TUUxpdGVIZWxwZXIuanM6bWV0aG9kOlNRTGl0ZUhlbHBlci5jaGVja0RhdGEnLFxuICAgIHN0YXR1czogJ3Jlc29sdmVkJyxcbiAgICBzaXRlOiB7XG4gICAgICBmaWxlSWQ6ICdmaWxlOnNyYy9EQkhhbmRsZXIuanMnLFxuICAgICAgc3RhcnRMaW5lOiAxNSxcbiAgICAgIHN0YXJ0Q29sdW1uOiA0LFxuICAgICAgZW5kTGluZTogMTUsXG4gICAgICBlbmRDb2x1bW46IDI3LFxuICAgIH0sXG4gIH0sXG4gIHtcbiAgICByZWxhdGlvbnNoaXBJZDogJ3JlbDpjaGVjay1jYWxscy1sb2dnZXInLFxuICAgIHR5cGU6ICdjYWxscycsXG4gICAgZnJvbTogJ3N5bWJvbDpqczpzcmMvREJIYW5kbGVyLmpzOm1ldGhvZDpEQkhhbmRsZXIuY2hlY2tfZGJfZXhpc3RzJyxcbiAgICB0bzogJ2V4dGVybmFsOmxvZ2dlci5pbmZvJyxcbiAgICBzdGF0dXM6ICd1bnJlc29sdmVkJyxcbiAgICByZWFzb25Db2RlOiAndW5rbm93bl9pbXBvcnRfdGFyZ2V0JyxcbiAgICBzaXRlOiB7XG4gICAgICBmaWxlSWQ6ICdmaWxlOnNyYy9EQkhhbmRsZXIuanMnLFxuICAgICAgc3RhcnRMaW5lOiAxOSxcbiAgICAgIHN0YXJ0Q29sdW1uOiA0LFxuICAgICAgZW5kTGluZTogMTksXG4gICAgICBlbmRDb2x1bW46IDE4LFxuICAgIH0sXG4gIH0sXG4gIHtcbiAgICByZWxhdGlvbnNoaXBJZDogJ3JlbDpkYmhhbmRsZXItZGVmaW5lcy1tZXRob2QnLFxuICAgIHR5cGU6ICdkZWZpbmVzJyxcbiAgICBmcm9tOiAnc3ltYm9sOmpzOnNyYy9EQkhhbmRsZXIuanM6Y2xhc3M6REJIYW5kbGVyJyxcbiAgICB0bzogJ3N5bWJvbDpqczpzcmMvREJIYW5kbGVyLmpzOm1ldGhvZDpEQkhhbmRsZXIuY2hlY2tfZGJfZXhpc3RzJyxcbiAgICBzdGF0dXM6ICdyZXNvbHZlZCcsXG4gIH0sXG5dO1xuXG5jb25zdCBESUFHTk9TVElDUyA9IFtcbiAge1xuICAgIHNldmVyaXR5OiAnd2FybmluZycsXG4gICAgY29kZTogJ21vY2tfZGF0YScsXG4gICAgbWVzc2FnZTpcbiAgICAgICdUaGlzIGdyYXBoIGNvbWVzIGZyb20gdGhlIFBoYXNlIDAgbW9jayBhZGFwdGVyLiBJdCBkZW1vbnN0cmF0ZXMgdGhlIHBpcGVsaW5lOyBpdCBpcyBub3QgYW5hbHlzaXMgb2YgeW91ciBjb2RlLicsXG4gICAgYWZmZWN0czogWydzeW1ib2w6anM6c3JjL0RCSGFuZGxlci5qczpmdW5jdGlvbjptYWluJ10sXG4gIH0sXG4gIHtcbiAgICBzZXZlcml0eTogJ2luZm8nLFxuICAgIGNvZGU6ICdwYXJ0aWFsX2NvdmVyYWdlJyxcbiAgICBtZXNzYWdlOiAnTW9jayBhbmFseXNpcyBpbnRlbnRpb25hbGx5IGNvdmVycyBvbmx5IHRoZSBzYW1wbGUgZml4dHVyZXMuJyxcbiAgfSxcbl07XG5cbi8qKlxuICogQHJldHVybnMge2ltcG9ydCgnLi4vLi4vY29yZS9jc3IvZW50aXRpZXMuanMnKS5BbmFseXNpc1J1bn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU1vY2tBbmFseXNpcygpIHtcbiAgLy8gRGVlcCBjb3BpZXMga2VlcCBjYWxsZXJzIGZyb20gbXV0YXRpbmcgdGhlIHNoYXJlZCBmaXh0dXJlLlxuICByZXR1cm4ge1xuICAgIHJ1bklkOiBNT0NLX1JVTl9JRCxcbiAgICBhZGFwdGVySWQ6ICdtb2NrJyxcbiAgICBsYW5ndWFnZTogJ21vY2snLFxuICAgIGNzclZlcnNpb246IENTUl9WRVJTSU9OLFxuICAgIGNvbXBsZXRlbmVzczogJ3BhcnRpYWwnLFxuICAgIGZpbGVzOiBGSUxFUy5tYXAoKGZpbGUpID0+ICh7IC4uLmZpbGUgfSkpLFxuICAgIHN5bWJvbHM6IFNZTUJPTFMubWFwKChzeW1ib2wpID0+ICh7IC4uLnN5bWJvbCwgZGVjbGFyYXRpb246IHsgLi4uc3ltYm9sLmRlY2xhcmF0aW9uIH0gfSkpLFxuICAgIHJlbGF0aW9uc2hpcHM6IFJFTEFUSU9OU0hJUFMubWFwKChyZWxhdGlvbnNoaXApID0+ICh7XG4gICAgICAuLi5yZWxhdGlvbnNoaXAsXG4gICAgICBzaXRlOiByZWxhdGlvbnNoaXAuc2l0ZSA/IHsgLi4ucmVsYXRpb25zaGlwLnNpdGUgfSA6IHVuZGVmaW5lZCxcbiAgICB9KSksXG4gICAgZGlhZ25vc3RpY3M6IERJQUdOT1NUSUNTLm1hcCgoZGlhZ25vc3RpYykgPT4gKHsgLi4uZGlhZ25vc3RpYyB9KSksXG4gIH07XG59XG5cbmV4cG9ydCBjb25zdCBNT0NLX0ZJTEVfVEVYVCA9IFtcbiAgJy8vIFBoYXNlIDAgbW9jayBmaXh0dXJlIFx1MjAxNCBub3QgcmVhbCBwcm9qZWN0IHNvdXJjZS4nLFxuICBcImNsYXNzIERCSGFuZGxlciB7XCIsXG4gICcgIGFzeW5jIGNoZWNrX2RiX2V4aXN0cyhwYXRoKSB7JyxcbiAgJyAgICAvLyAuLi4nLFxuICAnICB9JyxcbiAgJ30nLFxuICAnJyxcbiAgJ2Z1bmN0aW9uIG1haW4oKSB7JyxcbiAgJyAgbmV3IERCSGFuZGxlcigpLmNoZWNrX2RiX2V4aXN0cyhcIi4vZGF0YS5kYlwiKTsnLFxuICAnfScsXG5dLmpvaW4oJ1xcbicpO1xuXG4vKiogQHR5cGUge2ltcG9ydCgnLi4vLi4vY29yZS9hZGFwdGVyUmVnaXN0cnkuanMnKS5BZGFwdGVyRGVzY3JpcHRvcn0gKi9cbmV4cG9ydCBjb25zdCBtb2NrQWRhcHRlciA9IHtcbiAgaWQ6ICdtb2NrJyxcbiAgZGlzcGxheU5hbWU6ICdNb2NrIGFkYXB0ZXIgKFBoYXNlIDApJyxcbiAgdmVyc2lvbjogJzAuMC4xJyxcbiAgbGFuZ3VhZ2VzOiBbJ21vY2snXSxcbiAgZXh0ZW5zaW9uczogWycubW9jayddLFxuICBjYXBhYmlsaXRpZXM6IGNyZWF0ZUNhcGFiaWxpdGllcyh7XG4gICAgcGFyc2U6IHRydWUsXG4gICAgZGlzY292ZXJEZWNsYXJhdGlvbnM6IHRydWUsXG4gICAgcmVzb2x2ZUNhbGxzOiB0cnVlLFxuICAgIG1hcFNvdXJjZUxvY2F0aW9uczogdHJ1ZSxcbiAgICByZXBvcnREaWFnbm9zdGljczogdHJ1ZSxcbiAgfSksXG4gIC8qKlxuICAgKiBAcGFyYW0ge3twYXRoOiBzdHJpbmcsIHRleHQ/OiBzdHJpbmcsIHJ1bklkOiBzdHJpbmd9fSBpbnB1dFxuICAgKiBAcmV0dXJucyB7aW1wb3J0KCcuLi8uLi9jb3JlL2Nzci9lbnRpdGllcy5qcycpLkFuYWx5c2lzUnVufVxuICAgKi9cbiAgYW5hbHl6ZShpbnB1dCkge1xuICAgIGNvbnN0IGFuYWx5c2lzID0gY3JlYXRlTW9ja0FuYWx5c2lzKCk7XG4gICAgLy8gVGhlIHJ1biBpZCBpcyB0aGUgb25seSBpbnB1dC1kZXJpdmVkIGZpZWxkLiBFdmVyeXRoaW5nIGVsc2UgaXMgYSBmaXh0dXJlLFxuICAgIC8vIHdoaWNoIG1ha2VzIGRldGVybWluaXNtIHRyaXZpYWwgdG8gdGVzdCBhbmQgaW1wb3NzaWJsZSB0byBmYWtlLlxuICAgIHJldHVybiB7IC4uLmFuYWx5c2lzLCBydW5JZDogaW5wdXQucnVuSWQgfTtcbiAgfSxcbn07XG4iLCAiLyoqXG4gKiBXZWJ2aWV3IHBhbmVsIGhvc3QuXG4gKlxuICogT3ducyBleGFjdGx5IG9uZSBncmFwaCBwYW5lbCBwZXIgd2luZG93LiBDcmVhdGluZyBhIHNlY29uZCBwYW5lbCB3b3VsZFxuICogZHVwbGljYXRlIGFuYWx5c2lzIHdvcmsgYW5kIHNwbGl0IG5hdmlnYXRpb24gc3RhdGUsIHNvIGBzaG93KClgIHJldmVhbHMgdGhlXG4gKiBleGlzdGluZyBwYW5lbCBpbnN0ZWFkLlxuICpcbiAqIEFsbCBtZXNzYWdlIGhhbmRsaW5nIGdvZXMgdGhyb3VnaCB0aGUgdmFsaWRhdGVkIGJyaWRnZTsgbm90aGluZyBpbiB0aGlzIGZpbGVcbiAqIHBhcnNlcyByYXcgd2VidmlldyBtZXNzYWdlcy5cbiAqL1xuXG5pbXBvcnQgKiBhcyB2c2NvZGUgZnJvbSAndnNjb2RlJztcbmltcG9ydCBjcnlwdG8gZnJvbSAnbm9kZTpjcnlwdG8nO1xuaW1wb3J0IHsgY3JlYXRlQnJpZGdlIH0gZnJvbSAnLi4vY29yZS9wcm90b2NvbC9icmlkZ2UuanMnO1xuaW1wb3J0IHsgcmVuZGVyUGFuZWxIdG1sIH0gZnJvbSAnLi9wYW5lbFRlbXBsYXRlLmpzJztcbmltcG9ydCB7IGJ1aWxkR3JhcGggfSBmcm9tICcuLi9jb3JlL2dyYXBoL21vZGVsLmpzJztcbmltcG9ydCB7IHRvRHRvIH0gZnJvbSAnLi4vY29yZS9ncmFwaC9kdG8uanMnO1xuaW1wb3J0IHsgRElSRUNUSU9OUywgUFJPVE9DT0xfVkVSU0lPTiwgY3JlYXRlRXJyb3JQYXlsb2FkIH0gZnJvbSAnLi4vY29yZS9wcm90b2NvbC9lbnZlbG9wZS5qcyc7XG5cbi8qKlxuICogQHBhcmFtIHt7XG4gKiAgIGNvbnRleHQ6IHZzY29kZS5FeHRlbnNpb25Db250ZXh0LFxuICogICBsb2dnZXI6IHtkZWJ1ZzogRnVuY3Rpb24sIHdhcm46IEZ1bmN0aW9uLCBlcnJvcjogRnVuY3Rpb259LFxuICogICByZWdpc3RyeTogUmV0dXJuVHlwZTx0eXBlb2YgaW1wb3J0KCcuLi9jb3JlL2FkYXB0ZXJSZWdpc3RyeS5qcycpLmNyZWF0ZUFkYXB0ZXJSZWdpc3RyeT4sXG4gKiAgIGV4dGVuc2lvblZlcnNpb246IHN0cmluZyxcbiAqIH19IG9wdGlvbnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVBhbmVsTWFuYWdlcih7IGNvbnRleHQsIGxvZ2dlciwgcmVnaXN0cnksIGV4dGVuc2lvblZlcnNpb24gfSkge1xuICAvKiogQHR5cGUge3ZzY29kZS5XZWJ2aWV3UGFuZWwgfCBudWxsfSAqL1xuICBsZXQgcGFuZWwgPSBudWxsO1xuICAvKiogQHR5cGUge3tkaXNwb3NlOiBGdW5jdGlvbiwgcmVzcG9uZDogRnVuY3Rpb24sIHBlbmRpbmdDb3VudDogRnVuY3Rpb259IHwgbnVsbH0gKi9cbiAgbGV0IGJyaWRnZSA9IG51bGw7XG4gIGxldCBydW5Db3VudGVyID0gMDtcblxuICBmdW5jdGlvbiB3ZWJ2aWV3Um9vdCgpIHtcbiAgICByZXR1cm4gdnNjb2RlLlVyaS5qb2luUGF0aChjb250ZXh0LmV4dGVuc2lvblVyaSwgJ2Rpc3QnLCAnd2VidmlldycpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoXG4gICAqIEByZXR1cm5zIHt7b2s6IHRydWUsIGR0bzogb2JqZWN0fSB8IHtvazogZmFsc2UsIGNvZGU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nLCBpc3N1ZXM/OiB1bmtub3dufX1cbiAgICovXG4gIGFzeW5jIGZ1bmN0aW9uIGJ1aWxkR3JhcGhEdG8ocGF0aCkge1xuICAgIHJ1bkNvdW50ZXIgKz0gMTtcbiAgICBjb25zdCBydW5JZCA9IGBydW46JHtEYXRlLm5vdygpLnRvU3RyaW5nKDM2KX0tJHtydW5Db3VudGVyfWA7XG4gICAgY29uc3QgYW5hbHlzaXMgPSBhd2FpdCByZWdpc3RyeS5hbmFseXplKHsgcGF0aCwgcnVuSWQgfSk7XG4gICAgaWYgKCFhbmFseXNpcy5vaykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb2s6IGZhbHNlLFxuICAgICAgICBjb2RlOiBhbmFseXNpcy5jb2RlLFxuICAgICAgICBtZXNzYWdlOiBhbmFseXNpcy5tZXNzYWdlLFxuICAgICAgICBpc3N1ZXM6IGFuYWx5c2lzLmlzc3VlcyxcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7IG9rOiB0cnVlLCBkdG86IHRvRHRvKGJ1aWxkR3JhcGgoYW5hbHlzaXMucnVuKSkgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGx5SHRtbCh0YXJnZXQpIHtcbiAgICBjb25zdCBub25jZSA9IGNyeXB0by5yYW5kb21CeXRlcygxNikudG9TdHJpbmcoJ2Jhc2U2NCcpO1xuICAgIGNvbnN0IHdlYnZpZXcgPSB0YXJnZXQud2VidmlldztcbiAgICBjb25zdCByb290ID0gd2Vidmlld1Jvb3QoKTtcbiAgICB3ZWJ2aWV3Lm9wdGlvbnMgPSB7XG4gICAgICBlbmFibGVTY3JpcHRzOiB0cnVlLFxuICAgICAgcmV0YWluQ29udGV4dFdoZW5IaWRkZW46IEJvb2xlYW4oXG4gICAgICAgIHZzY29kZS53b3Jrc3BhY2VcbiAgICAgICAgICAuZ2V0Q29uZmlndXJhdGlvbignY29kZWZsb3cnKVxuICAgICAgICAgIC5nZXQoJ2V4cGxvcmVyLnJldGFpbkNvbnRleHQnLCBmYWxzZSksXG4gICAgICApLFxuICAgICAgbG9jYWxSZXNvdXJjZVJvb3RzOiBbcm9vdF0sXG4gICAgfTtcbiAgICB3ZWJ2aWV3Lmh0bWwgPSByZW5kZXJQYW5lbEh0bWwoe1xuICAgICAgbm9uY2UsXG4gICAgICBjc3BTb3VyY2U6IHdlYnZpZXcuY3NwU291cmNlLFxuICAgICAgc2NyaXB0VXJpOiB3ZWJ2aWV3LmFzV2Vidmlld1VyaSh2c2NvZGUuVXJpLmpvaW5QYXRoKHJvb3QsICdtYWluLmpzJykpLnRvU3RyaW5nKCksXG4gICAgICBzdHlsZVVyaTogd2Vidmlldy5hc1dlYnZpZXdVcmkodnNjb2RlLlVyaS5qb2luUGF0aChyb290LCAnc3R5bGVzLmNzcycpKS50b1N0cmluZygpLFxuICAgICAgdGl0bGU6ICdDb2RlRmxvdycsXG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiB3aXJlKHRhcmdldCkge1xuICAgIGNvbnN0IGxvZ2dlclByb3h5ID0ge1xuICAgICAgZGVidWc6IC8qKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBbZmllbGRzXSAqLyAoXG4gICAgICAgIG1lc3NhZ2UsXG4gICAgICAgIGZpZWxkcyxcbiAgICAgICkgPT4gbG9nZ2VyLmRlYnVnKG1lc3NhZ2UsIGZpZWxkcyksXG4gICAgICB3YXJuOiAobWVzc2FnZSwgZmllbGRzKSA9PiBsb2dnZXIud2FybihtZXNzYWdlLCBmaWVsZHMpLFxuICAgICAgZXJyb3I6IChtZXNzYWdlLCBmaWVsZHMpID0+IGxvZ2dlci5lcnJvcihtZXNzYWdlLCBmaWVsZHMpLFxuICAgIH07XG5cbiAgICBjb25zdCBuZXh0QnJpZGdlID0gY3JlYXRlQnJpZGdlKHtcbiAgICAgIHBvc3Q6IChtZXNzYWdlKSA9PiB7XG4gICAgICAgIHZvaWQgUHJvbWlzZS5yZXNvbHZlKHRhcmdldC53ZWJ2aWV3LnBvc3RNZXNzYWdlKG1lc3NhZ2UpKS50aGVuKFxuICAgICAgICAgIChkZWxpdmVyZWQpID0+IHtcbiAgICAgICAgICAgIGlmICghZGVsaXZlcmVkKSB7XG4gICAgICAgICAgICAgIGxvZ2dlci5kZWJ1ZygncGFuZWwucG9zdF91bmRlbGl2ZXJlZCcsIHsga2luZDogbWVzc2FnZS5raW5kIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICBsb2dnZXIuZGVidWcoJ3BhbmVsLnBvc3RfZmFpbGVkJywge1xuICAgICAgICAgICAgICBraW5kOiBtZXNzYWdlLmtpbmQsXG4gICAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LFxuICAgICAgICApO1xuICAgICAgfSxcbiAgICAgIGluYm91bmREaXJlY3Rpb246IERJUkVDVElPTlMuV0VCVklFV19UT19IT1NULFxuICAgICAgbG9nZ2VyOiBsb2dnZXJQcm94eSxcbiAgICB9KTtcblxuICAgIG5leHRCcmlkZ2Uub24oJ3dlYnZpZXcucmVhZHknLCBhc3luYyAoX3BheWxvYWQsIHsgcmVxdWVzdElkIH0pID0+IHtcbiAgICAgIG5leHRCcmlkZ2UucmVzcG9uZChcbiAgICAgICAgJ2NhcGFiaWxpdGllcy5kYXRhJyxcbiAgICAgICAge1xuICAgICAgICAgIHByb3RvY29sVmVyc2lvbjogUFJPVE9DT0xfVkVSU0lPTixcbiAgICAgICAgICBleHRlbnNpb25WZXJzaW9uLFxuICAgICAgICAgIGFkYXB0ZXJzOiByZWdpc3RyeS5jYXBhYmlsaXR5TWF0cml4KCksXG4gICAgICAgICAgY2FwYWJpbGl0aWVzOiB7XG4gICAgICAgICAgICBjZnA6IGZhbHNlLFxuICAgICAgICAgICAgY2FsbEdyYXBoOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGFGbG93OiBmYWxzZSxcbiAgICAgICAgICAgIGhvdmVyUHJldmlldzogZmFsc2UsXG4gICAgICAgICAgICBwcm9qZWN0SW5kZXg6IGZhbHNlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgZGVtb01vZGU6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVlc3RJZCxcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICBuZXh0QnJpZGdlLm9uKCdncmFwaC5sb2FkJywgYXN5bmMgKF9wYXlsb2FkLCB7IHJlcXVlc3RJZCB9KSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBidWlsZEdyYXBoRHRvKCdzYW1wbGUubW9jaycpO1xuICAgICAgaWYgKCFyZXN1bHQub2spIHtcbiAgICAgICAgbmV4dEJyaWRnZS5yZXNwb25kKFxuICAgICAgICAgICdwcm90b2NvbC5lcnJvcicsXG4gICAgICAgICAgY3JlYXRlRXJyb3JQYXlsb2FkKHJlc3VsdC5jb2RlLCByZXN1bHQubWVzc2FnZSwgeyBpc3N1ZXM6IHJlc3VsdC5pc3N1ZXMgfSksXG4gICAgICAgICAgcmVxdWVzdElkLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBuZXh0QnJpZGdlLnJlc3BvbmQoJ2dyYXBoLmRhdGEnLCB7IGR0bzogcmVzdWx0LmR0byB9LCByZXF1ZXN0SWQpO1xuICAgIH0pO1xuXG4gICAgbmV4dEJyaWRnZS5vbignbm9kZS5zZWxlY3QnLCBhc3luYyAocGF5bG9hZCkgPT4ge1xuICAgICAgbG9nZ2VyLmRlYnVnKCdwYW5lbC5ub2RlX3NlbGVjdGVkJywgeyBub2RlSWQ6IHBheWxvYWQubm9kZUlkID8/IG51bGwgfSk7XG4gICAgfSk7XG5cbiAgICBuZXh0QnJpZGdlLm9uKCdwYW5lbC5waW5nJywgYXN5bmMgKF9wYXlsb2FkLCB7IHJlcXVlc3RJZCB9KSA9PiB7XG4gICAgICBuZXh0QnJpZGdlLnJlc3BvbmQoJ3BhbmVsLnBvbmcnLCB7IGF0OiBEYXRlLm5vdygpIH0sIHJlcXVlc3RJZCk7XG4gICAgfSk7XG5cbiAgICB0YXJnZXQub25EaWRSZWNlaXZlTWVzc2FnZSgobWVzc2FnZSkgPT4ge1xuICAgICAgdm9pZCBuZXh0QnJpZGdlLmhhbmRsZU1lc3NhZ2UobWVzc2FnZSk7XG4gICAgfSk7XG5cbiAgICB0YXJnZXQub25EaWREaXNwb3NlKCgpID0+IHtcbiAgICAgIG5leHRCcmlkZ2UuZGlzcG9zZSgncGFuZWxfZGlzcG9zZWQnKTtcbiAgICAgIGlmIChwYW5lbCA9PT0gdGFyZ2V0KSB7XG4gICAgICAgIHBhbmVsID0gbnVsbDtcbiAgICAgICAgYnJpZGdlID0gbnVsbDtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBuZXh0QnJpZGdlO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvdygpIHtcbiAgICBpZiAocGFuZWwpIHtcbiAgICAgIHBhbmVsLnJldmVhbCh1bmRlZmluZWQsIGZhbHNlKTtcbiAgICAgIHJldHVybiBwYW5lbDtcbiAgICB9XG5cbiAgICBjb25zdCBjcmVhdGVkID0gdnNjb2RlLndpbmRvdy5jcmVhdGVXZWJ2aWV3UGFuZWwoXG4gICAgICAnY29kZWZsb3cuZ3JhcGgnLFxuICAgICAgJ0NvZGVGbG93JyxcbiAgICAgIHsgdmlld0NvbHVtbjogdnNjb2RlLlZpZXdDb2x1bW4uQmVzaWRlLCBwcmVzZXJ2ZUZvY3VzOiBmYWxzZSB9LFxuICAgICAge1xuICAgICAgICBlbmFibGVTY3JpcHRzOiB0cnVlLFxuICAgICAgICBsb2NhbFJlc291cmNlUm9vdHM6IFt3ZWJ2aWV3Um9vdCgpXSxcbiAgICAgIH0sXG4gICAgKTtcbiAgICBwYW5lbCA9IGNyZWF0ZWQ7XG4gICAgYXBwbHlIdG1sKGNyZWF0ZWQpO1xuICAgIGJyaWRnZSA9IHdpcmUoY3JlYXRlZCk7XG4gICAgcmV0dXJuIGNyZWF0ZWQ7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHNob3csXG4gICAgZGlzcG9zZSgpIHtcbiAgICAgIGlmIChicmlkZ2UpIHtcbiAgICAgICAgYnJpZGdlLmRpc3Bvc2UoJ2V4dGVuc2lvbl9kaXNwb3NlZCcpO1xuICAgICAgICBicmlkZ2UgPSBudWxsO1xuICAgICAgfVxuICAgICAgaWYgKHBhbmVsKSB7XG4gICAgICAgIHBhbmVsLmRpc3Bvc2UoKTtcbiAgICAgICAgcGFuZWwgPSBudWxsO1xuICAgICAgfVxuICAgIH0sXG4gICAgaXNPcGVuOiAoKSA9PiBwYW5lbCAhPT0gbnVsbCxcbiAgICBwZW5kaW5nUmVxdWVzdHM6ICgpID0+IChicmlkZ2UgPyBicmlkZ2UucGVuZGluZ0NvdW50KCkgOiAwKSxcbiAgICAvKiogVGVzdCBob29rOiByZWJ1aWxkIHRoZSBIVE1MIGZvciB0aGUgb3BlbiBwYW5lbC4gKi9cbiAgICByZWxvYWQoKSB7XG4gICAgICBpZiAocGFuZWwpIHtcbiAgICAgICAgYXBwbHlIdG1sKHBhbmVsKTtcbiAgICAgIH1cbiAgICB9LFxuICB9O1xufVxuIiwgIi8qKlxuICogQ29kZUZsb3cgd2VidmlldyBwcm90b2NvbC5cbiAqXG4gKiBUaGUgZXh0ZW5zaW9uIGhvc3QgYW5kIHRoZSB3ZWJ2aWV3IGFyZSBzZXBhcmF0ZSBKYXZhU2NyaXB0IGNvbnRleHRzLiBFdmVyeVxuICogbWVzc2FnZSB0aGF0IGNyb3NzZXMgdGhhdCBib3VuZGFyeSBtdXN0IHBhc3MgdGhyb3VnaCB0aGlzIG1vZHVsZSBzbyB0aGF0IGFcbiAqIHNpbmdsZSwgdmVyc2lvbmVkIGNvbnRyYWN0IGRlY2lkZXMgd2hhdCBpcyBsZWdhbC5cbiAqXG4gKiBUaGlzIG1vZHVsZSBpcyBpbnRlbnRpb25hbGx5IGRlcGVuZGVuY3ktZnJlZTogaXQgaXMgYnVuZGxlZCBpbnRvIGJvdGggdGhlXG4gKiBleHRlbnNpb24gaG9zdCBhbmQgdGhlIHdlYnZpZXcuXG4gKi9cblxuZXhwb3J0IGNvbnN0IFBST1RPQ09MX1ZFUlNJT04gPSAxO1xuXG4vKiogSGFyZCBjZWlsaW5nIG9uIGEgc2VyaWFsaXplZCBtZXNzYWdlLiBMYXJnZXIgbWVzc2FnZXMgYXJlIHJlamVjdGVkLCBuZXZlciB0cnVuY2F0ZWQuICovXG5leHBvcnQgY29uc3QgTUFYX1BBWUxPQURfQllURVMgPSAxXzAwMF8wMDA7XG5cbi8qKiBgZG9tYWluLmFjdGlvbmAgaW4gbG93ZXIgY2FzZSwgYXQgbGVhc3QgdHdvIHNlZ21lbnRzLiAqL1xuZXhwb3J0IGNvbnN0IEtJTkRfUEFUVEVSTiA9IC9eW2Etel0rKFxcLlthLXpdKykrJC87XG5cbmV4cG9ydCBjb25zdCBSRVFVRVNUX0lEX1BBVFRFUk4gPSAvXltBLVphLXowLTlfLV17MSwxMjh9JC87XG5cbi8qKiBLaW5kcyBhIHdlYnZpZXcgbWF5IHNlbmQgdG8gdGhlIGhvc3QuICovXG5leHBvcnQgY29uc3QgV0VCVklFV19UT19IT1NUID0gT2JqZWN0LmZyZWV6ZShbXG4gICd3ZWJ2aWV3LnJlYWR5JyxcbiAgJ2dyYXBoLmxvYWQnLFxuICAnbm9kZS5zZWxlY3QnLFxuICAncGFuZWwucGluZycsXG5dKTtcblxuLyoqIEtpbmRzIHRoZSBob3N0IG1heSBzZW5kIHRvIHRoZSB3ZWJ2aWV3LiAqL1xuZXhwb3J0IGNvbnN0IEhPU1RfVE9fV0VCVklFVyA9IE9iamVjdC5mcmVlemUoW1xuICAnZ3JhcGguZGF0YScsXG4gICdjYXBhYmlsaXRpZXMuZGF0YScsXG4gICdwcm90b2NvbC5lcnJvcicsXG4gICdwcm90b2NvbC5hY2snLFxuICAncGFuZWwucG9uZycsXG5dKTtcblxuZXhwb3J0IGNvbnN0IERJUkVDVElPTlMgPSBPYmplY3QuZnJlZXplKHtcbiAgV0VCVklFV19UT19IT1NUOiAnd2Vidmlld190b19ob3N0JyxcbiAgSE9TVF9UT19XRUJWSUVXOiAnaG9zdF90b193ZWJ2aWV3Jyxcbn0pO1xuXG5jb25zdCBLSU5EX0FMTE9XTElTVCA9IE9iamVjdC5mcmVlemUoe1xuICBbRElSRUNUSU9OUy5XRUJWSUVXX1RPX0hPU1RdOiBuZXcgU2V0KFdFQlZJRVdfVE9fSE9TVCksXG4gIFtESVJFQ1RJT05TLkhPU1RfVE9fV0VCVklFV106IG5ldyBTZXQoSE9TVF9UT19XRUJWSUVXKSxcbn0pO1xuXG5jb25zdCBVTlNBRkVfS0VZUyA9IG5ldyBTZXQoWydfX3Byb3RvX18nLCAnY29uc3RydWN0b3InLCAncHJvdG90eXBlJ10pO1xuXG5jb25zdCBNQVhfS0VZX1NDQU5fREVQVEggPSA4O1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEVudmVsb3BlXG4gKiBAcHJvcGVydHkge251bWJlcn0gcHJvdG9jb2xWZXJzaW9uXG4gKiBAcHJvcGVydHkge3N0cmluZ30ga2luZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtyZXF1ZXN0SWRdXG4gKiBAcHJvcGVydHkge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBwYXlsb2FkXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBWYWxpZGF0aW9uU3VjY2Vzc1xuICogQHByb3BlcnR5IHt0cnVlfSBva1xuICogQHByb3BlcnR5IHtFbnZlbG9wZX0gZW52ZWxvcGVcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFZhbGlkYXRpb25GYWlsdXJlXG4gKiBAcHJvcGVydHkge2ZhbHNlfSBva1xuICogQHByb3BlcnR5IHsnRV9QUk9UT0NPTCd8J0VfTElNSVQnfSBjb2RlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gcmVhc29uXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbWVzc2FnZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtwYXRoXVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtyZXF1ZXN0SWRdXG4gKi9cblxuLyoqXG4gKiBCdWlsZCBhIHdlbGwtZm9ybWVkIGVudmVsb3BlLiBQcm9kdWNlcnMgc2hvdWxkIHVzZSB0aGlzIGluc3RlYWQgb2Ygd3JpdGluZ1xuICogb2JqZWN0IGxpdGVyYWxzIHNvIHRoYXQgdGhlIHZlcnNpb24gZmllbGQgY2FuIG5ldmVyIGJlIGZvcmdvdHRlbi5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30ga2luZFxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW3BheWxvYWRdXG4gKiBAcGFyYW0ge3N0cmluZ30gW3JlcXVlc3RJZF1cbiAqIEByZXR1cm5zIHtFbnZlbG9wZX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVudmVsb3BlKGtpbmQsIHBheWxvYWQsIHJlcXVlc3RJZCkge1xuICAvKiogQHR5cGUge0VudmVsb3BlfSAqL1xuICBjb25zdCBlbnZlbG9wZSA9IHtcbiAgICBwcm90b2NvbFZlcnNpb246IFBST1RPQ09MX1ZFUlNJT04sXG4gICAga2luZCxcbiAgICBwYXlsb2FkOiBwYXlsb2FkID8/IHt9LFxuICB9O1xuICBpZiAocmVxdWVzdElkKSB7XG4gICAgZW52ZWxvcGUucmVxdWVzdElkID0gcmVxdWVzdElkO1xuICB9XG4gIHJldHVybiBlbnZlbG9wZTtcbn1cblxuLyoqXG4gKiBCdWlsZCBhIHR5cGVkIGVycm9yIHBheWxvYWQuIGBkZXRhaWxgIG11c3QgbmV2ZXIgY29udGFpbiBzb3VyY2UgdGV4dC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IFtkZXRhaWxdXG4gKiBAcmV0dXJucyB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFcnJvclBheWxvYWQoY29kZSwgbWVzc2FnZSwgZGV0YWlsKSB7XG4gIC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovXG4gIGNvbnN0IHBheWxvYWQgPSB7IGNvZGUsIG1lc3NhZ2UgfTtcbiAgaWYgKGRldGFpbCkge1xuICAgIHBheWxvYWQuZGV0YWlsID0gZGV0YWlsO1xuICB9XG4gIHJldHVybiBwYXlsb2FkO1xufVxuXG4vKipcbiAqIEFwcHJveGltYXRlIHNlcmlhbGl6ZWQgc2l6ZSBvZiBhIG1lc3NhZ2UuIFVzZWQgZm9yIGxpbWl0IGVuZm9yY2VtZW50OyB0aGVcbiAqIGV4YWN0IGJ5dGVzIGRvIG5vdCBtYXR0ZXIsIG9ubHkgdGhhdCBvdmVyc2l6ZWQgbWVzc2FnZXMgYXJlIHJlZnVzZWQgYmVmb3JlXG4gKiB0aGV5IGFyZSBwb3N0ZWQuXG4gKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lc3NhZ2VTaXplKHZhbHVlKSB7XG4gIHRyeSB7XG4gICAgY29uc3QganNvbiA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcbiAgICByZXR1cm4gdHlwZW9mIGpzb24gPT09ICdzdHJpbmcnID8ganNvbi5sZW5ndGggOiAwO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHJldHVybnMge3ZhbHVlIGlzIFJlY29yZDxzdHJpbmcsIHVua25vd24+fVxuICovXG5mdW5jdGlvbiBpc1BsYWluT2JqZWN0KHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKTtcbn1cblxuLyoqXG4gKiBSZWplY3QgcGF5bG9hZHMgdGhhdCBjb3VsZCBwb2lzb24gcHJvdG90eXBlcyB3aGVuIG1lcmdlZCBvciBzcHJlYWQuXG4gKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHBhcmFtIHtzdHJpbmd9IHBhdGhcbiAqIEBwYXJhbSB7bnVtYmVyfSBkZXB0aFxuICogQHJldHVybnMge3tvazogdHJ1ZX0gfCB7b2s6IGZhbHNlLCBwYXRoOiBzdHJpbmcsIGtleTogc3RyaW5nfX1cbiAqL1xuZnVuY3Rpb24gc2NhblVuc2FmZUtleXModmFsdWUsIHBhdGgsIGRlcHRoKSB7XG4gIGlmIChkZXB0aCA+IE1BWF9LRVlfU0NBTl9ERVBUSCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIHsgb2s6IHRydWUgfTtcbiAgfVxuICBjb25zdCBlbnRyaWVzID0gQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyB2YWx1ZS5lbnRyaWVzKCkgOiBPYmplY3QuZW50cmllcyh2YWx1ZSk7XG4gIGZvciAoY29uc3QgW2tleSwgY2hpbGRdIG9mIGVudHJpZXMpIHtcbiAgICBjb25zdCBjaGlsZFBhdGggPSBBcnJheS5pc0FycmF5KHZhbHVlKSA/IGAke3BhdGh9WyR7a2V5fV1gIDogYCR7cGF0aH0uJHtrZXl9YDtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpICYmIFVOU0FGRV9LRVlTLmhhcyhTdHJpbmcoa2V5KSkpIHtcbiAgICAgIHJldHVybiB7IG9rOiBmYWxzZSwgcGF0aDogY2hpbGRQYXRoLCBrZXk6IFN0cmluZyhrZXkpIH07XG4gICAgfVxuICAgIGNvbnN0IG5lc3RlZCA9IHNjYW5VbnNhZmVLZXlzKGNoaWxkLCBjaGlsZFBhdGgsIGRlcHRoICsgMSk7XG4gICAgaWYgKCFuZXN0ZWQub2spIHtcbiAgICAgIHJldHVybiBuZXN0ZWQ7XG4gICAgfVxuICB9XG4gIHJldHVybiB7IG9rOiB0cnVlIH07XG59XG5cbi8qKlxuICogVmFsaWRhdGUgYW4gaW5ib3VuZCBtZXNzYWdlIGFnYWluc3QgdGhlIHByb3RvY29sIGNvbnRyYWN0LlxuICpcbiAqIFZhbGlkYXRpb24gaXMgdG90YWw6IGV2ZXJ5IHJlamVjdGlvbiByZXR1cm5zIGEgdHlwZWQgZmFpbHVyZSB3aXRoIGEgc3RhYmxlXG4gKiByZWFzb24gY29kZSwgYW5kIG5ldmVyIHRocm93cy5cbiAqXG4gKiBAcGFyYW0ge3Vua25vd259IHJhd1xuICogQHBhcmFtIHt7ZGlyZWN0aW9uOiAnd2Vidmlld190b19ob3N0JyB8ICdob3N0X3RvX3dlYnZpZXcnfX0gb3B0aW9uc1xuICogQHJldHVybnMge1ZhbGlkYXRpb25TdWNjZXNzIHwgVmFsaWRhdGlvbkZhaWx1cmV9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUVudmVsb3BlKHJhdywgb3B0aW9ucykge1xuICBjb25zdCBkaXJlY3Rpb24gPSBvcHRpb25zPy5kaXJlY3Rpb247XG4gIGNvbnN0IGFsbG93bGlzdCA9IEtJTkRfQUxMT1dMSVNUW2RpcmVjdGlvbl07XG4gIGlmICghYWxsb3dsaXN0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgIHJlYXNvbjogJ3Vua25vd25fZGlyZWN0aW9uJyxcbiAgICAgIG1lc3NhZ2U6IGBVbmtub3duIHByb3RvY29sIGRpcmVjdGlvbjogJHtTdHJpbmcoZGlyZWN0aW9uKX1gLFxuICAgIH07XG4gIH1cblxuICBpZiAoIWlzUGxhaW5PYmplY3QocmF3KSkge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9QUk9UT0NPTCcsXG4gICAgICByZWFzb246ICdub3RfYW5fb2JqZWN0JyxcbiAgICAgIG1lc3NhZ2U6ICdNZXNzYWdlIG11c3QgYmUgYSBwbGFpbiBvYmplY3QuJyxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgY2FuZGlkYXRlID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKHJhdyk7XG5cbiAgaWYgKGNhbmRpZGF0ZS5wcm90b2NvbFZlcnNpb24gIT09IFBST1RPQ09MX1ZFUlNJT04pIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAndmVyc2lvbl9taXNtYXRjaCcsXG4gICAgICBtZXNzYWdlOiBgVW5zdXBwb3J0ZWQgcHJvdG9jb2wgdmVyc2lvbjogZXhwZWN0ZWQgJHtQUk9UT0NPTF9WRVJTSU9OfSwgcmVjZWl2ZWQgJHtTdHJpbmcoXG4gICAgICAgIGNhbmRpZGF0ZS5wcm90b2NvbFZlcnNpb24sXG4gICAgICApfS5gLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBraW5kID0gY2FuZGlkYXRlLmtpbmQ7XG4gIGlmICh0eXBlb2Yga2luZCAhPT0gJ3N0cmluZycgfHwgIUtJTkRfUEFUVEVSTi50ZXN0KGtpbmQpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgIHJlYXNvbjogJ2ludmFsaWRfa2luZCcsXG4gICAgICBtZXNzYWdlOiAnTWVzc2FnZSBraW5kIG11c3QgbG9vayBsaWtlIFwiZG9tYWluLmFjdGlvblwiIGluIGxvd2VyIGNhc2UuJyxcbiAgICAgIHBhdGg6ICdraW5kJyxcbiAgICB9O1xuICB9XG5cbiAgaWYgKCFhbGxvd2xpc3QuaGFzKGtpbmQpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgIHJlYXNvbjogJ3Vua25vd25fa2luZCcsXG4gICAgICBtZXNzYWdlOiBgS2luZCBcIiR7a2luZH1cIiBpcyBub3QgYWNjZXB0ZWQgaW4gZGlyZWN0aW9uIFwiJHtkaXJlY3Rpb259XCIuYCxcbiAgICAgIHBhdGg6ICdraW5kJyxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgcmVxdWVzdElkID0gY2FuZGlkYXRlLnJlcXVlc3RJZDtcbiAgaWYgKHJlcXVlc3RJZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKHR5cGVvZiByZXF1ZXN0SWQgIT09ICdzdHJpbmcnIHx8ICFSRVFVRVNUX0lEX1BBVFRFUk4udGVzdChyZXF1ZXN0SWQpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvazogZmFsc2UsXG4gICAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgICAgcmVhc29uOiAnaW52YWxpZF9yZXF1ZXN0X2lkJyxcbiAgICAgICAgbWVzc2FnZTogJ3JlcXVlc3RJZCBtdXN0IGJlIDEtMTI4IGNoYXJhY3RlcnMgb2YgQS1aLCBhLXosIDAtOSwgXCJfXCIgb3IgXCItXCIuJyxcbiAgICAgICAgcGF0aDogJ3JlcXVlc3RJZCcsXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHBheWxvYWQgPSBjYW5kaWRhdGUucGF5bG9hZCA/PyB7fTtcbiAgaWYgKCFpc1BsYWluT2JqZWN0KHBheWxvYWQpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgIHJlYXNvbjogJ2ludmFsaWRfcGF5bG9hZCcsXG4gICAgICBtZXNzYWdlOiAncGF5bG9hZCBtdXN0IGJlIGEgcGxhaW4gb2JqZWN0LicsXG4gICAgICBwYXRoOiAncGF5bG9hZCcsXG4gICAgICByZXF1ZXN0SWQ6IHR5cGVvZiByZXF1ZXN0SWQgPT09ICdzdHJpbmcnID8gcmVxdWVzdElkIDogdW5kZWZpbmVkLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBrZXlTY2FuID0gc2NhblVuc2FmZUtleXMocGF5bG9hZCwgJ3BheWxvYWQnLCAwKTtcbiAgaWYgKCFrZXlTY2FuLm9rKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgIHJlYXNvbjogJ3Vuc2FmZV9rZXknLFxuICAgICAgbWVzc2FnZTogYFBheWxvYWQgY29udGFpbnMgYSBmb3JiaWRkZW4ga2V5IFwiJHtrZXlTY2FuLmtleX1cIi5gLFxuICAgICAgcGF0aDoga2V5U2Nhbi5wYXRoLFxuICAgICAgcmVxdWVzdElkOiB0eXBlb2YgcmVxdWVzdElkID09PSAnc3RyaW5nJyA/IHJlcXVlc3RJZCA6IHVuZGVmaW5lZCxcbiAgICB9O1xuICB9XG5cbiAgaWYgKG1lc3NhZ2VTaXplKGNhbmRpZGF0ZSkgPiBNQVhfUEFZTE9BRF9CWVRFUykge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9MSU1JVCcsXG4gICAgICByZWFzb246ICdwYXlsb2FkX3Rvb19sYXJnZScsXG4gICAgICBtZXNzYWdlOiBgTWVzc2FnZSBleGNlZWRzIHRoZSAke01BWF9QQVlMT0FEX0JZVEVTfSBieXRlIGxpbWl0LmAsXG4gICAgICByZXF1ZXN0SWQ6IHR5cGVvZiByZXF1ZXN0SWQgPT09ICdzdHJpbmcnID8gcmVxdWVzdElkIDogdW5kZWZpbmVkLFxuICAgIH07XG4gIH1cblxuICAvKiogQHR5cGUge0VudmVsb3BlfSAqL1xuICBjb25zdCBlbnZlbG9wZSA9IHtcbiAgICBwcm90b2NvbFZlcnNpb246IFBST1RPQ09MX1ZFUlNJT04sXG4gICAga2luZCxcbiAgICBwYXlsb2FkLFxuICB9O1xuICBpZiAodHlwZW9mIHJlcXVlc3RJZCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbnZlbG9wZS5yZXF1ZXN0SWQgPSByZXF1ZXN0SWQ7XG4gIH1cblxuICByZXR1cm4geyBvazogdHJ1ZSwgZW52ZWxvcGUgfTtcbn1cbiIsICIvKipcbiAqIFdlYnZpZXcgbWVzc2FnZSBicmlkZ2UuXG4gKlxuICogU3ltbWV0cmljIGltcGxlbWVudGF0aW9uIHVzZWQgYnkgYm90aCB0aGUgZXh0ZW5zaW9uIGhvc3QgYW5kIHRoZSB3ZWJ2aWV3LlxuICogUmVzcG9uc2liaWxpdGllczpcbiAqIC0gVmFsaWRhdGUgZXZlcnkgaW5ib3VuZCBtZXNzYWdlIGJlZm9yZSBhbnkgaGFuZGxlciBzZWVzIGl0LlxuICogLSBDb3JyZWxhdGUgcmVxdWVzdHMgd2l0aCByZXNwb25zZXMsIHdpdGggYSB0aW1lb3V0IHBlciByZXF1ZXN0LlxuICogLSBDb250YWluIGhhbmRsZXIgZmFpbHVyZXMgYW5kIHJlcG9ydCB0aGVtIGFzIHR5cGVkIHByb3RvY29sIGVycm9ycy5cbiAqIC0gUmVqZWN0IHdvcmsgYWZ0ZXIgZGlzcG9zYWwgc28gYSBjbG9zZWQgcGFuZWwgY2Fubm90IGxlYWsgdGltZXJzLlxuICpcbiAqIFRoZSBicmlkZ2UgaGFzIG5vIGRlcGVuZGVuY3kgb24gdGhlIGB2c2NvZGVgIG1vZHVsZTogdGhlIHRyYW5zcG9ydCAoYHBvc3RgKVxuICogaXMgaW5qZWN0ZWQuIFRoYXQgbWFrZXMgdGhlIHdob2xlIHJlcXVlc3QvcmVzcG9uc2UgY29udHJhY3QgdW5pdC10ZXN0YWJsZSBpblxuICogcGxhaW4gTm9kZS5cbiAqL1xuXG5pbXBvcnQge1xuICBESVJFQ1RJT05TLFxuICBIT1NUX1RPX1dFQlZJRVcsXG4gIFdFQlZJRVdfVE9fSE9TVCxcbiAgY3JlYXRlRW52ZWxvcGUsXG4gIGNyZWF0ZUVycm9yUGF5bG9hZCxcbiAgbWVzc2FnZVNpemUsXG4gIHZhbGlkYXRlRW52ZWxvcGUsXG59IGZyb20gJy4vZW52ZWxvcGUuanMnO1xuXG5leHBvcnQgY2xhc3MgUHJvdG9jb2xFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IFtkZXRhaWxdXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjb2RlLCBtZXNzYWdlLCBkZXRhaWwpIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSAnUHJvdG9jb2xFcnJvcic7XG4gICAgdGhpcy5jb2RlID0gY29kZTtcbiAgICBpZiAoZGV0YWlsKSB7XG4gICAgICB0aGlzLmRldGFpbCA9IGRldGFpbDtcbiAgICB9XG4gIH1cbn1cblxuLyoqIEB0eXBlIHt7ZGVidWc6IEZ1bmN0aW9uLCB3YXJuOiBGdW5jdGlvbiwgZXJyb3I6IEZ1bmN0aW9ufX0gKi9cbmNvbnN0IE5PT1BfTE9HR0VSID0ge1xuICBkZWJ1ZygpIHt9LFxuICB3YXJuKCkge30sXG4gIGVycm9yKCkge30sXG59O1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEJyaWRnZU9wdGlvbnNcbiAqIEBwcm9wZXJ0eSB7KG1lc3NhZ2U6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSA9PiB2b2lkfSBwb3N0ICBUcmFuc3BvcnQgdG8gdGhlIG90aGVyIHNpZGUuXG4gKiBAcHJvcGVydHkgeyd3ZWJ2aWV3X3RvX2hvc3QnIHwgJ2hvc3RfdG9fd2Vidmlldyd9IGluYm91bmREaXJlY3Rpb25cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbdGltZW91dE1zXVxuICogQHByb3BlcnR5IHtudW1iZXJ9IFttYXhJbkZsaWdodF1cbiAqIEBwcm9wZXJ0eSB7KCkgPT4gc3RyaW5nfSBbY3JlYXRlUmVxdWVzdElkXVxuICogQHByb3BlcnR5IHt0eXBlb2YgTk9PUF9MT0dHRVJ9IFtsb2dnZXJdXG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge0JyaWRnZU9wdGlvbnN9IG9wdGlvbnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUJyaWRnZShvcHRpb25zKSB7XG4gIGNvbnN0IHsgcG9zdCwgaW5ib3VuZERpcmVjdGlvbiwgbG9nZ2VyID0gTk9PUF9MT0dHRVIgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IHRpbWVvdXRNcyA9IG9wdGlvbnMudGltZW91dE1zID8/IDUwMDA7XG4gIGNvbnN0IG1heEluRmxpZ2h0ID0gb3B0aW9ucy5tYXhJbkZsaWdodCA/PyAzMjtcbiAgY29uc3Qgb3V0Ym91bmREaXJlY3Rpb24gPVxuICAgIGluYm91bmREaXJlY3Rpb24gPT09IERJUkVDVElPTlMuV0VCVklFV19UT19IT1NUXG4gICAgICA/IERJUkVDVElPTlMuSE9TVF9UT19XRUJWSUVXXG4gICAgICA6IERJUkVDVElPTlMuV0VCVklFV19UT19IT1NUO1xuICBjb25zdCBvdXRib3VuZEtpbmRzID0gbmV3IFNldChcbiAgICBvdXRib3VuZERpcmVjdGlvbiA9PT0gRElSRUNUSU9OUy5IT1NUX1RPX1dFQlZJRVcgPyBIT1NUX1RPX1dFQlZJRVcgOiBXRUJWSUVXX1RPX0hPU1QsXG4gICk7XG5cbiAgbGV0IHNlcXVlbmNlID0gMDtcbiAgY29uc3QgY3JlYXRlUmVxdWVzdElkID1cbiAgICBvcHRpb25zLmNyZWF0ZVJlcXVlc3RJZCA/P1xuICAgICgoKSA9PiB7XG4gICAgICBzZXF1ZW5jZSArPSAxO1xuICAgICAgcmV0dXJuIGByJHtzZXF1ZW5jZS50b1N0cmluZygzNil9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgMTApfWA7XG4gICAgfSk7XG5cbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCB7cmVzb2x2ZTogRnVuY3Rpb24sIHJlamVjdDogRnVuY3Rpb24sIHRpbWVyOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0Pn0+fSAqL1xuICBjb25zdCBwZW5kaW5nID0gbmV3IE1hcCgpO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIChwYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgbWV0YToge3JlcXVlc3RJZD86IHN0cmluZ30pID0+IHVua25vd24+fSAqL1xuICBjb25zdCBoYW5kbGVycyA9IG5ldyBNYXAoKTtcbiAgY29uc3QgcmVwb3J0ZWRLaW5kcyA9IG5ldyBTZXQoKTtcbiAgbGV0IGRpc3Bvc2VkID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBraW5kXG4gICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IHBheWxvYWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtyZXF1ZXN0SWRdXG4gICAqL1xuICBmdW5jdGlvbiBzZW5kKGtpbmQsIHBheWxvYWQsIHJlcXVlc3RJZCkge1xuICAgIGlmIChkaXNwb3NlZCkge1xuICAgICAgdGhyb3cgbmV3IFByb3RvY29sRXJyb3IoJ0VfQ0FOQ0VMTEVEJywgJ0JyaWRnZSBpcyBkaXNwb3NlZC4nKTtcbiAgICB9XG4gICAgaWYgKCFvdXRib3VuZEtpbmRzLmhhcyhraW5kKSkge1xuICAgICAgdGhyb3cgbmV3IFByb3RvY29sRXJyb3IoJ0VfUFJPVE9DT0wnLCBgS2luZCBcIiR7a2luZH1cIiBpcyBub3Qgc2VuZGFibGUgaW4gdGhpcyBkaXJlY3Rpb24uYCk7XG4gICAgfVxuICAgIGNvbnN0IGVudmVsb3BlID0gY3JlYXRlRW52ZWxvcGUoa2luZCwgcGF5bG9hZCwgcmVxdWVzdElkKTtcbiAgICBpZiAobWVzc2FnZVNpemUoZW52ZWxvcGUpID4gMV8wMDBfMDAwKSB7XG4gICAgICB0aHJvdyBuZXcgUHJvdG9jb2xFcnJvcignRV9MSU1JVCcsICdSZWZ1c2luZyB0byBzZW5kIGFuIG92ZXJzaXplZCBtZXNzYWdlLicpO1xuICAgIH1cbiAgICBwb3N0KGVudmVsb3BlKTtcbiAgICBsb2dnZXIuZGVidWcoJ3Byb3RvY29sLnNlbmQnLCB7XG4gICAgICBraW5kLFxuICAgICAgcmVxdWVzdElkOiByZXF1ZXN0SWQgPz8gbnVsbCxcbiAgICAgIGJ5dGVzOiBtZXNzYWdlU2l6ZShlbnZlbG9wZSksXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtyZXF1ZXN0SWRdXG4gICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IFtkZXRhaWxdXG4gICAqL1xuICBmdW5jdGlvbiBzZW5kRXJyb3IoY29kZSwgbWVzc2FnZSwgcmVxdWVzdElkLCBkZXRhaWwpIHtcbiAgICB0cnkge1xuICAgICAgc2VuZCgncHJvdG9jb2wuZXJyb3InLCBjcmVhdGVFcnJvclBheWxvYWQoY29kZSwgbWVzc2FnZSwgZGV0YWlsKSwgcmVxdWVzdElkKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFRoZSBwYW5lbCBtYXkgYWxyZWFkeSBiZSBnb25lLiBOb3RoaW5nIHVzZWZ1bCByZW1haW5zIHRvIGRvLlxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2luZFxuICAgKiBAcGFyYW0geyhwYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgbWV0YToge3JlcXVlc3RJZD86IHN0cmluZ30pID0+IHVua25vd259IGhhbmRsZXJcbiAgICogQHJldHVybnMgeygpID0+IHZvaWR9IHVuc3Vic2NyaWJlXG4gICAqL1xuICBmdW5jdGlvbiBvbihraW5kLCBoYW5kbGVyKSB7XG4gICAgaGFuZGxlcnMuc2V0KGtpbmQsIGhhbmRsZXIpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBpZiAoaGFuZGxlcnMuZ2V0KGtpbmQpID09PSBoYW5kbGVyKSB7XG4gICAgICAgIGhhbmRsZXJzLmRlbGV0ZShraW5kKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSByZXF1ZXN0IGFuZCBhd2FpdCB0aGUgY29ycmVsYXRlZCByZXNwb25zZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtpbmRcbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW3BheWxvYWRdXG4gICAqIEBwYXJhbSB7e3RpbWVvdXRNcz86IG51bWJlcn19IFtyZXF1ZXN0T3B0aW9uc11cbiAgICogQHJldHVybnMge1Byb21pc2U8e2tpbmQ6IHN0cmluZywgcGF5bG9hZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj59Pn1cbiAgICovXG4gIGZ1bmN0aW9uIHJlcXVlc3Qoa2luZCwgcGF5bG9hZCA9IHt9LCByZXF1ZXN0T3B0aW9ucyA9IHt9KSB7XG4gICAgaWYgKGRpc3Bvc2VkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IFByb3RvY29sRXJyb3IoJ0VfQ0FOQ0VMTEVEJywgJ0JyaWRnZSBpcyBkaXNwb3NlZC4nKSk7XG4gICAgfVxuICAgIGlmIChwZW5kaW5nLnNpemUgPj0gbWF4SW5GbGlnaHQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcbiAgICAgICAgbmV3IFByb3RvY29sRXJyb3IoJ0VfTElNSVQnLCBgVG9vIG1hbnkgaW4tZmxpZ2h0IHJlcXVlc3RzICgke21heEluRmxpZ2h0fSkuYCksXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCByZXF1ZXN0SWQgPSBjcmVhdGVSZXF1ZXN0SWQoKTtcbiAgICBjb25zdCBlZmZlY3RpdmVUaW1lb3V0ID0gcmVxdWVzdE9wdGlvbnMudGltZW91dE1zID8/IHRpbWVvdXRNcztcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBwZW5kaW5nLmRlbGV0ZShyZXF1ZXN0SWQpO1xuICAgICAgICByZWplY3QoXG4gICAgICAgICAgbmV3IFByb3RvY29sRXJyb3IoJ0VfVElNRU9VVCcsIGBObyByZXNwb25zZSB0byBcIiR7a2luZH1cIiB3aXRoaW4gJHtlZmZlY3RpdmVUaW1lb3V0fSBtcy5gLCB7XG4gICAgICAgICAgICBraW5kLFxuICAgICAgICAgICAgcmVxdWVzdElkLFxuICAgICAgICAgIH0pLFxuICAgICAgICApO1xuICAgICAgfSwgZWZmZWN0aXZlVGltZW91dCk7XG4gICAgICBwZW5kaW5nLnNldChyZXF1ZXN0SWQsIHsgcmVzb2x2ZSwgcmVqZWN0LCB0aW1lciB9KTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHNlbmQoa2luZCwgcGF5bG9hZCwgcmVxdWVzdElkKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgIHBlbmRpbmcuZGVsZXRlKHJlcXVlc3RJZCk7XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHt1bmtub3dufSByYXdcbiAgICogQHJldHVybnMge1Byb21pc2U8e29rOiBib29sZWFuLCBjb2RlPzogc3RyaW5nLCByZWFzb24/OiBzdHJpbmd9Pn1cbiAgICovXG4gIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZU1lc3NhZ2UocmF3KSB7XG4gICAgaWYgKGRpc3Bvc2VkKSB7XG4gICAgICByZXR1cm4geyBvazogZmFsc2UsIGNvZGU6ICdFX0NBTkNFTExFRCcsIHJlYXNvbjogJ2Rpc3Bvc2VkJyB9O1xuICAgIH1cblxuICAgIGNvbnN0IHZhbGlkYXRpb24gPSB2YWxpZGF0ZUVudmVsb3BlKHJhdywgeyBkaXJlY3Rpb246IGluYm91bmREaXJlY3Rpb24gfSk7XG4gICAgaWYgKCF2YWxpZGF0aW9uLm9rKSB7XG4gICAgICBpZiAoIXJlcG9ydGVkS2luZHMuaGFzKHZhbGlkYXRpb24ucmVhc29uKSkge1xuICAgICAgICByZXBvcnRlZEtpbmRzLmFkZCh2YWxpZGF0aW9uLnJlYXNvbik7XG4gICAgICAgIGxvZ2dlci53YXJuKCdwcm90b2NvbC5yZWplY3RlZCcsIHtcbiAgICAgICAgICByZWFzb246IHZhbGlkYXRpb24ucmVhc29uLFxuICAgICAgICAgIHBhdGg6IHZhbGlkYXRpb24ucGF0aCA/PyBudWxsLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHNlbmRFcnJvcih2YWxpZGF0aW9uLmNvZGUsIHZhbGlkYXRpb24ubWVzc2FnZSwgdmFsaWRhdGlvbi5yZXF1ZXN0SWQsIHtcbiAgICAgICAgcmVhc29uOiB2YWxpZGF0aW9uLnJlYXNvbixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBjb2RlOiB2YWxpZGF0aW9uLmNvZGUsIHJlYXNvbjogdmFsaWRhdGlvbi5yZWFzb24gfTtcbiAgICB9XG5cbiAgICBjb25zdCBlbnZlbG9wZSA9IHZhbGlkYXRpb24uZW52ZWxvcGU7XG4gICAgY29uc3QgeyBraW5kLCByZXF1ZXN0SWQsIHBheWxvYWQgfSA9IGVudmVsb3BlO1xuICAgIGxvZ2dlci5kZWJ1ZygncHJvdG9jb2wucmVjZWl2ZScsIHtcbiAgICAgIGtpbmQsXG4gICAgICByZXF1ZXN0SWQ6IHJlcXVlc3RJZCA/PyBudWxsLFxuICAgICAgYnl0ZXM6IG1lc3NhZ2VTaXplKGVudmVsb3BlKSxcbiAgICB9KTtcblxuICAgIGlmIChraW5kID09PSAncHJvdG9jb2wuZXJyb3InKSB7XG4gICAgICBpZiAocmVxdWVzdElkICYmIHBlbmRpbmcuaGFzKHJlcXVlc3RJZCkpIHtcbiAgICAgICAgY29uc3QgZW50cnkgPSBwZW5kaW5nLmdldChyZXF1ZXN0SWQpO1xuICAgICAgICBpZiAoZW50cnkpIHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQoZW50cnkudGltZXIpO1xuICAgICAgICAgIHBlbmRpbmcuZGVsZXRlKHJlcXVlc3RJZCk7XG4gICAgICAgICAgY29uc3QgY29kZSA9IHR5cGVvZiBwYXlsb2FkLmNvZGUgPT09ICdzdHJpbmcnID8gcGF5bG9hZC5jb2RlIDogJ0VfUFJPVE9DT0wnO1xuICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPVxuICAgICAgICAgICAgdHlwZW9mIHBheWxvYWQubWVzc2FnZSA9PT0gJ3N0cmluZycgPyBwYXlsb2FkLm1lc3NhZ2UgOiAnVGhlIG90aGVyIHNpZGUgcmVwb3J0ZWQgYW4gZXJyb3IuJztcbiAgICAgICAgICBlbnRyeS5yZWplY3QobmV3IFByb3RvY29sRXJyb3IoY29kZSwgbWVzc2FnZSwgeyByZXF1ZXN0SWQgfSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4geyBvazogdHJ1ZSB9O1xuICAgIH1cblxuICAgIGlmIChyZXF1ZXN0SWQgJiYgcGVuZGluZy5oYXMocmVxdWVzdElkKSkge1xuICAgICAgY29uc3QgZW50cnkgPSBwZW5kaW5nLmdldChyZXF1ZXN0SWQpO1xuICAgICAgaWYgKGVudHJ5KSB7XG4gICAgICAgIGNsZWFyVGltZW91dChlbnRyeS50aW1lcik7XG4gICAgICAgIHBlbmRpbmcuZGVsZXRlKHJlcXVlc3RJZCk7XG4gICAgICAgIGVudHJ5LnJlc29sdmUoeyBraW5kLCBwYXlsb2FkIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHsgb2s6IHRydWUgfTtcbiAgICB9XG5cbiAgICBjb25zdCBoYW5kbGVyID0gaGFuZGxlcnMuZ2V0KGtpbmQpO1xuICAgIGlmICghaGFuZGxlcikge1xuICAgICAgLy8gQSByZXNwb25zZSB3aG9zZSByZXF1ZXN0IGFscmVhZHkgdGltZWQgb3V0IGlzIGV4cGVjdGVkIGFuZCBoYXJtbGVzcy5cbiAgICAgIGxvZ2dlci5kZWJ1ZygncHJvdG9jb2wudW5oYW5kbGVkJywgeyBraW5kLCByZXF1ZXN0SWQ6IHJlcXVlc3RJZCA/PyBudWxsIH0pO1xuICAgICAgcmV0dXJuIHsgb2s6IHRydWUgfTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgaGFuZGxlcihwYXlsb2FkLCB7IHJlcXVlc3RJZCB9KTtcbiAgICAgIHJldHVybiB7IG9rOiB0cnVlIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XG4gICAgICBjb25zdCBjb2RlID1cbiAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBQcm90b2NvbEVycm9yXG4gICAgICAgICAgPyBlcnJvci5jb2RlXG4gICAgICAgICAgOiAvKiogQHR5cGUge3tjb2RlPzogc3RyaW5nfX0gKi8gKGVycm9yKT8uY29kZSA/PyAnRV9QUk9UT0NPTCc7XG4gICAgICBsb2dnZXIuZXJyb3IoJ3Byb3RvY29sLmhhbmRsZXJfZmFpbGVkJywgeyBraW5kLCBlcnJvcjogbWVzc2FnZSB9KTtcbiAgICAgIHNlbmRFcnJvcihjb2RlLCBtZXNzYWdlLCByZXF1ZXN0SWQpO1xuICAgICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBjb2RlIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZWFzb25cbiAgICovXG4gIGZ1bmN0aW9uIGRpc3Bvc2UocmVhc29uID0gJ2Rpc3Bvc2VkJykge1xuICAgIGlmIChkaXNwb3NlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkaXNwb3NlZCA9IHRydWU7XG4gICAgZm9yIChjb25zdCBbLCBlbnRyeV0gb2YgcGVuZGluZykge1xuICAgICAgY2xlYXJUaW1lb3V0KGVudHJ5LnRpbWVyKTtcbiAgICAgIGVudHJ5LnJlamVjdChuZXcgUHJvdG9jb2xFcnJvcignRV9DQU5DRUxMRUQnLCBgQnJpZGdlIGNsb3NlZDogJHtyZWFzb259YCkpO1xuICAgIH1cbiAgICBwZW5kaW5nLmNsZWFyKCk7XG4gICAgaGFuZGxlcnMuY2xlYXIoKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgb24sXG4gICAgcmVxdWVzdCxcbiAgICByZXNwb25kOiBzZW5kLFxuICAgIGhhbmRsZU1lc3NhZ2UsXG4gICAgZGlzcG9zZSxcbiAgICBwZW5kaW5nQ291bnQ6ICgpID0+IHBlbmRpbmcuc2l6ZSxcbiAgICBpc0Rpc3Bvc2VkOiAoKSA9PiBkaXNwb3NlZCxcbiAgICBkaXJlY3Rpb246IGluYm91bmREaXJlY3Rpb24sXG4gIH07XG59XG4iLCAiLyoqXG4gKiBXZWJ2aWV3IEhUTUwgdGVtcGxhdGUuXG4gKlxuICogS2VwdCBhcyBhIHN0cmluZyBtb2R1bGUgKG5vdCBhIGZpbGUgcmVhZCkgc28gaXQgaXMgYXZhaWxhYmxlIGluIHRoZSBidW5kbGVkXG4gKiBleHRlbnNpb24gYW5kIGluIHVuaXQgdGVzdHMgd2l0aG91dCBwYXRoIHJlc29sdXRpb24gZ2FtZXMuXG4gKlxuICogVGhlIHRlbXBsYXRlIGNvbnRhaW5zIG5vIGlubGluZSBzY3JpcHQuIFRoZSBzaW5nbGUgc2NyaXB0IHRhZyBjYXJyaWVzIGFcbiAqIHBlci1sb2FkIG5vbmNlIHRoYXQgYWxzbyBhcHBlYXJzIGluIHRoZSBDb250ZW50LVNlY3VyaXR5LVBvbGljeS5cbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7e25vbmNlOiBzdHJpbmcsIGNzcFNvdXJjZTogc3RyaW5nLCBzY3JpcHRVcmk6IHN0cmluZywgc3R5bGVVcmk6IHN0cmluZywgdGl0bGU/OiBzdHJpbmd9fSBpbnB1dFxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclBhbmVsSHRtbCh7IG5vbmNlLCBjc3BTb3VyY2UsIHNjcmlwdFVyaSwgc3R5bGVVcmksIHRpdGxlID0gJ0NvZGVGbG93JyB9KSB7XG4gIGNvbnN0IGNzcCA9IFtcbiAgICBcImRlZmF1bHQtc3JjICdub25lJ1wiLFxuICAgIGBpbWctc3JjICR7Y3NwU291cmNlfSBkYXRhOmAsXG4gICAgYHN0eWxlLXNyYyAke2NzcFNvdXJjZX1gLFxuICAgIGBmb250LXNyYyAke2NzcFNvdXJjZX1gLFxuICAgIGBzY3JpcHQtc3JjICdub25jZS0ke25vbmNlfSdgLFxuICAgIFwiY29ubmVjdC1zcmMgJ25vbmUnXCIsXG4gICAgXCJiYXNlLXVyaSAnbm9uZSdcIixcbiAgICBcImZvcm0tYWN0aW9uICdub25lJ1wiLFxuICBdLmpvaW4oJzsgJyk7XG5cbiAgcmV0dXJuIGA8IWRvY3R5cGUgaHRtbD5cbjxodG1sIGxhbmc9XCJlblwiPlxuICA8aGVhZD5cbiAgICA8bWV0YSBjaGFyc2V0PVwidXRmLThcIiAvPlxuICAgIDxtZXRhIGh0dHAtZXF1aXY9XCJDb250ZW50LVNlY3VyaXR5LVBvbGljeVwiIGNvbnRlbnQ9XCIke2NzcH1cIiAvPlxuICAgIDxtZXRhIG5hbWU9XCJ2aWV3cG9ydFwiIGNvbnRlbnQ9XCJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MS4wXCIgLz5cbiAgICA8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgaHJlZj1cIiR7c3R5bGVVcml9XCIgLz5cbiAgICA8dGl0bGU+JHtlc2NhcGVIdG1sKHRpdGxlKX08L3RpdGxlPlxuICA8L2hlYWQ+XG4gIDxib2R5PlxuICAgIDxoZWFkZXIgY2xhc3M9XCJjZi1oZWFkZXJcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJjZi10aXRsZVwiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cImNmLW1hcmtcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+XG4gICAgICAgIDxzcGFuIGlkPVwiY2YtdGl0bGUtdGV4dFwiPkNvZGVGbG93PC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGlkPVwiY2YtbWV0YVwiIGNsYXNzPVwiY2YtbWV0YVwiIHJvbGU9XCJzdGF0dXNcIiBhcmlhLWxpdmU9XCJwb2xpdGVcIj5Mb2FkaW5nXHUyMDI2PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiY2YtYWN0aW9uc1wiPlxuICAgICAgICA8YnV0dG9uIGlkPVwiY2YtcmVmcmVzaFwiIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImNmLWJ1dHRvblwiIHRpdGxlPVwiUmVsb2FkIHRoZSBncmFwaFwiPlxuICAgICAgICAgIFJlbG9hZFxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvaGVhZGVyPlxuXG4gICAgPGRpdiBpZD1cImNmLWJhbm5lclwiIGNsYXNzPVwiY2YtYmFubmVyXCIgcm9sZT1cImFsZXJ0XCIgaGlkZGVuPjwvZGl2PlxuXG4gICAgPG1haW4gY2xhc3M9XCJjZi1tYWluXCI+XG4gICAgICA8c2VjdGlvbiBjbGFzcz1cImNmLWNhbnZhcy13cmFwXCIgYXJpYS1sYWJlbD1cIkdyYXBoXCI+XG4gICAgICAgIDxzdmdcbiAgICAgICAgICBpZD1cImNmLWdyYXBoXCJcbiAgICAgICAgICBjbGFzcz1cImNmLWdyYXBoXCJcbiAgICAgICAgICByb2xlPVwiaW1nXCJcbiAgICAgICAgICBhcmlhLWxhYmVsPVwiQ29kZUZsb3cgZ3JhcGhcIlxuICAgICAgICAgIHRhYmluZGV4PVwiMFwiXG4gICAgICAgID48L3N2Zz5cbiAgICAgICAgPGRpdiBpZD1cImNmLWVtcHR5XCIgY2xhc3M9XCJjZi1lbXB0eVwiIGhpZGRlbj5cbiAgICAgICAgICA8cD5ObyBncmFwaCBsb2FkZWQuPC9wPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvc2VjdGlvbj5cbiAgICAgIDxhc2lkZSBjbGFzcz1cImNmLWRldGFpbFwiIGFyaWEtbGFiZWw9XCJTZWxlY3Rpb24gZGV0YWlsc1wiPlxuICAgICAgICA8aDIgY2xhc3M9XCJjZi1kZXRhaWwtdGl0bGVcIj5TZWxlY3Rpb248L2gyPlxuICAgICAgICA8ZGl2IGlkPVwiY2YtZGV0YWlsLWJvZHlcIiBjbGFzcz1cImNmLWRldGFpbC1ib2R5XCI+XG4gICAgICAgICAgPHAgY2xhc3M9XCJjZi1tdXRlZFwiPlNlbGVjdCBhIG5vZGUgdG8gaW5zcGVjdCBpdC48L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8aDIgY2xhc3M9XCJjZi1kZXRhaWwtdGl0bGVcIj5MZWdlbmQ8L2gyPlxuICAgICAgICA8dWwgaWQ9XCJjZi1sZWdlbmRcIiBjbGFzcz1cImNmLWxlZ2VuZFwiPjwvdWw+XG4gICAgICA8L2FzaWRlPlxuICAgIDwvbWFpbj5cblxuICAgIDxmb290ZXIgY2xhc3M9XCJjZi1mb290ZXJcIj5cbiAgICAgIDxzcGFuIGlkPVwiY2Ytc3RhdHVzXCIgY2xhc3M9XCJjZi1zdGF0dXNcIj5TdGFydGluZ1x1MjAyNjwvc3Bhbj5cbiAgICAgIDxzcGFuIGNsYXNzPVwiY2YtaGludFwiPlBhbjogZHJhZyBcdTAwQjcgWm9vbTogd2hlZWwgXHUwMEI3IFNlbGVjdDogY2xpY2s8L3NwYW4+XG4gICAgPC9mb290ZXI+XG5cbiAgICA8c2NyaXB0IG5vbmNlPVwiJHtub25jZX1cIiBzcmM9XCIke3NjcmlwdFVyaX1cIj48L3NjcmlwdD5cbiAgPC9ib2R5PlxuPC9odG1sPmA7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBlc2NhcGVIdG1sKHZhbHVlKSB7XG4gIHJldHVybiBTdHJpbmcodmFsdWUpXG4gICAgLnJlcGxhY2UoLyYvZywgJyZhbXA7JylcbiAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXG4gICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKVxuICAgIC5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7JylcbiAgICAucmVwbGFjZSgvJy9nLCAnJiMzOTsnKTtcbn1cbiIsICIvKipcbiAqIEdyYXBoIG1vZGVsLlxuICpcbiAqIFR1cm5zIGEgdmFsaWRhdGVkIGFuYWx5c2lzIHJ1biBpbnRvIGEgcmVuZGVyYWJsZSBncmFwaC4gVGhpcyBtb2R1bGUga25vd3NcbiAqIGFib3V0IHN5bWJvbHMsIHJlbGF0aW9uc2hpcHMsIGFuZCBwcm92ZW5hbmNlIFx1MjAxNCBhbmQgbm90aGluZyBhYm91dCBDKyssIEphdmFTY3JpcHQsXG4gKiBwYXJzZXJzLCBvciB0aGUgd2Vidmlldy5cbiAqXG4gKiBQbGFjZWhvbGRlciBub2RlcyBhcmUgY3JlYXRlZCBmb3IgdGFyZ2V0cyB0aGF0IHdlcmUgbm90IHJlc29sdmVkIHRvIGEgZGVjbGFyZWRcbiAqIHN5bWJvbC4gVGhhdCBpcyBkZWxpYmVyYXRlOiBoaWRpbmcgYW4gdW5yZXNvbHZlZCBjYWxsIHdvdWxkIHByZXNlbnQgYSBncmFwaFxuICogdGhhdCBsb29rcyBtb3JlIGNvbXBsZXRlIHRoYW4gdGhlIGFuYWx5c2lzIGlzLlxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge2ltcG9ydCgnLi4vY3NyL2VudGl0aWVzLmpzJykuQW5hbHlzaXNSdW59IEFuYWx5c2lzUnVuXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuLi9jc3IvZW50aXRpZXMuanMnKS5TeW1ib2xSZWNvcmR9IFN5bWJvbFJlY29yZFxuICogQHR5cGVkZWYge2ltcG9ydCgnLi4vY3NyL2VudGl0aWVzLmpzJykuUmVsYXRpb25zaGlwfSBSZWxhdGlvbnNoaXBcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4uL2Nzci9lbnRpdGllcy5qcycpLlNvdXJjZVJhbmdlfSBTb3VyY2VSYW5nZVxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gR3JhcGhOb2RlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gaWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBsYWJlbFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGtpbmRcbiAqIEBwcm9wZXJ0eSB7J3Jlc29sdmVkJ3wnaW5mZXJyZWQnfCdwb3NzaWJsZSd8J3VucmVzb2x2ZWQnfCdzdGFsZSd9IHN0YXR1c1xuICogQHByb3BlcnR5IHtTb3VyY2VSYW5nZSB8IG51bGx9IHJhbmdlXG4gKiBAcHJvcGVydHkge3N0cmluZyB8IG51bGx9IGZpbGVJZFxuICogQHByb3BlcnR5IHtib29sZWFufSBleHRlcm5hbFxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtiYWRnZV1cbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEdyYXBoRWRnZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGlkXG4gKiBAcHJvcGVydHkge3N0cmluZ30gZnJvbVxuICogQHByb3BlcnR5IHtzdHJpbmd9IHRvXG4gKiBAcHJvcGVydHkge3N0cmluZ30gdHlwZVxuICogQHByb3BlcnR5IHsncmVzb2x2ZWQnfCdpbmZlcnJlZCd8J3Bvc3NpYmxlJ3wndW5yZXNvbHZlZCd8J3N0YWxlJ30gc3RhdHVzXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3JlYXNvbkNvZGVdXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbGFiZWxcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEdyYXBoXG4gKiBAcHJvcGVydHkge3N0cmluZ30gZ3JhcGhJZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IHJ1bklkXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbGFuZ3VhZ2VcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBhZGFwdGVySWRcbiAqIEBwcm9wZXJ0eSB7J2Z1bGwnfCdwYXJ0aWFsJ3wnc3ludGFjdGljX29ubHknfSBjb21wbGV0ZW5lc3NcbiAqIEBwcm9wZXJ0eSB7R3JhcGhOb2RlW119IG5vZGVzXG4gKiBAcHJvcGVydHkge0dyYXBoRWRnZVtdfSBlZGdlc1xuICogQHByb3BlcnR5IHtBcnJheTx7Y29kZTogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcsIHNldmVyaXR5OiBzdHJpbmd9Pn0gZGlhZ25vc3RpY3NcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nW119IGRlZ3JhZGF0aW9uc1xuICovXG5cbi8qKlxuICogQHBhcmFtIHtBbmFseXNpc1J1bn0gcnVuXG4gKiBAcmV0dXJucyB7R3JhcGh9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEdyYXBoKHJ1bikge1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIEdyYXBoTm9kZT59ICovXG4gIGNvbnN0IG5vZGVzID0gbmV3IE1hcCgpO1xuXG4gIGZvciAoY29uc3Qgc3ltYm9sIG9mIHJ1bi5zeW1ib2xzKSB7XG4gICAgbm9kZXMuc2V0KHN5bWJvbC5zeW1ib2xJZCwge1xuICAgICAgaWQ6IHN5bWJvbC5zeW1ib2xJZCxcbiAgICAgIGxhYmVsOiBkaXNwbGF5TmFtZShzeW1ib2wpLFxuICAgICAga2luZDogc3ltYm9sLmtpbmQsXG4gICAgICBzdGF0dXM6ICdyZXNvbHZlZCcsXG4gICAgICByYW5nZTogc3ltYm9sLmRlY2xhcmF0aW9uLFxuICAgICAgZmlsZUlkOiBzeW1ib2wuZGVjbGFyYXRpb24uZmlsZUlkLFxuICAgICAgZXh0ZXJuYWw6IGZhbHNlLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqIEB0eXBlIHtHcmFwaEVkZ2VbXX0gKi9cbiAgY29uc3QgZWRnZXMgPSBbXTtcbiAgY29uc3QgZWRnZUlkcyA9IG5ldyBTZXQoKTtcblxuICBmb3IgKGNvbnN0IHJlbGF0aW9uc2hpcCBvZiBydW4ucmVsYXRpb25zaGlwcykge1xuICAgIGlmICghbm9kZXMuaGFzKHJlbGF0aW9uc2hpcC50bykpIHtcbiAgICAgIG5vZGVzLnNldChyZWxhdGlvbnNoaXAudG8sIHtcbiAgICAgICAgaWQ6IHJlbGF0aW9uc2hpcC50byxcbiAgICAgICAgbGFiZWw6IHBsYWNlaG9sZGVyTGFiZWwocmVsYXRpb25zaGlwLnRvKSxcbiAgICAgICAga2luZDogJ3Vua25vd24nLFxuICAgICAgICBzdGF0dXM6IHJlbGF0aW9uc2hpcC5zdGF0dXMgPT09ICdyZXNvbHZlZCcgPyAndW5yZXNvbHZlZCcgOiByZWxhdGlvbnNoaXAuc3RhdHVzLFxuICAgICAgICByYW5nZTogbnVsbCxcbiAgICAgICAgZmlsZUlkOiBudWxsLFxuICAgICAgICBleHRlcm5hbDogdHJ1ZSxcbiAgICAgICAgYmFkZ2U6IHJlbGF0aW9uc2hpcC5yZWFzb25Db2RlLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKCFub2Rlcy5oYXMocmVsYXRpb25zaGlwLmZyb20pKSB7XG4gICAgICAvLyBBbiBlZGdlIHdpdGggbm8gc291cmNlIHN5bWJvbCBjYW5ub3QgYmUgc2hvd24gdHJ1dGhmdWxseS4gU2tpcCBpdCBhbmRcbiAgICAgIC8vIHJlY29yZCBpdCBhcyBhIGRlZ3JhZGF0aW9uIGluc3RlYWQgb2YgaW52ZW50aW5nIGEgbm9kZS5cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChlZGdlSWRzLmhhcyhyZWxhdGlvbnNoaXAucmVsYXRpb25zaGlwSWQpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgZWRnZUlkcy5hZGQocmVsYXRpb25zaGlwLnJlbGF0aW9uc2hpcElkKTtcblxuICAgIGVkZ2VzLnB1c2goe1xuICAgICAgaWQ6IHJlbGF0aW9uc2hpcC5yZWxhdGlvbnNoaXBJZCxcbiAgICAgIGZyb206IHJlbGF0aW9uc2hpcC5mcm9tLFxuICAgICAgdG86IHJlbGF0aW9uc2hpcC50byxcbiAgICAgIHR5cGU6IHJlbGF0aW9uc2hpcC50eXBlLFxuICAgICAgc3RhdHVzOiByZWxhdGlvbnNoaXAuc3RhdHVzLFxuICAgICAgcmVhc29uQ29kZTogcmVsYXRpb25zaGlwLnJlYXNvbkNvZGUsXG4gICAgICBsYWJlbDogcmVsYXRpb25zaGlwLnJlYXNvbkNvZGVcbiAgICAgICAgPyBgJHtyZWxhdGlvbnNoaXAudHlwZX0gXHUwMEI3ICR7cmVsYXRpb25zaGlwLnJlYXNvbkNvZGV9YFxuICAgICAgICA6IHJlbGF0aW9uc2hpcC50eXBlLFxuICAgIH0pO1xuICB9XG5cbiAgY29uc3QgZGVncmFkYXRpb25zID0gW107XG4gIGlmIChydW4uY29tcGxldGVuZXNzICE9PSAnZnVsbCcpIHtcbiAgICBkZWdyYWRhdGlvbnMucHVzaChgQW5hbHlzaXMgY29tcGxldGVuZXNzOiAke3J1bi5jb21wbGV0ZW5lc3N9YCk7XG4gIH1cbiAgZm9yIChjb25zdCBkaWFnbm9zdGljIG9mIHJ1bi5kaWFnbm9zdGljcykge1xuICAgIGlmIChkaWFnbm9zdGljLnNldmVyaXR5ICE9PSAnaW5mbycpIHtcbiAgICAgIGRlZ3JhZGF0aW9ucy5wdXNoKGAke2RpYWdub3N0aWMuY29kZX06ICR7ZGlhZ25vc3RpYy5tZXNzYWdlfWApO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZ3JhcGhJZDogYGdyYXBoOiR7cnVuLnJ1bklkfWAsXG4gICAgcnVuSWQ6IHJ1bi5ydW5JZCxcbiAgICBsYW5ndWFnZTogcnVuLmxhbmd1YWdlLFxuICAgIGFkYXB0ZXJJZDogcnVuLmFkYXB0ZXJJZCxcbiAgICBjb21wbGV0ZW5lc3M6IHJ1bi5jb21wbGV0ZW5lc3MsXG4gICAgbm9kZXM6IFsuLi5ub2Rlcy52YWx1ZXMoKV0uc29ydChieUlkKSxcbiAgICBlZGdlczogZWRnZXMuc29ydChieUlkKSxcbiAgICBkaWFnbm9zdGljczogcnVuLmRpYWdub3N0aWNzLm1hcCgoZGlhZ25vc3RpYykgPT4gKHtcbiAgICAgIGNvZGU6IGRpYWdub3N0aWMuY29kZSxcbiAgICAgIG1lc3NhZ2U6IGRpYWdub3N0aWMubWVzc2FnZSxcbiAgICAgIHNldmVyaXR5OiBkaWFnbm9zdGljLnNldmVyaXR5LFxuICAgIH0pKSxcbiAgICBkZWdyYWRhdGlvbnMsXG4gIH07XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGFcbiAqIEBwYXJhbSB7c3RyaW5nfSBiXG4gKi9cbmZ1bmN0aW9uIGJ5SWQoYSwgYikge1xuICByZXR1cm4gYS5pZCA8IGIuaWQgPyAtMSA6IGEuaWQgPiBiLmlkID8gMSA6IDA7XG59XG5cbi8qKlxuICogQHBhcmFtIHtTeW1ib2xSZWNvcmR9IHN5bWJvbFxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZGlzcGxheU5hbWUoc3ltYm9sKSB7XG4gIGlmIChzeW1ib2wua2luZCA9PT0gJ2ZpbGUnKSB7XG4gICAgcmV0dXJuIHN5bWJvbC5uYW1lIHx8IHN5bWJvbC5xdWFsaWZpZWROYW1lO1xuICB9XG4gIHJldHVybiBzeW1ib2wubmFtZSB8fCBzeW1ib2wucXVhbGlmaWVkTmFtZSB8fCBzeW1ib2wuc3ltYm9sSWQ7XG59XG5cbi8qKlxuICogRGVyaXZlIGEgcmVhZGFibGUgbGFiZWwgZnJvbSBhbiB1bnJlc29sdmVkIHRhcmdldCBpZCB3aXRob3V0IHByZXRlbmRpbmcgdG9cbiAqIGtub3cgd2hhdCBpdCBpcy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGFyZ2V0SWRcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHBsYWNlaG9sZGVyTGFiZWwodGFyZ2V0SWQpIHtcbiAgY29uc3Qgc2VnbWVudHMgPSBTdHJpbmcodGFyZ2V0SWQpLnNwbGl0KC9bLjovXS8pLmZpbHRlcihCb29sZWFuKTtcbiAgcmV0dXJuIHNlZ21lbnRzLmxlbmd0aCA+IDAgPyBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXSA6IFN0cmluZyh0YXJnZXRJZCk7XG59XG4iLCAiLyoqXG4gKiBEZXRlcm1pbmlzdGljIGxheWVyZWQgbGF5b3V0LlxuICpcbiAqIFBoYXNlIDAgbmVlZHMgcG9zaXRpb25zIHNvIHRoZSB3ZWJ2aWV3IGNhbiBkcmF3IHNvbWV0aGluZyB3aXRob3V0IG93bmluZyBhXG4gKiBsYXlvdXQgYWxnb3JpdGhtLiBQaGFzZSA0IGJlbmNobWFya3MgcmVhbCBlbmdpbmVzIChDeXRvc2NhcGUvRUxLL2RhZ3JlKSBhbmRcbiAqIHJlcGxhY2VzIHRoaXMgYmVoaW5kIHRoZSByZW5kZXJlciBib3VuZGFyeTsgdW50aWwgdGhlbiwgZGV0ZXJtaW5pc3RpYyBvdXRwdXRcbiAqIGlzIG1vcmUgdmFsdWFibGUgdGhhbiBwcmV0dHkgb3V0cHV0IGJlY2F1c2UgaXQgbWFrZXMgdGVzdHMgc3RhYmxlLlxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge2ltcG9ydCgnLi9tb2RlbC5qcycpLkdyYXBofSBHcmFwaFxuICogQHR5cGVkZWYge3t4OiBudW1iZXIsIHk6IG51bWJlciwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIGxheWVyOiBudW1iZXJ9fSBQb3NpdGlvblxuICovXG5cbmV4cG9ydCBjb25zdCBMQVlPVVRfREVGQVVMVFMgPSBPYmplY3QuZnJlZXplKHtcbiAgbm9kZVdpZHRoOiAxOTAsXG4gIG5vZGVIZWlnaHQ6IDU0LFxuICBob3Jpem9udGFsR2FwOiA5MCxcbiAgdmVydGljYWxHYXA6IDI2LFxuICBtYXhMYXllcnM6IDQwLFxufSk7XG5cbi8qKlxuICogQHBhcmFtIHtHcmFwaH0gZ3JhcGhcbiAqIEBwYXJhbSB7UGFydGlhbDx0eXBlb2YgTEFZT1VUX0RFRkFVTFRTPn0gW29wdGlvbnNdXG4gKiBAcmV0dXJucyB7e3Bvc2l0aW9uczogUmVjb3JkPHN0cmluZywgUG9zaXRpb24+LCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgbGF5ZXJzOiBzdHJpbmdbXVtdfX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVMYXlvdXQoZ3JhcGgsIG9wdGlvbnMgPSB7fSkge1xuICBjb25zdCBjb25maWcgPSB7IC4uLkxBWU9VVF9ERUZBVUxUUywgLi4ub3B0aW9ucyB9O1xuICBjb25zdCBub2RlSWRzID0gZ3JhcGgubm9kZXMubWFwKChub2RlKSA9PiBub2RlLmlkKTtcbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBudW1iZXI+fSAqL1xuICBjb25zdCBsYXllck9mID0gbmV3IE1hcCgpO1xuXG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywgc3RyaW5nW10+fSAqL1xuICBjb25zdCBpbmNvbWluZyA9IG5ldyBNYXAobm9kZUlkcy5tYXAoKGlkKSA9PiBbaWQsIFtdXSkpO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIHN0cmluZ1tdPn0gKi9cbiAgY29uc3Qgb3V0Z29pbmcgPSBuZXcgTWFwKG5vZGVJZHMubWFwKChpZCkgPT4gW2lkLCBbXV0pKTtcblxuICBmb3IgKGNvbnN0IGVkZ2Ugb2YgZ3JhcGguZWRnZXMpIHtcbiAgICBpZiAoIWluY29taW5nLmhhcyhlZGdlLnRvKSB8fCAhaW5jb21pbmcuaGFzKGVkZ2UuZnJvbSkgfHwgZWRnZS5mcm9tID09PSBlZGdlLnRvKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaW5jb21pbmcuZ2V0KGVkZ2UudG8pPy5wdXNoKGVkZ2UuZnJvbSk7XG4gICAgb3V0Z29pbmcuZ2V0KGVkZ2UuZnJvbSk/LnB1c2goZWRnZS50byk7XG4gIH1cblxuICAvLyBLYWhuJ3MgYWxnb3JpdGhtIGdpdmVzIGEgdG9wb2xvZ2ljYWwgb3JkZXI7IGN5Y2xlcyBhcmUgaGFuZGxlZCBhZnRlcndhcmRzLlxuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIG51bWJlcj59ICovXG4gIGNvbnN0IGluZGVncmVlID0gbmV3IE1hcChub2RlSWRzLm1hcCgoaWQpID0+IFtpZCwgaW5jb21pbmcuZ2V0KGlkKT8ubGVuZ3RoID8/IDBdKSk7XG4gIGNvbnN0IHJlYWR5ID0gbm9kZUlkcy5maWx0ZXIoKGlkKSA9PiAoaW5kZWdyZWUuZ2V0KGlkKSA/PyAwKSA9PT0gMCkuc29ydCgpO1xuICAvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuICBjb25zdCBvcmRlciA9IFtdO1xuXG4gIHdoaWxlIChyZWFkeS5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgaWQgPSAvKiogQHR5cGUge3N0cmluZ30gKi8gKHJlYWR5LnNoaWZ0KCkpO1xuICAgIG9yZGVyLnB1c2goaWQpO1xuICAgIGZvciAoY29uc3QgbmV4dCBvZiAob3V0Z29pbmcuZ2V0KGlkKSA/PyBbXSkuc2xpY2UoKS5zb3J0KCkpIHtcbiAgICAgIGNvbnN0IHJlbWFpbmluZyA9IChpbmRlZ3JlZS5nZXQobmV4dCkgPz8gMCkgLSAxO1xuICAgICAgaW5kZWdyZWUuc2V0KG5leHQsIHJlbWFpbmluZyk7XG4gICAgICBpZiAocmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgIHJlYWR5LnB1c2gobmV4dCk7XG4gICAgICAgIHJlYWR5LnNvcnQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBsZXQgbWF4TGF5ZXIgPSAwO1xuICBmb3IgKGNvbnN0IGlkIG9mIG9yZGVyKSB7XG4gICAgY29uc3QgcHJlZGVjZXNzb3JzID0gaW5jb21pbmcuZ2V0KGlkKSA/PyBbXTtcbiAgICBjb25zdCBsYXllciA9XG4gICAgICBwcmVkZWNlc3NvcnMubGVuZ3RoID09PSAwXG4gICAgICAgID8gMFxuICAgICAgICA6IE1hdGgubWF4KC4uLnByZWRlY2Vzc29ycy5tYXAoKHByZWQpID0+IGxheWVyT2YuZ2V0KHByZWQpID8/IDApKSArIDE7XG4gICAgbGF5ZXJPZi5zZXQoaWQsIGxheWVyKTtcbiAgICBtYXhMYXllciA9IE1hdGgubWF4KG1heExheWVyLCBsYXllcik7XG4gIH1cblxuICAvLyBOb2RlcyBpbnNpZGUgYSBjeWNsZSBuZXZlciByZWFjaCBpbmRlZ3JlZSAwLiBQbGFjZSB0aGVtIGFmdGVyIGV2ZXJ5dGhpbmdcbiAgLy8gdGhhdCBjb3VsZCBiZSBvcmRlcmVkLCByYXRoZXIgdGhhbiBkcm9wcGluZyB0aGVtLlxuICBjb25zdCBjeWNsaWMgPSBub2RlSWRzLmZpbHRlcigoaWQpID0+ICFsYXllck9mLmhhcyhpZCkpLnNvcnQoKTtcbiAgZm9yIChjb25zdCBpZCBvZiBjeWNsaWMpIHtcbiAgICBsYXllck9mLnNldChpZCwgTWF0aC5taW4obWF4TGF5ZXIgKyAxLCBjb25maWcubWF4TGF5ZXJzKSk7XG4gIH1cblxuICAvKiogQHR5cGUge01hcDxudW1iZXIsIHN0cmluZ1tdPn0gKi9cbiAgY29uc3QgYnlMYXllciA9IG5ldyBNYXAoKTtcbiAgZm9yIChjb25zdCBpZCBvZiBub2RlSWRzLnNsaWNlKCkuc29ydCgpKSB7XG4gICAgY29uc3QgbGF5ZXIgPSBNYXRoLm1pbihsYXllck9mLmdldChpZCkgPz8gMCwgY29uZmlnLm1heExheWVycyk7XG4gICAgaWYgKCFieUxheWVyLmhhcyhsYXllcikpIHtcbiAgICAgIGJ5TGF5ZXIuc2V0KGxheWVyLCBbXSk7XG4gICAgfVxuICAgIGJ5TGF5ZXIuZ2V0KGxheWVyKT8ucHVzaChpZCk7XG4gIH1cblxuICAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIFBvc2l0aW9uPn0gKi9cbiAgY29uc3QgcG9zaXRpb25zID0ge307XG4gIC8qKiBAdHlwZSB7c3RyaW5nW11bXX0gKi9cbiAgY29uc3QgbGF5ZXJzID0gW107XG4gIGxldCB0YWxsZXN0ID0gMDtcblxuICBmb3IgKGNvbnN0IGxheWVyIG9mIFsuLi5ieUxheWVyLmtleXMoKV0uc29ydCgoYSwgYikgPT4gYSAtIGIpKSB7XG4gICAgY29uc3QgaWRzID0gYnlMYXllci5nZXQobGF5ZXIpID8/IFtdO1xuICAgIGxheWVycy5wdXNoKGlkcyk7XG4gICAgaWRzLmZvckVhY2goKGlkLCBpbmRleCkgPT4ge1xuICAgICAgcG9zaXRpb25zW2lkXSA9IHtcbiAgICAgICAgeDogbGF5ZXIgKiAoY29uZmlnLm5vZGVXaWR0aCArIGNvbmZpZy5ob3Jpem9udGFsR2FwKSxcbiAgICAgICAgeTogaW5kZXggKiAoY29uZmlnLm5vZGVIZWlnaHQgKyBjb25maWcudmVydGljYWxHYXApLFxuICAgICAgICB3aWR0aDogY29uZmlnLm5vZGVXaWR0aCxcbiAgICAgICAgaGVpZ2h0OiBjb25maWcubm9kZUhlaWdodCxcbiAgICAgICAgbGF5ZXIsXG4gICAgICB9O1xuICAgIH0pO1xuICAgIHRhbGxlc3QgPSBNYXRoLm1heCh0YWxsZXN0LCBpZHMubGVuZ3RoKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcG9zaXRpb25zLFxuICAgIHdpZHRoOiBNYXRoLm1heCgxLCBsYXllcnMubGVuZ3RoKSAqIChjb25maWcubm9kZVdpZHRoICsgY29uZmlnLmhvcml6b250YWxHYXApLFxuICAgIGhlaWdodDogTWF0aC5tYXgoMSwgdGFsbGVzdCkgKiAoY29uZmlnLm5vZGVIZWlnaHQgKyBjb25maWcudmVydGljYWxHYXApLFxuICAgIGxheWVycyxcbiAgfTtcbn1cbiIsICIvKipcbiAqIEdyYXBoIHZpZXctbW9kZWwgKERUTykuXG4gKlxuICogVGhlIERUTyBpcyB0aGUgb25seSBncmFwaCBzaGFwZSB0aGUgd2VidmlldyB1bmRlcnN0YW5kcy4gSXQgaXMgcGxhaW4gSlNPTjpcbiAqIG5vIGZ1bmN0aW9ucywgbm8gaWRzIHRoYXQgcmVxdWlyZSBhIGxvb2t1cCwgbm8gc291cmNlIHRleHQuXG4gKlxuICogU291cmNlIHRleHQgaXMgZmV0Y2hlZCBvbiBkZW1hbmQgaW4gUGhhc2UgNSB0aHJvdWdoIGEgc2VwYXJhdGUsIHZhbGlkYXRlZFxuICogcmVxdWVzdC4gS2VlcGluZyB0aGUgRFRPIGZyZWUgb2Ygc291cmNlIHByZXZlbnRzIGFjY2lkZW50YWwgbGVha2FnZSBpbnRvXG4gKiBjYWNoZXMgYW5kIGtlZXBzIG1lc3NhZ2Ugc2l6ZXMgcHJlZGljdGFibGUuXG4gKi9cblxuaW1wb3J0IHsgY29tcHV0ZUxheW91dCB9IGZyb20gJy4vbGF5b3V0LmpzJztcblxuZXhwb3J0IGNvbnN0IEdSQVBIX0RUT19WRVJTSU9OID0gMTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuL21vZGVsLmpzJykuR3JhcGh9IEdyYXBoXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBEdG9Ob2RlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gaWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBsYWJlbFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGtpbmRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBzdGF0dXNcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBiYWRnZVxuICogQHByb3BlcnR5IHtib29sZWFufSBleHRlcm5hbFxuICogQHByb3BlcnR5IHt7ZmlsZUlkOiBzdHJpbmcsIHN0YXJ0TGluZTogbnVtYmVyLCBlbmRMaW5lOiBudW1iZXJ9IHwgbnVsbH0gcmFuZ2VcbiAqIEBwcm9wZXJ0eSB7e3g6IG51bWJlciwgeTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgbGF5ZXI6IG51bWJlcn19IHBvc2l0aW9uXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBHcmFwaER0b1xuICogQHByb3BlcnR5IHtudW1iZXJ9IGR0b1ZlcnNpb25cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBncmFwaElkXG4gKiBAcHJvcGVydHkge3N0cmluZ30gcnVuSWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBsYW5ndWFnZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGFkYXB0ZXJJZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGNvbXBsZXRlbmVzc1xuICogQHByb3BlcnR5IHtEdG9Ob2RlW119IG5vZGVzXG4gKiBAcHJvcGVydHkge0FycmF5PHtpZDogc3RyaW5nLCBmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcsIHR5cGU6IHN0cmluZywgc3RhdHVzOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcsIHJlYXNvbkNvZGU/OiBzdHJpbmd9Pn0gZWRnZXNcbiAqIEBwcm9wZXJ0eSB7QXJyYXk8e2NvZGU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nLCBzZXZlcml0eTogc3RyaW5nfT59IGRpYWdub3N0aWNzXG4gKiBAcHJvcGVydHkge3N0cmluZ1tdfSBkZWdyYWRhdGlvbnNcbiAqIEBwcm9wZXJ0eSB7e3dpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyfX0gZXh0ZW50XG4gKiBAcHJvcGVydHkge3tzdGF0dXNlczogc3RyaW5nW10sIGtpbmRzOiBzdHJpbmdbXX19IGxlZ2VuZFxuICovXG5cbi8qKlxuICogQHBhcmFtIHtHcmFwaH0gZ3JhcGhcbiAqIEByZXR1cm5zIHtHcmFwaER0b31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvRHRvKGdyYXBoKSB7XG4gIGNvbnN0IGxheW91dCA9IGNvbXB1dGVMYXlvdXQoZ3JhcGgpO1xuXG4gIGNvbnN0IG5vZGVzID0gZ3JhcGgubm9kZXMubWFwKChub2RlKSA9PiAoe1xuICAgIGlkOiBub2RlLmlkLFxuICAgIGxhYmVsOiBub2RlLmxhYmVsLFxuICAgIGtpbmQ6IG5vZGUua2luZCxcbiAgICBzdGF0dXM6IG5vZGUuc3RhdHVzLFxuICAgIGJhZGdlOiBub2RlLmJhZGdlID8/ICcnLFxuICAgIGV4dGVybmFsOiBub2RlLmV4dGVybmFsLFxuICAgIHJhbmdlOiBub2RlLnJhbmdlXG4gICAgICA/IHtcbiAgICAgICAgICBmaWxlSWQ6IG5vZGUucmFuZ2UuZmlsZUlkLFxuICAgICAgICAgIHN0YXJ0TGluZTogbm9kZS5yYW5nZS5zdGFydExpbmUsXG4gICAgICAgICAgZW5kTGluZTogbm9kZS5yYW5nZS5lbmRMaW5lLFxuICAgICAgICB9XG4gICAgICA6IG51bGwsXG4gICAgcG9zaXRpb246IGxheW91dC5wb3NpdGlvbnNbbm9kZS5pZF0gPz8geyB4OiAwLCB5OiAwLCB3aWR0aDogMTkwLCBoZWlnaHQ6IDU0LCBsYXllcjogMCB9LFxuICB9KSk7XG5cbiAgY29uc3Qgc3RhdHVzZXMgPSBbLi4ubmV3IFNldChub2Rlcy5tYXAoKG5vZGUpID0+IG5vZGUuc3RhdHVzKSldLnNvcnQoKTtcbiAgY29uc3Qga2luZHMgPSBbLi4ubmV3IFNldChub2Rlcy5tYXAoKG5vZGUpID0+IG5vZGUua2luZCkpXS5zb3J0KCk7XG5cbiAgcmV0dXJuIHtcbiAgICBkdG9WZXJzaW9uOiBHUkFQSF9EVE9fVkVSU0lPTixcbiAgICBncmFwaElkOiBncmFwaC5ncmFwaElkLFxuICAgIHJ1bklkOiBncmFwaC5ydW5JZCxcbiAgICBsYW5ndWFnZTogZ3JhcGgubGFuZ3VhZ2UsXG4gICAgYWRhcHRlcklkOiBncmFwaC5hZGFwdGVySWQsXG4gICAgY29tcGxldGVuZXNzOiBncmFwaC5jb21wbGV0ZW5lc3MsXG4gICAgbm9kZXMsXG4gICAgZWRnZXM6IGdyYXBoLmVkZ2VzLm1hcCgoZWRnZSkgPT4gKHtcbiAgICAgIGlkOiBlZGdlLmlkLFxuICAgICAgZnJvbTogZWRnZS5mcm9tLFxuICAgICAgdG86IGVkZ2UudG8sXG4gICAgICB0eXBlOiBlZGdlLnR5cGUsXG4gICAgICBzdGF0dXM6IGVkZ2Uuc3RhdHVzLFxuICAgICAgbGFiZWw6IGVkZ2UubGFiZWwsXG4gICAgICByZWFzb25Db2RlOiBlZGdlLnJlYXNvbkNvZGUgPz8gbnVsbCxcbiAgICB9KSksXG4gICAgZGlhZ25vc3RpY3M6IGdyYXBoLmRpYWdub3N0aWNzLFxuICAgIGRlZ3JhZGF0aW9uczogZ3JhcGguZGVncmFkYXRpb25zLFxuICAgIGV4dGVudDogeyB3aWR0aDogbGF5b3V0LndpZHRoLCBoZWlnaHQ6IGxheW91dC5oZWlnaHQgfSxcbiAgICBsZWdlbmQ6IHsgc3RhdHVzZXMsIGtpbmRzIH0sXG4gIH07XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSBkdG9cbiAqIEByZXR1cm5zIHt7b2s6IHRydWUsIGR0bzogR3JhcGhEdG99IHwge29rOiBmYWxzZSwgaXNzdWVzOiBzdHJpbmdbXX19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUR0byhkdG8pIHtcbiAgLyoqIEB0eXBlIHtzdHJpbmdbXX0gKi9cbiAgY29uc3QgaXNzdWVzID0gW107XG4gIGlmICh0eXBlb2YgZHRvICE9PSAnb2JqZWN0JyB8fCBkdG8gPT09IG51bGwgfHwgQXJyYXkuaXNBcnJheShkdG8pKSB7XG4gICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBpc3N1ZXM6IFsnRFRPIG11c3QgYmUgYW4gb2JqZWN0LiddIH07XG4gIH1cbiAgY29uc3QgY2FuZGlkYXRlID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKGR0byk7XG4gIGlmIChjYW5kaWRhdGUuZHRvVmVyc2lvbiAhPT0gR1JBUEhfRFRPX1ZFUlNJT04pIHtcbiAgICBpc3N1ZXMucHVzaChgVW5zdXBwb3J0ZWQgZHRvVmVyc2lvbjogJHtTdHJpbmcoY2FuZGlkYXRlLmR0b1ZlcnNpb24pfS5gKTtcbiAgfVxuICBjb25zdCBub2RlcyA9IGNhbmRpZGF0ZS5ub2RlcztcbiAgY29uc3QgZWRnZXMgPSBjYW5kaWRhdGUuZWRnZXM7XG4gIGlmICghQXJyYXkuaXNBcnJheShub2RlcykpIHtcbiAgICBpc3N1ZXMucHVzaCgnbm9kZXMgbXVzdCBiZSBhbiBhcnJheS4nKTtcbiAgfVxuICBpZiAoIUFycmF5LmlzQXJyYXkoZWRnZXMpKSB7XG4gICAgaXNzdWVzLnB1c2goJ2VkZ2VzIG11c3QgYmUgYW4gYXJyYXkuJyk7XG4gIH1cbiAgaWYgKEFycmF5LmlzQXJyYXkobm9kZXMpICYmIEFycmF5LmlzQXJyYXkoZWRnZXMpKSB7XG4gICAgY29uc3QgaWRzID0gbmV3IFNldCgpO1xuICAgIGZvciAoY29uc3Qgbm9kZSBvZiBub2Rlcykge1xuICAgICAgY29uc3QgaWQgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAobm9kZSkuaWQ7XG4gICAgICBpZiAodHlwZW9mIGlkICE9PSAnc3RyaW5nJykge1xuICAgICAgICBpc3N1ZXMucHVzaCgnRXZlcnkgbm9kZSBuZWVkcyBhIHN0cmluZyBpZC4nKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoaWRzLmhhcyhpZCkpIHtcbiAgICAgICAgaXNzdWVzLnB1c2goYER1cGxpY2F0ZSBub2RlIGlkIFwiJHtpZH1cIi5gKTtcbiAgICAgIH1cbiAgICAgIGlkcy5hZGQoaWQpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGVkZ2Ugb2YgZWRnZXMpIHtcbiAgICAgIGNvbnN0IHJlY29yZCA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChlZGdlKTtcbiAgICAgIGlmICh0eXBlb2YgcmVjb3JkLmZyb20gIT09ICdzdHJpbmcnIHx8ICFpZHMuaGFzKHJlY29yZC5mcm9tKSkge1xuICAgICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7U3RyaW5nKHJlY29yZC5pZCl9XCIgaGFzIGFuIHVua25vd24gc291cmNlIG5vZGUuYCk7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIHJlY29yZC50byAhPT0gJ3N0cmluZycgfHwgIWlkcy5oYXMocmVjb3JkLnRvKSkge1xuICAgICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7U3RyaW5nKHJlY29yZC5pZCl9XCIgaGFzIGFuIHVua25vd24gdGFyZ2V0IG5vZGUuYCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChpc3N1ZXMubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiB7IG9rOiBmYWxzZSwgaXNzdWVzIH07XG4gIH1cbiAgcmV0dXJuIHsgb2s6IHRydWUsIGR0bzogLyoqIEB0eXBlIHtHcmFwaER0b30gKi8gKGR0bykgfTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0dyYXBoRHRvfSBkdG9cbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVEdG8oZHRvKSB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeShkdG8pO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBqc29uXG4gKiBAcmV0dXJucyB7R3JhcGhEdG99XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUR0byhqc29uKSB7XG4gIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UoanNvbik7XG4gIGNvbnN0IHZhbGlkYXRpb24gPSB2YWxpZGF0ZUR0byhwYXJzZWQpO1xuICBpZiAoIXZhbGlkYXRpb24ub2spIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZ3JhcGggRFRPOiAke3ZhbGlkYXRpb24uaXNzdWVzLmpvaW4oJzsgJyl9YCk7XG4gIH1cbiAgcmV0dXJuIHZhbGlkYXRpb24uZHRvO1xufVxuIiwgIi8qKlxuICogQ29tbWFuZCByZWdpc3RyYXRpb24uXG4gKlxuICogRXZlcnkgY29tbWFuZCBnb2VzIHRocm91Z2ggYGd1YXJkYCwgd2hpY2ggbWVhbnMgbm8gY29tbWFuZCBoYW5kbGVyIGNhbiB0YWtlXG4gKiBkb3duIHRoZSBleHRlbnNpb24gaG9zdDogZmFpbHVyZXMgYmVjb21lIGEgbG9nIGVudHJ5IGFuZCBvbmUgdXNlci12aXNpYmxlXG4gKiBtZXNzYWdlLlxuICovXG5cbmltcG9ydCAqIGFzIHZzY29kZSBmcm9tICd2c2NvZGUnO1xuaW1wb3J0IHsgYnVpbGREaWFnbm9zdGljc1JlcG9ydCwgb3BlbkRpYWdub3N0aWNzRG9jdW1lbnQgfSBmcm9tICcuL2RpYWdub3N0aWNzLmpzJztcblxuLyoqXG4gKiBAcGFyYW0ge3tcbiAqICAgY29udGV4dDogdnNjb2RlLkV4dGVuc2lvbkNvbnRleHQsXG4gKiAgIGxvZ2dlcjoge2luZm86IEZ1bmN0aW9uLCB3YXJuOiBGdW5jdGlvbiwgZXJyb3I6IEZ1bmN0aW9uLCBzaG93OiBGdW5jdGlvbiwgbGV2ZWw6ICgpID0+IHN0cmluZ30sXG4gKiAgIHBhbmVsTWFuYWdlcjoge3Nob3c6ICgpID0+IHVua25vd24sIGlzT3BlbjogKCkgPT4gYm9vbGVhbiwgcGVuZGluZ1JlcXVlc3RzOiAoKSA9PiBudW1iZXJ9LFxuICogICByZWdpc3RyeTogUmV0dXJuVHlwZTx0eXBlb2YgaW1wb3J0KCcuLi9jb3JlL2FkYXB0ZXJSZWdpc3RyeS5qcycpLmNyZWF0ZUFkYXB0ZXJSZWdpc3RyeT4sXG4gKiAgIGV4dGVuc2lvblZlcnNpb246IHN0cmluZyxcbiAqIH19IG9wdGlvbnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ29tbWFuZHMoeyBjb250ZXh0LCBsb2dnZXIsIHBhbmVsTWFuYWdlciwgcmVnaXN0cnksIGV4dGVuc2lvblZlcnNpb24gfSkge1xuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvbW1hbmRJZFxuICAgKiBAcGFyYW0geygpID0+IHVua25vd24gfCBQcm9taXNlPHVua25vd24+fSBoYW5kbGVyXG4gICAqL1xuICBmdW5jdGlvbiByZWdpc3Rlcihjb21tYW5kSWQsIGhhbmRsZXIpIHtcbiAgICBjb25zdCBkaXNwb3NhYmxlID0gdnNjb2RlLmNvbW1hbmRzLnJlZ2lzdGVyQ29tbWFuZChjb21tYW5kSWQsIGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBoYW5kbGVyKCk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuICAgICAgICBjb25zdCBjb2RlID0gLyoqIEB0eXBlIHt7Y29kZT86IHN0cmluZ319ICovIChlcnJvcik/LmNvZGUgPz8gJ0VfSU5URVJOQUwnO1xuICAgICAgICBsb2dnZXIuZXJyb3IoJ2NvbW1hbmQuZmFpbGVkJywgeyBjb21tYW5kSWQsIGNvZGUsIGVycm9yOiBtZXNzYWdlIH0pO1xuICAgICAgICBjb25zdCBjaG9pY2UgPSBhd2FpdCB2c2NvZGUud2luZG93LnNob3dFcnJvck1lc3NhZ2UoXG4gICAgICAgICAgYENvZGVGbG93OiAke21lc3NhZ2V9YCxcbiAgICAgICAgICAnU2hvdyBsb2cnLFxuICAgICAgICApO1xuICAgICAgICBpZiAoY2hvaWNlID09PSAnU2hvdyBsb2cnKSB7XG4gICAgICAgICAgbG9nZ2VyLnNob3coKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGNvbnRleHQuc3Vic2NyaXB0aW9ucy5wdXNoKGRpc3Bvc2FibGUpO1xuICB9XG5cbiAgcmVnaXN0ZXIoJ2NvZGVmbG93Lm9wZW5FeHBsb3JlcicsICgpID0+IHtcbiAgICBsb2dnZXIuaW5mbygnY29tbWFuZC5vcGVuRXhwbG9yZXInKTtcbiAgICBwYW5lbE1hbmFnZXIuc2hvdygpO1xuICB9KTtcblxuICByZWdpc3RlcignY29kZWZsb3cuc2hvd0RpYWdub3N0aWNzJywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHJlcG9ydCA9IGJ1aWxkRGlhZ25vc3RpY3NSZXBvcnQoe1xuICAgICAgcmVnaXN0cnksXG4gICAgICBwYW5lbE1hbmFnZXIsXG4gICAgICBsb2dnZXIsXG4gICAgICBleHRlbnNpb25WZXJzaW9uLFxuICAgIH0pO1xuICAgIGF3YWl0IG9wZW5EaWFnbm9zdGljc0RvY3VtZW50KHJlcG9ydCk7XG4gIH0pO1xuXG4gIHJlZ2lzdGVyKCdjb2RlZmxvdy5zaG93TG9nJywgKCkgPT4ge1xuICAgIGxvZ2dlci5zaG93KCk7XG4gIH0pO1xufVxuIiwgIi8qKlxuICogRGlhZ25vc3RpY3MgcmVwb3J0LlxuICpcbiAqIE11c3QgYW5zd2VyIFwid2h5IGlzbid0IHRoaXMgd29ya2luZz9cIiB3aXRob3V0IGFza2luZyB0aGUgdXNlciB0byBvcGVuIGFuXG4gKiBlZGl0b3IncyBkZXZlbG9wZXIgdG9vbHMuIEl0IGNvbnRhaW5zIHZlcnNpb25zLCBjYXBhYmlsaXR5IHN0YXRlLCBhbmQgc2V0dGluZ1xuICogdmFsdWVzIFx1MjAxNCBuZXZlciBzb3VyY2UgdGV4dCBhbmQgbmV2ZXIgc2VjcmV0cy5cbiAqL1xuXG5pbXBvcnQgKiBhcyB2c2NvZGUgZnJvbSAndnNjb2RlJztcbmltcG9ydCB7IFBST1RPQ09MX1ZFUlNJT04gfSBmcm9tICcuLi9jb3JlL3Byb3RvY29sL2VudmVsb3BlLmpzJztcblxuLyoqXG4gKiBAcGFyYW0ge3tcbiAqICAgcmVnaXN0cnk6IFJldHVyblR5cGU8dHlwZW9mIGltcG9ydCgnLi4vY29yZS9hZGFwdGVyUmVnaXN0cnkuanMnKS5jcmVhdGVBZGFwdGVyUmVnaXN0cnk+LFxuICogICBwYW5lbE1hbmFnZXI6IHtpc09wZW46ICgpID0+IGJvb2xlYW4sIHBlbmRpbmdSZXF1ZXN0czogKCkgPT4gbnVtYmVyfSxcbiAqICAgbG9nZ2VyOiB7bGV2ZWw6ICgpID0+IHN0cmluZ30sXG4gKiAgIGV4dGVuc2lvblZlcnNpb246IHN0cmluZyxcbiAqIH19IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZERpYWdub3N0aWNzUmVwb3J0KHsgcmVnaXN0cnksIHBhbmVsTWFuYWdlciwgbG9nZ2VyLCBleHRlbnNpb25WZXJzaW9uIH0pIHtcbiAgY29uc3QgdmVyc2lvbnMgPSBwcm9jZXNzLnZlcnNpb25zID8/IHt9O1xuICBjb25zdCBjb25maWd1cmF0aW9uID0gdnNjb2RlLndvcmtzcGFjZS5nZXRDb25maWd1cmF0aW9uKCdjb2RlZmxvdycpO1xuICBjb25zdCB3b3Jrc3BhY2VGb2xkZXJzID0gKHZzY29kZS53b3Jrc3BhY2Uud29ya3NwYWNlRm9sZGVycyA/PyBbXSkubWFwKFxuICAgIChmb2xkZXIpID0+IGZvbGRlci5uYW1lLFxuICApO1xuXG4gIGNvbnN0IGxpbmVzID0gW1xuICAgICcjIENvZGVGbG93IGRpYWdub3N0aWNzJyxcbiAgICAnJyxcbiAgICAnQ29weSB0aGlzIHJlcG9ydCB3aGVuIGZpbGluZyBhbiBpc3N1ZS4gSXQgY29udGFpbnMgbm8gc291cmNlIHRleHQuJyxcbiAgICAnJyxcbiAgICAnIyMgQnVpbGQnLFxuICAgICcnLFxuICAgIGAtIEV4dGVuc2lvbjogJHtleHRlbnNpb25WZXJzaW9ufWAsXG4gICAgYC0gVlMgQ29kZTogJHt2c2NvZGUudmVyc2lvbn1gLFxuICAgIGAtIFByb3RvY29sOiB2JHtQUk9UT0NPTF9WRVJTSU9OfWAsXG4gICAgYC0gTm9kZTogJHt2ZXJzaW9ucy5ub2RlID8/ICd1bmtub3duJ31gLFxuICAgIGAtIEVsZWN0cm9uOiAke3ZlcnNpb25zLmVsZWN0cm9uID8/ICduL2EnfWAsXG4gICAgYC0gQ2hyb21pdW06ICR7dmVyc2lvbnMuY2hyb21lID8/ICduL2EnfWAsXG4gICAgYC0gUGxhdGZvcm06ICR7cHJvY2Vzcy5wbGF0Zm9ybX0gJHtwcm9jZXNzLmFyY2h9YCxcbiAgICAnJyxcbiAgICAnIyMgV29ya3NwYWNlJyxcbiAgICAnJyxcbiAgICBgLSBGb2xkZXJzOiAke3dvcmtzcGFjZUZvbGRlcnMubGVuZ3RoID4gMCA/IHdvcmtzcGFjZUZvbGRlcnMuam9pbignLCAnKSA6ICcobm9uZSknfWAsXG4gICAgYC0gV29ya3NwYWNlIHRydXN0ZWQ6ICR7dnNjb2RlLndvcmtzcGFjZS5pc1RydXN0ZWQgPyAneWVzJyA6ICdubyd9YCxcbiAgICAnJyxcbiAgICAnIyMgUnVudGltZScsXG4gICAgJycsXG4gICAgYC0gTG9nIGxldmVsOiAke2xvZ2dlci5sZXZlbCgpfWAsXG4gICAgYC0gR3JhcGggcGFuZWwgb3BlbjogJHtwYW5lbE1hbmFnZXIuaXNPcGVuKCkgPyAneWVzJyA6ICdubyd9YCxcbiAgICBgLSBQZW5kaW5nIHdlYnZpZXcgcmVxdWVzdHM6ICR7cGFuZWxNYW5hZ2VyLnBlbmRpbmdSZXF1ZXN0cygpfWAsXG4gICAgJycsXG4gICAgJyMjIEFkYXB0ZXJzJyxcbiAgICAnJyxcbiAgXTtcblxuICBjb25zdCBhZGFwdGVycyA9IHJlZ2lzdHJ5LmNhcGFiaWxpdHlNYXRyaXgoKTtcbiAgaWYgKGFkYXB0ZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgIGxpbmVzLnB1c2goJy0gTm8gYWRhcHRlcnMgcmVnaXN0ZXJlZC4nKTtcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGNvbnN0IGFkYXB0ZXIgb2YgYWRhcHRlcnMpIHtcbiAgICAgIGNvbnN0IGVuYWJsZWQgPSBPYmplY3QuZW50cmllcyhhZGFwdGVyLmNhcGFiaWxpdGllcylcbiAgICAgICAgLmZpbHRlcigoWywgdmFsdWVdKSA9PiB2YWx1ZSlcbiAgICAgICAgLm1hcCgoW2tleV0pID0+IGtleSk7XG4gICAgICBsaW5lcy5wdXNoKFxuICAgICAgICBgLSAke2FkYXB0ZXIuaWR9ICgke2FkYXB0ZXIubGFuZ3VhZ2VzLmpvaW4oJywgJyl9KTogJHtcbiAgICAgICAgICBlbmFibGVkLmxlbmd0aCA+IDAgPyBlbmFibGVkLmpvaW4oJywgJykgOiAnbm8gY2FwYWJpbGl0aWVzJ1xuICAgICAgICB9YCxcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgbGluZXMucHVzaCgnJywgJyMjIFNldHRpbmdzJywgJycpO1xuICBmb3IgKGNvbnN0IGtleSBvZiBbJ2xvZ0xldmVsJywgJ3Byb3RvY29sLnRyYWNlTWVzc2FnZXMnLCAnZXhwbG9yZXIucmV0YWluQ29udGV4dCddKSB7XG4gICAgbGluZXMucHVzaChgLSBjb2RlZmxvdy4ke2tleX06ICR7SlNPTi5zdHJpbmdpZnkoY29uZmlndXJhdGlvbi5nZXQoa2V5KSl9YCk7XG4gIH1cblxuICBsaW5lcy5wdXNoKFxuICAgICcnLFxuICAgICcjIyBLbm93biBQaGFzZSAwIGxpbWl0cycsXG4gICAgJycsXG4gICAgJy0gR3JhcGggZGF0YSBjb21lcyBmcm9tIHRoZSBtb2NrIGFkYXB0ZXI7IG5vIHJlYWwgQysrIG9yIEphdmFTY3JpcHQgYW5hbHlzaXMgZXhpc3RzIHlldC4nLFxuICAgICctIE5vIHNvdXJjZSBwcmV2aWV3LCBjYWxsIGdyYXBoLCBkYXRhIGZsb3csIGluZGV4aW5nLCBvciBleHBsYW5hdGlvbnMgeWV0LicsXG4gICAgJy0gQ2FwYWJpbGl0eSBmbGFncyBhYm92ZSByZWZsZWN0IGFkYXB0ZXIgZGVjbGFyYXRpb25zLCBub3Qgc2hpcHBlZCBmZWF0dXJlcy4nLFxuICAgICcnLFxuICApO1xuXG4gIHJldHVybiBsaW5lcy5qb2luKCdcXG4nKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gY29udGVudFxuICogQHJldHVybnMge1Byb21pc2U8dm9pZD59XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvcGVuRGlhZ25vc3RpY3NEb2N1bWVudChjb250ZW50KSB7XG4gIGNvbnN0IGRvY3VtZW50ID0gYXdhaXQgdnNjb2RlLndvcmtzcGFjZS5vcGVuVGV4dERvY3VtZW50KHtcbiAgICBjb250ZW50LFxuICAgIGxhbmd1YWdlOiAnbWFya2Rvd24nLFxuICB9KTtcbiAgYXdhaXQgdnNjb2RlLndpbmRvdy5zaG93VGV4dERvY3VtZW50KGRvY3VtZW50LCB7IHByZXZpZXc6IHRydWUgfSk7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQVNBLElBQUFBLFVBQXdCOzs7QUNEeEIsYUFBd0I7OztBQ0tqQixJQUFNLG1CQUFtQjtBQUN6QixJQUFNLGFBQWE7QUFDMUIsSUFBTSxZQUFZO0FBRWxCLElBQU0scUJBQ0o7QUFFRixJQUFNLHdCQUF3QjtBQUFBLEVBQzVCLENBQUMsbUNBQW1DLFNBQVM7QUFBQSxFQUM3QyxDQUFDLHFDQUFxQyxnQkFBZ0I7QUFBQSxFQUN0RCxDQUFDLDRCQUE0QixRQUFRO0FBQUEsRUFDckMsQ0FBQyx5QkFBeUIsU0FBUztBQUFBLEVBQ25DLENBQUMscUNBQXFDLFVBQVU7QUFDbEQ7QUFNTyxTQUFTLGFBQWEsT0FBTztBQUNsQyxNQUFJLFNBQVM7QUFDYixhQUFXLENBQUMsU0FBUyxXQUFXLEtBQUssdUJBQXVCO0FBQzFELGFBQVMsT0FBTyxRQUFRLFNBQVMsV0FBVztBQUFBLEVBQzlDO0FBQ0EsTUFBSSxPQUFPLFNBQVMsa0JBQWtCO0FBQ3BDLFVBQU0sVUFBVSxPQUFPLFNBQVM7QUFDaEMsYUFBUyxHQUFHLE9BQU8sTUFBTSxHQUFHLGdCQUFnQixDQUFDLFdBQU0sT0FBTztBQUFBLEVBQzVEO0FBQ0EsU0FBTztBQUNUO0FBT08sU0FBUyxZQUFZLE9BQU8sUUFBUSxHQUFHO0FBQzVDLE1BQUksVUFBVSxRQUFRLFVBQVUsUUFBVztBQUN6QyxXQUFPO0FBQUEsRUFDVDtBQUNBLE1BQUksT0FBTyxVQUFVLFVBQVU7QUFDN0IsV0FBTyxhQUFhLEtBQUs7QUFBQSxFQUMzQjtBQUNBLE1BQUksT0FBTyxVQUFVLFlBQVksT0FBTyxVQUFVLFdBQVc7QUFDM0QsV0FB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QUNOLFVBQVU7QUFBQSxJQUNWLGFBQWE7QUFBQSxJQUNiLFdBQVc7QUFBQSxFQUNiO0FBQ0Y7QUFFQSxJQUFNLFVBQVU7QUFBQSxFQUNkO0FBQUEsSUFDRSxVQUFVO0FBQUEsSUFDVixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixlQUFlO0FBQUEsSUFDZixhQUFhO0FBQUEsTUFDWCxRQUFRO0FBQUEsTUFDUixXQUFXO0FBQUEsTUFDWCxhQUFhO0FBQUEsTUFDYixTQUFTO0FBQUEsTUFDVCxXQUFXO0FBQUEsSUFDYjtBQUFBLEVBQ0Y7QUFBQSxFQUNBO0FBQUEsSUFDRSxVQUFVO0FBQUEsSUFDVixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixlQUFlO0FBQUEsSUFDZixhQUFhO0FBQUEsTUFDWCxRQUFRO0FBQUEsTUFDUixXQUFXO0FBQUEsTUFDWCxhQUFhO0FBQUEsTUFDYixTQUFTO0FBQUEsTUFDVCxXQUFXO0FBQUEsSUFDYjtBQUFBLElBQ0EsWUFBWSxFQUFFLE9BQU8sTUFBTSxZQUFZLEVBQUU7QUFBQSxFQUMzQztBQUFBLEVBQ0E7QUFBQSxJQUNFLFVBQVU7QUFBQSxJQUNWLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLGVBQWU7QUFBQSxJQUNmLGFBQWE7QUFBQSxNQUNYLFFBQVE7QUFBQSxNQUNSLFdBQVc7QUFBQSxNQUNYLGFBQWE7QUFBQSxNQUNiLFNBQVM7QUFBQSxNQUNULFdBQVc7QUFBQSxJQUNiO0FBQUEsRUFDRjtBQUFBLEVBQ0E7QUFBQSxJQUNFLFVBQVU7QUFBQSxJQUNWLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLGVBQWU7QUFBQSxJQUNmLGFBQWE7QUFBQSxNQUNYLFFBQVE7QUFBQSxNQUNSLFdBQVc7QUFBQSxNQUNYLGFBQWE7QUFBQSxNQUNiLFNBQVM7QUFBQSxNQUNULFdBQVc7QUFBQSxJQUNiO0FBQUEsRUFDRjtBQUFBLEVBQ0E7QUFBQSxJQUNFLFVBQVU7QUFBQSxJQUNWLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLGVBQWU7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QUFtQjtBQUFBLElBQ3RDO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBLGtCQUFrQjtBQUFBLEVBQ3BCLENBQUM7QUFFRCxtQkFBaUI7QUFBQSxJQUNmO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQSxrQkFBa0I7QUFBQSxFQUNwQixDQUFDO0FBRUQsVUFBUSxjQUFjLEtBQUs7QUFBQSxJQUN6QixVQUFVO0FBQ1IsbUJBQWEsUUFBUTtBQUFBLElBQ3ZCO0FBQUEsRUFDRixDQUFDO0FBRUQsU0FBTyxLQUFLLHVCQUF1QjtBQUFBLElBQ2pDLElBQUksS0FBSyxJQUFJLElBQUk7QUFBQSxJQUNqQixTQUFTO0FBQUEsSUFDVCxRQUFlO0FBQUEsSUFDZixTQUFnQixrQkFBVTtBQUFBLEVBQzVCLENBQUM7QUFHRCxTQUFPO0FBQUEsSUFDTCxTQUFTO0FBQUEsSUFDVCxpQkFBaUI7QUFBQSxJQUNqQjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUNGO0FBRU8sU0FBUyxhQUFhO0FBRTdCOyIsCiAgIm5hbWVzIjogWyJ2c2NvZGUiLCAidnNjb2RlIiwgImNyeXB0byIsICJ2c2NvZGUiLCAidnNjb2RlIl0KfQo=
