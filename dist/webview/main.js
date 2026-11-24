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
      let width = 1;
      let height = 1;
      if (dto.extent && Number.isFinite(dto.extent.width) && Number.isFinite(dto.extent.height)) {
        width = Math.max(1, dto.extent.width);
        height = Math.max(1, dto.extent.height);
      } else if (Array.isArray(dto.nodes) && dto.nodes.length > 0) {
        let maxX = 0;
        let maxY = 0;
        for (const node of dto.nodes) {
          const nx = (node.position?.x ?? 0) + (node.position?.width ?? 160);
          const ny = (node.position?.y ?? 0) + (node.position?.height ?? 50);
          if (nx > maxX) maxX = nx;
          if (ny > maxY) maxY = ny;
        }
        width = Math.max(1, maxX + 64);
        height = Math.max(1, maxY + 64);
      }
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
        const rawLines = Array.isArray(node.labelLines) && node.labelLines.length > 0 ? node.labelLines.filter((l) => typeof l === "string" && l.trim().length > 0) : [];
        const fallbackLabel = node.label && String(node.label).trim() || node.kind && String(node.kind).trim() || node.id;
        const lines = rawLines.length > 0 ? rawLines.slice(0, 2) : [truncate(fallbackLabel, 26)];
        const lineHeight = 13;
        const blockHeight = lines.length * lineHeight;
        const showKind = node.position.height >= 56 && lines.length === 1 && node.kind && String(fallbackLabel).toLowerCase() !== String(node.kind).toLowerCase();
        const startY = showKind ? Math.max(14, (node.position.height - 18) / 2 - blockHeight / 2 + lineHeight) : Math.max(14, node.position.height / 2 - blockHeight / 2 + lineHeight - 3);
        const label = svgEl("text", {
          class: "cf-node-label",
          x: 10,
          y: startY
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
        if (showKind) {
          const kind = svgEl("text", {
            class: "cf-node-kind",
            x: 10,
            y: node.position.height - 8
          });
          kind.textContent = node.external ? `${node.kind} \xB7 external` : node.kind;
          group.appendChild(kind);
        }
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
  var zoomBar = (
    /** @type {HTMLElement|null} */
    document.getElementById("cf-zoom-bar")
  );
  var zoomLevelBadge = (
    /** @type {HTMLElement|null} */
    document.getElementById("cf-zoom-level-badge")
  );
  var zoomBreadcrumbs = (
    /** @type {HTMLElement|null} */
    document.getElementById("cf-zoom-breadcrumbs")
  );
  var zoomSearch = (
    /** @type {HTMLInputElement|null} */
    document.getElementById("cf-zoom-search")
  );
  var zoomChips = (
    /** @type {HTMLElement|null} */
    document.getElementById("cf-zoom-chips")
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
  var rawPref = document.body.dataset.preferredPerspective;
  var preferredPerspective = rawPref === "call_graph" ? "call_graph" : rawPref === "semantic_zoom" ? "semantic_zoom" : "cfg";
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
      if (currentDto?.dtoKind === "semantic_zoom") {
        void descendSemanticZoom(nodeId, node);
        return;
      }
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
    const statuses = Array.isArray(dto?.legend?.statuses) ? dto.legend.statuses : [];
    for (const statusName of statuses) {
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
    const edgeKinds = Array.isArray(dto?.legend?.edgeKinds) ? dto.legend.edgeKinds : [];
    for (const edgeKind of edgeKinds) {
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
    empty.hidden = true;
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
    updateZoomBar(dto);
    if (switchPerspectiveBtn) {
      switchPerspectiveBtn.hidden = !selectedSymbolId || dto.dtoKind === "semantic_zoom";
      switchPerspectiveBtn.textContent = dto.dtoKind === "call_graph" ? "Show in CFG" : "Show in Call Graph";
    }
    const subject = dto.dtoKind === "cfg" && dto.function ? `${dto.function.qualifiedName} \xB7 CFG` : dto.dtoKind === "call_graph" ? `${dto.centerSymbolId} \xB7 Call Graph` : dto.dtoKind === "semantic_zoom" ? `${dto.level ?? "Overview"} \xB7 Semantic Zoom` : "graph";
    setStatus(
      `${subject} \xB7 ${dto.language ?? "workspace"} \xB7 ${dto.nodes.length} nodes \xB7 ${dto.edges.length} edges \xB7 ${dto.completeness ?? "complete"}`
    );
    meta.textContent = `${dto.adapterId ?? "codeflow"} \xB7 ${subject} \xB7 dto v${dto.dtoVersion}`;
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
  function updateZoomBar(dto) {
    if (!zoomBar) {
      return;
    }
    if (dto.dtoKind !== "semantic_zoom") {
      zoomBar.hidden = true;
      return;
    }
    zoomBar.hidden = false;
    if (zoomLevelBadge) {
      zoomLevelBadge.textContent = dto.level ? `${dto.level}` : "Semantic Zoom";
    }
    if (zoomBreadcrumbs && Array.isArray(dto.breadcrumbs)) {
      zoomBreadcrumbs.replaceChildren();
      for (const [index, crumb] of dto.breadcrumbs.entries()) {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cf-button";
        btn.style.padding = "2px 8px";
        btn.style.fontSize = "11px";
        btn.textContent = crumb.label || crumb.scopeId || `Level ${index}`;
        btn.addEventListener("click", async () => {
          try {
            const res = await bridge.request("zoom.breadcrumb", { index });
            handleGraph(res.payload);
          } catch (e) {
            setBanner(`Could not navigate breadcrumb: ${e?.message ?? e}`, true);
          }
        });
        li.appendChild(btn);
        zoomBreadcrumbs.appendChild(li);
      }
    }
    if (zoomChips && Array.isArray(dto.filterChips)) {
      zoomChips.replaceChildren();
      for (const chip of dto.filterChips) {
        const span = document.createElement("span");
        span.className = "cf-badge";
        span.textContent = `${chip.label || chip.kind} (${chip.count ?? 0})`;
        zoomChips.appendChild(span);
      }
    }
  }
  async function descendSemanticZoom(nodeId, node = nodeById(nodeId)) {
    if (!node) {
      return;
    }
    const currentLevel = currentDto?.level;
    let nextLevel = "L1_MODULE";
    if (currentLevel === "L0_WORKSPACE") nextLevel = "L1_MODULE";
    else if (currentLevel === "L1_MODULE") nextLevel = "L2_FILE";
    else if (currentLevel === "L2_FILE") nextLevel = "L3_SYMBOL";
    else if (currentLevel === "L3_SYMBOL") nextLevel = "L4_FUNCTION";
    else if (currentLevel === "L4_FUNCTION") nextLevel = "L5_STATEMENT";
    try {
      const res = await bridge.request("zoom.descend", {
        level: nextLevel,
        scopeId: node.scopeId || node.id,
        label: node.label
      });
      handleGraph(res.payload);
    } catch (error) {
      setBanner(`Could not descend: ${error?.message ?? String(error)}`, true);
    }
  }
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
  async function loadSemanticZoom() {
    setStatus("Loading semantic zoom\u2026");
    setBanner("");
    try {
      const response = await bridge.request("zoom.open", {});
      activePerspective = "semantic_zoom";
      if (perspectiveSelect) {
        perspectiveSelect.value = "semantic_zoom";
      }
      handleGraph(response.payload);
      return true;
    } catch (error) {
      setBanner(`Could not open semantic zoom: ${error?.message ?? String(error)}`, true);
      setStatus("Semantic zoom unavailable");
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
    if (activePerspective === "semantic_zoom") {
      const loaded = await loadSemanticZoom();
      if (loaded) {
        return;
      }
    }
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
    const val = perspectiveSelect.value;
    activePerspective = val === "call_graph" ? "call_graph" : val === "semantic_zoom" ? "semantic_zoom" : "cfg";
    if (activePerspective === "semantic_zoom") {
      void loadSemanticZoom();
      return;
    }
    const symbolToUse = selectedSymbolId || (functionPicker?.options[0]?.value ?? null);
    if (symbolToUse) {
      if (activePerspective === "call_graph") {
        void loadCallGraph(symbolToUse);
      } else {
        void loadCfg(symbolToUse);
      }
    } else {
      void loadGraph();
    }
  });
  var searchDebounce = null;
  zoomSearch?.addEventListener("input", () => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    searchDebounce = setTimeout(async () => {
      searchDebounce = null;
      const queryText = zoomSearch.value.trim();
      if (!queryText) {
        return;
      }
      try {
        const res = await bridge.request("zoom.search", { queryText });
        const items = res.payload?.items ?? res.payload?.results?.items ?? [];
        if (items.length > 0) {
          const jump = await bridge.request("zoom.search", { jumpItem: items[0] });
          handleGraph(jump.payload);
        }
      } catch {
      }
    }, 300);
  });
  switchPerspectiveBtn?.addEventListener("click", () => {
    const targetSymbol = activeNodeId && currentDto?.dtoKind === "call_graph" && !activeNodeId.startsWith("bucket:") ? activeNodeId : selectedSymbolId || (functionPicker?.options[0]?.value ?? null);
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
  window.addEventListener("message", (event) => {
    void bridge.handleMessage(event.data);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vbm9kZV9tb2R1bGVzL2hpZ2hsaWdodC5qcy9saWIvY29yZS5qcyIsICIuLi8uLi9zcmMvY29yZS9wcm90b2NvbC9lbnZlbG9wZS5qcyIsICIuLi8uLi9zcmMvY29yZS9wcm90b2NvbC9icmlkZ2UuanMiLCAiLi4vLi4vc3JjL2NvcmUvZ3JhcGgvbGF5b3V0LmpzIiwgIi4uLy4uL3NyYy9jb3JlL2dyYXBoL2NmZy9raW5kcy5qcyIsICIuLi8uLi9zcmMvY29yZS9ncmFwaC9jYWxscy9raW5kcy5qcyIsICIuLi8uLi9zcmMvY29yZS9ncmFwaC96b29tL2xldmVscy5qcyIsICIuLi8uLi9zcmMvY29yZS9ncmFwaC9kdG8uanMiLCAiLi4vLi4vc3JjL3Zpc3VhbGl6YXRpb24vcmVuZGVyZXIvc3ZnUmVuZGVyZXIuanMiLCAiLi4vLi4vc3JjL2NvcmUvc291cmNlL3Jhbmdlcy5qcyIsICIuLi8uLi9zcmMvY29yZS9zb3VyY2UvcHJlc2VudGF0aW9uLmpzIiwgIi4uLy4uL3NyYy9jb3JlL3NvdXJjZS9zZXR0aW5ncy5qcyIsICIuLi8uLi9zcmMvY29yZS9leHBsYW5hdGlvbi9zZXR0aW5ncy5qcyIsICIuLi8uLi9zcmMvd2Vidmlldy9wcmV2aWV3Q29udHJvbGxlci5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvaGlnaGxpZ2h0LmpzL2VzL2NvcmUuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2hpZ2hsaWdodC5qcy9lcy9sYW5ndWFnZXMvY3BwLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9oaWdobGlnaHQuanMvZXMvbGFuZ3VhZ2VzL2phdmFzY3JpcHQuanMiLCAiLi4vLi4vc3JjL3dlYnZpZXcvaGlnaGxpZ2h0LmpzIiwgIi4uLy4uL3NyYy93ZWJ2aWV3L21haW4uanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qIGVzbGludC1kaXNhYmxlIG5vLW11bHRpLWFzc2lnbiAqL1xuXG5mdW5jdGlvbiBkZWVwRnJlZXplKG9iaikge1xuICBpZiAob2JqIGluc3RhbmNlb2YgTWFwKSB7XG4gICAgb2JqLmNsZWFyID1cbiAgICAgIG9iai5kZWxldGUgPVxuICAgICAgb2JqLnNldCA9XG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21hcCBpcyByZWFkLW9ubHknKTtcbiAgICAgICAgfTtcbiAgfSBlbHNlIGlmIChvYmogaW5zdGFuY2VvZiBTZXQpIHtcbiAgICBvYmouYWRkID1cbiAgICAgIG9iai5jbGVhciA9XG4gICAgICBvYmouZGVsZXRlID1cbiAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignc2V0IGlzIHJlYWQtb25seScpO1xuICAgICAgICB9O1xuICB9XG5cbiAgLy8gRnJlZXplIHNlbGZcbiAgT2JqZWN0LmZyZWV6ZShvYmopO1xuXG4gIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG9iaikuZm9yRWFjaCgobmFtZSkgPT4ge1xuICAgIGNvbnN0IHByb3AgPSBvYmpbbmFtZV07XG4gICAgY29uc3QgdHlwZSA9IHR5cGVvZiBwcm9wO1xuXG4gICAgLy8gRnJlZXplIHByb3AgaWYgaXQgaXMgYW4gb2JqZWN0IG9yIGZ1bmN0aW9uIGFuZCBhbHNvIG5vdCBhbHJlYWR5IGZyb3plblxuICAgIGlmICgodHlwZSA9PT0gJ29iamVjdCcgfHwgdHlwZSA9PT0gJ2Z1bmN0aW9uJykgJiYgIU9iamVjdC5pc0Zyb3plbihwcm9wKSkge1xuICAgICAgZGVlcEZyZWV6ZShwcm9wKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBvYmo7XG59XG5cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5DYWxsYmFja1Jlc3BvbnNlfSBDYWxsYmFja1Jlc3BvbnNlICovXG4vKiogQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQ29tcGlsZWRNb2RlfSBDb21waWxlZE1vZGUgKi9cbi8qKiBAaW1wbGVtZW50cyBDYWxsYmFja1Jlc3BvbnNlICovXG5cbmNsYXNzIFJlc3BvbnNlIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7Q29tcGlsZWRNb2RlfSBtb2RlXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihtb2RlKSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmaW5lZFxuICAgIGlmIChtb2RlLmRhdGEgPT09IHVuZGVmaW5lZCkgbW9kZS5kYXRhID0ge307XG5cbiAgICB0aGlzLmRhdGEgPSBtb2RlLmRhdGE7XG4gICAgdGhpcy5pc01hdGNoSWdub3JlZCA9IGZhbHNlO1xuICB9XG5cbiAgaWdub3JlTWF0Y2goKSB7XG4gICAgdGhpcy5pc01hdGNoSWdub3JlZCA9IHRydWU7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVzY2FwZUhUTUwodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlXG4gICAgLnJlcGxhY2UoLyYvZywgJyZhbXA7JylcbiAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXG4gICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKVxuICAgIC5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7JylcbiAgICAucmVwbGFjZSgvJy9nLCAnJiN4Mjc7Jyk7XG59XG5cbi8qKlxuICogcGVyZm9ybXMgYSBzaGFsbG93IG1lcmdlIG9mIG11bHRpcGxlIG9iamVjdHMgaW50byBvbmVcbiAqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtUfSBvcmlnaW5hbFxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLGFueT5bXX0gb2JqZWN0c1xuICogQHJldHVybnMge1R9IGEgc2luZ2xlIG5ldyBvYmplY3RcbiAqL1xuZnVuY3Rpb24gaW5oZXJpdCQxKG9yaWdpbmFsLCAuLi5vYmplY3RzKSB7XG4gIC8qKiBAdHlwZSBSZWNvcmQ8c3RyaW5nLGFueT4gKi9cbiAgY29uc3QgcmVzdWx0ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICBmb3IgKGNvbnN0IGtleSBpbiBvcmlnaW5hbCkge1xuICAgIHJlc3VsdFtrZXldID0gb3JpZ2luYWxba2V5XTtcbiAgfVxuICBvYmplY3RzLmZvckVhY2goZnVuY3Rpb24ob2JqKSB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gb2JqKSB7XG4gICAgICByZXN1bHRba2V5XSA9IG9ialtrZXldO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiAvKiogQHR5cGUge1R9ICovIChyZXN1bHQpO1xufVxuXG4vKipcbiAqIEB0eXBlZGVmIHtvYmplY3R9IFJlbmRlcmVyXG4gKiBAcHJvcGVydHkgeyh0ZXh0OiBzdHJpbmcpID0+IHZvaWR9IGFkZFRleHRcbiAqIEBwcm9wZXJ0eSB7KG5vZGU6IE5vZGUpID0+IHZvaWR9IG9wZW5Ob2RlXG4gKiBAcHJvcGVydHkgeyhub2RlOiBOb2RlKSA9PiB2b2lkfSBjbG9zZU5vZGVcbiAqIEBwcm9wZXJ0eSB7KCkgPT4gc3RyaW5nfSB2YWx1ZVxuICovXG5cbi8qKiBAdHlwZWRlZiB7e3Njb3BlPzogc3RyaW5nLCBsYW5ndWFnZT86IHN0cmluZywgc3VibGFuZ3VhZ2U/OiBib29sZWFufX0gTm9kZSAqL1xuLyoqIEB0eXBlZGVmIHt7d2FsazogKHI6IFJlbmRlcmVyKSA9PiB2b2lkfX0gVHJlZSAqL1xuLyoqICovXG5cbmNvbnN0IFNQQU5fQ0xPU0UgPSAnPC9zcGFuPic7XG5cbi8qKlxuICogRGV0ZXJtaW5lcyBpZiBhIG5vZGUgbmVlZHMgdG8gYmUgd3JhcHBlZCBpbiA8c3Bhbj5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGUgKi9cbmNvbnN0IGVtaXRzV3JhcHBpbmdUYWdzID0gKG5vZGUpID0+IHtcbiAgLy8gcmFyZWx5IHdlIGNhbiBoYXZlIGEgc3VibGFuZ3VhZ2Ugd2hlcmUgbGFuZ3VhZ2UgaXMgdW5kZWZpbmVkXG4gIC8vIFRPRE86IHRyYWNrIGRvd24gd2h5XG4gIHJldHVybiAhIW5vZGUuc2NvcGU7XG59O1xuXG4vKipcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHBhcmFtIHt7cHJlZml4OnN0cmluZ319IG9wdGlvbnNcbiAqL1xuY29uc3Qgc2NvcGVUb0NTU0NsYXNzID0gKG5hbWUsIHsgcHJlZml4IH0pID0+IHtcbiAgLy8gc3ViLWxhbmd1YWdlXG4gIGlmIChuYW1lLnN0YXJ0c1dpdGgoXCJsYW5ndWFnZTpcIikpIHtcbiAgICByZXR1cm4gbmFtZS5yZXBsYWNlKFwibGFuZ3VhZ2U6XCIsIFwibGFuZ3VhZ2UtXCIpO1xuICB9XG4gIC8vIHRpZXJlZCBzY29wZTogY29tbWVudC5saW5lXG4gIGlmIChuYW1lLmluY2x1ZGVzKFwiLlwiKSkge1xuICAgIGNvbnN0IHBpZWNlcyA9IG5hbWUuc3BsaXQoXCIuXCIpO1xuICAgIHJldHVybiBbXG4gICAgICBgJHtwcmVmaXh9JHtwaWVjZXMuc2hpZnQoKX1gLFxuICAgICAgLi4uKHBpZWNlcy5tYXAoKHgsIGkpID0+IGAke3h9JHtcIl9cIi5yZXBlYXQoaSArIDEpfWApKVxuICAgIF0uam9pbihcIiBcIik7XG4gIH1cbiAgLy8gc2ltcGxlIHNjb3BlXG4gIHJldHVybiBgJHtwcmVmaXh9JHtuYW1lfWA7XG59O1xuXG4vKiogQHR5cGUge1JlbmRlcmVyfSAqL1xuY2xhc3MgSFRNTFJlbmRlcmVyIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgSFRNTFJlbmRlcmVyXG4gICAqXG4gICAqIEBwYXJhbSB7VHJlZX0gcGFyc2VUcmVlIC0gdGhlIHBhcnNlIHRyZWUgKG11c3Qgc3VwcG9ydCBgd2Fsa2AgQVBJKVxuICAgKiBAcGFyYW0ge3tjbGFzc1ByZWZpeDogc3RyaW5nfX0gb3B0aW9uc1xuICAgKi9cbiAgY29uc3RydWN0b3IocGFyc2VUcmVlLCBvcHRpb25zKSB7XG4gICAgdGhpcy5idWZmZXIgPSBcIlwiO1xuICAgIHRoaXMuY2xhc3NQcmVmaXggPSBvcHRpb25zLmNsYXNzUHJlZml4O1xuICAgIHBhcnNlVHJlZS53YWxrKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGV4dHMgdG8gdGhlIG91dHB1dCBzdHJlYW1cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRleHQgKi9cbiAgYWRkVGV4dCh0ZXh0KSB7XG4gICAgdGhpcy5idWZmZXIgKz0gZXNjYXBlSFRNTCh0ZXh0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgbm9kZSBvcGVuIHRvIHRoZSBvdXRwdXQgc3RyZWFtIChpZiBuZWVkZWQpXG4gICAqXG4gICAqIEBwYXJhbSB7Tm9kZX0gbm9kZSAqL1xuICBvcGVuTm9kZShub2RlKSB7XG4gICAgaWYgKCFlbWl0c1dyYXBwaW5nVGFncyhub2RlKSkgcmV0dXJuO1xuXG4gICAgY29uc3QgY2xhc3NOYW1lID0gc2NvcGVUb0NTU0NsYXNzKG5vZGUuc2NvcGUsXG4gICAgICB7IHByZWZpeDogdGhpcy5jbGFzc1ByZWZpeCB9KTtcbiAgICB0aGlzLnNwYW4oY2xhc3NOYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgbm9kZSBjbG9zZSB0byB0aGUgb3V0cHV0IHN0cmVhbSAoaWYgbmVlZGVkKVxuICAgKlxuICAgKiBAcGFyYW0ge05vZGV9IG5vZGUgKi9cbiAgY2xvc2VOb2RlKG5vZGUpIHtcbiAgICBpZiAoIWVtaXRzV3JhcHBpbmdUYWdzKG5vZGUpKSByZXR1cm47XG5cbiAgICB0aGlzLmJ1ZmZlciArPSBTUEFOX0NMT1NFO1xuICB9XG5cbiAgLyoqXG4gICAqIHJldHVybnMgdGhlIGFjY3VtdWxhdGVkIGJ1ZmZlclxuICAqL1xuICB2YWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5idWZmZXI7XG4gIH1cblxuICAvLyBoZWxwZXJzXG5cbiAgLyoqXG4gICAqIEJ1aWxkcyBhIHNwYW4gZWxlbWVudFxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lICovXG4gIHNwYW4oY2xhc3NOYW1lKSB7XG4gICAgdGhpcy5idWZmZXIgKz0gYDxzcGFuIGNsYXNzPVwiJHtjbGFzc05hbWV9XCI+YDtcbiAgfVxufVxuXG4vKiogQHR5cGVkZWYge3tzY29wZT86IHN0cmluZywgbGFuZ3VhZ2U/OiBzdHJpbmcsIGNoaWxkcmVuOiBOb2RlW119IHwgc3RyaW5nfSBOb2RlICovXG4vKiogQHR5cGVkZWYge3tzY29wZT86IHN0cmluZywgbGFuZ3VhZ2U/OiBzdHJpbmcsIGNoaWxkcmVuOiBOb2RlW119IH0gRGF0YU5vZGUgKi9cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5FbWl0dGVyfSBFbWl0dGVyICovXG4vKiogICovXG5cbi8qKiBAcmV0dXJucyB7RGF0YU5vZGV9ICovXG5jb25zdCBuZXdOb2RlID0gKG9wdHMgPSB7fSkgPT4ge1xuICAvKiogQHR5cGUgRGF0YU5vZGUgKi9cbiAgY29uc3QgcmVzdWx0ID0geyBjaGlsZHJlbjogW10gfTtcbiAgT2JqZWN0LmFzc2lnbihyZXN1bHQsIG9wdHMpO1xuICByZXR1cm4gcmVzdWx0O1xufTtcblxuY2xhc3MgVG9rZW5UcmVlIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLyoqIEB0eXBlIERhdGFOb2RlICovXG4gICAgdGhpcy5yb290Tm9kZSA9IG5ld05vZGUoKTtcbiAgICB0aGlzLnN0YWNrID0gW3RoaXMucm9vdE5vZGVdO1xuICB9XG5cbiAgZ2V0IHRvcCgpIHtcbiAgICByZXR1cm4gdGhpcy5zdGFja1t0aGlzLnN0YWNrLmxlbmd0aCAtIDFdO1xuICB9XG5cbiAgZ2V0IHJvb3QoKSB7IHJldHVybiB0aGlzLnJvb3ROb2RlOyB9XG5cbiAgLyoqIEBwYXJhbSB7Tm9kZX0gbm9kZSAqL1xuICBhZGQobm9kZSkge1xuICAgIHRoaXMudG9wLmNoaWxkcmVuLnB1c2gobm9kZSk7XG4gIH1cblxuICAvKiogQHBhcmFtIHtzdHJpbmd9IHNjb3BlICovXG4gIG9wZW5Ob2RlKHNjb3BlKSB7XG4gICAgLyoqIEB0eXBlIE5vZGUgKi9cbiAgICBjb25zdCBub2RlID0gbmV3Tm9kZSh7IHNjb3BlIH0pO1xuICAgIHRoaXMuYWRkKG5vZGUpO1xuICAgIHRoaXMuc3RhY2sucHVzaChub2RlKTtcbiAgfVxuXG4gIGNsb3NlTm9kZSgpIHtcbiAgICBpZiAodGhpcy5zdGFjay5sZW5ndGggPiAxKSB7XG4gICAgICByZXR1cm4gdGhpcy5zdGFjay5wb3AoKTtcbiAgICB9XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmaW5lZFxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBjbG9zZUFsbE5vZGVzKCkge1xuICAgIHdoaWxlICh0aGlzLmNsb3NlTm9kZSgpKTtcbiAgfVxuXG4gIHRvSlNPTigpIHtcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodGhpcy5yb290Tm9kZSwgbnVsbCwgNCk7XG4gIH1cblxuICAvKipcbiAgICogQHR5cGVkZWYgeyBpbXBvcnQoXCIuL2h0bWxfcmVuZGVyZXJcIikuUmVuZGVyZXIgfSBSZW5kZXJlclxuICAgKiBAcGFyYW0ge1JlbmRlcmVyfSBidWlsZGVyXG4gICAqL1xuICB3YWxrKGJ1aWxkZXIpIHtcbiAgICAvLyB0aGlzIGRvZXMgbm90XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuX3dhbGsoYnVpbGRlciwgdGhpcy5yb290Tm9kZSk7XG4gICAgLy8gdGhpcyB3b3Jrc1xuICAgIC8vIHJldHVybiBUb2tlblRyZWUuX3dhbGsoYnVpbGRlciwgdGhpcy5yb290Tm9kZSk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtSZW5kZXJlcn0gYnVpbGRlclxuICAgKiBAcGFyYW0ge05vZGV9IG5vZGVcbiAgICovXG4gIHN0YXRpYyBfd2FsayhidWlsZGVyLCBub2RlKSB7XG4gICAgaWYgKHR5cGVvZiBub2RlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBidWlsZGVyLmFkZFRleHQobm9kZSk7XG4gICAgfSBlbHNlIGlmIChub2RlLmNoaWxkcmVuKSB7XG4gICAgICBidWlsZGVyLm9wZW5Ob2RlKG5vZGUpO1xuICAgICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4gdGhpcy5fd2FsayhidWlsZGVyLCBjaGlsZCkpO1xuICAgICAgYnVpbGRlci5jbG9zZU5vZGUobm9kZSk7XG4gICAgfVxuICAgIHJldHVybiBidWlsZGVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7Tm9kZX0gbm9kZVxuICAgKi9cbiAgc3RhdGljIF9jb2xsYXBzZShub2RlKSB7XG4gICAgaWYgKHR5cGVvZiBub2RlID09PSBcInN0cmluZ1wiKSByZXR1cm47XG4gICAgaWYgKCFub2RlLmNoaWxkcmVuKSByZXR1cm47XG5cbiAgICBpZiAobm9kZS5jaGlsZHJlbi5ldmVyeShlbCA9PiB0eXBlb2YgZWwgPT09IFwic3RyaW5nXCIpKSB7XG4gICAgICAvLyBub2RlLnRleHQgPSBub2RlLmNoaWxkcmVuLmpvaW4oXCJcIik7XG4gICAgICAvLyBkZWxldGUgbm9kZS5jaGlsZHJlbjtcbiAgICAgIG5vZGUuY2hpbGRyZW4gPSBbbm9kZS5jaGlsZHJlbi5qb2luKFwiXCIpXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4ge1xuICAgICAgICBUb2tlblRyZWUuX2NvbGxhcHNlKGNoaWxkKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAgQ3VycmVudGx5IHRoaXMgaXMgYWxsIHByaXZhdGUgQVBJLCBidXQgdGhpcyBpcyB0aGUgbWluaW1hbCBBUEkgbmVjZXNzYXJ5XG4gIHRoYXQgYW4gRW1pdHRlciBtdXN0IGltcGxlbWVudCB0byBmdWxseSBzdXBwb3J0IHRoZSBwYXJzZXIuXG5cbiAgTWluaW1hbCBpbnRlcmZhY2U6XG5cbiAgLSBhZGRUZXh0KHRleHQpXG4gIC0gX19hZGRTdWJsYW5ndWFnZShlbWl0dGVyLCBzdWJMYW5ndWFnZU5hbWUpXG4gIC0gc3RhcnRTY29wZShzY29wZSlcbiAgLSBlbmRTY29wZSgpXG4gIC0gZmluYWxpemUoKVxuICAtIHRvSFRNTCgpXG5cbiovXG5cbi8qKlxuICogQGltcGxlbWVudHMge0VtaXR0ZXJ9XG4gKi9cbmNsYXNzIFRva2VuVHJlZUVtaXR0ZXIgZXh0ZW5kcyBUb2tlblRyZWUge1xuICAvKipcbiAgICogQHBhcmFtIHsqfSBvcHRpb25zXG4gICAqL1xuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gICAqL1xuICBhZGRUZXh0KHRleHQpIHtcbiAgICBpZiAodGV4dCA9PT0gXCJcIikgeyByZXR1cm47IH1cblxuICAgIHRoaXMuYWRkKHRleHQpO1xuICB9XG5cbiAgLyoqIEBwYXJhbSB7c3RyaW5nfSBzY29wZSAqL1xuICBzdGFydFNjb3BlKHNjb3BlKSB7XG4gICAgdGhpcy5vcGVuTm9kZShzY29wZSk7XG4gIH1cblxuICBlbmRTY29wZSgpIHtcbiAgICB0aGlzLmNsb3NlTm9kZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7RW1pdHRlciAmIHtyb290OiBEYXRhTm9kZX19IGVtaXR0ZXJcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICovXG4gIF9fYWRkU3VibGFuZ3VhZ2UoZW1pdHRlciwgbmFtZSkge1xuICAgIC8qKiBAdHlwZSBEYXRhTm9kZSAqL1xuICAgIGNvbnN0IG5vZGUgPSBlbWl0dGVyLnJvb3Q7XG4gICAgaWYgKG5hbWUpIG5vZGUuc2NvcGUgPSBgbGFuZ3VhZ2U6JHtuYW1lfWA7XG5cbiAgICB0aGlzLmFkZChub2RlKTtcbiAgfVxuXG4gIHRvSFRNTCgpIHtcbiAgICBjb25zdCByZW5kZXJlciA9IG5ldyBIVE1MUmVuZGVyZXIodGhpcywgdGhpcy5vcHRpb25zKTtcbiAgICByZXR1cm4gcmVuZGVyZXIudmFsdWUoKTtcbiAgfVxuXG4gIGZpbmFsaXplKCkge1xuICAgIHRoaXMuY2xvc2VBbGxOb2RlcygpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gKiBAcmV0dXJucyB7UmVnRXhwfVxuICogKi9cblxuLyoqXG4gKiBAcGFyYW0ge1JlZ0V4cCB8IHN0cmluZyB9IHJlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBzb3VyY2UocmUpIHtcbiAgaWYgKCFyZSkgcmV0dXJuIG51bGw7XG4gIGlmICh0eXBlb2YgcmUgPT09IFwic3RyaW5nXCIpIHJldHVybiByZTtcblxuICByZXR1cm4gcmUuc291cmNlO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVnRXhwIHwgc3RyaW5nIH0gcmVcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGxvb2thaGVhZChyZSkge1xuICByZXR1cm4gY29uY2F0KCcoPz0nLCByZSwgJyknKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlZ0V4cCB8IHN0cmluZyB9IHJlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBhbnlOdW1iZXJPZlRpbWVzKHJlKSB7XG4gIHJldHVybiBjb25jYXQoJyg/OicsIHJlLCAnKSonKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlZ0V4cCB8IHN0cmluZyB9IHJlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBvcHRpb25hbChyZSkge1xuICByZXR1cm4gY29uY2F0KCcoPzonLCByZSwgJyk/Jyk7XG59XG5cbi8qKlxuICogQHBhcmFtIHsuLi4oUmVnRXhwIHwgc3RyaW5nKSB9IGFyZ3NcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGNvbmNhdCguLi5hcmdzKSB7XG4gIGNvbnN0IGpvaW5lZCA9IGFyZ3MubWFwKCh4KSA9PiBzb3VyY2UoeCkpLmpvaW4oXCJcIik7XG4gIHJldHVybiBqb2luZWQ7XG59XG5cbi8qKlxuICogQHBhcmFtIHsgQXJyYXk8c3RyaW5nIHwgUmVnRXhwIHwgT2JqZWN0PiB9IGFyZ3NcbiAqIEByZXR1cm5zIHtvYmplY3R9XG4gKi9cbmZ1bmN0aW9uIHN0cmlwT3B0aW9uc0Zyb21BcmdzKGFyZ3MpIHtcbiAgY29uc3Qgb3B0cyA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcblxuICBpZiAodHlwZW9mIG9wdHMgPT09ICdvYmplY3QnICYmIG9wdHMuY29uc3RydWN0b3IgPT09IE9iamVjdCkge1xuICAgIGFyZ3Muc3BsaWNlKGFyZ3MubGVuZ3RoIC0gMSwgMSk7XG4gICAgcmV0dXJuIG9wdHM7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG59XG5cbi8qKiBAdHlwZWRlZiB7IHtjYXB0dXJlPzogYm9vbGVhbn0gfSBSZWdleEVpdGhlck9wdGlvbnMgKi9cblxuLyoqXG4gKiBBbnkgb2YgdGhlIHBhc3NlZCBleHByZXNzc2lvbnMgbWF5IG1hdGNoXG4gKlxuICogQ3JlYXRlcyBhIGh1Z2UgdGhpcyB8IHRoaXMgfCB0aGF0IHwgdGhhdCBtYXRjaFxuICogQHBhcmFtIHsoUmVnRXhwIHwgc3RyaW5nKVtdIHwgWy4uLihSZWdFeHAgfCBzdHJpbmcpW10sIFJlZ2V4RWl0aGVyT3B0aW9uc119IGFyZ3NcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVpdGhlciguLi5hcmdzKSB7XG4gIC8qKiBAdHlwZSB7IG9iamVjdCAmIHtjYXB0dXJlPzogYm9vbGVhbn0gfSAgKi9cbiAgY29uc3Qgb3B0cyA9IHN0cmlwT3B0aW9uc0Zyb21BcmdzKGFyZ3MpO1xuICBjb25zdCBqb2luZWQgPSAnKCdcbiAgICArIChvcHRzLmNhcHR1cmUgPyBcIlwiIDogXCI/OlwiKVxuICAgICsgYXJncy5tYXAoKHgpID0+IHNvdXJjZSh4KSkuam9pbihcInxcIikgKyBcIilcIjtcbiAgcmV0dXJuIGpvaW5lZDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlZ0V4cCB8IHN0cmluZ30gcmVcbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIGNvdW50TWF0Y2hHcm91cHMocmUpIHtcbiAgcmV0dXJuIChuZXcgUmVnRXhwKHJlLnRvU3RyaW5nKCkgKyAnfCcpKS5leGVjKCcnKS5sZW5ndGggLSAxO1xufVxuXG4vKipcbiAqIERvZXMgbGV4ZW1lIHN0YXJ0IHdpdGggYSByZWd1bGFyIGV4cHJlc3Npb24gbWF0Y2ggYXQgdGhlIGJlZ2lubmluZ1xuICogQHBhcmFtIHtSZWdFeHB9IHJlXG4gKiBAcGFyYW0ge3N0cmluZ30gbGV4ZW1lXG4gKi9cbmZ1bmN0aW9uIHN0YXJ0c1dpdGgocmUsIGxleGVtZSkge1xuICBjb25zdCBtYXRjaCA9IHJlICYmIHJlLmV4ZWMobGV4ZW1lKTtcbiAgcmV0dXJuIG1hdGNoICYmIG1hdGNoLmluZGV4ID09PSAwO1xufVxuXG4vLyBCQUNLUkVGX1JFIG1hdGNoZXMgYW4gb3BlbiBwYXJlbnRoZXNpcyBvciBiYWNrcmVmZXJlbmNlLiBUbyBhdm9pZFxuLy8gYW4gaW5jb3JyZWN0IHBhcnNlLCBpdCBhZGRpdGlvbmFsbHkgbWF0Y2hlcyB0aGUgZm9sbG93aW5nOlxuLy8gLSBbLi4uXSBlbGVtZW50cywgd2hlcmUgdGhlIG1lYW5pbmcgb2YgcGFyZW50aGVzZXMgYW5kIGVzY2FwZXMgY2hhbmdlXG4vLyAtIG90aGVyIGVzY2FwZSBzZXF1ZW5jZXMsIHNvIHdlIGRvIG5vdCBtaXNwYXJzZSBlc2NhcGUgc2VxdWVuY2VzIGFzXG4vLyAgIGludGVyZXN0aW5nIGVsZW1lbnRzXG4vLyAtIG5vbi1tYXRjaGluZyBvciBsb29rYWhlYWQgcGFyZW50aGVzZXMsIHdoaWNoIGRvIG5vdCBjYXB0dXJlLiBUaGVzZVxuLy8gICBmb2xsb3cgdGhlICcoJyB3aXRoIGEgJz8nLlxuY29uc3QgQkFDS1JFRl9SRSA9IC9cXFsoPzpbXlxcXFxcXF1dfFxcXFwuKSpcXF18XFwoXFw/P3xcXFxcKFsxLTldWzAtOV0qKXxcXFxcLi87XG5cbi8vICoqSU5URVJOQUwqKiBOb3QgaW50ZW5kZWQgZm9yIG91dHNpZGUgdXNhZ2Vcbi8vIGpvaW4gbG9naWNhbGx5IGNvbXB1dGVzIHJlZ2V4cHMuam9pbihzZXBhcmF0b3IpLCBidXQgZml4ZXMgdGhlXG4vLyBiYWNrcmVmZXJlbmNlcyBzbyB0aGV5IGNvbnRpbnVlIHRvIG1hdGNoLlxuLy8gaXQgYWxzbyBwbGFjZXMgZWFjaCBpbmRpdmlkdWFsIHJlZ3VsYXIgZXhwcmVzc2lvbiBpbnRvIGl0J3Mgb3duXG4vLyBtYXRjaCBncm91cCwga2VlcGluZyB0cmFjayBvZiB0aGUgc2VxdWVuY2luZyBvZiB0aG9zZSBtYXRjaCBncm91cHNcbi8vIGlzIGN1cnJlbnRseSBhbiBleGVyY2lzZSBmb3IgdGhlIGNhbGxlci4gOi0pXG4vKipcbiAqIEBwYXJhbSB7KHN0cmluZyB8IFJlZ0V4cClbXX0gcmVnZXhwc1xuICogQHBhcmFtIHt7am9pbldpdGg6IHN0cmluZ319IG9wdHNcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIF9yZXdyaXRlQmFja3JlZmVyZW5jZXMocmVnZXhwcywgeyBqb2luV2l0aCB9KSB7XG4gIGxldCBudW1DYXB0dXJlcyA9IDA7XG5cbiAgcmV0dXJuIHJlZ2V4cHMubWFwKChyZWdleCkgPT4ge1xuICAgIG51bUNhcHR1cmVzICs9IDE7XG4gICAgY29uc3Qgb2Zmc2V0ID0gbnVtQ2FwdHVyZXM7XG4gICAgbGV0IHJlID0gc291cmNlKHJlZ2V4KTtcbiAgICBsZXQgb3V0ID0gJyc7XG5cbiAgICB3aGlsZSAocmUubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgbWF0Y2ggPSBCQUNLUkVGX1JFLmV4ZWMocmUpO1xuICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICBvdXQgKz0gcmU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgb3V0ICs9IHJlLnN1YnN0cmluZygwLCBtYXRjaC5pbmRleCk7XG4gICAgICByZSA9IHJlLnN1YnN0cmluZyhtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aCk7XG4gICAgICBpZiAobWF0Y2hbMF1bMF0gPT09ICdcXFxcJyAmJiBtYXRjaFsxXSkge1xuICAgICAgICAvLyBBZGp1c3QgdGhlIGJhY2tyZWZlcmVuY2UuXG4gICAgICAgIG91dCArPSAnXFxcXCcgKyBTdHJpbmcoTnVtYmVyKG1hdGNoWzFdKSArIG9mZnNldCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXQgKz0gbWF0Y2hbMF07XG4gICAgICAgIGlmIChtYXRjaFswXSA9PT0gJygnKSB7XG4gICAgICAgICAgbnVtQ2FwdHVyZXMrKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9KS5tYXAocmUgPT4gYCgke3JlfSlgKS5qb2luKGpvaW5XaXRoKTtcbn1cblxuLyoqIEB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLk1vZGV9IE1vZGUgKi9cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5Nb2RlQ2FsbGJhY2t9IE1vZGVDYWxsYmFjayAqL1xuXG4vLyBDb21tb24gcmVnZXhwc1xuY29uc3QgTUFUQ0hfTk9USElOR19SRSA9IC9cXGJcXEIvO1xuY29uc3QgSURFTlRfUkUgPSAnW2EtekEtWl1cXFxcdyonO1xuY29uc3QgVU5ERVJTQ09SRV9JREVOVF9SRSA9ICdbYS16QS1aX11cXFxcdyonO1xuY29uc3QgTlVNQkVSX1JFID0gJ1xcXFxiXFxcXGQrKFxcXFwuXFxcXGQrKT8nO1xuY29uc3QgQ19OVU1CRVJfUkUgPSAnKC0/KShcXFxcYjBbeFhdW2EtZkEtRjAtOV0rfChcXFxcYlxcXFxkKyhcXFxcLlxcXFxkKik/fFxcXFwuXFxcXGQrKShbZUVdWy0rXT9cXFxcZCspPyknOyAvLyAweC4uLiwgMC4uLiwgZGVjaW1hbCwgZmxvYXRcbmNvbnN0IEJJTkFSWV9OVU1CRVJfUkUgPSAnXFxcXGIoMGJbMDFdKyknOyAvLyAwYi4uLlxuY29uc3QgUkVfU1RBUlRFUlNfUkUgPSAnIXwhPXwhPT18JXwlPXwmfCYmfCY9fFxcXFwqfFxcXFwqPXxcXFxcK3xcXFxcKz18LHwtfC09fC89fC98Onw7fDw8fDw8PXw8PXw8fD09PXw9PXw9fD4+Pj18Pj49fD49fD4+Pnw+Pnw+fFxcXFw/fFxcXFxbfFxcXFx7fFxcXFwofFxcXFxefFxcXFxePXxcXFxcfHxcXFxcfD18XFxcXHxcXFxcfHx+JztcblxuLyoqXG4qIEBwYXJhbSB7IFBhcnRpYWw8TW9kZT4gJiB7YmluYXJ5Pzogc3RyaW5nIHwgUmVnRXhwfSB9IG9wdHNcbiovXG5jb25zdCBTSEVCQU5HID0gKG9wdHMgPSB7fSkgPT4ge1xuICBjb25zdCBiZWdpblNoZWJhbmcgPSAvXiMhWyBdKlxcLy87XG4gIGlmIChvcHRzLmJpbmFyeSkge1xuICAgIG9wdHMuYmVnaW4gPSBjb25jYXQoXG4gICAgICBiZWdpblNoZWJhbmcsXG4gICAgICAvLipcXGIvLFxuICAgICAgb3B0cy5iaW5hcnksXG4gICAgICAvXFxiLiovKTtcbiAgfVxuICByZXR1cm4gaW5oZXJpdCQxKHtcbiAgICBzY29wZTogJ21ldGEnLFxuICAgIGJlZ2luOiBiZWdpblNoZWJhbmcsXG4gICAgZW5kOiAvJC8sXG4gICAgcmVsZXZhbmNlOiAwLFxuICAgIC8qKiBAdHlwZSB7TW9kZUNhbGxiYWNrfSAqL1xuICAgIFwib246YmVnaW5cIjogKG0sIHJlc3ApID0+IHtcbiAgICAgIGlmIChtLmluZGV4ICE9PSAwKSByZXNwLmlnbm9yZU1hdGNoKCk7XG4gICAgfVxuICB9LCBvcHRzKTtcbn07XG5cbi8vIENvbW1vbiBtb2Rlc1xuY29uc3QgQkFDS1NMQVNIX0VTQ0FQRSA9IHtcbiAgYmVnaW46ICdcXFxcXFxcXFtcXFxcc1xcXFxTXScsIHJlbGV2YW5jZTogMFxufTtcbmNvbnN0IEFQT1NfU1RSSU5HX01PREUgPSB7XG4gIHNjb3BlOiAnc3RyaW5nJyxcbiAgYmVnaW46ICdcXCcnLFxuICBlbmQ6ICdcXCcnLFxuICBpbGxlZ2FsOiAnXFxcXG4nLFxuICBjb250YWluczogW0JBQ0tTTEFTSF9FU0NBUEVdXG59O1xuY29uc3QgUVVPVEVfU1RSSU5HX01PREUgPSB7XG4gIHNjb3BlOiAnc3RyaW5nJyxcbiAgYmVnaW46ICdcIicsXG4gIGVuZDogJ1wiJyxcbiAgaWxsZWdhbDogJ1xcXFxuJyxcbiAgY29udGFpbnM6IFtCQUNLU0xBU0hfRVNDQVBFXVxufTtcbmNvbnN0IFBIUkFTQUxfV09SRFNfTU9ERSA9IHtcbiAgYmVnaW46IC9cXGIoYXxhbnx0aGV8YXJlfEknbXxpc24ndHxkb24ndHxkb2Vzbid0fHdvbid0fGJ1dHxqdXN0fHNob3VsZHxwcmV0dHl8c2ltcGx5fGVub3VnaHxnb25uYXxnb2luZ3x3dGZ8c298c3VjaHx3aWxsfHlvdXx5b3VyfHRoZXl8bGlrZXxtb3JlKVxcYi9cbn07XG4vKipcbiAqIENyZWF0ZXMgYSBjb21tZW50IG1vZGVcbiAqXG4gKiBAcGFyYW0ge3N0cmluZyB8IFJlZ0V4cH0gYmVnaW5cbiAqIEBwYXJhbSB7c3RyaW5nIHwgUmVnRXhwfSBlbmRcbiAqIEBwYXJhbSB7TW9kZSB8IHt9fSBbbW9kZU9wdGlvbnNdXG4gKiBAcmV0dXJucyB7UGFydGlhbDxNb2RlPn1cbiAqL1xuY29uc3QgQ09NTUVOVCA9IGZ1bmN0aW9uKGJlZ2luLCBlbmQsIG1vZGVPcHRpb25zID0ge30pIHtcbiAgY29uc3QgbW9kZSA9IGluaGVyaXQkMShcbiAgICB7XG4gICAgICBzY29wZTogJ2NvbW1lbnQnLFxuICAgICAgYmVnaW4sXG4gICAgICBlbmQsXG4gICAgICBjb250YWluczogW11cbiAgICB9LFxuICAgIG1vZGVPcHRpb25zXG4gICk7XG4gIG1vZGUuY29udGFpbnMucHVzaCh7XG4gICAgc2NvcGU6ICdkb2N0YWcnLFxuICAgIC8vIGhhY2sgdG8gYXZvaWQgdGhlIHNwYWNlIGZyb20gYmVpbmcgaW5jbHVkZWQuIHRoZSBzcGFjZSBpcyBuZWNlc3NhcnkgdG9cbiAgICAvLyBtYXRjaCBoZXJlIHRvIHByZXZlbnQgdGhlIHBsYWluIHRleHQgcnVsZSBiZWxvdyBmcm9tIGdvYmJsaW5nIHVwIGRvY3RhZ3NcbiAgICBiZWdpbjogJ1sgXSooPz0oVE9ET3xGSVhNRXxOT1RFfEJVR3xPUFRJTUlaRXxIQUNLfFhYWCk6KScsXG4gICAgZW5kOiAvKFRPRE98RklYTUV8Tk9URXxCVUd8T1BUSU1JWkV8SEFDS3xYWFgpOi8sXG4gICAgZXhjbHVkZUJlZ2luOiB0cnVlLFxuICAgIHJlbGV2YW5jZTogMFxuICB9KTtcbiAgY29uc3QgRU5HTElTSF9XT1JEID0gZWl0aGVyKFxuICAgIC8vIGxpc3Qgb2YgY29tbW9uIDEgYW5kIDIgbGV0dGVyIHdvcmRzIGluIEVuZ2xpc2hcbiAgICBcIklcIixcbiAgICBcImFcIixcbiAgICBcImlzXCIsXG4gICAgXCJzb1wiLFxuICAgIFwidXNcIixcbiAgICBcInRvXCIsXG4gICAgXCJhdFwiLFxuICAgIFwiaWZcIixcbiAgICBcImluXCIsXG4gICAgXCJpdFwiLFxuICAgIFwib25cIixcbiAgICAvLyBub3RlOiB0aGlzIGlzIG5vdCBhbiBleGhhdXN0aXZlIGxpc3Qgb2YgY29udHJhY3Rpb25zLCBqdXN0IHBvcHVsYXIgb25lc1xuICAgIC9bQS1aYS16XStbJ10oZHx2ZXxyZXxsbHx0fHN8bikvLCAvLyBjb250cmFjdGlvbnMgLSBjYW4ndCB3ZSdkIHRoZXkncmUgbGV0J3MsIGV0Y1xuICAgIC9bQS1aYS16XStbLV1bYS16XSsvLCAvLyBgbm8td2F5YCwgZXRjLlxuICAgIC9bQS1aYS16XVthLXpdezIsfS8gLy8gYWxsb3cgY2FwaXRhbGl6ZWQgd29yZHMgYXQgYmVnaW5uaW5nIG9mIHNlbnRlbmNlc1xuICApO1xuICAvLyBsb29raW5nIGxpa2UgcGxhaW4gdGV4dCwgbW9yZSBsaWtlbHkgdG8gYmUgYSBjb21tZW50XG4gIG1vZGUuY29udGFpbnMucHVzaChcbiAgICB7XG4gICAgICAvLyBUT0RPOiBob3cgdG8gaW5jbHVkZSBcIiwgKCwgKSB3aXRob3V0IGJyZWFraW5nIGdyYW1tYXJzIHRoYXQgdXNlIHRoZXNlIGZvclxuICAgICAgLy8gY29tbWVudCBkZWxpbWl0ZXJzP1xuICAgICAgLy8gYmVnaW46IC9bIF0rKFsoKVwiXT8oW0EtWmEteictXXszLH18aXN8YXxJfHNvfHVzfFt0VF1bb09dfGF0fGlmfGlufGl0fG9uKVsuXT9bKClcIjpdPyhbLl1bIF18WyBdfFxcKSkpezN9L1xuICAgICAgLy8gLS0tXG5cbiAgICAgIC8vIHRoaXMgdHJpZXMgdG8gZmluZCBzZXF1ZW5jZXMgb2YgMyBlbmdsaXNoIHdvcmRzIGluIGEgcm93ICh3aXRob3V0IGFueVxuICAgICAgLy8gXCJwcm9ncmFtbWluZ1wiIHR5cGUgc3ludGF4KSB0aGlzIGdpdmVzIHVzIGEgc3Ryb25nIHNpZ25hbCB0aGF0IHdlJ3ZlXG4gICAgICAvLyBUUlVMWSBmb3VuZCBhIGNvbW1lbnQgLSB2cyBwZXJoYXBzIHNjYW5uaW5nIHdpdGggdGhlIHdyb25nIGxhbmd1YWdlLlxuICAgICAgLy8gSXQncyBwb3NzaWJsZSB0byBmaW5kIHNvbWV0aGluZyB0aGF0IExPT0tTIGxpa2UgdGhlIHN0YXJ0IG9mIHRoZVxuICAgICAgLy8gY29tbWVudCAtIGJ1dCB0aGVuIGlmIHRoZXJlIGlzIG5vIHJlYWRhYmxlIHRleHQgLSBnb29kIGNoYW5jZSBpdCBpcyBhXG4gICAgICAvLyBmYWxzZSBtYXRjaCBhbmQgbm90IGEgY29tbWVudC5cbiAgICAgIC8vXG4gICAgICAvLyBmb3IgYSB2aXN1YWwgZXhhbXBsZSBwbGVhc2Ugc2VlOlxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2hpZ2hsaWdodGpzL2hpZ2hsaWdodC5qcy9pc3N1ZXMvMjgyN1xuXG4gICAgICBiZWdpbjogY29uY2F0KFxuICAgICAgICAvWyBdKy8sIC8vIG5lY2Vzc2FyeSB0byBwcmV2ZW50IHVzIGdvYmJsaW5nIHVwIGRvY3RhZ3MgbGlrZSAvKiBAYXV0aG9yIEJvYiBNY2dpbGwgKi9cbiAgICAgICAgJygnLFxuICAgICAgICBFTkdMSVNIX1dPUkQsXG4gICAgICAgIC9bLl0/WzpdPyhbLl1bIF18WyBdKS8sXG4gICAgICAgICcpezN9JykgLy8gbG9vayBmb3IgMyB3b3JkcyBpbiBhIHJvd1xuICAgIH1cbiAgKTtcbiAgcmV0dXJuIG1vZGU7XG59O1xuY29uc3QgQ19MSU5FX0NPTU1FTlRfTU9ERSA9IENPTU1FTlQoJy8vJywgJyQnKTtcbmNvbnN0IENfQkxPQ0tfQ09NTUVOVF9NT0RFID0gQ09NTUVOVCgnL1xcXFwqJywgJ1xcXFwqLycpO1xuY29uc3QgSEFTSF9DT01NRU5UX01PREUgPSBDT01NRU5UKCcjJywgJyQnKTtcbmNvbnN0IE5VTUJFUl9NT0RFID0ge1xuICBzY29wZTogJ251bWJlcicsXG4gIGJlZ2luOiBOVU1CRVJfUkUsXG4gIHJlbGV2YW5jZTogMFxufTtcbmNvbnN0IENfTlVNQkVSX01PREUgPSB7XG4gIHNjb3BlOiAnbnVtYmVyJyxcbiAgYmVnaW46IENfTlVNQkVSX1JFLFxuICByZWxldmFuY2U6IDBcbn07XG5jb25zdCBCSU5BUllfTlVNQkVSX01PREUgPSB7XG4gIHNjb3BlOiAnbnVtYmVyJyxcbiAgYmVnaW46IEJJTkFSWV9OVU1CRVJfUkUsXG4gIHJlbGV2YW5jZTogMFxufTtcbmNvbnN0IFJFR0VYUF9NT0RFID0ge1xuICBzY29wZTogXCJyZWdleHBcIixcbiAgYmVnaW46IC9cXC8oPz1bXi9cXG5dKlxcLykvLFxuICBlbmQ6IC9cXC9bZ2ltdXldKi8sXG4gIGNvbnRhaW5zOiBbXG4gICAgQkFDS1NMQVNIX0VTQ0FQRSxcbiAgICB7XG4gICAgICBiZWdpbjogL1xcWy8sXG4gICAgICBlbmQ6IC9cXF0vLFxuICAgICAgcmVsZXZhbmNlOiAwLFxuICAgICAgY29udGFpbnM6IFtCQUNLU0xBU0hfRVNDQVBFXVxuICAgIH1cbiAgXVxufTtcbmNvbnN0IFRJVExFX01PREUgPSB7XG4gIHNjb3BlOiAndGl0bGUnLFxuICBiZWdpbjogSURFTlRfUkUsXG4gIHJlbGV2YW5jZTogMFxufTtcbmNvbnN0IFVOREVSU0NPUkVfVElUTEVfTU9ERSA9IHtcbiAgc2NvcGU6ICd0aXRsZScsXG4gIGJlZ2luOiBVTkRFUlNDT1JFX0lERU5UX1JFLFxuICByZWxldmFuY2U6IDBcbn07XG5jb25zdCBNRVRIT0RfR1VBUkQgPSB7XG4gIC8vIGV4Y2x1ZGVzIG1ldGhvZCBuYW1lcyBmcm9tIGtleXdvcmQgcHJvY2Vzc2luZ1xuICBiZWdpbjogJ1xcXFwuXFxcXHMqJyArIFVOREVSU0NPUkVfSURFTlRfUkUsXG4gIHJlbGV2YW5jZTogMFxufTtcblxuLyoqXG4gKiBBZGRzIGVuZCBzYW1lIGFzIGJlZ2luIG1lY2hhbmljcyB0byBhIG1vZGVcbiAqXG4gKiBZb3VyIG1vZGUgbXVzdCBpbmNsdWRlIGF0IGxlYXN0IGEgc2luZ2xlICgpIG1hdGNoIGdyb3VwIGFzIHRoYXQgZmlyc3QgbWF0Y2hcbiAqIGdyb3VwIGlzIHdoYXQgaXMgdXNlZCBmb3IgY29tcGFyaXNvblxuICogQHBhcmFtIHtQYXJ0aWFsPE1vZGU+fSBtb2RlXG4gKi9cbmNvbnN0IEVORF9TQU1FX0FTX0JFR0lOID0gZnVuY3Rpb24obW9kZSkge1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbihtb2RlLFxuICAgIHtcbiAgICAgIC8qKiBAdHlwZSB7TW9kZUNhbGxiYWNrfSAqL1xuICAgICAgJ29uOmJlZ2luJzogKG0sIHJlc3ApID0+IHsgcmVzcC5kYXRhLl9iZWdpbk1hdGNoID0gbVsxXTsgfSxcbiAgICAgIC8qKiBAdHlwZSB7TW9kZUNhbGxiYWNrfSAqL1xuICAgICAgJ29uOmVuZCc6IChtLCByZXNwKSA9PiB7IGlmIChyZXNwLmRhdGEuX2JlZ2luTWF0Y2ggIT09IG1bMV0pIHJlc3AuaWdub3JlTWF0Y2goKTsgfVxuICAgIH0pO1xufTtcblxudmFyIE1PREVTID0gLyojX19QVVJFX18qL09iamVjdC5mcmVlemUoe1xuICBfX3Byb3RvX186IG51bGwsXG4gIEFQT1NfU1RSSU5HX01PREU6IEFQT1NfU1RSSU5HX01PREUsXG4gIEJBQ0tTTEFTSF9FU0NBUEU6IEJBQ0tTTEFTSF9FU0NBUEUsXG4gIEJJTkFSWV9OVU1CRVJfTU9ERTogQklOQVJZX05VTUJFUl9NT0RFLFxuICBCSU5BUllfTlVNQkVSX1JFOiBCSU5BUllfTlVNQkVSX1JFLFxuICBDT01NRU5UOiBDT01NRU5ULFxuICBDX0JMT0NLX0NPTU1FTlRfTU9ERTogQ19CTE9DS19DT01NRU5UX01PREUsXG4gIENfTElORV9DT01NRU5UX01PREU6IENfTElORV9DT01NRU5UX01PREUsXG4gIENfTlVNQkVSX01PREU6IENfTlVNQkVSX01PREUsXG4gIENfTlVNQkVSX1JFOiBDX05VTUJFUl9SRSxcbiAgRU5EX1NBTUVfQVNfQkVHSU46IEVORF9TQU1FX0FTX0JFR0lOLFxuICBIQVNIX0NPTU1FTlRfTU9ERTogSEFTSF9DT01NRU5UX01PREUsXG4gIElERU5UX1JFOiBJREVOVF9SRSxcbiAgTUFUQ0hfTk9USElOR19SRTogTUFUQ0hfTk9USElOR19SRSxcbiAgTUVUSE9EX0dVQVJEOiBNRVRIT0RfR1VBUkQsXG4gIE5VTUJFUl9NT0RFOiBOVU1CRVJfTU9ERSxcbiAgTlVNQkVSX1JFOiBOVU1CRVJfUkUsXG4gIFBIUkFTQUxfV09SRFNfTU9ERTogUEhSQVNBTF9XT1JEU19NT0RFLFxuICBRVU9URV9TVFJJTkdfTU9ERTogUVVPVEVfU1RSSU5HX01PREUsXG4gIFJFR0VYUF9NT0RFOiBSRUdFWFBfTU9ERSxcbiAgUkVfU1RBUlRFUlNfUkU6IFJFX1NUQVJURVJTX1JFLFxuICBTSEVCQU5HOiBTSEVCQU5HLFxuICBUSVRMRV9NT0RFOiBUSVRMRV9NT0RFLFxuICBVTkRFUlNDT1JFX0lERU5UX1JFOiBVTkRFUlNDT1JFX0lERU5UX1JFLFxuICBVTkRFUlNDT1JFX1RJVExFX01PREU6IFVOREVSU0NPUkVfVElUTEVfTU9ERVxufSk7XG5cbi8qKlxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQ2FsbGJhY2tSZXNwb25zZX0gQ2FsbGJhY2tSZXNwb25zZVxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQ29tcGlsZXJFeHR9IENvbXBpbGVyRXh0XG4qL1xuXG4vLyBHcmFtbWFyIGV4dGVuc2lvbnMgLyBwbHVnaW5zXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9oaWdobGlnaHRqcy9oaWdobGlnaHQuanMvaXNzdWVzLzI4MzNcblxuLy8gR3JhbW1hciBleHRlbnNpb25zIGFsbG93IFwic3ludGFjdGljIHN1Z2FyXCIgdG8gYmUgYWRkZWQgdG8gdGhlIGdyYW1tYXIgbW9kZXNcbi8vIHdpdGhvdXQgcmVxdWlyaW5nIGFueSB1bmRlcmx5aW5nIGNoYW5nZXMgdG8gdGhlIGNvbXBpbGVyIGludGVybmFscy5cblxuLy8gYGNvbXBpbGVNYXRjaGAgYmVpbmcgdGhlIHBlcmZlY3Qgc21hbGwgZXhhbXBsZSBvZiBub3cgYWxsb3dpbmcgYSBncmFtbWFyXG4vLyBhdXRob3IgdG8gd3JpdGUgYG1hdGNoYCB3aGVuIHRoZXkgZGVzaXJlIHRvIG1hdGNoIGEgc2luZ2xlIGV4cHJlc3Npb24gcmF0aGVyXG4vLyB0aGFuIGJlaW5nIGZvcmNlZCB0byB1c2UgYGJlZ2luYC4gIFRoZSBleHRlbnNpb24gdGhlbiBqdXN0IG1vdmVzIGBtYXRjaGAgaW50b1xuLy8gYGJlZ2luYCB3aGVuIGl0IHJ1bnMuICBJZSwgbm8gZmVhdHVyZXMgaGF2ZSBiZWVuIGFkZGVkLCBidXQgd2UndmUganVzdCBtYWRlXG4vLyB0aGUgZXhwZXJpZW5jZSBvZiB3cml0aW5nIChhbmQgcmVhZGluZyBncmFtbWFycykgYSBsaXR0bGUgYml0IG5pY2VyLlxuXG4vLyAtLS0tLS1cblxuLy8gVE9ETzogV2UgbmVlZCBuZWdhdGl2ZSBsb29rLWJlaGluZCBzdXBwb3J0IHRvIGRvIHRoaXMgcHJvcGVybHlcbi8qKlxuICogU2tpcCBhIG1hdGNoIGlmIGl0IGhhcyBhIHByZWNlZGluZyBkb3RcbiAqXG4gKiBUaGlzIGlzIHVzZWQgZm9yIGBiZWdpbktleXdvcmRzYCB0byBwcmV2ZW50IG1hdGNoaW5nIGV4cHJlc3Npb25zIHN1Y2ggYXNcbiAqIGBib2Iua2V5d29yZC5kbygpYC4gVGhlIG1vZGUgY29tcGlsZXIgYXV0b21hdGljYWxseSB3aXJlcyB0aGlzIHVwIGFzIGFcbiAqIHNwZWNpYWwgX2ludGVybmFsXyAnb246YmVnaW4nIGNhbGxiYWNrIGZvciBtb2RlcyB3aXRoIGBiZWdpbktleXdvcmRzYFxuICogQHBhcmFtIHtSZWdFeHBNYXRjaEFycmF5fSBtYXRjaFxuICogQHBhcmFtIHtDYWxsYmFja1Jlc3BvbnNlfSByZXNwb25zZVxuICovXG5mdW5jdGlvbiBza2lwSWZIYXNQcmVjZWRpbmdEb3QobWF0Y2gsIHJlc3BvbnNlKSB7XG4gIGNvbnN0IGJlZm9yZSA9IG1hdGNoLmlucHV0W21hdGNoLmluZGV4IC0gMV07XG4gIGlmIChiZWZvcmUgPT09IFwiLlwiKSB7XG4gICAgcmVzcG9uc2UuaWdub3JlTWF0Y2goKTtcbiAgfVxufVxuXG4vKipcbiAqXG4gKiBAdHlwZSB7Q29tcGlsZXJFeHR9XG4gKi9cbmZ1bmN0aW9uIHNjb3BlQ2xhc3NOYW1lKG1vZGUsIF9wYXJlbnQpIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmaW5lZFxuICBpZiAobW9kZS5jbGFzc05hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgIG1vZGUuc2NvcGUgPSBtb2RlLmNsYXNzTmFtZTtcbiAgICBkZWxldGUgbW9kZS5jbGFzc05hbWU7XG4gIH1cbn1cblxuLyoqXG4gKiBgYmVnaW5LZXl3b3Jkc2Agc3ludGFjdGljIHN1Z2FyXG4gKiBAdHlwZSB7Q29tcGlsZXJFeHR9XG4gKi9cbmZ1bmN0aW9uIGJlZ2luS2V5d29yZHMobW9kZSwgcGFyZW50KSB7XG4gIGlmICghcGFyZW50KSByZXR1cm47XG4gIGlmICghbW9kZS5iZWdpbktleXdvcmRzKSByZXR1cm47XG5cbiAgLy8gZm9yIGxhbmd1YWdlcyB3aXRoIGtleXdvcmRzIHRoYXQgaW5jbHVkZSBub24td29yZCBjaGFyYWN0ZXJzIGNoZWNraW5nIGZvclxuICAvLyBhIHdvcmQgYm91bmRhcnkgaXMgbm90IHN1ZmZpY2llbnQsIHNvIGluc3RlYWQgd2UgY2hlY2sgZm9yIGEgd29yZCBib3VuZGFyeVxuICAvLyBvciB3aGl0ZXNwYWNlIC0gdGhpcyBkb2VzIG5vIGhhcm0gaW4gYW55IGNhc2Ugc2luY2Ugb3VyIGtleXdvcmQgZW5naW5lXG4gIC8vIGRvZXNuJ3QgYWxsb3cgc3BhY2VzIGluIGtleXdvcmRzIGFueXdheXMgYW5kIHdlIHN0aWxsIGNoZWNrIGZvciB0aGUgYm91bmRhcnlcbiAgLy8gZmlyc3RcbiAgbW9kZS5iZWdpbiA9ICdcXFxcYignICsgbW9kZS5iZWdpbktleXdvcmRzLnNwbGl0KCcgJykuam9pbignfCcpICsgJykoPyFcXFxcLikoPz1cXFxcYnxcXFxccyknO1xuICBtb2RlLl9fYmVmb3JlQmVnaW4gPSBza2lwSWZIYXNQcmVjZWRpbmdEb3Q7XG4gIG1vZGUua2V5d29yZHMgPSBtb2RlLmtleXdvcmRzIHx8IG1vZGUuYmVnaW5LZXl3b3JkcztcbiAgZGVsZXRlIG1vZGUuYmVnaW5LZXl3b3JkcztcblxuICAvLyBwcmV2ZW50cyBkb3VibGUgcmVsZXZhbmNlLCB0aGUga2V5d29yZHMgdGhlbXNlbHZlcyBwcm92aWRlXG4gIC8vIHJlbGV2YW5jZSwgdGhlIG1vZGUgZG9lc24ndCBuZWVkIHRvIGRvdWJsZSBpdFxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZpbmVkXG4gIGlmIChtb2RlLnJlbGV2YW5jZSA9PT0gdW5kZWZpbmVkKSBtb2RlLnJlbGV2YW5jZSA9IDA7XG59XG5cbi8qKlxuICogQWxsb3cgYGlsbGVnYWxgIHRvIGNvbnRhaW4gYW4gYXJyYXkgb2YgaWxsZWdhbCB2YWx1ZXNcbiAqIEB0eXBlIHtDb21waWxlckV4dH1cbiAqL1xuZnVuY3Rpb24gY29tcGlsZUlsbGVnYWwobW9kZSwgX3BhcmVudCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobW9kZS5pbGxlZ2FsKSkgcmV0dXJuO1xuXG4gIG1vZGUuaWxsZWdhbCA9IGVpdGhlciguLi5tb2RlLmlsbGVnYWwpO1xufVxuXG4vKipcbiAqIGBtYXRjaGAgdG8gbWF0Y2ggYSBzaW5nbGUgZXhwcmVzc2lvbiBmb3IgcmVhZGFiaWxpdHlcbiAqIEB0eXBlIHtDb21waWxlckV4dH1cbiAqL1xuZnVuY3Rpb24gY29tcGlsZU1hdGNoKG1vZGUsIF9wYXJlbnQpIHtcbiAgaWYgKCFtb2RlLm1hdGNoKSByZXR1cm47XG4gIGlmIChtb2RlLmJlZ2luIHx8IG1vZGUuZW5kKSB0aHJvdyBuZXcgRXJyb3IoXCJiZWdpbiAmIGVuZCBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIG1hdGNoXCIpO1xuXG4gIG1vZGUuYmVnaW4gPSBtb2RlLm1hdGNoO1xuICBkZWxldGUgbW9kZS5tYXRjaDtcbn1cblxuLyoqXG4gKiBwcm92aWRlcyB0aGUgZGVmYXVsdCAxIHJlbGV2YW5jZSB0byBhbGwgbW9kZXNcbiAqIEB0eXBlIHtDb21waWxlckV4dH1cbiAqL1xuZnVuY3Rpb24gY29tcGlsZVJlbGV2YW5jZShtb2RlLCBfcGFyZW50KSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZmluZWRcbiAgaWYgKG1vZGUucmVsZXZhbmNlID09PSB1bmRlZmluZWQpIG1vZGUucmVsZXZhbmNlID0gMTtcbn1cblxuLy8gYWxsb3cgYmVmb3JlTWF0Y2ggdG8gYWN0IGFzIGEgXCJxdWFsaWZpZXJcIiBmb3IgdGhlIG1hdGNoXG4vLyB0aGUgZnVsbCBtYXRjaCBiZWdpbiBtdXN0IGJlIFtiZWZvcmVNYXRjaF1bYmVnaW5dXG5jb25zdCBiZWZvcmVNYXRjaEV4dCA9IChtb2RlLCBwYXJlbnQpID0+IHtcbiAgaWYgKCFtb2RlLmJlZm9yZU1hdGNoKSByZXR1cm47XG4gIC8vIHN0YXJ0cyBjb25mbGljdHMgd2l0aCBlbmRzUGFyZW50IHdoaWNoIHdlIG5lZWQgdG8gbWFrZSBzdXJlIHRoZSBjaGlsZFxuICAvLyBydWxlIGlzIG5vdCBtYXRjaGVkIG11bHRpcGxlIHRpbWVzXG4gIGlmIChtb2RlLnN0YXJ0cykgdGhyb3cgbmV3IEVycm9yKFwiYmVmb3JlTWF0Y2ggY2Fubm90IGJlIHVzZWQgd2l0aCBzdGFydHNcIik7XG5cbiAgY29uc3Qgb3JpZ2luYWxNb2RlID0gT2JqZWN0LmFzc2lnbih7fSwgbW9kZSk7XG4gIE9iamVjdC5rZXlzKG1vZGUpLmZvckVhY2goKGtleSkgPT4geyBkZWxldGUgbW9kZVtrZXldOyB9KTtcblxuICBtb2RlLmtleXdvcmRzID0gb3JpZ2luYWxNb2RlLmtleXdvcmRzO1xuICBtb2RlLmJlZ2luID0gY29uY2F0KG9yaWdpbmFsTW9kZS5iZWZvcmVNYXRjaCwgbG9va2FoZWFkKG9yaWdpbmFsTW9kZS5iZWdpbikpO1xuICBtb2RlLnN0YXJ0cyA9IHtcbiAgICByZWxldmFuY2U6IDAsXG4gICAgY29udGFpbnM6IFtcbiAgICAgIE9iamVjdC5hc3NpZ24ob3JpZ2luYWxNb2RlLCB7IGVuZHNQYXJlbnQ6IHRydWUgfSlcbiAgICBdXG4gIH07XG4gIG1vZGUucmVsZXZhbmNlID0gMDtcblxuICBkZWxldGUgb3JpZ2luYWxNb2RlLmJlZm9yZU1hdGNoO1xufTtcblxuLy8ga2V5d29yZHMgdGhhdCBzaG91bGQgaGF2ZSBubyBkZWZhdWx0IHJlbGV2YW5jZSB2YWx1ZVxuY29uc3QgQ09NTU9OX0tFWVdPUkRTID0gW1xuICAnb2YnLFxuICAnYW5kJyxcbiAgJ2ZvcicsXG4gICdpbicsXG4gICdub3QnLFxuICAnb3InLFxuICAnaWYnLFxuICAndGhlbicsXG4gICdwYXJlbnQnLCAvLyBjb21tb24gdmFyaWFibGUgbmFtZVxuICAnbGlzdCcsIC8vIGNvbW1vbiB2YXJpYWJsZSBuYW1lXG4gICd2YWx1ZScgLy8gY29tbW9uIHZhcmlhYmxlIG5hbWVcbl07XG5cbmNvbnN0IERFRkFVTFRfS0VZV09SRF9TQ09QRSA9IFwia2V5d29yZFwiO1xuXG4vKipcbiAqIEdpdmVuIHJhdyBrZXl3b3JkcyBmcm9tIGEgbGFuZ3VhZ2UgZGVmaW5pdGlvbiwgY29tcGlsZSB0aGVtLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nIHwgUmVjb3JkPHN0cmluZyxzdHJpbmd8c3RyaW5nW10+IHwgQXJyYXk8c3RyaW5nPn0gcmF3S2V5d29yZHNcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gY2FzZUluc2Vuc2l0aXZlXG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGVLZXl3b3JkcyhyYXdLZXl3b3JkcywgY2FzZUluc2Vuc2l0aXZlLCBzY29wZU5hbWUgPSBERUZBVUxUX0tFWVdPUkRfU0NPUEUpIHtcbiAgLyoqIEB0eXBlIHtpbXBvcnQoXCJoaWdobGlnaHQuanMvcHJpdmF0ZVwiKS5LZXl3b3JkRGljdH0gKi9cbiAgY29uc3QgY29tcGlsZWRLZXl3b3JkcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgLy8gaW5wdXQgY2FuIGJlIGEgc3RyaW5nIG9mIGtleXdvcmRzLCBhbiBhcnJheSBvZiBrZXl3b3Jkcywgb3IgYSBvYmplY3Qgd2l0aFxuICAvLyBuYW1lZCBrZXlzIHJlcHJlc2VudGluZyBzY29wZU5hbWUgKHdoaWNoIGNhbiB0aGVuIHBvaW50IHRvIGEgc3RyaW5nIG9yIGFycmF5KVxuICBpZiAodHlwZW9mIHJhd0tleXdvcmRzID09PSAnc3RyaW5nJykge1xuICAgIGNvbXBpbGVMaXN0KHNjb3BlTmFtZSwgcmF3S2V5d29yZHMuc3BsaXQoXCIgXCIpKTtcbiAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHJhd0tleXdvcmRzKSkge1xuICAgIGNvbXBpbGVMaXN0KHNjb3BlTmFtZSwgcmF3S2V5d29yZHMpO1xuICB9IGVsc2Uge1xuICAgIE9iamVjdC5rZXlzKHJhd0tleXdvcmRzKS5mb3JFYWNoKGZ1bmN0aW9uKHNjb3BlTmFtZSkge1xuICAgICAgLy8gY29sbGFwc2UgYWxsIG91ciBvYmplY3RzIGJhY2sgaW50byB0aGUgcGFyZW50IG9iamVjdFxuICAgICAgT2JqZWN0LmFzc2lnbihcbiAgICAgICAgY29tcGlsZWRLZXl3b3JkcyxcbiAgICAgICAgY29tcGlsZUtleXdvcmRzKHJhd0tleXdvcmRzW3Njb3BlTmFtZV0sIGNhc2VJbnNlbnNpdGl2ZSwgc2NvcGVOYW1lKVxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gY29tcGlsZWRLZXl3b3JkcztcblxuICAvLyAtLS1cblxuICAvKipcbiAgICogQ29tcGlsZXMgYW4gaW5kaXZpZHVhbCBsaXN0IG9mIGtleXdvcmRzXG4gICAqXG4gICAqIEV4OiBcImZvciBpZiB3aGVuIHdoaWxlfDVcIlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2NvcGVOYW1lXG4gICAqIEBwYXJhbSB7QXJyYXk8c3RyaW5nPn0ga2V5d29yZExpc3RcbiAgICovXG4gIGZ1bmN0aW9uIGNvbXBpbGVMaXN0KHNjb3BlTmFtZSwga2V5d29yZExpc3QpIHtcbiAgICBpZiAoY2FzZUluc2Vuc2l0aXZlKSB7XG4gICAgICBrZXl3b3JkTGlzdCA9IGtleXdvcmRMaXN0Lm1hcCh4ID0+IHgudG9Mb3dlckNhc2UoKSk7XG4gICAgfVxuICAgIGtleXdvcmRMaXN0LmZvckVhY2goZnVuY3Rpb24oa2V5d29yZCkge1xuICAgICAgY29uc3QgcGFpciA9IGtleXdvcmQuc3BsaXQoJ3wnKTtcbiAgICAgIGNvbXBpbGVkS2V5d29yZHNbcGFpclswXV0gPSBbc2NvcGVOYW1lLCBzY29yZUZvcktleXdvcmQocGFpclswXSwgcGFpclsxXSldO1xuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgcHJvcGVyIHNjb3JlIGZvciBhIGdpdmVuIGtleXdvcmRcbiAqXG4gKiBBbHNvIHRha2VzIGludG8gYWNjb3VudCBjb21tZW50IGtleXdvcmRzLCB3aGljaCB3aWxsIGJlIHNjb3JlZCAwIFVOTEVTU1xuICogYW5vdGhlciBzY29yZSBoYXMgYmVlbiBtYW51YWxseSBhc3NpZ25lZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXl3b3JkXG4gKiBAcGFyYW0ge3N0cmluZ30gW3Byb3ZpZGVkU2NvcmVdXG4gKi9cbmZ1bmN0aW9uIHNjb3JlRm9yS2V5d29yZChrZXl3b3JkLCBwcm92aWRlZFNjb3JlKSB7XG4gIC8vIG1hbnVhbCBzY29yZXMgYWx3YXlzIHdpbiBvdmVyIGNvbW1vbiBrZXl3b3Jkc1xuICAvLyBzbyB5b3UgY2FuIGZvcmNlIGEgc2NvcmUgb2YgMSBpZiB5b3UgcmVhbGx5IGluc2lzdFxuICBpZiAocHJvdmlkZWRTY29yZSkge1xuICAgIHJldHVybiBOdW1iZXIocHJvdmlkZWRTY29yZSk7XG4gIH1cblxuICByZXR1cm4gY29tbW9uS2V5d29yZChrZXl3b3JkKSA/IDAgOiAxO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgYSBnaXZlbiBrZXl3b3JkIGlzIGNvbW1vbiBvciBub3RcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5d29yZCAqL1xuZnVuY3Rpb24gY29tbW9uS2V5d29yZChrZXl3b3JkKSB7XG4gIHJldHVybiBDT01NT05fS0VZV09SRFMuaW5jbHVkZXMoa2V5d29yZC50b0xvd2VyQ2FzZSgpKTtcbn1cblxuLypcblxuRm9yIHRoZSByZWFzb25pbmcgYmVoaW5kIHRoaXMgcGxlYXNlIHNlZTpcbmh0dHBzOi8vZ2l0aHViLmNvbS9oaWdobGlnaHRqcy9oaWdobGlnaHQuanMvaXNzdWVzLzI4ODAjaXNzdWVjb21tZW50LTc0NzI3NTQxOVxuXG4qL1xuXG4vKipcbiAqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCBib29sZWFuPn1cbiAqL1xuY29uc3Qgc2VlbkRlcHJlY2F0aW9ucyA9IHt9O1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gKi9cbmNvbnN0IGVycm9yID0gKG1lc3NhZ2UpID0+IHtcbiAgY29uc29sZS5lcnJvcihtZXNzYWdlKTtcbn07XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAqIEBwYXJhbSB7YW55fSBhcmdzXG4gKi9cbmNvbnN0IHdhcm4gPSAobWVzc2FnZSwgLi4uYXJncykgPT4ge1xuICBjb25zb2xlLmxvZyhgV0FSTjogJHttZXNzYWdlfWAsIC4uLmFyZ3MpO1xufTtcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmVyc2lvblxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAqL1xuY29uc3QgZGVwcmVjYXRlZCA9ICh2ZXJzaW9uLCBtZXNzYWdlKSA9PiB7XG4gIGlmIChzZWVuRGVwcmVjYXRpb25zW2Ake3ZlcnNpb259LyR7bWVzc2FnZX1gXSkgcmV0dXJuO1xuXG4gIGNvbnNvbGUubG9nKGBEZXByZWNhdGVkIGFzIG9mICR7dmVyc2lvbn0uICR7bWVzc2FnZX1gKTtcbiAgc2VlbkRlcHJlY2F0aW9uc1tgJHt2ZXJzaW9ufS8ke21lc3NhZ2V9YF0gPSB0cnVlO1xufTtcblxuLyogZXNsaW50LWRpc2FibGUgbm8tdGhyb3ctbGl0ZXJhbCAqL1xuXG4vKipcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLkNvbXBpbGVkTW9kZX0gQ29tcGlsZWRNb2RlXG4qL1xuXG5jb25zdCBNdWx0aUNsYXNzRXJyb3IgPSBuZXcgRXJyb3IoKTtcblxuLyoqXG4gKiBSZW51bWJlcnMgbGFiZWxlZCBzY29wZSBuYW1lcyB0byBhY2NvdW50IGZvciBhZGRpdGlvbmFsIGlubmVyIG1hdGNoXG4gKiBncm91cHMgdGhhdCBvdGhlcndpc2Ugd291bGQgYnJlYWsgZXZlcnl0aGluZy5cbiAqXG4gKiBMZXRzIHNheSB3ZSAzIG1hdGNoIHNjb3BlczpcbiAqXG4gKiAgIHsgMSA9PiAuLi4sIDIgPT4gLi4uLCAzID0+IC4uLiB9XG4gKlxuICogU28gd2hhdCB3ZSBuZWVkIGlzIGEgY2xlYW4gbWF0Y2ggbGlrZSB0aGlzOlxuICpcbiAqICAgKGEpKGIpKGMpID0+IFsgXCJhXCIsIFwiYlwiLCBcImNcIiBdXG4gKlxuICogQnV0IHRoaXMgZmFsbHMgYXBhcnQgd2l0aCBpbm5lciBtYXRjaCBncm91cHM6XG4gKlxuICogKGEpKCgoYikpKShjKSA9PiBbXCJhXCIsIFwiYlwiLCBcImJcIiwgXCJiXCIsIFwiY1wiIF1cbiAqXG4gKiBPdXIgc2NvcGVzIGFyZSBub3cgXCJvdXQgb2YgYWxpZ25tZW50XCIgYW5kIHdlJ3JlIHJlcGVhdGluZyBgYmAgMyB0aW1lcy5cbiAqIFdoYXQgbmVlZHMgdG8gaGFwcGVuIGlzIHRoZSBudW1iZXJzIGFyZSByZW1hcHBlZDpcbiAqXG4gKiAgIHsgMSA9PiAuLi4sIDIgPT4gLi4uLCA1ID0+IC4uLiB9XG4gKlxuICogV2UgYWxzbyBuZWVkIHRvIGtub3cgdGhhdCB0aGUgT05MWSBncm91cHMgdGhhdCBzaG91bGQgYmUgb3V0cHV0XG4gKiBhcmUgMSwgMiwgYW5kIDUuICBUaGlzIGZ1bmN0aW9uIGhhbmRsZXMgdGhpcyBiZWhhdmlvci5cbiAqXG4gKiBAcGFyYW0ge0NvbXBpbGVkTW9kZX0gbW9kZVxuICogQHBhcmFtIHtBcnJheTxSZWdFeHAgfCBzdHJpbmc+fSByZWdleGVzXG4gKiBAcGFyYW0ge3trZXk6IFwiYmVnaW5TY29wZVwifFwiZW5kU2NvcGVcIn19IG9wdHNcbiAqL1xuZnVuY3Rpb24gcmVtYXBTY29wZU5hbWVzKG1vZGUsIHJlZ2V4ZXMsIHsga2V5IH0pIHtcbiAgbGV0IG9mZnNldCA9IDA7XG4gIGNvbnN0IHNjb3BlTmFtZXMgPSBtb2RlW2tleV07XG4gIC8qKiBAdHlwZSBSZWNvcmQ8bnVtYmVyLGJvb2xlYW4+ICovXG4gIGNvbnN0IGVtaXQgPSB7fTtcbiAgLyoqIEB0eXBlIFJlY29yZDxudW1iZXIsc3RyaW5nPiAqL1xuICBjb25zdCBwb3NpdGlvbnMgPSB7fTtcblxuICBmb3IgKGxldCBpID0gMTsgaSA8PSByZWdleGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgcG9zaXRpb25zW2kgKyBvZmZzZXRdID0gc2NvcGVOYW1lc1tpXTtcbiAgICBlbWl0W2kgKyBvZmZzZXRdID0gdHJ1ZTtcbiAgICBvZmZzZXQgKz0gY291bnRNYXRjaEdyb3VwcyhyZWdleGVzW2kgLSAxXSk7XG4gIH1cbiAgLy8gd2UgdXNlIF9lbWl0IHRvIGtlZXAgdHJhY2sgb2Ygd2hpY2ggbWF0Y2ggZ3JvdXBzIGFyZSBcInRvcC1sZXZlbFwiIHRvIGF2b2lkIGRvdWJsZVxuICAvLyBvdXRwdXQgZnJvbSBpbnNpZGUgbWF0Y2ggZ3JvdXBzXG4gIG1vZGVba2V5XSA9IHBvc2l0aW9ucztcbiAgbW9kZVtrZXldLl9lbWl0ID0gZW1pdDtcbiAgbW9kZVtrZXldLl9tdWx0aSA9IHRydWU7XG59XG5cbi8qKlxuICogQHBhcmFtIHtDb21waWxlZE1vZGV9IG1vZGVcbiAqL1xuZnVuY3Rpb24gYmVnaW5NdWx0aUNsYXNzKG1vZGUpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KG1vZGUuYmVnaW4pKSByZXR1cm47XG5cbiAgaWYgKG1vZGUuc2tpcCB8fCBtb2RlLmV4Y2x1ZGVCZWdpbiB8fCBtb2RlLnJldHVybkJlZ2luKSB7XG4gICAgZXJyb3IoXCJza2lwLCBleGNsdWRlQmVnaW4sIHJldHVybkJlZ2luIG5vdCBjb21wYXRpYmxlIHdpdGggYmVnaW5TY29wZToge31cIik7XG4gICAgdGhyb3cgTXVsdGlDbGFzc0Vycm9yO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBtb2RlLmJlZ2luU2NvcGUgIT09IFwib2JqZWN0XCIgfHwgbW9kZS5iZWdpblNjb3BlID09PSBudWxsKSB7XG4gICAgZXJyb3IoXCJiZWdpblNjb3BlIG11c3QgYmUgb2JqZWN0XCIpO1xuICAgIHRocm93IE11bHRpQ2xhc3NFcnJvcjtcbiAgfVxuXG4gIHJlbWFwU2NvcGVOYW1lcyhtb2RlLCBtb2RlLmJlZ2luLCB7IGtleTogXCJiZWdpblNjb3BlXCIgfSk7XG4gIG1vZGUuYmVnaW4gPSBfcmV3cml0ZUJhY2tyZWZlcmVuY2VzKG1vZGUuYmVnaW4sIHsgam9pbldpdGg6IFwiXCIgfSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtDb21waWxlZE1vZGV9IG1vZGVcbiAqL1xuZnVuY3Rpb24gZW5kTXVsdGlDbGFzcyhtb2RlKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShtb2RlLmVuZCkpIHJldHVybjtcblxuICBpZiAobW9kZS5za2lwIHx8IG1vZGUuZXhjbHVkZUVuZCB8fCBtb2RlLnJldHVybkVuZCkge1xuICAgIGVycm9yKFwic2tpcCwgZXhjbHVkZUVuZCwgcmV0dXJuRW5kIG5vdCBjb21wYXRpYmxlIHdpdGggZW5kU2NvcGU6IHt9XCIpO1xuICAgIHRocm93IE11bHRpQ2xhc3NFcnJvcjtcbiAgfVxuXG4gIGlmICh0eXBlb2YgbW9kZS5lbmRTY29wZSAhPT0gXCJvYmplY3RcIiB8fCBtb2RlLmVuZFNjb3BlID09PSBudWxsKSB7XG4gICAgZXJyb3IoXCJlbmRTY29wZSBtdXN0IGJlIG9iamVjdFwiKTtcbiAgICB0aHJvdyBNdWx0aUNsYXNzRXJyb3I7XG4gIH1cblxuICByZW1hcFNjb3BlTmFtZXMobW9kZSwgbW9kZS5lbmQsIHsga2V5OiBcImVuZFNjb3BlXCIgfSk7XG4gIG1vZGUuZW5kID0gX3Jld3JpdGVCYWNrcmVmZXJlbmNlcyhtb2RlLmVuZCwgeyBqb2luV2l0aDogXCJcIiB9KTtcbn1cblxuLyoqXG4gKiB0aGlzIGV4aXN0cyBvbmx5IHRvIGFsbG93IGBzY29wZToge31gIHRvIGJlIHVzZWQgYmVzaWRlIGBtYXRjaDpgXG4gKiBPdGhlcndpc2UgYGJlZ2luU2NvcGVgIHdvdWxkIG5lY2Vzc2FyeSBhbmQgdGhhdCB3b3VsZCBsb29rIHdlaXJkXG5cbiAge1xuICAgIG1hdGNoOiBbIC9kZWYvLCAvXFx3Ky8gXVxuICAgIHNjb3BlOiB7IDE6IFwia2V5d29yZFwiICwgMjogXCJ0aXRsZVwiIH1cbiAgfVxuXG4gKiBAcGFyYW0ge0NvbXBpbGVkTW9kZX0gbW9kZVxuICovXG5mdW5jdGlvbiBzY29wZVN1Z2FyKG1vZGUpIHtcbiAgaWYgKG1vZGUuc2NvcGUgJiYgdHlwZW9mIG1vZGUuc2NvcGUgPT09IFwib2JqZWN0XCIgJiYgbW9kZS5zY29wZSAhPT0gbnVsbCkge1xuICAgIG1vZGUuYmVnaW5TY29wZSA9IG1vZGUuc2NvcGU7XG4gICAgZGVsZXRlIG1vZGUuc2NvcGU7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0NvbXBpbGVkTW9kZX0gbW9kZVxuICovXG5mdW5jdGlvbiBNdWx0aUNsYXNzKG1vZGUpIHtcbiAgc2NvcGVTdWdhcihtb2RlKTtcblxuICBpZiAodHlwZW9mIG1vZGUuYmVnaW5TY29wZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIG1vZGUuYmVnaW5TY29wZSA9IHsgX3dyYXA6IG1vZGUuYmVnaW5TY29wZSB9O1xuICB9XG4gIGlmICh0eXBlb2YgbW9kZS5lbmRTY29wZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIG1vZGUuZW5kU2NvcGUgPSB7IF93cmFwOiBtb2RlLmVuZFNjb3BlIH07XG4gIH1cblxuICBiZWdpbk11bHRpQ2xhc3MobW9kZSk7XG4gIGVuZE11bHRpQ2xhc3MobW9kZSk7XG59XG5cbi8qKlxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuTW9kZX0gTW9kZVxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQ29tcGlsZWRNb2RlfSBDb21waWxlZE1vZGVcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLkxhbmd1YWdlfSBMYW5ndWFnZVxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuSExKU1BsdWdpbn0gSExKU1BsdWdpblxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQ29tcGlsZWRMYW5ndWFnZX0gQ29tcGlsZWRMYW5ndWFnZVxuKi9cblxuLy8gY29tcGlsYXRpb25cblxuLyoqXG4gKiBDb21waWxlcyBhIGxhbmd1YWdlIGRlZmluaXRpb24gcmVzdWx0XG4gKlxuICogR2l2ZW4gdGhlIHJhdyByZXN1bHQgb2YgYSBsYW5ndWFnZSBkZWZpbml0aW9uIChMYW5ndWFnZSksIGNvbXBpbGVzIHRoaXMgc29cbiAqIHRoYXQgaXQgaXMgcmVhZHkgZm9yIGhpZ2hsaWdodGluZyBjb2RlLlxuICogQHBhcmFtIHtMYW5ndWFnZX0gbGFuZ3VhZ2VcbiAqIEByZXR1cm5zIHtDb21waWxlZExhbmd1YWdlfVxuICovXG5mdW5jdGlvbiBjb21waWxlTGFuZ3VhZ2UobGFuZ3VhZ2UpIHtcbiAgLyoqXG4gICAqIEJ1aWxkcyBhIHJlZ2V4IHdpdGggdGhlIGNhc2Ugc2Vuc2l0aXZpdHkgb2YgdGhlIGN1cnJlbnQgbGFuZ3VhZ2VcbiAgICpcbiAgICogQHBhcmFtIHtSZWdFeHAgfCBzdHJpbmd9IHZhbHVlXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2dsb2JhbF1cbiAgICovXG4gIGZ1bmN0aW9uIGxhbmdSZSh2YWx1ZSwgZ2xvYmFsKSB7XG4gICAgcmV0dXJuIG5ldyBSZWdFeHAoXG4gICAgICBzb3VyY2UodmFsdWUpLFxuICAgICAgJ20nXG4gICAgICArIChsYW5ndWFnZS5jYXNlX2luc2Vuc2l0aXZlID8gJ2knIDogJycpXG4gICAgICArIChsYW5ndWFnZS51bmljb2RlUmVnZXggPyAndScgOiAnJylcbiAgICAgICsgKGdsb2JhbCA/ICdnJyA6ICcnKVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICBTdG9yZXMgbXVsdGlwbGUgcmVndWxhciBleHByZXNzaW9ucyBhbmQgYWxsb3dzIHlvdSB0byBxdWlja2x5IHNlYXJjaCBmb3JcbiAgICB0aGVtIGFsbCBpbiBhIHN0cmluZyBzaW11bHRhbmVvdXNseSAtIHJldHVybmluZyB0aGUgZmlyc3QgbWF0Y2guICBJdCBkb2VzXG4gICAgdGhpcyBieSBjcmVhdGluZyBhIGh1Z2UgKGF8YnxjKSByZWdleCAtIGVhY2ggaW5kaXZpZHVhbCBpdGVtIHdyYXBwZWQgd2l0aCAoKVxuICAgIGFuZCBqb2luZWQgYnkgYHxgIC0gdXNpbmcgbWF0Y2ggZ3JvdXBzIHRvIHRyYWNrIHBvc2l0aW9uLiAgV2hlbiBhIG1hdGNoIGlzXG4gICAgZm91bmQgY2hlY2tpbmcgd2hpY2ggcG9zaXRpb24gaW4gdGhlIGFycmF5IGhhcyBjb250ZW50IGFsbG93cyB1cyB0byBmaWd1cmVcbiAgICBvdXQgd2hpY2ggb2YgdGhlIG9yaWdpbmFsIHJlZ2V4ZXMgLyBtYXRjaCBncm91cHMgdHJpZ2dlcmVkIHRoZSBtYXRjaC5cblxuICAgIFRoZSBtYXRjaCBvYmplY3QgaXRzZWxmICh0aGUgcmVzdWx0IG9mIGBSZWdleC5leGVjYCkgaXMgcmV0dXJuZWQgYnV0IGFsc29cbiAgICBlbmhhbmNlZCBieSBtZXJnaW5nIGluIGFueSBtZXRhLWRhdGEgdGhhdCB3YXMgcmVnaXN0ZXJlZCB3aXRoIHRoZSByZWdleC5cbiAgICBUaGlzIGlzIGhvdyB3ZSBrZWVwIHRyYWNrIG9mIHdoaWNoIG1vZGUgbWF0Y2hlZCwgYW5kIHdoYXQgdHlwZSBvZiBydWxlXG4gICAgKGBpbGxlZ2FsYCwgYGJlZ2luYCwgZW5kLCBldGMpLlxuICAqL1xuICBjbGFzcyBNdWx0aVJlZ2V4IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgIHRoaXMubWF0Y2hJbmRleGVzID0ge307XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICB0aGlzLnJlZ2V4ZXMgPSBbXTtcbiAgICAgIHRoaXMubWF0Y2hBdCA9IDE7XG4gICAgICB0aGlzLnBvc2l0aW9uID0gMDtcbiAgICB9XG5cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgYWRkUnVsZShyZSwgb3B0cykge1xuICAgICAgb3B0cy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24rKztcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIHRoaXMubWF0Y2hJbmRleGVzW3RoaXMubWF0Y2hBdF0gPSBvcHRzO1xuICAgICAgdGhpcy5yZWdleGVzLnB1c2goW29wdHMsIHJlXSk7XG4gICAgICB0aGlzLm1hdGNoQXQgKz0gY291bnRNYXRjaEdyb3VwcyhyZSkgKyAxO1xuICAgIH1cblxuICAgIGNvbXBpbGUoKSB7XG4gICAgICBpZiAodGhpcy5yZWdleGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAvLyBhdm9pZHMgdGhlIG5lZWQgdG8gY2hlY2sgbGVuZ3RoIGV2ZXJ5IHRpbWUgZXhlYyBpcyBjYWxsZWRcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICB0aGlzLmV4ZWMgPSAoKSA9PiBudWxsO1xuICAgICAgfVxuICAgICAgY29uc3QgdGVybWluYXRvcnMgPSB0aGlzLnJlZ2V4ZXMubWFwKGVsID0+IGVsWzFdKTtcbiAgICAgIHRoaXMubWF0Y2hlclJlID0gbGFuZ1JlKF9yZXdyaXRlQmFja3JlZmVyZW5jZXModGVybWluYXRvcnMsIHsgam9pbldpdGg6ICd8JyB9KSwgdHJ1ZSk7XG4gICAgICB0aGlzLmxhc3RJbmRleCA9IDA7XG4gICAgfVxuXG4gICAgLyoqIEBwYXJhbSB7c3RyaW5nfSBzICovXG4gICAgZXhlYyhzKSB7XG4gICAgICB0aGlzLm1hdGNoZXJSZS5sYXN0SW5kZXggPSB0aGlzLmxhc3RJbmRleDtcbiAgICAgIGNvbnN0IG1hdGNoID0gdGhpcy5tYXRjaGVyUmUuZXhlYyhzKTtcbiAgICAgIGlmICghbWF0Y2gpIHsgcmV0dXJuIG51bGw7IH1cblxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmaW5lZFxuICAgICAgY29uc3QgaSA9IG1hdGNoLmZpbmRJbmRleCgoZWwsIGkpID0+IGkgPiAwICYmIGVsICE9PSB1bmRlZmluZWQpO1xuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgY29uc3QgbWF0Y2hEYXRhID0gdGhpcy5tYXRjaEluZGV4ZXNbaV07XG4gICAgICAvLyB0cmltIG9mZiBhbnkgZWFybGllciBub24tcmVsZXZhbnQgbWF0Y2ggZ3JvdXBzIChpZSwgdGhlIG90aGVyIHJlZ2V4XG4gICAgICAvLyBtYXRjaCBncm91cHMgdGhhdCBtYWtlIHVwIHRoZSBtdWx0aS1tYXRjaGVyKVxuICAgICAgbWF0Y2guc3BsaWNlKDAsIGkpO1xuXG4gICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihtYXRjaCwgbWF0Y2hEYXRhKTtcbiAgICB9XG4gIH1cblxuICAvKlxuICAgIENyZWF0ZWQgdG8gc29sdmUgdGhlIGtleSBkZWZpY2llbnRseSB3aXRoIE11bHRpUmVnZXggLSB0aGVyZSBpcyBubyB3YXkgdG9cbiAgICB0ZXN0IGZvciBtdWx0aXBsZSBtYXRjaGVzIGF0IGEgc2luZ2xlIGxvY2F0aW9uLiAgV2h5IHdvdWxkIHdlIG5lZWQgdG8gZG9cbiAgICB0aGF0PyAgSW4gdGhlIGZ1dHVyZSBhIG1vcmUgZHluYW1pYyBlbmdpbmUgd2lsbCBhbGxvdyBjZXJ0YWluIG1hdGNoZXMgdG8gYmVcbiAgICBpZ25vcmVkLiAgQW4gZXhhbXBsZTogaWYgd2UgbWF0Y2hlZCBzYXkgdGhlIDNyZCByZWdleCBpbiBhIGxhcmdlIGdyb3VwIGJ1dFxuICAgIGRlY2lkZWQgdG8gaWdub3JlIGl0IC0gd2UnZCBuZWVkIHRvIHN0YXJ0ZWQgdGVzdGluZyBhZ2FpbiBhdCB0aGUgNHRoXG4gICAgcmVnZXguLi4gYnV0IE11bHRpUmVnZXggaXRzZWxmIGdpdmVzIHVzIG5vIHJlYWwgd2F5IHRvIGRvIHRoYXQuXG5cbiAgICBTbyB3aGF0IHRoaXMgY2xhc3MgY3JlYXRlcyBNdWx0aVJlZ2V4cyBvbiB0aGUgZmx5IGZvciB3aGF0ZXZlciBzZWFyY2hcbiAgICBwb3NpdGlvbiB0aGV5IGFyZSBuZWVkZWQuXG5cbiAgICBOT1RFOiBUaGVzZSBhZGRpdGlvbmFsIE11bHRpUmVnZXggb2JqZWN0cyBhcmUgY3JlYXRlZCBkeW5hbWljYWxseS4gIEZvciBtb3N0XG4gICAgZ3JhbW1hcnMgbW9zdCBvZiB0aGUgdGltZSB3ZSB3aWxsIG5ldmVyIGFjdHVhbGx5IG5lZWQgYW55dGhpbmcgbW9yZSB0aGFuIHRoZVxuICAgIGZpcnN0IE11bHRpUmVnZXggLSBzbyB0aGlzIHNob3VsZG4ndCBoYXZlIHRvbyBtdWNoIG92ZXJoZWFkLlxuXG4gICAgU2F5IHRoaXMgaXMgb3VyIHNlYXJjaCBncm91cCwgYW5kIHdlIG1hdGNoIHJlZ2V4MywgYnV0IHdpc2ggdG8gaWdub3JlIGl0LlxuXG4gICAgICByZWdleDEgfCByZWdleDIgfCByZWdleDMgfCByZWdleDQgfCByZWdleDUgICAgJyBpZSwgc3RhcnRBdCA9IDBcblxuICAgIFdoYXQgd2UgbmVlZCBpcyBhIG5ldyBNdWx0aVJlZ2V4IHRoYXQgb25seSBpbmNsdWRlcyB0aGUgcmVtYWluaW5nXG4gICAgcG9zc2liaWxpdGllczpcblxuICAgICAgcmVnZXg0IHwgcmVnZXg1ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgaWUsIHN0YXJ0QXQgPSAzXG5cbiAgICBUaGlzIGNsYXNzIHdyYXBzIGFsbCB0aGF0IGNvbXBsZXhpdHkgdXAgaW4gYSBzaW1wbGUgQVBJLi4uIGBzdGFydEF0YCBkZWNpZGVzXG4gICAgd2hlcmUgaW4gdGhlIGFycmF5IG9mIGV4cHJlc3Npb25zIHRvIHN0YXJ0IGRvaW5nIHRoZSBtYXRjaGluZy4gSXRcbiAgICBhdXRvLWluY3JlbWVudHMsIHNvIGlmIGEgbWF0Y2ggaXMgZm91bmQgYXQgcG9zaXRpb24gMiwgdGhlbiBzdGFydEF0IHdpbGwgYmVcbiAgICBzZXQgdG8gMy4gIElmIHRoZSBlbmQgaXMgcmVhY2hlZCBzdGFydEF0IHdpbGwgcmV0dXJuIHRvIDAuXG5cbiAgICBNT1NUIG9mIHRoZSB0aW1lIHRoZSBwYXJzZXIgd2lsbCBiZSBzZXR0aW5nIHN0YXJ0QXQgbWFudWFsbHkgdG8gMC5cbiAgKi9cbiAgY2xhc3MgUmVzdW1hYmxlTXVsdGlSZWdleCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICB0aGlzLnJ1bGVzID0gW107XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICB0aGlzLm11bHRpUmVnZXhlcyA9IFtdO1xuICAgICAgdGhpcy5jb3VudCA9IDA7XG5cbiAgICAgIHRoaXMubGFzdEluZGV4ID0gMDtcbiAgICAgIHRoaXMucmVnZXhJbmRleCA9IDA7XG4gICAgfVxuXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGdldE1hdGNoZXIoaW5kZXgpIHtcbiAgICAgIGlmICh0aGlzLm11bHRpUmVnZXhlc1tpbmRleF0pIHJldHVybiB0aGlzLm11bHRpUmVnZXhlc1tpbmRleF07XG5cbiAgICAgIGNvbnN0IG1hdGNoZXIgPSBuZXcgTXVsdGlSZWdleCgpO1xuICAgICAgdGhpcy5ydWxlcy5zbGljZShpbmRleCkuZm9yRWFjaCgoW3JlLCBvcHRzXSkgPT4gbWF0Y2hlci5hZGRSdWxlKHJlLCBvcHRzKSk7XG4gICAgICBtYXRjaGVyLmNvbXBpbGUoKTtcbiAgICAgIHRoaXMubXVsdGlSZWdleGVzW2luZGV4XSA9IG1hdGNoZXI7XG4gICAgICByZXR1cm4gbWF0Y2hlcjtcbiAgICB9XG5cbiAgICByZXN1bWluZ1NjYW5BdFNhbWVQb3NpdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlZ2V4SW5kZXggIT09IDA7XG4gICAgfVxuXG4gICAgY29uc2lkZXJBbGwoKSB7XG4gICAgICB0aGlzLnJlZ2V4SW5kZXggPSAwO1xuICAgIH1cblxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBhZGRSdWxlKHJlLCBvcHRzKSB7XG4gICAgICB0aGlzLnJ1bGVzLnB1c2goW3JlLCBvcHRzXSk7XG4gICAgICBpZiAob3B0cy50eXBlID09PSBcImJlZ2luXCIpIHRoaXMuY291bnQrKztcbiAgICB9XG5cbiAgICAvKiogQHBhcmFtIHtzdHJpbmd9IHMgKi9cbiAgICBleGVjKHMpIHtcbiAgICAgIGNvbnN0IG0gPSB0aGlzLmdldE1hdGNoZXIodGhpcy5yZWdleEluZGV4KTtcbiAgICAgIG0ubGFzdEluZGV4ID0gdGhpcy5sYXN0SW5kZXg7XG4gICAgICBsZXQgcmVzdWx0ID0gbS5leGVjKHMpO1xuXG4gICAgICAvLyBUaGUgZm9sbG93aW5nIGlzIGJlY2F1c2Ugd2UgaGF2ZSBubyBlYXN5IHdheSB0byBzYXkgXCJyZXN1bWUgc2Nhbm5pbmcgYXQgdGhlXG4gICAgICAvLyBleGlzdGluZyBwb3NpdGlvbiBidXQgYWxzbyBza2lwIHRoZSBjdXJyZW50IHJ1bGUgT05MWVwiLiBXaGF0IGhhcHBlbnMgaXNcbiAgICAgIC8vIGFsbCBwcmlvciBydWxlcyBhcmUgYWxzbyBza2lwcGVkIHdoaWNoIGNhbiByZXN1bHQgaW4gbWF0Y2hpbmcgdGhlIHdyb25nXG4gICAgICAvLyB0aGluZy4gRXhhbXBsZSBvZiBtYXRjaGluZyBcImJvb2dlclwiOlxuXG4gICAgICAvLyBvdXIgbWF0Y2hlciBpcyBbc3RyaW5nLCBcImJvb2dlclwiLCBudW1iZXJdXG4gICAgICAvL1xuICAgICAgLy8gLi4uLmJvb2dlci4uLi5cblxuICAgICAgLy8gaWYgXCJib29nZXJcIiBpcyBpZ25vcmVkIHRoZW4gd2UnZCByZWFsbHkgbmVlZCBhIHJlZ2V4IHRvIHNjYW4gZnJvbSB0aGVcbiAgICAgIC8vIFNBTUUgcG9zaXRpb24gZm9yIG9ubHk6IFtzdHJpbmcsIG51bWJlcl0gYnV0IGlnbm9yaW5nIFwiYm9vZ2VyXCIgKGlmIGl0XG4gICAgICAvLyB3YXMgdGhlIGZpcnN0IG1hdGNoKSwgYSBzaW1wbGUgcmVzdW1lIHdvdWxkIHNjYW4gYWhlYWQgd2hvIGtub3dzIGhvd1xuICAgICAgLy8gZmFyIGxvb2tpbmcgb25seSBmb3IgXCJudW1iZXJcIiwgaWdub3JpbmcgcG90ZW50aWFsIHN0cmluZyBtYXRjaGVzIChvclxuICAgICAgLy8gZnV0dXJlIFwiYm9vZ2VyXCIgbWF0Y2hlcyB0aGF0IG1pZ2h0IGJlIHZhbGlkLilcblxuICAgICAgLy8gU28gd2hhdCB3ZSBkbzogV2UgZXhlY3V0ZSB0d28gbWF0Y2hlcnMsIG9uZSByZXN1bWluZyBhdCB0aGUgc2FtZVxuICAgICAgLy8gcG9zaXRpb24sIGJ1dCB0aGUgc2Vjb25kIGZ1bGwgbWF0Y2hlciBzdGFydGluZyBhdCB0aGUgcG9zaXRpb24gYWZ0ZXI6XG5cbiAgICAgIC8vICAgICAvLS0tIHJlc3VtZSBmaXJzdCByZWdleCBtYXRjaCBoZXJlIChmb3IgW251bWJlcl0pXG4gICAgICAvLyAgICAgfC8tLS0tIGZ1bGwgbWF0Y2ggaGVyZSBmb3IgW3N0cmluZywgXCJib29nZXJcIiwgbnVtYmVyXVxuICAgICAgLy8gICAgIHZ2XG4gICAgICAvLyAuLi4uYm9vZ2VyLi4uLlxuXG4gICAgICAvLyBXaGljaCBldmVyIHJlc3VsdHMgaW4gYSBtYXRjaCBmaXJzdCBpcyB0aGVuIHVzZWQuIFNvIHRoaXMgMy00IHN0ZXBcbiAgICAgIC8vIHByb2Nlc3MgZXNzZW50aWFsbHkgYWxsb3dzIHVzIHRvIHNheSBcIm1hdGNoIGF0IHRoaXMgcG9zaXRpb24sIGV4Y2x1ZGluZ1xuICAgICAgLy8gYSBwcmlvciBydWxlIHRoYXQgd2FzIGlnbm9yZWRcIi5cbiAgICAgIC8vXG4gICAgICAvLyAxLiBNYXRjaCBcImJvb2dlclwiIGZpcnN0LCBpZ25vcmUuIEFsc28gcHJvdmVzIHRoYXQgW3N0cmluZ10gZG9lcyBub24gbWF0Y2guXG4gICAgICAvLyAyLiBSZXN1bWUgbWF0Y2hpbmcgZm9yIFtudW1iZXJdXG4gICAgICAvLyAzLiBNYXRjaCBhdCBpbmRleCArIDEgZm9yIFtzdHJpbmcsIFwiYm9vZ2VyXCIsIG51bWJlcl1cbiAgICAgIC8vIDQuIElmICMyIGFuZCAjMyByZXN1bHQgaW4gbWF0Y2hlcywgd2hpY2ggY2FtZSBmaXJzdD9cbiAgICAgIGlmICh0aGlzLnJlc3VtaW5nU2NhbkF0U2FtZVBvc2l0aW9uKCkpIHtcbiAgICAgICAgaWYgKHJlc3VsdCAmJiByZXN1bHQuaW5kZXggPT09IHRoaXMubGFzdEluZGV4KSA7IGVsc2UgeyAvLyB1c2UgdGhlIHNlY29uZCBtYXRjaGVyIHJlc3VsdFxuICAgICAgICAgIGNvbnN0IG0yID0gdGhpcy5nZXRNYXRjaGVyKDApO1xuICAgICAgICAgIG0yLmxhc3RJbmRleCA9IHRoaXMubGFzdEluZGV4ICsgMTtcbiAgICAgICAgICByZXN1bHQgPSBtMi5leGVjKHMpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgdGhpcy5yZWdleEluZGV4ICs9IHJlc3VsdC5wb3NpdGlvbiArIDE7XG4gICAgICAgIGlmICh0aGlzLnJlZ2V4SW5kZXggPT09IHRoaXMuY291bnQpIHtcbiAgICAgICAgICAvLyB3cmFwLWFyb3VuZCB0byBjb25zaWRlcmluZyBhbGwgbWF0Y2hlcyBhZ2FpblxuICAgICAgICAgIHRoaXMuY29uc2lkZXJBbGwoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHaXZlbiBhIG1vZGUsIGJ1aWxkcyBhIGh1Z2UgUmVzdW1hYmxlTXVsdGlSZWdleCB0aGF0IGNhbiBiZSB1c2VkIHRvIHdhbGtcbiAgICogdGhlIGNvbnRlbnQgYW5kIGZpbmQgbWF0Y2hlcy5cbiAgICpcbiAgICogQHBhcmFtIHtDb21waWxlZE1vZGV9IG1vZGVcbiAgICogQHJldHVybnMge1Jlc3VtYWJsZU11bHRpUmVnZXh9XG4gICAqL1xuICBmdW5jdGlvbiBidWlsZE1vZGVSZWdleChtb2RlKSB7XG4gICAgY29uc3QgbW0gPSBuZXcgUmVzdW1hYmxlTXVsdGlSZWdleCgpO1xuXG4gICAgbW9kZS5jb250YWlucy5mb3JFYWNoKHRlcm0gPT4gbW0uYWRkUnVsZSh0ZXJtLmJlZ2luLCB7IHJ1bGU6IHRlcm0sIHR5cGU6IFwiYmVnaW5cIiB9KSk7XG5cbiAgICBpZiAobW9kZS50ZXJtaW5hdG9yRW5kKSB7XG4gICAgICBtbS5hZGRSdWxlKG1vZGUudGVybWluYXRvckVuZCwgeyB0eXBlOiBcImVuZFwiIH0pO1xuICAgIH1cbiAgICBpZiAobW9kZS5pbGxlZ2FsKSB7XG4gICAgICBtbS5hZGRSdWxlKG1vZGUuaWxsZWdhbCwgeyB0eXBlOiBcImlsbGVnYWxcIiB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbW07XG4gIH1cblxuICAvKiogc2tpcCB2cyBhYm9ydCB2cyBpZ25vcmVcbiAgICpcbiAgICogQHNraXAgICAtIFRoZSBtb2RlIGlzIHN0aWxsIGVudGVyZWQgYW5kIGV4aXRlZCBub3JtYWxseSAoYW5kIGNvbnRhaW5zIHJ1bGVzIGFwcGx5KSxcbiAgICogICAgICAgICAgIGJ1dCBhbGwgY29udGVudCBpcyBoZWxkIGFuZCBhZGRlZCB0byB0aGUgcGFyZW50IGJ1ZmZlciByYXRoZXIgdGhhbiBiZWluZ1xuICAgKiAgICAgICAgICAgb3V0cHV0IHdoZW4gdGhlIG1vZGUgZW5kcy4gIE1vc3RseSB1c2VkIHdpdGggYHN1Ymxhbmd1YWdlYCB0byBidWlsZCB1cFxuICAgKiAgICAgICAgICAgYSBzaW5nbGUgbGFyZ2UgYnVmZmVyIHRoYW4gY2FuIGJlIHBhcnNlZCBieSBzdWJsYW5ndWFnZS5cbiAgICpcbiAgICogICAgICAgICAgICAgLSBUaGUgbW9kZSBiZWdpbiBhbmRzIGVuZHMgbm9ybWFsbHkuXG4gICAqICAgICAgICAgICAgIC0gQ29udGVudCBtYXRjaGVkIGlzIGFkZGVkIHRvIHRoZSBwYXJlbnQgbW9kZSBidWZmZXIuXG4gICAqICAgICAgICAgICAgIC0gVGhlIHBhcnNlciBjdXJzb3IgaXMgbW92ZWQgZm9yd2FyZCBub3JtYWxseS5cbiAgICpcbiAgICogQGFib3J0ICAtIEEgaGFjayBwbGFjZWhvbGRlciB1bnRpbCB3ZSBoYXZlIGlnbm9yZS4gIEFib3J0cyB0aGUgbW9kZSAoYXMgaWYgaXRcbiAgICogICAgICAgICAgIG5ldmVyIG1hdGNoZWQpIGJ1dCBET0VTIE5PVCBjb250aW51ZSB0byBtYXRjaCBzdWJzZXF1ZW50IGBjb250YWluc2BcbiAgICogICAgICAgICAgIG1vZGVzLiAgQWJvcnQgaXMgYmFkL3N1Ym9wdGltYWwgYmVjYXVzZSBpdCBjYW4gcmVzdWx0IGluIG1vZGVzXG4gICAqICAgICAgICAgICBmYXJ0aGVyIGRvd24gbm90IGdldHRpbmcgYXBwbGllZCBiZWNhdXNlIGFuIGVhcmxpZXIgcnVsZSBlYXRzIHRoZVxuICAgKiAgICAgICAgICAgY29udGVudCBidXQgdGhlbiBhYm9ydHMuXG4gICAqXG4gICAqICAgICAgICAgICAgIC0gVGhlIG1vZGUgZG9lcyBub3QgYmVnaW4uXG4gICAqICAgICAgICAgICAgIC0gQ29udGVudCBtYXRjaGVkIGJ5IGBiZWdpbmAgaXMgYWRkZWQgdG8gdGhlIG1vZGUgYnVmZmVyLlxuICAgKiAgICAgICAgICAgICAtIFRoZSBwYXJzZXIgY3Vyc29yIGlzIG1vdmVkIGZvcndhcmQgYWNjb3JkaW5nbHkuXG4gICAqXG4gICAqIEBpZ25vcmUgLSBJZ25vcmVzIHRoZSBtb2RlIChhcyBpZiBpdCBuZXZlciBtYXRjaGVkKSBhbmQgY29udGludWVzIHRvIG1hdGNoIGFueVxuICAgKiAgICAgICAgICAgc3Vic2VxdWVudCBgY29udGFpbnNgIG1vZGVzLiAgSWdub3JlIGlzbid0IHRlY2huaWNhbGx5IHBvc3NpYmxlIHdpdGhcbiAgICogICAgICAgICAgIHRoZSBjdXJyZW50IHBhcnNlciBpbXBsZW1lbnRhdGlvbi5cbiAgICpcbiAgICogICAgICAgICAgICAgLSBUaGUgbW9kZSBkb2VzIG5vdCBiZWdpbi5cbiAgICogICAgICAgICAgICAgLSBDb250ZW50IG1hdGNoZWQgYnkgYGJlZ2luYCBpcyBpZ25vcmVkLlxuICAgKiAgICAgICAgICAgICAtIFRoZSBwYXJzZXIgY3Vyc29yIGlzIG5vdCBtb3ZlZCBmb3J3YXJkLlxuICAgKi9cblxuICAvKipcbiAgICogQ29tcGlsZXMgYW4gaW5kaXZpZHVhbCBtb2RlXG4gICAqXG4gICAqIFRoaXMgY2FuIHJhaXNlIGFuIGVycm9yIGlmIHRoZSBtb2RlIGNvbnRhaW5zIGNlcnRhaW4gZGV0ZWN0YWJsZSBrbm93biBsb2dpY1xuICAgKiBpc3N1ZXMuXG4gICAqIEBwYXJhbSB7TW9kZX0gbW9kZVxuICAgKiBAcGFyYW0ge0NvbXBpbGVkTW9kZSB8IG51bGx9IFtwYXJlbnRdXG4gICAqIEByZXR1cm5zIHtDb21waWxlZE1vZGUgfCBuZXZlcn1cbiAgICovXG4gIGZ1bmN0aW9uIGNvbXBpbGVNb2RlKG1vZGUsIHBhcmVudCkge1xuICAgIGNvbnN0IGNtb2RlID0gLyoqIEB0eXBlIENvbXBpbGVkTW9kZSAqLyAobW9kZSk7XG4gICAgaWYgKG1vZGUuaXNDb21waWxlZCkgcmV0dXJuIGNtb2RlO1xuXG4gICAgW1xuICAgICAgc2NvcGVDbGFzc05hbWUsXG4gICAgICAvLyBkbyB0aGlzIGVhcmx5IHNvIGNvbXBpbGVyIGV4dGVuc2lvbnMgZ2VuZXJhbGx5IGRvbid0IGhhdmUgdG8gd29ycnkgYWJvdXRcbiAgICAgIC8vIHRoZSBkaXN0aW5jdGlvbiBiZXR3ZWVuIG1hdGNoL2JlZ2luXG4gICAgICBjb21waWxlTWF0Y2gsXG4gICAgICBNdWx0aUNsYXNzLFxuICAgICAgYmVmb3JlTWF0Y2hFeHRcbiAgICBdLmZvckVhY2goZXh0ID0+IGV4dChtb2RlLCBwYXJlbnQpKTtcblxuICAgIGxhbmd1YWdlLmNvbXBpbGVyRXh0ZW5zaW9ucy5mb3JFYWNoKGV4dCA9PiBleHQobW9kZSwgcGFyZW50KSk7XG5cbiAgICAvLyBfX2JlZm9yZUJlZ2luIGlzIGNvbnNpZGVyZWQgcHJpdmF0ZSBBUEksIGludGVybmFsIHVzZSBvbmx5XG4gICAgbW9kZS5fX2JlZm9yZUJlZ2luID0gbnVsbDtcblxuICAgIFtcbiAgICAgIGJlZ2luS2V5d29yZHMsXG4gICAgICAvLyBkbyB0aGlzIGxhdGVyIHNvIGNvbXBpbGVyIGV4dGVuc2lvbnMgdGhhdCBjb21lIGVhcmxpZXIgaGF2ZSBhY2Nlc3MgdG8gdGhlXG4gICAgICAvLyByYXcgYXJyYXkgaWYgdGhleSB3YW50ZWQgdG8gcGVyaGFwcyBtYW5pcHVsYXRlIGl0LCBldGMuXG4gICAgICBjb21waWxlSWxsZWdhbCxcbiAgICAgIC8vIGRlZmF1bHQgdG8gMSByZWxldmFuY2UgaWYgbm90IHNwZWNpZmllZFxuICAgICAgY29tcGlsZVJlbGV2YW5jZVxuICAgIF0uZm9yRWFjaChleHQgPT4gZXh0KG1vZGUsIHBhcmVudCkpO1xuXG4gICAgbW9kZS5pc0NvbXBpbGVkID0gdHJ1ZTtcblxuICAgIGxldCBrZXl3b3JkUGF0dGVybiA9IG51bGw7XG4gICAgaWYgKHR5cGVvZiBtb2RlLmtleXdvcmRzID09PSBcIm9iamVjdFwiICYmIG1vZGUua2V5d29yZHMuJHBhdHRlcm4pIHtcbiAgICAgIC8vIHdlIG5lZWQgYSBjb3B5IGJlY2F1c2Uga2V5d29yZHMgbWlnaHQgYmUgY29tcGlsZWQgbXVsdGlwbGUgdGltZXNcbiAgICAgIC8vIHNvIHdlIGNhbid0IGdvIGRlbGV0aW5nICRwYXR0ZXJuIGZyb20gdGhlIG9yaWdpbmFsIG9uIHRoZSBmaXJzdFxuICAgICAgLy8gcGFzc1xuICAgICAgbW9kZS5rZXl3b3JkcyA9IE9iamVjdC5hc3NpZ24oe30sIG1vZGUua2V5d29yZHMpO1xuICAgICAga2V5d29yZFBhdHRlcm4gPSBtb2RlLmtleXdvcmRzLiRwYXR0ZXJuO1xuICAgICAgZGVsZXRlIG1vZGUua2V5d29yZHMuJHBhdHRlcm47XG4gICAgfVxuICAgIGtleXdvcmRQYXR0ZXJuID0ga2V5d29yZFBhdHRlcm4gfHwgL1xcdysvO1xuXG4gICAgaWYgKG1vZGUua2V5d29yZHMpIHtcbiAgICAgIG1vZGUua2V5d29yZHMgPSBjb21waWxlS2V5d29yZHMobW9kZS5rZXl3b3JkcywgbGFuZ3VhZ2UuY2FzZV9pbnNlbnNpdGl2ZSk7XG4gICAgfVxuXG4gICAgY21vZGUua2V5d29yZFBhdHRlcm5SZSA9IGxhbmdSZShrZXl3b3JkUGF0dGVybiwgdHJ1ZSk7XG5cbiAgICBpZiAocGFyZW50KSB7XG4gICAgICBpZiAoIW1vZGUuYmVnaW4pIG1vZGUuYmVnaW4gPSAvXFxCfFxcYi87XG4gICAgICBjbW9kZS5iZWdpblJlID0gbGFuZ1JlKGNtb2RlLmJlZ2luKTtcbiAgICAgIGlmICghbW9kZS5lbmQgJiYgIW1vZGUuZW5kc1dpdGhQYXJlbnQpIG1vZGUuZW5kID0gL1xcQnxcXGIvO1xuICAgICAgaWYgKG1vZGUuZW5kKSBjbW9kZS5lbmRSZSA9IGxhbmdSZShjbW9kZS5lbmQpO1xuICAgICAgY21vZGUudGVybWluYXRvckVuZCA9IHNvdXJjZShjbW9kZS5lbmQpIHx8ICcnO1xuICAgICAgaWYgKG1vZGUuZW5kc1dpdGhQYXJlbnQgJiYgcGFyZW50LnRlcm1pbmF0b3JFbmQpIHtcbiAgICAgICAgY21vZGUudGVybWluYXRvckVuZCArPSAobW9kZS5lbmQgPyAnfCcgOiAnJykgKyBwYXJlbnQudGVybWluYXRvckVuZDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG1vZGUuaWxsZWdhbCkgY21vZGUuaWxsZWdhbFJlID0gbGFuZ1JlKC8qKiBAdHlwZSB7UmVnRXhwIHwgc3RyaW5nfSAqLyAobW9kZS5pbGxlZ2FsKSk7XG4gICAgaWYgKCFtb2RlLmNvbnRhaW5zKSBtb2RlLmNvbnRhaW5zID0gW107XG5cbiAgICBtb2RlLmNvbnRhaW5zID0gW10uY29uY2F0KC4uLm1vZGUuY29udGFpbnMubWFwKGZ1bmN0aW9uKGMpIHtcbiAgICAgIHJldHVybiBleHBhbmRPckNsb25lTW9kZShjID09PSAnc2VsZicgPyBtb2RlIDogYyk7XG4gICAgfSkpO1xuICAgIG1vZGUuY29udGFpbnMuZm9yRWFjaChmdW5jdGlvbihjKSB7IGNvbXBpbGVNb2RlKC8qKiBAdHlwZSBNb2RlICovIChjKSwgY21vZGUpOyB9KTtcblxuICAgIGlmIChtb2RlLnN0YXJ0cykge1xuICAgICAgY29tcGlsZU1vZGUobW9kZS5zdGFydHMsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgY21vZGUubWF0Y2hlciA9IGJ1aWxkTW9kZVJlZ2V4KGNtb2RlKTtcbiAgICByZXR1cm4gY21vZGU7XG4gIH1cblxuICBpZiAoIWxhbmd1YWdlLmNvbXBpbGVyRXh0ZW5zaW9ucykgbGFuZ3VhZ2UuY29tcGlsZXJFeHRlbnNpb25zID0gW107XG5cbiAgLy8gc2VsZiBpcyBub3QgdmFsaWQgYXQgdGhlIHRvcC1sZXZlbFxuICBpZiAobGFuZ3VhZ2UuY29udGFpbnMgJiYgbGFuZ3VhZ2UuY29udGFpbnMuaW5jbHVkZXMoJ3NlbGYnKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkVSUjogY29udGFpbnMgYHNlbGZgIGlzIG5vdCBzdXBwb3J0ZWQgYXQgdGhlIHRvcC1sZXZlbCBvZiBhIGxhbmd1YWdlLiAgU2VlIGRvY3VtZW50YXRpb24uXCIpO1xuICB9XG5cbiAgLy8gd2UgbmVlZCBhIG51bGwgb2JqZWN0LCB3aGljaCBpbmhlcml0IHdpbGwgZ3VhcmFudGVlXG4gIGxhbmd1YWdlLmNsYXNzTmFtZUFsaWFzZXMgPSBpbmhlcml0JDEobGFuZ3VhZ2UuY2xhc3NOYW1lQWxpYXNlcyB8fCB7fSk7XG5cbiAgcmV0dXJuIGNvbXBpbGVNb2RlKC8qKiBAdHlwZSBNb2RlICovIChsYW5ndWFnZSkpO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgYSBtb2RlIGhhcyBhIGRlcGVuZGVuY3kgb24gaXQncyBwYXJlbnQgb3Igbm90XG4gKlxuICogSWYgYSBtb2RlIGRvZXMgaGF2ZSBhIHBhcmVudCBkZXBlbmRlbmN5IHRoZW4gb2Z0ZW4gd2UgbmVlZCB0byBjbG9uZSBpdCBpZlxuICogaXQncyB1c2VkIGluIG11bHRpcGxlIHBsYWNlcyBzbyB0aGF0IGVhY2ggY29weSBwb2ludHMgdG8gdGhlIGNvcnJlY3QgcGFyZW50LFxuICogd2hlcmUtYXMgbW9kZXMgd2l0aG91dCBhIHBhcmVudCBjYW4gb2Z0ZW4gc2FmZWx5IGJlIHJlLXVzZWQgYXQgdGhlIGJvdHRvbSBvZlxuICogYSBtb2RlIGNoYWluLlxuICpcbiAqIEBwYXJhbSB7TW9kZSB8IG51bGx9IG1vZGVcbiAqIEByZXR1cm5zIHtib29sZWFufSAtIGlzIHRoZXJlIGEgZGVwZW5kZW5jeSBvbiB0aGUgcGFyZW50P1xuICogKi9cbmZ1bmN0aW9uIGRlcGVuZGVuY3lPblBhcmVudChtb2RlKSB7XG4gIGlmICghbW9kZSkgcmV0dXJuIGZhbHNlO1xuXG4gIHJldHVybiBtb2RlLmVuZHNXaXRoUGFyZW50IHx8IGRlcGVuZGVuY3lPblBhcmVudChtb2RlLnN0YXJ0cyk7XG59XG5cbi8qKlxuICogRXhwYW5kcyBhIG1vZGUgb3IgY2xvbmVzIGl0IGlmIG5lY2Vzc2FyeVxuICpcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IGZvciBtb2RlcyB3aXRoIHBhcmVudGFsIGRlcGVuZGVuY2VpcyAoc2VlIG5vdGVzIG9uXG4gKiBgZGVwZW5kZW5jeU9uUGFyZW50YCkgYW5kIGZvciBub2RlcyB0aGF0IGhhdmUgYHZhcmlhbnRzYCAtIHdoaWNoIG11c3QgdGhlbiBiZVxuICogZXhwbG9kZWQgaW50byB0aGVpciBvd24gaW5kaXZpZHVhbCBtb2RlcyBhdCBjb21waWxlIHRpbWUuXG4gKlxuICogQHBhcmFtIHtNb2RlfSBtb2RlXG4gKiBAcmV0dXJucyB7TW9kZSB8IE1vZGVbXX1cbiAqICovXG5mdW5jdGlvbiBleHBhbmRPckNsb25lTW9kZShtb2RlKSB7XG4gIGlmIChtb2RlLnZhcmlhbnRzICYmICFtb2RlLmNhY2hlZFZhcmlhbnRzKSB7XG4gICAgbW9kZS5jYWNoZWRWYXJpYW50cyA9IG1vZGUudmFyaWFudHMubWFwKGZ1bmN0aW9uKHZhcmlhbnQpIHtcbiAgICAgIHJldHVybiBpbmhlcml0JDEobW9kZSwgeyB2YXJpYW50czogbnVsbCB9LCB2YXJpYW50KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIEVYUEFORFxuICAvLyBpZiB3ZSBoYXZlIHZhcmlhbnRzIHRoZW4gZXNzZW50aWFsbHkgXCJyZXBsYWNlXCIgdGhlIG1vZGUgd2l0aCB0aGUgdmFyaWFudHNcbiAgLy8gdGhpcyBoYXBwZW5zIGluIGNvbXBpbGVNb2RlLCB3aGVyZSB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBmcm9tXG4gIGlmIChtb2RlLmNhY2hlZFZhcmlhbnRzKSB7XG4gICAgcmV0dXJuIG1vZGUuY2FjaGVkVmFyaWFudHM7XG4gIH1cblxuICAvLyBDTE9ORVxuICAvLyBpZiB3ZSBoYXZlIGRlcGVuZGVuY2llcyBvbiBwYXJlbnRzIHRoZW4gd2UgbmVlZCBhIHVuaXF1ZVxuICAvLyBpbnN0YW5jZSBvZiBvdXJzZWx2ZXMsIHNvIHdlIGNhbiBiZSByZXVzZWQgd2l0aCBtYW55XG4gIC8vIGRpZmZlcmVudCBwYXJlbnRzIHdpdGhvdXQgaXNzdWVcbiAgaWYgKGRlcGVuZGVuY3lPblBhcmVudChtb2RlKSkge1xuICAgIHJldHVybiBpbmhlcml0JDEobW9kZSwgeyBzdGFydHM6IG1vZGUuc3RhcnRzID8gaW5oZXJpdCQxKG1vZGUuc3RhcnRzKSA6IG51bGwgfSk7XG4gIH1cblxuICBpZiAoT2JqZWN0LmlzRnJvemVuKG1vZGUpKSB7XG4gICAgcmV0dXJuIGluaGVyaXQkMShtb2RlKTtcbiAgfVxuXG4gIC8vIG5vIHNwZWNpYWwgZGVwZW5kZW5jeSBpc3N1ZXMsIGp1c3QgcmV0dXJuIG91cnNlbHZlc1xuICByZXR1cm4gbW9kZTtcbn1cblxudmFyIHZlcnNpb24gPSBcIjExLjExLjFcIjtcblxuY2xhc3MgSFRNTEluamVjdGlvbkVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihyZWFzb24sIGh0bWwpIHtcbiAgICBzdXBlcihyZWFzb24pO1xuICAgIHRoaXMubmFtZSA9IFwiSFRNTEluamVjdGlvbkVycm9yXCI7XG4gICAgdGhpcy5odG1sID0gaHRtbDtcbiAgfVxufVxuXG4vKlxuU3ludGF4IGhpZ2hsaWdodGluZyB3aXRoIGxhbmd1YWdlIGF1dG9kZXRlY3Rpb24uXG5odHRwczovL2hpZ2hsaWdodGpzLm9yZy9cbiovXG5cblxuXG4vKipcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLk1vZGV9IE1vZGVcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLkNvbXBpbGVkTW9kZX0gQ29tcGlsZWRNb2RlXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5Db21waWxlZFNjb3BlfSBDb21waWxlZFNjb3BlXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5MYW5ndWFnZX0gTGFuZ3VhZ2VcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLkhMSlNBcGl9IEhMSlNBcGlcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLkhMSlNQbHVnaW59IEhMSlNQbHVnaW5cbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLlBsdWdpbkV2ZW50fSBQbHVnaW5FdmVudFxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuSExKU09wdGlvbnN9IEhMSlNPcHRpb25zXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5MYW5ndWFnZUZufSBMYW5ndWFnZUZuXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5IaWdobGlnaHRlZEhUTUxFbGVtZW50fSBIaWdobGlnaHRlZEhUTUxFbGVtZW50XG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5CZWZvcmVIaWdobGlnaHRDb250ZXh0fSBCZWZvcmVIaWdobGlnaHRDb250ZXh0XG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMvcHJpdmF0ZScpLk1hdGNoVHlwZX0gTWF0Y2hUeXBlXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMvcHJpdmF0ZScpLktleXdvcmREYXRhfSBLZXl3b3JkRGF0YVxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzL3ByaXZhdGUnKS5FbmhhbmNlZE1hdGNofSBFbmhhbmNlZE1hdGNoXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMvcHJpdmF0ZScpLkFubm90YXRlZEVycm9yfSBBbm5vdGF0ZWRFcnJvclxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQXV0b0hpZ2hsaWdodFJlc3VsdH0gQXV0b0hpZ2hsaWdodFJlc3VsdFxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuSGlnaGxpZ2h0T3B0aW9uc30gSGlnaGxpZ2h0T3B0aW9uc1xuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuSGlnaGxpZ2h0UmVzdWx0fSBIaWdobGlnaHRSZXN1bHRcbiovXG5cblxuY29uc3QgZXNjYXBlID0gZXNjYXBlSFRNTDtcbmNvbnN0IGluaGVyaXQgPSBpbmhlcml0JDE7XG5jb25zdCBOT19NQVRDSCA9IFN5bWJvbChcIm5vbWF0Y2hcIik7XG5jb25zdCBNQVhfS0VZV09SRF9ISVRTID0gNztcblxuLyoqXG4gKiBAcGFyYW0ge2FueX0gaGxqcyAtIG9iamVjdCB0aGF0IGlzIGV4dGVuZGVkIChsZWdhY3kpXG4gKiBAcmV0dXJucyB7SExKU0FwaX1cbiAqL1xuY29uc3QgSExKUyA9IGZ1bmN0aW9uKGhsanMpIHtcbiAgLy8gR2xvYmFsIGludGVybmFsIHZhcmlhYmxlcyB1c2VkIHdpdGhpbiB0aGUgaGlnaGxpZ2h0LmpzIGxpYnJhcnkuXG4gIC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgTGFuZ3VhZ2U+fSAqL1xuICBjb25zdCBsYW5ndWFnZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHN0cmluZz59ICovXG4gIGNvbnN0IGFsaWFzZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAvKiogQHR5cGUge0hMSlNQbHVnaW5bXX0gKi9cbiAgY29uc3QgcGx1Z2lucyA9IFtdO1xuXG4gIC8vIHNhZmUvcHJvZHVjdGlvbiBtb2RlIC0gc3dhbGxvd3MgbW9yZSBlcnJvcnMsIHRyaWVzIHRvIGtlZXAgcnVubmluZ1xuICAvLyBldmVuIGlmIGEgc2luZ2xlIHN5bnRheCBvciBwYXJzZSBoaXRzIGEgZmF0YWwgZXJyb3JcbiAgbGV0IFNBRkVfTU9ERSA9IHRydWU7XG4gIGNvbnN0IExBTkdVQUdFX05PVF9GT1VORCA9IFwiQ291bGQgbm90IGZpbmQgdGhlIGxhbmd1YWdlICd7fScsIGRpZCB5b3UgZm9yZ2V0IHRvIGxvYWQvaW5jbHVkZSBhIGxhbmd1YWdlIG1vZHVsZT9cIjtcbiAgLyoqIEB0eXBlIHtMYW5ndWFnZX0gKi9cbiAgY29uc3QgUExBSU5URVhUX0xBTkdVQUdFID0geyBkaXNhYmxlQXV0b2RldGVjdDogdHJ1ZSwgbmFtZTogJ1BsYWluIHRleHQnLCBjb250YWluczogW10gfTtcblxuICAvLyBHbG9iYWwgb3B0aW9ucyB1c2VkIHdoZW4gd2l0aGluIGV4dGVybmFsIEFQSXMuIFRoaXMgaXMgbW9kaWZpZWQgd2hlblxuICAvLyBjYWxsaW5nIHRoZSBgaGxqcy5jb25maWd1cmVgIGZ1bmN0aW9uLlxuICAvKiogQHR5cGUgSExKU09wdGlvbnMgKi9cbiAgbGV0IG9wdGlvbnMgPSB7XG4gICAgaWdub3JlVW5lc2NhcGVkSFRNTDogZmFsc2UsXG4gICAgdGhyb3dVbmVzY2FwZWRIVE1MOiBmYWxzZSxcbiAgICBub0hpZ2hsaWdodFJlOiAvXihuby0/aGlnaGxpZ2h0KSQvaSxcbiAgICBsYW5ndWFnZURldGVjdFJlOiAvXFxibGFuZyg/OnVhZ2UpPy0oW1xcdy1dKylcXGIvaSxcbiAgICBjbGFzc1ByZWZpeDogJ2hsanMtJyxcbiAgICBjc3NTZWxlY3RvcjogJ3ByZSBjb2RlJyxcbiAgICBsYW5ndWFnZXM6IG51bGwsXG4gICAgLy8gYmV0YSBjb25maWd1cmF0aW9uIG9wdGlvbnMsIHN1YmplY3QgdG8gY2hhbmdlLCB3ZWxjb21lIHRvIGRpc2N1c3NcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vaGlnaGxpZ2h0anMvaGlnaGxpZ2h0LmpzL2lzc3Vlcy8xMDg2XG4gICAgX19lbWl0dGVyOiBUb2tlblRyZWVFbWl0dGVyXG4gIH07XG5cbiAgLyogVXRpbGl0eSBmdW5jdGlvbnMgKi9cblxuICAvKipcbiAgICogVGVzdHMgYSBsYW5ndWFnZSBuYW1lIHRvIHNlZSBpZiBoaWdobGlnaHRpbmcgc2hvdWxkIGJlIHNraXBwZWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGxhbmd1YWdlTmFtZVxuICAgKi9cbiAgZnVuY3Rpb24gc2hvdWxkTm90SGlnaGxpZ2h0KGxhbmd1YWdlTmFtZSkge1xuICAgIHJldHVybiBvcHRpb25zLm5vSGlnaGxpZ2h0UmUudGVzdChsYW5ndWFnZU5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7SGlnaGxpZ2h0ZWRIVE1MRWxlbWVudH0gYmxvY2sgLSB0aGUgSFRNTCBlbGVtZW50IHRvIGRldGVybWluZSBsYW5ndWFnZSBmb3JcbiAgICovXG4gIGZ1bmN0aW9uIGJsb2NrTGFuZ3VhZ2UoYmxvY2spIHtcbiAgICBsZXQgY2xhc3NlcyA9IGJsb2NrLmNsYXNzTmFtZSArICcgJztcblxuICAgIGNsYXNzZXMgKz0gYmxvY2sucGFyZW50Tm9kZSA/IGJsb2NrLnBhcmVudE5vZGUuY2xhc3NOYW1lIDogJyc7XG5cbiAgICAvLyBsYW5ndWFnZS0qIHRha2VzIHByZWNlZGVuY2Ugb3ZlciBub24tcHJlZml4ZWQgY2xhc3MgbmFtZXMuXG4gICAgY29uc3QgbWF0Y2ggPSBvcHRpb25zLmxhbmd1YWdlRGV0ZWN0UmUuZXhlYyhjbGFzc2VzKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIGNvbnN0IGxhbmd1YWdlID0gZ2V0TGFuZ3VhZ2UobWF0Y2hbMV0pO1xuICAgICAgaWYgKCFsYW5ndWFnZSkge1xuICAgICAgICB3YXJuKExBTkdVQUdFX05PVF9GT1VORC5yZXBsYWNlKFwie31cIiwgbWF0Y2hbMV0pKTtcbiAgICAgICAgd2FybihcIkZhbGxpbmcgYmFjayB0byBuby1oaWdobGlnaHQgbW9kZSBmb3IgdGhpcyBibG9jay5cIiwgYmxvY2spO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxhbmd1YWdlID8gbWF0Y2hbMV0gOiAnbm8taGlnaGxpZ2h0JztcbiAgICB9XG5cbiAgICByZXR1cm4gY2xhc3Nlc1xuICAgICAgLnNwbGl0KC9cXHMrLylcbiAgICAgIC5maW5kKChfY2xhc3MpID0+IHNob3VsZE5vdEhpZ2hsaWdodChfY2xhc3MpIHx8IGdldExhbmd1YWdlKF9jbGFzcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvcmUgaGlnaGxpZ2h0aW5nIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBPTEQgQVBJXG4gICAqIGhpZ2hsaWdodChsYW5nLCBjb2RlLCBpZ25vcmVJbGxlZ2FscywgY29udGludWF0aW9uKVxuICAgKlxuICAgKiBORVcgQVBJXG4gICAqIGhpZ2hsaWdodChjb2RlLCB7bGFuZywgaWdub3JlSWxsZWdhbHN9KVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZU9yTGFuZ3VhZ2VOYW1lIC0gdGhlIGxhbmd1YWdlIHRvIHVzZSBmb3IgaGlnaGxpZ2h0aW5nXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgSGlnaGxpZ2h0T3B0aW9uc30gb3B0aW9uc09yQ29kZSAtIHRoZSBjb2RlIHRvIGhpZ2hsaWdodFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpZ25vcmVJbGxlZ2Fsc10gLSB3aGV0aGVyIHRvIGlnbm9yZSBpbGxlZ2FsIG1hdGNoZXMsIGRlZmF1bHQgaXMgdG8gYmFpbFxuICAgKlxuICAgKiBAcmV0dXJucyB7SGlnaGxpZ2h0UmVzdWx0fSBSZXN1bHQgLSBhbiBvYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSByZXN1bHRcbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IGxhbmd1YWdlIC0gdGhlIGxhbmd1YWdlIG5hbWVcbiAgICogQHByb3BlcnR5IHtudW1iZXJ9IHJlbGV2YW5jZSAtIHRoZSByZWxldmFuY2Ugc2NvcmVcbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IHZhbHVlIC0gdGhlIGhpZ2hsaWdodGVkIEhUTUwgY29kZVxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gY29kZSAtIHRoZSBvcmlnaW5hbCByYXcgY29kZVxuICAgKiBAcHJvcGVydHkge0NvbXBpbGVkTW9kZX0gdG9wIC0gdG9wIG9mIHRoZSBjdXJyZW50IG1vZGUgc3RhY2tcbiAgICogQHByb3BlcnR5IHtib29sZWFufSBpbGxlZ2FsIC0gaW5kaWNhdGVzIHdoZXRoZXIgYW55IGlsbGVnYWwgbWF0Y2hlcyB3ZXJlIGZvdW5kXG4gICovXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodChjb2RlT3JMYW5ndWFnZU5hbWUsIG9wdGlvbnNPckNvZGUsIGlnbm9yZUlsbGVnYWxzKSB7XG4gICAgbGV0IGNvZGUgPSBcIlwiO1xuICAgIGxldCBsYW5ndWFnZU5hbWUgPSBcIlwiO1xuICAgIGlmICh0eXBlb2Ygb3B0aW9uc09yQ29kZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgY29kZSA9IGNvZGVPckxhbmd1YWdlTmFtZTtcbiAgICAgIGlnbm9yZUlsbGVnYWxzID0gb3B0aW9uc09yQ29kZS5pZ25vcmVJbGxlZ2FscztcbiAgICAgIGxhbmd1YWdlTmFtZSA9IG9wdGlvbnNPckNvZGUubGFuZ3VhZ2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIG9sZCBBUElcbiAgICAgIGRlcHJlY2F0ZWQoXCIxMC43LjBcIiwgXCJoaWdobGlnaHQobGFuZywgY29kZSwgLi4uYXJncykgaGFzIGJlZW4gZGVwcmVjYXRlZC5cIik7XG4gICAgICBkZXByZWNhdGVkKFwiMTAuNy4wXCIsIFwiUGxlYXNlIHVzZSBoaWdobGlnaHQoY29kZSwgb3B0aW9ucykgaW5zdGVhZC5cXG5odHRwczovL2dpdGh1Yi5jb20vaGlnaGxpZ2h0anMvaGlnaGxpZ2h0LmpzL2lzc3Vlcy8yMjc3XCIpO1xuICAgICAgbGFuZ3VhZ2VOYW1lID0gY29kZU9yTGFuZ3VhZ2VOYW1lO1xuICAgICAgY29kZSA9IG9wdGlvbnNPckNvZGU7XG4gICAgfVxuXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2hpZ2hsaWdodGpzL2hpZ2hsaWdodC5qcy9pc3N1ZXMvMzE0OVxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZmluZWRcbiAgICBpZiAoaWdub3JlSWxsZWdhbHMgPT09IHVuZGVmaW5lZCkgeyBpZ25vcmVJbGxlZ2FscyA9IHRydWU7IH1cblxuICAgIC8qKiBAdHlwZSB7QmVmb3JlSGlnaGxpZ2h0Q29udGV4dH0gKi9cbiAgICBjb25zdCBjb250ZXh0ID0ge1xuICAgICAgY29kZSxcbiAgICAgIGxhbmd1YWdlOiBsYW5ndWFnZU5hbWVcbiAgICB9O1xuICAgIC8vIHRoZSBwbHVnaW4gY2FuIGNoYW5nZSB0aGUgZGVzaXJlZCBsYW5ndWFnZSBvciB0aGUgY29kZSB0byBiZSBoaWdobGlnaHRlZFxuICAgIC8vIGp1c3QgYmUgY2hhbmdpbmcgdGhlIG9iamVjdCBpdCB3YXMgcGFzc2VkXG4gICAgZmlyZShcImJlZm9yZTpoaWdobGlnaHRcIiwgY29udGV4dCk7XG5cbiAgICAvLyBhIGJlZm9yZSBwbHVnaW4gY2FuIHVzdXJwIHRoZSByZXN1bHQgY29tcGxldGVseSBieSBwcm92aWRpbmcgaXQncyBvd25cbiAgICAvLyBpbiB3aGljaCBjYXNlIHdlIGRvbid0IGV2ZW4gbmVlZCB0byBjYWxsIGhpZ2hsaWdodFxuICAgIGNvbnN0IHJlc3VsdCA9IGNvbnRleHQucmVzdWx0XG4gICAgICA/IGNvbnRleHQucmVzdWx0XG4gICAgICA6IF9oaWdobGlnaHQoY29udGV4dC5sYW5ndWFnZSwgY29udGV4dC5jb2RlLCBpZ25vcmVJbGxlZ2Fscyk7XG5cbiAgICByZXN1bHQuY29kZSA9IGNvbnRleHQuY29kZTtcbiAgICAvLyB0aGUgcGx1Z2luIGNhbiBjaGFuZ2UgYW55dGhpbmcgaW4gcmVzdWx0IHRvIHN1aXRlIGl0XG4gICAgZmlyZShcImFmdGVyOmhpZ2hsaWdodFwiLCByZXN1bHQpO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBwcml2YXRlIGhpZ2hsaWdodCB0aGF0J3MgdXNlZCBpbnRlcm5hbGx5IGFuZCBkb2VzIG5vdCBmaXJlIGNhbGxiYWNrc1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2VOYW1lIC0gdGhlIGxhbmd1YWdlIHRvIHVzZSBmb3IgaGlnaGxpZ2h0aW5nXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlVG9IaWdobGlnaHQgLSB0aGUgY29kZSB0byBoaWdobGlnaHRcbiAgICogQHBhcmFtIHtib29sZWFuP30gW2lnbm9yZUlsbGVnYWxzXSAtIHdoZXRoZXIgdG8gaWdub3JlIGlsbGVnYWwgbWF0Y2hlcywgZGVmYXVsdCBpcyB0byBiYWlsXG4gICAqIEBwYXJhbSB7Q29tcGlsZWRNb2RlP30gW2NvbnRpbnVhdGlvbl0gLSBjdXJyZW50IGNvbnRpbnVhdGlvbiBtb2RlLCBpZiBhbnlcbiAgICogQHJldHVybnMge0hpZ2hsaWdodFJlc3VsdH0gLSByZXN1bHQgb2YgdGhlIGhpZ2hsaWdodCBvcGVyYXRpb25cbiAgKi9cbiAgZnVuY3Rpb24gX2hpZ2hsaWdodChsYW5ndWFnZU5hbWUsIGNvZGVUb0hpZ2hsaWdodCwgaWdub3JlSWxsZWdhbHMsIGNvbnRpbnVhdGlvbikge1xuICAgIGNvbnN0IGtleXdvcmRIaXRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybiBrZXl3b3JkIGRhdGEgaWYgYSBtYXRjaCBpcyBhIGtleXdvcmRcbiAgICAgKiBAcGFyYW0ge0NvbXBpbGVkTW9kZX0gbW9kZSAtIGN1cnJlbnQgbW9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtYXRjaFRleHQgLSB0aGUgdGV4dHVhbCBtYXRjaFxuICAgICAqIEByZXR1cm5zIHtLZXl3b3JkRGF0YSB8IGZhbHNlfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGtleXdvcmREYXRhKG1vZGUsIG1hdGNoVGV4dCkge1xuICAgICAgcmV0dXJuIG1vZGUua2V5d29yZHNbbWF0Y2hUZXh0XTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzS2V5d29yZHMoKSB7XG4gICAgICBpZiAoIXRvcC5rZXl3b3Jkcykge1xuICAgICAgICBlbWl0dGVyLmFkZFRleHQobW9kZUJ1ZmZlcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgbGV0IGxhc3RJbmRleCA9IDA7XG4gICAgICB0b3Aua2V5d29yZFBhdHRlcm5SZS5sYXN0SW5kZXggPSAwO1xuICAgICAgbGV0IG1hdGNoID0gdG9wLmtleXdvcmRQYXR0ZXJuUmUuZXhlYyhtb2RlQnVmZmVyKTtcbiAgICAgIGxldCBidWYgPSBcIlwiO1xuXG4gICAgICB3aGlsZSAobWF0Y2gpIHtcbiAgICAgICAgYnVmICs9IG1vZGVCdWZmZXIuc3Vic3RyaW5nKGxhc3RJbmRleCwgbWF0Y2guaW5kZXgpO1xuICAgICAgICBjb25zdCB3b3JkID0gbGFuZ3VhZ2UuY2FzZV9pbnNlbnNpdGl2ZSA/IG1hdGNoWzBdLnRvTG93ZXJDYXNlKCkgOiBtYXRjaFswXTtcbiAgICAgICAgY29uc3QgZGF0YSA9IGtleXdvcmREYXRhKHRvcCwgd29yZCk7XG4gICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgY29uc3QgW2tpbmQsIGtleXdvcmRSZWxldmFuY2VdID0gZGF0YTtcbiAgICAgICAgICBlbWl0dGVyLmFkZFRleHQoYnVmKTtcbiAgICAgICAgICBidWYgPSBcIlwiO1xuXG4gICAgICAgICAga2V5d29yZEhpdHNbd29yZF0gPSAoa2V5d29yZEhpdHNbd29yZF0gfHwgMCkgKyAxO1xuICAgICAgICAgIGlmIChrZXl3b3JkSGl0c1t3b3JkXSA8PSBNQVhfS0VZV09SRF9ISVRTKSByZWxldmFuY2UgKz0ga2V5d29yZFJlbGV2YW5jZTtcbiAgICAgICAgICBpZiAoa2luZC5zdGFydHNXaXRoKFwiX1wiKSkge1xuICAgICAgICAgICAgLy8gXyBpbXBsaWVkIGZvciByZWxldmFuY2Ugb25seSwgZG8gbm90IGhpZ2hsaWdodFxuICAgICAgICAgICAgLy8gYnkgYXBwbHlpbmcgYSBjbGFzcyBuYW1lXG4gICAgICAgICAgICBidWYgKz0gbWF0Y2hbMF07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGNzc0NsYXNzID0gbGFuZ3VhZ2UuY2xhc3NOYW1lQWxpYXNlc1traW5kXSB8fCBraW5kO1xuICAgICAgICAgICAgZW1pdEtleXdvcmQobWF0Y2hbMF0sIGNzc0NsYXNzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnVmICs9IG1hdGNoWzBdO1xuICAgICAgICB9XG4gICAgICAgIGxhc3RJbmRleCA9IHRvcC5rZXl3b3JkUGF0dGVyblJlLmxhc3RJbmRleDtcbiAgICAgICAgbWF0Y2ggPSB0b3Aua2V5d29yZFBhdHRlcm5SZS5leGVjKG1vZGVCdWZmZXIpO1xuICAgICAgfVxuICAgICAgYnVmICs9IG1vZGVCdWZmZXIuc3Vic3RyaW5nKGxhc3RJbmRleCk7XG4gICAgICBlbWl0dGVyLmFkZFRleHQoYnVmKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzU3ViTGFuZ3VhZ2UoKSB7XG4gICAgICBpZiAobW9kZUJ1ZmZlciA9PT0gXCJcIikgcmV0dXJuO1xuICAgICAgLyoqIEB0eXBlIEhpZ2hsaWdodFJlc3VsdCAqL1xuICAgICAgbGV0IHJlc3VsdCA9IG51bGw7XG5cbiAgICAgIGlmICh0eXBlb2YgdG9wLnN1Ykxhbmd1YWdlID09PSAnc3RyaW5nJykge1xuICAgICAgICBpZiAoIWxhbmd1YWdlc1t0b3Auc3ViTGFuZ3VhZ2VdKSB7XG4gICAgICAgICAgZW1pdHRlci5hZGRUZXh0KG1vZGVCdWZmZXIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgPSBfaGlnaGxpZ2h0KHRvcC5zdWJMYW5ndWFnZSwgbW9kZUJ1ZmZlciwgdHJ1ZSwgY29udGludWF0aW9uc1t0b3Auc3ViTGFuZ3VhZ2VdKTtcbiAgICAgICAgY29udGludWF0aW9uc1t0b3Auc3ViTGFuZ3VhZ2VdID0gLyoqIEB0eXBlIHtDb21waWxlZE1vZGV9ICovIChyZXN1bHQuX3RvcCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQgPSBoaWdobGlnaHRBdXRvKG1vZGVCdWZmZXIsIHRvcC5zdWJMYW5ndWFnZS5sZW5ndGggPyB0b3Auc3ViTGFuZ3VhZ2UgOiBudWxsKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ291bnRpbmcgZW1iZWRkZWQgbGFuZ3VhZ2Ugc2NvcmUgdG93YXJkcyB0aGUgaG9zdCBsYW5ndWFnZSBtYXkgYmUgZGlzYWJsZWRcbiAgICAgIC8vIHdpdGggemVyb2luZyB0aGUgY29udGFpbmluZyBtb2RlIHJlbGV2YW5jZS4gVXNlIGNhc2UgaW4gcG9pbnQgaXMgTWFya2Rvd24gdGhhdFxuICAgICAgLy8gYWxsb3dzIFhNTCBldmVyeXdoZXJlIGFuZCBtYWtlcyBldmVyeSBYTUwgc25pcHBldCB0byBoYXZlIGEgbXVjaCBsYXJnZXIgTWFya2Rvd25cbiAgICAgIC8vIHNjb3JlLlxuICAgICAgaWYgKHRvcC5yZWxldmFuY2UgPiAwKSB7XG4gICAgICAgIHJlbGV2YW5jZSArPSByZXN1bHQucmVsZXZhbmNlO1xuICAgICAgfVxuICAgICAgZW1pdHRlci5fX2FkZFN1Ymxhbmd1YWdlKHJlc3VsdC5fZW1pdHRlciwgcmVzdWx0Lmxhbmd1YWdlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzQnVmZmVyKCkge1xuICAgICAgaWYgKHRvcC5zdWJMYW5ndWFnZSAhPSBudWxsKSB7XG4gICAgICAgIHByb2Nlc3NTdWJMYW5ndWFnZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJvY2Vzc0tleXdvcmRzKCk7XG4gICAgICB9XG4gICAgICBtb2RlQnVmZmVyID0gJyc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2NvcGVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBlbWl0S2V5d29yZChrZXl3b3JkLCBzY29wZSkge1xuICAgICAgaWYgKGtleXdvcmQgPT09IFwiXCIpIHJldHVybjtcblxuICAgICAgZW1pdHRlci5zdGFydFNjb3BlKHNjb3BlKTtcbiAgICAgIGVtaXR0ZXIuYWRkVGV4dChrZXl3b3JkKTtcbiAgICAgIGVtaXR0ZXIuZW5kU2NvcGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge0NvbXBpbGVkU2NvcGV9IHNjb3BlXG4gICAgICogQHBhcmFtIHtSZWdFeHBNYXRjaEFycmF5fSBtYXRjaFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGVtaXRNdWx0aUNsYXNzKHNjb3BlLCBtYXRjaCkge1xuICAgICAgbGV0IGkgPSAxO1xuICAgICAgY29uc3QgbWF4ID0gbWF0Y2gubGVuZ3RoIC0gMTtcbiAgICAgIHdoaWxlIChpIDw9IG1heCkge1xuICAgICAgICBpZiAoIXNjb3BlLl9lbWl0W2ldKSB7IGkrKzsgY29udGludWU7IH1cbiAgICAgICAgY29uc3Qga2xhc3MgPSBsYW5ndWFnZS5jbGFzc05hbWVBbGlhc2VzW3Njb3BlW2ldXSB8fCBzY29wZVtpXTtcbiAgICAgICAgY29uc3QgdGV4dCA9IG1hdGNoW2ldO1xuICAgICAgICBpZiAoa2xhc3MpIHtcbiAgICAgICAgICBlbWl0S2V5d29yZCh0ZXh0LCBrbGFzcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbW9kZUJ1ZmZlciA9IHRleHQ7XG4gICAgICAgICAgcHJvY2Vzc0tleXdvcmRzKCk7XG4gICAgICAgICAgbW9kZUJ1ZmZlciA9IFwiXCI7XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7Q29tcGlsZWRNb2RlfSBtb2RlIC0gbmV3IG1vZGUgdG8gc3RhcnRcbiAgICAgKiBAcGFyYW0ge1JlZ0V4cE1hdGNoQXJyYXl9IG1hdGNoXG4gICAgICovXG4gICAgZnVuY3Rpb24gc3RhcnROZXdNb2RlKG1vZGUsIG1hdGNoKSB7XG4gICAgICBpZiAobW9kZS5zY29wZSAmJiB0eXBlb2YgbW9kZS5zY29wZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBlbWl0dGVyLm9wZW5Ob2RlKGxhbmd1YWdlLmNsYXNzTmFtZUFsaWFzZXNbbW9kZS5zY29wZV0gfHwgbW9kZS5zY29wZSk7XG4gICAgICB9XG4gICAgICBpZiAobW9kZS5iZWdpblNjb3BlKSB7XG4gICAgICAgIC8vIGJlZ2luU2NvcGUganVzdCB3cmFwcyB0aGUgYmVnaW4gbWF0Y2ggaXRzZWxmIGluIGEgc2NvcGVcbiAgICAgICAgaWYgKG1vZGUuYmVnaW5TY29wZS5fd3JhcCkge1xuICAgICAgICAgIGVtaXRLZXl3b3JkKG1vZGVCdWZmZXIsIGxhbmd1YWdlLmNsYXNzTmFtZUFsaWFzZXNbbW9kZS5iZWdpblNjb3BlLl93cmFwXSB8fCBtb2RlLmJlZ2luU2NvcGUuX3dyYXApO1xuICAgICAgICAgIG1vZGVCdWZmZXIgPSBcIlwiO1xuICAgICAgICB9IGVsc2UgaWYgKG1vZGUuYmVnaW5TY29wZS5fbXVsdGkpIHtcbiAgICAgICAgICAvLyBhdCB0aGlzIHBvaW50IG1vZGVCdWZmZXIgc2hvdWxkIGp1c3QgYmUgdGhlIG1hdGNoXG4gICAgICAgICAgZW1pdE11bHRpQ2xhc3MobW9kZS5iZWdpblNjb3BlLCBtYXRjaCk7XG4gICAgICAgICAgbW9kZUJ1ZmZlciA9IFwiXCI7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdG9wID0gT2JqZWN0LmNyZWF0ZShtb2RlLCB7IHBhcmVudDogeyB2YWx1ZTogdG9wIH0gfSk7XG4gICAgICByZXR1cm4gdG9wO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7Q29tcGlsZWRNb2RlIH0gbW9kZSAtIHRoZSBtb2RlIHRvIHBvdGVudGlhbGx5IGVuZFxuICAgICAqIEBwYXJhbSB7UmVnRXhwTWF0Y2hBcnJheX0gbWF0Y2ggLSB0aGUgbGF0ZXN0IG1hdGNoXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1hdGNoUGx1c1JlbWFpbmRlciAtIG1hdGNoIHBsdXMgcmVtYWluZGVyIG9mIGNvbnRlbnRcbiAgICAgKiBAcmV0dXJucyB7Q29tcGlsZWRNb2RlIHwgdm9pZH0gLSB0aGUgbmV4dCBtb2RlLCBvciBpZiB2b2lkIGNvbnRpbnVlIG9uIGluIGN1cnJlbnQgbW9kZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGVuZE9mTW9kZShtb2RlLCBtYXRjaCwgbWF0Y2hQbHVzUmVtYWluZGVyKSB7XG4gICAgICBsZXQgbWF0Y2hlZCA9IHN0YXJ0c1dpdGgobW9kZS5lbmRSZSwgbWF0Y2hQbHVzUmVtYWluZGVyKTtcblxuICAgICAgaWYgKG1hdGNoZWQpIHtcbiAgICAgICAgaWYgKG1vZGVbXCJvbjplbmRcIl0pIHtcbiAgICAgICAgICBjb25zdCByZXNwID0gbmV3IFJlc3BvbnNlKG1vZGUpO1xuICAgICAgICAgIG1vZGVbXCJvbjplbmRcIl0obWF0Y2gsIHJlc3ApO1xuICAgICAgICAgIGlmIChyZXNwLmlzTWF0Y2hJZ25vcmVkKSBtYXRjaGVkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWF0Y2hlZCkge1xuICAgICAgICAgIHdoaWxlIChtb2RlLmVuZHNQYXJlbnQgJiYgbW9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgIG1vZGUgPSBtb2RlLnBhcmVudDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG1vZGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGV2ZW4gaWYgb246ZW5kIGZpcmVzIGFuIGBpZ25vcmVgIGl0J3Mgc3RpbGwgcG9zc2libGVcbiAgICAgIC8vIHRoYXQgd2UgbWlnaHQgdHJpZ2dlciB0aGUgZW5kIG5vZGUgYmVjYXVzZSBvZiBhIHBhcmVudCBtb2RlXG4gICAgICBpZiAobW9kZS5lbmRzV2l0aFBhcmVudCkge1xuICAgICAgICByZXR1cm4gZW5kT2ZNb2RlKG1vZGUucGFyZW50LCBtYXRjaCwgbWF0Y2hQbHVzUmVtYWluZGVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGUgbWF0Y2hpbmcgYnV0IHRoZW4gaWdub3JpbmcgYSBzZXF1ZW5jZSBvZiB0ZXh0XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbGV4ZW1lIC0gc3RyaW5nIGNvbnRhaW5pbmcgZnVsbCBtYXRjaCB0ZXh0XG4gICAgICovXG4gICAgZnVuY3Rpb24gZG9JZ25vcmUobGV4ZW1lKSB7XG4gICAgICBpZiAodG9wLm1hdGNoZXIucmVnZXhJbmRleCA9PT0gMCkge1xuICAgICAgICAvLyBubyBtb3JlIHJlZ2V4ZXMgdG8gcG90ZW50aWFsbHkgbWF0Y2ggaGVyZSwgc28gd2UgbW92ZSB0aGUgY3Vyc29yIGZvcndhcmQgb25lXG4gICAgICAgIC8vIHNwYWNlXG4gICAgICAgIG1vZGVCdWZmZXIgKz0gbGV4ZW1lWzBdO1xuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIG5vIG5lZWQgdG8gbW92ZSB0aGUgY3Vyc29yLCB3ZSBzdGlsbCBoYXZlIGFkZGl0aW9uYWwgcmVnZXhlcyB0byB0cnkgYW5kXG4gICAgICAgIC8vIG1hdGNoIGF0IHRoaXMgdmVyeSBzcG90XG4gICAgICAgIHJlc3VtZVNjYW5BdFNhbWVQb3NpdGlvbiA9IHRydWU7XG4gICAgICAgIHJldHVybiAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhhbmRsZSB0aGUgc3RhcnQgb2YgYSBuZXcgcG90ZW50aWFsIG1vZGUgbWF0Y2hcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RW5oYW5jZWRNYXRjaH0gbWF0Y2ggLSB0aGUgY3VycmVudCBtYXRjaFxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IGhvdyBmYXIgdG8gYWR2YW5jZSB0aGUgcGFyc2UgY3Vyc29yXG4gICAgICovXG4gICAgZnVuY3Rpb24gZG9CZWdpbk1hdGNoKG1hdGNoKSB7XG4gICAgICBjb25zdCBsZXhlbWUgPSBtYXRjaFswXTtcbiAgICAgIGNvbnN0IG5ld01vZGUgPSBtYXRjaC5ydWxlO1xuXG4gICAgICBjb25zdCByZXNwID0gbmV3IFJlc3BvbnNlKG5ld01vZGUpO1xuICAgICAgLy8gZmlyc3QgaW50ZXJuYWwgYmVmb3JlIGNhbGxiYWNrcywgdGhlbiB0aGUgcHVibGljIG9uZXNcbiAgICAgIGNvbnN0IGJlZm9yZUNhbGxiYWNrcyA9IFtuZXdNb2RlLl9fYmVmb3JlQmVnaW4sIG5ld01vZGVbXCJvbjpiZWdpblwiXV07XG4gICAgICBmb3IgKGNvbnN0IGNiIG9mIGJlZm9yZUNhbGxiYWNrcykge1xuICAgICAgICBpZiAoIWNiKSBjb250aW51ZTtcbiAgICAgICAgY2IobWF0Y2gsIHJlc3ApO1xuICAgICAgICBpZiAocmVzcC5pc01hdGNoSWdub3JlZCkgcmV0dXJuIGRvSWdub3JlKGxleGVtZSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChuZXdNb2RlLnNraXApIHtcbiAgICAgICAgbW9kZUJ1ZmZlciArPSBsZXhlbWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobmV3TW9kZS5leGNsdWRlQmVnaW4pIHtcbiAgICAgICAgICBtb2RlQnVmZmVyICs9IGxleGVtZTtcbiAgICAgICAgfVxuICAgICAgICBwcm9jZXNzQnVmZmVyKCk7XG4gICAgICAgIGlmICghbmV3TW9kZS5yZXR1cm5CZWdpbiAmJiAhbmV3TW9kZS5leGNsdWRlQmVnaW4pIHtcbiAgICAgICAgICBtb2RlQnVmZmVyID0gbGV4ZW1lO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzdGFydE5ld01vZGUobmV3TW9kZSwgbWF0Y2gpO1xuICAgICAgcmV0dXJuIG5ld01vZGUucmV0dXJuQmVnaW4gPyAwIDogbGV4ZW1lLmxlbmd0aDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGUgdGhlIHBvdGVudGlhbCBlbmQgb2YgbW9kZVxuICAgICAqXG4gICAgICogQHBhcmFtIHtSZWdFeHBNYXRjaEFycmF5fSBtYXRjaCAtIHRoZSBjdXJyZW50IG1hdGNoXG4gICAgICovXG4gICAgZnVuY3Rpb24gZG9FbmRNYXRjaChtYXRjaCkge1xuICAgICAgY29uc3QgbGV4ZW1lID0gbWF0Y2hbMF07XG4gICAgICBjb25zdCBtYXRjaFBsdXNSZW1haW5kZXIgPSBjb2RlVG9IaWdobGlnaHQuc3Vic3RyaW5nKG1hdGNoLmluZGV4KTtcblxuICAgICAgY29uc3QgZW5kTW9kZSA9IGVuZE9mTW9kZSh0b3AsIG1hdGNoLCBtYXRjaFBsdXNSZW1haW5kZXIpO1xuICAgICAgaWYgKCFlbmRNb2RlKSB7IHJldHVybiBOT19NQVRDSDsgfVxuXG4gICAgICBjb25zdCBvcmlnaW4gPSB0b3A7XG4gICAgICBpZiAodG9wLmVuZFNjb3BlICYmIHRvcC5lbmRTY29wZS5fd3JhcCkge1xuICAgICAgICBwcm9jZXNzQnVmZmVyKCk7XG4gICAgICAgIGVtaXRLZXl3b3JkKGxleGVtZSwgdG9wLmVuZFNjb3BlLl93cmFwKTtcbiAgICAgIH0gZWxzZSBpZiAodG9wLmVuZFNjb3BlICYmIHRvcC5lbmRTY29wZS5fbXVsdGkpIHtcbiAgICAgICAgcHJvY2Vzc0J1ZmZlcigpO1xuICAgICAgICBlbWl0TXVsdGlDbGFzcyh0b3AuZW5kU2NvcGUsIG1hdGNoKTtcbiAgICAgIH0gZWxzZSBpZiAob3JpZ2luLnNraXApIHtcbiAgICAgICAgbW9kZUJ1ZmZlciArPSBsZXhlbWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIShvcmlnaW4ucmV0dXJuRW5kIHx8IG9yaWdpbi5leGNsdWRlRW5kKSkge1xuICAgICAgICAgIG1vZGVCdWZmZXIgKz0gbGV4ZW1lO1xuICAgICAgICB9XG4gICAgICAgIHByb2Nlc3NCdWZmZXIoKTtcbiAgICAgICAgaWYgKG9yaWdpbi5leGNsdWRlRW5kKSB7XG4gICAgICAgICAgbW9kZUJ1ZmZlciA9IGxleGVtZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZG8ge1xuICAgICAgICBpZiAodG9wLnNjb3BlKSB7XG4gICAgICAgICAgZW1pdHRlci5jbG9zZU5vZGUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRvcC5za2lwICYmICF0b3Auc3ViTGFuZ3VhZ2UpIHtcbiAgICAgICAgICByZWxldmFuY2UgKz0gdG9wLnJlbGV2YW5jZTtcbiAgICAgICAgfVxuICAgICAgICB0b3AgPSB0b3AucGFyZW50O1xuICAgICAgfSB3aGlsZSAodG9wICE9PSBlbmRNb2RlLnBhcmVudCk7XG4gICAgICBpZiAoZW5kTW9kZS5zdGFydHMpIHtcbiAgICAgICAgc3RhcnROZXdNb2RlKGVuZE1vZGUuc3RhcnRzLCBtYXRjaCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gb3JpZ2luLnJldHVybkVuZCA/IDAgOiBsZXhlbWUubGVuZ3RoO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NDb250aW51YXRpb25zKCkge1xuICAgICAgY29uc3QgbGlzdCA9IFtdO1xuICAgICAgZm9yIChsZXQgY3VycmVudCA9IHRvcDsgY3VycmVudCAhPT0gbGFuZ3VhZ2U7IGN1cnJlbnQgPSBjdXJyZW50LnBhcmVudCkge1xuICAgICAgICBpZiAoY3VycmVudC5zY29wZSkge1xuICAgICAgICAgIGxpc3QudW5zaGlmdChjdXJyZW50LnNjb3BlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbGlzdC5mb3JFYWNoKGl0ZW0gPT4gZW1pdHRlci5vcGVuTm9kZShpdGVtKSk7XG4gICAgfVxuXG4gICAgLyoqIEB0eXBlIHt7dHlwZT86IE1hdGNoVHlwZSwgaW5kZXg/OiBudW1iZXIsIHJ1bGU/OiBNb2RlfX19ICovXG4gICAgbGV0IGxhc3RNYXRjaCA9IHt9O1xuXG4gICAgLyoqXG4gICAgICogIFByb2Nlc3MgYW4gaW5kaXZpZHVhbCBtYXRjaFxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHRCZWZvcmVNYXRjaCAtIHRleHQgcHJlY2VkaW5nIHRoZSBtYXRjaCAoc2luY2UgdGhlIGxhc3QgbWF0Y2gpXG4gICAgICogQHBhcmFtIHtFbmhhbmNlZE1hdGNofSBbbWF0Y2hdIC0gdGhlIG1hdGNoIGl0c2VsZlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHByb2Nlc3NMZXhlbWUodGV4dEJlZm9yZU1hdGNoLCBtYXRjaCkge1xuICAgICAgY29uc3QgbGV4ZW1lID0gbWF0Y2ggJiYgbWF0Y2hbMF07XG5cbiAgICAgIC8vIGFkZCBub24tbWF0Y2hlZCB0ZXh0IHRvIHRoZSBjdXJyZW50IG1vZGUgYnVmZmVyXG4gICAgICBtb2RlQnVmZmVyICs9IHRleHRCZWZvcmVNYXRjaDtcblxuICAgICAgaWYgKGxleGVtZSA9PSBudWxsKSB7XG4gICAgICAgIHByb2Nlc3NCdWZmZXIoKTtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9XG5cbiAgICAgIC8vIHdlJ3ZlIGZvdW5kIGEgMCB3aWR0aCBtYXRjaCBhbmQgd2UncmUgc3R1Y2ssIHNvIHdlIG5lZWQgdG8gYWR2YW5jZVxuICAgICAgLy8gdGhpcyBoYXBwZW5zIHdoZW4gd2UgaGF2ZSBiYWRseSBiZWhhdmVkIHJ1bGVzIHRoYXQgaGF2ZSBvcHRpb25hbCBtYXRjaGVycyB0byB0aGUgZGVncmVlIHRoYXRcbiAgICAgIC8vIHNvbWV0aW1lcyB0aGV5IGNhbiBlbmQgdXAgbWF0Y2hpbmcgbm90aGluZyBhdCBhbGxcbiAgICAgIC8vIFJlZjogaHR0cHM6Ly9naXRodWIuY29tL2hpZ2hsaWdodGpzL2hpZ2hsaWdodC5qcy9pc3N1ZXMvMjE0MFxuICAgICAgaWYgKGxhc3RNYXRjaC50eXBlID09PSBcImJlZ2luXCIgJiYgbWF0Y2gudHlwZSA9PT0gXCJlbmRcIiAmJiBsYXN0TWF0Y2guaW5kZXggPT09IG1hdGNoLmluZGV4ICYmIGxleGVtZSA9PT0gXCJcIikge1xuICAgICAgICAvLyBzcGl0IHRoZSBcInNraXBwZWRcIiBjaGFyYWN0ZXIgdGhhdCBvdXIgcmVnZXggY2hva2VkIG9uIGJhY2sgaW50byB0aGUgb3V0cHV0IHNlcXVlbmNlXG4gICAgICAgIG1vZGVCdWZmZXIgKz0gY29kZVRvSGlnaGxpZ2h0LnNsaWNlKG1hdGNoLmluZGV4LCBtYXRjaC5pbmRleCArIDEpO1xuICAgICAgICBpZiAoIVNBRkVfTU9ERSkge1xuICAgICAgICAgIC8qKiBAdHlwZSB7QW5ub3RhdGVkRXJyb3J9ICovXG4gICAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKGAwIHdpZHRoIG1hdGNoIHJlZ2V4ICgke2xhbmd1YWdlTmFtZX0pYCk7XG4gICAgICAgICAgZXJyLmxhbmd1YWdlTmFtZSA9IGxhbmd1YWdlTmFtZTtcbiAgICAgICAgICBlcnIuYmFkUnVsZSA9IGxhc3RNYXRjaC5ydWxlO1xuICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cbiAgICAgIGxhc3RNYXRjaCA9IG1hdGNoO1xuXG4gICAgICBpZiAobWF0Y2gudHlwZSA9PT0gXCJiZWdpblwiKSB7XG4gICAgICAgIHJldHVybiBkb0JlZ2luTWF0Y2gobWF0Y2gpO1xuICAgICAgfSBlbHNlIGlmIChtYXRjaC50eXBlID09PSBcImlsbGVnYWxcIiAmJiAhaWdub3JlSWxsZWdhbHMpIHtcbiAgICAgICAgLy8gaWxsZWdhbCBtYXRjaCwgd2UgZG8gbm90IGNvbnRpbnVlIHByb2Nlc3NpbmdcbiAgICAgICAgLyoqIEB0eXBlIHtBbm5vdGF0ZWRFcnJvcn0gKi9cbiAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdJbGxlZ2FsIGxleGVtZSBcIicgKyBsZXhlbWUgKyAnXCIgZm9yIG1vZGUgXCInICsgKHRvcC5zY29wZSB8fCAnPHVubmFtZWQ+JykgKyAnXCInKTtcbiAgICAgICAgZXJyLm1vZGUgPSB0b3A7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH0gZWxzZSBpZiAobWF0Y2gudHlwZSA9PT0gXCJlbmRcIikge1xuICAgICAgICBjb25zdCBwcm9jZXNzZWQgPSBkb0VuZE1hdGNoKG1hdGNoKTtcbiAgICAgICAgaWYgKHByb2Nlc3NlZCAhPT0gTk9fTUFUQ0gpIHtcbiAgICAgICAgICByZXR1cm4gcHJvY2Vzc2VkO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIGVkZ2UgY2FzZSBmb3Igd2hlbiBpbGxlZ2FsIG1hdGNoZXMgJCAoZW5kIG9mIGxpbmUpIHdoaWNoIGlzIHRlY2huaWNhbGx5XG4gICAgICAvLyBhIDAgd2lkdGggbWF0Y2ggYnV0IG5vdCBhIGJlZ2luL2VuZCBtYXRjaCBzbyBpdCdzIG5vdCBjYXVnaHQgYnkgdGhlXG4gICAgICAvLyBmaXJzdCBoYW5kbGVyICh3aGVuIGlnbm9yZUlsbGVnYWxzIGlzIHRydWUpXG4gICAgICBpZiAobWF0Y2gudHlwZSA9PT0gXCJpbGxlZ2FsXCIgJiYgbGV4ZW1lID09PSBcIlwiKSB7XG4gICAgICAgIC8vIGFkdmFuY2Ugc28gd2UgYXJlbid0IHN0dWNrIGluIGFuIGluZmluaXRlIGxvb3BcbiAgICAgICAgbW9kZUJ1ZmZlciArPSBcIlxcblwiO1xuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cblxuICAgICAgLy8gaW5maW5pdGUgbG9vcHMgYXJlIEJBRCwgdGhpcyBpcyBhIGxhc3QgZGl0Y2ggY2F0Y2ggYWxsLiBpZiB3ZSBoYXZlIGFcbiAgICAgIC8vIGRlY2VudCBudW1iZXIgb2YgaXRlcmF0aW9ucyB5ZXQgb3VyIGluZGV4IChjdXJzb3IgcG9zaXRpb24gaW4gb3VyXG4gICAgICAvLyBwYXJzaW5nKSBzdGlsbCAzeCBiZWhpbmQgb3VyIGluZGV4IHRoZW4gc29tZXRoaW5nIGlzIHZlcnkgd3JvbmdcbiAgICAgIC8vIHNvIHdlIGJhaWxcbiAgICAgIGlmIChpdGVyYXRpb25zID4gMTAwMDAwICYmIGl0ZXJhdGlvbnMgPiBtYXRjaC5pbmRleCAqIDMpIHtcbiAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdwb3RlbnRpYWwgaW5maW5pdGUgbG9vcCwgd2F5IG1vcmUgaXRlcmF0aW9ucyB0aGFuIG1hdGNoZXMnKTtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuXG4gICAgICAvKlxuICAgICAgV2h5IG1pZ2h0IGJlIGZpbmQgb3Vyc2VsdmVzIGhlcmU/ICBBbiBwb3RlbnRpYWwgZW5kIG1hdGNoIHRoYXQgd2FzXG4gICAgICB0cmlnZ2VyZWQgYnV0IGNvdWxkIG5vdCBiZSBjb21wbGV0ZWQuICBJRSwgYGRvRW5kTWF0Y2hgIHJldHVybmVkIE5PX01BVENILlxuICAgICAgKHRoaXMgY291bGQgYmUgYmVjYXVzZSBhIGNhbGxiYWNrIHJlcXVlc3RzIHRoZSBtYXRjaCBiZSBpZ25vcmVkLCBldGMpXG5cbiAgICAgIFRoaXMgY2F1c2VzIG5vIHJlYWwgaGFybSBvdGhlciB0aGFuIHN0b3BwaW5nIGEgZmV3IHRpbWVzIHRvbyBtYW55LlxuICAgICAgKi9cblxuICAgICAgbW9kZUJ1ZmZlciArPSBsZXhlbWU7XG4gICAgICByZXR1cm4gbGV4ZW1lLmxlbmd0aDtcbiAgICB9XG5cbiAgICBjb25zdCBsYW5ndWFnZSA9IGdldExhbmd1YWdlKGxhbmd1YWdlTmFtZSk7XG4gICAgaWYgKCFsYW5ndWFnZSkge1xuICAgICAgZXJyb3IoTEFOR1VBR0VfTk9UX0ZPVU5ELnJlcGxhY2UoXCJ7fVwiLCBsYW5ndWFnZU5hbWUpKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBsYW5ndWFnZTogXCInICsgbGFuZ3VhZ2VOYW1lICsgJ1wiJyk7XG4gICAgfVxuXG4gICAgY29uc3QgbWQgPSBjb21waWxlTGFuZ3VhZ2UobGFuZ3VhZ2UpO1xuICAgIGxldCByZXN1bHQgPSAnJztcbiAgICAvKiogQHR5cGUge0NvbXBpbGVkTW9kZX0gKi9cbiAgICBsZXQgdG9wID0gY29udGludWF0aW9uIHx8IG1kO1xuICAgIC8qKiBAdHlwZSBSZWNvcmQ8c3RyaW5nLENvbXBpbGVkTW9kZT4gKi9cbiAgICBjb25zdCBjb250aW51YXRpb25zID0ge307IC8vIGtlZXAgY29udGludWF0aW9ucyBmb3Igc3ViLWxhbmd1YWdlc1xuICAgIGNvbnN0IGVtaXR0ZXIgPSBuZXcgb3B0aW9ucy5fX2VtaXR0ZXIob3B0aW9ucyk7XG4gICAgcHJvY2Vzc0NvbnRpbnVhdGlvbnMoKTtcbiAgICBsZXQgbW9kZUJ1ZmZlciA9ICcnO1xuICAgIGxldCByZWxldmFuY2UgPSAwO1xuICAgIGxldCBpbmRleCA9IDA7XG4gICAgbGV0IGl0ZXJhdGlvbnMgPSAwO1xuICAgIGxldCByZXN1bWVTY2FuQXRTYW1lUG9zaXRpb24gPSBmYWxzZTtcblxuICAgIHRyeSB7XG4gICAgICBpZiAoIWxhbmd1YWdlLl9fZW1pdFRva2Vucykge1xuICAgICAgICB0b3AubWF0Y2hlci5jb25zaWRlckFsbCgpO1xuXG4gICAgICAgIGZvciAoOzspIHtcbiAgICAgICAgICBpdGVyYXRpb25zKys7XG4gICAgICAgICAgaWYgKHJlc3VtZVNjYW5BdFNhbWVQb3NpdGlvbikge1xuICAgICAgICAgICAgLy8gb25seSByZWdleGVzIG5vdCBtYXRjaGVkIHByZXZpb3VzbHkgd2lsbCBub3cgYmVcbiAgICAgICAgICAgIC8vIGNvbnNpZGVyZWQgZm9yIGEgcG90ZW50aWFsIG1hdGNoXG4gICAgICAgICAgICByZXN1bWVTY2FuQXRTYW1lUG9zaXRpb24gPSBmYWxzZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9wLm1hdGNoZXIuY29uc2lkZXJBbGwoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdG9wLm1hdGNoZXIubGFzdEluZGV4ID0gaW5kZXg7XG5cbiAgICAgICAgICBjb25zdCBtYXRjaCA9IHRvcC5tYXRjaGVyLmV4ZWMoY29kZVRvSGlnaGxpZ2h0KTtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIm1hdGNoXCIsIG1hdGNoWzBdLCBtYXRjaC5ydWxlICYmIG1hdGNoLnJ1bGUuYmVnaW4pXG5cbiAgICAgICAgICBpZiAoIW1hdGNoKSBicmVhaztcblxuICAgICAgICAgIGNvbnN0IGJlZm9yZU1hdGNoID0gY29kZVRvSGlnaGxpZ2h0LnN1YnN0cmluZyhpbmRleCwgbWF0Y2guaW5kZXgpO1xuICAgICAgICAgIGNvbnN0IHByb2Nlc3NlZENvdW50ID0gcHJvY2Vzc0xleGVtZShiZWZvcmVNYXRjaCwgbWF0Y2gpO1xuICAgICAgICAgIGluZGV4ID0gbWF0Y2guaW5kZXggKyBwcm9jZXNzZWRDb3VudDtcbiAgICAgICAgfVxuICAgICAgICBwcm9jZXNzTGV4ZW1lKGNvZGVUb0hpZ2hsaWdodC5zdWJzdHJpbmcoaW5kZXgpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxhbmd1YWdlLl9fZW1pdFRva2Vucyhjb2RlVG9IaWdobGlnaHQsIGVtaXR0ZXIpO1xuICAgICAgfVxuXG4gICAgICBlbWl0dGVyLmZpbmFsaXplKCk7XG4gICAgICByZXN1bHQgPSBlbWl0dGVyLnRvSFRNTCgpO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBsYW5ndWFnZTogbGFuZ3VhZ2VOYW1lLFxuICAgICAgICB2YWx1ZTogcmVzdWx0LFxuICAgICAgICByZWxldmFuY2UsXG4gICAgICAgIGlsbGVnYWw6IGZhbHNlLFxuICAgICAgICBfZW1pdHRlcjogZW1pdHRlcixcbiAgICAgICAgX3RvcDogdG9wXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgaWYgKGVyci5tZXNzYWdlICYmIGVyci5tZXNzYWdlLmluY2x1ZGVzKCdJbGxlZ2FsJykpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBsYW5ndWFnZTogbGFuZ3VhZ2VOYW1lLFxuICAgICAgICAgIHZhbHVlOiBlc2NhcGUoY29kZVRvSGlnaGxpZ2h0KSxcbiAgICAgICAgICBpbGxlZ2FsOiB0cnVlLFxuICAgICAgICAgIHJlbGV2YW5jZTogMCxcbiAgICAgICAgICBfaWxsZWdhbEJ5OiB7XG4gICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSxcbiAgICAgICAgICAgIGluZGV4LFxuICAgICAgICAgICAgY29udGV4dDogY29kZVRvSGlnaGxpZ2h0LnNsaWNlKGluZGV4IC0gMTAwLCBpbmRleCArIDEwMCksXG4gICAgICAgICAgICBtb2RlOiBlcnIubW9kZSxcbiAgICAgICAgICAgIHJlc3VsdFNvRmFyOiByZXN1bHRcbiAgICAgICAgICB9LFxuICAgICAgICAgIF9lbWl0dGVyOiBlbWl0dGVyXG4gICAgICAgIH07XG4gICAgICB9IGVsc2UgaWYgKFNBRkVfTU9ERSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGxhbmd1YWdlOiBsYW5ndWFnZU5hbWUsXG4gICAgICAgICAgdmFsdWU6IGVzY2FwZShjb2RlVG9IaWdobGlnaHQpLFxuICAgICAgICAgIGlsbGVnYWw6IGZhbHNlLFxuICAgICAgICAgIHJlbGV2YW5jZTogMCxcbiAgICAgICAgICBlcnJvclJhaXNlZDogZXJyLFxuICAgICAgICAgIF9lbWl0dGVyOiBlbWl0dGVyLFxuICAgICAgICAgIF90b3A6IHRvcFxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiByZXR1cm5zIGEgdmFsaWQgaGlnaGxpZ2h0IHJlc3VsdCwgd2l0aG91dCBhY3R1YWxseSBkb2luZyBhbnkgYWN0dWFsIHdvcmssXG4gICAqIGF1dG8gaGlnaGxpZ2h0IHN0YXJ0cyB3aXRoIHRoaXMgYW5kIGl0J3MgcG9zc2libGUgZm9yIHNtYWxsIHNuaXBwZXRzIHRoYXRcbiAgICogYXV0by1kZXRlY3Rpb24gbWF5IG5vdCBmaW5kIGEgYmV0dGVyIG1hdGNoXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlXG4gICAqIEByZXR1cm5zIHtIaWdobGlnaHRSZXN1bHR9XG4gICAqL1xuICBmdW5jdGlvbiBqdXN0VGV4dEhpZ2hsaWdodFJlc3VsdChjb2RlKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgdmFsdWU6IGVzY2FwZShjb2RlKSxcbiAgICAgIGlsbGVnYWw6IGZhbHNlLFxuICAgICAgcmVsZXZhbmNlOiAwLFxuICAgICAgX3RvcDogUExBSU5URVhUX0xBTkdVQUdFLFxuICAgICAgX2VtaXR0ZXI6IG5ldyBvcHRpb25zLl9fZW1pdHRlcihvcHRpb25zKVxuICAgIH07XG4gICAgcmVzdWx0Ll9lbWl0dGVyLmFkZFRleHQoY29kZSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICBIaWdobGlnaHRpbmcgd2l0aCBsYW5ndWFnZSBkZXRlY3Rpb24uIEFjY2VwdHMgYSBzdHJpbmcgd2l0aCB0aGUgY29kZSB0b1xuICBoaWdobGlnaHQuIFJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuXG4gIC0gbGFuZ3VhZ2UgKGRldGVjdGVkIGxhbmd1YWdlKVxuICAtIHJlbGV2YW5jZSAoaW50KVxuICAtIHZhbHVlIChhbiBIVE1MIHN0cmluZyB3aXRoIGhpZ2hsaWdodGluZyBtYXJrdXApXG4gIC0gc2Vjb25kQmVzdCAob2JqZWN0IHdpdGggdGhlIHNhbWUgc3RydWN0dXJlIGZvciBzZWNvbmQtYmVzdCBoZXVyaXN0aWNhbGx5XG4gICAgZGV0ZWN0ZWQgbGFuZ3VhZ2UsIG1heSBiZSBhYnNlbnQpXG5cbiAgICBAcGFyYW0ge3N0cmluZ30gY29kZVxuICAgIEBwYXJhbSB7QXJyYXk8c3RyaW5nPn0gW2xhbmd1YWdlU3Vic2V0XVxuICAgIEByZXR1cm5zIHtBdXRvSGlnaGxpZ2h0UmVzdWx0fVxuICAqL1xuICBmdW5jdGlvbiBoaWdobGlnaHRBdXRvKGNvZGUsIGxhbmd1YWdlU3Vic2V0KSB7XG4gICAgbGFuZ3VhZ2VTdWJzZXQgPSBsYW5ndWFnZVN1YnNldCB8fCBvcHRpb25zLmxhbmd1YWdlcyB8fCBPYmplY3Qua2V5cyhsYW5ndWFnZXMpO1xuICAgIGNvbnN0IHBsYWludGV4dCA9IGp1c3RUZXh0SGlnaGxpZ2h0UmVzdWx0KGNvZGUpO1xuXG4gICAgY29uc3QgcmVzdWx0cyA9IGxhbmd1YWdlU3Vic2V0LmZpbHRlcihnZXRMYW5ndWFnZSkuZmlsdGVyKGF1dG9EZXRlY3Rpb24pLm1hcChuYW1lID0+XG4gICAgICBfaGlnaGxpZ2h0KG5hbWUsIGNvZGUsIGZhbHNlKVxuICAgICk7XG4gICAgcmVzdWx0cy51bnNoaWZ0KHBsYWludGV4dCk7IC8vIHBsYWludGV4dCBpcyBhbHdheXMgYW4gb3B0aW9uXG5cbiAgICBjb25zdCBzb3J0ZWQgPSByZXN1bHRzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIC8vIHNvcnQgYmFzZSBvbiByZWxldmFuY2VcbiAgICAgIGlmIChhLnJlbGV2YW5jZSAhPT0gYi5yZWxldmFuY2UpIHJldHVybiBiLnJlbGV2YW5jZSAtIGEucmVsZXZhbmNlO1xuXG4gICAgICAvLyBhbHdheXMgYXdhcmQgdGhlIHRpZSB0byB0aGUgYmFzZSBsYW5ndWFnZVxuICAgICAgLy8gaWUgaWYgQysrIGFuZCBBcmR1aW5vIGFyZSB0aWVkLCBpdCdzIG1vcmUgbGlrZWx5IHRvIGJlIEMrK1xuICAgICAgaWYgKGEubGFuZ3VhZ2UgJiYgYi5sYW5ndWFnZSkge1xuICAgICAgICBpZiAoZ2V0TGFuZ3VhZ2UoYS5sYW5ndWFnZSkuc3VwZXJzZXRPZiA9PT0gYi5sYW5ndWFnZSkge1xuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9IGVsc2UgaWYgKGdldExhbmd1YWdlKGIubGFuZ3VhZ2UpLnN1cGVyc2V0T2YgPT09IGEubGFuZ3VhZ2UpIHtcbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gb3RoZXJ3aXNlIHNheSB0aGV5IGFyZSBlcXVhbCwgd2hpY2ggaGFzIHRoZSBlZmZlY3Qgb2Ygc29ydGluZyBvblxuICAgICAgLy8gcmVsZXZhbmNlIHdoaWxlIHByZXNlcnZpbmcgdGhlIG9yaWdpbmFsIG9yZGVyaW5nIC0gd2hpY2ggaXMgaG93IHRpZXNcbiAgICAgIC8vIGhhdmUgaGlzdG9yaWNhbGx5IGJlZW4gc2V0dGxlZCwgaWUgdGhlIGxhbmd1YWdlIHRoYXQgY29tZXMgZmlyc3QgYWx3YXlzXG4gICAgICAvLyB3aW5zIGluIHRoZSBjYXNlIG9mIGEgdGllXG4gICAgICByZXR1cm4gMDtcbiAgICB9KTtcblxuICAgIGNvbnN0IFtiZXN0LCBzZWNvbmRCZXN0XSA9IHNvcnRlZDtcblxuICAgIC8qKiBAdHlwZSB7QXV0b0hpZ2hsaWdodFJlc3VsdH0gKi9cbiAgICBjb25zdCByZXN1bHQgPSBiZXN0O1xuICAgIHJlc3VsdC5zZWNvbmRCZXN0ID0gc2Vjb25kQmVzdDtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogQnVpbGRzIG5ldyBjbGFzcyBuYW1lIGZvciBibG9jayBnaXZlbiB0aGUgbGFuZ3VhZ2UgbmFtZVxuICAgKlxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY3VycmVudExhbmddXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcmVzdWx0TGFuZ11cbiAgICovXG4gIGZ1bmN0aW9uIHVwZGF0ZUNsYXNzTmFtZShlbGVtZW50LCBjdXJyZW50TGFuZywgcmVzdWx0TGFuZykge1xuICAgIGNvbnN0IGxhbmd1YWdlID0gKGN1cnJlbnRMYW5nICYmIGFsaWFzZXNbY3VycmVudExhbmddKSB8fCByZXN1bHRMYW5nO1xuXG4gICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiaGxqc1wiKTtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoYGxhbmd1YWdlLSR7bGFuZ3VhZ2V9YCk7XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyBoaWdobGlnaHRpbmcgdG8gYSBET00gbm9kZSBjb250YWluaW5nIGNvZGUuXG4gICAqXG4gICAqIEBwYXJhbSB7SGlnaGxpZ2h0ZWRIVE1MRWxlbWVudH0gZWxlbWVudCAtIHRoZSBIVE1MIGVsZW1lbnQgdG8gaGlnaGxpZ2h0XG4gICovXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodEVsZW1lbnQoZWxlbWVudCkge1xuICAgIC8qKiBAdHlwZSBIVE1MRWxlbWVudCAqL1xuICAgIGxldCBub2RlID0gbnVsbDtcbiAgICBjb25zdCBsYW5ndWFnZSA9IGJsb2NrTGFuZ3VhZ2UoZWxlbWVudCk7XG5cbiAgICBpZiAoc2hvdWxkTm90SGlnaGxpZ2h0KGxhbmd1YWdlKSkgcmV0dXJuO1xuXG4gICAgZmlyZShcImJlZm9yZTpoaWdobGlnaHRFbGVtZW50XCIsXG4gICAgICB7IGVsOiBlbGVtZW50LCBsYW5ndWFnZSB9KTtcblxuICAgIGlmIChlbGVtZW50LmRhdGFzZXQuaGlnaGxpZ2h0ZWQpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiRWxlbWVudCBwcmV2aW91c2x5IGhpZ2hsaWdodGVkLiBUbyBoaWdobGlnaHQgYWdhaW4sIGZpcnN0IHVuc2V0IGBkYXRhc2V0LmhpZ2hsaWdodGVkYC5cIiwgZWxlbWVudCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gd2Ugc2hvdWxkIGJlIGFsbCB0ZXh0LCBubyBjaGlsZCBub2RlcyAodW5lc2NhcGVkIEhUTUwpIC0gdGhpcyBpcyBwb3NzaWJseVxuICAgIC8vIGFuIEhUTUwgaW5qZWN0aW9uIGF0dGFjayAtIGl0J3MgbGlrZWx5IHRvbyBsYXRlIGlmIHRoaXMgaXMgYWxyZWFkeSBpblxuICAgIC8vIHByb2R1Y3Rpb24gKHRoZSBjb2RlIGhhcyBsaWtlbHkgYWxyZWFkeSBkb25lIGl0cyBkYW1hZ2UgYnkgdGhlIHRpbWVcbiAgICAvLyB3ZSdyZSBzZWVpbmcgaXQpLi4uIGJ1dCB3ZSB5ZWxsIGxvdWRseSBhYm91dCB0aGlzIHNvIHRoYXQgaG9wZWZ1bGx5IGl0J3NcbiAgICAvLyBtb3JlIGxpa2VseSB0byBiZSBjYXVnaHQgaW4gZGV2ZWxvcG1lbnQgYmVmb3JlIG1ha2luZyBpdCB0byBwcm9kdWN0aW9uXG4gICAgaWYgKGVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKCFvcHRpb25zLmlnbm9yZVVuZXNjYXBlZEhUTUwpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiT25lIG9mIHlvdXIgY29kZSBibG9ja3MgaW5jbHVkZXMgdW5lc2NhcGVkIEhUTUwuIFRoaXMgaXMgYSBwb3RlbnRpYWxseSBzZXJpb3VzIHNlY3VyaXR5IHJpc2suXCIpO1xuICAgICAgICBjb25zb2xlLndhcm4oXCJodHRwczovL2dpdGh1Yi5jb20vaGlnaGxpZ2h0anMvaGlnaGxpZ2h0LmpzL3dpa2kvc2VjdXJpdHlcIik7XG4gICAgICAgIGNvbnNvbGUud2FybihcIlRoZSBlbGVtZW50IHdpdGggdW5lc2NhcGVkIEhUTUw6XCIpO1xuICAgICAgICBjb25zb2xlLndhcm4oZWxlbWVudCk7XG4gICAgICB9XG4gICAgICBpZiAob3B0aW9ucy50aHJvd1VuZXNjYXBlZEhUTUwpIHtcbiAgICAgICAgY29uc3QgZXJyID0gbmV3IEhUTUxJbmplY3Rpb25FcnJvcihcbiAgICAgICAgICBcIk9uZSBvZiB5b3VyIGNvZGUgYmxvY2tzIGluY2x1ZGVzIHVuZXNjYXBlZCBIVE1MLlwiLFxuICAgICAgICAgIGVsZW1lbnQuaW5uZXJIVE1MXG4gICAgICAgICk7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBub2RlID0gZWxlbWVudDtcbiAgICBjb25zdCB0ZXh0ID0gbm9kZS50ZXh0Q29udGVudDtcbiAgICBjb25zdCByZXN1bHQgPSBsYW5ndWFnZSA/IGhpZ2hsaWdodCh0ZXh0LCB7IGxhbmd1YWdlLCBpZ25vcmVJbGxlZ2FsczogdHJ1ZSB9KSA6IGhpZ2hsaWdodEF1dG8odGV4dCk7XG5cbiAgICBlbGVtZW50LmlubmVySFRNTCA9IHJlc3VsdC52YWx1ZTtcbiAgICBlbGVtZW50LmRhdGFzZXQuaGlnaGxpZ2h0ZWQgPSBcInllc1wiO1xuICAgIHVwZGF0ZUNsYXNzTmFtZShlbGVtZW50LCBsYW5ndWFnZSwgcmVzdWx0Lmxhbmd1YWdlKTtcbiAgICBlbGVtZW50LnJlc3VsdCA9IHtcbiAgICAgIGxhbmd1YWdlOiByZXN1bHQubGFuZ3VhZ2UsXG4gICAgICAvLyBUT0RPOiByZW1vdmUgd2l0aCB2ZXJzaW9uIDExLjBcbiAgICAgIHJlOiByZXN1bHQucmVsZXZhbmNlLFxuICAgICAgcmVsZXZhbmNlOiByZXN1bHQucmVsZXZhbmNlXG4gICAgfTtcbiAgICBpZiAocmVzdWx0LnNlY29uZEJlc3QpIHtcbiAgICAgIGVsZW1lbnQuc2Vjb25kQmVzdCA9IHtcbiAgICAgICAgbGFuZ3VhZ2U6IHJlc3VsdC5zZWNvbmRCZXN0Lmxhbmd1YWdlLFxuICAgICAgICByZWxldmFuY2U6IHJlc3VsdC5zZWNvbmRCZXN0LnJlbGV2YW5jZVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBmaXJlKFwiYWZ0ZXI6aGlnaGxpZ2h0RWxlbWVudFwiLCB7IGVsOiBlbGVtZW50LCByZXN1bHQsIHRleHQgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyBoaWdobGlnaHQuanMgZ2xvYmFsIG9wdGlvbnMgd2l0aCB0aGUgcGFzc2VkIG9wdGlvbnNcbiAgICpcbiAgICogQHBhcmFtIHtQYXJ0aWFsPEhMSlNPcHRpb25zPn0gdXNlck9wdGlvbnNcbiAgICovXG4gIGZ1bmN0aW9uIGNvbmZpZ3VyZSh1c2VyT3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBpbmhlcml0KG9wdGlvbnMsIHVzZXJPcHRpb25zKTtcbiAgfVxuXG4gIC8vIFRPRE86IHJlbW92ZSB2MTIsIGRlcHJlY2F0ZWRcbiAgY29uc3QgaW5pdEhpZ2hsaWdodGluZyA9ICgpID0+IHtcbiAgICBoaWdobGlnaHRBbGwoKTtcbiAgICBkZXByZWNhdGVkKFwiMTAuNi4wXCIsIFwiaW5pdEhpZ2hsaWdodGluZygpIGRlcHJlY2F0ZWQuICBVc2UgaGlnaGxpZ2h0QWxsKCkgbm93LlwiKTtcbiAgfTtcblxuICAvLyBUT0RPOiByZW1vdmUgdjEyLCBkZXByZWNhdGVkXG4gIGZ1bmN0aW9uIGluaXRIaWdobGlnaHRpbmdPbkxvYWQoKSB7XG4gICAgaGlnaGxpZ2h0QWxsKCk7XG4gICAgZGVwcmVjYXRlZChcIjEwLjYuMFwiLCBcImluaXRIaWdobGlnaHRpbmdPbkxvYWQoKSBkZXByZWNhdGVkLiAgVXNlIGhpZ2hsaWdodEFsbCgpIG5vdy5cIik7XG4gIH1cblxuICBsZXQgd2FudHNIaWdobGlnaHQgPSBmYWxzZTtcblxuICAvKipcbiAgICogYXV0by1oaWdobGlnaHRzIGFsbCBwcmU+Y29kZSBlbGVtZW50cyBvbiB0aGUgcGFnZVxuICAgKi9cbiAgZnVuY3Rpb24gaGlnaGxpZ2h0QWxsKCkge1xuICAgIGZ1bmN0aW9uIGJvb3QoKSB7XG4gICAgICAvLyBpZiBhIGhpZ2hsaWdodCB3YXMgcmVxdWVzdGVkIGJlZm9yZSBET00gd2FzIGxvYWRlZCwgZG8gbm93XG4gICAgICBoaWdobGlnaHRBbGwoKTtcbiAgICB9XG5cbiAgICAvLyBpZiB3ZSBhcmUgY2FsbGVkIHRvbyBlYXJseSBpbiB0aGUgbG9hZGluZyBwcm9jZXNzXG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwibG9hZGluZ1wiKSB7XG4gICAgICAvLyBtYWtlIHN1cmUgdGhlIGV2ZW50IGxpc3RlbmVyIGlzIG9ubHkgYWRkZWQgb25jZVxuICAgICAgaWYgKCF3YW50c0hpZ2hsaWdodCkge1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGJvb3QsIGZhbHNlKTtcbiAgICAgIH1cbiAgICAgIHdhbnRzSGlnaGxpZ2h0ID0gdHJ1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBibG9ja3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKG9wdGlvbnMuY3NzU2VsZWN0b3IpO1xuICAgIGJsb2Nrcy5mb3JFYWNoKGhpZ2hsaWdodEVsZW1lbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgbGFuZ3VhZ2UgZ3JhbW1hciBtb2R1bGVcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGxhbmd1YWdlTmFtZVxuICAgKiBAcGFyYW0ge0xhbmd1YWdlRm59IGxhbmd1YWdlRGVmaW5pdGlvblxuICAgKi9cbiAgZnVuY3Rpb24gcmVnaXN0ZXJMYW5ndWFnZShsYW5ndWFnZU5hbWUsIGxhbmd1YWdlRGVmaW5pdGlvbikge1xuICAgIGxldCBsYW5nID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgbGFuZyA9IGxhbmd1YWdlRGVmaW5pdGlvbihobGpzKTtcbiAgICB9IGNhdGNoIChlcnJvciQxKSB7XG4gICAgICBlcnJvcihcIkxhbmd1YWdlIGRlZmluaXRpb24gZm9yICd7fScgY291bGQgbm90IGJlIHJlZ2lzdGVyZWQuXCIucmVwbGFjZShcInt9XCIsIGxhbmd1YWdlTmFtZSkpO1xuICAgICAgLy8gaGFyZCBvciBzb2Z0IGVycm9yXG4gICAgICBpZiAoIVNBRkVfTU9ERSkgeyB0aHJvdyBlcnJvciQxOyB9IGVsc2UgeyBlcnJvcihlcnJvciQxKTsgfVxuICAgICAgLy8gbGFuZ3VhZ2VzIHRoYXQgaGF2ZSBzZXJpb3VzIGVycm9ycyBhcmUgcmVwbGFjZWQgd2l0aCBlc3NlbnRpYWxseSBhXG4gICAgICAvLyBcInBsYWludGV4dFwiIHN0YW5kLWluIHNvIHRoYXQgdGhlIGNvZGUgYmxvY2tzIHdpbGwgc3RpbGwgZ2V0IG5vcm1hbFxuICAgICAgLy8gY3NzIGNsYXNzZXMgYXBwbGllZCB0byB0aGVtIC0gYW5kIG9uZSBiYWQgbGFuZ3VhZ2Ugd29uJ3QgYnJlYWsgdGhlXG4gICAgICAvLyBlbnRpcmUgaGlnaGxpZ2h0ZXJcbiAgICAgIGxhbmcgPSBQTEFJTlRFWFRfTEFOR1VBR0U7XG4gICAgfVxuICAgIC8vIGdpdmUgaXQgYSB0ZW1wb3JhcnkgbmFtZSBpZiBpdCBkb2Vzbid0IGhhdmUgb25lIGluIHRoZSBtZXRhLWRhdGFcbiAgICBpZiAoIWxhbmcubmFtZSkgbGFuZy5uYW1lID0gbGFuZ3VhZ2VOYW1lO1xuICAgIGxhbmd1YWdlc1tsYW5ndWFnZU5hbWVdID0gbGFuZztcbiAgICBsYW5nLnJhd0RlZmluaXRpb24gPSBsYW5ndWFnZURlZmluaXRpb24uYmluZChudWxsLCBobGpzKTtcblxuICAgIGlmIChsYW5nLmFsaWFzZXMpIHtcbiAgICAgIHJlZ2lzdGVyQWxpYXNlcyhsYW5nLmFsaWFzZXMsIHsgbGFuZ3VhZ2VOYW1lIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYSBsYW5ndWFnZSBncmFtbWFyIG1vZHVsZVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2VOYW1lXG4gICAqL1xuICBmdW5jdGlvbiB1bnJlZ2lzdGVyTGFuZ3VhZ2UobGFuZ3VhZ2VOYW1lKSB7XG4gICAgZGVsZXRlIGxhbmd1YWdlc1tsYW5ndWFnZU5hbWVdO1xuICAgIGZvciAoY29uc3QgYWxpYXMgb2YgT2JqZWN0LmtleXMoYWxpYXNlcykpIHtcbiAgICAgIGlmIChhbGlhc2VzW2FsaWFzXSA9PT0gbGFuZ3VhZ2VOYW1lKSB7XG4gICAgICAgIGRlbGV0ZSBhbGlhc2VzW2FsaWFzXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMge3N0cmluZ1tdfSBMaXN0IG9mIGxhbmd1YWdlIGludGVybmFsIG5hbWVzXG4gICAqL1xuICBmdW5jdGlvbiBsaXN0TGFuZ3VhZ2VzKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhsYW5ndWFnZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gbmFtZSBvZiB0aGUgbGFuZ3VhZ2UgdG8gcmV0cmlldmVcbiAgICogQHJldHVybnMge0xhbmd1YWdlIHwgdW5kZWZpbmVkfVxuICAgKi9cbiAgZnVuY3Rpb24gZ2V0TGFuZ3VhZ2UobmFtZSkge1xuICAgIG5hbWUgPSAobmFtZSB8fCAnJykudG9Mb3dlckNhc2UoKTtcbiAgICByZXR1cm4gbGFuZ3VhZ2VzW25hbWVdIHx8IGxhbmd1YWdlc1thbGlhc2VzW25hbWVdXTtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xzdHJpbmdbXX0gYWxpYXNMaXN0IC0gc2luZ2xlIGFsaWFzIG9yIGxpc3Qgb2YgYWxpYXNlc1xuICAgKiBAcGFyYW0ge3tsYW5ndWFnZU5hbWU6IHN0cmluZ319IG9wdHNcbiAgICovXG4gIGZ1bmN0aW9uIHJlZ2lzdGVyQWxpYXNlcyhhbGlhc0xpc3QsIHsgbGFuZ3VhZ2VOYW1lIH0pIHtcbiAgICBpZiAodHlwZW9mIGFsaWFzTGlzdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGFsaWFzTGlzdCA9IFthbGlhc0xpc3RdO1xuICAgIH1cbiAgICBhbGlhc0xpc3QuZm9yRWFjaChhbGlhcyA9PiB7IGFsaWFzZXNbYWxpYXMudG9Mb3dlckNhc2UoKV0gPSBsYW5ndWFnZU5hbWU7IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgYSBnaXZlbiBsYW5ndWFnZSBoYXMgYXV0by1kZXRlY3Rpb24gZW5hYmxlZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIG5hbWUgb2YgdGhlIGxhbmd1YWdlXG4gICAqL1xuICBmdW5jdGlvbiBhdXRvRGV0ZWN0aW9uKG5hbWUpIHtcbiAgICBjb25zdCBsYW5nID0gZ2V0TGFuZ3VhZ2UobmFtZSk7XG4gICAgcmV0dXJuIGxhbmcgJiYgIWxhbmcuZGlzYWJsZUF1dG9kZXRlY3Q7XG4gIH1cblxuICAvKipcbiAgICogVXBncmFkZXMgdGhlIG9sZCBoaWdobGlnaHRCbG9jayBwbHVnaW5zIHRvIHRoZSBuZXdcbiAgICogaGlnaGxpZ2h0RWxlbWVudCBBUElcbiAgICogQHBhcmFtIHtITEpTUGx1Z2lufSBwbHVnaW5cbiAgICovXG4gIGZ1bmN0aW9uIHVwZ3JhZGVQbHVnaW5BUEkocGx1Z2luKSB7XG4gICAgLy8gVE9ETzogcmVtb3ZlIHdpdGggdjEyXG4gICAgaWYgKHBsdWdpbltcImJlZm9yZTpoaWdobGlnaHRCbG9ja1wiXSAmJiAhcGx1Z2luW1wiYmVmb3JlOmhpZ2hsaWdodEVsZW1lbnRcIl0pIHtcbiAgICAgIHBsdWdpbltcImJlZm9yZTpoaWdobGlnaHRFbGVtZW50XCJdID0gKGRhdGEpID0+IHtcbiAgICAgICAgcGx1Z2luW1wiYmVmb3JlOmhpZ2hsaWdodEJsb2NrXCJdKFxuICAgICAgICAgIE9iamVjdC5hc3NpZ24oeyBibG9jazogZGF0YS5lbCB9LCBkYXRhKVxuICAgICAgICApO1xuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKHBsdWdpbltcImFmdGVyOmhpZ2hsaWdodEJsb2NrXCJdICYmICFwbHVnaW5bXCJhZnRlcjpoaWdobGlnaHRFbGVtZW50XCJdKSB7XG4gICAgICBwbHVnaW5bXCJhZnRlcjpoaWdobGlnaHRFbGVtZW50XCJdID0gKGRhdGEpID0+IHtcbiAgICAgICAgcGx1Z2luW1wiYWZ0ZXI6aGlnaGxpZ2h0QmxvY2tcIl0oXG4gICAgICAgICAgT2JqZWN0LmFzc2lnbih7IGJsb2NrOiBkYXRhLmVsIH0sIGRhdGEpXG4gICAgICAgICk7XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0hMSlNQbHVnaW59IHBsdWdpblxuICAgKi9cbiAgZnVuY3Rpb24gYWRkUGx1Z2luKHBsdWdpbikge1xuICAgIHVwZ3JhZGVQbHVnaW5BUEkocGx1Z2luKTtcbiAgICBwbHVnaW5zLnB1c2gocGx1Z2luKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0hMSlNQbHVnaW59IHBsdWdpblxuICAgKi9cbiAgZnVuY3Rpb24gcmVtb3ZlUGx1Z2luKHBsdWdpbikge1xuICAgIGNvbnN0IGluZGV4ID0gcGx1Z2lucy5pbmRleE9mKHBsdWdpbik7XG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgcGx1Z2lucy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0ge1BsdWdpbkV2ZW50fSBldmVudFxuICAgKiBAcGFyYW0ge2FueX0gYXJnc1xuICAgKi9cbiAgZnVuY3Rpb24gZmlyZShldmVudCwgYXJncykge1xuICAgIGNvbnN0IGNiID0gZXZlbnQ7XG4gICAgcGx1Z2lucy5mb3JFYWNoKGZ1bmN0aW9uKHBsdWdpbikge1xuICAgICAgaWYgKHBsdWdpbltjYl0pIHtcbiAgICAgICAgcGx1Z2luW2NiXShhcmdzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBERVBSRUNBVEVEXG4gICAqIEBwYXJhbSB7SGlnaGxpZ2h0ZWRIVE1MRWxlbWVudH0gZWxcbiAgICovXG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZUhpZ2hsaWdodEJsb2NrKGVsKSB7XG4gICAgZGVwcmVjYXRlZChcIjEwLjcuMFwiLCBcImhpZ2hsaWdodEJsb2NrIHdpbGwgYmUgcmVtb3ZlZCBlbnRpcmVseSBpbiB2MTIuMFwiKTtcbiAgICBkZXByZWNhdGVkKFwiMTAuNy4wXCIsIFwiUGxlYXNlIHVzZSBoaWdobGlnaHRFbGVtZW50IG5vdy5cIik7XG5cbiAgICByZXR1cm4gaGlnaGxpZ2h0RWxlbWVudChlbCk7XG4gIH1cblxuICAvKiBJbnRlcmZhY2UgZGVmaW5pdGlvbiAqL1xuICBPYmplY3QuYXNzaWduKGhsanMsIHtcbiAgICBoaWdobGlnaHQsXG4gICAgaGlnaGxpZ2h0QXV0byxcbiAgICBoaWdobGlnaHRBbGwsXG4gICAgaGlnaGxpZ2h0RWxlbWVudCxcbiAgICAvLyBUT0RPOiBSZW1vdmUgd2l0aCB2MTIgQVBJXG4gICAgaGlnaGxpZ2h0QmxvY2s6IGRlcHJlY2F0ZUhpZ2hsaWdodEJsb2NrLFxuICAgIGNvbmZpZ3VyZSxcbiAgICBpbml0SGlnaGxpZ2h0aW5nLFxuICAgIGluaXRIaWdobGlnaHRpbmdPbkxvYWQsXG4gICAgcmVnaXN0ZXJMYW5ndWFnZSxcbiAgICB1bnJlZ2lzdGVyTGFuZ3VhZ2UsXG4gICAgbGlzdExhbmd1YWdlcyxcbiAgICBnZXRMYW5ndWFnZSxcbiAgICByZWdpc3RlckFsaWFzZXMsXG4gICAgYXV0b0RldGVjdGlvbixcbiAgICBpbmhlcml0LFxuICAgIGFkZFBsdWdpbixcbiAgICByZW1vdmVQbHVnaW5cbiAgfSk7XG5cbiAgaGxqcy5kZWJ1Z01vZGUgPSBmdW5jdGlvbigpIHsgU0FGRV9NT0RFID0gZmFsc2U7IH07XG4gIGhsanMuc2FmZU1vZGUgPSBmdW5jdGlvbigpIHsgU0FGRV9NT0RFID0gdHJ1ZTsgfTtcbiAgaGxqcy52ZXJzaW9uU3RyaW5nID0gdmVyc2lvbjtcblxuICBobGpzLnJlZ2V4ID0ge1xuICAgIGNvbmNhdDogY29uY2F0LFxuICAgIGxvb2thaGVhZDogbG9va2FoZWFkLFxuICAgIGVpdGhlcjogZWl0aGVyLFxuICAgIG9wdGlvbmFsOiBvcHRpb25hbCxcbiAgICBhbnlOdW1iZXJPZlRpbWVzOiBhbnlOdW1iZXJPZlRpbWVzXG4gIH07XG5cbiAgZm9yIChjb25zdCBrZXkgaW4gTU9ERVMpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgaWYgKHR5cGVvZiBNT0RFU1trZXldID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBkZWVwRnJlZXplKE1PREVTW2tleV0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIG1lcmdlIGFsbCB0aGUgbW9kZXMvcmVnZXhlcyBpbnRvIG91ciBtYWluIG9iamVjdFxuICBPYmplY3QuYXNzaWduKGhsanMsIE1PREVTKTtcblxuICByZXR1cm4gaGxqcztcbn07XG5cbi8vIE90aGVyIG5hbWVzIGZvciB0aGUgdmFyaWFibGUgbWF5IGJyZWFrIGJ1aWxkIHNjcmlwdFxuY29uc3QgaGlnaGxpZ2h0ID0gSExKUyh7fSk7XG5cbi8vIHJldHVybnMgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIGhpZ2hsaWdodGVyIHRvIGJlIHVzZWQgZm9yIGV4dGVuc2lvbnNcbi8vIGNoZWNrIGh0dHBzOi8vZ2l0aHViLmNvbS93b29vcm0vbG93bGlnaHQvaXNzdWVzLzQ3XG5oaWdobGlnaHQubmV3SW5zdGFuY2UgPSAoKSA9PiBITEpTKHt9KTtcblxubW9kdWxlLmV4cG9ydHMgPSBoaWdobGlnaHQ7XG5oaWdobGlnaHQuSGlnaGxpZ2h0SlMgPSBoaWdobGlnaHQ7XG5oaWdobGlnaHQuZGVmYXVsdCA9IGhpZ2hsaWdodDtcbiIsICIvKipcbiAqIENvZGVGbG93IHdlYnZpZXcgcHJvdG9jb2wuXG4gKlxuICogVGhlIGV4dGVuc2lvbiBob3N0IGFuZCB0aGUgd2VidmlldyBhcmUgc2VwYXJhdGUgSmF2YVNjcmlwdCBjb250ZXh0cy4gRXZlcnlcbiAqIG1lc3NhZ2UgdGhhdCBjcm9zc2VzIHRoYXQgYm91bmRhcnkgbXVzdCBwYXNzIHRocm91Z2ggdGhpcyBtb2R1bGUgc28gdGhhdCBhXG4gKiBzaW5nbGUsIHZlcnNpb25lZCBjb250cmFjdCBkZWNpZGVzIHdoYXQgaXMgbGVnYWwuXG4gKlxuICogVGhpcyBtb2R1bGUgaXMgaW50ZW50aW9uYWxseSBkZXBlbmRlbmN5LWZyZWU6IGl0IGlzIGJ1bmRsZWQgaW50byBib3RoIHRoZVxuICogZXh0ZW5zaW9uIGhvc3QgYW5kIHRoZSB3ZWJ2aWV3LlxuICovXG5cbmV4cG9ydCBjb25zdCBQUk9UT0NPTF9WRVJTSU9OID0gMTtcblxuLyoqIEhhcmQgY2VpbGluZyBvbiBhIHNlcmlhbGl6ZWQgbWVzc2FnZS4gTGFyZ2VyIG1lc3NhZ2VzIGFyZSByZWplY3RlZCwgbmV2ZXIgdHJ1bmNhdGVkLiAqL1xuZXhwb3J0IGNvbnN0IE1BWF9QQVlMT0FEX0JZVEVTID0gMV8wMDBfMDAwO1xuXG4vKiogYGRvbWFpbi5hY3Rpb25gIGluIGxvd2VyIGNhc2UsIGF0IGxlYXN0IHR3byBzZWdtZW50cy4gKi9cbmV4cG9ydCBjb25zdCBLSU5EX1BBVFRFUk4gPSAvXlthLXpdKyhcXC5bYS16XSspKyQvO1xuXG5leHBvcnQgY29uc3QgUkVRVUVTVF9JRF9QQVRURVJOID0gL15bQS1aYS16MC05Xy1dezEsMTI4fSQvO1xuXG4vKiogS2luZHMgYSB3ZWJ2aWV3IG1heSBzZW5kIHRvIHRoZSBob3N0LiAqL1xuZXhwb3J0IGNvbnN0IFdFQlZJRVdfVE9fSE9TVCA9IE9iamVjdC5mcmVlemUoW1xuICAnd2Vidmlldy5yZWFkeScsXG4gICdncmFwaC5sb2FkJyxcbiAgJ2Nzci5sb2FkJyxcbiAgJ25vZGUuc2VsZWN0JyxcbiAgJ3BhbmVsLnBpbmcnLFxuICAncXVlcnkuc3ltYm9sJyxcbiAgJ3F1ZXJ5LnN5bWJvbHMnLFxuICAncXVlcnkuY2FsbGVycycsXG4gICdxdWVyeS5jYWxsZWVzJyxcbiAgJ3F1ZXJ5LmNvbnN0cnVjdHMnLFxuICAncXVlcnkuY2FwYWJpbGl0aWVzJyxcbiAgJ2NmZy5mdW5jdGlvbnMnLFxuICAnY2ZnLmxvYWQnLFxuICAnc291cmNlLnNsaWNlJyxcbiAgJ3NvdXJjZS52YWxpZGF0aW9uJyxcbiAgJ25hdmlnYXRlLnRvJyxcbiAgJ2V4cGxhaW4ubm9kZScsXG4gICdleHBsYWluLmZ1bmN0aW9uJyxcbiAgJ2NhbGxzLmxvYWQnLFxuICAnY2FsbHMub3V0Z29pbmcnLFxuICAnY2FsbHMuaW5jb21pbmcnLFxuICAnY2FsbHMuZXhwYW5kJyxcbiAgJ2NhbGxzLmNvbGxhcHNlJyxcbiAgJ2NhbGxzLmZpbHRlcicsXG4gICdjYWxscy5mb2N1cycsXG4gICdpbmRleC5zdGF0dXMnLFxuICAnem9vbS5vcGVuJyxcbiAgJ3pvb20uZGVzY2VuZCcsXG4gICd6b29tLmJyZWFkY3J1bWInLFxuICAnem9vbS5leHBhbmQnLFxuICAnem9vbS5zZWFyY2gnLFxuICAnem9vbS5maWx0ZXInLFxuICAnem9vbS5mb2N1cycsXG4gICdkZmcubG9hZCcsXG4gICdkZmcudHJhY2UnLFxuICAnZGZnLnNsaWNlJyxcbl0pO1xuXG4vKiogS2luZHMgdGhlIGhvc3QgbWF5IHNlbmQgdG8gdGhlIHdlYnZpZXcuICovXG5leHBvcnQgY29uc3QgSE9TVF9UT19XRUJWSUVXID0gT2JqZWN0LmZyZWV6ZShbXG4gICdncmFwaC5kYXRhJyxcbiAgJ2NhcGFiaWxpdGllcy5kYXRhJyxcbiAgJ2Nzci5kYXRhJyxcbiAgJ3F1ZXJ5LmRhdGEnLFxuICAnYW5hbHlzaXMucHJvZ3Jlc3MnLFxuICAncHJvdG9jb2wuZXJyb3InLFxuICAncHJvdG9jb2wuYWNrJyxcbiAgJ3BhbmVsLnBvbmcnLFxuICAnY2ZnLmZ1bmN0aW9ucycsXG4gICdjZmcuZGF0YScsXG4gICdzb3VyY2UuZGF0YScsXG4gICdzb3VyY2UuaW50ZWdyaXR5JyxcbiAgJ3NvdXJjZS5zdGFsZScsXG4gICduYXZpZ2F0ZS5kb25lJyxcbiAgJ3NlbGVjdGlvbi5jaGFuZ2VkJyxcbiAgJ2dyYXBoLmZvY3VzJyxcbiAgJ3NldHRpbmdzLmRhdGEnLFxuICAnZXhwbGFpbi5kYXRhJyxcbiAgJ2NhbGxzLmRhdGEnLFxuICAnY2FsbHMubmVpZ2hib3JzJyxcbiAgJ2luZGV4LmRhdGEnLFxuICAnem9vbS5kYXRhJyxcbiAgJ3pvb20ubWVtYmVycycsXG4gICd6b29tLnJlc3VsdHMnLFxuICAnZGZnLmRhdGEnLFxuICAnZGZnLm92ZXJsYXknLFxuICAnZGZnLmVycm9yJyxcbl0pO1xuXG5leHBvcnQgY29uc3QgRElSRUNUSU9OUyA9IE9iamVjdC5mcmVlemUoe1xuICBXRUJWSUVXX1RPX0hPU1Q6ICd3ZWJ2aWV3X3RvX2hvc3QnLFxuICBIT1NUX1RPX1dFQlZJRVc6ICdob3N0X3RvX3dlYnZpZXcnLFxufSk7XG5cbmNvbnN0IEtJTkRfQUxMT1dMSVNUID0gT2JqZWN0LmZyZWV6ZSh7XG4gIFtESVJFQ1RJT05TLldFQlZJRVdfVE9fSE9TVF06IG5ldyBTZXQoV0VCVklFV19UT19IT1NUKSxcbiAgW0RJUkVDVElPTlMuSE9TVF9UT19XRUJWSUVXXTogbmV3IFNldChIT1NUX1RPX1dFQlZJRVcpLFxufSk7XG5cbmNvbnN0IFVOU0FGRV9LRVlTID0gbmV3IFNldChbJ19fcHJvdG9fXycsICdjb25zdHJ1Y3RvcicsICdwcm90b3R5cGUnXSk7XG5cbmNvbnN0IE1BWF9LRVlfU0NBTl9ERVBUSCA9IDg7XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gRW52ZWxvcGVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBwcm90b2NvbFZlcnNpb25cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBraW5kXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3JlcXVlc3RJZF1cbiAqIEBwcm9wZXJ0eSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IHBheWxvYWRcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFZhbGlkYXRpb25TdWNjZXNzXG4gKiBAcHJvcGVydHkge3RydWV9IG9rXG4gKiBAcHJvcGVydHkge0VudmVsb3BlfSBlbnZlbG9wZVxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gVmFsaWRhdGlvbkZhaWx1cmVcbiAqIEBwcm9wZXJ0eSB7ZmFsc2V9IG9rXG4gKiBAcHJvcGVydHkgeydFX1BST1RPQ09MJ3wnRV9MSU1JVCd9IGNvZGVcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSByZWFzb25cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBtZXNzYWdlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3BhdGhdXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3JlcXVlc3RJZF1cbiAqL1xuXG4vKipcbiAqIEJ1aWxkIGEgd2VsbC1mb3JtZWQgZW52ZWxvcGUuIFByb2R1Y2VycyBzaG91bGQgdXNlIHRoaXMgaW5zdGVhZCBvZiB3cml0aW5nXG4gKiBvYmplY3QgbGl0ZXJhbHMgc28gdGhhdCB0aGUgdmVyc2lvbiBmaWVsZCBjYW4gbmV2ZXIgYmUgZm9yZ290dGVuLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBraW5kXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBbcGF5bG9hZF1cbiAqIEBwYXJhbSB7c3RyaW5nfSBbcmVxdWVzdElkXVxuICogQHJldHVybnMge0VudmVsb3BlfVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRW52ZWxvcGUoa2luZCwgcGF5bG9hZCwgcmVxdWVzdElkKSB7XG4gIC8qKiBAdHlwZSB7RW52ZWxvcGV9ICovXG4gIGNvbnN0IGVudmVsb3BlID0ge1xuICAgIHByb3RvY29sVmVyc2lvbjogUFJPVE9DT0xfVkVSU0lPTixcbiAgICBraW5kLFxuICAgIHBheWxvYWQ6IHBheWxvYWQgPz8ge30sXG4gIH07XG4gIGlmIChyZXF1ZXN0SWQpIHtcbiAgICBlbnZlbG9wZS5yZXF1ZXN0SWQgPSByZXF1ZXN0SWQ7XG4gIH1cbiAgcmV0dXJuIGVudmVsb3BlO1xufVxuXG4vKipcbiAqIEJ1aWxkIGEgdHlwZWQgZXJyb3IgcGF5bG9hZC4gYGRldGFpbGAgbXVzdCBuZXZlciBjb250YWluIHNvdXJjZSB0ZXh0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW2RldGFpbF1cbiAqIEByZXR1cm5zIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVycm9yUGF5bG9hZChjb2RlLCBtZXNzYWdlLCBkZXRhaWwpIHtcbiAgLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi9cbiAgY29uc3QgcGF5bG9hZCA9IHsgY29kZSwgbWVzc2FnZSB9O1xuICBpZiAoZGV0YWlsKSB7XG4gICAgcGF5bG9hZC5kZXRhaWwgPSBkZXRhaWw7XG4gIH1cbiAgcmV0dXJuIHBheWxvYWQ7XG59XG5cbi8qKlxuICogQXBwcm94aW1hdGUgc2VyaWFsaXplZCBzaXplIG9mIGEgbWVzc2FnZS4gVXNlZCBmb3IgbGltaXQgZW5mb3JjZW1lbnQ7IHRoZVxuICogZXhhY3QgYnl0ZXMgZG8gbm90IG1hdHRlciwgb25seSB0aGF0IG92ZXJzaXplZCBtZXNzYWdlcyBhcmUgcmVmdXNlZCBiZWZvcmVcbiAqIHRoZXkgYXJlIHBvc3RlZC5cbiAqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gbWVzc2FnZVNpemUodmFsdWUpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBqc29uID0gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xuICAgIHJldHVybiB0eXBlb2YganNvbiA9PT0gJ3N0cmluZycgPyBqc29uLmxlbmd0aCA6IDA7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcmV0dXJucyB7dmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj59XG4gKi9cbmZ1bmN0aW9uIGlzUGxhaW5PYmplY3QodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpO1xufVxuXG4vKipcbiAqIFJlamVjdCBwYXlsb2FkcyB0aGF0IGNvdWxkIHBvaXNvbiBwcm90b3R5cGVzIHdoZW4gbWVyZ2VkIG9yIHNwcmVhZC5cbiAqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aFxuICogQHBhcmFtIHtudW1iZXJ9IGRlcHRoXG4gKiBAcmV0dXJucyB7e29rOiB0cnVlfSB8IHtvazogZmFsc2UsIHBhdGg6IHN0cmluZywga2V5OiBzdHJpbmd9fVxuICovXG5mdW5jdGlvbiBzY2FuVW5zYWZlS2V5cyh2YWx1ZSwgcGF0aCwgZGVwdGgpIHtcbiAgaWYgKGRlcHRoID4gTUFYX0tFWV9TQ0FOX0RFUFRIIHx8IHZhbHVlID09PSBudWxsIHx8IHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4geyBvazogdHJ1ZSB9O1xuICB9XG4gIGNvbnN0IGVudHJpZXMgPSBBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlLmVudHJpZXMoKSA6IE9iamVjdC5lbnRyaWVzKHZhbHVlKTtcbiAgZm9yIChjb25zdCBba2V5LCBjaGlsZF0gb2YgZW50cmllcykge1xuICAgIGNvbnN0IGNoaWxkUGF0aCA9IEFycmF5LmlzQXJyYXkodmFsdWUpID8gYCR7cGF0aH1bJHtrZXl9XWAgOiBgJHtwYXRofS4ke2tleX1gO1xuICAgIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgVU5TQUZFX0tFWVMuaGFzKFN0cmluZyhrZXkpKSkge1xuICAgICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBwYXRoOiBjaGlsZFBhdGgsIGtleTogU3RyaW5nKGtleSkgfTtcbiAgICB9XG4gICAgY29uc3QgbmVzdGVkID0gc2NhblVuc2FmZUtleXMoY2hpbGQsIGNoaWxkUGF0aCwgZGVwdGggKyAxKTtcbiAgICBpZiAoIW5lc3RlZC5vaykge1xuICAgICAgcmV0dXJuIG5lc3RlZDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHsgb2s6IHRydWUgfTtcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSBhbiBpbmJvdW5kIG1lc3NhZ2UgYWdhaW5zdCB0aGUgcHJvdG9jb2wgY29udHJhY3QuXG4gKlxuICogVmFsaWRhdGlvbiBpcyB0b3RhbDogZXZlcnkgcmVqZWN0aW9uIHJldHVybnMgYSB0eXBlZCBmYWlsdXJlIHdpdGggYSBzdGFibGVcbiAqIHJlYXNvbiBjb2RlLCBhbmQgbmV2ZXIgdGhyb3dzLlxuICpcbiAqIEBwYXJhbSB7dW5rbm93bn0gcmF3XG4gKiBAcGFyYW0ge3tkaXJlY3Rpb246ICd3ZWJ2aWV3X3RvX2hvc3QnIHwgJ2hvc3RfdG9fd2Vidmlldyd9fSBvcHRpb25zXG4gKiBAcmV0dXJucyB7VmFsaWRhdGlvblN1Y2Nlc3MgfCBWYWxpZGF0aW9uRmFpbHVyZX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlRW52ZWxvcGUocmF3LCBvcHRpb25zKSB7XG4gIGNvbnN0IGRpcmVjdGlvbiA9IG9wdGlvbnM/LmRpcmVjdGlvbjtcbiAgY29uc3QgYWxsb3dsaXN0ID0gS0lORF9BTExPV0xJU1RbZGlyZWN0aW9uXTtcbiAgaWYgKCFhbGxvd2xpc3QpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAndW5rbm93bl9kaXJlY3Rpb24nLFxuICAgICAgbWVzc2FnZTogYFVua25vd24gcHJvdG9jb2wgZGlyZWN0aW9uOiAke1N0cmluZyhkaXJlY3Rpb24pfWAsXG4gICAgfTtcbiAgfVxuXG4gIGlmICghaXNQbGFpbk9iamVjdChyYXcpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgIHJlYXNvbjogJ25vdF9hbl9vYmplY3QnLFxuICAgICAgbWVzc2FnZTogJ01lc3NhZ2UgbXVzdCBiZSBhIHBsYWluIG9iamVjdC4nLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBjYW5kaWRhdGUgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAocmF3KTtcblxuICBpZiAoY2FuZGlkYXRlLnByb3RvY29sVmVyc2lvbiAhPT0gUFJPVE9DT0xfVkVSU0lPTikge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9QUk9UT0NPTCcsXG4gICAgICByZWFzb246ICd2ZXJzaW9uX21pc21hdGNoJyxcbiAgICAgIG1lc3NhZ2U6IGBVbnN1cHBvcnRlZCBwcm90b2NvbCB2ZXJzaW9uOiBleHBlY3RlZCAke1BST1RPQ09MX1ZFUlNJT059LCByZWNlaXZlZCAke1N0cmluZyhcbiAgICAgICAgY2FuZGlkYXRlLnByb3RvY29sVmVyc2lvbixcbiAgICAgICl9LmAsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGtpbmQgPSBjYW5kaWRhdGUua2luZDtcbiAgaWYgKHR5cGVvZiBraW5kICE9PSAnc3RyaW5nJyB8fCAhS0lORF9QQVRURVJOLnRlc3Qoa2luZCkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAnaW52YWxpZF9raW5kJyxcbiAgICAgIG1lc3NhZ2U6ICdNZXNzYWdlIGtpbmQgbXVzdCBsb29rIGxpa2UgXCJkb21haW4uYWN0aW9uXCIgaW4gbG93ZXIgY2FzZS4nLFxuICAgICAgcGF0aDogJ2tpbmQnLFxuICAgIH07XG4gIH1cblxuICBpZiAoIWFsbG93bGlzdC5oYXMoa2luZCkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAndW5rbm93bl9raW5kJyxcbiAgICAgIG1lc3NhZ2U6IGBLaW5kIFwiJHtraW5kfVwiIGlzIG5vdCBhY2NlcHRlZCBpbiBkaXJlY3Rpb24gXCIke2RpcmVjdGlvbn1cIi5gLFxuICAgICAgcGF0aDogJ2tpbmQnLFxuICAgIH07XG4gIH1cblxuICBjb25zdCByZXF1ZXN0SWQgPSBjYW5kaWRhdGUucmVxdWVzdElkO1xuICBpZiAocmVxdWVzdElkICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAodHlwZW9mIHJlcXVlc3RJZCAhPT0gJ3N0cmluZycgfHwgIVJFUVVFU1RfSURfUEFUVEVSTi50ZXN0KHJlcXVlc3RJZCkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgICByZWFzb246ICdpbnZhbGlkX3JlcXVlc3RfaWQnLFxuICAgICAgICBtZXNzYWdlOiAncmVxdWVzdElkIG11c3QgYmUgMS0xMjggY2hhcmFjdGVycyBvZiBBLVosIGEteiwgMC05LCBcIl9cIiBvciBcIi1cIi4nLFxuICAgICAgICBwYXRoOiAncmVxdWVzdElkJyxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgY29uc3QgcGF5bG9hZCA9IGNhbmRpZGF0ZS5wYXlsb2FkID8/IHt9O1xuICBpZiAoIWlzUGxhaW5PYmplY3QocGF5bG9hZCkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAnaW52YWxpZF9wYXlsb2FkJyxcbiAgICAgIG1lc3NhZ2U6ICdwYXlsb2FkIG11c3QgYmUgYSBwbGFpbiBvYmplY3QuJyxcbiAgICAgIHBhdGg6ICdwYXlsb2FkJyxcbiAgICAgIHJlcXVlc3RJZDogdHlwZW9mIHJlcXVlc3RJZCA9PT0gJ3N0cmluZycgPyByZXF1ZXN0SWQgOiB1bmRlZmluZWQsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGtleVNjYW4gPSBzY2FuVW5zYWZlS2V5cyhwYXlsb2FkLCAncGF5bG9hZCcsIDApO1xuICBpZiAoIWtleVNjYW4ub2spIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAndW5zYWZlX2tleScsXG4gICAgICBtZXNzYWdlOiBgUGF5bG9hZCBjb250YWlucyBhIGZvcmJpZGRlbiBrZXkgXCIke2tleVNjYW4ua2V5fVwiLmAsXG4gICAgICBwYXRoOiBrZXlTY2FuLnBhdGgsXG4gICAgICByZXF1ZXN0SWQ6IHR5cGVvZiByZXF1ZXN0SWQgPT09ICdzdHJpbmcnID8gcmVxdWVzdElkIDogdW5kZWZpbmVkLFxuICAgIH07XG4gIH1cblxuICBpZiAobWVzc2FnZVNpemUoY2FuZGlkYXRlKSA+IE1BWF9QQVlMT0FEX0JZVEVTKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX0xJTUlUJyxcbiAgICAgIHJlYXNvbjogJ3BheWxvYWRfdG9vX2xhcmdlJyxcbiAgICAgIG1lc3NhZ2U6IGBNZXNzYWdlIGV4Y2VlZHMgdGhlICR7TUFYX1BBWUxPQURfQllURVN9IGJ5dGUgbGltaXQuYCxcbiAgICAgIHJlcXVlc3RJZDogdHlwZW9mIHJlcXVlc3RJZCA9PT0gJ3N0cmluZycgPyByZXF1ZXN0SWQgOiB1bmRlZmluZWQsXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBAdHlwZSB7RW52ZWxvcGV9ICovXG4gIGNvbnN0IGVudmVsb3BlID0ge1xuICAgIHByb3RvY29sVmVyc2lvbjogUFJPVE9DT0xfVkVSU0lPTixcbiAgICBraW5kLFxuICAgIHBheWxvYWQsXG4gIH07XG4gIGlmICh0eXBlb2YgcmVxdWVzdElkID09PSAnc3RyaW5nJykge1xuICAgIGVudmVsb3BlLnJlcXVlc3RJZCA9IHJlcXVlc3RJZDtcbiAgfVxuXG4gIHJldHVybiB7IG9rOiB0cnVlLCBlbnZlbG9wZSB9O1xufVxuIiwgIi8qKlxuICogV2VidmlldyBtZXNzYWdlIGJyaWRnZS5cbiAqXG4gKiBTeW1tZXRyaWMgaW1wbGVtZW50YXRpb24gdXNlZCBieSBib3RoIHRoZSBleHRlbnNpb24gaG9zdCBhbmQgdGhlIHdlYnZpZXcuXG4gKiBSZXNwb25zaWJpbGl0aWVzOlxuICogLSBWYWxpZGF0ZSBldmVyeSBpbmJvdW5kIG1lc3NhZ2UgYmVmb3JlIGFueSBoYW5kbGVyIHNlZXMgaXQuXG4gKiAtIENvcnJlbGF0ZSByZXF1ZXN0cyB3aXRoIHJlc3BvbnNlcywgd2l0aCBhIHRpbWVvdXQgcGVyIHJlcXVlc3QuXG4gKiAtIENvbnRhaW4gaGFuZGxlciBmYWlsdXJlcyBhbmQgcmVwb3J0IHRoZW0gYXMgdHlwZWQgcHJvdG9jb2wgZXJyb3JzLlxuICogLSBSZWplY3Qgd29yayBhZnRlciBkaXNwb3NhbCBzbyBhIGNsb3NlZCBwYW5lbCBjYW5ub3QgbGVhayB0aW1lcnMuXG4gKlxuICogVGhlIGJyaWRnZSBoYXMgbm8gZGVwZW5kZW5jeSBvbiB0aGUgYHZzY29kZWAgbW9kdWxlOiB0aGUgdHJhbnNwb3J0IChgcG9zdGApXG4gKiBpcyBpbmplY3RlZC4gVGhhdCBtYWtlcyB0aGUgd2hvbGUgcmVxdWVzdC9yZXNwb25zZSBjb250cmFjdCB1bml0LXRlc3RhYmxlIGluXG4gKiBwbGFpbiBOb2RlLlxuICovXG5cbmltcG9ydCB7XG4gIERJUkVDVElPTlMsXG4gIEhPU1RfVE9fV0VCVklFVyxcbiAgV0VCVklFV19UT19IT1NULFxuICBjcmVhdGVFbnZlbG9wZSxcbiAgY3JlYXRlRXJyb3JQYXlsb2FkLFxuICBtZXNzYWdlU2l6ZSxcbiAgdmFsaWRhdGVFbnZlbG9wZSxcbn0gZnJvbSAnLi9lbnZlbG9wZS5qcyc7XG5cbmV4cG9ydCBjbGFzcyBQcm90b2NvbEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW2RldGFpbF1cbiAgICovXG4gIGNvbnN0cnVjdG9yKGNvZGUsIG1lc3NhZ2UsIGRldGFpbCkge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMubmFtZSA9ICdQcm90b2NvbEVycm9yJztcbiAgICB0aGlzLmNvZGUgPSBjb2RlO1xuICAgIGlmIChkZXRhaWwpIHtcbiAgICAgIHRoaXMuZGV0YWlsID0gZGV0YWlsO1xuICAgIH1cbiAgfVxufVxuXG4vKiogQHR5cGUge3tkZWJ1ZzogRnVuY3Rpb24sIHdhcm46IEZ1bmN0aW9uLCBlcnJvcjogRnVuY3Rpb259fSAqL1xuY29uc3QgTk9PUF9MT0dHRVIgPSB7XG4gIGRlYnVnKCkge30sXG4gIHdhcm4oKSB7fSxcbiAgZXJyb3IoKSB7fSxcbn07XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gQnJpZGdlT3B0aW9uc1xuICogQHByb3BlcnR5IHsobWVzc2FnZTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID0+IHZvaWR9IHBvc3QgIFRyYW5zcG9ydCB0byB0aGUgb3RoZXIgc2lkZS5cbiAqIEBwcm9wZXJ0eSB7J3dlYnZpZXdfdG9faG9zdCcgfCAnaG9zdF90b193ZWJ2aWV3J30gaW5ib3VuZERpcmVjdGlvblxuICogQHByb3BlcnR5IHtudW1iZXJ9IFt0aW1lb3V0TXNdXG4gKiBAcHJvcGVydHkge251bWJlcn0gW21heEluRmxpZ2h0XVxuICogQHByb3BlcnR5IHsoKSA9PiBzdHJpbmd9IFtjcmVhdGVSZXF1ZXN0SWRdXG4gKiBAcHJvcGVydHkge3R5cGVvZiBOT09QX0xPR0dFUn0gW2xvZ2dlcl1cbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7QnJpZGdlT3B0aW9uc30gb3B0aW9uc1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQnJpZGdlKG9wdGlvbnMpIHtcbiAgY29uc3QgeyBwb3N0LCBpbmJvdW5kRGlyZWN0aW9uLCBsb2dnZXIgPSBOT09QX0xPR0dFUiB9ID0gb3B0aW9ucztcbiAgY29uc3QgdGltZW91dE1zID0gb3B0aW9ucy50aW1lb3V0TXMgPz8gNTAwMDtcbiAgY29uc3QgbWF4SW5GbGlnaHQgPSBvcHRpb25zLm1heEluRmxpZ2h0ID8/IDMyO1xuICBjb25zdCBvdXRib3VuZERpcmVjdGlvbiA9XG4gICAgaW5ib3VuZERpcmVjdGlvbiA9PT0gRElSRUNUSU9OUy5XRUJWSUVXX1RPX0hPU1RcbiAgICAgID8gRElSRUNUSU9OUy5IT1NUX1RPX1dFQlZJRVdcbiAgICAgIDogRElSRUNUSU9OUy5XRUJWSUVXX1RPX0hPU1Q7XG4gIGNvbnN0IG91dGJvdW5kS2luZHMgPSBuZXcgU2V0KFxuICAgIG91dGJvdW5kRGlyZWN0aW9uID09PSBESVJFQ1RJT05TLkhPU1RfVE9fV0VCVklFVyA/IEhPU1RfVE9fV0VCVklFVyA6IFdFQlZJRVdfVE9fSE9TVCxcbiAgKTtcblxuICBsZXQgc2VxdWVuY2UgPSAwO1xuICBjb25zdCBjcmVhdGVSZXF1ZXN0SWQgPVxuICAgIG9wdGlvbnMuY3JlYXRlUmVxdWVzdElkID8/XG4gICAgKCgpID0+IHtcbiAgICAgIHNlcXVlbmNlICs9IDE7XG4gICAgICByZXR1cm4gYHIke3NlcXVlbmNlLnRvU3RyaW5nKDM2KX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCAxMCl9YDtcbiAgICB9KTtcblxuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIHtyZXNvbHZlOiBGdW5jdGlvbiwgcmVqZWN0OiBGdW5jdGlvbiwgdGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+fT59ICovXG4gIGNvbnN0IHBlbmRpbmcgPSBuZXcgTWFwKCk7XG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywgKHBheWxvYWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCBtZXRhOiB7cmVxdWVzdElkPzogc3RyaW5nfSkgPT4gdW5rbm93bj59ICovXG4gIGNvbnN0IGhhbmRsZXJzID0gbmV3IE1hcCgpO1xuICBjb25zdCByZXBvcnRlZEtpbmRzID0gbmV3IFNldCgpO1xuICBsZXQgZGlzcG9zZWQgPSBmYWxzZTtcblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtpbmRcbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gcGF5bG9hZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3JlcXVlc3RJZF1cbiAgICovXG4gIGZ1bmN0aW9uIHNlbmQoa2luZCwgcGF5bG9hZCwgcmVxdWVzdElkKSB7XG4gICAgaWYgKGRpc3Bvc2VkKSB7XG4gICAgICB0aHJvdyBuZXcgUHJvdG9jb2xFcnJvcignRV9DQU5DRUxMRUQnLCAnQnJpZGdlIGlzIGRpc3Bvc2VkLicpO1xuICAgIH1cbiAgICBpZiAoIW91dGJvdW5kS2luZHMuaGFzKGtpbmQpKSB7XG4gICAgICB0aHJvdyBuZXcgUHJvdG9jb2xFcnJvcignRV9QUk9UT0NPTCcsIGBLaW5kIFwiJHtraW5kfVwiIGlzIG5vdCBzZW5kYWJsZSBpbiB0aGlzIGRpcmVjdGlvbi5gKTtcbiAgICB9XG4gICAgY29uc3QgZW52ZWxvcGUgPSBjcmVhdGVFbnZlbG9wZShraW5kLCBwYXlsb2FkLCByZXF1ZXN0SWQpO1xuICAgIGlmIChtZXNzYWdlU2l6ZShlbnZlbG9wZSkgPiAxXzAwMF8wMDApIHtcbiAgICAgIHRocm93IG5ldyBQcm90b2NvbEVycm9yKCdFX0xJTUlUJywgJ1JlZnVzaW5nIHRvIHNlbmQgYW4gb3ZlcnNpemVkIG1lc3NhZ2UuJyk7XG4gICAgfVxuICAgIHBvc3QoZW52ZWxvcGUpO1xuICAgIGxvZ2dlci5kZWJ1ZygncHJvdG9jb2wuc2VuZCcsIHtcbiAgICAgIGtpbmQsXG4gICAgICByZXF1ZXN0SWQ6IHJlcXVlc3RJZCA/PyBudWxsLFxuICAgICAgYnl0ZXM6IG1lc3NhZ2VTaXplKGVudmVsb3BlKSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3JlcXVlc3RJZF1cbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW2RldGFpbF1cbiAgICovXG4gIGZ1bmN0aW9uIHNlbmRFcnJvcihjb2RlLCBtZXNzYWdlLCByZXF1ZXN0SWQsIGRldGFpbCkge1xuICAgIHRyeSB7XG4gICAgICBzZW5kKCdwcm90b2NvbC5lcnJvcicsIGNyZWF0ZUVycm9yUGF5bG9hZChjb2RlLCBtZXNzYWdlLCBkZXRhaWwpLCByZXF1ZXN0SWQpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gVGhlIHBhbmVsIG1heSBhbHJlYWR5IGJlIGdvbmUuIE5vdGhpbmcgdXNlZnVsIHJlbWFpbnMgdG8gZG8uXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBraW5kXG4gICAqIEBwYXJhbSB7KHBheWxvYWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCBtZXRhOiB7cmVxdWVzdElkPzogc3RyaW5nfSkgPT4gdW5rbm93bn0gaGFuZGxlclxuICAgKiBAcmV0dXJucyB7KCkgPT4gdm9pZH0gdW5zdWJzY3JpYmVcbiAgICovXG4gIGZ1bmN0aW9uIG9uKGtpbmQsIGhhbmRsZXIpIHtcbiAgICBoYW5kbGVycy5zZXQoa2luZCwgaGFuZGxlcik7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGlmIChoYW5kbGVycy5nZXQoa2luZCkgPT09IGhhbmRsZXIpIHtcbiAgICAgICAgaGFuZGxlcnMuZGVsZXRlKGtpbmQpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2VuZCBhIHJlcXVlc3QgYW5kIGF3YWl0IHRoZSBjb3JyZWxhdGVkIHJlc3BvbnNlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2luZFxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBbcGF5bG9hZF1cbiAgICogQHBhcmFtIHt7dGltZW91dE1zPzogbnVtYmVyfX0gW3JlcXVlc3RPcHRpb25zXVxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTx7a2luZDogc3RyaW5nLCBwYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0+fVxuICAgKi9cbiAgZnVuY3Rpb24gcmVxdWVzdChraW5kLCBwYXlsb2FkID0ge30sIHJlcXVlc3RPcHRpb25zID0ge30pIHtcbiAgICBpZiAoZGlzcG9zZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgUHJvdG9jb2xFcnJvcignRV9DQU5DRUxMRUQnLCAnQnJpZGdlIGlzIGRpc3Bvc2VkLicpKTtcbiAgICB9XG4gICAgaWYgKHBlbmRpbmcuc2l6ZSA+PSBtYXhJbkZsaWdodCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KFxuICAgICAgICBuZXcgUHJvdG9jb2xFcnJvcignRV9MSU1JVCcsIGBUb28gbWFueSBpbi1mbGlnaHQgcmVxdWVzdHMgKCR7bWF4SW5GbGlnaHR9KS5gKSxcbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IHJlcXVlc3RJZCA9IGNyZWF0ZVJlcXVlc3RJZCgpO1xuICAgIGNvbnN0IGVmZmVjdGl2ZVRpbWVvdXQgPSByZXF1ZXN0T3B0aW9ucy50aW1lb3V0TXMgPz8gdGltZW91dE1zO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHBlbmRpbmcuZGVsZXRlKHJlcXVlc3RJZCk7XG4gICAgICAgIHJlamVjdChcbiAgICAgICAgICBuZXcgUHJvdG9jb2xFcnJvcihcbiAgICAgICAgICAgICdFX1RJTUVPVVQnLFxuICAgICAgICAgICAgYE5vIHJlc3BvbnNlIHRvIFwiJHtraW5kfVwiIHdpdGhpbiAke2VmZmVjdGl2ZVRpbWVvdXR9IG1zLmAsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGtpbmQsXG4gICAgICAgICAgICAgIHJlcXVlc3RJZCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgKSxcbiAgICAgICAgKTtcbiAgICAgIH0sIGVmZmVjdGl2ZVRpbWVvdXQpO1xuICAgICAgcGVuZGluZy5zZXQocmVxdWVzdElkLCB7IHJlc29sdmUsIHJlamVjdCwgdGltZXIgfSk7XG4gICAgICB0cnkge1xuICAgICAgICBzZW5kKGtpbmQsIHBheWxvYWQsIHJlcXVlc3RJZCk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICBwZW5kaW5nLmRlbGV0ZShyZXF1ZXN0SWQpO1xuICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7dW5rbm93bn0gcmF3XG4gICAqIEByZXR1cm5zIHtQcm9taXNlPHtvazogYm9vbGVhbiwgY29kZT86IHN0cmluZywgcmVhc29uPzogc3RyaW5nfT59XG4gICAqL1xuICBhc3luYyBmdW5jdGlvbiBoYW5kbGVNZXNzYWdlKHJhdykge1xuICAgIGlmIChkaXNwb3NlZCkge1xuICAgICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBjb2RlOiAnRV9DQU5DRUxMRUQnLCByZWFzb246ICdkaXNwb3NlZCcgfTtcbiAgICB9XG5cbiAgICBjb25zdCB2YWxpZGF0aW9uID0gdmFsaWRhdGVFbnZlbG9wZShyYXcsIHsgZGlyZWN0aW9uOiBpbmJvdW5kRGlyZWN0aW9uIH0pO1xuICAgIGlmICghdmFsaWRhdGlvbi5vaykge1xuICAgICAgaWYgKCFyZXBvcnRlZEtpbmRzLmhhcyh2YWxpZGF0aW9uLnJlYXNvbikpIHtcbiAgICAgICAgcmVwb3J0ZWRLaW5kcy5hZGQodmFsaWRhdGlvbi5yZWFzb24pO1xuICAgICAgICBsb2dnZXIud2FybigncHJvdG9jb2wucmVqZWN0ZWQnLCB7XG4gICAgICAgICAgcmVhc29uOiB2YWxpZGF0aW9uLnJlYXNvbixcbiAgICAgICAgICBwYXRoOiB2YWxpZGF0aW9uLnBhdGggPz8gbnVsbCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBzZW5kRXJyb3IodmFsaWRhdGlvbi5jb2RlLCB2YWxpZGF0aW9uLm1lc3NhZ2UsIHZhbGlkYXRpb24ucmVxdWVzdElkLCB7XG4gICAgICAgIHJlYXNvbjogdmFsaWRhdGlvbi5yZWFzb24sXG4gICAgICB9KTtcbiAgICAgIHJldHVybiB7IG9rOiBmYWxzZSwgY29kZTogdmFsaWRhdGlvbi5jb2RlLCByZWFzb246IHZhbGlkYXRpb24ucmVhc29uIH07XG4gICAgfVxuXG4gICAgY29uc3QgZW52ZWxvcGUgPSB2YWxpZGF0aW9uLmVudmVsb3BlO1xuICAgIGNvbnN0IHsga2luZCwgcmVxdWVzdElkLCBwYXlsb2FkIH0gPSBlbnZlbG9wZTtcbiAgICBsb2dnZXIuZGVidWcoJ3Byb3RvY29sLnJlY2VpdmUnLCB7XG4gICAgICBraW5kLFxuICAgICAgcmVxdWVzdElkOiByZXF1ZXN0SWQgPz8gbnVsbCxcbiAgICAgIGJ5dGVzOiBtZXNzYWdlU2l6ZShlbnZlbG9wZSksXG4gICAgfSk7XG5cbiAgICBpZiAoa2luZCA9PT0gJ3Byb3RvY29sLmVycm9yJykge1xuICAgICAgaWYgKHJlcXVlc3RJZCAmJiBwZW5kaW5nLmhhcyhyZXF1ZXN0SWQpKSB7XG4gICAgICAgIGNvbnN0IGVudHJ5ID0gcGVuZGluZy5nZXQocmVxdWVzdElkKTtcbiAgICAgICAgaWYgKGVudHJ5KSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KGVudHJ5LnRpbWVyKTtcbiAgICAgICAgICBwZW5kaW5nLmRlbGV0ZShyZXF1ZXN0SWQpO1xuICAgICAgICAgIGNvbnN0IGNvZGUgPSB0eXBlb2YgcGF5bG9hZC5jb2RlID09PSAnc3RyaW5nJyA/IHBheWxvYWQuY29kZSA6ICdFX1BST1RPQ09MJztcbiAgICAgICAgICBjb25zdCBtZXNzYWdlID1cbiAgICAgICAgICAgIHR5cGVvZiBwYXlsb2FkLm1lc3NhZ2UgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgID8gcGF5bG9hZC5tZXNzYWdlXG4gICAgICAgICAgICAgIDogJ1RoZSBvdGhlciBzaWRlIHJlcG9ydGVkIGFuIGVycm9yLic7XG4gICAgICAgICAgZW50cnkucmVqZWN0KG5ldyBQcm90b2NvbEVycm9yKGNvZGUsIG1lc3NhZ2UsIHsgcmVxdWVzdElkIH0pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHsgb2s6IHRydWUgfTtcbiAgICB9XG5cbiAgICBpZiAocmVxdWVzdElkICYmIHBlbmRpbmcuaGFzKHJlcXVlc3RJZCkpIHtcbiAgICAgIGNvbnN0IGVudHJ5ID0gcGVuZGluZy5nZXQocmVxdWVzdElkKTtcbiAgICAgIGlmIChlbnRyeSkge1xuICAgICAgICBjbGVhclRpbWVvdXQoZW50cnkudGltZXIpO1xuICAgICAgICBwZW5kaW5nLmRlbGV0ZShyZXF1ZXN0SWQpO1xuICAgICAgICBlbnRyeS5yZXNvbHZlKHsga2luZCwgcGF5bG9hZCB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7IG9rOiB0cnVlIH07XG4gICAgfVxuXG4gICAgY29uc3QgaGFuZGxlciA9IGhhbmRsZXJzLmdldChraW5kKTtcbiAgICBpZiAoIWhhbmRsZXIpIHtcbiAgICAgIC8vIEEgcmVzcG9uc2Ugd2hvc2UgcmVxdWVzdCBhbHJlYWR5IHRpbWVkIG91dCBpcyBleHBlY3RlZCBhbmQgaGFybWxlc3MuXG4gICAgICBsb2dnZXIuZGVidWcoJ3Byb3RvY29sLnVuaGFuZGxlZCcsIHsga2luZCwgcmVxdWVzdElkOiByZXF1ZXN0SWQgPz8gbnVsbCB9KTtcbiAgICAgIHJldHVybiB7IG9rOiB0cnVlIH07XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGhhbmRsZXIocGF5bG9hZCwgeyByZXF1ZXN0SWQgfSk7XG4gICAgICByZXR1cm4geyBvazogdHJ1ZSB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuICAgICAgY29uc3QgY29kZSA9XG4gICAgICAgIGVycm9yIGluc3RhbmNlb2YgUHJvdG9jb2xFcnJvclxuICAgICAgICAgID8gZXJyb3IuY29kZVxuICAgICAgICAgIDogKC8qKiBAdHlwZSB7e2NvZGU/OiBzdHJpbmd9fSAqLyAoZXJyb3IpPy5jb2RlID8/ICdFX1BST1RPQ09MJyk7XG4gICAgICBsb2dnZXIuZXJyb3IoJ3Byb3RvY29sLmhhbmRsZXJfZmFpbGVkJywgeyBraW5kLCBlcnJvcjogbWVzc2FnZSB9KTtcbiAgICAgIHNlbmRFcnJvcihjb2RlLCBtZXNzYWdlLCByZXF1ZXN0SWQpO1xuICAgICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBjb2RlIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZWFzb25cbiAgICovXG4gIGZ1bmN0aW9uIGRpc3Bvc2UocmVhc29uID0gJ2Rpc3Bvc2VkJykge1xuICAgIGlmIChkaXNwb3NlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkaXNwb3NlZCA9IHRydWU7XG4gICAgZm9yIChjb25zdCBbLCBlbnRyeV0gb2YgcGVuZGluZykge1xuICAgICAgY2xlYXJUaW1lb3V0KGVudHJ5LnRpbWVyKTtcbiAgICAgIGVudHJ5LnJlamVjdChuZXcgUHJvdG9jb2xFcnJvcignRV9DQU5DRUxMRUQnLCBgQnJpZGdlIGNsb3NlZDogJHtyZWFzb259YCkpO1xuICAgIH1cbiAgICBwZW5kaW5nLmNsZWFyKCk7XG4gICAgaGFuZGxlcnMuY2xlYXIoKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgb24sXG4gICAgcmVxdWVzdCxcbiAgICByZXNwb25kOiBzZW5kLFxuICAgIGhhbmRsZU1lc3NhZ2UsXG4gICAgZGlzcG9zZSxcbiAgICBwZW5kaW5nQ291bnQ6ICgpID0+IHBlbmRpbmcuc2l6ZSxcbiAgICBpc0Rpc3Bvc2VkOiAoKSA9PiBkaXNwb3NlZCxcbiAgICBkaXJlY3Rpb246IGluYm91bmREaXJlY3Rpb24sXG4gIH07XG59XG4iLCAiLyoqXG4gKiBEZXRlcm1pbmlzdGljIGxheWVyZWQgbGF5b3V0LlxuICpcbiAqIFBoYXNlIDAgbmVlZHMgcG9zaXRpb25zIHNvIHRoZSB3ZWJ2aWV3IGNhbiBkcmF3IHNvbWV0aGluZyB3aXRob3V0IG93bmluZyBhXG4gKiBsYXlvdXQgYWxnb3JpdGhtLiBQaGFzZSA0IGJlbmNobWFya3MgcmVhbCBlbmdpbmVzIChDeXRvc2NhcGUvRUxLL2RhZ3JlKSBhbmRcbiAqIHJlcGxhY2VzIHRoaXMgYmVoaW5kIHRoZSByZW5kZXJlciBib3VuZGFyeTsgdW50aWwgdGhlbiwgZGV0ZXJtaW5pc3RpYyBvdXRwdXRcbiAqIGlzIG1vcmUgdmFsdWFibGUgdGhhbiBwcmV0dHkgb3V0cHV0IGJlY2F1c2UgaXQgbWFrZXMgdGVzdHMgc3RhYmxlLlxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge2ltcG9ydCgnLi9tb2RlbC5qcycpLkdyYXBofSBHcmFwaFxuICogQHR5cGVkZWYge3t4OiBudW1iZXIsIHk6IG51bWJlciwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIGxheWVyOiBudW1iZXJ9fSBQb3NpdGlvblxuICovXG5cbmV4cG9ydCBjb25zdCBMQVlPVVRfREVGQVVMVFMgPSBPYmplY3QuZnJlZXplKHtcbiAgbm9kZVdpZHRoOiAxOTAsXG4gIG5vZGVIZWlnaHQ6IDU0LFxuICBob3Jpem9udGFsR2FwOiA5MCxcbiAgdmVydGljYWxHYXA6IDI2LFxuICBtYXhMYXllcnM6IDQwLFxufSk7XG5cbi8qKlxuICogQHBhcmFtIHtHcmFwaH0gZ3JhcGhcbiAqIEBwYXJhbSB7UGFydGlhbDx0eXBlb2YgTEFZT1VUX0RFRkFVTFRTPn0gW29wdGlvbnNdXG4gKiBAcmV0dXJucyB7e3Bvc2l0aW9uczogUmVjb3JkPHN0cmluZywgUG9zaXRpb24+LCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgbGF5ZXJzOiBzdHJpbmdbXVtdfX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVMYXlvdXQoZ3JhcGgsIG9wdGlvbnMgPSB7fSkge1xuICBjb25zdCBjb25maWcgPSB7IC4uLkxBWU9VVF9ERUZBVUxUUywgLi4ub3B0aW9ucyB9O1xuICBjb25zdCBub2RlSWRzID0gZ3JhcGgubm9kZXMubWFwKChub2RlKSA9PiBub2RlLmlkKTtcbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBudW1iZXI+fSAqL1xuICBjb25zdCBsYXllck9mID0gbmV3IE1hcCgpO1xuXG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywgc3RyaW5nW10+fSAqL1xuICBjb25zdCBpbmNvbWluZyA9IG5ldyBNYXAobm9kZUlkcy5tYXAoKGlkKSA9PiBbaWQsIFtdXSkpO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIHN0cmluZ1tdPn0gKi9cbiAgY29uc3Qgb3V0Z29pbmcgPSBuZXcgTWFwKG5vZGVJZHMubWFwKChpZCkgPT4gW2lkLCBbXV0pKTtcblxuICBmb3IgKGNvbnN0IGVkZ2Ugb2YgZ3JhcGguZWRnZXMpIHtcbiAgICBpZiAoIWluY29taW5nLmhhcyhlZGdlLnRvKSB8fCAhaW5jb21pbmcuaGFzKGVkZ2UuZnJvbSkgfHwgZWRnZS5mcm9tID09PSBlZGdlLnRvKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaW5jb21pbmcuZ2V0KGVkZ2UudG8pPy5wdXNoKGVkZ2UuZnJvbSk7XG4gICAgb3V0Z29pbmcuZ2V0KGVkZ2UuZnJvbSk/LnB1c2goZWRnZS50byk7XG4gIH1cblxuICAvLyBLYWhuJ3MgYWxnb3JpdGhtIGdpdmVzIGEgdG9wb2xvZ2ljYWwgb3JkZXI7IGN5Y2xlcyBhcmUgaGFuZGxlZCBhZnRlcndhcmRzLlxuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIG51bWJlcj59ICovXG4gIGNvbnN0IGluZGVncmVlID0gbmV3IE1hcChub2RlSWRzLm1hcCgoaWQpID0+IFtpZCwgaW5jb21pbmcuZ2V0KGlkKT8ubGVuZ3RoID8/IDBdKSk7XG4gIGNvbnN0IHJlYWR5ID0gbm9kZUlkcy5maWx0ZXIoKGlkKSA9PiAoaW5kZWdyZWUuZ2V0KGlkKSA/PyAwKSA9PT0gMCkuc29ydCgpO1xuICAvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuICBjb25zdCBvcmRlciA9IFtdO1xuXG4gIHdoaWxlIChyZWFkeS5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgaWQgPSAvKiogQHR5cGUge3N0cmluZ30gKi8gKHJlYWR5LnNoaWZ0KCkpO1xuICAgIG9yZGVyLnB1c2goaWQpO1xuICAgIGZvciAoY29uc3QgbmV4dCBvZiAob3V0Z29pbmcuZ2V0KGlkKSA/PyBbXSkuc2xpY2UoKS5zb3J0KCkpIHtcbiAgICAgIGNvbnN0IHJlbWFpbmluZyA9IChpbmRlZ3JlZS5nZXQobmV4dCkgPz8gMCkgLSAxO1xuICAgICAgaW5kZWdyZWUuc2V0KG5leHQsIHJlbWFpbmluZyk7XG4gICAgICBpZiAocmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgIHJlYWR5LnB1c2gobmV4dCk7XG4gICAgICAgIHJlYWR5LnNvcnQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBsZXQgbWF4TGF5ZXIgPSAwO1xuICBmb3IgKGNvbnN0IGlkIG9mIG9yZGVyKSB7XG4gICAgY29uc3QgcHJlZGVjZXNzb3JzID0gaW5jb21pbmcuZ2V0KGlkKSA/PyBbXTtcbiAgICBjb25zdCBsYXllciA9XG4gICAgICBwcmVkZWNlc3NvcnMubGVuZ3RoID09PSAwXG4gICAgICAgID8gMFxuICAgICAgICA6IE1hdGgubWF4KC4uLnByZWRlY2Vzc29ycy5tYXAoKHByZWQpID0+IGxheWVyT2YuZ2V0KHByZWQpID8/IDApKSArIDE7XG4gICAgbGF5ZXJPZi5zZXQoaWQsIGxheWVyKTtcbiAgICBtYXhMYXllciA9IE1hdGgubWF4KG1heExheWVyLCBsYXllcik7XG4gIH1cblxuICAvLyBOb2RlcyBpbnNpZGUgYSBjeWNsZSBuZXZlciByZWFjaCBpbmRlZ3JlZSAwLiBQbGFjZSB0aGVtIGFmdGVyIGV2ZXJ5dGhpbmdcbiAgLy8gdGhhdCBjb3VsZCBiZSBvcmRlcmVkLCByYXRoZXIgdGhhbiBkcm9wcGluZyB0aGVtLlxuICBjb25zdCBjeWNsaWMgPSBub2RlSWRzLmZpbHRlcigoaWQpID0+ICFsYXllck9mLmhhcyhpZCkpLnNvcnQoKTtcbiAgZm9yIChjb25zdCBpZCBvZiBjeWNsaWMpIHtcbiAgICBsYXllck9mLnNldChpZCwgTWF0aC5taW4obWF4TGF5ZXIgKyAxLCBjb25maWcubWF4TGF5ZXJzKSk7XG4gIH1cblxuICAvKiogQHR5cGUge01hcDxudW1iZXIsIHN0cmluZ1tdPn0gKi9cbiAgY29uc3QgYnlMYXllciA9IG5ldyBNYXAoKTtcbiAgZm9yIChjb25zdCBpZCBvZiBub2RlSWRzLnNsaWNlKCkuc29ydCgpKSB7XG4gICAgY29uc3QgbGF5ZXIgPSBNYXRoLm1pbihsYXllck9mLmdldChpZCkgPz8gMCwgY29uZmlnLm1heExheWVycyk7XG4gICAgaWYgKCFieUxheWVyLmhhcyhsYXllcikpIHtcbiAgICAgIGJ5TGF5ZXIuc2V0KGxheWVyLCBbXSk7XG4gICAgfVxuICAgIGJ5TGF5ZXIuZ2V0KGxheWVyKT8ucHVzaChpZCk7XG4gIH1cblxuICAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIFBvc2l0aW9uPn0gKi9cbiAgY29uc3QgcG9zaXRpb25zID0ge307XG4gIC8qKiBAdHlwZSB7c3RyaW5nW11bXX0gKi9cbiAgY29uc3QgbGF5ZXJzID0gW107XG4gIGxldCB0YWxsZXN0ID0gMDtcblxuICBmb3IgKGNvbnN0IGxheWVyIG9mIFsuLi5ieUxheWVyLmtleXMoKV0uc29ydCgoYSwgYikgPT4gYSAtIGIpKSB7XG4gICAgY29uc3QgaWRzID0gYnlMYXllci5nZXQobGF5ZXIpID8/IFtdO1xuICAgIGxheWVycy5wdXNoKGlkcyk7XG4gICAgaWRzLmZvckVhY2goKGlkLCBpbmRleCkgPT4ge1xuICAgICAgcG9zaXRpb25zW2lkXSA9IHtcbiAgICAgICAgeDogbGF5ZXIgKiAoY29uZmlnLm5vZGVXaWR0aCArIGNvbmZpZy5ob3Jpem9udGFsR2FwKSxcbiAgICAgICAgeTogaW5kZXggKiAoY29uZmlnLm5vZGVIZWlnaHQgKyBjb25maWcudmVydGljYWxHYXApLFxuICAgICAgICB3aWR0aDogY29uZmlnLm5vZGVXaWR0aCxcbiAgICAgICAgaGVpZ2h0OiBjb25maWcubm9kZUhlaWdodCxcbiAgICAgICAgbGF5ZXIsXG4gICAgICB9O1xuICAgIH0pO1xuICAgIHRhbGxlc3QgPSBNYXRoLm1heCh0YWxsZXN0LCBpZHMubGVuZ3RoKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcG9zaXRpb25zLFxuICAgIHdpZHRoOiBNYXRoLm1heCgxLCBsYXllcnMubGVuZ3RoKSAqIChjb25maWcubm9kZVdpZHRoICsgY29uZmlnLmhvcml6b250YWxHYXApLFxuICAgIGhlaWdodDogTWF0aC5tYXgoMSwgdGFsbGVzdCkgKiAoY29uZmlnLm5vZGVIZWlnaHQgKyBjb25maWcudmVydGljYWxHYXApLFxuICAgIGxheWVycyxcbiAgfTtcbn1cbiIsICIvKipcbiAqIExhbmd1YWdlLW5ldXRyYWwgQ0ZHIHZvY2FidWxhcnkuXG4gKlxuICogVGhlc2UgbmFtZXMgYXJlIGZyb3plbiBieSBgZG9jcy9HUkFQSF9TUEVDSUZJQ0FUSU9OLm1kYC4gQWRhcHRlcnMgZGVzY3JpYmVcbiAqIHNvdXJjZSBzdHJ1Y3R1cmUgd2l0aCBgQ29udHJvbENvbnN0cnVjdGAgdHJlZXM7IHRoaXMgbW9kdWxlIG93bnMgdGhlIHNtYWxsZXJcbiAqIHNldCBvZiBub2RlcyBhbmQgZWRnZXMgdGhlIHJlbmRlcmVyIHVuZGVyc3RhbmRzLlxuICovXG5cbi8qKiBOb2RlIGtpbmRzIGEgQ0ZHIG1heSBjb250YWluLiAqL1xuZXhwb3J0IGNvbnN0IENGR19OT0RFX0tJTkRTID0gT2JqZWN0LmZyZWV6ZShbXG4gICdlbnRyeScsXG4gICdleGl0JyxcbiAgJ3N0YXRlbWVudCcsXG4gICdjb25kaXRpb24nLFxuICAnbXVsdGl3YXknLFxuICAnbWVyZ2UnLFxuICAnbG9vcF9oZWFkZXInLFxuICAnbG9vcF9sYXRjaCcsXG4gICdsb29wX2JvZHlfZW50cnknLFxuICAnYnJlYWsnLFxuICAnY29udGludWUnLFxuICAncmV0dXJuJyxcbiAgJ3Rocm93JyxcbiAgJ2NhbGwnLFxuICAnYXdhaXQnLFxuICAnY2F0Y2hfZW50cnknLFxuICAnZmluYWxseV9lbnRyeScsXG4gICd1bnJlYWNoYWJsZScsXG4gICd1bm1vZGVsZWQnLFxuXSk7XG5cbi8qKiBFZGdlIGtpbmRzIGEgQ0ZHIG1heSBjb250YWluLiAqL1xuZXhwb3J0IGNvbnN0IENGR19FREdFX0tJTkRTID0gT2JqZWN0LmZyZWV6ZShbXG4gICdzZXEnLFxuICAndHJ1ZScsXG4gICdmYWxzZScsXG4gICdjYXNlJyxcbiAgJ2RlZmF1bHQnLFxuICAnbG9vcF9iYWNrJyxcbiAgJ2JyZWFrJyxcbiAgJ2NvbnRpbnVlJyxcbiAgJ3JldHVybicsXG4gICd0aHJvdycsXG4gICdleGNlcHRpb24nLFxuICAnZmluYWxseScsXG4gICd1bnJlYWNoYWJsZScsXG5dKTtcblxuLyoqIFN0YXR1c2VzIHNoYXJlZCB3aXRoIENTUiByZWxhdGlvbnNoaXBzLiAqL1xuZXhwb3J0IGNvbnN0IENGR19TVEFUVVNFUyA9IE9iamVjdC5mcmVlemUoW1xuICAncmVzb2x2ZWQnLFxuICAnaW5mZXJyZWQnLFxuICAncG9zc2libGUnLFxuICAndW5yZXNvbHZlZCcsXG4gICdzdGFsZScsXG5dKTtcblxuLyoqIERlZ3JhZGF0aW9uIGNvZGVzIGVtaXR0ZWQgYnkgdGhlIGJ1aWxkZXIuICovXG5leHBvcnQgY29uc3QgQ0ZHX0RFR1JBREFUSU9OX0NPREVTID0gT2JqZWN0LmZyZWV6ZShbXG4gICd1bm1vZGVsZWRfY29uc3RydWN0JyxcbiAgJ2dvdG9fZmxvdycsXG4gICdpbmRpcmVjdF9nb3RvX2Zsb3cnLFxuICAnaXRlcmF0aW9uX3NvdXJjZV9vcGFxdWUnLFxuICAnY2FsbF9zaXRlX3VucmVjb3JkZWQnLFxuICAnY29uZGl0aW9uX3NoYXBlX3VubW9kZWxlZCcsXG4gICdvcnBoYW5fanVtcCcsXG4gICdtb2RlbGVkX2V4Y2VwdGlvbl9wYXRoJyxcbiAgJ2FuYWx5c2lzX3BhcnRpYWwnLFxuICAndHJ1bmNhdGVkJyxcbl0pO1xuXG4vKiogRWRnZSBraW5kcyB0aGF0IGRvIG5vdCBhZHZhbmNlIHRoZSBub3JtYWwgc3VjY2Vzc29yIHBhdGguICovXG5leHBvcnQgY29uc3QgQUJSVVBUX0VER0VfS0lORFMgPSBPYmplY3QuZnJlZXplKFsnYnJlYWsnLCAnY29udGludWUnLCAncmV0dXJuJywgJ3Rocm93J10pO1xuXG4vKiogRWRnZXMgZXhjbHVkZWQgZnJvbSByYW5rIGNvbXB1dGF0aW9uIGJlY2F1c2UgdGhleSBwb2ludCBiYWNrd2FyZHMuICovXG5leHBvcnQgY29uc3QgQkFDS19FREdFX0tJTkRTID0gT2JqZWN0LmZyZWV6ZShbJ2xvb3BfYmFjaycsICdjb250aW51ZSddKTtcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RhdHVzXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGFzaEZvclN0YXR1cyhzdGF0dXMpIHtcbiAgc3dpdGNoIChzdGF0dXMpIHtcbiAgICBjYXNlICdpbmZlcnJlZCc6XG4gICAgICByZXR1cm4gJzggNCc7XG4gICAgY2FzZSAncG9zc2libGUnOlxuICAgICAgcmV0dXJuICczIDMnO1xuICAgIGNhc2UgJ3VucmVzb2x2ZWQnOlxuICAgICAgcmV0dXJuICcyIDUnO1xuICAgIGNhc2UgJ3N0YWxlJzpcbiAgICAgIHJldHVybiAnMSA0JztcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuICcnO1xuICB9XG59XG5cbi8qKlxuICogTm9uLWNvbG91ciBjdWUgZm9yIGEgc3RhdHVzLiBQaGFzZSAxMiB3aWxsIGV4dGVuZCB0aGlzIGludG8gYSBmdWxsXG4gKiBhY2Nlc3NpYmlsaXR5IHBhc3M7IHRoZSBEVE8gYWxyZWFkeSBjYXJyaWVzIHRoZSBmaWVsZC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RhdHVzXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2x5cGhGb3JTdGF0dXMoc3RhdHVzKSB7XG4gIHN3aXRjaCAoc3RhdHVzKSB7XG4gICAgY2FzZSAncmVzb2x2ZWQnOlxuICAgICAgcmV0dXJuICdcdTI1Q0YnO1xuICAgIGNhc2UgJ2luZmVycmVkJzpcbiAgICAgIHJldHVybiAnXHUyNUQwJztcbiAgICBjYXNlICdwb3NzaWJsZSc6XG4gICAgICByZXR1cm4gJ1x1MjVDQic7XG4gICAgY2FzZSAndW5yZXNvbHZlZCc6XG4gICAgICByZXR1cm4gJ1x1MjcxNSc7XG4gICAgY2FzZSAnc3RhbGUnOlxuICAgICAgcmV0dXJuICdcdTIyRUYnO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJz8nO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGtpbmRcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlZGdlTGFiZWwoa2luZCwgZXh0cmEgPSAnJykge1xuICBpZiAoZXh0cmEpIHtcbiAgICByZXR1cm4ga2luZCA9PT0gJ2Nhc2UnID8gYGNhc2UgJHtleHRyYX1gIDogZXh0cmE7XG4gIH1cbiAgc3dpdGNoIChraW5kKSB7XG4gICAgY2FzZSAnc2VxJzpcbiAgICAgIHJldHVybiAnJztcbiAgICBjYXNlICdsb29wX2JhY2snOlxuICAgICAgcmV0dXJuICdsb29wIGJhY2snO1xuICAgIGNhc2UgJ2V4Y2VwdGlvbic6XG4gICAgICByZXR1cm4gJ2V4Y2VwdGlvbic7XG4gICAgY2FzZSAnZmluYWxseSc6XG4gICAgICByZXR1cm4gJ2ZpbmFsbHknO1xuICAgIGNhc2UgJ3VucmVhY2hhYmxlJzpcbiAgICAgIHJldHVybiAndW5yZWFjaGFibGUnO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4ga2luZDtcbiAgfVxufVxuIiwgIi8qKlxuICogQ2FsbC1ncmFwaCB2b2NhYnVsYXJ5LCBsaW1pdHMsIHNjb3BlIGJhbm5lcnMsIGFuZCBub24tY29sb3IgZWRnZSBlbmNvZGluZ3MuXG4gKlxuICogS2VwdCBpbiBgc3JjL2NvcmUvZ3JhcGgvY2FsbHMvYCB3aXRoIHplcm8gYWRhcHRlciwgaG9zdCwgb3Igd2VidmlldyBpbXBvcnRzLlxuICovXG5cbmltcG9ydCB7IGRhc2hGb3JTdGF0dXMsIGdseXBoRm9yU3RhdHVzIH0gZnJvbSAnLi4vY2ZnL2tpbmRzLmpzJztcblxuZXhwb3J0IGNvbnN0IENBTExfU0NPUEVTID0gT2JqZWN0LmZyZWV6ZShbJ2NvbXBsZXRlJywgJ3BhcnRpYWwnLCAnc2FtZV9maWxlX29ubHknXSk7XG5cbmV4cG9ydCBjb25zdCBDQUxMX1NDT1BFX1JFQVNPTlMgPSBPYmplY3QuZnJlZXplKFtcbiAgJ25vX2luZGV4JyxcbiAgJ2luZGV4X3BhcnRpYWwnLFxuICAnaW5kZXhfc3RhbGUnLFxuICAnYW5hbHlzaXNfcGFydGlhbCcsXG4gICdzYW1lX2ZpbGVfYWRhcHRlcicsXG4gICdzdGFsZV9jdXJzb3JfcmVzZXQnLFxuXSk7XG5cbmV4cG9ydCBjb25zdCBDQUxMX1JFTEFUSU9OU0hJUF9UWVBFUyA9IE9iamVjdC5mcmVlemUoW1xuICAnY2FsbHMnLFxuICAnaW5zdGFudGlhdGVzJyxcbiAgJ292ZXJyaWRlcycsXG4gICdyZWZlcmVuY2VzJyxcbl0pO1xuXG5leHBvcnQgY29uc3QgQ0FMTF9TVEFUVVNFUyA9IE9iamVjdC5mcmVlemUoW1xuICAncmVzb2x2ZWQnLFxuICAnaW5mZXJyZWQnLFxuICAncG9zc2libGUnLFxuICAndW5yZXNvbHZlZCcsXG4gICdzdGFsZScsXG5dKTtcblxuZXhwb3J0IGNvbnN0IENBTExfTk9ERV9LSU5EUyA9IE9iamVjdC5mcmVlemUoW1xuICAnZnVuY3Rpb24nLFxuICAnbWV0aG9kJyxcbiAgJ2NvbnN0cnVjdG9yJyxcbiAgJ2Rlc3RydWN0b3InLFxuICAnbGFtYmRhJyxcbiAgJ2Nsb3N1cmUnLFxuICAnY2xhc3MnLFxuICAnc3RydWN0JyxcbiAgJ2ludGVyZmFjZScsXG4gICdtb2R1bGUnLFxuICAnZmlsZScsXG4gICd2YXJpYWJsZScsXG4gICdwYXJhbWV0ZXInLFxuICAnZmllbGQnLFxuICAncHJvcGVydHknLFxuICAndW5yZXNvbHZlZF9idWNrZXQnLFxuICAnY2FuZGlkYXRlX2J1Y2tldCcsXG4gICd1bmtub3duJyxcbl0pO1xuXG5leHBvcnQgY29uc3QgQ0FMTF9MSU1JVFMgPSBPYmplY3QuZnJlZXplKHtcbiAgZGVmYXVsdFBhZ2VTaXplOiAxMDAsXG4gIG1heFBhZ2VTaXplOiAyMDAsXG4gIGRlZmF1bHREZXB0aDogMyxcbiAgbWF4RGVwdGg6IDYsXG4gIG1heE5vZGVzOiA1MDAsXG4gIGNhbmRpZGF0ZUJ1Y2tldFRocmVzaG9sZDogNSxcbn0pO1xuXG4vKipcbiAqIE51bWVyaWNhbCBwcmVjZWRlbmNlIG9mIHJlc29sdXRpb24gc3RhdHVzZXMgKGV4Y2x1ZGluZyBgc3RhbGVgLCB3aGljaCBpcyBhXG4gKiBwcm92ZW5hbmNlIHByb3BlcnR5IHJhdGhlciB0aGFuIGEgc3RyZW5ndGggbGV2ZWwpLlxuICovXG5leHBvcnQgY29uc3QgU1RBVFVTX1NUUkVOR1RIID0gT2JqZWN0LmZyZWV6ZSh7XG4gIHJlc29sdmVkOiA0LFxuICBpbmZlcnJlZDogMyxcbiAgcG9zc2libGU6IDIsXG4gIHVucmVzb2x2ZWQ6IDEsXG59KTtcblxuLyoqXG4gKiBGb3JtYXQgYW4gaG9uZXN0IHNjb3BlIGxhYmVsIHBlciBQaGFzZSA3IFx1MDBBNzguXG4gKiBOZXZlciByZW5kZXJzIGEgYmFyZSBjb3VudCBmb3IgYHNhbWVfZmlsZV9vbmx5YCBvciBgcGFydGlhbGAgc2NvcGVzLlxuICpcbiAqIEBwYXJhbSB7J2NvbXBsZXRlJ3wncGFydGlhbCd8J3NhbWVfZmlsZV9vbmx5J30gc2NvcGVcbiAqIEBwYXJhbSB7bnVtYmVyfSBjb3VudFxuICogQHBhcmFtIHsnY2FsbGVycyd8J2NhbGxlZXMnfCduZWlnaGJvcnMnfSBbbm91bl1cbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRTY29wZUJhbm5lcihzY29wZSwgY291bnQsIG5vdW4gPSAnY2FsbGVycycpIHtcbiAgY29uc3Qgc2FmZUNvdW50ID0gTWF0aC5tYXgoMCwgTnVtYmVyLmlzSW50ZWdlcihjb3VudCkgPyBjb3VudCA6IDApO1xuICBjb25zdCB3b3JkID0gc2FmZUNvdW50ID09PSAxID8gKG5vdW4uZW5kc1dpdGgoJ3MnKSA/IG5vdW4uc2xpY2UoMCwgLTEpIDogbm91bikgOiBub3VuO1xuICBpZiAoc2NvcGUgPT09ICdjb21wbGV0ZScpIHtcbiAgICByZXR1cm4gYCR7c2FmZUNvdW50fSAke3dvcmR9YDtcbiAgfVxuICBpZiAoc2NvcGUgPT09ICdwYXJ0aWFsJykge1xuICAgIHJldHVybiBgJHtzYWZlQ291bnR9ICR7d29yZH0gKGluZGV4IHBhcnRpYWwgXHUyMDE0IG1heSBiZSBpbmNvbXBsZXRlKWA7XG4gIH1cbiAgcmV0dXJuIGAke3NhZmVDb3VudH0gJHt3b3JkfSBpbiB0aGlzIGZpbGUgXHUwMEI3IFByb2plY3Qtd2lkZSAke25vdW59IHJlcXVpcmUgaW5kZXhpbmdgO1xufVxuXG4vKipcbiAqIE5vbi1jb2xvciBTVkcgZGFzaCBwYXR0ZXJuIGZvciBhIGNhbGwgZWRnZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RhdHVzXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpc0N5Y2xlXVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbGxFZGdlRGFzaChzdGF0dXMsIGlzQ3ljbGUgPSBmYWxzZSkge1xuICBpZiAoc3RhdHVzID09PSAncmVzb2x2ZWQnICYmIGlzQ3ljbGUpIHtcbiAgICByZXR1cm4gJzEwIDQnO1xuICB9XG4gIHJldHVybiBkYXNoRm9yU3RhdHVzKHN0YXR1cyk7XG59XG5cbi8qKlxuICogTm9uLWNvbG9yIGdseXBoIGhpbnQgZm9yIGEgY2FsbCBlZGdlLCBkaXN0aW5ndWlzaGluZyBgcG9zc2libGVgIChgXHUyNUNCYCkgZnJvbVxuICogYHJlc29sdmVkYCAoYFx1MjVDRmApIGFuZCBtYXJraW5nIHJlY3Vyc2l2ZS9tdXR1YWwgY3ljbGUgZWRnZXMgKGBcdTIxQkJgKS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RhdHVzXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpc0N5Y2xlXVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbGxFZGdlR2x5cGgoc3RhdHVzLCBpc0N5Y2xlID0gZmFsc2UpIHtcbiAgY29uc3QgYmFzZSA9IGdseXBoRm9yU3RhdHVzKHN0YXR1cyk7XG4gIHJldHVybiBpc0N5Y2xlID8gYCR7YmFzZX0gXHUyMUJCYCA6IGJhc2U7XG59XG4iLCAiLyoqXG4gKiBTZW1hbnRpYyB6b29tIGxldmVsIGhpZXJhcmNoeSwgY2Fwcywgb3ZlcmxheSBzbG90cywgYW5kIGJvdW5kZWQgZ2VzdHVyZVxuICogdHJhbnNpdGlvbiBydWxlcyAoUGhhc2UgMTAgXHUwMEE3NSwgXHUwMEE3MTYsIFAxMC0wMSwgQUMtMTAuNikuXG4gKi9cblxuZXhwb3J0IGNvbnN0IFpPT01fTEVWRUxTID0gT2JqZWN0LmZyZWV6ZSh7XG4gIEwwX1dPUktTUEFDRTogJ3dvcmtzcGFjZScsXG4gIEwxX01PRFVMRTogJ21vZHVsZScsXG4gIEwyX0ZJTEU6ICdmaWxlJyxcbiAgTDNfU1lNQk9MOiAnc3ltYm9sJyxcbiAgTDRfRlVOQ1RJT046ICdmdW5jdGlvbicsXG4gIEw1X1NUQVRFTUVOVDogJ3N0YXRlbWVudCcsXG59KTtcblxuZXhwb3J0IGNvbnN0IExFVkVMX09SREVSID0gT2JqZWN0LmZyZWV6ZShbXG4gIFpPT01fTEVWRUxTLkwwX1dPUktTUEFDRSxcbiAgWk9PTV9MRVZFTFMuTDFfTU9EVUxFLFxuICBaT09NX0xFVkVMUy5MMl9GSUxFLFxuICBaT09NX0xFVkVMUy5MM19TWU1CT0wsXG4gIFpPT01fTEVWRUxTLkw0X0ZVTkNUSU9OLFxuICBaT09NX0xFVkVMUy5MNV9TVEFURU1FTlQsXG5dKTtcblxuZXhwb3J0IGNvbnN0IExFVkVMX0NBUFMgPSBPYmplY3QuZnJlZXplKHtcbiAgW1pPT01fTEVWRUxTLkwwX1dPUktTUEFDRV06IDYwLFxuICBbWk9PTV9MRVZFTFMuTDFfTU9EVUxFXTogMTIwLFxuICBbWk9PTV9MRVZFTFMuTDJfRklMRV06IDEyMCxcbiAgW1pPT01fTEVWRUxTLkwzX1NZTUJPTF06IDE1MCxcbiAgW1pPT01fTEVWRUxTLkw0X0ZVTkNUSU9OXTogMTUwLFxuICBbWk9PTV9MRVZFTFMuTDVfU1RBVEVNRU5UXTogMTAwLFxufSk7XG5cbmV4cG9ydCBjb25zdCBMRVZFTF9MQUJFTFMgPSBPYmplY3QuZnJlZXplKHtcbiAgW1pPT01fTEVWRUxTLkwwX1dPUktTUEFDRV06ICdMMCBXb3Jrc3BhY2UnLFxuICBbWk9PTV9MRVZFTFMuTDFfTU9EVUxFXTogJ0wxIE1vZHVsZScsXG4gIFtaT09NX0xFVkVMUy5MMl9GSUxFXTogJ0wyIEZpbGUnLFxuICBbWk9PTV9MRVZFTFMuTDNfU1lNQk9MXTogJ0wzIFN5bWJvbCcsXG4gIFtaT09NX0xFVkVMUy5MNF9GVU5DVElPTl06ICdMNCBGdW5jdGlvbicsXG4gIFtaT09NX0xFVkVMUy5MNV9TVEFURU1FTlRdOiAnTDUgU3RhdGVtZW50Jyxcbn0pO1xuXG4vKipcbiAqIE92ZXJsYXkgc2xvdHMgYXR0YWNoIHRvIEw0L0w1IHdpdGhvdXQgZm9ya2luZyB0aGUgbGV2ZWwgaGllcmFyY2h5XG4gKiAoUGhhc2UgMTAgXHUwMEE3MTYgaGFuZG9mZiB0byBQaGFzZSAxMSBERkcgb3ZlcmxheSkuXG4gKi9cbmV4cG9ydCBjb25zdCBPVkVSTEFZX1NMT1RTID0gT2JqZWN0LmZyZWV6ZSh7XG4gIERGRzogJ2RmZycsXG59KTtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIG5leHQgZmluZXIgem9vbSBsZXZlbCwgb3IgYG51bGxgIGlmIGFscmVhZHkgYXQgYEw1X1NUQVRFTUVOVGAuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGxldmVsXG4gKiBAcmV0dXJucyB7c3RyaW5nfG51bGx9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuZXh0Q2hpbGRMZXZlbChsZXZlbCkge1xuICBjb25zdCBpZHggPSBMRVZFTF9PUkRFUi5pbmRleE9mKGxldmVsKTtcbiAgaWYgKGlkeCA8IDAgfHwgaWR4ICsgMSA+PSBMRVZFTF9PUkRFUi5sZW5ndGgpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gTEVWRUxfT1JERVJbaWR4ICsgMV07XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBwYXJlbnQgY29hcnNlciB6b29tIGxldmVsLCBvciBgbnVsbGAgaWYgYWxyZWFkeSBhdCBgTDBfV09SS1NQQUNFYC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbGV2ZWxcbiAqIEByZXR1cm5zIHtzdHJpbmd8bnVsbH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcmVudExldmVsKGxldmVsKSB7XG4gIGNvbnN0IGlkeCA9IExFVkVMX09SREVSLmluZGV4T2YobGV2ZWwpO1xuICBpZiAoaWR4IDw9IDApIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gTEVWRUxfT1JERVJbaWR4IC0gMV07XG59XG5cbi8qKlxuICogRXZhbHVhdGUgYSB3aGVlbC9waW5jaCB6b29tIGdlc3R1cmUgKFBoYXNlIDEwIFx1MDBBNzUuMiwgQUMtMTAuNik6XG4gKiAtIFdoZWVsL3BpbmNoIHpvb20gaXMgdmlzdWFsIGJ5IGRlZmF1bHQgKGBhY3Rpb246ICd2aXN1YWxfc2NhbGUnYCkuXG4gKiAtIE5ldmVyIGNoYW5nZXMgc2VtYW50aWMgbGV2ZWwgd2hpbGUgbWlkLXBhbiAoYGlzUGFubmluZyA9PT0gdHJ1ZWApLlxuICogLSBOZXZlciBjaGFuZ2VzIHNlbWFudGljIGxldmVsIG1vcmUgdGhhbiBvbmNlIHBlciBnZXN0dXJlXG4gKiAgIChgdHJhbnNpdGlvbnNJbkdlc3R1cmUgPj0gMWApLlxuICogLSBPbmx5IGNyb3NzZXMgaW50byBhIGZpbmVyIGxldmVsIHdoZW4gYG5leHRTY2FsZSA+PSBleHBhbmRUaHJlc2hvbGRgXG4gKiAgIChkZWZhdWx0IGAxLjg1YCkgQU5EIHRoZSBwb2ludGVyIGlzIG92ZXIgYW4gZXhwYW5kYWJsZSBjbHVzdGVyXG4gKiAgIChgb3ZlckV4cGFuZGFibGVDbHVzdGVyID09PSB0cnVlYCkuXG4gKlxuICogQHBhcmFtIHt7XG4gKiAgIGN1cnJlbnRMZXZlbDogc3RyaW5nLFxuICogICBjdXJyZW50U2NhbGU/OiBudW1iZXIsXG4gKiAgIHNjYWxlRGVsdGE/OiBudW1iZXIsXG4gKiAgIG92ZXJFeHBhbmRhYmxlQ2x1c3Rlcj86IGJvb2xlYW4sXG4gKiAgIHRhcmdldENsdXN0ZXJJZD86IHN0cmluZ3xudWxsLFxuICogICB0cmFuc2l0aW9uc0luR2VzdHVyZT86IG51bWJlcixcbiAqICAgaXNQYW5uaW5nPzogYm9vbGVhbixcbiAqICAgZXhwYW5kVGhyZXNob2xkPzogbnVtYmVyLFxuICogfX0gaW5wdXRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV2YWx1YXRlWm9vbUdlc3R1cmUoaW5wdXQgPSB7fSkge1xuICBjb25zdCBjdXJyZW50TGV2ZWwgPSBMRVZFTF9PUkRFUi5pbmNsdWRlcyhpbnB1dC5jdXJyZW50TGV2ZWwpXG4gICAgPyBpbnB1dC5jdXJyZW50TGV2ZWxcbiAgICA6IFpPT01fTEVWRUxTLkwwX1dPUktTUEFDRTtcbiAgY29uc3QgY3VycmVudFNjYWxlID0gTnVtYmVyLmlzRmluaXRlKGlucHV0LmN1cnJlbnRTY2FsZSkgPyBOdW1iZXIoaW5wdXQuY3VycmVudFNjYWxlKSA6IDE7XG4gIGNvbnN0IHNjYWxlRGVsdGEgPSBOdW1iZXIuaXNGaW5pdGUoaW5wdXQuc2NhbGVEZWx0YSkgPyBOdW1iZXIoaW5wdXQuc2NhbGVEZWx0YSkgOiAwO1xuICBjb25zdCBuZXh0U2NhbGUgPSBNYXRoLm1pbig0LCBNYXRoLm1heCgwLjI1LCBOdW1iZXIoKGN1cnJlbnRTY2FsZSArIHNjYWxlRGVsdGEpLnRvRml4ZWQoMykpKSk7XG4gIGNvbnN0IGV4cGFuZFRocmVzaG9sZCA9IE51bWJlci5pc0Zpbml0ZShpbnB1dC5leHBhbmRUaHJlc2hvbGQpXG4gICAgPyBOdW1iZXIoaW5wdXQuZXhwYW5kVGhyZXNob2xkKVxuICAgIDogMS44NTtcbiAgY29uc3QgdHJhbnNpdGlvbnNJbkdlc3R1cmUgPSBNYXRoLm1heCgwLCBNYXRoLnRydW5jKE51bWJlcihpbnB1dC50cmFuc2l0aW9uc0luR2VzdHVyZSkgfHwgMCkpO1xuXG4gIGlmIChpbnB1dC5pc1Bhbm5pbmcpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYWN0aW9uOiAndmlzdWFsX3NjYWxlJyxcbiAgICAgIGxldmVsQ2hhbmdlZDogZmFsc2UsXG4gICAgICBjdXJyZW50TGV2ZWwsXG4gICAgICBuZXh0TGV2ZWw6IGN1cnJlbnRMZXZlbCxcbiAgICAgIHNjYWxlOiBjdXJyZW50U2NhbGUsXG4gICAgICBhZmZvcmRhbmNlOiBudWxsLFxuICAgIH07XG4gIH1cblxuICBpZiAodHJhbnNpdGlvbnNJbkdlc3R1cmUgPj0gMSkge1xuICAgIHJldHVybiB7XG4gICAgICBhY3Rpb246ICd2aXN1YWxfc2NhbGUnLFxuICAgICAgbGV2ZWxDaGFuZ2VkOiBmYWxzZSxcbiAgICAgIGN1cnJlbnRMZXZlbCxcbiAgICAgIG5leHRMZXZlbDogY3VycmVudExldmVsLFxuICAgICAgc2NhbGU6IG5leHRTY2FsZSxcbiAgICAgIGFmZm9yZGFuY2U6IG51bGwsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGNoaWxkTGV2ZWwgPSBuZXh0Q2hpbGRMZXZlbChjdXJyZW50TGV2ZWwpO1xuICBpZiAoaW5wdXQub3ZlckV4cGFuZGFibGVDbHVzdGVyICYmIGNoaWxkTGV2ZWwgJiYgbmV4dFNjYWxlID49IGV4cGFuZFRocmVzaG9sZCAmJiBzY2FsZURlbHRhID4gMCkge1xuICAgIHJldHVybiB7XG4gICAgICBhY3Rpb246ICdleHBhbmRfY2x1c3RlcicsXG4gICAgICBsZXZlbENoYW5nZWQ6IHRydWUsXG4gICAgICBjdXJyZW50TGV2ZWwsXG4gICAgICBuZXh0TGV2ZWw6IGNoaWxkTGV2ZWwsXG4gICAgICB0YXJnZXRDbHVzdGVySWQ6IGlucHV0LnRhcmdldENsdXN0ZXJJZCA/PyBudWxsLFxuICAgICAgc2NhbGU6IDEsXG4gICAgICBhZmZvcmRhbmNlOiAnWm9vbWVkIGluIHRvIGV4cGFuZCBjbHVzdGVyJyxcbiAgICB9O1xuICB9XG5cbiAgY29uc3Qgc2hvd0FmZm9yZGFuY2UgPSBCb29sZWFuKFxuICAgIGlucHV0Lm92ZXJFeHBhbmRhYmxlQ2x1c3RlciAmJiBjaGlsZExldmVsICYmIG5leHRTY2FsZSA+PSBleHBhbmRUaHJlc2hvbGQgKiAwLjc1LFxuICApO1xuXG4gIHJldHVybiB7XG4gICAgYWN0aW9uOiAndmlzdWFsX3NjYWxlJyxcbiAgICBsZXZlbENoYW5nZWQ6IGZhbHNlLFxuICAgIGN1cnJlbnRMZXZlbCxcbiAgICBuZXh0TGV2ZWw6IGN1cnJlbnRMZXZlbCxcbiAgICBzY2FsZTogbmV4dFNjYWxlLFxuICAgIGFmZm9yZGFuY2U6IHNob3dBZmZvcmRhbmNlID8gJ1pvb20gaW4gb3IgcHJlc3MgRW50ZXIgdG8gZXhwYW5kIGNsdXN0ZXInIDogbnVsbCxcbiAgfTtcbn1cbiIsICIvKipcbiAqIEdyYXBoIHZpZXctbW9kZWwgKERUTykuXG4gKlxuICogVGhlIERUTyBpcyB0aGUgb25seSBncmFwaCBzaGFwZSB0aGUgd2VidmlldyB1bmRlcnN0YW5kcy4gSXQgaXMgcGxhaW4gSlNPTjpcbiAqIG5vIGZ1bmN0aW9ucywgbm8gaWRzIHRoYXQgcmVxdWlyZSBhIGxvb2t1cCwgbm8gc291cmNlIHRleHQuXG4gKlxuICogU291cmNlIHRleHQgaXMgZmV0Y2hlZCBvbiBkZW1hbmQgaW4gUGhhc2UgNSB0aHJvdWdoIGEgc2VwYXJhdGUsIHZhbGlkYXRlZFxuICogcmVxdWVzdC4gS2VlcGluZyB0aGUgRFRPIGZyZWUgb2Ygc291cmNlIHByZXZlbnRzIGFjY2lkZW50YWwgbGVha2FnZSBpbnRvXG4gKiBjYWNoZXMgYW5kIGtlZXBzIG1lc3NhZ2Ugc2l6ZXMgcHJlZGljdGFibGUuXG4gKi9cblxuaW1wb3J0IHsgY29tcHV0ZUxheW91dCB9IGZyb20gJy4vbGF5b3V0LmpzJztcbmltcG9ydCB7IENGR19FREdFX0tJTkRTLCBDRkdfTk9ERV9LSU5EUywgQ0ZHX1NUQVRVU0VTIH0gZnJvbSAnLi9jZmcva2luZHMuanMnO1xuaW1wb3J0IHsgQ0FMTF9OT0RFX0tJTkRTLCBDQUxMX1JFTEFUSU9OU0hJUF9UWVBFUywgQ0FMTF9TQ09QRVMgfSBmcm9tICcuL2NhbGxzL2tpbmRzLmpzJztcbmltcG9ydCB7IExFVkVMX09SREVSIH0gZnJvbSAnLi96b29tL2xldmVscy5qcyc7XG5cbmV4cG9ydCBjb25zdCBHUkFQSF9EVE9fVkVSU0lPTiA9IDE7XG5cbi8qKlxuICogQHR5cGVkZWYge2ltcG9ydCgnLi9tb2RlbC5qcycpLkdyYXBofSBHcmFwaFxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gRHRvTm9kZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGlkXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbGFiZWxcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBraW5kXG4gKiBAcHJvcGVydHkge3N0cmluZ30gc3RhdHVzXG4gKiBAcHJvcGVydHkge3N0cmluZ30gYmFkZ2VcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gZXh0ZXJuYWxcbiAqIEBwcm9wZXJ0eSB7e2ZpbGVJZDogc3RyaW5nLCBzdGFydExpbmU6IG51bWJlciwgZW5kTGluZTogbnVtYmVyfSB8IG51bGx9IHJhbmdlXG4gKiBAcHJvcGVydHkge3t4OiBudW1iZXIsIHk6IG51bWJlciwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIGxheWVyOiBudW1iZXJ9fSBwb3NpdGlvblxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gR3JhcGhEdG9cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBkdG9WZXJzaW9uXG4gKiBAcHJvcGVydHkge3N0cmluZ30gZ3JhcGhJZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IHJ1bklkXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbGFuZ3VhZ2VcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBhZGFwdGVySWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBjb21wbGV0ZW5lc3NcbiAqIEBwcm9wZXJ0eSB7RHRvTm9kZVtdfSBub2Rlc1xuICogQHByb3BlcnR5IHtBcnJheTx7aWQ6IHN0cmluZywgZnJvbTogc3RyaW5nLCB0bzogc3RyaW5nLCB0eXBlOiBzdHJpbmcsIHN0YXR1czogc3RyaW5nLCBsYWJlbDogc3RyaW5nLCByZWFzb25Db2RlPzogc3RyaW5nfT59IGVkZ2VzXG4gKiBAcHJvcGVydHkge0FycmF5PHtjb2RlOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZywgc2V2ZXJpdHk6IHN0cmluZ30+fSBkaWFnbm9zdGljc1xuICogQHByb3BlcnR5IHtzdHJpbmdbXX0gZGVncmFkYXRpb25zXG4gKiBAcHJvcGVydHkge3t3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcn19IGV4dGVudFxuICogQHByb3BlcnR5IHt7c3RhdHVzZXM6IHN0cmluZ1tdLCBraW5kczogc3RyaW5nW119fSBsZWdlbmRcbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7R3JhcGh9IGdyYXBoXG4gKiBAcmV0dXJucyB7R3JhcGhEdG99XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b0R0byhncmFwaCkge1xuICBjb25zdCBsYXlvdXQgPSBjb21wdXRlTGF5b3V0KGdyYXBoKTtcblxuICBjb25zdCBub2RlcyA9IGdyYXBoLm5vZGVzLm1hcCgobm9kZSkgPT4gKHtcbiAgICBpZDogbm9kZS5pZCxcbiAgICBsYWJlbDogbm9kZS5sYWJlbCxcbiAgICBraW5kOiBub2RlLmtpbmQsXG4gICAgc3RhdHVzOiBub2RlLnN0YXR1cyxcbiAgICBiYWRnZTogbm9kZS5iYWRnZSA/PyAnJyxcbiAgICBleHRlcm5hbDogbm9kZS5leHRlcm5hbCxcbiAgICByYW5nZTogbm9kZS5yYW5nZVxuICAgICAgPyB7XG4gICAgICAgICAgZmlsZUlkOiBub2RlLnJhbmdlLmZpbGVJZCxcbiAgICAgICAgICBzdGFydExpbmU6IG5vZGUucmFuZ2Uuc3RhcnRMaW5lLFxuICAgICAgICAgIGVuZExpbmU6IG5vZGUucmFuZ2UuZW5kTGluZSxcbiAgICAgICAgfVxuICAgICAgOiBudWxsLFxuICAgIHBvc2l0aW9uOiBsYXlvdXQucG9zaXRpb25zW25vZGUuaWRdID8/IHsgeDogMCwgeTogMCwgd2lkdGg6IDE5MCwgaGVpZ2h0OiA1NCwgbGF5ZXI6IDAgfSxcbiAgfSkpO1xuXG4gIGNvbnN0IHN0YXR1c2VzID0gWy4uLm5ldyBTZXQobm9kZXMubWFwKChub2RlKSA9PiBub2RlLnN0YXR1cykpXS5zb3J0KCk7XG4gIGNvbnN0IGtpbmRzID0gWy4uLm5ldyBTZXQobm9kZXMubWFwKChub2RlKSA9PiBub2RlLmtpbmQpKV0uc29ydCgpO1xuXG4gIHJldHVybiB7XG4gICAgZHRvVmVyc2lvbjogR1JBUEhfRFRPX1ZFUlNJT04sXG4gICAgZ3JhcGhJZDogZ3JhcGguZ3JhcGhJZCxcbiAgICBydW5JZDogZ3JhcGgucnVuSWQsXG4gICAgbGFuZ3VhZ2U6IGdyYXBoLmxhbmd1YWdlLFxuICAgIGFkYXB0ZXJJZDogZ3JhcGguYWRhcHRlcklkLFxuICAgIGNvbXBsZXRlbmVzczogZ3JhcGguY29tcGxldGVuZXNzLFxuICAgIG5vZGVzLFxuICAgIGVkZ2VzOiBncmFwaC5lZGdlcy5tYXAoKGVkZ2UpID0+IHtcbiAgICAgIC8qKiBAdHlwZSB7e2lkOiBzdHJpbmcsIGZyb206IHN0cmluZywgdG86IHN0cmluZywgdHlwZTogc3RyaW5nLCBzdGF0dXM6IHN0cmluZywgbGFiZWw6IHN0cmluZywgcmVhc29uQ29kZT86IHN0cmluZ319ICovXG4gICAgICBjb25zdCBkdG9FZGdlID0ge1xuICAgICAgICBpZDogZWRnZS5pZCxcbiAgICAgICAgZnJvbTogZWRnZS5mcm9tLFxuICAgICAgICB0bzogZWRnZS50byxcbiAgICAgICAgdHlwZTogZWRnZS50eXBlLFxuICAgICAgICBzdGF0dXM6IGVkZ2Uuc3RhdHVzLFxuICAgICAgICBsYWJlbDogZWRnZS5sYWJlbCxcbiAgICAgIH07XG4gICAgICAvLyBPbWl0IHRoZSBrZXkgZW50aXJlbHkgd2hlbiBhYnNlbnQgc28gdGhlIERUTyBzdXJ2aXZlcyBhIEpTT04gcm91bmQtdHJpcFxuICAgICAgLy8gdW5jaGFuZ2VkIChKU09OIGNhbm5vdCByZXByZXNlbnQgYHVuZGVmaW5lZGApLlxuICAgICAgaWYgKGVkZ2UucmVhc29uQ29kZSkge1xuICAgICAgICBkdG9FZGdlLnJlYXNvbkNvZGUgPSBlZGdlLnJlYXNvbkNvZGU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZHRvRWRnZTtcbiAgICB9KSxcbiAgICBkaWFnbm9zdGljczogZ3JhcGguZGlhZ25vc3RpY3MsXG4gICAgZGVncmFkYXRpb25zOiBncmFwaC5kZWdyYWRhdGlvbnMsXG4gICAgZXh0ZW50OiB7IHdpZHRoOiBsYXlvdXQud2lkdGgsIGhlaWdodDogbGF5b3V0LmhlaWdodCB9LFxuICAgIGxlZ2VuZDogeyBzdGF0dXNlcywga2luZHMgfSxcbiAgfTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IGR0b1xuICogQHJldHVybnMge3tvazogdHJ1ZSwgZHRvOiBHcmFwaER0b30gfCB7b2s6IGZhbHNlLCBpc3N1ZXM6IHN0cmluZ1tdfX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlRHRvKGR0bykge1xuICAvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuICBjb25zdCBpc3N1ZXMgPSBbXTtcbiAgaWYgKHR5cGVvZiBkdG8gIT09ICdvYmplY3QnIHx8IGR0byA9PT0gbnVsbCB8fCBBcnJheS5pc0FycmF5KGR0bykpIHtcbiAgICByZXR1cm4geyBvazogZmFsc2UsIGlzc3VlczogWydEVE8gbXVzdCBiZSBhbiBvYmplY3QuJ10gfTtcbiAgfVxuICBjb25zdCBjYW5kaWRhdGUgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAoZHRvKTtcbiAgaWYgKGNhbmRpZGF0ZS5kdG9WZXJzaW9uICE9PSBHUkFQSF9EVE9fVkVSU0lPTikge1xuICAgIGlzc3Vlcy5wdXNoKGBVbnN1cHBvcnRlZCBkdG9WZXJzaW9uOiAke1N0cmluZyhjYW5kaWRhdGUuZHRvVmVyc2lvbil9LmApO1xuICB9XG4gIGlmIChjYW5kaWRhdGUuZHRvS2luZCA9PT0gJ2NmZycpIHtcbiAgICB2YWxpZGF0ZUNmZ0R0byhjYW5kaWRhdGUsIGlzc3Vlcyk7XG4gICAgcmV0dXJuIGlzc3Vlcy5sZW5ndGggPiAwXG4gICAgICA/IHsgb2s6IGZhbHNlLCBpc3N1ZXMgfVxuICAgICAgOiB7IG9rOiB0cnVlLCBkdG86IC8qKiBAdHlwZSB7R3JhcGhEdG99ICovIChkdG8pIH07XG4gIH1cbiAgaWYgKGNhbmRpZGF0ZS5kdG9LaW5kID09PSAnY2FsbF9ncmFwaCcpIHtcbiAgICB2YWxpZGF0ZUNhbGxHcmFwaER0byhjYW5kaWRhdGUsIGlzc3Vlcyk7XG4gICAgcmV0dXJuIGlzc3Vlcy5sZW5ndGggPiAwXG4gICAgICA/IHsgb2s6IGZhbHNlLCBpc3N1ZXMgfVxuICAgICAgOiB7IG9rOiB0cnVlLCBkdG86IC8qKiBAdHlwZSB7R3JhcGhEdG99ICovIChkdG8pIH07XG4gIH1cbiAgaWYgKGNhbmRpZGF0ZS5kdG9LaW5kID09PSAnc2VtYW50aWNfem9vbScpIHtcbiAgICB2YWxpZGF0ZVNlbWFudGljWm9vbUR0byhjYW5kaWRhdGUsIGlzc3Vlcyk7XG4gICAgcmV0dXJuIGlzc3Vlcy5sZW5ndGggPiAwXG4gICAgICA/IHsgb2s6IGZhbHNlLCBpc3N1ZXMgfVxuICAgICAgOiB7IG9rOiB0cnVlLCBkdG86IC8qKiBAdHlwZSB7R3JhcGhEdG99ICovIChkdG8pIH07XG4gIH1cbiAgY29uc3Qgbm9kZXMgPSBjYW5kaWRhdGUubm9kZXM7XG4gIGNvbnN0IGVkZ2VzID0gY2FuZGlkYXRlLmVkZ2VzO1xuICBpZiAoIUFycmF5LmlzQXJyYXkobm9kZXMpKSB7XG4gICAgaXNzdWVzLnB1c2goJ25vZGVzIG11c3QgYmUgYW4gYXJyYXkuJyk7XG4gIH1cbiAgaWYgKCFBcnJheS5pc0FycmF5KGVkZ2VzKSkge1xuICAgIGlzc3Vlcy5wdXNoKCdlZGdlcyBtdXN0IGJlIGFuIGFycmF5LicpO1xuICB9XG4gIGlmIChBcnJheS5pc0FycmF5KG5vZGVzKSAmJiBBcnJheS5pc0FycmF5KGVkZ2VzKSkge1xuICAgIGNvbnN0IGlkcyA9IG5ldyBTZXQoKTtcbiAgICBmb3IgKGNvbnN0IG5vZGUgb2Ygbm9kZXMpIHtcbiAgICAgIGNvbnN0IGlkID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKG5vZGUpLmlkO1xuICAgICAgaWYgKHR5cGVvZiBpZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgaXNzdWVzLnB1c2goJ0V2ZXJ5IG5vZGUgbmVlZHMgYSBzdHJpbmcgaWQuJyk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKGlkcy5oYXMoaWQpKSB7XG4gICAgICAgIGlzc3Vlcy5wdXNoKGBEdXBsaWNhdGUgbm9kZSBpZCBcIiR7aWR9XCIuYCk7XG4gICAgICB9XG4gICAgICBpZHMuYWRkKGlkKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBlZGdlIG9mIGVkZ2VzKSB7XG4gICAgICBjb25zdCByZWNvcmQgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAoZWRnZSk7XG4gICAgICBpZiAodHlwZW9mIHJlY29yZC5mcm9tICE9PSAnc3RyaW5nJyB8fCAhaWRzLmhhcyhyZWNvcmQuZnJvbSkpIHtcbiAgICAgICAgaXNzdWVzLnB1c2goYEVkZ2UgXCIke1N0cmluZyhyZWNvcmQuaWQpfVwiIGhhcyBhbiB1bmtub3duIHNvdXJjZSBub2RlLmApO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiByZWNvcmQudG8gIT09ICdzdHJpbmcnIHx8ICFpZHMuaGFzKHJlY29yZC50bykpIHtcbiAgICAgICAgaXNzdWVzLnB1c2goYEVkZ2UgXCIke1N0cmluZyhyZWNvcmQuaWQpfVwiIGhhcyBhbiB1bmtub3duIHRhcmdldCBub2RlLmApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAoaXNzdWVzLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4geyBvazogZmFsc2UsIGlzc3VlcyB9O1xuICB9XG4gIHJldHVybiB7IG9rOiB0cnVlLCBkdG86IC8qKiBAdHlwZSB7R3JhcGhEdG99ICovIChkdG8pIH07XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gY2FuZGlkYXRlXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBpc3N1ZXNcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVDZmdEdG8oY2FuZGlkYXRlLCBpc3N1ZXMpIHtcbiAgaWYgKGNhbmRpZGF0ZS5ncmFwaEtpbmQgIT09ICdjZmcnKSB7XG4gICAgaXNzdWVzLnB1c2goJ0EgQ0ZHIERUTyBtdXN0IGRlY2xhcmUgZ3JhcGhLaW5kIFwiY2ZnXCIuJyk7XG4gIH1cbiAgY29uc3QgZm4gPSBjYW5kaWRhdGUuZnVuY3Rpb247XG4gIGlmICh0eXBlb2YgZm4gIT09ICdvYmplY3QnIHx8IGZuID09PSBudWxsIHx8IEFycmF5LmlzQXJyYXkoZm4pKSB7XG4gICAgaXNzdWVzLnB1c2goJ2Z1bmN0aW9uIG11c3QgYmUgYW4gb2JqZWN0LicpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHJlY29yZCA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChmbik7XG4gICAgZm9yIChjb25zdCBrZXkgb2YgWydzeW1ib2xJZCcsICduYW1lJywgJ3F1YWxpZmllZE5hbWUnLCAna2luZCddKSB7XG4gICAgICBpZiAodHlwZW9mIHJlY29yZFtrZXldICE9PSAnc3RyaW5nJykge1xuICAgICAgICBpc3N1ZXMucHVzaChgZnVuY3Rpb24uJHtrZXl9IG11c3QgYmUgYSBzdHJpbmcuYCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChyZWNvcmQucmFuZ2UgIT09IG51bGwgJiYgIWlzUmFuZ2VSZWYocmVjb3JkLnJhbmdlKSkge1xuICAgICAgaXNzdWVzLnB1c2goJ2Z1bmN0aW9uLnJhbmdlIG11c3QgYmUgYSByYW5nZSByZWZlcmVuY2Ugb3IgbnVsbC4nKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBub2RlcyA9IGNhbmRpZGF0ZS5ub2RlcztcbiAgY29uc3QgZWRnZXMgPSBjYW5kaWRhdGUuZWRnZXM7XG4gIGlmICghQXJyYXkuaXNBcnJheShub2RlcykpIHtcbiAgICBpc3N1ZXMucHVzaCgnbm9kZXMgbXVzdCBiZSBhbiBhcnJheS4nKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKCFBcnJheS5pc0FycmF5KGVkZ2VzKSkge1xuICAgIGlzc3Vlcy5wdXNoKCdlZGdlcyBtdXN0IGJlIGFuIGFycmF5LicpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGlkcyA9IG5ldyBTZXQoKTtcbiAgLyoqIEB0eXBlIHtzdHJpbmdbXX0gKi9cbiAgY29uc3QgZW50cnlJZHMgPSBbXTtcbiAgLyoqIEB0eXBlIHtzdHJpbmdbXX0gKi9cbiAgY29uc3QgZXhpdElkcyA9IFtdO1xuICBmb3IgKGNvbnN0IGVudHJ5IG9mIG5vZGVzKSB7XG4gICAgaWYgKHR5cGVvZiBlbnRyeSAhPT0gJ29iamVjdCcgfHwgZW50cnkgPT09IG51bGwgfHwgQXJyYXkuaXNBcnJheShlbnRyeSkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKCdFdmVyeSBub2RlIG11c3QgYmUgYW4gb2JqZWN0LicpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IG5vZGUgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAoZW50cnkpO1xuICAgIGNvbnN0IGlkID0gbm9kZS5pZDtcbiAgICBpZiAodHlwZW9mIGlkICE9PSAnc3RyaW5nJykge1xuICAgICAgaXNzdWVzLnB1c2goJ0V2ZXJ5IG5vZGUgbmVlZHMgYSBzdHJpbmcgaWQuJyk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGlkcy5oYXMoaWQpKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRHVwbGljYXRlIG5vZGUgaWQgXCIke2lkfVwiLmApO1xuICAgIH1cbiAgICBpZHMuYWRkKGlkKTtcbiAgICBpZiAoIUNGR19OT0RFX0tJTkRTLmluY2x1ZGVzKFN0cmluZyhub2RlLmtpbmQpKSkge1xuICAgICAgaXNzdWVzLnB1c2goYE5vZGUgXCIke2lkfVwiIGhhcyB1bmtub3duIGtpbmQgXCIke1N0cmluZyhub2RlLmtpbmQpfVwiLmApO1xuICAgIH1cbiAgICBpZiAoIUNGR19TVEFUVVNFUy5pbmNsdWRlcyhTdHJpbmcobm9kZS5zdGF0dXMpKSkge1xuICAgICAgaXNzdWVzLnB1c2goYE5vZGUgXCIke2lkfVwiIGhhcyB1bmtub3duIHN0YXR1cyBcIiR7U3RyaW5nKG5vZGUuc3RhdHVzKX1cIi5gKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBub2RlLmxhYmVsICE9PSAnc3RyaW5nJykge1xuICAgICAgaXNzdWVzLnB1c2goYE5vZGUgXCIke2lkfVwiIG5lZWRzIGEgc3RyaW5nIGxhYmVsLmApO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICAhQXJyYXkuaXNBcnJheShub2RlLmxhYmVsTGluZXMpIHx8XG4gICAgICBub2RlLmxhYmVsTGluZXMuc29tZSgobGluZSkgPT4gdHlwZW9mIGxpbmUgIT09ICdzdHJpbmcnKVxuICAgICkge1xuICAgICAgaXNzdWVzLnB1c2goYE5vZGUgXCIke2lkfVwiIG5lZWRzIHN0cmluZyBsYWJlbExpbmVzLmApO1xuICAgIH1cbiAgICBpZiAobm9kZS5yYW5nZSAhPT0gbnVsbCAmJiAhaXNSYW5nZVJlZihub2RlLnJhbmdlKSkge1xuICAgICAgaXNzdWVzLnB1c2goYE5vZGUgXCIke2lkfVwiIGhhcyBhbiBpbnZhbGlkIHJhbmdlIHJlZmVyZW5jZS5gKTtcbiAgICB9XG4gICAgaWYgKCFpc1Bvc2l0aW9uKG5vZGUucG9zaXRpb24pKSB7XG4gICAgICBpc3N1ZXMucHVzaChgTm9kZSBcIiR7aWR9XCIgaGFzIGFuIGludmFsaWQgcG9zaXRpb24uYCk7XG4gICAgfVxuICAgIGlmIChub2RlLmtpbmQgPT09ICdlbnRyeScpIHtcbiAgICAgIGVudHJ5SWRzLnB1c2goaWQpO1xuICAgIH1cbiAgICBpZiAobm9kZS5raW5kID09PSAnZXhpdCcpIHtcbiAgICAgIGV4aXRJZHMucHVzaChpZCk7XG4gICAgfVxuICAgIGlmIChub2RlLmNhbGxzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShub2RlLmNhbGxzKSkge1xuICAgICAgICBpc3N1ZXMucHVzaChgTm9kZSBcIiR7aWR9XCIgY2FsbHMgbXVzdCBiZSBhbiBhcnJheSB3aGVuIHByZXNlbnQuYCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGNvbnN0IGNhbGwgb2Ygbm9kZS5jYWxscykge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiBjYWxsICE9PSAnb2JqZWN0JyB8fFxuICAgICAgICAgICAgY2FsbCA9PT0gbnVsbCB8fFxuICAgICAgICAgICAgdHlwZW9mIGNhbGwudG8gIT09ICdzdHJpbmcnIHx8XG4gICAgICAgICAgICB0eXBlb2YgY2FsbC5sYWJlbCAhPT0gJ3N0cmluZycgfHxcbiAgICAgICAgICAgICFDRkdfU1RBVFVTRVMuaW5jbHVkZXMoU3RyaW5nKGNhbGwuc3RhdHVzKSlcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGlzc3Vlcy5wdXNoKGBOb2RlIFwiJHtpZH1cIiBoYXMgYW4gaW52YWxpZCBjYWxsIHRhcmdldC5gKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKGVudHJ5SWRzLmxlbmd0aCAhPT0gMSkge1xuICAgIGlzc3Vlcy5wdXNoKGBBIENGRyBuZWVkcyBleGFjdGx5IG9uZSBlbnRyeSBub2RlOyBmb3VuZCAke2VudHJ5SWRzLmxlbmd0aH0uYCk7XG4gIH1cbiAgaWYgKGV4aXRJZHMubGVuZ3RoICE9PSAxKSB7XG4gICAgaXNzdWVzLnB1c2goYEEgQ0ZHIG5lZWRzIGV4YWN0bHkgb25lIGV4aXQgbm9kZTsgZm91bmQgJHtleGl0SWRzLmxlbmd0aH0uYCk7XG4gIH1cbiAgaWYgKGNhbmRpZGF0ZS5lbnRyeUlkICE9PSBlbnRyeUlkc1swXSkge1xuICAgIGlzc3Vlcy5wdXNoKCdlbnRyeUlkIG11c3QgcmVmZXJlbmNlIHRoZSBlbnRyeSBub2RlLicpO1xuICB9XG4gIGlmIChjYW5kaWRhdGUuZXhpdElkICE9PSBleGl0SWRzWzBdKSB7XG4gICAgaXNzdWVzLnB1c2goJ2V4aXRJZCBtdXN0IHJlZmVyZW5jZSB0aGUgZXhpdCBub2RlLicpO1xuICB9XG5cbiAgY29uc3QgZWRnZUlkcyA9IG5ldyBTZXQoKTtcbiAgZm9yIChjb25zdCBlbnRyeSBvZiBlZGdlcykge1xuICAgIGlmICh0eXBlb2YgZW50cnkgIT09ICdvYmplY3QnIHx8IGVudHJ5ID09PSBudWxsIHx8IEFycmF5LmlzQXJyYXkoZW50cnkpKSB7XG4gICAgICBpc3N1ZXMucHVzaCgnRXZlcnkgZWRnZSBtdXN0IGJlIGFuIG9iamVjdC4nKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBlZGdlID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKGVudHJ5KTtcbiAgICBjb25zdCBpZCA9IGVkZ2UuaWQ7XG4gICAgaWYgKHR5cGVvZiBpZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKCdFdmVyeSBlZGdlIG5lZWRzIGEgc3RyaW5nIGlkLicpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChlZGdlSWRzLmhhcyhpZCkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBEdXBsaWNhdGUgZWRnZSBpZCBcIiR7aWR9XCIuYCk7XG4gICAgfVxuICAgIGVkZ2VJZHMuYWRkKGlkKTtcbiAgICBpZiAodHlwZW9mIGVkZ2UuZnJvbSAhPT0gJ3N0cmluZycgfHwgIWlkcy5oYXMoZWRnZS5mcm9tKSkge1xuICAgICAgaXNzdWVzLnB1c2goYEVkZ2UgXCIke2lkfVwiIGhhcyBhbiB1bmtub3duIHNvdXJjZSBub2RlLmApO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGVkZ2UudG8gIT09ICdzdHJpbmcnIHx8ICFpZHMuaGFzKGVkZ2UudG8pKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7aWR9XCIgaGFzIGFuIHVua25vd24gdGFyZ2V0IG5vZGUuYCk7XG4gICAgfVxuICAgIGlmICghQ0ZHX0VER0VfS0lORFMuaW5jbHVkZXMoU3RyaW5nKGVkZ2Uua2luZCkpKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7aWR9XCIgaGFzIHVua25vd24ga2luZCBcIiR7U3RyaW5nKGVkZ2Uua2luZCl9XCIuYCk7XG4gICAgfVxuICAgIGlmICghQ0ZHX1NUQVRVU0VTLmluY2x1ZGVzKFN0cmluZyhlZGdlLnN0YXR1cykpKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7aWR9XCIgaGFzIHVua25vd24gc3RhdHVzIFwiJHtTdHJpbmcoZWRnZS5zdGF0dXMpfVwiLmApO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGVkZ2UubGFiZWwgIT09ICdzdHJpbmcnKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7aWR9XCIgbmVlZHMgYSBzdHJpbmcgbGFiZWwuYCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgZWRnZS5kYXNoICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgZWRnZS5nbHlwaEhpbnQgIT09ICdzdHJpbmcnKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7aWR9XCIgbmVlZHMgc3RyaW5nIGRhc2ggYW5kIGdseXBoSGludCBmaWVsZHMuYCk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgZGVncmFkYXRpb25zID0gY2FuZGlkYXRlLmRlZ3JhZGF0aW9ucztcbiAgaWYgKCFBcnJheS5pc0FycmF5KGRlZ3JhZGF0aW9ucykpIHtcbiAgICBpc3N1ZXMucHVzaCgnZGVncmFkYXRpb25zIG11c3QgYmUgYW4gYXJyYXkuJyk7XG4gIH0gZWxzZSB7XG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBkZWdyYWRhdGlvbnMpIHtcbiAgICAgIGlmIChcbiAgICAgICAgdHlwZW9mIGVudHJ5ICE9PSAnb2JqZWN0JyB8fFxuICAgICAgICBlbnRyeSA9PT0gbnVsbCB8fFxuICAgICAgICB0eXBlb2YgZW50cnkuY29kZSAhPT0gJ3N0cmluZycgfHxcbiAgICAgICAgdHlwZW9mIGVudHJ5Lm1lc3NhZ2UgIT09ICdzdHJpbmcnIHx8XG4gICAgICAgICFbJ2luZm8nLCAnd2FybmluZycsICdlcnJvciddLmluY2x1ZGVzKFN0cmluZyhlbnRyeS5zZXZlcml0eSkpXG4gICAgICApIHtcbiAgICAgICAgaXNzdWVzLnB1c2goJ0V2ZXJ5IGRlZ3JhZGF0aW9uIG5lZWRzIGEgY29kZSwgbWVzc2FnZSBhbmQgc2V2ZXJpdHkuJyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3QgZXh0ZW50ID0gY2FuZGlkYXRlLmV4dGVudDtcbiAgaWYgKFxuICAgIHR5cGVvZiBleHRlbnQgIT09ICdvYmplY3QnIHx8XG4gICAgZXh0ZW50ID09PSBudWxsIHx8XG4gICAgIU51bWJlci5pc0Zpbml0ZShleHRlbnQud2lkdGgpIHx8XG4gICAgIU51bWJlci5pc0Zpbml0ZShleHRlbnQuaGVpZ2h0KVxuICApIHtcbiAgICBpc3N1ZXMucHVzaCgnZXh0ZW50IG11c3QgY2FycnkgZmluaXRlIHdpZHRoIGFuZCBoZWlnaHQuJyk7XG4gIH1cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSBhIFBoYXNlIDcgQ2FsbCBHcmFwaCBEVE8uXG4gKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gY2FuZGlkYXRlXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBpc3N1ZXNcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVDYWxsR3JhcGhEdG8oY2FuZGlkYXRlLCBpc3N1ZXMpIHtcbiAgaWYgKGNhbmRpZGF0ZS5ncmFwaEtpbmQgIT09ICdjYWxsX2dyYXBoJykge1xuICAgIGlzc3Vlcy5wdXNoKCdBIENhbGwgR3JhcGggRFRPIG11c3QgZGVjbGFyZSBncmFwaEtpbmQgXCJjYWxsX2dyYXBoXCIuJyk7XG4gIH1cbiAgaWYgKHR5cGVvZiBjYW5kaWRhdGUuY2VudGVyU3ltYm9sSWQgIT09ICdzdHJpbmcnIHx8IGNhbmRpZGF0ZS5jZW50ZXJTeW1ib2xJZC5sZW5ndGggPT09IDApIHtcbiAgICBpc3N1ZXMucHVzaCgnY2VudGVyU3ltYm9sSWQgbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcuJyk7XG4gIH1cbiAgaWYgKCFDQUxMX1NDT1BFUy5pbmNsdWRlcyhTdHJpbmcoY2FuZGlkYXRlLnNjb3BlKSkpIHtcbiAgICBpc3N1ZXMucHVzaChgc2NvcGUgbXVzdCBiZSBvbmUgb2YgJHtDQUxMX1NDT1BFUy5qb2luKCcsICcpfS5gKTtcbiAgfVxuICBpZiAodHlwZW9mIGNhbmRpZGF0ZS5zY29wZUJhbm5lciAhPT0gJ3N0cmluZycgfHwgY2FuZGlkYXRlLnNjb3BlQmFubmVyLmxlbmd0aCA9PT0gMCkge1xuICAgIGlzc3Vlcy5wdXNoKCdzY29wZUJhbm5lciBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZy4nKTtcbiAgfVxuXG4gIGNvbnN0IG5vZGVzID0gY2FuZGlkYXRlLm5vZGVzO1xuICBjb25zdCBlZGdlcyA9IGNhbmRpZGF0ZS5lZGdlcztcbiAgaWYgKCFBcnJheS5pc0FycmF5KG5vZGVzKSkge1xuICAgIGlzc3Vlcy5wdXNoKCdub2RlcyBtdXN0IGJlIGFuIGFycmF5LicpO1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoIUFycmF5LmlzQXJyYXkoZWRnZXMpKSB7XG4gICAgaXNzdWVzLnB1c2goJ2VkZ2VzIG11c3QgYmUgYW4gYXJyYXkuJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgaWRzID0gbmV3IFNldCgpO1xuICBmb3IgKGNvbnN0IGVudHJ5IG9mIG5vZGVzKSB7XG4gICAgaWYgKHR5cGVvZiBlbnRyeSAhPT0gJ29iamVjdCcgfHwgZW50cnkgPT09IG51bGwgfHwgQXJyYXkuaXNBcnJheShlbnRyeSkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKCdFdmVyeSBub2RlIG11c3QgYmUgYW4gb2JqZWN0LicpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IG5vZGUgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAoZW50cnkpO1xuICAgIGNvbnN0IGlkID0gbm9kZS5pZDtcbiAgICBpZiAodHlwZW9mIGlkICE9PSAnc3RyaW5nJykge1xuICAgICAgaXNzdWVzLnB1c2goJ0V2ZXJ5IG5vZGUgbmVlZHMgYSBzdHJpbmcgaWQuJyk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGlkcy5oYXMoaWQpKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRHVwbGljYXRlIG5vZGUgaWQgXCIke2lkfVwiLmApO1xuICAgIH1cbiAgICBpZHMuYWRkKGlkKTtcbiAgICBpZiAoIUNBTExfTk9ERV9LSU5EUy5pbmNsdWRlcyhTdHJpbmcobm9kZS5raW5kKSkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBOb2RlIFwiJHtpZH1cIiBoYXMgdW5rbm93biBjYWxsLWdyYXBoIGtpbmQgXCIke1N0cmluZyhub2RlLmtpbmQpfVwiLmApO1xuICAgIH1cbiAgICBpZiAoIUNGR19TVEFUVVNFUy5pbmNsdWRlcyhTdHJpbmcobm9kZS5zdGF0dXMpKSkge1xuICAgICAgaXNzdWVzLnB1c2goYE5vZGUgXCIke2lkfVwiIGhhcyB1bmtub3duIHN0YXR1cyBcIiR7U3RyaW5nKG5vZGUuc3RhdHVzKX1cIi5gKTtcbiAgICB9XG4gICAgaWYgKCFpc1Bvc2l0aW9uKG5vZGUucG9zaXRpb24pKSB7XG4gICAgICBpc3N1ZXMucHVzaChgTm9kZSBcIiR7aWR9XCIgaGFzIGFuIGludmFsaWQgcG9zaXRpb24uYCk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgZWRnZUlkcyA9IG5ldyBTZXQoKTtcbiAgZm9yIChjb25zdCBlbnRyeSBvZiBlZGdlcykge1xuICAgIGlmICh0eXBlb2YgZW50cnkgIT09ICdvYmplY3QnIHx8IGVudHJ5ID09PSBudWxsIHx8IEFycmF5LmlzQXJyYXkoZW50cnkpKSB7XG4gICAgICBpc3N1ZXMucHVzaCgnRXZlcnkgZWRnZSBtdXN0IGJlIGFuIG9iamVjdC4nKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBlZGdlID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKGVudHJ5KTtcbiAgICBjb25zdCBpZCA9IGVkZ2UuaWQ7XG4gICAgaWYgKHR5cGVvZiBpZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKCdFdmVyeSBlZGdlIG5lZWRzIGEgc3RyaW5nIGlkLicpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChlZGdlSWRzLmhhcyhpZCkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBEdXBsaWNhdGUgZWRnZSBpZCBcIiR7aWR9XCIuYCk7XG4gICAgfVxuICAgIGVkZ2VJZHMuYWRkKGlkKTtcbiAgICBpZiAodHlwZW9mIGVkZ2UuZnJvbSAhPT0gJ3N0cmluZycgfHwgIWlkcy5oYXMoZWRnZS5mcm9tKSkge1xuICAgICAgaXNzdWVzLnB1c2goYEVkZ2UgXCIke2lkfVwiIGhhcyBhbiB1bmtub3duIHNvdXJjZSBub2RlLmApO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGVkZ2UudG8gIT09ICdzdHJpbmcnIHx8ICFpZHMuaGFzKGVkZ2UudG8pKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7aWR9XCIgaGFzIGFuIHVua25vd24gdGFyZ2V0IG5vZGUuYCk7XG4gICAgfVxuICAgIGlmICghQ0FMTF9SRUxBVElPTlNISVBfVFlQRVMuaW5jbHVkZXMoU3RyaW5nKGVkZ2UudHlwZSkpKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7aWR9XCIgaGFzIHVua25vd24gdHlwZSBcIiR7U3RyaW5nKGVkZ2UudHlwZSl9XCIuYCk7XG4gICAgfVxuICAgIGlmICghQ0ZHX1NUQVRVU0VTLmluY2x1ZGVzKFN0cmluZyhlZGdlLnN0YXR1cykpKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7aWR9XCIgaGFzIHVua25vd24gc3RhdHVzIFwiJHtTdHJpbmcoZWRnZS5zdGF0dXMpfVwiLmApO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGVkZ2UuZGFzaCAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIGVkZ2UuZ2x5cGhIaW50ICE9PSAnc3RyaW5nJykge1xuICAgICAgaXNzdWVzLnB1c2goYEVkZ2UgXCIke2lkfVwiIG5lZWRzIHN0cmluZyBkYXNoIGFuZCBnbHlwaEhpbnQgZmllbGRzLmApO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBpc1JhbmdlUmVmKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnIHx8IHZhbHVlID09PSBudWxsIHx8IEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IHJhbmdlID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKHZhbHVlKTtcbiAgcmV0dXJuIChcbiAgICB0eXBlb2YgcmFuZ2UuZmlsZUlkID09PSAnc3RyaW5nJyAmJlxuICAgIE51bWJlci5pc0ludGVnZXIocmFuZ2Uuc3RhcnRMaW5lKSAmJlxuICAgIE51bWJlci5pc0ludGVnZXIocmFuZ2Uuc3RhcnRDb2x1bW4pICYmXG4gICAgTnVtYmVyLmlzSW50ZWdlcihyYW5nZS5lbmRMaW5lKSAmJlxuICAgIE51bWJlci5pc0ludGVnZXIocmFuZ2UuZW5kQ29sdW1uKSAmJlxuICAgIHJhbmdlLnN0YXJ0TGluZSA+PSAwICYmXG4gICAgcmFuZ2Uuc3RhcnRDb2x1bW4gPj0gMCAmJlxuICAgIHJhbmdlLmVuZExpbmUgPj0gMCAmJlxuICAgIHJhbmdlLmVuZENvbHVtbiA+PSAwXG4gICk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gY2FuZGlkYXRlXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBpc3N1ZXNcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVTZW1hbnRpY1pvb21EdG8oY2FuZGlkYXRlLCBpc3N1ZXMpIHtcbiAgaWYgKHR5cGVvZiBjYW5kaWRhdGUubGV2ZWwgIT09ICdzdHJpbmcnIHx8ICFMRVZFTF9PUkRFUi5pbmNsdWRlcyhjYW5kaWRhdGUubGV2ZWwpKSB7XG4gICAgaXNzdWVzLnB1c2goYEludmFsaWQgc2VtYW50aWMgem9vbSBsZXZlbDogJHtTdHJpbmcoY2FuZGlkYXRlLmxldmVsKX0uYCk7XG4gIH1cbiAgaWYgKHR5cGVvZiBjYW5kaWRhdGUuc2NvcGVJZCAhPT0gJ3N0cmluZycgfHwgY2FuZGlkYXRlLnNjb3BlSWQubGVuZ3RoID09PSAwKSB7XG4gICAgaXNzdWVzLnB1c2goJ1NlbWFudGljIHpvb20gRFRPIHJlcXVpcmVzIGEgbm9uLWVtcHR5IHNjb3BlSWQuJyk7XG4gIH1cbiAgaWYgKCFBcnJheS5pc0FycmF5KGNhbmRpZGF0ZS5icmVhZGNydW1icykgfHwgY2FuZGlkYXRlLmJyZWFkY3J1bWJzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlzc3Vlcy5wdXNoKCdTZW1hbnRpYyB6b29tIERUTyByZXF1aXJlcyBhIG5vbi1lbXB0eSBicmVhZGNydW1icyBhcnJheS4nKTtcbiAgfVxuICBpZiAoIUFycmF5LmlzQXJyYXkoY2FuZGlkYXRlLm5vZGVzKSkge1xuICAgIGlzc3Vlcy5wdXNoKCdTZW1hbnRpYyB6b29tIERUTyByZXF1aXJlcyBhIG5vZGVzIGFycmF5LicpO1xuICB9XG4gIGlmICghQXJyYXkuaXNBcnJheShjYW5kaWRhdGUuZWRnZXMpKSB7XG4gICAgaXNzdWVzLnB1c2goJ1NlbWFudGljIHpvb20gRFRPIHJlcXVpcmVzIGFuIGVkZ2VzIGFycmF5LicpO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGlzUG9zaXRpb24odmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcgfHwgdmFsdWUgPT09IG51bGwgfHwgQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgcG9zaXRpb24gPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAodmFsdWUpO1xuICByZXR1cm4gKFxuICAgIE51bWJlci5pc0Zpbml0ZShwb3NpdGlvbi54KSAmJlxuICAgIE51bWJlci5pc0Zpbml0ZShwb3NpdGlvbi55KSAmJlxuICAgIE51bWJlci5pc0Zpbml0ZShwb3NpdGlvbi53aWR0aCkgJiZcbiAgICBOdW1iZXIuaXNGaW5pdGUocG9zaXRpb24uaGVpZ2h0KSAmJlxuICAgIE51bWJlci5pc0ludGVnZXIocG9zaXRpb24ubGF5ZXIpXG4gICk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtHcmFwaER0b30gZHRvXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplRHRvKGR0bykge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoZHRvKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30ganNvblxuICogQHJldHVybnMge0dyYXBoRHRvfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VEdG8oanNvbikge1xuICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGpzb24pO1xuICBjb25zdCB2YWxpZGF0aW9uID0gdmFsaWRhdGVEdG8ocGFyc2VkKTtcbiAgaWYgKCF2YWxpZGF0aW9uLm9rKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGdyYXBoIERUTzogJHt2YWxpZGF0aW9uLmlzc3Vlcy5qb2luKCc7ICcpfWApO1xuICB9XG4gIHJldHVybiB2YWxpZGF0aW9uLmR0bztcbn1cbiIsICIvKipcbiAqIFNWRyByZW5kZXJlci5cbiAqXG4gKiBQaGFzZSAwIHJlbmRlcmVyOiBkZXRlcm1pbmlzdGljIGxheWVyZWQgcG9zaXRpb25zIGNvbWUgZnJvbSB0aGUgRFRPLCBzbyB0aGlzXG4gKiBtb2R1bGUgb25seSBkcmF3cy4gSXQgaGFzIG5vIGtub3dsZWRnZSBvZiBhbmFseXNpcywgYWRhcHRlcnMsIG9yIHRoZSBwcm90b2NvbC5cbiAqXG4gKiBLZXB0IGJlaGluZCBhIHNtYWxsIGludGVyZmFjZSAoYHJlbmRlcmAsIGBzZWxlY3RgLCBgZGVzdHJveWApIGJlY2F1c2UgUGhhc2UgNFxuICogYmVuY2htYXJrcyBDeXRvc2NhcGUvRUxLIGFuZCBtYXkgcmVwbGFjZSB0aGUgaW1wbGVtZW50YXRpb24uIENhbGxlcnMgbXVzdCBub3RcbiAqIGRlcGVuZCBvbiBTVkcgaW50ZXJuYWxzLlxuICovXG5cbmNvbnN0IFNWR19OUyA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG5cbi8qKlxuICogQHR5cGVkZWYge2ltcG9ydCgnLi4vLi4vY29yZS9ncmFwaC9kdG8uanMnKS5HcmFwaER0b30gR3JhcGhEdG9cbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4uLy4uL2NvcmUvZ3JhcGgvZHRvLmpzJykuRHRvTm9kZX0gRHRvTm9kZVxuICovXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgc3RyaW5nIHwgbnVtYmVyPn0gW2F0dHJpYnV0ZXNdXG4gKiBAcmV0dXJucyB7U1ZHRWxlbWVudH1cbiAqL1xuZnVuY3Rpb24gc3ZnRWwobmFtZSwgYXR0cmlidXRlcyA9IHt9KSB7XG4gIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoU1ZHX05TLCBuYW1lKTtcbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoYXR0cmlidXRlcykpIHtcbiAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShrZXksIFN0cmluZyh2YWx1ZSkpO1xuICB9XG4gIHJldHVybiBlbGVtZW50O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICogQHBhcmFtIHtudW1iZXJ9IG1heFxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gdHJ1bmNhdGUodmFsdWUsIG1heCkge1xuICBjb25zdCB0ZXh0ID0gU3RyaW5nKHZhbHVlID8/ICcnKTtcbiAgcmV0dXJuIHRleHQubGVuZ3RoID4gbWF4ID8gYCR7dGV4dC5zbGljZSgwLCBtYXggLSAxKX1cdTIwMjZgIDogdGV4dDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3tcbiAqICAgc3ZnOiBTVkdTVkdFbGVtZW50LFxuICogICBvblNlbGVjdDogKG5vZGVJZDogc3RyaW5nLCBub2RlOiBEdG9Ob2RlKSA9PiB2b2lkLFxuICogICBvbk5hdmlnYXRlPzogKG5vZGVJZDogc3RyaW5nLCBub2RlOiBEdG9Ob2RlLCB0cmlnZ2VyPzogJ3BvaW50ZXInfCdrZXlib2FyZCcpID0+IHZvaWQsXG4gKiAgIG9uUHJldmlld0VudGVyPzogKG5vZGVJZDogc3RyaW5nLCBub2RlOiBEdG9Ob2RlLCBwb2ludDoge3g6IG51bWJlciwgeTogbnVtYmVyfSkgPT4gdm9pZCxcbiAqICAgb25QcmV2aWV3TW92ZT86IChwb2ludDoge3g6IG51bWJlciwgeTogbnVtYmVyfSkgPT4gdm9pZCxcbiAqICAgb25QcmV2aWV3TGVhdmU/OiAobm9kZUlkOiBzdHJpbmcpID0+IHZvaWQsXG4gKiAgIG9uUHJldmlld0tleT86IChub2RlSWQ6IHN0cmluZywgbm9kZTogRHRvTm9kZSkgPT4gdm9pZCxcbiAqIH19IG9wdGlvbnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVN2Z1JlbmRlcmVyKG9wdGlvbnMpIHtcbiAgY29uc3QgeyBzdmcsIG9uU2VsZWN0IH0gPSBvcHRpb25zO1xuICAvKiogQHR5cGUge0dyYXBoRHRvIHwgbnVsbH0gKi9cbiAgbGV0IGR0byA9IG51bGw7XG4gIC8qKiBAdHlwZSB7U1ZHR0VsZW1lbnQgfCBudWxsfSAqL1xuICBsZXQgdmlld3BvcnQgPSBudWxsO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIFNWR0dFbGVtZW50Pn0gKi9cbiAgY29uc3Qgbm9kZUVsZW1lbnRzID0gbmV3IE1hcCgpO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIFNWR1BhdGhFbGVtZW50Pn0gKi9cbiAgY29uc3QgZWRnZUVsZW1lbnRzID0gbmV3IE1hcCgpO1xuICAvKiogQHR5cGUge3N0cmluZyB8IG51bGx9ICovXG4gIGxldCBzZWxlY3RlZElkID0gbnVsbDtcblxuICBsZXQgc2NhbGUgPSAxO1xuICBsZXQgdHJhbnNsYXRlWCA9IDA7XG4gIGxldCB0cmFuc2xhdGVZID0gMDtcbiAgbGV0IGRyYWdnaW5nID0gZmFsc2U7XG4gIGxldCBkcmFnU3RhcnQgPSB7IHg6IDAsIHk6IDAsIHR4OiAwLCB0eTogMCB9O1xuXG4gIGZ1bmN0aW9uIGFwcGx5VHJhbnNmb3JtKCkge1xuICAgIGlmICh2aWV3cG9ydCkge1xuICAgICAgdmlld3BvcnQuc2V0QXR0cmlidXRlKFxuICAgICAgICAndHJhbnNmb3JtJyxcbiAgICAgICAgYHRyYW5zbGF0ZSgke3RyYW5zbGF0ZVgudG9GaXhlZCgyKX0gJHt0cmFuc2xhdGVZLnRvRml4ZWQoMil9KSBzY2FsZSgke3NjYWxlLnRvRml4ZWQoMyl9KWAsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG5vZGVQb2ludChub2RlLCBzaWRlKSB7XG4gICAgaWYgKHNpZGUgPT09ICdvdXQnKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB4OiBub2RlLnBvc2l0aW9uLnggKyBub2RlLnBvc2l0aW9uLndpZHRoLFxuICAgICAgICB5OiBub2RlLnBvc2l0aW9uLnkgKyBub2RlLnBvc2l0aW9uLmhlaWdodCAvIDIsXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4geyB4OiBub2RlLnBvc2l0aW9uLngsIHk6IG5vZGUucG9zaXRpb24ueSArIG5vZGUucG9zaXRpb24uaGVpZ2h0IC8gMiB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZWRnZVBhdGgoc291cmNlLCB0YXJnZXQpIHtcbiAgICBpZiAoc291cmNlLmlkID09PSB0YXJnZXQuaWQpIHtcbiAgICAgIGNvbnN0IHsgeCwgeSwgd2lkdGgsIGhlaWdodCB9ID0gc291cmNlLnBvc2l0aW9uO1xuICAgICAgY29uc3QgY3ggPSB4ICsgd2lkdGggLyAyO1xuICAgICAgY29uc3Qgc3RhcnRZID0geSAtIDI7XG4gICAgICByZXR1cm4gYE0gJHtjeH0gJHtzdGFydFl9IEMgJHtjeCAtIDQ2fSAke3kgLSA2MH0sICR7Y3ggKyA0Nn0gJHt5IC0gNjB9LCAke2N4fSAke3kgKyBoZWlnaHQgKyAyfWA7XG4gICAgfVxuICAgIGNvbnN0IGZyb20gPSBub2RlUG9pbnQoc291cmNlLCAnb3V0Jyk7XG4gICAgY29uc3QgdG8gPSBub2RlUG9pbnQodGFyZ2V0LCAnaW4nKTtcbiAgICBjb25zdCBiZW5kID0gTWF0aC5tYXgoMzYsIE1hdGguYWJzKHRvLnggLSBmcm9tLngpIC8gMik7XG4gICAgcmV0dXJuIGBNICR7ZnJvbS54fSAke2Zyb20ueX0gQyAke2Zyb20ueCArIGJlbmR9ICR7ZnJvbS55fSwgJHt0by54IC0gYmVuZH0gJHt0by55fSwgJHt0by54fSAke3RvLnl9YDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIGlmICh2aWV3cG9ydCkge1xuICAgICAgc3ZnLnJlbW92ZUNoaWxkKHZpZXdwb3J0KTtcbiAgICB9XG4gICAgdmlld3BvcnQgPSBzdmdFbCgnZycsIHsgY2xhc3M6ICdjZi12aWV3cG9ydCcgfSk7XG4gICAgc3ZnLmFwcGVuZENoaWxkKHZpZXdwb3J0KTtcbiAgICBub2RlRWxlbWVudHMuY2xlYXIoKTtcbiAgICBlZGdlRWxlbWVudHMuY2xlYXIoKTtcbiAgICBzZWxlY3RlZElkID0gbnVsbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbGVjdChub2RlSWQpIHtcbiAgICBzZWxlY3RlZElkID0gbm9kZUlkO1xuICAgIGZvciAoY29uc3QgW2lkLCBlbGVtZW50XSBvZiBub2RlRWxlbWVudHMpIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZSgnaXMtc2VsZWN0ZWQnLCBpZCA9PT0gbm9kZUlkKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBbLCBlbGVtZW50XSBvZiBlZGdlRWxlbWVudHMpIHtcbiAgICAgIGNvbnN0IGFjdGl2ZSA9XG4gICAgICAgIG5vZGVJZCAhPT0gbnVsbCAmJiAoZWxlbWVudC5kYXRhc2V0LmZyb20gPT09IG5vZGVJZCB8fCBlbGVtZW50LmRhdGFzZXQudG8gPT09IG5vZGVJZCk7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoJ2lzLWFjdGl2ZScsIGFjdGl2ZSk7XG4gICAgfVxuICAgIGlmIChzZWxlY3RlZElkICYmIG5vZGVFbGVtZW50cy5oYXMoc2VsZWN0ZWRJZCkpIHtcbiAgICAgIGNvbnN0IG5vZGUgPSAvKiogQHR5cGUge0R0b05vZGV9ICovIChkdG8/Lm5vZGVzLmZpbmQoKGl0ZW0pID0+IGl0ZW0uaWQgPT09IHNlbGVjdGVkSWQpKTtcbiAgICAgIG9uU2VsZWN0KHNlbGVjdGVkSWQsIG5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHpvb21Ub0ZpdCgpIHtcbiAgICBpZiAoIWR0byB8fCAhdmlld3BvcnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgYm91bmRzID0gc3ZnLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IHBhZGRpbmcgPSA0ODtcbiAgICBsZXQgd2lkdGggPSAxO1xuICAgIGxldCBoZWlnaHQgPSAxO1xuICAgIGlmIChkdG8uZXh0ZW50ICYmIE51bWJlci5pc0Zpbml0ZShkdG8uZXh0ZW50LndpZHRoKSAmJiBOdW1iZXIuaXNGaW5pdGUoZHRvLmV4dGVudC5oZWlnaHQpKSB7XG4gICAgICB3aWR0aCA9IE1hdGgubWF4KDEsIGR0by5leHRlbnQud2lkdGgpO1xuICAgICAgaGVpZ2h0ID0gTWF0aC5tYXgoMSwgZHRvLmV4dGVudC5oZWlnaHQpO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShkdG8ubm9kZXMpICYmIGR0by5ub2Rlcy5sZW5ndGggPiAwKSB7XG4gICAgICBsZXQgbWF4WCA9IDA7XG4gICAgICBsZXQgbWF4WSA9IDA7XG4gICAgICBmb3IgKGNvbnN0IG5vZGUgb2YgZHRvLm5vZGVzKSB7XG4gICAgICAgIGNvbnN0IG54ID0gKG5vZGUucG9zaXRpb24/LnggPz8gMCkgKyAobm9kZS5wb3NpdGlvbj8ud2lkdGggPz8gMTYwKTtcbiAgICAgICAgY29uc3QgbnkgPSAobm9kZS5wb3NpdGlvbj8ueSA/PyAwKSArIChub2RlLnBvc2l0aW9uPy5oZWlnaHQgPz8gNTApO1xuICAgICAgICBpZiAobnggPiBtYXhYKSBtYXhYID0gbng7XG4gICAgICAgIGlmIChueSA+IG1heFkpIG1heFkgPSBueTtcbiAgICAgIH1cbiAgICAgIHdpZHRoID0gTWF0aC5tYXgoMSwgbWF4WCArIDY0KTtcbiAgICAgIGhlaWdodCA9IE1hdGgubWF4KDEsIG1heFkgKyA2NCk7XG4gICAgfVxuICAgIGNvbnN0IGF2YWlsYWJsZVdpZHRoID0gTWF0aC5tYXgoMTIwLCBib3VuZHMud2lkdGggLSBwYWRkaW5nICogMik7XG4gICAgY29uc3QgYXZhaWxhYmxlSGVpZ2h0ID0gTWF0aC5tYXgoMTIwLCBib3VuZHMuaGVpZ2h0IC0gcGFkZGluZyAqIDIpO1xuICAgIHNjYWxlID0gTWF0aC5taW4oMS40LCBhdmFpbGFibGVXaWR0aCAvIHdpZHRoLCBhdmFpbGFibGVIZWlnaHQgLyBoZWlnaHQpO1xuICAgIHNjYWxlID0gTWF0aC5tYXgoMC4xNSwgc2NhbGUpO1xuICAgIHRyYW5zbGF0ZVggPSAoYm91bmRzLndpZHRoIC0gd2lkdGggKiBzY2FsZSkgLyAyO1xuICAgIHRyYW5zbGF0ZVkgPSAoYm91bmRzLmhlaWdodCAtIGhlaWdodCAqIHNjYWxlKSAvIDI7XG4gICAgYXBwbHlUcmFuc2Zvcm0oKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0dyYXBoRHRvfSBuZXh0RHRvXG4gICAqL1xuICBmdW5jdGlvbiByZW5kZXIobmV4dER0bykge1xuICAgIGR0byA9IG5leHREdG87XG4gICAgY2xlYXIoKTtcbiAgICBpZiAoIXZpZXdwb3J0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYnlJZCA9IG5ldyBNYXAoZHRvLm5vZGVzLm1hcCgobm9kZSkgPT4gW25vZGUuaWQsIG5vZGVdKSk7XG5cbiAgICBmb3IgKGNvbnN0IGVkZ2Ugb2YgZHRvLmVkZ2VzKSB7XG4gICAgICBjb25zdCBzb3VyY2UgPSBieUlkLmdldChlZGdlLmZyb20pO1xuICAgICAgY29uc3QgdGFyZ2V0ID0gYnlJZC5nZXQoZWRnZS50byk7XG4gICAgICBpZiAoIXNvdXJjZSB8fCAhdGFyZ2V0KSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgcGF0aCA9IC8qKiBAdHlwZSB7U1ZHUGF0aEVsZW1lbnR9ICovIChcbiAgICAgICAgc3ZnRWwoJ3BhdGgnLCB7XG4gICAgICAgICAgY2xhc3M6IGBjZi1lZGdlIGNmLWVkZ2UtLSR7ZWRnZS5zdGF0dXN9IGNmLWVkZ2UtLWtpbmQtJHtlZGdlLmtpbmQgPz8gZWRnZS50eXBlfSR7XG4gICAgICAgICAgICBlZGdlLmlzQ3ljbGUgPyAnIGNmLWVkZ2UtLWN5Y2xlJyA6ICcnXG4gICAgICAgICAgfSR7ZWRnZS5kaW1tZWQgPyAnIGlzLWRpbW1lZCcgOiAnJ31gLFxuICAgICAgICAgIGQ6IGVkZ2VQYXRoKHNvdXJjZSwgdGFyZ2V0KSxcbiAgICAgICAgICAnZGF0YS1mcm9tJzogZWRnZS5mcm9tLFxuICAgICAgICAgICdkYXRhLXRvJzogZWRnZS50byxcbiAgICAgICAgICAuLi4oZWRnZS5kYXNoID8geyAnc3Ryb2tlLWRhc2hhcnJheSc6IGVkZ2UuZGFzaCB9IDoge30pLFxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICAgIHBhdGguZGF0YXNldC5mcm9tID0gZWRnZS5mcm9tO1xuICAgICAgcGF0aC5kYXRhc2V0LnRvID0gZWRnZS50bztcbiAgICAgIGNvbnN0IHRpdGxlID0gc3ZnRWwoJ3RpdGxlJyk7XG4gICAgICB0aXRsZS50ZXh0Q29udGVudCA9IGAke2VkZ2Uua2luZCA/PyBlZGdlLnR5cGV9ICgke2VkZ2Uuc3RhdHVzfSkke1xuICAgICAgICBlZGdlLnJlYXNvbkNvZGUgPyBgOiAke2VkZ2UucmVhc29uQ29kZX1gIDogJydcbiAgICAgIH0ke2VkZ2UuZ2x5cGhIaW50ID8gYCAke2VkZ2UuZ2x5cGhIaW50fWAgOiAnJ31gO1xuICAgICAgcGF0aC5hcHBlbmRDaGlsZCh0aXRsZSk7XG4gICAgICB2aWV3cG9ydC5hcHBlbmRDaGlsZChwYXRoKTtcbiAgICAgIGVkZ2VFbGVtZW50cy5zZXQoZWRnZS5pZCwgcGF0aCk7XG5cbiAgICAgIGlmIChlZGdlLmxhYmVsICYmIGVkZ2UubGFiZWwubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBmcm9tID0gbm9kZVBvaW50KHNvdXJjZSwgJ291dCcpO1xuICAgICAgICBjb25zdCB0byA9IG5vZGVQb2ludCh0YXJnZXQsICdpbicpO1xuICAgICAgICBjb25zdCBsYWJlbCA9IHN2Z0VsKCd0ZXh0Jywge1xuICAgICAgICAgIGNsYXNzOiAnY2YtZWRnZS1sYWJlbCcsXG4gICAgICAgICAgeDogKGZyb20ueCArIHRvLngpIC8gMixcbiAgICAgICAgICB5OiAoZnJvbS55ICsgdG8ueSkgLyAyIC0gNCxcbiAgICAgICAgICAndGV4dC1hbmNob3InOiAnbWlkZGxlJyxcbiAgICAgICAgfSk7XG4gICAgICAgIGxhYmVsLnRleHRDb250ZW50ID0gdHJ1bmNhdGUoZWRnZS5sYWJlbCwgMjIpO1xuICAgICAgICB2aWV3cG9ydC5hcHBlbmRDaGlsZChsYWJlbCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBub2RlIG9mIGR0by5ub2Rlcykge1xuICAgICAgY29uc3QgZ3JvdXAgPSAvKiogQHR5cGUge1NWR0dFbGVtZW50fSAqLyAoXG4gICAgICAgIHN2Z0VsKCdnJywge1xuICAgICAgICAgIGNsYXNzOiBgY2Ytbm9kZSBjZi1ub2RlLS0ke25vZGUuc3RhdHVzfSBjZi1ub2RlLS1raW5kLSR7bm9kZS5raW5kfSR7XG4gICAgICAgICAgICBub2RlLmV4dGVybmFsID8gJyBjZi1ub2RlLS1leHRlcm5hbCcgOiAnJ1xuICAgICAgICAgIH0ke25vZGUudW5yZWFjaGFibGUgPyAnIGNmLW5vZGUtLXVucmVhY2hhYmxlJyA6ICcnfSR7XG4gICAgICAgICAgICBub2RlLmlzQ2VudGVyID8gJyBjZi1ub2RlLS1jZW50ZXInIDogJydcbiAgICAgICAgICB9JHtub2RlLmlzQ3ljbGljID8gJyBjZi1ub2RlLS1jeWNsaWMnIDogJyd9JHtub2RlLmRpbW1lZCA/ICcgaXMtZGltbWVkJyA6ICcnfWAsXG4gICAgICAgICAgdHJhbnNmb3JtOiBgdHJhbnNsYXRlKCR7bm9kZS5wb3NpdGlvbi54fSAke25vZGUucG9zaXRpb24ueX0pYCxcbiAgICAgICAgICB0YWJpbmRleDogJzAnLFxuICAgICAgICAgIHJvbGU6ICdidXR0b24nLFxuICAgICAgICAgICdhcmlhLWxhYmVsJzogYCR7bm9kZS5raW5kfSAke25vZGUubGFiZWx9LCAke25vZGUuc3RhdHVzfSR7XG4gICAgICAgICAgICBub2RlLnVucmVhY2hhYmxlID8gJywgdW5yZWFjaGFibGUnIDogJydcbiAgICAgICAgICB9JHtub2RlLmV4dGVybmFsID8gJywgZXh0ZXJuYWwgdGFyZ2V0JyA6ICcnfWAsXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICBncm91cC5hcHBlbmRDaGlsZChcbiAgICAgICAgc3ZnRWwoJ3JlY3QnLCB7XG4gICAgICAgICAgY2xhc3M6ICdjZi1ub2RlLWJveCcsXG4gICAgICAgICAgd2lkdGg6IG5vZGUucG9zaXRpb24ud2lkdGgsXG4gICAgICAgICAgaGVpZ2h0OiBub2RlLnBvc2l0aW9uLmhlaWdodCxcbiAgICAgICAgICByeDogNixcbiAgICAgICAgICByeTogNixcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgICBjb25zdCByYXdMaW5lcyA9XG4gICAgICAgIEFycmF5LmlzQXJyYXkobm9kZS5sYWJlbExpbmVzKSAmJiBub2RlLmxhYmVsTGluZXMubGVuZ3RoID4gMFxuICAgICAgICAgID8gbm9kZS5sYWJlbExpbmVzLmZpbHRlcigobCkgPT4gdHlwZW9mIGwgPT09ICdzdHJpbmcnICYmIGwudHJpbSgpLmxlbmd0aCA+IDApXG4gICAgICAgICAgOiBbXTtcbiAgICAgIGNvbnN0IGZhbGxiYWNrTGFiZWwgPVxuICAgICAgICAobm9kZS5sYWJlbCAmJiBTdHJpbmcobm9kZS5sYWJlbCkudHJpbSgpKSB8fFxuICAgICAgICAobm9kZS5raW5kICYmIFN0cmluZyhub2RlLmtpbmQpLnRyaW0oKSkgfHxcbiAgICAgICAgbm9kZS5pZDtcbiAgICAgIGNvbnN0IGxpbmVzID1cbiAgICAgICAgcmF3TGluZXMubGVuZ3RoID4gMCA/IHJhd0xpbmVzLnNsaWNlKDAsIDIpIDogW3RydW5jYXRlKGZhbGxiYWNrTGFiZWwsIDI2KV07XG4gICAgICBjb25zdCBsaW5lSGVpZ2h0ID0gMTM7XG4gICAgICBjb25zdCBibG9ja0hlaWdodCA9IGxpbmVzLmxlbmd0aCAqIGxpbmVIZWlnaHQ7XG4gICAgICBjb25zdCBzaG93S2luZCA9XG4gICAgICAgIG5vZGUucG9zaXRpb24uaGVpZ2h0ID49IDU2ICYmXG4gICAgICAgIGxpbmVzLmxlbmd0aCA9PT0gMSAmJlxuICAgICAgICBub2RlLmtpbmQgJiZcbiAgICAgICAgU3RyaW5nKGZhbGxiYWNrTGFiZWwpLnRvTG93ZXJDYXNlKCkgIT09IFN0cmluZyhub2RlLmtpbmQpLnRvTG93ZXJDYXNlKCk7XG5cbiAgICAgIGNvbnN0IHN0YXJ0WSA9IHNob3dLaW5kXG4gICAgICAgID8gTWF0aC5tYXgoMTQsIChub2RlLnBvc2l0aW9uLmhlaWdodCAtIDE4KSAvIDIgLSBibG9ja0hlaWdodCAvIDIgKyBsaW5lSGVpZ2h0KVxuICAgICAgICA6IE1hdGgubWF4KDE0LCBub2RlLnBvc2l0aW9uLmhlaWdodCAvIDIgLSBibG9ja0hlaWdodCAvIDIgKyBsaW5lSGVpZ2h0IC0gMyk7XG5cbiAgICAgIGNvbnN0IGxhYmVsID0gc3ZnRWwoJ3RleHQnLCB7XG4gICAgICAgIGNsYXNzOiAnY2Ytbm9kZS1sYWJlbCcsXG4gICAgICAgIHg6IDEwLFxuICAgICAgICB5OiBzdGFydFksXG4gICAgICB9KTtcbiAgICAgIGZvciAoY29uc3QgW2luZGV4LCB0ZXh0XSBvZiBsaW5lcy5lbnRyaWVzKCkpIHtcbiAgICAgICAgY29uc3Qgc3BhbiA9IHN2Z0VsKCd0c3BhbicsIHtcbiAgICAgICAgICB4OiAxMCxcbiAgICAgICAgICAuLi4oaW5kZXggPT09IDAgPyB7fSA6IHsgZHk6IGxpbmVIZWlnaHQgfSksXG4gICAgICAgIH0pO1xuICAgICAgICBzcGFuLnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgICAgbGFiZWwuYXBwZW5kQ2hpbGQoc3Bhbik7XG4gICAgICB9XG4gICAgICBncm91cC5hcHBlbmRDaGlsZChsYWJlbCk7XG5cbiAgICAgIGlmIChzaG93S2luZCkge1xuICAgICAgICBjb25zdCBraW5kID0gc3ZnRWwoJ3RleHQnLCB7XG4gICAgICAgICAgY2xhc3M6ICdjZi1ub2RlLWtpbmQnLFxuICAgICAgICAgIHg6IDEwLFxuICAgICAgICAgIHk6IG5vZGUucG9zaXRpb24uaGVpZ2h0IC0gOCxcbiAgICAgICAgfSk7XG4gICAgICAgIGtpbmQudGV4dENvbnRlbnQgPSBub2RlLmV4dGVybmFsID8gYCR7bm9kZS5raW5kfSBcdTAwQjcgZXh0ZXJuYWxgIDogbm9kZS5raW5kO1xuICAgICAgICBncm91cC5hcHBlbmRDaGlsZChraW5kKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgYmFkZ2VUZXh0ID1cbiAgICAgICAgQXJyYXkuaXNBcnJheShub2RlLmJhZGdlcykgJiYgbm9kZS5iYWRnZXMubGVuZ3RoID4gMFxuICAgICAgICAgID8gbm9kZS5iYWRnZXMuam9pbignIFx1MDBCNyAnKVxuICAgICAgICAgIDogbm9kZS5iYWRnZSB8fCAobm9kZS5zdGF0dXMgIT09ICdyZXNvbHZlZCcgPyBub2RlLnN0YXR1cyA6ICcnKTtcbiAgICAgIGlmIChiYWRnZVRleHQpIHtcbiAgICAgICAgY29uc3QgYmFkZ2UgPSBzdmdFbCgndGV4dCcsIHtcbiAgICAgICAgICBjbGFzczogJ2NmLW5vZGUtYmFkZ2UnLFxuICAgICAgICAgIHg6IG5vZGUucG9zaXRpb24ud2lkdGggLSA4LFxuICAgICAgICAgIHk6IDEzLFxuICAgICAgICAgICd0ZXh0LWFuY2hvcic6ICdlbmQnLFxuICAgICAgICB9KTtcbiAgICAgICAgYmFkZ2UudGV4dENvbnRlbnQgPSB0cnVuY2F0ZShiYWRnZVRleHQsIDI0KTtcbiAgICAgICAgZ3JvdXAuYXBwZW5kQ2hpbGQoYmFkZ2UpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB0aXRsZSA9IHN2Z0VsKCd0aXRsZScpO1xuICAgICAgY29uc3QgY2FsbFRleHQgPVxuICAgICAgICBBcnJheS5pc0FycmF5KG5vZGUuY2FsbHMpICYmIG5vZGUuY2FsbHMubGVuZ3RoID4gMFxuICAgICAgICAgID8gYFxcbmNhbGxzOiAke25vZGUuY2FsbHMubWFwKChjYWxsKSA9PiBgJHtjYWxsLmxhYmVsfSAoJHtjYWxsLnN0YXR1c30pYCkuam9pbignLCAnKX1gXG4gICAgICAgICAgOiAnJztcbiAgICAgIHRpdGxlLnRleHRDb250ZW50ID0gYCR7bm9kZS5raW5kfSAke25vZGUubGFiZWx9XFxuc3RhdHVzOiAke25vZGUuc3RhdHVzfSR7XG4gICAgICAgIG5vZGUucmFuZ2UgPyBgXFxubGluZXMgJHtub2RlLnJhbmdlLnN0YXJ0TGluZSArIDF9LSR7bm9kZS5yYW5nZS5lbmRMaW5lICsgMX1gIDogJydcbiAgICAgIH0ke25vZGUucmVhc29uQ29kZSA/IGBcXG5yZWFzb246ICR7bm9kZS5yZWFzb25Db2RlfWAgOiAnJ30ke2NhbGxUZXh0fWA7XG4gICAgICBncm91cC5hcHBlbmRDaGlsZCh0aXRsZSk7XG5cbiAgICAgIGdyb3VwLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBzZWxlY3Qobm9kZS5pZCk7XG4gICAgICB9KTtcbiAgICAgIGdyb3VwLmFkZEV2ZW50TGlzdGVuZXIoJ2RibGNsaWNrJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBzZWxlY3Qobm9kZS5pZCk7XG4gICAgICAgIG9wdGlvbnMub25OYXZpZ2F0ZT8uKG5vZGUuaWQsIG5vZGUsICdwb2ludGVyJyk7XG4gICAgICB9KTtcbiAgICAgIGdyb3VwLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJlbnRlcicsIChldmVudCkgPT4ge1xuICAgICAgICBvcHRpb25zLm9uUHJldmlld0VudGVyPy4obm9kZS5pZCwgbm9kZSwgeyB4OiBldmVudC5jbGllbnRYLCB5OiBldmVudC5jbGllbnRZIH0pO1xuICAgICAgfSk7XG4gICAgICBncm91cC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybW92ZScsIChldmVudCkgPT4ge1xuICAgICAgICBvcHRpb25zLm9uUHJldmlld01vdmU/Lih7IHg6IGV2ZW50LmNsaWVudFgsIHk6IGV2ZW50LmNsaWVudFkgfSk7XG4gICAgICB9KTtcbiAgICAgIGdyb3VwLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJsZWF2ZScsICgpID0+IHtcbiAgICAgICAgb3B0aW9ucy5vblByZXZpZXdMZWF2ZT8uKG5vZGUuaWQpO1xuICAgICAgfSk7XG4gICAgICBncm91cC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChldmVudC5rZXkgPT09ICdFbnRlcicpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHNlbGVjdChub2RlLmlkKTtcbiAgICAgICAgICBvcHRpb25zLm9uTmF2aWdhdGU/Lihub2RlLmlkLCBub2RlLCAna2V5Ym9hcmQnKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gJyAnIHx8IGV2ZW50LmtleSA9PT0gJ1NwYWNlYmFyJykge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgaWYgKGV2ZW50LnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICBvcHRpb25zLm9uUHJldmlld0tleT8uKG5vZGUuaWQsIG5vZGUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxlY3Qobm9kZS5pZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXZlbnQua2V5ID09PSAnaCcgfHwgZXZlbnQua2V5ID09PSAnSCcpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIG9wdGlvbnMub25QcmV2aWV3S2V5Py4obm9kZS5pZCwgbm9kZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB2aWV3cG9ydC5hcHBlbmRDaGlsZChncm91cCk7XG4gICAgICBub2RlRWxlbWVudHMuc2V0KG5vZGUuaWQsIGdyb3VwKTtcbiAgICB9XG5cbiAgICB6b29tVG9GaXQoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1vdmVTZWxlY3Rpb24oZGlyZWN0aW9uKSB7XG4gICAgaWYgKCFkdG8gfHwgZHRvLm5vZGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBjdXJyZW50ID0gc2VsZWN0ZWRJZCA/IGR0by5ub2Rlcy5maW5kKChub2RlKSA9PiBub2RlLmlkID09PSBzZWxlY3RlZElkKSA6IG51bGw7XG4gICAgaWYgKCFjdXJyZW50KSB7XG4gICAgICBjb25zdCBmaXJzdCA9IGR0by5ub2Rlc1swXTtcbiAgICAgIHNlbGVjdChmaXJzdC5pZCk7XG4gICAgICBub2RlRWxlbWVudHMuZ2V0KGZpcnN0LmlkKT8uZm9jdXMoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgb3JpZ2luID0ge1xuICAgICAgeDogY3VycmVudC5wb3NpdGlvbi54ICsgY3VycmVudC5wb3NpdGlvbi53aWR0aCAvIDIsXG4gICAgICB5OiBjdXJyZW50LnBvc2l0aW9uLnkgKyBjdXJyZW50LnBvc2l0aW9uLmhlaWdodCAvIDIsXG4gICAgfTtcblxuICAgIGxldCBiZXN0ID0gbnVsbDtcbiAgICBsZXQgYmVzdFNjb3JlID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuICAgIGZvciAoY29uc3QgY2FuZGlkYXRlIG9mIGR0by5ub2Rlcykge1xuICAgICAgaWYgKGNhbmRpZGF0ZS5pZCA9PT0gY3VycmVudC5pZCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBvaW50ID0ge1xuICAgICAgICB4OiBjYW5kaWRhdGUucG9zaXRpb24ueCArIGNhbmRpZGF0ZS5wb3NpdGlvbi53aWR0aCAvIDIsXG4gICAgICAgIHk6IGNhbmRpZGF0ZS5wb3NpdGlvbi55ICsgY2FuZGlkYXRlLnBvc2l0aW9uLmhlaWdodCAvIDIsXG4gICAgICB9O1xuICAgICAgY29uc3QgZHggPSBwb2ludC54IC0gb3JpZ2luLng7XG4gICAgICBjb25zdCBkeSA9IHBvaW50LnkgLSBvcmlnaW4ueTtcbiAgICAgIGNvbnN0IGZvcndhcmQgPVxuICAgICAgICAoZGlyZWN0aW9uID09PSAnQXJyb3dSaWdodCcgJiYgZHggPiA4KSB8fFxuICAgICAgICAoZGlyZWN0aW9uID09PSAnQXJyb3dMZWZ0JyAmJiBkeCA8IC04KSB8fFxuICAgICAgICAoZGlyZWN0aW9uID09PSAnQXJyb3dEb3duJyAmJiBkeSA+IDgpIHx8XG4gICAgICAgIChkaXJlY3Rpb24gPT09ICdBcnJvd1VwJyAmJiBkeSA8IC04KTtcbiAgICAgIGlmICghZm9yd2FyZCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHByaW1hcnkgPVxuICAgICAgICBkaXJlY3Rpb24gPT09ICdBcnJvd1JpZ2h0JyB8fCBkaXJlY3Rpb24gPT09ICdBcnJvd0xlZnQnID8gTWF0aC5hYnMoZHgpIDogTWF0aC5hYnMoZHkpO1xuICAgICAgY29uc3Qgc2Vjb25kYXJ5ID1cbiAgICAgICAgZGlyZWN0aW9uID09PSAnQXJyb3dSaWdodCcgfHwgZGlyZWN0aW9uID09PSAnQXJyb3dMZWZ0JyA/IE1hdGguYWJzKGR5KSA6IE1hdGguYWJzKGR4KTtcbiAgICAgIGNvbnN0IHNjb3JlID0gcHJpbWFyeSArIHNlY29uZGFyeSAqIDIuMjtcbiAgICAgIGlmIChzY29yZSA8IGJlc3RTY29yZSkge1xuICAgICAgICBiZXN0U2NvcmUgPSBzY29yZTtcbiAgICAgICAgYmVzdCA9IGNhbmRpZGF0ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGJlc3QpIHtcbiAgICAgIHNlbGVjdChiZXN0LmlkKTtcbiAgICAgIG5vZGVFbGVtZW50cy5nZXQoYmVzdC5pZCk/LmZvY3VzKCk7XG4gICAgfVxuICB9XG5cbiAgc3ZnLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgJ3doZWVsJyxcbiAgICAoZXZlbnQpID0+IHtcbiAgICAgIGlmICghZHRvKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBjb25zdCBib3VuZHMgPSBzdmcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBjb25zdCBwb2ludGVyWCA9IGV2ZW50LmNsaWVudFggLSBib3VuZHMubGVmdDtcbiAgICAgIGNvbnN0IHBvaW50ZXJZID0gZXZlbnQuY2xpZW50WSAtIGJvdW5kcy50b3A7XG4gICAgICBjb25zdCBmYWN0b3IgPSBldmVudC5kZWx0YVkgPCAwID8gMS4xMiA6IDEgLyAxLjEyO1xuICAgICAgY29uc3QgbmV4dFNjYWxlID0gTWF0aC5taW4oMy41LCBNYXRoLm1heCgwLjEyLCBzY2FsZSAqIGZhY3RvcikpO1xuICAgICAgY29uc3QgcmF0aW8gPSBuZXh0U2NhbGUgLyBzY2FsZTtcbiAgICAgIHRyYW5zbGF0ZVggPSBwb2ludGVyWCAtIChwb2ludGVyWCAtIHRyYW5zbGF0ZVgpICogcmF0aW87XG4gICAgICB0cmFuc2xhdGVZID0gcG9pbnRlclkgLSAocG9pbnRlclkgLSB0cmFuc2xhdGVZKSAqIHJhdGlvO1xuICAgICAgc2NhbGUgPSBuZXh0U2NhbGU7XG4gICAgICBhcHBseVRyYW5zZm9ybSgpO1xuICAgIH0sXG4gICAgeyBwYXNzaXZlOiBmYWxzZSB9LFxuICApO1xuXG4gIHN2Zy5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIChldmVudCkgPT4ge1xuICAgIGlmIChldmVudC5idXR0b24gIT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhZ2dpbmcgPSB0cnVlO1xuICAgIGRyYWdTdGFydCA9IHsgeDogZXZlbnQuY2xpZW50WCwgeTogZXZlbnQuY2xpZW50WSwgdHg6IHRyYW5zbGF0ZVgsIHR5OiB0cmFuc2xhdGVZIH07XG4gICAgc3ZnLnNldFBvaW50ZXJDYXB0dXJlKGV2ZW50LnBvaW50ZXJJZCk7XG4gIH0pO1xuICBzdmcuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcm1vdmUnLCAoZXZlbnQpID0+IHtcbiAgICBpZiAoIWRyYWdnaW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyYW5zbGF0ZVggPSBkcmFnU3RhcnQudHggKyAoZXZlbnQuY2xpZW50WCAtIGRyYWdTdGFydC54KTtcbiAgICB0cmFuc2xhdGVZID0gZHJhZ1N0YXJ0LnR5ICsgKGV2ZW50LmNsaWVudFkgLSBkcmFnU3RhcnQueSk7XG4gICAgYXBwbHlUcmFuc2Zvcm0oKTtcbiAgfSk7XG4gIGNvbnN0IGVuZERyYWcgPSAoZXZlbnQpID0+IHtcbiAgICBkcmFnZ2luZyA9IGZhbHNlO1xuICAgIGlmIChzdmcuaGFzUG9pbnRlckNhcHR1cmUoZXZlbnQucG9pbnRlcklkKSkge1xuICAgICAgc3ZnLnJlbGVhc2VQb2ludGVyQ2FwdHVyZShldmVudC5wb2ludGVySWQpO1xuICAgIH1cbiAgfTtcbiAgc3ZnLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJ1cCcsIGVuZERyYWcpO1xuICBzdmcuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmNhbmNlbCcsIGVuZERyYWcpO1xuXG4gIHN2Zy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICBpZiAoc2VsZWN0ZWRJZCkge1xuICAgICAgc2VsZWN0KG51bGwpO1xuICAgIH1cbiAgfSk7XG5cbiAgc3ZnLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcbiAgICBpZiAoZXZlbnQua2V5LnN0YXJ0c1dpdGgoJ0Fycm93JykpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBtb3ZlU2VsZWN0aW9uKGV2ZW50LmtleSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChldmVudC5rZXkgPT09ICcrJyB8fCBldmVudC5rZXkgPT09ICc9Jykge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHNjYWxlID0gTWF0aC5taW4oMy41LCBzY2FsZSAqIDEuMTUpO1xuICAgICAgYXBwbHlUcmFuc2Zvcm0oKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGV2ZW50LmtleSA9PT0gJy0nKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgc2NhbGUgPSBNYXRoLm1heCgwLjEyLCBzY2FsZSAvIDEuMTUpO1xuICAgICAgYXBwbHlUcmFuc2Zvcm0oKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGV2ZW50LmtleSA9PT0gJzAnKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgem9vbVRvRml0KCk7XG4gICAgfVxuICB9KTtcblxuICAvKipcbiAgICogRWRpdG9yLWRyaXZlbiBoaWdobGlnaHQuIERpc3RpbmN0IGZyb20gc2VsZWN0aW9uIHNvIHR5cGluZyBpbiB0aGUgZWRpdG9yXG4gICAqIG5ldmVyIHN0ZWFscyBncmFwaCBmb2N1cyBvciByZXdyaXRlcyB0aGUgZGV0YWlsIHBhbmVsLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBub2RlSWRzXG4gICAqL1xuICBmdW5jdGlvbiBoaWdobGlnaHQobm9kZUlkcykge1xuICAgIGNvbnN0IHdhbnRlZCA9IG5ldyBTZXQoQXJyYXkuaXNBcnJheShub2RlSWRzKSA/IG5vZGVJZHMgOiBbXSk7XG4gICAgZm9yIChjb25zdCBbaWQsIGVsZW1lbnRdIG9mIG5vZGVFbGVtZW50cykge1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKCdpcy1zeW5jZWQnLCB3YW50ZWQuaGFzKGlkKSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgWywgZWxlbWVudF0gb2YgZWRnZUVsZW1lbnRzKSB7XG4gICAgICBjb25zdCBhY3RpdmUgPVxuICAgICAgICB3YW50ZWQuc2l6ZSA+IDAgJiZcbiAgICAgICAgKHdhbnRlZC5oYXMoZWxlbWVudC5kYXRhc2V0LmZyb20gPz8gJycpIHx8IHdhbnRlZC5oYXMoZWxlbWVudC5kYXRhc2V0LnRvID8/ICcnKSk7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoJ2lzLXN5bmNlZCcsIGFjdGl2ZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IG5vZGVJZHNcbiAgICovXG4gIGZ1bmN0aW9uIG1hcmtTdGFsZShub2RlSWRzKSB7XG4gICAgY29uc3Qgd2FudGVkID0gbmV3IFNldChBcnJheS5pc0FycmF5KG5vZGVJZHMpID8gbm9kZUlkcyA6IFtdKTtcbiAgICBmb3IgKGNvbnN0IFtpZCwgZWxlbWVudF0gb2Ygbm9kZUVsZW1lbnRzKSB7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoJ2lzLXN0YWxlJywgd2FudGVkLmhhcyhpZCkpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGZvY3VzU2VsZWN0aW9uKCkge1xuICAgIGlmIChzZWxlY3RlZElkKSB7XG4gICAgICBub2RlRWxlbWVudHMuZ2V0KHNlbGVjdGVkSWQpPy5mb2N1cygpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcmVuZGVyLFxuICAgIHNlbGVjdCxcbiAgICBoaWdobGlnaHQsXG4gICAgbWFya1N0YWxlLFxuICAgIGZvY3VzU2VsZWN0aW9uLFxuICAgIHpvb21Ub0ZpdCxcbiAgICBkZXN0cm95KCkge1xuICAgICAgY2xlYXIoKTtcbiAgICAgIGR0byA9IG51bGw7XG4gICAgfSxcbiAgfTtcbn1cbiIsICIvKipcbiAqIFNvdXJjZSByYW5nZSB2YWxpZGF0aW9uIGFuZCBzbGljaW5nLlxuICpcbiAqIFRoZXNlIGhlbHBlcnMgYXJlIHB1cmUgYW5kIGhvc3QtaW5kZXBlbmRlbnQuIFRoZSBleHRlbnNpb24gaG9zdCBzdXBwbGllcyB0aGVcbiAqIHJlYWwgZG9jdW1lbnQgdGV4dCBhbmQgdmVyc2lvbjsgdGhlIHdlYnZpZXcgYW5kIHRoZSB0ZXN0cyB1c2UgdGhlIHNhbWUgcmFuZ2VcbiAqIHJ1bGVzLiBOb3RoaW5nIGhlcmUgcmVhZHMgYSBmaWxlIG9yIGFzc2VtYmxlcyBzb3VyY2UgZnJvbSBhbiBBU1QuXG4gKi9cblxuLyoqIERlZmF1bHQgc2xpY2UgbGltaXRzIGZyb20gdGhlIFBoYXNlIDUgY29udHJhY3QuICovXG5leHBvcnQgY29uc3QgU09VUkNFX0xJTUlUUyA9IE9iamVjdC5mcmVlemUoe1xuICBtYXhMaW5lczogMTIsXG4gIG1pbkxpbmVzOiA0LFxuICBtYXhMaW5lc0xpbWl0OiA0MCxcbiAgbWF4Qnl0ZXM6IDY1XzUzNixcbiAgbWF4UmFuZ2VzOiAyXzAwMCxcbn0pO1xuXG5jb25zdCBJTlRFR0VSX0ZJRUxEUyA9IFsnc3RhcnRMaW5lJywgJ3N0YXJ0Q29sdW1uJywgJ2VuZExpbmUnLCAnZW5kQ29sdW1uJ107XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHJldHVybnMge3ZhbHVlIGlzIFJlY29yZDxzdHJpbmcsIHVua25vd24+fVxuICovXG5mdW5jdGlvbiBpc1JlY29yZCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCAmJiAhQXJyYXkuaXNBcnJheSh2YWx1ZSk7XG59XG5cbi8qKlxuICogVmFsaWRhdGUgdGhlIHdpcmUgc2hhcGUgb2YgYSByYW5nZSByZWZlcmVuY2UuIFRoaXMgZG9lcyBub3Qga25vdyB0aGVcbiAqIGRvY3VtZW50OyBgcmFuZ2VXaXRoaW5Eb2N1bWVudGAgZG9lcyB0aGF0LlxuICpcbiAqIEBwYXJhbSB7dW5rbm93bn0gcmF3XG4gKiBAcmV0dXJucyB7e29rOiB0cnVlLCB2YWx1ZTogUmVjb3JkPHN0cmluZywgYW55Pn0gfCB7b2s6IGZhbHNlLCBjb2RlOiAnRV9SQU5HRScsIGlzc3Vlczogc3RyaW5nW119fVxuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplUmFuZ2VSZWYocmF3KSB7XG4gIGlmICghaXNSZWNvcmQocmF3KSkge1xuICAgIHJldHVybiB7IG9rOiBmYWxzZSwgY29kZTogJ0VfUkFOR0UnLCBpc3N1ZXM6IFsncmFuZ2UgbXVzdCBiZSBhbiBvYmplY3QuJ10gfTtcbiAgfVxuICAvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuICBjb25zdCBpc3N1ZXMgPSBbXTtcbiAgaWYgKHR5cGVvZiByYXcuZmlsZUlkICE9PSAnc3RyaW5nJyB8fCByYXcuZmlsZUlkLmxlbmd0aCA9PT0gMCB8fCByYXcuZmlsZUlkLmxlbmd0aCA+IDUxMikge1xuICAgIGlzc3Vlcy5wdXNoKCdmaWxlSWQgbXVzdCBiZSBhIG5vbi1lbXB0eSBzdHJpbmcuJyk7XG4gIH1cbiAgZm9yIChjb25zdCBrZXkgb2YgSU5URUdFUl9GSUVMRFMpIHtcbiAgICBjb25zdCB2YWx1ZSA9IHJhd1trZXldO1xuICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcih2YWx1ZSkgfHwgTnVtYmVyKHZhbHVlKSA8IDApIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGAke2tleX0gbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyLmApO1xuICAgIH1cbiAgfVxuICBpZiAoaXNzdWVzLmxlbmd0aCA9PT0gMCkge1xuICAgIGNvbnN0IHN0YXJ0TGluZSA9IE51bWJlcihyYXcuc3RhcnRMaW5lKTtcbiAgICBjb25zdCBzdGFydENvbHVtbiA9IE51bWJlcihyYXcuc3RhcnRDb2x1bW4pO1xuICAgIGNvbnN0IGVuZExpbmUgPSBOdW1iZXIocmF3LmVuZExpbmUpO1xuICAgIGNvbnN0IGVuZENvbHVtbiA9IE51bWJlcihyYXcuZW5kQ29sdW1uKTtcbiAgICBpZiAoc3RhcnRMaW5lID4gZW5kTGluZSB8fCAoc3RhcnRMaW5lID09PSBlbmRMaW5lICYmIHN0YXJ0Q29sdW1uID4gZW5kQ29sdW1uKSkge1xuICAgICAgaXNzdWVzLnB1c2goJ3JhbmdlIHN0YXJ0IG11c3Qgbm90IGNvbWUgYWZ0ZXIgcmFuZ2UgZW5kLicpO1xuICAgIH1cbiAgfVxuICBmb3IgKGNvbnN0IGtleSBvZiBbJ3N0YXJ0T2Zmc2V0JywgJ2VuZE9mZnNldCddKSB7XG4gICAgaWYgKHJhd1trZXldICE9PSB1bmRlZmluZWQgJiYgKCFOdW1iZXIuaXNJbnRlZ2VyKHJhd1trZXldKSB8fCBOdW1iZXIocmF3W2tleV0pIDwgMCkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGAke2tleX0gbXVzdCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyIHdoZW4gcHJlc2VudC5gKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzc3Vlcy5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBjb2RlOiAnRV9SQU5HRScsIGlzc3VlcyB9O1xuICB9XG4gIHJldHVybiB7XG4gICAgb2s6IHRydWUsXG4gICAgdmFsdWU6IHtcbiAgICAgIGZpbGVJZDogU3RyaW5nKHJhdy5maWxlSWQpLFxuICAgICAgc3RhcnRMaW5lOiBOdW1iZXIocmF3LnN0YXJ0TGluZSksXG4gICAgICBzdGFydENvbHVtbjogTnVtYmVyKHJhdy5zdGFydENvbHVtbiksXG4gICAgICBlbmRMaW5lOiBOdW1iZXIocmF3LmVuZExpbmUpLFxuICAgICAgZW5kQ29sdW1uOiBOdW1iZXIocmF3LmVuZENvbHVtbiksXG4gICAgICAuLi4oTnVtYmVyLmlzSW50ZWdlcihyYXcuc3RhcnRPZmZzZXQpID8geyBzdGFydE9mZnNldDogTnVtYmVyKHJhdy5zdGFydE9mZnNldCkgfSA6IHt9KSxcbiAgICAgIC4uLihOdW1iZXIuaXNJbnRlZ2VyKHJhdy5lbmRPZmZzZXQpID8geyBlbmRPZmZzZXQ6IE51bWJlcihyYXcuZW5kT2Zmc2V0KSB9IDoge30pLFxuICAgIH0sXG4gIH07XG59XG5cbi8qKlxuICogT2Zmc2V0cyBvZiB0aGUgZmlyc3QgY2hhcmFjdGVyIG9mIGV2ZXJ5IGxpbmUuIEhhbmRsZXMgQ1JMRiwgQ1IgYW5kIExGLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gKiBAcmV0dXJucyB7bnVtYmVyW119XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsaW5lU3RhcnRzKHRleHQpIHtcbiAgY29uc3Qgc3RhcnRzID0gWzBdO1xuICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgdGV4dC5sZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICBjb25zdCBjb2RlID0gdGV4dC5jaGFyQ29kZUF0KGluZGV4KTtcbiAgICBpZiAoY29kZSA9PT0gMTApIHtcbiAgICAgIHN0YXJ0cy5wdXNoKGluZGV4ICsgMSk7XG4gICAgfSBlbHNlIGlmIChjb2RlID09PSAxMykge1xuICAgICAgaWYgKHRleHQuY2hhckNvZGVBdChpbmRleCArIDEpID09PSAxMCkge1xuICAgICAgICBpbmRleCArPSAxO1xuICAgICAgfVxuICAgICAgc3RhcnRzLnB1c2goaW5kZXggKyAxKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0YXJ0cztcbn1cblxuLyoqXG4gKiBEb2N1bWVudCBmYWN0cyB0aGUgdmFsaWRhdG9yIG5lZWRzLiBgbGluZUxlbmd0aGAgZXhjbHVkZXMgdGhlIGxpbmUgZW5kaW5nLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gKiBAcmV0dXJucyB7e2xpbmVDb3VudDogbnVtYmVyLCBsaW5lTGVuZ3RoOiAobGluZTogbnVtYmVyKSA9PiBudW1iZXIsIHN0YXJ0czogbnVtYmVyW119fVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRG9jdW1lbnRWaWV3KHRleHQpIHtcbiAgY29uc3Qgc3RhcnRzID0gbGluZVN0YXJ0cyh0ZXh0KTtcbiAgcmV0dXJuIHtcbiAgICBsaW5lQ291bnQ6IHN0YXJ0cy5sZW5ndGgsXG4gICAgc3RhcnRzLFxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBsaW5lXG4gICAgICogQHJldHVybnMge251bWJlcn1cbiAgICAgKi9cbiAgICBsaW5lTGVuZ3RoKGxpbmUpIHtcbiAgICAgIGlmIChsaW5lIDwgMCB8fCBsaW5lID49IHN0YXJ0cy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgY29uc3Qgc3RhcnQgPSBzdGFydHNbbGluZV07XG4gICAgICBsZXQgZW5kID0gbGluZSArIDEgPCBzdGFydHMubGVuZ3RoID8gc3RhcnRzW2xpbmUgKyAxXSA6IHRleHQubGVuZ3RoO1xuICAgICAgaWYgKGVuZCA+IHN0YXJ0ICYmIHRleHQuY2hhckNvZGVBdChlbmQgLSAxKSA9PT0gMTApIHtcbiAgICAgICAgZW5kIC09IDE7XG4gICAgICB9XG4gICAgICBpZiAoZW5kID4gc3RhcnQgJiYgdGV4dC5jaGFyQ29kZUF0KGVuZCAtIDEpID09PSAxMykge1xuICAgICAgICBlbmQgLT0gMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlbmQgLSBzdGFydDtcbiAgICB9LFxuICB9O1xufVxuXG4vKipcbiAqIFZhbGlkYXRlIGEgbm9ybWFsaXplZCByYW5nZSBhZ2FpbnN0IGEgZG9jdW1lbnQuIE5vdGhpbmcgaXMgY2xhbXBlZDogYW5cbiAqIG91dC1vZi1ib3VuZHMgcmFuZ2UgaXMgcmVqZWN0ZWQgc28gYSBwcmV2aWV3IGNhbiBuZXZlciBzaWxlbnRseSBzaG93IHRoZVxuICogd3JvbmcgdGV4dC5cbiAqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IHJhbmdlXG4gKiBAcGFyYW0ge3tsaW5lQ291bnQ6IG51bWJlciwgbGluZUxlbmd0aDogKGxpbmU6IG51bWJlcikgPT4gbnVtYmVyfX0gZG9jdW1lbnRcbiAqIEByZXR1cm5zIHt7b2s6IHRydWV9IHwge29rOiBmYWxzZSwgY29kZTogJ0VfUkFOR0UnLCBpc3N1ZXM6IHN0cmluZ1tdfX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJhbmdlV2l0aGluRG9jdW1lbnQocmFuZ2UsIGRvY3VtZW50KSB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVSYW5nZVJlZihyYW5nZSk7XG4gIGlmICghbm9ybWFsaXplZC5vaykge1xuICAgIHJldHVybiBub3JtYWxpemVkO1xuICB9XG4gIGNvbnN0IHZhbHVlID0gbm9ybWFsaXplZC52YWx1ZTtcbiAgLyoqIEB0eXBlIHtzdHJpbmdbXX0gKi9cbiAgY29uc3QgaXNzdWVzID0gW107XG4gIGNvbnN0IGxpbmVDb3VudCA9IE51bWJlcihkb2N1bWVudD8ubGluZUNvdW50KTtcbiAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGxpbmVDb3VudCkgfHwgbGluZUNvdW50IDwgMSkge1xuICAgIHJldHVybiB7IG9rOiBmYWxzZSwgY29kZTogJ0VfUkFOR0UnLCBpc3N1ZXM6IFsnZG9jdW1lbnQgbGluZSBjb3VudCBpcyB1bmtub3duLiddIH07XG4gIH1cbiAgaWYgKHZhbHVlLmVuZExpbmUgPj0gbGluZUNvdW50KSB7XG4gICAgaXNzdWVzLnB1c2goYGVuZExpbmUgJHt2YWx1ZS5lbmRMaW5lfSBpcyBiZXlvbmQgdGhlIGRvY3VtZW50ICgke2xpbmVDb3VudH0gbGluZXMpLmApO1xuICB9XG4gIGlmIChpc3N1ZXMubGVuZ3RoID09PSAwICYmIHR5cGVvZiBkb2N1bWVudC5saW5lTGVuZ3RoID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc3Qgc3RhcnRMZW5ndGggPSBkb2N1bWVudC5saW5lTGVuZ3RoKHZhbHVlLnN0YXJ0TGluZSk7XG4gICAgY29uc3QgZW5kTGVuZ3RoID0gZG9jdW1lbnQubGluZUxlbmd0aCh2YWx1ZS5lbmRMaW5lKTtcbiAgICBpZiAoc3RhcnRMZW5ndGggPCAwIHx8IHZhbHVlLnN0YXJ0Q29sdW1uID4gc3RhcnRMZW5ndGgpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKFxuICAgICAgICBgc3RhcnRDb2x1bW4gJHt2YWx1ZS5zdGFydENvbHVtbn0gaXMgYmV5b25kIGxpbmUgJHt2YWx1ZS5zdGFydExpbmV9ICgke3N0YXJ0TGVuZ3RofSBjb2x1bW5zKS5gLFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKGVuZExlbmd0aCA8IDAgfHwgdmFsdWUuZW5kQ29sdW1uID4gZW5kTGVuZ3RoKSB7XG4gICAgICBpc3N1ZXMucHVzaChcbiAgICAgICAgYGVuZENvbHVtbiAke3ZhbHVlLmVuZENvbHVtbn0gaXMgYmV5b25kIGxpbmUgJHt2YWx1ZS5lbmRMaW5lfSAoJHtlbmRMZW5ndGh9IGNvbHVtbnMpLmAsXG4gICAgICApO1xuICAgIH1cbiAgfVxuICByZXR1cm4gaXNzdWVzLmxlbmd0aCA+IDAgPyB7IG9rOiBmYWxzZSwgY29kZTogJ0VfUkFOR0UnLCBpc3N1ZXMgfSA6IHsgb2s6IHRydWUgfTtcbn1cblxuLyoqXG4gKiBFeGFjdCBzdWJzdHJpbmcgZm9yIGEgcmFuZ2UuIEtlZXBzIHRoZSBvcmlnaW5hbCBsaW5lIGVuZGluZ3MgYW5kIGluZGVudGF0aW9uLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IHJhbmdlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2xpY2VUZXh0KHRleHQsIHJhbmdlKSB7XG4gIGNvbnN0IHN0YXJ0cyA9IGxpbmVTdGFydHModGV4dCk7XG4gIGNvbnN0IHN0YXJ0TGluZSA9IE51bWJlcihyYW5nZT8uc3RhcnRMaW5lKTtcbiAgY29uc3QgZW5kTGluZSA9IE51bWJlcihyYW5nZT8uZW5kTGluZSk7XG4gIGNvbnN0IHN0YXJ0ID0gKHN0YXJ0c1tzdGFydExpbmVdID8/IDApICsgTnVtYmVyKHJhbmdlPy5zdGFydENvbHVtbiA/PyAwKTtcbiAgY29uc3QgZW5kID0gKHN0YXJ0c1tlbmRMaW5lXSA/PyBzdGFydHNbc3RhcnRzLmxlbmd0aCAtIDFdKSArIE51bWJlcihyYW5nZT8uZW5kQ29sdW1uID8/IDApO1xuICByZXR1cm4gdGV4dC5zbGljZShzdGFydCwgTWF0aC5tYXgoc3RhcnQsIGVuZCkpO1xufVxuXG4vKipcbiAqIFRyaW0gYSBzbGljZSBmcm9tIHRoZSBlbmQgdG8gYG1heExpbmVzYC4gTmV2ZXIgcmV0dXJucyBtb3JlIGxpbmVzIHRoYW4gYXNrZWRcbiAqIGZvciBhbmQgcmVwb3J0cyB0aGUgdHJpbS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dFxuICogQHBhcmFtIHtudW1iZXJ9IG1heExpbmVzXG4gKiBAcmV0dXJucyB7e3RleHQ6IHN0cmluZywgdHJ1bmNhdGVkOiBib29sZWFuLCBsaW5lQ291bnQ6IG51bWJlcn19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cnVuY2F0ZVNvdXJjZSh0ZXh0LCBtYXhMaW5lcykge1xuICBjb25zdCBsaW1pdCA9IE1hdGgubWluKFxuICAgIFNPVVJDRV9MSU1JVFMubWF4TGluZXNMaW1pdCxcbiAgICBNYXRoLm1heChTT1VSQ0VfTElNSVRTLm1pbkxpbmVzLCBOdW1iZXIuaXNJbnRlZ2VyKG1heExpbmVzKSA/IG1heExpbmVzIDogU09VUkNFX0xJTUlUUy5tYXhMaW5lcyksXG4gICk7XG4gIGNvbnN0IHN0YXJ0cyA9IGxpbmVTdGFydHModGV4dCk7XG4gIGNvbnN0IGxpbmVDb3VudCA9IHN0YXJ0cy5sZW5ndGg7XG4gIGlmIChsaW5lQ291bnQgPD0gbGltaXQpIHtcbiAgICByZXR1cm4geyB0ZXh0LCB0cnVuY2F0ZWQ6IGZhbHNlLCBsaW5lQ291bnQgfTtcbiAgfVxuICAvLyBLZWVwIGV4YWN0bHkgYGxpbWl0YCBsaW5lcyBieSBkcm9wcGluZyB0aGUgdHJhaWxpbmcgbGluZSBlbmRpbmc7IG90aGVyd2lzZSBhXG4gIC8vIGNvbnN1bWVyIHRoYXQgc3BsaXRzIG9uIG5ld2xpbmVzIHdvdWxkIHJlbmRlciBvbmUgZW1wdHkgZXh0cmEgbGluZS5cbiAgbGV0IGNsaXBwZWQgPSB0ZXh0LnNsaWNlKDAsIHN0YXJ0c1tsaW1pdF0pO1xuICBpZiAoY2xpcHBlZC5lbmRzV2l0aCgnXFxyXFxuJykpIHtcbiAgICBjbGlwcGVkID0gY2xpcHBlZC5zbGljZSgwLCAtMik7XG4gIH0gZWxzZSBpZiAoY2xpcHBlZC5lbmRzV2l0aCgnXFxuJykgfHwgY2xpcHBlZC5lbmRzV2l0aCgnXFxyJykpIHtcbiAgICBjbGlwcGVkID0gY2xpcHBlZC5zbGljZSgwLCAtMSk7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICB0ZXh0OiBjbGlwcGVkLFxuICAgIHRydW5jYXRlZDogdHJ1ZSxcbiAgICBsaW5lQ291bnQ6IGxpbWl0LFxuICB9O1xufVxuXG4vKipcbiAqIFRydWUgd2hlbiB0aGUgcG9zaXRpb24gaXMgaW5zaWRlIHRoZSByYW5nZSwgaW5jbHVkaW5nIGl0cyBlbmQuXG4gKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSByYW5nZVxuICogQHBhcmFtIHt7bGluZTogbnVtYmVyLCBjb2x1bW46IG51bWJlcn19IHBvc2l0aW9uXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnRhaW5zUG9zaXRpb24ocmFuZ2UsIHBvc2l0aW9uKSB7XG4gIGNvbnN0IGxpbmUgPSBOdW1iZXIocG9zaXRpb24/LmxpbmUpO1xuICBjb25zdCBjb2x1bW4gPSBOdW1iZXIocG9zaXRpb24/LmNvbHVtbik7XG4gIGlmICghTnVtYmVyLmlzSW50ZWdlcihsaW5lKSB8fCAhTnVtYmVyLmlzSW50ZWdlcihjb2x1bW4pKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChsaW5lIDwgcmFuZ2Uuc3RhcnRMaW5lIHx8IGxpbmUgPiByYW5nZS5lbmRMaW5lKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChsaW5lID09PSByYW5nZS5zdGFydExpbmUgJiYgY29sdW1uIDwgcmFuZ2Uuc3RhcnRDb2x1bW4pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGxpbmUgPT09IHJhbmdlLmVuZExpbmUgJiYgY29sdW1uID4gcmFuZ2UuZW5kQ29sdW1uKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gb3V0ZXJcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gaW5uZXJcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbnNSYW5nZShvdXRlciwgaW5uZXIpIHtcbiAgaWYgKCFvdXRlciB8fCAhaW5uZXIgfHwgb3V0ZXIuZmlsZUlkICE9PSBpbm5lci5maWxlSWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIChcbiAgICBjb250YWluc1Bvc2l0aW9uKG91dGVyLCB7IGxpbmU6IGlubmVyLnN0YXJ0TGluZSwgY29sdW1uOiBpbm5lci5zdGFydENvbHVtbiB9KSAmJlxuICAgIGNvbnRhaW5zUG9zaXRpb24ob3V0ZXIsIHsgbGluZTogaW5uZXIuZW5kTGluZSwgY29sdW1uOiBpbm5lci5lbmRDb2x1bW4gfSlcbiAgKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IGxlZnRcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gcmlnaHRcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmFuZ2VzT3ZlcmxhcChsZWZ0LCByaWdodCkge1xuICBpZiAoIWxlZnQgfHwgIXJpZ2h0IHx8IGxlZnQuZmlsZUlkICE9PSByaWdodC5maWxlSWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIChcbiAgICBjb250YWluc1Bvc2l0aW9uKGxlZnQsIHsgbGluZTogcmlnaHQuc3RhcnRMaW5lLCBjb2x1bW46IHJpZ2h0LnN0YXJ0Q29sdW1uIH0pIHx8XG4gICAgY29udGFpbnNQb3NpdGlvbihsZWZ0LCB7IGxpbmU6IHJpZ2h0LmVuZExpbmUsIGNvbHVtbjogcmlnaHQuZW5kQ29sdW1uIH0pIHx8XG4gICAgY29udGFpbnNQb3NpdGlvbihyaWdodCwgeyBsaW5lOiBsZWZ0LnN0YXJ0TGluZSwgY29sdW1uOiBsZWZ0LnN0YXJ0Q29sdW1uIH0pXG4gICk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSByYW5nZVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJhbmdlS2V5KHJhbmdlKSB7XG4gIHJldHVybiBgJHtyYW5nZS5maWxlSWR9OiR7cmFuZ2Uuc3RhcnRMaW5lfToke3JhbmdlLnN0YXJ0Q29sdW1ufS0ke3JhbmdlLmVuZExpbmV9OiR7cmFuZ2UuZW5kQ29sdW1ufWA7XG59XG5cbi8qKlxuICogSW50ZWdyaXR5IGlzIGEgY29tcGFyaXNvbiBvZiB0d28gZnVsbC1kb2N1bWVudCBoYXNoZXMuIENvbnNlcnZhdGl2ZTogYVxuICogbWlzbWF0Y2ggbWFya3MgdGhlIHdob2xlIGZpbGUgc3RhbGUsIGJlY2F1c2UgYW4gZXh0ZXJuYWwgcmV3cml0ZSBnaXZlcyB1cyBub1xuICogdHJ1c3R3b3J0aHkgZWRpdCBkZWx0YS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3x1bmRlZmluZWR9IGFuYWx5c2lzSGFzaFxuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBjdXJyZW50SGFzaFxuICogQHJldHVybnMgeydleGFjdCd8J3N0YWxlJ3wnbWlzc2luZyd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlZ3JpdHlGb3IoYW5hbHlzaXNIYXNoLCBjdXJyZW50SGFzaCkge1xuICBpZiAoIWFuYWx5c2lzSGFzaCB8fCAhY3VycmVudEhhc2gpIHtcbiAgICByZXR1cm4gJ21pc3NpbmcnO1xuICB9XG4gIHJldHVybiBhbmFseXNpc0hhc2ggPT09IGN1cnJlbnRIYXNoID8gJ2V4YWN0JyA6ICdzdGFsZSc7XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZU1heExpbmVzKHZhbHVlKSB7XG4gIGNvbnN0IGNhbmRpZGF0ZSA9IE51bWJlcih2YWx1ZSk7XG4gIGlmICghTnVtYmVyLmlzRmluaXRlKGNhbmRpZGF0ZSkpIHtcbiAgICByZXR1cm4gU09VUkNFX0xJTUlUUy5tYXhMaW5lcztcbiAgfVxuICByZXR1cm4gTWF0aC5taW4oXG4gICAgU09VUkNFX0xJTUlUUy5tYXhMaW5lc0xpbWl0LFxuICAgIE1hdGgubWF4KFNPVVJDRV9MSU1JVFMubWluTGluZXMsIE1hdGgudHJ1bmMoY2FuZGlkYXRlKSksXG4gICk7XG59XG4iLCAiLyoqXG4gKiBQcmV2aWV3IHByZXNlbnRhdGlvbiBtb2RlbC5cbiAqXG4gKiBQdXJlOiBnaXZlbiBhIGdyYXBoIG5vZGUgYW5kIGFuIG9wdGlvbmFsIHNvdXJjZSBzbGljZSwgZGVjaWRlIHdoYXQgdGhlIGNhcmRcbiAqIHNheXMuIFRoZSB3ZWJ2aWV3IHR1cm5zIHRoaXMgaW50byBET007IHRlc3RzIGFzc2VydCB0aGUgZGVjaXNpb25zIHdpdGhvdXQgYVxuICogYnJvd3Nlci4gU3ludGhldGljIGFuZCBzdGFsZSBub2RlcyBtdXN0IGV4cGxhaW4gdGhlbXNlbHZlcyBpbnN0ZWFkIG9mXG4gKiBzaG93aW5nIG1pc2xlYWRpbmcgc291cmNlLlxuICovXG5cbmltcG9ydCB7IFNPVVJDRV9MSU1JVFMsIHRydW5jYXRlU291cmNlIH0gZnJvbSAnLi9yYW5nZXMuanMnO1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFByZXZpZXdOb2RlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gaWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBraW5kXG4gKiBAcHJvcGVydHkge3N0cmluZ30gbGFiZWxcbiAqIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW2lzU3ludGhldGljXVxuICogQHByb3BlcnR5IHtSZWNvcmQ8c3RyaW5nLCBhbnk+fG51bGx9IFtyYW5nZV1cbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFByZXZpZXdTbGljZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IHRleHRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSByZWxhdGl2ZVBhdGhcbiAqIEBwcm9wZXJ0eSB7e3N0YXJ0TGluZTogbnVtYmVyLCBlbmRMaW5lOiBudW1iZXJ9fSBbbGluZXNdXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IFt0cnVuY2F0ZWRdXG4gKiBAcHJvcGVydHkgeydleGFjdCd8J3N0YWxlJ3wnbWlzc2luZyd9IFtpbnRlZ3JpdHldXG4gKiBAcHJvcGVydHkge251bWJlcn0gW2RvY3VtZW50VmVyc2lvbl1cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbY29udGVudEhhc2hdXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3JlYXNvbl1cbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7e25vZGU6IFByZXZpZXdOb2RlLCBzbGljZT86IFByZXZpZXdTbGljZXxudWxsLCBtYXhMaW5lcz86IG51bWJlcn19IGlucHV0XG4gKiBAcmV0dXJucyB7e1xuICogICB0aXRsZTogc3RyaW5nLFxuICogICBraW5kOiBzdHJpbmcsXG4gKiAgIGZpbGU6IHN0cmluZyxcbiAqICAgbGluZUxhYmVsOiBzdHJpbmcsXG4gKiAgIHRleHQ6IHN0cmluZyxcbiAqICAgdHJ1bmNhdGVkOiBib29sZWFuLFxuICogICBzeW50aGV0aWM6IGJvb2xlYW4sXG4gKiAgIHN0YWxlOiBib29sZWFuLFxuICogICBlbXB0eTogYm9vbGVhbixcbiAqICAgbWVzc2FnZTogc3RyaW5nLFxuICogICBpbnRlZ3JpdHk6ICdleGFjdCd8J3N0YWxlJ3wnbWlzc2luZycsXG4gKiAgIGRvY3VtZW50VmVyc2lvbjogbnVtYmVyfG51bGxcbiAqIH19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZFByZXZpZXdNb2RlbCh7IG5vZGUsIHNsaWNlID0gbnVsbCwgbWF4TGluZXMgPSBTT1VSQ0VfTElNSVRTLm1heExpbmVzIH0pIHtcbiAgY29uc3QgcmFuZ2UgPSBub2RlPy5yYW5nZSA/PyBudWxsO1xuICBjb25zdCB0aXRsZSA9IFN0cmluZyhub2RlPy5sYWJlbCA/PyAnc291cmNlJyk7XG4gIGNvbnN0IGxpbmVMYWJlbCA9IHJhbmdlXG4gICAgPyBgJHtOdW1iZXIocmFuZ2Uuc3RhcnRMaW5lKSArIDF9XHUyMDEzJHtOdW1iZXIocmFuZ2UuZW5kTGluZSkgKyAxfWBcbiAgICA6ICdubyBsaW5lIHJhbmdlJztcbiAgY29uc3Qgc3ludGhldGljID0gbm9kZT8uaXNTeW50aGV0aWMgPT09IHRydWUgfHwgIXJhbmdlO1xuXG4gIGlmIChzeW50aGV0aWMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGl0bGUsXG4gICAgICBraW5kOiBTdHJpbmcobm9kZT8ua2luZCA/PyAnbm9kZScpLFxuICAgICAgZmlsZTogcmFuZ2U/LmZpbGVJZCA/PyAnJyxcbiAgICAgIGxpbmVMYWJlbCxcbiAgICAgIHRleHQ6ICcnLFxuICAgICAgdHJ1bmNhdGVkOiBmYWxzZSxcbiAgICAgIHN5bnRoZXRpYzogdHJ1ZSxcbiAgICAgIHN0YWxlOiBmYWxzZSxcbiAgICAgIGVtcHR5OiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6IHJhbmdlXG4gICAgICAgID8gYFN5bnRoZXRpYyAke25vZGU/LmtpbmQgPz8gJ25vZGUnfSBcdTIwMTQgZnVuY3Rpb24gc3RydWN0dXJlLCBub3QgYSBzb3VyY2Ugc3RhdGVtZW50LiBBbmNob3JlZCBhdCBsaW5lICR7TnVtYmVyKHJhbmdlLnN0YXJ0TGluZSkgKyAxfS5gXG4gICAgICAgIDogYFN5bnRoZXRpYyAke25vZGU/LmtpbmQgPz8gJ25vZGUnfSBcdTIwMTQgdGhpcyBub2RlIGhhcyBubyBzb3VyY2UgcmFuZ2UuYCxcbiAgICAgIGludGVncml0eTogJ2V4YWN0JyxcbiAgICAgIGRvY3VtZW50VmVyc2lvbjogbnVsbCxcbiAgICB9O1xuICB9XG5cbiAgaWYgKCFzbGljZSkge1xuICAgIHJldHVybiB7XG4gICAgICB0aXRsZSxcbiAgICAgIGtpbmQ6IFN0cmluZyhub2RlPy5raW5kID8/ICdub2RlJyksXG4gICAgICBmaWxlOiByYW5nZT8uZmlsZUlkID8/ICcnLFxuICAgICAgbGluZUxhYmVsLFxuICAgICAgdGV4dDogJycsXG4gICAgICB0cnVuY2F0ZWQ6IGZhbHNlLFxuICAgICAgc3ludGhldGljOiBmYWxzZSxcbiAgICAgIHN0YWxlOiBmYWxzZSxcbiAgICAgIGVtcHR5OiB0cnVlLFxuICAgICAgbWVzc2FnZTogJ1NvdXJjZSBpcyBub3QgYXZhaWxhYmxlIGZvciB0aGlzIHJhbmdlLicsXG4gICAgICBpbnRlZ3JpdHk6ICdtaXNzaW5nJyxcbiAgICAgIGRvY3VtZW50VmVyc2lvbjogbnVsbCxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgdHJpbW1lZCA9IHRydW5jYXRlU291cmNlKFN0cmluZyhzbGljZS50ZXh0ID8/ICcnKSwgbWF4TGluZXMpO1xuICBjb25zdCBpbnRlZ3JpdHkgPSBzbGljZS5pbnRlZ3JpdHkgPz8gJ2V4YWN0JztcbiAgY29uc3Qgc3RhbGUgPSBpbnRlZ3JpdHkgPT09ICdzdGFsZSc7XG4gIGNvbnN0IGVtcHR5ID0gdHJpbW1lZC50ZXh0LnRyaW0oKS5sZW5ndGggPT09IDA7XG4gIGxldCBtZXNzYWdlID0gJyc7XG4gIGlmIChzdGFsZSkge1xuICAgIG1lc3NhZ2UgPVxuICAgICAgJ1RoZSBkb2N1bWVudCBjaGFuZ2VkIHNpbmNlIHRoaXMgYW5hbHlzaXMuIFRoZSB0ZXh0IGJlbG93IGlzIGN1cnJlbnQsIGJ1dCB0aGUgZ3JhcGggbWF5IG5vdCBtYXRjaCBpdC4gUmUtYW5hbHl6ZSBiZWZvcmUgdHJ1c3RpbmcgdGhlIHJhbmdlLic7XG4gIH0gZWxzZSBpZiAoaW50ZWdyaXR5ID09PSAnbWlzc2luZycpIHtcbiAgICBtZXNzYWdlID0gc2xpY2UucmVhc29uIHx8ICdUaGUgYW5hbHl6ZWQgZG9jdW1lbnQgaXMgbm8gbG9uZ2VyIGF2YWlsYWJsZS4nO1xuICB9IGVsc2UgaWYgKGVtcHR5KSB7XG4gICAgbWVzc2FnZSA9ICdUaGlzIHJhbmdlIGhhcyBubyBzb3VyY2UgY29udGVudC4nO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB0aXRsZSxcbiAgICBraW5kOiBTdHJpbmcobm9kZT8ua2luZCA/PyAnbm9kZScpLFxuICAgIGZpbGU6IFN0cmluZyhzbGljZS5yZWxhdGl2ZVBhdGggPz8gcmFuZ2U/LmZpbGVJZCA/PyAnJyksXG4gICAgbGluZUxhYmVsLFxuICAgIHRleHQ6IHRyaW1tZWQudGV4dCxcbiAgICB0cnVuY2F0ZWQ6IEJvb2xlYW4odHJpbW1lZC50cnVuY2F0ZWQgfHwgc2xpY2UudHJ1bmNhdGVkKSxcbiAgICBzeW50aGV0aWM6IGZhbHNlLFxuICAgIHN0YWxlLFxuICAgIGVtcHR5LFxuICAgIG1lc3NhZ2UsXG4gICAgaW50ZWdyaXR5LFxuICAgIGRvY3VtZW50VmVyc2lvbjogTnVtYmVyLmlzSW50ZWdlcihzbGljZS5kb2N1bWVudFZlcnNpb24pID8gc2xpY2UuZG9jdW1lbnRWZXJzaW9uIDogbnVsbCxcbiAgfTtcbn1cbiIsICIvKipcbiAqIFByZXZpZXcgYW5kIG5hdmlnYXRpb24gc2V0dGluZ3MuXG4gKlxuICogVGhlIGRlZmF1bHRzIGhlcmUgYXJlIHRoZSBjb250cmFjdC4gYHBhY2thZ2UuanNvbmAgZGVjbGFyZXMgdGhlIHNhbWUga2V5cyBhbmRcbiAqIGRlZmF1bHRzOyBgdGVzdHMvdW5pdC9zb3VyY2VTZXR0aW5ncy50ZXN0LmpzYCBrZWVwcyB0aGUgbWFuaWZlc3QgYW5kIHRoaXNcbiAqIG1vZHVsZSBpbiBzeW5jLlxuICovXG5cbmV4cG9ydCBjb25zdCBQUkVWSUVXX0RFRkFVTFRTID0gT2JqZWN0LmZyZWV6ZSh7XG4gIGVuYWJsZWQ6IHRydWUsXG4gIGRlbGF5TXM6IDMwMCxcbiAgbWF4TGluZXM6IDEyLFxuICBzeW50YXhIaWdobGlnaHRpbmc6IHRydWUsXG4gIGNsaWNrVG9OYXZpZ2F0ZTogdHJ1ZSxcbiAgcGluQnlEZWZhdWx0OiBmYWxzZSxcbiAgb3BlbkluUHJldmlld1RhYjogZmFsc2UsXG59KTtcblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcGFyYW0ge251bWJlcn0gZmFsbGJhY2tcbiAqIEBwYXJhbSB7bnVtYmVyfSBtaW5cbiAqIEBwYXJhbSB7bnVtYmVyfSBtYXhcbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIGNsYW1wSW50ZWdlcih2YWx1ZSwgZmFsbGJhY2ssIG1pbiwgbWF4KSB7XG4gIGNvbnN0IGNhbmRpZGF0ZSA9IE51bWJlcih2YWx1ZSk7XG4gIGlmICghTnVtYmVyLmlzRmluaXRlKGNhbmRpZGF0ZSkpIHtcbiAgICByZXR1cm4gZmFsbGJhY2s7XG4gIH1cbiAgcmV0dXJuIE1hdGgubWluKG1heCwgTWF0aC5tYXgobWluLCBNYXRoLnRydW5jKGNhbmRpZGF0ZSkpKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGZhbGxiYWNrXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gYXNCb29sZWFuKHZhbHVlLCBmYWxsYmFjaykge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbicgPyB2YWx1ZSA6IGZhbGxiYWNrO1xufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSBzZXR0aW5ncyBmcm9tIGFueSBzb3VyY2UgKFZTIENvZGUgY29uZmlndXJhdGlvbiwgcHJvdG9jb2wgcGF5bG9hZCxcbiAqIHRlc3RzKS4gVW5rbm93biBzaGFwZXMgZmFsbCBiYWNrIHRvIHRoZSBkb2N1bWVudGVkIGRlZmF1bHRzOyBub3RoaW5nIHRocm93cy5cbiAqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBbcmF3XVxuICogQHJldHVybnMge3tlbmFibGVkOiBib29sZWFuLCBkZWxheU1zOiBudW1iZXIsIG1heExpbmVzOiBudW1iZXIsIHN5bnRheEhpZ2hsaWdodGluZzogYm9vbGVhbiwgY2xpY2tUb05hdmlnYXRlOiBib29sZWFuLCBwaW5CeURlZmF1bHQ6IGJvb2xlYW4sIG9wZW5JblByZXZpZXdUYWI6IGJvb2xlYW59fVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZVByZXZpZXdTZXR0aW5ncyhyYXcgPSB7fSkge1xuICBjb25zdCBzb3VyY2UgPSByYXcgJiYgdHlwZW9mIHJhdyA9PT0gJ29iamVjdCcgPyByYXcgOiB7fTtcbiAgcmV0dXJuIHtcbiAgICBlbmFibGVkOiBhc0Jvb2xlYW4oc291cmNlLmVuYWJsZWQsIFBSRVZJRVdfREVGQVVMVFMuZW5hYmxlZCksXG4gICAgZGVsYXlNczogY2xhbXBJbnRlZ2VyKHNvdXJjZS5kZWxheU1zLCBQUkVWSUVXX0RFRkFVTFRTLmRlbGF5TXMsIDAsIDJfMDAwKSxcbiAgICBtYXhMaW5lczogY2xhbXBJbnRlZ2VyKHNvdXJjZS5tYXhMaW5lcywgUFJFVklFV19ERUZBVUxUUy5tYXhMaW5lcywgNCwgNDApLFxuICAgIHN5bnRheEhpZ2hsaWdodGluZzogYXNCb29sZWFuKHNvdXJjZS5zeW50YXhIaWdobGlnaHRpbmcsIFBSRVZJRVdfREVGQVVMVFMuc3ludGF4SGlnaGxpZ2h0aW5nKSxcbiAgICBjbGlja1RvTmF2aWdhdGU6IGFzQm9vbGVhbihzb3VyY2UuY2xpY2tUb05hdmlnYXRlLCBQUkVWSUVXX0RFRkFVTFRTLmNsaWNrVG9OYXZpZ2F0ZSksXG4gICAgcGluQnlEZWZhdWx0OiBhc0Jvb2xlYW4oc291cmNlLnBpbkJ5RGVmYXVsdCwgUFJFVklFV19ERUZBVUxUUy5waW5CeURlZmF1bHQpLFxuICAgIG9wZW5JblByZXZpZXdUYWI6IGFzQm9vbGVhbihzb3VyY2Uub3BlbkluUHJldmlld1RhYiwgUFJFVklFV19ERUZBVUxUUy5vcGVuSW5QcmV2aWV3VGFiKSxcbiAgfTtcbn1cblxuLyoqXG4gKiBUcnVlIHdoZW4gYSBjb25maWd1cmF0aW9uLWNoYW5nZSBldmVudCB0b3VjaGVzIGEga2V5IHRoaXMgbW9kdWxlIG93bnMuXG4gKlxuICogQHBhcmFtIHt7YWZmZWN0c0NvbmZpZ3VyYXRpb24/OiAoc2VjdGlvbjogc3RyaW5nKSA9PiBib29sZWFufX0gZXZlbnRcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0dGluZ3NDaGFuZ2VkKGV2ZW50KSB7XG4gIHJldHVybiAoXG4gICAgQm9vbGVhbihldmVudD8uYWZmZWN0c0NvbmZpZ3VyYXRpb24/LignY29kZWZsb3cucHJldmlldycpKSB8fFxuICAgIEJvb2xlYW4oZXZlbnQ/LmFmZmVjdHNDb25maWd1cmF0aW9uPy4oJ2NvZGVmbG93Lm5hdmlnYXRpb24nKSlcbiAgKTtcbn1cbiIsICIvKipcbiAqIEV4cGxhbmF0aW9uIHNldHRpbmdzIGRlZmF1bHRzIGFuZCBub3JtYWxpemF0aW9uLlxuICpcbiAqIGBwYWNrYWdlLmpzb25gIGRlY2xhcmVzIHRoZSBzYW1lIGRlZmF1bHRzOyBgdGVzdHMvdW5pdC9leHBsYW5hdGlvblNldHRpbmdzLnRlc3QuanNgXG4gKiBlbmZvcmNlcyAxOjEgcGFyaXR5LlxuICovXG5cbmV4cG9ydCBjb25zdCBFWFBMQU5BVElPTl9ERUZBVUxUUyA9IE9iamVjdC5mcmVlemUoe1xuICBkZWZhdWx0RGVwdGg6IDIsXG4gIHNob3dFdmlkZW5jZTogdHJ1ZSxcbiAgaW5jbHVkZUxpbWl0YXRpb25zOiB0cnVlLFxufSk7XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHJldHVybnMgezF8MnwzfDR9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGFtcEV4cGxhbmF0aW9uRGVwdGgodmFsdWUpIHtcbiAgY29uc3QgbnVtID0gTnVtYmVyKHZhbHVlKTtcbiAgaWYgKCFOdW1iZXIuaXNGaW5pdGUobnVtKSkge1xuICAgIHJldHVybiBFWFBMQU5BVElPTl9ERUZBVUxUUy5kZWZhdWx0RGVwdGg7XG4gIH1cbiAgY29uc3QgY2xhbXBlZCA9IE1hdGgubWluKDQsIE1hdGgubWF4KDEsIE1hdGgudHJ1bmMobnVtKSkpO1xuICByZXR1cm4gLyoqIEB0eXBlIHsxfDJ8M3w0fSAqLyAoY2xhbXBlZCk7XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHBhcmFtIHtib29sZWFufSBmYWxsYmFja1xuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGFzQm9vbGVhbih2YWx1ZSwgZmFsbGJhY2spIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nID8gdmFsdWUgOiBmYWxsYmFjaztcbn1cblxuLyoqXG4gKiBOb3JtYWxpemUgZXhwbGFuYXRpb24gc2V0dGluZ3MgZnJvbSBWUyBDb2RlIGNvbmZpZ3VyYXRpb24sIHByb3RvY29sIHBheWxvYWRzLFxuICogb3IgdGVzdCBpbnB1dHMgd2l0aG91dCB0aHJvd2luZy5cbiAqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBbcmF3XVxuICogQHJldHVybnMge3tkZWZhdWx0RGVwdGg6IDF8MnwzfDQsIHNob3dFdmlkZW5jZTogYm9vbGVhbiwgaW5jbHVkZUxpbWl0YXRpb25zOiBib29sZWFufX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVFeHBsYW5hdGlvblNldHRpbmdzKHJhdyA9IHt9KSB7XG4gIGNvbnN0IHNvdXJjZSA9IHJhdyAmJiB0eXBlb2YgcmF3ID09PSAnb2JqZWN0JyA/IHJhdyA6IHt9O1xuICByZXR1cm4ge1xuICAgIGRlZmF1bHREZXB0aDogY2xhbXBFeHBsYW5hdGlvbkRlcHRoKHNvdXJjZS5kZWZhdWx0RGVwdGgpLFxuICAgIHNob3dFdmlkZW5jZTogYXNCb29sZWFuKHNvdXJjZS5zaG93RXZpZGVuY2UsIEVYUExBTkFUSU9OX0RFRkFVTFRTLnNob3dFdmlkZW5jZSksXG4gICAgaW5jbHVkZUxpbWl0YXRpb25zOiBhc0Jvb2xlYW4oXG4gICAgICBzb3VyY2UuaW5jbHVkZUxpbWl0YXRpb25zLFxuICAgICAgRVhQTEFOQVRJT05fREVGQVVMVFMuaW5jbHVkZUxpbWl0YXRpb25zLFxuICAgICksXG4gIH07XG59XG5cbi8qKlxuICogQHBhcmFtIHt7YWZmZWN0c0NvbmZpZ3VyYXRpb24/OiAoc2VjdGlvbjogc3RyaW5nKSA9PiBib29sZWFufX0gZXZlbnRcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXhwbGFuYXRpb25TZXR0aW5nc0NoYW5nZWQoZXZlbnQpIHtcbiAgcmV0dXJuIEJvb2xlYW4oZXZlbnQ/LmFmZmVjdHNDb25maWd1cmF0aW9uPy4oJ2NvZGVmbG93LmV4cGxhbmF0aW9uJykpO1xufVxuIiwgIi8qKlxuICogSG92ZXItaW50ZW50IHN0YXRlIG1hY2hpbmUuXG4gKlxuICogRHdlbGwgdGltZSBwbHVzIHBvaW50ZXIgc3RhYmlsaXR5IHByZXZlbnRzIHByZXZpZXcgZmxpY2tlciB3aGlsZSBzY2FubmluZyBhXG4gKiBncmFwaC4gVGhlIGNvbnRyb2xsZXIgb3ducyB0aW1lcnMgYnV0IG5vIERPTSwgc28gdGhlIGJlaGF2aW91ciBpcyB0ZXN0YWJsZVxuICogd2l0aCBhIGZha2UgY2xvY2suXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7e3g6IG51bWJlciwgeTogbnVtYmVyfX0gUG9pbnRcbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7e1xuICogICBkZWxheU1zPzogbnVtYmVyLFxuICogICBtb3ZlVG9sZXJhbmNlPzogbnVtYmVyLFxuICogICBncmFjZU1zPzogbnVtYmVyLFxuICogICBlbmFibGVkPzogYm9vbGVhbixcbiAqICAgc2V0VGltZW91dD86IChoYW5kbGVyOiBGdW5jdGlvbiwgbXM6IG51bWJlcikgPT4gdW5rbm93bixcbiAqICAgY2xlYXJUaW1lb3V0PzogKGhhbmRsZTogdW5rbm93bikgPT4gdm9pZCxcbiAqICAgb25TaG93PzogKG5vZGVJZDogc3RyaW5nLCBhbmNob3I6IFBvaW50KSA9PiB2b2lkLFxuICogICBvbkhpZGU/OiAobm9kZUlkOiBzdHJpbmd8bnVsbCkgPT4gdm9pZCxcbiAqIH19IFtvcHRpb25zXVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUHJldmlld0NvbnRyb2xsZXIob3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IHNjaGVkdWxlID0gb3B0aW9ucy5zZXRUaW1lb3V0ID8/ICgoaGFuZGxlciwgbXMpID0+IHNldFRpbWVvdXQoaGFuZGxlciwgbXMpKTtcbiAgY29uc3QgY2FuY2VsID0gb3B0aW9ucy5jbGVhclRpbWVvdXQgPz8gKChoYW5kbGUpID0+IGNsZWFyVGltZW91dChoYW5kbGUpKTtcblxuICBsZXQgZGVsYXlNcyA9IE1hdGgubWF4KDAsIE51bWJlcihvcHRpb25zLmRlbGF5TXMgPz8gMzAwKSk7XG4gIGxldCBtb3ZlVG9sZXJhbmNlID0gTWF0aC5tYXgoMCwgTnVtYmVyKG9wdGlvbnMubW92ZVRvbGVyYW5jZSA/PyAxMikpO1xuICBjb25zdCBncmFjZU1zID0gTWF0aC5tYXgoMCwgTnVtYmVyKG9wdGlvbnMuZ3JhY2VNcyA/PyAxNTApKTtcbiAgbGV0IGVuYWJsZWQgPSBvcHRpb25zLmVuYWJsZWQgIT09IGZhbHNlO1xuICBsZXQgcGluQnlEZWZhdWx0ID0gQm9vbGVhbihvcHRpb25zLnBpbkJ5RGVmYXVsdCk7XG5cbiAgbGV0IGN1cnJlbnRJZCA9IG51bGw7XG4gIGxldCBhbmNob3IgPSB7IHg6IDAsIHk6IDAgfTtcbiAgbGV0IGR3ZWxsVGltZXIgPSBudWxsO1xuICBsZXQgZ3JhY2VUaW1lciA9IG51bGw7XG4gIGxldCBwb2ludGVySW5zaWRlID0gZmFsc2U7XG4gIGxldCBwaW5uZWQgPSBmYWxzZTtcbiAgbGV0IHZpc2libGUgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBjbGVhckR3ZWxsKCkge1xuICAgIGlmIChkd2VsbFRpbWVyICE9PSBudWxsKSB7XG4gICAgICBjYW5jZWwoZHdlbGxUaW1lcik7XG4gICAgICBkd2VsbFRpbWVyID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhckdyYWNlKCkge1xuICAgIGlmIChncmFjZVRpbWVyICE9PSBudWxsKSB7XG4gICAgICBjYW5jZWwoZ3JhY2VUaW1lcik7XG4gICAgICBncmFjZVRpbWVyID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzaG93KCkge1xuICAgIGlmICghZW5hYmxlZCB8fCBjdXJyZW50SWQgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmlzaWJsZSA9IHRydWU7XG4gICAgaWYgKHBpbkJ5RGVmYXVsdCkge1xuICAgICAgcGlubmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgb3B0aW9ucy5vblNob3c/LihjdXJyZW50SWQsIHsgLi4uYW5jaG9yIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gaGlkZSgpIHtcbiAgICBjbGVhckR3ZWxsKCk7XG4gICAgY2xlYXJHcmFjZSgpO1xuICAgIGlmICghdmlzaWJsZSAmJiBjdXJyZW50SWQgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgcHJldmlvdXMgPSBjdXJyZW50SWQ7XG4gICAgdmlzaWJsZSA9IGZhbHNlO1xuICAgIGN1cnJlbnRJZCA9IG51bGw7XG4gICAgcGlubmVkID0gZmFsc2U7XG4gICAgb3B0aW9ucy5vbkhpZGU/LihwcmV2aW91cyk7XG4gIH1cblxuICBmdW5jdGlvbiBhcm1Ed2VsbCgpIHtcbiAgICBjbGVhckR3ZWxsKCk7XG4gICAgaWYgKCFlbmFibGVkIHx8IGN1cnJlbnRJZCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkd2VsbFRpbWVyID0gc2NoZWR1bGUoKCkgPT4ge1xuICAgICAgZHdlbGxUaW1lciA9IG51bGw7XG4gICAgICBzaG93KCk7XG4gICAgfSwgZGVsYXlNcyk7XG4gIH1cblxuICBmdW5jdGlvbiBhcm1HcmFjZSgpIHtcbiAgICBpZiAocGlubmVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNsZWFyR3JhY2UoKTtcbiAgICBncmFjZVRpbWVyID0gc2NoZWR1bGUoKCkgPT4ge1xuICAgICAgZ3JhY2VUaW1lciA9IG51bGw7XG4gICAgICBoaWRlKCk7XG4gICAgfSwgZ3JhY2VNcyk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWRcbiAgICAgKiBAcGFyYW0ge1BvaW50fSBwb2ludFxuICAgICAqL1xuICAgIHBvaW50ZXJFbnRlcihub2RlSWQsIHBvaW50KSB7XG4gICAgICBpZiAodHlwZW9mIG5vZGVJZCAhPT0gJ3N0cmluZycgfHwgbm9kZUlkLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBwb2ludGVySW5zaWRlID0gdHJ1ZTtcbiAgICAgIGNsZWFyR3JhY2UoKTtcbiAgICAgIGlmICh2aXNpYmxlICYmIGN1cnJlbnRJZCA9PT0gbm9kZUlkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICh2aXNpYmxlKSB7XG4gICAgICAgIG9wdGlvbnMub25IaWRlPy4oY3VycmVudElkKTtcbiAgICAgICAgdmlzaWJsZSA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgY3VycmVudElkID0gbm9kZUlkO1xuICAgICAgYW5jaG9yID0geyB4OiBOdW1iZXIocG9pbnQ/LnggPz8gMCksIHk6IE51bWJlcihwb2ludD8ueSA/PyAwKSB9O1xuICAgICAgcGlubmVkID0gZmFsc2U7XG4gICAgICBhcm1Ed2VsbCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBNb3ZlbWVudCBsYXJnZXIgdGhhbiB0aGUgdG9sZXJhbmNlIHJlc3RhcnRzIHRoZSBkd2VsbCB0aW1lci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7UG9pbnR9IHBvaW50XG4gICAgICovXG4gICAgcG9pbnRlck1vdmUocG9pbnQpIHtcbiAgICAgIGlmIChjdXJyZW50SWQgPT09IG51bGwgfHwgdmlzaWJsZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjb25zdCB4ID0gTnVtYmVyKHBvaW50Py54ID8/IDApO1xuICAgICAgY29uc3QgeSA9IE51bWJlcihwb2ludD8ueSA/PyAwKTtcbiAgICAgIGNvbnN0IGR4ID0geCAtIGFuY2hvci54O1xuICAgICAgY29uc3QgZHkgPSB5IC0gYW5jaG9yLnk7XG4gICAgICBpZiAoTWF0aC5oeXBvdChkeCwgZHkpID4gbW92ZVRvbGVyYW5jZSkge1xuICAgICAgICBhbmNob3IgPSB7IHgsIHkgfTtcbiAgICAgICAgYXJtRHdlbGwoKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqIFBvaW50ZXIgbGVmdCB0aGUgbm9kZTogZ2l2ZSB0aGUgdXNlciB0aW1lIHRvIHJlYWNoIHRoZSBjYXJkLiAqL1xuICAgIHBvaW50ZXJMZWF2ZSgpIHtcbiAgICAgIHBvaW50ZXJJbnNpZGUgPSBmYWxzZTtcbiAgICAgIGNsZWFyRHdlbGwoKTtcbiAgICAgIGlmICghdmlzaWJsZSkge1xuICAgICAgICBjdXJyZW50SWQgPSBudWxsO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBhcm1HcmFjZSgpO1xuICAgIH0sXG5cbiAgICAvKiogUG9pbnRlciBlbnRlcmVkIHRoZSBjYXJkOyBjYW5jZWwgdGhlIGhpZGUuICovXG4gICAgcG9pbnRlckVudGVyQ2FyZCgpIHtcbiAgICAgIHBvaW50ZXJJbnNpZGUgPSB0cnVlO1xuICAgICAgY2xlYXJHcmFjZSgpO1xuICAgIH0sXG5cbiAgICBwb2ludGVyTGVhdmVDYXJkKCkge1xuICAgICAgcG9pbnRlckluc2lkZSA9IGZhbHNlO1xuICAgICAgaWYgKHZpc2libGUpIHtcbiAgICAgICAgYXJtR3JhY2UoKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgdG9nZ2xlUGluKCkge1xuICAgICAgcGlubmVkID0gIXBpbm5lZDtcbiAgICAgIGlmIChwaW5uZWQpIHtcbiAgICAgICAgY2xlYXJHcmFjZSgpO1xuICAgICAgfSBlbHNlIGlmICghcG9pbnRlckluc2lkZSkge1xuICAgICAgICBhcm1HcmFjZSgpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHBpbm5lZDtcbiAgICB9LFxuXG4gICAgLyoqIEBwYXJhbSB7Ym9vbGVhbn0gdmFsdWUgKi9cbiAgICBzZXRQaW5uZWQodmFsdWUpIHtcbiAgICAgIHBpbm5lZCA9IEJvb2xlYW4odmFsdWUpO1xuICAgICAgaWYgKHBpbm5lZCkge1xuICAgICAgICBjbGVhckdyYWNlKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGlubmVkO1xuICAgIH0sXG5cbiAgICAvKiogRXNjIGFsd2F5cyBleGl0cywgZXZlbiB3aGVuIHBpbm5lZC4gKi9cbiAgICBkaXNtaXNzKCkge1xuICAgICAgaGlkZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBMaXZlIHNldHRpbmdzIGNoYW5nZXMgbXVzdCBub3QgcmVxdWlyZSBhIHJlbG9hZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7e2RlbGF5TXM/OiBudW1iZXIsIGVuYWJsZWQ/OiBib29sZWFuLCBtb3ZlVG9sZXJhbmNlPzogbnVtYmVyLCBwaW5CeURlZmF1bHQ/OiBib29sZWFufX0gbmV4dFxuICAgICAqL1xuICAgIGNvbmZpZ3VyZShuZXh0ID0ge30pIHtcbiAgICAgIGlmIChuZXh0LmRlbGF5TXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBkZWxheU1zID0gTWF0aC5tYXgoMCwgTnVtYmVyKG5leHQuZGVsYXlNcykpO1xuICAgICAgfVxuICAgICAgaWYgKG5leHQubW92ZVRvbGVyYW5jZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG1vdmVUb2xlcmFuY2UgPSBNYXRoLm1heCgwLCBOdW1iZXIobmV4dC5tb3ZlVG9sZXJhbmNlKSk7XG4gICAgICB9XG4gICAgICBpZiAobmV4dC5waW5CeURlZmF1bHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBwaW5CeURlZmF1bHQgPSBCb29sZWFuKG5leHQucGluQnlEZWZhdWx0KTtcbiAgICAgIH1cbiAgICAgIGlmIChuZXh0LmVuYWJsZWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBlbmFibGVkID0gQm9vbGVhbihuZXh0LmVuYWJsZWQpO1xuICAgICAgICBpZiAoIWVuYWJsZWQpIHtcbiAgICAgICAgICBoaWRlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgaXNWaXNpYmxlOiAoKSA9PiB2aXNpYmxlLFxuICAgIGlzUGlubmVkOiAoKSA9PiBwaW5uZWQsXG4gICAgY3VycmVudElkOiAoKSA9PiBjdXJyZW50SWQsXG4gICAgZGVzdHJveSgpIHtcbiAgICAgIGNsZWFyRHdlbGwoKTtcbiAgICAgIGNsZWFyR3JhY2UoKTtcbiAgICAgIGN1cnJlbnRJZCA9IG51bGw7XG4gICAgICB2aXNpYmxlID0gZmFsc2U7XG4gICAgICBwaW5uZWQgPSBmYWxzZTtcbiAgICB9LFxuICB9O1xufVxuIiwgIi8vIGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvcGFja2FnZXMuaHRtbCNwYWNrYWdlc193cml0aW5nX2R1YWxfcGFja2FnZXNfd2hpbGVfYXZvaWRpbmdfb3JfbWluaW1pemluZ19oYXphcmRzXG5pbXBvcnQgSGlnaGxpZ2h0SlMgZnJvbSAnLi4vbGliL2NvcmUuanMnO1xuZXhwb3J0IHsgSGlnaGxpZ2h0SlMgfTtcbmV4cG9ydCBkZWZhdWx0IEhpZ2hsaWdodEpTO1xuIiwgIi8qXG5MYW5ndWFnZTogQysrXG5DYXRlZ29yeTogY29tbW9uLCBzeXN0ZW1cbldlYnNpdGU6IGh0dHBzOi8vaXNvY3BwLm9yZ1xuKi9cblxuLyoqIEB0eXBlIExhbmd1YWdlRm4gKi9cbmZ1bmN0aW9uIGNwcChobGpzKSB7XG4gIGNvbnN0IHJlZ2V4ID0gaGxqcy5yZWdleDtcbiAgLy8gYWRkZWQgZm9yIGhpc3RvcmljIHJlYXNvbnMgYmVjYXVzZSBgaGxqcy5DX0xJTkVfQ09NTUVOVF9NT0RFYCBkb2VzXG4gIC8vIG5vdCBpbmNsdWRlIHN1Y2ggc3VwcG9ydCBub3IgY2FuIHdlIGJlIHN1cmUgYWxsIHRoZSBncmFtbWFycyBkZXBlbmRpbmdcbiAgLy8gb24gaXQgd291bGQgZGVzaXJlIHRoaXMgYmVoYXZpb3JcbiAgY29uc3QgQ19MSU5FX0NPTU1FTlRfTU9ERSA9IGhsanMuQ09NTUVOVCgnLy8nLCAnJCcsIHsgY29udGFpbnM6IFsgeyBiZWdpbjogL1xcXFxcXG4vIH0gXSB9KTtcbiAgY29uc3QgREVDTFRZUEVfQVVUT19SRSA9ICdkZWNsdHlwZVxcXFwoYXV0b1xcXFwpJztcbiAgY29uc3QgTkFNRVNQQUNFX1JFID0gJ1thLXpBLVpfXVxcXFx3Kjo6JztcbiAgY29uc3QgVEVNUExBVEVfQVJHVU1FTlRfUkUgPSAnPFtePD5dKz4nO1xuICBjb25zdCBGVU5DVElPTl9UWVBFX1JFID0gJyg/IXN0cnVjdCkoJ1xuICAgICsgREVDTFRZUEVfQVVUT19SRSArICd8J1xuICAgICsgcmVnZXgub3B0aW9uYWwoTkFNRVNQQUNFX1JFKVxuICAgICsgJ1thLXpBLVpfXVxcXFx3KicgKyByZWdleC5vcHRpb25hbChURU1QTEFURV9BUkdVTUVOVF9SRSlcbiAgKyAnKSc7XG5cbiAgY29uc3QgQ1BQX1BSSU1JVElWRV9UWVBFUyA9IHtcbiAgICBjbGFzc05hbWU6ICd0eXBlJyxcbiAgICBiZWdpbjogJ1xcXFxiW2EtelxcXFxkX10qX3RcXFxcYidcbiAgfTtcblxuICAvLyBodHRwczovL2VuLmNwcHJlZmVyZW5jZS5jb20vdy9jcHAvbGFuZ3VhZ2UvZXNjYXBlXG4gIC8vIFxcXFwgXFx4IFxceEZGIFxcdTI4MzcgXFx1MDAzMjM3NDcgXFwzNzRcbiAgY29uc3QgQ0hBUkFDVEVSX0VTQ0FQRVMgPSAnXFxcXFxcXFwoeFswLTlBLUZhLWZdezJ9fHVbMC05QS1GYS1mXXs0LDh9fFswLTddezN9fFxcXFxTKSc7XG4gIGNvbnN0IFNUUklOR1MgPSB7XG4gICAgY2xhc3NOYW1lOiAnc3RyaW5nJyxcbiAgICB2YXJpYW50czogW1xuICAgICAge1xuICAgICAgICBiZWdpbjogJyh1OD98VXxMKT9cIicsXG4gICAgICAgIGVuZDogJ1wiJyxcbiAgICAgICAgaWxsZWdhbDogJ1xcXFxuJyxcbiAgICAgICAgY29udGFpbnM6IFsgaGxqcy5CQUNLU0xBU0hfRVNDQVBFIF1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGJlZ2luOiAnKHU4P3xVfEwpP1xcJygnICsgQ0hBUkFDVEVSX0VTQ0FQRVMgKyAnfC4pJyxcbiAgICAgICAgZW5kOiAnXFwnJyxcbiAgICAgICAgaWxsZWdhbDogJy4nXG4gICAgICB9LFxuICAgICAgaGxqcy5FTkRfU0FNRV9BU19CRUdJTih7XG4gICAgICAgIGJlZ2luOiAvKD86dTg/fFV8TCk/UlwiKFteKClcXFxcIF17MCwxNn0pXFwoLyxcbiAgICAgICAgZW5kOiAvXFwpKFteKClcXFxcIF17MCwxNn0pXCIvXG4gICAgICB9KVxuICAgIF1cbiAgfTtcblxuICBjb25zdCBOVU1CRVJTID0ge1xuICAgIGNsYXNzTmFtZTogJ251bWJlcicsXG4gICAgdmFyaWFudHM6IFtcbiAgICAgIC8vIEZsb2F0aW5nLXBvaW50IGxpdGVyYWwuXG4gICAgICB7IGJlZ2luOlxuICAgICAgICBcIlsrLV0/KD86XCIgLy8gTGVhZGluZyBzaWduLlxuICAgICAgICAgIC8vIERlY2ltYWwuXG4gICAgICAgICAgKyBcIig/OlwiXG4gICAgICAgICAgICArXCJbMC05XSg/Oic/WzAtOV0pKlxcXFwuKD86WzAtOV0oPzonP1swLTldKSopP1wiXG4gICAgICAgICAgICArIFwifFxcXFwuWzAtOV0oPzonP1swLTldKSpcIlxuICAgICAgICAgICsgXCIpKD86W0VlXVsrLV0/WzAtOV0oPzonP1swLTldKSopP1wiXG4gICAgICAgICAgKyBcInxbMC05XSg/Oic/WzAtOV0pKltFZV1bKy1dP1swLTldKD86Jz9bMC05XSkqXCJcbiAgICAgICAgICAvLyBIZXhhZGVjaW1hbC5cbiAgICAgICAgICArIFwifDBbWHhdKD86XCJcbiAgICAgICAgICAgICtcIlswLTlBLUZhLWZdKD86Jz9bMC05QS1GYS1mXSkqKD86XFxcXC4oPzpbMC05QS1GYS1mXSg/Oic/WzAtOUEtRmEtZl0pKik/KT9cIlxuICAgICAgICAgICAgKyBcInxcXFxcLlswLTlBLUZhLWZdKD86Jz9bMC05QS1GYS1mXSkqXCJcbiAgICAgICAgICArIFwiKVtQcF1bKy1dP1swLTldKD86Jz9bMC05XSkqXCJcbiAgICAgICAgKyBcIikoPzpcIiAvLyBMaXRlcmFsIHN1ZmZpeGVzLlxuICAgICAgICAgICsgXCJbRmZdKD86MTZ8MzJ8NjR8MTI4KT9cIlxuICAgICAgICAgICsgXCJ8KEJGfGJmKTE2XCJcbiAgICAgICAgICArIFwifFtMbF1cIlxuICAgICAgICAgICsgXCJ8XCIgLy8gTGl0ZXJhbCBzdWZmaXggaXMgb3B0aW9uYWwuXG4gICAgICAgICsgXCIpXCJcbiAgICAgIH0sXG4gICAgICAvLyBJbnRlZ2VyIGxpdGVyYWwuXG4gICAgICB7IGJlZ2luOlxuICAgICAgICBcIlsrLV0/XFxcXGIoPzpcIiAvLyBMZWFkaW5nIHNpZ24uXG4gICAgICAgICAgKyBcIjBbQmJdWzAxXSg/Oic/WzAxXSkqXCIgLy8gQmluYXJ5LlxuICAgICAgICAgICsgXCJ8MFtYeF1bMC05QS1GYS1mXSg/Oic/WzAtOUEtRmEtZl0pKlwiIC8vIEhleGFkZWNpbWFsLlxuICAgICAgICAgICsgXCJ8MCg/Oic/WzAtN10pKlwiIC8vIE9jdGFsIG9yIGp1c3QgYSBsb25lIHplcm8uXG4gICAgICAgICAgKyBcInxbMS05XSg/Oic/WzAtOV0pKlwiIC8vIERlY2ltYWwuXG4gICAgICAgICsgXCIpKD86XCIgLy8gTGl0ZXJhbCBzdWZmaXhlcy5cbiAgICAgICAgICArIFwiW1V1XSg/OkxMP3xsbD8pXCJcbiAgICAgICAgICArIFwifFtVdV1bWnpdP1wiXG4gICAgICAgICAgKyBcInwoPzpMTD98bGw/KVtVdV0/XCJcbiAgICAgICAgICArIFwifFtael1bVXVdXCJcbiAgICAgICAgICArIFwifFwiIC8vIExpdGVyYWwgc3VmZml4IGlzIG9wdGlvbmFsLlxuICAgICAgICArIFwiKVwiXG4gICAgICAgIC8vIE5vdGU6IHRoZXJlIGFyZSB1c2VyLWRlZmluZWQgbGl0ZXJhbCBzdWZmaXhlcyB0b28sIGJ1dCBwZXJoYXBzIGhhdmluZyB0aGUgY3VzdG9tIHN1ZmZpeCBub3QgcGFydCBvZiB0aGVcbiAgICAgICAgLy8gbGl0ZXJhbCBoaWdobGlnaHQgYWN0dWFsbHkgbWFrZXMgaXQgc3RhbmQgb3V0IG1vcmUuXG4gICAgICB9XG4gICAgXSxcbiAgICByZWxldmFuY2U6IDBcbiAgfTtcblxuICBjb25zdCBQUkVQUk9DRVNTT1IgPSB7XG4gICAgY2xhc3NOYW1lOiAnbWV0YScsXG4gICAgYmVnaW46IC8jXFxzKlthLXpdK1xcYi8sXG4gICAgZW5kOiAvJC8sXG4gICAga2V5d29yZHM6IHsga2V5d29yZDpcbiAgICAgICAgJ2lmIGVsc2UgZWxpZiBlbmRpZiBkZWZpbmUgdW5kZWYgd2FybmluZyBlcnJvciBsaW5lICdcbiAgICAgICAgKyAncHJhZ21hIF9QcmFnbWEgaWZkZWYgaWZuZGVmIGluY2x1ZGUnIH0sXG4gICAgY29udGFpbnM6IFtcbiAgICAgIHtcbiAgICAgICAgYmVnaW46IC9cXFxcXFxuLyxcbiAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICB9LFxuICAgICAgaGxqcy5pbmhlcml0KFNUUklOR1MsIHsgY2xhc3NOYW1lOiAnc3RyaW5nJyB9KSxcbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiAnc3RyaW5nJyxcbiAgICAgICAgYmVnaW46IC88Lio/Pi9cbiAgICAgIH0sXG4gICAgICBDX0xJTkVfQ09NTUVOVF9NT0RFLFxuICAgICAgaGxqcy5DX0JMT0NLX0NPTU1FTlRfTU9ERVxuICAgIF1cbiAgfTtcblxuICBjb25zdCBUSVRMRV9NT0RFID0ge1xuICAgIGNsYXNzTmFtZTogJ3RpdGxlJyxcbiAgICBiZWdpbjogcmVnZXgub3B0aW9uYWwoTkFNRVNQQUNFX1JFKSArIGhsanMuSURFTlRfUkUsXG4gICAgcmVsZXZhbmNlOiAwXG4gIH07XG5cbiAgY29uc3QgRlVOQ1RJT05fVElUTEUgPSByZWdleC5vcHRpb25hbChOQU1FU1BBQ0VfUkUpICsgaGxqcy5JREVOVF9SRSArICdcXFxccypcXFxcKCc7XG5cbiAgLy8gaHR0cHM6Ly9lbi5jcHByZWZlcmVuY2UuY29tL3cvY3BwL2tleXdvcmRcbiAgY29uc3QgUkVTRVJWRURfS0VZV09SRFMgPSBbXG4gICAgJ2FsaWduYXMnLFxuICAgICdhbGlnbm9mJyxcbiAgICAnYW5kJyxcbiAgICAnYW5kX2VxJyxcbiAgICAnYXNtJyxcbiAgICAnYXRvbWljX2NhbmNlbCcsXG4gICAgJ2F0b21pY19jb21taXQnLFxuICAgICdhdG9taWNfbm9leGNlcHQnLFxuICAgICdhdXRvJyxcbiAgICAnYml0YW5kJyxcbiAgICAnYml0b3InLFxuICAgICdicmVhaycsXG4gICAgJ2Nhc2UnLFxuICAgICdjYXRjaCcsXG4gICAgJ2NsYXNzJyxcbiAgICAnY29fYXdhaXQnLFxuICAgICdjb19yZXR1cm4nLFxuICAgICdjb195aWVsZCcsXG4gICAgJ2NvbXBsJyxcbiAgICAnY29uY2VwdCcsXG4gICAgJ2NvbnN0X2Nhc3R8MTAnLFxuICAgICdjb25zdGV2YWwnLFxuICAgICdjb25zdGV4cHInLFxuICAgICdjb25zdGluaXQnLFxuICAgICdjb250aW51ZScsXG4gICAgJ2RlY2x0eXBlJyxcbiAgICAnZGVmYXVsdCcsXG4gICAgJ2RlbGV0ZScsXG4gICAgJ2RvJyxcbiAgICAnZHluYW1pY19jYXN0fDEwJyxcbiAgICAnZWxzZScsXG4gICAgJ2VudW0nLFxuICAgICdleHBsaWNpdCcsXG4gICAgJ2V4cG9ydCcsXG4gICAgJ2V4dGVybicsXG4gICAgJ2ZhbHNlJyxcbiAgICAnZmluYWwnLFxuICAgICdmb3InLFxuICAgICdmcmllbmQnLFxuICAgICdnb3RvJyxcbiAgICAnaWYnLFxuICAgICdpbXBvcnQnLFxuICAgICdpbmxpbmUnLFxuICAgICdtb2R1bGUnLFxuICAgICdtdXRhYmxlJyxcbiAgICAnbmFtZXNwYWNlJyxcbiAgICAnbmV3JyxcbiAgICAnbm9leGNlcHQnLFxuICAgICdub3QnLFxuICAgICdub3RfZXEnLFxuICAgICdudWxscHRyJyxcbiAgICAnb3BlcmF0b3InLFxuICAgICdvcicsXG4gICAgJ29yX2VxJyxcbiAgICAnb3ZlcnJpZGUnLFxuICAgICdwcml2YXRlJyxcbiAgICAncHJvdGVjdGVkJyxcbiAgICAncHVibGljJyxcbiAgICAncmVmbGV4cHInLFxuICAgICdyZWdpc3RlcicsXG4gICAgJ3JlaW50ZXJwcmV0X2Nhc3R8MTAnLFxuICAgICdyZXF1aXJlcycsXG4gICAgJ3JldHVybicsXG4gICAgJ3NpemVvZicsXG4gICAgJ3N0YXRpY19hc3NlcnQnLFxuICAgICdzdGF0aWNfY2FzdHwxMCcsXG4gICAgJ3N0cnVjdCcsXG4gICAgJ3N3aXRjaCcsXG4gICAgJ3N5bmNocm9uaXplZCcsXG4gICAgJ3RlbXBsYXRlJyxcbiAgICAndGhpcycsXG4gICAgJ3RocmVhZF9sb2NhbCcsXG4gICAgJ3Rocm93JyxcbiAgICAndHJhbnNhY3Rpb25fc2FmZScsXG4gICAgJ3RyYW5zYWN0aW9uX3NhZmVfZHluYW1pYycsXG4gICAgJ3RydWUnLFxuICAgICd0cnknLFxuICAgICd0eXBlZGVmJyxcbiAgICAndHlwZWlkJyxcbiAgICAndHlwZW5hbWUnLFxuICAgICd1bmlvbicsXG4gICAgJ3VzaW5nJyxcbiAgICAndmlydHVhbCcsXG4gICAgJ3ZvbGF0aWxlJyxcbiAgICAnd2hpbGUnLFxuICAgICd4b3InLFxuICAgICd4b3JfZXEnXG4gIF07XG5cbiAgLy8gaHR0cHM6Ly9lbi5jcHByZWZlcmVuY2UuY29tL3cvY3BwL2tleXdvcmRcbiAgY29uc3QgUkVTRVJWRURfVFlQRVMgPSBbXG4gICAgJ2Jvb2wnLFxuICAgICdjaGFyJyxcbiAgICAnY2hhcjE2X3QnLFxuICAgICdjaGFyMzJfdCcsXG4gICAgJ2NoYXI4X3QnLFxuICAgICdkb3VibGUnLFxuICAgICdmbG9hdCcsXG4gICAgJ2ludCcsXG4gICAgJ2xvbmcnLFxuICAgICdzaG9ydCcsXG4gICAgJ3ZvaWQnLFxuICAgICd3Y2hhcl90JyxcbiAgICAndW5zaWduZWQnLFxuICAgICdzaWduZWQnLFxuICAgICdjb25zdCcsXG4gICAgJ3N0YXRpYydcbiAgXTtcblxuICBjb25zdCBUWVBFX0hJTlRTID0gW1xuICAgICdhbnknLFxuICAgICdhdXRvX3B0cicsXG4gICAgJ2JhcnJpZXInLFxuICAgICdiaW5hcnlfc2VtYXBob3JlJyxcbiAgICAnYml0c2V0JyxcbiAgICAnY29tcGxleCcsXG4gICAgJ2NvbmRpdGlvbl92YXJpYWJsZScsXG4gICAgJ2NvbmRpdGlvbl92YXJpYWJsZV9hbnknLFxuICAgICdjb3VudGluZ19zZW1hcGhvcmUnLFxuICAgICdkZXF1ZScsXG4gICAgJ2ZhbHNlX3R5cGUnLFxuICAgICdmbGF0X21hcCcsXG4gICAgJ2ZsYXRfc2V0JyxcbiAgICAnZnV0dXJlJyxcbiAgICAnaW1hZ2luYXJ5JyxcbiAgICAnaW5pdGlhbGl6ZXJfbGlzdCcsXG4gICAgJ2lzdHJpbmdzdHJlYW0nLFxuICAgICdqdGhyZWFkJyxcbiAgICAnbGF0Y2gnLFxuICAgICdsb2NrX2d1YXJkJyxcbiAgICAnbXVsdGltYXAnLFxuICAgICdtdWx0aXNldCcsXG4gICAgJ211dGV4JyxcbiAgICAnb3B0aW9uYWwnLFxuICAgICdvc3RyaW5nc3RyZWFtJyxcbiAgICAncGFja2FnZWRfdGFzaycsXG4gICAgJ3BhaXInLFxuICAgICdwcm9taXNlJyxcbiAgICAncHJpb3JpdHlfcXVldWUnLFxuICAgICdxdWV1ZScsXG4gICAgJ3JlY3Vyc2l2ZV9tdXRleCcsXG4gICAgJ3JlY3Vyc2l2ZV90aW1lZF9tdXRleCcsXG4gICAgJ3Njb3BlZF9sb2NrJyxcbiAgICAnc2V0JyxcbiAgICAnc2hhcmVkX2Z1dHVyZScsXG4gICAgJ3NoYXJlZF9sb2NrJyxcbiAgICAnc2hhcmVkX211dGV4JyxcbiAgICAnc2hhcmVkX3RpbWVkX211dGV4JyxcbiAgICAnc2hhcmVkX3B0cicsXG4gICAgJ3N0YWNrJyxcbiAgICAnc3RyaW5nX3ZpZXcnLFxuICAgICdzdHJpbmdzdHJlYW0nLFxuICAgICd0aW1lZF9tdXRleCcsXG4gICAgJ3RocmVhZCcsXG4gICAgJ3RydWVfdHlwZScsXG4gICAgJ3R1cGxlJyxcbiAgICAndW5pcXVlX2xvY2snLFxuICAgICd1bmlxdWVfcHRyJyxcbiAgICAndW5vcmRlcmVkX21hcCcsXG4gICAgJ3Vub3JkZXJlZF9tdWx0aW1hcCcsXG4gICAgJ3Vub3JkZXJlZF9tdWx0aXNldCcsXG4gICAgJ3Vub3JkZXJlZF9zZXQnLFxuICAgICd2YXJpYW50JyxcbiAgICAndmVjdG9yJyxcbiAgICAnd2Vha19wdHInLFxuICAgICd3c3RyaW5nJyxcbiAgICAnd3N0cmluZ192aWV3J1xuICBdO1xuXG4gIGNvbnN0IEZVTkNUSU9OX0hJTlRTID0gW1xuICAgICdhYm9ydCcsXG4gICAgJ2FicycsXG4gICAgJ2Fjb3MnLFxuICAgICdhcHBseScsXG4gICAgJ2FzX2NvbnN0JyxcbiAgICAnYXNpbicsXG4gICAgJ2F0YW4nLFxuICAgICdhdGFuMicsXG4gICAgJ2NhbGxvYycsXG4gICAgJ2NlaWwnLFxuICAgICdjZXJyJyxcbiAgICAnY2luJyxcbiAgICAnY2xvZycsXG4gICAgJ2NvcycsXG4gICAgJ2Nvc2gnLFxuICAgICdjb3V0JyxcbiAgICAnZGVjbHZhbCcsXG4gICAgJ2VuZGwnLFxuICAgICdleGNoYW5nZScsXG4gICAgJ2V4aXQnLFxuICAgICdleHAnLFxuICAgICdmYWJzJyxcbiAgICAnZmxvb3InLFxuICAgICdmbW9kJyxcbiAgICAnZm9yd2FyZCcsXG4gICAgJ2ZwcmludGYnLFxuICAgICdmcHV0cycsXG4gICAgJ2ZyZWUnLFxuICAgICdmcmV4cCcsXG4gICAgJ2ZzY2FuZicsXG4gICAgJ2Z1dHVyZScsXG4gICAgJ2ludm9rZScsXG4gICAgJ2lzYWxudW0nLFxuICAgICdpc2FscGhhJyxcbiAgICAnaXNjbnRybCcsXG4gICAgJ2lzZGlnaXQnLFxuICAgICdpc2dyYXBoJyxcbiAgICAnaXNsb3dlcicsXG4gICAgJ2lzcHJpbnQnLFxuICAgICdpc3B1bmN0JyxcbiAgICAnaXNzcGFjZScsXG4gICAgJ2lzdXBwZXInLFxuICAgICdpc3hkaWdpdCcsXG4gICAgJ2xhYnMnLFxuICAgICdsYXVuZGVyJyxcbiAgICAnbGRleHAnLFxuICAgICdsb2cnLFxuICAgICdsb2cxMCcsXG4gICAgJ21ha2VfcGFpcicsXG4gICAgJ21ha2Vfc2hhcmVkJyxcbiAgICAnbWFrZV9zaGFyZWRfZm9yX292ZXJ3cml0ZScsXG4gICAgJ21ha2VfdHVwbGUnLFxuICAgICdtYWtlX3VuaXF1ZScsXG4gICAgJ21hbGxvYycsXG4gICAgJ21lbWNocicsXG4gICAgJ21lbWNtcCcsXG4gICAgJ21lbWNweScsXG4gICAgJ21lbXNldCcsXG4gICAgJ21vZGYnLFxuICAgICdtb3ZlJyxcbiAgICAncG93JyxcbiAgICAncHJpbnRmJyxcbiAgICAncHV0Y2hhcicsXG4gICAgJ3B1dHMnLFxuICAgICdyZWFsbG9jJyxcbiAgICAnc2NhbmYnLFxuICAgICdzaW4nLFxuICAgICdzaW5oJyxcbiAgICAnc25wcmludGYnLFxuICAgICdzcHJpbnRmJyxcbiAgICAnc3FydCcsXG4gICAgJ3NzY2FuZicsXG4gICAgJ3N0ZCcsXG4gICAgJ3N0ZGVycicsXG4gICAgJ3N0ZGluJyxcbiAgICAnc3Rkb3V0JyxcbiAgICAnc3RyY2F0JyxcbiAgICAnc3RyY2hyJyxcbiAgICAnc3RyY21wJyxcbiAgICAnc3RyY3B5JyxcbiAgICAnc3RyY3NwbicsXG4gICAgJ3N0cmxlbicsXG4gICAgJ3N0cm5jYXQnLFxuICAgICdzdHJuY21wJyxcbiAgICAnc3RybmNweScsXG4gICAgJ3N0cnBicmsnLFxuICAgICdzdHJyY2hyJyxcbiAgICAnc3Ryc3BuJyxcbiAgICAnc3Ryc3RyJyxcbiAgICAnc3dhcCcsXG4gICAgJ3RhbicsXG4gICAgJ3RhbmgnLFxuICAgICd0ZXJtaW5hdGUnLFxuICAgICd0b191bmRlcmx5aW5nJyxcbiAgICAndG9sb3dlcicsXG4gICAgJ3RvdXBwZXInLFxuICAgICd2ZnByaW50ZicsXG4gICAgJ3Zpc2l0JyxcbiAgICAndnByaW50ZicsXG4gICAgJ3ZzcHJpbnRmJ1xuICBdO1xuXG4gIGNvbnN0IExJVEVSQUxTID0gW1xuICAgICdOVUxMJyxcbiAgICAnZmFsc2UnLFxuICAgICdudWxsb3B0JyxcbiAgICAnbnVsbHB0cicsXG4gICAgJ3RydWUnXG4gIF07XG5cbiAgLy8gaHR0cHM6Ly9lbi5jcHByZWZlcmVuY2UuY29tL3cvY3BwL2tleXdvcmRcbiAgY29uc3QgQlVJTFRfSU4gPSBbICdfUHJhZ21hJyBdO1xuXG4gIGNvbnN0IENQUF9LRVlXT1JEUyA9IHtcbiAgICB0eXBlOiBSRVNFUlZFRF9UWVBFUyxcbiAgICBrZXl3b3JkOiBSRVNFUlZFRF9LRVlXT1JEUyxcbiAgICBsaXRlcmFsOiBMSVRFUkFMUyxcbiAgICBidWlsdF9pbjogQlVJTFRfSU4sXG4gICAgX3R5cGVfaGludHM6IFRZUEVfSElOVFNcbiAgfTtcblxuICBjb25zdCBGVU5DVElPTl9ESVNQQVRDSCA9IHtcbiAgICBjbGFzc05hbWU6ICdmdW5jdGlvbi5kaXNwYXRjaCcsXG4gICAgcmVsZXZhbmNlOiAwLFxuICAgIGtleXdvcmRzOiB7XG4gICAgICAvLyBPbmx5IGZvciByZWxldmFuY2UsIG5vdCBoaWdobGlnaHRpbmcuXG4gICAgICBfaGludDogRlVOQ1RJT05fSElOVFMgfSxcbiAgICBiZWdpbjogcmVnZXguY29uY2F0KFxuICAgICAgL1xcYi8sXG4gICAgICAvKD8hZGVjbHR5cGUpLyxcbiAgICAgIC8oPyFpZikvLFxuICAgICAgLyg/IWZvcikvLFxuICAgICAgLyg/IXN3aXRjaCkvLFxuICAgICAgLyg/IXdoaWxlKS8sXG4gICAgICBobGpzLklERU5UX1JFLFxuICAgICAgcmVnZXgubG9va2FoZWFkKC8oPFtePD5dKz58KVxccypcXCgvKSlcbiAgfTtcblxuICBjb25zdCBFWFBSRVNTSU9OX0NPTlRBSU5TID0gW1xuICAgIEZVTkNUSU9OX0RJU1BBVENILFxuICAgIFBSRVBST0NFU1NPUixcbiAgICBDUFBfUFJJTUlUSVZFX1RZUEVTLFxuICAgIENfTElORV9DT01NRU5UX01PREUsXG4gICAgaGxqcy5DX0JMT0NLX0NPTU1FTlRfTU9ERSxcbiAgICBOVU1CRVJTLFxuICAgIFNUUklOR1NcbiAgXTtcblxuICBjb25zdCBFWFBSRVNTSU9OX0NPTlRFWFQgPSB7XG4gICAgLy8gVGhpcyBtb2RlIGNvdmVycyBleHByZXNzaW9uIGNvbnRleHQgd2hlcmUgd2UgY2FuJ3QgZXhwZWN0IGEgZnVuY3Rpb25cbiAgICAvLyBkZWZpbml0aW9uIGFuZCBzaG91bGRuJ3QgaGlnaGxpZ2h0IGFueXRoaW5nIHRoYXQgbG9va3MgbGlrZSBvbmU6XG4gICAgLy8gYHJldHVybiBzb21lKClgLCBgZWxzZSBpZigpYCwgYCh4KnN1bSgxLCAyKSlgXG4gICAgdmFyaWFudHM6IFtcbiAgICAgIHtcbiAgICAgICAgYmVnaW46IC89LyxcbiAgICAgICAgZW5kOiAvOy9cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGJlZ2luOiAvXFwoLyxcbiAgICAgICAgZW5kOiAvXFwpL1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgYmVnaW5LZXl3b3JkczogJ25ldyB0aHJvdyByZXR1cm4gZWxzZScsXG4gICAgICAgIGVuZDogLzsvXG4gICAgICB9XG4gICAgXSxcbiAgICBrZXl3b3JkczogQ1BQX0tFWVdPUkRTLFxuICAgIGNvbnRhaW5zOiBFWFBSRVNTSU9OX0NPTlRBSU5TLmNvbmNhdChbXG4gICAgICB7XG4gICAgICAgIGJlZ2luOiAvXFwoLyxcbiAgICAgICAgZW5kOiAvXFwpLyxcbiAgICAgICAga2V5d29yZHM6IENQUF9LRVlXT1JEUyxcbiAgICAgICAgY29udGFpbnM6IEVYUFJFU1NJT05fQ09OVEFJTlMuY29uY2F0KFsgJ3NlbGYnIF0pLFxuICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgIH1cbiAgICBdKSxcbiAgICByZWxldmFuY2U6IDBcbiAgfTtcblxuICBjb25zdCBGVU5DVElPTl9ERUNMQVJBVElPTiA9IHtcbiAgICBjbGFzc05hbWU6ICdmdW5jdGlvbicsXG4gICAgYmVnaW46ICcoJyArIEZVTkNUSU9OX1RZUEVfUkUgKyAnW1xcXFwqJlxcXFxzXSspKycgKyBGVU5DVElPTl9USVRMRSxcbiAgICByZXR1cm5CZWdpbjogdHJ1ZSxcbiAgICBlbmQ6IC9bezs9XS8sXG4gICAgZXhjbHVkZUVuZDogdHJ1ZSxcbiAgICBrZXl3b3JkczogQ1BQX0tFWVdPUkRTLFxuICAgIGlsbGVnYWw6IC9bXlxcd1xcc1xcKiY6PD4uXS8sXG4gICAgY29udGFpbnM6IFtcbiAgICAgIHsgLy8gdG8gcHJldmVudCBpdCBmcm9tIGJlaW5nIGNvbmZ1c2VkIGFzIHRoZSBmdW5jdGlvbiB0aXRsZVxuICAgICAgICBiZWdpbjogREVDTFRZUEVfQVVUT19SRSxcbiAgICAgICAga2V5d29yZHM6IENQUF9LRVlXT1JEUyxcbiAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBiZWdpbjogRlVOQ1RJT05fVElUTEUsXG4gICAgICAgIHJldHVybkJlZ2luOiB0cnVlLFxuICAgICAgICBjb250YWluczogWyBUSVRMRV9NT0RFIF0sXG4gICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgfSxcbiAgICAgIC8vIG5lZWRlZCBiZWNhdXNlIHdlIGRvIG5vdCBoYXZlIGxvb2stYmVoaW5kIG9uIHRoZSBiZWxvdyBydWxlXG4gICAgICAvLyB0byBwcmV2ZW50IGl0IGZyb20gZ3JhYmJpbmcgdGhlIGZpbmFsIDogaW4gYSA6OiBwYWlyXG4gICAgICB7XG4gICAgICAgIGJlZ2luOiAvOjovLFxuICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgIH0sXG4gICAgICAvLyBpbml0aWFsaXplcnNcbiAgICAgIHtcbiAgICAgICAgYmVnaW46IC86LyxcbiAgICAgICAgZW5kc1dpdGhQYXJlbnQ6IHRydWUsXG4gICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAgU1RSSU5HUyxcbiAgICAgICAgICBOVU1CRVJTXG4gICAgICAgIF1cbiAgICAgIH0sXG4gICAgICAvLyBhbGxvdyBmb3IgbXVsdGlwbGUgZGVjbGFyYXRpb25zLCBlLmcuOlxuICAgICAgLy8gZXh0ZXJuIHZvaWQgZihpbnQpLCBnKGNoYXIpO1xuICAgICAge1xuICAgICAgICByZWxldmFuY2U6IDAsXG4gICAgICAgIG1hdGNoOiAvLC9cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGNsYXNzTmFtZTogJ3BhcmFtcycsXG4gICAgICAgIGJlZ2luOiAvXFwoLyxcbiAgICAgICAgZW5kOiAvXFwpLyxcbiAgICAgICAga2V5d29yZHM6IENQUF9LRVlXT1JEUyxcbiAgICAgICAgcmVsZXZhbmNlOiAwLFxuICAgICAgICBjb250YWluczogW1xuICAgICAgICAgIENfTElORV9DT01NRU5UX01PREUsXG4gICAgICAgICAgaGxqcy5DX0JMT0NLX0NPTU1FTlRfTU9ERSxcbiAgICAgICAgICBTVFJJTkdTLFxuICAgICAgICAgIE5VTUJFUlMsXG4gICAgICAgICAgQ1BQX1BSSU1JVElWRV9UWVBFUyxcbiAgICAgICAgICAvLyBDb3VudCBtYXRjaGluZyBwYXJlbnRoZXNlcy5cbiAgICAgICAgICB7XG4gICAgICAgICAgICBiZWdpbjogL1xcKC8sXG4gICAgICAgICAgICBlbmQ6IC9cXCkvLFxuICAgICAgICAgICAga2V5d29yZHM6IENQUF9LRVlXT1JEUyxcbiAgICAgICAgICAgIHJlbGV2YW5jZTogMCxcbiAgICAgICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAgICAgICdzZWxmJyxcbiAgICAgICAgICAgICAgQ19MSU5FX0NPTU1FTlRfTU9ERSxcbiAgICAgICAgICAgICAgaGxqcy5DX0JMT0NLX0NPTU1FTlRfTU9ERSxcbiAgICAgICAgICAgICAgU1RSSU5HUyxcbiAgICAgICAgICAgICAgTlVNQkVSUyxcbiAgICAgICAgICAgICAgQ1BQX1BSSU1JVElWRV9UWVBFU1xuICAgICAgICAgICAgXVxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfSxcbiAgICAgIENQUF9QUklNSVRJVkVfVFlQRVMsXG4gICAgICBDX0xJTkVfQ09NTUVOVF9NT0RFLFxuICAgICAgaGxqcy5DX0JMT0NLX0NPTU1FTlRfTU9ERSxcbiAgICAgIFBSRVBST0NFU1NPUlxuICAgIF1cbiAgfTtcblxuICByZXR1cm4ge1xuICAgIG5hbWU6ICdDKysnLFxuICAgIGFsaWFzZXM6IFtcbiAgICAgICdjYycsXG4gICAgICAnYysrJyxcbiAgICAgICdoKysnLFxuICAgICAgJ2hwcCcsXG4gICAgICAnaGgnLFxuICAgICAgJ2h4eCcsXG4gICAgICAnY3h4J1xuICAgIF0sXG4gICAga2V5d29yZHM6IENQUF9LRVlXT1JEUyxcbiAgICBpbGxlZ2FsOiAnPC8nLFxuICAgIGNsYXNzTmFtZUFsaWFzZXM6IHsgJ2Z1bmN0aW9uLmRpc3BhdGNoJzogJ2J1aWx0X2luJyB9LFxuICAgIGNvbnRhaW5zOiBbXS5jb25jYXQoXG4gICAgICBFWFBSRVNTSU9OX0NPTlRFWFQsXG4gICAgICBGVU5DVElPTl9ERUNMQVJBVElPTixcbiAgICAgIEZVTkNUSU9OX0RJU1BBVENILFxuICAgICAgRVhQUkVTU0lPTl9DT05UQUlOUyxcbiAgICAgIFtcbiAgICAgICAgUFJFUFJPQ0VTU09SLFxuICAgICAgICB7IC8vIGNvbnRhaW5lcnM6IGllLCBgdmVjdG9yIDxpbnQ+IHJvb21zICg5KTtgXG4gICAgICAgICAgYmVnaW46ICdcXFxcYihkZXF1ZXxsaXN0fHF1ZXVlfHByaW9yaXR5X3F1ZXVlfHBhaXJ8c3RhY2t8dmVjdG9yfG1hcHxzZXR8Yml0c2V0fG11bHRpc2V0fG11bHRpbWFwfHVub3JkZXJlZF9tYXB8dW5vcmRlcmVkX3NldHx1bm9yZGVyZWRfbXVsdGlzZXR8dW5vcmRlcmVkX211bHRpbWFwfGFycmF5fHR1cGxlfG9wdGlvbmFsfHZhcmlhbnR8ZnVuY3Rpb258ZmxhdF9tYXB8ZmxhdF9zZXQpXFxcXHMqPCg/ITwpJyxcbiAgICAgICAgICBlbmQ6ICc+JyxcbiAgICAgICAgICBrZXl3b3JkczogQ1BQX0tFWVdPUkRTLFxuICAgICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAgICAnc2VsZicsXG4gICAgICAgICAgICBDUFBfUFJJTUlUSVZFX1RZUEVTXG4gICAgICAgICAgXVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgYmVnaW46IGhsanMuSURFTlRfUkUgKyAnOjonLFxuICAgICAgICAgIGtleXdvcmRzOiBDUFBfS0VZV09SRFNcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIG1hdGNoOiBbXG4gICAgICAgICAgICAvLyBleHRyYSBjb21wbGV4aXR5IHRvIGRlYWwgd2l0aCBgZW51bSBjbGFzc2AgYW5kIGBlbnVtIHN0cnVjdGBcbiAgICAgICAgICAgIC9cXGIoPzplbnVtKD86XFxzKyg/OmNsYXNzfHN0cnVjdCkpP3xjbGFzc3xzdHJ1Y3R8dW5pb24pLyxcbiAgICAgICAgICAgIC9cXHMrLyxcbiAgICAgICAgICAgIC9cXHcrL1xuICAgICAgICAgIF0sXG4gICAgICAgICAgY2xhc3NOYW1lOiB7XG4gICAgICAgICAgICAxOiAna2V5d29yZCcsXG4gICAgICAgICAgICAzOiAndGl0bGUuY2xhc3MnXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICBdKVxuICB9O1xufVxuXG5leHBvcnQgeyBjcHAgYXMgZGVmYXVsdCB9O1xuIiwgImNvbnN0IElERU5UX1JFID0gJ1tBLVphLXokX11bMC05QS1aYS16JF9dKic7XG5jb25zdCBLRVlXT1JEUyA9IFtcbiAgXCJhc1wiLCAvLyBmb3IgZXhwb3J0c1xuICBcImluXCIsXG4gIFwib2ZcIixcbiAgXCJpZlwiLFxuICBcImZvclwiLFxuICBcIndoaWxlXCIsXG4gIFwiZmluYWxseVwiLFxuICBcInZhclwiLFxuICBcIm5ld1wiLFxuICBcImZ1bmN0aW9uXCIsXG4gIFwiZG9cIixcbiAgXCJyZXR1cm5cIixcbiAgXCJ2b2lkXCIsXG4gIFwiZWxzZVwiLFxuICBcImJyZWFrXCIsXG4gIFwiY2F0Y2hcIixcbiAgXCJpbnN0YW5jZW9mXCIsXG4gIFwid2l0aFwiLFxuICBcInRocm93XCIsXG4gIFwiY2FzZVwiLFxuICBcImRlZmF1bHRcIixcbiAgXCJ0cnlcIixcbiAgXCJzd2l0Y2hcIixcbiAgXCJjb250aW51ZVwiLFxuICBcInR5cGVvZlwiLFxuICBcImRlbGV0ZVwiLFxuICBcImxldFwiLFxuICBcInlpZWxkXCIsXG4gIFwiY29uc3RcIixcbiAgXCJjbGFzc1wiLFxuICAvLyBKUyBoYW5kbGVzIHRoZXNlIHdpdGggYSBzcGVjaWFsIHJ1bGVcbiAgLy8gXCJnZXRcIixcbiAgLy8gXCJzZXRcIixcbiAgXCJkZWJ1Z2dlclwiLFxuICBcImFzeW5jXCIsXG4gIFwiYXdhaXRcIixcbiAgXCJzdGF0aWNcIixcbiAgXCJpbXBvcnRcIixcbiAgXCJmcm9tXCIsXG4gIFwiZXhwb3J0XCIsXG4gIFwiZXh0ZW5kc1wiLFxuICAvLyBJdCdzIHJlYWNoZWQgc3RhZ2UgMywgd2hpY2ggaXMgXCJyZWNvbW1lbmRlZCBmb3IgaW1wbGVtZW50YXRpb25cIjpcbiAgXCJ1c2luZ1wiXG5dO1xuY29uc3QgTElURVJBTFMgPSBbXG4gIFwidHJ1ZVwiLFxuICBcImZhbHNlXCIsXG4gIFwibnVsbFwiLFxuICBcInVuZGVmaW5lZFwiLFxuICBcIk5hTlwiLFxuICBcIkluZmluaXR5XCJcbl07XG5cbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzXG5jb25zdCBUWVBFUyA9IFtcbiAgLy8gRnVuZGFtZW50YWwgb2JqZWN0c1xuICBcIk9iamVjdFwiLFxuICBcIkZ1bmN0aW9uXCIsXG4gIFwiQm9vbGVhblwiLFxuICBcIlN5bWJvbFwiLFxuICAvLyBudW1iZXJzIGFuZCBkYXRlc1xuICBcIk1hdGhcIixcbiAgXCJEYXRlXCIsXG4gIFwiTnVtYmVyXCIsXG4gIFwiQmlnSW50XCIsXG4gIC8vIHRleHRcbiAgXCJTdHJpbmdcIixcbiAgXCJSZWdFeHBcIixcbiAgLy8gSW5kZXhlZCBjb2xsZWN0aW9uc1xuICBcIkFycmF5XCIsXG4gIFwiRmxvYXQzMkFycmF5XCIsXG4gIFwiRmxvYXQ2NEFycmF5XCIsXG4gIFwiSW50OEFycmF5XCIsXG4gIFwiVWludDhBcnJheVwiLFxuICBcIlVpbnQ4Q2xhbXBlZEFycmF5XCIsXG4gIFwiSW50MTZBcnJheVwiLFxuICBcIkludDMyQXJyYXlcIixcbiAgXCJVaW50MTZBcnJheVwiLFxuICBcIlVpbnQzMkFycmF5XCIsXG4gIFwiQmlnSW50NjRBcnJheVwiLFxuICBcIkJpZ1VpbnQ2NEFycmF5XCIsXG4gIC8vIEtleWVkIGNvbGxlY3Rpb25zXG4gIFwiU2V0XCIsXG4gIFwiTWFwXCIsXG4gIFwiV2Vha1NldFwiLFxuICBcIldlYWtNYXBcIixcbiAgLy8gU3RydWN0dXJlZCBkYXRhXG4gIFwiQXJyYXlCdWZmZXJcIixcbiAgXCJTaGFyZWRBcnJheUJ1ZmZlclwiLFxuICBcIkF0b21pY3NcIixcbiAgXCJEYXRhVmlld1wiLFxuICBcIkpTT05cIixcbiAgLy8gQ29udHJvbCBhYnN0cmFjdGlvbiBvYmplY3RzXG4gIFwiUHJvbWlzZVwiLFxuICBcIkdlbmVyYXRvclwiLFxuICBcIkdlbmVyYXRvckZ1bmN0aW9uXCIsXG4gIFwiQXN5bmNGdW5jdGlvblwiLFxuICAvLyBSZWZsZWN0aW9uXG4gIFwiUmVmbGVjdFwiLFxuICBcIlByb3h5XCIsXG4gIC8vIEludGVybmF0aW9uYWxpemF0aW9uXG4gIFwiSW50bFwiLFxuICAvLyBXZWJBc3NlbWJseVxuICBcIldlYkFzc2VtYmx5XCJcbl07XG5cbmNvbnN0IEVSUk9SX1RZUEVTID0gW1xuICBcIkVycm9yXCIsXG4gIFwiRXZhbEVycm9yXCIsXG4gIFwiSW50ZXJuYWxFcnJvclwiLFxuICBcIlJhbmdlRXJyb3JcIixcbiAgXCJSZWZlcmVuY2VFcnJvclwiLFxuICBcIlN5bnRheEVycm9yXCIsXG4gIFwiVHlwZUVycm9yXCIsXG4gIFwiVVJJRXJyb3JcIlxuXTtcblxuY29uc3QgQlVJTFRfSU5fR0xPQkFMUyA9IFtcbiAgXCJzZXRJbnRlcnZhbFwiLFxuICBcInNldFRpbWVvdXRcIixcbiAgXCJjbGVhckludGVydmFsXCIsXG4gIFwiY2xlYXJUaW1lb3V0XCIsXG5cbiAgXCJyZXF1aXJlXCIsXG4gIFwiZXhwb3J0c1wiLFxuXG4gIFwiZXZhbFwiLFxuICBcImlzRmluaXRlXCIsXG4gIFwiaXNOYU5cIixcbiAgXCJwYXJzZUZsb2F0XCIsXG4gIFwicGFyc2VJbnRcIixcbiAgXCJkZWNvZGVVUklcIixcbiAgXCJkZWNvZGVVUklDb21wb25lbnRcIixcbiAgXCJlbmNvZGVVUklcIixcbiAgXCJlbmNvZGVVUklDb21wb25lbnRcIixcbiAgXCJlc2NhcGVcIixcbiAgXCJ1bmVzY2FwZVwiXG5dO1xuXG5jb25zdCBCVUlMVF9JTl9WQVJJQUJMRVMgPSBbXG4gIFwiYXJndW1lbnRzXCIsXG4gIFwidGhpc1wiLFxuICBcInN1cGVyXCIsXG4gIFwiY29uc29sZVwiLFxuICBcIndpbmRvd1wiLFxuICBcImRvY3VtZW50XCIsXG4gIFwibG9jYWxTdG9yYWdlXCIsXG4gIFwic2Vzc2lvblN0b3JhZ2VcIixcbiAgXCJtb2R1bGVcIixcbiAgXCJnbG9iYWxcIiAvLyBOb2RlLmpzXG5dO1xuXG5jb25zdCBCVUlMVF9JTlMgPSBbXS5jb25jYXQoXG4gIEJVSUxUX0lOX0dMT0JBTFMsXG4gIFRZUEVTLFxuICBFUlJPUl9UWVBFU1xuKTtcblxuLypcbkxhbmd1YWdlOiBKYXZhU2NyaXB0XG5EZXNjcmlwdGlvbjogSmF2YVNjcmlwdCAoSlMpIGlzIGEgbGlnaHR3ZWlnaHQsIGludGVycHJldGVkLCBvciBqdXN0LWluLXRpbWUgY29tcGlsZWQgcHJvZ3JhbW1pbmcgbGFuZ3VhZ2Ugd2l0aCBmaXJzdC1jbGFzcyBmdW5jdGlvbnMuXG5DYXRlZ29yeTogY29tbW9uLCBzY3JpcHRpbmcsIHdlYlxuV2Vic2l0ZTogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdFxuKi9cblxuXG4vKiogQHR5cGUgTGFuZ3VhZ2VGbiAqL1xuZnVuY3Rpb24gamF2YXNjcmlwdChobGpzKSB7XG4gIGNvbnN0IHJlZ2V4ID0gaGxqcy5yZWdleDtcbiAgLyoqXG4gICAqIFRha2VzIGEgc3RyaW5nIGxpa2UgXCI8Qm9vZ2VyXCIgYW5kIGNoZWNrcyB0byBzZWVcbiAgICogaWYgd2UgY2FuIGZpbmQgYSBtYXRjaGluZyBcIjwvQm9vZ2VyXCIgbGF0ZXIgaW4gdGhlXG4gICAqIGNvbnRlbnQuXG4gICAqIEBwYXJhbSB7UmVnRXhwTWF0Y2hBcnJheX0gbWF0Y2hcbiAgICogQHBhcmFtIHt7YWZ0ZXI6bnVtYmVyfX0gcGFyYW0xXG4gICAqL1xuICBjb25zdCBoYXNDbG9zaW5nVGFnID0gKG1hdGNoLCB7IGFmdGVyIH0pID0+IHtcbiAgICBjb25zdCB0YWcgPSBcIjwvXCIgKyBtYXRjaFswXS5zbGljZSgxKTtcbiAgICBjb25zdCBwb3MgPSBtYXRjaC5pbnB1dC5pbmRleE9mKHRhZywgYWZ0ZXIpO1xuICAgIHJldHVybiBwb3MgIT09IC0xO1xuICB9O1xuXG4gIGNvbnN0IElERU5UX1JFJDEgPSBJREVOVF9SRTtcbiAgY29uc3QgRlJBR01FTlQgPSB7XG4gICAgYmVnaW46ICc8PicsXG4gICAgZW5kOiAnPC8+J1xuICB9O1xuICAvLyB0byBhdm9pZCBzb21lIHNwZWNpYWwgY2FzZXMgaW5zaWRlIGlzVHJ1bHlPcGVuaW5nVGFnXG4gIGNvbnN0IFhNTF9TRUxGX0NMT1NJTkcgPSAvPFtBLVphLXowLTlcXFxcLl86LV0rXFxzKlxcLz4vO1xuICBjb25zdCBYTUxfVEFHID0ge1xuICAgIGJlZ2luOiAvPFtBLVphLXowLTlcXFxcLl86LV0rLyxcbiAgICBlbmQ6IC9cXC9bQS1aYS16MC05XFxcXC5fOi1dKz58XFwvPi8sXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtSZWdFeHBNYXRjaEFycmF5fSBtYXRjaFxuICAgICAqIEBwYXJhbSB7Q2FsbGJhY2tSZXNwb25zZX0gcmVzcG9uc2VcbiAgICAgKi9cbiAgICBpc1RydWx5T3BlbmluZ1RhZzogKG1hdGNoLCByZXNwb25zZSkgPT4ge1xuICAgICAgY29uc3QgYWZ0ZXJNYXRjaEluZGV4ID0gbWF0Y2hbMF0ubGVuZ3RoICsgbWF0Y2guaW5kZXg7XG4gICAgICBjb25zdCBuZXh0Q2hhciA9IG1hdGNoLmlucHV0W2FmdGVyTWF0Y2hJbmRleF07XG4gICAgICBpZiAoXG4gICAgICAgIC8vIEhUTUwgc2hvdWxkIG5vdCBpbmNsdWRlIGFub3RoZXIgcmF3IGA8YCBpbnNpZGUgYSB0YWdcbiAgICAgICAgLy8gbmVzdGVkIHR5cGU/XG4gICAgICAgIC8vIGA8QXJyYXk8QXJyYXk8bnVtYmVyPj5gLCBldGMuXG4gICAgICAgIG5leHRDaGFyID09PSBcIjxcIiB8fFxuICAgICAgICAvLyB0aGUgLCBnaXZlcyBhd2F5IHRoYXQgdGhpcyBpcyBub3QgSFRNTFxuICAgICAgICAvLyBgPFQsIEEgZXh0ZW5kcyBrZXlvZiBULCBWPmBcbiAgICAgICAgbmV4dENoYXIgPT09IFwiLFwiXG4gICAgICAgICkge1xuICAgICAgICByZXNwb25zZS5pZ25vcmVNYXRjaCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIC8vIGA8c29tZXRoaW5nPmBcbiAgICAgIC8vIFF1aXRlIHBvc3NpYmx5IGEgdGFnLCBsZXRzIGxvb2sgZm9yIGEgbWF0Y2hpbmcgY2xvc2luZyB0YWcuLi5cbiAgICAgIGlmIChuZXh0Q2hhciA9PT0gXCI+XCIpIHtcbiAgICAgICAgLy8gaWYgd2UgY2Fubm90IGZpbmQgYSBtYXRjaGluZyBjbG9zaW5nIHRhZywgdGhlbiB3ZVxuICAgICAgICAvLyB3aWxsIGlnbm9yZSBpdFxuICAgICAgICBpZiAoIWhhc0Nsb3NpbmdUYWcobWF0Y2gsIHsgYWZ0ZXI6IGFmdGVyTWF0Y2hJbmRleCB9KSkge1xuICAgICAgICAgIHJlc3BvbnNlLmlnbm9yZU1hdGNoKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gYDxibGFoIC8+YCAoc2VsZi1jbG9zaW5nKVxuICAgICAgLy8gaGFuZGxlZCBieSBzaW1wbGVTZWxmQ2xvc2luZyBydWxlXG5cbiAgICAgIGxldCBtO1xuICAgICAgY29uc3QgYWZ0ZXJNYXRjaCA9IG1hdGNoLmlucHV0LnN1YnN0cmluZyhhZnRlck1hdGNoSW5kZXgpO1xuXG4gICAgICAvLyBzb21lIG1vcmUgdGVtcGxhdGUgdHlwaW5nIHN0dWZmXG4gICAgICAvLyAgPFQgPSBhbnk+KGtleT86IHN0cmluZykgPT4gTW9kaWZ5PFxuICAgICAgaWYgKChtID0gYWZ0ZXJNYXRjaC5tYXRjaCgvXlxccyo9LykpKSB7XG4gICAgICAgIHJlc3BvbnNlLmlnbm9yZU1hdGNoKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gYDxGcm9tIGV4dGVuZHMgc3RyaW5nPmBcbiAgICAgIC8vIHRlY2huaWNhbGx5IHRoaXMgY291bGQgYmUgSFRNTCwgYnV0IGl0IHNtZWxscyBsaWtlIGEgdHlwZVxuICAgICAgLy8gTk9URTogVGhpcyBpcyB1Z2gsIGJ1dCBhZGRlZCBzcGVjaWZpY2FsbHkgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9oaWdobGlnaHRqcy9oaWdobGlnaHQuanMvaXNzdWVzLzMyNzZcbiAgICAgIGlmICgobSA9IGFmdGVyTWF0Y2gubWF0Y2goL15cXHMrZXh0ZW5kc1xccysvKSkpIHtcbiAgICAgICAgaWYgKG0uaW5kZXggPT09IDApIHtcbiAgICAgICAgICByZXNwb25zZS5pZ25vcmVNYXRjaCgpO1xuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11c2VsZXNzLXJldHVyblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcbiAgY29uc3QgS0VZV09SRFMkMSA9IHtcbiAgICAkcGF0dGVybjogSURFTlRfUkUsXG4gICAga2V5d29yZDogS0VZV09SRFMsXG4gICAgbGl0ZXJhbDogTElURVJBTFMsXG4gICAgYnVpbHRfaW46IEJVSUxUX0lOUyxcbiAgICBcInZhcmlhYmxlLmxhbmd1YWdlXCI6IEJVSUxUX0lOX1ZBUklBQkxFU1xuICB9O1xuXG4gIC8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNzZWMtbGl0ZXJhbHMtbnVtZXJpYy1saXRlcmFsc1xuICBjb25zdCBkZWNpbWFsRGlnaXRzID0gJ1swLTldKF8/WzAtOV0pKic7XG4gIGNvbnN0IGZyYWMgPSBgXFxcXC4oJHtkZWNpbWFsRGlnaXRzfSlgO1xuICAvLyBEZWNpbWFsSW50ZWdlckxpdGVyYWwsIGluY2x1ZGluZyBBbm5leCBCIE5vbk9jdGFsRGVjaW1hbEludGVnZXJMaXRlcmFsXG4gIC8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNzZWMtYWRkaXRpb25hbC1zeW50YXgtbnVtZXJpYy1saXRlcmFsc1xuICBjb25zdCBkZWNpbWFsSW50ZWdlciA9IGAwfFsxLTldKF8/WzAtOV0pKnwwWzAtN10qWzg5XVswLTldKmA7XG4gIGNvbnN0IE5VTUJFUiA9IHtcbiAgICBjbGFzc05hbWU6ICdudW1iZXInLFxuICAgIHZhcmlhbnRzOiBbXG4gICAgICAvLyBEZWNpbWFsTGl0ZXJhbFxuICAgICAgeyBiZWdpbjogYChcXFxcYigke2RlY2ltYWxJbnRlZ2VyfSkoKCR7ZnJhY30pfFxcXFwuKT98KCR7ZnJhY30pKWAgK1xuICAgICAgICBgW2VFXVsrLV0/KCR7ZGVjaW1hbERpZ2l0c30pXFxcXGJgIH0sXG4gICAgICB7IGJlZ2luOiBgXFxcXGIoJHtkZWNpbWFsSW50ZWdlcn0pXFxcXGIoKCR7ZnJhY30pXFxcXGJ8XFxcXC4pP3woJHtmcmFjfSlcXFxcYmAgfSxcblxuICAgICAgLy8gRGVjaW1hbEJpZ0ludGVnZXJMaXRlcmFsXG4gICAgICB7IGJlZ2luOiBgXFxcXGIoMHxbMS05XShfP1swLTldKSopblxcXFxiYCB9LFxuXG4gICAgICAvLyBOb25EZWNpbWFsSW50ZWdlckxpdGVyYWxcbiAgICAgIHsgYmVnaW46IFwiXFxcXGIwW3hYXVswLTlhLWZBLUZdKF8/WzAtOWEtZkEtRl0pKm4/XFxcXGJcIiB9LFxuICAgICAgeyBiZWdpbjogXCJcXFxcYjBbYkJdWzAtMV0oXz9bMC0xXSkqbj9cXFxcYlwiIH0sXG4gICAgICB7IGJlZ2luOiBcIlxcXFxiMFtvT11bMC03XShfP1swLTddKSpuP1xcXFxiXCIgfSxcblxuICAgICAgLy8gTGVnYWN5T2N0YWxJbnRlZ2VyTGl0ZXJhbCAoZG9lcyBub3QgaW5jbHVkZSB1bmRlcnNjb3JlIHNlcGFyYXRvcnMpXG4gICAgICAvLyBodHRwczovL3RjMzkuZXMvZWNtYTI2Mi8jc2VjLWFkZGl0aW9uYWwtc3ludGF4LW51bWVyaWMtbGl0ZXJhbHNcbiAgICAgIHsgYmVnaW46IFwiXFxcXGIwWzAtN10rbj9cXFxcYlwiIH0sXG4gICAgXSxcbiAgICByZWxldmFuY2U6IDBcbiAgfTtcblxuICBjb25zdCBTVUJTVCA9IHtcbiAgICBjbGFzc05hbWU6ICdzdWJzdCcsXG4gICAgYmVnaW46ICdcXFxcJFxcXFx7JyxcbiAgICBlbmQ6ICdcXFxcfScsXG4gICAga2V5d29yZHM6IEtFWVdPUkRTJDEsXG4gICAgY29udGFpbnM6IFtdIC8vIGRlZmluZWQgbGF0ZXJcbiAgfTtcbiAgY29uc3QgSFRNTF9URU1QTEFURSA9IHtcbiAgICBiZWdpbjogJ1xcLj9odG1sYCcsXG4gICAgZW5kOiAnJyxcbiAgICBzdGFydHM6IHtcbiAgICAgIGVuZDogJ2AnLFxuICAgICAgcmV0dXJuRW5kOiBmYWxzZSxcbiAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgIGhsanMuQkFDS1NMQVNIX0VTQ0FQRSxcbiAgICAgICAgU1VCU1RcbiAgICAgIF0sXG4gICAgICBzdWJMYW5ndWFnZTogJ3htbCdcbiAgICB9XG4gIH07XG4gIGNvbnN0IENTU19URU1QTEFURSA9IHtcbiAgICBiZWdpbjogJ1xcLj9jc3NgJyxcbiAgICBlbmQ6ICcnLFxuICAgIHN0YXJ0czoge1xuICAgICAgZW5kOiAnYCcsXG4gICAgICByZXR1cm5FbmQ6IGZhbHNlLFxuICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgaGxqcy5CQUNLU0xBU0hfRVNDQVBFLFxuICAgICAgICBTVUJTVFxuICAgICAgXSxcbiAgICAgIHN1Ykxhbmd1YWdlOiAnY3NzJ1xuICAgIH1cbiAgfTtcbiAgY29uc3QgR1JBUEhRTF9URU1QTEFURSA9IHtcbiAgICBiZWdpbjogJ1xcLj9ncWxgJyxcbiAgICBlbmQ6ICcnLFxuICAgIHN0YXJ0czoge1xuICAgICAgZW5kOiAnYCcsXG4gICAgICByZXR1cm5FbmQ6IGZhbHNlLFxuICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgaGxqcy5CQUNLU0xBU0hfRVNDQVBFLFxuICAgICAgICBTVUJTVFxuICAgICAgXSxcbiAgICAgIHN1Ykxhbmd1YWdlOiAnZ3JhcGhxbCdcbiAgICB9XG4gIH07XG4gIGNvbnN0IFRFTVBMQVRFX1NUUklORyA9IHtcbiAgICBjbGFzc05hbWU6ICdzdHJpbmcnLFxuICAgIGJlZ2luOiAnYCcsXG4gICAgZW5kOiAnYCcsXG4gICAgY29udGFpbnM6IFtcbiAgICAgIGhsanMuQkFDS1NMQVNIX0VTQ0FQRSxcbiAgICAgIFNVQlNUXG4gICAgXVxuICB9O1xuICBjb25zdCBKU0RPQ19DT01NRU5UID0gaGxqcy5DT01NRU5UKFxuICAgIC9cXC9cXCpcXCooPyFcXC8pLyxcbiAgICAnXFxcXCovJyxcbiAgICB7XG4gICAgICByZWxldmFuY2U6IDAsXG4gICAgICBjb250YWluczogW1xuICAgICAgICB7XG4gICAgICAgICAgYmVnaW46ICcoPz1AW0EtWmEtel0rKScsXG4gICAgICAgICAgcmVsZXZhbmNlOiAwLFxuICAgICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGNsYXNzTmFtZTogJ2RvY3RhZycsXG4gICAgICAgICAgICAgIGJlZ2luOiAnQFtBLVphLXpdKydcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGNsYXNzTmFtZTogJ3R5cGUnLFxuICAgICAgICAgICAgICBiZWdpbjogJ1xcXFx7JyxcbiAgICAgICAgICAgICAgZW5kOiAnXFxcXH0nLFxuICAgICAgICAgICAgICBleGNsdWRlRW5kOiB0cnVlLFxuICAgICAgICAgICAgICBleGNsdWRlQmVnaW46IHRydWUsXG4gICAgICAgICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgY2xhc3NOYW1lOiAndmFyaWFibGUnLFxuICAgICAgICAgICAgICBiZWdpbjogSURFTlRfUkUkMSArICcoPz1cXFxccyooLSl8JCknLFxuICAgICAgICAgICAgICBlbmRzUGFyZW50OiB0cnVlLFxuICAgICAgICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvLyBlYXQgc3BhY2VzIChub3QgbmV3bGluZXMpIHNvIHdlIGNhbiBmaW5kXG4gICAgICAgICAgICAvLyB0eXBlcyBvciB2YXJpYWJsZXNcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgYmVnaW46IC8oPz1bXlxcbl0pXFxzLyxcbiAgICAgICAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9XG4gICAgICBdXG4gICAgfVxuICApO1xuICBjb25zdCBDT01NRU5UID0ge1xuICAgIGNsYXNzTmFtZTogXCJjb21tZW50XCIsXG4gICAgdmFyaWFudHM6IFtcbiAgICAgIEpTRE9DX0NPTU1FTlQsXG4gICAgICBobGpzLkNfQkxPQ0tfQ09NTUVOVF9NT0RFLFxuICAgICAgaGxqcy5DX0xJTkVfQ09NTUVOVF9NT0RFXG4gICAgXVxuICB9O1xuICBjb25zdCBTVUJTVF9JTlRFUk5BTFMgPSBbXG4gICAgaGxqcy5BUE9TX1NUUklOR19NT0RFLFxuICAgIGhsanMuUVVPVEVfU1RSSU5HX01PREUsXG4gICAgSFRNTF9URU1QTEFURSxcbiAgICBDU1NfVEVNUExBVEUsXG4gICAgR1JBUEhRTF9URU1QTEFURSxcbiAgICBURU1QTEFURV9TVFJJTkcsXG4gICAgLy8gU2tpcCBudW1iZXJzIHdoZW4gdGhleSBhcmUgcGFydCBvZiBhIHZhcmlhYmxlIG5hbWVcbiAgICB7IG1hdGNoOiAvXFwkXFxkKy8gfSxcbiAgICBOVU1CRVIsXG4gICAgLy8gVGhpcyBpcyBpbnRlbnRpb25hbDpcbiAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2hpZ2hsaWdodGpzL2hpZ2hsaWdodC5qcy9pc3N1ZXMvMzI4OFxuICAgIC8vIGhsanMuUkVHRVhQX01PREVcbiAgXTtcbiAgU1VCU1QuY29udGFpbnMgPSBTVUJTVF9JTlRFUk5BTFNcbiAgICAuY29uY2F0KHtcbiAgICAgIC8vIHdlIG5lZWQgdG8gcGFpciB1cCB7fSBpbnNpZGUgb3VyIHN1YnN0IHRvIHByZXZlbnRcbiAgICAgIC8vIGl0IGZyb20gZW5kaW5nIHRvbyBlYXJseSBieSBtYXRjaGluZyBhbm90aGVyIH1cbiAgICAgIGJlZ2luOiAvXFx7LyxcbiAgICAgIGVuZDogL1xcfS8sXG4gICAgICBrZXl3b3JkczogS0VZV09SRFMkMSxcbiAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgIFwic2VsZlwiXG4gICAgICBdLmNvbmNhdChTVUJTVF9JTlRFUk5BTFMpXG4gICAgfSk7XG4gIGNvbnN0IFNVQlNUX0FORF9DT01NRU5UUyA9IFtdLmNvbmNhdChDT01NRU5ULCBTVUJTVC5jb250YWlucyk7XG4gIGNvbnN0IFBBUkFNU19DT05UQUlOUyA9IFNVQlNUX0FORF9DT01NRU5UUy5jb25jYXQoW1xuICAgIC8vIGVhdCByZWN1cnNpdmUgcGFyZW5zIGluIHN1YiBleHByZXNzaW9uc1xuICAgIHtcbiAgICAgIGJlZ2luOiAvKFxccyopXFwoLyxcbiAgICAgIGVuZDogL1xcKS8sXG4gICAgICBrZXl3b3JkczogS0VZV09SRFMkMSxcbiAgICAgIGNvbnRhaW5zOiBbXCJzZWxmXCJdLmNvbmNhdChTVUJTVF9BTkRfQ09NTUVOVFMpXG4gICAgfVxuICBdKTtcbiAgY29uc3QgUEFSQU1TID0ge1xuICAgIGNsYXNzTmFtZTogJ3BhcmFtcycsXG4gICAgLy8gY29udmVydCB0aGlzIHRvIG5lZ2F0aXZlIGxvb2tiZWhpbmQgaW4gdjEyXG4gICAgYmVnaW46IC8oXFxzKilcXCgvLCAvLyB0byBtYXRjaCB0aGUgcGFybXMgd2l0aFxuICAgIGVuZDogL1xcKS8sXG4gICAgZXhjbHVkZUJlZ2luOiB0cnVlLFxuICAgIGV4Y2x1ZGVFbmQ6IHRydWUsXG4gICAga2V5d29yZHM6IEtFWVdPUkRTJDEsXG4gICAgY29udGFpbnM6IFBBUkFNU19DT05UQUlOU1xuICB9O1xuXG4gIC8vIEVTNiBjbGFzc2VzXG4gIGNvbnN0IENMQVNTX09SX0VYVEVORFMgPSB7XG4gICAgdmFyaWFudHM6IFtcbiAgICAgIC8vIGNsYXNzIENhciBleHRlbmRzIHZlaGljbGVcbiAgICAgIHtcbiAgICAgICAgbWF0Y2g6IFtcbiAgICAgICAgICAvY2xhc3MvLFxuICAgICAgICAgIC9cXHMrLyxcbiAgICAgICAgICBJREVOVF9SRSQxLFxuICAgICAgICAgIC9cXHMrLyxcbiAgICAgICAgICAvZXh0ZW5kcy8sXG4gICAgICAgICAgL1xccysvLFxuICAgICAgICAgIHJlZ2V4LmNvbmNhdChJREVOVF9SRSQxLCBcIihcIiwgcmVnZXguY29uY2F0KC9cXC4vLCBJREVOVF9SRSQxKSwgXCIpKlwiKVxuICAgICAgICBdLFxuICAgICAgICBzY29wZToge1xuICAgICAgICAgIDE6IFwia2V5d29yZFwiLFxuICAgICAgICAgIDM6IFwidGl0bGUuY2xhc3NcIixcbiAgICAgICAgICA1OiBcImtleXdvcmRcIixcbiAgICAgICAgICA3OiBcInRpdGxlLmNsYXNzLmluaGVyaXRlZFwiXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAvLyBjbGFzcyBDYXJcbiAgICAgIHtcbiAgICAgICAgbWF0Y2g6IFtcbiAgICAgICAgICAvY2xhc3MvLFxuICAgICAgICAgIC9cXHMrLyxcbiAgICAgICAgICBJREVOVF9SRSQxXG4gICAgICAgIF0sXG4gICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgMTogXCJrZXl3b3JkXCIsXG4gICAgICAgICAgMzogXCJ0aXRsZS5jbGFzc1wiXG4gICAgICAgIH1cbiAgICAgIH0sXG5cbiAgICBdXG4gIH07XG5cbiAgY29uc3QgQ0xBU1NfUkVGRVJFTkNFID0ge1xuICAgIHJlbGV2YW5jZTogMCxcbiAgICBtYXRjaDpcbiAgICByZWdleC5laXRoZXIoXG4gICAgICAvLyBIYXJkIGNvZGVkIGV4Y2VwdGlvbnNcbiAgICAgIC9cXGJKU09OLyxcbiAgICAgIC8vIEZsb2F0MzJBcnJheSwgT3V0VFxuICAgICAgL1xcYltBLVpdW2Etel0rKFtBLVpdW2Etel0qfFxcZCkqLyxcbiAgICAgIC8vIENTU0ZhY3RvcnksIENTU0ZhY3RvcnlUXG4gICAgICAvXFxiW0EtWl17Mix9KFtBLVpdW2Etel0rfFxcZCkrKFtBLVpdW2Etel0qKSovLFxuICAgICAgLy8gRlBzLCBGUHNUXG4gICAgICAvXFxiW0EtWl17Mix9W2Etel0rKFtBLVpdW2Etel0rfFxcZCkqKFtBLVpdW2Etel0qKSovLFxuICAgICAgLy8gUFxuICAgICAgLy8gc2luZ2xlIGxldHRlcnMgYXJlIG5vdCBoaWdobGlnaHRlZFxuICAgICAgLy8gQkxBSFxuICAgICAgLy8gdGhpcyB3aWxsIGJlIGZsYWdnZWQgYXMgYSBVUFBFUl9DQVNFX0NPTlNUQU5UIGluc3RlYWRcbiAgICApLFxuICAgIGNsYXNzTmFtZTogXCJ0aXRsZS5jbGFzc1wiLFxuICAgIGtleXdvcmRzOiB7XG4gICAgICBfOiBbXG4gICAgICAgIC8vIHNlIHdlIHN0aWxsIGdldCByZWxldmFuY2UgY3JlZGl0IGZvciBKUyBsaWJyYXJ5IGNsYXNzZXNcbiAgICAgICAgLi4uVFlQRVMsXG4gICAgICAgIC4uLkVSUk9SX1RZUEVTXG4gICAgICBdXG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IFVTRV9TVFJJQ1QgPSB7XG4gICAgbGFiZWw6IFwidXNlX3N0cmljdFwiLFxuICAgIGNsYXNzTmFtZTogJ21ldGEnLFxuICAgIHJlbGV2YW5jZTogMTAsXG4gICAgYmVnaW46IC9eXFxzKlsnXCJddXNlIChzdHJpY3R8YXNtKVsnXCJdL1xuICB9O1xuXG4gIGNvbnN0IEZVTkNUSU9OX0RFRklOSVRJT04gPSB7XG4gICAgdmFyaWFudHM6IFtcbiAgICAgIHtcbiAgICAgICAgbWF0Y2g6IFtcbiAgICAgICAgICAvZnVuY3Rpb24vLFxuICAgICAgICAgIC9cXHMrLyxcbiAgICAgICAgICBJREVOVF9SRSQxLFxuICAgICAgICAgIC8oPz1cXHMqXFwoKS9cbiAgICAgICAgXVxuICAgICAgfSxcbiAgICAgIC8vIGFub255bW91cyBmdW5jdGlvblxuICAgICAge1xuICAgICAgICBtYXRjaDogW1xuICAgICAgICAgIC9mdW5jdGlvbi8sXG4gICAgICAgICAgL1xccyooPz1cXCgpL1xuICAgICAgICBdXG4gICAgICB9XG4gICAgXSxcbiAgICBjbGFzc05hbWU6IHtcbiAgICAgIDE6IFwia2V5d29yZFwiLFxuICAgICAgMzogXCJ0aXRsZS5mdW5jdGlvblwiXG4gICAgfSxcbiAgICBsYWJlbDogXCJmdW5jLmRlZlwiLFxuICAgIGNvbnRhaW5zOiBbIFBBUkFNUyBdLFxuICAgIGlsbGVnYWw6IC8lL1xuICB9O1xuXG4gIGNvbnN0IFVQUEVSX0NBU0VfQ09OU1RBTlQgPSB7XG4gICAgcmVsZXZhbmNlOiAwLFxuICAgIG1hdGNoOiAvXFxiW0EtWl1bQS1aXzAtOV0rXFxiLyxcbiAgICBjbGFzc05hbWU6IFwidmFyaWFibGUuY29uc3RhbnRcIlxuICB9O1xuXG4gIGZ1bmN0aW9uIG5vbmVPZihsaXN0KSB7XG4gICAgcmV0dXJuIHJlZ2V4LmNvbmNhdChcIig/IVwiLCBsaXN0LmpvaW4oXCJ8XCIpLCBcIilcIik7XG4gIH1cblxuICBjb25zdCBGVU5DVElPTl9DQUxMID0ge1xuICAgIG1hdGNoOiByZWdleC5jb25jYXQoXG4gICAgICAvXFxiLyxcbiAgICAgIG5vbmVPZihbXG4gICAgICAgIC4uLkJVSUxUX0lOX0dMT0JBTFMsXG4gICAgICAgIFwic3VwZXJcIixcbiAgICAgICAgXCJpbXBvcnRcIlxuICAgICAgXS5tYXAoeCA9PiBgJHt4fVxcXFxzKlxcXFwoYCkpLFxuICAgICAgSURFTlRfUkUkMSwgcmVnZXgubG9va2FoZWFkKC9cXHMqXFwoLykpLFxuICAgIGNsYXNzTmFtZTogXCJ0aXRsZS5mdW5jdGlvblwiLFxuICAgIHJlbGV2YW5jZTogMFxuICB9O1xuXG4gIGNvbnN0IFBST1BFUlRZX0FDQ0VTUyA9IHtcbiAgICBiZWdpbjogcmVnZXguY29uY2F0KC9cXC4vLCByZWdleC5sb29rYWhlYWQoXG4gICAgICByZWdleC5jb25jYXQoSURFTlRfUkUkMSwgLyg/IVswLTlBLVphLXokXyhdKS8pXG4gICAgKSksXG4gICAgZW5kOiBJREVOVF9SRSQxLFxuICAgIGV4Y2x1ZGVCZWdpbjogdHJ1ZSxcbiAgICBrZXl3b3JkczogXCJwcm90b3R5cGVcIixcbiAgICBjbGFzc05hbWU6IFwicHJvcGVydHlcIixcbiAgICByZWxldmFuY2U6IDBcbiAgfTtcblxuICBjb25zdCBHRVRURVJfT1JfU0VUVEVSID0ge1xuICAgIG1hdGNoOiBbXG4gICAgICAvZ2V0fHNldC8sXG4gICAgICAvXFxzKy8sXG4gICAgICBJREVOVF9SRSQxLFxuICAgICAgLyg/PVxcKCkvXG4gICAgXSxcbiAgICBjbGFzc05hbWU6IHtcbiAgICAgIDE6IFwia2V5d29yZFwiLFxuICAgICAgMzogXCJ0aXRsZS5mdW5jdGlvblwiXG4gICAgfSxcbiAgICBjb250YWluczogW1xuICAgICAgeyAvLyBlYXQgdG8gYXZvaWQgZW1wdHkgcGFyYW1zXG4gICAgICAgIGJlZ2luOiAvXFwoXFwpL1xuICAgICAgfSxcbiAgICAgIFBBUkFNU1xuICAgIF1cbiAgfTtcblxuICBjb25zdCBGVU5DX0xFQURfSU5fUkUgPSAnKFxcXFwoJyArXG4gICAgJ1teKCldKihcXFxcKCcgK1xuICAgICdbXigpXSooXFxcXCgnICtcbiAgICAnW14oKV0qJyArXG4gICAgJ1xcXFwpW14oKV0qKSonICtcbiAgICAnXFxcXClbXigpXSopKicgK1xuICAgICdcXFxcKXwnICsgaGxqcy5VTkRFUlNDT1JFX0lERU5UX1JFICsgJylcXFxccyo9Pic7XG5cbiAgY29uc3QgRlVOQ1RJT05fVkFSSUFCTEUgPSB7XG4gICAgbWF0Y2g6IFtcbiAgICAgIC9jb25zdHx2YXJ8bGV0LywgL1xccysvLFxuICAgICAgSURFTlRfUkUkMSwgL1xccyovLFxuICAgICAgLz1cXHMqLyxcbiAgICAgIC8oYXN5bmNcXHMqKT8vLCAvLyBhc3luYyBpcyBvcHRpb25hbFxuICAgICAgcmVnZXgubG9va2FoZWFkKEZVTkNfTEVBRF9JTl9SRSlcbiAgICBdLFxuICAgIGtleXdvcmRzOiBcImFzeW5jXCIsXG4gICAgY2xhc3NOYW1lOiB7XG4gICAgICAxOiBcImtleXdvcmRcIixcbiAgICAgIDM6IFwidGl0bGUuZnVuY3Rpb25cIlxuICAgIH0sXG4gICAgY29udGFpbnM6IFtcbiAgICAgIFBBUkFNU1xuICAgIF1cbiAgfTtcblxuICByZXR1cm4ge1xuICAgIG5hbWU6ICdKYXZhU2NyaXB0JyxcbiAgICBhbGlhc2VzOiBbJ2pzJywgJ2pzeCcsICdtanMnLCAnY2pzJ10sXG4gICAga2V5d29yZHM6IEtFWVdPUkRTJDEsXG4gICAgLy8gdGhpcyB3aWxsIGJlIGV4dGVuZGVkIGJ5IFR5cGVTY3JpcHRcbiAgICBleHBvcnRzOiB7IFBBUkFNU19DT05UQUlOUywgQ0xBU1NfUkVGRVJFTkNFIH0sXG4gICAgaWxsZWdhbDogLyMoPyFbJF9BLXpdKS8sXG4gICAgY29udGFpbnM6IFtcbiAgICAgIGhsanMuU0hFQkFORyh7XG4gICAgICAgIGxhYmVsOiBcInNoZWJhbmdcIixcbiAgICAgICAgYmluYXJ5OiBcIm5vZGVcIixcbiAgICAgICAgcmVsZXZhbmNlOiA1XG4gICAgICB9KSxcbiAgICAgIFVTRV9TVFJJQ1QsXG4gICAgICBobGpzLkFQT1NfU1RSSU5HX01PREUsXG4gICAgICBobGpzLlFVT1RFX1NUUklOR19NT0RFLFxuICAgICAgSFRNTF9URU1QTEFURSxcbiAgICAgIENTU19URU1QTEFURSxcbiAgICAgIEdSQVBIUUxfVEVNUExBVEUsXG4gICAgICBURU1QTEFURV9TVFJJTkcsXG4gICAgICBDT01NRU5ULFxuICAgICAgLy8gU2tpcCBudW1iZXJzIHdoZW4gdGhleSBhcmUgcGFydCBvZiBhIHZhcmlhYmxlIG5hbWVcbiAgICAgIHsgbWF0Y2g6IC9cXCRcXGQrLyB9LFxuICAgICAgTlVNQkVSLFxuICAgICAgQ0xBU1NfUkVGRVJFTkNFLFxuICAgICAge1xuICAgICAgICBzY29wZTogJ2F0dHInLFxuICAgICAgICBtYXRjaDogSURFTlRfUkUkMSArIHJlZ2V4Lmxvb2thaGVhZCgnOicpLFxuICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgIH0sXG4gICAgICBGVU5DVElPTl9WQVJJQUJMRSxcbiAgICAgIHsgLy8gXCJ2YWx1ZVwiIGNvbnRhaW5lclxuICAgICAgICBiZWdpbjogJygnICsgaGxqcy5SRV9TVEFSVEVSU19SRSArICd8XFxcXGIoY2FzZXxyZXR1cm58dGhyb3cpXFxcXGIpXFxcXHMqJyxcbiAgICAgICAga2V5d29yZHM6ICdyZXR1cm4gdGhyb3cgY2FzZScsXG4gICAgICAgIHJlbGV2YW5jZTogMCxcbiAgICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgICBDT01NRU5ULFxuICAgICAgICAgIGhsanMuUkVHRVhQX01PREUsXG4gICAgICAgICAge1xuICAgICAgICAgICAgY2xhc3NOYW1lOiAnZnVuY3Rpb24nLFxuICAgICAgICAgICAgLy8gd2UgaGF2ZSB0byBjb3VudCB0aGUgcGFyZW5zIHRvIG1ha2Ugc3VyZSB3ZSBhY3R1YWxseSBoYXZlIHRoZVxuICAgICAgICAgICAgLy8gY29ycmVjdCBib3VuZGluZyAoICkgYmVmb3JlIHRoZSA9Pi4gIFRoZXJlIGNvdWxkIGJlIGFueSBudW1iZXIgb2ZcbiAgICAgICAgICAgIC8vIHN1Yi1leHByZXNzaW9ucyBpbnNpZGUgYWxzbyBzdXJyb3VuZGVkIGJ5IHBhcmVucy5cbiAgICAgICAgICAgIGJlZ2luOiBGVU5DX0xFQURfSU5fUkUsXG4gICAgICAgICAgICByZXR1cm5CZWdpbjogdHJ1ZSxcbiAgICAgICAgICAgIGVuZDogJ1xcXFxzKj0+JyxcbiAgICAgICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU6ICdwYXJhbXMnLFxuICAgICAgICAgICAgICAgIHZhcmlhbnRzOiBbXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGJlZ2luOiBobGpzLlVOREVSU0NPUkVfSURFTlRfUkUsXG4gICAgICAgICAgICAgICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBiZWdpbjogL1xcKFxccypcXCkvLFxuICAgICAgICAgICAgICAgICAgICBza2lwOiB0cnVlXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBiZWdpbjogLyhcXHMqKVxcKC8sXG4gICAgICAgICAgICAgICAgICAgIGVuZDogL1xcKS8sXG4gICAgICAgICAgICAgICAgICAgIGV4Y2x1ZGVCZWdpbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZXhjbHVkZUVuZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAga2V5d29yZHM6IEtFWVdPUkRTJDEsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRhaW5zOiBQQVJBTVNfQ09OVEFJTlNcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9LFxuICAgICAgICAgIHsgLy8gY291bGQgYmUgYSBjb21tYSBkZWxpbWl0ZWQgbGlzdCBvZiBwYXJhbXMgdG8gYSBmdW5jdGlvbiBjYWxsXG4gICAgICAgICAgICBiZWdpbjogLywvLFxuICAgICAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBtYXRjaDogL1xccysvLFxuICAgICAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7IC8vIEpTWFxuICAgICAgICAgICAgdmFyaWFudHM6IFtcbiAgICAgICAgICAgICAgeyBiZWdpbjogRlJBR01FTlQuYmVnaW4sIGVuZDogRlJBR01FTlQuZW5kIH0sXG4gICAgICAgICAgICAgIHsgbWF0Y2g6IFhNTF9TRUxGX0NMT1NJTkcgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGJlZ2luOiBYTUxfVEFHLmJlZ2luLFxuICAgICAgICAgICAgICAgIC8vIHdlIGNhcmVmdWxseSBjaGVjayB0aGUgb3BlbmluZyB0YWcgdG8gc2VlIGlmIGl0IHRydWx5XG4gICAgICAgICAgICAgICAgLy8gaXMgYSB0YWcgYW5kIG5vdCBhIGZhbHNlIHBvc2l0aXZlXG4gICAgICAgICAgICAgICAgJ29uOmJlZ2luJzogWE1MX1RBRy5pc1RydWx5T3BlbmluZ1RhZyxcbiAgICAgICAgICAgICAgICBlbmQ6IFhNTF9UQUcuZW5kXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBzdWJMYW5ndWFnZTogJ3htbCcsXG4gICAgICAgICAgICBjb250YWluczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYmVnaW46IFhNTF9UQUcuYmVnaW4sXG4gICAgICAgICAgICAgICAgZW5kOiBYTUxfVEFHLmVuZCxcbiAgICAgICAgICAgICAgICBza2lwOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbnRhaW5zOiBbJ3NlbGYnXVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgICAgfVxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIEZVTkNUSU9OX0RFRklOSVRJT04sXG4gICAgICB7XG4gICAgICAgIC8vIHByZXZlbnQgdGhpcyBmcm9tIGdldHRpbmcgc3dhbGxvd2VkIHVwIGJ5IGZ1bmN0aW9uXG4gICAgICAgIC8vIHNpbmNlIHRoZXkgYXBwZWFyIFwiZnVuY3Rpb24gbGlrZVwiXG4gICAgICAgIGJlZ2luS2V5d29yZHM6IFwid2hpbGUgaWYgc3dpdGNoIGNhdGNoIGZvclwiXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICAvLyB3ZSBoYXZlIHRvIGNvdW50IHRoZSBwYXJlbnMgdG8gbWFrZSBzdXJlIHdlIGFjdHVhbGx5IGhhdmUgdGhlIGNvcnJlY3RcbiAgICAgICAgLy8gYm91bmRpbmcgKCApLiAgVGhlcmUgY291bGQgYmUgYW55IG51bWJlciBvZiBzdWItZXhwcmVzc2lvbnMgaW5zaWRlXG4gICAgICAgIC8vIGFsc28gc3Vycm91bmRlZCBieSBwYXJlbnMuXG4gICAgICAgIGJlZ2luOiAnXFxcXGIoPyFmdW5jdGlvbiknICsgaGxqcy5VTkRFUlNDT1JFX0lERU5UX1JFICtcbiAgICAgICAgICAnXFxcXCgnICsgLy8gZmlyc3QgcGFyZW5zXG4gICAgICAgICAgJ1teKCldKihcXFxcKCcgK1xuICAgICAgICAgICAgJ1teKCldKihcXFxcKCcgK1xuICAgICAgICAgICAgICAnW14oKV0qJyArXG4gICAgICAgICAgICAnXFxcXClbXigpXSopKicgK1xuICAgICAgICAgICdcXFxcKVteKCldKikqJyArXG4gICAgICAgICAgJ1xcXFwpXFxcXHMqXFxcXHsnLCAvLyBlbmQgcGFyZW5zXG4gICAgICAgIHJldHVybkJlZ2luOnRydWUsXG4gICAgICAgIGxhYmVsOiBcImZ1bmMuZGVmXCIsXG4gICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAgUEFSQU1TLFxuICAgICAgICAgIGhsanMuaW5oZXJpdChobGpzLlRJVExFX01PREUsIHsgYmVnaW46IElERU5UX1JFJDEsIGNsYXNzTmFtZTogXCJ0aXRsZS5mdW5jdGlvblwiIH0pXG4gICAgICAgIF1cbiAgICAgIH0sXG4gICAgICAvLyBjYXRjaCAuLi4gc28gaXQgd29uJ3QgdHJpZ2dlciB0aGUgcHJvcGVydHkgcnVsZSBiZWxvd1xuICAgICAge1xuICAgICAgICBtYXRjaDogL1xcLlxcLlxcLi8sXG4gICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgfSxcbiAgICAgIFBST1BFUlRZX0FDQ0VTUyxcbiAgICAgIC8vIGhhY2s6IHByZXZlbnRzIGRldGVjdGlvbiBvZiBrZXl3b3JkcyBpbiBzb21lIGNpcmN1bXN0YW5jZXNcbiAgICAgIC8vIC5rZXl3b3JkKClcbiAgICAgIC8vICRrZXl3b3JkID0geFxuICAgICAge1xuICAgICAgICBtYXRjaDogJ1xcXFwkJyArIElERU5UX1JFJDEsXG4gICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbWF0Y2g6IFsgL1xcYmNvbnN0cnVjdG9yKD89XFxzKlxcKCkvIF0sXG4gICAgICAgIGNsYXNzTmFtZTogeyAxOiBcInRpdGxlLmZ1bmN0aW9uXCIgfSxcbiAgICAgICAgY29udGFpbnM6IFsgUEFSQU1TIF1cbiAgICAgIH0sXG4gICAgICBGVU5DVElPTl9DQUxMLFxuICAgICAgVVBQRVJfQ0FTRV9DT05TVEFOVCxcbiAgICAgIENMQVNTX09SX0VYVEVORFMsXG4gICAgICBHRVRURVJfT1JfU0VUVEVSLFxuICAgICAge1xuICAgICAgICBtYXRjaDogL1xcJFsoLl0vIC8vIHJlbGV2YW5jZSBib29zdGVyIGZvciBhIHBhdHRlcm4gY29tbW9uIHRvIEpTIGxpYnM6IGAkKHNvbWV0aGluZylgIGFuZCBgJC5zb21ldGhpbmdgXG4gICAgICB9XG4gICAgXVxuICB9O1xufVxuXG5leHBvcnQgeyBqYXZhc2NyaXB0IGFzIGRlZmF1bHQgfTtcbiIsICIvKipcbiAqIFdlYnZpZXcgc3ludGF4IGhpZ2hsaWdodGluZy5cbiAqXG4gKiBoaWdobGlnaHQuanMgaXMgYnVuZGxlZCBpbnRvIHRoZSB3ZWJ2aWV3IG9ubHkuIFRoZSBob3N0IG5ldmVyIGhpZ2hsaWdodHMsIGFuZFxuICogYSBmYWlsdXJlIGFsd2F5cyBkZWdyYWRlcyB0byBwbGFpbiB0ZXh0OiB0aGUgcHJldmlldyBpcyBzdGlsbCByZWFkYWJsZS5cbiAqL1xuXG5pbXBvcnQgaGxqcyBmcm9tICdoaWdobGlnaHQuanMvbGliL2NvcmUnO1xuaW1wb3J0IGNwcCBmcm9tICdoaWdobGlnaHQuanMvbGliL2xhbmd1YWdlcy9jcHAnO1xuaW1wb3J0IGphdmFzY3JpcHQgZnJvbSAnaGlnaGxpZ2h0LmpzL2xpYi9sYW5ndWFnZXMvamF2YXNjcmlwdCc7XG5cbmhsanMucmVnaXN0ZXJMYW5ndWFnZSgnY3BwJywgY3BwKTtcbmhsanMucmVnaXN0ZXJMYW5ndWFnZSgnamF2YXNjcmlwdCcsIGphdmFzY3JpcHQpO1xuXG4vKipcbiAqIEB0eXBlZGVmIHt7dGV4dDogc3RyaW5nLCBjbGFzc05hbWU6IHN0cmluZ319IFByZXZpZXdUb2tlblxuICovXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGxhbmd1YWdlSWRcbiAqIEByZXR1cm5zIHt7bGFuZ3VhZ2U6IHN0cmluZ3xudWxsLCBkZWdyYWRlZDogYm9vbGVhbn19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlTGFuZ3VhZ2UobGFuZ3VhZ2VJZCkge1xuICBjb25zdCBpZCA9IFN0cmluZyhsYW5ndWFnZUlkID8/ICcnKS50b0xvd2VyQ2FzZSgpO1xuICBpZiAoaWQgPT09ICdjcHAnIHx8IGlkID09PSAnYysrJyB8fCBpZCA9PT0gJ2MnIHx8IGlkID09PSAnb2JqZWN0aXZlLWMrKycpIHtcbiAgICByZXR1cm4geyBsYW5ndWFnZTogJ2NwcCcsIGRlZ3JhZGVkOiBmYWxzZSB9O1xuICB9XG4gIGlmIChpZCA9PT0gJ2phdmFzY3JpcHQnIHx8IGlkID09PSAnanMnIHx8IGlkID09PSAnbWpzJyB8fCBpZCA9PT0gJ2NqcycpIHtcbiAgICByZXR1cm4geyBsYW5ndWFnZTogJ2phdmFzY3JpcHQnLCBkZWdyYWRlZDogZmFsc2UgfTtcbiAgfVxuICByZXR1cm4geyBsYW5ndWFnZTogbnVsbCwgZGVncmFkZWQ6IHRydWUgfTtcbn1cblxuLyoqXG4gKiBTcGxpdCBoaWdobGlnaHQuanMgSFRNTCBpbnRvIGxpbmVzIG9mIGNsYXNzZWQgdG9rZW5zLiBPbmx5IHRoZSBzbWFsbCBzdWJzZXRcbiAqIG9mIG1hcmt1cCB0aGF0IGhpZ2hsaWdodC5qcyBlbWl0cyBpcyB1bmRlcnN0b29kOyBhbnl0aGluZyBlbHNlIGJlY29tZXMgdGV4dC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gaHRtbFxuICogQHJldHVybnMge1ByZXZpZXdUb2tlbltdW119XG4gKi9cbmZ1bmN0aW9uIGh0bWxUb0xpbmVzKGh0bWwpIHtcbiAgLyoqIEB0eXBlIHtQcmV2aWV3VG9rZW5bXVtdfSAqL1xuICBjb25zdCBsaW5lcyA9IFtbXV07XG4gIGNvbnN0IHN0YWNrID0gW107XG4gIGNvbnN0IHBhdHRlcm4gPSAvPHNwYW4gY2xhc3M9XCIoW15cIl0rKVwiPnw8XFwvc3Bhbj58KFtePF0rKS9nO1xuICBsZXQgbWF0Y2g7XG4gIHdoaWxlICgobWF0Y2ggPSBwYXR0ZXJuLmV4ZWMoaHRtbCkpICE9PSBudWxsKSB7XG4gICAgaWYgKG1hdGNoWzFdKSB7XG4gICAgICBzdGFjay5wdXNoKG1hdGNoWzFdKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAobWF0Y2hbMF0gPT09ICc8L3NwYW4+Jykge1xuICAgICAgc3RhY2sucG9wKCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgdGV4dCA9IGRlY29kZUVudGl0aWVzKG1hdGNoWzJdID8/ICcnKTtcbiAgICBjb25zdCBwYXJ0cyA9IHRleHQuc3BsaXQoJ1xcbicpO1xuICAgIGZvciAoY29uc3QgW2luZGV4LCBwYXJ0XSBvZiBwYXJ0cy5lbnRyaWVzKCkpIHtcbiAgICAgIGlmIChpbmRleCA+IDApIHtcbiAgICAgICAgbGluZXMucHVzaChbXSk7XG4gICAgICB9XG4gICAgICBpZiAocGFydC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGxpbmVzW2xpbmVzLmxlbmd0aCAtIDFdLnB1c2goe1xuICAgICAgICAgIHRleHQ6IHBhcnQsXG4gICAgICAgICAgY2xhc3NOYW1lOiBzdGFjay5sZW5ndGggPiAwID8gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0gOiAnJyxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBsaW5lcztcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGRlY29kZUVudGl0aWVzKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZVxuICAgIC5yZXBsYWNlKC8mbHQ7L2csICc8JylcbiAgICAucmVwbGFjZSgvJmd0Oy9nLCAnPicpXG4gICAgLnJlcGxhY2UoLyZxdW90Oy9nLCAnXCInKVxuICAgIC5yZXBsYWNlKC8mI3gyNzsvZywgXCInXCIpXG4gICAgLnJlcGxhY2UoLyYjMzk7L2csIFwiJ1wiKVxuICAgIC5yZXBsYWNlKC8mYW1wOy9nLCAnJicpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gKiBAcmV0dXJucyB7UHJldmlld1Rva2VuW11bXX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBsYWluTGluZXModGV4dCkge1xuICByZXR1cm4gU3RyaW5nKHRleHQgPz8gJycpXG4gICAgLnNwbGl0KC9cXHJcXG58XFxyfFxcbi8pXG4gICAgLm1hcCgobGluZSkgPT4gKGxpbmUubGVuZ3RoID4gMCA/IFt7IHRleHQ6IGxpbmUsIGNsYXNzTmFtZTogJycgfV0gOiBbXSkpO1xufVxuXG4vKipcbiAqIEhpZ2hsaWdodCBhIHNvdXJjZSBzbGljZS4gTmV2ZXIgdGhyb3dzLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2VJZFxuICogQHJldHVybnMge3tsaW5lczogUHJldmlld1Rva2VuW11bXSwgZGVncmFkZWQ6IGJvb2xlYW59fVxuICovXG5leHBvcnQgZnVuY3Rpb24gaGlnaGxpZ2h0TGluZXModGV4dCwgbGFuZ3VhZ2VJZCkge1xuICBjb25zdCByZXNvbHZlZCA9IHJlc29sdmVMYW5ndWFnZShsYW5ndWFnZUlkKTtcbiAgaWYgKCFyZXNvbHZlZC5sYW5ndWFnZSkge1xuICAgIHJldHVybiB7IGxpbmVzOiBwbGFpbkxpbmVzKHRleHQpLCBkZWdyYWRlZDogdHJ1ZSB9O1xuICB9XG4gIHRyeSB7XG4gICAgY29uc3QgaHRtbCA9IGhsanMuaGlnaGxpZ2h0KFN0cmluZyh0ZXh0ID8/ICcnKSwgeyBsYW5ndWFnZTogcmVzb2x2ZWQubGFuZ3VhZ2UgfSkudmFsdWU7XG4gICAgcmV0dXJuIHsgbGluZXM6IGh0bWxUb0xpbmVzKGh0bWwpLCBkZWdyYWRlZDogZmFsc2UgfTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHsgbGluZXM6IHBsYWluTGluZXModGV4dCksIGRlZ3JhZGVkOiB0cnVlIH07XG4gIH1cbn1cbiIsICIvKipcbiAqIFdlYnZpZXcgZW50cnkgcG9pbnQuXG4gKlxuICogUmVzcG9uc2liaWxpdGllcyBhcmUgZGVsaWJlcmF0ZWx5IG5hcnJvdzogdGFsayBwcm90b2NvbCwgcmVuZGVyIHRoZSBEVE8sIHNob3dcbiAqIHNlbGVjdGlvbiBkZXRhaWxzLiBObyBhbmFseXNpcywgbm8gZmlsZSBhY2Nlc3MsIG5vIGdyYXBoIGNvbnN0cnVjdGlvbi5cbiAqL1xuXG5pbXBvcnQgeyBjcmVhdGVCcmlkZ2UgfSBmcm9tICcuLi9jb3JlL3Byb3RvY29sL2JyaWRnZS5qcyc7XG5pbXBvcnQgeyBESVJFQ1RJT05TLCBQUk9UT0NPTF9WRVJTSU9OIH0gZnJvbSAnLi4vY29yZS9wcm90b2NvbC9lbnZlbG9wZS5qcyc7XG5pbXBvcnQgeyB2YWxpZGF0ZUR0byB9IGZyb20gJy4uL2NvcmUvZ3JhcGgvZHRvLmpzJztcbmltcG9ydCB7IGNyZWF0ZVN2Z1JlbmRlcmVyIH0gZnJvbSAnLi4vdmlzdWFsaXphdGlvbi9yZW5kZXJlci9zdmdSZW5kZXJlci5qcyc7XG5pbXBvcnQgeyBidWlsZFByZXZpZXdNb2RlbCB9IGZyb20gJy4uL2NvcmUvc291cmNlL3ByZXNlbnRhdGlvbi5qcyc7XG5pbXBvcnQgeyByZXNvbHZlUHJldmlld1NldHRpbmdzIH0gZnJvbSAnLi4vY29yZS9zb3VyY2Uvc2V0dGluZ3MuanMnO1xuaW1wb3J0IHsgY2xhbXBFeHBsYW5hdGlvbkRlcHRoLCByZXNvbHZlRXhwbGFuYXRpb25TZXR0aW5ncyB9IGZyb20gJy4uL2NvcmUvZXhwbGFuYXRpb24vc2V0dGluZ3MuanMnO1xuaW1wb3J0IHsgY3JlYXRlUHJldmlld0NvbnRyb2xsZXIgfSBmcm9tICcuL3ByZXZpZXdDb250cm9sbGVyLmpzJztcbmltcG9ydCB7IGhpZ2hsaWdodExpbmVzIH0gZnJvbSAnLi9oaWdobGlnaHQuanMnO1xuXG5jb25zdCB2c2NvZGVBcGkgPSBhY3F1aXJlVnNDb2RlQXBpKCk7XG5cbmNvbnN0IHN2ZyA9IC8qKiBAdHlwZSB7U1ZHU1ZHRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1ncmFwaCcpKTtcbmNvbnN0IG1ldGEgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLW1ldGEnKSk7XG5jb25zdCBzdGF0dXMgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLXN0YXR1cycpKTtcbmNvbnN0IGJhbm5lciA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtYmFubmVyJykpO1xuY29uc3QgZW1wdHkgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWVtcHR5JykpO1xuY29uc3QgZGV0YWlsQm9keSA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtZGV0YWlsLWJvZHknKSk7XG5jb25zdCBsZWdlbmQgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWxlZ2VuZCcpKTtcbmNvbnN0IHJlbG9hZEJ1dHRvbiA9IC8qKiBAdHlwZSB7SFRNTEJ1dHRvbkVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtcmVmcmVzaCcpKTtcbmNvbnN0IGZ1bmN0aW9uUGlja2VyID0gLyoqIEB0eXBlIHtIVE1MU2VsZWN0RWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1mdW5jdGlvbicpXG4pO1xuY29uc3QgcHJldmlldyA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtcHJldmlldycpKTtcbmNvbnN0IHByZXZpZXdUaXRsZSA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtcHJldmlldy10aXRsZScpKTtcbmNvbnN0IHByZXZpZXdNZXRhID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1wcmV2aWV3LW1ldGEnKSk7XG5jb25zdCBwcmV2aWV3RXhwbGFpbiA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR8bnVsbH0gKi8gKFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtcHJldmlldy1leHBsYWluJylcbik7XG5jb25zdCBwcmV2aWV3Qm9keSA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtcHJldmlldy1ib2R5JykpO1xuY29uc3QgcHJldmlld05vdGUgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLXByZXZpZXctbm90ZScpKTtcbmNvbnN0IHByZXZpZXdQaW4gPSAvKiogQHR5cGUge0hUTUxCdXR0b25FbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLXByZXZpZXctcGluJykpO1xuY29uc3QgcHJldmlld0Nsb3NlID0gLyoqIEB0eXBlIHtIVE1MQnV0dG9uRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1wcmV2aWV3LWNsb3NlJykpO1xuY29uc3QgcHJldmlld09wZW4gPSAvKiogQHR5cGUge0hUTUxCdXR0b25FbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLXByZXZpZXctb3BlbicpKTtcbmNvbnN0IGZuU3VtbWFyeSA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR8bnVsbH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1mbi1zdW1tYXJ5JykpO1xuY29uc3QgZXhwbGFpblNlY3Rpb24gPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fG51bGx9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtZXhwbGFpbicpKTtcbmNvbnN0IGV4cGxhaW5EZXB0aFNlbGVjdCA9IC8qKiBAdHlwZSB7SFRNTFNlbGVjdEVsZW1lbnR8bnVsbH0gKi8gKFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtZXhwbGFpbi1kZXB0aCcpXG4pO1xuY29uc3QgZXhwbGFpbkl0ZW1zID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudHxudWxsfSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWV4cGxhaW4taXRlbXMnKSk7XG5jb25zdCBleHBsYWluRXZpZGVuY2UgPSAvKiogQHR5cGUge0hUTUxEZXRhaWxzRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1leHBsYWluLWV2aWRlbmNlJylcbik7XG5jb25zdCBleHBsYWluRXZpZGVuY2VMaXN0ID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1leHBsYWluLWV2aWRlbmNlLWxpc3QnKVxuKTtcbmNvbnN0IGV4cGxhaW5MaW1pdHMgPSAvKiogQHR5cGUge0hUTUxEZXRhaWxzRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1leHBsYWluLWxpbWl0cycpXG4pO1xuY29uc3QgZXhwbGFpbkxpbWl0c1RleHQgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fG51bGx9ICovIChcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWV4cGxhaW4tbGltaXRzLXRleHQnKVxuKTtcbmNvbnN0IHBlcnNwZWN0aXZlU2VsZWN0ID0gLyoqIEB0eXBlIHtIVE1MU2VsZWN0RWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1wZXJzcGVjdGl2ZScpXG4pO1xuY29uc3Qgc3dpdGNoUGVyc3BlY3RpdmVCdG4gPSAvKiogQHR5cGUge0hUTUxCdXR0b25FbGVtZW50fG51bGx9ICovIChcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLXN3aXRjaC1wZXJzcGVjdGl2ZScpXG4pO1xuY29uc3Qgem9vbUJhciA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR8bnVsbH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi16b29tLWJhcicpKTtcbmNvbnN0IHpvb21MZXZlbEJhZGdlID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi16b29tLWxldmVsLWJhZGdlJylcbik7XG5jb25zdCB6b29tQnJlYWRjcnVtYnMgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fG51bGx9ICovIChcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLXpvb20tYnJlYWRjcnVtYnMnKVxuKTtcbmNvbnN0IHpvb21TZWFyY2ggPSAvKiogQHR5cGUge0hUTUxJbnB1dEVsZW1lbnR8bnVsbH0gKi8gKFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2Ytem9vbS1zZWFyY2gnKVxuKTtcbmNvbnN0IHpvb21DaGlwcyA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR8bnVsbH0gKi8gKFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2Ytem9vbS1jaGlwcycpXG4pO1xuY29uc3Qgc2NvcGVCYW5uZXIgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fG51bGx9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2Ytc2NvcGUtYmFubmVyJykpO1xuY29uc3QgY2FsbHNQYW5lbCA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR8bnVsbH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1jYWxscy1wYW5lbCcpKTtcbmNvbnN0IGNhbGxzRmlsdGVyU3RhdHVzID0gLyoqIEB0eXBlIHtIVE1MU2VsZWN0RWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1jYWxscy1maWx0ZXItc3RhdHVzJylcbik7XG5jb25zdCBjYWxsc0V4cGFuZEJ0biA9IC8qKiBAdHlwZSB7SFRNTEJ1dHRvbkVsZW1lbnR8bnVsbH0gKi8gKFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtY2FsbHMtZXhwYW5kJylcbik7XG5jb25zdCBjYWxsc0NvbGxhcHNlQnRuID0gLyoqIEB0eXBlIHtIVE1MQnV0dG9uRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1jYWxscy1jb2xsYXBzZScpXG4pO1xuY29uc3QgY2FsbHNGb2N1c0J0biA9IC8qKiBAdHlwZSB7SFRNTEJ1dHRvbkVsZW1lbnR8bnVsbH0gKi8gKFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtY2FsbHMtZm9jdXMnKVxuKTtcbmNvbnN0IGNhbGxlcnNIZWFkaW5nID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1jYWxsZXJzLWhlYWRpbmcnKVxuKTtcbmNvbnN0IGNhbGxlcnNMaXN0ID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudHxudWxsfSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWNhbGxlcnMtbGlzdCcpKTtcbmNvbnN0IGNhbGxlcnNNb3JlQnRuID0gLyoqIEB0eXBlIHtIVE1MQnV0dG9uRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1jYWxsZXJzLW1vcmUnKVxuKTtcbmNvbnN0IGNhbGxlZXNIZWFkaW5nID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1jYWxsZWVzLWhlYWRpbmcnKVxuKTtcbmNvbnN0IGNhbGxlZXNMaXN0ID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudHxudWxsfSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWNhbGxlZXMtbGlzdCcpKTtcbmNvbnN0IGNhbGxlZXNNb3JlQnRuID0gLyoqIEB0eXBlIHtIVE1MQnV0dG9uRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1jYWxsZWVzLW1vcmUnKVxuKTtcbmNvbnN0IHVucmVzb2x2ZWRCdWNrZXREZXRhaWxzID0gLyoqIEB0eXBlIHtIVE1MRGV0YWlsc0VsZW1lbnR8bnVsbH0gKi8gKFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtdW5yZXNvbHZlZC1idWNrZXQnKVxuKTtcbmNvbnN0IHVucmVzb2x2ZWRTdW1tYXJ5ID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi11bnJlc29sdmVkLXN1bW1hcnknKVxuKTtcbmNvbnN0IHVucmVzb2x2ZWRMaXN0ID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi11bnJlc29sdmVkLWxpc3QnKVxuKTtcblxuLyoqIEB0eXBlIHtpbXBvcnQoJy4uL2NvcmUvZ3JhcGgvZHRvLmpzJykuR3JhcGhEdG8gfCBudWxsfSAqL1xubGV0IGN1cnJlbnREdG8gPSBudWxsO1xuY29uc3QgcHJlZmVycmVkU3ltYm9sSWQgPSBkb2N1bWVudC5ib2R5LmRhdGFzZXQucHJlZmVycmVkU3ltYm9sIHx8IG51bGw7XG5jb25zdCByYXdQcmVmID0gZG9jdW1lbnQuYm9keS5kYXRhc2V0LnByZWZlcnJlZFBlcnNwZWN0aXZlO1xuY29uc3QgcHJlZmVycmVkUGVyc3BlY3RpdmUgPVxuICByYXdQcmVmID09PSAnY2FsbF9ncmFwaCcgPyAnY2FsbF9ncmFwaCcgOiByYXdQcmVmID09PSAnc2VtYW50aWNfem9vbScgPyAnc2VtYW50aWNfem9vbScgOiAnY2ZnJztcblxuLyoqIEB0eXBlIHtzdHJpbmcgfCBudWxsfSAqL1xubGV0IHNlbGVjdGVkU3ltYm9sSWQgPSBwcmVmZXJyZWRTeW1ib2xJZDtcbi8qKiBAdHlwZSB7J2NmZyd8J2NhbGxfZ3JhcGgnfCdzZW1hbnRpY196b29tJ30gKi9cbmxldCBhY3RpdmVQZXJzcGVjdGl2ZSA9IHByZWZlcnJlZFBlcnNwZWN0aXZlO1xuLyoqIEB0eXBlIHtzdHJpbmd8dW5kZWZpbmVkfSAqL1xubGV0IGNhbGxlcnNOZXh0Q3Vyc29yO1xuLyoqIEB0eXBlIHtzdHJpbmd8dW5kZWZpbmVkfSAqL1xubGV0IGNhbGxlZXNOZXh0Q3Vyc29yO1xuaWYgKHBlcnNwZWN0aXZlU2VsZWN0KSB7XG4gIHBlcnNwZWN0aXZlU2VsZWN0LnZhbHVlID0gYWN0aXZlUGVyc3BlY3RpdmU7XG59XG5cbi8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgYW55Pn0gKi9cbmxldCBzZXR0aW5ncyA9IHJlc29sdmVQcmV2aWV3U2V0dGluZ3Moe30pO1xuLyoqIEB0eXBlIHt7ZGVmYXVsdERlcHRoOiAxfDJ8M3w0LCBzaG93RXZpZGVuY2U6IGJvb2xlYW4sIGluY2x1ZGVMaW1pdGF0aW9uczogYm9vbGVhbn19ICovXG5sZXQgZXhwbGFuYXRpb25TZXR0aW5ncyA9IHJlc29sdmVFeHBsYW5hdGlvblNldHRpbmdzKHt9KTtcbi8qKiBAdHlwZSB7MXwyfDN8NH0gKi9cbmxldCBhY3RpdmVFeHBsYWluRGVwdGggPSBleHBsYW5hdGlvblNldHRpbmdzLmRlZmF1bHREZXB0aDtcbi8qKiBAdHlwZSB7c3RyaW5nfG51bGx9ICovXG5sZXQgYWN0aXZlTm9kZUlkID0gbnVsbDtcbi8qKiBAdHlwZSB7bnVtYmVyfSAqL1xubGV0IGV4cGxhaW5Ob2RlUmVxdWVzdCA9IDA7XG4vKiogQHR5cGUge251bWJlcn0gKi9cbmxldCBleHBsYWluRnVuY3Rpb25SZXF1ZXN0ID0gMDtcbi8qKiBAdHlwZSB7TWFwPHN0cmluZywgUmVjb3JkPHN0cmluZywgYW55Pj59ICovXG5jb25zdCBwcmV2aWV3Q2FjaGUgPSBuZXcgTWFwKCk7XG4vKiogQHR5cGUge01hcDxzdHJpbmcsIHN0cmluZz59ICovXG5sZXQgaW50ZWdyaXR5QnlOb2RlID0gbmV3IE1hcCgpO1xuLyoqIEB0eXBlIHtzdHJpbmd8bnVsbH0gKi9cbmxldCBwcmV2aWV3Tm9kZUlkID0gbnVsbDtcbi8qKiBAdHlwZSB7bnVtYmVyfSAqL1xubGV0IHByZXZpZXdSZXF1ZXN0ID0gMDtcbi8qKiBAdHlwZSB7e3g6IG51bWJlciwgeTogbnVtYmVyfXxudWxsfSAqL1xubGV0IHByZXZpZXdBbmNob3IgPSBudWxsO1xuXG5jb25zdCByZW5kZXJlciA9IGNyZWF0ZVN2Z1JlbmRlcmVyKHtcbiAgc3ZnLFxuICBvblNlbGVjdDogKG5vZGVJZCwgbm9kZSkgPT4ge1xuICAgIHNob3dOb2RlRGV0YWlscyhub2RlSWQsIG5vZGUpO1xuICAgIGJyaWRnZS5yZXNwb25kKCdub2RlLnNlbGVjdCcsIHsgbm9kZUlkIH0pO1xuICB9LFxuICBvbk5hdmlnYXRlOiAobm9kZUlkLCBub2RlLCB0cmlnZ2VyKSA9PiB7XG4gICAgaWYgKGN1cnJlbnREdG8/LmR0b0tpbmQgPT09ICdzZW1hbnRpY196b29tJykge1xuICAgICAgdm9pZCBkZXNjZW5kU2VtYW50aWNab29tKG5vZGVJZCwgbm9kZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0cmlnZ2VyID09PSAncG9pbnRlcicgJiYgIXNldHRpbmdzLmNsaWNrVG9OYXZpZ2F0ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2b2lkIG5hdmlnYXRlVG8obm9kZUlkLCBub2RlKTtcbiAgfSxcbiAgb25QcmV2aWV3RW50ZXI6IChub2RlSWQsIF9ub2RlLCBwb2ludCkgPT4ge1xuICAgIHByZXZpZXdDb250cm9sbGVyLnBvaW50ZXJFbnRlcihub2RlSWQsIHBvaW50KTtcbiAgfSxcbiAgb25QcmV2aWV3TW92ZTogKHBvaW50KSA9PiB7XG4gICAgcHJldmlld0NvbnRyb2xsZXIucG9pbnRlck1vdmUocG9pbnQpO1xuICB9LFxuICBvblByZXZpZXdMZWF2ZTogKCkgPT4ge1xuICAgIHByZXZpZXdDb250cm9sbGVyLnBvaW50ZXJMZWF2ZSgpO1xuICB9LFxuICBvblByZXZpZXdLZXk6IChub2RlSWQpID0+IHtcbiAgICB2b2lkIG9wZW5QcmV2aWV3KG5vZGVJZCwgbnVsbCwgdHJ1ZSk7XG4gIH0sXG59KTtcblxuY29uc3QgcHJldmlld0NvbnRyb2xsZXIgPSBjcmVhdGVQcmV2aWV3Q29udHJvbGxlcih7XG4gIGRlbGF5TXM6IHNldHRpbmdzLmRlbGF5TXMsXG4gIGVuYWJsZWQ6IHNldHRpbmdzLmVuYWJsZWQsXG4gIHBpbkJ5RGVmYXVsdDogc2V0dGluZ3MucGluQnlEZWZhdWx0LFxuICBvblNob3c6IChub2RlSWQsIGFuY2hvcikgPT4ge1xuICAgIHN5bmNQaW5CdXR0b24ocHJldmlld0NvbnRyb2xsZXIuaXNQaW5uZWQoKSk7XG4gICAgdm9pZCBvcGVuUHJldmlldyhub2RlSWQsIGFuY2hvciwgZmFsc2UpO1xuICB9LFxuICBvbkhpZGU6ICgpID0+IHtcbiAgICBoaWRlUHJldmlldygpO1xuICB9LFxufSk7XG5pZiAoc2V0dGluZ3MucGluQnlEZWZhdWx0KSB7XG4gIHByZXZpZXdDb250cm9sbGVyLnNldFBpbm5lZCh0cnVlKTtcbn1cbnN5bmNQaW5CdXR0b24oc2V0dGluZ3MucGluQnlEZWZhdWx0KTtcblxuY29uc3QgYnJpZGdlID0gY3JlYXRlQnJpZGdlKHtcbiAgcG9zdDogKG1lc3NhZ2UpID0+IHZzY29kZUFwaS5wb3N0TWVzc2FnZShtZXNzYWdlKSxcbiAgaW5ib3VuZERpcmVjdGlvbjogRElSRUNUSU9OUy5IT1NUX1RPX1dFQlZJRVcsXG4gIHRpbWVvdXRNczogODAwMCxcbiAgbG9nZ2VyOiB7XG4gICAgZGVidWc6ICgpID0+IHt9LFxuICAgIHdhcm46IChtZXNzYWdlLCBmaWVsZHMpID0+IGNvbnNvbGUud2FybignW2NvZGVmbG93XScsIG1lc3NhZ2UsIGZpZWxkcyksXG4gICAgZXJyb3I6IChtZXNzYWdlLCBmaWVsZHMpID0+IGNvbnNvbGUuZXJyb3IoJ1tjb2RlZmxvd10nLCBtZXNzYWdlLCBmaWVsZHMpLFxuICB9LFxufSk7XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzRXJyb3JdXG4gKi9cbmZ1bmN0aW9uIHNldEJhbm5lcihtZXNzYWdlLCBpc0Vycm9yID0gZmFsc2UpIHtcbiAgaWYgKCFtZXNzYWdlKSB7XG4gICAgYmFubmVyLmhpZGRlbiA9IHRydWU7XG4gICAgYmFubmVyLnRleHRDb250ZW50ID0gJyc7XG4gICAgcmV0dXJuO1xuICB9XG4gIGJhbm5lci5oaWRkZW4gPSBmYWxzZTtcbiAgYmFubmVyLmNsYXNzTGlzdC50b2dnbGUoJ2lzLWVycm9yJywgaXNFcnJvcik7XG4gIGJhbm5lci50ZXh0Q29udGVudCA9IG1lc3NhZ2U7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAqL1xuZnVuY3Rpb24gc2V0U3RhdHVzKHRleHQpIHtcbiAgc3RhdHVzLnRleHRDb250ZW50ID0gdGV4dDtcbn1cblxuZnVuY3Rpb24gY2xlYXJEZXRhaWwoKSB7XG4gIGFjdGl2ZU5vZGVJZCA9IG51bGw7XG4gIGRldGFpbEJvZHkucmVwbGFjZUNoaWxkcmVuKCk7XG4gIGNvbnN0IHBhcmFncmFwaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcbiAgcGFyYWdyYXBoLmNsYXNzTmFtZSA9ICdjZi1tdXRlZCc7XG4gIHBhcmFncmFwaC50ZXh0Q29udGVudCA9ICdTZWxlY3QgYSBub2RlIHRvIGluc3BlY3QgaXQuJztcbiAgZGV0YWlsQm9keS5hcHBlbmRDaGlsZChwYXJhZ3JhcGgpO1xuICBjbGVhckV4cGxhbmF0aW9uKCk7XG59XG5cbmZ1bmN0aW9uIGNsZWFyRXhwbGFuYXRpb24oKSB7XG4gIGV4cGxhaW5Ob2RlUmVxdWVzdCArPSAxO1xuICBpZiAoZXhwbGFpblNlY3Rpb24pIHtcbiAgICBleHBsYWluU2VjdGlvbi5oaWRkZW4gPSB0cnVlO1xuICB9XG4gIGV4cGxhaW5JdGVtcz8ucmVwbGFjZUNoaWxkcmVuKCk7XG4gIGlmIChleHBsYWluRXZpZGVuY2UpIHtcbiAgICBleHBsYWluRXZpZGVuY2UuaGlkZGVuID0gdHJ1ZTtcbiAgfVxuICBleHBsYWluRXZpZGVuY2VMaXN0Py5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgaWYgKGV4cGxhaW5MaW1pdHMpIHtcbiAgICBleHBsYWluTGltaXRzLmhpZGRlbiA9IHRydWU7XG4gIH1cbiAgaWYgKGV4cGxhaW5MaW1pdHNUZXh0KSB7XG4gICAgZXhwbGFpbkxpbWl0c1RleHQudGV4dENvbnRlbnQgPSAnJztcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gcGF5bG9hZFxuICovXG5mdW5jdGlvbiByZW5kZXJOb2RlRXhwbGFuYXRpb24ocGF5bG9hZCkge1xuICBpZiAoIWV4cGxhaW5TZWN0aW9uIHx8ICFleHBsYWluSXRlbXMpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgaXRlbXMgPSBBcnJheS5pc0FycmF5KHBheWxvYWQ/Lml0ZW1zKSA/IHBheWxvYWQuaXRlbXMgOiBbXTtcbiAgY29uc3QgbGltaXRzID0gQXJyYXkuaXNBcnJheShwYXlsb2FkPy5saW1pdGF0aW9ucykgPyBwYXlsb2FkLmxpbWl0YXRpb25zIDogW107XG4gIGV4cGxhaW5JdGVtcy5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgaWYgKGl0ZW1zLmxlbmd0aCA9PT0gMCAmJiBsaW1pdHMubGVuZ3RoID09PSAwKSB7XG4gICAgZXhwbGFpblNlY3Rpb24uaGlkZGVuID0gdHJ1ZTtcbiAgICByZXR1cm47XG4gIH1cbiAgZXhwbGFpblNlY3Rpb24uaGlkZGVuID0gZmFsc2U7XG5cbiAgY29uc3QgZXZpZGVuY2VSZWZzID0gW107XG4gIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xuICAgIGlmIChpdGVtLnJ1bGVJZCA9PT0gJ2ZuLmxpbWl0YXRpb25zJykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcbiAgICByb3cuY2xhc3NOYW1lID0gYGNmLWV4cGxhaW4taXRlbSBjZi1leHBsYWluLS0ke2l0ZW0uY2xhaW0gPz8gJ2dyb3VuZGVkJ31gO1xuICAgIHJvdy50ZXh0Q29udGVudCA9IGl0ZW0udGV4dDtcbiAgICBleHBsYWluSXRlbXMuYXBwZW5kQ2hpbGQocm93KTtcbiAgICBmb3IgKGNvbnN0IHJlZiBvZiBpdGVtLmV2aWRlbmNlID8/IFtdKSB7XG4gICAgICBldmlkZW5jZVJlZnMucHVzaChyZWYpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChleHBsYWluRXZpZGVuY2UgJiYgZXhwbGFpbkV2aWRlbmNlTGlzdCkge1xuICAgIGV4cGxhaW5FdmlkZW5jZUxpc3QucmVwbGFjZUNoaWxkcmVuKCk7XG4gICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQoKTtcbiAgICBjb25zdCB1bmlxdWVSZWZzID0gZXZpZGVuY2VSZWZzLmZpbHRlcigocmVmKSA9PiB7XG4gICAgICBjb25zdCBrZXkgPSBgJHtyZWYua2luZH06JHtyZWYuaWR9YDtcbiAgICAgIGlmIChzZWVuLmhhcyhrZXkpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHNlZW4uYWRkKGtleSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgICBpZiAoZXhwbGFuYXRpb25TZXR0aW5ncy5zaG93RXZpZGVuY2UgJiYgdW5pcXVlUmVmcy5sZW5ndGggPiAwKSB7XG4gICAgICBleHBsYWluRXZpZGVuY2UuaGlkZGVuID0gZmFsc2U7XG4gICAgICBmb3IgKGNvbnN0IHJlZiBvZiB1bmlxdWVSZWZzLnNsaWNlKDAsIDgpKSB7XG4gICAgICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgICAgaWYgKHJlZi5yYW5nZSkge1xuICAgICAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgICAgIGJ0bi50eXBlID0gJ2J1dHRvbic7XG4gICAgICAgICAgYnRuLmNsYXNzTmFtZSA9ICdjZi1ldmlkZW5jZS1saW5rJztcbiAgICAgICAgICBidG4udGV4dENvbnRlbnQgPSByZWYubGFiZWwgfHwgYCR7cmVmLmtpbmR9OiBsaW5lICR7cmVmLnJhbmdlLnN0YXJ0TGluZSArIDF9YDtcbiAgICAgICAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICB2b2lkIG5hdmlnYXRlVG9SYW5nZShyZWYucmFuZ2UpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGxpLmFwcGVuZENoaWxkKGJ0bik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGkudGV4dENvbnRlbnQgPSBgJHtyZWYua2luZH06ICR7cmVmLmxhYmVsIHx8IHJlZi5pZH1gO1xuICAgICAgICB9XG4gICAgICAgIGV4cGxhaW5FdmlkZW5jZUxpc3QuYXBwZW5kQ2hpbGQobGkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBleHBsYWluRXZpZGVuY2UuaGlkZGVuID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAoZXhwbGFpbkxpbWl0cyAmJiBleHBsYWluTGltaXRzVGV4dCkge1xuICAgIGlmIChsaW1pdHMubGVuZ3RoID4gMCkge1xuICAgICAgZXhwbGFpbkxpbWl0cy5oaWRkZW4gPSBmYWxzZTtcbiAgICAgIGV4cGxhaW5MaW1pdHMub3BlbiA9IGV4cGxhbmF0aW9uU2V0dGluZ3MuaW5jbHVkZUxpbWl0YXRpb25zO1xuICAgICAgZXhwbGFpbkxpbWl0c1RleHQudGV4dENvbnRlbnQgPSBsaW1pdHMuam9pbignICcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBleHBsYWluTGltaXRzLmhpZGRlbiA9IHRydWU7XG4gICAgICBleHBsYWluTGltaXRzVGV4dC50ZXh0Q29udGVudCA9ICcnO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gcmFuZ2VcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbmF2aWdhdGVUb1JhbmdlKHJhbmdlKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicmlkZ2UucmVxdWVzdCgnbmF2aWdhdGUudG8nLCB7XG4gICAgICBmaWxlSWQ6IHJhbmdlLmZpbGVJZCxcbiAgICAgIHJhbmdlLFxuICAgIH0pO1xuICAgIGlmIChyZXNwb25zZS5wYXlsb2FkLm9rICE9PSB0cnVlKSB7XG4gICAgICBzZXRCYW5uZXIoXG4gICAgICAgIGAke3Jlc3BvbnNlLnBheWxvYWQuY29kZSA/PyAnRV9OQVZJR0FUSU9OJ306ICR7cmVzcG9uc2UucGF5bG9hZC5tZXNzYWdlID8/ICdDb3VsZCBub3Qgb3BlbiBzb3VyY2UuJ31gLFxuICAgICAgICB0cnVlLFxuICAgICAgKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgc2V0QmFubmVyKGBDb3VsZCBub3Qgb3BlbiBzb3VyY2U6ICR7ZXJyb3I/Lm1lc3NhZ2UgPz8gU3RyaW5nKGVycm9yKX1gLCB0cnVlKTtcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWRcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZE5vZGVFeHBsYW5hdGlvbihub2RlSWQpIHtcbiAgaWYgKCFjdXJyZW50RHRvIHx8IGN1cnJlbnREdG8uZHRvS2luZCAhPT0gJ2NmZycgfHwgIWV4cGxhaW5TZWN0aW9uKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHJlcXVlc3QgPSArK2V4cGxhaW5Ob2RlUmVxdWVzdDtcbiAgY29uc3Qgc2tlbGV0b25UaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGlmIChyZXF1ZXN0ID09PSBleHBsYWluTm9kZVJlcXVlc3QgJiYgZXhwbGFpblNlY3Rpb24gJiYgZXhwbGFpbkl0ZW1zKSB7XG4gICAgICBleHBsYWluU2VjdGlvbi5oaWRkZW4gPSBmYWxzZTtcbiAgICAgIGV4cGxhaW5JdGVtcy50ZXh0Q29udGVudCA9ICdHZW5lcmF0aW5nIGV4cGxhbmF0aW9uXHUyMDI2JztcbiAgICB9XG4gIH0sIDEwMCk7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicmlkZ2UucmVxdWVzdCgnZXhwbGFpbi5ub2RlJywge1xuICAgICAgbm9kZUlkLFxuICAgICAgZGVwdGg6IGFjdGl2ZUV4cGxhaW5EZXB0aCxcbiAgICB9KTtcbiAgICBjbGVhclRpbWVvdXQoc2tlbGV0b25UaW1lcik7XG4gICAgaWYgKHJlcXVlc3QgIT09IGV4cGxhaW5Ob2RlUmVxdWVzdCB8fCBhY3RpdmVOb2RlSWQgIT09IG5vZGVJZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZW5kZXJOb2RlRXhwbGFuYXRpb24ocmVzcG9uc2UucGF5bG9hZCk7XG4gIH0gY2F0Y2gge1xuICAgIGNsZWFyVGltZW91dChza2VsZXRvblRpbWVyKTtcbiAgICBpZiAocmVxdWVzdCA9PT0gZXhwbGFpbk5vZGVSZXF1ZXN0KSB7XG4gICAgICBjbGVhckV4cGxhbmF0aW9uKCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtpbXBvcnQoJy4uL2NvcmUvZ3JhcGgvZHRvLmpzJykuR3JhcGhEdG99IGR0b1xuICovXG5hc3luYyBmdW5jdGlvbiBsb2FkRnVuY3Rpb25TdW1tYXJ5KGR0bykge1xuICBpZiAoIWZuU3VtbWFyeSkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoZHRvLmR0b0tpbmQgIT09ICdjZmcnKSB7XG4gICAgZm5TdW1tYXJ5LmhpZGRlbiA9IHRydWU7XG4gICAgZm5TdW1tYXJ5LnRleHRDb250ZW50ID0gJyc7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHJlcXVlc3QgPSArK2V4cGxhaW5GdW5jdGlvblJlcXVlc3Q7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicmlkZ2UucmVxdWVzdCgnZXhwbGFpbi5mdW5jdGlvbicsIHtcbiAgICAgIGRlcHRoOiBhY3RpdmVFeHBsYWluRGVwdGgsXG4gICAgfSk7XG4gICAgaWYgKHJlcXVlc3QgIT09IGV4cGxhaW5GdW5jdGlvblJlcXVlc3QgfHwgY3VycmVudER0byAhPT0gZHRvKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHRleHQgPSBbcmVzcG9uc2UucGF5bG9hZD8uc3VtbWFyeSwgLi4uKHJlc3BvbnNlLnBheWxvYWQ/LmxpbWl0YXRpb25zID8/IFtdKV1cbiAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgIC5qb2luKCcgJyk7XG4gICAgaWYgKHRleHQpIHtcbiAgICAgIGZuU3VtbWFyeS50ZXh0Q29udGVudCA9IHRleHQ7XG4gICAgICBmblN1bW1hcnkuaGlkZGVuID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZuU3VtbWFyeS5oaWRkZW4gPSB0cnVlO1xuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgaWYgKHJlcXVlc3QgPT09IGV4cGxhaW5GdW5jdGlvblJlcXVlc3QpIHtcbiAgICAgIGZuU3VtbWFyeS5oaWRkZW4gPSB0cnVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBsYWJlbFxuICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gKiBAcmV0dXJucyB7W0hUTUxFbGVtZW50LCBIVE1MRWxlbWVudF19XG4gKi9cbmZ1bmN0aW9uIGRldGFpbFBhaXIobGFiZWwsIHZhbHVlKSB7XG4gIGNvbnN0IHRlcm0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkdCcpO1xuICB0ZXJtLnRleHRDb250ZW50ID0gbGFiZWw7XG4gIGNvbnN0IGRlc2NyaXB0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGQnKTtcbiAgZGVzY3JpcHRpb24udGV4dENvbnRlbnQgPSB2YWx1ZTtcbiAgcmV0dXJuIFt0ZXJtLCBkZXNjcmlwdGlvbl07XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZFxuICogQHBhcmFtIHtpbXBvcnQoJy4uL2NvcmUvZ3JhcGgvZHRvLmpzJykuRHRvTm9kZX0gW25vZGVdXG4gKi9cbmZ1bmN0aW9uIHNob3dOb2RlRGV0YWlscyhub2RlSWQsIG5vZGUpIHtcbiAgaWYgKCFub2RlSWQgfHwgIW5vZGUpIHtcbiAgICBjbGVhckRldGFpbCgpO1xuICAgIHJldHVybjtcbiAgfVxuICBhY3RpdmVOb2RlSWQgPSBub2RlSWQ7XG4gIGNvbnN0IGxpc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkbCcpO1xuICBsaXN0LmFwcGVuZCguLi5kZXRhaWxQYWlyKCdsYWJlbCcsIG5vZGUubGFiZWwpKTtcbiAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcigna2luZCcsIG5vZGUua2luZCkpO1xuICBsaXN0LmFwcGVuZCguLi5kZXRhaWxQYWlyKCdzdGF0dXMnLCBub2RlLnN0YXR1cykpO1xuICBpZiAobm9kZS5leHRlcm5hbCkge1xuICAgIGxpc3QuYXBwZW5kKC4uLmRldGFpbFBhaXIoJ29yaWdpbicsICdleHRlcm5hbCB0YXJnZXQgKG5vdCBkZWNsYXJlZCBpbiB0aGUgYW5hbHlzaXMpJykpO1xuICB9XG4gIGlmIChub2RlLnJhbmdlKSB7XG4gICAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcignbGluZXMnLCBgJHtub2RlLnJhbmdlLnN0YXJ0TGluZSArIDF9XHUyMDEzJHtub2RlLnJhbmdlLmVuZExpbmUgKyAxfWApKTtcbiAgICBsaXN0LmFwcGVuZCguLi5kZXRhaWxQYWlyKCdmaWxlJywgbm9kZS5yYW5nZS5maWxlSWQpKTtcbiAgfVxuICBpZiAobm9kZS5iYWRnZSkge1xuICAgIGxpc3QuYXBwZW5kKC4uLmRldGFpbFBhaXIoJ25vdGUnLCBub2RlLmJhZGdlKSk7XG4gIH1cbiAgaWYgKG5vZGUuaXNTeW50aGV0aWMpIHtcbiAgICBsaXN0LmFwcGVuZCguLi5kZXRhaWxQYWlyKCdvcmlnaW4nLCAnc3ludGhldGljIHN0cnVjdHVyYWwgbm9kZScpKTtcbiAgfVxuICBpZiAobm9kZS51bnJlYWNoYWJsZSkge1xuICAgIGxpc3QuYXBwZW5kKC4uLmRldGFpbFBhaXIoJ3JlYWNoYWJpbGl0eScsICdub3QgcmVhY2hhYmxlIGZyb20gZW50cnknKSk7XG4gIH1cbiAgaWYgKG5vZGUucmVhc29uQ29kZSkge1xuICAgIGxpc3QuYXBwZW5kKC4uLmRldGFpbFBhaXIoJ3JlYXNvbicsIG5vZGUucmVhc29uQ29kZSkpO1xuICB9XG4gIGlmIChBcnJheS5pc0FycmF5KG5vZGUuY2FsbHMpICYmIG5vZGUuY2FsbHMubGVuZ3RoID4gMCkge1xuICAgIGxpc3QuYXBwZW5kKFxuICAgICAgLi4uZGV0YWlsUGFpcignY2FsbHMnLCBub2RlLmNhbGxzLm1hcCgoY2FsbCkgPT4gYCR7Y2FsbC5sYWJlbH0gKCR7Y2FsbC5zdGF0dXN9KWApLmpvaW4oJywgJykpLFxuICAgICk7XG4gIH1cblxuICBjb25zdCBlZGdlcyA9IChjdXJyZW50RHRvPy5lZGdlcyA/PyBbXSkuZmlsdGVyKFxuICAgIChlZGdlKSA9PiBlZGdlLmZyb20gPT09IG5vZGVJZCB8fCBlZGdlLnRvID09PSBub2RlSWQsXG4gICk7XG4gIGlmIChlZGdlcy5sZW5ndGggPiAwKSB7XG4gICAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcigncmVsYXRpb25zaGlwcycsIFN0cmluZyhlZGdlcy5sZW5ndGgpKSk7XG4gIH1cblxuICBkZXRhaWxCb2R5LnJlcGxhY2VDaGlsZHJlbihsaXN0KTtcblxuICBpZiAoZWRnZXMubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGhlYWRpbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMycpO1xuICAgIGhlYWRpbmcuY2xhc3NOYW1lID0gJ2NmLWRldGFpbC10aXRsZSc7XG4gICAgaGVhZGluZy50ZXh0Q29udGVudCA9ICdSZWxhdGlvbnNoaXBzJztcbiAgICBkZXRhaWxCb2R5LmFwcGVuZENoaWxkKGhlYWRpbmcpO1xuXG4gICAgY29uc3QgZWRnZUxpc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuICAgIGVkZ2VMaXN0LmNsYXNzTmFtZSA9ICdjZi1sZWdlbmQnO1xuICAgIGZvciAoY29uc3QgZWRnZSBvZiBlZGdlcy5zbGljZSgwLCAxMikpIHtcbiAgICAgIGNvbnN0IGl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgY29uc3QgZGlyZWN0aW9uID0gZWRnZS5mcm9tID09PSBub2RlSWQgPyAnXHUyMTkyJyA6ICdcdTIxOTAnO1xuICAgICAgY29uc3Qgb3RoZXIgPSBlZGdlLmZyb20gPT09IG5vZGVJZCA/IGVkZ2UudG8gOiBlZGdlLmZyb207XG4gICAgICBpdGVtLnRleHRDb250ZW50ID0gYCR7ZGlyZWN0aW9ufSAke2VkZ2UudHlwZX0gXHUwMEI3ICR7b3RoZXJ9ICgke2VkZ2Uuc3RhdHVzfSlgO1xuICAgICAgZWRnZUxpc3QuYXBwZW5kQ2hpbGQoaXRlbSk7XG4gICAgfVxuICAgIGRldGFpbEJvZHkuYXBwZW5kQ2hpbGQoZWRnZUxpc3QpO1xuICB9XG5cbiAgdm9pZCBsb2FkTm9kZUV4cGxhbmF0aW9uKG5vZGVJZCk7XG4gIHN5bmNDYWxsTm9kZUJ1dHRvbnMobm9kZSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fHVuZGVmaW5lZH0gbm9kZVxuICovXG5mdW5jdGlvbiBzeW5jQ2FsbE5vZGVCdXR0b25zKG5vZGUpIHtcbiAgaWYgKCFjYWxsc0V4cGFuZEJ0biB8fCAhY2FsbHNDb2xsYXBzZUJ0biB8fCAhY2FsbHNGb2N1c0J0bikge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBpc0NhbGxHcmFwaCA9IGN1cnJlbnREdG8/LmR0b0tpbmQgPT09ICdjYWxsX2dyYXBoJztcbiAgaWYgKCFpc0NhbGxHcmFwaCB8fCAhbm9kZSB8fCBub2RlLmtpbmQgPT09ICd1bnJlc29sdmVkX2J1Y2tldCcpIHtcbiAgICBjYWxsc0V4cGFuZEJ0bi5kaXNhYmxlZCA9IHRydWU7XG4gICAgY2FsbHNDb2xsYXBzZUJ0bi5kaXNhYmxlZCA9IHRydWU7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNhbGxzRXhwYW5kQnRuLmRpc2FibGVkID0gQm9vbGVhbihub2RlLmV4cGFuZGVkKTtcbiAgY2FsbHNDb2xsYXBzZUJ0bi5kaXNhYmxlZCA9ICFub2RlLmV4cGFuZGVkIHx8IEJvb2xlYW4obm9kZS5pc0NlbnRlcik7XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBkdG9cbiAqL1xuYXN5bmMgZnVuY3Rpb24gdXBkYXRlQ2FsbEdyYXBoU2lkZVBhbmVsKGR0bykge1xuICBpZiAoIWNhbGxzUGFuZWwpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKGR0by5kdG9LaW5kICE9PSAnY2FsbF9ncmFwaCcpIHtcbiAgICBjYWxsc1BhbmVsLmhpZGRlbiA9IHRydWU7XG4gICAgaWYgKHNjb3BlQmFubmVyKSB7XG4gICAgICBzY29wZUJhbm5lci5oaWRkZW4gPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm47XG4gIH1cbiAgY2FsbHNQYW5lbC5oaWRkZW4gPSBmYWxzZTtcbiAgaWYgKHNjb3BlQmFubmVyKSB7XG4gICAgc2NvcGVCYW5uZXIudGV4dENvbnRlbnQgPSBkdG8uc2NvcGVCYW5uZXIgfHwgJyc7XG4gICAgc2NvcGVCYW5uZXIuaGlkZGVuID0gIWR0by5zY29wZUJhbm5lcjtcbiAgfVxuICBpZiAoY2FsbHNGb2N1c0J0bikge1xuICAgIGNvbnN0IGZvY3VzZWQgPSBCb29sZWFuKGR0by5mb2N1c2VkTm9kZUlkKTtcbiAgICBjYWxsc0ZvY3VzQnRuLnNldEF0dHJpYnV0ZSgnYXJpYS1wcmVzc2VkJywgZm9jdXNlZCA/ICd0cnVlJyA6ICdmYWxzZScpO1xuICAgIGNhbGxzRm9jdXNCdG4udGV4dENvbnRlbnQgPSBmb2N1c2VkID8gJ1VuZm9jdXMnIDogJ0ZvY3VzJztcbiAgfVxuXG4gIGlmICh1bnJlc29sdmVkQnVja2V0RGV0YWlscyAmJiB1bnJlc29sdmVkU3VtbWFyeSAmJiB1bnJlc29sdmVkTGlzdCkge1xuICAgIGNvbnN0IGJ1Y2tldCA9IGR0by51bnJlc29sdmVkQnVja2V0O1xuICAgIGlmIChidWNrZXQgJiYgYnVja2V0LmNvdW50ID4gMCkge1xuICAgICAgdW5yZXNvbHZlZEJ1Y2tldERldGFpbHMuaGlkZGVuID0gZmFsc2U7XG4gICAgICB1bnJlc29sdmVkU3VtbWFyeS50ZXh0Q29udGVudCA9IGAke2J1Y2tldC5jb3VudH0gdW5yZXNvbHZlZCB0YXJnZXQke2J1Y2tldC5jb3VudCA9PT0gMSA/ICcnIDogJ3MnfWA7XG4gICAgICB1bnJlc29sdmVkTGlzdC5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgICAgIGZvciAoY29uc3QgcmVhc29uIG9mIGJ1Y2tldC5yZWFzb25zID8/IFtdKSB7XG4gICAgICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgICAgbGkudGV4dENvbnRlbnQgPSBgJHtyZWFzb24ucmVhc29uQ29kZX06ICR7cmVhc29uLmNvdW50fSBzaXRlJHtyZWFzb24uY291bnQgPT09IDEgPyAnJyA6ICdzJ31gO1xuICAgICAgICB1bnJlc29sdmVkTGlzdC5hcHBlbmRDaGlsZChsaSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHVucmVzb2x2ZWRCdWNrZXREZXRhaWxzLmhpZGRlbiA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgaWYgKGR0by5jZW50ZXJTeW1ib2xJZCkge1xuICAgIGNhbGxlcnNOZXh0Q3Vyc29yID0gdW5kZWZpbmVkO1xuICAgIGNhbGxlZXNOZXh0Q3Vyc29yID0gdW5kZWZpbmVkO1xuICAgIGNhbGxlcnNMaXN0Py5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgICBjYWxsZWVzTGlzdD8ucmVwbGFjZUNoaWxkcmVuKCk7XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgbG9hZE5laWdoYm9yUGFnZSgnaW5jb21pbmcnLCBkdG8uY2VudGVyU3ltYm9sSWQsIGZhbHNlKSxcbiAgICAgIGxvYWROZWlnaGJvclBhZ2UoJ291dGdvaW5nJywgZHRvLmNlbnRlclN5bWJvbElkLCBmYWxzZSksXG4gICAgXSk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0geydpbmNvbWluZyd8J291dGdvaW5nJ30gZGlyZWN0aW9uXG4gKiBAcGFyYW0ge3N0cmluZ30gc3ltYm9sSWRcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gYXBwZW5kXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGxvYWROZWlnaGJvclBhZ2UoZGlyZWN0aW9uLCBzeW1ib2xJZCwgYXBwZW5kKSB7XG4gIGNvbnN0IGtpbmQgPSBkaXJlY3Rpb24gPT09ICdpbmNvbWluZycgPyAnY2FsbHMuaW5jb21pbmcnIDogJ2NhbGxzLm91dGdvaW5nJztcbiAgY29uc3QgY3Vyc29yID0gZGlyZWN0aW9uID09PSAnaW5jb21pbmcnID8gY2FsbGVyc05leHRDdXJzb3IgOiBjYWxsZWVzTmV4dEN1cnNvcjtcbiAgY29uc3QgbGlzdEVsID0gZGlyZWN0aW9uID09PSAnaW5jb21pbmcnID8gY2FsbGVyc0xpc3QgOiBjYWxsZWVzTGlzdDtcbiAgY29uc3QgaGVhZGluZ0VsID0gZGlyZWN0aW9uID09PSAnaW5jb21pbmcnID8gY2FsbGVyc0hlYWRpbmcgOiBjYWxsZWVzSGVhZGluZztcbiAgY29uc3QgbW9yZUJ0biA9IGRpcmVjdGlvbiA9PT0gJ2luY29taW5nJyA/IGNhbGxlcnNNb3JlQnRuIDogY2FsbGVlc01vcmVCdG47XG4gIGlmICghbGlzdEVsKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicmlkZ2UucmVxdWVzdChraW5kLCB7XG4gICAgICBzeW1ib2xJZCxcbiAgICAgIGxpbWl0OiA1MCxcbiAgICAgIC4uLihhcHBlbmQgJiYgY3Vyc29yID8geyBjdXJzb3IgfSA6IHt9KSxcbiAgICB9KTtcbiAgICBjb25zdCBwYXlsb2FkID0gcmVzcG9uc2UucGF5bG9hZCA/PyB7fTtcbiAgICBpZiAoIWFwcGVuZCkge1xuICAgICAgbGlzdEVsLnJlcGxhY2VDaGlsZHJlbigpO1xuICAgIH1cbiAgICBpZiAoaGVhZGluZ0VsKSB7XG4gICAgICBoZWFkaW5nRWwudGV4dENvbnRlbnQgPVxuICAgICAgICBkaXJlY3Rpb24gPT09ICdpbmNvbWluZydcbiAgICAgICAgICA/IGBDYWxsZXJzICgke3BheWxvYWQudG90YWwgPz8gMH0pYFxuICAgICAgICAgIDogYENhbGxlZXMgKCR7cGF5bG9hZC50b3RhbCA/PyAwfSlgO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgcGF5bG9hZC5pdGVtcyA/PyBbXSkge1xuICAgICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgICBidG4udHlwZSA9ICdidXR0b24nO1xuICAgICAgYnRuLmNsYXNzTmFtZSA9ICdjZi1ldmlkZW5jZS1saW5rJztcbiAgICAgIGJ0bi50ZXh0Q29udGVudCA9IGAke2l0ZW0uZGlzcGxheU5hbWV9ICgke2l0ZW0uc3RhdHVzfSR7aXRlbS5jYWxsU2l0ZUNvdW50ID4gMSA/IGAgXHUwMEQ3JHtpdGVtLmNhbGxTaXRlQ291bnR9YCA6ICcnfSlgO1xuICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICByZW5kZXJlci5zZWxlY3QoaXRlbS5zeW1ib2xJZCk7XG4gICAgICB9KTtcbiAgICAgIGxpLmFwcGVuZENoaWxkKGJ0bik7XG4gICAgICBsaXN0RWwuYXBwZW5kQ2hpbGQobGkpO1xuICAgIH1cbiAgICBpZiAoZGlyZWN0aW9uID09PSAnaW5jb21pbmcnKSB7XG4gICAgICBjYWxsZXJzTmV4dEN1cnNvciA9IHBheWxvYWQubmV4dEN1cnNvcjtcbiAgICB9IGVsc2Uge1xuICAgICAgY2FsbGVlc05leHRDdXJzb3IgPSBwYXlsb2FkLm5leHRDdXJzb3I7XG4gICAgfVxuICAgIGlmIChtb3JlQnRuKSB7XG4gICAgICBtb3JlQnRuLmhpZGRlbiA9ICFwYXlsb2FkLm5leHRDdXJzb3I7XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICBpZiAobW9yZUJ0bikge1xuICAgICAgbW9yZUJ0bi5oaWRkZW4gPSB0cnVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gbmV4dFxuICovXG5mdW5jdGlvbiBhcHBseVNldHRpbmdzKG5leHQpIHtcbiAgY29uc3QgcHJldmlvdXNNYXhMaW5lcyA9IHNldHRpbmdzLm1heExpbmVzO1xuICBzZXR0aW5ncyA9IHJlc29sdmVQcmV2aWV3U2V0dGluZ3MoeyAuLi5zZXR0aW5ncywgLi4ubmV4dCB9KTtcbiAgaWYgKG5leHQ/LmV4cGxhbmF0aW9uICYmIHR5cGVvZiBuZXh0LmV4cGxhbmF0aW9uID09PSAnb2JqZWN0Jykge1xuICAgIGV4cGxhbmF0aW9uU2V0dGluZ3MgPSByZXNvbHZlRXhwbGFuYXRpb25TZXR0aW5ncyhuZXh0LmV4cGxhbmF0aW9uKTtcbiAgICBhY3RpdmVFeHBsYWluRGVwdGggPSBleHBsYW5hdGlvblNldHRpbmdzLmRlZmF1bHREZXB0aDtcbiAgICBpZiAoZXhwbGFpbkRlcHRoU2VsZWN0KSB7XG4gICAgICBleHBsYWluRGVwdGhTZWxlY3QudmFsdWUgPSBTdHJpbmcoYWN0aXZlRXhwbGFpbkRlcHRoKTtcbiAgICB9XG4gICAgaWYgKGFjdGl2ZU5vZGVJZCkge1xuICAgICAgdm9pZCBsb2FkTm9kZUV4cGxhbmF0aW9uKGFjdGl2ZU5vZGVJZCk7XG4gICAgfVxuICAgIGlmIChjdXJyZW50RHRvPy5kdG9LaW5kID09PSAnY2ZnJykge1xuICAgICAgdm9pZCBsb2FkRnVuY3Rpb25TdW1tYXJ5KGN1cnJlbnREdG8pO1xuICAgIH1cbiAgfVxuICBwcmV2aWV3Q29udHJvbGxlci5jb25maWd1cmUoe1xuICAgIGRlbGF5TXM6IHNldHRpbmdzLmRlbGF5TXMsXG4gICAgZW5hYmxlZDogc2V0dGluZ3MuZW5hYmxlZCxcbiAgICBwaW5CeURlZmF1bHQ6IHNldHRpbmdzLnBpbkJ5RGVmYXVsdCxcbiAgfSk7XG4gIGlmIChzZXR0aW5ncy5tYXhMaW5lcyAhPT0gcHJldmlvdXNNYXhMaW5lcykge1xuICAgIHByZXZpZXdDYWNoZS5jbGVhcigpO1xuICB9XG4gIGlmICghc2V0dGluZ3MuZW5hYmxlZCkge1xuICAgIHByZXZpZXdDb250cm9sbGVyLmRpc21pc3MoKTtcbiAgICBoaWRlUHJldmlldygpO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtib29sZWFufSBwaW5uZWRcbiAqL1xuZnVuY3Rpb24gc3luY1BpbkJ1dHRvbihwaW5uZWQpIHtcbiAgcHJldmlld1Bpbi5zZXRBdHRyaWJ1dGUoJ2FyaWEtcHJlc3NlZCcsIHBpbm5lZCA/ICd0cnVlJyA6ICdmYWxzZScpO1xuICBwcmV2aWV3UGluLnRleHRDb250ZW50ID0gcGlubmVkID8gJ1Bpbm5lZCcgOiAnUGluJztcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkXG4gKiBAcmV0dXJucyB7UmVjb3JkPHN0cmluZywgYW55PnxudWxsfVxuICovXG5mdW5jdGlvbiBub2RlQnlJZChub2RlSWQpIHtcbiAgcmV0dXJuIGN1cnJlbnREdG8/Lm5vZGVzLmZpbmQoKG5vZGUpID0+IG5vZGUuaWQgPT09IG5vZGVJZCkgPz8gbnVsbDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3t4OiBudW1iZXIsIHk6IG51bWJlcn18bnVsbH0gYW5jaG9yXG4gKi9cbmZ1bmN0aW9uIHBvc2l0aW9uUHJldmlldyhhbmNob3IpIHtcbiAgY29uc3Qgd3JhcCA9IHN2Zy5wYXJlbnRFbGVtZW50Py5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgaWYgKCF3cmFwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHBvaW50ID0gYW5jaG9yID8/IHtcbiAgICB4OiB3cmFwLmxlZnQgKyAyNCxcbiAgICB5OiB3cmFwLnRvcCArIDcyLFxuICB9O1xuICBjb25zdCB3aWR0aCA9IE1hdGgubWluKDM4MCwgTWF0aC5tYXgoMjYwLCB3cmFwLndpZHRoIC0gMzIpKTtcbiAgY29uc3QgbWF4TGVmdCA9IE1hdGgubWF4KDgsIHdyYXAud2lkdGggLSB3aWR0aCAtIDgpO1xuICBjb25zdCBsZWZ0ID0gTWF0aC5tYXgoOCwgTWF0aC5taW4obWF4TGVmdCwgcG9pbnQueCAtIHdyYXAubGVmdCArIDE0KSk7XG4gIGNvbnN0IHRvcCA9IE1hdGgubWF4KDgsIE1hdGgubWluKE1hdGgubWF4KDgsIHdyYXAuaGVpZ2h0IC0gMjIwKSwgcG9pbnQueSAtIHdyYXAudG9wICsgMTQpKTtcbiAgcHJldmlldy5zdHlsZS53aWR0aCA9IGAke3dpZHRofXB4YDtcbiAgcHJldmlldy5zdHlsZS5sZWZ0ID0gYCR7bGVmdH1weGA7XG4gIHByZXZpZXcuc3R5bGUudG9wID0gYCR7dG9wfXB4YDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IG5vZGVcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55PnxudWxsfSBzbGljZVxuICovXG5mdW5jdGlvbiByZW5kZXJQcmV2aWV3Q2FyZChub2RlLCBzbGljZSkge1xuICBjb25zdCBtb2RlbCA9IGJ1aWxkUHJldmlld01vZGVsKHtcbiAgICBub2RlLFxuICAgIHNsaWNlLFxuICAgIG1heExpbmVzOiBzZXR0aW5ncy5tYXhMaW5lcyxcbiAgfSk7XG4gIHByZXZpZXdUaXRsZS50ZXh0Q29udGVudCA9IGAke21vZGVsLmtpbmR9IFx1MDBCNyAke21vZGVsLnRpdGxlfWA7XG4gIHByZXZpZXdNZXRhLnRleHRDb250ZW50ID0gW1xuICAgIG1vZGVsLmZpbGUsXG4gICAgYGxpbmVzICR7bW9kZWwubGluZUxhYmVsfWAsXG4gICAgbW9kZWwuaW50ZWdyaXR5ICE9PSAnZXhhY3QnXG4gICAgICA/IG1vZGVsLmludGVncml0eVxuICAgICAgOiBtb2RlbC5kb2N1bWVudFZlcnNpb25cbiAgICAgICAgPyBgdiR7bW9kZWwuZG9jdW1lbnRWZXJzaW9ufWBcbiAgICAgICAgOiAnJyxcbiAgXVxuICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAuam9pbignIFx1MDBCNyAnKTtcbiAgcHJldmlld0JvZHkucmVwbGFjZUNoaWxkcmVuKCk7XG5cbiAgaWYgKCFtb2RlbC5zeW50aGV0aWMgJiYgIW1vZGVsLmVtcHR5KSB7XG4gICAgY29uc3QgbGFuZ3VhZ2UgPVxuICAgICAgdHlwZW9mIHNsaWNlPy5sYW5ndWFnZUlkID09PSAnc3RyaW5nJyA/IHNsaWNlLmxhbmd1YWdlSWQgOiAobm9kZS5yYW5nZT8uZmlsZUlkID8/ICcnKTtcbiAgICBjb25zdCByZW5kZXJlZCA9IHNldHRpbmdzLnN5bnRheEhpZ2hsaWdodGluZ1xuICAgICAgPyBoaWdobGlnaHRMaW5lcyhtb2RlbC50ZXh0LCBsYW5ndWFnZSlcbiAgICAgIDogaGlnaGxpZ2h0TGluZXMobW9kZWwudGV4dCwgJycpO1xuICAgIGNvbnN0IGZpcnN0TGluZSA9IE51bWJlcihzbGljZT8ubGluZXM/LnN0YXJ0TGluZSA/PyBub2RlLnJhbmdlPy5zdGFydExpbmUgPz8gMCkgKyAxO1xuICAgIGNvbnN0IGNvZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBjb2RlLmNsYXNzTmFtZSA9ICdjZi1wcmV2aWV3LWNvZGUnO1xuICAgIGZvciAoY29uc3QgW2luZGV4LCB0b2tlbnNdIG9mIHJlbmRlcmVkLmxpbmVzLmVudHJpZXMoKSkge1xuICAgICAgY29uc3QgbGluZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgbGluZS5jbGFzc05hbWUgPSAnY2YtcHJldmlldy1saW5lJztcbiAgICAgIGNvbnN0IG51bWJlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgIG51bWJlci5jbGFzc05hbWUgPSAnY2YtcHJldmlldy1saW5lLW51bWJlcic7XG4gICAgICBudW1iZXIudGV4dENvbnRlbnQgPSBTdHJpbmcoZmlyc3RMaW5lICsgaW5kZXgpO1xuICAgICAgY29uc3QgY29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgIGNvbnRlbnQuY2xhc3NOYW1lID0gJ2NmLXByZXZpZXctbGluZS10ZXh0JztcbiAgICAgIGZvciAoY29uc3QgdG9rZW4gb2YgdG9rZW5zKSB7XG4gICAgICAgIGNvbnN0IHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIGlmICh0b2tlbi5jbGFzc05hbWUpIHtcbiAgICAgICAgICBzcGFuLmNsYXNzTmFtZSA9IHRva2VuLmNsYXNzTmFtZTtcbiAgICAgICAgfVxuICAgICAgICBzcGFuLnRleHRDb250ZW50ID0gdG9rZW4udGV4dDtcbiAgICAgICAgY29udGVudC5hcHBlbmRDaGlsZChzcGFuKTtcbiAgICAgIH1cbiAgICAgIGxpbmUuYXBwZW5kKG51bWJlciwgY29udGVudCk7XG4gICAgICBjb2RlLmFwcGVuZENoaWxkKGxpbmUpO1xuICAgIH1cbiAgICBwcmV2aWV3Qm9keS5hcHBlbmRDaGlsZChjb2RlKTtcbiAgICBpZiAocmVuZGVyZWQuZGVncmFkZWQpIHtcbiAgICAgIHByZXZpZXdCb2R5LmNsYXNzTGlzdC5hZGQoJ2lzLXBsYWluJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByZXZpZXdCb2R5LmNsYXNzTGlzdC5yZW1vdmUoJ2lzLXBsYWluJyk7XG4gICAgfVxuICB9XG5cbiAgY29uc3Qgbm90ZXMgPSBbXTtcbiAgaWYgKG1vZGVsLm1lc3NhZ2UpIHtcbiAgICBub3Rlcy5wdXNoKG1vZGVsLm1lc3NhZ2UpO1xuICB9XG4gIGlmIChtb2RlbC50cnVuY2F0ZWQpIHtcbiAgICBub3Rlcy5wdXNoKGBQcmV2aWV3IHRydW5jYXRlZCB0byAke3NldHRpbmdzLm1heExpbmVzfSBsaW5lcy5gKTtcbiAgfVxuICBwcmV2aWV3Tm90ZS50ZXh0Q29udGVudCA9IG5vdGVzLmpvaW4oJyAnKTtcbiAgY29uc3QgY2FuT3BlbiA9ICFtb2RlbC5zeW50aGV0aWMgJiYgIW1vZGVsLmVtcHR5ICYmIG1vZGVsLmludGVncml0eSA9PT0gJ2V4YWN0JztcbiAgcHJldmlld0JvZHkuY2xhc3NMaXN0LnRvZ2dsZSgnaXMtY2xpY2thYmxlJywgQm9vbGVhbihzZXR0aW5ncy5jbGlja1RvTmF2aWdhdGUgJiYgY2FuT3BlbikpO1xuICBwcmV2aWV3T3Blbi5kaXNhYmxlZCA9ICFjYW5PcGVuO1xuICBwcmV2aWV3LmNsYXNzTGlzdC50b2dnbGUoJ2lzLXN0YWxlJywgbW9kZWwuc3RhbGUpO1xuICBwcmV2aWV3LmNsYXNzTGlzdC50b2dnbGUoJ2lzLXN5bnRoZXRpYycsIG1vZGVsLnN5bnRoZXRpYyk7XG4gIHByZXZpZXcuaGlkZGVuID0gZmFsc2U7XG4gIHBvc2l0aW9uUHJldmlldyhwcmV2aWV3QW5jaG9yKTtcbn1cblxuZnVuY3Rpb24gaGlkZVByZXZpZXcoKSB7XG4gIHByZXZpZXdSZXF1ZXN0ICs9IDE7XG4gIHByZXZpZXdOb2RlSWQgPSBudWxsO1xuICBwcmV2aWV3QW5jaG9yID0gbnVsbDtcbiAgcHJldmlldy5oaWRkZW4gPSB0cnVlO1xuICBpZiAocHJldmlld0V4cGxhaW4pIHtcbiAgICBwcmV2aWV3RXhwbGFpbi5oaWRkZW4gPSB0cnVlO1xuICAgIHByZXZpZXdFeHBsYWluLnRleHRDb250ZW50ID0gJyc7XG4gIH1cbiAgcHJldmlld0JvZHkucmVwbGFjZUNoaWxkcmVuKCk7XG4gIHByZXZpZXdOb3RlLnRleHRDb250ZW50ID0gJyc7XG4gIHN5bmNQaW5CdXR0b24oZmFsc2UpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWRcbiAqIEBwYXJhbSB7e3g6IG51bWJlciwgeTogbnVtYmVyfXxudWxsfSBbYW5jaG9yXVxuICogQHBhcmFtIHtib29sZWFufSBbcGluXVxuICovXG5hc3luYyBmdW5jdGlvbiBvcGVuUHJldmlldyhub2RlSWQsIGFuY2hvciA9IG51bGwsIHBpbiA9IGZhbHNlKSB7XG4gIGNvbnN0IG5vZGUgPSBub2RlQnlJZChub2RlSWQpO1xuICBpZiAoIW5vZGUpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgcHJldmlld05vZGVJZCA9IG5vZGVJZDtcbiAgcHJldmlld0FuY2hvciA9IGFuY2hvcjtcbiAgaWYgKHBpbikge1xuICAgIHByZXZpZXdDb250cm9sbGVyLnNldFBpbm5lZCh0cnVlKTtcbiAgICBzeW5jUGluQnV0dG9uKHRydWUpO1xuICAgIHByZXZpZXcuZm9jdXMoKTtcbiAgfVxuICBpZiAobm9kZS5pc1N5bnRoZXRpYyB8fCAhbm9kZS5yYW5nZSkge1xuICAgIHJlbmRlclByZXZpZXdDYXJkKG5vZGUsIG51bGwpO1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAocHJldmlld0V4cGxhaW4gJiYgY3VycmVudER0bz8uZHRvS2luZCA9PT0gJ2NmZycpIHtcbiAgICBjb25zdCByZXF1ZXN0Rm9yRXhwbGFpbiA9IHByZXZpZXdSZXF1ZXN0ICsgMTtcbiAgICB2b2lkIGJyaWRnZVxuICAgICAgLnJlcXVlc3QoJ2V4cGxhaW4ubm9kZScsIHsgbm9kZUlkLCBkZXB0aDogMSB9KVxuICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgcHJldmlld05vZGVJZCA9PT0gbm9kZUlkICYmXG4gICAgICAgICAgcHJldmlld1JlcXVlc3QgPD0gcmVxdWVzdEZvckV4cGxhaW4gJiZcbiAgICAgICAgICByZXMucGF5bG9hZD8uc3VtbWFyeVxuICAgICAgICApIHtcbiAgICAgICAgICBwcmV2aWV3RXhwbGFpbi50ZXh0Q29udGVudCA9IHJlcy5wYXlsb2FkLnN1bW1hcnk7XG4gICAgICAgICAgcHJldmlld0V4cGxhaW4uaGlkZGVuID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKCkgPT4ge30pO1xuICB9XG4gIGNvbnN0IGtleSA9IGAke25vZGVJZH18JHtzZXR0aW5ncy5tYXhMaW5lc31gO1xuICBjb25zdCBjYWNoZWQgPSBwcmV2aWV3Q2FjaGUuZ2V0KGtleSk7XG4gIGlmIChjYWNoZWQpIHtcbiAgICByZW5kZXJQcmV2aWV3Q2FyZChub2RlLCBjYWNoZWQpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCByZXF1ZXN0ID0gKytwcmV2aWV3UmVxdWVzdDtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyaWRnZS5yZXF1ZXN0KCdzb3VyY2Uuc2xpY2UnLCB7XG4gICAgICBmaWxlSWQ6IG5vZGUucmFuZ2UuZmlsZUlkLFxuICAgICAgcmFuZ2U6IG5vZGUucmFuZ2UsXG4gICAgICBtYXhMaW5lczogc2V0dGluZ3MubWF4TGluZXMsXG4gICAgfSk7XG4gICAgaWYgKHJlcXVlc3QgIT09IHByZXZpZXdSZXF1ZXN0IHx8IHByZXZpZXdOb2RlSWQgIT09IG5vZGVJZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzbGljZSA9IHJlc3BvbnNlLnBheWxvYWQuc2xpY2UgPz8gbnVsbDtcbiAgICBwcmV2aWV3Q2FjaGUuc2V0KGtleSwgc2xpY2UpO1xuICAgIGlmIChzbGljZT8uaW50ZWdyaXR5ICYmIHNsaWNlLmludGVncml0eSAhPT0gJ2V4YWN0Jykge1xuICAgICAgaW50ZWdyaXR5QnlOb2RlLnNldChub2RlSWQsIHNsaWNlLmludGVncml0eSk7XG4gICAgICByZW5kZXJlci5tYXJrU3RhbGUoW25vZGVJZF0pO1xuICAgIH1cbiAgICByZW5kZXJQcmV2aWV3Q2FyZChub2RlLCBzbGljZSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKHJlcXVlc3QgIT09IHByZXZpZXdSZXF1ZXN0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHJlbmRlclByZXZpZXdDYXJkKG5vZGUsIHtcbiAgICAgIHRleHQ6ICcnLFxuICAgICAgcmVsYXRpdmVQYXRoOiAnJyxcbiAgICAgIGludGVncml0eTogJ21pc3NpbmcnLFxuICAgICAgcmVhc29uOiBlcnJvcj8ubWVzc2FnZSA/PyBTdHJpbmcoZXJyb3IpLFxuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZFxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBbbm9kZV1cbiAqL1xuYXN5bmMgZnVuY3Rpb24gbmF2aWdhdGVUbyhub2RlSWQsIG5vZGUgPSBub2RlQnlJZChub2RlSWQpKSB7XG4gIGlmICghbm9kZT8ucmFuZ2UgfHwgbm9kZS5pc1N5bnRoZXRpYykge1xuICAgIHNldEJhbm5lcignVGhpcyBub2RlIGhhcyBubyBzb3VyY2UgdG8gb3Blbi4nLCBmYWxzZSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicmlkZ2UucmVxdWVzdCgnbmF2aWdhdGUudG8nLCB7XG4gICAgICBmaWxlSWQ6IG5vZGUucmFuZ2UuZmlsZUlkLFxuICAgICAgcmFuZ2U6IG5vZGUucmFuZ2UsXG4gICAgICBub2RlSWQsXG4gICAgfSk7XG4gICAgaWYgKHJlc3BvbnNlLnBheWxvYWQub2sgIT09IHRydWUpIHtcbiAgICAgIHNldEJhbm5lcihcbiAgICAgICAgYCR7cmVzcG9uc2UucGF5bG9hZC5jb2RlID8/ICdFX05BVklHQVRJT04nfTogJHtyZXNwb25zZS5wYXlsb2FkLm1lc3NhZ2UgPz8gJ0NvdWxkIG5vdCBvcGVuIHNvdXJjZS4nfWAsXG4gICAgICAgIHRydWUsXG4gICAgICApO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBzZXRCYW5uZXIoYENvdWxkIG5vdCBvcGVuIHNvdXJjZTogJHtlcnJvcj8ubWVzc2FnZSA/PyBTdHJpbmcoZXJyb3IpfWAsIHRydWUpO1xuICB9XG59XG5cbi8qKlxuICogVmFsaWRhdGUgZXZlcnkgc291cmNlLWJhY2tlZCBub2RlIG9uY2Ugb24gZ3JhcGggbG9hZC5cbiAqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IGR0b1xuICovXG5hc3luYyBmdW5jdGlvbiB2YWxpZGF0ZUdyYXBoKGR0bykge1xuICBpbnRlZ3JpdHlCeU5vZGUgPSBuZXcgTWFwKCk7XG4gIGNvbnN0IHJhbmdlcyA9IGR0by5ub2Rlc1xuICAgIC5maWx0ZXIoKG5vZGUpID0+IG5vZGUucmFuZ2UgJiYgIW5vZGUuaXNTeW50aGV0aWMpXG4gICAgLm1hcCgobm9kZSkgPT4gKHsgbm9kZUlkOiBub2RlLmlkLCAuLi5ub2RlLnJhbmdlIH0pKTtcbiAgaWYgKHJhbmdlcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyaWRnZS5yZXF1ZXN0KCdzb3VyY2UudmFsaWRhdGlvbicsIHtcbiAgICAgIHJhbmdlczogcmFuZ2VzLm1hcCgoeyBub2RlSWQ6IF9ub2RlSWQsIC4uLnJhbmdlIH0pID0+IHJhbmdlKSxcbiAgICB9KTtcbiAgICBjb25zdCByZXN1bHRzID0gQXJyYXkuaXNBcnJheShyZXNwb25zZS5wYXlsb2FkLnJlc3VsdHMpID8gcmVzcG9uc2UucGF5bG9hZC5yZXN1bHRzIDogW107XG4gICAgY29uc3Qgc3RhbGUgPSBbXTtcbiAgICBmb3IgKGNvbnN0IFtpbmRleCwgcmVzdWx0XSBvZiByZXN1bHRzLmVudHJpZXMoKSkge1xuICAgICAgY29uc3Qgbm9kZUlkID0gcmFuZ2VzW2luZGV4XT8ubm9kZUlkO1xuICAgICAgaWYgKCFub2RlSWQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpbnRlZ3JpdHlCeU5vZGUuc2V0KG5vZGVJZCwgcmVzdWx0LmludGVncml0eSA/PyAnbWlzc2luZycpO1xuICAgICAgaWYgKHJlc3VsdC5pbnRlZ3JpdHkgIT09ICdleGFjdCcpIHtcbiAgICAgICAgc3RhbGUucHVzaChub2RlSWQpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoc3RhbGUubGVuZ3RoID4gMCkge1xuICAgICAgcmVuZGVyZXIubWFya1N0YWxlKHN0YWxlKTtcbiAgICAgIHNldEJhbm5lcihcbiAgICAgICAgYCR7c3RhbGUubGVuZ3RofSBub2RlJHtzdGFsZS5sZW5ndGggPT09IDEgPyAnJyA6ICdzJ30gcmVmZXJlbmNlIGNoYW5nZWQgb3IgbWlzc2luZyBzb3VyY2UuIFByZXZpZXcgbWFya3MgdGhlbSBzdGFsZTsgcmUtYW5hbHl6ZSBiZWZvcmUgdHJ1c3RpbmcgdGhlbS5gLFxuICAgICAgICBmYWxzZSxcbiAgICAgICk7XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICAvLyBWYWxpZGF0aW9uIGlzIGFuIGVuaGFuY2VtZW50LiBBIGZhaWx1cmUgbXVzdCBub3QgaGlkZSB0aGUgZ3JhcGguXG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ1tdfSBmaWxlSWRzXG4gKi9cbmZ1bmN0aW9uIG1hcmtTdGFsZUZpbGVzKGZpbGVJZHMpIHtcbiAgY29uc3Qgd2FudGVkID0gbmV3IFNldChBcnJheS5pc0FycmF5KGZpbGVJZHMpID8gZmlsZUlkcyA6IFtdKTtcbiAgaWYgKCFjdXJyZW50RHRvIHx8IHdhbnRlZC5zaXplID09PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHN0YWxlID0gY3VycmVudER0by5ub2Rlc1xuICAgIC5maWx0ZXIoKG5vZGUpID0+IG5vZGUucmFuZ2UgJiYgd2FudGVkLmhhcyhub2RlLnJhbmdlLmZpbGVJZCkpXG4gICAgLm1hcCgobm9kZSkgPT4gbm9kZS5pZCk7XG4gIGlmIChzdGFsZS5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgcHJldmlld0NhY2hlLmNsZWFyKCk7XG4gIGZvciAoY29uc3Qgbm9kZUlkIG9mIHN0YWxlKSB7XG4gICAgaW50ZWdyaXR5QnlOb2RlLnNldChub2RlSWQsICdzdGFsZScpO1xuICB9XG4gIHJlbmRlcmVyLm1hcmtTdGFsZShzdGFsZSk7XG4gIHByZXZpZXdDb250cm9sbGVyLmRpc21pc3MoKTtcbiAgaGlkZVByZXZpZXcoKTtcbiAgc2V0QmFubmVyKFxuICAgIGBTb3VyY2UgY2hhbmdlZCBmb3IgJHtzdGFsZS5sZW5ndGh9IG5vZGUke3N0YWxlLmxlbmd0aCA9PT0gMSA/ICcnIDogJ3MnfS4gUHJldmlld3MgYXJlIHN0YWxlOyByZS1hbmFseXplIGJlZm9yZSB0cnVzdGluZyB0aGVtLmAsXG4gICAgZmFsc2UsXG4gICk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtpbXBvcnQoJy4uL2NvcmUvZ3JhcGgvZHRvLmpzJykuR3JhcGhEdG99IGR0b1xuICovXG5mdW5jdGlvbiByZW5kZXJMZWdlbmQoZHRvKSB7XG4gIGxlZ2VuZC5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgY29uc3Qgc3RhdHVzZXMgPSBBcnJheS5pc0FycmF5KGR0bz8ubGVnZW5kPy5zdGF0dXNlcykgPyBkdG8ubGVnZW5kLnN0YXR1c2VzIDogW107XG4gIGZvciAoY29uc3Qgc3RhdHVzTmFtZSBvZiBzdGF0dXNlcykge1xuICAgIGNvbnN0IGl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgIGNvbnN0IHN3YXRjaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBzd2F0Y2guY2xhc3NOYW1lID0gYGNmLXN3YXRjaCBjZi1lZGdlLS0ke3N0YXR1c05hbWV9YDtcbiAgICBjb25zdCBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICBsYWJlbC50ZXh0Q29udGVudCA9IHN0YXR1c05hbWU7XG4gICAgaWYgKHN0YXR1c05hbWUgIT09ICdyZXNvbHZlZCcpIHtcbiAgICAgIGxhYmVsLnRleHRDb250ZW50ID0gYCR7c3RhdHVzTmFtZX0gKHBhdHRlcm4gKyBsYWJlbClgO1xuICAgIH1cbiAgICBpdGVtLmFwcGVuZChzd2F0Y2gsIGxhYmVsKTtcbiAgICBsZWdlbmQuYXBwZW5kQ2hpbGQoaXRlbSk7XG4gIH1cbiAgY29uc3QgZWRnZUtpbmRzID0gQXJyYXkuaXNBcnJheShkdG8/LmxlZ2VuZD8uZWRnZUtpbmRzKSA/IGR0by5sZWdlbmQuZWRnZUtpbmRzIDogW107XG4gIGZvciAoY29uc3QgZWRnZUtpbmQgb2YgZWRnZUtpbmRzKSB7XG4gICAgY29uc3QgaXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgY29uc3Qgc3dhdGNoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHN3YXRjaC5jbGFzc05hbWUgPSBgY2Ytc3dhdGNoIGNmLWVkZ2UtLWtpbmQtJHtlZGdlS2luZH1gO1xuICAgIGNvbnN0IGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIGxhYmVsLnRleHRDb250ZW50ID0gYGVkZ2U6ICR7ZWRnZUtpbmR9YDtcbiAgICBpdGVtLmFwcGVuZChzd2F0Y2gsIGxhYmVsKTtcbiAgICBsZWdlbmQuYXBwZW5kQ2hpbGQoaXRlbSk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0FycmF5PHtzeW1ib2xJZDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIHF1YWxpZmllZE5hbWU6IHN0cmluZywga2luZDogc3RyaW5nfT59IGxpc3RcbiAqL1xuZnVuY3Rpb24gcmVuZGVyRnVuY3Rpb25QaWNrZXIobGlzdCkge1xuICBpZiAoIWZ1bmN0aW9uUGlja2VyKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGZ1bmN0aW9uUGlja2VyLnJlcGxhY2VDaGlsZHJlbigpO1xuICBmb3IgKGNvbnN0IGVudHJ5IG9mIGxpc3QpIHtcbiAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcbiAgICBvcHRpb24udmFsdWUgPSBlbnRyeS5zeW1ib2xJZDtcbiAgICBvcHRpb24udGV4dENvbnRlbnQgPSBgJHtlbnRyeS5xdWFsaWZpZWROYW1lfSAoJHtlbnRyeS5raW5kfSlgO1xuICAgIGZ1bmN0aW9uUGlja2VyLmFwcGVuZENoaWxkKG9wdGlvbik7XG4gIH1cbiAgZnVuY3Rpb25QaWNrZXIuaGlkZGVuID0gbGlzdC5sZW5ndGggPD0gMTtcbiAgaWYgKHNlbGVjdGVkU3ltYm9sSWQpIHtcbiAgICBmdW5jdGlvblBpY2tlci52YWx1ZSA9IHNlbGVjdGVkU3ltYm9sSWQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2hvd0NhcGFiaWxpdGllcyhwYXlsb2FkKSB7XG4gIGNvbnN0IGFkYXB0ZXJzID0gQXJyYXkuaXNBcnJheShwYXlsb2FkLmFkYXB0ZXJzKSA/IHBheWxvYWQuYWRhcHRlcnMgOiBbXTtcbiAgY29uc3QgbmFtZXMgPSBhZGFwdGVycy5tYXAoKGFkYXB0ZXIpID0+IGFkYXB0ZXIuaWQpLmpvaW4oJywgJykgfHwgJ25vbmUnO1xuICBtZXRhLnRleHRDb250ZW50ID0gYE1vY2sgZGF0YSBcdTAwQjcgYWRhcHRlcnM6ICR7bmFtZXN9IFx1MDBCNyBwcm90b2NvbCB2JHtwYXlsb2FkLnByb3RvY29sVmVyc2lvbiA/PyAnPyd9YDtcbiAgaWYgKHBheWxvYWQ/LnNldHRpbmdzICYmIHR5cGVvZiBwYXlsb2FkLnNldHRpbmdzID09PSAnb2JqZWN0Jykge1xuICAgIGFwcGx5U2V0dGluZ3MocGF5bG9hZC5zZXR0aW5ncyk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHBheWxvYWRcbiAqL1xuZnVuY3Rpb24gaGFuZGxlR3JhcGgocGF5bG9hZCkge1xuICBlbXB0eS5oaWRkZW4gPSB0cnVlO1xuICBjb25zdCBkdG9DYW5kaWRhdGUgPSAvKiogQHR5cGUge3tkdG8/OiB1bmtub3dufX0gKi8gKHBheWxvYWQpLmR0bztcbiAgY29uc3QgdmFsaWRhdGlvbiA9IHZhbGlkYXRlRHRvKGR0b0NhbmRpZGF0ZSk7XG4gIGlmICghdmFsaWRhdGlvbi5vaykge1xuICAgIHNldEJhbm5lcihgSW52YWxpZCBncmFwaCBwYXlsb2FkOiAke3ZhbGlkYXRpb24uaXNzdWVzWzBdfWAsIHRydWUpO1xuICAgIHNldFN0YXR1cygnUmVuZGVyIGZhaWxlZCcpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBkdG8gPSB2YWxpZGF0aW9uLmR0bztcbiAgY3VycmVudER0byA9IGR0bztcbiAgcHJldmlld0NhY2hlLmNsZWFyKCk7XG4gIGludGVncml0eUJ5Tm9kZSA9IG5ldyBNYXAoKTtcbiAgaGlkZVByZXZpZXcoKTtcbiAgZW1wdHkuaGlkZGVuID0gdHJ1ZTtcbiAgcmVuZGVyZXIucmVuZGVyKGR0byk7XG4gIHJlbmRlckxlZ2VuZChkdG8pO1xuICBjbGVhckRldGFpbCgpO1xuICB2b2lkIHZhbGlkYXRlR3JhcGgoZHRvKTtcbiAgdm9pZCBsb2FkRnVuY3Rpb25TdW1tYXJ5KGR0byk7XG4gIHZvaWQgdXBkYXRlQ2FsbEdyYXBoU2lkZVBhbmVsKGR0byk7XG4gIHVwZGF0ZVpvb21CYXIoZHRvKTtcbiAgaWYgKHN3aXRjaFBlcnNwZWN0aXZlQnRuKSB7XG4gICAgc3dpdGNoUGVyc3BlY3RpdmVCdG4uaGlkZGVuID0gIXNlbGVjdGVkU3ltYm9sSWQgfHwgZHRvLmR0b0tpbmQgPT09ICdzZW1hbnRpY196b29tJztcbiAgICBzd2l0Y2hQZXJzcGVjdGl2ZUJ0bi50ZXh0Q29udGVudCA9XG4gICAgICBkdG8uZHRvS2luZCA9PT0gJ2NhbGxfZ3JhcGgnID8gJ1Nob3cgaW4gQ0ZHJyA6ICdTaG93IGluIENhbGwgR3JhcGgnO1xuICB9XG4gIGNvbnN0IHN1YmplY3QgPVxuICAgIGR0by5kdG9LaW5kID09PSAnY2ZnJyAmJiBkdG8uZnVuY3Rpb25cbiAgICAgID8gYCR7ZHRvLmZ1bmN0aW9uLnF1YWxpZmllZE5hbWV9IFx1MDBCNyBDRkdgXG4gICAgICA6IGR0by5kdG9LaW5kID09PSAnY2FsbF9ncmFwaCdcbiAgICAgICAgPyBgJHtkdG8uY2VudGVyU3ltYm9sSWR9IFx1MDBCNyBDYWxsIEdyYXBoYFxuICAgICAgICA6IGR0by5kdG9LaW5kID09PSAnc2VtYW50aWNfem9vbSdcbiAgICAgICAgICA/IGAke2R0by5sZXZlbCA/PyAnT3ZlcnZpZXcnfSBcdTAwQjcgU2VtYW50aWMgWm9vbWBcbiAgICAgICAgICA6ICdncmFwaCc7XG4gIHNldFN0YXR1cyhcbiAgICBgJHtzdWJqZWN0fSBcdTAwQjcgJHtkdG8ubGFuZ3VhZ2UgPz8gJ3dvcmtzcGFjZSd9IFx1MDBCNyAke2R0by5ub2Rlcy5sZW5ndGh9IG5vZGVzIFx1MDBCNyAke2R0by5lZGdlcy5sZW5ndGh9IGVkZ2VzIFx1MDBCNyAke2R0by5jb21wbGV0ZW5lc3MgPz8gJ2NvbXBsZXRlJ31gLFxuICApO1xuICBtZXRhLnRleHRDb250ZW50ID0gYCR7ZHRvLmFkYXB0ZXJJZCA/PyAnY29kZWZsb3cnfSBcdTAwQjcgJHtzdWJqZWN0fSBcdTAwQjcgZHRvIHYke2R0by5kdG9WZXJzaW9ufWA7XG4gIGNvbnN0IGRlZ3JhZGF0aW9ucyA9IGR0by5kZWdyYWRhdGlvbnMgPz8gW107XG4gIGNvbnN0IG1lc3NhZ2VzID0gZGVncmFkYXRpb25zLm1hcCgoZW50cnkpID0+XG4gICAgdHlwZW9mIGVudHJ5ID09PSAnc3RyaW5nJ1xuICAgICAgPyBlbnRyeVxuICAgICAgOiBgJHtlbnRyeS5zZXZlcml0eSA9PT0gJ2luZm8nID8gJycgOiBgJHtlbnRyeS5zZXZlcml0eX06IGB9JHtlbnRyeS5tZXNzYWdlfWAsXG4gICk7XG4gIHNldEJhbm5lcihtZXNzYWdlcy5sZW5ndGggPiAwID8gbWVzc2FnZXMuam9pbignIFx1MDBCNyAnKSA6ICcnLCBmYWxzZSk7XG59XG5cbmJyaWRnZS5vbigncHJvdG9jb2wuZXJyb3InLCAocGF5bG9hZCkgPT4ge1xuICBjb25zdCBjb2RlID0gdHlwZW9mIHBheWxvYWQuY29kZSA9PT0gJ3N0cmluZycgPyBwYXlsb2FkLmNvZGUgOiAnRV9QUk9UT0NPTCc7XG4gIGNvbnN0IG1lc3NhZ2UgPSB0eXBlb2YgcGF5bG9hZC5tZXNzYWdlID09PSAnc3RyaW5nJyA/IHBheWxvYWQubWVzc2FnZSA6ICdVbmtub3duIGVycm9yLic7XG4gIHNldEJhbm5lcihgJHtjb2RlfTogJHttZXNzYWdlfWAsIHRydWUpO1xuICBzZXRTdGF0dXMoJ0Vycm9yJyk7XG59KTtcblxuYnJpZGdlLm9uKCdzZXR0aW5ncy5kYXRhJywgKHBheWxvYWQpID0+IHtcbiAgY29uc3QgbmV4dCA9IHBheWxvYWQ/LnNldHRpbmdzO1xuICBpZiAobmV4dCAmJiB0eXBlb2YgbmV4dCA9PT0gJ29iamVjdCcpIHtcbiAgICBhcHBseVNldHRpbmdzKG5leHQpO1xuICB9XG59KTtcblxuYnJpZGdlLm9uKCdzb3VyY2Uuc3RhbGUnLCAocGF5bG9hZCkgPT4ge1xuICBtYXJrU3RhbGVGaWxlcyhBcnJheS5pc0FycmF5KHBheWxvYWQ/LmZpbGVJZHMpID8gcGF5bG9hZC5maWxlSWRzIDogW10pO1xufSk7XG5cbmJyaWRnZS5vbignc2VsZWN0aW9uLmNoYW5nZWQnLCAocGF5bG9hZCkgPT4ge1xuICBjb25zdCBub2RlSWRzID0gQXJyYXkuaXNBcnJheShwYXlsb2FkPy5ub2RlSWRzKSA/IHBheWxvYWQubm9kZUlkcyA6IFtdO1xuICByZW5kZXJlci5oaWdobGlnaHQobm9kZUlkcyk7XG4gIGNvbnN0IGFjdGl2ZU5vZGVJZCA9IHR5cGVvZiBwYXlsb2FkPy5hY3RpdmVOb2RlSWQgPT09ICdzdHJpbmcnID8gcGF5bG9hZC5hY3RpdmVOb2RlSWQgOiBudWxsO1xuICBpZiAoYWN0aXZlTm9kZUlkKSB7XG4gICAgY29uc3Qgbm9kZSA9IG5vZGVCeUlkKGFjdGl2ZU5vZGVJZCk7XG4gICAgaWYgKG5vZGUpIHtcbiAgICAgIHNob3dOb2RlRGV0YWlscyhhY3RpdmVOb2RlSWQsIG5vZGUpO1xuICAgIH1cbiAgfVxufSk7XG5cbmJyaWRnZS5vbignZ3JhcGguZm9jdXMnLCAocGF5bG9hZCkgPT4ge1xuICBpZiAodHlwZW9mIHBheWxvYWQ/Lm5vZGVJZCA9PT0gJ3N0cmluZycpIHtcbiAgICBjb25zdCBub2RlID0gbm9kZUJ5SWQocGF5bG9hZC5ub2RlSWQpO1xuICAgIGlmIChub2RlKSB7XG4gICAgICByZW5kZXJlci5zZWxlY3QocGF5bG9hZC5ub2RlSWQpO1xuICAgICAgc2hvd05vZGVEZXRhaWxzKHBheWxvYWQubm9kZUlkLCBub2RlKTtcbiAgICB9XG4gIH1cbiAgc3ZnLmZvY3VzPy4oKTtcbn0pO1xuXG5wcmV2aWV3LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJlbnRlcicsICgpID0+IHtcbiAgcHJldmlld0NvbnRyb2xsZXIucG9pbnRlckVudGVyQ2FyZCgpO1xufSk7XG5wcmV2aWV3LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJsZWF2ZScsICgpID0+IHtcbiAgcHJldmlld0NvbnRyb2xsZXIucG9pbnRlckxlYXZlQ2FyZCgpO1xufSk7XG5wcmV2aWV3UGluLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICBzeW5jUGluQnV0dG9uKHByZXZpZXdDb250cm9sbGVyLnRvZ2dsZVBpbigpKTtcbn0pO1xucHJldmlld0Nsb3NlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICBwcmV2aWV3Q29udHJvbGxlci5kaXNtaXNzKCk7XG4gIGhpZGVQcmV2aWV3KCk7XG59KTtcbnByZXZpZXdPcGVuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICBpZiAocHJldmlld05vZGVJZCkge1xuICAgIHZvaWQgbmF2aWdhdGVUbyhwcmV2aWV3Tm9kZUlkKTtcbiAgfVxufSk7XG5wcmV2aWV3Qm9keS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgaWYgKHNldHRpbmdzLmNsaWNrVG9OYXZpZ2F0ZSAmJiBwcmV2aWV3Tm9kZUlkICYmICFwcmV2aWV3T3Blbi5kaXNhYmxlZCkge1xuICAgIHZvaWQgbmF2aWdhdGVUbyhwcmV2aWV3Tm9kZUlkKTtcbiAgfVxufSk7XG5wcmV2aWV3LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcbiAgaWYgKGV2ZW50LmtleSA9PT0gJ0VzY2FwZScpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHByZXZpZXdDb250cm9sbGVyLmRpc21pc3MoKTtcbiAgICBoaWRlUHJldmlldygpO1xuICAgIHJlbmRlcmVyLmZvY3VzU2VsZWN0aW9uKCk7XG4gIH1cbn0pO1xud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcbiAgaWYgKGV2ZW50LmtleSA9PT0gJ0VzY2FwZScgJiYgIXByZXZpZXcuaGlkZGVuKSB7XG4gICAgcHJldmlld0NvbnRyb2xsZXIuZGlzbWlzcygpO1xuICAgIGhpZGVQcmV2aWV3KCk7XG4gIH1cbn0pO1xuXG4vKipcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gZHRvXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZVpvb21CYXIoZHRvKSB7XG4gIGlmICghem9vbUJhcikge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoZHRvLmR0b0tpbmQgIT09ICdzZW1hbnRpY196b29tJykge1xuICAgIHpvb21CYXIuaGlkZGVuID0gdHJ1ZTtcbiAgICByZXR1cm47XG4gIH1cbiAgem9vbUJhci5oaWRkZW4gPSBmYWxzZTtcbiAgaWYgKHpvb21MZXZlbEJhZGdlKSB7XG4gICAgem9vbUxldmVsQmFkZ2UudGV4dENvbnRlbnQgPSBkdG8ubGV2ZWwgPyBgJHtkdG8ubGV2ZWx9YCA6ICdTZW1hbnRpYyBab29tJztcbiAgfVxuICBpZiAoem9vbUJyZWFkY3J1bWJzICYmIEFycmF5LmlzQXJyYXkoZHRvLmJyZWFkY3J1bWJzKSkge1xuICAgIHpvb21CcmVhZGNydW1icy5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgICBmb3IgKGNvbnN0IFtpbmRleCwgY3J1bWJdIG9mIGR0by5icmVhZGNydW1icy5lbnRyaWVzKCkpIHtcbiAgICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICAgICAgYnRuLnR5cGUgPSAnYnV0dG9uJztcbiAgICAgIGJ0bi5jbGFzc05hbWUgPSAnY2YtYnV0dG9uJztcbiAgICAgIGJ0bi5zdHlsZS5wYWRkaW5nID0gJzJweCA4cHgnO1xuICAgICAgYnRuLnN0eWxlLmZvbnRTaXplID0gJzExcHgnO1xuICAgICAgYnRuLnRleHRDb250ZW50ID0gY3J1bWIubGFiZWwgfHwgY3J1bWIuc2NvcGVJZCB8fCBgTGV2ZWwgJHtpbmRleH1gO1xuICAgICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGJyaWRnZS5yZXF1ZXN0KCd6b29tLmJyZWFkY3J1bWInLCB7IGluZGV4IH0pO1xuICAgICAgICAgIGhhbmRsZUdyYXBoKHJlcy5wYXlsb2FkKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHNldEJhbm5lcihgQ291bGQgbm90IG5hdmlnYXRlIGJyZWFkY3J1bWI6ICR7ZT8ubWVzc2FnZSA/PyBlfWAsIHRydWUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGxpLmFwcGVuZENoaWxkKGJ0bik7XG4gICAgICB6b29tQnJlYWRjcnVtYnMuYXBwZW5kQ2hpbGQobGkpO1xuICAgIH1cbiAgfVxuICBpZiAoem9vbUNoaXBzICYmIEFycmF5LmlzQXJyYXkoZHRvLmZpbHRlckNoaXBzKSkge1xuICAgIHpvb21DaGlwcy5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgICBmb3IgKGNvbnN0IGNoaXAgb2YgZHRvLmZpbHRlckNoaXBzKSB7XG4gICAgICBjb25zdCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgc3Bhbi5jbGFzc05hbWUgPSAnY2YtYmFkZ2UnO1xuICAgICAgc3Bhbi50ZXh0Q29udGVudCA9IGAke2NoaXAubGFiZWwgfHwgY2hpcC5raW5kfSAoJHtjaGlwLmNvdW50ID8/IDB9KWA7XG4gICAgICB6b29tQ2hpcHMuYXBwZW5kQ2hpbGQoc3Bhbik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZFxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBbbm9kZV1cbiAqL1xuYXN5bmMgZnVuY3Rpb24gZGVzY2VuZFNlbWFudGljWm9vbShub2RlSWQsIG5vZGUgPSBub2RlQnlJZChub2RlSWQpKSB7XG4gIGlmICghbm9kZSkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBjdXJyZW50TGV2ZWwgPSBjdXJyZW50RHRvPy5sZXZlbDtcbiAgbGV0IG5leHRMZXZlbCA9ICdMMV9NT0RVTEUnO1xuICBpZiAoY3VycmVudExldmVsID09PSAnTDBfV09SS1NQQUNFJykgbmV4dExldmVsID0gJ0wxX01PRFVMRSc7XG4gIGVsc2UgaWYgKGN1cnJlbnRMZXZlbCA9PT0gJ0wxX01PRFVMRScpIG5leHRMZXZlbCA9ICdMMl9GSUxFJztcbiAgZWxzZSBpZiAoY3VycmVudExldmVsID09PSAnTDJfRklMRScpIG5leHRMZXZlbCA9ICdMM19TWU1CT0wnO1xuICBlbHNlIGlmIChjdXJyZW50TGV2ZWwgPT09ICdMM19TWU1CT0wnKSBuZXh0TGV2ZWwgPSAnTDRfRlVOQ1RJT04nO1xuICBlbHNlIGlmIChjdXJyZW50TGV2ZWwgPT09ICdMNF9GVU5DVElPTicpIG5leHRMZXZlbCA9ICdMNV9TVEFURU1FTlQnO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ3pvb20uZGVzY2VuZCcsIHtcbiAgICAgIGxldmVsOiBuZXh0TGV2ZWwsXG4gICAgICBzY29wZUlkOiBub2RlLnNjb3BlSWQgfHwgbm9kZS5pZCxcbiAgICAgIGxhYmVsOiBub2RlLmxhYmVsLFxuICAgIH0pO1xuICAgIGhhbmRsZUdyYXBoKHJlcy5wYXlsb2FkKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBzZXRCYW5uZXIoYENvdWxkIG5vdCBkZXNjZW5kOiAke2Vycm9yPy5tZXNzYWdlID8/IFN0cmluZyhlcnJvcil9YCwgdHJ1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3ltYm9sSWRcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZENmZyhzeW1ib2xJZCkge1xuICBzZXRTdGF0dXMoJ0J1aWxkaW5nIGNvbnRyb2wtZmxvdyBncmFwaFx1MjAyNicpO1xuICBzZXRCYW5uZXIoJycpO1xuICB0cnkge1xuICAgIC8vIEEgcmVxdWVzdCByZXNvbHZlcyB3aXRoIGl0cyBjb3JyZWxhdGVkIHJlc3BvbnNlLiBUaGUgcmVzcG9uc2UgaXMgbm90XG4gICAgLy8gZGlzcGF0Y2hlZCB0byBgYnJpZGdlLm9uYCwgc28gaGFuZGxlIGl0IGhlcmUuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicmlkZ2UucmVxdWVzdCgnY2ZnLmxvYWQnLCB7IHN5bWJvbElkIH0pO1xuICAgIHNlbGVjdGVkU3ltYm9sSWQgPSBzeW1ib2xJZDtcbiAgICBoYW5kbGVHcmFwaChyZXNwb25zZS5wYXlsb2FkKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBzZXRCYW5uZXIoYENvdWxkIG5vdCBidWlsZCBDRkc6ICR7ZXJyb3I/Lm1lc3NhZ2UgPz8gU3RyaW5nKGVycm9yKX1gLCB0cnVlKTtcbiAgICBzZXRTdGF0dXMoJ0NGRyB1bmF2YWlsYWJsZScpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBsb2FkU2VtYW50aWNab29tKCkge1xuICBzZXRTdGF0dXMoJ0xvYWRpbmcgc2VtYW50aWMgem9vbVx1MjAyNicpO1xuICBzZXRCYW5uZXIoJycpO1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ3pvb20ub3BlbicsIHt9KTtcbiAgICBhY3RpdmVQZXJzcGVjdGl2ZSA9ICdzZW1hbnRpY196b29tJztcbiAgICBpZiAocGVyc3BlY3RpdmVTZWxlY3QpIHtcbiAgICAgIHBlcnNwZWN0aXZlU2VsZWN0LnZhbHVlID0gJ3NlbWFudGljX3pvb20nO1xuICAgIH1cbiAgICBoYW5kbGVHcmFwaChyZXNwb25zZS5wYXlsb2FkKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBzZXRCYW5uZXIoYENvdWxkIG5vdCBvcGVuIHNlbWFudGljIHpvb206ICR7ZXJyb3I/Lm1lc3NhZ2UgPz8gU3RyaW5nKGVycm9yKX1gLCB0cnVlKTtcbiAgICBzZXRTdGF0dXMoJ1NlbWFudGljIHpvb20gdW5hdmFpbGFibGUnKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3ltYm9sSWRcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZENhbGxHcmFwaChzeW1ib2xJZCkge1xuICBzZXRTdGF0dXMoJ0J1aWxkaW5nIGNhbGwgZ3JhcGhcdTIwMjYnKTtcbiAgc2V0QmFubmVyKCcnKTtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyaWRnZS5yZXF1ZXN0KCdjYWxscy5sb2FkJywgeyBzeW1ib2xJZCB9KTtcbiAgICBzZWxlY3RlZFN5bWJvbElkID0gc3ltYm9sSWQ7XG4gICAgYWN0aXZlUGVyc3BlY3RpdmUgPSAnY2FsbF9ncmFwaCc7XG4gICAgaWYgKHBlcnNwZWN0aXZlU2VsZWN0KSB7XG4gICAgICBwZXJzcGVjdGl2ZVNlbGVjdC52YWx1ZSA9ICdjYWxsX2dyYXBoJztcbiAgICB9XG4gICAgaGFuZGxlR3JhcGgocmVzcG9uc2UucGF5bG9hZCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgc2V0QmFubmVyKGBDb3VsZCBub3QgYnVpbGQgY2FsbCBncmFwaDogJHtlcnJvcj8ubWVzc2FnZSA/PyBTdHJpbmcoZXJyb3IpfWAsIHRydWUpO1xuICAgIHNldFN0YXR1cygnQ2FsbCBncmFwaCB1bmF2YWlsYWJsZScpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBsb2FkR3JhcGgoKSB7XG4gIHNldFN0YXR1cygnTG9hZGluZyBncmFwaFx1MjAyNicpO1xuICBzZXRCYW5uZXIoJycpO1xuICBpZiAoYWN0aXZlUGVyc3BlY3RpdmUgPT09ICdzZW1hbnRpY196b29tJykge1xuICAgIGNvbnN0IGxvYWRlZCA9IGF3YWl0IGxvYWRTZW1hbnRpY1pvb20oKTtcbiAgICBpZiAobG9hZGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicmlkZ2UucmVxdWVzdCgnY2ZnLmZ1bmN0aW9ucycsIHt9KTtcbiAgICBjb25zdCBsaXN0ID0gQXJyYXkuaXNBcnJheShyZXNwb25zZS5wYXlsb2FkLmZ1bmN0aW9ucykgPyByZXNwb25zZS5wYXlsb2FkLmZ1bmN0aW9ucyA6IFtdO1xuICAgIGlmIChsaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgIHJlbmRlckZ1bmN0aW9uUGlja2VyKGxpc3QpO1xuICAgICAgY29uc3QgcmV0YWluZWQgPVxuICAgICAgICBzZWxlY3RlZFN5bWJvbElkICYmIGxpc3Quc29tZSgoZW50cnkpID0+IGVudHJ5LnN5bWJvbElkID09PSBzZWxlY3RlZFN5bWJvbElkKVxuICAgICAgICAgID8gc2VsZWN0ZWRTeW1ib2xJZFxuICAgICAgICAgIDogbGlzdFswXS5zeW1ib2xJZDtcbiAgICAgIGNvbnN0IGxvYWRlZCA9XG4gICAgICAgIGFjdGl2ZVBlcnNwZWN0aXZlID09PSAnY2FsbF9ncmFwaCdcbiAgICAgICAgICA/IGF3YWl0IGxvYWRDYWxsR3JhcGgocmV0YWluZWQpXG4gICAgICAgICAgOiBhd2FpdCBsb2FkQ2ZnKHJldGFpbmVkKTtcbiAgICAgIGlmIChsb2FkZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgLy8gVGhlIENGRyBjYXBhYmlsaXR5IG1heSBiZSBhYnNlbnQgKGZvciBleGFtcGxlIHRoZSBidWlsdC1pbiBkZW1vIHJ1bikuXG4gICAgLy8gRmFsbGluZyBiYWNrIHRvIHRoZSBjYWxsIGdyYXBoIGtlZXBzIHRoZSBwYW5lbCB1c2VmdWwgYW5kIGhvbmVzdC5cbiAgfVxuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ2dyYXBoLmxvYWQnLCB7IGRlbW86IHRydWUgfSk7XG4gICAgaGFuZGxlR3JhcGgocmVzcG9uc2UucGF5bG9hZCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgc2V0QmFubmVyKGBDb3VsZCBub3QgbG9hZCBncmFwaDogJHtlcnJvcj8ubWVzc2FnZSA/PyBTdHJpbmcoZXJyb3IpfWAsIHRydWUpO1xuICAgIHNldFN0YXR1cygnTG9hZCBmYWlsZWQnKTtcbiAgICBlbXB0eS5oaWRkZW4gPSBmYWxzZTtcbiAgfVxufVxuXG5yZWxvYWRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gIHZvaWQgbG9hZEdyYXBoKCk7XG59KTtcblxuZnVuY3Rpb25QaWNrZXI/LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHtcbiAgY29uc3Qgc3ltYm9sSWQgPSBmdW5jdGlvblBpY2tlci52YWx1ZTtcbiAgaWYgKHN5bWJvbElkKSB7XG4gICAgaWYgKGFjdGl2ZVBlcnNwZWN0aXZlID09PSAnY2FsbF9ncmFwaCcpIHtcbiAgICAgIHZvaWQgbG9hZENhbGxHcmFwaChzeW1ib2xJZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZvaWQgbG9hZENmZyhzeW1ib2xJZCk7XG4gICAgfVxuICB9XG59KTtcblxucGVyc3BlY3RpdmVTZWxlY3Q/LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHtcbiAgY29uc3QgdmFsID0gcGVyc3BlY3RpdmVTZWxlY3QudmFsdWU7XG4gIGFjdGl2ZVBlcnNwZWN0aXZlID1cbiAgICB2YWwgPT09ICdjYWxsX2dyYXBoJyA/ICdjYWxsX2dyYXBoJyA6IHZhbCA9PT0gJ3NlbWFudGljX3pvb20nID8gJ3NlbWFudGljX3pvb20nIDogJ2NmZyc7XG4gIGlmIChhY3RpdmVQZXJzcGVjdGl2ZSA9PT0gJ3NlbWFudGljX3pvb20nKSB7XG4gICAgdm9pZCBsb2FkU2VtYW50aWNab29tKCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHN5bWJvbFRvVXNlID0gc2VsZWN0ZWRTeW1ib2xJZCB8fCAoZnVuY3Rpb25QaWNrZXI/Lm9wdGlvbnNbMF0/LnZhbHVlID8/IG51bGwpO1xuICBpZiAoc3ltYm9sVG9Vc2UpIHtcbiAgICBpZiAoYWN0aXZlUGVyc3BlY3RpdmUgPT09ICdjYWxsX2dyYXBoJykge1xuICAgICAgdm9pZCBsb2FkQ2FsbEdyYXBoKHN5bWJvbFRvVXNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdm9pZCBsb2FkQ2ZnKHN5bWJvbFRvVXNlKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdm9pZCBsb2FkR3JhcGgoKTtcbiAgfVxufSk7XG5cbmxldCBzZWFyY2hEZWJvdW5jZSA9IG51bGw7XG56b29tU2VhcmNoPy5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsICgpID0+IHtcbiAgaWYgKHNlYXJjaERlYm91bmNlKSB7XG4gICAgY2xlYXJUaW1lb3V0KHNlYXJjaERlYm91bmNlKTtcbiAgfVxuICBzZWFyY2hEZWJvdW5jZSA9IHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgIHNlYXJjaERlYm91bmNlID0gbnVsbDtcbiAgICBjb25zdCBxdWVyeVRleHQgPSB6b29tU2VhcmNoLnZhbHVlLnRyaW0oKTtcbiAgICBpZiAoIXF1ZXJ5VGV4dCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ3pvb20uc2VhcmNoJywgeyBxdWVyeVRleHQgfSk7XG4gICAgICBjb25zdCBpdGVtcyA9IHJlcy5wYXlsb2FkPy5pdGVtcyA/PyByZXMucGF5bG9hZD8ucmVzdWx0cz8uaXRlbXMgPz8gW107XG4gICAgICBpZiAoaXRlbXMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBqdW1wID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ3pvb20uc2VhcmNoJywgeyBqdW1wSXRlbTogaXRlbXNbMF0gfSk7XG4gICAgICAgIGhhbmRsZUdyYXBoKGp1bXAucGF5bG9hZCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBOb24tZmF0YWxcbiAgICB9XG4gIH0sIDMwMCk7XG59KTtcblxuc3dpdGNoUGVyc3BlY3RpdmVCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICBjb25zdCB0YXJnZXRTeW1ib2wgPVxuICAgIGFjdGl2ZU5vZGVJZCAmJiBjdXJyZW50RHRvPy5kdG9LaW5kID09PSAnY2FsbF9ncmFwaCcgJiYgIWFjdGl2ZU5vZGVJZC5zdGFydHNXaXRoKCdidWNrZXQ6JylcbiAgICAgID8gYWN0aXZlTm9kZUlkXG4gICAgICA6IHNlbGVjdGVkU3ltYm9sSWQgfHwgKGZ1bmN0aW9uUGlja2VyPy5vcHRpb25zWzBdPy52YWx1ZSA/PyBudWxsKTtcbiAgaWYgKCF0YXJnZXRTeW1ib2wpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKGN1cnJlbnREdG8/LmR0b0tpbmQgPT09ICdjYWxsX2dyYXBoJykge1xuICAgIGFjdGl2ZVBlcnNwZWN0aXZlID0gJ2NmZyc7XG4gICAgaWYgKHBlcnNwZWN0aXZlU2VsZWN0KSB7XG4gICAgICBwZXJzcGVjdGl2ZVNlbGVjdC52YWx1ZSA9ICdjZmcnO1xuICAgIH1cbiAgICB2b2lkIGxvYWRDZmcodGFyZ2V0U3ltYm9sKTtcbiAgfSBlbHNlIHtcbiAgICBhY3RpdmVQZXJzcGVjdGl2ZSA9ICdjYWxsX2dyYXBoJztcbiAgICBpZiAocGVyc3BlY3RpdmVTZWxlY3QpIHtcbiAgICAgIHBlcnNwZWN0aXZlU2VsZWN0LnZhbHVlID0gJ2NhbGxfZ3JhcGgnO1xuICAgIH1cbiAgICB2b2lkIGxvYWRDYWxsR3JhcGgodGFyZ2V0U3ltYm9sKTtcbiAgfVxufSk7XG5cbmNhbGxzRXhwYW5kQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGFzeW5jICgpID0+IHtcbiAgaWYgKCFhY3RpdmVOb2RlSWQgfHwgY3VycmVudER0bz8uZHRvS2luZCAhPT0gJ2NhbGxfZ3JhcGgnKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ2NhbGxzLmV4cGFuZCcsIHsgc3ltYm9sSWQ6IGFjdGl2ZU5vZGVJZCB9KTtcbiAgICBoYW5kbGVHcmFwaChyZXMucGF5bG9hZCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgc2V0QmFubmVyKGBFeHBhbmQgZmFpbGVkOiAke2Vycm9yPy5tZXNzYWdlID8/IFN0cmluZyhlcnJvcil9YCwgdHJ1ZSk7XG4gIH1cbn0pO1xuXG5jYWxsc0NvbGxhcHNlQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGFzeW5jICgpID0+IHtcbiAgaWYgKCFhY3RpdmVOb2RlSWQgfHwgY3VycmVudER0bz8uZHRvS2luZCAhPT0gJ2NhbGxfZ3JhcGgnKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ2NhbGxzLmNvbGxhcHNlJywgeyBzeW1ib2xJZDogYWN0aXZlTm9kZUlkIH0pO1xuICAgIGhhbmRsZUdyYXBoKHJlcy5wYXlsb2FkKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBzZXRCYW5uZXIoYENvbGxhcHNlIGZhaWxlZDogJHtlcnJvcj8ubWVzc2FnZSA/PyBTdHJpbmcoZXJyb3IpfWAsIHRydWUpO1xuICB9XG59KTtcblxuY2FsbHNGb2N1c0J0bj8uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBhc3luYyAoKSA9PiB7XG4gIGlmIChjdXJyZW50RHRvPy5kdG9LaW5kICE9PSAnY2FsbF9ncmFwaCcpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgbmV4dEZvY3VzID0gY3VycmVudER0by5mb2N1c2VkTm9kZUlkID8gbnVsbCA6IChhY3RpdmVOb2RlSWQgPz8gY3VycmVudER0by5jZW50ZXJTeW1ib2xJZCk7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ2NhbGxzLmZvY3VzJywgeyBzeW1ib2xJZDogbmV4dEZvY3VzIH0pO1xuICAgIGhhbmRsZUdyYXBoKHJlcy5wYXlsb2FkKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBzZXRCYW5uZXIoYEZvY3VzIGZhaWxlZDogJHtlcnJvcj8ubWVzc2FnZSA/PyBTdHJpbmcoZXJyb3IpfWAsIHRydWUpO1xuICB9XG59KTtcblxuY2FsbHNGaWx0ZXJTdGF0dXM/LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGFzeW5jICgpID0+IHtcbiAgaWYgKGN1cnJlbnREdG8/LmR0b0tpbmQgIT09ICdjYWxsX2dyYXBoJykge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCB2YWx1ZSA9IGNhbGxzRmlsdGVyU3RhdHVzLnZhbHVlO1xuICBjb25zdCBzdGF0dXNlcyA9IHZhbHVlID09PSAnYWxsJyA/IG51bGwgOiB2YWx1ZS5zcGxpdCgnLCcpO1xuICB0cnkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGJyaWRnZS5yZXF1ZXN0KCdjYWxscy5maWx0ZXInLCB7IHN0YXR1c2VzIH0pO1xuICAgIGhhbmRsZUdyYXBoKHJlcy5wYXlsb2FkKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBzZXRCYW5uZXIoYEZpbHRlciBmYWlsZWQ6ICR7ZXJyb3I/Lm1lc3NhZ2UgPz8gU3RyaW5nKGVycm9yKX1gLCB0cnVlKTtcbiAgfVxufSk7XG5cbmNhbGxlcnNNb3JlQnRuPy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgaWYgKGN1cnJlbnREdG8/LmNlbnRlclN5bWJvbElkKSB7XG4gICAgdm9pZCBsb2FkTmVpZ2hib3JQYWdlKCdpbmNvbWluZycsIGN1cnJlbnREdG8uY2VudGVyU3ltYm9sSWQsIHRydWUpO1xuICB9XG59KTtcblxuY2FsbGVlc01vcmVCdG4/LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICBpZiAoY3VycmVudER0bz8uY2VudGVyU3ltYm9sSWQpIHtcbiAgICB2b2lkIGxvYWROZWlnaGJvclBhZ2UoJ291dGdvaW5nJywgY3VycmVudER0by5jZW50ZXJTeW1ib2xJZCwgdHJ1ZSk7XG4gIH1cbn0pO1xuXG5leHBsYWluRGVwdGhTZWxlY3Q/LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHtcbiAgYWN0aXZlRXhwbGFpbkRlcHRoID0gY2xhbXBFeHBsYW5hdGlvbkRlcHRoKGV4cGxhaW5EZXB0aFNlbGVjdC52YWx1ZSk7XG4gIGlmIChhY3RpdmVOb2RlSWQpIHtcbiAgICB2b2lkIGxvYWROb2RlRXhwbGFuYXRpb24oYWN0aXZlTm9kZUlkKTtcbiAgfVxuICBpZiAoY3VycmVudER0bz8uZHRvS2luZCA9PT0gJ2NmZycpIHtcbiAgICB2b2lkIGxvYWRGdW5jdGlvblN1bW1hcnkoY3VycmVudER0byk7XG4gIH1cbn0pO1xuXG4vLyBSb3V0ZSBWUyBDb2RlIGV4dGVuc2lvbi1ob3N0IG1lc3NhZ2VzIGludG8gdGhlIGJyaWRnZSBzbyBldmVyeSBwZW5kaW5nXG4vLyByZXF1ZXN0IGlzIHJlc29sdmVkIChvciByZWplY3RlZCkgcmF0aGVyIHRoYW4gdGltaW5nIG91dCBzaWxlbnRseS5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgKGV2ZW50KSA9PiB7XG4gIHZvaWQgYnJpZGdlLmhhbmRsZU1lc3NhZ2UoZXZlbnQuZGF0YSk7XG59KTtcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgKGV2ZW50KSA9PiB7XG4gIHNldEJhbm5lcihgV2VidmlldyBlcnJvcjogJHtldmVudC5tZXNzYWdlfWAsIHRydWUpO1xufSk7XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd1bmhhbmRsZWRyZWplY3Rpb24nLCAoZXZlbnQpID0+IHtcbiAgc2V0QmFubmVyKGBVbmhhbmRsZWQgcmVqZWN0aW9uOiAke1N0cmluZyhldmVudC5yZWFzb24pfWAsIHRydWUpO1xufSk7XG5cbmFzeW5jIGZ1bmN0aW9uIGJvb3QoKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicmlkZ2UucmVxdWVzdCgnd2Vidmlldy5yZWFkeScsIHtcbiAgICAgIGNsaWVudDogJ3dlYnZpZXcnLFxuICAgICAgcHJvdG9jb2xWZXJzaW9uOiBQUk9UT0NPTF9WRVJTSU9OLFxuICAgIH0pO1xuICAgIHNob3dDYXBhYmlsaXRpZXMocmVzcG9uc2UucGF5bG9hZCk7XG4gIH0gY2F0Y2gge1xuICAgIC8vIENhcGFiaWxpdGllcyBhcmUgaW5mb3JtYXRpb25hbDsgZ3JhcGggbG9hZCBjYW4gc3RpbGwgc3VjY2VlZC5cbiAgfVxuICBhd2FpdCBsb2FkR3JhcGgoKTtcbn1cblxudm9pZCBib290KCk7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUVBLGVBQVMsV0FBVyxLQUFLO0FBQ3ZCLFlBQUksZUFBZSxLQUFLO0FBQ3RCLGNBQUksUUFDRixJQUFJLFNBQ0osSUFBSSxNQUNGLFdBQVk7QUFDVixrQkFBTSxJQUFJLE1BQU0sa0JBQWtCO0FBQUEsVUFDcEM7QUFBQSxRQUNOLFdBQVcsZUFBZSxLQUFLO0FBQzdCLGNBQUksTUFDRixJQUFJLFFBQ0osSUFBSSxTQUNGLFdBQVk7QUFDVixrQkFBTSxJQUFJLE1BQU0sa0JBQWtCO0FBQUEsVUFDcEM7QUFBQSxRQUNOO0FBR0EsZUFBTyxPQUFPLEdBQUc7QUFFakIsZUFBTyxvQkFBb0IsR0FBRyxFQUFFLFFBQVEsQ0FBQyxTQUFTO0FBQ2hELGdCQUFNLE9BQU8sSUFBSSxJQUFJO0FBQ3JCLGdCQUFNLE9BQU8sT0FBTztBQUdwQixlQUFLLFNBQVMsWUFBWSxTQUFTLGVBQWUsQ0FBQyxPQUFPLFNBQVMsSUFBSSxHQUFHO0FBQ3hFLHVCQUFXLElBQUk7QUFBQSxVQUNqQjtBQUFBLFFBQ0YsQ0FBQztBQUVELGVBQU87QUFBQSxNQUNUO0FBTUEsVUFBTSxXQUFOLE1BQWU7QUFBQTtBQUFBO0FBQUE7QUFB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QUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBR0EsVUFBTSxpQkFBaUI7QUFBQSxNQUNyQjtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFFQSxVQUFNLGFBQWE7QUFBQSxNQUNqQjtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUVBLFVBQU0saUJBQWlCO0FBQUEsTUFDckI7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBRUEsVUFBTUMsWUFBVztBQUFBLE1BQ2Y7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUdBLFVBQU0sV0FBVyxDQUFFLFNBQVU7QUFFN0IsVUFBTSxlQUFlO0FBQUEsTUFDbkIsTUFBTTtBQUFBLE1BQ04sU0FBUztBQUFBLE1BQ1QsU0FBU0E7QUFBQSxNQUNULFVBQVU7QUFBQSxNQUNWLGFBQWE7QUFBQSxJQUNmO0FBRUEsVUFBTSxvQkFBb0I7QUFBQSxNQUN4QixXQUFXO0FBQUEsTUFDWCxXQUFXO0FB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Q0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBO0FBQUEsSUFFQTtBQUFBLEVBQ0Y7QUFDQSxNQUFNLFdBQVc7QUFBQSxJQUNmO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBR0EsTUFBTSxRQUFRO0FBQUE7QUFBQSxJQUVaO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUE7QUFBQSxJQUVBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUE7QUFBQSxJQUVBO0FBQUEsSUFDQTtBQUFBO0FBQUEsSUFFQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUE7QUFBQSxJQUVBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUE7QUFBQSxJQUVBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBO0FBQUEsSUFFQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBO0FBQUEsSUFFQTtBQUFBLElBQ0E7QUFBQTtBQUFBLElBRUE7QUFBQTtBQUFBLElBRUE7QUFBQSxFQUNGO0FBRUEsTUFBTSxjQUFjO0FBQUEsSUFDbEI7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUVBLE1BQU0sbUJBQW1CO0FBQUEsSUFDdkI7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUVBO0FBQUEsSUFDQTtBQUFBLElBRUE7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFD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LFlBQVksV0FBVyxnQkFBZ0IsSUFBSTtBQUFBLElBQ25FO0FBQUEsRUFDRixDQUFDO0FBRUQsa0JBQWdCLGlCQUFpQixTQUFTLE1BQU07QUFDOUMsUUFBSSxZQUFZLGdCQUFnQjtBQUM5QixXQUFLLGlCQUFpQixZQUFZLFdBQVcsZ0JBQWdCLElBQUk7QUFBQSxJQUNuRTtBQUFBLEVBQ0YsQ0FBQztBQUVELHNCQUFvQixpQkFBaUIsVUFBVSxNQUFNO0FBQ25ELHlCQUFxQixzQkFBc0IsbUJBQW1CLEtBQUs7QUFDbkUsUUFBSSxjQUFjO0FBQ2hCLFdBQUssb0JBQW9CLFlBQVk7QUFBQSxJQUN2QztBQUNBLFFBQUksWUFBWSxZQUFZLE9BQU87QUFDakMsV0FBSyxvQkFBb0IsVUFBVTtBQUFBLElBQ3JDO0FBQUEsRUFDRixDQUFDO0FBSUQsU0FBTyxpQkFBaUIsV0FBVyxDQUFDLFVBQVU7QUFDNUMsU0FBSyxPQUFPLGNBQWMsTUFBTSxJQUFJO0FBQUEsRUFDdEMsQ0FBQztBQUVELFNBQU8saUJBQWlCLFNBQVMsQ0FBQyxVQUFVO0FBQzFDLGNBQVUsa0JBQWtCLE1BQU0sT0FBTyxJQUFJLElBQUk7QUFBQSxFQUNuRCxDQUFDO0FBRUQsU0FBTyxpQkFBaUIsc0JBQXNCLENBQUMsVUFBVTtBQUN2RCxjQUFVLHdCQUF3QixPQUFPLE1BQU0sTUFBTSxDQUFDLElBQUksSUFBSTtBQUFBLEVBQ2hFLENBQUM7QUFFRCxpQkFBZSxPQUFPO0FBQ3BCLFFBQUk7QUFDRixZQUFNLFdBQVcsTUFBTSxPQUFPLFFBQVEsaUJBQWlCO0FBQUEsUUFDckQsUUFBUTtBQUFBLFFBQ1IsaUJBQWlCO0FBQUEsTUFDbkIsQ0FBQztBQUNELHVCQUFpQixTQUFTLE9BQU87QUFBQSxJQUNuQyxRQUFRO0FBQUEsSUFFUjtBQUNBLFVBQU0sVUFBVTtBQUFBLEVBQ2xCO0FBRUEsT0FBSyxLQUFLOyIsCiAgIm5hbWVzIjogWyJyZW5kZXJlciIsICJJREVOVF9SRSIsICJzY29wZU5hbWUiLCAidmVyc2lvbiIsICJpIiwgImhpZ2hsaWdodCIsICJyZXN1bHQiLCAiYm9vdCIsICJzdmciLCAiZW1wdHkiLCAiYXNCb29sZWFuIiwgIkhpZ2hsaWdodEpTIiwgIkxJVEVSQUxTIiwgImFjdGl2ZU5vZGVJZCJdCn0K
