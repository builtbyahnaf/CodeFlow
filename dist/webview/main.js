(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
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

  // node_modules/highlight.js/lib/core.js
  var require_core = __commonJS({
    "node_modules/highlight.js/lib/core.js"(exports, module) {
      function deepFreeze(obj) {
        if (obj instanceof Map) {
          obj.clear = obj.delete = obj.set = function() {
            throw new Error("map is read-only");
          };
        } else if (obj instanceof Set) {
          obj.add = obj.clear = obj.delete = function() {
            throw new Error("set is read-only");
          };
        }
        Object.freeze(obj);
        Object.getOwnPropertyNames(obj).forEach((name) => {
          const prop = obj[name];
          const type = typeof prop;
          if ((type === "object" || type === "function") && !Object.isFrozen(prop)) {
            deepFreeze(prop);
          }
        });
        return obj;
      }
      var Response = class {
        /**
         * @param {CompiledMode} mode
         */
        constructor(mode) {
          if (mode.data === void 0) mode.data = {};
          this.data = mode.data;
          this.isMatchIgnored = false;
        }
        ignoreMatch() {
          this.isMatchIgnored = true;
        }
      };
      function escapeHTML(value) {
        return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
      }
      function inherit$1(original, ...objects) {
        const result = /* @__PURE__ */ Object.create(null);
        for (const key in original) {
          result[key] = original[key];
        }
        objects.forEach(function(obj) {
          for (const key in obj) {
            result[key] = obj[key];
          }
        });
        return (
          /** @type {T} */
          result
        );
      }
      var SPAN_CLOSE = "</span>";
      var emitsWrappingTags = (node) => {
        return !!node.scope;
      };
      var scopeToCSSClass = (name, { prefix }) => {
        if (name.startsWith("language:")) {
          return name.replace("language:", "language-");
        }
        if (name.includes(".")) {
          const pieces = name.split(".");
          return [
            `${prefix}${pieces.shift()}`,
            ...pieces.map((x, i) => `${x}${"_".repeat(i + 1)}`)
          ].join(" ");
        }
        return `${prefix}${name}`;
      };
      var HTMLRenderer = class {
        /**
         * Creates a new HTMLRenderer
         *
         * @param {Tree} parseTree - the parse tree (must support `walk` API)
         * @param {{classPrefix: string}} options
         */
        constructor(parseTree, options) {
          this.buffer = "";
          this.classPrefix = options.classPrefix;
          parseTree.walk(this);
        }
        /**
         * Adds texts to the output stream
         *
         * @param {string} text */
        addText(text) {
          this.buffer += escapeHTML(text);
        }
        /**
         * Adds a node open to the output stream (if needed)
         *
         * @param {Node} node */
        openNode(node) {
          if (!emitsWrappingTags(node)) return;
          const className = scopeToCSSClass(
            node.scope,
            { prefix: this.classPrefix }
          );
          this.span(className);
        }
        /**
         * Adds a node close to the output stream (if needed)
         *
         * @param {Node} node */
        closeNode(node) {
          if (!emitsWrappingTags(node)) return;
          this.buffer += SPAN_CLOSE;
        }
        /**
         * returns the accumulated buffer
        */
        value() {
          return this.buffer;
        }
        // helpers
        /**
         * Builds a span element
         *
         * @param {string} className */
        span(className) {
          this.buffer += `<span class="${className}">`;
        }
      };
      var newNode = (opts = {}) => {
        const result = { children: [] };
        Object.assign(result, opts);
        return result;
      };
      var TokenTree = class _TokenTree {
        constructor() {
          this.rootNode = newNode();
          this.stack = [this.rootNode];
        }
        get top() {
          return this.stack[this.stack.length - 1];
        }
        get root() {
          return this.rootNode;
        }
        /** @param {Node} node */
        add(node) {
          this.top.children.push(node);
        }
        /** @param {string} scope */
        openNode(scope) {
          const node = newNode({ scope });
          this.add(node);
          this.stack.push(node);
        }
        closeNode() {
          if (this.stack.length > 1) {
            return this.stack.pop();
          }
          return void 0;
        }
        closeAllNodes() {
          while (this.closeNode()) ;
        }
        toJSON() {
          return JSON.stringify(this.rootNode, null, 4);
        }
        /**
         * @typedef { import("./html_renderer").Renderer } Renderer
         * @param {Renderer} builder
         */
        walk(builder) {
          return this.constructor._walk(builder, this.rootNode);
        }
        /**
         * @param {Renderer} builder
         * @param {Node} node
         */
        static _walk(builder, node) {
          if (typeof node === "string") {
            builder.addText(node);
          } else if (node.children) {
            builder.openNode(node);
            node.children.forEach((child) => this._walk(builder, child));
            builder.closeNode(node);
          }
          return builder;
        }
        /**
         * @param {Node} node
         */
        static _collapse(node) {
          if (typeof node === "string") return;
          if (!node.children) return;
          if (node.children.every((el) => typeof el === "string")) {
            node.children = [node.children.join("")];
          } else {
            node.children.forEach((child) => {
              _TokenTree._collapse(child);
            });
          }
        }
      };
      var TokenTreeEmitter = class extends TokenTree {
        /**
         * @param {*} options
         */
        constructor(options) {
          super();
          this.options = options;
        }
        /**
         * @param {string} text
         */
        addText(text) {
          if (text === "") {
            return;
          }
          this.add(text);
        }
        /** @param {string} scope */
        startScope(scope) {
          this.openNode(scope);
        }
        endScope() {
          this.closeNode();
        }
        /**
         * @param {Emitter & {root: DataNode}} emitter
         * @param {string} name
         */
        __addSublanguage(emitter, name) {
          const node = emitter.root;
          if (name) node.scope = `language:${name}`;
          this.add(node);
        }
        toHTML() {
          const renderer2 = new HTMLRenderer(this, this.options);
          return renderer2.value();
        }
        finalize() {
          this.closeAllNodes();
          return true;
        }
      };
      function source(re) {
        if (!re) return null;
        if (typeof re === "string") return re;
        return re.source;
      }
      function lookahead(re) {
        return concat("(?=", re, ")");
      }
      function anyNumberOfTimes(re) {
        return concat("(?:", re, ")*");
      }
      function optional(re) {
        return concat("(?:", re, ")?");
      }
      function concat(...args) {
        const joined = args.map((x) => source(x)).join("");
        return joined;
      }
      function stripOptionsFromArgs(args) {
        const opts = args[args.length - 1];
        if (typeof opts === "object" && opts.constructor === Object) {
          args.splice(args.length - 1, 1);
          return opts;
        } else {
          return {};
        }
      }
      function either(...args) {
        const opts = stripOptionsFromArgs(args);
        const joined = "(" + (opts.capture ? "" : "?:") + args.map((x) => source(x)).join("|") + ")";
        return joined;
      }
      function countMatchGroups(re) {
        return new RegExp(re.toString() + "|").exec("").length - 1;
      }
      function startsWith(re, lexeme) {
        const match = re && re.exec(lexeme);
        return match && match.index === 0;
      }
      var BACKREF_RE = /\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;
      function _rewriteBackreferences(regexps, { joinWith }) {
        let numCaptures = 0;
        return regexps.map((regex) => {
          numCaptures += 1;
          const offset = numCaptures;
          let re = source(regex);
          let out = "";
          while (re.length > 0) {
            const match = BACKREF_RE.exec(re);
            if (!match) {
              out += re;
              break;
            }
            out += re.substring(0, match.index);
            re = re.substring(match.index + match[0].length);
            if (match[0][0] === "\\" && match[1]) {
              out += "\\" + String(Number(match[1]) + offset);
            } else {
              out += match[0];
              if (match[0] === "(") {
                numCaptures++;
              }
            }
          }
          return out;
        }).map((re) => `(${re})`).join(joinWith);
      }
      var MATCH_NOTHING_RE = /\b\B/;
      var IDENT_RE2 = "[a-zA-Z]\\w*";
      var UNDERSCORE_IDENT_RE = "[a-zA-Z_]\\w*";
      var NUMBER_RE = "\\b\\d+(\\.\\d+)?";
      var C_NUMBER_RE = "(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)";
      var BINARY_NUMBER_RE = "\\b(0b[01]+)";
      var RE_STARTERS_RE = "!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~";
      var SHEBANG = (opts = {}) => {
        const beginShebang = /^#![ ]*\//;
        if (opts.binary) {
          opts.begin = concat(
            beginShebang,
            /.*\b/,
            opts.binary,
            /\b.*/
          );
        }
        return inherit$1({
          scope: "meta",
          begin: beginShebang,
          end: /$/,
          relevance: 0,
          /** @type {ModeCallback} */
          "on:begin": (m, resp) => {
            if (m.index !== 0) resp.ignoreMatch();
          }
        }, opts);
      };
      var BACKSLASH_ESCAPE = {
        begin: "\\\\[\\s\\S]",
        relevance: 0
      };
      var APOS_STRING_MODE = {
        scope: "string",
        begin: "'",
        end: "'",
        illegal: "\\n",
        contains: [BACKSLASH_ESCAPE]
      };
      var QUOTE_STRING_MODE = {
        scope: "string",
        begin: '"',
        end: '"',
        illegal: "\\n",
        contains: [BACKSLASH_ESCAPE]
      };
      var PHRASAL_WORDS_MODE = {
        begin: /\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
      };
      var COMMENT = function(begin, end, modeOptions = {}) {
        const mode = inherit$1(
          {
            scope: "comment",
            begin,
            end,
            contains: []
          },
          modeOptions
        );
        mode.contains.push({
          scope: "doctag",
          // hack to avoid the space from being included. the space is necessary to
          // match here to prevent the plain text rule below from gobbling up doctags
          begin: "[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",
          end: /(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,
          excludeBegin: true,
          relevance: 0
        });
        const ENGLISH_WORD = either(
          // list of common 1 and 2 letter words in English
          "I",
          "a",
          "is",
          "so",
          "us",
          "to",
          "at",
          "if",
          "in",
          "it",
          "on",
          // note: this is not an exhaustive list of contractions, just popular ones
          /[A-Za-z]+['](d|ve|re|ll|t|s|n)/,
          // contractions - can't we'd they're let's, etc
          /[A-Za-z]+[-][a-z]+/,
          // `no-way`, etc.
          /[A-Za-z][a-z]{2,}/
          // allow capitalized words at beginning of sentences
        );
        mode.contains.push(
          {
            // TODO: how to include ", (, ) without breaking grammars that use these for
            // comment delimiters?
            // begin: /[ ]+([()"]?([A-Za-z'-]{3,}|is|a|I|so|us|[tT][oO]|at|if|in|it|on)[.]?[()":]?([.][ ]|[ ]|\))){3}/
            // ---
            // this tries to find sequences of 3 english words in a row (without any
            // "programming" type syntax) this gives us a strong signal that we've
            // TRULY found a comment - vs perhaps scanning with the wrong language.
            // It's possible to find something that LOOKS like the start of the
            // comment - but then if there is no readable text - good chance it is a
            // false match and not a comment.
            //
            // for a visual example please see:
            // https://github.com/highlightjs/highlight.js/issues/2827
            begin: concat(
              /[ ]+/,
              // necessary to prevent us gobbling up doctags like /* @author Bob Mcgill */
              "(",
              ENGLISH_WORD,
              /[.]?[:]?([.][ ]|[ ])/,
              "){3}"
            )
            // look for 3 words in a row
          }
        );
        return mode;
      };
      var C_LINE_COMMENT_MODE = COMMENT("//", "$");
      var C_BLOCK_COMMENT_MODE = COMMENT("/\\*", "\\*/");
      var HASH_COMMENT_MODE = COMMENT("#", "$");
      var NUMBER_MODE = {
        scope: "number",
        begin: NUMBER_RE,
        relevance: 0
      };
      var C_NUMBER_MODE = {
        scope: "number",
        begin: C_NUMBER_RE,
        relevance: 0
      };
      var BINARY_NUMBER_MODE = {
        scope: "number",
        begin: BINARY_NUMBER_RE,
        relevance: 0
      };
      var REGEXP_MODE = {
        scope: "regexp",
        begin: /\/(?=[^/\n]*\/)/,
        end: /\/[gimuy]*/,
        contains: [
          BACKSLASH_ESCAPE,
          {
            begin: /\[/,
            end: /\]/,
            relevance: 0,
            contains: [BACKSLASH_ESCAPE]
          }
        ]
      };
      var TITLE_MODE = {
        scope: "title",
        begin: IDENT_RE2,
        relevance: 0
      };
      var UNDERSCORE_TITLE_MODE = {
        scope: "title",
        begin: UNDERSCORE_IDENT_RE,
        relevance: 0
      };
      var METHOD_GUARD = {
        // excludes method names from keyword processing
        begin: "\\.\\s*" + UNDERSCORE_IDENT_RE,
        relevance: 0
      };
      var END_SAME_AS_BEGIN = function(mode) {
        return Object.assign(
          mode,
          {
            /** @type {ModeCallback} */
            "on:begin": (m, resp) => {
              resp.data._beginMatch = m[1];
            },
            /** @type {ModeCallback} */
            "on:end": (m, resp) => {
              if (resp.data._beginMatch !== m[1]) resp.ignoreMatch();
            }
          }
        );
      };
      var MODES = /* @__PURE__ */ Object.freeze({
        __proto__: null,
        APOS_STRING_MODE,
        BACKSLASH_ESCAPE,
        BINARY_NUMBER_MODE,
        BINARY_NUMBER_RE,
        COMMENT,
        C_BLOCK_COMMENT_MODE,
        C_LINE_COMMENT_MODE,
        C_NUMBER_MODE,
        C_NUMBER_RE,
        END_SAME_AS_BEGIN,
        HASH_COMMENT_MODE,
        IDENT_RE: IDENT_RE2,
        MATCH_NOTHING_RE,
        METHOD_GUARD,
        NUMBER_MODE,
        NUMBER_RE,
        PHRASAL_WORDS_MODE,
        QUOTE_STRING_MODE,
        REGEXP_MODE,
        RE_STARTERS_RE,
        SHEBANG,
        TITLE_MODE,
        UNDERSCORE_IDENT_RE,
        UNDERSCORE_TITLE_MODE
      });
      function skipIfHasPrecedingDot(match, response) {
        const before = match.input[match.index - 1];
        if (before === ".") {
          response.ignoreMatch();
        }
      }
      function scopeClassName(mode, _parent) {
        if (mode.className !== void 0) {
          mode.scope = mode.className;
          delete mode.className;
        }
      }
      function beginKeywords(mode, parent) {
        if (!parent) return;
        if (!mode.beginKeywords) return;
        mode.begin = "\\b(" + mode.beginKeywords.split(" ").join("|") + ")(?!\\.)(?=\\b|\\s)";
        mode.__beforeBegin = skipIfHasPrecedingDot;
        mode.keywords = mode.keywords || mode.beginKeywords;
        delete mode.beginKeywords;
        if (mode.relevance === void 0) mode.relevance = 0;
      }
      function compileIllegal(mode, _parent) {
        if (!Array.isArray(mode.illegal)) return;
        mode.illegal = either(...mode.illegal);
      }
      function compileMatch(mode, _parent) {
        if (!mode.match) return;
        if (mode.begin || mode.end) throw new Error("begin & end are not supported with match");
        mode.begin = mode.match;
        delete mode.match;
      }
      function compileRelevance(mode, _parent) {
        if (mode.relevance === void 0) mode.relevance = 1;
      }
      var beforeMatchExt = (mode, parent) => {
        if (!mode.beforeMatch) return;
        if (mode.starts) throw new Error("beforeMatch cannot be used with starts");
        const originalMode = Object.assign({}, mode);
        Object.keys(mode).forEach((key) => {
          delete mode[key];
        });
        mode.keywords = originalMode.keywords;
        mode.begin = concat(originalMode.beforeMatch, lookahead(originalMode.begin));
        mode.starts = {
          relevance: 0,
          contains: [
            Object.assign(originalMode, { endsParent: true })
          ]
        };
        mode.relevance = 0;
        delete originalMode.beforeMatch;
      };
      var COMMON_KEYWORDS = [
        "of",
        "and",
        "for",
        "in",
        "not",
        "or",
        "if",
        "then",
        "parent",
        // common variable name
        "list",
        // common variable name
        "value"
        // common variable name
      ];
      var DEFAULT_KEYWORD_SCOPE = "keyword";
      function compileKeywords(rawKeywords, caseInsensitive, scopeName = DEFAULT_KEYWORD_SCOPE) {
        const compiledKeywords = /* @__PURE__ */ Object.create(null);
        if (typeof rawKeywords === "string") {
          compileList(scopeName, rawKeywords.split(" "));
        } else if (Array.isArray(rawKeywords)) {
          compileList(scopeName, rawKeywords);
        } else {
          Object.keys(rawKeywords).forEach(function(scopeName2) {
            Object.assign(
              compiledKeywords,
              compileKeywords(rawKeywords[scopeName2], caseInsensitive, scopeName2)
            );
          });
        }
        return compiledKeywords;
        function compileList(scopeName2, keywordList) {
          if (caseInsensitive) {
            keywordList = keywordList.map((x) => x.toLowerCase());
          }
          keywordList.forEach(function(keyword) {
            const pair = keyword.split("|");
            compiledKeywords[pair[0]] = [scopeName2, scoreForKeyword(pair[0], pair[1])];
          });
        }
      }
      function scoreForKeyword(keyword, providedScore) {
        if (providedScore) {
          return Number(providedScore);
        }
        return commonKeyword(keyword) ? 0 : 1;
      }
      function commonKeyword(keyword) {
        return COMMON_KEYWORDS.includes(keyword.toLowerCase());
      }
      var seenDeprecations = {};
      var error = (message) => {
        console.error(message);
      };
      var warn = (message, ...args) => {
        console.log(`WARN: ${message}`, ...args);
      };
      var deprecated = (version2, message) => {
        if (seenDeprecations[`${version2}/${message}`]) return;
        console.log(`Deprecated as of ${version2}. ${message}`);
        seenDeprecations[`${version2}/${message}`] = true;
      };
      var MultiClassError = new Error();
      function remapScopeNames(mode, regexes, { key }) {
        let offset = 0;
        const scopeNames = mode[key];
        const emit = {};
        const positions = {};
        for (let i = 1; i <= regexes.length; i++) {
          positions[i + offset] = scopeNames[i];
          emit[i + offset] = true;
          offset += countMatchGroups(regexes[i - 1]);
        }
        mode[key] = positions;
        mode[key]._emit = emit;
        mode[key]._multi = true;
      }
      function beginMultiClass(mode) {
        if (!Array.isArray(mode.begin)) return;
        if (mode.skip || mode.excludeBegin || mode.returnBegin) {
          error("skip, excludeBegin, returnBegin not compatible with beginScope: {}");
          throw MultiClassError;
        }
        if (typeof mode.beginScope !== "object" || mode.beginScope === null) {
          error("beginScope must be object");
          throw MultiClassError;
        }
        remapScopeNames(mode, mode.begin, { key: "beginScope" });
        mode.begin = _rewriteBackreferences(mode.begin, { joinWith: "" });
      }
      function endMultiClass(mode) {
        if (!Array.isArray(mode.end)) return;
        if (mode.skip || mode.excludeEnd || mode.returnEnd) {
          error("skip, excludeEnd, returnEnd not compatible with endScope: {}");
          throw MultiClassError;
        }
        if (typeof mode.endScope !== "object" || mode.endScope === null) {
          error("endScope must be object");
          throw MultiClassError;
        }
        remapScopeNames(mode, mode.end, { key: "endScope" });
        mode.end = _rewriteBackreferences(mode.end, { joinWith: "" });
      }
      function scopeSugar(mode) {
        if (mode.scope && typeof mode.scope === "object" && mode.scope !== null) {
          mode.beginScope = mode.scope;
          delete mode.scope;
        }
      }
      function MultiClass(mode) {
        scopeSugar(mode);
        if (typeof mode.beginScope === "string") {
          mode.beginScope = { _wrap: mode.beginScope };
        }
        if (typeof mode.endScope === "string") {
          mode.endScope = { _wrap: mode.endScope };
        }
        beginMultiClass(mode);
        endMultiClass(mode);
      }
      function compileLanguage(language) {
        function langRe(value, global) {
          return new RegExp(
            source(value),
            "m" + (language.case_insensitive ? "i" : "") + (language.unicodeRegex ? "u" : "") + (global ? "g" : "")
          );
        }
        class MultiRegex {
          constructor() {
            this.matchIndexes = {};
            this.regexes = [];
            this.matchAt = 1;
            this.position = 0;
          }
          // @ts-ignore
          addRule(re, opts) {
            opts.position = this.position++;
            this.matchIndexes[this.matchAt] = opts;
            this.regexes.push([opts, re]);
            this.matchAt += countMatchGroups(re) + 1;
          }
          compile() {
            if (this.regexes.length === 0) {
              this.exec = () => null;
            }
            const terminators = this.regexes.map((el) => el[1]);
            this.matcherRe = langRe(_rewriteBackreferences(terminators, { joinWith: "|" }), true);
            this.lastIndex = 0;
          }
          /** @param {string} s */
          exec(s) {
            this.matcherRe.lastIndex = this.lastIndex;
            const match = this.matcherRe.exec(s);
            if (!match) {
              return null;
            }
            const i = match.findIndex((el, i2) => i2 > 0 && el !== void 0);
            const matchData = this.matchIndexes[i];
            match.splice(0, i);
            return Object.assign(match, matchData);
          }
        }
        class ResumableMultiRegex {
          constructor() {
            this.rules = [];
            this.multiRegexes = [];
            this.count = 0;
            this.lastIndex = 0;
            this.regexIndex = 0;
          }
          // @ts-ignore
          getMatcher(index) {
            if (this.multiRegexes[index]) return this.multiRegexes[index];
            const matcher = new MultiRegex();
            this.rules.slice(index).forEach(([re, opts]) => matcher.addRule(re, opts));
            matcher.compile();
            this.multiRegexes[index] = matcher;
            return matcher;
          }
          resumingScanAtSamePosition() {
            return this.regexIndex !== 0;
          }
          considerAll() {
            this.regexIndex = 0;
          }
          // @ts-ignore
          addRule(re, opts) {
            this.rules.push([re, opts]);
            if (opts.type === "begin") this.count++;
          }
          /** @param {string} s */
          exec(s) {
            const m = this.getMatcher(this.regexIndex);
            m.lastIndex = this.lastIndex;
            let result = m.exec(s);
            if (this.resumingScanAtSamePosition()) {
              if (result && result.index === this.lastIndex) ;
              else {
                const m2 = this.getMatcher(0);
                m2.lastIndex = this.lastIndex + 1;
                result = m2.exec(s);
              }
            }
            if (result) {
              this.regexIndex += result.position + 1;
              if (this.regexIndex === this.count) {
                this.considerAll();
              }
            }
            return result;
          }
        }
        function buildModeRegex(mode) {
          const mm = new ResumableMultiRegex();
          mode.contains.forEach((term) => mm.addRule(term.begin, { rule: term, type: "begin" }));
          if (mode.terminatorEnd) {
            mm.addRule(mode.terminatorEnd, { type: "end" });
          }
          if (mode.illegal) {
            mm.addRule(mode.illegal, { type: "illegal" });
          }
          return mm;
        }
        function compileMode(mode, parent) {
          const cmode = (
            /** @type CompiledMode */
            mode
          );
          if (mode.isCompiled) return cmode;
          [
            scopeClassName,
            // do this early so compiler extensions generally don't have to worry about
            // the distinction between match/begin
            compileMatch,
            MultiClass,
            beforeMatchExt
          ].forEach((ext) => ext(mode, parent));
          language.compilerExtensions.forEach((ext) => ext(mode, parent));
          mode.__beforeBegin = null;
          [
            beginKeywords,
            // do this later so compiler extensions that come earlier have access to the
            // raw array if they wanted to perhaps manipulate it, etc.
            compileIllegal,
            // default to 1 relevance if not specified
            compileRelevance
          ].forEach((ext) => ext(mode, parent));
          mode.isCompiled = true;
          let keywordPattern = null;
          if (typeof mode.keywords === "object" && mode.keywords.$pattern) {
            mode.keywords = Object.assign({}, mode.keywords);
            keywordPattern = mode.keywords.$pattern;
            delete mode.keywords.$pattern;
          }
          keywordPattern = keywordPattern || /\w+/;
          if (mode.keywords) {
            mode.keywords = compileKeywords(mode.keywords, language.case_insensitive);
          }
          cmode.keywordPatternRe = langRe(keywordPattern, true);
          if (parent) {
            if (!mode.begin) mode.begin = /\B|\b/;
            cmode.beginRe = langRe(cmode.begin);
            if (!mode.end && !mode.endsWithParent) mode.end = /\B|\b/;
            if (mode.end) cmode.endRe = langRe(cmode.end);
            cmode.terminatorEnd = source(cmode.end) || "";
            if (mode.endsWithParent && parent.terminatorEnd) {
              cmode.terminatorEnd += (mode.end ? "|" : "") + parent.terminatorEnd;
            }
          }
          if (mode.illegal) cmode.illegalRe = langRe(
            /** @type {RegExp | string} */
            mode.illegal
          );
          if (!mode.contains) mode.contains = [];
          mode.contains = [].concat(...mode.contains.map(function(c) {
            return expandOrCloneMode(c === "self" ? mode : c);
          }));
          mode.contains.forEach(function(c) {
            compileMode(
              /** @type Mode */
              c,
              cmode
            );
          });
          if (mode.starts) {
            compileMode(mode.starts, parent);
          }
          cmode.matcher = buildModeRegex(cmode);
          return cmode;
        }
        if (!language.compilerExtensions) language.compilerExtensions = [];
        if (language.contains && language.contains.includes("self")) {
          throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");
        }
        language.classNameAliases = inherit$1(language.classNameAliases || {});
        return compileMode(
          /** @type Mode */
          language
        );
      }
      function dependencyOnParent(mode) {
        if (!mode) return false;
        return mode.endsWithParent || dependencyOnParent(mode.starts);
      }
      function expandOrCloneMode(mode) {
        if (mode.variants && !mode.cachedVariants) {
          mode.cachedVariants = mode.variants.map(function(variant) {
            return inherit$1(mode, { variants: null }, variant);
          });
        }
        if (mode.cachedVariants) {
          return mode.cachedVariants;
        }
        if (dependencyOnParent(mode)) {
          return inherit$1(mode, { starts: mode.starts ? inherit$1(mode.starts) : null });
        }
        if (Object.isFrozen(mode)) {
          return inherit$1(mode);
        }
        return mode;
      }
      var version = "11.11.1";
      var HTMLInjectionError = class extends Error {
        constructor(reason, html) {
          super(reason);
          this.name = "HTMLInjectionError";
          this.html = html;
        }
      };
      var escape = escapeHTML;
      var inherit = inherit$1;
      var NO_MATCH = Symbol("nomatch");
      var MAX_KEYWORD_HITS = 7;
      var HLJS = function(hljs) {
        const languages = /* @__PURE__ */ Object.create(null);
        const aliases = /* @__PURE__ */ Object.create(null);
        const plugins = [];
        let SAFE_MODE = true;
        const LANGUAGE_NOT_FOUND = "Could not find the language '{}', did you forget to load/include a language module?";
        const PLAINTEXT_LANGUAGE = { disableAutodetect: true, name: "Plain text", contains: [] };
        let options = {
          ignoreUnescapedHTML: false,
          throwUnescapedHTML: false,
          noHighlightRe: /^(no-?highlight)$/i,
          languageDetectRe: /\blang(?:uage)?-([\w-]+)\b/i,
          classPrefix: "hljs-",
          cssSelector: "pre code",
          languages: null,
          // beta configuration options, subject to change, welcome to discuss
          // https://github.com/highlightjs/highlight.js/issues/1086
          __emitter: TokenTreeEmitter
        };
        function shouldNotHighlight(languageName) {
          return options.noHighlightRe.test(languageName);
        }
        function blockLanguage(block) {
          let classes = block.className + " ";
          classes += block.parentNode ? block.parentNode.className : "";
          const match = options.languageDetectRe.exec(classes);
          if (match) {
            const language = getLanguage(match[1]);
            if (!language) {
              warn(LANGUAGE_NOT_FOUND.replace("{}", match[1]));
              warn("Falling back to no-highlight mode for this block.", block);
            }
            return language ? match[1] : "no-highlight";
          }
          return classes.split(/\s+/).find((_class) => shouldNotHighlight(_class) || getLanguage(_class));
        }
        function highlight2(codeOrLanguageName, optionsOrCode, ignoreIllegals) {
          let code = "";
          let languageName = "";
          if (typeof optionsOrCode === "object") {
            code = codeOrLanguageName;
            ignoreIllegals = optionsOrCode.ignoreIllegals;
            languageName = optionsOrCode.language;
          } else {
            deprecated("10.7.0", "highlight(lang, code, ...args) has been deprecated.");
            deprecated("10.7.0", "Please use highlight(code, options) instead.\nhttps://github.com/highlightjs/highlight.js/issues/2277");
            languageName = codeOrLanguageName;
            code = optionsOrCode;
          }
          if (ignoreIllegals === void 0) {
            ignoreIllegals = true;
          }
          const context = {
            code,
            language: languageName
          };
          fire("before:highlight", context);
          const result = context.result ? context.result : _highlight(context.language, context.code, ignoreIllegals);
          result.code = context.code;
          fire("after:highlight", result);
          return result;
        }
        function _highlight(languageName, codeToHighlight, ignoreIllegals, continuation) {
          const keywordHits = /* @__PURE__ */ Object.create(null);
          function keywordData(mode, matchText) {
            return mode.keywords[matchText];
          }
          function processKeywords() {
            if (!top.keywords) {
              emitter.addText(modeBuffer);
              return;
            }
            let lastIndex = 0;
            top.keywordPatternRe.lastIndex = 0;
            let match = top.keywordPatternRe.exec(modeBuffer);
            let buf = "";
            while (match) {
              buf += modeBuffer.substring(lastIndex, match.index);
              const word = language.case_insensitive ? match[0].toLowerCase() : match[0];
              const data = keywordData(top, word);
              if (data) {
                const [kind, keywordRelevance] = data;
                emitter.addText(buf);
                buf = "";
                keywordHits[word] = (keywordHits[word] || 0) + 1;
                if (keywordHits[word] <= MAX_KEYWORD_HITS) relevance += keywordRelevance;
                if (kind.startsWith("_")) {
                  buf += match[0];
                } else {
                  const cssClass = language.classNameAliases[kind] || kind;
                  emitKeyword(match[0], cssClass);
                }
              } else {
                buf += match[0];
              }
              lastIndex = top.keywordPatternRe.lastIndex;
              match = top.keywordPatternRe.exec(modeBuffer);
            }
            buf += modeBuffer.substring(lastIndex);
            emitter.addText(buf);
          }
          function processSubLanguage() {
            if (modeBuffer === "") return;
            let result2 = null;
            if (typeof top.subLanguage === "string") {
              if (!languages[top.subLanguage]) {
                emitter.addText(modeBuffer);
                return;
              }
              result2 = _highlight(top.subLanguage, modeBuffer, true, continuations[top.subLanguage]);
              continuations[top.subLanguage] = /** @type {CompiledMode} */
              result2._top;
            } else {
              result2 = highlightAuto(modeBuffer, top.subLanguage.length ? top.subLanguage : null);
            }
            if (top.relevance > 0) {
              relevance += result2.relevance;
            }
            emitter.__addSublanguage(result2._emitter, result2.language);
          }
          function processBuffer() {
            if (top.subLanguage != null) {
              processSubLanguage();
            } else {
              processKeywords();
            }
            modeBuffer = "";
          }
          function emitKeyword(keyword, scope) {
            if (keyword === "") return;
            emitter.startScope(scope);
            emitter.addText(keyword);
            emitter.endScope();
          }
          function emitMultiClass(scope, match) {
            let i = 1;
            const max = match.length - 1;
            while (i <= max) {
              if (!scope._emit[i]) {
                i++;
                continue;
              }
              const klass = language.classNameAliases[scope[i]] || scope[i];
              const text = match[i];
              if (klass) {
                emitKeyword(text, klass);
              } else {
                modeBuffer = text;
                processKeywords();
                modeBuffer = "";
              }
              i++;
            }
          }
          function startNewMode(mode, match) {
            if (mode.scope && typeof mode.scope === "string") {
              emitter.openNode(language.classNameAliases[mode.scope] || mode.scope);
            }
            if (mode.beginScope) {
              if (mode.beginScope._wrap) {
                emitKeyword(modeBuffer, language.classNameAliases[mode.beginScope._wrap] || mode.beginScope._wrap);
                modeBuffer = "";
              } else if (mode.beginScope._multi) {
                emitMultiClass(mode.beginScope, match);
                modeBuffer = "";
              }
            }
            top = Object.create(mode, { parent: { value: top } });
            return top;
          }
          function endOfMode(mode, match, matchPlusRemainder) {
            let matched = startsWith(mode.endRe, matchPlusRemainder);
            if (matched) {
              if (mode["on:end"]) {
                const resp = new Response(mode);
                mode["on:end"](match, resp);
                if (resp.isMatchIgnored) matched = false;
              }
              if (matched) {
                while (mode.endsParent && mode.parent) {
                  mode = mode.parent;
                }
                return mode;
              }
            }
            if (mode.endsWithParent) {
              return endOfMode(mode.parent, match, matchPlusRemainder);
            }
          }
          function doIgnore(lexeme) {
            if (top.matcher.regexIndex === 0) {
              modeBuffer += lexeme[0];
              return 1;
            } else {
              resumeScanAtSamePosition = true;
              return 0;
            }
          }
          function doBeginMatch(match) {
            const lexeme = match[0];
            const newMode = match.rule;
            const resp = new Response(newMode);
            const beforeCallbacks = [newMode.__beforeBegin, newMode["on:begin"]];
            for (const cb of beforeCallbacks) {
              if (!cb) continue;
              cb(match, resp);
              if (resp.isMatchIgnored) return doIgnore(lexeme);
            }
            if (newMode.skip) {
              modeBuffer += lexeme;
            } else {
              if (newMode.excludeBegin) {
                modeBuffer += lexeme;
              }
              processBuffer();
              if (!newMode.returnBegin && !newMode.excludeBegin) {
                modeBuffer = lexeme;
              }
            }
            startNewMode(newMode, match);
            return newMode.returnBegin ? 0 : lexeme.length;
          }
          function doEndMatch(match) {
            const lexeme = match[0];
            const matchPlusRemainder = codeToHighlight.substring(match.index);
            const endMode = endOfMode(top, match, matchPlusRemainder);
            if (!endMode) {
              return NO_MATCH;
            }
            const origin = top;
            if (top.endScope && top.endScope._wrap) {
              processBuffer();
              emitKeyword(lexeme, top.endScope._wrap);
            } else if (top.endScope && top.endScope._multi) {
              processBuffer();
              emitMultiClass(top.endScope, match);
            } else if (origin.skip) {
              modeBuffer += lexeme;
            } else {
              if (!(origin.returnEnd || origin.excludeEnd)) {
                modeBuffer += lexeme;
              }
              processBuffer();
              if (origin.excludeEnd) {
                modeBuffer = lexeme;
              }
            }
            do {
              if (top.scope) {
                emitter.closeNode();
              }
              if (!top.skip && !top.subLanguage) {
                relevance += top.relevance;
              }
              top = top.parent;
            } while (top !== endMode.parent);
            if (endMode.starts) {
              startNewMode(endMode.starts, match);
            }
            return origin.returnEnd ? 0 : lexeme.length;
          }
          function processContinuations() {
            const list = [];
            for (let current = top; current !== language; current = current.parent) {
              if (current.scope) {
                list.unshift(current.scope);
              }
            }
            list.forEach((item) => emitter.openNode(item));
          }
          let lastMatch = {};
          function processLexeme(textBeforeMatch, match) {
            const lexeme = match && match[0];
            modeBuffer += textBeforeMatch;
            if (lexeme == null) {
              processBuffer();
              return 0;
            }
            if (lastMatch.type === "begin" && match.type === "end" && lastMatch.index === match.index && lexeme === "") {
              modeBuffer += codeToHighlight.slice(match.index, match.index + 1);
              if (!SAFE_MODE) {
                const err = new Error(`0 width match regex (${languageName})`);
                err.languageName = languageName;
                err.badRule = lastMatch.rule;
                throw err;
              }
              return 1;
            }
            lastMatch = match;
            if (match.type === "begin") {
              return doBeginMatch(match);
            } else if (match.type === "illegal" && !ignoreIllegals) {
              const err = new Error('Illegal lexeme "' + lexeme + '" for mode "' + (top.scope || "<unnamed>") + '"');
              err.mode = top;
              throw err;
            } else if (match.type === "end") {
              const processed = doEndMatch(match);
              if (processed !== NO_MATCH) {
                return processed;
              }
            }
            if (match.type === "illegal" && lexeme === "") {
              modeBuffer += "\n";
              return 1;
            }
            if (iterations > 1e5 && iterations > match.index * 3) {
              const err = new Error("potential infinite loop, way more iterations than matches");
              throw err;
            }
            modeBuffer += lexeme;
            return lexeme.length;
          }
          const language = getLanguage(languageName);
          if (!language) {
            error(LANGUAGE_NOT_FOUND.replace("{}", languageName));
            throw new Error('Unknown language: "' + languageName + '"');
          }
          const md = compileLanguage(language);
          let result = "";
          let top = continuation || md;
          const continuations = {};
          const emitter = new options.__emitter(options);
          processContinuations();
          let modeBuffer = "";
          let relevance = 0;
          let index = 0;
          let iterations = 0;
          let resumeScanAtSamePosition = false;
          try {
            if (!language.__emitTokens) {
              top.matcher.considerAll();
              for (; ; ) {
                iterations++;
                if (resumeScanAtSamePosition) {
                  resumeScanAtSamePosition = false;
                } else {
                  top.matcher.considerAll();
                }
                top.matcher.lastIndex = index;
                const match = top.matcher.exec(codeToHighlight);
                if (!match) break;
                const beforeMatch = codeToHighlight.substring(index, match.index);
                const processedCount = processLexeme(beforeMatch, match);
                index = match.index + processedCount;
              }
              processLexeme(codeToHighlight.substring(index));
            } else {
              language.__emitTokens(codeToHighlight, emitter);
            }
            emitter.finalize();
            result = emitter.toHTML();
            return {
              language: languageName,
              value: result,
              relevance,
              illegal: false,
              _emitter: emitter,
              _top: top
            };
          } catch (err) {
            if (err.message && err.message.includes("Illegal")) {
              return {
                language: languageName,
                value: escape(codeToHighlight),
                illegal: true,
                relevance: 0,
                _illegalBy: {
                  message: err.message,
                  index,
                  context: codeToHighlight.slice(index - 100, index + 100),
                  mode: err.mode,
                  resultSoFar: result
                },
                _emitter: emitter
              };
            } else if (SAFE_MODE) {
              return {
                language: languageName,
                value: escape(codeToHighlight),
                illegal: false,
                relevance: 0,
                errorRaised: err,
                _emitter: emitter,
                _top: top
              };
            } else {
              throw err;
            }
          }
        }
        function justTextHighlightResult(code) {
          const result = {
            value: escape(code),
            illegal: false,
            relevance: 0,
            _top: PLAINTEXT_LANGUAGE,
            _emitter: new options.__emitter(options)
          };
          result._emitter.addText(code);
          return result;
        }
        function highlightAuto(code, languageSubset) {
          languageSubset = languageSubset || options.languages || Object.keys(languages);
          const plaintext = justTextHighlightResult(code);
          const results = languageSubset.filter(getLanguage).filter(autoDetection).map(
            (name) => _highlight(name, code, false)
          );
          results.unshift(plaintext);
          const sorted = results.sort((a, b) => {
            if (a.relevance !== b.relevance) return b.relevance - a.relevance;
            if (a.language && b.language) {
              if (getLanguage(a.language).supersetOf === b.language) {
                return 1;
              } else if (getLanguage(b.language).supersetOf === a.language) {
                return -1;
              }
            }
            return 0;
          });
          const [best, secondBest] = sorted;
          const result = best;
          result.secondBest = secondBest;
          return result;
        }
        function updateClassName(element, currentLang, resultLang) {
          const language = currentLang && aliases[currentLang] || resultLang;
          element.classList.add("hljs");
          element.classList.add(`language-${language}`);
        }
        function highlightElement(element) {
          let node = null;
          const language = blockLanguage(element);
          if (shouldNotHighlight(language)) return;
          fire(
            "before:highlightElement",
            { el: element, language }
          );
          if (element.dataset.highlighted) {
            console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.", element);
            return;
          }
          if (element.children.length > 0) {
            if (!options.ignoreUnescapedHTML) {
              console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk.");
              console.warn("https://github.com/highlightjs/highlight.js/wiki/security");
              console.warn("The element with unescaped HTML:");
              console.warn(element);
            }
            if (options.throwUnescapedHTML) {
              const err = new HTMLInjectionError(
                "One of your code blocks includes unescaped HTML.",
                element.innerHTML
              );
              throw err;
            }
          }
          node = element;
          const text = node.textContent;
          const result = language ? highlight2(text, { language, ignoreIllegals: true }) : highlightAuto(text);
          element.innerHTML = result.value;
          element.dataset.highlighted = "yes";
          updateClassName(element, language, result.language);
          element.result = {
            language: result.language,
            // TODO: remove with version 11.0
            re: result.relevance,
            relevance: result.relevance
          };
          if (result.secondBest) {
            element.secondBest = {
              language: result.secondBest.language,
              relevance: result.secondBest.relevance
            };
          }
          fire("after:highlightElement", { el: element, result, text });
        }
        function configure(userOptions) {
          options = inherit(options, userOptions);
        }
        const initHighlighting = () => {
          highlightAll();
          deprecated("10.6.0", "initHighlighting() deprecated.  Use highlightAll() now.");
        };
        function initHighlightingOnLoad() {
          highlightAll();
          deprecated("10.6.0", "initHighlightingOnLoad() deprecated.  Use highlightAll() now.");
        }
        let wantsHighlight = false;
        function highlightAll() {
          function boot2() {
            highlightAll();
          }
          if (document.readyState === "loading") {
            if (!wantsHighlight) {
              window.addEventListener("DOMContentLoaded", boot2, false);
            }
            wantsHighlight = true;
            return;
          }
          const blocks = document.querySelectorAll(options.cssSelector);
          blocks.forEach(highlightElement);
        }
        function registerLanguage(languageName, languageDefinition) {
          let lang = null;
          try {
            lang = languageDefinition(hljs);
          } catch (error$1) {
            error("Language definition for '{}' could not be registered.".replace("{}", languageName));
            if (!SAFE_MODE) {
              throw error$1;
            } else {
              error(error$1);
            }
            lang = PLAINTEXT_LANGUAGE;
          }
          if (!lang.name) lang.name = languageName;
          languages[languageName] = lang;
          lang.rawDefinition = languageDefinition.bind(null, hljs);
          if (lang.aliases) {
            registerAliases(lang.aliases, { languageName });
          }
        }
        function unregisterLanguage(languageName) {
          delete languages[languageName];
          for (const alias of Object.keys(aliases)) {
            if (aliases[alias] === languageName) {
              delete aliases[alias];
            }
          }
        }
        function listLanguages() {
          return Object.keys(languages);
        }
        function getLanguage(name) {
          name = (name || "").toLowerCase();
          return languages[name] || languages[aliases[name]];
        }
        function registerAliases(aliasList, { languageName }) {
          if (typeof aliasList === "string") {
            aliasList = [aliasList];
          }
          aliasList.forEach((alias) => {
            aliases[alias.toLowerCase()] = languageName;
          });
        }
        function autoDetection(name) {
          const lang = getLanguage(name);
          return lang && !lang.disableAutodetect;
        }
        function upgradePluginAPI(plugin) {
          if (plugin["before:highlightBlock"] && !plugin["before:highlightElement"]) {
            plugin["before:highlightElement"] = (data) => {
              plugin["before:highlightBlock"](
                Object.assign({ block: data.el }, data)
              );
            };
          }
          if (plugin["after:highlightBlock"] && !plugin["after:highlightElement"]) {
            plugin["after:highlightElement"] = (data) => {
              plugin["after:highlightBlock"](
                Object.assign({ block: data.el }, data)
              );
            };
          }
        }
        function addPlugin(plugin) {
          upgradePluginAPI(plugin);
          plugins.push(plugin);
        }
        function removePlugin(plugin) {
          const index = plugins.indexOf(plugin);
          if (index !== -1) {
            plugins.splice(index, 1);
          }
        }
        function fire(event, args) {
          const cb = event;
          plugins.forEach(function(plugin) {
            if (plugin[cb]) {
              plugin[cb](args);
            }
          });
        }
        function deprecateHighlightBlock(el) {
          deprecated("10.7.0", "highlightBlock will be removed entirely in v12.0");
          deprecated("10.7.0", "Please use highlightElement now.");
          return highlightElement(el);
        }
        Object.assign(hljs, {
          highlight: highlight2,
          highlightAuto,
          highlightAll,
          highlightElement,
          // TODO: Remove with v12 API
          highlightBlock: deprecateHighlightBlock,
          configure,
          initHighlighting,
          initHighlightingOnLoad,
          registerLanguage,
          unregisterLanguage,
          listLanguages,
          getLanguage,
          registerAliases,
          autoDetection,
          inherit,
          addPlugin,
          removePlugin
        });
        hljs.debugMode = function() {
          SAFE_MODE = false;
        };
        hljs.safeMode = function() {
          SAFE_MODE = true;
        };
        hljs.versionString = version;
        hljs.regex = {
          concat,
          lookahead,
          either,
          optional,
          anyNumberOfTimes
        };
        for (const key in MODES) {
          if (typeof MODES[key] === "object") {
            deepFreeze(MODES[key]);
          }
        }
        Object.assign(hljs, MODES);
        return hljs;
      };
      var highlight = HLJS({});
      highlight.newInstance = () => HLJS({});
      module.exports = highlight;
      highlight.HighlightJS = highlight;
      highlight.default = highlight;
    }
  });

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
    "query.capabilities",
    "cfg.functions",
    "cfg.load",
    "source.slice",
    "source.validation",
    "navigate.to",
    "explain.node",
    "explain.function",
    "calls.load",
    "calls.outgoing",
    "calls.incoming",
    "calls.expand",
    "calls.collapse",
    "calls.filter",
    "calls.focus",
    "index.status",
    "zoom.open",
    "zoom.descend",
    "zoom.breadcrumb",
    "zoom.expand",
    "zoom.search",
    "zoom.filter",
    "zoom.focus",
    "dfg.load",
    "dfg.trace",
    "dfg.slice"
  ]);
  var HOST_TO_WEBVIEW = Object.freeze([
    "graph.data",
    "capabilities.data",
    "csr.data",
    "query.data",
    "analysis.progress",
    "protocol.error",
    "protocol.ack",
    "panel.pong",
    "cfg.functions",
    "cfg.data",
    "source.data",
    "source.integrity",
    "source.stale",
    "navigate.done",
    "selection.changed",
    "graph.focus",
    "settings.data",
    "explain.data",
    "calls.data",
    "calls.neighbors",
    "index.data",
    "zoom.data",
    "zoom.members",
    "zoom.results",
    "dfg.data",
    "dfg.overlay",
    "dfg.error"
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

  // src/core/graph/layout.js
  var LAYOUT_DEFAULTS = Object.freeze({
    nodeWidth: 190,
    nodeHeight: 54,
    horizontalGap: 90,
    verticalGap: 26,
    maxLayers: 40
  });

  // src/core/graph/cfg/kinds.js
  var CFG_NODE_KINDS = Object.freeze([
    "entry",
    "exit",
    "statement",
    "condition",
    "multiway",
    "merge",
    "loop_header",
    "loop_latch",
    "loop_body_entry",
    "break",
    "continue",
    "return",
    "throw",
    "call",
    "await",
    "catch_entry",
    "finally_entry",
    "unreachable",
    "unmodeled"
  ]);
  var CFG_EDGE_KINDS = Object.freeze([
    "seq",
    "true",
    "false",
    "case",
    "default",
    "loop_back",
    "break",
    "continue",
    "return",
    "throw",
    "exception",
    "finally",
    "unreachable"
  ]);
  var CFG_STATUSES = Object.freeze([
    "resolved",
    "inferred",
    "possible",
    "unresolved",
    "stale"
  ]);
  var CFG_DEGRADATION_CODES = Object.freeze([
    "unmodeled_construct",
    "goto_flow",
    "indirect_goto_flow",
    "iteration_source_opaque",
    "call_site_unrecorded",
    "condition_shape_unmodeled",
    "orphan_jump",
    "modeled_exception_path",
    "analysis_partial",
    "truncated"
  ]);
  var ABRUPT_EDGE_KINDS = Object.freeze(["break", "continue", "return", "throw"]);
  var BACK_EDGE_KINDS = Object.freeze(["loop_back", "continue"]);

  // src/core/graph/calls/kinds.js
  var CALL_SCOPES = Object.freeze(["complete", "partial", "same_file_only"]);
  var CALL_SCOPE_REASONS = Object.freeze([
    "no_index",
    "index_partial",
    "index_stale",
    "analysis_partial",
    "same_file_adapter",
    "stale_cursor_reset"
  ]);
  var CALL_RELATIONSHIP_TYPES = Object.freeze([
    "calls",
    "instantiates",
    "overrides",
    "references"
  ]);
  var CALL_STATUSES = Object.freeze([
    "resolved",
    "inferred",
    "possible",
    "unresolved",
    "stale"
  ]);
  var CALL_NODE_KINDS = Object.freeze([
    "function",
    "method",
    "constructor",
    "destructor",
    "lambda",
    "closure",
    "class",
    "struct",
    "interface",
    "module",
    "file",
    "variable",
    "parameter",
    "field",
    "property",
    "unresolved_bucket",
    "candidate_bucket",
    "unknown"
  ]);
  var CALL_LIMITS = Object.freeze({
    defaultPageSize: 100,
    maxPageSize: 200,
    defaultDepth: 3,
    maxDepth: 6,
    maxNodes: 500,
    candidateBucketThreshold: 5
  });
  var STATUS_STRENGTH = Object.freeze({
    resolved: 4,
    inferred: 3,
    possible: 2,
    unresolved: 1
  });

  // src/core/graph/zoom/levels.js
  var ZOOM_LEVELS = Object.freeze({
    L0_WORKSPACE: "workspace",
    L1_MODULE: "module",
    L2_FILE: "file",
    L3_SYMBOL: "symbol",
    L4_FUNCTION: "function",
    L5_STATEMENT: "statement"
  });
  var LEVEL_ORDER = Object.freeze([
    ZOOM_LEVELS.L0_WORKSPACE,
    ZOOM_LEVELS.L1_MODULE,
    ZOOM_LEVELS.L2_FILE,
    ZOOM_LEVELS.L3_SYMBOL,
    ZOOM_LEVELS.L4_FUNCTION,
    ZOOM_LEVELS.L5_STATEMENT
  ]);
  var LEVEL_CAPS = Object.freeze({
    [ZOOM_LEVELS.L0_WORKSPACE]: 60,
    [ZOOM_LEVELS.L1_MODULE]: 120,
    [ZOOM_LEVELS.L2_FILE]: 120,
    [ZOOM_LEVELS.L3_SYMBOL]: 150,
    [ZOOM_LEVELS.L4_FUNCTION]: 150,
    [ZOOM_LEVELS.L5_STATEMENT]: 100
  });
  var LEVEL_LABELS = Object.freeze({
    [ZOOM_LEVELS.L0_WORKSPACE]: "L0 Workspace",
    [ZOOM_LEVELS.L1_MODULE]: "L1 Module",
    [ZOOM_LEVELS.L2_FILE]: "L2 File",
    [ZOOM_LEVELS.L3_SYMBOL]: "L3 Symbol",
    [ZOOM_LEVELS.L4_FUNCTION]: "L4 Function",
    [ZOOM_LEVELS.L5_STATEMENT]: "L5 Statement"
  });
  var OVERLAY_SLOTS = Object.freeze({
    DFG: "dfg"
  });

  // src/core/graph/dto.js
  var GRAPH_DTO_VERSION = 1;
  function validateDto(dto) {
    const issues = [];
    if (typeof dto !== "object" || dto === null || Array.isArray(dto)) {
      return { ok: false, issues: ["DTO must be an object."] };
    }
    const candidate = (
      /** @type {Record<string, unknown>} */
      dto
    );
    if (candidate.dtoVersion !== GRAPH_DTO_VERSION) {
      issues.push(`Unsupported dtoVersion: ${String(candidate.dtoVersion)}.`);
    }
    if (candidate.dtoKind === "cfg") {
      validateCfgDto(candidate, issues);
      return issues.length > 0 ? { ok: false, issues } : { ok: true, dto: (
        /** @type {GraphDto} */
        dto
      ) };
    }
    if (candidate.dtoKind === "call_graph") {
      validateCallGraphDto(candidate, issues);
      return issues.length > 0 ? { ok: false, issues } : { ok: true, dto: (
        /** @type {GraphDto} */
        dto
      ) };
    }
    if (candidate.dtoKind === "semantic_zoom") {
      validateSemanticZoomDto(candidate, issues);
      return issues.length > 0 ? { ok: false, issues } : { ok: true, dto: (
        /** @type {GraphDto} */
        dto
      ) };
    }
    const nodes = candidate.nodes;
    const edges = candidate.edges;
    if (!Array.isArray(nodes)) {
      issues.push("nodes must be an array.");
    }
    if (!Array.isArray(edges)) {
      issues.push("edges must be an array.");
    }
    if (Array.isArray(nodes) && Array.isArray(edges)) {
      const ids = /* @__PURE__ */ new Set();
      for (const node of nodes) {
        const id = (
          /** @type {Record<string, unknown>} */
          node.id
        );
        if (typeof id !== "string") {
          issues.push("Every node needs a string id.");
          continue;
        }
        if (ids.has(id)) {
          issues.push(`Duplicate node id "${id}".`);
        }
        ids.add(id);
      }
      for (const edge of edges) {
        const record = (
          /** @type {Record<string, unknown>} */
          edge
        );
        if (typeof record.from !== "string" || !ids.has(record.from)) {
          issues.push(`Edge "${String(record.id)}" has an unknown source node.`);
        }
        if (typeof record.to !== "string" || !ids.has(record.to)) {
          issues.push(`Edge "${String(record.id)}" has an unknown target node.`);
        }
      }
    }
    if (issues.length > 0) {
      return { ok: false, issues };
    }
    return { ok: true, dto: (
      /** @type {GraphDto} */
      dto
    ) };
  }
  function validateCfgDto(candidate, issues) {
    if (candidate.graphKind !== "cfg") {
      issues.push('A CFG DTO must declare graphKind "cfg".');
    }
    const fn = candidate.function;
    if (typeof fn !== "object" || fn === null || Array.isArray(fn)) {
      issues.push("function must be an object.");
    } else {
      const record = (
        /** @type {Record<string, unknown>} */
        fn
      );
      for (const key of ["symbolId", "name", "qualifiedName", "kind"]) {
        if (typeof record[key] !== "string") {
          issues.push(`function.${key} must be a string.`);
        }
      }
      if (record.range !== null && !isRangeRef(record.range)) {
        issues.push("function.range must be a range reference or null.");
      }
    }
    const nodes = candidate.nodes;
    const edges = candidate.edges;
    if (!Array.isArray(nodes)) {
      issues.push("nodes must be an array.");
      return;
    }
    if (!Array.isArray(edges)) {
      issues.push("edges must be an array.");
      return;
    }
    const ids = /* @__PURE__ */ new Set();
    const entryIds = [];
    const exitIds = [];
    for (const entry of nodes) {
      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
        issues.push("Every node must be an object.");
        continue;
      }
      const node = (
        /** @type {Record<string, unknown>} */
        entry
      );
      const id = node.id;
      if (typeof id !== "string") {
        issues.push("Every node needs a string id.");
        continue;
      }
      if (ids.has(id)) {
        issues.push(`Duplicate node id "${id}".`);
      }
      ids.add(id);
      if (!CFG_NODE_KINDS.includes(String(node.kind))) {
        issues.push(`Node "${id}" has unknown kind "${String(node.kind)}".`);
      }
      if (!CFG_STATUSES.includes(String(node.status))) {
        issues.push(`Node "${id}" has unknown status "${String(node.status)}".`);
      }
      if (typeof node.label !== "string") {
        issues.push(`Node "${id}" needs a string label.`);
      }
      if (!Array.isArray(node.labelLines) || node.labelLines.some((line) => typeof line !== "string")) {
        issues.push(`Node "${id}" needs string labelLines.`);
      }
      if (node.range !== null && !isRangeRef(node.range)) {
        issues.push(`Node "${id}" has an invalid range reference.`);
      }
      if (!isPosition(node.position)) {
        issues.push(`Node "${id}" has an invalid position.`);
      }
      if (node.kind === "entry") {
        entryIds.push(id);
      }
      if (node.kind === "exit") {
        exitIds.push(id);
      }
      if (node.calls !== void 0) {
        if (!Array.isArray(node.calls)) {
          issues.push(`Node "${id}" calls must be an array when present.`);
        } else {
          for (const call of node.calls) {
            if (typeof call !== "object" || call === null || typeof call.to !== "string" || typeof call.label !== "string" || !CFG_STATUSES.includes(String(call.status))) {
              issues.push(`Node "${id}" has an invalid call target.`);
            }
          }
        }
      }
    }
    if (entryIds.length !== 1) {
      issues.push(`A CFG needs exactly one entry node; found ${entryIds.length}.`);
    }
    if (exitIds.length !== 1) {
      issues.push(`A CFG needs exactly one exit node; found ${exitIds.length}.`);
    }
    if (candidate.entryId !== entryIds[0]) {
      issues.push("entryId must reference the entry node.");
    }
    if (candidate.exitId !== exitIds[0]) {
      issues.push("exitId must reference the exit node.");
    }
    const edgeIds = /* @__PURE__ */ new Set();
    for (const entry of edges) {
      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
        issues.push("Every edge must be an object.");
        continue;
      }
      const edge = (
        /** @type {Record<string, unknown>} */
        entry
      );
      const id = edge.id;
      if (typeof id !== "string") {
        issues.push("Every edge needs a string id.");
        continue;
      }
      if (edgeIds.has(id)) {
        issues.push(`Duplicate edge id "${id}".`);
      }
      edgeIds.add(id);
      if (typeof edge.from !== "string" || !ids.has(edge.from)) {
        issues.push(`Edge "${id}" has an unknown source node.`);
      }
      if (typeof edge.to !== "string" || !ids.has(edge.to)) {
        issues.push(`Edge "${id}" has an unknown target node.`);
      }
      if (!CFG_EDGE_KINDS.includes(String(edge.kind))) {
        issues.push(`Edge "${id}" has unknown kind "${String(edge.kind)}".`);
      }
      if (!CFG_STATUSES.includes(String(edge.status))) {
        issues.push(`Edge "${id}" has unknown status "${String(edge.status)}".`);
      }
      if (typeof edge.label !== "string") {
        issues.push(`Edge "${id}" needs a string label.`);
      }
      if (typeof edge.dash !== "string" || typeof edge.glyphHint !== "string") {
        issues.push(`Edge "${id}" needs string dash and glyphHint fields.`);
      }
    }
    const degradations = candidate.degradations;
    if (!Array.isArray(degradations)) {
      issues.push("degradations must be an array.");
    } else {
      for (const entry of degradations) {
        if (typeof entry !== "object" || entry === null || typeof entry.code !== "string" || typeof entry.message !== "string" || !["info", "warning", "error"].includes(String(entry.severity))) {
          issues.push("Every degradation needs a code, message and severity.");
        }
      }
    }
    const extent = candidate.extent;
    if (typeof extent !== "object" || extent === null || !Number.isFinite(extent.width) || !Number.isFinite(extent.height)) {
      issues.push("extent must carry finite width and height.");
    }
  }
  function validateCallGraphDto(candidate, issues) {
    if (candidate.graphKind !== "call_graph") {
      issues.push('A Call Graph DTO must declare graphKind "call_graph".');
    }
    if (typeof candidate.centerSymbolId !== "string" || candidate.centerSymbolId.length === 0) {
      issues.push("centerSymbolId must be a non-empty string.");
    }
    if (!CALL_SCOPES.includes(String(candidate.scope))) {
      issues.push(`scope must be one of ${CALL_SCOPES.join(", ")}.`);
    }
    if (typeof candidate.scopeBanner !== "string" || candidate.scopeBanner.length === 0) {
      issues.push("scopeBanner must be a non-empty string.");
    }
    const nodes = candidate.nodes;
    const edges = candidate.edges;
    if (!Array.isArray(nodes)) {
      issues.push("nodes must be an array.");
      return;
    }
    if (!Array.isArray(edges)) {
      issues.push("edges must be an array.");
      return;
    }
    const ids = /* @__PURE__ */ new Set();
    for (const entry of nodes) {
      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
        issues.push("Every node must be an object.");
        continue;
      }
      const node = (
        /** @type {Record<string, unknown>} */
        entry
      );
      const id = node.id;
      if (typeof id !== "string") {
        issues.push("Every node needs a string id.");
        continue;
      }
      if (ids.has(id)) {
        issues.push(`Duplicate node id "${id}".`);
      }
      ids.add(id);
      if (!CALL_NODE_KINDS.includes(String(node.kind))) {
        issues.push(`Node "${id}" has unknown call-graph kind "${String(node.kind)}".`);
      }
      if (!CFG_STATUSES.includes(String(node.status))) {
        issues.push(`Node "${id}" has unknown status "${String(node.status)}".`);
      }
      if (!isPosition(node.position)) {
        issues.push(`Node "${id}" has an invalid position.`);
      }
    }
    const edgeIds = /* @__PURE__ */ new Set();
    for (const entry of edges) {
      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
        issues.push("Every edge must be an object.");
        continue;
      }
      const edge = (
        /** @type {Record<string, unknown>} */
        entry
      );
      const id = edge.id;
      if (typeof id !== "string") {
        issues.push("Every edge needs a string id.");
        continue;
      }
      if (edgeIds.has(id)) {
        issues.push(`Duplicate edge id "${id}".`);
      }
      edgeIds.add(id);
      if (typeof edge.from !== "string" || !ids.has(edge.from)) {
        issues.push(`Edge "${id}" has an unknown source node.`);
      }
      if (typeof edge.to !== "string" || !ids.has(edge.to)) {
        issues.push(`Edge "${id}" has an unknown target node.`);
      }
      if (!CALL_RELATIONSHIP_TYPES.includes(String(edge.type))) {
        issues.push(`Edge "${id}" has unknown type "${String(edge.type)}".`);
      }
      if (!CFG_STATUSES.includes(String(edge.status))) {
        issues.push(`Edge "${id}" has unknown status "${String(edge.status)}".`);
      }
      if (typeof edge.dash !== "string" || typeof edge.glyphHint !== "string") {
        issues.push(`Edge "${id}" needs string dash and glyphHint fields.`);
      }
    }
  }
  function isRangeRef(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return false;
    }
    const range = (
      /** @type {Record<string, unknown>} */
      value
    );
    return typeof range.fileId === "string" && Number.isInteger(range.startLine) && Number.isInteger(range.startColumn) && Number.isInteger(range.endLine) && Number.isInteger(range.endColumn) && range.startLine >= 0 && range.startColumn >= 0 && range.endLine >= 0 && range.endColumn >= 0;
  }
  function validateSemanticZoomDto(candidate, issues) {
    if (typeof candidate.level !== "string" || !LEVEL_ORDER.includes(candidate.level)) {
      issues.push(`Invalid semantic zoom level: ${String(candidate.level)}.`);
    }
    if (typeof candidate.scopeId !== "string" || candidate.scopeId.length === 0) {
      issues.push("Semantic zoom DTO requires a non-empty scopeId.");
    }
    if (!Array.isArray(candidate.breadcrumbs) || candidate.breadcrumbs.length === 0) {
      issues.push("Semantic zoom DTO requires a non-empty breadcrumbs array.");
    }
    if (!Array.isArray(candidate.nodes)) {
      issues.push("Semantic zoom DTO requires a nodes array.");
    }
    if (!Array.isArray(candidate.edges)) {
      issues.push("Semantic zoom DTO requires an edges array.");
    }
  }
  function isPosition(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return false;
    }
    const position = (
      /** @type {Record<string, unknown>} */
      value
    );
    return Number.isFinite(position.x) && Number.isFinite(position.y) && Number.isFinite(position.width) && Number.isFinite(position.height) && Number.isInteger(position.layer);
  }

  // src/visualization/renderer/svgRenderer.js
  var SVG_NS = "http://www.w3.org/2000/svg";
  function svgEl(name, attributes = {}) {
    const element = document.createElementNS(SVG_NS, name);
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, String(value));
    }
    return element;
  }
  function truncate(value, max) {
    const text = String(value ?? "");
    return text.length > max ? `${text.slice(0, max - 1)}\u2026` : text;
  }
  function createSvgRenderer(options) {
    const { svg: svg2, onSelect } = options;
    let dto = null;
    let viewport = null;
    const nodeElements = /* @__PURE__ */ new Map();
    const edgeElements = /* @__PURE__ */ new Map();
    let selectedId = null;
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let dragging = false;
    let dragStart = { x: 0, y: 0, tx: 0, ty: 0 };
    function applyTransform() {
      if (viewport) {
        viewport.setAttribute(
          "transform",
          `translate(${translateX.toFixed(2)} ${translateY.toFixed(2)}) scale(${scale.toFixed(3)})`
        );
      }
    }
    function nodePoint(node, side) {
      if (side === "out") {
        return {
          x: node.position.x + node.position.width,
          y: node.position.y + node.position.height / 2
        };
      }
      return { x: node.position.x, y: node.position.y + node.position.height / 2 };
    }
    function edgePath(source, target) {
      if (source.id === target.id) {
        const { x, y, width, height } = source.position;
        const cx = x + width / 2;
        const startY = y - 2;
        return `M ${cx} ${startY} C ${cx - 46} ${y - 60}, ${cx + 46} ${y - 60}, ${cx} ${y + height + 2}`;
      }
      const from = nodePoint(source, "out");
      const to = nodePoint(target, "in");
      const bend = Math.max(36, Math.abs(to.x - from.x) / 2);
      return `M ${from.x} ${from.y} C ${from.x + bend} ${from.y}, ${to.x - bend} ${to.y}, ${to.x} ${to.y}`;
    }
    function clear() {
      if (viewport) {
        svg2.removeChild(viewport);
      }
      viewport = svgEl("g", { class: "cf-viewport" });
      svg2.appendChild(viewport);
      nodeElements.clear();
      edgeElements.clear();
      selectedId = null;
    }
    function select(nodeId) {
      selectedId = nodeId;
      for (const [id, element] of nodeElements) {
        element.classList.toggle("is-selected", id === nodeId);
      }
      for (const [, element] of edgeElements) {
        const active = nodeId !== null && (element.dataset.from === nodeId || element.dataset.to === nodeId);
        element.classList.toggle("is-active", active);
      }
      if (selectedId && nodeElements.has(selectedId)) {
        const node = (
          /** @type {DtoNode} */
          dto?.nodes.find((item) => item.id === selectedId)
        );
        onSelect(selectedId, node);
      }
    }
    function zoomToFit() {
      if (!dto || !viewport) {
        return;
      }
      const bounds = svg2.getBoundingClientRect();
      const padding = 48;
      const width = Math.max(1, dto.extent.width);
      const height = Math.max(1, dto.extent.height);
      const availableWidth = Math.max(120, bounds.width - padding * 2);
      const availableHeight = Math.max(120, bounds.height - padding * 2);
      scale = Math.min(1.4, availableWidth / width, availableHeight / height);
      scale = Math.max(0.15, scale);
      translateX = (bounds.width - width * scale) / 2;
      translateY = (bounds.height - height * scale) / 2;
      applyTransform();
    }
    function render(nextDto) {
      dto = nextDto;
      clear();
      if (!viewport) {
        return;
      }
      const byId = new Map(dto.nodes.map((node) => [node.id, node]));
      for (const edge of dto.edges) {
        const source = byId.get(edge.from);
        const target = byId.get(edge.to);
        if (!source || !target) {
          continue;
        }
        const path = (
          /** @type {SVGPathElement} */
          svgEl("path", {
            class: `cf-edge cf-edge--${edge.status} cf-edge--kind-${edge.kind ?? edge.type}${edge.isCycle ? " cf-edge--cycle" : ""}${edge.dimmed ? " is-dimmed" : ""}`,
            d: edgePath(source, target),
            "data-from": edge.from,
            "data-to": edge.to,
            ...edge.dash ? { "stroke-dasharray": edge.dash } : {}
          })
        );
        path.dataset.from = edge.from;
        path.dataset.to = edge.to;
        const title = svgEl("title");
        title.textContent = `${edge.kind ?? edge.type} (${edge.status})${edge.reasonCode ? `: ${edge.reasonCode}` : ""}${edge.glyphHint ? ` ${edge.glyphHint}` : ""}`;
        path.appendChild(title);
        viewport.appendChild(path);
        edgeElements.set(edge.id, path);
        if (edge.label && edge.label.length > 0) {
          const from = nodePoint(source, "out");
          const to = nodePoint(target, "in");
          const label = svgEl("text", {
            class: "cf-edge-label",
            x: (from.x + to.x) / 2,
            y: (from.y + to.y) / 2 - 4,
            "text-anchor": "middle"
          });
          label.textContent = truncate(edge.label, 22);
          viewport.appendChild(label);
        }
      }
      for (const node of dto.nodes) {
        const group = (
          /** @type {SVGGElement} */
          svgEl("g", {
            class: `cf-node cf-node--${node.status} cf-node--kind-${node.kind}${node.external ? " cf-node--external" : ""}${node.unreachable ? " cf-node--unreachable" : ""}${node.isCenter ? " cf-node--center" : ""}${node.isCyclic ? " cf-node--cyclic" : ""}${node.dimmed ? " is-dimmed" : ""}`,
            transform: `translate(${node.position.x} ${node.position.y})`,
            tabindex: "0",
            role: "button",
            "aria-label": `${node.kind} ${node.label}, ${node.status}${node.unreachable ? ", unreachable" : ""}${node.external ? ", external target" : ""}`
          })
        );
        group.appendChild(
          svgEl("rect", {
            class: "cf-node-box",
            width: node.position.width,
            height: node.position.height,
            rx: 6,
            ry: 6
          })
        );
        const lines = Array.isArray(node.labelLines) && node.labelLines.length > 0 ? node.labelLines.slice(0, 3) : [truncate(node.label, 26)];
        const lineHeight = 13;
        const blockHeight = lines.length * lineHeight;
        const label = svgEl("text", {
          class: "cf-node-label",
          x: 10,
          y: node.position.height / 2 - blockHeight / 2 + lineHeight - 3
        });
        for (const [index, text] of lines.entries()) {
          const span = svgEl("tspan", {
            x: 10,
            ...index === 0 ? {} : { dy: lineHeight }
          });
          span.textContent = text;
          label.appendChild(span);
        }
        group.appendChild(label);
        const kind = svgEl("text", {
          class: "cf-node-kind",
          x: 10,
          y: node.position.height - 8
        });
        kind.textContent = node.external ? `${node.kind} \xB7 external` : node.kind;
        group.appendChild(kind);
        const badgeText = Array.isArray(node.badges) && node.badges.length > 0 ? node.badges.join(" \xB7 ") : node.badge || (node.status !== "resolved" ? node.status : "");
        if (badgeText) {
          const badge = svgEl("text", {
            class: "cf-node-badge",
            x: node.position.width - 8,
            y: 13,
            "text-anchor": "end"
          });
          badge.textContent = truncate(badgeText, 24);
          group.appendChild(badge);
        }
        const title = svgEl("title");
        const callText = Array.isArray(node.calls) && node.calls.length > 0 ? `
calls: ${node.calls.map((call) => `${call.label} (${call.status})`).join(", ")}` : "";
        title.textContent = `${node.kind} ${node.label}
status: ${node.status}${node.range ? `
lines ${node.range.startLine + 1}-${node.range.endLine + 1}` : ""}${node.reasonCode ? `
reason: ${node.reasonCode}` : ""}${callText}`;
        group.appendChild(title);
        group.addEventListener("click", (event) => {
          event.stopPropagation();
          select(node.id);
        });
        group.addEventListener("dblclick", (event) => {
          event.stopPropagation();
          select(node.id);
          options.onNavigate?.(node.id, node, "pointer");
        });
        group.addEventListener("pointerenter", (event) => {
          options.onPreviewEnter?.(node.id, node, { x: event.clientX, y: event.clientY });
        });
        group.addEventListener("pointermove", (event) => {
          options.onPreviewMove?.({ x: event.clientX, y: event.clientY });
        });
        group.addEventListener("pointerleave", () => {
          options.onPreviewLeave?.(node.id);
        });
        group.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            select(node.id);
            options.onNavigate?.(node.id, node, "keyboard");
            return;
          }
          if (event.key === " " || event.key === "Spacebar") {
            event.preventDefault();
            if (event.shiftKey) {
              options.onPreviewKey?.(node.id, node);
            } else {
              select(node.id);
            }
            return;
          }
          if (event.key === "h" || event.key === "H") {
            event.preventDefault();
            options.onPreviewKey?.(node.id, node);
          }
        });
        viewport.appendChild(group);
        nodeElements.set(node.id, group);
      }
      zoomToFit();
    }
    function moveSelection(direction) {
      if (!dto || dto.nodes.length === 0) {
        return;
      }
      const current = selectedId ? dto.nodes.find((node) => node.id === selectedId) : null;
      if (!current) {
        const first = dto.nodes[0];
        select(first.id);
        nodeElements.get(first.id)?.focus();
        return;
      }
      const origin = {
        x: current.position.x + current.position.width / 2,
        y: current.position.y + current.position.height / 2
      };
      let best = null;
      let bestScore = Number.POSITIVE_INFINITY;
      for (const candidate of dto.nodes) {
        if (candidate.id === current.id) {
          continue;
        }
        const point = {
          x: candidate.position.x + candidate.position.width / 2,
          y: candidate.position.y + candidate.position.height / 2
        };
        const dx = point.x - origin.x;
        const dy = point.y - origin.y;
        const forward = direction === "ArrowRight" && dx > 8 || direction === "ArrowLeft" && dx < -8 || direction === "ArrowDown" && dy > 8 || direction === "ArrowUp" && dy < -8;
        if (!forward) {
          continue;
        }
        const primary = direction === "ArrowRight" || direction === "ArrowLeft" ? Math.abs(dx) : Math.abs(dy);
        const secondary = direction === "ArrowRight" || direction === "ArrowLeft" ? Math.abs(dy) : Math.abs(dx);
        const score = primary + secondary * 2.2;
        if (score < bestScore) {
          bestScore = score;
          best = candidate;
        }
      }
      if (best) {
        select(best.id);
        nodeElements.get(best.id)?.focus();
      }
    }
    svg2.addEventListener(
      "wheel",
      (event) => {
        if (!dto) {
          return;
        }
        event.preventDefault();
        const bounds = svg2.getBoundingClientRect();
        const pointerX = event.clientX - bounds.left;
        const pointerY = event.clientY - bounds.top;
        const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
        const nextScale = Math.min(3.5, Math.max(0.12, scale * factor));
        const ratio = nextScale / scale;
        translateX = pointerX - (pointerX - translateX) * ratio;
        translateY = pointerY - (pointerY - translateY) * ratio;
        scale = nextScale;
        applyTransform();
      },
      { passive: false }
    );
    svg2.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) {
        return;
      }
      dragging = true;
      dragStart = { x: event.clientX, y: event.clientY, tx: translateX, ty: translateY };
      svg2.setPointerCapture(event.pointerId);
    });
    svg2.addEventListener("pointermove", (event) => {
      if (!dragging) {
        return;
      }
      translateX = dragStart.tx + (event.clientX - dragStart.x);
      translateY = dragStart.ty + (event.clientY - dragStart.y);
      applyTransform();
    });
    const endDrag = (event) => {
      dragging = false;
      if (svg2.hasPointerCapture(event.pointerId)) {
        svg2.releasePointerCapture(event.pointerId);
      }
    };
    svg2.addEventListener("pointerup", endDrag);
    svg2.addEventListener("pointercancel", endDrag);
    svg2.addEventListener("click", () => {
      if (selectedId) {
        select(null);
      }
    });
    svg2.addEventListener("keydown", (event) => {
      if (event.key.startsWith("Arrow")) {
        event.preventDefault();
        moveSelection(event.key);
        return;
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        scale = Math.min(3.5, scale * 1.15);
        applyTransform();
        return;
      }
      if (event.key === "-") {
        event.preventDefault();
        scale = Math.max(0.12, scale / 1.15);
        applyTransform();
        return;
      }
      if (event.key === "0") {
        event.preventDefault();
        zoomToFit();
      }
    });
    function highlight(nodeIds) {
      const wanted = new Set(Array.isArray(nodeIds) ? nodeIds : []);
      for (const [id, element] of nodeElements) {
        element.classList.toggle("is-synced", wanted.has(id));
      }
      for (const [, element] of edgeElements) {
        const active = wanted.size > 0 && (wanted.has(element.dataset.from ?? "") || wanted.has(element.dataset.to ?? ""));
        element.classList.toggle("is-synced", active);
      }
    }
    function markStale(nodeIds) {
      const wanted = new Set(Array.isArray(nodeIds) ? nodeIds : []);
      for (const [id, element] of nodeElements) {
        element.classList.toggle("is-stale", wanted.has(id));
      }
    }
    function focusSelection() {
      if (selectedId) {
        nodeElements.get(selectedId)?.focus();
        return true;
      }
      return false;
    }
    return {
      render,
      select,
      highlight,
      markStale,
      focusSelection,
      zoomToFit,
      destroy() {
        clear();
        dto = null;
      }
    };
  }

  // src/core/source/ranges.js
  var SOURCE_LIMITS = Object.freeze({
    maxLines: 12,
    minLines: 4,
    maxLinesLimit: 40,
    maxBytes: 65536,
    maxRanges: 2e3
  });
  function lineStarts(text) {
    const starts = [0];
    for (let index = 0; index < text.length; index += 1) {
      const code = text.charCodeAt(index);
      if (code === 10) {
        starts.push(index + 1);
      } else if (code === 13) {
        if (text.charCodeAt(index + 1) === 10) {
          index += 1;
        }
        starts.push(index + 1);
      }
    }
    return starts;
  }
  function truncateSource(text, maxLines) {
    const limit = Math.min(
      SOURCE_LIMITS.maxLinesLimit,
      Math.max(SOURCE_LIMITS.minLines, Number.isInteger(maxLines) ? maxLines : SOURCE_LIMITS.maxLines)
    );
    const starts = lineStarts(text);
    const lineCount = starts.length;
    if (lineCount <= limit) {
      return { text, truncated: false, lineCount };
    }
    let clipped = text.slice(0, starts[limit]);
    if (clipped.endsWith("\r\n")) {
      clipped = clipped.slice(0, -2);
    } else if (clipped.endsWith("\n") || clipped.endsWith("\r")) {
      clipped = clipped.slice(0, -1);
    }
    return {
      text: clipped,
      truncated: true,
      lineCount: limit
    };
  }

  // src/core/source/presentation.js
  function buildPreviewModel({ node, slice = null, maxLines = SOURCE_LIMITS.maxLines }) {
    const range = node?.range ?? null;
    const title = String(node?.label ?? "source");
    const lineLabel = range ? `${Number(range.startLine) + 1}\u2013${Number(range.endLine) + 1}` : "no line range";
    const synthetic = node?.isSynthetic === true || !range;
    if (synthetic) {
      return {
        title,
        kind: String(node?.kind ?? "node"),
        file: range?.fileId ?? "",
        lineLabel,
        text: "",
        truncated: false,
        synthetic: true,
        stale: false,
        empty: false,
        message: range ? `Synthetic ${node?.kind ?? "node"} \u2014 function structure, not a source statement. Anchored at line ${Number(range.startLine) + 1}.` : `Synthetic ${node?.kind ?? "node"} \u2014 this node has no source range.`,
        integrity: "exact",
        documentVersion: null
      };
    }
    if (!slice) {
      return {
        title,
        kind: String(node?.kind ?? "node"),
        file: range?.fileId ?? "",
        lineLabel,
        text: "",
        truncated: false,
        synthetic: false,
        stale: false,
        empty: true,
        message: "Source is not available for this range.",
        integrity: "missing",
        documentVersion: null
      };
    }
    const trimmed = truncateSource(String(slice.text ?? ""), maxLines);
    const integrity = slice.integrity ?? "exact";
    const stale = integrity === "stale";
    const empty2 = trimmed.text.trim().length === 0;
    let message = "";
    if (stale) {
      message = "The document changed since this analysis. The text below is current, but the graph may not match it. Re-analyze before trusting the range.";
    } else if (integrity === "missing") {
      message = slice.reason || "The analyzed document is no longer available.";
    } else if (empty2) {
      message = "This range has no source content.";
    }
    return {
      title,
      kind: String(node?.kind ?? "node"),
      file: String(slice.relativePath ?? range?.fileId ?? ""),
      lineLabel,
      text: trimmed.text,
      truncated: Boolean(trimmed.truncated || slice.truncated),
      synthetic: false,
      stale,
      empty: empty2,
      message,
      integrity,
      documentVersion: Number.isInteger(slice.documentVersion) ? slice.documentVersion : null
    };
  }

  // src/core/source/settings.js
  var PREVIEW_DEFAULTS = Object.freeze({
    enabled: true,
    delayMs: 300,
    maxLines: 12,
    syntaxHighlighting: true,
    clickToNavigate: true,
    pinByDefault: false,
    openInPreviewTab: false
  });
  function clampInteger(value, fallback, min, max) {
    const candidate = Number(value);
    if (!Number.isFinite(candidate)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, Math.trunc(candidate)));
  }
  function asBoolean(value, fallback) {
    return typeof value === "boolean" ? value : fallback;
  }
  function resolvePreviewSettings(raw = {}) {
    const source = raw && typeof raw === "object" ? raw : {};
    return {
      enabled: asBoolean(source.enabled, PREVIEW_DEFAULTS.enabled),
      delayMs: clampInteger(source.delayMs, PREVIEW_DEFAULTS.delayMs, 0, 2e3),
      maxLines: clampInteger(source.maxLines, PREVIEW_DEFAULTS.maxLines, 4, 40),
      syntaxHighlighting: asBoolean(source.syntaxHighlighting, PREVIEW_DEFAULTS.syntaxHighlighting),
      clickToNavigate: asBoolean(source.clickToNavigate, PREVIEW_DEFAULTS.clickToNavigate),
      pinByDefault: asBoolean(source.pinByDefault, PREVIEW_DEFAULTS.pinByDefault),
      openInPreviewTab: asBoolean(source.openInPreviewTab, PREVIEW_DEFAULTS.openInPreviewTab)
    };
  }

  // src/core/explanation/settings.js
  var EXPLANATION_DEFAULTS = Object.freeze({
    defaultDepth: 2,
    showEvidence: true,
    includeLimitations: true
  });
  function clampExplanationDepth(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      return EXPLANATION_DEFAULTS.defaultDepth;
    }
    const clamped = Math.min(4, Math.max(1, Math.trunc(num)));
    return (
      /** @type {1|2|3|4} */
      clamped
    );
  }
  function asBoolean2(value, fallback) {
    return typeof value === "boolean" ? value : fallback;
  }
  function resolveExplanationSettings(raw = {}) {
    const source = raw && typeof raw === "object" ? raw : {};
    return {
      defaultDepth: clampExplanationDepth(source.defaultDepth),
      showEvidence: asBoolean2(source.showEvidence, EXPLANATION_DEFAULTS.showEvidence),
      includeLimitations: asBoolean2(
        source.includeLimitations,
        EXPLANATION_DEFAULTS.includeLimitations
      )
    };
  }

  // src/webview/previewController.js
  function createPreviewController(options = {}) {
    const schedule = options.setTimeout ?? ((handler, ms) => setTimeout(handler, ms));
    const cancel = options.clearTimeout ?? ((handle) => clearTimeout(handle));
    let delayMs = Math.max(0, Number(options.delayMs ?? 300));
    let moveTolerance = Math.max(0, Number(options.moveTolerance ?? 12));
    const graceMs = Math.max(0, Number(options.graceMs ?? 150));
    let enabled = options.enabled !== false;
    let pinByDefault = Boolean(options.pinByDefault);
    let currentId = null;
    let anchor = { x: 0, y: 0 };
    let dwellTimer = null;
    let graceTimer = null;
    let pointerInside = false;
    let pinned = false;
    let visible = false;
    function clearDwell() {
      if (dwellTimer !== null) {
        cancel(dwellTimer);
        dwellTimer = null;
      }
    }
    function clearGrace() {
      if (graceTimer !== null) {
        cancel(graceTimer);
        graceTimer = null;
      }
    }
    function show() {
      if (!enabled || currentId === null) {
        return;
      }
      visible = true;
      if (pinByDefault) {
        pinned = true;
      }
      options.onShow?.(currentId, { ...anchor });
    }
    function hide() {
      clearDwell();
      clearGrace();
      if (!visible && currentId === null) {
        return;
      }
      const previous = currentId;
      visible = false;
      currentId = null;
      pinned = false;
      options.onHide?.(previous);
    }
    function armDwell() {
      clearDwell();
      if (!enabled || currentId === null) {
        return;
      }
      dwellTimer = schedule(() => {
        dwellTimer = null;
        show();
      }, delayMs);
    }
    function armGrace() {
      if (pinned) {
        return;
      }
      clearGrace();
      graceTimer = schedule(() => {
        graceTimer = null;
        hide();
      }, graceMs);
    }
    return {
      /**
       * @param {string} nodeId
       * @param {Point} point
       */
      pointerEnter(nodeId, point) {
        if (typeof nodeId !== "string" || nodeId.length === 0) {
          return;
        }
        pointerInside = true;
        clearGrace();
        if (visible && currentId === nodeId) {
          return;
        }
        if (visible) {
          options.onHide?.(currentId);
          visible = false;
        }
        currentId = nodeId;
        anchor = { x: Number(point?.x ?? 0), y: Number(point?.y ?? 0) };
        pinned = false;
        armDwell();
      },
      /**
       * Movement larger than the tolerance restarts the dwell timer.
       *
       * @param {Point} point
       */
      pointerMove(point) {
        if (currentId === null || visible) {
          return;
        }
        const x = Number(point?.x ?? 0);
        const y = Number(point?.y ?? 0);
        const dx = x - anchor.x;
        const dy = y - anchor.y;
        if (Math.hypot(dx, dy) > moveTolerance) {
          anchor = { x, y };
          armDwell();
        }
      },
      /** Pointer left the node: give the user time to reach the card. */
      pointerLeave() {
        pointerInside = false;
        clearDwell();
        if (!visible) {
          currentId = null;
          return;
        }
        armGrace();
      },
      /** Pointer entered the card; cancel the hide. */
      pointerEnterCard() {
        pointerInside = true;
        clearGrace();
      },
      pointerLeaveCard() {
        pointerInside = false;
        if (visible) {
          armGrace();
        }
      },
      togglePin() {
        pinned = !pinned;
        if (pinned) {
          clearGrace();
        } else if (!pointerInside) {
          armGrace();
        }
        return pinned;
      },
      /** @param {boolean} value */
      setPinned(value) {
        pinned = Boolean(value);
        if (pinned) {
          clearGrace();
        }
        return pinned;
      },
      /** Esc always exits, even when pinned. */
      dismiss() {
        hide();
      },
      /**
       * Live settings changes must not require a reload.
       *
       * @param {{delayMs?: number, enabled?: boolean, moveTolerance?: number, pinByDefault?: boolean}} next
       */
      configure(next = {}) {
        if (next.delayMs !== void 0) {
          delayMs = Math.max(0, Number(next.delayMs));
        }
        if (next.moveTolerance !== void 0) {
          moveTolerance = Math.max(0, Number(next.moveTolerance));
        }
        if (next.pinByDefault !== void 0) {
          pinByDefault = Boolean(next.pinByDefault);
        }
        if (next.enabled !== void 0) {
          enabled = Boolean(next.enabled);
          if (!enabled) {
            hide();
          }
        }
      },
      isVisible: () => visible,
      isPinned: () => pinned,
      currentId: () => currentId,
      destroy() {
        clearDwell();
        clearGrace();
        currentId = null;
        visible = false;
        pinned = false;
      }
    };
  }

  // node_modules/highlight.js/es/core.js
  var import_core = __toESM(require_core(), 1);
  var core_default = import_core.default;

  // node_modules/highlight.js/es/languages/cpp.js
  function cpp(hljs) {
    const regex = hljs.regex;
    const C_LINE_COMMENT_MODE = hljs.COMMENT("//", "$", { contains: [{ begin: /\\\n/ }] });
    const DECLTYPE_AUTO_RE = "decltype\\(auto\\)";
    const NAMESPACE_RE = "[a-zA-Z_]\\w*::";
    const TEMPLATE_ARGUMENT_RE = "<[^<>]+>";
    const FUNCTION_TYPE_RE = "(?!struct)(" + DECLTYPE_AUTO_RE + "|" + regex.optional(NAMESPACE_RE) + "[a-zA-Z_]\\w*" + regex.optional(TEMPLATE_ARGUMENT_RE) + ")";
    const CPP_PRIMITIVE_TYPES = {
      className: "type",
      begin: "\\b[a-z\\d_]*_t\\b"
    };
    const CHARACTER_ESCAPES = "\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)";
    const STRINGS = {
      className: "string",
      variants: [
        {
          begin: '(u8?|U|L)?"',
          end: '"',
          illegal: "\\n",
          contains: [hljs.BACKSLASH_ESCAPE]
        },
        {
          begin: "(u8?|U|L)?'(" + CHARACTER_ESCAPES + "|.)",
          end: "'",
          illegal: "."
        },
        hljs.END_SAME_AS_BEGIN({
          begin: /(?:u8?|U|L)?R"([^()\\ ]{0,16})\(/,
          end: /\)([^()\\ ]{0,16})"/
        })
      ]
    };
    const NUMBERS = {
      className: "number",
      variants: [
        // Floating-point literal.
        {
          begin: "[+-]?(?:(?:[0-9](?:'?[0-9])*\\.(?:[0-9](?:'?[0-9])*)?|\\.[0-9](?:'?[0-9])*)(?:[Ee][+-]?[0-9](?:'?[0-9])*)?|[0-9](?:'?[0-9])*[Ee][+-]?[0-9](?:'?[0-9])*|0[Xx](?:[0-9A-Fa-f](?:'?[0-9A-Fa-f])*(?:\\.(?:[0-9A-Fa-f](?:'?[0-9A-Fa-f])*)?)?|\\.[0-9A-Fa-f](?:'?[0-9A-Fa-f])*)[Pp][+-]?[0-9](?:'?[0-9])*)(?:[Ff](?:16|32|64|128)?|(BF|bf)16|[Ll]|)"
        },
        // Integer literal.
        {
          begin: "[+-]?\\b(?:0[Bb][01](?:'?[01])*|0[Xx][0-9A-Fa-f](?:'?[0-9A-Fa-f])*|0(?:'?[0-7])*|[1-9](?:'?[0-9])*)(?:[Uu](?:LL?|ll?)|[Uu][Zz]?|(?:LL?|ll?)[Uu]?|[Zz][Uu]|)"
          // Note: there are user-defined literal suffixes too, but perhaps having the custom suffix not part of the
          // literal highlight actually makes it stand out more.
        }
      ],
      relevance: 0
    };
    const PREPROCESSOR = {
      className: "meta",
      begin: /#\s*[a-z]+\b/,
      end: /$/,
      keywords: { keyword: "if else elif endif define undef warning error line pragma _Pragma ifdef ifndef include" },
      contains: [
        {
          begin: /\\\n/,
          relevance: 0
        },
        hljs.inherit(STRINGS, { className: "string" }),
        {
          className: "string",
          begin: /<.*?>/
        },
        C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE
      ]
    };
    const TITLE_MODE = {
      className: "title",
      begin: regex.optional(NAMESPACE_RE) + hljs.IDENT_RE,
      relevance: 0
    };
    const FUNCTION_TITLE = regex.optional(NAMESPACE_RE) + hljs.IDENT_RE + "\\s*\\(";
    const RESERVED_KEYWORDS = [
      "alignas",
      "alignof",
      "and",
      "and_eq",
      "asm",
      "atomic_cancel",
      "atomic_commit",
      "atomic_noexcept",
      "auto",
      "bitand",
      "bitor",
      "break",
      "case",
      "catch",
      "class",
      "co_await",
      "co_return",
      "co_yield",
      "compl",
      "concept",
      "const_cast|10",
      "consteval",
      "constexpr",
      "constinit",
      "continue",
      "decltype",
      "default",
      "delete",
      "do",
      "dynamic_cast|10",
      "else",
      "enum",
      "explicit",
      "export",
      "extern",
      "false",
      "final",
      "for",
      "friend",
      "goto",
      "if",
      "import",
      "inline",
      "module",
      "mutable",
      "namespace",
      "new",
      "noexcept",
      "not",
      "not_eq",
      "nullptr",
      "operator",
      "or",
      "or_eq",
      "override",
      "private",
      "protected",
      "public",
      "reflexpr",
      "register",
      "reinterpret_cast|10",
      "requires",
      "return",
      "sizeof",
      "static_assert",
      "static_cast|10",
      "struct",
      "switch",
      "synchronized",
      "template",
      "this",
      "thread_local",
      "throw",
      "transaction_safe",
      "transaction_safe_dynamic",
      "true",
      "try",
      "typedef",
      "typeid",
      "typename",
      "union",
      "using",
      "virtual",
      "volatile",
      "while",
      "xor",
      "xor_eq"
    ];
    const RESERVED_TYPES = [
      "bool",
      "char",
      "char16_t",
      "char32_t",
      "char8_t",
      "double",
      "float",
      "int",
      "long",
      "short",
      "void",
      "wchar_t",
      "unsigned",
      "signed",
      "const",
      "static"
    ];
    const TYPE_HINTS = [
      "any",
      "auto_ptr",
      "barrier",
      "binary_semaphore",
      "bitset",
      "complex",
      "condition_variable",
      "condition_variable_any",
      "counting_semaphore",
      "deque",
      "false_type",
      "flat_map",
      "flat_set",
      "future",
      "imaginary",
      "initializer_list",
      "istringstream",
      "jthread",
      "latch",
      "lock_guard",
      "multimap",
      "multiset",
      "mutex",
      "optional",
      "ostringstream",
      "packaged_task",
      "pair",
      "promise",
      "priority_queue",
      "queue",
      "recursive_mutex",
      "recursive_timed_mutex",
      "scoped_lock",
      "set",
      "shared_future",
      "shared_lock",
      "shared_mutex",
      "shared_timed_mutex",
      "shared_ptr",
      "stack",
      "string_view",
      "stringstream",
      "timed_mutex",
      "thread",
      "true_type",
      "tuple",
      "unique_lock",
      "unique_ptr",
      "unordered_map",
      "unordered_multimap",
      "unordered_multiset",
      "unordered_set",
      "variant",
      "vector",
      "weak_ptr",
      "wstring",
      "wstring_view"
    ];
    const FUNCTION_HINTS = [
      "abort",
      "abs",
      "acos",
      "apply",
      "as_const",
      "asin",
      "atan",
      "atan2",
      "calloc",
      "ceil",
      "cerr",
      "cin",
      "clog",
      "cos",
      "cosh",
      "cout",
      "declval",
      "endl",
      "exchange",
      "exit",
      "exp",
      "fabs",
      "floor",
      "fmod",
      "forward",
      "fprintf",
      "fputs",
      "free",
      "frexp",
      "fscanf",
      "future",
      "invoke",
      "isalnum",
      "isalpha",
      "iscntrl",
      "isdigit",
      "isgraph",
      "islower",
      "isprint",
      "ispunct",
      "isspace",
      "isupper",
      "isxdigit",
      "labs",
      "launder",
      "ldexp",
      "log",
      "log10",
      "make_pair",
      "make_shared",
      "make_shared_for_overwrite",
      "make_tuple",
      "make_unique",
      "malloc",
      "memchr",
      "memcmp",
      "memcpy",
      "memset",
      "modf",
      "move",
      "pow",
      "printf",
      "putchar",
      "puts",
      "realloc",
      "scanf",
      "sin",
      "sinh",
      "snprintf",
      "sprintf",
      "sqrt",
      "sscanf",
      "std",
      "stderr",
      "stdin",
      "stdout",
      "strcat",
      "strchr",
      "strcmp",
      "strcpy",
      "strcspn",
      "strlen",
      "strncat",
      "strncmp",
      "strncpy",
      "strpbrk",
      "strrchr",
      "strspn",
      "strstr",
      "swap",
      "tan",
      "tanh",
      "terminate",
      "to_underlying",
      "tolower",
      "toupper",
      "vfprintf",
      "visit",
      "vprintf",
      "vsprintf"
    ];
    const LITERALS2 = [
      "NULL",
      "false",
      "nullopt",
      "nullptr",
      "true"
    ];
    const BUILT_IN = ["_Pragma"];
    const CPP_KEYWORDS = {
      type: RESERVED_TYPES,
      keyword: RESERVED_KEYWORDS,
      literal: LITERALS2,
      built_in: BUILT_IN,
      _type_hints: TYPE_HINTS
    };
    const FUNCTION_DISPATCH = {
      className: "function.dispatch",
      relevance: 0,
      keywords: {
        // Only for relevance, not highlighting.
        _hint: FUNCTION_HINTS
      },
      begin: regex.concat(
        /\b/,
        /(?!decltype)/,
        /(?!if)/,
        /(?!for)/,
        /(?!switch)/,
        /(?!while)/,
        hljs.IDENT_RE,
        regex.lookahead(/(<[^<>]+>|)\s*\(/)
      )
    };
    const EXPRESSION_CONTAINS = [
      FUNCTION_DISPATCH,
      PREPROCESSOR,
      CPP_PRIMITIVE_TYPES,
      C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      NUMBERS,
      STRINGS
    ];
    const EXPRESSION_CONTEXT = {
      // This mode covers expression context where we can't expect a function
      // definition and shouldn't highlight anything that looks like one:
      // `return some()`, `else if()`, `(x*sum(1, 2))`
      variants: [
        {
          begin: /=/,
          end: /;/
        },
        {
          begin: /\(/,
          end: /\)/
        },
        {
          beginKeywords: "new throw return else",
          end: /;/
        }
      ],
      keywords: CPP_KEYWORDS,
      contains: EXPRESSION_CONTAINS.concat([
        {
          begin: /\(/,
          end: /\)/,
          keywords: CPP_KEYWORDS,
          contains: EXPRESSION_CONTAINS.concat(["self"]),
          relevance: 0
        }
      ]),
      relevance: 0
    };
    const FUNCTION_DECLARATION = {
      className: "function",
      begin: "(" + FUNCTION_TYPE_RE + "[\\*&\\s]+)+" + FUNCTION_TITLE,
      returnBegin: true,
      end: /[{;=]/,
      excludeEnd: true,
      keywords: CPP_KEYWORDS,
      illegal: /[^\w\s\*&:<>.]/,
      contains: [
        {
          // to prevent it from being confused as the function title
          begin: DECLTYPE_AUTO_RE,
          keywords: CPP_KEYWORDS,
          relevance: 0
        },
        {
          begin: FUNCTION_TITLE,
          returnBegin: true,
          contains: [TITLE_MODE],
          relevance: 0
        },
        // needed because we do not have look-behind on the below rule
        // to prevent it from grabbing the final : in a :: pair
        {
          begin: /::/,
          relevance: 0
        },
        // initializers
        {
          begin: /:/,
          endsWithParent: true,
          contains: [
            STRINGS,
            NUMBERS
          ]
        },
        // allow for multiple declarations, e.g.:
        // extern void f(int), g(char);
        {
          relevance: 0,
          match: /,/
        },
        {
          className: "params",
          begin: /\(/,
          end: /\)/,
          keywords: CPP_KEYWORDS,
          relevance: 0,
          contains: [
            C_LINE_COMMENT_MODE,
            hljs.C_BLOCK_COMMENT_MODE,
            STRINGS,
            NUMBERS,
            CPP_PRIMITIVE_TYPES,
            // Count matching parentheses.
            {
              begin: /\(/,
              end: /\)/,
              keywords: CPP_KEYWORDS,
              relevance: 0,
              contains: [
                "self",
                C_LINE_COMMENT_MODE,
                hljs.C_BLOCK_COMMENT_MODE,
                STRINGS,
                NUMBERS,
                CPP_PRIMITIVE_TYPES
              ]
            }
          ]
        },
        CPP_PRIMITIVE_TYPES,
        C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        PREPROCESSOR
      ]
    };
    return {
      name: "C++",
      aliases: [
        "cc",
        "c++",
        "h++",
        "hpp",
        "hh",
        "hxx",
        "cxx"
      ],
      keywords: CPP_KEYWORDS,
      illegal: "</",
      classNameAliases: { "function.dispatch": "built_in" },
      contains: [].concat(
        EXPRESSION_CONTEXT,
        FUNCTION_DECLARATION,
        FUNCTION_DISPATCH,
        EXPRESSION_CONTAINS,
        [
          PREPROCESSOR,
          {
            // containers: ie, `vector <int> rooms (9);`
            begin: "\\b(deque|list|queue|priority_queue|pair|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array|tuple|optional|variant|function|flat_map|flat_set)\\s*<(?!<)",
            end: ">",
            keywords: CPP_KEYWORDS,
            contains: [
              "self",
              CPP_PRIMITIVE_TYPES
            ]
          },
          {
            begin: hljs.IDENT_RE + "::",
            keywords: CPP_KEYWORDS
          },
          {
            match: [
              // extra complexity to deal with `enum class` and `enum struct`
              /\b(?:enum(?:\s+(?:class|struct))?|class|struct|union)/,
              /\s+/,
              /\w+/
            ],
            className: {
              1: "keyword",
              3: "title.class"
            }
          }
        ]
      )
    };
  }

  // node_modules/highlight.js/es/languages/javascript.js
  var IDENT_RE = "[A-Za-z$_][0-9A-Za-z$_]*";
  var KEYWORDS = [
    "as",
    // for exports
    "in",
    "of",
    "if",
    "for",
    "while",
    "finally",
    "var",
    "new",
    "function",
    "do",
    "return",
    "void",
    "else",
    "break",
    "catch",
    "instanceof",
    "with",
    "throw",
    "case",
    "default",
    "try",
    "switch",
    "continue",
    "typeof",
    "delete",
    "let",
    "yield",
    "const",
    "class",
    // JS handles these with a special rule
    // "get",
    // "set",
    "debugger",
    "async",
    "await",
    "static",
    "import",
    "from",
    "export",
    "extends",
    // It's reached stage 3, which is "recommended for implementation":
    "using"
  ];
  var LITERALS = [
    "true",
    "false",
    "null",
    "undefined",
    "NaN",
    "Infinity"
  ];
  var TYPES = [
    // Fundamental objects
    "Object",
    "Function",
    "Boolean",
    "Symbol",
    // numbers and dates
    "Math",
    "Date",
    "Number",
    "BigInt",
    // text
    "String",
    "RegExp",
    // Indexed collections
    "Array",
    "Float32Array",
    "Float64Array",
    "Int8Array",
    "Uint8Array",
    "Uint8ClampedArray",
    "Int16Array",
    "Int32Array",
    "Uint16Array",
    "Uint32Array",
    "BigInt64Array",
    "BigUint64Array",
    // Keyed collections
    "Set",
    "Map",
    "WeakSet",
    "WeakMap",
    // Structured data
    "ArrayBuffer",
    "SharedArrayBuffer",
    "Atomics",
    "DataView",
    "JSON",
    // Control abstraction objects
    "Promise",
    "Generator",
    "GeneratorFunction",
    "AsyncFunction",
    // Reflection
    "Reflect",
    "Proxy",
    // Internationalization
    "Intl",
    // WebAssembly
    "WebAssembly"
  ];
  var ERROR_TYPES = [
    "Error",
    "EvalError",
    "InternalError",
    "RangeError",
    "ReferenceError",
    "SyntaxError",
    "TypeError",
    "URIError"
  ];
  var BUILT_IN_GLOBALS = [
    "setInterval",
    "setTimeout",
    "clearInterval",
    "clearTimeout",
    "require",
    "exports",
    "eval",
    "isFinite",
    "isNaN",
    "parseFloat",
    "parseInt",
    "decodeURI",
    "decodeURIComponent",
    "encodeURI",
    "encodeURIComponent",
    "escape",
    "unescape"
  ];
  var BUILT_IN_VARIABLES = [
    "arguments",
    "this",
    "super",
    "console",
    "window",
    "document",
    "localStorage",
    "sessionStorage",
    "module",
    "global"
    // Node.js
  ];
  var BUILT_INS = [].concat(
    BUILT_IN_GLOBALS,
    TYPES,
    ERROR_TYPES
  );
  function javascript(hljs) {
    const regex = hljs.regex;
    const hasClosingTag = (match, { after }) => {
      const tag = "</" + match[0].slice(1);
      const pos = match.input.indexOf(tag, after);
      return pos !== -1;
    };
    const IDENT_RE$1 = IDENT_RE;
    const FRAGMENT = {
      begin: "<>",
      end: "</>"
    };
    const XML_SELF_CLOSING = /<[A-Za-z0-9\\._:-]+\s*\/>/;
    const XML_TAG = {
      begin: /<[A-Za-z0-9\\._:-]+/,
      end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
      /**
       * @param {RegExpMatchArray} match
       * @param {CallbackResponse} response
       */
      isTrulyOpeningTag: (match, response) => {
        const afterMatchIndex = match[0].length + match.index;
        const nextChar = match.input[afterMatchIndex];
        if (
          // HTML should not include another raw `<` inside a tag
          // nested type?
          // `<Array<Array<number>>`, etc.
          nextChar === "<" || // the , gives away that this is not HTML
          // `<T, A extends keyof T, V>`
          nextChar === ","
        ) {
          response.ignoreMatch();
          return;
        }
        if (nextChar === ">") {
          if (!hasClosingTag(match, { after: afterMatchIndex })) {
            response.ignoreMatch();
          }
        }
        let m;
        const afterMatch = match.input.substring(afterMatchIndex);
        if (m = afterMatch.match(/^\s*=/)) {
          response.ignoreMatch();
          return;
        }
        if (m = afterMatch.match(/^\s+extends\s+/)) {
          if (m.index === 0) {
            response.ignoreMatch();
            return;
          }
        }
      }
    };
    const KEYWORDS$1 = {
      $pattern: IDENT_RE,
      keyword: KEYWORDS,
      literal: LITERALS,
      built_in: BUILT_INS,
      "variable.language": BUILT_IN_VARIABLES
    };
    const decimalDigits = "[0-9](_?[0-9])*";
    const frac = `\\.(${decimalDigits})`;
    const decimalInteger = `0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*`;
    const NUMBER = {
      className: "number",
      variants: [
        // DecimalLiteral
        { begin: `(\\b(${decimalInteger})((${frac})|\\.)?|(${frac}))[eE][+-]?(${decimalDigits})\\b` },
        { begin: `\\b(${decimalInteger})\\b((${frac})\\b|\\.)?|(${frac})\\b` },
        // DecimalBigIntegerLiteral
        { begin: `\\b(0|[1-9](_?[0-9])*)n\\b` },
        // NonDecimalIntegerLiteral
        { begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b" },
        { begin: "\\b0[bB][0-1](_?[0-1])*n?\\b" },
        { begin: "\\b0[oO][0-7](_?[0-7])*n?\\b" },
        // LegacyOctalIntegerLiteral (does not include underscore separators)
        // https://tc39.es/ecma262/#sec-additional-syntax-numeric-literals
        { begin: "\\b0[0-7]+n?\\b" }
      ],
      relevance: 0
    };
    const SUBST = {
      className: "subst",
      begin: "\\$\\{",
      end: "\\}",
      keywords: KEYWORDS$1,
      contains: []
      // defined later
    };
    const HTML_TEMPLATE = {
      begin: ".?html`",
      end: "",
      starts: {
        end: "`",
        returnEnd: false,
        contains: [
          hljs.BACKSLASH_ESCAPE,
          SUBST
        ],
        subLanguage: "xml"
      }
    };
    const CSS_TEMPLATE = {
      begin: ".?css`",
      end: "",
      starts: {
        end: "`",
        returnEnd: false,
        contains: [
          hljs.BACKSLASH_ESCAPE,
          SUBST
        ],
        subLanguage: "css"
      }
    };
    const GRAPHQL_TEMPLATE = {
      begin: ".?gql`",
      end: "",
      starts: {
        end: "`",
        returnEnd: false,
        contains: [
          hljs.BACKSLASH_ESCAPE,
          SUBST
        ],
        subLanguage: "graphql"
      }
    };
    const TEMPLATE_STRING = {
      className: "string",
      begin: "`",
      end: "`",
      contains: [
        hljs.BACKSLASH_ESCAPE,
        SUBST
      ]
    };
    const JSDOC_COMMENT = hljs.COMMENT(
      /\/\*\*(?!\/)/,
      "\\*/",
      {
        relevance: 0,
        contains: [
          {
            begin: "(?=@[A-Za-z]+)",
            relevance: 0,
            contains: [
              {
                className: "doctag",
                begin: "@[A-Za-z]+"
              },
              {
                className: "type",
                begin: "\\{",
                end: "\\}",
                excludeEnd: true,
                excludeBegin: true,
                relevance: 0
              },
              {
                className: "variable",
                begin: IDENT_RE$1 + "(?=\\s*(-)|$)",
                endsParent: true,
                relevance: 0
              },
              // eat spaces (not newlines) so we can find
              // types or variables
              {
                begin: /(?=[^\n])\s/,
                relevance: 0
              }
            ]
          }
        ]
      }
    );
    const COMMENT = {
      className: "comment",
      variants: [
        JSDOC_COMMENT,
        hljs.C_BLOCK_COMMENT_MODE,
        hljs.C_LINE_COMMENT_MODE
      ]
    };
    const SUBST_INTERNALS = [
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      HTML_TEMPLATE,
      CSS_TEMPLATE,
      GRAPHQL_TEMPLATE,
      TEMPLATE_STRING,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      NUMBER
      // This is intentional:
      // See https://github.com/highlightjs/highlight.js/issues/3288
      // hljs.REGEXP_MODE
    ];
    SUBST.contains = SUBST_INTERNALS.concat({
      // we need to pair up {} inside our subst to prevent
      // it from ending too early by matching another }
      begin: /\{/,
      end: /\}/,
      keywords: KEYWORDS$1,
      contains: [
        "self"
      ].concat(SUBST_INTERNALS)
    });
    const SUBST_AND_COMMENTS = [].concat(COMMENT, SUBST.contains);
    const PARAMS_CONTAINS = SUBST_AND_COMMENTS.concat([
      // eat recursive parens in sub expressions
      {
        begin: /(\s*)\(/,
        end: /\)/,
        keywords: KEYWORDS$1,
        contains: ["self"].concat(SUBST_AND_COMMENTS)
      }
    ]);
    const PARAMS = {
      className: "params",
      // convert this to negative lookbehind in v12
      begin: /(\s*)\(/,
      // to match the parms with
      end: /\)/,
      excludeBegin: true,
      excludeEnd: true,
      keywords: KEYWORDS$1,
      contains: PARAMS_CONTAINS
    };
    const CLASS_OR_EXTENDS = {
      variants: [
        // class Car extends vehicle
        {
          match: [
            /class/,
            /\s+/,
            IDENT_RE$1,
            /\s+/,
            /extends/,
            /\s+/,
            regex.concat(IDENT_RE$1, "(", regex.concat(/\./, IDENT_RE$1), ")*")
          ],
          scope: {
            1: "keyword",
            3: "title.class",
            5: "keyword",
            7: "title.class.inherited"
          }
        },
        // class Car
        {
          match: [
            /class/,
            /\s+/,
            IDENT_RE$1
          ],
          scope: {
            1: "keyword",
            3: "title.class"
          }
        }
      ]
    };
    const CLASS_REFERENCE = {
      relevance: 0,
      match: regex.either(
        // Hard coded exceptions
        /\bJSON/,
        // Float32Array, OutT
        /\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,
        // CSSFactory, CSSFactoryT
        /\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,
        // FPs, FPsT
        /\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/
        // P
        // single letters are not highlighted
        // BLAH
        // this will be flagged as a UPPER_CASE_CONSTANT instead
      ),
      className: "title.class",
      keywords: {
        _: [
          // se we still get relevance credit for JS library classes
          ...TYPES,
          ...ERROR_TYPES
        ]
      }
    };
    const USE_STRICT = {
      label: "use_strict",
      className: "meta",
      relevance: 10,
      begin: /^\s*['"]use (strict|asm)['"]/
    };
    const FUNCTION_DEFINITION = {
      variants: [
        {
          match: [
            /function/,
            /\s+/,
            IDENT_RE$1,
            /(?=\s*\()/
          ]
        },
        // anonymous function
        {
          match: [
            /function/,
            /\s*(?=\()/
          ]
        }
      ],
      className: {
        1: "keyword",
        3: "title.function"
      },
      label: "func.def",
      contains: [PARAMS],
      illegal: /%/
    };
    const UPPER_CASE_CONSTANT = {
      relevance: 0,
      match: /\b[A-Z][A-Z_0-9]+\b/,
      className: "variable.constant"
    };
    function noneOf(list) {
      return regex.concat("(?!", list.join("|"), ")");
    }
    const FUNCTION_CALL = {
      match: regex.concat(
        /\b/,
        noneOf([
          ...BUILT_IN_GLOBALS,
          "super",
          "import"
        ].map((x) => `${x}\\s*\\(`)),
        IDENT_RE$1,
        regex.lookahead(/\s*\(/)
      ),
      className: "title.function",
      relevance: 0
    };
    const PROPERTY_ACCESS = {
      begin: regex.concat(/\./, regex.lookahead(
        regex.concat(IDENT_RE$1, /(?![0-9A-Za-z$_(])/)
      )),
      end: IDENT_RE$1,
      excludeBegin: true,
      keywords: "prototype",
      className: "property",
      relevance: 0
    };
    const GETTER_OR_SETTER = {
      match: [
        /get|set/,
        /\s+/,
        IDENT_RE$1,
        /(?=\()/
      ],
      className: {
        1: "keyword",
        3: "title.function"
      },
      contains: [
        {
          // eat to avoid empty params
          begin: /\(\)/
        },
        PARAMS
      ]
    };
    const FUNC_LEAD_IN_RE = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + hljs.UNDERSCORE_IDENT_RE + ")\\s*=>";
    const FUNCTION_VARIABLE = {
      match: [
        /const|var|let/,
        /\s+/,
        IDENT_RE$1,
        /\s*/,
        /=\s*/,
        /(async\s*)?/,
        // async is optional
        regex.lookahead(FUNC_LEAD_IN_RE)
      ],
      keywords: "async",
      className: {
        1: "keyword",
        3: "title.function"
      },
      contains: [
        PARAMS
      ]
    };
    return {
      name: "JavaScript",
      aliases: ["js", "jsx", "mjs", "cjs"],
      keywords: KEYWORDS$1,
      // this will be extended by TypeScript
      exports: { PARAMS_CONTAINS, CLASS_REFERENCE },
      illegal: /#(?![$_A-z])/,
      contains: [
        hljs.SHEBANG({
          label: "shebang",
          binary: "node",
          relevance: 5
        }),
        USE_STRICT,
        hljs.APOS_STRING_MODE,
        hljs.QUOTE_STRING_MODE,
        HTML_TEMPLATE,
        CSS_TEMPLATE,
        GRAPHQL_TEMPLATE,
        TEMPLATE_STRING,
        COMMENT,
        // Skip numbers when they are part of a variable name
        { match: /\$\d+/ },
        NUMBER,
        CLASS_REFERENCE,
        {
          scope: "attr",
          match: IDENT_RE$1 + regex.lookahead(":"),
          relevance: 0
        },
        FUNCTION_VARIABLE,
        {
          // "value" container
          begin: "(" + hljs.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
          keywords: "return throw case",
          relevance: 0,
          contains: [
            COMMENT,
            hljs.REGEXP_MODE,
            {
              className: "function",
              // we have to count the parens to make sure we actually have the
              // correct bounding ( ) before the =>.  There could be any number of
              // sub-expressions inside also surrounded by parens.
              begin: FUNC_LEAD_IN_RE,
              returnBegin: true,
              end: "\\s*=>",
              contains: [
                {
                  className: "params",
                  variants: [
                    {
                      begin: hljs.UNDERSCORE_IDENT_RE,
                      relevance: 0
                    },
                    {
                      className: null,
                      begin: /\(\s*\)/,
                      skip: true
                    },
                    {
                      begin: /(\s*)\(/,
                      end: /\)/,
                      excludeBegin: true,
                      excludeEnd: true,
                      keywords: KEYWORDS$1,
                      contains: PARAMS_CONTAINS
                    }
                  ]
                }
              ]
            },
            {
              // could be a comma delimited list of params to a function call
              begin: /,/,
              relevance: 0
            },
            {
              match: /\s+/,
              relevance: 0
            },
            {
              // JSX
              variants: [
                { begin: FRAGMENT.begin, end: FRAGMENT.end },
                { match: XML_SELF_CLOSING },
                {
                  begin: XML_TAG.begin,
                  // we carefully check the opening tag to see if it truly
                  // is a tag and not a false positive
                  "on:begin": XML_TAG.isTrulyOpeningTag,
                  end: XML_TAG.end
                }
              ],
              subLanguage: "xml",
              contains: [
                {
                  begin: XML_TAG.begin,
                  end: XML_TAG.end,
                  skip: true,
                  contains: ["self"]
                }
              ]
            }
          ]
        },
        FUNCTION_DEFINITION,
        {
          // prevent this from getting swallowed up by function
          // since they appear "function like"
          beginKeywords: "while if switch catch for"
        },
        {
          // we have to count the parens to make sure we actually have the correct
          // bounding ( ).  There could be any number of sub-expressions inside
          // also surrounded by parens.
          begin: "\\b(?!function)" + hljs.UNDERSCORE_IDENT_RE + "\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
          // end parens
          returnBegin: true,
          label: "func.def",
          contains: [
            PARAMS,
            hljs.inherit(hljs.TITLE_MODE, { begin: IDENT_RE$1, className: "title.function" })
          ]
        },
        // catch ... so it won't trigger the property rule below
        {
          match: /\.\.\./,
          relevance: 0
        },
        PROPERTY_ACCESS,
        // hack: prevents detection of keywords in some circumstances
        // .keyword()
        // $keyword = x
        {
          match: "\\$" + IDENT_RE$1,
          relevance: 0
        },
        {
          match: [/\bconstructor(?=\s*\()/],
          className: { 1: "title.function" },
          contains: [PARAMS]
        },
        FUNCTION_CALL,
        UPPER_CASE_CONSTANT,
        CLASS_OR_EXTENDS,
        GETTER_OR_SETTER,
        {
          match: /\$[(.]/
          // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
        }
      ]
    };
  }

  // src/webview/highlight.js
  core_default.registerLanguage("cpp", cpp);
  core_default.registerLanguage("javascript", javascript);
  function resolveLanguage(languageId) {
    const id = String(languageId ?? "").toLowerCase();
    if (id === "cpp" || id === "c++" || id === "c" || id === "objective-c++") {
      return { language: "cpp", degraded: false };
    }
    if (id === "javascript" || id === "js" || id === "mjs" || id === "cjs") {
      return { language: "javascript", degraded: false };
    }
    return { language: null, degraded: true };
  }
  function htmlToLines(html) {
    const lines = [[]];
    const stack = [];
    const pattern = /<span class="([^"]+)">|<\/span>|([^<]+)/g;
    let match;
    while ((match = pattern.exec(html)) !== null) {
      if (match[1]) {
        stack.push(match[1]);
        continue;
      }
      if (match[0] === "</span>") {
        stack.pop();
        continue;
      }
      const text = decodeEntities(match[2] ?? "");
      const parts = text.split("\n");
      for (const [index, part] of parts.entries()) {
        if (index > 0) {
          lines.push([]);
        }
        if (part.length > 0) {
          lines[lines.length - 1].push({
            text: part,
            className: stack.length > 0 ? stack[stack.length - 1] : ""
          });
        }
      }
    }
    return lines;
  }
  function decodeEntities(value) {
    return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&amp;/g, "&");
  }
  function plainLines(text) {
    return String(text ?? "").split(/\r\n|\r|\n/).map((line) => line.length > 0 ? [{ text: line, className: "" }] : []);
  }
  function highlightLines(text, languageId) {
    const resolved = resolveLanguage(languageId);
    if (!resolved.language) {
      return { lines: plainLines(text), degraded: true };
    }
    try {
      const html = core_default.highlight(String(text ?? ""), { language: resolved.language }).value;
      return { lines: htmlToLines(html), degraded: false };
    } catch {
      return { lines: plainLines(text), degraded: true };
    }
  }

  // src/webview/main.js
  var vscodeApi = acquireVsCodeApi();
  var svg = (
    /** @type {SVGSVGElement} */
    document.getElementById("cf-graph")
  );
  var meta = (
    /** @type {HTMLElement} */
    document.getElementById("cf-meta")
  );
  var status = (
    /** @type {HTMLElement} */
    document.getElementById("cf-status")
  );
  var banner = (
    /** @type {HTMLElement} */
    document.getElementById("cf-banner")
  );
  var empty = (
    /** @type {HTMLElement} */
    document.getElementById("cf-empty")
  );
  var detailBody = (
    /** @type {HTMLElement} */
    document.getElementById("cf-detail-body")
  );
  var legend = (
    /** @type {HTMLElement} */
    document.getElementById("cf-legend")
  );
  var reloadButton = (
    /** @type {HTMLButtonElement} */
    document.getElementById("cf-refresh")
  );
  var functionPicker = (
    /** @type {HTMLSelectElement|null} */
    document.getElementById("cf-function")
  );
  var preview = (
    /** @type {HTMLElement} */
    document.getElementById("cf-preview")
  );
  var previewTitle = (
    /** @type {HTMLElement} */
    document.getElementById("cf-preview-title")
  );
  var previewMeta = (
    /** @type {HTMLElement} */
    document.getElementById("cf-preview-meta")
  );
  var previewExplain = (
    /** @type {HTMLElement|null} */
    document.getElementById("cf-preview-explain")
  );
  var previewBody = (
    /** @type {HTMLElement} */
    document.getElementById("cf-preview-body")
  );
  var previewNote = (
    /** @type {HTMLElement} */
    document.getElementById("cf-preview-note")
  );
  var previewPin = (
    /** @type {HTMLButtonElement} */
    document.getElementById("cf-preview-pin")
  );
  var previewClose = (
    /** @type {HTMLButtonElement} */
    document.getElementById("cf-preview-close")
  );
  var previewOpen = (
    /** @type {HTMLButtonElement} */
    document.getElementById("cf-preview-open")
  );
  var fnSummary = (
    /** @type {HTMLElement|null} */
    document.getElementById("cf-fn-summary")
  );
  var explainSection = (
    /** @type {HTMLElement|null} */
    document.getElementById("cf-explain")
  );
  var explainDepthSelect = (
    /** @type {HTMLSelectElement|null} */
    document.getElementById("cf-explain-depth")
  );
  var explainItems = (
    /** @type {HTMLElement|null} */
    document.getElementById("cf-explain-items")
  );
  var explainEvidence = (
    /** @type {HTMLDetailsElement|null} */
    document.getElementById("cf-explain-evidence")
  );
  var explainEvidenceList = (
    /** @type {HTMLElement|null} */
    document.getElementById("cf-explain-evidence-list")
  );
  var explainLimits = (
    /** @type {HTMLDetailsElement|null} */
    document.getElementById("cf-explain-limits")
  );
  var explainLimitsText = (
    /** @type {HTMLElement|null} */
    document.getElementById("cf-explain-limits-text")
  );
  var perspectiveSelect = (
    /** @type {HTMLSelectElement|null} */
    document.getElementById("cf-perspective")
  );
  var switchPerspectiveBtn = (
    /** @type {HTMLButtonElement|null} */
    document.getElementById("cf-switch-perspective")
  );
  var scopeBanner = (
    /** @type {HTMLElement|null} */
    document.getElementById("cf-scope-banner")
  );
  var callsPanel = (
    /** @type {HTMLElement|null} */
    document.getElementById("cf-calls-panel")
  );
  var callsFilterStatus = (
    /** @type {HTMLSelectElement|null} */
    document.getElementById("cf-calls-filter-status")
  );
  var callsExpandBtn = (
    /** @type {HTMLButtonElement|null} */
    document.getElementById("cf-calls-expand")
  );
  var callsCollapseBtn = (
    /** @type {HTMLButtonElement|null} */
    document.getElementById("cf-calls-collapse")
  );
  var callsFocusBtn = (
    /** @type {HTMLButtonElement|null} */
    document.getElementById("cf-calls-focus")
  );
  var callersHeading = (
    /** @type {HTMLElement|null} */
    document.getElementById("cf-callers-heading")
  );
  var callersList = (
    /** @type {HTMLElement|null} */
    document.getElementById("cf-callers-list")
  );
  var callersMoreBtn = (
    /** @type {HTMLButtonElement|null} */
    document.getElementById("cf-callers-more")
  );
  var calleesHeading = (
    /** @type {HTMLElement|null} */
    document.getElementById("cf-callees-heading")
  );
  var calleesList = (
    /** @type {HTMLElement|null} */
    document.getElementById("cf-callees-list")
  );
  var calleesMoreBtn = (
    /** @type {HTMLButtonElement|null} */
    document.getElementById("cf-callees-more")
  );
  var unresolvedBucketDetails = (
    /** @type {HTMLDetailsElement|null} */
    document.getElementById("cf-unresolved-bucket")
  );
  var unresolvedSummary = (
    /** @type {HTMLElement|null} */
    document.getElementById("cf-unresolved-summary")
  );
  var unresolvedList = (
    /** @type {HTMLElement|null} */
    document.getElementById("cf-unresolved-list")
  );
  var currentDto = null;
  var preferredSymbolId = document.body.dataset.preferredSymbol || null;
  var preferredPerspective = document.body.dataset.preferredPerspective === "call_graph" ? "call_graph" : "cfg";
  var selectedSymbolId = preferredSymbolId;
  var activePerspective = preferredPerspective;
  var callersNextCursor;
  var calleesNextCursor;
  if (perspectiveSelect) {
    perspectiveSelect.value = activePerspective;
  }
  var settings = resolvePreviewSettings({});
  var explanationSettings = resolveExplanationSettings({});
  var activeExplainDepth = explanationSettings.defaultDepth;
  var activeNodeId = null;
  var explainNodeRequest = 0;
  var explainFunctionRequest = 0;
  var previewCache = /* @__PURE__ */ new Map();
  var integrityByNode = /* @__PURE__ */ new Map();
  var previewNodeId = null;
  var previewRequest = 0;
  var previewAnchor = null;
  var renderer = createSvgRenderer({
    svg,
    onSelect: (nodeId, node) => {
      showNodeDetails(nodeId, node);
      bridge.respond("node.select", { nodeId });
    },
    onNavigate: (nodeId, node, trigger) => {
      if (trigger === "pointer" && !settings.clickToNavigate) {
        return;
      }
      void navigateTo(nodeId, node);
    },
    onPreviewEnter: (nodeId, _node, point) => {
      previewController.pointerEnter(nodeId, point);
    },
    onPreviewMove: (point) => {
      previewController.pointerMove(point);
    },
    onPreviewLeave: () => {
      previewController.pointerLeave();
    },
    onPreviewKey: (nodeId) => {
      void openPreview(nodeId, null, true);
    }
  });
  var previewController = createPreviewController({
    delayMs: settings.delayMs,
    enabled: settings.enabled,
    pinByDefault: settings.pinByDefault,
    onShow: (nodeId, anchor) => {
      syncPinButton(previewController.isPinned());
      void openPreview(nodeId, anchor, false);
    },
    onHide: () => {
      hidePreview();
    }
  });
  if (settings.pinByDefault) {
    previewController.setPinned(true);
  }
  syncPinButton(settings.pinByDefault);
  var bridge = createBridge({
    post: (message) => vscodeApi.postMessage(message),
    inboundDirection: DIRECTIONS.HOST_TO_WEBVIEW,
    timeoutMs: 8e3,
    logger: {
      debug: () => {
      },
      warn: (message, fields) => console.warn("[codeflow]", message, fields),
      error: (message, fields) => console.error("[codeflow]", message, fields)
    }
  });
  function setBanner(message, isError = false) {
    if (!message) {
      banner.hidden = true;
      banner.textContent = "";
      return;
    }
    banner.hidden = false;
    banner.classList.toggle("is-error", isError);
    banner.textContent = message;
  }
  function setStatus(text) {
    status.textContent = text;
  }
  function clearDetail() {
    activeNodeId = null;
    detailBody.replaceChildren();
    const paragraph = document.createElement("p");
    paragraph.className = "cf-muted";
    paragraph.textContent = "Select a node to inspect it.";
    detailBody.appendChild(paragraph);
    clearExplanation();
  }
  function clearExplanation() {
    explainNodeRequest += 1;
    if (explainSection) {
      explainSection.hidden = true;
    }
    explainItems?.replaceChildren();
    if (explainEvidence) {
      explainEvidence.hidden = true;
    }
    explainEvidenceList?.replaceChildren();
    if (explainLimits) {
      explainLimits.hidden = true;
    }
    if (explainLimitsText) {
      explainLimitsText.textContent = "";
    }
  }
  function renderNodeExplanation(payload) {
    if (!explainSection || !explainItems) {
      return;
    }
    const items = Array.isArray(payload?.items) ? payload.items : [];
    const limits = Array.isArray(payload?.limitations) ? payload.limitations : [];
    explainItems.replaceChildren();
    if (items.length === 0 && limits.length === 0) {
      explainSection.hidden = true;
      return;
    }
    explainSection.hidden = false;
    const evidenceRefs = [];
    for (const item of items) {
      if (item.ruleId === "fn.limitations") {
        continue;
      }
      const row = document.createElement("p");
      row.className = `cf-explain-item cf-explain--${item.claim ?? "grounded"}`;
      row.textContent = item.text;
      explainItems.appendChild(row);
      for (const ref of item.evidence ?? []) {
        evidenceRefs.push(ref);
      }
    }
    if (explainEvidence && explainEvidenceList) {
      explainEvidenceList.replaceChildren();
      const seen = /* @__PURE__ */ new Set();
      const uniqueRefs = evidenceRefs.filter((ref) => {
        const key = `${ref.kind}:${ref.id}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
      if (explanationSettings.showEvidence && uniqueRefs.length > 0) {
        explainEvidence.hidden = false;
        for (const ref of uniqueRefs.slice(0, 8)) {
          const li = document.createElement("li");
          if (ref.range) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "cf-evidence-link";
            btn.textContent = ref.label || `${ref.kind}: line ${ref.range.startLine + 1}`;
            btn.addEventListener("click", () => {
              void navigateToRange(ref.range);
            });
            li.appendChild(btn);
          } else {
            li.textContent = `${ref.kind}: ${ref.label || ref.id}`;
          }
          explainEvidenceList.appendChild(li);
        }
      } else {
        explainEvidence.hidden = true;
      }
    }
    if (explainLimits && explainLimitsText) {
      if (limits.length > 0) {
        explainLimits.hidden = false;
        explainLimits.open = explanationSettings.includeLimitations;
        explainLimitsText.textContent = limits.join(" ");
      } else {
        explainLimits.hidden = true;
        explainLimitsText.textContent = "";
      }
    }
  }
  async function navigateToRange(range) {
    try {
      const response = await bridge.request("navigate.to", {
        fileId: range.fileId,
        range
      });
      if (response.payload.ok !== true) {
        setBanner(
          `${response.payload.code ?? "E_NAVIGATION"}: ${response.payload.message ?? "Could not open source."}`,
          true
        );
      }
    } catch (error) {
      setBanner(`Could not open source: ${error?.message ?? String(error)}`, true);
    }
  }
  async function loadNodeExplanation(nodeId) {
    if (!currentDto || currentDto.dtoKind !== "cfg" || !explainSection) {
      return;
    }
    const request = ++explainNodeRequest;
    const skeletonTimer = setTimeout(() => {
      if (request === explainNodeRequest && explainSection && explainItems) {
        explainSection.hidden = false;
        explainItems.textContent = "Generating explanation\u2026";
      }
    }, 100);
    try {
      const response = await bridge.request("explain.node", {
        nodeId,
        depth: activeExplainDepth
      });
      clearTimeout(skeletonTimer);
      if (request !== explainNodeRequest || activeNodeId !== nodeId) {
        return;
      }
      renderNodeExplanation(response.payload);
    } catch {
      clearTimeout(skeletonTimer);
      if (request === explainNodeRequest) {
        clearExplanation();
      }
    }
  }
  async function loadFunctionSummary(dto) {
    if (!fnSummary) {
      return;
    }
    if (dto.dtoKind !== "cfg") {
      fnSummary.hidden = true;
      fnSummary.textContent = "";
      return;
    }
    const request = ++explainFunctionRequest;
    try {
      const response = await bridge.request("explain.function", {
        depth: activeExplainDepth
      });
      if (request !== explainFunctionRequest || currentDto !== dto) {
        return;
      }
      const text = [response.payload?.summary, ...response.payload?.limitations ?? []].filter(Boolean).join(" ");
      if (text) {
        fnSummary.textContent = text;
        fnSummary.hidden = false;
      } else {
        fnSummary.hidden = true;
      }
    } catch {
      if (request === explainFunctionRequest) {
        fnSummary.hidden = true;
      }
    }
  }
  function detailPair(label, value) {
    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    description.textContent = value;
    return [term, description];
  }
  function showNodeDetails(nodeId, node) {
    if (!nodeId || !node) {
      clearDetail();
      return;
    }
    activeNodeId = nodeId;
    const list = document.createElement("dl");
    list.append(...detailPair("label", node.label));
    list.append(...detailPair("kind", node.kind));
    list.append(...detailPair("status", node.status));
    if (node.external) {
      list.append(...detailPair("origin", "external target (not declared in the analysis)"));
    }
    if (node.range) {
      list.append(...detailPair("lines", `${node.range.startLine + 1}\u2013${node.range.endLine + 1}`));
      list.append(...detailPair("file", node.range.fileId));
    }
    if (node.badge) {
      list.append(...detailPair("note", node.badge));
    }
    if (node.isSynthetic) {
      list.append(...detailPair("origin", "synthetic structural node"));
    }
    if (node.unreachable) {
      list.append(...detailPair("reachability", "not reachable from entry"));
    }
    if (node.reasonCode) {
      list.append(...detailPair("reason", node.reasonCode));
    }
    if (Array.isArray(node.calls) && node.calls.length > 0) {
      list.append(
        ...detailPair("calls", node.calls.map((call) => `${call.label} (${call.status})`).join(", "))
      );
    }
    const edges = (currentDto?.edges ?? []).filter(
      (edge) => edge.from === nodeId || edge.to === nodeId
    );
    if (edges.length > 0) {
      list.append(...detailPair("relationships", String(edges.length)));
    }
    detailBody.replaceChildren(list);
    if (edges.length > 0) {
      const heading = document.createElement("h3");
      heading.className = "cf-detail-title";
      heading.textContent = "Relationships";
      detailBody.appendChild(heading);
      const edgeList = document.createElement("ul");
      edgeList.className = "cf-legend";
      for (const edge of edges.slice(0, 12)) {
        const item = document.createElement("li");
        const direction = edge.from === nodeId ? "\u2192" : "\u2190";
        const other = edge.from === nodeId ? edge.to : edge.from;
        item.textContent = `${direction} ${edge.type} \xB7 ${other} (${edge.status})`;
        edgeList.appendChild(item);
      }
      detailBody.appendChild(edgeList);
    }
    void loadNodeExplanation(nodeId);
    syncCallNodeButtons(node);
  }
  function syncCallNodeButtons(node) {
    if (!callsExpandBtn || !callsCollapseBtn || !callsFocusBtn) {
      return;
    }
    const isCallGraph = currentDto?.dtoKind === "call_graph";
    if (!isCallGraph || !node || node.kind === "unresolved_bucket") {
      callsExpandBtn.disabled = true;
      callsCollapseBtn.disabled = true;
      return;
    }
    callsExpandBtn.disabled = Boolean(node.expanded);
    callsCollapseBtn.disabled = !node.expanded || Boolean(node.isCenter);
  }
  async function updateCallGraphSidePanel(dto) {
    if (!callsPanel) {
      return;
    }
    if (dto.dtoKind !== "call_graph") {
      callsPanel.hidden = true;
      if (scopeBanner) {
        scopeBanner.hidden = true;
      }
      return;
    }
    callsPanel.hidden = false;
    if (scopeBanner) {
      scopeBanner.textContent = dto.scopeBanner || "";
      scopeBanner.hidden = !dto.scopeBanner;
    }
    if (callsFocusBtn) {
      const focused = Boolean(dto.focusedNodeId);
      callsFocusBtn.setAttribute("aria-pressed", focused ? "true" : "false");
      callsFocusBtn.textContent = focused ? "Unfocus" : "Focus";
    }
    if (unresolvedBucketDetails && unresolvedSummary && unresolvedList) {
      const bucket = dto.unresolvedBucket;
      if (bucket && bucket.count > 0) {
        unresolvedBucketDetails.hidden = false;
        unresolvedSummary.textContent = `${bucket.count} unresolved target${bucket.count === 1 ? "" : "s"}`;
        unresolvedList.replaceChildren();
        for (const reason of bucket.reasons ?? []) {
          const li = document.createElement("li");
          li.textContent = `${reason.reasonCode}: ${reason.count} site${reason.count === 1 ? "" : "s"}`;
          unresolvedList.appendChild(li);
        }
      } else {
        unresolvedBucketDetails.hidden = true;
      }
    }
    if (dto.centerSymbolId) {
      callersNextCursor = void 0;
      calleesNextCursor = void 0;
      callersList?.replaceChildren();
      calleesList?.replaceChildren();
      await Promise.all([
        loadNeighborPage("incoming", dto.centerSymbolId, false),
        loadNeighborPage("outgoing", dto.centerSymbolId, false)
      ]);
    }
  }
  async function loadNeighborPage(direction, symbolId, append) {
    const kind = direction === "incoming" ? "calls.incoming" : "calls.outgoing";
    const cursor = direction === "incoming" ? callersNextCursor : calleesNextCursor;
    const listEl = direction === "incoming" ? callersList : calleesList;
    const headingEl = direction === "incoming" ? callersHeading : calleesHeading;
    const moreBtn = direction === "incoming" ? callersMoreBtn : calleesMoreBtn;
    if (!listEl) {
      return;
    }
    try {
      const response = await bridge.request(kind, {
        symbolId,
        limit: 50,
        ...append && cursor ? { cursor } : {}
      });
      const payload = response.payload ?? {};
      if (!append) {
        listEl.replaceChildren();
      }
      if (headingEl) {
        headingEl.textContent = direction === "incoming" ? `Callers (${payload.total ?? 0})` : `Callees (${payload.total ?? 0})`;
      }
      for (const item of payload.items ?? []) {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cf-evidence-link";
        btn.textContent = `${item.displayName} (${item.status}${item.callSiteCount > 1 ? ` \xD7${item.callSiteCount}` : ""})`;
        btn.addEventListener("click", () => {
          renderer.select(item.symbolId);
        });
        li.appendChild(btn);
        listEl.appendChild(li);
      }
      if (direction === "incoming") {
        callersNextCursor = payload.nextCursor;
      } else {
        calleesNextCursor = payload.nextCursor;
      }
      if (moreBtn) {
        moreBtn.hidden = !payload.nextCursor;
      }
    } catch {
      if (moreBtn) {
        moreBtn.hidden = true;
      }
    }
  }
  function applySettings(next) {
    const previousMaxLines = settings.maxLines;
    settings = resolvePreviewSettings({ ...settings, ...next });
    if (next?.explanation && typeof next.explanation === "object") {
      explanationSettings = resolveExplanationSettings(next.explanation);
      activeExplainDepth = explanationSettings.defaultDepth;
      if (explainDepthSelect) {
        explainDepthSelect.value = String(activeExplainDepth);
      }
      if (activeNodeId) {
        void loadNodeExplanation(activeNodeId);
      }
      if (currentDto?.dtoKind === "cfg") {
        void loadFunctionSummary(currentDto);
      }
    }
    previewController.configure({
      delayMs: settings.delayMs,
      enabled: settings.enabled,
      pinByDefault: settings.pinByDefault
    });
    if (settings.maxLines !== previousMaxLines) {
      previewCache.clear();
    }
    if (!settings.enabled) {
      previewController.dismiss();
      hidePreview();
    }
  }
  function syncPinButton(pinned) {
    previewPin.setAttribute("aria-pressed", pinned ? "true" : "false");
    previewPin.textContent = pinned ? "Pinned" : "Pin";
  }
  function nodeById(nodeId) {
    return currentDto?.nodes.find((node) => node.id === nodeId) ?? null;
  }
  function positionPreview(anchor) {
    const wrap = svg.parentElement?.getBoundingClientRect();
    if (!wrap) {
      return;
    }
    const point = anchor ?? {
      x: wrap.left + 24,
      y: wrap.top + 72
    };
    const width = Math.min(380, Math.max(260, wrap.width - 32));
    const maxLeft = Math.max(8, wrap.width - width - 8);
    const left = Math.max(8, Math.min(maxLeft, point.x - wrap.left + 14));
    const top = Math.max(8, Math.min(Math.max(8, wrap.height - 220), point.y - wrap.top + 14));
    preview.style.width = `${width}px`;
    preview.style.left = `${left}px`;
    preview.style.top = `${top}px`;
  }
  function renderPreviewCard(node, slice) {
    const model = buildPreviewModel({
      node,
      slice,
      maxLines: settings.maxLines
    });
    previewTitle.textContent = `${model.kind} \xB7 ${model.title}`;
    previewMeta.textContent = [
      model.file,
      `lines ${model.lineLabel}`,
      model.integrity !== "exact" ? model.integrity : model.documentVersion ? `v${model.documentVersion}` : ""
    ].filter(Boolean).join(" \xB7 ");
    previewBody.replaceChildren();
    if (!model.synthetic && !model.empty) {
      const language = typeof slice?.languageId === "string" ? slice.languageId : node.range?.fileId ?? "";
      const rendered = settings.syntaxHighlighting ? highlightLines(model.text, language) : highlightLines(model.text, "");
      const firstLine = Number(slice?.lines?.startLine ?? node.range?.startLine ?? 0) + 1;
      const code = document.createElement("div");
      code.className = "cf-preview-code";
      for (const [index, tokens] of rendered.lines.entries()) {
        const line = document.createElement("div");
        line.className = "cf-preview-line";
        const number = document.createElement("span");
        number.className = "cf-preview-line-number";
        number.textContent = String(firstLine + index);
        const content = document.createElement("span");
        content.className = "cf-preview-line-text";
        for (const token of tokens) {
          const span = document.createElement("span");
          if (token.className) {
            span.className = token.className;
          }
          span.textContent = token.text;
          content.appendChild(span);
        }
        line.append(number, content);
        code.appendChild(line);
      }
      previewBody.appendChild(code);
      if (rendered.degraded) {
        previewBody.classList.add("is-plain");
      } else {
        previewBody.classList.remove("is-plain");
      }
    }
    const notes = [];
    if (model.message) {
      notes.push(model.message);
    }
    if (model.truncated) {
      notes.push(`Preview truncated to ${settings.maxLines} lines.`);
    }
    previewNote.textContent = notes.join(" ");
    const canOpen = !model.synthetic && !model.empty && model.integrity === "exact";
    previewBody.classList.toggle("is-clickable", Boolean(settings.clickToNavigate && canOpen));
    previewOpen.disabled = !canOpen;
    preview.classList.toggle("is-stale", model.stale);
    preview.classList.toggle("is-synthetic", model.synthetic);
    preview.hidden = false;
    positionPreview(previewAnchor);
  }
  function hidePreview() {
    previewRequest += 1;
    previewNodeId = null;
    previewAnchor = null;
    preview.hidden = true;
    if (previewExplain) {
      previewExplain.hidden = true;
      previewExplain.textContent = "";
    }
    previewBody.replaceChildren();
    previewNote.textContent = "";
    syncPinButton(false);
  }
  async function openPreview(nodeId, anchor = null, pin = false) {
    const node = nodeById(nodeId);
    if (!node) {
      return;
    }
    previewNodeId = nodeId;
    previewAnchor = anchor;
    if (pin) {
      previewController.setPinned(true);
      syncPinButton(true);
      preview.focus();
    }
    if (node.isSynthetic || !node.range) {
      renderPreviewCard(node, null);
      return;
    }
    if (previewExplain && currentDto?.dtoKind === "cfg") {
      const requestForExplain = previewRequest + 1;
      void bridge.request("explain.node", { nodeId, depth: 1 }).then((res) => {
        if (previewNodeId === nodeId && previewRequest <= requestForExplain && res.payload?.summary) {
          previewExplain.textContent = res.payload.summary;
          previewExplain.hidden = false;
        }
      }).catch(() => {
      });
    }
    const key = `${nodeId}|${settings.maxLines}`;
    const cached = previewCache.get(key);
    if (cached) {
      renderPreviewCard(node, cached);
      return;
    }
    const request = ++previewRequest;
    try {
      const response = await bridge.request("source.slice", {
        fileId: node.range.fileId,
        range: node.range,
        maxLines: settings.maxLines
      });
      if (request !== previewRequest || previewNodeId !== nodeId) {
        return;
      }
      const slice = response.payload.slice ?? null;
      previewCache.set(key, slice);
      if (slice?.integrity && slice.integrity !== "exact") {
        integrityByNode.set(nodeId, slice.integrity);
        renderer.markStale([nodeId]);
      }
      renderPreviewCard(node, slice);
    } catch (error) {
      if (request !== previewRequest) {
        return;
      }
      renderPreviewCard(node, {
        text: "",
        relativePath: "",
        integrity: "missing",
        reason: error?.message ?? String(error)
      });
    }
  }
  async function navigateTo(nodeId, node = nodeById(nodeId)) {
    if (!node?.range || node.isSynthetic) {
      setBanner("This node has no source to open.", false);
      return;
    }
    try {
      const response = await bridge.request("navigate.to", {
        fileId: node.range.fileId,
        range: node.range,
        nodeId
      });
      if (response.payload.ok !== true) {
        setBanner(
          `${response.payload.code ?? "E_NAVIGATION"}: ${response.payload.message ?? "Could not open source."}`,
          true
        );
      }
    } catch (error) {
      setBanner(`Could not open source: ${error?.message ?? String(error)}`, true);
    }
  }
  async function validateGraph(dto) {
    integrityByNode = /* @__PURE__ */ new Map();
    const ranges = dto.nodes.filter((node) => node.range && !node.isSynthetic).map((node) => ({ nodeId: node.id, ...node.range }));
    if (ranges.length === 0) {
      return;
    }
    try {
      const response = await bridge.request("source.validation", {
        ranges: ranges.map(({ nodeId: _nodeId, ...range }) => range)
      });
      const results = Array.isArray(response.payload.results) ? response.payload.results : [];
      const stale = [];
      for (const [index, result] of results.entries()) {
        const nodeId = ranges[index]?.nodeId;
        if (!nodeId) {
          continue;
        }
        integrityByNode.set(nodeId, result.integrity ?? "missing");
        if (result.integrity !== "exact") {
          stale.push(nodeId);
        }
      }
      if (stale.length > 0) {
        renderer.markStale(stale);
        setBanner(
          `${stale.length} node${stale.length === 1 ? "" : "s"} reference changed or missing source. Preview marks them stale; re-analyze before trusting them.`,
          false
        );
      }
    } catch {
    }
  }
  function markStaleFiles(fileIds) {
    const wanted = new Set(Array.isArray(fileIds) ? fileIds : []);
    if (!currentDto || wanted.size === 0) {
      return;
    }
    const stale = currentDto.nodes.filter((node) => node.range && wanted.has(node.range.fileId)).map((node) => node.id);
    if (stale.length === 0) {
      return;
    }
    previewCache.clear();
    for (const nodeId of stale) {
      integrityByNode.set(nodeId, "stale");
    }
    renderer.markStale(stale);
    previewController.dismiss();
    hidePreview();
    setBanner(
      `Source changed for ${stale.length} node${stale.length === 1 ? "" : "s"}. Previews are stale; re-analyze before trusting them.`,
      false
    );
  }
  function renderLegend(dto) {
    legend.replaceChildren();
    for (const statusName of dto.legend.statuses) {
      const item = document.createElement("li");
      const swatch = document.createElement("span");
      swatch.className = `cf-swatch cf-edge--${statusName}`;
      const label = document.createElement("span");
      label.textContent = statusName;
      if (statusName !== "resolved") {
        label.textContent = `${statusName} (pattern + label)`;
      }
      item.append(swatch, label);
      legend.appendChild(item);
    }
    for (const edgeKind of dto.legend.edgeKinds ?? []) {
      const item = document.createElement("li");
      const swatch = document.createElement("span");
      swatch.className = `cf-swatch cf-edge--kind-${edgeKind}`;
      const label = document.createElement("span");
      label.textContent = `edge: ${edgeKind}`;
      item.append(swatch, label);
      legend.appendChild(item);
    }
  }
  function renderFunctionPicker(list) {
    if (!functionPicker) {
      return;
    }
    functionPicker.replaceChildren();
    for (const entry of list) {
      const option = document.createElement("option");
      option.value = entry.symbolId;
      option.textContent = `${entry.qualifiedName} (${entry.kind})`;
      functionPicker.appendChild(option);
    }
    functionPicker.hidden = list.length <= 1;
    if (selectedSymbolId) {
      functionPicker.value = selectedSymbolId;
    }
  }
  function showCapabilities(payload) {
    const adapters = Array.isArray(payload.adapters) ? payload.adapters : [];
    const names = adapters.map((adapter) => adapter.id).join(", ") || "none";
    meta.textContent = `Mock data \xB7 adapters: ${names} \xB7 protocol v${payload.protocolVersion ?? "?"}`;
    if (payload?.settings && typeof payload.settings === "object") {
      applySettings(payload.settings);
    }
  }
  function handleGraph(payload) {
    const dtoCandidate = (
      /** @type {{dto?: unknown}} */
      payload.dto
    );
    const validation = validateDto(dtoCandidate);
    if (!validation.ok) {
      setBanner(`Invalid graph payload: ${validation.issues[0]}`, true);
      setStatus("Render failed");
      return;
    }
    const dto = validation.dto;
    currentDto = dto;
    previewCache.clear();
    integrityByNode = /* @__PURE__ */ new Map();
    hidePreview();
    empty.hidden = true;
    renderer.render(dto);
    renderLegend(dto);
    clearDetail();
    void validateGraph(dto);
    void loadFunctionSummary(dto);
    void updateCallGraphSidePanel(dto);
    if (switchPerspectiveBtn) {
      switchPerspectiveBtn.hidden = !selectedSymbolId;
      switchPerspectiveBtn.textContent = dto.dtoKind === "call_graph" ? "Show in CFG" : "Show in Call Graph";
    }
    const subject = dto.dtoKind === "cfg" && dto.function ? `${dto.function.qualifiedName} \xB7 CFG` : dto.dtoKind === "call_graph" ? `${dto.centerSymbolId} \xB7 Call Graph` : "call graph";
    setStatus(
      `${subject} \xB7 ${dto.language} \xB7 ${dto.nodes.length} nodes \xB7 ${dto.edges.length} edges \xB7 ${dto.completeness}`
    );
    meta.textContent = `${dto.adapterId} \xB7 ${subject} \xB7 dto v${dto.dtoVersion}`;
    const degradations = dto.degradations ?? [];
    const messages = degradations.map(
      (entry) => typeof entry === "string" ? entry : `${entry.severity === "info" ? "" : `${entry.severity}: `}${entry.message}`
    );
    setBanner(messages.length > 0 ? messages.join(" \xB7 ") : "", false);
  }
  bridge.on("protocol.error", (payload) => {
    const code = typeof payload.code === "string" ? payload.code : "E_PROTOCOL";
    const message = typeof payload.message === "string" ? payload.message : "Unknown error.";
    setBanner(`${code}: ${message}`, true);
    setStatus("Error");
  });
  bridge.on("settings.data", (payload) => {
    const next = payload?.settings;
    if (next && typeof next === "object") {
      applySettings(next);
    }
  });
  bridge.on("source.stale", (payload) => {
    markStaleFiles(Array.isArray(payload?.fileIds) ? payload.fileIds : []);
  });
  bridge.on("selection.changed", (payload) => {
    const nodeIds = Array.isArray(payload?.nodeIds) ? payload.nodeIds : [];
    renderer.highlight(nodeIds);
    const activeNodeId2 = typeof payload?.activeNodeId === "string" ? payload.activeNodeId : null;
    if (activeNodeId2) {
      const node = nodeById(activeNodeId2);
      if (node) {
        showNodeDetails(activeNodeId2, node);
      }
    }
  });
  bridge.on("graph.focus", (payload) => {
    if (typeof payload?.nodeId === "string") {
      const node = nodeById(payload.nodeId);
      if (node) {
        renderer.select(payload.nodeId);
        showNodeDetails(payload.nodeId, node);
      }
    }
    svg.focus?.();
  });
  preview.addEventListener("pointerenter", () => {
    previewController.pointerEnterCard();
  });
  preview.addEventListener("pointerleave", () => {
    previewController.pointerLeaveCard();
  });
  previewPin.addEventListener("click", () => {
    syncPinButton(previewController.togglePin());
  });
  previewClose.addEventListener("click", () => {
    previewController.dismiss();
    hidePreview();
  });
  previewOpen.addEventListener("click", () => {
    if (previewNodeId) {
      void navigateTo(previewNodeId);
    }
  });
  previewBody.addEventListener("click", () => {
    if (settings.clickToNavigate && previewNodeId && !previewOpen.disabled) {
      void navigateTo(previewNodeId);
    }
  });
  preview.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      previewController.dismiss();
      hidePreview();
      renderer.focusSelection();
    }
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !preview.hidden) {
      previewController.dismiss();
      hidePreview();
    }
  });
  async function loadCfg(symbolId) {
    setStatus("Building control-flow graph\u2026");
    setBanner("");
    try {
      const response = await bridge.request("cfg.load", { symbolId });
      selectedSymbolId = symbolId;
      handleGraph(response.payload);
      return true;
    } catch (error) {
      setBanner(`Could not build CFG: ${error?.message ?? String(error)}`, true);
      setStatus("CFG unavailable");
      return false;
    }
  }
  async function loadCallGraph(symbolId) {
    setStatus("Building call graph\u2026");
    setBanner("");
    try {
      const response = await bridge.request("calls.load", { symbolId });
      selectedSymbolId = symbolId;
      activePerspective = "call_graph";
      if (perspectiveSelect) {
        perspectiveSelect.value = "call_graph";
      }
      handleGraph(response.payload);
      return true;
    } catch (error) {
      setBanner(`Could not build call graph: ${error?.message ?? String(error)}`, true);
      setStatus("Call graph unavailable");
      return false;
    }
  }
  async function loadGraph() {
    setStatus("Loading graph\u2026");
    setBanner("");
    try {
      const response = await bridge.request("cfg.functions", {});
      const list = Array.isArray(response.payload.functions) ? response.payload.functions : [];
      if (list.length > 0) {
        renderFunctionPicker(list);
        const retained = selectedSymbolId && list.some((entry) => entry.symbolId === selectedSymbolId) ? selectedSymbolId : list[0].symbolId;
        const loaded = activePerspective === "call_graph" ? await loadCallGraph(retained) : await loadCfg(retained);
        if (loaded) {
          return;
        }
      }
    } catch {
    }
    try {
      const response = await bridge.request("graph.load", { demo: true });
      handleGraph(response.payload);
    } catch (error) {
      setBanner(`Could not load graph: ${error?.message ?? String(error)}`, true);
      setStatus("Load failed");
      empty.hidden = false;
    }
  }
  reloadButton.addEventListener("click", () => {
    void loadGraph();
  });
  functionPicker?.addEventListener("change", () => {
    const symbolId = functionPicker.value;
    if (symbolId) {
      if (activePerspective === "call_graph") {
        void loadCallGraph(symbolId);
      } else {
        void loadCfg(symbolId);
      }
    }
  });
  perspectiveSelect?.addEventListener("change", () => {
    activePerspective = perspectiveSelect.value === "call_graph" ? "call_graph" : "cfg";
    if (selectedSymbolId) {
      if (activePerspective === "call_graph") {
        void loadCallGraph(selectedSymbolId);
      } else {
        void loadCfg(selectedSymbolId);
      }
    }
  });
  switchPerspectiveBtn?.addEventListener("click", () => {
    const targetSymbol = activeNodeId && currentDto?.dtoKind === "call_graph" && !activeNodeId.startsWith("bucket:") ? activeNodeId : selectedSymbolId;
    if (!targetSymbol) {
      return;
    }
    if (currentDto?.dtoKind === "call_graph") {
      activePerspective = "cfg";
      if (perspectiveSelect) {
        perspectiveSelect.value = "cfg";
      }
      void loadCfg(targetSymbol);
    } else {
      activePerspective = "call_graph";
      if (perspectiveSelect) {
        perspectiveSelect.value = "call_graph";
      }
      void loadCallGraph(targetSymbol);
    }
  });
  callsExpandBtn?.addEventListener("click", async () => {
    if (!activeNodeId || currentDto?.dtoKind !== "call_graph") {
      return;
    }
    try {
      const res = await bridge.request("calls.expand", { symbolId: activeNodeId });
      handleGraph(res.payload);
    } catch (error) {
      setBanner(`Expand failed: ${error?.message ?? String(error)}`, true);
    }
  });
  callsCollapseBtn?.addEventListener("click", async () => {
    if (!activeNodeId || currentDto?.dtoKind !== "call_graph") {
      return;
    }
    try {
      const res = await bridge.request("calls.collapse", { symbolId: activeNodeId });
      handleGraph(res.payload);
    } catch (error) {
      setBanner(`Collapse failed: ${error?.message ?? String(error)}`, true);
    }
  });
  callsFocusBtn?.addEventListener("click", async () => {
    if (currentDto?.dtoKind !== "call_graph") {
      return;
    }
    const nextFocus = currentDto.focusedNodeId ? null : activeNodeId ?? currentDto.centerSymbolId;
    try {
      const res = await bridge.request("calls.focus", { symbolId: nextFocus });
      handleGraph(res.payload);
    } catch (error) {
      setBanner(`Focus failed: ${error?.message ?? String(error)}`, true);
    }
  });
  callsFilterStatus?.addEventListener("change", async () => {
    if (currentDto?.dtoKind !== "call_graph") {
      return;
    }
    const value = callsFilterStatus.value;
    const statuses = value === "all" ? null : value.split(",");
    try {
      const res = await bridge.request("calls.filter", { statuses });
      handleGraph(res.payload);
    } catch (error) {
      setBanner(`Filter failed: ${error?.message ?? String(error)}`, true);
    }
  });
  callersMoreBtn?.addEventListener("click", () => {
    if (currentDto?.centerSymbolId) {
      void loadNeighborPage("incoming", currentDto.centerSymbolId, true);
    }
  });
  calleesMoreBtn?.addEventListener("click", () => {
    if (currentDto?.centerSymbolId) {
      void loadNeighborPage("outgoing", currentDto.centerSymbolId, true);
    }
  });
  explainDepthSelect?.addEventListener("change", () => {
    activeExplainDepth = clampExplanationDepth(explainDepthSelect.value);
    if (activeNodeId) {
      void loadNodeExplanation(activeNodeId);
    }
    if (currentDto?.dtoKind === "cfg") {
      void loadFunctionSummary(currentDto);
    }
  });
  window.addEventListener("error", (event) => {
    setBanner(`Webview error: ${event.message}`, true);
  });
  window.addEventListener("unhandledrejection", (event) => {
    setBanner(`Unhandled rejection: ${String(event.reason)}`, true);
  });
  async function boot() {
    try {
      const response = await bridge.request("webview.ready", {
        client: "webview",
        protocolVersion: PROTOCOL_VERSION
      });
      showCapabilities(response.payload);
    } catch {
    }
    await loadGraph();
  }
  void boot();
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vbm9kZV9tb2R1bGVzL2hpZ2hsaWdodC5qcy9saWIvY29yZS5qcyIsICIuLi8uLi9zcmMvY29yZS9wcm90b2NvbC9lbnZlbG9wZS5qcyIsICIuLi8uLi9zcmMvY29yZS9wcm90b2NvbC9icmlkZ2UuanMiLCAiLi4vLi4vc3JjL2NvcmUvZ3JhcGgvbGF5b3V0LmpzIiwgIi4uLy4uL3NyYy9jb3JlL2dyYXBoL2NmZy9raW5kcy5qcyIsICIuLi8uLi9zcmMvY29yZS9ncmFwaC9jYWxscy9raW5kcy5qcyIsICIuLi8uLi9zcmMvY29yZS9ncmFwaC96b29tL2xldmVscy5qcyIsICIuLi8uLi9zcmMvY29yZS9ncmFwaC9kdG8uanMiLCAiLi4vLi4vc3JjL3Zpc3VhbGl6YXRpb24vcmVuZGVyZXIvc3ZnUmVuZGVyZXIuanMiLCAiLi4vLi4vc3JjL2NvcmUvc291cmNlL3Jhbmdlcy5qcyIsICIuLi8uLi9zcmMvY29yZS9zb3VyY2UvcHJlc2VudGF0aW9uLmpzIiwgIi4uLy4uL3NyYy9jb3JlL3NvdXJjZS9zZXR0aW5ncy5qcyIsICIuLi8uLi9zcmMvY29yZS9leHBsYW5hdGlvbi9zZXR0aW5ncy5qcyIsICIuLi8uLi9zcmMvd2Vidmlldy9wcmV2aWV3Q29udHJvbGxlci5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvaGlnaGxpZ2h0LmpzL2VzL2NvcmUuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2hpZ2hsaWdodC5qcy9lcy9sYW5ndWFnZXMvY3BwLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9oaWdobGlnaHQuanMvZXMvbGFuZ3VhZ2VzL2phdmFzY3JpcHQuanMiLCAiLi4vLi4vc3JjL3dlYnZpZXcvaGlnaGxpZ2h0LmpzIiwgIi4uLy4uL3NyYy93ZWJ2aWV3L21haW4uanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qIGVzbGludC1kaXNhYmxlIG5vLW11bHRpLWFzc2lnbiAqL1xuXG5mdW5jdGlvbiBkZWVwRnJlZXplKG9iaikge1xuICBpZiAob2JqIGluc3RhbmNlb2YgTWFwKSB7XG4gICAgb2JqLmNsZWFyID1cbiAgICAgIG9iai5kZWxldGUgPVxuICAgICAgb2JqLnNldCA9XG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21hcCBpcyByZWFkLW9ubHknKTtcbiAgICAgICAgfTtcbiAgfSBlbHNlIGlmIChvYmogaW5zdGFuY2VvZiBTZXQpIHtcbiAgICBvYmouYWRkID1cbiAgICAgIG9iai5jbGVhciA9XG4gICAgICBvYmouZGVsZXRlID1cbiAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignc2V0IGlzIHJlYWQtb25seScpO1xuICAgICAgICB9O1xuICB9XG5cbiAgLy8gRnJlZXplIHNlbGZcbiAgT2JqZWN0LmZyZWV6ZShvYmopO1xuXG4gIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG9iaikuZm9yRWFjaCgobmFtZSkgPT4ge1xuICAgIGNvbnN0IHByb3AgPSBvYmpbbmFtZV07XG4gICAgY29uc3QgdHlwZSA9IHR5cGVvZiBwcm9wO1xuXG4gICAgLy8gRnJlZXplIHByb3AgaWYgaXQgaXMgYW4gb2JqZWN0IG9yIGZ1bmN0aW9uIGFuZCBhbHNvIG5vdCBhbHJlYWR5IGZyb3plblxuICAgIGlmICgodHlwZSA9PT0gJ29iamVjdCcgfHwgdHlwZSA9PT0gJ2Z1bmN0aW9uJykgJiYgIU9iamVjdC5pc0Zyb3plbihwcm9wKSkge1xuICAgICAgZGVlcEZyZWV6ZShwcm9wKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBvYmo7XG59XG5cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5DYWxsYmFja1Jlc3BvbnNlfSBDYWxsYmFja1Jlc3BvbnNlICovXG4vKiogQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQ29tcGlsZWRNb2RlfSBDb21waWxlZE1vZGUgKi9cbi8qKiBAaW1wbGVtZW50cyBDYWxsYmFja1Jlc3BvbnNlICovXG5cbmNsYXNzIFJlc3BvbnNlIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7Q29tcGlsZWRNb2RlfSBtb2RlXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihtb2RlKSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmaW5lZFxuICAgIGlmIChtb2RlLmRhdGEgPT09IHVuZGVmaW5lZCkgbW9kZS5kYXRhID0ge307XG5cbiAgICB0aGlzLmRhdGEgPSBtb2RlLmRhdGE7XG4gICAgdGhpcy5pc01hdGNoSWdub3JlZCA9IGZhbHNlO1xuICB9XG5cbiAgaWdub3JlTWF0Y2goKSB7XG4gICAgdGhpcy5pc01hdGNoSWdub3JlZCA9IHRydWU7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVzY2FwZUhUTUwodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlXG4gICAgLnJlcGxhY2UoLyYvZywgJyZhbXA7JylcbiAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXG4gICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKVxuICAgIC5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7JylcbiAgICAucmVwbGFjZSgvJy9nLCAnJiN4Mjc7Jyk7XG59XG5cbi8qKlxuICogcGVyZm9ybXMgYSBzaGFsbG93IG1lcmdlIG9mIG11bHRpcGxlIG9iamVjdHMgaW50byBvbmVcbiAqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtUfSBvcmlnaW5hbFxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLGFueT5bXX0gb2JqZWN0c1xuICogQHJldHVybnMge1R9IGEgc2luZ2xlIG5ldyBvYmplY3RcbiAqL1xuZnVuY3Rpb24gaW5oZXJpdCQxKG9yaWdpbmFsLCAuLi5vYmplY3RzKSB7XG4gIC8qKiBAdHlwZSBSZWNvcmQ8c3RyaW5nLGFueT4gKi9cbiAgY29uc3QgcmVzdWx0ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICBmb3IgKGNvbnN0IGtleSBpbiBvcmlnaW5hbCkge1xuICAgIHJlc3VsdFtrZXldID0gb3JpZ2luYWxba2V5XTtcbiAgfVxuICBvYmplY3RzLmZvckVhY2goZnVuY3Rpb24ob2JqKSB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gb2JqKSB7XG4gICAgICByZXN1bHRba2V5XSA9IG9ialtrZXldO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiAvKiogQHR5cGUge1R9ICovIChyZXN1bHQpO1xufVxuXG4vKipcbiAqIEB0eXBlZGVmIHtvYmplY3R9IFJlbmRlcmVyXG4gKiBAcHJvcGVydHkgeyh0ZXh0OiBzdHJpbmcpID0+IHZvaWR9IGFkZFRleHRcbiAqIEBwcm9wZXJ0eSB7KG5vZGU6IE5vZGUpID0+IHZvaWR9IG9wZW5Ob2RlXG4gKiBAcHJvcGVydHkgeyhub2RlOiBOb2RlKSA9PiB2b2lkfSBjbG9zZU5vZGVcbiAqIEBwcm9wZXJ0eSB7KCkgPT4gc3RyaW5nfSB2YWx1ZVxuICovXG5cbi8qKiBAdHlwZWRlZiB7e3Njb3BlPzogc3RyaW5nLCBsYW5ndWFnZT86IHN0cmluZywgc3VibGFuZ3VhZ2U/OiBib29sZWFufX0gTm9kZSAqL1xuLyoqIEB0eXBlZGVmIHt7d2FsazogKHI6IFJlbmRlcmVyKSA9PiB2b2lkfX0gVHJlZSAqL1xuLyoqICovXG5cbmNvbnN0IFNQQU5fQ0xPU0UgPSAnPC9zcGFuPic7XG5cbi8qKlxuICogRGV0ZXJtaW5lcyBpZiBhIG5vZGUgbmVlZHMgdG8gYmUgd3JhcHBlZCBpbiA8c3Bhbj5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGUgKi9cbmNvbnN0IGVtaXRzV3JhcHBpbmdUYWdzID0gKG5vZGUpID0+IHtcbiAgLy8gcmFyZWx5IHdlIGNhbiBoYXZlIGEgc3VibGFuZ3VhZ2Ugd2hlcmUgbGFuZ3VhZ2UgaXMgdW5kZWZpbmVkXG4gIC8vIFRPRE86IHRyYWNrIGRvd24gd2h5XG4gIHJldHVybiAhIW5vZGUuc2NvcGU7XG59O1xuXG4vKipcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHBhcmFtIHt7cHJlZml4OnN0cmluZ319IG9wdGlvbnNcbiAqL1xuY29uc3Qgc2NvcGVUb0NTU0NsYXNzID0gKG5hbWUsIHsgcHJlZml4IH0pID0+IHtcbiAgLy8gc3ViLWxhbmd1YWdlXG4gIGlmIChuYW1lLnN0YXJ0c1dpdGgoXCJsYW5ndWFnZTpcIikpIHtcbiAgICByZXR1cm4gbmFtZS5yZXBsYWNlKFwibGFuZ3VhZ2U6XCIsIFwibGFuZ3VhZ2UtXCIpO1xuICB9XG4gIC8vIHRpZXJlZCBzY29wZTogY29tbWVudC5saW5lXG4gIGlmIChuYW1lLmluY2x1ZGVzKFwiLlwiKSkge1xuICAgIGNvbnN0IHBpZWNlcyA9IG5hbWUuc3BsaXQoXCIuXCIpO1xuICAgIHJldHVybiBbXG4gICAgICBgJHtwcmVmaXh9JHtwaWVjZXMuc2hpZnQoKX1gLFxuICAgICAgLi4uKHBpZWNlcy5tYXAoKHgsIGkpID0+IGAke3h9JHtcIl9cIi5yZXBlYXQoaSArIDEpfWApKVxuICAgIF0uam9pbihcIiBcIik7XG4gIH1cbiAgLy8gc2ltcGxlIHNjb3BlXG4gIHJldHVybiBgJHtwcmVmaXh9JHtuYW1lfWA7XG59O1xuXG4vKiogQHR5cGUge1JlbmRlcmVyfSAqL1xuY2xhc3MgSFRNTFJlbmRlcmVyIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgSFRNTFJlbmRlcmVyXG4gICAqXG4gICAqIEBwYXJhbSB7VHJlZX0gcGFyc2VUcmVlIC0gdGhlIHBhcnNlIHRyZWUgKG11c3Qgc3VwcG9ydCBgd2Fsa2AgQVBJKVxuICAgKiBAcGFyYW0ge3tjbGFzc1ByZWZpeDogc3RyaW5nfX0gb3B0aW9uc1xuICAgKi9cbiAgY29uc3RydWN0b3IocGFyc2VUcmVlLCBvcHRpb25zKSB7XG4gICAgdGhpcy5idWZmZXIgPSBcIlwiO1xuICAgIHRoaXMuY2xhc3NQcmVmaXggPSBvcHRpb25zLmNsYXNzUHJlZml4O1xuICAgIHBhcnNlVHJlZS53YWxrKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGV4dHMgdG8gdGhlIG91dHB1dCBzdHJlYW1cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRleHQgKi9cbiAgYWRkVGV4dCh0ZXh0KSB7XG4gICAgdGhpcy5idWZmZXIgKz0gZXNjYXBlSFRNTCh0ZXh0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgbm9kZSBvcGVuIHRvIHRoZSBvdXRwdXQgc3RyZWFtIChpZiBuZWVkZWQpXG4gICAqXG4gICAqIEBwYXJhbSB7Tm9kZX0gbm9kZSAqL1xuICBvcGVuTm9kZShub2RlKSB7XG4gICAgaWYgKCFlbWl0c1dyYXBwaW5nVGFncyhub2RlKSkgcmV0dXJuO1xuXG4gICAgY29uc3QgY2xhc3NOYW1lID0gc2NvcGVUb0NTU0NsYXNzKG5vZGUuc2NvcGUsXG4gICAgICB7IHByZWZpeDogdGhpcy5jbGFzc1ByZWZpeCB9KTtcbiAgICB0aGlzLnNwYW4oY2xhc3NOYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgbm9kZSBjbG9zZSB0byB0aGUgb3V0cHV0IHN0cmVhbSAoaWYgbmVlZGVkKVxuICAgKlxuICAgKiBAcGFyYW0ge05vZGV9IG5vZGUgKi9cbiAgY2xvc2VOb2RlKG5vZGUpIHtcbiAgICBpZiAoIWVtaXRzV3JhcHBpbmdUYWdzKG5vZGUpKSByZXR1cm47XG5cbiAgICB0aGlzLmJ1ZmZlciArPSBTUEFOX0NMT1NFO1xuICB9XG5cbiAgLyoqXG4gICAqIHJldHVybnMgdGhlIGFjY3VtdWxhdGVkIGJ1ZmZlclxuICAqL1xuICB2YWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5idWZmZXI7XG4gIH1cblxuICAvLyBoZWxwZXJzXG5cbiAgLyoqXG4gICAqIEJ1aWxkcyBhIHNwYW4gZWxlbWVudFxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lICovXG4gIHNwYW4oY2xhc3NOYW1lKSB7XG4gICAgdGhpcy5idWZmZXIgKz0gYDxzcGFuIGNsYXNzPVwiJHtjbGFzc05hbWV9XCI+YDtcbiAgfVxufVxuXG4vKiogQHR5cGVkZWYge3tzY29wZT86IHN0cmluZywgbGFuZ3VhZ2U/OiBzdHJpbmcsIGNoaWxkcmVuOiBOb2RlW119IHwgc3RyaW5nfSBOb2RlICovXG4vKiogQHR5cGVkZWYge3tzY29wZT86IHN0cmluZywgbGFuZ3VhZ2U/OiBzdHJpbmcsIGNoaWxkcmVuOiBOb2RlW119IH0gRGF0YU5vZGUgKi9cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5FbWl0dGVyfSBFbWl0dGVyICovXG4vKiogICovXG5cbi8qKiBAcmV0dXJucyB7RGF0YU5vZGV9ICovXG5jb25zdCBuZXdOb2RlID0gKG9wdHMgPSB7fSkgPT4ge1xuICAvKiogQHR5cGUgRGF0YU5vZGUgKi9cbiAgY29uc3QgcmVzdWx0ID0geyBjaGlsZHJlbjogW10gfTtcbiAgT2JqZWN0LmFzc2lnbihyZXN1bHQsIG9wdHMpO1xuICByZXR1cm4gcmVzdWx0O1xufTtcblxuY2xhc3MgVG9rZW5UcmVlIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLyoqIEB0eXBlIERhdGFOb2RlICovXG4gICAgdGhpcy5yb290Tm9kZSA9IG5ld05vZGUoKTtcbiAgICB0aGlzLnN0YWNrID0gW3RoaXMucm9vdE5vZGVdO1xuICB9XG5cbiAgZ2V0IHRvcCgpIHtcbiAgICByZXR1cm4gdGhpcy5zdGFja1t0aGlzLnN0YWNrLmxlbmd0aCAtIDFdO1xuICB9XG5cbiAgZ2V0IHJvb3QoKSB7IHJldHVybiB0aGlzLnJvb3ROb2RlOyB9XG5cbiAgLyoqIEBwYXJhbSB7Tm9kZX0gbm9kZSAqL1xuICBhZGQobm9kZSkge1xuICAgIHRoaXMudG9wLmNoaWxkcmVuLnB1c2gobm9kZSk7XG4gIH1cblxuICAvKiogQHBhcmFtIHtzdHJpbmd9IHNjb3BlICovXG4gIG9wZW5Ob2RlKHNjb3BlKSB7XG4gICAgLyoqIEB0eXBlIE5vZGUgKi9cbiAgICBjb25zdCBub2RlID0gbmV3Tm9kZSh7IHNjb3BlIH0pO1xuICAgIHRoaXMuYWRkKG5vZGUpO1xuICAgIHRoaXMuc3RhY2sucHVzaChub2RlKTtcbiAgfVxuXG4gIGNsb3NlTm9kZSgpIHtcbiAgICBpZiAodGhpcy5zdGFjay5sZW5ndGggPiAxKSB7XG4gICAgICByZXR1cm4gdGhpcy5zdGFjay5wb3AoKTtcbiAgICB9XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmaW5lZFxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBjbG9zZUFsbE5vZGVzKCkge1xuICAgIHdoaWxlICh0aGlzLmNsb3NlTm9kZSgpKTtcbiAgfVxuXG4gIHRvSlNPTigpIHtcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodGhpcy5yb290Tm9kZSwgbnVsbCwgNCk7XG4gIH1cblxuICAvKipcbiAgICogQHR5cGVkZWYgeyBpbXBvcnQoXCIuL2h0bWxfcmVuZGVyZXJcIikuUmVuZGVyZXIgfSBSZW5kZXJlclxuICAgKiBAcGFyYW0ge1JlbmRlcmVyfSBidWlsZGVyXG4gICAqL1xuICB3YWxrKGJ1aWxkZXIpIHtcbiAgICAvLyB0aGlzIGRvZXMgbm90XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuX3dhbGsoYnVpbGRlciwgdGhpcy5yb290Tm9kZSk7XG4gICAgLy8gdGhpcyB3b3Jrc1xuICAgIC8vIHJldHVybiBUb2tlblRyZWUuX3dhbGsoYnVpbGRlciwgdGhpcy5yb290Tm9kZSk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtSZW5kZXJlcn0gYnVpbGRlclxuICAgKiBAcGFyYW0ge05vZGV9IG5vZGVcbiAgICovXG4gIHN0YXRpYyBfd2FsayhidWlsZGVyLCBub2RlKSB7XG4gICAgaWYgKHR5cGVvZiBub2RlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBidWlsZGVyLmFkZFRleHQobm9kZSk7XG4gICAgfSBlbHNlIGlmIChub2RlLmNoaWxkcmVuKSB7XG4gICAgICBidWlsZGVyLm9wZW5Ob2RlKG5vZGUpO1xuICAgICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4gdGhpcy5fd2FsayhidWlsZGVyLCBjaGlsZCkpO1xuICAgICAgYnVpbGRlci5jbG9zZU5vZGUobm9kZSk7XG4gICAgfVxuICAgIHJldHVybiBidWlsZGVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7Tm9kZX0gbm9kZVxuICAgKi9cbiAgc3RhdGljIF9jb2xsYXBzZShub2RlKSB7XG4gICAgaWYgKHR5cGVvZiBub2RlID09PSBcInN0cmluZ1wiKSByZXR1cm47XG4gICAgaWYgKCFub2RlLmNoaWxkcmVuKSByZXR1cm47XG5cbiAgICBpZiAobm9kZS5jaGlsZHJlbi5ldmVyeShlbCA9PiB0eXBlb2YgZWwgPT09IFwic3RyaW5nXCIpKSB7XG4gICAgICAvLyBub2RlLnRleHQgPSBub2RlLmNoaWxkcmVuLmpvaW4oXCJcIik7XG4gICAgICAvLyBkZWxldGUgbm9kZS5jaGlsZHJlbjtcbiAgICAgIG5vZGUuY2hpbGRyZW4gPSBbbm9kZS5jaGlsZHJlbi5qb2luKFwiXCIpXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4ge1xuICAgICAgICBUb2tlblRyZWUuX2NvbGxhcHNlKGNoaWxkKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAgQ3VycmVudGx5IHRoaXMgaXMgYWxsIHByaXZhdGUgQVBJLCBidXQgdGhpcyBpcyB0aGUgbWluaW1hbCBBUEkgbmVjZXNzYXJ5XG4gIHRoYXQgYW4gRW1pdHRlciBtdXN0IGltcGxlbWVudCB0byBmdWxseSBzdXBwb3J0IHRoZSBwYXJzZXIuXG5cbiAgTWluaW1hbCBpbnRlcmZhY2U6XG5cbiAgLSBhZGRUZXh0KHRleHQpXG4gIC0gX19hZGRTdWJsYW5ndWFnZShlbWl0dGVyLCBzdWJMYW5ndWFnZU5hbWUpXG4gIC0gc3RhcnRTY29wZShzY29wZSlcbiAgLSBlbmRTY29wZSgpXG4gIC0gZmluYWxpemUoKVxuICAtIHRvSFRNTCgpXG5cbiovXG5cbi8qKlxuICogQGltcGxlbWVudHMge0VtaXR0ZXJ9XG4gKi9cbmNsYXNzIFRva2VuVHJlZUVtaXR0ZXIgZXh0ZW5kcyBUb2tlblRyZWUge1xuICAvKipcbiAgICogQHBhcmFtIHsqfSBvcHRpb25zXG4gICAqL1xuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gICAqL1xuICBhZGRUZXh0KHRleHQpIHtcbiAgICBpZiAodGV4dCA9PT0gXCJcIikgeyByZXR1cm47IH1cblxuICAgIHRoaXMuYWRkKHRleHQpO1xuICB9XG5cbiAgLyoqIEBwYXJhbSB7c3RyaW5nfSBzY29wZSAqL1xuICBzdGFydFNjb3BlKHNjb3BlKSB7XG4gICAgdGhpcy5vcGVuTm9kZShzY29wZSk7XG4gIH1cblxuICBlbmRTY29wZSgpIHtcbiAgICB0aGlzLmNsb3NlTm9kZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7RW1pdHRlciAmIHtyb290OiBEYXRhTm9kZX19IGVtaXR0ZXJcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICovXG4gIF9fYWRkU3VibGFuZ3VhZ2UoZW1pdHRlciwgbmFtZSkge1xuICAgIC8qKiBAdHlwZSBEYXRhTm9kZSAqL1xuICAgIGNvbnN0IG5vZGUgPSBlbWl0dGVyLnJvb3Q7XG4gICAgaWYgKG5hbWUpIG5vZGUuc2NvcGUgPSBgbGFuZ3VhZ2U6JHtuYW1lfWA7XG5cbiAgICB0aGlzLmFkZChub2RlKTtcbiAgfVxuXG4gIHRvSFRNTCgpIHtcbiAgICBjb25zdCByZW5kZXJlciA9IG5ldyBIVE1MUmVuZGVyZXIodGhpcywgdGhpcy5vcHRpb25zKTtcbiAgICByZXR1cm4gcmVuZGVyZXIudmFsdWUoKTtcbiAgfVxuXG4gIGZpbmFsaXplKCkge1xuICAgIHRoaXMuY2xvc2VBbGxOb2RlcygpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gKiBAcmV0dXJucyB7UmVnRXhwfVxuICogKi9cblxuLyoqXG4gKiBAcGFyYW0ge1JlZ0V4cCB8IHN0cmluZyB9IHJlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBzb3VyY2UocmUpIHtcbiAgaWYgKCFyZSkgcmV0dXJuIG51bGw7XG4gIGlmICh0eXBlb2YgcmUgPT09IFwic3RyaW5nXCIpIHJldHVybiByZTtcblxuICByZXR1cm4gcmUuc291cmNlO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVnRXhwIHwgc3RyaW5nIH0gcmVcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGxvb2thaGVhZChyZSkge1xuICByZXR1cm4gY29uY2F0KCcoPz0nLCByZSwgJyknKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlZ0V4cCB8IHN0cmluZyB9IHJlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBhbnlOdW1iZXJPZlRpbWVzKHJlKSB7XG4gIHJldHVybiBjb25jYXQoJyg/OicsIHJlLCAnKSonKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlZ0V4cCB8IHN0cmluZyB9IHJlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBvcHRpb25hbChyZSkge1xuICByZXR1cm4gY29uY2F0KCcoPzonLCByZSwgJyk/Jyk7XG59XG5cbi8qKlxuICogQHBhcmFtIHsuLi4oUmVnRXhwIHwgc3RyaW5nKSB9IGFyZ3NcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGNvbmNhdCguLi5hcmdzKSB7XG4gIGNvbnN0IGpvaW5lZCA9IGFyZ3MubWFwKCh4KSA9PiBzb3VyY2UoeCkpLmpvaW4oXCJcIik7XG4gIHJldHVybiBqb2luZWQ7XG59XG5cbi8qKlxuICogQHBhcmFtIHsgQXJyYXk8c3RyaW5nIHwgUmVnRXhwIHwgT2JqZWN0PiB9IGFyZ3NcbiAqIEByZXR1cm5zIHtvYmplY3R9XG4gKi9cbmZ1bmN0aW9uIHN0cmlwT3B0aW9uc0Zyb21BcmdzKGFyZ3MpIHtcbiAgY29uc3Qgb3B0cyA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcblxuICBpZiAodHlwZW9mIG9wdHMgPT09ICdvYmplY3QnICYmIG9wdHMuY29uc3RydWN0b3IgPT09IE9iamVjdCkge1xuICAgIGFyZ3Muc3BsaWNlKGFyZ3MubGVuZ3RoIC0gMSwgMSk7XG4gICAgcmV0dXJuIG9wdHM7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG59XG5cbi8qKiBAdHlwZWRlZiB7IHtjYXB0dXJlPzogYm9vbGVhbn0gfSBSZWdleEVpdGhlck9wdGlvbnMgKi9cblxuLyoqXG4gKiBBbnkgb2YgdGhlIHBhc3NlZCBleHByZXNzc2lvbnMgbWF5IG1hdGNoXG4gKlxuICogQ3JlYXRlcyBhIGh1Z2UgdGhpcyB8IHRoaXMgfCB0aGF0IHwgdGhhdCBtYXRjaFxuICogQHBhcmFtIHsoUmVnRXhwIHwgc3RyaW5nKVtdIHwgWy4uLihSZWdFeHAgfCBzdHJpbmcpW10sIFJlZ2V4RWl0aGVyT3B0aW9uc119IGFyZ3NcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVpdGhlciguLi5hcmdzKSB7XG4gIC8qKiBAdHlwZSB7IG9iamVjdCAmIHtjYXB0dXJlPzogYm9vbGVhbn0gfSAgKi9cbiAgY29uc3Qgb3B0cyA9IHN0cmlwT3B0aW9uc0Zyb21BcmdzKGFyZ3MpO1xuICBjb25zdCBqb2luZWQgPSAnKCdcbiAgICArIChvcHRzLmNhcHR1cmUgPyBcIlwiIDogXCI/OlwiKVxuICAgICsgYXJncy5tYXAoKHgpID0+IHNvdXJjZSh4KSkuam9pbihcInxcIikgKyBcIilcIjtcbiAgcmV0dXJuIGpvaW5lZDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlZ0V4cCB8IHN0cmluZ30gcmVcbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIGNvdW50TWF0Y2hHcm91cHMocmUpIHtcbiAgcmV0dXJuIChuZXcgUmVnRXhwKHJlLnRvU3RyaW5nKCkgKyAnfCcpKS5leGVjKCcnKS5sZW5ndGggLSAxO1xufVxuXG4vKipcbiAqIERvZXMgbGV4ZW1lIHN0YXJ0IHdpdGggYSByZWd1bGFyIGV4cHJlc3Npb24gbWF0Y2ggYXQgdGhlIGJlZ2lubmluZ1xuICogQHBhcmFtIHtSZWdFeHB9IHJlXG4gKiBAcGFyYW0ge3N0cmluZ30gbGV4ZW1lXG4gKi9cbmZ1bmN0aW9uIHN0YXJ0c1dpdGgocmUsIGxleGVtZSkge1xuICBjb25zdCBtYXRjaCA9IHJlICYmIHJlLmV4ZWMobGV4ZW1lKTtcbiAgcmV0dXJuIG1hdGNoICYmIG1hdGNoLmluZGV4ID09PSAwO1xufVxuXG4vLyBCQUNLUkVGX1JFIG1hdGNoZXMgYW4gb3BlbiBwYXJlbnRoZXNpcyBvciBiYWNrcmVmZXJlbmNlLiBUbyBhdm9pZFxuLy8gYW4gaW5jb3JyZWN0IHBhcnNlLCBpdCBhZGRpdGlvbmFsbHkgbWF0Y2hlcyB0aGUgZm9sbG93aW5nOlxuLy8gLSBbLi4uXSBlbGVtZW50cywgd2hlcmUgdGhlIG1lYW5pbmcgb2YgcGFyZW50aGVzZXMgYW5kIGVzY2FwZXMgY2hhbmdlXG4vLyAtIG90aGVyIGVzY2FwZSBzZXF1ZW5jZXMsIHNvIHdlIGRvIG5vdCBtaXNwYXJzZSBlc2NhcGUgc2VxdWVuY2VzIGFzXG4vLyAgIGludGVyZXN0aW5nIGVsZW1lbnRzXG4vLyAtIG5vbi1tYXRjaGluZyBvciBsb29rYWhlYWQgcGFyZW50aGVzZXMsIHdoaWNoIGRvIG5vdCBjYXB0dXJlLiBUaGVzZVxuLy8gICBmb2xsb3cgdGhlICcoJyB3aXRoIGEgJz8nLlxuY29uc3QgQkFDS1JFRl9SRSA9IC9cXFsoPzpbXlxcXFxcXF1dfFxcXFwuKSpcXF18XFwoXFw/P3xcXFxcKFsxLTldWzAtOV0qKXxcXFxcLi87XG5cbi8vICoqSU5URVJOQUwqKiBOb3QgaW50ZW5kZWQgZm9yIG91dHNpZGUgdXNhZ2Vcbi8vIGpvaW4gbG9naWNhbGx5IGNvbXB1dGVzIHJlZ2V4cHMuam9pbihzZXBhcmF0b3IpLCBidXQgZml4ZXMgdGhlXG4vLyBiYWNrcmVmZXJlbmNlcyBzbyB0aGV5IGNvbnRpbnVlIHRvIG1hdGNoLlxuLy8gaXQgYWxzbyBwbGFjZXMgZWFjaCBpbmRpdmlkdWFsIHJlZ3VsYXIgZXhwcmVzc2lvbiBpbnRvIGl0J3Mgb3duXG4vLyBtYXRjaCBncm91cCwga2VlcGluZyB0cmFjayBvZiB0aGUgc2VxdWVuY2luZyBvZiB0aG9zZSBtYXRjaCBncm91cHNcbi8vIGlzIGN1cnJlbnRseSBhbiBleGVyY2lzZSBmb3IgdGhlIGNhbGxlci4gOi0pXG4vKipcbiAqIEBwYXJhbSB7KHN0cmluZyB8IFJlZ0V4cClbXX0gcmVnZXhwc1xuICogQHBhcmFtIHt7am9pbldpdGg6IHN0cmluZ319IG9wdHNcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIF9yZXdyaXRlQmFja3JlZmVyZW5jZXMocmVnZXhwcywgeyBqb2luV2l0aCB9KSB7XG4gIGxldCBudW1DYXB0dXJlcyA9IDA7XG5cbiAgcmV0dXJuIHJlZ2V4cHMubWFwKChyZWdleCkgPT4ge1xuICAgIG51bUNhcHR1cmVzICs9IDE7XG4gICAgY29uc3Qgb2Zmc2V0ID0gbnVtQ2FwdHVyZXM7XG4gICAgbGV0IHJlID0gc291cmNlKHJlZ2V4KTtcbiAgICBsZXQgb3V0ID0gJyc7XG5cbiAgICB3aGlsZSAocmUubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgbWF0Y2ggPSBCQUNLUkVGX1JFLmV4ZWMocmUpO1xuICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICBvdXQgKz0gcmU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgb3V0ICs9IHJlLnN1YnN0cmluZygwLCBtYXRjaC5pbmRleCk7XG4gICAgICByZSA9IHJlLnN1YnN0cmluZyhtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aCk7XG4gICAgICBpZiAobWF0Y2hbMF1bMF0gPT09ICdcXFxcJyAmJiBtYXRjaFsxXSkge1xuICAgICAgICAvLyBBZGp1c3QgdGhlIGJhY2tyZWZlcmVuY2UuXG4gICAgICAgIG91dCArPSAnXFxcXCcgKyBTdHJpbmcoTnVtYmVyKG1hdGNoWzFdKSArIG9mZnNldCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXQgKz0gbWF0Y2hbMF07XG4gICAgICAgIGlmIChtYXRjaFswXSA9PT0gJygnKSB7XG4gICAgICAgICAgbnVtQ2FwdHVyZXMrKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9KS5tYXAocmUgPT4gYCgke3JlfSlgKS5qb2luKGpvaW5XaXRoKTtcbn1cblxuLyoqIEB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLk1vZGV9IE1vZGUgKi9cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5Nb2RlQ2FsbGJhY2t9IE1vZGVDYWxsYmFjayAqL1xuXG4vLyBDb21tb24gcmVnZXhwc1xuY29uc3QgTUFUQ0hfTk9USElOR19SRSA9IC9cXGJcXEIvO1xuY29uc3QgSURFTlRfUkUgPSAnW2EtekEtWl1cXFxcdyonO1xuY29uc3QgVU5ERVJTQ09SRV9JREVOVF9SRSA9ICdbYS16QS1aX11cXFxcdyonO1xuY29uc3QgTlVNQkVSX1JFID0gJ1xcXFxiXFxcXGQrKFxcXFwuXFxcXGQrKT8nO1xuY29uc3QgQ19OVU1CRVJfUkUgPSAnKC0/KShcXFxcYjBbeFhdW2EtZkEtRjAtOV0rfChcXFxcYlxcXFxkKyhcXFxcLlxcXFxkKik/fFxcXFwuXFxcXGQrKShbZUVdWy0rXT9cXFxcZCspPyknOyAvLyAweC4uLiwgMC4uLiwgZGVjaW1hbCwgZmxvYXRcbmNvbnN0IEJJTkFSWV9OVU1CRVJfUkUgPSAnXFxcXGIoMGJbMDFdKyknOyAvLyAwYi4uLlxuY29uc3QgUkVfU1RBUlRFUlNfUkUgPSAnIXwhPXwhPT18JXwlPXwmfCYmfCY9fFxcXFwqfFxcXFwqPXxcXFxcK3xcXFxcKz18LHwtfC09fC89fC98Onw7fDw8fDw8PXw8PXw8fD09PXw9PXw9fD4+Pj18Pj49fD49fD4+Pnw+Pnw+fFxcXFw/fFxcXFxbfFxcXFx7fFxcXFwofFxcXFxefFxcXFxePXxcXFxcfHxcXFxcfD18XFxcXHxcXFxcfHx+JztcblxuLyoqXG4qIEBwYXJhbSB7IFBhcnRpYWw8TW9kZT4gJiB7YmluYXJ5Pzogc3RyaW5nIHwgUmVnRXhwfSB9IG9wdHNcbiovXG5jb25zdCBTSEVCQU5HID0gKG9wdHMgPSB7fSkgPT4ge1xuICBjb25zdCBiZWdpblNoZWJhbmcgPSAvXiMhWyBdKlxcLy87XG4gIGlmIChvcHRzLmJpbmFyeSkge1xuICAgIG9wdHMuYmVnaW4gPSBjb25jYXQoXG4gICAgICBiZWdpblNoZWJhbmcsXG4gICAgICAvLipcXGIvLFxuICAgICAgb3B0cy5iaW5hcnksXG4gICAgICAvXFxiLiovKTtcbiAgfVxuICByZXR1cm4gaW5oZXJpdCQxKHtcbiAgICBzY29wZTogJ21ldGEnLFxuICAgIGJlZ2luOiBiZWdpblNoZWJhbmcsXG4gICAgZW5kOiAvJC8sXG4gICAgcmVsZXZhbmNlOiAwLFxuICAgIC8qKiBAdHlwZSB7TW9kZUNhbGxiYWNrfSAqL1xuICAgIFwib246YmVnaW5cIjogKG0sIHJlc3ApID0+IHtcbiAgICAgIGlmIChtLmluZGV4ICE9PSAwKSByZXNwLmlnbm9yZU1hdGNoKCk7XG4gICAgfVxuICB9LCBvcHRzKTtcbn07XG5cbi8vIENvbW1vbiBtb2Rlc1xuY29uc3QgQkFDS1NMQVNIX0VTQ0FQRSA9IHtcbiAgYmVnaW46ICdcXFxcXFxcXFtcXFxcc1xcXFxTXScsIHJlbGV2YW5jZTogMFxufTtcbmNvbnN0IEFQT1NfU1RSSU5HX01PREUgPSB7XG4gIHNjb3BlOiAnc3RyaW5nJyxcbiAgYmVnaW46ICdcXCcnLFxuICBlbmQ6ICdcXCcnLFxuICBpbGxlZ2FsOiAnXFxcXG4nLFxuICBjb250YWluczogW0JBQ0tTTEFTSF9FU0NBUEVdXG59O1xuY29uc3QgUVVPVEVfU1RSSU5HX01PREUgPSB7XG4gIHNjb3BlOiAnc3RyaW5nJyxcbiAgYmVnaW46ICdcIicsXG4gIGVuZDogJ1wiJyxcbiAgaWxsZWdhbDogJ1xcXFxuJyxcbiAgY29udGFpbnM6IFtCQUNLU0xBU0hfRVNDQVBFXVxufTtcbmNvbnN0IFBIUkFTQUxfV09SRFNfTU9ERSA9IHtcbiAgYmVnaW46IC9cXGIoYXxhbnx0aGV8YXJlfEknbXxpc24ndHxkb24ndHxkb2Vzbid0fHdvbid0fGJ1dHxqdXN0fHNob3VsZHxwcmV0dHl8c2ltcGx5fGVub3VnaHxnb25uYXxnb2luZ3x3dGZ8c298c3VjaHx3aWxsfHlvdXx5b3VyfHRoZXl8bGlrZXxtb3JlKVxcYi9cbn07XG4vKipcbiAqIENyZWF0ZXMgYSBjb21tZW50IG1vZGVcbiAqXG4gKiBAcGFyYW0ge3N0cmluZyB8IFJlZ0V4cH0gYmVnaW5cbiAqIEBwYXJhbSB7c3RyaW5nIHwgUmVnRXhwfSBlbmRcbiAqIEBwYXJhbSB7TW9kZSB8IHt9fSBbbW9kZU9wdGlvbnNdXG4gKiBAcmV0dXJucyB7UGFydGlhbDxNb2RlPn1cbiAqL1xuY29uc3QgQ09NTUVOVCA9IGZ1bmN0aW9uKGJlZ2luLCBlbmQsIG1vZGVPcHRpb25zID0ge30pIHtcbiAgY29uc3QgbW9kZSA9IGluaGVyaXQkMShcbiAgICB7XG4gICAgICBzY29wZTogJ2NvbW1lbnQnLFxuICAgICAgYmVnaW4sXG4gICAgICBlbmQsXG4gICAgICBjb250YWluczogW11cbiAgICB9LFxuICAgIG1vZGVPcHRpb25zXG4gICk7XG4gIG1vZGUuY29udGFpbnMucHVzaCh7XG4gICAgc2NvcGU6ICdkb2N0YWcnLFxuICAgIC8vIGhhY2sgdG8gYXZvaWQgdGhlIHNwYWNlIGZyb20gYmVpbmcgaW5jbHVkZWQuIHRoZSBzcGFjZSBpcyBuZWNlc3NhcnkgdG9cbiAgICAvLyBtYXRjaCBoZXJlIHRvIHByZXZlbnQgdGhlIHBsYWluIHRleHQgcnVsZSBiZWxvdyBmcm9tIGdvYmJsaW5nIHVwIGRvY3RhZ3NcbiAgICBiZWdpbjogJ1sgXSooPz0oVE9ET3xGSVhNRXxOT1RFfEJVR3xPUFRJTUlaRXxIQUNLfFhYWCk6KScsXG4gICAgZW5kOiAvKFRPRE98RklYTUV8Tk9URXxCVUd8T1BUSU1JWkV8SEFDS3xYWFgpOi8sXG4gICAgZXhjbHVkZUJlZ2luOiB0cnVlLFxuICAgIHJlbGV2YW5jZTogMFxuICB9KTtcbiAgY29uc3QgRU5HTElTSF9XT1JEID0gZWl0aGVyKFxuICAgIC8vIGxpc3Qgb2YgY29tbW9uIDEgYW5kIDIgbGV0dGVyIHdvcmRzIGluIEVuZ2xpc2hcbiAgICBcIklcIixcbiAgICBcImFcIixcbiAgICBcImlzXCIsXG4gICAgXCJzb1wiLFxuICAgIFwidXNcIixcbiAgICBcInRvXCIsXG4gICAgXCJhdFwiLFxuICAgIFwiaWZcIixcbiAgICBcImluXCIsXG4gICAgXCJpdFwiLFxuICAgIFwib25cIixcbiAgICAvLyBub3RlOiB0aGlzIGlzIG5vdCBhbiBleGhhdXN0aXZlIGxpc3Qgb2YgY29udHJhY3Rpb25zLCBqdXN0IHBvcHVsYXIgb25lc1xuICAgIC9bQS1aYS16XStbJ10oZHx2ZXxyZXxsbHx0fHN8bikvLCAvLyBjb250cmFjdGlvbnMgLSBjYW4ndCB3ZSdkIHRoZXkncmUgbGV0J3MsIGV0Y1xuICAgIC9bQS1aYS16XStbLV1bYS16XSsvLCAvLyBgbm8td2F5YCwgZXRjLlxuICAgIC9bQS1aYS16XVthLXpdezIsfS8gLy8gYWxsb3cgY2FwaXRhbGl6ZWQgd29yZHMgYXQgYmVnaW5uaW5nIG9mIHNlbnRlbmNlc1xuICApO1xuICAvLyBsb29raW5nIGxpa2UgcGxhaW4gdGV4dCwgbW9yZSBsaWtlbHkgdG8gYmUgYSBjb21tZW50XG4gIG1vZGUuY29udGFpbnMucHVzaChcbiAgICB7XG4gICAgICAvLyBUT0RPOiBob3cgdG8gaW5jbHVkZSBcIiwgKCwgKSB3aXRob3V0IGJyZWFraW5nIGdyYW1tYXJzIHRoYXQgdXNlIHRoZXNlIGZvclxuICAgICAgLy8gY29tbWVudCBkZWxpbWl0ZXJzP1xuICAgICAgLy8gYmVnaW46IC9bIF0rKFsoKVwiXT8oW0EtWmEteictXXszLH18aXN8YXxJfHNvfHVzfFt0VF1bb09dfGF0fGlmfGlufGl0fG9uKVsuXT9bKClcIjpdPyhbLl1bIF18WyBdfFxcKSkpezN9L1xuICAgICAgLy8gLS0tXG5cbiAgICAgIC8vIHRoaXMgdHJpZXMgdG8gZmluZCBzZXF1ZW5jZXMgb2YgMyBlbmdsaXNoIHdvcmRzIGluIGEgcm93ICh3aXRob3V0IGFueVxuICAgICAgLy8gXCJwcm9ncmFtbWluZ1wiIHR5cGUgc3ludGF4KSB0aGlzIGdpdmVzIHVzIGEgc3Ryb25nIHNpZ25hbCB0aGF0IHdlJ3ZlXG4gICAgICAvLyBUUlVMWSBmb3VuZCBhIGNvbW1lbnQgLSB2cyBwZXJoYXBzIHNjYW5uaW5nIHdpdGggdGhlIHdyb25nIGxhbmd1YWdlLlxuICAgICAgLy8gSXQncyBwb3NzaWJsZSB0byBmaW5kIHNvbWV0aGluZyB0aGF0IExPT0tTIGxpa2UgdGhlIHN0YXJ0IG9mIHRoZVxuICAgICAgLy8gY29tbWVudCAtIGJ1dCB0aGVuIGlmIHRoZXJlIGlzIG5vIHJlYWRhYmxlIHRleHQgLSBnb29kIGNoYW5jZSBpdCBpcyBhXG4gICAgICAvLyBmYWxzZSBtYXRjaCBhbmQgbm90IGEgY29tbWVudC5cbiAgICAgIC8vXG4gICAgICAvLyBmb3IgYSB2aXN1YWwgZXhhbXBsZSBwbGVhc2Ugc2VlOlxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2hpZ2hsaWdodGpzL2hpZ2hsaWdodC5qcy9pc3N1ZXMvMjgyN1xuXG4gICAgICBiZWdpbjogY29uY2F0KFxuICAgICAgICAvWyBdKy8sIC8vIG5lY2Vzc2FyeSB0byBwcmV2ZW50IHVzIGdvYmJsaW5nIHVwIGRvY3RhZ3MgbGlrZSAvKiBAYXV0aG9yIEJvYiBNY2dpbGwgKi9cbiAgICAgICAgJygnLFxuICAgICAgICBFTkdMSVNIX1dPUkQsXG4gICAgICAgIC9bLl0/WzpdPyhbLl1bIF18WyBdKS8sXG4gICAgICAgICcpezN9JykgLy8gbG9vayBmb3IgMyB3b3JkcyBpbiBhIHJvd1xuICAgIH1cbiAgKTtcbiAgcmV0dXJuIG1vZGU7XG59O1xuY29uc3QgQ19MSU5FX0NPTU1FTlRfTU9ERSA9IENPTU1FTlQoJy8vJywgJyQnKTtcbmNvbnN0IENfQkxPQ0tfQ09NTUVOVF9NT0RFID0gQ09NTUVOVCgnL1xcXFwqJywgJ1xcXFwqLycpO1xuY29uc3QgSEFTSF9DT01NRU5UX01PREUgPSBDT01NRU5UKCcjJywgJyQnKTtcbmNvbnN0IE5VTUJFUl9NT0RFID0ge1xuICBzY29wZTogJ251bWJlcicsXG4gIGJlZ2luOiBOVU1CRVJfUkUsXG4gIHJlbGV2YW5jZTogMFxufTtcbmNvbnN0IENfTlVNQkVSX01PREUgPSB7XG4gIHNjb3BlOiAnbnVtYmVyJyxcbiAgYmVnaW46IENfTlVNQkVSX1JFLFxuICByZWxldmFuY2U6IDBcbn07XG5jb25zdCBCSU5BUllfTlVNQkVSX01PREUgPSB7XG4gIHNjb3BlOiAnbnVtYmVyJyxcbiAgYmVnaW46IEJJTkFSWV9OVU1CRVJfUkUsXG4gIHJlbGV2YW5jZTogMFxufTtcbmNvbnN0IFJFR0VYUF9NT0RFID0ge1xuICBzY29wZTogXCJyZWdleHBcIixcbiAgYmVnaW46IC9cXC8oPz1bXi9cXG5dKlxcLykvLFxuICBlbmQ6IC9cXC9bZ2ltdXldKi8sXG4gIGNvbnRhaW5zOiBbXG4gICAgQkFDS1NMQVNIX0VTQ0FQRSxcbiAgICB7XG4gICAgICBiZWdpbjogL1xcWy8sXG4gICAgICBlbmQ6IC9cXF0vLFxuICAgICAgcmVsZXZhbmNlOiAwLFxuICAgICAgY29udGFpbnM6IFtCQUNLU0xBU0hfRVNDQVBFXVxuICAgIH1cbiAgXVxufTtcbmNvbnN0IFRJVExFX01PREUgPSB7XG4gIHNjb3BlOiAndGl0bGUnLFxuICBiZWdpbjogSURFTlRfUkUsXG4gIHJlbGV2YW5jZTogMFxufTtcbmNvbnN0IFVOREVSU0NPUkVfVElUTEVfTU9ERSA9IHtcbiAgc2NvcGU6ICd0aXRsZScsXG4gIGJlZ2luOiBVTkRFUlNDT1JFX0lERU5UX1JFLFxuICByZWxldmFuY2U6IDBcbn07XG5jb25zdCBNRVRIT0RfR1VBUkQgPSB7XG4gIC8vIGV4Y2x1ZGVzIG1ldGhvZCBuYW1lcyBmcm9tIGtleXdvcmQgcHJvY2Vzc2luZ1xuICBiZWdpbjogJ1xcXFwuXFxcXHMqJyArIFVOREVSU0NPUkVfSURFTlRfUkUsXG4gIHJlbGV2YW5jZTogMFxufTtcblxuLyoqXG4gKiBBZGRzIGVuZCBzYW1lIGFzIGJlZ2luIG1lY2hhbmljcyB0byBhIG1vZGVcbiAqXG4gKiBZb3VyIG1vZGUgbXVzdCBpbmNsdWRlIGF0IGxlYXN0IGEgc2luZ2xlICgpIG1hdGNoIGdyb3VwIGFzIHRoYXQgZmlyc3QgbWF0Y2hcbiAqIGdyb3VwIGlzIHdoYXQgaXMgdXNlZCBmb3IgY29tcGFyaXNvblxuICogQHBhcmFtIHtQYXJ0aWFsPE1vZGU+fSBtb2RlXG4gKi9cbmNvbnN0IEVORF9TQU1FX0FTX0JFR0lOID0gZnVuY3Rpb24obW9kZSkge1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbihtb2RlLFxuICAgIHtcbiAgICAgIC8qKiBAdHlwZSB7TW9kZUNhbGxiYWNrfSAqL1xuICAgICAgJ29uOmJlZ2luJzogKG0sIHJlc3ApID0+IHsgcmVzcC5kYXRhLl9iZWdpbk1hdGNoID0gbVsxXTsgfSxcbiAgICAgIC8qKiBAdHlwZSB7TW9kZUNhbGxiYWNrfSAqL1xuICAgICAgJ29uOmVuZCc6IChtLCByZXNwKSA9PiB7IGlmIChyZXNwLmRhdGEuX2JlZ2luTWF0Y2ggIT09IG1bMV0pIHJlc3AuaWdub3JlTWF0Y2goKTsgfVxuICAgIH0pO1xufTtcblxudmFyIE1PREVTID0gLyojX19QVVJFX18qL09iamVjdC5mcmVlemUoe1xuICBfX3Byb3RvX186IG51bGwsXG4gIEFQT1NfU1RSSU5HX01PREU6IEFQT1NfU1RSSU5HX01PREUsXG4gIEJBQ0tTTEFTSF9FU0NBUEU6IEJBQ0tTTEFTSF9FU0NBUEUsXG4gIEJJTkFSWV9OVU1CRVJfTU9ERTogQklOQVJZX05VTUJFUl9NT0RFLFxuICBCSU5BUllfTlVNQkVSX1JFOiBCSU5BUllfTlVNQkVSX1JFLFxuICBDT01NRU5UOiBDT01NRU5ULFxuICBDX0JMT0NLX0NPTU1FTlRfTU9ERTogQ19CTE9DS19DT01NRU5UX01PREUsXG4gIENfTElORV9DT01NRU5UX01PREU6IENfTElORV9DT01NRU5UX01PREUsXG4gIENfTlVNQkVSX01PREU6IENfTlVNQkVSX01PREUsXG4gIENfTlVNQkVSX1JFOiBDX05VTUJFUl9SRSxcbiAgRU5EX1NBTUVfQVNfQkVHSU46IEVORF9TQU1FX0FTX0JFR0lOLFxuICBIQVNIX0NPTU1FTlRfTU9ERTogSEFTSF9DT01NRU5UX01PREUsXG4gIElERU5UX1JFOiBJREVOVF9SRSxcbiAgTUFUQ0hfTk9USElOR19SRTogTUFUQ0hfTk9USElOR19SRSxcbiAgTUVUSE9EX0dVQVJEOiBNRVRIT0RfR1VBUkQsXG4gIE5VTUJFUl9NT0RFOiBOVU1CRVJfTU9ERSxcbiAgTlVNQkVSX1JFOiBOVU1CRVJfUkUsXG4gIFBIUkFTQUxfV09SRFNfTU9ERTogUEhSQVNBTF9XT1JEU19NT0RFLFxuICBRVU9URV9TVFJJTkdfTU9ERTogUVVPVEVfU1RSSU5HX01PREUsXG4gIFJFR0VYUF9NT0RFOiBSRUdFWFBfTU9ERSxcbiAgUkVfU1RBUlRFUlNfUkU6IFJFX1NUQVJURVJTX1JFLFxuICBTSEVCQU5HOiBTSEVCQU5HLFxuICBUSVRMRV9NT0RFOiBUSVRMRV9NT0RFLFxuICBVTkRFUlNDT1JFX0lERU5UX1JFOiBVTkRFUlNDT1JFX0lERU5UX1JFLFxuICBVTkRFUlNDT1JFX1RJVExFX01PREU6IFVOREVSU0NPUkVfVElUTEVfTU9ERVxufSk7XG5cbi8qKlxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQ2FsbGJhY2tSZXNwb25zZX0gQ2FsbGJhY2tSZXNwb25zZVxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQ29tcGlsZXJFeHR9IENvbXBpbGVyRXh0XG4qL1xuXG4vLyBHcmFtbWFyIGV4dGVuc2lvbnMgLyBwbHVnaW5zXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9oaWdobGlnaHRqcy9oaWdobGlnaHQuanMvaXNzdWVzLzI4MzNcblxuLy8gR3JhbW1hciBleHRlbnNpb25zIGFsbG93IFwic3ludGFjdGljIHN1Z2FyXCIgdG8gYmUgYWRkZWQgdG8gdGhlIGdyYW1tYXIgbW9kZXNcbi8vIHdpdGhvdXQgcmVxdWlyaW5nIGFueSB1bmRlcmx5aW5nIGNoYW5nZXMgdG8gdGhlIGNvbXBpbGVyIGludGVybmFscy5cblxuLy8gYGNvbXBpbGVNYXRjaGAgYmVpbmcgdGhlIHBlcmZlY3Qgc21hbGwgZXhhbXBsZSBvZiBub3cgYWxsb3dpbmcgYSBncmFtbWFyXG4vLyBhdXRob3IgdG8gd3JpdGUgYG1hdGNoYCB3aGVuIHRoZXkgZGVzaXJlIHRvIG1hdGNoIGEgc2luZ2xlIGV4cHJlc3Npb24gcmF0aGVyXG4vLyB0aGFuIGJlaW5nIGZvcmNlZCB0byB1c2UgYGJlZ2luYC4gIFRoZSBleHRlbnNpb24gdGhlbiBqdXN0IG1vdmVzIGBtYXRjaGAgaW50b1xuLy8gYGJlZ2luYCB3aGVuIGl0IHJ1bnMuICBJZSwgbm8gZmVhdHVyZXMgaGF2ZSBiZWVuIGFkZGVkLCBidXQgd2UndmUganVzdCBtYWRlXG4vLyB0aGUgZXhwZXJpZW5jZSBvZiB3cml0aW5nIChhbmQgcmVhZGluZyBncmFtbWFycykgYSBsaXR0bGUgYml0IG5pY2VyLlxuXG4vLyAtLS0tLS1cblxuLy8gVE9ETzogV2UgbmVlZCBuZWdhdGl2ZSBsb29rLWJlaGluZCBzdXBwb3J0IHRvIGRvIHRoaXMgcHJvcGVybHlcbi8qKlxuICogU2tpcCBhIG1hdGNoIGlmIGl0IGhhcyBhIHByZWNlZGluZyBkb3RcbiAqXG4gKiBUaGlzIGlzIHVzZWQgZm9yIGBiZWdpbktleXdvcmRzYCB0byBwcmV2ZW50IG1hdGNoaW5nIGV4cHJlc3Npb25zIHN1Y2ggYXNcbiAqIGBib2Iua2V5d29yZC5kbygpYC4gVGhlIG1vZGUgY29tcGlsZXIgYXV0b21hdGljYWxseSB3aXJlcyB0aGlzIHVwIGFzIGFcbiAqIHNwZWNpYWwgX2ludGVybmFsXyAnb246YmVnaW4nIGNhbGxiYWNrIGZvciBtb2RlcyB3aXRoIGBiZWdpbktleXdvcmRzYFxuICogQHBhcmFtIHtSZWdFeHBNYXRjaEFycmF5fSBtYXRjaFxuICogQHBhcmFtIHtDYWxsYmFja1Jlc3BvbnNlfSByZXNwb25zZVxuICovXG5mdW5jdGlvbiBza2lwSWZIYXNQcmVjZWRpbmdEb3QobWF0Y2gsIHJlc3BvbnNlKSB7XG4gIGNvbnN0IGJlZm9yZSA9IG1hdGNoLmlucHV0W21hdGNoLmluZGV4IC0gMV07XG4gIGlmIChiZWZvcmUgPT09IFwiLlwiKSB7XG4gICAgcmVzcG9uc2UuaWdub3JlTWF0Y2goKTtcbiAgfVxufVxuXG4vKipcbiAqXG4gKiBAdHlwZSB7Q29tcGlsZXJFeHR9XG4gKi9cbmZ1bmN0aW9uIHNjb3BlQ2xhc3NOYW1lKG1vZGUsIF9wYXJlbnQpIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmaW5lZFxuICBpZiAobW9kZS5jbGFzc05hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgIG1vZGUuc2NvcGUgPSBtb2RlLmNsYXNzTmFtZTtcbiAgICBkZWxldGUgbW9kZS5jbGFzc05hbWU7XG4gIH1cbn1cblxuLyoqXG4gKiBgYmVnaW5LZXl3b3Jkc2Agc3ludGFjdGljIHN1Z2FyXG4gKiBAdHlwZSB7Q29tcGlsZXJFeHR9XG4gKi9cbmZ1bmN0aW9uIGJlZ2luS2V5d29yZHMobW9kZSwgcGFyZW50KSB7XG4gIGlmICghcGFyZW50KSByZXR1cm47XG4gIGlmICghbW9kZS5iZWdpbktleXdvcmRzKSByZXR1cm47XG5cbiAgLy8gZm9yIGxhbmd1YWdlcyB3aXRoIGtleXdvcmRzIHRoYXQgaW5jbHVkZSBub24td29yZCBjaGFyYWN0ZXJzIGNoZWNraW5nIGZvclxuICAvLyBhIHdvcmQgYm91bmRhcnkgaXMgbm90IHN1ZmZpY2llbnQsIHNvIGluc3RlYWQgd2UgY2hlY2sgZm9yIGEgd29yZCBib3VuZGFyeVxuICAvLyBvciB3aGl0ZXNwYWNlIC0gdGhpcyBkb2VzIG5vIGhhcm0gaW4gYW55IGNhc2Ugc2luY2Ugb3VyIGtleXdvcmQgZW5naW5lXG4gIC8vIGRvZXNuJ3QgYWxsb3cgc3BhY2VzIGluIGtleXdvcmRzIGFueXdheXMgYW5kIHdlIHN0aWxsIGNoZWNrIGZvciB0aGUgYm91bmRhcnlcbiAgLy8gZmlyc3RcbiAgbW9kZS5iZWdpbiA9ICdcXFxcYignICsgbW9kZS5iZWdpbktleXdvcmRzLnNwbGl0KCcgJykuam9pbignfCcpICsgJykoPyFcXFxcLikoPz1cXFxcYnxcXFxccyknO1xuICBtb2RlLl9fYmVmb3JlQmVnaW4gPSBza2lwSWZIYXNQcmVjZWRpbmdEb3Q7XG4gIG1vZGUua2V5d29yZHMgPSBtb2RlLmtleXdvcmRzIHx8IG1vZGUuYmVnaW5LZXl3b3JkcztcbiAgZGVsZXRlIG1vZGUuYmVnaW5LZXl3b3JkcztcblxuICAvLyBwcmV2ZW50cyBkb3VibGUgcmVsZXZhbmNlLCB0aGUga2V5d29yZHMgdGhlbXNlbHZlcyBwcm92aWRlXG4gIC8vIHJlbGV2YW5jZSwgdGhlIG1vZGUgZG9lc24ndCBuZWVkIHRvIGRvdWJsZSBpdFxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZpbmVkXG4gIGlmIChtb2RlLnJlbGV2YW5jZSA9PT0gdW5kZWZpbmVkKSBtb2RlLnJlbGV2YW5jZSA9IDA7XG59XG5cbi8qKlxuICogQWxsb3cgYGlsbGVnYWxgIHRvIGNvbnRhaW4gYW4gYXJyYXkgb2YgaWxsZWdhbCB2YWx1ZXNcbiAqIEB0eXBlIHtDb21waWxlckV4dH1cbiAqL1xuZnVuY3Rpb24gY29tcGlsZUlsbGVnYWwobW9kZSwgX3BhcmVudCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobW9kZS5pbGxlZ2FsKSkgcmV0dXJuO1xuXG4gIG1vZGUuaWxsZWdhbCA9IGVpdGhlciguLi5tb2RlLmlsbGVnYWwpO1xufVxuXG4vKipcbiAqIGBtYXRjaGAgdG8gbWF0Y2ggYSBzaW5nbGUgZXhwcmVzc2lvbiBmb3IgcmVhZGFiaWxpdHlcbiAqIEB0eXBlIHtDb21waWxlckV4dH1cbiAqL1xuZnVuY3Rpb24gY29tcGlsZU1hdGNoKG1vZGUsIF9wYXJlbnQpIHtcbiAgaWYgKCFtb2RlLm1hdGNoKSByZXR1cm47XG4gIGlmIChtb2RlLmJlZ2luIHx8IG1vZGUuZW5kKSB0aHJvdyBuZXcgRXJyb3IoXCJiZWdpbiAmIGVuZCBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIG1hdGNoXCIpO1xuXG4gIG1vZGUuYmVnaW4gPSBtb2RlLm1hdGNoO1xuICBkZWxldGUgbW9kZS5tYXRjaDtcbn1cblxuLyoqXG4gKiBwcm92aWRlcyB0aGUgZGVmYXVsdCAxIHJlbGV2YW5jZSB0byBhbGwgbW9kZXNcbiAqIEB0eXBlIHtDb21waWxlckV4dH1cbiAqL1xuZnVuY3Rpb24gY29tcGlsZVJlbGV2YW5jZShtb2RlLCBfcGFyZW50KSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZmluZWRcbiAgaWYgKG1vZGUucmVsZXZhbmNlID09PSB1bmRlZmluZWQpIG1vZGUucmVsZXZhbmNlID0gMTtcbn1cblxuLy8gYWxsb3cgYmVmb3JlTWF0Y2ggdG8gYWN0IGFzIGEgXCJxdWFsaWZpZXJcIiBmb3IgdGhlIG1hdGNoXG4vLyB0aGUgZnVsbCBtYXRjaCBiZWdpbiBtdXN0IGJlIFtiZWZvcmVNYXRjaF1bYmVnaW5dXG5jb25zdCBiZWZvcmVNYXRjaEV4dCA9IChtb2RlLCBwYXJlbnQpID0+IHtcbiAgaWYgKCFtb2RlLmJlZm9yZU1hdGNoKSByZXR1cm47XG4gIC8vIHN0YXJ0cyBjb25mbGljdHMgd2l0aCBlbmRzUGFyZW50IHdoaWNoIHdlIG5lZWQgdG8gbWFrZSBzdXJlIHRoZSBjaGlsZFxuICAvLyBydWxlIGlzIG5vdCBtYXRjaGVkIG11bHRpcGxlIHRpbWVzXG4gIGlmIChtb2RlLnN0YXJ0cykgdGhyb3cgbmV3IEVycm9yKFwiYmVmb3JlTWF0Y2ggY2Fubm90IGJlIHVzZWQgd2l0aCBzdGFydHNcIik7XG5cbiAgY29uc3Qgb3JpZ2luYWxNb2RlID0gT2JqZWN0LmFzc2lnbih7fSwgbW9kZSk7XG4gIE9iamVjdC5rZXlzKG1vZGUpLmZvckVhY2goKGtleSkgPT4geyBkZWxldGUgbW9kZVtrZXldOyB9KTtcblxuICBtb2RlLmtleXdvcmRzID0gb3JpZ2luYWxNb2RlLmtleXdvcmRzO1xuICBtb2RlLmJlZ2luID0gY29uY2F0KG9yaWdpbmFsTW9kZS5iZWZvcmVNYXRjaCwgbG9va2FoZWFkKG9yaWdpbmFsTW9kZS5iZWdpbikpO1xuICBtb2RlLnN0YXJ0cyA9IHtcbiAgICByZWxldmFuY2U6IDAsXG4gICAgY29udGFpbnM6IFtcbiAgICAgIE9iamVjdC5hc3NpZ24ob3JpZ2luYWxNb2RlLCB7IGVuZHNQYXJlbnQ6IHRydWUgfSlcbiAgICBdXG4gIH07XG4gIG1vZGUucmVsZXZhbmNlID0gMDtcblxuICBkZWxldGUgb3JpZ2luYWxNb2RlLmJlZm9yZU1hdGNoO1xufTtcblxuLy8ga2V5d29yZHMgdGhhdCBzaG91bGQgaGF2ZSBubyBkZWZhdWx0IHJlbGV2YW5jZSB2YWx1ZVxuY29uc3QgQ09NTU9OX0tFWVdPUkRTID0gW1xuICAnb2YnLFxuICAnYW5kJyxcbiAgJ2ZvcicsXG4gICdpbicsXG4gICdub3QnLFxuICAnb3InLFxuICAnaWYnLFxuICAndGhlbicsXG4gICdwYXJlbnQnLCAvLyBjb21tb24gdmFyaWFibGUgbmFtZVxuICAnbGlzdCcsIC8vIGNvbW1vbiB2YXJpYWJsZSBuYW1lXG4gICd2YWx1ZScgLy8gY29tbW9uIHZhcmlhYmxlIG5hbWVcbl07XG5cbmNvbnN0IERFRkFVTFRfS0VZV09SRF9TQ09QRSA9IFwia2V5d29yZFwiO1xuXG4vKipcbiAqIEdpdmVuIHJhdyBrZXl3b3JkcyBmcm9tIGEgbGFuZ3VhZ2UgZGVmaW5pdGlvbiwgY29tcGlsZSB0aGVtLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nIHwgUmVjb3JkPHN0cmluZyxzdHJpbmd8c3RyaW5nW10+IHwgQXJyYXk8c3RyaW5nPn0gcmF3S2V5d29yZHNcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gY2FzZUluc2Vuc2l0aXZlXG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGVLZXl3b3JkcyhyYXdLZXl3b3JkcywgY2FzZUluc2Vuc2l0aXZlLCBzY29wZU5hbWUgPSBERUZBVUxUX0tFWVdPUkRfU0NPUEUpIHtcbiAgLyoqIEB0eXBlIHtpbXBvcnQoXCJoaWdobGlnaHQuanMvcHJpdmF0ZVwiKS5LZXl3b3JkRGljdH0gKi9cbiAgY29uc3QgY29tcGlsZWRLZXl3b3JkcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgLy8gaW5wdXQgY2FuIGJlIGEgc3RyaW5nIG9mIGtleXdvcmRzLCBhbiBhcnJheSBvZiBrZXl3b3Jkcywgb3IgYSBvYmplY3Qgd2l0aFxuICAvLyBuYW1lZCBrZXlzIHJlcHJlc2VudGluZyBzY29wZU5hbWUgKHdoaWNoIGNhbiB0aGVuIHBvaW50IHRvIGEgc3RyaW5nIG9yIGFycmF5KVxuICBpZiAodHlwZW9mIHJhd0tleXdvcmRzID09PSAnc3RyaW5nJykge1xuICAgIGNvbXBpbGVMaXN0KHNjb3BlTmFtZSwgcmF3S2V5d29yZHMuc3BsaXQoXCIgXCIpKTtcbiAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHJhd0tleXdvcmRzKSkge1xuICAgIGNvbXBpbGVMaXN0KHNjb3BlTmFtZSwgcmF3S2V5d29yZHMpO1xuICB9IGVsc2Uge1xuICAgIE9iamVjdC5rZXlzKHJhd0tleXdvcmRzKS5mb3JFYWNoKGZ1bmN0aW9uKHNjb3BlTmFtZSkge1xuICAgICAgLy8gY29sbGFwc2UgYWxsIG91ciBvYmplY3RzIGJhY2sgaW50byB0aGUgcGFyZW50IG9iamVjdFxuICAgICAgT2JqZWN0LmFzc2lnbihcbiAgICAgICAgY29tcGlsZWRLZXl3b3JkcyxcbiAgICAgICAgY29tcGlsZUtleXdvcmRzKHJhd0tleXdvcmRzW3Njb3BlTmFtZV0sIGNhc2VJbnNlbnNpdGl2ZSwgc2NvcGVOYW1lKVxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gY29tcGlsZWRLZXl3b3JkcztcblxuICAvLyAtLS1cblxuICAvKipcbiAgICogQ29tcGlsZXMgYW4gaW5kaXZpZHVhbCBsaXN0IG9mIGtleXdvcmRzXG4gICAqXG4gICAqIEV4OiBcImZvciBpZiB3aGVuIHdoaWxlfDVcIlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2NvcGVOYW1lXG4gICAqIEBwYXJhbSB7QXJyYXk8c3RyaW5nPn0ga2V5d29yZExpc3RcbiAgICovXG4gIGZ1bmN0aW9uIGNvbXBpbGVMaXN0KHNjb3BlTmFtZSwga2V5d29yZExpc3QpIHtcbiAgICBpZiAoY2FzZUluc2Vuc2l0aXZlKSB7XG4gICAgICBrZXl3b3JkTGlzdCA9IGtleXdvcmRMaXN0Lm1hcCh4ID0+IHgudG9Mb3dlckNhc2UoKSk7XG4gICAgfVxuICAgIGtleXdvcmRMaXN0LmZvckVhY2goZnVuY3Rpb24oa2V5d29yZCkge1xuICAgICAgY29uc3QgcGFpciA9IGtleXdvcmQuc3BsaXQoJ3wnKTtcbiAgICAgIGNvbXBpbGVkS2V5d29yZHNbcGFpclswXV0gPSBbc2NvcGVOYW1lLCBzY29yZUZvcktleXdvcmQocGFpclswXSwgcGFpclsxXSldO1xuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgcHJvcGVyIHNjb3JlIGZvciBhIGdpdmVuIGtleXdvcmRcbiAqXG4gKiBBbHNvIHRha2VzIGludG8gYWNjb3VudCBjb21tZW50IGtleXdvcmRzLCB3aGljaCB3aWxsIGJlIHNjb3JlZCAwIFVOTEVTU1xuICogYW5vdGhlciBzY29yZSBoYXMgYmVlbiBtYW51YWxseSBhc3NpZ25lZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXl3b3JkXG4gKiBAcGFyYW0ge3N0cmluZ30gW3Byb3ZpZGVkU2NvcmVdXG4gKi9cbmZ1bmN0aW9uIHNjb3JlRm9yS2V5d29yZChrZXl3b3JkLCBwcm92aWRlZFNjb3JlKSB7XG4gIC8vIG1hbnVhbCBzY29yZXMgYWx3YXlzIHdpbiBvdmVyIGNvbW1vbiBrZXl3b3Jkc1xuICAvLyBzbyB5b3UgY2FuIGZvcmNlIGEgc2NvcmUgb2YgMSBpZiB5b3UgcmVhbGx5IGluc2lzdFxuICBpZiAocHJvdmlkZWRTY29yZSkge1xuICAgIHJldHVybiBOdW1iZXIocHJvdmlkZWRTY29yZSk7XG4gIH1cblxuICByZXR1cm4gY29tbW9uS2V5d29yZChrZXl3b3JkKSA/IDAgOiAxO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgYSBnaXZlbiBrZXl3b3JkIGlzIGNvbW1vbiBvciBub3RcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5d29yZCAqL1xuZnVuY3Rpb24gY29tbW9uS2V5d29yZChrZXl3b3JkKSB7XG4gIHJldHVybiBDT01NT05fS0VZV09SRFMuaW5jbHVkZXMoa2V5d29yZC50b0xvd2VyQ2FzZSgpKTtcbn1cblxuLypcblxuRm9yIHRoZSByZWFzb25pbmcgYmVoaW5kIHRoaXMgcGxlYXNlIHNlZTpcbmh0dHBzOi8vZ2l0aHViLmNvbS9oaWdobGlnaHRqcy9oaWdobGlnaHQuanMvaXNzdWVzLzI4ODAjaXNzdWVjb21tZW50LTc0NzI3NTQxOVxuXG4qL1xuXG4vKipcbiAqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCBib29sZWFuPn1cbiAqL1xuY29uc3Qgc2VlbkRlcHJlY2F0aW9ucyA9IHt9O1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gKi9cbmNvbnN0IGVycm9yID0gKG1lc3NhZ2UpID0+IHtcbiAgY29uc29sZS5lcnJvcihtZXNzYWdlKTtcbn07XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAqIEBwYXJhbSB7YW55fSBhcmdzXG4gKi9cbmNvbnN0IHdhcm4gPSAobWVzc2FnZSwgLi4uYXJncykgPT4ge1xuICBjb25zb2xlLmxvZyhgV0FSTjogJHttZXNzYWdlfWAsIC4uLmFyZ3MpO1xufTtcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmVyc2lvblxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAqL1xuY29uc3QgZGVwcmVjYXRlZCA9ICh2ZXJzaW9uLCBtZXNzYWdlKSA9PiB7XG4gIGlmIChzZWVuRGVwcmVjYXRpb25zW2Ake3ZlcnNpb259LyR7bWVzc2FnZX1gXSkgcmV0dXJuO1xuXG4gIGNvbnNvbGUubG9nKGBEZXByZWNhdGVkIGFzIG9mICR7dmVyc2lvbn0uICR7bWVzc2FnZX1gKTtcbiAgc2VlbkRlcHJlY2F0aW9uc1tgJHt2ZXJzaW9ufS8ke21lc3NhZ2V9YF0gPSB0cnVlO1xufTtcblxuLyogZXNsaW50LWRpc2FibGUgbm8tdGhyb3ctbGl0ZXJhbCAqL1xuXG4vKipcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLkNvbXBpbGVkTW9kZX0gQ29tcGlsZWRNb2RlXG4qL1xuXG5jb25zdCBNdWx0aUNsYXNzRXJyb3IgPSBuZXcgRXJyb3IoKTtcblxuLyoqXG4gKiBSZW51bWJlcnMgbGFiZWxlZCBzY29wZSBuYW1lcyB0byBhY2NvdW50IGZvciBhZGRpdGlvbmFsIGlubmVyIG1hdGNoXG4gKiBncm91cHMgdGhhdCBvdGhlcndpc2Ugd291bGQgYnJlYWsgZXZlcnl0aGluZy5cbiAqXG4gKiBMZXRzIHNheSB3ZSAzIG1hdGNoIHNjb3BlczpcbiAqXG4gKiAgIHsgMSA9PiAuLi4sIDIgPT4gLi4uLCAzID0+IC4uLiB9XG4gKlxuICogU28gd2hhdCB3ZSBuZWVkIGlzIGEgY2xlYW4gbWF0Y2ggbGlrZSB0aGlzOlxuICpcbiAqICAgKGEpKGIpKGMpID0+IFsgXCJhXCIsIFwiYlwiLCBcImNcIiBdXG4gKlxuICogQnV0IHRoaXMgZmFsbHMgYXBhcnQgd2l0aCBpbm5lciBtYXRjaCBncm91cHM6XG4gKlxuICogKGEpKCgoYikpKShjKSA9PiBbXCJhXCIsIFwiYlwiLCBcImJcIiwgXCJiXCIsIFwiY1wiIF1cbiAqXG4gKiBPdXIgc2NvcGVzIGFyZSBub3cgXCJvdXQgb2YgYWxpZ25tZW50XCIgYW5kIHdlJ3JlIHJlcGVhdGluZyBgYmAgMyB0aW1lcy5cbiAqIFdoYXQgbmVlZHMgdG8gaGFwcGVuIGlzIHRoZSBudW1iZXJzIGFyZSByZW1hcHBlZDpcbiAqXG4gKiAgIHsgMSA9PiAuLi4sIDIgPT4gLi4uLCA1ID0+IC4uLiB9XG4gKlxuICogV2UgYWxzbyBuZWVkIHRvIGtub3cgdGhhdCB0aGUgT05MWSBncm91cHMgdGhhdCBzaG91bGQgYmUgb3V0cHV0XG4gKiBhcmUgMSwgMiwgYW5kIDUuICBUaGlzIGZ1bmN0aW9uIGhhbmRsZXMgdGhpcyBiZWhhdmlvci5cbiAqXG4gKiBAcGFyYW0ge0NvbXBpbGVkTW9kZX0gbW9kZVxuICogQHBhcmFtIHtBcnJheTxSZWdFeHAgfCBzdHJpbmc+fSByZWdleGVzXG4gKiBAcGFyYW0ge3trZXk6IFwiYmVnaW5TY29wZVwifFwiZW5kU2NvcGVcIn19IG9wdHNcbiAqL1xuZnVuY3Rpb24gcmVtYXBTY29wZU5hbWVzKG1vZGUsIHJlZ2V4ZXMsIHsga2V5IH0pIHtcbiAgbGV0IG9mZnNldCA9IDA7XG4gIGNvbnN0IHNjb3BlTmFtZXMgPSBtb2RlW2tleV07XG4gIC8qKiBAdHlwZSBSZWNvcmQ8bnVtYmVyLGJvb2xlYW4+ICovXG4gIGNvbnN0IGVtaXQgPSB7fTtcbiAgLyoqIEB0eXBlIFJlY29yZDxudW1iZXIsc3RyaW5nPiAqL1xuICBjb25zdCBwb3NpdGlvbnMgPSB7fTtcblxuICBmb3IgKGxldCBpID0gMTsgaSA8PSByZWdleGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgcG9zaXRpb25zW2kgKyBvZmZzZXRdID0gc2NvcGVOYW1lc1tpXTtcbiAgICBlbWl0W2kgKyBvZmZzZXRdID0gdHJ1ZTtcbiAgICBvZmZzZXQgKz0gY291bnRNYXRjaEdyb3VwcyhyZWdleGVzW2kgLSAxXSk7XG4gIH1cbiAgLy8gd2UgdXNlIF9lbWl0IHRvIGtlZXAgdHJhY2sgb2Ygd2hpY2ggbWF0Y2ggZ3JvdXBzIGFyZSBcInRvcC1sZXZlbFwiIHRvIGF2b2lkIGRvdWJsZVxuICAvLyBvdXRwdXQgZnJvbSBpbnNpZGUgbWF0Y2ggZ3JvdXBzXG4gIG1vZGVba2V5XSA9IHBvc2l0aW9ucztcbiAgbW9kZVtrZXldLl9lbWl0ID0gZW1pdDtcbiAgbW9kZVtrZXldLl9tdWx0aSA9IHRydWU7XG59XG5cbi8qKlxuICogQHBhcmFtIHtDb21waWxlZE1vZGV9IG1vZGVcbiAqL1xuZnVuY3Rpb24gYmVnaW5NdWx0aUNsYXNzKG1vZGUpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KG1vZGUuYmVnaW4pKSByZXR1cm47XG5cbiAgaWYgKG1vZGUuc2tpcCB8fCBtb2RlLmV4Y2x1ZGVCZWdpbiB8fCBtb2RlLnJldHVybkJlZ2luKSB7XG4gICAgZXJyb3IoXCJza2lwLCBleGNsdWRlQmVnaW4sIHJldHVybkJlZ2luIG5vdCBjb21wYXRpYmxlIHdpdGggYmVnaW5TY29wZToge31cIik7XG4gICAgdGhyb3cgTXVsdGlDbGFzc0Vycm9yO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBtb2RlLmJlZ2luU2NvcGUgIT09IFwib2JqZWN0XCIgfHwgbW9kZS5iZWdpblNjb3BlID09PSBudWxsKSB7XG4gICAgZXJyb3IoXCJiZWdpblNjb3BlIG11c3QgYmUgb2JqZWN0XCIpO1xuICAgIHRocm93IE11bHRpQ2xhc3NFcnJvcjtcbiAgfVxuXG4gIHJlbWFwU2NvcGVOYW1lcyhtb2RlLCBtb2RlLmJlZ2luLCB7IGtleTogXCJiZWdpblNjb3BlXCIgfSk7XG4gIG1vZGUuYmVnaW4gPSBfcmV3cml0ZUJhY2tyZWZlcmVuY2VzKG1vZGUuYmVnaW4sIHsgam9pbldpdGg6IFwiXCIgfSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtDb21waWxlZE1vZGV9IG1vZGVcbiAqL1xuZnVuY3Rpb24gZW5kTXVsdGlDbGFzcyhtb2RlKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShtb2RlLmVuZCkpIHJldHVybjtcblxuICBpZiAobW9kZS5za2lwIHx8IG1vZGUuZXhjbHVkZUVuZCB8fCBtb2RlLnJldHVybkVuZCkge1xuICAgIGVycm9yKFwic2tpcCwgZXhjbHVkZUVuZCwgcmV0dXJuRW5kIG5vdCBjb21wYXRpYmxlIHdpdGggZW5kU2NvcGU6IHt9XCIpO1xuICAgIHRocm93IE11bHRpQ2xhc3NFcnJvcjtcbiAgfVxuXG4gIGlmICh0eXBlb2YgbW9kZS5lbmRTY29wZSAhPT0gXCJvYmplY3RcIiB8fCBtb2RlLmVuZFNjb3BlID09PSBudWxsKSB7XG4gICAgZXJyb3IoXCJlbmRTY29wZSBtdXN0IGJlIG9iamVjdFwiKTtcbiAgICB0aHJvdyBNdWx0aUNsYXNzRXJyb3I7XG4gIH1cblxuICByZW1hcFNjb3BlTmFtZXMobW9kZSwgbW9kZS5lbmQsIHsga2V5OiBcImVuZFNjb3BlXCIgfSk7XG4gIG1vZGUuZW5kID0gX3Jld3JpdGVCYWNrcmVmZXJlbmNlcyhtb2RlLmVuZCwgeyBqb2luV2l0aDogXCJcIiB9KTtcbn1cblxuLyoqXG4gKiB0aGlzIGV4aXN0cyBvbmx5IHRvIGFsbG93IGBzY29wZToge31gIHRvIGJlIHVzZWQgYmVzaWRlIGBtYXRjaDpgXG4gKiBPdGhlcndpc2UgYGJlZ2luU2NvcGVgIHdvdWxkIG5lY2Vzc2FyeSBhbmQgdGhhdCB3b3VsZCBsb29rIHdlaXJkXG5cbiAge1xuICAgIG1hdGNoOiBbIC9kZWYvLCAvXFx3Ky8gXVxuICAgIHNjb3BlOiB7IDE6IFwia2V5d29yZFwiICwgMjogXCJ0aXRsZVwiIH1cbiAgfVxuXG4gKiBAcGFyYW0ge0NvbXBpbGVkTW9kZX0gbW9kZVxuICovXG5mdW5jdGlvbiBzY29wZVN1Z2FyKG1vZGUpIHtcbiAgaWYgKG1vZGUuc2NvcGUgJiYgdHlwZW9mIG1vZGUuc2NvcGUgPT09IFwib2JqZWN0XCIgJiYgbW9kZS5zY29wZSAhPT0gbnVsbCkge1xuICAgIG1vZGUuYmVnaW5TY29wZSA9IG1vZGUuc2NvcGU7XG4gICAgZGVsZXRlIG1vZGUuc2NvcGU7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0NvbXBpbGVkTW9kZX0gbW9kZVxuICovXG5mdW5jdGlvbiBNdWx0aUNsYXNzKG1vZGUpIHtcbiAgc2NvcGVTdWdhcihtb2RlKTtcblxuICBpZiAodHlwZW9mIG1vZGUuYmVnaW5TY29wZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIG1vZGUuYmVnaW5TY29wZSA9IHsgX3dyYXA6IG1vZGUuYmVnaW5TY29wZSB9O1xuICB9XG4gIGlmICh0eXBlb2YgbW9kZS5lbmRTY29wZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIG1vZGUuZW5kU2NvcGUgPSB7IF93cmFwOiBtb2RlLmVuZFNjb3BlIH07XG4gIH1cblxuICBiZWdpbk11bHRpQ2xhc3MobW9kZSk7XG4gIGVuZE11bHRpQ2xhc3MobW9kZSk7XG59XG5cbi8qKlxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuTW9kZX0gTW9kZVxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQ29tcGlsZWRNb2RlfSBDb21waWxlZE1vZGVcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLkxhbmd1YWdlfSBMYW5ndWFnZVxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuSExKU1BsdWdpbn0gSExKU1BsdWdpblxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQ29tcGlsZWRMYW5ndWFnZX0gQ29tcGlsZWRMYW5ndWFnZVxuKi9cblxuLy8gY29tcGlsYXRpb25cblxuLyoqXG4gKiBDb21waWxlcyBhIGxhbmd1YWdlIGRlZmluaXRpb24gcmVzdWx0XG4gKlxuICogR2l2ZW4gdGhlIHJhdyByZXN1bHQgb2YgYSBsYW5ndWFnZSBkZWZpbml0aW9uIChMYW5ndWFnZSksIGNvbXBpbGVzIHRoaXMgc29cbiAqIHRoYXQgaXQgaXMgcmVhZHkgZm9yIGhpZ2hsaWdodGluZyBjb2RlLlxuICogQHBhcmFtIHtMYW5ndWFnZX0gbGFuZ3VhZ2VcbiAqIEByZXR1cm5zIHtDb21waWxlZExhbmd1YWdlfVxuICovXG5mdW5jdGlvbiBjb21waWxlTGFuZ3VhZ2UobGFuZ3VhZ2UpIHtcbiAgLyoqXG4gICAqIEJ1aWxkcyBhIHJlZ2V4IHdpdGggdGhlIGNhc2Ugc2Vuc2l0aXZpdHkgb2YgdGhlIGN1cnJlbnQgbGFuZ3VhZ2VcbiAgICpcbiAgICogQHBhcmFtIHtSZWdFeHAgfCBzdHJpbmd9IHZhbHVlXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2dsb2JhbF1cbiAgICovXG4gIGZ1bmN0aW9uIGxhbmdSZSh2YWx1ZSwgZ2xvYmFsKSB7XG4gICAgcmV0dXJuIG5ldyBSZWdFeHAoXG4gICAgICBzb3VyY2UodmFsdWUpLFxuICAgICAgJ20nXG4gICAgICArIChsYW5ndWFnZS5jYXNlX2luc2Vuc2l0aXZlID8gJ2knIDogJycpXG4gICAgICArIChsYW5ndWFnZS51bmljb2RlUmVnZXggPyAndScgOiAnJylcbiAgICAgICsgKGdsb2JhbCA/ICdnJyA6ICcnKVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICBTdG9yZXMgbXVsdGlwbGUgcmVndWxhciBleHByZXNzaW9ucyBhbmQgYWxsb3dzIHlvdSB0byBxdWlja2x5IHNlYXJjaCBmb3JcbiAgICB0aGVtIGFsbCBpbiBhIHN0cmluZyBzaW11bHRhbmVvdXNseSAtIHJldHVybmluZyB0aGUgZmlyc3QgbWF0Y2guICBJdCBkb2VzXG4gICAgdGhpcyBieSBjcmVhdGluZyBhIGh1Z2UgKGF8YnxjKSByZWdleCAtIGVhY2ggaW5kaXZpZHVhbCBpdGVtIHdyYXBwZWQgd2l0aCAoKVxuICAgIGFuZCBqb2luZWQgYnkgYHxgIC0gdXNpbmcgbWF0Y2ggZ3JvdXBzIHRvIHRyYWNrIHBvc2l0aW9uLiAgV2hlbiBhIG1hdGNoIGlzXG4gICAgZm91bmQgY2hlY2tpbmcgd2hpY2ggcG9zaXRpb24gaW4gdGhlIGFycmF5IGhhcyBjb250ZW50IGFsbG93cyB1cyB0byBmaWd1cmVcbiAgICBvdXQgd2hpY2ggb2YgdGhlIG9yaWdpbmFsIHJlZ2V4ZXMgLyBtYXRjaCBncm91cHMgdHJpZ2dlcmVkIHRoZSBtYXRjaC5cblxuICAgIFRoZSBtYXRjaCBvYmplY3QgaXRzZWxmICh0aGUgcmVzdWx0IG9mIGBSZWdleC5leGVjYCkgaXMgcmV0dXJuZWQgYnV0IGFsc29cbiAgICBlbmhhbmNlZCBieSBtZXJnaW5nIGluIGFueSBtZXRhLWRhdGEgdGhhdCB3YXMgcmVnaXN0ZXJlZCB3aXRoIHRoZSByZWdleC5cbiAgICBUaGlzIGlzIGhvdyB3ZSBrZWVwIHRyYWNrIG9mIHdoaWNoIG1vZGUgbWF0Y2hlZCwgYW5kIHdoYXQgdHlwZSBvZiBydWxlXG4gICAgKGBpbGxlZ2FsYCwgYGJlZ2luYCwgZW5kLCBldGMpLlxuICAqL1xuICBjbGFzcyBNdWx0aVJlZ2V4IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgIHRoaXMubWF0Y2hJbmRleGVzID0ge307XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICB0aGlzLnJlZ2V4ZXMgPSBbXTtcbiAgICAgIHRoaXMubWF0Y2hBdCA9IDE7XG4gICAgICB0aGlzLnBvc2l0aW9uID0gMDtcbiAgICB9XG5cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgYWRkUnVsZShyZSwgb3B0cykge1xuICAgICAgb3B0cy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24rKztcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIHRoaXMubWF0Y2hJbmRleGVzW3RoaXMubWF0Y2hBdF0gPSBvcHRzO1xuICAgICAgdGhpcy5yZWdleGVzLnB1c2goW29wdHMsIHJlXSk7XG4gICAgICB0aGlzLm1hdGNoQXQgKz0gY291bnRNYXRjaEdyb3VwcyhyZSkgKyAxO1xuICAgIH1cblxuICAgIGNvbXBpbGUoKSB7XG4gICAgICBpZiAodGhpcy5yZWdleGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAvLyBhdm9pZHMgdGhlIG5lZWQgdG8gY2hlY2sgbGVuZ3RoIGV2ZXJ5IHRpbWUgZXhlYyBpcyBjYWxsZWRcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICB0aGlzLmV4ZWMgPSAoKSA9PiBudWxsO1xuICAgICAgfVxuICAgICAgY29uc3QgdGVybWluYXRvcnMgPSB0aGlzLnJlZ2V4ZXMubWFwKGVsID0+IGVsWzFdKTtcbiAgICAgIHRoaXMubWF0Y2hlclJlID0gbGFuZ1JlKF9yZXdyaXRlQmFja3JlZmVyZW5jZXModGVybWluYXRvcnMsIHsgam9pbldpdGg6ICd8JyB9KSwgdHJ1ZSk7XG4gICAgICB0aGlzLmxhc3RJbmRleCA9IDA7XG4gICAgfVxuXG4gICAgLyoqIEBwYXJhbSB7c3RyaW5nfSBzICovXG4gICAgZXhlYyhzKSB7XG4gICAgICB0aGlzLm1hdGNoZXJSZS5sYXN0SW5kZXggPSB0aGlzLmxhc3RJbmRleDtcbiAgICAgIGNvbnN0IG1hdGNoID0gdGhpcy5tYXRjaGVyUmUuZXhlYyhzKTtcbiAgICAgIGlmICghbWF0Y2gpIHsgcmV0dXJuIG51bGw7IH1cblxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmaW5lZFxuICAgICAgY29uc3QgaSA9IG1hdGNoLmZpbmRJbmRleCgoZWwsIGkpID0+IGkgPiAwICYmIGVsICE9PSB1bmRlZmluZWQpO1xuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgY29uc3QgbWF0Y2hEYXRhID0gdGhpcy5tYXRjaEluZGV4ZXNbaV07XG4gICAgICAvLyB0cmltIG9mZiBhbnkgZWFybGllciBub24tcmVsZXZhbnQgbWF0Y2ggZ3JvdXBzIChpZSwgdGhlIG90aGVyIHJlZ2V4XG4gICAgICAvLyBtYXRjaCBncm91cHMgdGhhdCBtYWtlIHVwIHRoZSBtdWx0aS1tYXRjaGVyKVxuICAgICAgbWF0Y2guc3BsaWNlKDAsIGkpO1xuXG4gICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihtYXRjaCwgbWF0Y2hEYXRhKTtcbiAgICB9XG4gIH1cblxuICAvKlxuICAgIENyZWF0ZWQgdG8gc29sdmUgdGhlIGtleSBkZWZpY2llbnRseSB3aXRoIE11bHRpUmVnZXggLSB0aGVyZSBpcyBubyB3YXkgdG9cbiAgICB0ZXN0IGZvciBtdWx0aXBsZSBtYXRjaGVzIGF0IGEgc2luZ2xlIGxvY2F0aW9uLiAgV2h5IHdvdWxkIHdlIG5lZWQgdG8gZG9cbiAgICB0aGF0PyAgSW4gdGhlIGZ1dHVyZSBhIG1vcmUgZHluYW1pYyBlbmdpbmUgd2lsbCBhbGxvdyBjZXJ0YWluIG1hdGNoZXMgdG8gYmVcbiAgICBpZ25vcmVkLiAgQW4gZXhhbXBsZTogaWYgd2UgbWF0Y2hlZCBzYXkgdGhlIDNyZCByZWdleCBpbiBhIGxhcmdlIGdyb3VwIGJ1dFxuICAgIGRlY2lkZWQgdG8gaWdub3JlIGl0IC0gd2UnZCBuZWVkIHRvIHN0YXJ0ZWQgdGVzdGluZyBhZ2FpbiBhdCB0aGUgNHRoXG4gICAgcmVnZXguLi4gYnV0IE11bHRpUmVnZXggaXRzZWxmIGdpdmVzIHVzIG5vIHJlYWwgd2F5IHRvIGRvIHRoYXQuXG5cbiAgICBTbyB3aGF0IHRoaXMgY2xhc3MgY3JlYXRlcyBNdWx0aVJlZ2V4cyBvbiB0aGUgZmx5IGZvciB3aGF0ZXZlciBzZWFyY2hcbiAgICBwb3NpdGlvbiB0aGV5IGFyZSBuZWVkZWQuXG5cbiAgICBOT1RFOiBUaGVzZSBhZGRpdGlvbmFsIE11bHRpUmVnZXggb2JqZWN0cyBhcmUgY3JlYXRlZCBkeW5hbWljYWxseS4gIEZvciBtb3N0XG4gICAgZ3JhbW1hcnMgbW9zdCBvZiB0aGUgdGltZSB3ZSB3aWxsIG5ldmVyIGFjdHVhbGx5IG5lZWQgYW55dGhpbmcgbW9yZSB0aGFuIHRoZVxuICAgIGZpcnN0IE11bHRpUmVnZXggLSBzbyB0aGlzIHNob3VsZG4ndCBoYXZlIHRvbyBtdWNoIG92ZXJoZWFkLlxuXG4gICAgU2F5IHRoaXMgaXMgb3VyIHNlYXJjaCBncm91cCwgYW5kIHdlIG1hdGNoIHJlZ2V4MywgYnV0IHdpc2ggdG8gaWdub3JlIGl0LlxuXG4gICAgICByZWdleDEgfCByZWdleDIgfCByZWdleDMgfCByZWdleDQgfCByZWdleDUgICAgJyBpZSwgc3RhcnRBdCA9IDBcblxuICAgIFdoYXQgd2UgbmVlZCBpcyBhIG5ldyBNdWx0aVJlZ2V4IHRoYXQgb25seSBpbmNsdWRlcyB0aGUgcmVtYWluaW5nXG4gICAgcG9zc2liaWxpdGllczpcblxuICAgICAgcmVnZXg0IHwgcmVnZXg1ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgaWUsIHN0YXJ0QXQgPSAzXG5cbiAgICBUaGlzIGNsYXNzIHdyYXBzIGFsbCB0aGF0IGNvbXBsZXhpdHkgdXAgaW4gYSBzaW1wbGUgQVBJLi4uIGBzdGFydEF0YCBkZWNpZGVzXG4gICAgd2hlcmUgaW4gdGhlIGFycmF5IG9mIGV4cHJlc3Npb25zIHRvIHN0YXJ0IGRvaW5nIHRoZSBtYXRjaGluZy4gSXRcbiAgICBhdXRvLWluY3JlbWVudHMsIHNvIGlmIGEgbWF0Y2ggaXMgZm91bmQgYXQgcG9zaXRpb24gMiwgdGhlbiBzdGFydEF0IHdpbGwgYmVcbiAgICBzZXQgdG8gMy4gIElmIHRoZSBlbmQgaXMgcmVhY2hlZCBzdGFydEF0IHdpbGwgcmV0dXJuIHRvIDAuXG5cbiAgICBNT1NUIG9mIHRoZSB0aW1lIHRoZSBwYXJzZXIgd2lsbCBiZSBzZXR0aW5nIHN0YXJ0QXQgbWFudWFsbHkgdG8gMC5cbiAgKi9cbiAgY2xhc3MgUmVzdW1hYmxlTXVsdGlSZWdleCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICB0aGlzLnJ1bGVzID0gW107XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICB0aGlzLm11bHRpUmVnZXhlcyA9IFtdO1xuICAgICAgdGhpcy5jb3VudCA9IDA7XG5cbiAgICAgIHRoaXMubGFzdEluZGV4ID0gMDtcbiAgICAgIHRoaXMucmVnZXhJbmRleCA9IDA7XG4gICAgfVxuXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGdldE1hdGNoZXIoaW5kZXgpIHtcbiAgICAgIGlmICh0aGlzLm11bHRpUmVnZXhlc1tpbmRleF0pIHJldHVybiB0aGlzLm11bHRpUmVnZXhlc1tpbmRleF07XG5cbiAgICAgIGNvbnN0IG1hdGNoZXIgPSBuZXcgTXVsdGlSZWdleCgpO1xuICAgICAgdGhpcy5ydWxlcy5zbGljZShpbmRleCkuZm9yRWFjaCgoW3JlLCBvcHRzXSkgPT4gbWF0Y2hlci5hZGRSdWxlKHJlLCBvcHRzKSk7XG4gICAgICBtYXRjaGVyLmNvbXBpbGUoKTtcbiAgICAgIHRoaXMubXVsdGlSZWdleGVzW2luZGV4XSA9IG1hdGNoZXI7XG4gICAgICByZXR1cm4gbWF0Y2hlcjtcbiAgICB9XG5cbiAgICByZXN1bWluZ1NjYW5BdFNhbWVQb3NpdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlZ2V4SW5kZXggIT09IDA7XG4gICAgfVxuXG4gICAgY29uc2lkZXJBbGwoKSB7XG4gICAgICB0aGlzLnJlZ2V4SW5kZXggPSAwO1xuICAgIH1cblxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBhZGRSdWxlKHJlLCBvcHRzKSB7XG4gICAgICB0aGlzLnJ1bGVzLnB1c2goW3JlLCBvcHRzXSk7XG4gICAgICBpZiAob3B0cy50eXBlID09PSBcImJlZ2luXCIpIHRoaXMuY291bnQrKztcbiAgICB9XG5cbiAgICAvKiogQHBhcmFtIHtzdHJpbmd9IHMgKi9cbiAgICBleGVjKHMpIHtcbiAgICAgIGNvbnN0IG0gPSB0aGlzLmdldE1hdGNoZXIodGhpcy5yZWdleEluZGV4KTtcbiAgICAgIG0ubGFzdEluZGV4ID0gdGhpcy5sYXN0SW5kZXg7XG4gICAgICBsZXQgcmVzdWx0ID0gbS5leGVjKHMpO1xuXG4gICAgICAvLyBUaGUgZm9sbG93aW5nIGlzIGJlY2F1c2Ugd2UgaGF2ZSBubyBlYXN5IHdheSB0byBzYXkgXCJyZXN1bWUgc2Nhbm5pbmcgYXQgdGhlXG4gICAgICAvLyBleGlzdGluZyBwb3NpdGlvbiBidXQgYWxzbyBza2lwIHRoZSBjdXJyZW50IHJ1bGUgT05MWVwiLiBXaGF0IGhhcHBlbnMgaXNcbiAgICAgIC8vIGFsbCBwcmlvciBydWxlcyBhcmUgYWxzbyBza2lwcGVkIHdoaWNoIGNhbiByZXN1bHQgaW4gbWF0Y2hpbmcgdGhlIHdyb25nXG4gICAgICAvLyB0aGluZy4gRXhhbXBsZSBvZiBtYXRjaGluZyBcImJvb2dlclwiOlxuXG4gICAgICAvLyBvdXIgbWF0Y2hlciBpcyBbc3RyaW5nLCBcImJvb2dlclwiLCBudW1iZXJdXG4gICAgICAvL1xuICAgICAgLy8gLi4uLmJvb2dlci4uLi5cblxuICAgICAgLy8gaWYgXCJib29nZXJcIiBpcyBpZ25vcmVkIHRoZW4gd2UnZCByZWFsbHkgbmVlZCBhIHJlZ2V4IHRvIHNjYW4gZnJvbSB0aGVcbiAgICAgIC8vIFNBTUUgcG9zaXRpb24gZm9yIG9ubHk6IFtzdHJpbmcsIG51bWJlcl0gYnV0IGlnbm9yaW5nIFwiYm9vZ2VyXCIgKGlmIGl0XG4gICAgICAvLyB3YXMgdGhlIGZpcnN0IG1hdGNoKSwgYSBzaW1wbGUgcmVzdW1lIHdvdWxkIHNjYW4gYWhlYWQgd2hvIGtub3dzIGhvd1xuICAgICAgLy8gZmFyIGxvb2tpbmcgb25seSBmb3IgXCJudW1iZXJcIiwgaWdub3JpbmcgcG90ZW50aWFsIHN0cmluZyBtYXRjaGVzIChvclxuICAgICAgLy8gZnV0dXJlIFwiYm9vZ2VyXCIgbWF0Y2hlcyB0aGF0IG1pZ2h0IGJlIHZhbGlkLilcblxuICAgICAgLy8gU28gd2hhdCB3ZSBkbzogV2UgZXhlY3V0ZSB0d28gbWF0Y2hlcnMsIG9uZSByZXN1bWluZyBhdCB0aGUgc2FtZVxuICAgICAgLy8gcG9zaXRpb24sIGJ1dCB0aGUgc2Vjb25kIGZ1bGwgbWF0Y2hlciBzdGFydGluZyBhdCB0aGUgcG9zaXRpb24gYWZ0ZXI6XG5cbiAgICAgIC8vICAgICAvLS0tIHJlc3VtZSBmaXJzdCByZWdleCBtYXRjaCBoZXJlIChmb3IgW251bWJlcl0pXG4gICAgICAvLyAgICAgfC8tLS0tIGZ1bGwgbWF0Y2ggaGVyZSBmb3IgW3N0cmluZywgXCJib29nZXJcIiwgbnVtYmVyXVxuICAgICAgLy8gICAgIHZ2XG4gICAgICAvLyAuLi4uYm9vZ2VyLi4uLlxuXG4gICAgICAvLyBXaGljaCBldmVyIHJlc3VsdHMgaW4gYSBtYXRjaCBmaXJzdCBpcyB0aGVuIHVzZWQuIFNvIHRoaXMgMy00IHN0ZXBcbiAgICAgIC8vIHByb2Nlc3MgZXNzZW50aWFsbHkgYWxsb3dzIHVzIHRvIHNheSBcIm1hdGNoIGF0IHRoaXMgcG9zaXRpb24sIGV4Y2x1ZGluZ1xuICAgICAgLy8gYSBwcmlvciBydWxlIHRoYXQgd2FzIGlnbm9yZWRcIi5cbiAgICAgIC8vXG4gICAgICAvLyAxLiBNYXRjaCBcImJvb2dlclwiIGZpcnN0LCBpZ25vcmUuIEFsc28gcHJvdmVzIHRoYXQgW3N0cmluZ10gZG9lcyBub24gbWF0Y2guXG4gICAgICAvLyAyLiBSZXN1bWUgbWF0Y2hpbmcgZm9yIFtudW1iZXJdXG4gICAgICAvLyAzLiBNYXRjaCBhdCBpbmRleCArIDEgZm9yIFtzdHJpbmcsIFwiYm9vZ2VyXCIsIG51bWJlcl1cbiAgICAgIC8vIDQuIElmICMyIGFuZCAjMyByZXN1bHQgaW4gbWF0Y2hlcywgd2hpY2ggY2FtZSBmaXJzdD9cbiAgICAgIGlmICh0aGlzLnJlc3VtaW5nU2NhbkF0U2FtZVBvc2l0aW9uKCkpIHtcbiAgICAgICAgaWYgKHJlc3VsdCAmJiByZXN1bHQuaW5kZXggPT09IHRoaXMubGFzdEluZGV4KSA7IGVsc2UgeyAvLyB1c2UgdGhlIHNlY29uZCBtYXRjaGVyIHJlc3VsdFxuICAgICAgICAgIGNvbnN0IG0yID0gdGhpcy5nZXRNYXRjaGVyKDApO1xuICAgICAgICAgIG0yLmxhc3RJbmRleCA9IHRoaXMubGFzdEluZGV4ICsgMTtcbiAgICAgICAgICByZXN1bHQgPSBtMi5leGVjKHMpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgdGhpcy5yZWdleEluZGV4ICs9IHJlc3VsdC5wb3NpdGlvbiArIDE7XG4gICAgICAgIGlmICh0aGlzLnJlZ2V4SW5kZXggPT09IHRoaXMuY291bnQpIHtcbiAgICAgICAgICAvLyB3cmFwLWFyb3VuZCB0byBjb25zaWRlcmluZyBhbGwgbWF0Y2hlcyBhZ2FpblxuICAgICAgICAgIHRoaXMuY29uc2lkZXJBbGwoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHaXZlbiBhIG1vZGUsIGJ1aWxkcyBhIGh1Z2UgUmVzdW1hYmxlTXVsdGlSZWdleCB0aGF0IGNhbiBiZSB1c2VkIHRvIHdhbGtcbiAgICogdGhlIGNvbnRlbnQgYW5kIGZpbmQgbWF0Y2hlcy5cbiAgICpcbiAgICogQHBhcmFtIHtDb21waWxlZE1vZGV9IG1vZGVcbiAgICogQHJldHVybnMge1Jlc3VtYWJsZU11bHRpUmVnZXh9XG4gICAqL1xuICBmdW5jdGlvbiBidWlsZE1vZGVSZWdleChtb2RlKSB7XG4gICAgY29uc3QgbW0gPSBuZXcgUmVzdW1hYmxlTXVsdGlSZWdleCgpO1xuXG4gICAgbW9kZS5jb250YWlucy5mb3JFYWNoKHRlcm0gPT4gbW0uYWRkUnVsZSh0ZXJtLmJlZ2luLCB7IHJ1bGU6IHRlcm0sIHR5cGU6IFwiYmVnaW5cIiB9KSk7XG5cbiAgICBpZiAobW9kZS50ZXJtaW5hdG9yRW5kKSB7XG4gICAgICBtbS5hZGRSdWxlKG1vZGUudGVybWluYXRvckVuZCwgeyB0eXBlOiBcImVuZFwiIH0pO1xuICAgIH1cbiAgICBpZiAobW9kZS5pbGxlZ2FsKSB7XG4gICAgICBtbS5hZGRSdWxlKG1vZGUuaWxsZWdhbCwgeyB0eXBlOiBcImlsbGVnYWxcIiB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbW07XG4gIH1cblxuICAvKiogc2tpcCB2cyBhYm9ydCB2cyBpZ25vcmVcbiAgICpcbiAgICogQHNraXAgICAtIFRoZSBtb2RlIGlzIHN0aWxsIGVudGVyZWQgYW5kIGV4aXRlZCBub3JtYWxseSAoYW5kIGNvbnRhaW5zIHJ1bGVzIGFwcGx5KSxcbiAgICogICAgICAgICAgIGJ1dCBhbGwgY29udGVudCBpcyBoZWxkIGFuZCBhZGRlZCB0byB0aGUgcGFyZW50IGJ1ZmZlciByYXRoZXIgdGhhbiBiZWluZ1xuICAgKiAgICAgICAgICAgb3V0cHV0IHdoZW4gdGhlIG1vZGUgZW5kcy4gIE1vc3RseSB1c2VkIHdpdGggYHN1Ymxhbmd1YWdlYCB0byBidWlsZCB1cFxuICAgKiAgICAgICAgICAgYSBzaW5nbGUgbGFyZ2UgYnVmZmVyIHRoYW4gY2FuIGJlIHBhcnNlZCBieSBzdWJsYW5ndWFnZS5cbiAgICpcbiAgICogICAgICAgICAgICAgLSBUaGUgbW9kZSBiZWdpbiBhbmRzIGVuZHMgbm9ybWFsbHkuXG4gICAqICAgICAgICAgICAgIC0gQ29udGVudCBtYXRjaGVkIGlzIGFkZGVkIHRvIHRoZSBwYXJlbnQgbW9kZSBidWZmZXIuXG4gICAqICAgICAgICAgICAgIC0gVGhlIHBhcnNlciBjdXJzb3IgaXMgbW92ZWQgZm9yd2FyZCBub3JtYWxseS5cbiAgICpcbiAgICogQGFib3J0ICAtIEEgaGFjayBwbGFjZWhvbGRlciB1bnRpbCB3ZSBoYXZlIGlnbm9yZS4gIEFib3J0cyB0aGUgbW9kZSAoYXMgaWYgaXRcbiAgICogICAgICAgICAgIG5ldmVyIG1hdGNoZWQpIGJ1dCBET0VTIE5PVCBjb250aW51ZSB0byBtYXRjaCBzdWJzZXF1ZW50IGBjb250YWluc2BcbiAgICogICAgICAgICAgIG1vZGVzLiAgQWJvcnQgaXMgYmFkL3N1Ym9wdGltYWwgYmVjYXVzZSBpdCBjYW4gcmVzdWx0IGluIG1vZGVzXG4gICAqICAgICAgICAgICBmYXJ0aGVyIGRvd24gbm90IGdldHRpbmcgYXBwbGllZCBiZWNhdXNlIGFuIGVhcmxpZXIgcnVsZSBlYXRzIHRoZVxuICAgKiAgICAgICAgICAgY29udGVudCBidXQgdGhlbiBhYm9ydHMuXG4gICAqXG4gICAqICAgICAgICAgICAgIC0gVGhlIG1vZGUgZG9lcyBub3QgYmVnaW4uXG4gICAqICAgICAgICAgICAgIC0gQ29udGVudCBtYXRjaGVkIGJ5IGBiZWdpbmAgaXMgYWRkZWQgdG8gdGhlIG1vZGUgYnVmZmVyLlxuICAgKiAgICAgICAgICAgICAtIFRoZSBwYXJzZXIgY3Vyc29yIGlzIG1vdmVkIGZvcndhcmQgYWNjb3JkaW5nbHkuXG4gICAqXG4gICAqIEBpZ25vcmUgLSBJZ25vcmVzIHRoZSBtb2RlIChhcyBpZiBpdCBuZXZlciBtYXRjaGVkKSBhbmQgY29udGludWVzIHRvIG1hdGNoIGFueVxuICAgKiAgICAgICAgICAgc3Vic2VxdWVudCBgY29udGFpbnNgIG1vZGVzLiAgSWdub3JlIGlzbid0IHRlY2huaWNhbGx5IHBvc3NpYmxlIHdpdGhcbiAgICogICAgICAgICAgIHRoZSBjdXJyZW50IHBhcnNlciBpbXBsZW1lbnRhdGlvbi5cbiAgICpcbiAgICogICAgICAgICAgICAgLSBUaGUgbW9kZSBkb2VzIG5vdCBiZWdpbi5cbiAgICogICAgICAgICAgICAgLSBDb250ZW50IG1hdGNoZWQgYnkgYGJlZ2luYCBpcyBpZ25vcmVkLlxuICAgKiAgICAgICAgICAgICAtIFRoZSBwYXJzZXIgY3Vyc29yIGlzIG5vdCBtb3ZlZCBmb3J3YXJkLlxuICAgKi9cblxuICAvKipcbiAgICogQ29tcGlsZXMgYW4gaW5kaXZpZHVhbCBtb2RlXG4gICAqXG4gICAqIFRoaXMgY2FuIHJhaXNlIGFuIGVycm9yIGlmIHRoZSBtb2RlIGNvbnRhaW5zIGNlcnRhaW4gZGV0ZWN0YWJsZSBrbm93biBsb2dpY1xuICAgKiBpc3N1ZXMuXG4gICAqIEBwYXJhbSB7TW9kZX0gbW9kZVxuICAgKiBAcGFyYW0ge0NvbXBpbGVkTW9kZSB8IG51bGx9IFtwYXJlbnRdXG4gICAqIEByZXR1cm5zIHtDb21waWxlZE1vZGUgfCBuZXZlcn1cbiAgICovXG4gIGZ1bmN0aW9uIGNvbXBpbGVNb2RlKG1vZGUsIHBhcmVudCkge1xuICAgIGNvbnN0IGNtb2RlID0gLyoqIEB0eXBlIENvbXBpbGVkTW9kZSAqLyAobW9kZSk7XG4gICAgaWYgKG1vZGUuaXNDb21waWxlZCkgcmV0dXJuIGNtb2RlO1xuXG4gICAgW1xuICAgICAgc2NvcGVDbGFzc05hbWUsXG4gICAgICAvLyBkbyB0aGlzIGVhcmx5IHNvIGNvbXBpbGVyIGV4dGVuc2lvbnMgZ2VuZXJhbGx5IGRvbid0IGhhdmUgdG8gd29ycnkgYWJvdXRcbiAgICAgIC8vIHRoZSBkaXN0aW5jdGlvbiBiZXR3ZWVuIG1hdGNoL2JlZ2luXG4gICAgICBjb21waWxlTWF0Y2gsXG4gICAgICBNdWx0aUNsYXNzLFxuICAgICAgYmVmb3JlTWF0Y2hFeHRcbiAgICBdLmZvckVhY2goZXh0ID0+IGV4dChtb2RlLCBwYXJlbnQpKTtcblxuICAgIGxhbmd1YWdlLmNvbXBpbGVyRXh0ZW5zaW9ucy5mb3JFYWNoKGV4dCA9PiBleHQobW9kZSwgcGFyZW50KSk7XG5cbiAgICAvLyBfX2JlZm9yZUJlZ2luIGlzIGNvbnNpZGVyZWQgcHJpdmF0ZSBBUEksIGludGVybmFsIHVzZSBvbmx5XG4gICAgbW9kZS5fX2JlZm9yZUJlZ2luID0gbnVsbDtcblxuICAgIFtcbiAgICAgIGJlZ2luS2V5d29yZHMsXG4gICAgICAvLyBkbyB0aGlzIGxhdGVyIHNvIGNvbXBpbGVyIGV4dGVuc2lvbnMgdGhhdCBjb21lIGVhcmxpZXIgaGF2ZSBhY2Nlc3MgdG8gdGhlXG4gICAgICAvLyByYXcgYXJyYXkgaWYgdGhleSB3YW50ZWQgdG8gcGVyaGFwcyBtYW5pcHVsYXRlIGl0LCBldGMuXG4gICAgICBjb21waWxlSWxsZWdhbCxcbiAgICAgIC8vIGRlZmF1bHQgdG8gMSByZWxldmFuY2UgaWYgbm90IHNwZWNpZmllZFxuICAgICAgY29tcGlsZVJlbGV2YW5jZVxuICAgIF0uZm9yRWFjaChleHQgPT4gZXh0KG1vZGUsIHBhcmVudCkpO1xuXG4gICAgbW9kZS5pc0NvbXBpbGVkID0gdHJ1ZTtcblxuICAgIGxldCBrZXl3b3JkUGF0dGVybiA9IG51bGw7XG4gICAgaWYgKHR5cGVvZiBtb2RlLmtleXdvcmRzID09PSBcIm9iamVjdFwiICYmIG1vZGUua2V5d29yZHMuJHBhdHRlcm4pIHtcbiAgICAgIC8vIHdlIG5lZWQgYSBjb3B5IGJlY2F1c2Uga2V5d29yZHMgbWlnaHQgYmUgY29tcGlsZWQgbXVsdGlwbGUgdGltZXNcbiAgICAgIC8vIHNvIHdlIGNhbid0IGdvIGRlbGV0aW5nICRwYXR0ZXJuIGZyb20gdGhlIG9yaWdpbmFsIG9uIHRoZSBmaXJzdFxuICAgICAgLy8gcGFzc1xuICAgICAgbW9kZS5rZXl3b3JkcyA9IE9iamVjdC5hc3NpZ24oe30sIG1vZGUua2V5d29yZHMpO1xuICAgICAga2V5d29yZFBhdHRlcm4gPSBtb2RlLmtleXdvcmRzLiRwYXR0ZXJuO1xuICAgICAgZGVsZXRlIG1vZGUua2V5d29yZHMuJHBhdHRlcm47XG4gICAgfVxuICAgIGtleXdvcmRQYXR0ZXJuID0ga2V5d29yZFBhdHRlcm4gfHwgL1xcdysvO1xuXG4gICAgaWYgKG1vZGUua2V5d29yZHMpIHtcbiAgICAgIG1vZGUua2V5d29yZHMgPSBjb21waWxlS2V5d29yZHMobW9kZS5rZXl3b3JkcywgbGFuZ3VhZ2UuY2FzZV9pbnNlbnNpdGl2ZSk7XG4gICAgfVxuXG4gICAgY21vZGUua2V5d29yZFBhdHRlcm5SZSA9IGxhbmdSZShrZXl3b3JkUGF0dGVybiwgdHJ1ZSk7XG5cbiAgICBpZiAocGFyZW50KSB7XG4gICAgICBpZiAoIW1vZGUuYmVnaW4pIG1vZGUuYmVnaW4gPSAvXFxCfFxcYi87XG4gICAgICBjbW9kZS5iZWdpblJlID0gbGFuZ1JlKGNtb2RlLmJlZ2luKTtcbiAgICAgIGlmICghbW9kZS5lbmQgJiYgIW1vZGUuZW5kc1dpdGhQYXJlbnQpIG1vZGUuZW5kID0gL1xcQnxcXGIvO1xuICAgICAgaWYgKG1vZGUuZW5kKSBjbW9kZS5lbmRSZSA9IGxhbmdSZShjbW9kZS5lbmQpO1xuICAgICAgY21vZGUudGVybWluYXRvckVuZCA9IHNvdXJjZShjbW9kZS5lbmQpIHx8ICcnO1xuICAgICAgaWYgKG1vZGUuZW5kc1dpdGhQYXJlbnQgJiYgcGFyZW50LnRlcm1pbmF0b3JFbmQpIHtcbiAgICAgICAgY21vZGUudGVybWluYXRvckVuZCArPSAobW9kZS5lbmQgPyAnfCcgOiAnJykgKyBwYXJlbnQudGVybWluYXRvckVuZDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG1vZGUuaWxsZWdhbCkgY21vZGUuaWxsZWdhbFJlID0gbGFuZ1JlKC8qKiBAdHlwZSB7UmVnRXhwIHwgc3RyaW5nfSAqLyAobW9kZS5pbGxlZ2FsKSk7XG4gICAgaWYgKCFtb2RlLmNvbnRhaW5zKSBtb2RlLmNvbnRhaW5zID0gW107XG5cbiAgICBtb2RlLmNvbnRhaW5zID0gW10uY29uY2F0KC4uLm1vZGUuY29udGFpbnMubWFwKGZ1bmN0aW9uKGMpIHtcbiAgICAgIHJldHVybiBleHBhbmRPckNsb25lTW9kZShjID09PSAnc2VsZicgPyBtb2RlIDogYyk7XG4gICAgfSkpO1xuICAgIG1vZGUuY29udGFpbnMuZm9yRWFjaChmdW5jdGlvbihjKSB7IGNvbXBpbGVNb2RlKC8qKiBAdHlwZSBNb2RlICovIChjKSwgY21vZGUpOyB9KTtcblxuICAgIGlmIChtb2RlLnN0YXJ0cykge1xuICAgICAgY29tcGlsZU1vZGUobW9kZS5zdGFydHMsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgY21vZGUubWF0Y2hlciA9IGJ1aWxkTW9kZVJlZ2V4KGNtb2RlKTtcbiAgICByZXR1cm4gY21vZGU7XG4gIH1cblxuICBpZiAoIWxhbmd1YWdlLmNvbXBpbGVyRXh0ZW5zaW9ucykgbGFuZ3VhZ2UuY29tcGlsZXJFeHRlbnNpb25zID0gW107XG5cbiAgLy8gc2VsZiBpcyBub3QgdmFsaWQgYXQgdGhlIHRvcC1sZXZlbFxuICBpZiAobGFuZ3VhZ2UuY29udGFpbnMgJiYgbGFuZ3VhZ2UuY29udGFpbnMuaW5jbHVkZXMoJ3NlbGYnKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkVSUjogY29udGFpbnMgYHNlbGZgIGlzIG5vdCBzdXBwb3J0ZWQgYXQgdGhlIHRvcC1sZXZlbCBvZiBhIGxhbmd1YWdlLiAgU2VlIGRvY3VtZW50YXRpb24uXCIpO1xuICB9XG5cbiAgLy8gd2UgbmVlZCBhIG51bGwgb2JqZWN0LCB3aGljaCBpbmhlcml0IHdpbGwgZ3VhcmFudGVlXG4gIGxhbmd1YWdlLmNsYXNzTmFtZUFsaWFzZXMgPSBpbmhlcml0JDEobGFuZ3VhZ2UuY2xhc3NOYW1lQWxpYXNlcyB8fCB7fSk7XG5cbiAgcmV0dXJuIGNvbXBpbGVNb2RlKC8qKiBAdHlwZSBNb2RlICovIChsYW5ndWFnZSkpO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgYSBtb2RlIGhhcyBhIGRlcGVuZGVuY3kgb24gaXQncyBwYXJlbnQgb3Igbm90XG4gKlxuICogSWYgYSBtb2RlIGRvZXMgaGF2ZSBhIHBhcmVudCBkZXBlbmRlbmN5IHRoZW4gb2Z0ZW4gd2UgbmVlZCB0byBjbG9uZSBpdCBpZlxuICogaXQncyB1c2VkIGluIG11bHRpcGxlIHBsYWNlcyBzbyB0aGF0IGVhY2ggY29weSBwb2ludHMgdG8gdGhlIGNvcnJlY3QgcGFyZW50LFxuICogd2hlcmUtYXMgbW9kZXMgd2l0aG91dCBhIHBhcmVudCBjYW4gb2Z0ZW4gc2FmZWx5IGJlIHJlLXVzZWQgYXQgdGhlIGJvdHRvbSBvZlxuICogYSBtb2RlIGNoYWluLlxuICpcbiAqIEBwYXJhbSB7TW9kZSB8IG51bGx9IG1vZGVcbiAqIEByZXR1cm5zIHtib29sZWFufSAtIGlzIHRoZXJlIGEgZGVwZW5kZW5jeSBvbiB0aGUgcGFyZW50P1xuICogKi9cbmZ1bmN0aW9uIGRlcGVuZGVuY3lPblBhcmVudChtb2RlKSB7XG4gIGlmICghbW9kZSkgcmV0dXJuIGZhbHNlO1xuXG4gIHJldHVybiBtb2RlLmVuZHNXaXRoUGFyZW50IHx8IGRlcGVuZGVuY3lPblBhcmVudChtb2RlLnN0YXJ0cyk7XG59XG5cbi8qKlxuICogRXhwYW5kcyBhIG1vZGUgb3IgY2xvbmVzIGl0IGlmIG5lY2Vzc2FyeVxuICpcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IGZvciBtb2RlcyB3aXRoIHBhcmVudGFsIGRlcGVuZGVuY2VpcyAoc2VlIG5vdGVzIG9uXG4gKiBgZGVwZW5kZW5jeU9uUGFyZW50YCkgYW5kIGZvciBub2RlcyB0aGF0IGhhdmUgYHZhcmlhbnRzYCAtIHdoaWNoIG11c3QgdGhlbiBiZVxuICogZXhwbG9kZWQgaW50byB0aGVpciBvd24gaW5kaXZpZHVhbCBtb2RlcyBhdCBjb21waWxlIHRpbWUuXG4gKlxuICogQHBhcmFtIHtNb2RlfSBtb2RlXG4gKiBAcmV0dXJucyB7TW9kZSB8IE1vZGVbXX1cbiAqICovXG5mdW5jdGlvbiBleHBhbmRPckNsb25lTW9kZShtb2RlKSB7XG4gIGlmIChtb2RlLnZhcmlhbnRzICYmICFtb2RlLmNhY2hlZFZhcmlhbnRzKSB7XG4gICAgbW9kZS5jYWNoZWRWYXJpYW50cyA9IG1vZGUudmFyaWFudHMubWFwKGZ1bmN0aW9uKHZhcmlhbnQpIHtcbiAgICAgIHJldHVybiBpbmhlcml0JDEobW9kZSwgeyB2YXJpYW50czogbnVsbCB9LCB2YXJpYW50KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIEVYUEFORFxuICAvLyBpZiB3ZSBoYXZlIHZhcmlhbnRzIHRoZW4gZXNzZW50aWFsbHkgXCJyZXBsYWNlXCIgdGhlIG1vZGUgd2l0aCB0aGUgdmFyaWFudHNcbiAgLy8gdGhpcyBoYXBwZW5zIGluIGNvbXBpbGVNb2RlLCB3aGVyZSB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBmcm9tXG4gIGlmIChtb2RlLmNhY2hlZFZhcmlhbnRzKSB7XG4gICAgcmV0dXJuIG1vZGUuY2FjaGVkVmFyaWFudHM7XG4gIH1cblxuICAvLyBDTE9ORVxuICAvLyBpZiB3ZSBoYXZlIGRlcGVuZGVuY2llcyBvbiBwYXJlbnRzIHRoZW4gd2UgbmVlZCBhIHVuaXF1ZVxuICAvLyBpbnN0YW5jZSBvZiBvdXJzZWx2ZXMsIHNvIHdlIGNhbiBiZSByZXVzZWQgd2l0aCBtYW55XG4gIC8vIGRpZmZlcmVudCBwYXJlbnRzIHdpdGhvdXQgaXNzdWVcbiAgaWYgKGRlcGVuZGVuY3lPblBhcmVudChtb2RlKSkge1xuICAgIHJldHVybiBpbmhlcml0JDEobW9kZSwgeyBzdGFydHM6IG1vZGUuc3RhcnRzID8gaW5oZXJpdCQxKG1vZGUuc3RhcnRzKSA6IG51bGwgfSk7XG4gIH1cblxuICBpZiAoT2JqZWN0LmlzRnJvemVuKG1vZGUpKSB7XG4gICAgcmV0dXJuIGluaGVyaXQkMShtb2RlKTtcbiAgfVxuXG4gIC8vIG5vIHNwZWNpYWwgZGVwZW5kZW5jeSBpc3N1ZXMsIGp1c3QgcmV0dXJuIG91cnNlbHZlc1xuICByZXR1cm4gbW9kZTtcbn1cblxudmFyIHZlcnNpb24gPSBcIjExLjExLjFcIjtcblxuY2xhc3MgSFRNTEluamVjdGlvbkVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihyZWFzb24sIGh0bWwpIHtcbiAgICBzdXBlcihyZWFzb24pO1xuICAgIHRoaXMubmFtZSA9IFwiSFRNTEluamVjdGlvbkVycm9yXCI7XG4gICAgdGhpcy5odG1sID0gaHRtbDtcbiAgfVxufVxuXG4vKlxuU3ludGF4IGhpZ2hsaWdodGluZyB3aXRoIGxhbmd1YWdlIGF1dG9kZXRlY3Rpb24uXG5odHRwczovL2hpZ2hsaWdodGpzLm9yZy9cbiovXG5cblxuXG4vKipcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLk1vZGV9IE1vZGVcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLkNvbXBpbGVkTW9kZX0gQ29tcGlsZWRNb2RlXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5Db21waWxlZFNjb3BlfSBDb21waWxlZFNjb3BlXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5MYW5ndWFnZX0gTGFuZ3VhZ2VcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLkhMSlNBcGl9IEhMSlNBcGlcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLkhMSlNQbHVnaW59IEhMSlNQbHVnaW5cbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLlBsdWdpbkV2ZW50fSBQbHVnaW5FdmVudFxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuSExKU09wdGlvbnN9IEhMSlNPcHRpb25zXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5MYW5ndWFnZUZufSBMYW5ndWFnZUZuXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5IaWdobGlnaHRlZEhUTUxFbGVtZW50fSBIaWdobGlnaHRlZEhUTUxFbGVtZW50XG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5CZWZvcmVIaWdobGlnaHRDb250ZXh0fSBCZWZvcmVIaWdobGlnaHRDb250ZXh0XG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMvcHJpdmF0ZScpLk1hdGNoVHlwZX0gTWF0Y2hUeXBlXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMvcHJpdmF0ZScpLktleXdvcmREYXRhfSBLZXl3b3JkRGF0YVxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzL3ByaXZhdGUnKS5FbmhhbmNlZE1hdGNofSBFbmhhbmNlZE1hdGNoXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMvcHJpdmF0ZScpLkFubm90YXRlZEVycm9yfSBBbm5vdGF0ZWRFcnJvclxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQXV0b0hpZ2hsaWdodFJlc3VsdH0gQXV0b0hpZ2hsaWdodFJlc3VsdFxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuSGlnaGxpZ2h0T3B0aW9uc30gSGlnaGxpZ2h0T3B0aW9uc1xuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuSGlnaGxpZ2h0UmVzdWx0fSBIaWdobGlnaHRSZXN1bHRcbiovXG5cblxuY29uc3QgZXNjYXBlID0gZXNjYXBlSFRNTDtcbmNvbnN0IGluaGVyaXQgPSBpbmhlcml0JDE7XG5jb25zdCBOT19NQVRDSCA9IFN5bWJvbChcIm5vbWF0Y2hcIik7XG5jb25zdCBNQVhfS0VZV09SRF9ISVRTID0gNztcblxuLyoqXG4gKiBAcGFyYW0ge2FueX0gaGxqcyAtIG9iamVjdCB0aGF0IGlzIGV4dGVuZGVkIChsZWdhY3kpXG4gKiBAcmV0dXJucyB7SExKU0FwaX1cbiAqL1xuY29uc3QgSExKUyA9IGZ1bmN0aW9uKGhsanMpIHtcbiAgLy8gR2xvYmFsIGludGVybmFsIHZhcmlhYmxlcyB1c2VkIHdpdGhpbiB0aGUgaGlnaGxpZ2h0LmpzIGxpYnJhcnkuXG4gIC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgTGFuZ3VhZ2U+fSAqL1xuICBjb25zdCBsYW5ndWFnZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHN0cmluZz59ICovXG4gIGNvbnN0IGFsaWFzZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAvKiogQHR5cGUge0hMSlNQbHVnaW5bXX0gKi9cbiAgY29uc3QgcGx1Z2lucyA9IFtdO1xuXG4gIC8vIHNhZmUvcHJvZHVjdGlvbiBtb2RlIC0gc3dhbGxvd3MgbW9yZSBlcnJvcnMsIHRyaWVzIHRvIGtlZXAgcnVubmluZ1xuICAvLyBldmVuIGlmIGEgc2luZ2xlIHN5bnRheCBvciBwYXJzZSBoaXRzIGEgZmF0YWwgZXJyb3JcbiAgbGV0IFNBRkVfTU9ERSA9IHRydWU7XG4gIGNvbnN0IExBTkdVQUdFX05PVF9GT1VORCA9IFwiQ291bGQgbm90IGZpbmQgdGhlIGxhbmd1YWdlICd7fScsIGRpZCB5b3UgZm9yZ2V0IHRvIGxvYWQvaW5jbHVkZSBhIGxhbmd1YWdlIG1vZHVsZT9cIjtcbiAgLyoqIEB0eXBlIHtMYW5ndWFnZX0gKi9cbiAgY29uc3QgUExBSU5URVhUX0xBTkdVQUdFID0geyBkaXNhYmxlQXV0b2RldGVjdDogdHJ1ZSwgbmFtZTogJ1BsYWluIHRleHQnLCBjb250YWluczogW10gfTtcblxuICAvLyBHbG9iYWwgb3B0aW9ucyB1c2VkIHdoZW4gd2l0aGluIGV4dGVybmFsIEFQSXMuIFRoaXMgaXMgbW9kaWZpZWQgd2hlblxuICAvLyBjYWxsaW5nIHRoZSBgaGxqcy5jb25maWd1cmVgIGZ1bmN0aW9uLlxuICAvKiogQHR5cGUgSExKU09wdGlvbnMgKi9cbiAgbGV0IG9wdGlvbnMgPSB7XG4gICAgaWdub3JlVW5lc2NhcGVkSFRNTDogZmFsc2UsXG4gICAgdGhyb3dVbmVzY2FwZWRIVE1MOiBmYWxzZSxcbiAgICBub0hpZ2hsaWdodFJlOiAvXihuby0/aGlnaGxpZ2h0KSQvaSxcbiAgICBsYW5ndWFnZURldGVjdFJlOiAvXFxibGFuZyg/OnVhZ2UpPy0oW1xcdy1dKylcXGIvaSxcbiAgICBjbGFzc1ByZWZpeDogJ2hsanMtJyxcbiAgICBjc3NTZWxlY3RvcjogJ3ByZSBjb2RlJyxcbiAgICBsYW5ndWFnZXM6IG51bGwsXG4gICAgLy8gYmV0YSBjb25maWd1cmF0aW9uIG9wdGlvbnMsIHN1YmplY3QgdG8gY2hhbmdlLCB3ZWxjb21lIHRvIGRpc2N1c3NcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vaGlnaGxpZ2h0anMvaGlnaGxpZ2h0LmpzL2lzc3Vlcy8xMDg2XG4gICAgX19lbWl0dGVyOiBUb2tlblRyZWVFbWl0dGVyXG4gIH07XG5cbiAgLyogVXRpbGl0eSBmdW5jdGlvbnMgKi9cblxuICAvKipcbiAgICogVGVzdHMgYSBsYW5ndWFnZSBuYW1lIHRvIHNlZSBpZiBoaWdobGlnaHRpbmcgc2hvdWxkIGJlIHNraXBwZWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGxhbmd1YWdlTmFtZVxuICAgKi9cbiAgZnVuY3Rpb24gc2hvdWxkTm90SGlnaGxpZ2h0KGxhbmd1YWdlTmFtZSkge1xuICAgIHJldHVybiBvcHRpb25zLm5vSGlnaGxpZ2h0UmUudGVzdChsYW5ndWFnZU5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7SGlnaGxpZ2h0ZWRIVE1MRWxlbWVudH0gYmxvY2sgLSB0aGUgSFRNTCBlbGVtZW50IHRvIGRldGVybWluZSBsYW5ndWFnZSBmb3JcbiAgICovXG4gIGZ1bmN0aW9uIGJsb2NrTGFuZ3VhZ2UoYmxvY2spIHtcbiAgICBsZXQgY2xhc3NlcyA9IGJsb2NrLmNsYXNzTmFtZSArICcgJztcblxuICAgIGNsYXNzZXMgKz0gYmxvY2sucGFyZW50Tm9kZSA/IGJsb2NrLnBhcmVudE5vZGUuY2xhc3NOYW1lIDogJyc7XG5cbiAgICAvLyBsYW5ndWFnZS0qIHRha2VzIHByZWNlZGVuY2Ugb3ZlciBub24tcHJlZml4ZWQgY2xhc3MgbmFtZXMuXG4gICAgY29uc3QgbWF0Y2ggPSBvcHRpb25zLmxhbmd1YWdlRGV0ZWN0UmUuZXhlYyhjbGFzc2VzKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIGNvbnN0IGxhbmd1YWdlID0gZ2V0TGFuZ3VhZ2UobWF0Y2hbMV0pO1xuICAgICAgaWYgKCFsYW5ndWFnZSkge1xuICAgICAgICB3YXJuKExBTkdVQUdFX05PVF9GT1VORC5yZXBsYWNlKFwie31cIiwgbWF0Y2hbMV0pKTtcbiAgICAgICAgd2FybihcIkZhbGxpbmcgYmFjayB0byBuby1oaWdobGlnaHQgbW9kZSBmb3IgdGhpcyBibG9jay5cIiwgYmxvY2spO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxhbmd1YWdlID8gbWF0Y2hbMV0gOiAnbm8taGlnaGxpZ2h0JztcbiAgICB9XG5cbiAgICByZXR1cm4gY2xhc3Nlc1xuICAgICAgLnNwbGl0KC9cXHMrLylcbiAgICAgIC5maW5kKChfY2xhc3MpID0+IHNob3VsZE5vdEhpZ2hsaWdodChfY2xhc3MpIHx8IGdldExhbmd1YWdlKF9jbGFzcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvcmUgaGlnaGxpZ2h0aW5nIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBPTEQgQVBJXG4gICAqIGhpZ2hsaWdodChsYW5nLCBjb2RlLCBpZ25vcmVJbGxlZ2FscywgY29udGludWF0aW9uKVxuICAgKlxuICAgKiBORVcgQVBJXG4gICAqIGhpZ2hsaWdodChjb2RlLCB7bGFuZywgaWdub3JlSWxsZWdhbHN9KVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZU9yTGFuZ3VhZ2VOYW1lIC0gdGhlIGxhbmd1YWdlIHRvIHVzZSBmb3IgaGlnaGxpZ2h0aW5nXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgSGlnaGxpZ2h0T3B0aW9uc30gb3B0aW9uc09yQ29kZSAtIHRoZSBjb2RlIHRvIGhpZ2hsaWdodFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpZ25vcmVJbGxlZ2Fsc10gLSB3aGV0aGVyIHRvIGlnbm9yZSBpbGxlZ2FsIG1hdGNoZXMsIGRlZmF1bHQgaXMgdG8gYmFpbFxuICAgKlxuICAgKiBAcmV0dXJucyB7SGlnaGxpZ2h0UmVzdWx0fSBSZXN1bHQgLSBhbiBvYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSByZXN1bHRcbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IGxhbmd1YWdlIC0gdGhlIGxhbmd1YWdlIG5hbWVcbiAgICogQHByb3BlcnR5IHtudW1iZXJ9IHJlbGV2YW5jZSAtIHRoZSByZWxldmFuY2Ugc2NvcmVcbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IHZhbHVlIC0gdGhlIGhpZ2hsaWdodGVkIEhUTUwgY29kZVxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gY29kZSAtIHRoZSBvcmlnaW5hbCByYXcgY29kZVxuICAgKiBAcHJvcGVydHkge0NvbXBpbGVkTW9kZX0gdG9wIC0gdG9wIG9mIHRoZSBjdXJyZW50IG1vZGUgc3RhY2tcbiAgICogQHByb3BlcnR5IHtib29sZWFufSBpbGxlZ2FsIC0gaW5kaWNhdGVzIHdoZXRoZXIgYW55IGlsbGVnYWwgbWF0Y2hlcyB3ZXJlIGZvdW5kXG4gICovXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodChjb2RlT3JMYW5ndWFnZU5hbWUsIG9wdGlvbnNPckNvZGUsIGlnbm9yZUlsbGVnYWxzKSB7XG4gICAgbGV0IGNvZGUgPSBcIlwiO1xuICAgIGxldCBsYW5ndWFnZU5hbWUgPSBcIlwiO1xuICAgIGlmICh0eXBlb2Ygb3B0aW9uc09yQ29kZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgY29kZSA9IGNvZGVPckxhbmd1YWdlTmFtZTtcbiAgICAgIGlnbm9yZUlsbGVnYWxzID0gb3B0aW9uc09yQ29kZS5pZ25vcmVJbGxlZ2FscztcbiAgICAgIGxhbmd1YWdlTmFtZSA9IG9wdGlvbnNPckNvZGUubGFuZ3VhZ2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIG9sZCBBUElcbiAgICAgIGRlcHJlY2F0ZWQoXCIxMC43LjBcIiwgXCJoaWdobGlnaHQobGFuZywgY29kZSwgLi4uYXJncykgaGFzIGJlZW4gZGVwcmVjYXRlZC5cIik7XG4gICAgICBkZXByZWNhdGVkKFwiMTAuNy4wXCIsIFwiUGxlYXNlIHVzZSBoaWdobGlnaHQoY29kZSwgb3B0aW9ucykgaW5zdGVhZC5cXG5odHRwczovL2dpdGh1Yi5jb20vaGlnaGxpZ2h0anMvaGlnaGxpZ2h0LmpzL2lzc3Vlcy8yMjc3XCIpO1xuICAgICAgbGFuZ3VhZ2VOYW1lID0gY29kZU9yTGFuZ3VhZ2VOYW1lO1xuICAgICAgY29kZSA9IG9wdGlvbnNPckNvZGU7XG4gICAgfVxuXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2hpZ2hsaWdodGpzL2hpZ2hsaWdodC5qcy9pc3N1ZXMvMzE0OVxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZmluZWRcbiAgICBpZiAoaWdub3JlSWxsZWdhbHMgPT09IHVuZGVmaW5lZCkgeyBpZ25vcmVJbGxlZ2FscyA9IHRydWU7IH1cblxuICAgIC8qKiBAdHlwZSB7QmVmb3JlSGlnaGxpZ2h0Q29udGV4dH0gKi9cbiAgICBjb25zdCBjb250ZXh0ID0ge1xuICAgICAgY29kZSxcbiAgICAgIGxhbmd1YWdlOiBsYW5ndWFnZU5hbWVcbiAgICB9O1xuICAgIC8vIHRoZSBwbHVnaW4gY2FuIGNoYW5nZSB0aGUgZGVzaXJlZCBsYW5ndWFnZSBvciB0aGUgY29kZSB0byBiZSBoaWdobGlnaHRlZFxuICAgIC8vIGp1c3QgYmUgY2hhbmdpbmcgdGhlIG9iamVjdCBpdCB3YXMgcGFzc2VkXG4gICAgZmlyZShcImJlZm9yZTpoaWdobGlnaHRcIiwgY29udGV4dCk7XG5cbiAgICAvLyBhIGJlZm9yZSBwbHVnaW4gY2FuIHVzdXJwIHRoZSByZXN1bHQgY29tcGxldGVseSBieSBwcm92aWRpbmcgaXQncyBvd25cbiAgICAvLyBpbiB3aGljaCBjYXNlIHdlIGRvbid0IGV2ZW4gbmVlZCB0byBjYWxsIGhpZ2hsaWdodFxuICAgIGNvbnN0IHJlc3VsdCA9IGNvbnRleHQucmVzdWx0XG4gICAgICA/IGNvbnRleHQucmVzdWx0XG4gICAgICA6IF9oaWdobGlnaHQoY29udGV4dC5sYW5ndWFnZSwgY29udGV4dC5jb2RlLCBpZ25vcmVJbGxlZ2Fscyk7XG5cbiAgICByZXN1bHQuY29kZSA9IGNvbnRleHQuY29kZTtcbiAgICAvLyB0aGUgcGx1Z2luIGNhbiBjaGFuZ2UgYW55dGhpbmcgaW4gcmVzdWx0IHRvIHN1aXRlIGl0XG4gICAgZmlyZShcImFmdGVyOmhpZ2hsaWdodFwiLCByZXN1bHQpO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBwcml2YXRlIGhpZ2hsaWdodCB0aGF0J3MgdXNlZCBpbnRlcm5hbGx5IGFuZCBkb2VzIG5vdCBmaXJlIGNhbGxiYWNrc1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2VOYW1lIC0gdGhlIGxhbmd1YWdlIHRvIHVzZSBmb3IgaGlnaGxpZ2h0aW5nXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlVG9IaWdobGlnaHQgLSB0aGUgY29kZSB0byBoaWdobGlnaHRcbiAgICogQHBhcmFtIHtib29sZWFuP30gW2lnbm9yZUlsbGVnYWxzXSAtIHdoZXRoZXIgdG8gaWdub3JlIGlsbGVnYWwgbWF0Y2hlcywgZGVmYXVsdCBpcyB0byBiYWlsXG4gICAqIEBwYXJhbSB7Q29tcGlsZWRNb2RlP30gW2NvbnRpbnVhdGlvbl0gLSBjdXJyZW50IGNvbnRpbnVhdGlvbiBtb2RlLCBpZiBhbnlcbiAgICogQHJldHVybnMge0hpZ2hsaWdodFJlc3VsdH0gLSByZXN1bHQgb2YgdGhlIGhpZ2hsaWdodCBvcGVyYXRpb25cbiAgKi9cbiAgZnVuY3Rpb24gX2hpZ2hsaWdodChsYW5ndWFnZU5hbWUsIGNvZGVUb0hpZ2hsaWdodCwgaWdub3JlSWxsZWdhbHMsIGNvbnRpbnVhdGlvbikge1xuICAgIGNvbnN0IGtleXdvcmRIaXRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybiBrZXl3b3JkIGRhdGEgaWYgYSBtYXRjaCBpcyBhIGtleXdvcmRcbiAgICAgKiBAcGFyYW0ge0NvbXBpbGVkTW9kZX0gbW9kZSAtIGN1cnJlbnQgbW9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtYXRjaFRleHQgLSB0aGUgdGV4dHVhbCBtYXRjaFxuICAgICAqIEByZXR1cm5zIHtLZXl3b3JkRGF0YSB8IGZhbHNlfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGtleXdvcmREYXRhKG1vZGUsIG1hdGNoVGV4dCkge1xuICAgICAgcmV0dXJuIG1vZGUua2V5d29yZHNbbWF0Y2hUZXh0XTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzS2V5d29yZHMoKSB7XG4gICAgICBpZiAoIXRvcC5rZXl3b3Jkcykge1xuICAgICAgICBlbWl0dGVyLmFkZFRleHQobW9kZUJ1ZmZlcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgbGV0IGxhc3RJbmRleCA9IDA7XG4gICAgICB0b3Aua2V5d29yZFBhdHRlcm5SZS5sYXN0SW5kZXggPSAwO1xuICAgICAgbGV0IG1hdGNoID0gdG9wLmtleXdvcmRQYXR0ZXJuUmUuZXhlYyhtb2RlQnVmZmVyKTtcbiAgICAgIGxldCBidWYgPSBcIlwiO1xuXG4gICAgICB3aGlsZSAobWF0Y2gpIHtcbiAgICAgICAgYnVmICs9IG1vZGVCdWZmZXIuc3Vic3RyaW5nKGxhc3RJbmRleCwgbWF0Y2guaW5kZXgpO1xuICAgICAgICBjb25zdCB3b3JkID0gbGFuZ3VhZ2UuY2FzZV9pbnNlbnNpdGl2ZSA/IG1hdGNoWzBdLnRvTG93ZXJDYXNlKCkgOiBtYXRjaFswXTtcbiAgICAgICAgY29uc3QgZGF0YSA9IGtleXdvcmREYXRhKHRvcCwgd29yZCk7XG4gICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgY29uc3QgW2tpbmQsIGtleXdvcmRSZWxldmFuY2VdID0gZGF0YTtcbiAgICAgICAgICBlbWl0dGVyLmFkZFRleHQoYnVmKTtcbiAgICAgICAgICBidWYgPSBcIlwiO1xuXG4gICAgICAgICAga2V5d29yZEhpdHNbd29yZF0gPSAoa2V5d29yZEhpdHNbd29yZF0gfHwgMCkgKyAxO1xuICAgICAgICAgIGlmIChrZXl3b3JkSGl0c1t3b3JkXSA8PSBNQVhfS0VZV09SRF9ISVRTKSByZWxldmFuY2UgKz0ga2V5d29yZFJlbGV2YW5jZTtcbiAgICAgICAgICBpZiAoa2luZC5zdGFydHNXaXRoKFwiX1wiKSkge1xuICAgICAgICAgICAgLy8gXyBpbXBsaWVkIGZvciByZWxldmFuY2Ugb25seSwgZG8gbm90IGhpZ2hsaWdodFxuICAgICAgICAgICAgLy8gYnkgYXBwbHlpbmcgYSBjbGFzcyBuYW1lXG4gICAgICAgICAgICBidWYgKz0gbWF0Y2hbMF07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGNzc0NsYXNzID0gbGFuZ3VhZ2UuY2xhc3NOYW1lQWxpYXNlc1traW5kXSB8fCBraW5kO1xuICAgICAgICAgICAgZW1pdEtleXdvcmQobWF0Y2hbMF0sIGNzc0NsYXNzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnVmICs9IG1hdGNoWzBdO1xuICAgICAgICB9XG4gICAgICAgIGxhc3RJbmRleCA9IHRvcC5rZXl3b3JkUGF0dGVyblJlLmxhc3RJbmRleDtcbiAgICAgICAgbWF0Y2ggPSB0b3Aua2V5d29yZFBhdHRlcm5SZS5leGVjKG1vZGVCdWZmZXIpO1xuICAgICAgfVxuICAgICAgYnVmICs9IG1vZGVCdWZmZXIuc3Vic3RyaW5nKGxhc3RJbmRleCk7XG4gICAgICBlbWl0dGVyLmFkZFRleHQoYnVmKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzU3ViTGFuZ3VhZ2UoKSB7XG4gICAgICBpZiAobW9kZUJ1ZmZlciA9PT0gXCJcIikgcmV0dXJuO1xuICAgICAgLyoqIEB0eXBlIEhpZ2hsaWdodFJlc3VsdCAqL1xuICAgICAgbGV0IHJlc3VsdCA9IG51bGw7XG5cbiAgICAgIGlmICh0eXBlb2YgdG9wLnN1Ykxhbmd1YWdlID09PSAnc3RyaW5nJykge1xuICAgICAgICBpZiAoIWxhbmd1YWdlc1t0b3Auc3ViTGFuZ3VhZ2VdKSB7XG4gICAgICAgICAgZW1pdHRlci5hZGRUZXh0KG1vZGVCdWZmZXIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgPSBfaGlnaGxpZ2h0KHRvcC5zdWJMYW5ndWFnZSwgbW9kZUJ1ZmZlciwgdHJ1ZSwgY29udGludWF0aW9uc1t0b3Auc3ViTGFuZ3VhZ2VdKTtcbiAgICAgICAgY29udGludWF0aW9uc1t0b3Auc3ViTGFuZ3VhZ2VdID0gLyoqIEB0eXBlIHtDb21waWxlZE1vZGV9ICovIChyZXN1bHQuX3RvcCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQgPSBoaWdobGlnaHRBdXRvKG1vZGVCdWZmZXIsIHRvcC5zdWJMYW5ndWFnZS5sZW5ndGggPyB0b3Auc3ViTGFuZ3VhZ2UgOiBudWxsKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ291bnRpbmcgZW1iZWRkZWQgbGFuZ3VhZ2Ugc2NvcmUgdG93YXJkcyB0aGUgaG9zdCBsYW5ndWFnZSBtYXkgYmUgZGlzYWJsZWRcbiAgICAgIC8vIHdpdGggemVyb2luZyB0aGUgY29udGFpbmluZyBtb2RlIHJlbGV2YW5jZS4gVXNlIGNhc2UgaW4gcG9pbnQgaXMgTWFya2Rvd24gdGhhdFxuICAgICAgLy8gYWxsb3dzIFhNTCBldmVyeXdoZXJlIGFuZCBtYWtlcyBldmVyeSBYTUwgc25pcHBldCB0byBoYXZlIGEgbXVjaCBsYXJnZXIgTWFya2Rvd25cbiAgICAgIC8vIHNjb3JlLlxuICAgICAgaWYgKHRvcC5yZWxldmFuY2UgPiAwKSB7XG4gICAgICAgIHJlbGV2YW5jZSArPSByZXN1bHQucmVsZXZhbmNlO1xuICAgICAgfVxuICAgICAgZW1pdHRlci5fX2FkZFN1Ymxhbmd1YWdlKHJlc3VsdC5fZW1pdHRlciwgcmVzdWx0Lmxhbmd1YWdlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzQnVmZmVyKCkge1xuICAgICAgaWYgKHRvcC5zdWJMYW5ndWFnZSAhPSBudWxsKSB7XG4gICAgICAgIHByb2Nlc3NTdWJMYW5ndWFnZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJvY2Vzc0tleXdvcmRzKCk7XG4gICAgICB9XG4gICAgICBtb2RlQnVmZmVyID0gJyc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2NvcGVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBlbWl0S2V5d29yZChrZXl3b3JkLCBzY29wZSkge1xuICAgICAgaWYgKGtleXdvcmQgPT09IFwiXCIpIHJldHVybjtcblxuICAgICAgZW1pdHRlci5zdGFydFNjb3BlKHNjb3BlKTtcbiAgICAgIGVtaXR0ZXIuYWRkVGV4dChrZXl3b3JkKTtcbiAgICAgIGVtaXR0ZXIuZW5kU2NvcGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge0NvbXBpbGVkU2NvcGV9IHNjb3BlXG4gICAgICogQHBhcmFtIHtSZWdFeHBNYXRjaEFycmF5fSBtYXRjaFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGVtaXRNdWx0aUNsYXNzKHNjb3BlLCBtYXRjaCkge1xuICAgICAgbGV0IGkgPSAxO1xuICAgICAgY29uc3QgbWF4ID0gbWF0Y2gubGVuZ3RoIC0gMTtcbiAgICAgIHdoaWxlIChpIDw9IG1heCkge1xuICAgICAgICBpZiAoIXNjb3BlLl9lbWl0W2ldKSB7IGkrKzsgY29udGludWU7IH1cbiAgICAgICAgY29uc3Qga2xhc3MgPSBsYW5ndWFnZS5jbGFzc05hbWVBbGlhc2VzW3Njb3BlW2ldXSB8fCBzY29wZVtpXTtcbiAgICAgICAgY29uc3QgdGV4dCA9IG1hdGNoW2ldO1xuICAgICAgICBpZiAoa2xhc3MpIHtcbiAgICAgICAgICBlbWl0S2V5d29yZCh0ZXh0LCBrbGFzcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbW9kZUJ1ZmZlciA9IHRleHQ7XG4gICAgICAgICAgcHJvY2Vzc0tleXdvcmRzKCk7XG4gICAgICAgICAgbW9kZUJ1ZmZlciA9IFwiXCI7XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7Q29tcGlsZWRNb2RlfSBtb2RlIC0gbmV3IG1vZGUgdG8gc3RhcnRcbiAgICAgKiBAcGFyYW0ge1JlZ0V4cE1hdGNoQXJyYXl9IG1hdGNoXG4gICAgICovXG4gICAgZnVuY3Rpb24gc3RhcnROZXdNb2RlKG1vZGUsIG1hdGNoKSB7XG4gICAgICBpZiAobW9kZS5zY29wZSAmJiB0eXBlb2YgbW9kZS5zY29wZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBlbWl0dGVyLm9wZW5Ob2RlKGxhbmd1YWdlLmNsYXNzTmFtZUFsaWFzZXNbbW9kZS5zY29wZV0gfHwgbW9kZS5zY29wZSk7XG4gICAgICB9XG4gICAgICBpZiAobW9kZS5iZWdpblNjb3BlKSB7XG4gICAgICAgIC8vIGJlZ2luU2NvcGUganVzdCB3cmFwcyB0aGUgYmVnaW4gbWF0Y2ggaXRzZWxmIGluIGEgc2NvcGVcbiAgICAgICAgaWYgKG1vZGUuYmVnaW5TY29wZS5fd3JhcCkge1xuICAgICAgICAgIGVtaXRLZXl3b3JkKG1vZGVCdWZmZXIsIGxhbmd1YWdlLmNsYXNzTmFtZUFsaWFzZXNbbW9kZS5iZWdpblNjb3BlLl93cmFwXSB8fCBtb2RlLmJlZ2luU2NvcGUuX3dyYXApO1xuICAgICAgICAgIG1vZGVCdWZmZXIgPSBcIlwiO1xuICAgICAgICB9IGVsc2UgaWYgKG1vZGUuYmVnaW5TY29wZS5fbXVsdGkpIHtcbiAgICAgICAgICAvLyBhdCB0aGlzIHBvaW50IG1vZGVCdWZmZXIgc2hvdWxkIGp1c3QgYmUgdGhlIG1hdGNoXG4gICAgICAgICAgZW1pdE11bHRpQ2xhc3MobW9kZS5iZWdpblNjb3BlLCBtYXRjaCk7XG4gICAgICAgICAgbW9kZUJ1ZmZlciA9IFwiXCI7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdG9wID0gT2JqZWN0LmNyZWF0ZShtb2RlLCB7IHBhcmVudDogeyB2YWx1ZTogdG9wIH0gfSk7XG4gICAgICByZXR1cm4gdG9wO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7Q29tcGlsZWRNb2RlIH0gbW9kZSAtIHRoZSBtb2RlIHRvIHBvdGVudGlhbGx5IGVuZFxuICAgICAqIEBwYXJhbSB7UmVnRXhwTWF0Y2hBcnJheX0gbWF0Y2ggLSB0aGUgbGF0ZXN0IG1hdGNoXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1hdGNoUGx1c1JlbWFpbmRlciAtIG1hdGNoIHBsdXMgcmVtYWluZGVyIG9mIGNvbnRlbnRcbiAgICAgKiBAcmV0dXJucyB7Q29tcGlsZWRNb2RlIHwgdm9pZH0gLSB0aGUgbmV4dCBtb2RlLCBvciBpZiB2b2lkIGNvbnRpbnVlIG9uIGluIGN1cnJlbnQgbW9kZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGVuZE9mTW9kZShtb2RlLCBtYXRjaCwgbWF0Y2hQbHVzUmVtYWluZGVyKSB7XG4gICAgICBsZXQgbWF0Y2hlZCA9IHN0YXJ0c1dpdGgobW9kZS5lbmRSZSwgbWF0Y2hQbHVzUmVtYWluZGVyKTtcblxuICAgICAgaWYgKG1hdGNoZWQpIHtcbiAgICAgICAgaWYgKG1vZGVbXCJvbjplbmRcIl0pIHtcbiAgICAgICAgICBjb25zdCByZXNwID0gbmV3IFJlc3BvbnNlKG1vZGUpO1xuICAgICAgICAgIG1vZGVbXCJvbjplbmRcIl0obWF0Y2gsIHJlc3ApO1xuICAgICAgICAgIGlmIChyZXNwLmlzTWF0Y2hJZ25vcmVkKSBtYXRjaGVkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWF0Y2hlZCkge1xuICAgICAgICAgIHdoaWxlIChtb2RlLmVuZHNQYXJlbnQgJiYgbW9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgIG1vZGUgPSBtb2RlLnBhcmVudDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG1vZGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGV2ZW4gaWYgb246ZW5kIGZpcmVzIGFuIGBpZ25vcmVgIGl0J3Mgc3RpbGwgcG9zc2libGVcbiAgICAgIC8vIHRoYXQgd2UgbWlnaHQgdHJpZ2dlciB0aGUgZW5kIG5vZGUgYmVjYXVzZSBvZiBhIHBhcmVudCBtb2RlXG4gICAgICBpZiAobW9kZS5lbmRzV2l0aFBhcmVudCkge1xuICAgICAgICByZXR1cm4gZW5kT2ZNb2RlKG1vZGUucGFyZW50LCBtYXRjaCwgbWF0Y2hQbHVzUmVtYWluZGVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGUgbWF0Y2hpbmcgYnV0IHRoZW4gaWdub3JpbmcgYSBzZXF1ZW5jZSBvZiB0ZXh0XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbGV4ZW1lIC0gc3RyaW5nIGNvbnRhaW5pbmcgZnVsbCBtYXRjaCB0ZXh0XG4gICAgICovXG4gICAgZnVuY3Rpb24gZG9JZ25vcmUobGV4ZW1lKSB7XG4gICAgICBpZiAodG9wLm1hdGNoZXIucmVnZXhJbmRleCA9PT0gMCkge1xuICAgICAgICAvLyBubyBtb3JlIHJlZ2V4ZXMgdG8gcG90ZW50aWFsbHkgbWF0Y2ggaGVyZSwgc28gd2UgbW92ZSB0aGUgY3Vyc29yIGZvcndhcmQgb25lXG4gICAgICAgIC8vIHNwYWNlXG4gICAgICAgIG1vZGVCdWZmZXIgKz0gbGV4ZW1lWzBdO1xuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIG5vIG5lZWQgdG8gbW92ZSB0aGUgY3Vyc29yLCB3ZSBzdGlsbCBoYXZlIGFkZGl0aW9uYWwgcmVnZXhlcyB0byB0cnkgYW5kXG4gICAgICAgIC8vIG1hdGNoIGF0IHRoaXMgdmVyeSBzcG90XG4gICAgICAgIHJlc3VtZVNjYW5BdFNhbWVQb3NpdGlvbiA9IHRydWU7XG4gICAgICAgIHJldHVybiAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhhbmRsZSB0aGUgc3RhcnQgb2YgYSBuZXcgcG90ZW50aWFsIG1vZGUgbWF0Y2hcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RW5oYW5jZWRNYXRjaH0gbWF0Y2ggLSB0aGUgY3VycmVudCBtYXRjaFxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IGhvdyBmYXIgdG8gYWR2YW5jZSB0aGUgcGFyc2UgY3Vyc29yXG4gICAgICovXG4gICAgZnVuY3Rpb24gZG9CZWdpbk1hdGNoKG1hdGNoKSB7XG4gICAgICBjb25zdCBsZXhlbWUgPSBtYXRjaFswXTtcbiAgICAgIGNvbnN0IG5ld01vZGUgPSBtYXRjaC5ydWxlO1xuXG4gICAgICBjb25zdCByZXNwID0gbmV3IFJlc3BvbnNlKG5ld01vZGUpO1xuICAgICAgLy8gZmlyc3QgaW50ZXJuYWwgYmVmb3JlIGNhbGxiYWNrcywgdGhlbiB0aGUgcHVibGljIG9uZXNcbiAgICAgIGNvbnN0IGJlZm9yZUNhbGxiYWNrcyA9IFtuZXdNb2RlLl9fYmVmb3JlQmVnaW4sIG5ld01vZGVbXCJvbjpiZWdpblwiXV07XG4gICAgICBmb3IgKGNvbnN0IGNiIG9mIGJlZm9yZUNhbGxiYWNrcykge1xuICAgICAgICBpZiAoIWNiKSBjb250aW51ZTtcbiAgICAgICAgY2IobWF0Y2gsIHJlc3ApO1xuICAgICAgICBpZiAocmVzcC5pc01hdGNoSWdub3JlZCkgcmV0dXJuIGRvSWdub3JlKGxleGVtZSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChuZXdNb2RlLnNraXApIHtcbiAgICAgICAgbW9kZUJ1ZmZlciArPSBsZXhlbWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobmV3TW9kZS5leGNsdWRlQmVnaW4pIHtcbiAgICAgICAgICBtb2RlQnVmZmVyICs9IGxleGVtZTtcbiAgICAgICAgfVxuICAgICAgICBwcm9jZXNzQnVmZmVyKCk7XG4gICAgICAgIGlmICghbmV3TW9kZS5yZXR1cm5CZWdpbiAmJiAhbmV3TW9kZS5leGNsdWRlQmVnaW4pIHtcbiAgICAgICAgICBtb2RlQnVmZmVyID0gbGV4ZW1lO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzdGFydE5ld01vZGUobmV3TW9kZSwgbWF0Y2gpO1xuICAgICAgcmV0dXJuIG5ld01vZGUucmV0dXJuQmVnaW4gPyAwIDogbGV4ZW1lLmxlbmd0aDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGUgdGhlIHBvdGVudGlhbCBlbmQgb2YgbW9kZVxuICAgICAqXG4gICAgICogQHBhcmFtIHtSZWdFeHBNYXRjaEFycmF5fSBtYXRjaCAtIHRoZSBjdXJyZW50IG1hdGNoXG4gICAgICovXG4gICAgZnVuY3Rpb24gZG9FbmRNYXRjaChtYXRjaCkge1xuICAgICAgY29uc3QgbGV4ZW1lID0gbWF0Y2hbMF07XG4gICAgICBjb25zdCBtYXRjaFBsdXNSZW1haW5kZXIgPSBjb2RlVG9IaWdobGlnaHQuc3Vic3RyaW5nKG1hdGNoLmluZGV4KTtcblxuICAgICAgY29uc3QgZW5kTW9kZSA9IGVuZE9mTW9kZSh0b3AsIG1hdGNoLCBtYXRjaFBsdXNSZW1haW5kZXIpO1xuICAgICAgaWYgKCFlbmRNb2RlKSB7IHJldHVybiBOT19NQVRDSDsgfVxuXG4gICAgICBjb25zdCBvcmlnaW4gPSB0b3A7XG4gICAgICBpZiAodG9wLmVuZFNjb3BlICYmIHRvcC5lbmRTY29wZS5fd3JhcCkge1xuICAgICAgICBwcm9jZXNzQnVmZmVyKCk7XG4gICAgICAgIGVtaXRLZXl3b3JkKGxleGVtZSwgdG9wLmVuZFNjb3BlLl93cmFwKTtcbiAgICAgIH0gZWxzZSBpZiAodG9wLmVuZFNjb3BlICYmIHRvcC5lbmRTY29wZS5fbXVsdGkpIHtcbiAgICAgICAgcHJvY2Vzc0J1ZmZlcigpO1xuICAgICAgICBlbWl0TXVsdGlDbGFzcyh0b3AuZW5kU2NvcGUsIG1hdGNoKTtcbiAgICAgIH0gZWxzZSBpZiAob3JpZ2luLnNraXApIHtcbiAgICAgICAgbW9kZUJ1ZmZlciArPSBsZXhlbWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIShvcmlnaW4ucmV0dXJuRW5kIHx8IG9yaWdpbi5leGNsdWRlRW5kKSkge1xuICAgICAgICAgIG1vZGVCdWZmZXIgKz0gbGV4ZW1lO1xuICAgICAgICB9XG4gICAgICAgIHByb2Nlc3NCdWZmZXIoKTtcbiAgICAgICAgaWYgKG9yaWdpbi5leGNsdWRlRW5kKSB7XG4gICAgICAgICAgbW9kZUJ1ZmZlciA9IGxleGVtZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZG8ge1xuICAgICAgICBpZiAodG9wLnNjb3BlKSB7XG4gICAgICAgICAgZW1pdHRlci5jbG9zZU5vZGUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRvcC5za2lwICYmICF0b3Auc3ViTGFuZ3VhZ2UpIHtcbiAgICAgICAgICByZWxldmFuY2UgKz0gdG9wLnJlbGV2YW5jZTtcbiAgICAgICAgfVxuICAgICAgICB0b3AgPSB0b3AucGFyZW50O1xuICAgICAgfSB3aGlsZSAodG9wICE9PSBlbmRNb2RlLnBhcmVudCk7XG4gICAgICBpZiAoZW5kTW9kZS5zdGFydHMpIHtcbiAgICAgICAgc3RhcnROZXdNb2RlKGVuZE1vZGUuc3RhcnRzLCBtYXRjaCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gb3JpZ2luLnJldHVybkVuZCA/IDAgOiBsZXhlbWUubGVuZ3RoO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NDb250aW51YXRpb25zKCkge1xuICAgICAgY29uc3QgbGlzdCA9IFtdO1xuICAgICAgZm9yIChsZXQgY3VycmVudCA9IHRvcDsgY3VycmVudCAhPT0gbGFuZ3VhZ2U7IGN1cnJlbnQgPSBjdXJyZW50LnBhcmVudCkge1xuICAgICAgICBpZiAoY3VycmVudC5zY29wZSkge1xuICAgICAgICAgIGxpc3QudW5zaGlmdChjdXJyZW50LnNjb3BlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbGlzdC5mb3JFYWNoKGl0ZW0gPT4gZW1pdHRlci5vcGVuTm9kZShpdGVtKSk7XG4gICAgfVxuXG4gICAgLyoqIEB0eXBlIHt7dHlwZT86IE1hdGNoVHlwZSwgaW5kZXg/OiBudW1iZXIsIHJ1bGU/OiBNb2RlfX19ICovXG4gICAgbGV0IGxhc3RNYXRjaCA9IHt9O1xuXG4gICAgLyoqXG4gICAgICogIFByb2Nlc3MgYW4gaW5kaXZpZHVhbCBtYXRjaFxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHRCZWZvcmVNYXRjaCAtIHRleHQgcHJlY2VkaW5nIHRoZSBtYXRjaCAoc2luY2UgdGhlIGxhc3QgbWF0Y2gpXG4gICAgICogQHBhcmFtIHtFbmhhbmNlZE1hdGNofSBbbWF0Y2hdIC0gdGhlIG1hdGNoIGl0c2VsZlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHByb2Nlc3NMZXhlbWUodGV4dEJlZm9yZU1hdGNoLCBtYXRjaCkge1xuICAgICAgY29uc3QgbGV4ZW1lID0gbWF0Y2ggJiYgbWF0Y2hbMF07XG5cbiAgICAgIC8vIGFkZCBub24tbWF0Y2hlZCB0ZXh0IHRvIHRoZSBjdXJyZW50IG1vZGUgYnVmZmVyXG4gICAgICBtb2RlQnVmZmVyICs9IHRleHRCZWZvcmVNYXRjaDtcblxuICAgICAgaWYgKGxleGVtZSA9PSBudWxsKSB7XG4gICAgICAgIHByb2Nlc3NCdWZmZXIoKTtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9XG5cbiAgICAgIC8vIHdlJ3ZlIGZvdW5kIGEgMCB3aWR0aCBtYXRjaCBhbmQgd2UncmUgc3R1Y2ssIHNvIHdlIG5lZWQgdG8gYWR2YW5jZVxuICAgICAgLy8gdGhpcyBoYXBwZW5zIHdoZW4gd2UgaGF2ZSBiYWRseSBiZWhhdmVkIHJ1bGVzIHRoYXQgaGF2ZSBvcHRpb25hbCBtYXRjaGVycyB0byB0aGUgZGVncmVlIHRoYXRcbiAgICAgIC8vIHNvbWV0aW1lcyB0aGV5IGNhbiBlbmQgdXAgbWF0Y2hpbmcgbm90aGluZyBhdCBhbGxcbiAgICAgIC8vIFJlZjogaHR0cHM6Ly9naXRodWIuY29tL2hpZ2hsaWdodGpzL2hpZ2hsaWdodC5qcy9pc3N1ZXMvMjE0MFxuICAgICAgaWYgKGxhc3RNYXRjaC50eXBlID09PSBcImJlZ2luXCIgJiYgbWF0Y2gudHlwZSA9PT0gXCJlbmRcIiAmJiBsYXN0TWF0Y2guaW5kZXggPT09IG1hdGNoLmluZGV4ICYmIGxleGVtZSA9PT0gXCJcIikge1xuICAgICAgICAvLyBzcGl0IHRoZSBcInNraXBwZWRcIiBjaGFyYWN0ZXIgdGhhdCBvdXIgcmVnZXggY2hva2VkIG9uIGJhY2sgaW50byB0aGUgb3V0cHV0IHNlcXVlbmNlXG4gICAgICAgIG1vZGVCdWZmZXIgKz0gY29kZVRvSGlnaGxpZ2h0LnNsaWNlKG1hdGNoLmluZGV4LCBtYXRjaC5pbmRleCArIDEpO1xuICAgICAgICBpZiAoIVNBRkVfTU9ERSkge1xuICAgICAgICAgIC8qKiBAdHlwZSB7QW5ub3RhdGVkRXJyb3J9ICovXG4gICAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKGAwIHdpZHRoIG1hdGNoIHJlZ2V4ICgke2xhbmd1YWdlTmFtZX0pYCk7XG4gICAgICAgICAgZXJyLmxhbmd1YWdlTmFtZSA9IGxhbmd1YWdlTmFtZTtcbiAgICAgICAgICBlcnIuYmFkUnVsZSA9IGxhc3RNYXRjaC5ydWxlO1xuICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cbiAgICAgIGxhc3RNYXRjaCA9IG1hdGNoO1xuXG4gICAgICBpZiAobWF0Y2gudHlwZSA9PT0gXCJiZWdpblwiKSB7XG4gICAgICAgIHJldHVybiBkb0JlZ2luTWF0Y2gobWF0Y2gpO1xuICAgICAgfSBlbHNlIGlmIChtYXRjaC50eXBlID09PSBcImlsbGVnYWxcIiAmJiAhaWdub3JlSWxsZWdhbHMpIHtcbiAgICAgICAgLy8gaWxsZWdhbCBtYXRjaCwgd2UgZG8gbm90IGNvbnRpbnVlIHByb2Nlc3NpbmdcbiAgICAgICAgLyoqIEB0eXBlIHtBbm5vdGF0ZWRFcnJvcn0gKi9cbiAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdJbGxlZ2FsIGxleGVtZSBcIicgKyBsZXhlbWUgKyAnXCIgZm9yIG1vZGUgXCInICsgKHRvcC5zY29wZSB8fCAnPHVubmFtZWQ+JykgKyAnXCInKTtcbiAgICAgICAgZXJyLm1vZGUgPSB0b3A7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH0gZWxzZSBpZiAobWF0Y2gudHlwZSA9PT0gXCJlbmRcIikge1xuICAgICAgICBjb25zdCBwcm9jZXNzZWQgPSBkb0VuZE1hdGNoKG1hdGNoKTtcbiAgICAgICAgaWYgKHByb2Nlc3NlZCAhPT0gTk9fTUFUQ0gpIHtcbiAgICAgICAgICByZXR1cm4gcHJvY2Vzc2VkO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIGVkZ2UgY2FzZSBmb3Igd2hlbiBpbGxlZ2FsIG1hdGNoZXMgJCAoZW5kIG9mIGxpbmUpIHdoaWNoIGlzIHRlY2huaWNhbGx5XG4gICAgICAvLyBhIDAgd2lkdGggbWF0Y2ggYnV0IG5vdCBhIGJlZ2luL2VuZCBtYXRjaCBzbyBpdCdzIG5vdCBjYXVnaHQgYnkgdGhlXG4gICAgICAvLyBmaXJzdCBoYW5kbGVyICh3aGVuIGlnbm9yZUlsbGVnYWxzIGlzIHRydWUpXG4gICAgICBpZiAobWF0Y2gudHlwZSA9PT0gXCJpbGxlZ2FsXCIgJiYgbGV4ZW1lID09PSBcIlwiKSB7XG4gICAgICAgIC8vIGFkdmFuY2Ugc28gd2UgYXJlbid0IHN0dWNrIGluIGFuIGluZmluaXRlIGxvb3BcbiAgICAgICAgbW9kZUJ1ZmZlciArPSBcIlxcblwiO1xuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cblxuICAgICAgLy8gaW5maW5pdGUgbG9vcHMgYXJlIEJBRCwgdGhpcyBpcyBhIGxhc3QgZGl0Y2ggY2F0Y2ggYWxsLiBpZiB3ZSBoYXZlIGFcbiAgICAgIC8vIGRlY2VudCBudW1iZXIgb2YgaXRlcmF0aW9ucyB5ZXQgb3VyIGluZGV4IChjdXJzb3IgcG9zaXRpb24gaW4gb3VyXG4gICAgICAvLyBwYXJzaW5nKSBzdGlsbCAzeCBiZWhpbmQgb3VyIGluZGV4IHRoZW4gc29tZXRoaW5nIGlzIHZlcnkgd3JvbmdcbiAgICAgIC8vIHNvIHdlIGJhaWxcbiAgICAgIGlmIChpdGVyYXRpb25zID4gMTAwMDAwICYmIGl0ZXJhdGlvbnMgPiBtYXRjaC5pbmRleCAqIDMpIHtcbiAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdwb3RlbnRpYWwgaW5maW5pdGUgbG9vcCwgd2F5IG1vcmUgaXRlcmF0aW9ucyB0aGFuIG1hdGNoZXMnKTtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuXG4gICAgICAvKlxuICAgICAgV2h5IG1pZ2h0IGJlIGZpbmQgb3Vyc2VsdmVzIGhlcmU/ICBBbiBwb3RlbnRpYWwgZW5kIG1hdGNoIHRoYXQgd2FzXG4gICAgICB0cmlnZ2VyZWQgYnV0IGNvdWxkIG5vdCBiZSBjb21wbGV0ZWQuICBJRSwgYGRvRW5kTWF0Y2hgIHJldHVybmVkIE5PX01BVENILlxuICAgICAgKHRoaXMgY291bGQgYmUgYmVjYXVzZSBhIGNhbGxiYWNrIHJlcXVlc3RzIHRoZSBtYXRjaCBiZSBpZ25vcmVkLCBldGMpXG5cbiAgICAgIFRoaXMgY2F1c2VzIG5vIHJlYWwgaGFybSBvdGhlciB0aGFuIHN0b3BwaW5nIGEgZmV3IHRpbWVzIHRvbyBtYW55LlxuICAgICAgKi9cblxuICAgICAgbW9kZUJ1ZmZlciArPSBsZXhlbWU7XG4gICAgICByZXR1cm4gbGV4ZW1lLmxlbmd0aDtcbiAgICB9XG5cbiAgICBjb25zdCBsYW5ndWFnZSA9IGdldExhbmd1YWdlKGxhbmd1YWdlTmFtZSk7XG4gICAgaWYgKCFsYW5ndWFnZSkge1xuICAgICAgZXJyb3IoTEFOR1VBR0VfTk9UX0ZPVU5ELnJlcGxhY2UoXCJ7fVwiLCBsYW5ndWFnZU5hbWUpKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBsYW5ndWFnZTogXCInICsgbGFuZ3VhZ2VOYW1lICsgJ1wiJyk7XG4gICAgfVxuXG4gICAgY29uc3QgbWQgPSBjb21waWxlTGFuZ3VhZ2UobGFuZ3VhZ2UpO1xuICAgIGxldCByZXN1bHQgPSAnJztcbiAgICAvKiogQHR5cGUge0NvbXBpbGVkTW9kZX0gKi9cbiAgICBsZXQgdG9wID0gY29udGludWF0aW9uIHx8IG1kO1xuICAgIC8qKiBAdHlwZSBSZWNvcmQ8c3RyaW5nLENvbXBpbGVkTW9kZT4gKi9cbiAgICBjb25zdCBjb250aW51YXRpb25zID0ge307IC8vIGtlZXAgY29udGludWF0aW9ucyBmb3Igc3ViLWxhbmd1YWdlc1xuICAgIGNvbnN0IGVtaXR0ZXIgPSBuZXcgb3B0aW9ucy5fX2VtaXR0ZXIob3B0aW9ucyk7XG4gICAgcHJvY2Vzc0NvbnRpbnVhdGlvbnMoKTtcbiAgICBsZXQgbW9kZUJ1ZmZlciA9ICcnO1xuICAgIGxldCByZWxldmFuY2UgPSAwO1xuICAgIGxldCBpbmRleCA9IDA7XG4gICAgbGV0IGl0ZXJhdGlvbnMgPSAwO1xuICAgIGxldCByZXN1bWVTY2FuQXRTYW1lUG9zaXRpb24gPSBmYWxzZTtcblxuICAgIHRyeSB7XG4gICAgICBpZiAoIWxhbmd1YWdlLl9fZW1pdFRva2Vucykge1xuICAgICAgICB0b3AubWF0Y2hlci5jb25zaWRlckFsbCgpO1xuXG4gICAgICAgIGZvciAoOzspIHtcbiAgICAgICAgICBpdGVyYXRpb25zKys7XG4gICAgICAgICAgaWYgKHJlc3VtZVNjYW5BdFNhbWVQb3NpdGlvbikge1xuICAgICAgICAgICAgLy8gb25seSByZWdleGVzIG5vdCBtYXRjaGVkIHByZXZpb3VzbHkgd2lsbCBub3cgYmVcbiAgICAgICAgICAgIC8vIGNvbnNpZGVyZWQgZm9yIGEgcG90ZW50aWFsIG1hdGNoXG4gICAgICAgICAgICByZXN1bWVTY2FuQXRTYW1lUG9zaXRpb24gPSBmYWxzZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9wLm1hdGNoZXIuY29uc2lkZXJBbGwoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdG9wLm1hdGNoZXIubGFzdEluZGV4ID0gaW5kZXg7XG5cbiAgICAgICAgICBjb25zdCBtYXRjaCA9IHRvcC5tYXRjaGVyLmV4ZWMoY29kZVRvSGlnaGxpZ2h0KTtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIm1hdGNoXCIsIG1hdGNoWzBdLCBtYXRjaC5ydWxlICYmIG1hdGNoLnJ1bGUuYmVnaW4pXG5cbiAgICAgICAgICBpZiAoIW1hdGNoKSBicmVhaztcblxuICAgICAgICAgIGNvbnN0IGJlZm9yZU1hdGNoID0gY29kZVRvSGlnaGxpZ2h0LnN1YnN0cmluZyhpbmRleCwgbWF0Y2guaW5kZXgpO1xuICAgICAgICAgIGNvbnN0IHByb2Nlc3NlZENvdW50ID0gcHJvY2Vzc0xleGVtZShiZWZvcmVNYXRjaCwgbWF0Y2gpO1xuICAgICAgICAgIGluZGV4ID0gbWF0Y2guaW5kZXggKyBwcm9jZXNzZWRDb3VudDtcbiAgICAgICAgfVxuICAgICAgICBwcm9jZXNzTGV4ZW1lKGNvZGVUb0hpZ2hsaWdodC5zdWJzdHJpbmcoaW5kZXgpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxhbmd1YWdlLl9fZW1pdFRva2Vucyhjb2RlVG9IaWdobGlnaHQsIGVtaXR0ZXIpO1xuICAgICAgfVxuXG4gICAgICBlbWl0dGVyLmZpbmFsaXplKCk7XG4gICAgICByZXN1bHQgPSBlbWl0dGVyLnRvSFRNTCgpO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBsYW5ndWFnZTogbGFuZ3VhZ2VOYW1lLFxuICAgICAgICB2YWx1ZTogcmVzdWx0LFxuICAgICAgICByZWxldmFuY2UsXG4gICAgICAgIGlsbGVnYWw6IGZhbHNlLFxuICAgICAgICBfZW1pdHRlcjogZW1pdHRlcixcbiAgICAgICAgX3RvcDogdG9wXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgaWYgKGVyci5tZXNzYWdlICYmIGVyci5tZXNzYWdlLmluY2x1ZGVzKCdJbGxlZ2FsJykpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBsYW5ndWFnZTogbGFuZ3VhZ2VOYW1lLFxuICAgICAgICAgIHZhbHVlOiBlc2NhcGUoY29kZVRvSGlnaGxpZ2h0KSxcbiAgICAgICAgICBpbGxlZ2FsOiB0cnVlLFxuICAgICAgICAgIHJlbGV2YW5jZTogMCxcbiAgICAgICAgICBfaWxsZWdhbEJ5OiB7XG4gICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSxcbiAgICAgICAgICAgIGluZGV4LFxuICAgICAgICAgICAgY29udGV4dDogY29kZVRvSGlnaGxpZ2h0LnNsaWNlKGluZGV4IC0gMTAwLCBpbmRleCArIDEwMCksXG4gICAgICAgICAgICBtb2RlOiBlcnIubW9kZSxcbiAgICAgICAgICAgIHJlc3VsdFNvRmFyOiByZXN1bHRcbiAgICAgICAgICB9LFxuICAgICAgICAgIF9lbWl0dGVyOiBlbWl0dGVyXG4gICAgICAgIH07XG4gICAgICB9IGVsc2UgaWYgKFNBRkVfTU9ERSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGxhbmd1YWdlOiBsYW5ndWFnZU5hbWUsXG4gICAgICAgICAgdmFsdWU6IGVzY2FwZShjb2RlVG9IaWdobGlnaHQpLFxuICAgICAgICAgIGlsbGVnYWw6IGZhbHNlLFxuICAgICAgICAgIHJlbGV2YW5jZTogMCxcbiAgICAgICAgICBlcnJvclJhaXNlZDogZXJyLFxuICAgICAgICAgIF9lbWl0dGVyOiBlbWl0dGVyLFxuICAgICAgICAgIF90b3A6IHRvcFxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiByZXR1cm5zIGEgdmFsaWQgaGlnaGxpZ2h0IHJlc3VsdCwgd2l0aG91dCBhY3R1YWxseSBkb2luZyBhbnkgYWN0dWFsIHdvcmssXG4gICAqIGF1dG8gaGlnaGxpZ2h0IHN0YXJ0cyB3aXRoIHRoaXMgYW5kIGl0J3MgcG9zc2libGUgZm9yIHNtYWxsIHNuaXBwZXRzIHRoYXRcbiAgICogYXV0by1kZXRlY3Rpb24gbWF5IG5vdCBmaW5kIGEgYmV0dGVyIG1hdGNoXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlXG4gICAqIEByZXR1cm5zIHtIaWdobGlnaHRSZXN1bHR9XG4gICAqL1xuICBmdW5jdGlvbiBqdXN0VGV4dEhpZ2hsaWdodFJlc3VsdChjb2RlKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgdmFsdWU6IGVzY2FwZShjb2RlKSxcbiAgICAgIGlsbGVnYWw6IGZhbHNlLFxuICAgICAgcmVsZXZhbmNlOiAwLFxuICAgICAgX3RvcDogUExBSU5URVhUX0xBTkdVQUdFLFxuICAgICAgX2VtaXR0ZXI6IG5ldyBvcHRpb25zLl9fZW1pdHRlcihvcHRpb25zKVxuICAgIH07XG4gICAgcmVzdWx0Ll9lbWl0dGVyLmFkZFRleHQoY29kZSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICBIaWdobGlnaHRpbmcgd2l0aCBsYW5ndWFnZSBkZXRlY3Rpb24uIEFjY2VwdHMgYSBzdHJpbmcgd2l0aCB0aGUgY29kZSB0b1xuICBoaWdobGlnaHQuIFJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuXG4gIC0gbGFuZ3VhZ2UgKGRldGVjdGVkIGxhbmd1YWdlKVxuICAtIHJlbGV2YW5jZSAoaW50KVxuICAtIHZhbHVlIChhbiBIVE1MIHN0cmluZyB3aXRoIGhpZ2hsaWdodGluZyBtYXJrdXApXG4gIC0gc2Vjb25kQmVzdCAob2JqZWN0IHdpdGggdGhlIHNhbWUgc3RydWN0dXJlIGZvciBzZWNvbmQtYmVzdCBoZXVyaXN0aWNhbGx5XG4gICAgZGV0ZWN0ZWQgbGFuZ3VhZ2UsIG1heSBiZSBhYnNlbnQpXG5cbiAgICBAcGFyYW0ge3N0cmluZ30gY29kZVxuICAgIEBwYXJhbSB7QXJyYXk8c3RyaW5nPn0gW2xhbmd1YWdlU3Vic2V0XVxuICAgIEByZXR1cm5zIHtBdXRvSGlnaGxpZ2h0UmVzdWx0fVxuICAqL1xuICBmdW5jdGlvbiBoaWdobGlnaHRBdXRvKGNvZGUsIGxhbmd1YWdlU3Vic2V0KSB7XG4gICAgbGFuZ3VhZ2VTdWJzZXQgPSBsYW5ndWFnZVN1YnNldCB8fCBvcHRpb25zLmxhbmd1YWdlcyB8fCBPYmplY3Qua2V5cyhsYW5ndWFnZXMpO1xuICAgIGNvbnN0IHBsYWludGV4dCA9IGp1c3RUZXh0SGlnaGxpZ2h0UmVzdWx0KGNvZGUpO1xuXG4gICAgY29uc3QgcmVzdWx0cyA9IGxhbmd1YWdlU3Vic2V0LmZpbHRlcihnZXRMYW5ndWFnZSkuZmlsdGVyKGF1dG9EZXRlY3Rpb24pLm1hcChuYW1lID0+XG4gICAgICBfaGlnaGxpZ2h0KG5hbWUsIGNvZGUsIGZhbHNlKVxuICAgICk7XG4gICAgcmVzdWx0cy51bnNoaWZ0KHBsYWludGV4dCk7IC8vIHBsYWludGV4dCBpcyBhbHdheXMgYW4gb3B0aW9uXG5cbiAgICBjb25zdCBzb3J0ZWQgPSByZXN1bHRzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIC8vIHNvcnQgYmFzZSBvbiByZWxldmFuY2VcbiAgICAgIGlmIChhLnJlbGV2YW5jZSAhPT0gYi5yZWxldmFuY2UpIHJldHVybiBiLnJlbGV2YW5jZSAtIGEucmVsZXZhbmNlO1xuXG4gICAgICAvLyBhbHdheXMgYXdhcmQgdGhlIHRpZSB0byB0aGUgYmFzZSBsYW5ndWFnZVxuICAgICAgLy8gaWUgaWYgQysrIGFuZCBBcmR1aW5vIGFyZSB0aWVkLCBpdCdzIG1vcmUgbGlrZWx5IHRvIGJlIEMrK1xuICAgICAgaWYgKGEubGFuZ3VhZ2UgJiYgYi5sYW5ndWFnZSkge1xuICAgICAgICBpZiAoZ2V0TGFuZ3VhZ2UoYS5sYW5ndWFnZSkuc3VwZXJzZXRPZiA9PT0gYi5sYW5ndWFnZSkge1xuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9IGVsc2UgaWYgKGdldExhbmd1YWdlKGIubGFuZ3VhZ2UpLnN1cGVyc2V0T2YgPT09IGEubGFuZ3VhZ2UpIHtcbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gb3RoZXJ3aXNlIHNheSB0aGV5IGFyZSBlcXVhbCwgd2hpY2ggaGFzIHRoZSBlZmZlY3Qgb2Ygc29ydGluZyBvblxuICAgICAgLy8gcmVsZXZhbmNlIHdoaWxlIHByZXNlcnZpbmcgdGhlIG9yaWdpbmFsIG9yZGVyaW5nIC0gd2hpY2ggaXMgaG93IHRpZXNcbiAgICAgIC8vIGhhdmUgaGlzdG9yaWNhbGx5IGJlZW4gc2V0dGxlZCwgaWUgdGhlIGxhbmd1YWdlIHRoYXQgY29tZXMgZmlyc3QgYWx3YXlzXG4gICAgICAvLyB3aW5zIGluIHRoZSBjYXNlIG9mIGEgdGllXG4gICAgICByZXR1cm4gMDtcbiAgICB9KTtcblxuICAgIGNvbnN0IFtiZXN0LCBzZWNvbmRCZXN0XSA9IHNvcnRlZDtcblxuICAgIC8qKiBAdHlwZSB7QXV0b0hpZ2hsaWdodFJlc3VsdH0gKi9cbiAgICBjb25zdCByZXN1bHQgPSBiZXN0O1xuICAgIHJlc3VsdC5zZWNvbmRCZXN0ID0gc2Vjb25kQmVzdDtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogQnVpbGRzIG5ldyBjbGFzcyBuYW1lIGZvciBibG9jayBnaXZlbiB0aGUgbGFuZ3VhZ2UgbmFtZVxuICAgKlxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY3VycmVudExhbmddXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcmVzdWx0TGFuZ11cbiAgICovXG4gIGZ1bmN0aW9uIHVwZGF0ZUNsYXNzTmFtZShlbGVtZW50LCBjdXJyZW50TGFuZywgcmVzdWx0TGFuZykge1xuICAgIGNvbnN0IGxhbmd1YWdlID0gKGN1cnJlbnRMYW5nICYmIGFsaWFzZXNbY3VycmVudExhbmddKSB8fCByZXN1bHRMYW5nO1xuXG4gICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiaGxqc1wiKTtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoYGxhbmd1YWdlLSR7bGFuZ3VhZ2V9YCk7XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyBoaWdobGlnaHRpbmcgdG8gYSBET00gbm9kZSBjb250YWluaW5nIGNvZGUuXG4gICAqXG4gICAqIEBwYXJhbSB7SGlnaGxpZ2h0ZWRIVE1MRWxlbWVudH0gZWxlbWVudCAtIHRoZSBIVE1MIGVsZW1lbnQgdG8gaGlnaGxpZ2h0XG4gICovXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodEVsZW1lbnQoZWxlbWVudCkge1xuICAgIC8qKiBAdHlwZSBIVE1MRWxlbWVudCAqL1xuICAgIGxldCBub2RlID0gbnVsbDtcbiAgICBjb25zdCBsYW5ndWFnZSA9IGJsb2NrTGFuZ3VhZ2UoZWxlbWVudCk7XG5cbiAgICBpZiAoc2hvdWxkTm90SGlnaGxpZ2h0KGxhbmd1YWdlKSkgcmV0dXJuO1xuXG4gICAgZmlyZShcImJlZm9yZTpoaWdobGlnaHRFbGVtZW50XCIsXG4gICAgICB7IGVsOiBlbGVtZW50LCBsYW5ndWFnZSB9KTtcblxuICAgIGlmIChlbGVtZW50LmRhdGFzZXQuaGlnaGxpZ2h0ZWQpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiRWxlbWVudCBwcmV2aW91c2x5IGhpZ2hsaWdodGVkLiBUbyBoaWdobGlnaHQgYWdhaW4sIGZpcnN0IHVuc2V0IGBkYXRhc2V0LmhpZ2hsaWdodGVkYC5cIiwgZWxlbWVudCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gd2Ugc2hvdWxkIGJlIGFsbCB0ZXh0LCBubyBjaGlsZCBub2RlcyAodW5lc2NhcGVkIEhUTUwpIC0gdGhpcyBpcyBwb3NzaWJseVxuICAgIC8vIGFuIEhUTUwgaW5qZWN0aW9uIGF0dGFjayAtIGl0J3MgbGlrZWx5IHRvbyBsYXRlIGlmIHRoaXMgaXMgYWxyZWFkeSBpblxuICAgIC8vIHByb2R1Y3Rpb24gKHRoZSBjb2RlIGhhcyBsaWtlbHkgYWxyZWFkeSBkb25lIGl0cyBkYW1hZ2UgYnkgdGhlIHRpbWVcbiAgICAvLyB3ZSdyZSBzZWVpbmcgaXQpLi4uIGJ1dCB3ZSB5ZWxsIGxvdWRseSBhYm91dCB0aGlzIHNvIHRoYXQgaG9wZWZ1bGx5IGl0J3NcbiAgICAvLyBtb3JlIGxpa2VseSB0byBiZSBjYXVnaHQgaW4gZGV2ZWxvcG1lbnQgYmVmb3JlIG1ha2luZyBpdCB0byBwcm9kdWN0aW9uXG4gICAgaWYgKGVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKCFvcHRpb25zLmlnbm9yZVVuZXNjYXBlZEhUTUwpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiT25lIG9mIHlvdXIgY29kZSBibG9ja3MgaW5jbHVkZXMgdW5lc2NhcGVkIEhUTUwuIFRoaXMgaXMgYSBwb3RlbnRpYWxseSBzZXJpb3VzIHNlY3VyaXR5IHJpc2suXCIpO1xuICAgICAgICBjb25zb2xlLndhcm4oXCJodHRwczovL2dpdGh1Yi5jb20vaGlnaGxpZ2h0anMvaGlnaGxpZ2h0LmpzL3dpa2kvc2VjdXJpdHlcIik7XG4gICAgICAgIGNvbnNvbGUud2FybihcIlRoZSBlbGVtZW50IHdpdGggdW5lc2NhcGVkIEhUTUw6XCIpO1xuICAgICAgICBjb25zb2xlLndhcm4oZWxlbWVudCk7XG4gICAgICB9XG4gICAgICBpZiAob3B0aW9ucy50aHJvd1VuZXNjYXBlZEhUTUwpIHtcbiAgICAgICAgY29uc3QgZXJyID0gbmV3IEhUTUxJbmplY3Rpb25FcnJvcihcbiAgICAgICAgICBcIk9uZSBvZiB5b3VyIGNvZGUgYmxvY2tzIGluY2x1ZGVzIHVuZXNjYXBlZCBIVE1MLlwiLFxuICAgICAgICAgIGVsZW1lbnQuaW5uZXJIVE1MXG4gICAgICAgICk7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBub2RlID0gZWxlbWVudDtcbiAgICBjb25zdCB0ZXh0ID0gbm9kZS50ZXh0Q29udGVudDtcbiAgICBjb25zdCByZXN1bHQgPSBsYW5ndWFnZSA/IGhpZ2hsaWdodCh0ZXh0LCB7IGxhbmd1YWdlLCBpZ25vcmVJbGxlZ2FsczogdHJ1ZSB9KSA6IGhpZ2hsaWdodEF1dG8odGV4dCk7XG5cbiAgICBlbGVtZW50LmlubmVySFRNTCA9IHJlc3VsdC52YWx1ZTtcbiAgICBlbGVtZW50LmRhdGFzZXQuaGlnaGxpZ2h0ZWQgPSBcInllc1wiO1xuICAgIHVwZGF0ZUNsYXNzTmFtZShlbGVtZW50LCBsYW5ndWFnZSwgcmVzdWx0Lmxhbmd1YWdlKTtcbiAgICBlbGVtZW50LnJlc3VsdCA9IHtcbiAgICAgIGxhbmd1YWdlOiByZXN1bHQubGFuZ3VhZ2UsXG4gICAgICAvLyBUT0RPOiByZW1vdmUgd2l0aCB2ZXJzaW9uIDExLjBcbiAgICAgIHJlOiByZXN1bHQucmVsZXZhbmNlLFxuICAgICAgcmVsZXZhbmNlOiByZXN1bHQucmVsZXZhbmNlXG4gICAgfTtcbiAgICBpZiAocmVzdWx0LnNlY29uZEJlc3QpIHtcbiAgICAgIGVsZW1lbnQuc2Vjb25kQmVzdCA9IHtcbiAgICAgICAgbGFuZ3VhZ2U6IHJlc3VsdC5zZWNvbmRCZXN0Lmxhbmd1YWdlLFxuICAgICAgICByZWxldmFuY2U6IHJlc3VsdC5zZWNvbmRCZXN0LnJlbGV2YW5jZVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBmaXJlKFwiYWZ0ZXI6aGlnaGxpZ2h0RWxlbWVudFwiLCB7IGVsOiBlbGVtZW50LCByZXN1bHQsIHRleHQgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyBoaWdobGlnaHQuanMgZ2xvYmFsIG9wdGlvbnMgd2l0aCB0aGUgcGFzc2VkIG9wdGlvbnNcbiAgICpcbiAgICogQHBhcmFtIHtQYXJ0aWFsPEhMSlNPcHRpb25zPn0gdXNlck9wdGlvbnNcbiAgICovXG4gIGZ1bmN0aW9uIGNvbmZpZ3VyZSh1c2VyT3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBpbmhlcml0KG9wdGlvbnMsIHVzZXJPcHRpb25zKTtcbiAgfVxuXG4gIC8vIFRPRE86IHJlbW92ZSB2MTIsIGRlcHJlY2F0ZWRcbiAgY29uc3QgaW5pdEhpZ2hsaWdodGluZyA9ICgpID0+IHtcbiAgICBoaWdobGlnaHRBbGwoKTtcbiAgICBkZXByZWNhdGVkKFwiMTAuNi4wXCIsIFwiaW5pdEhpZ2hsaWdodGluZygpIGRlcHJlY2F0ZWQuICBVc2UgaGlnaGxpZ2h0QWxsKCkgbm93LlwiKTtcbiAgfTtcblxuICAvLyBUT0RPOiByZW1vdmUgdjEyLCBkZXByZWNhdGVkXG4gIGZ1bmN0aW9uIGluaXRIaWdobGlnaHRpbmdPbkxvYWQoKSB7XG4gICAgaGlnaGxpZ2h0QWxsKCk7XG4gICAgZGVwcmVjYXRlZChcIjEwLjYuMFwiLCBcImluaXRIaWdobGlnaHRpbmdPbkxvYWQoKSBkZXByZWNhdGVkLiAgVXNlIGhpZ2hsaWdodEFsbCgpIG5vdy5cIik7XG4gIH1cblxuICBsZXQgd2FudHNIaWdobGlnaHQgPSBmYWxzZTtcblxuICAvKipcbiAgICogYXV0by1oaWdobGlnaHRzIGFsbCBwcmU+Y29kZSBlbGVtZW50cyBvbiB0aGUgcGFnZVxuICAgKi9cbiAgZnVuY3Rpb24gaGlnaGxpZ2h0QWxsKCkge1xuICAgIGZ1bmN0aW9uIGJvb3QoKSB7XG4gICAgICAvLyBpZiBhIGhpZ2hsaWdodCB3YXMgcmVxdWVzdGVkIGJlZm9yZSBET00gd2FzIGxvYWRlZCwgZG8gbm93XG4gICAgICBoaWdobGlnaHRBbGwoKTtcbiAgICB9XG5cbiAgICAvLyBpZiB3ZSBhcmUgY2FsbGVkIHRvbyBlYXJseSBpbiB0aGUgbG9hZGluZyBwcm9jZXNzXG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwibG9hZGluZ1wiKSB7XG4gICAgICAvLyBtYWtlIHN1cmUgdGhlIGV2ZW50IGxpc3RlbmVyIGlzIG9ubHkgYWRkZWQgb25jZVxuICAgICAgaWYgKCF3YW50c0hpZ2hsaWdodCkge1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGJvb3QsIGZhbHNlKTtcbiAgICAgIH1cbiAgICAgIHdhbnRzSGlnaGxpZ2h0ID0gdHJ1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBibG9ja3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKG9wdGlvbnMuY3NzU2VsZWN0b3IpO1xuICAgIGJsb2Nrcy5mb3JFYWNoKGhpZ2hsaWdodEVsZW1lbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgbGFuZ3VhZ2UgZ3JhbW1hciBtb2R1bGVcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGxhbmd1YWdlTmFtZVxuICAgKiBAcGFyYW0ge0xhbmd1YWdlRm59IGxhbmd1YWdlRGVmaW5pdGlvblxuICAgKi9cbiAgZnVuY3Rpb24gcmVnaXN0ZXJMYW5ndWFnZShsYW5ndWFnZU5hbWUsIGxhbmd1YWdlRGVmaW5pdGlvbikge1xuICAgIGxldCBsYW5nID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgbGFuZyA9IGxhbmd1YWdlRGVmaW5pdGlvbihobGpzKTtcbiAgICB9IGNhdGNoIChlcnJvciQxKSB7XG4gICAgICBlcnJvcihcIkxhbmd1YWdlIGRlZmluaXRpb24gZm9yICd7fScgY291bGQgbm90IGJlIHJlZ2lzdGVyZWQuXCIucmVwbGFjZShcInt9XCIsIGxhbmd1YWdlTmFtZSkpO1xuICAgICAgLy8gaGFyZCBvciBzb2Z0IGVycm9yXG4gICAgICBpZiAoIVNBRkVfTU9ERSkgeyB0aHJvdyBlcnJvciQxOyB9IGVsc2UgeyBlcnJvcihlcnJvciQxKTsgfVxuICAgICAgLy8gbGFuZ3VhZ2VzIHRoYXQgaGF2ZSBzZXJpb3VzIGVycm9ycyBhcmUgcmVwbGFjZWQgd2l0aCBlc3NlbnRpYWxseSBhXG4gICAgICAvLyBcInBsYWludGV4dFwiIHN0YW5kLWluIHNvIHRoYXQgdGhlIGNvZGUgYmxvY2tzIHdpbGwgc3RpbGwgZ2V0IG5vcm1hbFxuICAgICAgLy8gY3NzIGNsYXNzZXMgYXBwbGllZCB0byB0aGVtIC0gYW5kIG9uZSBiYWQgbGFuZ3VhZ2Ugd29uJ3QgYnJlYWsgdGhlXG4gICAgICAvLyBlbnRpcmUgaGlnaGxpZ2h0ZXJcbiAgICAgIGxhbmcgPSBQTEFJTlRFWFRfTEFOR1VBR0U7XG4gICAgfVxuICAgIC8vIGdpdmUgaXQgYSB0ZW1wb3JhcnkgbmFtZSBpZiBpdCBkb2Vzbid0IGhhdmUgb25lIGluIHRoZSBtZXRhLWRhdGFcbiAgICBpZiAoIWxhbmcubmFtZSkgbGFuZy5uYW1lID0gbGFuZ3VhZ2VOYW1lO1xuICAgIGxhbmd1YWdlc1tsYW5ndWFnZU5hbWVdID0gbGFuZztcbiAgICBsYW5nLnJhd0RlZmluaXRpb24gPSBsYW5ndWFnZURlZmluaXRpb24uYmluZChudWxsLCBobGpzKTtcblxuICAgIGlmIChsYW5nLmFsaWFzZXMpIHtcbiAgICAgIHJlZ2lzdGVyQWxpYXNlcyhsYW5nLmFsaWFzZXMsIHsgbGFuZ3VhZ2VOYW1lIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYSBsYW5ndWFnZSBncmFtbWFyIG1vZHVsZVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2VOYW1lXG4gICAqL1xuICBmdW5jdGlvbiB1bnJlZ2lzdGVyTGFuZ3VhZ2UobGFuZ3VhZ2VOYW1lKSB7XG4gICAgZGVsZXRlIGxhbmd1YWdlc1tsYW5ndWFnZU5hbWVdO1xuICAgIGZvciAoY29uc3QgYWxpYXMgb2YgT2JqZWN0LmtleXMoYWxpYXNlcykpIHtcbiAgICAgIGlmIChhbGlhc2VzW2FsaWFzXSA9PT0gbGFuZ3VhZ2VOYW1lKSB7XG4gICAgICAgIGRlbGV0ZSBhbGlhc2VzW2FsaWFzXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMge3N0cmluZ1tdfSBMaXN0IG9mIGxhbmd1YWdlIGludGVybmFsIG5hbWVzXG4gICAqL1xuICBmdW5jdGlvbiBsaXN0TGFuZ3VhZ2VzKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhsYW5ndWFnZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gbmFtZSBvZiB0aGUgbGFuZ3VhZ2UgdG8gcmV0cmlldmVcbiAgICogQHJldHVybnMge0xhbmd1YWdlIHwgdW5kZWZpbmVkfVxuICAgKi9cbiAgZnVuY3Rpb24gZ2V0TGFuZ3VhZ2UobmFtZSkge1xuICAgIG5hbWUgPSAobmFtZSB8fCAnJykudG9Mb3dlckNhc2UoKTtcbiAgICByZXR1cm4gbGFuZ3VhZ2VzW25hbWVdIHx8IGxhbmd1YWdlc1thbGlhc2VzW25hbWVdXTtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xzdHJpbmdbXX0gYWxpYXNMaXN0IC0gc2luZ2xlIGFsaWFzIG9yIGxpc3Qgb2YgYWxpYXNlc1xuICAgKiBAcGFyYW0ge3tsYW5ndWFnZU5hbWU6IHN0cmluZ319IG9wdHNcbiAgICovXG4gIGZ1bmN0aW9uIHJlZ2lzdGVyQWxpYXNlcyhhbGlhc0xpc3QsIHsgbGFuZ3VhZ2VOYW1lIH0pIHtcbiAgICBpZiAodHlwZW9mIGFsaWFzTGlzdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGFsaWFzTGlzdCA9IFthbGlhc0xpc3RdO1xuICAgIH1cbiAgICBhbGlhc0xpc3QuZm9yRWFjaChhbGlhcyA9PiB7IGFsaWFzZXNbYWxpYXMudG9Mb3dlckNhc2UoKV0gPSBsYW5ndWFnZU5hbWU7IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgYSBnaXZlbiBsYW5ndWFnZSBoYXMgYXV0by1kZXRlY3Rpb24gZW5hYmxlZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIG5hbWUgb2YgdGhlIGxhbmd1YWdlXG4gICAqL1xuICBmdW5jdGlvbiBhdXRvRGV0ZWN0aW9uKG5hbWUpIHtcbiAgICBjb25zdCBsYW5nID0gZ2V0TGFuZ3VhZ2UobmFtZSk7XG4gICAgcmV0dXJuIGxhbmcgJiYgIWxhbmcuZGlzYWJsZUF1dG9kZXRlY3Q7XG4gIH1cblxuICAvKipcbiAgICogVXBncmFkZXMgdGhlIG9sZCBoaWdobGlnaHRCbG9jayBwbHVnaW5zIHRvIHRoZSBuZXdcbiAgICogaGlnaGxpZ2h0RWxlbWVudCBBUElcbiAgICogQHBhcmFtIHtITEpTUGx1Z2lufSBwbHVnaW5cbiAgICovXG4gIGZ1bmN0aW9uIHVwZ3JhZGVQbHVnaW5BUEkocGx1Z2luKSB7XG4gICAgLy8gVE9ETzogcmVtb3ZlIHdpdGggdjEyXG4gICAgaWYgKHBsdWdpbltcImJlZm9yZTpoaWdobGlnaHRCbG9ja1wiXSAmJiAhcGx1Z2luW1wiYmVmb3JlOmhpZ2hsaWdodEVsZW1lbnRcIl0pIHtcbiAgICAgIHBsdWdpbltcImJlZm9yZTpoaWdobGlnaHRFbGVtZW50XCJdID0gKGRhdGEpID0+IHtcbiAgICAgICAgcGx1Z2luW1wiYmVmb3JlOmhpZ2hsaWdodEJsb2NrXCJdKFxuICAgICAgICAgIE9iamVjdC5hc3NpZ24oeyBibG9jazogZGF0YS5lbCB9LCBkYXRhKVxuICAgICAgICApO1xuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKHBsdWdpbltcImFmdGVyOmhpZ2hsaWdodEJsb2NrXCJdICYmICFwbHVnaW5bXCJhZnRlcjpoaWdobGlnaHRFbGVtZW50XCJdKSB7XG4gICAgICBwbHVnaW5bXCJhZnRlcjpoaWdobGlnaHRFbGVtZW50XCJdID0gKGRhdGEpID0+IHtcbiAgICAgICAgcGx1Z2luW1wiYWZ0ZXI6aGlnaGxpZ2h0QmxvY2tcIl0oXG4gICAgICAgICAgT2JqZWN0LmFzc2lnbih7IGJsb2NrOiBkYXRhLmVsIH0sIGRhdGEpXG4gICAgICAgICk7XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0hMSlNQbHVnaW59IHBsdWdpblxuICAgKi9cbiAgZnVuY3Rpb24gYWRkUGx1Z2luKHBsdWdpbikge1xuICAgIHVwZ3JhZGVQbHVnaW5BUEkocGx1Z2luKTtcbiAgICBwbHVnaW5zLnB1c2gocGx1Z2luKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0hMSlNQbHVnaW59IHBsdWdpblxuICAgKi9cbiAgZnVuY3Rpb24gcmVtb3ZlUGx1Z2luKHBsdWdpbikge1xuICAgIGNvbnN0IGluZGV4ID0gcGx1Z2lucy5pbmRleE9mKHBsdWdpbik7XG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgcGx1Z2lucy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0ge1BsdWdpbkV2ZW50fSBldmVudFxuICAgKiBAcGFyYW0ge2FueX0gYXJnc1xuICAgKi9cbiAgZnVuY3Rpb24gZmlyZShldmVudCwgYXJncykge1xuICAgIGNvbnN0IGNiID0gZXZlbnQ7XG4gICAgcGx1Z2lucy5mb3JFYWNoKGZ1bmN0aW9uKHBsdWdpbikge1xuICAgICAgaWYgKHBsdWdpbltjYl0pIHtcbiAgICAgICAgcGx1Z2luW2NiXShhcmdzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBERVBSRUNBVEVEXG4gICAqIEBwYXJhbSB7SGlnaGxpZ2h0ZWRIVE1MRWxlbWVudH0gZWxcbiAgICovXG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZUhpZ2hsaWdodEJsb2NrKGVsKSB7XG4gICAgZGVwcmVjYXRlZChcIjEwLjcuMFwiLCBcImhpZ2hsaWdodEJsb2NrIHdpbGwgYmUgcmVtb3ZlZCBlbnRpcmVseSBpbiB2MTIuMFwiKTtcbiAgICBkZXByZWNhdGVkKFwiMTAuNy4wXCIsIFwiUGxlYXNlIHVzZSBoaWdobGlnaHRFbGVtZW50IG5vdy5cIik7XG5cbiAgICByZXR1cm4gaGlnaGxpZ2h0RWxlbWVudChlbCk7XG4gIH1cblxuICAvKiBJbnRlcmZhY2UgZGVmaW5pdGlvbiAqL1xuICBPYmplY3QuYXNzaWduKGhsanMsIHtcbiAgICBoaWdobGlnaHQsXG4gICAgaGlnaGxpZ2h0QXV0byxcbiAgICBoaWdobGlnaHRBbGwsXG4gICAgaGlnaGxpZ2h0RWxlbWVudCxcbiAgICAvLyBUT0RPOiBSZW1vdmUgd2l0aCB2MTIgQVBJXG4gICAgaGlnaGxpZ2h0QmxvY2s6IGRlcHJlY2F0ZUhpZ2hsaWdodEJsb2NrLFxuICAgIGNvbmZpZ3VyZSxcbiAgICBpbml0SGlnaGxpZ2h0aW5nLFxuICAgIGluaXRIaWdobGlnaHRpbmdPbkxvYWQsXG4gICAgcmVnaXN0ZXJMYW5ndWFnZSxcbiAgICB1bnJlZ2lzdGVyTGFuZ3VhZ2UsXG4gICAgbGlzdExhbmd1YWdlcyxcbiAgICBnZXRMYW5ndWFnZSxcbiAgICByZWdpc3RlckFsaWFzZXMsXG4gICAgYXV0b0RldGVjdGlvbixcbiAgICBpbmhlcml0LFxuICAgIGFkZFBsdWdpbixcbiAgICByZW1vdmVQbHVnaW5cbiAgfSk7XG5cbiAgaGxqcy5kZWJ1Z01vZGUgPSBmdW5jdGlvbigpIHsgU0FGRV9NT0RFID0gZmFsc2U7IH07XG4gIGhsanMuc2FmZU1vZGUgPSBmdW5jdGlvbigpIHsgU0FGRV9NT0RFID0gdHJ1ZTsgfTtcbiAgaGxqcy52ZXJzaW9uU3RyaW5nID0gdmVyc2lvbjtcblxuICBobGpzLnJlZ2V4ID0ge1xuICAgIGNvbmNhdDogY29uY2F0LFxuICAgIGxvb2thaGVhZDogbG9va2FoZWFkLFxuICAgIGVpdGhlcjogZWl0aGVyLFxuICAgIG9wdGlvbmFsOiBvcHRpb25hbCxcbiAgICBhbnlOdW1iZXJPZlRpbWVzOiBhbnlOdW1iZXJPZlRpbWVzXG4gIH07XG5cbiAgZm9yIChjb25zdCBrZXkgaW4gTU9ERVMpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgaWYgKHR5cGVvZiBNT0RFU1trZXldID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBkZWVwRnJlZXplKE1PREVTW2tleV0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIG1lcmdlIGFsbCB0aGUgbW9kZXMvcmVnZXhlcyBpbnRvIG91ciBtYWluIG9iamVjdFxuICBPYmplY3QuYXNzaWduKGhsanMsIE1PREVTKTtcblxuICByZXR1cm4gaGxqcztcbn07XG5cbi8vIE90aGVyIG5hbWVzIGZvciB0aGUgdmFyaWFibGUgbWF5IGJyZWFrIGJ1aWxkIHNjcmlwdFxuY29uc3QgaGlnaGxpZ2h0ID0gSExKUyh7fSk7XG5cbi8vIHJldHVybnMgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIGhpZ2hsaWdodGVyIHRvIGJlIHVzZWQgZm9yIGV4dGVuc2lvbnNcbi8vIGNoZWNrIGh0dHBzOi8vZ2l0aHViLmNvbS93b29vcm0vbG93bGlnaHQvaXNzdWVzLzQ3XG5oaWdobGlnaHQubmV3SW5zdGFuY2UgPSAoKSA9PiBITEpTKHt9KTtcblxubW9kdWxlLmV4cG9ydHMgPSBoaWdobGlnaHQ7XG5oaWdobGlnaHQuSGlnaGxpZ2h0SlMgPSBoaWdobGlnaHQ7XG5oaWdobGlnaHQuZGVmYXVsdCA9IGhpZ2hsaWdodDtcbiIsICIvKipcbiAqIENvZGVGbG93IHdlYnZpZXcgcHJvdG9jb2wuXG4gKlxuICogVGhlIGV4dGVuc2lvbiBob3N0IGFuZCB0aGUgd2VidmlldyBhcmUgc2VwYXJhdGUgSmF2YVNjcmlwdCBjb250ZXh0cy4gRXZlcnlcbiAqIG1lc3NhZ2UgdGhhdCBjcm9zc2VzIHRoYXQgYm91bmRhcnkgbXVzdCBwYXNzIHRocm91Z2ggdGhpcyBtb2R1bGUgc28gdGhhdCBhXG4gKiBzaW5nbGUsIHZlcnNpb25lZCBjb250cmFjdCBkZWNpZGVzIHdoYXQgaXMgbGVnYWwuXG4gKlxuICogVGhpcyBtb2R1bGUgaXMgaW50ZW50aW9uYWxseSBkZXBlbmRlbmN5LWZyZWU6IGl0IGlzIGJ1bmRsZWQgaW50byBib3RoIHRoZVxuICogZXh0ZW5zaW9uIGhvc3QgYW5kIHRoZSB3ZWJ2aWV3LlxuICovXG5cbmV4cG9ydCBjb25zdCBQUk9UT0NPTF9WRVJTSU9OID0gMTtcblxuLyoqIEhhcmQgY2VpbGluZyBvbiBhIHNlcmlhbGl6ZWQgbWVzc2FnZS4gTGFyZ2VyIG1lc3NhZ2VzIGFyZSByZWplY3RlZCwgbmV2ZXIgdHJ1bmNhdGVkLiAqL1xuZXhwb3J0IGNvbnN0IE1BWF9QQVlMT0FEX0JZVEVTID0gMV8wMDBfMDAwO1xuXG4vKiogYGRvbWFpbi5hY3Rpb25gIGluIGxvd2VyIGNhc2UsIGF0IGxlYXN0IHR3byBzZWdtZW50cy4gKi9cbmV4cG9ydCBjb25zdCBLSU5EX1BBVFRFUk4gPSAvXlthLXpdKyhcXC5bYS16XSspKyQvO1xuXG5leHBvcnQgY29uc3QgUkVRVUVTVF9JRF9QQVRURVJOID0gL15bQS1aYS16MC05Xy1dezEsMTI4fSQvO1xuXG4vKiogS2luZHMgYSB3ZWJ2aWV3IG1heSBzZW5kIHRvIHRoZSBob3N0LiAqL1xuZXhwb3J0IGNvbnN0IFdFQlZJRVdfVE9fSE9TVCA9IE9iamVjdC5mcmVlemUoW1xuICAnd2Vidmlldy5yZWFkeScsXG4gICdncmFwaC5sb2FkJyxcbiAgJ2Nzci5sb2FkJyxcbiAgJ25vZGUuc2VsZWN0JyxcbiAgJ3BhbmVsLnBpbmcnLFxuICAncXVlcnkuc3ltYm9sJyxcbiAgJ3F1ZXJ5LnN5bWJvbHMnLFxuICAncXVlcnkuY2FsbGVycycsXG4gICdxdWVyeS5jYWxsZWVzJyxcbiAgJ3F1ZXJ5LmNvbnN0cnVjdHMnLFxuICAncXVlcnkuY2FwYWJpbGl0aWVzJyxcbiAgJ2NmZy5mdW5jdGlvbnMnLFxuICAnY2ZnLmxvYWQnLFxuICAnc291cmNlLnNsaWNlJyxcbiAgJ3NvdXJjZS52YWxpZGF0aW9uJyxcbiAgJ25hdmlnYXRlLnRvJyxcbiAgJ2V4cGxhaW4ubm9kZScsXG4gICdleHBsYWluLmZ1bmN0aW9uJyxcbiAgJ2NhbGxzLmxvYWQnLFxuICAnY2FsbHMub3V0Z29pbmcnLFxuICAnY2FsbHMuaW5jb21pbmcnLFxuICAnY2FsbHMuZXhwYW5kJyxcbiAgJ2NhbGxzLmNvbGxhcHNlJyxcbiAgJ2NhbGxzLmZpbHRlcicsXG4gICdjYWxscy5mb2N1cycsXG4gICdpbmRleC5zdGF0dXMnLFxuICAnem9vbS5vcGVuJyxcbiAgJ3pvb20uZGVzY2VuZCcsXG4gICd6b29tLmJyZWFkY3J1bWInLFxuICAnem9vbS5leHBhbmQnLFxuICAnem9vbS5zZWFyY2gnLFxuICAnem9vbS5maWx0ZXInLFxuICAnem9vbS5mb2N1cycsXG4gICdkZmcubG9hZCcsXG4gICdkZmcudHJhY2UnLFxuICAnZGZnLnNsaWNlJyxcbl0pO1xuXG4vKiogS2luZHMgdGhlIGhvc3QgbWF5IHNlbmQgdG8gdGhlIHdlYnZpZXcuICovXG5leHBvcnQgY29uc3QgSE9TVF9UT19XRUJWSUVXID0gT2JqZWN0LmZyZWV6ZShbXG4gICdncmFwaC5kYXRhJyxcbiAgJ2NhcGFiaWxpdGllcy5kYXRhJyxcbiAgJ2Nzci5kYXRhJyxcbiAgJ3F1ZXJ5LmRhdGEnLFxuICAnYW5hbHlzaXMucHJvZ3Jlc3MnLFxuICAncHJvdG9jb2wuZXJyb3InLFxuICAncHJvdG9jb2wuYWNrJyxcbiAgJ3BhbmVsLnBvbmcnLFxuICAnY2ZnLmZ1bmN0aW9ucycsXG4gICdjZmcuZGF0YScsXG4gICdzb3VyY2UuZGF0YScsXG4gICdzb3VyY2UuaW50ZWdyaXR5JyxcbiAgJ3NvdXJjZS5zdGFsZScsXG4gICduYXZpZ2F0ZS5kb25lJyxcbiAgJ3NlbGVjdGlvbi5jaGFuZ2VkJyxcbiAgJ2dyYXBoLmZvY3VzJyxcbiAgJ3NldHRpbmdzLmRhdGEnLFxuICAnZXhwbGFpbi5kYXRhJyxcbiAgJ2NhbGxzLmRhdGEnLFxuICAnY2FsbHMubmVpZ2hib3JzJyxcbiAgJ2luZGV4LmRhdGEnLFxuICAnem9vbS5kYXRhJyxcbiAgJ3pvb20ubWVtYmVycycsXG4gICd6b29tLnJlc3VsdHMnLFxuICAnZGZnLmRhdGEnLFxuICAnZGZnLm92ZXJsYXknLFxuICAnZGZnLmVycm9yJyxcbl0pO1xuXG5leHBvcnQgY29uc3QgRElSRUNUSU9OUyA9IE9iamVjdC5mcmVlemUoe1xuICBXRUJWSUVXX1RPX0hPU1Q6ICd3ZWJ2aWV3X3RvX2hvc3QnLFxuICBIT1NUX1RPX1dFQlZJRVc6ICdob3N0X3RvX3dlYnZpZXcnLFxufSk7XG5cbmNvbnN0IEtJTkRfQUxMT1dMSVNUID0gT2JqZWN0LmZyZWV6ZSh7XG4gIFtESVJFQ1RJT05TLldFQlZJRVdfVE9fSE9TVF06IG5ldyBTZXQoV0VCVklFV19UT19IT1NUKSxcbiAgW0RJUkVDVElPTlMuSE9TVF9UT19XRUJWSUVXXTogbmV3IFNldChIT1NUX1RPX1dFQlZJRVcpLFxufSk7XG5cbmNvbnN0IFVOU0FGRV9LRVlTID0gbmV3IFNldChbJ19fcHJvdG9fXycsICdjb25zdHJ1Y3RvcicsICdwcm90b3R5cGUnXSk7XG5cbmNvbnN0IE1BWF9LRVlfU0NBTl9ERVBUSCA9IDg7XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gRW52ZWxvcGVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBwcm90b2NvbFZlcnNpb25cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBraW5kXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3JlcXVlc3RJZF1cbiAqIEBwcm9wZXJ0eSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IHBheWxvYWRcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFZhbGlkYXRpb25TdWNjZXNzXG4gKiBAcHJvcGVydHkge3RydWV9IG9rXG4gKiBAcHJvcGVydHkge0VudmVsb3BlfSBlbnZlbG9wZVxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gVmFsaWRhdGlvbkZhaWx1cmVcbiAqIEBwcm9wZXJ0eSB7ZmFsc2V9IG9rXG4gKiBAcHJvcGVydHkgeydFX1BST1RPQ09MJ3wnRV9MSU1JVCd9IGNvZGVcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSByZWFzb25cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBtZXNzYWdlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3BhdGhdXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3JlcXVlc3RJZF1cbiAqL1xuXG4vKipcbiAqIEJ1aWxkIGEgd2VsbC1mb3JtZWQgZW52ZWxvcGUuIFByb2R1Y2VycyBzaG91bGQgdXNlIHRoaXMgaW5zdGVhZCBvZiB3cml0aW5nXG4gKiBvYmplY3QgbGl0ZXJhbHMgc28gdGhhdCB0aGUgdmVyc2lvbiBmaWVsZCBjYW4gbmV2ZXIgYmUgZm9yZ290dGVuLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBraW5kXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBbcGF5bG9hZF1cbiAqIEBwYXJhbSB7c3RyaW5nfSBbcmVxdWVzdElkXVxuICogQHJldHVybnMge0VudmVsb3BlfVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRW52ZWxvcGUoa2luZCwgcGF5bG9hZCwgcmVxdWVzdElkKSB7XG4gIC8qKiBAdHlwZSB7RW52ZWxvcGV9ICovXG4gIGNvbnN0IGVudmVsb3BlID0ge1xuICAgIHByb3RvY29sVmVyc2lvbjogUFJPVE9DT0xfVkVSU0lPTixcbiAgICBraW5kLFxuICAgIHBheWxvYWQ6IHBheWxvYWQgPz8ge30sXG4gIH07XG4gIGlmIChyZXF1ZXN0SWQpIHtcbiAgICBlbnZlbG9wZS5yZXF1ZXN0SWQgPSByZXF1ZXN0SWQ7XG4gIH1cbiAgcmV0dXJuIGVudmVsb3BlO1xufVxuXG4vKipcbiAqIEJ1aWxkIGEgdHlwZWQgZXJyb3IgcGF5bG9hZC4gYGRldGFpbGAgbXVzdCBuZXZlciBjb250YWluIHNvdXJjZSB0ZXh0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW2RldGFpbF1cbiAqIEByZXR1cm5zIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVycm9yUGF5bG9hZChjb2RlLCBtZXNzYWdlLCBkZXRhaWwpIHtcbiAgLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi9cbiAgY29uc3QgcGF5bG9hZCA9IHsgY29kZSwgbWVzc2FnZSB9O1xuICBpZiAoZGV0YWlsKSB7XG4gICAgcGF5bG9hZC5kZXRhaWwgPSBkZXRhaWw7XG4gIH1cbiAgcmV0dXJuIHBheWxvYWQ7XG59XG5cbi8qKlxuICogQXBwcm94aW1hdGUgc2VyaWFsaXplZCBzaXplIG9mIGEgbWVzc2FnZS4gVXNlZCBmb3IgbGltaXQgZW5mb3JjZW1lbnQ7IHRoZVxuICogZXhhY3QgYnl0ZXMgZG8gbm90IG1hdHRlciwgb25seSB0aGF0IG92ZXJzaXplZCBtZXNzYWdlcyBhcmUgcmVmdXNlZCBiZWZvcmVcbiAqIHRoZXkgYXJlIHBvc3RlZC5cbiAqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gbWVzc2FnZVNpemUodmFsdWUpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBqc29uID0gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xuICAgIHJldHVybiB0eXBlb2YganNvbiA9PT0gJ3N0cmluZycgPyBqc29uLmxlbmd0aCA6IDA7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcmV0dXJucyB7dmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj59XG4gKi9cbmZ1bmN0aW9uIGlzUGxhaW5PYmplY3QodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpO1xufVxuXG4vKipcbiAqIFJlamVjdCBwYXlsb2FkcyB0aGF0IGNvdWxkIHBvaXNvbiBwcm90b3R5cGVzIHdoZW4gbWVyZ2VkIG9yIHNwcmVhZC5cbiAqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aFxuICogQHBhcmFtIHtudW1iZXJ9IGRlcHRoXG4gKiBAcmV0dXJucyB7e29rOiB0cnVlfSB8IHtvazogZmFsc2UsIHBhdGg6IHN0cmluZywga2V5OiBzdHJpbmd9fVxuICovXG5mdW5jdGlvbiBzY2FuVW5zYWZlS2V5cyh2YWx1ZSwgcGF0aCwgZGVwdGgpIHtcbiAgaWYgKGRlcHRoID4gTUFYX0tFWV9TQ0FOX0RFUFRIIHx8IHZhbHVlID09PSBudWxsIHx8IHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4geyBvazogdHJ1ZSB9O1xuICB9XG4gIGNvbnN0IGVudHJpZXMgPSBBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlLmVudHJpZXMoKSA6IE9iamVjdC5lbnRyaWVzKHZhbHVlKTtcbiAgZm9yIChjb25zdCBba2V5LCBjaGlsZF0gb2YgZW50cmllcykge1xuICAgIGNvbnN0IGNoaWxkUGF0aCA9IEFycmF5LmlzQXJyYXkodmFsdWUpID8gYCR7cGF0aH1bJHtrZXl9XWAgOiBgJHtwYXRofS4ke2tleX1gO1xuICAgIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgVU5TQUZFX0tFWVMuaGFzKFN0cmluZyhrZXkpKSkge1xuICAgICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBwYXRoOiBjaGlsZFBhdGgsIGtleTogU3RyaW5nKGtleSkgfTtcbiAgICB9XG4gICAgY29uc3QgbmVzdGVkID0gc2NhblVuc2FmZUtleXMoY2hpbGQsIGNoaWxkUGF0aCwgZGVwdGggKyAxKTtcbiAgICBpZiAoIW5lc3RlZC5vaykge1xuICAgICAgcmV0dXJuIG5lc3RlZDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHsgb2s6IHRydWUgfTtcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSBhbiBpbmJvdW5kIG1lc3NhZ2UgYWdhaW5zdCB0aGUgcHJvdG9jb2wgY29udHJhY3QuXG4gKlxuICogVmFsaWRhdGlvbiBpcyB0b3RhbDogZXZlcnkgcmVqZWN0aW9uIHJldHVybnMgYSB0eXBlZCBmYWlsdXJlIHdpdGggYSBzdGFibGVcbiAqIHJlYXNvbiBjb2RlLCBhbmQgbmV2ZXIgdGhyb3dzLlxuICpcbiAqIEBwYXJhbSB7dW5rbm93bn0gcmF3XG4gKiBAcGFyYW0ge3tkaXJlY3Rpb246ICd3ZWJ2aWV3X3RvX2hvc3QnIHwgJ2hvc3RfdG9fd2Vidmlldyd9fSBvcHRpb25zXG4gKiBAcmV0dXJucyB7VmFsaWRhdGlvblN1Y2Nlc3MgfCBWYWxpZGF0aW9uRmFpbHVyZX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlRW52ZWxvcGUocmF3LCBvcHRpb25zKSB7XG4gIGNvbnN0IGRpcmVjdGlvbiA9IG9wdGlvbnM/LmRpcmVjdGlvbjtcbiAgY29uc3QgYWxsb3dsaXN0ID0gS0lORF9BTExPV0xJU1RbZGlyZWN0aW9uXTtcbiAgaWYgKCFhbGxvd2xpc3QpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAndW5rbm93bl9kaXJlY3Rpb24nLFxuICAgICAgbWVzc2FnZTogYFVua25vd24gcHJvdG9jb2wgZGlyZWN0aW9uOiAke1N0cmluZyhkaXJlY3Rpb24pfWAsXG4gICAgfTtcbiAgfVxuXG4gIGlmICghaXNQbGFpbk9iamVjdChyYXcpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgIHJlYXNvbjogJ25vdF9hbl9vYmplY3QnLFxuICAgICAgbWVzc2FnZTogJ01lc3NhZ2UgbXVzdCBiZSBhIHBsYWluIG9iamVjdC4nLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBjYW5kaWRhdGUgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAocmF3KTtcblxuICBpZiAoY2FuZGlkYXRlLnByb3RvY29sVmVyc2lvbiAhPT0gUFJPVE9DT0xfVkVSU0lPTikge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9QUk9UT0NPTCcsXG4gICAgICByZWFzb246ICd2ZXJzaW9uX21pc21hdGNoJyxcbiAgICAgIG1lc3NhZ2U6IGBVbnN1cHBvcnRlZCBwcm90b2NvbCB2ZXJzaW9uOiBleHBlY3RlZCAke1BST1RPQ09MX1ZFUlNJT059LCByZWNlaXZlZCAke1N0cmluZyhcbiAgICAgICAgY2FuZGlkYXRlLnByb3RvY29sVmVyc2lvbixcbiAgICAgICl9LmAsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGtpbmQgPSBjYW5kaWRhdGUua2luZDtcbiAgaWYgKHR5cGVvZiBraW5kICE9PSAnc3RyaW5nJyB8fCAhS0lORF9QQVRURVJOLnRlc3Qoa2luZCkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAnaW52YWxpZF9raW5kJyxcbiAgICAgIG1lc3NhZ2U6ICdNZXNzYWdlIGtpbmQgbXVzdCBsb29rIGxpa2UgXCJkb21haW4uYWN0aW9uXCIgaW4gbG93ZXIgY2FzZS4nLFxuICAgICAgcGF0aDogJ2tpbmQnLFxuICAgIH07XG4gIH1cblxuICBpZiAoIWFsbG93bGlzdC5oYXMoa2luZCkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAndW5rbm93bl9raW5kJyxcbiAgICAgIG1lc3NhZ2U6IGBLaW5kIFwiJHtraW5kfVwiIGlzIG5vdCBhY2NlcHRlZCBpbiBkaXJlY3Rpb24gXCIke2RpcmVjdGlvbn1cIi5gLFxuICAgICAgcGF0aDogJ2tpbmQnLFxuICAgIH07XG4gIH1cblxuICBjb25zdCByZXF1ZXN0SWQgPSBjYW5kaWRhdGUucmVxdWVzdElkO1xuICBpZiAocmVxdWVzdElkICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAodHlwZW9mIHJlcXVlc3RJZCAhPT0gJ3N0cmluZycgfHwgIVJFUVVFU1RfSURfUEFUVEVSTi50ZXN0KHJlcXVlc3RJZCkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgICByZWFzb246ICdpbnZhbGlkX3JlcXVlc3RfaWQnLFxuICAgICAgICBtZXNzYWdlOiAncmVxdWVzdElkIG11c3QgYmUgMS0xMjggY2hhcmFjdGVycyBvZiBBLVosIGEteiwgMC05LCBcIl9cIiBvciBcIi1cIi4nLFxuICAgICAgICBwYXRoOiAncmVxdWVzdElkJyxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgY29uc3QgcGF5bG9hZCA9IGNhbmRpZGF0ZS5wYXlsb2FkID8/IHt9O1xuICBpZiAoIWlzUGxhaW5PYmplY3QocGF5bG9hZCkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAnaW52YWxpZF9wYXlsb2FkJyxcbiAgICAgIG1lc3NhZ2U6ICdwYXlsb2FkIG11c3QgYmUgYSBwbGFpbiBvYmplY3QuJyxcbiAgICAgIHBhdGg6ICdwYXlsb2FkJyxcbiAgICAgIHJlcXVlc3RJZDogdHlwZW9mIHJlcXVlc3RJZCA9PT0gJ3N0cmluZycgPyByZXF1ZXN0SWQgOiB1bmRlZmluZWQsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGtleVNjYW4gPSBzY2FuVW5zYWZlS2V5cyhwYXlsb2FkLCAncGF5bG9hZCcsIDApO1xuICBpZiAoIWtleVNjYW4ub2spIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAndW5zYWZlX2tleScsXG4gICAgICBtZXNzYWdlOiBgUGF5bG9hZCBjb250YWlucyBhIGZvcmJpZGRlbiBrZXkgXCIke2tleVNjYW4ua2V5fVwiLmAsXG4gICAgICBwYXRoOiBrZXlTY2FuLnBhdGgsXG4gICAgICByZXF1ZXN0SWQ6IHR5cGVvZiByZXF1ZXN0SWQgPT09ICdzdHJpbmcnID8gcmVxdWVzdElkIDogdW5kZWZpbmVkLFxuICAgIH07XG4gIH1cblxuICBpZiAobWVzc2FnZVNpemUoY2FuZGlkYXRlKSA+IE1BWF9QQVlMT0FEX0JZVEVTKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX0xJTUlUJyxcbiAgICAgIHJlYXNvbjogJ3BheWxvYWRfdG9vX2xhcmdlJyxcbiAgICAgIG1lc3NhZ2U6IGBNZXNzYWdlIGV4Y2VlZHMgdGhlICR7TUFYX1BBWUxPQURfQllURVN9IGJ5dGUgbGltaXQuYCxcbiAgICAgIHJlcXVlc3RJZDogdHlwZW9mIHJlcXVlc3RJZCA9PT0gJ3N0cmluZycgPyByZXF1ZXN0SWQgOiB1bmRlZmluZWQsXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBAdHlwZSB7RW52ZWxvcGV9ICovXG4gIGNvbnN0IGVudmVsb3BlID0ge1xuICAgIHByb3RvY29sVmVyc2lvbjogUFJPVE9DT0xfVkVSU0lPTixcbiAgICBraW5kLFxuICAgIHBheWxvYWQsXG4gIH07XG4gIGlmICh0eXBlb2YgcmVxdWVzdElkID09PSAnc3RyaW5nJykge1xuICAgIGVudmVsb3BlLnJlcXVlc3RJZCA9IHJlcXVlc3RJZDtcbiAgfVxuXG4gIHJldHVybiB7IG9rOiB0cnVlLCBlbnZlbG9wZSB9O1xufVxuIiwgIi8qKlxuICogV2VidmlldyBtZXNzYWdlIGJyaWRnZS5cbiAqXG4gKiBTeW1tZXRyaWMgaW1wbGVtZW50YXRpb24gdXNlZCBieSBib3RoIHRoZSBleHRlbnNpb24gaG9zdCBhbmQgdGhlIHdlYnZpZXcuXG4gKiBSZXNwb25zaWJpbGl0aWVzOlxuICogLSBWYWxpZGF0ZSBldmVyeSBpbmJvdW5kIG1lc3NhZ2UgYmVmb3JlIGFueSBoYW5kbGVyIHNlZXMgaXQuXG4gKiAtIENvcnJlbGF0ZSByZXF1ZXN0cyB3aXRoIHJlc3BvbnNlcywgd2l0aCBhIHRpbWVvdXQgcGVyIHJlcXVlc3QuXG4gKiAtIENvbnRhaW4gaGFuZGxlciBmYWlsdXJlcyBhbmQgcmVwb3J0IHRoZW0gYXMgdHlwZWQgcHJvdG9jb2wgZXJyb3JzLlxuICogLSBSZWplY3Qgd29yayBhZnRlciBkaXNwb3NhbCBzbyBhIGNsb3NlZCBwYW5lbCBjYW5ub3QgbGVhayB0aW1lcnMuXG4gKlxuICogVGhlIGJyaWRnZSBoYXMgbm8gZGVwZW5kZW5jeSBvbiB0aGUgYHZzY29kZWAgbW9kdWxlOiB0aGUgdHJhbnNwb3J0IChgcG9zdGApXG4gKiBpcyBpbmplY3RlZC4gVGhhdCBtYWtlcyB0aGUgd2hvbGUgcmVxdWVzdC9yZXNwb25zZSBjb250cmFjdCB1bml0LXRlc3RhYmxlIGluXG4gKiBwbGFpbiBOb2RlLlxuICovXG5cbmltcG9ydCB7XG4gIERJUkVDVElPTlMsXG4gIEhPU1RfVE9fV0VCVklFVyxcbiAgV0VCVklFV19UT19IT1NULFxuICBjcmVhdGVFbnZlbG9wZSxcbiAgY3JlYXRlRXJyb3JQYXlsb2FkLFxuICBtZXNzYWdlU2l6ZSxcbiAgdmFsaWRhdGVFbnZlbG9wZSxcbn0gZnJvbSAnLi9lbnZlbG9wZS5qcyc7XG5cbmV4cG9ydCBjbGFzcyBQcm90b2NvbEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW2RldGFpbF1cbiAgICovXG4gIGNvbnN0cnVjdG9yKGNvZGUsIG1lc3NhZ2UsIGRldGFpbCkge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMubmFtZSA9ICdQcm90b2NvbEVycm9yJztcbiAgICB0aGlzLmNvZGUgPSBjb2RlO1xuICAgIGlmIChkZXRhaWwpIHtcbiAgICAgIHRoaXMuZGV0YWlsID0gZGV0YWlsO1xuICAgIH1cbiAgfVxufVxuXG4vKiogQHR5cGUge3tkZWJ1ZzogRnVuY3Rpb24sIHdhcm46IEZ1bmN0aW9uLCBlcnJvcjogRnVuY3Rpb259fSAqL1xuY29uc3QgTk9PUF9MT0dHRVIgPSB7XG4gIGRlYnVnKCkge30sXG4gIHdhcm4oKSB7fSxcbiAgZXJyb3IoKSB7fSxcbn07XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gQnJpZGdlT3B0aW9uc1xuICogQHByb3BlcnR5IHsobWVzc2FnZTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID0+IHZvaWR9IHBvc3QgIFRyYW5zcG9ydCB0byB0aGUgb3RoZXIgc2lkZS5cbiAqIEBwcm9wZXJ0eSB7J3dlYnZpZXdfdG9faG9zdCcgfCAnaG9zdF90b193ZWJ2aWV3J30gaW5ib3VuZERpcmVjdGlvblxuICogQHByb3BlcnR5IHtudW1iZXJ9IFt0aW1lb3V0TXNdXG4gKiBAcHJvcGVydHkge251bWJlcn0gW21heEluRmxpZ2h0XVxuICogQHByb3BlcnR5IHsoKSA9PiBzdHJpbmd9IFtjcmVhdGVSZXF1ZXN0SWRdXG4gKiBAcHJvcGVydHkge3R5cGVvZiBOT09QX0xPR0dFUn0gW2xvZ2dlcl1cbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7QnJpZGdlT3B0aW9uc30gb3B0aW9uc1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQnJpZGdlKG9wdGlvbnMpIHtcbiAgY29uc3QgeyBwb3N0LCBpbmJvdW5kRGlyZWN0aW9uLCBsb2dnZXIgPSBOT09QX0xPR0dFUiB9ID0gb3B0aW9ucztcbiAgY29uc3QgdGltZW91dE1zID0gb3B0aW9ucy50aW1lb3V0TXMgPz8gNTAwMDtcbiAgY29uc3QgbWF4SW5GbGlnaHQgPSBvcHRpb25zLm1heEluRmxpZ2h0ID8/IDMyO1xuICBjb25zdCBvdXRib3VuZERpcmVjdGlvbiA9XG4gICAgaW5ib3VuZERpcmVjdGlvbiA9PT0gRElSRUNUSU9OUy5XRUJWSUVXX1RPX0hPU1RcbiAgICAgID8gRElSRUNUSU9OUy5IT1NUX1RPX1dFQlZJRVdcbiAgICAgIDogRElSRUNUSU9OUy5XRUJWSUVXX1RPX0hPU1Q7XG4gIGNvbnN0IG91dGJvdW5kS2luZHMgPSBuZXcgU2V0KFxuICAgIG91dGJvdW5kRGlyZWN0aW9uID09PSBESVJFQ1RJT05TLkhPU1RfVE9fV0VCVklFVyA/IEhPU1RfVE9fV0VCVklFVyA6IFdFQlZJRVdfVE9fSE9TVCxcbiAgKTtcblxuICBsZXQgc2VxdWVuY2UgPSAwO1xuICBjb25zdCBjcmVhdGVSZXF1ZXN0SWQgPVxuICAgIG9wdGlvbnMuY3JlYXRlUmVxdWVzdElkID8/XG4gICAgKCgpID0+IHtcbiAgICAgIHNlcXVlbmNlICs9IDE7XG4gICAgICByZXR1cm4gYHIke3NlcXVlbmNlLnRvU3RyaW5nKDM2KX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCAxMCl9YDtcbiAgICB9KTtcblxuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIHtyZXNvbHZlOiBGdW5jdGlvbiwgcmVqZWN0OiBGdW5jdGlvbiwgdGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+fT59ICovXG4gIGNvbnN0IHBlbmRpbmcgPSBuZXcgTWFwKCk7XG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywgKHBheWxvYWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCBtZXRhOiB7cmVxdWVzdElkPzogc3RyaW5nfSkgPT4gdW5rbm93bj59ICovXG4gIGNvbnN0IGhhbmRsZXJzID0gbmV3IE1hcCgpO1xuICBjb25zdCByZXBvcnRlZEtpbmRzID0gbmV3IFNldCgpO1xuICBsZXQgZGlzcG9zZWQgPSBmYWxzZTtcblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtpbmRcbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gcGF5bG9hZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3JlcXVlc3RJZF1cbiAgICovXG4gIGZ1bmN0aW9uIHNlbmQoa2luZCwgcGF5bG9hZCwgcmVxdWVzdElkKSB7XG4gICAgaWYgKGRpc3Bvc2VkKSB7XG4gICAgICB0aHJvdyBuZXcgUHJvdG9jb2xFcnJvcignRV9DQU5DRUxMRUQnLCAnQnJpZGdlIGlzIGRpc3Bvc2VkLicpO1xuICAgIH1cbiAgICBpZiAoIW91dGJvdW5kS2luZHMuaGFzKGtpbmQpKSB7XG4gICAgICB0aHJvdyBuZXcgUHJvdG9jb2xFcnJvcignRV9QUk9UT0NPTCcsIGBLaW5kIFwiJHtraW5kfVwiIGlzIG5vdCBzZW5kYWJsZSBpbiB0aGlzIGRpcmVjdGlvbi5gKTtcbiAgICB9XG4gICAgY29uc3QgZW52ZWxvcGUgPSBjcmVhdGVFbnZlbG9wZShraW5kLCBwYXlsb2FkLCByZXF1ZXN0SWQpO1xuICAgIGlmIChtZXNzYWdlU2l6ZShlbnZlbG9wZSkgPiAxXzAwMF8wMDApIHtcbiAgICAgIHRocm93IG5ldyBQcm90b2NvbEVycm9yKCdFX0xJTUlUJywgJ1JlZnVzaW5nIHRvIHNlbmQgYW4gb3ZlcnNpemVkIG1lc3NhZ2UuJyk7XG4gICAgfVxuICAgIHBvc3QoZW52ZWxvcGUpO1xuICAgIGxvZ2dlci5kZWJ1ZygncHJvdG9jb2wuc2VuZCcsIHtcbiAgICAgIGtpbmQsXG4gICAgICByZXF1ZXN0SWQ6IHJlcXVlc3RJZCA/PyBudWxsLFxuICAgICAgYnl0ZXM6IG1lc3NhZ2VTaXplKGVudmVsb3BlKSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3JlcXVlc3RJZF1cbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW2RldGFpbF1cbiAgICovXG4gIGZ1bmN0aW9uIHNlbmRFcnJvcihjb2RlLCBtZXNzYWdlLCByZXF1ZXN0SWQsIGRldGFpbCkge1xuICAgIHRyeSB7XG4gICAgICBzZW5kKCdwcm90b2NvbC5lcnJvcicsIGNyZWF0ZUVycm9yUGF5bG9hZChjb2RlLCBtZXNzYWdlLCBkZXRhaWwpLCByZXF1ZXN0SWQpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gVGhlIHBhbmVsIG1heSBhbHJlYWR5IGJlIGdvbmUuIE5vdGhpbmcgdXNlZnVsIHJlbWFpbnMgdG8gZG8uXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBraW5kXG4gICAqIEBwYXJhbSB7KHBheWxvYWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCBtZXRhOiB7cmVxdWVzdElkPzogc3RyaW5nfSkgPT4gdW5rbm93bn0gaGFuZGxlclxuICAgKiBAcmV0dXJucyB7KCkgPT4gdm9pZH0gdW5zdWJzY3JpYmVcbiAgICovXG4gIGZ1bmN0aW9uIG9uKGtpbmQsIGhhbmRsZXIpIHtcbiAgICBoYW5kbGVycy5zZXQoa2luZCwgaGFuZGxlcik7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGlmIChoYW5kbGVycy5nZXQoa2luZCkgPT09IGhhbmRsZXIpIHtcbiAgICAgICAgaGFuZGxlcnMuZGVsZXRlKGtpbmQpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2VuZCBhIHJlcXVlc3QgYW5kIGF3YWl0IHRoZSBjb3JyZWxhdGVkIHJlc3BvbnNlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2luZFxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBbcGF5bG9hZF1cbiAgICogQHBhcmFtIHt7dGltZW91dE1zPzogbnVtYmVyfX0gW3JlcXVlc3RPcHRpb25zXVxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTx7a2luZDogc3RyaW5nLCBwYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0+fVxuICAgKi9cbiAgZnVuY3Rpb24gcmVxdWVzdChraW5kLCBwYXlsb2FkID0ge30sIHJlcXVlc3RPcHRpb25zID0ge30pIHtcbiAgICBpZiAoZGlzcG9zZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgUHJvdG9jb2xFcnJvcignRV9DQU5DRUxMRUQnLCAnQnJpZGdlIGlzIGRpc3Bvc2VkLicpKTtcbiAgICB9XG4gICAgaWYgKHBlbmRpbmcuc2l6ZSA+PSBtYXhJbkZsaWdodCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KFxuICAgICAgICBuZXcgUHJvdG9jb2xFcnJvcignRV9MSU1JVCcsIGBUb28gbWFueSBpbi1mbGlnaHQgcmVxdWVzdHMgKCR7bWF4SW5GbGlnaHR9KS5gKSxcbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IHJlcXVlc3RJZCA9IGNyZWF0ZVJlcXVlc3RJZCgpO1xuICAgIGNvbnN0IGVmZmVjdGl2ZVRpbWVvdXQgPSByZXF1ZXN0T3B0aW9ucy50aW1lb3V0TXMgPz8gdGltZW91dE1zO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHBlbmRpbmcuZGVsZXRlKHJlcXVlc3RJZCk7XG4gICAgICAgIHJlamVjdChcbiAgICAgICAgICBuZXcgUHJvdG9jb2xFcnJvcihcbiAgICAgICAgICAgICdFX1RJTUVPVVQnLFxuICAgICAgICAgICAgYE5vIHJlc3BvbnNlIHRvIFwiJHtraW5kfVwiIHdpdGhpbiAke2VmZmVjdGl2ZVRpbWVvdXR9IG1zLmAsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGtpbmQsXG4gICAgICAgICAgICAgIHJlcXVlc3RJZCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgKSxcbiAgICAgICAgKTtcbiAgICAgIH0sIGVmZmVjdGl2ZVRpbWVvdXQpO1xuICAgICAgcGVuZGluZy5zZXQocmVxdWVzdElkLCB7IHJlc29sdmUsIHJlamVjdCwgdGltZXIgfSk7XG4gICAgICB0cnkge1xuICAgICAgICBzZW5kKGtpbmQsIHBheWxvYWQsIHJlcXVlc3RJZCk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICBwZW5kaW5nLmRlbGV0ZShyZXF1ZXN0SWQpO1xuICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7dW5rbm93bn0gcmF3XG4gICAqIEByZXR1cm5zIHtQcm9taXNlPHtvazogYm9vbGVhbiwgY29kZT86IHN0cmluZywgcmVhc29uPzogc3RyaW5nfT59XG4gICAqL1xuICBhc3luYyBmdW5jdGlvbiBoYW5kbGVNZXNzYWdlKHJhdykge1xuICAgIGlmIChkaXNwb3NlZCkge1xuICAgICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBjb2RlOiAnRV9DQU5DRUxMRUQnLCByZWFzb246ICdkaXNwb3NlZCcgfTtcbiAgICB9XG5cbiAgICBjb25zdCB2YWxpZGF0aW9uID0gdmFsaWRhdGVFbnZlbG9wZShyYXcsIHsgZGlyZWN0aW9uOiBpbmJvdW5kRGlyZWN0aW9uIH0pO1xuICAgIGlmICghdmFsaWRhdGlvbi5vaykge1xuICAgICAgaWYgKCFyZXBvcnRlZEtpbmRzLmhhcyh2YWxpZGF0aW9uLnJlYXNvbikpIHtcbiAgICAgICAgcmVwb3J0ZWRLaW5kcy5hZGQodmFsaWRhdGlvbi5yZWFzb24pO1xuICAgICAgICBsb2dnZXIud2FybigncHJvdG9jb2wucmVqZWN0ZWQnLCB7XG4gICAgICAgICAgcmVhc29uOiB2YWxpZGF0aW9uLnJlYXNvbixcbiAgICAgICAgICBwYXRoOiB2YWxpZGF0aW9uLnBhdGggPz8gbnVsbCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBzZW5kRXJyb3IodmFsaWRhdGlvbi5jb2RlLCB2YWxpZGF0aW9uLm1lc3NhZ2UsIHZhbGlkYXRpb24ucmVxdWVzdElkLCB7XG4gICAgICAgIHJlYXNvbjogdmFsaWRhdGlvbi5yZWFzb24sXG4gICAgICB9KTtcbiAgICAgIHJldHVybiB7IG9rOiBmYWxzZSwgY29kZTogdmFsaWRhdGlvbi5jb2RlLCByZWFzb246IHZhbGlkYXRpb24ucmVhc29uIH07XG4gICAgfVxuXG4gICAgY29uc3QgZW52ZWxvcGUgPSB2YWxpZGF0aW9uLmVudmVsb3BlO1xuICAgIGNvbnN0IHsga2luZCwgcmVxdWVzdElkLCBwYXlsb2FkIH0gPSBlbnZlbG9wZTtcbiAgICBsb2dnZXIuZGVidWcoJ3Byb3RvY29sLnJlY2VpdmUnLCB7XG4gICAgICBraW5kLFxuICAgICAgcmVxdWVzdElkOiByZXF1ZXN0SWQgPz8gbnVsbCxcbiAgICAgIGJ5dGVzOiBtZXNzYWdlU2l6ZShlbnZlbG9wZSksXG4gICAgfSk7XG5cbiAgICBpZiAoa2luZCA9PT0gJ3Byb3RvY29sLmVycm9yJykge1xuICAgICAgaWYgKHJlcXVlc3RJZCAmJiBwZW5kaW5nLmhhcyhyZXF1ZXN0SWQpKSB7XG4gICAgICAgIGNvbnN0IGVudHJ5ID0gcGVuZGluZy5nZXQocmVxdWVzdElkKTtcbiAgICAgICAgaWYgKGVudHJ5KSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KGVudHJ5LnRpbWVyKTtcbiAgICAgICAgICBwZW5kaW5nLmRlbGV0ZShyZXF1ZXN0SWQpO1xuICAgICAgICAgIGNvbnN0IGNvZGUgPSB0eXBlb2YgcGF5bG9hZC5jb2RlID09PSAnc3RyaW5nJyA/IHBheWxvYWQuY29kZSA6ICdFX1BST1RPQ09MJztcbiAgICAgICAgICBjb25zdCBtZXNzYWdlID1cbiAgICAgICAgICAgIHR5cGVvZiBwYXlsb2FkLm1lc3NhZ2UgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgID8gcGF5bG9hZC5tZXNzYWdlXG4gICAgICAgICAgICAgIDogJ1RoZSBvdGhlciBzaWRlIHJlcG9ydGVkIGFuIGVycm9yLic7XG4gICAgICAgICAgZW50cnkucmVqZWN0KG5ldyBQcm90b2NvbEVycm9yKGNvZGUsIG1lc3NhZ2UsIHsgcmVxdWVzdElkIH0pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHsgb2s6IHRydWUgfTtcbiAgICB9XG5cbiAgICBpZiAocmVxdWVzdElkICYmIHBlbmRpbmcuaGFzKHJlcXVlc3RJZCkpIHtcbiAgICAgIGNvbnN0IGVudHJ5ID0gcGVuZGluZy5nZXQocmVxdWVzdElkKTtcbiAgICAgIGlmIChlbnRyeSkge1xuICAgICAgICBjbGVhclRpbWVvdXQoZW50cnkudGltZXIpO1xuICAgICAgICBwZW5kaW5nLmRlbGV0ZShyZXF1ZXN0SWQpO1xuICAgICAgICBlbnRyeS5yZXNvbHZlKHsga2luZCwgcGF5bG9hZCB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7IG9rOiB0cnVlIH07XG4gICAgfVxuXG4gICAgY29uc3QgaGFuZGxlciA9IGhhbmRsZXJzLmdldChraW5kKTtcbiAgICBpZiAoIWhhbmRsZXIpIHtcbiAgICAgIC8vIEEgcmVzcG9uc2Ugd2hvc2UgcmVxdWVzdCBhbHJlYWR5IHRpbWVkIG91dCBpcyBleHBlY3RlZCBhbmQgaGFybWxlc3MuXG4gICAgICBsb2dnZXIuZGVidWcoJ3Byb3RvY29sLnVuaGFuZGxlZCcsIHsga2luZCwgcmVxdWVzdElkOiByZXF1ZXN0SWQgPz8gbnVsbCB9KTtcbiAgICAgIHJldHVybiB7IG9rOiB0cnVlIH07XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGhhbmRsZXIocGF5bG9hZCwgeyByZXF1ZXN0SWQgfSk7XG4gICAgICByZXR1cm4geyBvazogdHJ1ZSB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuICAgICAgY29uc3QgY29kZSA9XG4gICAgICAgIGVycm9yIGluc3RhbmNlb2YgUHJvdG9jb2xFcnJvclxuICAgICAgICAgID8gZXJyb3IuY29kZVxuICAgICAgICAgIDogKC8qKiBAdHlwZSB7e2NvZGU/OiBzdHJpbmd9fSAqLyAoZXJyb3IpPy5jb2RlID8/ICdFX1BST1RPQ09MJyk7XG4gICAgICBsb2dnZXIuZXJyb3IoJ3Byb3RvY29sLmhhbmRsZXJfZmFpbGVkJywgeyBraW5kLCBlcnJvcjogbWVzc2FnZSB9KTtcbiAgICAgIHNlbmRFcnJvcihjb2RlLCBtZXNzYWdlLCByZXF1ZXN0SWQpO1xuICAgICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBjb2RlIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZWFzb25cbiAgICovXG4gIGZ1bmN0aW9uIGRpc3Bvc2UocmVhc29uID0gJ2Rpc3Bvc2VkJykge1xuICAgIGlmIChkaXNwb3NlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkaXNwb3NlZCA9IHRydWU7XG4gICAgZm9yIChjb25zdCBbLCBlbnRyeV0gb2YgcGVuZGluZykge1xuICAgICAgY2xlYXJUaW1lb3V0KGVudHJ5LnRpbWVyKTtcbiAgICAgIGVudHJ5LnJlamVjdChuZXcgUHJvdG9jb2xFcnJvcignRV9DQU5DRUxMRUQnLCBgQnJpZGdlIGNsb3NlZDogJHtyZWFzb259YCkpO1xuICAgIH1cbiAgICBwZW5kaW5nLmNsZWFyKCk7XG4gICAgaGFuZGxlcnMuY2xlYXIoKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgb24sXG4gICAgcmVxdWVzdCxcbiAgICByZXNwb25kOiBzZW5kLFxuICAgIGhhbmRsZU1lc3NhZ2UsXG4gICAgZGlzcG9zZSxcbiAgICBwZW5kaW5nQ291bnQ6ICgpID0+IHBlbmRpbmcuc2l6ZSxcbiAgICBpc0Rpc3Bvc2VkOiAoKSA9PiBkaXNwb3NlZCxcbiAgICBkaXJlY3Rpb246IGluYm91bmREaXJlY3Rpb24sXG4gIH07XG59XG4iLCAiLyoqXG4gKiBEZXRlcm1pbmlzdGljIGxheWVyZWQgbGF5b3V0LlxuICpcbiAqIFBoYXNlIDAgbmVlZHMgcG9zaXRpb25zIHNvIHRoZSB3ZWJ2aWV3IGNhbiBkcmF3IHNvbWV0aGluZyB3aXRob3V0IG93bmluZyBhXG4gKiBsYXlvdXQgYWxnb3JpdGhtLiBQaGFzZSA0IGJlbmNobWFya3MgcmVhbCBlbmdpbmVzIChDeXRvc2NhcGUvRUxLL2RhZ3JlKSBhbmRcbiAqIHJlcGxhY2VzIHRoaXMgYmVoaW5kIHRoZSByZW5kZXJlciBib3VuZGFyeTsgdW50aWwgdGhlbiwgZGV0ZXJtaW5pc3RpYyBvdXRwdXRcbiAqIGlzIG1vcmUgdmFsdWFibGUgdGhhbiBwcmV0dHkgb3V0cHV0IGJlY2F1c2UgaXQgbWFrZXMgdGVzdHMgc3RhYmxlLlxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge2ltcG9ydCgnLi9tb2RlbC5qcycpLkdyYXBofSBHcmFwaFxuICogQHR5cGVkZWYge3t4OiBudW1iZXIsIHk6IG51bWJlciwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIGxheWVyOiBudW1iZXJ9fSBQb3NpdGlvblxuICovXG5cbmV4cG9ydCBjb25zdCBMQVlPVVRfREVGQVVMVFMgPSBPYmplY3QuZnJlZXplKHtcbiAgbm9kZVdpZHRoOiAxOTAsXG4gIG5vZGVIZWlnaHQ6IDU0LFxuICBob3Jpem9udGFsR2FwOiA5MCxcbiAgdmVydGljYWxHYXA6IDI2LFxuICBtYXhMYXllcnM6IDQwLFxufSk7XG5cbi8qKlxuICogQHBhcmFtIHtHcmFwaH0gZ3JhcGhcbiAqIEBwYXJhbSB7UGFydGlhbDx0eXBlb2YgTEFZT1VUX0RFRkFVTFRTPn0gW29wdGlvbnNdXG4gKiBAcmV0dXJucyB7e3Bvc2l0aW9uczogUmVjb3JkPHN0cmluZywgUG9zaXRpb24+LCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgbGF5ZXJzOiBzdHJpbmdbXVtdfX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVMYXlvdXQoZ3JhcGgsIG9wdGlvbnMgPSB7fSkge1xuICBjb25zdCBjb25maWcgPSB7IC4uLkxBWU9VVF9ERUZBVUxUUywgLi4ub3B0aW9ucyB9O1xuICBjb25zdCBub2RlSWRzID0gZ3JhcGgubm9kZXMubWFwKChub2RlKSA9PiBub2RlLmlkKTtcbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBudW1iZXI+fSAqL1xuICBjb25zdCBsYXllck9mID0gbmV3IE1hcCgpO1xuXG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywgc3RyaW5nW10+fSAqL1xuICBjb25zdCBpbmNvbWluZyA9IG5ldyBNYXAobm9kZUlkcy5tYXAoKGlkKSA9PiBbaWQsIFtdXSkpO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIHN0cmluZ1tdPn0gKi9cbiAgY29uc3Qgb3V0Z29pbmcgPSBuZXcgTWFwKG5vZGVJZHMubWFwKChpZCkgPT4gW2lkLCBbXV0pKTtcblxuICBmb3IgKGNvbnN0IGVkZ2Ugb2YgZ3JhcGguZWRnZXMpIHtcbiAgICBpZiAoIWluY29taW5nLmhhcyhlZGdlLnRvKSB8fCAhaW5jb21pbmcuaGFzKGVkZ2UuZnJvbSkgfHwgZWRnZS5mcm9tID09PSBlZGdlLnRvKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaW5jb21pbmcuZ2V0KGVkZ2UudG8pPy5wdXNoKGVkZ2UuZnJvbSk7XG4gICAgb3V0Z29pbmcuZ2V0KGVkZ2UuZnJvbSk/LnB1c2goZWRnZS50byk7XG4gIH1cblxuICAvLyBLYWhuJ3MgYWxnb3JpdGhtIGdpdmVzIGEgdG9wb2xvZ2ljYWwgb3JkZXI7IGN5Y2xlcyBhcmUgaGFuZGxlZCBhZnRlcndhcmRzLlxuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIG51bWJlcj59ICovXG4gIGNvbnN0IGluZGVncmVlID0gbmV3IE1hcChub2RlSWRzLm1hcCgoaWQpID0+IFtpZCwgaW5jb21pbmcuZ2V0KGlkKT8ubGVuZ3RoID8/IDBdKSk7XG4gIGNvbnN0IHJlYWR5ID0gbm9kZUlkcy5maWx0ZXIoKGlkKSA9PiAoaW5kZWdyZWUuZ2V0KGlkKSA/PyAwKSA9PT0gMCkuc29ydCgpO1xuICAvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuICBjb25zdCBvcmRlciA9IFtdO1xuXG4gIHdoaWxlIChyZWFkeS5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgaWQgPSAvKiogQHR5cGUge3N0cmluZ30gKi8gKHJlYWR5LnNoaWZ0KCkpO1xuICAgIG9yZGVyLnB1c2goaWQpO1xuICAgIGZvciAoY29uc3QgbmV4dCBvZiAob3V0Z29pbmcuZ2V0KGlkKSA/PyBbXSkuc2xpY2UoKS5zb3J0KCkpIHtcbiAgICAgIGNvbnN0IHJlbWFpbmluZyA9IChpbmRlZ3JlZS5nZXQobmV4dCkgPz8gMCkgLSAxO1xuICAgICAgaW5kZWdyZWUuc2V0KG5leHQsIHJlbWFpbmluZyk7XG4gICAgICBpZiAocmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgIHJlYWR5LnB1c2gobmV4dCk7XG4gICAgICAgIHJlYWR5LnNvcnQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBsZXQgbWF4TGF5ZXIgPSAwO1xuICBmb3IgKGNvbnN0IGlkIG9mIG9yZGVyKSB7XG4gICAgY29uc3QgcHJlZGVjZXNzb3JzID0gaW5jb21pbmcuZ2V0KGlkKSA/PyBbXTtcbiAgICBjb25zdCBsYXllciA9XG4gICAgICBwcmVkZWNlc3NvcnMubGVuZ3RoID09PSAwXG4gICAgICAgID8gMFxuICAgICAgICA6IE1hdGgubWF4KC4uLnByZWRlY2Vzc29ycy5tYXAoKHByZWQpID0+IGxheWVyT2YuZ2V0KHByZWQpID8/IDApKSArIDE7XG4gICAgbGF5ZXJPZi5zZXQoaWQsIGxheWVyKTtcbiAgICBtYXhMYXllciA9IE1hdGgubWF4KG1heExheWVyLCBsYXllcik7XG4gIH1cblxuICAvLyBOb2RlcyBpbnNpZGUgYSBjeWNsZSBuZXZlciByZWFjaCBpbmRlZ3JlZSAwLiBQbGFjZSB0aGVtIGFmdGVyIGV2ZXJ5dGhpbmdcbiAgLy8gdGhhdCBjb3VsZCBiZSBvcmRlcmVkLCByYXRoZXIgdGhhbiBkcm9wcGluZyB0aGVtLlxuICBjb25zdCBjeWNsaWMgPSBub2RlSWRzLmZpbHRlcigoaWQpID0+ICFsYXllck9mLmhhcyhpZCkpLnNvcnQoKTtcbiAgZm9yIChjb25zdCBpZCBvZiBjeWNsaWMpIHtcbiAgICBsYXllck9mLnNldChpZCwgTWF0aC5taW4obWF4TGF5ZXIgKyAxLCBjb25maWcubWF4TGF5ZXJzKSk7XG4gIH1cblxuICAvKiogQHR5cGUge01hcDxudW1iZXIsIHN0cmluZ1tdPn0gKi9cbiAgY29uc3QgYnlMYXllciA9IG5ldyBNYXAoKTtcbiAgZm9yIChjb25zdCBpZCBvZiBub2RlSWRzLnNsaWNlKCkuc29ydCgpKSB7XG4gICAgY29uc3QgbGF5ZXIgPSBNYXRoLm1pbihsYXllck9mLmdldChpZCkgPz8gMCwgY29uZmlnLm1heExheWVycyk7XG4gICAgaWYgKCFieUxheWVyLmhhcyhsYXllcikpIHtcbiAgICAgIGJ5TGF5ZXIuc2V0KGxheWVyLCBbXSk7XG4gICAgfVxuICAgIGJ5TGF5ZXIuZ2V0KGxheWVyKT8ucHVzaChpZCk7XG4gIH1cblxuICAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIFBvc2l0aW9uPn0gKi9cbiAgY29uc3QgcG9zaXRpb25zID0ge307XG4gIC8qKiBAdHlwZSB7c3RyaW5nW11bXX0gKi9cbiAgY29uc3QgbGF5ZXJzID0gW107XG4gIGxldCB0YWxsZXN0ID0gMDtcblxuICBmb3IgKGNvbnN0IGxheWVyIG9mIFsuLi5ieUxheWVyLmtleXMoKV0uc29ydCgoYSwgYikgPT4gYSAtIGIpKSB7XG4gICAgY29uc3QgaWRzID0gYnlMYXllci5nZXQobGF5ZXIpID8/IFtdO1xuICAgIGxheWVycy5wdXNoKGlkcyk7XG4gICAgaWRzLmZvckVhY2goKGlkLCBpbmRleCkgPT4ge1xuICAgICAgcG9zaXRpb25zW2lkXSA9IHtcbiAgICAgICAgeDogbGF5ZXIgKiAoY29uZmlnLm5vZGVXaWR0aCArIGNvbmZpZy5ob3Jpem9udGFsR2FwKSxcbiAgICAgICAgeTogaW5kZXggKiAoY29uZmlnLm5vZGVIZWlnaHQgKyBjb25maWcudmVydGljYWxHYXApLFxuICAgICAgICB3aWR0aDogY29uZmlnLm5vZGVXaWR0aCxcbiAgICAgICAgaGVpZ2h0OiBjb25maWcubm9kZUhlaWdodCxcbiAgICAgICAgbGF5ZXIsXG4gICAgICB9O1xuICAgIH0pO1xuICAgIHRhbGxlc3QgPSBNYXRoLm1heCh0YWxsZXN0LCBpZHMubGVuZ3RoKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcG9zaXRpb25zLFxuICAgIHdpZHRoOiBNYXRoLm1heCgxLCBsYXllcnMubGVuZ3RoKSAqIChjb25maWcubm9kZVdpZHRoICsgY29uZmlnLmhvcml6b250YWxHYXApLFxuICAgIGhlaWdodDogTWF0aC5tYXgoMSwgdGFsbGVzdCkgKiAoY29uZmlnLm5vZGVIZWlnaHQgKyBjb25maWcudmVydGljYWxHYXApLFxuICAgIGxheWVycyxcbiAgfTtcbn1cbiIsICIvKipcbiAqIExhbmd1YWdlLW5ldXRyYWwgQ0ZHIHZvY2FidWxhcnkuXG4gKlxuICogVGhlc2UgbmFtZXMgYXJlIGZyb3plbiBieSBgZG9jcy9HUkFQSF9TUEVDSUZJQ0FUSU9OLm1kYC4gQWRhcHRlcnMgZGVzY3JpYmVcbiAqIHNvdXJjZSBzdHJ1Y3R1cmUgd2l0aCBgQ29udHJvbENvbnN0cnVjdGAgdHJlZXM7IHRoaXMgbW9kdWxlIG93bnMgdGhlIHNtYWxsZXJcbiAqIHNldCBvZiBub2RlcyBhbmQgZWRnZXMgdGhlIHJlbmRlcmVyIHVuZGVyc3RhbmRzLlxuICovXG5cbi8qKiBOb2RlIGtpbmRzIGEgQ0ZHIG1heSBjb250YWluLiAqL1xuZXhwb3J0IGNvbnN0IENGR19OT0RFX0tJTkRTID0gT2JqZWN0LmZyZWV6ZShbXG4gICdlbnRyeScsXG4gICdleGl0JyxcbiAgJ3N0YXRlbWVudCcsXG4gICdjb25kaXRpb24nLFxuICAnbXVsdGl3YXknLFxuICAnbWVyZ2UnLFxuICAnbG9vcF9oZWFkZXInLFxuICAnbG9vcF9sYXRjaCcsXG4gICdsb29wX2JvZHlfZW50cnknLFxuICAnYnJlYWsnLFxuICAnY29udGludWUnLFxuICAncmV0dXJuJyxcbiAgJ3Rocm93JyxcbiAgJ2NhbGwnLFxuICAnYXdhaXQnLFxuICAnY2F0Y2hfZW50cnknLFxuICAnZmluYWxseV9lbnRyeScsXG4gICd1bnJlYWNoYWJsZScsXG4gICd1bm1vZGVsZWQnLFxuXSk7XG5cbi8qKiBFZGdlIGtpbmRzIGEgQ0ZHIG1heSBjb250YWluLiAqL1xuZXhwb3J0IGNvbnN0IENGR19FREdFX0tJTkRTID0gT2JqZWN0LmZyZWV6ZShbXG4gICdzZXEnLFxuICAndHJ1ZScsXG4gICdmYWxzZScsXG4gICdjYXNlJyxcbiAgJ2RlZmF1bHQnLFxuICAnbG9vcF9iYWNrJyxcbiAgJ2JyZWFrJyxcbiAgJ2NvbnRpbnVlJyxcbiAgJ3JldHVybicsXG4gICd0aHJvdycsXG4gICdleGNlcHRpb24nLFxuICAnZmluYWxseScsXG4gICd1bnJlYWNoYWJsZScsXG5dKTtcblxuLyoqIFN0YXR1c2VzIHNoYXJlZCB3aXRoIENTUiByZWxhdGlvbnNoaXBzLiAqL1xuZXhwb3J0IGNvbnN0IENGR19TVEFUVVNFUyA9IE9iamVjdC5mcmVlemUoW1xuICAncmVzb2x2ZWQnLFxuICAnaW5mZXJyZWQnLFxuICAncG9zc2libGUnLFxuICAndW5yZXNvbHZlZCcsXG4gICdzdGFsZScsXG5dKTtcblxuLyoqIERlZ3JhZGF0aW9uIGNvZGVzIGVtaXR0ZWQgYnkgdGhlIGJ1aWxkZXIuICovXG5leHBvcnQgY29uc3QgQ0ZHX0RFR1JBREFUSU9OX0NPREVTID0gT2JqZWN0LmZyZWV6ZShbXG4gICd1bm1vZGVsZWRfY29uc3RydWN0JyxcbiAgJ2dvdG9fZmxvdycsXG4gICdpbmRpcmVjdF9nb3RvX2Zsb3cnLFxuICAnaXRlcmF0aW9uX3NvdXJjZV9vcGFxdWUnLFxuICAnY2FsbF9zaXRlX3VucmVjb3JkZWQnLFxuICAnY29uZGl0aW9uX3NoYXBlX3VubW9kZWxlZCcsXG4gICdvcnBoYW5fanVtcCcsXG4gICdtb2RlbGVkX2V4Y2VwdGlvbl9wYXRoJyxcbiAgJ2FuYWx5c2lzX3BhcnRpYWwnLFxuICAndHJ1bmNhdGVkJyxcbl0pO1xuXG4vKiogRWRnZSBraW5kcyB0aGF0IGRvIG5vdCBhZHZhbmNlIHRoZSBub3JtYWwgc3VjY2Vzc29yIHBhdGguICovXG5leHBvcnQgY29uc3QgQUJSVVBUX0VER0VfS0lORFMgPSBPYmplY3QuZnJlZXplKFsnYnJlYWsnLCAnY29udGludWUnLCAncmV0dXJuJywgJ3Rocm93J10pO1xuXG4vKiogRWRnZXMgZXhjbHVkZWQgZnJvbSByYW5rIGNvbXB1dGF0aW9uIGJlY2F1c2UgdGhleSBwb2ludCBiYWNrd2FyZHMuICovXG5leHBvcnQgY29uc3QgQkFDS19FREdFX0tJTkRTID0gT2JqZWN0LmZyZWV6ZShbJ2xvb3BfYmFjaycsICdjb250aW51ZSddKTtcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RhdHVzXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGFzaEZvclN0YXR1cyhzdGF0dXMpIHtcbiAgc3dpdGNoIChzdGF0dXMpIHtcbiAgICBjYXNlICdpbmZlcnJlZCc6XG4gICAgICByZXR1cm4gJzggNCc7XG4gICAgY2FzZSAncG9zc2libGUnOlxuICAgICAgcmV0dXJuICczIDMnO1xuICAgIGNhc2UgJ3VucmVzb2x2ZWQnOlxuICAgICAgcmV0dXJuICcyIDUnO1xuICAgIGNhc2UgJ3N0YWxlJzpcbiAgICAgIHJldHVybiAnMSA0JztcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuICcnO1xuICB9XG59XG5cbi8qKlxuICogTm9uLWNvbG91ciBjdWUgZm9yIGEgc3RhdHVzLiBQaGFzZSAxMiB3aWxsIGV4dGVuZCB0aGlzIGludG8gYSBmdWxsXG4gKiBhY2Nlc3NpYmlsaXR5IHBhc3M7IHRoZSBEVE8gYWxyZWFkeSBjYXJyaWVzIHRoZSBmaWVsZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RhdHVzXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2x5cGhGb3JTdGF0dXMoc3RhdHVzKSB7XG4gIHN3aXRjaCAoc3RhdHVzKSB7XG4gICAgY2FzZSAncmVzb2x2ZWQnOlxuICAgICAgcmV0dXJuICdcdTI1Q0YnO1xuICAgIGNhc2UgJ2luZmVycmVkJzpcbiAgICAgIHJldHVybiAnXHUyNUQwJztcbiAgICBjYXNlICdwb3NzaWJsZSc6XG4gICAgICByZXR1cm4gJ1x1MjVDQic7XG4gICAgY2FzZSAndW5yZXNvbHZlZCc6XG4gICAgICByZXR1cm4gJ1x1MjcxNSc7XG4gICAgY2FzZSAnc3RhbGUnOlxuICAgICAgcmV0dXJuICdcdTIyRUYnO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJz8nO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGtpbmRcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlZGdlTGFiZWwoa2luZCwgZXh0cmEgPSAnJykge1xuICBpZiAoZXh0cmEpIHtcbiAgICByZXR1cm4ga2luZCA9PT0gJ2Nhc2UnID8gYGNhc2UgJHtleHRyYX1gIDogZXh0cmE7XG4gIH1cbiAgc3dpdGNoIChraW5kKSB7XG4gICAgY2FzZSAnc2VxJzpcbiAgICAgIHJldHVybiAnJztcbiAgICBjYXNlICdsb29wX2JhY2snOlxuICAgICAgcmV0dXJuICdsb29wIGJhY2snO1xuICAgIGNhc2UgJ2V4Y2VwdGlvbic6XG4gICAgICByZXR1cm4gJ2V4Y2VwdGlvbic7XG4gICAgY2FzZSAnZmluYWxseSc6XG4gICAgICByZXR1cm4gJ2ZpbmFsbHknO1xuICAgIGNhc2UgJ3VucmVhY2hhYmxlJzpcbiAgICAgIHJldHVybiAndW5yZWFjaGFibGUnO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4ga2luZDtcbiAgfVxufVxuIiwgIi8qKlxuICogQ2FsbC1ncmFwaCB2b2NhYnVsYXJ5LCBsaW1pdHMsIHNjb3BlIGJhbm5lcnMsIGFuZCBub24tY29sb3IgZWRnZSBlbmNvZGluZ3MuXG4gKlxuICogS2VwdCBpbiBgc3JjL2NvcmUvZ3JhcGgvY2FsbHMvYCB3aXRoIHplcm8gYWRhcHRlciwgaG9zdCwgb3Igd2VidmlldyBpbXBvcnRzLlxuICovXG5cbmltcG9ydCB7IGRhc2hGb3JTdGF0dXMsIGdseXBoRm9yU3RhdHVzIH0gZnJvbSAnLi4vY2ZnL2tpbmRzLmpzJztcblxuZXhwb3J0IGNvbnN0IENBTExfU0NPUEVTID0gT2JqZWN0LmZyZWV6ZShbJ2NvbXBsZXRlJywgJ3BhcnRpYWwnLCAnc2FtZV9maWxlX29ubHknXSk7XG5cbmV4cG9ydCBjb25zdCBDQUxMX1NDT1BFX1JFQVNPTlMgPSBPYmplY3QuZnJlZXplKFtcbiAgJ25vX2luZGV4JyxcbiAgJ2luZGV4X3BhcnRpYWwnLFxuICAnaW5kZXhfc3RhbGUnLFxuICAnYW5hbHlzaXNfcGFydGlhbCcsXG4gICdzYW1lX2ZpbGVfYWRhcHRlcicsXG4gICdzdGFsZV9jdXJzb3JfcmVzZXQnLFxuXSk7XG5cbmV4cG9ydCBjb25zdCBDQUxMX1JFTEFUSU9OU0hJUF9UWVBFUyA9IE9iamVjdC5mcmVlemUoW1xuICAnY2FsbHMnLFxuICAnaW5zdGFudGlhdGVzJyxcbiAgJ292ZXJyaWRlcycsXG4gICdyZWZlcmVuY2VzJyxcbl0pO1xuXG5leHBvcnQgY29uc3QgQ0FMTF9TVEFUVVNFUyA9IE9iamVjdC5mcmVlemUoW1xuICAncmVzb2x2ZWQnLFxuICAnaW5mZXJyZWQnLFxuICAncG9zc2libGUnLFxuICAndW5yZXNvbHZlZCcsXG4gICdzdGFsZScsXG5dKTtcblxuZXhwb3J0IGNvbnN0IENBTExfTk9ERV9LSU5EUyA9IE9iamVjdC5mcmVlemUoW1xuICAnZnVuY3Rpb24nLFxuICAnbWV0aG9kJyxcbiAgJ2NvbnN0cnVjdG9yJyxcbiAgJ2Rlc3RydWN0b3InLFxuICAnbGFtYmRhJyxcbiAgJ2Nsb3N1cmUnLFxuICAnY2xhc3MnLFxuICAnc3RydWN0JyxcbiAgJ2ludGVyZmFjZScsXG4gICdtb2R1bGUnLFxuICAnZmlsZScsXG4gICd2YXJpYWJsZScsXG4gICdwYXJhbWV0ZXInLFxuICAnZmllbGQnLFxuICAncHJvcGVydHknLFxuICAndW5yZXNvbHZlZF9idWNrZXQnLFxuICAnY2FuZGlkYXRlX2J1Y2tldCcsXG4gICd1bmtub3duJyxcbl0pO1xuXG5leHBvcnQgY29uc3QgQ0FMTF9MSU1JVFMgPSBPYmplY3QuZnJlZXplKHtcbiAgZGVmYXVsdFBhZ2VTaXplOiAxMDAsXG4gIG1heFBhZ2VTaXplOiAyMDAsXG4gIGRlZmF1bHREZXB0aDogMyxcbiAgbWF4RGVwdGg6IDYsXG4gIG1heE5vZGVzOiA1MDAsXG4gIGNhbmRpZGF0ZUJ1Y2tldFRocmVzaG9sZDogNSxcbn0pO1xuXG4vKipcbiAqIE51bWVyaWNhbCBwcmVjZWRlbmNlIG9mIHJlc29sdXRpb24gc3RhdHVzZXMgKGV4Y2x1ZGluZyBgc3RhbGVgLCB3aGljaCBpcyBhXG4gKiBwcm92ZW5hbmNlIHByb3BlcnR5IHJhdGhlciB0aGFuIGEgc3RyZW5ndGggbGV2ZWwpLlxuICovXG5leHBvcnQgY29uc3QgU1RBVFVTX1NUUkVOR1RIID0gT2JqZWN0LmZyZWV6ZSh7XG4gIHJlc29sdmVkOiA0LFxuICBpbmZlcnJlZDogMyxcbiAgcG9zc2libGU6IDIsXG4gIHVucmVzb2x2ZWQ6IDEsXG59KTtcblxuLyoqXG4gKiBGb3JtYXQgYW4gaG9uZXN0IHNjb3BlIGxhYmVsIHBlciBQaGFzZSA3IFx1MDBBNzguXG4gKiBOZXZlciByZW5kZXJzIGEgYmFyZSBjb3VudCBmb3IgYHNhbWVfZmlsZV9vbmx5YCBvciBgcGFydGlhbGAgc2NvcGVzLlxuICpcbiAqIEBwYXJhbSB7J2NvbXBsZXRlJ3wncGFydGlhbCd8J3NhbWVfZmlsZV9vbmx5J30gc2NvcGVcbiAqIEBwYXJhbSB7bnVtYmVyfSBjb3VudFxuICogQHBhcmFtIHsnY2FsbGVycyd8J2NhbGxlZXMnfCduZWlnaGJvcnMnfSBbbm91bl1cbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRTY29wZUJhbm5lcihzY29wZSwgY291bnQsIG5vdW4gPSAnY2FsbGVycycpIHtcbiAgY29uc3Qgc2FmZUNvdW50ID0gTWF0aC5tYXgoMCwgTnVtYmVyLmlzSW50ZWdlcihjb3VudCkgPyBjb3VudCA6IDApO1xuICBjb25zdCB3b3JkID0gc2FmZUNvdW50ID09PSAxID8gKG5vdW4uZW5kc1dpdGgoJ3MnKSA/IG5vdW4uc2xpY2UoMCwgLTEpIDogbm91bikgOiBub3VuO1xuICBpZiAoc2NvcGUgPT09ICdjb21wbGV0ZScpIHtcbiAgICByZXR1cm4gYCR7c2FmZUNvdW50fSAke3dvcmR9YDtcbiAgfVxuICBpZiAoc2NvcGUgPT09ICdwYXJ0aWFsJykge1xuICAgIHJldHVybiBgJHtzYWZlQ291bnR9ICR7d29yZH0gKGluZGV4IHBhcnRpYWwgXHUyMDE0IG1heSBiZSBpbmNvbXBsZXRlKWA7XG4gIH1cbiAgcmV0dXJuIGAke3NhZmVDb3VudH0gJHt3b3JkfSBpbiB0aGlzIGZpbGUgXHUwMEI3IFByb2plY3Qtd2lkZSAke25vdW59IHJlcXVpcmUgaW5kZXhpbmdgO1xufVxuXG4vKipcbiAqIE5vbi1jb2xvciBTVkcgZGFzaCBwYXR0ZXJuIGZvciBhIGNhbGwgZWRnZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RhdHVzXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpc0N5Y2xlXVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbGxFZGdlRGFzaChzdGF0dXMsIGlzQ3ljbGUgPSBmYWxzZSkge1xuICBpZiAoc3RhdHVzID09PSAncmVzb2x2ZWQnICYmIGlzQ3ljbGUpIHtcbiAgICByZXR1cm4gJzEwIDQnO1xuICB9XG4gIHJldHVybiBkYXNoRm9yU3RhdHVzKHN0YXR1cyk7XG59XG5cbi8qKlxuICogTm9uLWNvbG9yIGdseXBoIGhpbnQgZm9yIGEgY2FsbCBlZGdlLCBkaXN0aW5ndWlzaGluZyBgcG9zc2libGVgIChgXHUyNUNCYCkgZnJvbVxuICogYHJlc29sdmVkYCAoYFx1MjVDRmApIGFuZCBtYXJraW5nIHJlY3Vyc2l2ZS9tdXR1YWwgY3ljbGUgZWRnZXMgKGBcdTIxQkJgKS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RhdHVzXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpc0N5Y2xlXVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbGxFZGdlR2x5cGgoc3RhdHVzLCBpc0N5Y2xlID0gZmFsc2UpIHtcbiAgY29uc3QgYmFzZSA9IGdseXBoRm9yU3RhdHVzKHN0YXR1cyk7XG4gIHJldHVybiBpc0N5Y2xlID8gYCR7YmFzZX0gXHUyMUJCYCA6IGJhc2U7XG59XG4iLCAiLyoqXG4gKiBTZW1hbnRpYyB6b29tIGxldmVsIGhpZXJhcmNoeSwgY2Fwcywgb3ZlcmxheSBzbG90cywgYW5kIGJvdW5kZWQgZ2VzdHVyZVxuICogdHJhbnNpdGlvbiBydWxlcyAoUGhhc2UgMTAgXHUwMEE3NSwgXHUwMEE3MTYsIFAxMC0wMSwgQUMtMTAuNikuXG4gKi9cblxuZXhwb3J0IGNvbnN0IFpPT01fTEVWRUxTID0gT2JqZWN0LmZyZWV6ZSh7XG4gIEwwX1dPUktTUEFDRTogJ3dvcmtzcGFjZScsXG4gIEwxX01PRFVMRTogJ21vZHVsZScsXG4gIEwyX0ZJTEU6ICdmaWxlJyxcbiAgTDNfU1lNQk9MOiAnc3ltYm9sJyxcbiAgTDRfRlVOQ1RJT046ICdmdW5jdGlvbicsXG4gIEw1X1NUQVRFTUVOVDogJ3N0YXRlbWVudCcsXG59KTtcblxuZXhwb3J0IGNvbnN0IExFVkVMX09SREVSID0gT2JqZWN0LmZyZWV6ZShbXG4gIFpPT01fTEVWRUxTLkwwX1dPUktTUEFDRSxcbiAgWk9PTV9MRVZFTFMuTDFfTU9EVUxFLFxuICBaT09NX0xFVkVMUy5MMl9GSUxFLFxuICBaT09NX0xFVkVMUy5MM19TWU1CT0wsXG4gIFpPT01fTEVWRUxTLkw0X0ZVTkNUSU9OLFxuICBaT09NX0xFVkVMUy5MNV9TVEFURU1FTlQsXG5dKTtcblxuZXhwb3J0IGNvbnN0IExFVkVMX0NBUFMgPSBPYmplY3QuZnJlZXplKHtcbiAgW1pPT01fTEVWRUxTLkwwX1dPUktTUEFDRV06IDYwLFxuICBbWk9PTV9MRVZFTFMuTDFfTU9EVUxFXTogMTIwLFxuICBbWk9PTV9MRVZFTFMuTDJfRklMRV06IDEyMCxcbiAgW1pPT01fTEVWRUxTLkwzX1NZTUJPTF06IDE1MCxcbiAgW1pPT01fTEVWRUxTLkw0X0ZVTkNUSU9OXTogMTUwLFxuICBbWk9PTV9MRVZFTFMuTDVfU1RBVEVNRU5UXTogMTAwLFxufSk7XG5cbmV4cG9ydCBjb25zdCBMRVZFTF9MQUJFTFMgPSBPYmplY3QuZnJlZXplKHtcbiAgW1pPT01fTEVWRUxTLkwwX1dPUktTUEFDRV06ICdMMCBXb3Jrc3BhY2UnLFxuICBbWk9PTV9MRVZFTFMuTDFfTU9EVUxFXTogJ0wxIE1vZHVsZScsXG4gIFtaT09NX0xFVkVMUy5MMl9GSUxFXTogJ0wyIEZpbGUnLFxuICBbWk9PTV9MRVZFTFMuTDNfU1lNQk9MXTogJ0wzIFN5bWJvbCcsXG4gIFtaT09NX0xFVkVMUy5MNF9GVU5DVElPTl06ICdMNCBGdW5jdGlvbicsXG4gIFtaT09NX0xFVkVMUy5MNV9TVEFURU1FTlRdOiAnTDUgU3RhdGVtZW50Jyxcbn0pO1xuXG4vKipcbiAqIE92ZXJsYXkgc2xvdHMgYXR0YWNoIHRvIEw0L0w1IHdpdGhvdXQgZm9ya2luZyB0aGUgbGV2ZWwgaGllcmFyY2h5XG4gKiAoUGhhc2UgMTAgXHUwMEE3MTYgaGFuZG9mZiB0byBQaGFzZSAxMSBERkcgb3ZlcmxheSkuXG4gKi9cbmV4cG9ydCBjb25zdCBPVkVSTEFZX1NMT1RTID0gT2JqZWN0LmZyZWV6ZSh7XG4gIERGRzogJ2RmZycsXG59KTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIG5leHQgZmluZXIgem9vbSBsZXZlbCwgb3IgYG51bGxgIGlmIGFscmVhZHkgYXQgYEw1X1NUQVRFTUVOVGAuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGxldmVsXG4gKiBAcmV0dXJucyB7c3RyaW5nfG51bGx9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuZXh0Q2hpbGRMZXZlbChsZXZlbCkge1xuICBjb25zdCBpZHggPSBMRVZFTF9PUkRFUi5pbmRleE9mKGxldmVsKTtcbiAgaWYgKGlkeCA8IDAgfHwgaWR4ICsgMSA+PSBMRVZFTF9PUkRFUi5sZW5ndGgpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gTEVWRUxfT1JERVJbaWR4ICsgMV07XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBwYXJlbnQgY29hcnNlciB6b29tIGxldmVsLCBvciBgbnVsbGAgaWYgYWxyZWFkeSBhdCBgTDBfV09SS1NQQUNFYC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbGV2ZWxcbiAqIEByZXR1cm5zIHtzdHJpbmd8bnVsbH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcmVudExldmVsKGxldmVsKSB7XG4gIGNvbnN0IGlkeCA9IExFVkVMX09SREVSLmluZGV4T2YobGV2ZWwpO1xuICBpZiAoaWR4IDw9IDApIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gTEVWRUxfT1JERVJbaWR4IC0gMV07XG59XG5cbi8qKlxuICogRXZhbHVhdGUgYSB3aGVlbC9waW5jaCB6b29tIGdlc3R1cmUgKFBoYXNlIDEwIFx1MDBBNzUuMiwgQUMtMTAuNik6XG4gKiAtIFdoZWVsL3BpbmNoIHpvb20gaXMgdmlzdWFsIGJ5IGRlZmF1bHQgKGBhY3Rpb246ICd2aXN1YWxfc2NhbGUnYCkuXG4gKiAtIE5ldmVyIGNoYW5nZXMgc2VtYW50aWMgbGV2ZWwgd2hpbGUgbWlkLXBhbiAoYGlzUGFubmluZyA9PT0gdHJ1ZWApLlxuICogLSBOZXZlciBjaGFuZ2VzIHNlbWFudGljIGxldmVsIG1vcmUgdGhhbiBvbmNlIHBlciBnZXN0dXJlXG4gKiAgIChgdHJhbnNpdGlvbnNJbkdlc3R1cmUgPj0gMWApLlxuICogLSBPbmx5IGNyb3NzZXMgaW50byBhIGZpbmVyIGxldmVsIHdoZW4gYG5leHRTY2FsZSA+PSBleHBhbmRUaHJlc2hvbGRgXG4gKiAgIChkZWZhdWx0IGAxLjg1YCkgQU5EIHRoZSBwb2ludGVyIGlzIG92ZXIgYW4gZXhwYW5kYWJsZSBjbHVzdGVyXG4gKiAgIChgb3ZlckV4cGFuZGFibGVDbHVzdGVyID09PSB0cnVlYCkuXG4gKlxuICogQHBhcmFtIHt7XG4gKiAgIGN1cnJlbnRMZXZlbDogc3RyaW5nLFxuICogICBjdXJyZW50U2NhbGU/OiBudW1iZXIsXG4gKiAgIHNjYWxlRGVsdGE/OiBudW1iZXIsXG4gKiAgIG92ZXJFeHBhbmRhYmxlQ2x1c3Rlcj86IGJvb2xlYW4sXG4gKiAgIHRhcmdldENsdXN0ZXJJZD86IHN0cmluZ3xudWxsLFxuICogICB0cmFuc2l0aW9uc0luR2VzdHVyZT86IG51bWJlcixcbiAqICAgaXNQYW5uaW5nPzogYm9vbGVhbixcbiAqICAgZXhwYW5kVGhyZXNob2xkPzogbnVtYmVyLFxuICogfX0gaW5wdXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV2YWx1YXRlWm9vbUdlc3R1cmUoaW5wdXQgPSB7fSkge1xuICBjb25zdCBjdXJyZW50TGV2ZWwgPSBMRVZFTF9PUkRFUi5pbmNsdWRlcyhpbnB1dC5jdXJyZW50TGV2ZWwpXG4gICAgPyBpbnB1dC5jdXJyZW50TGV2ZWxcbiAgICA6IFpPT01fTEVWRUxTLkwwX1dPUktTUEFDRTtcbiAgY29uc3QgY3VycmVudFNjYWxlID0gTnVtYmVyLmlzRmluaXRlKGlucHV0LmN1cnJlbnRTY2FsZSkgPyBOdW1iZXIoaW5wdXQuY3VycmVudFNjYWxlKSA6IDE7XG4gIGNvbnN0IHNjYWxlRGVsdGEgPSBOdW1iZXIuaXNGaW5pdGUoaW5wdXQuc2NhbGVEZWx0YSkgPyBOdW1iZXIoaW5wdXQuc2NhbGVEZWx0YSkgOiAwO1xuICBjb25zdCBuZXh0U2NhbGUgPSBNYXRoLm1pbig0LCBNYXRoLm1heCgwLjI1LCBOdW1iZXIoKGN1cnJlbnRTY2FsZSArIHNjYWxlRGVsdGEpLnRvRml4ZWQoMykpKSk7XG4gIGNvbnN0IGV4cGFuZFRocmVzaG9sZCA9IE51bWJlci5pc0Zpbml0ZShpbnB1dC5leHBhbmRUaHJlc2hvbGQpXG4gICAgPyBOdW1iZXIoaW5wdXQuZXhwYW5kVGhyZXNob2xkKVxuICAgIDogMS44NTtcbiAgY29uc3QgdHJhbnNpdGlvbnNJbkdlc3R1cmUgPSBNYXRoLm1heCgwLCBNYXRoLnRydW5jKE51bWJlcihpbnB1dC50cmFuc2l0aW9uc0luR2VzdHVyZSkgfHwgMCkpO1xuXG4gIGlmIChpbnB1dC5pc1Bhbm5pbmcpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYWN0aW9uOiAndmlzdWFsX3NjYWxlJyxcbiAgICAgIGxldmVsQ2hhbmdlZDogZmFsc2UsXG4gICAgICBjdXJyZW50TGV2ZWwsXG4gICAgICBuZXh0TGV2ZWw6IGN1cnJlbnRMZXZlbCxcbiAgICAgIHNjYWxlOiBjdXJyZW50U2NhbGUsXG4gICAgICBhZmZvcmRhbmNlOiBudWxsLFxuICAgIH07XG4gIH1cblxuICBpZiAodHJhbnNpdGlvbnNJbkdlc3R1cmUgPj0gMSkge1xuICAgIHJldHVybiB7XG4gICAgICBhY3Rpb246ICd2aXN1YWxfc2NhbGUnLFxuICAgICAgbGV2ZWxDaGFuZ2VkOiBmYWxzZSxcbiAgICAgIGN1cnJlbnRMZXZlbCxcbiAgICAgIG5leHRMZXZlbDogY3VycmVudExldmVsLFxuICAgICAgc2NhbGU6IG5leHRTY2FsZSxcbiAgICAgIGFmZm9yZGFuY2U6IG51bGwsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGNoaWxkTGV2ZWwgPSBuZXh0Q2hpbGRMZXZlbChjdXJyZW50TGV2ZWwpO1xuICBpZiAoaW5wdXQub3ZlckV4cGFuZGFibGVDbHVzdGVyICYmIGNoaWxkTGV2ZWwgJiYgbmV4dFNjYWxlID49IGV4cGFuZFRocmVzaG9sZCAmJiBzY2FsZURlbHRhID4gMCkge1xuICAgIHJldHVybiB7XG4gICAgICBhY3Rpb246ICdleHBhbmRfY2x1c3RlcicsXG4gICAgICBsZXZlbENoYW5nZWQ6IHRydWUsXG4gICAgICBjdXJyZW50TGV2ZWwsXG4gICAgICBuZXh0TGV2ZWw6IGNoaWxkTGV2ZWwsXG4gICAgICB0YXJnZXRDbHVzdGVySWQ6IGlucHV0LnRhcmdldENsdXN0ZXJJZCA/PyBudWxsLFxuICAgICAgc2NhbGU6IDEsXG4gICAgICBhZmZvcmRhbmNlOiAnWm9vbWVkIGluIHRvIGV4cGFuZCBjbHVzdGVyJyxcbiAgICB9O1xuICB9XG5cbiAgY29uc3Qgc2hvd0FmZm9yZGFuY2UgPSBCb29sZWFuKFxuICAgIGlucHV0Lm92ZXJFeHBhbmRhYmxlQ2x1c3RlciAmJiBjaGlsZExldmVsICYmIG5leHRTY2FsZSA+PSBleHBhbmRUaHJlc2hvbGQgKiAwLjc1LFxuICApO1xuXG4gIHJldHVybiB7XG4gICAgYWN0aW9uOiAndmlzdWFsX3NjYWxlJyxcbiAgICBsZXZlbENoYW5nZWQ6IGZhbHNlLFxuICAgIGN1cnJlbnRMZXZlbCxcbiAgICBuZXh0TGV2ZWw6IGN1cnJlbnRMZXZlbCxcbiAgICBzY2FsZTogbmV4dFNjYWxlLFxuICAgIGFmZm9yZGFuY2U6IHNob3dBZmZvcmRhbmNlID8gJ1pvb20gaW4gb3IgcHJlc3MgRW50ZXIgdG8gZXhwYW5kIGNsdXN0ZXInIDogbnVsbCxcbiAgfTtcbn1cbiIsICIvKipcbiAqIEdyYXBoIHZpZXctbW9kZWwgKERUTykuXG4gKlxuICogVGhlIERUTyBpcyB0aGUgb25seSBncmFwaCBzaGFwZSB0aGUgd2VidmlldyB1bmRlcnN0YW5kcy4gSXQgaXMgcGxhaW4gSlNPTjpcbiAqIG5vIGZ1bmN0aW9ucywgbm8gaWRzIHRoYXQgcmVxdWlyZSBhIGxvb2t1cCwgbm8gc291cmNlIHRleHQuXG4gKlxuICogU291cmNlIHRleHQgaXMgZmV0Y2hlZCBvbiBkZW1hbmQgaW4gUGhhc2UgNSB0aHJvdWdoIGEgc2VwYXJhdGUsIHZhbGlkYXRlZFxuICogcmVxdWVzdC4gS2VlcGluZyB0aGUgRFRPIGZyZWUgb2Ygc291cmNlIHByZXZlbnRzIGFjY2lkZW50YWwgbGVha2FnZSBpbnRvXG4gKiBjYWNoZXMgYW5kIGtlZXBzIG1lc3NhZ2Ugc2l6ZXMgcHJlZGljdGFibGUuXG4gKi9cblxuaW1wb3J0IHsgY29tcHV0ZUxheW91dCB9IGZyb20gJy4vbGF5b3V0LmpzJztcbmltcG9ydCB7IENGR19FREdFX0tJTkRTLCBDRkdfTk9ERV9LSU5EUywgQ0ZHX1NUQVRVU0VTIH0gZnJvbSAnLi9jZmcva2luZHMuanMnO1xuaW1wb3J0IHsgQ0FMTF9OT0RFX0tJTkRTLCBDQUxMX1JFTEFUSU9OU0hJUF9UWVBFUywgQ0FMTF9TQ09QRVMgfSBmcm9tICcuL2NhbGxzL2tpbmRzLmpzJztcbmltcG9ydCB7IExFVkVMX09SREVSIH0gZnJvbSAnLi96b29tL2xldmVscy5qcyc7XG5cbmV4cG9ydCBjb25zdCBHUkFQSF9EVE9fVkVSU0lPTiA9IDE7XG5cbi8qKlxuICogQHR5cGVkZWYge2ltcG9ydCgnLi9tb2RlbC5qcycpLkdyYXBofSBHcmFwaFxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gRHRvTm9kZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGlkXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbGFiZWxcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBraW5kXG4gKiBAcHJvcGVydHkge3N0cmluZ30gc3RhdHVzXG4gKiBAcHJvcGVydHkge3N0cmluZ30gYmFkZ2VcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gZXh0ZXJuYWxcbiAqIEBwcm9wZXJ0eSB7e2ZpbGVJZDogc3RyaW5nLCBzdGFydExpbmU6IG51bWJlciwgZW5kTGluZTogbnVtYmVyfSB8IG51bGx9IHJhbmdlXG4gKiBAcHJvcGVydHkge3t4OiBudW1iZXIsIHk6IG51bWJlciwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIGxheWVyOiBudW1iZXJ9fSBwb3NpdGlvblxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gR3JhcGhEdG9cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBkdG9WZXJzaW9uXG4gKiBAcHJvcGVydHkge3N0cmluZ30gZ3JhcGhJZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IHJ1bklkXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbGFuZ3VhZ2VcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBhZGFwdGVySWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBjb21wbGV0ZW5lc3NcbiAqIEBwcm9wZXJ0eSB7RHRvTm9kZVtdfSBub2Rlc1xuICogQHByb3BlcnR5IHtBcnJheTx7aWQ6IHN0cmluZywgZnJvbTogc3RyaW5nLCB0bzogc3RyaW5nLCB0eXBlOiBzdHJpbmcsIHN0YXR1czogc3RyaW5nLCBsYWJlbDogc3RyaW5nLCByZWFzb25Db2RlPzogc3RyaW5nfT59IGVkZ2VzXG4gKiBAcHJvcGVydHkge0FycmF5PHtjb2RlOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZywgc2V2ZXJpdHk6IHN0cmluZ30+fSBkaWFnbm9zdGljc1xuICogQHByb3BlcnR5IHtzdHJpbmdbXX0gZGVncmFkYXRpb25zXG4gKiBAcHJvcGVydHkge3t3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcn19IGV4dGVudFxuICogQHByb3BlcnR5IHt7c3RhdHVzZXM6IHN0cmluZ1tdLCBraW5kczogc3RyaW5nW119fSBsZWdlbmRcbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7R3JhcGh9IGdyYXBoXG4gKiBAcmV0dXJucyB7R3JhcGhEdG99XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0R0byhncmFwaCkge1xuICBjb25zdCBsYXlvdXQgPSBjb21wdXRlTGF5b3V0KGdyYXBoKTtcblxuICBjb25zdCBub2RlcyA9IGdyYXBoLm5vZGVzLm1hcCgobm9kZSkgPT4gKHtcbiAgICBpZDogbm9kZS5pZCxcbiAgICBsYWJlbDogbm9kZS5sYWJlbCxcbiAgICBraW5kOiBub2RlLmtpbmQsXG4gICAgc3RhdHVzOiBub2RlLnN0YXR1cyxcbiAgICBiYWRnZTogbm9kZS5iYWRnZSA/PyAnJyxcbiAgICBleHRlcm5hbDogbm9kZS5leHRlcm5hbCxcbiAgICByYW5nZTogbm9kZS5yYW5nZVxuICAgICAgPyB7XG4gICAgICAgICAgZmlsZUlkOiBub2RlLnJhbmdlLmZpbGVJZCxcbiAgICAgICAgICBzdGFydExpbmU6IG5vZGUucmFuZ2Uuc3RhcnRMaW5lLFxuICAgICAgICAgIGVuZExpbmU6IG5vZGUucmFuZ2UuZW5kTGluZSxcbiAgICAgICAgfVxuICAgICAgOiBudWxsLFxuICAgIHBvc2l0aW9uOiBsYXlvdXQucG9zaXRpb25zW25vZGUuaWRdID8/IHsgeDogMCwgeTogMCwgd2lkdGg6IDE5MCwgaGVpZ2h0OiA1NCwgbGF5ZXI6IDAgfSxcbiAgfSkpO1xuXG4gIGNvbnN0IHN0YXR1c2VzID0gWy4uLm5ldyBTZXQobm9kZXMubWFwKChub2RlKSA9PiBub2RlLnN0YXR1cykpXS5zb3J0KCk7XG4gIGNvbnN0IGtpbmRzID0gWy4uLm5ldyBTZXQobm9kZXMubWFwKChub2RlKSA9PiBub2RlLmtpbmQpKV0uc29ydCgpO1xuXG4gIHJldHVybiB7XG4gICAgZHRvVmVyc2lvbjogR1JBUEhfRFRPX1ZFUlNJT04sXG4gICAgZ3JhcGhJZDogZ3JhcGguZ3JhcGhJZCxcbiAgICBydW5JZDogZ3JhcGgucnVuSWQsXG4gICAgbGFuZ3VhZ2U6IGdyYXBoLmxhbmd1YWdlLFxuICAgIGFkYXB0ZXJJZDogZ3JhcGguYWRhcHRlcklkLFxuICAgIGNvbXBsZXRlbmVzczogZ3JhcGguY29tcGxldGVuZXNzLFxuICAgIG5vZGVzLFxuICAgIGVkZ2VzOiBncmFwaC5lZGdlcy5tYXAoKGVkZ2UpID0+IHtcbiAgICAgIC8qKiBAdHlwZSB7e2lkOiBzdHJpbmcsIGZyb206IHN0cmluZywgdG86IHN0cmluZywgdHlwZTogc3RyaW5nLCBzdGF0dXM6IHN0cmluZywgbGFiZWw6IHN0cmluZywgcmVhc29uQ29kZT86IHN0cmluZ319ICovXG4gICAgICBjb25zdCBkdG9FZGdlID0ge1xuICAgICAgICBpZDogZWRnZS5pZCxcbiAgICAgICAgZnJvbTogZWRnZS5mcm9tLFxuICAgICAgICB0bzogZWRnZS50byxcbiAgICAgICAgdHlwZTogZWRnZS50eXBlLFxuICAgICAgICBzdGF0dXM6IGVkZ2Uuc3RhdHVzLFxuICAgICAgICBsYWJlbDogZWRnZS5sYWJlbCxcbiAgICAgIH07XG4gICAgICAvLyBPbWl0IHRoZSBrZXkgZW50aXJlbHkgd2hlbiBhYnNlbnQgc28gdGhlIERUTyBzdXJ2aXZlcyBhIEpTT04gcm91bmQtdHJpcFxuICAgICAgLy8gdW5jaGFuZ2VkIChKU09OIGNhbm5vdCByZXByZXNlbnQgYHVuZGVmaW5lZGApLlxuICAgICAgaWYgKGVkZ2UucmVhc29uQ29kZSkge1xuICAgICAgICBkdG9FZGdlLnJlYXNvbkNvZGUgPSBlZGdlLnJlYXNvbkNvZGU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZHRvRWRnZTtcbiAgICB9KSxcbiAgICBkaWFnbm9zdGljczogZ3JhcGguZGlhZ25vc3RpY3MsXG4gICAgZGVncmFkYXRpb25zOiBncmFwaC5kZWdyYWRhdGlvbnMsXG4gICAgZXh0ZW50OiB7IHdpZHRoOiBsYXlvdXQud2lkdGgsIGhlaWdodDogbGF5b3V0LmhlaWdodCB9LFxuICAgIGxlZ2VuZDogeyBzdGF0dXNlcywga2luZHMgfSxcbiAgfTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IGR0b1xuICogQHJldHVybnMge3tvazogdHJ1ZSwgZHRvOiBHcmFwaER0b30gfCB7b2s6IGZhbHNlLCBpc3N1ZXM6IHN0cmluZ1tdfX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlRHRvKGR0bykge1xuICAvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuICBjb25zdCBpc3N1ZXMgPSBbXTtcbiAgaWYgKHR5cGVvZiBkdG8gIT09ICdvYmplY3QnIHx8IGR0byA9PT0gbnVsbCB8fCBBcnJheS5pc0FycmF5KGR0bykpIHtcbiAgICByZXR1cm4geyBvazogZmFsc2UsIGlzc3VlczogWydEVE8gbXVzdCBiZSBhbiBvYmplY3QuJ10gfTtcbiAgfVxuICBjb25zdCBjYW5kaWRhdGUgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAoZHRvKTtcbiAgaWYgKGNhbmRpZGF0ZS5kdG9WZXJzaW9uICE9PSBHUkFQSF9EVE9fVkVSU0lPTikge1xuICAgIGlzc3Vlcy5wdXNoKGBVbnN1cHBvcnRlZCBkdG9WZXJzaW9uOiAke1N0cmluZyhjYW5kaWRhdGUuZHRvVmVyc2lvbil9LmApO1xuICB9XG4gIGlmIChjYW5kaWRhdGUuZHRvS2luZCA9PT0gJ2NmZycpIHtcbiAgICB2YWxpZGF0ZUNmZ0R0byhjYW5kaWRhdGUsIGlzc3Vlcyk7XG4gICAgcmV0dXJuIGlzc3Vlcy5sZW5ndGggPiAwXG4gICAgICA/IHsgb2s6IGZhbHNlLCBpc3N1ZXMgfVxuICAgICAgOiB7IG9rOiB0cnVlLCBkdG86IC8qKiBAdHlwZSB7R3JhcGhEdG99ICovIChkdG8pIH07XG4gIH1cbiAgaWYgKGNhbmRpZGF0ZS5kdG9LaW5kID09PSAnY2FsbF9ncmFwaCcpIHtcbiAgICB2YWxpZGF0ZUNhbGxHcmFwaER0byhjYW5kaWRhdGUsIGlzc3Vlcyk7XG4gICAgcmV0dXJuIGlzc3Vlcy5sZW5ndGggPiAwXG4gICAgICA/IHsgb2s6IGZhbHNlLCBpc3N1ZXMgfVxuICAgICAgOiB7IG9rOiB0cnVlLCBkdG86IC8qKiBAdHlwZSB7R3JhcGhEdG99ICovIChkdG8pIH07XG4gIH1cbiAgaWYgKGNhbmRpZGF0ZS5kdG9LaW5kID09PSAnc2VtYW50aWNfem9vbScpIHtcbiAgICB2YWxpZGF0ZVNlbWFudGljWm9vbUR0byhjYW5kaWRhdGUsIGlzc3Vlcyk7XG4gICAgcmV0dXJuIGlzc3Vlcy5sZW5ndGggPiAwXG4gICAgICA/IHsgb2s6IGZhbHNlLCBpc3N1ZXMgfVxuICAgICAgOiB7IG9rOiB0cnVlLCBkdG86IC8qKiBAdHlwZSB7R3JhcGhEdG99ICovIChkdG8pIH07XG4gIH1cbiAgY29uc3Qgbm9kZXMgPSBjYW5kaWRhdGUubm9kZXM7XG4gIGNvbnN0IGVkZ2VzID0gY2FuZGlkYXRlLmVkZ2VzO1xuICBpZiAoIUFycmF5LmlzQXJyYXkobm9kZXMpKSB7XG4gICAgaXNzdWVzLnB1c2goJ25vZGVzIG11c3QgYmUgYW4gYXJyYXkuJyk7XG4gIH1cbiAgaWYgKCFBcnJheS5pc0FycmF5KGVkZ2VzKSkge1xuICAgIGlzc3Vlcy5wdXNoKCdlZGdlcyBtdXN0IGJlIGFuIGFycmF5LicpO1xuICB9XG4gIGlmIChBcnJheS5pc0FycmF5KG5vZGVzKSAmJiBBcnJheS5pc0FycmF5KGVkZ2VzKSkge1xuICAgIGNvbnN0IGlkcyA9IG5ldyBTZXQoKTtcbiAgICBmb3IgKGNvbnN0IG5vZGUgb2Ygbm9kZXMpIHtcbiAgICAgIGNvbnN0IGlkID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKG5vZGUpLmlkO1xuICAgICAgaWYgKHR5cGVvZiBpZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgaXNzdWVzLnB1c2goJ0V2ZXJ5IG5vZGUgbmVlZHMgYSBzdHJpbmcgaWQuJyk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKGlkcy5oYXMoaWQpKSB7XG4gICAgICAgIGlzc3Vlcy5wdXNoKGBEdXBsaWNhdGUgbm9kZSBpZCBcIiR7aWR9XCIuYCk7XG4gICAgICB9XG4gICAgICBpZHMuYWRkKGlkKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBlZGdlIG9mIGVkZ2VzKSB7XG4gICAgICBjb25zdCByZWNvcmQgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAoZWRnZSk7XG4gICAgICBpZiAodHlwZW9mIHJlY29yZC5mcm9tICE9PSAnc3RyaW5nJyB8fCAhaWRzLmhhcyhyZWNvcmQuZnJvbSkpIHtcbiAgICAgICAgaXNzdWVzLnB1c2goYEVkZ2UgXCIke1N0cmluZyhyZWNvcmQuaWQpfVwiIGhhcyBhbiB1bmtub3duIHNvdXJjZSBub2RlLmApO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiByZWNvcmQudG8gIT09ICdzdHJpbmcnIHx8ICFpZHMuaGFzKHJlY29yZC50bykpIHtcbiAgICAgICAgaXNzdWVzLnB1c2goYEVkZ2UgXCIke1N0cmluZyhyZWNvcmQuaWQpfVwiIGhhcyBhbiB1bmtub3duIHRhcmdldCBub2RlLmApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAoaXNzdWVzLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4geyBvazogZmFsc2UsIGlzc3VlcyB9O1xuICB9XG4gIHJldHVybiB7IG9rOiB0cnVlLCBkdG86IC8qKiBAdHlwZSB7R3JhcGhEdG99ICovIChkdG8pIH07XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gY2FuZGlkYXRlXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBpc3N1ZXNcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVDZmdEdG8oY2FuZGlkYXRlLCBpc3N1ZXMpIHtcbiAgaWYgKGNhbmRpZGF0ZS5ncmFwaEtpbmQgIT09ICdjZmcnKSB7XG4gICAgaXNzdWVzLnB1c2goJ0EgQ0ZHIERUTyBtdXN0IGRlY2xhcmUgZ3JhcGhLaW5kIFwiY2ZnXCIuJyk7XG4gIH1cbiAgY29uc3QgZm4gPSBjYW5kaWRhdGUuZnVuY3Rpb247XG4gIGlmICh0eXBlb2YgZm4gIT09ICdvYmplY3QnIHx8IGZuID09PSBudWxsIHx8IEFycmF5LmlzQXJyYXkoZm4pKSB7XG4gICAgaXNzdWVzLnB1c2goJ2Z1bmN0aW9uIG11c3QgYmUgYW4gb2JqZWN0LicpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHJlY29yZCA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChmbik7XG4gICAgZm9yIChjb25zdCBrZXkgb2YgWydzeW1ib2xJZCcsICduYW1lJywgJ3F1YWxpZmllZE5hbWUnLCAna2luZCddKSB7XG4gICAgICBpZiAodHlwZW9mIHJlY29yZFtrZXldICE9PSAnc3RyaW5nJykge1xuICAgICAgICBpc3N1ZXMucHVzaChgZnVuY3Rpb24uJHtrZXl9IG11c3QgYmUgYSBzdHJpbmcuYCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChyZWNvcmQucmFuZ2UgIT09IG51bGwgJiYgIWlzUmFuZ2VSZWYocmVjb3JkLnJhbmdlKSkge1xuICAgICAgaXNzdWVzLnB1c2goJ2Z1bmN0aW9uLnJhbmdlIG11c3QgYmUgYSByYW5nZSByZWZlcmVuY2Ugb3IgbnVsbC4nKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBub2RlcyA9IGNhbmRpZGF0ZS5ub2RlcztcbiAgY29uc3QgZWRnZXMgPSBjYW5kaWRhdGUuZWRnZXM7XG4gIGlmICghQXJyYXkuaXNBcnJheShub2RlcykpIHtcbiAgICBpc3N1ZXMucHVzaCgnbm9kZXMgbXVzdCBiZSBhbiBhcnJheS4nKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKCFBcnJheS5pc0FycmF5KGVkZ2VzKSkge1xuICAgIGlzc3Vlcy5wdXNoKCdlZGdlcyBtdXN0IGJlIGFuIGFycmF5LicpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGlkcyA9IG5ldyBTZXQoKTtcbiAgLyoqIEB0eXBlIHtzdHJpbmdbXX0gKi9cbiAgY29uc3QgZW50cnlJZHMgPSBbXTtcbiAgLyoqIEB0eXBlIHtzdHJpbmdbXX0gKi9cbiAgY29uc3QgZXhpdElkcyA9IFtdO1xuICBmb3IgKGNvbnN0IGVudHJ5IG9mIG5vZGVzKSB7XG4gICAgaWYgKHR5cGVvZiBlbnRyeSAhPT0gJ29iamVjdCcgfHwgZW50cnkgPT09IG51bGwgfHwgQXJyYXkuaXNBcnJheShlbnRyeSkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKCdFdmVyeSBub2RlIG11c3QgYmUgYW4gb2JqZWN0LicpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IG5vZGUgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAoZW50cnkpO1xuICAgIGNvbnN0IGlkID0gbm9kZS5pZDtcbiAgICBpZiAodHlwZW9mIGlkICE9PSAnc3RyaW5nJykge1xuICAgICAgaXNzdWVzLnB1c2goJ0V2ZXJ5IG5vZGUgbmVlZHMgYSBzdHJpbmcgaWQuJyk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGlkcy5oYXMoaWQpKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRHVwbGljYXRlIG5vZGUgaWQgXCIke2lkfVwiLmApO1xuICAgIH1cbiAgICBpZHMuYWRkKGlkKTtcbiAgICBpZiAoIUNGR19OT0RFX0tJTkRTLmluY2x1ZGVzKFN0cmluZyhub2RlLmtpbmQpKSkge1xuICAgICAgaXNzdWVzLnB1c2goYE5vZGUgXCIke2lkfVwiIGhhcyB1bmtub3duIGtpbmQgXCIke1N0cmluZyhub2RlLmtpbmQpfVwiLmApO1xuICAgIH1cbiAgICBpZiAoIUNGR19TVEFUVVNFUy5pbmNsdWRlcyhTdHJpbmcobm9kZS5zdGF0dXMpKSkge1xuICAgICAgaXNzdWVzLnB1c2goYE5vZGUgXCIke2lkfVwiIGhhcyB1bmtub3duIHN0YXR1cyBcIiR7U3RyaW5nKG5vZGUuc3RhdHVzKX1cIi5gKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBub2RlLmxhYmVsICE9PSAnc3RyaW5nJykge1xuICAgICAgaXNzdWVzLnB1c2goYE5vZGUgXCIke2lkfVwiIG5lZWRzIGEgc3RyaW5nIGxhYmVsLmApO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICAhQXJyYXkuaXNBcnJheShub2RlLmxhYmVsTGluZXMpIHx8XG4gICAgICBub2RlLmxhYmVsTGluZXMuc29tZSgobGluZSkgPT4gdHlwZW9mIGxpbmUgIT09ICdzdHJpbmcnKVxuICAgICkge1xuICAgICAgaXNzdWVzLnB1c2goYE5vZGUgXCIke2lkfVwiIG5lZWRzIHN0cmluZyBsYWJlbExpbmVzLmApO1xuICAgIH1cbiAgICBpZiAobm9kZS5yYW5nZSAhPT0gbnVsbCAmJiAhaXNSYW5nZVJlZihub2RlLnJhbmdlKSkge1xuICAgICAgaXNzdWVzLnB1c2goYE5vZGUgXCIke2lkfVwiIGhhcyBhbiBpbnZhbGlkIHJhbmdlIHJlZmVyZW5jZS5gKTtcbiAgICB9XG4gICAgaWYgKCFpc1Bvc2l0aW9uKG5vZGUucG9zaXRpb24pKSB7XG4gICAgICBpc3N1ZXMucHVzaChgTm9kZSBcIiR7aWR9XCIgaGFzIGFuIGludmFsaWQgcG9zaXRpb24uYCk7XG4gICAgfVxuICAgIGlmIChub2RlLmtpbmQgPT09ICdlbnRyeScpIHtcbiAgICAgIGVudHJ5SWRzLnB1c2goaWQpO1xuICAgIH1cbiAgICBpZiAobm9kZS5raW5kID09PSAnZXhpdCcpIHtcbiAgICAgIGV4aXRJZHMucHVzaChpZCk7XG4gICAgfVxuICAgIGlmIChub2RlLmNhbGxzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShub2RlLmNhbGxzKSkge1xuICAgICAgICBpc3N1ZXMucHVzaChgTm9kZSBcIiR7aWR9XCIgY2FsbHMgbXVzdCBiZSBhbiBhcnJheSB3aGVuIHByZXNlbnQuYCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGNvbnN0IGNhbGwgb2Ygbm9kZS5jYWxscykge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiBjYWxsICE9PSAnb2JqZWN0JyB8fFxuICAgICAgICAgICAgY2FsbCA9PT0gbnVsbCB8fFxuICAgICAgICAgICAgdHlwZW9mIGNhbGwudG8gIT09ICdzdHJpbmcnIHx8XG4gICAgICAgICAgICB0eXBlb2YgY2FsbC5sYWJlbCAhPT0gJ3N0cmluZycgfHxcbiAgICAgICAgICAgICFDRkdfU1RBVFVTRVMuaW5jbHVkZXMoU3RyaW5nKGNhbGwuc3RhdHVzKSlcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGlzc3Vlcy5wdXNoKGBOb2RlIFwiJHtpZH1cIiBoYXMgYW4gaW52YWxpZCBjYWxsIHRhcmdldC5gKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKGVudHJ5SWRzLmxlbmd0aCAhPT0gMSkge1xuICAgIGlzc3Vlcy5wdXNoKGBBIENGRyBuZWVkcyBleGFjdGx5IG9uZSBlbnRyeSBub2RlOyBmb3VuZCAke2VudHJ5SWRzLmxlbmd0aH0uYCk7XG4gIH1cbiAgaWYgKGV4aXRJZHMubGVuZ3RoICE9PSAxKSB7XG4gICAgaXNzdWVzLnB1c2goYEEgQ0ZHIG5lZWRzIGV4YWN0bHkgb25lIGV4aXQgbm9kZTsgZm91bmQgJHtleGl0SWRzLmxlbmd0aH0uYCk7XG4gIH1cbiAgaWYgKGNhbmRpZGF0ZS5lbnRyeUlkICE9PSBlbnRyeUlkc1swXSkge1xuICAgIGlzc3Vlcy5wdXNoKCdlbnRyeUlkIG11c3QgcmVmZXJlbmNlIHRoZSBlbnRyeSBub2RlLicpO1xuICB9XG4gIGlmIChjYW5kaWRhdGUuZXhpdElkICE9PSBleGl0SWRzWzBdKSB7XG4gICAgaXNzdWVzLnB1c2goJ2V4aXRJZCBtdXN0IHJlZmVyZW5jZSB0aGUgZXhpdCBub2RlLicpO1xuICB9XG5cbiAgY29uc3QgZWRnZUlkcyA9IG5ldyBTZXQoKTtcbiAgZm9yIChjb25zdCBlbnRyeSBvZiBlZGdlcykge1xuICAgIGlmICh0eXBlb2YgZW50cnkgIT09ICdvYmplY3QnIHx8IGVudHJ5ID09PSBudWxsIHx8IEFycmF5LmlzQXJyYXkoZW50cnkpKSB7XG4gICAgICBpc3N1ZXMucHVzaCgnRXZlcnkgZWRnZSBtdXN0IGJlIGFuIG9iamVjdC4nKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBlZGdlID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKGVudHJ5KTtcbiAgICBjb25zdCBpZCA9IGVkZ2UuaWQ7XG4gICAgaWYgKHR5cGVvZiBpZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKCdFdmVyeSBlZGdlIG5lZWRzIGEgc3RyaW5nIGlkLicpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChlZGdlSWRzLmhhcyhpZCkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBEdXBsaWNhdGUgZWRnZSBpZCBcIiR7aWR9XCIuYCk7XG4gICAgfVxuICAgIGVkZ2VJZHMuYWRkKGlkKTtcbiAgICBpZiAodHlwZW9mIGVkZ2UuZnJvbSAhPT0gJ3N0cmluZycgfHwgIWlkcy5oYXMoZWRnZS5mcm9tKSkge1xuICAgICAgaXNzdWVzLnB1c2goYEVkZ2UgXCIke2lkfVwiIGhhcyBhbiB1bmtub3duIHNvdXJjZSBub2RlLmApO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGVkZ2UudG8gIT09ICdzdHJpbmcnIHx8ICFpZHMuaGFzKGVkZ2UudG8pKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7aWR9XCIgaGFzIGFuIHVua25vd24gdGFyZ2V0IG5vZGUuYCk7XG4gICAgfVxuICAgIGlmICghQ0ZHX0VER0VfS0lORFMuaW5jbHVkZXMoU3RyaW5nKGVkZ2Uua2luZCkpKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7aWR9XCIgaGFzIHVua25vd24ga2luZCBcIiR7U3RyaW5nKGVkZ2Uua2luZCl9XCIuYCk7XG4gICAgfVxuICAgIGlmICghQ0ZHX1NUQVRVU0VTLmluY2x1ZGVzKFN0cmluZyhlZGdlLnN0YXR1cykpKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7aWR9XCIgaGFzIHVua25vd24gc3RhdHVzIFwiJHtTdHJpbmcoZWRnZS5zdGF0dXMpfVwiLmApO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGVkZ2UubGFiZWwgIT09ICdzdHJpbmcnKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7aWR9XCIgbmVlZHMgYSBzdHJpbmcgbGFiZWwuYCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgZWRnZS5kYXNoICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgZWRnZS5nbHlwaEhpbnQgIT09ICdzdHJpbmcnKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7aWR9XCIgbmVlZHMgc3RyaW5nIGRhc2ggYW5kIGdseXBoSGludCBmaWVsZHMuYCk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgZGVncmFkYXRpb25zID0gY2FuZGlkYXRlLmRlZ3JhZGF0aW9ucztcbiAgaWYgKCFBcnJheS5pc0FycmF5KGRlZ3JhZGF0aW9ucykpIHtcbiAgICBpc3N1ZXMucHVzaCgnZGVncmFkYXRpb25zIG11c3QgYmUgYW4gYXJyYXkuJyk7XG4gIH0gZWxzZSB7XG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBkZWdyYWRhdGlvbnMpIHtcbiAgICAgIGlmIChcbiAgICAgICAgdHlwZW9mIGVudHJ5ICE9PSAnb2JqZWN0JyB8fFxuICAgICAgICBlbnRyeSA9PT0gbnVsbCB8fFxuICAgICAgICB0eXBlb2YgZW50cnkuY29kZSAhPT0gJ3N0cmluZycgfHxcbiAgICAgICAgdHlwZW9mIGVudHJ5Lm1lc3NhZ2UgIT09ICdzdHJpbmcnIHx8XG4gICAgICAgICFbJ2luZm8nLCAnd2FybmluZycsICdlcnJvciddLmluY2x1ZGVzKFN0cmluZyhlbnRyeS5zZXZlcml0eSkpXG4gICAgICApIHtcbiAgICAgICAgaXNzdWVzLnB1c2goJ0V2ZXJ5IGRlZ3JhZGF0aW9uIG5lZWRzIGEgY29kZSwgbWVzc2FnZSBhbmQgc2V2ZXJpdHkuJyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3QgZXh0ZW50ID0gY2FuZGlkYXRlLmV4dGVudDtcbiAgaWYgKFxuICAgIHR5cGVvZiBleHRlbnQgIT09ICdvYmplY3QnIHx8XG4gICAgZXh0ZW50ID09PSBudWxsIHx8XG4gICAgIU51bWJlci5pc0Zpbml0ZShleHRlbnQud2lkdGgpIHx8XG4gICAgIU51bWJlci5pc0Zpbml0ZShleHRlbnQuaGVpZ2h0KVxuICApIHtcbiAgICBpc3N1ZXMucHVzaCgnZXh0ZW50IG11c3QgY2FycnkgZmluaXRlIHdpZHRoIGFuZCBoZWlnaHQuJyk7XG4gIH1cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSBhIFBoYXNlIDcgQ2FsbCBHcmFwaCBEVE8uXG4gKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gY2FuZGlkYXRlXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBpc3N1ZXNcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVDYWxsR3JhcGhEdG8oY2FuZGlkYXRlLCBpc3N1ZXMpIHtcbiAgaWYgKGNhbmRpZGF0ZS5ncmFwaEtpbmQgIT09ICdjYWxsX2dyYXBoJykge1xuICAgIGlzc3Vlcy5wdXNoKCdBIENhbGwgR3JhcGggRFRPIG11c3QgZGVjbGFyZSBncmFwaEtpbmQgXCJjYWxsX2dyYXBoXCIuJyk7XG4gIH1cbiAgaWYgKHR5cGVvZiBjYW5kaWRhdGUuY2VudGVyU3ltYm9sSWQgIT09ICdzdHJpbmcnIHx8IGNhbmRpZGF0ZS5jZW50ZXJTeW1ib2xJZC5sZW5ndGggPT09IDApIHtcbiAgICBpc3N1ZXMucHVzaCgnY2VudGVyU3ltYm9sSWQgbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcuJyk7XG4gIH1cbiAgaWYgKCFDQUxMX1NDT1BFUy5pbmNsdWRlcyhTdHJpbmcoY2FuZGlkYXRlLnNjb3BlKSkpIHtcbiAgICBpc3N1ZXMucHVzaChgc2NvcGUgbXVzdCBiZSBvbmUgb2YgJHtDQUxMX1NDT1BFUy5qb2luKCcsICcpfS5gKTtcbiAgfVxuICBpZiAodHlwZW9mIGNhbmRpZGF0ZS5zY29wZUJhbm5lciAhPT0gJ3N0cmluZycgfHwgY2FuZGlkYXRlLnNjb3BlQmFubmVyLmxlbmd0aCA9PT0gMCkge1xuICAgIGlzc3Vlcy5wdXNoKCdzY29wZUJhbm5lciBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZy4nKTtcbiAgfVxuXG4gIGNvbnN0IG5vZGVzID0gY2FuZGlkYXRlLm5vZGVzO1xuICBjb25zdCBlZGdlcyA9IGNhbmRpZGF0ZS5lZGdlcztcbiAgaWYgKCFBcnJheS5pc0FycmF5KG5vZGVzKSkge1xuICAgIGlzc3Vlcy5wdXNoKCdub2RlcyBtdXN0IGJlIGFuIGFycmF5LicpO1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoIUFycmF5LmlzQXJyYXkoZWRnZXMpKSB7XG4gICAgaXNzdWVzLnB1c2goJ2VkZ2VzIG11c3QgYmUgYW4gYXJyYXkuJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgaWRzID0gbmV3IFNldCgpO1xuICBmb3IgKGNvbnN0IGVudHJ5IG9mIG5vZGVzKSB7XG4gICAgaWYgKHR5cGVvZiBlbnRyeSAhPT0gJ29iamVjdCcgfHwgZW50cnkgPT09IG51bGwgfHwgQXJyYXkuaXNBcnJheShlbnRyeSkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKCdFdmVyeSBub2RlIG11c3QgYmUgYW4gb2JqZWN0LicpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IG5vZGUgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAoZW50cnkpO1xuICAgIGNvbnN0IGlkID0gbm9kZS5pZDtcbiAgICBpZiAodHlwZW9mIGlkICE9PSAnc3RyaW5nJykge1xuICAgICAgaXNzdWVzLnB1c2goJ0V2ZXJ5IG5vZGUgbmVlZHMgYSBzdHJpbmcgaWQuJyk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGlkcy5oYXMoaWQpKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRHVwbGljYXRlIG5vZGUgaWQgXCIke2lkfVwiLmApO1xuICAgIH1cbiAgICBpZHMuYWRkKGlkKTtcbiAgICBpZiAoIUNBTExfTk9ERV9LSU5EUy5pbmNsdWRlcyhTdHJpbmcobm9kZS5raW5kKSkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBOb2RlIFwiJHtpZH1cIiBoYXMgdW5rbm93biBjYWxsLWdyYXBoIGtpbmQgXCIke1N0cmluZyhub2RlLmtpbmQpfVwiLmApO1xuICAgIH1cbiAgICBpZiAoIUNGR19TVEFUVVNFUy5pbmNsdWRlcyhTdHJpbmcobm9kZS5zdGF0dXMpKSkge1xuICAgICAgaXNzdWVzLnB1c2goYE5vZGUgXCIke2lkfVwiIGhhcyB1bmtub3duIHN0YXR1cyBcIiR7U3RyaW5nKG5vZGUuc3RhdHVzKX1cIi5gKTtcbiAgICB9XG4gICAgaWYgKCFpc1Bvc2l0aW9uKG5vZGUucG9zaXRpb24pKSB7XG4gICAgICBpc3N1ZXMucHVzaChgTm9kZSBcIiR7aWR9XCIgaGFzIGFuIGludmFsaWQgcG9zaXRpb24uYCk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgZWRnZUlkcyA9IG5ldyBTZXQoKTtcbiAgZm9yIChjb25zdCBlbnRyeSBvZiBlZGdlcykge1xuICAgIGlmICh0eXBlb2YgZW50cnkgIT09ICdvYmplY3QnIHx8IGVudHJ5ID09PSBudWxsIHx8IEFycmF5LmlzQXJyYXkoZW50cnkpKSB7XG4gICAgICBpc3N1ZXMucHVzaCgnRXZlcnkgZWRnZSBtdXN0IGJlIGFuIG9iamVjdC4nKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBlZGdlID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKGVudHJ5KTtcbiAgICBjb25zdCBpZCA9IGVkZ2UuaWQ7XG4gICAgaWYgKHR5cGVvZiBpZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKCdFdmVyeSBlZGdlIG5lZWRzIGEgc3RyaW5nIGlkLicpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChlZGdlSWRzLmhhcyhpZCkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBEdXBsaWNhdGUgZWRnZSBpZCBcIiR7aWR9XCIuYCk7XG4gICAgfVxuICAgIGVkZ2VJZHMuYWRkKGlkKTtcbiAgICBpZiAodHlwZW9mIGVkZ2UuZnJvbSAhPT0gJ3N0cmluZycgfHwgIWlkcy5oYXMoZWRnZS5mcm9tKSkge1xuICAgICAgaXNzdWVzLnB1c2goYEVkZ2UgXCIke2lkfVwiIGhhcyBhbiB1bmtub3duIHNvdXJjZSBub2RlLmApO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGVkZ2UudG8gIT09ICdzdHJpbmcnIHx8ICFpZHMuaGFzKGVkZ2UudG8pKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7aWR9XCIgaGFzIGFuIHVua25vd24gdGFyZ2V0IG5vZGUuYCk7XG4gICAgfVxuICAgIGlmICghQ0FMTF9SRUxBVElPTlNISVBfVFlQRVMuaW5jbHVkZXMoU3RyaW5nKGVkZ2UudHlwZSkpKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7aWR9XCIgaGFzIHVua25vd24gdHlwZSBcIiR7U3RyaW5nKGVkZ2UudHlwZSl9XCIuYCk7XG4gICAgfVxuICAgIGlmICghQ0ZHX1NUQVRVU0VTLmluY2x1ZGVzKFN0cmluZyhlZGdlLnN0YXR1cykpKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7aWR9XCIgaGFzIHVua25vd24gc3RhdHVzIFwiJHtTdHJpbmcoZWRnZS5zdGF0dXMpfVwiLmApO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGVkZ2UuZGFzaCAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGVkZ2UuZ2x5cGhIaW50ICE9PSAnc3RyaW5nJykge1xuICAgICAgaXNzdWVzLnB1c2goYEVkZ2UgXCIke2lkfVwiIG5lZWRzIHN0cmluZyBkYXNoIGFuZCBnbHlwaEhpbnQgZmllbGRzLmApO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBpc1JhbmdlUmVmKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnIHx8IHZhbHVlID09PSBudWxsIHx8IEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IHJhbmdlID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKHZhbHVlKTtcbiAgcmV0dXJuIChcbiAgICB0eXBlb2YgcmFuZ2UuZmlsZUlkID09PSAnc3RyaW5nJyAmJlxuICAgIE51bWJlci5pc0ludGVnZXIocmFuZ2Uuc3RhcnRMaW5lKSAmJlxuICAgIE51bWJlci5pc0ludGVnZXIocmFuZ2Uuc3RhcnRDb2x1bW4pICYmXG4gICAgTnVtYmVyLmlzSW50ZWdlcihyYW5nZS5lbmRMaW5lKSAmJlxuICAgIE51bWJlci5pc0ludGVnZXIocmFuZ2UuZW5kQ29sdW1uKSAmJlxuICAgIHJhbmdlLnN0YXJ0TGluZSA+PSAwICYmXG4gICAgcmFuZ2Uuc3RhcnRDb2x1bW4gPj0gMCAmJlxuICAgIHJhbmdlLmVuZExpbmUgPj0gMCAmJlxuICAgIHJhbmdlLmVuZENvbHVtbiA+PSAwXG4gICk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gY2FuZGlkYXRlXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBpc3N1ZXNcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVTZW1hbnRpY1pvb21EdG8oY2FuZGlkYXRlLCBpc3N1ZXMpIHtcbiAgaWYgKHR5cGVvZiBjYW5kaWRhdGUubGV2ZWwgIT09ICdzdHJpbmcnIHx8ICFMRVZFTF9PUkRFUi5pbmNsdWRlcyhjYW5kaWRhdGUubGV2ZWwpKSB7XG4gICAgaXNzdWVzLnB1c2goYEludmFsaWQgc2VtYW50aWMgem9vbSBsZXZlbDogJHtTdHJpbmcoY2FuZGlkYXRlLmxldmVsKX0uYCk7XG4gIH1cbiAgaWYgKHR5cGVvZiBjYW5kaWRhdGUuc2NvcGVJZCAhPT0gJ3N0cmluZycgfHwgY2FuZGlkYXRlLnNjb3BlSWQubGVuZ3RoID09PSAwKSB7XG4gICAgaXNzdWVzLnB1c2goJ1NlbWFudGljIHpvb20gRFRPIHJlcXVpcmVzIGEgbm9uLWVtcHR5IHNjb3BlSWQuJyk7XG4gIH1cbiAgaWYgKCFBcnJheS5pc0FycmF5KGNhbmRpZGF0ZS5icmVhZGNydW1icykgfHwgY2FuZGlkYXRlLmJyZWFkY3J1bWJzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlzc3Vlcy5wdXNoKCdTZW1hbnRpYyB6b29tIERUTyByZXF1aXJlcyBhIG5vbi1lbXB0eSBicmVhZGNydW1icyBhcnJheS4nKTtcbiAgfVxuICBpZiAoIUFycmF5LmlzQXJyYXkoY2FuZGlkYXRlLm5vZGVzKSkge1xuICAgIGlzc3Vlcy5wdXNoKCdTZW1hbnRpYyB6b29tIERUTyByZXF1aXJlcyBhIG5vZGVzIGFycmF5LicpO1xuICB9XG4gIGlmICghQXJyYXkuaXNBcnJheShjYW5kaWRhdGUuZWRnZXMpKSB7XG4gICAgaXNzdWVzLnB1c2goJ1NlbWFudGljIHpvb20gRFRPIHJlcXVpcmVzIGFuIGVkZ2VzIGFycmF5LicpO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGlzUG9zaXRpb24odmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcgfHwgdmFsdWUgPT09IG51bGwgfHwgQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgcG9zaXRpb24gPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAodmFsdWUpO1xuICByZXR1cm4gKFxuICAgIE51bWJlci5pc0Zpbml0ZShwb3NpdGlvbi54KSAmJlxuICAgIE51bWJlci5pc0Zpbml0ZShwb3NpdGlvbi55KSAmJlxuICAgIE51bWJlci5pc0Zpbml0ZShwb3NpdGlvbi53aWR0aCkgJiZcbiAgICBOdW1iZXIuaXNGaW5pdGUocG9zaXRpb24uaGVpZ2h0KSAmJlxuICAgIE51bWJlci5pc0ludGVnZXIocG9zaXRpb24ubGF5ZXIpXG4gICk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtHcmFwaER0b30gZHRvXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplRHRvKGR0bykge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoZHRvKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30ganNvblxuICogQHJldHVybnMge0dyYXBoRHRvfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VEdG8oanNvbikge1xuICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGpzb24pO1xuICBjb25zdCB2YWxpZGF0aW9uID0gdmFsaWRhdGVEdG8ocGFyc2VkKTtcbiAgaWYgKCF2YWxpZGF0aW9uLm9rKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGdyYXBoIERUTzogJHt2YWxpZGF0aW9uLmlzc3Vlcy5qb2luKCc7ICcpfWApO1xuICB9XG4gIHJldHVybiB2YWxpZGF0aW9uLmR0bztcbn1cbiIsICIvKipcbiAqIFNWRyByZW5kZXJlci5cbiAqXG4gKiBQaGFzZSAwIHJlbmRlcmVyOiBkZXRlcm1pbmlzdGljIGxheWVyZWQgcG9zaXRpb25zIGNvbWUgZnJvbSB0aGUgRFRPLCBzbyB0aGlzXG4gKiBtb2R1bGUgb25seSBkcmF3cy4gSXQgaGFzIG5vIGtub3dsZWRnZSBvZiBhbmFseXNpcywgYWRhcHRlcnMsIG9yIHRoZSBwcm90b2NvbC5cbiAqXG4gKiBLZXB0IGJlaGluZCBhIHNtYWxsIGludGVyZmFjZSAoYHJlbmRlcmAsIGBzZWxlY3RgLCBgZGVzdHJveWApIGJlY2F1c2UgUGhhc2UgNFxuICogYmVuY2htYXJrcyBDeXRvc2NhcGUvRUxLIGFuZCBtYXkgcmVwbGFjZSB0aGUgaW1wbGVtZW50YXRpb24uIENhbGxlcnMgbXVzdCBub3RcbiAqIGRlcGVuZCBvbiBTVkcgaW50ZXJuYWxzLlxuICovXG5cbmNvbnN0IFNWR19OUyA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG5cbi8qKlxuICogQHR5cGVkZWYge2ltcG9ydCgnLi4vLi4vY29yZS9ncmFwaC9kdG8uanMnKS5HcmFwaER0b30gR3JhcGhEdG9cbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4uLy4uL2NvcmUvZ3JhcGgvZHRvLmpzJykuRHRvTm9kZX0gRHRvTm9kZVxuICovXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgc3RyaW5nIHwgbnVtYmVyPn0gW2F0dHJpYnV0ZXNdXG4gKiBAcmV0dXJucyB7U1ZHRWxlbWVudH1cbiAqL1xuZnVuY3Rpb24gc3ZnRWwobmFtZSwgYXR0cmlidXRlcyA9IHt9KSB7XG4gIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoU1ZHX05TLCBuYW1lKTtcbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoYXR0cmlidXRlcykpIHtcbiAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShrZXksIFN0cmluZyh2YWx1ZSkpO1xuICB9XG4gIHJldHVybiBlbGVtZW50O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICogQHBhcmFtIHtudW1iZXJ9IG1heFxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gdHJ1bmNhdGUodmFsdWUsIG1heCkge1xuICBjb25zdCB0ZXh0ID0gU3RyaW5nKHZhbHVlID8/ICcnKTtcbiAgcmV0dXJuIHRleHQubGVuZ3RoID4gbWF4ID8gYCR7dGV4dC5zbGljZSgwLCBtYXggLSAxKX1cdTIwMjZgIDogdGV4dDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3tcbiAqICAgc3ZnOiBTVkdTVkdFbGVtZW50LFxuICogICBvblNlbGVjdDogKG5vZGVJZDogc3RyaW5nLCBub2RlOiBEdG9Ob2RlKSA9PiB2b2lkLFxuICogICBvbk5hdmlnYXRlPzogKG5vZGVJZDogc3RyaW5nLCBub2RlOiBEdG9Ob2RlLCB0cmlnZ2VyPzogJ3BvaW50ZXInfCdrZXlib2FyZCcpID0+IHZvaWQsXG4gKiAgIG9uUHJldmlld0VudGVyPzogKG5vZGVJZDogc3RyaW5nLCBub2RlOiBEdG9Ob2RlLCBwb2ludDoge3g6IG51bWJlciwgeTogbnVtYmVyfSkgPT4gdm9pZCxcbiAqICAgb25QcmV2aWV3TW92ZT86IChwb2ludDoge3g6IG51bWJlciwgeTogbnVtYmVyfSkgPT4gdm9pZCxcbiAqICAgb25QcmV2aWV3TGVhdmU/OiAobm9kZUlkOiBzdHJpbmcpID0+IHZvaWQsXG4gKiAgIG9uUHJldmlld0tleT86IChub2RlSWQ6IHN0cmluZywgbm9kZTogRHRvTm9kZSkgPT4gdm9pZCxcbiAqIH19IG9wdGlvbnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVN2Z1JlbmRlcmVyKG9wdGlvbnMpIHtcbiAgY29uc3QgeyBzdmcsIG9uU2VsZWN0IH0gPSBvcHRpb25zO1xuICAvKiogQHR5cGUge0dyYXBoRHRvIHwgbnVsbH0gKi9cbiAgbGV0IGR0byA9IG51bGw7XG4gIC8qKiBAdHlwZSB7U1ZHR0VsZW1lbnQgfCBudWxsfSAqL1xuICBsZXQgdmlld3BvcnQgPSBudWxsO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIFNWR0dFbGVtZW50Pn0gKi9cbiAgY29uc3Qgbm9kZUVsZW1lbnRzID0gbmV3IE1hcCgpO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIFNWR1BhdGhFbGVtZW50Pn0gKi9cbiAgY29uc3QgZWRnZUVsZW1lbnRzID0gbmV3IE1hcCgpO1xuICAvKiogQHR5cGUge3N0cmluZyB8IG51bGx9ICovXG4gIGxldCBzZWxlY3RlZElkID0gbnVsbDtcblxuICBsZXQgc2NhbGUgPSAxO1xuICBsZXQgdHJhbnNsYXRlWCA9IDA7XG4gIGxldCB0cmFuc2xhdGVZID0gMDtcbiAgbGV0IGRyYWdnaW5nID0gZmFsc2U7XG4gIGxldCBkcmFnU3RhcnQgPSB7IHg6IDAsIHk6IDAsIHR4OiAwLCB0eTogMCB9O1xuXG4gIGZ1bmN0aW9uIGFwcGx5VHJhbnNmb3JtKCkge1xuICAgIGlmICh2aWV3cG9ydCkge1xuICAgICAgdmlld3BvcnQuc2V0QXR0cmlidXRlKFxuICAgICAgICAndHJhbnNmb3JtJyxcbiAgICAgICAgYHRyYW5zbGF0ZSgke3RyYW5zbGF0ZVgudG9GaXhlZCgyKX0gJHt0cmFuc2xhdGVZLnRvRml4ZWQoMil9KSBzY2FsZSgke3NjYWxlLnRvRml4ZWQoMyl9KWAsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG5vZGVQb2ludChub2RlLCBzaWRlKSB7XG4gICAgaWYgKHNpZGUgPT09ICdvdXQnKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB4OiBub2RlLnBvc2l0aW9uLnggKyBub2RlLnBvc2l0aW9uLndpZHRoLFxuICAgICAgICB5OiBub2RlLnBvc2l0aW9uLnkgKyBub2RlLnBvc2l0aW9uLmhlaWdodCAvIDIsXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4geyB4OiBub2RlLnBvc2l0aW9uLngsIHk6IG5vZGUucG9zaXRpb24ueSArIG5vZGUucG9zaXRpb24uaGVpZ2h0IC8gMiB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZWRnZVBhdGgoc291cmNlLCB0YXJnZXQpIHtcbiAgICBpZiAoc291cmNlLmlkID09PSB0YXJnZXQuaWQpIHtcbiAgICAgIGNvbnN0IHsgeCwgeSwgd2lkdGgsIGhlaWdodCB9ID0gc291cmNlLnBvc2l0aW9uO1xuICAgICAgY29uc3QgY3ggPSB4ICsgd2lkdGggLyAyO1xuICAgICAgY29uc3Qgc3RhcnRZID0geSAtIDI7XG4gICAgICByZXR1cm4gYE0gJHtjeH0gJHtzdGFydFl9IEMgJHtjeCAtIDQ2fSAke3kgLSA2MH0sICR7Y3ggKyA0Nn0gJHt5IC0gNjB9LCAke2N4fSAke3kgKyBoZWlnaHQgKyAyfWA7XG4gICAgfVxuICAgIGNvbnN0IGZyb20gPSBub2RlUG9pbnQoc291cmNlLCAnb3V0Jyk7XG4gICAgY29uc3QgdG8gPSBub2RlUG9pbnQodGFyZ2V0LCAnaW4nKTtcbiAgICBjb25zdCBiZW5kID0gTWF0aC5tYXgoMzYsIE1hdGguYWJzKHRvLnggLSBmcm9tLngpIC8gMik7XG4gICAgcmV0dXJuIGBNICR7ZnJvbS54fSAke2Zyb20ueX0gQyAke2Zyb20ueCArIGJlbmR9ICR7ZnJvbS55fSwgJHt0by54IC0gYmVuZH0gJHt0by55fSwgJHt0by54fSAke3RvLnl9YDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIGlmICh2aWV3cG9ydCkge1xuICAgICAgc3ZnLnJlbW92ZUNoaWxkKHZpZXdwb3J0KTtcbiAgICB9XG4gICAgdmlld3BvcnQgPSBzdmdFbCgnZycsIHsgY2xhc3M6ICdjZi12aWV3cG9ydCcgfSk7XG4gICAgc3ZnLmFwcGVuZENoaWxkKHZpZXdwb3J0KTtcbiAgICBub2RlRWxlbWVudHMuY2xlYXIoKTtcbiAgICBlZGdlRWxlbWVudHMuY2xlYXIoKTtcbiAgICBzZWxlY3RlZElkID0gbnVsbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbGVjdChub2RlSWQpIHtcbiAgICBzZWxlY3RlZElkID0gbm9kZUlkO1xuICAgIGZvciAoY29uc3QgW2lkLCBlbGVtZW50XSBvZiBub2RlRWxlbWVudHMpIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZSgnaXMtc2VsZWN0ZWQnLCBpZCA9PT0gbm9kZUlkKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBbLCBlbGVtZW50XSBvZiBlZGdlRWxlbWVudHMpIHtcbiAgICAgIGNvbnN0IGFjdGl2ZSA9XG4gICAgICAgIG5vZGVJZCAhPT0gbnVsbCAmJiAoZWxlbWVudC5kYXRhc2V0LmZyb20gPT09IG5vZGVJZCB8fCBlbGVtZW50LmRhdGFzZXQudG8gPT09IG5vZGVJZCk7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoJ2lzLWFjdGl2ZScsIGFjdGl2ZSk7XG4gICAgfVxuICAgIGlmIChzZWxlY3RlZElkICYmIG5vZGVFbGVtZW50cy5oYXMoc2VsZWN0ZWRJZCkpIHtcbiAgICAgIGNvbnN0IG5vZGUgPSAvKiogQHR5cGUge0R0b05vZGV9ICovIChkdG8/Lm5vZGVzLmZpbmQoKGl0ZW0pID0+IGl0ZW0uaWQgPT09IHNlbGVjdGVkSWQpKTtcbiAgICAgIG9uU2VsZWN0KHNlbGVjdGVkSWQsIG5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHpvb21Ub0ZpdCgpIHtcbiAgICBpZiAoIWR0byB8fCAhdmlld3BvcnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgYm91bmRzID0gc3ZnLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IHBhZGRpbmcgPSA0ODtcbiAgICBjb25zdCB3aWR0aCA9IE1hdGgubWF4KDEsIGR0by5leHRlbnQud2lkdGgpO1xuICAgIGNvbnN0IGhlaWdodCA9IE1hdGgubWF4KDEsIGR0by5leHRlbnQuaGVpZ2h0KTtcbiAgICBjb25zdCBhdmFpbGFibGVXaWR0aCA9IE1hdGgubWF4KDEyMCwgYm91bmRzLndpZHRoIC0gcGFkZGluZyAqIDIpO1xuICAgIGNvbnN0IGF2YWlsYWJsZUhlaWdodCA9IE1hdGgubWF4KDEyMCwgYm91bmRzLmhlaWdodCAtIHBhZGRpbmcgKiAyKTtcbiAgICBzY2FsZSA9IE1hdGgubWluKDEuNCwgYXZhaWxhYmxlV2lkdGggLyB3aWR0aCwgYXZhaWxhYmxlSGVpZ2h0IC8gaGVpZ2h0KTtcbiAgICBzY2FsZSA9IE1hdGgubWF4KDAuMTUsIHNjYWxlKTtcbiAgICB0cmFuc2xhdGVYID0gKGJvdW5kcy53aWR0aCAtIHdpZHRoICogc2NhbGUpIC8gMjtcbiAgICB0cmFuc2xhdGVZID0gKGJvdW5kcy5oZWlnaHQgLSBoZWlnaHQgKiBzY2FsZSkgLyAyO1xuICAgIGFwcGx5VHJhbnNmb3JtKCk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtHcmFwaER0b30gbmV4dER0b1xuICAgKi9cbiAgZnVuY3Rpb24gcmVuZGVyKG5leHREdG8pIHtcbiAgICBkdG8gPSBuZXh0RHRvO1xuICAgIGNsZWFyKCk7XG4gICAgaWYgKCF2aWV3cG9ydCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGJ5SWQgPSBuZXcgTWFwKGR0by5ub2Rlcy5tYXAoKG5vZGUpID0+IFtub2RlLmlkLCBub2RlXSkpO1xuXG4gICAgZm9yIChjb25zdCBlZGdlIG9mIGR0by5lZGdlcykge1xuICAgICAgY29uc3Qgc291cmNlID0gYnlJZC5nZXQoZWRnZS5mcm9tKTtcbiAgICAgIGNvbnN0IHRhcmdldCA9IGJ5SWQuZ2V0KGVkZ2UudG8pO1xuICAgICAgaWYgKCFzb3VyY2UgfHwgIXRhcmdldCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhdGggPSAvKiogQHR5cGUge1NWR1BhdGhFbGVtZW50fSAqLyAoXG4gICAgICAgIHN2Z0VsKCdwYXRoJywge1xuICAgICAgICAgIGNsYXNzOiBgY2YtZWRnZSBjZi1lZGdlLS0ke2VkZ2Uuc3RhdHVzfSBjZi1lZGdlLS1raW5kLSR7ZWRnZS5raW5kID8/IGVkZ2UudHlwZX0ke1xuICAgICAgICAgICAgZWRnZS5pc0N5Y2xlID8gJyBjZi1lZGdlLS1jeWNsZScgOiAnJ1xuICAgICAgICAgIH0ke2VkZ2UuZGltbWVkID8gJyBpcy1kaW1tZWQnIDogJyd9YCxcbiAgICAgICAgICBkOiBlZGdlUGF0aChzb3VyY2UsIHRhcmdldCksXG4gICAgICAgICAgJ2RhdGEtZnJvbSc6IGVkZ2UuZnJvbSxcbiAgICAgICAgICAnZGF0YS10byc6IGVkZ2UudG8sXG4gICAgICAgICAgLi4uKGVkZ2UuZGFzaCA/IHsgJ3N0cm9rZS1kYXNoYXJyYXknOiBlZGdlLmRhc2ggfSA6IHt9KSxcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgICBwYXRoLmRhdGFzZXQuZnJvbSA9IGVkZ2UuZnJvbTtcbiAgICAgIHBhdGguZGF0YXNldC50byA9IGVkZ2UudG87XG4gICAgICBjb25zdCB0aXRsZSA9IHN2Z0VsKCd0aXRsZScpO1xuICAgICAgdGl0bGUudGV4dENvbnRlbnQgPSBgJHtlZGdlLmtpbmQgPz8gZWRnZS50eXBlfSAoJHtlZGdlLnN0YXR1c30pJHtcbiAgICAgICAgZWRnZS5yZWFzb25Db2RlID8gYDogJHtlZGdlLnJlYXNvbkNvZGV9YCA6ICcnXG4gICAgICB9JHtlZGdlLmdseXBoSGludCA/IGAgJHtlZGdlLmdseXBoSGludH1gIDogJyd9YDtcbiAgICAgIHBhdGguYXBwZW5kQ2hpbGQodGl0bGUpO1xuICAgICAgdmlld3BvcnQuYXBwZW5kQ2hpbGQocGF0aCk7XG4gICAgICBlZGdlRWxlbWVudHMuc2V0KGVkZ2UuaWQsIHBhdGgpO1xuXG4gICAgICBpZiAoZWRnZS5sYWJlbCAmJiBlZGdlLmxhYmVsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgZnJvbSA9IG5vZGVQb2ludChzb3VyY2UsICdvdXQnKTtcbiAgICAgICAgY29uc3QgdG8gPSBub2RlUG9pbnQodGFyZ2V0LCAnaW4nKTtcbiAgICAgICAgY29uc3QgbGFiZWwgPSBzdmdFbCgndGV4dCcsIHtcbiAgICAgICAgICBjbGFzczogJ2NmLWVkZ2UtbGFiZWwnLFxuICAgICAgICAgIHg6IChmcm9tLnggKyB0by54KSAvIDIsXG4gICAgICAgICAgeTogKGZyb20ueSArIHRvLnkpIC8gMiAtIDQsXG4gICAgICAgICAgJ3RleHQtYW5jaG9yJzogJ21pZGRsZScsXG4gICAgICAgIH0pO1xuICAgICAgICBsYWJlbC50ZXh0Q29udGVudCA9IHRydW5jYXRlKGVkZ2UubGFiZWwsIDIyKTtcbiAgICAgICAgdmlld3BvcnQuYXBwZW5kQ2hpbGQobGFiZWwpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3Qgbm9kZSBvZiBkdG8ubm9kZXMpIHtcbiAgICAgIGNvbnN0IGdyb3VwID0gLyoqIEB0eXBlIHtTVkdHRWxlbWVudH0gKi8gKFxuICAgICAgICBzdmdFbCgnZycsIHtcbiAgICAgICAgICBjbGFzczogYGNmLW5vZGUgY2Ytbm9kZS0tJHtub2RlLnN0YXR1c30gY2Ytbm9kZS0ta2luZC0ke25vZGUua2luZH0ke1xuICAgICAgICAgICAgbm9kZS5leHRlcm5hbCA/ICcgY2Ytbm9kZS0tZXh0ZXJuYWwnIDogJydcbiAgICAgICAgICB9JHtub2RlLnVucmVhY2hhYmxlID8gJyBjZi1ub2RlLS11bnJlYWNoYWJsZScgOiAnJ30ke1xuICAgICAgICAgICAgbm9kZS5pc0NlbnRlciA/ICcgY2Ytbm9kZS0tY2VudGVyJyA6ICcnXG4gICAgICAgICAgfSR7bm9kZS5pc0N5Y2xpYyA/ICcgY2Ytbm9kZS0tY3ljbGljJyA6ICcnfSR7bm9kZS5kaW1tZWQgPyAnIGlzLWRpbW1lZCcgOiAnJ31gLFxuICAgICAgICAgIHRyYW5zZm9ybTogYHRyYW5zbGF0ZSgke25vZGUucG9zaXRpb24ueH0gJHtub2RlLnBvc2l0aW9uLnl9KWAsXG4gICAgICAgICAgdGFiaW5kZXg6ICcwJyxcbiAgICAgICAgICByb2xlOiAnYnV0dG9uJyxcbiAgICAgICAgICAnYXJpYS1sYWJlbCc6IGAke25vZGUua2luZH0gJHtub2RlLmxhYmVsfSwgJHtub2RlLnN0YXR1c30ke1xuICAgICAgICAgICAgbm9kZS51bnJlYWNoYWJsZSA/ICcsIHVucmVhY2hhYmxlJyA6ICcnXG4gICAgICAgICAgfSR7bm9kZS5leHRlcm5hbCA/ICcsIGV4dGVybmFsIHRhcmdldCcgOiAnJ31gLFxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgZ3JvdXAuYXBwZW5kQ2hpbGQoXG4gICAgICAgIHN2Z0VsKCdyZWN0Jywge1xuICAgICAgICAgIGNsYXNzOiAnY2Ytbm9kZS1ib3gnLFxuICAgICAgICAgIHdpZHRoOiBub2RlLnBvc2l0aW9uLndpZHRoLFxuICAgICAgICAgIGhlaWdodDogbm9kZS5wb3NpdGlvbi5oZWlnaHQsXG4gICAgICAgICAgcng6IDYsXG4gICAgICAgICAgcnk6IDYsXG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgICAgY29uc3QgbGluZXMgPVxuICAgICAgICBBcnJheS5pc0FycmF5KG5vZGUubGFiZWxMaW5lcykgJiYgbm9kZS5sYWJlbExpbmVzLmxlbmd0aCA+IDBcbiAgICAgICAgICA/IG5vZGUubGFiZWxMaW5lcy5zbGljZSgwLCAzKVxuICAgICAgICAgIDogW3RydW5jYXRlKG5vZGUubGFiZWwsIDI2KV07XG4gICAgICBjb25zdCBsaW5lSGVpZ2h0ID0gMTM7XG4gICAgICBjb25zdCBibG9ja0hlaWdodCA9IGxpbmVzLmxlbmd0aCAqIGxpbmVIZWlnaHQ7XG4gICAgICBjb25zdCBsYWJlbCA9IHN2Z0VsKCd0ZXh0Jywge1xuICAgICAgICBjbGFzczogJ2NmLW5vZGUtbGFiZWwnLFxuICAgICAgICB4OiAxMCxcbiAgICAgICAgeTogbm9kZS5wb3NpdGlvbi5oZWlnaHQgLyAyIC0gYmxvY2tIZWlnaHQgLyAyICsgbGluZUhlaWdodCAtIDMsXG4gICAgICB9KTtcbiAgICAgIGZvciAoY29uc3QgW2luZGV4LCB0ZXh0XSBvZiBsaW5lcy5lbnRyaWVzKCkpIHtcbiAgICAgICAgY29uc3Qgc3BhbiA9IHN2Z0VsKCd0c3BhbicsIHtcbiAgICAgICAgICB4OiAxMCxcbiAgICAgICAgICAuLi4oaW5kZXggPT09IDAgPyB7fSA6IHsgZHk6IGxpbmVIZWlnaHQgfSksXG4gICAgICAgIH0pO1xuICAgICAgICBzcGFuLnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgICAgbGFiZWwuYXBwZW5kQ2hpbGQoc3Bhbik7XG4gICAgICB9XG4gICAgICBncm91cC5hcHBlbmRDaGlsZChsYWJlbCk7XG5cbiAgICAgIGNvbnN0IGtpbmQgPSBzdmdFbCgndGV4dCcsIHtcbiAgICAgICAgY2xhc3M6ICdjZi1ub2RlLWtpbmQnLFxuICAgICAgICB4OiAxMCxcbiAgICAgICAgeTogbm9kZS5wb3NpdGlvbi5oZWlnaHQgLSA4LFxuICAgICAgfSk7XG4gICAgICBraW5kLnRleHRDb250ZW50ID0gbm9kZS5leHRlcm5hbCA/IGAke25vZGUua2luZH0gXHUwMEI3IGV4dGVybmFsYCA6IG5vZGUua2luZDtcbiAgICAgIGdyb3VwLmFwcGVuZENoaWxkKGtpbmQpO1xuXG4gICAgICBjb25zdCBiYWRnZVRleHQgPVxuICAgICAgICBBcnJheS5pc0FycmF5KG5vZGUuYmFkZ2VzKSAmJiBub2RlLmJhZGdlcy5sZW5ndGggPiAwXG4gICAgICAgICAgPyBub2RlLmJhZGdlcy5qb2luKCcgXHUwMEI3ICcpXG4gICAgICAgICAgOiBub2RlLmJhZGdlIHx8IChub2RlLnN0YXR1cyAhPT0gJ3Jlc29sdmVkJyA/IG5vZGUuc3RhdHVzIDogJycpO1xuICAgICAgaWYgKGJhZGdlVGV4dCkge1xuICAgICAgICBjb25zdCBiYWRnZSA9IHN2Z0VsKCd0ZXh0Jywge1xuICAgICAgICAgIGNsYXNzOiAnY2Ytbm9kZS1iYWRnZScsXG4gICAgICAgICAgeDogbm9kZS5wb3NpdGlvbi53aWR0aCAtIDgsXG4gICAgICAgICAgeTogMTMsXG4gICAgICAgICAgJ3RleHQtYW5jaG9yJzogJ2VuZCcsXG4gICAgICAgIH0pO1xuICAgICAgICBiYWRnZS50ZXh0Q29udGVudCA9IHRydW5jYXRlKGJhZGdlVGV4dCwgMjQpO1xuICAgICAgICBncm91cC5hcHBlbmRDaGlsZChiYWRnZSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRpdGxlID0gc3ZnRWwoJ3RpdGxlJyk7XG4gICAgICBjb25zdCBjYWxsVGV4dCA9XG4gICAgICAgIEFycmF5LmlzQXJyYXkobm9kZS5jYWxscykgJiYgbm9kZS5jYWxscy5sZW5ndGggPiAwXG4gICAgICAgICAgPyBgXFxuY2FsbHM6ICR7bm9kZS5jYWxscy5tYXAoKGNhbGwpID0+IGAke2NhbGwubGFiZWx9ICgke2NhbGwuc3RhdHVzfSlgKS5qb2luKCcsICcpfWBcbiAgICAgICAgICA6ICcnO1xuICAgICAgdGl0bGUudGV4dENvbnRlbnQgPSBgJHtub2RlLmtpbmR9ICR7bm9kZS5sYWJlbH1cXG5zdGF0dXM6ICR7bm9kZS5zdGF0dXN9JHtcbiAgICAgICAgbm9kZS5yYW5nZSA/IGBcXG5saW5lcyAke25vZGUucmFuZ2Uuc3RhcnRMaW5lICsgMX0tJHtub2RlLnJhbmdlLmVuZExpbmUgKyAxfWAgOiAnJ1xuICAgICAgfSR7bm9kZS5yZWFzb25Db2RlID8gYFxcbnJlYXNvbjogJHtub2RlLnJlYXNvbkNvZGV9YCA6ICcnfSR7Y2FsbFRleHR9YDtcbiAgICAgIGdyb3VwLmFwcGVuZENoaWxkKHRpdGxlKTtcblxuICAgICAgZ3JvdXAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXZlbnQpID0+IHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHNlbGVjdChub2RlLmlkKTtcbiAgICAgIH0pO1xuICAgICAgZ3JvdXAuYWRkRXZlbnRMaXN0ZW5lcignZGJsY2xpY2snLCAoZXZlbnQpID0+IHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHNlbGVjdChub2RlLmlkKTtcbiAgICAgICAgb3B0aW9ucy5vbk5hdmlnYXRlPy4obm9kZS5pZCwgbm9kZSwgJ3BvaW50ZXInKTtcbiAgICAgIH0pO1xuICAgICAgZ3JvdXAuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmVudGVyJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIG9wdGlvbnMub25QcmV2aWV3RW50ZXI/Lihub2RlLmlkLCBub2RlLCB7IHg6IGV2ZW50LmNsaWVudFgsIHk6IGV2ZW50LmNsaWVudFkgfSk7XG4gICAgICB9KTtcbiAgICAgIGdyb3VwLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIG9wdGlvbnMub25QcmV2aWV3TW92ZT8uKHsgeDogZXZlbnQuY2xpZW50WCwgeTogZXZlbnQuY2xpZW50WSB9KTtcbiAgICAgIH0pO1xuICAgICAgZ3JvdXAuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmxlYXZlJywgKCkgPT4ge1xuICAgICAgICBvcHRpb25zLm9uUHJldmlld0xlYXZlPy4obm9kZS5pZCk7XG4gICAgICB9KTtcbiAgICAgIGdyb3VwLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gJ0VudGVyJykge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgc2VsZWN0KG5vZGUuaWQpO1xuICAgICAgICAgIG9wdGlvbnMub25OYXZpZ2F0ZT8uKG5vZGUuaWQsIG5vZGUsICdrZXlib2FyZCcpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXZlbnQua2V5ID09PSAnICcgfHwgZXZlbnQua2V5ID09PSAnU3BhY2ViYXInKSB7XG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBpZiAoZXZlbnQuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgIG9wdGlvbnMub25QcmV2aWV3S2V5Py4obm9kZS5pZCwgbm9kZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGVjdChub2RlLmlkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChldmVudC5rZXkgPT09ICdoJyB8fCBldmVudC5rZXkgPT09ICdIJykge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgb3B0aW9ucy5vblByZXZpZXdLZXk/Lihub2RlLmlkLCBub2RlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHZpZXdwb3J0LmFwcGVuZENoaWxkKGdyb3VwKTtcbiAgICAgIG5vZGVFbGVtZW50cy5zZXQobm9kZS5pZCwgZ3JvdXApO1xuICAgIH1cblxuICAgIHpvb21Ub0ZpdCgpO1xuICB9XG5cbiAgZnVuY3Rpb24gbW92ZVNlbGVjdGlvbihkaXJlY3Rpb24pIHtcbiAgICBpZiAoIWR0byB8fCBkdG8ubm9kZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGN1cnJlbnQgPSBzZWxlY3RlZElkID8gZHRvLm5vZGVzLmZpbmQoKG5vZGUpID0+IG5vZGUuaWQgPT09IHNlbGVjdGVkSWQpIDogbnVsbDtcbiAgICBpZiAoIWN1cnJlbnQpIHtcbiAgICAgIGNvbnN0IGZpcnN0ID0gZHRvLm5vZGVzWzBdO1xuICAgICAgc2VsZWN0KGZpcnN0LmlkKTtcbiAgICAgIG5vZGVFbGVtZW50cy5nZXQoZmlyc3QuaWQpPy5mb2N1cygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBvcmlnaW4gPSB7XG4gICAgICB4OiBjdXJyZW50LnBvc2l0aW9uLnggKyBjdXJyZW50LnBvc2l0aW9uLndpZHRoIC8gMixcbiAgICAgIHk6IGN1cnJlbnQucG9zaXRpb24ueSArIGN1cnJlbnQucG9zaXRpb24uaGVpZ2h0IC8gMixcbiAgICB9O1xuXG4gICAgbGV0IGJlc3QgPSBudWxsO1xuICAgIGxldCBiZXN0U2NvcmUgPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG4gICAgZm9yIChjb25zdCBjYW5kaWRhdGUgb2YgZHRvLm5vZGVzKSB7XG4gICAgICBpZiAoY2FuZGlkYXRlLmlkID09PSBjdXJyZW50LmlkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgcG9pbnQgPSB7XG4gICAgICAgIHg6IGNhbmRpZGF0ZS5wb3NpdGlvbi54ICsgY2FuZGlkYXRlLnBvc2l0aW9uLndpZHRoIC8gMixcbiAgICAgICAgeTogY2FuZGlkYXRlLnBvc2l0aW9uLnkgKyBjYW5kaWRhdGUucG9zaXRpb24uaGVpZ2h0IC8gMixcbiAgICAgIH07XG4gICAgICBjb25zdCBkeCA9IHBvaW50LnggLSBvcmlnaW4ueDtcbiAgICAgIGNvbnN0IGR5ID0gcG9pbnQueSAtIG9yaWdpbi55O1xuICAgICAgY29uc3QgZm9yd2FyZCA9XG4gICAgICAgIChkaXJlY3Rpb24gPT09ICdBcnJvd1JpZ2h0JyAmJiBkeCA+IDgpIHx8XG4gICAgICAgIChkaXJlY3Rpb24gPT09ICdBcnJvd0xlZnQnICYmIGR4IDwgLTgpIHx8XG4gICAgICAgIChkaXJlY3Rpb24gPT09ICdBcnJvd0Rvd24nICYmIGR5ID4gOCkgfHxcbiAgICAgICAgKGRpcmVjdGlvbiA9PT0gJ0Fycm93VXAnICYmIGR5IDwgLTgpO1xuICAgICAgaWYgKCFmb3J3YXJkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgcHJpbWFyeSA9XG4gICAgICAgIGRpcmVjdGlvbiA9PT0gJ0Fycm93UmlnaHQnIHx8IGRpcmVjdGlvbiA9PT0gJ0Fycm93TGVmdCcgPyBNYXRoLmFicyhkeCkgOiBNYXRoLmFicyhkeSk7XG4gICAgICBjb25zdCBzZWNvbmRhcnkgPVxuICAgICAgICBkaXJlY3Rpb24gPT09ICdBcnJvd1JpZ2h0JyB8fCBkaXJlY3Rpb24gPT09ICdBcnJvd0xlZnQnID8gTWF0aC5hYnMoZHkpIDogTWF0aC5hYnMoZHgpO1xuICAgICAgY29uc3Qgc2NvcmUgPSBwcmltYXJ5ICsgc2Vjb25kYXJ5ICogMi4yO1xuICAgICAgaWYgKHNjb3JlIDwgYmVzdFNjb3JlKSB7XG4gICAgICAgIGJlc3RTY29yZSA9IHNjb3JlO1xuICAgICAgICBiZXN0ID0gY2FuZGlkYXRlO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoYmVzdCkge1xuICAgICAgc2VsZWN0KGJlc3QuaWQpO1xuICAgICAgbm9kZUVsZW1lbnRzLmdldChiZXN0LmlkKT8uZm9jdXMoKTtcbiAgICB9XG4gIH1cblxuICBzdmcuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAnd2hlZWwnLFxuICAgIChldmVudCkgPT4ge1xuICAgICAgaWYgKCFkdG8pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNvbnN0IGJvdW5kcyA9IHN2Zy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIGNvbnN0IHBvaW50ZXJYID0gZXZlbnQuY2xpZW50WCAtIGJvdW5kcy5sZWZ0O1xuICAgICAgY29uc3QgcG9pbnRlclkgPSBldmVudC5jbGllbnRZIC0gYm91bmRzLnRvcDtcbiAgICAgIGNvbnN0IGZhY3RvciA9IGV2ZW50LmRlbHRhWSA8IDAgPyAxLjEyIDogMSAvIDEuMTI7XG4gICAgICBjb25zdCBuZXh0U2NhbGUgPSBNYXRoLm1pbigzLjUsIE1hdGgubWF4KDAuMTIsIHNjYWxlICogZmFjdG9yKSk7XG4gICAgICBjb25zdCByYXRpbyA9IG5leHRTY2FsZSAvIHNjYWxlO1xuICAgICAgdHJhbnNsYXRlWCA9IHBvaW50ZXJYIC0gKHBvaW50ZXJYIC0gdHJhbnNsYXRlWCkgKiByYXRpbztcbiAgICAgIHRyYW5zbGF0ZVkgPSBwb2ludGVyWSAtIChwb2ludGVyWSAtIHRyYW5zbGF0ZVkpICogcmF0aW87XG4gICAgICBzY2FsZSA9IG5leHRTY2FsZTtcbiAgICAgIGFwcGx5VHJhbnNmb3JtKCk7XG4gICAgfSxcbiAgICB7IHBhc3NpdmU6IGZhbHNlIH0sXG4gICk7XG5cbiAgc3ZnLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJkb3duJywgKGV2ZW50KSA9PiB7XG4gICAgaWYgKGV2ZW50LmJ1dHRvbiAhPT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFnZ2luZyA9IHRydWU7XG4gICAgZHJhZ1N0YXJ0ID0geyB4OiBldmVudC5jbGllbnRYLCB5OiBldmVudC5jbGllbnRZLCB0eDogdHJhbnNsYXRlWCwgdHk6IHRyYW5zbGF0ZVkgfTtcbiAgICBzdmcuc2V0UG9pbnRlckNhcHR1cmUoZXZlbnQucG9pbnRlcklkKTtcbiAgfSk7XG4gIHN2Zy5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybW92ZScsIChldmVudCkgPT4ge1xuICAgIGlmICghZHJhZ2dpbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdHJhbnNsYXRlWCA9IGRyYWdTdGFydC50eCArIChldmVudC5jbGllbnRYIC0gZHJhZ1N0YXJ0LngpO1xuICAgIHRyYW5zbGF0ZVkgPSBkcmFnU3RhcnQudHkgKyAoZXZlbnQuY2xpZW50WSAtIGRyYWdTdGFydC55KTtcbiAgICBhcHBseVRyYW5zZm9ybSgpO1xuICB9KTtcbiAgY29uc3QgZW5kRHJhZyA9IChldmVudCkgPT4ge1xuICAgIGRyYWdnaW5nID0gZmFsc2U7XG4gICAgaWYgKHN2Zy5oYXNQb2ludGVyQ2FwdHVyZShldmVudC5wb2ludGVySWQpKSB7XG4gICAgICBzdmcucmVsZWFzZVBvaW50ZXJDYXB0dXJlKGV2ZW50LnBvaW50ZXJJZCk7XG4gICAgfVxuICB9O1xuICBzdmcuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcnVwJywgZW5kRHJhZyk7XG4gIHN2Zy5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyY2FuY2VsJywgZW5kRHJhZyk7XG5cbiAgc3ZnLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgIGlmIChzZWxlY3RlZElkKSB7XG4gICAgICBzZWxlY3QobnVsbCk7XG4gICAgfVxuICB9KTtcblxuICBzdmcuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChldmVudCkgPT4ge1xuICAgIGlmIChldmVudC5rZXkuc3RhcnRzV2l0aCgnQXJyb3cnKSkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIG1vdmVTZWxlY3Rpb24oZXZlbnQua2V5KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGV2ZW50LmtleSA9PT0gJysnIHx8IGV2ZW50LmtleSA9PT0gJz0nKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgc2NhbGUgPSBNYXRoLm1pbigzLjUsIHNjYWxlICogMS4xNSk7XG4gICAgICBhcHBseVRyYW5zZm9ybSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZXZlbnQua2V5ID09PSAnLScpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBzY2FsZSA9IE1hdGgubWF4KDAuMTIsIHNjYWxlIC8gMS4xNSk7XG4gICAgICBhcHBseVRyYW5zZm9ybSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZXZlbnQua2V5ID09PSAnMCcpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB6b29tVG9GaXQoKTtcbiAgICB9XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBFZGl0b3ItZHJpdmVuIGhpZ2hsaWdodC4gRGlzdGluY3QgZnJvbSBzZWxlY3Rpb24gc28gdHlwaW5nIGluIHRoZSBlZGl0b3JcbiAgICogbmV2ZXIgc3RlYWxzIGdyYXBoIGZvY3VzIG9yIHJld3JpdGVzIHRoZSBkZXRhaWwgcGFuZWwuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IG5vZGVJZHNcbiAgICovXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodChub2RlSWRzKSB7XG4gICAgY29uc3Qgd2FudGVkID0gbmV3IFNldChBcnJheS5pc0FycmF5KG5vZGVJZHMpID8gbm9kZUlkcyA6IFtdKTtcbiAgICBmb3IgKGNvbnN0IFtpZCwgZWxlbWVudF0gb2Ygbm9kZUVsZW1lbnRzKSB7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoJ2lzLXN5bmNlZCcsIHdhbnRlZC5oYXMoaWQpKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBbLCBlbGVtZW50XSBvZiBlZGdlRWxlbWVudHMpIHtcbiAgICAgIGNvbnN0IGFjdGl2ZSA9XG4gICAgICAgIHdhbnRlZC5zaXplID4gMCAmJlxuICAgICAgICAod2FudGVkLmhhcyhlbGVtZW50LmRhdGFzZXQuZnJvbSA/PyAnJykgfHwgd2FudGVkLmhhcyhlbGVtZW50LmRhdGFzZXQudG8gPz8gJycpKTtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZSgnaXMtc3luY2VkJywgYWN0aXZlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gbm9kZUlkc1xuICAgKi9cbiAgZnVuY3Rpb24gbWFya1N0YWxlKG5vZGVJZHMpIHtcbiAgICBjb25zdCB3YW50ZWQgPSBuZXcgU2V0KEFycmF5LmlzQXJyYXkobm9kZUlkcykgPyBub2RlSWRzIDogW10pO1xuICAgIGZvciAoY29uc3QgW2lkLCBlbGVtZW50XSBvZiBub2RlRWxlbWVudHMpIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZSgnaXMtc3RhbGUnLCB3YW50ZWQuaGFzKGlkKSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZm9jdXNTZWxlY3Rpb24oKSB7XG4gICAgaWYgKHNlbGVjdGVkSWQpIHtcbiAgICAgIG5vZGVFbGVtZW50cy5nZXQoc2VsZWN0ZWRJZCk/LmZvY3VzKCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICByZW5kZXIsXG4gICAgc2VsZWN0LFxuICAgIGhpZ2hsaWdodCxcbiAgICBtYXJrU3RhbGUsXG4gICAgZm9jdXNTZWxlY3Rpb24sXG4gICAgem9vbVRvRml0LFxuICAgIGRlc3Ryb3koKSB7XG4gICAgICBjbGVhcigpO1xuICAgICAgZHRvID0gbnVsbDtcbiAgICB9LFxuICB9O1xufVxuIiwgIi8qKlxuICogU291cmNlIHJhbmdlIHZhbGlkYXRpb24gYW5kIHNsaWNpbmcuXG4gKlxuICogVGhlc2UgaGVscGVycyBhcmUgcHVyZSBhbmQgaG9zdC1pbmRlcGVuZGVudC4gVGhlIGV4dGVuc2lvbiBob3N0IHN1cHBsaWVzIHRoZVxuICogcmVhbCBkb2N1bWVudCB0ZXh0IGFuZCB2ZXJzaW9uOyB0aGUgd2VidmlldyBhbmQgdGhlIHRlc3RzIHVzZSB0aGUgc2FtZSByYW5nZVxuICogcnVsZXMuIE5vdGhpbmcgaGVyZSByZWFkcyBhIGZpbGUgb3IgYXNzZW1ibGVzIHNvdXJjZSBmcm9tIGFuIEFTVC5cbiAqL1xuXG4vKiogRGVmYXVsdCBzbGljZSBsaW1pdHMgZnJvbSB0aGUgUGhhc2UgNSBjb250cmFjdC4gKi9cbmV4cG9ydCBjb25zdCBTT1VSQ0VfTElNSVRTID0gT2JqZWN0LmZyZWV6ZSh7XG4gIG1heExpbmVzOiAxMixcbiAgbWluTGluZXM6IDQsXG4gIG1heExpbmVzTGltaXQ6IDQwLFxuICBtYXhCeXRlczogNjVfNTM2LFxuICBtYXhSYW5nZXM6IDJfMDAwLFxufSk7XG5cbmNvbnN0IElOVEVHRVJfRklFTERTID0gWydzdGFydExpbmUnLCAnc3RhcnRDb2x1bW4nLCAnZW5kTGluZScsICdlbmRDb2x1bW4nXTtcblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcmV0dXJucyB7dmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj59XG4gKi9cbmZ1bmN0aW9uIGlzUmVjb3JkKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKTtcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSB0aGUgd2lyZSBzaGFwZSBvZiBhIHJhbmdlIHJlZmVyZW5jZS4gVGhpcyBkb2VzIG5vdCBrbm93IHRoZVxuICogZG9jdW1lbnQ7IGByYW5nZVdpdGhpbkRvY3VtZW50YCBkb2VzIHRoYXQuXG4gKlxuICogQHBhcmFtIHt1bmtub3dufSByYXdcbiAqIEByZXR1cm5zIHt7b2s6IHRydWUsIHZhbHVlOiBSZWNvcmQ8c3RyaW5nLCBhbnk+fSB8IHtvazogZmFsc2UsIGNvZGU6ICdFX1JBTkdFJywgaXNzdWVzOiBzdHJpbmdbXX19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVSYW5nZVJlZihyYXcpIHtcbiAgaWYgKCFpc1JlY29yZChyYXcpKSB7XG4gICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBjb2RlOiAnRV9SQU5HRScsIGlzc3VlczogWydyYW5nZSBtdXN0IGJlIGFuIG9iamVjdC4nXSB9O1xuICB9XG4gIC8qKiBAdHlwZSB7c3RyaW5nW119ICovXG4gIGNvbnN0IGlzc3VlcyA9IFtdO1xuICBpZiAodHlwZW9mIHJhdy5maWxlSWQgIT09ICdzdHJpbmcnIHx8IHJhdy5maWxlSWQubGVuZ3RoID09PSAwIHx8IHJhdy5maWxlSWQubGVuZ3RoID4gNTEyKSB7XG4gICAgaXNzdWVzLnB1c2goJ2ZpbGVJZCBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZy4nKTtcbiAgfVxuICBmb3IgKGNvbnN0IGtleSBvZiBJTlRFR0VSX0ZJRUxEUykge1xuICAgIGNvbnN0IHZhbHVlID0gcmF3W2tleV07XG4gICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKHZhbHVlKSB8fCBOdW1iZXIodmFsdWUpIDwgMCkge1xuICAgICAgaXNzdWVzLnB1c2goYCR7a2V5fSBtdXN0IGJlIGEgbm9uLW5lZ2F0aXZlIGludGVnZXIuYCk7XG4gICAgfVxuICB9XG4gIGlmIChpc3N1ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgY29uc3Qgc3RhcnRMaW5lID0gTnVtYmVyKHJhdy5zdGFydExpbmUpO1xuICAgIGNvbnN0IHN0YXJ0Q29sdW1uID0gTnVtYmVyKHJhdy5zdGFydENvbHVtbik7XG4gICAgY29uc3QgZW5kTGluZSA9IE51bWJlcihyYXcuZW5kTGluZSk7XG4gICAgY29uc3QgZW5kQ29sdW1uID0gTnVtYmVyKHJhdy5lbmRDb2x1bW4pO1xuICAgIGlmIChzdGFydExpbmUgPiBlbmRMaW5lIHx8IChzdGFydExpbmUgPT09IGVuZExpbmUgJiYgc3RhcnRDb2x1bW4gPiBlbmRDb2x1bW4pKSB7XG4gICAgICBpc3N1ZXMucHVzaCgncmFuZ2Ugc3RhcnQgbXVzdCBub3QgY29tZSBhZnRlciByYW5nZSBlbmQuJyk7XG4gICAgfVxuICB9XG4gIGZvciAoY29uc3Qga2V5IG9mIFsnc3RhcnRPZmZzZXQnLCAnZW5kT2Zmc2V0J10pIHtcbiAgICBpZiAocmF3W2tleV0gIT09IHVuZGVmaW5lZCAmJiAoIU51bWJlci5pc0ludGVnZXIocmF3W2tleV0pIHx8IE51bWJlcihyYXdba2V5XSkgPCAwKSkge1xuICAgICAgaXNzdWVzLnB1c2goYCR7a2V5fSBtdXN0IGJlIGEgbm9uLW5lZ2F0aXZlIGludGVnZXIgd2hlbiBwcmVzZW50LmApO1xuICAgIH1cbiAgfVxuICBpZiAoaXNzdWVzLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4geyBvazogZmFsc2UsIGNvZGU6ICdFX1JBTkdFJywgaXNzdWVzIH07XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBvazogdHJ1ZSxcbiAgICB2YWx1ZToge1xuICAgICAgZmlsZUlkOiBTdHJpbmcocmF3LmZpbGVJZCksXG4gICAgICBzdGFydExpbmU6IE51bWJlcihyYXcuc3RhcnRMaW5lKSxcbiAgICAgIHN0YXJ0Q29sdW1uOiBOdW1iZXIocmF3LnN0YXJ0Q29sdW1uKSxcbiAgICAgIGVuZExpbmU6IE51bWJlcihyYXcuZW5kTGluZSksXG4gICAgICBlbmRDb2x1bW46IE51bWJlcihyYXcuZW5kQ29sdW1uKSxcbiAgICAgIC4uLihOdW1iZXIuaXNJbnRlZ2VyKHJhdy5zdGFydE9mZnNldCkgPyB7IHN0YXJ0T2Zmc2V0OiBOdW1iZXIocmF3LnN0YXJ0T2Zmc2V0KSB9IDoge30pLFxuICAgICAgLi4uKE51bWJlci5pc0ludGVnZXIocmF3LmVuZE9mZnNldCkgPyB7IGVuZE9mZnNldDogTnVtYmVyKHJhdy5lbmRPZmZzZXQpIH0gOiB7fSksXG4gICAgfSxcbiAgfTtcbn1cblxuLyoqXG4gKiBPZmZzZXRzIG9mIHRoZSBmaXJzdCBjaGFyYWN0ZXIgb2YgZXZlcnkgbGluZS4gSGFuZGxlcyBDUkxGLCBDUiBhbmQgTEYuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAqIEByZXR1cm5zIHtudW1iZXJbXX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpbmVTdGFydHModGV4dCkge1xuICBjb25zdCBzdGFydHMgPSBbMF07XG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCB0ZXh0Lmxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIGNvbnN0IGNvZGUgPSB0ZXh0LmNoYXJDb2RlQXQoaW5kZXgpO1xuICAgIGlmIChjb2RlID09PSAxMCkge1xuICAgICAgc3RhcnRzLnB1c2goaW5kZXggKyAxKTtcbiAgICB9IGVsc2UgaWYgKGNvZGUgPT09IDEzKSB7XG4gICAgICBpZiAodGV4dC5jaGFyQ29kZUF0KGluZGV4ICsgMSkgPT09IDEwKSB7XG4gICAgICAgIGluZGV4ICs9IDE7XG4gICAgICB9XG4gICAgICBzdGFydHMucHVzaChpbmRleCArIDEpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RhcnRzO1xufVxuXG4vKipcbiAqIERvY3VtZW50IGZhY3RzIHRoZSB2YWxpZGF0b3IgbmVlZHMuIGBsaW5lTGVuZ3RoYCBleGNsdWRlcyB0aGUgbGluZSBlbmRpbmcuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAqIEByZXR1cm5zIHt7bGluZUNvdW50OiBudW1iZXIsIGxpbmVMZW5ndGg6IChsaW5lOiBudW1iZXIpID0+IG51bWJlciwgc3RhcnRzOiBudW1iZXJbXX19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVEb2N1bWVudFZpZXcodGV4dCkge1xuICBjb25zdCBzdGFydHMgPSBsaW5lU3RhcnRzKHRleHQpO1xuICByZXR1cm4ge1xuICAgIGxpbmVDb3VudDogc3RhcnRzLmxlbmd0aCxcbiAgICBzdGFydHMsXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGxpbmVcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgICAqL1xuICAgIGxpbmVMZW5ndGgobGluZSkge1xuICAgICAgaWYgKGxpbmUgPCAwIHx8IGxpbmUgPj0gc3RhcnRzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICBjb25zdCBzdGFydCA9IHN0YXJ0c1tsaW5lXTtcbiAgICAgIGxldCBlbmQgPSBsaW5lICsgMSA8IHN0YXJ0cy5sZW5ndGggPyBzdGFydHNbbGluZSArIDFdIDogdGV4dC5sZW5ndGg7XG4gICAgICBpZiAoZW5kID4gc3RhcnQgJiYgdGV4dC5jaGFyQ29kZUF0KGVuZCAtIDEpID09PSAxMCkge1xuICAgICAgICBlbmQgLT0gMTtcbiAgICAgIH1cbiAgICAgIGlmIChlbmQgPiBzdGFydCAmJiB0ZXh0LmNoYXJDb2RlQXQoZW5kIC0gMSkgPT09IDEzKSB7XG4gICAgICAgIGVuZCAtPSAxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVuZCAtIHN0YXJ0O1xuICAgIH0sXG4gIH07XG59XG5cbi8qKlxuICogVmFsaWRhdGUgYSBub3JtYWxpemVkIHJhbmdlIGFnYWluc3QgYSBkb2N1bWVudC4gTm90aGluZyBpcyBjbGFtcGVkOiBhblxuICogb3V0LW9mLWJvdW5kcyByYW5nZSBpcyByZWplY3RlZCBzbyBhIHByZXZpZXcgY2FuIG5ldmVyIHNpbGVudGx5IHNob3cgdGhlXG4gKiB3cm9uZyB0ZXh0LlxuICpcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gcmFuZ2VcbiAqIEBwYXJhbSB7e2xpbmVDb3VudDogbnVtYmVyLCBsaW5lTGVuZ3RoOiAobGluZTogbnVtYmVyKSA9PiBudW1iZXJ9fSBkb2N1bWVudFxuICogQHJldHVybnMge3tvazogdHJ1ZX0gfCB7b2s6IGZhbHNlLCBjb2RlOiAnRV9SQU5HRScsIGlzc3Vlczogc3RyaW5nW119fVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmFuZ2VXaXRoaW5Eb2N1bWVudChyYW5nZSwgZG9jdW1lbnQpIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZVJhbmdlUmVmKHJhbmdlKTtcbiAgaWYgKCFub3JtYWxpemVkLm9rKSB7XG4gICAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG4gIH1cbiAgY29uc3QgdmFsdWUgPSBub3JtYWxpemVkLnZhbHVlO1xuICAvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuICBjb25zdCBpc3N1ZXMgPSBbXTtcbiAgY29uc3QgbGluZUNvdW50ID0gTnVtYmVyKGRvY3VtZW50Py5saW5lQ291bnQpO1xuICBpZiAoIU51bWJlci5pc0ludGVnZXIobGluZUNvdW50KSB8fCBsaW5lQ291bnQgPCAxKSB7XG4gICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBjb2RlOiAnRV9SQU5HRScsIGlzc3VlczogWydkb2N1bWVudCBsaW5lIGNvdW50IGlzIHVua25vd24uJ10gfTtcbiAgfVxuICBpZiAodmFsdWUuZW5kTGluZSA+PSBsaW5lQ291bnQpIHtcbiAgICBpc3N1ZXMucHVzaChgZW5kTGluZSAke3ZhbHVlLmVuZExpbmV9IGlzIGJleW9uZCB0aGUgZG9jdW1lbnQgKCR7bGluZUNvdW50fSBsaW5lcykuYCk7XG4gIH1cbiAgaWYgKGlzc3Vlcy5sZW5ndGggPT09IDAgJiYgdHlwZW9mIGRvY3VtZW50LmxpbmVMZW5ndGggPT09ICdmdW5jdGlvbicpIHtcbiAgICBjb25zdCBzdGFydExlbmd0aCA9IGRvY3VtZW50LmxpbmVMZW5ndGgodmFsdWUuc3RhcnRMaW5lKTtcbiAgICBjb25zdCBlbmRMZW5ndGggPSBkb2N1bWVudC5saW5lTGVuZ3RoKHZhbHVlLmVuZExpbmUpO1xuICAgIGlmIChzdGFydExlbmd0aCA8IDAgfHwgdmFsdWUuc3RhcnRDb2x1bW4gPiBzdGFydExlbmd0aCkge1xuICAgICAgaXNzdWVzLnB1c2goXG4gICAgICAgIGBzdGFydENvbHVtbiAke3ZhbHVlLnN0YXJ0Q29sdW1ufSBpcyBiZXlvbmQgbGluZSAke3ZhbHVlLnN0YXJ0TGluZX0gKCR7c3RhcnRMZW5ndGh9IGNvbHVtbnMpLmAsXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoZW5kTGVuZ3RoIDwgMCB8fCB2YWx1ZS5lbmRDb2x1bW4gPiBlbmRMZW5ndGgpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKFxuICAgICAgICBgZW5kQ29sdW1uICR7dmFsdWUuZW5kQ29sdW1ufSBpcyBiZXlvbmQgbGluZSAke3ZhbHVlLmVuZExpbmV9ICgke2VuZExlbmd0aH0gY29sdW1ucykuYCxcbiAgICAgICk7XG4gICAgfVxuICB9XG4gIHJldHVybiBpc3N1ZXMubGVuZ3RoID4gMCA/IHsgb2s6IGZhbHNlLCBjb2RlOiAnRV9SQU5HRScsIGlzc3VlcyB9IDogeyBvazogdHJ1ZSB9O1xufVxuXG4vKipcbiAqIEV4YWN0IHN1YnN0cmluZyBmb3IgYSByYW5nZS4gS2VlcHMgdGhlIG9yaWdpbmFsIGxpbmUgZW5kaW5ncyBhbmQgaW5kZW50YXRpb24uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gcmFuZ2VcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzbGljZVRleHQodGV4dCwgcmFuZ2UpIHtcbiAgY29uc3Qgc3RhcnRzID0gbGluZVN0YXJ0cyh0ZXh0KTtcbiAgY29uc3Qgc3RhcnRMaW5lID0gTnVtYmVyKHJhbmdlPy5zdGFydExpbmUpO1xuICBjb25zdCBlbmRMaW5lID0gTnVtYmVyKHJhbmdlPy5lbmRMaW5lKTtcbiAgY29uc3Qgc3RhcnQgPSAoc3RhcnRzW3N0YXJ0TGluZV0gPz8gMCkgKyBOdW1iZXIocmFuZ2U/LnN0YXJ0Q29sdW1uID8/IDApO1xuICBjb25zdCBlbmQgPSAoc3RhcnRzW2VuZExpbmVdID8/IHN0YXJ0c1tzdGFydHMubGVuZ3RoIC0gMV0pICsgTnVtYmVyKHJhbmdlPy5lbmRDb2x1bW4gPz8gMCk7XG4gIHJldHVybiB0ZXh0LnNsaWNlKHN0YXJ0LCBNYXRoLm1heChzdGFydCwgZW5kKSk7XG59XG5cbi8qKlxuICogVHJpbSBhIHNsaWNlIGZyb20gdGhlIGVuZCB0byBgbWF4TGluZXNgLiBOZXZlciByZXR1cm5zIG1vcmUgbGluZXMgdGhhbiBhc2tlZFxuICogZm9yIGFuZCByZXBvcnRzIHRoZSB0cmltLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gKiBAcGFyYW0ge251bWJlcn0gbWF4TGluZXNcbiAqIEByZXR1cm5zIHt7dGV4dDogc3RyaW5nLCB0cnVuY2F0ZWQ6IGJvb2xlYW4sIGxpbmVDb3VudDogbnVtYmVyfX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRydW5jYXRlU291cmNlKHRleHQsIG1heExpbmVzKSB7XG4gIGNvbnN0IGxpbWl0ID0gTWF0aC5taW4oXG4gICAgU09VUkNFX0xJTUlUUy5tYXhMaW5lc0xpbWl0LFxuICAgIE1hdGgubWF4KFNPVVJDRV9MSU1JVFMubWluTGluZXMsIE51bWJlci5pc0ludGVnZXIobWF4TGluZXMpID8gbWF4TGluZXMgOiBTT1VSQ0VfTElNSVRTLm1heExpbmVzKSxcbiAgKTtcbiAgY29uc3Qgc3RhcnRzID0gbGluZVN0YXJ0cyh0ZXh0KTtcbiAgY29uc3QgbGluZUNvdW50ID0gc3RhcnRzLmxlbmd0aDtcbiAgaWYgKGxpbmVDb3VudCA8PSBsaW1pdCkge1xuICAgIHJldHVybiB7IHRleHQsIHRydW5jYXRlZDogZmFsc2UsIGxpbmVDb3VudCB9O1xuICB9XG4gIC8vIEtlZXAgZXhhY3RseSBgbGltaXRgIGxpbmVzIGJ5IGRyb3BwaW5nIHRoZSB0cmFpbGluZyBsaW5lIGVuZGluZzsgb3RoZXJ3aXNlIGFcbiAgLy8gY29uc3VtZXIgdGhhdCBzcGxpdHMgb24gbmV3bGluZXMgd291bGQgcmVuZGVyIG9uZSBlbXB0eSBleHRyYSBsaW5lLlxuICBsZXQgY2xpcHBlZCA9IHRleHQuc2xpY2UoMCwgc3RhcnRzW2xpbWl0XSk7XG4gIGlmIChjbGlwcGVkLmVuZHNXaXRoKCdcXHJcXG4nKSkge1xuICAgIGNsaXBwZWQgPSBjbGlwcGVkLnNsaWNlKDAsIC0yKTtcbiAgfSBlbHNlIGlmIChjbGlwcGVkLmVuZHNXaXRoKCdcXG4nKSB8fCBjbGlwcGVkLmVuZHNXaXRoKCdcXHInKSkge1xuICAgIGNsaXBwZWQgPSBjbGlwcGVkLnNsaWNlKDAsIC0xKTtcbiAgfVxuICByZXR1cm4ge1xuICAgIHRleHQ6IGNsaXBwZWQsXG4gICAgdHJ1bmNhdGVkOiB0cnVlLFxuICAgIGxpbmVDb3VudDogbGltaXQsXG4gIH07XG59XG5cbi8qKlxuICogVHJ1ZSB3aGVuIHRoZSBwb3NpdGlvbiBpcyBpbnNpZGUgdGhlIHJhbmdlLCBpbmNsdWRpbmcgaXRzIGVuZC5cbiAqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IHJhbmdlXG4gKiBAcGFyYW0ge3tsaW5lOiBudW1iZXIsIGNvbHVtbjogbnVtYmVyfX0gcG9zaXRpb25cbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbnNQb3NpdGlvbihyYW5nZSwgcG9zaXRpb24pIHtcbiAgY29uc3QgbGluZSA9IE51bWJlcihwb3NpdGlvbj8ubGluZSk7XG4gIGNvbnN0IGNvbHVtbiA9IE51bWJlcihwb3NpdGlvbj8uY29sdW1uKTtcbiAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGxpbmUpIHx8ICFOdW1iZXIuaXNJbnRlZ2VyKGNvbHVtbikpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGxpbmUgPCByYW5nZS5zdGFydExpbmUgfHwgbGluZSA+IHJhbmdlLmVuZExpbmUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGxpbmUgPT09IHJhbmdlLnN0YXJ0TGluZSAmJiBjb2x1bW4gPCByYW5nZS5zdGFydENvbHVtbikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAobGluZSA9PT0gcmFuZ2UuZW5kTGluZSAmJiBjb2x1bW4gPiByYW5nZS5lbmRDb2x1bW4pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBvdXRlclxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBpbm5lclxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluc1JhbmdlKG91dGVyLCBpbm5lcikge1xuICBpZiAoIW91dGVyIHx8ICFpbm5lciB8fCBvdXRlci5maWxlSWQgIT09IGlubmVyLmZpbGVJZCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gKFxuICAgIGNvbnRhaW5zUG9zaXRpb24ob3V0ZXIsIHsgbGluZTogaW5uZXIuc3RhcnRMaW5lLCBjb2x1bW46IGlubmVyLnN0YXJ0Q29sdW1uIH0pICYmXG4gICAgY29udGFpbnNQb3NpdGlvbihvdXRlciwgeyBsaW5lOiBpbm5lci5lbmRMaW5lLCBjb2x1bW46IGlubmVyLmVuZENvbHVtbiB9KVxuICApO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gbGVmdFxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSByaWdodFxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByYW5nZXNPdmVybGFwKGxlZnQsIHJpZ2h0KSB7XG4gIGlmICghbGVmdCB8fCAhcmlnaHQgfHwgbGVmdC5maWxlSWQgIT09IHJpZ2h0LmZpbGVJZCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gKFxuICAgIGNvbnRhaW5zUG9zaXRpb24obGVmdCwgeyBsaW5lOiByaWdodC5zdGFydExpbmUsIGNvbHVtbjogcmlnaHQuc3RhcnRDb2x1bW4gfSkgfHxcbiAgICBjb250YWluc1Bvc2l0aW9uKGxlZnQsIHsgbGluZTogcmlnaHQuZW5kTGluZSwgY29sdW1uOiByaWdodC5lbmRDb2x1bW4gfSkgfHxcbiAgICBjb250YWluc1Bvc2l0aW9uKHJpZ2h0LCB7IGxpbmU6IGxlZnQuc3RhcnRMaW5lLCBjb2x1bW46IGxlZnQuc3RhcnRDb2x1bW4gfSlcbiAgKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IHJhbmdlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmFuZ2VLZXkocmFuZ2UpIHtcbiAgcmV0dXJuIGAke3JhbmdlLmZpbGVJZH06JHtyYW5nZS5zdGFydExpbmV9OiR7cmFuZ2Uuc3RhcnRDb2x1bW59LSR7cmFuZ2UuZW5kTGluZX06JHtyYW5nZS5lbmRDb2x1bW59YDtcbn1cblxuLyoqXG4gKiBJbnRlZ3JpdHkgaXMgYSBjb21wYXJpc29uIG9mIHR3byBmdWxsLWRvY3VtZW50IGhhc2hlcy4gQ29uc2VydmF0aXZlOiBhXG4gKiBtaXNtYXRjaCBtYXJrcyB0aGUgd2hvbGUgZmlsZSBzdGFsZSwgYmVjYXVzZSBhbiBleHRlcm5hbCByZXdyaXRlIGdpdmVzIHVzIG5vXG4gKiB0cnVzdHdvcnRoeSBlZGl0IGRlbHRhLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gYW5hbHlzaXNIYXNoXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IGN1cnJlbnRIYXNoXG4gKiBAcmV0dXJucyB7J2V4YWN0J3wnc3RhbGUnfCdtaXNzaW5nJ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVncml0eUZvcihhbmFseXNpc0hhc2gsIGN1cnJlbnRIYXNoKSB7XG4gIGlmICghYW5hbHlzaXNIYXNoIHx8ICFjdXJyZW50SGFzaCkge1xuICAgIHJldHVybiAnbWlzc2luZyc7XG4gIH1cbiAgcmV0dXJuIGFuYWx5c2lzSGFzaCA9PT0gY3VycmVudEhhc2ggPyAnZXhhY3QnIDogJ3N0YWxlJztcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplTWF4TGluZXModmFsdWUpIHtcbiAgY29uc3QgY2FuZGlkYXRlID0gTnVtYmVyKHZhbHVlKTtcbiAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoY2FuZGlkYXRlKSkge1xuICAgIHJldHVybiBTT1VSQ0VfTElNSVRTLm1heExpbmVzO1xuICB9XG4gIHJldHVybiBNYXRoLm1pbihcbiAgICBTT1VSQ0VfTElNSVRTLm1heExpbmVzTGltaXQsXG4gICAgTWF0aC5tYXgoU09VUkNFX0xJTUlUUy5taW5MaW5lcywgTWF0aC50cnVuYyhjYW5kaWRhdGUpKSxcbiAgKTtcbn1cbiIsICIvKipcbiAqIFByZXZpZXcgcHJlc2VudGF0aW9uIG1vZGVsLlxuICpcbiAqIFB1cmU6IGdpdmVuIGEgZ3JhcGggbm9kZSBhbmQgYW4gb3B0aW9uYWwgc291cmNlIHNsaWNlLCBkZWNpZGUgd2hhdCB0aGUgY2FyZFxuICogc2F5cy4gVGhlIHdlYnZpZXcgdHVybnMgdGhpcyBpbnRvIERPTTsgdGVzdHMgYXNzZXJ0IHRoZSBkZWNpc2lvbnMgd2l0aG91dCBhXG4gKiBicm93c2VyLiBTeW50aGV0aWMgYW5kIHN0YWxlIG5vZGVzIG11c3QgZXhwbGFpbiB0aGVtc2VsdmVzIGluc3RlYWQgb2ZcbiAqIHNob3dpbmcgbWlzbGVhZGluZyBzb3VyY2UuXG4gKi9cblxuaW1wb3J0IHsgU09VUkNFX0xJTUlUUywgdHJ1bmNhdGVTb3VyY2UgfSBmcm9tICcuL3Jhbmdlcy5qcyc7XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gUHJldmlld05vZGVcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBpZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGtpbmRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBsYWJlbFxuICogQHByb3BlcnR5IHtib29sZWFufSBbaXNTeW50aGV0aWNdXG4gKiBAcHJvcGVydHkge1JlY29yZDxzdHJpbmcsIGFueT58bnVsbH0gW3JhbmdlXVxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gUHJldmlld1NsaWNlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gdGV4dFxuICogQHByb3BlcnR5IHtzdHJpbmd9IHJlbGF0aXZlUGF0aFxuICogQHByb3BlcnR5IHt7c3RhcnRMaW5lOiBudW1iZXIsIGVuZExpbmU6IG51bWJlcn19IFtsaW5lc11cbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW3RydW5jYXRlZF1cbiAqIEBwcm9wZXJ0eSB7J2V4YWN0J3wnc3RhbGUnfCdtaXNzaW5nJ30gW2ludGVncml0eV1cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbZG9jdW1lbnRWZXJzaW9uXVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtjb250ZW50SGFzaF1cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbcmVhc29uXVxuICovXG5cbi8qKlxuICogQHBhcmFtIHt7bm9kZTogUHJldmlld05vZGUsIHNsaWNlPzogUHJldmlld1NsaWNlfG51bGwsIG1heExpbmVzPzogbnVtYmVyfX0gaW5wdXRcbiAqIEByZXR1cm5zIHt7XG4gKiAgIHRpdGxlOiBzdHJpbmcsXG4gKiAgIGtpbmQ6IHN0cmluZyxcbiAqICAgZmlsZTogc3RyaW5nLFxuICogICBsaW5lTGFiZWw6IHN0cmluZyxcbiAqICAgdGV4dDogc3RyaW5nLFxuICogICB0cnVuY2F0ZWQ6IGJvb2xlYW4sXG4gKiAgIHN5bnRoZXRpYzogYm9vbGVhbixcbiAqICAgc3RhbGU6IGJvb2xlYW4sXG4gKiAgIGVtcHR5OiBib29sZWFuLFxuICogICBtZXNzYWdlOiBzdHJpbmcsXG4gKiAgIGludGVncml0eTogJ2V4YWN0J3wnc3RhbGUnfCdtaXNzaW5nJyxcbiAqICAgZG9jdW1lbnRWZXJzaW9uOiBudW1iZXJ8bnVsbFxuICogfX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkUHJldmlld01vZGVsKHsgbm9kZSwgc2xpY2UgPSBudWxsLCBtYXhMaW5lcyA9IFNPVVJDRV9MSU1JVFMubWF4TGluZXMgfSkge1xuICBjb25zdCByYW5nZSA9IG5vZGU/LnJhbmdlID8/IG51bGw7XG4gIGNvbnN0IHRpdGxlID0gU3RyaW5nKG5vZGU/LmxhYmVsID8/ICdzb3VyY2UnKTtcbiAgY29uc3QgbGluZUxhYmVsID0gcmFuZ2VcbiAgICA/IGAke051bWJlcihyYW5nZS5zdGFydExpbmUpICsgMX1cdTIwMTMke051bWJlcihyYW5nZS5lbmRMaW5lKSArIDF9YFxuICAgIDogJ25vIGxpbmUgcmFuZ2UnO1xuICBjb25zdCBzeW50aGV0aWMgPSBub2RlPy5pc1N5bnRoZXRpYyA9PT0gdHJ1ZSB8fCAhcmFuZ2U7XG5cbiAgaWYgKHN5bnRoZXRpYykge1xuICAgIHJldHVybiB7XG4gICAgICB0aXRsZSxcbiAgICAgIGtpbmQ6IFN0cmluZyhub2RlPy5raW5kID8/ICdub2RlJyksXG4gICAgICBmaWxlOiByYW5nZT8uZmlsZUlkID8/ICcnLFxuICAgICAgbGluZUxhYmVsLFxuICAgICAgdGV4dDogJycsXG4gICAgICB0cnVuY2F0ZWQ6IGZhbHNlLFxuICAgICAgc3ludGhldGljOiB0cnVlLFxuICAgICAgc3RhbGU6IGZhbHNlLFxuICAgICAgZW1wdHk6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogcmFuZ2VcbiAgICAgICAgPyBgU3ludGhldGljICR7bm9kZT8ua2luZCA/PyAnbm9kZSd9IFx1MjAxNCBmdW5jdGlvbiBzdHJ1Y3R1cmUsIG5vdCBhIHNvdXJjZSBzdGF0ZW1lbnQuIEFuY2hvcmVkIGF0IGxpbmUgJHtOdW1iZXIocmFuZ2Uuc3RhcnRMaW5lKSArIDF9LmBcbiAgICAgICAgOiBgU3ludGhldGljICR7bm9kZT8ua2luZCA/PyAnbm9kZSd9IFx1MjAxNCB0aGlzIG5vZGUgaGFzIG5vIHNvdXJjZSByYW5nZS5gLFxuICAgICAgaW50ZWdyaXR5OiAnZXhhY3QnLFxuICAgICAgZG9jdW1lbnRWZXJzaW9uOiBudWxsLFxuICAgIH07XG4gIH1cblxuICBpZiAoIXNsaWNlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRpdGxlLFxuICAgICAga2luZDogU3RyaW5nKG5vZGU/LmtpbmQgPz8gJ25vZGUnKSxcbiAgICAgIGZpbGU6IHJhbmdlPy5maWxlSWQgPz8gJycsXG4gICAgICBsaW5lTGFiZWwsXG4gICAgICB0ZXh0OiAnJyxcbiAgICAgIHRydW5jYXRlZDogZmFsc2UsXG4gICAgICBzeW50aGV0aWM6IGZhbHNlLFxuICAgICAgc3RhbGU6IGZhbHNlLFxuICAgICAgZW1wdHk6IHRydWUsXG4gICAgICBtZXNzYWdlOiAnU291cmNlIGlzIG5vdCBhdmFpbGFibGUgZm9yIHRoaXMgcmFuZ2UuJyxcbiAgICAgIGludGVncml0eTogJ21pc3NpbmcnLFxuICAgICAgZG9jdW1lbnRWZXJzaW9uOiBudWxsLFxuICAgIH07XG4gIH1cblxuICBjb25zdCB0cmltbWVkID0gdHJ1bmNhdGVTb3VyY2UoU3RyaW5nKHNsaWNlLnRleHQgPz8gJycpLCBtYXhMaW5lcyk7XG4gIGNvbnN0IGludGVncml0eSA9IHNsaWNlLmludGVncml0eSA/PyAnZXhhY3QnO1xuICBjb25zdCBzdGFsZSA9IGludGVncml0eSA9PT0gJ3N0YWxlJztcbiAgY29uc3QgZW1wdHkgPSB0cmltbWVkLnRleHQudHJpbSgpLmxlbmd0aCA9PT0gMDtcbiAgbGV0IG1lc3NhZ2UgPSAnJztcbiAgaWYgKHN0YWxlKSB7XG4gICAgbWVzc2FnZSA9XG4gICAgICAnVGhlIGRvY3VtZW50IGNoYW5nZWQgc2luY2UgdGhpcyBhbmFseXNpcy4gVGhlIHRleHQgYmVsb3cgaXMgY3VycmVudCwgYnV0IHRoZSBncmFwaCBtYXkgbm90IG1hdGNoIGl0LiBSZS1hbmFseXplIGJlZm9yZSB0cnVzdGluZyB0aGUgcmFuZ2UuJztcbiAgfSBlbHNlIGlmIChpbnRlZ3JpdHkgPT09ICdtaXNzaW5nJykge1xuICAgIG1lc3NhZ2UgPSBzbGljZS5yZWFzb24gfHwgJ1RoZSBhbmFseXplZCBkb2N1bWVudCBpcyBubyBsb25nZXIgYXZhaWxhYmxlLic7XG4gIH0gZWxzZSBpZiAoZW1wdHkpIHtcbiAgICBtZXNzYWdlID0gJ1RoaXMgcmFuZ2UgaGFzIG5vIHNvdXJjZSBjb250ZW50Lic7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHRpdGxlLFxuICAgIGtpbmQ6IFN0cmluZyhub2RlPy5raW5kID8/ICdub2RlJyksXG4gICAgZmlsZTogU3RyaW5nKHNsaWNlLnJlbGF0aXZlUGF0aCA/PyByYW5nZT8uZmlsZUlkID8/ICcnKSxcbiAgICBsaW5lTGFiZWwsXG4gICAgdGV4dDogdHJpbW1lZC50ZXh0LFxuICAgIHRydW5jYXRlZDogQm9vbGVhbih0cmltbWVkLnRydW5jYXRlZCB8fCBzbGljZS50cnVuY2F0ZWQpLFxuICAgIHN5bnRoZXRpYzogZmFsc2UsXG4gICAgc3RhbGUsXG4gICAgZW1wdHksXG4gICAgbWVzc2FnZSxcbiAgICBpbnRlZ3JpdHksXG4gICAgZG9jdW1lbnRWZXJzaW9uOiBOdW1iZXIuaXNJbnRlZ2VyKHNsaWNlLmRvY3VtZW50VmVyc2lvbikgPyBzbGljZS5kb2N1bWVudFZlcnNpb24gOiBudWxsLFxuICB9O1xufVxuIiwgIi8qKlxuICogUHJldmlldyBhbmQgbmF2aWdhdGlvbiBzZXR0aW5ncy5cbiAqXG4gKiBUaGUgZGVmYXVsdHMgaGVyZSBhcmUgdGhlIGNvbnRyYWN0LiBgcGFja2FnZS5qc29uYCBkZWNsYXJlcyB0aGUgc2FtZSBrZXlzIGFuZFxuICogZGVmYXVsdHM7IGB0ZXN0cy91bml0L3NvdXJjZVNldHRpbmdzLnRlc3QuanNgIGtlZXBzIHRoZSBtYW5pZmVzdCBhbmQgdGhpc1xuICogbW9kdWxlIGluIHN5bmMuXG4gKi9cblxuZXhwb3J0IGNvbnN0IFBSRVZJRVdfREVGQVVMVFMgPSBPYmplY3QuZnJlZXplKHtcbiAgZW5hYmxlZDogdHJ1ZSxcbiAgZGVsYXlNczogMzAwLFxuICBtYXhMaW5lczogMTIsXG4gIHN5bnRheEhpZ2hsaWdodGluZzogdHJ1ZSxcbiAgY2xpY2tUb05hdmlnYXRlOiB0cnVlLFxuICBwaW5CeURlZmF1bHQ6IGZhbHNlLFxuICBvcGVuSW5QcmV2aWV3VGFiOiBmYWxzZSxcbn0pO1xuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEBwYXJhbSB7bnVtYmVyfSBmYWxsYmFja1xuICogQHBhcmFtIHtudW1iZXJ9IG1pblxuICogQHBhcmFtIHtudW1iZXJ9IG1heFxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gY2xhbXBJbnRlZ2VyKHZhbHVlLCBmYWxsYmFjaywgbWluLCBtYXgpIHtcbiAgY29uc3QgY2FuZGlkYXRlID0gTnVtYmVyKHZhbHVlKTtcbiAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoY2FuZGlkYXRlKSkge1xuICAgIHJldHVybiBmYWxsYmFjaztcbiAgfVxuICByZXR1cm4gTWF0aC5taW4obWF4LCBNYXRoLm1heChtaW4sIE1hdGgudHJ1bmMoY2FuZGlkYXRlKSkpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gZmFsbGJhY2tcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBhc0Jvb2xlYW4odmFsdWUsIGZhbGxiYWNrKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJyA/IHZhbHVlIDogZmFsbGJhY2s7XG59XG5cbi8qKlxuICogTm9ybWFsaXplIHNldHRpbmdzIGZyb20gYW55IHNvdXJjZSAoVlMgQ29kZSBjb25maWd1cmF0aW9uLCBwcm90b2NvbCBwYXlsb2FkLFxuICogdGVzdHMpLiBVbmtub3duIHNoYXBlcyBmYWxsIGJhY2sgdG8gdGhlIGRvY3VtZW50ZWQgZGVmYXVsdHM7IG5vdGhpbmcgdGhyb3dzLlxuICpcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IFtyYXddXG4gKiBAcmV0dXJucyB7e2VuYWJsZWQ6IGJvb2xlYW4sIGRlbGF5TXM6IG51bWJlciwgbWF4TGluZXM6IG51bWJlciwgc3ludGF4SGlnaGxpZ2h0aW5nOiBib29sZWFuLCBjbGlja1RvTmF2aWdhdGU6IGJvb2xlYW4sIHBpbkJ5RGVmYXVsdDogYm9vbGVhbiwgb3BlbkluUHJldmlld1RhYjogYm9vbGVhbn19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlUHJldmlld1NldHRpbmdzKHJhdyA9IHt9KSB7XG4gIGNvbnN0IHNvdXJjZSA9IHJhdyAmJiB0eXBlb2YgcmF3ID09PSAnb2JqZWN0JyA/IHJhdyA6IHt9O1xuICByZXR1cm4ge1xuICAgIGVuYWJsZWQ6IGFzQm9vbGVhbihzb3VyY2UuZW5hYmxlZCwgUFJFVklFV19ERUZBVUxUUy5lbmFibGVkKSxcbiAgICBkZWxheU1zOiBjbGFtcEludGVnZXIoc291cmNlLmRlbGF5TXMsIFBSRVZJRVdfREVGQVVMVFMuZGVsYXlNcywgMCwgMl8wMDApLFxuICAgIG1heExpbmVzOiBjbGFtcEludGVnZXIoc291cmNlLm1heExpbmVzLCBQUkVWSUVXX0RFRkFVTFRTLm1heExpbmVzLCA0LCA0MCksXG4gICAgc3ludGF4SGlnaGxpZ2h0aW5nOiBhc0Jvb2xlYW4oc291cmNlLnN5bnRheEhpZ2hsaWdodGluZywgUFJFVklFV19ERUZBVUxUUy5zeW50YXhIaWdobGlnaHRpbmcpLFxuICAgIGNsaWNrVG9OYXZpZ2F0ZTogYXNCb29sZWFuKHNvdXJjZS5jbGlja1RvTmF2aWdhdGUsIFBSRVZJRVdfREVGQVVMVFMuY2xpY2tUb05hdmlnYXRlKSxcbiAgICBwaW5CeURlZmF1bHQ6IGFzQm9vbGVhbihzb3VyY2UucGluQnlEZWZhdWx0LCBQUkVWSUVXX0RFRkFVTFRTLnBpbkJ5RGVmYXVsdCksXG4gICAgb3BlbkluUHJldmlld1RhYjogYXNCb29sZWFuKHNvdXJjZS5vcGVuSW5QcmV2aWV3VGFiLCBQUkVWSUVXX0RFRkFVTFRTLm9wZW5JblByZXZpZXdUYWIpLFxuICB9O1xufVxuXG4vKipcbiAqIFRydWUgd2hlbiBhIGNvbmZpZ3VyYXRpb24tY2hhbmdlIGV2ZW50IHRvdWNoZXMgYSBrZXkgdGhpcyBtb2R1bGUgb3ducy5cbiAqXG4gKiBAcGFyYW0ge3thZmZlY3RzQ29uZmlndXJhdGlvbj86IChzZWN0aW9uOiBzdHJpbmcpID0+IGJvb2xlYW59fSBldmVudFxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXR0aW5nc0NoYW5nZWQoZXZlbnQpIHtcbiAgcmV0dXJuIChcbiAgICBCb29sZWFuKGV2ZW50Py5hZmZlY3RzQ29uZmlndXJhdGlvbj8uKCdjb2RlZmxvdy5wcmV2aWV3JykpIHx8XG4gICAgQm9vbGVhbihldmVudD8uYWZmZWN0c0NvbmZpZ3VyYXRpb24/LignY29kZWZsb3cubmF2aWdhdGlvbicpKVxuICApO1xufVxuIiwgIi8qKlxuICogRXhwbGFuYXRpb24gc2V0dGluZ3MgZGVmYXVsdHMgYW5kIG5vcm1hbGl6YXRpb24uXG4gKlxuICogYHBhY2thZ2UuanNvbmAgZGVjbGFyZXMgdGhlIHNhbWUgZGVmYXVsdHM7IGB0ZXN0cy91bml0L2V4cGxhbmF0aW9uU2V0dGluZ3MudGVzdC5qc2BcbiAqIGVuZm9yY2VzIDE6MSBwYXJpdHkuXG4gKi9cblxuZXhwb3J0IGNvbnN0IEVYUExBTkFUSU9OX0RFRkFVTFRTID0gT2JqZWN0LmZyZWV6ZSh7XG4gIGRlZmF1bHREZXB0aDogMixcbiAgc2hvd0V2aWRlbmNlOiB0cnVlLFxuICBpbmNsdWRlTGltaXRhdGlvbnM6IHRydWUsXG59KTtcblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcmV0dXJucyB7MXwyfDN8NH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsYW1wRXhwbGFuYXRpb25EZXB0aCh2YWx1ZSkge1xuICBjb25zdCBudW0gPSBOdW1iZXIodmFsdWUpO1xuICBpZiAoIU51bWJlci5pc0Zpbml0ZShudW0pKSB7XG4gICAgcmV0dXJuIEVYUExBTkFUSU9OX0RFRkFVTFRTLmRlZmF1bHREZXB0aDtcbiAgfVxuICBjb25zdCBjbGFtcGVkID0gTWF0aC5taW4oNCwgTWF0aC5tYXgoMSwgTWF0aC50cnVuYyhudW0pKSk7XG4gIHJldHVybiAvKiogQHR5cGUgezF8MnwzfDR9ICovIChjbGFtcGVkKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGZhbGxiYWNrXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gYXNCb29sZWFuKHZhbHVlLCBmYWxsYmFjaykge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbicgPyB2YWx1ZSA6IGZhbGxiYWNrO1xufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSBleHBsYW5hdGlvbiBzZXR0aW5ncyBmcm9tIFZTIENvZGUgY29uZmlndXJhdGlvbiwgcHJvdG9jb2wgcGF5bG9hZHMsXG4gKiBvciB0ZXN0IGlucHV0cyB3aXRob3V0IHRocm93aW5nLlxuICpcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IFtyYXddXG4gKiBAcmV0dXJucyB7e2RlZmF1bHREZXB0aDogMXwyfDN8NCwgc2hvd0V2aWRlbmNlOiBib29sZWFuLCBpbmNsdWRlTGltaXRhdGlvbnM6IGJvb2xlYW59fVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZUV4cGxhbmF0aW9uU2V0dGluZ3MocmF3ID0ge30pIHtcbiAgY29uc3Qgc291cmNlID0gcmF3ICYmIHR5cGVvZiByYXcgPT09ICdvYmplY3QnID8gcmF3IDoge307XG4gIHJldHVybiB7XG4gICAgZGVmYXVsdERlcHRoOiBjbGFtcEV4cGxhbmF0aW9uRGVwdGgoc291cmNlLmRlZmF1bHREZXB0aCksXG4gICAgc2hvd0V2aWRlbmNlOiBhc0Jvb2xlYW4oc291cmNlLnNob3dFdmlkZW5jZSwgRVhQTEFOQVRJT05fREVGQVVMVFMuc2hvd0V2aWRlbmNlKSxcbiAgICBpbmNsdWRlTGltaXRhdGlvbnM6IGFzQm9vbGVhbihcbiAgICAgIHNvdXJjZS5pbmNsdWRlTGltaXRhdGlvbnMsXG4gICAgICBFWFBMQU5BVElPTl9ERUZBVUxUUy5pbmNsdWRlTGltaXRhdGlvbnMsXG4gICAgKSxcbiAgfTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3thZmZlY3RzQ29uZmlndXJhdGlvbj86IChzZWN0aW9uOiBzdHJpbmcpID0+IGJvb2xlYW59fSBldmVudFxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHBsYW5hdGlvblNldHRpbmdzQ2hhbmdlZChldmVudCkge1xuICByZXR1cm4gQm9vbGVhbihldmVudD8uYWZmZWN0c0NvbmZpZ3VyYXRpb24/LignY29kZWZsb3cuZXhwbGFuYXRpb24nKSk7XG59XG4iLCAiLyoqXG4gKiBIb3Zlci1pbnRlbnQgc3RhdGUgbWFjaGluZS5cbiAqXG4gKiBEd2VsbCB0aW1lIHBsdXMgcG9pbnRlciBzdGFiaWxpdHkgcHJldmVudHMgcHJldmlldyBmbGlja2VyIHdoaWxlIHNjYW5uaW5nIGFcbiAqIGdyYXBoLiBUaGUgY29udHJvbGxlciBvd25zIHRpbWVycyBidXQgbm8gRE9NLCBzbyB0aGUgYmVoYXZpb3VyIGlzIHRlc3RhYmxlXG4gKiB3aXRoIGEgZmFrZSBjbG9jay5cbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHt7eDogbnVtYmVyLCB5OiBudW1iZXJ9fSBQb2ludFxuICovXG5cbi8qKlxuICogQHBhcmFtIHt7XG4gKiAgIGRlbGF5TXM/OiBudW1iZXIsXG4gKiAgIG1vdmVUb2xlcmFuY2U/OiBudW1iZXIsXG4gKiAgIGdyYWNlTXM/OiBudW1iZXIsXG4gKiAgIGVuYWJsZWQ/OiBib29sZWFuLFxuICogICBzZXRUaW1lb3V0PzogKGhhbmRsZXI6IEZ1bmN0aW9uLCBtczogbnVtYmVyKSA9PiB1bmtub3duLFxuICogICBjbGVhclRpbWVvdXQ/OiAoaGFuZGxlOiB1bmtub3duKSA9PiB2b2lkLFxuICogICBvblNob3c/OiAobm9kZUlkOiBzdHJpbmcsIGFuY2hvcjogUG9pbnQpID0+IHZvaWQsXG4gKiAgIG9uSGlkZT86IChub2RlSWQ6IHN0cmluZ3xudWxsKSA9PiB2b2lkLFxuICogfX0gW29wdGlvbnNdXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQcmV2aWV3Q29udHJvbGxlcihvcHRpb25zID0ge30pIHtcbiAgY29uc3Qgc2NoZWR1bGUgPSBvcHRpb25zLnNldFRpbWVvdXQgPz8gKChoYW5kbGVyLCBtcykgPT4gc2V0VGltZW91dChoYW5kbGVyLCBtcykpO1xuICBjb25zdCBjYW5jZWwgPSBvcHRpb25zLmNsZWFyVGltZW91dCA/PyAoKGhhbmRsZSkgPT4gY2xlYXJUaW1lb3V0KGhhbmRsZSkpO1xuXG4gIGxldCBkZWxheU1zID0gTWF0aC5tYXgoMCwgTnVtYmVyKG9wdGlvbnMuZGVsYXlNcyA/PyAzMDApKTtcbiAgbGV0IG1vdmVUb2xlcmFuY2UgPSBNYXRoLm1heCgwLCBOdW1iZXIob3B0aW9ucy5tb3ZlVG9sZXJhbmNlID8/IDEyKSk7XG4gIGNvbnN0IGdyYWNlTXMgPSBNYXRoLm1heCgwLCBOdW1iZXIob3B0aW9ucy5ncmFjZU1zID8/IDE1MCkpO1xuICBsZXQgZW5hYmxlZCA9IG9wdGlvbnMuZW5hYmxlZCAhPT0gZmFsc2U7XG4gIGxldCBwaW5CeURlZmF1bHQgPSBCb29sZWFuKG9wdGlvbnMucGluQnlEZWZhdWx0KTtcblxuICBsZXQgY3VycmVudElkID0gbnVsbDtcbiAgbGV0IGFuY2hvciA9IHsgeDogMCwgeTogMCB9O1xuICBsZXQgZHdlbGxUaW1lciA9IG51bGw7XG4gIGxldCBncmFjZVRpbWVyID0gbnVsbDtcbiAgbGV0IHBvaW50ZXJJbnNpZGUgPSBmYWxzZTtcbiAgbGV0IHBpbm5lZCA9IGZhbHNlO1xuICBsZXQgdmlzaWJsZSA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGNsZWFyRHdlbGwoKSB7XG4gICAgaWYgKGR3ZWxsVGltZXIgIT09IG51bGwpIHtcbiAgICAgIGNhbmNlbChkd2VsbFRpbWVyKTtcbiAgICAgIGR3ZWxsVGltZXIgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyR3JhY2UoKSB7XG4gICAgaWYgKGdyYWNlVGltZXIgIT09IG51bGwpIHtcbiAgICAgIGNhbmNlbChncmFjZVRpbWVyKTtcbiAgICAgIGdyYWNlVGltZXIgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3coKSB7XG4gICAgaWYgKCFlbmFibGVkIHx8IGN1cnJlbnRJZCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2aXNpYmxlID0gdHJ1ZTtcbiAgICBpZiAocGluQnlEZWZhdWx0KSB7XG4gICAgICBwaW5uZWQgPSB0cnVlO1xuICAgIH1cbiAgICBvcHRpb25zLm9uU2hvdz8uKGN1cnJlbnRJZCwgeyAuLi5hbmNob3IgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBoaWRlKCkge1xuICAgIGNsZWFyRHdlbGwoKTtcbiAgICBjbGVhckdyYWNlKCk7XG4gICAgaWYgKCF2aXNpYmxlICYmIGN1cnJlbnRJZCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBwcmV2aW91cyA9IGN1cnJlbnRJZDtcbiAgICB2aXNpYmxlID0gZmFsc2U7XG4gICAgY3VycmVudElkID0gbnVsbDtcbiAgICBwaW5uZWQgPSBmYWxzZTtcbiAgICBvcHRpb25zLm9uSGlkZT8uKHByZXZpb3VzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFybUR3ZWxsKCkge1xuICAgIGNsZWFyRHdlbGwoKTtcbiAgICBpZiAoIWVuYWJsZWQgfHwgY3VycmVudElkID09PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGR3ZWxsVGltZXIgPSBzY2hlZHVsZSgoKSA9PiB7XG4gICAgICBkd2VsbFRpbWVyID0gbnVsbDtcbiAgICAgIHNob3coKTtcbiAgICB9LCBkZWxheU1zKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFybUdyYWNlKCkge1xuICAgIGlmIChwaW5uZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY2xlYXJHcmFjZSgpO1xuICAgIGdyYWNlVGltZXIgPSBzY2hlZHVsZSgoKSA9PiB7XG4gICAgICBncmFjZVRpbWVyID0gbnVsbDtcbiAgICAgIGhpZGUoKTtcbiAgICB9LCBncmFjZU1zKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZFxuICAgICAqIEBwYXJhbSB7UG9pbnR9IHBvaW50XG4gICAgICovXG4gICAgcG9pbnRlckVudGVyKG5vZGVJZCwgcG9pbnQpIHtcbiAgICAgIGlmICh0eXBlb2Ygbm9kZUlkICE9PSAnc3RyaW5nJyB8fCBub2RlSWQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHBvaW50ZXJJbnNpZGUgPSB0cnVlO1xuICAgICAgY2xlYXJHcmFjZSgpO1xuICAgICAgaWYgKHZpc2libGUgJiYgY3VycmVudElkID09PSBub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHZpc2libGUpIHtcbiAgICAgICAgb3B0aW9ucy5vbkhpZGU/LihjdXJyZW50SWQpO1xuICAgICAgICB2aXNpYmxlID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBjdXJyZW50SWQgPSBub2RlSWQ7XG4gICAgICBhbmNob3IgPSB7IHg6IE51bWJlcihwb2ludD8ueCA/PyAwKSwgeTogTnVtYmVyKHBvaW50Py55ID8/IDApIH07XG4gICAgICBwaW5uZWQgPSBmYWxzZTtcbiAgICAgIGFybUR3ZWxsKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1vdmVtZW50IGxhcmdlciB0aGFuIHRoZSB0b2xlcmFuY2UgcmVzdGFydHMgdGhlIGR3ZWxsIHRpbWVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQb2ludH0gcG9pbnRcbiAgICAgKi9cbiAgICBwb2ludGVyTW92ZShwb2ludCkge1xuICAgICAgaWYgKGN1cnJlbnRJZCA9PT0gbnVsbCB8fCB2aXNpYmxlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHggPSBOdW1iZXIocG9pbnQ/LnggPz8gMCk7XG4gICAgICBjb25zdCB5ID0gTnVtYmVyKHBvaW50Py55ID8/IDApO1xuICAgICAgY29uc3QgZHggPSB4IC0gYW5jaG9yLng7XG4gICAgICBjb25zdCBkeSA9IHkgLSBhbmNob3IueTtcbiAgICAgIGlmIChNYXRoLmh5cG90KGR4LCBkeSkgPiBtb3ZlVG9sZXJhbmNlKSB7XG4gICAgICAgIGFuY2hvciA9IHsgeCwgeSB9O1xuICAgICAgICBhcm1Ed2VsbCgpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAvKiogUG9pbnRlciBsZWZ0IHRoZSBub2RlOiBnaXZlIHRoZSB1c2VyIHRpbWUgdG8gcmVhY2ggdGhlIGNhcmQuICovXG4gICAgcG9pbnRlckxlYXZlKCkge1xuICAgICAgcG9pbnRlckluc2lkZSA9IGZhbHNlO1xuICAgICAgY2xlYXJEd2VsbCgpO1xuICAgICAgaWYgKCF2aXNpYmxlKSB7XG4gICAgICAgIGN1cnJlbnRJZCA9IG51bGw7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGFybUdyYWNlKCk7XG4gICAgfSxcblxuICAgIC8qKiBQb2ludGVyIGVudGVyZWQgdGhlIGNhcmQ7IGNhbmNlbCB0aGUgaGlkZS4gKi9cbiAgICBwb2ludGVyRW50ZXJDYXJkKCkge1xuICAgICAgcG9pbnRlckluc2lkZSA9IHRydWU7XG4gICAgICBjbGVhckdyYWNlKCk7XG4gICAgfSxcblxuICAgIHBvaW50ZXJMZWF2ZUNhcmQoKSB7XG4gICAgICBwb2ludGVySW5zaWRlID0gZmFsc2U7XG4gICAgICBpZiAodmlzaWJsZSkge1xuICAgICAgICBhcm1HcmFjZSgpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICB0b2dnbGVQaW4oKSB7XG4gICAgICBwaW5uZWQgPSAhcGlubmVkO1xuICAgICAgaWYgKHBpbm5lZCkge1xuICAgICAgICBjbGVhckdyYWNlKCk7XG4gICAgICB9IGVsc2UgaWYgKCFwb2ludGVySW5zaWRlKSB7XG4gICAgICAgIGFybUdyYWNlKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGlubmVkO1xuICAgIH0sXG5cbiAgICAvKiogQHBhcmFtIHtib29sZWFufSB2YWx1ZSAqL1xuICAgIHNldFBpbm5lZCh2YWx1ZSkge1xuICAgICAgcGlubmVkID0gQm9vbGVhbih2YWx1ZSk7XG4gICAgICBpZiAocGlubmVkKSB7XG4gICAgICAgIGNsZWFyR3JhY2UoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwaW5uZWQ7XG4gICAgfSxcblxuICAgIC8qKiBFc2MgYWx3YXlzIGV4aXRzLCBldmVuIHdoZW4gcGlubmVkLiAqL1xuICAgIGRpc21pc3MoKSB7XG4gICAgICBoaWRlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIExpdmUgc2V0dGluZ3MgY2hhbmdlcyBtdXN0IG5vdCByZXF1aXJlIGEgcmVsb2FkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHt7ZGVsYXlNcz86IG51bWJlciwgZW5hYmxlZD86IGJvb2xlYW4sIG1vdmVUb2xlcmFuY2U/OiBudW1iZXIsIHBpbkJ5RGVmYXVsdD86IGJvb2xlYW59fSBuZXh0XG4gICAgICovXG4gICAgY29uZmlndXJlKG5leHQgPSB7fSkge1xuICAgICAgaWYgKG5leHQuZGVsYXlNcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGRlbGF5TXMgPSBNYXRoLm1heCgwLCBOdW1iZXIobmV4dC5kZWxheU1zKSk7XG4gICAgICB9XG4gICAgICBpZiAobmV4dC5tb3ZlVG9sZXJhbmNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbW92ZVRvbGVyYW5jZSA9IE1hdGgubWF4KDAsIE51bWJlcihuZXh0Lm1vdmVUb2xlcmFuY2UpKTtcbiAgICAgIH1cbiAgICAgIGlmIChuZXh0LnBpbkJ5RGVmYXVsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHBpbkJ5RGVmYXVsdCA9IEJvb2xlYW4obmV4dC5waW5CeURlZmF1bHQpO1xuICAgICAgfVxuICAgICAgaWYgKG5leHQuZW5hYmxlZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGVuYWJsZWQgPSBCb29sZWFuKG5leHQuZW5hYmxlZCk7XG4gICAgICAgIGlmICghZW5hYmxlZCkge1xuICAgICAgICAgIGhpZGUoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBpc1Zpc2libGU6ICgpID0+IHZpc2libGUsXG4gICAgaXNQaW5uZWQ6ICgpID0+IHBpbm5lZCxcbiAgICBjdXJyZW50SWQ6ICgpID0+IGN1cnJlbnRJZCxcbiAgICBkZXN0cm95KCkge1xuICAgICAgY2xlYXJEd2VsbCgpO1xuICAgICAgY2xlYXJHcmFjZSgpO1xuICAgICAgY3VycmVudElkID0gbnVsbDtcbiAgICAgIHZpc2libGUgPSBmYWxzZTtcbiAgICAgIHBpbm5lZCA9IGZhbHNlO1xuICAgIH0sXG4gIH07XG59XG4iLCAiLy8gaHR0cHM6Ly9ub2RlanMub3JnL2FwaS9wYWNrYWdlcy5odG1sI3BhY2thZ2VzX3dyaXRpbmdfZHVhbF9wYWNrYWdlc193aGlsZV9hdm9pZGluZ19vcl9taW5pbWl6aW5nX2hhemFyZHNcbmltcG9ydCBIaWdobGlnaHRKUyBmcm9tICcuLi9saWIvY29yZS5qcyc7XG5leHBvcnQgeyBIaWdobGlnaHRKUyB9O1xuZXhwb3J0IGRlZmF1bHQgSGlnaGxpZ2h0SlM7XG4iLCAiLypcbkxhbmd1YWdlOiBDKytcbkNhdGVnb3J5OiBjb21tb24sIHN5c3RlbVxuV2Vic2l0ZTogaHR0cHM6Ly9pc29jcHAub3JnXG4qL1xuXG4vKiogQHR5cGUgTGFuZ3VhZ2VGbiAqL1xuZnVuY3Rpb24gY3BwKGhsanMpIHtcbiAgY29uc3QgcmVnZXggPSBobGpzLnJlZ2V4O1xuICAvLyBhZGRlZCBmb3IgaGlzdG9yaWMgcmVhc29ucyBiZWNhdXNlIGBobGpzLkNfTElORV9DT01NRU5UX01PREVgIGRvZXNcbiAgLy8gbm90IGluY2x1ZGUgc3VjaCBzdXBwb3J0IG5vciBjYW4gd2UgYmUgc3VyZSBhbGwgdGhlIGdyYW1tYXJzIGRlcGVuZGluZ1xuICAvLyBvbiBpdCB3b3VsZCBkZXNpcmUgdGhpcyBiZWhhdmlvclxuICBjb25zdCBDX0xJTkVfQ09NTUVOVF9NT0RFID0gaGxqcy5DT01NRU5UKCcvLycsICckJywgeyBjb250YWluczogWyB7IGJlZ2luOiAvXFxcXFxcbi8gfSBdIH0pO1xuICBjb25zdCBERUNMVFlQRV9BVVRPX1JFID0gJ2RlY2x0eXBlXFxcXChhdXRvXFxcXCknO1xuICBjb25zdCBOQU1FU1BBQ0VfUkUgPSAnW2EtekEtWl9dXFxcXHcqOjonO1xuICBjb25zdCBURU1QTEFURV9BUkdVTUVOVF9SRSA9ICc8W148Pl0rPic7XG4gIGNvbnN0IEZVTkNUSU9OX1RZUEVfUkUgPSAnKD8hc3RydWN0KSgnXG4gICAgKyBERUNMVFlQRV9BVVRPX1JFICsgJ3wnXG4gICAgKyByZWdleC5vcHRpb25hbChOQU1FU1BBQ0VfUkUpXG4gICAgKyAnW2EtekEtWl9dXFxcXHcqJyArIHJlZ2V4Lm9wdGlvbmFsKFRFTVBMQVRFX0FSR1VNRU5UX1JFKVxuICArICcpJztcblxuICBjb25zdCBDUFBfUFJJTUlUSVZFX1RZUEVTID0ge1xuICAgIGNsYXNzTmFtZTogJ3R5cGUnLFxuICAgIGJlZ2luOiAnXFxcXGJbYS16XFxcXGRfXSpfdFxcXFxiJ1xuICB9O1xuXG4gIC8vIGh0dHBzOi8vZW4uY3BwcmVmZXJlbmNlLmNvbS93L2NwcC9sYW5ndWFnZS9lc2NhcGVcbiAgLy8gXFxcXCBcXHggXFx4RkYgXFx1MjgzNyBcXHUwMDMyMzc0NyBcXDM3NFxuICBjb25zdCBDSEFSQUNURVJfRVNDQVBFUyA9ICdcXFxcXFxcXCh4WzAtOUEtRmEtZl17Mn18dVswLTlBLUZhLWZdezQsOH18WzAtN117M318XFxcXFMpJztcbiAgY29uc3QgU1RSSU5HUyA9IHtcbiAgICBjbGFzc05hbWU6ICdzdHJpbmcnLFxuICAgIHZhcmlhbnRzOiBbXG4gICAgICB7XG4gICAgICAgIGJlZ2luOiAnKHU4P3xVfEwpP1wiJyxcbiAgICAgICAgZW5kOiAnXCInLFxuICAgICAgICBpbGxlZ2FsOiAnXFxcXG4nLFxuICAgICAgICBjb250YWluczogWyBobGpzLkJBQ0tTTEFTSF9FU0NBUEUgXVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgYmVnaW46ICcodTg/fFV8TCk/XFwnKCcgKyBDSEFSQUNURVJfRVNDQVBFUyArICd8LiknLFxuICAgICAgICBlbmQ6ICdcXCcnLFxuICAgICAgICBpbGxlZ2FsOiAnLidcbiAgICAgIH0sXG4gICAgICBobGpzLkVORF9TQU1FX0FTX0JFR0lOKHtcbiAgICAgICAgYmVnaW46IC8oPzp1OD98VXxMKT9SXCIoW14oKVxcXFwgXXswLDE2fSlcXCgvLFxuICAgICAgICBlbmQ6IC9cXCkoW14oKVxcXFwgXXswLDE2fSlcIi9cbiAgICAgIH0pXG4gICAgXVxuICB9O1xuXG4gIGNvbnN0IE5VTUJFUlMgPSB7XG4gICAgY2xhc3NOYW1lOiAnbnVtYmVyJyxcbiAgICB2YXJpYW50czogW1xuICAgICAgLy8gRmxvYXRpbmctcG9pbnQgbGl0ZXJhbC5cbiAgICAgIHsgYmVnaW46XG4gICAgICAgIFwiWystXT8oPzpcIiAvLyBMZWFkaW5nIHNpZ24uXG4gICAgICAgICAgLy8gRGVjaW1hbC5cbiAgICAgICAgICArIFwiKD86XCJcbiAgICAgICAgICAgICtcIlswLTldKD86Jz9bMC05XSkqXFxcXC4oPzpbMC05XSg/Oic/WzAtOV0pKik/XCJcbiAgICAgICAgICAgICsgXCJ8XFxcXC5bMC05XSg/Oic/WzAtOV0pKlwiXG4gICAgICAgICAgKyBcIikoPzpbRWVdWystXT9bMC05XSg/Oic/WzAtOV0pKik/XCJcbiAgICAgICAgICArIFwifFswLTldKD86Jz9bMC05XSkqW0VlXVsrLV0/WzAtOV0oPzonP1swLTldKSpcIlxuICAgICAgICAgIC8vIEhleGFkZWNpbWFsLlxuICAgICAgICAgICsgXCJ8MFtYeF0oPzpcIlxuICAgICAgICAgICAgK1wiWzAtOUEtRmEtZl0oPzonP1swLTlBLUZhLWZdKSooPzpcXFxcLig/OlswLTlBLUZhLWZdKD86Jz9bMC05QS1GYS1mXSkqKT8pP1wiXG4gICAgICAgICAgICArIFwifFxcXFwuWzAtOUEtRmEtZl0oPzonP1swLTlBLUZhLWZdKSpcIlxuICAgICAgICAgICsgXCIpW1BwXVsrLV0/WzAtOV0oPzonP1swLTldKSpcIlxuICAgICAgICArIFwiKSg/OlwiIC8vIExpdGVyYWwgc3VmZml4ZXMuXG4gICAgICAgICAgKyBcIltGZl0oPzoxNnwzMnw2NHwxMjgpP1wiXG4gICAgICAgICAgKyBcInwoQkZ8YmYpMTZcIlxuICAgICAgICAgICsgXCJ8W0xsXVwiXG4gICAgICAgICAgKyBcInxcIiAvLyBMaXRlcmFsIHN1ZmZpeCBpcyBvcHRpb25hbC5cbiAgICAgICAgKyBcIilcIlxuICAgICAgfSxcbiAgICAgIC8vIEludGVnZXIgbGl0ZXJhbC5cbiAgICAgIHsgYmVnaW46XG4gICAgICAgIFwiWystXT9cXFxcYig/OlwiIC8vIExlYWRpbmcgc2lnbi5cbiAgICAgICAgICArIFwiMFtCYl1bMDFdKD86Jz9bMDFdKSpcIiAvLyBCaW5hcnkuXG4gICAgICAgICAgKyBcInwwW1h4XVswLTlBLUZhLWZdKD86Jz9bMC05QS1GYS1mXSkqXCIgLy8gSGV4YWRlY2ltYWwuXG4gICAgICAgICAgKyBcInwwKD86Jz9bMC03XSkqXCIgLy8gT2N0YWwgb3IganVzdCBhIGxvbmUgemVyby5cbiAgICAgICAgICArIFwifFsxLTldKD86Jz9bMC05XSkqXCIgLy8gRGVjaW1hbC5cbiAgICAgICAgKyBcIikoPzpcIiAvLyBMaXRlcmFsIHN1ZmZpeGVzLlxuICAgICAgICAgICsgXCJbVXVdKD86TEw/fGxsPylcIlxuICAgICAgICAgICsgXCJ8W1V1XVtael0/XCJcbiAgICAgICAgICArIFwifCg/OkxMP3xsbD8pW1V1XT9cIlxuICAgICAgICAgICsgXCJ8W1p6XVtVdV1cIlxuICAgICAgICAgICsgXCJ8XCIgLy8gTGl0ZXJhbCBzdWZmaXggaXMgb3B0aW9uYWwuXG4gICAgICAgICsgXCIpXCJcbiAgICAgICAgLy8gTm90ZTogdGhlcmUgYXJlIHVzZXItZGVmaW5lZCBsaXRlcmFsIHN1ZmZpeGVzIHRvbywgYnV0IHBlcmhhcHMgaGF2aW5nIHRoZSBjdXN0b20gc3VmZml4IG5vdCBwYXJ0IG9mIHRoZVxuICAgICAgICAvLyBsaXRlcmFsIGhpZ2hsaWdodCBhY3R1YWxseSBtYWtlcyBpdCBzdGFuZCBvdXQgbW9yZS5cbiAgICAgIH1cbiAgICBdLFxuICAgIHJlbGV2YW5jZTogMFxuICB9O1xuXG4gIGNvbnN0IFBSRVBST0NFU1NPUiA9IHtcbiAgICBjbGFzc05hbWU6ICdtZXRhJyxcbiAgICBiZWdpbjogLyNcXHMqW2Etel0rXFxiLyxcbiAgICBlbmQ6IC8kLyxcbiAgICBrZXl3b3JkczogeyBrZXl3b3JkOlxuICAgICAgICAnaWYgZWxzZSBlbGlmIGVuZGlmIGRlZmluZSB1bmRlZiB3YXJuaW5nIGVycm9yIGxpbmUgJ1xuICAgICAgICArICdwcmFnbWEgX1ByYWdtYSBpZmRlZiBpZm5kZWYgaW5jbHVkZScgfSxcbiAgICBjb250YWluczogW1xuICAgICAge1xuICAgICAgICBiZWdpbjogL1xcXFxcXG4vLFxuICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgIH0sXG4gICAgICBobGpzLmluaGVyaXQoU1RSSU5HUywgeyBjbGFzc05hbWU6ICdzdHJpbmcnIH0pLFxuICAgICAge1xuICAgICAgICBjbGFzc05hbWU6ICdzdHJpbmcnLFxuICAgICAgICBiZWdpbjogLzwuKj8+L1xuICAgICAgfSxcbiAgICAgIENfTElORV9DT01NRU5UX01PREUsXG4gICAgICBobGpzLkNfQkxPQ0tfQ09NTUVOVF9NT0RFXG4gICAgXVxuICB9O1xuXG4gIGNvbnN0IFRJVExFX01PREUgPSB7XG4gICAgY2xhc3NOYW1lOiAndGl0bGUnLFxuICAgIGJlZ2luOiByZWdleC5vcHRpb25hbChOQU1FU1BBQ0VfUkUpICsgaGxqcy5JREVOVF9SRSxcbiAgICByZWxldmFuY2U6IDBcbiAgfTtcblxuICBjb25zdCBGVU5DVElPTl9USVRMRSA9IHJlZ2V4Lm9wdGlvbmFsKE5BTUVTUEFDRV9SRSkgKyBobGpzLklERU5UX1JFICsgJ1xcXFxzKlxcXFwoJztcblxuICAvLyBodHRwczovL2VuLmNwcHJlZmVyZW5jZS5jb20vdy9jcHAva2V5d29yZFxuICBjb25zdCBSRVNFUlZFRF9LRVlXT1JEUyA9IFtcbiAgICAnYWxpZ25hcycsXG4gICAgJ2FsaWdub2YnLFxuICAgICdhbmQnLFxuICAgICdhbmRfZXEnLFxuICAgICdhc20nLFxuICAgICdhdG9taWNfY2FuY2VsJyxcbiAgICAnYXRvbWljX2NvbW1pdCcsXG4gICAgJ2F0b21pY19ub2V4Y2VwdCcsXG4gICAgJ2F1dG8nLFxuICAgICdiaXRhbmQnLFxuICAgICdiaXRvcicsXG4gICAgJ2JyZWFrJyxcbiAgICAnY2FzZScsXG4gICAgJ2NhdGNoJyxcbiAgICAnY2xhc3MnLFxuICAgICdjb19hd2FpdCcsXG4gICAgJ2NvX3JldHVybicsXG4gICAgJ2NvX3lpZWxkJyxcbiAgICAnY29tcGwnLFxuICAgICdjb25jZXB0JyxcbiAgICAnY29uc3RfY2FzdHwxMCcsXG4gICAgJ2NvbnN0ZXZhbCcsXG4gICAgJ2NvbnN0ZXhwcicsXG4gICAgJ2NvbnN0aW5pdCcsXG4gICAgJ2NvbnRpbnVlJyxcbiAgICAnZGVjbHR5cGUnLFxuICAgICdkZWZhdWx0JyxcbiAgICAnZGVsZXRlJyxcbiAgICAnZG8nLFxuICAgICdkeW5hbWljX2Nhc3R8MTAnLFxuICAgICdlbHNlJyxcbiAgICAnZW51bScsXG4gICAgJ2V4cGxpY2l0JyxcbiAgICAnZXhwb3J0JyxcbiAgICAnZXh0ZXJuJyxcbiAgICAnZmFsc2UnLFxuICAgICdmaW5hbCcsXG4gICAgJ2ZvcicsXG4gICAgJ2ZyaWVuZCcsXG4gICAgJ2dvdG8nLFxuICAgICdpZicsXG4gICAgJ2ltcG9ydCcsXG4gICAgJ2lubGluZScsXG4gICAgJ21vZHVsZScsXG4gICAgJ211dGFibGUnLFxuICAgICduYW1lc3BhY2UnLFxuICAgICduZXcnLFxuICAgICdub2V4Y2VwdCcsXG4gICAgJ25vdCcsXG4gICAgJ25vdF9lcScsXG4gICAgJ251bGxwdHInLFxuICAgICdvcGVyYXRvcicsXG4gICAgJ29yJyxcbiAgICAnb3JfZXEnLFxuICAgICdvdmVycmlkZScsXG4gICAgJ3ByaXZhdGUnLFxuICAgICdwcm90ZWN0ZWQnLFxuICAgICdwdWJsaWMnLFxuICAgICdyZWZsZXhwcicsXG4gICAgJ3JlZ2lzdGVyJyxcbiAgICAncmVpbnRlcnByZXRfY2FzdHwxMCcsXG4gICAgJ3JlcXVpcmVzJyxcbiAgICAncmV0dXJuJyxcbiAgICAnc2l6ZW9mJyxcbiAgICAnc3RhdGljX2Fzc2VydCcsXG4gICAgJ3N0YXRpY19jYXN0fDEwJyxcbiAgICAnc3RydWN0JyxcbiAgICAnc3dpdGNoJyxcbiAgICAnc3luY2hyb25pemVkJyxcbiAgICAndGVtcGxhdGUnLFxuICAgICd0aGlzJyxcbiAgICAndGhyZWFkX2xvY2FsJyxcbiAgICAndGhyb3cnLFxuICAgICd0cmFuc2FjdGlvbl9zYWZlJyxcbiAgICAndHJhbnNhY3Rpb25fc2FmZV9keW5hbWljJyxcbiAgICAndHJ1ZScsXG4gICAgJ3RyeScsXG4gICAgJ3R5cGVkZWYnLFxuICAgICd0eXBlaWQnLFxuICAgICd0eXBlbmFtZScsXG4gICAgJ3VuaW9uJyxcbiAgICAndXNpbmcnLFxuICAgICd2aXJ0dWFsJyxcbiAgICAndm9sYXRpbGUnLFxuICAgICd3aGlsZScsXG4gICAgJ3hvcicsXG4gICAgJ3hvcl9lcSdcbiAgXTtcblxuICAvLyBodHRwczovL2VuLmNwcHJlZmVyZW5jZS5jb20vdy9jcHAva2V5d29yZFxuICBjb25zdCBSRVNFUlZFRF9UWVBFUyA9IFtcbiAgICAnYm9vbCcsXG4gICAgJ2NoYXInLFxuICAgICdjaGFyMTZfdCcsXG4gICAgJ2NoYXIzMl90JyxcbiAgICAnY2hhcjhfdCcsXG4gICAgJ2RvdWJsZScsXG4gICAgJ2Zsb2F0JyxcbiAgICAnaW50JyxcbiAgICAnbG9uZycsXG4gICAgJ3Nob3J0JyxcbiAgICAndm9pZCcsXG4gICAgJ3djaGFyX3QnLFxuICAgICd1bnNpZ25lZCcsXG4gICAgJ3NpZ25lZCcsXG4gICAgJ2NvbnN0JyxcbiAgICAnc3RhdGljJ1xuICBdO1xuXG4gIGNvbnN0IFRZUEVfSElOVFMgPSBbXG4gICAgJ2FueScsXG4gICAgJ2F1dG9fcHRyJyxcbiAgICAnYmFycmllcicsXG4gICAgJ2JpbmFyeV9zZW1hcGhvcmUnLFxuICAgICdiaXRzZXQnLFxuICAgICdjb21wbGV4JyxcbiAgICAnY29uZGl0aW9uX3ZhcmlhYmxlJyxcbiAgICAnY29uZGl0aW9uX3ZhcmlhYmxlX2FueScsXG4gICAgJ2NvdW50aW5nX3NlbWFwaG9yZScsXG4gICAgJ2RlcXVlJyxcbiAgICAnZmFsc2VfdHlwZScsXG4gICAgJ2ZsYXRfbWFwJyxcbiAgICAnZmxhdF9zZXQnLFxuICAgICdmdXR1cmUnLFxuICAgICdpbWFnaW5hcnknLFxuICAgICdpbml0aWFsaXplcl9saXN0JyxcbiAgICAnaXN0cmluZ3N0cmVhbScsXG4gICAgJ2p0aHJlYWQnLFxuICAgICdsYXRjaCcsXG4gICAgJ2xvY2tfZ3VhcmQnLFxuICAgICdtdWx0aW1hcCcsXG4gICAgJ211bHRpc2V0JyxcbiAgICAnbXV0ZXgnLFxuICAgICdvcHRpb25hbCcsXG4gICAgJ29zdHJpbmdzdHJlYW0nLFxuICAgICdwYWNrYWdlZF90YXNrJyxcbiAgICAncGFpcicsXG4gICAgJ3Byb21pc2UnLFxuICAgICdwcmlvcml0eV9xdWV1ZScsXG4gICAgJ3F1ZXVlJyxcbiAgICAncmVjdXJzaXZlX211dGV4JyxcbiAgICAncmVjdXJzaXZlX3RpbWVkX211dGV4JyxcbiAgICAnc2NvcGVkX2xvY2snLFxuICAgICdzZXQnLFxuICAgICdzaGFyZWRfZnV0dXJlJyxcbiAgICAnc2hhcmVkX2xvY2snLFxuICAgICdzaGFyZWRfbXV0ZXgnLFxuICAgICdzaGFyZWRfdGltZWRfbXV0ZXgnLFxuICAgICdzaGFyZWRfcHRyJyxcbiAgICAnc3RhY2snLFxuICAgICdzdHJpbmdfdmlldycsXG4gICAgJ3N0cmluZ3N0cmVhbScsXG4gICAgJ3RpbWVkX211dGV4JyxcbiAgICAndGhyZWFkJyxcbiAgICAndHJ1ZV90eXBlJyxcbiAgICAndHVwbGUnLFxuICAgICd1bmlxdWVfbG9jaycsXG4gICAgJ3VuaXF1ZV9wdHInLFxuICAgICd1bm9yZGVyZWRfbWFwJyxcbiAgICAndW5vcmRlcmVkX211bHRpbWFwJyxcbiAgICAndW5vcmRlcmVkX211bHRpc2V0JyxcbiAgICAndW5vcmRlcmVkX3NldCcsXG4gICAgJ3ZhcmlhbnQnLFxuICAgICd2ZWN0b3InLFxuICAgICd3ZWFrX3B0cicsXG4gICAgJ3dzdHJpbmcnLFxuICAgICd3c3RyaW5nX3ZpZXcnXG4gIF07XG5cbiAgY29uc3QgRlVOQ1RJT05fSElOVFMgPSBbXG4gICAgJ2Fib3J0JyxcbiAgICAnYWJzJyxcbiAgICAnYWNvcycsXG4gICAgJ2FwcGx5JyxcbiAgICAnYXNfY29uc3QnLFxuICAgICdhc2luJyxcbiAgICAnYXRhbicsXG4gICAgJ2F0YW4yJyxcbiAgICAnY2FsbG9jJyxcbiAgICAnY2VpbCcsXG4gICAgJ2NlcnInLFxuICAgICdjaW4nLFxuICAgICdjbG9nJyxcbiAgICAnY29zJyxcbiAgICAnY29zaCcsXG4gICAgJ2NvdXQnLFxuICAgICdkZWNsdmFsJyxcbiAgICAnZW5kbCcsXG4gICAgJ2V4Y2hhbmdlJyxcbiAgICAnZXhpdCcsXG4gICAgJ2V4cCcsXG4gICAgJ2ZhYnMnLFxuICAgICdmbG9vcicsXG4gICAgJ2Ztb2QnLFxuICAgICdmb3J3YXJkJyxcbiAgICAnZnByaW50ZicsXG4gICAgJ2ZwdXRzJyxcbiAgICAnZnJlZScsXG4gICAgJ2ZyZXhwJyxcbiAgICAnZnNjYW5mJyxcbiAgICAnZnV0dXJlJyxcbiAgICAnaW52b2tlJyxcbiAgICAnaXNhbG51bScsXG4gICAgJ2lzYWxwaGEnLFxuICAgICdpc2NudHJsJyxcbiAgICAnaXNkaWdpdCcsXG4gICAgJ2lzZ3JhcGgnLFxuICAgICdpc2xvd2VyJyxcbiAgICAnaXNwcmludCcsXG4gICAgJ2lzcHVuY3QnLFxuICAgICdpc3NwYWNlJyxcbiAgICAnaXN1cHBlcicsXG4gICAgJ2lzeGRpZ2l0JyxcbiAgICAnbGFicycsXG4gICAgJ2xhdW5kZXInLFxuICAgICdsZGV4cCcsXG4gICAgJ2xvZycsXG4gICAgJ2xvZzEwJyxcbiAgICAnbWFrZV9wYWlyJyxcbiAgICAnbWFrZV9zaGFyZWQnLFxuICAgICdtYWtlX3NoYXJlZF9mb3Jfb3ZlcndyaXRlJyxcbiAgICAnbWFrZV90dXBsZScsXG4gICAgJ21ha2VfdW5pcXVlJyxcbiAgICAnbWFsbG9jJyxcbiAgICAnbWVtY2hyJyxcbiAgICAnbWVtY21wJyxcbiAgICAnbWVtY3B5JyxcbiAgICAnbWVtc2V0JyxcbiAgICAnbW9kZicsXG4gICAgJ21vdmUnLFxuICAgICdwb3cnLFxuICAgICdwcmludGYnLFxuICAgICdwdXRjaGFyJyxcbiAgICAncHV0cycsXG4gICAgJ3JlYWxsb2MnLFxuICAgICdzY2FuZicsXG4gICAgJ3NpbicsXG4gICAgJ3NpbmgnLFxuICAgICdzbnByaW50ZicsXG4gICAgJ3NwcmludGYnLFxuICAgICdzcXJ0JyxcbiAgICAnc3NjYW5mJyxcbiAgICAnc3RkJyxcbiAgICAnc3RkZXJyJyxcbiAgICAnc3RkaW4nLFxuICAgICdzdGRvdXQnLFxuICAgICdzdHJjYXQnLFxuICAgICdzdHJjaHInLFxuICAgICdzdHJjbXAnLFxuICAgICdzdHJjcHknLFxuICAgICdzdHJjc3BuJyxcbiAgICAnc3RybGVuJyxcbiAgICAnc3RybmNhdCcsXG4gICAgJ3N0cm5jbXAnLFxuICAgICdzdHJuY3B5JyxcbiAgICAnc3RycGJyaycsXG4gICAgJ3N0cnJjaHInLFxuICAgICdzdHJzcG4nLFxuICAgICdzdHJzdHInLFxuICAgICdzd2FwJyxcbiAgICAndGFuJyxcbiAgICAndGFuaCcsXG4gICAgJ3Rlcm1pbmF0ZScsXG4gICAgJ3RvX3VuZGVybHlpbmcnLFxuICAgICd0b2xvd2VyJyxcbiAgICAndG91cHBlcicsXG4gICAgJ3ZmcHJpbnRmJyxcbiAgICAndmlzaXQnLFxuICAgICd2cHJpbnRmJyxcbiAgICAndnNwcmludGYnXG4gIF07XG5cbiAgY29uc3QgTElURVJBTFMgPSBbXG4gICAgJ05VTEwnLFxuICAgICdmYWxzZScsXG4gICAgJ251bGxvcHQnLFxuICAgICdudWxscHRyJyxcbiAgICAndHJ1ZSdcbiAgXTtcblxuICAvLyBodHRwczovL2VuLmNwcHJlZmVyZW5jZS5jb20vdy9jcHAva2V5d29yZFxuICBjb25zdCBCVUlMVF9JTiA9IFsgJ19QcmFnbWEnIF07XG5cbiAgY29uc3QgQ1BQX0tFWVdPUkRTID0ge1xuICAgIHR5cGU6IFJFU0VSVkVEX1RZUEVTLFxuICAgIGtleXdvcmQ6IFJFU0VSVkVEX0tFWVdPUkRTLFxuICAgIGxpdGVyYWw6IExJVEVSQUxTLFxuICAgIGJ1aWx0X2luOiBCVUlMVF9JTixcbiAgICBfdHlwZV9oaW50czogVFlQRV9ISU5UU1xuICB9O1xuXG4gIGNvbnN0IEZVTkNUSU9OX0RJU1BBVENIID0ge1xuICAgIGNsYXNzTmFtZTogJ2Z1bmN0aW9uLmRpc3BhdGNoJyxcbiAgICByZWxldmFuY2U6IDAsXG4gICAga2V5d29yZHM6IHtcbiAgICAgIC8vIE9ubHkgZm9yIHJlbGV2YW5jZSwgbm90IGhpZ2hsaWdodGluZy5cbiAgICAgIF9oaW50OiBGVU5DVElPTl9ISU5UUyB9LFxuICAgIGJlZ2luOiByZWdleC5jb25jYXQoXG4gICAgICAvXFxiLyxcbiAgICAgIC8oPyFkZWNsdHlwZSkvLFxuICAgICAgLyg/IWlmKS8sXG4gICAgICAvKD8hZm9yKS8sXG4gICAgICAvKD8hc3dpdGNoKS8sXG4gICAgICAvKD8hd2hpbGUpLyxcbiAgICAgIGhsanMuSURFTlRfUkUsXG4gICAgICByZWdleC5sb29rYWhlYWQoLyg8W148Pl0rPnwpXFxzKlxcKC8pKVxuICB9O1xuXG4gIGNvbnN0IEVYUFJFU1NJT05fQ09OVEFJTlMgPSBbXG4gICAgRlVOQ1RJT05fRElTUEFUQ0gsXG4gICAgUFJFUFJPQ0VTU09SLFxuICAgIENQUF9QUklNSVRJVkVfVFlQRVMsXG4gICAgQ19MSU5FX0NPTU1FTlRfTU9ERSxcbiAgICBobGpzLkNfQkxPQ0tfQ09NTUVOVF9NT0RFLFxuICAgIE5VTUJFUlMsXG4gICAgU1RSSU5HU1xuICBdO1xuXG4gIGNvbnN0IEVYUFJFU1NJT05fQ09OVEVYVCA9IHtcbiAgICAvLyBUaGlzIG1vZGUgY292ZXJzIGV4cHJlc3Npb24gY29udGV4dCB3aGVyZSB3ZSBjYW4ndCBleHBlY3QgYSBmdW5jdGlvblxuICAgIC8vIGRlZmluaXRpb24gYW5kIHNob3VsZG4ndCBoaWdobGlnaHQgYW55dGhpbmcgdGhhdCBsb29rcyBsaWtlIG9uZTpcbiAgICAvLyBgcmV0dXJuIHNvbWUoKWAsIGBlbHNlIGlmKClgLCBgKHgqc3VtKDEsIDIpKWBcbiAgICB2YXJpYW50czogW1xuICAgICAge1xuICAgICAgICBiZWdpbjogLz0vLFxuICAgICAgICBlbmQ6IC87L1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgYmVnaW46IC9cXCgvLFxuICAgICAgICBlbmQ6IC9cXCkvXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBiZWdpbktleXdvcmRzOiAnbmV3IHRocm93IHJldHVybiBlbHNlJyxcbiAgICAgICAgZW5kOiAvOy9cbiAgICAgIH1cbiAgICBdLFxuICAgIGtleXdvcmRzOiBDUFBfS0VZV09SRFMsXG4gICAgY29udGFpbnM6IEVYUFJFU1NJT05fQ09OVEFJTlMuY29uY2F0KFtcbiAgICAgIHtcbiAgICAgICAgYmVnaW46IC9cXCgvLFxuICAgICAgICBlbmQ6IC9cXCkvLFxuICAgICAgICBrZXl3b3JkczogQ1BQX0tFWVdPUkRTLFxuICAgICAgICBjb250YWluczogRVhQUkVTU0lPTl9DT05UQUlOUy5jb25jYXQoWyAnc2VsZicgXSksXG4gICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgfVxuICAgIF0pLFxuICAgIHJlbGV2YW5jZTogMFxuICB9O1xuXG4gIGNvbnN0IEZVTkNUSU9OX0RFQ0xBUkFUSU9OID0ge1xuICAgIGNsYXNzTmFtZTogJ2Z1bmN0aW9uJyxcbiAgICBiZWdpbjogJygnICsgRlVOQ1RJT05fVFlQRV9SRSArICdbXFxcXComXFxcXHNdKykrJyArIEZVTkNUSU9OX1RJVExFLFxuICAgIHJldHVybkJlZ2luOiB0cnVlLFxuICAgIGVuZDogL1t7Oz1dLyxcbiAgICBleGNsdWRlRW5kOiB0cnVlLFxuICAgIGtleXdvcmRzOiBDUFBfS0VZV09SRFMsXG4gICAgaWxsZWdhbDogL1teXFx3XFxzXFwqJjo8Pi5dLyxcbiAgICBjb250YWluczogW1xuICAgICAgeyAvLyB0byBwcmV2ZW50IGl0IGZyb20gYmVpbmcgY29uZnVzZWQgYXMgdGhlIGZ1bmN0aW9uIHRpdGxlXG4gICAgICAgIGJlZ2luOiBERUNMVFlQRV9BVVRPX1JFLFxuICAgICAgICBrZXl3b3JkczogQ1BQX0tFWVdPUkRTLFxuICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGJlZ2luOiBGVU5DVElPTl9USVRMRSxcbiAgICAgICAgcmV0dXJuQmVnaW46IHRydWUsXG4gICAgICAgIGNvbnRhaW5zOiBbIFRJVExFX01PREUgXSxcbiAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICB9LFxuICAgICAgLy8gbmVlZGVkIGJlY2F1c2Ugd2UgZG8gbm90IGhhdmUgbG9vay1iZWhpbmQgb24gdGhlIGJlbG93IHJ1bGVcbiAgICAgIC8vIHRvIHByZXZlbnQgaXQgZnJvbSBncmFiYmluZyB0aGUgZmluYWwgOiBpbiBhIDo6IHBhaXJcbiAgICAgIHtcbiAgICAgICAgYmVnaW46IC86Oi8sXG4gICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgfSxcbiAgICAgIC8vIGluaXRpYWxpemVyc1xuICAgICAge1xuICAgICAgICBiZWdpbjogLzovLFxuICAgICAgICBlbmRzV2l0aFBhcmVudDogdHJ1ZSxcbiAgICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgICBTVFJJTkdTLFxuICAgICAgICAgIE5VTUJFUlNcbiAgICAgICAgXVxuICAgICAgfSxcbiAgICAgIC8vIGFsbG93IGZvciBtdWx0aXBsZSBkZWNsYXJhdGlvbnMsIGUuZy46XG4gICAgICAvLyBleHRlcm4gdm9pZCBmKGludCksIGcoY2hhcik7XG4gICAgICB7XG4gICAgICAgIHJlbGV2YW5jZTogMCxcbiAgICAgICAgbWF0Y2g6IC8sL1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiAncGFyYW1zJyxcbiAgICAgICAgYmVnaW46IC9cXCgvLFxuICAgICAgICBlbmQ6IC9cXCkvLFxuICAgICAgICBrZXl3b3JkczogQ1BQX0tFWVdPUkRTLFxuICAgICAgICByZWxldmFuY2U6IDAsXG4gICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAgQ19MSU5FX0NPTU1FTlRfTU9ERSxcbiAgICAgICAgICBobGpzLkNfQkxPQ0tfQ09NTUVOVF9NT0RFLFxuICAgICAgICAgIFNUUklOR1MsXG4gICAgICAgICAgTlVNQkVSUyxcbiAgICAgICAgICBDUFBfUFJJTUlUSVZFX1RZUEVTLFxuICAgICAgICAgIC8vIENvdW50IG1hdGNoaW5nIHBhcmVudGhlc2VzLlxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGJlZ2luOiAvXFwoLyxcbiAgICAgICAgICAgIGVuZDogL1xcKS8sXG4gICAgICAgICAgICBrZXl3b3JkczogQ1BQX0tFWVdPUkRTLFxuICAgICAgICAgICAgcmVsZXZhbmNlOiAwLFxuICAgICAgICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgICAgICAgJ3NlbGYnLFxuICAgICAgICAgICAgICBDX0xJTkVfQ09NTUVOVF9NT0RFLFxuICAgICAgICAgICAgICBobGpzLkNfQkxPQ0tfQ09NTUVOVF9NT0RFLFxuICAgICAgICAgICAgICBTVFJJTkdTLFxuICAgICAgICAgICAgICBOVU1CRVJTLFxuICAgICAgICAgICAgICBDUFBfUFJJTUlUSVZFX1RZUEVTXG4gICAgICAgICAgICBdXG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9LFxuICAgICAgQ1BQX1BSSU1JVElWRV9UWVBFUyxcbiAgICAgIENfTElORV9DT01NRU5UX01PREUsXG4gICAgICBobGpzLkNfQkxPQ0tfQ09NTUVOVF9NT0RFLFxuICAgICAgUFJFUFJPQ0VTU09SXG4gICAgXVxuICB9O1xuXG4gIHJldHVybiB7XG4gICAgbmFtZTogJ0MrKycsXG4gICAgYWxpYXNlczogW1xuICAgICAgJ2NjJyxcbiAgICAgICdjKysnLFxuICAgICAgJ2grKycsXG4gICAgICAnaHBwJyxcbiAgICAgICdoaCcsXG4gICAgICAnaHh4JyxcbiAgICAgICdjeHgnXG4gICAgXSxcbiAgICBrZXl3b3JkczogQ1BQX0tFWVdPUkRTLFxuICAgIGlsbGVnYWw6ICc8LycsXG4gICAgY2xhc3NOYW1lQWxpYXNlczogeyAnZnVuY3Rpb24uZGlzcGF0Y2gnOiAnYnVpbHRfaW4nIH0sXG4gICAgY29udGFpbnM6IFtdLmNvbmNhdChcbiAgICAgIEVYUFJFU1NJT05fQ09OVEVYVCxcbiAgICAgIEZVTkNUSU9OX0RFQ0xBUkFUSU9OLFxuICAgICAgRlVOQ1RJT05fRElTUEFUQ0gsXG4gICAgICBFWFBSRVNTSU9OX0NPTlRBSU5TLFxuICAgICAgW1xuICAgICAgICBQUkVQUk9DRVNTT1IsXG4gICAgICAgIHsgLy8gY29udGFpbmVyczogaWUsIGB2ZWN0b3IgPGludD4gcm9vbXMgKDkpO2BcbiAgICAgICAgICBiZWdpbjogJ1xcXFxiKGRlcXVlfGxpc3R8cXVldWV8cHJpb3JpdHlfcXVldWV8cGFpcnxzdGFja3x2ZWN0b3J8bWFwfHNldHxiaXRzZXR8bXVsdGlzZXR8bXVsdGltYXB8dW5vcmRlcmVkX21hcHx1bm9yZGVyZWRfc2V0fHVub3JkZXJlZF9tdWx0aXNldHx1bm9yZGVyZWRfbXVsdGltYXB8YXJyYXl8dHVwbGV8b3B0aW9uYWx8dmFyaWFudHxmdW5jdGlvbnxmbGF0X21hcHxmbGF0X3NldClcXFxccyo8KD8hPCknLFxuICAgICAgICAgIGVuZDogJz4nLFxuICAgICAgICAgIGtleXdvcmRzOiBDUFBfS0VZV09SRFMsXG4gICAgICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgICAgICdzZWxmJyxcbiAgICAgICAgICAgIENQUF9QUklNSVRJVkVfVFlQRVNcbiAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBiZWdpbjogaGxqcy5JREVOVF9SRSArICc6OicsXG4gICAgICAgICAga2V5d29yZHM6IENQUF9LRVlXT1JEU1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbWF0Y2g6IFtcbiAgICAgICAgICAgIC8vIGV4dHJhIGNvbXBsZXhpdHkgdG8gZGVhbCB3aXRoIGBlbnVtIGNsYXNzYCBhbmQgYGVudW0gc3RydWN0YFxuICAgICAgICAgICAgL1xcYig/OmVudW0oPzpcXHMrKD86Y2xhc3N8c3RydWN0KSk/fGNsYXNzfHN0cnVjdHx1bmlvbikvLFxuICAgICAgICAgICAgL1xccysvLFxuICAgICAgICAgICAgL1xcdysvXG4gICAgICAgICAgXSxcbiAgICAgICAgICBjbGFzc05hbWU6IHtcbiAgICAgICAgICAgIDE6ICdrZXl3b3JkJyxcbiAgICAgICAgICAgIDM6ICd0aXRsZS5jbGFzcydcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIF0pXG4gIH07XG59XG5cbmV4cG9ydCB7IGNwcCBhcyBkZWZhdWx0IH07XG4iLCAiY29uc3QgSURFTlRfUkUgPSAnW0EtWmEteiRfXVswLTlBLVphLXokX10qJztcbmNvbnN0IEtFWVdPUkRTID0gW1xuICBcImFzXCIsIC8vIGZvciBleHBvcnRzXG4gIFwiaW5cIixcbiAgXCJvZlwiLFxuICBcImlmXCIsXG4gIFwiZm9yXCIsXG4gIFwid2hpbGVcIixcbiAgXCJmaW5hbGx5XCIsXG4gIFwidmFyXCIsXG4gIFwibmV3XCIsXG4gIFwiZnVuY3Rpb25cIixcbiAgXCJkb1wiLFxuICBcInJldHVyblwiLFxuICBcInZvaWRcIixcbiAgXCJlbHNlXCIsXG4gIFwiYnJlYWtcIixcbiAgXCJjYXRjaFwiLFxuICBcImluc3RhbmNlb2ZcIixcbiAgXCJ3aXRoXCIsXG4gIFwidGhyb3dcIixcbiAgXCJjYXNlXCIsXG4gIFwiZGVmYXVsdFwiLFxuICBcInRyeVwiLFxuICBcInN3aXRjaFwiLFxuICBcImNvbnRpbnVlXCIsXG4gIFwidHlwZW9mXCIsXG4gIFwiZGVsZXRlXCIsXG4gIFwibGV0XCIsXG4gIFwieWllbGRcIixcbiAgXCJjb25zdFwiLFxuICBcImNsYXNzXCIsXG4gIC8vIEpTIGhhbmRsZXMgdGhlc2Ugd2l0aCBhIHNwZWNpYWwgcnVsZVxuICAvLyBcImdldFwiLFxuICAvLyBcInNldFwiLFxuICBcImRlYnVnZ2VyXCIsXG4gIFwiYXN5bmNcIixcbiAgXCJhd2FpdFwiLFxuICBcInN0YXRpY1wiLFxuICBcImltcG9ydFwiLFxuICBcImZyb21cIixcbiAgXCJleHBvcnRcIixcbiAgXCJleHRlbmRzXCIsXG4gIC8vIEl0J3MgcmVhY2hlZCBzdGFnZSAzLCB3aGljaCBpcyBcInJlY29tbWVuZGVkIGZvciBpbXBsZW1lbnRhdGlvblwiOlxuICBcInVzaW5nXCJcbl07XG5jb25zdCBMSVRFUkFMUyA9IFtcbiAgXCJ0cnVlXCIsXG4gIFwiZmFsc2VcIixcbiAgXCJudWxsXCIsXG4gIFwidW5kZWZpbmVkXCIsXG4gIFwiTmFOXCIsXG4gIFwiSW5maW5pdHlcIlxuXTtcblxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHNcbmNvbnN0IFRZUEVTID0gW1xuICAvLyBGdW5kYW1lbnRhbCBvYmplY3RzXG4gIFwiT2JqZWN0XCIsXG4gIFwiRnVuY3Rpb25cIixcbiAgXCJCb29sZWFuXCIsXG4gIFwiU3ltYm9sXCIsXG4gIC8vIG51bWJlcnMgYW5kIGRhdGVzXG4gIFwiTWF0aFwiLFxuICBcIkRhdGVcIixcbiAgXCJOdW1iZXJcIixcbiAgXCJCaWdJbnRcIixcbiAgLy8gdGV4dFxuICBcIlN0cmluZ1wiLFxuICBcIlJlZ0V4cFwiLFxuICAvLyBJbmRleGVkIGNvbGxlY3Rpb25zXG4gIFwiQXJyYXlcIixcbiAgXCJGbG9hdDMyQXJyYXlcIixcbiAgXCJGbG9hdDY0QXJyYXlcIixcbiAgXCJJbnQ4QXJyYXlcIixcbiAgXCJVaW50OEFycmF5XCIsXG4gIFwiVWludDhDbGFtcGVkQXJyYXlcIixcbiAgXCJJbnQxNkFycmF5XCIsXG4gIFwiSW50MzJBcnJheVwiLFxuICBcIlVpbnQxNkFycmF5XCIsXG4gIFwiVWludDMyQXJyYXlcIixcbiAgXCJCaWdJbnQ2NEFycmF5XCIsXG4gIFwiQmlnVWludDY0QXJyYXlcIixcbiAgLy8gS2V5ZWQgY29sbGVjdGlvbnNcbiAgXCJTZXRcIixcbiAgXCJNYXBcIixcbiAgXCJXZWFrU2V0XCIsXG4gIFwiV2Vha01hcFwiLFxuICAvLyBTdHJ1Y3R1cmVkIGRhdGFcbiAgXCJBcnJheUJ1ZmZlclwiLFxuICBcIlNoYXJlZEFycmF5QnVmZmVyXCIsXG4gIFwiQXRvbWljc1wiLFxuICBcIkRhdGFWaWV3XCIsXG4gIFwiSlNPTlwiLFxuICAvLyBDb250cm9sIGFic3RyYWN0aW9uIG9iamVjdHNcbiAgXCJQcm9taXNlXCIsXG4gIFwiR2VuZXJhdG9yXCIsXG4gIFwiR2VuZXJhdG9yRnVuY3Rpb25cIixcbiAgXCJBc3luY0Z1bmN0aW9uXCIsXG4gIC8vIFJlZmxlY3Rpb25cbiAgXCJSZWZsZWN0XCIsXG4gIFwiUHJveHlcIixcbiAgLy8gSW50ZXJuYXRpb25hbGl6YXRpb25cbiAgXCJJbnRsXCIsXG4gIC8vIFdlYkFzc2VtYmx5XG4gIFwiV2ViQXNzZW1ibHlcIlxuXTtcblxuY29uc3QgRVJST1JfVFlQRVMgPSBbXG4gIFwiRXJyb3JcIixcbiAgXCJFdmFsRXJyb3JcIixcbiAgXCJJbnRlcm5hbEVycm9yXCIsXG4gIFwiUmFuZ2VFcnJvclwiLFxuICBcIlJlZmVyZW5jZUVycm9yXCIsXG4gIFwiU3ludGF4RXJyb3JcIixcbiAgXCJUeXBlRXJyb3JcIixcbiAgXCJVUklFcnJvclwiXG5dO1xuXG5jb25zdCBCVUlMVF9JTl9HTE9CQUxTID0gW1xuICBcInNldEludGVydmFsXCIsXG4gIFwic2V0VGltZW91dFwiLFxuICBcImNsZWFySW50ZXJ2YWxcIixcbiAgXCJjbGVhclRpbWVvdXRcIixcblxuICBcInJlcXVpcmVcIixcbiAgXCJleHBvcnRzXCIsXG5cbiAgXCJldmFsXCIsXG4gIFwiaXNGaW5pdGVcIixcbiAgXCJpc05hTlwiLFxuICBcInBhcnNlRmxvYXRcIixcbiAgXCJwYXJzZUludFwiLFxuICBcImRlY29kZVVSSVwiLFxuICBcImRlY29kZVVSSUNvbXBvbmVudFwiLFxuICBcImVuY29kZVVSSVwiLFxuICBcImVuY29kZVVSSUNvbXBvbmVudFwiLFxuICBcImVzY2FwZVwiLFxuICBcInVuZXNjYXBlXCJcbl07XG5cbmNvbnN0IEJVSUxUX0lOX1ZBUklBQkxFUyA9IFtcbiAgXCJhcmd1bWVudHNcIixcbiAgXCJ0aGlzXCIsXG4gIFwic3VwZXJcIixcbiAgXCJjb25zb2xlXCIsXG4gIFwid2luZG93XCIsXG4gIFwiZG9jdW1lbnRcIixcbiAgXCJsb2NhbFN0b3JhZ2VcIixcbiAgXCJzZXNzaW9uU3RvcmFnZVwiLFxuICBcIm1vZHVsZVwiLFxuICBcImdsb2JhbFwiIC8vIE5vZGUuanNcbl07XG5cbmNvbnN0IEJVSUxUX0lOUyA9IFtdLmNvbmNhdChcbiAgQlVJTFRfSU5fR0xPQkFMUyxcbiAgVFlQRVMsXG4gIEVSUk9SX1RZUEVTXG4pO1xuXG4vKlxuTGFuZ3VhZ2U6IEphdmFTY3JpcHRcbkRlc2NyaXB0aW9uOiBKYXZhU2NyaXB0IChKUykgaXMgYSBsaWdodHdlaWdodCwgaW50ZXJwcmV0ZWQsIG9yIGp1c3QtaW4tdGltZSBjb21waWxlZCBwcm9ncmFtbWluZyBsYW5ndWFnZSB3aXRoIGZpcnN0LWNsYXNzIGZ1bmN0aW9ucy5cbkNhdGVnb3J5OiBjb21tb24sIHNjcmlwdGluZywgd2ViXG5XZWJzaXRlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0XG4qL1xuXG5cbi8qKiBAdHlwZSBMYW5ndWFnZUZuICovXG5mdW5jdGlvbiBqYXZhc2NyaXB0KGhsanMpIHtcbiAgY29uc3QgcmVnZXggPSBobGpzLnJlZ2V4O1xuICAvKipcbiAgICogVGFrZXMgYSBzdHJpbmcgbGlrZSBcIjxCb29nZXJcIiBhbmQgY2hlY2tzIHRvIHNlZVxuICAgKiBpZiB3ZSBjYW4gZmluZCBhIG1hdGNoaW5nIFwiPC9Cb29nZXJcIiBsYXRlciBpbiB0aGVcbiAgICogY29udGVudC5cbiAgICogQHBhcmFtIHtSZWdFeHBNYXRjaEFycmF5fSBtYXRjaFxuICAgKiBAcGFyYW0ge3thZnRlcjpudW1iZXJ9fSBwYXJhbTFcbiAgICovXG4gIGNvbnN0IGhhc0Nsb3NpbmdUYWcgPSAobWF0Y2gsIHsgYWZ0ZXIgfSkgPT4ge1xuICAgIGNvbnN0IHRhZyA9IFwiPC9cIiArIG1hdGNoWzBdLnNsaWNlKDEpO1xuICAgIGNvbnN0IHBvcyA9IG1hdGNoLmlucHV0LmluZGV4T2YodGFnLCBhZnRlcik7XG4gICAgcmV0dXJuIHBvcyAhPT0gLTE7XG4gIH07XG5cbiAgY29uc3QgSURFTlRfUkUkMSA9IElERU5UX1JFO1xuICBjb25zdCBGUkFHTUVOVCA9IHtcbiAgICBiZWdpbjogJzw+JyxcbiAgICBlbmQ6ICc8Lz4nXG4gIH07XG4gIC8vIHRvIGF2b2lkIHNvbWUgc3BlY2lhbCBjYXNlcyBpbnNpZGUgaXNUcnVseU9wZW5pbmdUYWdcbiAgY29uc3QgWE1MX1NFTEZfQ0xPU0lORyA9IC88W0EtWmEtejAtOVxcXFwuXzotXStcXHMqXFwvPi87XG4gIGNvbnN0IFhNTF9UQUcgPSB7XG4gICAgYmVnaW46IC88W0EtWmEtejAtOVxcXFwuXzotXSsvLFxuICAgIGVuZDogL1xcL1tBLVphLXowLTlcXFxcLl86LV0rPnxcXC8+LyxcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge1JlZ0V4cE1hdGNoQXJyYXl9IG1hdGNoXG4gICAgICogQHBhcmFtIHtDYWxsYmFja1Jlc3BvbnNlfSByZXNwb25zZVxuICAgICAqL1xuICAgIGlzVHJ1bHlPcGVuaW5nVGFnOiAobWF0Y2gsIHJlc3BvbnNlKSA9PiB7XG4gICAgICBjb25zdCBhZnRlck1hdGNoSW5kZXggPSBtYXRjaFswXS5sZW5ndGggKyBtYXRjaC5pbmRleDtcbiAgICAgIGNvbnN0IG5leHRDaGFyID0gbWF0Y2guaW5wdXRbYWZ0ZXJNYXRjaEluZGV4XTtcbiAgICAgIGlmIChcbiAgICAgICAgLy8gSFRNTCBzaG91bGQgbm90IGluY2x1ZGUgYW5vdGhlciByYXcgYDxgIGluc2lkZSBhIHRhZ1xuICAgICAgICAvLyBuZXN0ZWQgdHlwZT9cbiAgICAgICAgLy8gYDxBcnJheTxBcnJheTxudW1iZXI+PmAsIGV0Yy5cbiAgICAgICAgbmV4dENoYXIgPT09IFwiPFwiIHx8XG4gICAgICAgIC8vIHRoZSAsIGdpdmVzIGF3YXkgdGhhdCB0aGlzIGlzIG5vdCBIVE1MXG4gICAgICAgIC8vIGA8VCwgQSBleHRlbmRzIGtleW9mIFQsIFY+YFxuICAgICAgICBuZXh0Q2hhciA9PT0gXCIsXCJcbiAgICAgICAgKSB7XG4gICAgICAgIHJlc3BvbnNlLmlnbm9yZU1hdGNoKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gYDxzb21ldGhpbmc+YFxuICAgICAgLy8gUXVpdGUgcG9zc2libHkgYSB0YWcsIGxldHMgbG9vayBmb3IgYSBtYXRjaGluZyBjbG9zaW5nIHRhZy4uLlxuICAgICAgaWYgKG5leHRDaGFyID09PSBcIj5cIikge1xuICAgICAgICAvLyBpZiB3ZSBjYW5ub3QgZmluZCBhIG1hdGNoaW5nIGNsb3NpbmcgdGFnLCB0aGVuIHdlXG4gICAgICAgIC8vIHdpbGwgaWdub3JlIGl0XG4gICAgICAgIGlmICghaGFzQ2xvc2luZ1RhZyhtYXRjaCwgeyBhZnRlcjogYWZ0ZXJNYXRjaEluZGV4IH0pKSB7XG4gICAgICAgICAgcmVzcG9uc2UuaWdub3JlTWF0Y2goKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBgPGJsYWggLz5gIChzZWxmLWNsb3NpbmcpXG4gICAgICAvLyBoYW5kbGVkIGJ5IHNpbXBsZVNlbGZDbG9zaW5nIHJ1bGVcblxuICAgICAgbGV0IG07XG4gICAgICBjb25zdCBhZnRlck1hdGNoID0gbWF0Y2guaW5wdXQuc3Vic3RyaW5nKGFmdGVyTWF0Y2hJbmRleCk7XG5cbiAgICAgIC8vIHNvbWUgbW9yZSB0ZW1wbGF0ZSB0eXBpbmcgc3R1ZmZcbiAgICAgIC8vICA8VCA9IGFueT4oa2V5Pzogc3RyaW5nKSA9PiBNb2RpZnk8XG4gICAgICBpZiAoKG0gPSBhZnRlck1hdGNoLm1hdGNoKC9eXFxzKj0vKSkpIHtcbiAgICAgICAgcmVzcG9uc2UuaWdub3JlTWF0Y2goKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBgPEZyb20gZXh0ZW5kcyBzdHJpbmc+YFxuICAgICAgLy8gdGVjaG5pY2FsbHkgdGhpcyBjb3VsZCBiZSBIVE1MLCBidXQgaXQgc21lbGxzIGxpa2UgYSB0eXBlXG4gICAgICAvLyBOT1RFOiBUaGlzIGlzIHVnaCwgYnV0IGFkZGVkIHNwZWNpZmljYWxseSBmb3IgaHR0cHM6Ly9naXRodWIuY29tL2hpZ2hsaWdodGpzL2hpZ2hsaWdodC5qcy9pc3N1ZXMvMzI3NlxuICAgICAgaWYgKChtID0gYWZ0ZXJNYXRjaC5tYXRjaCgvXlxccytleHRlbmRzXFxzKy8pKSkge1xuICAgICAgICBpZiAobS5pbmRleCA9PT0gMCkge1xuICAgICAgICAgIHJlc3BvbnNlLmlnbm9yZU1hdGNoKCk7XG4gICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVzZWxlc3MtcmV0dXJuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBjb25zdCBLRVlXT1JEUyQxID0ge1xuICAgICRwYXR0ZXJuOiBJREVOVF9SRSxcbiAgICBrZXl3b3JkOiBLRVlXT1JEUyxcbiAgICBsaXRlcmFsOiBMSVRFUkFMUyxcbiAgICBidWlsdF9pbjogQlVJTFRfSU5TLFxuICAgIFwidmFyaWFibGUubGFuZ3VhZ2VcIjogQlVJTFRfSU5fVkFSSUFCTEVTXG4gIH07XG5cbiAgLy8gaHR0cHM6Ly90YzM5LmVzL2VjbWEyNjIvI3NlYy1saXRlcmFscy1udW1lcmljLWxpdGVyYWxzXG4gIGNvbnN0IGRlY2ltYWxEaWdpdHMgPSAnWzAtOV0oXz9bMC05XSkqJztcbiAgY29uc3QgZnJhYyA9IGBcXFxcLigke2RlY2ltYWxEaWdpdHN9KWA7XG4gIC8vIERlY2ltYWxJbnRlZ2VyTGl0ZXJhbCwgaW5jbHVkaW5nIEFubmV4IEIgTm9uT2N0YWxEZWNpbWFsSW50ZWdlckxpdGVyYWxcbiAgLy8gaHR0cHM6Ly90YzM5LmVzL2VjbWEyNjIvI3NlYy1hZGRpdGlvbmFsLXN5bnRheC1udW1lcmljLWxpdGVyYWxzXG4gIGNvbnN0IGRlY2ltYWxJbnRlZ2VyID0gYDB8WzEtOV0oXz9bMC05XSkqfDBbMC03XSpbODldWzAtOV0qYDtcbiAgY29uc3QgTlVNQkVSID0ge1xuICAgIGNsYXNzTmFtZTogJ251bWJlcicsXG4gICAgdmFyaWFudHM6IFtcbiAgICAgIC8vIERlY2ltYWxMaXRlcmFsXG4gICAgICB7IGJlZ2luOiBgKFxcXFxiKCR7ZGVjaW1hbEludGVnZXJ9KSgoJHtmcmFjfSl8XFxcXC4pP3woJHtmcmFjfSkpYCArXG4gICAgICAgIGBbZUVdWystXT8oJHtkZWNpbWFsRGlnaXRzfSlcXFxcYmAgfSxcbiAgICAgIHsgYmVnaW46IGBcXFxcYigke2RlY2ltYWxJbnRlZ2VyfSlcXFxcYigoJHtmcmFjfSlcXFxcYnxcXFxcLik/fCgke2ZyYWN9KVxcXFxiYCB9LFxuXG4gICAgICAvLyBEZWNpbWFsQmlnSW50ZWdlckxpdGVyYWxcbiAgICAgIHsgYmVnaW46IGBcXFxcYigwfFsxLTldKF8/WzAtOV0pKiluXFxcXGJgIH0sXG5cbiAgICAgIC8vIE5vbkRlY2ltYWxJbnRlZ2VyTGl0ZXJhbFxuICAgICAgeyBiZWdpbjogXCJcXFxcYjBbeFhdWzAtOWEtZkEtRl0oXz9bMC05YS1mQS1GXSkqbj9cXFxcYlwiIH0sXG4gICAgICB7IGJlZ2luOiBcIlxcXFxiMFtiQl1bMC0xXShfP1swLTFdKSpuP1xcXFxiXCIgfSxcbiAgICAgIHsgYmVnaW46IFwiXFxcXGIwW29PXVswLTddKF8/WzAtN10pKm4/XFxcXGJcIiB9LFxuXG4gICAgICAvLyBMZWdhY3lPY3RhbEludGVnZXJMaXRlcmFsIChkb2VzIG5vdCBpbmNsdWRlIHVuZGVyc2NvcmUgc2VwYXJhdG9ycylcbiAgICAgIC8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNzZWMtYWRkaXRpb25hbC1zeW50YXgtbnVtZXJpYy1saXRlcmFsc1xuICAgICAgeyBiZWdpbjogXCJcXFxcYjBbMC03XStuP1xcXFxiXCIgfSxcbiAgICBdLFxuICAgIHJlbGV2YW5jZTogMFxuICB9O1xuXG4gIGNvbnN0IFNVQlNUID0ge1xuICAgIGNsYXNzTmFtZTogJ3N1YnN0JyxcbiAgICBiZWdpbjogJ1xcXFwkXFxcXHsnLFxuICAgIGVuZDogJ1xcXFx9JyxcbiAgICBrZXl3b3JkczogS0VZV09SRFMkMSxcbiAgICBjb250YWluczogW10gLy8gZGVmaW5lZCBsYXRlclxuICB9O1xuICBjb25zdCBIVE1MX1RFTVBMQVRFID0ge1xuICAgIGJlZ2luOiAnXFwuP2h0bWxgJyxcbiAgICBlbmQ6ICcnLFxuICAgIHN0YXJ0czoge1xuICAgICAgZW5kOiAnYCcsXG4gICAgICByZXR1cm5FbmQ6IGZhbHNlLFxuICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgaGxqcy5CQUNLU0xBU0hfRVNDQVBFLFxuICAgICAgICBTVUJTVFxuICAgICAgXSxcbiAgICAgIHN1Ykxhbmd1YWdlOiAneG1sJ1xuICAgIH1cbiAgfTtcbiAgY29uc3QgQ1NTX1RFTVBMQVRFID0ge1xuICAgIGJlZ2luOiAnXFwuP2Nzc2AnLFxuICAgIGVuZDogJycsXG4gICAgc3RhcnRzOiB7XG4gICAgICBlbmQ6ICdgJyxcbiAgICAgIHJldHVybkVuZDogZmFsc2UsXG4gICAgICBjb250YWluczogW1xuICAgICAgICBobGpzLkJBQ0tTTEFTSF9FU0NBUEUsXG4gICAgICAgIFNVQlNUXG4gICAgICBdLFxuICAgICAgc3ViTGFuZ3VhZ2U6ICdjc3MnXG4gICAgfVxuICB9O1xuICBjb25zdCBHUkFQSFFMX1RFTVBMQVRFID0ge1xuICAgIGJlZ2luOiAnXFwuP2dxbGAnLFxuICAgIGVuZDogJycsXG4gICAgc3RhcnRzOiB7XG4gICAgICBlbmQ6ICdgJyxcbiAgICAgIHJldHVybkVuZDogZmFsc2UsXG4gICAgICBjb250YWluczogW1xuICAgICAgICBobGpzLkJBQ0tTTEFTSF9FU0NBUEUsXG4gICAgICAgIFNVQlNUXG4gICAgICBdLFxuICAgICAgc3ViTGFuZ3VhZ2U6ICdncmFwaHFsJ1xuICAgIH1cbiAgfTtcbiAgY29uc3QgVEVNUExBVEVfU1RSSU5HID0ge1xuICAgIGNsYXNzTmFtZTogJ3N0cmluZycsXG4gICAgYmVnaW46ICdgJyxcbiAgICBlbmQ6ICdgJyxcbiAgICBjb250YWluczogW1xuICAgICAgaGxqcy5CQUNLU0xBU0hfRVNDQVBFLFxuICAgICAgU1VCU1RcbiAgICBdXG4gIH07XG4gIGNvbnN0IEpTRE9DX0NPTU1FTlQgPSBobGpzLkNPTU1FTlQoXG4gICAgL1xcL1xcKlxcKig/IVxcLykvLFxuICAgICdcXFxcKi8nLFxuICAgIHtcbiAgICAgIHJlbGV2YW5jZTogMCxcbiAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBiZWdpbjogJyg/PUBbQS1aYS16XSspJyxcbiAgICAgICAgICByZWxldmFuY2U6IDAsXG4gICAgICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgY2xhc3NOYW1lOiAnZG9jdGFnJyxcbiAgICAgICAgICAgICAgYmVnaW46ICdAW0EtWmEtel0rJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgY2xhc3NOYW1lOiAndHlwZScsXG4gICAgICAgICAgICAgIGJlZ2luOiAnXFxcXHsnLFxuICAgICAgICAgICAgICBlbmQ6ICdcXFxcfScsXG4gICAgICAgICAgICAgIGV4Y2x1ZGVFbmQ6IHRydWUsXG4gICAgICAgICAgICAgIGV4Y2x1ZGVCZWdpbjogdHJ1ZSxcbiAgICAgICAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBjbGFzc05hbWU6ICd2YXJpYWJsZScsXG4gICAgICAgICAgICAgIGJlZ2luOiBJREVOVF9SRSQxICsgJyg/PVxcXFxzKigtKXwkKScsXG4gICAgICAgICAgICAgIGVuZHNQYXJlbnQ6IHRydWUsXG4gICAgICAgICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIGVhdCBzcGFjZXMgKG5vdCBuZXdsaW5lcykgc28gd2UgY2FuIGZpbmRcbiAgICAgICAgICAgIC8vIHR5cGVzIG9yIHZhcmlhYmxlc1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBiZWdpbjogLyg/PVteXFxuXSlcXHMvLFxuICAgICAgICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9XG4gICk7XG4gIGNvbnN0IENPTU1FTlQgPSB7XG4gICAgY2xhc3NOYW1lOiBcImNvbW1lbnRcIixcbiAgICB2YXJpYW50czogW1xuICAgICAgSlNET0NfQ09NTUVOVCxcbiAgICAgIGhsanMuQ19CTE9DS19DT01NRU5UX01PREUsXG4gICAgICBobGpzLkNfTElORV9DT01NRU5UX01PREVcbiAgICBdXG4gIH07XG4gIGNvbnN0IFNVQlNUX0lOVEVSTkFMUyA9IFtcbiAgICBobGpzLkFQT1NfU1RSSU5HX01PREUsXG4gICAgaGxqcy5RVU9URV9TVFJJTkdfTU9ERSxcbiAgICBIVE1MX1RFTVBMQVRFLFxuICAgIENTU19URU1QTEFURSxcbiAgICBHUkFQSFFMX1RFTVBMQVRFLFxuICAgIFRFTVBMQVRFX1NUUklORyxcbiAgICAvLyBTa2lwIG51bWJlcnMgd2hlbiB0aGV5IGFyZSBwYXJ0IG9mIGEgdmFyaWFibGUgbmFtZVxuICAgIHsgbWF0Y2g6IC9cXCRcXGQrLyB9LFxuICAgIE5VTUJFUixcbiAgICAvLyBUaGlzIGlzIGludGVudGlvbmFsOlxuICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vaGlnaGxpZ2h0anMvaGlnaGxpZ2h0LmpzL2lzc3Vlcy8zMjg4XG4gICAgLy8gaGxqcy5SRUdFWFBfTU9ERVxuICBdO1xuICBTVUJTVC5jb250YWlucyA9IFNVQlNUX0lOVEVSTkFMU1xuICAgIC5jb25jYXQoe1xuICAgICAgLy8gd2UgbmVlZCB0byBwYWlyIHVwIHt9IGluc2lkZSBvdXIgc3Vic3QgdG8gcHJldmVudFxuICAgICAgLy8gaXQgZnJvbSBlbmRpbmcgdG9vIGVhcmx5IGJ5IG1hdGNoaW5nIGFub3RoZXIgfVxuICAgICAgYmVnaW46IC9cXHsvLFxuICAgICAgZW5kOiAvXFx9LyxcbiAgICAgIGtleXdvcmRzOiBLRVlXT1JEUyQxLFxuICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgXCJzZWxmXCJcbiAgICAgIF0uY29uY2F0KFNVQlNUX0lOVEVSTkFMUylcbiAgICB9KTtcbiAgY29uc3QgU1VCU1RfQU5EX0NPTU1FTlRTID0gW10uY29uY2F0KENPTU1FTlQsIFNVQlNULmNvbnRhaW5zKTtcbiAgY29uc3QgUEFSQU1TX0NPTlRBSU5TID0gU1VCU1RfQU5EX0NPTU1FTlRTLmNvbmNhdChbXG4gICAgLy8gZWF0IHJlY3Vyc2l2ZSBwYXJlbnMgaW4gc3ViIGV4cHJlc3Npb25zXG4gICAge1xuICAgICAgYmVnaW46IC8oXFxzKilcXCgvLFxuICAgICAgZW5kOiAvXFwpLyxcbiAgICAgIGtleXdvcmRzOiBLRVlXT1JEUyQxLFxuICAgICAgY29udGFpbnM6IFtcInNlbGZcIl0uY29uY2F0KFNVQlNUX0FORF9DT01NRU5UUylcbiAgICB9XG4gIF0pO1xuICBjb25zdCBQQVJBTVMgPSB7XG4gICAgY2xhc3NOYW1lOiAncGFyYW1zJyxcbiAgICAvLyBjb252ZXJ0IHRoaXMgdG8gbmVnYXRpdmUgbG9va2JlaGluZCBpbiB2MTJcbiAgICBiZWdpbjogLyhcXHMqKVxcKC8sIC8vIHRvIG1hdGNoIHRoZSBwYXJtcyB3aXRoXG4gICAgZW5kOiAvXFwpLyxcbiAgICBleGNsdWRlQmVnaW46IHRydWUsXG4gICAgZXhjbHVkZUVuZDogdHJ1ZSxcbiAgICBrZXl3b3JkczogS0VZV09SRFMkMSxcbiAgICBjb250YWluczogUEFSQU1TX0NPTlRBSU5TXG4gIH07XG5cbiAgLy8gRVM2IGNsYXNzZXNcbiAgY29uc3QgQ0xBU1NfT1JfRVhURU5EUyA9IHtcbiAgICB2YXJpYW50czogW1xuICAgICAgLy8gY2xhc3MgQ2FyIGV4dGVuZHMgdmVoaWNsZVxuICAgICAge1xuICAgICAgICBtYXRjaDogW1xuICAgICAgICAgIC9jbGFzcy8sXG4gICAgICAgICAgL1xccysvLFxuICAgICAgICAgIElERU5UX1JFJDEsXG4gICAgICAgICAgL1xccysvLFxuICAgICAgICAgIC9leHRlbmRzLyxcbiAgICAgICAgICAvXFxzKy8sXG4gICAgICAgICAgcmVnZXguY29uY2F0KElERU5UX1JFJDEsIFwiKFwiLCByZWdleC5jb25jYXQoL1xcLi8sIElERU5UX1JFJDEpLCBcIikqXCIpXG4gICAgICAgIF0sXG4gICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgMTogXCJrZXl3b3JkXCIsXG4gICAgICAgICAgMzogXCJ0aXRsZS5jbGFzc1wiLFxuICAgICAgICAgIDU6IFwia2V5d29yZFwiLFxuICAgICAgICAgIDc6IFwidGl0bGUuY2xhc3MuaW5oZXJpdGVkXCJcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIC8vIGNsYXNzIENhclxuICAgICAge1xuICAgICAgICBtYXRjaDogW1xuICAgICAgICAgIC9jbGFzcy8sXG4gICAgICAgICAgL1xccysvLFxuICAgICAgICAgIElERU5UX1JFJDFcbiAgICAgICAgXSxcbiAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAxOiBcImtleXdvcmRcIixcbiAgICAgICAgICAzOiBcInRpdGxlLmNsYXNzXCJcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgIF1cbiAgfTtcblxuICBjb25zdCBDTEFTU19SRUZFUkVOQ0UgPSB7XG4gICAgcmVsZXZhbmNlOiAwLFxuICAgIG1hdGNoOlxuICAgIHJlZ2V4LmVpdGhlcihcbiAgICAgIC8vIEhhcmQgY29kZWQgZXhjZXB0aW9uc1xuICAgICAgL1xcYkpTT04vLFxuICAgICAgLy8gRmxvYXQzMkFycmF5LCBPdXRUXG4gICAgICAvXFxiW0EtWl1bYS16XSsoW0EtWl1bYS16XSp8XFxkKSovLFxuICAgICAgLy8gQ1NTRmFjdG9yeSwgQ1NTRmFjdG9yeVRcbiAgICAgIC9cXGJbQS1aXXsyLH0oW0EtWl1bYS16XSt8XFxkKSsoW0EtWl1bYS16XSopKi8sXG4gICAgICAvLyBGUHMsIEZQc1RcbiAgICAgIC9cXGJbQS1aXXsyLH1bYS16XSsoW0EtWl1bYS16XSt8XFxkKSooW0EtWl1bYS16XSopKi8sXG4gICAgICAvLyBQXG4gICAgICAvLyBzaW5nbGUgbGV0dGVycyBhcmUgbm90IGhpZ2hsaWdodGVkXG4gICAgICAvLyBCTEFIXG4gICAgICAvLyB0aGlzIHdpbGwgYmUgZmxhZ2dlZCBhcyBhIFVQUEVSX0NBU0VfQ09OU1RBTlQgaW5zdGVhZFxuICAgICksXG4gICAgY2xhc3NOYW1lOiBcInRpdGxlLmNsYXNzXCIsXG4gICAga2V5d29yZHM6IHtcbiAgICAgIF86IFtcbiAgICAgICAgLy8gc2Ugd2Ugc3RpbGwgZ2V0IHJlbGV2YW5jZSBjcmVkaXQgZm9yIEpTIGxpYnJhcnkgY2xhc3Nlc1xuICAgICAgICAuLi5UWVBFUyxcbiAgICAgICAgLi4uRVJST1JfVFlQRVNcbiAgICAgIF1cbiAgICB9XG4gIH07XG5cbiAgY29uc3QgVVNFX1NUUklDVCA9IHtcbiAgICBsYWJlbDogXCJ1c2Vfc3RyaWN0XCIsXG4gICAgY2xhc3NOYW1lOiAnbWV0YScsXG4gICAgcmVsZXZhbmNlOiAxMCxcbiAgICBiZWdpbjogL15cXHMqWydcIl11c2UgKHN0cmljdHxhc20pWydcIl0vXG4gIH07XG5cbiAgY29uc3QgRlVOQ1RJT05fREVGSU5JVElPTiA9IHtcbiAgICB2YXJpYW50czogW1xuICAgICAge1xuICAgICAgICBtYXRjaDogW1xuICAgICAgICAgIC9mdW5jdGlvbi8sXG4gICAgICAgICAgL1xccysvLFxuICAgICAgICAgIElERU5UX1JFJDEsXG4gICAgICAgICAgLyg/PVxccypcXCgpL1xuICAgICAgICBdXG4gICAgICB9LFxuICAgICAgLy8gYW5vbnltb3VzIGZ1bmN0aW9uXG4gICAgICB7XG4gICAgICAgIG1hdGNoOiBbXG4gICAgICAgICAgL2Z1bmN0aW9uLyxcbiAgICAgICAgICAvXFxzKig/PVxcKCkvXG4gICAgICAgIF1cbiAgICAgIH1cbiAgICBdLFxuICAgIGNsYXNzTmFtZToge1xuICAgICAgMTogXCJrZXl3b3JkXCIsXG4gICAgICAzOiBcInRpdGxlLmZ1bmN0aW9uXCJcbiAgICB9LFxuICAgIGxhYmVsOiBcImZ1bmMuZGVmXCIsXG4gICAgY29udGFpbnM6IFsgUEFSQU1TIF0sXG4gICAgaWxsZWdhbDogLyUvXG4gIH07XG5cbiAgY29uc3QgVVBQRVJfQ0FTRV9DT05TVEFOVCA9IHtcbiAgICByZWxldmFuY2U6IDAsXG4gICAgbWF0Y2g6IC9cXGJbQS1aXVtBLVpfMC05XStcXGIvLFxuICAgIGNsYXNzTmFtZTogXCJ2YXJpYWJsZS5jb25zdGFudFwiXG4gIH07XG5cbiAgZnVuY3Rpb24gbm9uZU9mKGxpc3QpIHtcbiAgICByZXR1cm4gcmVnZXguY29uY2F0KFwiKD8hXCIsIGxpc3Quam9pbihcInxcIiksIFwiKVwiKTtcbiAgfVxuXG4gIGNvbnN0IEZVTkNUSU9OX0NBTEwgPSB7XG4gICAgbWF0Y2g6IHJlZ2V4LmNvbmNhdChcbiAgICAgIC9cXGIvLFxuICAgICAgbm9uZU9mKFtcbiAgICAgICAgLi4uQlVJTFRfSU5fR0xPQkFMUyxcbiAgICAgICAgXCJzdXBlclwiLFxuICAgICAgICBcImltcG9ydFwiXG4gICAgICBdLm1hcCh4ID0+IGAke3h9XFxcXHMqXFxcXChgKSksXG4gICAgICBJREVOVF9SRSQxLCByZWdleC5sb29rYWhlYWQoL1xccypcXCgvKSksXG4gICAgY2xhc3NOYW1lOiBcInRpdGxlLmZ1bmN0aW9uXCIsXG4gICAgcmVsZXZhbmNlOiAwXG4gIH07XG5cbiAgY29uc3QgUFJPUEVSVFlfQUNDRVNTID0ge1xuICAgIGJlZ2luOiByZWdleC5jb25jYXQoL1xcLi8sIHJlZ2V4Lmxvb2thaGVhZChcbiAgICAgIHJlZ2V4LmNvbmNhdChJREVOVF9SRSQxLCAvKD8hWzAtOUEtWmEteiRfKF0pLylcbiAgICApKSxcbiAgICBlbmQ6IElERU5UX1JFJDEsXG4gICAgZXhjbHVkZUJlZ2luOiB0cnVlLFxuICAgIGtleXdvcmRzOiBcInByb3RvdHlwZVwiLFxuICAgIGNsYXNzTmFtZTogXCJwcm9wZXJ0eVwiLFxuICAgIHJlbGV2YW5jZTogMFxuICB9O1xuXG4gIGNvbnN0IEdFVFRFUl9PUl9TRVRURVIgPSB7XG4gICAgbWF0Y2g6IFtcbiAgICAgIC9nZXR8c2V0LyxcbiAgICAgIC9cXHMrLyxcbiAgICAgIElERU5UX1JFJDEsXG4gICAgICAvKD89XFwoKS9cbiAgICBdLFxuICAgIGNsYXNzTmFtZToge1xuICAgICAgMTogXCJrZXl3b3JkXCIsXG4gICAgICAzOiBcInRpdGxlLmZ1bmN0aW9uXCJcbiAgICB9LFxuICAgIGNvbnRhaW5zOiBbXG4gICAgICB7IC8vIGVhdCB0byBhdm9pZCBlbXB0eSBwYXJhbXNcbiAgICAgICAgYmVnaW46IC9cXChcXCkvXG4gICAgICB9LFxuICAgICAgUEFSQU1TXG4gICAgXVxuICB9O1xuXG4gIGNvbnN0IEZVTkNfTEVBRF9JTl9SRSA9ICcoXFxcXCgnICtcbiAgICAnW14oKV0qKFxcXFwoJyArXG4gICAgJ1teKCldKihcXFxcKCcgK1xuICAgICdbXigpXSonICtcbiAgICAnXFxcXClbXigpXSopKicgK1xuICAgICdcXFxcKVteKCldKikqJyArXG4gICAgJ1xcXFwpfCcgKyBobGpzLlVOREVSU0NPUkVfSURFTlRfUkUgKyAnKVxcXFxzKj0+JztcblxuICBjb25zdCBGVU5DVElPTl9WQVJJQUJMRSA9IHtcbiAgICBtYXRjaDogW1xuICAgICAgL2NvbnN0fHZhcnxsZXQvLCAvXFxzKy8sXG4gICAgICBJREVOVF9SRSQxLCAvXFxzKi8sXG4gICAgICAvPVxccyovLFxuICAgICAgLyhhc3luY1xccyopPy8sIC8vIGFzeW5jIGlzIG9wdGlvbmFsXG4gICAgICByZWdleC5sb29rYWhlYWQoRlVOQ19MRUFEX0lOX1JFKVxuICAgIF0sXG4gICAga2V5d29yZHM6IFwiYXN5bmNcIixcbiAgICBjbGFzc05hbWU6IHtcbiAgICAgIDE6IFwia2V5d29yZFwiLFxuICAgICAgMzogXCJ0aXRsZS5mdW5jdGlvblwiXG4gICAgfSxcbiAgICBjb250YWluczogW1xuICAgICAgUEFSQU1TXG4gICAgXVxuICB9O1xuXG4gIHJldHVybiB7XG4gICAgbmFtZTogJ0phdmFTY3JpcHQnLFxuICAgIGFsaWFzZXM6IFsnanMnLCAnanN4JywgJ21qcycsICdjanMnXSxcbiAgICBrZXl3b3JkczogS0VZV09SRFMkMSxcbiAgICAvLyB0aGlzIHdpbGwgYmUgZXh0ZW5kZWQgYnkgVHlwZVNjcmlwdFxuICAgIGV4cG9ydHM6IHsgUEFSQU1TX0NPTlRBSU5TLCBDTEFTU19SRUZFUkVOQ0UgfSxcbiAgICBpbGxlZ2FsOiAvIyg/IVskX0Etel0pLyxcbiAgICBjb250YWluczogW1xuICAgICAgaGxqcy5TSEVCQU5HKHtcbiAgICAgICAgbGFiZWw6IFwic2hlYmFuZ1wiLFxuICAgICAgICBiaW5hcnk6IFwibm9kZVwiLFxuICAgICAgICByZWxldmFuY2U6IDVcbiAgICAgIH0pLFxuICAgICAgVVNFX1NUUklDVCxcbiAgICAgIGhsanMuQVBPU19TVFJJTkdfTU9ERSxcbiAgICAgIGhsanMuUVVPVEVfU1RSSU5HX01PREUsXG4gICAgICBIVE1MX1RFTVBMQVRFLFxuICAgICAgQ1NTX1RFTVBMQVRFLFxuICAgICAgR1JBUEhRTF9URU1QTEFURSxcbiAgICAgIFRFTVBMQVRFX1NUUklORyxcbiAgICAgIENPTU1FTlQsXG4gICAgICAvLyBTa2lwIG51bWJlcnMgd2hlbiB0aGV5IGFyZSBwYXJ0IG9mIGEgdmFyaWFibGUgbmFtZVxuICAgICAgeyBtYXRjaDogL1xcJFxcZCsvIH0sXG4gICAgICBOVU1CRVIsXG4gICAgICBDTEFTU19SRUZFUkVOQ0UsXG4gICAgICB7XG4gICAgICAgIHNjb3BlOiAnYXR0cicsXG4gICAgICAgIG1hdGNoOiBJREVOVF9SRSQxICsgcmVnZXgubG9va2FoZWFkKCc6JyksXG4gICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgfSxcbiAgICAgIEZVTkNUSU9OX1ZBUklBQkxFLFxuICAgICAgeyAvLyBcInZhbHVlXCIgY29udGFpbmVyXG4gICAgICAgIGJlZ2luOiAnKCcgKyBobGpzLlJFX1NUQVJURVJTX1JFICsgJ3xcXFxcYihjYXNlfHJldHVybnx0aHJvdylcXFxcYilcXFxccyonLFxuICAgICAgICBrZXl3b3JkczogJ3JldHVybiB0aHJvdyBjYXNlJyxcbiAgICAgICAgcmVsZXZhbmNlOiAwLFxuICAgICAgICBjb250YWluczogW1xuICAgICAgICAgIENPTU1FTlQsXG4gICAgICAgICAgaGxqcy5SRUdFWFBfTU9ERSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjbGFzc05hbWU6ICdmdW5jdGlvbicsXG4gICAgICAgICAgICAvLyB3ZSBoYXZlIHRvIGNvdW50IHRoZSBwYXJlbnMgdG8gbWFrZSBzdXJlIHdlIGFjdHVhbGx5IGhhdmUgdGhlXG4gICAgICAgICAgICAvLyBjb3JyZWN0IGJvdW5kaW5nICggKSBiZWZvcmUgdGhlID0+LiAgVGhlcmUgY291bGQgYmUgYW55IG51bWJlciBvZlxuICAgICAgICAgICAgLy8gc3ViLWV4cHJlc3Npb25zIGluc2lkZSBhbHNvIHN1cnJvdW5kZWQgYnkgcGFyZW5zLlxuICAgICAgICAgICAgYmVnaW46IEZVTkNfTEVBRF9JTl9SRSxcbiAgICAgICAgICAgIHJldHVybkJlZ2luOiB0cnVlLFxuICAgICAgICAgICAgZW5kOiAnXFxcXHMqPT4nLFxuICAgICAgICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNsYXNzTmFtZTogJ3BhcmFtcycsXG4gICAgICAgICAgICAgICAgdmFyaWFudHM6IFtcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgYmVnaW46IGhsanMuVU5ERVJTQ09SRV9JREVOVF9SRSxcbiAgICAgICAgICAgICAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIGJlZ2luOiAvXFwoXFxzKlxcKS8sXG4gICAgICAgICAgICAgICAgICAgIHNraXA6IHRydWVcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGJlZ2luOiAvKFxccyopXFwoLyxcbiAgICAgICAgICAgICAgICAgICAgZW5kOiAvXFwpLyxcbiAgICAgICAgICAgICAgICAgICAgZXhjbHVkZUJlZ2luOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBleGNsdWRlRW5kOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBrZXl3b3JkczogS0VZV09SRFMkMSxcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbnM6IFBBUkFNU19DT05UQUlOU1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH0sXG4gICAgICAgICAgeyAvLyBjb3VsZCBiZSBhIGNvbW1hIGRlbGltaXRlZCBsaXN0IG9mIHBhcmFtcyB0byBhIGZ1bmN0aW9uIGNhbGxcbiAgICAgICAgICAgIGJlZ2luOiAvLC8sXG4gICAgICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG1hdGNoOiAvXFxzKy8sXG4gICAgICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIHsgLy8gSlNYXG4gICAgICAgICAgICB2YXJpYW50czogW1xuICAgICAgICAgICAgICB7IGJlZ2luOiBGUkFHTUVOVC5iZWdpbiwgZW5kOiBGUkFHTUVOVC5lbmQgfSxcbiAgICAgICAgICAgICAgeyBtYXRjaDogWE1MX1NFTEZfQ0xPU0lORyB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYmVnaW46IFhNTF9UQUcuYmVnaW4sXG4gICAgICAgICAgICAgICAgLy8gd2UgY2FyZWZ1bGx5IGNoZWNrIHRoZSBvcGVuaW5nIHRhZyB0byBzZWUgaWYgaXQgdHJ1bHlcbiAgICAgICAgICAgICAgICAvLyBpcyBhIHRhZyBhbmQgbm90IGEgZmFsc2UgcG9zaXRpdmVcbiAgICAgICAgICAgICAgICAnb246YmVnaW4nOiBYTUxfVEFHLmlzVHJ1bHlPcGVuaW5nVGFnLFxuICAgICAgICAgICAgICAgIGVuZDogWE1MX1RBRy5lbmRcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHN1Ykxhbmd1YWdlOiAneG1sJyxcbiAgICAgICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBiZWdpbjogWE1MX1RBRy5iZWdpbixcbiAgICAgICAgICAgICAgICBlbmQ6IFhNTF9UQUcuZW5kLFxuICAgICAgICAgICAgICAgIHNraXA6IHRydWUsXG4gICAgICAgICAgICAgICAgY29udGFpbnM6IFsnc2VsZiddXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgRlVOQ1RJT05fREVGSU5JVElPTixcbiAgICAgIHtcbiAgICAgICAgLy8gcHJldmVudCB0aGlzIGZyb20gZ2V0dGluZyBzd2FsbG93ZWQgdXAgYnkgZnVuY3Rpb25cbiAgICAgICAgLy8gc2luY2UgdGhleSBhcHBlYXIgXCJmdW5jdGlvbiBsaWtlXCJcbiAgICAgICAgYmVnaW5LZXl3b3JkczogXCJ3aGlsZSBpZiBzd2l0Y2ggY2F0Y2ggZm9yXCJcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIC8vIHdlIGhhdmUgdG8gY291bnQgdGhlIHBhcmVucyB0byBtYWtlIHN1cmUgd2UgYWN0dWFsbHkgaGF2ZSB0aGUgY29ycmVjdFxuICAgICAgICAvLyBib3VuZGluZyAoICkuICBUaGVyZSBjb3VsZCBiZSBhbnkgbnVtYmVyIG9mIHN1Yi1leHByZXNzaW9ucyBpbnNpZGVcbiAgICAgICAgLy8gYWxzbyBzdXJyb3VuZGVkIGJ5IHBhcmVucy5cbiAgICAgICAgYmVnaW46ICdcXFxcYig/IWZ1bmN0aW9uKScgKyBobGpzLlVOREVSU0NPUkVfSURFTlRfUkUgK1xuICAgICAgICAgICdcXFxcKCcgKyAvLyBmaXJzdCBwYXJlbnNcbiAgICAgICAgICAnW14oKV0qKFxcXFwoJyArXG4gICAgICAgICAgICAnW14oKV0qKFxcXFwoJyArXG4gICAgICAgICAgICAgICdbXigpXSonICtcbiAgICAgICAgICAgICdcXFxcKVteKCldKikqJyArXG4gICAgICAgICAgJ1xcXFwpW14oKV0qKSonICtcbiAgICAgICAgICAnXFxcXClcXFxccypcXFxceycsIC8vIGVuZCBwYXJlbnNcbiAgICAgICAgcmV0dXJuQmVnaW46dHJ1ZSxcbiAgICAgICAgbGFiZWw6IFwiZnVuYy5kZWZcIixcbiAgICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgICBQQVJBTVMsXG4gICAgICAgICAgaGxqcy5pbmhlcml0KGhsanMuVElUTEVfTU9ERSwgeyBiZWdpbjogSURFTlRfUkUkMSwgY2xhc3NOYW1lOiBcInRpdGxlLmZ1bmN0aW9uXCIgfSlcbiAgICAgICAgXVxuICAgICAgfSxcbiAgICAgIC8vIGNhdGNoIC4uLiBzbyBpdCB3b24ndCB0cmlnZ2VyIHRoZSBwcm9wZXJ0eSBydWxlIGJlbG93XG4gICAgICB7XG4gICAgICAgIG1hdGNoOiAvXFwuXFwuXFwuLyxcbiAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICB9LFxuICAgICAgUFJPUEVSVFlfQUNDRVNTLFxuICAgICAgLy8gaGFjazogcHJldmVudHMgZGV0ZWN0aW9uIG9mIGtleXdvcmRzIGluIHNvbWUgY2lyY3Vtc3RhbmNlc1xuICAgICAgLy8gLmtleXdvcmQoKVxuICAgICAgLy8gJGtleXdvcmQgPSB4XG4gICAgICB7XG4gICAgICAgIG1hdGNoOiAnXFxcXCQnICsgSURFTlRfUkUkMSxcbiAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBtYXRjaDogWyAvXFxiY29uc3RydWN0b3IoPz1cXHMqXFwoKS8gXSxcbiAgICAgICAgY2xhc3NOYW1lOiB7IDE6IFwidGl0bGUuZnVuY3Rpb25cIiB9LFxuICAgICAgICBjb250YWluczogWyBQQVJBTVMgXVxuICAgICAgfSxcbiAgICAgIEZVTkNUSU9OX0NBTEwsXG4gICAgICBVUFBFUl9DQVNFX0NPTlNUQU5ULFxuICAgICAgQ0xBU1NfT1JfRVhURU5EUyxcbiAgICAgIEdFVFRFUl9PUl9TRVRURVIsXG4gICAgICB7XG4gICAgICAgIG1hdGNoOiAvXFwkWyguXS8gLy8gcmVsZXZhbmNlIGJvb3N0ZXIgZm9yIGEgcGF0dGVybiBjb21tb24gdG8gSlMgbGliczogYCQoc29tZXRoaW5nKWAgYW5kIGAkLnNvbWV0aGluZ2BcbiAgICAgIH1cbiAgICBdXG4gIH07XG59XG5cbmV4cG9ydCB7IGphdmFzY3JpcHQgYXMgZGVmYXVsdCB9O1xuIiwgIi8qKlxuICogV2VidmlldyBzeW50YXggaGlnaGxpZ2h0aW5nLlxuICpcbiAqIGhpZ2hsaWdodC5qcyBpcyBidW5kbGVkIGludG8gdGhlIHdlYnZpZXcgb25seS4gVGhlIGhvc3QgbmV2ZXIgaGlnaGxpZ2h0cywgYW5kXG4gKiBhIGZhaWx1cmUgYWx3YXlzIGRlZ3JhZGVzIHRvIHBsYWluIHRleHQ6IHRoZSBwcmV2aWV3IGlzIHN0aWxsIHJlYWRhYmxlLlxuICovXG5cbmltcG9ydCBobGpzIGZyb20gJ2hpZ2hsaWdodC5qcy9saWIvY29yZSc7XG5pbXBvcnQgY3BwIGZyb20gJ2hpZ2hsaWdodC5qcy9saWIvbGFuZ3VhZ2VzL2NwcCc7XG5pbXBvcnQgamF2YXNjcmlwdCBmcm9tICdoaWdobGlnaHQuanMvbGliL2xhbmd1YWdlcy9qYXZhc2NyaXB0JztcblxuaGxqcy5yZWdpc3Rlckxhbmd1YWdlKCdjcHAnLCBjcHApO1xuaGxqcy5yZWdpc3Rlckxhbmd1YWdlKCdqYXZhc2NyaXB0JywgamF2YXNjcmlwdCk7XG5cbi8qKlxuICogQHR5cGVkZWYge3t0ZXh0OiBzdHJpbmcsIGNsYXNzTmFtZTogc3RyaW5nfX0gUHJldmlld1Rva2VuXG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2VJZFxuICogQHJldHVybnMge3tsYW5ndWFnZTogc3RyaW5nfG51bGwsIGRlZ3JhZGVkOiBib29sZWFufX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVMYW5ndWFnZShsYW5ndWFnZUlkKSB7XG4gIGNvbnN0IGlkID0gU3RyaW5nKGxhbmd1YWdlSWQgPz8gJycpLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChpZCA9PT0gJ2NwcCcgfHwgaWQgPT09ICdjKysnIHx8IGlkID09PSAnYycgfHwgaWQgPT09ICdvYmplY3RpdmUtYysrJykge1xuICAgIHJldHVybiB7IGxhbmd1YWdlOiAnY3BwJywgZGVncmFkZWQ6IGZhbHNlIH07XG4gIH1cbiAgaWYgKGlkID09PSAnamF2YXNjcmlwdCcgfHwgaWQgPT09ICdqcycgfHwgaWQgPT09ICdtanMnIHx8IGlkID09PSAnY2pzJykge1xuICAgIHJldHVybiB7IGxhbmd1YWdlOiAnamF2YXNjcmlwdCcsIGRlZ3JhZGVkOiBmYWxzZSB9O1xuICB9XG4gIHJldHVybiB7IGxhbmd1YWdlOiBudWxsLCBkZWdyYWRlZDogdHJ1ZSB9O1xufVxuXG4vKipcbiAqIFNwbGl0IGhpZ2hsaWdodC5qcyBIVE1MIGludG8gbGluZXMgb2YgY2xhc3NlZCB0b2tlbnMuIE9ubHkgdGhlIHNtYWxsIHN1YnNldFxuICogb2YgbWFya3VwIHRoYXQgaGlnaGxpZ2h0LmpzIGVtaXRzIGlzIHVuZGVyc3Rvb2Q7IGFueXRoaW5nIGVsc2UgYmVjb21lcyB0ZXh0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBodG1sXG4gKiBAcmV0dXJucyB7UHJldmlld1Rva2VuW11bXX1cbiAqL1xuZnVuY3Rpb24gaHRtbFRvTGluZXMoaHRtbCkge1xuICAvKiogQHR5cGUge1ByZXZpZXdUb2tlbltdW119ICovXG4gIGNvbnN0IGxpbmVzID0gW1tdXTtcbiAgY29uc3Qgc3RhY2sgPSBbXTtcbiAgY29uc3QgcGF0dGVybiA9IC88c3BhbiBjbGFzcz1cIihbXlwiXSspXCI+fDxcXC9zcGFuPnwoW148XSspL2c7XG4gIGxldCBtYXRjaDtcbiAgd2hpbGUgKChtYXRjaCA9IHBhdHRlcm4uZXhlYyhodG1sKSkgIT09IG51bGwpIHtcbiAgICBpZiAobWF0Y2hbMV0pIHtcbiAgICAgIHN0YWNrLnB1c2gobWF0Y2hbMV0pO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChtYXRjaFswXSA9PT0gJzwvc3Bhbj4nKSB7XG4gICAgICBzdGFjay5wb3AoKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCB0ZXh0ID0gZGVjb2RlRW50aXRpZXMobWF0Y2hbMl0gPz8gJycpO1xuICAgIGNvbnN0IHBhcnRzID0gdGV4dC5zcGxpdCgnXFxuJyk7XG4gICAgZm9yIChjb25zdCBbaW5kZXgsIHBhcnRdIG9mIHBhcnRzLmVudHJpZXMoKSkge1xuICAgICAgaWYgKGluZGV4ID4gMCkge1xuICAgICAgICBsaW5lcy5wdXNoKFtdKTtcbiAgICAgIH1cbiAgICAgIGlmIChwYXJ0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGluZXNbbGluZXMubGVuZ3RoIC0gMV0ucHVzaCh7XG4gICAgICAgICAgdGV4dDogcGFydCxcbiAgICAgICAgICBjbGFzc05hbWU6IHN0YWNrLmxlbmd0aCA+IDAgPyBzdGFja1tzdGFjay5sZW5ndGggLSAxXSA6ICcnLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGxpbmVzO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZGVjb2RlRW50aXRpZXModmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlXG4gICAgLnJlcGxhY2UoLyZsdDsvZywgJzwnKVxuICAgIC5yZXBsYWNlKC8mZ3Q7L2csICc+JylcbiAgICAucmVwbGFjZSgvJnF1b3Q7L2csICdcIicpXG4gICAgLnJlcGxhY2UoLyYjeDI3Oy9nLCBcIidcIilcbiAgICAucmVwbGFjZSgvJiMzOTsvZywgXCInXCIpXG4gICAgLnJlcGxhY2UoLyZhbXA7L2csICcmJyk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAqIEByZXR1cm5zIHtQcmV2aWV3VG9rZW5bXVtdfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcGxhaW5MaW5lcyh0ZXh0KSB7XG4gIHJldHVybiBTdHJpbmcodGV4dCA/PyAnJylcbiAgICAuc3BsaXQoL1xcclxcbnxcXHJ8XFxuLylcbiAgICAubWFwKChsaW5lKSA9PiAobGluZS5sZW5ndGggPiAwID8gW3sgdGV4dDogbGluZSwgY2xhc3NOYW1lOiAnJyB9XSA6IFtdKSk7XG59XG5cbi8qKlxuICogSGlnaGxpZ2h0IGEgc291cmNlIHNsaWNlLiBOZXZlciB0aHJvd3MuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAqIEBwYXJhbSB7c3RyaW5nfSBsYW5ndWFnZUlkXG4gKiBAcmV0dXJucyB7e2xpbmVzOiBQcmV2aWV3VG9rZW5bXVtdLCBkZWdyYWRlZDogYm9vbGVhbn19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoaWdobGlnaHRMaW5lcyh0ZXh0LCBsYW5ndWFnZUlkKSB7XG4gIGNvbnN0IHJlc29sdmVkID0gcmVzb2x2ZUxhbmd1YWdlKGxhbmd1YWdlSWQpO1xuICBpZiAoIXJlc29sdmVkLmxhbmd1YWdlKSB7XG4gICAgcmV0dXJuIHsgbGluZXM6IHBsYWluTGluZXModGV4dCksIGRlZ3JhZGVkOiB0cnVlIH07XG4gIH1cbiAgdHJ5IHtcbiAgICBjb25zdCBodG1sID0gaGxqcy5oaWdobGlnaHQoU3RyaW5nKHRleHQgPz8gJycpLCB7IGxhbmd1YWdlOiByZXNvbHZlZC5sYW5ndWFnZSB9KS52YWx1ZTtcbiAgICByZXR1cm4geyBsaW5lczogaHRtbFRvTGluZXMoaHRtbCksIGRlZ3JhZGVkOiBmYWxzZSB9O1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4geyBsaW5lczogcGxhaW5MaW5lcyh0ZXh0KSwgZGVncmFkZWQ6IHRydWUgfTtcbiAgfVxufVxuIiwgIi8qKlxuICogV2VidmlldyBlbnRyeSBwb2ludC5cbiAqXG4gKiBSZXNwb25zaWJpbGl0aWVzIGFyZSBkZWxpYmVyYXRlbHkgbmFycm93OiB0YWxrIHByb3RvY29sLCByZW5kZXIgdGhlIERUTywgc2hvd1xuICogc2VsZWN0aW9uIGRldGFpbHMuIE5vIGFuYWx5c2lzLCBubyBmaWxlIGFjY2Vzcywgbm8gZ3JhcGggY29uc3RydWN0aW9uLlxuICovXG5cbmltcG9ydCB7IGNyZWF0ZUJyaWRnZSB9IGZyb20gJy4uL2NvcmUvcHJvdG9jb2wvYnJpZGdlLmpzJztcbmltcG9ydCB7IERJUkVDVElPTlMsIFBST1RPQ09MX1ZFUlNJT04gfSBmcm9tICcuLi9jb3JlL3Byb3RvY29sL2VudmVsb3BlLmpzJztcbmltcG9ydCB7IHZhbGlkYXRlRHRvIH0gZnJvbSAnLi4vY29yZS9ncmFwaC9kdG8uanMnO1xuaW1wb3J0IHsgY3JlYXRlU3ZnUmVuZGVyZXIgfSBmcm9tICcuLi92aXN1YWxpemF0aW9uL3JlbmRlcmVyL3N2Z1JlbmRlcmVyLmpzJztcbmltcG9ydCB7IGJ1aWxkUHJldmlld01vZGVsIH0gZnJvbSAnLi4vY29yZS9zb3VyY2UvcHJlc2VudGF0aW9uLmpzJztcbmltcG9ydCB7IHJlc29sdmVQcmV2aWV3U2V0dGluZ3MgfSBmcm9tICcuLi9jb3JlL3NvdXJjZS9zZXR0aW5ncy5qcyc7XG5pbXBvcnQgeyBjbGFtcEV4cGxhbmF0aW9uRGVwdGgsIHJlc29sdmVFeHBsYW5hdGlvblNldHRpbmdzIH0gZnJvbSAnLi4vY29yZS9leHBsYW5hdGlvbi9zZXR0aW5ncy5qcyc7XG5pbXBvcnQgeyBjcmVhdGVQcmV2aWV3Q29udHJvbGxlciB9IGZyb20gJy4vcHJldmlld0NvbnRyb2xsZXIuanMnO1xuaW1wb3J0IHsgaGlnaGxpZ2h0TGluZXMgfSBmcm9tICcuL2hpZ2hsaWdodC5qcyc7XG5cbmNvbnN0IHZzY29kZUFwaSA9IGFjcXVpcmVWc0NvZGVBcGkoKTtcblxuY29uc3Qgc3ZnID0gLyoqIEB0eXBlIHtTVkdTVkdFbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWdyYXBoJykpO1xuY29uc3QgbWV0YSA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtbWV0YScpKTtcbmNvbnN0IHN0YXR1cyA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2Ytc3RhdHVzJykpO1xuY29uc3QgYmFubmVyID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1iYW5uZXInKSk7XG5jb25zdCBlbXB0eSA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtZW1wdHknKSk7XG5jb25zdCBkZXRhaWxCb2R5ID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1kZXRhaWwtYm9keScpKTtcbmNvbnN0IGxlZ2VuZCA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtbGVnZW5kJykpO1xuY29uc3QgcmVsb2FkQnV0dG9uID0gLyoqIEB0eXBlIHtIVE1MQnV0dG9uRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1yZWZyZXNoJykpO1xuY29uc3QgZnVuY3Rpb25QaWNrZXIgPSAvKiogQHR5cGUge0hUTUxTZWxlY3RFbGVtZW50fG51bGx9ICovIChcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWZ1bmN0aW9uJylcbik7XG5jb25zdCBwcmV2aWV3ID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1wcmV2aWV3JykpO1xuY29uc3QgcHJldmlld1RpdGxlID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1wcmV2aWV3LXRpdGxlJykpO1xuY29uc3QgcHJldmlld01ldGEgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLXByZXZpZXctbWV0YScpKTtcbmNvbnN0IHByZXZpZXdFeHBsYWluID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1wcmV2aWV3LWV4cGxhaW4nKVxuKTtcbmNvbnN0IHByZXZpZXdCb2R5ID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1wcmV2aWV3LWJvZHknKSk7XG5jb25zdCBwcmV2aWV3Tm90ZSA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtcHJldmlldy1ub3RlJykpO1xuY29uc3QgcHJldmlld1BpbiA9IC8qKiBAdHlwZSB7SFRNTEJ1dHRvbkVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtcHJldmlldy1waW4nKSk7XG5jb25zdCBwcmV2aWV3Q2xvc2UgPSAvKiogQHR5cGUge0hUTUxCdXR0b25FbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLXByZXZpZXctY2xvc2UnKSk7XG5jb25zdCBwcmV2aWV3T3BlbiA9IC8qKiBAdHlwZSB7SFRNTEJ1dHRvbkVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtcHJldmlldy1vcGVuJykpO1xuY29uc3QgZm5TdW1tYXJ5ID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudHxudWxsfSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWZuLXN1bW1hcnknKSk7XG5jb25zdCBleHBsYWluU2VjdGlvbiA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR8bnVsbH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1leHBsYWluJykpO1xuY29uc3QgZXhwbGFpbkRlcHRoU2VsZWN0ID0gLyoqIEB0eXBlIHtIVE1MU2VsZWN0RWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1leHBsYWluLWRlcHRoJylcbik7XG5jb25zdCBleHBsYWluSXRlbXMgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fG51bGx9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtZXhwbGFpbi1pdGVtcycpKTtcbmNvbnN0IGV4cGxhaW5FdmlkZW5jZSA9IC8qKiBAdHlwZSB7SFRNTERldGFpbHNFbGVtZW50fG51bGx9ICovIChcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWV4cGxhaW4tZXZpZGVuY2UnKVxuKTtcbmNvbnN0IGV4cGxhaW5FdmlkZW5jZUxpc3QgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fG51bGx9ICovIChcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWV4cGxhaW4tZXZpZGVuY2UtbGlzdCcpXG4pO1xuY29uc3QgZXhwbGFpbkxpbWl0cyA9IC8qKiBAdHlwZSB7SFRNTERldGFpbHNFbGVtZW50fG51bGx9ICovIChcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWV4cGxhaW4tbGltaXRzJylcbik7XG5jb25zdCBleHBsYWluTGltaXRzVGV4dCA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR8bnVsbH0gKi8gKFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtZXhwbGFpbi1saW1pdHMtdGV4dCcpXG4pO1xuY29uc3QgcGVyc3BlY3RpdmVTZWxlY3QgPSAvKiogQHR5cGUge0hUTUxTZWxlY3RFbGVtZW50fG51bGx9ICovIChcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLXBlcnNwZWN0aXZlJylcbik7XG5jb25zdCBzd2l0Y2hQZXJzcGVjdGl2ZUJ0biA9IC8qKiBAdHlwZSB7SFRNTEJ1dHRvbkVsZW1lbnR8bnVsbH0gKi8gKFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2Ytc3dpdGNoLXBlcnNwZWN0aXZlJylcbik7XG5jb25zdCBzY29wZUJhbm5lciA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR8bnVsbH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1zY29wZS1iYW5uZXInKSk7XG5jb25zdCBjYWxsc1BhbmVsID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudHxudWxsfSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWNhbGxzLXBhbmVsJykpO1xuY29uc3QgY2FsbHNGaWx0ZXJTdGF0dXMgPSAvKiogQHR5cGUge0hUTUxTZWxlY3RFbGVtZW50fG51bGx9ICovIChcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWNhbGxzLWZpbHRlci1zdGF0dXMnKVxuKTtcbmNvbnN0IGNhbGxzRXhwYW5kQnRuID0gLyoqIEB0eXBlIHtIVE1MQnV0dG9uRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1jYWxscy1leHBhbmQnKVxuKTtcbmNvbnN0IGNhbGxzQ29sbGFwc2VCdG4gPSAvKiogQHR5cGUge0hUTUxCdXR0b25FbGVtZW50fG51bGx9ICovIChcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWNhbGxzLWNvbGxhcHNlJylcbik7XG5jb25zdCBjYWxsc0ZvY3VzQnRuID0gLyoqIEB0eXBlIHtIVE1MQnV0dG9uRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1jYWxscy1mb2N1cycpXG4pO1xuY29uc3QgY2FsbGVyc0hlYWRpbmcgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fG51bGx9ICovIChcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWNhbGxlcnMtaGVhZGluZycpXG4pO1xuY29uc3QgY2FsbGVyc0xpc3QgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fG51bGx9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtY2FsbGVycy1saXN0JykpO1xuY29uc3QgY2FsbGVyc01vcmVCdG4gPSAvKiogQHR5cGUge0hUTUxCdXR0b25FbGVtZW50fG51bGx9ICovIChcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWNhbGxlcnMtbW9yZScpXG4pO1xuY29uc3QgY2FsbGVlc0hlYWRpbmcgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fG51bGx9ICovIChcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWNhbGxlZXMtaGVhZGluZycpXG4pO1xuY29uc3QgY2FsbGVlc0xpc3QgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fG51bGx9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtY2FsbGVlcy1saXN0JykpO1xuY29uc3QgY2FsbGVlc01vcmVCdG4gPSAvKiogQHR5cGUge0hUTUxCdXR0b25FbGVtZW50fG51bGx9ICovIChcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWNhbGxlZXMtbW9yZScpXG4pO1xuY29uc3QgdW5yZXNvbHZlZEJ1Y2tldERldGFpbHMgPSAvKiogQHR5cGUge0hUTUxEZXRhaWxzRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi11bnJlc29sdmVkLWJ1Y2tldCcpXG4pO1xuY29uc3QgdW5yZXNvbHZlZFN1bW1hcnkgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fG51bGx9ICovIChcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLXVucmVzb2x2ZWQtc3VtbWFyeScpXG4pO1xuY29uc3QgdW5yZXNvbHZlZExpc3QgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fG51bGx9ICovIChcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLXVucmVzb2x2ZWQtbGlzdCcpXG4pO1xuXG4vKiogQHR5cGUge2ltcG9ydCgnLi4vY29yZS9ncmFwaC9kdG8uanMnKS5HcmFwaER0byB8IG51bGx9ICovXG5sZXQgY3VycmVudER0byA9IG51bGw7XG5jb25zdCBwcmVmZXJyZWRTeW1ib2xJZCA9IGRvY3VtZW50LmJvZHkuZGF0YXNldC5wcmVmZXJyZWRTeW1ib2wgfHwgbnVsbDtcbmNvbnN0IHByZWZlcnJlZFBlcnNwZWN0aXZlID1cbiAgZG9jdW1lbnQuYm9keS5kYXRhc2V0LnByZWZlcnJlZFBlcnNwZWN0aXZlID09PSAnY2FsbF9ncmFwaCcgPyAnY2FsbF9ncmFwaCcgOiAnY2ZnJztcblxuLyoqIEB0eXBlIHtzdHJpbmcgfCBudWxsfSAqL1xubGV0IHNlbGVjdGVkU3ltYm9sSWQgPSBwcmVmZXJyZWRTeW1ib2xJZDtcbi8qKiBAdHlwZSB7J2NmZyd8J2NhbGxfZ3JhcGgnfSAqL1xubGV0IGFjdGl2ZVBlcnNwZWN0aXZlID0gcHJlZmVycmVkUGVyc3BlY3RpdmU7XG4vKiogQHR5cGUge3N0cmluZ3x1bmRlZmluZWR9ICovXG5sZXQgY2FsbGVyc05leHRDdXJzb3I7XG4vKiogQHR5cGUge3N0cmluZ3x1bmRlZmluZWR9ICovXG5sZXQgY2FsbGVlc05leHRDdXJzb3I7XG5pZiAocGVyc3BlY3RpdmVTZWxlY3QpIHtcbiAgcGVyc3BlY3RpdmVTZWxlY3QudmFsdWUgPSBhY3RpdmVQZXJzcGVjdGl2ZTtcbn1cblxuLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSAqL1xubGV0IHNldHRpbmdzID0gcmVzb2x2ZVByZXZpZXdTZXR0aW5ncyh7fSk7XG4vKiogQHR5cGUge3tkZWZhdWx0RGVwdGg6IDF8MnwzfDQsIHNob3dFdmlkZW5jZTogYm9vbGVhbiwgaW5jbHVkZUxpbWl0YXRpb25zOiBib29sZWFufX0gKi9cbmxldCBleHBsYW5hdGlvblNldHRpbmdzID0gcmVzb2x2ZUV4cGxhbmF0aW9uU2V0dGluZ3Moe30pO1xuLyoqIEB0eXBlIHsxfDJ8M3w0fSAqL1xubGV0IGFjdGl2ZUV4cGxhaW5EZXB0aCA9IGV4cGxhbmF0aW9uU2V0dGluZ3MuZGVmYXVsdERlcHRoO1xuLyoqIEB0eXBlIHtzdHJpbmd8bnVsbH0gKi9cbmxldCBhY3RpdmVOb2RlSWQgPSBudWxsO1xuLyoqIEB0eXBlIHtudW1iZXJ9ICovXG5sZXQgZXhwbGFpbk5vZGVSZXF1ZXN0ID0gMDtcbi8qKiBAdHlwZSB7bnVtYmVyfSAqL1xubGV0IGV4cGxhaW5GdW5jdGlvblJlcXVlc3QgPSAwO1xuLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBSZWNvcmQ8c3RyaW5nLCBhbnk+Pn0gKi9cbmNvbnN0IHByZXZpZXdDYWNoZSA9IG5ldyBNYXAoKTtcbi8qKiBAdHlwZSB7TWFwPHN0cmluZywgc3RyaW5nPn0gKi9cbmxldCBpbnRlZ3JpdHlCeU5vZGUgPSBuZXcgTWFwKCk7XG4vKiogQHR5cGUge3N0cmluZ3xudWxsfSAqL1xubGV0IHByZXZpZXdOb2RlSWQgPSBudWxsO1xuLyoqIEB0eXBlIHtudW1iZXJ9ICovXG5sZXQgcHJldmlld1JlcXVlc3QgPSAwO1xuLyoqIEB0eXBlIHt7eDogbnVtYmVyLCB5OiBudW1iZXJ9fG51bGx9ICovXG5sZXQgcHJldmlld0FuY2hvciA9IG51bGw7XG5cbmNvbnN0IHJlbmRlcmVyID0gY3JlYXRlU3ZnUmVuZGVyZXIoe1xuICBzdmcsXG4gIG9uU2VsZWN0OiAobm9kZUlkLCBub2RlKSA9PiB7XG4gICAgc2hvd05vZGVEZXRhaWxzKG5vZGVJZCwgbm9kZSk7XG4gICAgYnJpZGdlLnJlc3BvbmQoJ25vZGUuc2VsZWN0JywgeyBub2RlSWQgfSk7XG4gIH0sXG4gIG9uTmF2aWdhdGU6IChub2RlSWQsIG5vZGUsIHRyaWdnZXIpID0+IHtcbiAgICBpZiAodHJpZ2dlciA9PT0gJ3BvaW50ZXInICYmICFzZXR0aW5ncy5jbGlja1RvTmF2aWdhdGUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdm9pZCBuYXZpZ2F0ZVRvKG5vZGVJZCwgbm9kZSk7XG4gIH0sXG4gIG9uUHJldmlld0VudGVyOiAobm9kZUlkLCBfbm9kZSwgcG9pbnQpID0+IHtcbiAgICBwcmV2aWV3Q29udHJvbGxlci5wb2ludGVyRW50ZXIobm9kZUlkLCBwb2ludCk7XG4gIH0sXG4gIG9uUHJldmlld01vdmU6IChwb2ludCkgPT4ge1xuICAgIHByZXZpZXdDb250cm9sbGVyLnBvaW50ZXJNb3ZlKHBvaW50KTtcbiAgfSxcbiAgb25QcmV2aWV3TGVhdmU6ICgpID0+IHtcbiAgICBwcmV2aWV3Q29udHJvbGxlci5wb2ludGVyTGVhdmUoKTtcbiAgfSxcbiAgb25QcmV2aWV3S2V5OiAobm9kZUlkKSA9PiB7XG4gICAgdm9pZCBvcGVuUHJldmlldyhub2RlSWQsIG51bGwsIHRydWUpO1xuICB9LFxufSk7XG5cbmNvbnN0IHByZXZpZXdDb250cm9sbGVyID0gY3JlYXRlUHJldmlld0NvbnRyb2xsZXIoe1xuICBkZWxheU1zOiBzZXR0aW5ncy5kZWxheU1zLFxuICBlbmFibGVkOiBzZXR0aW5ncy5lbmFibGVkLFxuICBwaW5CeURlZmF1bHQ6IHNldHRpbmdzLnBpbkJ5RGVmYXVsdCxcbiAgb25TaG93OiAobm9kZUlkLCBhbmNob3IpID0+IHtcbiAgICBzeW5jUGluQnV0dG9uKHByZXZpZXdDb250cm9sbGVyLmlzUGlubmVkKCkpO1xuICAgIHZvaWQgb3BlblByZXZpZXcobm9kZUlkLCBhbmNob3IsIGZhbHNlKTtcbiAgfSxcbiAgb25IaWRlOiAoKSA9PiB7XG4gICAgaGlkZVByZXZpZXcoKTtcbiAgfSxcbn0pO1xuaWYgKHNldHRpbmdzLnBpbkJ5RGVmYXVsdCkge1xuICBwcmV2aWV3Q29udHJvbGxlci5zZXRQaW5uZWQodHJ1ZSk7XG59XG5zeW5jUGluQnV0dG9uKHNldHRpbmdzLnBpbkJ5RGVmYXVsdCk7XG5cbmNvbnN0IGJyaWRnZSA9IGNyZWF0ZUJyaWRnZSh7XG4gIHBvc3Q6IChtZXNzYWdlKSA9PiB2c2NvZGVBcGkucG9zdE1lc3NhZ2UobWVzc2FnZSksXG4gIGluYm91bmREaXJlY3Rpb246IERJUkVDVElPTlMuSE9TVF9UT19XRUJWSUVXLFxuICB0aW1lb3V0TXM6IDgwMDAsXG4gIGxvZ2dlcjoge1xuICAgIGRlYnVnOiAoKSA9PiB7fSxcbiAgICB3YXJuOiAobWVzc2FnZSwgZmllbGRzKSA9PiBjb25zb2xlLndhcm4oJ1tjb2RlZmxvd10nLCBtZXNzYWdlLCBmaWVsZHMpLFxuICAgIGVycm9yOiAobWVzc2FnZSwgZmllbGRzKSA9PiBjb25zb2xlLmVycm9yKCdbY29kZWZsb3ddJywgbWVzc2FnZSwgZmllbGRzKSxcbiAgfSxcbn0pO1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpc0Vycm9yXVxuICovXG5mdW5jdGlvbiBzZXRCYW5uZXIobWVzc2FnZSwgaXNFcnJvciA9IGZhbHNlKSB7XG4gIGlmICghbWVzc2FnZSkge1xuICAgIGJhbm5lci5oaWRkZW4gPSB0cnVlO1xuICAgIGJhbm5lci50ZXh0Q29udGVudCA9ICcnO1xuICAgIHJldHVybjtcbiAgfVxuICBiYW5uZXIuaGlkZGVuID0gZmFsc2U7XG4gIGJhbm5lci5jbGFzc0xpc3QudG9nZ2xlKCdpcy1lcnJvcicsIGlzRXJyb3IpO1xuICBiYW5uZXIudGV4dENvbnRlbnQgPSBtZXNzYWdlO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gKi9cbmZ1bmN0aW9uIHNldFN0YXR1cyh0ZXh0KSB7XG4gIHN0YXR1cy50ZXh0Q29udGVudCA9IHRleHQ7XG59XG5cbmZ1bmN0aW9uIGNsZWFyRGV0YWlsKCkge1xuICBhY3RpdmVOb2RlSWQgPSBudWxsO1xuICBkZXRhaWxCb2R5LnJlcGxhY2VDaGlsZHJlbigpO1xuICBjb25zdCBwYXJhZ3JhcGggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG4gIHBhcmFncmFwaC5jbGFzc05hbWUgPSAnY2YtbXV0ZWQnO1xuICBwYXJhZ3JhcGgudGV4dENvbnRlbnQgPSAnU2VsZWN0IGEgbm9kZSB0byBpbnNwZWN0IGl0Lic7XG4gIGRldGFpbEJvZHkuYXBwZW5kQ2hpbGQocGFyYWdyYXBoKTtcbiAgY2xlYXJFeHBsYW5hdGlvbigpO1xufVxuXG5mdW5jdGlvbiBjbGVhckV4cGxhbmF0aW9uKCkge1xuICBleHBsYWluTm9kZVJlcXVlc3QgKz0gMTtcbiAgaWYgKGV4cGxhaW5TZWN0aW9uKSB7XG4gICAgZXhwbGFpblNlY3Rpb24uaGlkZGVuID0gdHJ1ZTtcbiAgfVxuICBleHBsYWluSXRlbXM/LnJlcGxhY2VDaGlsZHJlbigpO1xuICBpZiAoZXhwbGFpbkV2aWRlbmNlKSB7XG4gICAgZXhwbGFpbkV2aWRlbmNlLmhpZGRlbiA9IHRydWU7XG4gIH1cbiAgZXhwbGFpbkV2aWRlbmNlTGlzdD8ucmVwbGFjZUNoaWxkcmVuKCk7XG4gIGlmIChleHBsYWluTGltaXRzKSB7XG4gICAgZXhwbGFpbkxpbWl0cy5oaWRkZW4gPSB0cnVlO1xuICB9XG4gIGlmIChleHBsYWluTGltaXRzVGV4dCkge1xuICAgIGV4cGxhaW5MaW1pdHNUZXh0LnRleHRDb250ZW50ID0gJyc7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IHBheWxvYWRcbiAqL1xuZnVuY3Rpb24gcmVuZGVyTm9kZUV4cGxhbmF0aW9uKHBheWxvYWQpIHtcbiAgaWYgKCFleHBsYWluU2VjdGlvbiB8fCAhZXhwbGFpbkl0ZW1zKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGl0ZW1zID0gQXJyYXkuaXNBcnJheShwYXlsb2FkPy5pdGVtcykgPyBwYXlsb2FkLml0ZW1zIDogW107XG4gIGNvbnN0IGxpbWl0cyA9IEFycmF5LmlzQXJyYXkocGF5bG9hZD8ubGltaXRhdGlvbnMpID8gcGF5bG9hZC5saW1pdGF0aW9ucyA6IFtdO1xuICBleHBsYWluSXRlbXMucmVwbGFjZUNoaWxkcmVuKCk7XG4gIGlmIChpdGVtcy5sZW5ndGggPT09IDAgJiYgbGltaXRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGV4cGxhaW5TZWN0aW9uLmhpZGRlbiA9IHRydWU7XG4gICAgcmV0dXJuO1xuICB9XG4gIGV4cGxhaW5TZWN0aW9uLmhpZGRlbiA9IGZhbHNlO1xuXG4gIGNvbnN0IGV2aWRlbmNlUmVmcyA9IFtdO1xuICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICBpZiAoaXRlbS5ydWxlSWQgPT09ICdmbi5saW1pdGF0aW9ucycpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG4gICAgcm93LmNsYXNzTmFtZSA9IGBjZi1leHBsYWluLWl0ZW0gY2YtZXhwbGFpbi0tJHtpdGVtLmNsYWltID8/ICdncm91bmRlZCd9YDtcbiAgICByb3cudGV4dENvbnRlbnQgPSBpdGVtLnRleHQ7XG4gICAgZXhwbGFpbkl0ZW1zLmFwcGVuZENoaWxkKHJvdyk7XG4gICAgZm9yIChjb25zdCByZWYgb2YgaXRlbS5ldmlkZW5jZSA/PyBbXSkge1xuICAgICAgZXZpZGVuY2VSZWZzLnB1c2gocmVmKTtcbiAgICB9XG4gIH1cblxuICBpZiAoZXhwbGFpbkV2aWRlbmNlICYmIGV4cGxhaW5FdmlkZW5jZUxpc3QpIHtcbiAgICBleHBsYWluRXZpZGVuY2VMaXN0LnJlcGxhY2VDaGlsZHJlbigpO1xuICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0KCk7XG4gICAgY29uc3QgdW5pcXVlUmVmcyA9IGV2aWRlbmNlUmVmcy5maWx0ZXIoKHJlZikgPT4ge1xuICAgICAgY29uc3Qga2V5ID0gYCR7cmVmLmtpbmR9OiR7cmVmLmlkfWA7XG4gICAgICBpZiAoc2Vlbi5oYXMoa2V5KSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBzZWVuLmFkZChrZXkpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgaWYgKGV4cGxhbmF0aW9uU2V0dGluZ3Muc2hvd0V2aWRlbmNlICYmIHVuaXF1ZVJlZnMubGVuZ3RoID4gMCkge1xuICAgICAgZXhwbGFpbkV2aWRlbmNlLmhpZGRlbiA9IGZhbHNlO1xuICAgICAgZm9yIChjb25zdCByZWYgb2YgdW5pcXVlUmVmcy5zbGljZSgwLCA4KSkge1xuICAgICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICAgIGlmIChyZWYucmFuZ2UpIHtcbiAgICAgICAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICAgICAgICBidG4udHlwZSA9ICdidXR0b24nO1xuICAgICAgICAgIGJ0bi5jbGFzc05hbWUgPSAnY2YtZXZpZGVuY2UtbGluayc7XG4gICAgICAgICAgYnRuLnRleHRDb250ZW50ID0gcmVmLmxhYmVsIHx8IGAke3JlZi5raW5kfTogbGluZSAke3JlZi5yYW5nZS5zdGFydExpbmUgKyAxfWA7XG4gICAgICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICAgICAgdm9pZCBuYXZpZ2F0ZVRvUmFuZ2UocmVmLnJhbmdlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBsaS5hcHBlbmRDaGlsZChidG4pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxpLnRleHRDb250ZW50ID0gYCR7cmVmLmtpbmR9OiAke3JlZi5sYWJlbCB8fCByZWYuaWR9YDtcbiAgICAgICAgfVxuICAgICAgICBleHBsYWluRXZpZGVuY2VMaXN0LmFwcGVuZENoaWxkKGxpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZXhwbGFpbkV2aWRlbmNlLmhpZGRlbiA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgaWYgKGV4cGxhaW5MaW1pdHMgJiYgZXhwbGFpbkxpbWl0c1RleHQpIHtcbiAgICBpZiAobGltaXRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGV4cGxhaW5MaW1pdHMuaGlkZGVuID0gZmFsc2U7XG4gICAgICBleHBsYWluTGltaXRzLm9wZW4gPSBleHBsYW5hdGlvblNldHRpbmdzLmluY2x1ZGVMaW1pdGF0aW9ucztcbiAgICAgIGV4cGxhaW5MaW1pdHNUZXh0LnRleHRDb250ZW50ID0gbGltaXRzLmpvaW4oJyAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhwbGFpbkxpbWl0cy5oaWRkZW4gPSB0cnVlO1xuICAgICAgZXhwbGFpbkxpbWl0c1RleHQudGV4dENvbnRlbnQgPSAnJztcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IHJhbmdlXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIG5hdmlnYXRlVG9SYW5nZShyYW5nZSkge1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ25hdmlnYXRlLnRvJywge1xuICAgICAgZmlsZUlkOiByYW5nZS5maWxlSWQsXG4gICAgICByYW5nZSxcbiAgICB9KTtcbiAgICBpZiAocmVzcG9uc2UucGF5bG9hZC5vayAhPT0gdHJ1ZSkge1xuICAgICAgc2V0QmFubmVyKFxuICAgICAgICBgJHtyZXNwb25zZS5wYXlsb2FkLmNvZGUgPz8gJ0VfTkFWSUdBVElPTid9OiAke3Jlc3BvbnNlLnBheWxvYWQubWVzc2FnZSA/PyAnQ291bGQgbm90IG9wZW4gc291cmNlLid9YCxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICk7XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHNldEJhbm5lcihgQ291bGQgbm90IG9wZW4gc291cmNlOiAke2Vycm9yPy5tZXNzYWdlID8/IFN0cmluZyhlcnJvcil9YCwgdHJ1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGxvYWROb2RlRXhwbGFuYXRpb24obm9kZUlkKSB7XG4gIGlmICghY3VycmVudER0byB8fCBjdXJyZW50RHRvLmR0b0tpbmQgIT09ICdjZmcnIHx8ICFleHBsYWluU2VjdGlvbikge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCByZXF1ZXN0ID0gKytleHBsYWluTm9kZVJlcXVlc3Q7XG4gIGNvbnN0IHNrZWxldG9uVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBpZiAocmVxdWVzdCA9PT0gZXhwbGFpbk5vZGVSZXF1ZXN0ICYmIGV4cGxhaW5TZWN0aW9uICYmIGV4cGxhaW5JdGVtcykge1xuICAgICAgZXhwbGFpblNlY3Rpb24uaGlkZGVuID0gZmFsc2U7XG4gICAgICBleHBsYWluSXRlbXMudGV4dENvbnRlbnQgPSAnR2VuZXJhdGluZyBleHBsYW5hdGlvblx1MjAyNic7XG4gICAgfVxuICB9LCAxMDApO1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ2V4cGxhaW4ubm9kZScsIHtcbiAgICAgIG5vZGVJZCxcbiAgICAgIGRlcHRoOiBhY3RpdmVFeHBsYWluRGVwdGgsXG4gICAgfSk7XG4gICAgY2xlYXJUaW1lb3V0KHNrZWxldG9uVGltZXIpO1xuICAgIGlmIChyZXF1ZXN0ICE9PSBleHBsYWluTm9kZVJlcXVlc3QgfHwgYWN0aXZlTm9kZUlkICE9PSBub2RlSWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmVuZGVyTm9kZUV4cGxhbmF0aW9uKHJlc3BvbnNlLnBheWxvYWQpO1xuICB9IGNhdGNoIHtcbiAgICBjbGVhclRpbWVvdXQoc2tlbGV0b25UaW1lcik7XG4gICAgaWYgKHJlcXVlc3QgPT09IGV4cGxhaW5Ob2RlUmVxdWVzdCkge1xuICAgICAgY2xlYXJFeHBsYW5hdGlvbigpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7aW1wb3J0KCcuLi9jb3JlL2dyYXBoL2R0by5qcycpLkdyYXBoRHRvfSBkdG9cbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZEZ1bmN0aW9uU3VtbWFyeShkdG8pIHtcbiAgaWYgKCFmblN1bW1hcnkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKGR0by5kdG9LaW5kICE9PSAnY2ZnJykge1xuICAgIGZuU3VtbWFyeS5oaWRkZW4gPSB0cnVlO1xuICAgIGZuU3VtbWFyeS50ZXh0Q29udGVudCA9ICcnO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCByZXF1ZXN0ID0gKytleHBsYWluRnVuY3Rpb25SZXF1ZXN0O1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ2V4cGxhaW4uZnVuY3Rpb24nLCB7XG4gICAgICBkZXB0aDogYWN0aXZlRXhwbGFpbkRlcHRoLFxuICAgIH0pO1xuICAgIGlmIChyZXF1ZXN0ICE9PSBleHBsYWluRnVuY3Rpb25SZXF1ZXN0IHx8IGN1cnJlbnREdG8gIT09IGR0bykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB0ZXh0ID0gW3Jlc3BvbnNlLnBheWxvYWQ/LnN1bW1hcnksIC4uLihyZXNwb25zZS5wYXlsb2FkPy5saW1pdGF0aW9ucyA/PyBbXSldXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAuam9pbignICcpO1xuICAgIGlmICh0ZXh0KSB7XG4gICAgICBmblN1bW1hcnkudGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgZm5TdW1tYXJ5LmhpZGRlbiA9IGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICBmblN1bW1hcnkuaGlkZGVuID0gdHJ1ZTtcbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIGlmIChyZXF1ZXN0ID09PSBleHBsYWluRnVuY3Rpb25SZXF1ZXN0KSB7XG4gICAgICBmblN1bW1hcnkuaGlkZGVuID0gdHJ1ZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbGFiZWxcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICogQHJldHVybnMge1tIVE1MRWxlbWVudCwgSFRNTEVsZW1lbnRdfVxuICovXG5mdW5jdGlvbiBkZXRhaWxQYWlyKGxhYmVsLCB2YWx1ZSkge1xuICBjb25zdCB0ZXJtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZHQnKTtcbiAgdGVybS50ZXh0Q29udGVudCA9IGxhYmVsO1xuICBjb25zdCBkZXNjcmlwdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RkJyk7XG4gIGRlc2NyaXB0aW9uLnRleHRDb250ZW50ID0gdmFsdWU7XG4gIHJldHVybiBbdGVybSwgZGVzY3JpcHRpb25dO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWRcbiAqIEBwYXJhbSB7aW1wb3J0KCcuLi9jb3JlL2dyYXBoL2R0by5qcycpLkR0b05vZGV9IFtub2RlXVxuICovXG5mdW5jdGlvbiBzaG93Tm9kZURldGFpbHMobm9kZUlkLCBub2RlKSB7XG4gIGlmICghbm9kZUlkIHx8ICFub2RlKSB7XG4gICAgY2xlYXJEZXRhaWwoKTtcbiAgICByZXR1cm47XG4gIH1cbiAgYWN0aXZlTm9kZUlkID0gbm9kZUlkO1xuICBjb25zdCBsaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGwnKTtcbiAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcignbGFiZWwnLCBub2RlLmxhYmVsKSk7XG4gIGxpc3QuYXBwZW5kKC4uLmRldGFpbFBhaXIoJ2tpbmQnLCBub2RlLmtpbmQpKTtcbiAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcignc3RhdHVzJywgbm9kZS5zdGF0dXMpKTtcbiAgaWYgKG5vZGUuZXh0ZXJuYWwpIHtcbiAgICBsaXN0LmFwcGVuZCguLi5kZXRhaWxQYWlyKCdvcmlnaW4nLCAnZXh0ZXJuYWwgdGFyZ2V0IChub3QgZGVjbGFyZWQgaW4gdGhlIGFuYWx5c2lzKScpKTtcbiAgfVxuICBpZiAobm9kZS5yYW5nZSkge1xuICAgIGxpc3QuYXBwZW5kKC4uLmRldGFpbFBhaXIoJ2xpbmVzJywgYCR7bm9kZS5yYW5nZS5zdGFydExpbmUgKyAxfVx1MjAxMyR7bm9kZS5yYW5nZS5lbmRMaW5lICsgMX1gKSk7XG4gICAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcignZmlsZScsIG5vZGUucmFuZ2UuZmlsZUlkKSk7XG4gIH1cbiAgaWYgKG5vZGUuYmFkZ2UpIHtcbiAgICBsaXN0LmFwcGVuZCguLi5kZXRhaWxQYWlyKCdub3RlJywgbm9kZS5iYWRnZSkpO1xuICB9XG4gIGlmIChub2RlLmlzU3ludGhldGljKSB7XG4gICAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcignb3JpZ2luJywgJ3N5bnRoZXRpYyBzdHJ1Y3R1cmFsIG5vZGUnKSk7XG4gIH1cbiAgaWYgKG5vZGUudW5yZWFjaGFibGUpIHtcbiAgICBsaXN0LmFwcGVuZCguLi5kZXRhaWxQYWlyKCdyZWFjaGFiaWxpdHknLCAnbm90IHJlYWNoYWJsZSBmcm9tIGVudHJ5JykpO1xuICB9XG4gIGlmIChub2RlLnJlYXNvbkNvZGUpIHtcbiAgICBsaXN0LmFwcGVuZCguLi5kZXRhaWxQYWlyKCdyZWFzb24nLCBub2RlLnJlYXNvbkNvZGUpKTtcbiAgfVxuICBpZiAoQXJyYXkuaXNBcnJheShub2RlLmNhbGxzKSAmJiBub2RlLmNhbGxzLmxlbmd0aCA+IDApIHtcbiAgICBsaXN0LmFwcGVuZChcbiAgICAgIC4uLmRldGFpbFBhaXIoJ2NhbGxzJywgbm9kZS5jYWxscy5tYXAoKGNhbGwpID0+IGAke2NhbGwubGFiZWx9ICgke2NhbGwuc3RhdHVzfSlgKS5qb2luKCcsICcpKSxcbiAgICApO1xuICB9XG5cbiAgY29uc3QgZWRnZXMgPSAoY3VycmVudER0bz8uZWRnZXMgPz8gW10pLmZpbHRlcihcbiAgICAoZWRnZSkgPT4gZWRnZS5mcm9tID09PSBub2RlSWQgfHwgZWRnZS50byA9PT0gbm9kZUlkLFxuICApO1xuICBpZiAoZWRnZXMubGVuZ3RoID4gMCkge1xuICAgIGxpc3QuYXBwZW5kKC4uLmRldGFpbFBhaXIoJ3JlbGF0aW9uc2hpcHMnLCBTdHJpbmcoZWRnZXMubGVuZ3RoKSkpO1xuICB9XG5cbiAgZGV0YWlsQm9keS5yZXBsYWNlQ2hpbGRyZW4obGlzdCk7XG5cbiAgaWYgKGVkZ2VzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBoZWFkaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDMnKTtcbiAgICBoZWFkaW5nLmNsYXNzTmFtZSA9ICdjZi1kZXRhaWwtdGl0bGUnO1xuICAgIGhlYWRpbmcudGV4dENvbnRlbnQgPSAnUmVsYXRpb25zaGlwcyc7XG4gICAgZGV0YWlsQm9keS5hcHBlbmRDaGlsZChoZWFkaW5nKTtcblxuICAgIGNvbnN0IGVkZ2VMaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgICBlZGdlTGlzdC5jbGFzc05hbWUgPSAnY2YtbGVnZW5kJztcbiAgICBmb3IgKGNvbnN0IGVkZ2Ugb2YgZWRnZXMuc2xpY2UoMCwgMTIpKSB7XG4gICAgICBjb25zdCBpdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IGVkZ2UuZnJvbSA9PT0gbm9kZUlkID8gJ1x1MjE5MicgOiAnXHUyMTkwJztcbiAgICAgIGNvbnN0IG90aGVyID0gZWRnZS5mcm9tID09PSBub2RlSWQgPyBlZGdlLnRvIDogZWRnZS5mcm9tO1xuICAgICAgaXRlbS50ZXh0Q29udGVudCA9IGAke2RpcmVjdGlvbn0gJHtlZGdlLnR5cGV9IFx1MDBCNyAke290aGVyfSAoJHtlZGdlLnN0YXR1c30pYDtcbiAgICAgIGVkZ2VMaXN0LmFwcGVuZENoaWxkKGl0ZW0pO1xuICAgIH1cbiAgICBkZXRhaWxCb2R5LmFwcGVuZENoaWxkKGVkZ2VMaXN0KTtcbiAgfVxuXG4gIHZvaWQgbG9hZE5vZGVFeHBsYW5hdGlvbihub2RlSWQpO1xuICBzeW5jQ2FsbE5vZGVCdXR0b25zKG5vZGUpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pnx1bmRlZmluZWR9IG5vZGVcbiAqL1xuZnVuY3Rpb24gc3luY0NhbGxOb2RlQnV0dG9ucyhub2RlKSB7XG4gIGlmICghY2FsbHNFeHBhbmRCdG4gfHwgIWNhbGxzQ29sbGFwc2VCdG4gfHwgIWNhbGxzRm9jdXNCdG4pIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgaXNDYWxsR3JhcGggPSBjdXJyZW50RHRvPy5kdG9LaW5kID09PSAnY2FsbF9ncmFwaCc7XG4gIGlmICghaXNDYWxsR3JhcGggfHwgIW5vZGUgfHwgbm9kZS5raW5kID09PSAndW5yZXNvbHZlZF9idWNrZXQnKSB7XG4gICAgY2FsbHNFeHBhbmRCdG4uZGlzYWJsZWQgPSB0cnVlO1xuICAgIGNhbGxzQ29sbGFwc2VCdG4uZGlzYWJsZWQgPSB0cnVlO1xuICAgIHJldHVybjtcbiAgfVxuICBjYWxsc0V4cGFuZEJ0bi5kaXNhYmxlZCA9IEJvb2xlYW4obm9kZS5leHBhbmRlZCk7XG4gIGNhbGxzQ29sbGFwc2VCdG4uZGlzYWJsZWQgPSAhbm9kZS5leHBhbmRlZCB8fCBCb29sZWFuKG5vZGUuaXNDZW50ZXIpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gZHRvXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHVwZGF0ZUNhbGxHcmFwaFNpZGVQYW5lbChkdG8pIHtcbiAgaWYgKCFjYWxsc1BhbmVsKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChkdG8uZHRvS2luZCAhPT0gJ2NhbGxfZ3JhcGgnKSB7XG4gICAgY2FsbHNQYW5lbC5oaWRkZW4gPSB0cnVlO1xuICAgIGlmIChzY29wZUJhbm5lcikge1xuICAgICAgc2NvcGVCYW5uZXIuaGlkZGVuID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG4gIGNhbGxzUGFuZWwuaGlkZGVuID0gZmFsc2U7XG4gIGlmIChzY29wZUJhbm5lcikge1xuICAgIHNjb3BlQmFubmVyLnRleHRDb250ZW50ID0gZHRvLnNjb3BlQmFubmVyIHx8ICcnO1xuICAgIHNjb3BlQmFubmVyLmhpZGRlbiA9ICFkdG8uc2NvcGVCYW5uZXI7XG4gIH1cbiAgaWYgKGNhbGxzRm9jdXNCdG4pIHtcbiAgICBjb25zdCBmb2N1c2VkID0gQm9vbGVhbihkdG8uZm9jdXNlZE5vZGVJZCk7XG4gICAgY2FsbHNGb2N1c0J0bi5zZXRBdHRyaWJ1dGUoJ2FyaWEtcHJlc3NlZCcsIGZvY3VzZWQgPyAndHJ1ZScgOiAnZmFsc2UnKTtcbiAgICBjYWxsc0ZvY3VzQnRuLnRleHRDb250ZW50ID0gZm9jdXNlZCA/ICdVbmZvY3VzJyA6ICdGb2N1cyc7XG4gIH1cblxuICBpZiAodW5yZXNvbHZlZEJ1Y2tldERldGFpbHMgJiYgdW5yZXNvbHZlZFN1bW1hcnkgJiYgdW5yZXNvbHZlZExpc3QpIHtcbiAgICBjb25zdCBidWNrZXQgPSBkdG8udW5yZXNvbHZlZEJ1Y2tldDtcbiAgICBpZiAoYnVja2V0ICYmIGJ1Y2tldC5jb3VudCA+IDApIHtcbiAgICAgIHVucmVzb2x2ZWRCdWNrZXREZXRhaWxzLmhpZGRlbiA9IGZhbHNlO1xuICAgICAgdW5yZXNvbHZlZFN1bW1hcnkudGV4dENvbnRlbnQgPSBgJHtidWNrZXQuY291bnR9IHVucmVzb2x2ZWQgdGFyZ2V0JHtidWNrZXQuY291bnQgPT09IDEgPyAnJyA6ICdzJ31gO1xuICAgICAgdW5yZXNvbHZlZExpc3QucmVwbGFjZUNoaWxkcmVuKCk7XG4gICAgICBmb3IgKGNvbnN0IHJlYXNvbiBvZiBidWNrZXQucmVhc29ucyA/PyBbXSkge1xuICAgICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICAgIGxpLnRleHRDb250ZW50ID0gYCR7cmVhc29uLnJlYXNvbkNvZGV9OiAke3JlYXNvbi5jb3VudH0gc2l0ZSR7cmVhc29uLmNvdW50ID09PSAxID8gJycgOiAncyd9YDtcbiAgICAgICAgdW5yZXNvbHZlZExpc3QuYXBwZW5kQ2hpbGQobGkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB1bnJlc29sdmVkQnVja2V0RGV0YWlscy5oaWRkZW4gPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGlmIChkdG8uY2VudGVyU3ltYm9sSWQpIHtcbiAgICBjYWxsZXJzTmV4dEN1cnNvciA9IHVuZGVmaW5lZDtcbiAgICBjYWxsZWVzTmV4dEN1cnNvciA9IHVuZGVmaW5lZDtcbiAgICBjYWxsZXJzTGlzdD8ucmVwbGFjZUNoaWxkcmVuKCk7XG4gICAgY2FsbGVlc0xpc3Q/LnJlcGxhY2VDaGlsZHJlbigpO1xuICAgIGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIGxvYWROZWlnaGJvclBhZ2UoJ2luY29taW5nJywgZHRvLmNlbnRlclN5bWJvbElkLCBmYWxzZSksXG4gICAgICBsb2FkTmVpZ2hib3JQYWdlKCdvdXRnb2luZycsIGR0by5jZW50ZXJTeW1ib2xJZCwgZmFsc2UpLFxuICAgIF0pO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHsnaW5jb21pbmcnfCdvdXRnb2luZyd9IGRpcmVjdGlvblxuICogQHBhcmFtIHtzdHJpbmd9IHN5bWJvbElkXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGFwcGVuZFxuICovXG5hc3luYyBmdW5jdGlvbiBsb2FkTmVpZ2hib3JQYWdlKGRpcmVjdGlvbiwgc3ltYm9sSWQsIGFwcGVuZCkge1xuICBjb25zdCBraW5kID0gZGlyZWN0aW9uID09PSAnaW5jb21pbmcnID8gJ2NhbGxzLmluY29taW5nJyA6ICdjYWxscy5vdXRnb2luZyc7XG4gIGNvbnN0IGN1cnNvciA9IGRpcmVjdGlvbiA9PT0gJ2luY29taW5nJyA/IGNhbGxlcnNOZXh0Q3Vyc29yIDogY2FsbGVlc05leHRDdXJzb3I7XG4gIGNvbnN0IGxpc3RFbCA9IGRpcmVjdGlvbiA9PT0gJ2luY29taW5nJyA/IGNhbGxlcnNMaXN0IDogY2FsbGVlc0xpc3Q7XG4gIGNvbnN0IGhlYWRpbmdFbCA9IGRpcmVjdGlvbiA9PT0gJ2luY29taW5nJyA/IGNhbGxlcnNIZWFkaW5nIDogY2FsbGVlc0hlYWRpbmc7XG4gIGNvbnN0IG1vcmVCdG4gPSBkaXJlY3Rpb24gPT09ICdpbmNvbWluZycgPyBjYWxsZXJzTW9yZUJ0biA6IGNhbGxlZXNNb3JlQnRuO1xuICBpZiAoIWxpc3RFbCkge1xuICAgIHJldHVybjtcbiAgfVxuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJpZGdlLnJlcXVlc3Qoa2luZCwge1xuICAgICAgc3ltYm9sSWQsXG4gICAgICBsaW1pdDogNTAsXG4gICAgICAuLi4oYXBwZW5kICYmIGN1cnNvciA/IHsgY3Vyc29yIH0gOiB7fSksXG4gICAgfSk7XG4gICAgY29uc3QgcGF5bG9hZCA9IHJlc3BvbnNlLnBheWxvYWQgPz8ge307XG4gICAgaWYgKCFhcHBlbmQpIHtcbiAgICAgIGxpc3RFbC5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgICB9XG4gICAgaWYgKGhlYWRpbmdFbCkge1xuICAgICAgaGVhZGluZ0VsLnRleHRDb250ZW50ID1cbiAgICAgICAgZGlyZWN0aW9uID09PSAnaW5jb21pbmcnXG4gICAgICAgICAgPyBgQ2FsbGVycyAoJHtwYXlsb2FkLnRvdGFsID8/IDB9KWBcbiAgICAgICAgICA6IGBDYWxsZWVzICgke3BheWxvYWQudG90YWwgPz8gMH0pYDtcbiAgICB9XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHBheWxvYWQuaXRlbXMgPz8gW10pIHtcbiAgICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgYnRuLnR5cGUgPSAnYnV0dG9uJztcbiAgICAgIGJ0bi5jbGFzc05hbWUgPSAnY2YtZXZpZGVuY2UtbGluayc7XG4gICAgICBidG4udGV4dENvbnRlbnQgPSBgJHtpdGVtLmRpc3BsYXlOYW1lfSAoJHtpdGVtLnN0YXR1c30ke2l0ZW0uY2FsbFNpdGVDb3VudCA+IDEgPyBgIFx1MDBENyR7aXRlbS5jYWxsU2l0ZUNvdW50fWAgOiAnJ30pYDtcbiAgICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgcmVuZGVyZXIuc2VsZWN0KGl0ZW0uc3ltYm9sSWQpO1xuICAgICAgfSk7XG4gICAgICBsaS5hcHBlbmRDaGlsZChidG4pO1xuICAgICAgbGlzdEVsLmFwcGVuZENoaWxkKGxpKTtcbiAgICB9XG4gICAgaWYgKGRpcmVjdGlvbiA9PT0gJ2luY29taW5nJykge1xuICAgICAgY2FsbGVyc05leHRDdXJzb3IgPSBwYXlsb2FkLm5leHRDdXJzb3I7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNhbGxlZXNOZXh0Q3Vyc29yID0gcGF5bG9hZC5uZXh0Q3Vyc29yO1xuICAgIH1cbiAgICBpZiAobW9yZUJ0bikge1xuICAgICAgbW9yZUJ0bi5oaWRkZW4gPSAhcGF5bG9hZC5uZXh0Q3Vyc29yO1xuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgaWYgKG1vcmVCdG4pIHtcbiAgICAgIG1vcmVCdG4uaGlkZGVuID0gdHJ1ZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IG5leHRcbiAqL1xuZnVuY3Rpb24gYXBwbHlTZXR0aW5ncyhuZXh0KSB7XG4gIGNvbnN0IHByZXZpb3VzTWF4TGluZXMgPSBzZXR0aW5ncy5tYXhMaW5lcztcbiAgc2V0dGluZ3MgPSByZXNvbHZlUHJldmlld1NldHRpbmdzKHsgLi4uc2V0dGluZ3MsIC4uLm5leHQgfSk7XG4gIGlmIChuZXh0Py5leHBsYW5hdGlvbiAmJiB0eXBlb2YgbmV4dC5leHBsYW5hdGlvbiA9PT0gJ29iamVjdCcpIHtcbiAgICBleHBsYW5hdGlvblNldHRpbmdzID0gcmVzb2x2ZUV4cGxhbmF0aW9uU2V0dGluZ3MobmV4dC5leHBsYW5hdGlvbik7XG4gICAgYWN0aXZlRXhwbGFpbkRlcHRoID0gZXhwbGFuYXRpb25TZXR0aW5ncy5kZWZhdWx0RGVwdGg7XG4gICAgaWYgKGV4cGxhaW5EZXB0aFNlbGVjdCkge1xuICAgICAgZXhwbGFpbkRlcHRoU2VsZWN0LnZhbHVlID0gU3RyaW5nKGFjdGl2ZUV4cGxhaW5EZXB0aCk7XG4gICAgfVxuICAgIGlmIChhY3RpdmVOb2RlSWQpIHtcbiAgICAgIHZvaWQgbG9hZE5vZGVFeHBsYW5hdGlvbihhY3RpdmVOb2RlSWQpO1xuICAgIH1cbiAgICBpZiAoY3VycmVudER0bz8uZHRvS2luZCA9PT0gJ2NmZycpIHtcbiAgICAgIHZvaWQgbG9hZEZ1bmN0aW9uU3VtbWFyeShjdXJyZW50RHRvKTtcbiAgICB9XG4gIH1cbiAgcHJldmlld0NvbnRyb2xsZXIuY29uZmlndXJlKHtcbiAgICBkZWxheU1zOiBzZXR0aW5ncy5kZWxheU1zLFxuICAgIGVuYWJsZWQ6IHNldHRpbmdzLmVuYWJsZWQsXG4gICAgcGluQnlEZWZhdWx0OiBzZXR0aW5ncy5waW5CeURlZmF1bHQsXG4gIH0pO1xuICBpZiAoc2V0dGluZ3MubWF4TGluZXMgIT09IHByZXZpb3VzTWF4TGluZXMpIHtcbiAgICBwcmV2aWV3Q2FjaGUuY2xlYXIoKTtcbiAgfVxuICBpZiAoIXNldHRpbmdzLmVuYWJsZWQpIHtcbiAgICBwcmV2aWV3Q29udHJvbGxlci5kaXNtaXNzKCk7XG4gICAgaGlkZVByZXZpZXcoKTtcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gcGlubmVkXG4gKi9cbmZ1bmN0aW9uIHN5bmNQaW5CdXR0b24ocGlubmVkKSB7XG4gIHByZXZpZXdQaW4uc2V0QXR0cmlidXRlKCdhcmlhLXByZXNzZWQnLCBwaW5uZWQgPyAndHJ1ZScgOiAnZmFsc2UnKTtcbiAgcHJldmlld1Bpbi50ZXh0Q29udGVudCA9IHBpbm5lZCA/ICdQaW5uZWQnIDogJ1Bpbic7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZFxuICogQHJldHVybnMge1JlY29yZDxzdHJpbmcsIGFueT58bnVsbH1cbiAqL1xuZnVuY3Rpb24gbm9kZUJ5SWQobm9kZUlkKSB7XG4gIHJldHVybiBjdXJyZW50RHRvPy5ub2Rlcy5maW5kKChub2RlKSA9PiBub2RlLmlkID09PSBub2RlSWQpID8/IG51bGw7XG59XG5cbi8qKlxuICogQHBhcmFtIHt7eDogbnVtYmVyLCB5OiBudW1iZXJ9fG51bGx9IGFuY2hvclxuICovXG5mdW5jdGlvbiBwb3NpdGlvblByZXZpZXcoYW5jaG9yKSB7XG4gIGNvbnN0IHdyYXAgPSBzdmcucGFyZW50RWxlbWVudD8uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIGlmICghd3JhcCkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBwb2ludCA9IGFuY2hvciA/PyB7XG4gICAgeDogd3JhcC5sZWZ0ICsgMjQsXG4gICAgeTogd3JhcC50b3AgKyA3MixcbiAgfTtcbiAgY29uc3Qgd2lkdGggPSBNYXRoLm1pbigzODAsIE1hdGgubWF4KDI2MCwgd3JhcC53aWR0aCAtIDMyKSk7XG4gIGNvbnN0IG1heExlZnQgPSBNYXRoLm1heCg4LCB3cmFwLndpZHRoIC0gd2lkdGggLSA4KTtcbiAgY29uc3QgbGVmdCA9IE1hdGgubWF4KDgsIE1hdGgubWluKG1heExlZnQsIHBvaW50LnggLSB3cmFwLmxlZnQgKyAxNCkpO1xuICBjb25zdCB0b3AgPSBNYXRoLm1heCg4LCBNYXRoLm1pbihNYXRoLm1heCg4LCB3cmFwLmhlaWdodCAtIDIyMCksIHBvaW50LnkgLSB3cmFwLnRvcCArIDE0KSk7XG4gIHByZXZpZXcuc3R5bGUud2lkdGggPSBgJHt3aWR0aH1weGA7XG4gIHByZXZpZXcuc3R5bGUubGVmdCA9IGAke2xlZnR9cHhgO1xuICBwcmV2aWV3LnN0eWxlLnRvcCA9IGAke3RvcH1weGA7XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBub2RlXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT58bnVsbH0gc2xpY2VcbiAqL1xuZnVuY3Rpb24gcmVuZGVyUHJldmlld0NhcmQobm9kZSwgc2xpY2UpIHtcbiAgY29uc3QgbW9kZWwgPSBidWlsZFByZXZpZXdNb2RlbCh7XG4gICAgbm9kZSxcbiAgICBzbGljZSxcbiAgICBtYXhMaW5lczogc2V0dGluZ3MubWF4TGluZXMsXG4gIH0pO1xuICBwcmV2aWV3VGl0bGUudGV4dENvbnRlbnQgPSBgJHttb2RlbC5raW5kfSBcdTAwQjcgJHttb2RlbC50aXRsZX1gO1xuICBwcmV2aWV3TWV0YS50ZXh0Q29udGVudCA9IFtcbiAgICBtb2RlbC5maWxlLFxuICAgIGBsaW5lcyAke21vZGVsLmxpbmVMYWJlbH1gLFxuICAgIG1vZGVsLmludGVncml0eSAhPT0gJ2V4YWN0J1xuICAgICAgPyBtb2RlbC5pbnRlZ3JpdHlcbiAgICAgIDogbW9kZWwuZG9jdW1lbnRWZXJzaW9uXG4gICAgICAgID8gYHYke21vZGVsLmRvY3VtZW50VmVyc2lvbn1gXG4gICAgICAgIDogJycsXG4gIF1cbiAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgLmpvaW4oJyBcdTAwQjcgJyk7XG4gIHByZXZpZXdCb2R5LnJlcGxhY2VDaGlsZHJlbigpO1xuXG4gIGlmICghbW9kZWwuc3ludGhldGljICYmICFtb2RlbC5lbXB0eSkge1xuICAgIGNvbnN0IGxhbmd1YWdlID1cbiAgICAgIHR5cGVvZiBzbGljZT8ubGFuZ3VhZ2VJZCA9PT0gJ3N0cmluZycgPyBzbGljZS5sYW5ndWFnZUlkIDogKG5vZGUucmFuZ2U/LmZpbGVJZCA/PyAnJyk7XG4gICAgY29uc3QgcmVuZGVyZWQgPSBzZXR0aW5ncy5zeW50YXhIaWdobGlnaHRpbmdcbiAgICAgID8gaGlnaGxpZ2h0TGluZXMobW9kZWwudGV4dCwgbGFuZ3VhZ2UpXG4gICAgICA6IGhpZ2hsaWdodExpbmVzKG1vZGVsLnRleHQsICcnKTtcbiAgICBjb25zdCBmaXJzdExpbmUgPSBOdW1iZXIoc2xpY2U/LmxpbmVzPy5zdGFydExpbmUgPz8gbm9kZS5yYW5nZT8uc3RhcnRMaW5lID8/IDApICsgMTtcbiAgICBjb25zdCBjb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY29kZS5jbGFzc05hbWUgPSAnY2YtcHJldmlldy1jb2RlJztcbiAgICBmb3IgKGNvbnN0IFtpbmRleCwgdG9rZW5zXSBvZiByZW5kZXJlZC5saW5lcy5lbnRyaWVzKCkpIHtcbiAgICAgIGNvbnN0IGxpbmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIGxpbmUuY2xhc3NOYW1lID0gJ2NmLXByZXZpZXctbGluZSc7XG4gICAgICBjb25zdCBudW1iZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICBudW1iZXIuY2xhc3NOYW1lID0gJ2NmLXByZXZpZXctbGluZS1udW1iZXInO1xuICAgICAgbnVtYmVyLnRleHRDb250ZW50ID0gU3RyaW5nKGZpcnN0TGluZSArIGluZGV4KTtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICBjb250ZW50LmNsYXNzTmFtZSA9ICdjZi1wcmV2aWV3LWxpbmUtdGV4dCc7XG4gICAgICBmb3IgKGNvbnN0IHRva2VuIG9mIHRva2Vucykge1xuICAgICAgICBjb25zdCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICBpZiAodG9rZW4uY2xhc3NOYW1lKSB7XG4gICAgICAgICAgc3Bhbi5jbGFzc05hbWUgPSB0b2tlbi5jbGFzc05hbWU7XG4gICAgICAgIH1cbiAgICAgICAgc3Bhbi50ZXh0Q29udGVudCA9IHRva2VuLnRleHQ7XG4gICAgICAgIGNvbnRlbnQuYXBwZW5kQ2hpbGQoc3Bhbik7XG4gICAgICB9XG4gICAgICBsaW5lLmFwcGVuZChudW1iZXIsIGNvbnRlbnQpO1xuICAgICAgY29kZS5hcHBlbmRDaGlsZChsaW5lKTtcbiAgICB9XG4gICAgcHJldmlld0JvZHkuYXBwZW5kQ2hpbGQoY29kZSk7XG4gICAgaWYgKHJlbmRlcmVkLmRlZ3JhZGVkKSB7XG4gICAgICBwcmV2aWV3Qm9keS5jbGFzc0xpc3QuYWRkKCdpcy1wbGFpbicpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwcmV2aWV3Qm9keS5jbGFzc0xpc3QucmVtb3ZlKCdpcy1wbGFpbicpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG5vdGVzID0gW107XG4gIGlmIChtb2RlbC5tZXNzYWdlKSB7XG4gICAgbm90ZXMucHVzaChtb2RlbC5tZXNzYWdlKTtcbiAgfVxuICBpZiAobW9kZWwudHJ1bmNhdGVkKSB7XG4gICAgbm90ZXMucHVzaChgUHJldmlldyB0cnVuY2F0ZWQgdG8gJHtzZXR0aW5ncy5tYXhMaW5lc30gbGluZXMuYCk7XG4gIH1cbiAgcHJldmlld05vdGUudGV4dENvbnRlbnQgPSBub3Rlcy5qb2luKCcgJyk7XG4gIGNvbnN0IGNhbk9wZW4gPSAhbW9kZWwuc3ludGhldGljICYmICFtb2RlbC5lbXB0eSAmJiBtb2RlbC5pbnRlZ3JpdHkgPT09ICdleGFjdCc7XG4gIHByZXZpZXdCb2R5LmNsYXNzTGlzdC50b2dnbGUoJ2lzLWNsaWNrYWJsZScsIEJvb2xlYW4oc2V0dGluZ3MuY2xpY2tUb05hdmlnYXRlICYmIGNhbk9wZW4pKTtcbiAgcHJldmlld09wZW4uZGlzYWJsZWQgPSAhY2FuT3BlbjtcbiAgcHJldmlldy5jbGFzc0xpc3QudG9nZ2xlKCdpcy1zdGFsZScsIG1vZGVsLnN0YWxlKTtcbiAgcHJldmlldy5jbGFzc0xpc3QudG9nZ2xlKCdpcy1zeW50aGV0aWMnLCBtb2RlbC5zeW50aGV0aWMpO1xuICBwcmV2aWV3LmhpZGRlbiA9IGZhbHNlO1xuICBwb3NpdGlvblByZXZpZXcocHJldmlld0FuY2hvcik7XG59XG5cbmZ1bmN0aW9uIGhpZGVQcmV2aWV3KCkge1xuICBwcmV2aWV3UmVxdWVzdCArPSAxO1xuICBwcmV2aWV3Tm9kZUlkID0gbnVsbDtcbiAgcHJldmlld0FuY2hvciA9IG51bGw7XG4gIHByZXZpZXcuaGlkZGVuID0gdHJ1ZTtcbiAgaWYgKHByZXZpZXdFeHBsYWluKSB7XG4gICAgcHJldmlld0V4cGxhaW4uaGlkZGVuID0gdHJ1ZTtcbiAgICBwcmV2aWV3RXhwbGFpbi50ZXh0Q29udGVudCA9ICcnO1xuICB9XG4gIHByZXZpZXdCb2R5LnJlcGxhY2VDaGlsZHJlbigpO1xuICBwcmV2aWV3Tm90ZS50ZXh0Q29udGVudCA9ICcnO1xuICBzeW5jUGluQnV0dG9uKGZhbHNlKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkXG4gKiBAcGFyYW0ge3t4OiBudW1iZXIsIHk6IG51bWJlcn18bnVsbH0gW2FuY2hvcl1cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW3Bpbl1cbiAqL1xuYXN5bmMgZnVuY3Rpb24gb3BlblByZXZpZXcobm9kZUlkLCBhbmNob3IgPSBudWxsLCBwaW4gPSBmYWxzZSkge1xuICBjb25zdCBub2RlID0gbm9kZUJ5SWQobm9kZUlkKTtcbiAgaWYgKCFub2RlKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHByZXZpZXdOb2RlSWQgPSBub2RlSWQ7XG4gIHByZXZpZXdBbmNob3IgPSBhbmNob3I7XG4gIGlmIChwaW4pIHtcbiAgICBwcmV2aWV3Q29udHJvbGxlci5zZXRQaW5uZWQodHJ1ZSk7XG4gICAgc3luY1BpbkJ1dHRvbih0cnVlKTtcbiAgICBwcmV2aWV3LmZvY3VzKCk7XG4gIH1cbiAgaWYgKG5vZGUuaXNTeW50aGV0aWMgfHwgIW5vZGUucmFuZ2UpIHtcbiAgICByZW5kZXJQcmV2aWV3Q2FyZChub2RlLCBudWxsKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKHByZXZpZXdFeHBsYWluICYmIGN1cnJlbnREdG8/LmR0b0tpbmQgPT09ICdjZmcnKSB7XG4gICAgY29uc3QgcmVxdWVzdEZvckV4cGxhaW4gPSBwcmV2aWV3UmVxdWVzdCArIDE7XG4gICAgdm9pZCBicmlkZ2VcbiAgICAgIC5yZXF1ZXN0KCdleHBsYWluLm5vZGUnLCB7IG5vZGVJZCwgZGVwdGg6IDEgfSlcbiAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHByZXZpZXdOb2RlSWQgPT09IG5vZGVJZCAmJlxuICAgICAgICAgIHByZXZpZXdSZXF1ZXN0IDw9IHJlcXVlc3RGb3JFeHBsYWluICYmXG4gICAgICAgICAgcmVzLnBheWxvYWQ/LnN1bW1hcnlcbiAgICAgICAgKSB7XG4gICAgICAgICAgcHJldmlld0V4cGxhaW4udGV4dENvbnRlbnQgPSByZXMucGF5bG9hZC5zdW1tYXJ5O1xuICAgICAgICAgIHByZXZpZXdFeHBsYWluLmhpZGRlbiA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKCgpID0+IHt9KTtcbiAgfVxuICBjb25zdCBrZXkgPSBgJHtub2RlSWR9fCR7c2V0dGluZ3MubWF4TGluZXN9YDtcbiAgY29uc3QgY2FjaGVkID0gcHJldmlld0NhY2hlLmdldChrZXkpO1xuICBpZiAoY2FjaGVkKSB7XG4gICAgcmVuZGVyUHJldmlld0NhcmQobm9kZSwgY2FjaGVkKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgcmVxdWVzdCA9ICsrcHJldmlld1JlcXVlc3Q7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicmlkZ2UucmVxdWVzdCgnc291cmNlLnNsaWNlJywge1xuICAgICAgZmlsZUlkOiBub2RlLnJhbmdlLmZpbGVJZCxcbiAgICAgIHJhbmdlOiBub2RlLnJhbmdlLFxuICAgICAgbWF4TGluZXM6IHNldHRpbmdzLm1heExpbmVzLFxuICAgIH0pO1xuICAgIGlmIChyZXF1ZXN0ICE9PSBwcmV2aWV3UmVxdWVzdCB8fCBwcmV2aWV3Tm9kZUlkICE9PSBub2RlSWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc2xpY2UgPSByZXNwb25zZS5wYXlsb2FkLnNsaWNlID8/IG51bGw7XG4gICAgcHJldmlld0NhY2hlLnNldChrZXksIHNsaWNlKTtcbiAgICBpZiAoc2xpY2U/LmludGVncml0eSAmJiBzbGljZS5pbnRlZ3JpdHkgIT09ICdleGFjdCcpIHtcbiAgICAgIGludGVncml0eUJ5Tm9kZS5zZXQobm9kZUlkLCBzbGljZS5pbnRlZ3JpdHkpO1xuICAgICAgcmVuZGVyZXIubWFya1N0YWxlKFtub2RlSWRdKTtcbiAgICB9XG4gICAgcmVuZGVyUHJldmlld0NhcmQobm9kZSwgc2xpY2UpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGlmIChyZXF1ZXN0ICE9PSBwcmV2aWV3UmVxdWVzdCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZW5kZXJQcmV2aWV3Q2FyZChub2RlLCB7XG4gICAgICB0ZXh0OiAnJyxcbiAgICAgIHJlbGF0aXZlUGF0aDogJycsXG4gICAgICBpbnRlZ3JpdHk6ICdtaXNzaW5nJyxcbiAgICAgIHJlYXNvbjogZXJyb3I/Lm1lc3NhZ2UgPz8gU3RyaW5nKGVycm9yKSxcbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWRcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gW25vZGVdXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIG5hdmlnYXRlVG8obm9kZUlkLCBub2RlID0gbm9kZUJ5SWQobm9kZUlkKSkge1xuICBpZiAoIW5vZGU/LnJhbmdlIHx8IG5vZGUuaXNTeW50aGV0aWMpIHtcbiAgICBzZXRCYW5uZXIoJ1RoaXMgbm9kZSBoYXMgbm8gc291cmNlIHRvIG9wZW4uJywgZmFsc2UpO1xuICAgIHJldHVybjtcbiAgfVxuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ25hdmlnYXRlLnRvJywge1xuICAgICAgZmlsZUlkOiBub2RlLnJhbmdlLmZpbGVJZCxcbiAgICAgIHJhbmdlOiBub2RlLnJhbmdlLFxuICAgICAgbm9kZUlkLFxuICAgIH0pO1xuICAgIGlmIChyZXNwb25zZS5wYXlsb2FkLm9rICE9PSB0cnVlKSB7XG4gICAgICBzZXRCYW5uZXIoXG4gICAgICAgIGAke3Jlc3BvbnNlLnBheWxvYWQuY29kZSA/PyAnRV9OQVZJR0FUSU9OJ306ICR7cmVzcG9uc2UucGF5bG9hZC5tZXNzYWdlID8/ICdDb3VsZCBub3Qgb3BlbiBzb3VyY2UuJ31gLFxuICAgICAgICB0cnVlLFxuICAgICAgKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgc2V0QmFubmVyKGBDb3VsZCBub3Qgb3BlbiBzb3VyY2U6ICR7ZXJyb3I/Lm1lc3NhZ2UgPz8gU3RyaW5nKGVycm9yKX1gLCB0cnVlKTtcbiAgfVxufVxuXG4vKipcbiAqIFZhbGlkYXRlIGV2ZXJ5IHNvdXJjZS1iYWNrZWQgbm9kZSBvbmNlIG9uIGdyYXBoIGxvYWQuXG4gKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBkdG9cbiAqL1xuYXN5bmMgZnVuY3Rpb24gdmFsaWRhdGVHcmFwaChkdG8pIHtcbiAgaW50ZWdyaXR5QnlOb2RlID0gbmV3IE1hcCgpO1xuICBjb25zdCByYW5nZXMgPSBkdG8ubm9kZXNcbiAgICAuZmlsdGVyKChub2RlKSA9PiBub2RlLnJhbmdlICYmICFub2RlLmlzU3ludGhldGljKVxuICAgIC5tYXAoKG5vZGUpID0+ICh7IG5vZGVJZDogbm9kZS5pZCwgLi4ubm9kZS5yYW5nZSB9KSk7XG4gIGlmIChyYW5nZXMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicmlkZ2UucmVxdWVzdCgnc291cmNlLnZhbGlkYXRpb24nLCB7XG4gICAgICByYW5nZXM6IHJhbmdlcy5tYXAoKHsgbm9kZUlkOiBfbm9kZUlkLCAuLi5yYW5nZSB9KSA9PiByYW5nZSksXG4gICAgfSk7XG4gICAgY29uc3QgcmVzdWx0cyA9IEFycmF5LmlzQXJyYXkocmVzcG9uc2UucGF5bG9hZC5yZXN1bHRzKSA/IHJlc3BvbnNlLnBheWxvYWQucmVzdWx0cyA6IFtdO1xuICAgIGNvbnN0IHN0YWxlID0gW107XG4gICAgZm9yIChjb25zdCBbaW5kZXgsIHJlc3VsdF0gb2YgcmVzdWx0cy5lbnRyaWVzKCkpIHtcbiAgICAgIGNvbnN0IG5vZGVJZCA9IHJhbmdlc1tpbmRleF0/Lm5vZGVJZDtcbiAgICAgIGlmICghbm9kZUlkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaW50ZWdyaXR5QnlOb2RlLnNldChub2RlSWQsIHJlc3VsdC5pbnRlZ3JpdHkgPz8gJ21pc3NpbmcnKTtcbiAgICAgIGlmIChyZXN1bHQuaW50ZWdyaXR5ICE9PSAnZXhhY3QnKSB7XG4gICAgICAgIHN0YWxlLnB1c2gobm9kZUlkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHN0YWxlLmxlbmd0aCA+IDApIHtcbiAgICAgIHJlbmRlcmVyLm1hcmtTdGFsZShzdGFsZSk7XG4gICAgICBzZXRCYW5uZXIoXG4gICAgICAgIGAke3N0YWxlLmxlbmd0aH0gbm9kZSR7c3RhbGUubGVuZ3RoID09PSAxID8gJycgOiAncyd9IHJlZmVyZW5jZSBjaGFuZ2VkIG9yIG1pc3Npbmcgc291cmNlLiBQcmV2aWV3IG1hcmtzIHRoZW0gc3RhbGU7IHJlLWFuYWx5emUgYmVmb3JlIHRydXN0aW5nIHRoZW0uYCxcbiAgICAgICAgZmFsc2UsXG4gICAgICApO1xuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgLy8gVmFsaWRhdGlvbiBpcyBhbiBlbmhhbmNlbWVudC4gQSBmYWlsdXJlIG11c3Qgbm90IGhpZGUgdGhlIGdyYXBoLlxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmdbXX0gZmlsZUlkc1xuICovXG5mdW5jdGlvbiBtYXJrU3RhbGVGaWxlcyhmaWxlSWRzKSB7XG4gIGNvbnN0IHdhbnRlZCA9IG5ldyBTZXQoQXJyYXkuaXNBcnJheShmaWxlSWRzKSA/IGZpbGVJZHMgOiBbXSk7XG4gIGlmICghY3VycmVudER0byB8fCB3YW50ZWQuc2l6ZSA9PT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBzdGFsZSA9IGN1cnJlbnREdG8ubm9kZXNcbiAgICAuZmlsdGVyKChub2RlKSA9PiBub2RlLnJhbmdlICYmIHdhbnRlZC5oYXMobm9kZS5yYW5nZS5maWxlSWQpKVxuICAgIC5tYXAoKG5vZGUpID0+IG5vZGUuaWQpO1xuICBpZiAoc3RhbGUubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHByZXZpZXdDYWNoZS5jbGVhcigpO1xuICBmb3IgKGNvbnN0IG5vZGVJZCBvZiBzdGFsZSkge1xuICAgIGludGVncml0eUJ5Tm9kZS5zZXQobm9kZUlkLCAnc3RhbGUnKTtcbiAgfVxuICByZW5kZXJlci5tYXJrU3RhbGUoc3RhbGUpO1xuICBwcmV2aWV3Q29udHJvbGxlci5kaXNtaXNzKCk7XG4gIGhpZGVQcmV2aWV3KCk7XG4gIHNldEJhbm5lcihcbiAgICBgU291cmNlIGNoYW5nZWQgZm9yICR7c3RhbGUubGVuZ3RofSBub2RlJHtzdGFsZS5sZW5ndGggPT09IDEgPyAnJyA6ICdzJ30uIFByZXZpZXdzIGFyZSBzdGFsZTsgcmUtYW5hbHl6ZSBiZWZvcmUgdHJ1c3RpbmcgdGhlbS5gLFxuICAgIGZhbHNlLFxuICApO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7aW1wb3J0KCcuLi9jb3JlL2dyYXBoL2R0by5qcycpLkdyYXBoRHRvfSBkdG9cbiAqL1xuZnVuY3Rpb24gcmVuZGVyTGVnZW5kKGR0bykge1xuICBsZWdlbmQucmVwbGFjZUNoaWxkcmVuKCk7XG4gIGZvciAoY29uc3Qgc3RhdHVzTmFtZSBvZiBkdG8ubGVnZW5kLnN0YXR1c2VzKSB7XG4gICAgY29uc3QgaXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgY29uc3Qgc3dhdGNoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHN3YXRjaC5jbGFzc05hbWUgPSBgY2Ytc3dhdGNoIGNmLWVkZ2UtLSR7c3RhdHVzTmFtZX1gO1xuICAgIGNvbnN0IGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIGxhYmVsLnRleHRDb250ZW50ID0gc3RhdHVzTmFtZTtcbiAgICBpZiAoc3RhdHVzTmFtZSAhPT0gJ3Jlc29sdmVkJykge1xuICAgICAgbGFiZWwudGV4dENvbnRlbnQgPSBgJHtzdGF0dXNOYW1lfSAocGF0dGVybiArIGxhYmVsKWA7XG4gICAgfVxuICAgIGl0ZW0uYXBwZW5kKHN3YXRjaCwgbGFiZWwpO1xuICAgIGxlZ2VuZC5hcHBlbmRDaGlsZChpdGVtKTtcbiAgfVxuICBmb3IgKGNvbnN0IGVkZ2VLaW5kIG9mIGR0by5sZWdlbmQuZWRnZUtpbmRzID8/IFtdKSB7XG4gICAgY29uc3QgaXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgY29uc3Qgc3dhdGNoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHN3YXRjaC5jbGFzc05hbWUgPSBgY2Ytc3dhdGNoIGNmLWVkZ2UtLWtpbmQtJHtlZGdlS2luZH1gO1xuICAgIGNvbnN0IGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIGxhYmVsLnRleHRDb250ZW50ID0gYGVkZ2U6ICR7ZWRnZUtpbmR9YDtcbiAgICBpdGVtLmFwcGVuZChzd2F0Y2gsIGxhYmVsKTtcbiAgICBsZWdlbmQuYXBwZW5kQ2hpbGQoaXRlbSk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0FycmF5PHtzeW1ib2xJZDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIHF1YWxpZmllZE5hbWU6IHN0cmluZywga2luZDogc3RyaW5nfT59IGxpc3RcbiAqL1xuZnVuY3Rpb24gcmVuZGVyRnVuY3Rpb25QaWNrZXIobGlzdCkge1xuICBpZiAoIWZ1bmN0aW9uUGlja2VyKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGZ1bmN0aW9uUGlja2VyLnJlcGxhY2VDaGlsZHJlbigpO1xuICBmb3IgKGNvbnN0IGVudHJ5IG9mIGxpc3QpIHtcbiAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcbiAgICBvcHRpb24udmFsdWUgPSBlbnRyeS5zeW1ib2xJZDtcbiAgICBvcHRpb24udGV4dENvbnRlbnQgPSBgJHtlbnRyeS5xdWFsaWZpZWROYW1lfSAoJHtlbnRyeS5raW5kfSlgO1xuICAgIGZ1bmN0aW9uUGlja2VyLmFwcGVuZENoaWxkKG9wdGlvbik7XG4gIH1cbiAgZnVuY3Rpb25QaWNrZXIuaGlkZGVuID0gbGlzdC5sZW5ndGggPD0gMTtcbiAgaWYgKHNlbGVjdGVkU3ltYm9sSWQpIHtcbiAgICBmdW5jdGlvblBpY2tlci52YWx1ZSA9IHNlbGVjdGVkU3ltYm9sSWQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2hvd0NhcGFiaWxpdGllcyhwYXlsb2FkKSB7XG4gIGNvbnN0IGFkYXB0ZXJzID0gQXJyYXkuaXNBcnJheShwYXlsb2FkLmFkYXB0ZXJzKSA/IHBheWxvYWQuYWRhcHRlcnMgOiBbXTtcbiAgY29uc3QgbmFtZXMgPSBhZGFwdGVycy5tYXAoKGFkYXB0ZXIpID0+IGFkYXB0ZXIuaWQpLmpvaW4oJywgJykgfHwgJ25vbmUnO1xuICBtZXRhLnRleHRDb250ZW50ID0gYE1vY2sgZGF0YSBcdTAwQjcgYWRhcHRlcnM6ICR7bmFtZXN9IFx1MDBCNyBwcm90b2NvbCB2JHtwYXlsb2FkLnByb3RvY29sVmVyc2lvbiA/PyAnPyd9YDtcbiAgaWYgKHBheWxvYWQ/LnNldHRpbmdzICYmIHR5cGVvZiBwYXlsb2FkLnNldHRpbmdzID09PSAnb2JqZWN0Jykge1xuICAgIGFwcGx5U2V0dGluZ3MocGF5bG9hZC5zZXR0aW5ncyk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHBheWxvYWRcbiAqL1xuZnVuY3Rpb24gaGFuZGxlR3JhcGgocGF5bG9hZCkge1xuICBjb25zdCBkdG9DYW5kaWRhdGUgPSAvKiogQHR5cGUge3tkdG8/OiB1bmtub3dufX0gKi8gKHBheWxvYWQpLmR0bztcbiAgY29uc3QgdmFsaWRhdGlvbiA9IHZhbGlkYXRlRHRvKGR0b0NhbmRpZGF0ZSk7XG4gIGlmICghdmFsaWRhdGlvbi5vaykge1xuICAgIHNldEJhbm5lcihgSW52YWxpZCBncmFwaCBwYXlsb2FkOiAke3ZhbGlkYXRpb24uaXNzdWVzWzBdfWAsIHRydWUpO1xuICAgIHNldFN0YXR1cygnUmVuZGVyIGZhaWxlZCcpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBkdG8gPSB2YWxpZGF0aW9uLmR0bztcbiAgY3VycmVudER0byA9IGR0bztcbiAgcHJldmlld0NhY2hlLmNsZWFyKCk7XG4gIGludGVncml0eUJ5Tm9kZSA9IG5ldyBNYXAoKTtcbiAgaGlkZVByZXZpZXcoKTtcbiAgZW1wdHkuaGlkZGVuID0gdHJ1ZTtcbiAgcmVuZGVyZXIucmVuZGVyKGR0byk7XG4gIHJlbmRlckxlZ2VuZChkdG8pO1xuICBjbGVhckRldGFpbCgpO1xuICB2b2lkIHZhbGlkYXRlR3JhcGgoZHRvKTtcbiAgdm9pZCBsb2FkRnVuY3Rpb25TdW1tYXJ5KGR0byk7XG4gIHZvaWQgdXBkYXRlQ2FsbEdyYXBoU2lkZVBhbmVsKGR0byk7XG4gIGlmIChzd2l0Y2hQZXJzcGVjdGl2ZUJ0bikge1xuICAgIHN3aXRjaFBlcnNwZWN0aXZlQnRuLmhpZGRlbiA9ICFzZWxlY3RlZFN5bWJvbElkO1xuICAgIHN3aXRjaFBlcnNwZWN0aXZlQnRuLnRleHRDb250ZW50ID1cbiAgICAgIGR0by5kdG9LaW5kID09PSAnY2FsbF9ncmFwaCcgPyAnU2hvdyBpbiBDRkcnIDogJ1Nob3cgaW4gQ2FsbCBHcmFwaCc7XG4gIH1cbiAgY29uc3Qgc3ViamVjdCA9XG4gICAgZHRvLmR0b0tpbmQgPT09ICdjZmcnICYmIGR0by5mdW5jdGlvblxuICAgICAgPyBgJHtkdG8uZnVuY3Rpb24ucXVhbGlmaWVkTmFtZX0gXHUwMEI3IENGR2BcbiAgICAgIDogZHRvLmR0b0tpbmQgPT09ICdjYWxsX2dyYXBoJ1xuICAgICAgICA/IGAke2R0by5jZW50ZXJTeW1ib2xJZH0gXHUwMEI3IENhbGwgR3JhcGhgXG4gICAgICAgIDogJ2NhbGwgZ3JhcGgnO1xuICBzZXRTdGF0dXMoXG4gICAgYCR7c3ViamVjdH0gXHUwMEI3ICR7ZHRvLmxhbmd1YWdlfSBcdTAwQjcgJHtkdG8ubm9kZXMubGVuZ3RofSBub2RlcyBcdTAwQjcgJHtkdG8uZWRnZXMubGVuZ3RofSBlZGdlcyBcdTAwQjcgJHtkdG8uY29tcGxldGVuZXNzfWAsXG4gICk7XG4gIG1ldGEudGV4dENvbnRlbnQgPSBgJHtkdG8uYWRhcHRlcklkfSBcdTAwQjcgJHtzdWJqZWN0fSBcdTAwQjcgZHRvIHYke2R0by5kdG9WZXJzaW9ufWA7XG4gIGNvbnN0IGRlZ3JhZGF0aW9ucyA9IGR0by5kZWdyYWRhdGlvbnMgPz8gW107XG4gIGNvbnN0IG1lc3NhZ2VzID0gZGVncmFkYXRpb25zLm1hcCgoZW50cnkpID0+XG4gICAgdHlwZW9mIGVudHJ5ID09PSAnc3RyaW5nJ1xuICAgICAgPyBlbnRyeVxuICAgICAgOiBgJHtlbnRyeS5zZXZlcml0eSA9PT0gJ2luZm8nID8gJycgOiBgJHtlbnRyeS5zZXZlcml0eX06IGB9JHtlbnRyeS5tZXNzYWdlfWAsXG4gICk7XG4gIHNldEJhbm5lcihtZXNzYWdlcy5sZW5ndGggPiAwID8gbWVzc2FnZXMuam9pbignIFx1MDBCNyAnKSA6ICcnLCBmYWxzZSk7XG59XG5cbmJyaWRnZS5vbigncHJvdG9jb2wuZXJyb3InLCAocGF5bG9hZCkgPT4ge1xuICBjb25zdCBjb2RlID0gdHlwZW9mIHBheWxvYWQuY29kZSA9PT0gJ3N0cmluZycgPyBwYXlsb2FkLmNvZGUgOiAnRV9QUk9UT0NPTCc7XG4gIGNvbnN0IG1lc3NhZ2UgPSB0eXBlb2YgcGF5bG9hZC5tZXNzYWdlID09PSAnc3RyaW5nJyA/IHBheWxvYWQubWVzc2FnZSA6ICdVbmtub3duIGVycm9yLic7XG4gIHNldEJhbm5lcihgJHtjb2RlfTogJHttZXNzYWdlfWAsIHRydWUpO1xuICBzZXRTdGF0dXMoJ0Vycm9yJyk7XG59KTtcblxuYnJpZGdlLm9uKCdzZXR0aW5ncy5kYXRhJywgKHBheWxvYWQpID0+IHtcbiAgY29uc3QgbmV4dCA9IHBheWxvYWQ/LnNldHRpbmdzO1xuICBpZiAobmV4dCAmJiB0eXBlb2YgbmV4dCA9PT0gJ29iamVjdCcpIHtcbiAgICBhcHBseVNldHRpbmdzKG5leHQpO1xuICB9XG59KTtcblxuYnJpZGdlLm9uKCdzb3VyY2Uuc3RhbGUnLCAocGF5bG9hZCkgPT4ge1xuICBtYXJrU3RhbGVGaWxlcyhBcnJheS5pc0FycmF5KHBheWxvYWQ/LmZpbGVJZHMpID8gcGF5bG9hZC5maWxlSWRzIDogW10pO1xufSk7XG5cbmJyaWRnZS5vbignc2VsZWN0aW9uLmNoYW5nZWQnLCAocGF5bG9hZCkgPT4ge1xuICBjb25zdCBub2RlSWRzID0gQXJyYXkuaXNBcnJheShwYXlsb2FkPy5ub2RlSWRzKSA/IHBheWxvYWQubm9kZUlkcyA6IFtdO1xuICByZW5kZXJlci5oaWdobGlnaHQobm9kZUlkcyk7XG4gIGNvbnN0IGFjdGl2ZU5vZGVJZCA9IHR5cGVvZiBwYXlsb2FkPy5hY3RpdmVOb2RlSWQgPT09ICdzdHJpbmcnID8gcGF5bG9hZC5hY3RpdmVOb2RlSWQgOiBudWxsO1xuICBpZiAoYWN0aXZlTm9kZUlkKSB7XG4gICAgY29uc3Qgbm9kZSA9IG5vZGVCeUlkKGFjdGl2ZU5vZGVJZCk7XG4gICAgaWYgKG5vZGUpIHtcbiAgICAgIHNob3dOb2RlRGV0YWlscyhhY3RpdmVOb2RlSWQsIG5vZGUpO1xuICAgIH1cbiAgfVxufSk7XG5cbmJyaWRnZS5vbignZ3JhcGguZm9jdXMnLCAocGF5bG9hZCkgPT4ge1xuICBpZiAodHlwZW9mIHBheWxvYWQ/Lm5vZGVJZCA9PT0gJ3N0cmluZycpIHtcbiAgICBjb25zdCBub2RlID0gbm9kZUJ5SWQocGF5bG9hZC5ub2RlSWQpO1xuICAgIGlmIChub2RlKSB7XG4gICAgICByZW5kZXJlci5zZWxlY3QocGF5bG9hZC5ub2RlSWQpO1xuICAgICAgc2hvd05vZGVEZXRhaWxzKHBheWxvYWQubm9kZUlkLCBub2RlKTtcbiAgICB9XG4gIH1cbiAgc3ZnLmZvY3VzPy4oKTtcbn0pO1xuXG5wcmV2aWV3LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJlbnRlcicsICgpID0+IHtcbiAgcHJldmlld0NvbnRyb2xsZXIucG9pbnRlckVudGVyQ2FyZCgpO1xufSk7XG5wcmV2aWV3LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJsZWF2ZScsICgpID0+IHtcbiAgcHJldmlld0NvbnRyb2xsZXIucG9pbnRlckxlYXZlQ2FyZCgpO1xufSk7XG5wcmV2aWV3UGluLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICBzeW5jUGluQnV0dG9uKHByZXZpZXdDb250cm9sbGVyLnRvZ2dsZVBpbigpKTtcbn0pO1xucHJldmlld0Nsb3NlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICBwcmV2aWV3Q29udHJvbGxlci5kaXNtaXNzKCk7XG4gIGhpZGVQcmV2aWV3KCk7XG59KTtcbnByZXZpZXdPcGVuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICBpZiAocHJldmlld05vZGVJZCkge1xuICAgIHZvaWQgbmF2aWdhdGVUbyhwcmV2aWV3Tm9kZUlkKTtcbiAgfVxufSk7XG5wcmV2aWV3Qm9keS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgaWYgKHNldHRpbmdzLmNsaWNrVG9OYXZpZ2F0ZSAmJiBwcmV2aWV3Tm9kZUlkICYmICFwcmV2aWV3T3Blbi5kaXNhYmxlZCkge1xuICAgIHZvaWQgbmF2aWdhdGVUbyhwcmV2aWV3Tm9kZUlkKTtcbiAgfVxufSk7XG5wcmV2aWV3LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcbiAgaWYgKGV2ZW50LmtleSA9PT0gJ0VzY2FwZScpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHByZXZpZXdDb250cm9sbGVyLmRpc21pc3MoKTtcbiAgICBoaWRlUHJldmlldygpO1xuICAgIHJlbmRlcmVyLmZvY3VzU2VsZWN0aW9uKCk7XG4gIH1cbn0pO1xud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcbiAgaWYgKGV2ZW50LmtleSA9PT0gJ0VzY2FwZScgJiYgIXByZXZpZXcuaGlkZGVuKSB7XG4gICAgcHJldmlld0NvbnRyb2xsZXIuZGlzbWlzcygpO1xuICAgIGhpZGVQcmV2aWV3KCk7XG4gIH1cbn0pO1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzeW1ib2xJZFxuICovXG5hc3luYyBmdW5jdGlvbiBsb2FkQ2ZnKHN5bWJvbElkKSB7XG4gIHNldFN0YXR1cygnQnVpbGRpbmcgY29udHJvbC1mbG93IGdyYXBoXHUyMDI2Jyk7XG4gIHNldEJhbm5lcignJyk7XG4gIHRyeSB7XG4gICAgLy8gQSByZXF1ZXN0IHJlc29sdmVzIHdpdGggaXRzIGNvcnJlbGF0ZWQgcmVzcG9uc2UuIFRoZSByZXNwb25zZSBpcyBub3RcbiAgICAvLyBkaXNwYXRjaGVkIHRvIGBicmlkZ2Uub25gLCBzbyBoYW5kbGUgaXQgaGVyZS5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyaWRnZS5yZXF1ZXN0KCdjZmcubG9hZCcsIHsgc3ltYm9sSWQgfSk7XG4gICAgc2VsZWN0ZWRTeW1ib2xJZCA9IHN5bWJvbElkO1xuICAgIGhhbmRsZUdyYXBoKHJlc3BvbnNlLnBheWxvYWQpO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHNldEJhbm5lcihgQ291bGQgbm90IGJ1aWxkIENGRzogJHtlcnJvcj8ubWVzc2FnZSA/PyBTdHJpbmcoZXJyb3IpfWAsIHRydWUpO1xuICAgIHNldFN0YXR1cygnQ0ZHIHVuYXZhaWxhYmxlJyk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHN5bWJvbElkXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGxvYWRDYWxsR3JhcGgoc3ltYm9sSWQpIHtcbiAgc2V0U3RhdHVzKCdCdWlsZGluZyBjYWxsIGdyYXBoXHUyMDI2Jyk7XG4gIHNldEJhbm5lcignJyk7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicmlkZ2UucmVxdWVzdCgnY2FsbHMubG9hZCcsIHsgc3ltYm9sSWQgfSk7XG4gICAgc2VsZWN0ZWRTeW1ib2xJZCA9IHN5bWJvbElkO1xuICAgIGFjdGl2ZVBlcnNwZWN0aXZlID0gJ2NhbGxfZ3JhcGgnO1xuICAgIGlmIChwZXJzcGVjdGl2ZVNlbGVjdCkge1xuICAgICAgcGVyc3BlY3RpdmVTZWxlY3QudmFsdWUgPSAnY2FsbF9ncmFwaCc7XG4gICAgfVxuICAgIGhhbmRsZUdyYXBoKHJlc3BvbnNlLnBheWxvYWQpO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHNldEJhbm5lcihgQ291bGQgbm90IGJ1aWxkIGNhbGwgZ3JhcGg6ICR7ZXJyb3I/Lm1lc3NhZ2UgPz8gU3RyaW5nKGVycm9yKX1gLCB0cnVlKTtcbiAgICBzZXRTdGF0dXMoJ0NhbGwgZ3JhcGggdW5hdmFpbGFibGUnKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gbG9hZEdyYXBoKCkge1xuICBzZXRTdGF0dXMoJ0xvYWRpbmcgZ3JhcGhcdTIwMjYnKTtcbiAgc2V0QmFubmVyKCcnKTtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyaWRnZS5yZXF1ZXN0KCdjZmcuZnVuY3Rpb25zJywge30pO1xuICAgIGNvbnN0IGxpc3QgPSBBcnJheS5pc0FycmF5KHJlc3BvbnNlLnBheWxvYWQuZnVuY3Rpb25zKSA/IHJlc3BvbnNlLnBheWxvYWQuZnVuY3Rpb25zIDogW107XG4gICAgaWYgKGxpc3QubGVuZ3RoID4gMCkge1xuICAgICAgcmVuZGVyRnVuY3Rpb25QaWNrZXIobGlzdCk7XG4gICAgICBjb25zdCByZXRhaW5lZCA9XG4gICAgICAgIHNlbGVjdGVkU3ltYm9sSWQgJiYgbGlzdC5zb21lKChlbnRyeSkgPT4gZW50cnkuc3ltYm9sSWQgPT09IHNlbGVjdGVkU3ltYm9sSWQpXG4gICAgICAgICAgPyBzZWxlY3RlZFN5bWJvbElkXG4gICAgICAgICAgOiBsaXN0WzBdLnN5bWJvbElkO1xuICAgICAgY29uc3QgbG9hZGVkID1cbiAgICAgICAgYWN0aXZlUGVyc3BlY3RpdmUgPT09ICdjYWxsX2dyYXBoJ1xuICAgICAgICAgID8gYXdhaXQgbG9hZENhbGxHcmFwaChyZXRhaW5lZClcbiAgICAgICAgICA6IGF3YWl0IGxvYWRDZmcocmV0YWluZWQpO1xuICAgICAgaWYgKGxvYWRlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICAvLyBUaGUgQ0ZHIGNhcGFiaWxpdHkgbWF5IGJlIGFic2VudCAoZm9yIGV4YW1wbGUgdGhlIGJ1aWx0LWluIGRlbW8gcnVuKS5cbiAgICAvLyBGYWxsaW5nIGJhY2sgdG8gdGhlIGNhbGwgZ3JhcGgga2VlcHMgdGhlIHBhbmVsIHVzZWZ1bCBhbmQgaG9uZXN0LlxuICB9XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicmlkZ2UucmVxdWVzdCgnZ3JhcGgubG9hZCcsIHsgZGVtbzogdHJ1ZSB9KTtcbiAgICBoYW5kbGVHcmFwaChyZXNwb25zZS5wYXlsb2FkKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBzZXRCYW5uZXIoYENvdWxkIG5vdCBsb2FkIGdyYXBoOiAke2Vycm9yPy5tZXNzYWdlID8/IFN0cmluZyhlcnJvcil9YCwgdHJ1ZSk7XG4gICAgc2V0U3RhdHVzKCdMb2FkIGZhaWxlZCcpO1xuICAgIGVtcHR5LmhpZGRlbiA9IGZhbHNlO1xuICB9XG59XG5cbnJlbG9hZEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgdm9pZCBsb2FkR3JhcGgoKTtcbn0pO1xuXG5mdW5jdGlvblBpY2tlcj8uYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKCkgPT4ge1xuICBjb25zdCBzeW1ib2xJZCA9IGZ1bmN0aW9uUGlja2VyLnZhbHVlO1xuICBpZiAoc3ltYm9sSWQpIHtcbiAgICBpZiAoYWN0aXZlUGVyc3BlY3RpdmUgPT09ICdjYWxsX2dyYXBoJykge1xuICAgICAgdm9pZCBsb2FkQ2FsbEdyYXBoKHN5bWJvbElkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdm9pZCBsb2FkQ2ZnKHN5bWJvbElkKTtcbiAgICB9XG4gIH1cbn0pO1xuXG5wZXJzcGVjdGl2ZVNlbGVjdD8uYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKCkgPT4ge1xuICBhY3RpdmVQZXJzcGVjdGl2ZSA9IHBlcnNwZWN0aXZlU2VsZWN0LnZhbHVlID09PSAnY2FsbF9ncmFwaCcgPyAnY2FsbF9ncmFwaCcgOiAnY2ZnJztcbiAgaWYgKHNlbGVjdGVkU3ltYm9sSWQpIHtcbiAgICBpZiAoYWN0aXZlUGVyc3BlY3RpdmUgPT09ICdjYWxsX2dyYXBoJykge1xuICAgICAgdm9pZCBsb2FkQ2FsbEdyYXBoKHNlbGVjdGVkU3ltYm9sSWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2b2lkIGxvYWRDZmcoc2VsZWN0ZWRTeW1ib2xJZCk7XG4gICAgfVxuICB9XG59KTtcblxuc3dpdGNoUGVyc3BlY3RpdmVCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICBjb25zdCB0YXJnZXRTeW1ib2wgPVxuICAgIGFjdGl2ZU5vZGVJZCAmJiBjdXJyZW50RHRvPy5kdG9LaW5kID09PSAnY2FsbF9ncmFwaCcgJiYgIWFjdGl2ZU5vZGVJZC5zdGFydHNXaXRoKCdidWNrZXQ6JylcbiAgICAgID8gYWN0aXZlTm9kZUlkXG4gICAgICA6IHNlbGVjdGVkU3ltYm9sSWQ7XG4gIGlmICghdGFyZ2V0U3ltYm9sKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChjdXJyZW50RHRvPy5kdG9LaW5kID09PSAnY2FsbF9ncmFwaCcpIHtcbiAgICBhY3RpdmVQZXJzcGVjdGl2ZSA9ICdjZmcnO1xuICAgIGlmIChwZXJzcGVjdGl2ZVNlbGVjdCkge1xuICAgICAgcGVyc3BlY3RpdmVTZWxlY3QudmFsdWUgPSAnY2ZnJztcbiAgICB9XG4gICAgdm9pZCBsb2FkQ2ZnKHRhcmdldFN5bWJvbCk7XG4gIH0gZWxzZSB7XG4gICAgYWN0aXZlUGVyc3BlY3RpdmUgPSAnY2FsbF9ncmFwaCc7XG4gICAgaWYgKHBlcnNwZWN0aXZlU2VsZWN0KSB7XG4gICAgICBwZXJzcGVjdGl2ZVNlbGVjdC52YWx1ZSA9ICdjYWxsX2dyYXBoJztcbiAgICB9XG4gICAgdm9pZCBsb2FkQ2FsbEdyYXBoKHRhcmdldFN5bWJvbCk7XG4gIH1cbn0pO1xuXG5jYWxsc0V4cGFuZEJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBhc3luYyAoKSA9PiB7XG4gIGlmICghYWN0aXZlTm9kZUlkIHx8IGN1cnJlbnREdG8/LmR0b0tpbmQgIT09ICdjYWxsX2dyYXBoJykge1xuICAgIHJldHVybjtcbiAgfVxuICB0cnkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGJyaWRnZS5yZXF1ZXN0KCdjYWxscy5leHBhbmQnLCB7IHN5bWJvbElkOiBhY3RpdmVOb2RlSWQgfSk7XG4gICAgaGFuZGxlR3JhcGgocmVzLnBheWxvYWQpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHNldEJhbm5lcihgRXhwYW5kIGZhaWxlZDogJHtlcnJvcj8ubWVzc2FnZSA/PyBTdHJpbmcoZXJyb3IpfWAsIHRydWUpO1xuICB9XG59KTtcblxuY2FsbHNDb2xsYXBzZUJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBhc3luYyAoKSA9PiB7XG4gIGlmICghYWN0aXZlTm9kZUlkIHx8IGN1cnJlbnREdG8/LmR0b0tpbmQgIT09ICdjYWxsX2dyYXBoJykge1xuICAgIHJldHVybjtcbiAgfVxuICB0cnkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGJyaWRnZS5yZXF1ZXN0KCdjYWxscy5jb2xsYXBzZScsIHsgc3ltYm9sSWQ6IGFjdGl2ZU5vZGVJZCB9KTtcbiAgICBoYW5kbGVHcmFwaChyZXMucGF5bG9hZCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgc2V0QmFubmVyKGBDb2xsYXBzZSBmYWlsZWQ6ICR7ZXJyb3I/Lm1lc3NhZ2UgPz8gU3RyaW5nKGVycm9yKX1gLCB0cnVlKTtcbiAgfVxufSk7XG5cbmNhbGxzRm9jdXNCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYXN5bmMgKCkgPT4ge1xuICBpZiAoY3VycmVudER0bz8uZHRvS2luZCAhPT0gJ2NhbGxfZ3JhcGgnKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IG5leHRGb2N1cyA9IGN1cnJlbnREdG8uZm9jdXNlZE5vZGVJZCA/IG51bGwgOiAoYWN0aXZlTm9kZUlkID8/IGN1cnJlbnREdG8uY2VudGVyU3ltYm9sSWQpO1xuICB0cnkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGJyaWRnZS5yZXF1ZXN0KCdjYWxscy5mb2N1cycsIHsgc3ltYm9sSWQ6IG5leHRGb2N1cyB9KTtcbiAgICBoYW5kbGVHcmFwaChyZXMucGF5bG9hZCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgc2V0QmFubmVyKGBGb2N1cyBmYWlsZWQ6ICR7ZXJyb3I/Lm1lc3NhZ2UgPz8gU3RyaW5nKGVycm9yKX1gLCB0cnVlKTtcbiAgfVxufSk7XG5cbmNhbGxzRmlsdGVyU3RhdHVzPy5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBhc3luYyAoKSA9PiB7XG4gIGlmIChjdXJyZW50RHRvPy5kdG9LaW5kICE9PSAnY2FsbF9ncmFwaCcpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgdmFsdWUgPSBjYWxsc0ZpbHRlclN0YXR1cy52YWx1ZTtcbiAgY29uc3Qgc3RhdHVzZXMgPSB2YWx1ZSA9PT0gJ2FsbCcgPyBudWxsIDogdmFsdWUuc3BsaXQoJywnKTtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBicmlkZ2UucmVxdWVzdCgnY2FsbHMuZmlsdGVyJywgeyBzdGF0dXNlcyB9KTtcbiAgICBoYW5kbGVHcmFwaChyZXMucGF5bG9hZCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgc2V0QmFubmVyKGBGaWx0ZXIgZmFpbGVkOiAke2Vycm9yPy5tZXNzYWdlID8/IFN0cmluZyhlcnJvcil9YCwgdHJ1ZSk7XG4gIH1cbn0pO1xuXG5jYWxsZXJzTW9yZUJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gIGlmIChjdXJyZW50RHRvPy5jZW50ZXJTeW1ib2xJZCkge1xuICAgIHZvaWQgbG9hZE5laWdoYm9yUGFnZSgnaW5jb21pbmcnLCBjdXJyZW50RHRvLmNlbnRlclN5bWJvbElkLCB0cnVlKTtcbiAgfVxufSk7XG5cbmNhbGxlZXNNb3JlQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgaWYgKGN1cnJlbnREdG8/LmNlbnRlclN5bWJvbElkKSB7XG4gICAgdm9pZCBsb2FkTmVpZ2hib3JQYWdlKCdvdXRnb2luZycsIGN1cnJlbnREdG8uY2VudGVyU3ltYm9sSWQsIHRydWUpO1xuICB9XG59KTtcblxuZXhwbGFpbkRlcHRoU2VsZWN0Py5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoKSA9PiB7XG4gIGFjdGl2ZUV4cGxhaW5EZXB0aCA9IGNsYW1wRXhwbGFuYXRpb25EZXB0aChleHBsYWluRGVwdGhTZWxlY3QudmFsdWUpO1xuICBpZiAoYWN0aXZlTm9kZUlkKSB7XG4gICAgdm9pZCBsb2FkTm9kZUV4cGxhbmF0aW9uKGFjdGl2ZU5vZGVJZCk7XG4gIH1cbiAgaWYgKGN1cnJlbnREdG8/LmR0b0tpbmQgPT09ICdjZmcnKSB7XG4gICAgdm9pZCBsb2FkRnVuY3Rpb25TdW1tYXJ5KGN1cnJlbnREdG8pO1xuICB9XG59KTtcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgKGV2ZW50KSA9PiB7XG4gIHNldEJhbm5lcihgV2VidmlldyBlcnJvcjogJHtldmVudC5tZXNzYWdlfWAsIHRydWUpO1xufSk7XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd1bmhhbmRsZWRyZWplY3Rpb24nLCAoZXZlbnQpID0+IHtcbiAgc2V0QmFubmVyKGBVbmhhbmRsZWQgcmVqZWN0aW9uOiAke1N0cmluZyhldmVudC5yZWFzb24pfWAsIHRydWUpO1xufSk7XG5cbmFzeW5jIGZ1bmN0aW9uIGJvb3QoKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicmlkZ2UucmVxdWVzdCgnd2Vidmlldy5yZWFkeScsIHtcbiAgICAgIGNsaWVudDogJ3dlYnZpZXcnLFxuICAgICAgcHJvdG9jb2xWZXJzaW9uOiBQUk9UT0NPTF9WRVJTSU9OLFxuICAgIH0pO1xuICAgIHNob3dDYXBhYmlsaXRpZXMocmVzcG9uc2UucGF5bG9hZCk7XG4gIH0gY2F0Y2gge1xuICAgIC8vIENhcGFiaWxpdGllcyBhcmUgaW5mb3JtYXRpb25hbDsgZ3JhcGggbG9hZCBjYW4gc3RpbGwgc3VjY2VlZC5cbiAgfVxuICBhd2FpdCBsb2FkR3JhcGgoKTtcbn1cblxudm9pZCBib290KCk7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUVBLGVBQVMsV0FBVyxLQUFLO0FBQ3ZCLFlBQUksZUFBZSxLQUFLO0FBQ3RCLGNBQUksUUFDRixJQUFJLFNBQ0osSUFBSSxNQUNGLFdB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QUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUdBLFVBQU0saUJBQWlCO0FBQUEsTUFDckI7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBRUEsVUFBTSxhQUFhO0FBQUEsTUFDakI7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFFQSxVQUFNLGlCQUFpQjtBQUFBLE1BQ3JCO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNB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Q0Y7OztBQzFsQkEsTUFBTSxXQUFXO0FBQ2pCLE1BQU0sV0FBVztBQUFBLElBQ2Y7QUFBQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFJQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQTtBQUFBLElBRUE7QUFBQSxFQUNGO0FBQ0EsTUFBTSxXQUFXO0FBQUEsSUFDZjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUdBLE1BQU0sUUFBUTtBQUFBO0FBQUEsSUFFWjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBO0FBQUEsSUFFQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBO0FBQUEsSUFFQTtBQUFBLElBQ0E7QUFBQTtBQUFBLElBRUE7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBO0FBQUEsSUFFQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBO0FBQUEsSUFFQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElB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QixTQUFTLE1BQU07QUFDOUMsUUFBSSxZQUFZLGdCQUFnQjtBQUM5QixXQUFLLGlCQUFpQixZQUFZLFdBQVcsZ0JBQWdCLElBQUk7QUFBQSxJQUNuRTtBQUFBLEVBQ0YsQ0FBQztBQUVELHNCQUFvQixpQkFBaUIsVUFBVSxNQUFNO0FBQ25ELHlCQUFxQixzQkFBc0IsbUJBQW1CLEtBQUs7QUFDbkUsUUFBSSxjQUFjO0FBQ2hCLFdBQUssb0JBQW9CLFlBQVk7QUFBQSxJQUN2QztBQUNBLFFBQUksWUFBWSxZQUFZLE9BQU87QUFDakMsV0FBSyxvQkFBb0IsVUFBVTtBQUFBLElBQ3JDO0FBQUEsRUFDRixDQUFDO0FBRUQsU0FBTyxpQkFBaUIsU0FBUyxDQUFDLFVBQVU7QUFDMUMsY0FBVSxrQkFBa0IsTUFBTSxPQUFPLElBQUksSUFBSTtBQUFBLEVBQ25ELENBQUM7QUFFRCxTQUFPLGlCQUFpQixzQkFBc0IsQ0FBQyxVQUFVO0FBQ3ZELGNBQVUsd0JBQXdCLE9BQU8sTUFBTSxNQUFNLENBQUMsSUFBSSxJQUFJO0FBQUEsRUFDaEUsQ0FBQztBQUVELGlCQUFlLE9BQU87QUFDcEIsUUFBSTtBQUNGLFlBQU0sV0FBVyxNQUFNLE9BQU8sUUFBUSxpQkFBaUI7QUFBQSxRQUNyRCxRQUFRO0FBQUEsUUFDUixpQkFBaUI7QUFBQSxNQUNuQixDQUFDO0FBQ0QsdUJBQWlCLFNBQVMsT0FBTztBQUFBLElBQ25DLFFBQVE7QUFBQSxJQUVSO0FBQ0EsVUFBTSxVQUFVO0FBQUEsRUFDbEI7QUFFQSxPQUFLLEtBQUs7IiwKICAibmFtZXMiOiBbInJlbmRlcmVyIiwgIklERU5UX1JFIiwgInNjb3BlTmFtZSIsICJ2ZXJzaW9uIiwgImkiLCAiaGlnaGxpZ2h0IiwgInJlc3VsdCIsICJib290IiwgInN2ZyIsICJlbXB0eSIsICJhc0Jvb2xlYW4iLCAiSGlnaGxpZ2h0SlMiLCAiTElURVJBTFMiLCAiYWN0aXZlTm9kZUlkIl0KfQo=
