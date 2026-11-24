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
    "index.status"
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
    "index.data"
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vbm9kZV9tb2R1bGVzL2hpZ2hsaWdodC5qcy9saWIvY29yZS5qcyIsICIuLi8uLi9zcmMvY29yZS9wcm90b2NvbC9lbnZlbG9wZS5qcyIsICIuLi8uLi9zcmMvY29yZS9wcm90b2NvbC9icmlkZ2UuanMiLCAiLi4vLi4vc3JjL2NvcmUvZ3JhcGgvbGF5b3V0LmpzIiwgIi4uLy4uL3NyYy9jb3JlL2dyYXBoL2NmZy9raW5kcy5qcyIsICIuLi8uLi9zcmMvY29yZS9ncmFwaC9jYWxscy9raW5kcy5qcyIsICIuLi8uLi9zcmMvY29yZS9ncmFwaC9kdG8uanMiLCAiLi4vLi4vc3JjL3Zpc3VhbGl6YXRpb24vcmVuZGVyZXIvc3ZnUmVuZGVyZXIuanMiLCAiLi4vLi4vc3JjL2NvcmUvc291cmNlL3Jhbmdlcy5qcyIsICIuLi8uLi9zcmMvY29yZS9zb3VyY2UvcHJlc2VudGF0aW9uLmpzIiwgIi4uLy4uL3NyYy9jb3JlL3NvdXJjZS9zZXR0aW5ncy5qcyIsICIuLi8uLi9zcmMvY29yZS9leHBsYW5hdGlvbi9zZXR0aW5ncy5qcyIsICIuLi8uLi9zcmMvd2Vidmlldy9wcmV2aWV3Q29udHJvbGxlci5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvaGlnaGxpZ2h0LmpzL2VzL2NvcmUuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2hpZ2hsaWdodC5qcy9lcy9sYW5ndWFnZXMvY3BwLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9oaWdobGlnaHQuanMvZXMvbGFuZ3VhZ2VzL2phdmFzY3JpcHQuanMiLCAiLi4vLi4vc3JjL3dlYnZpZXcvaGlnaGxpZ2h0LmpzIiwgIi4uLy4uL3NyYy93ZWJ2aWV3L21haW4uanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qIGVzbGludC1kaXNhYmxlIG5vLW11bHRpLWFzc2lnbiAqL1xuXG5mdW5jdGlvbiBkZWVwRnJlZXplKG9iaikge1xuICBpZiAob2JqIGluc3RhbmNlb2YgTWFwKSB7XG4gICAgb2JqLmNsZWFyID1cbiAgICAgIG9iai5kZWxldGUgPVxuICAgICAgb2JqLnNldCA9XG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21hcCBpcyByZWFkLW9ubHknKTtcbiAgICAgICAgfTtcbiAgfSBlbHNlIGlmIChvYmogaW5zdGFuY2VvZiBTZXQpIHtcbiAgICBvYmouYWRkID1cbiAgICAgIG9iai5jbGVhciA9XG4gICAgICBvYmouZGVsZXRlID1cbiAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignc2V0IGlzIHJlYWQtb25seScpO1xuICAgICAgICB9O1xuICB9XG5cbiAgLy8gRnJlZXplIHNlbGZcbiAgT2JqZWN0LmZyZWV6ZShvYmopO1xuXG4gIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG9iaikuZm9yRWFjaCgobmFtZSkgPT4ge1xuICAgIGNvbnN0IHByb3AgPSBvYmpbbmFtZV07XG4gICAgY29uc3QgdHlwZSA9IHR5cGVvZiBwcm9wO1xuXG4gICAgLy8gRnJlZXplIHByb3AgaWYgaXQgaXMgYW4gb2JqZWN0IG9yIGZ1bmN0aW9uIGFuZCBhbHNvIG5vdCBhbHJlYWR5IGZyb3plblxuICAgIGlmICgodHlwZSA9PT0gJ29iamVjdCcgfHwgdHlwZSA9PT0gJ2Z1bmN0aW9uJykgJiYgIU9iamVjdC5pc0Zyb3plbihwcm9wKSkge1xuICAgICAgZGVlcEZyZWV6ZShwcm9wKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBvYmo7XG59XG5cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5DYWxsYmFja1Jlc3BvbnNlfSBDYWxsYmFja1Jlc3BvbnNlICovXG4vKiogQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQ29tcGlsZWRNb2RlfSBDb21waWxlZE1vZGUgKi9cbi8qKiBAaW1wbGVtZW50cyBDYWxsYmFja1Jlc3BvbnNlICovXG5cbmNsYXNzIFJlc3BvbnNlIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7Q29tcGlsZWRNb2RlfSBtb2RlXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihtb2RlKSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmaW5lZFxuICAgIGlmIChtb2RlLmRhdGEgPT09IHVuZGVmaW5lZCkgbW9kZS5kYXRhID0ge307XG5cbiAgICB0aGlzLmRhdGEgPSBtb2RlLmRhdGE7XG4gICAgdGhpcy5pc01hdGNoSWdub3JlZCA9IGZhbHNlO1xuICB9XG5cbiAgaWdub3JlTWF0Y2goKSB7XG4gICAgdGhpcy5pc01hdGNoSWdub3JlZCA9IHRydWU7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVzY2FwZUhUTUwodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlXG4gICAgLnJlcGxhY2UoLyYvZywgJyZhbXA7JylcbiAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXG4gICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKVxuICAgIC5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7JylcbiAgICAucmVwbGFjZSgvJy9nLCAnJiN4Mjc7Jyk7XG59XG5cbi8qKlxuICogcGVyZm9ybXMgYSBzaGFsbG93IG1lcmdlIG9mIG11bHRpcGxlIG9iamVjdHMgaW50byBvbmVcbiAqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtUfSBvcmlnaW5hbFxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLGFueT5bXX0gb2JqZWN0c1xuICogQHJldHVybnMge1R9IGEgc2luZ2xlIG5ldyBvYmplY3RcbiAqL1xuZnVuY3Rpb24gaW5oZXJpdCQxKG9yaWdpbmFsLCAuLi5vYmplY3RzKSB7XG4gIC8qKiBAdHlwZSBSZWNvcmQ8c3RyaW5nLGFueT4gKi9cbiAgY29uc3QgcmVzdWx0ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICBmb3IgKGNvbnN0IGtleSBpbiBvcmlnaW5hbCkge1xuICAgIHJlc3VsdFtrZXldID0gb3JpZ2luYWxba2V5XTtcbiAgfVxuICBvYmplY3RzLmZvckVhY2goZnVuY3Rpb24ob2JqKSB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gb2JqKSB7XG4gICAgICByZXN1bHRba2V5XSA9IG9ialtrZXldO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiAvKiogQHR5cGUge1R9ICovIChyZXN1bHQpO1xufVxuXG4vKipcbiAqIEB0eXBlZGVmIHtvYmplY3R9IFJlbmRlcmVyXG4gKiBAcHJvcGVydHkgeyh0ZXh0OiBzdHJpbmcpID0+IHZvaWR9IGFkZFRleHRcbiAqIEBwcm9wZXJ0eSB7KG5vZGU6IE5vZGUpID0+IHZvaWR9IG9wZW5Ob2RlXG4gKiBAcHJvcGVydHkgeyhub2RlOiBOb2RlKSA9PiB2b2lkfSBjbG9zZU5vZGVcbiAqIEBwcm9wZXJ0eSB7KCkgPT4gc3RyaW5nfSB2YWx1ZVxuICovXG5cbi8qKiBAdHlwZWRlZiB7e3Njb3BlPzogc3RyaW5nLCBsYW5ndWFnZT86IHN0cmluZywgc3VibGFuZ3VhZ2U/OiBib29sZWFufX0gTm9kZSAqL1xuLyoqIEB0eXBlZGVmIHt7d2FsazogKHI6IFJlbmRlcmVyKSA9PiB2b2lkfX0gVHJlZSAqL1xuLyoqICovXG5cbmNvbnN0IFNQQU5fQ0xPU0UgPSAnPC9zcGFuPic7XG5cbi8qKlxuICogRGV0ZXJtaW5lcyBpZiBhIG5vZGUgbmVlZHMgdG8gYmUgd3JhcHBlZCBpbiA8c3Bhbj5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGUgKi9cbmNvbnN0IGVtaXRzV3JhcHBpbmdUYWdzID0gKG5vZGUpID0+IHtcbiAgLy8gcmFyZWx5IHdlIGNhbiBoYXZlIGEgc3VibGFuZ3VhZ2Ugd2hlcmUgbGFuZ3VhZ2UgaXMgdW5kZWZpbmVkXG4gIC8vIFRPRE86IHRyYWNrIGRvd24gd2h5XG4gIHJldHVybiAhIW5vZGUuc2NvcGU7XG59O1xuXG4vKipcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHBhcmFtIHt7cHJlZml4OnN0cmluZ319IG9wdGlvbnNcbiAqL1xuY29uc3Qgc2NvcGVUb0NTU0NsYXNzID0gKG5hbWUsIHsgcHJlZml4IH0pID0+IHtcbiAgLy8gc3ViLWxhbmd1YWdlXG4gIGlmIChuYW1lLnN0YXJ0c1dpdGgoXCJsYW5ndWFnZTpcIikpIHtcbiAgICByZXR1cm4gbmFtZS5yZXBsYWNlKFwibGFuZ3VhZ2U6XCIsIFwibGFuZ3VhZ2UtXCIpO1xuICB9XG4gIC8vIHRpZXJlZCBzY29wZTogY29tbWVudC5saW5lXG4gIGlmIChuYW1lLmluY2x1ZGVzKFwiLlwiKSkge1xuICAgIGNvbnN0IHBpZWNlcyA9IG5hbWUuc3BsaXQoXCIuXCIpO1xuICAgIHJldHVybiBbXG4gICAgICBgJHtwcmVmaXh9JHtwaWVjZXMuc2hpZnQoKX1gLFxuICAgICAgLi4uKHBpZWNlcy5tYXAoKHgsIGkpID0+IGAke3h9JHtcIl9cIi5yZXBlYXQoaSArIDEpfWApKVxuICAgIF0uam9pbihcIiBcIik7XG4gIH1cbiAgLy8gc2ltcGxlIHNjb3BlXG4gIHJldHVybiBgJHtwcmVmaXh9JHtuYW1lfWA7XG59O1xuXG4vKiogQHR5cGUge1JlbmRlcmVyfSAqL1xuY2xhc3MgSFRNTFJlbmRlcmVyIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgSFRNTFJlbmRlcmVyXG4gICAqXG4gICAqIEBwYXJhbSB7VHJlZX0gcGFyc2VUcmVlIC0gdGhlIHBhcnNlIHRyZWUgKG11c3Qgc3VwcG9ydCBgd2Fsa2AgQVBJKVxuICAgKiBAcGFyYW0ge3tjbGFzc1ByZWZpeDogc3RyaW5nfX0gb3B0aW9uc1xuICAgKi9cbiAgY29uc3RydWN0b3IocGFyc2VUcmVlLCBvcHRpb25zKSB7XG4gICAgdGhpcy5idWZmZXIgPSBcIlwiO1xuICAgIHRoaXMuY2xhc3NQcmVmaXggPSBvcHRpb25zLmNsYXNzUHJlZml4O1xuICAgIHBhcnNlVHJlZS53YWxrKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGV4dHMgdG8gdGhlIG91dHB1dCBzdHJlYW1cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRleHQgKi9cbiAgYWRkVGV4dCh0ZXh0KSB7XG4gICAgdGhpcy5idWZmZXIgKz0gZXNjYXBlSFRNTCh0ZXh0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgbm9kZSBvcGVuIHRvIHRoZSBvdXRwdXQgc3RyZWFtIChpZiBuZWVkZWQpXG4gICAqXG4gICAqIEBwYXJhbSB7Tm9kZX0gbm9kZSAqL1xuICBvcGVuTm9kZShub2RlKSB7XG4gICAgaWYgKCFlbWl0c1dyYXBwaW5nVGFncyhub2RlKSkgcmV0dXJuO1xuXG4gICAgY29uc3QgY2xhc3NOYW1lID0gc2NvcGVUb0NTU0NsYXNzKG5vZGUuc2NvcGUsXG4gICAgICB7IHByZWZpeDogdGhpcy5jbGFzc1ByZWZpeCB9KTtcbiAgICB0aGlzLnNwYW4oY2xhc3NOYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgbm9kZSBjbG9zZSB0byB0aGUgb3V0cHV0IHN0cmVhbSAoaWYgbmVlZGVkKVxuICAgKlxuICAgKiBAcGFyYW0ge05vZGV9IG5vZGUgKi9cbiAgY2xvc2VOb2RlKG5vZGUpIHtcbiAgICBpZiAoIWVtaXRzV3JhcHBpbmdUYWdzKG5vZGUpKSByZXR1cm47XG5cbiAgICB0aGlzLmJ1ZmZlciArPSBTUEFOX0NMT1NFO1xuICB9XG5cbiAgLyoqXG4gICAqIHJldHVybnMgdGhlIGFjY3VtdWxhdGVkIGJ1ZmZlclxuICAqL1xuICB2YWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5idWZmZXI7XG4gIH1cblxuICAvLyBoZWxwZXJzXG5cbiAgLyoqXG4gICAqIEJ1aWxkcyBhIHNwYW4gZWxlbWVudFxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lICovXG4gIHNwYW4oY2xhc3NOYW1lKSB7XG4gICAgdGhpcy5idWZmZXIgKz0gYDxzcGFuIGNsYXNzPVwiJHtjbGFzc05hbWV9XCI+YDtcbiAgfVxufVxuXG4vKiogQHR5cGVkZWYge3tzY29wZT86IHN0cmluZywgbGFuZ3VhZ2U/OiBzdHJpbmcsIGNoaWxkcmVuOiBOb2RlW119IHwgc3RyaW5nfSBOb2RlICovXG4vKiogQHR5cGVkZWYge3tzY29wZT86IHN0cmluZywgbGFuZ3VhZ2U/OiBzdHJpbmcsIGNoaWxkcmVuOiBOb2RlW119IH0gRGF0YU5vZGUgKi9cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5FbWl0dGVyfSBFbWl0dGVyICovXG4vKiogICovXG5cbi8qKiBAcmV0dXJucyB7RGF0YU5vZGV9ICovXG5jb25zdCBuZXdOb2RlID0gKG9wdHMgPSB7fSkgPT4ge1xuICAvKiogQHR5cGUgRGF0YU5vZGUgKi9cbiAgY29uc3QgcmVzdWx0ID0geyBjaGlsZHJlbjogW10gfTtcbiAgT2JqZWN0LmFzc2lnbihyZXN1bHQsIG9wdHMpO1xuICByZXR1cm4gcmVzdWx0O1xufTtcblxuY2xhc3MgVG9rZW5UcmVlIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLyoqIEB0eXBlIERhdGFOb2RlICovXG4gICAgdGhpcy5yb290Tm9kZSA9IG5ld05vZGUoKTtcbiAgICB0aGlzLnN0YWNrID0gW3RoaXMucm9vdE5vZGVdO1xuICB9XG5cbiAgZ2V0IHRvcCgpIHtcbiAgICByZXR1cm4gdGhpcy5zdGFja1t0aGlzLnN0YWNrLmxlbmd0aCAtIDFdO1xuICB9XG5cbiAgZ2V0IHJvb3QoKSB7IHJldHVybiB0aGlzLnJvb3ROb2RlOyB9XG5cbiAgLyoqIEBwYXJhbSB7Tm9kZX0gbm9kZSAqL1xuICBhZGQobm9kZSkge1xuICAgIHRoaXMudG9wLmNoaWxkcmVuLnB1c2gobm9kZSk7XG4gIH1cblxuICAvKiogQHBhcmFtIHtzdHJpbmd9IHNjb3BlICovXG4gIG9wZW5Ob2RlKHNjb3BlKSB7XG4gICAgLyoqIEB0eXBlIE5vZGUgKi9cbiAgICBjb25zdCBub2RlID0gbmV3Tm9kZSh7IHNjb3BlIH0pO1xuICAgIHRoaXMuYWRkKG5vZGUpO1xuICAgIHRoaXMuc3RhY2sucHVzaChub2RlKTtcbiAgfVxuXG4gIGNsb3NlTm9kZSgpIHtcbiAgICBpZiAodGhpcy5zdGFjay5sZW5ndGggPiAxKSB7XG4gICAgICByZXR1cm4gdGhpcy5zdGFjay5wb3AoKTtcbiAgICB9XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmaW5lZFxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBjbG9zZUFsbE5vZGVzKCkge1xuICAgIHdoaWxlICh0aGlzLmNsb3NlTm9kZSgpKTtcbiAgfVxuXG4gIHRvSlNPTigpIHtcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodGhpcy5yb290Tm9kZSwgbnVsbCwgNCk7XG4gIH1cblxuICAvKipcbiAgICogQHR5cGVkZWYgeyBpbXBvcnQoXCIuL2h0bWxfcmVuZGVyZXJcIikuUmVuZGVyZXIgfSBSZW5kZXJlclxuICAgKiBAcGFyYW0ge1JlbmRlcmVyfSBidWlsZGVyXG4gICAqL1xuICB3YWxrKGJ1aWxkZXIpIHtcbiAgICAvLyB0aGlzIGRvZXMgbm90XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuX3dhbGsoYnVpbGRlciwgdGhpcy5yb290Tm9kZSk7XG4gICAgLy8gdGhpcyB3b3Jrc1xuICAgIC8vIHJldHVybiBUb2tlblRyZWUuX3dhbGsoYnVpbGRlciwgdGhpcy5yb290Tm9kZSk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtSZW5kZXJlcn0gYnVpbGRlclxuICAgKiBAcGFyYW0ge05vZGV9IG5vZGVcbiAgICovXG4gIHN0YXRpYyBfd2FsayhidWlsZGVyLCBub2RlKSB7XG4gICAgaWYgKHR5cGVvZiBub2RlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBidWlsZGVyLmFkZFRleHQobm9kZSk7XG4gICAgfSBlbHNlIGlmIChub2RlLmNoaWxkcmVuKSB7XG4gICAgICBidWlsZGVyLm9wZW5Ob2RlKG5vZGUpO1xuICAgICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4gdGhpcy5fd2FsayhidWlsZGVyLCBjaGlsZCkpO1xuICAgICAgYnVpbGRlci5jbG9zZU5vZGUobm9kZSk7XG4gICAgfVxuICAgIHJldHVybiBidWlsZGVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7Tm9kZX0gbm9kZVxuICAgKi9cbiAgc3RhdGljIF9jb2xsYXBzZShub2RlKSB7XG4gICAgaWYgKHR5cGVvZiBub2RlID09PSBcInN0cmluZ1wiKSByZXR1cm47XG4gICAgaWYgKCFub2RlLmNoaWxkcmVuKSByZXR1cm47XG5cbiAgICBpZiAobm9kZS5jaGlsZHJlbi5ldmVyeShlbCA9PiB0eXBlb2YgZWwgPT09IFwic3RyaW5nXCIpKSB7XG4gICAgICAvLyBub2RlLnRleHQgPSBub2RlLmNoaWxkcmVuLmpvaW4oXCJcIik7XG4gICAgICAvLyBkZWxldGUgbm9kZS5jaGlsZHJlbjtcbiAgICAgIG5vZGUuY2hpbGRyZW4gPSBbbm9kZS5jaGlsZHJlbi5qb2luKFwiXCIpXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4ge1xuICAgICAgICBUb2tlblRyZWUuX2NvbGxhcHNlKGNoaWxkKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAgQ3VycmVudGx5IHRoaXMgaXMgYWxsIHByaXZhdGUgQVBJLCBidXQgdGhpcyBpcyB0aGUgbWluaW1hbCBBUEkgbmVjZXNzYXJ5XG4gIHRoYXQgYW4gRW1pdHRlciBtdXN0IGltcGxlbWVudCB0byBmdWxseSBzdXBwb3J0IHRoZSBwYXJzZXIuXG5cbiAgTWluaW1hbCBpbnRlcmZhY2U6XG5cbiAgLSBhZGRUZXh0KHRleHQpXG4gIC0gX19hZGRTdWJsYW5ndWFnZShlbWl0dGVyLCBzdWJMYW5ndWFnZU5hbWUpXG4gIC0gc3RhcnRTY29wZShzY29wZSlcbiAgLSBlbmRTY29wZSgpXG4gIC0gZmluYWxpemUoKVxuICAtIHRvSFRNTCgpXG5cbiovXG5cbi8qKlxuICogQGltcGxlbWVudHMge0VtaXR0ZXJ9XG4gKi9cbmNsYXNzIFRva2VuVHJlZUVtaXR0ZXIgZXh0ZW5kcyBUb2tlblRyZWUge1xuICAvKipcbiAgICogQHBhcmFtIHsqfSBvcHRpb25zXG4gICAqL1xuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gICAqL1xuICBhZGRUZXh0KHRleHQpIHtcbiAgICBpZiAodGV4dCA9PT0gXCJcIikgeyByZXR1cm47IH1cblxuICAgIHRoaXMuYWRkKHRleHQpO1xuICB9XG5cbiAgLyoqIEBwYXJhbSB7c3RyaW5nfSBzY29wZSAqL1xuICBzdGFydFNjb3BlKHNjb3BlKSB7XG4gICAgdGhpcy5vcGVuTm9kZShzY29wZSk7XG4gIH1cblxuICBlbmRTY29wZSgpIHtcbiAgICB0aGlzLmNsb3NlTm9kZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7RW1pdHRlciAmIHtyb290OiBEYXRhTm9kZX19IGVtaXR0ZXJcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICovXG4gIF9fYWRkU3VibGFuZ3VhZ2UoZW1pdHRlciwgbmFtZSkge1xuICAgIC8qKiBAdHlwZSBEYXRhTm9kZSAqL1xuICAgIGNvbnN0IG5vZGUgPSBlbWl0dGVyLnJvb3Q7XG4gICAgaWYgKG5hbWUpIG5vZGUuc2NvcGUgPSBgbGFuZ3VhZ2U6JHtuYW1lfWA7XG5cbiAgICB0aGlzLmFkZChub2RlKTtcbiAgfVxuXG4gIHRvSFRNTCgpIHtcbiAgICBjb25zdCByZW5kZXJlciA9IG5ldyBIVE1MUmVuZGVyZXIodGhpcywgdGhpcy5vcHRpb25zKTtcbiAgICByZXR1cm4gcmVuZGVyZXIudmFsdWUoKTtcbiAgfVxuXG4gIGZpbmFsaXplKCkge1xuICAgIHRoaXMuY2xvc2VBbGxOb2RlcygpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gKiBAcmV0dXJucyB7UmVnRXhwfVxuICogKi9cblxuLyoqXG4gKiBAcGFyYW0ge1JlZ0V4cCB8IHN0cmluZyB9IHJlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBzb3VyY2UocmUpIHtcbiAgaWYgKCFyZSkgcmV0dXJuIG51bGw7XG4gIGlmICh0eXBlb2YgcmUgPT09IFwic3RyaW5nXCIpIHJldHVybiByZTtcblxuICByZXR1cm4gcmUuc291cmNlO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVnRXhwIHwgc3RyaW5nIH0gcmVcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGxvb2thaGVhZChyZSkge1xuICByZXR1cm4gY29uY2F0KCcoPz0nLCByZSwgJyknKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlZ0V4cCB8IHN0cmluZyB9IHJlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBhbnlOdW1iZXJPZlRpbWVzKHJlKSB7XG4gIHJldHVybiBjb25jYXQoJyg/OicsIHJlLCAnKSonKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlZ0V4cCB8IHN0cmluZyB9IHJlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBvcHRpb25hbChyZSkge1xuICByZXR1cm4gY29uY2F0KCcoPzonLCByZSwgJyk/Jyk7XG59XG5cbi8qKlxuICogQHBhcmFtIHsuLi4oUmVnRXhwIHwgc3RyaW5nKSB9IGFyZ3NcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGNvbmNhdCguLi5hcmdzKSB7XG4gIGNvbnN0IGpvaW5lZCA9IGFyZ3MubWFwKCh4KSA9PiBzb3VyY2UoeCkpLmpvaW4oXCJcIik7XG4gIHJldHVybiBqb2luZWQ7XG59XG5cbi8qKlxuICogQHBhcmFtIHsgQXJyYXk8c3RyaW5nIHwgUmVnRXhwIHwgT2JqZWN0PiB9IGFyZ3NcbiAqIEByZXR1cm5zIHtvYmplY3R9XG4gKi9cbmZ1bmN0aW9uIHN0cmlwT3B0aW9uc0Zyb21BcmdzKGFyZ3MpIHtcbiAgY29uc3Qgb3B0cyA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcblxuICBpZiAodHlwZW9mIG9wdHMgPT09ICdvYmplY3QnICYmIG9wdHMuY29uc3RydWN0b3IgPT09IE9iamVjdCkge1xuICAgIGFyZ3Muc3BsaWNlKGFyZ3MubGVuZ3RoIC0gMSwgMSk7XG4gICAgcmV0dXJuIG9wdHM7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG59XG5cbi8qKiBAdHlwZWRlZiB7IHtjYXB0dXJlPzogYm9vbGVhbn0gfSBSZWdleEVpdGhlck9wdGlvbnMgKi9cblxuLyoqXG4gKiBBbnkgb2YgdGhlIHBhc3NlZCBleHByZXNzc2lvbnMgbWF5IG1hdGNoXG4gKlxuICogQ3JlYXRlcyBhIGh1Z2UgdGhpcyB8IHRoaXMgfCB0aGF0IHwgdGhhdCBtYXRjaFxuICogQHBhcmFtIHsoUmVnRXhwIHwgc3RyaW5nKVtdIHwgWy4uLihSZWdFeHAgfCBzdHJpbmcpW10sIFJlZ2V4RWl0aGVyT3B0aW9uc119IGFyZ3NcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVpdGhlciguLi5hcmdzKSB7XG4gIC8qKiBAdHlwZSB7IG9iamVjdCAmIHtjYXB0dXJlPzogYm9vbGVhbn0gfSAgKi9cbiAgY29uc3Qgb3B0cyA9IHN0cmlwT3B0aW9uc0Zyb21BcmdzKGFyZ3MpO1xuICBjb25zdCBqb2luZWQgPSAnKCdcbiAgICArIChvcHRzLmNhcHR1cmUgPyBcIlwiIDogXCI/OlwiKVxuICAgICsgYXJncy5tYXAoKHgpID0+IHNvdXJjZSh4KSkuam9pbihcInxcIikgKyBcIilcIjtcbiAgcmV0dXJuIGpvaW5lZDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlZ0V4cCB8IHN0cmluZ30gcmVcbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIGNvdW50TWF0Y2hHcm91cHMocmUpIHtcbiAgcmV0dXJuIChuZXcgUmVnRXhwKHJlLnRvU3RyaW5nKCkgKyAnfCcpKS5leGVjKCcnKS5sZW5ndGggLSAxO1xufVxuXG4vKipcbiAqIERvZXMgbGV4ZW1lIHN0YXJ0IHdpdGggYSByZWd1bGFyIGV4cHJlc3Npb24gbWF0Y2ggYXQgdGhlIGJlZ2lubmluZ1xuICogQHBhcmFtIHtSZWdFeHB9IHJlXG4gKiBAcGFyYW0ge3N0cmluZ30gbGV4ZW1lXG4gKi9cbmZ1bmN0aW9uIHN0YXJ0c1dpdGgocmUsIGxleGVtZSkge1xuICBjb25zdCBtYXRjaCA9IHJlICYmIHJlLmV4ZWMobGV4ZW1lKTtcbiAgcmV0dXJuIG1hdGNoICYmIG1hdGNoLmluZGV4ID09PSAwO1xufVxuXG4vLyBCQUNLUkVGX1JFIG1hdGNoZXMgYW4gb3BlbiBwYXJlbnRoZXNpcyBvciBiYWNrcmVmZXJlbmNlLiBUbyBhdm9pZFxuLy8gYW4gaW5jb3JyZWN0IHBhcnNlLCBpdCBhZGRpdGlvbmFsbHkgbWF0Y2hlcyB0aGUgZm9sbG93aW5nOlxuLy8gLSBbLi4uXSBlbGVtZW50cywgd2hlcmUgdGhlIG1lYW5pbmcgb2YgcGFyZW50aGVzZXMgYW5kIGVzY2FwZXMgY2hhbmdlXG4vLyAtIG90aGVyIGVzY2FwZSBzZXF1ZW5jZXMsIHNvIHdlIGRvIG5vdCBtaXNwYXJzZSBlc2NhcGUgc2VxdWVuY2VzIGFzXG4vLyAgIGludGVyZXN0aW5nIGVsZW1lbnRzXG4vLyAtIG5vbi1tYXRjaGluZyBvciBsb29rYWhlYWQgcGFyZW50aGVzZXMsIHdoaWNoIGRvIG5vdCBjYXB0dXJlLiBUaGVzZVxuLy8gICBmb2xsb3cgdGhlICcoJyB3aXRoIGEgJz8nLlxuY29uc3QgQkFDS1JFRl9SRSA9IC9cXFsoPzpbXlxcXFxcXF1dfFxcXFwuKSpcXF18XFwoXFw/P3xcXFxcKFsxLTldWzAtOV0qKXxcXFxcLi87XG5cbi8vICoqSU5URVJOQUwqKiBOb3QgaW50ZW5kZWQgZm9yIG91dHNpZGUgdXNhZ2Vcbi8vIGpvaW4gbG9naWNhbGx5IGNvbXB1dGVzIHJlZ2V4cHMuam9pbihzZXBhcmF0b3IpLCBidXQgZml4ZXMgdGhlXG4vLyBiYWNrcmVmZXJlbmNlcyBzbyB0aGV5IGNvbnRpbnVlIHRvIG1hdGNoLlxuLy8gaXQgYWxzbyBwbGFjZXMgZWFjaCBpbmRpdmlkdWFsIHJlZ3VsYXIgZXhwcmVzc2lvbiBpbnRvIGl0J3Mgb3duXG4vLyBtYXRjaCBncm91cCwga2VlcGluZyB0cmFjayBvZiB0aGUgc2VxdWVuY2luZyBvZiB0aG9zZSBtYXRjaCBncm91cHNcbi8vIGlzIGN1cnJlbnRseSBhbiBleGVyY2lzZSBmb3IgdGhlIGNhbGxlci4gOi0pXG4vKipcbiAqIEBwYXJhbSB7KHN0cmluZyB8IFJlZ0V4cClbXX0gcmVnZXhwc1xuICogQHBhcmFtIHt7am9pbldpdGg6IHN0cmluZ319IG9wdHNcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIF9yZXdyaXRlQmFja3JlZmVyZW5jZXMocmVnZXhwcywgeyBqb2luV2l0aCB9KSB7XG4gIGxldCBudW1DYXB0dXJlcyA9IDA7XG5cbiAgcmV0dXJuIHJlZ2V4cHMubWFwKChyZWdleCkgPT4ge1xuICAgIG51bUNhcHR1cmVzICs9IDE7XG4gICAgY29uc3Qgb2Zmc2V0ID0gbnVtQ2FwdHVyZXM7XG4gICAgbGV0IHJlID0gc291cmNlKHJlZ2V4KTtcbiAgICBsZXQgb3V0ID0gJyc7XG5cbiAgICB3aGlsZSAocmUubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgbWF0Y2ggPSBCQUNLUkVGX1JFLmV4ZWMocmUpO1xuICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICBvdXQgKz0gcmU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgb3V0ICs9IHJlLnN1YnN0cmluZygwLCBtYXRjaC5pbmRleCk7XG4gICAgICByZSA9IHJlLnN1YnN0cmluZyhtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aCk7XG4gICAgICBpZiAobWF0Y2hbMF1bMF0gPT09ICdcXFxcJyAmJiBtYXRjaFsxXSkge1xuICAgICAgICAvLyBBZGp1c3QgdGhlIGJhY2tyZWZlcmVuY2UuXG4gICAgICAgIG91dCArPSAnXFxcXCcgKyBTdHJpbmcoTnVtYmVyKG1hdGNoWzFdKSArIG9mZnNldCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXQgKz0gbWF0Y2hbMF07XG4gICAgICAgIGlmIChtYXRjaFswXSA9PT0gJygnKSB7XG4gICAgICAgICAgbnVtQ2FwdHVyZXMrKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9KS5tYXAocmUgPT4gYCgke3JlfSlgKS5qb2luKGpvaW5XaXRoKTtcbn1cblxuLyoqIEB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLk1vZGV9IE1vZGUgKi9cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5Nb2RlQ2FsbGJhY2t9IE1vZGVDYWxsYmFjayAqL1xuXG4vLyBDb21tb24gcmVnZXhwc1xuY29uc3QgTUFUQ0hfTk9USElOR19SRSA9IC9cXGJcXEIvO1xuY29uc3QgSURFTlRfUkUgPSAnW2EtekEtWl1cXFxcdyonO1xuY29uc3QgVU5ERVJTQ09SRV9JREVOVF9SRSA9ICdbYS16QS1aX11cXFxcdyonO1xuY29uc3QgTlVNQkVSX1JFID0gJ1xcXFxiXFxcXGQrKFxcXFwuXFxcXGQrKT8nO1xuY29uc3QgQ19OVU1CRVJfUkUgPSAnKC0/KShcXFxcYjBbeFhdW2EtZkEtRjAtOV0rfChcXFxcYlxcXFxkKyhcXFxcLlxcXFxkKik/fFxcXFwuXFxcXGQrKShbZUVdWy0rXT9cXFxcZCspPyknOyAvLyAweC4uLiwgMC4uLiwgZGVjaW1hbCwgZmxvYXRcbmNvbnN0IEJJTkFSWV9OVU1CRVJfUkUgPSAnXFxcXGIoMGJbMDFdKyknOyAvLyAwYi4uLlxuY29uc3QgUkVfU1RBUlRFUlNfUkUgPSAnIXwhPXwhPT18JXwlPXwmfCYmfCY9fFxcXFwqfFxcXFwqPXxcXFxcK3xcXFxcKz18LHwtfC09fC89fC98Onw7fDw8fDw8PXw8PXw8fD09PXw9PXw9fD4+Pj18Pj49fD49fD4+Pnw+Pnw+fFxcXFw/fFxcXFxbfFxcXFx7fFxcXFwofFxcXFxefFxcXFxePXxcXFxcfHxcXFxcfD18XFxcXHxcXFxcfHx+JztcblxuLyoqXG4qIEBwYXJhbSB7IFBhcnRpYWw8TW9kZT4gJiB7YmluYXJ5Pzogc3RyaW5nIHwgUmVnRXhwfSB9IG9wdHNcbiovXG5jb25zdCBTSEVCQU5HID0gKG9wdHMgPSB7fSkgPT4ge1xuICBjb25zdCBiZWdpblNoZWJhbmcgPSAvXiMhWyBdKlxcLy87XG4gIGlmIChvcHRzLmJpbmFyeSkge1xuICAgIG9wdHMuYmVnaW4gPSBjb25jYXQoXG4gICAgICBiZWdpblNoZWJhbmcsXG4gICAgICAvLipcXGIvLFxuICAgICAgb3B0cy5iaW5hcnksXG4gICAgICAvXFxiLiovKTtcbiAgfVxuICByZXR1cm4gaW5oZXJpdCQxKHtcbiAgICBzY29wZTogJ21ldGEnLFxuICAgIGJlZ2luOiBiZWdpblNoZWJhbmcsXG4gICAgZW5kOiAvJC8sXG4gICAgcmVsZXZhbmNlOiAwLFxuICAgIC8qKiBAdHlwZSB7TW9kZUNhbGxiYWNrfSAqL1xuICAgIFwib246YmVnaW5cIjogKG0sIHJlc3ApID0+IHtcbiAgICAgIGlmIChtLmluZGV4ICE9PSAwKSByZXNwLmlnbm9yZU1hdGNoKCk7XG4gICAgfVxuICB9LCBvcHRzKTtcbn07XG5cbi8vIENvbW1vbiBtb2Rlc1xuY29uc3QgQkFDS1NMQVNIX0VTQ0FQRSA9IHtcbiAgYmVnaW46ICdcXFxcXFxcXFtcXFxcc1xcXFxTXScsIHJlbGV2YW5jZTogMFxufTtcbmNvbnN0IEFQT1NfU1RSSU5HX01PREUgPSB7XG4gIHNjb3BlOiAnc3RyaW5nJyxcbiAgYmVnaW46ICdcXCcnLFxuICBlbmQ6ICdcXCcnLFxuICBpbGxlZ2FsOiAnXFxcXG4nLFxuICBjb250YWluczogW0JBQ0tTTEFTSF9FU0NBUEVdXG59O1xuY29uc3QgUVVPVEVfU1RSSU5HX01PREUgPSB7XG4gIHNjb3BlOiAnc3RyaW5nJyxcbiAgYmVnaW46ICdcIicsXG4gIGVuZDogJ1wiJyxcbiAgaWxsZWdhbDogJ1xcXFxuJyxcbiAgY29udGFpbnM6IFtCQUNLU0xBU0hfRVNDQVBFXVxufTtcbmNvbnN0IFBIUkFTQUxfV09SRFNfTU9ERSA9IHtcbiAgYmVnaW46IC9cXGIoYXxhbnx0aGV8YXJlfEknbXxpc24ndHxkb24ndHxkb2Vzbid0fHdvbid0fGJ1dHxqdXN0fHNob3VsZHxwcmV0dHl8c2ltcGx5fGVub3VnaHxnb25uYXxnb2luZ3x3dGZ8c298c3VjaHx3aWxsfHlvdXx5b3VyfHRoZXl8bGlrZXxtb3JlKVxcYi9cbn07XG4vKipcbiAqIENyZWF0ZXMgYSBjb21tZW50IG1vZGVcbiAqXG4gKiBAcGFyYW0ge3N0cmluZyB8IFJlZ0V4cH0gYmVnaW5cbiAqIEBwYXJhbSB7c3RyaW5nIHwgUmVnRXhwfSBlbmRcbiAqIEBwYXJhbSB7TW9kZSB8IHt9fSBbbW9kZU9wdGlvbnNdXG4gKiBAcmV0dXJucyB7UGFydGlhbDxNb2RlPn1cbiAqL1xuY29uc3QgQ09NTUVOVCA9IGZ1bmN0aW9uKGJlZ2luLCBlbmQsIG1vZGVPcHRpb25zID0ge30pIHtcbiAgY29uc3QgbW9kZSA9IGluaGVyaXQkMShcbiAgICB7XG4gICAgICBzY29wZTogJ2NvbW1lbnQnLFxuICAgICAgYmVnaW4sXG4gICAgICBlbmQsXG4gICAgICBjb250YWluczogW11cbiAgICB9LFxuICAgIG1vZGVPcHRpb25zXG4gICk7XG4gIG1vZGUuY29udGFpbnMucHVzaCh7XG4gICAgc2NvcGU6ICdkb2N0YWcnLFxuICAgIC8vIGhhY2sgdG8gYXZvaWQgdGhlIHNwYWNlIGZyb20gYmVpbmcgaW5jbHVkZWQuIHRoZSBzcGFjZSBpcyBuZWNlc3NhcnkgdG9cbiAgICAvLyBtYXRjaCBoZXJlIHRvIHByZXZlbnQgdGhlIHBsYWluIHRleHQgcnVsZSBiZWxvdyBmcm9tIGdvYmJsaW5nIHVwIGRvY3RhZ3NcbiAgICBiZWdpbjogJ1sgXSooPz0oVE9ET3xGSVhNRXxOT1RFfEJVR3xPUFRJTUlaRXxIQUNLfFhYWCk6KScsXG4gICAgZW5kOiAvKFRPRE98RklYTUV8Tk9URXxCVUd8T1BUSU1JWkV8SEFDS3xYWFgpOi8sXG4gICAgZXhjbHVkZUJlZ2luOiB0cnVlLFxuICAgIHJlbGV2YW5jZTogMFxuICB9KTtcbiAgY29uc3QgRU5HTElTSF9XT1JEID0gZWl0aGVyKFxuICAgIC8vIGxpc3Qgb2YgY29tbW9uIDEgYW5kIDIgbGV0dGVyIHdvcmRzIGluIEVuZ2xpc2hcbiAgICBcIklcIixcbiAgICBcImFcIixcbiAgICBcImlzXCIsXG4gICAgXCJzb1wiLFxuICAgIFwidXNcIixcbiAgICBcInRvXCIsXG4gICAgXCJhdFwiLFxuICAgIFwiaWZcIixcbiAgICBcImluXCIsXG4gICAgXCJpdFwiLFxuICAgIFwib25cIixcbiAgICAvLyBub3RlOiB0aGlzIGlzIG5vdCBhbiBleGhhdXN0aXZlIGxpc3Qgb2YgY29udHJhY3Rpb25zLCBqdXN0IHBvcHVsYXIgb25lc1xuICAgIC9bQS1aYS16XStbJ10oZHx2ZXxyZXxsbHx0fHN8bikvLCAvLyBjb250cmFjdGlvbnMgLSBjYW4ndCB3ZSdkIHRoZXkncmUgbGV0J3MsIGV0Y1xuICAgIC9bQS1aYS16XStbLV1bYS16XSsvLCAvLyBgbm8td2F5YCwgZXRjLlxuICAgIC9bQS1aYS16XVthLXpdezIsfS8gLy8gYWxsb3cgY2FwaXRhbGl6ZWQgd29yZHMgYXQgYmVnaW5uaW5nIG9mIHNlbnRlbmNlc1xuICApO1xuICAvLyBsb29raW5nIGxpa2UgcGxhaW4gdGV4dCwgbW9yZSBsaWtlbHkgdG8gYmUgYSBjb21tZW50XG4gIG1vZGUuY29udGFpbnMucHVzaChcbiAgICB7XG4gICAgICAvLyBUT0RPOiBob3cgdG8gaW5jbHVkZSBcIiwgKCwgKSB3aXRob3V0IGJyZWFraW5nIGdyYW1tYXJzIHRoYXQgdXNlIHRoZXNlIGZvclxuICAgICAgLy8gY29tbWVudCBkZWxpbWl0ZXJzP1xuICAgICAgLy8gYmVnaW46IC9bIF0rKFsoKVwiXT8oW0EtWmEteictXXszLH18aXN8YXxJfHNvfHVzfFt0VF1bb09dfGF0fGlmfGlufGl0fG9uKVsuXT9bKClcIjpdPyhbLl1bIF18WyBdfFxcKSkpezN9L1xuICAgICAgLy8gLS0tXG5cbiAgICAgIC8vIHRoaXMgdHJpZXMgdG8gZmluZCBzZXF1ZW5jZXMgb2YgMyBlbmdsaXNoIHdvcmRzIGluIGEgcm93ICh3aXRob3V0IGFueVxuICAgICAgLy8gXCJwcm9ncmFtbWluZ1wiIHR5cGUgc3ludGF4KSB0aGlzIGdpdmVzIHVzIGEgc3Ryb25nIHNpZ25hbCB0aGF0IHdlJ3ZlXG4gICAgICAvLyBUUlVMWSBmb3VuZCBhIGNvbW1lbnQgLSB2cyBwZXJoYXBzIHNjYW5uaW5nIHdpdGggdGhlIHdyb25nIGxhbmd1YWdlLlxuICAgICAgLy8gSXQncyBwb3NzaWJsZSB0byBmaW5kIHNvbWV0aGluZyB0aGF0IExPT0tTIGxpa2UgdGhlIHN0YXJ0IG9mIHRoZVxuICAgICAgLy8gY29tbWVudCAtIGJ1dCB0aGVuIGlmIHRoZXJlIGlzIG5vIHJlYWRhYmxlIHRleHQgLSBnb29kIGNoYW5jZSBpdCBpcyBhXG4gICAgICAvLyBmYWxzZSBtYXRjaCBhbmQgbm90IGEgY29tbWVudC5cbiAgICAgIC8vXG4gICAgICAvLyBmb3IgYSB2aXN1YWwgZXhhbXBsZSBwbGVhc2Ugc2VlOlxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2hpZ2hsaWdodGpzL2hpZ2hsaWdodC5qcy9pc3N1ZXMvMjgyN1xuXG4gICAgICBiZWdpbjogY29uY2F0KFxuICAgICAgICAvWyBdKy8sIC8vIG5lY2Vzc2FyeSB0byBwcmV2ZW50IHVzIGdvYmJsaW5nIHVwIGRvY3RhZ3MgbGlrZSAvKiBAYXV0aG9yIEJvYiBNY2dpbGwgKi9cbiAgICAgICAgJygnLFxuICAgICAgICBFTkdMSVNIX1dPUkQsXG4gICAgICAgIC9bLl0/WzpdPyhbLl1bIF18WyBdKS8sXG4gICAgICAgICcpezN9JykgLy8gbG9vayBmb3IgMyB3b3JkcyBpbiBhIHJvd1xuICAgIH1cbiAgKTtcbiAgcmV0dXJuIG1vZGU7XG59O1xuY29uc3QgQ19MSU5FX0NPTU1FTlRfTU9ERSA9IENPTU1FTlQoJy8vJywgJyQnKTtcbmNvbnN0IENfQkxPQ0tfQ09NTUVOVF9NT0RFID0gQ09NTUVOVCgnL1xcXFwqJywgJ1xcXFwqLycpO1xuY29uc3QgSEFTSF9DT01NRU5UX01PREUgPSBDT01NRU5UKCcjJywgJyQnKTtcbmNvbnN0IE5VTUJFUl9NT0RFID0ge1xuICBzY29wZTogJ251bWJlcicsXG4gIGJlZ2luOiBOVU1CRVJfUkUsXG4gIHJlbGV2YW5jZTogMFxufTtcbmNvbnN0IENfTlVNQkVSX01PREUgPSB7XG4gIHNjb3BlOiAnbnVtYmVyJyxcbiAgYmVnaW46IENfTlVNQkVSX1JFLFxuICByZWxldmFuY2U6IDBcbn07XG5jb25zdCBCSU5BUllfTlVNQkVSX01PREUgPSB7XG4gIHNjb3BlOiAnbnVtYmVyJyxcbiAgYmVnaW46IEJJTkFSWV9OVU1CRVJfUkUsXG4gIHJlbGV2YW5jZTogMFxufTtcbmNvbnN0IFJFR0VYUF9NT0RFID0ge1xuICBzY29wZTogXCJyZWdleHBcIixcbiAgYmVnaW46IC9cXC8oPz1bXi9cXG5dKlxcLykvLFxuICBlbmQ6IC9cXC9bZ2ltdXldKi8sXG4gIGNvbnRhaW5zOiBbXG4gICAgQkFDS1NMQVNIX0VTQ0FQRSxcbiAgICB7XG4gICAgICBiZWdpbjogL1xcWy8sXG4gICAgICBlbmQ6IC9cXF0vLFxuICAgICAgcmVsZXZhbmNlOiAwLFxuICAgICAgY29udGFpbnM6IFtCQUNLU0xBU0hfRVNDQVBFXVxuICAgIH1cbiAgXVxufTtcbmNvbnN0IFRJVExFX01PREUgPSB7XG4gIHNjb3BlOiAndGl0bGUnLFxuICBiZWdpbjogSURFTlRfUkUsXG4gIHJlbGV2YW5jZTogMFxufTtcbmNvbnN0IFVOREVSU0NPUkVfVElUTEVfTU9ERSA9IHtcbiAgc2NvcGU6ICd0aXRsZScsXG4gIGJlZ2luOiBVTkRFUlNDT1JFX0lERU5UX1JFLFxuICByZWxldmFuY2U6IDBcbn07XG5jb25zdCBNRVRIT0RfR1VBUkQgPSB7XG4gIC8vIGV4Y2x1ZGVzIG1ldGhvZCBuYW1lcyBmcm9tIGtleXdvcmQgcHJvY2Vzc2luZ1xuICBiZWdpbjogJ1xcXFwuXFxcXHMqJyArIFVOREVSU0NPUkVfSURFTlRfUkUsXG4gIHJlbGV2YW5jZTogMFxufTtcblxuLyoqXG4gKiBBZGRzIGVuZCBzYW1lIGFzIGJlZ2luIG1lY2hhbmljcyB0byBhIG1vZGVcbiAqXG4gKiBZb3VyIG1vZGUgbXVzdCBpbmNsdWRlIGF0IGxlYXN0IGEgc2luZ2xlICgpIG1hdGNoIGdyb3VwIGFzIHRoYXQgZmlyc3QgbWF0Y2hcbiAqIGdyb3VwIGlzIHdoYXQgaXMgdXNlZCBmb3IgY29tcGFyaXNvblxuICogQHBhcmFtIHtQYXJ0aWFsPE1vZGU+fSBtb2RlXG4gKi9cbmNvbnN0IEVORF9TQU1FX0FTX0JFR0lOID0gZnVuY3Rpb24obW9kZSkge1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbihtb2RlLFxuICAgIHtcbiAgICAgIC8qKiBAdHlwZSB7TW9kZUNhbGxiYWNrfSAqL1xuICAgICAgJ29uOmJlZ2luJzogKG0sIHJlc3ApID0+IHsgcmVzcC5kYXRhLl9iZWdpbk1hdGNoID0gbVsxXTsgfSxcbiAgICAgIC8qKiBAdHlwZSB7TW9kZUNhbGxiYWNrfSAqL1xuICAgICAgJ29uOmVuZCc6IChtLCByZXNwKSA9PiB7IGlmIChyZXNwLmRhdGEuX2JlZ2luTWF0Y2ggIT09IG1bMV0pIHJlc3AuaWdub3JlTWF0Y2goKTsgfVxuICAgIH0pO1xufTtcblxudmFyIE1PREVTID0gLyojX19QVVJFX18qL09iamVjdC5mcmVlemUoe1xuICBfX3Byb3RvX186IG51bGwsXG4gIEFQT1NfU1RSSU5HX01PREU6IEFQT1NfU1RSSU5HX01PREUsXG4gIEJBQ0tTTEFTSF9FU0NBUEU6IEJBQ0tTTEFTSF9FU0NBUEUsXG4gIEJJTkFSWV9OVU1CRVJfTU9ERTogQklOQVJZX05VTUJFUl9NT0RFLFxuICBCSU5BUllfTlVNQkVSX1JFOiBCSU5BUllfTlVNQkVSX1JFLFxuICBDT01NRU5UOiBDT01NRU5ULFxuICBDX0JMT0NLX0NPTU1FTlRfTU9ERTogQ19CTE9DS19DT01NRU5UX01PREUsXG4gIENfTElORV9DT01NRU5UX01PREU6IENfTElORV9DT01NRU5UX01PREUsXG4gIENfTlVNQkVSX01PREU6IENfTlVNQkVSX01PREUsXG4gIENfTlVNQkVSX1JFOiBDX05VTUJFUl9SRSxcbiAgRU5EX1NBTUVfQVNfQkVHSU46IEVORF9TQU1FX0FTX0JFR0lOLFxuICBIQVNIX0NPTU1FTlRfTU9ERTogSEFTSF9DT01NRU5UX01PREUsXG4gIElERU5UX1JFOiBJREVOVF9SRSxcbiAgTUFUQ0hfTk9USElOR19SRTogTUFUQ0hfTk9USElOR19SRSxcbiAgTUVUSE9EX0dVQVJEOiBNRVRIT0RfR1VBUkQsXG4gIE5VTUJFUl9NT0RFOiBOVU1CRVJfTU9ERSxcbiAgTlVNQkVSX1JFOiBOVU1CRVJfUkUsXG4gIFBIUkFTQUxfV09SRFNfTU9ERTogUEhSQVNBTF9XT1JEU19NT0RFLFxuICBRVU9URV9TVFJJTkdfTU9ERTogUVVPVEVfU1RSSU5HX01PREUsXG4gIFJFR0VYUF9NT0RFOiBSRUdFWFBfTU9ERSxcbiAgUkVfU1RBUlRFUlNfUkU6IFJFX1NUQVJURVJTX1JFLFxuICBTSEVCQU5HOiBTSEVCQU5HLFxuICBUSVRMRV9NT0RFOiBUSVRMRV9NT0RFLFxuICBVTkRFUlNDT1JFX0lERU5UX1JFOiBVTkRFUlNDT1JFX0lERU5UX1JFLFxuICBVTkRFUlNDT1JFX1RJVExFX01PREU6IFVOREVSU0NPUkVfVElUTEVfTU9ERVxufSk7XG5cbi8qKlxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQ2FsbGJhY2tSZXNwb25zZX0gQ2FsbGJhY2tSZXNwb25zZVxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQ29tcGlsZXJFeHR9IENvbXBpbGVyRXh0XG4qL1xuXG4vLyBHcmFtbWFyIGV4dGVuc2lvbnMgLyBwbHVnaW5zXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9oaWdobGlnaHRqcy9oaWdobGlnaHQuanMvaXNzdWVzLzI4MzNcblxuLy8gR3JhbW1hciBleHRlbnNpb25zIGFsbG93IFwic3ludGFjdGljIHN1Z2FyXCIgdG8gYmUgYWRkZWQgdG8gdGhlIGdyYW1tYXIgbW9kZXNcbi8vIHdpdGhvdXQgcmVxdWlyaW5nIGFueSB1bmRlcmx5aW5nIGNoYW5nZXMgdG8gdGhlIGNvbXBpbGVyIGludGVybmFscy5cblxuLy8gYGNvbXBpbGVNYXRjaGAgYmVpbmcgdGhlIHBlcmZlY3Qgc21hbGwgZXhhbXBsZSBvZiBub3cgYWxsb3dpbmcgYSBncmFtbWFyXG4vLyBhdXRob3IgdG8gd3JpdGUgYG1hdGNoYCB3aGVuIHRoZXkgZGVzaXJlIHRvIG1hdGNoIGEgc2luZ2xlIGV4cHJlc3Npb24gcmF0aGVyXG4vLyB0aGFuIGJlaW5nIGZvcmNlZCB0byB1c2UgYGJlZ2luYC4gIFRoZSBleHRlbnNpb24gdGhlbiBqdXN0IG1vdmVzIGBtYXRjaGAgaW50b1xuLy8gYGJlZ2luYCB3aGVuIGl0IHJ1bnMuICBJZSwgbm8gZmVhdHVyZXMgaGF2ZSBiZWVuIGFkZGVkLCBidXQgd2UndmUganVzdCBtYWRlXG4vLyB0aGUgZXhwZXJpZW5jZSBvZiB3cml0aW5nIChhbmQgcmVhZGluZyBncmFtbWFycykgYSBsaXR0bGUgYml0IG5pY2VyLlxuXG4vLyAtLS0tLS1cblxuLy8gVE9ETzogV2UgbmVlZCBuZWdhdGl2ZSBsb29rLWJlaGluZCBzdXBwb3J0IHRvIGRvIHRoaXMgcHJvcGVybHlcbi8qKlxuICogU2tpcCBhIG1hdGNoIGlmIGl0IGhhcyBhIHByZWNlZGluZyBkb3RcbiAqXG4gKiBUaGlzIGlzIHVzZWQgZm9yIGBiZWdpbktleXdvcmRzYCB0byBwcmV2ZW50IG1hdGNoaW5nIGV4cHJlc3Npb25zIHN1Y2ggYXNcbiAqIGBib2Iua2V5d29yZC5kbygpYC4gVGhlIG1vZGUgY29tcGlsZXIgYXV0b21hdGljYWxseSB3aXJlcyB0aGlzIHVwIGFzIGFcbiAqIHNwZWNpYWwgX2ludGVybmFsXyAnb246YmVnaW4nIGNhbGxiYWNrIGZvciBtb2RlcyB3aXRoIGBiZWdpbktleXdvcmRzYFxuICogQHBhcmFtIHtSZWdFeHBNYXRjaEFycmF5fSBtYXRjaFxuICogQHBhcmFtIHtDYWxsYmFja1Jlc3BvbnNlfSByZXNwb25zZVxuICovXG5mdW5jdGlvbiBza2lwSWZIYXNQcmVjZWRpbmdEb3QobWF0Y2gsIHJlc3BvbnNlKSB7XG4gIGNvbnN0IGJlZm9yZSA9IG1hdGNoLmlucHV0W21hdGNoLmluZGV4IC0gMV07XG4gIGlmIChiZWZvcmUgPT09IFwiLlwiKSB7XG4gICAgcmVzcG9uc2UuaWdub3JlTWF0Y2goKTtcbiAgfVxufVxuXG4vKipcbiAqXG4gKiBAdHlwZSB7Q29tcGlsZXJFeHR9XG4gKi9cbmZ1bmN0aW9uIHNjb3BlQ2xhc3NOYW1lKG1vZGUsIF9wYXJlbnQpIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmaW5lZFxuICBpZiAobW9kZS5jbGFzc05hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgIG1vZGUuc2NvcGUgPSBtb2RlLmNsYXNzTmFtZTtcbiAgICBkZWxldGUgbW9kZS5jbGFzc05hbWU7XG4gIH1cbn1cblxuLyoqXG4gKiBgYmVnaW5LZXl3b3Jkc2Agc3ludGFjdGljIHN1Z2FyXG4gKiBAdHlwZSB7Q29tcGlsZXJFeHR9XG4gKi9cbmZ1bmN0aW9uIGJlZ2luS2V5d29yZHMobW9kZSwgcGFyZW50KSB7XG4gIGlmICghcGFyZW50KSByZXR1cm47XG4gIGlmICghbW9kZS5iZWdpbktleXdvcmRzKSByZXR1cm47XG5cbiAgLy8gZm9yIGxhbmd1YWdlcyB3aXRoIGtleXdvcmRzIHRoYXQgaW5jbHVkZSBub24td29yZCBjaGFyYWN0ZXJzIGNoZWNraW5nIGZvclxuICAvLyBhIHdvcmQgYm91bmRhcnkgaXMgbm90IHN1ZmZpY2llbnQsIHNvIGluc3RlYWQgd2UgY2hlY2sgZm9yIGEgd29yZCBib3VuZGFyeVxuICAvLyBvciB3aGl0ZXNwYWNlIC0gdGhpcyBkb2VzIG5vIGhhcm0gaW4gYW55IGNhc2Ugc2luY2Ugb3VyIGtleXdvcmQgZW5naW5lXG4gIC8vIGRvZXNuJ3QgYWxsb3cgc3BhY2VzIGluIGtleXdvcmRzIGFueXdheXMgYW5kIHdlIHN0aWxsIGNoZWNrIGZvciB0aGUgYm91bmRhcnlcbiAgLy8gZmlyc3RcbiAgbW9kZS5iZWdpbiA9ICdcXFxcYignICsgbW9kZS5iZWdpbktleXdvcmRzLnNwbGl0KCcgJykuam9pbignfCcpICsgJykoPyFcXFxcLikoPz1cXFxcYnxcXFxccyknO1xuICBtb2RlLl9fYmVmb3JlQmVnaW4gPSBza2lwSWZIYXNQcmVjZWRpbmdEb3Q7XG4gIG1vZGUua2V5d29yZHMgPSBtb2RlLmtleXdvcmRzIHx8IG1vZGUuYmVnaW5LZXl3b3JkcztcbiAgZGVsZXRlIG1vZGUuYmVnaW5LZXl3b3JkcztcblxuICAvLyBwcmV2ZW50cyBkb3VibGUgcmVsZXZhbmNlLCB0aGUga2V5d29yZHMgdGhlbXNlbHZlcyBwcm92aWRlXG4gIC8vIHJlbGV2YW5jZSwgdGhlIG1vZGUgZG9lc24ndCBuZWVkIHRvIGRvdWJsZSBpdFxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZpbmVkXG4gIGlmIChtb2RlLnJlbGV2YW5jZSA9PT0gdW5kZWZpbmVkKSBtb2RlLnJlbGV2YW5jZSA9IDA7XG59XG5cbi8qKlxuICogQWxsb3cgYGlsbGVnYWxgIHRvIGNvbnRhaW4gYW4gYXJyYXkgb2YgaWxsZWdhbCB2YWx1ZXNcbiAqIEB0eXBlIHtDb21waWxlckV4dH1cbiAqL1xuZnVuY3Rpb24gY29tcGlsZUlsbGVnYWwobW9kZSwgX3BhcmVudCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobW9kZS5pbGxlZ2FsKSkgcmV0dXJuO1xuXG4gIG1vZGUuaWxsZWdhbCA9IGVpdGhlciguLi5tb2RlLmlsbGVnYWwpO1xufVxuXG4vKipcbiAqIGBtYXRjaGAgdG8gbWF0Y2ggYSBzaW5nbGUgZXhwcmVzc2lvbiBmb3IgcmVhZGFiaWxpdHlcbiAqIEB0eXBlIHtDb21waWxlckV4dH1cbiAqL1xuZnVuY3Rpb24gY29tcGlsZU1hdGNoKG1vZGUsIF9wYXJlbnQpIHtcbiAgaWYgKCFtb2RlLm1hdGNoKSByZXR1cm47XG4gIGlmIChtb2RlLmJlZ2luIHx8IG1vZGUuZW5kKSB0aHJvdyBuZXcgRXJyb3IoXCJiZWdpbiAmIGVuZCBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIG1hdGNoXCIpO1xuXG4gIG1vZGUuYmVnaW4gPSBtb2RlLm1hdGNoO1xuICBkZWxldGUgbW9kZS5tYXRjaDtcbn1cblxuLyoqXG4gKiBwcm92aWRlcyB0aGUgZGVmYXVsdCAxIHJlbGV2YW5jZSB0byBhbGwgbW9kZXNcbiAqIEB0eXBlIHtDb21waWxlckV4dH1cbiAqL1xuZnVuY3Rpb24gY29tcGlsZVJlbGV2YW5jZShtb2RlLCBfcGFyZW50KSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZmluZWRcbiAgaWYgKG1vZGUucmVsZXZhbmNlID09PSB1bmRlZmluZWQpIG1vZGUucmVsZXZhbmNlID0gMTtcbn1cblxuLy8gYWxsb3cgYmVmb3JlTWF0Y2ggdG8gYWN0IGFzIGEgXCJxdWFsaWZpZXJcIiBmb3IgdGhlIG1hdGNoXG4vLyB0aGUgZnVsbCBtYXRjaCBiZWdpbiBtdXN0IGJlIFtiZWZvcmVNYXRjaF1bYmVnaW5dXG5jb25zdCBiZWZvcmVNYXRjaEV4dCA9IChtb2RlLCBwYXJlbnQpID0+IHtcbiAgaWYgKCFtb2RlLmJlZm9yZU1hdGNoKSByZXR1cm47XG4gIC8vIHN0YXJ0cyBjb25mbGljdHMgd2l0aCBlbmRzUGFyZW50IHdoaWNoIHdlIG5lZWQgdG8gbWFrZSBzdXJlIHRoZSBjaGlsZFxuICAvLyBydWxlIGlzIG5vdCBtYXRjaGVkIG11bHRpcGxlIHRpbWVzXG4gIGlmIChtb2RlLnN0YXJ0cykgdGhyb3cgbmV3IEVycm9yKFwiYmVmb3JlTWF0Y2ggY2Fubm90IGJlIHVzZWQgd2l0aCBzdGFydHNcIik7XG5cbiAgY29uc3Qgb3JpZ2luYWxNb2RlID0gT2JqZWN0LmFzc2lnbih7fSwgbW9kZSk7XG4gIE9iamVjdC5rZXlzKG1vZGUpLmZvckVhY2goKGtleSkgPT4geyBkZWxldGUgbW9kZVtrZXldOyB9KTtcblxuICBtb2RlLmtleXdvcmRzID0gb3JpZ2luYWxNb2RlLmtleXdvcmRzO1xuICBtb2RlLmJlZ2luID0gY29uY2F0KG9yaWdpbmFsTW9kZS5iZWZvcmVNYXRjaCwgbG9va2FoZWFkKG9yaWdpbmFsTW9kZS5iZWdpbikpO1xuICBtb2RlLnN0YXJ0cyA9IHtcbiAgICByZWxldmFuY2U6IDAsXG4gICAgY29udGFpbnM6IFtcbiAgICAgIE9iamVjdC5hc3NpZ24ob3JpZ2luYWxNb2RlLCB7IGVuZHNQYXJlbnQ6IHRydWUgfSlcbiAgICBdXG4gIH07XG4gIG1vZGUucmVsZXZhbmNlID0gMDtcblxuICBkZWxldGUgb3JpZ2luYWxNb2RlLmJlZm9yZU1hdGNoO1xufTtcblxuLy8ga2V5d29yZHMgdGhhdCBzaG91bGQgaGF2ZSBubyBkZWZhdWx0IHJlbGV2YW5jZSB2YWx1ZVxuY29uc3QgQ09NTU9OX0tFWVdPUkRTID0gW1xuICAnb2YnLFxuICAnYW5kJyxcbiAgJ2ZvcicsXG4gICdpbicsXG4gICdub3QnLFxuICAnb3InLFxuICAnaWYnLFxuICAndGhlbicsXG4gICdwYXJlbnQnLCAvLyBjb21tb24gdmFyaWFibGUgbmFtZVxuICAnbGlzdCcsIC8vIGNvbW1vbiB2YXJpYWJsZSBuYW1lXG4gICd2YWx1ZScgLy8gY29tbW9uIHZhcmlhYmxlIG5hbWVcbl07XG5cbmNvbnN0IERFRkFVTFRfS0VZV09SRF9TQ09QRSA9IFwia2V5d29yZFwiO1xuXG4vKipcbiAqIEdpdmVuIHJhdyBrZXl3b3JkcyBmcm9tIGEgbGFuZ3VhZ2UgZGVmaW5pdGlvbiwgY29tcGlsZSB0aGVtLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nIHwgUmVjb3JkPHN0cmluZyxzdHJpbmd8c3RyaW5nW10+IHwgQXJyYXk8c3RyaW5nPn0gcmF3S2V5d29yZHNcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gY2FzZUluc2Vuc2l0aXZlXG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGVLZXl3b3JkcyhyYXdLZXl3b3JkcywgY2FzZUluc2Vuc2l0aXZlLCBzY29wZU5hbWUgPSBERUZBVUxUX0tFWVdPUkRfU0NPUEUpIHtcbiAgLyoqIEB0eXBlIHtpbXBvcnQoXCJoaWdobGlnaHQuanMvcHJpdmF0ZVwiKS5LZXl3b3JkRGljdH0gKi9cbiAgY29uc3QgY29tcGlsZWRLZXl3b3JkcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgLy8gaW5wdXQgY2FuIGJlIGEgc3RyaW5nIG9mIGtleXdvcmRzLCBhbiBhcnJheSBvZiBrZXl3b3Jkcywgb3IgYSBvYmplY3Qgd2l0aFxuICAvLyBuYW1lZCBrZXlzIHJlcHJlc2VudGluZyBzY29wZU5hbWUgKHdoaWNoIGNhbiB0aGVuIHBvaW50IHRvIGEgc3RyaW5nIG9yIGFycmF5KVxuICBpZiAodHlwZW9mIHJhd0tleXdvcmRzID09PSAnc3RyaW5nJykge1xuICAgIGNvbXBpbGVMaXN0KHNjb3BlTmFtZSwgcmF3S2V5d29yZHMuc3BsaXQoXCIgXCIpKTtcbiAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHJhd0tleXdvcmRzKSkge1xuICAgIGNvbXBpbGVMaXN0KHNjb3BlTmFtZSwgcmF3S2V5d29yZHMpO1xuICB9IGVsc2Uge1xuICAgIE9iamVjdC5rZXlzKHJhd0tleXdvcmRzKS5mb3JFYWNoKGZ1bmN0aW9uKHNjb3BlTmFtZSkge1xuICAgICAgLy8gY29sbGFwc2UgYWxsIG91ciBvYmplY3RzIGJhY2sgaW50byB0aGUgcGFyZW50IG9iamVjdFxuICAgICAgT2JqZWN0LmFzc2lnbihcbiAgICAgICAgY29tcGlsZWRLZXl3b3JkcyxcbiAgICAgICAgY29tcGlsZUtleXdvcmRzKHJhd0tleXdvcmRzW3Njb3BlTmFtZV0sIGNhc2VJbnNlbnNpdGl2ZSwgc2NvcGVOYW1lKVxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gY29tcGlsZWRLZXl3b3JkcztcblxuICAvLyAtLS1cblxuICAvKipcbiAgICogQ29tcGlsZXMgYW4gaW5kaXZpZHVhbCBsaXN0IG9mIGtleXdvcmRzXG4gICAqXG4gICAqIEV4OiBcImZvciBpZiB3aGVuIHdoaWxlfDVcIlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2NvcGVOYW1lXG4gICAqIEBwYXJhbSB7QXJyYXk8c3RyaW5nPn0ga2V5d29yZExpc3RcbiAgICovXG4gIGZ1bmN0aW9uIGNvbXBpbGVMaXN0KHNjb3BlTmFtZSwga2V5d29yZExpc3QpIHtcbiAgICBpZiAoY2FzZUluc2Vuc2l0aXZlKSB7XG4gICAgICBrZXl3b3JkTGlzdCA9IGtleXdvcmRMaXN0Lm1hcCh4ID0+IHgudG9Mb3dlckNhc2UoKSk7XG4gICAgfVxuICAgIGtleXdvcmRMaXN0LmZvckVhY2goZnVuY3Rpb24oa2V5d29yZCkge1xuICAgICAgY29uc3QgcGFpciA9IGtleXdvcmQuc3BsaXQoJ3wnKTtcbiAgICAgIGNvbXBpbGVkS2V5d29yZHNbcGFpclswXV0gPSBbc2NvcGVOYW1lLCBzY29yZUZvcktleXdvcmQocGFpclswXSwgcGFpclsxXSldO1xuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgcHJvcGVyIHNjb3JlIGZvciBhIGdpdmVuIGtleXdvcmRcbiAqXG4gKiBBbHNvIHRha2VzIGludG8gYWNjb3VudCBjb21tZW50IGtleXdvcmRzLCB3aGljaCB3aWxsIGJlIHNjb3JlZCAwIFVOTEVTU1xuICogYW5vdGhlciBzY29yZSBoYXMgYmVlbiBtYW51YWxseSBhc3NpZ25lZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXl3b3JkXG4gKiBAcGFyYW0ge3N0cmluZ30gW3Byb3ZpZGVkU2NvcmVdXG4gKi9cbmZ1bmN0aW9uIHNjb3JlRm9yS2V5d29yZChrZXl3b3JkLCBwcm92aWRlZFNjb3JlKSB7XG4gIC8vIG1hbnVhbCBzY29yZXMgYWx3YXlzIHdpbiBvdmVyIGNvbW1vbiBrZXl3b3Jkc1xuICAvLyBzbyB5b3UgY2FuIGZvcmNlIGEgc2NvcmUgb2YgMSBpZiB5b3UgcmVhbGx5IGluc2lzdFxuICBpZiAocHJvdmlkZWRTY29yZSkge1xuICAgIHJldHVybiBOdW1iZXIocHJvdmlkZWRTY29yZSk7XG4gIH1cblxuICByZXR1cm4gY29tbW9uS2V5d29yZChrZXl3b3JkKSA/IDAgOiAxO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgYSBnaXZlbiBrZXl3b3JkIGlzIGNvbW1vbiBvciBub3RcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5d29yZCAqL1xuZnVuY3Rpb24gY29tbW9uS2V5d29yZChrZXl3b3JkKSB7XG4gIHJldHVybiBDT01NT05fS0VZV09SRFMuaW5jbHVkZXMoa2V5d29yZC50b0xvd2VyQ2FzZSgpKTtcbn1cblxuLypcblxuRm9yIHRoZSByZWFzb25pbmcgYmVoaW5kIHRoaXMgcGxlYXNlIHNlZTpcbmh0dHBzOi8vZ2l0aHViLmNvbS9oaWdobGlnaHRqcy9oaWdobGlnaHQuanMvaXNzdWVzLzI4ODAjaXNzdWVjb21tZW50LTc0NzI3NTQxOVxuXG4qL1xuXG4vKipcbiAqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCBib29sZWFuPn1cbiAqL1xuY29uc3Qgc2VlbkRlcHJlY2F0aW9ucyA9IHt9O1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gKi9cbmNvbnN0IGVycm9yID0gKG1lc3NhZ2UpID0+IHtcbiAgY29uc29sZS5lcnJvcihtZXNzYWdlKTtcbn07XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAqIEBwYXJhbSB7YW55fSBhcmdzXG4gKi9cbmNvbnN0IHdhcm4gPSAobWVzc2FnZSwgLi4uYXJncykgPT4ge1xuICBjb25zb2xlLmxvZyhgV0FSTjogJHttZXNzYWdlfWAsIC4uLmFyZ3MpO1xufTtcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmVyc2lvblxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAqL1xuY29uc3QgZGVwcmVjYXRlZCA9ICh2ZXJzaW9uLCBtZXNzYWdlKSA9PiB7XG4gIGlmIChzZWVuRGVwcmVjYXRpb25zW2Ake3ZlcnNpb259LyR7bWVzc2FnZX1gXSkgcmV0dXJuO1xuXG4gIGNvbnNvbGUubG9nKGBEZXByZWNhdGVkIGFzIG9mICR7dmVyc2lvbn0uICR7bWVzc2FnZX1gKTtcbiAgc2VlbkRlcHJlY2F0aW9uc1tgJHt2ZXJzaW9ufS8ke21lc3NhZ2V9YF0gPSB0cnVlO1xufTtcblxuLyogZXNsaW50LWRpc2FibGUgbm8tdGhyb3ctbGl0ZXJhbCAqL1xuXG4vKipcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLkNvbXBpbGVkTW9kZX0gQ29tcGlsZWRNb2RlXG4qL1xuXG5jb25zdCBNdWx0aUNsYXNzRXJyb3IgPSBuZXcgRXJyb3IoKTtcblxuLyoqXG4gKiBSZW51bWJlcnMgbGFiZWxlZCBzY29wZSBuYW1lcyB0byBhY2NvdW50IGZvciBhZGRpdGlvbmFsIGlubmVyIG1hdGNoXG4gKiBncm91cHMgdGhhdCBvdGhlcndpc2Ugd291bGQgYnJlYWsgZXZlcnl0aGluZy5cbiAqXG4gKiBMZXRzIHNheSB3ZSAzIG1hdGNoIHNjb3BlczpcbiAqXG4gKiAgIHsgMSA9PiAuLi4sIDIgPT4gLi4uLCAzID0+IC4uLiB9XG4gKlxuICogU28gd2hhdCB3ZSBuZWVkIGlzIGEgY2xlYW4gbWF0Y2ggbGlrZSB0aGlzOlxuICpcbiAqICAgKGEpKGIpKGMpID0+IFsgXCJhXCIsIFwiYlwiLCBcImNcIiBdXG4gKlxuICogQnV0IHRoaXMgZmFsbHMgYXBhcnQgd2l0aCBpbm5lciBtYXRjaCBncm91cHM6XG4gKlxuICogKGEpKCgoYikpKShjKSA9PiBbXCJhXCIsIFwiYlwiLCBcImJcIiwgXCJiXCIsIFwiY1wiIF1cbiAqXG4gKiBPdXIgc2NvcGVzIGFyZSBub3cgXCJvdXQgb2YgYWxpZ25tZW50XCIgYW5kIHdlJ3JlIHJlcGVhdGluZyBgYmAgMyB0aW1lcy5cbiAqIFdoYXQgbmVlZHMgdG8gaGFwcGVuIGlzIHRoZSBudW1iZXJzIGFyZSByZW1hcHBlZDpcbiAqXG4gKiAgIHsgMSA9PiAuLi4sIDIgPT4gLi4uLCA1ID0+IC4uLiB9XG4gKlxuICogV2UgYWxzbyBuZWVkIHRvIGtub3cgdGhhdCB0aGUgT05MWSBncm91cHMgdGhhdCBzaG91bGQgYmUgb3V0cHV0XG4gKiBhcmUgMSwgMiwgYW5kIDUuICBUaGlzIGZ1bmN0aW9uIGhhbmRsZXMgdGhpcyBiZWhhdmlvci5cbiAqXG4gKiBAcGFyYW0ge0NvbXBpbGVkTW9kZX0gbW9kZVxuICogQHBhcmFtIHtBcnJheTxSZWdFeHAgfCBzdHJpbmc+fSByZWdleGVzXG4gKiBAcGFyYW0ge3trZXk6IFwiYmVnaW5TY29wZVwifFwiZW5kU2NvcGVcIn19IG9wdHNcbiAqL1xuZnVuY3Rpb24gcmVtYXBTY29wZU5hbWVzKG1vZGUsIHJlZ2V4ZXMsIHsga2V5IH0pIHtcbiAgbGV0IG9mZnNldCA9IDA7XG4gIGNvbnN0IHNjb3BlTmFtZXMgPSBtb2RlW2tleV07XG4gIC8qKiBAdHlwZSBSZWNvcmQ8bnVtYmVyLGJvb2xlYW4+ICovXG4gIGNvbnN0IGVtaXQgPSB7fTtcbiAgLyoqIEB0eXBlIFJlY29yZDxudW1iZXIsc3RyaW5nPiAqL1xuICBjb25zdCBwb3NpdGlvbnMgPSB7fTtcblxuICBmb3IgKGxldCBpID0gMTsgaSA8PSByZWdleGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgcG9zaXRpb25zW2kgKyBvZmZzZXRdID0gc2NvcGVOYW1lc1tpXTtcbiAgICBlbWl0W2kgKyBvZmZzZXRdID0gdHJ1ZTtcbiAgICBvZmZzZXQgKz0gY291bnRNYXRjaEdyb3VwcyhyZWdleGVzW2kgLSAxXSk7XG4gIH1cbiAgLy8gd2UgdXNlIF9lbWl0IHRvIGtlZXAgdHJhY2sgb2Ygd2hpY2ggbWF0Y2ggZ3JvdXBzIGFyZSBcInRvcC1sZXZlbFwiIHRvIGF2b2lkIGRvdWJsZVxuICAvLyBvdXRwdXQgZnJvbSBpbnNpZGUgbWF0Y2ggZ3JvdXBzXG4gIG1vZGVba2V5XSA9IHBvc2l0aW9ucztcbiAgbW9kZVtrZXldLl9lbWl0ID0gZW1pdDtcbiAgbW9kZVtrZXldLl9tdWx0aSA9IHRydWU7XG59XG5cbi8qKlxuICogQHBhcmFtIHtDb21waWxlZE1vZGV9IG1vZGVcbiAqL1xuZnVuY3Rpb24gYmVnaW5NdWx0aUNsYXNzKG1vZGUpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KG1vZGUuYmVnaW4pKSByZXR1cm47XG5cbiAgaWYgKG1vZGUuc2tpcCB8fCBtb2RlLmV4Y2x1ZGVCZWdpbiB8fCBtb2RlLnJldHVybkJlZ2luKSB7XG4gICAgZXJyb3IoXCJza2lwLCBleGNsdWRlQmVnaW4sIHJldHVybkJlZ2luIG5vdCBjb21wYXRpYmxlIHdpdGggYmVnaW5TY29wZToge31cIik7XG4gICAgdGhyb3cgTXVsdGlDbGFzc0Vycm9yO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBtb2RlLmJlZ2luU2NvcGUgIT09IFwib2JqZWN0XCIgfHwgbW9kZS5iZWdpblNjb3BlID09PSBudWxsKSB7XG4gICAgZXJyb3IoXCJiZWdpblNjb3BlIG11c3QgYmUgb2JqZWN0XCIpO1xuICAgIHRocm93IE11bHRpQ2xhc3NFcnJvcjtcbiAgfVxuXG4gIHJlbWFwU2NvcGVOYW1lcyhtb2RlLCBtb2RlLmJlZ2luLCB7IGtleTogXCJiZWdpblNjb3BlXCIgfSk7XG4gIG1vZGUuYmVnaW4gPSBfcmV3cml0ZUJhY2tyZWZlcmVuY2VzKG1vZGUuYmVnaW4sIHsgam9pbldpdGg6IFwiXCIgfSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtDb21waWxlZE1vZGV9IG1vZGVcbiAqL1xuZnVuY3Rpb24gZW5kTXVsdGlDbGFzcyhtb2RlKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShtb2RlLmVuZCkpIHJldHVybjtcblxuICBpZiAobW9kZS5za2lwIHx8IG1vZGUuZXhjbHVkZUVuZCB8fCBtb2RlLnJldHVybkVuZCkge1xuICAgIGVycm9yKFwic2tpcCwgZXhjbHVkZUVuZCwgcmV0dXJuRW5kIG5vdCBjb21wYXRpYmxlIHdpdGggZW5kU2NvcGU6IHt9XCIpO1xuICAgIHRocm93IE11bHRpQ2xhc3NFcnJvcjtcbiAgfVxuXG4gIGlmICh0eXBlb2YgbW9kZS5lbmRTY29wZSAhPT0gXCJvYmplY3RcIiB8fCBtb2RlLmVuZFNjb3BlID09PSBudWxsKSB7XG4gICAgZXJyb3IoXCJlbmRTY29wZSBtdXN0IGJlIG9iamVjdFwiKTtcbiAgICB0aHJvdyBNdWx0aUNsYXNzRXJyb3I7XG4gIH1cblxuICByZW1hcFNjb3BlTmFtZXMobW9kZSwgbW9kZS5lbmQsIHsga2V5OiBcImVuZFNjb3BlXCIgfSk7XG4gIG1vZGUuZW5kID0gX3Jld3JpdGVCYWNrcmVmZXJlbmNlcyhtb2RlLmVuZCwgeyBqb2luV2l0aDogXCJcIiB9KTtcbn1cblxuLyoqXG4gKiB0aGlzIGV4aXN0cyBvbmx5IHRvIGFsbG93IGBzY29wZToge31gIHRvIGJlIHVzZWQgYmVzaWRlIGBtYXRjaDpgXG4gKiBPdGhlcndpc2UgYGJlZ2luU2NvcGVgIHdvdWxkIG5lY2Vzc2FyeSBhbmQgdGhhdCB3b3VsZCBsb29rIHdlaXJkXG5cbiAge1xuICAgIG1hdGNoOiBbIC9kZWYvLCAvXFx3Ky8gXVxuICAgIHNjb3BlOiB7IDE6IFwia2V5d29yZFwiICwgMjogXCJ0aXRsZVwiIH1cbiAgfVxuXG4gKiBAcGFyYW0ge0NvbXBpbGVkTW9kZX0gbW9kZVxuICovXG5mdW5jdGlvbiBzY29wZVN1Z2FyKG1vZGUpIHtcbiAgaWYgKG1vZGUuc2NvcGUgJiYgdHlwZW9mIG1vZGUuc2NvcGUgPT09IFwib2JqZWN0XCIgJiYgbW9kZS5zY29wZSAhPT0gbnVsbCkge1xuICAgIG1vZGUuYmVnaW5TY29wZSA9IG1vZGUuc2NvcGU7XG4gICAgZGVsZXRlIG1vZGUuc2NvcGU7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0NvbXBpbGVkTW9kZX0gbW9kZVxuICovXG5mdW5jdGlvbiBNdWx0aUNsYXNzKG1vZGUpIHtcbiAgc2NvcGVTdWdhcihtb2RlKTtcblxuICBpZiAodHlwZW9mIG1vZGUuYmVnaW5TY29wZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIG1vZGUuYmVnaW5TY29wZSA9IHsgX3dyYXA6IG1vZGUuYmVnaW5TY29wZSB9O1xuICB9XG4gIGlmICh0eXBlb2YgbW9kZS5lbmRTY29wZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIG1vZGUuZW5kU2NvcGUgPSB7IF93cmFwOiBtb2RlLmVuZFNjb3BlIH07XG4gIH1cblxuICBiZWdpbk11bHRpQ2xhc3MobW9kZSk7XG4gIGVuZE11bHRpQ2xhc3MobW9kZSk7XG59XG5cbi8qKlxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuTW9kZX0gTW9kZVxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQ29tcGlsZWRNb2RlfSBDb21waWxlZE1vZGVcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLkxhbmd1YWdlfSBMYW5ndWFnZVxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuSExKU1BsdWdpbn0gSExKU1BsdWdpblxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQ29tcGlsZWRMYW5ndWFnZX0gQ29tcGlsZWRMYW5ndWFnZVxuKi9cblxuLy8gY29tcGlsYXRpb25cblxuLyoqXG4gKiBDb21waWxlcyBhIGxhbmd1YWdlIGRlZmluaXRpb24gcmVzdWx0XG4gKlxuICogR2l2ZW4gdGhlIHJhdyByZXN1bHQgb2YgYSBsYW5ndWFnZSBkZWZpbml0aW9uIChMYW5ndWFnZSksIGNvbXBpbGVzIHRoaXMgc29cbiAqIHRoYXQgaXQgaXMgcmVhZHkgZm9yIGhpZ2hsaWdodGluZyBjb2RlLlxuICogQHBhcmFtIHtMYW5ndWFnZX0gbGFuZ3VhZ2VcbiAqIEByZXR1cm5zIHtDb21waWxlZExhbmd1YWdlfVxuICovXG5mdW5jdGlvbiBjb21waWxlTGFuZ3VhZ2UobGFuZ3VhZ2UpIHtcbiAgLyoqXG4gICAqIEJ1aWxkcyBhIHJlZ2V4IHdpdGggdGhlIGNhc2Ugc2Vuc2l0aXZpdHkgb2YgdGhlIGN1cnJlbnQgbGFuZ3VhZ2VcbiAgICpcbiAgICogQHBhcmFtIHtSZWdFeHAgfCBzdHJpbmd9IHZhbHVlXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2dsb2JhbF1cbiAgICovXG4gIGZ1bmN0aW9uIGxhbmdSZSh2YWx1ZSwgZ2xvYmFsKSB7XG4gICAgcmV0dXJuIG5ldyBSZWdFeHAoXG4gICAgICBzb3VyY2UodmFsdWUpLFxuICAgICAgJ20nXG4gICAgICArIChsYW5ndWFnZS5jYXNlX2luc2Vuc2l0aXZlID8gJ2knIDogJycpXG4gICAgICArIChsYW5ndWFnZS51bmljb2RlUmVnZXggPyAndScgOiAnJylcbiAgICAgICsgKGdsb2JhbCA/ICdnJyA6ICcnKVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICBTdG9yZXMgbXVsdGlwbGUgcmVndWxhciBleHByZXNzaW9ucyBhbmQgYWxsb3dzIHlvdSB0byBxdWlja2x5IHNlYXJjaCBmb3JcbiAgICB0aGVtIGFsbCBpbiBhIHN0cmluZyBzaW11bHRhbmVvdXNseSAtIHJldHVybmluZyB0aGUgZmlyc3QgbWF0Y2guICBJdCBkb2VzXG4gICAgdGhpcyBieSBjcmVhdGluZyBhIGh1Z2UgKGF8YnxjKSByZWdleCAtIGVhY2ggaW5kaXZpZHVhbCBpdGVtIHdyYXBwZWQgd2l0aCAoKVxuICAgIGFuZCBqb2luZWQgYnkgYHxgIC0gdXNpbmcgbWF0Y2ggZ3JvdXBzIHRvIHRyYWNrIHBvc2l0aW9uLiAgV2hlbiBhIG1hdGNoIGlzXG4gICAgZm91bmQgY2hlY2tpbmcgd2hpY2ggcG9zaXRpb24gaW4gdGhlIGFycmF5IGhhcyBjb250ZW50IGFsbG93cyB1cyB0byBmaWd1cmVcbiAgICBvdXQgd2hpY2ggb2YgdGhlIG9yaWdpbmFsIHJlZ2V4ZXMgLyBtYXRjaCBncm91cHMgdHJpZ2dlcmVkIHRoZSBtYXRjaC5cblxuICAgIFRoZSBtYXRjaCBvYmplY3QgaXRzZWxmICh0aGUgcmVzdWx0IG9mIGBSZWdleC5leGVjYCkgaXMgcmV0dXJuZWQgYnV0IGFsc29cbiAgICBlbmhhbmNlZCBieSBtZXJnaW5nIGluIGFueSBtZXRhLWRhdGEgdGhhdCB3YXMgcmVnaXN0ZXJlZCB3aXRoIHRoZSByZWdleC5cbiAgICBUaGlzIGlzIGhvdyB3ZSBrZWVwIHRyYWNrIG9mIHdoaWNoIG1vZGUgbWF0Y2hlZCwgYW5kIHdoYXQgdHlwZSBvZiBydWxlXG4gICAgKGBpbGxlZ2FsYCwgYGJlZ2luYCwgZW5kLCBldGMpLlxuICAqL1xuICBjbGFzcyBNdWx0aVJlZ2V4IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgIHRoaXMubWF0Y2hJbmRleGVzID0ge307XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICB0aGlzLnJlZ2V4ZXMgPSBbXTtcbiAgICAgIHRoaXMubWF0Y2hBdCA9IDE7XG4gICAgICB0aGlzLnBvc2l0aW9uID0gMDtcbiAgICB9XG5cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgYWRkUnVsZShyZSwgb3B0cykge1xuICAgICAgb3B0cy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24rKztcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIHRoaXMubWF0Y2hJbmRleGVzW3RoaXMubWF0Y2hBdF0gPSBvcHRzO1xuICAgICAgdGhpcy5yZWdleGVzLnB1c2goW29wdHMsIHJlXSk7XG4gICAgICB0aGlzLm1hdGNoQXQgKz0gY291bnRNYXRjaEdyb3VwcyhyZSkgKyAxO1xuICAgIH1cblxuICAgIGNvbXBpbGUoKSB7XG4gICAgICBpZiAodGhpcy5yZWdleGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAvLyBhdm9pZHMgdGhlIG5lZWQgdG8gY2hlY2sgbGVuZ3RoIGV2ZXJ5IHRpbWUgZXhlYyBpcyBjYWxsZWRcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICB0aGlzLmV4ZWMgPSAoKSA9PiBudWxsO1xuICAgICAgfVxuICAgICAgY29uc3QgdGVybWluYXRvcnMgPSB0aGlzLnJlZ2V4ZXMubWFwKGVsID0+IGVsWzFdKTtcbiAgICAgIHRoaXMubWF0Y2hlclJlID0gbGFuZ1JlKF9yZXdyaXRlQmFja3JlZmVyZW5jZXModGVybWluYXRvcnMsIHsgam9pbldpdGg6ICd8JyB9KSwgdHJ1ZSk7XG4gICAgICB0aGlzLmxhc3RJbmRleCA9IDA7XG4gICAgfVxuXG4gICAgLyoqIEBwYXJhbSB7c3RyaW5nfSBzICovXG4gICAgZXhlYyhzKSB7XG4gICAgICB0aGlzLm1hdGNoZXJSZS5sYXN0SW5kZXggPSB0aGlzLmxhc3RJbmRleDtcbiAgICAgIGNvbnN0IG1hdGNoID0gdGhpcy5tYXRjaGVyUmUuZXhlYyhzKTtcbiAgICAgIGlmICghbWF0Y2gpIHsgcmV0dXJuIG51bGw7IH1cblxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmaW5lZFxuICAgICAgY29uc3QgaSA9IG1hdGNoLmZpbmRJbmRleCgoZWwsIGkpID0+IGkgPiAwICYmIGVsICE9PSB1bmRlZmluZWQpO1xuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgY29uc3QgbWF0Y2hEYXRhID0gdGhpcy5tYXRjaEluZGV4ZXNbaV07XG4gICAgICAvLyB0cmltIG9mZiBhbnkgZWFybGllciBub24tcmVsZXZhbnQgbWF0Y2ggZ3JvdXBzIChpZSwgdGhlIG90aGVyIHJlZ2V4XG4gICAgICAvLyBtYXRjaCBncm91cHMgdGhhdCBtYWtlIHVwIHRoZSBtdWx0aS1tYXRjaGVyKVxuICAgICAgbWF0Y2guc3BsaWNlKDAsIGkpO1xuXG4gICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihtYXRjaCwgbWF0Y2hEYXRhKTtcbiAgICB9XG4gIH1cblxuICAvKlxuICAgIENyZWF0ZWQgdG8gc29sdmUgdGhlIGtleSBkZWZpY2llbnRseSB3aXRoIE11bHRpUmVnZXggLSB0aGVyZSBpcyBubyB3YXkgdG9cbiAgICB0ZXN0IGZvciBtdWx0aXBsZSBtYXRjaGVzIGF0IGEgc2luZ2xlIGxvY2F0aW9uLiAgV2h5IHdvdWxkIHdlIG5lZWQgdG8gZG9cbiAgICB0aGF0PyAgSW4gdGhlIGZ1dHVyZSBhIG1vcmUgZHluYW1pYyBlbmdpbmUgd2lsbCBhbGxvdyBjZXJ0YWluIG1hdGNoZXMgdG8gYmVcbiAgICBpZ25vcmVkLiAgQW4gZXhhbXBsZTogaWYgd2UgbWF0Y2hlZCBzYXkgdGhlIDNyZCByZWdleCBpbiBhIGxhcmdlIGdyb3VwIGJ1dFxuICAgIGRlY2lkZWQgdG8gaWdub3JlIGl0IC0gd2UnZCBuZWVkIHRvIHN0YXJ0ZWQgdGVzdGluZyBhZ2FpbiBhdCB0aGUgNHRoXG4gICAgcmVnZXguLi4gYnV0IE11bHRpUmVnZXggaXRzZWxmIGdpdmVzIHVzIG5vIHJlYWwgd2F5IHRvIGRvIHRoYXQuXG5cbiAgICBTbyB3aGF0IHRoaXMgY2xhc3MgY3JlYXRlcyBNdWx0aVJlZ2V4cyBvbiB0aGUgZmx5IGZvciB3aGF0ZXZlciBzZWFyY2hcbiAgICBwb3NpdGlvbiB0aGV5IGFyZSBuZWVkZWQuXG5cbiAgICBOT1RFOiBUaGVzZSBhZGRpdGlvbmFsIE11bHRpUmVnZXggb2JqZWN0cyBhcmUgY3JlYXRlZCBkeW5hbWljYWxseS4gIEZvciBtb3N0XG4gICAgZ3JhbW1hcnMgbW9zdCBvZiB0aGUgdGltZSB3ZSB3aWxsIG5ldmVyIGFjdHVhbGx5IG5lZWQgYW55dGhpbmcgbW9yZSB0aGFuIHRoZVxuICAgIGZpcnN0IE11bHRpUmVnZXggLSBzbyB0aGlzIHNob3VsZG4ndCBoYXZlIHRvbyBtdWNoIG92ZXJoZWFkLlxuXG4gICAgU2F5IHRoaXMgaXMgb3VyIHNlYXJjaCBncm91cCwgYW5kIHdlIG1hdGNoIHJlZ2V4MywgYnV0IHdpc2ggdG8gaWdub3JlIGl0LlxuXG4gICAgICByZWdleDEgfCByZWdleDIgfCByZWdleDMgfCByZWdleDQgfCByZWdleDUgICAgJyBpZSwgc3RhcnRBdCA9IDBcblxuICAgIFdoYXQgd2UgbmVlZCBpcyBhIG5ldyBNdWx0aVJlZ2V4IHRoYXQgb25seSBpbmNsdWRlcyB0aGUgcmVtYWluaW5nXG4gICAgcG9zc2liaWxpdGllczpcblxuICAgICAgcmVnZXg0IHwgcmVnZXg1ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgaWUsIHN0YXJ0QXQgPSAzXG5cbiAgICBUaGlzIGNsYXNzIHdyYXBzIGFsbCB0aGF0IGNvbXBsZXhpdHkgdXAgaW4gYSBzaW1wbGUgQVBJLi4uIGBzdGFydEF0YCBkZWNpZGVzXG4gICAgd2hlcmUgaW4gdGhlIGFycmF5IG9mIGV4cHJlc3Npb25zIHRvIHN0YXJ0IGRvaW5nIHRoZSBtYXRjaGluZy4gSXRcbiAgICBhdXRvLWluY3JlbWVudHMsIHNvIGlmIGEgbWF0Y2ggaXMgZm91bmQgYXQgcG9zaXRpb24gMiwgdGhlbiBzdGFydEF0IHdpbGwgYmVcbiAgICBzZXQgdG8gMy4gIElmIHRoZSBlbmQgaXMgcmVhY2hlZCBzdGFydEF0IHdpbGwgcmV0dXJuIHRvIDAuXG5cbiAgICBNT1NUIG9mIHRoZSB0aW1lIHRoZSBwYXJzZXIgd2lsbCBiZSBzZXR0aW5nIHN0YXJ0QXQgbWFudWFsbHkgdG8gMC5cbiAgKi9cbiAgY2xhc3MgUmVzdW1hYmxlTXVsdGlSZWdleCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICB0aGlzLnJ1bGVzID0gW107XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICB0aGlzLm11bHRpUmVnZXhlcyA9IFtdO1xuICAgICAgdGhpcy5jb3VudCA9IDA7XG5cbiAgICAgIHRoaXMubGFzdEluZGV4ID0gMDtcbiAgICAgIHRoaXMucmVnZXhJbmRleCA9IDA7XG4gICAgfVxuXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGdldE1hdGNoZXIoaW5kZXgpIHtcbiAgICAgIGlmICh0aGlzLm11bHRpUmVnZXhlc1tpbmRleF0pIHJldHVybiB0aGlzLm11bHRpUmVnZXhlc1tpbmRleF07XG5cbiAgICAgIGNvbnN0IG1hdGNoZXIgPSBuZXcgTXVsdGlSZWdleCgpO1xuICAgICAgdGhpcy5ydWxlcy5zbGljZShpbmRleCkuZm9yRWFjaCgoW3JlLCBvcHRzXSkgPT4gbWF0Y2hlci5hZGRSdWxlKHJlLCBvcHRzKSk7XG4gICAgICBtYXRjaGVyLmNvbXBpbGUoKTtcbiAgICAgIHRoaXMubXVsdGlSZWdleGVzW2luZGV4XSA9IG1hdGNoZXI7XG4gICAgICByZXR1cm4gbWF0Y2hlcjtcbiAgICB9XG5cbiAgICByZXN1bWluZ1NjYW5BdFNhbWVQb3NpdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlZ2V4SW5kZXggIT09IDA7XG4gICAgfVxuXG4gICAgY29uc2lkZXJBbGwoKSB7XG4gICAgICB0aGlzLnJlZ2V4SW5kZXggPSAwO1xuICAgIH1cblxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBhZGRSdWxlKHJlLCBvcHRzKSB7XG4gICAgICB0aGlzLnJ1bGVzLnB1c2goW3JlLCBvcHRzXSk7XG4gICAgICBpZiAob3B0cy50eXBlID09PSBcImJlZ2luXCIpIHRoaXMuY291bnQrKztcbiAgICB9XG5cbiAgICAvKiogQHBhcmFtIHtzdHJpbmd9IHMgKi9cbiAgICBleGVjKHMpIHtcbiAgICAgIGNvbnN0IG0gPSB0aGlzLmdldE1hdGNoZXIodGhpcy5yZWdleEluZGV4KTtcbiAgICAgIG0ubGFzdEluZGV4ID0gdGhpcy5sYXN0SW5kZXg7XG4gICAgICBsZXQgcmVzdWx0ID0gbS5leGVjKHMpO1xuXG4gICAgICAvLyBUaGUgZm9sbG93aW5nIGlzIGJlY2F1c2Ugd2UgaGF2ZSBubyBlYXN5IHdheSB0byBzYXkgXCJyZXN1bWUgc2Nhbm5pbmcgYXQgdGhlXG4gICAgICAvLyBleGlzdGluZyBwb3NpdGlvbiBidXQgYWxzbyBza2lwIHRoZSBjdXJyZW50IHJ1bGUgT05MWVwiLiBXaGF0IGhhcHBlbnMgaXNcbiAgICAgIC8vIGFsbCBwcmlvciBydWxlcyBhcmUgYWxzbyBza2lwcGVkIHdoaWNoIGNhbiByZXN1bHQgaW4gbWF0Y2hpbmcgdGhlIHdyb25nXG4gICAgICAvLyB0aGluZy4gRXhhbXBsZSBvZiBtYXRjaGluZyBcImJvb2dlclwiOlxuXG4gICAgICAvLyBvdXIgbWF0Y2hlciBpcyBbc3RyaW5nLCBcImJvb2dlclwiLCBudW1iZXJdXG4gICAgICAvL1xuICAgICAgLy8gLi4uLmJvb2dlci4uLi5cblxuICAgICAgLy8gaWYgXCJib29nZXJcIiBpcyBpZ25vcmVkIHRoZW4gd2UnZCByZWFsbHkgbmVlZCBhIHJlZ2V4IHRvIHNjYW4gZnJvbSB0aGVcbiAgICAgIC8vIFNBTUUgcG9zaXRpb24gZm9yIG9ubHk6IFtzdHJpbmcsIG51bWJlcl0gYnV0IGlnbm9yaW5nIFwiYm9vZ2VyXCIgKGlmIGl0XG4gICAgICAvLyB3YXMgdGhlIGZpcnN0IG1hdGNoKSwgYSBzaW1wbGUgcmVzdW1lIHdvdWxkIHNjYW4gYWhlYWQgd2hvIGtub3dzIGhvd1xuICAgICAgLy8gZmFyIGxvb2tpbmcgb25seSBmb3IgXCJudW1iZXJcIiwgaWdub3JpbmcgcG90ZW50aWFsIHN0cmluZyBtYXRjaGVzIChvclxuICAgICAgLy8gZnV0dXJlIFwiYm9vZ2VyXCIgbWF0Y2hlcyB0aGF0IG1pZ2h0IGJlIHZhbGlkLilcblxuICAgICAgLy8gU28gd2hhdCB3ZSBkbzogV2UgZXhlY3V0ZSB0d28gbWF0Y2hlcnMsIG9uZSByZXN1bWluZyBhdCB0aGUgc2FtZVxuICAgICAgLy8gcG9zaXRpb24sIGJ1dCB0aGUgc2Vjb25kIGZ1bGwgbWF0Y2hlciBzdGFydGluZyBhdCB0aGUgcG9zaXRpb24gYWZ0ZXI6XG5cbiAgICAgIC8vICAgICAvLS0tIHJlc3VtZSBmaXJzdCByZWdleCBtYXRjaCBoZXJlIChmb3IgW251bWJlcl0pXG4gICAgICAvLyAgICAgfC8tLS0tIGZ1bGwgbWF0Y2ggaGVyZSBmb3IgW3N0cmluZywgXCJib29nZXJcIiwgbnVtYmVyXVxuICAgICAgLy8gICAgIHZ2XG4gICAgICAvLyAuLi4uYm9vZ2VyLi4uLlxuXG4gICAgICAvLyBXaGljaCBldmVyIHJlc3VsdHMgaW4gYSBtYXRjaCBmaXJzdCBpcyB0aGVuIHVzZWQuIFNvIHRoaXMgMy00IHN0ZXBcbiAgICAgIC8vIHByb2Nlc3MgZXNzZW50aWFsbHkgYWxsb3dzIHVzIHRvIHNheSBcIm1hdGNoIGF0IHRoaXMgcG9zaXRpb24sIGV4Y2x1ZGluZ1xuICAgICAgLy8gYSBwcmlvciBydWxlIHRoYXQgd2FzIGlnbm9yZWRcIi5cbiAgICAgIC8vXG4gICAgICAvLyAxLiBNYXRjaCBcImJvb2dlclwiIGZpcnN0LCBpZ25vcmUuIEFsc28gcHJvdmVzIHRoYXQgW3N0cmluZ10gZG9lcyBub24gbWF0Y2guXG4gICAgICAvLyAyLiBSZXN1bWUgbWF0Y2hpbmcgZm9yIFtudW1iZXJdXG4gICAgICAvLyAzLiBNYXRjaCBhdCBpbmRleCArIDEgZm9yIFtzdHJpbmcsIFwiYm9vZ2VyXCIsIG51bWJlcl1cbiAgICAgIC8vIDQuIElmICMyIGFuZCAjMyByZXN1bHQgaW4gbWF0Y2hlcywgd2hpY2ggY2FtZSBmaXJzdD9cbiAgICAgIGlmICh0aGlzLnJlc3VtaW5nU2NhbkF0U2FtZVBvc2l0aW9uKCkpIHtcbiAgICAgICAgaWYgKHJlc3VsdCAmJiByZXN1bHQuaW5kZXggPT09IHRoaXMubGFzdEluZGV4KSA7IGVsc2UgeyAvLyB1c2UgdGhlIHNlY29uZCBtYXRjaGVyIHJlc3VsdFxuICAgICAgICAgIGNvbnN0IG0yID0gdGhpcy5nZXRNYXRjaGVyKDApO1xuICAgICAgICAgIG0yLmxhc3RJbmRleCA9IHRoaXMubGFzdEluZGV4ICsgMTtcbiAgICAgICAgICByZXN1bHQgPSBtMi5leGVjKHMpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgdGhpcy5yZWdleEluZGV4ICs9IHJlc3VsdC5wb3NpdGlvbiArIDE7XG4gICAgICAgIGlmICh0aGlzLnJlZ2V4SW5kZXggPT09IHRoaXMuY291bnQpIHtcbiAgICAgICAgICAvLyB3cmFwLWFyb3VuZCB0byBjb25zaWRlcmluZyBhbGwgbWF0Y2hlcyBhZ2FpblxuICAgICAgICAgIHRoaXMuY29uc2lkZXJBbGwoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHaXZlbiBhIG1vZGUsIGJ1aWxkcyBhIGh1Z2UgUmVzdW1hYmxlTXVsdGlSZWdleCB0aGF0IGNhbiBiZSB1c2VkIHRvIHdhbGtcbiAgICogdGhlIGNvbnRlbnQgYW5kIGZpbmQgbWF0Y2hlcy5cbiAgICpcbiAgICogQHBhcmFtIHtDb21waWxlZE1vZGV9IG1vZGVcbiAgICogQHJldHVybnMge1Jlc3VtYWJsZU11bHRpUmVnZXh9XG4gICAqL1xuICBmdW5jdGlvbiBidWlsZE1vZGVSZWdleChtb2RlKSB7XG4gICAgY29uc3QgbW0gPSBuZXcgUmVzdW1hYmxlTXVsdGlSZWdleCgpO1xuXG4gICAgbW9kZS5jb250YWlucy5mb3JFYWNoKHRlcm0gPT4gbW0uYWRkUnVsZSh0ZXJtLmJlZ2luLCB7IHJ1bGU6IHRlcm0sIHR5cGU6IFwiYmVnaW5cIiB9KSk7XG5cbiAgICBpZiAobW9kZS50ZXJtaW5hdG9yRW5kKSB7XG4gICAgICBtbS5hZGRSdWxlKG1vZGUudGVybWluYXRvckVuZCwgeyB0eXBlOiBcImVuZFwiIH0pO1xuICAgIH1cbiAgICBpZiAobW9kZS5pbGxlZ2FsKSB7XG4gICAgICBtbS5hZGRSdWxlKG1vZGUuaWxsZWdhbCwgeyB0eXBlOiBcImlsbGVnYWxcIiB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbW07XG4gIH1cblxuICAvKiogc2tpcCB2cyBhYm9ydCB2cyBpZ25vcmVcbiAgICpcbiAgICogQHNraXAgICAtIFRoZSBtb2RlIGlzIHN0aWxsIGVudGVyZWQgYW5kIGV4aXRlZCBub3JtYWxseSAoYW5kIGNvbnRhaW5zIHJ1bGVzIGFwcGx5KSxcbiAgICogICAgICAgICAgIGJ1dCBhbGwgY29udGVudCBpcyBoZWxkIGFuZCBhZGRlZCB0byB0aGUgcGFyZW50IGJ1ZmZlciByYXRoZXIgdGhhbiBiZWluZ1xuICAgKiAgICAgICAgICAgb3V0cHV0IHdoZW4gdGhlIG1vZGUgZW5kcy4gIE1vc3RseSB1c2VkIHdpdGggYHN1Ymxhbmd1YWdlYCB0byBidWlsZCB1cFxuICAgKiAgICAgICAgICAgYSBzaW5nbGUgbGFyZ2UgYnVmZmVyIHRoYW4gY2FuIGJlIHBhcnNlZCBieSBzdWJsYW5ndWFnZS5cbiAgICpcbiAgICogICAgICAgICAgICAgLSBUaGUgbW9kZSBiZWdpbiBhbmRzIGVuZHMgbm9ybWFsbHkuXG4gICAqICAgICAgICAgICAgIC0gQ29udGVudCBtYXRjaGVkIGlzIGFkZGVkIHRvIHRoZSBwYXJlbnQgbW9kZSBidWZmZXIuXG4gICAqICAgICAgICAgICAgIC0gVGhlIHBhcnNlciBjdXJzb3IgaXMgbW92ZWQgZm9yd2FyZCBub3JtYWxseS5cbiAgICpcbiAgICogQGFib3J0ICAtIEEgaGFjayBwbGFjZWhvbGRlciB1bnRpbCB3ZSBoYXZlIGlnbm9yZS4gIEFib3J0cyB0aGUgbW9kZSAoYXMgaWYgaXRcbiAgICogICAgICAgICAgIG5ldmVyIG1hdGNoZWQpIGJ1dCBET0VTIE5PVCBjb250aW51ZSB0byBtYXRjaCBzdWJzZXF1ZW50IGBjb250YWluc2BcbiAgICogICAgICAgICAgIG1vZGVzLiAgQWJvcnQgaXMgYmFkL3N1Ym9wdGltYWwgYmVjYXVzZSBpdCBjYW4gcmVzdWx0IGluIG1vZGVzXG4gICAqICAgICAgICAgICBmYXJ0aGVyIGRvd24gbm90IGdldHRpbmcgYXBwbGllZCBiZWNhdXNlIGFuIGVhcmxpZXIgcnVsZSBlYXRzIHRoZVxuICAgKiAgICAgICAgICAgY29udGVudCBidXQgdGhlbiBhYm9ydHMuXG4gICAqXG4gICAqICAgICAgICAgICAgIC0gVGhlIG1vZGUgZG9lcyBub3QgYmVnaW4uXG4gICAqICAgICAgICAgICAgIC0gQ29udGVudCBtYXRjaGVkIGJ5IGBiZWdpbmAgaXMgYWRkZWQgdG8gdGhlIG1vZGUgYnVmZmVyLlxuICAgKiAgICAgICAgICAgICAtIFRoZSBwYXJzZXIgY3Vyc29yIGlzIG1vdmVkIGZvcndhcmQgYWNjb3JkaW5nbHkuXG4gICAqXG4gICAqIEBpZ25vcmUgLSBJZ25vcmVzIHRoZSBtb2RlIChhcyBpZiBpdCBuZXZlciBtYXRjaGVkKSBhbmQgY29udGludWVzIHRvIG1hdGNoIGFueVxuICAgKiAgICAgICAgICAgc3Vic2VxdWVudCBgY29udGFpbnNgIG1vZGVzLiAgSWdub3JlIGlzbid0IHRlY2huaWNhbGx5IHBvc3NpYmxlIHdpdGhcbiAgICogICAgICAgICAgIHRoZSBjdXJyZW50IHBhcnNlciBpbXBsZW1lbnRhdGlvbi5cbiAgICpcbiAgICogICAgICAgICAgICAgLSBUaGUgbW9kZSBkb2VzIG5vdCBiZWdpbi5cbiAgICogICAgICAgICAgICAgLSBDb250ZW50IG1hdGNoZWQgYnkgYGJlZ2luYCBpcyBpZ25vcmVkLlxuICAgKiAgICAgICAgICAgICAtIFRoZSBwYXJzZXIgY3Vyc29yIGlzIG5vdCBtb3ZlZCBmb3J3YXJkLlxuICAgKi9cblxuICAvKipcbiAgICogQ29tcGlsZXMgYW4gaW5kaXZpZHVhbCBtb2RlXG4gICAqXG4gICAqIFRoaXMgY2FuIHJhaXNlIGFuIGVycm9yIGlmIHRoZSBtb2RlIGNvbnRhaW5zIGNlcnRhaW4gZGV0ZWN0YWJsZSBrbm93biBsb2dpY1xuICAgKiBpc3N1ZXMuXG4gICAqIEBwYXJhbSB7TW9kZX0gbW9kZVxuICAgKiBAcGFyYW0ge0NvbXBpbGVkTW9kZSB8IG51bGx9IFtwYXJlbnRdXG4gICAqIEByZXR1cm5zIHtDb21waWxlZE1vZGUgfCBuZXZlcn1cbiAgICovXG4gIGZ1bmN0aW9uIGNvbXBpbGVNb2RlKG1vZGUsIHBhcmVudCkge1xuICAgIGNvbnN0IGNtb2RlID0gLyoqIEB0eXBlIENvbXBpbGVkTW9kZSAqLyAobW9kZSk7XG4gICAgaWYgKG1vZGUuaXNDb21waWxlZCkgcmV0dXJuIGNtb2RlO1xuXG4gICAgW1xuICAgICAgc2NvcGVDbGFzc05hbWUsXG4gICAgICAvLyBkbyB0aGlzIGVhcmx5IHNvIGNvbXBpbGVyIGV4dGVuc2lvbnMgZ2VuZXJhbGx5IGRvbid0IGhhdmUgdG8gd29ycnkgYWJvdXRcbiAgICAgIC8vIHRoZSBkaXN0aW5jdGlvbiBiZXR3ZWVuIG1hdGNoL2JlZ2luXG4gICAgICBjb21waWxlTWF0Y2gsXG4gICAgICBNdWx0aUNsYXNzLFxuICAgICAgYmVmb3JlTWF0Y2hFeHRcbiAgICBdLmZvckVhY2goZXh0ID0+IGV4dChtb2RlLCBwYXJlbnQpKTtcblxuICAgIGxhbmd1YWdlLmNvbXBpbGVyRXh0ZW5zaW9ucy5mb3JFYWNoKGV4dCA9PiBleHQobW9kZSwgcGFyZW50KSk7XG5cbiAgICAvLyBfX2JlZm9yZUJlZ2luIGlzIGNvbnNpZGVyZWQgcHJpdmF0ZSBBUEksIGludGVybmFsIHVzZSBvbmx5XG4gICAgbW9kZS5fX2JlZm9yZUJlZ2luID0gbnVsbDtcblxuICAgIFtcbiAgICAgIGJlZ2luS2V5d29yZHMsXG4gICAgICAvLyBkbyB0aGlzIGxhdGVyIHNvIGNvbXBpbGVyIGV4dGVuc2lvbnMgdGhhdCBjb21lIGVhcmxpZXIgaGF2ZSBhY2Nlc3MgdG8gdGhlXG4gICAgICAvLyByYXcgYXJyYXkgaWYgdGhleSB3YW50ZWQgdG8gcGVyaGFwcyBtYW5pcHVsYXRlIGl0LCBldGMuXG4gICAgICBjb21waWxlSWxsZWdhbCxcbiAgICAgIC8vIGRlZmF1bHQgdG8gMSByZWxldmFuY2UgaWYgbm90IHNwZWNpZmllZFxuICAgICAgY29tcGlsZVJlbGV2YW5jZVxuICAgIF0uZm9yRWFjaChleHQgPT4gZXh0KG1vZGUsIHBhcmVudCkpO1xuXG4gICAgbW9kZS5pc0NvbXBpbGVkID0gdHJ1ZTtcblxuICAgIGxldCBrZXl3b3JkUGF0dGVybiA9IG51bGw7XG4gICAgaWYgKHR5cGVvZiBtb2RlLmtleXdvcmRzID09PSBcIm9iamVjdFwiICYmIG1vZGUua2V5d29yZHMuJHBhdHRlcm4pIHtcbiAgICAgIC8vIHdlIG5lZWQgYSBjb3B5IGJlY2F1c2Uga2V5d29yZHMgbWlnaHQgYmUgY29tcGlsZWQgbXVsdGlwbGUgdGltZXNcbiAgICAgIC8vIHNvIHdlIGNhbid0IGdvIGRlbGV0aW5nICRwYXR0ZXJuIGZyb20gdGhlIG9yaWdpbmFsIG9uIHRoZSBmaXJzdFxuICAgICAgLy8gcGFzc1xuICAgICAgbW9kZS5rZXl3b3JkcyA9IE9iamVjdC5hc3NpZ24oe30sIG1vZGUua2V5d29yZHMpO1xuICAgICAga2V5d29yZFBhdHRlcm4gPSBtb2RlLmtleXdvcmRzLiRwYXR0ZXJuO1xuICAgICAgZGVsZXRlIG1vZGUua2V5d29yZHMuJHBhdHRlcm47XG4gICAgfVxuICAgIGtleXdvcmRQYXR0ZXJuID0ga2V5d29yZFBhdHRlcm4gfHwgL1xcdysvO1xuXG4gICAgaWYgKG1vZGUua2V5d29yZHMpIHtcbiAgICAgIG1vZGUua2V5d29yZHMgPSBjb21waWxlS2V5d29yZHMobW9kZS5rZXl3b3JkcywgbGFuZ3VhZ2UuY2FzZV9pbnNlbnNpdGl2ZSk7XG4gICAgfVxuXG4gICAgY21vZGUua2V5d29yZFBhdHRlcm5SZSA9IGxhbmdSZShrZXl3b3JkUGF0dGVybiwgdHJ1ZSk7XG5cbiAgICBpZiAocGFyZW50KSB7XG4gICAgICBpZiAoIW1vZGUuYmVnaW4pIG1vZGUuYmVnaW4gPSAvXFxCfFxcYi87XG4gICAgICBjbW9kZS5iZWdpblJlID0gbGFuZ1JlKGNtb2RlLmJlZ2luKTtcbiAgICAgIGlmICghbW9kZS5lbmQgJiYgIW1vZGUuZW5kc1dpdGhQYXJlbnQpIG1vZGUuZW5kID0gL1xcQnxcXGIvO1xuICAgICAgaWYgKG1vZGUuZW5kKSBjbW9kZS5lbmRSZSA9IGxhbmdSZShjbW9kZS5lbmQpO1xuICAgICAgY21vZGUudGVybWluYXRvckVuZCA9IHNvdXJjZShjbW9kZS5lbmQpIHx8ICcnO1xuICAgICAgaWYgKG1vZGUuZW5kc1dpdGhQYXJlbnQgJiYgcGFyZW50LnRlcm1pbmF0b3JFbmQpIHtcbiAgICAgICAgY21vZGUudGVybWluYXRvckVuZCArPSAobW9kZS5lbmQgPyAnfCcgOiAnJykgKyBwYXJlbnQudGVybWluYXRvckVuZDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG1vZGUuaWxsZWdhbCkgY21vZGUuaWxsZWdhbFJlID0gbGFuZ1JlKC8qKiBAdHlwZSB7UmVnRXhwIHwgc3RyaW5nfSAqLyAobW9kZS5pbGxlZ2FsKSk7XG4gICAgaWYgKCFtb2RlLmNvbnRhaW5zKSBtb2RlLmNvbnRhaW5zID0gW107XG5cbiAgICBtb2RlLmNvbnRhaW5zID0gW10uY29uY2F0KC4uLm1vZGUuY29udGFpbnMubWFwKGZ1bmN0aW9uKGMpIHtcbiAgICAgIHJldHVybiBleHBhbmRPckNsb25lTW9kZShjID09PSAnc2VsZicgPyBtb2RlIDogYyk7XG4gICAgfSkpO1xuICAgIG1vZGUuY29udGFpbnMuZm9yRWFjaChmdW5jdGlvbihjKSB7IGNvbXBpbGVNb2RlKC8qKiBAdHlwZSBNb2RlICovIChjKSwgY21vZGUpOyB9KTtcblxuICAgIGlmIChtb2RlLnN0YXJ0cykge1xuICAgICAgY29tcGlsZU1vZGUobW9kZS5zdGFydHMsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgY21vZGUubWF0Y2hlciA9IGJ1aWxkTW9kZVJlZ2V4KGNtb2RlKTtcbiAgICByZXR1cm4gY21vZGU7XG4gIH1cblxuICBpZiAoIWxhbmd1YWdlLmNvbXBpbGVyRXh0ZW5zaW9ucykgbGFuZ3VhZ2UuY29tcGlsZXJFeHRlbnNpb25zID0gW107XG5cbiAgLy8gc2VsZiBpcyBub3QgdmFsaWQgYXQgdGhlIHRvcC1sZXZlbFxuICBpZiAobGFuZ3VhZ2UuY29udGFpbnMgJiYgbGFuZ3VhZ2UuY29udGFpbnMuaW5jbHVkZXMoJ3NlbGYnKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkVSUjogY29udGFpbnMgYHNlbGZgIGlzIG5vdCBzdXBwb3J0ZWQgYXQgdGhlIHRvcC1sZXZlbCBvZiBhIGxhbmd1YWdlLiAgU2VlIGRvY3VtZW50YXRpb24uXCIpO1xuICB9XG5cbiAgLy8gd2UgbmVlZCBhIG51bGwgb2JqZWN0LCB3aGljaCBpbmhlcml0IHdpbGwgZ3VhcmFudGVlXG4gIGxhbmd1YWdlLmNsYXNzTmFtZUFsaWFzZXMgPSBpbmhlcml0JDEobGFuZ3VhZ2UuY2xhc3NOYW1lQWxpYXNlcyB8fCB7fSk7XG5cbiAgcmV0dXJuIGNvbXBpbGVNb2RlKC8qKiBAdHlwZSBNb2RlICovIChsYW5ndWFnZSkpO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgYSBtb2RlIGhhcyBhIGRlcGVuZGVuY3kgb24gaXQncyBwYXJlbnQgb3Igbm90XG4gKlxuICogSWYgYSBtb2RlIGRvZXMgaGF2ZSBhIHBhcmVudCBkZXBlbmRlbmN5IHRoZW4gb2Z0ZW4gd2UgbmVlZCB0byBjbG9uZSBpdCBpZlxuICogaXQncyB1c2VkIGluIG11bHRpcGxlIHBsYWNlcyBzbyB0aGF0IGVhY2ggY29weSBwb2ludHMgdG8gdGhlIGNvcnJlY3QgcGFyZW50LFxuICogd2hlcmUtYXMgbW9kZXMgd2l0aG91dCBhIHBhcmVudCBjYW4gb2Z0ZW4gc2FmZWx5IGJlIHJlLXVzZWQgYXQgdGhlIGJvdHRvbSBvZlxuICogYSBtb2RlIGNoYWluLlxuICpcbiAqIEBwYXJhbSB7TW9kZSB8IG51bGx9IG1vZGVcbiAqIEByZXR1cm5zIHtib29sZWFufSAtIGlzIHRoZXJlIGEgZGVwZW5kZW5jeSBvbiB0aGUgcGFyZW50P1xuICogKi9cbmZ1bmN0aW9uIGRlcGVuZGVuY3lPblBhcmVudChtb2RlKSB7XG4gIGlmICghbW9kZSkgcmV0dXJuIGZhbHNlO1xuXG4gIHJldHVybiBtb2RlLmVuZHNXaXRoUGFyZW50IHx8IGRlcGVuZGVuY3lPblBhcmVudChtb2RlLnN0YXJ0cyk7XG59XG5cbi8qKlxuICogRXhwYW5kcyBhIG1vZGUgb3IgY2xvbmVzIGl0IGlmIG5lY2Vzc2FyeVxuICpcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IGZvciBtb2RlcyB3aXRoIHBhcmVudGFsIGRlcGVuZGVuY2VpcyAoc2VlIG5vdGVzIG9uXG4gKiBgZGVwZW5kZW5jeU9uUGFyZW50YCkgYW5kIGZvciBub2RlcyB0aGF0IGhhdmUgYHZhcmlhbnRzYCAtIHdoaWNoIG11c3QgdGhlbiBiZVxuICogZXhwbG9kZWQgaW50byB0aGVpciBvd24gaW5kaXZpZHVhbCBtb2RlcyBhdCBjb21waWxlIHRpbWUuXG4gKlxuICogQHBhcmFtIHtNb2RlfSBtb2RlXG4gKiBAcmV0dXJucyB7TW9kZSB8IE1vZGVbXX1cbiAqICovXG5mdW5jdGlvbiBleHBhbmRPckNsb25lTW9kZShtb2RlKSB7XG4gIGlmIChtb2RlLnZhcmlhbnRzICYmICFtb2RlLmNhY2hlZFZhcmlhbnRzKSB7XG4gICAgbW9kZS5jYWNoZWRWYXJpYW50cyA9IG1vZGUudmFyaWFudHMubWFwKGZ1bmN0aW9uKHZhcmlhbnQpIHtcbiAgICAgIHJldHVybiBpbmhlcml0JDEobW9kZSwgeyB2YXJpYW50czogbnVsbCB9LCB2YXJpYW50KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIEVYUEFORFxuICAvLyBpZiB3ZSBoYXZlIHZhcmlhbnRzIHRoZW4gZXNzZW50aWFsbHkgXCJyZXBsYWNlXCIgdGhlIG1vZGUgd2l0aCB0aGUgdmFyaWFudHNcbiAgLy8gdGhpcyBoYXBwZW5zIGluIGNvbXBpbGVNb2RlLCB3aGVyZSB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBmcm9tXG4gIGlmIChtb2RlLmNhY2hlZFZhcmlhbnRzKSB7XG4gICAgcmV0dXJuIG1vZGUuY2FjaGVkVmFyaWFudHM7XG4gIH1cblxuICAvLyBDTE9ORVxuICAvLyBpZiB3ZSBoYXZlIGRlcGVuZGVuY2llcyBvbiBwYXJlbnRzIHRoZW4gd2UgbmVlZCBhIHVuaXF1ZVxuICAvLyBpbnN0YW5jZSBvZiBvdXJzZWx2ZXMsIHNvIHdlIGNhbiBiZSByZXVzZWQgd2l0aCBtYW55XG4gIC8vIGRpZmZlcmVudCBwYXJlbnRzIHdpdGhvdXQgaXNzdWVcbiAgaWYgKGRlcGVuZGVuY3lPblBhcmVudChtb2RlKSkge1xuICAgIHJldHVybiBpbmhlcml0JDEobW9kZSwgeyBzdGFydHM6IG1vZGUuc3RhcnRzID8gaW5oZXJpdCQxKG1vZGUuc3RhcnRzKSA6IG51bGwgfSk7XG4gIH1cblxuICBpZiAoT2JqZWN0LmlzRnJvemVuKG1vZGUpKSB7XG4gICAgcmV0dXJuIGluaGVyaXQkMShtb2RlKTtcbiAgfVxuXG4gIC8vIG5vIHNwZWNpYWwgZGVwZW5kZW5jeSBpc3N1ZXMsIGp1c3QgcmV0dXJuIG91cnNlbHZlc1xuICByZXR1cm4gbW9kZTtcbn1cblxudmFyIHZlcnNpb24gPSBcIjExLjExLjFcIjtcblxuY2xhc3MgSFRNTEluamVjdGlvbkVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihyZWFzb24sIGh0bWwpIHtcbiAgICBzdXBlcihyZWFzb24pO1xuICAgIHRoaXMubmFtZSA9IFwiSFRNTEluamVjdGlvbkVycm9yXCI7XG4gICAgdGhpcy5odG1sID0gaHRtbDtcbiAgfVxufVxuXG4vKlxuU3ludGF4IGhpZ2hsaWdodGluZyB3aXRoIGxhbmd1YWdlIGF1dG9kZXRlY3Rpb24uXG5odHRwczovL2hpZ2hsaWdodGpzLm9yZy9cbiovXG5cblxuXG4vKipcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLk1vZGV9IE1vZGVcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLkNvbXBpbGVkTW9kZX0gQ29tcGlsZWRNb2RlXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5Db21waWxlZFNjb3BlfSBDb21waWxlZFNjb3BlXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5MYW5ndWFnZX0gTGFuZ3VhZ2VcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLkhMSlNBcGl9IEhMSlNBcGlcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLkhMSlNQbHVnaW59IEhMSlNQbHVnaW5cbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLlBsdWdpbkV2ZW50fSBQbHVnaW5FdmVudFxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuSExKU09wdGlvbnN9IEhMSlNPcHRpb25zXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5MYW5ndWFnZUZufSBMYW5ndWFnZUZuXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5IaWdobGlnaHRlZEhUTUxFbGVtZW50fSBIaWdobGlnaHRlZEhUTUxFbGVtZW50XG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5CZWZvcmVIaWdobGlnaHRDb250ZXh0fSBCZWZvcmVIaWdobGlnaHRDb250ZXh0XG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMvcHJpdmF0ZScpLk1hdGNoVHlwZX0gTWF0Y2hUeXBlXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMvcHJpdmF0ZScpLktleXdvcmREYXRhfSBLZXl3b3JkRGF0YVxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzL3ByaXZhdGUnKS5FbmhhbmNlZE1hdGNofSBFbmhhbmNlZE1hdGNoXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMvcHJpdmF0ZScpLkFubm90YXRlZEVycm9yfSBBbm5vdGF0ZWRFcnJvclxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQXV0b0hpZ2hsaWdodFJlc3VsdH0gQXV0b0hpZ2hsaWdodFJlc3VsdFxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuSGlnaGxpZ2h0T3B0aW9uc30gSGlnaGxpZ2h0T3B0aW9uc1xuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuSGlnaGxpZ2h0UmVzdWx0fSBIaWdobGlnaHRSZXN1bHRcbiovXG5cblxuY29uc3QgZXNjYXBlID0gZXNjYXBlSFRNTDtcbmNvbnN0IGluaGVyaXQgPSBpbmhlcml0JDE7XG5jb25zdCBOT19NQVRDSCA9IFN5bWJvbChcIm5vbWF0Y2hcIik7XG5jb25zdCBNQVhfS0VZV09SRF9ISVRTID0gNztcblxuLyoqXG4gKiBAcGFyYW0ge2FueX0gaGxqcyAtIG9iamVjdCB0aGF0IGlzIGV4dGVuZGVkIChsZWdhY3kpXG4gKiBAcmV0dXJucyB7SExKU0FwaX1cbiAqL1xuY29uc3QgSExKUyA9IGZ1bmN0aW9uKGhsanMpIHtcbiAgLy8gR2xvYmFsIGludGVybmFsIHZhcmlhYmxlcyB1c2VkIHdpdGhpbiB0aGUgaGlnaGxpZ2h0LmpzIGxpYnJhcnkuXG4gIC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgTGFuZ3VhZ2U+fSAqL1xuICBjb25zdCBsYW5ndWFnZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHN0cmluZz59ICovXG4gIGNvbnN0IGFsaWFzZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAvKiogQHR5cGUge0hMSlNQbHVnaW5bXX0gKi9cbiAgY29uc3QgcGx1Z2lucyA9IFtdO1xuXG4gIC8vIHNhZmUvcHJvZHVjdGlvbiBtb2RlIC0gc3dhbGxvd3MgbW9yZSBlcnJvcnMsIHRyaWVzIHRvIGtlZXAgcnVubmluZ1xuICAvLyBldmVuIGlmIGEgc2luZ2xlIHN5bnRheCBvciBwYXJzZSBoaXRzIGEgZmF0YWwgZXJyb3JcbiAgbGV0IFNBRkVfTU9ERSA9IHRydWU7XG4gIGNvbnN0IExBTkdVQUdFX05PVF9GT1VORCA9IFwiQ291bGQgbm90IGZpbmQgdGhlIGxhbmd1YWdlICd7fScsIGRpZCB5b3UgZm9yZ2V0IHRvIGxvYWQvaW5jbHVkZSBhIGxhbmd1YWdlIG1vZHVsZT9cIjtcbiAgLyoqIEB0eXBlIHtMYW5ndWFnZX0gKi9cbiAgY29uc3QgUExBSU5URVhUX0xBTkdVQUdFID0geyBkaXNhYmxlQXV0b2RldGVjdDogdHJ1ZSwgbmFtZTogJ1BsYWluIHRleHQnLCBjb250YWluczogW10gfTtcblxuICAvLyBHbG9iYWwgb3B0aW9ucyB1c2VkIHdoZW4gd2l0aGluIGV4dGVybmFsIEFQSXMuIFRoaXMgaXMgbW9kaWZpZWQgd2hlblxuICAvLyBjYWxsaW5nIHRoZSBgaGxqcy5jb25maWd1cmVgIGZ1bmN0aW9uLlxuICAvKiogQHR5cGUgSExKU09wdGlvbnMgKi9cbiAgbGV0IG9wdGlvbnMgPSB7XG4gICAgaWdub3JlVW5lc2NhcGVkSFRNTDogZmFsc2UsXG4gICAgdGhyb3dVbmVzY2FwZWRIVE1MOiBmYWxzZSxcbiAgICBub0hpZ2hsaWdodFJlOiAvXihuby0/aGlnaGxpZ2h0KSQvaSxcbiAgICBsYW5ndWFnZURldGVjdFJlOiAvXFxibGFuZyg/OnVhZ2UpPy0oW1xcdy1dKylcXGIvaSxcbiAgICBjbGFzc1ByZWZpeDogJ2hsanMtJyxcbiAgICBjc3NTZWxlY3RvcjogJ3ByZSBjb2RlJyxcbiAgICBsYW5ndWFnZXM6IG51bGwsXG4gICAgLy8gYmV0YSBjb25maWd1cmF0aW9uIG9wdGlvbnMsIHN1YmplY3QgdG8gY2hhbmdlLCB3ZWxjb21lIHRvIGRpc2N1c3NcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vaGlnaGxpZ2h0anMvaGlnaGxpZ2h0LmpzL2lzc3Vlcy8xMDg2XG4gICAgX19lbWl0dGVyOiBUb2tlblRyZWVFbWl0dGVyXG4gIH07XG5cbiAgLyogVXRpbGl0eSBmdW5jdGlvbnMgKi9cblxuICAvKipcbiAgICogVGVzdHMgYSBsYW5ndWFnZSBuYW1lIHRvIHNlZSBpZiBoaWdobGlnaHRpbmcgc2hvdWxkIGJlIHNraXBwZWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGxhbmd1YWdlTmFtZVxuICAgKi9cbiAgZnVuY3Rpb24gc2hvdWxkTm90SGlnaGxpZ2h0KGxhbmd1YWdlTmFtZSkge1xuICAgIHJldHVybiBvcHRpb25zLm5vSGlnaGxpZ2h0UmUudGVzdChsYW5ndWFnZU5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7SGlnaGxpZ2h0ZWRIVE1MRWxlbWVudH0gYmxvY2sgLSB0aGUgSFRNTCBlbGVtZW50IHRvIGRldGVybWluZSBsYW5ndWFnZSBmb3JcbiAgICovXG4gIGZ1bmN0aW9uIGJsb2NrTGFuZ3VhZ2UoYmxvY2spIHtcbiAgICBsZXQgY2xhc3NlcyA9IGJsb2NrLmNsYXNzTmFtZSArICcgJztcblxuICAgIGNsYXNzZXMgKz0gYmxvY2sucGFyZW50Tm9kZSA/IGJsb2NrLnBhcmVudE5vZGUuY2xhc3NOYW1lIDogJyc7XG5cbiAgICAvLyBsYW5ndWFnZS0qIHRha2VzIHByZWNlZGVuY2Ugb3ZlciBub24tcHJlZml4ZWQgY2xhc3MgbmFtZXMuXG4gICAgY29uc3QgbWF0Y2ggPSBvcHRpb25zLmxhbmd1YWdlRGV0ZWN0UmUuZXhlYyhjbGFzc2VzKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIGNvbnN0IGxhbmd1YWdlID0gZ2V0TGFuZ3VhZ2UobWF0Y2hbMV0pO1xuICAgICAgaWYgKCFsYW5ndWFnZSkge1xuICAgICAgICB3YXJuKExBTkdVQUdFX05PVF9GT1VORC5yZXBsYWNlKFwie31cIiwgbWF0Y2hbMV0pKTtcbiAgICAgICAgd2FybihcIkZhbGxpbmcgYmFjayB0byBuby1oaWdobGlnaHQgbW9kZSBmb3IgdGhpcyBibG9jay5cIiwgYmxvY2spO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxhbmd1YWdlID8gbWF0Y2hbMV0gOiAnbm8taGlnaGxpZ2h0JztcbiAgICB9XG5cbiAgICByZXR1cm4gY2xhc3Nlc1xuICAgICAgLnNwbGl0KC9cXHMrLylcbiAgICAgIC5maW5kKChfY2xhc3MpID0+IHNob3VsZE5vdEhpZ2hsaWdodChfY2xhc3MpIHx8IGdldExhbmd1YWdlKF9jbGFzcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvcmUgaGlnaGxpZ2h0aW5nIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBPTEQgQVBJXG4gICAqIGhpZ2hsaWdodChsYW5nLCBjb2RlLCBpZ25vcmVJbGxlZ2FscywgY29udGludWF0aW9uKVxuICAgKlxuICAgKiBORVcgQVBJXG4gICAqIGhpZ2hsaWdodChjb2RlLCB7bGFuZywgaWdub3JlSWxsZWdhbHN9KVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZU9yTGFuZ3VhZ2VOYW1lIC0gdGhlIGxhbmd1YWdlIHRvIHVzZSBmb3IgaGlnaGxpZ2h0aW5nXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgSGlnaGxpZ2h0T3B0aW9uc30gb3B0aW9uc09yQ29kZSAtIHRoZSBjb2RlIHRvIGhpZ2hsaWdodFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpZ25vcmVJbGxlZ2Fsc10gLSB3aGV0aGVyIHRvIGlnbm9yZSBpbGxlZ2FsIG1hdGNoZXMsIGRlZmF1bHQgaXMgdG8gYmFpbFxuICAgKlxuICAgKiBAcmV0dXJucyB7SGlnaGxpZ2h0UmVzdWx0fSBSZXN1bHQgLSBhbiBvYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSByZXN1bHRcbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IGxhbmd1YWdlIC0gdGhlIGxhbmd1YWdlIG5hbWVcbiAgICogQHByb3BlcnR5IHtudW1iZXJ9IHJlbGV2YW5jZSAtIHRoZSByZWxldmFuY2Ugc2NvcmVcbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IHZhbHVlIC0gdGhlIGhpZ2hsaWdodGVkIEhUTUwgY29kZVxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gY29kZSAtIHRoZSBvcmlnaW5hbCByYXcgY29kZVxuICAgKiBAcHJvcGVydHkge0NvbXBpbGVkTW9kZX0gdG9wIC0gdG9wIG9mIHRoZSBjdXJyZW50IG1vZGUgc3RhY2tcbiAgICogQHByb3BlcnR5IHtib29sZWFufSBpbGxlZ2FsIC0gaW5kaWNhdGVzIHdoZXRoZXIgYW55IGlsbGVnYWwgbWF0Y2hlcyB3ZXJlIGZvdW5kXG4gICovXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodChjb2RlT3JMYW5ndWFnZU5hbWUsIG9wdGlvbnNPckNvZGUsIGlnbm9yZUlsbGVnYWxzKSB7XG4gICAgbGV0IGNvZGUgPSBcIlwiO1xuICAgIGxldCBsYW5ndWFnZU5hbWUgPSBcIlwiO1xuICAgIGlmICh0eXBlb2Ygb3B0aW9uc09yQ29kZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgY29kZSA9IGNvZGVPckxhbmd1YWdlTmFtZTtcbiAgICAgIGlnbm9yZUlsbGVnYWxzID0gb3B0aW9uc09yQ29kZS5pZ25vcmVJbGxlZ2FscztcbiAgICAgIGxhbmd1YWdlTmFtZSA9IG9wdGlvbnNPckNvZGUubGFuZ3VhZ2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIG9sZCBBUElcbiAgICAgIGRlcHJlY2F0ZWQoXCIxMC43LjBcIiwgXCJoaWdobGlnaHQobGFuZywgY29kZSwgLi4uYXJncykgaGFzIGJlZW4gZGVwcmVjYXRlZC5cIik7XG4gICAgICBkZXByZWNhdGVkKFwiMTAuNy4wXCIsIFwiUGxlYXNlIHVzZSBoaWdobGlnaHQoY29kZSwgb3B0aW9ucykgaW5zdGVhZC5cXG5odHRwczovL2dpdGh1Yi5jb20vaGlnaGxpZ2h0anMvaGlnaGxpZ2h0LmpzL2lzc3Vlcy8yMjc3XCIpO1xuICAgICAgbGFuZ3VhZ2VOYW1lID0gY29kZU9yTGFuZ3VhZ2VOYW1lO1xuICAgICAgY29kZSA9IG9wdGlvbnNPckNvZGU7XG4gICAgfVxuXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2hpZ2hsaWdodGpzL2hpZ2hsaWdodC5qcy9pc3N1ZXMvMzE0OVxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZmluZWRcbiAgICBpZiAoaWdub3JlSWxsZWdhbHMgPT09IHVuZGVmaW5lZCkgeyBpZ25vcmVJbGxlZ2FscyA9IHRydWU7IH1cblxuICAgIC8qKiBAdHlwZSB7QmVmb3JlSGlnaGxpZ2h0Q29udGV4dH0gKi9cbiAgICBjb25zdCBjb250ZXh0ID0ge1xuICAgICAgY29kZSxcbiAgICAgIGxhbmd1YWdlOiBsYW5ndWFnZU5hbWVcbiAgICB9O1xuICAgIC8vIHRoZSBwbHVnaW4gY2FuIGNoYW5nZSB0aGUgZGVzaXJlZCBsYW5ndWFnZSBvciB0aGUgY29kZSB0byBiZSBoaWdobGlnaHRlZFxuICAgIC8vIGp1c3QgYmUgY2hhbmdpbmcgdGhlIG9iamVjdCBpdCB3YXMgcGFzc2VkXG4gICAgZmlyZShcImJlZm9yZTpoaWdobGlnaHRcIiwgY29udGV4dCk7XG5cbiAgICAvLyBhIGJlZm9yZSBwbHVnaW4gY2FuIHVzdXJwIHRoZSByZXN1bHQgY29tcGxldGVseSBieSBwcm92aWRpbmcgaXQncyBvd25cbiAgICAvLyBpbiB3aGljaCBjYXNlIHdlIGRvbid0IGV2ZW4gbmVlZCB0byBjYWxsIGhpZ2hsaWdodFxuICAgIGNvbnN0IHJlc3VsdCA9IGNvbnRleHQucmVzdWx0XG4gICAgICA/IGNvbnRleHQucmVzdWx0XG4gICAgICA6IF9oaWdobGlnaHQoY29udGV4dC5sYW5ndWFnZSwgY29udGV4dC5jb2RlLCBpZ25vcmVJbGxlZ2Fscyk7XG5cbiAgICByZXN1bHQuY29kZSA9IGNvbnRleHQuY29kZTtcbiAgICAvLyB0aGUgcGx1Z2luIGNhbiBjaGFuZ2UgYW55dGhpbmcgaW4gcmVzdWx0IHRvIHN1aXRlIGl0XG4gICAgZmlyZShcImFmdGVyOmhpZ2hsaWdodFwiLCByZXN1bHQpO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBwcml2YXRlIGhpZ2hsaWdodCB0aGF0J3MgdXNlZCBpbnRlcm5hbGx5IGFuZCBkb2VzIG5vdCBmaXJlIGNhbGxiYWNrc1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2VOYW1lIC0gdGhlIGxhbmd1YWdlIHRvIHVzZSBmb3IgaGlnaGxpZ2h0aW5nXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlVG9IaWdobGlnaHQgLSB0aGUgY29kZSB0byBoaWdobGlnaHRcbiAgICogQHBhcmFtIHtib29sZWFuP30gW2lnbm9yZUlsbGVnYWxzXSAtIHdoZXRoZXIgdG8gaWdub3JlIGlsbGVnYWwgbWF0Y2hlcywgZGVmYXVsdCBpcyB0byBiYWlsXG4gICAqIEBwYXJhbSB7Q29tcGlsZWRNb2RlP30gW2NvbnRpbnVhdGlvbl0gLSBjdXJyZW50IGNvbnRpbnVhdGlvbiBtb2RlLCBpZiBhbnlcbiAgICogQHJldHVybnMge0hpZ2hsaWdodFJlc3VsdH0gLSByZXN1bHQgb2YgdGhlIGhpZ2hsaWdodCBvcGVyYXRpb25cbiAgKi9cbiAgZnVuY3Rpb24gX2hpZ2hsaWdodChsYW5ndWFnZU5hbWUsIGNvZGVUb0hpZ2hsaWdodCwgaWdub3JlSWxsZWdhbHMsIGNvbnRpbnVhdGlvbikge1xuICAgIGNvbnN0IGtleXdvcmRIaXRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybiBrZXl3b3JkIGRhdGEgaWYgYSBtYXRjaCBpcyBhIGtleXdvcmRcbiAgICAgKiBAcGFyYW0ge0NvbXBpbGVkTW9kZX0gbW9kZSAtIGN1cnJlbnQgbW9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtYXRjaFRleHQgLSB0aGUgdGV4dHVhbCBtYXRjaFxuICAgICAqIEByZXR1cm5zIHtLZXl3b3JkRGF0YSB8IGZhbHNlfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGtleXdvcmREYXRhKG1vZGUsIG1hdGNoVGV4dCkge1xuICAgICAgcmV0dXJuIG1vZGUua2V5d29yZHNbbWF0Y2hUZXh0XTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzS2V5d29yZHMoKSB7XG4gICAgICBpZiAoIXRvcC5rZXl3b3Jkcykge1xuICAgICAgICBlbWl0dGVyLmFkZFRleHQobW9kZUJ1ZmZlcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgbGV0IGxhc3RJbmRleCA9IDA7XG4gICAgICB0b3Aua2V5d29yZFBhdHRlcm5SZS5sYXN0SW5kZXggPSAwO1xuICAgICAgbGV0IG1hdGNoID0gdG9wLmtleXdvcmRQYXR0ZXJuUmUuZXhlYyhtb2RlQnVmZmVyKTtcbiAgICAgIGxldCBidWYgPSBcIlwiO1xuXG4gICAgICB3aGlsZSAobWF0Y2gpIHtcbiAgICAgICAgYnVmICs9IG1vZGVCdWZmZXIuc3Vic3RyaW5nKGxhc3RJbmRleCwgbWF0Y2guaW5kZXgpO1xuICAgICAgICBjb25zdCB3b3JkID0gbGFuZ3VhZ2UuY2FzZV9pbnNlbnNpdGl2ZSA/IG1hdGNoWzBdLnRvTG93ZXJDYXNlKCkgOiBtYXRjaFswXTtcbiAgICAgICAgY29uc3QgZGF0YSA9IGtleXdvcmREYXRhKHRvcCwgd29yZCk7XG4gICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgY29uc3QgW2tpbmQsIGtleXdvcmRSZWxldmFuY2VdID0gZGF0YTtcbiAgICAgICAgICBlbWl0dGVyLmFkZFRleHQoYnVmKTtcbiAgICAgICAgICBidWYgPSBcIlwiO1xuXG4gICAgICAgICAga2V5d29yZEhpdHNbd29yZF0gPSAoa2V5d29yZEhpdHNbd29yZF0gfHwgMCkgKyAxO1xuICAgICAgICAgIGlmIChrZXl3b3JkSGl0c1t3b3JkXSA8PSBNQVhfS0VZV09SRF9ISVRTKSByZWxldmFuY2UgKz0ga2V5d29yZFJlbGV2YW5jZTtcbiAgICAgICAgICBpZiAoa2luZC5zdGFydHNXaXRoKFwiX1wiKSkge1xuICAgICAgICAgICAgLy8gXyBpbXBsaWVkIGZvciByZWxldmFuY2Ugb25seSwgZG8gbm90IGhpZ2hsaWdodFxuICAgICAgICAgICAgLy8gYnkgYXBwbHlpbmcgYSBjbGFzcyBuYW1lXG4gICAgICAgICAgICBidWYgKz0gbWF0Y2hbMF07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGNzc0NsYXNzID0gbGFuZ3VhZ2UuY2xhc3NOYW1lQWxpYXNlc1traW5kXSB8fCBraW5kO1xuICAgICAgICAgICAgZW1pdEtleXdvcmQobWF0Y2hbMF0sIGNzc0NsYXNzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnVmICs9IG1hdGNoWzBdO1xuICAgICAgICB9XG4gICAgICAgIGxhc3RJbmRleCA9IHRvcC5rZXl3b3JkUGF0dGVyblJlLmxhc3RJbmRleDtcbiAgICAgICAgbWF0Y2ggPSB0b3Aua2V5d29yZFBhdHRlcm5SZS5leGVjKG1vZGVCdWZmZXIpO1xuICAgICAgfVxuICAgICAgYnVmICs9IG1vZGVCdWZmZXIuc3Vic3RyaW5nKGxhc3RJbmRleCk7XG4gICAgICBlbWl0dGVyLmFkZFRleHQoYnVmKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzU3ViTGFuZ3VhZ2UoKSB7XG4gICAgICBpZiAobW9kZUJ1ZmZlciA9PT0gXCJcIikgcmV0dXJuO1xuICAgICAgLyoqIEB0eXBlIEhpZ2hsaWdodFJlc3VsdCAqL1xuICAgICAgbGV0IHJlc3VsdCA9IG51bGw7XG5cbiAgICAgIGlmICh0eXBlb2YgdG9wLnN1Ykxhbmd1YWdlID09PSAnc3RyaW5nJykge1xuICAgICAgICBpZiAoIWxhbmd1YWdlc1t0b3Auc3ViTGFuZ3VhZ2VdKSB7XG4gICAgICAgICAgZW1pdHRlci5hZGRUZXh0KG1vZGVCdWZmZXIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgPSBfaGlnaGxpZ2h0KHRvcC5zdWJMYW5ndWFnZSwgbW9kZUJ1ZmZlciwgdHJ1ZSwgY29udGludWF0aW9uc1t0b3Auc3ViTGFuZ3VhZ2VdKTtcbiAgICAgICAgY29udGludWF0aW9uc1t0b3Auc3ViTGFuZ3VhZ2VdID0gLyoqIEB0eXBlIHtDb21waWxlZE1vZGV9ICovIChyZXN1bHQuX3RvcCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQgPSBoaWdobGlnaHRBdXRvKG1vZGVCdWZmZXIsIHRvcC5zdWJMYW5ndWFnZS5sZW5ndGggPyB0b3Auc3ViTGFuZ3VhZ2UgOiBudWxsKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ291bnRpbmcgZW1iZWRkZWQgbGFuZ3VhZ2Ugc2NvcmUgdG93YXJkcyB0aGUgaG9zdCBsYW5ndWFnZSBtYXkgYmUgZGlzYWJsZWRcbiAgICAgIC8vIHdpdGggemVyb2luZyB0aGUgY29udGFpbmluZyBtb2RlIHJlbGV2YW5jZS4gVXNlIGNhc2UgaW4gcG9pbnQgaXMgTWFya2Rvd24gdGhhdFxuICAgICAgLy8gYWxsb3dzIFhNTCBldmVyeXdoZXJlIGFuZCBtYWtlcyBldmVyeSBYTUwgc25pcHBldCB0byBoYXZlIGEgbXVjaCBsYXJnZXIgTWFya2Rvd25cbiAgICAgIC8vIHNjb3JlLlxuICAgICAgaWYgKHRvcC5yZWxldmFuY2UgPiAwKSB7XG4gICAgICAgIHJlbGV2YW5jZSArPSByZXN1bHQucmVsZXZhbmNlO1xuICAgICAgfVxuICAgICAgZW1pdHRlci5fX2FkZFN1Ymxhbmd1YWdlKHJlc3VsdC5fZW1pdHRlciwgcmVzdWx0Lmxhbmd1YWdlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzQnVmZmVyKCkge1xuICAgICAgaWYgKHRvcC5zdWJMYW5ndWFnZSAhPSBudWxsKSB7XG4gICAgICAgIHByb2Nlc3NTdWJMYW5ndWFnZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJvY2Vzc0tleXdvcmRzKCk7XG4gICAgICB9XG4gICAgICBtb2RlQnVmZmVyID0gJyc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2NvcGVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBlbWl0S2V5d29yZChrZXl3b3JkLCBzY29wZSkge1xuICAgICAgaWYgKGtleXdvcmQgPT09IFwiXCIpIHJldHVybjtcblxuICAgICAgZW1pdHRlci5zdGFydFNjb3BlKHNjb3BlKTtcbiAgICAgIGVtaXR0ZXIuYWRkVGV4dChrZXl3b3JkKTtcbiAgICAgIGVtaXR0ZXIuZW5kU2NvcGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge0NvbXBpbGVkU2NvcGV9IHNjb3BlXG4gICAgICogQHBhcmFtIHtSZWdFeHBNYXRjaEFycmF5fSBtYXRjaFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGVtaXRNdWx0aUNsYXNzKHNjb3BlLCBtYXRjaCkge1xuICAgICAgbGV0IGkgPSAxO1xuICAgICAgY29uc3QgbWF4ID0gbWF0Y2gubGVuZ3RoIC0gMTtcbiAgICAgIHdoaWxlIChpIDw9IG1heCkge1xuICAgICAgICBpZiAoIXNjb3BlLl9lbWl0W2ldKSB7IGkrKzsgY29udGludWU7IH1cbiAgICAgICAgY29uc3Qga2xhc3MgPSBsYW5ndWFnZS5jbGFzc05hbWVBbGlhc2VzW3Njb3BlW2ldXSB8fCBzY29wZVtpXTtcbiAgICAgICAgY29uc3QgdGV4dCA9IG1hdGNoW2ldO1xuICAgICAgICBpZiAoa2xhc3MpIHtcbiAgICAgICAgICBlbWl0S2V5d29yZCh0ZXh0LCBrbGFzcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbW9kZUJ1ZmZlciA9IHRleHQ7XG4gICAgICAgICAgcHJvY2Vzc0tleXdvcmRzKCk7XG4gICAgICAgICAgbW9kZUJ1ZmZlciA9IFwiXCI7XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7Q29tcGlsZWRNb2RlfSBtb2RlIC0gbmV3IG1vZGUgdG8gc3RhcnRcbiAgICAgKiBAcGFyYW0ge1JlZ0V4cE1hdGNoQXJyYXl9IG1hdGNoXG4gICAgICovXG4gICAgZnVuY3Rpb24gc3RhcnROZXdNb2RlKG1vZGUsIG1hdGNoKSB7XG4gICAgICBpZiAobW9kZS5zY29wZSAmJiB0eXBlb2YgbW9kZS5zY29wZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBlbWl0dGVyLm9wZW5Ob2RlKGxhbmd1YWdlLmNsYXNzTmFtZUFsaWFzZXNbbW9kZS5zY29wZV0gfHwgbW9kZS5zY29wZSk7XG4gICAgICB9XG4gICAgICBpZiAobW9kZS5iZWdpblNjb3BlKSB7XG4gICAgICAgIC8vIGJlZ2luU2NvcGUganVzdCB3cmFwcyB0aGUgYmVnaW4gbWF0Y2ggaXRzZWxmIGluIGEgc2NvcGVcbiAgICAgICAgaWYgKG1vZGUuYmVnaW5TY29wZS5fd3JhcCkge1xuICAgICAgICAgIGVtaXRLZXl3b3JkKG1vZGVCdWZmZXIsIGxhbmd1YWdlLmNsYXNzTmFtZUFsaWFzZXNbbW9kZS5iZWdpblNjb3BlLl93cmFwXSB8fCBtb2RlLmJlZ2luU2NvcGUuX3dyYXApO1xuICAgICAgICAgIG1vZGVCdWZmZXIgPSBcIlwiO1xuICAgICAgICB9IGVsc2UgaWYgKG1vZGUuYmVnaW5TY29wZS5fbXVsdGkpIHtcbiAgICAgICAgICAvLyBhdCB0aGlzIHBvaW50IG1vZGVCdWZmZXIgc2hvdWxkIGp1c3QgYmUgdGhlIG1hdGNoXG4gICAgICAgICAgZW1pdE11bHRpQ2xhc3MobW9kZS5iZWdpblNjb3BlLCBtYXRjaCk7XG4gICAgICAgICAgbW9kZUJ1ZmZlciA9IFwiXCI7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdG9wID0gT2JqZWN0LmNyZWF0ZShtb2RlLCB7IHBhcmVudDogeyB2YWx1ZTogdG9wIH0gfSk7XG4gICAgICByZXR1cm4gdG9wO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7Q29tcGlsZWRNb2RlIH0gbW9kZSAtIHRoZSBtb2RlIHRvIHBvdGVudGlhbGx5IGVuZFxuICAgICAqIEBwYXJhbSB7UmVnRXhwTWF0Y2hBcnJheX0gbWF0Y2ggLSB0aGUgbGF0ZXN0IG1hdGNoXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1hdGNoUGx1c1JlbWFpbmRlciAtIG1hdGNoIHBsdXMgcmVtYWluZGVyIG9mIGNvbnRlbnRcbiAgICAgKiBAcmV0dXJucyB7Q29tcGlsZWRNb2RlIHwgdm9pZH0gLSB0aGUgbmV4dCBtb2RlLCBvciBpZiB2b2lkIGNvbnRpbnVlIG9uIGluIGN1cnJlbnQgbW9kZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGVuZE9mTW9kZShtb2RlLCBtYXRjaCwgbWF0Y2hQbHVzUmVtYWluZGVyKSB7XG4gICAgICBsZXQgbWF0Y2hlZCA9IHN0YXJ0c1dpdGgobW9kZS5lbmRSZSwgbWF0Y2hQbHVzUmVtYWluZGVyKTtcblxuICAgICAgaWYgKG1hdGNoZWQpIHtcbiAgICAgICAgaWYgKG1vZGVbXCJvbjplbmRcIl0pIHtcbiAgICAgICAgICBjb25zdCByZXNwID0gbmV3IFJlc3BvbnNlKG1vZGUpO1xuICAgICAgICAgIG1vZGVbXCJvbjplbmRcIl0obWF0Y2gsIHJlc3ApO1xuICAgICAgICAgIGlmIChyZXNwLmlzTWF0Y2hJZ25vcmVkKSBtYXRjaGVkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWF0Y2hlZCkge1xuICAgICAgICAgIHdoaWxlIChtb2RlLmVuZHNQYXJlbnQgJiYgbW9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgIG1vZGUgPSBtb2RlLnBhcmVudDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG1vZGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGV2ZW4gaWYgb246ZW5kIGZpcmVzIGFuIGBpZ25vcmVgIGl0J3Mgc3RpbGwgcG9zc2libGVcbiAgICAgIC8vIHRoYXQgd2UgbWlnaHQgdHJpZ2dlciB0aGUgZW5kIG5vZGUgYmVjYXVzZSBvZiBhIHBhcmVudCBtb2RlXG4gICAgICBpZiAobW9kZS5lbmRzV2l0aFBhcmVudCkge1xuICAgICAgICByZXR1cm4gZW5kT2ZNb2RlKG1vZGUucGFyZW50LCBtYXRjaCwgbWF0Y2hQbHVzUmVtYWluZGVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGUgbWF0Y2hpbmcgYnV0IHRoZW4gaWdub3JpbmcgYSBzZXF1ZW5jZSBvZiB0ZXh0XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbGV4ZW1lIC0gc3RyaW5nIGNvbnRhaW5pbmcgZnVsbCBtYXRjaCB0ZXh0XG4gICAgICovXG4gICAgZnVuY3Rpb24gZG9JZ25vcmUobGV4ZW1lKSB7XG4gICAgICBpZiAodG9wLm1hdGNoZXIucmVnZXhJbmRleCA9PT0gMCkge1xuICAgICAgICAvLyBubyBtb3JlIHJlZ2V4ZXMgdG8gcG90ZW50aWFsbHkgbWF0Y2ggaGVyZSwgc28gd2UgbW92ZSB0aGUgY3Vyc29yIGZvcndhcmQgb25lXG4gICAgICAgIC8vIHNwYWNlXG4gICAgICAgIG1vZGVCdWZmZXIgKz0gbGV4ZW1lWzBdO1xuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIG5vIG5lZWQgdG8gbW92ZSB0aGUgY3Vyc29yLCB3ZSBzdGlsbCBoYXZlIGFkZGl0aW9uYWwgcmVnZXhlcyB0byB0cnkgYW5kXG4gICAgICAgIC8vIG1hdGNoIGF0IHRoaXMgdmVyeSBzcG90XG4gICAgICAgIHJlc3VtZVNjYW5BdFNhbWVQb3NpdGlvbiA9IHRydWU7XG4gICAgICAgIHJldHVybiAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhhbmRsZSB0aGUgc3RhcnQgb2YgYSBuZXcgcG90ZW50aWFsIG1vZGUgbWF0Y2hcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RW5oYW5jZWRNYXRjaH0gbWF0Y2ggLSB0aGUgY3VycmVudCBtYXRjaFxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IGhvdyBmYXIgdG8gYWR2YW5jZSB0aGUgcGFyc2UgY3Vyc29yXG4gICAgICovXG4gICAgZnVuY3Rpb24gZG9CZWdpbk1hdGNoKG1hdGNoKSB7XG4gICAgICBjb25zdCBsZXhlbWUgPSBtYXRjaFswXTtcbiAgICAgIGNvbnN0IG5ld01vZGUgPSBtYXRjaC5ydWxlO1xuXG4gICAgICBjb25zdCByZXNwID0gbmV3IFJlc3BvbnNlKG5ld01vZGUpO1xuICAgICAgLy8gZmlyc3QgaW50ZXJuYWwgYmVmb3JlIGNhbGxiYWNrcywgdGhlbiB0aGUgcHVibGljIG9uZXNcbiAgICAgIGNvbnN0IGJlZm9yZUNhbGxiYWNrcyA9IFtuZXdNb2RlLl9fYmVmb3JlQmVnaW4sIG5ld01vZGVbXCJvbjpiZWdpblwiXV07XG4gICAgICBmb3IgKGNvbnN0IGNiIG9mIGJlZm9yZUNhbGxiYWNrcykge1xuICAgICAgICBpZiAoIWNiKSBjb250aW51ZTtcbiAgICAgICAgY2IobWF0Y2gsIHJlc3ApO1xuICAgICAgICBpZiAocmVzcC5pc01hdGNoSWdub3JlZCkgcmV0dXJuIGRvSWdub3JlKGxleGVtZSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChuZXdNb2RlLnNraXApIHtcbiAgICAgICAgbW9kZUJ1ZmZlciArPSBsZXhlbWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobmV3TW9kZS5leGNsdWRlQmVnaW4pIHtcbiAgICAgICAgICBtb2RlQnVmZmVyICs9IGxleGVtZTtcbiAgICAgICAgfVxuICAgICAgICBwcm9jZXNzQnVmZmVyKCk7XG4gICAgICAgIGlmICghbmV3TW9kZS5yZXR1cm5CZWdpbiAmJiAhbmV3TW9kZS5leGNsdWRlQmVnaW4pIHtcbiAgICAgICAgICBtb2RlQnVmZmVyID0gbGV4ZW1lO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzdGFydE5ld01vZGUobmV3TW9kZSwgbWF0Y2gpO1xuICAgICAgcmV0dXJuIG5ld01vZGUucmV0dXJuQmVnaW4gPyAwIDogbGV4ZW1lLmxlbmd0aDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGUgdGhlIHBvdGVudGlhbCBlbmQgb2YgbW9kZVxuICAgICAqXG4gICAgICogQHBhcmFtIHtSZWdFeHBNYXRjaEFycmF5fSBtYXRjaCAtIHRoZSBjdXJyZW50IG1hdGNoXG4gICAgICovXG4gICAgZnVuY3Rpb24gZG9FbmRNYXRjaChtYXRjaCkge1xuICAgICAgY29uc3QgbGV4ZW1lID0gbWF0Y2hbMF07XG4gICAgICBjb25zdCBtYXRjaFBsdXNSZW1haW5kZXIgPSBjb2RlVG9IaWdobGlnaHQuc3Vic3RyaW5nKG1hdGNoLmluZGV4KTtcblxuICAgICAgY29uc3QgZW5kTW9kZSA9IGVuZE9mTW9kZSh0b3AsIG1hdGNoLCBtYXRjaFBsdXNSZW1haW5kZXIpO1xuICAgICAgaWYgKCFlbmRNb2RlKSB7IHJldHVybiBOT19NQVRDSDsgfVxuXG4gICAgICBjb25zdCBvcmlnaW4gPSB0b3A7XG4gICAgICBpZiAodG9wLmVuZFNjb3BlICYmIHRvcC5lbmRTY29wZS5fd3JhcCkge1xuICAgICAgICBwcm9jZXNzQnVmZmVyKCk7XG4gICAgICAgIGVtaXRLZXl3b3JkKGxleGVtZSwgdG9wLmVuZFNjb3BlLl93cmFwKTtcbiAgICAgIH0gZWxzZSBpZiAodG9wLmVuZFNjb3BlICYmIHRvcC5lbmRTY29wZS5fbXVsdGkpIHtcbiAgICAgICAgcHJvY2Vzc0J1ZmZlcigpO1xuICAgICAgICBlbWl0TXVsdGlDbGFzcyh0b3AuZW5kU2NvcGUsIG1hdGNoKTtcbiAgICAgIH0gZWxzZSBpZiAob3JpZ2luLnNraXApIHtcbiAgICAgICAgbW9kZUJ1ZmZlciArPSBsZXhlbWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIShvcmlnaW4ucmV0dXJuRW5kIHx8IG9yaWdpbi5leGNsdWRlRW5kKSkge1xuICAgICAgICAgIG1vZGVCdWZmZXIgKz0gbGV4ZW1lO1xuICAgICAgICB9XG4gICAgICAgIHByb2Nlc3NCdWZmZXIoKTtcbiAgICAgICAgaWYgKG9yaWdpbi5leGNsdWRlRW5kKSB7XG4gICAgICAgICAgbW9kZUJ1ZmZlciA9IGxleGVtZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZG8ge1xuICAgICAgICBpZiAodG9wLnNjb3BlKSB7XG4gICAgICAgICAgZW1pdHRlci5jbG9zZU5vZGUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRvcC5za2lwICYmICF0b3Auc3ViTGFuZ3VhZ2UpIHtcbiAgICAgICAgICByZWxldmFuY2UgKz0gdG9wLnJlbGV2YW5jZTtcbiAgICAgICAgfVxuICAgICAgICB0b3AgPSB0b3AucGFyZW50O1xuICAgICAgfSB3aGlsZSAodG9wICE9PSBlbmRNb2RlLnBhcmVudCk7XG4gICAgICBpZiAoZW5kTW9kZS5zdGFydHMpIHtcbiAgICAgICAgc3RhcnROZXdNb2RlKGVuZE1vZGUuc3RhcnRzLCBtYXRjaCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gb3JpZ2luLnJldHVybkVuZCA/IDAgOiBsZXhlbWUubGVuZ3RoO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NDb250aW51YXRpb25zKCkge1xuICAgICAgY29uc3QgbGlzdCA9IFtdO1xuICAgICAgZm9yIChsZXQgY3VycmVudCA9IHRvcDsgY3VycmVudCAhPT0gbGFuZ3VhZ2U7IGN1cnJlbnQgPSBjdXJyZW50LnBhcmVudCkge1xuICAgICAgICBpZiAoY3VycmVudC5zY29wZSkge1xuICAgICAgICAgIGxpc3QudW5zaGlmdChjdXJyZW50LnNjb3BlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbGlzdC5mb3JFYWNoKGl0ZW0gPT4gZW1pdHRlci5vcGVuTm9kZShpdGVtKSk7XG4gICAgfVxuXG4gICAgLyoqIEB0eXBlIHt7dHlwZT86IE1hdGNoVHlwZSwgaW5kZXg/OiBudW1iZXIsIHJ1bGU/OiBNb2RlfX19ICovXG4gICAgbGV0IGxhc3RNYXRjaCA9IHt9O1xuXG4gICAgLyoqXG4gICAgICogIFByb2Nlc3MgYW4gaW5kaXZpZHVhbCBtYXRjaFxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHRCZWZvcmVNYXRjaCAtIHRleHQgcHJlY2VkaW5nIHRoZSBtYXRjaCAoc2luY2UgdGhlIGxhc3QgbWF0Y2gpXG4gICAgICogQHBhcmFtIHtFbmhhbmNlZE1hdGNofSBbbWF0Y2hdIC0gdGhlIG1hdGNoIGl0c2VsZlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHByb2Nlc3NMZXhlbWUodGV4dEJlZm9yZU1hdGNoLCBtYXRjaCkge1xuICAgICAgY29uc3QgbGV4ZW1lID0gbWF0Y2ggJiYgbWF0Y2hbMF07XG5cbiAgICAgIC8vIGFkZCBub24tbWF0Y2hlZCB0ZXh0IHRvIHRoZSBjdXJyZW50IG1vZGUgYnVmZmVyXG4gICAgICBtb2RlQnVmZmVyICs9IHRleHRCZWZvcmVNYXRjaDtcblxuICAgICAgaWYgKGxleGVtZSA9PSBudWxsKSB7XG4gICAgICAgIHByb2Nlc3NCdWZmZXIoKTtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9XG5cbiAgICAgIC8vIHdlJ3ZlIGZvdW5kIGEgMCB3aWR0aCBtYXRjaCBhbmQgd2UncmUgc3R1Y2ssIHNvIHdlIG5lZWQgdG8gYWR2YW5jZVxuICAgICAgLy8gdGhpcyBoYXBwZW5zIHdoZW4gd2UgaGF2ZSBiYWRseSBiZWhhdmVkIHJ1bGVzIHRoYXQgaGF2ZSBvcHRpb25hbCBtYXRjaGVycyB0byB0aGUgZGVncmVlIHRoYXRcbiAgICAgIC8vIHNvbWV0aW1lcyB0aGV5IGNhbiBlbmQgdXAgbWF0Y2hpbmcgbm90aGluZyBhdCBhbGxcbiAgICAgIC8vIFJlZjogaHR0cHM6Ly9naXRodWIuY29tL2hpZ2hsaWdodGpzL2hpZ2hsaWdodC5qcy9pc3N1ZXMvMjE0MFxuICAgICAgaWYgKGxhc3RNYXRjaC50eXBlID09PSBcImJlZ2luXCIgJiYgbWF0Y2gudHlwZSA9PT0gXCJlbmRcIiAmJiBsYXN0TWF0Y2guaW5kZXggPT09IG1hdGNoLmluZGV4ICYmIGxleGVtZSA9PT0gXCJcIikge1xuICAgICAgICAvLyBzcGl0IHRoZSBcInNraXBwZWRcIiBjaGFyYWN0ZXIgdGhhdCBvdXIgcmVnZXggY2hva2VkIG9uIGJhY2sgaW50byB0aGUgb3V0cHV0IHNlcXVlbmNlXG4gICAgICAgIG1vZGVCdWZmZXIgKz0gY29kZVRvSGlnaGxpZ2h0LnNsaWNlKG1hdGNoLmluZGV4LCBtYXRjaC5pbmRleCArIDEpO1xuICAgICAgICBpZiAoIVNBRkVfTU9ERSkge1xuICAgICAgICAgIC8qKiBAdHlwZSB7QW5ub3RhdGVkRXJyb3J9ICovXG4gICAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKGAwIHdpZHRoIG1hdGNoIHJlZ2V4ICgke2xhbmd1YWdlTmFtZX0pYCk7XG4gICAgICAgICAgZXJyLmxhbmd1YWdlTmFtZSA9IGxhbmd1YWdlTmFtZTtcbiAgICAgICAgICBlcnIuYmFkUnVsZSA9IGxhc3RNYXRjaC5ydWxlO1xuICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cbiAgICAgIGxhc3RNYXRjaCA9IG1hdGNoO1xuXG4gICAgICBpZiAobWF0Y2gudHlwZSA9PT0gXCJiZWdpblwiKSB7XG4gICAgICAgIHJldHVybiBkb0JlZ2luTWF0Y2gobWF0Y2gpO1xuICAgICAgfSBlbHNlIGlmIChtYXRjaC50eXBlID09PSBcImlsbGVnYWxcIiAmJiAhaWdub3JlSWxsZWdhbHMpIHtcbiAgICAgICAgLy8gaWxsZWdhbCBtYXRjaCwgd2UgZG8gbm90IGNvbnRpbnVlIHByb2Nlc3NpbmdcbiAgICAgICAgLyoqIEB0eXBlIHtBbm5vdGF0ZWRFcnJvcn0gKi9cbiAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdJbGxlZ2FsIGxleGVtZSBcIicgKyBsZXhlbWUgKyAnXCIgZm9yIG1vZGUgXCInICsgKHRvcC5zY29wZSB8fCAnPHVubmFtZWQ+JykgKyAnXCInKTtcbiAgICAgICAgZXJyLm1vZGUgPSB0b3A7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH0gZWxzZSBpZiAobWF0Y2gudHlwZSA9PT0gXCJlbmRcIikge1xuICAgICAgICBjb25zdCBwcm9jZXNzZWQgPSBkb0VuZE1hdGNoKG1hdGNoKTtcbiAgICAgICAgaWYgKHByb2Nlc3NlZCAhPT0gTk9fTUFUQ0gpIHtcbiAgICAgICAgICByZXR1cm4gcHJvY2Vzc2VkO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIGVkZ2UgY2FzZSBmb3Igd2hlbiBpbGxlZ2FsIG1hdGNoZXMgJCAoZW5kIG9mIGxpbmUpIHdoaWNoIGlzIHRlY2huaWNhbGx5XG4gICAgICAvLyBhIDAgd2lkdGggbWF0Y2ggYnV0IG5vdCBhIGJlZ2luL2VuZCBtYXRjaCBzbyBpdCdzIG5vdCBjYXVnaHQgYnkgdGhlXG4gICAgICAvLyBmaXJzdCBoYW5kbGVyICh3aGVuIGlnbm9yZUlsbGVnYWxzIGlzIHRydWUpXG4gICAgICBpZiAobWF0Y2gudHlwZSA9PT0gXCJpbGxlZ2FsXCIgJiYgbGV4ZW1lID09PSBcIlwiKSB7XG4gICAgICAgIC8vIGFkdmFuY2Ugc28gd2UgYXJlbid0IHN0dWNrIGluIGFuIGluZmluaXRlIGxvb3BcbiAgICAgICAgbW9kZUJ1ZmZlciArPSBcIlxcblwiO1xuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cblxuICAgICAgLy8gaW5maW5pdGUgbG9vcHMgYXJlIEJBRCwgdGhpcyBpcyBhIGxhc3QgZGl0Y2ggY2F0Y2ggYWxsLiBpZiB3ZSBoYXZlIGFcbiAgICAgIC8vIGRlY2VudCBudW1iZXIgb2YgaXRlcmF0aW9ucyB5ZXQgb3VyIGluZGV4IChjdXJzb3IgcG9zaXRpb24gaW4gb3VyXG4gICAgICAvLyBwYXJzaW5nKSBzdGlsbCAzeCBiZWhpbmQgb3VyIGluZGV4IHRoZW4gc29tZXRoaW5nIGlzIHZlcnkgd3JvbmdcbiAgICAgIC8vIHNvIHdlIGJhaWxcbiAgICAgIGlmIChpdGVyYXRpb25zID4gMTAwMDAwICYmIGl0ZXJhdGlvbnMgPiBtYXRjaC5pbmRleCAqIDMpIHtcbiAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdwb3RlbnRpYWwgaW5maW5pdGUgbG9vcCwgd2F5IG1vcmUgaXRlcmF0aW9ucyB0aGFuIG1hdGNoZXMnKTtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuXG4gICAgICAvKlxuICAgICAgV2h5IG1pZ2h0IGJlIGZpbmQgb3Vyc2VsdmVzIGhlcmU/ICBBbiBwb3RlbnRpYWwgZW5kIG1hdGNoIHRoYXQgd2FzXG4gICAgICB0cmlnZ2VyZWQgYnV0IGNvdWxkIG5vdCBiZSBjb21wbGV0ZWQuICBJRSwgYGRvRW5kTWF0Y2hgIHJldHVybmVkIE5PX01BVENILlxuICAgICAgKHRoaXMgY291bGQgYmUgYmVjYXVzZSBhIGNhbGxiYWNrIHJlcXVlc3RzIHRoZSBtYXRjaCBiZSBpZ25vcmVkLCBldGMpXG5cbiAgICAgIFRoaXMgY2F1c2VzIG5vIHJlYWwgaGFybSBvdGhlciB0aGFuIHN0b3BwaW5nIGEgZmV3IHRpbWVzIHRvbyBtYW55LlxuICAgICAgKi9cblxuICAgICAgbW9kZUJ1ZmZlciArPSBsZXhlbWU7XG4gICAgICByZXR1cm4gbGV4ZW1lLmxlbmd0aDtcbiAgICB9XG5cbiAgICBjb25zdCBsYW5ndWFnZSA9IGdldExhbmd1YWdlKGxhbmd1YWdlTmFtZSk7XG4gICAgaWYgKCFsYW5ndWFnZSkge1xuICAgICAgZXJyb3IoTEFOR1VBR0VfTk9UX0ZPVU5ELnJlcGxhY2UoXCJ7fVwiLCBsYW5ndWFnZU5hbWUpKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBsYW5ndWFnZTogXCInICsgbGFuZ3VhZ2VOYW1lICsgJ1wiJyk7XG4gICAgfVxuXG4gICAgY29uc3QgbWQgPSBjb21waWxlTGFuZ3VhZ2UobGFuZ3VhZ2UpO1xuICAgIGxldCByZXN1bHQgPSAnJztcbiAgICAvKiogQHR5cGUge0NvbXBpbGVkTW9kZX0gKi9cbiAgICBsZXQgdG9wID0gY29udGludWF0aW9uIHx8IG1kO1xuICAgIC8qKiBAdHlwZSBSZWNvcmQ8c3RyaW5nLENvbXBpbGVkTW9kZT4gKi9cbiAgICBjb25zdCBjb250aW51YXRpb25zID0ge307IC8vIGtlZXAgY29udGludWF0aW9ucyBmb3Igc3ViLWxhbmd1YWdlc1xuICAgIGNvbnN0IGVtaXR0ZXIgPSBuZXcgb3B0aW9ucy5fX2VtaXR0ZXIob3B0aW9ucyk7XG4gICAgcHJvY2Vzc0NvbnRpbnVhdGlvbnMoKTtcbiAgICBsZXQgbW9kZUJ1ZmZlciA9ICcnO1xuICAgIGxldCByZWxldmFuY2UgPSAwO1xuICAgIGxldCBpbmRleCA9IDA7XG4gICAgbGV0IGl0ZXJhdGlvbnMgPSAwO1xuICAgIGxldCByZXN1bWVTY2FuQXRTYW1lUG9zaXRpb24gPSBmYWxzZTtcblxuICAgIHRyeSB7XG4gICAgICBpZiAoIWxhbmd1YWdlLl9fZW1pdFRva2Vucykge1xuICAgICAgICB0b3AubWF0Y2hlci5jb25zaWRlckFsbCgpO1xuXG4gICAgICAgIGZvciAoOzspIHtcbiAgICAgICAgICBpdGVyYXRpb25zKys7XG4gICAgICAgICAgaWYgKHJlc3VtZVNjYW5BdFNhbWVQb3NpdGlvbikge1xuICAgICAgICAgICAgLy8gb25seSByZWdleGVzIG5vdCBtYXRjaGVkIHByZXZpb3VzbHkgd2lsbCBub3cgYmVcbiAgICAgICAgICAgIC8vIGNvbnNpZGVyZWQgZm9yIGEgcG90ZW50aWFsIG1hdGNoXG4gICAgICAgICAgICByZXN1bWVTY2FuQXRTYW1lUG9zaXRpb24gPSBmYWxzZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9wLm1hdGNoZXIuY29uc2lkZXJBbGwoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdG9wLm1hdGNoZXIubGFzdEluZGV4ID0gaW5kZXg7XG5cbiAgICAgICAgICBjb25zdCBtYXRjaCA9IHRvcC5tYXRjaGVyLmV4ZWMoY29kZVRvSGlnaGxpZ2h0KTtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIm1hdGNoXCIsIG1hdGNoWzBdLCBtYXRjaC5ydWxlICYmIG1hdGNoLnJ1bGUuYmVnaW4pXG5cbiAgICAgICAgICBpZiAoIW1hdGNoKSBicmVhaztcblxuICAgICAgICAgIGNvbnN0IGJlZm9yZU1hdGNoID0gY29kZVRvSGlnaGxpZ2h0LnN1YnN0cmluZyhpbmRleCwgbWF0Y2guaW5kZXgpO1xuICAgICAgICAgIGNvbnN0IHByb2Nlc3NlZENvdW50ID0gcHJvY2Vzc0xleGVtZShiZWZvcmVNYXRjaCwgbWF0Y2gpO1xuICAgICAgICAgIGluZGV4ID0gbWF0Y2guaW5kZXggKyBwcm9jZXNzZWRDb3VudDtcbiAgICAgICAgfVxuICAgICAgICBwcm9jZXNzTGV4ZW1lKGNvZGVUb0hpZ2hsaWdodC5zdWJzdHJpbmcoaW5kZXgpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxhbmd1YWdlLl9fZW1pdFRva2Vucyhjb2RlVG9IaWdobGlnaHQsIGVtaXR0ZXIpO1xuICAgICAgfVxuXG4gICAgICBlbWl0dGVyLmZpbmFsaXplKCk7XG4gICAgICByZXN1bHQgPSBlbWl0dGVyLnRvSFRNTCgpO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBsYW5ndWFnZTogbGFuZ3VhZ2VOYW1lLFxuICAgICAgICB2YWx1ZTogcmVzdWx0LFxuICAgICAgICByZWxldmFuY2UsXG4gICAgICAgIGlsbGVnYWw6IGZhbHNlLFxuICAgICAgICBfZW1pdHRlcjogZW1pdHRlcixcbiAgICAgICAgX3RvcDogdG9wXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgaWYgKGVyci5tZXNzYWdlICYmIGVyci5tZXNzYWdlLmluY2x1ZGVzKCdJbGxlZ2FsJykpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBsYW5ndWFnZTogbGFuZ3VhZ2VOYW1lLFxuICAgICAgICAgIHZhbHVlOiBlc2NhcGUoY29kZVRvSGlnaGxpZ2h0KSxcbiAgICAgICAgICBpbGxlZ2FsOiB0cnVlLFxuICAgICAgICAgIHJlbGV2YW5jZTogMCxcbiAgICAgICAgICBfaWxsZWdhbEJ5OiB7XG4gICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSxcbiAgICAgICAgICAgIGluZGV4LFxuICAgICAgICAgICAgY29udGV4dDogY29kZVRvSGlnaGxpZ2h0LnNsaWNlKGluZGV4IC0gMTAwLCBpbmRleCArIDEwMCksXG4gICAgICAgICAgICBtb2RlOiBlcnIubW9kZSxcbiAgICAgICAgICAgIHJlc3VsdFNvRmFyOiByZXN1bHRcbiAgICAgICAgICB9LFxuICAgICAgICAgIF9lbWl0dGVyOiBlbWl0dGVyXG4gICAgICAgIH07XG4gICAgICB9IGVsc2UgaWYgKFNBRkVfTU9ERSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGxhbmd1YWdlOiBsYW5ndWFnZU5hbWUsXG4gICAgICAgICAgdmFsdWU6IGVzY2FwZShjb2RlVG9IaWdobGlnaHQpLFxuICAgICAgICAgIGlsbGVnYWw6IGZhbHNlLFxuICAgICAgICAgIHJlbGV2YW5jZTogMCxcbiAgICAgICAgICBlcnJvclJhaXNlZDogZXJyLFxuICAgICAgICAgIF9lbWl0dGVyOiBlbWl0dGVyLFxuICAgICAgICAgIF90b3A6IHRvcFxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiByZXR1cm5zIGEgdmFsaWQgaGlnaGxpZ2h0IHJlc3VsdCwgd2l0aG91dCBhY3R1YWxseSBkb2luZyBhbnkgYWN0dWFsIHdvcmssXG4gICAqIGF1dG8gaGlnaGxpZ2h0IHN0YXJ0cyB3aXRoIHRoaXMgYW5kIGl0J3MgcG9zc2libGUgZm9yIHNtYWxsIHNuaXBwZXRzIHRoYXRcbiAgICogYXV0by1kZXRlY3Rpb24gbWF5IG5vdCBmaW5kIGEgYmV0dGVyIG1hdGNoXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlXG4gICAqIEByZXR1cm5zIHtIaWdobGlnaHRSZXN1bHR9XG4gICAqL1xuICBmdW5jdGlvbiBqdXN0VGV4dEhpZ2hsaWdodFJlc3VsdChjb2RlKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgdmFsdWU6IGVzY2FwZShjb2RlKSxcbiAgICAgIGlsbGVnYWw6IGZhbHNlLFxuICAgICAgcmVsZXZhbmNlOiAwLFxuICAgICAgX3RvcDogUExBSU5URVhUX0xBTkdVQUdFLFxuICAgICAgX2VtaXR0ZXI6IG5ldyBvcHRpb25zLl9fZW1pdHRlcihvcHRpb25zKVxuICAgIH07XG4gICAgcmVzdWx0Ll9lbWl0dGVyLmFkZFRleHQoY29kZSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICBIaWdobGlnaHRpbmcgd2l0aCBsYW5ndWFnZSBkZXRlY3Rpb24uIEFjY2VwdHMgYSBzdHJpbmcgd2l0aCB0aGUgY29kZSB0b1xuICBoaWdobGlnaHQuIFJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuXG4gIC0gbGFuZ3VhZ2UgKGRldGVjdGVkIGxhbmd1YWdlKVxuICAtIHJlbGV2YW5jZSAoaW50KVxuICAtIHZhbHVlIChhbiBIVE1MIHN0cmluZyB3aXRoIGhpZ2hsaWdodGluZyBtYXJrdXApXG4gIC0gc2Vjb25kQmVzdCAob2JqZWN0IHdpdGggdGhlIHNhbWUgc3RydWN0dXJlIGZvciBzZWNvbmQtYmVzdCBoZXVyaXN0aWNhbGx5XG4gICAgZGV0ZWN0ZWQgbGFuZ3VhZ2UsIG1heSBiZSBhYnNlbnQpXG5cbiAgICBAcGFyYW0ge3N0cmluZ30gY29kZVxuICAgIEBwYXJhbSB7QXJyYXk8c3RyaW5nPn0gW2xhbmd1YWdlU3Vic2V0XVxuICAgIEByZXR1cm5zIHtBdXRvSGlnaGxpZ2h0UmVzdWx0fVxuICAqL1xuICBmdW5jdGlvbiBoaWdobGlnaHRBdXRvKGNvZGUsIGxhbmd1YWdlU3Vic2V0KSB7XG4gICAgbGFuZ3VhZ2VTdWJzZXQgPSBsYW5ndWFnZVN1YnNldCB8fCBvcHRpb25zLmxhbmd1YWdlcyB8fCBPYmplY3Qua2V5cyhsYW5ndWFnZXMpO1xuICAgIGNvbnN0IHBsYWludGV4dCA9IGp1c3RUZXh0SGlnaGxpZ2h0UmVzdWx0KGNvZGUpO1xuXG4gICAgY29uc3QgcmVzdWx0cyA9IGxhbmd1YWdlU3Vic2V0LmZpbHRlcihnZXRMYW5ndWFnZSkuZmlsdGVyKGF1dG9EZXRlY3Rpb24pLm1hcChuYW1lID0+XG4gICAgICBfaGlnaGxpZ2h0KG5hbWUsIGNvZGUsIGZhbHNlKVxuICAgICk7XG4gICAgcmVzdWx0cy51bnNoaWZ0KHBsYWludGV4dCk7IC8vIHBsYWludGV4dCBpcyBhbHdheXMgYW4gb3B0aW9uXG5cbiAgICBjb25zdCBzb3J0ZWQgPSByZXN1bHRzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIC8vIHNvcnQgYmFzZSBvbiByZWxldmFuY2VcbiAgICAgIGlmIChhLnJlbGV2YW5jZSAhPT0gYi5yZWxldmFuY2UpIHJldHVybiBiLnJlbGV2YW5jZSAtIGEucmVsZXZhbmNlO1xuXG4gICAgICAvLyBhbHdheXMgYXdhcmQgdGhlIHRpZSB0byB0aGUgYmFzZSBsYW5ndWFnZVxuICAgICAgLy8gaWUgaWYgQysrIGFuZCBBcmR1aW5vIGFyZSB0aWVkLCBpdCdzIG1vcmUgbGlrZWx5IHRvIGJlIEMrK1xuICAgICAgaWYgKGEubGFuZ3VhZ2UgJiYgYi5sYW5ndWFnZSkge1xuICAgICAgICBpZiAoZ2V0TGFuZ3VhZ2UoYS5sYW5ndWFnZSkuc3VwZXJzZXRPZiA9PT0gYi5sYW5ndWFnZSkge1xuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9IGVsc2UgaWYgKGdldExhbmd1YWdlKGIubGFuZ3VhZ2UpLnN1cGVyc2V0T2YgPT09IGEubGFuZ3VhZ2UpIHtcbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gb3RoZXJ3aXNlIHNheSB0aGV5IGFyZSBlcXVhbCwgd2hpY2ggaGFzIHRoZSBlZmZlY3Qgb2Ygc29ydGluZyBvblxuICAgICAgLy8gcmVsZXZhbmNlIHdoaWxlIHByZXNlcnZpbmcgdGhlIG9yaWdpbmFsIG9yZGVyaW5nIC0gd2hpY2ggaXMgaG93IHRpZXNcbiAgICAgIC8vIGhhdmUgaGlzdG9yaWNhbGx5IGJlZW4gc2V0dGxlZCwgaWUgdGhlIGxhbmd1YWdlIHRoYXQgY29tZXMgZmlyc3QgYWx3YXlzXG4gICAgICAvLyB3aW5zIGluIHRoZSBjYXNlIG9mIGEgdGllXG4gICAgICByZXR1cm4gMDtcbiAgICB9KTtcblxuICAgIGNvbnN0IFtiZXN0LCBzZWNvbmRCZXN0XSA9IHNvcnRlZDtcblxuICAgIC8qKiBAdHlwZSB7QXV0b0hpZ2hsaWdodFJlc3VsdH0gKi9cbiAgICBjb25zdCByZXN1bHQgPSBiZXN0O1xuICAgIHJlc3VsdC5zZWNvbmRCZXN0ID0gc2Vjb25kQmVzdDtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogQnVpbGRzIG5ldyBjbGFzcyBuYW1lIGZvciBibG9jayBnaXZlbiB0aGUgbGFuZ3VhZ2UgbmFtZVxuICAgKlxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY3VycmVudExhbmddXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcmVzdWx0TGFuZ11cbiAgICovXG4gIGZ1bmN0aW9uIHVwZGF0ZUNsYXNzTmFtZShlbGVtZW50LCBjdXJyZW50TGFuZywgcmVzdWx0TGFuZykge1xuICAgIGNvbnN0IGxhbmd1YWdlID0gKGN1cnJlbnRMYW5nICYmIGFsaWFzZXNbY3VycmVudExhbmddKSB8fCByZXN1bHRMYW5nO1xuXG4gICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiaGxqc1wiKTtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoYGxhbmd1YWdlLSR7bGFuZ3VhZ2V9YCk7XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyBoaWdobGlnaHRpbmcgdG8gYSBET00gbm9kZSBjb250YWluaW5nIGNvZGUuXG4gICAqXG4gICAqIEBwYXJhbSB7SGlnaGxpZ2h0ZWRIVE1MRWxlbWVudH0gZWxlbWVudCAtIHRoZSBIVE1MIGVsZW1lbnQgdG8gaGlnaGxpZ2h0XG4gICovXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodEVsZW1lbnQoZWxlbWVudCkge1xuICAgIC8qKiBAdHlwZSBIVE1MRWxlbWVudCAqL1xuICAgIGxldCBub2RlID0gbnVsbDtcbiAgICBjb25zdCBsYW5ndWFnZSA9IGJsb2NrTGFuZ3VhZ2UoZWxlbWVudCk7XG5cbiAgICBpZiAoc2hvdWxkTm90SGlnaGxpZ2h0KGxhbmd1YWdlKSkgcmV0dXJuO1xuXG4gICAgZmlyZShcImJlZm9yZTpoaWdobGlnaHRFbGVtZW50XCIsXG4gICAgICB7IGVsOiBlbGVtZW50LCBsYW5ndWFnZSB9KTtcblxuICAgIGlmIChlbGVtZW50LmRhdGFzZXQuaGlnaGxpZ2h0ZWQpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiRWxlbWVudCBwcmV2aW91c2x5IGhpZ2hsaWdodGVkLiBUbyBoaWdobGlnaHQgYWdhaW4sIGZpcnN0IHVuc2V0IGBkYXRhc2V0LmhpZ2hsaWdodGVkYC5cIiwgZWxlbWVudCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gd2Ugc2hvdWxkIGJlIGFsbCB0ZXh0LCBubyBjaGlsZCBub2RlcyAodW5lc2NhcGVkIEhUTUwpIC0gdGhpcyBpcyBwb3NzaWJseVxuICAgIC8vIGFuIEhUTUwgaW5qZWN0aW9uIGF0dGFjayAtIGl0J3MgbGlrZWx5IHRvbyBsYXRlIGlmIHRoaXMgaXMgYWxyZWFkeSBpblxuICAgIC8vIHByb2R1Y3Rpb24gKHRoZSBjb2RlIGhhcyBsaWtlbHkgYWxyZWFkeSBkb25lIGl0cyBkYW1hZ2UgYnkgdGhlIHRpbWVcbiAgICAvLyB3ZSdyZSBzZWVpbmcgaXQpLi4uIGJ1dCB3ZSB5ZWxsIGxvdWRseSBhYm91dCB0aGlzIHNvIHRoYXQgaG9wZWZ1bGx5IGl0J3NcbiAgICAvLyBtb3JlIGxpa2VseSB0byBiZSBjYXVnaHQgaW4gZGV2ZWxvcG1lbnQgYmVmb3JlIG1ha2luZyBpdCB0byBwcm9kdWN0aW9uXG4gICAgaWYgKGVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKCFvcHRpb25zLmlnbm9yZVVuZXNjYXBlZEhUTUwpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiT25lIG9mIHlvdXIgY29kZSBibG9ja3MgaW5jbHVkZXMgdW5lc2NhcGVkIEhUTUwuIFRoaXMgaXMgYSBwb3RlbnRpYWxseSBzZXJpb3VzIHNlY3VyaXR5IHJpc2suXCIpO1xuICAgICAgICBjb25zb2xlLndhcm4oXCJodHRwczovL2dpdGh1Yi5jb20vaGlnaGxpZ2h0anMvaGlnaGxpZ2h0LmpzL3dpa2kvc2VjdXJpdHlcIik7XG4gICAgICAgIGNvbnNvbGUud2FybihcIlRoZSBlbGVtZW50IHdpdGggdW5lc2NhcGVkIEhUTUw6XCIpO1xuICAgICAgICBjb25zb2xlLndhcm4oZWxlbWVudCk7XG4gICAgICB9XG4gICAgICBpZiAob3B0aW9ucy50aHJvd1VuZXNjYXBlZEhUTUwpIHtcbiAgICAgICAgY29uc3QgZXJyID0gbmV3IEhUTUxJbmplY3Rpb25FcnJvcihcbiAgICAgICAgICBcIk9uZSBvZiB5b3VyIGNvZGUgYmxvY2tzIGluY2x1ZGVzIHVuZXNjYXBlZCBIVE1MLlwiLFxuICAgICAgICAgIGVsZW1lbnQuaW5uZXJIVE1MXG4gICAgICAgICk7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBub2RlID0gZWxlbWVudDtcbiAgICBjb25zdCB0ZXh0ID0gbm9kZS50ZXh0Q29udGVudDtcbiAgICBjb25zdCByZXN1bHQgPSBsYW5ndWFnZSA/IGhpZ2hsaWdodCh0ZXh0LCB7IGxhbmd1YWdlLCBpZ25vcmVJbGxlZ2FsczogdHJ1ZSB9KSA6IGhpZ2hsaWdodEF1dG8odGV4dCk7XG5cbiAgICBlbGVtZW50LmlubmVySFRNTCA9IHJlc3VsdC52YWx1ZTtcbiAgICBlbGVtZW50LmRhdGFzZXQuaGlnaGxpZ2h0ZWQgPSBcInllc1wiO1xuICAgIHVwZGF0ZUNsYXNzTmFtZShlbGVtZW50LCBsYW5ndWFnZSwgcmVzdWx0Lmxhbmd1YWdlKTtcbiAgICBlbGVtZW50LnJlc3VsdCA9IHtcbiAgICAgIGxhbmd1YWdlOiByZXN1bHQubGFuZ3VhZ2UsXG4gICAgICAvLyBUT0RPOiByZW1vdmUgd2l0aCB2ZXJzaW9uIDExLjBcbiAgICAgIHJlOiByZXN1bHQucmVsZXZhbmNlLFxuICAgICAgcmVsZXZhbmNlOiByZXN1bHQucmVsZXZhbmNlXG4gICAgfTtcbiAgICBpZiAocmVzdWx0LnNlY29uZEJlc3QpIHtcbiAgICAgIGVsZW1lbnQuc2Vjb25kQmVzdCA9IHtcbiAgICAgICAgbGFuZ3VhZ2U6IHJlc3VsdC5zZWNvbmRCZXN0Lmxhbmd1YWdlLFxuICAgICAgICByZWxldmFuY2U6IHJlc3VsdC5zZWNvbmRCZXN0LnJlbGV2YW5jZVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBmaXJlKFwiYWZ0ZXI6aGlnaGxpZ2h0RWxlbWVudFwiLCB7IGVsOiBlbGVtZW50LCByZXN1bHQsIHRleHQgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyBoaWdobGlnaHQuanMgZ2xvYmFsIG9wdGlvbnMgd2l0aCB0aGUgcGFzc2VkIG9wdGlvbnNcbiAgICpcbiAgICogQHBhcmFtIHtQYXJ0aWFsPEhMSlNPcHRpb25zPn0gdXNlck9wdGlvbnNcbiAgICovXG4gIGZ1bmN0aW9uIGNvbmZpZ3VyZSh1c2VyT3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBpbmhlcml0KG9wdGlvbnMsIHVzZXJPcHRpb25zKTtcbiAgfVxuXG4gIC8vIFRPRE86IHJlbW92ZSB2MTIsIGRlcHJlY2F0ZWRcbiAgY29uc3QgaW5pdEhpZ2hsaWdodGluZyA9ICgpID0+IHtcbiAgICBoaWdobGlnaHRBbGwoKTtcbiAgICBkZXByZWNhdGVkKFwiMTAuNi4wXCIsIFwiaW5pdEhpZ2hsaWdodGluZygpIGRlcHJlY2F0ZWQuICBVc2UgaGlnaGxpZ2h0QWxsKCkgbm93LlwiKTtcbiAgfTtcblxuICAvLyBUT0RPOiByZW1vdmUgdjEyLCBkZXByZWNhdGVkXG4gIGZ1bmN0aW9uIGluaXRIaWdobGlnaHRpbmdPbkxvYWQoKSB7XG4gICAgaGlnaGxpZ2h0QWxsKCk7XG4gICAgZGVwcmVjYXRlZChcIjEwLjYuMFwiLCBcImluaXRIaWdobGlnaHRpbmdPbkxvYWQoKSBkZXByZWNhdGVkLiAgVXNlIGhpZ2hsaWdodEFsbCgpIG5vdy5cIik7XG4gIH1cblxuICBsZXQgd2FudHNIaWdobGlnaHQgPSBmYWxzZTtcblxuICAvKipcbiAgICogYXV0by1oaWdobGlnaHRzIGFsbCBwcmU+Y29kZSBlbGVtZW50cyBvbiB0aGUgcGFnZVxuICAgKi9cbiAgZnVuY3Rpb24gaGlnaGxpZ2h0QWxsKCkge1xuICAgIGZ1bmN0aW9uIGJvb3QoKSB7XG4gICAgICAvLyBpZiBhIGhpZ2hsaWdodCB3YXMgcmVxdWVzdGVkIGJlZm9yZSBET00gd2FzIGxvYWRlZCwgZG8gbm93XG4gICAgICBoaWdobGlnaHRBbGwoKTtcbiAgICB9XG5cbiAgICAvLyBpZiB3ZSBhcmUgY2FsbGVkIHRvbyBlYXJseSBpbiB0aGUgbG9hZGluZyBwcm9jZXNzXG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwibG9hZGluZ1wiKSB7XG4gICAgICAvLyBtYWtlIHN1cmUgdGhlIGV2ZW50IGxpc3RlbmVyIGlzIG9ubHkgYWRkZWQgb25jZVxuICAgICAgaWYgKCF3YW50c0hpZ2hsaWdodCkge1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGJvb3QsIGZhbHNlKTtcbiAgICAgIH1cbiAgICAgIHdhbnRzSGlnaGxpZ2h0ID0gdHJ1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBibG9ja3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKG9wdGlvbnMuY3NzU2VsZWN0b3IpO1xuICAgIGJsb2Nrcy5mb3JFYWNoKGhpZ2hsaWdodEVsZW1lbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgbGFuZ3VhZ2UgZ3JhbW1hciBtb2R1bGVcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGxhbmd1YWdlTmFtZVxuICAgKiBAcGFyYW0ge0xhbmd1YWdlRm59IGxhbmd1YWdlRGVmaW5pdGlvblxuICAgKi9cbiAgZnVuY3Rpb24gcmVnaXN0ZXJMYW5ndWFnZShsYW5ndWFnZU5hbWUsIGxhbmd1YWdlRGVmaW5pdGlvbikge1xuICAgIGxldCBsYW5nID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgbGFuZyA9IGxhbmd1YWdlRGVmaW5pdGlvbihobGpzKTtcbiAgICB9IGNhdGNoIChlcnJvciQxKSB7XG4gICAgICBlcnJvcihcIkxhbmd1YWdlIGRlZmluaXRpb24gZm9yICd7fScgY291bGQgbm90IGJlIHJlZ2lzdGVyZWQuXCIucmVwbGFjZShcInt9XCIsIGxhbmd1YWdlTmFtZSkpO1xuICAgICAgLy8gaGFyZCBvciBzb2Z0IGVycm9yXG4gICAgICBpZiAoIVNBRkVfTU9ERSkgeyB0aHJvdyBlcnJvciQxOyB9IGVsc2UgeyBlcnJvcihlcnJvciQxKTsgfVxuICAgICAgLy8gbGFuZ3VhZ2VzIHRoYXQgaGF2ZSBzZXJpb3VzIGVycm9ycyBhcmUgcmVwbGFjZWQgd2l0aCBlc3NlbnRpYWxseSBhXG4gICAgICAvLyBcInBsYWludGV4dFwiIHN0YW5kLWluIHNvIHRoYXQgdGhlIGNvZGUgYmxvY2tzIHdpbGwgc3RpbGwgZ2V0IG5vcm1hbFxuICAgICAgLy8gY3NzIGNsYXNzZXMgYXBwbGllZCB0byB0aGVtIC0gYW5kIG9uZSBiYWQgbGFuZ3VhZ2Ugd29uJ3QgYnJlYWsgdGhlXG4gICAgICAvLyBlbnRpcmUgaGlnaGxpZ2h0ZXJcbiAgICAgIGxhbmcgPSBQTEFJTlRFWFRfTEFOR1VBR0U7XG4gICAgfVxuICAgIC8vIGdpdmUgaXQgYSB0ZW1wb3JhcnkgbmFtZSBpZiBpdCBkb2Vzbid0IGhhdmUgb25lIGluIHRoZSBtZXRhLWRhdGFcbiAgICBpZiAoIWxhbmcubmFtZSkgbGFuZy5uYW1lID0gbGFuZ3VhZ2VOYW1lO1xuICAgIGxhbmd1YWdlc1tsYW5ndWFnZU5hbWVdID0gbGFuZztcbiAgICBsYW5nLnJhd0RlZmluaXRpb24gPSBsYW5ndWFnZURlZmluaXRpb24uYmluZChudWxsLCBobGpzKTtcblxuICAgIGlmIChsYW5nLmFsaWFzZXMpIHtcbiAgICAgIHJlZ2lzdGVyQWxpYXNlcyhsYW5nLmFsaWFzZXMsIHsgbGFuZ3VhZ2VOYW1lIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYSBsYW5ndWFnZSBncmFtbWFyIG1vZHVsZVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2VOYW1lXG4gICAqL1xuICBmdW5jdGlvbiB1bnJlZ2lzdGVyTGFuZ3VhZ2UobGFuZ3VhZ2VOYW1lKSB7XG4gICAgZGVsZXRlIGxhbmd1YWdlc1tsYW5ndWFnZU5hbWVdO1xuICAgIGZvciAoY29uc3QgYWxpYXMgb2YgT2JqZWN0LmtleXMoYWxpYXNlcykpIHtcbiAgICAgIGlmIChhbGlhc2VzW2FsaWFzXSA9PT0gbGFuZ3VhZ2VOYW1lKSB7XG4gICAgICAgIGRlbGV0ZSBhbGlhc2VzW2FsaWFzXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMge3N0cmluZ1tdfSBMaXN0IG9mIGxhbmd1YWdlIGludGVybmFsIG5hbWVzXG4gICAqL1xuICBmdW5jdGlvbiBsaXN0TGFuZ3VhZ2VzKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhsYW5ndWFnZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gbmFtZSBvZiB0aGUgbGFuZ3VhZ2UgdG8gcmV0cmlldmVcbiAgICogQHJldHVybnMge0xhbmd1YWdlIHwgdW5kZWZpbmVkfVxuICAgKi9cbiAgZnVuY3Rpb24gZ2V0TGFuZ3VhZ2UobmFtZSkge1xuICAgIG5hbWUgPSAobmFtZSB8fCAnJykudG9Mb3dlckNhc2UoKTtcbiAgICByZXR1cm4gbGFuZ3VhZ2VzW25hbWVdIHx8IGxhbmd1YWdlc1thbGlhc2VzW25hbWVdXTtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xzdHJpbmdbXX0gYWxpYXNMaXN0IC0gc2luZ2xlIGFsaWFzIG9yIGxpc3Qgb2YgYWxpYXNlc1xuICAgKiBAcGFyYW0ge3tsYW5ndWFnZU5hbWU6IHN0cmluZ319IG9wdHNcbiAgICovXG4gIGZ1bmN0aW9uIHJlZ2lzdGVyQWxpYXNlcyhhbGlhc0xpc3QsIHsgbGFuZ3VhZ2VOYW1lIH0pIHtcbiAgICBpZiAodHlwZW9mIGFsaWFzTGlzdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGFsaWFzTGlzdCA9IFthbGlhc0xpc3RdO1xuICAgIH1cbiAgICBhbGlhc0xpc3QuZm9yRWFjaChhbGlhcyA9PiB7IGFsaWFzZXNbYWxpYXMudG9Mb3dlckNhc2UoKV0gPSBsYW5ndWFnZU5hbWU7IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgYSBnaXZlbiBsYW5ndWFnZSBoYXMgYXV0by1kZXRlY3Rpb24gZW5hYmxlZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIG5hbWUgb2YgdGhlIGxhbmd1YWdlXG4gICAqL1xuICBmdW5jdGlvbiBhdXRvRGV0ZWN0aW9uKG5hbWUpIHtcbiAgICBjb25zdCBsYW5nID0gZ2V0TGFuZ3VhZ2UobmFtZSk7XG4gICAgcmV0dXJuIGxhbmcgJiYgIWxhbmcuZGlzYWJsZUF1dG9kZXRlY3Q7XG4gIH1cblxuICAvKipcbiAgICogVXBncmFkZXMgdGhlIG9sZCBoaWdobGlnaHRCbG9jayBwbHVnaW5zIHRvIHRoZSBuZXdcbiAgICogaGlnaGxpZ2h0RWxlbWVudCBBUElcbiAgICogQHBhcmFtIHtITEpTUGx1Z2lufSBwbHVnaW5cbiAgICovXG4gIGZ1bmN0aW9uIHVwZ3JhZGVQbHVnaW5BUEkocGx1Z2luKSB7XG4gICAgLy8gVE9ETzogcmVtb3ZlIHdpdGggdjEyXG4gICAgaWYgKHBsdWdpbltcImJlZm9yZTpoaWdobGlnaHRCbG9ja1wiXSAmJiAhcGx1Z2luW1wiYmVmb3JlOmhpZ2hsaWdodEVsZW1lbnRcIl0pIHtcbiAgICAgIHBsdWdpbltcImJlZm9yZTpoaWdobGlnaHRFbGVtZW50XCJdID0gKGRhdGEpID0+IHtcbiAgICAgICAgcGx1Z2luW1wiYmVmb3JlOmhpZ2hsaWdodEJsb2NrXCJdKFxuICAgICAgICAgIE9iamVjdC5hc3NpZ24oeyBibG9jazogZGF0YS5lbCB9LCBkYXRhKVxuICAgICAgICApO1xuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKHBsdWdpbltcImFmdGVyOmhpZ2hsaWdodEJsb2NrXCJdICYmICFwbHVnaW5bXCJhZnRlcjpoaWdobGlnaHRFbGVtZW50XCJdKSB7XG4gICAgICBwbHVnaW5bXCJhZnRlcjpoaWdobGlnaHRFbGVtZW50XCJdID0gKGRhdGEpID0+IHtcbiAgICAgICAgcGx1Z2luW1wiYWZ0ZXI6aGlnaGxpZ2h0QmxvY2tcIl0oXG4gICAgICAgICAgT2JqZWN0LmFzc2lnbih7IGJsb2NrOiBkYXRhLmVsIH0sIGRhdGEpXG4gICAgICAgICk7XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0hMSlNQbHVnaW59IHBsdWdpblxuICAgKi9cbiAgZnVuY3Rpb24gYWRkUGx1Z2luKHBsdWdpbikge1xuICAgIHVwZ3JhZGVQbHVnaW5BUEkocGx1Z2luKTtcbiAgICBwbHVnaW5zLnB1c2gocGx1Z2luKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0hMSlNQbHVnaW59IHBsdWdpblxuICAgKi9cbiAgZnVuY3Rpb24gcmVtb3ZlUGx1Z2luKHBsdWdpbikge1xuICAgIGNvbnN0IGluZGV4ID0gcGx1Z2lucy5pbmRleE9mKHBsdWdpbik7XG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgcGx1Z2lucy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0ge1BsdWdpbkV2ZW50fSBldmVudFxuICAgKiBAcGFyYW0ge2FueX0gYXJnc1xuICAgKi9cbiAgZnVuY3Rpb24gZmlyZShldmVudCwgYXJncykge1xuICAgIGNvbnN0IGNiID0gZXZlbnQ7XG4gICAgcGx1Z2lucy5mb3JFYWNoKGZ1bmN0aW9uKHBsdWdpbikge1xuICAgICAgaWYgKHBsdWdpbltjYl0pIHtcbiAgICAgICAgcGx1Z2luW2NiXShhcmdzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBERVBSRUNBVEVEXG4gICAqIEBwYXJhbSB7SGlnaGxpZ2h0ZWRIVE1MRWxlbWVudH0gZWxcbiAgICovXG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZUhpZ2hsaWdodEJsb2NrKGVsKSB7XG4gICAgZGVwcmVjYXRlZChcIjEwLjcuMFwiLCBcImhpZ2hsaWdodEJsb2NrIHdpbGwgYmUgcmVtb3ZlZCBlbnRpcmVseSBpbiB2MTIuMFwiKTtcbiAgICBkZXByZWNhdGVkKFwiMTAuNy4wXCIsIFwiUGxlYXNlIHVzZSBoaWdobGlnaHRFbGVtZW50IG5vdy5cIik7XG5cbiAgICByZXR1cm4gaGlnaGxpZ2h0RWxlbWVudChlbCk7XG4gIH1cblxuICAvKiBJbnRlcmZhY2UgZGVmaW5pdGlvbiAqL1xuICBPYmplY3QuYXNzaWduKGhsanMsIHtcbiAgICBoaWdobGlnaHQsXG4gICAgaGlnaGxpZ2h0QXV0byxcbiAgICBoaWdobGlnaHRBbGwsXG4gICAgaGlnaGxpZ2h0RWxlbWVudCxcbiAgICAvLyBUT0RPOiBSZW1vdmUgd2l0aCB2MTIgQVBJXG4gICAgaGlnaGxpZ2h0QmxvY2s6IGRlcHJlY2F0ZUhpZ2hsaWdodEJsb2NrLFxuICAgIGNvbmZpZ3VyZSxcbiAgICBpbml0SGlnaGxpZ2h0aW5nLFxuICAgIGluaXRIaWdobGlnaHRpbmdPbkxvYWQsXG4gICAgcmVnaXN0ZXJMYW5ndWFnZSxcbiAgICB1bnJlZ2lzdGVyTGFuZ3VhZ2UsXG4gICAgbGlzdExhbmd1YWdlcyxcbiAgICBnZXRMYW5ndWFnZSxcbiAgICByZWdpc3RlckFsaWFzZXMsXG4gICAgYXV0b0RldGVjdGlvbixcbiAgICBpbmhlcml0LFxuICAgIGFkZFBsdWdpbixcbiAgICByZW1vdmVQbHVnaW5cbiAgfSk7XG5cbiAgaGxqcy5kZWJ1Z01vZGUgPSBmdW5jdGlvbigpIHsgU0FGRV9NT0RFID0gZmFsc2U7IH07XG4gIGhsanMuc2FmZU1vZGUgPSBmdW5jdGlvbigpIHsgU0FGRV9NT0RFID0gdHJ1ZTsgfTtcbiAgaGxqcy52ZXJzaW9uU3RyaW5nID0gdmVyc2lvbjtcblxuICBobGpzLnJlZ2V4ID0ge1xuICAgIGNvbmNhdDogY29uY2F0LFxuICAgIGxvb2thaGVhZDogbG9va2FoZWFkLFxuICAgIGVpdGhlcjogZWl0aGVyLFxuICAgIG9wdGlvbmFsOiBvcHRpb25hbCxcbiAgICBhbnlOdW1iZXJPZlRpbWVzOiBhbnlOdW1iZXJPZlRpbWVzXG4gIH07XG5cbiAgZm9yIChjb25zdCBrZXkgaW4gTU9ERVMpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgaWYgKHR5cGVvZiBNT0RFU1trZXldID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBkZWVwRnJlZXplKE1PREVTW2tleV0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIG1lcmdlIGFsbCB0aGUgbW9kZXMvcmVnZXhlcyBpbnRvIG91ciBtYWluIG9iamVjdFxuICBPYmplY3QuYXNzaWduKGhsanMsIE1PREVTKTtcblxuICByZXR1cm4gaGxqcztcbn07XG5cbi8vIE90aGVyIG5hbWVzIGZvciB0aGUgdmFyaWFibGUgbWF5IGJyZWFrIGJ1aWxkIHNjcmlwdFxuY29uc3QgaGlnaGxpZ2h0ID0gSExKUyh7fSk7XG5cbi8vIHJldHVybnMgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIGhpZ2hsaWdodGVyIHRvIGJlIHVzZWQgZm9yIGV4dGVuc2lvbnNcbi8vIGNoZWNrIGh0dHBzOi8vZ2l0aHViLmNvbS93b29vcm0vbG93bGlnaHQvaXNzdWVzLzQ3XG5oaWdobGlnaHQubmV3SW5zdGFuY2UgPSAoKSA9PiBITEpTKHt9KTtcblxubW9kdWxlLmV4cG9ydHMgPSBoaWdobGlnaHQ7XG5oaWdobGlnaHQuSGlnaGxpZ2h0SlMgPSBoaWdobGlnaHQ7XG5oaWdobGlnaHQuZGVmYXVsdCA9IGhpZ2hsaWdodDtcbiIsICIvKipcbiAqIENvZGVGbG93IHdlYnZpZXcgcHJvdG9jb2wuXG4gKlxuICogVGhlIGV4dGVuc2lvbiBob3N0IGFuZCB0aGUgd2VidmlldyBhcmUgc2VwYXJhdGUgSmF2YVNjcmlwdCBjb250ZXh0cy4gRXZlcnlcbiAqIG1lc3NhZ2UgdGhhdCBjcm9zc2VzIHRoYXQgYm91bmRhcnkgbXVzdCBwYXNzIHRocm91Z2ggdGhpcyBtb2R1bGUgc28gdGhhdCBhXG4gKiBzaW5nbGUsIHZlcnNpb25lZCBjb250cmFjdCBkZWNpZGVzIHdoYXQgaXMgbGVnYWwuXG4gKlxuICogVGhpcyBtb2R1bGUgaXMgaW50ZW50aW9uYWxseSBkZXBlbmRlbmN5LWZyZWU6IGl0IGlzIGJ1bmRsZWQgaW50byBib3RoIHRoZVxuICogZXh0ZW5zaW9uIGhvc3QgYW5kIHRoZSB3ZWJ2aWV3LlxuICovXG5cbmV4cG9ydCBjb25zdCBQUk9UT0NPTF9WRVJTSU9OID0gMTtcblxuLyoqIEhhcmQgY2VpbGluZyBvbiBhIHNlcmlhbGl6ZWQgbWVzc2FnZS4gTGFyZ2VyIG1lc3NhZ2VzIGFyZSByZWplY3RlZCwgbmV2ZXIgdHJ1bmNhdGVkLiAqL1xuZXhwb3J0IGNvbnN0IE1BWF9QQVlMT0FEX0JZVEVTID0gMV8wMDBfMDAwO1xuXG4vKiogYGRvbWFpbi5hY3Rpb25gIGluIGxvd2VyIGNhc2UsIGF0IGxlYXN0IHR3byBzZWdtZW50cy4gKi9cbmV4cG9ydCBjb25zdCBLSU5EX1BBVFRFUk4gPSAvXlthLXpdKyhcXC5bYS16XSspKyQvO1xuXG5leHBvcnQgY29uc3QgUkVRVUVTVF9JRF9QQVRURVJOID0gL15bQS1aYS16MC05Xy1dezEsMTI4fSQvO1xuXG4vKiogS2luZHMgYSB3ZWJ2aWV3IG1heSBzZW5kIHRvIHRoZSBob3N0LiAqL1xuZXhwb3J0IGNvbnN0IFdFQlZJRVdfVE9fSE9TVCA9IE9iamVjdC5mcmVlemUoW1xuICAnd2Vidmlldy5yZWFkeScsXG4gICdncmFwaC5sb2FkJyxcbiAgJ2Nzci5sb2FkJyxcbiAgJ25vZGUuc2VsZWN0JyxcbiAgJ3BhbmVsLnBpbmcnLFxuICAncXVlcnkuc3ltYm9sJyxcbiAgJ3F1ZXJ5LnN5bWJvbHMnLFxuICAncXVlcnkuY2FsbGVycycsXG4gICdxdWVyeS5jYWxsZWVzJyxcbiAgJ3F1ZXJ5LmNvbnN0cnVjdHMnLFxuICAncXVlcnkuY2FwYWJpbGl0aWVzJyxcbiAgJ2NmZy5mdW5jdGlvbnMnLFxuICAnY2ZnLmxvYWQnLFxuICAnc291cmNlLnNsaWNlJyxcbiAgJ3NvdXJjZS52YWxpZGF0aW9uJyxcbiAgJ25hdmlnYXRlLnRvJyxcbiAgJ2V4cGxhaW4ubm9kZScsXG4gICdleHBsYWluLmZ1bmN0aW9uJyxcbiAgJ2NhbGxzLmxvYWQnLFxuICAnY2FsbHMub3V0Z29pbmcnLFxuICAnY2FsbHMuaW5jb21pbmcnLFxuICAnY2FsbHMuZXhwYW5kJyxcbiAgJ2NhbGxzLmNvbGxhcHNlJyxcbiAgJ2NhbGxzLmZpbHRlcicsXG4gICdjYWxscy5mb2N1cycsXG4gICdpbmRleC5zdGF0dXMnLFxuXSk7XG5cbi8qKiBLaW5kcyB0aGUgaG9zdCBtYXkgc2VuZCB0byB0aGUgd2Vidmlldy4gKi9cbmV4cG9ydCBjb25zdCBIT1NUX1RPX1dFQlZJRVcgPSBPYmplY3QuZnJlZXplKFtcbiAgJ2dyYXBoLmRhdGEnLFxuICAnY2FwYWJpbGl0aWVzLmRhdGEnLFxuICAnY3NyLmRhdGEnLFxuICAncXVlcnkuZGF0YScsXG4gICdhbmFseXNpcy5wcm9ncmVzcycsXG4gICdwcm90b2NvbC5lcnJvcicsXG4gICdwcm90b2NvbC5hY2snLFxuICAncGFuZWwucG9uZycsXG4gICdjZmcuZnVuY3Rpb25zJyxcbiAgJ2NmZy5kYXRhJyxcbiAgJ3NvdXJjZS5kYXRhJyxcbiAgJ3NvdXJjZS5pbnRlZ3JpdHknLFxuICAnc291cmNlLnN0YWxlJyxcbiAgJ25hdmlnYXRlLmRvbmUnLFxuICAnc2VsZWN0aW9uLmNoYW5nZWQnLFxuICAnZ3JhcGguZm9jdXMnLFxuICAnc2V0dGluZ3MuZGF0YScsXG4gICdleHBsYWluLmRhdGEnLFxuICAnY2FsbHMuZGF0YScsXG4gICdjYWxscy5uZWlnaGJvcnMnLFxuICAnaW5kZXguZGF0YScsXG5dKTtcblxuZXhwb3J0IGNvbnN0IERJUkVDVElPTlMgPSBPYmplY3QuZnJlZXplKHtcbiAgV0VCVklFV19UT19IT1NUOiAnd2Vidmlld190b19ob3N0JyxcbiAgSE9TVF9UT19XRUJWSUVXOiAnaG9zdF90b193ZWJ2aWV3Jyxcbn0pO1xuXG5jb25zdCBLSU5EX0FMTE9XTElTVCA9IE9iamVjdC5mcmVlemUoe1xuICBbRElSRUNUSU9OUy5XRUJWSUVXX1RPX0hPU1RdOiBuZXcgU2V0KFdFQlZJRVdfVE9fSE9TVCksXG4gIFtESVJFQ1RJT05TLkhPU1RfVE9fV0VCVklFV106IG5ldyBTZXQoSE9TVF9UT19XRUJWSUVXKSxcbn0pO1xuXG5jb25zdCBVTlNBRkVfS0VZUyA9IG5ldyBTZXQoWydfX3Byb3RvX18nLCAnY29uc3RydWN0b3InLCAncHJvdG90eXBlJ10pO1xuXG5jb25zdCBNQVhfS0VZX1NDQU5fREVQVEggPSA4O1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEVudmVsb3BlXG4gKiBAcHJvcGVydHkge251bWJlcn0gcHJvdG9jb2xWZXJzaW9uXG4gKiBAcHJvcGVydHkge3N0cmluZ30ga2luZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtyZXF1ZXN0SWRdXG4gKiBAcHJvcGVydHkge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBwYXlsb2FkXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBWYWxpZGF0aW9uU3VjY2Vzc1xuICogQHByb3BlcnR5IHt0cnVlfSBva1xuICogQHByb3BlcnR5IHtFbnZlbG9wZX0gZW52ZWxvcGVcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFZhbGlkYXRpb25GYWlsdXJlXG4gKiBAcHJvcGVydHkge2ZhbHNlfSBva1xuICogQHByb3BlcnR5IHsnRV9QUk9UT0NPTCd8J0VfTElNSVQnfSBjb2RlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gcmVhc29uXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbWVzc2FnZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtwYXRoXVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtyZXF1ZXN0SWRdXG4gKi9cblxuLyoqXG4gKiBCdWlsZCBhIHdlbGwtZm9ybWVkIGVudmVsb3BlLiBQcm9kdWNlcnMgc2hvdWxkIHVzZSB0aGlzIGluc3RlYWQgb2Ygd3JpdGluZ1xuICogb2JqZWN0IGxpdGVyYWxzIHNvIHRoYXQgdGhlIHZlcnNpb24gZmllbGQgY2FuIG5ldmVyIGJlIGZvcmdvdHRlbi5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30ga2luZFxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW3BheWxvYWRdXG4gKiBAcGFyYW0ge3N0cmluZ30gW3JlcXVlc3RJZF1cbiAqIEByZXR1cm5zIHtFbnZlbG9wZX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVudmVsb3BlKGtpbmQsIHBheWxvYWQsIHJlcXVlc3RJZCkge1xuICAvKiogQHR5cGUge0VudmVsb3BlfSAqL1xuICBjb25zdCBlbnZlbG9wZSA9IHtcbiAgICBwcm90b2NvbFZlcnNpb246IFBST1RPQ09MX1ZFUlNJT04sXG4gICAga2luZCxcbiAgICBwYXlsb2FkOiBwYXlsb2FkID8/IHt9LFxuICB9O1xuICBpZiAocmVxdWVzdElkKSB7XG4gICAgZW52ZWxvcGUucmVxdWVzdElkID0gcmVxdWVzdElkO1xuICB9XG4gIHJldHVybiBlbnZlbG9wZTtcbn1cblxuLyoqXG4gKiBCdWlsZCBhIHR5cGVkIGVycm9yIHBheWxvYWQuIGBkZXRhaWxgIG11c3QgbmV2ZXIgY29udGFpbiBzb3VyY2UgdGV4dC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IFtkZXRhaWxdXG4gKiBAcmV0dXJucyB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFcnJvclBheWxvYWQoY29kZSwgbWVzc2FnZSwgZGV0YWlsKSB7XG4gIC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovXG4gIGNvbnN0IHBheWxvYWQgPSB7IGNvZGUsIG1lc3NhZ2UgfTtcbiAgaWYgKGRldGFpbCkge1xuICAgIHBheWxvYWQuZGV0YWlsID0gZGV0YWlsO1xuICB9XG4gIHJldHVybiBwYXlsb2FkO1xufVxuXG4vKipcbiAqIEFwcHJveGltYXRlIHNlcmlhbGl6ZWQgc2l6ZSBvZiBhIG1lc3NhZ2UuIFVzZWQgZm9yIGxpbWl0IGVuZm9yY2VtZW50OyB0aGVcbiAqIGV4YWN0IGJ5dGVzIGRvIG5vdCBtYXR0ZXIsIG9ubHkgdGhhdCBvdmVyc2l6ZWQgbWVzc2FnZXMgYXJlIHJlZnVzZWQgYmVmb3JlXG4gKiB0aGV5IGFyZSBwb3N0ZWQuXG4gKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lc3NhZ2VTaXplKHZhbHVlKSB7XG4gIHRyeSB7XG4gICAgY29uc3QganNvbiA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcbiAgICByZXR1cm4gdHlwZW9mIGpzb24gPT09ICdzdHJpbmcnID8ganNvbi5sZW5ndGggOiAwO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHJldHVybnMge3ZhbHVlIGlzIFJlY29yZDxzdHJpbmcsIHVua25vd24+fVxuICovXG5mdW5jdGlvbiBpc1BsYWluT2JqZWN0KHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKTtcbn1cblxuLyoqXG4gKiBSZWplY3QgcGF5bG9hZHMgdGhhdCBjb3VsZCBwb2lzb24gcHJvdG90eXBlcyB3aGVuIG1lcmdlZCBvciBzcHJlYWQuXG4gKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHBhcmFtIHtzdHJpbmd9IHBhdGhcbiAqIEBwYXJhbSB7bnVtYmVyfSBkZXB0aFxuICogQHJldHVybnMge3tvazogdHJ1ZX0gfCB7b2s6IGZhbHNlLCBwYXRoOiBzdHJpbmcsIGtleTogc3RyaW5nfX1cbiAqL1xuZnVuY3Rpb24gc2NhblVuc2FmZUtleXModmFsdWUsIHBhdGgsIGRlcHRoKSB7XG4gIGlmIChkZXB0aCA+IE1BWF9LRVlfU0NBTl9ERVBUSCB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIHsgb2s6IHRydWUgfTtcbiAgfVxuICBjb25zdCBlbnRyaWVzID0gQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyB2YWx1ZS5lbnRyaWVzKCkgOiBPYmplY3QuZW50cmllcyh2YWx1ZSk7XG4gIGZvciAoY29uc3QgW2tleSwgY2hpbGRdIG9mIGVudHJpZXMpIHtcbiAgICBjb25zdCBjaGlsZFBhdGggPSBBcnJheS5pc0FycmF5KHZhbHVlKSA/IGAke3BhdGh9WyR7a2V5fV1gIDogYCR7cGF0aH0uJHtrZXl9YDtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWUpICYmIFVOU0FGRV9LRVlTLmhhcyhTdHJpbmcoa2V5KSkpIHtcbiAgICAgIHJldHVybiB7IG9rOiBmYWxzZSwgcGF0aDogY2hpbGRQYXRoLCBrZXk6IFN0cmluZyhrZXkpIH07XG4gICAgfVxuICAgIGNvbnN0IG5lc3RlZCA9IHNjYW5VbnNhZmVLZXlzKGNoaWxkLCBjaGlsZFBhdGgsIGRlcHRoICsgMSk7XG4gICAgaWYgKCFuZXN0ZWQub2spIHtcbiAgICAgIHJldHVybiBuZXN0ZWQ7XG4gICAgfVxuICB9XG4gIHJldHVybiB7IG9rOiB0cnVlIH07XG59XG5cbi8qKlxuICogVmFsaWRhdGUgYW4gaW5ib3VuZCBtZXNzYWdlIGFnYWluc3QgdGhlIHByb3RvY29sIGNvbnRyYWN0LlxuICpcbiAqIFZhbGlkYXRpb24gaXMgdG90YWw6IGV2ZXJ5IHJlamVjdGlvbiByZXR1cm5zIGEgdHlwZWQgZmFpbHVyZSB3aXRoIGEgc3RhYmxlXG4gKiByZWFzb24gY29kZSwgYW5kIG5ldmVyIHRocm93cy5cbiAqXG4gKiBAcGFyYW0ge3Vua25vd259IHJhd1xuICogQHBhcmFtIHt7ZGlyZWN0aW9uOiAnd2Vidmlld190b19ob3N0JyB8ICdob3N0X3RvX3dlYnZpZXcnfX0gb3B0aW9uc1xuICogQHJldHVybnMge1ZhbGlkYXRpb25TdWNjZXNzIHwgVmFsaWRhdGlvbkZhaWx1cmV9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUVudmVsb3BlKHJhdywgb3B0aW9ucykge1xuICBjb25zdCBkaXJlY3Rpb24gPSBvcHRpb25zPy5kaXJlY3Rpb247XG4gIGNvbnN0IGFsbG93bGlzdCA9IEtJTkRfQUxMT1dMSVNUW2RpcmVjdGlvbl07XG4gIGlmICghYWxsb3dsaXN0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgIHJlYXNvbjogJ3Vua25vd25fZGlyZWN0aW9uJyxcbiAgICAgIG1lc3NhZ2U6IGBVbmtub3duIHByb3RvY29sIGRpcmVjdGlvbjogJHtTdHJpbmcoZGlyZWN0aW9uKX1gLFxuICAgIH07XG4gIH1cblxuICBpZiAoIWlzUGxhaW5PYmplY3QocmF3KSkge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9QUk9UT0NPTCcsXG4gICAgICByZWFzb246ICdub3RfYW5fb2JqZWN0JyxcbiAgICAgIG1lc3NhZ2U6ICdNZXNzYWdlIG11c3QgYmUgYSBwbGFpbiBvYmplY3QuJyxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgY2FuZGlkYXRlID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKHJhdyk7XG5cbiAgaWYgKGNhbmRpZGF0ZS5wcm90b2NvbFZlcnNpb24gIT09IFBST1RPQ09MX1ZFUlNJT04pIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAndmVyc2lvbl9taXNtYXRjaCcsXG4gICAgICBtZXNzYWdlOiBgVW5zdXBwb3J0ZWQgcHJvdG9jb2wgdmVyc2lvbjogZXhwZWN0ZWQgJHtQUk9UT0NPTF9WRVJTSU9OfSwgcmVjZWl2ZWQgJHtTdHJpbmcoXG4gICAgICAgIGNhbmRpZGF0ZS5wcm90b2NvbFZlcnNpb24sXG4gICAgICApfS5gLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBraW5kID0gY2FuZGlkYXRlLmtpbmQ7XG4gIGlmICh0eXBlb2Yga2luZCAhPT0gJ3N0cmluZycgfHwgIUtJTkRfUEFUVEVSTi50ZXN0KGtpbmQpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgIHJlYXNvbjogJ2ludmFsaWRfa2luZCcsXG4gICAgICBtZXNzYWdlOiAnTWVzc2FnZSBraW5kIG11c3QgbG9vayBsaWtlIFwiZG9tYWluLmFjdGlvblwiIGluIGxvd2VyIGNhc2UuJyxcbiAgICAgIHBhdGg6ICdraW5kJyxcbiAgICB9O1xuICB9XG5cbiAgaWYgKCFhbGxvd2xpc3QuaGFzKGtpbmQpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgIHJlYXNvbjogJ3Vua25vd25fa2luZCcsXG4gICAgICBtZXNzYWdlOiBgS2luZCBcIiR7a2luZH1cIiBpcyBub3QgYWNjZXB0ZWQgaW4gZGlyZWN0aW9uIFwiJHtkaXJlY3Rpb259XCIuYCxcbiAgICAgIHBhdGg6ICdraW5kJyxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgcmVxdWVzdElkID0gY2FuZGlkYXRlLnJlcXVlc3RJZDtcbiAgaWYgKHJlcXVlc3RJZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKHR5cGVvZiByZXF1ZXN0SWQgIT09ICdzdHJpbmcnIHx8ICFSRVFVRVNUX0lEX1BBVFRFUk4udGVzdChyZXF1ZXN0SWQpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBvazogZmFsc2UsXG4gICAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgICAgcmVhc29uOiAnaW52YWxpZF9yZXF1ZXN0X2lkJyxcbiAgICAgICAgbWVzc2FnZTogJ3JlcXVlc3RJZCBtdXN0IGJlIDEtMTI4IGNoYXJhY3RlcnMgb2YgQS1aLCBhLXosIDAtOSwgXCJfXCIgb3IgXCItXCIuJyxcbiAgICAgICAgcGF0aDogJ3JlcXVlc3RJZCcsXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHBheWxvYWQgPSBjYW5kaWRhdGUucGF5bG9hZCA/PyB7fTtcbiAgaWYgKCFpc1BsYWluT2JqZWN0KHBheWxvYWQpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgIHJlYXNvbjogJ2ludmFsaWRfcGF5bG9hZCcsXG4gICAgICBtZXNzYWdlOiAncGF5bG9hZCBtdXN0IGJlIGEgcGxhaW4gb2JqZWN0LicsXG4gICAgICBwYXRoOiAncGF5bG9hZCcsXG4gICAgICByZXF1ZXN0SWQ6IHR5cGVvZiByZXF1ZXN0SWQgPT09ICdzdHJpbmcnID8gcmVxdWVzdElkIDogdW5kZWZpbmVkLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBrZXlTY2FuID0gc2NhblVuc2FmZUtleXMocGF5bG9hZCwgJ3BheWxvYWQnLCAwKTtcbiAgaWYgKCFrZXlTY2FuLm9rKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgIHJlYXNvbjogJ3Vuc2FmZV9rZXknLFxuICAgICAgbWVzc2FnZTogYFBheWxvYWQgY29udGFpbnMgYSBmb3JiaWRkZW4ga2V5IFwiJHtrZXlTY2FuLmtleX1cIi5gLFxuICAgICAgcGF0aDoga2V5U2Nhbi5wYXRoLFxuICAgICAgcmVxdWVzdElkOiB0eXBlb2YgcmVxdWVzdElkID09PSAnc3RyaW5nJyA/IHJlcXVlc3RJZCA6IHVuZGVmaW5lZCxcbiAgICB9O1xuICB9XG5cbiAgaWYgKG1lc3NhZ2VTaXplKGNhbmRpZGF0ZSkgPiBNQVhfUEFZTE9BRF9CWVRFUykge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9MSU1JVCcsXG4gICAgICByZWFzb246ICdwYXlsb2FkX3Rvb19sYXJnZScsXG4gICAgICBtZXNzYWdlOiBgTWVzc2FnZSBleGNlZWRzIHRoZSAke01BWF9QQVlMT0FEX0JZVEVTfSBieXRlIGxpbWl0LmAsXG4gICAgICByZXF1ZXN0SWQ6IHR5cGVvZiByZXF1ZXN0SWQgPT09ICdzdHJpbmcnID8gcmVxdWVzdElkIDogdW5kZWZpbmVkLFxuICAgIH07XG4gIH1cblxuICAvKiogQHR5cGUge0VudmVsb3BlfSAqL1xuICBjb25zdCBlbnZlbG9wZSA9IHtcbiAgICBwcm90b2NvbFZlcnNpb246IFBST1RPQ09MX1ZFUlNJT04sXG4gICAga2luZCxcbiAgICBwYXlsb2FkLFxuICB9O1xuICBpZiAodHlwZW9mIHJlcXVlc3RJZCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbnZlbG9wZS5yZXF1ZXN0SWQgPSByZXF1ZXN0SWQ7XG4gIH1cblxuICByZXR1cm4geyBvazogdHJ1ZSwgZW52ZWxvcGUgfTtcbn1cbiIsICIvKipcbiAqIFdlYnZpZXcgbWVzc2FnZSBicmlkZ2UuXG4gKlxuICogU3ltbWV0cmljIGltcGxlbWVudGF0aW9uIHVzZWQgYnkgYm90aCB0aGUgZXh0ZW5zaW9uIGhvc3QgYW5kIHRoZSB3ZWJ2aWV3LlxuICogUmVzcG9uc2liaWxpdGllczpcbiAqIC0gVmFsaWRhdGUgZXZlcnkgaW5ib3VuZCBtZXNzYWdlIGJlZm9yZSBhbnkgaGFuZGxlciBzZWVzIGl0LlxuICogLSBDb3JyZWxhdGUgcmVxdWVzdHMgd2l0aCByZXNwb25zZXMsIHdpdGggYSB0aW1lb3V0IHBlciByZXF1ZXN0LlxuICogLSBDb250YWluIGhhbmRsZXIgZmFpbHVyZXMgYW5kIHJlcG9ydCB0aGVtIGFzIHR5cGVkIHByb3RvY29sIGVycm9ycy5cbiAqIC0gUmVqZWN0IHdvcmsgYWZ0ZXIgZGlzcG9zYWwgc28gYSBjbG9zZWQgcGFuZWwgY2Fubm90IGxlYWsgdGltZXJzLlxuICpcbiAqIFRoZSBicmlkZ2UgaGFzIG5vIGRlcGVuZGVuY3kgb24gdGhlIGB2c2NvZGVgIG1vZHVsZTogdGhlIHRyYW5zcG9ydCAoYHBvc3RgKVxuICogaXMgaW5qZWN0ZWQuIFRoYXQgbWFrZXMgdGhlIHdob2xlIHJlcXVlc3QvcmVzcG9uc2UgY29udHJhY3QgdW5pdC10ZXN0YWJsZSBpblxuICogcGxhaW4gTm9kZS5cbiAqL1xuXG5pbXBvcnQge1xuICBESVJFQ1RJT05TLFxuICBIT1NUX1RPX1dFQlZJRVcsXG4gIFdFQlZJRVdfVE9fSE9TVCxcbiAgY3JlYXRlRW52ZWxvcGUsXG4gIGNyZWF0ZUVycm9yUGF5bG9hZCxcbiAgbWVzc2FnZVNpemUsXG4gIHZhbGlkYXRlRW52ZWxvcGUsXG59IGZyb20gJy4vZW52ZWxvcGUuanMnO1xuXG5leHBvcnQgY2xhc3MgUHJvdG9jb2xFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IFtkZXRhaWxdXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjb2RlLCBtZXNzYWdlLCBkZXRhaWwpIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSAnUHJvdG9jb2xFcnJvcic7XG4gICAgdGhpcy5jb2RlID0gY29kZTtcbiAgICBpZiAoZGV0YWlsKSB7XG4gICAgICB0aGlzLmRldGFpbCA9IGRldGFpbDtcbiAgICB9XG4gIH1cbn1cblxuLyoqIEB0eXBlIHt7ZGVidWc6IEZ1bmN0aW9uLCB3YXJuOiBGdW5jdGlvbiwgZXJyb3I6IEZ1bmN0aW9ufX0gKi9cbmNvbnN0IE5PT1BfTE9HR0VSID0ge1xuICBkZWJ1ZygpIHt9LFxuICB3YXJuKCkge30sXG4gIGVycm9yKCkge30sXG59O1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEJyaWRnZU9wdGlvbnNcbiAqIEBwcm9wZXJ0eSB7KG1lc3NhZ2U6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSA9PiB2b2lkfSBwb3N0ICBUcmFuc3BvcnQgdG8gdGhlIG90aGVyIHNpZGUuXG4gKiBAcHJvcGVydHkgeyd3ZWJ2aWV3X3RvX2hvc3QnIHwgJ2hvc3RfdG9fd2Vidmlldyd9IGluYm91bmREaXJlY3Rpb25cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbdGltZW91dE1zXVxuICogQHByb3BlcnR5IHtudW1iZXJ9IFttYXhJbkZsaWdodF1cbiAqIEBwcm9wZXJ0eSB7KCkgPT4gc3RyaW5nfSBbY3JlYXRlUmVxdWVzdElkXVxuICogQHByb3BlcnR5IHt0eXBlb2YgTk9PUF9MT0dHRVJ9IFtsb2dnZXJdXG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge0JyaWRnZU9wdGlvbnN9IG9wdGlvbnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUJyaWRnZShvcHRpb25zKSB7XG4gIGNvbnN0IHsgcG9zdCwgaW5ib3VuZERpcmVjdGlvbiwgbG9nZ2VyID0gTk9PUF9MT0dHRVIgfSA9IG9wdGlvbnM7XG4gIGNvbnN0IHRpbWVvdXRNcyA9IG9wdGlvbnMudGltZW91dE1zID8/IDUwMDA7XG4gIGNvbnN0IG1heEluRmxpZ2h0ID0gb3B0aW9ucy5tYXhJbkZsaWdodCA/PyAzMjtcbiAgY29uc3Qgb3V0Ym91bmREaXJlY3Rpb24gPVxuICAgIGluYm91bmREaXJlY3Rpb24gPT09IERJUkVDVElPTlMuV0VCVklFV19UT19IT1NUXG4gICAgICA/IERJUkVDVElPTlMuSE9TVF9UT19XRUJWSUVXXG4gICAgICA6IERJUkVDVElPTlMuV0VCVklFV19UT19IT1NUO1xuICBjb25zdCBvdXRib3VuZEtpbmRzID0gbmV3IFNldChcbiAgICBvdXRib3VuZERpcmVjdGlvbiA9PT0gRElSRUNUSU9OUy5IT1NUX1RPX1dFQlZJRVcgPyBIT1NUX1RPX1dFQlZJRVcgOiBXRUJWSUVXX1RPX0hPU1QsXG4gICk7XG5cbiAgbGV0IHNlcXVlbmNlID0gMDtcbiAgY29uc3QgY3JlYXRlUmVxdWVzdElkID1cbiAgICBvcHRpb25zLmNyZWF0ZVJlcXVlc3RJZCA/P1xuICAgICgoKSA9PiB7XG4gICAgICBzZXF1ZW5jZSArPSAxO1xuICAgICAgcmV0dXJuIGByJHtzZXF1ZW5jZS50b1N0cmluZygzNil9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgMTApfWA7XG4gICAgfSk7XG5cbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCB7cmVzb2x2ZTogRnVuY3Rpb24sIHJlamVjdDogRnVuY3Rpb24sIHRpbWVyOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0Pn0+fSAqL1xuICBjb25zdCBwZW5kaW5nID0gbmV3IE1hcCgpO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIChwYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgbWV0YToge3JlcXVlc3RJZD86IHN0cmluZ30pID0+IHVua25vd24+fSAqL1xuICBjb25zdCBoYW5kbGVycyA9IG5ldyBNYXAoKTtcbiAgY29uc3QgcmVwb3J0ZWRLaW5kcyA9IG5ldyBTZXQoKTtcbiAgbGV0IGRpc3Bvc2VkID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBraW5kXG4gICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IHBheWxvYWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtyZXF1ZXN0SWRdXG4gICAqL1xuICBmdW5jdGlvbiBzZW5kKGtpbmQsIHBheWxvYWQsIHJlcXVlc3RJZCkge1xuICAgIGlmIChkaXNwb3NlZCkge1xuICAgICAgdGhyb3cgbmV3IFByb3RvY29sRXJyb3IoJ0VfQ0FOQ0VMTEVEJywgJ0JyaWRnZSBpcyBkaXNwb3NlZC4nKTtcbiAgICB9XG4gICAgaWYgKCFvdXRib3VuZEtpbmRzLmhhcyhraW5kKSkge1xuICAgICAgdGhyb3cgbmV3IFByb3RvY29sRXJyb3IoJ0VfUFJPVE9DT0wnLCBgS2luZCBcIiR7a2luZH1cIiBpcyBub3Qgc2VuZGFibGUgaW4gdGhpcyBkaXJlY3Rpb24uYCk7XG4gICAgfVxuICAgIGNvbnN0IGVudmVsb3BlID0gY3JlYXRlRW52ZWxvcGUoa2luZCwgcGF5bG9hZCwgcmVxdWVzdElkKTtcbiAgICBpZiAobWVzc2FnZVNpemUoZW52ZWxvcGUpID4gMV8wMDBfMDAwKSB7XG4gICAgICB0aHJvdyBuZXcgUHJvdG9jb2xFcnJvcignRV9MSU1JVCcsICdSZWZ1c2luZyB0byBzZW5kIGFuIG92ZXJzaXplZCBtZXNzYWdlLicpO1xuICAgIH1cbiAgICBwb3N0KGVudmVsb3BlKTtcbiAgICBsb2dnZXIuZGVidWcoJ3Byb3RvY29sLnNlbmQnLCB7XG4gICAgICBraW5kLFxuICAgICAgcmVxdWVzdElkOiByZXF1ZXN0SWQgPz8gbnVsbCxcbiAgICAgIGJ5dGVzOiBtZXNzYWdlU2l6ZShlbnZlbG9wZSksXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtyZXF1ZXN0SWRdXG4gICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IFtkZXRhaWxdXG4gICAqL1xuICBmdW5jdGlvbiBzZW5kRXJyb3IoY29kZSwgbWVzc2FnZSwgcmVxdWVzdElkLCBkZXRhaWwpIHtcbiAgICB0cnkge1xuICAgICAgc2VuZCgncHJvdG9jb2wuZXJyb3InLCBjcmVhdGVFcnJvclBheWxvYWQoY29kZSwgbWVzc2FnZSwgZGV0YWlsKSwgcmVxdWVzdElkKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFRoZSBwYW5lbCBtYXkgYWxyZWFkeSBiZSBnb25lLiBOb3RoaW5nIHVzZWZ1bCByZW1haW5zIHRvIGRvLlxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2luZFxuICAgKiBAcGFyYW0geyhwYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiwgbWV0YToge3JlcXVlc3RJZD86IHN0cmluZ30pID0+IHVua25vd259IGhhbmRsZXJcbiAgICogQHJldHVybnMgeygpID0+IHZvaWR9IHVuc3Vic2NyaWJlXG4gICAqL1xuICBmdW5jdGlvbiBvbihraW5kLCBoYW5kbGVyKSB7XG4gICAgaGFuZGxlcnMuc2V0KGtpbmQsIGhhbmRsZXIpO1xuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICBpZiAoaGFuZGxlcnMuZ2V0KGtpbmQpID09PSBoYW5kbGVyKSB7XG4gICAgICAgIGhhbmRsZXJzLmRlbGV0ZShraW5kKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSByZXF1ZXN0IGFuZCBhd2FpdCB0aGUgY29ycmVsYXRlZCByZXNwb25zZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtpbmRcbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW3BheWxvYWRdXG4gICAqIEBwYXJhbSB7e3RpbWVvdXRNcz86IG51bWJlcn19IFtyZXF1ZXN0T3B0aW9uc11cbiAgICogQHJldHVybnMge1Byb21pc2U8e2tpbmQ6IHN0cmluZywgcGF5bG9hZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj59Pn1cbiAgICovXG4gIGZ1bmN0aW9uIHJlcXVlc3Qoa2luZCwgcGF5bG9hZCA9IHt9LCByZXF1ZXN0T3B0aW9ucyA9IHt9KSB7XG4gICAgaWYgKGRpc3Bvc2VkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IFByb3RvY29sRXJyb3IoJ0VfQ0FOQ0VMTEVEJywgJ0JyaWRnZSBpcyBkaXNwb3NlZC4nKSk7XG4gICAgfVxuICAgIGlmIChwZW5kaW5nLnNpemUgPj0gbWF4SW5GbGlnaHQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcbiAgICAgICAgbmV3IFByb3RvY29sRXJyb3IoJ0VfTElNSVQnLCBgVG9vIG1hbnkgaW4tZmxpZ2h0IHJlcXVlc3RzICgke21heEluRmxpZ2h0fSkuYCksXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCByZXF1ZXN0SWQgPSBjcmVhdGVSZXF1ZXN0SWQoKTtcbiAgICBjb25zdCBlZmZlY3RpdmVUaW1lb3V0ID0gcmVxdWVzdE9wdGlvbnMudGltZW91dE1zID8/IHRpbWVvdXRNcztcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBwZW5kaW5nLmRlbGV0ZShyZXF1ZXN0SWQpO1xuICAgICAgICByZWplY3QoXG4gICAgICAgICAgbmV3IFByb3RvY29sRXJyb3IoXG4gICAgICAgICAgICAnRV9USU1FT1VUJyxcbiAgICAgICAgICAgIGBObyByZXNwb25zZSB0byBcIiR7a2luZH1cIiB3aXRoaW4gJHtlZmZlY3RpdmVUaW1lb3V0fSBtcy5gLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBraW5kLFxuICAgICAgICAgICAgICByZXF1ZXN0SWQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICksXG4gICAgICAgICk7XG4gICAgICB9LCBlZmZlY3RpdmVUaW1lb3V0KTtcbiAgICAgIHBlbmRpbmcuc2V0KHJlcXVlc3RJZCwgeyByZXNvbHZlLCByZWplY3QsIHRpbWVyIH0pO1xuICAgICAgdHJ5IHtcbiAgICAgICAgc2VuZChraW5kLCBwYXlsb2FkLCByZXF1ZXN0SWQpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgcGVuZGluZy5kZWxldGUocmVxdWVzdElkKTtcbiAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3Vua25vd259IHJhd1xuICAgKiBAcmV0dXJucyB7UHJvbWlzZTx7b2s6IGJvb2xlYW4sIGNvZGU/OiBzdHJpbmcsIHJlYXNvbj86IHN0cmluZ30+fVxuICAgKi9cbiAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlTWVzc2FnZShyYXcpIHtcbiAgICBpZiAoZGlzcG9zZWQpIHtcbiAgICAgIHJldHVybiB7IG9rOiBmYWxzZSwgY29kZTogJ0VfQ0FOQ0VMTEVEJywgcmVhc29uOiAnZGlzcG9zZWQnIH07XG4gICAgfVxuXG4gICAgY29uc3QgdmFsaWRhdGlvbiA9IHZhbGlkYXRlRW52ZWxvcGUocmF3LCB7IGRpcmVjdGlvbjogaW5ib3VuZERpcmVjdGlvbiB9KTtcbiAgICBpZiAoIXZhbGlkYXRpb24ub2spIHtcbiAgICAgIGlmICghcmVwb3J0ZWRLaW5kcy5oYXModmFsaWRhdGlvbi5yZWFzb24pKSB7XG4gICAgICAgIHJlcG9ydGVkS2luZHMuYWRkKHZhbGlkYXRpb24ucmVhc29uKTtcbiAgICAgICAgbG9nZ2VyLndhcm4oJ3Byb3RvY29sLnJlamVjdGVkJywge1xuICAgICAgICAgIHJlYXNvbjogdmFsaWRhdGlvbi5yZWFzb24sXG4gICAgICAgICAgcGF0aDogdmFsaWRhdGlvbi5wYXRoID8/IG51bGwsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgc2VuZEVycm9yKHZhbGlkYXRpb24uY29kZSwgdmFsaWRhdGlvbi5tZXNzYWdlLCB2YWxpZGF0aW9uLnJlcXVlc3RJZCwge1xuICAgICAgICByZWFzb246IHZhbGlkYXRpb24ucmVhc29uLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4geyBvazogZmFsc2UsIGNvZGU6IHZhbGlkYXRpb24uY29kZSwgcmVhc29uOiB2YWxpZGF0aW9uLnJlYXNvbiB9O1xuICAgIH1cblxuICAgIGNvbnN0IGVudmVsb3BlID0gdmFsaWRhdGlvbi5lbnZlbG9wZTtcbiAgICBjb25zdCB7IGtpbmQsIHJlcXVlc3RJZCwgcGF5bG9hZCB9ID0gZW52ZWxvcGU7XG4gICAgbG9nZ2VyLmRlYnVnKCdwcm90b2NvbC5yZWNlaXZlJywge1xuICAgICAga2luZCxcbiAgICAgIHJlcXVlc3RJZDogcmVxdWVzdElkID8/IG51bGwsXG4gICAgICBieXRlczogbWVzc2FnZVNpemUoZW52ZWxvcGUpLFxuICAgIH0pO1xuXG4gICAgaWYgKGtpbmQgPT09ICdwcm90b2NvbC5lcnJvcicpIHtcbiAgICAgIGlmIChyZXF1ZXN0SWQgJiYgcGVuZGluZy5oYXMocmVxdWVzdElkKSkge1xuICAgICAgICBjb25zdCBlbnRyeSA9IHBlbmRpbmcuZ2V0KHJlcXVlc3RJZCk7XG4gICAgICAgIGlmIChlbnRyeSkge1xuICAgICAgICAgIGNsZWFyVGltZW91dChlbnRyeS50aW1lcik7XG4gICAgICAgICAgcGVuZGluZy5kZWxldGUocmVxdWVzdElkKTtcbiAgICAgICAgICBjb25zdCBjb2RlID0gdHlwZW9mIHBheWxvYWQuY29kZSA9PT0gJ3N0cmluZycgPyBwYXlsb2FkLmNvZGUgOiAnRV9QUk9UT0NPTCc7XG4gICAgICAgICAgY29uc3QgbWVzc2FnZSA9XG4gICAgICAgICAgICB0eXBlb2YgcGF5bG9hZC5tZXNzYWdlID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICA/IHBheWxvYWQubWVzc2FnZVxuICAgICAgICAgICAgICA6ICdUaGUgb3RoZXIgc2lkZSByZXBvcnRlZCBhbiBlcnJvci4nO1xuICAgICAgICAgIGVudHJ5LnJlamVjdChuZXcgUHJvdG9jb2xFcnJvcihjb2RlLCBtZXNzYWdlLCB7IHJlcXVlc3RJZCB9KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB7IG9rOiB0cnVlIH07XG4gICAgfVxuXG4gICAgaWYgKHJlcXVlc3RJZCAmJiBwZW5kaW5nLmhhcyhyZXF1ZXN0SWQpKSB7XG4gICAgICBjb25zdCBlbnRyeSA9IHBlbmRpbmcuZ2V0KHJlcXVlc3RJZCk7XG4gICAgICBpZiAoZW50cnkpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGVudHJ5LnRpbWVyKTtcbiAgICAgICAgcGVuZGluZy5kZWxldGUocmVxdWVzdElkKTtcbiAgICAgICAgZW50cnkucmVzb2x2ZSh7IGtpbmQsIHBheWxvYWQgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4geyBvazogdHJ1ZSB9O1xuICAgIH1cblxuICAgIGNvbnN0IGhhbmRsZXIgPSBoYW5kbGVycy5nZXQoa2luZCk7XG4gICAgaWYgKCFoYW5kbGVyKSB7XG4gICAgICAvLyBBIHJlc3BvbnNlIHdob3NlIHJlcXVlc3QgYWxyZWFkeSB0aW1lZCBvdXQgaXMgZXhwZWN0ZWQgYW5kIGhhcm1sZXNzLlxuICAgICAgbG9nZ2VyLmRlYnVnKCdwcm90b2NvbC51bmhhbmRsZWQnLCB7IGtpbmQsIHJlcXVlc3RJZDogcmVxdWVzdElkID8/IG51bGwgfSk7XG4gICAgICByZXR1cm4geyBvazogdHJ1ZSB9O1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBoYW5kbGVyKHBheWxvYWQsIHsgcmVxdWVzdElkIH0pO1xuICAgICAgcmV0dXJuIHsgb2s6IHRydWUgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgIGNvbnN0IGNvZGUgPVxuICAgICAgICBlcnJvciBpbnN0YW5jZW9mIFByb3RvY29sRXJyb3JcbiAgICAgICAgICA/IGVycm9yLmNvZGVcbiAgICAgICAgICA6ICgvKiogQHR5cGUge3tjb2RlPzogc3RyaW5nfX0gKi8gKGVycm9yKT8uY29kZSA/PyAnRV9QUk9UT0NPTCcpO1xuICAgICAgbG9nZ2VyLmVycm9yKCdwcm90b2NvbC5oYW5kbGVyX2ZhaWxlZCcsIHsga2luZCwgZXJyb3I6IG1lc3NhZ2UgfSk7XG4gICAgICBzZW5kRXJyb3IoY29kZSwgbWVzc2FnZSwgcmVxdWVzdElkKTtcbiAgICAgIHJldHVybiB7IG9rOiBmYWxzZSwgY29kZSB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcmVhc29uXG4gICAqL1xuICBmdW5jdGlvbiBkaXNwb3NlKHJlYXNvbiA9ICdkaXNwb3NlZCcpIHtcbiAgICBpZiAoZGlzcG9zZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZGlzcG9zZWQgPSB0cnVlO1xuICAgIGZvciAoY29uc3QgWywgZW50cnldIG9mIHBlbmRpbmcpIHtcbiAgICAgIGNsZWFyVGltZW91dChlbnRyeS50aW1lcik7XG4gICAgICBlbnRyeS5yZWplY3QobmV3IFByb3RvY29sRXJyb3IoJ0VfQ0FOQ0VMTEVEJywgYEJyaWRnZSBjbG9zZWQ6ICR7cmVhc29ufWApKTtcbiAgICB9XG4gICAgcGVuZGluZy5jbGVhcigpO1xuICAgIGhhbmRsZXJzLmNsZWFyKCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG9uLFxuICAgIHJlcXVlc3QsXG4gICAgcmVzcG9uZDogc2VuZCxcbiAgICBoYW5kbGVNZXNzYWdlLFxuICAgIGRpc3Bvc2UsXG4gICAgcGVuZGluZ0NvdW50OiAoKSA9PiBwZW5kaW5nLnNpemUsXG4gICAgaXNEaXNwb3NlZDogKCkgPT4gZGlzcG9zZWQsXG4gICAgZGlyZWN0aW9uOiBpbmJvdW5kRGlyZWN0aW9uLFxuICB9O1xufVxuIiwgIi8qKlxuICogRGV0ZXJtaW5pc3RpYyBsYXllcmVkIGxheW91dC5cbiAqXG4gKiBQaGFzZSAwIG5lZWRzIHBvc2l0aW9ucyBzbyB0aGUgd2VidmlldyBjYW4gZHJhdyBzb21ldGhpbmcgd2l0aG91dCBvd25pbmcgYVxuICogbGF5b3V0IGFsZ29yaXRobS4gUGhhc2UgNCBiZW5jaG1hcmtzIHJlYWwgZW5naW5lcyAoQ3l0b3NjYXBlL0VMSy9kYWdyZSkgYW5kXG4gKiByZXBsYWNlcyB0aGlzIGJlaGluZCB0aGUgcmVuZGVyZXIgYm91bmRhcnk7IHVudGlsIHRoZW4sIGRldGVybWluaXN0aWMgb3V0cHV0XG4gKiBpcyBtb3JlIHZhbHVhYmxlIHRoYW4gcHJldHR5IG91dHB1dCBiZWNhdXNlIGl0IG1ha2VzIHRlc3RzIHN0YWJsZS5cbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4vbW9kZWwuanMnKS5HcmFwaH0gR3JhcGhcbiAqIEB0eXBlZGVmIHt7eDogbnVtYmVyLCB5OiBudW1iZXIsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBsYXllcjogbnVtYmVyfX0gUG9zaXRpb25cbiAqL1xuXG5leHBvcnQgY29uc3QgTEFZT1VUX0RFRkFVTFRTID0gT2JqZWN0LmZyZWV6ZSh7XG4gIG5vZGVXaWR0aDogMTkwLFxuICBub2RlSGVpZ2h0OiA1NCxcbiAgaG9yaXpvbnRhbEdhcDogOTAsXG4gIHZlcnRpY2FsR2FwOiAyNixcbiAgbWF4TGF5ZXJzOiA0MCxcbn0pO1xuXG4vKipcbiAqIEBwYXJhbSB7R3JhcGh9IGdyYXBoXG4gKiBAcGFyYW0ge1BhcnRpYWw8dHlwZW9mIExBWU9VVF9ERUZBVUxUUz59IFtvcHRpb25zXVxuICogQHJldHVybnMge3twb3NpdGlvbnM6IFJlY29yZDxzdHJpbmcsIFBvc2l0aW9uPiwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIGxheWVyczogc3RyaW5nW11bXX19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlTGF5b3V0KGdyYXBoLCBvcHRpb25zID0ge30pIHtcbiAgY29uc3QgY29uZmlnID0geyAuLi5MQVlPVVRfREVGQVVMVFMsIC4uLm9wdGlvbnMgfTtcbiAgY29uc3Qgbm9kZUlkcyA9IGdyYXBoLm5vZGVzLm1hcCgobm9kZSkgPT4gbm9kZS5pZCk7XG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywgbnVtYmVyPn0gKi9cbiAgY29uc3QgbGF5ZXJPZiA9IG5ldyBNYXAoKTtcblxuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIHN0cmluZ1tdPn0gKi9cbiAgY29uc3QgaW5jb21pbmcgPSBuZXcgTWFwKG5vZGVJZHMubWFwKChpZCkgPT4gW2lkLCBbXV0pKTtcbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBzdHJpbmdbXT59ICovXG4gIGNvbnN0IG91dGdvaW5nID0gbmV3IE1hcChub2RlSWRzLm1hcCgoaWQpID0+IFtpZCwgW11dKSk7XG5cbiAgZm9yIChjb25zdCBlZGdlIG9mIGdyYXBoLmVkZ2VzKSB7XG4gICAgaWYgKCFpbmNvbWluZy5oYXMoZWRnZS50bykgfHwgIWluY29taW5nLmhhcyhlZGdlLmZyb20pIHx8IGVkZ2UuZnJvbSA9PT0gZWRnZS50bykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGluY29taW5nLmdldChlZGdlLnRvKT8ucHVzaChlZGdlLmZyb20pO1xuICAgIG91dGdvaW5nLmdldChlZGdlLmZyb20pPy5wdXNoKGVkZ2UudG8pO1xuICB9XG5cbiAgLy8gS2FobidzIGFsZ29yaXRobSBnaXZlcyBhIHRvcG9sb2dpY2FsIG9yZGVyOyBjeWNsZXMgYXJlIGhhbmRsZWQgYWZ0ZXJ3YXJkcy5cbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBudW1iZXI+fSAqL1xuICBjb25zdCBpbmRlZ3JlZSA9IG5ldyBNYXAobm9kZUlkcy5tYXAoKGlkKSA9PiBbaWQsIGluY29taW5nLmdldChpZCk/Lmxlbmd0aCA/PyAwXSkpO1xuICBjb25zdCByZWFkeSA9IG5vZGVJZHMuZmlsdGVyKChpZCkgPT4gKGluZGVncmVlLmdldChpZCkgPz8gMCkgPT09IDApLnNvcnQoKTtcbiAgLyoqIEB0eXBlIHtzdHJpbmdbXX0gKi9cbiAgY29uc3Qgb3JkZXIgPSBbXTtcblxuICB3aGlsZSAocmVhZHkubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGlkID0gLyoqIEB0eXBlIHtzdHJpbmd9ICovIChyZWFkeS5zaGlmdCgpKTtcbiAgICBvcmRlci5wdXNoKGlkKTtcbiAgICBmb3IgKGNvbnN0IG5leHQgb2YgKG91dGdvaW5nLmdldChpZCkgPz8gW10pLnNsaWNlKCkuc29ydCgpKSB7XG4gICAgICBjb25zdCByZW1haW5pbmcgPSAoaW5kZWdyZWUuZ2V0KG5leHQpID8/IDApIC0gMTtcbiAgICAgIGluZGVncmVlLnNldChuZXh0LCByZW1haW5pbmcpO1xuICAgICAgaWYgKHJlbWFpbmluZyA9PT0gMCkge1xuICAgICAgICByZWFkeS5wdXNoKG5leHQpO1xuICAgICAgICByZWFkeS5zb3J0KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgbGV0IG1heExheWVyID0gMDtcbiAgZm9yIChjb25zdCBpZCBvZiBvcmRlcikge1xuICAgIGNvbnN0IHByZWRlY2Vzc29ycyA9IGluY29taW5nLmdldChpZCkgPz8gW107XG4gICAgY29uc3QgbGF5ZXIgPVxuICAgICAgcHJlZGVjZXNzb3JzLmxlbmd0aCA9PT0gMFxuICAgICAgICA/IDBcbiAgICAgICAgOiBNYXRoLm1heCguLi5wcmVkZWNlc3NvcnMubWFwKChwcmVkKSA9PiBsYXllck9mLmdldChwcmVkKSA/PyAwKSkgKyAxO1xuICAgIGxheWVyT2Yuc2V0KGlkLCBsYXllcik7XG4gICAgbWF4TGF5ZXIgPSBNYXRoLm1heChtYXhMYXllciwgbGF5ZXIpO1xuICB9XG5cbiAgLy8gTm9kZXMgaW5zaWRlIGEgY3ljbGUgbmV2ZXIgcmVhY2ggaW5kZWdyZWUgMC4gUGxhY2UgdGhlbSBhZnRlciBldmVyeXRoaW5nXG4gIC8vIHRoYXQgY291bGQgYmUgb3JkZXJlZCwgcmF0aGVyIHRoYW4gZHJvcHBpbmcgdGhlbS5cbiAgY29uc3QgY3ljbGljID0gbm9kZUlkcy5maWx0ZXIoKGlkKSA9PiAhbGF5ZXJPZi5oYXMoaWQpKS5zb3J0KCk7XG4gIGZvciAoY29uc3QgaWQgb2YgY3ljbGljKSB7XG4gICAgbGF5ZXJPZi5zZXQoaWQsIE1hdGgubWluKG1heExheWVyICsgMSwgY29uZmlnLm1heExheWVycykpO1xuICB9XG5cbiAgLyoqIEB0eXBlIHtNYXA8bnVtYmVyLCBzdHJpbmdbXT59ICovXG4gIGNvbnN0IGJ5TGF5ZXIgPSBuZXcgTWFwKCk7XG4gIGZvciAoY29uc3QgaWQgb2Ygbm9kZUlkcy5zbGljZSgpLnNvcnQoKSkge1xuICAgIGNvbnN0IGxheWVyID0gTWF0aC5taW4obGF5ZXJPZi5nZXQoaWQpID8/IDAsIGNvbmZpZy5tYXhMYXllcnMpO1xuICAgIGlmICghYnlMYXllci5oYXMobGF5ZXIpKSB7XG4gICAgICBieUxheWVyLnNldChsYXllciwgW10pO1xuICAgIH1cbiAgICBieUxheWVyLmdldChsYXllcik/LnB1c2goaWQpO1xuICB9XG5cbiAgLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCBQb3NpdGlvbj59ICovXG4gIGNvbnN0IHBvc2l0aW9ucyA9IHt9O1xuICAvKiogQHR5cGUge3N0cmluZ1tdW119ICovXG4gIGNvbnN0IGxheWVycyA9IFtdO1xuICBsZXQgdGFsbGVzdCA9IDA7XG5cbiAgZm9yIChjb25zdCBsYXllciBvZiBbLi4uYnlMYXllci5rZXlzKCldLnNvcnQoKGEsIGIpID0+IGEgLSBiKSkge1xuICAgIGNvbnN0IGlkcyA9IGJ5TGF5ZXIuZ2V0KGxheWVyKSA/PyBbXTtcbiAgICBsYXllcnMucHVzaChpZHMpO1xuICAgIGlkcy5mb3JFYWNoKChpZCwgaW5kZXgpID0+IHtcbiAgICAgIHBvc2l0aW9uc1tpZF0gPSB7XG4gICAgICAgIHg6IGxheWVyICogKGNvbmZpZy5ub2RlV2lkdGggKyBjb25maWcuaG9yaXpvbnRhbEdhcCksXG4gICAgICAgIHk6IGluZGV4ICogKGNvbmZpZy5ub2RlSGVpZ2h0ICsgY29uZmlnLnZlcnRpY2FsR2FwKSxcbiAgICAgICAgd2lkdGg6IGNvbmZpZy5ub2RlV2lkdGgsXG4gICAgICAgIGhlaWdodDogY29uZmlnLm5vZGVIZWlnaHQsXG4gICAgICAgIGxheWVyLFxuICAgICAgfTtcbiAgICB9KTtcbiAgICB0YWxsZXN0ID0gTWF0aC5tYXgodGFsbGVzdCwgaWRzLmxlbmd0aCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHBvc2l0aW9ucyxcbiAgICB3aWR0aDogTWF0aC5tYXgoMSwgbGF5ZXJzLmxlbmd0aCkgKiAoY29uZmlnLm5vZGVXaWR0aCArIGNvbmZpZy5ob3Jpem9udGFsR2FwKSxcbiAgICBoZWlnaHQ6IE1hdGgubWF4KDEsIHRhbGxlc3QpICogKGNvbmZpZy5ub2RlSGVpZ2h0ICsgY29uZmlnLnZlcnRpY2FsR2FwKSxcbiAgICBsYXllcnMsXG4gIH07XG59XG4iLCAiLyoqXG4gKiBMYW5ndWFnZS1uZXV0cmFsIENGRyB2b2NhYnVsYXJ5LlxuICpcbiAqIFRoZXNlIG5hbWVzIGFyZSBmcm96ZW4gYnkgYGRvY3MvR1JBUEhfU1BFQ0lGSUNBVElPTi5tZGAuIEFkYXB0ZXJzIGRlc2NyaWJlXG4gKiBzb3VyY2Ugc3RydWN0dXJlIHdpdGggYENvbnRyb2xDb25zdHJ1Y3RgIHRyZWVzOyB0aGlzIG1vZHVsZSBvd25zIHRoZSBzbWFsbGVyXG4gKiBzZXQgb2Ygbm9kZXMgYW5kIGVkZ2VzIHRoZSByZW5kZXJlciB1bmRlcnN0YW5kcy5cbiAqL1xuXG4vKiogTm9kZSBraW5kcyBhIENGRyBtYXkgY29udGFpbi4gKi9cbmV4cG9ydCBjb25zdCBDRkdfTk9ERV9LSU5EUyA9IE9iamVjdC5mcmVlemUoW1xuICAnZW50cnknLFxuICAnZXhpdCcsXG4gICdzdGF0ZW1lbnQnLFxuICAnY29uZGl0aW9uJyxcbiAgJ211bHRpd2F5JyxcbiAgJ21lcmdlJyxcbiAgJ2xvb3BfaGVhZGVyJyxcbiAgJ2xvb3BfbGF0Y2gnLFxuICAnbG9vcF9ib2R5X2VudHJ5JyxcbiAgJ2JyZWFrJyxcbiAgJ2NvbnRpbnVlJyxcbiAgJ3JldHVybicsXG4gICd0aHJvdycsXG4gICdjYWxsJyxcbiAgJ2F3YWl0JyxcbiAgJ2NhdGNoX2VudHJ5JyxcbiAgJ2ZpbmFsbHlfZW50cnknLFxuICAndW5yZWFjaGFibGUnLFxuICAndW5tb2RlbGVkJyxcbl0pO1xuXG4vKiogRWRnZSBraW5kcyBhIENGRyBtYXkgY29udGFpbi4gKi9cbmV4cG9ydCBjb25zdCBDRkdfRURHRV9LSU5EUyA9IE9iamVjdC5mcmVlemUoW1xuICAnc2VxJyxcbiAgJ3RydWUnLFxuICAnZmFsc2UnLFxuICAnY2FzZScsXG4gICdkZWZhdWx0JyxcbiAgJ2xvb3BfYmFjaycsXG4gICdicmVhaycsXG4gICdjb250aW51ZScsXG4gICdyZXR1cm4nLFxuICAndGhyb3cnLFxuICAnZXhjZXB0aW9uJyxcbiAgJ2ZpbmFsbHknLFxuICAndW5yZWFjaGFibGUnLFxuXSk7XG5cbi8qKiBTdGF0dXNlcyBzaGFyZWQgd2l0aCBDU1IgcmVsYXRpb25zaGlwcy4gKi9cbmV4cG9ydCBjb25zdCBDRkdfU1RBVFVTRVMgPSBPYmplY3QuZnJlZXplKFtcbiAgJ3Jlc29sdmVkJyxcbiAgJ2luZmVycmVkJyxcbiAgJ3Bvc3NpYmxlJyxcbiAgJ3VucmVzb2x2ZWQnLFxuICAnc3RhbGUnLFxuXSk7XG5cbi8qKiBEZWdyYWRhdGlvbiBjb2RlcyBlbWl0dGVkIGJ5IHRoZSBidWlsZGVyLiAqL1xuZXhwb3J0IGNvbnN0IENGR19ERUdSQURBVElPTl9DT0RFUyA9IE9iamVjdC5mcmVlemUoW1xuICAndW5tb2RlbGVkX2NvbnN0cnVjdCcsXG4gICdnb3RvX2Zsb3cnLFxuICAnaW5kaXJlY3RfZ290b19mbG93JyxcbiAgJ2l0ZXJhdGlvbl9zb3VyY2Vfb3BhcXVlJyxcbiAgJ2NhbGxfc2l0ZV91bnJlY29yZGVkJyxcbiAgJ2NvbmRpdGlvbl9zaGFwZV91bm1vZGVsZWQnLFxuICAnb3JwaGFuX2p1bXAnLFxuICAnbW9kZWxlZF9leGNlcHRpb25fcGF0aCcsXG4gICdhbmFseXNpc19wYXJ0aWFsJyxcbiAgJ3RydW5jYXRlZCcsXG5dKTtcblxuLyoqIEVkZ2Uga2luZHMgdGhhdCBkbyBub3QgYWR2YW5jZSB0aGUgbm9ybWFsIHN1Y2Nlc3NvciBwYXRoLiAqL1xuZXhwb3J0IGNvbnN0IEFCUlVQVF9FREdFX0tJTkRTID0gT2JqZWN0LmZyZWV6ZShbJ2JyZWFrJywgJ2NvbnRpbnVlJywgJ3JldHVybicsICd0aHJvdyddKTtcblxuLyoqIEVkZ2VzIGV4Y2x1ZGVkIGZyb20gcmFuayBjb21wdXRhdGlvbiBiZWNhdXNlIHRoZXkgcG9pbnQgYmFja3dhcmRzLiAqL1xuZXhwb3J0IGNvbnN0IEJBQ0tfRURHRV9LSU5EUyA9IE9iamVjdC5mcmVlemUoWydsb29wX2JhY2snLCAnY29udGludWUnXSk7XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0YXR1c1xuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRhc2hGb3JTdGF0dXMoc3RhdHVzKSB7XG4gIHN3aXRjaCAoc3RhdHVzKSB7XG4gICAgY2FzZSAnaW5mZXJyZWQnOlxuICAgICAgcmV0dXJuICc4IDQnO1xuICAgIGNhc2UgJ3Bvc3NpYmxlJzpcbiAgICAgIHJldHVybiAnMyAzJztcbiAgICBjYXNlICd1bnJlc29sdmVkJzpcbiAgICAgIHJldHVybiAnMiA1JztcbiAgICBjYXNlICdzdGFsZSc6XG4gICAgICByZXR1cm4gJzEgNCc7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAnJztcbiAgfVxufVxuXG4vKipcbiAqIE5vbi1jb2xvdXIgY3VlIGZvciBhIHN0YXR1cy4gUGhhc2UgMTIgd2lsbCBleHRlbmQgdGhpcyBpbnRvIGEgZnVsbFxuICogYWNjZXNzaWJpbGl0eSBwYXNzOyB0aGUgRFRPIGFscmVhZHkgY2FycmllcyB0aGUgZmllbGQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0YXR1c1xuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdseXBoRm9yU3RhdHVzKHN0YXR1cykge1xuICBzd2l0Y2ggKHN0YXR1cykge1xuICAgIGNhc2UgJ3Jlc29sdmVkJzpcbiAgICAgIHJldHVybiAnXHUyNUNGJztcbiAgICBjYXNlICdpbmZlcnJlZCc6XG4gICAgICByZXR1cm4gJ1x1MjVEMCc7XG4gICAgY2FzZSAncG9zc2libGUnOlxuICAgICAgcmV0dXJuICdcdTI1Q0InO1xuICAgIGNhc2UgJ3VucmVzb2x2ZWQnOlxuICAgICAgcmV0dXJuICdcdTI3MTUnO1xuICAgIGNhc2UgJ3N0YWxlJzpcbiAgICAgIHJldHVybiAnXHUyMkVGJztcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuICc/JztcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBraW5kXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWRnZUxhYmVsKGtpbmQsIGV4dHJhID0gJycpIHtcbiAgaWYgKGV4dHJhKSB7XG4gICAgcmV0dXJuIGtpbmQgPT09ICdjYXNlJyA/IGBjYXNlICR7ZXh0cmF9YCA6IGV4dHJhO1xuICB9XG4gIHN3aXRjaCAoa2luZCkge1xuICAgIGNhc2UgJ3NlcSc6XG4gICAgICByZXR1cm4gJyc7XG4gICAgY2FzZSAnbG9vcF9iYWNrJzpcbiAgICAgIHJldHVybiAnbG9vcCBiYWNrJztcbiAgICBjYXNlICdleGNlcHRpb24nOlxuICAgICAgcmV0dXJuICdleGNlcHRpb24nO1xuICAgIGNhc2UgJ2ZpbmFsbHknOlxuICAgICAgcmV0dXJuICdmaW5hbGx5JztcbiAgICBjYXNlICd1bnJlYWNoYWJsZSc6XG4gICAgICByZXR1cm4gJ3VucmVhY2hhYmxlJztcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGtpbmQ7XG4gIH1cbn1cbiIsICIvKipcbiAqIENhbGwtZ3JhcGggdm9jYWJ1bGFyeSwgbGltaXRzLCBzY29wZSBiYW5uZXJzLCBhbmQgbm9uLWNvbG9yIGVkZ2UgZW5jb2RpbmdzLlxuICpcbiAqIEtlcHQgaW4gYHNyYy9jb3JlL2dyYXBoL2NhbGxzL2Agd2l0aCB6ZXJvIGFkYXB0ZXIsIGhvc3QsIG9yIHdlYnZpZXcgaW1wb3J0cy5cbiAqL1xuXG5pbXBvcnQgeyBkYXNoRm9yU3RhdHVzLCBnbHlwaEZvclN0YXR1cyB9IGZyb20gJy4uL2NmZy9raW5kcy5qcyc7XG5cbmV4cG9ydCBjb25zdCBDQUxMX1NDT1BFUyA9IE9iamVjdC5mcmVlemUoWydjb21wbGV0ZScsICdwYXJ0aWFsJywgJ3NhbWVfZmlsZV9vbmx5J10pO1xuXG5leHBvcnQgY29uc3QgQ0FMTF9TQ09QRV9SRUFTT05TID0gT2JqZWN0LmZyZWV6ZShbXG4gICdub19pbmRleCcsXG4gICdpbmRleF9wYXJ0aWFsJyxcbiAgJ2luZGV4X3N0YWxlJyxcbiAgJ2FuYWx5c2lzX3BhcnRpYWwnLFxuICAnc2FtZV9maWxlX2FkYXB0ZXInLFxuICAnc3RhbGVfY3Vyc29yX3Jlc2V0Jyxcbl0pO1xuXG5leHBvcnQgY29uc3QgQ0FMTF9SRUxBVElPTlNISVBfVFlQRVMgPSBPYmplY3QuZnJlZXplKFtcbiAgJ2NhbGxzJyxcbiAgJ2luc3RhbnRpYXRlcycsXG4gICdvdmVycmlkZXMnLFxuICAncmVmZXJlbmNlcycsXG5dKTtcblxuZXhwb3J0IGNvbnN0IENBTExfU1RBVFVTRVMgPSBPYmplY3QuZnJlZXplKFtcbiAgJ3Jlc29sdmVkJyxcbiAgJ2luZmVycmVkJyxcbiAgJ3Bvc3NpYmxlJyxcbiAgJ3VucmVzb2x2ZWQnLFxuICAnc3RhbGUnLFxuXSk7XG5cbmV4cG9ydCBjb25zdCBDQUxMX05PREVfS0lORFMgPSBPYmplY3QuZnJlZXplKFtcbiAgJ2Z1bmN0aW9uJyxcbiAgJ21ldGhvZCcsXG4gICdjb25zdHJ1Y3RvcicsXG4gICdkZXN0cnVjdG9yJyxcbiAgJ2xhbWJkYScsXG4gICdjbG9zdXJlJyxcbiAgJ2NsYXNzJyxcbiAgJ3N0cnVjdCcsXG4gICdpbnRlcmZhY2UnLFxuICAnbW9kdWxlJyxcbiAgJ2ZpbGUnLFxuICAndmFyaWFibGUnLFxuICAncGFyYW1ldGVyJyxcbiAgJ2ZpZWxkJyxcbiAgJ3Byb3BlcnR5JyxcbiAgJ3VucmVzb2x2ZWRfYnVja2V0JyxcbiAgJ2NhbmRpZGF0ZV9idWNrZXQnLFxuICAndW5rbm93bicsXG5dKTtcblxuZXhwb3J0IGNvbnN0IENBTExfTElNSVRTID0gT2JqZWN0LmZyZWV6ZSh7XG4gIGRlZmF1bHRQYWdlU2l6ZTogMTAwLFxuICBtYXhQYWdlU2l6ZTogMjAwLFxuICBkZWZhdWx0RGVwdGg6IDMsXG4gIG1heERlcHRoOiA2LFxuICBtYXhOb2RlczogNTAwLFxuICBjYW5kaWRhdGVCdWNrZXRUaHJlc2hvbGQ6IDUsXG59KTtcblxuLyoqXG4gKiBOdW1lcmljYWwgcHJlY2VkZW5jZSBvZiByZXNvbHV0aW9uIHN0YXR1c2VzIChleGNsdWRpbmcgYHN0YWxlYCwgd2hpY2ggaXMgYVxuICogcHJvdmVuYW5jZSBwcm9wZXJ0eSByYXRoZXIgdGhhbiBhIHN0cmVuZ3RoIGxldmVsKS5cbiAqL1xuZXhwb3J0IGNvbnN0IFNUQVRVU19TVFJFTkdUSCA9IE9iamVjdC5mcmVlemUoe1xuICByZXNvbHZlZDogNCxcbiAgaW5mZXJyZWQ6IDMsXG4gIHBvc3NpYmxlOiAyLFxuICB1bnJlc29sdmVkOiAxLFxufSk7XG5cbi8qKlxuICogRm9ybWF0IGFuIGhvbmVzdCBzY29wZSBsYWJlbCBwZXIgUGhhc2UgNyBcdTAwQTc4LlxuICogTmV2ZXIgcmVuZGVycyBhIGJhcmUgY291bnQgZm9yIGBzYW1lX2ZpbGVfb25seWAgb3IgYHBhcnRpYWxgIHNjb3Blcy5cbiAqXG4gKiBAcGFyYW0geydjb21wbGV0ZSd8J3BhcnRpYWwnfCdzYW1lX2ZpbGVfb25seSd9IHNjb3BlXG4gKiBAcGFyYW0ge251bWJlcn0gY291bnRcbiAqIEBwYXJhbSB7J2NhbGxlcnMnfCdjYWxsZWVzJ3wnbmVpZ2hib3JzJ30gW25vdW5dXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0U2NvcGVCYW5uZXIoc2NvcGUsIGNvdW50LCBub3VuID0gJ2NhbGxlcnMnKSB7XG4gIGNvbnN0IHNhZmVDb3VudCA9IE1hdGgubWF4KDAsIE51bWJlci5pc0ludGVnZXIoY291bnQpID8gY291bnQgOiAwKTtcbiAgY29uc3Qgd29yZCA9IHNhZmVDb3VudCA9PT0gMSA/IChub3VuLmVuZHNXaXRoKCdzJykgPyBub3VuLnNsaWNlKDAsIC0xKSA6IG5vdW4pIDogbm91bjtcbiAgaWYgKHNjb3BlID09PSAnY29tcGxldGUnKSB7XG4gICAgcmV0dXJuIGAke3NhZmVDb3VudH0gJHt3b3JkfWA7XG4gIH1cbiAgaWYgKHNjb3BlID09PSAncGFydGlhbCcpIHtcbiAgICByZXR1cm4gYCR7c2FmZUNvdW50fSAke3dvcmR9IChpbmRleCBwYXJ0aWFsIFx1MjAxNCBtYXkgYmUgaW5jb21wbGV0ZSlgO1xuICB9XG4gIHJldHVybiBgJHtzYWZlQ291bnR9ICR7d29yZH0gaW4gdGhpcyBmaWxlIFx1MDBCNyBQcm9qZWN0LXdpZGUgJHtub3VufSByZXF1aXJlIGluZGV4aW5nYDtcbn1cblxuLyoqXG4gKiBOb24tY29sb3IgU1ZHIGRhc2ggcGF0dGVybiBmb3IgYSBjYWxsIGVkZ2UuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0YXR1c1xuICogQHBhcmFtIHtib29sZWFufSBbaXNDeWNsZV1cbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYWxsRWRnZURhc2goc3RhdHVzLCBpc0N5Y2xlID0gZmFsc2UpIHtcbiAgaWYgKHN0YXR1cyA9PT0gJ3Jlc29sdmVkJyAmJiBpc0N5Y2xlKSB7XG4gICAgcmV0dXJuICcxMCA0JztcbiAgfVxuICByZXR1cm4gZGFzaEZvclN0YXR1cyhzdGF0dXMpO1xufVxuXG4vKipcbiAqIE5vbi1jb2xvciBnbHlwaCBoaW50IGZvciBhIGNhbGwgZWRnZSwgZGlzdGluZ3Vpc2hpbmcgYHBvc3NpYmxlYCAoYFx1MjVDQmApIGZyb21cbiAqIGByZXNvbHZlZGAgKGBcdTI1Q0ZgKSBhbmQgbWFya2luZyByZWN1cnNpdmUvbXV0dWFsIGN5Y2xlIGVkZ2VzIChgXHUyMUJCYCkuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0YXR1c1xuICogQHBhcmFtIHtib29sZWFufSBbaXNDeWNsZV1cbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYWxsRWRnZUdseXBoKHN0YXR1cywgaXNDeWNsZSA9IGZhbHNlKSB7XG4gIGNvbnN0IGJhc2UgPSBnbHlwaEZvclN0YXR1cyhzdGF0dXMpO1xuICByZXR1cm4gaXNDeWNsZSA/IGAke2Jhc2V9IFx1MjFCQmAgOiBiYXNlO1xufVxuIiwgIi8qKlxuICogR3JhcGggdmlldy1tb2RlbCAoRFRPKS5cbiAqXG4gKiBUaGUgRFRPIGlzIHRoZSBvbmx5IGdyYXBoIHNoYXBlIHRoZSB3ZWJ2aWV3IHVuZGVyc3RhbmRzLiBJdCBpcyBwbGFpbiBKU09OOlxuICogbm8gZnVuY3Rpb25zLCBubyBpZHMgdGhhdCByZXF1aXJlIGEgbG9va3VwLCBubyBzb3VyY2UgdGV4dC5cbiAqXG4gKiBTb3VyY2UgdGV4dCBpcyBmZXRjaGVkIG9uIGRlbWFuZCBpbiBQaGFzZSA1IHRocm91Z2ggYSBzZXBhcmF0ZSwgdmFsaWRhdGVkXG4gKiByZXF1ZXN0LiBLZWVwaW5nIHRoZSBEVE8gZnJlZSBvZiBzb3VyY2UgcHJldmVudHMgYWNjaWRlbnRhbCBsZWFrYWdlIGludG9cbiAqIGNhY2hlcyBhbmQga2VlcHMgbWVzc2FnZSBzaXplcyBwcmVkaWN0YWJsZS5cbiAqL1xuXG5pbXBvcnQgeyBjb21wdXRlTGF5b3V0IH0gZnJvbSAnLi9sYXlvdXQuanMnO1xuaW1wb3J0IHsgQ0ZHX0VER0VfS0lORFMsIENGR19OT0RFX0tJTkRTLCBDRkdfU1RBVFVTRVMgfSBmcm9tICcuL2NmZy9raW5kcy5qcyc7XG5pbXBvcnQgeyBDQUxMX05PREVfS0lORFMsIENBTExfUkVMQVRJT05TSElQX1RZUEVTLCBDQUxMX1NDT1BFUyB9IGZyb20gJy4vY2FsbHMva2luZHMuanMnO1xuXG5leHBvcnQgY29uc3QgR1JBUEhfRFRPX1ZFUlNJT04gPSAxO1xuXG4vKipcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4vbW9kZWwuanMnKS5HcmFwaH0gR3JhcGhcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IER0b05vZGVcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBpZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGxhYmVsXG4gKiBAcHJvcGVydHkge3N0cmluZ30ga2luZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IHN0YXR1c1xuICogQHByb3BlcnR5IHtzdHJpbmd9IGJhZGdlXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IGV4dGVybmFsXG4gKiBAcHJvcGVydHkge3tmaWxlSWQ6IHN0cmluZywgc3RhcnRMaW5lOiBudW1iZXIsIGVuZExpbmU6IG51bWJlcn0gfCBudWxsfSByYW5nZVxuICogQHByb3BlcnR5IHt7eDogbnVtYmVyLCB5OiBudW1iZXIsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBsYXllcjogbnVtYmVyfX0gcG9zaXRpb25cbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEdyYXBoRHRvXG4gKiBAcHJvcGVydHkge251bWJlcn0gZHRvVmVyc2lvblxuICogQHByb3BlcnR5IHtzdHJpbmd9IGdyYXBoSWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBydW5JZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGxhbmd1YWdlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gYWRhcHRlcklkXG4gKiBAcHJvcGVydHkge3N0cmluZ30gY29tcGxldGVuZXNzXG4gKiBAcHJvcGVydHkge0R0b05vZGVbXX0gbm9kZXNcbiAqIEBwcm9wZXJ0eSB7QXJyYXk8e2lkOiBzdHJpbmcsIGZyb206IHN0cmluZywgdG86IHN0cmluZywgdHlwZTogc3RyaW5nLCBzdGF0dXM6IHN0cmluZywgbGFiZWw6IHN0cmluZywgcmVhc29uQ29kZT86IHN0cmluZ30+fSBlZGdlc1xuICogQHByb3BlcnR5IHtBcnJheTx7Y29kZTogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcsIHNldmVyaXR5OiBzdHJpbmd9Pn0gZGlhZ25vc3RpY3NcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nW119IGRlZ3JhZGF0aW9uc1xuICogQHByb3BlcnR5IHt7d2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXJ9fSBleHRlbnRcbiAqIEBwcm9wZXJ0eSB7e3N0YXR1c2VzOiBzdHJpbmdbXSwga2luZHM6IHN0cmluZ1tdfX0gbGVnZW5kXG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge0dyYXBofSBncmFwaFxuICogQHJldHVybnMge0dyYXBoRHRvfVxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9EdG8oZ3JhcGgpIHtcbiAgY29uc3QgbGF5b3V0ID0gY29tcHV0ZUxheW91dChncmFwaCk7XG5cbiAgY29uc3Qgbm9kZXMgPSBncmFwaC5ub2Rlcy5tYXAoKG5vZGUpID0+ICh7XG4gICAgaWQ6IG5vZGUuaWQsXG4gICAgbGFiZWw6IG5vZGUubGFiZWwsXG4gICAga2luZDogbm9kZS5raW5kLFxuICAgIHN0YXR1czogbm9kZS5zdGF0dXMsXG4gICAgYmFkZ2U6IG5vZGUuYmFkZ2UgPz8gJycsXG4gICAgZXh0ZXJuYWw6IG5vZGUuZXh0ZXJuYWwsXG4gICAgcmFuZ2U6IG5vZGUucmFuZ2VcbiAgICAgID8ge1xuICAgICAgICAgIGZpbGVJZDogbm9kZS5yYW5nZS5maWxlSWQsXG4gICAgICAgICAgc3RhcnRMaW5lOiBub2RlLnJhbmdlLnN0YXJ0TGluZSxcbiAgICAgICAgICBlbmRMaW5lOiBub2RlLnJhbmdlLmVuZExpbmUsXG4gICAgICAgIH1cbiAgICAgIDogbnVsbCxcbiAgICBwb3NpdGlvbjogbGF5b3V0LnBvc2l0aW9uc1tub2RlLmlkXSA/PyB7IHg6IDAsIHk6IDAsIHdpZHRoOiAxOTAsIGhlaWdodDogNTQsIGxheWVyOiAwIH0sXG4gIH0pKTtcblxuICBjb25zdCBzdGF0dXNlcyA9IFsuLi5uZXcgU2V0KG5vZGVzLm1hcCgobm9kZSkgPT4gbm9kZS5zdGF0dXMpKV0uc29ydCgpO1xuICBjb25zdCBraW5kcyA9IFsuLi5uZXcgU2V0KG5vZGVzLm1hcCgobm9kZSkgPT4gbm9kZS5raW5kKSldLnNvcnQoKTtcblxuICByZXR1cm4ge1xuICAgIGR0b1ZlcnNpb246IEdSQVBIX0RUT19WRVJTSU9OLFxuICAgIGdyYXBoSWQ6IGdyYXBoLmdyYXBoSWQsXG4gICAgcnVuSWQ6IGdyYXBoLnJ1bklkLFxuICAgIGxhbmd1YWdlOiBncmFwaC5sYW5ndWFnZSxcbiAgICBhZGFwdGVySWQ6IGdyYXBoLmFkYXB0ZXJJZCxcbiAgICBjb21wbGV0ZW5lc3M6IGdyYXBoLmNvbXBsZXRlbmVzcyxcbiAgICBub2RlcyxcbiAgICBlZGdlczogZ3JhcGguZWRnZXMubWFwKChlZGdlKSA9PiB7XG4gICAgICAvKiogQHR5cGUge3tpZDogc3RyaW5nLCBmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcsIHR5cGU6IHN0cmluZywgc3RhdHVzOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcsIHJlYXNvbkNvZGU/OiBzdHJpbmd9fSAqL1xuICAgICAgY29uc3QgZHRvRWRnZSA9IHtcbiAgICAgICAgaWQ6IGVkZ2UuaWQsXG4gICAgICAgIGZyb206IGVkZ2UuZnJvbSxcbiAgICAgICAgdG86IGVkZ2UudG8sXG4gICAgICAgIHR5cGU6IGVkZ2UudHlwZSxcbiAgICAgICAgc3RhdHVzOiBlZGdlLnN0YXR1cyxcbiAgICAgICAgbGFiZWw6IGVkZ2UubGFiZWwsXG4gICAgICB9O1xuICAgICAgLy8gT21pdCB0aGUga2V5IGVudGlyZWx5IHdoZW4gYWJzZW50IHNvIHRoZSBEVE8gc3Vydml2ZXMgYSBKU09OIHJvdW5kLXRyaXBcbiAgICAgIC8vIHVuY2hhbmdlZCAoSlNPTiBjYW5ub3QgcmVwcmVzZW50IGB1bmRlZmluZWRgKS5cbiAgICAgIGlmIChlZGdlLnJlYXNvbkNvZGUpIHtcbiAgICAgICAgZHRvRWRnZS5yZWFzb25Db2RlID0gZWRnZS5yZWFzb25Db2RlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGR0b0VkZ2U7XG4gICAgfSksXG4gICAgZGlhZ25vc3RpY3M6IGdyYXBoLmRpYWdub3N0aWNzLFxuICAgIGRlZ3JhZGF0aW9uczogZ3JhcGguZGVncmFkYXRpb25zLFxuICAgIGV4dGVudDogeyB3aWR0aDogbGF5b3V0LndpZHRoLCBoZWlnaHQ6IGxheW91dC5oZWlnaHQgfSxcbiAgICBsZWdlbmQ6IHsgc3RhdHVzZXMsIGtpbmRzIH0sXG4gIH07XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSBkdG9cbiAqIEByZXR1cm5zIHt7b2s6IHRydWUsIGR0bzogR3JhcGhEdG99IHwge29rOiBmYWxzZSwgaXNzdWVzOiBzdHJpbmdbXX19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUR0byhkdG8pIHtcbiAgLyoqIEB0eXBlIHtzdHJpbmdbXX0gKi9cbiAgY29uc3QgaXNzdWVzID0gW107XG4gIGlmICh0eXBlb2YgZHRvICE9PSAnb2JqZWN0JyB8fCBkdG8gPT09IG51bGwgfHwgQXJyYXkuaXNBcnJheShkdG8pKSB7XG4gICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBpc3N1ZXM6IFsnRFRPIG11c3QgYmUgYW4gb2JqZWN0LiddIH07XG4gIH1cbiAgY29uc3QgY2FuZGlkYXRlID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKGR0byk7XG4gIGlmIChjYW5kaWRhdGUuZHRvVmVyc2lvbiAhPT0gR1JBUEhfRFRPX1ZFUlNJT04pIHtcbiAgICBpc3N1ZXMucHVzaChgVW5zdXBwb3J0ZWQgZHRvVmVyc2lvbjogJHtTdHJpbmcoY2FuZGlkYXRlLmR0b1ZlcnNpb24pfS5gKTtcbiAgfVxuICBpZiAoY2FuZGlkYXRlLmR0b0tpbmQgPT09ICdjZmcnKSB7XG4gICAgdmFsaWRhdGVDZmdEdG8oY2FuZGlkYXRlLCBpc3N1ZXMpO1xuICAgIHJldHVybiBpc3N1ZXMubGVuZ3RoID4gMFxuICAgICAgPyB7IG9rOiBmYWxzZSwgaXNzdWVzIH1cbiAgICAgIDogeyBvazogdHJ1ZSwgZHRvOiAvKiogQHR5cGUge0dyYXBoRHRvfSAqLyAoZHRvKSB9O1xuICB9XG4gIGlmIChjYW5kaWRhdGUuZHRvS2luZCA9PT0gJ2NhbGxfZ3JhcGgnKSB7XG4gICAgdmFsaWRhdGVDYWxsR3JhcGhEdG8oY2FuZGlkYXRlLCBpc3N1ZXMpO1xuICAgIHJldHVybiBpc3N1ZXMubGVuZ3RoID4gMFxuICAgICAgPyB7IG9rOiBmYWxzZSwgaXNzdWVzIH1cbiAgICAgIDogeyBvazogdHJ1ZSwgZHRvOiAvKiogQHR5cGUge0dyYXBoRHRvfSAqLyAoZHRvKSB9O1xuICB9XG4gIGNvbnN0IG5vZGVzID0gY2FuZGlkYXRlLm5vZGVzO1xuICBjb25zdCBlZGdlcyA9IGNhbmRpZGF0ZS5lZGdlcztcbiAgaWYgKCFBcnJheS5pc0FycmF5KG5vZGVzKSkge1xuICAgIGlzc3Vlcy5wdXNoKCdub2RlcyBtdXN0IGJlIGFuIGFycmF5LicpO1xuICB9XG4gIGlmICghQXJyYXkuaXNBcnJheShlZGdlcykpIHtcbiAgICBpc3N1ZXMucHVzaCgnZWRnZXMgbXVzdCBiZSBhbiBhcnJheS4nKTtcbiAgfVxuICBpZiAoQXJyYXkuaXNBcnJheShub2RlcykgJiYgQXJyYXkuaXNBcnJheShlZGdlcykpIHtcbiAgICBjb25zdCBpZHMgPSBuZXcgU2V0KCk7XG4gICAgZm9yIChjb25zdCBub2RlIG9mIG5vZGVzKSB7XG4gICAgICBjb25zdCBpZCA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChub2RlKS5pZDtcbiAgICAgIGlmICh0eXBlb2YgaWQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGlzc3Vlcy5wdXNoKCdFdmVyeSBub2RlIG5lZWRzIGEgc3RyaW5nIGlkLicpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChpZHMuaGFzKGlkKSkge1xuICAgICAgICBpc3N1ZXMucHVzaChgRHVwbGljYXRlIG5vZGUgaWQgXCIke2lkfVwiLmApO1xuICAgICAgfVxuICAgICAgaWRzLmFkZChpZCk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgZWRnZSBvZiBlZGdlcykge1xuICAgICAgY29uc3QgcmVjb3JkID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKGVkZ2UpO1xuICAgICAgaWYgKHR5cGVvZiByZWNvcmQuZnJvbSAhPT0gJ3N0cmluZycgfHwgIWlkcy5oYXMocmVjb3JkLmZyb20pKSB7XG4gICAgICAgIGlzc3Vlcy5wdXNoKGBFZGdlIFwiJHtTdHJpbmcocmVjb3JkLmlkKX1cIiBoYXMgYW4gdW5rbm93biBzb3VyY2Ugbm9kZS5gKTtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgcmVjb3JkLnRvICE9PSAnc3RyaW5nJyB8fCAhaWRzLmhhcyhyZWNvcmQudG8pKSB7XG4gICAgICAgIGlzc3Vlcy5wdXNoKGBFZGdlIFwiJHtTdHJpbmcocmVjb3JkLmlkKX1cIiBoYXMgYW4gdW5rbm93biB0YXJnZXQgbm9kZS5gKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKGlzc3Vlcy5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBpc3N1ZXMgfTtcbiAgfVxuICByZXR1cm4geyBvazogdHJ1ZSwgZHRvOiAvKiogQHR5cGUge0dyYXBoRHRvfSAqLyAoZHRvKSB9O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IGNhbmRpZGF0ZVxuICogQHBhcmFtIHtzdHJpbmdbXX0gaXNzdWVzXG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlQ2ZnRHRvKGNhbmRpZGF0ZSwgaXNzdWVzKSB7XG4gIGlmIChjYW5kaWRhdGUuZ3JhcGhLaW5kICE9PSAnY2ZnJykge1xuICAgIGlzc3Vlcy5wdXNoKCdBIENGRyBEVE8gbXVzdCBkZWNsYXJlIGdyYXBoS2luZCBcImNmZ1wiLicpO1xuICB9XG4gIGNvbnN0IGZuID0gY2FuZGlkYXRlLmZ1bmN0aW9uO1xuICBpZiAodHlwZW9mIGZuICE9PSAnb2JqZWN0JyB8fCBmbiA9PT0gbnVsbCB8fCBBcnJheS5pc0FycmF5KGZuKSkge1xuICAgIGlzc3Vlcy5wdXNoKCdmdW5jdGlvbiBtdXN0IGJlIGFuIG9iamVjdC4nKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCByZWNvcmQgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAoZm4pO1xuICAgIGZvciAoY29uc3Qga2V5IG9mIFsnc3ltYm9sSWQnLCAnbmFtZScsICdxdWFsaWZpZWROYW1lJywgJ2tpbmQnXSkge1xuICAgICAgaWYgKHR5cGVvZiByZWNvcmRba2V5XSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgaXNzdWVzLnB1c2goYGZ1bmN0aW9uLiR7a2V5fSBtdXN0IGJlIGEgc3RyaW5nLmApO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocmVjb3JkLnJhbmdlICE9PSBudWxsICYmICFpc1JhbmdlUmVmKHJlY29yZC5yYW5nZSkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKCdmdW5jdGlvbi5yYW5nZSBtdXN0IGJlIGEgcmFuZ2UgcmVmZXJlbmNlIG9yIG51bGwuJyk7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgbm9kZXMgPSBjYW5kaWRhdGUubm9kZXM7XG4gIGNvbnN0IGVkZ2VzID0gY2FuZGlkYXRlLmVkZ2VzO1xuICBpZiAoIUFycmF5LmlzQXJyYXkobm9kZXMpKSB7XG4gICAgaXNzdWVzLnB1c2goJ25vZGVzIG11c3QgYmUgYW4gYXJyYXkuJyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmICghQXJyYXkuaXNBcnJheShlZGdlcykpIHtcbiAgICBpc3N1ZXMucHVzaCgnZWRnZXMgbXVzdCBiZSBhbiBhcnJheS4nKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBpZHMgPSBuZXcgU2V0KCk7XG4gIC8qKiBAdHlwZSB7c3RyaW5nW119ICovXG4gIGNvbnN0IGVudHJ5SWRzID0gW107XG4gIC8qKiBAdHlwZSB7c3RyaW5nW119ICovXG4gIGNvbnN0IGV4aXRJZHMgPSBbXTtcbiAgZm9yIChjb25zdCBlbnRyeSBvZiBub2Rlcykge1xuICAgIGlmICh0eXBlb2YgZW50cnkgIT09ICdvYmplY3QnIHx8IGVudHJ5ID09PSBudWxsIHx8IEFycmF5LmlzQXJyYXkoZW50cnkpKSB7XG4gICAgICBpc3N1ZXMucHVzaCgnRXZlcnkgbm9kZSBtdXN0IGJlIGFuIG9iamVjdC4nKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBub2RlID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKGVudHJ5KTtcbiAgICBjb25zdCBpZCA9IG5vZGUuaWQ7XG4gICAgaWYgKHR5cGVvZiBpZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKCdFdmVyeSBub2RlIG5lZWRzIGEgc3RyaW5nIGlkLicpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChpZHMuaGFzKGlkKSkge1xuICAgICAgaXNzdWVzLnB1c2goYER1cGxpY2F0ZSBub2RlIGlkIFwiJHtpZH1cIi5gKTtcbiAgICB9XG4gICAgaWRzLmFkZChpZCk7XG4gICAgaWYgKCFDRkdfTk9ERV9LSU5EUy5pbmNsdWRlcyhTdHJpbmcobm9kZS5raW5kKSkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBOb2RlIFwiJHtpZH1cIiBoYXMgdW5rbm93biBraW5kIFwiJHtTdHJpbmcobm9kZS5raW5kKX1cIi5gKTtcbiAgICB9XG4gICAgaWYgKCFDRkdfU1RBVFVTRVMuaW5jbHVkZXMoU3RyaW5nKG5vZGUuc3RhdHVzKSkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBOb2RlIFwiJHtpZH1cIiBoYXMgdW5rbm93biBzdGF0dXMgXCIke1N0cmluZyhub2RlLnN0YXR1cyl9XCIuYCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygbm9kZS5sYWJlbCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBOb2RlIFwiJHtpZH1cIiBuZWVkcyBhIHN0cmluZyBsYWJlbC5gKTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgIUFycmF5LmlzQXJyYXkobm9kZS5sYWJlbExpbmVzKSB8fFxuICAgICAgbm9kZS5sYWJlbExpbmVzLnNvbWUoKGxpbmUpID0+IHR5cGVvZiBsaW5lICE9PSAnc3RyaW5nJylcbiAgICApIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBOb2RlIFwiJHtpZH1cIiBuZWVkcyBzdHJpbmcgbGFiZWxMaW5lcy5gKTtcbiAgICB9XG4gICAgaWYgKG5vZGUucmFuZ2UgIT09IG51bGwgJiYgIWlzUmFuZ2VSZWYobm9kZS5yYW5nZSkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBOb2RlIFwiJHtpZH1cIiBoYXMgYW4gaW52YWxpZCByYW5nZSByZWZlcmVuY2UuYCk7XG4gICAgfVxuICAgIGlmICghaXNQb3NpdGlvbihub2RlLnBvc2l0aW9uKSkge1xuICAgICAgaXNzdWVzLnB1c2goYE5vZGUgXCIke2lkfVwiIGhhcyBhbiBpbnZhbGlkIHBvc2l0aW9uLmApO1xuICAgIH1cbiAgICBpZiAobm9kZS5raW5kID09PSAnZW50cnknKSB7XG4gICAgICBlbnRyeUlkcy5wdXNoKGlkKTtcbiAgICB9XG4gICAgaWYgKG5vZGUua2luZCA9PT0gJ2V4aXQnKSB7XG4gICAgICBleGl0SWRzLnB1c2goaWQpO1xuICAgIH1cbiAgICBpZiAobm9kZS5jYWxscyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkobm9kZS5jYWxscykpIHtcbiAgICAgICAgaXNzdWVzLnB1c2goYE5vZGUgXCIke2lkfVwiIGNhbGxzIG11c3QgYmUgYW4gYXJyYXkgd2hlbiBwcmVzZW50LmApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChjb25zdCBjYWxsIG9mIG5vZGUuY2FsbHMpIHtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICB0eXBlb2YgY2FsbCAhPT0gJ29iamVjdCcgfHxcbiAgICAgICAgICAgIGNhbGwgPT09IG51bGwgfHxcbiAgICAgICAgICAgIHR5cGVvZiBjYWxsLnRvICE9PSAnc3RyaW5nJyB8fFxuICAgICAgICAgICAgdHlwZW9mIGNhbGwubGFiZWwgIT09ICdzdHJpbmcnIHx8XG4gICAgICAgICAgICAhQ0ZHX1NUQVRVU0VTLmluY2x1ZGVzKFN0cmluZyhjYWxsLnN0YXR1cykpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBpc3N1ZXMucHVzaChgTm9kZSBcIiR7aWR9XCIgaGFzIGFuIGludmFsaWQgY2FsbCB0YXJnZXQuYCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChlbnRyeUlkcy5sZW5ndGggIT09IDEpIHtcbiAgICBpc3N1ZXMucHVzaChgQSBDRkcgbmVlZHMgZXhhY3RseSBvbmUgZW50cnkgbm9kZTsgZm91bmQgJHtlbnRyeUlkcy5sZW5ndGh9LmApO1xuICB9XG4gIGlmIChleGl0SWRzLmxlbmd0aCAhPT0gMSkge1xuICAgIGlzc3Vlcy5wdXNoKGBBIENGRyBuZWVkcyBleGFjdGx5IG9uZSBleGl0IG5vZGU7IGZvdW5kICR7ZXhpdElkcy5sZW5ndGh9LmApO1xuICB9XG4gIGlmIChjYW5kaWRhdGUuZW50cnlJZCAhPT0gZW50cnlJZHNbMF0pIHtcbiAgICBpc3N1ZXMucHVzaCgnZW50cnlJZCBtdXN0IHJlZmVyZW5jZSB0aGUgZW50cnkgbm9kZS4nKTtcbiAgfVxuICBpZiAoY2FuZGlkYXRlLmV4aXRJZCAhPT0gZXhpdElkc1swXSkge1xuICAgIGlzc3Vlcy5wdXNoKCdleGl0SWQgbXVzdCByZWZlcmVuY2UgdGhlIGV4aXQgbm9kZS4nKTtcbiAgfVxuXG4gIGNvbnN0IGVkZ2VJZHMgPSBuZXcgU2V0KCk7XG4gIGZvciAoY29uc3QgZW50cnkgb2YgZWRnZXMpIHtcbiAgICBpZiAodHlwZW9mIGVudHJ5ICE9PSAnb2JqZWN0JyB8fCBlbnRyeSA9PT0gbnVsbCB8fCBBcnJheS5pc0FycmF5KGVudHJ5KSkge1xuICAgICAgaXNzdWVzLnB1c2goJ0V2ZXJ5IGVkZ2UgbXVzdCBiZSBhbiBvYmplY3QuJyk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgZWRnZSA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChlbnRyeSk7XG4gICAgY29uc3QgaWQgPSBlZGdlLmlkO1xuICAgIGlmICh0eXBlb2YgaWQgIT09ICdzdHJpbmcnKSB7XG4gICAgICBpc3N1ZXMucHVzaCgnRXZlcnkgZWRnZSBuZWVkcyBhIHN0cmluZyBpZC4nKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoZWRnZUlkcy5oYXMoaWQpKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRHVwbGljYXRlIGVkZ2UgaWQgXCIke2lkfVwiLmApO1xuICAgIH1cbiAgICBlZGdlSWRzLmFkZChpZCk7XG4gICAgaWYgKHR5cGVvZiBlZGdlLmZyb20gIT09ICdzdHJpbmcnIHx8ICFpZHMuaGFzKGVkZ2UuZnJvbSkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBFZGdlIFwiJHtpZH1cIiBoYXMgYW4gdW5rbm93biBzb3VyY2Ugbm9kZS5gKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBlZGdlLnRvICE9PSAnc3RyaW5nJyB8fCAhaWRzLmhhcyhlZGdlLnRvKSkge1xuICAgICAgaXNzdWVzLnB1c2goYEVkZ2UgXCIke2lkfVwiIGhhcyBhbiB1bmtub3duIHRhcmdldCBub2RlLmApO1xuICAgIH1cbiAgICBpZiAoIUNGR19FREdFX0tJTkRTLmluY2x1ZGVzKFN0cmluZyhlZGdlLmtpbmQpKSkge1xuICAgICAgaXNzdWVzLnB1c2goYEVkZ2UgXCIke2lkfVwiIGhhcyB1bmtub3duIGtpbmQgXCIke1N0cmluZyhlZGdlLmtpbmQpfVwiLmApO1xuICAgIH1cbiAgICBpZiAoIUNGR19TVEFUVVNFUy5pbmNsdWRlcyhTdHJpbmcoZWRnZS5zdGF0dXMpKSkge1xuICAgICAgaXNzdWVzLnB1c2goYEVkZ2UgXCIke2lkfVwiIGhhcyB1bmtub3duIHN0YXR1cyBcIiR7U3RyaW5nKGVkZ2Uuc3RhdHVzKX1cIi5gKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBlZGdlLmxhYmVsICE9PSAnc3RyaW5nJykge1xuICAgICAgaXNzdWVzLnB1c2goYEVkZ2UgXCIke2lkfVwiIG5lZWRzIGEgc3RyaW5nIGxhYmVsLmApO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGVkZ2UuZGFzaCAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGVkZ2UuZ2x5cGhIaW50ICE9PSAnc3RyaW5nJykge1xuICAgICAgaXNzdWVzLnB1c2goYEVkZ2UgXCIke2lkfVwiIG5lZWRzIHN0cmluZyBkYXNoIGFuZCBnbHlwaEhpbnQgZmllbGRzLmApO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGRlZ3JhZGF0aW9ucyA9IGNhbmRpZGF0ZS5kZWdyYWRhdGlvbnM7XG4gIGlmICghQXJyYXkuaXNBcnJheShkZWdyYWRhdGlvbnMpKSB7XG4gICAgaXNzdWVzLnB1c2goJ2RlZ3JhZGF0aW9ucyBtdXN0IGJlIGFuIGFycmF5LicpO1xuICB9IGVsc2Uge1xuICAgIGZvciAoY29uc3QgZW50cnkgb2YgZGVncmFkYXRpb25zKSB7XG4gICAgICBpZiAoXG4gICAgICAgIHR5cGVvZiBlbnRyeSAhPT0gJ29iamVjdCcgfHxcbiAgICAgICAgZW50cnkgPT09IG51bGwgfHxcbiAgICAgICAgdHlwZW9mIGVudHJ5LmNvZGUgIT09ICdzdHJpbmcnIHx8XG4gICAgICAgIHR5cGVvZiBlbnRyeS5tZXNzYWdlICE9PSAnc3RyaW5nJyB8fFxuICAgICAgICAhWydpbmZvJywgJ3dhcm5pbmcnLCAnZXJyb3InXS5pbmNsdWRlcyhTdHJpbmcoZW50cnkuc2V2ZXJpdHkpKVxuICAgICAgKSB7XG4gICAgICAgIGlzc3Vlcy5wdXNoKCdFdmVyeSBkZWdyYWRhdGlvbiBuZWVkcyBhIGNvZGUsIG1lc3NhZ2UgYW5kIHNldmVyaXR5LicpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGV4dGVudCA9IGNhbmRpZGF0ZS5leHRlbnQ7XG4gIGlmIChcbiAgICB0eXBlb2YgZXh0ZW50ICE9PSAnb2JqZWN0JyB8fFxuICAgIGV4dGVudCA9PT0gbnVsbCB8fFxuICAgICFOdW1iZXIuaXNGaW5pdGUoZXh0ZW50LndpZHRoKSB8fFxuICAgICFOdW1iZXIuaXNGaW5pdGUoZXh0ZW50LmhlaWdodClcbiAgKSB7XG4gICAgaXNzdWVzLnB1c2goJ2V4dGVudCBtdXN0IGNhcnJ5IGZpbml0ZSB3aWR0aCBhbmQgaGVpZ2h0LicpO1xuICB9XG59XG5cbi8qKlxuICogVmFsaWRhdGUgYSBQaGFzZSA3IENhbGwgR3JhcGggRFRPLlxuICpcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IGNhbmRpZGF0ZVxuICogQHBhcmFtIHtzdHJpbmdbXX0gaXNzdWVzXG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlQ2FsbEdyYXBoRHRvKGNhbmRpZGF0ZSwgaXNzdWVzKSB7XG4gIGlmIChjYW5kaWRhdGUuZ3JhcGhLaW5kICE9PSAnY2FsbF9ncmFwaCcpIHtcbiAgICBpc3N1ZXMucHVzaCgnQSBDYWxsIEdyYXBoIERUTyBtdXN0IGRlY2xhcmUgZ3JhcGhLaW5kIFwiY2FsbF9ncmFwaFwiLicpO1xuICB9XG4gIGlmICh0eXBlb2YgY2FuZGlkYXRlLmNlbnRlclN5bWJvbElkICE9PSAnc3RyaW5nJyB8fCBjYW5kaWRhdGUuY2VudGVyU3ltYm9sSWQubGVuZ3RoID09PSAwKSB7XG4gICAgaXNzdWVzLnB1c2goJ2NlbnRlclN5bWJvbElkIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nLicpO1xuICB9XG4gIGlmICghQ0FMTF9TQ09QRVMuaW5jbHVkZXMoU3RyaW5nKGNhbmRpZGF0ZS5zY29wZSkpKSB7XG4gICAgaXNzdWVzLnB1c2goYHNjb3BlIG11c3QgYmUgb25lIG9mICR7Q0FMTF9TQ09QRVMuam9pbignLCAnKX0uYCk7XG4gIH1cbiAgaWYgKHR5cGVvZiBjYW5kaWRhdGUuc2NvcGVCYW5uZXIgIT09ICdzdHJpbmcnIHx8IGNhbmRpZGF0ZS5zY29wZUJhbm5lci5sZW5ndGggPT09IDApIHtcbiAgICBpc3N1ZXMucHVzaCgnc2NvcGVCYW5uZXIgbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcuJyk7XG4gIH1cblxuICBjb25zdCBub2RlcyA9IGNhbmRpZGF0ZS5ub2RlcztcbiAgY29uc3QgZWRnZXMgPSBjYW5kaWRhdGUuZWRnZXM7XG4gIGlmICghQXJyYXkuaXNBcnJheShub2RlcykpIHtcbiAgICBpc3N1ZXMucHVzaCgnbm9kZXMgbXVzdCBiZSBhbiBhcnJheS4nKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKCFBcnJheS5pc0FycmF5KGVkZ2VzKSkge1xuICAgIGlzc3Vlcy5wdXNoKCdlZGdlcyBtdXN0IGJlIGFuIGFycmF5LicpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGlkcyA9IG5ldyBTZXQoKTtcbiAgZm9yIChjb25zdCBlbnRyeSBvZiBub2Rlcykge1xuICAgIGlmICh0eXBlb2YgZW50cnkgIT09ICdvYmplY3QnIHx8IGVudHJ5ID09PSBudWxsIHx8IEFycmF5LmlzQXJyYXkoZW50cnkpKSB7XG4gICAgICBpc3N1ZXMucHVzaCgnRXZlcnkgbm9kZSBtdXN0IGJlIGFuIG9iamVjdC4nKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBub2RlID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKGVudHJ5KTtcbiAgICBjb25zdCBpZCA9IG5vZGUuaWQ7XG4gICAgaWYgKHR5cGVvZiBpZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKCdFdmVyeSBub2RlIG5lZWRzIGEgc3RyaW5nIGlkLicpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChpZHMuaGFzKGlkKSkge1xuICAgICAgaXNzdWVzLnB1c2goYER1cGxpY2F0ZSBub2RlIGlkIFwiJHtpZH1cIi5gKTtcbiAgICB9XG4gICAgaWRzLmFkZChpZCk7XG4gICAgaWYgKCFDQUxMX05PREVfS0lORFMuaW5jbHVkZXMoU3RyaW5nKG5vZGUua2luZCkpKSB7XG4gICAgICBpc3N1ZXMucHVzaChgTm9kZSBcIiR7aWR9XCIgaGFzIHVua25vd24gY2FsbC1ncmFwaCBraW5kIFwiJHtTdHJpbmcobm9kZS5raW5kKX1cIi5gKTtcbiAgICB9XG4gICAgaWYgKCFDRkdfU1RBVFVTRVMuaW5jbHVkZXMoU3RyaW5nKG5vZGUuc3RhdHVzKSkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBOb2RlIFwiJHtpZH1cIiBoYXMgdW5rbm93biBzdGF0dXMgXCIke1N0cmluZyhub2RlLnN0YXR1cyl9XCIuYCk7XG4gICAgfVxuICAgIGlmICghaXNQb3NpdGlvbihub2RlLnBvc2l0aW9uKSkge1xuICAgICAgaXNzdWVzLnB1c2goYE5vZGUgXCIke2lkfVwiIGhhcyBhbiBpbnZhbGlkIHBvc2l0aW9uLmApO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGVkZ2VJZHMgPSBuZXcgU2V0KCk7XG4gIGZvciAoY29uc3QgZW50cnkgb2YgZWRnZXMpIHtcbiAgICBpZiAodHlwZW9mIGVudHJ5ICE9PSAnb2JqZWN0JyB8fCBlbnRyeSA9PT0gbnVsbCB8fCBBcnJheS5pc0FycmF5KGVudHJ5KSkge1xuICAgICAgaXNzdWVzLnB1c2goJ0V2ZXJ5IGVkZ2UgbXVzdCBiZSBhbiBvYmplY3QuJyk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgZWRnZSA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChlbnRyeSk7XG4gICAgY29uc3QgaWQgPSBlZGdlLmlkO1xuICAgIGlmICh0eXBlb2YgaWQgIT09ICdzdHJpbmcnKSB7XG4gICAgICBpc3N1ZXMucHVzaCgnRXZlcnkgZWRnZSBuZWVkcyBhIHN0cmluZyBpZC4nKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoZWRnZUlkcy5oYXMoaWQpKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRHVwbGljYXRlIGVkZ2UgaWQgXCIke2lkfVwiLmApO1xuICAgIH1cbiAgICBlZGdlSWRzLmFkZChpZCk7XG4gICAgaWYgKHR5cGVvZiBlZGdlLmZyb20gIT09ICdzdHJpbmcnIHx8ICFpZHMuaGFzKGVkZ2UuZnJvbSkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBFZGdlIFwiJHtpZH1cIiBoYXMgYW4gdW5rbm93biBzb3VyY2Ugbm9kZS5gKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBlZGdlLnRvICE9PSAnc3RyaW5nJyB8fCAhaWRzLmhhcyhlZGdlLnRvKSkge1xuICAgICAgaXNzdWVzLnB1c2goYEVkZ2UgXCIke2lkfVwiIGhhcyBhbiB1bmtub3duIHRhcmdldCBub2RlLmApO1xuICAgIH1cbiAgICBpZiAoIUNBTExfUkVMQVRJT05TSElQX1RZUEVTLmluY2x1ZGVzKFN0cmluZyhlZGdlLnR5cGUpKSkge1xuICAgICAgaXNzdWVzLnB1c2goYEVkZ2UgXCIke2lkfVwiIGhhcyB1bmtub3duIHR5cGUgXCIke1N0cmluZyhlZGdlLnR5cGUpfVwiLmApO1xuICAgIH1cbiAgICBpZiAoIUNGR19TVEFUVVNFUy5pbmNsdWRlcyhTdHJpbmcoZWRnZS5zdGF0dXMpKSkge1xuICAgICAgaXNzdWVzLnB1c2goYEVkZ2UgXCIke2lkfVwiIGhhcyB1bmtub3duIHN0YXR1cyBcIiR7U3RyaW5nKGVkZ2Uuc3RhdHVzKX1cIi5gKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBlZGdlLmRhc2ggIT09ICdzdHJpbmcnIHx8IHR5cGVvZiBlZGdlLmdseXBoSGludCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBFZGdlIFwiJHtpZH1cIiBuZWVkcyBzdHJpbmcgZGFzaCBhbmQgZ2x5cGhIaW50IGZpZWxkcy5gKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gaXNSYW5nZVJlZih2YWx1ZSkge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JyB8fCB2YWx1ZSA9PT0gbnVsbCB8fCBBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCByYW5nZSA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovICh2YWx1ZSk7XG4gIHJldHVybiAoXG4gICAgdHlwZW9mIHJhbmdlLmZpbGVJZCA9PT0gJ3N0cmluZycgJiZcbiAgICBOdW1iZXIuaXNJbnRlZ2VyKHJhbmdlLnN0YXJ0TGluZSkgJiZcbiAgICBOdW1iZXIuaXNJbnRlZ2VyKHJhbmdlLnN0YXJ0Q29sdW1uKSAmJlxuICAgIE51bWJlci5pc0ludGVnZXIocmFuZ2UuZW5kTGluZSkgJiZcbiAgICBOdW1iZXIuaXNJbnRlZ2VyKHJhbmdlLmVuZENvbHVtbikgJiZcbiAgICByYW5nZS5zdGFydExpbmUgPj0gMCAmJlxuICAgIHJhbmdlLnN0YXJ0Q29sdW1uID49IDAgJiZcbiAgICByYW5nZS5lbmRMaW5lID49IDAgJiZcbiAgICByYW5nZS5lbmRDb2x1bW4gPj0gMFxuICApO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBpc1Bvc2l0aW9uKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnIHx8IHZhbHVlID09PSBudWxsIHx8IEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IHBvc2l0aW9uID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKHZhbHVlKTtcbiAgcmV0dXJuIChcbiAgICBOdW1iZXIuaXNGaW5pdGUocG9zaXRpb24ueCkgJiZcbiAgICBOdW1iZXIuaXNGaW5pdGUocG9zaXRpb24ueSkgJiZcbiAgICBOdW1iZXIuaXNGaW5pdGUocG9zaXRpb24ud2lkdGgpICYmXG4gICAgTnVtYmVyLmlzRmluaXRlKHBvc2l0aW9uLmhlaWdodCkgJiZcbiAgICBOdW1iZXIuaXNJbnRlZ2VyKHBvc2l0aW9uLmxheWVyKVxuICApO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7R3JhcGhEdG99IGR0b1xuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZUR0byhkdG8pIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGR0byk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGpzb25cbiAqIEByZXR1cm5zIHtHcmFwaER0b31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRHRvKGpzb24pIHtcbiAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShqc29uKTtcbiAgY29uc3QgdmFsaWRhdGlvbiA9IHZhbGlkYXRlRHRvKHBhcnNlZCk7XG4gIGlmICghdmFsaWRhdGlvbi5vaykge1xuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBncmFwaCBEVE86ICR7dmFsaWRhdGlvbi5pc3N1ZXMuam9pbignOyAnKX1gKTtcbiAgfVxuICByZXR1cm4gdmFsaWRhdGlvbi5kdG87XG59XG4iLCAiLyoqXG4gKiBTVkcgcmVuZGVyZXIuXG4gKlxuICogUGhhc2UgMCByZW5kZXJlcjogZGV0ZXJtaW5pc3RpYyBsYXllcmVkIHBvc2l0aW9ucyBjb21lIGZyb20gdGhlIERUTywgc28gdGhpc1xuICogbW9kdWxlIG9ubHkgZHJhd3MuIEl0IGhhcyBubyBrbm93bGVkZ2Ugb2YgYW5hbHlzaXMsIGFkYXB0ZXJzLCBvciB0aGUgcHJvdG9jb2wuXG4gKlxuICogS2VwdCBiZWhpbmQgYSBzbWFsbCBpbnRlcmZhY2UgKGByZW5kZXJgLCBgc2VsZWN0YCwgYGRlc3Ryb3lgKSBiZWNhdXNlIFBoYXNlIDRcbiAqIGJlbmNobWFya3MgQ3l0b3NjYXBlL0VMSyBhbmQgbWF5IHJlcGxhY2UgdGhlIGltcGxlbWVudGF0aW9uLiBDYWxsZXJzIG11c3Qgbm90XG4gKiBkZXBlbmQgb24gU1ZHIGludGVybmFscy5cbiAqL1xuXG5jb25zdCBTVkdfTlMgPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnO1xuXG4vKipcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4uLy4uL2NvcmUvZ3JhcGgvZHRvLmpzJykuR3JhcGhEdG99IEdyYXBoRHRvXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuLi8uLi9jb3JlL2dyYXBoL2R0by5qcycpLkR0b05vZGV9IER0b05vZGVcbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHN0cmluZyB8IG51bWJlcj59IFthdHRyaWJ1dGVzXVxuICogQHJldHVybnMge1NWR0VsZW1lbnR9XG4gKi9cbmZ1bmN0aW9uIHN2Z0VsKG5hbWUsIGF0dHJpYnV0ZXMgPSB7fSkge1xuICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFNWR19OUywgbmFtZSk7XG4gIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKGF0dHJpYnV0ZXMpKSB7XG4gICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoa2V5LCBTdHJpbmcodmFsdWUpKTtcbiAgfVxuICByZXR1cm4gZWxlbWVudDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAqIEBwYXJhbSB7bnVtYmVyfSBtYXhcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHRydW5jYXRlKHZhbHVlLCBtYXgpIHtcbiAgY29uc3QgdGV4dCA9IFN0cmluZyh2YWx1ZSA/PyAnJyk7XG4gIHJldHVybiB0ZXh0Lmxlbmd0aCA+IG1heCA/IGAke3RleHQuc2xpY2UoMCwgbWF4IC0gMSl9XHUyMDI2YCA6IHRleHQ7XG59XG5cbi8qKlxuICogQHBhcmFtIHt7XG4gKiAgIHN2ZzogU1ZHU1ZHRWxlbWVudCxcbiAqICAgb25TZWxlY3Q6IChub2RlSWQ6IHN0cmluZywgbm9kZTogRHRvTm9kZSkgPT4gdm9pZCxcbiAqICAgb25OYXZpZ2F0ZT86IChub2RlSWQ6IHN0cmluZywgbm9kZTogRHRvTm9kZSwgdHJpZ2dlcj86ICdwb2ludGVyJ3wna2V5Ym9hcmQnKSA9PiB2b2lkLFxuICogICBvblByZXZpZXdFbnRlcj86IChub2RlSWQ6IHN0cmluZywgbm9kZTogRHRvTm9kZSwgcG9pbnQ6IHt4OiBudW1iZXIsIHk6IG51bWJlcn0pID0+IHZvaWQsXG4gKiAgIG9uUHJldmlld01vdmU/OiAocG9pbnQ6IHt4OiBudW1iZXIsIHk6IG51bWJlcn0pID0+IHZvaWQsXG4gKiAgIG9uUHJldmlld0xlYXZlPzogKG5vZGVJZDogc3RyaW5nKSA9PiB2b2lkLFxuICogICBvblByZXZpZXdLZXk/OiAobm9kZUlkOiBzdHJpbmcsIG5vZGU6IER0b05vZGUpID0+IHZvaWQsXG4gKiB9fSBvcHRpb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTdmdSZW5kZXJlcihvcHRpb25zKSB7XG4gIGNvbnN0IHsgc3ZnLCBvblNlbGVjdCB9ID0gb3B0aW9ucztcbiAgLyoqIEB0eXBlIHtHcmFwaER0byB8IG51bGx9ICovXG4gIGxldCBkdG8gPSBudWxsO1xuICAvKiogQHR5cGUge1NWR0dFbGVtZW50IHwgbnVsbH0gKi9cbiAgbGV0IHZpZXdwb3J0ID0gbnVsbDtcbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBTVkdHRWxlbWVudD59ICovXG4gIGNvbnN0IG5vZGVFbGVtZW50cyA9IG5ldyBNYXAoKTtcbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBTVkdQYXRoRWxlbWVudD59ICovXG4gIGNvbnN0IGVkZ2VFbGVtZW50cyA9IG5ldyBNYXAoKTtcbiAgLyoqIEB0eXBlIHtzdHJpbmcgfCBudWxsfSAqL1xuICBsZXQgc2VsZWN0ZWRJZCA9IG51bGw7XG5cbiAgbGV0IHNjYWxlID0gMTtcbiAgbGV0IHRyYW5zbGF0ZVggPSAwO1xuICBsZXQgdHJhbnNsYXRlWSA9IDA7XG4gIGxldCBkcmFnZ2luZyA9IGZhbHNlO1xuICBsZXQgZHJhZ1N0YXJ0ID0geyB4OiAwLCB5OiAwLCB0eDogMCwgdHk6IDAgfTtcblxuICBmdW5jdGlvbiBhcHBseVRyYW5zZm9ybSgpIHtcbiAgICBpZiAodmlld3BvcnQpIHtcbiAgICAgIHZpZXdwb3J0LnNldEF0dHJpYnV0ZShcbiAgICAgICAgJ3RyYW5zZm9ybScsXG4gICAgICAgIGB0cmFuc2xhdGUoJHt0cmFuc2xhdGVYLnRvRml4ZWQoMil9ICR7dHJhbnNsYXRlWS50b0ZpeGVkKDIpfSkgc2NhbGUoJHtzY2FsZS50b0ZpeGVkKDMpfSlgLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBub2RlUG9pbnQobm9kZSwgc2lkZSkge1xuICAgIGlmIChzaWRlID09PSAnb3V0Jykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgeDogbm9kZS5wb3NpdGlvbi54ICsgbm9kZS5wb3NpdGlvbi53aWR0aCxcbiAgICAgICAgeTogbm9kZS5wb3NpdGlvbi55ICsgbm9kZS5wb3NpdGlvbi5oZWlnaHQgLyAyLFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHsgeDogbm9kZS5wb3NpdGlvbi54LCB5OiBub2RlLnBvc2l0aW9uLnkgKyBub2RlLnBvc2l0aW9uLmhlaWdodCAvIDIgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVkZ2VQYXRoKHNvdXJjZSwgdGFyZ2V0KSB7XG4gICAgaWYgKHNvdXJjZS5pZCA9PT0gdGFyZ2V0LmlkKSB7XG4gICAgICBjb25zdCB7IHgsIHksIHdpZHRoLCBoZWlnaHQgfSA9IHNvdXJjZS5wb3NpdGlvbjtcbiAgICAgIGNvbnN0IGN4ID0geCArIHdpZHRoIC8gMjtcbiAgICAgIGNvbnN0IHN0YXJ0WSA9IHkgLSAyO1xuICAgICAgcmV0dXJuIGBNICR7Y3h9ICR7c3RhcnRZfSBDICR7Y3ggLSA0Nn0gJHt5IC0gNjB9LCAke2N4ICsgNDZ9ICR7eSAtIDYwfSwgJHtjeH0gJHt5ICsgaGVpZ2h0ICsgMn1gO1xuICAgIH1cbiAgICBjb25zdCBmcm9tID0gbm9kZVBvaW50KHNvdXJjZSwgJ291dCcpO1xuICAgIGNvbnN0IHRvID0gbm9kZVBvaW50KHRhcmdldCwgJ2luJyk7XG4gICAgY29uc3QgYmVuZCA9IE1hdGgubWF4KDM2LCBNYXRoLmFicyh0by54IC0gZnJvbS54KSAvIDIpO1xuICAgIHJldHVybiBgTSAke2Zyb20ueH0gJHtmcm9tLnl9IEMgJHtmcm9tLnggKyBiZW5kfSAke2Zyb20ueX0sICR7dG8ueCAtIGJlbmR9ICR7dG8ueX0sICR7dG8ueH0gJHt0by55fWA7XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICBpZiAodmlld3BvcnQpIHtcbiAgICAgIHN2Zy5yZW1vdmVDaGlsZCh2aWV3cG9ydCk7XG4gICAgfVxuICAgIHZpZXdwb3J0ID0gc3ZnRWwoJ2cnLCB7IGNsYXNzOiAnY2Ytdmlld3BvcnQnIH0pO1xuICAgIHN2Zy5hcHBlbmRDaGlsZCh2aWV3cG9ydCk7XG4gICAgbm9kZUVsZW1lbnRzLmNsZWFyKCk7XG4gICAgZWRnZUVsZW1lbnRzLmNsZWFyKCk7XG4gICAgc2VsZWN0ZWRJZCA9IG51bGw7XG4gIH1cblxuICBmdW5jdGlvbiBzZWxlY3Qobm9kZUlkKSB7XG4gICAgc2VsZWN0ZWRJZCA9IG5vZGVJZDtcbiAgICBmb3IgKGNvbnN0IFtpZCwgZWxlbWVudF0gb2Ygbm9kZUVsZW1lbnRzKSB7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoJ2lzLXNlbGVjdGVkJywgaWQgPT09IG5vZGVJZCk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgWywgZWxlbWVudF0gb2YgZWRnZUVsZW1lbnRzKSB7XG4gICAgICBjb25zdCBhY3RpdmUgPVxuICAgICAgICBub2RlSWQgIT09IG51bGwgJiYgKGVsZW1lbnQuZGF0YXNldC5mcm9tID09PSBub2RlSWQgfHwgZWxlbWVudC5kYXRhc2V0LnRvID09PSBub2RlSWQpO1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKCdpcy1hY3RpdmUnLCBhY3RpdmUpO1xuICAgIH1cbiAgICBpZiAoc2VsZWN0ZWRJZCAmJiBub2RlRWxlbWVudHMuaGFzKHNlbGVjdGVkSWQpKSB7XG4gICAgICBjb25zdCBub2RlID0gLyoqIEB0eXBlIHtEdG9Ob2RlfSAqLyAoZHRvPy5ub2Rlcy5maW5kKChpdGVtKSA9PiBpdGVtLmlkID09PSBzZWxlY3RlZElkKSk7XG4gICAgICBvblNlbGVjdChzZWxlY3RlZElkLCBub2RlKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB6b29tVG9GaXQoKSB7XG4gICAgaWYgKCFkdG8gfHwgIXZpZXdwb3J0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGJvdW5kcyA9IHN2Zy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCBwYWRkaW5nID0gNDg7XG4gICAgY29uc3Qgd2lkdGggPSBNYXRoLm1heCgxLCBkdG8uZXh0ZW50LndpZHRoKTtcbiAgICBjb25zdCBoZWlnaHQgPSBNYXRoLm1heCgxLCBkdG8uZXh0ZW50LmhlaWdodCk7XG4gICAgY29uc3QgYXZhaWxhYmxlV2lkdGggPSBNYXRoLm1heCgxMjAsIGJvdW5kcy53aWR0aCAtIHBhZGRpbmcgKiAyKTtcbiAgICBjb25zdCBhdmFpbGFibGVIZWlnaHQgPSBNYXRoLm1heCgxMjAsIGJvdW5kcy5oZWlnaHQgLSBwYWRkaW5nICogMik7XG4gICAgc2NhbGUgPSBNYXRoLm1pbigxLjQsIGF2YWlsYWJsZVdpZHRoIC8gd2lkdGgsIGF2YWlsYWJsZUhlaWdodCAvIGhlaWdodCk7XG4gICAgc2NhbGUgPSBNYXRoLm1heCgwLjE1LCBzY2FsZSk7XG4gICAgdHJhbnNsYXRlWCA9IChib3VuZHMud2lkdGggLSB3aWR0aCAqIHNjYWxlKSAvIDI7XG4gICAgdHJhbnNsYXRlWSA9IChib3VuZHMuaGVpZ2h0IC0gaGVpZ2h0ICogc2NhbGUpIC8gMjtcbiAgICBhcHBseVRyYW5zZm9ybSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7R3JhcGhEdG99IG5leHREdG9cbiAgICovXG4gIGZ1bmN0aW9uIHJlbmRlcihuZXh0RHRvKSB7XG4gICAgZHRvID0gbmV4dER0bztcbiAgICBjbGVhcigpO1xuICAgIGlmICghdmlld3BvcnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBieUlkID0gbmV3IE1hcChkdG8ubm9kZXMubWFwKChub2RlKSA9PiBbbm9kZS5pZCwgbm9kZV0pKTtcblxuICAgIGZvciAoY29uc3QgZWRnZSBvZiBkdG8uZWRnZXMpIHtcbiAgICAgIGNvbnN0IHNvdXJjZSA9IGJ5SWQuZ2V0KGVkZ2UuZnJvbSk7XG4gICAgICBjb25zdCB0YXJnZXQgPSBieUlkLmdldChlZGdlLnRvKTtcbiAgICAgIGlmICghc291cmNlIHx8ICF0YXJnZXQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBwYXRoID0gLyoqIEB0eXBlIHtTVkdQYXRoRWxlbWVudH0gKi8gKFxuICAgICAgICBzdmdFbCgncGF0aCcsIHtcbiAgICAgICAgICBjbGFzczogYGNmLWVkZ2UgY2YtZWRnZS0tJHtlZGdlLnN0YXR1c30gY2YtZWRnZS0ta2luZC0ke2VkZ2Uua2luZCA/PyBlZGdlLnR5cGV9JHtcbiAgICAgICAgICAgIGVkZ2UuaXNDeWNsZSA/ICcgY2YtZWRnZS0tY3ljbGUnIDogJydcbiAgICAgICAgICB9JHtlZGdlLmRpbW1lZCA/ICcgaXMtZGltbWVkJyA6ICcnfWAsXG4gICAgICAgICAgZDogZWRnZVBhdGgoc291cmNlLCB0YXJnZXQpLFxuICAgICAgICAgICdkYXRhLWZyb20nOiBlZGdlLmZyb20sXG4gICAgICAgICAgJ2RhdGEtdG8nOiBlZGdlLnRvLFxuICAgICAgICAgIC4uLihlZGdlLmRhc2ggPyB7ICdzdHJva2UtZGFzaGFycmF5JzogZWRnZS5kYXNoIH0gOiB7fSksXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgICAgcGF0aC5kYXRhc2V0LmZyb20gPSBlZGdlLmZyb207XG4gICAgICBwYXRoLmRhdGFzZXQudG8gPSBlZGdlLnRvO1xuICAgICAgY29uc3QgdGl0bGUgPSBzdmdFbCgndGl0bGUnKTtcbiAgICAgIHRpdGxlLnRleHRDb250ZW50ID0gYCR7ZWRnZS5raW5kID8/IGVkZ2UudHlwZX0gKCR7ZWRnZS5zdGF0dXN9KSR7XG4gICAgICAgIGVkZ2UucmVhc29uQ29kZSA/IGA6ICR7ZWRnZS5yZWFzb25Db2RlfWAgOiAnJ1xuICAgICAgfSR7ZWRnZS5nbHlwaEhpbnQgPyBgICR7ZWRnZS5nbHlwaEhpbnR9YCA6ICcnfWA7XG4gICAgICBwYXRoLmFwcGVuZENoaWxkKHRpdGxlKTtcbiAgICAgIHZpZXdwb3J0LmFwcGVuZENoaWxkKHBhdGgpO1xuICAgICAgZWRnZUVsZW1lbnRzLnNldChlZGdlLmlkLCBwYXRoKTtcblxuICAgICAgaWYgKGVkZ2UubGFiZWwgJiYgZWRnZS5sYWJlbC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IGZyb20gPSBub2RlUG9pbnQoc291cmNlLCAnb3V0Jyk7XG4gICAgICAgIGNvbnN0IHRvID0gbm9kZVBvaW50KHRhcmdldCwgJ2luJyk7XG4gICAgICAgIGNvbnN0IGxhYmVsID0gc3ZnRWwoJ3RleHQnLCB7XG4gICAgICAgICAgY2xhc3M6ICdjZi1lZGdlLWxhYmVsJyxcbiAgICAgICAgICB4OiAoZnJvbS54ICsgdG8ueCkgLyAyLFxuICAgICAgICAgIHk6IChmcm9tLnkgKyB0by55KSAvIDIgLSA0LFxuICAgICAgICAgICd0ZXh0LWFuY2hvcic6ICdtaWRkbGUnLFxuICAgICAgICB9KTtcbiAgICAgICAgbGFiZWwudGV4dENvbnRlbnQgPSB0cnVuY2F0ZShlZGdlLmxhYmVsLCAyMik7XG4gICAgICAgIHZpZXdwb3J0LmFwcGVuZENoaWxkKGxhYmVsKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IG5vZGUgb2YgZHRvLm5vZGVzKSB7XG4gICAgICBjb25zdCBncm91cCA9IC8qKiBAdHlwZSB7U1ZHR0VsZW1lbnR9ICovIChcbiAgICAgICAgc3ZnRWwoJ2cnLCB7XG4gICAgICAgICAgY2xhc3M6IGBjZi1ub2RlIGNmLW5vZGUtLSR7bm9kZS5zdGF0dXN9IGNmLW5vZGUtLWtpbmQtJHtub2RlLmtpbmR9JHtcbiAgICAgICAgICAgIG5vZGUuZXh0ZXJuYWwgPyAnIGNmLW5vZGUtLWV4dGVybmFsJyA6ICcnXG4gICAgICAgICAgfSR7bm9kZS51bnJlYWNoYWJsZSA/ICcgY2Ytbm9kZS0tdW5yZWFjaGFibGUnIDogJyd9JHtcbiAgICAgICAgICAgIG5vZGUuaXNDZW50ZXIgPyAnIGNmLW5vZGUtLWNlbnRlcicgOiAnJ1xuICAgICAgICAgIH0ke25vZGUuaXNDeWNsaWMgPyAnIGNmLW5vZGUtLWN5Y2xpYycgOiAnJ30ke25vZGUuZGltbWVkID8gJyBpcy1kaW1tZWQnIDogJyd9YCxcbiAgICAgICAgICB0cmFuc2Zvcm06IGB0cmFuc2xhdGUoJHtub2RlLnBvc2l0aW9uLnh9ICR7bm9kZS5wb3NpdGlvbi55fSlgLFxuICAgICAgICAgIHRhYmluZGV4OiAnMCcsXG4gICAgICAgICAgcm9sZTogJ2J1dHRvbicsXG4gICAgICAgICAgJ2FyaWEtbGFiZWwnOiBgJHtub2RlLmtpbmR9ICR7bm9kZS5sYWJlbH0sICR7bm9kZS5zdGF0dXN9JHtcbiAgICAgICAgICAgIG5vZGUudW5yZWFjaGFibGUgPyAnLCB1bnJlYWNoYWJsZScgOiAnJ1xuICAgICAgICAgIH0ke25vZGUuZXh0ZXJuYWwgPyAnLCBleHRlcm5hbCB0YXJnZXQnIDogJyd9YCxcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICAgIGdyb3VwLmFwcGVuZENoaWxkKFxuICAgICAgICBzdmdFbCgncmVjdCcsIHtcbiAgICAgICAgICBjbGFzczogJ2NmLW5vZGUtYm94JyxcbiAgICAgICAgICB3aWR0aDogbm9kZS5wb3NpdGlvbi53aWR0aCxcbiAgICAgICAgICBoZWlnaHQ6IG5vZGUucG9zaXRpb24uaGVpZ2h0LFxuICAgICAgICAgIHJ4OiA2LFxuICAgICAgICAgIHJ5OiA2LFxuICAgICAgICB9KSxcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IGxpbmVzID1cbiAgICAgICAgQXJyYXkuaXNBcnJheShub2RlLmxhYmVsTGluZXMpICYmIG5vZGUubGFiZWxMaW5lcy5sZW5ndGggPiAwXG4gICAgICAgICAgPyBub2RlLmxhYmVsTGluZXMuc2xpY2UoMCwgMylcbiAgICAgICAgICA6IFt0cnVuY2F0ZShub2RlLmxhYmVsLCAyNildO1xuICAgICAgY29uc3QgbGluZUhlaWdodCA9IDEzO1xuICAgICAgY29uc3QgYmxvY2tIZWlnaHQgPSBsaW5lcy5sZW5ndGggKiBsaW5lSGVpZ2h0O1xuICAgICAgY29uc3QgbGFiZWwgPSBzdmdFbCgndGV4dCcsIHtcbiAgICAgICAgY2xhc3M6ICdjZi1ub2RlLWxhYmVsJyxcbiAgICAgICAgeDogMTAsXG4gICAgICAgIHk6IG5vZGUucG9zaXRpb24uaGVpZ2h0IC8gMiAtIGJsb2NrSGVpZ2h0IC8gMiArIGxpbmVIZWlnaHQgLSAzLFxuICAgICAgfSk7XG4gICAgICBmb3IgKGNvbnN0IFtpbmRleCwgdGV4dF0gb2YgbGluZXMuZW50cmllcygpKSB7XG4gICAgICAgIGNvbnN0IHNwYW4gPSBzdmdFbCgndHNwYW4nLCB7XG4gICAgICAgICAgeDogMTAsXG4gICAgICAgICAgLi4uKGluZGV4ID09PSAwID8ge30gOiB7IGR5OiBsaW5lSGVpZ2h0IH0pLFxuICAgICAgICB9KTtcbiAgICAgICAgc3Bhbi50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgICAgIGxhYmVsLmFwcGVuZENoaWxkKHNwYW4pO1xuICAgICAgfVxuICAgICAgZ3JvdXAuYXBwZW5kQ2hpbGQobGFiZWwpO1xuXG4gICAgICBjb25zdCBraW5kID0gc3ZnRWwoJ3RleHQnLCB7XG4gICAgICAgIGNsYXNzOiAnY2Ytbm9kZS1raW5kJyxcbiAgICAgICAgeDogMTAsXG4gICAgICAgIHk6IG5vZGUucG9zaXRpb24uaGVpZ2h0IC0gOCxcbiAgICAgIH0pO1xuICAgICAga2luZC50ZXh0Q29udGVudCA9IG5vZGUuZXh0ZXJuYWwgPyBgJHtub2RlLmtpbmR9IFx1MDBCNyBleHRlcm5hbGAgOiBub2RlLmtpbmQ7XG4gICAgICBncm91cC5hcHBlbmRDaGlsZChraW5kKTtcblxuICAgICAgY29uc3QgYmFkZ2VUZXh0ID1cbiAgICAgICAgQXJyYXkuaXNBcnJheShub2RlLmJhZGdlcykgJiYgbm9kZS5iYWRnZXMubGVuZ3RoID4gMFxuICAgICAgICAgID8gbm9kZS5iYWRnZXMuam9pbignIFx1MDBCNyAnKVxuICAgICAgICAgIDogbm9kZS5iYWRnZSB8fCAobm9kZS5zdGF0dXMgIT09ICdyZXNvbHZlZCcgPyBub2RlLnN0YXR1cyA6ICcnKTtcbiAgICAgIGlmIChiYWRnZVRleHQpIHtcbiAgICAgICAgY29uc3QgYmFkZ2UgPSBzdmdFbCgndGV4dCcsIHtcbiAgICAgICAgICBjbGFzczogJ2NmLW5vZGUtYmFkZ2UnLFxuICAgICAgICAgIHg6IG5vZGUucG9zaXRpb24ud2lkdGggLSA4LFxuICAgICAgICAgIHk6IDEzLFxuICAgICAgICAgICd0ZXh0LWFuY2hvcic6ICdlbmQnLFxuICAgICAgICB9KTtcbiAgICAgICAgYmFkZ2UudGV4dENvbnRlbnQgPSB0cnVuY2F0ZShiYWRnZVRleHQsIDI0KTtcbiAgICAgICAgZ3JvdXAuYXBwZW5kQ2hpbGQoYmFkZ2UpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB0aXRsZSA9IHN2Z0VsKCd0aXRsZScpO1xuICAgICAgY29uc3QgY2FsbFRleHQgPVxuICAgICAgICBBcnJheS5pc0FycmF5KG5vZGUuY2FsbHMpICYmIG5vZGUuY2FsbHMubGVuZ3RoID4gMFxuICAgICAgICAgID8gYFxcbmNhbGxzOiAke25vZGUuY2FsbHMubWFwKChjYWxsKSA9PiBgJHtjYWxsLmxhYmVsfSAoJHtjYWxsLnN0YXR1c30pYCkuam9pbignLCAnKX1gXG4gICAgICAgICAgOiAnJztcbiAgICAgIHRpdGxlLnRleHRDb250ZW50ID0gYCR7bm9kZS5raW5kfSAke25vZGUubGFiZWx9XFxuc3RhdHVzOiAke25vZGUuc3RhdHVzfSR7XG4gICAgICAgIG5vZGUucmFuZ2UgPyBgXFxubGluZXMgJHtub2RlLnJhbmdlLnN0YXJ0TGluZSArIDF9LSR7bm9kZS5yYW5nZS5lbmRMaW5lICsgMX1gIDogJydcbiAgICAgIH0ke25vZGUucmVhc29uQ29kZSA/IGBcXG5yZWFzb246ICR7bm9kZS5yZWFzb25Db2RlfWAgOiAnJ30ke2NhbGxUZXh0fWA7XG4gICAgICBncm91cC5hcHBlbmRDaGlsZCh0aXRsZSk7XG5cbiAgICAgIGdyb3VwLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBzZWxlY3Qobm9kZS5pZCk7XG4gICAgICB9KTtcbiAgICAgIGdyb3VwLmFkZEV2ZW50TGlzdGVuZXIoJ2RibGNsaWNrJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBzZWxlY3Qobm9kZS5pZCk7XG4gICAgICAgIG9wdGlvbnMub25OYXZpZ2F0ZT8uKG5vZGUuaWQsIG5vZGUsICdwb2ludGVyJyk7XG4gICAgICB9KTtcbiAgICAgIGdyb3VwLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJlbnRlcicsIChldmVudCkgPT4ge1xuICAgICAgICBvcHRpb25zLm9uUHJldmlld0VudGVyPy4obm9kZS5pZCwgbm9kZSwgeyB4OiBldmVudC5jbGllbnRYLCB5OiBldmVudC5jbGllbnRZIH0pO1xuICAgICAgfSk7XG4gICAgICBncm91cC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybW92ZScsIChldmVudCkgPT4ge1xuICAgICAgICBvcHRpb25zLm9uUHJldmlld01vdmU/Lih7IHg6IGV2ZW50LmNsaWVudFgsIHk6IGV2ZW50LmNsaWVudFkgfSk7XG4gICAgICB9KTtcbiAgICAgIGdyb3VwLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJsZWF2ZScsICgpID0+IHtcbiAgICAgICAgb3B0aW9ucy5vblByZXZpZXdMZWF2ZT8uKG5vZGUuaWQpO1xuICAgICAgfSk7XG4gICAgICBncm91cC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChldmVudC5rZXkgPT09ICdFbnRlcicpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHNlbGVjdChub2RlLmlkKTtcbiAgICAgICAgICBvcHRpb25zLm9uTmF2aWdhdGU/Lihub2RlLmlkLCBub2RlLCAna2V5Ym9hcmQnKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gJyAnIHx8IGV2ZW50LmtleSA9PT0gJ1NwYWNlYmFyJykge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgaWYgKGV2ZW50LnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICBvcHRpb25zLm9uUHJldmlld0tleT8uKG5vZGUuaWQsIG5vZGUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxlY3Qobm9kZS5pZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXZlbnQua2V5ID09PSAnaCcgfHwgZXZlbnQua2V5ID09PSAnSCcpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIG9wdGlvbnMub25QcmV2aWV3S2V5Py4obm9kZS5pZCwgbm9kZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB2aWV3cG9ydC5hcHBlbmRDaGlsZChncm91cCk7XG4gICAgICBub2RlRWxlbWVudHMuc2V0KG5vZGUuaWQsIGdyb3VwKTtcbiAgICB9XG5cbiAgICB6b29tVG9GaXQoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1vdmVTZWxlY3Rpb24oZGlyZWN0aW9uKSB7XG4gICAgaWYgKCFkdG8gfHwgZHRvLm5vZGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBjdXJyZW50ID0gc2VsZWN0ZWRJZCA/IGR0by5ub2Rlcy5maW5kKChub2RlKSA9PiBub2RlLmlkID09PSBzZWxlY3RlZElkKSA6IG51bGw7XG4gICAgaWYgKCFjdXJyZW50KSB7XG4gICAgICBjb25zdCBmaXJzdCA9IGR0by5ub2Rlc1swXTtcbiAgICAgIHNlbGVjdChmaXJzdC5pZCk7XG4gICAgICBub2RlRWxlbWVudHMuZ2V0KGZpcnN0LmlkKT8uZm9jdXMoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgb3JpZ2luID0ge1xuICAgICAgeDogY3VycmVudC5wb3NpdGlvbi54ICsgY3VycmVudC5wb3NpdGlvbi53aWR0aCAvIDIsXG4gICAgICB5OiBjdXJyZW50LnBvc2l0aW9uLnkgKyBjdXJyZW50LnBvc2l0aW9uLmhlaWdodCAvIDIsXG4gICAgfTtcblxuICAgIGxldCBiZXN0ID0gbnVsbDtcbiAgICBsZXQgYmVzdFNjb3JlID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuICAgIGZvciAoY29uc3QgY2FuZGlkYXRlIG9mIGR0by5ub2Rlcykge1xuICAgICAgaWYgKGNhbmRpZGF0ZS5pZCA9PT0gY3VycmVudC5pZCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBvaW50ID0ge1xuICAgICAgICB4OiBjYW5kaWRhdGUucG9zaXRpb24ueCArIGNhbmRpZGF0ZS5wb3NpdGlvbi53aWR0aCAvIDIsXG4gICAgICAgIHk6IGNhbmRpZGF0ZS5wb3NpdGlvbi55ICsgY2FuZGlkYXRlLnBvc2l0aW9uLmhlaWdodCAvIDIsXG4gICAgICB9O1xuICAgICAgY29uc3QgZHggPSBwb2ludC54IC0gb3JpZ2luLng7XG4gICAgICBjb25zdCBkeSA9IHBvaW50LnkgLSBvcmlnaW4ueTtcbiAgICAgIGNvbnN0IGZvcndhcmQgPVxuICAgICAgICAoZGlyZWN0aW9uID09PSAnQXJyb3dSaWdodCcgJiYgZHggPiA4KSB8fFxuICAgICAgICAoZGlyZWN0aW9uID09PSAnQXJyb3dMZWZ0JyAmJiBkeCA8IC04KSB8fFxuICAgICAgICAoZGlyZWN0aW9uID09PSAnQXJyb3dEb3duJyAmJiBkeSA+IDgpIHx8XG4gICAgICAgIChkaXJlY3Rpb24gPT09ICdBcnJvd1VwJyAmJiBkeSA8IC04KTtcbiAgICAgIGlmICghZm9yd2FyZCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHByaW1hcnkgPVxuICAgICAgICBkaXJlY3Rpb24gPT09ICdBcnJvd1JpZ2h0JyB8fCBkaXJlY3Rpb24gPT09ICdBcnJvd0xlZnQnID8gTWF0aC5hYnMoZHgpIDogTWF0aC5hYnMoZHkpO1xuICAgICAgY29uc3Qgc2Vjb25kYXJ5ID1cbiAgICAgICAgZGlyZWN0aW9uID09PSAnQXJyb3dSaWdodCcgfHwgZGlyZWN0aW9uID09PSAnQXJyb3dMZWZ0JyA/IE1hdGguYWJzKGR5KSA6IE1hdGguYWJzKGR4KTtcbiAgICAgIGNvbnN0IHNjb3JlID0gcHJpbWFyeSArIHNlY29uZGFyeSAqIDIuMjtcbiAgICAgIGlmIChzY29yZSA8IGJlc3RTY29yZSkge1xuICAgICAgICBiZXN0U2NvcmUgPSBzY29yZTtcbiAgICAgICAgYmVzdCA9IGNhbmRpZGF0ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGJlc3QpIHtcbiAgICAgIHNlbGVjdChiZXN0LmlkKTtcbiAgICAgIG5vZGVFbGVtZW50cy5nZXQoYmVzdC5pZCk/LmZvY3VzKCk7XG4gICAgfVxuICB9XG5cbiAgc3ZnLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgJ3doZWVsJyxcbiAgICAoZXZlbnQpID0+IHtcbiAgICAgIGlmICghZHRvKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBjb25zdCBib3VuZHMgPSBzdmcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBjb25zdCBwb2ludGVyWCA9IGV2ZW50LmNsaWVudFggLSBib3VuZHMubGVmdDtcbiAgICAgIGNvbnN0IHBvaW50ZXJZID0gZXZlbnQuY2xpZW50WSAtIGJvdW5kcy50b3A7XG4gICAgICBjb25zdCBmYWN0b3IgPSBldmVudC5kZWx0YVkgPCAwID8gMS4xMiA6IDEgLyAxLjEyO1xuICAgICAgY29uc3QgbmV4dFNjYWxlID0gTWF0aC5taW4oMy41LCBNYXRoLm1heCgwLjEyLCBzY2FsZSAqIGZhY3RvcikpO1xuICAgICAgY29uc3QgcmF0aW8gPSBuZXh0U2NhbGUgLyBzY2FsZTtcbiAgICAgIHRyYW5zbGF0ZVggPSBwb2ludGVyWCAtIChwb2ludGVyWCAtIHRyYW5zbGF0ZVgpICogcmF0aW87XG4gICAgICB0cmFuc2xhdGVZID0gcG9pbnRlclkgLSAocG9pbnRlclkgLSB0cmFuc2xhdGVZKSAqIHJhdGlvO1xuICAgICAgc2NhbGUgPSBuZXh0U2NhbGU7XG4gICAgICBhcHBseVRyYW5zZm9ybSgpO1xuICAgIH0sXG4gICAgeyBwYXNzaXZlOiBmYWxzZSB9LFxuICApO1xuXG4gIHN2Zy5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIChldmVudCkgPT4ge1xuICAgIGlmIChldmVudC5idXR0b24gIT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhZ2dpbmcgPSB0cnVlO1xuICAgIGRyYWdTdGFydCA9IHsgeDogZXZlbnQuY2xpZW50WCwgeTogZXZlbnQuY2xpZW50WSwgdHg6IHRyYW5zbGF0ZVgsIHR5OiB0cmFuc2xhdGVZIH07XG4gICAgc3ZnLnNldFBvaW50ZXJDYXB0dXJlKGV2ZW50LnBvaW50ZXJJZCk7XG4gIH0pO1xuICBzdmcuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcm1vdmUnLCAoZXZlbnQpID0+IHtcbiAgICBpZiAoIWRyYWdnaW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyYW5zbGF0ZVggPSBkcmFnU3RhcnQudHggKyAoZXZlbnQuY2xpZW50WCAtIGRyYWdTdGFydC54KTtcbiAgICB0cmFuc2xhdGVZID0gZHJhZ1N0YXJ0LnR5ICsgKGV2ZW50LmNsaWVudFkgLSBkcmFnU3RhcnQueSk7XG4gICAgYXBwbHlUcmFuc2Zvcm0oKTtcbiAgfSk7XG4gIGNvbnN0IGVuZERyYWcgPSAoZXZlbnQpID0+IHtcbiAgICBkcmFnZ2luZyA9IGZhbHNlO1xuICAgIGlmIChzdmcuaGFzUG9pbnRlckNhcHR1cmUoZXZlbnQucG9pbnRlcklkKSkge1xuICAgICAgc3ZnLnJlbGVhc2VQb2ludGVyQ2FwdHVyZShldmVudC5wb2ludGVySWQpO1xuICAgIH1cbiAgfTtcbiAgc3ZnLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJ1cCcsIGVuZERyYWcpO1xuICBzdmcuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmNhbmNlbCcsIGVuZERyYWcpO1xuXG4gIHN2Zy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICBpZiAoc2VsZWN0ZWRJZCkge1xuICAgICAgc2VsZWN0KG51bGwpO1xuICAgIH1cbiAgfSk7XG5cbiAgc3ZnLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcbiAgICBpZiAoZXZlbnQua2V5LnN0YXJ0c1dpdGgoJ0Fycm93JykpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBtb3ZlU2VsZWN0aW9uKGV2ZW50LmtleSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChldmVudC5rZXkgPT09ICcrJyB8fCBldmVudC5rZXkgPT09ICc9Jykge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHNjYWxlID0gTWF0aC5taW4oMy41LCBzY2FsZSAqIDEuMTUpO1xuICAgICAgYXBwbHlUcmFuc2Zvcm0oKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGV2ZW50LmtleSA9PT0gJy0nKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgc2NhbGUgPSBNYXRoLm1heCgwLjEyLCBzY2FsZSAvIDEuMTUpO1xuICAgICAgYXBwbHlUcmFuc2Zvcm0oKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGV2ZW50LmtleSA9PT0gJzAnKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgem9vbVRvRml0KCk7XG4gICAgfVxuICB9KTtcblxuICAvKipcbiAgICogRWRpdG9yLWRyaXZlbiBoaWdobGlnaHQuIERpc3RpbmN0IGZyb20gc2VsZWN0aW9uIHNvIHR5cGluZyBpbiB0aGUgZWRpdG9yXG4gICAqIG5ldmVyIHN0ZWFscyBncmFwaCBmb2N1cyBvciByZXdyaXRlcyB0aGUgZGV0YWlsIHBhbmVsLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBub2RlSWRzXG4gICAqL1xuICBmdW5jdGlvbiBoaWdobGlnaHQobm9kZUlkcykge1xuICAgIGNvbnN0IHdhbnRlZCA9IG5ldyBTZXQoQXJyYXkuaXNBcnJheShub2RlSWRzKSA/IG5vZGVJZHMgOiBbXSk7XG4gICAgZm9yIChjb25zdCBbaWQsIGVsZW1lbnRdIG9mIG5vZGVFbGVtZW50cykge1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKCdpcy1zeW5jZWQnLCB3YW50ZWQuaGFzKGlkKSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgWywgZWxlbWVudF0gb2YgZWRnZUVsZW1lbnRzKSB7XG4gICAgICBjb25zdCBhY3RpdmUgPVxuICAgICAgICB3YW50ZWQuc2l6ZSA+IDAgJiZcbiAgICAgICAgKHdhbnRlZC5oYXMoZWxlbWVudC5kYXRhc2V0LmZyb20gPz8gJycpIHx8IHdhbnRlZC5oYXMoZWxlbWVudC5kYXRhc2V0LnRvID8/ICcnKSk7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoJ2lzLXN5bmNlZCcsIGFjdGl2ZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IG5vZGVJZHNcbiAgICovXG4gIGZ1bmN0aW9uIG1hcmtTdGFsZShub2RlSWRzKSB7XG4gICAgY29uc3Qgd2FudGVkID0gbmV3IFNldChBcnJheS5pc0FycmF5KG5vZGVJZHMpID8gbm9kZUlkcyA6IFtdKTtcbiAgICBmb3IgKGNvbnN0IFtpZCwgZWxlbWVudF0gb2Ygbm9kZUVsZW1lbnRzKSB7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoJ2lzLXN0YWxlJywgd2FudGVkLmhhcyhpZCkpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGZvY3VzU2VsZWN0aW9uKCkge1xuICAgIGlmIChzZWxlY3RlZElkKSB7XG4gICAgICBub2RlRWxlbWVudHMuZ2V0KHNlbGVjdGVkSWQpPy5mb2N1cygpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcmVuZGVyLFxuICAgIHNlbGVjdCxcbiAgICBoaWdobGlnaHQsXG4gICAgbWFya1N0YWxlLFxuICAgIGZvY3VzU2VsZWN0aW9uLFxuICAgIHpvb21Ub0ZpdCxcbiAgICBkZXN0cm95KCkge1xuICAgICAgY2xlYXIoKTtcbiAgICAgIGR0byA9IG51bGw7XG4gICAgfSxcbiAgfTtcbn1cbiIsICIvKipcbiAqIFNvdXJjZSByYW5nZSB2YWxpZGF0aW9uIGFuZCBzbGljaW5nLlxuICpcbiAqIFRoZXNlIGhlbHBlcnMgYXJlIHB1cmUgYW5kIGhvc3QtaW5kZXBlbmRlbnQuIFRoZSBleHRlbnNpb24gaG9zdCBzdXBwbGllcyB0aGVcbiAqIHJlYWwgZG9jdW1lbnQgdGV4dCBhbmQgdmVyc2lvbjsgdGhlIHdlYnZpZXcgYW5kIHRoZSB0ZXN0cyB1c2UgdGhlIHNhbWUgcmFuZ2VcbiAqIHJ1bGVzLiBOb3RoaW5nIGhlcmUgcmVhZHMgYSBmaWxlIG9yIGFzc2VtYmxlcyBzb3VyY2UgZnJvbSBhbiBBU1QuXG4gKi9cblxuLyoqIERlZmF1bHQgc2xpY2UgbGltaXRzIGZyb20gdGhlIFBoYXNlIDUgY29udHJhY3QuICovXG5leHBvcnQgY29uc3QgU09VUkNFX0xJTUlUUyA9IE9iamVjdC5mcmVlemUoe1xuICBtYXhMaW5lczogMTIsXG4gIG1pbkxpbmVzOiA0LFxuICBtYXhMaW5lc0xpbWl0OiA0MCxcbiAgbWF4Qnl0ZXM6IDY1XzUzNixcbiAgbWF4UmFuZ2VzOiAyXzAwMCxcbn0pO1xuXG5jb25zdCBJTlRFR0VSX0ZJRUxEUyA9IFsnc3RhcnRMaW5lJywgJ3N0YXJ0Q29sdW1uJywgJ2VuZExpbmUnLCAnZW5kQ29sdW1uJ107XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHJldHVybnMge3ZhbHVlIGlzIFJlY29yZDxzdHJpbmcsIHVua25vd24+fVxuICovXG5mdW5jdGlvbiBpc1JlY29yZCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCAmJiAhQXJyYXkuaXNBcnJheSh2YWx1ZSk7XG59XG5cbi8qKlxuICogVmFsaWRhdGUgdGhlIHdpcmUgc2hhcGUgb2YgYSByYW5nZSByZWZlcmVuY2UuIFRoaXMgZG9lcyBub3Qga25vdyB0aGVcbiAqIGRvY3VtZW50OyBgcmFuZ2VXaXRoaW5Eb2N1bWVudGAgZG9lcyB0aGF0LlxuICpcbiAqIEBwYXJhbSB7dW5rbm93bn0gcmF3XG4gKiBAcmV0dXJucyB7e29rOiB0cnVlLCB2YWx1ZTogUmVjb3JkPHN0cmluZywgYW55Pn0gfCB7b2s6IGZhbHNlLCBjb2RlOiAnRV9SQU5HRScsIGlzc3Vlczogc3RyaW5nW119fVxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplUmFuZ2VSZWYocmF3KSB7XG4gIGlmICghaXNSZWNvcmQocmF3KSkge1xuICAgIHJldHVybiB7IG9rOiBmYWxzZSwgY29kZTogJ0VfUkFOR0UnLCBpc3N1ZXM6IFsncmFuZ2UgbXVzdCBiZSBhbiBvYmplY3QuJ10gfTtcbiAgfVxuICAvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuICBjb25zdCBpc3N1ZXMgPSBbXTtcbiAgaWYgKHR5cGVvZiByYXcuZmlsZUlkICE9PSAnc3RyaW5nJyB8fCByYXcuZmlsZUlkLmxlbmd0aCA9PT0gMCB8fCByYXcuZmlsZUlkLmxlbmd0aCA+IDUxMikge1xuICAgIGlzc3Vlcy5wdXNoKCdmaWxlSWQgbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcuJyk7XG4gIH1cbiAgZm9yIChjb25zdCBrZXkgb2YgSU5URUdFUl9GSUVMRFMpIHtcbiAgICBjb25zdCB2YWx1ZSA9IHJhd1trZXldO1xuICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcih2YWx1ZSkgfHwgTnVtYmVyKHZhbHVlKSA8IDApIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGAke2tleX0gbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyLmApO1xuICAgIH1cbiAgfVxuICBpZiAoaXNzdWVzLmxlbmd0aCA9PT0gMCkge1xuICAgIGNvbnN0IHN0YXJ0TGluZSA9IE51bWJlcihyYXcuc3RhcnRMaW5lKTtcbiAgICBjb25zdCBzdGFydENvbHVtbiA9IE51bWJlcihyYXcuc3RhcnRDb2x1bW4pO1xuICAgIGNvbnN0IGVuZExpbmUgPSBOdW1iZXIocmF3LmVuZExpbmUpO1xuICAgIGNvbnN0IGVuZENvbHVtbiA9IE51bWJlcihyYXcuZW5kQ29sdW1uKTtcbiAgICBpZiAoc3RhcnRMaW5lID4gZW5kTGluZSB8fCAoc3RhcnRMaW5lID09PSBlbmRMaW5lICYmIHN0YXJ0Q29sdW1uID4gZW5kQ29sdW1uKSkge1xuICAgICAgaXNzdWVzLnB1c2goJ3JhbmdlIHN0YXJ0IG11c3Qgbm90IGNvbWUgYWZ0ZXIgcmFuZ2UgZW5kLicpO1xuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IGtleSBvZiBbJ3N0YXJ0T2Zmc2V0JywgJ2VuZE9mZnNldCddKSB7XG4gICAgaWYgKHJhd1trZXldICE9PSB1bmRlZmluZWQgJiYgKCFOdW1iZXIuaXNJbnRlZ2VyKHJhd1trZXldKSB8fCBOdW1iZXIocmF3W2tleV0pIDwgMCkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGAke2tleX0gbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyIHdoZW4gcHJlc2VudC5gKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzc3Vlcy5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBjb2RlOiAnRV9SQU5HRScsIGlzc3VlcyB9O1xuICB9XG4gIHJldHVybiB7XG4gICAgb2s6IHRydWUsXG4gICAgdmFsdWU6IHtcbiAgICAgIGZpbGVJZDogU3RyaW5nKHJhdy5maWxlSWQpLFxuICAgICAgc3RhcnRMaW5lOiBOdW1iZXIocmF3LnN0YXJ0TGluZSksXG4gICAgICBzdGFydENvbHVtbjogTnVtYmVyKHJhdy5zdGFydENvbHVtbiksXG4gICAgICBlbmRMaW5lOiBOdW1iZXIocmF3LmVuZExpbmUpLFxuICAgICAgZW5kQ29sdW1uOiBOdW1iZXIocmF3LmVuZENvbHVtbiksXG4gICAgICAuLi4oTnVtYmVyLmlzSW50ZWdlcihyYXcuc3RhcnRPZmZzZXQpID8geyBzdGFydE9mZnNldDogTnVtYmVyKHJhdy5zdGFydE9mZnNldCkgfSA6IHt9KSxcbiAgICAgIC4uLihOdW1iZXIuaXNJbnRlZ2VyKHJhdy5lbmRPZmZzZXQpID8geyBlbmRPZmZzZXQ6IE51bWJlcihyYXcuZW5kT2Zmc2V0KSB9IDoge30pLFxuICAgIH0sXG4gIH07XG59XG5cbi8qKlxuICogT2Zmc2V0cyBvZiB0aGUgZmlyc3QgY2hhcmFjdGVyIG9mIGV2ZXJ5IGxpbmUuIEhhbmRsZXMgQ1JMRiwgQ1IgYW5kIExGLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gKiBAcmV0dXJucyB7bnVtYmVyW119XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsaW5lU3RhcnRzKHRleHQpIHtcbiAgY29uc3Qgc3RhcnRzID0gWzBdO1xuICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgdGV4dC5sZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICBjb25zdCBjb2RlID0gdGV4dC5jaGFyQ29kZUF0KGluZGV4KTtcbiAgICBpZiAoY29kZSA9PT0gMTApIHtcbiAgICAgIHN0YXJ0cy5wdXNoKGluZGV4ICsgMSk7XG4gICAgfSBlbHNlIGlmIChjb2RlID09PSAxMykge1xuICAgICAgaWYgKHRleHQuY2hhckNvZGVBdChpbmRleCArIDEpID09PSAxMCkge1xuICAgICAgICBpbmRleCArPSAxO1xuICAgICAgfVxuICAgICAgc3RhcnRzLnB1c2goaW5kZXggKyAxKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0YXJ0cztcbn1cblxuLyoqXG4gKiBEb2N1bWVudCBmYWN0cyB0aGUgdmFsaWRhdG9yIG5lZWRzLiBgbGluZUxlbmd0aGAgZXhjbHVkZXMgdGhlIGxpbmUgZW5kaW5nLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gKiBAcmV0dXJucyB7e2xpbmVDb3VudDogbnVtYmVyLCBsaW5lTGVuZ3RoOiAobGluZTogbnVtYmVyKSA9PiBudW1iZXIsIHN0YXJ0czogbnVtYmVyW119fVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRG9jdW1lbnRWaWV3KHRleHQpIHtcbiAgY29uc3Qgc3RhcnRzID0gbGluZVN0YXJ0cyh0ZXh0KTtcbiAgcmV0dXJuIHtcbiAgICBsaW5lQ291bnQ6IHN0YXJ0cy5sZW5ndGgsXG4gICAgc3RhcnRzLFxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBsaW5lXG4gICAgICogQHJldHVybnMge251bWJlcn1cbiAgICAgKi9cbiAgICBsaW5lTGVuZ3RoKGxpbmUpIHtcbiAgICAgIGlmIChsaW5lIDwgMCB8fCBsaW5lID49IHN0YXJ0cy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgY29uc3Qgc3RhcnQgPSBzdGFydHNbbGluZV07XG4gICAgICBsZXQgZW5kID0gbGluZSArIDEgPCBzdGFydHMubGVuZ3RoID8gc3RhcnRzW2xpbmUgKyAxXSA6IHRleHQubGVuZ3RoO1xuICAgICAgaWYgKGVuZCA+IHN0YXJ0ICYmIHRleHQuY2hhckNvZGVBdChlbmQgLSAxKSA9PT0gMTApIHtcbiAgICAgICAgZW5kIC09IDE7XG4gICAgICB9XG4gICAgICBpZiAoZW5kID4gc3RhcnQgJiYgdGV4dC5jaGFyQ29kZUF0KGVuZCAtIDEpID09PSAxMykge1xuICAgICAgICBlbmQgLT0gMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlbmQgLSBzdGFydDtcbiAgICB9LFxuICB9O1xufVxuXG4vKipcbiAqIFZhbGlkYXRlIGEgbm9ybWFsaXplZCByYW5nZSBhZ2FpbnN0IGEgZG9jdW1lbnQuIE5vdGhpbmcgaXMgY2xhbXBlZDogYW5cbiAqIG91dC1vZi1ib3VuZHMgcmFuZ2UgaXMgcmVqZWN0ZWQgc28gYSBwcmV2aWV3IGNhbiBuZXZlciBzaWxlbnRseSBzaG93IHRoZVxuICogd3JvbmcgdGV4dC5cbiAqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IHJhbmdlXG4gKiBAcGFyYW0ge3tsaW5lQ291bnQ6IG51bWJlciwgbGluZUxlbmd0aDogKGxpbmU6IG51bWJlcikgPT4gbnVtYmVyfX0gZG9jdW1lbnRcbiAqIEByZXR1cm5zIHt7b2s6IHRydWV9IHwge29rOiBmYWxzZSwgY29kZTogJ0VfUkFOR0UnLCBpc3N1ZXM6IHN0cmluZ1tdfX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJhbmdlV2l0aGluRG9jdW1lbnQocmFuZ2UsIGRvY3VtZW50KSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVSYW5nZVJlZihyYW5nZSk7XG4gIGlmICghbm9ybWFsaXplZC5vaykge1xuICAgIHJldHVybiBub3JtYWxpemVkO1xuICB9XG4gIGNvbnN0IHZhbHVlID0gbm9ybWFsaXplZC52YWx1ZTtcbiAgLyoqIEB0eXBlIHtzdHJpbmdbXX0gKi9cbiAgY29uc3QgaXNzdWVzID0gW107XG4gIGNvbnN0IGxpbmVDb3VudCA9IE51bWJlcihkb2N1bWVudD8ubGluZUNvdW50KTtcbiAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGxpbmVDb3VudCkgfHwgbGluZUNvdW50IDwgMSkge1xuICAgIHJldHVybiB7IG9rOiBmYWxzZSwgY29kZTogJ0VfUkFOR0UnLCBpc3N1ZXM6IFsnZG9jdW1lbnQgbGluZSBjb3VudCBpcyB1bmtub3duLiddIH07XG4gIH1cbiAgaWYgKHZhbHVlLmVuZExpbmUgPj0gbGluZUNvdW50KSB7XG4gICAgaXNzdWVzLnB1c2goYGVuZExpbmUgJHt2YWx1ZS5lbmRMaW5lfSBpcyBiZXlvbmQgdGhlIGRvY3VtZW50ICgke2xpbmVDb3VudH0gbGluZXMpLmApO1xuICB9XG4gIGlmIChpc3N1ZXMubGVuZ3RoID09PSAwICYmIHR5cGVvZiBkb2N1bWVudC5saW5lTGVuZ3RoID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc3Qgc3RhcnRMZW5ndGggPSBkb2N1bWVudC5saW5lTGVuZ3RoKHZhbHVlLnN0YXJ0TGluZSk7XG4gICAgY29uc3QgZW5kTGVuZ3RoID0gZG9jdW1lbnQubGluZUxlbmd0aCh2YWx1ZS5lbmRMaW5lKTtcbiAgICBpZiAoc3RhcnRMZW5ndGggPCAwIHx8IHZhbHVlLnN0YXJ0Q29sdW1uID4gc3RhcnRMZW5ndGgpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKFxuICAgICAgICBgc3RhcnRDb2x1bW4gJHt2YWx1ZS5zdGFydENvbHVtbn0gaXMgYmV5b25kIGxpbmUgJHt2YWx1ZS5zdGFydExpbmV9ICgke3N0YXJ0TGVuZ3RofSBjb2x1bW5zKS5gLFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKGVuZExlbmd0aCA8IDAgfHwgdmFsdWUuZW5kQ29sdW1uID4gZW5kTGVuZ3RoKSB7XG4gICAgICBpc3N1ZXMucHVzaChcbiAgICAgICAgYGVuZENvbHVtbiAke3ZhbHVlLmVuZENvbHVtbn0gaXMgYmV5b25kIGxpbmUgJHt2YWx1ZS5lbmRMaW5lfSAoJHtlbmRMZW5ndGh9IGNvbHVtbnMpLmAsXG4gICAgICApO1xuICAgIH1cbiAgfVxuICByZXR1cm4gaXNzdWVzLmxlbmd0aCA+IDAgPyB7IG9rOiBmYWxzZSwgY29kZTogJ0VfUkFOR0UnLCBpc3N1ZXMgfSA6IHsgb2s6IHRydWUgfTtcbn1cblxuLyoqXG4gKiBFeGFjdCBzdWJzdHJpbmcgZm9yIGEgcmFuZ2UuIEtlZXBzIHRoZSBvcmlnaW5hbCBsaW5lIGVuZGluZ3MgYW5kIGluZGVudGF0aW9uLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IHJhbmdlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2xpY2VUZXh0KHRleHQsIHJhbmdlKSB7XG4gIGNvbnN0IHN0YXJ0cyA9IGxpbmVTdGFydHModGV4dCk7XG4gIGNvbnN0IHN0YXJ0TGluZSA9IE51bWJlcihyYW5nZT8uc3RhcnRMaW5lKTtcbiAgY29uc3QgZW5kTGluZSA9IE51bWJlcihyYW5nZT8uZW5kTGluZSk7XG4gIGNvbnN0IHN0YXJ0ID0gKHN0YXJ0c1tzdGFydExpbmVdID8/IDApICsgTnVtYmVyKHJhbmdlPy5zdGFydENvbHVtbiA/PyAwKTtcbiAgY29uc3QgZW5kID0gKHN0YXJ0c1tlbmRMaW5lXSA/PyBzdGFydHNbc3RhcnRzLmxlbmd0aCAtIDFdKSArIE51bWJlcihyYW5nZT8uZW5kQ29sdW1uID8/IDApO1xuICByZXR1cm4gdGV4dC5zbGljZShzdGFydCwgTWF0aC5tYXgoc3RhcnQsIGVuZCkpO1xufVxuXG4vKipcbiAqIFRyaW0gYSBzbGljZSBmcm9tIHRoZSBlbmQgdG8gYG1heExpbmVzYC4gTmV2ZXIgcmV0dXJucyBtb3JlIGxpbmVzIHRoYW4gYXNrZWRcbiAqIGZvciBhbmQgcmVwb3J0cyB0aGUgdHJpbS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dFxuICogQHBhcmFtIHtudW1iZXJ9IG1heExpbmVzXG4gKiBAcmV0dXJucyB7e3RleHQ6IHN0cmluZywgdHJ1bmNhdGVkOiBib29sZWFuLCBsaW5lQ291bnQ6IG51bWJlcn19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cnVuY2F0ZVNvdXJjZSh0ZXh0LCBtYXhMaW5lcykge1xuICBjb25zdCBsaW1pdCA9IE1hdGgubWluKFxuICAgIFNPVVJDRV9MSU1JVFMubWF4TGluZXNMaW1pdCxcbiAgICBNYXRoLm1heChTT1VSQ0VfTElNSVRTLm1pbkxpbmVzLCBOdW1iZXIuaXNJbnRlZ2VyKG1heExpbmVzKSA/IG1heExpbmVzIDogU09VUkNFX0xJTUlUUy5tYXhMaW5lcyksXG4gICk7XG4gIGNvbnN0IHN0YXJ0cyA9IGxpbmVTdGFydHModGV4dCk7XG4gIGNvbnN0IGxpbmVDb3VudCA9IHN0YXJ0cy5sZW5ndGg7XG4gIGlmIChsaW5lQ291bnQgPD0gbGltaXQpIHtcbiAgICByZXR1cm4geyB0ZXh0LCB0cnVuY2F0ZWQ6IGZhbHNlLCBsaW5lQ291bnQgfTtcbiAgfVxuICAvLyBLZWVwIGV4YWN0bHkgYGxpbWl0YCBsaW5lcyBieSBkcm9wcGluZyB0aGUgdHJhaWxpbmcgbGluZSBlbmRpbmc7IG90aGVyd2lzZSBhXG4gIC8vIGNvbnN1bWVyIHRoYXQgc3BsaXRzIG9uIG5ld2xpbmVzIHdvdWxkIHJlbmRlciBvbmUgZW1wdHkgZXh0cmEgbGluZS5cbiAgbGV0IGNsaXBwZWQgPSB0ZXh0LnNsaWNlKDAsIHN0YXJ0c1tsaW1pdF0pO1xuICBpZiAoY2xpcHBlZC5lbmRzV2l0aCgnXFxyXFxuJykpIHtcbiAgICBjbGlwcGVkID0gY2xpcHBlZC5zbGljZSgwLCAtMik7XG4gIH0gZWxzZSBpZiAoY2xpcHBlZC5lbmRzV2l0aCgnXFxuJykgfHwgY2xpcHBlZC5lbmRzV2l0aCgnXFxyJykpIHtcbiAgICBjbGlwcGVkID0gY2xpcHBlZC5zbGljZSgwLCAtMSk7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICB0ZXh0OiBjbGlwcGVkLFxuICAgIHRydW5jYXRlZDogdHJ1ZSxcbiAgICBsaW5lQ291bnQ6IGxpbWl0LFxuICB9O1xufVxuXG4vKipcbiAqIFRydWUgd2hlbiB0aGUgcG9zaXRpb24gaXMgaW5zaWRlIHRoZSByYW5nZSwgaW5jbHVkaW5nIGl0cyBlbmQuXG4gKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSByYW5nZVxuICogQHBhcmFtIHt7bGluZTogbnVtYmVyLCBjb2x1bW46IG51bWJlcn19IHBvc2l0aW9uXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnRhaW5zUG9zaXRpb24ocmFuZ2UsIHBvc2l0aW9uKSB7XG4gIGNvbnN0IGxpbmUgPSBOdW1iZXIocG9zaXRpb24/LmxpbmUpO1xuICBjb25zdCBjb2x1bW4gPSBOdW1iZXIocG9zaXRpb24/LmNvbHVtbik7XG4gIGlmICghTnVtYmVyLmlzSW50ZWdlcihsaW5lKSB8fCAhTnVtYmVyLmlzSW50ZWdlcihjb2x1bW4pKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChsaW5lIDwgcmFuZ2Uuc3RhcnRMaW5lIHx8IGxpbmUgPiByYW5nZS5lbmRMaW5lKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChsaW5lID09PSByYW5nZS5zdGFydExpbmUgJiYgY29sdW1uIDwgcmFuZ2Uuc3RhcnRDb2x1bW4pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGxpbmUgPT09IHJhbmdlLmVuZExpbmUgJiYgY29sdW1uID4gcmFuZ2UuZW5kQ29sdW1uKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gb3V0ZXJcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gaW5uZXJcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbnNSYW5nZShvdXRlciwgaW5uZXIpIHtcbiAgaWYgKCFvdXRlciB8fCAhaW5uZXIgfHwgb3V0ZXIuZmlsZUlkICE9PSBpbm5lci5maWxlSWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIChcbiAgICBjb250YWluc1Bvc2l0aW9uKG91dGVyLCB7IGxpbmU6IGlubmVyLnN0YXJ0TGluZSwgY29sdW1uOiBpbm5lci5zdGFydENvbHVtbiB9KSAmJlxuICAgIGNvbnRhaW5zUG9zaXRpb24ob3V0ZXIsIHsgbGluZTogaW5uZXIuZW5kTGluZSwgY29sdW1uOiBpbm5lci5lbmRDb2x1bW4gfSlcbiAgKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IGxlZnRcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gcmlnaHRcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmFuZ2VzT3ZlcmxhcChsZWZ0LCByaWdodCkge1xuICBpZiAoIWxlZnQgfHwgIXJpZ2h0IHx8IGxlZnQuZmlsZUlkICE9PSByaWdodC5maWxlSWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIChcbiAgICBjb250YWluc1Bvc2l0aW9uKGxlZnQsIHsgbGluZTogcmlnaHQuc3RhcnRMaW5lLCBjb2x1bW46IHJpZ2h0LnN0YXJ0Q29sdW1uIH0pIHx8XG4gICAgY29udGFpbnNQb3NpdGlvbihsZWZ0LCB7IGxpbmU6IHJpZ2h0LmVuZExpbmUsIGNvbHVtbjogcmlnaHQuZW5kQ29sdW1uIH0pIHx8XG4gICAgY29udGFpbnNQb3NpdGlvbihyaWdodCwgeyBsaW5lOiBsZWZ0LnN0YXJ0TGluZSwgY29sdW1uOiBsZWZ0LnN0YXJ0Q29sdW1uIH0pXG4gICk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSByYW5nZVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJhbmdlS2V5KHJhbmdlKSB7XG4gIHJldHVybiBgJHtyYW5nZS5maWxlSWR9OiR7cmFuZ2Uuc3RhcnRMaW5lfToke3JhbmdlLnN0YXJ0Q29sdW1ufS0ke3JhbmdlLmVuZExpbmV9OiR7cmFuZ2UuZW5kQ29sdW1ufWA7XG59XG5cbi8qKlxuICogSW50ZWdyaXR5IGlzIGEgY29tcGFyaXNvbiBvZiB0d28gZnVsbC1kb2N1bWVudCBoYXNoZXMuIENvbnNlcnZhdGl2ZTogYVxuICogbWlzbWF0Y2ggbWFya3MgdGhlIHdob2xlIGZpbGUgc3RhbGUsIGJlY2F1c2UgYW4gZXh0ZXJuYWwgcmV3cml0ZSBnaXZlcyB1cyBub1xuICogdHJ1c3R3b3J0aHkgZWRpdCBkZWx0YS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IGFuYWx5c2lzSGFzaFxuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBjdXJyZW50SGFzaFxuICogQHJldHVybnMgeydleGFjdCd8J3N0YWxlJ3wnbWlzc2luZyd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlZ3JpdHlGb3IoYW5hbHlzaXNIYXNoLCBjdXJyZW50SGFzaCkge1xuICBpZiAoIWFuYWx5c2lzSGFzaCB8fCAhY3VycmVudEhhc2gpIHtcbiAgICByZXR1cm4gJ21pc3NpbmcnO1xuICB9XG4gIHJldHVybiBhbmFseXNpc0hhc2ggPT09IGN1cnJlbnRIYXNoID8gJ2V4YWN0JyA6ICdzdGFsZSc7XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZU1heExpbmVzKHZhbHVlKSB7XG4gIGNvbnN0IGNhbmRpZGF0ZSA9IE51bWJlcih2YWx1ZSk7XG4gIGlmICghTnVtYmVyLmlzRmluaXRlKGNhbmRpZGF0ZSkpIHtcbiAgICByZXR1cm4gU09VUkNFX0xJTUlUUy5tYXhMaW5lcztcbiAgfVxuICByZXR1cm4gTWF0aC5taW4oXG4gICAgU09VUkNFX0xJTUlUUy5tYXhMaW5lc0xpbWl0LFxuICAgIE1hdGgubWF4KFNPVVJDRV9MSU1JVFMubWluTGluZXMsIE1hdGgudHJ1bmMoY2FuZGlkYXRlKSksXG4gICk7XG59XG4iLCAiLyoqXG4gKiBQcmV2aWV3IHByZXNlbnRhdGlvbiBtb2RlbC5cbiAqXG4gKiBQdXJlOiBnaXZlbiBhIGdyYXBoIG5vZGUgYW5kIGFuIG9wdGlvbmFsIHNvdXJjZSBzbGljZSwgZGVjaWRlIHdoYXQgdGhlIGNhcmRcbiAqIHNheXMuIFRoZSB3ZWJ2aWV3IHR1cm5zIHRoaXMgaW50byBET007IHRlc3RzIGFzc2VydCB0aGUgZGVjaXNpb25zIHdpdGhvdXQgYVxuICogYnJvd3Nlci4gU3ludGhldGljIGFuZCBzdGFsZSBub2RlcyBtdXN0IGV4cGxhaW4gdGhlbXNlbHZlcyBpbnN0ZWFkIG9mXG4gKiBzaG93aW5nIG1pc2xlYWRpbmcgc291cmNlLlxuICovXG5cbmltcG9ydCB7IFNPVVJDRV9MSU1JVFMsIHRydW5jYXRlU291cmNlIH0gZnJvbSAnLi9yYW5nZXMuanMnO1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFByZXZpZXdOb2RlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gaWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBraW5kXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbGFiZWxcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW2lzU3ludGhldGljXVxuICogQHByb3BlcnR5IHtSZWNvcmQ8c3RyaW5nLCBhbnk+fG51bGx9IFtyYW5nZV1cbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFByZXZpZXdTbGljZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IHRleHRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSByZWxhdGl2ZVBhdGhcbiAqIEBwcm9wZXJ0eSB7e3N0YXJ0TGluZTogbnVtYmVyLCBlbmRMaW5lOiBudW1iZXJ9fSBbbGluZXNdXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IFt0cnVuY2F0ZWRdXG4gKiBAcHJvcGVydHkgeydleGFjdCd8J3N0YWxlJ3wnbWlzc2luZyd9IFtpbnRlZ3JpdHldXG4gKiBAcHJvcGVydHkge251bWJlcn0gW2RvY3VtZW50VmVyc2lvbl1cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbY29udGVudEhhc2hdXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3JlYXNvbl1cbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7e25vZGU6IFByZXZpZXdOb2RlLCBzbGljZT86IFByZXZpZXdTbGljZXxudWxsLCBtYXhMaW5lcz86IG51bWJlcn19IGlucHV0XG4gKiBAcmV0dXJucyB7e1xuICogICB0aXRsZTogc3RyaW5nLFxuICogICBraW5kOiBzdHJpbmcsXG4gKiAgIGZpbGU6IHN0cmluZyxcbiAqICAgbGluZUxhYmVsOiBzdHJpbmcsXG4gKiAgIHRleHQ6IHN0cmluZyxcbiAqICAgdHJ1bmNhdGVkOiBib29sZWFuLFxuICogICBzeW50aGV0aWM6IGJvb2xlYW4sXG4gKiAgIHN0YWxlOiBib29sZWFuLFxuICogICBlbXB0eTogYm9vbGVhbixcbiAqICAgbWVzc2FnZTogc3RyaW5nLFxuICogICBpbnRlZ3JpdHk6ICdleGFjdCd8J3N0YWxlJ3wnbWlzc2luZycsXG4gKiAgIGRvY3VtZW50VmVyc2lvbjogbnVtYmVyfG51bGxcbiAqIH19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZFByZXZpZXdNb2RlbCh7IG5vZGUsIHNsaWNlID0gbnVsbCwgbWF4TGluZXMgPSBTT1VSQ0VfTElNSVRTLm1heExpbmVzIH0pIHtcbiAgY29uc3QgcmFuZ2UgPSBub2RlPy5yYW5nZSA/PyBudWxsO1xuICBjb25zdCB0aXRsZSA9IFN0cmluZyhub2RlPy5sYWJlbCA/PyAnc291cmNlJyk7XG4gIGNvbnN0IGxpbmVMYWJlbCA9IHJhbmdlXG4gICAgPyBgJHtOdW1iZXIocmFuZ2Uuc3RhcnRMaW5lKSArIDF9XHUyMDEzJHtOdW1iZXIocmFuZ2UuZW5kTGluZSkgKyAxfWBcbiAgICA6ICdubyBsaW5lIHJhbmdlJztcbiAgY29uc3Qgc3ludGhldGljID0gbm9kZT8uaXNTeW50aGV0aWMgPT09IHRydWUgfHwgIXJhbmdlO1xuXG4gIGlmIChzeW50aGV0aWMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGl0bGUsXG4gICAgICBraW5kOiBTdHJpbmcobm9kZT8ua2luZCA/PyAnbm9kZScpLFxuICAgICAgZmlsZTogcmFuZ2U/LmZpbGVJZCA/PyAnJyxcbiAgICAgIGxpbmVMYWJlbCxcbiAgICAgIHRleHQ6ICcnLFxuICAgICAgdHJ1bmNhdGVkOiBmYWxzZSxcbiAgICAgIHN5bnRoZXRpYzogdHJ1ZSxcbiAgICAgIHN0YWxlOiBmYWxzZSxcbiAgICAgIGVtcHR5OiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6IHJhbmdlXG4gICAgICAgID8gYFN5bnRoZXRpYyAke25vZGU/LmtpbmQgPz8gJ25vZGUnfSBcdTIwMTQgZnVuY3Rpb24gc3RydWN0dXJlLCBub3QgYSBzb3VyY2Ugc3RhdGVtZW50LiBBbmNob3JlZCBhdCBsaW5lICR7TnVtYmVyKHJhbmdlLnN0YXJ0TGluZSkgKyAxfS5gXG4gICAgICAgIDogYFN5bnRoZXRpYyAke25vZGU/LmtpbmQgPz8gJ25vZGUnfSBcdTIwMTQgdGhpcyBub2RlIGhhcyBubyBzb3VyY2UgcmFuZ2UuYCxcbiAgICAgIGludGVncml0eTogJ2V4YWN0JyxcbiAgICAgIGRvY3VtZW50VmVyc2lvbjogbnVsbCxcbiAgICB9O1xuICB9XG5cbiAgaWYgKCFzbGljZSkge1xuICAgIHJldHVybiB7XG4gICAgICB0aXRsZSxcbiAgICAgIGtpbmQ6IFN0cmluZyhub2RlPy5raW5kID8/ICdub2RlJyksXG4gICAgICBmaWxlOiByYW5nZT8uZmlsZUlkID8/ICcnLFxuICAgICAgbGluZUxhYmVsLFxuICAgICAgdGV4dDogJycsXG4gICAgICB0cnVuY2F0ZWQ6IGZhbHNlLFxuICAgICAgc3ludGhldGljOiBmYWxzZSxcbiAgICAgIHN0YWxlOiBmYWxzZSxcbiAgICAgIGVtcHR5OiB0cnVlLFxuICAgICAgbWVzc2FnZTogJ1NvdXJjZSBpcyBub3QgYXZhaWxhYmxlIGZvciB0aGlzIHJhbmdlLicsXG4gICAgICBpbnRlZ3JpdHk6ICdtaXNzaW5nJyxcbiAgICAgIGRvY3VtZW50VmVyc2lvbjogbnVsbCxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgdHJpbW1lZCA9IHRydW5jYXRlU291cmNlKFN0cmluZyhzbGljZS50ZXh0ID8/ICcnKSwgbWF4TGluZXMpO1xuICBjb25zdCBpbnRlZ3JpdHkgPSBzbGljZS5pbnRlZ3JpdHkgPz8gJ2V4YWN0JztcbiAgY29uc3Qgc3RhbGUgPSBpbnRlZ3JpdHkgPT09ICdzdGFsZSc7XG4gIGNvbnN0IGVtcHR5ID0gdHJpbW1lZC50ZXh0LnRyaW0oKS5sZW5ndGggPT09IDA7XG4gIGxldCBtZXNzYWdlID0gJyc7XG4gIGlmIChzdGFsZSkge1xuICAgIG1lc3NhZ2UgPVxuICAgICAgJ1RoZSBkb2N1bWVudCBjaGFuZ2VkIHNpbmNlIHRoaXMgYW5hbHlzaXMuIFRoZSB0ZXh0IGJlbG93IGlzIGN1cnJlbnQsIGJ1dCB0aGUgZ3JhcGggbWF5IG5vdCBtYXRjaCBpdC4gUmUtYW5hbHl6ZSBiZWZvcmUgdHJ1c3RpbmcgdGhlIHJhbmdlLic7XG4gIH0gZWxzZSBpZiAoaW50ZWdyaXR5ID09PSAnbWlzc2luZycpIHtcbiAgICBtZXNzYWdlID0gc2xpY2UucmVhc29uIHx8ICdUaGUgYW5hbHl6ZWQgZG9jdW1lbnQgaXMgbm8gbG9uZ2VyIGF2YWlsYWJsZS4nO1xuICB9IGVsc2UgaWYgKGVtcHR5KSB7XG4gICAgbWVzc2FnZSA9ICdUaGlzIHJhbmdlIGhhcyBubyBzb3VyY2UgY29udGVudC4nO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB0aXRsZSxcbiAgICBraW5kOiBTdHJpbmcobm9kZT8ua2luZCA/PyAnbm9kZScpLFxuICAgIGZpbGU6IFN0cmluZyhzbGljZS5yZWxhdGl2ZVBhdGggPz8gcmFuZ2U/LmZpbGVJZCA/PyAnJyksXG4gICAgbGluZUxhYmVsLFxuICAgIHRleHQ6IHRyaW1tZWQudGV4dCxcbiAgICB0cnVuY2F0ZWQ6IEJvb2xlYW4odHJpbW1lZC50cnVuY2F0ZWQgfHwgc2xpY2UudHJ1bmNhdGVkKSxcbiAgICBzeW50aGV0aWM6IGZhbHNlLFxuICAgIHN0YWxlLFxuICAgIGVtcHR5LFxuICAgIG1lc3NhZ2UsXG4gICAgaW50ZWdyaXR5LFxuICAgIGRvY3VtZW50VmVyc2lvbjogTnVtYmVyLmlzSW50ZWdlcihzbGljZS5kb2N1bWVudFZlcnNpb24pID8gc2xpY2UuZG9jdW1lbnRWZXJzaW9uIDogbnVsbCxcbiAgfTtcbn1cbiIsICIvKipcbiAqIFByZXZpZXcgYW5kIG5hdmlnYXRpb24gc2V0dGluZ3MuXG4gKlxuICogVGhlIGRlZmF1bHRzIGhlcmUgYXJlIHRoZSBjb250cmFjdC4gYHBhY2thZ2UuanNvbmAgZGVjbGFyZXMgdGhlIHNhbWUga2V5cyBhbmRcbiAqIGRlZmF1bHRzOyBgdGVzdHMvdW5pdC9zb3VyY2VTZXR0aW5ncy50ZXN0LmpzYCBrZWVwcyB0aGUgbWFuaWZlc3QgYW5kIHRoaXNcbiAqIG1vZHVsZSBpbiBzeW5jLlxuICovXG5cbmV4cG9ydCBjb25zdCBQUkVWSUVXX0RFRkFVTFRTID0gT2JqZWN0LmZyZWV6ZSh7XG4gIGVuYWJsZWQ6IHRydWUsXG4gIGRlbGF5TXM6IDMwMCxcbiAgbWF4TGluZXM6IDEyLFxuICBzeW50YXhIaWdobGlnaHRpbmc6IHRydWUsXG4gIGNsaWNrVG9OYXZpZ2F0ZTogdHJ1ZSxcbiAgcGluQnlEZWZhdWx0OiBmYWxzZSxcbiAgb3BlbkluUHJldmlld1RhYjogZmFsc2UsXG59KTtcblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcGFyYW0ge251bWJlcn0gZmFsbGJhY2tcbiAqIEBwYXJhbSB7bnVtYmVyfSBtaW5cbiAqIEBwYXJhbSB7bnVtYmVyfSBtYXhcbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIGNsYW1wSW50ZWdlcih2YWx1ZSwgZmFsbGJhY2ssIG1pbiwgbWF4KSB7XG4gIGNvbnN0IGNhbmRpZGF0ZSA9IE51bWJlcih2YWx1ZSk7XG4gIGlmICghTnVtYmVyLmlzRmluaXRlKGNhbmRpZGF0ZSkpIHtcbiAgICByZXR1cm4gZmFsbGJhY2s7XG4gIH1cbiAgcmV0dXJuIE1hdGgubWluKG1heCwgTWF0aC5tYXgobWluLCBNYXRoLnRydW5jKGNhbmRpZGF0ZSkpKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGZhbGxiYWNrXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gYXNCb29sZWFuKHZhbHVlLCBmYWxsYmFjaykge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbicgPyB2YWx1ZSA6IGZhbGxiYWNrO1xufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSBzZXR0aW5ncyBmcm9tIGFueSBzb3VyY2UgKFZTIENvZGUgY29uZmlndXJhdGlvbiwgcHJvdG9jb2wgcGF5bG9hZCxcbiAqIHRlc3RzKS4gVW5rbm93biBzaGFwZXMgZmFsbCBiYWNrIHRvIHRoZSBkb2N1bWVudGVkIGRlZmF1bHRzOyBub3RoaW5nIHRocm93cy5cbiAqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBbcmF3XVxuICogQHJldHVybnMge3tlbmFibGVkOiBib29sZWFuLCBkZWxheU1zOiBudW1iZXIsIG1heExpbmVzOiBudW1iZXIsIHN5bnRheEhpZ2hsaWdodGluZzogYm9vbGVhbiwgY2xpY2tUb05hdmlnYXRlOiBib29sZWFuLCBwaW5CeURlZmF1bHQ6IGJvb2xlYW4sIG9wZW5JblByZXZpZXdUYWI6IGJvb2xlYW59fVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZVByZXZpZXdTZXR0aW5ncyhyYXcgPSB7fSkge1xuICBjb25zdCBzb3VyY2UgPSByYXcgJiYgdHlwZW9mIHJhdyA9PT0gJ29iamVjdCcgPyByYXcgOiB7fTtcbiAgcmV0dXJuIHtcbiAgICBlbmFibGVkOiBhc0Jvb2xlYW4oc291cmNlLmVuYWJsZWQsIFBSRVZJRVdfREVGQVVMVFMuZW5hYmxlZCksXG4gICAgZGVsYXlNczogY2xhbXBJbnRlZ2VyKHNvdXJjZS5kZWxheU1zLCBQUkVWSUVXX0RFRkFVTFRTLmRlbGF5TXMsIDAsIDJfMDAwKSxcbiAgICBtYXhMaW5lczogY2xhbXBJbnRlZ2VyKHNvdXJjZS5tYXhMaW5lcywgUFJFVklFV19ERUZBVUxUUy5tYXhMaW5lcywgNCwgNDApLFxuICAgIHN5bnRheEhpZ2hsaWdodGluZzogYXNCb29sZWFuKHNvdXJjZS5zeW50YXhIaWdobGlnaHRpbmcsIFBSRVZJRVdfREVGQVVMVFMuc3ludGF4SGlnaGxpZ2h0aW5nKSxcbiAgICBjbGlja1RvTmF2aWdhdGU6IGFzQm9vbGVhbihzb3VyY2UuY2xpY2tUb05hdmlnYXRlLCBQUkVWSUVXX0RFRkFVTFRTLmNsaWNrVG9OYXZpZ2F0ZSksXG4gICAgcGluQnlEZWZhdWx0OiBhc0Jvb2xlYW4oc291cmNlLnBpbkJ5RGVmYXVsdCwgUFJFVklFV19ERUZBVUxUUy5waW5CeURlZmF1bHQpLFxuICAgIG9wZW5JblByZXZpZXdUYWI6IGFzQm9vbGVhbihzb3VyY2Uub3BlbkluUHJldmlld1RhYiwgUFJFVklFV19ERUZBVUxUUy5vcGVuSW5QcmV2aWV3VGFiKSxcbiAgfTtcbn1cblxuLyoqXG4gKiBUcnVlIHdoZW4gYSBjb25maWd1cmF0aW9uLWNoYW5nZSBldmVudCB0b3VjaGVzIGEga2V5IHRoaXMgbW9kdWxlIG93bnMuXG4gKlxuICogQHBhcmFtIHt7YWZmZWN0c0NvbmZpZ3VyYXRpb24/OiAoc2VjdGlvbjogc3RyaW5nKSA9PiBib29sZWFufX0gZXZlbnRcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0dGluZ3NDaGFuZ2VkKGV2ZW50KSB7XG4gIHJldHVybiAoXG4gICAgQm9vbGVhbihldmVudD8uYWZmZWN0c0NvbmZpZ3VyYXRpb24/LignY29kZWZsb3cucHJldmlldycpKSB8fFxuICAgIEJvb2xlYW4oZXZlbnQ/LmFmZmVjdHNDb25maWd1cmF0aW9uPy4oJ2NvZGVmbG93Lm5hdmlnYXRpb24nKSlcbiAgKTtcbn1cbiIsICIvKipcbiAqIEV4cGxhbmF0aW9uIHNldHRpbmdzIGRlZmF1bHRzIGFuZCBub3JtYWxpemF0aW9uLlxuICpcbiAqIGBwYWNrYWdlLmpzb25gIGRlY2xhcmVzIHRoZSBzYW1lIGRlZmF1bHRzOyBgdGVzdHMvdW5pdC9leHBsYW5hdGlvblNldHRpbmdzLnRlc3QuanNgXG4gKiBlbmZvcmNlcyAxOjEgcGFyaXR5LlxuICovXG5cbmV4cG9ydCBjb25zdCBFWFBMQU5BVElPTl9ERUZBVUxUUyA9IE9iamVjdC5mcmVlemUoe1xuICBkZWZhdWx0RGVwdGg6IDIsXG4gIHNob3dFdmlkZW5jZTogdHJ1ZSxcbiAgaW5jbHVkZUxpbWl0YXRpb25zOiB0cnVlLFxufSk7XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHJldHVybnMgezF8MnwzfDR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGFtcEV4cGxhbmF0aW9uRGVwdGgodmFsdWUpIHtcbiAgY29uc3QgbnVtID0gTnVtYmVyKHZhbHVlKTtcbiAgaWYgKCFOdW1iZXIuaXNGaW5pdGUobnVtKSkge1xuICAgIHJldHVybiBFWFBMQU5BVElPTl9ERUZBVUxUUy5kZWZhdWx0RGVwdGg7XG4gIH1cbiAgY29uc3QgY2xhbXBlZCA9IE1hdGgubWluKDQsIE1hdGgubWF4KDEsIE1hdGgudHJ1bmMobnVtKSkpO1xuICByZXR1cm4gLyoqIEB0eXBlIHsxfDJ8M3w0fSAqLyAoY2xhbXBlZCk7XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHBhcmFtIHtib29sZWFufSBmYWxsYmFja1xuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGFzQm9vbGVhbih2YWx1ZSwgZmFsbGJhY2spIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nID8gdmFsdWUgOiBmYWxsYmFjaztcbn1cblxuLyoqXG4gKiBOb3JtYWxpemUgZXhwbGFuYXRpb24gc2V0dGluZ3MgZnJvbSBWUyBDb2RlIGNvbmZpZ3VyYXRpb24sIHByb3RvY29sIHBheWxvYWRzLFxuICogb3IgdGVzdCBpbnB1dHMgd2l0aG91dCB0aHJvd2luZy5cbiAqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBbcmF3XVxuICogQHJldHVybnMge3tkZWZhdWx0RGVwdGg6IDF8MnwzfDQsIHNob3dFdmlkZW5jZTogYm9vbGVhbiwgaW5jbHVkZUxpbWl0YXRpb25zOiBib29sZWFufX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVFeHBsYW5hdGlvblNldHRpbmdzKHJhdyA9IHt9KSB7XG4gIGNvbnN0IHNvdXJjZSA9IHJhdyAmJiB0eXBlb2YgcmF3ID09PSAnb2JqZWN0JyA/IHJhdyA6IHt9O1xuICByZXR1cm4ge1xuICAgIGRlZmF1bHREZXB0aDogY2xhbXBFeHBsYW5hdGlvbkRlcHRoKHNvdXJjZS5kZWZhdWx0RGVwdGgpLFxuICAgIHNob3dFdmlkZW5jZTogYXNCb29sZWFuKHNvdXJjZS5zaG93RXZpZGVuY2UsIEVYUExBTkFUSU9OX0RFRkFVTFRTLnNob3dFdmlkZW5jZSksXG4gICAgaW5jbHVkZUxpbWl0YXRpb25zOiBhc0Jvb2xlYW4oXG4gICAgICBzb3VyY2UuaW5jbHVkZUxpbWl0YXRpb25zLFxuICAgICAgRVhQTEFOQVRJT05fREVGQVVMVFMuaW5jbHVkZUxpbWl0YXRpb25zLFxuICAgICksXG4gIH07XG59XG5cbi8qKlxuICogQHBhcmFtIHt7YWZmZWN0c0NvbmZpZ3VyYXRpb24/OiAoc2VjdGlvbjogc3RyaW5nKSA9PiBib29sZWFufX0gZXZlbnRcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXhwbGFuYXRpb25TZXR0aW5nc0NoYW5nZWQoZXZlbnQpIHtcbiAgcmV0dXJuIEJvb2xlYW4oZXZlbnQ/LmFmZmVjdHNDb25maWd1cmF0aW9uPy4oJ2NvZGVmbG93LmV4cGxhbmF0aW9uJykpO1xufVxuIiwgIi8qKlxuICogSG92ZXItaW50ZW50IHN0YXRlIG1hY2hpbmUuXG4gKlxuICogRHdlbGwgdGltZSBwbHVzIHBvaW50ZXIgc3RhYmlsaXR5IHByZXZlbnRzIHByZXZpZXcgZmxpY2tlciB3aGlsZSBzY2FubmluZyBhXG4gKiBncmFwaC4gVGhlIGNvbnRyb2xsZXIgb3ducyB0aW1lcnMgYnV0IG5vIERPTSwgc28gdGhlIGJlaGF2aW91ciBpcyB0ZXN0YWJsZVxuICogd2l0aCBhIGZha2UgY2xvY2suXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7e3g6IG51bWJlciwgeTogbnVtYmVyfX0gUG9pbnRcbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7e1xuICogICBkZWxheU1zPzogbnVtYmVyLFxuICogICBtb3ZlVG9sZXJhbmNlPzogbnVtYmVyLFxuICogICBncmFjZU1zPzogbnVtYmVyLFxuICogICBlbmFibGVkPzogYm9vbGVhbixcbiAqICAgc2V0VGltZW91dD86IChoYW5kbGVyOiBGdW5jdGlvbiwgbXM6IG51bWJlcikgPT4gdW5rbm93bixcbiAqICAgY2xlYXJUaW1lb3V0PzogKGhhbmRsZTogdW5rbm93bikgPT4gdm9pZCxcbiAqICAgb25TaG93PzogKG5vZGVJZDogc3RyaW5nLCBhbmNob3I6IFBvaW50KSA9PiB2b2lkLFxuICogICBvbkhpZGU/OiAobm9kZUlkOiBzdHJpbmd8bnVsbCkgPT4gdm9pZCxcbiAqIH19IFtvcHRpb25zXVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUHJldmlld0NvbnRyb2xsZXIob3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IHNjaGVkdWxlID0gb3B0aW9ucy5zZXRUaW1lb3V0ID8/ICgoaGFuZGxlciwgbXMpID0+IHNldFRpbWVvdXQoaGFuZGxlciwgbXMpKTtcbiAgY29uc3QgY2FuY2VsID0gb3B0aW9ucy5jbGVhclRpbWVvdXQgPz8gKChoYW5kbGUpID0+IGNsZWFyVGltZW91dChoYW5kbGUpKTtcblxuICBsZXQgZGVsYXlNcyA9IE1hdGgubWF4KDAsIE51bWJlcihvcHRpb25zLmRlbGF5TXMgPz8gMzAwKSk7XG4gIGxldCBtb3ZlVG9sZXJhbmNlID0gTWF0aC5tYXgoMCwgTnVtYmVyKG9wdGlvbnMubW92ZVRvbGVyYW5jZSA/PyAxMikpO1xuICBjb25zdCBncmFjZU1zID0gTWF0aC5tYXgoMCwgTnVtYmVyKG9wdGlvbnMuZ3JhY2VNcyA/PyAxNTApKTtcbiAgbGV0IGVuYWJsZWQgPSBvcHRpb25zLmVuYWJsZWQgIT09IGZhbHNlO1xuICBsZXQgcGluQnlEZWZhdWx0ID0gQm9vbGVhbihvcHRpb25zLnBpbkJ5RGVmYXVsdCk7XG5cbiAgbGV0IGN1cnJlbnRJZCA9IG51bGw7XG4gIGxldCBhbmNob3IgPSB7IHg6IDAsIHk6IDAgfTtcbiAgbGV0IGR3ZWxsVGltZXIgPSBudWxsO1xuICBsZXQgZ3JhY2VUaW1lciA9IG51bGw7XG4gIGxldCBwb2ludGVySW5zaWRlID0gZmFsc2U7XG4gIGxldCBwaW5uZWQgPSBmYWxzZTtcbiAgbGV0IHZpc2libGUgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBjbGVhckR3ZWxsKCkge1xuICAgIGlmIChkd2VsbFRpbWVyICE9PSBudWxsKSB7XG4gICAgICBjYW5jZWwoZHdlbGxUaW1lcik7XG4gICAgICBkd2VsbFRpbWVyID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhckdyYWNlKCkge1xuICAgIGlmIChncmFjZVRpbWVyICE9PSBudWxsKSB7XG4gICAgICBjYW5jZWwoZ3JhY2VUaW1lcik7XG4gICAgICBncmFjZVRpbWVyID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzaG93KCkge1xuICAgIGlmICghZW5hYmxlZCB8fCBjdXJyZW50SWQgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmlzaWJsZSA9IHRydWU7XG4gICAgaWYgKHBpbkJ5RGVmYXVsdCkge1xuICAgICAgcGlubmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgb3B0aW9ucy5vblNob3c/LihjdXJyZW50SWQsIHsgLi4uYW5jaG9yIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gaGlkZSgpIHtcbiAgICBjbGVhckR3ZWxsKCk7XG4gICAgY2xlYXJHcmFjZSgpO1xuICAgIGlmICghdmlzaWJsZSAmJiBjdXJyZW50SWQgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcHJldmlvdXMgPSBjdXJyZW50SWQ7XG4gICAgdmlzaWJsZSA9IGZhbHNlO1xuICAgIGN1cnJlbnRJZCA9IG51bGw7XG4gICAgcGlubmVkID0gZmFsc2U7XG4gICAgb3B0aW9ucy5vbkhpZGU/LihwcmV2aW91cyk7XG4gIH1cblxuICBmdW5jdGlvbiBhcm1Ed2VsbCgpIHtcbiAgICBjbGVhckR3ZWxsKCk7XG4gICAgaWYgKCFlbmFibGVkIHx8IGN1cnJlbnRJZCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkd2VsbFRpbWVyID0gc2NoZWR1bGUoKCkgPT4ge1xuICAgICAgZHdlbGxUaW1lciA9IG51bGw7XG4gICAgICBzaG93KCk7XG4gICAgfSwgZGVsYXlNcyk7XG4gIH1cblxuICBmdW5jdGlvbiBhcm1HcmFjZSgpIHtcbiAgICBpZiAocGlubmVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNsZWFyR3JhY2UoKTtcbiAgICBncmFjZVRpbWVyID0gc2NoZWR1bGUoKCkgPT4ge1xuICAgICAgZ3JhY2VUaW1lciA9IG51bGw7XG4gICAgICBoaWRlKCk7XG4gICAgfSwgZ3JhY2VNcyk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWRcbiAgICAgKiBAcGFyYW0ge1BvaW50fSBwb2ludFxuICAgICAqL1xuICAgIHBvaW50ZXJFbnRlcihub2RlSWQsIHBvaW50KSB7XG4gICAgICBpZiAodHlwZW9mIG5vZGVJZCAhPT0gJ3N0cmluZycgfHwgbm9kZUlkLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBwb2ludGVySW5zaWRlID0gdHJ1ZTtcbiAgICAgIGNsZWFyR3JhY2UoKTtcbiAgICAgIGlmICh2aXNpYmxlICYmIGN1cnJlbnRJZCA9PT0gbm9kZUlkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICh2aXNpYmxlKSB7XG4gICAgICAgIG9wdGlvbnMub25IaWRlPy4oY3VycmVudElkKTtcbiAgICAgICAgdmlzaWJsZSA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgY3VycmVudElkID0gbm9kZUlkO1xuICAgICAgYW5jaG9yID0geyB4OiBOdW1iZXIocG9pbnQ/LnggPz8gMCksIHk6IE51bWJlcihwb2ludD8ueSA/PyAwKSB9O1xuICAgICAgcGlubmVkID0gZmFsc2U7XG4gICAgICBhcm1Ed2VsbCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNb3ZlbWVudCBsYXJnZXIgdGhhbiB0aGUgdG9sZXJhbmNlIHJlc3RhcnRzIHRoZSBkd2VsbCB0aW1lci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UG9pbnR9IHBvaW50XG4gICAgICovXG4gICAgcG9pbnRlck1vdmUocG9pbnQpIHtcbiAgICAgIGlmIChjdXJyZW50SWQgPT09IG51bGwgfHwgdmlzaWJsZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCB4ID0gTnVtYmVyKHBvaW50Py54ID8/IDApO1xuICAgICAgY29uc3QgeSA9IE51bWJlcihwb2ludD8ueSA/PyAwKTtcbiAgICAgIGNvbnN0IGR4ID0geCAtIGFuY2hvci54O1xuICAgICAgY29uc3QgZHkgPSB5IC0gYW5jaG9yLnk7XG4gICAgICBpZiAoTWF0aC5oeXBvdChkeCwgZHkpID4gbW92ZVRvbGVyYW5jZSkge1xuICAgICAgICBhbmNob3IgPSB7IHgsIHkgfTtcbiAgICAgICAgYXJtRHdlbGwoKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqIFBvaW50ZXIgbGVmdCB0aGUgbm9kZTogZ2l2ZSB0aGUgdXNlciB0aW1lIHRvIHJlYWNoIHRoZSBjYXJkLiAqL1xuICAgIHBvaW50ZXJMZWF2ZSgpIHtcbiAgICAgIHBvaW50ZXJJbnNpZGUgPSBmYWxzZTtcbiAgICAgIGNsZWFyRHdlbGwoKTtcbiAgICAgIGlmICghdmlzaWJsZSkge1xuICAgICAgICBjdXJyZW50SWQgPSBudWxsO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBhcm1HcmFjZSgpO1xuICAgIH0sXG5cbiAgICAvKiogUG9pbnRlciBlbnRlcmVkIHRoZSBjYXJkOyBjYW5jZWwgdGhlIGhpZGUuICovXG4gICAgcG9pbnRlckVudGVyQ2FyZCgpIHtcbiAgICAgIHBvaW50ZXJJbnNpZGUgPSB0cnVlO1xuICAgICAgY2xlYXJHcmFjZSgpO1xuICAgIH0sXG5cbiAgICBwb2ludGVyTGVhdmVDYXJkKCkge1xuICAgICAgcG9pbnRlckluc2lkZSA9IGZhbHNlO1xuICAgICAgaWYgKHZpc2libGUpIHtcbiAgICAgICAgYXJtR3JhY2UoKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgdG9nZ2xlUGluKCkge1xuICAgICAgcGlubmVkID0gIXBpbm5lZDtcbiAgICAgIGlmIChwaW5uZWQpIHtcbiAgICAgICAgY2xlYXJHcmFjZSgpO1xuICAgICAgfSBlbHNlIGlmICghcG9pbnRlckluc2lkZSkge1xuICAgICAgICBhcm1HcmFjZSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHBpbm5lZDtcbiAgICB9LFxuXG4gICAgLyoqIEBwYXJhbSB7Ym9vbGVhbn0gdmFsdWUgKi9cbiAgICBzZXRQaW5uZWQodmFsdWUpIHtcbiAgICAgIHBpbm5lZCA9IEJvb2xlYW4odmFsdWUpO1xuICAgICAgaWYgKHBpbm5lZCkge1xuICAgICAgICBjbGVhckdyYWNlKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGlubmVkO1xuICAgIH0sXG5cbiAgICAvKiogRXNjIGFsd2F5cyBleGl0cywgZXZlbiB3aGVuIHBpbm5lZC4gKi9cbiAgICBkaXNtaXNzKCkge1xuICAgICAgaGlkZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBMaXZlIHNldHRpbmdzIGNoYW5nZXMgbXVzdCBub3QgcmVxdWlyZSBhIHJlbG9hZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7e2RlbGF5TXM/OiBudW1iZXIsIGVuYWJsZWQ/OiBib29sZWFuLCBtb3ZlVG9sZXJhbmNlPzogbnVtYmVyLCBwaW5CeURlZmF1bHQ/OiBib29sZWFufX0gbmV4dFxuICAgICAqL1xuICAgIGNvbmZpZ3VyZShuZXh0ID0ge30pIHtcbiAgICAgIGlmIChuZXh0LmRlbGF5TXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBkZWxheU1zID0gTWF0aC5tYXgoMCwgTnVtYmVyKG5leHQuZGVsYXlNcykpO1xuICAgICAgfVxuICAgICAgaWYgKG5leHQubW92ZVRvbGVyYW5jZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG1vdmVUb2xlcmFuY2UgPSBNYXRoLm1heCgwLCBOdW1iZXIobmV4dC5tb3ZlVG9sZXJhbmNlKSk7XG4gICAgICB9XG4gICAgICBpZiAobmV4dC5waW5CeURlZmF1bHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBwaW5CeURlZmF1bHQgPSBCb29sZWFuKG5leHQucGluQnlEZWZhdWx0KTtcbiAgICAgIH1cbiAgICAgIGlmIChuZXh0LmVuYWJsZWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBlbmFibGVkID0gQm9vbGVhbihuZXh0LmVuYWJsZWQpO1xuICAgICAgICBpZiAoIWVuYWJsZWQpIHtcbiAgICAgICAgICBoaWRlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgaXNWaXNpYmxlOiAoKSA9PiB2aXNpYmxlLFxuICAgIGlzUGlubmVkOiAoKSA9PiBwaW5uZWQsXG4gICAgY3VycmVudElkOiAoKSA9PiBjdXJyZW50SWQsXG4gICAgZGVzdHJveSgpIHtcbiAgICAgIGNsZWFyRHdlbGwoKTtcbiAgICAgIGNsZWFyR3JhY2UoKTtcbiAgICAgIGN1cnJlbnRJZCA9IG51bGw7XG4gICAgICB2aXNpYmxlID0gZmFsc2U7XG4gICAgICBwaW5uZWQgPSBmYWxzZTtcbiAgICB9LFxuICB9O1xufVxuIiwgIi8vIGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvcGFja2FnZXMuaHRtbCNwYWNrYWdlc193cml0aW5nX2R1YWxfcGFja2FnZXNfd2hpbGVfYXZvaWRpbmdfb3JfbWluaW1pemluZ19oYXphcmRzXG5pbXBvcnQgSGlnaGxpZ2h0SlMgZnJvbSAnLi4vbGliL2NvcmUuanMnO1xuZXhwb3J0IHsgSGlnaGxpZ2h0SlMgfTtcbmV4cG9ydCBkZWZhdWx0IEhpZ2hsaWdodEpTO1xuIiwgIi8qXG5MYW5ndWFnZTogQysrXG5DYXRlZ29yeTogY29tbW9uLCBzeXN0ZW1cbldlYnNpdGU6IGh0dHBzOi8vaXNvY3BwLm9yZ1xuKi9cblxuLyoqIEB0eXBlIExhbmd1YWdlRm4gKi9cbmZ1bmN0aW9uIGNwcChobGpzKSB7XG4gIGNvbnN0IHJlZ2V4ID0gaGxqcy5yZWdleDtcbiAgLy8gYWRkZWQgZm9yIGhpc3RvcmljIHJlYXNvbnMgYmVjYXVzZSBgaGxqcy5DX0xJTkVfQ09NTUVOVF9NT0RFYCBkb2VzXG4gIC8vIG5vdCBpbmNsdWRlIHN1Y2ggc3VwcG9ydCBub3IgY2FuIHdlIGJlIHN1cmUgYWxsIHRoZSBncmFtbWFycyBkZXBlbmRpbmdcbiAgLy8gb24gaXQgd291bGQgZGVzaXJlIHRoaXMgYmVoYXZpb3JcbiAgY29uc3QgQ19MSU5FX0NPTU1FTlRfTU9ERSA9IGhsanMuQ09NTUVOVCgnLy8nLCAnJCcsIHsgY29udGFpbnM6IFsgeyBiZWdpbjogL1xcXFxcXG4vIH0gXSB9KTtcbiAgY29uc3QgREVDTFRZUEVfQVVUT19SRSA9ICdkZWNsdHlwZVxcXFwoYXV0b1xcXFwpJztcbiAgY29uc3QgTkFNRVNQQUNFX1JFID0gJ1thLXpBLVpfXVxcXFx3Kjo6JztcbiAgY29uc3QgVEVNUExBVEVfQVJHVU1FTlRfUkUgPSAnPFtePD5dKz4nO1xuICBjb25zdCBGVU5DVElPTl9UWVBFX1JFID0gJyg/IXN0cnVjdCkoJ1xuICAgICsgREVDTFRZUEVfQVVUT19SRSArICd8J1xuICAgICsgcmVnZXgub3B0aW9uYWwoTkFNRVNQQUNFX1JFKVxuICAgICsgJ1thLXpBLVpfXVxcXFx3KicgKyByZWdleC5vcHRpb25hbChURU1QTEFURV9BUkdVTUVOVF9SRSlcbiAgKyAnKSc7XG5cbiAgY29uc3QgQ1BQX1BSSU1JVElWRV9UWVBFUyA9IHtcbiAgICBjbGFzc05hbWU6ICd0eXBlJyxcbiAgICBiZWdpbjogJ1xcXFxiW2EtelxcXFxkX10qX3RcXFxcYidcbiAgfTtcblxuICAvLyBodHRwczovL2VuLmNwcHJlZmVyZW5jZS5jb20vdy9jcHAvbGFuZ3VhZ2UvZXNjYXBlXG4gIC8vIFxcXFwgXFx4IFxceEZGIFxcdTI4MzcgXFx1MDAzMjM3NDcgXFwzNzRcbiAgY29uc3QgQ0hBUkFDVEVSX0VTQ0FQRVMgPSAnXFxcXFxcXFwoeFswLTlBLUZhLWZdezJ9fHVbMC05QS1GYS1mXXs0LDh9fFswLTddezN9fFxcXFxTKSc7XG4gIGNvbnN0IFNUUklOR1MgPSB7XG4gICAgY2xhc3NOYW1lOiAnc3RyaW5nJyxcbiAgICB2YXJpYW50czogW1xuICAgICAge1xuICAgICAgICBiZWdpbjogJyh1OD98VXxMKT9cIicsXG4gICAgICAgIGVuZDogJ1wiJyxcbiAgICAgICAgaWxsZWdhbDogJ1xcXFxuJyxcbiAgICAgICAgY29udGFpbnM6IFsgaGxqcy5CQUNLU0xBU0hfRVNDQVBFIF1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGJlZ2luOiAnKHU4P3xVfEwpP1xcJygnICsgQ0hBUkFDVEVSX0VTQ0FQRVMgKyAnfC4pJyxcbiAgICAgICAgZW5kOiAnXFwnJyxcbiAgICAgICAgaWxsZWdhbDogJy4nXG4gICAgICB9LFxuICAgICAgaGxqcy5FTkRfU0FNRV9BU19CRUdJTih7XG4gICAgICAgIGJlZ2luOiAvKD86dTg/fFV8TCk/UlwiKFteKClcXFxcIF17MCwxNn0pXFwoLyxcbiAgICAgICAgZW5kOiAvXFwpKFteKClcXFxcIF17MCwxNn0pXCIvXG4gICAgICB9KVxuICAgIF1cbiAgfTtcblxuICBjb25zdCBOVU1CRVJTID0ge1xuICAgIGNsYXNzTmFtZTogJ251bWJlcicsXG4gICAgdmFyaWFudHM6IFtcbiAgICAgIC8vIEZsb2F0aW5nLXBvaW50IGxpdGVyYWwuXG4gICAgICB7IGJlZ2luOlxuICAgICAgICBcIlsrLV0/KD86XCIgLy8gTGVhZGluZyBzaWduLlxuICAgICAgICAgIC8vIERlY2ltYWwuXG4gICAgICAgICAgKyBcIig/OlwiXG4gICAgICAgICAgICArXCJbMC05XSg/Oic/WzAtOV0pKlxcXFwuKD86WzAtOV0oPzonP1swLTldKSopP1wiXG4gICAgICAgICAgICArIFwifFxcXFwuWzAtOV0oPzonP1swLTldKSpcIlxuICAgICAgICAgICsgXCIpKD86W0VlXVsrLV0/WzAtOV0oPzonP1swLTldKSopP1wiXG4gICAgICAgICAgKyBcInxbMC05XSg/Oic/WzAtOV0pKltFZV1bKy1dP1swLTldKD86Jz9bMC05XSkqXCJcbiAgICAgICAgICAvLyBIZXhhZGVjaW1hbC5cbiAgICAgICAgICArIFwifDBbWHhdKD86XCJcbiAgICAgICAgICAgICtcIlswLTlBLUZhLWZdKD86Jz9bMC05QS1GYS1mXSkqKD86XFxcXC4oPzpbMC05QS1GYS1mXSg/Oic/WzAtOUEtRmEtZl0pKik/KT9cIlxuICAgICAgICAgICAgKyBcInxcXFxcLlswLTlBLUZhLWZdKD86Jz9bMC05QS1GYS1mXSkqXCJcbiAgICAgICAgICArIFwiKVtQcF1bKy1dP1swLTldKD86Jz9bMC05XSkqXCJcbiAgICAgICAgKyBcIikoPzpcIiAvLyBMaXRlcmFsIHN1ZmZpeGVzLlxuICAgICAgICAgICsgXCJbRmZdKD86MTZ8MzJ8NjR8MTI4KT9cIlxuICAgICAgICAgICsgXCJ8KEJGfGJmKTE2XCJcbiAgICAgICAgICArIFwifFtMbF1cIlxuICAgICAgICAgICsgXCJ8XCIgLy8gTGl0ZXJhbCBzdWZmaXggaXMgb3B0aW9uYWwuXG4gICAgICAgICsgXCIpXCJcbiAgICAgIH0sXG4gICAgICAvLyBJbnRlZ2VyIGxpdGVyYWwuXG4gICAgICB7IGJlZ2luOlxuICAgICAgICBcIlsrLV0/XFxcXGIoPzpcIiAvLyBMZWFkaW5nIHNpZ24uXG4gICAgICAgICAgKyBcIjBbQmJdWzAxXSg/Oic/WzAxXSkqXCIgLy8gQmluYXJ5LlxuICAgICAgICAgICsgXCJ8MFtYeF1bMC05QS1GYS1mXSg/Oic/WzAtOUEtRmEtZl0pKlwiIC8vIEhleGFkZWNpbWFsLlxuICAgICAgICAgICsgXCJ8MCg/Oic/WzAtN10pKlwiIC8vIE9jdGFsIG9yIGp1c3QgYSBsb25lIHplcm8uXG4gICAgICAgICAgKyBcInxbMS05XSg/Oic/WzAtOV0pKlwiIC8vIERlY2ltYWwuXG4gICAgICAgICsgXCIpKD86XCIgLy8gTGl0ZXJhbCBzdWZmaXhlcy5cbiAgICAgICAgICArIFwiW1V1XSg/OkxMP3xsbD8pXCJcbiAgICAgICAgICArIFwifFtVdV1bWnpdP1wiXG4gICAgICAgICAgKyBcInwoPzpMTD98bGw/KVtVdV0/XCJcbiAgICAgICAgICArIFwifFtael1bVXVdXCJcbiAgICAgICAgICArIFwifFwiIC8vIExpdGVyYWwgc3VmZml4IGlzIG9wdGlvbmFsLlxuICAgICAgICArIFwiKVwiXG4gICAgICAgIC8vIE5vdGU6IHRoZXJlIGFyZSB1c2VyLWRlZmluZWQgbGl0ZXJhbCBzdWZmaXhlcyB0b28sIGJ1dCBwZXJoYXBzIGhhdmluZyB0aGUgY3VzdG9tIHN1ZmZpeCBub3QgcGFydCBvZiB0aGVcbiAgICAgICAgLy8gbGl0ZXJhbCBoaWdobGlnaHQgYWN0dWFsbHkgbWFrZXMgaXQgc3RhbmQgb3V0IG1vcmUuXG4gICAgICB9XG4gICAgXSxcbiAgICByZWxldmFuY2U6IDBcbiAgfTtcblxuICBjb25zdCBQUkVQUk9DRVNTT1IgPSB7XG4gICAgY2xhc3NOYW1lOiAnbWV0YScsXG4gICAgYmVnaW46IC8jXFxzKlthLXpdK1xcYi8sXG4gICAgZW5kOiAvJC8sXG4gICAga2V5d29yZHM6IHsga2V5d29yZDpcbiAgICAgICAgJ2lmIGVsc2UgZWxpZiBlbmRpZiBkZWZpbmUgdW5kZWYgd2FybmluZyBlcnJvciBsaW5lICdcbiAgICAgICAgKyAncHJhZ21hIF9QcmFnbWEgaWZkZWYgaWZuZGVmIGluY2x1ZGUnIH0sXG4gICAgY29udGFpbnM6IFtcbiAgICAgIHtcbiAgICAgICAgYmVnaW46IC9cXFxcXFxuLyxcbiAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICB9LFxuICAgICAgaGxqcy5pbmhlcml0KFNUUklOR1MsIHsgY2xhc3NOYW1lOiAnc3RyaW5nJyB9KSxcbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiAnc3RyaW5nJyxcbiAgICAgICAgYmVnaW46IC88Lio/Pi9cbiAgICAgIH0sXG4gICAgICBDX0xJTkVfQ09NTUVOVF9NT0RFLFxuICAgICAgaGxqcy5DX0JMT0NLX0NPTU1FTlRfTU9ERVxuICAgIF1cbiAgfTtcblxuICBjb25zdCBUSVRMRV9NT0RFID0ge1xuICAgIGNsYXNzTmFtZTogJ3RpdGxlJyxcbiAgICBiZWdpbjogcmVnZXgub3B0aW9uYWwoTkFNRVNQQUNFX1JFKSArIGhsanMuSURFTlRfUkUsXG4gICAgcmVsZXZhbmNlOiAwXG4gIH07XG5cbiAgY29uc3QgRlVOQ1RJT05fVElUTEUgPSByZWdleC5vcHRpb25hbChOQU1FU1BBQ0VfUkUpICsgaGxqcy5JREVOVF9SRSArICdcXFxccypcXFxcKCc7XG5cbiAgLy8gaHR0cHM6Ly9lbi5jcHByZWZlcmVuY2UuY29tL3cvY3BwL2tleXdvcmRcbiAgY29uc3QgUkVTRVJWRURfS0VZV09SRFMgPSBbXG4gICAgJ2FsaWduYXMnLFxuICAgICdhbGlnbm9mJyxcbiAgICAnYW5kJyxcbiAgICAnYW5kX2VxJyxcbiAgICAnYXNtJyxcbiAgICAnYXRvbWljX2NhbmNlbCcsXG4gICAgJ2F0b21pY19jb21taXQnLFxuICAgICdhdG9taWNfbm9leGNlcHQnLFxuICAgICdhdXRvJyxcbiAgICAnYml0YW5kJyxcbiAgICAnYml0b3InLFxuICAgICdicmVhaycsXG4gICAgJ2Nhc2UnLFxuICAgICdjYXRjaCcsXG4gICAgJ2NsYXNzJyxcbiAgICAnY29fYXdhaXQnLFxuICAgICdjb19yZXR1cm4nLFxuICAgICdjb195aWVsZCcsXG4gICAgJ2NvbXBsJyxcbiAgICAnY29uY2VwdCcsXG4gICAgJ2NvbnN0X2Nhc3R8MTAnLFxuICAgICdjb25zdGV2YWwnLFxuICAgICdjb25zdGV4cHInLFxuICAgICdjb25zdGluaXQnLFxuICAgICdjb250aW51ZScsXG4gICAgJ2RlY2x0eXBlJyxcbiAgICAnZGVmYXVsdCcsXG4gICAgJ2RlbGV0ZScsXG4gICAgJ2RvJyxcbiAgICAnZHluYW1pY19jYXN0fDEwJyxcbiAgICAnZWxzZScsXG4gICAgJ2VudW0nLFxuICAgICdleHBsaWNpdCcsXG4gICAgJ2V4cG9ydCcsXG4gICAgJ2V4dGVybicsXG4gICAgJ2ZhbHNlJyxcbiAgICAnZmluYWwnLFxuICAgICdmb3InLFxuICAgICdmcmllbmQnLFxuICAgICdnb3RvJyxcbiAgICAnaWYnLFxuICAgICdpbXBvcnQnLFxuICAgICdpbmxpbmUnLFxuICAgICdtb2R1bGUnLFxuICAgICdtdXRhYmxlJyxcbiAgICAnbmFtZXNwYWNlJyxcbiAgICAnbmV3JyxcbiAgICAnbm9leGNlcHQnLFxuICAgICdub3QnLFxuICAgICdub3RfZXEnLFxuICAgICdudWxscHRyJyxcbiAgICAnb3BlcmF0b3InLFxuICAgICdvcicsXG4gICAgJ29yX2VxJyxcbiAgICAnb3ZlcnJpZGUnLFxuICAgICdwcml2YXRlJyxcbiAgICAncHJvdGVjdGVkJyxcbiAgICAncHVibGljJyxcbiAgICAncmVmbGV4cHInLFxuICAgICdyZWdpc3RlcicsXG4gICAgJ3JlaW50ZXJwcmV0X2Nhc3R8MTAnLFxuICAgICdyZXF1aXJlcycsXG4gICAgJ3JldHVybicsXG4gICAgJ3NpemVvZicsXG4gICAgJ3N0YXRpY19hc3NlcnQnLFxuICAgICdzdGF0aWNfY2FzdHwxMCcsXG4gICAgJ3N0cnVjdCcsXG4gICAgJ3N3aXRjaCcsXG4gICAgJ3N5bmNocm9uaXplZCcsXG4gICAgJ3RlbXBsYXRlJyxcbiAgICAndGhpcycsXG4gICAgJ3RocmVhZF9sb2NhbCcsXG4gICAgJ3Rocm93JyxcbiAgICAndHJhbnNhY3Rpb25fc2FmZScsXG4gICAgJ3RyYW5zYWN0aW9uX3NhZmVfZHluYW1pYycsXG4gICAgJ3RydWUnLFxuICAgICd0cnknLFxuICAgICd0eXBlZGVmJyxcbiAgICAndHlwZWlkJyxcbiAgICAndHlwZW5hbWUnLFxuICAgICd1bmlvbicsXG4gICAgJ3VzaW5nJyxcbiAgICAndmlydHVhbCcsXG4gICAgJ3ZvbGF0aWxlJyxcbiAgICAnd2hpbGUnLFxuICAgICd4b3InLFxuICAgICd4b3JfZXEnXG4gIF07XG5cbiAgLy8gaHR0cHM6Ly9lbi5jcHByZWZlcmVuY2UuY29tL3cvY3BwL2tleXdvcmRcbiAgY29uc3QgUkVTRVJWRURfVFlQRVMgPSBbXG4gICAgJ2Jvb2wnLFxuICAgICdjaGFyJyxcbiAgICAnY2hhcjE2X3QnLFxuICAgICdjaGFyMzJfdCcsXG4gICAgJ2NoYXI4X3QnLFxuICAgICdkb3VibGUnLFxuICAgICdmbG9hdCcsXG4gICAgJ2ludCcsXG4gICAgJ2xvbmcnLFxuICAgICdzaG9ydCcsXG4gICAgJ3ZvaWQnLFxuICAgICd3Y2hhcl90JyxcbiAgICAndW5zaWduZWQnLFxuICAgICdzaWduZWQnLFxuICAgICdjb25zdCcsXG4gICAgJ3N0YXRpYydcbiAgXTtcblxuICBjb25zdCBUWVBFX0hJTlRTID0gW1xuICAgICdhbnknLFxuICAgICdhdXRvX3B0cicsXG4gICAgJ2JhcnJpZXInLFxuICAgICdiaW5hcnlfc2VtYXBob3JlJyxcbiAgICAnYml0c2V0JyxcbiAgICAnY29tcGxleCcsXG4gICAgJ2NvbmRpdGlvbl92YXJpYWJsZScsXG4gICAgJ2NvbmRpdGlvbl92YXJpYWJsZV9hbnknLFxuICAgICdjb3VudGluZ19zZW1hcGhvcmUnLFxuICAgICdkZXF1ZScsXG4gICAgJ2ZhbHNlX3R5cGUnLFxuICAgICdmbGF0X21hcCcsXG4gICAgJ2ZsYXRfc2V0JyxcbiAgICAnZnV0dXJlJyxcbiAgICAnaW1hZ2luYXJ5JyxcbiAgICAnaW5pdGlhbGl6ZXJfbGlzdCcsXG4gICAgJ2lzdHJpbmdzdHJlYW0nLFxuICAgICdqdGhyZWFkJyxcbiAgICAnbGF0Y2gnLFxuICAgICdsb2NrX2d1YXJkJyxcbiAgICAnbXVsdGltYXAnLFxuICAgICdtdWx0aXNldCcsXG4gICAgJ211dGV4JyxcbiAgICAnb3B0aW9uYWwnLFxuICAgICdvc3RyaW5nc3RyZWFtJyxcbiAgICAncGFja2FnZWRfdGFzaycsXG4gICAgJ3BhaXInLFxuICAgICdwcm9taXNlJyxcbiAgICAncHJpb3JpdHlfcXVldWUnLFxuICAgICdxdWV1ZScsXG4gICAgJ3JlY3Vyc2l2ZV9tdXRleCcsXG4gICAgJ3JlY3Vyc2l2ZV90aW1lZF9tdXRleCcsXG4gICAgJ3Njb3BlZF9sb2NrJyxcbiAgICAnc2V0JyxcbiAgICAnc2hhcmVkX2Z1dHVyZScsXG4gICAgJ3NoYXJlZF9sb2NrJyxcbiAgICAnc2hhcmVkX211dGV4JyxcbiAgICAnc2hhcmVkX3RpbWVkX211dGV4JyxcbiAgICAnc2hhcmVkX3B0cicsXG4gICAgJ3N0YWNrJyxcbiAgICAnc3RyaW5nX3ZpZXcnLFxuICAgICdzdHJpbmdzdHJlYW0nLFxuICAgICd0aW1lZF9tdXRleCcsXG4gICAgJ3RocmVhZCcsXG4gICAgJ3RydWVfdHlwZScsXG4gICAgJ3R1cGxlJyxcbiAgICAndW5pcXVlX2xvY2snLFxuICAgICd1bmlxdWVfcHRyJyxcbiAgICAndW5vcmRlcmVkX21hcCcsXG4gICAgJ3Vub3JkZXJlZF9tdWx0aW1hcCcsXG4gICAgJ3Vub3JkZXJlZF9tdWx0aXNldCcsXG4gICAgJ3Vub3JkZXJlZF9zZXQnLFxuICAgICd2YXJpYW50JyxcbiAgICAndmVjdG9yJyxcbiAgICAnd2Vha19wdHInLFxuICAgICd3c3RyaW5nJyxcbiAgICAnd3N0cmluZ192aWV3J1xuICBdO1xuXG4gIGNvbnN0IEZVTkNUSU9OX0hJTlRTID0gW1xuICAgICdhYm9ydCcsXG4gICAgJ2FicycsXG4gICAgJ2Fjb3MnLFxuICAgICdhcHBseScsXG4gICAgJ2FzX2NvbnN0JyxcbiAgICAnYXNpbicsXG4gICAgJ2F0YW4nLFxuICAgICdhdGFuMicsXG4gICAgJ2NhbGxvYycsXG4gICAgJ2NlaWwnLFxuICAgICdjZXJyJyxcbiAgICAnY2luJyxcbiAgICAnY2xvZycsXG4gICAgJ2NvcycsXG4gICAgJ2Nvc2gnLFxuICAgICdjb3V0JyxcbiAgICAnZGVjbHZhbCcsXG4gICAgJ2VuZGwnLFxuICAgICdleGNoYW5nZScsXG4gICAgJ2V4aXQnLFxuICAgICdleHAnLFxuICAgICdmYWJzJyxcbiAgICAnZmxvb3InLFxuICAgICdmbW9kJyxcbiAgICAnZm9yd2FyZCcsXG4gICAgJ2ZwcmludGYnLFxuICAgICdmcHV0cycsXG4gICAgJ2ZyZWUnLFxuICAgICdmcmV4cCcsXG4gICAgJ2ZzY2FuZicsXG4gICAgJ2Z1dHVyZScsXG4gICAgJ2ludm9rZScsXG4gICAgJ2lzYWxudW0nLFxuICAgICdpc2FscGhhJyxcbiAgICAnaXNjbnRybCcsXG4gICAgJ2lzZGlnaXQnLFxuICAgICdpc2dyYXBoJyxcbiAgICAnaXNsb3dlcicsXG4gICAgJ2lzcHJpbnQnLFxuICAgICdpc3B1bmN0JyxcbiAgICAnaXNzcGFjZScsXG4gICAgJ2lzdXBwZXInLFxuICAgICdpc3hkaWdpdCcsXG4gICAgJ2xhYnMnLFxuICAgICdsYXVuZGVyJyxcbiAgICAnbGRleHAnLFxuICAgICdsb2cnLFxuICAgICdsb2cxMCcsXG4gICAgJ21ha2VfcGFpcicsXG4gICAgJ21ha2Vfc2hhcmVkJyxcbiAgICAnbWFrZV9zaGFyZWRfZm9yX292ZXJ3cml0ZScsXG4gICAgJ21ha2VfdHVwbGUnLFxuICAgICdtYWtlX3VuaXF1ZScsXG4gICAgJ21hbGxvYycsXG4gICAgJ21lbWNocicsXG4gICAgJ21lbWNtcCcsXG4gICAgJ21lbWNweScsXG4gICAgJ21lbXNldCcsXG4gICAgJ21vZGYnLFxuICAgICdtb3ZlJyxcbiAgICAncG93JyxcbiAgICAncHJpbnRmJyxcbiAgICAncHV0Y2hhcicsXG4gICAgJ3B1dHMnLFxuICAgICdyZWFsbG9jJyxcbiAgICAnc2NhbmYnLFxuICAgICdzaW4nLFxuICAgICdzaW5oJyxcbiAgICAnc25wcmludGYnLFxuICAgICdzcHJpbnRmJyxcbiAgICAnc3FydCcsXG4gICAgJ3NzY2FuZicsXG4gICAgJ3N0ZCcsXG4gICAgJ3N0ZGVycicsXG4gICAgJ3N0ZGluJyxcbiAgICAnc3Rkb3V0JyxcbiAgICAnc3RyY2F0JyxcbiAgICAnc3RyY2hyJyxcbiAgICAnc3RyY21wJyxcbiAgICAnc3RyY3B5JyxcbiAgICAnc3RyY3NwbicsXG4gICAgJ3N0cmxlbicsXG4gICAgJ3N0cm5jYXQnLFxuICAgICdzdHJuY21wJyxcbiAgICAnc3RybmNweScsXG4gICAgJ3N0cnBicmsnLFxuICAgICdzdHJyY2hyJyxcbiAgICAnc3Ryc3BuJyxcbiAgICAnc3Ryc3RyJyxcbiAgICAnc3dhcCcsXG4gICAgJ3RhbicsXG4gICAgJ3RhbmgnLFxuICAgICd0ZXJtaW5hdGUnLFxuICAgICd0b191bmRlcmx5aW5nJyxcbiAgICAndG9sb3dlcicsXG4gICAgJ3RvdXBwZXInLFxuICAgICd2ZnByaW50ZicsXG4gICAgJ3Zpc2l0JyxcbiAgICAndnByaW50ZicsXG4gICAgJ3ZzcHJpbnRmJ1xuICBdO1xuXG4gIGNvbnN0IExJVEVSQUxTID0gW1xuICAgICdOVUxMJyxcbiAgICAnZmFsc2UnLFxuICAgICdudWxsb3B0JyxcbiAgICAnbnVsbHB0cicsXG4gICAgJ3RydWUnXG4gIF07XG5cbiAgLy8gaHR0cHM6Ly9lbi5jcHByZWZlcmVuY2UuY29tL3cvY3BwL2tleXdvcmRcbiAgY29uc3QgQlVJTFRfSU4gPSBbICdfUHJhZ21hJyBdO1xuXG4gIGNvbnN0IENQUF9LRVlXT1JEUyA9IHtcbiAgICB0eXBlOiBSRVNFUlZFRF9UWVBFUyxcbiAgICBrZXl3b3JkOiBSRVNFUlZFRF9LRVlXT1JEUyxcbiAgICBsaXRlcmFsOiBMSVRFUkFMUyxcbiAgICBidWlsdF9pbjogQlVJTFRfSU4sXG4gICAgX3R5cGVfaGludHM6IFRZUEVfSElOVFNcbiAgfTtcblxuICBjb25zdCBGVU5DVElPTl9ESVNQQVRDSCA9IHtcbiAgICBjbGFzc05hbWU6ICdmdW5jdGlvbi5kaXNwYXRjaCcsXG4gICAgcmVsZXZhbmNlOiAwLFxuICAgIGtleXdvcmRzOiB7XG4gICAgICAvLyBPbmx5IGZvciByZWxldmFuY2UsIG5vdCBoaWdobGlnaHRpbmcuXG4gICAgICBfaGludDogRlVOQ1RJT05fSElOVFMgfSxcbiAgICBiZWdpbjogcmVnZXguY29uY2F0KFxuICAgICAgL1xcYi8sXG4gICAgICAvKD8hZGVjbHR5cGUpLyxcbiAgICAgIC8oPyFpZikvLFxuICAgICAgLyg/IWZvcikvLFxuICAgICAgLyg/IXN3aXRjaCkvLFxuICAgICAgLyg/IXdoaWxlKS8sXG4gICAgICBobGpzLklERU5UX1JFLFxuICAgICAgcmVnZXgubG9va2FoZWFkKC8oPFtePD5dKz58KVxccypcXCgvKSlcbiAgfTtcblxuICBjb25zdCBFWFBSRVNTSU9OX0NPTlRBSU5TID0gW1xuICAgIEZVTkNUSU9OX0RJU1BBVENILFxuICAgIFBSRVBST0NFU1NPUixcbiAgICBDUFBfUFJJTUlUSVZFX1RZUEVTLFxuICAgIENfTElORV9DT01NRU5UX01PREUsXG4gICAgaGxqcy5DX0JMT0NLX0NPTU1FTlRfTU9ERSxcbiAgICBOVU1CRVJTLFxuICAgIFNUUklOR1NcbiAgXTtcblxuICBjb25zdCBFWFBSRVNTSU9OX0NPTlRFWFQgPSB7XG4gICAgLy8gVGhpcyBtb2RlIGNvdmVycyBleHByZXNzaW9uIGNvbnRleHQgd2hlcmUgd2UgY2FuJ3QgZXhwZWN0IGEgZnVuY3Rpb25cbiAgICAvLyBkZWZpbml0aW9uIGFuZCBzaG91bGRuJ3QgaGlnaGxpZ2h0IGFueXRoaW5nIHRoYXQgbG9va3MgbGlrZSBvbmU6XG4gICAgLy8gYHJldHVybiBzb21lKClgLCBgZWxzZSBpZigpYCwgYCh4KnN1bSgxLCAyKSlgXG4gICAgdmFyaWFudHM6IFtcbiAgICAgIHtcbiAgICAgICAgYmVnaW46IC89LyxcbiAgICAgICAgZW5kOiAvOy9cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGJlZ2luOiAvXFwoLyxcbiAgICAgICAgZW5kOiAvXFwpL1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgYmVnaW5LZXl3b3JkczogJ25ldyB0aHJvdyByZXR1cm4gZWxzZScsXG4gICAgICAgIGVuZDogLzsvXG4gICAgICB9XG4gICAgXSxcbiAgICBrZXl3b3JkczogQ1BQX0tFWVdPUkRTLFxuICAgIGNvbnRhaW5zOiBFWFBSRVNTSU9OX0NPTlRBSU5TLmNvbmNhdChbXG4gICAgICB7XG4gICAgICAgIGJlZ2luOiAvXFwoLyxcbiAgICAgICAgZW5kOiAvXFwpLyxcbiAgICAgICAga2V5d29yZHM6IENQUF9LRVlXT1JEUyxcbiAgICAgICAgY29udGFpbnM6IEVYUFJFU1NJT05fQ09OVEFJTlMuY29uY2F0KFsgJ3NlbGYnIF0pLFxuICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgIH1cbiAgICBdKSxcbiAgICByZWxldmFuY2U6IDBcbiAgfTtcblxuICBjb25zdCBGVU5DVElPTl9ERUNMQVJBVElPTiA9IHtcbiAgICBjbGFzc05hbWU6ICdmdW5jdGlvbicsXG4gICAgYmVnaW46ICcoJyArIEZVTkNUSU9OX1RZUEVfUkUgKyAnW1xcXFwqJlxcXFxzXSspKycgKyBGVU5DVElPTl9USVRMRSxcbiAgICByZXR1cm5CZWdpbjogdHJ1ZSxcbiAgICBlbmQ6IC9bezs9XS8sXG4gICAgZXhjbHVkZUVuZDogdHJ1ZSxcbiAgICBrZXl3b3JkczogQ1BQX0tFWVdPUkRTLFxuICAgIGlsbGVnYWw6IC9bXlxcd1xcc1xcKiY6PD4uXS8sXG4gICAgY29udGFpbnM6IFtcbiAgICAgIHsgLy8gdG8gcHJldmVudCBpdCBmcm9tIGJlaW5nIGNvbmZ1c2VkIGFzIHRoZSBmdW5jdGlvbiB0aXRsZVxuICAgICAgICBiZWdpbjogREVDTFRZUEVfQVVUT19SRSxcbiAgICAgICAga2V5d29yZHM6IENQUF9LRVlXT1JEUyxcbiAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBiZWdpbjogRlVOQ1RJT05fVElUTEUsXG4gICAgICAgIHJldHVybkJlZ2luOiB0cnVlLFxuICAgICAgICBjb250YWluczogWyBUSVRMRV9NT0RFIF0sXG4gICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgfSxcbiAgICAgIC8vIG5lZWRlZCBiZWNhdXNlIHdlIGRvIG5vdCBoYXZlIGxvb2stYmVoaW5kIG9uIHRoZSBiZWxvdyBydWxlXG4gICAgICAvLyB0byBwcmV2ZW50IGl0IGZyb20gZ3JhYmJpbmcgdGhlIGZpbmFsIDogaW4gYSA6OiBwYWlyXG4gICAgICB7XG4gICAgICAgIGJlZ2luOiAvOjovLFxuICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgIH0sXG4gICAgICAvLyBpbml0aWFsaXplcnNcbiAgICAgIHtcbiAgICAgICAgYmVnaW46IC86LyxcbiAgICAgICAgZW5kc1dpdGhQYXJlbnQ6IHRydWUsXG4gICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAgU1RSSU5HUyxcbiAgICAgICAgICBOVU1CRVJTXG4gICAgICAgIF1cbiAgICAgIH0sXG4gICAgICAvLyBhbGxvdyBmb3IgbXVsdGlwbGUgZGVjbGFyYXRpb25zLCBlLmcuOlxuICAgICAgLy8gZXh0ZXJuIHZvaWQgZihpbnQpLCBnKGNoYXIpO1xuICAgICAge1xuICAgICAgICByZWxldmFuY2U6IDAsXG4gICAgICAgIG1hdGNoOiAvLC9cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogJ3BhcmFtcycsXG4gICAgICAgIGJlZ2luOiAvXFwoLyxcbiAgICAgICAgZW5kOiAvXFwpLyxcbiAgICAgICAga2V5d29yZHM6IENQUF9LRVlXT1JEUyxcbiAgICAgICAgcmVsZXZhbmNlOiAwLFxuICAgICAgICBjb250YWluczogW1xuICAgICAgICAgIENfTElORV9DT01NRU5UX01PREUsXG4gICAgICAgICAgaGxqcy5DX0JMT0NLX0NPTU1FTlRfTU9ERSxcbiAgICAgICAgICBTVFJJTkdTLFxuICAgICAgICAgIE5VTUJFUlMsXG4gICAgICAgICAgQ1BQX1BSSU1JVElWRV9UWVBFUyxcbiAgICAgICAgICAvLyBDb3VudCBtYXRjaGluZyBwYXJlbnRoZXNlcy5cbiAgICAgICAgICB7XG4gICAgICAgICAgICBiZWdpbjogL1xcKC8sXG4gICAgICAgICAgICBlbmQ6IC9cXCkvLFxuICAgICAgICAgICAga2V5d29yZHM6IENQUF9LRVlXT1JEUyxcbiAgICAgICAgICAgIHJlbGV2YW5jZTogMCxcbiAgICAgICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAgICAgICdzZWxmJyxcbiAgICAgICAgICAgICAgQ19MSU5FX0NPTU1FTlRfTU9ERSxcbiAgICAgICAgICAgICAgaGxqcy5DX0JMT0NLX0NPTU1FTlRfTU9ERSxcbiAgICAgICAgICAgICAgU1RSSU5HUyxcbiAgICAgICAgICAgICAgTlVNQkVSUyxcbiAgICAgICAgICAgICAgQ1BQX1BSSU1JVElWRV9UWVBFU1xuICAgICAgICAgICAgXVxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfSxcbiAgICAgIENQUF9QUklNSVRJVkVfVFlQRVMsXG4gICAgICBDX0xJTkVfQ09NTUVOVF9NT0RFLFxuICAgICAgaGxqcy5DX0JMT0NLX0NPTU1FTlRfTU9ERSxcbiAgICAgIFBSRVBST0NFU1NPUlxuICAgIF1cbiAgfTtcblxuICByZXR1cm4ge1xuICAgIG5hbWU6ICdDKysnLFxuICAgIGFsaWFzZXM6IFtcbiAgICAgICdjYycsXG4gICAgICAnYysrJyxcbiAgICAgICdoKysnLFxuICAgICAgJ2hwcCcsXG4gICAgICAnaGgnLFxuICAgICAgJ2h4eCcsXG4gICAgICAnY3h4J1xuICAgIF0sXG4gICAga2V5d29yZHM6IENQUF9LRVlXT1JEUyxcbiAgICBpbGxlZ2FsOiAnPC8nLFxuICAgIGNsYXNzTmFtZUFsaWFzZXM6IHsgJ2Z1bmN0aW9uLmRpc3BhdGNoJzogJ2J1aWx0X2luJyB9LFxuICAgIGNvbnRhaW5zOiBbXS5jb25jYXQoXG4gICAgICBFWFBSRVNTSU9OX0NPTlRFWFQsXG4gICAgICBGVU5DVElPTl9ERUNMQVJBVElPTixcbiAgICAgIEZVTkNUSU9OX0RJU1BBVENILFxuICAgICAgRVhQUkVTU0lPTl9DT05UQUlOUyxcbiAgICAgIFtcbiAgICAgICAgUFJFUFJPQ0VTU09SLFxuICAgICAgICB7IC8vIGNvbnRhaW5lcnM6IGllLCBgdmVjdG9yIDxpbnQ+IHJvb21zICg5KTtgXG4gICAgICAgICAgYmVnaW46ICdcXFxcYihkZXF1ZXxsaXN0fHF1ZXVlfHByaW9yaXR5X3F1ZXVlfHBhaXJ8c3RhY2t8dmVjdG9yfG1hcHxzZXR8Yml0c2V0fG11bHRpc2V0fG11bHRpbWFwfHVub3JkZXJlZF9tYXB8dW5vcmRlcmVkX3NldHx1bm9yZGVyZWRfbXVsdGlzZXR8dW5vcmRlcmVkX211bHRpbWFwfGFycmF5fHR1cGxlfG9wdGlvbmFsfHZhcmlhbnR8ZnVuY3Rpb258ZmxhdF9tYXB8ZmxhdF9zZXQpXFxcXHMqPCg/ITwpJyxcbiAgICAgICAgICBlbmQ6ICc+JyxcbiAgICAgICAgICBrZXl3b3JkczogQ1BQX0tFWVdPUkRTLFxuICAgICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAgICAnc2VsZicsXG4gICAgICAgICAgICBDUFBfUFJJTUlUSVZFX1RZUEVTXG4gICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgYmVnaW46IGhsanMuSURFTlRfUkUgKyAnOjonLFxuICAgICAgICAgIGtleXdvcmRzOiBDUFBfS0VZV09SRFNcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIG1hdGNoOiBbXG4gICAgICAgICAgICAvLyBleHRyYSBjb21wbGV4aXR5IHRvIGRlYWwgd2l0aCBgZW51bSBjbGFzc2AgYW5kIGBlbnVtIHN0cnVjdGBcbiAgICAgICAgICAgIC9cXGIoPzplbnVtKD86XFxzKyg/OmNsYXNzfHN0cnVjdCkpP3xjbGFzc3xzdHJ1Y3R8dW5pb24pLyxcbiAgICAgICAgICAgIC9cXHMrLyxcbiAgICAgICAgICAgIC9cXHcrL1xuICAgICAgICAgIF0sXG4gICAgICAgICAgY2xhc3NOYW1lOiB7XG4gICAgICAgICAgICAxOiAna2V5d29yZCcsXG4gICAgICAgICAgICAzOiAndGl0bGUuY2xhc3MnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICBdKVxuICB9O1xufVxuXG5leHBvcnQgeyBjcHAgYXMgZGVmYXVsdCB9O1xuIiwgImNvbnN0IElERU5UX1JFID0gJ1tBLVphLXokX11bMC05QS1aYS16JF9dKic7XG5jb25zdCBLRVlXT1JEUyA9IFtcbiAgXCJhc1wiLCAvLyBmb3IgZXhwb3J0c1xuICBcImluXCIsXG4gIFwib2ZcIixcbiAgXCJpZlwiLFxuICBcImZvclwiLFxuICBcIndoaWxlXCIsXG4gIFwiZmluYWxseVwiLFxuICBcInZhclwiLFxuICBcIm5ld1wiLFxuICBcImZ1bmN0aW9uXCIsXG4gIFwiZG9cIixcbiAgXCJyZXR1cm5cIixcbiAgXCJ2b2lkXCIsXG4gIFwiZWxzZVwiLFxuICBcImJyZWFrXCIsXG4gIFwiY2F0Y2hcIixcbiAgXCJpbnN0YW5jZW9mXCIsXG4gIFwid2l0aFwiLFxuICBcInRocm93XCIsXG4gIFwiY2FzZVwiLFxuICBcImRlZmF1bHRcIixcbiAgXCJ0cnlcIixcbiAgXCJzd2l0Y2hcIixcbiAgXCJjb250aW51ZVwiLFxuICBcInR5cGVvZlwiLFxuICBcImRlbGV0ZVwiLFxuICBcImxldFwiLFxuICBcInlpZWxkXCIsXG4gIFwiY29uc3RcIixcbiAgXCJjbGFzc1wiLFxuICAvLyBKUyBoYW5kbGVzIHRoZXNlIHdpdGggYSBzcGVjaWFsIHJ1bGVcbiAgLy8gXCJnZXRcIixcbiAgLy8gXCJzZXRcIixcbiAgXCJkZWJ1Z2dlclwiLFxuICBcImFzeW5jXCIsXG4gIFwiYXdhaXRcIixcbiAgXCJzdGF0aWNcIixcbiAgXCJpbXBvcnRcIixcbiAgXCJmcm9tXCIsXG4gIFwiZXhwb3J0XCIsXG4gIFwiZXh0ZW5kc1wiLFxuICAvLyBJdCdzIHJlYWNoZWQgc3RhZ2UgMywgd2hpY2ggaXMgXCJyZWNvbW1lbmRlZCBmb3IgaW1wbGVtZW50YXRpb25cIjpcbiAgXCJ1c2luZ1wiXG5dO1xuY29uc3QgTElURVJBTFMgPSBbXG4gIFwidHJ1ZVwiLFxuICBcImZhbHNlXCIsXG4gIFwibnVsbFwiLFxuICBcInVuZGVmaW5lZFwiLFxuICBcIk5hTlwiLFxuICBcIkluZmluaXR5XCJcbl07XG5cbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzXG5jb25zdCBUWVBFUyA9IFtcbiAgLy8gRnVuZGFtZW50YWwgb2JqZWN0c1xuICBcIk9iamVjdFwiLFxuICBcIkZ1bmN0aW9uXCIsXG4gIFwiQm9vbGVhblwiLFxuICBcIlN5bWJvbFwiLFxuICAvLyBudW1iZXJzIGFuZCBkYXRlc1xuICBcIk1hdGhcIixcbiAgXCJEYXRlXCIsXG4gIFwiTnVtYmVyXCIsXG4gIFwiQmlnSW50XCIsXG4gIC8vIHRleHRcbiAgXCJTdHJpbmdcIixcbiAgXCJSZWdFeHBcIixcbiAgLy8gSW5kZXhlZCBjb2xsZWN0aW9uc1xuICBcIkFycmF5XCIsXG4gIFwiRmxvYXQzMkFycmF5XCIsXG4gIFwiRmxvYXQ2NEFycmF5XCIsXG4gIFwiSW50OEFycmF5XCIsXG4gIFwiVWludDhBcnJheVwiLFxuICBcIlVpbnQ4Q2xhbXBlZEFycmF5XCIsXG4gIFwiSW50MTZBcnJheVwiLFxuICBcIkludDMyQXJyYXlcIixcbiAgXCJVaW50MTZBcnJheVwiLFxuICBcIlVpbnQzMkFycmF5XCIsXG4gIFwiQmlnSW50NjRBcnJheVwiLFxuICBcIkJpZ1VpbnQ2NEFycmF5XCIsXG4gIC8vIEtleWVkIGNvbGxlY3Rpb25zXG4gIFwiU2V0XCIsXG4gIFwiTWFwXCIsXG4gIFwiV2Vha1NldFwiLFxuICBcIldlYWtNYXBcIixcbiAgLy8gU3RydWN0dXJlZCBkYXRhXG4gIFwiQXJyYXlCdWZmZXJcIixcbiAgXCJTaGFyZWRBcnJheUJ1ZmZlclwiLFxuICBcIkF0b21pY3NcIixcbiAgXCJEYXRhVmlld1wiLFxuICBcIkpTT05cIixcbiAgLy8gQ29udHJvbCBhYnN0cmFjdGlvbiBvYmplY3RzXG4gIFwiUHJvbWlzZVwiLFxuICBcIkdlbmVyYXRvclwiLFxuICBcIkdlbmVyYXRvckZ1bmN0aW9uXCIsXG4gIFwiQXN5bmNGdW5jdGlvblwiLFxuICAvLyBSZWZsZWN0aW9uXG4gIFwiUmVmbGVjdFwiLFxuICBcIlByb3h5XCIsXG4gIC8vIEludGVybmF0aW9uYWxpemF0aW9uXG4gIFwiSW50bFwiLFxuICAvLyBXZWJBc3NlbWJseVxuICBcIldlYkFzc2VtYmx5XCJcbl07XG5cbmNvbnN0IEVSUk9SX1RZUEVTID0gW1xuICBcIkVycm9yXCIsXG4gIFwiRXZhbEVycm9yXCIsXG4gIFwiSW50ZXJuYWxFcnJvclwiLFxuICBcIlJhbmdlRXJyb3JcIixcbiAgXCJSZWZlcmVuY2VFcnJvclwiLFxuICBcIlN5bnRheEVycm9yXCIsXG4gIFwiVHlwZUVycm9yXCIsXG4gIFwiVVJJRXJyb3JcIlxuXTtcblxuY29uc3QgQlVJTFRfSU5fR0xPQkFMUyA9IFtcbiAgXCJzZXRJbnRlcnZhbFwiLFxuICBcInNldFRpbWVvdXRcIixcbiAgXCJjbGVhckludGVydmFsXCIsXG4gIFwiY2xlYXJUaW1lb3V0XCIsXG5cbiAgXCJyZXF1aXJlXCIsXG4gIFwiZXhwb3J0c1wiLFxuXG4gIFwiZXZhbFwiLFxuICBcImlzRmluaXRlXCIsXG4gIFwiaXNOYU5cIixcbiAgXCJwYXJzZUZsb2F0XCIsXG4gIFwicGFyc2VJbnRcIixcbiAgXCJkZWNvZGVVUklcIixcbiAgXCJkZWNvZGVVUklDb21wb25lbnRcIixcbiAgXCJlbmNvZGVVUklcIixcbiAgXCJlbmNvZGVVUklDb21wb25lbnRcIixcbiAgXCJlc2NhcGVcIixcbiAgXCJ1bmVzY2FwZVwiXG5dO1xuXG5jb25zdCBCVUlMVF9JTl9WQVJJQUJMRVMgPSBbXG4gIFwiYXJndW1lbnRzXCIsXG4gIFwidGhpc1wiLFxuICBcInN1cGVyXCIsXG4gIFwiY29uc29sZVwiLFxuICBcIndpbmRvd1wiLFxuICBcImRvY3VtZW50XCIsXG4gIFwibG9jYWxTdG9yYWdlXCIsXG4gIFwic2Vzc2lvblN0b3JhZ2VcIixcbiAgXCJtb2R1bGVcIixcbiAgXCJnbG9iYWxcIiAvLyBOb2RlLmpzXG5dO1xuXG5jb25zdCBCVUlMVF9JTlMgPSBbXS5jb25jYXQoXG4gIEJVSUxUX0lOX0dMT0JBTFMsXG4gIFRZUEVTLFxuICBFUlJPUl9UWVBFU1xuKTtcblxuLypcbkxhbmd1YWdlOiBKYXZhU2NyaXB0XG5EZXNjcmlwdGlvbjogSmF2YVNjcmlwdCAoSlMpIGlzIGEgbGlnaHR3ZWlnaHQsIGludGVycHJldGVkLCBvciBqdXN0LWluLXRpbWUgY29tcGlsZWQgcHJvZ3JhbW1pbmcgbGFuZ3VhZ2Ugd2l0aCBmaXJzdC1jbGFzcyBmdW5jdGlvbnMuXG5DYXRlZ29yeTogY29tbW9uLCBzY3JpcHRpbmcsIHdlYlxuV2Vic2l0ZTogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdFxuKi9cblxuXG4vKiogQHR5cGUgTGFuZ3VhZ2VGbiAqL1xuZnVuY3Rpb24gamF2YXNjcmlwdChobGpzKSB7XG4gIGNvbnN0IHJlZ2V4ID0gaGxqcy5yZWdleDtcbiAgLyoqXG4gICAqIFRha2VzIGEgc3RyaW5nIGxpa2UgXCI8Qm9vZ2VyXCIgYW5kIGNoZWNrcyB0byBzZWVcbiAgICogaWYgd2UgY2FuIGZpbmQgYSBtYXRjaGluZyBcIjwvQm9vZ2VyXCIgbGF0ZXIgaW4gdGhlXG4gICAqIGNvbnRlbnQuXG4gICAqIEBwYXJhbSB7UmVnRXhwTWF0Y2hBcnJheX0gbWF0Y2hcbiAgICogQHBhcmFtIHt7YWZ0ZXI6bnVtYmVyfX0gcGFyYW0xXG4gICAqL1xuICBjb25zdCBoYXNDbG9zaW5nVGFnID0gKG1hdGNoLCB7IGFmdGVyIH0pID0+IHtcbiAgICBjb25zdCB0YWcgPSBcIjwvXCIgKyBtYXRjaFswXS5zbGljZSgxKTtcbiAgICBjb25zdCBwb3MgPSBtYXRjaC5pbnB1dC5pbmRleE9mKHRhZywgYWZ0ZXIpO1xuICAgIHJldHVybiBwb3MgIT09IC0xO1xuICB9O1xuXG4gIGNvbnN0IElERU5UX1JFJDEgPSBJREVOVF9SRTtcbiAgY29uc3QgRlJBR01FTlQgPSB7XG4gICAgYmVnaW46ICc8PicsXG4gICAgZW5kOiAnPC8+J1xuICB9O1xuICAvLyB0byBhdm9pZCBzb21lIHNwZWNpYWwgY2FzZXMgaW5zaWRlIGlzVHJ1bHlPcGVuaW5nVGFnXG4gIGNvbnN0IFhNTF9TRUxGX0NMT1NJTkcgPSAvPFtBLVphLXowLTlcXFxcLl86LV0rXFxzKlxcLz4vO1xuICBjb25zdCBYTUxfVEFHID0ge1xuICAgIGJlZ2luOiAvPFtBLVphLXowLTlcXFxcLl86LV0rLyxcbiAgICBlbmQ6IC9cXC9bQS1aYS16MC05XFxcXC5fOi1dKz58XFwvPi8sXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtSZWdFeHBNYXRjaEFycmF5fSBtYXRjaFxuICAgICAqIEBwYXJhbSB7Q2FsbGJhY2tSZXNwb25zZX0gcmVzcG9uc2VcbiAgICAgKi9cbiAgICBpc1RydWx5T3BlbmluZ1RhZzogKG1hdGNoLCByZXNwb25zZSkgPT4ge1xuICAgICAgY29uc3QgYWZ0ZXJNYXRjaEluZGV4ID0gbWF0Y2hbMF0ubGVuZ3RoICsgbWF0Y2guaW5kZXg7XG4gICAgICBjb25zdCBuZXh0Q2hhciA9IG1hdGNoLmlucHV0W2FmdGVyTWF0Y2hJbmRleF07XG4gICAgICBpZiAoXG4gICAgICAgIC8vIEhUTUwgc2hvdWxkIG5vdCBpbmNsdWRlIGFub3RoZXIgcmF3IGA8YCBpbnNpZGUgYSB0YWdcbiAgICAgICAgLy8gbmVzdGVkIHR5cGU/XG4gICAgICAgIC8vIGA8QXJyYXk8QXJyYXk8bnVtYmVyPj5gLCBldGMuXG4gICAgICAgIG5leHRDaGFyID09PSBcIjxcIiB8fFxuICAgICAgICAvLyB0aGUgLCBnaXZlcyBhd2F5IHRoYXQgdGhpcyBpcyBub3QgSFRNTFxuICAgICAgICAvLyBgPFQsIEEgZXh0ZW5kcyBrZXlvZiBULCBWPmBcbiAgICAgICAgbmV4dENoYXIgPT09IFwiLFwiXG4gICAgICAgICkge1xuICAgICAgICByZXNwb25zZS5pZ25vcmVNYXRjaCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIGA8c29tZXRoaW5nPmBcbiAgICAgIC8vIFF1aXRlIHBvc3NpYmx5IGEgdGFnLCBsZXRzIGxvb2sgZm9yIGEgbWF0Y2hpbmcgY2xvc2luZyB0YWcuLi5cbiAgICAgIGlmIChuZXh0Q2hhciA9PT0gXCI+XCIpIHtcbiAgICAgICAgLy8gaWYgd2UgY2Fubm90IGZpbmQgYSBtYXRjaGluZyBjbG9zaW5nIHRhZywgdGhlbiB3ZVxuICAgICAgICAvLyB3aWxsIGlnbm9yZSBpdFxuICAgICAgICBpZiAoIWhhc0Nsb3NpbmdUYWcobWF0Y2gsIHsgYWZ0ZXI6IGFmdGVyTWF0Y2hJbmRleCB9KSkge1xuICAgICAgICAgIHJlc3BvbnNlLmlnbm9yZU1hdGNoKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gYDxibGFoIC8+YCAoc2VsZi1jbG9zaW5nKVxuICAgICAgLy8gaGFuZGxlZCBieSBzaW1wbGVTZWxmQ2xvc2luZyBydWxlXG5cbiAgICAgIGxldCBtO1xuICAgICAgY29uc3QgYWZ0ZXJNYXRjaCA9IG1hdGNoLmlucHV0LnN1YnN0cmluZyhhZnRlck1hdGNoSW5kZXgpO1xuXG4gICAgICAvLyBzb21lIG1vcmUgdGVtcGxhdGUgdHlwaW5nIHN0dWZmXG4gICAgICAvLyAgPFQgPSBhbnk+KGtleT86IHN0cmluZykgPT4gTW9kaWZ5PFxuICAgICAgaWYgKChtID0gYWZ0ZXJNYXRjaC5tYXRjaCgvXlxccyo9LykpKSB7XG4gICAgICAgIHJlc3BvbnNlLmlnbm9yZU1hdGNoKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gYDxGcm9tIGV4dGVuZHMgc3RyaW5nPmBcbiAgICAgIC8vIHRlY2huaWNhbGx5IHRoaXMgY291bGQgYmUgSFRNTCwgYnV0IGl0IHNtZWxscyBsaWtlIGEgdHlwZVxuICAgICAgLy8gTk9URTogVGhpcyBpcyB1Z2gsIGJ1dCBhZGRlZCBzcGVjaWZpY2FsbHkgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9oaWdobGlnaHRqcy9oaWdobGlnaHQuanMvaXNzdWVzLzMyNzZcbiAgICAgIGlmICgobSA9IGFmdGVyTWF0Y2gubWF0Y2goL15cXHMrZXh0ZW5kc1xccysvKSkpIHtcbiAgICAgICAgaWYgKG0uaW5kZXggPT09IDApIHtcbiAgICAgICAgICByZXNwb25zZS5pZ25vcmVNYXRjaCgpO1xuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11c2VsZXNzLXJldHVyblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgY29uc3QgS0VZV09SRFMkMSA9IHtcbiAgICAkcGF0dGVybjogSURFTlRfUkUsXG4gICAga2V5d29yZDogS0VZV09SRFMsXG4gICAgbGl0ZXJhbDogTElURVJBTFMsXG4gICAgYnVpbHRfaW46IEJVSUxUX0lOUyxcbiAgICBcInZhcmlhYmxlLmxhbmd1YWdlXCI6IEJVSUxUX0lOX1ZBUklBQkxFU1xuICB9O1xuXG4gIC8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNzZWMtbGl0ZXJhbHMtbnVtZXJpYy1saXRlcmFsc1xuICBjb25zdCBkZWNpbWFsRGlnaXRzID0gJ1swLTldKF8/WzAtOV0pKic7XG4gIGNvbnN0IGZyYWMgPSBgXFxcXC4oJHtkZWNpbWFsRGlnaXRzfSlgO1xuICAvLyBEZWNpbWFsSW50ZWdlckxpdGVyYWwsIGluY2x1ZGluZyBBbm5leCBCIE5vbk9jdGFsRGVjaW1hbEludGVnZXJMaXRlcmFsXG4gIC8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNzZWMtYWRkaXRpb25hbC1zeW50YXgtbnVtZXJpYy1saXRlcmFsc1xuICBjb25zdCBkZWNpbWFsSW50ZWdlciA9IGAwfFsxLTldKF8/WzAtOV0pKnwwWzAtN10qWzg5XVswLTldKmA7XG4gIGNvbnN0IE5VTUJFUiA9IHtcbiAgICBjbGFzc05hbWU6ICdudW1iZXInLFxuICAgIHZhcmlhbnRzOiBbXG4gICAgICAvLyBEZWNpbWFsTGl0ZXJhbFxuICAgICAgeyBiZWdpbjogYChcXFxcYigke2RlY2ltYWxJbnRlZ2VyfSkoKCR7ZnJhY30pfFxcXFwuKT98KCR7ZnJhY30pKWAgK1xuICAgICAgICBgW2VFXVsrLV0/KCR7ZGVjaW1hbERpZ2l0c30pXFxcXGJgIH0sXG4gICAgICB7IGJlZ2luOiBgXFxcXGIoJHtkZWNpbWFsSW50ZWdlcn0pXFxcXGIoKCR7ZnJhY30pXFxcXGJ8XFxcXC4pP3woJHtmcmFjfSlcXFxcYmAgfSxcblxuICAgICAgLy8gRGVjaW1hbEJpZ0ludGVnZXJMaXRlcmFsXG4gICAgICB7IGJlZ2luOiBgXFxcXGIoMHxbMS05XShfP1swLTldKSopblxcXFxiYCB9LFxuXG4gICAgICAvLyBOb25EZWNpbWFsSW50ZWdlckxpdGVyYWxcbiAgICAgIHsgYmVnaW46IFwiXFxcXGIwW3hYXVswLTlhLWZBLUZdKF8/WzAtOWEtZkEtRl0pKm4/XFxcXGJcIiB9LFxuICAgICAgeyBiZWdpbjogXCJcXFxcYjBbYkJdWzAtMV0oXz9bMC0xXSkqbj9cXFxcYlwiIH0sXG4gICAgICB7IGJlZ2luOiBcIlxcXFxiMFtvT11bMC03XShfP1swLTddKSpuP1xcXFxiXCIgfSxcblxuICAgICAgLy8gTGVnYWN5T2N0YWxJbnRlZ2VyTGl0ZXJhbCAoZG9lcyBub3QgaW5jbHVkZSB1bmRlcnNjb3JlIHNlcGFyYXRvcnMpXG4gICAgICAvLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jc2VjLWFkZGl0aW9uYWwtc3ludGF4LW51bWVyaWMtbGl0ZXJhbHNcbiAgICAgIHsgYmVnaW46IFwiXFxcXGIwWzAtN10rbj9cXFxcYlwiIH0sXG4gICAgXSxcbiAgICByZWxldmFuY2U6IDBcbiAgfTtcblxuICBjb25zdCBTVUJTVCA9IHtcbiAgICBjbGFzc05hbWU6ICdzdWJzdCcsXG4gICAgYmVnaW46ICdcXFxcJFxcXFx7JyxcbiAgICBlbmQ6ICdcXFxcfScsXG4gICAga2V5d29yZHM6IEtFWVdPUkRTJDEsXG4gICAgY29udGFpbnM6IFtdIC8vIGRlZmluZWQgbGF0ZXJcbiAgfTtcbiAgY29uc3QgSFRNTF9URU1QTEFURSA9IHtcbiAgICBiZWdpbjogJ1xcLj9odG1sYCcsXG4gICAgZW5kOiAnJyxcbiAgICBzdGFydHM6IHtcbiAgICAgIGVuZDogJ2AnLFxuICAgICAgcmV0dXJuRW5kOiBmYWxzZSxcbiAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgIGhsanMuQkFDS1NMQVNIX0VTQ0FQRSxcbiAgICAgICAgU1VCU1RcbiAgICAgIF0sXG4gICAgICBzdWJMYW5ndWFnZTogJ3htbCdcbiAgICB9XG4gIH07XG4gIGNvbnN0IENTU19URU1QTEFURSA9IHtcbiAgICBiZWdpbjogJ1xcLj9jc3NgJyxcbiAgICBlbmQ6ICcnLFxuICAgIHN0YXJ0czoge1xuICAgICAgZW5kOiAnYCcsXG4gICAgICByZXR1cm5FbmQ6IGZhbHNlLFxuICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgaGxqcy5CQUNLU0xBU0hfRVNDQVBFLFxuICAgICAgICBTVUJTVFxuICAgICAgXSxcbiAgICAgIHN1Ykxhbmd1YWdlOiAnY3NzJ1xuICAgIH1cbiAgfTtcbiAgY29uc3QgR1JBUEhRTF9URU1QTEFURSA9IHtcbiAgICBiZWdpbjogJ1xcLj9ncWxgJyxcbiAgICBlbmQ6ICcnLFxuICAgIHN0YXJ0czoge1xuICAgICAgZW5kOiAnYCcsXG4gICAgICByZXR1cm5FbmQ6IGZhbHNlLFxuICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgaGxqcy5CQUNLU0xBU0hfRVNDQVBFLFxuICAgICAgICBTVUJTVFxuICAgICAgXSxcbiAgICAgIHN1Ykxhbmd1YWdlOiAnZ3JhcGhxbCdcbiAgICB9XG4gIH07XG4gIGNvbnN0IFRFTVBMQVRFX1NUUklORyA9IHtcbiAgICBjbGFzc05hbWU6ICdzdHJpbmcnLFxuICAgIGJlZ2luOiAnYCcsXG4gICAgZW5kOiAnYCcsXG4gICAgY29udGFpbnM6IFtcbiAgICAgIGhsanMuQkFDS1NMQVNIX0VTQ0FQRSxcbiAgICAgIFNVQlNUXG4gICAgXVxuICB9O1xuICBjb25zdCBKU0RPQ19DT01NRU5UID0gaGxqcy5DT01NRU5UKFxuICAgIC9cXC9cXCpcXCooPyFcXC8pLyxcbiAgICAnXFxcXCovJyxcbiAgICB7XG4gICAgICByZWxldmFuY2U6IDAsXG4gICAgICBjb250YWluczogW1xuICAgICAgICB7XG4gICAgICAgICAgYmVnaW46ICcoPz1AW0EtWmEtel0rKScsXG4gICAgICAgICAgcmVsZXZhbmNlOiAwLFxuICAgICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGNsYXNzTmFtZTogJ2RvY3RhZycsXG4gICAgICAgICAgICAgIGJlZ2luOiAnQFtBLVphLXpdKydcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGNsYXNzTmFtZTogJ3R5cGUnLFxuICAgICAgICAgICAgICBiZWdpbjogJ1xcXFx7JyxcbiAgICAgICAgICAgICAgZW5kOiAnXFxcXH0nLFxuICAgICAgICAgICAgICBleGNsdWRlRW5kOiB0cnVlLFxuICAgICAgICAgICAgICBleGNsdWRlQmVnaW46IHRydWUsXG4gICAgICAgICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgY2xhc3NOYW1lOiAndmFyaWFibGUnLFxuICAgICAgICAgICAgICBiZWdpbjogSURFTlRfUkUkMSArICcoPz1cXFxccyooLSl8JCknLFxuICAgICAgICAgICAgICBlbmRzUGFyZW50OiB0cnVlLFxuICAgICAgICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBlYXQgc3BhY2VzIChub3QgbmV3bGluZXMpIHNvIHdlIGNhbiBmaW5kXG4gICAgICAgICAgICAvLyB0eXBlcyBvciB2YXJpYWJsZXNcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgYmVnaW46IC8oPz1bXlxcbl0pXFxzLyxcbiAgICAgICAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9XG4gICAgICBdXG4gICAgfVxuICApO1xuICBjb25zdCBDT01NRU5UID0ge1xuICAgIGNsYXNzTmFtZTogXCJjb21tZW50XCIsXG4gICAgdmFyaWFudHM6IFtcbiAgICAgIEpTRE9DX0NPTU1FTlQsXG4gICAgICBobGpzLkNfQkxPQ0tfQ09NTUVOVF9NT0RFLFxuICAgICAgaGxqcy5DX0xJTkVfQ09NTUVOVF9NT0RFXG4gICAgXVxuICB9O1xuICBjb25zdCBTVUJTVF9JTlRFUk5BTFMgPSBbXG4gICAgaGxqcy5BUE9TX1NUUklOR19NT0RFLFxuICAgIGhsanMuUVVPVEVfU1RSSU5HX01PREUsXG4gICAgSFRNTF9URU1QTEFURSxcbiAgICBDU1NfVEVNUExBVEUsXG4gICAgR1JBUEhRTF9URU1QTEFURSxcbiAgICBURU1QTEFURV9TVFJJTkcsXG4gICAgLy8gU2tpcCBudW1iZXJzIHdoZW4gdGhleSBhcmUgcGFydCBvZiBhIHZhcmlhYmxlIG5hbWVcbiAgICB7IG1hdGNoOiAvXFwkXFxkKy8gfSxcbiAgICBOVU1CRVIsXG4gICAgLy8gVGhpcyBpcyBpbnRlbnRpb25hbDpcbiAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2hpZ2hsaWdodGpzL2hpZ2hsaWdodC5qcy9pc3N1ZXMvMzI4OFxuICAgIC8vIGhsanMuUkVHRVhQX01PREVcbiAgXTtcbiAgU1VCU1QuY29udGFpbnMgPSBTVUJTVF9JTlRFUk5BTFNcbiAgICAuY29uY2F0KHtcbiAgICAgIC8vIHdlIG5lZWQgdG8gcGFpciB1cCB7fSBpbnNpZGUgb3VyIHN1YnN0IHRvIHByZXZlbnRcbiAgICAgIC8vIGl0IGZyb20gZW5kaW5nIHRvbyBlYXJseSBieSBtYXRjaGluZyBhbm90aGVyIH1cbiAgICAgIGJlZ2luOiAvXFx7LyxcbiAgICAgIGVuZDogL1xcfS8sXG4gICAgICBrZXl3b3JkczogS0VZV09SRFMkMSxcbiAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgIFwic2VsZlwiXG4gICAgICBdLmNvbmNhdChTVUJTVF9JTlRFUk5BTFMpXG4gICAgfSk7XG4gIGNvbnN0IFNVQlNUX0FORF9DT01NRU5UUyA9IFtdLmNvbmNhdChDT01NRU5ULCBTVUJTVC5jb250YWlucyk7XG4gIGNvbnN0IFBBUkFNU19DT05UQUlOUyA9IFNVQlNUX0FORF9DT01NRU5UUy5jb25jYXQoW1xuICAgIC8vIGVhdCByZWN1cnNpdmUgcGFyZW5zIGluIHN1YiBleHByZXNzaW9uc1xuICAgIHtcbiAgICAgIGJlZ2luOiAvKFxccyopXFwoLyxcbiAgICAgIGVuZDogL1xcKS8sXG4gICAgICBrZXl3b3JkczogS0VZV09SRFMkMSxcbiAgICAgIGNvbnRhaW5zOiBbXCJzZWxmXCJdLmNvbmNhdChTVUJTVF9BTkRfQ09NTUVOVFMpXG4gICAgfVxuICBdKTtcbiAgY29uc3QgUEFSQU1TID0ge1xuICAgIGNsYXNzTmFtZTogJ3BhcmFtcycsXG4gICAgLy8gY29udmVydCB0aGlzIHRvIG5lZ2F0aXZlIGxvb2tiZWhpbmQgaW4gdjEyXG4gICAgYmVnaW46IC8oXFxzKilcXCgvLCAvLyB0byBtYXRjaCB0aGUgcGFybXMgd2l0aFxuICAgIGVuZDogL1xcKS8sXG4gICAgZXhjbHVkZUJlZ2luOiB0cnVlLFxuICAgIGV4Y2x1ZGVFbmQ6IHRydWUsXG4gICAga2V5d29yZHM6IEtFWVdPUkRTJDEsXG4gICAgY29udGFpbnM6IFBBUkFNU19DT05UQUlOU1xuICB9O1xuXG4gIC8vIEVTNiBjbGFzc2VzXG4gIGNvbnN0IENMQVNTX09SX0VYVEVORFMgPSB7XG4gICAgdmFyaWFudHM6IFtcbiAgICAgIC8vIGNsYXNzIENhciBleHRlbmRzIHZlaGljbGVcbiAgICAgIHtcbiAgICAgICAgbWF0Y2g6IFtcbiAgICAgICAgICAvY2xhc3MvLFxuICAgICAgICAgIC9cXHMrLyxcbiAgICAgICAgICBJREVOVF9SRSQxLFxuICAgICAgICAgIC9cXHMrLyxcbiAgICAgICAgICAvZXh0ZW5kcy8sXG4gICAgICAgICAgL1xccysvLFxuICAgICAgICAgIHJlZ2V4LmNvbmNhdChJREVOVF9SRSQxLCBcIihcIiwgcmVnZXguY29uY2F0KC9cXC4vLCBJREVOVF9SRSQxKSwgXCIpKlwiKVxuICAgICAgICBdLFxuICAgICAgICBzY29wZToge1xuICAgICAgICAgIDE6IFwia2V5d29yZFwiLFxuICAgICAgICAgIDM6IFwidGl0bGUuY2xhc3NcIixcbiAgICAgICAgICA1OiBcImtleXdvcmRcIixcbiAgICAgICAgICA3OiBcInRpdGxlLmNsYXNzLmluaGVyaXRlZFwiXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAvLyBjbGFzcyBDYXJcbiAgICAgIHtcbiAgICAgICAgbWF0Y2g6IFtcbiAgICAgICAgICAvY2xhc3MvLFxuICAgICAgICAgIC9cXHMrLyxcbiAgICAgICAgICBJREVOVF9SRSQxXG4gICAgICAgIF0sXG4gICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgMTogXCJrZXl3b3JkXCIsXG4gICAgICAgICAgMzogXCJ0aXRsZS5jbGFzc1wiXG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICBdXG4gIH07XG5cbiAgY29uc3QgQ0xBU1NfUkVGRVJFTkNFID0ge1xuICAgIHJlbGV2YW5jZTogMCxcbiAgICBtYXRjaDpcbiAgICByZWdleC5laXRoZXIoXG4gICAgICAvLyBIYXJkIGNvZGVkIGV4Y2VwdGlvbnNcbiAgICAgIC9cXGJKU09OLyxcbiAgICAgIC8vIEZsb2F0MzJBcnJheSwgT3V0VFxuICAgICAgL1xcYltBLVpdW2Etel0rKFtBLVpdW2Etel0qfFxcZCkqLyxcbiAgICAgIC8vIENTU0ZhY3RvcnksIENTU0ZhY3RvcnlUXG4gICAgICAvXFxiW0EtWl17Mix9KFtBLVpdW2Etel0rfFxcZCkrKFtBLVpdW2Etel0qKSovLFxuICAgICAgLy8gRlBzLCBGUHNUXG4gICAgICAvXFxiW0EtWl17Mix9W2Etel0rKFtBLVpdW2Etel0rfFxcZCkqKFtBLVpdW2Etel0qKSovLFxuICAgICAgLy8gUFxuICAgICAgLy8gc2luZ2xlIGxldHRlcnMgYXJlIG5vdCBoaWdobGlnaHRlZFxuICAgICAgLy8gQkxBSFxuICAgICAgLy8gdGhpcyB3aWxsIGJlIGZsYWdnZWQgYXMgYSBVUFBFUl9DQVNFX0NPTlNUQU5UIGluc3RlYWRcbiAgICApLFxuICAgIGNsYXNzTmFtZTogXCJ0aXRsZS5jbGFzc1wiLFxuICAgIGtleXdvcmRzOiB7XG4gICAgICBfOiBbXG4gICAgICAgIC8vIHNlIHdlIHN0aWxsIGdldCByZWxldmFuY2UgY3JlZGl0IGZvciBKUyBsaWJyYXJ5IGNsYXNzZXNcbiAgICAgICAgLi4uVFlQRVMsXG4gICAgICAgIC4uLkVSUk9SX1RZUEVTXG4gICAgICBdXG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IFVTRV9TVFJJQ1QgPSB7XG4gICAgbGFiZWw6IFwidXNlX3N0cmljdFwiLFxuICAgIGNsYXNzTmFtZTogJ21ldGEnLFxuICAgIHJlbGV2YW5jZTogMTAsXG4gICAgYmVnaW46IC9eXFxzKlsnXCJddXNlIChzdHJpY3R8YXNtKVsnXCJdL1xuICB9O1xuXG4gIGNvbnN0IEZVTkNUSU9OX0RFRklOSVRJT04gPSB7XG4gICAgdmFyaWFudHM6IFtcbiAgICAgIHtcbiAgICAgICAgbWF0Y2g6IFtcbiAgICAgICAgICAvZnVuY3Rpb24vLFxuICAgICAgICAgIC9cXHMrLyxcbiAgICAgICAgICBJREVOVF9SRSQxLFxuICAgICAgICAgIC8oPz1cXHMqXFwoKS9cbiAgICAgICAgXVxuICAgICAgfSxcbiAgICAgIC8vIGFub255bW91cyBmdW5jdGlvblxuICAgICAge1xuICAgICAgICBtYXRjaDogW1xuICAgICAgICAgIC9mdW5jdGlvbi8sXG4gICAgICAgICAgL1xccyooPz1cXCgpL1xuICAgICAgICBdXG4gICAgICB9XG4gICAgXSxcbiAgICBjbGFzc05hbWU6IHtcbiAgICAgIDE6IFwia2V5d29yZFwiLFxuICAgICAgMzogXCJ0aXRsZS5mdW5jdGlvblwiXG4gICAgfSxcbiAgICBsYWJlbDogXCJmdW5jLmRlZlwiLFxuICAgIGNvbnRhaW5zOiBbIFBBUkFNUyBdLFxuICAgIGlsbGVnYWw6IC8lL1xuICB9O1xuXG4gIGNvbnN0IFVQUEVSX0NBU0VfQ09OU1RBTlQgPSB7XG4gICAgcmVsZXZhbmNlOiAwLFxuICAgIG1hdGNoOiAvXFxiW0EtWl1bQS1aXzAtOV0rXFxiLyxcbiAgICBjbGFzc05hbWU6IFwidmFyaWFibGUuY29uc3RhbnRcIlxuICB9O1xuXG4gIGZ1bmN0aW9uIG5vbmVPZihsaXN0KSB7XG4gICAgcmV0dXJuIHJlZ2V4LmNvbmNhdChcIig/IVwiLCBsaXN0LmpvaW4oXCJ8XCIpLCBcIilcIik7XG4gIH1cblxuICBjb25zdCBGVU5DVElPTl9DQUxMID0ge1xuICAgIG1hdGNoOiByZWdleC5jb25jYXQoXG4gICAgICAvXFxiLyxcbiAgICAgIG5vbmVPZihbXG4gICAgICAgIC4uLkJVSUxUX0lOX0dMT0JBTFMsXG4gICAgICAgIFwic3VwZXJcIixcbiAgICAgICAgXCJpbXBvcnRcIlxuICAgICAgXS5tYXAoeCA9PiBgJHt4fVxcXFxzKlxcXFwoYCkpLFxuICAgICAgSURFTlRfUkUkMSwgcmVnZXgubG9va2FoZWFkKC9cXHMqXFwoLykpLFxuICAgIGNsYXNzTmFtZTogXCJ0aXRsZS5mdW5jdGlvblwiLFxuICAgIHJlbGV2YW5jZTogMFxuICB9O1xuXG4gIGNvbnN0IFBST1BFUlRZX0FDQ0VTUyA9IHtcbiAgICBiZWdpbjogcmVnZXguY29uY2F0KC9cXC4vLCByZWdleC5sb29rYWhlYWQoXG4gICAgICByZWdleC5jb25jYXQoSURFTlRfUkUkMSwgLyg/IVswLTlBLVphLXokXyhdKS8pXG4gICAgKSksXG4gICAgZW5kOiBJREVOVF9SRSQxLFxuICAgIGV4Y2x1ZGVCZWdpbjogdHJ1ZSxcbiAgICBrZXl3b3JkczogXCJwcm90b3R5cGVcIixcbiAgICBjbGFzc05hbWU6IFwicHJvcGVydHlcIixcbiAgICByZWxldmFuY2U6IDBcbiAgfTtcblxuICBjb25zdCBHRVRURVJfT1JfU0VUVEVSID0ge1xuICAgIG1hdGNoOiBbXG4gICAgICAvZ2V0fHNldC8sXG4gICAgICAvXFxzKy8sXG4gICAgICBJREVOVF9SRSQxLFxuICAgICAgLyg/PVxcKCkvXG4gICAgXSxcbiAgICBjbGFzc05hbWU6IHtcbiAgICAgIDE6IFwia2V5d29yZFwiLFxuICAgICAgMzogXCJ0aXRsZS5mdW5jdGlvblwiXG4gICAgfSxcbiAgICBjb250YWluczogW1xuICAgICAgeyAvLyBlYXQgdG8gYXZvaWQgZW1wdHkgcGFyYW1zXG4gICAgICAgIGJlZ2luOiAvXFwoXFwpL1xuICAgICAgfSxcbiAgICAgIFBBUkFNU1xuICAgIF1cbiAgfTtcblxuICBjb25zdCBGVU5DX0xFQURfSU5fUkUgPSAnKFxcXFwoJyArXG4gICAgJ1teKCldKihcXFxcKCcgK1xuICAgICdbXigpXSooXFxcXCgnICtcbiAgICAnW14oKV0qJyArXG4gICAgJ1xcXFwpW14oKV0qKSonICtcbiAgICAnXFxcXClbXigpXSopKicgK1xuICAgICdcXFxcKXwnICsgaGxqcy5VTkRFUlNDT1JFX0lERU5UX1JFICsgJylcXFxccyo9Pic7XG5cbiAgY29uc3QgRlVOQ1RJT05fVkFSSUFCTEUgPSB7XG4gICAgbWF0Y2g6IFtcbiAgICAgIC9jb25zdHx2YXJ8bGV0LywgL1xccysvLFxuICAgICAgSURFTlRfUkUkMSwgL1xccyovLFxuICAgICAgLz1cXHMqLyxcbiAgICAgIC8oYXN5bmNcXHMqKT8vLCAvLyBhc3luYyBpcyBvcHRpb25hbFxuICAgICAgcmVnZXgubG9va2FoZWFkKEZVTkNfTEVBRF9JTl9SRSlcbiAgICBdLFxuICAgIGtleXdvcmRzOiBcImFzeW5jXCIsXG4gICAgY2xhc3NOYW1lOiB7XG4gICAgICAxOiBcImtleXdvcmRcIixcbiAgICAgIDM6IFwidGl0bGUuZnVuY3Rpb25cIlxuICAgIH0sXG4gICAgY29udGFpbnM6IFtcbiAgICAgIFBBUkFNU1xuICAgIF1cbiAgfTtcblxuICByZXR1cm4ge1xuICAgIG5hbWU6ICdKYXZhU2NyaXB0JyxcbiAgICBhbGlhc2VzOiBbJ2pzJywgJ2pzeCcsICdtanMnLCAnY2pzJ10sXG4gICAga2V5d29yZHM6IEtFWVdPUkRTJDEsXG4gICAgLy8gdGhpcyB3aWxsIGJlIGV4dGVuZGVkIGJ5IFR5cGVTY3JpcHRcbiAgICBleHBvcnRzOiB7IFBBUkFNU19DT05UQUlOUywgQ0xBU1NfUkVGRVJFTkNFIH0sXG4gICAgaWxsZWdhbDogLyMoPyFbJF9BLXpdKS8sXG4gICAgY29udGFpbnM6IFtcbiAgICAgIGhsanMuU0hFQkFORyh7XG4gICAgICAgIGxhYmVsOiBcInNoZWJhbmdcIixcbiAgICAgICAgYmluYXJ5OiBcIm5vZGVcIixcbiAgICAgICAgcmVsZXZhbmNlOiA1XG4gICAgICB9KSxcbiAgICAgIFVTRV9TVFJJQ1QsXG4gICAgICBobGpzLkFQT1NfU1RSSU5HX01PREUsXG4gICAgICBobGpzLlFVT1RFX1NUUklOR19NT0RFLFxuICAgICAgSFRNTF9URU1QTEFURSxcbiAgICAgIENTU19URU1QTEFURSxcbiAgICAgIEdSQVBIUUxfVEVNUExBVEUsXG4gICAgICBURU1QTEFURV9TVFJJTkcsXG4gICAgICBDT01NRU5ULFxuICAgICAgLy8gU2tpcCBudW1iZXJzIHdoZW4gdGhleSBhcmUgcGFydCBvZiBhIHZhcmlhYmxlIG5hbWVcbiAgICAgIHsgbWF0Y2g6IC9cXCRcXGQrLyB9LFxuICAgICAgTlVNQkVSLFxuICAgICAgQ0xBU1NfUkVGRVJFTkNFLFxuICAgICAge1xuICAgICAgICBzY29wZTogJ2F0dHInLFxuICAgICAgICBtYXRjaDogSURFTlRfUkUkMSArIHJlZ2V4Lmxvb2thaGVhZCgnOicpLFxuICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgIH0sXG4gICAgICBGVU5DVElPTl9WQVJJQUJMRSxcbiAgICAgIHsgLy8gXCJ2YWx1ZVwiIGNvbnRhaW5lclxuICAgICAgICBiZWdpbjogJygnICsgaGxqcy5SRV9TVEFSVEVSU19SRSArICd8XFxcXGIoY2FzZXxyZXR1cm58dGhyb3cpXFxcXGIpXFxcXHMqJyxcbiAgICAgICAga2V5d29yZHM6ICdyZXR1cm4gdGhyb3cgY2FzZScsXG4gICAgICAgIHJlbGV2YW5jZTogMCxcbiAgICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgICBDT01NRU5ULFxuICAgICAgICAgIGhsanMuUkVHRVhQX01PREUsXG4gICAgICAgICAge1xuICAgICAgICAgICAgY2xhc3NOYW1lOiAnZnVuY3Rpb24nLFxuICAgICAgICAgICAgLy8gd2UgaGF2ZSB0byBjb3VudCB0aGUgcGFyZW5zIHRvIG1ha2Ugc3VyZSB3ZSBhY3R1YWxseSBoYXZlIHRoZVxuICAgICAgICAgICAgLy8gY29ycmVjdCBib3VuZGluZyAoICkgYmVmb3JlIHRoZSA9Pi4gIFRoZXJlIGNvdWxkIGJlIGFueSBudW1iZXIgb2ZcbiAgICAgICAgICAgIC8vIHN1Yi1leHByZXNzaW9ucyBpbnNpZGUgYWxzbyBzdXJyb3VuZGVkIGJ5IHBhcmVucy5cbiAgICAgICAgICAgIGJlZ2luOiBGVU5DX0xFQURfSU5fUkUsXG4gICAgICAgICAgICByZXR1cm5CZWdpbjogdHJ1ZSxcbiAgICAgICAgICAgIGVuZDogJ1xcXFxzKj0+JyxcbiAgICAgICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU6ICdwYXJhbXMnLFxuICAgICAgICAgICAgICAgIHZhcmlhbnRzOiBbXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGJlZ2luOiBobGpzLlVOREVSU0NPUkVfSURFTlRfUkUsXG4gICAgICAgICAgICAgICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBiZWdpbjogL1xcKFxccypcXCkvLFxuICAgICAgICAgICAgICAgICAgICBza2lwOiB0cnVlXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBiZWdpbjogLyhcXHMqKVxcKC8sXG4gICAgICAgICAgICAgICAgICAgIGVuZDogL1xcKS8sXG4gICAgICAgICAgICAgICAgICAgIGV4Y2x1ZGVCZWdpbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZXhjbHVkZUVuZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAga2V5d29yZHM6IEtFWVdPUkRTJDEsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5zOiBQQVJBTVNfQ09OVEFJTlNcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9LFxuICAgICAgICAgIHsgLy8gY291bGQgYmUgYSBjb21tYSBkZWxpbWl0ZWQgbGlzdCBvZiBwYXJhbXMgdG8gYSBmdW5jdGlvbiBjYWxsXG4gICAgICAgICAgICBiZWdpbjogLywvLFxuICAgICAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBtYXRjaDogL1xccysvLFxuICAgICAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7IC8vIEpTWFxuICAgICAgICAgICAgdmFyaWFudHM6IFtcbiAgICAgICAgICAgICAgeyBiZWdpbjogRlJBR01FTlQuYmVnaW4sIGVuZDogRlJBR01FTlQuZW5kIH0sXG4gICAgICAgICAgICAgIHsgbWF0Y2g6IFhNTF9TRUxGX0NMT1NJTkcgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGJlZ2luOiBYTUxfVEFHLmJlZ2luLFxuICAgICAgICAgICAgICAgIC8vIHdlIGNhcmVmdWxseSBjaGVjayB0aGUgb3BlbmluZyB0YWcgdG8gc2VlIGlmIGl0IHRydWx5XG4gICAgICAgICAgICAgICAgLy8gaXMgYSB0YWcgYW5kIG5vdCBhIGZhbHNlIHBvc2l0aXZlXG4gICAgICAgICAgICAgICAgJ29uOmJlZ2luJzogWE1MX1RBRy5pc1RydWx5T3BlbmluZ1RhZyxcbiAgICAgICAgICAgICAgICBlbmQ6IFhNTF9UQUcuZW5kXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBzdWJMYW5ndWFnZTogJ3htbCcsXG4gICAgICAgICAgICBjb250YWluczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYmVnaW46IFhNTF9UQUcuYmVnaW4sXG4gICAgICAgICAgICAgICAgZW5kOiBYTUxfVEFHLmVuZCxcbiAgICAgICAgICAgICAgICBza2lwOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbnRhaW5zOiBbJ3NlbGYnXVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgICAgfVxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIEZVTkNUSU9OX0RFRklOSVRJT04sXG4gICAgICB7XG4gICAgICAgIC8vIHByZXZlbnQgdGhpcyBmcm9tIGdldHRpbmcgc3dhbGxvd2VkIHVwIGJ5IGZ1bmN0aW9uXG4gICAgICAgIC8vIHNpbmNlIHRoZXkgYXBwZWFyIFwiZnVuY3Rpb24gbGlrZVwiXG4gICAgICAgIGJlZ2luS2V5d29yZHM6IFwid2hpbGUgaWYgc3dpdGNoIGNhdGNoIGZvclwiXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICAvLyB3ZSBoYXZlIHRvIGNvdW50IHRoZSBwYXJlbnMgdG8gbWFrZSBzdXJlIHdlIGFjdHVhbGx5IGhhdmUgdGhlIGNvcnJlY3RcbiAgICAgICAgLy8gYm91bmRpbmcgKCApLiAgVGhlcmUgY291bGQgYmUgYW55IG51bWJlciBvZiBzdWItZXhwcmVzc2lvbnMgaW5zaWRlXG4gICAgICAgIC8vIGFsc28gc3Vycm91bmRlZCBieSBwYXJlbnMuXG4gICAgICAgIGJlZ2luOiAnXFxcXGIoPyFmdW5jdGlvbiknICsgaGxqcy5VTkRFUlNDT1JFX0lERU5UX1JFICtcbiAgICAgICAgICAnXFxcXCgnICsgLy8gZmlyc3QgcGFyZW5zXG4gICAgICAgICAgJ1teKCldKihcXFxcKCcgK1xuICAgICAgICAgICAgJ1teKCldKihcXFxcKCcgK1xuICAgICAgICAgICAgICAnW14oKV0qJyArXG4gICAgICAgICAgICAnXFxcXClbXigpXSopKicgK1xuICAgICAgICAgICdcXFxcKVteKCldKikqJyArXG4gICAgICAgICAgJ1xcXFwpXFxcXHMqXFxcXHsnLCAvLyBlbmQgcGFyZW5zXG4gICAgICAgIHJldHVybkJlZ2luOnRydWUsXG4gICAgICAgIGxhYmVsOiBcImZ1bmMuZGVmXCIsXG4gICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAgUEFSQU1TLFxuICAgICAgICAgIGhsanMuaW5oZXJpdChobGpzLlRJVExFX01PREUsIHsgYmVnaW46IElERU5UX1JFJDEsIGNsYXNzTmFtZTogXCJ0aXRsZS5mdW5jdGlvblwiIH0pXG4gICAgICAgIF1cbiAgICAgIH0sXG4gICAgICAvLyBjYXRjaCAuLi4gc28gaXQgd29uJ3QgdHJpZ2dlciB0aGUgcHJvcGVydHkgcnVsZSBiZWxvd1xuICAgICAge1xuICAgICAgICBtYXRjaDogL1xcLlxcLlxcLi8sXG4gICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgfSxcbiAgICAgIFBST1BFUlRZX0FDQ0VTUyxcbiAgICAgIC8vIGhhY2s6IHByZXZlbnRzIGRldGVjdGlvbiBvZiBrZXl3b3JkcyBpbiBzb21lIGNpcmN1bXN0YW5jZXNcbiAgICAgIC8vIC5rZXl3b3JkKClcbiAgICAgIC8vICRrZXl3b3JkID0geFxuICAgICAge1xuICAgICAgICBtYXRjaDogJ1xcXFwkJyArIElERU5UX1JFJDEsXG4gICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbWF0Y2g6IFsgL1xcYmNvbnN0cnVjdG9yKD89XFxzKlxcKCkvIF0sXG4gICAgICAgIGNsYXNzTmFtZTogeyAxOiBcInRpdGxlLmZ1bmN0aW9uXCIgfSxcbiAgICAgICAgY29udGFpbnM6IFsgUEFSQU1TIF1cbiAgICAgIH0sXG4gICAgICBGVU5DVElPTl9DQUxMLFxuICAgICAgVVBQRVJfQ0FTRV9DT05TVEFOVCxcbiAgICAgIENMQVNTX09SX0VYVEVORFMsXG4gICAgICBHRVRURVJfT1JfU0VUVEVSLFxuICAgICAge1xuICAgICAgICBtYXRjaDogL1xcJFsoLl0vIC8vIHJlbGV2YW5jZSBib29zdGVyIGZvciBhIHBhdHRlcm4gY29tbW9uIHRvIEpTIGxpYnM6IGAkKHNvbWV0aGluZylgIGFuZCBgJC5zb21ldGhpbmdgXG4gICAgICB9XG4gICAgXVxuICB9O1xufVxuXG5leHBvcnQgeyBqYXZhc2NyaXB0IGFzIGRlZmF1bHQgfTtcbiIsICIvKipcbiAqIFdlYnZpZXcgc3ludGF4IGhpZ2hsaWdodGluZy5cbiAqXG4gKiBoaWdobGlnaHQuanMgaXMgYnVuZGxlZCBpbnRvIHRoZSB3ZWJ2aWV3IG9ubHkuIFRoZSBob3N0IG5ldmVyIGhpZ2hsaWdodHMsIGFuZFxuICogYSBmYWlsdXJlIGFsd2F5cyBkZWdyYWRlcyB0byBwbGFpbiB0ZXh0OiB0aGUgcHJldmlldyBpcyBzdGlsbCByZWFkYWJsZS5cbiAqL1xuXG5pbXBvcnQgaGxqcyBmcm9tICdoaWdobGlnaHQuanMvbGliL2NvcmUnO1xuaW1wb3J0IGNwcCBmcm9tICdoaWdobGlnaHQuanMvbGliL2xhbmd1YWdlcy9jcHAnO1xuaW1wb3J0IGphdmFzY3JpcHQgZnJvbSAnaGlnaGxpZ2h0LmpzL2xpYi9sYW5ndWFnZXMvamF2YXNjcmlwdCc7XG5cbmhsanMucmVnaXN0ZXJMYW5ndWFnZSgnY3BwJywgY3BwKTtcbmhsanMucmVnaXN0ZXJMYW5ndWFnZSgnamF2YXNjcmlwdCcsIGphdmFzY3JpcHQpO1xuXG4vKipcbiAqIEB0eXBlZGVmIHt7dGV4dDogc3RyaW5nLCBjbGFzc05hbWU6IHN0cmluZ319IFByZXZpZXdUb2tlblxuICovXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGxhbmd1YWdlSWRcbiAqIEByZXR1cm5zIHt7bGFuZ3VhZ2U6IHN0cmluZ3xudWxsLCBkZWdyYWRlZDogYm9vbGVhbn19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlTGFuZ3VhZ2UobGFuZ3VhZ2VJZCkge1xuICBjb25zdCBpZCA9IFN0cmluZyhsYW5ndWFnZUlkID8/ICcnKS50b0xvd2VyQ2FzZSgpO1xuICBpZiAoaWQgPT09ICdjcHAnIHx8IGlkID09PSAnYysrJyB8fCBpZCA9PT0gJ2MnIHx8IGlkID09PSAnb2JqZWN0aXZlLWMrKycpIHtcbiAgICByZXR1cm4geyBsYW5ndWFnZTogJ2NwcCcsIGRlZ3JhZGVkOiBmYWxzZSB9O1xuICB9XG4gIGlmIChpZCA9PT0gJ2phdmFzY3JpcHQnIHx8IGlkID09PSAnanMnIHx8IGlkID09PSAnbWpzJyB8fCBpZCA9PT0gJ2NqcycpIHtcbiAgICByZXR1cm4geyBsYW5ndWFnZTogJ2phdmFzY3JpcHQnLCBkZWdyYWRlZDogZmFsc2UgfTtcbiAgfVxuICByZXR1cm4geyBsYW5ndWFnZTogbnVsbCwgZGVncmFkZWQ6IHRydWUgfTtcbn1cblxuLyoqXG4gKiBTcGxpdCBoaWdobGlnaHQuanMgSFRNTCBpbnRvIGxpbmVzIG9mIGNsYXNzZWQgdG9rZW5zLiBPbmx5IHRoZSBzbWFsbCBzdWJzZXRcbiAqIG9mIG1hcmt1cCB0aGF0IGhpZ2hsaWdodC5qcyBlbWl0cyBpcyB1bmRlcnN0b29kOyBhbnl0aGluZyBlbHNlIGJlY29tZXMgdGV4dC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaHRtbFxuICogQHJldHVybnMge1ByZXZpZXdUb2tlbltdW119XG4gKi9cbmZ1bmN0aW9uIGh0bWxUb0xpbmVzKGh0bWwpIHtcbiAgLyoqIEB0eXBlIHtQcmV2aWV3VG9rZW5bXVtdfSAqL1xuICBjb25zdCBsaW5lcyA9IFtbXV07XG4gIGNvbnN0IHN0YWNrID0gW107XG4gIGNvbnN0IHBhdHRlcm4gPSAvPHNwYW4gY2xhc3M9XCIoW15cIl0rKVwiPnw8XFwvc3Bhbj58KFtePF0rKS9nO1xuICBsZXQgbWF0Y2g7XG4gIHdoaWxlICgobWF0Y2ggPSBwYXR0ZXJuLmV4ZWMoaHRtbCkpICE9PSBudWxsKSB7XG4gICAgaWYgKG1hdGNoWzFdKSB7XG4gICAgICBzdGFjay5wdXNoKG1hdGNoWzFdKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAobWF0Y2hbMF0gPT09ICc8L3NwYW4+Jykge1xuICAgICAgc3RhY2sucG9wKCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgdGV4dCA9IGRlY29kZUVudGl0aWVzKG1hdGNoWzJdID8/ICcnKTtcbiAgICBjb25zdCBwYXJ0cyA9IHRleHQuc3BsaXQoJ1xcbicpO1xuICAgIGZvciAoY29uc3QgW2luZGV4LCBwYXJ0XSBvZiBwYXJ0cy5lbnRyaWVzKCkpIHtcbiAgICAgIGlmIChpbmRleCA+IDApIHtcbiAgICAgICAgbGluZXMucHVzaChbXSk7XG4gICAgICB9XG4gICAgICBpZiAocGFydC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpbmVzW2xpbmVzLmxlbmd0aCAtIDFdLnB1c2goe1xuICAgICAgICAgIHRleHQ6IHBhcnQsXG4gICAgICAgICAgY2xhc3NOYW1lOiBzdGFjay5sZW5ndGggPiAwID8gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0gOiAnJyxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBsaW5lcztcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGRlY29kZUVudGl0aWVzKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZVxuICAgIC5yZXBsYWNlKC8mbHQ7L2csICc8JylcbiAgICAucmVwbGFjZSgvJmd0Oy9nLCAnPicpXG4gICAgLnJlcGxhY2UoLyZxdW90Oy9nLCAnXCInKVxuICAgIC5yZXBsYWNlKC8mI3gyNzsvZywgXCInXCIpXG4gICAgLnJlcGxhY2UoLyYjMzk7L2csIFwiJ1wiKVxuICAgIC5yZXBsYWNlKC8mYW1wOy9nLCAnJicpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gKiBAcmV0dXJucyB7UHJldmlld1Rva2VuW11bXX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBsYWluTGluZXModGV4dCkge1xuICByZXR1cm4gU3RyaW5nKHRleHQgPz8gJycpXG4gICAgLnNwbGl0KC9cXHJcXG58XFxyfFxcbi8pXG4gICAgLm1hcCgobGluZSkgPT4gKGxpbmUubGVuZ3RoID4gMCA/IFt7IHRleHQ6IGxpbmUsIGNsYXNzTmFtZTogJycgfV0gOiBbXSkpO1xufVxuXG4vKipcbiAqIEhpZ2hsaWdodCBhIHNvdXJjZSBzbGljZS4gTmV2ZXIgdGhyb3dzLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2VJZFxuICogQHJldHVybnMge3tsaW5lczogUHJldmlld1Rva2VuW11bXSwgZGVncmFkZWQ6IGJvb2xlYW59fVxuICovXG5leHBvcnQgZnVuY3Rpb24gaGlnaGxpZ2h0TGluZXModGV4dCwgbGFuZ3VhZ2VJZCkge1xuICBjb25zdCByZXNvbHZlZCA9IHJlc29sdmVMYW5ndWFnZShsYW5ndWFnZUlkKTtcbiAgaWYgKCFyZXNvbHZlZC5sYW5ndWFnZSkge1xuICAgIHJldHVybiB7IGxpbmVzOiBwbGFpbkxpbmVzKHRleHQpLCBkZWdyYWRlZDogdHJ1ZSB9O1xuICB9XG4gIHRyeSB7XG4gICAgY29uc3QgaHRtbCA9IGhsanMuaGlnaGxpZ2h0KFN0cmluZyh0ZXh0ID8/ICcnKSwgeyBsYW5ndWFnZTogcmVzb2x2ZWQubGFuZ3VhZ2UgfSkudmFsdWU7XG4gICAgcmV0dXJuIHsgbGluZXM6IGh0bWxUb0xpbmVzKGh0bWwpLCBkZWdyYWRlZDogZmFsc2UgfTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHsgbGluZXM6IHBsYWluTGluZXModGV4dCksIGRlZ3JhZGVkOiB0cnVlIH07XG4gIH1cbn1cbiIsICIvKipcbiAqIFdlYnZpZXcgZW50cnkgcG9pbnQuXG4gKlxuICogUmVzcG9uc2liaWxpdGllcyBhcmUgZGVsaWJlcmF0ZWx5IG5hcnJvdzogdGFsayBwcm90b2NvbCwgcmVuZGVyIHRoZSBEVE8sIHNob3dcbiAqIHNlbGVjdGlvbiBkZXRhaWxzLiBObyBhbmFseXNpcywgbm8gZmlsZSBhY2Nlc3MsIG5vIGdyYXBoIGNvbnN0cnVjdGlvbi5cbiAqL1xuXG5pbXBvcnQgeyBjcmVhdGVCcmlkZ2UgfSBmcm9tICcuLi9jb3JlL3Byb3RvY29sL2JyaWRnZS5qcyc7XG5pbXBvcnQgeyBESVJFQ1RJT05TLCBQUk9UT0NPTF9WRVJTSU9OIH0gZnJvbSAnLi4vY29yZS9wcm90b2NvbC9lbnZlbG9wZS5qcyc7XG5pbXBvcnQgeyB2YWxpZGF0ZUR0byB9IGZyb20gJy4uL2NvcmUvZ3JhcGgvZHRvLmpzJztcbmltcG9ydCB7IGNyZWF0ZVN2Z1JlbmRlcmVyIH0gZnJvbSAnLi4vdmlzdWFsaXphdGlvbi9yZW5kZXJlci9zdmdSZW5kZXJlci5qcyc7XG5pbXBvcnQgeyBidWlsZFByZXZpZXdNb2RlbCB9IGZyb20gJy4uL2NvcmUvc291cmNlL3ByZXNlbnRhdGlvbi5qcyc7XG5pbXBvcnQgeyByZXNvbHZlUHJldmlld1NldHRpbmdzIH0gZnJvbSAnLi4vY29yZS9zb3VyY2Uvc2V0dGluZ3MuanMnO1xuaW1wb3J0IHsgY2xhbXBFeHBsYW5hdGlvbkRlcHRoLCByZXNvbHZlRXhwbGFuYXRpb25TZXR0aW5ncyB9IGZyb20gJy4uL2NvcmUvZXhwbGFuYXRpb24vc2V0dGluZ3MuanMnO1xuaW1wb3J0IHsgY3JlYXRlUHJldmlld0NvbnRyb2xsZXIgfSBmcm9tICcuL3ByZXZpZXdDb250cm9sbGVyLmpzJztcbmltcG9ydCB7IGhpZ2hsaWdodExpbmVzIH0gZnJvbSAnLi9oaWdobGlnaHQuanMnO1xuXG5jb25zdCB2c2NvZGVBcGkgPSBhY3F1aXJlVnNDb2RlQXBpKCk7XG5cbmNvbnN0IHN2ZyA9IC8qKiBAdHlwZSB7U1ZHU1ZHRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1ncmFwaCcpKTtcbmNvbnN0IG1ldGEgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLW1ldGEnKSk7XG5jb25zdCBzdGF0dXMgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLXN0YXR1cycpKTtcbmNvbnN0IGJhbm5lciA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtYmFubmVyJykpO1xuY29uc3QgZW1wdHkgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWVtcHR5JykpO1xuY29uc3QgZGV0YWlsQm9keSA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtZGV0YWlsLWJvZHknKSk7XG5jb25zdCBsZWdlbmQgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWxlZ2VuZCcpKTtcbmNvbnN0IHJlbG9hZEJ1dHRvbiA9IC8qKiBAdHlwZSB7SFRNTEJ1dHRvbkVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtcmVmcmVzaCcpKTtcbmNvbnN0IGZ1bmN0aW9uUGlja2VyID0gLyoqIEB0eXBlIHtIVE1MU2VsZWN0RWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1mdW5jdGlvbicpXG4pO1xuY29uc3QgcHJldmlldyA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtcHJldmlldycpKTtcbmNvbnN0IHByZXZpZXdUaXRsZSA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtcHJldmlldy10aXRsZScpKTtcbmNvbnN0IHByZXZpZXdNZXRhID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1wcmV2aWV3LW1ldGEnKSk7XG5jb25zdCBwcmV2aWV3RXhwbGFpbiA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR8bnVsbH0gKi8gKFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtcHJldmlldy1leHBsYWluJylcbik7XG5jb25zdCBwcmV2aWV3Qm9keSA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtcHJldmlldy1ib2R5JykpO1xuY29uc3QgcHJldmlld05vdGUgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLXByZXZpZXctbm90ZScpKTtcbmNvbnN0IHByZXZpZXdQaW4gPSAvKiogQHR5cGUge0hUTUxCdXR0b25FbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLXByZXZpZXctcGluJykpO1xuY29uc3QgcHJldmlld0Nsb3NlID0gLyoqIEB0eXBlIHtIVE1MQnV0dG9uRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1wcmV2aWV3LWNsb3NlJykpO1xuY29uc3QgcHJldmlld09wZW4gPSAvKiogQHR5cGUge0hUTUxCdXR0b25FbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLXByZXZpZXctb3BlbicpKTtcbmNvbnN0IGZuU3VtbWFyeSA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR8bnVsbH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1mbi1zdW1tYXJ5JykpO1xuY29uc3QgZXhwbGFpblNlY3Rpb24gPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fG51bGx9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtZXhwbGFpbicpKTtcbmNvbnN0IGV4cGxhaW5EZXB0aFNlbGVjdCA9IC8qKiBAdHlwZSB7SFRNTFNlbGVjdEVsZW1lbnR8bnVsbH0gKi8gKFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtZXhwbGFpbi1kZXB0aCcpXG4pO1xuY29uc3QgZXhwbGFpbkl0ZW1zID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudHxudWxsfSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWV4cGxhaW4taXRlbXMnKSk7XG5jb25zdCBleHBsYWluRXZpZGVuY2UgPSAvKiogQHR5cGUge0hUTUxEZXRhaWxzRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1leHBsYWluLWV2aWRlbmNlJylcbik7XG5jb25zdCBleHBsYWluRXZpZGVuY2VMaXN0ID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1leHBsYWluLWV2aWRlbmNlLWxpc3QnKVxuKTtcbmNvbnN0IGV4cGxhaW5MaW1pdHMgPSAvKiogQHR5cGUge0hUTUxEZXRhaWxzRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1leHBsYWluLWxpbWl0cycpXG4pO1xuY29uc3QgZXhwbGFpbkxpbWl0c1RleHQgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fG51bGx9ICovIChcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWV4cGxhaW4tbGltaXRzLXRleHQnKVxuKTtcbmNvbnN0IHBlcnNwZWN0aXZlU2VsZWN0ID0gLyoqIEB0eXBlIHtIVE1MU2VsZWN0RWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1wZXJzcGVjdGl2ZScpXG4pO1xuY29uc3Qgc3dpdGNoUGVyc3BlY3RpdmVCdG4gPSAvKiogQHR5cGUge0hUTUxCdXR0b25FbGVtZW50fG51bGx9ICovIChcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLXN3aXRjaC1wZXJzcGVjdGl2ZScpXG4pO1xuY29uc3Qgc2NvcGVCYW5uZXIgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fG51bGx9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2Ytc2NvcGUtYmFubmVyJykpO1xuY29uc3QgY2FsbHNQYW5lbCA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR8bnVsbH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1jYWxscy1wYW5lbCcpKTtcbmNvbnN0IGNhbGxzRmlsdGVyU3RhdHVzID0gLyoqIEB0eXBlIHtIVE1MU2VsZWN0RWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1jYWxscy1maWx0ZXItc3RhdHVzJylcbik7XG5jb25zdCBjYWxsc0V4cGFuZEJ0biA9IC8qKiBAdHlwZSB7SFRNTEJ1dHRvbkVsZW1lbnR8bnVsbH0gKi8gKFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtY2FsbHMtZXhwYW5kJylcbik7XG5jb25zdCBjYWxsc0NvbGxhcHNlQnRuID0gLyoqIEB0eXBlIHtIVE1MQnV0dG9uRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1jYWxscy1jb2xsYXBzZScpXG4pO1xuY29uc3QgY2FsbHNGb2N1c0J0biA9IC8qKiBAdHlwZSB7SFRNTEJ1dHRvbkVsZW1lbnR8bnVsbH0gKi8gKFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtY2FsbHMtZm9jdXMnKVxuKTtcbmNvbnN0IGNhbGxlcnNIZWFkaW5nID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1jYWxsZXJzLWhlYWRpbmcnKVxuKTtcbmNvbnN0IGNhbGxlcnNMaXN0ID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudHxudWxsfSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWNhbGxlcnMtbGlzdCcpKTtcbmNvbnN0IGNhbGxlcnNNb3JlQnRuID0gLyoqIEB0eXBlIHtIVE1MQnV0dG9uRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1jYWxsZXJzLW1vcmUnKVxuKTtcbmNvbnN0IGNhbGxlZXNIZWFkaW5nID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1jYWxsZWVzLWhlYWRpbmcnKVxuKTtcbmNvbnN0IGNhbGxlZXNMaXN0ID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudHxudWxsfSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWNhbGxlZXMtbGlzdCcpKTtcbmNvbnN0IGNhbGxlZXNNb3JlQnRuID0gLyoqIEB0eXBlIHtIVE1MQnV0dG9uRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1jYWxsZWVzLW1vcmUnKVxuKTtcbmNvbnN0IHVucmVzb2x2ZWRCdWNrZXREZXRhaWxzID0gLyoqIEB0eXBlIHtIVE1MRGV0YWlsc0VsZW1lbnR8bnVsbH0gKi8gKFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtdW5yZXNvbHZlZC1idWNrZXQnKVxuKTtcbmNvbnN0IHVucmVzb2x2ZWRTdW1tYXJ5ID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi11bnJlc29sdmVkLXN1bW1hcnknKVxuKTtcbmNvbnN0IHVucmVzb2x2ZWRMaXN0ID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi11bnJlc29sdmVkLWxpc3QnKVxuKTtcblxuLyoqIEB0eXBlIHtpbXBvcnQoJy4uL2NvcmUvZ3JhcGgvZHRvLmpzJykuR3JhcGhEdG8gfCBudWxsfSAqL1xubGV0IGN1cnJlbnREdG8gPSBudWxsO1xuY29uc3QgcHJlZmVycmVkU3ltYm9sSWQgPSBkb2N1bWVudC5ib2R5LmRhdGFzZXQucHJlZmVycmVkU3ltYm9sIHx8IG51bGw7XG5jb25zdCBwcmVmZXJyZWRQZXJzcGVjdGl2ZSA9XG4gIGRvY3VtZW50LmJvZHkuZGF0YXNldC5wcmVmZXJyZWRQZXJzcGVjdGl2ZSA9PT0gJ2NhbGxfZ3JhcGgnID8gJ2NhbGxfZ3JhcGgnIDogJ2NmZyc7XG5cbi8qKiBAdHlwZSB7c3RyaW5nIHwgbnVsbH0gKi9cbmxldCBzZWxlY3RlZFN5bWJvbElkID0gcHJlZmVycmVkU3ltYm9sSWQ7XG4vKiogQHR5cGUgeydjZmcnfCdjYWxsX2dyYXBoJ30gKi9cbmxldCBhY3RpdmVQZXJzcGVjdGl2ZSA9IHByZWZlcnJlZFBlcnNwZWN0aXZlO1xuLyoqIEB0eXBlIHtzdHJpbmd8dW5kZWZpbmVkfSAqL1xubGV0IGNhbGxlcnNOZXh0Q3Vyc29yO1xuLyoqIEB0eXBlIHtzdHJpbmd8dW5kZWZpbmVkfSAqL1xubGV0IGNhbGxlZXNOZXh0Q3Vyc29yO1xuaWYgKHBlcnNwZWN0aXZlU2VsZWN0KSB7XG4gIHBlcnNwZWN0aXZlU2VsZWN0LnZhbHVlID0gYWN0aXZlUGVyc3BlY3RpdmU7XG59XG5cbi8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgYW55Pn0gKi9cbmxldCBzZXR0aW5ncyA9IHJlc29sdmVQcmV2aWV3U2V0dGluZ3Moe30pO1xuLyoqIEB0eXBlIHt7ZGVmYXVsdERlcHRoOiAxfDJ8M3w0LCBzaG93RXZpZGVuY2U6IGJvb2xlYW4sIGluY2x1ZGVMaW1pdGF0aW9uczogYm9vbGVhbn19ICovXG5sZXQgZXhwbGFuYXRpb25TZXR0aW5ncyA9IHJlc29sdmVFeHBsYW5hdGlvblNldHRpbmdzKHt9KTtcbi8qKiBAdHlwZSB7MXwyfDN8NH0gKi9cbmxldCBhY3RpdmVFeHBsYWluRGVwdGggPSBleHBsYW5hdGlvblNldHRpbmdzLmRlZmF1bHREZXB0aDtcbi8qKiBAdHlwZSB7c3RyaW5nfG51bGx9ICovXG5sZXQgYWN0aXZlTm9kZUlkID0gbnVsbDtcbi8qKiBAdHlwZSB7bnVtYmVyfSAqL1xubGV0IGV4cGxhaW5Ob2RlUmVxdWVzdCA9IDA7XG4vKiogQHR5cGUge251bWJlcn0gKi9cbmxldCBleHBsYWluRnVuY3Rpb25SZXF1ZXN0ID0gMDtcbi8qKiBAdHlwZSB7TWFwPHN0cmluZywgUmVjb3JkPHN0cmluZywgYW55Pj59ICovXG5jb25zdCBwcmV2aWV3Q2FjaGUgPSBuZXcgTWFwKCk7XG4vKiogQHR5cGUge01hcDxzdHJpbmcsIHN0cmluZz59ICovXG5sZXQgaW50ZWdyaXR5QnlOb2RlID0gbmV3IE1hcCgpO1xuLyoqIEB0eXBlIHtzdHJpbmd8bnVsbH0gKi9cbmxldCBwcmV2aWV3Tm9kZUlkID0gbnVsbDtcbi8qKiBAdHlwZSB7bnVtYmVyfSAqL1xubGV0IHByZXZpZXdSZXF1ZXN0ID0gMDtcbi8qKiBAdHlwZSB7e3g6IG51bWJlciwgeTogbnVtYmVyfXxudWxsfSAqL1xubGV0IHByZXZpZXdBbmNob3IgPSBudWxsO1xuXG5jb25zdCByZW5kZXJlciA9IGNyZWF0ZVN2Z1JlbmRlcmVyKHtcbiAgc3ZnLFxuICBvblNlbGVjdDogKG5vZGVJZCwgbm9kZSkgPT4ge1xuICAgIHNob3dOb2RlRGV0YWlscyhub2RlSWQsIG5vZGUpO1xuICAgIGJyaWRnZS5yZXNwb25kKCdub2RlLnNlbGVjdCcsIHsgbm9kZUlkIH0pO1xuICB9LFxuICBvbk5hdmlnYXRlOiAobm9kZUlkLCBub2RlLCB0cmlnZ2VyKSA9PiB7XG4gICAgaWYgKHRyaWdnZXIgPT09ICdwb2ludGVyJyAmJiAhc2V0dGluZ3MuY2xpY2tUb05hdmlnYXRlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZvaWQgbmF2aWdhdGVUbyhub2RlSWQsIG5vZGUpO1xuICB9LFxuICBvblByZXZpZXdFbnRlcjogKG5vZGVJZCwgX25vZGUsIHBvaW50KSA9PiB7XG4gICAgcHJldmlld0NvbnRyb2xsZXIucG9pbnRlckVudGVyKG5vZGVJZCwgcG9pbnQpO1xuICB9LFxuICBvblByZXZpZXdNb3ZlOiAocG9pbnQpID0+IHtcbiAgICBwcmV2aWV3Q29udHJvbGxlci5wb2ludGVyTW92ZShwb2ludCk7XG4gIH0sXG4gIG9uUHJldmlld0xlYXZlOiAoKSA9PiB7XG4gICAgcHJldmlld0NvbnRyb2xsZXIucG9pbnRlckxlYXZlKCk7XG4gIH0sXG4gIG9uUHJldmlld0tleTogKG5vZGVJZCkgPT4ge1xuICAgIHZvaWQgb3BlblByZXZpZXcobm9kZUlkLCBudWxsLCB0cnVlKTtcbiAgfSxcbn0pO1xuXG5jb25zdCBwcmV2aWV3Q29udHJvbGxlciA9IGNyZWF0ZVByZXZpZXdDb250cm9sbGVyKHtcbiAgZGVsYXlNczogc2V0dGluZ3MuZGVsYXlNcyxcbiAgZW5hYmxlZDogc2V0dGluZ3MuZW5hYmxlZCxcbiAgcGluQnlEZWZhdWx0OiBzZXR0aW5ncy5waW5CeURlZmF1bHQsXG4gIG9uU2hvdzogKG5vZGVJZCwgYW5jaG9yKSA9PiB7XG4gICAgc3luY1BpbkJ1dHRvbihwcmV2aWV3Q29udHJvbGxlci5pc1Bpbm5lZCgpKTtcbiAgICB2b2lkIG9wZW5QcmV2aWV3KG5vZGVJZCwgYW5jaG9yLCBmYWxzZSk7XG4gIH0sXG4gIG9uSGlkZTogKCkgPT4ge1xuICAgIGhpZGVQcmV2aWV3KCk7XG4gIH0sXG59KTtcbmlmIChzZXR0aW5ncy5waW5CeURlZmF1bHQpIHtcbiAgcHJldmlld0NvbnRyb2xsZXIuc2V0UGlubmVkKHRydWUpO1xufVxuc3luY1BpbkJ1dHRvbihzZXR0aW5ncy5waW5CeURlZmF1bHQpO1xuXG5jb25zdCBicmlkZ2UgPSBjcmVhdGVCcmlkZ2Uoe1xuICBwb3N0OiAobWVzc2FnZSkgPT4gdnNjb2RlQXBpLnBvc3RNZXNzYWdlKG1lc3NhZ2UpLFxuICBpbmJvdW5kRGlyZWN0aW9uOiBESVJFQ1RJT05TLkhPU1RfVE9fV0VCVklFVyxcbiAgdGltZW91dE1zOiA4MDAwLFxuICBsb2dnZXI6IHtcbiAgICBkZWJ1ZzogKCkgPT4ge30sXG4gICAgd2FybjogKG1lc3NhZ2UsIGZpZWxkcykgPT4gY29uc29sZS53YXJuKCdbY29kZWZsb3ddJywgbWVzc2FnZSwgZmllbGRzKSxcbiAgICBlcnJvcjogKG1lc3NhZ2UsIGZpZWxkcykgPT4gY29uc29sZS5lcnJvcignW2NvZGVmbG93XScsIG1lc3NhZ2UsIGZpZWxkcyksXG4gIH0sXG59KTtcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxuICogQHBhcmFtIHtib29sZWFufSBbaXNFcnJvcl1cbiAqL1xuZnVuY3Rpb24gc2V0QmFubmVyKG1lc3NhZ2UsIGlzRXJyb3IgPSBmYWxzZSkge1xuICBpZiAoIW1lc3NhZ2UpIHtcbiAgICBiYW5uZXIuaGlkZGVuID0gdHJ1ZTtcbiAgICBiYW5uZXIudGV4dENvbnRlbnQgPSAnJztcbiAgICByZXR1cm47XG4gIH1cbiAgYmFubmVyLmhpZGRlbiA9IGZhbHNlO1xuICBiYW5uZXIuY2xhc3NMaXN0LnRvZ2dsZSgnaXMtZXJyb3InLCBpc0Vycm9yKTtcbiAgYmFubmVyLnRleHRDb250ZW50ID0gbWVzc2FnZTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dFxuICovXG5mdW5jdGlvbiBzZXRTdGF0dXModGV4dCkge1xuICBzdGF0dXMudGV4dENvbnRlbnQgPSB0ZXh0O1xufVxuXG5mdW5jdGlvbiBjbGVhckRldGFpbCgpIHtcbiAgYWN0aXZlTm9kZUlkID0gbnVsbDtcbiAgZGV0YWlsQm9keS5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgY29uc3QgcGFyYWdyYXBoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICBwYXJhZ3JhcGguY2xhc3NOYW1lID0gJ2NmLW11dGVkJztcbiAgcGFyYWdyYXBoLnRleHRDb250ZW50ID0gJ1NlbGVjdCBhIG5vZGUgdG8gaW5zcGVjdCBpdC4nO1xuICBkZXRhaWxCb2R5LmFwcGVuZENoaWxkKHBhcmFncmFwaCk7XG4gIGNsZWFyRXhwbGFuYXRpb24oKTtcbn1cblxuZnVuY3Rpb24gY2xlYXJFeHBsYW5hdGlvbigpIHtcbiAgZXhwbGFpbk5vZGVSZXF1ZXN0ICs9IDE7XG4gIGlmIChleHBsYWluU2VjdGlvbikge1xuICAgIGV4cGxhaW5TZWN0aW9uLmhpZGRlbiA9IHRydWU7XG4gIH1cbiAgZXhwbGFpbkl0ZW1zPy5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgaWYgKGV4cGxhaW5FdmlkZW5jZSkge1xuICAgIGV4cGxhaW5FdmlkZW5jZS5oaWRkZW4gPSB0cnVlO1xuICB9XG4gIGV4cGxhaW5FdmlkZW5jZUxpc3Q/LnJlcGxhY2VDaGlsZHJlbigpO1xuICBpZiAoZXhwbGFpbkxpbWl0cykge1xuICAgIGV4cGxhaW5MaW1pdHMuaGlkZGVuID0gdHJ1ZTtcbiAgfVxuICBpZiAoZXhwbGFpbkxpbWl0c1RleHQpIHtcbiAgICBleHBsYWluTGltaXRzVGV4dC50ZXh0Q29udGVudCA9ICcnO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBwYXlsb2FkXG4gKi9cbmZ1bmN0aW9uIHJlbmRlck5vZGVFeHBsYW5hdGlvbihwYXlsb2FkKSB7XG4gIGlmICghZXhwbGFpblNlY3Rpb24gfHwgIWV4cGxhaW5JdGVtcykge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBpdGVtcyA9IEFycmF5LmlzQXJyYXkocGF5bG9hZD8uaXRlbXMpID8gcGF5bG9hZC5pdGVtcyA6IFtdO1xuICBjb25zdCBsaW1pdHMgPSBBcnJheS5pc0FycmF5KHBheWxvYWQ/LmxpbWl0YXRpb25zKSA/IHBheWxvYWQubGltaXRhdGlvbnMgOiBbXTtcbiAgZXhwbGFpbkl0ZW1zLnJlcGxhY2VDaGlsZHJlbigpO1xuICBpZiAoaXRlbXMubGVuZ3RoID09PSAwICYmIGxpbWl0cy5sZW5ndGggPT09IDApIHtcbiAgICBleHBsYWluU2VjdGlvbi5oaWRkZW4gPSB0cnVlO1xuICAgIHJldHVybjtcbiAgfVxuICBleHBsYWluU2VjdGlvbi5oaWRkZW4gPSBmYWxzZTtcblxuICBjb25zdCBldmlkZW5jZVJlZnMgPSBbXTtcbiAgZm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zKSB7XG4gICAgaWYgKGl0ZW0ucnVsZUlkID09PSAnZm4ubGltaXRhdGlvbnMnKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICAgIHJvdy5jbGFzc05hbWUgPSBgY2YtZXhwbGFpbi1pdGVtIGNmLWV4cGxhaW4tLSR7aXRlbS5jbGFpbSA/PyAnZ3JvdW5kZWQnfWA7XG4gICAgcm93LnRleHRDb250ZW50ID0gaXRlbS50ZXh0O1xuICAgIGV4cGxhaW5JdGVtcy5hcHBlbmRDaGlsZChyb3cpO1xuICAgIGZvciAoY29uc3QgcmVmIG9mIGl0ZW0uZXZpZGVuY2UgPz8gW10pIHtcbiAgICAgIGV2aWRlbmNlUmVmcy5wdXNoKHJlZik7XG4gICAgfVxuICB9XG5cbiAgaWYgKGV4cGxhaW5FdmlkZW5jZSAmJiBleHBsYWluRXZpZGVuY2VMaXN0KSB7XG4gICAgZXhwbGFpbkV2aWRlbmNlTGlzdC5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgICBjb25zdCBzZWVuID0gbmV3IFNldCgpO1xuICAgIGNvbnN0IHVuaXF1ZVJlZnMgPSBldmlkZW5jZVJlZnMuZmlsdGVyKChyZWYpID0+IHtcbiAgICAgIGNvbnN0IGtleSA9IGAke3JlZi5raW5kfToke3JlZi5pZH1gO1xuICAgICAgaWYgKHNlZW4uaGFzKGtleSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgc2Vlbi5hZGQoa2V5KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICAgIGlmIChleHBsYW5hdGlvblNldHRpbmdzLnNob3dFdmlkZW5jZSAmJiB1bmlxdWVSZWZzLmxlbmd0aCA+IDApIHtcbiAgICAgIGV4cGxhaW5FdmlkZW5jZS5oaWRkZW4gPSBmYWxzZTtcbiAgICAgIGZvciAoY29uc3QgcmVmIG9mIHVuaXF1ZVJlZnMuc2xpY2UoMCwgOCkpIHtcbiAgICAgICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgICBpZiAocmVmLnJhbmdlKSB7XG4gICAgICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgICAgICAgYnRuLnR5cGUgPSAnYnV0dG9uJztcbiAgICAgICAgICBidG4uY2xhc3NOYW1lID0gJ2NmLWV2aWRlbmNlLWxpbmsnO1xuICAgICAgICAgIGJ0bi50ZXh0Q29udGVudCA9IHJlZi5sYWJlbCB8fCBgJHtyZWYua2luZH06IGxpbmUgJHtyZWYucmFuZ2Uuc3RhcnRMaW5lICsgMX1gO1xuICAgICAgICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgIHZvaWQgbmF2aWdhdGVUb1JhbmdlKHJlZi5yYW5nZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgbGkuYXBwZW5kQ2hpbGQoYnRuKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaS50ZXh0Q29udGVudCA9IGAke3JlZi5raW5kfTogJHtyZWYubGFiZWwgfHwgcmVmLmlkfWA7XG4gICAgICAgIH1cbiAgICAgICAgZXhwbGFpbkV2aWRlbmNlTGlzdC5hcHBlbmRDaGlsZChsaSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4cGxhaW5FdmlkZW5jZS5oaWRkZW4gPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGlmIChleHBsYWluTGltaXRzICYmIGV4cGxhaW5MaW1pdHNUZXh0KSB7XG4gICAgaWYgKGxpbWl0cy5sZW5ndGggPiAwKSB7XG4gICAgICBleHBsYWluTGltaXRzLmhpZGRlbiA9IGZhbHNlO1xuICAgICAgZXhwbGFpbkxpbWl0cy5vcGVuID0gZXhwbGFuYXRpb25TZXR0aW5ncy5pbmNsdWRlTGltaXRhdGlvbnM7XG4gICAgICBleHBsYWluTGltaXRzVGV4dC50ZXh0Q29udGVudCA9IGxpbWl0cy5qb2luKCcgJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4cGxhaW5MaW1pdHMuaGlkZGVuID0gdHJ1ZTtcbiAgICAgIGV4cGxhaW5MaW1pdHNUZXh0LnRleHRDb250ZW50ID0gJyc7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSByYW5nZVxuICovXG5hc3luYyBmdW5jdGlvbiBuYXZpZ2F0ZVRvUmFuZ2UocmFuZ2UpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyaWRnZS5yZXF1ZXN0KCduYXZpZ2F0ZS50bycsIHtcbiAgICAgIGZpbGVJZDogcmFuZ2UuZmlsZUlkLFxuICAgICAgcmFuZ2UsXG4gICAgfSk7XG4gICAgaWYgKHJlc3BvbnNlLnBheWxvYWQub2sgIT09IHRydWUpIHtcbiAgICAgIHNldEJhbm5lcihcbiAgICAgICAgYCR7cmVzcG9uc2UucGF5bG9hZC5jb2RlID8/ICdFX05BVklHQVRJT04nfTogJHtyZXNwb25zZS5wYXlsb2FkLm1lc3NhZ2UgPz8gJ0NvdWxkIG5vdCBvcGVuIHNvdXJjZS4nfWAsXG4gICAgICAgIHRydWUsXG4gICAgICApO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBzZXRCYW5uZXIoYENvdWxkIG5vdCBvcGVuIHNvdXJjZTogJHtlcnJvcj8ubWVzc2FnZSA/PyBTdHJpbmcoZXJyb3IpfWAsIHRydWUpO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZFxuICovXG5hc3luYyBmdW5jdGlvbiBsb2FkTm9kZUV4cGxhbmF0aW9uKG5vZGVJZCkge1xuICBpZiAoIWN1cnJlbnREdG8gfHwgY3VycmVudER0by5kdG9LaW5kICE9PSAnY2ZnJyB8fCAhZXhwbGFpblNlY3Rpb24pIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgcmVxdWVzdCA9ICsrZXhwbGFpbk5vZGVSZXF1ZXN0O1xuICBjb25zdCBza2VsZXRvblRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgaWYgKHJlcXVlc3QgPT09IGV4cGxhaW5Ob2RlUmVxdWVzdCAmJiBleHBsYWluU2VjdGlvbiAmJiBleHBsYWluSXRlbXMpIHtcbiAgICAgIGV4cGxhaW5TZWN0aW9uLmhpZGRlbiA9IGZhbHNlO1xuICAgICAgZXhwbGFpbkl0ZW1zLnRleHRDb250ZW50ID0gJ0dlbmVyYXRpbmcgZXhwbGFuYXRpb25cdTIwMjYnO1xuICAgIH1cbiAgfSwgMTAwKTtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyaWRnZS5yZXF1ZXN0KCdleHBsYWluLm5vZGUnLCB7XG4gICAgICBub2RlSWQsXG4gICAgICBkZXB0aDogYWN0aXZlRXhwbGFpbkRlcHRoLFxuICAgIH0pO1xuICAgIGNsZWFyVGltZW91dChza2VsZXRvblRpbWVyKTtcbiAgICBpZiAocmVxdWVzdCAhPT0gZXhwbGFpbk5vZGVSZXF1ZXN0IHx8IGFjdGl2ZU5vZGVJZCAhPT0gbm9kZUlkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJlbmRlck5vZGVFeHBsYW5hdGlvbihyZXNwb25zZS5wYXlsb2FkKTtcbiAgfSBjYXRjaCB7XG4gICAgY2xlYXJUaW1lb3V0KHNrZWxldG9uVGltZXIpO1xuICAgIGlmIChyZXF1ZXN0ID09PSBleHBsYWluTm9kZVJlcXVlc3QpIHtcbiAgICAgIGNsZWFyRXhwbGFuYXRpb24oKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge2ltcG9ydCgnLi4vY29yZS9ncmFwaC9kdG8uanMnKS5HcmFwaER0b30gZHRvXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGxvYWRGdW5jdGlvblN1bW1hcnkoZHRvKSB7XG4gIGlmICghZm5TdW1tYXJ5KSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChkdG8uZHRvS2luZCAhPT0gJ2NmZycpIHtcbiAgICBmblN1bW1hcnkuaGlkZGVuID0gdHJ1ZTtcbiAgICBmblN1bW1hcnkudGV4dENvbnRlbnQgPSAnJztcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgcmVxdWVzdCA9ICsrZXhwbGFpbkZ1bmN0aW9uUmVxdWVzdDtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyaWRnZS5yZXF1ZXN0KCdleHBsYWluLmZ1bmN0aW9uJywge1xuICAgICAgZGVwdGg6IGFjdGl2ZUV4cGxhaW5EZXB0aCxcbiAgICB9KTtcbiAgICBpZiAocmVxdWVzdCAhPT0gZXhwbGFpbkZ1bmN0aW9uUmVxdWVzdCB8fCBjdXJyZW50RHRvICE9PSBkdG8pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdGV4dCA9IFtyZXNwb25zZS5wYXlsb2FkPy5zdW1tYXJ5LCAuLi4ocmVzcG9uc2UucGF5bG9hZD8ubGltaXRhdGlvbnMgPz8gW10pXVxuICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgLmpvaW4oJyAnKTtcbiAgICBpZiAodGV4dCkge1xuICAgICAgZm5TdW1tYXJ5LnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgIGZuU3VtbWFyeS5oaWRkZW4gPSBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm5TdW1tYXJ5LmhpZGRlbiA9IHRydWU7XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICBpZiAocmVxdWVzdCA9PT0gZXhwbGFpbkZ1bmN0aW9uUmVxdWVzdCkge1xuICAgICAgZm5TdW1tYXJ5LmhpZGRlbiA9IHRydWU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGxhYmVsXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAqIEByZXR1cm5zIHtbSFRNTEVsZW1lbnQsIEhUTUxFbGVtZW50XX1cbiAqL1xuZnVuY3Rpb24gZGV0YWlsUGFpcihsYWJlbCwgdmFsdWUpIHtcbiAgY29uc3QgdGVybSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2R0Jyk7XG4gIHRlcm0udGV4dENvbnRlbnQgPSBsYWJlbDtcbiAgY29uc3QgZGVzY3JpcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkZCcpO1xuICBkZXNjcmlwdGlvbi50ZXh0Q29udGVudCA9IHZhbHVlO1xuICByZXR1cm4gW3Rlcm0sIGRlc2NyaXB0aW9uXTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkXG4gKiBAcGFyYW0ge2ltcG9ydCgnLi4vY29yZS9ncmFwaC9kdG8uanMnKS5EdG9Ob2RlfSBbbm9kZV1cbiAqL1xuZnVuY3Rpb24gc2hvd05vZGVEZXRhaWxzKG5vZGVJZCwgbm9kZSkge1xuICBpZiAoIW5vZGVJZCB8fCAhbm9kZSkge1xuICAgIGNsZWFyRGV0YWlsKCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGFjdGl2ZU5vZGVJZCA9IG5vZGVJZDtcbiAgY29uc3QgbGlzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RsJyk7XG4gIGxpc3QuYXBwZW5kKC4uLmRldGFpbFBhaXIoJ2xhYmVsJywgbm9kZS5sYWJlbCkpO1xuICBsaXN0LmFwcGVuZCguLi5kZXRhaWxQYWlyKCdraW5kJywgbm9kZS5raW5kKSk7XG4gIGxpc3QuYXBwZW5kKC4uLmRldGFpbFBhaXIoJ3N0YXR1cycsIG5vZGUuc3RhdHVzKSk7XG4gIGlmIChub2RlLmV4dGVybmFsKSB7XG4gICAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcignb3JpZ2luJywgJ2V4dGVybmFsIHRhcmdldCAobm90IGRlY2xhcmVkIGluIHRoZSBhbmFseXNpcyknKSk7XG4gIH1cbiAgaWYgKG5vZGUucmFuZ2UpIHtcbiAgICBsaXN0LmFwcGVuZCguLi5kZXRhaWxQYWlyKCdsaW5lcycsIGAke25vZGUucmFuZ2Uuc3RhcnRMaW5lICsgMX1cdTIwMTMke25vZGUucmFuZ2UuZW5kTGluZSArIDF9YCkpO1xuICAgIGxpc3QuYXBwZW5kKC4uLmRldGFpbFBhaXIoJ2ZpbGUnLCBub2RlLnJhbmdlLmZpbGVJZCkpO1xuICB9XG4gIGlmIChub2RlLmJhZGdlKSB7XG4gICAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcignbm90ZScsIG5vZGUuYmFkZ2UpKTtcbiAgfVxuICBpZiAobm9kZS5pc1N5bnRoZXRpYykge1xuICAgIGxpc3QuYXBwZW5kKC4uLmRldGFpbFBhaXIoJ29yaWdpbicsICdzeW50aGV0aWMgc3RydWN0dXJhbCBub2RlJykpO1xuICB9XG4gIGlmIChub2RlLnVucmVhY2hhYmxlKSB7XG4gICAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcigncmVhY2hhYmlsaXR5JywgJ25vdCByZWFjaGFibGUgZnJvbSBlbnRyeScpKTtcbiAgfVxuICBpZiAobm9kZS5yZWFzb25Db2RlKSB7XG4gICAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcigncmVhc29uJywgbm9kZS5yZWFzb25Db2RlKSk7XG4gIH1cbiAgaWYgKEFycmF5LmlzQXJyYXkobm9kZS5jYWxscykgJiYgbm9kZS5jYWxscy5sZW5ndGggPiAwKSB7XG4gICAgbGlzdC5hcHBlbmQoXG4gICAgICAuLi5kZXRhaWxQYWlyKCdjYWxscycsIG5vZGUuY2FsbHMubWFwKChjYWxsKSA9PiBgJHtjYWxsLmxhYmVsfSAoJHtjYWxsLnN0YXR1c30pYCkuam9pbignLCAnKSksXG4gICAgKTtcbiAgfVxuXG4gIGNvbnN0IGVkZ2VzID0gKGN1cnJlbnREdG8/LmVkZ2VzID8/IFtdKS5maWx0ZXIoXG4gICAgKGVkZ2UpID0+IGVkZ2UuZnJvbSA9PT0gbm9kZUlkIHx8IGVkZ2UudG8gPT09IG5vZGVJZCxcbiAgKTtcbiAgaWYgKGVkZ2VzLmxlbmd0aCA+IDApIHtcbiAgICBsaXN0LmFwcGVuZCguLi5kZXRhaWxQYWlyKCdyZWxhdGlvbnNoaXBzJywgU3RyaW5nKGVkZ2VzLmxlbmd0aCkpKTtcbiAgfVxuXG4gIGRldGFpbEJvZHkucmVwbGFjZUNoaWxkcmVuKGxpc3QpO1xuXG4gIGlmIChlZGdlcy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgaGVhZGluZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gzJyk7XG4gICAgaGVhZGluZy5jbGFzc05hbWUgPSAnY2YtZGV0YWlsLXRpdGxlJztcbiAgICBoZWFkaW5nLnRleHRDb250ZW50ID0gJ1JlbGF0aW9uc2hpcHMnO1xuICAgIGRldGFpbEJvZHkuYXBwZW5kQ2hpbGQoaGVhZGluZyk7XG5cbiAgICBjb25zdCBlZGdlTGlzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3VsJyk7XG4gICAgZWRnZUxpc3QuY2xhc3NOYW1lID0gJ2NmLWxlZ2VuZCc7XG4gICAgZm9yIChjb25zdCBlZGdlIG9mIGVkZ2VzLnNsaWNlKDAsIDEyKSkge1xuICAgICAgY29uc3QgaXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICBjb25zdCBkaXJlY3Rpb24gPSBlZGdlLmZyb20gPT09IG5vZGVJZCA/ICdcdTIxOTInIDogJ1x1MjE5MCc7XG4gICAgICBjb25zdCBvdGhlciA9IGVkZ2UuZnJvbSA9PT0gbm9kZUlkID8gZWRnZS50byA6IGVkZ2UuZnJvbTtcbiAgICAgIGl0ZW0udGV4dENvbnRlbnQgPSBgJHtkaXJlY3Rpb259ICR7ZWRnZS50eXBlfSBcdTAwQjcgJHtvdGhlcn0gKCR7ZWRnZS5zdGF0dXN9KWA7XG4gICAgICBlZGdlTGlzdC5hcHBlbmRDaGlsZChpdGVtKTtcbiAgICB9XG4gICAgZGV0YWlsQm9keS5hcHBlbmRDaGlsZChlZGdlTGlzdCk7XG4gIH1cblxuICB2b2lkIGxvYWROb2RlRXhwbGFuYXRpb24obm9kZUlkKTtcbiAgc3luY0NhbGxOb2RlQnV0dG9ucyhub2RlKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT58dW5kZWZpbmVkfSBub2RlXG4gKi9cbmZ1bmN0aW9uIHN5bmNDYWxsTm9kZUJ1dHRvbnMobm9kZSkge1xuICBpZiAoIWNhbGxzRXhwYW5kQnRuIHx8ICFjYWxsc0NvbGxhcHNlQnRuIHx8ICFjYWxsc0ZvY3VzQnRuKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGlzQ2FsbEdyYXBoID0gY3VycmVudER0bz8uZHRvS2luZCA9PT0gJ2NhbGxfZ3JhcGgnO1xuICBpZiAoIWlzQ2FsbEdyYXBoIHx8ICFub2RlIHx8IG5vZGUua2luZCA9PT0gJ3VucmVzb2x2ZWRfYnVja2V0Jykge1xuICAgIGNhbGxzRXhwYW5kQnRuLmRpc2FibGVkID0gdHJ1ZTtcbiAgICBjYWxsc0NvbGxhcHNlQnRuLmRpc2FibGVkID0gdHJ1ZTtcbiAgICByZXR1cm47XG4gIH1cbiAgY2FsbHNFeHBhbmRCdG4uZGlzYWJsZWQgPSBCb29sZWFuKG5vZGUuZXhwYW5kZWQpO1xuICBjYWxsc0NvbGxhcHNlQnRuLmRpc2FibGVkID0gIW5vZGUuZXhwYW5kZWQgfHwgQm9vbGVhbihub2RlLmlzQ2VudGVyKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IGR0b1xuICovXG5hc3luYyBmdW5jdGlvbiB1cGRhdGVDYWxsR3JhcGhTaWRlUGFuZWwoZHRvKSB7XG4gIGlmICghY2FsbHNQYW5lbCkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoZHRvLmR0b0tpbmQgIT09ICdjYWxsX2dyYXBoJykge1xuICAgIGNhbGxzUGFuZWwuaGlkZGVuID0gdHJ1ZTtcbiAgICBpZiAoc2NvcGVCYW5uZXIpIHtcbiAgICAgIHNjb3BlQmFubmVyLmhpZGRlbiA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybjtcbiAgfVxuICBjYWxsc1BhbmVsLmhpZGRlbiA9IGZhbHNlO1xuICBpZiAoc2NvcGVCYW5uZXIpIHtcbiAgICBzY29wZUJhbm5lci50ZXh0Q29udGVudCA9IGR0by5zY29wZUJhbm5lciB8fCAnJztcbiAgICBzY29wZUJhbm5lci5oaWRkZW4gPSAhZHRvLnNjb3BlQmFubmVyO1xuICB9XG4gIGlmIChjYWxsc0ZvY3VzQnRuKSB7XG4gICAgY29uc3QgZm9jdXNlZCA9IEJvb2xlYW4oZHRvLmZvY3VzZWROb2RlSWQpO1xuICAgIGNhbGxzRm9jdXNCdG4uc2V0QXR0cmlidXRlKCdhcmlhLXByZXNzZWQnLCBmb2N1c2VkID8gJ3RydWUnIDogJ2ZhbHNlJyk7XG4gICAgY2FsbHNGb2N1c0J0bi50ZXh0Q29udGVudCA9IGZvY3VzZWQgPyAnVW5mb2N1cycgOiAnRm9jdXMnO1xuICB9XG5cbiAgaWYgKHVucmVzb2x2ZWRCdWNrZXREZXRhaWxzICYmIHVucmVzb2x2ZWRTdW1tYXJ5ICYmIHVucmVzb2x2ZWRMaXN0KSB7XG4gICAgY29uc3QgYnVja2V0ID0gZHRvLnVucmVzb2x2ZWRCdWNrZXQ7XG4gICAgaWYgKGJ1Y2tldCAmJiBidWNrZXQuY291bnQgPiAwKSB7XG4gICAgICB1bnJlc29sdmVkQnVja2V0RGV0YWlscy5oaWRkZW4gPSBmYWxzZTtcbiAgICAgIHVucmVzb2x2ZWRTdW1tYXJ5LnRleHRDb250ZW50ID0gYCR7YnVja2V0LmNvdW50fSB1bnJlc29sdmVkIHRhcmdldCR7YnVja2V0LmNvdW50ID09PSAxID8gJycgOiAncyd9YDtcbiAgICAgIHVucmVzb2x2ZWRMaXN0LnJlcGxhY2VDaGlsZHJlbigpO1xuICAgICAgZm9yIChjb25zdCByZWFzb24gb2YgYnVja2V0LnJlYXNvbnMgPz8gW10pIHtcbiAgICAgICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgICBsaS50ZXh0Q29udGVudCA9IGAke3JlYXNvbi5yZWFzb25Db2RlfTogJHtyZWFzb24uY291bnR9IHNpdGUke3JlYXNvbi5jb3VudCA9PT0gMSA/ICcnIDogJ3MnfWA7XG4gICAgICAgIHVucmVzb2x2ZWRMaXN0LmFwcGVuZENoaWxkKGxpKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdW5yZXNvbHZlZEJ1Y2tldERldGFpbHMuaGlkZGVuID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAoZHRvLmNlbnRlclN5bWJvbElkKSB7XG4gICAgY2FsbGVyc05leHRDdXJzb3IgPSB1bmRlZmluZWQ7XG4gICAgY2FsbGVlc05leHRDdXJzb3IgPSB1bmRlZmluZWQ7XG4gICAgY2FsbGVyc0xpc3Q/LnJlcGxhY2VDaGlsZHJlbigpO1xuICAgIGNhbGxlZXNMaXN0Py5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgICBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICBsb2FkTmVpZ2hib3JQYWdlKCdpbmNvbWluZycsIGR0by5jZW50ZXJTeW1ib2xJZCwgZmFsc2UpLFxuICAgICAgbG9hZE5laWdoYm9yUGFnZSgnb3V0Z29pbmcnLCBkdG8uY2VudGVyU3ltYm9sSWQsIGZhbHNlKSxcbiAgICBdKTtcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7J2luY29taW5nJ3wnb3V0Z29pbmcnfSBkaXJlY3Rpb25cbiAqIEBwYXJhbSB7c3RyaW5nfSBzeW1ib2xJZFxuICogQHBhcmFtIHtib29sZWFufSBhcHBlbmRcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZE5laWdoYm9yUGFnZShkaXJlY3Rpb24sIHN5bWJvbElkLCBhcHBlbmQpIHtcbiAgY29uc3Qga2luZCA9IGRpcmVjdGlvbiA9PT0gJ2luY29taW5nJyA/ICdjYWxscy5pbmNvbWluZycgOiAnY2FsbHMub3V0Z29pbmcnO1xuICBjb25zdCBjdXJzb3IgPSBkaXJlY3Rpb24gPT09ICdpbmNvbWluZycgPyBjYWxsZXJzTmV4dEN1cnNvciA6IGNhbGxlZXNOZXh0Q3Vyc29yO1xuICBjb25zdCBsaXN0RWwgPSBkaXJlY3Rpb24gPT09ICdpbmNvbWluZycgPyBjYWxsZXJzTGlzdCA6IGNhbGxlZXNMaXN0O1xuICBjb25zdCBoZWFkaW5nRWwgPSBkaXJlY3Rpb24gPT09ICdpbmNvbWluZycgPyBjYWxsZXJzSGVhZGluZyA6IGNhbGxlZXNIZWFkaW5nO1xuICBjb25zdCBtb3JlQnRuID0gZGlyZWN0aW9uID09PSAnaW5jb21pbmcnID8gY2FsbGVyc01vcmVCdG4gOiBjYWxsZWVzTW9yZUJ0bjtcbiAgaWYgKCFsaXN0RWwpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyaWRnZS5yZXF1ZXN0KGtpbmQsIHtcbiAgICAgIHN5bWJvbElkLFxuICAgICAgbGltaXQ6IDUwLFxuICAgICAgLi4uKGFwcGVuZCAmJiBjdXJzb3IgPyB7IGN1cnNvciB9IDoge30pLFxuICAgIH0pO1xuICAgIGNvbnN0IHBheWxvYWQgPSByZXNwb25zZS5wYXlsb2FkID8/IHt9O1xuICAgIGlmICghYXBwZW5kKSB7XG4gICAgICBsaXN0RWwucmVwbGFjZUNoaWxkcmVuKCk7XG4gICAgfVxuICAgIGlmIChoZWFkaW5nRWwpIHtcbiAgICAgIGhlYWRpbmdFbC50ZXh0Q29udGVudCA9XG4gICAgICAgIGRpcmVjdGlvbiA9PT0gJ2luY29taW5nJ1xuICAgICAgICAgID8gYENhbGxlcnMgKCR7cGF5bG9hZC50b3RhbCA/PyAwfSlgXG4gICAgICAgICAgOiBgQ2FsbGVlcyAoJHtwYXlsb2FkLnRvdGFsID8/IDB9KWA7XG4gICAgfVxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBwYXlsb2FkLml0ZW1zID8/IFtdKSB7XG4gICAgICBjb25zdCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgICAgIGJ0bi50eXBlID0gJ2J1dHRvbic7XG4gICAgICBidG4uY2xhc3NOYW1lID0gJ2NmLWV2aWRlbmNlLWxpbmsnO1xuICAgICAgYnRuLnRleHRDb250ZW50ID0gYCR7aXRlbS5kaXNwbGF5TmFtZX0gKCR7aXRlbS5zdGF0dXN9JHtpdGVtLmNhbGxTaXRlQ291bnQgPiAxID8gYCBcdTAwRDcke2l0ZW0uY2FsbFNpdGVDb3VudH1gIDogJyd9KWA7XG4gICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIHJlbmRlcmVyLnNlbGVjdChpdGVtLnN5bWJvbElkKTtcbiAgICAgIH0pO1xuICAgICAgbGkuYXBwZW5kQ2hpbGQoYnRuKTtcbiAgICAgIGxpc3RFbC5hcHBlbmRDaGlsZChsaSk7XG4gICAgfVxuICAgIGlmIChkaXJlY3Rpb24gPT09ICdpbmNvbWluZycpIHtcbiAgICAgIGNhbGxlcnNOZXh0Q3Vyc29yID0gcGF5bG9hZC5uZXh0Q3Vyc29yO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYWxsZWVzTmV4dEN1cnNvciA9IHBheWxvYWQubmV4dEN1cnNvcjtcbiAgICB9XG4gICAgaWYgKG1vcmVCdG4pIHtcbiAgICAgIG1vcmVCdG4uaGlkZGVuID0gIXBheWxvYWQubmV4dEN1cnNvcjtcbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIGlmIChtb3JlQnRuKSB7XG4gICAgICBtb3JlQnRuLmhpZGRlbiA9IHRydWU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBuZXh0XG4gKi9cbmZ1bmN0aW9uIGFwcGx5U2V0dGluZ3MobmV4dCkge1xuICBjb25zdCBwcmV2aW91c01heExpbmVzID0gc2V0dGluZ3MubWF4TGluZXM7XG4gIHNldHRpbmdzID0gcmVzb2x2ZVByZXZpZXdTZXR0aW5ncyh7IC4uLnNldHRpbmdzLCAuLi5uZXh0IH0pO1xuICBpZiAobmV4dD8uZXhwbGFuYXRpb24gJiYgdHlwZW9mIG5leHQuZXhwbGFuYXRpb24gPT09ICdvYmplY3QnKSB7XG4gICAgZXhwbGFuYXRpb25TZXR0aW5ncyA9IHJlc29sdmVFeHBsYW5hdGlvblNldHRpbmdzKG5leHQuZXhwbGFuYXRpb24pO1xuICAgIGFjdGl2ZUV4cGxhaW5EZXB0aCA9IGV4cGxhbmF0aW9uU2V0dGluZ3MuZGVmYXVsdERlcHRoO1xuICAgIGlmIChleHBsYWluRGVwdGhTZWxlY3QpIHtcbiAgICAgIGV4cGxhaW5EZXB0aFNlbGVjdC52YWx1ZSA9IFN0cmluZyhhY3RpdmVFeHBsYWluRGVwdGgpO1xuICAgIH1cbiAgICBpZiAoYWN0aXZlTm9kZUlkKSB7XG4gICAgICB2b2lkIGxvYWROb2RlRXhwbGFuYXRpb24oYWN0aXZlTm9kZUlkKTtcbiAgICB9XG4gICAgaWYgKGN1cnJlbnREdG8/LmR0b0tpbmQgPT09ICdjZmcnKSB7XG4gICAgICB2b2lkIGxvYWRGdW5jdGlvblN1bW1hcnkoY3VycmVudER0byk7XG4gICAgfVxuICB9XG4gIHByZXZpZXdDb250cm9sbGVyLmNvbmZpZ3VyZSh7XG4gICAgZGVsYXlNczogc2V0dGluZ3MuZGVsYXlNcyxcbiAgICBlbmFibGVkOiBzZXR0aW5ncy5lbmFibGVkLFxuICAgIHBpbkJ5RGVmYXVsdDogc2V0dGluZ3MucGluQnlEZWZhdWx0LFxuICB9KTtcbiAgaWYgKHNldHRpbmdzLm1heExpbmVzICE9PSBwcmV2aW91c01heExpbmVzKSB7XG4gICAgcHJldmlld0NhY2hlLmNsZWFyKCk7XG4gIH1cbiAgaWYgKCFzZXR0aW5ncy5lbmFibGVkKSB7XG4gICAgcHJldmlld0NvbnRyb2xsZXIuZGlzbWlzcygpO1xuICAgIGhpZGVQcmV2aWV3KCk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHBpbm5lZFxuICovXG5mdW5jdGlvbiBzeW5jUGluQnV0dG9uKHBpbm5lZCkge1xuICBwcmV2aWV3UGluLnNldEF0dHJpYnV0ZSgnYXJpYS1wcmVzc2VkJywgcGlubmVkID8gJ3RydWUnIDogJ2ZhbHNlJyk7XG4gIHByZXZpZXdQaW4udGV4dENvbnRlbnQgPSBwaW5uZWQgPyAnUGlubmVkJyA6ICdQaW4nO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWRcbiAqIEByZXR1cm5zIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fG51bGx9XG4gKi9cbmZ1bmN0aW9uIG5vZGVCeUlkKG5vZGVJZCkge1xuICByZXR1cm4gY3VycmVudER0bz8ubm9kZXMuZmluZCgobm9kZSkgPT4gbm9kZS5pZCA9PT0gbm9kZUlkKSA/PyBudWxsO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7e3g6IG51bWJlciwgeTogbnVtYmVyfXxudWxsfSBhbmNob3JcbiAqL1xuZnVuY3Rpb24gcG9zaXRpb25QcmV2aWV3KGFuY2hvcikge1xuICBjb25zdCB3cmFwID0gc3ZnLnBhcmVudEVsZW1lbnQ/LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICBpZiAoIXdyYXApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgcG9pbnQgPSBhbmNob3IgPz8ge1xuICAgIHg6IHdyYXAubGVmdCArIDI0LFxuICAgIHk6IHdyYXAudG9wICsgNzIsXG4gIH07XG4gIGNvbnN0IHdpZHRoID0gTWF0aC5taW4oMzgwLCBNYXRoLm1heCgyNjAsIHdyYXAud2lkdGggLSAzMikpO1xuICBjb25zdCBtYXhMZWZ0ID0gTWF0aC5tYXgoOCwgd3JhcC53aWR0aCAtIHdpZHRoIC0gOCk7XG4gIGNvbnN0IGxlZnQgPSBNYXRoLm1heCg4LCBNYXRoLm1pbihtYXhMZWZ0LCBwb2ludC54IC0gd3JhcC5sZWZ0ICsgMTQpKTtcbiAgY29uc3QgdG9wID0gTWF0aC5tYXgoOCwgTWF0aC5taW4oTWF0aC5tYXgoOCwgd3JhcC5oZWlnaHQgLSAyMjApLCBwb2ludC55IC0gd3JhcC50b3AgKyAxNCkpO1xuICBwcmV2aWV3LnN0eWxlLndpZHRoID0gYCR7d2lkdGh9cHhgO1xuICBwcmV2aWV3LnN0eWxlLmxlZnQgPSBgJHtsZWZ0fXB4YDtcbiAgcHJldmlldy5zdHlsZS50b3AgPSBgJHt0b3B9cHhgO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gbm9kZVxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fG51bGx9IHNsaWNlXG4gKi9cbmZ1bmN0aW9uIHJlbmRlclByZXZpZXdDYXJkKG5vZGUsIHNsaWNlKSB7XG4gIGNvbnN0IG1vZGVsID0gYnVpbGRQcmV2aWV3TW9kZWwoe1xuICAgIG5vZGUsXG4gICAgc2xpY2UsXG4gICAgbWF4TGluZXM6IHNldHRpbmdzLm1heExpbmVzLFxuICB9KTtcbiAgcHJldmlld1RpdGxlLnRleHRDb250ZW50ID0gYCR7bW9kZWwua2luZH0gXHUwMEI3ICR7bW9kZWwudGl0bGV9YDtcbiAgcHJldmlld01ldGEudGV4dENvbnRlbnQgPSBbXG4gICAgbW9kZWwuZmlsZSxcbiAgICBgbGluZXMgJHttb2RlbC5saW5lTGFiZWx9YCxcbiAgICBtb2RlbC5pbnRlZ3JpdHkgIT09ICdleGFjdCdcbiAgICAgID8gbW9kZWwuaW50ZWdyaXR5XG4gICAgICA6IG1vZGVsLmRvY3VtZW50VmVyc2lvblxuICAgICAgICA/IGB2JHttb2RlbC5kb2N1bWVudFZlcnNpb259YFxuICAgICAgICA6ICcnLFxuICBdXG4gICAgLmZpbHRlcihCb29sZWFuKVxuICAgIC5qb2luKCcgXHUwMEI3ICcpO1xuICBwcmV2aWV3Qm9keS5yZXBsYWNlQ2hpbGRyZW4oKTtcblxuICBpZiAoIW1vZGVsLnN5bnRoZXRpYyAmJiAhbW9kZWwuZW1wdHkpIHtcbiAgICBjb25zdCBsYW5ndWFnZSA9XG4gICAgICB0eXBlb2Ygc2xpY2U/Lmxhbmd1YWdlSWQgPT09ICdzdHJpbmcnID8gc2xpY2UubGFuZ3VhZ2VJZCA6IChub2RlLnJhbmdlPy5maWxlSWQgPz8gJycpO1xuICAgIGNvbnN0IHJlbmRlcmVkID0gc2V0dGluZ3Muc3ludGF4SGlnaGxpZ2h0aW5nXG4gICAgICA/IGhpZ2hsaWdodExpbmVzKG1vZGVsLnRleHQsIGxhbmd1YWdlKVxuICAgICAgOiBoaWdobGlnaHRMaW5lcyhtb2RlbC50ZXh0LCAnJyk7XG4gICAgY29uc3QgZmlyc3RMaW5lID0gTnVtYmVyKHNsaWNlPy5saW5lcz8uc3RhcnRMaW5lID8/IG5vZGUucmFuZ2U/LnN0YXJ0TGluZSA/PyAwKSArIDE7XG4gICAgY29uc3QgY29kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGNvZGUuY2xhc3NOYW1lID0gJ2NmLXByZXZpZXctY29kZSc7XG4gICAgZm9yIChjb25zdCBbaW5kZXgsIHRva2Vuc10gb2YgcmVuZGVyZWQubGluZXMuZW50cmllcygpKSB7XG4gICAgICBjb25zdCBsaW5lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBsaW5lLmNsYXNzTmFtZSA9ICdjZi1wcmV2aWV3LWxpbmUnO1xuICAgICAgY29uc3QgbnVtYmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgbnVtYmVyLmNsYXNzTmFtZSA9ICdjZi1wcmV2aWV3LWxpbmUtbnVtYmVyJztcbiAgICAgIG51bWJlci50ZXh0Q29udGVudCA9IFN0cmluZyhmaXJzdExpbmUgKyBpbmRleCk7XG4gICAgICBjb25zdCBjb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgY29udGVudC5jbGFzc05hbWUgPSAnY2YtcHJldmlldy1saW5lLXRleHQnO1xuICAgICAgZm9yIChjb25zdCB0b2tlbiBvZiB0b2tlbnMpIHtcbiAgICAgICAgY29uc3Qgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgaWYgKHRva2VuLmNsYXNzTmFtZSkge1xuICAgICAgICAgIHNwYW4uY2xhc3NOYW1lID0gdG9rZW4uY2xhc3NOYW1lO1xuICAgICAgICB9XG4gICAgICAgIHNwYW4udGV4dENvbnRlbnQgPSB0b2tlbi50ZXh0O1xuICAgICAgICBjb250ZW50LmFwcGVuZENoaWxkKHNwYW4pO1xuICAgICAgfVxuICAgICAgbGluZS5hcHBlbmQobnVtYmVyLCBjb250ZW50KTtcbiAgICAgIGNvZGUuYXBwZW5kQ2hpbGQobGluZSk7XG4gICAgfVxuICAgIHByZXZpZXdCb2R5LmFwcGVuZENoaWxkKGNvZGUpO1xuICAgIGlmIChyZW5kZXJlZC5kZWdyYWRlZCkge1xuICAgICAgcHJldmlld0JvZHkuY2xhc3NMaXN0LmFkZCgnaXMtcGxhaW4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJldmlld0JvZHkuY2xhc3NMaXN0LnJlbW92ZSgnaXMtcGxhaW4nKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBub3RlcyA9IFtdO1xuICBpZiAobW9kZWwubWVzc2FnZSkge1xuICAgIG5vdGVzLnB1c2gobW9kZWwubWVzc2FnZSk7XG4gIH1cbiAgaWYgKG1vZGVsLnRydW5jYXRlZCkge1xuICAgIG5vdGVzLnB1c2goYFByZXZpZXcgdHJ1bmNhdGVkIHRvICR7c2V0dGluZ3MubWF4TGluZXN9IGxpbmVzLmApO1xuICB9XG4gIHByZXZpZXdOb3RlLnRleHRDb250ZW50ID0gbm90ZXMuam9pbignICcpO1xuICBjb25zdCBjYW5PcGVuID0gIW1vZGVsLnN5bnRoZXRpYyAmJiAhbW9kZWwuZW1wdHkgJiYgbW9kZWwuaW50ZWdyaXR5ID09PSAnZXhhY3QnO1xuICBwcmV2aWV3Qm9keS5jbGFzc0xpc3QudG9nZ2xlKCdpcy1jbGlja2FibGUnLCBCb29sZWFuKHNldHRpbmdzLmNsaWNrVG9OYXZpZ2F0ZSAmJiBjYW5PcGVuKSk7XG4gIHByZXZpZXdPcGVuLmRpc2FibGVkID0gIWNhbk9wZW47XG4gIHByZXZpZXcuY2xhc3NMaXN0LnRvZ2dsZSgnaXMtc3RhbGUnLCBtb2RlbC5zdGFsZSk7XG4gIHByZXZpZXcuY2xhc3NMaXN0LnRvZ2dsZSgnaXMtc3ludGhldGljJywgbW9kZWwuc3ludGhldGljKTtcbiAgcHJldmlldy5oaWRkZW4gPSBmYWxzZTtcbiAgcG9zaXRpb25QcmV2aWV3KHByZXZpZXdBbmNob3IpO1xufVxuXG5mdW5jdGlvbiBoaWRlUHJldmlldygpIHtcbiAgcHJldmlld1JlcXVlc3QgKz0gMTtcbiAgcHJldmlld05vZGVJZCA9IG51bGw7XG4gIHByZXZpZXdBbmNob3IgPSBudWxsO1xuICBwcmV2aWV3LmhpZGRlbiA9IHRydWU7XG4gIGlmIChwcmV2aWV3RXhwbGFpbikge1xuICAgIHByZXZpZXdFeHBsYWluLmhpZGRlbiA9IHRydWU7XG4gICAgcHJldmlld0V4cGxhaW4udGV4dENvbnRlbnQgPSAnJztcbiAgfVxuICBwcmV2aWV3Qm9keS5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgcHJldmlld05vdGUudGV4dENvbnRlbnQgPSAnJztcbiAgc3luY1BpbkJ1dHRvbihmYWxzZSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZFxuICogQHBhcmFtIHt7eDogbnVtYmVyLCB5OiBudW1iZXJ9fG51bGx9IFthbmNob3JdXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtwaW5dXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIG9wZW5QcmV2aWV3KG5vZGVJZCwgYW5jaG9yID0gbnVsbCwgcGluID0gZmFsc2UpIHtcbiAgY29uc3Qgbm9kZSA9IG5vZGVCeUlkKG5vZGVJZCk7XG4gIGlmICghbm9kZSkge1xuICAgIHJldHVybjtcbiAgfVxuICBwcmV2aWV3Tm9kZUlkID0gbm9kZUlkO1xuICBwcmV2aWV3QW5jaG9yID0gYW5jaG9yO1xuICBpZiAocGluKSB7XG4gICAgcHJldmlld0NvbnRyb2xsZXIuc2V0UGlubmVkKHRydWUpO1xuICAgIHN5bmNQaW5CdXR0b24odHJ1ZSk7XG4gICAgcHJldmlldy5mb2N1cygpO1xuICB9XG4gIGlmIChub2RlLmlzU3ludGhldGljIHx8ICFub2RlLnJhbmdlKSB7XG4gICAgcmVuZGVyUHJldmlld0NhcmQobm9kZSwgbnVsbCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChwcmV2aWV3RXhwbGFpbiAmJiBjdXJyZW50RHRvPy5kdG9LaW5kID09PSAnY2ZnJykge1xuICAgIGNvbnN0IHJlcXVlc3RGb3JFeHBsYWluID0gcHJldmlld1JlcXVlc3QgKyAxO1xuICAgIHZvaWQgYnJpZGdlXG4gICAgICAucmVxdWVzdCgnZXhwbGFpbi5ub2RlJywgeyBub2RlSWQsIGRlcHRoOiAxIH0pXG4gICAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBwcmV2aWV3Tm9kZUlkID09PSBub2RlSWQgJiZcbiAgICAgICAgICBwcmV2aWV3UmVxdWVzdCA8PSByZXF1ZXN0Rm9yRXhwbGFpbiAmJlxuICAgICAgICAgIHJlcy5wYXlsb2FkPy5zdW1tYXJ5XG4gICAgICAgICkge1xuICAgICAgICAgIHByZXZpZXdFeHBsYWluLnRleHRDb250ZW50ID0gcmVzLnBheWxvYWQuc3VtbWFyeTtcbiAgICAgICAgICBwcmV2aWV3RXhwbGFpbi5oaWRkZW4gPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoKSA9PiB7fSk7XG4gIH1cbiAgY29uc3Qga2V5ID0gYCR7bm9kZUlkfXwke3NldHRpbmdzLm1heExpbmVzfWA7XG4gIGNvbnN0IGNhY2hlZCA9IHByZXZpZXdDYWNoZS5nZXQoa2V5KTtcbiAgaWYgKGNhY2hlZCkge1xuICAgIHJlbmRlclByZXZpZXdDYXJkKG5vZGUsIGNhY2hlZCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHJlcXVlc3QgPSArK3ByZXZpZXdSZXF1ZXN0O1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ3NvdXJjZS5zbGljZScsIHtcbiAgICAgIGZpbGVJZDogbm9kZS5yYW5nZS5maWxlSWQsXG4gICAgICByYW5nZTogbm9kZS5yYW5nZSxcbiAgICAgIG1heExpbmVzOiBzZXR0aW5ncy5tYXhMaW5lcyxcbiAgICB9KTtcbiAgICBpZiAocmVxdWVzdCAhPT0gcHJldmlld1JlcXVlc3QgfHwgcHJldmlld05vZGVJZCAhPT0gbm9kZUlkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHNsaWNlID0gcmVzcG9uc2UucGF5bG9hZC5zbGljZSA/PyBudWxsO1xuICAgIHByZXZpZXdDYWNoZS5zZXQoa2V5LCBzbGljZSk7XG4gICAgaWYgKHNsaWNlPy5pbnRlZ3JpdHkgJiYgc2xpY2UuaW50ZWdyaXR5ICE9PSAnZXhhY3QnKSB7XG4gICAgICBpbnRlZ3JpdHlCeU5vZGUuc2V0KG5vZGVJZCwgc2xpY2UuaW50ZWdyaXR5KTtcbiAgICAgIHJlbmRlcmVyLm1hcmtTdGFsZShbbm9kZUlkXSk7XG4gICAgfVxuICAgIHJlbmRlclByZXZpZXdDYXJkKG5vZGUsIHNsaWNlKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBpZiAocmVxdWVzdCAhPT0gcHJldmlld1JlcXVlc3QpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmVuZGVyUHJldmlld0NhcmQobm9kZSwge1xuICAgICAgdGV4dDogJycsXG4gICAgICByZWxhdGl2ZVBhdGg6ICcnLFxuICAgICAgaW50ZWdyaXR5OiAnbWlzc2luZycsXG4gICAgICByZWFzb246IGVycm9yPy5tZXNzYWdlID8/IFN0cmluZyhlcnJvciksXG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IFtub2RlXVxuICovXG5hc3luYyBmdW5jdGlvbiBuYXZpZ2F0ZVRvKG5vZGVJZCwgbm9kZSA9IG5vZGVCeUlkKG5vZGVJZCkpIHtcbiAgaWYgKCFub2RlPy5yYW5nZSB8fCBub2RlLmlzU3ludGhldGljKSB7XG4gICAgc2V0QmFubmVyKCdUaGlzIG5vZGUgaGFzIG5vIHNvdXJjZSB0byBvcGVuLicsIGZhbHNlKTtcbiAgICByZXR1cm47XG4gIH1cbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyaWRnZS5yZXF1ZXN0KCduYXZpZ2F0ZS50bycsIHtcbiAgICAgIGZpbGVJZDogbm9kZS5yYW5nZS5maWxlSWQsXG4gICAgICByYW5nZTogbm9kZS5yYW5nZSxcbiAgICAgIG5vZGVJZCxcbiAgICB9KTtcbiAgICBpZiAocmVzcG9uc2UucGF5bG9hZC5vayAhPT0gdHJ1ZSkge1xuICAgICAgc2V0QmFubmVyKFxuICAgICAgICBgJHtyZXNwb25zZS5wYXlsb2FkLmNvZGUgPz8gJ0VfTkFWSUdBVElPTid9OiAke3Jlc3BvbnNlLnBheWxvYWQubWVzc2FnZSA/PyAnQ291bGQgbm90IG9wZW4gc291cmNlLid9YCxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICk7XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHNldEJhbm5lcihgQ291bGQgbm90IG9wZW4gc291cmNlOiAke2Vycm9yPy5tZXNzYWdlID8/IFN0cmluZyhlcnJvcil9YCwgdHJ1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSBldmVyeSBzb3VyY2UtYmFja2VkIG5vZGUgb25jZSBvbiBncmFwaCBsb2FkLlxuICpcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gZHRvXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHZhbGlkYXRlR3JhcGgoZHRvKSB7XG4gIGludGVncml0eUJ5Tm9kZSA9IG5ldyBNYXAoKTtcbiAgY29uc3QgcmFuZ2VzID0gZHRvLm5vZGVzXG4gICAgLmZpbHRlcigobm9kZSkgPT4gbm9kZS5yYW5nZSAmJiAhbm9kZS5pc1N5bnRoZXRpYylcbiAgICAubWFwKChub2RlKSA9PiAoeyBub2RlSWQ6IG5vZGUuaWQsIC4uLm5vZGUucmFuZ2UgfSkpO1xuICBpZiAocmFuZ2VzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ3NvdXJjZS52YWxpZGF0aW9uJywge1xuICAgICAgcmFuZ2VzOiByYW5nZXMubWFwKCh7IG5vZGVJZDogX25vZGVJZCwgLi4ucmFuZ2UgfSkgPT4gcmFuZ2UpLFxuICAgIH0pO1xuICAgIGNvbnN0IHJlc3VsdHMgPSBBcnJheS5pc0FycmF5KHJlc3BvbnNlLnBheWxvYWQucmVzdWx0cykgPyByZXNwb25zZS5wYXlsb2FkLnJlc3VsdHMgOiBbXTtcbiAgICBjb25zdCBzdGFsZSA9IFtdO1xuICAgIGZvciAoY29uc3QgW2luZGV4LCByZXN1bHRdIG9mIHJlc3VsdHMuZW50cmllcygpKSB7XG4gICAgICBjb25zdCBub2RlSWQgPSByYW5nZXNbaW5kZXhdPy5ub2RlSWQ7XG4gICAgICBpZiAoIW5vZGVJZCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGludGVncml0eUJ5Tm9kZS5zZXQobm9kZUlkLCByZXN1bHQuaW50ZWdyaXR5ID8/ICdtaXNzaW5nJyk7XG4gICAgICBpZiAocmVzdWx0LmludGVncml0eSAhPT0gJ2V4YWN0Jykge1xuICAgICAgICBzdGFsZS5wdXNoKG5vZGVJZCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChzdGFsZS5sZW5ndGggPiAwKSB7XG4gICAgICByZW5kZXJlci5tYXJrU3RhbGUoc3RhbGUpO1xuICAgICAgc2V0QmFubmVyKFxuICAgICAgICBgJHtzdGFsZS5sZW5ndGh9IG5vZGUke3N0YWxlLmxlbmd0aCA9PT0gMSA/ICcnIDogJ3MnfSByZWZlcmVuY2UgY2hhbmdlZCBvciBtaXNzaW5nIHNvdXJjZS4gUHJldmlldyBtYXJrcyB0aGVtIHN0YWxlOyByZS1hbmFseXplIGJlZm9yZSB0cnVzdGluZyB0aGVtLmAsXG4gICAgICAgIGZhbHNlLFxuICAgICAgKTtcbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIC8vIFZhbGlkYXRpb24gaXMgYW4gZW5oYW5jZW1lbnQuIEEgZmFpbHVyZSBtdXN0IG5vdCBoaWRlIHRoZSBncmFwaC5cbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nW119IGZpbGVJZHNcbiAqL1xuZnVuY3Rpb24gbWFya1N0YWxlRmlsZXMoZmlsZUlkcykge1xuICBjb25zdCB3YW50ZWQgPSBuZXcgU2V0KEFycmF5LmlzQXJyYXkoZmlsZUlkcykgPyBmaWxlSWRzIDogW10pO1xuICBpZiAoIWN1cnJlbnREdG8gfHwgd2FudGVkLnNpemUgPT09IDApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3Qgc3RhbGUgPSBjdXJyZW50RHRvLm5vZGVzXG4gICAgLmZpbHRlcigobm9kZSkgPT4gbm9kZS5yYW5nZSAmJiB3YW50ZWQuaGFzKG5vZGUucmFuZ2UuZmlsZUlkKSlcbiAgICAubWFwKChub2RlKSA9PiBub2RlLmlkKTtcbiAgaWYgKHN0YWxlLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuICBwcmV2aWV3Q2FjaGUuY2xlYXIoKTtcbiAgZm9yIChjb25zdCBub2RlSWQgb2Ygc3RhbGUpIHtcbiAgICBpbnRlZ3JpdHlCeU5vZGUuc2V0KG5vZGVJZCwgJ3N0YWxlJyk7XG4gIH1cbiAgcmVuZGVyZXIubWFya1N0YWxlKHN0YWxlKTtcbiAgcHJldmlld0NvbnRyb2xsZXIuZGlzbWlzcygpO1xuICBoaWRlUHJldmlldygpO1xuICBzZXRCYW5uZXIoXG4gICAgYFNvdXJjZSBjaGFuZ2VkIGZvciAke3N0YWxlLmxlbmd0aH0gbm9kZSR7c3RhbGUubGVuZ3RoID09PSAxID8gJycgOiAncyd9LiBQcmV2aWV3cyBhcmUgc3RhbGU7IHJlLWFuYWx5emUgYmVmb3JlIHRydXN0aW5nIHRoZW0uYCxcbiAgICBmYWxzZSxcbiAgKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge2ltcG9ydCgnLi4vY29yZS9ncmFwaC9kdG8uanMnKS5HcmFwaER0b30gZHRvXG4gKi9cbmZ1bmN0aW9uIHJlbmRlckxlZ2VuZChkdG8pIHtcbiAgbGVnZW5kLnJlcGxhY2VDaGlsZHJlbigpO1xuICBmb3IgKGNvbnN0IHN0YXR1c05hbWUgb2YgZHRvLmxlZ2VuZC5zdGF0dXNlcykge1xuICAgIGNvbnN0IGl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgIGNvbnN0IHN3YXRjaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBzd2F0Y2guY2xhc3NOYW1lID0gYGNmLXN3YXRjaCBjZi1lZGdlLS0ke3N0YXR1c05hbWV9YDtcbiAgICBjb25zdCBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBsYWJlbC50ZXh0Q29udGVudCA9IHN0YXR1c05hbWU7XG4gICAgaWYgKHN0YXR1c05hbWUgIT09ICdyZXNvbHZlZCcpIHtcbiAgICAgIGxhYmVsLnRleHRDb250ZW50ID0gYCR7c3RhdHVzTmFtZX0gKHBhdHRlcm4gKyBsYWJlbClgO1xuICAgIH1cbiAgICBpdGVtLmFwcGVuZChzd2F0Y2gsIGxhYmVsKTtcbiAgICBsZWdlbmQuYXBwZW5kQ2hpbGQoaXRlbSk7XG4gIH1cbiAgZm9yIChjb25zdCBlZGdlS2luZCBvZiBkdG8ubGVnZW5kLmVkZ2VLaW5kcyA/PyBbXSkge1xuICAgIGNvbnN0IGl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgIGNvbnN0IHN3YXRjaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBzd2F0Y2guY2xhc3NOYW1lID0gYGNmLXN3YXRjaCBjZi1lZGdlLS1raW5kLSR7ZWRnZUtpbmR9YDtcbiAgICBjb25zdCBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBsYWJlbC50ZXh0Q29udGVudCA9IGBlZGdlOiAke2VkZ2VLaW5kfWA7XG4gICAgaXRlbS5hcHBlbmQoc3dhdGNoLCBsYWJlbCk7XG4gICAgbGVnZW5kLmFwcGVuZENoaWxkKGl0ZW0pO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtBcnJheTx7c3ltYm9sSWQ6IHN0cmluZywgbmFtZTogc3RyaW5nLCBxdWFsaWZpZWROYW1lOiBzdHJpbmcsIGtpbmQ6IHN0cmluZ30+fSBsaXN0XG4gKi9cbmZ1bmN0aW9uIHJlbmRlckZ1bmN0aW9uUGlja2VyKGxpc3QpIHtcbiAgaWYgKCFmdW5jdGlvblBpY2tlcikge1xuICAgIHJldHVybjtcbiAgfVxuICBmdW5jdGlvblBpY2tlci5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgZm9yIChjb25zdCBlbnRyeSBvZiBsaXN0KSB7XG4gICAgY29uc3Qgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gICAgb3B0aW9uLnZhbHVlID0gZW50cnkuc3ltYm9sSWQ7XG4gICAgb3B0aW9uLnRleHRDb250ZW50ID0gYCR7ZW50cnkucXVhbGlmaWVkTmFtZX0gKCR7ZW50cnkua2luZH0pYDtcbiAgICBmdW5jdGlvblBpY2tlci5hcHBlbmRDaGlsZChvcHRpb24pO1xuICB9XG4gIGZ1bmN0aW9uUGlja2VyLmhpZGRlbiA9IGxpc3QubGVuZ3RoIDw9IDE7XG4gIGlmIChzZWxlY3RlZFN5bWJvbElkKSB7XG4gICAgZnVuY3Rpb25QaWNrZXIudmFsdWUgPSBzZWxlY3RlZFN5bWJvbElkO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNob3dDYXBhYmlsaXRpZXMocGF5bG9hZCkge1xuICBjb25zdCBhZGFwdGVycyA9IEFycmF5LmlzQXJyYXkocGF5bG9hZC5hZGFwdGVycykgPyBwYXlsb2FkLmFkYXB0ZXJzIDogW107XG4gIGNvbnN0IG5hbWVzID0gYWRhcHRlcnMubWFwKChhZGFwdGVyKSA9PiBhZGFwdGVyLmlkKS5qb2luKCcsICcpIHx8ICdub25lJztcbiAgbWV0YS50ZXh0Q29udGVudCA9IGBNb2NrIGRhdGEgXHUwMEI3IGFkYXB0ZXJzOiAke25hbWVzfSBcdTAwQjcgcHJvdG9jb2wgdiR7cGF5bG9hZC5wcm90b2NvbFZlcnNpb24gPz8gJz8nfWA7XG4gIGlmIChwYXlsb2FkPy5zZXR0aW5ncyAmJiB0eXBlb2YgcGF5bG9hZC5zZXR0aW5ncyA9PT0gJ29iamVjdCcpIHtcbiAgICBhcHBseVNldHRpbmdzKHBheWxvYWQuc2V0dGluZ3MpO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSBwYXlsb2FkXG4gKi9cbmZ1bmN0aW9uIGhhbmRsZUdyYXBoKHBheWxvYWQpIHtcbiAgY29uc3QgZHRvQ2FuZGlkYXRlID0gLyoqIEB0eXBlIHt7ZHRvPzogdW5rbm93bn19ICovIChwYXlsb2FkKS5kdG87XG4gIGNvbnN0IHZhbGlkYXRpb24gPSB2YWxpZGF0ZUR0byhkdG9DYW5kaWRhdGUpO1xuICBpZiAoIXZhbGlkYXRpb24ub2spIHtcbiAgICBzZXRCYW5uZXIoYEludmFsaWQgZ3JhcGggcGF5bG9hZDogJHt2YWxpZGF0aW9uLmlzc3Vlc1swXX1gLCB0cnVlKTtcbiAgICBzZXRTdGF0dXMoJ1JlbmRlciBmYWlsZWQnKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgZHRvID0gdmFsaWRhdGlvbi5kdG87XG4gIGN1cnJlbnREdG8gPSBkdG87XG4gIHByZXZpZXdDYWNoZS5jbGVhcigpO1xuICBpbnRlZ3JpdHlCeU5vZGUgPSBuZXcgTWFwKCk7XG4gIGhpZGVQcmV2aWV3KCk7XG4gIGVtcHR5LmhpZGRlbiA9IHRydWU7XG4gIHJlbmRlcmVyLnJlbmRlcihkdG8pO1xuICByZW5kZXJMZWdlbmQoZHRvKTtcbiAgY2xlYXJEZXRhaWwoKTtcbiAgdm9pZCB2YWxpZGF0ZUdyYXBoKGR0byk7XG4gIHZvaWQgbG9hZEZ1bmN0aW9uU3VtbWFyeShkdG8pO1xuICB2b2lkIHVwZGF0ZUNhbGxHcmFwaFNpZGVQYW5lbChkdG8pO1xuICBpZiAoc3dpdGNoUGVyc3BlY3RpdmVCdG4pIHtcbiAgICBzd2l0Y2hQZXJzcGVjdGl2ZUJ0bi5oaWRkZW4gPSAhc2VsZWN0ZWRTeW1ib2xJZDtcbiAgICBzd2l0Y2hQZXJzcGVjdGl2ZUJ0bi50ZXh0Q29udGVudCA9XG4gICAgICBkdG8uZHRvS2luZCA9PT0gJ2NhbGxfZ3JhcGgnID8gJ1Nob3cgaW4gQ0ZHJyA6ICdTaG93IGluIENhbGwgR3JhcGgnO1xuICB9XG4gIGNvbnN0IHN1YmplY3QgPVxuICAgIGR0by5kdG9LaW5kID09PSAnY2ZnJyAmJiBkdG8uZnVuY3Rpb25cbiAgICAgID8gYCR7ZHRvLmZ1bmN0aW9uLnF1YWxpZmllZE5hbWV9IFx1MDBCNyBDRkdgXG4gICAgICA6IGR0by5kdG9LaW5kID09PSAnY2FsbF9ncmFwaCdcbiAgICAgICAgPyBgJHtkdG8uY2VudGVyU3ltYm9sSWR9IFx1MDBCNyBDYWxsIEdyYXBoYFxuICAgICAgICA6ICdjYWxsIGdyYXBoJztcbiAgc2V0U3RhdHVzKFxuICAgIGAke3N1YmplY3R9IFx1MDBCNyAke2R0by5sYW5ndWFnZX0gXHUwMEI3ICR7ZHRvLm5vZGVzLmxlbmd0aH0gbm9kZXMgXHUwMEI3ICR7ZHRvLmVkZ2VzLmxlbmd0aH0gZWRnZXMgXHUwMEI3ICR7ZHRvLmNvbXBsZXRlbmVzc31gLFxuICApO1xuICBtZXRhLnRleHRDb250ZW50ID0gYCR7ZHRvLmFkYXB0ZXJJZH0gXHUwMEI3ICR7c3ViamVjdH0gXHUwMEI3IGR0byB2JHtkdG8uZHRvVmVyc2lvbn1gO1xuICBjb25zdCBkZWdyYWRhdGlvbnMgPSBkdG8uZGVncmFkYXRpb25zID8/IFtdO1xuICBjb25zdCBtZXNzYWdlcyA9IGRlZ3JhZGF0aW9ucy5tYXAoKGVudHJ5KSA9PlxuICAgIHR5cGVvZiBlbnRyeSA9PT0gJ3N0cmluZydcbiAgICAgID8gZW50cnlcbiAgICAgIDogYCR7ZW50cnkuc2V2ZXJpdHkgPT09ICdpbmZvJyA/ICcnIDogYCR7ZW50cnkuc2V2ZXJpdHl9OiBgfSR7ZW50cnkubWVzc2FnZX1gLFxuICApO1xuICBzZXRCYW5uZXIobWVzc2FnZXMubGVuZ3RoID4gMCA/IG1lc3NhZ2VzLmpvaW4oJyBcdTAwQjcgJykgOiAnJywgZmFsc2UpO1xufVxuXG5icmlkZ2Uub24oJ3Byb3RvY29sLmVycm9yJywgKHBheWxvYWQpID0+IHtcbiAgY29uc3QgY29kZSA9IHR5cGVvZiBwYXlsb2FkLmNvZGUgPT09ICdzdHJpbmcnID8gcGF5bG9hZC5jb2RlIDogJ0VfUFJPVE9DT0wnO1xuICBjb25zdCBtZXNzYWdlID0gdHlwZW9mIHBheWxvYWQubWVzc2FnZSA9PT0gJ3N0cmluZycgPyBwYXlsb2FkLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvci4nO1xuICBzZXRCYW5uZXIoYCR7Y29kZX06ICR7bWVzc2FnZX1gLCB0cnVlKTtcbiAgc2V0U3RhdHVzKCdFcnJvcicpO1xufSk7XG5cbmJyaWRnZS5vbignc2V0dGluZ3MuZGF0YScsIChwYXlsb2FkKSA9PiB7XG4gIGNvbnN0IG5leHQgPSBwYXlsb2FkPy5zZXR0aW5ncztcbiAgaWYgKG5leHQgJiYgdHlwZW9mIG5leHQgPT09ICdvYmplY3QnKSB7XG4gICAgYXBwbHlTZXR0aW5ncyhuZXh0KTtcbiAgfVxufSk7XG5cbmJyaWRnZS5vbignc291cmNlLnN0YWxlJywgKHBheWxvYWQpID0+IHtcbiAgbWFya1N0YWxlRmlsZXMoQXJyYXkuaXNBcnJheShwYXlsb2FkPy5maWxlSWRzKSA/IHBheWxvYWQuZmlsZUlkcyA6IFtdKTtcbn0pO1xuXG5icmlkZ2Uub24oJ3NlbGVjdGlvbi5jaGFuZ2VkJywgKHBheWxvYWQpID0+IHtcbiAgY29uc3Qgbm9kZUlkcyA9IEFycmF5LmlzQXJyYXkocGF5bG9hZD8ubm9kZUlkcykgPyBwYXlsb2FkLm5vZGVJZHMgOiBbXTtcbiAgcmVuZGVyZXIuaGlnaGxpZ2h0KG5vZGVJZHMpO1xuICBjb25zdCBhY3RpdmVOb2RlSWQgPSB0eXBlb2YgcGF5bG9hZD8uYWN0aXZlTm9kZUlkID09PSAnc3RyaW5nJyA/IHBheWxvYWQuYWN0aXZlTm9kZUlkIDogbnVsbDtcbiAgaWYgKGFjdGl2ZU5vZGVJZCkge1xuICAgIGNvbnN0IG5vZGUgPSBub2RlQnlJZChhY3RpdmVOb2RlSWQpO1xuICAgIGlmIChub2RlKSB7XG4gICAgICBzaG93Tm9kZURldGFpbHMoYWN0aXZlTm9kZUlkLCBub2RlKTtcbiAgICB9XG4gIH1cbn0pO1xuXG5icmlkZ2Uub24oJ2dyYXBoLmZvY3VzJywgKHBheWxvYWQpID0+IHtcbiAgaWYgKHR5cGVvZiBwYXlsb2FkPy5ub2RlSWQgPT09ICdzdHJpbmcnKSB7XG4gICAgY29uc3Qgbm9kZSA9IG5vZGVCeUlkKHBheWxvYWQubm9kZUlkKTtcbiAgICBpZiAobm9kZSkge1xuICAgICAgcmVuZGVyZXIuc2VsZWN0KHBheWxvYWQubm9kZUlkKTtcbiAgICAgIHNob3dOb2RlRGV0YWlscyhwYXlsb2FkLm5vZGVJZCwgbm9kZSk7XG4gICAgfVxuICB9XG4gIHN2Zy5mb2N1cz8uKCk7XG59KTtcblxucHJldmlldy5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyZW50ZXInLCAoKSA9PiB7XG4gIHByZXZpZXdDb250cm9sbGVyLnBvaW50ZXJFbnRlckNhcmQoKTtcbn0pO1xucHJldmlldy5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybGVhdmUnLCAoKSA9PiB7XG4gIHByZXZpZXdDb250cm9sbGVyLnBvaW50ZXJMZWF2ZUNhcmQoKTtcbn0pO1xucHJldmlld1Bpbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgc3luY1BpbkJ1dHRvbihwcmV2aWV3Q29udHJvbGxlci50b2dnbGVQaW4oKSk7XG59KTtcbnByZXZpZXdDbG9zZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgcHJldmlld0NvbnRyb2xsZXIuZGlzbWlzcygpO1xuICBoaWRlUHJldmlldygpO1xufSk7XG5wcmV2aWV3T3Blbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgaWYgKHByZXZpZXdOb2RlSWQpIHtcbiAgICB2b2lkIG5hdmlnYXRlVG8ocHJldmlld05vZGVJZCk7XG4gIH1cbn0pO1xucHJldmlld0JvZHkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gIGlmIChzZXR0aW5ncy5jbGlja1RvTmF2aWdhdGUgJiYgcHJldmlld05vZGVJZCAmJiAhcHJldmlld09wZW4uZGlzYWJsZWQpIHtcbiAgICB2b2lkIG5hdmlnYXRlVG8ocHJldmlld05vZGVJZCk7XG4gIH1cbn0pO1xucHJldmlldy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGV2ZW50KSA9PiB7XG4gIGlmIChldmVudC5rZXkgPT09ICdFc2NhcGUnKSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBwcmV2aWV3Q29udHJvbGxlci5kaXNtaXNzKCk7XG4gICAgaGlkZVByZXZpZXcoKTtcbiAgICByZW5kZXJlci5mb2N1c1NlbGVjdGlvbigpO1xuICB9XG59KTtcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGV2ZW50KSA9PiB7XG4gIGlmIChldmVudC5rZXkgPT09ICdFc2NhcGUnICYmICFwcmV2aWV3LmhpZGRlbikge1xuICAgIHByZXZpZXdDb250cm9sbGVyLmRpc21pc3MoKTtcbiAgICBoaWRlUHJldmlldygpO1xuICB9XG59KTtcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3ltYm9sSWRcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZENmZyhzeW1ib2xJZCkge1xuICBzZXRTdGF0dXMoJ0J1aWxkaW5nIGNvbnRyb2wtZmxvdyBncmFwaFx1MjAyNicpO1xuICBzZXRCYW5uZXIoJycpO1xuICB0cnkge1xuICAgIC8vIEEgcmVxdWVzdCByZXNvbHZlcyB3aXRoIGl0cyBjb3JyZWxhdGVkIHJlc3BvbnNlLiBUaGUgcmVzcG9uc2UgaXMgbm90XG4gICAgLy8gZGlzcGF0Y2hlZCB0byBgYnJpZGdlLm9uYCwgc28gaGFuZGxlIGl0IGhlcmUuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicmlkZ2UucmVxdWVzdCgnY2ZnLmxvYWQnLCB7IHN5bWJvbElkIH0pO1xuICAgIHNlbGVjdGVkU3ltYm9sSWQgPSBzeW1ib2xJZDtcbiAgICBoYW5kbGVHcmFwaChyZXNwb25zZS5wYXlsb2FkKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBzZXRCYW5uZXIoYENvdWxkIG5vdCBidWlsZCBDRkc6ICR7ZXJyb3I/Lm1lc3NhZ2UgPz8gU3RyaW5nKGVycm9yKX1gLCB0cnVlKTtcbiAgICBzZXRTdGF0dXMoJ0NGRyB1bmF2YWlsYWJsZScpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzeW1ib2xJZFxuICovXG5hc3luYyBmdW5jdGlvbiBsb2FkQ2FsbEdyYXBoKHN5bWJvbElkKSB7XG4gIHNldFN0YXR1cygnQnVpbGRpbmcgY2FsbCBncmFwaFx1MjAyNicpO1xuICBzZXRCYW5uZXIoJycpO1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ2NhbGxzLmxvYWQnLCB7IHN5bWJvbElkIH0pO1xuICAgIHNlbGVjdGVkU3ltYm9sSWQgPSBzeW1ib2xJZDtcbiAgICBhY3RpdmVQZXJzcGVjdGl2ZSA9ICdjYWxsX2dyYXBoJztcbiAgICBpZiAocGVyc3BlY3RpdmVTZWxlY3QpIHtcbiAgICAgIHBlcnNwZWN0aXZlU2VsZWN0LnZhbHVlID0gJ2NhbGxfZ3JhcGgnO1xuICAgIH1cbiAgICBoYW5kbGVHcmFwaChyZXNwb25zZS5wYXlsb2FkKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBzZXRCYW5uZXIoYENvdWxkIG5vdCBidWlsZCBjYWxsIGdyYXBoOiAke2Vycm9yPy5tZXNzYWdlID8/IFN0cmluZyhlcnJvcil9YCwgdHJ1ZSk7XG4gICAgc2V0U3RhdHVzKCdDYWxsIGdyYXBoIHVuYXZhaWxhYmxlJyk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGxvYWRHcmFwaCgpIHtcbiAgc2V0U3RhdHVzKCdMb2FkaW5nIGdyYXBoXHUyMDI2Jyk7XG4gIHNldEJhbm5lcignJyk7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicmlkZ2UucmVxdWVzdCgnY2ZnLmZ1bmN0aW9ucycsIHt9KTtcbiAgICBjb25zdCBsaXN0ID0gQXJyYXkuaXNBcnJheShyZXNwb25zZS5wYXlsb2FkLmZ1bmN0aW9ucykgPyByZXNwb25zZS5wYXlsb2FkLmZ1bmN0aW9ucyA6IFtdO1xuICAgIGlmIChsaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgIHJlbmRlckZ1bmN0aW9uUGlja2VyKGxpc3QpO1xuICAgICAgY29uc3QgcmV0YWluZWQgPVxuICAgICAgICBzZWxlY3RlZFN5bWJvbElkICYmIGxpc3Quc29tZSgoZW50cnkpID0+IGVudHJ5LnN5bWJvbElkID09PSBzZWxlY3RlZFN5bWJvbElkKVxuICAgICAgICAgID8gc2VsZWN0ZWRTeW1ib2xJZFxuICAgICAgICAgIDogbGlzdFswXS5zeW1ib2xJZDtcbiAgICAgIGNvbnN0IGxvYWRlZCA9XG4gICAgICAgIGFjdGl2ZVBlcnNwZWN0aXZlID09PSAnY2FsbF9ncmFwaCdcbiAgICAgICAgICA/IGF3YWl0IGxvYWRDYWxsR3JhcGgocmV0YWluZWQpXG4gICAgICAgICAgOiBhd2FpdCBsb2FkQ2ZnKHJldGFpbmVkKTtcbiAgICAgIGlmIChsb2FkZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgLy8gVGhlIENGRyBjYXBhYmlsaXR5IG1heSBiZSBhYnNlbnQgKGZvciBleGFtcGxlIHRoZSBidWlsdC1pbiBkZW1vIHJ1bikuXG4gICAgLy8gRmFsbGluZyBiYWNrIHRvIHRoZSBjYWxsIGdyYXBoIGtlZXBzIHRoZSBwYW5lbCB1c2VmdWwgYW5kIGhvbmVzdC5cbiAgfVxuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ2dyYXBoLmxvYWQnLCB7IGRlbW86IHRydWUgfSk7XG4gICAgaGFuZGxlR3JhcGgocmVzcG9uc2UucGF5bG9hZCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgc2V0QmFubmVyKGBDb3VsZCBub3QgbG9hZCBncmFwaDogJHtlcnJvcj8ubWVzc2FnZSA/PyBTdHJpbmcoZXJyb3IpfWAsIHRydWUpO1xuICAgIHNldFN0YXR1cygnTG9hZCBmYWlsZWQnKTtcbiAgICBlbXB0eS5oaWRkZW4gPSBmYWxzZTtcbiAgfVxufVxuXG5yZWxvYWRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gIHZvaWQgbG9hZEdyYXBoKCk7XG59KTtcblxuZnVuY3Rpb25QaWNrZXI/LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHtcbiAgY29uc3Qgc3ltYm9sSWQgPSBmdW5jdGlvblBpY2tlci52YWx1ZTtcbiAgaWYgKHN5bWJvbElkKSB7XG4gICAgaWYgKGFjdGl2ZVBlcnNwZWN0aXZlID09PSAnY2FsbF9ncmFwaCcpIHtcbiAgICAgIHZvaWQgbG9hZENhbGxHcmFwaChzeW1ib2xJZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZvaWQgbG9hZENmZyhzeW1ib2xJZCk7XG4gICAgfVxuICB9XG59KTtcblxucGVyc3BlY3RpdmVTZWxlY3Q/LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHtcbiAgYWN0aXZlUGVyc3BlY3RpdmUgPSBwZXJzcGVjdGl2ZVNlbGVjdC52YWx1ZSA9PT0gJ2NhbGxfZ3JhcGgnID8gJ2NhbGxfZ3JhcGgnIDogJ2NmZyc7XG4gIGlmIChzZWxlY3RlZFN5bWJvbElkKSB7XG4gICAgaWYgKGFjdGl2ZVBlcnNwZWN0aXZlID09PSAnY2FsbF9ncmFwaCcpIHtcbiAgICAgIHZvaWQgbG9hZENhbGxHcmFwaChzZWxlY3RlZFN5bWJvbElkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdm9pZCBsb2FkQ2ZnKHNlbGVjdGVkU3ltYm9sSWQpO1xuICAgIH1cbiAgfVxufSk7XG5cbnN3aXRjaFBlcnNwZWN0aXZlQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgY29uc3QgdGFyZ2V0U3ltYm9sID1cbiAgICBhY3RpdmVOb2RlSWQgJiYgY3VycmVudER0bz8uZHRvS2luZCA9PT0gJ2NhbGxfZ3JhcGgnICYmICFhY3RpdmVOb2RlSWQuc3RhcnRzV2l0aCgnYnVja2V0OicpXG4gICAgICA/IGFjdGl2ZU5vZGVJZFxuICAgICAgOiBzZWxlY3RlZFN5bWJvbElkO1xuICBpZiAoIXRhcmdldFN5bWJvbCkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoY3VycmVudER0bz8uZHRvS2luZCA9PT0gJ2NhbGxfZ3JhcGgnKSB7XG4gICAgYWN0aXZlUGVyc3BlY3RpdmUgPSAnY2ZnJztcbiAgICBpZiAocGVyc3BlY3RpdmVTZWxlY3QpIHtcbiAgICAgIHBlcnNwZWN0aXZlU2VsZWN0LnZhbHVlID0gJ2NmZyc7XG4gICAgfVxuICAgIHZvaWQgbG9hZENmZyh0YXJnZXRTeW1ib2wpO1xuICB9IGVsc2Uge1xuICAgIGFjdGl2ZVBlcnNwZWN0aXZlID0gJ2NhbGxfZ3JhcGgnO1xuICAgIGlmIChwZXJzcGVjdGl2ZVNlbGVjdCkge1xuICAgICAgcGVyc3BlY3RpdmVTZWxlY3QudmFsdWUgPSAnY2FsbF9ncmFwaCc7XG4gICAgfVxuICAgIHZvaWQgbG9hZENhbGxHcmFwaCh0YXJnZXRTeW1ib2wpO1xuICB9XG59KTtcblxuY2FsbHNFeHBhbmRCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYXN5bmMgKCkgPT4ge1xuICBpZiAoIWFjdGl2ZU5vZGVJZCB8fCBjdXJyZW50RHRvPy5kdG9LaW5kICE9PSAnY2FsbF9ncmFwaCcpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBicmlkZ2UucmVxdWVzdCgnY2FsbHMuZXhwYW5kJywgeyBzeW1ib2xJZDogYWN0aXZlTm9kZUlkIH0pO1xuICAgIGhhbmRsZUdyYXBoKHJlcy5wYXlsb2FkKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBzZXRCYW5uZXIoYEV4cGFuZCBmYWlsZWQ6ICR7ZXJyb3I/Lm1lc3NhZ2UgPz8gU3RyaW5nKGVycm9yKX1gLCB0cnVlKTtcbiAgfVxufSk7XG5cbmNhbGxzQ29sbGFwc2VCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYXN5bmMgKCkgPT4ge1xuICBpZiAoIWFjdGl2ZU5vZGVJZCB8fCBjdXJyZW50RHRvPy5kdG9LaW5kICE9PSAnY2FsbF9ncmFwaCcpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBicmlkZ2UucmVxdWVzdCgnY2FsbHMuY29sbGFwc2UnLCB7IHN5bWJvbElkOiBhY3RpdmVOb2RlSWQgfSk7XG4gICAgaGFuZGxlR3JhcGgocmVzLnBheWxvYWQpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHNldEJhbm5lcihgQ29sbGFwc2UgZmFpbGVkOiAke2Vycm9yPy5tZXNzYWdlID8/IFN0cmluZyhlcnJvcil9YCwgdHJ1ZSk7XG4gIH1cbn0pO1xuXG5jYWxsc0ZvY3VzQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGFzeW5jICgpID0+IHtcbiAgaWYgKGN1cnJlbnREdG8/LmR0b0tpbmQgIT09ICdjYWxsX2dyYXBoJykge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBuZXh0Rm9jdXMgPSBjdXJyZW50RHRvLmZvY3VzZWROb2RlSWQgPyBudWxsIDogKGFjdGl2ZU5vZGVJZCA/PyBjdXJyZW50RHRvLmNlbnRlclN5bWJvbElkKTtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBicmlkZ2UucmVxdWVzdCgnY2FsbHMuZm9jdXMnLCB7IHN5bWJvbElkOiBuZXh0Rm9jdXMgfSk7XG4gICAgaGFuZGxlR3JhcGgocmVzLnBheWxvYWQpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHNldEJhbm5lcihgRm9jdXMgZmFpbGVkOiAke2Vycm9yPy5tZXNzYWdlID8/IFN0cmluZyhlcnJvcil9YCwgdHJ1ZSk7XG4gIH1cbn0pO1xuXG5jYWxsc0ZpbHRlclN0YXR1cz8uYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgYXN5bmMgKCkgPT4ge1xuICBpZiAoY3VycmVudER0bz8uZHRvS2luZCAhPT0gJ2NhbGxfZ3JhcGgnKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHZhbHVlID0gY2FsbHNGaWx0ZXJTdGF0dXMudmFsdWU7XG4gIGNvbnN0IHN0YXR1c2VzID0gdmFsdWUgPT09ICdhbGwnID8gbnVsbCA6IHZhbHVlLnNwbGl0KCcsJyk7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ2NhbGxzLmZpbHRlcicsIHsgc3RhdHVzZXMgfSk7XG4gICAgaGFuZGxlR3JhcGgocmVzLnBheWxvYWQpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHNldEJhbm5lcihgRmlsdGVyIGZhaWxlZDogJHtlcnJvcj8ubWVzc2FnZSA/PyBTdHJpbmcoZXJyb3IpfWAsIHRydWUpO1xuICB9XG59KTtcblxuY2FsbGVyc01vcmVCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICBpZiAoY3VycmVudER0bz8uY2VudGVyU3ltYm9sSWQpIHtcbiAgICB2b2lkIGxvYWROZWlnaGJvclBhZ2UoJ2luY29taW5nJywgY3VycmVudER0by5jZW50ZXJTeW1ib2xJZCwgdHJ1ZSk7XG4gIH1cbn0pO1xuXG5jYWxsZWVzTW9yZUJ0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gIGlmIChjdXJyZW50RHRvPy5jZW50ZXJTeW1ib2xJZCkge1xuICAgIHZvaWQgbG9hZE5laWdoYm9yUGFnZSgnb3V0Z29pbmcnLCBjdXJyZW50RHRvLmNlbnRlclN5bWJvbElkLCB0cnVlKTtcbiAgfVxufSk7XG5cbmV4cGxhaW5EZXB0aFNlbGVjdD8uYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKCkgPT4ge1xuICBhY3RpdmVFeHBsYWluRGVwdGggPSBjbGFtcEV4cGxhbmF0aW9uRGVwdGgoZXhwbGFpbkRlcHRoU2VsZWN0LnZhbHVlKTtcbiAgaWYgKGFjdGl2ZU5vZGVJZCkge1xuICAgIHZvaWQgbG9hZE5vZGVFeHBsYW5hdGlvbihhY3RpdmVOb2RlSWQpO1xuICB9XG4gIGlmIChjdXJyZW50RHRvPy5kdG9LaW5kID09PSAnY2ZnJykge1xuICAgIHZvaWQgbG9hZEZ1bmN0aW9uU3VtbWFyeShjdXJyZW50RHRvKTtcbiAgfVxufSk7XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIChldmVudCkgPT4ge1xuICBzZXRCYW5uZXIoYFdlYnZpZXcgZXJyb3I6ICR7ZXZlbnQubWVzc2FnZX1gLCB0cnVlKTtcbn0pO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndW5oYW5kbGVkcmVqZWN0aW9uJywgKGV2ZW50KSA9PiB7XG4gIHNldEJhbm5lcihgVW5oYW5kbGVkIHJlamVjdGlvbjogJHtTdHJpbmcoZXZlbnQucmVhc29uKX1gLCB0cnVlKTtcbn0pO1xuXG5hc3luYyBmdW5jdGlvbiBib290KCkge1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ3dlYnZpZXcucmVhZHknLCB7XG4gICAgICBjbGllbnQ6ICd3ZWJ2aWV3JyxcbiAgICAgIHByb3RvY29sVmVyc2lvbjogUFJPVE9DT0xfVkVSU0lPTixcbiAgICB9KTtcbiAgICBzaG93Q2FwYWJpbGl0aWVzKHJlc3BvbnNlLnBheWxvYWQpO1xuICB9IGNhdGNoIHtcbiAgICAvLyBDYXBhYmlsaXRpZXMgYXJlIGluZm9ybWF0aW9uYWw7IGdyYXBoIGxvYWQgY2FuIHN0aWxsIHN1Y2NlZWQuXG4gIH1cbiAgYXdhaXQgbG9hZEdyYXBoKCk7XG59XG5cbnZvaWQgYm9vdCgpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFFQSxlQUFTLFdBQVcsS0FBSztBQUN2QixZQUFJLGVBQWUsS0FBSztBQUN0QixjQUFJLFFBQ0YsSUFBSSxTQUNKLElBQUksTUFDRixXQUFZO0FBQ1Ysa0JBQU0sSUFBSSxNQUFNLGtCQUFrQjtBQUFBLFVBQ3BDO0FBQUEsUUFDTixXQUFXLGVBQWUsS0FBSztBQUM3QixjQUFJLE1BQ0YsSUFBSSxRQUNKLElBQUksU0FDRixXQUFZO0FBQ1Ysa0JBQU0sSUFBSSxNQUFNLGtCQUFrQjtBQUFBLFVBQ3BDO0FBQUEsUUFDTjtBQUdBLGVBQU8sT0FBTyxHQUFHO0FBRWpCLGVBQU8sb0JBQW9CLEdBQUcsRUFBRSxRQUFRLENBQUMsU0FBUztBQUNoRCxnQkFBTSxPQUFPLElBQUksSUFBSTtBQUNyQixnQkFBTSxPQUFPLE9BQU87QUFHcEIsZUFBSyxTQUFTLFlBQVksU0FBUyxlQUFlLENBQUMsT0FBTyxTQUFTLElBQUksR0FBRztBQUN4RSx1QkFBVyxJQUFJO0FBQUEsVUFDakI7QUFBQSxRQUNGLENBQUM7QUFFRCxlQUFPO0FBQUEsTUFDVDtBQU1BLFVBQU0sV0FBTixNQUFlO0FBQUE7QUFBQTtBQUFBO0FBQUEsUUFJYixZQUFZLE1BQU07QUFFaEIsY0FBSSxLQUFLLFNBQVMsT0FBVyxNQUFLLE9BQU8sQ0FBQztBQUUxQyxlQUFLLE9BQU8sS0FBSztBQUNqQixlQUFLLGlCQUFpQjtBQUFBLFFBQ3hCO0FBQUEsUUFFQSxjQUFjO0FBQ1osZUFBSyxpQkFBaUI7QUFBQSxRQUN4QjtBQUFBLE1BQ0Y7QUFNQSxlQUFTLFdBQVcsT0FBTztBQUN6QixlQUFPLE1BQ0osUUFBUSxNQUFNLE9BQU8sRUFDckIsUUFBUSxNQUFNLE1BQU0sRUFDcEIsUUFBUSxNQUFNLE1BQU0sRUFDcEIsUUFBUSxNQUFNLFFBQVEsRUFDdEIsUUFBUSxNQUFNLFFBQVE7QUFBQSxNQUMzQjtBQVVBLGVBQVMsVUFBVSxhQUFhLFNBQVM7QUFFdkMsY0FBTSxTQUFTLHVCQUFPLE9BQU8sSUFBSTtBQUVqQyxtQkFBVyxPQUFPLFVBQVU7QUFDMUIsaUJBQU8sR0FBRyxJQUFJLFNBQVMsR0FBRztBQUFBLFFBQzVCO0FBQ0EsZ0JBQVEsUUFBUSxTQUFTLEtBQUs7QUFDNUIscUJBQVcsT0FBTyxLQUFLO0FBQ3JCLG1CQUFPLEdBQUcsSUFBSSxJQUFJLEdBQUc7QUFBQSxVQUN2QjtBQUFBLFFBQ0YsQ0FBQztBQUNEO0FBQUE7QUFBQSxVQUF5QjtBQUFBO0FBQUEsTUFDM0I7QUFjQSxVQUFNLGFBQWE7QUFNbkIsVUFBTSxvQkFBb0IsQ0FBQyxTQUFTO0FBR2xDLGVBQU8sQ0FBQyxDQUFDLEtBQUs7QUFBQSxNQUNoQjtBQU9BLFVBQU0sa0JBQWtCLENBQUMsTUFBTSxFQUFFLE9BQU8sTUFBTTtBQUU1QyxZQUFJLEtBQUssV0FBVyxXQUFXLEdBQUc7QUFDaEMsaUJBQU8sS0FBSyxRQUFRLGFBQWEsV0FBVztBQUFBLFFBQzlDO0FBRUEsWUFBSSxLQUFLLFNBQVMsR0FBRyxHQUFHO0FBQ3RCLGdCQUFNLFNBQVMsS0FBSyxNQUFNLEdBQUc7QUFDN0IsaUJBQU87QUFBQSxZQUNMLEdBQUcsTUFBTSxHQUFHLE9BQU8sTUFBTSxDQUFDO0FBQUEsWUFDMUIsR0FBSSxPQUFPLElBQUksQ0FBQyxHQUFHLE1BQU0sR0FBRyxDQUFDLEdBQUcsSUFBSSxPQUFPLElBQUksQ0FBQyxDQUFDLEVBQUU7QUFBQSxVQUNyRCxFQUFFLEtBQUssR0FBRztBQUFBLFFBQ1o7QUFFQSxlQUFPLEdBQUcsTUFBTSxHQUFHLElBQUk7QUFBQSxNQUN6QjtBQUdBLFVBQU0sZUFBTixNQUFtQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFFBT2pCLFlBQVksV0FBVyxTQUFTO0FBQzlCLGVBQUssU0FBUztBQUNkLGVBQUssY0FBYyxRQUFRO0FBQzNCLG9CQUFVLEtBQUssSUFBSTtBQUFBLFFBQ3JCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxRQU1BLFFBQVEsTUFBTTtBQUNaLGVBQUssVUFBVSxXQUFXLElBQUk7QUFBQSxRQUNoQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsUUFNQSxTQUFTLE1BQU07QUFDYixjQUFJLENBQUMsa0JBQWtCLElBQUksRUFBRztBQUU5QixnQkFBTSxZQUFZO0FBQUEsWUFBZ0IsS0FBSztBQUFBLFlBQ3JDLEVBQUUsUUFBUSxLQUFLLFlBQVk7QUFBQSxVQUFDO0FBQzlCLGVBQUssS0FBSyxTQUFTO0FBQUEsUUFDckI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFFBTUEsVUFBVSxNQUFNO0FBQ2QsY0FBSSxDQUFDLGtCQUFrQixJQUFJLEVBQUc7QUFFOUIsZUFBSyxVQUFVO0FBQUEsUUFDakI7QUFBQTtBQUFBO0FBQUE7QUFBQSxRQUtBLFFBQVE7QUFDTixpQkFBTyxLQUFLO0FBQUEsUUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxRQVFBLEtBQUssV0FBVztBQUNkLGVBQUssVUFBVSxnQkFBZ0IsU0FBUztBQUFBLFFBQzFDO0FBQUEsTUFDRjtBQVFBLFVBQU0sVUFBVSxDQUFDLE9BQU8sQ0FBQyxNQUFNO0FBRTdCLGNBQU0sU0FBUyxFQUFFLFVBQVUsQ0FBQyxFQUFFO0FBQzlCLGVBQU8sT0FBTyxRQUFRLElBQUk7QUFDMUIsZUFBTztBQUFBLE1BQ1Q7QUFFQSxVQUFNLFlBQU4sTUFBTSxXQUFVO0FBQUEsUUFDZCxjQUFjO0FBRVosZUFBSyxXQUFXLFFBQVE7QUFDeEIsZUFBSyxRQUFRLENBQUMsS0FBSyxRQUFRO0FBQUEsUUFDN0I7QUFBQSxRQUVBLElBQUksTUFBTTtBQUNSLGlCQUFPLEtBQUssTUFBTSxLQUFLLE1BQU0sU0FBUyxDQUFDO0FBQUEsUUFDekM7QUFBQSxRQUVBLElBQUksT0FBTztBQUFFLGlCQUFPLEtBQUs7QUFBQSxRQUFVO0FBQUE7QUFBQSxRQUduQyxJQUFJLE1BQU07QUFDUixlQUFLLElBQUksU0FBUyxLQUFLLElBQUk7QUFBQSxRQUM3QjtBQUFBO0FBQUEsUUFHQSxTQUFTLE9BQU87QUFFZCxnQkFBTSxPQUFPLFFBQVEsRUFBRSxNQUFNLENBQUM7QUFDOUIsZUFBSyxJQUFJLElBQUk7QUFDYixlQUFLLE1BQU0sS0FBSyxJQUFJO0FBQUEsUUFDdEI7QUFBQSxRQUVBLFlBQVk7QUFDVixjQUFJLEtBQUssTUFBTSxTQUFTLEdBQUc7QUFDekIsbUJBQU8sS0FBSyxNQUFNLElBQUk7QUFBQSxVQUN4QjtBQUVBLGlCQUFPO0FBQUEsUUFDVDtBQUFBLFFBRUEsZ0JBQWdCO0FBQ2QsaUJBQU8sS0FBSyxVQUFVLEVBQUU7QUFBQSxRQUMxQjtBQUFBLFFBRUEsU0FBUztBQUNQLGlCQUFPLEtBQUssVUFBVSxLQUFLLFVBQVUsTUFBTSxDQUFDO0FBQUEsUUFDOUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFFBTUEsS0FBSyxTQUFTO0FBRVosaUJBQU8sS0FBSyxZQUFZLE1BQU0sU0FBUyxLQUFLLFFBQVE7QUFBQSxRQUd0RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsUUFNQSxPQUFPLE1BQU0sU0FBUyxNQUFNO0FBQzFCLGNBQUksT0FBTyxTQUFTLFVBQVU7QUFDNUIsb0JBQVEsUUFBUSxJQUFJO0FBQUEsVUFDdEIsV0FBVyxLQUFLLFVBQVU7QUFDeEIsb0JBQVEsU0FBUyxJQUFJO0FBQ3JCLGlCQUFLLFNBQVMsUUFBUSxDQUFDLFVBQVUsS0FBSyxNQUFNLFNBQVMsS0FBSyxDQUFDO0FBQzNELG9CQUFRLFVBQVUsSUFBSTtBQUFBLFVBQ3hCO0FBQ0EsaUJBQU87QUFBQSxRQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUEsUUFLQSxPQUFPLFVBQVUsTUFBTTtBQUNyQixjQUFJLE9BQU8sU0FBUyxTQUFVO0FBQzlCLGNBQUksQ0FBQyxLQUFLLFNBQVU7QUFFcEIsY0FBSSxLQUFLLFNBQVMsTUFBTSxRQUFNLE9BQU8sT0FBTyxRQUFRLEdBQUc7QUFHckQsaUJBQUssV0FBVyxDQUFDLEtBQUssU0FBUyxLQUFLLEVBQUUsQ0FBQztBQUFBLFVBQ3pDLE9BQU87QUFDTCxpQkFBSyxTQUFTLFFBQVEsQ0FBQyxVQUFVO0FBQy9CLHlCQUFVLFVBQVUsS0FBSztBQUFBLFlBQzNCLENBQUM7QUFBQSxVQUNIO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFvQkEsVUFBTSxtQkFBTixjQUErQixVQUFVO0FBQUE7QUFBQTtBQUFBO0FBQUEsUUFJdkMsWUFBWSxTQUFTO0FBQ25CLGdCQUFNO0FBQ04sZUFBSyxVQUFVO0FBQUEsUUFDakI7QUFBQTtBQUFBO0FBQUE7QUFBQSxRQUtBLFFBQVEsTUFBTTtBQUNaLGNBQUksU0FBUyxJQUFJO0FBQUU7QUFBQSxVQUFRO0FBRTNCLGVBQUssSUFBSSxJQUFJO0FBQUEsUUFDZjtBQUFBO0FBQUEsUUFHQSxXQUFXLE9BQU87QUFDaEIsZUFBSyxTQUFTLEtBQUs7QUFBQSxRQUNyQjtBQUFBLFFBRUEsV0FBVztBQUNULGVBQUssVUFBVTtBQUFBLFFBQ2pCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxRQU1BLGlCQUFpQixTQUFTLE1BQU07QUFFOUIsZ0JBQU0sT0FBTyxRQUFRO0FBQ3JCLGNBQUksS0FBTSxNQUFLLFFBQVEsWUFBWSxJQUFJO0FBRXZDLGVBQUssSUFBSSxJQUFJO0FBQUEsUUFDZjtBQUFBLFFBRUEsU0FBUztBQUNQLGdCQUFNQSxZQUFXLElBQUksYUFBYSxNQUFNLEtBQUssT0FBTztBQUNwRCxpQkFBT0EsVUFBUyxNQUFNO0FBQUEsUUFDeEI7QUFBQSxRQUVBLFdBQVc7QUFDVCxlQUFLLGNBQWM7QUFDbkIsaUJBQU87QUFBQSxRQUNUO0FBQUEsTUFDRjtBQVdBLGVBQVMsT0FBTyxJQUFJO0FBQ2xCLFlBQUksQ0FBQyxHQUFJLFFBQU87QUFDaEIsWUFBSSxPQUFPLE9BQU8sU0FBVSxRQUFPO0FBRW5DLGVBQU8sR0FBRztBQUFBLE1BQ1o7QUFNQSxlQUFTLFVBQVUsSUFBSTtBQUNyQixlQUFPLE9BQU8sT0FBTyxJQUFJLEdBQUc7QUFBQSxNQUM5QjtBQU1BLGVBQVMsaUJBQWlCLElBQUk7QUFDNUIsZUFBTyxPQUFPLE9BQU8sSUFBSSxJQUFJO0FBQUEsTUFDL0I7QUFNQSxlQUFTLFNBQVMsSUFBSTtBQUNwQixlQUFPLE9BQU8sT0FBTyxJQUFJLElBQUk7QUFBQSxNQUMvQjtBQU1BLGVBQVMsVUFBVSxNQUFNO0FBQ3ZCLGNBQU0sU0FBUyxLQUFLLElBQUksQ0FBQyxNQUFNLE9BQU8sQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFO0FBQ2pELGVBQU87QUFBQSxNQUNUO0FBTUEsZUFBUyxxQkFBcUIsTUFBTTtBQUNsQyxjQUFNLE9BQU8sS0FBSyxLQUFLLFNBQVMsQ0FBQztBQUVqQyxZQUFJLE9BQU8sU0FBUyxZQUFZLEtBQUssZ0JBQWdCLFFBQVE7QUFDM0QsZUFBSyxPQUFPLEtBQUssU0FBUyxHQUFHLENBQUM7QUFDOUIsaUJBQU87QUFBQSxRQUNULE9BQU87QUFDTCxpQkFBTyxDQUFDO0FBQUEsUUFDVjtBQUFBLE1BQ0Y7QUFXQSxlQUFTLFVBQVUsTUFBTTtBQUV2QixjQUFNLE9BQU8scUJBQXFCLElBQUk7QUFDdEMsY0FBTSxTQUFTLE9BQ1YsS0FBSyxVQUFVLEtBQUssUUFDckIsS0FBSyxJQUFJLENBQUMsTUFBTSxPQUFPLENBQUMsQ0FBQyxFQUFFLEtBQUssR0FBRyxJQUFJO0FBQzNDLGVBQU87QUFBQSxNQUNUO0FBTUEsZUFBUyxpQkFBaUIsSUFBSTtBQUM1QixlQUFRLElBQUksT0FBTyxHQUFHLFNBQVMsSUFBSSxHQUFHLEVBQUcsS0FBSyxFQUFFLEVBQUUsU0FBUztBQUFBLE1BQzdEO0FBT0EsZUFBUyxXQUFXLElBQUksUUFBUTtBQUM5QixjQUFNLFFBQVEsTUFBTSxHQUFHLEtBQUssTUFBTTtBQUNsQyxlQUFPLFNBQVMsTUFBTSxVQUFVO0FBQUEsTUFDbEM7QUFTQSxVQUFNLGFBQWE7QUFhbkIsZUFBUyx1QkFBdUIsU0FBUyxFQUFFLFNBQVMsR0FBRztBQUNyRCxZQUFJLGNBQWM7QUFFbEIsZUFBTyxRQUFRLElBQUksQ0FBQyxVQUFVO0FBQzVCLHlCQUFlO0FBQ2YsZ0JBQU0sU0FBUztBQUNmLGNBQUksS0FBSyxPQUFPLEtBQUs7QUFDckIsY0FBSSxNQUFNO0FBRVYsaUJBQU8sR0FBRyxTQUFTLEdBQUc7QUFDcEIsa0JBQU0sUUFBUSxXQUFXLEtBQUssRUFBRTtBQUNoQyxnQkFBSSxDQUFDLE9BQU87QUFDVixxQkFBTztBQUNQO0FBQUEsWUFDRjtBQUNBLG1CQUFPLEdBQUcsVUFBVSxHQUFHLE1BQU0sS0FBSztBQUNsQyxpQkFBSyxHQUFHLFVBQVUsTUFBTSxRQUFRLE1BQU0sQ0FBQyxFQUFFLE1BQU07QUFDL0MsZ0JBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLFFBQVEsTUFBTSxDQUFDLEdBQUc7QUFFcEMscUJBQU8sT0FBTyxPQUFPLE9BQU8sTUFBTSxDQUFDLENBQUMsSUFBSSxNQUFNO0FBQUEsWUFDaEQsT0FBTztBQUNMLHFCQUFPLE1BQU0sQ0FBQztBQUNkLGtCQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUs7QUFDcEI7QUFBQSxjQUNGO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFDQSxpQkFBTztBQUFBLFFBQ1QsQ0FBQyxFQUFFLElBQUksUUFBTSxJQUFJLEVBQUUsR0FBRyxFQUFFLEtBQUssUUFBUTtBQUFBLE1BQ3ZDO0FBTUEsVUFBTSxtQkFBbUI7QUFDekIsVUFBTUMsWUFBVztBQUNqQixVQUFNLHNCQUFzQjtBQUM1QixVQUFNLFlBQVk7QUFDbEIsVUFBTSxjQUFjO0FBQ3BCLFVBQU0sbUJBQW1CO0FBQ3pCLFVBQU0saUJBQWlCO0FBS3ZCLFVBQU0sVUFBVSxDQUFDLE9BQU8sQ0FBQyxNQUFNO0FBQzdCLGNBQU0sZUFBZTtBQUNyQixZQUFJLEtBQUssUUFBUTtBQUNmLGVBQUssUUFBUTtBQUFBLFlBQ1g7QUFBQSxZQUNBO0FBQUEsWUFDQSxLQUFLO0FBQUEsWUFDTDtBQUFBLFVBQU07QUFBQSxRQUNWO0FBQ0EsZUFBTyxVQUFVO0FBQUEsVUFDZixPQUFPO0FBQUEsVUFDUCxPQUFPO0FBQUEsVUFDUCxLQUFLO0FBQUEsVUFDTCxXQUFXO0FBQUE7QUFBQSxVQUVYLFlBQVksQ0FBQyxHQUFHLFNBQVM7QUFDdkIsZ0JBQUksRUFBRSxVQUFVLEVBQUcsTUFBSyxZQUFZO0FBQUEsVUFDdEM7QUFBQSxRQUNGLEdBQUcsSUFBSTtBQUFBLE1BQ1Q7QUFHQSxVQUFNLG1CQUFtQjtBQUFBLFFBQ3ZCLE9BQU87QUFBQSxRQUFnQixXQUFXO0FBQUEsTUFDcEM7QUFDQSxVQUFNLG1CQUFtQjtBQUFBLFFBQ3ZCLE9BQU87QUFBQSxRQUNQLE9BQU87QUFBQSxRQUNQLEtBQUs7QUFBQSxRQUNMLFNBQVM7QUFBQSxRQUNULFVBQVUsQ0FBQyxnQkFBZ0I7QUFBQSxNQUM3QjtBQUNBLFVBQU0sb0JBQW9CO0FBQUEsUUFDeEIsT0FBTztBQUFBLFFBQ1AsT0FBTztBQUFBLFFBQ1AsS0FBSztBQUFBLFFBQ0wsU0FBUztBQUFBLFFBQ1QsVUFBVSxDQUFDLGdCQUFnQjtBQUFBLE1BQzdCO0FBQ0EsVUFBTSxxQkFBcUI7QUFBQSxRQUN6QixPQUFPO0FBQUEsTUFDVDtBQVNBLFVBQU0sVUFBVSxTQUFTLE9BQU8sS0FBSyxjQUFjLENBQUMsR0FBRztBQUNyRCxjQUFNLE9BQU87QUFBQSxVQUNYO0FBQUEsWUFDRSxPQUFPO0FBQUEsWUFDUDtBQUFBLFlBQ0E7QUFBQSxZQUNBLFVBQVUsQ0FBQztBQUFBLFVBQ2I7QUFBQSxVQUNBO0FBQUEsUUFDRjtBQUNBLGFBQUssU0FBUyxLQUFLO0FBQUEsVUFDakIsT0FBTztBQUFBO0FBQUE7QUFBQSxVQUdQLE9BQU87QUFBQSxVQUNQLEtBQUs7QUFBQSxVQUNMLGNBQWM7QUFBQSxVQUNkLFdBQVc7QUFBQSxRQUNiLENBQUM7QUFDRCxjQUFNLGVBQWU7QUFBQTtBQUFBLFVBRW5CO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBO0FBQUEsVUFFQTtBQUFBO0FBQUEsVUFDQTtBQUFBO0FBQUEsVUFDQTtBQUFBO0FBQUEsUUFDRjtBQUVBLGFBQUssU0FBUztBQUFBLFVBQ1o7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFlBZ0JFLE9BQU87QUFBQSxjQUNMO0FBQUE7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLGNBQ0E7QUFBQSxjQUNBO0FBQUEsWUFBTTtBQUFBO0FBQUEsVUFDVjtBQUFBLFFBQ0Y7QUFDQSxlQUFPO0FBQUEsTUFDVDtBQUNBLFVBQU0sc0JBQXNCLFFBQVEsTUFBTSxHQUFHO0FBQzdDLFVBQU0sdUJBQXVCLFFBQVEsUUFBUSxNQUFNO0FBQ25ELFVBQU0sb0JBQW9CLFFBQVEsS0FBSyxHQUFHO0FBQzFDLFVBQU0sY0FBYztBQUFBLFFBQ2xCLE9BQU87QUFBQSxRQUNQLE9BQU87QUFBQSxRQUNQLFdBQVc7QUFBQSxNQUNiO0FBQ0EsVUFBTSxnQkFBZ0I7QUFBQSxRQUNwQixPQUFPO0FBQUEsUUFDUCxPQUFPO0FBQUEsUUFDUCxXQUFXO0FBQUEsTUFDYjtBQUNBLFVBQU0scUJBQXFCO0FBQUEsUUFDekIsT0FBTztBQUFBLFFBQ1AsT0FBTztBQUFBLFFBQ1AsV0FBVztBQUFBLE1BQ2I7QUFDQSxVQUFNLGNBQWM7QUFBQSxRQUNsQixPQUFPO0FBQUEsUUFDUCxPQUFPO0FBQUEsUUFDUCxLQUFLO0FBQUEsUUFDTCxVQUFVO0FBQUEsVUFDUjtBQUFBLFVBQ0E7QUFBQSxZQUNFLE9BQU87QUFBQSxZQUNQLEtBQUs7QUFBQSxZQUNMLFdBQVc7QUFBQSxZQUNYLFVBQVUsQ0FBQyxnQkFBZ0I7QUFBQSxVQUM3QjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQ0EsVUFBTSxhQUFhO0FBQUEsUUFDakIsT0FBTztBQUFBLFFBQ1AsT0FBT0E7QUFBQSxRQUNQLFdBQVc7QUFBQSxNQUNiO0FBQ0EsVUFBTSx3QkFBd0I7QUFBQSxRQUM1QixPQUFPO0FBQUEsUUFDUCxPQUFPO0FBQUEsUUFDUCxXQUFXO0FBQUEsTUFDYjtBQUNBLFVBQU0sZUFBZTtBQUFBO0FBQUEsUUFFbkIsT0FBTyxZQUFZO0FBQUEsUUFDbkIsV0FBVztBQUFBLE1BQ2I7QUFTQSxVQUFNLG9CQUFvQixTQUFTLE1BQU07QUFDdkMsZUFBTyxPQUFPO0FBQUEsVUFBTztBQUFBLFVBQ25CO0FBQUE7QUFBQSxZQUVFLFlBQVksQ0FBQyxHQUFHLFNBQVM7QUFBRSxtQkFBSyxLQUFLLGNBQWMsRUFBRSxDQUFDO0FBQUEsWUFBRztBQUFBO0FBQUEsWUFFekQsVUFBVSxDQUFDLEdBQUcsU0FBUztBQUFFLGtCQUFJLEtBQUssS0FBSyxnQkFBZ0IsRUFBRSxDQUFDLEVBQUcsTUFBSyxZQUFZO0FBQUEsWUFBRztBQUFBLFVBQ25GO0FBQUEsUUFBQztBQUFBLE1BQ0w7QUFFQSxVQUFJLFFBQXFCLHVCQUFPLE9BQU87QUFBQSxRQUNyQyxXQUFXO0FBQUEsUUFDWDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBLFVBQVVBO0FBQUEsUUFDVjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRixDQUFDO0FBK0JELGVBQVMsc0JBQXNCLE9BQU8sVUFBVTtBQUM5QyxjQUFNLFNBQVMsTUFBTSxNQUFNLE1BQU0sUUFBUSxDQUFDO0FBQzFDLFlBQUksV0FBVyxLQUFLO0FBQ2xCLG1CQUFTLFlBQVk7QUFBQSxRQUN2QjtBQUFBLE1BQ0Y7QUFNQSxlQUFTLGVBQWUsTUFBTSxTQUFTO0FBRXJDLFlBQUksS0FBSyxjQUFjLFFBQVc7QUFDaEMsZUFBSyxRQUFRLEtBQUs7QUFDbEIsaUJBQU8sS0FBSztBQUFBLFFBQ2Q7QUFBQSxNQUNGO0FBTUEsZUFBUyxjQUFjLE1BQU0sUUFBUTtBQUNuQyxZQUFJLENBQUMsT0FBUTtBQUNiLFlBQUksQ0FBQyxLQUFLLGNBQWU7QUFPekIsYUFBSyxRQUFRLFNBQVMsS0FBSyxjQUFjLE1BQU0sR0FBRyxFQUFFLEtBQUssR0FBRyxJQUFJO0FBQ2hFLGFBQUssZ0JBQWdCO0FBQ3JCLGFBQUssV0FBVyxLQUFLLFlBQVksS0FBSztBQUN0QyxlQUFPLEtBQUs7QUFLWixZQUFJLEtBQUssY0FBYyxPQUFXLE1BQUssWUFBWTtBQUFBLE1BQ3JEO0FBTUEsZUFBUyxlQUFlLE1BQU0sU0FBUztBQUNyQyxZQUFJLENBQUMsTUFBTSxRQUFRLEtBQUssT0FBTyxFQUFHO0FBRWxDLGFBQUssVUFBVSxPQUFPLEdBQUcsS0FBSyxPQUFPO0FBQUEsTUFDdkM7QUFNQSxlQUFTLGFBQWEsTUFBTSxTQUFTO0FBQ25DLFlBQUksQ0FBQyxLQUFLLE1BQU87QUFDakIsWUFBSSxLQUFLLFNBQVMsS0FBSyxJQUFLLE9BQU0sSUFBSSxNQUFNLDBDQUEwQztBQUV0RixhQUFLLFFBQVEsS0FBSztBQUNsQixlQUFPLEtBQUs7QUFBQSxNQUNkO0FBTUEsZUFBUyxpQkFBaUIsTUFBTSxTQUFTO0FBRXZDLFlBQUksS0FBSyxjQUFjLE9BQVcsTUFBSyxZQUFZO0FBQUEsTUFDckQ7QUFJQSxVQUFNLGlCQUFpQixDQUFDLE1BQU0sV0FBVztBQUN2QyxZQUFJLENBQUMsS0FBSyxZQUFhO0FBR3ZCLFlBQUksS0FBSyxPQUFRLE9BQU0sSUFBSSxNQUFNLHdDQUF3QztBQUV6RSxjQUFNLGVBQWUsT0FBTyxPQUFPLENBQUMsR0FBRyxJQUFJO0FBQzNDLGVBQU8sS0FBSyxJQUFJLEVBQUUsUUFBUSxDQUFDLFFBQVE7QUFBRSxpQkFBTyxLQUFLLEdBQUc7QUFBQSxRQUFHLENBQUM7QUFFeEQsYUFBSyxXQUFXLGFBQWE7QUFDN0IsYUFBSyxRQUFRLE9BQU8sYUFBYSxhQUFhLFVBQVUsYUFBYSxLQUFLLENBQUM7QUFDM0UsYUFBSyxTQUFTO0FBQUEsVUFDWixXQUFXO0FBQUEsVUFDWCxVQUFVO0FBQUEsWUFDUixPQUFPLE9BQU8sY0FBYyxFQUFFLFlBQVksS0FBSyxDQUFDO0FBQUEsVUFDbEQ7QUFBQSxRQUNGO0FBQ0EsYUFBSyxZQUFZO0FBRWpCLGVBQU8sYUFBYTtBQUFBLE1BQ3RCO0FBR0EsVUFBTSxrQkFBa0I7QUFBQSxRQUN0QjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUE7QUFBQSxRQUNBO0FBQUE7QUFBQSxRQUNBO0FBQUE7QUFBQSxNQUNGO0FBRUEsVUFBTSx3QkFBd0I7QUFROUIsZUFBUyxnQkFBZ0IsYUFBYSxpQkFBaUIsWUFBWSx1QkFBdUI7QUFFeEYsY0FBTSxtQkFBbUIsdUJBQU8sT0FBTyxJQUFJO0FBSTNDLFlBQUksT0FBTyxnQkFBZ0IsVUFBVTtBQUNuQyxzQkFBWSxXQUFXLFlBQVksTUFBTSxHQUFHLENBQUM7QUFBQSxRQUMvQyxXQUFXLE1BQU0sUUFBUSxXQUFXLEdBQUc7QUFDckMsc0JBQVksV0FBVyxXQUFXO0FBQUEsUUFDcEMsT0FBTztBQUNMLGlCQUFPLEtBQUssV0FBVyxFQUFFLFFBQVEsU0FBU0MsWUFBVztBQUVuRCxtQkFBTztBQUFBLGNBQ0w7QUFBQSxjQUNBLGdCQUFnQixZQUFZQSxVQUFTLEdBQUcsaUJBQWlCQSxVQUFTO0FBQUEsWUFDcEU7QUFBQSxVQUNGLENBQUM7QUFBQSxRQUNIO0FBQ0EsZUFBTztBQVlQLGlCQUFTLFlBQVlBLFlBQVcsYUFBYTtBQUMzQyxjQUFJLGlCQUFpQjtBQUNuQiwwQkFBYyxZQUFZLElBQUksT0FBSyxFQUFFLFlBQVksQ0FBQztBQUFBLFVBQ3BEO0FBQ0Esc0JBQVksUUFBUSxTQUFTLFNBQVM7QUFDcEMsa0JBQU0sT0FBTyxRQUFRLE1BQU0sR0FBRztBQUM5Qiw2QkFBaUIsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDQSxZQUFXLGdCQUFnQixLQUFLLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQUEsVUFDM0UsQ0FBQztBQUFBLFFBQ0g7QUFBQSxNQUNGO0FBVUEsZUFBUyxnQkFBZ0IsU0FBUyxlQUFlO0FBRy9DLFlBQUksZUFBZTtBQUNqQixpQkFBTyxPQUFPLGFBQWE7QUFBQSxRQUM3QjtBQUVBLGVBQU8sY0FBYyxPQUFPLElBQUksSUFBSTtBQUFBLE1BQ3RDO0FBTUEsZUFBUyxjQUFjLFNBQVM7QUFDOUIsZUFBTyxnQkFBZ0IsU0FBUyxRQUFRLFlBQVksQ0FBQztBQUFBLE1BQ3ZEO0FBWUEsVUFBTSxtQkFBbUIsQ0FBQztBQUsxQixVQUFNLFFBQVEsQ0FBQyxZQUFZO0FBQ3pCLGdCQUFRLE1BQU0sT0FBTztBQUFBLE1BQ3ZCO0FBTUEsVUFBTSxPQUFPLENBQUMsWUFBWSxTQUFTO0FBQ2pDLGdCQUFRLElBQUksU0FBUyxPQUFPLElBQUksR0FBRyxJQUFJO0FBQUEsTUFDekM7QUFNQSxVQUFNLGFBQWEsQ0FBQ0MsVUFBUyxZQUFZO0FBQ3ZDLFlBQUksaUJBQWlCLEdBQUdBLFFBQU8sSUFBSSxPQUFPLEVBQUUsRUFBRztBQUUvQyxnQkFBUSxJQUFJLG9CQUFvQkEsUUFBTyxLQUFLLE9BQU8sRUFBRTtBQUNyRCx5QkFBaUIsR0FBR0EsUUFBTyxJQUFJLE9BQU8sRUFBRSxJQUFJO0FBQUEsTUFDOUM7QUFRQSxVQUFNLGtCQUFrQixJQUFJLE1BQU07QUE4QmxDLGVBQVMsZ0JBQWdCLE1BQU0sU0FBUyxFQUFFLElBQUksR0FBRztBQUMvQyxZQUFJLFNBQVM7QUFDYixjQUFNLGFBQWEsS0FBSyxHQUFHO0FBRTNCLGNBQU0sT0FBTyxDQUFDO0FBRWQsY0FBTSxZQUFZLENBQUM7QUFFbkIsaUJBQVMsSUFBSSxHQUFHLEtBQUssUUFBUSxRQUFRLEtBQUs7QUFDeEMsb0JBQVUsSUFBSSxNQUFNLElBQUksV0FBVyxDQUFDO0FBQ3BDLGVBQUssSUFBSSxNQUFNLElBQUk7QUFDbkIsb0JBQVUsaUJBQWlCLFFBQVEsSUFBSSxDQUFDLENBQUM7QUFBQSxRQUMzQztBQUdBLGFBQUssR0FBRyxJQUFJO0FBQ1osYUFBSyxHQUFHLEVBQUUsUUFBUTtBQUNsQixhQUFLLEdBQUcsRUFBRSxTQUFTO0FBQUEsTUFDckI7QUFLQSxlQUFTLGdCQUFnQixNQUFNO0FBQzdCLFlBQUksQ0FBQyxNQUFNLFFBQVEsS0FBSyxLQUFLLEVBQUc7QUFFaEMsWUFBSSxLQUFLLFFBQVEsS0FBSyxnQkFBZ0IsS0FBSyxhQUFhO0FBQ3RELGdCQUFNLG9FQUFvRTtBQUMxRSxnQkFBTTtBQUFBLFFBQ1I7QUFFQSxZQUFJLE9BQU8sS0FBSyxlQUFlLFlBQVksS0FBSyxlQUFlLE1BQU07QUFDbkUsZ0JBQU0sMkJBQTJCO0FBQ2pDLGdCQUFNO0FBQUEsUUFDUjtBQUVBLHdCQUFnQixNQUFNLEtBQUssT0FBTyxFQUFFLEtBQUssYUFBYSxDQUFDO0FBQ3ZELGFBQUssUUFBUSx1QkFBdUIsS0FBSyxPQUFPLEVBQUUsVUFBVSxHQUFHLENBQUM7QUFBQSxNQUNsRTtBQUtBLGVBQVMsY0FBYyxNQUFNO0FBQzNCLFlBQUksQ0FBQyxNQUFNLFFBQVEsS0FBSyxHQUFHLEVBQUc7QUFFOUIsWUFBSSxLQUFLLFFBQVEsS0FBSyxjQUFjLEtBQUssV0FBVztBQUNsRCxnQkFBTSw4REFBOEQ7QUFDcEUsZ0JBQU07QUFBQSxRQUNSO0FBRUEsWUFBSSxPQUFPLEtBQUssYUFBYSxZQUFZLEtBQUssYUFBYSxNQUFNO0FBQy9ELGdCQUFNLHlCQUF5QjtBQUMvQixnQkFBTTtBQUFBLFFBQ1I7QUFFQSx3QkFBZ0IsTUFBTSxLQUFLLEtBQUssRUFBRSxLQUFLLFdBQVcsQ0FBQztBQUNuRCxhQUFLLE1BQU0sdUJBQXVCLEtBQUssS0FBSyxFQUFFLFVBQVUsR0FBRyxDQUFDO0FBQUEsTUFDOUQ7QUFhQSxlQUFTLFdBQVcsTUFBTTtBQUN4QixZQUFJLEtBQUssU0FBUyxPQUFPLEtBQUssVUFBVSxZQUFZLEtBQUssVUFBVSxNQUFNO0FBQ3ZFLGVBQUssYUFBYSxLQUFLO0FBQ3ZCLGlCQUFPLEtBQUs7QUFBQSxRQUNkO0FBQUEsTUFDRjtBQUtBLGVBQVMsV0FBVyxNQUFNO0FBQ3hCLG1CQUFXLElBQUk7QUFFZixZQUFJLE9BQU8sS0FBSyxlQUFlLFVBQVU7QUFDdkMsZUFBSyxhQUFhLEVBQUUsT0FBTyxLQUFLLFdBQVc7QUFBQSxRQUM3QztBQUNBLFlBQUksT0FBTyxLQUFLLGFBQWEsVUFBVTtBQUNyQyxlQUFLLFdBQVcsRUFBRSxPQUFPLEtBQUssU0FBUztBQUFBLFFBQ3pDO0FBRUEsd0JBQWdCLElBQUk7QUFDcEIsc0JBQWMsSUFBSTtBQUFBLE1BQ3BCO0FBb0JBLGVBQVMsZ0JBQWdCLFVBQVU7QUFPakMsaUJBQVMsT0FBTyxPQUFPLFFBQVE7QUFDN0IsaUJBQU8sSUFBSTtBQUFBLFlBQ1QsT0FBTyxLQUFLO0FBQUEsWUFDWixPQUNHLFNBQVMsbUJBQW1CLE1BQU0sT0FDbEMsU0FBUyxlQUFlLE1BQU0sT0FDOUIsU0FBUyxNQUFNO0FBQUEsVUFDcEI7QUFBQSxRQUNGO0FBQUEsUUFlQSxNQUFNLFdBQVc7QUFBQSxVQUNmLGNBQWM7QUFDWixpQkFBSyxlQUFlLENBQUM7QUFFckIsaUJBQUssVUFBVSxDQUFDO0FBQ2hCLGlCQUFLLFVBQVU7QUFDZixpQkFBSyxXQUFXO0FBQUEsVUFDbEI7QUFBQTtBQUFBLFVBR0EsUUFBUSxJQUFJLE1BQU07QUFDaEIsaUJBQUssV0FBVyxLQUFLO0FBRXJCLGlCQUFLLGFBQWEsS0FBSyxPQUFPLElBQUk7QUFDbEMsaUJBQUssUUFBUSxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDNUIsaUJBQUssV0FBVyxpQkFBaUIsRUFBRSxJQUFJO0FBQUEsVUFDekM7QUFBQSxVQUVBLFVBQVU7QUFDUixnQkFBSSxLQUFLLFFBQVEsV0FBVyxHQUFHO0FBRzdCLG1CQUFLLE9BQU8sTUFBTTtBQUFBLFlBQ3BCO0FBQ0Esa0JBQU0sY0FBYyxLQUFLLFFBQVEsSUFBSSxRQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ2hELGlCQUFLLFlBQVksT0FBTyx1QkFBdUIsYUFBYSxFQUFFLFVBQVUsSUFBSSxDQUFDLEdBQUcsSUFBSTtBQUNwRixpQkFBSyxZQUFZO0FBQUEsVUFDbkI7QUFBQTtBQUFBLFVBR0EsS0FBSyxHQUFHO0FBQ04saUJBQUssVUFBVSxZQUFZLEtBQUs7QUFDaEMsa0JBQU0sUUFBUSxLQUFLLFVBQVUsS0FBSyxDQUFDO0FBQ25DLGdCQUFJLENBQUMsT0FBTztBQUFFLHFCQUFPO0FBQUEsWUFBTTtBQUczQixrQkFBTSxJQUFJLE1BQU0sVUFBVSxDQUFDLElBQUlDLE9BQU1BLEtBQUksS0FBSyxPQUFPLE1BQVM7QUFFOUQsa0JBQU0sWUFBWSxLQUFLLGFBQWEsQ0FBQztBQUdyQyxrQkFBTSxPQUFPLEdBQUcsQ0FBQztBQUVqQixtQkFBTyxPQUFPLE9BQU8sT0FBTyxTQUFTO0FBQUEsVUFDdkM7QUFBQSxRQUNGO0FBQUEsUUFpQ0EsTUFBTSxvQkFBb0I7QUFBQSxVQUN4QixjQUFjO0FBRVosaUJBQUssUUFBUSxDQUFDO0FBRWQsaUJBQUssZUFBZSxDQUFDO0FBQ3JCLGlCQUFLLFFBQVE7QUFFYixpQkFBSyxZQUFZO0FBQ2pCLGlCQUFLLGFBQWE7QUFBQSxVQUNwQjtBQUFBO0FBQUEsVUFHQSxXQUFXLE9BQU87QUFDaEIsZ0JBQUksS0FBSyxhQUFhLEtBQUssRUFBRyxRQUFPLEtBQUssYUFBYSxLQUFLO0FBRTVELGtCQUFNLFVBQVUsSUFBSSxXQUFXO0FBQy9CLGlCQUFLLE1BQU0sTUFBTSxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUMsSUFBSSxJQUFJLE1BQU0sUUFBUSxRQUFRLElBQUksSUFBSSxDQUFDO0FBQ3pFLG9CQUFRLFFBQVE7QUFDaEIsaUJBQUssYUFBYSxLQUFLLElBQUk7QUFDM0IsbUJBQU87QUFBQSxVQUNUO0FBQUEsVUFFQSw2QkFBNkI7QUFDM0IsbUJBQU8sS0FBSyxlQUFlO0FBQUEsVUFDN0I7QUFBQSxVQUVBLGNBQWM7QUFDWixpQkFBSyxhQUFhO0FBQUEsVUFDcEI7QUFBQTtBQUFBLFVBR0EsUUFBUSxJQUFJLE1BQU07QUFDaEIsaUJBQUssTUFBTSxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUM7QUFDMUIsZ0JBQUksS0FBSyxTQUFTLFFBQVMsTUFBSztBQUFBLFVBQ2xDO0FBQUE7QUFBQSxVQUdBLEtBQUssR0FBRztBQUNOLGtCQUFNLElBQUksS0FBSyxXQUFXLEtBQUssVUFBVTtBQUN6QyxjQUFFLFlBQVksS0FBSztBQUNuQixnQkFBSSxTQUFTLEVBQUUsS0FBSyxDQUFDO0FBaUNyQixnQkFBSSxLQUFLLDJCQUEyQixHQUFHO0FBQ3JDLGtCQUFJLFVBQVUsT0FBTyxVQUFVLEtBQUssVUFBVztBQUFBLG1CQUFPO0FBQ3BELHNCQUFNLEtBQUssS0FBSyxXQUFXLENBQUM7QUFDNUIsbUJBQUcsWUFBWSxLQUFLLFlBQVk7QUFDaEMseUJBQVMsR0FBRyxLQUFLLENBQUM7QUFBQSxjQUNwQjtBQUFBLFlBQ0Y7QUFFQSxnQkFBSSxRQUFRO0FBQ1YsbUJBQUssY0FBYyxPQUFPLFdBQVc7QUFDckMsa0JBQUksS0FBSyxlQUFlLEtBQUssT0FBTztBQUVsQyxxQkFBSyxZQUFZO0FBQUEsY0FDbkI7QUFBQSxZQUNGO0FBRUEsbUJBQU87QUFBQSxVQUNUO0FBQUEsUUFDRjtBQVNBLGlCQUFTLGVBQWUsTUFBTTtBQUM1QixnQkFBTSxLQUFLLElBQUksb0JBQW9CO0FBRW5DLGVBQUssU0FBUyxRQUFRLFVBQVEsR0FBRyxRQUFRLEtBQUssT0FBTyxFQUFFLE1BQU0sTUFBTSxNQUFNLFFBQVEsQ0FBQyxDQUFDO0FBRW5GLGNBQUksS0FBSyxlQUFlO0FBQ3RCLGVBQUcsUUFBUSxLQUFLLGVBQWUsRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUFBLFVBQ2hEO0FBQ0EsY0FBSSxLQUFLLFNBQVM7QUFDaEIsZUFBRyxRQUFRLEtBQUssU0FBUyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQUEsVUFDOUM7QUFFQSxpQkFBTztBQUFBLFFBQ1Q7QUF5Q0EsaUJBQVMsWUFBWSxNQUFNLFFBQVE7QUFDakMsZ0JBQU07QUFBQTtBQUFBLFlBQW1DO0FBQUE7QUFDekMsY0FBSSxLQUFLLFdBQVksUUFBTztBQUU1QjtBQUFBLFlBQ0U7QUFBQTtBQUFBO0FBQUEsWUFHQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRixFQUFFLFFBQVEsU0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBRWxDLG1CQUFTLG1CQUFtQixRQUFRLFNBQU8sSUFBSSxNQUFNLE1BQU0sQ0FBQztBQUc1RCxlQUFLLGdCQUFnQjtBQUVyQjtBQUFBLFlBQ0U7QUFBQTtBQUFBO0FBQUEsWUFHQTtBQUFBO0FBQUEsWUFFQTtBQUFBLFVBQ0YsRUFBRSxRQUFRLFNBQU8sSUFBSSxNQUFNLE1BQU0sQ0FBQztBQUVsQyxlQUFLLGFBQWE7QUFFbEIsY0FBSSxpQkFBaUI7QUFDckIsY0FBSSxPQUFPLEtBQUssYUFBYSxZQUFZLEtBQUssU0FBUyxVQUFVO0FBSS9ELGlCQUFLLFdBQVcsT0FBTyxPQUFPLENBQUMsR0FBRyxLQUFLLFFBQVE7QUFDL0MsNkJBQWlCLEtBQUssU0FBUztBQUMvQixtQkFBTyxLQUFLLFNBQVM7QUFBQSxVQUN2QjtBQUNBLDJCQUFpQixrQkFBa0I7QUFFbkMsY0FBSSxLQUFLLFVBQVU7QUFDakIsaUJBQUssV0FBVyxnQkFBZ0IsS0FBSyxVQUFVLFNBQVMsZ0JBQWdCO0FBQUEsVUFDMUU7QUFFQSxnQkFBTSxtQkFBbUIsT0FBTyxnQkFBZ0IsSUFBSTtBQUVwRCxjQUFJLFFBQVE7QUFDVixnQkFBSSxDQUFDLEtBQUssTUFBTyxNQUFLLFFBQVE7QUFDOUIsa0JBQU0sVUFBVSxPQUFPLE1BQU0sS0FBSztBQUNsQyxnQkFBSSxDQUFDLEtBQUssT0FBTyxDQUFDLEtBQUssZUFBZ0IsTUFBSyxNQUFNO0FBQ2xELGdCQUFJLEtBQUssSUFBSyxPQUFNLFFBQVEsT0FBTyxNQUFNLEdBQUc7QUFDNUMsa0JBQU0sZ0JBQWdCLE9BQU8sTUFBTSxHQUFHLEtBQUs7QUFDM0MsZ0JBQUksS0FBSyxrQkFBa0IsT0FBTyxlQUFlO0FBQy9DLG9CQUFNLGtCQUFrQixLQUFLLE1BQU0sTUFBTSxNQUFNLE9BQU87QUFBQSxZQUN4RDtBQUFBLFVBQ0Y7QUFDQSxjQUFJLEtBQUssUUFBUyxPQUFNLFlBQVk7QUFBQTtBQUFBLFlBQXVDLEtBQUs7QUFBQSxVQUFRO0FBQ3hGLGNBQUksQ0FBQyxLQUFLLFNBQVUsTUFBSyxXQUFXLENBQUM7QUFFckMsZUFBSyxXQUFXLENBQUMsRUFBRSxPQUFPLEdBQUcsS0FBSyxTQUFTLElBQUksU0FBUyxHQUFHO0FBQ3pELG1CQUFPLGtCQUFrQixNQUFNLFNBQVMsT0FBTyxDQUFDO0FBQUEsVUFDbEQsQ0FBQyxDQUFDO0FBQ0YsZUFBSyxTQUFTLFFBQVEsU0FBUyxHQUFHO0FBQUU7QUFBQTtBQUFBLGNBQStCO0FBQUEsY0FBSTtBQUFBLFlBQUs7QUFBQSxVQUFHLENBQUM7QUFFaEYsY0FBSSxLQUFLLFFBQVE7QUFDZix3QkFBWSxLQUFLLFFBQVEsTUFBTTtBQUFBLFVBQ2pDO0FBRUEsZ0JBQU0sVUFBVSxlQUFlLEtBQUs7QUFDcEMsaUJBQU87QUFBQSxRQUNUO0FBRUEsWUFBSSxDQUFDLFNBQVMsbUJBQW9CLFVBQVMscUJBQXFCLENBQUM7QUFHakUsWUFBSSxTQUFTLFlBQVksU0FBUyxTQUFTLFNBQVMsTUFBTSxHQUFHO0FBQzNELGdCQUFNLElBQUksTUFBTSwyRkFBMkY7QUFBQSxRQUM3RztBQUdBLGlCQUFTLG1CQUFtQixVQUFVLFNBQVMsb0JBQW9CLENBQUMsQ0FBQztBQUVyRSxlQUFPO0FBQUE7QUFBQSxVQUErQjtBQUFBLFFBQVM7QUFBQSxNQUNqRDtBQWFBLGVBQVMsbUJBQW1CLE1BQU07QUFDaEMsWUFBSSxDQUFDLEtBQU0sUUFBTztBQUVsQixlQUFPLEtBQUssa0JBQWtCLG1CQUFtQixLQUFLLE1BQU07QUFBQSxNQUM5RDtBQVlBLGVBQVMsa0JBQWtCLE1BQU07QUFDL0IsWUFBSSxLQUFLLFlBQVksQ0FBQyxLQUFLLGdCQUFnQjtBQUN6QyxlQUFLLGlCQUFpQixLQUFLLFNBQVMsSUFBSSxTQUFTLFNBQVM7QUFDeEQsbUJBQU8sVUFBVSxNQUFNLEVBQUUsVUFBVSxLQUFLLEdBQUcsT0FBTztBQUFBLFVBQ3BELENBQUM7QUFBQSxRQUNIO0FBS0EsWUFBSSxLQUFLLGdCQUFnQjtBQUN2QixpQkFBTyxLQUFLO0FBQUEsUUFDZDtBQU1BLFlBQUksbUJBQW1CLElBQUksR0FBRztBQUM1QixpQkFBTyxVQUFVLE1BQU0sRUFBRSxRQUFRLEtBQUssU0FBUyxVQUFVLEtBQUssTUFBTSxJQUFJLEtBQUssQ0FBQztBQUFBLFFBQ2hGO0FBRUEsWUFBSSxPQUFPLFNBQVMsSUFBSSxHQUFHO0FBQ3pCLGlCQUFPLFVBQVUsSUFBSTtBQUFBLFFBQ3ZCO0FBR0EsZUFBTztBQUFBLE1BQ1Q7QUFFQSxVQUFJLFVBQVU7QUFFZCxVQUFNLHFCQUFOLGNBQWlDLE1BQU07QUFBQSxRQUNyQyxZQUFZLFFBQVEsTUFBTTtBQUN4QixnQkFBTSxNQUFNO0FBQ1osZUFBSyxPQUFPO0FBQ1osZUFBSyxPQUFPO0FBQUEsUUFDZDtBQUFBLE1BQ0Y7QUErQkEsVUFBTSxTQUFTO0FBQ2YsVUFBTSxVQUFVO0FBQ2hCLFVBQU0sV0FBVyxPQUFPLFNBQVM7QUFDakMsVUFBTSxtQkFBbUI7QUFNekIsVUFBTSxPQUFPLFNBQVMsTUFBTTtBQUcxQixjQUFNLFlBQVksdUJBQU8sT0FBTyxJQUFJO0FBRXBDLGNBQU0sVUFBVSx1QkFBTyxPQUFPLElBQUk7QUFFbEMsY0FBTSxVQUFVLENBQUM7QUFJakIsWUFBSSxZQUFZO0FBQ2hCLGNBQU0scUJBQXFCO0FBRTNCLGNBQU0scUJBQXFCLEVBQUUsbUJBQW1CLE1BQU0sTUFBTSxjQUFjLFVBQVUsQ0FBQyxFQUFFO0FBS3ZGLFlBQUksVUFBVTtBQUFBLFVBQ1oscUJBQXFCO0FBQUEsVUFDckIsb0JBQW9CO0FBQUEsVUFDcEIsZUFBZTtBQUFBLFVBQ2Ysa0JBQWtCO0FBQUEsVUFDbEIsYUFBYTtBQUFBLFVBQ2IsYUFBYTtBQUFBLFVBQ2IsV0FBVztBQUFBO0FBQUE7QUFBQSxVQUdYLFdBQVc7QUFBQSxRQUNiO0FBUUEsaUJBQVMsbUJBQW1CLGNBQWM7QUFDeEMsaUJBQU8sUUFBUSxjQUFjLEtBQUssWUFBWTtBQUFBLFFBQ2hEO0FBS0EsaUJBQVMsY0FBYyxPQUFPO0FBQzVCLGNBQUksVUFBVSxNQUFNLFlBQVk7QUFFaEMscUJBQVcsTUFBTSxhQUFhLE1BQU0sV0FBVyxZQUFZO0FBRzNELGdCQUFNLFFBQVEsUUFBUSxpQkFBaUIsS0FBSyxPQUFPO0FBQ25ELGNBQUksT0FBTztBQUNULGtCQUFNLFdBQVcsWUFBWSxNQUFNLENBQUMsQ0FBQztBQUNyQyxnQkFBSSxDQUFDLFVBQVU7QUFDYixtQkFBSyxtQkFBbUIsUUFBUSxNQUFNLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDL0MsbUJBQUsscURBQXFELEtBQUs7QUFBQSxZQUNqRTtBQUNBLG1CQUFPLFdBQVcsTUFBTSxDQUFDLElBQUk7QUFBQSxVQUMvQjtBQUVBLGlCQUFPLFFBQ0osTUFBTSxLQUFLLEVBQ1gsS0FBSyxDQUFDLFdBQVcsbUJBQW1CLE1BQU0sS0FBSyxZQUFZLE1BQU0sQ0FBQztBQUFBLFFBQ3ZFO0FBdUJBLGlCQUFTQyxXQUFVLG9CQUFvQixlQUFlLGdCQUFnQjtBQUNwRSxjQUFJLE9BQU87QUFDWCxjQUFJLGVBQWU7QUFDbkIsY0FBSSxPQUFPLGtCQUFrQixVQUFVO0FBQ3JDLG1CQUFPO0FBQ1AsNkJBQWlCLGNBQWM7QUFDL0IsMkJBQWUsY0FBYztBQUFBLFVBQy9CLE9BQU87QUFFTCx1QkFBVyxVQUFVLHFEQUFxRDtBQUMxRSx1QkFBVyxVQUFVLHVHQUF1RztBQUM1SCwyQkFBZTtBQUNmLG1CQUFPO0FBQUEsVUFDVDtBQUlBLGNBQUksbUJBQW1CLFFBQVc7QUFBRSw2QkFBaUI7QUFBQSxVQUFNO0FBRzNELGdCQUFNLFVBQVU7QUFBQSxZQUNkO0FBQUEsWUFDQSxVQUFVO0FBQUEsVUFDWjtBQUdBLGVBQUssb0JBQW9CLE9BQU87QUFJaEMsZ0JBQU0sU0FBUyxRQUFRLFNBQ25CLFFBQVEsU0FDUixXQUFXLFFBQVEsVUFBVSxRQUFRLE1BQU0sY0FBYztBQUU3RCxpQkFBTyxPQUFPLFFBQVE7QUFFdEIsZUFBSyxtQkFBbUIsTUFBTTtBQUU5QixpQkFBTztBQUFBLFFBQ1Q7QUFXQSxpQkFBUyxXQUFXLGNBQWMsaUJBQWlCLGdCQUFnQixjQUFjO0FBQy9FLGdCQUFNLGNBQWMsdUJBQU8sT0FBTyxJQUFJO0FBUXRDLG1CQUFTLFlBQVksTUFBTSxXQUFXO0FBQ3BDLG1CQUFPLEtBQUssU0FBUyxTQUFTO0FBQUEsVUFDaEM7QUFFQSxtQkFBUyxrQkFBa0I7QUFDekIsZ0JBQUksQ0FBQyxJQUFJLFVBQVU7QUFDakIsc0JBQVEsUUFBUSxVQUFVO0FBQzFCO0FBQUEsWUFDRjtBQUVBLGdCQUFJLFlBQVk7QUFDaEIsZ0JBQUksaUJBQWlCLFlBQVk7QUFDakMsZ0JBQUksUUFBUSxJQUFJLGlCQUFpQixLQUFLLFVBQVU7QUFDaEQsZ0JBQUksTUFBTTtBQUVWLG1CQUFPLE9BQU87QUFDWixxQkFBTyxXQUFXLFVBQVUsV0FBVyxNQUFNLEtBQUs7QUFDbEQsb0JBQU0sT0FBTyxTQUFTLG1CQUFtQixNQUFNLENBQUMsRUFBRSxZQUFZLElBQUksTUFBTSxDQUFDO0FBQ3pFLG9CQUFNLE9BQU8sWUFBWSxLQUFLLElBQUk7QUFDbEMsa0JBQUksTUFBTTtBQUNSLHNCQUFNLENBQUMsTUFBTSxnQkFBZ0IsSUFBSTtBQUNqQyx3QkFBUSxRQUFRLEdBQUc7QUFDbkIsc0JBQU07QUFFTiw0QkFBWSxJQUFJLEtBQUssWUFBWSxJQUFJLEtBQUssS0FBSztBQUMvQyxvQkFBSSxZQUFZLElBQUksS0FBSyxpQkFBa0IsY0FBYTtBQUN4RCxvQkFBSSxLQUFLLFdBQVcsR0FBRyxHQUFHO0FBR3hCLHlCQUFPLE1BQU0sQ0FBQztBQUFBLGdCQUNoQixPQUFPO0FBQ0wsd0JBQU0sV0FBVyxTQUFTLGlCQUFpQixJQUFJLEtBQUs7QUFDcEQsOEJBQVksTUFBTSxDQUFDLEdBQUcsUUFBUTtBQUFBLGdCQUNoQztBQUFBLGNBQ0YsT0FBTztBQUNMLHVCQUFPLE1BQU0sQ0FBQztBQUFBLGNBQ2hCO0FBQ0EsMEJBQVksSUFBSSxpQkFBaUI7QUFDakMsc0JBQVEsSUFBSSxpQkFBaUIsS0FBSyxVQUFVO0FBQUEsWUFDOUM7QUFDQSxtQkFBTyxXQUFXLFVBQVUsU0FBUztBQUNyQyxvQkFBUSxRQUFRLEdBQUc7QUFBQSxVQUNyQjtBQUVBLG1CQUFTLHFCQUFxQjtBQUM1QixnQkFBSSxlQUFlLEdBQUk7QUFFdkIsZ0JBQUlDLFVBQVM7QUFFYixnQkFBSSxPQUFPLElBQUksZ0JBQWdCLFVBQVU7QUFDdkMsa0JBQUksQ0FBQyxVQUFVLElBQUksV0FBVyxHQUFHO0FBQy9CLHdCQUFRLFFBQVEsVUFBVTtBQUMxQjtBQUFBLGNBQ0Y7QUFDQSxjQUFBQSxVQUFTLFdBQVcsSUFBSSxhQUFhLFlBQVksTUFBTSxjQUFjLElBQUksV0FBVyxDQUFDO0FBQ3JGLDRCQUFjLElBQUksV0FBVztBQUFBLGNBQWlDQSxRQUFPO0FBQUEsWUFDdkUsT0FBTztBQUNMLGNBQUFBLFVBQVMsY0FBYyxZQUFZLElBQUksWUFBWSxTQUFTLElBQUksY0FBYyxJQUFJO0FBQUEsWUFDcEY7QUFNQSxnQkFBSSxJQUFJLFlBQVksR0FBRztBQUNyQiwyQkFBYUEsUUFBTztBQUFBLFlBQ3RCO0FBQ0Esb0JBQVEsaUJBQWlCQSxRQUFPLFVBQVVBLFFBQU8sUUFBUTtBQUFBLFVBQzNEO0FBRUEsbUJBQVMsZ0JBQWdCO0FBQ3ZCLGdCQUFJLElBQUksZUFBZSxNQUFNO0FBQzNCLGlDQUFtQjtBQUFBLFlBQ3JCLE9BQU87QUFDTCw4QkFBZ0I7QUFBQSxZQUNsQjtBQUNBLHlCQUFhO0FBQUEsVUFDZjtBQU1BLG1CQUFTLFlBQVksU0FBUyxPQUFPO0FBQ25DLGdCQUFJLFlBQVksR0FBSTtBQUVwQixvQkFBUSxXQUFXLEtBQUs7QUFDeEIsb0JBQVEsUUFBUSxPQUFPO0FBQ3ZCLG9CQUFRLFNBQVM7QUFBQSxVQUNuQjtBQU1BLG1CQUFTLGVBQWUsT0FBTyxPQUFPO0FBQ3BDLGdCQUFJLElBQUk7QUFDUixrQkFBTSxNQUFNLE1BQU0sU0FBUztBQUMzQixtQkFBTyxLQUFLLEtBQUs7QUFDZixrQkFBSSxDQUFDLE1BQU0sTUFBTSxDQUFDLEdBQUc7QUFBRTtBQUFLO0FBQUEsY0FBVTtBQUN0QyxvQkFBTSxRQUFRLFNBQVMsaUJBQWlCLE1BQU0sQ0FBQyxDQUFDLEtBQUssTUFBTSxDQUFDO0FBQzVELG9CQUFNLE9BQU8sTUFBTSxDQUFDO0FBQ3BCLGtCQUFJLE9BQU87QUFDVCw0QkFBWSxNQUFNLEtBQUs7QUFBQSxjQUN6QixPQUFPO0FBQ0wsNkJBQWE7QUFDYixnQ0FBZ0I7QUFDaEIsNkJBQWE7QUFBQSxjQUNmO0FBQ0E7QUFBQSxZQUNGO0FBQUEsVUFDRjtBQU1BLG1CQUFTLGFBQWEsTUFBTSxPQUFPO0FBQ2pDLGdCQUFJLEtBQUssU0FBUyxPQUFPLEtBQUssVUFBVSxVQUFVO0FBQ2hELHNCQUFRLFNBQVMsU0FBUyxpQkFBaUIsS0FBSyxLQUFLLEtBQUssS0FBSyxLQUFLO0FBQUEsWUFDdEU7QUFDQSxnQkFBSSxLQUFLLFlBQVk7QUFFbkIsa0JBQUksS0FBSyxXQUFXLE9BQU87QUFDekIsNEJBQVksWUFBWSxTQUFTLGlCQUFpQixLQUFLLFdBQVcsS0FBSyxLQUFLLEtBQUssV0FBVyxLQUFLO0FBQ2pHLDZCQUFhO0FBQUEsY0FDZixXQUFXLEtBQUssV0FBVyxRQUFRO0FBRWpDLCtCQUFlLEtBQUssWUFBWSxLQUFLO0FBQ3JDLDZCQUFhO0FBQUEsY0FDZjtBQUFBLFlBQ0Y7QUFFQSxrQkFBTSxPQUFPLE9BQU8sTUFBTSxFQUFFLFFBQVEsRUFBRSxPQUFPLElBQUksRUFBRSxDQUFDO0FBQ3BELG1CQUFPO0FBQUEsVUFDVDtBQVFBLG1CQUFTLFVBQVUsTUFBTSxPQUFPLG9CQUFvQjtBQUNsRCxnQkFBSSxVQUFVLFdBQVcsS0FBSyxPQUFPLGtCQUFrQjtBQUV2RCxnQkFBSSxTQUFTO0FBQ1gsa0JBQUksS0FBSyxRQUFRLEdBQUc7QUFDbEIsc0JBQU0sT0FBTyxJQUFJLFNBQVMsSUFBSTtBQUM5QixxQkFBSyxRQUFRLEVBQUUsT0FBTyxJQUFJO0FBQzFCLG9CQUFJLEtBQUssZUFBZ0IsV0FBVTtBQUFBLGNBQ3JDO0FBRUEsa0JBQUksU0FBUztBQUNYLHVCQUFPLEtBQUssY0FBYyxLQUFLLFFBQVE7QUFDckMseUJBQU8sS0FBSztBQUFBLGdCQUNkO0FBQ0EsdUJBQU87QUFBQSxjQUNUO0FBQUEsWUFDRjtBQUdBLGdCQUFJLEtBQUssZ0JBQWdCO0FBQ3ZCLHFCQUFPLFVBQVUsS0FBSyxRQUFRLE9BQU8sa0JBQWtCO0FBQUEsWUFDekQ7QUFBQSxVQUNGO0FBT0EsbUJBQVMsU0FBUyxRQUFRO0FBQ3hCLGdCQUFJLElBQUksUUFBUSxlQUFlLEdBQUc7QUFHaEMsNEJBQWMsT0FBTyxDQUFDO0FBQ3RCLHFCQUFPO0FBQUEsWUFDVCxPQUFPO0FBR0wseUNBQTJCO0FBQzNCLHFCQUFPO0FBQUEsWUFDVDtBQUFBLFVBQ0Y7QUFRQSxtQkFBUyxhQUFhLE9BQU87QUFDM0Isa0JBQU0sU0FBUyxNQUFNLENBQUM7QUFDdEIsa0JBQU0sVUFBVSxNQUFNO0FBRXRCLGtCQUFNLE9BQU8sSUFBSSxTQUFTLE9BQU87QUFFakMsa0JBQU0sa0JBQWtCLENBQUMsUUFBUSxlQUFlLFFBQVEsVUFBVSxDQUFDO0FBQ25FLHVCQUFXLE1BQU0saUJBQWlCO0FBQ2hDLGtCQUFJLENBQUMsR0FBSTtBQUNULGlCQUFHLE9BQU8sSUFBSTtBQUNkLGtCQUFJLEtBQUssZUFBZ0IsUUFBTyxTQUFTLE1BQU07QUFBQSxZQUNqRDtBQUVBLGdCQUFJLFFBQVEsTUFBTTtBQUNoQiw0QkFBYztBQUFBLFlBQ2hCLE9BQU87QUFDTCxrQkFBSSxRQUFRLGNBQWM7QUFDeEIsOEJBQWM7QUFBQSxjQUNoQjtBQUNBLDRCQUFjO0FBQ2Qsa0JBQUksQ0FBQyxRQUFRLGVBQWUsQ0FBQyxRQUFRLGNBQWM7QUFDakQsNkJBQWE7QUFBQSxjQUNmO0FBQUEsWUFDRjtBQUNBLHlCQUFhLFNBQVMsS0FBSztBQUMzQixtQkFBTyxRQUFRLGNBQWMsSUFBSSxPQUFPO0FBQUEsVUFDMUM7QUFPQSxtQkFBUyxXQUFXLE9BQU87QUFDekIsa0JBQU0sU0FBUyxNQUFNLENBQUM7QUFDdEIsa0JBQU0scUJBQXFCLGdCQUFnQixVQUFVLE1BQU0sS0FBSztBQUVoRSxrQkFBTSxVQUFVLFVBQVUsS0FBSyxPQUFPLGtCQUFrQjtBQUN4RCxnQkFBSSxDQUFDLFNBQVM7QUFBRSxxQkFBTztBQUFBLFlBQVU7QUFFakMsa0JBQU0sU0FBUztBQUNmLGdCQUFJLElBQUksWUFBWSxJQUFJLFNBQVMsT0FBTztBQUN0Qyw0QkFBYztBQUNkLDBCQUFZLFFBQVEsSUFBSSxTQUFTLEtBQUs7QUFBQSxZQUN4QyxXQUFXLElBQUksWUFBWSxJQUFJLFNBQVMsUUFBUTtBQUM5Qyw0QkFBYztBQUNkLDZCQUFlLElBQUksVUFBVSxLQUFLO0FBQUEsWUFDcEMsV0FBVyxPQUFPLE1BQU07QUFDdEIsNEJBQWM7QUFBQSxZQUNoQixPQUFPO0FBQ0wsa0JBQUksRUFBRSxPQUFPLGFBQWEsT0FBTyxhQUFhO0FBQzVDLDhCQUFjO0FBQUEsY0FDaEI7QUFDQSw0QkFBYztBQUNkLGtCQUFJLE9BQU8sWUFBWTtBQUNyQiw2QkFBYTtBQUFBLGNBQ2Y7QUFBQSxZQUNGO0FBQ0EsZUFBRztBQUNELGtCQUFJLElBQUksT0FBTztBQUNiLHdCQUFRLFVBQVU7QUFBQSxjQUNwQjtBQUNBLGtCQUFJLENBQUMsSUFBSSxRQUFRLENBQUMsSUFBSSxhQUFhO0FBQ2pDLDZCQUFhLElBQUk7QUFBQSxjQUNuQjtBQUNBLG9CQUFNLElBQUk7QUFBQSxZQUNaLFNBQVMsUUFBUSxRQUFRO0FBQ3pCLGdCQUFJLFFBQVEsUUFBUTtBQUNsQiwyQkFBYSxRQUFRLFFBQVEsS0FBSztBQUFBLFlBQ3BDO0FBQ0EsbUJBQU8sT0FBTyxZQUFZLElBQUksT0FBTztBQUFBLFVBQ3ZDO0FBRUEsbUJBQVMsdUJBQXVCO0FBQzlCLGtCQUFNLE9BQU8sQ0FBQztBQUNkLHFCQUFTLFVBQVUsS0FBSyxZQUFZLFVBQVUsVUFBVSxRQUFRLFFBQVE7QUFDdEUsa0JBQUksUUFBUSxPQUFPO0FBQ2pCLHFCQUFLLFFBQVEsUUFBUSxLQUFLO0FBQUEsY0FDNUI7QUFBQSxZQUNGO0FBQ0EsaUJBQUssUUFBUSxVQUFRLFFBQVEsU0FBUyxJQUFJLENBQUM7QUFBQSxVQUM3QztBQUdBLGNBQUksWUFBWSxDQUFDO0FBUWpCLG1CQUFTLGNBQWMsaUJBQWlCLE9BQU87QUFDN0Msa0JBQU0sU0FBUyxTQUFTLE1BQU0sQ0FBQztBQUcvQiwwQkFBYztBQUVkLGdCQUFJLFVBQVUsTUFBTTtBQUNsQiw0QkFBYztBQUNkLHFCQUFPO0FBQUEsWUFDVDtBQU1BLGdCQUFJLFVBQVUsU0FBUyxXQUFXLE1BQU0sU0FBUyxTQUFTLFVBQVUsVUFBVSxNQUFNLFNBQVMsV0FBVyxJQUFJO0FBRTFHLDRCQUFjLGdCQUFnQixNQUFNLE1BQU0sT0FBTyxNQUFNLFFBQVEsQ0FBQztBQUNoRSxrQkFBSSxDQUFDLFdBQVc7QUFFZCxzQkFBTSxNQUFNLElBQUksTUFBTSx3QkFBd0IsWUFBWSxHQUFHO0FBQzdELG9CQUFJLGVBQWU7QUFDbkIsb0JBQUksVUFBVSxVQUFVO0FBQ3hCLHNCQUFNO0FBQUEsY0FDUjtBQUNBLHFCQUFPO0FBQUEsWUFDVDtBQUNBLHdCQUFZO0FBRVosZ0JBQUksTUFBTSxTQUFTLFNBQVM7QUFDMUIscUJBQU8sYUFBYSxLQUFLO0FBQUEsWUFDM0IsV0FBVyxNQUFNLFNBQVMsYUFBYSxDQUFDLGdCQUFnQjtBQUd0RCxvQkFBTSxNQUFNLElBQUksTUFBTSxxQkFBcUIsU0FBUyxrQkFBa0IsSUFBSSxTQUFTLGVBQWUsR0FBRztBQUNyRyxrQkFBSSxPQUFPO0FBQ1gsb0JBQU07QUFBQSxZQUNSLFdBQVcsTUFBTSxTQUFTLE9BQU87QUFDL0Isb0JBQU0sWUFBWSxXQUFXLEtBQUs7QUFDbEMsa0JBQUksY0FBYyxVQUFVO0FBQzFCLHVCQUFPO0FBQUEsY0FDVDtBQUFBLFlBQ0Y7QUFLQSxnQkFBSSxNQUFNLFNBQVMsYUFBYSxXQUFXLElBQUk7QUFFN0MsNEJBQWM7QUFDZCxxQkFBTztBQUFBLFlBQ1Q7QUFNQSxnQkFBSSxhQUFhLE9BQVUsYUFBYSxNQUFNLFFBQVEsR0FBRztBQUN2RCxvQkFBTSxNQUFNLElBQUksTUFBTSwyREFBMkQ7QUFDakYsb0JBQU07QUFBQSxZQUNSO0FBVUEsMEJBQWM7QUFDZCxtQkFBTyxPQUFPO0FBQUEsVUFDaEI7QUFFQSxnQkFBTSxXQUFXLFlBQVksWUFBWTtBQUN6QyxjQUFJLENBQUMsVUFBVTtBQUNiLGtCQUFNLG1CQUFtQixRQUFRLE1BQU0sWUFBWSxDQUFDO0FBQ3BELGtCQUFNLElBQUksTUFBTSx3QkFBd0IsZUFBZSxHQUFHO0FBQUEsVUFDNUQ7QUFFQSxnQkFBTSxLQUFLLGdCQUFnQixRQUFRO0FBQ25DLGNBQUksU0FBUztBQUViLGNBQUksTUFBTSxnQkFBZ0I7QUFFMUIsZ0JBQU0sZ0JBQWdCLENBQUM7QUFDdkIsZ0JBQU0sVUFBVSxJQUFJLFFBQVEsVUFBVSxPQUFPO0FBQzdDLCtCQUFxQjtBQUNyQixjQUFJLGFBQWE7QUFDakIsY0FBSSxZQUFZO0FBQ2hCLGNBQUksUUFBUTtBQUNaLGNBQUksYUFBYTtBQUNqQixjQUFJLDJCQUEyQjtBQUUvQixjQUFJO0FBQ0YsZ0JBQUksQ0FBQyxTQUFTLGNBQWM7QUFDMUIsa0JBQUksUUFBUSxZQUFZO0FBRXhCLHlCQUFTO0FBQ1A7QUFDQSxvQkFBSSwwQkFBMEI7QUFHNUIsNkNBQTJCO0FBQUEsZ0JBQzdCLE9BQU87QUFDTCxzQkFBSSxRQUFRLFlBQVk7QUFBQSxnQkFDMUI7QUFDQSxvQkFBSSxRQUFRLFlBQVk7QUFFeEIsc0JBQU0sUUFBUSxJQUFJLFFBQVEsS0FBSyxlQUFlO0FBRzlDLG9CQUFJLENBQUMsTUFBTztBQUVaLHNCQUFNLGNBQWMsZ0JBQWdCLFVBQVUsT0FBTyxNQUFNLEtBQUs7QUFDaEUsc0JBQU0saUJBQWlCLGNBQWMsYUFBYSxLQUFLO0FBQ3ZELHdCQUFRLE1BQU0sUUFBUTtBQUFBLGNBQ3hCO0FBQ0EsNEJBQWMsZ0JBQWdCLFVBQVUsS0FBSyxDQUFDO0FBQUEsWUFDaEQsT0FBTztBQUNMLHVCQUFTLGFBQWEsaUJBQWlCLE9BQU87QUFBQSxZQUNoRDtBQUVBLG9CQUFRLFNBQVM7QUFDakIscUJBQVMsUUFBUSxPQUFPO0FBRXhCLG1CQUFPO0FBQUEsY0FDTCxVQUFVO0FBQUEsY0FDVixPQUFPO0FBQUEsY0FDUDtBQUFBLGNBQ0EsU0FBUztBQUFBLGNBQ1QsVUFBVTtBQUFBLGNBQ1YsTUFBTTtBQUFBLFlBQ1I7QUFBQSxVQUNGLFNBQVMsS0FBSztBQUNaLGdCQUFJLElBQUksV0FBVyxJQUFJLFFBQVEsU0FBUyxTQUFTLEdBQUc7QUFDbEQscUJBQU87QUFBQSxnQkFDTCxVQUFVO0FBQUEsZ0JBQ1YsT0FBTyxPQUFPLGVBQWU7QUFBQSxnQkFDN0IsU0FBUztBQUFBLGdCQUNULFdBQVc7QUFBQSxnQkFDWCxZQUFZO0FBQUEsa0JBQ1YsU0FBUyxJQUFJO0FBQUEsa0JBQ2I7QUFBQSxrQkFDQSxTQUFTLGdCQUFnQixNQUFNLFFBQVEsS0FBSyxRQUFRLEdBQUc7QUFBQSxrQkFDdkQsTUFBTSxJQUFJO0FBQUEsa0JBQ1YsYUFBYTtBQUFBLGdCQUNmO0FBQUEsZ0JBQ0EsVUFBVTtBQUFBLGNBQ1o7QUFBQSxZQUNGLFdBQVcsV0FBVztBQUNwQixxQkFBTztBQUFBLGdCQUNMLFVBQVU7QUFBQSxnQkFDVixPQUFPLE9BQU8sZUFBZTtBQUFBLGdCQUM3QixTQUFTO0FBQUEsZ0JBQ1QsV0FBVztBQUFBLGdCQUNYLGFBQWE7QUFBQSxnQkFDYixVQUFVO0FBQUEsZ0JBQ1YsTUFBTTtBQUFBLGNBQ1I7QUFBQSxZQUNGLE9BQU87QUFDTCxvQkFBTTtBQUFBLFlBQ1I7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQVNBLGlCQUFTLHdCQUF3QixNQUFNO0FBQ3JDLGdCQUFNLFNBQVM7QUFBQSxZQUNiLE9BQU8sT0FBTyxJQUFJO0FBQUEsWUFDbEIsU0FBUztBQUFBLFlBQ1QsV0FBVztBQUFBLFlBQ1gsTUFBTTtBQUFBLFlBQ04sVUFBVSxJQUFJLFFBQVEsVUFBVSxPQUFPO0FBQUEsVUFDekM7QUFDQSxpQkFBTyxTQUFTLFFBQVEsSUFBSTtBQUM1QixpQkFBTztBQUFBLFFBQ1Q7QUFnQkEsaUJBQVMsY0FBYyxNQUFNLGdCQUFnQjtBQUMzQywyQkFBaUIsa0JBQWtCLFFBQVEsYUFBYSxPQUFPLEtBQUssU0FBUztBQUM3RSxnQkFBTSxZQUFZLHdCQUF3QixJQUFJO0FBRTlDLGdCQUFNLFVBQVUsZUFBZSxPQUFPLFdBQVcsRUFBRSxPQUFPLGFBQWEsRUFBRTtBQUFBLFlBQUksVUFDM0UsV0FBVyxNQUFNLE1BQU0sS0FBSztBQUFBLFVBQzlCO0FBQ0Esa0JBQVEsUUFBUSxTQUFTO0FBRXpCLGdCQUFNLFNBQVMsUUFBUSxLQUFLLENBQUMsR0FBRyxNQUFNO0FBRXBDLGdCQUFJLEVBQUUsY0FBYyxFQUFFLFVBQVcsUUFBTyxFQUFFLFlBQVksRUFBRTtBQUl4RCxnQkFBSSxFQUFFLFlBQVksRUFBRSxVQUFVO0FBQzVCLGtCQUFJLFlBQVksRUFBRSxRQUFRLEVBQUUsZUFBZSxFQUFFLFVBQVU7QUFDckQsdUJBQU87QUFBQSxjQUNULFdBQVcsWUFBWSxFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQUUsVUFBVTtBQUM1RCx1QkFBTztBQUFBLGNBQ1Q7QUFBQSxZQUNGO0FBTUEsbUJBQU87QUFBQSxVQUNULENBQUM7QUFFRCxnQkFBTSxDQUFDLE1BQU0sVUFBVSxJQUFJO0FBRzNCLGdCQUFNLFNBQVM7QUFDZixpQkFBTyxhQUFhO0FBRXBCLGlCQUFPO0FBQUEsUUFDVDtBQVNBLGlCQUFTLGdCQUFnQixTQUFTLGFBQWEsWUFBWTtBQUN6RCxnQkFBTSxXQUFZLGVBQWUsUUFBUSxXQUFXLEtBQU07QUFFMUQsa0JBQVEsVUFBVSxJQUFJLE1BQU07QUFDNUIsa0JBQVEsVUFBVSxJQUFJLFlBQVksUUFBUSxFQUFFO0FBQUEsUUFDOUM7QUFPQSxpQkFBUyxpQkFBaUIsU0FBUztBQUVqQyxjQUFJLE9BQU87QUFDWCxnQkFBTSxXQUFXLGNBQWMsT0FBTztBQUV0QyxjQUFJLG1CQUFtQixRQUFRLEVBQUc7QUFFbEM7QUFBQSxZQUFLO0FBQUEsWUFDSCxFQUFFLElBQUksU0FBUyxTQUFTO0FBQUEsVUFBQztBQUUzQixjQUFJLFFBQVEsUUFBUSxhQUFhO0FBQy9CLG9CQUFRLElBQUksMEZBQTBGLE9BQU87QUFDN0c7QUFBQSxVQUNGO0FBT0EsY0FBSSxRQUFRLFNBQVMsU0FBUyxHQUFHO0FBQy9CLGdCQUFJLENBQUMsUUFBUSxxQkFBcUI7QUFDaEMsc0JBQVEsS0FBSywrRkFBK0Y7QUFDNUcsc0JBQVEsS0FBSywyREFBMkQ7QUFDeEUsc0JBQVEsS0FBSyxrQ0FBa0M7QUFDL0Msc0JBQVEsS0FBSyxPQUFPO0FBQUEsWUFDdEI7QUFDQSxnQkFBSSxRQUFRLG9CQUFvQjtBQUM5QixvQkFBTSxNQUFNLElBQUk7QUFBQSxnQkFDZDtBQUFBLGdCQUNBLFFBQVE7QUFBQSxjQUNWO0FBQ0Esb0JBQU07QUFBQSxZQUNSO0FBQUEsVUFDRjtBQUVBLGlCQUFPO0FBQ1AsZ0JBQU0sT0FBTyxLQUFLO0FBQ2xCLGdCQUFNLFNBQVMsV0FBV0QsV0FBVSxNQUFNLEVBQUUsVUFBVSxnQkFBZ0IsS0FBSyxDQUFDLElBQUksY0FBYyxJQUFJO0FBRWxHLGtCQUFRLFlBQVksT0FBTztBQUMzQixrQkFBUSxRQUFRLGNBQWM7QUFDOUIsMEJBQWdCLFNBQVMsVUFBVSxPQUFPLFFBQVE7QUFDbEQsa0JBQVEsU0FBUztBQUFBLFlBQ2YsVUFBVSxPQUFPO0FBQUE7QUFBQSxZQUVqQixJQUFJLE9BQU87QUFBQSxZQUNYLFdBQVcsT0FBTztBQUFBLFVBQ3BCO0FBQ0EsY0FBSSxPQUFPLFlBQVk7QUFDckIsb0JBQVEsYUFBYTtBQUFBLGNBQ25CLFVBQVUsT0FBTyxXQUFXO0FBQUEsY0FDNUIsV0FBVyxPQUFPLFdBQVc7QUFBQSxZQUMvQjtBQUFBLFVBQ0Y7QUFFQSxlQUFLLDBCQUEwQixFQUFFLElBQUksU0FBUyxRQUFRLEtBQUssQ0FBQztBQUFBLFFBQzlEO0FBT0EsaUJBQVMsVUFBVSxhQUFhO0FBQzlCLG9CQUFVLFFBQVEsU0FBUyxXQUFXO0FBQUEsUUFDeEM7QUFHQSxjQUFNLG1CQUFtQixNQUFNO0FBQzdCLHVCQUFhO0FBQ2IscUJBQVcsVUFBVSx5REFBeUQ7QUFBQSxRQUNoRjtBQUdBLGlCQUFTLHlCQUF5QjtBQUNoQyx1QkFBYTtBQUNiLHFCQUFXLFVBQVUsK0RBQStEO0FBQUEsUUFDdEY7QUFFQSxZQUFJLGlCQUFpQjtBQUtyQixpQkFBUyxlQUFlO0FBQ3RCLG1CQUFTRSxRQUFPO0FBRWQseUJBQWE7QUFBQSxVQUNmO0FBR0EsY0FBSSxTQUFTLGVBQWUsV0FBVztBQUVyQyxnQkFBSSxDQUFDLGdCQUFnQjtBQUNuQixxQkFBTyxpQkFBaUIsb0JBQW9CQSxPQUFNLEtBQUs7QUFBQSxZQUN6RDtBQUNBLDZCQUFpQjtBQUNqQjtBQUFBLFVBQ0Y7QUFFQSxnQkFBTSxTQUFTLFNBQVMsaUJBQWlCLFFBQVEsV0FBVztBQUM1RCxpQkFBTyxRQUFRLGdCQUFnQjtBQUFBLFFBQ2pDO0FBUUEsaUJBQVMsaUJBQWlCLGNBQWMsb0JBQW9CO0FBQzFELGNBQUksT0FBTztBQUNYLGNBQUk7QUFDRixtQkFBTyxtQkFBbUIsSUFBSTtBQUFBLFVBQ2hDLFNBQVMsU0FBUztBQUNoQixrQkFBTSx3REFBd0QsUUFBUSxNQUFNLFlBQVksQ0FBQztBQUV6RixnQkFBSSxDQUFDLFdBQVc7QUFBRSxvQkFBTTtBQUFBLFlBQVMsT0FBTztBQUFFLG9CQUFNLE9BQU87QUFBQSxZQUFHO0FBSzFELG1CQUFPO0FBQUEsVUFDVDtBQUVBLGNBQUksQ0FBQyxLQUFLLEtBQU0sTUFBSyxPQUFPO0FBQzVCLG9CQUFVLFlBQVksSUFBSTtBQUMxQixlQUFLLGdCQUFnQixtQkFBbUIsS0FBSyxNQUFNLElBQUk7QUFFdkQsY0FBSSxLQUFLLFNBQVM7QUFDaEIsNEJBQWdCLEtBQUssU0FBUyxFQUFFLGFBQWEsQ0FBQztBQUFBLFVBQ2hEO0FBQUEsUUFDRjtBQU9BLGlCQUFTLG1CQUFtQixjQUFjO0FBQ3hDLGlCQUFPLFVBQVUsWUFBWTtBQUM3QixxQkFBVyxTQUFTLE9BQU8sS0FBSyxPQUFPLEdBQUc7QUFDeEMsZ0JBQUksUUFBUSxLQUFLLE1BQU0sY0FBYztBQUNuQyxxQkFBTyxRQUFRLEtBQUs7QUFBQSxZQUN0QjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBS0EsaUJBQVMsZ0JBQWdCO0FBQ3ZCLGlCQUFPLE9BQU8sS0FBSyxTQUFTO0FBQUEsUUFDOUI7QUFNQSxpQkFBUyxZQUFZLE1BQU07QUFDekIsa0JBQVEsUUFBUSxJQUFJLFlBQVk7QUFDaEMsaUJBQU8sVUFBVSxJQUFJLEtBQUssVUFBVSxRQUFRLElBQUksQ0FBQztBQUFBLFFBQ25EO0FBT0EsaUJBQVMsZ0JBQWdCLFdBQVcsRUFBRSxhQUFhLEdBQUc7QUFDcEQsY0FBSSxPQUFPLGNBQWMsVUFBVTtBQUNqQyx3QkFBWSxDQUFDLFNBQVM7QUFBQSxVQUN4QjtBQUNBLG9CQUFVLFFBQVEsV0FBUztBQUFFLG9CQUFRLE1BQU0sWUFBWSxDQUFDLElBQUk7QUFBQSxVQUFjLENBQUM7QUFBQSxRQUM3RTtBQU1BLGlCQUFTLGNBQWMsTUFBTTtBQUMzQixnQkFBTSxPQUFPLFlBQVksSUFBSTtBQUM3QixpQkFBTyxRQUFRLENBQUMsS0FBSztBQUFBLFFBQ3ZCO0FBT0EsaUJBQVMsaUJBQWlCLFFBQVE7QUFFaEMsY0FBSSxPQUFPLHVCQUF1QixLQUFLLENBQUMsT0FBTyx5QkFBeUIsR0FBRztBQUN6RSxtQkFBTyx5QkFBeUIsSUFBSSxDQUFDLFNBQVM7QUFDNUMscUJBQU8sdUJBQXVCO0FBQUEsZ0JBQzVCLE9BQU8sT0FBTyxFQUFFLE9BQU8sS0FBSyxHQUFHLEdBQUcsSUFBSTtBQUFBLGNBQ3hDO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFDQSxjQUFJLE9BQU8sc0JBQXNCLEtBQUssQ0FBQyxPQUFPLHdCQUF3QixHQUFHO0FBQ3ZFLG1CQUFPLHdCQUF3QixJQUFJLENBQUMsU0FBUztBQUMzQyxxQkFBTyxzQkFBc0I7QUFBQSxnQkFDM0IsT0FBTyxPQUFPLEVBQUUsT0FBTyxLQUFLLEdBQUcsR0FBRyxJQUFJO0FBQUEsY0FDeEM7QUFBQSxZQUNGO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFLQSxpQkFBUyxVQUFVLFFBQVE7QUFDekIsMkJBQWlCLE1BQU07QUFDdkIsa0JBQVEsS0FBSyxNQUFNO0FBQUEsUUFDckI7QUFLQSxpQkFBUyxhQUFhLFFBQVE7QUFDNUIsZ0JBQU0sUUFBUSxRQUFRLFFBQVEsTUFBTTtBQUNwQyxjQUFJLFVBQVUsSUFBSTtBQUNoQixvQkFBUSxPQUFPLE9BQU8sQ0FBQztBQUFBLFVBQ3pCO0FBQUEsUUFDRjtBQU9BLGlCQUFTLEtBQUssT0FBTyxNQUFNO0FBQ3pCLGdCQUFNLEtBQUs7QUFDWCxrQkFBUSxRQUFRLFNBQVMsUUFBUTtBQUMvQixnQkFBSSxPQUFPLEVBQUUsR0FBRztBQUNkLHFCQUFPLEVBQUUsRUFBRSxJQUFJO0FBQUEsWUFDakI7QUFBQSxVQUNGLENBQUM7QUFBQSxRQUNIO0FBTUEsaUJBQVMsd0JBQXdCLElBQUk7QUFDbkMscUJBQVcsVUFBVSxrREFBa0Q7QUFDdkUscUJBQVcsVUFBVSxrQ0FBa0M7QUFFdkQsaUJBQU8saUJBQWlCLEVBQUU7QUFBQSxRQUM1QjtBQUdBLGVBQU8sT0FBTyxNQUFNO0FBQUEsVUFDbEIsV0FBQUY7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQTtBQUFBLFVBRUEsZ0JBQWdCO0FBQUEsVUFDaEI7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFFBQ0YsQ0FBQztBQUVELGFBQUssWUFBWSxXQUFXO0FBQUUsc0JBQVk7QUFBQSxRQUFPO0FBQ2pELGFBQUssV0FBVyxXQUFXO0FBQUUsc0JBQVk7QUFBQSxRQUFNO0FBQy9DLGFBQUssZ0JBQWdCO0FBRXJCLGFBQUssUUFBUTtBQUFBLFVBQ1g7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDRjtBQUVBLG1CQUFXLE9BQU8sT0FBTztBQUV2QixjQUFJLE9BQU8sTUFBTSxHQUFHLE1BQU0sVUFBVTtBQUVsQyx1QkFBVyxNQUFNLEdBQUcsQ0FBQztBQUFBLFVBQ3ZCO0FBQUEsUUFDRjtBQUdBLGVBQU8sT0FBTyxNQUFNLEtBQUs7QUFFekIsZUFBTztBQUFBLE1BQ1Q7QUFHQSxVQUFNLFlBQVksS0FBSyxDQUFDLENBQUM7QUFJekIsZ0JBQVUsY0FBYyxNQUFNLEtBQUssQ0FBQyxDQUFDO0FBRXJDLGFBQU8sVUFBVTtBQUNqQixnQkFBVSxjQUFjO0FBQ3hCLGdCQUFVLFVBQVU7QUFBQTtBQUFBOzs7QUN6aEZiLE1BQU0sbUJBQW1CO0FBR3pCLE1BQU0sb0JBQW9CO0FBRzFCLE1BQU0sZUFBZTtBQUVyQixNQUFNLHFCQUFxQjtBQUczQixNQUFNLGtCQUFrQixPQUFPLE9BQU87QUFBQSxJQUMzQztBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGLENBQUM7QUFHTSxNQUFNLGtCQUFrQixPQUFPLE9BQU87QUFBQSxJQUMzQztBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRixDQUFDO0FBRU0sTUFBTSxhQUFhLE9BQU8sT0FBTztBQUFBLElBQ3RDLGlCQUFpQjtBQUFBLElBQ2pCLGlCQUFpQjtBQUFBLEVBQ25CLENBQUM7QUFFRCxNQUFNLGlCQUFpQixPQUFPLE9BQU87QUFBQSxJQUNuQyxDQUFDLFdBQVcsZUFBZSxHQUFHLElBQUksSUFBSSxlQUFlO0FBQUEsSUFDckQsQ0FBQyxXQUFXLGVBQWUsR0FBRyxJQUFJLElBQUksZUFBZTtBQUFBLEVBQ3ZELENBQUM7QUFFRCxNQUFNLGNBQWMsb0JBQUksSUFBSSxDQUFDLGFBQWEsZUFBZSxXQUFXLENBQUM7QUFFckUsTUFBTSxxQkFBcUI7QUFtQ3BCLFdBQVMsZUFBZSxNQUFNLFNBQVMsV0FBVztBQUV2RCxVQUFNLFdBQVc7QUFBQSxNQUNmLGlCQUFpQjtBQUFBLE1BQ2pCO0FBQUEsTUFDQSxTQUFTLFdBQVcsQ0FBQztBQUFBLElBQ3ZCO0FBQ0EsUUFBSSxXQUFXO0FBQ2IsZUFBUyxZQUFZO0FBQUEsSUFDdkI7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQVVPLFdBQVMsbUJBQW1CLE1BQU0sU0FBUyxRQUFRO0FBRXhELFVBQU0sVUFBVSxFQUFFLE1BQU0sUUFBUTtBQUNoQyxRQUFJLFFBQVE7QUFDVixjQUFRLFNBQVM7QUFBQSxJQUNuQjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBVU8sV0FBUyxZQUFZLE9BQU87QUFDakMsUUFBSTtBQUNGLFlBQU0sT0FBTyxLQUFLLFVBQVUsS0FBSztBQUNqQyxhQUFPLE9BQU8sU0FBUyxXQUFXLEtBQUssU0FBUztBQUFBLElBQ2xELFFBQVE7QUFDTixhQUFPLE9BQU87QUFBQSxJQUNoQjtBQUFBLEVBQ0Y7QUFNQSxXQUFTLGNBQWMsT0FBTztBQUM1QixXQUFPLE9BQU8sVUFBVSxZQUFZLFVBQVUsUUFBUSxDQUFDLE1BQU0sUUFBUSxLQUFLO0FBQUEsRUFDNUU7QUFVQSxXQUFTLGVBQWUsT0FBTyxNQUFNLE9BQU87QUFDMUMsUUFBSSxRQUFRLHNCQUFzQixVQUFVLFFBQVEsT0FBTyxVQUFVLFVBQVU7QUFDN0UsYUFBTyxFQUFFLElBQUksS0FBSztBQUFBLElBQ3BCO0FBQ0EsVUFBTSxVQUFVLE1BQU0sUUFBUSxLQUFLLElBQUksTUFBTSxRQUFRLElBQUksT0FBTyxRQUFRLEtBQUs7QUFDN0UsZUFBVyxDQUFDLEtBQUssS0FBSyxLQUFLLFNBQVM7QUFDbEMsWUFBTSxZQUFZLE1BQU0sUUFBUSxLQUFLLElBQUksR0FBRyxJQUFJLElBQUksR0FBRyxNQUFNLEdBQUcsSUFBSSxJQUFJLEdBQUc7QUFDM0UsVUFBSSxDQUFDLE1BQU0sUUFBUSxLQUFLLEtBQUssWUFBWSxJQUFJLE9BQU8sR0FBRyxDQUFDLEdBQUc7QUFDekQsZUFBTyxFQUFFLElBQUksT0FBTyxNQUFNLFdBQVcsS0FBSyxPQUFPLEdBQUcsRUFBRTtBQUFBLE1BQ3hEO0FBQ0EsWUFBTSxTQUFTLGVBQWUsT0FBTyxXQUFXLFFBQVEsQ0FBQztBQUN6RCxVQUFJLENBQUMsT0FBTyxJQUFJO0FBQ2QsZUFBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGO0FBQ0EsV0FBTyxFQUFFLElBQUksS0FBSztBQUFBLEVBQ3BCO0FBWU8sV0FBUyxpQkFBaUIsS0FBSyxTQUFTO0FBQzdDLFVBQU0sWUFBWSxTQUFTO0FBQzNCLFVBQU0sWUFBWSxlQUFlLFNBQVM7QUFDMUMsUUFBSSxDQUFDLFdBQVc7QUFDZCxhQUFPO0FBQUEsUUFDTCxJQUFJO0FBQUEsUUFDSixNQUFNO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixTQUFTLCtCQUErQixPQUFPLFNBQVMsQ0FBQztBQUFBLE1BQzNEO0FBQUEsSUFDRjtBQUVBLFFBQUksQ0FBQyxjQUFjLEdBQUcsR0FBRztBQUN2QixhQUFPO0FBQUEsUUFDTCxJQUFJO0FBQUEsUUFDSixNQUFNO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixTQUFTO0FBQUEsTUFDWDtBQUFBLElBQ0Y7QUFFQSxVQUFNO0FBQUE7QUFBQSxNQUFvRDtBQUFBO0FBRTFELFFBQUksVUFBVSxvQkFBb0Isa0JBQWtCO0FBQ2xELGFBQU87QUFBQSxRQUNMLElBQUk7QUFBQSxRQUNKLE1BQU07QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLFNBQVMsMENBQTBDLGdCQUFnQixjQUFjO0FBQUEsVUFDL0UsVUFBVTtBQUFBLFFBQ1osQ0FBQztBQUFBLE1BQ0g7QUFBQSxJQUNGO0FBRUEsVUFBTSxPQUFPLFVBQVU7QUFDdkIsUUFBSSxPQUFPLFNBQVMsWUFBWSxDQUFDLGFBQWEsS0FBSyxJQUFJLEdBQUc7QUFDeEQsYUFBTztBQUFBLFFBQ0wsSUFBSTtBQUFBLFFBQ0osTUFBTTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsU0FBUztBQUFBLFFBQ1QsTUFBTTtBQUFBLE1BQ1I7QUFBQSxJQUNGO0FBRUEsUUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJLEdBQUc7QUFDeEIsYUFBTztBQUFBLFFBQ0wsSUFBSTtBQUFBLFFBQ0osTUFBTTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsU0FBUyxTQUFTLElBQUksbUNBQW1DLFNBQVM7QUFBQSxRQUNsRSxNQUFNO0FBQUEsTUFDUjtBQUFBLElBQ0Y7QUFFQSxVQUFNLFlBQVksVUFBVTtBQUM1QixRQUFJLGNBQWMsUUFBVztBQUMzQixVQUFJLE9BQU8sY0FBYyxZQUFZLENBQUMsbUJBQW1CLEtBQUssU0FBUyxHQUFHO0FBQ3hFLGVBQU87QUFBQSxVQUNMLElBQUk7QUFBQSxVQUNKLE1BQU07QUFBQSxVQUNOLFFBQVE7QUFBQSxVQUNSLFNBQVM7QUFBQSxVQUNULE1BQU07QUFBQSxRQUNSO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFFQSxVQUFNLFVBQVUsVUFBVSxXQUFXLENBQUM7QUFDdEMsUUFBSSxDQUFDLGNBQWMsT0FBTyxHQUFHO0FBQzNCLGFBQU87QUFBQSxRQUNMLElBQUk7QUFBQSxRQUNKLE1BQU07QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLFNBQVM7QUFBQSxRQUNULE1BQU07QUFBQSxRQUNOLFdBQVcsT0FBTyxjQUFjLFdBQVcsWUFBWTtBQUFBLE1BQ3pEO0FBQUEsSUFDRjtBQUVBLFVBQU0sVUFBVSxlQUFlLFNBQVMsV0FBVyxDQUFDO0FBQ3BELFFBQUksQ0FBQyxRQUFRLElBQUk7QUFDZixhQUFPO0FBQUEsUUFDTCxJQUFJO0FBQUEsUUFDSixNQUFNO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixTQUFTLHFDQUFxQyxRQUFRLEdBQUc7QUFBQSxRQUN6RCxNQUFNLFFBQVE7QUFBQSxRQUNkLFdBQVcsT0FBTyxjQUFjLFdBQVcsWUFBWTtBQUFBLE1BQ3pEO0FBQUEsSUFDRjtBQUVBLFFBQUksWUFBWSxTQUFTLElBQUksbUJBQW1CO0FBQzlDLGFBQU87QUFBQSxRQUNMLElBQUk7QUFBQSxRQUNKLE1BQU07QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLFNBQVMsdUJBQXVCLGlCQUFpQjtBQUFBLFFBQ2pELFdBQVcsT0FBTyxjQUFjLFdBQVcsWUFBWTtBQUFBLE1BQ3pEO0FBQUEsSUFDRjtBQUdBLFVBQU0sV0FBVztBQUFBLE1BQ2YsaUJBQWlCO0FBQUEsTUFDakI7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUNBLFFBQUksT0FBTyxjQUFjLFVBQVU7QUFDakMsZUFBUyxZQUFZO0FBQUEsSUFDdkI7QUFFQSxXQUFPLEVBQUUsSUFBSSxNQUFNLFNBQVM7QUFBQSxFQUM5Qjs7O0FDOVNPLE1BQU0sZ0JBQU4sY0FBNEIsTUFBTTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQU12QyxZQUFZLE1BQU0sU0FBUyxRQUFRO0FBQ2pDLFlBQU0sT0FBTztBQUNiLFdBQUssT0FBTztBQUNaLFdBQUssT0FBTztBQUNaLFVBQUksUUFBUTtBQUNWLGFBQUssU0FBUztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFHQSxNQUFNLGNBQWM7QUFBQSxJQUNsQixRQUFRO0FBQUEsSUFBQztBQUFBLElBQ1QsT0FBTztBQUFBLElBQUM7QUFBQSxJQUNSLFFBQVE7QUFBQSxJQUFDO0FBQUEsRUFDWDtBQWVPLFdBQVMsYUFBYSxTQUFTO0FBQ3BDLFVBQU0sRUFBRSxNQUFNLGtCQUFrQixTQUFTLFlBQVksSUFBSTtBQUN6RCxVQUFNLFlBQVksUUFBUSxhQUFhO0FBQ3ZDLFVBQU0sY0FBYyxRQUFRLGVBQWU7QUFDM0MsVUFBTSxvQkFDSixxQkFBcUIsV0FBVyxrQkFDNUIsV0FBVyxrQkFDWCxXQUFXO0FBQ2pCLFVBQU0sZ0JBQWdCLElBQUk7QUFBQSxNQUN4QixzQkFBc0IsV0FBVyxrQkFBa0Isa0JBQWtCO0FBQUEsSUFDdkU7QUFFQSxRQUFJLFdBQVc7QUFDZixVQUFNLGtCQUNKLFFBQVEsb0JBQ1AsTUFBTTtBQUNMLGtCQUFZO0FBQ1osYUFBTyxJQUFJLFNBQVMsU0FBUyxFQUFFLENBQUMsSUFBSSxLQUFLLE9BQU8sRUFBRSxTQUFTLEVBQUUsRUFBRSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQUEsSUFDN0U7QUFHRixVQUFNLFVBQVUsb0JBQUksSUFBSTtBQUV4QixVQUFNLFdBQVcsb0JBQUksSUFBSTtBQUN6QixVQUFNLGdCQUFnQixvQkFBSSxJQUFJO0FBQzlCLFFBQUksV0FBVztBQU9mLGFBQVMsS0FBSyxNQUFNLFNBQVMsV0FBVztBQUN0QyxVQUFJLFVBQVU7QUFDWixjQUFNLElBQUksY0FBYyxlQUFlLHFCQUFxQjtBQUFBLE1BQzlEO0FBQ0EsVUFBSSxDQUFDLGNBQWMsSUFBSSxJQUFJLEdBQUc7QUFDNUIsY0FBTSxJQUFJLGNBQWMsY0FBYyxTQUFTLElBQUksc0NBQXNDO0FBQUEsTUFDM0Y7QUFDQSxZQUFNLFdBQVcsZUFBZSxNQUFNLFNBQVMsU0FBUztBQUN4RCxVQUFJLFlBQVksUUFBUSxJQUFJLEtBQVc7QUFDckMsY0FBTSxJQUFJLGNBQWMsV0FBVyx3Q0FBd0M7QUFBQSxNQUM3RTtBQUNBLFdBQUssUUFBUTtBQUNiLGFBQU8sTUFBTSxpQkFBaUI7QUFBQSxRQUM1QjtBQUFBLFFBQ0EsV0FBVyxhQUFhO0FBQUEsUUFDeEIsT0FBTyxZQUFZLFFBQVE7QUFBQSxNQUM3QixDQUFDO0FBQUEsSUFDSDtBQVFBLGFBQVMsVUFBVSxNQUFNLFNBQVMsV0FBVyxRQUFRO0FBQ25ELFVBQUk7QUFDRixhQUFLLGtCQUFrQixtQkFBbUIsTUFBTSxTQUFTLE1BQU0sR0FBRyxTQUFTO0FBQUEsTUFDN0UsUUFBUTtBQUFBLE1BRVI7QUFBQSxJQUNGO0FBT0EsYUFBUyxHQUFHLE1BQU0sU0FBUztBQUN6QixlQUFTLElBQUksTUFBTSxPQUFPO0FBQzFCLGFBQU8sTUFBTTtBQUNYLFlBQUksU0FBUyxJQUFJLElBQUksTUFBTSxTQUFTO0FBQ2xDLG1CQUFTLE9BQU8sSUFBSTtBQUFBLFFBQ3RCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFVQSxhQUFTLFFBQVEsTUFBTSxVQUFVLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxHQUFHO0FBQ3hELFVBQUksVUFBVTtBQUNaLGVBQU8sUUFBUSxPQUFPLElBQUksY0FBYyxlQUFlLHFCQUFxQixDQUFDO0FBQUEsTUFDL0U7QUFDQSxVQUFJLFFBQVEsUUFBUSxhQUFhO0FBQy9CLGVBQU8sUUFBUTtBQUFBLFVBQ2IsSUFBSSxjQUFjLFdBQVcsZ0NBQWdDLFdBQVcsSUFBSTtBQUFBLFFBQzlFO0FBQUEsTUFDRjtBQUNBLFlBQU0sWUFBWSxnQkFBZ0I7QUFDbEMsWUFBTSxtQkFBbUIsZUFBZSxhQUFhO0FBRXJELGFBQU8sSUFBSSxRQUFRLENBQUMsU0FBUyxXQUFXO0FBQ3RDLGNBQU0sUUFBUSxXQUFXLE1BQU07QUFDN0Isa0JBQVEsT0FBTyxTQUFTO0FBQ3hCO0FBQUEsWUFDRSxJQUFJO0FBQUEsY0FDRjtBQUFBLGNBQ0EsbUJBQW1CLElBQUksWUFBWSxnQkFBZ0I7QUFBQSxjQUNuRDtBQUFBLGdCQUNFO0FBQUEsZ0JBQ0E7QUFBQSxjQUNGO0FBQUEsWUFDRjtBQUFBLFVBQ0Y7QUFBQSxRQUNGLEdBQUcsZ0JBQWdCO0FBQ25CLGdCQUFRLElBQUksV0FBVyxFQUFFLFNBQVMsUUFBUSxNQUFNLENBQUM7QUFDakQsWUFBSTtBQUNGLGVBQUssTUFBTSxTQUFTLFNBQVM7QUFBQSxRQUMvQixTQUFTLE9BQU87QUFDZCx1QkFBYSxLQUFLO0FBQ2xCLGtCQUFRLE9BQU8sU0FBUztBQUN4QixpQkFBTyxLQUFLO0FBQUEsUUFDZDtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0g7QUFNQSxtQkFBZSxjQUFjLEtBQUs7QUFDaEMsVUFBSSxVQUFVO0FBQ1osZUFBTyxFQUFFLElBQUksT0FBTyxNQUFNLGVBQWUsUUFBUSxXQUFXO0FBQUEsTUFDOUQ7QUFFQSxZQUFNLGFBQWEsaUJBQWlCLEtBQUssRUFBRSxXQUFXLGlCQUFpQixDQUFDO0FBQ3hFLFVBQUksQ0FBQyxXQUFXLElBQUk7QUFDbEIsWUFBSSxDQUFDLGNBQWMsSUFBSSxXQUFXLE1BQU0sR0FBRztBQUN6Qyx3QkFBYyxJQUFJLFdBQVcsTUFBTTtBQUNuQyxpQkFBTyxLQUFLLHFCQUFxQjtBQUFBLFlBQy9CLFFBQVEsV0FBVztBQUFBLFlBQ25CLE1BQU0sV0FBVyxRQUFRO0FBQUEsVUFDM0IsQ0FBQztBQUFBLFFBQ0g7QUFDQSxrQkFBVSxXQUFXLE1BQU0sV0FBVyxTQUFTLFdBQVcsV0FBVztBQUFBLFVBQ25FLFFBQVEsV0FBVztBQUFBLFFBQ3JCLENBQUM7QUFDRCxlQUFPLEVBQUUsSUFBSSxPQUFPLE1BQU0sV0FBVyxNQUFNLFFBQVEsV0FBVyxPQUFPO0FBQUEsTUFDdkU7QUFFQSxZQUFNLFdBQVcsV0FBVztBQUM1QixZQUFNLEVBQUUsTUFBTSxXQUFXLFFBQVEsSUFBSTtBQUNyQyxhQUFPLE1BQU0sb0JBQW9CO0FBQUEsUUFDL0I7QUFBQSxRQUNBLFdBQVcsYUFBYTtBQUFBLFFBQ3hCLE9BQU8sWUFBWSxRQUFRO0FBQUEsTUFDN0IsQ0FBQztBQUVELFVBQUksU0FBUyxrQkFBa0I7QUFDN0IsWUFBSSxhQUFhLFFBQVEsSUFBSSxTQUFTLEdBQUc7QUFDdkMsZ0JBQU0sUUFBUSxRQUFRLElBQUksU0FBUztBQUNuQyxjQUFJLE9BQU87QUFDVCx5QkFBYSxNQUFNLEtBQUs7QUFDeEIsb0JBQVEsT0FBTyxTQUFTO0FBQ3hCLGtCQUFNLE9BQU8sT0FBTyxRQUFRLFNBQVMsV0FBVyxRQUFRLE9BQU87QUFDL0Qsa0JBQU0sVUFDSixPQUFPLFFBQVEsWUFBWSxXQUN2QixRQUFRLFVBQ1I7QUFDTixrQkFBTSxPQUFPLElBQUksY0FBYyxNQUFNLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztBQUFBLFVBQzlEO0FBQUEsUUFDRjtBQUNBLGVBQU8sRUFBRSxJQUFJLEtBQUs7QUFBQSxNQUNwQjtBQUVBLFVBQUksYUFBYSxRQUFRLElBQUksU0FBUyxHQUFHO0FBQ3ZDLGNBQU0sUUFBUSxRQUFRLElBQUksU0FBUztBQUNuQyxZQUFJLE9BQU87QUFDVCx1QkFBYSxNQUFNLEtBQUs7QUFDeEIsa0JBQVEsT0FBTyxTQUFTO0FBQ3hCLGdCQUFNLFFBQVEsRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUFBLFFBQ2pDO0FBQ0EsZUFBTyxFQUFFLElBQUksS0FBSztBQUFBLE1BQ3BCO0FBRUEsWUFBTSxVQUFVLFNBQVMsSUFBSSxJQUFJO0FBQ2pDLFVBQUksQ0FBQyxTQUFTO0FBRVosZUFBTyxNQUFNLHNCQUFzQixFQUFFLE1BQU0sV0FBVyxhQUFhLEtBQUssQ0FBQztBQUN6RSxlQUFPLEVBQUUsSUFBSSxLQUFLO0FBQUEsTUFDcEI7QUFFQSxVQUFJO0FBQ0YsY0FBTSxRQUFRLFNBQVMsRUFBRSxVQUFVLENBQUM7QUFDcEMsZUFBTyxFQUFFLElBQUksS0FBSztBQUFBLE1BQ3BCLFNBQVMsT0FBTztBQUNkLGNBQU0sVUFBVSxpQkFBaUIsUUFBUSxNQUFNLFVBQVUsT0FBTyxLQUFLO0FBQ3JFLGNBQU0sT0FDSixpQkFBaUIsZ0JBQ2IsTUFBTTtBQUFBO0FBQUEsVUFDMkIsT0FBUSxRQUFRO0FBQUE7QUFDdkQsZUFBTyxNQUFNLDJCQUEyQixFQUFFLE1BQU0sT0FBTyxRQUFRLENBQUM7QUFDaEUsa0JBQVUsTUFBTSxTQUFTLFNBQVM7QUFDbEMsZUFBTyxFQUFFLElBQUksT0FBTyxLQUFLO0FBQUEsTUFDM0I7QUFBQSxJQUNGO0FBS0EsYUFBUyxRQUFRLFNBQVMsWUFBWTtBQUNwQyxVQUFJLFVBQVU7QUFDWjtBQUFBLE1BQ0Y7QUFDQSxpQkFBVztBQUNYLGlCQUFXLENBQUMsRUFBRSxLQUFLLEtBQUssU0FBUztBQUMvQixxQkFBYSxNQUFNLEtBQUs7QUFDeEIsY0FBTSxPQUFPLElBQUksY0FBYyxlQUFlLGtCQUFrQixNQUFNLEVBQUUsQ0FBQztBQUFBLE1BQzNFO0FBQ0EsY0FBUSxNQUFNO0FBQ2QsZUFBUyxNQUFNO0FBQUEsSUFDakI7QUFFQSxXQUFPO0FBQUEsTUFDTDtBQUFBLE1BQ0E7QUFBQSxNQUNBLFNBQVM7QUFBQSxNQUNUO0FBQUEsTUFDQTtBQUFBLE1BQ0EsY0FBYyxNQUFNLFFBQVE7QUFBQSxNQUM1QixZQUFZLE1BQU07QUFBQSxNQUNsQixXQUFXO0FBQUEsSUFDYjtBQUFBLEVBQ0Y7OztBQ3RSTyxNQUFNLGtCQUFrQixPQUFPLE9BQU87QUFBQSxJQUMzQyxXQUFXO0FBQUEsSUFDWCxZQUFZO0FBQUEsSUFDWixlQUFlO0FBQUEsSUFDZixhQUFhO0FBQUEsSUFDYixXQUFXO0FBQUEsRUFDYixDQUFDOzs7QUNYTSxNQUFNLGlCQUFpQixPQUFPLE9BQU87QUFBQSxJQUMxQztBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0YsQ0FBQztBQUdNLE1BQU0saUJBQWlCLE9BQU8sT0FBTztBQUFBLElBQzFDO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRixDQUFDO0FBR00sTUFBTSxlQUFlLE9BQU8sT0FBTztBQUFBLElBQ3hDO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0YsQ0FBQztBQUdNLE1BQU0sd0JBQXdCLE9BQU8sT0FBTztBQUFBLElBQ2pEO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRixDQUFDO0FBR00sTUFBTSxvQkFBb0IsT0FBTyxPQUFPLENBQUMsU0FBUyxZQUFZLFVBQVUsT0FBTyxDQUFDO0FBR2hGLE1BQU0sa0JBQWtCLE9BQU8sT0FBTyxDQUFDLGFBQWEsVUFBVSxDQUFDOzs7QUNuRS9ELE1BQU0sY0FBYyxPQUFPLE9BQU8sQ0FBQyxZQUFZLFdBQVcsZ0JBQWdCLENBQUM7QUFFM0UsTUFBTSxxQkFBcUIsT0FBTyxPQUFPO0FBQUEsSUFDOUM7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0YsQ0FBQztBQUVNLE1BQU0sMEJBQTBCLE9BQU8sT0FBTztBQUFBLElBQ25EO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRixDQUFDO0FBRU0sTUFBTSxnQkFBZ0IsT0FBTyxPQUFPO0FBQUEsSUFDekM7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRixDQUFDO0FBRU0sTUFBTSxrQkFBa0IsT0FBTyxPQUFPO0FBQUEsSUFDM0M7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0YsQ0FBQztBQUVNLE1BQU0sY0FBYyxPQUFPLE9BQU87QUFBQSxJQUN2QyxpQkFBaUI7QUFBQSxJQUNqQixhQUFhO0FBQUEsSUFDYixjQUFjO0FBQUEsSUFDZCxVQUFVO0FBQUEsSUFDVixVQUFVO0FBQUEsSUFDViwwQkFBMEI7QUFBQSxFQUM1QixDQUFDO0FBTU0sTUFBTSxrQkFBa0IsT0FBTyxPQUFPO0FBQUEsSUFDM0MsVUFBVTtBQUFBLElBQ1YsVUFBVTtBQUFBLElBQ1YsVUFBVTtBQUFBLElBQ1YsWUFBWTtBQUFBLEVBQ2QsQ0FBQzs7O0FDMURNLE1BQU0sb0JBQW9CO0FBaUcxQixXQUFTLFlBQVksS0FBSztBQUUvQixVQUFNLFNBQVMsQ0FBQztBQUNoQixRQUFJLE9BQU8sUUFBUSxZQUFZLFFBQVEsUUFBUSxNQUFNLFFBQVEsR0FBRyxHQUFHO0FBQ2pFLGFBQU8sRUFBRSxJQUFJLE9BQU8sUUFBUSxDQUFDLHdCQUF3QixFQUFFO0FBQUEsSUFDekQ7QUFDQSxVQUFNO0FBQUE7QUFBQSxNQUFvRDtBQUFBO0FBQzFELFFBQUksVUFBVSxlQUFlLG1CQUFtQjtBQUM5QyxhQUFPLEtBQUssMkJBQTJCLE9BQU8sVUFBVSxVQUFVLENBQUMsR0FBRztBQUFBLElBQ3hFO0FBQ0EsUUFBSSxVQUFVLFlBQVksT0FBTztBQUMvQixxQkFBZSxXQUFXLE1BQU07QUFDaEMsYUFBTyxPQUFPLFNBQVMsSUFDbkIsRUFBRSxJQUFJLE9BQU8sT0FBTyxJQUNwQixFQUFFLElBQUksTUFBTTtBQUFBO0FBQUEsUUFBOEI7QUFBQSxRQUFLO0FBQUEsSUFDckQ7QUFDQSxRQUFJLFVBQVUsWUFBWSxjQUFjO0FBQ3RDLDJCQUFxQixXQUFXLE1BQU07QUFDdEMsYUFBTyxPQUFPLFNBQVMsSUFDbkIsRUFBRSxJQUFJLE9BQU8sT0FBTyxJQUNwQixFQUFFLElBQUksTUFBTTtBQUFBO0FBQUEsUUFBOEI7QUFBQSxRQUFLO0FBQUEsSUFDckQ7QUFDQSxVQUFNLFFBQVEsVUFBVTtBQUN4QixVQUFNLFFBQVEsVUFBVTtBQUN4QixRQUFJLENBQUMsTUFBTSxRQUFRLEtBQUssR0FBRztBQUN6QixhQUFPLEtBQUsseUJBQXlCO0FBQUEsSUFDdkM7QUFDQSxRQUFJLENBQUMsTUFBTSxRQUFRLEtBQUssR0FBRztBQUN6QixhQUFPLEtBQUsseUJBQXlCO0FBQUEsSUFDdkM7QUFDQSxRQUFJLE1BQU0sUUFBUSxLQUFLLEtBQUssTUFBTSxRQUFRLEtBQUssR0FBRztBQUNoRCxZQUFNLE1BQU0sb0JBQUksSUFBSTtBQUNwQixpQkFBVyxRQUFRLE9BQU87QUFDeEIsY0FBTTtBQUFBO0FBQUEsVUFBNkMsS0FBTTtBQUFBO0FBQ3pELFlBQUksT0FBTyxPQUFPLFVBQVU7QUFDMUIsaUJBQU8sS0FBSywrQkFBK0I7QUFDM0M7QUFBQSxRQUNGO0FBQ0EsWUFBSSxJQUFJLElBQUksRUFBRSxHQUFHO0FBQ2YsaUJBQU8sS0FBSyxzQkFBc0IsRUFBRSxJQUFJO0FBQUEsUUFDMUM7QUFDQSxZQUFJLElBQUksRUFBRTtBQUFBLE1BQ1o7QUFDQSxpQkFBVyxRQUFRLE9BQU87QUFDeEIsY0FBTTtBQUFBO0FBQUEsVUFBaUQ7QUFBQTtBQUN2RCxZQUFJLE9BQU8sT0FBTyxTQUFTLFlBQVksQ0FBQyxJQUFJLElBQUksT0FBTyxJQUFJLEdBQUc7QUFDNUQsaUJBQU8sS0FBSyxTQUFTLE9BQU8sT0FBTyxFQUFFLENBQUMsK0JBQStCO0FBQUEsUUFDdkU7QUFDQSxZQUFJLE9BQU8sT0FBTyxPQUFPLFlBQVksQ0FBQyxJQUFJLElBQUksT0FBTyxFQUFFLEdBQUc7QUFDeEQsaUJBQU8sS0FBSyxTQUFTLE9BQU8sT0FBTyxFQUFFLENBQUMsK0JBQStCO0FBQUEsUUFDdkU7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUNBLFFBQUksT0FBTyxTQUFTLEdBQUc7QUFDckIsYUFBTyxFQUFFLElBQUksT0FBTyxPQUFPO0FBQUEsSUFDN0I7QUFDQSxXQUFPLEVBQUUsSUFBSSxNQUFNO0FBQUE7QUFBQSxNQUE4QjtBQUFBLE1BQUs7QUFBQSxFQUN4RDtBQU1BLFdBQVMsZUFBZSxXQUFXLFFBQVE7QUFDekMsUUFBSSxVQUFVLGNBQWMsT0FBTztBQUNqQyxhQUFPLEtBQUsseUNBQXlDO0FBQUEsSUFDdkQ7QUFDQSxVQUFNLEtBQUssVUFBVTtBQUNyQixRQUFJLE9BQU8sT0FBTyxZQUFZLE9BQU8sUUFBUSxNQUFNLFFBQVEsRUFBRSxHQUFHO0FBQzlELGFBQU8sS0FBSyw2QkFBNkI7QUFBQSxJQUMzQyxPQUFPO0FBQ0wsWUFBTTtBQUFBO0FBQUEsUUFBaUQ7QUFBQTtBQUN2RCxpQkFBVyxPQUFPLENBQUMsWUFBWSxRQUFRLGlCQUFpQixNQUFNLEdBQUc7QUFDL0QsWUFBSSxPQUFPLE9BQU8sR0FBRyxNQUFNLFVBQVU7QUFDbkMsaUJBQU8sS0FBSyxZQUFZLEdBQUcsb0JBQW9CO0FBQUEsUUFDakQ7QUFBQSxNQUNGO0FBQ0EsVUFBSSxPQUFPLFVBQVUsUUFBUSxDQUFDLFdBQVcsT0FBTyxLQUFLLEdBQUc7QUFDdEQsZUFBTyxLQUFLLG1EQUFtRDtBQUFBLE1BQ2pFO0FBQUEsSUFDRjtBQUVBLFVBQU0sUUFBUSxVQUFVO0FBQ3hCLFVBQU0sUUFBUSxVQUFVO0FBQ3hCLFFBQUksQ0FBQyxNQUFNLFFBQVEsS0FBSyxHQUFHO0FBQ3pCLGFBQU8sS0FBSyx5QkFBeUI7QUFDckM7QUFBQSxJQUNGO0FBQ0EsUUFBSSxDQUFDLE1BQU0sUUFBUSxLQUFLLEdBQUc7QUFDekIsYUFBTyxLQUFLLHlCQUF5QjtBQUNyQztBQUFBLElBQ0Y7QUFFQSxVQUFNLE1BQU0sb0JBQUksSUFBSTtBQUVwQixVQUFNLFdBQVcsQ0FBQztBQUVsQixVQUFNLFVBQVUsQ0FBQztBQUNqQixlQUFXLFNBQVMsT0FBTztBQUN6QixVQUFJLE9BQU8sVUFBVSxZQUFZLFVBQVUsUUFBUSxNQUFNLFFBQVEsS0FBSyxHQUFHO0FBQ3ZFLGVBQU8sS0FBSywrQkFBK0I7QUFDM0M7QUFBQSxNQUNGO0FBQ0EsWUFBTTtBQUFBO0FBQUEsUUFBK0M7QUFBQTtBQUNyRCxZQUFNLEtBQUssS0FBSztBQUNoQixVQUFJLE9BQU8sT0FBTyxVQUFVO0FBQzFCLGVBQU8sS0FBSywrQkFBK0I7QUFDM0M7QUFBQSxNQUNGO0FBQ0EsVUFBSSxJQUFJLElBQUksRUFBRSxHQUFHO0FBQ2YsZUFBTyxLQUFLLHNCQUFzQixFQUFFLElBQUk7QUFBQSxNQUMxQztBQUNBLFVBQUksSUFBSSxFQUFFO0FBQ1YsVUFBSSxDQUFDLGVBQWUsU0FBUyxPQUFPLEtBQUssSUFBSSxDQUFDLEdBQUc7QUFDL0MsZUFBTyxLQUFLLFNBQVMsRUFBRSx1QkFBdUIsT0FBTyxLQUFLLElBQUksQ0FBQyxJQUFJO0FBQUEsTUFDckU7QUFDQSxVQUFJLENBQUMsYUFBYSxTQUFTLE9BQU8sS0FBSyxNQUFNLENBQUMsR0FBRztBQUMvQyxlQUFPLEtBQUssU0FBUyxFQUFFLHlCQUF5QixPQUFPLEtBQUssTUFBTSxDQUFDLElBQUk7QUFBQSxNQUN6RTtBQUNBLFVBQUksT0FBTyxLQUFLLFVBQVUsVUFBVTtBQUNsQyxlQUFPLEtBQUssU0FBUyxFQUFFLHlCQUF5QjtBQUFBLE1BQ2xEO0FBQ0EsVUFDRSxDQUFDLE1BQU0sUUFBUSxLQUFLLFVBQVUsS0FDOUIsS0FBSyxXQUFXLEtBQUssQ0FBQyxTQUFTLE9BQU8sU0FBUyxRQUFRLEdBQ3ZEO0FBQ0EsZUFBTyxLQUFLLFNBQVMsRUFBRSw0QkFBNEI7QUFBQSxNQUNyRDtBQUNBLFVBQUksS0FBSyxVQUFVLFFBQVEsQ0FBQyxXQUFXLEtBQUssS0FBSyxHQUFHO0FBQ2xELGVBQU8sS0FBSyxTQUFTLEVBQUUsbUNBQW1DO0FBQUEsTUFDNUQ7QUFDQSxVQUFJLENBQUMsV0FBVyxLQUFLLFFBQVEsR0FBRztBQUM5QixlQUFPLEtBQUssU0FBUyxFQUFFLDRCQUE0QjtBQUFBLE1BQ3JEO0FBQ0EsVUFBSSxLQUFLLFNBQVMsU0FBUztBQUN6QixpQkFBUyxLQUFLLEVBQUU7QUFBQSxNQUNsQjtBQUNBLFVBQUksS0FBSyxTQUFTLFFBQVE7QUFDeEIsZ0JBQVEsS0FBSyxFQUFFO0FBQUEsTUFDakI7QUFDQSxVQUFJLEtBQUssVUFBVSxRQUFXO0FBQzVCLFlBQUksQ0FBQyxNQUFNLFFBQVEsS0FBSyxLQUFLLEdBQUc7QUFDOUIsaUJBQU8sS0FBSyxTQUFTLEVBQUUsd0NBQXdDO0FBQUEsUUFDakUsT0FBTztBQUNMLHFCQUFXLFFBQVEsS0FBSyxPQUFPO0FBQzdCLGdCQUNFLE9BQU8sU0FBUyxZQUNoQixTQUFTLFFBQ1QsT0FBTyxLQUFLLE9BQU8sWUFDbkIsT0FBTyxLQUFLLFVBQVUsWUFDdEIsQ0FBQyxhQUFhLFNBQVMsT0FBTyxLQUFLLE1BQU0sQ0FBQyxHQUMxQztBQUNBLHFCQUFPLEtBQUssU0FBUyxFQUFFLCtCQUErQjtBQUFBLFlBQ3hEO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUNBLFFBQUksU0FBUyxXQUFXLEdBQUc7QUFDekIsYUFBTyxLQUFLLDZDQUE2QyxTQUFTLE1BQU0sR0FBRztBQUFBLElBQzdFO0FBQ0EsUUFBSSxRQUFRLFdBQVcsR0FBRztBQUN4QixhQUFPLEtBQUssNENBQTRDLFFBQVEsTUFBTSxHQUFHO0FBQUEsSUFDM0U7QUFDQSxRQUFJLFVBQVUsWUFBWSxTQUFTLENBQUMsR0FBRztBQUNyQyxhQUFPLEtBQUssd0NBQXdDO0FBQUEsSUFDdEQ7QUFDQSxRQUFJLFVBQVUsV0FBVyxRQUFRLENBQUMsR0FBRztBQUNuQyxhQUFPLEtBQUssc0NBQXNDO0FBQUEsSUFDcEQ7QUFFQSxVQUFNLFVBQVUsb0JBQUksSUFBSTtBQUN4QixlQUFXLFNBQVMsT0FBTztBQUN6QixVQUFJLE9BQU8sVUFBVSxZQUFZLFVBQVUsUUFBUSxNQUFNLFFBQVEsS0FBSyxHQUFHO0FBQ3ZFLGVBQU8sS0FBSywrQkFBK0I7QUFDM0M7QUFBQSxNQUNGO0FBQ0EsWUFBTTtBQUFBO0FBQUEsUUFBK0M7QUFBQTtBQUNyRCxZQUFNLEtBQUssS0FBSztBQUNoQixVQUFJLE9BQU8sT0FBTyxVQUFVO0FBQzFCLGVBQU8sS0FBSywrQkFBK0I7QUFDM0M7QUFBQSxNQUNGO0FBQ0EsVUFBSSxRQUFRLElBQUksRUFBRSxHQUFHO0FBQ25CLGVBQU8sS0FBSyxzQkFBc0IsRUFBRSxJQUFJO0FBQUEsTUFDMUM7QUFDQSxjQUFRLElBQUksRUFBRTtBQUNkLFVBQUksT0FBTyxLQUFLLFNBQVMsWUFBWSxDQUFDLElBQUksSUFBSSxLQUFLLElBQUksR0FBRztBQUN4RCxlQUFPLEtBQUssU0FBUyxFQUFFLCtCQUErQjtBQUFBLE1BQ3hEO0FBQ0EsVUFBSSxPQUFPLEtBQUssT0FBTyxZQUFZLENBQUMsSUFBSSxJQUFJLEtBQUssRUFBRSxHQUFHO0FBQ3BELGVBQU8sS0FBSyxTQUFTLEVBQUUsK0JBQStCO0FBQUEsTUFDeEQ7QUFDQSxVQUFJLENBQUMsZUFBZSxTQUFTLE9BQU8sS0FBSyxJQUFJLENBQUMsR0FBRztBQUMvQyxlQUFPLEtBQUssU0FBUyxFQUFFLHVCQUF1QixPQUFPLEtBQUssSUFBSSxDQUFDLElBQUk7QUFBQSxNQUNyRTtBQUNBLFVBQUksQ0FBQyxhQUFhLFNBQVMsT0FBTyxLQUFLLE1BQU0sQ0FBQyxHQUFHO0FBQy9DLGVBQU8sS0FBSyxTQUFTLEVBQUUseUJBQXlCLE9BQU8sS0FBSyxNQUFNLENBQUMsSUFBSTtBQUFBLE1BQ3pFO0FBQ0EsVUFBSSxPQUFPLEtBQUssVUFBVSxVQUFVO0FBQ2xDLGVBQU8sS0FBSyxTQUFTLEVBQUUseUJBQXlCO0FBQUEsTUFDbEQ7QUFDQSxVQUFJLE9BQU8sS0FBSyxTQUFTLFlBQVksT0FBTyxLQUFLLGNBQWMsVUFBVTtBQUN2RSxlQUFPLEtBQUssU0FBUyxFQUFFLDJDQUEyQztBQUFBLE1BQ3BFO0FBQUEsSUFDRjtBQUVBLFVBQU0sZUFBZSxVQUFVO0FBQy9CLFFBQUksQ0FBQyxNQUFNLFFBQVEsWUFBWSxHQUFHO0FBQ2hDLGFBQU8sS0FBSyxnQ0FBZ0M7QUFBQSxJQUM5QyxPQUFPO0FBQ0wsaUJBQVcsU0FBUyxjQUFjO0FBQ2hDLFlBQ0UsT0FBTyxVQUFVLFlBQ2pCLFVBQVUsUUFDVixPQUFPLE1BQU0sU0FBUyxZQUN0QixPQUFPLE1BQU0sWUFBWSxZQUN6QixDQUFDLENBQUMsUUFBUSxXQUFXLE9BQU8sRUFBRSxTQUFTLE9BQU8sTUFBTSxRQUFRLENBQUMsR0FDN0Q7QUFDQSxpQkFBTyxLQUFLLHVEQUF1RDtBQUFBLFFBQ3JFO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFFQSxVQUFNLFNBQVMsVUFBVTtBQUN6QixRQUNFLE9BQU8sV0FBVyxZQUNsQixXQUFXLFFBQ1gsQ0FBQyxPQUFPLFNBQVMsT0FBTyxLQUFLLEtBQzdCLENBQUMsT0FBTyxTQUFTLE9BQU8sTUFBTSxHQUM5QjtBQUNBLGFBQU8sS0FBSyw0Q0FBNEM7QUFBQSxJQUMxRDtBQUFBLEVBQ0Y7QUFRQSxXQUFTLHFCQUFxQixXQUFXLFFBQVE7QUFDL0MsUUFBSSxVQUFVLGNBQWMsY0FBYztBQUN4QyxhQUFPLEtBQUssdURBQXVEO0FBQUEsSUFDckU7QUFDQSxRQUFJLE9BQU8sVUFBVSxtQkFBbUIsWUFBWSxVQUFVLGVBQWUsV0FBVyxHQUFHO0FBQ3pGLGFBQU8sS0FBSyw0Q0FBNEM7QUFBQSxJQUMxRDtBQUNBLFFBQUksQ0FBQyxZQUFZLFNBQVMsT0FBTyxVQUFVLEtBQUssQ0FBQyxHQUFHO0FBQ2xELGFBQU8sS0FBSyx3QkFBd0IsWUFBWSxLQUFLLElBQUksQ0FBQyxHQUFHO0FBQUEsSUFDL0Q7QUFDQSxRQUFJLE9BQU8sVUFBVSxnQkFBZ0IsWUFBWSxVQUFVLFlBQVksV0FBVyxHQUFHO0FBQ25GLGFBQU8sS0FBSyx5Q0FBeUM7QUFBQSxJQUN2RDtBQUVBLFVBQU0sUUFBUSxVQUFVO0FBQ3hCLFVBQU0sUUFBUSxVQUFVO0FBQ3hCLFFBQUksQ0FBQyxNQUFNLFFBQVEsS0FBSyxHQUFHO0FBQ3pCLGFBQU8sS0FBSyx5QkFBeUI7QUFDckM7QUFBQSxJQUNGO0FBQ0EsUUFBSSxDQUFDLE1BQU0sUUFBUSxLQUFLLEdBQUc7QUFDekIsYUFBTyxLQUFLLHlCQUF5QjtBQUNyQztBQUFBLElBQ0Y7QUFFQSxVQUFNLE1BQU0sb0JBQUksSUFBSTtBQUNwQixlQUFXLFNBQVMsT0FBTztBQUN6QixVQUFJLE9BQU8sVUFBVSxZQUFZLFVBQVUsUUFBUSxNQUFNLFFBQVEsS0FBSyxHQUFHO0FBQ3ZFLGVBQU8sS0FBSywrQkFBK0I7QUFDM0M7QUFBQSxNQUNGO0FBQ0EsWUFBTTtBQUFBO0FBQUEsUUFBK0M7QUFBQTtBQUNyRCxZQUFNLEtBQUssS0FBSztBQUNoQixVQUFJLE9BQU8sT0FBTyxVQUFVO0FBQzFCLGVBQU8sS0FBSywrQkFBK0I7QUFDM0M7QUFBQSxNQUNGO0FBQ0EsVUFBSSxJQUFJLElBQUksRUFBRSxHQUFHO0FBQ2YsZUFBTyxLQUFLLHNCQUFzQixFQUFFLElBQUk7QUFBQSxNQUMxQztBQUNBLFVBQUksSUFBSSxFQUFFO0FBQ1YsVUFBSSxDQUFDLGdCQUFnQixTQUFTLE9BQU8sS0FBSyxJQUFJLENBQUMsR0FBRztBQUNoRCxlQUFPLEtBQUssU0FBUyxFQUFFLGtDQUFrQyxPQUFPLEtBQUssSUFBSSxDQUFDLElBQUk7QUFBQSxNQUNoRjtBQUNBLFVBQUksQ0FBQyxhQUFhLFNBQVMsT0FBTyxLQUFLLE1BQU0sQ0FBQyxHQUFHO0FBQy9DLGVBQU8sS0FBSyxTQUFTLEVBQUUseUJBQXlCLE9BQU8sS0FBSyxNQUFNLENBQUMsSUFBSTtBQUFBLE1BQ3pFO0FBQ0EsVUFBSSxDQUFDLFdBQVcsS0FBSyxRQUFRLEdBQUc7QUFDOUIsZUFBTyxLQUFLLFNBQVMsRUFBRSw0QkFBNEI7QUFBQSxNQUNyRDtBQUFBLElBQ0Y7QUFFQSxVQUFNLFVBQVUsb0JBQUksSUFBSTtBQUN4QixlQUFXLFNBQVMsT0FBTztBQUN6QixVQUFJLE9BQU8sVUFBVSxZQUFZLFVBQVUsUUFBUSxNQUFNLFFBQVEsS0FBSyxHQUFHO0FBQ3ZFLGVBQU8sS0FBSywrQkFBK0I7QUFDM0M7QUFBQSxNQUNGO0FBQ0EsWUFBTTtBQUFBO0FBQUEsUUFBK0M7QUFBQTtBQUNyRCxZQUFNLEtBQUssS0FBSztBQUNoQixVQUFJLE9BQU8sT0FBTyxVQUFVO0FBQzFCLGVBQU8sS0FBSywrQkFBK0I7QUFDM0M7QUFBQSxNQUNGO0FBQ0EsVUFBSSxRQUFRLElBQUksRUFBRSxHQUFHO0FBQ25CLGVBQU8sS0FBSyxzQkFBc0IsRUFBRSxJQUFJO0FBQUEsTUFDMUM7QUFDQSxjQUFRLElBQUksRUFBRTtBQUNkLFVBQUksT0FBTyxLQUFLLFNBQVMsWUFBWSxDQUFDLElBQUksSUFBSSxLQUFLLElBQUksR0FBRztBQUN4RCxlQUFPLEtBQUssU0FBUyxFQUFFLCtCQUErQjtBQUFBLE1BQ3hEO0FBQ0EsVUFBSSxPQUFPLEtBQUssT0FBTyxZQUFZLENBQUMsSUFBSSxJQUFJLEtBQUssRUFBRSxHQUFHO0FBQ3BELGVBQU8sS0FBSyxTQUFTLEVBQUUsK0JBQStCO0FBQUEsTUFDeEQ7QUFDQSxVQUFJLENBQUMsd0JBQXdCLFNBQVMsT0FBTyxLQUFLLElBQUksQ0FBQyxHQUFHO0FBQ3hELGVBQU8sS0FBSyxTQUFTLEVBQUUsdUJBQXVCLE9BQU8sS0FBSyxJQUFJLENBQUMsSUFBSTtBQUFBLE1BQ3JFO0FBQ0EsVUFBSSxDQUFDLGFBQWEsU0FBUyxPQUFPLEtBQUssTUFBTSxDQUFDLEdBQUc7QUFDL0MsZUFBTyxLQUFLLFNBQVMsRUFBRSx5QkFBeUIsT0FBTyxLQUFLLE1BQU0sQ0FBQyxJQUFJO0FBQUEsTUFDekU7QUFDQSxVQUFJLE9BQU8sS0FBSyxTQUFTLFlBQVksT0FBTyxLQUFLLGNBQWMsVUFBVTtBQUN2RSxlQUFPLEtBQUssU0FBUyxFQUFFLDJDQUEyQztBQUFBLE1BQ3BFO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFNQSxXQUFTLFdBQVcsT0FBTztBQUN6QixRQUFJLE9BQU8sVUFBVSxZQUFZLFVBQVUsUUFBUSxNQUFNLFFBQVEsS0FBSyxHQUFHO0FBQ3ZFLGFBQU87QUFBQSxJQUNUO0FBQ0EsVUFBTTtBQUFBO0FBQUEsTUFBZ0Q7QUFBQTtBQUN0RCxXQUNFLE9BQU8sTUFBTSxXQUFXLFlBQ3hCLE9BQU8sVUFBVSxNQUFNLFNBQVMsS0FDaEMsT0FBTyxVQUFVLE1BQU0sV0FBVyxLQUNsQyxPQUFPLFVBQVUsTUFBTSxPQUFPLEtBQzlCLE9BQU8sVUFBVSxNQUFNLFNBQVMsS0FDaEMsTUFBTSxhQUFhLEtBQ25CLE1BQU0sZUFBZSxLQUNyQixNQUFNLFdBQVcsS0FDakIsTUFBTSxhQUFhO0FBQUEsRUFFdkI7QUFNQSxXQUFTLFdBQVcsT0FBTztBQUN6QixRQUFJLE9BQU8sVUFBVSxZQUFZLFVBQVUsUUFBUSxNQUFNLFFBQVEsS0FBSyxHQUFHO0FBQ3ZFLGFBQU87QUFBQSxJQUNUO0FBQ0EsVUFBTTtBQUFBO0FBQUEsTUFBbUQ7QUFBQTtBQUN6RCxXQUNFLE9BQU8sU0FBUyxTQUFTLENBQUMsS0FDMUIsT0FBTyxTQUFTLFNBQVMsQ0FBQyxLQUMxQixPQUFPLFNBQVMsU0FBUyxLQUFLLEtBQzlCLE9BQU8sU0FBUyxTQUFTLE1BQU0sS0FDL0IsT0FBTyxVQUFVLFNBQVMsS0FBSztBQUFBLEVBRW5DOzs7QUNsZEEsTUFBTSxTQUFTO0FBWWYsV0FBUyxNQUFNLE1BQU0sYUFBYSxDQUFDLEdBQUc7QUFDcEMsVUFBTSxVQUFVLFNBQVMsZ0JBQWdCLFFBQVEsSUFBSTtBQUNyRCxlQUFXLENBQUMsS0FBSyxLQUFLLEtBQUssT0FBTyxRQUFRLFVBQVUsR0FBRztBQUNyRCxjQUFRLGFBQWEsS0FBSyxPQUFPLEtBQUssQ0FBQztBQUFBLElBQ3pDO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFPQSxXQUFTLFNBQVMsT0FBTyxLQUFLO0FBQzVCLFVBQU0sT0FBTyxPQUFPLFNBQVMsRUFBRTtBQUMvQixXQUFPLEtBQUssU0FBUyxNQUFNLEdBQUcsS0FBSyxNQUFNLEdBQUcsTUFBTSxDQUFDLENBQUMsV0FBTTtBQUFBLEVBQzVEO0FBYU8sV0FBUyxrQkFBa0IsU0FBUztBQUN6QyxVQUFNLEVBQUUsS0FBQUcsTUFBSyxTQUFTLElBQUk7QUFFMUIsUUFBSSxNQUFNO0FBRVYsUUFBSSxXQUFXO0FBRWYsVUFBTSxlQUFlLG9CQUFJLElBQUk7QUFFN0IsVUFBTSxlQUFlLG9CQUFJLElBQUk7QUFFN0IsUUFBSSxhQUFhO0FBRWpCLFFBQUksUUFBUTtBQUNaLFFBQUksYUFBYTtBQUNqQixRQUFJLGFBQWE7QUFDakIsUUFBSSxXQUFXO0FBQ2YsUUFBSSxZQUFZLEVBQUUsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxFQUFFO0FBRTNDLGFBQVMsaUJBQWlCO0FBQ3hCLFVBQUksVUFBVTtBQUNaLGlCQUFTO0FBQUEsVUFDUDtBQUFBLFVBQ0EsYUFBYSxXQUFXLFFBQVEsQ0FBQyxDQUFDLElBQUksV0FBVyxRQUFRLENBQUMsQ0FBQyxXQUFXLE1BQU0sUUFBUSxDQUFDLENBQUM7QUFBQSxRQUN4RjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBRUEsYUFBUyxVQUFVLE1BQU0sTUFBTTtBQUM3QixVQUFJLFNBQVMsT0FBTztBQUNsQixlQUFPO0FBQUEsVUFDTCxHQUFHLEtBQUssU0FBUyxJQUFJLEtBQUssU0FBUztBQUFBLFVBQ25DLEdBQUcsS0FBSyxTQUFTLElBQUksS0FBSyxTQUFTLFNBQVM7QUFBQSxRQUM5QztBQUFBLE1BQ0Y7QUFDQSxhQUFPLEVBQUUsR0FBRyxLQUFLLFNBQVMsR0FBRyxHQUFHLEtBQUssU0FBUyxJQUFJLEtBQUssU0FBUyxTQUFTLEVBQUU7QUFBQSxJQUM3RTtBQUVBLGFBQVMsU0FBUyxRQUFRLFFBQVE7QUFDaEMsVUFBSSxPQUFPLE9BQU8sT0FBTyxJQUFJO0FBQzNCLGNBQU0sRUFBRSxHQUFHLEdBQUcsT0FBTyxPQUFPLElBQUksT0FBTztBQUN2QyxjQUFNLEtBQUssSUFBSSxRQUFRO0FBQ3ZCLGNBQU0sU0FBUyxJQUFJO0FBQ25CLGVBQU8sS0FBSyxFQUFFLElBQUksTUFBTSxNQUFNLEtBQUssRUFBRSxJQUFJLElBQUksRUFBRSxLQUFLLEtBQUssRUFBRSxJQUFJLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxJQUFJLFNBQVMsQ0FBQztBQUFBLE1BQ2hHO0FBQ0EsWUFBTSxPQUFPLFVBQVUsUUFBUSxLQUFLO0FBQ3BDLFlBQU0sS0FBSyxVQUFVLFFBQVEsSUFBSTtBQUNqQyxZQUFNLE9BQU8sS0FBSyxJQUFJLElBQUksS0FBSyxJQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDO0FBQ3JELGFBQU8sS0FBSyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxDQUFDLEtBQUssR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDO0FBQUEsSUFDcEc7QUFFQSxhQUFTLFFBQVE7QUFDZixVQUFJLFVBQVU7QUFDWixRQUFBQSxLQUFJLFlBQVksUUFBUTtBQUFBLE1BQzFCO0FBQ0EsaUJBQVcsTUFBTSxLQUFLLEVBQUUsT0FBTyxjQUFjLENBQUM7QUFDOUMsTUFBQUEsS0FBSSxZQUFZLFFBQVE7QUFDeEIsbUJBQWEsTUFBTTtBQUNuQixtQkFBYSxNQUFNO0FBQ25CLG1CQUFhO0FBQUEsSUFDZjtBQUVBLGFBQVMsT0FBTyxRQUFRO0FBQ3RCLG1CQUFhO0FBQ2IsaUJBQVcsQ0FBQyxJQUFJLE9BQU8sS0FBSyxjQUFjO0FBQ3hDLGdCQUFRLFVBQVUsT0FBTyxlQUFlLE9BQU8sTUFBTTtBQUFBLE1BQ3ZEO0FBQ0EsaUJBQVcsQ0FBQyxFQUFFLE9BQU8sS0FBSyxjQUFjO0FBQ3RDLGNBQU0sU0FDSixXQUFXLFNBQVMsUUFBUSxRQUFRLFNBQVMsVUFBVSxRQUFRLFFBQVEsT0FBTztBQUNoRixnQkFBUSxVQUFVLE9BQU8sYUFBYSxNQUFNO0FBQUEsTUFDOUM7QUFDQSxVQUFJLGNBQWMsYUFBYSxJQUFJLFVBQVUsR0FBRztBQUM5QyxjQUFNO0FBQUE7QUFBQSxVQUErQixLQUFLLE1BQU0sS0FBSyxDQUFDLFNBQVMsS0FBSyxPQUFPLFVBQVU7QUFBQTtBQUNyRixpQkFBUyxZQUFZLElBQUk7QUFBQSxNQUMzQjtBQUFBLElBQ0Y7QUFFQSxhQUFTLFlBQVk7QUFDbkIsVUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVO0FBQ3JCO0FBQUEsTUFDRjtBQUNBLFlBQU0sU0FBU0EsS0FBSSxzQkFBc0I7QUFDekMsWUFBTSxVQUFVO0FBQ2hCLFlBQU0sUUFBUSxLQUFLLElBQUksR0FBRyxJQUFJLE9BQU8sS0FBSztBQUMxQyxZQUFNLFNBQVMsS0FBSyxJQUFJLEdBQUcsSUFBSSxPQUFPLE1BQU07QUFDNUMsWUFBTSxpQkFBaUIsS0FBSyxJQUFJLEtBQUssT0FBTyxRQUFRLFVBQVUsQ0FBQztBQUMvRCxZQUFNLGtCQUFrQixLQUFLLElBQUksS0FBSyxPQUFPLFNBQVMsVUFBVSxDQUFDO0FBQ2pFLGNBQVEsS0FBSyxJQUFJLEtBQUssaUJBQWlCLE9BQU8sa0JBQWtCLE1BQU07QUFDdEUsY0FBUSxLQUFLLElBQUksTUFBTSxLQUFLO0FBQzVCLG9CQUFjLE9BQU8sUUFBUSxRQUFRLFNBQVM7QUFDOUMsb0JBQWMsT0FBTyxTQUFTLFNBQVMsU0FBUztBQUNoRCxxQkFBZTtBQUFBLElBQ2pCO0FBS0EsYUFBUyxPQUFPLFNBQVM7QUFDdkIsWUFBTTtBQUNOLFlBQU07QUFDTixVQUFJLENBQUMsVUFBVTtBQUNiO0FBQUEsTUFDRjtBQUVBLFlBQU0sT0FBTyxJQUFJLElBQUksSUFBSSxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDO0FBRTdELGlCQUFXLFFBQVEsSUFBSSxPQUFPO0FBQzVCLGNBQU0sU0FBUyxLQUFLLElBQUksS0FBSyxJQUFJO0FBQ2pDLGNBQU0sU0FBUyxLQUFLLElBQUksS0FBSyxFQUFFO0FBQy9CLFlBQUksQ0FBQyxVQUFVLENBQUMsUUFBUTtBQUN0QjtBQUFBLFFBQ0Y7QUFDQSxjQUFNO0FBQUE7QUFBQSxVQUNKLE1BQU0sUUFBUTtBQUFBLFlBQ1osT0FBTyxvQkFBb0IsS0FBSyxNQUFNLGtCQUFrQixLQUFLLFFBQVEsS0FBSyxJQUFJLEdBQzVFLEtBQUssVUFBVSxvQkFBb0IsRUFDckMsR0FBRyxLQUFLLFNBQVMsZUFBZSxFQUFFO0FBQUEsWUFDbEMsR0FBRyxTQUFTLFFBQVEsTUFBTTtBQUFBLFlBQzFCLGFBQWEsS0FBSztBQUFBLFlBQ2xCLFdBQVcsS0FBSztBQUFBLFlBQ2hCLEdBQUksS0FBSyxPQUFPLEVBQUUsb0JBQW9CLEtBQUssS0FBSyxJQUFJLENBQUM7QUFBQSxVQUN2RCxDQUFDO0FBQUE7QUFFSCxhQUFLLFFBQVEsT0FBTyxLQUFLO0FBQ3pCLGFBQUssUUFBUSxLQUFLLEtBQUs7QUFDdkIsY0FBTSxRQUFRLE1BQU0sT0FBTztBQUMzQixjQUFNLGNBQWMsR0FBRyxLQUFLLFFBQVEsS0FBSyxJQUFJLEtBQUssS0FBSyxNQUFNLElBQzNELEtBQUssYUFBYSxLQUFLLEtBQUssVUFBVSxLQUFLLEVBQzdDLEdBQUcsS0FBSyxZQUFZLElBQUksS0FBSyxTQUFTLEtBQUssRUFBRTtBQUM3QyxhQUFLLFlBQVksS0FBSztBQUN0QixpQkFBUyxZQUFZLElBQUk7QUFDekIscUJBQWEsSUFBSSxLQUFLLElBQUksSUFBSTtBQUU5QixZQUFJLEtBQUssU0FBUyxLQUFLLE1BQU0sU0FBUyxHQUFHO0FBQ3ZDLGdCQUFNLE9BQU8sVUFBVSxRQUFRLEtBQUs7QUFDcEMsZ0JBQU0sS0FBSyxVQUFVLFFBQVEsSUFBSTtBQUNqQyxnQkFBTSxRQUFRLE1BQU0sUUFBUTtBQUFBLFlBQzFCLE9BQU87QUFBQSxZQUNQLElBQUksS0FBSyxJQUFJLEdBQUcsS0FBSztBQUFBLFlBQ3JCLElBQUksS0FBSyxJQUFJLEdBQUcsS0FBSyxJQUFJO0FBQUEsWUFDekIsZUFBZTtBQUFBLFVBQ2pCLENBQUM7QUFDRCxnQkFBTSxjQUFjLFNBQVMsS0FBSyxPQUFPLEVBQUU7QUFDM0MsbUJBQVMsWUFBWSxLQUFLO0FBQUEsUUFDNUI7QUFBQSxNQUNGO0FBRUEsaUJBQVcsUUFBUSxJQUFJLE9BQU87QUFDNUIsY0FBTTtBQUFBO0FBQUEsVUFDSixNQUFNLEtBQUs7QUFBQSxZQUNULE9BQU8sb0JBQW9CLEtBQUssTUFBTSxrQkFBa0IsS0FBSyxJQUFJLEdBQy9ELEtBQUssV0FBVyx1QkFBdUIsRUFDekMsR0FBRyxLQUFLLGNBQWMsMEJBQTBCLEVBQUUsR0FDaEQsS0FBSyxXQUFXLHFCQUFxQixFQUN2QyxHQUFHLEtBQUssV0FBVyxxQkFBcUIsRUFBRSxHQUFHLEtBQUssU0FBUyxlQUFlLEVBQUU7QUFBQSxZQUM1RSxXQUFXLGFBQWEsS0FBSyxTQUFTLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQztBQUFBLFlBQzFELFVBQVU7QUFBQSxZQUNWLE1BQU07QUFBQSxZQUNOLGNBQWMsR0FBRyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssS0FBSyxLQUFLLE1BQU0sR0FDdEQsS0FBSyxjQUFjLGtCQUFrQixFQUN2QyxHQUFHLEtBQUssV0FBVyxzQkFBc0IsRUFBRTtBQUFBLFVBQzdDLENBQUM7QUFBQTtBQUdILGNBQU07QUFBQSxVQUNKLE1BQU0sUUFBUTtBQUFBLFlBQ1osT0FBTztBQUFBLFlBQ1AsT0FBTyxLQUFLLFNBQVM7QUFBQSxZQUNyQixRQUFRLEtBQUssU0FBUztBQUFBLFlBQ3RCLElBQUk7QUFBQSxZQUNKLElBQUk7QUFBQSxVQUNOLENBQUM7QUFBQSxRQUNIO0FBRUEsY0FBTSxRQUNKLE1BQU0sUUFBUSxLQUFLLFVBQVUsS0FBSyxLQUFLLFdBQVcsU0FBUyxJQUN2RCxLQUFLLFdBQVcsTUFBTSxHQUFHLENBQUMsSUFDMUIsQ0FBQyxTQUFTLEtBQUssT0FBTyxFQUFFLENBQUM7QUFDL0IsY0FBTSxhQUFhO0FBQ25CLGNBQU0sY0FBYyxNQUFNLFNBQVM7QUFDbkMsY0FBTSxRQUFRLE1BQU0sUUFBUTtBQUFBLFVBQzFCLE9BQU87QUFBQSxVQUNQLEdBQUc7QUFBQSxVQUNILEdBQUcsS0FBSyxTQUFTLFNBQVMsSUFBSSxjQUFjLElBQUksYUFBYTtBQUFBLFFBQy9ELENBQUM7QUFDRCxtQkFBVyxDQUFDLE9BQU8sSUFBSSxLQUFLLE1BQU0sUUFBUSxHQUFHO0FBQzNDLGdCQUFNLE9BQU8sTUFBTSxTQUFTO0FBQUEsWUFDMUIsR0FBRztBQUFBLFlBQ0gsR0FBSSxVQUFVLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxXQUFXO0FBQUEsVUFDMUMsQ0FBQztBQUNELGVBQUssY0FBYztBQUNuQixnQkFBTSxZQUFZLElBQUk7QUFBQSxRQUN4QjtBQUNBLGNBQU0sWUFBWSxLQUFLO0FBRXZCLGNBQU0sT0FBTyxNQUFNLFFBQVE7QUFBQSxVQUN6QixPQUFPO0FBQUEsVUFDUCxHQUFHO0FBQUEsVUFDSCxHQUFHLEtBQUssU0FBUyxTQUFTO0FBQUEsUUFDNUIsQ0FBQztBQUNELGFBQUssY0FBYyxLQUFLLFdBQVcsR0FBRyxLQUFLLElBQUksbUJBQWdCLEtBQUs7QUFDcEUsY0FBTSxZQUFZLElBQUk7QUFFdEIsY0FBTSxZQUNKLE1BQU0sUUFBUSxLQUFLLE1BQU0sS0FBSyxLQUFLLE9BQU8sU0FBUyxJQUMvQyxLQUFLLE9BQU8sS0FBSyxRQUFLLElBQ3RCLEtBQUssVUFBVSxLQUFLLFdBQVcsYUFBYSxLQUFLLFNBQVM7QUFDaEUsWUFBSSxXQUFXO0FBQ2IsZ0JBQU0sUUFBUSxNQUFNLFFBQVE7QUFBQSxZQUMxQixPQUFPO0FBQUEsWUFDUCxHQUFHLEtBQUssU0FBUyxRQUFRO0FBQUEsWUFDekIsR0FBRztBQUFBLFlBQ0gsZUFBZTtBQUFBLFVBQ2pCLENBQUM7QUFDRCxnQkFBTSxjQUFjLFNBQVMsV0FBVyxFQUFFO0FBQzFDLGdCQUFNLFlBQVksS0FBSztBQUFBLFFBQ3pCO0FBRUEsY0FBTSxRQUFRLE1BQU0sT0FBTztBQUMzQixjQUFNLFdBQ0osTUFBTSxRQUFRLEtBQUssS0FBSyxLQUFLLEtBQUssTUFBTSxTQUFTLElBQzdDO0FBQUEsU0FBWSxLQUFLLE1BQU0sSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLEtBQUssS0FBSyxLQUFLLE1BQU0sR0FBRyxFQUFFLEtBQUssSUFBSSxDQUFDLEtBQ2pGO0FBQ04sY0FBTSxjQUFjLEdBQUcsS0FBSyxJQUFJLElBQUksS0FBSyxLQUFLO0FBQUEsVUFBYSxLQUFLLE1BQU0sR0FDcEUsS0FBSyxRQUFRO0FBQUEsUUFBVyxLQUFLLE1BQU0sWUFBWSxDQUFDLElBQUksS0FBSyxNQUFNLFVBQVUsQ0FBQyxLQUFLLEVBQ2pGLEdBQUcsS0FBSyxhQUFhO0FBQUEsVUFBYSxLQUFLLFVBQVUsS0FBSyxFQUFFLEdBQUcsUUFBUTtBQUNuRSxjQUFNLFlBQVksS0FBSztBQUV2QixjQUFNLGlCQUFpQixTQUFTLENBQUMsVUFBVTtBQUN6QyxnQkFBTSxnQkFBZ0I7QUFDdEIsaUJBQU8sS0FBSyxFQUFFO0FBQUEsUUFDaEIsQ0FBQztBQUNELGNBQU0saUJBQWlCLFlBQVksQ0FBQyxVQUFVO0FBQzVDLGdCQUFNLGdCQUFnQjtBQUN0QixpQkFBTyxLQUFLLEVBQUU7QUFDZCxrQkFBUSxhQUFhLEtBQUssSUFBSSxNQUFNLFNBQVM7QUFBQSxRQUMvQyxDQUFDO0FBQ0QsY0FBTSxpQkFBaUIsZ0JBQWdCLENBQUMsVUFBVTtBQUNoRCxrQkFBUSxpQkFBaUIsS0FBSyxJQUFJLE1BQU0sRUFBRSxHQUFHLE1BQU0sU0FBUyxHQUFHLE1BQU0sUUFBUSxDQUFDO0FBQUEsUUFDaEYsQ0FBQztBQUNELGNBQU0saUJBQWlCLGVBQWUsQ0FBQyxVQUFVO0FBQy9DLGtCQUFRLGdCQUFnQixFQUFFLEdBQUcsTUFBTSxTQUFTLEdBQUcsTUFBTSxRQUFRLENBQUM7QUFBQSxRQUNoRSxDQUFDO0FBQ0QsY0FBTSxpQkFBaUIsZ0JBQWdCLE1BQU07QUFDM0Msa0JBQVEsaUJBQWlCLEtBQUssRUFBRTtBQUFBLFFBQ2xDLENBQUM7QUFDRCxjQUFNLGlCQUFpQixXQUFXLENBQUMsVUFBVTtBQUMzQyxjQUFJLE1BQU0sUUFBUSxTQUFTO0FBQ3pCLGtCQUFNLGVBQWU7QUFDckIsbUJBQU8sS0FBSyxFQUFFO0FBQ2Qsb0JBQVEsYUFBYSxLQUFLLElBQUksTUFBTSxVQUFVO0FBQzlDO0FBQUEsVUFDRjtBQUNBLGNBQUksTUFBTSxRQUFRLE9BQU8sTUFBTSxRQUFRLFlBQVk7QUFDakQsa0JBQU0sZUFBZTtBQUNyQixnQkFBSSxNQUFNLFVBQVU7QUFDbEIsc0JBQVEsZUFBZSxLQUFLLElBQUksSUFBSTtBQUFBLFlBQ3RDLE9BQU87QUFDTCxxQkFBTyxLQUFLLEVBQUU7QUFBQSxZQUNoQjtBQUNBO0FBQUEsVUFDRjtBQUNBLGNBQUksTUFBTSxRQUFRLE9BQU8sTUFBTSxRQUFRLEtBQUs7QUFDMUMsa0JBQU0sZUFBZTtBQUNyQixvQkFBUSxlQUFlLEtBQUssSUFBSSxJQUFJO0FBQUEsVUFDdEM7QUFBQSxRQUNGLENBQUM7QUFFRCxpQkFBUyxZQUFZLEtBQUs7QUFDMUIscUJBQWEsSUFBSSxLQUFLLElBQUksS0FBSztBQUFBLE1BQ2pDO0FBRUEsZ0JBQVU7QUFBQSxJQUNaO0FBRUEsYUFBUyxjQUFjLFdBQVc7QUFDaEMsVUFBSSxDQUFDLE9BQU8sSUFBSSxNQUFNLFdBQVcsR0FBRztBQUNsQztBQUFBLE1BQ0Y7QUFDQSxZQUFNLFVBQVUsYUFBYSxJQUFJLE1BQU0sS0FBSyxDQUFDLFNBQVMsS0FBSyxPQUFPLFVBQVUsSUFBSTtBQUNoRixVQUFJLENBQUMsU0FBUztBQUNaLGNBQU0sUUFBUSxJQUFJLE1BQU0sQ0FBQztBQUN6QixlQUFPLE1BQU0sRUFBRTtBQUNmLHFCQUFhLElBQUksTUFBTSxFQUFFLEdBQUcsTUFBTTtBQUNsQztBQUFBLE1BQ0Y7QUFDQSxZQUFNLFNBQVM7QUFBQSxRQUNiLEdBQUcsUUFBUSxTQUFTLElBQUksUUFBUSxTQUFTLFFBQVE7QUFBQSxRQUNqRCxHQUFHLFFBQVEsU0FBUyxJQUFJLFFBQVEsU0FBUyxTQUFTO0FBQUEsTUFDcEQ7QUFFQSxVQUFJLE9BQU87QUFDWCxVQUFJLFlBQVksT0FBTztBQUN2QixpQkFBVyxhQUFhLElBQUksT0FBTztBQUNqQyxZQUFJLFVBQVUsT0FBTyxRQUFRLElBQUk7QUFDL0I7QUFBQSxRQUNGO0FBQ0EsY0FBTSxRQUFRO0FBQUEsVUFDWixHQUFHLFVBQVUsU0FBUyxJQUFJLFVBQVUsU0FBUyxRQUFRO0FBQUEsVUFDckQsR0FBRyxVQUFVLFNBQVMsSUFBSSxVQUFVLFNBQVMsU0FBUztBQUFBLFFBQ3hEO0FBQ0EsY0FBTSxLQUFLLE1BQU0sSUFBSSxPQUFPO0FBQzVCLGNBQU0sS0FBSyxNQUFNLElBQUksT0FBTztBQUM1QixjQUFNLFVBQ0gsY0FBYyxnQkFBZ0IsS0FBSyxLQUNuQyxjQUFjLGVBQWUsS0FBSyxNQUNsQyxjQUFjLGVBQWUsS0FBSyxLQUNsQyxjQUFjLGFBQWEsS0FBSztBQUNuQyxZQUFJLENBQUMsU0FBUztBQUNaO0FBQUEsUUFDRjtBQUNBLGNBQU0sVUFDSixjQUFjLGdCQUFnQixjQUFjLGNBQWMsS0FBSyxJQUFJLEVBQUUsSUFBSSxLQUFLLElBQUksRUFBRTtBQUN0RixjQUFNLFlBQ0osY0FBYyxnQkFBZ0IsY0FBYyxjQUFjLEtBQUssSUFBSSxFQUFFLElBQUksS0FBSyxJQUFJLEVBQUU7QUFDdEYsY0FBTSxRQUFRLFVBQVUsWUFBWTtBQUNwQyxZQUFJLFFBQVEsV0FBVztBQUNyQixzQkFBWTtBQUNaLGlCQUFPO0FBQUEsUUFDVDtBQUFBLE1BQ0Y7QUFDQSxVQUFJLE1BQU07QUFDUixlQUFPLEtBQUssRUFBRTtBQUNkLHFCQUFhLElBQUksS0FBSyxFQUFFLEdBQUcsTUFBTTtBQUFBLE1BQ25DO0FBQUEsSUFDRjtBQUVBLElBQUFBLEtBQUk7QUFBQSxNQUNGO0FBQUEsTUFDQSxDQUFDLFVBQVU7QUFDVCxZQUFJLENBQUMsS0FBSztBQUNSO0FBQUEsUUFDRjtBQUNBLGNBQU0sZUFBZTtBQUNyQixjQUFNLFNBQVNBLEtBQUksc0JBQXNCO0FBQ3pDLGNBQU0sV0FBVyxNQUFNLFVBQVUsT0FBTztBQUN4QyxjQUFNLFdBQVcsTUFBTSxVQUFVLE9BQU87QUFDeEMsY0FBTSxTQUFTLE1BQU0sU0FBUyxJQUFJLE9BQU8sSUFBSTtBQUM3QyxjQUFNLFlBQVksS0FBSyxJQUFJLEtBQUssS0FBSyxJQUFJLE1BQU0sUUFBUSxNQUFNLENBQUM7QUFDOUQsY0FBTSxRQUFRLFlBQVk7QUFDMUIscUJBQWEsWUFBWSxXQUFXLGNBQWM7QUFDbEQscUJBQWEsWUFBWSxXQUFXLGNBQWM7QUFDbEQsZ0JBQVE7QUFDUix1QkFBZTtBQUFBLE1BQ2pCO0FBQUEsTUFDQSxFQUFFLFNBQVMsTUFBTTtBQUFBLElBQ25CO0FBRUEsSUFBQUEsS0FBSSxpQkFBaUIsZUFBZSxDQUFDLFVBQVU7QUFDN0MsVUFBSSxNQUFNLFdBQVcsR0FBRztBQUN0QjtBQUFBLE1BQ0Y7QUFDQSxpQkFBVztBQUNYLGtCQUFZLEVBQUUsR0FBRyxNQUFNLFNBQVMsR0FBRyxNQUFNLFNBQVMsSUFBSSxZQUFZLElBQUksV0FBVztBQUNqRixNQUFBQSxLQUFJLGtCQUFrQixNQUFNLFNBQVM7QUFBQSxJQUN2QyxDQUFDO0FBQ0QsSUFBQUEsS0FBSSxpQkFBaUIsZUFBZSxDQUFDLFVBQVU7QUFDN0MsVUFBSSxDQUFDLFVBQVU7QUFDYjtBQUFBLE1BQ0Y7QUFDQSxtQkFBYSxVQUFVLE1BQU0sTUFBTSxVQUFVLFVBQVU7QUFDdkQsbUJBQWEsVUFBVSxNQUFNLE1BQU0sVUFBVSxVQUFVO0FBQ3ZELHFCQUFlO0FBQUEsSUFDakIsQ0FBQztBQUNELFVBQU0sVUFBVSxDQUFDLFVBQVU7QUFDekIsaUJBQVc7QUFDWCxVQUFJQSxLQUFJLGtCQUFrQixNQUFNLFNBQVMsR0FBRztBQUMxQyxRQUFBQSxLQUFJLHNCQUFzQixNQUFNLFNBQVM7QUFBQSxNQUMzQztBQUFBLElBQ0Y7QUFDQSxJQUFBQSxLQUFJLGlCQUFpQixhQUFhLE9BQU87QUFDekMsSUFBQUEsS0FBSSxpQkFBaUIsaUJBQWlCLE9BQU87QUFFN0MsSUFBQUEsS0FBSSxpQkFBaUIsU0FBUyxNQUFNO0FBQ2xDLFVBQUksWUFBWTtBQUNkLGVBQU8sSUFBSTtBQUFBLE1BQ2I7QUFBQSxJQUNGLENBQUM7QUFFRCxJQUFBQSxLQUFJLGlCQUFpQixXQUFXLENBQUMsVUFBVTtBQUN6QyxVQUFJLE1BQU0sSUFBSSxXQUFXLE9BQU8sR0FBRztBQUNqQyxjQUFNLGVBQWU7QUFDckIsc0JBQWMsTUFBTSxHQUFHO0FBQ3ZCO0FBQUEsTUFDRjtBQUNBLFVBQUksTUFBTSxRQUFRLE9BQU8sTUFBTSxRQUFRLEtBQUs7QUFDMUMsY0FBTSxlQUFlO0FBQ3JCLGdCQUFRLEtBQUssSUFBSSxLQUFLLFFBQVEsSUFBSTtBQUNsQyx1QkFBZTtBQUNmO0FBQUEsTUFDRjtBQUNBLFVBQUksTUFBTSxRQUFRLEtBQUs7QUFDckIsY0FBTSxlQUFlO0FBQ3JCLGdCQUFRLEtBQUssSUFBSSxNQUFNLFFBQVEsSUFBSTtBQUNuQyx1QkFBZTtBQUNmO0FBQUEsTUFDRjtBQUNBLFVBQUksTUFBTSxRQUFRLEtBQUs7QUFDckIsY0FBTSxlQUFlO0FBQ3JCLGtCQUFVO0FBQUEsTUFDWjtBQUFBLElBQ0YsQ0FBQztBQVFELGFBQVMsVUFBVSxTQUFTO0FBQzFCLFlBQU0sU0FBUyxJQUFJLElBQUksTUFBTSxRQUFRLE9BQU8sSUFBSSxVQUFVLENBQUMsQ0FBQztBQUM1RCxpQkFBVyxDQUFDLElBQUksT0FBTyxLQUFLLGNBQWM7QUFDeEMsZ0JBQVEsVUFBVSxPQUFPLGFBQWEsT0FBTyxJQUFJLEVBQUUsQ0FBQztBQUFBLE1BQ3REO0FBQ0EsaUJBQVcsQ0FBQyxFQUFFLE9BQU8sS0FBSyxjQUFjO0FBQ3RDLGNBQU0sU0FDSixPQUFPLE9BQU8sTUFDYixPQUFPLElBQUksUUFBUSxRQUFRLFFBQVEsRUFBRSxLQUFLLE9BQU8sSUFBSSxRQUFRLFFBQVEsTUFBTSxFQUFFO0FBQ2hGLGdCQUFRLFVBQVUsT0FBTyxhQUFhLE1BQU07QUFBQSxNQUM5QztBQUFBLElBQ0Y7QUFLQSxhQUFTLFVBQVUsU0FBUztBQUMxQixZQUFNLFNBQVMsSUFBSSxJQUFJLE1BQU0sUUFBUSxPQUFPLElBQUksVUFBVSxDQUFDLENBQUM7QUFDNUQsaUJBQVcsQ0FBQyxJQUFJLE9BQU8sS0FBSyxjQUFjO0FBQ3hDLGdCQUFRLFVBQVUsT0FBTyxZQUFZLE9BQU8sSUFBSSxFQUFFLENBQUM7QUFBQSxNQUNyRDtBQUFBLElBQ0Y7QUFFQSxhQUFTLGlCQUFpQjtBQUN4QixVQUFJLFlBQVk7QUFDZCxxQkFBYSxJQUFJLFVBQVUsR0FBRyxNQUFNO0FBQ3BDLGVBQU87QUFBQSxNQUNUO0FBQ0EsYUFBTztBQUFBLElBQ1Q7QUFFQSxXQUFPO0FBQUEsTUFDTDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQSxVQUFVO0FBQ1IsY0FBTTtBQUNOLGNBQU07QUFBQSxNQUNSO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7OztBQ2hmTyxNQUFNLGdCQUFnQixPQUFPLE9BQU87QUFBQSxJQUN6QyxVQUFVO0FBQUEsSUFDVixVQUFVO0FBQUEsSUFDVixlQUFlO0FBQUEsSUFDZixVQUFVO0FBQUEsSUFDVixXQUFXO0FBQUEsRUFDYixDQUFDO0FBdUVNLFdBQVMsV0FBVyxNQUFNO0FBQy9CLFVBQU0sU0FBUyxDQUFDLENBQUM7QUFDakIsYUFBUyxRQUFRLEdBQUcsUUFBUSxLQUFLLFFBQVEsU0FBUyxHQUFHO0FBQ25ELFlBQU0sT0FBTyxLQUFLLFdBQVcsS0FBSztBQUNsQyxVQUFJLFNBQVMsSUFBSTtBQUNmLGVBQU8sS0FBSyxRQUFRLENBQUM7QUFBQSxNQUN2QixXQUFXLFNBQVMsSUFBSTtBQUN0QixZQUFJLEtBQUssV0FBVyxRQUFRLENBQUMsTUFBTSxJQUFJO0FBQ3JDLG1CQUFTO0FBQUEsUUFDWDtBQUNBLGVBQU8sS0FBSyxRQUFRLENBQUM7QUFBQSxNQUN2QjtBQUFBLElBQ0Y7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQW1HTyxXQUFTLGVBQWUsTUFBTSxVQUFVO0FBQzdDLFVBQU0sUUFBUSxLQUFLO0FBQUEsTUFDakIsY0FBYztBQUFBLE1BQ2QsS0FBSyxJQUFJLGNBQWMsVUFBVSxPQUFPLFVBQVUsUUFBUSxJQUFJLFdBQVcsY0FBYyxRQUFRO0FBQUEsSUFDakc7QUFDQSxVQUFNLFNBQVMsV0FBVyxJQUFJO0FBQzlCLFVBQU0sWUFBWSxPQUFPO0FBQ3pCLFFBQUksYUFBYSxPQUFPO0FBQ3RCLGFBQU8sRUFBRSxNQUFNLFdBQVcsT0FBTyxVQUFVO0FBQUEsSUFDN0M7QUFHQSxRQUFJLFVBQVUsS0FBSyxNQUFNLEdBQUcsT0FBTyxLQUFLLENBQUM7QUFDekMsUUFBSSxRQUFRLFNBQVMsTUFBTSxHQUFHO0FBQzVCLGdCQUFVLFFBQVEsTUFBTSxHQUFHLEVBQUU7QUFBQSxJQUMvQixXQUFXLFFBQVEsU0FBUyxJQUFJLEtBQUssUUFBUSxTQUFTLElBQUksR0FBRztBQUMzRCxnQkFBVSxRQUFRLE1BQU0sR0FBRyxFQUFFO0FBQUEsSUFDL0I7QUFDQSxXQUFPO0FBQUEsTUFDTCxNQUFNO0FBQUEsTUFDTixXQUFXO0FBQUEsTUFDWCxXQUFXO0FBQUEsSUFDYjtBQUFBLEVBQ0Y7OztBQzdLTyxXQUFTLGtCQUFrQixFQUFFLE1BQU0sUUFBUSxNQUFNLFdBQVcsY0FBYyxTQUFTLEdBQUc7QUFDM0YsVUFBTSxRQUFRLE1BQU0sU0FBUztBQUM3QixVQUFNLFFBQVEsT0FBTyxNQUFNLFNBQVMsUUFBUTtBQUM1QyxVQUFNLFlBQVksUUFDZCxHQUFHLE9BQU8sTUFBTSxTQUFTLElBQUksQ0FBQyxTQUFJLE9BQU8sTUFBTSxPQUFPLElBQUksQ0FBQyxLQUMzRDtBQUNKLFVBQU0sWUFBWSxNQUFNLGdCQUFnQixRQUFRLENBQUM7QUFFakQsUUFBSSxXQUFXO0FBQ2IsYUFBTztBQUFBLFFBQ0w7QUFBQSxRQUNBLE1BQU0sT0FBTyxNQUFNLFFBQVEsTUFBTTtBQUFBLFFBQ2pDLE1BQU0sT0FBTyxVQUFVO0FBQUEsUUFDdkI7QUFBQSxRQUNBLE1BQU07QUFBQSxRQUNOLFdBQVc7QUFBQSxRQUNYLFdBQVc7QUFBQSxRQUNYLE9BQU87QUFBQSxRQUNQLE9BQU87QUFBQSxRQUNQLFNBQVMsUUFDTCxhQUFhLE1BQU0sUUFBUSxNQUFNLHdFQUFtRSxPQUFPLE1BQU0sU0FBUyxJQUFJLENBQUMsTUFDL0gsYUFBYSxNQUFNLFFBQVEsTUFBTTtBQUFBLFFBQ3JDLFdBQVc7QUFBQSxRQUNYLGlCQUFpQjtBQUFBLE1BQ25CO0FBQUEsSUFDRjtBQUVBLFFBQUksQ0FBQyxPQUFPO0FBQ1YsYUFBTztBQUFBLFFBQ0w7QUFBQSxRQUNBLE1BQU0sT0FBTyxNQUFNLFFBQVEsTUFBTTtBQUFBLFFBQ2pDLE1BQU0sT0FBTyxVQUFVO0FBQUEsUUFDdkI7QUFBQSxRQUNBLE1BQU07QUFBQSxRQUNOLFdBQVc7QUFBQSxRQUNYLFdBQVc7QUFBQSxRQUNYLE9BQU87QUFBQSxRQUNQLE9BQU87QUFBQSxRQUNQLFNBQVM7QUFBQSxRQUNULFdBQVc7QUFBQSxRQUNYLGlCQUFpQjtBQUFBLE1BQ25CO0FBQUEsSUFDRjtBQUVBLFVBQU0sVUFBVSxlQUFlLE9BQU8sTUFBTSxRQUFRLEVBQUUsR0FBRyxRQUFRO0FBQ2pFLFVBQU0sWUFBWSxNQUFNLGFBQWE7QUFDckMsVUFBTSxRQUFRLGNBQWM7QUFDNUIsVUFBTUMsU0FBUSxRQUFRLEtBQUssS0FBSyxFQUFFLFdBQVc7QUFDN0MsUUFBSSxVQUFVO0FBQ2QsUUFBSSxPQUFPO0FBQ1QsZ0JBQ0U7QUFBQSxJQUNKLFdBQVcsY0FBYyxXQUFXO0FBQ2xDLGdCQUFVLE1BQU0sVUFBVTtBQUFBLElBQzVCLFdBQVdBLFFBQU87QUFDaEIsZ0JBQVU7QUFBQSxJQUNaO0FBRUEsV0FBTztBQUFBLE1BQ0w7QUFBQSxNQUNBLE1BQU0sT0FBTyxNQUFNLFFBQVEsTUFBTTtBQUFBLE1BQ2pDLE1BQU0sT0FBTyxNQUFNLGdCQUFnQixPQUFPLFVBQVUsRUFBRTtBQUFBLE1BQ3REO0FBQUEsTUFDQSxNQUFNLFFBQVE7QUFBQSxNQUNkLFdBQVcsUUFBUSxRQUFRLGFBQWEsTUFBTSxTQUFTO0FBQUEsTUFDdkQsV0FBVztBQUFBLE1BQ1g7QUFBQSxNQUNBLE9BQUFBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBLGlCQUFpQixPQUFPLFVBQVUsTUFBTSxlQUFlLElBQUksTUFBTSxrQkFBa0I7QUFBQSxJQUNyRjtBQUFBLEVBQ0Y7OztBQ2pITyxNQUFNLG1CQUFtQixPQUFPLE9BQU87QUFBQSxJQUM1QyxTQUFTO0FBQUEsSUFDVCxTQUFTO0FBQUEsSUFDVCxVQUFVO0FBQUEsSUFDVixvQkFBb0I7QUFBQSxJQUNwQixpQkFBaUI7QUFBQSxJQUNqQixjQUFjO0FBQUEsSUFDZCxrQkFBa0I7QUFBQSxFQUNwQixDQUFDO0FBU0QsV0FBUyxhQUFhLE9BQU8sVUFBVSxLQUFLLEtBQUs7QUFDL0MsVUFBTSxZQUFZLE9BQU8sS0FBSztBQUM5QixRQUFJLENBQUMsT0FBTyxTQUFTLFNBQVMsR0FBRztBQUMvQixhQUFPO0FBQUEsSUFDVDtBQUNBLFdBQU8sS0FBSyxJQUFJLEtBQUssS0FBSyxJQUFJLEtBQUssS0FBSyxNQUFNLFNBQVMsQ0FBQyxDQUFDO0FBQUEsRUFDM0Q7QUFPQSxXQUFTLFVBQVUsT0FBTyxVQUFVO0FBQ2xDLFdBQU8sT0FBTyxVQUFVLFlBQVksUUFBUTtBQUFBLEVBQzlDO0FBU08sV0FBUyx1QkFBdUIsTUFBTSxDQUFDLEdBQUc7QUFDL0MsVUFBTSxTQUFTLE9BQU8sT0FBTyxRQUFRLFdBQVcsTUFBTSxDQUFDO0FBQ3ZELFdBQU87QUFBQSxNQUNMLFNBQVMsVUFBVSxPQUFPLFNBQVMsaUJBQWlCLE9BQU87QUFBQSxNQUMzRCxTQUFTLGFBQWEsT0FBTyxTQUFTLGlCQUFpQixTQUFTLEdBQUcsR0FBSztBQUFBLE1BQ3hFLFVBQVUsYUFBYSxPQUFPLFVBQVUsaUJBQWlCLFVBQVUsR0FBRyxFQUFFO0FBQUEsTUFDeEUsb0JBQW9CLFVBQVUsT0FBTyxvQkFBb0IsaUJBQWlCLGtCQUFrQjtBQUFBLE1BQzVGLGlCQUFpQixVQUFVLE9BQU8saUJBQWlCLGlCQUFpQixlQUFlO0FBQUEsTUFDbkYsY0FBYyxVQUFVLE9BQU8sY0FBYyxpQkFBaUIsWUFBWTtBQUFBLE1BQzFFLGtCQUFrQixVQUFVLE9BQU8sa0JBQWtCLGlCQUFpQixnQkFBZ0I7QUFBQSxJQUN4RjtBQUFBLEVBQ0Y7OztBQ3JETyxNQUFNLHVCQUF1QixPQUFPLE9BQU87QUFBQSxJQUNoRCxjQUFjO0FBQUEsSUFDZCxjQUFjO0FBQUEsSUFDZCxvQkFBb0I7QUFBQSxFQUN0QixDQUFDO0FBTU0sV0FBUyxzQkFBc0IsT0FBTztBQUMzQyxVQUFNLE1BQU0sT0FBTyxLQUFLO0FBQ3hCLFFBQUksQ0FBQyxPQUFPLFNBQVMsR0FBRyxHQUFHO0FBQ3pCLGFBQU8scUJBQXFCO0FBQUEsSUFDOUI7QUFDQSxVQUFNLFVBQVUsS0FBSyxJQUFJLEdBQUcsS0FBSyxJQUFJLEdBQUcsS0FBSyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ3hEO0FBQUE7QUFBQSxNQUErQjtBQUFBO0FBQUEsRUFDakM7QUFPQSxXQUFTQyxXQUFVLE9BQU8sVUFBVTtBQUNsQyxXQUFPLE9BQU8sVUFBVSxZQUFZLFFBQVE7QUFBQSxFQUM5QztBQVNPLFdBQVMsMkJBQTJCLE1BQU0sQ0FBQyxHQUFHO0FBQ25ELFVBQU0sU0FBUyxPQUFPLE9BQU8sUUFBUSxXQUFXLE1BQU0sQ0FBQztBQUN2RCxXQUFPO0FBQUEsTUFDTCxjQUFjLHNCQUFzQixPQUFPLFlBQVk7QUFBQSxNQUN2RCxjQUFjQSxXQUFVLE9BQU8sY0FBYyxxQkFBcUIsWUFBWTtBQUFBLE1BQzlFLG9CQUFvQkE7QUFBQSxRQUNsQixPQUFPO0FBQUEsUUFDUCxxQkFBcUI7QUFBQSxNQUN2QjtBQUFBLElBQ0Y7QUFBQSxFQUNGOzs7QUM1Qk8sV0FBUyx3QkFBd0IsVUFBVSxDQUFDLEdBQUc7QUFDcEQsVUFBTSxXQUFXLFFBQVEsZUFBZSxDQUFDLFNBQVMsT0FBTyxXQUFXLFNBQVMsRUFBRTtBQUMvRSxVQUFNLFNBQVMsUUFBUSxpQkFBaUIsQ0FBQyxXQUFXLGFBQWEsTUFBTTtBQUV2RSxRQUFJLFVBQVUsS0FBSyxJQUFJLEdBQUcsT0FBTyxRQUFRLFdBQVcsR0FBRyxDQUFDO0FBQ3hELFFBQUksZ0JBQWdCLEtBQUssSUFBSSxHQUFHLE9BQU8sUUFBUSxpQkFBaUIsRUFBRSxDQUFDO0FBQ25FLFVBQU0sVUFBVSxLQUFLLElBQUksR0FBRyxPQUFPLFFBQVEsV0FBVyxHQUFHLENBQUM7QUFDMUQsUUFBSSxVQUFVLFFBQVEsWUFBWTtBQUNsQyxRQUFJLGVBQWUsUUFBUSxRQUFRLFlBQVk7QUFFL0MsUUFBSSxZQUFZO0FBQ2hCLFFBQUksU0FBUyxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUU7QUFDMUIsUUFBSSxhQUFhO0FBQ2pCLFFBQUksYUFBYTtBQUNqQixRQUFJLGdCQUFnQjtBQUNwQixRQUFJLFNBQVM7QUFDYixRQUFJLFVBQVU7QUFFZCxhQUFTLGFBQWE7QUFDcEIsVUFBSSxlQUFlLE1BQU07QUFDdkIsZUFBTyxVQUFVO0FBQ2pCLHFCQUFhO0FBQUEsTUFDZjtBQUFBLElBQ0Y7QUFFQSxhQUFTLGFBQWE7QUFDcEIsVUFBSSxlQUFlLE1BQU07QUFDdkIsZUFBTyxVQUFVO0FBQ2pCLHFCQUFhO0FBQUEsTUFDZjtBQUFBLElBQ0Y7QUFFQSxhQUFTLE9BQU87QUFDZCxVQUFJLENBQUMsV0FBVyxjQUFjLE1BQU07QUFDbEM7QUFBQSxNQUNGO0FBQ0EsZ0JBQVU7QUFDVixVQUFJLGNBQWM7QUFDaEIsaUJBQVM7QUFBQSxNQUNYO0FBQ0EsY0FBUSxTQUFTLFdBQVcsRUFBRSxHQUFHLE9BQU8sQ0FBQztBQUFBLElBQzNDO0FBRUEsYUFBUyxPQUFPO0FBQ2QsaUJBQVc7QUFDWCxpQkFBVztBQUNYLFVBQUksQ0FBQyxXQUFXLGNBQWMsTUFBTTtBQUNsQztBQUFBLE1BQ0Y7QUFDQSxZQUFNLFdBQVc7QUFDakIsZ0JBQVU7QUFDVixrQkFBWTtBQUNaLGVBQVM7QUFDVCxjQUFRLFNBQVMsUUFBUTtBQUFBLElBQzNCO0FBRUEsYUFBUyxXQUFXO0FBQ2xCLGlCQUFXO0FBQ1gsVUFBSSxDQUFDLFdBQVcsY0FBYyxNQUFNO0FBQ2xDO0FBQUEsTUFDRjtBQUNBLG1CQUFhLFNBQVMsTUFBTTtBQUMxQixxQkFBYTtBQUNiLGFBQUs7QUFBQSxNQUNQLEdBQUcsT0FBTztBQUFBLElBQ1o7QUFFQSxhQUFTLFdBQVc7QUFDbEIsVUFBSSxRQUFRO0FBQ1Y7QUFBQSxNQUNGO0FBQ0EsaUJBQVc7QUFDWCxtQkFBYSxTQUFTLE1BQU07QUFDMUIscUJBQWE7QUFDYixhQUFLO0FBQUEsTUFDUCxHQUFHLE9BQU87QUFBQSxJQUNaO0FBRUEsV0FBTztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFLTCxhQUFhLFFBQVEsT0FBTztBQUMxQixZQUFJLE9BQU8sV0FBVyxZQUFZLE9BQU8sV0FBVyxHQUFHO0FBQ3JEO0FBQUEsUUFDRjtBQUNBLHdCQUFnQjtBQUNoQixtQkFBVztBQUNYLFlBQUksV0FBVyxjQUFjLFFBQVE7QUFDbkM7QUFBQSxRQUNGO0FBQ0EsWUFBSSxTQUFTO0FBQ1gsa0JBQVEsU0FBUyxTQUFTO0FBQzFCLG9CQUFVO0FBQUEsUUFDWjtBQUNBLG9CQUFZO0FBQ1osaUJBQVMsRUFBRSxHQUFHLE9BQU8sT0FBTyxLQUFLLENBQUMsR0FBRyxHQUFHLE9BQU8sT0FBTyxLQUFLLENBQUMsRUFBRTtBQUM5RCxpQkFBUztBQUNULGlCQUFTO0FBQUEsTUFDWDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQU9BLFlBQVksT0FBTztBQUNqQixZQUFJLGNBQWMsUUFBUSxTQUFTO0FBQ2pDO0FBQUEsUUFDRjtBQUNBLGNBQU0sSUFBSSxPQUFPLE9BQU8sS0FBSyxDQUFDO0FBQzlCLGNBQU0sSUFBSSxPQUFPLE9BQU8sS0FBSyxDQUFDO0FBQzlCLGNBQU0sS0FBSyxJQUFJLE9BQU87QUFDdEIsY0FBTSxLQUFLLElBQUksT0FBTztBQUN0QixZQUFJLEtBQUssTUFBTSxJQUFJLEVBQUUsSUFBSSxlQUFlO0FBQ3RDLG1CQUFTLEVBQUUsR0FBRyxFQUFFO0FBQ2hCLG1CQUFTO0FBQUEsUUFDWDtBQUFBLE1BQ0Y7QUFBQTtBQUFBLE1BR0EsZUFBZTtBQUNiLHdCQUFnQjtBQUNoQixtQkFBVztBQUNYLFlBQUksQ0FBQyxTQUFTO0FBQ1osc0JBQVk7QUFDWjtBQUFBLFFBQ0Y7QUFDQSxpQkFBUztBQUFBLE1BQ1g7QUFBQTtBQUFBLE1BR0EsbUJBQW1CO0FBQ2pCLHdCQUFnQjtBQUNoQixtQkFBVztBQUFBLE1BQ2I7QUFBQSxNQUVBLG1CQUFtQjtBQUNqQix3QkFBZ0I7QUFDaEIsWUFBSSxTQUFTO0FBQ1gsbUJBQVM7QUFBQSxRQUNYO0FBQUEsTUFDRjtBQUFBLE1BRUEsWUFBWTtBQUNWLGlCQUFTLENBQUM7QUFDVixZQUFJLFFBQVE7QUFDVixxQkFBVztBQUFBLFFBQ2IsV0FBVyxDQUFDLGVBQWU7QUFDekIsbUJBQVM7QUFBQSxRQUNYO0FBQ0EsZUFBTztBQUFBLE1BQ1Q7QUFBQTtBQUFBLE1BR0EsVUFBVSxPQUFPO0FBQ2YsaUJBQVMsUUFBUSxLQUFLO0FBQ3RCLFlBQUksUUFBUTtBQUNWLHFCQUFXO0FBQUEsUUFDYjtBQUNBLGVBQU87QUFBQSxNQUNUO0FBQUE7QUFBQSxNQUdBLFVBQVU7QUFDUixhQUFLO0FBQUEsTUFDUDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQU9BLFVBQVUsT0FBTyxDQUFDLEdBQUc7QUFDbkIsWUFBSSxLQUFLLFlBQVksUUFBVztBQUM5QixvQkFBVSxLQUFLLElBQUksR0FBRyxPQUFPLEtBQUssT0FBTyxDQUFDO0FBQUEsUUFDNUM7QUFDQSxZQUFJLEtBQUssa0JBQWtCLFFBQVc7QUFDcEMsMEJBQWdCLEtBQUssSUFBSSxHQUFHLE9BQU8sS0FBSyxhQUFhLENBQUM7QUFBQSxRQUN4RDtBQUNBLFlBQUksS0FBSyxpQkFBaUIsUUFBVztBQUNuQyx5QkFBZSxRQUFRLEtBQUssWUFBWTtBQUFBLFFBQzFDO0FBQ0EsWUFBSSxLQUFLLFlBQVksUUFBVztBQUM5QixvQkFBVSxRQUFRLEtBQUssT0FBTztBQUM5QixjQUFJLENBQUMsU0FBUztBQUNaLGlCQUFLO0FBQUEsVUFDUDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsTUFFQSxXQUFXLE1BQU07QUFBQSxNQUNqQixVQUFVLE1BQU07QUFBQSxNQUNoQixXQUFXLE1BQU07QUFBQSxNQUNqQixVQUFVO0FBQ1IsbUJBQVc7QUFDWCxtQkFBVztBQUNYLG9CQUFZO0FBQ1osa0JBQVU7QUFDVixpQkFBUztBQUFBLE1BQ1g7QUFBQSxJQUNGO0FBQUEsRUFDRjs7O0FDbE9BLG9CQUF3QjtBQUV4QixNQUFPLGVBQVEsWUFBQUM7OztBQ0lmLFdBQVMsSUFBSSxNQUFNO0FBQ2pCLFVBQU0sUUFBUSxLQUFLO0FBSW5CLFVBQU0sc0JBQXNCLEtBQUssUUFBUSxNQUFNLEtBQUssRUFBRSxVQUFVLENBQUUsRUFBRSxPQUFPLE9BQU8sQ0FBRSxFQUFFLENBQUM7QUFDdkYsVUFBTSxtQkFBbUI7QUFDekIsVUFBTSxlQUFlO0FBQ3JCLFVBQU0sdUJBQXVCO0FBQzdCLFVBQU0sbUJBQW1CLGdCQUNyQixtQkFBbUIsTUFDbkIsTUFBTSxTQUFTLFlBQVksSUFDM0Isa0JBQWtCLE1BQU0sU0FBUyxvQkFBb0IsSUFDdkQ7QUFFRixVQUFNLHNCQUFzQjtBQUFBLE1BQzFCLFdBQVc7QUFBQSxNQUNYLE9BQU87QUFBQSxJQUNUO0FBSUEsVUFBTSxvQkFBb0I7QUFDMUIsVUFBTSxVQUFVO0FBQUEsTUFDZCxXQUFXO0FBQUEsTUFDWCxVQUFVO0FBQUEsUUFDUjtBQUFBLFVBQ0UsT0FBTztBQUFBLFVBQ1AsS0FBSztBQUFBLFVBQ0wsU0FBUztBQUFBLFVBQ1QsVUFBVSxDQUFFLEtBQUssZ0JBQWlCO0FBQUEsUUFDcEM7QUFBQSxRQUNBO0FBQUEsVUFDRSxPQUFPLGlCQUFrQixvQkFBb0I7QUFBQSxVQUM3QyxLQUFLO0FBQUEsVUFDTCxTQUFTO0FBQUEsUUFDWDtBQUFBLFFBQ0EsS0FBSyxrQkFBa0I7QUFBQSxVQUNyQixPQUFPO0FBQUEsVUFDUCxLQUFLO0FBQUEsUUFDUCxDQUFDO0FBQUEsTUFDSDtBQUFBLElBQ0Y7QUFFQSxVQUFNLFVBQVU7QUFBQSxNQUNkLFdBQVc7QUFBQSxNQUNYLFVBQVU7QUFBQTtBQUFBLFFBRVI7QUFBQSxVQUFFLE9BQ0E7QUFBQSxRQWtCRjtBQUFBO0FBQUEsUUFFQTtBQUFBLFVBQUUsT0FDQTtBQUFBO0FBQUE7QUFBQSxRQWNGO0FBQUEsTUFDRjtBQUFBLE1BQ0EsV0FBVztBQUFBLElBQ2I7QUFFQSxVQUFNLGVBQWU7QUFBQSxNQUNuQixXQUFXO0FBQUEsTUFDWCxPQUFPO0FBQUEsTUFDUCxLQUFLO0FBQUEsTUFDTCxVQUFVLEVBQUUsU0FDUix5RkFDd0M7QUFBQSxNQUM1QyxVQUFVO0FBQUEsUUFDUjtBQUFBLFVBQ0UsT0FBTztBQUFBLFVBQ1AsV0FBVztBQUFBLFFBQ2I7QUFBQSxRQUNBLEtBQUssUUFBUSxTQUFTLEVBQUUsV0FBVyxTQUFTLENBQUM7QUFBQSxRQUM3QztBQUFBLFVBQ0UsV0FBVztBQUFBLFVBQ1gsT0FBTztBQUFBLFFBQ1Q7QUFBQSxRQUNBO0FBQUEsUUFDQSxLQUFLO0FBQUEsTUFDUDtBQUFBLElBQ0Y7QUFFQSxVQUFNLGFBQWE7QUFBQSxNQUNqQixXQUFXO0FBQUEsTUFDWCxPQUFPLE1BQU0sU0FBUyxZQUFZLElBQUksS0FBSztBQUFBLE1BQzNDLFdBQVc7QUFBQSxJQUNiO0FBRUEsVUFBTSxpQkFBaUIsTUFBTSxTQUFTLFlBQVksSUFBSSxLQUFLLFdBQVc7QUFHdEUsVUFBTSxvQkFBb0I7QUFBQSxNQUN4QjtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUdBLFVBQU0saUJBQWlCO0FBQUEsTUFDckI7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBRUEsVUFBTSxhQUFhO0FBQUEsTUFDakI7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFFQSxVQUFNLGlCQUFpQjtBQUFBLE1BQ3JCO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFD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QUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUdBLE1BQU0sUUFBUTtBQUFBO0FBQUEsSUFFWjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBO0FBQUEsSUFFQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBO0FBQUEsSUFFQTtBQUFBLElBQ0E7QUFBQTtBQUFBLElBRUE7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBO0FBQUEsSUFFQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBO0FBQUEsSUFFQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQTtBQUFBLElBRUE7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQTtBQUFBLElBRUE7QUFBQSxJQUNBO0FBQUE7QUFBQSxJQUVBO0FBQUE7QUFBQSxJQUVBO0FBQUEsRUFDRjtBQUVBLE1BQU0sY0FBYztBQUFBLElBQ2xCO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0Y7QUFFQSxNQUFNLG1CQUFtQjtBQUFBLElBQ3ZCO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFFQTtBQUFBLElBQ0E7QUFBQSxJQUVBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLEVBQ0Y7QUFFQSxNQUFNLHFCQUFxQjtBQUFBLElBQ3pCO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFB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QU0sUUFBUSxrQkFBa0I7QUFDaEMsVUFBTSxXQUFXLFVBQVUsUUFBUSxPQUFPLE1BQU0sTUFBTSxHQUFHO0FBQ3pELFFBQUk7QUFDRixZQUFNLE1BQU0sTUFBTSxPQUFPLFFBQVEsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDO0FBQzdELGtCQUFZLElBQUksT0FBTztBQUFBLElBQ3pCLFNBQVMsT0FBTztBQUNkLGdCQUFVLGtCQUFrQixPQUFPLFdBQVcsT0FBTyxLQUFLLENBQUMsSUFBSSxJQUFJO0FBQUEsSUFDckU7QUFBQSxFQUNGLENBQUM7QUFFRCxrQkFBZ0IsaUJBQWlCLFNBQVMsTUFBTTtBQUM5QyxRQUFJLFlBQVksZ0JBQWdCO0FBQzlCLFdBQUssaUJBQWlCLFlBQVksV0FBVyxnQkFBZ0IsSUFBSTtBQUFBLElBQ25FO0FBQUEsRUFDRixDQUFDO0FBRUQsa0JBQWdCLGlCQUFpQixTQUFTLE1BQU07QUFDOUMsUUFBSSxZQUFZLGdCQUFnQjtBQUM5QixXQUFLLGlCQUFpQixZQUFZLFdBQVcsZ0JBQWdCLElBQUk7QUFBQSxJQUNuRTtBQUFBLEVBQ0YsQ0FBQztBQUVELHNCQUFvQixpQkFBaUIsVUFBVSxNQUFNO0FBQ25ELHlCQUFxQixzQkFBc0IsbUJBQW1CLEtBQUs7QUFDbkUsUUFBSSxjQUFjO0FBQ2hCLFdBQUssb0JBQW9CLFlBQVk7QUFBQSxJQUN2QztBQUNBLFFBQUksWUFBWSxZQUFZLE9BQU87QUFDakMsV0FBSyxvQkFBb0IsVUFBVTtBQUFBLElBQ3JDO0FBQUEsRUFDRixDQUFDO0FBRUQsU0FBTyxpQkFBaUIsU0FBUyxDQUFDLFVBQVU7QUFDMUMsY0FBVSxrQkFBa0IsTUFBTSxPQUFPLElBQUksSUFBSTtBQUFBLEVBQ25ELENBQUM7QUFFRCxTQUFPLGlCQUFpQixzQkFBc0IsQ0FBQyxVQUFVO0FBQ3ZELGNBQVUsd0JBQXdCLE9BQU8sTUFBTSxNQUFNLENBQUMsSUFBSSxJQUFJO0FBQUEsRUFDaEUsQ0FBQztBQUVELGlCQUFlLE9BQU87QUFDcEIsUUFBSTtBQUNGLFlBQU0sV0FBVyxNQUFNLE9BQU8sUUFBUSxpQkFBaUI7QUFBQSxRQUNyRCxRQUFRO0FBQUEsUUFDUixpQkFBaUI7QUFBQSxNQUNuQixDQUFDO0FBQ0QsdUJBQWlCLFNBQVMsT0FBTztBQUFBLElBQ25DLFFBQVE7QUFBQSxJQUVSO0FBQ0EsVUFBTSxVQUFVO0FBQUEsRUFDbEI7QUFFQSxPQUFLLEtBQUs7IiwKICAibmFtZXMiOiBbInJlbmRlcmVyIiwgIklERU5UX1JFIiwgInNjb3BlTmFtZSIsICJ2ZXJzaW9uIiwgImkiLCAiaGlnaGxpZ2h0IiwgInJlc3VsdCIsICJib290IiwgInN2ZyIsICJlbXB0eSIsICJhc0Jvb2xlYW4iLCAiSGlnaGxpZ2h0SlMiLCAiTElURVJBTFMiLCAiYWN0aXZlTm9kZUlkIl0KfQo=
