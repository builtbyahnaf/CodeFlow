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
    "navigate.to"
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
    "settings.data"
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
            class: `cf-edge cf-edge--${edge.status} cf-edge--kind-${edge.kind ?? edge.type}`,
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
            class: `cf-node cf-node--${node.status} cf-node--kind-${node.kind}${node.external ? " cf-node--external" : ""}${node.unreachable ? " cf-node--unreachable" : ""}`,
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
  var currentDto = null;
  var preferredSymbolId = document.body.dataset.preferredSymbol || null;
  var selectedSymbolId = preferredSymbolId;
  var settings = resolvePreviewSettings({});
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
    detailBody.replaceChildren();
    const paragraph = document.createElement("p");
    paragraph.className = "cf-muted";
    paragraph.textContent = "Select a node to inspect it.";
    detailBody.appendChild(paragraph);
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
  }
  function applySettings(next) {
    const previousMaxLines = settings.maxLines;
    settings = resolvePreviewSettings({ ...settings, ...next });
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
    const subject = dto.dtoKind === "cfg" && dto.function ? `${dto.function.qualifiedName} \xB7 CFG` : "call graph";
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
    const activeNodeId = typeof payload?.activeNodeId === "string" ? payload.activeNodeId : null;
    if (activeNodeId) {
      const node = nodeById(activeNodeId);
      if (node) {
        showNodeDetails(activeNodeId, node);
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
  async function loadGraph() {
    setStatus("Loading graph\u2026");
    setBanner("");
    try {
      const response = await bridge.request("cfg.functions", {});
      const list = Array.isArray(response.payload.functions) ? response.payload.functions : [];
      if (list.length > 0) {
        renderFunctionPicker(list);
        const retained = selectedSymbolId && list.some((entry) => entry.symbolId === selectedSymbolId) ? selectedSymbolId : list[0].symbolId;
        const loaded = await loadCfg(retained);
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
      void loadCfg(symbolId);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vbm9kZV9tb2R1bGVzL2hpZ2hsaWdodC5qcy9saWIvY29yZS5qcyIsICIuLi8uLi9zcmMvY29yZS9wcm90b2NvbC9lbnZlbG9wZS5qcyIsICIuLi8uLi9zcmMvY29yZS9wcm90b2NvbC9icmlkZ2UuanMiLCAiLi4vLi4vc3JjL2NvcmUvZ3JhcGgvbGF5b3V0LmpzIiwgIi4uLy4uL3NyYy9jb3JlL2dyYXBoL2NmZy9raW5kcy5qcyIsICIuLi8uLi9zcmMvY29yZS9ncmFwaC9kdG8uanMiLCAiLi4vLi4vc3JjL3Zpc3VhbGl6YXRpb24vcmVuZGVyZXIvc3ZnUmVuZGVyZXIuanMiLCAiLi4vLi4vc3JjL2NvcmUvc291cmNlL3Jhbmdlcy5qcyIsICIuLi8uLi9zcmMvY29yZS9zb3VyY2UvcHJlc2VudGF0aW9uLmpzIiwgIi4uLy4uL3NyYy9jb3JlL3NvdXJjZS9zZXR0aW5ncy5qcyIsICIuLi8uLi9zcmMvd2Vidmlldy9wcmV2aWV3Q29udHJvbGxlci5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvaGlnaGxpZ2h0LmpzL2VzL2NvcmUuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2hpZ2hsaWdodC5qcy9lcy9sYW5ndWFnZXMvY3BwLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9oaWdobGlnaHQuanMvZXMvbGFuZ3VhZ2VzL2phdmFzY3JpcHQuanMiLCAiLi4vLi4vc3JjL3dlYnZpZXcvaGlnaGxpZ2h0LmpzIiwgIi4uLy4uL3NyYy93ZWJ2aWV3L21haW4uanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qIGVzbGludC1kaXNhYmxlIG5vLW11bHRpLWFzc2lnbiAqL1xuXG5mdW5jdGlvbiBkZWVwRnJlZXplKG9iaikge1xuICBpZiAob2JqIGluc3RhbmNlb2YgTWFwKSB7XG4gICAgb2JqLmNsZWFyID1cbiAgICAgIG9iai5kZWxldGUgPVxuICAgICAgb2JqLnNldCA9XG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21hcCBpcyByZWFkLW9ubHknKTtcbiAgICAgICAgfTtcbiAgfSBlbHNlIGlmIChvYmogaW5zdGFuY2VvZiBTZXQpIHtcbiAgICBvYmouYWRkID1cbiAgICAgIG9iai5jbGVhciA9XG4gICAgICBvYmouZGVsZXRlID1cbiAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignc2V0IGlzIHJlYWQtb25seScpO1xuICAgICAgICB9O1xuICB9XG5cbiAgLy8gRnJlZXplIHNlbGZcbiAgT2JqZWN0LmZyZWV6ZShvYmopO1xuXG4gIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG9iaikuZm9yRWFjaCgobmFtZSkgPT4ge1xuICAgIGNvbnN0IHByb3AgPSBvYmpbbmFtZV07XG4gICAgY29uc3QgdHlwZSA9IHR5cGVvZiBwcm9wO1xuXG4gICAgLy8gRnJlZXplIHByb3AgaWYgaXQgaXMgYW4gb2JqZWN0IG9yIGZ1bmN0aW9uIGFuZCBhbHNvIG5vdCBhbHJlYWR5IGZyb3plblxuICAgIGlmICgodHlwZSA9PT0gJ29iamVjdCcgfHwgdHlwZSA9PT0gJ2Z1bmN0aW9uJykgJiYgIU9iamVjdC5pc0Zyb3plbihwcm9wKSkge1xuICAgICAgZGVlcEZyZWV6ZShwcm9wKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBvYmo7XG59XG5cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5DYWxsYmFja1Jlc3BvbnNlfSBDYWxsYmFja1Jlc3BvbnNlICovXG4vKiogQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQ29tcGlsZWRNb2RlfSBDb21waWxlZE1vZGUgKi9cbi8qKiBAaW1wbGVtZW50cyBDYWxsYmFja1Jlc3BvbnNlICovXG5cbmNsYXNzIFJlc3BvbnNlIHtcbiAgLyoqXG4gICAqIEBwYXJhbSB7Q29tcGlsZWRNb2RlfSBtb2RlXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihtb2RlKSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmaW5lZFxuICAgIGlmIChtb2RlLmRhdGEgPT09IHVuZGVmaW5lZCkgbW9kZS5kYXRhID0ge307XG5cbiAgICB0aGlzLmRhdGEgPSBtb2RlLmRhdGE7XG4gICAgdGhpcy5pc01hdGNoSWdub3JlZCA9IGZhbHNlO1xuICB9XG5cbiAgaWdub3JlTWF0Y2goKSB7XG4gICAgdGhpcy5pc01hdGNoSWdub3JlZCA9IHRydWU7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVzY2FwZUhUTUwodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlXG4gICAgLnJlcGxhY2UoLyYvZywgJyZhbXA7JylcbiAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXG4gICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKVxuICAgIC5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7JylcbiAgICAucmVwbGFjZSgvJy9nLCAnJiN4Mjc7Jyk7XG59XG5cbi8qKlxuICogcGVyZm9ybXMgYSBzaGFsbG93IG1lcmdlIG9mIG11bHRpcGxlIG9iamVjdHMgaW50byBvbmVcbiAqXG4gKiBAdGVtcGxhdGUgVFxuICogQHBhcmFtIHtUfSBvcmlnaW5hbFxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLGFueT5bXX0gb2JqZWN0c1xuICogQHJldHVybnMge1R9IGEgc2luZ2xlIG5ldyBvYmplY3RcbiAqL1xuZnVuY3Rpb24gaW5oZXJpdCQxKG9yaWdpbmFsLCAuLi5vYmplY3RzKSB7XG4gIC8qKiBAdHlwZSBSZWNvcmQ8c3RyaW5nLGFueT4gKi9cbiAgY29uc3QgcmVzdWx0ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICBmb3IgKGNvbnN0IGtleSBpbiBvcmlnaW5hbCkge1xuICAgIHJlc3VsdFtrZXldID0gb3JpZ2luYWxba2V5XTtcbiAgfVxuICBvYmplY3RzLmZvckVhY2goZnVuY3Rpb24ob2JqKSB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gb2JqKSB7XG4gICAgICByZXN1bHRba2V5XSA9IG9ialtrZXldO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiAvKiogQHR5cGUge1R9ICovIChyZXN1bHQpO1xufVxuXG4vKipcbiAqIEB0eXBlZGVmIHtvYmplY3R9IFJlbmRlcmVyXG4gKiBAcHJvcGVydHkgeyh0ZXh0OiBzdHJpbmcpID0+IHZvaWR9IGFkZFRleHRcbiAqIEBwcm9wZXJ0eSB7KG5vZGU6IE5vZGUpID0+IHZvaWR9IG9wZW5Ob2RlXG4gKiBAcHJvcGVydHkgeyhub2RlOiBOb2RlKSA9PiB2b2lkfSBjbG9zZU5vZGVcbiAqIEBwcm9wZXJ0eSB7KCkgPT4gc3RyaW5nfSB2YWx1ZVxuICovXG5cbi8qKiBAdHlwZWRlZiB7e3Njb3BlPzogc3RyaW5nLCBsYW5ndWFnZT86IHN0cmluZywgc3VibGFuZ3VhZ2U/OiBib29sZWFufX0gTm9kZSAqL1xuLyoqIEB0eXBlZGVmIHt7d2FsazogKHI6IFJlbmRlcmVyKSA9PiB2b2lkfX0gVHJlZSAqL1xuLyoqICovXG5cbmNvbnN0IFNQQU5fQ0xPU0UgPSAnPC9zcGFuPic7XG5cbi8qKlxuICogRGV0ZXJtaW5lcyBpZiBhIG5vZGUgbmVlZHMgdG8gYmUgd3JhcHBlZCBpbiA8c3Bhbj5cbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGUgKi9cbmNvbnN0IGVtaXRzV3JhcHBpbmdUYWdzID0gKG5vZGUpID0+IHtcbiAgLy8gcmFyZWx5IHdlIGNhbiBoYXZlIGEgc3VibGFuZ3VhZ2Ugd2hlcmUgbGFuZ3VhZ2UgaXMgdW5kZWZpbmVkXG4gIC8vIFRPRE86IHRyYWNrIGRvd24gd2h5XG4gIHJldHVybiAhIW5vZGUuc2NvcGU7XG59O1xuXG4vKipcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZVxuICogQHBhcmFtIHt7cHJlZml4OnN0cmluZ319IG9wdGlvbnNcbiAqL1xuY29uc3Qgc2NvcGVUb0NTU0NsYXNzID0gKG5hbWUsIHsgcHJlZml4IH0pID0+IHtcbiAgLy8gc3ViLWxhbmd1YWdlXG4gIGlmIChuYW1lLnN0YXJ0c1dpdGgoXCJsYW5ndWFnZTpcIikpIHtcbiAgICByZXR1cm4gbmFtZS5yZXBsYWNlKFwibGFuZ3VhZ2U6XCIsIFwibGFuZ3VhZ2UtXCIpO1xuICB9XG4gIC8vIHRpZXJlZCBzY29wZTogY29tbWVudC5saW5lXG4gIGlmIChuYW1lLmluY2x1ZGVzKFwiLlwiKSkge1xuICAgIGNvbnN0IHBpZWNlcyA9IG5hbWUuc3BsaXQoXCIuXCIpO1xuICAgIHJldHVybiBbXG4gICAgICBgJHtwcmVmaXh9JHtwaWVjZXMuc2hpZnQoKX1gLFxuICAgICAgLi4uKHBpZWNlcy5tYXAoKHgsIGkpID0+IGAke3h9JHtcIl9cIi5yZXBlYXQoaSArIDEpfWApKVxuICAgIF0uam9pbihcIiBcIik7XG4gIH1cbiAgLy8gc2ltcGxlIHNjb3BlXG4gIHJldHVybiBgJHtwcmVmaXh9JHtuYW1lfWA7XG59O1xuXG4vKiogQHR5cGUge1JlbmRlcmVyfSAqL1xuY2xhc3MgSFRNTFJlbmRlcmVyIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgSFRNTFJlbmRlcmVyXG4gICAqXG4gICAqIEBwYXJhbSB7VHJlZX0gcGFyc2VUcmVlIC0gdGhlIHBhcnNlIHRyZWUgKG11c3Qgc3VwcG9ydCBgd2Fsa2AgQVBJKVxuICAgKiBAcGFyYW0ge3tjbGFzc1ByZWZpeDogc3RyaW5nfX0gb3B0aW9uc1xuICAgKi9cbiAgY29uc3RydWN0b3IocGFyc2VUcmVlLCBvcHRpb25zKSB7XG4gICAgdGhpcy5idWZmZXIgPSBcIlwiO1xuICAgIHRoaXMuY2xhc3NQcmVmaXggPSBvcHRpb25zLmNsYXNzUHJlZml4O1xuICAgIHBhcnNlVHJlZS53YWxrKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdGV4dHMgdG8gdGhlIG91dHB1dCBzdHJlYW1cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRleHQgKi9cbiAgYWRkVGV4dCh0ZXh0KSB7XG4gICAgdGhpcy5idWZmZXIgKz0gZXNjYXBlSFRNTCh0ZXh0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgbm9kZSBvcGVuIHRvIHRoZSBvdXRwdXQgc3RyZWFtIChpZiBuZWVkZWQpXG4gICAqXG4gICAqIEBwYXJhbSB7Tm9kZX0gbm9kZSAqL1xuICBvcGVuTm9kZShub2RlKSB7XG4gICAgaWYgKCFlbWl0c1dyYXBwaW5nVGFncyhub2RlKSkgcmV0dXJuO1xuXG4gICAgY29uc3QgY2xhc3NOYW1lID0gc2NvcGVUb0NTU0NsYXNzKG5vZGUuc2NvcGUsXG4gICAgICB7IHByZWZpeDogdGhpcy5jbGFzc1ByZWZpeCB9KTtcbiAgICB0aGlzLnNwYW4oY2xhc3NOYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgbm9kZSBjbG9zZSB0byB0aGUgb3V0cHV0IHN0cmVhbSAoaWYgbmVlZGVkKVxuICAgKlxuICAgKiBAcGFyYW0ge05vZGV9IG5vZGUgKi9cbiAgY2xvc2VOb2RlKG5vZGUpIHtcbiAgICBpZiAoIWVtaXRzV3JhcHBpbmdUYWdzKG5vZGUpKSByZXR1cm47XG5cbiAgICB0aGlzLmJ1ZmZlciArPSBTUEFOX0NMT1NFO1xuICB9XG5cbiAgLyoqXG4gICAqIHJldHVybnMgdGhlIGFjY3VtdWxhdGVkIGJ1ZmZlclxuICAqL1xuICB2YWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5idWZmZXI7XG4gIH1cblxuICAvLyBoZWxwZXJzXG5cbiAgLyoqXG4gICAqIEJ1aWxkcyBhIHNwYW4gZWxlbWVudFxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NOYW1lICovXG4gIHNwYW4oY2xhc3NOYW1lKSB7XG4gICAgdGhpcy5idWZmZXIgKz0gYDxzcGFuIGNsYXNzPVwiJHtjbGFzc05hbWV9XCI+YDtcbiAgfVxufVxuXG4vKiogQHR5cGVkZWYge3tzY29wZT86IHN0cmluZywgbGFuZ3VhZ2U/OiBzdHJpbmcsIGNoaWxkcmVuOiBOb2RlW119IHwgc3RyaW5nfSBOb2RlICovXG4vKiogQHR5cGVkZWYge3tzY29wZT86IHN0cmluZywgbGFuZ3VhZ2U/OiBzdHJpbmcsIGNoaWxkcmVuOiBOb2RlW119IH0gRGF0YU5vZGUgKi9cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5FbWl0dGVyfSBFbWl0dGVyICovXG4vKiogICovXG5cbi8qKiBAcmV0dXJucyB7RGF0YU5vZGV9ICovXG5jb25zdCBuZXdOb2RlID0gKG9wdHMgPSB7fSkgPT4ge1xuICAvKiogQHR5cGUgRGF0YU5vZGUgKi9cbiAgY29uc3QgcmVzdWx0ID0geyBjaGlsZHJlbjogW10gfTtcbiAgT2JqZWN0LmFzc2lnbihyZXN1bHQsIG9wdHMpO1xuICByZXR1cm4gcmVzdWx0O1xufTtcblxuY2xhc3MgVG9rZW5UcmVlIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLyoqIEB0eXBlIERhdGFOb2RlICovXG4gICAgdGhpcy5yb290Tm9kZSA9IG5ld05vZGUoKTtcbiAgICB0aGlzLnN0YWNrID0gW3RoaXMucm9vdE5vZGVdO1xuICB9XG5cbiAgZ2V0IHRvcCgpIHtcbiAgICByZXR1cm4gdGhpcy5zdGFja1t0aGlzLnN0YWNrLmxlbmd0aCAtIDFdO1xuICB9XG5cbiAgZ2V0IHJvb3QoKSB7IHJldHVybiB0aGlzLnJvb3ROb2RlOyB9XG5cbiAgLyoqIEBwYXJhbSB7Tm9kZX0gbm9kZSAqL1xuICBhZGQobm9kZSkge1xuICAgIHRoaXMudG9wLmNoaWxkcmVuLnB1c2gobm9kZSk7XG4gIH1cblxuICAvKiogQHBhcmFtIHtzdHJpbmd9IHNjb3BlICovXG4gIG9wZW5Ob2RlKHNjb3BlKSB7XG4gICAgLyoqIEB0eXBlIE5vZGUgKi9cbiAgICBjb25zdCBub2RlID0gbmV3Tm9kZSh7IHNjb3BlIH0pO1xuICAgIHRoaXMuYWRkKG5vZGUpO1xuICAgIHRoaXMuc3RhY2sucHVzaChub2RlKTtcbiAgfVxuXG4gIGNsb3NlTm9kZSgpIHtcbiAgICBpZiAodGhpcy5zdGFjay5sZW5ndGggPiAxKSB7XG4gICAgICByZXR1cm4gdGhpcy5zdGFjay5wb3AoKTtcbiAgICB9XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmaW5lZFxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBjbG9zZUFsbE5vZGVzKCkge1xuICAgIHdoaWxlICh0aGlzLmNsb3NlTm9kZSgpKTtcbiAgfVxuXG4gIHRvSlNPTigpIHtcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodGhpcy5yb290Tm9kZSwgbnVsbCwgNCk7XG4gIH1cblxuICAvKipcbiAgICogQHR5cGVkZWYgeyBpbXBvcnQoXCIuL2h0bWxfcmVuZGVyZXJcIikuUmVuZGVyZXIgfSBSZW5kZXJlclxuICAgKiBAcGFyYW0ge1JlbmRlcmVyfSBidWlsZGVyXG4gICAqL1xuICB3YWxrKGJ1aWxkZXIpIHtcbiAgICAvLyB0aGlzIGRvZXMgbm90XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuX3dhbGsoYnVpbGRlciwgdGhpcy5yb290Tm9kZSk7XG4gICAgLy8gdGhpcyB3b3Jrc1xuICAgIC8vIHJldHVybiBUb2tlblRyZWUuX3dhbGsoYnVpbGRlciwgdGhpcy5yb290Tm9kZSk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtSZW5kZXJlcn0gYnVpbGRlclxuICAgKiBAcGFyYW0ge05vZGV9IG5vZGVcbiAgICovXG4gIHN0YXRpYyBfd2FsayhidWlsZGVyLCBub2RlKSB7XG4gICAgaWYgKHR5cGVvZiBub2RlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBidWlsZGVyLmFkZFRleHQobm9kZSk7XG4gICAgfSBlbHNlIGlmIChub2RlLmNoaWxkcmVuKSB7XG4gICAgICBidWlsZGVyLm9wZW5Ob2RlKG5vZGUpO1xuICAgICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4gdGhpcy5fd2FsayhidWlsZGVyLCBjaGlsZCkpO1xuICAgICAgYnVpbGRlci5jbG9zZU5vZGUobm9kZSk7XG4gICAgfVxuICAgIHJldHVybiBidWlsZGVyO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7Tm9kZX0gbm9kZVxuICAgKi9cbiAgc3RhdGljIF9jb2xsYXBzZShub2RlKSB7XG4gICAgaWYgKHR5cGVvZiBub2RlID09PSBcInN0cmluZ1wiKSByZXR1cm47XG4gICAgaWYgKCFub2RlLmNoaWxkcmVuKSByZXR1cm47XG5cbiAgICBpZiAobm9kZS5jaGlsZHJlbi5ldmVyeShlbCA9PiB0eXBlb2YgZWwgPT09IFwic3RyaW5nXCIpKSB7XG4gICAgICAvLyBub2RlLnRleHQgPSBub2RlLmNoaWxkcmVuLmpvaW4oXCJcIik7XG4gICAgICAvLyBkZWxldGUgbm9kZS5jaGlsZHJlbjtcbiAgICAgIG5vZGUuY2hpbGRyZW4gPSBbbm9kZS5jaGlsZHJlbi5qb2luKFwiXCIpXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4ge1xuICAgICAgICBUb2tlblRyZWUuX2NvbGxhcHNlKGNoaWxkKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAgQ3VycmVudGx5IHRoaXMgaXMgYWxsIHByaXZhdGUgQVBJLCBidXQgdGhpcyBpcyB0aGUgbWluaW1hbCBBUEkgbmVjZXNzYXJ5XG4gIHRoYXQgYW4gRW1pdHRlciBtdXN0IGltcGxlbWVudCB0byBmdWxseSBzdXBwb3J0IHRoZSBwYXJzZXIuXG5cbiAgTWluaW1hbCBpbnRlcmZhY2U6XG5cbiAgLSBhZGRUZXh0KHRleHQpXG4gIC0gX19hZGRTdWJsYW5ndWFnZShlbWl0dGVyLCBzdWJMYW5ndWFnZU5hbWUpXG4gIC0gc3RhcnRTY29wZShzY29wZSlcbiAgLSBlbmRTY29wZSgpXG4gIC0gZmluYWxpemUoKVxuICAtIHRvSFRNTCgpXG5cbiovXG5cbi8qKlxuICogQGltcGxlbWVudHMge0VtaXR0ZXJ9XG4gKi9cbmNsYXNzIFRva2VuVHJlZUVtaXR0ZXIgZXh0ZW5kcyBUb2tlblRyZWUge1xuICAvKipcbiAgICogQHBhcmFtIHsqfSBvcHRpb25zXG4gICAqL1xuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gICAqL1xuICBhZGRUZXh0KHRleHQpIHtcbiAgICBpZiAodGV4dCA9PT0gXCJcIikgeyByZXR1cm47IH1cblxuICAgIHRoaXMuYWRkKHRleHQpO1xuICB9XG5cbiAgLyoqIEBwYXJhbSB7c3RyaW5nfSBzY29wZSAqL1xuICBzdGFydFNjb3BlKHNjb3BlKSB7XG4gICAgdGhpcy5vcGVuTm9kZShzY29wZSk7XG4gIH1cblxuICBlbmRTY29wZSgpIHtcbiAgICB0aGlzLmNsb3NlTm9kZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7RW1pdHRlciAmIHtyb290OiBEYXRhTm9kZX19IGVtaXR0ZXJcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICovXG4gIF9fYWRkU3VibGFuZ3VhZ2UoZW1pdHRlciwgbmFtZSkge1xuICAgIC8qKiBAdHlwZSBEYXRhTm9kZSAqL1xuICAgIGNvbnN0IG5vZGUgPSBlbWl0dGVyLnJvb3Q7XG4gICAgaWYgKG5hbWUpIG5vZGUuc2NvcGUgPSBgbGFuZ3VhZ2U6JHtuYW1lfWA7XG5cbiAgICB0aGlzLmFkZChub2RlKTtcbiAgfVxuXG4gIHRvSFRNTCgpIHtcbiAgICBjb25zdCByZW5kZXJlciA9IG5ldyBIVE1MUmVuZGVyZXIodGhpcywgdGhpcy5vcHRpb25zKTtcbiAgICByZXR1cm4gcmVuZGVyZXIudmFsdWUoKTtcbiAgfVxuXG4gIGZpbmFsaXplKCkge1xuICAgIHRoaXMuY2xvc2VBbGxOb2RlcygpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gKiBAcmV0dXJucyB7UmVnRXhwfVxuICogKi9cblxuLyoqXG4gKiBAcGFyYW0ge1JlZ0V4cCB8IHN0cmluZyB9IHJlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBzb3VyY2UocmUpIHtcbiAgaWYgKCFyZSkgcmV0dXJuIG51bGw7XG4gIGlmICh0eXBlb2YgcmUgPT09IFwic3RyaW5nXCIpIHJldHVybiByZTtcblxuICByZXR1cm4gcmUuc291cmNlO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVnRXhwIHwgc3RyaW5nIH0gcmVcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGxvb2thaGVhZChyZSkge1xuICByZXR1cm4gY29uY2F0KCcoPz0nLCByZSwgJyknKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlZ0V4cCB8IHN0cmluZyB9IHJlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBhbnlOdW1iZXJPZlRpbWVzKHJlKSB7XG4gIHJldHVybiBjb25jYXQoJyg/OicsIHJlLCAnKSonKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlZ0V4cCB8IHN0cmluZyB9IHJlXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5mdW5jdGlvbiBvcHRpb25hbChyZSkge1xuICByZXR1cm4gY29uY2F0KCcoPzonLCByZSwgJyk/Jyk7XG59XG5cbi8qKlxuICogQHBhcmFtIHsuLi4oUmVnRXhwIHwgc3RyaW5nKSB9IGFyZ3NcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGNvbmNhdCguLi5hcmdzKSB7XG4gIGNvbnN0IGpvaW5lZCA9IGFyZ3MubWFwKCh4KSA9PiBzb3VyY2UoeCkpLmpvaW4oXCJcIik7XG4gIHJldHVybiBqb2luZWQ7XG59XG5cbi8qKlxuICogQHBhcmFtIHsgQXJyYXk8c3RyaW5nIHwgUmVnRXhwIHwgT2JqZWN0PiB9IGFyZ3NcbiAqIEByZXR1cm5zIHtvYmplY3R9XG4gKi9cbmZ1bmN0aW9uIHN0cmlwT3B0aW9uc0Zyb21BcmdzKGFyZ3MpIHtcbiAgY29uc3Qgb3B0cyA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcblxuICBpZiAodHlwZW9mIG9wdHMgPT09ICdvYmplY3QnICYmIG9wdHMuY29uc3RydWN0b3IgPT09IE9iamVjdCkge1xuICAgIGFyZ3Muc3BsaWNlKGFyZ3MubGVuZ3RoIC0gMSwgMSk7XG4gICAgcmV0dXJuIG9wdHM7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG59XG5cbi8qKiBAdHlwZWRlZiB7IHtjYXB0dXJlPzogYm9vbGVhbn0gfSBSZWdleEVpdGhlck9wdGlvbnMgKi9cblxuLyoqXG4gKiBBbnkgb2YgdGhlIHBhc3NlZCBleHByZXNzc2lvbnMgbWF5IG1hdGNoXG4gKlxuICogQ3JlYXRlcyBhIGh1Z2UgdGhpcyB8IHRoaXMgfCB0aGF0IHwgdGhhdCBtYXRjaFxuICogQHBhcmFtIHsoUmVnRXhwIHwgc3RyaW5nKVtdIHwgWy4uLihSZWdFeHAgfCBzdHJpbmcpW10sIFJlZ2V4RWl0aGVyT3B0aW9uc119IGFyZ3NcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVpdGhlciguLi5hcmdzKSB7XG4gIC8qKiBAdHlwZSB7IG9iamVjdCAmIHtjYXB0dXJlPzogYm9vbGVhbn0gfSAgKi9cbiAgY29uc3Qgb3B0cyA9IHN0cmlwT3B0aW9uc0Zyb21BcmdzKGFyZ3MpO1xuICBjb25zdCBqb2luZWQgPSAnKCdcbiAgICArIChvcHRzLmNhcHR1cmUgPyBcIlwiIDogXCI/OlwiKVxuICAgICsgYXJncy5tYXAoKHgpID0+IHNvdXJjZSh4KSkuam9pbihcInxcIikgKyBcIilcIjtcbiAgcmV0dXJuIGpvaW5lZDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlZ0V4cCB8IHN0cmluZ30gcmVcbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIGNvdW50TWF0Y2hHcm91cHMocmUpIHtcbiAgcmV0dXJuIChuZXcgUmVnRXhwKHJlLnRvU3RyaW5nKCkgKyAnfCcpKS5leGVjKCcnKS5sZW5ndGggLSAxO1xufVxuXG4vKipcbiAqIERvZXMgbGV4ZW1lIHN0YXJ0IHdpdGggYSByZWd1bGFyIGV4cHJlc3Npb24gbWF0Y2ggYXQgdGhlIGJlZ2lubmluZ1xuICogQHBhcmFtIHtSZWdFeHB9IHJlXG4gKiBAcGFyYW0ge3N0cmluZ30gbGV4ZW1lXG4gKi9cbmZ1bmN0aW9uIHN0YXJ0c1dpdGgocmUsIGxleGVtZSkge1xuICBjb25zdCBtYXRjaCA9IHJlICYmIHJlLmV4ZWMobGV4ZW1lKTtcbiAgcmV0dXJuIG1hdGNoICYmIG1hdGNoLmluZGV4ID09PSAwO1xufVxuXG4vLyBCQUNLUkVGX1JFIG1hdGNoZXMgYW4gb3BlbiBwYXJlbnRoZXNpcyBvciBiYWNrcmVmZXJlbmNlLiBUbyBhdm9pZFxuLy8gYW4gaW5jb3JyZWN0IHBhcnNlLCBpdCBhZGRpdGlvbmFsbHkgbWF0Y2hlcyB0aGUgZm9sbG93aW5nOlxuLy8gLSBbLi4uXSBlbGVtZW50cywgd2hlcmUgdGhlIG1lYW5pbmcgb2YgcGFyZW50aGVzZXMgYW5kIGVzY2FwZXMgY2hhbmdlXG4vLyAtIG90aGVyIGVzY2FwZSBzZXF1ZW5jZXMsIHNvIHdlIGRvIG5vdCBtaXNwYXJzZSBlc2NhcGUgc2VxdWVuY2VzIGFzXG4vLyAgIGludGVyZXN0aW5nIGVsZW1lbnRzXG4vLyAtIG5vbi1tYXRjaGluZyBvciBsb29rYWhlYWQgcGFyZW50aGVzZXMsIHdoaWNoIGRvIG5vdCBjYXB0dXJlLiBUaGVzZVxuLy8gICBmb2xsb3cgdGhlICcoJyB3aXRoIGEgJz8nLlxuY29uc3QgQkFDS1JFRl9SRSA9IC9cXFsoPzpbXlxcXFxcXF1dfFxcXFwuKSpcXF18XFwoXFw/P3xcXFxcKFsxLTldWzAtOV0qKXxcXFxcLi87XG5cbi8vICoqSU5URVJOQUwqKiBOb3QgaW50ZW5kZWQgZm9yIG91dHNpZGUgdXNhZ2Vcbi8vIGpvaW4gbG9naWNhbGx5IGNvbXB1dGVzIHJlZ2V4cHMuam9pbihzZXBhcmF0b3IpLCBidXQgZml4ZXMgdGhlXG4vLyBiYWNrcmVmZXJlbmNlcyBzbyB0aGV5IGNvbnRpbnVlIHRvIG1hdGNoLlxuLy8gaXQgYWxzbyBwbGFjZXMgZWFjaCBpbmRpdmlkdWFsIHJlZ3VsYXIgZXhwcmVzc2lvbiBpbnRvIGl0J3Mgb3duXG4vLyBtYXRjaCBncm91cCwga2VlcGluZyB0cmFjayBvZiB0aGUgc2VxdWVuY2luZyBvZiB0aG9zZSBtYXRjaCBncm91cHNcbi8vIGlzIGN1cnJlbnRseSBhbiBleGVyY2lzZSBmb3IgdGhlIGNhbGxlci4gOi0pXG4vKipcbiAqIEBwYXJhbSB7KHN0cmluZyB8IFJlZ0V4cClbXX0gcmVnZXhwc1xuICogQHBhcmFtIHt7am9pbldpdGg6IHN0cmluZ319IG9wdHNcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIF9yZXdyaXRlQmFja3JlZmVyZW5jZXMocmVnZXhwcywgeyBqb2luV2l0aCB9KSB7XG4gIGxldCBudW1DYXB0dXJlcyA9IDA7XG5cbiAgcmV0dXJuIHJlZ2V4cHMubWFwKChyZWdleCkgPT4ge1xuICAgIG51bUNhcHR1cmVzICs9IDE7XG4gICAgY29uc3Qgb2Zmc2V0ID0gbnVtQ2FwdHVyZXM7XG4gICAgbGV0IHJlID0gc291cmNlKHJlZ2V4KTtcbiAgICBsZXQgb3V0ID0gJyc7XG5cbiAgICB3aGlsZSAocmUubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgbWF0Y2ggPSBCQUNLUkVGX1JFLmV4ZWMocmUpO1xuICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICBvdXQgKz0gcmU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgb3V0ICs9IHJlLnN1YnN0cmluZygwLCBtYXRjaC5pbmRleCk7XG4gICAgICByZSA9IHJlLnN1YnN0cmluZyhtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aCk7XG4gICAgICBpZiAobWF0Y2hbMF1bMF0gPT09ICdcXFxcJyAmJiBtYXRjaFsxXSkge1xuICAgICAgICAvLyBBZGp1c3QgdGhlIGJhY2tyZWZlcmVuY2UuXG4gICAgICAgIG91dCArPSAnXFxcXCcgKyBTdHJpbmcoTnVtYmVyKG1hdGNoWzFdKSArIG9mZnNldCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvdXQgKz0gbWF0Y2hbMF07XG4gICAgICAgIGlmIChtYXRjaFswXSA9PT0gJygnKSB7XG4gICAgICAgICAgbnVtQ2FwdHVyZXMrKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9KS5tYXAocmUgPT4gYCgke3JlfSlgKS5qb2luKGpvaW5XaXRoKTtcbn1cblxuLyoqIEB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLk1vZGV9IE1vZGUgKi9cbi8qKiBAdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5Nb2RlQ2FsbGJhY2t9IE1vZGVDYWxsYmFjayAqL1xuXG4vLyBDb21tb24gcmVnZXhwc1xuY29uc3QgTUFUQ0hfTk9USElOR19SRSA9IC9cXGJcXEIvO1xuY29uc3QgSURFTlRfUkUgPSAnW2EtekEtWl1cXFxcdyonO1xuY29uc3QgVU5ERVJTQ09SRV9JREVOVF9SRSA9ICdbYS16QS1aX11cXFxcdyonO1xuY29uc3QgTlVNQkVSX1JFID0gJ1xcXFxiXFxcXGQrKFxcXFwuXFxcXGQrKT8nO1xuY29uc3QgQ19OVU1CRVJfUkUgPSAnKC0/KShcXFxcYjBbeFhdW2EtZkEtRjAtOV0rfChcXFxcYlxcXFxkKyhcXFxcLlxcXFxkKik/fFxcXFwuXFxcXGQrKShbZUVdWy0rXT9cXFxcZCspPyknOyAvLyAweC4uLiwgMC4uLiwgZGVjaW1hbCwgZmxvYXRcbmNvbnN0IEJJTkFSWV9OVU1CRVJfUkUgPSAnXFxcXGIoMGJbMDFdKyknOyAvLyAwYi4uLlxuY29uc3QgUkVfU1RBUlRFUlNfUkUgPSAnIXwhPXwhPT18JXwlPXwmfCYmfCY9fFxcXFwqfFxcXFwqPXxcXFxcK3xcXFxcKz18LHwtfC09fC89fC98Onw7fDw8fDw8PXw8PXw8fD09PXw9PXw9fD4+Pj18Pj49fD49fD4+Pnw+Pnw+fFxcXFw/fFxcXFxbfFxcXFx7fFxcXFwofFxcXFxefFxcXFxePXxcXFxcfHxcXFxcfD18XFxcXHxcXFxcfHx+JztcblxuLyoqXG4qIEBwYXJhbSB7IFBhcnRpYWw8TW9kZT4gJiB7YmluYXJ5Pzogc3RyaW5nIHwgUmVnRXhwfSB9IG9wdHNcbiovXG5jb25zdCBTSEVCQU5HID0gKG9wdHMgPSB7fSkgPT4ge1xuICBjb25zdCBiZWdpblNoZWJhbmcgPSAvXiMhWyBdKlxcLy87XG4gIGlmIChvcHRzLmJpbmFyeSkge1xuICAgIG9wdHMuYmVnaW4gPSBjb25jYXQoXG4gICAgICBiZWdpblNoZWJhbmcsXG4gICAgICAvLipcXGIvLFxuICAgICAgb3B0cy5iaW5hcnksXG4gICAgICAvXFxiLiovKTtcbiAgfVxuICByZXR1cm4gaW5oZXJpdCQxKHtcbiAgICBzY29wZTogJ21ldGEnLFxuICAgIGJlZ2luOiBiZWdpblNoZWJhbmcsXG4gICAgZW5kOiAvJC8sXG4gICAgcmVsZXZhbmNlOiAwLFxuICAgIC8qKiBAdHlwZSB7TW9kZUNhbGxiYWNrfSAqL1xuICAgIFwib246YmVnaW5cIjogKG0sIHJlc3ApID0+IHtcbiAgICAgIGlmIChtLmluZGV4ICE9PSAwKSByZXNwLmlnbm9yZU1hdGNoKCk7XG4gICAgfVxuICB9LCBvcHRzKTtcbn07XG5cbi8vIENvbW1vbiBtb2Rlc1xuY29uc3QgQkFDS1NMQVNIX0VTQ0FQRSA9IHtcbiAgYmVnaW46ICdcXFxcXFxcXFtcXFxcc1xcXFxTXScsIHJlbGV2YW5jZTogMFxufTtcbmNvbnN0IEFQT1NfU1RSSU5HX01PREUgPSB7XG4gIHNjb3BlOiAnc3RyaW5nJyxcbiAgYmVnaW46ICdcXCcnLFxuICBlbmQ6ICdcXCcnLFxuICBpbGxlZ2FsOiAnXFxcXG4nLFxuICBjb250YWluczogW0JBQ0tTTEFTSF9FU0NBUEVdXG59O1xuY29uc3QgUVVPVEVfU1RSSU5HX01PREUgPSB7XG4gIHNjb3BlOiAnc3RyaW5nJyxcbiAgYmVnaW46ICdcIicsXG4gIGVuZDogJ1wiJyxcbiAgaWxsZWdhbDogJ1xcXFxuJyxcbiAgY29udGFpbnM6IFtCQUNLU0xBU0hfRVNDQVBFXVxufTtcbmNvbnN0IFBIUkFTQUxfV09SRFNfTU9ERSA9IHtcbiAgYmVnaW46IC9cXGIoYXxhbnx0aGV8YXJlfEknbXxpc24ndHxkb24ndHxkb2Vzbid0fHdvbid0fGJ1dHxqdXN0fHNob3VsZHxwcmV0dHl8c2ltcGx5fGVub3VnaHxnb25uYXxnb2luZ3x3dGZ8c298c3VjaHx3aWxsfHlvdXx5b3VyfHRoZXl8bGlrZXxtb3JlKVxcYi9cbn07XG4vKipcbiAqIENyZWF0ZXMgYSBjb21tZW50IG1vZGVcbiAqXG4gKiBAcGFyYW0ge3N0cmluZyB8IFJlZ0V4cH0gYmVnaW5cbiAqIEBwYXJhbSB7c3RyaW5nIHwgUmVnRXhwfSBlbmRcbiAqIEBwYXJhbSB7TW9kZSB8IHt9fSBbbW9kZU9wdGlvbnNdXG4gKiBAcmV0dXJucyB7UGFydGlhbDxNb2RlPn1cbiAqL1xuY29uc3QgQ09NTUVOVCA9IGZ1bmN0aW9uKGJlZ2luLCBlbmQsIG1vZGVPcHRpb25zID0ge30pIHtcbiAgY29uc3QgbW9kZSA9IGluaGVyaXQkMShcbiAgICB7XG4gICAgICBzY29wZTogJ2NvbW1lbnQnLFxuICAgICAgYmVnaW4sXG4gICAgICBlbmQsXG4gICAgICBjb250YWluczogW11cbiAgICB9LFxuICAgIG1vZGVPcHRpb25zXG4gICk7XG4gIG1vZGUuY29udGFpbnMucHVzaCh7XG4gICAgc2NvcGU6ICdkb2N0YWcnLFxuICAgIC8vIGhhY2sgdG8gYXZvaWQgdGhlIHNwYWNlIGZyb20gYmVpbmcgaW5jbHVkZWQuIHRoZSBzcGFjZSBpcyBuZWNlc3NhcnkgdG9cbiAgICAvLyBtYXRjaCBoZXJlIHRvIHByZXZlbnQgdGhlIHBsYWluIHRleHQgcnVsZSBiZWxvdyBmcm9tIGdvYmJsaW5nIHVwIGRvY3RhZ3NcbiAgICBiZWdpbjogJ1sgXSooPz0oVE9ET3xGSVhNRXxOT1RFfEJVR3xPUFRJTUlaRXxIQUNLfFhYWCk6KScsXG4gICAgZW5kOiAvKFRPRE98RklYTUV8Tk9URXxCVUd8T1BUSU1JWkV8SEFDS3xYWFgpOi8sXG4gICAgZXhjbHVkZUJlZ2luOiB0cnVlLFxuICAgIHJlbGV2YW5jZTogMFxuICB9KTtcbiAgY29uc3QgRU5HTElTSF9XT1JEID0gZWl0aGVyKFxuICAgIC8vIGxpc3Qgb2YgY29tbW9uIDEgYW5kIDIgbGV0dGVyIHdvcmRzIGluIEVuZ2xpc2hcbiAgICBcIklcIixcbiAgICBcImFcIixcbiAgICBcImlzXCIsXG4gICAgXCJzb1wiLFxuICAgIFwidXNcIixcbiAgICBcInRvXCIsXG4gICAgXCJhdFwiLFxuICAgIFwiaWZcIixcbiAgICBcImluXCIsXG4gICAgXCJpdFwiLFxuICAgIFwib25cIixcbiAgICAvLyBub3RlOiB0aGlzIGlzIG5vdCBhbiBleGhhdXN0aXZlIGxpc3Qgb2YgY29udHJhY3Rpb25zLCBqdXN0IHBvcHVsYXIgb25lc1xuICAgIC9bQS1aYS16XStbJ10oZHx2ZXxyZXxsbHx0fHN8bikvLCAvLyBjb250cmFjdGlvbnMgLSBjYW4ndCB3ZSdkIHRoZXkncmUgbGV0J3MsIGV0Y1xuICAgIC9bQS1aYS16XStbLV1bYS16XSsvLCAvLyBgbm8td2F5YCwgZXRjLlxuICAgIC9bQS1aYS16XVthLXpdezIsfS8gLy8gYWxsb3cgY2FwaXRhbGl6ZWQgd29yZHMgYXQgYmVnaW5uaW5nIG9mIHNlbnRlbmNlc1xuICApO1xuICAvLyBsb29raW5nIGxpa2UgcGxhaW4gdGV4dCwgbW9yZSBsaWtlbHkgdG8gYmUgYSBjb21tZW50XG4gIG1vZGUuY29udGFpbnMucHVzaChcbiAgICB7XG4gICAgICAvLyBUT0RPOiBob3cgdG8gaW5jbHVkZSBcIiwgKCwgKSB3aXRob3V0IGJyZWFraW5nIGdyYW1tYXJzIHRoYXQgdXNlIHRoZXNlIGZvclxuICAgICAgLy8gY29tbWVudCBkZWxpbWl0ZXJzP1xuICAgICAgLy8gYmVnaW46IC9bIF0rKFsoKVwiXT8oW0EtWmEteictXXszLH18aXN8YXxJfHNvfHVzfFt0VF1bb09dfGF0fGlmfGlufGl0fG9uKVsuXT9bKClcIjpdPyhbLl1bIF18WyBdfFxcKSkpezN9L1xuICAgICAgLy8gLS0tXG5cbiAgICAgIC8vIHRoaXMgdHJpZXMgdG8gZmluZCBzZXF1ZW5jZXMgb2YgMyBlbmdsaXNoIHdvcmRzIGluIGEgcm93ICh3aXRob3V0IGFueVxuICAgICAgLy8gXCJwcm9ncmFtbWluZ1wiIHR5cGUgc3ludGF4KSB0aGlzIGdpdmVzIHVzIGEgc3Ryb25nIHNpZ25hbCB0aGF0IHdlJ3ZlXG4gICAgICAvLyBUUlVMWSBmb3VuZCBhIGNvbW1lbnQgLSB2cyBwZXJoYXBzIHNjYW5uaW5nIHdpdGggdGhlIHdyb25nIGxhbmd1YWdlLlxuICAgICAgLy8gSXQncyBwb3NzaWJsZSB0byBmaW5kIHNvbWV0aGluZyB0aGF0IExPT0tTIGxpa2UgdGhlIHN0YXJ0IG9mIHRoZVxuICAgICAgLy8gY29tbWVudCAtIGJ1dCB0aGVuIGlmIHRoZXJlIGlzIG5vIHJlYWRhYmxlIHRleHQgLSBnb29kIGNoYW5jZSBpdCBpcyBhXG4gICAgICAvLyBmYWxzZSBtYXRjaCBhbmQgbm90IGEgY29tbWVudC5cbiAgICAgIC8vXG4gICAgICAvLyBmb3IgYSB2aXN1YWwgZXhhbXBsZSBwbGVhc2Ugc2VlOlxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2hpZ2hsaWdodGpzL2hpZ2hsaWdodC5qcy9pc3N1ZXMvMjgyN1xuXG4gICAgICBiZWdpbjogY29uY2F0KFxuICAgICAgICAvWyBdKy8sIC8vIG5lY2Vzc2FyeSB0byBwcmV2ZW50IHVzIGdvYmJsaW5nIHVwIGRvY3RhZ3MgbGlrZSAvKiBAYXV0aG9yIEJvYiBNY2dpbGwgKi9cbiAgICAgICAgJygnLFxuICAgICAgICBFTkdMSVNIX1dPUkQsXG4gICAgICAgIC9bLl0/WzpdPyhbLl1bIF18WyBdKS8sXG4gICAgICAgICcpezN9JykgLy8gbG9vayBmb3IgMyB3b3JkcyBpbiBhIHJvd1xuICAgIH1cbiAgKTtcbiAgcmV0dXJuIG1vZGU7XG59O1xuY29uc3QgQ19MSU5FX0NPTU1FTlRfTU9ERSA9IENPTU1FTlQoJy8vJywgJyQnKTtcbmNvbnN0IENfQkxPQ0tfQ09NTUVOVF9NT0RFID0gQ09NTUVOVCgnL1xcXFwqJywgJ1xcXFwqLycpO1xuY29uc3QgSEFTSF9DT01NRU5UX01PREUgPSBDT01NRU5UKCcjJywgJyQnKTtcbmNvbnN0IE5VTUJFUl9NT0RFID0ge1xuICBzY29wZTogJ251bWJlcicsXG4gIGJlZ2luOiBOVU1CRVJfUkUsXG4gIHJlbGV2YW5jZTogMFxufTtcbmNvbnN0IENfTlVNQkVSX01PREUgPSB7XG4gIHNjb3BlOiAnbnVtYmVyJyxcbiAgYmVnaW46IENfTlVNQkVSX1JFLFxuICByZWxldmFuY2U6IDBcbn07XG5jb25zdCBCSU5BUllfTlVNQkVSX01PREUgPSB7XG4gIHNjb3BlOiAnbnVtYmVyJyxcbiAgYmVnaW46IEJJTkFSWV9OVU1CRVJfUkUsXG4gIHJlbGV2YW5jZTogMFxufTtcbmNvbnN0IFJFR0VYUF9NT0RFID0ge1xuICBzY29wZTogXCJyZWdleHBcIixcbiAgYmVnaW46IC9cXC8oPz1bXi9cXG5dKlxcLykvLFxuICBlbmQ6IC9cXC9bZ2ltdXldKi8sXG4gIGNvbnRhaW5zOiBbXG4gICAgQkFDS1NMQVNIX0VTQ0FQRSxcbiAgICB7XG4gICAgICBiZWdpbjogL1xcWy8sXG4gICAgICBlbmQ6IC9cXF0vLFxuICAgICAgcmVsZXZhbmNlOiAwLFxuICAgICAgY29udGFpbnM6IFtCQUNLU0xBU0hfRVNDQVBFXVxuICAgIH1cbiAgXVxufTtcbmNvbnN0IFRJVExFX01PREUgPSB7XG4gIHNjb3BlOiAndGl0bGUnLFxuICBiZWdpbjogSURFTlRfUkUsXG4gIHJlbGV2YW5jZTogMFxufTtcbmNvbnN0IFVOREVSU0NPUkVfVElUTEVfTU9ERSA9IHtcbiAgc2NvcGU6ICd0aXRsZScsXG4gIGJlZ2luOiBVTkRFUlNDT1JFX0lERU5UX1JFLFxuICByZWxldmFuY2U6IDBcbn07XG5jb25zdCBNRVRIT0RfR1VBUkQgPSB7XG4gIC8vIGV4Y2x1ZGVzIG1ldGhvZCBuYW1lcyBmcm9tIGtleXdvcmQgcHJvY2Vzc2luZ1xuICBiZWdpbjogJ1xcXFwuXFxcXHMqJyArIFVOREVSU0NPUkVfSURFTlRfUkUsXG4gIHJlbGV2YW5jZTogMFxufTtcblxuLyoqXG4gKiBBZGRzIGVuZCBzYW1lIGFzIGJlZ2luIG1lY2hhbmljcyB0byBhIG1vZGVcbiAqXG4gKiBZb3VyIG1vZGUgbXVzdCBpbmNsdWRlIGF0IGxlYXN0IGEgc2luZ2xlICgpIG1hdGNoIGdyb3VwIGFzIHRoYXQgZmlyc3QgbWF0Y2hcbiAqIGdyb3VwIGlzIHdoYXQgaXMgdXNlZCBmb3IgY29tcGFyaXNvblxuICogQHBhcmFtIHtQYXJ0aWFsPE1vZGU+fSBtb2RlXG4gKi9cbmNvbnN0IEVORF9TQU1FX0FTX0JFR0lOID0gZnVuY3Rpb24obW9kZSkge1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbihtb2RlLFxuICAgIHtcbiAgICAgIC8qKiBAdHlwZSB7TW9kZUNhbGxiYWNrfSAqL1xuICAgICAgJ29uOmJlZ2luJzogKG0sIHJlc3ApID0+IHsgcmVzcC5kYXRhLl9iZWdpbk1hdGNoID0gbVsxXTsgfSxcbiAgICAgIC8qKiBAdHlwZSB7TW9kZUNhbGxiYWNrfSAqL1xuICAgICAgJ29uOmVuZCc6IChtLCByZXNwKSA9PiB7IGlmIChyZXNwLmRhdGEuX2JlZ2luTWF0Y2ggIT09IG1bMV0pIHJlc3AuaWdub3JlTWF0Y2goKTsgfVxuICAgIH0pO1xufTtcblxudmFyIE1PREVTID0gLyojX19QVVJFX18qL09iamVjdC5mcmVlemUoe1xuICBfX3Byb3RvX186IG51bGwsXG4gIEFQT1NfU1RSSU5HX01PREU6IEFQT1NfU1RSSU5HX01PREUsXG4gIEJBQ0tTTEFTSF9FU0NBUEU6IEJBQ0tTTEFTSF9FU0NBUEUsXG4gIEJJTkFSWV9OVU1CRVJfTU9ERTogQklOQVJZX05VTUJFUl9NT0RFLFxuICBCSU5BUllfTlVNQkVSX1JFOiBCSU5BUllfTlVNQkVSX1JFLFxuICBDT01NRU5UOiBDT01NRU5ULFxuICBDX0JMT0NLX0NPTU1FTlRfTU9ERTogQ19CTE9DS19DT01NRU5UX01PREUsXG4gIENfTElORV9DT01NRU5UX01PREU6IENfTElORV9DT01NRU5UX01PREUsXG4gIENfTlVNQkVSX01PREU6IENfTlVNQkVSX01PREUsXG4gIENfTlVNQkVSX1JFOiBDX05VTUJFUl9SRSxcbiAgRU5EX1NBTUVfQVNfQkVHSU46IEVORF9TQU1FX0FTX0JFR0lOLFxuICBIQVNIX0NPTU1FTlRfTU9ERTogSEFTSF9DT01NRU5UX01PREUsXG4gIElERU5UX1JFOiBJREVOVF9SRSxcbiAgTUFUQ0hfTk9USElOR19SRTogTUFUQ0hfTk9USElOR19SRSxcbiAgTUVUSE9EX0dVQVJEOiBNRVRIT0RfR1VBUkQsXG4gIE5VTUJFUl9NT0RFOiBOVU1CRVJfTU9ERSxcbiAgTlVNQkVSX1JFOiBOVU1CRVJfUkUsXG4gIFBIUkFTQUxfV09SRFNfTU9ERTogUEhSQVNBTF9XT1JEU19NT0RFLFxuICBRVU9URV9TVFJJTkdfTU9ERTogUVVPVEVfU1RSSU5HX01PREUsXG4gIFJFR0VYUF9NT0RFOiBSRUdFWFBfTU9ERSxcbiAgUkVfU1RBUlRFUlNfUkU6IFJFX1NUQVJURVJTX1JFLFxuICBTSEVCQU5HOiBTSEVCQU5HLFxuICBUSVRMRV9NT0RFOiBUSVRMRV9NT0RFLFxuICBVTkRFUlNDT1JFX0lERU5UX1JFOiBVTkRFUlNDT1JFX0lERU5UX1JFLFxuICBVTkRFUlNDT1JFX1RJVExFX01PREU6IFVOREVSU0NPUkVfVElUTEVfTU9ERVxufSk7XG5cbi8qKlxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQ2FsbGJhY2tSZXNwb25zZX0gQ2FsbGJhY2tSZXNwb25zZVxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQ29tcGlsZXJFeHR9IENvbXBpbGVyRXh0XG4qL1xuXG4vLyBHcmFtbWFyIGV4dGVuc2lvbnMgLyBwbHVnaW5zXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9oaWdobGlnaHRqcy9oaWdobGlnaHQuanMvaXNzdWVzLzI4MzNcblxuLy8gR3JhbW1hciBleHRlbnNpb25zIGFsbG93IFwic3ludGFjdGljIHN1Z2FyXCIgdG8gYmUgYWRkZWQgdG8gdGhlIGdyYW1tYXIgbW9kZXNcbi8vIHdpdGhvdXQgcmVxdWlyaW5nIGFueSB1bmRlcmx5aW5nIGNoYW5nZXMgdG8gdGhlIGNvbXBpbGVyIGludGVybmFscy5cblxuLy8gYGNvbXBpbGVNYXRjaGAgYmVpbmcgdGhlIHBlcmZlY3Qgc21hbGwgZXhhbXBsZSBvZiBub3cgYWxsb3dpbmcgYSBncmFtbWFyXG4vLyBhdXRob3IgdG8gd3JpdGUgYG1hdGNoYCB3aGVuIHRoZXkgZGVzaXJlIHRvIG1hdGNoIGEgc2luZ2xlIGV4cHJlc3Npb24gcmF0aGVyXG4vLyB0aGFuIGJlaW5nIGZvcmNlZCB0byB1c2UgYGJlZ2luYC4gIFRoZSBleHRlbnNpb24gdGhlbiBqdXN0IG1vdmVzIGBtYXRjaGAgaW50b1xuLy8gYGJlZ2luYCB3aGVuIGl0IHJ1bnMuICBJZSwgbm8gZmVhdHVyZXMgaGF2ZSBiZWVuIGFkZGVkLCBidXQgd2UndmUganVzdCBtYWRlXG4vLyB0aGUgZXhwZXJpZW5jZSBvZiB3cml0aW5nIChhbmQgcmVhZGluZyBncmFtbWFycykgYSBsaXR0bGUgYml0IG5pY2VyLlxuXG4vLyAtLS0tLS1cblxuLy8gVE9ETzogV2UgbmVlZCBuZWdhdGl2ZSBsb29rLWJlaGluZCBzdXBwb3J0IHRvIGRvIHRoaXMgcHJvcGVybHlcbi8qKlxuICogU2tpcCBhIG1hdGNoIGlmIGl0IGhhcyBhIHByZWNlZGluZyBkb3RcbiAqXG4gKiBUaGlzIGlzIHVzZWQgZm9yIGBiZWdpbktleXdvcmRzYCB0byBwcmV2ZW50IG1hdGNoaW5nIGV4cHJlc3Npb25zIHN1Y2ggYXNcbiAqIGBib2Iua2V5d29yZC5kbygpYC4gVGhlIG1vZGUgY29tcGlsZXIgYXV0b21hdGljYWxseSB3aXJlcyB0aGlzIHVwIGFzIGFcbiAqIHNwZWNpYWwgX2ludGVybmFsXyAnb246YmVnaW4nIGNhbGxiYWNrIGZvciBtb2RlcyB3aXRoIGBiZWdpbktleXdvcmRzYFxuICogQHBhcmFtIHtSZWdFeHBNYXRjaEFycmF5fSBtYXRjaFxuICogQHBhcmFtIHtDYWxsYmFja1Jlc3BvbnNlfSByZXNwb25zZVxuICovXG5mdW5jdGlvbiBza2lwSWZIYXNQcmVjZWRpbmdEb3QobWF0Y2gsIHJlc3BvbnNlKSB7XG4gIGNvbnN0IGJlZm9yZSA9IG1hdGNoLmlucHV0W21hdGNoLmluZGV4IC0gMV07XG4gIGlmIChiZWZvcmUgPT09IFwiLlwiKSB7XG4gICAgcmVzcG9uc2UuaWdub3JlTWF0Y2goKTtcbiAgfVxufVxuXG4vKipcbiAqXG4gKiBAdHlwZSB7Q29tcGlsZXJFeHR9XG4gKi9cbmZ1bmN0aW9uIHNjb3BlQ2xhc3NOYW1lKG1vZGUsIF9wYXJlbnQpIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmaW5lZFxuICBpZiAobW9kZS5jbGFzc05hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgIG1vZGUuc2NvcGUgPSBtb2RlLmNsYXNzTmFtZTtcbiAgICBkZWxldGUgbW9kZS5jbGFzc05hbWU7XG4gIH1cbn1cblxuLyoqXG4gKiBgYmVnaW5LZXl3b3Jkc2Agc3ludGFjdGljIHN1Z2FyXG4gKiBAdHlwZSB7Q29tcGlsZXJFeHR9XG4gKi9cbmZ1bmN0aW9uIGJlZ2luS2V5d29yZHMobW9kZSwgcGFyZW50KSB7XG4gIGlmICghcGFyZW50KSByZXR1cm47XG4gIGlmICghbW9kZS5iZWdpbktleXdvcmRzKSByZXR1cm47XG5cbiAgLy8gZm9yIGxhbmd1YWdlcyB3aXRoIGtleXdvcmRzIHRoYXQgaW5jbHVkZSBub24td29yZCBjaGFyYWN0ZXJzIGNoZWNraW5nIGZvclxuICAvLyBhIHdvcmQgYm91bmRhcnkgaXMgbm90IHN1ZmZpY2llbnQsIHNvIGluc3RlYWQgd2UgY2hlY2sgZm9yIGEgd29yZCBib3VuZGFyeVxuICAvLyBvciB3aGl0ZXNwYWNlIC0gdGhpcyBkb2VzIG5vIGhhcm0gaW4gYW55IGNhc2Ugc2luY2Ugb3VyIGtleXdvcmQgZW5naW5lXG4gIC8vIGRvZXNuJ3QgYWxsb3cgc3BhY2VzIGluIGtleXdvcmRzIGFueXdheXMgYW5kIHdlIHN0aWxsIGNoZWNrIGZvciB0aGUgYm91bmRhcnlcbiAgLy8gZmlyc3RcbiAgbW9kZS5iZWdpbiA9ICdcXFxcYignICsgbW9kZS5iZWdpbktleXdvcmRzLnNwbGl0KCcgJykuam9pbignfCcpICsgJykoPyFcXFxcLikoPz1cXFxcYnxcXFxccyknO1xuICBtb2RlLl9fYmVmb3JlQmVnaW4gPSBza2lwSWZIYXNQcmVjZWRpbmdEb3Q7XG4gIG1vZGUua2V5d29yZHMgPSBtb2RlLmtleXdvcmRzIHx8IG1vZGUuYmVnaW5LZXl3b3JkcztcbiAgZGVsZXRlIG1vZGUuYmVnaW5LZXl3b3JkcztcblxuICAvLyBwcmV2ZW50cyBkb3VibGUgcmVsZXZhbmNlLCB0aGUga2V5d29yZHMgdGhlbXNlbHZlcyBwcm92aWRlXG4gIC8vIHJlbGV2YW5jZSwgdGhlIG1vZGUgZG9lc24ndCBuZWVkIHRvIGRvdWJsZSBpdFxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZpbmVkXG4gIGlmIChtb2RlLnJlbGV2YW5jZSA9PT0gdW5kZWZpbmVkKSBtb2RlLnJlbGV2YW5jZSA9IDA7XG59XG5cbi8qKlxuICogQWxsb3cgYGlsbGVnYWxgIHRvIGNvbnRhaW4gYW4gYXJyYXkgb2YgaWxsZWdhbCB2YWx1ZXNcbiAqIEB0eXBlIHtDb21waWxlckV4dH1cbiAqL1xuZnVuY3Rpb24gY29tcGlsZUlsbGVnYWwobW9kZSwgX3BhcmVudCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobW9kZS5pbGxlZ2FsKSkgcmV0dXJuO1xuXG4gIG1vZGUuaWxsZWdhbCA9IGVpdGhlciguLi5tb2RlLmlsbGVnYWwpO1xufVxuXG4vKipcbiAqIGBtYXRjaGAgdG8gbWF0Y2ggYSBzaW5nbGUgZXhwcmVzc2lvbiBmb3IgcmVhZGFiaWxpdHlcbiAqIEB0eXBlIHtDb21waWxlckV4dH1cbiAqL1xuZnVuY3Rpb24gY29tcGlsZU1hdGNoKG1vZGUsIF9wYXJlbnQpIHtcbiAgaWYgKCFtb2RlLm1hdGNoKSByZXR1cm47XG4gIGlmIChtb2RlLmJlZ2luIHx8IG1vZGUuZW5kKSB0aHJvdyBuZXcgRXJyb3IoXCJiZWdpbiAmIGVuZCBhcmUgbm90IHN1cHBvcnRlZCB3aXRoIG1hdGNoXCIpO1xuXG4gIG1vZGUuYmVnaW4gPSBtb2RlLm1hdGNoO1xuICBkZWxldGUgbW9kZS5tYXRjaDtcbn1cblxuLyoqXG4gKiBwcm92aWRlcyB0aGUgZGVmYXVsdCAxIHJlbGV2YW5jZSB0byBhbGwgbW9kZXNcbiAqIEB0eXBlIHtDb21waWxlckV4dH1cbiAqL1xuZnVuY3Rpb24gY29tcGlsZVJlbGV2YW5jZShtb2RlLCBfcGFyZW50KSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZmluZWRcbiAgaWYgKG1vZGUucmVsZXZhbmNlID09PSB1bmRlZmluZWQpIG1vZGUucmVsZXZhbmNlID0gMTtcbn1cblxuLy8gYWxsb3cgYmVmb3JlTWF0Y2ggdG8gYWN0IGFzIGEgXCJxdWFsaWZpZXJcIiBmb3IgdGhlIG1hdGNoXG4vLyB0aGUgZnVsbCBtYXRjaCBiZWdpbiBtdXN0IGJlIFtiZWZvcmVNYXRjaF1bYmVnaW5dXG5jb25zdCBiZWZvcmVNYXRjaEV4dCA9IChtb2RlLCBwYXJlbnQpID0+IHtcbiAgaWYgKCFtb2RlLmJlZm9yZU1hdGNoKSByZXR1cm47XG4gIC8vIHN0YXJ0cyBjb25mbGljdHMgd2l0aCBlbmRzUGFyZW50IHdoaWNoIHdlIG5lZWQgdG8gbWFrZSBzdXJlIHRoZSBjaGlsZFxuICAvLyBydWxlIGlzIG5vdCBtYXRjaGVkIG11bHRpcGxlIHRpbWVzXG4gIGlmIChtb2RlLnN0YXJ0cykgdGhyb3cgbmV3IEVycm9yKFwiYmVmb3JlTWF0Y2ggY2Fubm90IGJlIHVzZWQgd2l0aCBzdGFydHNcIik7XG5cbiAgY29uc3Qgb3JpZ2luYWxNb2RlID0gT2JqZWN0LmFzc2lnbih7fSwgbW9kZSk7XG4gIE9iamVjdC5rZXlzKG1vZGUpLmZvckVhY2goKGtleSkgPT4geyBkZWxldGUgbW9kZVtrZXldOyB9KTtcblxuICBtb2RlLmtleXdvcmRzID0gb3JpZ2luYWxNb2RlLmtleXdvcmRzO1xuICBtb2RlLmJlZ2luID0gY29uY2F0KG9yaWdpbmFsTW9kZS5iZWZvcmVNYXRjaCwgbG9va2FoZWFkKG9yaWdpbmFsTW9kZS5iZWdpbikpO1xuICBtb2RlLnN0YXJ0cyA9IHtcbiAgICByZWxldmFuY2U6IDAsXG4gICAgY29udGFpbnM6IFtcbiAgICAgIE9iamVjdC5hc3NpZ24ob3JpZ2luYWxNb2RlLCB7IGVuZHNQYXJlbnQ6IHRydWUgfSlcbiAgICBdXG4gIH07XG4gIG1vZGUucmVsZXZhbmNlID0gMDtcblxuICBkZWxldGUgb3JpZ2luYWxNb2RlLmJlZm9yZU1hdGNoO1xufTtcblxuLy8ga2V5d29yZHMgdGhhdCBzaG91bGQgaGF2ZSBubyBkZWZhdWx0IHJlbGV2YW5jZSB2YWx1ZVxuY29uc3QgQ09NTU9OX0tFWVdPUkRTID0gW1xuICAnb2YnLFxuICAnYW5kJyxcbiAgJ2ZvcicsXG4gICdpbicsXG4gICdub3QnLFxuICAnb3InLFxuICAnaWYnLFxuICAndGhlbicsXG4gICdwYXJlbnQnLCAvLyBjb21tb24gdmFyaWFibGUgbmFtZVxuICAnbGlzdCcsIC8vIGNvbW1vbiB2YXJpYWJsZSBuYW1lXG4gICd2YWx1ZScgLy8gY29tbW9uIHZhcmlhYmxlIG5hbWVcbl07XG5cbmNvbnN0IERFRkFVTFRfS0VZV09SRF9TQ09QRSA9IFwia2V5d29yZFwiO1xuXG4vKipcbiAqIEdpdmVuIHJhdyBrZXl3b3JkcyBmcm9tIGEgbGFuZ3VhZ2UgZGVmaW5pdGlvbiwgY29tcGlsZSB0aGVtLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nIHwgUmVjb3JkPHN0cmluZyxzdHJpbmd8c3RyaW5nW10+IHwgQXJyYXk8c3RyaW5nPn0gcmF3S2V5d29yZHNcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gY2FzZUluc2Vuc2l0aXZlXG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGVLZXl3b3JkcyhyYXdLZXl3b3JkcywgY2FzZUluc2Vuc2l0aXZlLCBzY29wZU5hbWUgPSBERUZBVUxUX0tFWVdPUkRfU0NPUEUpIHtcbiAgLyoqIEB0eXBlIHtpbXBvcnQoXCJoaWdobGlnaHQuanMvcHJpdmF0ZVwiKS5LZXl3b3JkRGljdH0gKi9cbiAgY29uc3QgY29tcGlsZWRLZXl3b3JkcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgLy8gaW5wdXQgY2FuIGJlIGEgc3RyaW5nIG9mIGtleXdvcmRzLCBhbiBhcnJheSBvZiBrZXl3b3Jkcywgb3IgYSBvYmplY3Qgd2l0aFxuICAvLyBuYW1lZCBrZXlzIHJlcHJlc2VudGluZyBzY29wZU5hbWUgKHdoaWNoIGNhbiB0aGVuIHBvaW50IHRvIGEgc3RyaW5nIG9yIGFycmF5KVxuICBpZiAodHlwZW9mIHJhd0tleXdvcmRzID09PSAnc3RyaW5nJykge1xuICAgIGNvbXBpbGVMaXN0KHNjb3BlTmFtZSwgcmF3S2V5d29yZHMuc3BsaXQoXCIgXCIpKTtcbiAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHJhd0tleXdvcmRzKSkge1xuICAgIGNvbXBpbGVMaXN0KHNjb3BlTmFtZSwgcmF3S2V5d29yZHMpO1xuICB9IGVsc2Uge1xuICAgIE9iamVjdC5rZXlzKHJhd0tleXdvcmRzKS5mb3JFYWNoKGZ1bmN0aW9uKHNjb3BlTmFtZSkge1xuICAgICAgLy8gY29sbGFwc2UgYWxsIG91ciBvYmplY3RzIGJhY2sgaW50byB0aGUgcGFyZW50IG9iamVjdFxuICAgICAgT2JqZWN0LmFzc2lnbihcbiAgICAgICAgY29tcGlsZWRLZXl3b3JkcyxcbiAgICAgICAgY29tcGlsZUtleXdvcmRzKHJhd0tleXdvcmRzW3Njb3BlTmFtZV0sIGNhc2VJbnNlbnNpdGl2ZSwgc2NvcGVOYW1lKVxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gY29tcGlsZWRLZXl3b3JkcztcblxuICAvLyAtLS1cblxuICAvKipcbiAgICogQ29tcGlsZXMgYW4gaW5kaXZpZHVhbCBsaXN0IG9mIGtleXdvcmRzXG4gICAqXG4gICAqIEV4OiBcImZvciBpZiB3aGVuIHdoaWxlfDVcIlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2NvcGVOYW1lXG4gICAqIEBwYXJhbSB7QXJyYXk8c3RyaW5nPn0ga2V5d29yZExpc3RcbiAgICovXG4gIGZ1bmN0aW9uIGNvbXBpbGVMaXN0KHNjb3BlTmFtZSwga2V5d29yZExpc3QpIHtcbiAgICBpZiAoY2FzZUluc2Vuc2l0aXZlKSB7XG4gICAgICBrZXl3b3JkTGlzdCA9IGtleXdvcmRMaXN0Lm1hcCh4ID0+IHgudG9Mb3dlckNhc2UoKSk7XG4gICAgfVxuICAgIGtleXdvcmRMaXN0LmZvckVhY2goZnVuY3Rpb24oa2V5d29yZCkge1xuICAgICAgY29uc3QgcGFpciA9IGtleXdvcmQuc3BsaXQoJ3wnKTtcbiAgICAgIGNvbXBpbGVkS2V5d29yZHNbcGFpclswXV0gPSBbc2NvcGVOYW1lLCBzY29yZUZvcktleXdvcmQocGFpclswXSwgcGFpclsxXSldO1xuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgcHJvcGVyIHNjb3JlIGZvciBhIGdpdmVuIGtleXdvcmRcbiAqXG4gKiBBbHNvIHRha2VzIGludG8gYWNjb3VudCBjb21tZW50IGtleXdvcmRzLCB3aGljaCB3aWxsIGJlIHNjb3JlZCAwIFVOTEVTU1xuICogYW5vdGhlciBzY29yZSBoYXMgYmVlbiBtYW51YWxseSBhc3NpZ25lZC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXl3b3JkXG4gKiBAcGFyYW0ge3N0cmluZ30gW3Byb3ZpZGVkU2NvcmVdXG4gKi9cbmZ1bmN0aW9uIHNjb3JlRm9yS2V5d29yZChrZXl3b3JkLCBwcm92aWRlZFNjb3JlKSB7XG4gIC8vIG1hbnVhbCBzY29yZXMgYWx3YXlzIHdpbiBvdmVyIGNvbW1vbiBrZXl3b3Jkc1xuICAvLyBzbyB5b3UgY2FuIGZvcmNlIGEgc2NvcmUgb2YgMSBpZiB5b3UgcmVhbGx5IGluc2lzdFxuICBpZiAocHJvdmlkZWRTY29yZSkge1xuICAgIHJldHVybiBOdW1iZXIocHJvdmlkZWRTY29yZSk7XG4gIH1cblxuICByZXR1cm4gY29tbW9uS2V5d29yZChrZXl3b3JkKSA/IDAgOiAxO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgYSBnaXZlbiBrZXl3b3JkIGlzIGNvbW1vbiBvciBub3RcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5d29yZCAqL1xuZnVuY3Rpb24gY29tbW9uS2V5d29yZChrZXl3b3JkKSB7XG4gIHJldHVybiBDT01NT05fS0VZV09SRFMuaW5jbHVkZXMoa2V5d29yZC50b0xvd2VyQ2FzZSgpKTtcbn1cblxuLypcblxuRm9yIHRoZSByZWFzb25pbmcgYmVoaW5kIHRoaXMgcGxlYXNlIHNlZTpcbmh0dHBzOi8vZ2l0aHViLmNvbS9oaWdobGlnaHRqcy9oaWdobGlnaHQuanMvaXNzdWVzLzI4ODAjaXNzdWVjb21tZW50LTc0NzI3NTQxOVxuXG4qL1xuXG4vKipcbiAqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCBib29sZWFuPn1cbiAqL1xuY29uc3Qgc2VlbkRlcHJlY2F0aW9ucyA9IHt9O1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gKi9cbmNvbnN0IGVycm9yID0gKG1lc3NhZ2UpID0+IHtcbiAgY29uc29sZS5lcnJvcihtZXNzYWdlKTtcbn07XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAqIEBwYXJhbSB7YW55fSBhcmdzXG4gKi9cbmNvbnN0IHdhcm4gPSAobWVzc2FnZSwgLi4uYXJncykgPT4ge1xuICBjb25zb2xlLmxvZyhgV0FSTjogJHttZXNzYWdlfWAsIC4uLmFyZ3MpO1xufTtcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmVyc2lvblxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAqL1xuY29uc3QgZGVwcmVjYXRlZCA9ICh2ZXJzaW9uLCBtZXNzYWdlKSA9PiB7XG4gIGlmIChzZWVuRGVwcmVjYXRpb25zW2Ake3ZlcnNpb259LyR7bWVzc2FnZX1gXSkgcmV0dXJuO1xuXG4gIGNvbnNvbGUubG9nKGBEZXByZWNhdGVkIGFzIG9mICR7dmVyc2lvbn0uICR7bWVzc2FnZX1gKTtcbiAgc2VlbkRlcHJlY2F0aW9uc1tgJHt2ZXJzaW9ufS8ke21lc3NhZ2V9YF0gPSB0cnVlO1xufTtcblxuLyogZXNsaW50LWRpc2FibGUgbm8tdGhyb3ctbGl0ZXJhbCAqL1xuXG4vKipcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLkNvbXBpbGVkTW9kZX0gQ29tcGlsZWRNb2RlXG4qL1xuXG5jb25zdCBNdWx0aUNsYXNzRXJyb3IgPSBuZXcgRXJyb3IoKTtcblxuLyoqXG4gKiBSZW51bWJlcnMgbGFiZWxlZCBzY29wZSBuYW1lcyB0byBhY2NvdW50IGZvciBhZGRpdGlvbmFsIGlubmVyIG1hdGNoXG4gKiBncm91cHMgdGhhdCBvdGhlcndpc2Ugd291bGQgYnJlYWsgZXZlcnl0aGluZy5cbiAqXG4gKiBMZXRzIHNheSB3ZSAzIG1hdGNoIHNjb3BlczpcbiAqXG4gKiAgIHsgMSA9PiAuLi4sIDIgPT4gLi4uLCAzID0+IC4uLiB9XG4gKlxuICogU28gd2hhdCB3ZSBuZWVkIGlzIGEgY2xlYW4gbWF0Y2ggbGlrZSB0aGlzOlxuICpcbiAqICAgKGEpKGIpKGMpID0+IFsgXCJhXCIsIFwiYlwiLCBcImNcIiBdXG4gKlxuICogQnV0IHRoaXMgZmFsbHMgYXBhcnQgd2l0aCBpbm5lciBtYXRjaCBncm91cHM6XG4gKlxuICogKGEpKCgoYikpKShjKSA9PiBbXCJhXCIsIFwiYlwiLCBcImJcIiwgXCJiXCIsIFwiY1wiIF1cbiAqXG4gKiBPdXIgc2NvcGVzIGFyZSBub3cgXCJvdXQgb2YgYWxpZ25tZW50XCIgYW5kIHdlJ3JlIHJlcGVhdGluZyBgYmAgMyB0aW1lcy5cbiAqIFdoYXQgbmVlZHMgdG8gaGFwcGVuIGlzIHRoZSBudW1iZXJzIGFyZSByZW1hcHBlZDpcbiAqXG4gKiAgIHsgMSA9PiAuLi4sIDIgPT4gLi4uLCA1ID0+IC4uLiB9XG4gKlxuICogV2UgYWxzbyBuZWVkIHRvIGtub3cgdGhhdCB0aGUgT05MWSBncm91cHMgdGhhdCBzaG91bGQgYmUgb3V0cHV0XG4gKiBhcmUgMSwgMiwgYW5kIDUuICBUaGlzIGZ1bmN0aW9uIGhhbmRsZXMgdGhpcyBiZWhhdmlvci5cbiAqXG4gKiBAcGFyYW0ge0NvbXBpbGVkTW9kZX0gbW9kZVxuICogQHBhcmFtIHtBcnJheTxSZWdFeHAgfCBzdHJpbmc+fSByZWdleGVzXG4gKiBAcGFyYW0ge3trZXk6IFwiYmVnaW5TY29wZVwifFwiZW5kU2NvcGVcIn19IG9wdHNcbiAqL1xuZnVuY3Rpb24gcmVtYXBTY29wZU5hbWVzKG1vZGUsIHJlZ2V4ZXMsIHsga2V5IH0pIHtcbiAgbGV0IG9mZnNldCA9IDA7XG4gIGNvbnN0IHNjb3BlTmFtZXMgPSBtb2RlW2tleV07XG4gIC8qKiBAdHlwZSBSZWNvcmQ8bnVtYmVyLGJvb2xlYW4+ICovXG4gIGNvbnN0IGVtaXQgPSB7fTtcbiAgLyoqIEB0eXBlIFJlY29yZDxudW1iZXIsc3RyaW5nPiAqL1xuICBjb25zdCBwb3NpdGlvbnMgPSB7fTtcblxuICBmb3IgKGxldCBpID0gMTsgaSA8PSByZWdleGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgcG9zaXRpb25zW2kgKyBvZmZzZXRdID0gc2NvcGVOYW1lc1tpXTtcbiAgICBlbWl0W2kgKyBvZmZzZXRdID0gdHJ1ZTtcbiAgICBvZmZzZXQgKz0gY291bnRNYXRjaEdyb3VwcyhyZWdleGVzW2kgLSAxXSk7XG4gIH1cbiAgLy8gd2UgdXNlIF9lbWl0IHRvIGtlZXAgdHJhY2sgb2Ygd2hpY2ggbWF0Y2ggZ3JvdXBzIGFyZSBcInRvcC1sZXZlbFwiIHRvIGF2b2lkIGRvdWJsZVxuICAvLyBvdXRwdXQgZnJvbSBpbnNpZGUgbWF0Y2ggZ3JvdXBzXG4gIG1vZGVba2V5XSA9IHBvc2l0aW9ucztcbiAgbW9kZVtrZXldLl9lbWl0ID0gZW1pdDtcbiAgbW9kZVtrZXldLl9tdWx0aSA9IHRydWU7XG59XG5cbi8qKlxuICogQHBhcmFtIHtDb21waWxlZE1vZGV9IG1vZGVcbiAqL1xuZnVuY3Rpb24gYmVnaW5NdWx0aUNsYXNzKG1vZGUpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KG1vZGUuYmVnaW4pKSByZXR1cm47XG5cbiAgaWYgKG1vZGUuc2tpcCB8fCBtb2RlLmV4Y2x1ZGVCZWdpbiB8fCBtb2RlLnJldHVybkJlZ2luKSB7XG4gICAgZXJyb3IoXCJza2lwLCBleGNsdWRlQmVnaW4sIHJldHVybkJlZ2luIG5vdCBjb21wYXRpYmxlIHdpdGggYmVnaW5TY29wZToge31cIik7XG4gICAgdGhyb3cgTXVsdGlDbGFzc0Vycm9yO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBtb2RlLmJlZ2luU2NvcGUgIT09IFwib2JqZWN0XCIgfHwgbW9kZS5iZWdpblNjb3BlID09PSBudWxsKSB7XG4gICAgZXJyb3IoXCJiZWdpblNjb3BlIG11c3QgYmUgb2JqZWN0XCIpO1xuICAgIHRocm93IE11bHRpQ2xhc3NFcnJvcjtcbiAgfVxuXG4gIHJlbWFwU2NvcGVOYW1lcyhtb2RlLCBtb2RlLmJlZ2luLCB7IGtleTogXCJiZWdpblNjb3BlXCIgfSk7XG4gIG1vZGUuYmVnaW4gPSBfcmV3cml0ZUJhY2tyZWZlcmVuY2VzKG1vZGUuYmVnaW4sIHsgam9pbldpdGg6IFwiXCIgfSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtDb21waWxlZE1vZGV9IG1vZGVcbiAqL1xuZnVuY3Rpb24gZW5kTXVsdGlDbGFzcyhtb2RlKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShtb2RlLmVuZCkpIHJldHVybjtcblxuICBpZiAobW9kZS5za2lwIHx8IG1vZGUuZXhjbHVkZUVuZCB8fCBtb2RlLnJldHVybkVuZCkge1xuICAgIGVycm9yKFwic2tpcCwgZXhjbHVkZUVuZCwgcmV0dXJuRW5kIG5vdCBjb21wYXRpYmxlIHdpdGggZW5kU2NvcGU6IHt9XCIpO1xuICAgIHRocm93IE11bHRpQ2xhc3NFcnJvcjtcbiAgfVxuXG4gIGlmICh0eXBlb2YgbW9kZS5lbmRTY29wZSAhPT0gXCJvYmplY3RcIiB8fCBtb2RlLmVuZFNjb3BlID09PSBudWxsKSB7XG4gICAgZXJyb3IoXCJlbmRTY29wZSBtdXN0IGJlIG9iamVjdFwiKTtcbiAgICB0aHJvdyBNdWx0aUNsYXNzRXJyb3I7XG4gIH1cblxuICByZW1hcFNjb3BlTmFtZXMobW9kZSwgbW9kZS5lbmQsIHsga2V5OiBcImVuZFNjb3BlXCIgfSk7XG4gIG1vZGUuZW5kID0gX3Jld3JpdGVCYWNrcmVmZXJlbmNlcyhtb2RlLmVuZCwgeyBqb2luV2l0aDogXCJcIiB9KTtcbn1cblxuLyoqXG4gKiB0aGlzIGV4aXN0cyBvbmx5IHRvIGFsbG93IGBzY29wZToge31gIHRvIGJlIHVzZWQgYmVzaWRlIGBtYXRjaDpgXG4gKiBPdGhlcndpc2UgYGJlZ2luU2NvcGVgIHdvdWxkIG5lY2Vzc2FyeSBhbmQgdGhhdCB3b3VsZCBsb29rIHdlaXJkXG5cbiAge1xuICAgIG1hdGNoOiBbIC9kZWYvLCAvXFx3Ky8gXVxuICAgIHNjb3BlOiB7IDE6IFwia2V5d29yZFwiICwgMjogXCJ0aXRsZVwiIH1cbiAgfVxuXG4gKiBAcGFyYW0ge0NvbXBpbGVkTW9kZX0gbW9kZVxuICovXG5mdW5jdGlvbiBzY29wZVN1Z2FyKG1vZGUpIHtcbiAgaWYgKG1vZGUuc2NvcGUgJiYgdHlwZW9mIG1vZGUuc2NvcGUgPT09IFwib2JqZWN0XCIgJiYgbW9kZS5zY29wZSAhPT0gbnVsbCkge1xuICAgIG1vZGUuYmVnaW5TY29wZSA9IG1vZGUuc2NvcGU7XG4gICAgZGVsZXRlIG1vZGUuc2NvcGU7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0NvbXBpbGVkTW9kZX0gbW9kZVxuICovXG5mdW5jdGlvbiBNdWx0aUNsYXNzKG1vZGUpIHtcbiAgc2NvcGVTdWdhcihtb2RlKTtcblxuICBpZiAodHlwZW9mIG1vZGUuYmVnaW5TY29wZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIG1vZGUuYmVnaW5TY29wZSA9IHsgX3dyYXA6IG1vZGUuYmVnaW5TY29wZSB9O1xuICB9XG4gIGlmICh0eXBlb2YgbW9kZS5lbmRTY29wZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIG1vZGUuZW5kU2NvcGUgPSB7IF93cmFwOiBtb2RlLmVuZFNjb3BlIH07XG4gIH1cblxuICBiZWdpbk11bHRpQ2xhc3MobW9kZSk7XG4gIGVuZE11bHRpQ2xhc3MobW9kZSk7XG59XG5cbi8qKlxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuTW9kZX0gTW9kZVxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQ29tcGlsZWRNb2RlfSBDb21waWxlZE1vZGVcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLkxhbmd1YWdlfSBMYW5ndWFnZVxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuSExKU1BsdWdpbn0gSExKU1BsdWdpblxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQ29tcGlsZWRMYW5ndWFnZX0gQ29tcGlsZWRMYW5ndWFnZVxuKi9cblxuLy8gY29tcGlsYXRpb25cblxuLyoqXG4gKiBDb21waWxlcyBhIGxhbmd1YWdlIGRlZmluaXRpb24gcmVzdWx0XG4gKlxuICogR2l2ZW4gdGhlIHJhdyByZXN1bHQgb2YgYSBsYW5ndWFnZSBkZWZpbml0aW9uIChMYW5ndWFnZSksIGNvbXBpbGVzIHRoaXMgc29cbiAqIHRoYXQgaXQgaXMgcmVhZHkgZm9yIGhpZ2hsaWdodGluZyBjb2RlLlxuICogQHBhcmFtIHtMYW5ndWFnZX0gbGFuZ3VhZ2VcbiAqIEByZXR1cm5zIHtDb21waWxlZExhbmd1YWdlfVxuICovXG5mdW5jdGlvbiBjb21waWxlTGFuZ3VhZ2UobGFuZ3VhZ2UpIHtcbiAgLyoqXG4gICAqIEJ1aWxkcyBhIHJlZ2V4IHdpdGggdGhlIGNhc2Ugc2Vuc2l0aXZpdHkgb2YgdGhlIGN1cnJlbnQgbGFuZ3VhZ2VcbiAgICpcbiAgICogQHBhcmFtIHtSZWdFeHAgfCBzdHJpbmd9IHZhbHVlXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2dsb2JhbF1cbiAgICovXG4gIGZ1bmN0aW9uIGxhbmdSZSh2YWx1ZSwgZ2xvYmFsKSB7XG4gICAgcmV0dXJuIG5ldyBSZWdFeHAoXG4gICAgICBzb3VyY2UodmFsdWUpLFxuICAgICAgJ20nXG4gICAgICArIChsYW5ndWFnZS5jYXNlX2luc2Vuc2l0aXZlID8gJ2knIDogJycpXG4gICAgICArIChsYW5ndWFnZS51bmljb2RlUmVnZXggPyAndScgOiAnJylcbiAgICAgICsgKGdsb2JhbCA/ICdnJyA6ICcnKVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICBTdG9yZXMgbXVsdGlwbGUgcmVndWxhciBleHByZXNzaW9ucyBhbmQgYWxsb3dzIHlvdSB0byBxdWlja2x5IHNlYXJjaCBmb3JcbiAgICB0aGVtIGFsbCBpbiBhIHN0cmluZyBzaW11bHRhbmVvdXNseSAtIHJldHVybmluZyB0aGUgZmlyc3QgbWF0Y2guICBJdCBkb2VzXG4gICAgdGhpcyBieSBjcmVhdGluZyBhIGh1Z2UgKGF8YnxjKSByZWdleCAtIGVhY2ggaW5kaXZpZHVhbCBpdGVtIHdyYXBwZWQgd2l0aCAoKVxuICAgIGFuZCBqb2luZWQgYnkgYHxgIC0gdXNpbmcgbWF0Y2ggZ3JvdXBzIHRvIHRyYWNrIHBvc2l0aW9uLiAgV2hlbiBhIG1hdGNoIGlzXG4gICAgZm91bmQgY2hlY2tpbmcgd2hpY2ggcG9zaXRpb24gaW4gdGhlIGFycmF5IGhhcyBjb250ZW50IGFsbG93cyB1cyB0byBmaWd1cmVcbiAgICBvdXQgd2hpY2ggb2YgdGhlIG9yaWdpbmFsIHJlZ2V4ZXMgLyBtYXRjaCBncm91cHMgdHJpZ2dlcmVkIHRoZSBtYXRjaC5cblxuICAgIFRoZSBtYXRjaCBvYmplY3QgaXRzZWxmICh0aGUgcmVzdWx0IG9mIGBSZWdleC5leGVjYCkgaXMgcmV0dXJuZWQgYnV0IGFsc29cbiAgICBlbmhhbmNlZCBieSBtZXJnaW5nIGluIGFueSBtZXRhLWRhdGEgdGhhdCB3YXMgcmVnaXN0ZXJlZCB3aXRoIHRoZSByZWdleC5cbiAgICBUaGlzIGlzIGhvdyB3ZSBrZWVwIHRyYWNrIG9mIHdoaWNoIG1vZGUgbWF0Y2hlZCwgYW5kIHdoYXQgdHlwZSBvZiBydWxlXG4gICAgKGBpbGxlZ2FsYCwgYGJlZ2luYCwgZW5kLCBldGMpLlxuICAqL1xuICBjbGFzcyBNdWx0aVJlZ2V4IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgIHRoaXMubWF0Y2hJbmRleGVzID0ge307XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICB0aGlzLnJlZ2V4ZXMgPSBbXTtcbiAgICAgIHRoaXMubWF0Y2hBdCA9IDE7XG4gICAgICB0aGlzLnBvc2l0aW9uID0gMDtcbiAgICB9XG5cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgYWRkUnVsZShyZSwgb3B0cykge1xuICAgICAgb3B0cy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24rKztcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIHRoaXMubWF0Y2hJbmRleGVzW3RoaXMubWF0Y2hBdF0gPSBvcHRzO1xuICAgICAgdGhpcy5yZWdleGVzLnB1c2goW29wdHMsIHJlXSk7XG4gICAgICB0aGlzLm1hdGNoQXQgKz0gY291bnRNYXRjaEdyb3VwcyhyZSkgKyAxO1xuICAgIH1cblxuICAgIGNvbXBpbGUoKSB7XG4gICAgICBpZiAodGhpcy5yZWdleGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAvLyBhdm9pZHMgdGhlIG5lZWQgdG8gY2hlY2sgbGVuZ3RoIGV2ZXJ5IHRpbWUgZXhlYyBpcyBjYWxsZWRcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICB0aGlzLmV4ZWMgPSAoKSA9PiBudWxsO1xuICAgICAgfVxuICAgICAgY29uc3QgdGVybWluYXRvcnMgPSB0aGlzLnJlZ2V4ZXMubWFwKGVsID0+IGVsWzFdKTtcbiAgICAgIHRoaXMubWF0Y2hlclJlID0gbGFuZ1JlKF9yZXdyaXRlQmFja3JlZmVyZW5jZXModGVybWluYXRvcnMsIHsgam9pbldpdGg6ICd8JyB9KSwgdHJ1ZSk7XG4gICAgICB0aGlzLmxhc3RJbmRleCA9IDA7XG4gICAgfVxuXG4gICAgLyoqIEBwYXJhbSB7c3RyaW5nfSBzICovXG4gICAgZXhlYyhzKSB7XG4gICAgICB0aGlzLm1hdGNoZXJSZS5sYXN0SW5kZXggPSB0aGlzLmxhc3RJbmRleDtcbiAgICAgIGNvbnN0IG1hdGNoID0gdGhpcy5tYXRjaGVyUmUuZXhlYyhzKTtcbiAgICAgIGlmICghbWF0Y2gpIHsgcmV0dXJuIG51bGw7IH1cblxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmaW5lZFxuICAgICAgY29uc3QgaSA9IG1hdGNoLmZpbmRJbmRleCgoZWwsIGkpID0+IGkgPiAwICYmIGVsICE9PSB1bmRlZmluZWQpO1xuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgY29uc3QgbWF0Y2hEYXRhID0gdGhpcy5tYXRjaEluZGV4ZXNbaV07XG4gICAgICAvLyB0cmltIG9mZiBhbnkgZWFybGllciBub24tcmVsZXZhbnQgbWF0Y2ggZ3JvdXBzIChpZSwgdGhlIG90aGVyIHJlZ2V4XG4gICAgICAvLyBtYXRjaCBncm91cHMgdGhhdCBtYWtlIHVwIHRoZSBtdWx0aS1tYXRjaGVyKVxuICAgICAgbWF0Y2guc3BsaWNlKDAsIGkpO1xuXG4gICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihtYXRjaCwgbWF0Y2hEYXRhKTtcbiAgICB9XG4gIH1cblxuICAvKlxuICAgIENyZWF0ZWQgdG8gc29sdmUgdGhlIGtleSBkZWZpY2llbnRseSB3aXRoIE11bHRpUmVnZXggLSB0aGVyZSBpcyBubyB3YXkgdG9cbiAgICB0ZXN0IGZvciBtdWx0aXBsZSBtYXRjaGVzIGF0IGEgc2luZ2xlIGxvY2F0aW9uLiAgV2h5IHdvdWxkIHdlIG5lZWQgdG8gZG9cbiAgICB0aGF0PyAgSW4gdGhlIGZ1dHVyZSBhIG1vcmUgZHluYW1pYyBlbmdpbmUgd2lsbCBhbGxvdyBjZXJ0YWluIG1hdGNoZXMgdG8gYmVcbiAgICBpZ25vcmVkLiAgQW4gZXhhbXBsZTogaWYgd2UgbWF0Y2hlZCBzYXkgdGhlIDNyZCByZWdleCBpbiBhIGxhcmdlIGdyb3VwIGJ1dFxuICAgIGRlY2lkZWQgdG8gaWdub3JlIGl0IC0gd2UnZCBuZWVkIHRvIHN0YXJ0ZWQgdGVzdGluZyBhZ2FpbiBhdCB0aGUgNHRoXG4gICAgcmVnZXguLi4gYnV0IE11bHRpUmVnZXggaXRzZWxmIGdpdmVzIHVzIG5vIHJlYWwgd2F5IHRvIGRvIHRoYXQuXG5cbiAgICBTbyB3aGF0IHRoaXMgY2xhc3MgY3JlYXRlcyBNdWx0aVJlZ2V4cyBvbiB0aGUgZmx5IGZvciB3aGF0ZXZlciBzZWFyY2hcbiAgICBwb3NpdGlvbiB0aGV5IGFyZSBuZWVkZWQuXG5cbiAgICBOT1RFOiBUaGVzZSBhZGRpdGlvbmFsIE11bHRpUmVnZXggb2JqZWN0cyBhcmUgY3JlYXRlZCBkeW5hbWljYWxseS4gIEZvciBtb3N0XG4gICAgZ3JhbW1hcnMgbW9zdCBvZiB0aGUgdGltZSB3ZSB3aWxsIG5ldmVyIGFjdHVhbGx5IG5lZWQgYW55dGhpbmcgbW9yZSB0aGFuIHRoZVxuICAgIGZpcnN0IE11bHRpUmVnZXggLSBzbyB0aGlzIHNob3VsZG4ndCBoYXZlIHRvbyBtdWNoIG92ZXJoZWFkLlxuXG4gICAgU2F5IHRoaXMgaXMgb3VyIHNlYXJjaCBncm91cCwgYW5kIHdlIG1hdGNoIHJlZ2V4MywgYnV0IHdpc2ggdG8gaWdub3JlIGl0LlxuXG4gICAgICByZWdleDEgfCByZWdleDIgfCByZWdleDMgfCByZWdleDQgfCByZWdleDUgICAgJyBpZSwgc3RhcnRBdCA9IDBcblxuICAgIFdoYXQgd2UgbmVlZCBpcyBhIG5ldyBNdWx0aVJlZ2V4IHRoYXQgb25seSBpbmNsdWRlcyB0aGUgcmVtYWluaW5nXG4gICAgcG9zc2liaWxpdGllczpcblxuICAgICAgcmVnZXg0IHwgcmVnZXg1ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgaWUsIHN0YXJ0QXQgPSAzXG5cbiAgICBUaGlzIGNsYXNzIHdyYXBzIGFsbCB0aGF0IGNvbXBsZXhpdHkgdXAgaW4gYSBzaW1wbGUgQVBJLi4uIGBzdGFydEF0YCBkZWNpZGVzXG4gICAgd2hlcmUgaW4gdGhlIGFycmF5IG9mIGV4cHJlc3Npb25zIHRvIHN0YXJ0IGRvaW5nIHRoZSBtYXRjaGluZy4gSXRcbiAgICBhdXRvLWluY3JlbWVudHMsIHNvIGlmIGEgbWF0Y2ggaXMgZm91bmQgYXQgcG9zaXRpb24gMiwgdGhlbiBzdGFydEF0IHdpbGwgYmVcbiAgICBzZXQgdG8gMy4gIElmIHRoZSBlbmQgaXMgcmVhY2hlZCBzdGFydEF0IHdpbGwgcmV0dXJuIHRvIDAuXG5cbiAgICBNT1NUIG9mIHRoZSB0aW1lIHRoZSBwYXJzZXIgd2lsbCBiZSBzZXR0aW5nIHN0YXJ0QXQgbWFudWFsbHkgdG8gMC5cbiAgKi9cbiAgY2xhc3MgUmVzdW1hYmxlTXVsdGlSZWdleCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICB0aGlzLnJ1bGVzID0gW107XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICB0aGlzLm11bHRpUmVnZXhlcyA9IFtdO1xuICAgICAgdGhpcy5jb3VudCA9IDA7XG5cbiAgICAgIHRoaXMubGFzdEluZGV4ID0gMDtcbiAgICAgIHRoaXMucmVnZXhJbmRleCA9IDA7XG4gICAgfVxuXG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGdldE1hdGNoZXIoaW5kZXgpIHtcbiAgICAgIGlmICh0aGlzLm11bHRpUmVnZXhlc1tpbmRleF0pIHJldHVybiB0aGlzLm11bHRpUmVnZXhlc1tpbmRleF07XG5cbiAgICAgIGNvbnN0IG1hdGNoZXIgPSBuZXcgTXVsdGlSZWdleCgpO1xuICAgICAgdGhpcy5ydWxlcy5zbGljZShpbmRleCkuZm9yRWFjaCgoW3JlLCBvcHRzXSkgPT4gbWF0Y2hlci5hZGRSdWxlKHJlLCBvcHRzKSk7XG4gICAgICBtYXRjaGVyLmNvbXBpbGUoKTtcbiAgICAgIHRoaXMubXVsdGlSZWdleGVzW2luZGV4XSA9IG1hdGNoZXI7XG4gICAgICByZXR1cm4gbWF0Y2hlcjtcbiAgICB9XG5cbiAgICByZXN1bWluZ1NjYW5BdFNhbWVQb3NpdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlZ2V4SW5kZXggIT09IDA7XG4gICAgfVxuXG4gICAgY29uc2lkZXJBbGwoKSB7XG4gICAgICB0aGlzLnJlZ2V4SW5kZXggPSAwO1xuICAgIH1cblxuICAgIC8vIEB0cy1pZ25vcmVcbiAgICBhZGRSdWxlKHJlLCBvcHRzKSB7XG4gICAgICB0aGlzLnJ1bGVzLnB1c2goW3JlLCBvcHRzXSk7XG4gICAgICBpZiAob3B0cy50eXBlID09PSBcImJlZ2luXCIpIHRoaXMuY291bnQrKztcbiAgICB9XG5cbiAgICAvKiogQHBhcmFtIHtzdHJpbmd9IHMgKi9cbiAgICBleGVjKHMpIHtcbiAgICAgIGNvbnN0IG0gPSB0aGlzLmdldE1hdGNoZXIodGhpcy5yZWdleEluZGV4KTtcbiAgICAgIG0ubGFzdEluZGV4ID0gdGhpcy5sYXN0SW5kZXg7XG4gICAgICBsZXQgcmVzdWx0ID0gbS5leGVjKHMpO1xuXG4gICAgICAvLyBUaGUgZm9sbG93aW5nIGlzIGJlY2F1c2Ugd2UgaGF2ZSBubyBlYXN5IHdheSB0byBzYXkgXCJyZXN1bWUgc2Nhbm5pbmcgYXQgdGhlXG4gICAgICAvLyBleGlzdGluZyBwb3NpdGlvbiBidXQgYWxzbyBza2lwIHRoZSBjdXJyZW50IHJ1bGUgT05MWVwiLiBXaGF0IGhhcHBlbnMgaXNcbiAgICAgIC8vIGFsbCBwcmlvciBydWxlcyBhcmUgYWxzbyBza2lwcGVkIHdoaWNoIGNhbiByZXN1bHQgaW4gbWF0Y2hpbmcgdGhlIHdyb25nXG4gICAgICAvLyB0aGluZy4gRXhhbXBsZSBvZiBtYXRjaGluZyBcImJvb2dlclwiOlxuXG4gICAgICAvLyBvdXIgbWF0Y2hlciBpcyBbc3RyaW5nLCBcImJvb2dlclwiLCBudW1iZXJdXG4gICAgICAvL1xuICAgICAgLy8gLi4uLmJvb2dlci4uLi5cblxuICAgICAgLy8gaWYgXCJib29nZXJcIiBpcyBpZ25vcmVkIHRoZW4gd2UnZCByZWFsbHkgbmVlZCBhIHJlZ2V4IHRvIHNjYW4gZnJvbSB0aGVcbiAgICAgIC8vIFNBTUUgcG9zaXRpb24gZm9yIG9ubHk6IFtzdHJpbmcsIG51bWJlcl0gYnV0IGlnbm9yaW5nIFwiYm9vZ2VyXCIgKGlmIGl0XG4gICAgICAvLyB3YXMgdGhlIGZpcnN0IG1hdGNoKSwgYSBzaW1wbGUgcmVzdW1lIHdvdWxkIHNjYW4gYWhlYWQgd2hvIGtub3dzIGhvd1xuICAgICAgLy8gZmFyIGxvb2tpbmcgb25seSBmb3IgXCJudW1iZXJcIiwgaWdub3JpbmcgcG90ZW50aWFsIHN0cmluZyBtYXRjaGVzIChvclxuICAgICAgLy8gZnV0dXJlIFwiYm9vZ2VyXCIgbWF0Y2hlcyB0aGF0IG1pZ2h0IGJlIHZhbGlkLilcblxuICAgICAgLy8gU28gd2hhdCB3ZSBkbzogV2UgZXhlY3V0ZSB0d28gbWF0Y2hlcnMsIG9uZSByZXN1bWluZyBhdCB0aGUgc2FtZVxuICAgICAgLy8gcG9zaXRpb24sIGJ1dCB0aGUgc2Vjb25kIGZ1bGwgbWF0Y2hlciBzdGFydGluZyBhdCB0aGUgcG9zaXRpb24gYWZ0ZXI6XG5cbiAgICAgIC8vICAgICAvLS0tIHJlc3VtZSBmaXJzdCByZWdleCBtYXRjaCBoZXJlIChmb3IgW251bWJlcl0pXG4gICAgICAvLyAgICAgfC8tLS0tIGZ1bGwgbWF0Y2ggaGVyZSBmb3IgW3N0cmluZywgXCJib29nZXJcIiwgbnVtYmVyXVxuICAgICAgLy8gICAgIHZ2XG4gICAgICAvLyAuLi4uYm9vZ2VyLi4uLlxuXG4gICAgICAvLyBXaGljaCBldmVyIHJlc3VsdHMgaW4gYSBtYXRjaCBmaXJzdCBpcyB0aGVuIHVzZWQuIFNvIHRoaXMgMy00IHN0ZXBcbiAgICAgIC8vIHByb2Nlc3MgZXNzZW50aWFsbHkgYWxsb3dzIHVzIHRvIHNheSBcIm1hdGNoIGF0IHRoaXMgcG9zaXRpb24sIGV4Y2x1ZGluZ1xuICAgICAgLy8gYSBwcmlvciBydWxlIHRoYXQgd2FzIGlnbm9yZWRcIi5cbiAgICAgIC8vXG4gICAgICAvLyAxLiBNYXRjaCBcImJvb2dlclwiIGZpcnN0LCBpZ25vcmUuIEFsc28gcHJvdmVzIHRoYXQgW3N0cmluZ10gZG9lcyBub24gbWF0Y2guXG4gICAgICAvLyAyLiBSZXN1bWUgbWF0Y2hpbmcgZm9yIFtudW1iZXJdXG4gICAgICAvLyAzLiBNYXRjaCBhdCBpbmRleCArIDEgZm9yIFtzdHJpbmcsIFwiYm9vZ2VyXCIsIG51bWJlcl1cbiAgICAgIC8vIDQuIElmICMyIGFuZCAjMyByZXN1bHQgaW4gbWF0Y2hlcywgd2hpY2ggY2FtZSBmaXJzdD9cbiAgICAgIGlmICh0aGlzLnJlc3VtaW5nU2NhbkF0U2FtZVBvc2l0aW9uKCkpIHtcbiAgICAgICAgaWYgKHJlc3VsdCAmJiByZXN1bHQuaW5kZXggPT09IHRoaXMubGFzdEluZGV4KSA7IGVsc2UgeyAvLyB1c2UgdGhlIHNlY29uZCBtYXRjaGVyIHJlc3VsdFxuICAgICAgICAgIGNvbnN0IG0yID0gdGhpcy5nZXRNYXRjaGVyKDApO1xuICAgICAgICAgIG0yLmxhc3RJbmRleCA9IHRoaXMubGFzdEluZGV4ICsgMTtcbiAgICAgICAgICByZXN1bHQgPSBtMi5leGVjKHMpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgdGhpcy5yZWdleEluZGV4ICs9IHJlc3VsdC5wb3NpdGlvbiArIDE7XG4gICAgICAgIGlmICh0aGlzLnJlZ2V4SW5kZXggPT09IHRoaXMuY291bnQpIHtcbiAgICAgICAgICAvLyB3cmFwLWFyb3VuZCB0byBjb25zaWRlcmluZyBhbGwgbWF0Y2hlcyBhZ2FpblxuICAgICAgICAgIHRoaXMuY29uc2lkZXJBbGwoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHaXZlbiBhIG1vZGUsIGJ1aWxkcyBhIGh1Z2UgUmVzdW1hYmxlTXVsdGlSZWdleCB0aGF0IGNhbiBiZSB1c2VkIHRvIHdhbGtcbiAgICogdGhlIGNvbnRlbnQgYW5kIGZpbmQgbWF0Y2hlcy5cbiAgICpcbiAgICogQHBhcmFtIHtDb21waWxlZE1vZGV9IG1vZGVcbiAgICogQHJldHVybnMge1Jlc3VtYWJsZU11bHRpUmVnZXh9XG4gICAqL1xuICBmdW5jdGlvbiBidWlsZE1vZGVSZWdleChtb2RlKSB7XG4gICAgY29uc3QgbW0gPSBuZXcgUmVzdW1hYmxlTXVsdGlSZWdleCgpO1xuXG4gICAgbW9kZS5jb250YWlucy5mb3JFYWNoKHRlcm0gPT4gbW0uYWRkUnVsZSh0ZXJtLmJlZ2luLCB7IHJ1bGU6IHRlcm0sIHR5cGU6IFwiYmVnaW5cIiB9KSk7XG5cbiAgICBpZiAobW9kZS50ZXJtaW5hdG9yRW5kKSB7XG4gICAgICBtbS5hZGRSdWxlKG1vZGUudGVybWluYXRvckVuZCwgeyB0eXBlOiBcImVuZFwiIH0pO1xuICAgIH1cbiAgICBpZiAobW9kZS5pbGxlZ2FsKSB7XG4gICAgICBtbS5hZGRSdWxlKG1vZGUuaWxsZWdhbCwgeyB0eXBlOiBcImlsbGVnYWxcIiB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbW07XG4gIH1cblxuICAvKiogc2tpcCB2cyBhYm9ydCB2cyBpZ25vcmVcbiAgICpcbiAgICogQHNraXAgICAtIFRoZSBtb2RlIGlzIHN0aWxsIGVudGVyZWQgYW5kIGV4aXRlZCBub3JtYWxseSAoYW5kIGNvbnRhaW5zIHJ1bGVzIGFwcGx5KSxcbiAgICogICAgICAgICAgIGJ1dCBhbGwgY29udGVudCBpcyBoZWxkIGFuZCBhZGRlZCB0byB0aGUgcGFyZW50IGJ1ZmZlciByYXRoZXIgdGhhbiBiZWluZ1xuICAgKiAgICAgICAgICAgb3V0cHV0IHdoZW4gdGhlIG1vZGUgZW5kcy4gIE1vc3RseSB1c2VkIHdpdGggYHN1Ymxhbmd1YWdlYCB0byBidWlsZCB1cFxuICAgKiAgICAgICAgICAgYSBzaW5nbGUgbGFyZ2UgYnVmZmVyIHRoYW4gY2FuIGJlIHBhcnNlZCBieSBzdWJsYW5ndWFnZS5cbiAgICpcbiAgICogICAgICAgICAgICAgLSBUaGUgbW9kZSBiZWdpbiBhbmRzIGVuZHMgbm9ybWFsbHkuXG4gICAqICAgICAgICAgICAgIC0gQ29udGVudCBtYXRjaGVkIGlzIGFkZGVkIHRvIHRoZSBwYXJlbnQgbW9kZSBidWZmZXIuXG4gICAqICAgICAgICAgICAgIC0gVGhlIHBhcnNlciBjdXJzb3IgaXMgbW92ZWQgZm9yd2FyZCBub3JtYWxseS5cbiAgICpcbiAgICogQGFib3J0ICAtIEEgaGFjayBwbGFjZWhvbGRlciB1bnRpbCB3ZSBoYXZlIGlnbm9yZS4gIEFib3J0cyB0aGUgbW9kZSAoYXMgaWYgaXRcbiAgICogICAgICAgICAgIG5ldmVyIG1hdGNoZWQpIGJ1dCBET0VTIE5PVCBjb250aW51ZSB0byBtYXRjaCBzdWJzZXF1ZW50IGBjb250YWluc2BcbiAgICogICAgICAgICAgIG1vZGVzLiAgQWJvcnQgaXMgYmFkL3N1Ym9wdGltYWwgYmVjYXVzZSBpdCBjYW4gcmVzdWx0IGluIG1vZGVzXG4gICAqICAgICAgICAgICBmYXJ0aGVyIGRvd24gbm90IGdldHRpbmcgYXBwbGllZCBiZWNhdXNlIGFuIGVhcmxpZXIgcnVsZSBlYXRzIHRoZVxuICAgKiAgICAgICAgICAgY29udGVudCBidXQgdGhlbiBhYm9ydHMuXG4gICAqXG4gICAqICAgICAgICAgICAgIC0gVGhlIG1vZGUgZG9lcyBub3QgYmVnaW4uXG4gICAqICAgICAgICAgICAgIC0gQ29udGVudCBtYXRjaGVkIGJ5IGBiZWdpbmAgaXMgYWRkZWQgdG8gdGhlIG1vZGUgYnVmZmVyLlxuICAgKiAgICAgICAgICAgICAtIFRoZSBwYXJzZXIgY3Vyc29yIGlzIG1vdmVkIGZvcndhcmQgYWNjb3JkaW5nbHkuXG4gICAqXG4gICAqIEBpZ25vcmUgLSBJZ25vcmVzIHRoZSBtb2RlIChhcyBpZiBpdCBuZXZlciBtYXRjaGVkKSBhbmQgY29udGludWVzIHRvIG1hdGNoIGFueVxuICAgKiAgICAgICAgICAgc3Vic2VxdWVudCBgY29udGFpbnNgIG1vZGVzLiAgSWdub3JlIGlzbid0IHRlY2huaWNhbGx5IHBvc3NpYmxlIHdpdGhcbiAgICogICAgICAgICAgIHRoZSBjdXJyZW50IHBhcnNlciBpbXBsZW1lbnRhdGlvbi5cbiAgICpcbiAgICogICAgICAgICAgICAgLSBUaGUgbW9kZSBkb2VzIG5vdCBiZWdpbi5cbiAgICogICAgICAgICAgICAgLSBDb250ZW50IG1hdGNoZWQgYnkgYGJlZ2luYCBpcyBpZ25vcmVkLlxuICAgKiAgICAgICAgICAgICAtIFRoZSBwYXJzZXIgY3Vyc29yIGlzIG5vdCBtb3ZlZCBmb3J3YXJkLlxuICAgKi9cblxuICAvKipcbiAgICogQ29tcGlsZXMgYW4gaW5kaXZpZHVhbCBtb2RlXG4gICAqXG4gICAqIFRoaXMgY2FuIHJhaXNlIGFuIGVycm9yIGlmIHRoZSBtb2RlIGNvbnRhaW5zIGNlcnRhaW4gZGV0ZWN0YWJsZSBrbm93biBsb2dpY1xuICAgKiBpc3N1ZXMuXG4gICAqIEBwYXJhbSB7TW9kZX0gbW9kZVxuICAgKiBAcGFyYW0ge0NvbXBpbGVkTW9kZSB8IG51bGx9IFtwYXJlbnRdXG4gICAqIEByZXR1cm5zIHtDb21waWxlZE1vZGUgfCBuZXZlcn1cbiAgICovXG4gIGZ1bmN0aW9uIGNvbXBpbGVNb2RlKG1vZGUsIHBhcmVudCkge1xuICAgIGNvbnN0IGNtb2RlID0gLyoqIEB0eXBlIENvbXBpbGVkTW9kZSAqLyAobW9kZSk7XG4gICAgaWYgKG1vZGUuaXNDb21waWxlZCkgcmV0dXJuIGNtb2RlO1xuXG4gICAgW1xuICAgICAgc2NvcGVDbGFzc05hbWUsXG4gICAgICAvLyBkbyB0aGlzIGVhcmx5IHNvIGNvbXBpbGVyIGV4dGVuc2lvbnMgZ2VuZXJhbGx5IGRvbid0IGhhdmUgdG8gd29ycnkgYWJvdXRcbiAgICAgIC8vIHRoZSBkaXN0aW5jdGlvbiBiZXR3ZWVuIG1hdGNoL2JlZ2luXG4gICAgICBjb21waWxlTWF0Y2gsXG4gICAgICBNdWx0aUNsYXNzLFxuICAgICAgYmVmb3JlTWF0Y2hFeHRcbiAgICBdLmZvckVhY2goZXh0ID0+IGV4dChtb2RlLCBwYXJlbnQpKTtcblxuICAgIGxhbmd1YWdlLmNvbXBpbGVyRXh0ZW5zaW9ucy5mb3JFYWNoKGV4dCA9PiBleHQobW9kZSwgcGFyZW50KSk7XG5cbiAgICAvLyBfX2JlZm9yZUJlZ2luIGlzIGNvbnNpZGVyZWQgcHJpdmF0ZSBBUEksIGludGVybmFsIHVzZSBvbmx5XG4gICAgbW9kZS5fX2JlZm9yZUJlZ2luID0gbnVsbDtcblxuICAgIFtcbiAgICAgIGJlZ2luS2V5d29yZHMsXG4gICAgICAvLyBkbyB0aGlzIGxhdGVyIHNvIGNvbXBpbGVyIGV4dGVuc2lvbnMgdGhhdCBjb21lIGVhcmxpZXIgaGF2ZSBhY2Nlc3MgdG8gdGhlXG4gICAgICAvLyByYXcgYXJyYXkgaWYgdGhleSB3YW50ZWQgdG8gcGVyaGFwcyBtYW5pcHVsYXRlIGl0LCBldGMuXG4gICAgICBjb21waWxlSWxsZWdhbCxcbiAgICAgIC8vIGRlZmF1bHQgdG8gMSByZWxldmFuY2UgaWYgbm90IHNwZWNpZmllZFxuICAgICAgY29tcGlsZVJlbGV2YW5jZVxuICAgIF0uZm9yRWFjaChleHQgPT4gZXh0KG1vZGUsIHBhcmVudCkpO1xuXG4gICAgbW9kZS5pc0NvbXBpbGVkID0gdHJ1ZTtcblxuICAgIGxldCBrZXl3b3JkUGF0dGVybiA9IG51bGw7XG4gICAgaWYgKHR5cGVvZiBtb2RlLmtleXdvcmRzID09PSBcIm9iamVjdFwiICYmIG1vZGUua2V5d29yZHMuJHBhdHRlcm4pIHtcbiAgICAgIC8vIHdlIG5lZWQgYSBjb3B5IGJlY2F1c2Uga2V5d29yZHMgbWlnaHQgYmUgY29tcGlsZWQgbXVsdGlwbGUgdGltZXNcbiAgICAgIC8vIHNvIHdlIGNhbid0IGdvIGRlbGV0aW5nICRwYXR0ZXJuIGZyb20gdGhlIG9yaWdpbmFsIG9uIHRoZSBmaXJzdFxuICAgICAgLy8gcGFzc1xuICAgICAgbW9kZS5rZXl3b3JkcyA9IE9iamVjdC5hc3NpZ24oe30sIG1vZGUua2V5d29yZHMpO1xuICAgICAga2V5d29yZFBhdHRlcm4gPSBtb2RlLmtleXdvcmRzLiRwYXR0ZXJuO1xuICAgICAgZGVsZXRlIG1vZGUua2V5d29yZHMuJHBhdHRlcm47XG4gICAgfVxuICAgIGtleXdvcmRQYXR0ZXJuID0ga2V5d29yZFBhdHRlcm4gfHwgL1xcdysvO1xuXG4gICAgaWYgKG1vZGUua2V5d29yZHMpIHtcbiAgICAgIG1vZGUua2V5d29yZHMgPSBjb21waWxlS2V5d29yZHMobW9kZS5rZXl3b3JkcywgbGFuZ3VhZ2UuY2FzZV9pbnNlbnNpdGl2ZSk7XG4gICAgfVxuXG4gICAgY21vZGUua2V5d29yZFBhdHRlcm5SZSA9IGxhbmdSZShrZXl3b3JkUGF0dGVybiwgdHJ1ZSk7XG5cbiAgICBpZiAocGFyZW50KSB7XG4gICAgICBpZiAoIW1vZGUuYmVnaW4pIG1vZGUuYmVnaW4gPSAvXFxCfFxcYi87XG4gICAgICBjbW9kZS5iZWdpblJlID0gbGFuZ1JlKGNtb2RlLmJlZ2luKTtcbiAgICAgIGlmICghbW9kZS5lbmQgJiYgIW1vZGUuZW5kc1dpdGhQYXJlbnQpIG1vZGUuZW5kID0gL1xcQnxcXGIvO1xuICAgICAgaWYgKG1vZGUuZW5kKSBjbW9kZS5lbmRSZSA9IGxhbmdSZShjbW9kZS5lbmQpO1xuICAgICAgY21vZGUudGVybWluYXRvckVuZCA9IHNvdXJjZShjbW9kZS5lbmQpIHx8ICcnO1xuICAgICAgaWYgKG1vZGUuZW5kc1dpdGhQYXJlbnQgJiYgcGFyZW50LnRlcm1pbmF0b3JFbmQpIHtcbiAgICAgICAgY21vZGUudGVybWluYXRvckVuZCArPSAobW9kZS5lbmQgPyAnfCcgOiAnJykgKyBwYXJlbnQudGVybWluYXRvckVuZDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG1vZGUuaWxsZWdhbCkgY21vZGUuaWxsZWdhbFJlID0gbGFuZ1JlKC8qKiBAdHlwZSB7UmVnRXhwIHwgc3RyaW5nfSAqLyAobW9kZS5pbGxlZ2FsKSk7XG4gICAgaWYgKCFtb2RlLmNvbnRhaW5zKSBtb2RlLmNvbnRhaW5zID0gW107XG5cbiAgICBtb2RlLmNvbnRhaW5zID0gW10uY29uY2F0KC4uLm1vZGUuY29udGFpbnMubWFwKGZ1bmN0aW9uKGMpIHtcbiAgICAgIHJldHVybiBleHBhbmRPckNsb25lTW9kZShjID09PSAnc2VsZicgPyBtb2RlIDogYyk7XG4gICAgfSkpO1xuICAgIG1vZGUuY29udGFpbnMuZm9yRWFjaChmdW5jdGlvbihjKSB7IGNvbXBpbGVNb2RlKC8qKiBAdHlwZSBNb2RlICovIChjKSwgY21vZGUpOyB9KTtcblxuICAgIGlmIChtb2RlLnN0YXJ0cykge1xuICAgICAgY29tcGlsZU1vZGUobW9kZS5zdGFydHMsIHBhcmVudCk7XG4gICAgfVxuXG4gICAgY21vZGUubWF0Y2hlciA9IGJ1aWxkTW9kZVJlZ2V4KGNtb2RlKTtcbiAgICByZXR1cm4gY21vZGU7XG4gIH1cblxuICBpZiAoIWxhbmd1YWdlLmNvbXBpbGVyRXh0ZW5zaW9ucykgbGFuZ3VhZ2UuY29tcGlsZXJFeHRlbnNpb25zID0gW107XG5cbiAgLy8gc2VsZiBpcyBub3QgdmFsaWQgYXQgdGhlIHRvcC1sZXZlbFxuICBpZiAobGFuZ3VhZ2UuY29udGFpbnMgJiYgbGFuZ3VhZ2UuY29udGFpbnMuaW5jbHVkZXMoJ3NlbGYnKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkVSUjogY29udGFpbnMgYHNlbGZgIGlzIG5vdCBzdXBwb3J0ZWQgYXQgdGhlIHRvcC1sZXZlbCBvZiBhIGxhbmd1YWdlLiAgU2VlIGRvY3VtZW50YXRpb24uXCIpO1xuICB9XG5cbiAgLy8gd2UgbmVlZCBhIG51bGwgb2JqZWN0LCB3aGljaCBpbmhlcml0IHdpbGwgZ3VhcmFudGVlXG4gIGxhbmd1YWdlLmNsYXNzTmFtZUFsaWFzZXMgPSBpbmhlcml0JDEobGFuZ3VhZ2UuY2xhc3NOYW1lQWxpYXNlcyB8fCB7fSk7XG5cbiAgcmV0dXJuIGNvbXBpbGVNb2RlKC8qKiBAdHlwZSBNb2RlICovIChsYW5ndWFnZSkpO1xufVxuXG4vKipcbiAqIERldGVybWluZXMgaWYgYSBtb2RlIGhhcyBhIGRlcGVuZGVuY3kgb24gaXQncyBwYXJlbnQgb3Igbm90XG4gKlxuICogSWYgYSBtb2RlIGRvZXMgaGF2ZSBhIHBhcmVudCBkZXBlbmRlbmN5IHRoZW4gb2Z0ZW4gd2UgbmVlZCB0byBjbG9uZSBpdCBpZlxuICogaXQncyB1c2VkIGluIG11bHRpcGxlIHBsYWNlcyBzbyB0aGF0IGVhY2ggY29weSBwb2ludHMgdG8gdGhlIGNvcnJlY3QgcGFyZW50LFxuICogd2hlcmUtYXMgbW9kZXMgd2l0aG91dCBhIHBhcmVudCBjYW4gb2Z0ZW4gc2FmZWx5IGJlIHJlLXVzZWQgYXQgdGhlIGJvdHRvbSBvZlxuICogYSBtb2RlIGNoYWluLlxuICpcbiAqIEBwYXJhbSB7TW9kZSB8IG51bGx9IG1vZGVcbiAqIEByZXR1cm5zIHtib29sZWFufSAtIGlzIHRoZXJlIGEgZGVwZW5kZW5jeSBvbiB0aGUgcGFyZW50P1xuICogKi9cbmZ1bmN0aW9uIGRlcGVuZGVuY3lPblBhcmVudChtb2RlKSB7XG4gIGlmICghbW9kZSkgcmV0dXJuIGZhbHNlO1xuXG4gIHJldHVybiBtb2RlLmVuZHNXaXRoUGFyZW50IHx8IGRlcGVuZGVuY3lPblBhcmVudChtb2RlLnN0YXJ0cyk7XG59XG5cbi8qKlxuICogRXhwYW5kcyBhIG1vZGUgb3IgY2xvbmVzIGl0IGlmIG5lY2Vzc2FyeVxuICpcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IGZvciBtb2RlcyB3aXRoIHBhcmVudGFsIGRlcGVuZGVuY2VpcyAoc2VlIG5vdGVzIG9uXG4gKiBgZGVwZW5kZW5jeU9uUGFyZW50YCkgYW5kIGZvciBub2RlcyB0aGF0IGhhdmUgYHZhcmlhbnRzYCAtIHdoaWNoIG11c3QgdGhlbiBiZVxuICogZXhwbG9kZWQgaW50byB0aGVpciBvd24gaW5kaXZpZHVhbCBtb2RlcyBhdCBjb21waWxlIHRpbWUuXG4gKlxuICogQHBhcmFtIHtNb2RlfSBtb2RlXG4gKiBAcmV0dXJucyB7TW9kZSB8IE1vZGVbXX1cbiAqICovXG5mdW5jdGlvbiBleHBhbmRPckNsb25lTW9kZShtb2RlKSB7XG4gIGlmIChtb2RlLnZhcmlhbnRzICYmICFtb2RlLmNhY2hlZFZhcmlhbnRzKSB7XG4gICAgbW9kZS5jYWNoZWRWYXJpYW50cyA9IG1vZGUudmFyaWFudHMubWFwKGZ1bmN0aW9uKHZhcmlhbnQpIHtcbiAgICAgIHJldHVybiBpbmhlcml0JDEobW9kZSwgeyB2YXJpYW50czogbnVsbCB9LCB2YXJpYW50KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIEVYUEFORFxuICAvLyBpZiB3ZSBoYXZlIHZhcmlhbnRzIHRoZW4gZXNzZW50aWFsbHkgXCJyZXBsYWNlXCIgdGhlIG1vZGUgd2l0aCB0aGUgdmFyaWFudHNcbiAgLy8gdGhpcyBoYXBwZW5zIGluIGNvbXBpbGVNb2RlLCB3aGVyZSB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBmcm9tXG4gIGlmIChtb2RlLmNhY2hlZFZhcmlhbnRzKSB7XG4gICAgcmV0dXJuIG1vZGUuY2FjaGVkVmFyaWFudHM7XG4gIH1cblxuICAvLyBDTE9ORVxuICAvLyBpZiB3ZSBoYXZlIGRlcGVuZGVuY2llcyBvbiBwYXJlbnRzIHRoZW4gd2UgbmVlZCBhIHVuaXF1ZVxuICAvLyBpbnN0YW5jZSBvZiBvdXJzZWx2ZXMsIHNvIHdlIGNhbiBiZSByZXVzZWQgd2l0aCBtYW55XG4gIC8vIGRpZmZlcmVudCBwYXJlbnRzIHdpdGhvdXQgaXNzdWVcbiAgaWYgKGRlcGVuZGVuY3lPblBhcmVudChtb2RlKSkge1xuICAgIHJldHVybiBpbmhlcml0JDEobW9kZSwgeyBzdGFydHM6IG1vZGUuc3RhcnRzID8gaW5oZXJpdCQxKG1vZGUuc3RhcnRzKSA6IG51bGwgfSk7XG4gIH1cblxuICBpZiAoT2JqZWN0LmlzRnJvemVuKG1vZGUpKSB7XG4gICAgcmV0dXJuIGluaGVyaXQkMShtb2RlKTtcbiAgfVxuXG4gIC8vIG5vIHNwZWNpYWwgZGVwZW5kZW5jeSBpc3N1ZXMsIGp1c3QgcmV0dXJuIG91cnNlbHZlc1xuICByZXR1cm4gbW9kZTtcbn1cblxudmFyIHZlcnNpb24gPSBcIjExLjExLjFcIjtcblxuY2xhc3MgSFRNTEluamVjdGlvbkVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihyZWFzb24sIGh0bWwpIHtcbiAgICBzdXBlcihyZWFzb24pO1xuICAgIHRoaXMubmFtZSA9IFwiSFRNTEluamVjdGlvbkVycm9yXCI7XG4gICAgdGhpcy5odG1sID0gaHRtbDtcbiAgfVxufVxuXG4vKlxuU3ludGF4IGhpZ2hsaWdodGluZyB3aXRoIGxhbmd1YWdlIGF1dG9kZXRlY3Rpb24uXG5odHRwczovL2hpZ2hsaWdodGpzLm9yZy9cbiovXG5cblxuXG4vKipcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLk1vZGV9IE1vZGVcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLkNvbXBpbGVkTW9kZX0gQ29tcGlsZWRNb2RlXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5Db21waWxlZFNjb3BlfSBDb21waWxlZFNjb3BlXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5MYW5ndWFnZX0gTGFuZ3VhZ2VcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLkhMSlNBcGl9IEhMSlNBcGlcbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLkhMSlNQbHVnaW59IEhMSlNQbHVnaW5cbkB0eXBlZGVmIHtpbXBvcnQoJ2hpZ2hsaWdodC5qcycpLlBsdWdpbkV2ZW50fSBQbHVnaW5FdmVudFxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuSExKU09wdGlvbnN9IEhMSlNPcHRpb25zXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5MYW5ndWFnZUZufSBMYW5ndWFnZUZuXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5IaWdobGlnaHRlZEhUTUxFbGVtZW50fSBIaWdobGlnaHRlZEhUTUxFbGVtZW50XG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMnKS5CZWZvcmVIaWdobGlnaHRDb250ZXh0fSBCZWZvcmVIaWdobGlnaHRDb250ZXh0XG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMvcHJpdmF0ZScpLk1hdGNoVHlwZX0gTWF0Y2hUeXBlXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMvcHJpdmF0ZScpLktleXdvcmREYXRhfSBLZXl3b3JkRGF0YVxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzL3ByaXZhdGUnKS5FbmhhbmNlZE1hdGNofSBFbmhhbmNlZE1hdGNoXG5AdHlwZWRlZiB7aW1wb3J0KCdoaWdobGlnaHQuanMvcHJpdmF0ZScpLkFubm90YXRlZEVycm9yfSBBbm5vdGF0ZWRFcnJvclxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuQXV0b0hpZ2hsaWdodFJlc3VsdH0gQXV0b0hpZ2hsaWdodFJlc3VsdFxuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuSGlnaGxpZ2h0T3B0aW9uc30gSGlnaGxpZ2h0T3B0aW9uc1xuQHR5cGVkZWYge2ltcG9ydCgnaGlnaGxpZ2h0LmpzJykuSGlnaGxpZ2h0UmVzdWx0fSBIaWdobGlnaHRSZXN1bHRcbiovXG5cblxuY29uc3QgZXNjYXBlID0gZXNjYXBlSFRNTDtcbmNvbnN0IGluaGVyaXQgPSBpbmhlcml0JDE7XG5jb25zdCBOT19NQVRDSCA9IFN5bWJvbChcIm5vbWF0Y2hcIik7XG5jb25zdCBNQVhfS0VZV09SRF9ISVRTID0gNztcblxuLyoqXG4gKiBAcGFyYW0ge2FueX0gaGxqcyAtIG9iamVjdCB0aGF0IGlzIGV4dGVuZGVkIChsZWdhY3kpXG4gKiBAcmV0dXJucyB7SExKU0FwaX1cbiAqL1xuY29uc3QgSExKUyA9IGZ1bmN0aW9uKGhsanMpIHtcbiAgLy8gR2xvYmFsIGludGVybmFsIHZhcmlhYmxlcyB1c2VkIHdpdGhpbiB0aGUgaGlnaGxpZ2h0LmpzIGxpYnJhcnkuXG4gIC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgTGFuZ3VhZ2U+fSAqL1xuICBjb25zdCBsYW5ndWFnZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHN0cmluZz59ICovXG4gIGNvbnN0IGFsaWFzZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAvKiogQHR5cGUge0hMSlNQbHVnaW5bXX0gKi9cbiAgY29uc3QgcGx1Z2lucyA9IFtdO1xuXG4gIC8vIHNhZmUvcHJvZHVjdGlvbiBtb2RlIC0gc3dhbGxvd3MgbW9yZSBlcnJvcnMsIHRyaWVzIHRvIGtlZXAgcnVubmluZ1xuICAvLyBldmVuIGlmIGEgc2luZ2xlIHN5bnRheCBvciBwYXJzZSBoaXRzIGEgZmF0YWwgZXJyb3JcbiAgbGV0IFNBRkVfTU9ERSA9IHRydWU7XG4gIGNvbnN0IExBTkdVQUdFX05PVF9GT1VORCA9IFwiQ291bGQgbm90IGZpbmQgdGhlIGxhbmd1YWdlICd7fScsIGRpZCB5b3UgZm9yZ2V0IHRvIGxvYWQvaW5jbHVkZSBhIGxhbmd1YWdlIG1vZHVsZT9cIjtcbiAgLyoqIEB0eXBlIHtMYW5ndWFnZX0gKi9cbiAgY29uc3QgUExBSU5URVhUX0xBTkdVQUdFID0geyBkaXNhYmxlQXV0b2RldGVjdDogdHJ1ZSwgbmFtZTogJ1BsYWluIHRleHQnLCBjb250YWluczogW10gfTtcblxuICAvLyBHbG9iYWwgb3B0aW9ucyB1c2VkIHdoZW4gd2l0aGluIGV4dGVybmFsIEFQSXMuIFRoaXMgaXMgbW9kaWZpZWQgd2hlblxuICAvLyBjYWxsaW5nIHRoZSBgaGxqcy5jb25maWd1cmVgIGZ1bmN0aW9uLlxuICAvKiogQHR5cGUgSExKU09wdGlvbnMgKi9cbiAgbGV0IG9wdGlvbnMgPSB7XG4gICAgaWdub3JlVW5lc2NhcGVkSFRNTDogZmFsc2UsXG4gICAgdGhyb3dVbmVzY2FwZWRIVE1MOiBmYWxzZSxcbiAgICBub0hpZ2hsaWdodFJlOiAvXihuby0/aGlnaGxpZ2h0KSQvaSxcbiAgICBsYW5ndWFnZURldGVjdFJlOiAvXFxibGFuZyg/OnVhZ2UpPy0oW1xcdy1dKylcXGIvaSxcbiAgICBjbGFzc1ByZWZpeDogJ2hsanMtJyxcbiAgICBjc3NTZWxlY3RvcjogJ3ByZSBjb2RlJyxcbiAgICBsYW5ndWFnZXM6IG51bGwsXG4gICAgLy8gYmV0YSBjb25maWd1cmF0aW9uIG9wdGlvbnMsIHN1YmplY3QgdG8gY2hhbmdlLCB3ZWxjb21lIHRvIGRpc2N1c3NcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vaGlnaGxpZ2h0anMvaGlnaGxpZ2h0LmpzL2lzc3Vlcy8xMDg2XG4gICAgX19lbWl0dGVyOiBUb2tlblRyZWVFbWl0dGVyXG4gIH07XG5cbiAgLyogVXRpbGl0eSBmdW5jdGlvbnMgKi9cblxuICAvKipcbiAgICogVGVzdHMgYSBsYW5ndWFnZSBuYW1lIHRvIHNlZSBpZiBoaWdobGlnaHRpbmcgc2hvdWxkIGJlIHNraXBwZWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IGxhbmd1YWdlTmFtZVxuICAgKi9cbiAgZnVuY3Rpb24gc2hvdWxkTm90SGlnaGxpZ2h0KGxhbmd1YWdlTmFtZSkge1xuICAgIHJldHVybiBvcHRpb25zLm5vSGlnaGxpZ2h0UmUudGVzdChsYW5ndWFnZU5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7SGlnaGxpZ2h0ZWRIVE1MRWxlbWVudH0gYmxvY2sgLSB0aGUgSFRNTCBlbGVtZW50IHRvIGRldGVybWluZSBsYW5ndWFnZSBmb3JcbiAgICovXG4gIGZ1bmN0aW9uIGJsb2NrTGFuZ3VhZ2UoYmxvY2spIHtcbiAgICBsZXQgY2xhc3NlcyA9IGJsb2NrLmNsYXNzTmFtZSArICcgJztcblxuICAgIGNsYXNzZXMgKz0gYmxvY2sucGFyZW50Tm9kZSA/IGJsb2NrLnBhcmVudE5vZGUuY2xhc3NOYW1lIDogJyc7XG5cbiAgICAvLyBsYW5ndWFnZS0qIHRha2VzIHByZWNlZGVuY2Ugb3ZlciBub24tcHJlZml4ZWQgY2xhc3MgbmFtZXMuXG4gICAgY29uc3QgbWF0Y2ggPSBvcHRpb25zLmxhbmd1YWdlRGV0ZWN0UmUuZXhlYyhjbGFzc2VzKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIGNvbnN0IGxhbmd1YWdlID0gZ2V0TGFuZ3VhZ2UobWF0Y2hbMV0pO1xuICAgICAgaWYgKCFsYW5ndWFnZSkge1xuICAgICAgICB3YXJuKExBTkdVQUdFX05PVF9GT1VORC5yZXBsYWNlKFwie31cIiwgbWF0Y2hbMV0pKTtcbiAgICAgICAgd2FybihcIkZhbGxpbmcgYmFjayB0byBuby1oaWdobGlnaHQgbW9kZSBmb3IgdGhpcyBibG9jay5cIiwgYmxvY2spO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxhbmd1YWdlID8gbWF0Y2hbMV0gOiAnbm8taGlnaGxpZ2h0JztcbiAgICB9XG5cbiAgICByZXR1cm4gY2xhc3Nlc1xuICAgICAgLnNwbGl0KC9cXHMrLylcbiAgICAgIC5maW5kKChfY2xhc3MpID0+IHNob3VsZE5vdEhpZ2hsaWdodChfY2xhc3MpIHx8IGdldExhbmd1YWdlKF9jbGFzcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvcmUgaGlnaGxpZ2h0aW5nIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBPTEQgQVBJXG4gICAqIGhpZ2hsaWdodChsYW5nLCBjb2RlLCBpZ25vcmVJbGxlZ2FscywgY29udGludWF0aW9uKVxuICAgKlxuICAgKiBORVcgQVBJXG4gICAqIGhpZ2hsaWdodChjb2RlLCB7bGFuZywgaWdub3JlSWxsZWdhbHN9KVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZU9yTGFuZ3VhZ2VOYW1lIC0gdGhlIGxhbmd1YWdlIHRvIHVzZSBmb3IgaGlnaGxpZ2h0aW5nXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgSGlnaGxpZ2h0T3B0aW9uc30gb3B0aW9uc09yQ29kZSAtIHRoZSBjb2RlIHRvIGhpZ2hsaWdodFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpZ25vcmVJbGxlZ2Fsc10gLSB3aGV0aGVyIHRvIGlnbm9yZSBpbGxlZ2FsIG1hdGNoZXMsIGRlZmF1bHQgaXMgdG8gYmFpbFxuICAgKlxuICAgKiBAcmV0dXJucyB7SGlnaGxpZ2h0UmVzdWx0fSBSZXN1bHQgLSBhbiBvYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSByZXN1bHRcbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IGxhbmd1YWdlIC0gdGhlIGxhbmd1YWdlIG5hbWVcbiAgICogQHByb3BlcnR5IHtudW1iZXJ9IHJlbGV2YW5jZSAtIHRoZSByZWxldmFuY2Ugc2NvcmVcbiAgICogQHByb3BlcnR5IHtzdHJpbmd9IHZhbHVlIC0gdGhlIGhpZ2hsaWdodGVkIEhUTUwgY29kZVxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gY29kZSAtIHRoZSBvcmlnaW5hbCByYXcgY29kZVxuICAgKiBAcHJvcGVydHkge0NvbXBpbGVkTW9kZX0gdG9wIC0gdG9wIG9mIHRoZSBjdXJyZW50IG1vZGUgc3RhY2tcbiAgICogQHByb3BlcnR5IHtib29sZWFufSBpbGxlZ2FsIC0gaW5kaWNhdGVzIHdoZXRoZXIgYW55IGlsbGVnYWwgbWF0Y2hlcyB3ZXJlIGZvdW5kXG4gICovXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodChjb2RlT3JMYW5ndWFnZU5hbWUsIG9wdGlvbnNPckNvZGUsIGlnbm9yZUlsbGVnYWxzKSB7XG4gICAgbGV0IGNvZGUgPSBcIlwiO1xuICAgIGxldCBsYW5ndWFnZU5hbWUgPSBcIlwiO1xuICAgIGlmICh0eXBlb2Ygb3B0aW9uc09yQ29kZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgY29kZSA9IGNvZGVPckxhbmd1YWdlTmFtZTtcbiAgICAgIGlnbm9yZUlsbGVnYWxzID0gb3B0aW9uc09yQ29kZS5pZ25vcmVJbGxlZ2FscztcbiAgICAgIGxhbmd1YWdlTmFtZSA9IG9wdGlvbnNPckNvZGUubGFuZ3VhZ2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIG9sZCBBUElcbiAgICAgIGRlcHJlY2F0ZWQoXCIxMC43LjBcIiwgXCJoaWdobGlnaHQobGFuZywgY29kZSwgLi4uYXJncykgaGFzIGJlZW4gZGVwcmVjYXRlZC5cIik7XG4gICAgICBkZXByZWNhdGVkKFwiMTAuNy4wXCIsIFwiUGxlYXNlIHVzZSBoaWdobGlnaHQoY29kZSwgb3B0aW9ucykgaW5zdGVhZC5cXG5odHRwczovL2dpdGh1Yi5jb20vaGlnaGxpZ2h0anMvaGlnaGxpZ2h0LmpzL2lzc3Vlcy8yMjc3XCIpO1xuICAgICAgbGFuZ3VhZ2VOYW1lID0gY29kZU9yTGFuZ3VhZ2VOYW1lO1xuICAgICAgY29kZSA9IG9wdGlvbnNPckNvZGU7XG4gICAgfVxuXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2hpZ2hsaWdodGpzL2hpZ2hsaWdodC5qcy9pc3N1ZXMvMzE0OVxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZmluZWRcbiAgICBpZiAoaWdub3JlSWxsZWdhbHMgPT09IHVuZGVmaW5lZCkgeyBpZ25vcmVJbGxlZ2FscyA9IHRydWU7IH1cblxuICAgIC8qKiBAdHlwZSB7QmVmb3JlSGlnaGxpZ2h0Q29udGV4dH0gKi9cbiAgICBjb25zdCBjb250ZXh0ID0ge1xuICAgICAgY29kZSxcbiAgICAgIGxhbmd1YWdlOiBsYW5ndWFnZU5hbWVcbiAgICB9O1xuICAgIC8vIHRoZSBwbHVnaW4gY2FuIGNoYW5nZSB0aGUgZGVzaXJlZCBsYW5ndWFnZSBvciB0aGUgY29kZSB0byBiZSBoaWdobGlnaHRlZFxuICAgIC8vIGp1c3QgYmUgY2hhbmdpbmcgdGhlIG9iamVjdCBpdCB3YXMgcGFzc2VkXG4gICAgZmlyZShcImJlZm9yZTpoaWdobGlnaHRcIiwgY29udGV4dCk7XG5cbiAgICAvLyBhIGJlZm9yZSBwbHVnaW4gY2FuIHVzdXJwIHRoZSByZXN1bHQgY29tcGxldGVseSBieSBwcm92aWRpbmcgaXQncyBvd25cbiAgICAvLyBpbiB3aGljaCBjYXNlIHdlIGRvbid0IGV2ZW4gbmVlZCB0byBjYWxsIGhpZ2hsaWdodFxuICAgIGNvbnN0IHJlc3VsdCA9IGNvbnRleHQucmVzdWx0XG4gICAgICA/IGNvbnRleHQucmVzdWx0XG4gICAgICA6IF9oaWdobGlnaHQoY29udGV4dC5sYW5ndWFnZSwgY29udGV4dC5jb2RlLCBpZ25vcmVJbGxlZ2Fscyk7XG5cbiAgICByZXN1bHQuY29kZSA9IGNvbnRleHQuY29kZTtcbiAgICAvLyB0aGUgcGx1Z2luIGNhbiBjaGFuZ2UgYW55dGhpbmcgaW4gcmVzdWx0IHRvIHN1aXRlIGl0XG4gICAgZmlyZShcImFmdGVyOmhpZ2hsaWdodFwiLCByZXN1bHQpO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBwcml2YXRlIGhpZ2hsaWdodCB0aGF0J3MgdXNlZCBpbnRlcm5hbGx5IGFuZCBkb2VzIG5vdCBmaXJlIGNhbGxiYWNrc1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2VOYW1lIC0gdGhlIGxhbmd1YWdlIHRvIHVzZSBmb3IgaGlnaGxpZ2h0aW5nXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlVG9IaWdobGlnaHQgLSB0aGUgY29kZSB0byBoaWdobGlnaHRcbiAgICogQHBhcmFtIHtib29sZWFuP30gW2lnbm9yZUlsbGVnYWxzXSAtIHdoZXRoZXIgdG8gaWdub3JlIGlsbGVnYWwgbWF0Y2hlcywgZGVmYXVsdCBpcyB0byBiYWlsXG4gICAqIEBwYXJhbSB7Q29tcGlsZWRNb2RlP30gW2NvbnRpbnVhdGlvbl0gLSBjdXJyZW50IGNvbnRpbnVhdGlvbiBtb2RlLCBpZiBhbnlcbiAgICogQHJldHVybnMge0hpZ2hsaWdodFJlc3VsdH0gLSByZXN1bHQgb2YgdGhlIGhpZ2hsaWdodCBvcGVyYXRpb25cbiAgKi9cbiAgZnVuY3Rpb24gX2hpZ2hsaWdodChsYW5ndWFnZU5hbWUsIGNvZGVUb0hpZ2hsaWdodCwgaWdub3JlSWxsZWdhbHMsIGNvbnRpbnVhdGlvbikge1xuICAgIGNvbnN0IGtleXdvcmRIaXRzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybiBrZXl3b3JkIGRhdGEgaWYgYSBtYXRjaCBpcyBhIGtleXdvcmRcbiAgICAgKiBAcGFyYW0ge0NvbXBpbGVkTW9kZX0gbW9kZSAtIGN1cnJlbnQgbW9kZVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtYXRjaFRleHQgLSB0aGUgdGV4dHVhbCBtYXRjaFxuICAgICAqIEByZXR1cm5zIHtLZXl3b3JkRGF0YSB8IGZhbHNlfVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGtleXdvcmREYXRhKG1vZGUsIG1hdGNoVGV4dCkge1xuICAgICAgcmV0dXJuIG1vZGUua2V5d29yZHNbbWF0Y2hUZXh0XTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzS2V5d29yZHMoKSB7XG4gICAgICBpZiAoIXRvcC5rZXl3b3Jkcykge1xuICAgICAgICBlbWl0dGVyLmFkZFRleHQobW9kZUJ1ZmZlcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgbGV0IGxhc3RJbmRleCA9IDA7XG4gICAgICB0b3Aua2V5d29yZFBhdHRlcm5SZS5sYXN0SW5kZXggPSAwO1xuICAgICAgbGV0IG1hdGNoID0gdG9wLmtleXdvcmRQYXR0ZXJuUmUuZXhlYyhtb2RlQnVmZmVyKTtcbiAgICAgIGxldCBidWYgPSBcIlwiO1xuXG4gICAgICB3aGlsZSAobWF0Y2gpIHtcbiAgICAgICAgYnVmICs9IG1vZGVCdWZmZXIuc3Vic3RyaW5nKGxhc3RJbmRleCwgbWF0Y2guaW5kZXgpO1xuICAgICAgICBjb25zdCB3b3JkID0gbGFuZ3VhZ2UuY2FzZV9pbnNlbnNpdGl2ZSA/IG1hdGNoWzBdLnRvTG93ZXJDYXNlKCkgOiBtYXRjaFswXTtcbiAgICAgICAgY29uc3QgZGF0YSA9IGtleXdvcmREYXRhKHRvcCwgd29yZCk7XG4gICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgY29uc3QgW2tpbmQsIGtleXdvcmRSZWxldmFuY2VdID0gZGF0YTtcbiAgICAgICAgICBlbWl0dGVyLmFkZFRleHQoYnVmKTtcbiAgICAgICAgICBidWYgPSBcIlwiO1xuXG4gICAgICAgICAga2V5d29yZEhpdHNbd29yZF0gPSAoa2V5d29yZEhpdHNbd29yZF0gfHwgMCkgKyAxO1xuICAgICAgICAgIGlmIChrZXl3b3JkSGl0c1t3b3JkXSA8PSBNQVhfS0VZV09SRF9ISVRTKSByZWxldmFuY2UgKz0ga2V5d29yZFJlbGV2YW5jZTtcbiAgICAgICAgICBpZiAoa2luZC5zdGFydHNXaXRoKFwiX1wiKSkge1xuICAgICAgICAgICAgLy8gXyBpbXBsaWVkIGZvciByZWxldmFuY2Ugb25seSwgZG8gbm90IGhpZ2hsaWdodFxuICAgICAgICAgICAgLy8gYnkgYXBwbHlpbmcgYSBjbGFzcyBuYW1lXG4gICAgICAgICAgICBidWYgKz0gbWF0Y2hbMF07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGNzc0NsYXNzID0gbGFuZ3VhZ2UuY2xhc3NOYW1lQWxpYXNlc1traW5kXSB8fCBraW5kO1xuICAgICAgICAgICAgZW1pdEtleXdvcmQobWF0Y2hbMF0sIGNzc0NsYXNzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYnVmICs9IG1hdGNoWzBdO1xuICAgICAgICB9XG4gICAgICAgIGxhc3RJbmRleCA9IHRvcC5rZXl3b3JkUGF0dGVyblJlLmxhc3RJbmRleDtcbiAgICAgICAgbWF0Y2ggPSB0b3Aua2V5d29yZFBhdHRlcm5SZS5leGVjKG1vZGVCdWZmZXIpO1xuICAgICAgfVxuICAgICAgYnVmICs9IG1vZGVCdWZmZXIuc3Vic3RyaW5nKGxhc3RJbmRleCk7XG4gICAgICBlbWl0dGVyLmFkZFRleHQoYnVmKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzU3ViTGFuZ3VhZ2UoKSB7XG4gICAgICBpZiAobW9kZUJ1ZmZlciA9PT0gXCJcIikgcmV0dXJuO1xuICAgICAgLyoqIEB0eXBlIEhpZ2hsaWdodFJlc3VsdCAqL1xuICAgICAgbGV0IHJlc3VsdCA9IG51bGw7XG5cbiAgICAgIGlmICh0eXBlb2YgdG9wLnN1Ykxhbmd1YWdlID09PSAnc3RyaW5nJykge1xuICAgICAgICBpZiAoIWxhbmd1YWdlc1t0b3Auc3ViTGFuZ3VhZ2VdKSB7XG4gICAgICAgICAgZW1pdHRlci5hZGRUZXh0KG1vZGVCdWZmZXIpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgPSBfaGlnaGxpZ2h0KHRvcC5zdWJMYW5ndWFnZSwgbW9kZUJ1ZmZlciwgdHJ1ZSwgY29udGludWF0aW9uc1t0b3Auc3ViTGFuZ3VhZ2VdKTtcbiAgICAgICAgY29udGludWF0aW9uc1t0b3Auc3ViTGFuZ3VhZ2VdID0gLyoqIEB0eXBlIHtDb21waWxlZE1vZGV9ICovIChyZXN1bHQuX3RvcCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQgPSBoaWdobGlnaHRBdXRvKG1vZGVCdWZmZXIsIHRvcC5zdWJMYW5ndWFnZS5sZW5ndGggPyB0b3Auc3ViTGFuZ3VhZ2UgOiBudWxsKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ291bnRpbmcgZW1iZWRkZWQgbGFuZ3VhZ2Ugc2NvcmUgdG93YXJkcyB0aGUgaG9zdCBsYW5ndWFnZSBtYXkgYmUgZGlzYWJsZWRcbiAgICAgIC8vIHdpdGggemVyb2luZyB0aGUgY29udGFpbmluZyBtb2RlIHJlbGV2YW5jZS4gVXNlIGNhc2UgaW4gcG9pbnQgaXMgTWFya2Rvd24gdGhhdFxuICAgICAgLy8gYWxsb3dzIFhNTCBldmVyeXdoZXJlIGFuZCBtYWtlcyBldmVyeSBYTUwgc25pcHBldCB0byBoYXZlIGEgbXVjaCBsYXJnZXIgTWFya2Rvd25cbiAgICAgIC8vIHNjb3JlLlxuICAgICAgaWYgKHRvcC5yZWxldmFuY2UgPiAwKSB7XG4gICAgICAgIHJlbGV2YW5jZSArPSByZXN1bHQucmVsZXZhbmNlO1xuICAgICAgfVxuICAgICAgZW1pdHRlci5fX2FkZFN1Ymxhbmd1YWdlKHJlc3VsdC5fZW1pdHRlciwgcmVzdWx0Lmxhbmd1YWdlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzQnVmZmVyKCkge1xuICAgICAgaWYgKHRvcC5zdWJMYW5ndWFnZSAhPSBudWxsKSB7XG4gICAgICAgIHByb2Nlc3NTdWJMYW5ndWFnZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJvY2Vzc0tleXdvcmRzKCk7XG4gICAgICB9XG4gICAgICBtb2RlQnVmZmVyID0gJyc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2NvcGVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBlbWl0S2V5d29yZChrZXl3b3JkLCBzY29wZSkge1xuICAgICAgaWYgKGtleXdvcmQgPT09IFwiXCIpIHJldHVybjtcblxuICAgICAgZW1pdHRlci5zdGFydFNjb3BlKHNjb3BlKTtcbiAgICAgIGVtaXR0ZXIuYWRkVGV4dChrZXl3b3JkKTtcbiAgICAgIGVtaXR0ZXIuZW5kU2NvcGUoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge0NvbXBpbGVkU2NvcGV9IHNjb3BlXG4gICAgICogQHBhcmFtIHtSZWdFeHBNYXRjaEFycmF5fSBtYXRjaFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGVtaXRNdWx0aUNsYXNzKHNjb3BlLCBtYXRjaCkge1xuICAgICAgbGV0IGkgPSAxO1xuICAgICAgY29uc3QgbWF4ID0gbWF0Y2gubGVuZ3RoIC0gMTtcbiAgICAgIHdoaWxlIChpIDw9IG1heCkge1xuICAgICAgICBpZiAoIXNjb3BlLl9lbWl0W2ldKSB7IGkrKzsgY29udGludWU7IH1cbiAgICAgICAgY29uc3Qga2xhc3MgPSBsYW5ndWFnZS5jbGFzc05hbWVBbGlhc2VzW3Njb3BlW2ldXSB8fCBzY29wZVtpXTtcbiAgICAgICAgY29uc3QgdGV4dCA9IG1hdGNoW2ldO1xuICAgICAgICBpZiAoa2xhc3MpIHtcbiAgICAgICAgICBlbWl0S2V5d29yZCh0ZXh0LCBrbGFzcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbW9kZUJ1ZmZlciA9IHRleHQ7XG4gICAgICAgICAgcHJvY2Vzc0tleXdvcmRzKCk7XG4gICAgICAgICAgbW9kZUJ1ZmZlciA9IFwiXCI7XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7Q29tcGlsZWRNb2RlfSBtb2RlIC0gbmV3IG1vZGUgdG8gc3RhcnRcbiAgICAgKiBAcGFyYW0ge1JlZ0V4cE1hdGNoQXJyYXl9IG1hdGNoXG4gICAgICovXG4gICAgZnVuY3Rpb24gc3RhcnROZXdNb2RlKG1vZGUsIG1hdGNoKSB7XG4gICAgICBpZiAobW9kZS5zY29wZSAmJiB0eXBlb2YgbW9kZS5zY29wZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBlbWl0dGVyLm9wZW5Ob2RlKGxhbmd1YWdlLmNsYXNzTmFtZUFsaWFzZXNbbW9kZS5zY29wZV0gfHwgbW9kZS5zY29wZSk7XG4gICAgICB9XG4gICAgICBpZiAobW9kZS5iZWdpblNjb3BlKSB7XG4gICAgICAgIC8vIGJlZ2luU2NvcGUganVzdCB3cmFwcyB0aGUgYmVnaW4gbWF0Y2ggaXRzZWxmIGluIGEgc2NvcGVcbiAgICAgICAgaWYgKG1vZGUuYmVnaW5TY29wZS5fd3JhcCkge1xuICAgICAgICAgIGVtaXRLZXl3b3JkKG1vZGVCdWZmZXIsIGxhbmd1YWdlLmNsYXNzTmFtZUFsaWFzZXNbbW9kZS5iZWdpblNjb3BlLl93cmFwXSB8fCBtb2RlLmJlZ2luU2NvcGUuX3dyYXApO1xuICAgICAgICAgIG1vZGVCdWZmZXIgPSBcIlwiO1xuICAgICAgICB9IGVsc2UgaWYgKG1vZGUuYmVnaW5TY29wZS5fbXVsdGkpIHtcbiAgICAgICAgICAvLyBhdCB0aGlzIHBvaW50IG1vZGVCdWZmZXIgc2hvdWxkIGp1c3QgYmUgdGhlIG1hdGNoXG4gICAgICAgICAgZW1pdE11bHRpQ2xhc3MobW9kZS5iZWdpblNjb3BlLCBtYXRjaCk7XG4gICAgICAgICAgbW9kZUJ1ZmZlciA9IFwiXCI7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdG9wID0gT2JqZWN0LmNyZWF0ZShtb2RlLCB7IHBhcmVudDogeyB2YWx1ZTogdG9wIH0gfSk7XG4gICAgICByZXR1cm4gdG9wO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7Q29tcGlsZWRNb2RlIH0gbW9kZSAtIHRoZSBtb2RlIHRvIHBvdGVudGlhbGx5IGVuZFxuICAgICAqIEBwYXJhbSB7UmVnRXhwTWF0Y2hBcnJheX0gbWF0Y2ggLSB0aGUgbGF0ZXN0IG1hdGNoXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG1hdGNoUGx1c1JlbWFpbmRlciAtIG1hdGNoIHBsdXMgcmVtYWluZGVyIG9mIGNvbnRlbnRcbiAgICAgKiBAcmV0dXJucyB7Q29tcGlsZWRNb2RlIHwgdm9pZH0gLSB0aGUgbmV4dCBtb2RlLCBvciBpZiB2b2lkIGNvbnRpbnVlIG9uIGluIGN1cnJlbnQgbW9kZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGVuZE9mTW9kZShtb2RlLCBtYXRjaCwgbWF0Y2hQbHVzUmVtYWluZGVyKSB7XG4gICAgICBsZXQgbWF0Y2hlZCA9IHN0YXJ0c1dpdGgobW9kZS5lbmRSZSwgbWF0Y2hQbHVzUmVtYWluZGVyKTtcblxuICAgICAgaWYgKG1hdGNoZWQpIHtcbiAgICAgICAgaWYgKG1vZGVbXCJvbjplbmRcIl0pIHtcbiAgICAgICAgICBjb25zdCByZXNwID0gbmV3IFJlc3BvbnNlKG1vZGUpO1xuICAgICAgICAgIG1vZGVbXCJvbjplbmRcIl0obWF0Y2gsIHJlc3ApO1xuICAgICAgICAgIGlmIChyZXNwLmlzTWF0Y2hJZ25vcmVkKSBtYXRjaGVkID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWF0Y2hlZCkge1xuICAgICAgICAgIHdoaWxlIChtb2RlLmVuZHNQYXJlbnQgJiYgbW9kZS5wYXJlbnQpIHtcbiAgICAgICAgICAgIG1vZGUgPSBtb2RlLnBhcmVudDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG1vZGU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGV2ZW4gaWYgb246ZW5kIGZpcmVzIGFuIGBpZ25vcmVgIGl0J3Mgc3RpbGwgcG9zc2libGVcbiAgICAgIC8vIHRoYXQgd2UgbWlnaHQgdHJpZ2dlciB0aGUgZW5kIG5vZGUgYmVjYXVzZSBvZiBhIHBhcmVudCBtb2RlXG4gICAgICBpZiAobW9kZS5lbmRzV2l0aFBhcmVudCkge1xuICAgICAgICByZXR1cm4gZW5kT2ZNb2RlKG1vZGUucGFyZW50LCBtYXRjaCwgbWF0Y2hQbHVzUmVtYWluZGVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGUgbWF0Y2hpbmcgYnV0IHRoZW4gaWdub3JpbmcgYSBzZXF1ZW5jZSBvZiB0ZXh0XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gbGV4ZW1lIC0gc3RyaW5nIGNvbnRhaW5pbmcgZnVsbCBtYXRjaCB0ZXh0XG4gICAgICovXG4gICAgZnVuY3Rpb24gZG9JZ25vcmUobGV4ZW1lKSB7XG4gICAgICBpZiAodG9wLm1hdGNoZXIucmVnZXhJbmRleCA9PT0gMCkge1xuICAgICAgICAvLyBubyBtb3JlIHJlZ2V4ZXMgdG8gcG90ZW50aWFsbHkgbWF0Y2ggaGVyZSwgc28gd2UgbW92ZSB0aGUgY3Vyc29yIGZvcndhcmQgb25lXG4gICAgICAgIC8vIHNwYWNlXG4gICAgICAgIG1vZGVCdWZmZXIgKz0gbGV4ZW1lWzBdO1xuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIG5vIG5lZWQgdG8gbW92ZSB0aGUgY3Vyc29yLCB3ZSBzdGlsbCBoYXZlIGFkZGl0aW9uYWwgcmVnZXhlcyB0byB0cnkgYW5kXG4gICAgICAgIC8vIG1hdGNoIGF0IHRoaXMgdmVyeSBzcG90XG4gICAgICAgIHJlc3VtZVNjYW5BdFNhbWVQb3NpdGlvbiA9IHRydWU7XG4gICAgICAgIHJldHVybiAwO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhhbmRsZSB0aGUgc3RhcnQgb2YgYSBuZXcgcG90ZW50aWFsIG1vZGUgbWF0Y2hcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RW5oYW5jZWRNYXRjaH0gbWF0Y2ggLSB0aGUgY3VycmVudCBtYXRjaFxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IGhvdyBmYXIgdG8gYWR2YW5jZSB0aGUgcGFyc2UgY3Vyc29yXG4gICAgICovXG4gICAgZnVuY3Rpb24gZG9CZWdpbk1hdGNoKG1hdGNoKSB7XG4gICAgICBjb25zdCBsZXhlbWUgPSBtYXRjaFswXTtcbiAgICAgIGNvbnN0IG5ld01vZGUgPSBtYXRjaC5ydWxlO1xuXG4gICAgICBjb25zdCByZXNwID0gbmV3IFJlc3BvbnNlKG5ld01vZGUpO1xuICAgICAgLy8gZmlyc3QgaW50ZXJuYWwgYmVmb3JlIGNhbGxiYWNrcywgdGhlbiB0aGUgcHVibGljIG9uZXNcbiAgICAgIGNvbnN0IGJlZm9yZUNhbGxiYWNrcyA9IFtuZXdNb2RlLl9fYmVmb3JlQmVnaW4sIG5ld01vZGVbXCJvbjpiZWdpblwiXV07XG4gICAgICBmb3IgKGNvbnN0IGNiIG9mIGJlZm9yZUNhbGxiYWNrcykge1xuICAgICAgICBpZiAoIWNiKSBjb250aW51ZTtcbiAgICAgICAgY2IobWF0Y2gsIHJlc3ApO1xuICAgICAgICBpZiAocmVzcC5pc01hdGNoSWdub3JlZCkgcmV0dXJuIGRvSWdub3JlKGxleGVtZSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChuZXdNb2RlLnNraXApIHtcbiAgICAgICAgbW9kZUJ1ZmZlciArPSBsZXhlbWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobmV3TW9kZS5leGNsdWRlQmVnaW4pIHtcbiAgICAgICAgICBtb2RlQnVmZmVyICs9IGxleGVtZTtcbiAgICAgICAgfVxuICAgICAgICBwcm9jZXNzQnVmZmVyKCk7XG4gICAgICAgIGlmICghbmV3TW9kZS5yZXR1cm5CZWdpbiAmJiAhbmV3TW9kZS5leGNsdWRlQmVnaW4pIHtcbiAgICAgICAgICBtb2RlQnVmZmVyID0gbGV4ZW1lO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzdGFydE5ld01vZGUobmV3TW9kZSwgbWF0Y2gpO1xuICAgICAgcmV0dXJuIG5ld01vZGUucmV0dXJuQmVnaW4gPyAwIDogbGV4ZW1lLmxlbmd0aDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGUgdGhlIHBvdGVudGlhbCBlbmQgb2YgbW9kZVxuICAgICAqXG4gICAgICogQHBhcmFtIHtSZWdFeHBNYXRjaEFycmF5fSBtYXRjaCAtIHRoZSBjdXJyZW50IG1hdGNoXG4gICAgICovXG4gICAgZnVuY3Rpb24gZG9FbmRNYXRjaChtYXRjaCkge1xuICAgICAgY29uc3QgbGV4ZW1lID0gbWF0Y2hbMF07XG4gICAgICBjb25zdCBtYXRjaFBsdXNSZW1haW5kZXIgPSBjb2RlVG9IaWdobGlnaHQuc3Vic3RyaW5nKG1hdGNoLmluZGV4KTtcblxuICAgICAgY29uc3QgZW5kTW9kZSA9IGVuZE9mTW9kZSh0b3AsIG1hdGNoLCBtYXRjaFBsdXNSZW1haW5kZXIpO1xuICAgICAgaWYgKCFlbmRNb2RlKSB7IHJldHVybiBOT19NQVRDSDsgfVxuXG4gICAgICBjb25zdCBvcmlnaW4gPSB0b3A7XG4gICAgICBpZiAodG9wLmVuZFNjb3BlICYmIHRvcC5lbmRTY29wZS5fd3JhcCkge1xuICAgICAgICBwcm9jZXNzQnVmZmVyKCk7XG4gICAgICAgIGVtaXRLZXl3b3JkKGxleGVtZSwgdG9wLmVuZFNjb3BlLl93cmFwKTtcbiAgICAgIH0gZWxzZSBpZiAodG9wLmVuZFNjb3BlICYmIHRvcC5lbmRTY29wZS5fbXVsdGkpIHtcbiAgICAgICAgcHJvY2Vzc0J1ZmZlcigpO1xuICAgICAgICBlbWl0TXVsdGlDbGFzcyh0b3AuZW5kU2NvcGUsIG1hdGNoKTtcbiAgICAgIH0gZWxzZSBpZiAob3JpZ2luLnNraXApIHtcbiAgICAgICAgbW9kZUJ1ZmZlciArPSBsZXhlbWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIShvcmlnaW4ucmV0dXJuRW5kIHx8IG9yaWdpbi5leGNsdWRlRW5kKSkge1xuICAgICAgICAgIG1vZGVCdWZmZXIgKz0gbGV4ZW1lO1xuICAgICAgICB9XG4gICAgICAgIHByb2Nlc3NCdWZmZXIoKTtcbiAgICAgICAgaWYgKG9yaWdpbi5leGNsdWRlRW5kKSB7XG4gICAgICAgICAgbW9kZUJ1ZmZlciA9IGxleGVtZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZG8ge1xuICAgICAgICBpZiAodG9wLnNjb3BlKSB7XG4gICAgICAgICAgZW1pdHRlci5jbG9zZU5vZGUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRvcC5za2lwICYmICF0b3Auc3ViTGFuZ3VhZ2UpIHtcbiAgICAgICAgICByZWxldmFuY2UgKz0gdG9wLnJlbGV2YW5jZTtcbiAgICAgICAgfVxuICAgICAgICB0b3AgPSB0b3AucGFyZW50O1xuICAgICAgfSB3aGlsZSAodG9wICE9PSBlbmRNb2RlLnBhcmVudCk7XG4gICAgICBpZiAoZW5kTW9kZS5zdGFydHMpIHtcbiAgICAgICAgc3RhcnROZXdNb2RlKGVuZE1vZGUuc3RhcnRzLCBtYXRjaCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gb3JpZ2luLnJldHVybkVuZCA/IDAgOiBsZXhlbWUubGVuZ3RoO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHByb2Nlc3NDb250aW51YXRpb25zKCkge1xuICAgICAgY29uc3QgbGlzdCA9IFtdO1xuICAgICAgZm9yIChsZXQgY3VycmVudCA9IHRvcDsgY3VycmVudCAhPT0gbGFuZ3VhZ2U7IGN1cnJlbnQgPSBjdXJyZW50LnBhcmVudCkge1xuICAgICAgICBpZiAoY3VycmVudC5zY29wZSkge1xuICAgICAgICAgIGxpc3QudW5zaGlmdChjdXJyZW50LnNjb3BlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbGlzdC5mb3JFYWNoKGl0ZW0gPT4gZW1pdHRlci5vcGVuTm9kZShpdGVtKSk7XG4gICAgfVxuXG4gICAgLyoqIEB0eXBlIHt7dHlwZT86IE1hdGNoVHlwZSwgaW5kZXg/OiBudW1iZXIsIHJ1bGU/OiBNb2RlfX19ICovXG4gICAgbGV0IGxhc3RNYXRjaCA9IHt9O1xuXG4gICAgLyoqXG4gICAgICogIFByb2Nlc3MgYW4gaW5kaXZpZHVhbCBtYXRjaFxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHRCZWZvcmVNYXRjaCAtIHRleHQgcHJlY2VkaW5nIHRoZSBtYXRjaCAoc2luY2UgdGhlIGxhc3QgbWF0Y2gpXG4gICAgICogQHBhcmFtIHtFbmhhbmNlZE1hdGNofSBbbWF0Y2hdIC0gdGhlIG1hdGNoIGl0c2VsZlxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHByb2Nlc3NMZXhlbWUodGV4dEJlZm9yZU1hdGNoLCBtYXRjaCkge1xuICAgICAgY29uc3QgbGV4ZW1lID0gbWF0Y2ggJiYgbWF0Y2hbMF07XG5cbiAgICAgIC8vIGFkZCBub24tbWF0Y2hlZCB0ZXh0IHRvIHRoZSBjdXJyZW50IG1vZGUgYnVmZmVyXG4gICAgICBtb2RlQnVmZmVyICs9IHRleHRCZWZvcmVNYXRjaDtcblxuICAgICAgaWYgKGxleGVtZSA9PSBudWxsKSB7XG4gICAgICAgIHByb2Nlc3NCdWZmZXIoKTtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9XG5cbiAgICAgIC8vIHdlJ3ZlIGZvdW5kIGEgMCB3aWR0aCBtYXRjaCBhbmQgd2UncmUgc3R1Y2ssIHNvIHdlIG5lZWQgdG8gYWR2YW5jZVxuICAgICAgLy8gdGhpcyBoYXBwZW5zIHdoZW4gd2UgaGF2ZSBiYWRseSBiZWhhdmVkIHJ1bGVzIHRoYXQgaGF2ZSBvcHRpb25hbCBtYXRjaGVycyB0byB0aGUgZGVncmVlIHRoYXRcbiAgICAgIC8vIHNvbWV0aW1lcyB0aGV5IGNhbiBlbmQgdXAgbWF0Y2hpbmcgbm90aGluZyBhdCBhbGxcbiAgICAgIC8vIFJlZjogaHR0cHM6Ly9naXRodWIuY29tL2hpZ2hsaWdodGpzL2hpZ2hsaWdodC5qcy9pc3N1ZXMvMjE0MFxuICAgICAgaWYgKGxhc3RNYXRjaC50eXBlID09PSBcImJlZ2luXCIgJiYgbWF0Y2gudHlwZSA9PT0gXCJlbmRcIiAmJiBsYXN0TWF0Y2guaW5kZXggPT09IG1hdGNoLmluZGV4ICYmIGxleGVtZSA9PT0gXCJcIikge1xuICAgICAgICAvLyBzcGl0IHRoZSBcInNraXBwZWRcIiBjaGFyYWN0ZXIgdGhhdCBvdXIgcmVnZXggY2hva2VkIG9uIGJhY2sgaW50byB0aGUgb3V0cHV0IHNlcXVlbmNlXG4gICAgICAgIG1vZGVCdWZmZXIgKz0gY29kZVRvSGlnaGxpZ2h0LnNsaWNlKG1hdGNoLmluZGV4LCBtYXRjaC5pbmRleCArIDEpO1xuICAgICAgICBpZiAoIVNBRkVfTU9ERSkge1xuICAgICAgICAgIC8qKiBAdHlwZSB7QW5ub3RhdGVkRXJyb3J9ICovXG4gICAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKGAwIHdpZHRoIG1hdGNoIHJlZ2V4ICgke2xhbmd1YWdlTmFtZX0pYCk7XG4gICAgICAgICAgZXJyLmxhbmd1YWdlTmFtZSA9IGxhbmd1YWdlTmFtZTtcbiAgICAgICAgICBlcnIuYmFkUnVsZSA9IGxhc3RNYXRjaC5ydWxlO1xuICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cbiAgICAgIGxhc3RNYXRjaCA9IG1hdGNoO1xuXG4gICAgICBpZiAobWF0Y2gudHlwZSA9PT0gXCJiZWdpblwiKSB7XG4gICAgICAgIHJldHVybiBkb0JlZ2luTWF0Y2gobWF0Y2gpO1xuICAgICAgfSBlbHNlIGlmIChtYXRjaC50eXBlID09PSBcImlsbGVnYWxcIiAmJiAhaWdub3JlSWxsZWdhbHMpIHtcbiAgICAgICAgLy8gaWxsZWdhbCBtYXRjaCwgd2UgZG8gbm90IGNvbnRpbnVlIHByb2Nlc3NpbmdcbiAgICAgICAgLyoqIEB0eXBlIHtBbm5vdGF0ZWRFcnJvcn0gKi9cbiAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdJbGxlZ2FsIGxleGVtZSBcIicgKyBsZXhlbWUgKyAnXCIgZm9yIG1vZGUgXCInICsgKHRvcC5zY29wZSB8fCAnPHVubmFtZWQ+JykgKyAnXCInKTtcbiAgICAgICAgZXJyLm1vZGUgPSB0b3A7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH0gZWxzZSBpZiAobWF0Y2gudHlwZSA9PT0gXCJlbmRcIikge1xuICAgICAgICBjb25zdCBwcm9jZXNzZWQgPSBkb0VuZE1hdGNoKG1hdGNoKTtcbiAgICAgICAgaWYgKHByb2Nlc3NlZCAhPT0gTk9fTUFUQ0gpIHtcbiAgICAgICAgICByZXR1cm4gcHJvY2Vzc2VkO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIGVkZ2UgY2FzZSBmb3Igd2hlbiBpbGxlZ2FsIG1hdGNoZXMgJCAoZW5kIG9mIGxpbmUpIHdoaWNoIGlzIHRlY2huaWNhbGx5XG4gICAgICAvLyBhIDAgd2lkdGggbWF0Y2ggYnV0IG5vdCBhIGJlZ2luL2VuZCBtYXRjaCBzbyBpdCdzIG5vdCBjYXVnaHQgYnkgdGhlXG4gICAgICAvLyBmaXJzdCBoYW5kbGVyICh3aGVuIGlnbm9yZUlsbGVnYWxzIGlzIHRydWUpXG4gICAgICBpZiAobWF0Y2gudHlwZSA9PT0gXCJpbGxlZ2FsXCIgJiYgbGV4ZW1lID09PSBcIlwiKSB7XG4gICAgICAgIC8vIGFkdmFuY2Ugc28gd2UgYXJlbid0IHN0dWNrIGluIGFuIGluZmluaXRlIGxvb3BcbiAgICAgICAgbW9kZUJ1ZmZlciArPSBcIlxcblwiO1xuICAgICAgICByZXR1cm4gMTtcbiAgICAgIH1cblxuICAgICAgLy8gaW5maW5pdGUgbG9vcHMgYXJlIEJBRCwgdGhpcyBpcyBhIGxhc3QgZGl0Y2ggY2F0Y2ggYWxsLiBpZiB3ZSBoYXZlIGFcbiAgICAgIC8vIGRlY2VudCBudW1iZXIgb2YgaXRlcmF0aW9ucyB5ZXQgb3VyIGluZGV4IChjdXJzb3IgcG9zaXRpb24gaW4gb3VyXG4gICAgICAvLyBwYXJzaW5nKSBzdGlsbCAzeCBiZWhpbmQgb3VyIGluZGV4IHRoZW4gc29tZXRoaW5nIGlzIHZlcnkgd3JvbmdcbiAgICAgIC8vIHNvIHdlIGJhaWxcbiAgICAgIGlmIChpdGVyYXRpb25zID4gMTAwMDAwICYmIGl0ZXJhdGlvbnMgPiBtYXRjaC5pbmRleCAqIDMpIHtcbiAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdwb3RlbnRpYWwgaW5maW5pdGUgbG9vcCwgd2F5IG1vcmUgaXRlcmF0aW9ucyB0aGFuIG1hdGNoZXMnKTtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuXG4gICAgICAvKlxuICAgICAgV2h5IG1pZ2h0IGJlIGZpbmQgb3Vyc2VsdmVzIGhlcmU/ICBBbiBwb3RlbnRpYWwgZW5kIG1hdGNoIHRoYXQgd2FzXG4gICAgICB0cmlnZ2VyZWQgYnV0IGNvdWxkIG5vdCBiZSBjb21wbGV0ZWQuICBJRSwgYGRvRW5kTWF0Y2hgIHJldHVybmVkIE5PX01BVENILlxuICAgICAgKHRoaXMgY291bGQgYmUgYmVjYXVzZSBhIGNhbGxiYWNrIHJlcXVlc3RzIHRoZSBtYXRjaCBiZSBpZ25vcmVkLCBldGMpXG5cbiAgICAgIFRoaXMgY2F1c2VzIG5vIHJlYWwgaGFybSBvdGhlciB0aGFuIHN0b3BwaW5nIGEgZmV3IHRpbWVzIHRvbyBtYW55LlxuICAgICAgKi9cblxuICAgICAgbW9kZUJ1ZmZlciArPSBsZXhlbWU7XG4gICAgICByZXR1cm4gbGV4ZW1lLmxlbmd0aDtcbiAgICB9XG5cbiAgICBjb25zdCBsYW5ndWFnZSA9IGdldExhbmd1YWdlKGxhbmd1YWdlTmFtZSk7XG4gICAgaWYgKCFsYW5ndWFnZSkge1xuICAgICAgZXJyb3IoTEFOR1VBR0VfTk9UX0ZPVU5ELnJlcGxhY2UoXCJ7fVwiLCBsYW5ndWFnZU5hbWUpKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBsYW5ndWFnZTogXCInICsgbGFuZ3VhZ2VOYW1lICsgJ1wiJyk7XG4gICAgfVxuXG4gICAgY29uc3QgbWQgPSBjb21waWxlTGFuZ3VhZ2UobGFuZ3VhZ2UpO1xuICAgIGxldCByZXN1bHQgPSAnJztcbiAgICAvKiogQHR5cGUge0NvbXBpbGVkTW9kZX0gKi9cbiAgICBsZXQgdG9wID0gY29udGludWF0aW9uIHx8IG1kO1xuICAgIC8qKiBAdHlwZSBSZWNvcmQ8c3RyaW5nLENvbXBpbGVkTW9kZT4gKi9cbiAgICBjb25zdCBjb250aW51YXRpb25zID0ge307IC8vIGtlZXAgY29udGludWF0aW9ucyBmb3Igc3ViLWxhbmd1YWdlc1xuICAgIGNvbnN0IGVtaXR0ZXIgPSBuZXcgb3B0aW9ucy5fX2VtaXR0ZXIob3B0aW9ucyk7XG4gICAgcHJvY2Vzc0NvbnRpbnVhdGlvbnMoKTtcbiAgICBsZXQgbW9kZUJ1ZmZlciA9ICcnO1xuICAgIGxldCByZWxldmFuY2UgPSAwO1xuICAgIGxldCBpbmRleCA9IDA7XG4gICAgbGV0IGl0ZXJhdGlvbnMgPSAwO1xuICAgIGxldCByZXN1bWVTY2FuQXRTYW1lUG9zaXRpb24gPSBmYWxzZTtcblxuICAgIHRyeSB7XG4gICAgICBpZiAoIWxhbmd1YWdlLl9fZW1pdFRva2Vucykge1xuICAgICAgICB0b3AubWF0Y2hlci5jb25zaWRlckFsbCgpO1xuXG4gICAgICAgIGZvciAoOzspIHtcbiAgICAgICAgICBpdGVyYXRpb25zKys7XG4gICAgICAgICAgaWYgKHJlc3VtZVNjYW5BdFNhbWVQb3NpdGlvbikge1xuICAgICAgICAgICAgLy8gb25seSByZWdleGVzIG5vdCBtYXRjaGVkIHByZXZpb3VzbHkgd2lsbCBub3cgYmVcbiAgICAgICAgICAgIC8vIGNvbnNpZGVyZWQgZm9yIGEgcG90ZW50aWFsIG1hdGNoXG4gICAgICAgICAgICByZXN1bWVTY2FuQXRTYW1lUG9zaXRpb24gPSBmYWxzZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG9wLm1hdGNoZXIuY29uc2lkZXJBbGwoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdG9wLm1hdGNoZXIubGFzdEluZGV4ID0gaW5kZXg7XG5cbiAgICAgICAgICBjb25zdCBtYXRjaCA9IHRvcC5tYXRjaGVyLmV4ZWMoY29kZVRvSGlnaGxpZ2h0KTtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIm1hdGNoXCIsIG1hdGNoWzBdLCBtYXRjaC5ydWxlICYmIG1hdGNoLnJ1bGUuYmVnaW4pXG5cbiAgICAgICAgICBpZiAoIW1hdGNoKSBicmVhaztcblxuICAgICAgICAgIGNvbnN0IGJlZm9yZU1hdGNoID0gY29kZVRvSGlnaGxpZ2h0LnN1YnN0cmluZyhpbmRleCwgbWF0Y2guaW5kZXgpO1xuICAgICAgICAgIGNvbnN0IHByb2Nlc3NlZENvdW50ID0gcHJvY2Vzc0xleGVtZShiZWZvcmVNYXRjaCwgbWF0Y2gpO1xuICAgICAgICAgIGluZGV4ID0gbWF0Y2guaW5kZXggKyBwcm9jZXNzZWRDb3VudDtcbiAgICAgICAgfVxuICAgICAgICBwcm9jZXNzTGV4ZW1lKGNvZGVUb0hpZ2hsaWdodC5zdWJzdHJpbmcoaW5kZXgpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxhbmd1YWdlLl9fZW1pdFRva2Vucyhjb2RlVG9IaWdobGlnaHQsIGVtaXR0ZXIpO1xuICAgICAgfVxuXG4gICAgICBlbWl0dGVyLmZpbmFsaXplKCk7XG4gICAgICByZXN1bHQgPSBlbWl0dGVyLnRvSFRNTCgpO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBsYW5ndWFnZTogbGFuZ3VhZ2VOYW1lLFxuICAgICAgICB2YWx1ZTogcmVzdWx0LFxuICAgICAgICByZWxldmFuY2UsXG4gICAgICAgIGlsbGVnYWw6IGZhbHNlLFxuICAgICAgICBfZW1pdHRlcjogZW1pdHRlcixcbiAgICAgICAgX3RvcDogdG9wXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgaWYgKGVyci5tZXNzYWdlICYmIGVyci5tZXNzYWdlLmluY2x1ZGVzKCdJbGxlZ2FsJykpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBsYW5ndWFnZTogbGFuZ3VhZ2VOYW1lLFxuICAgICAgICAgIHZhbHVlOiBlc2NhcGUoY29kZVRvSGlnaGxpZ2h0KSxcbiAgICAgICAgICBpbGxlZ2FsOiB0cnVlLFxuICAgICAgICAgIHJlbGV2YW5jZTogMCxcbiAgICAgICAgICBfaWxsZWdhbEJ5OiB7XG4gICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSxcbiAgICAgICAgICAgIGluZGV4LFxuICAgICAgICAgICAgY29udGV4dDogY29kZVRvSGlnaGxpZ2h0LnNsaWNlKGluZGV4IC0gMTAwLCBpbmRleCArIDEwMCksXG4gICAgICAgICAgICBtb2RlOiBlcnIubW9kZSxcbiAgICAgICAgICAgIHJlc3VsdFNvRmFyOiByZXN1bHRcbiAgICAgICAgICB9LFxuICAgICAgICAgIF9lbWl0dGVyOiBlbWl0dGVyXG4gICAgICAgIH07XG4gICAgICB9IGVsc2UgaWYgKFNBRkVfTU9ERSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGxhbmd1YWdlOiBsYW5ndWFnZU5hbWUsXG4gICAgICAgICAgdmFsdWU6IGVzY2FwZShjb2RlVG9IaWdobGlnaHQpLFxuICAgICAgICAgIGlsbGVnYWw6IGZhbHNlLFxuICAgICAgICAgIHJlbGV2YW5jZTogMCxcbiAgICAgICAgICBlcnJvclJhaXNlZDogZXJyLFxuICAgICAgICAgIF9lbWl0dGVyOiBlbWl0dGVyLFxuICAgICAgICAgIF90b3A6IHRvcFxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiByZXR1cm5zIGEgdmFsaWQgaGlnaGxpZ2h0IHJlc3VsdCwgd2l0aG91dCBhY3R1YWxseSBkb2luZyBhbnkgYWN0dWFsIHdvcmssXG4gICAqIGF1dG8gaGlnaGxpZ2h0IHN0YXJ0cyB3aXRoIHRoaXMgYW5kIGl0J3MgcG9zc2libGUgZm9yIHNtYWxsIHNuaXBwZXRzIHRoYXRcbiAgICogYXV0by1kZXRlY3Rpb24gbWF5IG5vdCBmaW5kIGEgYmV0dGVyIG1hdGNoXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlXG4gICAqIEByZXR1cm5zIHtIaWdobGlnaHRSZXN1bHR9XG4gICAqL1xuICBmdW5jdGlvbiBqdXN0VGV4dEhpZ2hsaWdodFJlc3VsdChjb2RlKSB7XG4gICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgdmFsdWU6IGVzY2FwZShjb2RlKSxcbiAgICAgIGlsbGVnYWw6IGZhbHNlLFxuICAgICAgcmVsZXZhbmNlOiAwLFxuICAgICAgX3RvcDogUExBSU5URVhUX0xBTkdVQUdFLFxuICAgICAgX2VtaXR0ZXI6IG5ldyBvcHRpb25zLl9fZW1pdHRlcihvcHRpb25zKVxuICAgIH07XG4gICAgcmVzdWx0Ll9lbWl0dGVyLmFkZFRleHQoY29kZSk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICBIaWdobGlnaHRpbmcgd2l0aCBsYW5ndWFnZSBkZXRlY3Rpb24uIEFjY2VwdHMgYSBzdHJpbmcgd2l0aCB0aGUgY29kZSB0b1xuICBoaWdobGlnaHQuIFJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuXG4gIC0gbGFuZ3VhZ2UgKGRldGVjdGVkIGxhbmd1YWdlKVxuICAtIHJlbGV2YW5jZSAoaW50KVxuICAtIHZhbHVlIChhbiBIVE1MIHN0cmluZyB3aXRoIGhpZ2hsaWdodGluZyBtYXJrdXApXG4gIC0gc2Vjb25kQmVzdCAob2JqZWN0IHdpdGggdGhlIHNhbWUgc3RydWN0dXJlIGZvciBzZWNvbmQtYmVzdCBoZXVyaXN0aWNhbGx5XG4gICAgZGV0ZWN0ZWQgbGFuZ3VhZ2UsIG1heSBiZSBhYnNlbnQpXG5cbiAgICBAcGFyYW0ge3N0cmluZ30gY29kZVxuICAgIEBwYXJhbSB7QXJyYXk8c3RyaW5nPn0gW2xhbmd1YWdlU3Vic2V0XVxuICAgIEByZXR1cm5zIHtBdXRvSGlnaGxpZ2h0UmVzdWx0fVxuICAqL1xuICBmdW5jdGlvbiBoaWdobGlnaHRBdXRvKGNvZGUsIGxhbmd1YWdlU3Vic2V0KSB7XG4gICAgbGFuZ3VhZ2VTdWJzZXQgPSBsYW5ndWFnZVN1YnNldCB8fCBvcHRpb25zLmxhbmd1YWdlcyB8fCBPYmplY3Qua2V5cyhsYW5ndWFnZXMpO1xuICAgIGNvbnN0IHBsYWludGV4dCA9IGp1c3RUZXh0SGlnaGxpZ2h0UmVzdWx0KGNvZGUpO1xuXG4gICAgY29uc3QgcmVzdWx0cyA9IGxhbmd1YWdlU3Vic2V0LmZpbHRlcihnZXRMYW5ndWFnZSkuZmlsdGVyKGF1dG9EZXRlY3Rpb24pLm1hcChuYW1lID0+XG4gICAgICBfaGlnaGxpZ2h0KG5hbWUsIGNvZGUsIGZhbHNlKVxuICAgICk7XG4gICAgcmVzdWx0cy51bnNoaWZ0KHBsYWludGV4dCk7IC8vIHBsYWludGV4dCBpcyBhbHdheXMgYW4gb3B0aW9uXG5cbiAgICBjb25zdCBzb3J0ZWQgPSByZXN1bHRzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIC8vIHNvcnQgYmFzZSBvbiByZWxldmFuY2VcbiAgICAgIGlmIChhLnJlbGV2YW5jZSAhPT0gYi5yZWxldmFuY2UpIHJldHVybiBiLnJlbGV2YW5jZSAtIGEucmVsZXZhbmNlO1xuXG4gICAgICAvLyBhbHdheXMgYXdhcmQgdGhlIHRpZSB0byB0aGUgYmFzZSBsYW5ndWFnZVxuICAgICAgLy8gaWUgaWYgQysrIGFuZCBBcmR1aW5vIGFyZSB0aWVkLCBpdCdzIG1vcmUgbGlrZWx5IHRvIGJlIEMrK1xuICAgICAgaWYgKGEubGFuZ3VhZ2UgJiYgYi5sYW5ndWFnZSkge1xuICAgICAgICBpZiAoZ2V0TGFuZ3VhZ2UoYS5sYW5ndWFnZSkuc3VwZXJzZXRPZiA9PT0gYi5sYW5ndWFnZSkge1xuICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9IGVsc2UgaWYgKGdldExhbmd1YWdlKGIubGFuZ3VhZ2UpLnN1cGVyc2V0T2YgPT09IGEubGFuZ3VhZ2UpIHtcbiAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gb3RoZXJ3aXNlIHNheSB0aGV5IGFyZSBlcXVhbCwgd2hpY2ggaGFzIHRoZSBlZmZlY3Qgb2Ygc29ydGluZyBvblxuICAgICAgLy8gcmVsZXZhbmNlIHdoaWxlIHByZXNlcnZpbmcgdGhlIG9yaWdpbmFsIG9yZGVyaW5nIC0gd2hpY2ggaXMgaG93IHRpZXNcbiAgICAgIC8vIGhhdmUgaGlzdG9yaWNhbGx5IGJlZW4gc2V0dGxlZCwgaWUgdGhlIGxhbmd1YWdlIHRoYXQgY29tZXMgZmlyc3QgYWx3YXlzXG4gICAgICAvLyB3aW5zIGluIHRoZSBjYXNlIG9mIGEgdGllXG4gICAgICByZXR1cm4gMDtcbiAgICB9KTtcblxuICAgIGNvbnN0IFtiZXN0LCBzZWNvbmRCZXN0XSA9IHNvcnRlZDtcblxuICAgIC8qKiBAdHlwZSB7QXV0b0hpZ2hsaWdodFJlc3VsdH0gKi9cbiAgICBjb25zdCByZXN1bHQgPSBiZXN0O1xuICAgIHJlc3VsdC5zZWNvbmRCZXN0ID0gc2Vjb25kQmVzdDtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogQnVpbGRzIG5ldyBjbGFzcyBuYW1lIGZvciBibG9jayBnaXZlbiB0aGUgbGFuZ3VhZ2UgbmFtZVxuICAgKlxuICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY3VycmVudExhbmddXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcmVzdWx0TGFuZ11cbiAgICovXG4gIGZ1bmN0aW9uIHVwZGF0ZUNsYXNzTmFtZShlbGVtZW50LCBjdXJyZW50TGFuZywgcmVzdWx0TGFuZykge1xuICAgIGNvbnN0IGxhbmd1YWdlID0gKGN1cnJlbnRMYW5nICYmIGFsaWFzZXNbY3VycmVudExhbmddKSB8fCByZXN1bHRMYW5nO1xuXG4gICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiaGxqc1wiKTtcbiAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoYGxhbmd1YWdlLSR7bGFuZ3VhZ2V9YCk7XG4gIH1cblxuICAvKipcbiAgICogQXBwbGllcyBoaWdobGlnaHRpbmcgdG8gYSBET00gbm9kZSBjb250YWluaW5nIGNvZGUuXG4gICAqXG4gICAqIEBwYXJhbSB7SGlnaGxpZ2h0ZWRIVE1MRWxlbWVudH0gZWxlbWVudCAtIHRoZSBIVE1MIGVsZW1lbnQgdG8gaGlnaGxpZ2h0XG4gICovXG4gIGZ1bmN0aW9uIGhpZ2hsaWdodEVsZW1lbnQoZWxlbWVudCkge1xuICAgIC8qKiBAdHlwZSBIVE1MRWxlbWVudCAqL1xuICAgIGxldCBub2RlID0gbnVsbDtcbiAgICBjb25zdCBsYW5ndWFnZSA9IGJsb2NrTGFuZ3VhZ2UoZWxlbWVudCk7XG5cbiAgICBpZiAoc2hvdWxkTm90SGlnaGxpZ2h0KGxhbmd1YWdlKSkgcmV0dXJuO1xuXG4gICAgZmlyZShcImJlZm9yZTpoaWdobGlnaHRFbGVtZW50XCIsXG4gICAgICB7IGVsOiBlbGVtZW50LCBsYW5ndWFnZSB9KTtcblxuICAgIGlmIChlbGVtZW50LmRhdGFzZXQuaGlnaGxpZ2h0ZWQpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiRWxlbWVudCBwcmV2aW91c2x5IGhpZ2hsaWdodGVkLiBUbyBoaWdobGlnaHQgYWdhaW4sIGZpcnN0IHVuc2V0IGBkYXRhc2V0LmhpZ2hsaWdodGVkYC5cIiwgZWxlbWVudCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gd2Ugc2hvdWxkIGJlIGFsbCB0ZXh0LCBubyBjaGlsZCBub2RlcyAodW5lc2NhcGVkIEhUTUwpIC0gdGhpcyBpcyBwb3NzaWJseVxuICAgIC8vIGFuIEhUTUwgaW5qZWN0aW9uIGF0dGFjayAtIGl0J3MgbGlrZWx5IHRvbyBsYXRlIGlmIHRoaXMgaXMgYWxyZWFkeSBpblxuICAgIC8vIHByb2R1Y3Rpb24gKHRoZSBjb2RlIGhhcyBsaWtlbHkgYWxyZWFkeSBkb25lIGl0cyBkYW1hZ2UgYnkgdGhlIHRpbWVcbiAgICAvLyB3ZSdyZSBzZWVpbmcgaXQpLi4uIGJ1dCB3ZSB5ZWxsIGxvdWRseSBhYm91dCB0aGlzIHNvIHRoYXQgaG9wZWZ1bGx5IGl0J3NcbiAgICAvLyBtb3JlIGxpa2VseSB0byBiZSBjYXVnaHQgaW4gZGV2ZWxvcG1lbnQgYmVmb3JlIG1ha2luZyBpdCB0byBwcm9kdWN0aW9uXG4gICAgaWYgKGVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgICAgaWYgKCFvcHRpb25zLmlnbm9yZVVuZXNjYXBlZEhUTUwpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiT25lIG9mIHlvdXIgY29kZSBibG9ja3MgaW5jbHVkZXMgdW5lc2NhcGVkIEhUTUwuIFRoaXMgaXMgYSBwb3RlbnRpYWxseSBzZXJpb3VzIHNlY3VyaXR5IHJpc2suXCIpO1xuICAgICAgICBjb25zb2xlLndhcm4oXCJodHRwczovL2dpdGh1Yi5jb20vaGlnaGxpZ2h0anMvaGlnaGxpZ2h0LmpzL3dpa2kvc2VjdXJpdHlcIik7XG4gICAgICAgIGNvbnNvbGUud2FybihcIlRoZSBlbGVtZW50IHdpdGggdW5lc2NhcGVkIEhUTUw6XCIpO1xuICAgICAgICBjb25zb2xlLndhcm4oZWxlbWVudCk7XG4gICAgICB9XG4gICAgICBpZiAob3B0aW9ucy50aHJvd1VuZXNjYXBlZEhUTUwpIHtcbiAgICAgICAgY29uc3QgZXJyID0gbmV3IEhUTUxJbmplY3Rpb25FcnJvcihcbiAgICAgICAgICBcIk9uZSBvZiB5b3VyIGNvZGUgYmxvY2tzIGluY2x1ZGVzIHVuZXNjYXBlZCBIVE1MLlwiLFxuICAgICAgICAgIGVsZW1lbnQuaW5uZXJIVE1MXG4gICAgICAgICk7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBub2RlID0gZWxlbWVudDtcbiAgICBjb25zdCB0ZXh0ID0gbm9kZS50ZXh0Q29udGVudDtcbiAgICBjb25zdCByZXN1bHQgPSBsYW5ndWFnZSA/IGhpZ2hsaWdodCh0ZXh0LCB7IGxhbmd1YWdlLCBpZ25vcmVJbGxlZ2FsczogdHJ1ZSB9KSA6IGhpZ2hsaWdodEF1dG8odGV4dCk7XG5cbiAgICBlbGVtZW50LmlubmVySFRNTCA9IHJlc3VsdC52YWx1ZTtcbiAgICBlbGVtZW50LmRhdGFzZXQuaGlnaGxpZ2h0ZWQgPSBcInllc1wiO1xuICAgIHVwZGF0ZUNsYXNzTmFtZShlbGVtZW50LCBsYW5ndWFnZSwgcmVzdWx0Lmxhbmd1YWdlKTtcbiAgICBlbGVtZW50LnJlc3VsdCA9IHtcbiAgICAgIGxhbmd1YWdlOiByZXN1bHQubGFuZ3VhZ2UsXG4gICAgICAvLyBUT0RPOiByZW1vdmUgd2l0aCB2ZXJzaW9uIDExLjBcbiAgICAgIHJlOiByZXN1bHQucmVsZXZhbmNlLFxuICAgICAgcmVsZXZhbmNlOiByZXN1bHQucmVsZXZhbmNlXG4gICAgfTtcbiAgICBpZiAocmVzdWx0LnNlY29uZEJlc3QpIHtcbiAgICAgIGVsZW1lbnQuc2Vjb25kQmVzdCA9IHtcbiAgICAgICAgbGFuZ3VhZ2U6IHJlc3VsdC5zZWNvbmRCZXN0Lmxhbmd1YWdlLFxuICAgICAgICByZWxldmFuY2U6IHJlc3VsdC5zZWNvbmRCZXN0LnJlbGV2YW5jZVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBmaXJlKFwiYWZ0ZXI6aGlnaGxpZ2h0RWxlbWVudFwiLCB7IGVsOiBlbGVtZW50LCByZXN1bHQsIHRleHQgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyBoaWdobGlnaHQuanMgZ2xvYmFsIG9wdGlvbnMgd2l0aCB0aGUgcGFzc2VkIG9wdGlvbnNcbiAgICpcbiAgICogQHBhcmFtIHtQYXJ0aWFsPEhMSlNPcHRpb25zPn0gdXNlck9wdGlvbnNcbiAgICovXG4gIGZ1bmN0aW9uIGNvbmZpZ3VyZSh1c2VyT3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBpbmhlcml0KG9wdGlvbnMsIHVzZXJPcHRpb25zKTtcbiAgfVxuXG4gIC8vIFRPRE86IHJlbW92ZSB2MTIsIGRlcHJlY2F0ZWRcbiAgY29uc3QgaW5pdEhpZ2hsaWdodGluZyA9ICgpID0+IHtcbiAgICBoaWdobGlnaHRBbGwoKTtcbiAgICBkZXByZWNhdGVkKFwiMTAuNi4wXCIsIFwiaW5pdEhpZ2hsaWdodGluZygpIGRlcHJlY2F0ZWQuICBVc2UgaGlnaGxpZ2h0QWxsKCkgbm93LlwiKTtcbiAgfTtcblxuICAvLyBUT0RPOiByZW1vdmUgdjEyLCBkZXByZWNhdGVkXG4gIGZ1bmN0aW9uIGluaXRIaWdobGlnaHRpbmdPbkxvYWQoKSB7XG4gICAgaGlnaGxpZ2h0QWxsKCk7XG4gICAgZGVwcmVjYXRlZChcIjEwLjYuMFwiLCBcImluaXRIaWdobGlnaHRpbmdPbkxvYWQoKSBkZXByZWNhdGVkLiAgVXNlIGhpZ2hsaWdodEFsbCgpIG5vdy5cIik7XG4gIH1cblxuICBsZXQgd2FudHNIaWdobGlnaHQgPSBmYWxzZTtcblxuICAvKipcbiAgICogYXV0by1oaWdobGlnaHRzIGFsbCBwcmU+Y29kZSBlbGVtZW50cyBvbiB0aGUgcGFnZVxuICAgKi9cbiAgZnVuY3Rpb24gaGlnaGxpZ2h0QWxsKCkge1xuICAgIGZ1bmN0aW9uIGJvb3QoKSB7XG4gICAgICAvLyBpZiBhIGhpZ2hsaWdodCB3YXMgcmVxdWVzdGVkIGJlZm9yZSBET00gd2FzIGxvYWRlZCwgZG8gbm93XG4gICAgICBoaWdobGlnaHRBbGwoKTtcbiAgICB9XG5cbiAgICAvLyBpZiB3ZSBhcmUgY2FsbGVkIHRvbyBlYXJseSBpbiB0aGUgbG9hZGluZyBwcm9jZXNzXG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09IFwibG9hZGluZ1wiKSB7XG4gICAgICAvLyBtYWtlIHN1cmUgdGhlIGV2ZW50IGxpc3RlbmVyIGlzIG9ubHkgYWRkZWQgb25jZVxuICAgICAgaWYgKCF3YW50c0hpZ2hsaWdodCkge1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGJvb3QsIGZhbHNlKTtcbiAgICAgIH1cbiAgICAgIHdhbnRzSGlnaGxpZ2h0ID0gdHJ1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBibG9ja3MgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKG9wdGlvbnMuY3NzU2VsZWN0b3IpO1xuICAgIGJsb2Nrcy5mb3JFYWNoKGhpZ2hsaWdodEVsZW1lbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgbGFuZ3VhZ2UgZ3JhbW1hciBtb2R1bGVcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGxhbmd1YWdlTmFtZVxuICAgKiBAcGFyYW0ge0xhbmd1YWdlRm59IGxhbmd1YWdlRGVmaW5pdGlvblxuICAgKi9cbiAgZnVuY3Rpb24gcmVnaXN0ZXJMYW5ndWFnZShsYW5ndWFnZU5hbWUsIGxhbmd1YWdlRGVmaW5pdGlvbikge1xuICAgIGxldCBsYW5nID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgbGFuZyA9IGxhbmd1YWdlRGVmaW5pdGlvbihobGpzKTtcbiAgICB9IGNhdGNoIChlcnJvciQxKSB7XG4gICAgICBlcnJvcihcIkxhbmd1YWdlIGRlZmluaXRpb24gZm9yICd7fScgY291bGQgbm90IGJlIHJlZ2lzdGVyZWQuXCIucmVwbGFjZShcInt9XCIsIGxhbmd1YWdlTmFtZSkpO1xuICAgICAgLy8gaGFyZCBvciBzb2Z0IGVycm9yXG4gICAgICBpZiAoIVNBRkVfTU9ERSkgeyB0aHJvdyBlcnJvciQxOyB9IGVsc2UgeyBlcnJvcihlcnJvciQxKTsgfVxuICAgICAgLy8gbGFuZ3VhZ2VzIHRoYXQgaGF2ZSBzZXJpb3VzIGVycm9ycyBhcmUgcmVwbGFjZWQgd2l0aCBlc3NlbnRpYWxseSBhXG4gICAgICAvLyBcInBsYWludGV4dFwiIHN0YW5kLWluIHNvIHRoYXQgdGhlIGNvZGUgYmxvY2tzIHdpbGwgc3RpbGwgZ2V0IG5vcm1hbFxuICAgICAgLy8gY3NzIGNsYXNzZXMgYXBwbGllZCB0byB0aGVtIC0gYW5kIG9uZSBiYWQgbGFuZ3VhZ2Ugd29uJ3QgYnJlYWsgdGhlXG4gICAgICAvLyBlbnRpcmUgaGlnaGxpZ2h0ZXJcbiAgICAgIGxhbmcgPSBQTEFJTlRFWFRfTEFOR1VBR0U7XG4gICAgfVxuICAgIC8vIGdpdmUgaXQgYSB0ZW1wb3JhcnkgbmFtZSBpZiBpdCBkb2Vzbid0IGhhdmUgb25lIGluIHRoZSBtZXRhLWRhdGFcbiAgICBpZiAoIWxhbmcubmFtZSkgbGFuZy5uYW1lID0gbGFuZ3VhZ2VOYW1lO1xuICAgIGxhbmd1YWdlc1tsYW5ndWFnZU5hbWVdID0gbGFuZztcbiAgICBsYW5nLnJhd0RlZmluaXRpb24gPSBsYW5ndWFnZURlZmluaXRpb24uYmluZChudWxsLCBobGpzKTtcblxuICAgIGlmIChsYW5nLmFsaWFzZXMpIHtcbiAgICAgIHJlZ2lzdGVyQWxpYXNlcyhsYW5nLmFsaWFzZXMsIHsgbGFuZ3VhZ2VOYW1lIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYSBsYW5ndWFnZSBncmFtbWFyIG1vZHVsZVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2VOYW1lXG4gICAqL1xuICBmdW5jdGlvbiB1bnJlZ2lzdGVyTGFuZ3VhZ2UobGFuZ3VhZ2VOYW1lKSB7XG4gICAgZGVsZXRlIGxhbmd1YWdlc1tsYW5ndWFnZU5hbWVdO1xuICAgIGZvciAoY29uc3QgYWxpYXMgb2YgT2JqZWN0LmtleXMoYWxpYXNlcykpIHtcbiAgICAgIGlmIChhbGlhc2VzW2FsaWFzXSA9PT0gbGFuZ3VhZ2VOYW1lKSB7XG4gICAgICAgIGRlbGV0ZSBhbGlhc2VzW2FsaWFzXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMge3N0cmluZ1tdfSBMaXN0IG9mIGxhbmd1YWdlIGludGVybmFsIG5hbWVzXG4gICAqL1xuICBmdW5jdGlvbiBsaXN0TGFuZ3VhZ2VzKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhsYW5ndWFnZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIC0gbmFtZSBvZiB0aGUgbGFuZ3VhZ2UgdG8gcmV0cmlldmVcbiAgICogQHJldHVybnMge0xhbmd1YWdlIHwgdW5kZWZpbmVkfVxuICAgKi9cbiAgZnVuY3Rpb24gZ2V0TGFuZ3VhZ2UobmFtZSkge1xuICAgIG5hbWUgPSAobmFtZSB8fCAnJykudG9Mb3dlckNhc2UoKTtcbiAgICByZXR1cm4gbGFuZ3VhZ2VzW25hbWVdIHx8IGxhbmd1YWdlc1thbGlhc2VzW25hbWVdXTtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xzdHJpbmdbXX0gYWxpYXNMaXN0IC0gc2luZ2xlIGFsaWFzIG9yIGxpc3Qgb2YgYWxpYXNlc1xuICAgKiBAcGFyYW0ge3tsYW5ndWFnZU5hbWU6IHN0cmluZ319IG9wdHNcbiAgICovXG4gIGZ1bmN0aW9uIHJlZ2lzdGVyQWxpYXNlcyhhbGlhc0xpc3QsIHsgbGFuZ3VhZ2VOYW1lIH0pIHtcbiAgICBpZiAodHlwZW9mIGFsaWFzTGlzdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGFsaWFzTGlzdCA9IFthbGlhc0xpc3RdO1xuICAgIH1cbiAgICBhbGlhc0xpc3QuZm9yRWFjaChhbGlhcyA9PiB7IGFsaWFzZXNbYWxpYXMudG9Mb3dlckNhc2UoKV0gPSBsYW5ndWFnZU5hbWU7IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgYSBnaXZlbiBsYW5ndWFnZSBoYXMgYXV0by1kZXRlY3Rpb24gZW5hYmxlZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIG5hbWUgb2YgdGhlIGxhbmd1YWdlXG4gICAqL1xuICBmdW5jdGlvbiBhdXRvRGV0ZWN0aW9uKG5hbWUpIHtcbiAgICBjb25zdCBsYW5nID0gZ2V0TGFuZ3VhZ2UobmFtZSk7XG4gICAgcmV0dXJuIGxhbmcgJiYgIWxhbmcuZGlzYWJsZUF1dG9kZXRlY3Q7XG4gIH1cblxuICAvKipcbiAgICogVXBncmFkZXMgdGhlIG9sZCBoaWdobGlnaHRCbG9jayBwbHVnaW5zIHRvIHRoZSBuZXdcbiAgICogaGlnaGxpZ2h0RWxlbWVudCBBUElcbiAgICogQHBhcmFtIHtITEpTUGx1Z2lufSBwbHVnaW5cbiAgICovXG4gIGZ1bmN0aW9uIHVwZ3JhZGVQbHVnaW5BUEkocGx1Z2luKSB7XG4gICAgLy8gVE9ETzogcmVtb3ZlIHdpdGggdjEyXG4gICAgaWYgKHBsdWdpbltcImJlZm9yZTpoaWdobGlnaHRCbG9ja1wiXSAmJiAhcGx1Z2luW1wiYmVmb3JlOmhpZ2hsaWdodEVsZW1lbnRcIl0pIHtcbiAgICAgIHBsdWdpbltcImJlZm9yZTpoaWdobGlnaHRFbGVtZW50XCJdID0gKGRhdGEpID0+IHtcbiAgICAgICAgcGx1Z2luW1wiYmVmb3JlOmhpZ2hsaWdodEJsb2NrXCJdKFxuICAgICAgICAgIE9iamVjdC5hc3NpZ24oeyBibG9jazogZGF0YS5lbCB9LCBkYXRhKVxuICAgICAgICApO1xuICAgICAgfTtcbiAgICB9XG4gICAgaWYgKHBsdWdpbltcImFmdGVyOmhpZ2hsaWdodEJsb2NrXCJdICYmICFwbHVnaW5bXCJhZnRlcjpoaWdobGlnaHRFbGVtZW50XCJdKSB7XG4gICAgICBwbHVnaW5bXCJhZnRlcjpoaWdobGlnaHRFbGVtZW50XCJdID0gKGRhdGEpID0+IHtcbiAgICAgICAgcGx1Z2luW1wiYWZ0ZXI6aGlnaGxpZ2h0QmxvY2tcIl0oXG4gICAgICAgICAgT2JqZWN0LmFzc2lnbih7IGJsb2NrOiBkYXRhLmVsIH0sIGRhdGEpXG4gICAgICAgICk7XG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0hMSlNQbHVnaW59IHBsdWdpblxuICAgKi9cbiAgZnVuY3Rpb24gYWRkUGx1Z2luKHBsdWdpbikge1xuICAgIHVwZ3JhZGVQbHVnaW5BUEkocGx1Z2luKTtcbiAgICBwbHVnaW5zLnB1c2gocGx1Z2luKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0hMSlNQbHVnaW59IHBsdWdpblxuICAgKi9cbiAgZnVuY3Rpb24gcmVtb3ZlUGx1Z2luKHBsdWdpbikge1xuICAgIGNvbnN0IGluZGV4ID0gcGx1Z2lucy5pbmRleE9mKHBsdWdpbik7XG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgcGx1Z2lucy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0ge1BsdWdpbkV2ZW50fSBldmVudFxuICAgKiBAcGFyYW0ge2FueX0gYXJnc1xuICAgKi9cbiAgZnVuY3Rpb24gZmlyZShldmVudCwgYXJncykge1xuICAgIGNvbnN0IGNiID0gZXZlbnQ7XG4gICAgcGx1Z2lucy5mb3JFYWNoKGZ1bmN0aW9uKHBsdWdpbikge1xuICAgICAgaWYgKHBsdWdpbltjYl0pIHtcbiAgICAgICAgcGx1Z2luW2NiXShhcmdzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBERVBSRUNBVEVEXG4gICAqIEBwYXJhbSB7SGlnaGxpZ2h0ZWRIVE1MRWxlbWVudH0gZWxcbiAgICovXG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZUhpZ2hsaWdodEJsb2NrKGVsKSB7XG4gICAgZGVwcmVjYXRlZChcIjEwLjcuMFwiLCBcImhpZ2hsaWdodEJsb2NrIHdpbGwgYmUgcmVtb3ZlZCBlbnRpcmVseSBpbiB2MTIuMFwiKTtcbiAgICBkZXByZWNhdGVkKFwiMTAuNy4wXCIsIFwiUGxlYXNlIHVzZSBoaWdobGlnaHRFbGVtZW50IG5vdy5cIik7XG5cbiAgICByZXR1cm4gaGlnaGxpZ2h0RWxlbWVudChlbCk7XG4gIH1cblxuICAvKiBJbnRlcmZhY2UgZGVmaW5pdGlvbiAqL1xuICBPYmplY3QuYXNzaWduKGhsanMsIHtcbiAgICBoaWdobGlnaHQsXG4gICAgaGlnaGxpZ2h0QXV0byxcbiAgICBoaWdobGlnaHRBbGwsXG4gICAgaGlnaGxpZ2h0RWxlbWVudCxcbiAgICAvLyBUT0RPOiBSZW1vdmUgd2l0aCB2MTIgQVBJXG4gICAgaGlnaGxpZ2h0QmxvY2s6IGRlcHJlY2F0ZUhpZ2hsaWdodEJsb2NrLFxuICAgIGNvbmZpZ3VyZSxcbiAgICBpbml0SGlnaGxpZ2h0aW5nLFxuICAgIGluaXRIaWdobGlnaHRpbmdPbkxvYWQsXG4gICAgcmVnaXN0ZXJMYW5ndWFnZSxcbiAgICB1bnJlZ2lzdGVyTGFuZ3VhZ2UsXG4gICAgbGlzdExhbmd1YWdlcyxcbiAgICBnZXRMYW5ndWFnZSxcbiAgICByZWdpc3RlckFsaWFzZXMsXG4gICAgYXV0b0RldGVjdGlvbixcbiAgICBpbmhlcml0LFxuICAgIGFkZFBsdWdpbixcbiAgICByZW1vdmVQbHVnaW5cbiAgfSk7XG5cbiAgaGxqcy5kZWJ1Z01vZGUgPSBmdW5jdGlvbigpIHsgU0FGRV9NT0RFID0gZmFsc2U7IH07XG4gIGhsanMuc2FmZU1vZGUgPSBmdW5jdGlvbigpIHsgU0FGRV9NT0RFID0gdHJ1ZTsgfTtcbiAgaGxqcy52ZXJzaW9uU3RyaW5nID0gdmVyc2lvbjtcblxuICBobGpzLnJlZ2V4ID0ge1xuICAgIGNvbmNhdDogY29uY2F0LFxuICAgIGxvb2thaGVhZDogbG9va2FoZWFkLFxuICAgIGVpdGhlcjogZWl0aGVyLFxuICAgIG9wdGlvbmFsOiBvcHRpb25hbCxcbiAgICBhbnlOdW1iZXJPZlRpbWVzOiBhbnlOdW1iZXJPZlRpbWVzXG4gIH07XG5cbiAgZm9yIChjb25zdCBrZXkgaW4gTU9ERVMpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgaWYgKHR5cGVvZiBNT0RFU1trZXldID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBkZWVwRnJlZXplKE1PREVTW2tleV0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIG1lcmdlIGFsbCB0aGUgbW9kZXMvcmVnZXhlcyBpbnRvIG91ciBtYWluIG9iamVjdFxuICBPYmplY3QuYXNzaWduKGhsanMsIE1PREVTKTtcblxuICByZXR1cm4gaGxqcztcbn07XG5cbi8vIE90aGVyIG5hbWVzIGZvciB0aGUgdmFyaWFibGUgbWF5IGJyZWFrIGJ1aWxkIHNjcmlwdFxuY29uc3QgaGlnaGxpZ2h0ID0gSExKUyh7fSk7XG5cbi8vIHJldHVybnMgYSBuZXcgaW5zdGFuY2Ugb2YgdGhlIGhpZ2hsaWdodGVyIHRvIGJlIHVzZWQgZm9yIGV4dGVuc2lvbnNcbi8vIGNoZWNrIGh0dHBzOi8vZ2l0aHViLmNvbS93b29vcm0vbG93bGlnaHQvaXNzdWVzLzQ3XG5oaWdobGlnaHQubmV3SW5zdGFuY2UgPSAoKSA9PiBITEpTKHt9KTtcblxubW9kdWxlLmV4cG9ydHMgPSBoaWdobGlnaHQ7XG5oaWdobGlnaHQuSGlnaGxpZ2h0SlMgPSBoaWdobGlnaHQ7XG5oaWdobGlnaHQuZGVmYXVsdCA9IGhpZ2hsaWdodDtcbiIsICIvKipcbiAqIENvZGVGbG93IHdlYnZpZXcgcHJvdG9jb2wuXG4gKlxuICogVGhlIGV4dGVuc2lvbiBob3N0IGFuZCB0aGUgd2VidmlldyBhcmUgc2VwYXJhdGUgSmF2YVNjcmlwdCBjb250ZXh0cy4gRXZlcnlcbiAqIG1lc3NhZ2UgdGhhdCBjcm9zc2VzIHRoYXQgYm91bmRhcnkgbXVzdCBwYXNzIHRocm91Z2ggdGhpcyBtb2R1bGUgc28gdGhhdCBhXG4gKiBzaW5nbGUsIHZlcnNpb25lZCBjb250cmFjdCBkZWNpZGVzIHdoYXQgaXMgbGVnYWwuXG4gKlxuICogVGhpcyBtb2R1bGUgaXMgaW50ZW50aW9uYWxseSBkZXBlbmRlbmN5LWZyZWU6IGl0IGlzIGJ1bmRsZWQgaW50byBib3RoIHRoZVxuICogZXh0ZW5zaW9uIGhvc3QgYW5kIHRoZSB3ZWJ2aWV3LlxuICovXG5cbmV4cG9ydCBjb25zdCBQUk9UT0NPTF9WRVJTSU9OID0gMTtcblxuLyoqIEhhcmQgY2VpbGluZyBvbiBhIHNlcmlhbGl6ZWQgbWVzc2FnZS4gTGFyZ2VyIG1lc3NhZ2VzIGFyZSByZWplY3RlZCwgbmV2ZXIgdHJ1bmNhdGVkLiAqL1xuZXhwb3J0IGNvbnN0IE1BWF9QQVlMT0FEX0JZVEVTID0gMV8wMDBfMDAwO1xuXG4vKiogYGRvbWFpbi5hY3Rpb25gIGluIGxvd2VyIGNhc2UsIGF0IGxlYXN0IHR3byBzZWdtZW50cy4gKi9cbmV4cG9ydCBjb25zdCBLSU5EX1BBVFRFUk4gPSAvXlthLXpdKyhcXC5bYS16XSspKyQvO1xuXG5leHBvcnQgY29uc3QgUkVRVUVTVF9JRF9QQVRURVJOID0gL15bQS1aYS16MC05Xy1dezEsMTI4fSQvO1xuXG4vKiogS2luZHMgYSB3ZWJ2aWV3IG1heSBzZW5kIHRvIHRoZSBob3N0LiAqL1xuZXhwb3J0IGNvbnN0IFdFQlZJRVdfVE9fSE9TVCA9IE9iamVjdC5mcmVlemUoW1xuICAnd2Vidmlldy5yZWFkeScsXG4gICdncmFwaC5sb2FkJyxcbiAgJ2Nzci5sb2FkJyxcbiAgJ25vZGUuc2VsZWN0JyxcbiAgJ3BhbmVsLnBpbmcnLFxuICAncXVlcnkuc3ltYm9sJyxcbiAgJ3F1ZXJ5LnN5bWJvbHMnLFxuICAncXVlcnkuY2FsbGVycycsXG4gICdxdWVyeS5jYWxsZWVzJyxcbiAgJ3F1ZXJ5LmNvbnN0cnVjdHMnLFxuICAncXVlcnkuY2FwYWJpbGl0aWVzJyxcbiAgJ2NmZy5mdW5jdGlvbnMnLFxuICAnY2ZnLmxvYWQnLFxuICAnc291cmNlLnNsaWNlJyxcbiAgJ3NvdXJjZS52YWxpZGF0aW9uJyxcbiAgJ25hdmlnYXRlLnRvJyxcbl0pO1xuXG4vKiogS2luZHMgdGhlIGhvc3QgbWF5IHNlbmQgdG8gdGhlIHdlYnZpZXcuICovXG5leHBvcnQgY29uc3QgSE9TVF9UT19XRUJWSUVXID0gT2JqZWN0LmZyZWV6ZShbXG4gICdncmFwaC5kYXRhJyxcbiAgJ2NhcGFiaWxpdGllcy5kYXRhJyxcbiAgJ2Nzci5kYXRhJyxcbiAgJ3F1ZXJ5LmRhdGEnLFxuICAnYW5hbHlzaXMucHJvZ3Jlc3MnLFxuICAncHJvdG9jb2wuZXJyb3InLFxuICAncHJvdG9jb2wuYWNrJyxcbiAgJ3BhbmVsLnBvbmcnLFxuICAnY2ZnLmZ1bmN0aW9ucycsXG4gICdjZmcuZGF0YScsXG4gICdzb3VyY2UuZGF0YScsXG4gICdzb3VyY2UuaW50ZWdyaXR5JyxcbiAgJ3NvdXJjZS5zdGFsZScsXG4gICduYXZpZ2F0ZS5kb25lJyxcbiAgJ3NlbGVjdGlvbi5jaGFuZ2VkJyxcbiAgJ2dyYXBoLmZvY3VzJyxcbiAgJ3NldHRpbmdzLmRhdGEnLFxuXSk7XG5cbmV4cG9ydCBjb25zdCBESVJFQ1RJT05TID0gT2JqZWN0LmZyZWV6ZSh7XG4gIFdFQlZJRVdfVE9fSE9TVDogJ3dlYnZpZXdfdG9faG9zdCcsXG4gIEhPU1RfVE9fV0VCVklFVzogJ2hvc3RfdG9fd2VidmlldycsXG59KTtcblxuY29uc3QgS0lORF9BTExPV0xJU1QgPSBPYmplY3QuZnJlZXplKHtcbiAgW0RJUkVDVElPTlMuV0VCVklFV19UT19IT1NUXTogbmV3IFNldChXRUJWSUVXX1RPX0hPU1QpLFxuICBbRElSRUNUSU9OUy5IT1NUX1RPX1dFQlZJRVddOiBuZXcgU2V0KEhPU1RfVE9fV0VCVklFVyksXG59KTtcblxuY29uc3QgVU5TQUZFX0tFWVMgPSBuZXcgU2V0KFsnX19wcm90b19fJywgJ2NvbnN0cnVjdG9yJywgJ3Byb3RvdHlwZSddKTtcblxuY29uc3QgTUFYX0tFWV9TQ0FOX0RFUFRIID0gODtcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBFbnZlbG9wZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IHByb3RvY29sVmVyc2lvblxuICogQHByb3BlcnR5IHtzdHJpbmd9IGtpbmRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbcmVxdWVzdElkXVxuICogQHByb3BlcnR5IHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gcGF5bG9hZFxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gVmFsaWRhdGlvblN1Y2Nlc3NcbiAqIEBwcm9wZXJ0eSB7dHJ1ZX0gb2tcbiAqIEBwcm9wZXJ0eSB7RW52ZWxvcGV9IGVudmVsb3BlXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBWYWxpZGF0aW9uRmFpbHVyZVxuICogQHByb3BlcnR5IHtmYWxzZX0gb2tcbiAqIEBwcm9wZXJ0eSB7J0VfUFJPVE9DT0wnfCdFX0xJTUlUJ30gY29kZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IHJlYXNvblxuICogQHByb3BlcnR5IHtzdHJpbmd9IG1lc3NhZ2VcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbcGF0aF1cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbcmVxdWVzdElkXVxuICovXG5cbi8qKlxuICogQnVpbGQgYSB3ZWxsLWZvcm1lZCBlbnZlbG9wZS4gUHJvZHVjZXJzIHNob3VsZCB1c2UgdGhpcyBpbnN0ZWFkIG9mIHdyaXRpbmdcbiAqIG9iamVjdCBsaXRlcmFscyBzbyB0aGF0IHRoZSB2ZXJzaW9uIGZpZWxkIGNhbiBuZXZlciBiZSBmb3Jnb3R0ZW4uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGtpbmRcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IFtwYXlsb2FkXVxuICogQHBhcmFtIHtzdHJpbmd9IFtyZXF1ZXN0SWRdXG4gKiBAcmV0dXJucyB7RW52ZWxvcGV9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbnZlbG9wZShraW5kLCBwYXlsb2FkLCByZXF1ZXN0SWQpIHtcbiAgLyoqIEB0eXBlIHtFbnZlbG9wZX0gKi9cbiAgY29uc3QgZW52ZWxvcGUgPSB7XG4gICAgcHJvdG9jb2xWZXJzaW9uOiBQUk9UT0NPTF9WRVJTSU9OLFxuICAgIGtpbmQsXG4gICAgcGF5bG9hZDogcGF5bG9hZCA/PyB7fSxcbiAgfTtcbiAgaWYgKHJlcXVlc3RJZCkge1xuICAgIGVudmVsb3BlLnJlcXVlc3RJZCA9IHJlcXVlc3RJZDtcbiAgfVxuICByZXR1cm4gZW52ZWxvcGU7XG59XG5cbi8qKlxuICogQnVpbGQgYSB0eXBlZCBlcnJvciBwYXlsb2FkLiBgZGV0YWlsYCBtdXN0IG5ldmVyIGNvbnRhaW4gc291cmNlIHRleHQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGNvZGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBbZGV0YWlsXVxuICogQHJldHVybnMge1JlY29yZDxzdHJpbmcsIHVua25vd24+fVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRXJyb3JQYXlsb2FkKGNvZGUsIG1lc3NhZ2UsIGRldGFpbCkge1xuICAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqL1xuICBjb25zdCBwYXlsb2FkID0geyBjb2RlLCBtZXNzYWdlIH07XG4gIGlmIChkZXRhaWwpIHtcbiAgICBwYXlsb2FkLmRldGFpbCA9IGRldGFpbDtcbiAgfVxuICByZXR1cm4gcGF5bG9hZDtcbn1cblxuLyoqXG4gKiBBcHByb3hpbWF0ZSBzZXJpYWxpemVkIHNpemUgb2YgYSBtZXNzYWdlLiBVc2VkIGZvciBsaW1pdCBlbmZvcmNlbWVudDsgdGhlXG4gKiBleGFjdCBieXRlcyBkbyBub3QgbWF0dGVyLCBvbmx5IHRoYXQgb3ZlcnNpemVkIG1lc3NhZ2VzIGFyZSByZWZ1c2VkIGJlZm9yZVxuICogdGhleSBhcmUgcG9zdGVkLlxuICpcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtZXNzYWdlU2l6ZSh2YWx1ZSkge1xuICB0cnkge1xuICAgIGNvbnN0IGpzb24gPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgcmV0dXJuIHR5cGVvZiBqc29uID09PSAnc3RyaW5nJyA/IGpzb24ubGVuZ3RoIDogMDtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEByZXR1cm5zIHt2YWx1ZSBpcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn1cbiAqL1xuZnVuY3Rpb24gaXNQbGFpbk9iamVjdCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCAmJiAhQXJyYXkuaXNBcnJheSh2YWx1ZSk7XG59XG5cbi8qKlxuICogUmVqZWN0IHBheWxvYWRzIHRoYXQgY291bGQgcG9pc29uIHByb3RvdHlwZXMgd2hlbiBtZXJnZWQgb3Igc3ByZWFkLlxuICpcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoXG4gKiBAcGFyYW0ge251bWJlcn0gZGVwdGhcbiAqIEByZXR1cm5zIHt7b2s6IHRydWV9IHwge29rOiBmYWxzZSwgcGF0aDogc3RyaW5nLCBrZXk6IHN0cmluZ319XG4gKi9cbmZ1bmN0aW9uIHNjYW5VbnNhZmVLZXlzKHZhbHVlLCBwYXRoLCBkZXB0aCkge1xuICBpZiAoZGVwdGggPiBNQVhfS0VZX1NDQU5fREVQVEggfHwgdmFsdWUgPT09IG51bGwgfHwgdHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiB7IG9rOiB0cnVlIH07XG4gIH1cbiAgY29uc3QgZW50cmllcyA9IEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWUuZW50cmllcygpIDogT2JqZWN0LmVudHJpZXModmFsdWUpO1xuICBmb3IgKGNvbnN0IFtrZXksIGNoaWxkXSBvZiBlbnRyaWVzKSB7XG4gICAgY29uc3QgY2hpbGRQYXRoID0gQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyBgJHtwYXRofVske2tleX1dYCA6IGAke3BhdGh9LiR7a2V5fWA7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlKSAmJiBVTlNBRkVfS0VZUy5oYXMoU3RyaW5nKGtleSkpKSB7XG4gICAgICByZXR1cm4geyBvazogZmFsc2UsIHBhdGg6IGNoaWxkUGF0aCwga2V5OiBTdHJpbmcoa2V5KSB9O1xuICAgIH1cbiAgICBjb25zdCBuZXN0ZWQgPSBzY2FuVW5zYWZlS2V5cyhjaGlsZCwgY2hpbGRQYXRoLCBkZXB0aCArIDEpO1xuICAgIGlmICghbmVzdGVkLm9rKSB7XG4gICAgICByZXR1cm4gbmVzdGVkO1xuICAgIH1cbiAgfVxuICByZXR1cm4geyBvazogdHJ1ZSB9O1xufVxuXG4vKipcbiAqIFZhbGlkYXRlIGFuIGluYm91bmQgbWVzc2FnZSBhZ2FpbnN0IHRoZSBwcm90b2NvbCBjb250cmFjdC5cbiAqXG4gKiBWYWxpZGF0aW9uIGlzIHRvdGFsOiBldmVyeSByZWplY3Rpb24gcmV0dXJucyBhIHR5cGVkIGZhaWx1cmUgd2l0aCBhIHN0YWJsZVxuICogcmVhc29uIGNvZGUsIGFuZCBuZXZlciB0aHJvd3MuXG4gKlxuICogQHBhcmFtIHt1bmtub3dufSByYXdcbiAqIEBwYXJhbSB7e2RpcmVjdGlvbjogJ3dlYnZpZXdfdG9faG9zdCcgfCAnaG9zdF90b193ZWJ2aWV3J319IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtWYWxpZGF0aW9uU3VjY2VzcyB8IFZhbGlkYXRpb25GYWlsdXJlfVxuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVFbnZlbG9wZShyYXcsIG9wdGlvbnMpIHtcbiAgY29uc3QgZGlyZWN0aW9uID0gb3B0aW9ucz8uZGlyZWN0aW9uO1xuICBjb25zdCBhbGxvd2xpc3QgPSBLSU5EX0FMTE9XTElTVFtkaXJlY3Rpb25dO1xuICBpZiAoIWFsbG93bGlzdCkge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9QUk9UT0NPTCcsXG4gICAgICByZWFzb246ICd1bmtub3duX2RpcmVjdGlvbicsXG4gICAgICBtZXNzYWdlOiBgVW5rbm93biBwcm90b2NvbCBkaXJlY3Rpb246ICR7U3RyaW5nKGRpcmVjdGlvbil9YCxcbiAgICB9O1xuICB9XG5cbiAgaWYgKCFpc1BsYWluT2JqZWN0KHJhdykpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAnbm90X2FuX29iamVjdCcsXG4gICAgICBtZXNzYWdlOiAnTWVzc2FnZSBtdXN0IGJlIGEgcGxhaW4gb2JqZWN0LicsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGNhbmRpZGF0ZSA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChyYXcpO1xuXG4gIGlmIChjYW5kaWRhdGUucHJvdG9jb2xWZXJzaW9uICE9PSBQUk9UT0NPTF9WRVJTSU9OKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgIHJlYXNvbjogJ3ZlcnNpb25fbWlzbWF0Y2gnLFxuICAgICAgbWVzc2FnZTogYFVuc3VwcG9ydGVkIHByb3RvY29sIHZlcnNpb246IGV4cGVjdGVkICR7UFJPVE9DT0xfVkVSU0lPTn0sIHJlY2VpdmVkICR7U3RyaW5nKFxuICAgICAgICBjYW5kaWRhdGUucHJvdG9jb2xWZXJzaW9uLFxuICAgICAgKX0uYCxcbiAgICB9O1xuICB9XG5cbiAgY29uc3Qga2luZCA9IGNhbmRpZGF0ZS5raW5kO1xuICBpZiAodHlwZW9mIGtpbmQgIT09ICdzdHJpbmcnIHx8ICFLSU5EX1BBVFRFUk4udGVzdChraW5kKSkge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9QUk9UT0NPTCcsXG4gICAgICByZWFzb246ICdpbnZhbGlkX2tpbmQnLFxuICAgICAgbWVzc2FnZTogJ01lc3NhZ2Uga2luZCBtdXN0IGxvb2sgbGlrZSBcImRvbWFpbi5hY3Rpb25cIiBpbiBsb3dlciBjYXNlLicsXG4gICAgICBwYXRoOiAna2luZCcsXG4gICAgfTtcbiAgfVxuXG4gIGlmICghYWxsb3dsaXN0LmhhcyhraW5kKSkge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9QUk9UT0NPTCcsXG4gICAgICByZWFzb246ICd1bmtub3duX2tpbmQnLFxuICAgICAgbWVzc2FnZTogYEtpbmQgXCIke2tpbmR9XCIgaXMgbm90IGFjY2VwdGVkIGluIGRpcmVjdGlvbiBcIiR7ZGlyZWN0aW9ufVwiLmAsXG4gICAgICBwYXRoOiAna2luZCcsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IHJlcXVlc3RJZCA9IGNhbmRpZGF0ZS5yZXF1ZXN0SWQ7XG4gIGlmIChyZXF1ZXN0SWQgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh0eXBlb2YgcmVxdWVzdElkICE9PSAnc3RyaW5nJyB8fCAhUkVRVUVTVF9JRF9QQVRURVJOLnRlc3QocmVxdWVzdElkKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb2s6IGZhbHNlLFxuICAgICAgICBjb2RlOiAnRV9QUk9UT0NPTCcsXG4gICAgICAgIHJlYXNvbjogJ2ludmFsaWRfcmVxdWVzdF9pZCcsXG4gICAgICAgIG1lc3NhZ2U6ICdyZXF1ZXN0SWQgbXVzdCBiZSAxLTEyOCBjaGFyYWN0ZXJzIG9mIEEtWiwgYS16LCAwLTksIFwiX1wiIG9yIFwiLVwiLicsXG4gICAgICAgIHBhdGg6ICdyZXF1ZXN0SWQnLFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBwYXlsb2FkID0gY2FuZGlkYXRlLnBheWxvYWQgPz8ge307XG4gIGlmICghaXNQbGFpbk9iamVjdChwYXlsb2FkKSkge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9QUk9UT0NPTCcsXG4gICAgICByZWFzb246ICdpbnZhbGlkX3BheWxvYWQnLFxuICAgICAgbWVzc2FnZTogJ3BheWxvYWQgbXVzdCBiZSBhIHBsYWluIG9iamVjdC4nLFxuICAgICAgcGF0aDogJ3BheWxvYWQnLFxuICAgICAgcmVxdWVzdElkOiB0eXBlb2YgcmVxdWVzdElkID09PSAnc3RyaW5nJyA/IHJlcXVlc3RJZCA6IHVuZGVmaW5lZCxcbiAgICB9O1xuICB9XG5cbiAgY29uc3Qga2V5U2NhbiA9IHNjYW5VbnNhZmVLZXlzKHBheWxvYWQsICdwYXlsb2FkJywgMCk7XG4gIGlmICgha2V5U2Nhbi5vaykge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9QUk9UT0NPTCcsXG4gICAgICByZWFzb246ICd1bnNhZmVfa2V5JyxcbiAgICAgIG1lc3NhZ2U6IGBQYXlsb2FkIGNvbnRhaW5zIGEgZm9yYmlkZGVuIGtleSBcIiR7a2V5U2Nhbi5rZXl9XCIuYCxcbiAgICAgIHBhdGg6IGtleVNjYW4ucGF0aCxcbiAgICAgIHJlcXVlc3RJZDogdHlwZW9mIHJlcXVlc3RJZCA9PT0gJ3N0cmluZycgPyByZXF1ZXN0SWQgOiB1bmRlZmluZWQsXG4gICAgfTtcbiAgfVxuXG4gIGlmIChtZXNzYWdlU2l6ZShjYW5kaWRhdGUpID4gTUFYX1BBWUxPQURfQllURVMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfTElNSVQnLFxuICAgICAgcmVhc29uOiAncGF5bG9hZF90b29fbGFyZ2UnLFxuICAgICAgbWVzc2FnZTogYE1lc3NhZ2UgZXhjZWVkcyB0aGUgJHtNQVhfUEFZTE9BRF9CWVRFU30gYnl0ZSBsaW1pdC5gLFxuICAgICAgcmVxdWVzdElkOiB0eXBlb2YgcmVxdWVzdElkID09PSAnc3RyaW5nJyA/IHJlcXVlc3RJZCA6IHVuZGVmaW5lZCxcbiAgICB9O1xuICB9XG5cbiAgLyoqIEB0eXBlIHtFbnZlbG9wZX0gKi9cbiAgY29uc3QgZW52ZWxvcGUgPSB7XG4gICAgcHJvdG9jb2xWZXJzaW9uOiBQUk9UT0NPTF9WRVJTSU9OLFxuICAgIGtpbmQsXG4gICAgcGF5bG9hZCxcbiAgfTtcbiAgaWYgKHR5cGVvZiByZXF1ZXN0SWQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW52ZWxvcGUucmVxdWVzdElkID0gcmVxdWVzdElkO1xuICB9XG5cbiAgcmV0dXJuIHsgb2s6IHRydWUsIGVudmVsb3BlIH07XG59XG4iLCAiLyoqXG4gKiBXZWJ2aWV3IG1lc3NhZ2UgYnJpZGdlLlxuICpcbiAqIFN5bW1ldHJpYyBpbXBsZW1lbnRhdGlvbiB1c2VkIGJ5IGJvdGggdGhlIGV4dGVuc2lvbiBob3N0IGFuZCB0aGUgd2Vidmlldy5cbiAqIFJlc3BvbnNpYmlsaXRpZXM6XG4gKiAtIFZhbGlkYXRlIGV2ZXJ5IGluYm91bmQgbWVzc2FnZSBiZWZvcmUgYW55IGhhbmRsZXIgc2VlcyBpdC5cbiAqIC0gQ29ycmVsYXRlIHJlcXVlc3RzIHdpdGggcmVzcG9uc2VzLCB3aXRoIGEgdGltZW91dCBwZXIgcmVxdWVzdC5cbiAqIC0gQ29udGFpbiBoYW5kbGVyIGZhaWx1cmVzIGFuZCByZXBvcnQgdGhlbSBhcyB0eXBlZCBwcm90b2NvbCBlcnJvcnMuXG4gKiAtIFJlamVjdCB3b3JrIGFmdGVyIGRpc3Bvc2FsIHNvIGEgY2xvc2VkIHBhbmVsIGNhbm5vdCBsZWFrIHRpbWVycy5cbiAqXG4gKiBUaGUgYnJpZGdlIGhhcyBubyBkZXBlbmRlbmN5IG9uIHRoZSBgdnNjb2RlYCBtb2R1bGU6IHRoZSB0cmFuc3BvcnQgKGBwb3N0YClcbiAqIGlzIGluamVjdGVkLiBUaGF0IG1ha2VzIHRoZSB3aG9sZSByZXF1ZXN0L3Jlc3BvbnNlIGNvbnRyYWN0IHVuaXQtdGVzdGFibGUgaW5cbiAqIHBsYWluIE5vZGUuXG4gKi9cblxuaW1wb3J0IHtcbiAgRElSRUNUSU9OUyxcbiAgSE9TVF9UT19XRUJWSUVXLFxuICBXRUJWSUVXX1RPX0hPU1QsXG4gIGNyZWF0ZUVudmVsb3BlLFxuICBjcmVhdGVFcnJvclBheWxvYWQsXG4gIG1lc3NhZ2VTaXplLFxuICB2YWxpZGF0ZUVudmVsb3BlLFxufSBmcm9tICcuL2VudmVsb3BlLmpzJztcblxuZXhwb3J0IGNsYXNzIFByb3RvY29sRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBbZGV0YWlsXVxuICAgKi9cbiAgY29uc3RydWN0b3IoY29kZSwgbWVzc2FnZSwgZGV0YWlsKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5uYW1lID0gJ1Byb3RvY29sRXJyb3InO1xuICAgIHRoaXMuY29kZSA9IGNvZGU7XG4gICAgaWYgKGRldGFpbCkge1xuICAgICAgdGhpcy5kZXRhaWwgPSBkZXRhaWw7XG4gICAgfVxuICB9XG59XG5cbi8qKiBAdHlwZSB7e2RlYnVnOiBGdW5jdGlvbiwgd2FybjogRnVuY3Rpb24sIGVycm9yOiBGdW5jdGlvbn19ICovXG5jb25zdCBOT09QX0xPR0dFUiA9IHtcbiAgZGVidWcoKSB7fSxcbiAgd2FybigpIHt9LFxuICBlcnJvcigpIHt9LFxufTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBCcmlkZ2VPcHRpb25zXG4gKiBAcHJvcGVydHkgeyhtZXNzYWdlOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT4gdm9pZH0gcG9zdCAgVHJhbnNwb3J0IHRvIHRoZSBvdGhlciBzaWRlLlxuICogQHByb3BlcnR5IHsnd2Vidmlld190b19ob3N0JyB8ICdob3N0X3RvX3dlYnZpZXcnfSBpbmJvdW5kRGlyZWN0aW9uXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3RpbWVvdXRNc11cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbbWF4SW5GbGlnaHRdXG4gKiBAcHJvcGVydHkgeygpID0+IHN0cmluZ30gW2NyZWF0ZVJlcXVlc3RJZF1cbiAqIEBwcm9wZXJ0eSB7dHlwZW9mIE5PT1BfTE9HR0VSfSBbbG9nZ2VyXVxuICovXG5cbi8qKlxuICogQHBhcmFtIHtCcmlkZ2VPcHRpb25zfSBvcHRpb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVCcmlkZ2Uob3B0aW9ucykge1xuICBjb25zdCB7IHBvc3QsIGluYm91bmREaXJlY3Rpb24sIGxvZ2dlciA9IE5PT1BfTE9HR0VSIH0gPSBvcHRpb25zO1xuICBjb25zdCB0aW1lb3V0TXMgPSBvcHRpb25zLnRpbWVvdXRNcyA/PyA1MDAwO1xuICBjb25zdCBtYXhJbkZsaWdodCA9IG9wdGlvbnMubWF4SW5GbGlnaHQgPz8gMzI7XG4gIGNvbnN0IG91dGJvdW5kRGlyZWN0aW9uID1cbiAgICBpbmJvdW5kRGlyZWN0aW9uID09PSBESVJFQ1RJT05TLldFQlZJRVdfVE9fSE9TVFxuICAgICAgPyBESVJFQ1RJT05TLkhPU1RfVE9fV0VCVklFV1xuICAgICAgOiBESVJFQ1RJT05TLldFQlZJRVdfVE9fSE9TVDtcbiAgY29uc3Qgb3V0Ym91bmRLaW5kcyA9IG5ldyBTZXQoXG4gICAgb3V0Ym91bmREaXJlY3Rpb24gPT09IERJUkVDVElPTlMuSE9TVF9UT19XRUJWSUVXID8gSE9TVF9UT19XRUJWSUVXIDogV0VCVklFV19UT19IT1NULFxuICApO1xuXG4gIGxldCBzZXF1ZW5jZSA9IDA7XG4gIGNvbnN0IGNyZWF0ZVJlcXVlc3RJZCA9XG4gICAgb3B0aW9ucy5jcmVhdGVSZXF1ZXN0SWQgPz9cbiAgICAoKCkgPT4ge1xuICAgICAgc2VxdWVuY2UgKz0gMTtcbiAgICAgIHJldHVybiBgciR7c2VxdWVuY2UudG9TdHJpbmcoMzYpfS0ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIsIDEwKX1gO1xuICAgIH0pO1xuXG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywge3Jlc29sdmU6IEZ1bmN0aW9uLCByZWplY3Q6IEZ1bmN0aW9uLCB0aW1lcjogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD59Pn0gKi9cbiAgY29uc3QgcGVuZGluZyA9IG5ldyBNYXAoKTtcbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCAocGF5bG9hZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sIG1ldGE6IHtyZXF1ZXN0SWQ/OiBzdHJpbmd9KSA9PiB1bmtub3duPn0gKi9cbiAgY29uc3QgaGFuZGxlcnMgPSBuZXcgTWFwKCk7XG4gIGNvbnN0IHJlcG9ydGVkS2luZHMgPSBuZXcgU2V0KCk7XG4gIGxldCBkaXNwb3NlZCA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2luZFxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBwYXlsb2FkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcmVxdWVzdElkXVxuICAgKi9cbiAgZnVuY3Rpb24gc2VuZChraW5kLCBwYXlsb2FkLCByZXF1ZXN0SWQpIHtcbiAgICBpZiAoZGlzcG9zZWQpIHtcbiAgICAgIHRocm93IG5ldyBQcm90b2NvbEVycm9yKCdFX0NBTkNFTExFRCcsICdCcmlkZ2UgaXMgZGlzcG9zZWQuJyk7XG4gICAgfVxuICAgIGlmICghb3V0Ym91bmRLaW5kcy5oYXMoa2luZCkpIHtcbiAgICAgIHRocm93IG5ldyBQcm90b2NvbEVycm9yKCdFX1BST1RPQ09MJywgYEtpbmQgXCIke2tpbmR9XCIgaXMgbm90IHNlbmRhYmxlIGluIHRoaXMgZGlyZWN0aW9uLmApO1xuICAgIH1cbiAgICBjb25zdCBlbnZlbG9wZSA9IGNyZWF0ZUVudmVsb3BlKGtpbmQsIHBheWxvYWQsIHJlcXVlc3RJZCk7XG4gICAgaWYgKG1lc3NhZ2VTaXplKGVudmVsb3BlKSA+IDFfMDAwXzAwMCkge1xuICAgICAgdGhyb3cgbmV3IFByb3RvY29sRXJyb3IoJ0VfTElNSVQnLCAnUmVmdXNpbmcgdG8gc2VuZCBhbiBvdmVyc2l6ZWQgbWVzc2FnZS4nKTtcbiAgICB9XG4gICAgcG9zdChlbnZlbG9wZSk7XG4gICAgbG9nZ2VyLmRlYnVnKCdwcm90b2NvbC5zZW5kJywge1xuICAgICAga2luZCxcbiAgICAgIHJlcXVlc3RJZDogcmVxdWVzdElkID8/IG51bGwsXG4gICAgICBieXRlczogbWVzc2FnZVNpemUoZW52ZWxvcGUpLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcmVxdWVzdElkXVxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBbZGV0YWlsXVxuICAgKi9cbiAgZnVuY3Rpb24gc2VuZEVycm9yKGNvZGUsIG1lc3NhZ2UsIHJlcXVlc3RJZCwgZGV0YWlsKSB7XG4gICAgdHJ5IHtcbiAgICAgIHNlbmQoJ3Byb3RvY29sLmVycm9yJywgY3JlYXRlRXJyb3JQYXlsb2FkKGNvZGUsIG1lc3NhZ2UsIGRldGFpbCksIHJlcXVlc3RJZCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBUaGUgcGFuZWwgbWF5IGFscmVhZHkgYmUgZ29uZS4gTm90aGluZyB1c2VmdWwgcmVtYWlucyB0byBkby5cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtpbmRcbiAgICogQHBhcmFtIHsocGF5bG9hZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sIG1ldGE6IHtyZXF1ZXN0SWQ/OiBzdHJpbmd9KSA9PiB1bmtub3dufSBoYW5kbGVyXG4gICAqIEByZXR1cm5zIHsoKSA9PiB2b2lkfSB1bnN1YnNjcmliZVxuICAgKi9cbiAgZnVuY3Rpb24gb24oa2luZCwgaGFuZGxlcikge1xuICAgIGhhbmRsZXJzLnNldChraW5kLCBoYW5kbGVyKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgaWYgKGhhbmRsZXJzLmdldChraW5kKSA9PT0gaGFuZGxlcikge1xuICAgICAgICBoYW5kbGVycy5kZWxldGUoa2luZCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGEgcmVxdWVzdCBhbmQgYXdhaXQgdGhlIGNvcnJlbGF0ZWQgcmVzcG9uc2UuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBraW5kXG4gICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IFtwYXlsb2FkXVxuICAgKiBAcGFyYW0ge3t0aW1lb3V0TXM/OiBudW1iZXJ9fSBbcmVxdWVzdE9wdGlvbnNdXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPHtraW5kOiBzdHJpbmcsIHBheWxvYWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+fT59XG4gICAqL1xuICBmdW5jdGlvbiByZXF1ZXN0KGtpbmQsIHBheWxvYWQgPSB7fSwgcmVxdWVzdE9wdGlvbnMgPSB7fSkge1xuICAgIGlmIChkaXNwb3NlZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBQcm90b2NvbEVycm9yKCdFX0NBTkNFTExFRCcsICdCcmlkZ2UgaXMgZGlzcG9zZWQuJykpO1xuICAgIH1cbiAgICBpZiAocGVuZGluZy5zaXplID49IG1heEluRmxpZ2h0KSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXG4gICAgICAgIG5ldyBQcm90b2NvbEVycm9yKCdFX0xJTUlUJywgYFRvbyBtYW55IGluLWZsaWdodCByZXF1ZXN0cyAoJHttYXhJbkZsaWdodH0pLmApLFxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgcmVxdWVzdElkID0gY3JlYXRlUmVxdWVzdElkKCk7XG4gICAgY29uc3QgZWZmZWN0aXZlVGltZW91dCA9IHJlcXVlc3RPcHRpb25zLnRpbWVvdXRNcyA/PyB0aW1lb3V0TXM7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgcGVuZGluZy5kZWxldGUocmVxdWVzdElkKTtcbiAgICAgICAgcmVqZWN0KFxuICAgICAgICAgIG5ldyBQcm90b2NvbEVycm9yKFxuICAgICAgICAgICAgJ0VfVElNRU9VVCcsXG4gICAgICAgICAgICBgTm8gcmVzcG9uc2UgdG8gXCIke2tpbmR9XCIgd2l0aGluICR7ZWZmZWN0aXZlVGltZW91dH0gbXMuYCxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAga2luZCxcbiAgICAgICAgICAgICAgcmVxdWVzdElkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICApLFxuICAgICAgICApO1xuICAgICAgfSwgZWZmZWN0aXZlVGltZW91dCk7XG4gICAgICBwZW5kaW5nLnNldChyZXF1ZXN0SWQsIHsgcmVzb2x2ZSwgcmVqZWN0LCB0aW1lciB9KTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHNlbmQoa2luZCwgcGF5bG9hZCwgcmVxdWVzdElkKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgIHBlbmRpbmcuZGVsZXRlKHJlcXVlc3RJZCk7XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHt1bmtub3dufSByYXdcbiAgICogQHJldHVybnMge1Byb21pc2U8e29rOiBib29sZWFuLCBjb2RlPzogc3RyaW5nLCByZWFzb24/OiBzdHJpbmd9Pn1cbiAgICovXG4gIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZU1lc3NhZ2UocmF3KSB7XG4gICAgaWYgKGRpc3Bvc2VkKSB7XG4gICAgICByZXR1cm4geyBvazogZmFsc2UsIGNvZGU6ICdFX0NBTkNFTExFRCcsIHJlYXNvbjogJ2Rpc3Bvc2VkJyB9O1xuICAgIH1cblxuICAgIGNvbnN0IHZhbGlkYXRpb24gPSB2YWxpZGF0ZUVudmVsb3BlKHJhdywgeyBkaXJlY3Rpb246IGluYm91bmREaXJlY3Rpb24gfSk7XG4gICAgaWYgKCF2YWxpZGF0aW9uLm9rKSB7XG4gICAgICBpZiAoIXJlcG9ydGVkS2luZHMuaGFzKHZhbGlkYXRpb24ucmVhc29uKSkge1xuICAgICAgICByZXBvcnRlZEtpbmRzLmFkZCh2YWxpZGF0aW9uLnJlYXNvbik7XG4gICAgICAgIGxvZ2dlci53YXJuKCdwcm90b2NvbC5yZWplY3RlZCcsIHtcbiAgICAgICAgICByZWFzb246IHZhbGlkYXRpb24ucmVhc29uLFxuICAgICAgICAgIHBhdGg6IHZhbGlkYXRpb24ucGF0aCA/PyBudWxsLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHNlbmRFcnJvcih2YWxpZGF0aW9uLmNvZGUsIHZhbGlkYXRpb24ubWVzc2FnZSwgdmFsaWRhdGlvbi5yZXF1ZXN0SWQsIHtcbiAgICAgICAgcmVhc29uOiB2YWxpZGF0aW9uLnJlYXNvbixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBjb2RlOiB2YWxpZGF0aW9uLmNvZGUsIHJlYXNvbjogdmFsaWRhdGlvbi5yZWFzb24gfTtcbiAgICB9XG5cbiAgICBjb25zdCBlbnZlbG9wZSA9IHZhbGlkYXRpb24uZW52ZWxvcGU7XG4gICAgY29uc3QgeyBraW5kLCByZXF1ZXN0SWQsIHBheWxvYWQgfSA9IGVudmVsb3BlO1xuICAgIGxvZ2dlci5kZWJ1ZygncHJvdG9jb2wucmVjZWl2ZScsIHtcbiAgICAgIGtpbmQsXG4gICAgICByZXF1ZXN0SWQ6IHJlcXVlc3RJZCA/PyBudWxsLFxuICAgICAgYnl0ZXM6IG1lc3NhZ2VTaXplKGVudmVsb3BlKSxcbiAgICB9KTtcblxuICAgIGlmIChraW5kID09PSAncHJvdG9jb2wuZXJyb3InKSB7XG4gICAgICBpZiAocmVxdWVzdElkICYmIHBlbmRpbmcuaGFzKHJlcXVlc3RJZCkpIHtcbiAgICAgICAgY29uc3QgZW50cnkgPSBwZW5kaW5nLmdldChyZXF1ZXN0SWQpO1xuICAgICAgICBpZiAoZW50cnkpIHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQoZW50cnkudGltZXIpO1xuICAgICAgICAgIHBlbmRpbmcuZGVsZXRlKHJlcXVlc3RJZCk7XG4gICAgICAgICAgY29uc3QgY29kZSA9IHR5cGVvZiBwYXlsb2FkLmNvZGUgPT09ICdzdHJpbmcnID8gcGF5bG9hZC5jb2RlIDogJ0VfUFJPVE9DT0wnO1xuICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPVxuICAgICAgICAgICAgdHlwZW9mIHBheWxvYWQubWVzc2FnZSA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgPyBwYXlsb2FkLm1lc3NhZ2VcbiAgICAgICAgICAgICAgOiAnVGhlIG90aGVyIHNpZGUgcmVwb3J0ZWQgYW4gZXJyb3IuJztcbiAgICAgICAgICBlbnRyeS5yZWplY3QobmV3IFByb3RvY29sRXJyb3IoY29kZSwgbWVzc2FnZSwgeyByZXF1ZXN0SWQgfSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4geyBvazogdHJ1ZSB9O1xuICAgIH1cblxuICAgIGlmIChyZXF1ZXN0SWQgJiYgcGVuZGluZy5oYXMocmVxdWVzdElkKSkge1xuICAgICAgY29uc3QgZW50cnkgPSBwZW5kaW5nLmdldChyZXF1ZXN0SWQpO1xuICAgICAgaWYgKGVudHJ5KSB7XG4gICAgICAgIGNsZWFyVGltZW91dChlbnRyeS50aW1lcik7XG4gICAgICAgIHBlbmRpbmcuZGVsZXRlKHJlcXVlc3RJZCk7XG4gICAgICAgIGVudHJ5LnJlc29sdmUoeyBraW5kLCBwYXlsb2FkIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHsgb2s6IHRydWUgfTtcbiAgICB9XG5cbiAgICBjb25zdCBoYW5kbGVyID0gaGFuZGxlcnMuZ2V0KGtpbmQpO1xuICAgIGlmICghaGFuZGxlcikge1xuICAgICAgLy8gQSByZXNwb25zZSB3aG9zZSByZXF1ZXN0IGFscmVhZHkgdGltZWQgb3V0IGlzIGV4cGVjdGVkIGFuZCBoYXJtbGVzcy5cbiAgICAgIGxvZ2dlci5kZWJ1ZygncHJvdG9jb2wudW5oYW5kbGVkJywgeyBraW5kLCByZXF1ZXN0SWQ6IHJlcXVlc3RJZCA/PyBudWxsIH0pO1xuICAgICAgcmV0dXJuIHsgb2s6IHRydWUgfTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgaGFuZGxlcihwYXlsb2FkLCB7IHJlcXVlc3RJZCB9KTtcbiAgICAgIHJldHVybiB7IG9rOiB0cnVlIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XG4gICAgICBjb25zdCBjb2RlID1cbiAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBQcm90b2NvbEVycm9yXG4gICAgICAgICAgPyBlcnJvci5jb2RlXG4gICAgICAgICAgOiAoLyoqIEB0eXBlIHt7Y29kZT86IHN0cmluZ319ICovIChlcnJvcik/LmNvZGUgPz8gJ0VfUFJPVE9DT0wnKTtcbiAgICAgIGxvZ2dlci5lcnJvcigncHJvdG9jb2wuaGFuZGxlcl9mYWlsZWQnLCB7IGtpbmQsIGVycm9yOiBtZXNzYWdlIH0pO1xuICAgICAgc2VuZEVycm9yKGNvZGUsIG1lc3NhZ2UsIHJlcXVlc3RJZCk7XG4gICAgICByZXR1cm4geyBvazogZmFsc2UsIGNvZGUgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJlYXNvblxuICAgKi9cbiAgZnVuY3Rpb24gZGlzcG9zZShyZWFzb24gPSAnZGlzcG9zZWQnKSB7XG4gICAgaWYgKGRpc3Bvc2VkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGRpc3Bvc2VkID0gdHJ1ZTtcbiAgICBmb3IgKGNvbnN0IFssIGVudHJ5XSBvZiBwZW5kaW5nKSB7XG4gICAgICBjbGVhclRpbWVvdXQoZW50cnkudGltZXIpO1xuICAgICAgZW50cnkucmVqZWN0KG5ldyBQcm90b2NvbEVycm9yKCdFX0NBTkNFTExFRCcsIGBCcmlkZ2UgY2xvc2VkOiAke3JlYXNvbn1gKSk7XG4gICAgfVxuICAgIHBlbmRpbmcuY2xlYXIoKTtcbiAgICBoYW5kbGVycy5jbGVhcigpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvbixcbiAgICByZXF1ZXN0LFxuICAgIHJlc3BvbmQ6IHNlbmQsXG4gICAgaGFuZGxlTWVzc2FnZSxcbiAgICBkaXNwb3NlLFxuICAgIHBlbmRpbmdDb3VudDogKCkgPT4gcGVuZGluZy5zaXplLFxuICAgIGlzRGlzcG9zZWQ6ICgpID0+IGRpc3Bvc2VkLFxuICAgIGRpcmVjdGlvbjogaW5ib3VuZERpcmVjdGlvbixcbiAgfTtcbn1cbiIsICIvKipcbiAqIERldGVybWluaXN0aWMgbGF5ZXJlZCBsYXlvdXQuXG4gKlxuICogUGhhc2UgMCBuZWVkcyBwb3NpdGlvbnMgc28gdGhlIHdlYnZpZXcgY2FuIGRyYXcgc29tZXRoaW5nIHdpdGhvdXQgb3duaW5nIGFcbiAqIGxheW91dCBhbGdvcml0aG0uIFBoYXNlIDQgYmVuY2htYXJrcyByZWFsIGVuZ2luZXMgKEN5dG9zY2FwZS9FTEsvZGFncmUpIGFuZFxuICogcmVwbGFjZXMgdGhpcyBiZWhpbmQgdGhlIHJlbmRlcmVyIGJvdW5kYXJ5OyB1bnRpbCB0aGVuLCBkZXRlcm1pbmlzdGljIG91dHB1dFxuICogaXMgbW9yZSB2YWx1YWJsZSB0aGFuIHByZXR0eSBvdXRwdXQgYmVjYXVzZSBpdCBtYWtlcyB0ZXN0cyBzdGFibGUuXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuL21vZGVsLmpzJykuR3JhcGh9IEdyYXBoXG4gKiBAdHlwZWRlZiB7e3g6IG51bWJlciwgeTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgbGF5ZXI6IG51bWJlcn19IFBvc2l0aW9uXG4gKi9cblxuZXhwb3J0IGNvbnN0IExBWU9VVF9ERUZBVUxUUyA9IE9iamVjdC5mcmVlemUoe1xuICBub2RlV2lkdGg6IDE5MCxcbiAgbm9kZUhlaWdodDogNTQsXG4gIGhvcml6b250YWxHYXA6IDkwLFxuICB2ZXJ0aWNhbEdhcDogMjYsXG4gIG1heExheWVyczogNDAsXG59KTtcblxuLyoqXG4gKiBAcGFyYW0ge0dyYXBofSBncmFwaFxuICogQHBhcmFtIHtQYXJ0aWFsPHR5cGVvZiBMQVlPVVRfREVGQVVMVFM+fSBbb3B0aW9uc11cbiAqIEByZXR1cm5zIHt7cG9zaXRpb25zOiBSZWNvcmQ8c3RyaW5nLCBQb3NpdGlvbj4sIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBsYXllcnM6IHN0cmluZ1tdW119fVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUxheW91dChncmFwaCwgb3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IGNvbmZpZyA9IHsgLi4uTEFZT1VUX0RFRkFVTFRTLCAuLi5vcHRpb25zIH07XG4gIGNvbnN0IG5vZGVJZHMgPSBncmFwaC5ub2Rlcy5tYXAoKG5vZGUpID0+IG5vZGUuaWQpO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIG51bWJlcj59ICovXG4gIGNvbnN0IGxheWVyT2YgPSBuZXcgTWFwKCk7XG5cbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBzdHJpbmdbXT59ICovXG4gIGNvbnN0IGluY29taW5nID0gbmV3IE1hcChub2RlSWRzLm1hcCgoaWQpID0+IFtpZCwgW11dKSk7XG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywgc3RyaW5nW10+fSAqL1xuICBjb25zdCBvdXRnb2luZyA9IG5ldyBNYXAobm9kZUlkcy5tYXAoKGlkKSA9PiBbaWQsIFtdXSkpO1xuXG4gIGZvciAoY29uc3QgZWRnZSBvZiBncmFwaC5lZGdlcykge1xuICAgIGlmICghaW5jb21pbmcuaGFzKGVkZ2UudG8pIHx8ICFpbmNvbWluZy5oYXMoZWRnZS5mcm9tKSB8fCBlZGdlLmZyb20gPT09IGVkZ2UudG8pIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpbmNvbWluZy5nZXQoZWRnZS50byk/LnB1c2goZWRnZS5mcm9tKTtcbiAgICBvdXRnb2luZy5nZXQoZWRnZS5mcm9tKT8ucHVzaChlZGdlLnRvKTtcbiAgfVxuXG4gIC8vIEthaG4ncyBhbGdvcml0aG0gZ2l2ZXMgYSB0b3BvbG9naWNhbCBvcmRlcjsgY3ljbGVzIGFyZSBoYW5kbGVkIGFmdGVyd2FyZHMuXG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywgbnVtYmVyPn0gKi9cbiAgY29uc3QgaW5kZWdyZWUgPSBuZXcgTWFwKG5vZGVJZHMubWFwKChpZCkgPT4gW2lkLCBpbmNvbWluZy5nZXQoaWQpPy5sZW5ndGggPz8gMF0pKTtcbiAgY29uc3QgcmVhZHkgPSBub2RlSWRzLmZpbHRlcigoaWQpID0+IChpbmRlZ3JlZS5nZXQoaWQpID8/IDApID09PSAwKS5zb3J0KCk7XG4gIC8qKiBAdHlwZSB7c3RyaW5nW119ICovXG4gIGNvbnN0IG9yZGVyID0gW107XG5cbiAgd2hpbGUgKHJlYWR5Lmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBpZCA9IC8qKiBAdHlwZSB7c3RyaW5nfSAqLyAocmVhZHkuc2hpZnQoKSk7XG4gICAgb3JkZXIucHVzaChpZCk7XG4gICAgZm9yIChjb25zdCBuZXh0IG9mIChvdXRnb2luZy5nZXQoaWQpID8/IFtdKS5zbGljZSgpLnNvcnQoKSkge1xuICAgICAgY29uc3QgcmVtYWluaW5nID0gKGluZGVncmVlLmdldChuZXh0KSA/PyAwKSAtIDE7XG4gICAgICBpbmRlZ3JlZS5zZXQobmV4dCwgcmVtYWluaW5nKTtcbiAgICAgIGlmIChyZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgcmVhZHkucHVzaChuZXh0KTtcbiAgICAgICAgcmVhZHkuc29ydCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGxldCBtYXhMYXllciA9IDA7XG4gIGZvciAoY29uc3QgaWQgb2Ygb3JkZXIpIHtcbiAgICBjb25zdCBwcmVkZWNlc3NvcnMgPSBpbmNvbWluZy5nZXQoaWQpID8/IFtdO1xuICAgIGNvbnN0IGxheWVyID1cbiAgICAgIHByZWRlY2Vzc29ycy5sZW5ndGggPT09IDBcbiAgICAgICAgPyAwXG4gICAgICAgIDogTWF0aC5tYXgoLi4ucHJlZGVjZXNzb3JzLm1hcCgocHJlZCkgPT4gbGF5ZXJPZi5nZXQocHJlZCkgPz8gMCkpICsgMTtcbiAgICBsYXllck9mLnNldChpZCwgbGF5ZXIpO1xuICAgIG1heExheWVyID0gTWF0aC5tYXgobWF4TGF5ZXIsIGxheWVyKTtcbiAgfVxuXG4gIC8vIE5vZGVzIGluc2lkZSBhIGN5Y2xlIG5ldmVyIHJlYWNoIGluZGVncmVlIDAuIFBsYWNlIHRoZW0gYWZ0ZXIgZXZlcnl0aGluZ1xuICAvLyB0aGF0IGNvdWxkIGJlIG9yZGVyZWQsIHJhdGhlciB0aGFuIGRyb3BwaW5nIHRoZW0uXG4gIGNvbnN0IGN5Y2xpYyA9IG5vZGVJZHMuZmlsdGVyKChpZCkgPT4gIWxheWVyT2YuaGFzKGlkKSkuc29ydCgpO1xuICBmb3IgKGNvbnN0IGlkIG9mIGN5Y2xpYykge1xuICAgIGxheWVyT2Yuc2V0KGlkLCBNYXRoLm1pbihtYXhMYXllciArIDEsIGNvbmZpZy5tYXhMYXllcnMpKTtcbiAgfVxuXG4gIC8qKiBAdHlwZSB7TWFwPG51bWJlciwgc3RyaW5nW10+fSAqL1xuICBjb25zdCBieUxheWVyID0gbmV3IE1hcCgpO1xuICBmb3IgKGNvbnN0IGlkIG9mIG5vZGVJZHMuc2xpY2UoKS5zb3J0KCkpIHtcbiAgICBjb25zdCBsYXllciA9IE1hdGgubWluKGxheWVyT2YuZ2V0KGlkKSA/PyAwLCBjb25maWcubWF4TGF5ZXJzKTtcbiAgICBpZiAoIWJ5TGF5ZXIuaGFzKGxheWVyKSkge1xuICAgICAgYnlMYXllci5zZXQobGF5ZXIsIFtdKTtcbiAgICB9XG4gICAgYnlMYXllci5nZXQobGF5ZXIpPy5wdXNoKGlkKTtcbiAgfVxuXG4gIC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgUG9zaXRpb24+fSAqL1xuICBjb25zdCBwb3NpdGlvbnMgPSB7fTtcbiAgLyoqIEB0eXBlIHtzdHJpbmdbXVtdfSAqL1xuICBjb25zdCBsYXllcnMgPSBbXTtcbiAgbGV0IHRhbGxlc3QgPSAwO1xuXG4gIGZvciAoY29uc3QgbGF5ZXIgb2YgWy4uLmJ5TGF5ZXIua2V5cygpXS5zb3J0KChhLCBiKSA9PiBhIC0gYikpIHtcbiAgICBjb25zdCBpZHMgPSBieUxheWVyLmdldChsYXllcikgPz8gW107XG4gICAgbGF5ZXJzLnB1c2goaWRzKTtcbiAgICBpZHMuZm9yRWFjaCgoaWQsIGluZGV4KSA9PiB7XG4gICAgICBwb3NpdGlvbnNbaWRdID0ge1xuICAgICAgICB4OiBsYXllciAqIChjb25maWcubm9kZVdpZHRoICsgY29uZmlnLmhvcml6b250YWxHYXApLFxuICAgICAgICB5OiBpbmRleCAqIChjb25maWcubm9kZUhlaWdodCArIGNvbmZpZy52ZXJ0aWNhbEdhcCksXG4gICAgICAgIHdpZHRoOiBjb25maWcubm9kZVdpZHRoLFxuICAgICAgICBoZWlnaHQ6IGNvbmZpZy5ub2RlSGVpZ2h0LFxuICAgICAgICBsYXllcixcbiAgICAgIH07XG4gICAgfSk7XG4gICAgdGFsbGVzdCA9IE1hdGgubWF4KHRhbGxlc3QsIGlkcy5sZW5ndGgpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBwb3NpdGlvbnMsXG4gICAgd2lkdGg6IE1hdGgubWF4KDEsIGxheWVycy5sZW5ndGgpICogKGNvbmZpZy5ub2RlV2lkdGggKyBjb25maWcuaG9yaXpvbnRhbEdhcCksXG4gICAgaGVpZ2h0OiBNYXRoLm1heCgxLCB0YWxsZXN0KSAqIChjb25maWcubm9kZUhlaWdodCArIGNvbmZpZy52ZXJ0aWNhbEdhcCksXG4gICAgbGF5ZXJzLFxuICB9O1xufVxuIiwgIi8qKlxuICogTGFuZ3VhZ2UtbmV1dHJhbCBDRkcgdm9jYWJ1bGFyeS5cbiAqXG4gKiBUaGVzZSBuYW1lcyBhcmUgZnJvemVuIGJ5IGBkb2NzL0dSQVBIX1NQRUNJRklDQVRJT04ubWRgLiBBZGFwdGVycyBkZXNjcmliZVxuICogc291cmNlIHN0cnVjdHVyZSB3aXRoIGBDb250cm9sQ29uc3RydWN0YCB0cmVlczsgdGhpcyBtb2R1bGUgb3ducyB0aGUgc21hbGxlclxuICogc2V0IG9mIG5vZGVzIGFuZCBlZGdlcyB0aGUgcmVuZGVyZXIgdW5kZXJzdGFuZHMuXG4gKi9cblxuLyoqIE5vZGUga2luZHMgYSBDRkcgbWF5IGNvbnRhaW4uICovXG5leHBvcnQgY29uc3QgQ0ZHX05PREVfS0lORFMgPSBPYmplY3QuZnJlZXplKFtcbiAgJ2VudHJ5JyxcbiAgJ2V4aXQnLFxuICAnc3RhdGVtZW50JyxcbiAgJ2NvbmRpdGlvbicsXG4gICdtdWx0aXdheScsXG4gICdtZXJnZScsXG4gICdsb29wX2hlYWRlcicsXG4gICdsb29wX2xhdGNoJyxcbiAgJ2xvb3BfYm9keV9lbnRyeScsXG4gICdicmVhaycsXG4gICdjb250aW51ZScsXG4gICdyZXR1cm4nLFxuICAndGhyb3cnLFxuICAnY2FsbCcsXG4gICdhd2FpdCcsXG4gICdjYXRjaF9lbnRyeScsXG4gICdmaW5hbGx5X2VudHJ5JyxcbiAgJ3VucmVhY2hhYmxlJyxcbiAgJ3VubW9kZWxlZCcsXG5dKTtcblxuLyoqIEVkZ2Uga2luZHMgYSBDRkcgbWF5IGNvbnRhaW4uICovXG5leHBvcnQgY29uc3QgQ0ZHX0VER0VfS0lORFMgPSBPYmplY3QuZnJlZXplKFtcbiAgJ3NlcScsXG4gICd0cnVlJyxcbiAgJ2ZhbHNlJyxcbiAgJ2Nhc2UnLFxuICAnZGVmYXVsdCcsXG4gICdsb29wX2JhY2snLFxuICAnYnJlYWsnLFxuICAnY29udGludWUnLFxuICAncmV0dXJuJyxcbiAgJ3Rocm93JyxcbiAgJ2V4Y2VwdGlvbicsXG4gICdmaW5hbGx5JyxcbiAgJ3VucmVhY2hhYmxlJyxcbl0pO1xuXG4vKiogU3RhdHVzZXMgc2hhcmVkIHdpdGggQ1NSIHJlbGF0aW9uc2hpcHMuICovXG5leHBvcnQgY29uc3QgQ0ZHX1NUQVRVU0VTID0gT2JqZWN0LmZyZWV6ZShbXG4gICdyZXNvbHZlZCcsXG4gICdpbmZlcnJlZCcsXG4gICdwb3NzaWJsZScsXG4gICd1bnJlc29sdmVkJyxcbiAgJ3N0YWxlJyxcbl0pO1xuXG4vKiogRGVncmFkYXRpb24gY29kZXMgZW1pdHRlZCBieSB0aGUgYnVpbGRlci4gKi9cbmV4cG9ydCBjb25zdCBDRkdfREVHUkFEQVRJT05fQ09ERVMgPSBPYmplY3QuZnJlZXplKFtcbiAgJ3VubW9kZWxlZF9jb25zdHJ1Y3QnLFxuICAnZ290b19mbG93JyxcbiAgJ2luZGlyZWN0X2dvdG9fZmxvdycsXG4gICdpdGVyYXRpb25fc291cmNlX29wYXF1ZScsXG4gICdjYWxsX3NpdGVfdW5yZWNvcmRlZCcsXG4gICdjb25kaXRpb25fc2hhcGVfdW5tb2RlbGVkJyxcbiAgJ29ycGhhbl9qdW1wJyxcbiAgJ21vZGVsZWRfZXhjZXB0aW9uX3BhdGgnLFxuICAnYW5hbHlzaXNfcGFydGlhbCcsXG4gICd0cnVuY2F0ZWQnLFxuXSk7XG5cbi8qKiBFZGdlIGtpbmRzIHRoYXQgZG8gbm90IGFkdmFuY2UgdGhlIG5vcm1hbCBzdWNjZXNzb3IgcGF0aC4gKi9cbmV4cG9ydCBjb25zdCBBQlJVUFRfRURHRV9LSU5EUyA9IE9iamVjdC5mcmVlemUoWydicmVhaycsICdjb250aW51ZScsICdyZXR1cm4nLCAndGhyb3cnXSk7XG5cbi8qKiBFZGdlcyBleGNsdWRlZCBmcm9tIHJhbmsgY29tcHV0YXRpb24gYmVjYXVzZSB0aGV5IHBvaW50IGJhY2t3YXJkcy4gKi9cbmV4cG9ydCBjb25zdCBCQUNLX0VER0VfS0lORFMgPSBPYmplY3QuZnJlZXplKFsnbG9vcF9iYWNrJywgJ2NvbnRpbnVlJ10pO1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0dXNcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkYXNoRm9yU3RhdHVzKHN0YXR1cykge1xuICBzd2l0Y2ggKHN0YXR1cykge1xuICAgIGNhc2UgJ2luZmVycmVkJzpcbiAgICAgIHJldHVybiAnOCA0JztcbiAgICBjYXNlICdwb3NzaWJsZSc6XG4gICAgICByZXR1cm4gJzMgMyc7XG4gICAgY2FzZSAndW5yZXNvbHZlZCc6XG4gICAgICByZXR1cm4gJzIgNSc7XG4gICAgY2FzZSAnc3RhbGUnOlxuICAgICAgcmV0dXJuICcxIDQnO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJyc7XG4gIH1cbn1cblxuLyoqXG4gKiBOb24tY29sb3VyIGN1ZSBmb3IgYSBzdGF0dXMuIFBoYXNlIDEyIHdpbGwgZXh0ZW5kIHRoaXMgaW50byBhIGZ1bGxcbiAqIGFjY2Vzc2liaWxpdHkgcGFzczsgdGhlIERUTyBhbHJlYWR5IGNhcnJpZXMgdGhlIGZpZWxkLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0dXNcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnbHlwaEZvclN0YXR1cyhzdGF0dXMpIHtcbiAgc3dpdGNoIChzdGF0dXMpIHtcbiAgICBjYXNlICdyZXNvbHZlZCc6XG4gICAgICByZXR1cm4gJ1x1MjVDRic7XG4gICAgY2FzZSAnaW5mZXJyZWQnOlxuICAgICAgcmV0dXJuICdcdTI1RDAnO1xuICAgIGNhc2UgJ3Bvc3NpYmxlJzpcbiAgICAgIHJldHVybiAnXHUyNUNCJztcbiAgICBjYXNlICd1bnJlc29sdmVkJzpcbiAgICAgIHJldHVybiAnXHUyNzE1JztcbiAgICBjYXNlICdzdGFsZSc6XG4gICAgICByZXR1cm4gJ1x1MjJFRic7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAnPyc7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30ga2luZFxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVkZ2VMYWJlbChraW5kLCBleHRyYSA9ICcnKSB7XG4gIGlmIChleHRyYSkge1xuICAgIHJldHVybiBraW5kID09PSAnY2FzZScgPyBgY2FzZSAke2V4dHJhfWAgOiBleHRyYTtcbiAgfVxuICBzd2l0Y2ggKGtpbmQpIHtcbiAgICBjYXNlICdzZXEnOlxuICAgICAgcmV0dXJuICcnO1xuICAgIGNhc2UgJ2xvb3BfYmFjayc6XG4gICAgICByZXR1cm4gJ2xvb3AgYmFjayc7XG4gICAgY2FzZSAnZXhjZXB0aW9uJzpcbiAgICAgIHJldHVybiAnZXhjZXB0aW9uJztcbiAgICBjYXNlICdmaW5hbGx5JzpcbiAgICAgIHJldHVybiAnZmluYWxseSc7XG4gICAgY2FzZSAndW5yZWFjaGFibGUnOlxuICAgICAgcmV0dXJuICd1bnJlYWNoYWJsZSc7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBraW5kO1xuICB9XG59XG4iLCAiLyoqXG4gKiBHcmFwaCB2aWV3LW1vZGVsIChEVE8pLlxuICpcbiAqIFRoZSBEVE8gaXMgdGhlIG9ubHkgZ3JhcGggc2hhcGUgdGhlIHdlYnZpZXcgdW5kZXJzdGFuZHMuIEl0IGlzIHBsYWluIEpTT046XG4gKiBubyBmdW5jdGlvbnMsIG5vIGlkcyB0aGF0IHJlcXVpcmUgYSBsb29rdXAsIG5vIHNvdXJjZSB0ZXh0LlxuICpcbiAqIFNvdXJjZSB0ZXh0IGlzIGZldGNoZWQgb24gZGVtYW5kIGluIFBoYXNlIDUgdGhyb3VnaCBhIHNlcGFyYXRlLCB2YWxpZGF0ZWRcbiAqIHJlcXVlc3QuIEtlZXBpbmcgdGhlIERUTyBmcmVlIG9mIHNvdXJjZSBwcmV2ZW50cyBhY2NpZGVudGFsIGxlYWthZ2UgaW50b1xuICogY2FjaGVzIGFuZCBrZWVwcyBtZXNzYWdlIHNpemVzIHByZWRpY3RhYmxlLlxuICovXG5cbmltcG9ydCB7IGNvbXB1dGVMYXlvdXQgfSBmcm9tICcuL2xheW91dC5qcyc7XG5pbXBvcnQgeyBDRkdfRURHRV9LSU5EUywgQ0ZHX05PREVfS0lORFMsIENGR19TVEFUVVNFUyB9IGZyb20gJy4vY2ZnL2tpbmRzLmpzJztcblxuZXhwb3J0IGNvbnN0IEdSQVBIX0RUT19WRVJTSU9OID0gMTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuL21vZGVsLmpzJykuR3JhcGh9IEdyYXBoXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBEdG9Ob2RlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gaWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBsYWJlbFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGtpbmRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBzdGF0dXNcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBiYWRnZVxuICogQHByb3BlcnR5IHtib29sZWFufSBleHRlcm5hbFxuICogQHByb3BlcnR5IHt7ZmlsZUlkOiBzdHJpbmcsIHN0YXJ0TGluZTogbnVtYmVyLCBlbmRMaW5lOiBudW1iZXJ9IHwgbnVsbH0gcmFuZ2VcbiAqIEBwcm9wZXJ0eSB7e3g6IG51bWJlciwgeTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgbGF5ZXI6IG51bWJlcn19IHBvc2l0aW9uXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBHcmFwaER0b1xuICogQHByb3BlcnR5IHtudW1iZXJ9IGR0b1ZlcnNpb25cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBncmFwaElkXG4gKiBAcHJvcGVydHkge3N0cmluZ30gcnVuSWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBsYW5ndWFnZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGFkYXB0ZXJJZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGNvbXBsZXRlbmVzc1xuICogQHByb3BlcnR5IHtEdG9Ob2RlW119IG5vZGVzXG4gKiBAcHJvcGVydHkge0FycmF5PHtpZDogc3RyaW5nLCBmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcsIHR5cGU6IHN0cmluZywgc3RhdHVzOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcsIHJlYXNvbkNvZGU/OiBzdHJpbmd9Pn0gZWRnZXNcbiAqIEBwcm9wZXJ0eSB7QXJyYXk8e2NvZGU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nLCBzZXZlcml0eTogc3RyaW5nfT59IGRpYWdub3N0aWNzXG4gKiBAcHJvcGVydHkge3N0cmluZ1tdfSBkZWdyYWRhdGlvbnNcbiAqIEBwcm9wZXJ0eSB7e3dpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyfX0gZXh0ZW50XG4gKiBAcHJvcGVydHkge3tzdGF0dXNlczogc3RyaW5nW10sIGtpbmRzOiBzdHJpbmdbXX19IGxlZ2VuZFxuICovXG5cbi8qKlxuICogQHBhcmFtIHtHcmFwaH0gZ3JhcGhcbiAqIEByZXR1cm5zIHtHcmFwaER0b31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvRHRvKGdyYXBoKSB7XG4gIGNvbnN0IGxheW91dCA9IGNvbXB1dGVMYXlvdXQoZ3JhcGgpO1xuXG4gIGNvbnN0IG5vZGVzID0gZ3JhcGgubm9kZXMubWFwKChub2RlKSA9PiAoe1xuICAgIGlkOiBub2RlLmlkLFxuICAgIGxhYmVsOiBub2RlLmxhYmVsLFxuICAgIGtpbmQ6IG5vZGUua2luZCxcbiAgICBzdGF0dXM6IG5vZGUuc3RhdHVzLFxuICAgIGJhZGdlOiBub2RlLmJhZGdlID8/ICcnLFxuICAgIGV4dGVybmFsOiBub2RlLmV4dGVybmFsLFxuICAgIHJhbmdlOiBub2RlLnJhbmdlXG4gICAgICA/IHtcbiAgICAgICAgICBmaWxlSWQ6IG5vZGUucmFuZ2UuZmlsZUlkLFxuICAgICAgICAgIHN0YXJ0TGluZTogbm9kZS5yYW5nZS5zdGFydExpbmUsXG4gICAgICAgICAgZW5kTGluZTogbm9kZS5yYW5nZS5lbmRMaW5lLFxuICAgICAgICB9XG4gICAgICA6IG51bGwsXG4gICAgcG9zaXRpb246IGxheW91dC5wb3NpdGlvbnNbbm9kZS5pZF0gPz8geyB4OiAwLCB5OiAwLCB3aWR0aDogMTkwLCBoZWlnaHQ6IDU0LCBsYXllcjogMCB9LFxuICB9KSk7XG5cbiAgY29uc3Qgc3RhdHVzZXMgPSBbLi4ubmV3IFNldChub2Rlcy5tYXAoKG5vZGUpID0+IG5vZGUuc3RhdHVzKSldLnNvcnQoKTtcbiAgY29uc3Qga2luZHMgPSBbLi4ubmV3IFNldChub2Rlcy5tYXAoKG5vZGUpID0+IG5vZGUua2luZCkpXS5zb3J0KCk7XG5cbiAgcmV0dXJuIHtcbiAgICBkdG9WZXJzaW9uOiBHUkFQSF9EVE9fVkVSU0lPTixcbiAgICBncmFwaElkOiBncmFwaC5ncmFwaElkLFxuICAgIHJ1bklkOiBncmFwaC5ydW5JZCxcbiAgICBsYW5ndWFnZTogZ3JhcGgubGFuZ3VhZ2UsXG4gICAgYWRhcHRlcklkOiBncmFwaC5hZGFwdGVySWQsXG4gICAgY29tcGxldGVuZXNzOiBncmFwaC5jb21wbGV0ZW5lc3MsXG4gICAgbm9kZXMsXG4gICAgZWRnZXM6IGdyYXBoLmVkZ2VzLm1hcCgoZWRnZSkgPT4ge1xuICAgICAgLyoqIEB0eXBlIHt7aWQ6IHN0cmluZywgZnJvbTogc3RyaW5nLCB0bzogc3RyaW5nLCB0eXBlOiBzdHJpbmcsIHN0YXR1czogc3RyaW5nLCBsYWJlbDogc3RyaW5nLCByZWFzb25Db2RlPzogc3RyaW5nfX0gKi9cbiAgICAgIGNvbnN0IGR0b0VkZ2UgPSB7XG4gICAgICAgIGlkOiBlZGdlLmlkLFxuICAgICAgICBmcm9tOiBlZGdlLmZyb20sXG4gICAgICAgIHRvOiBlZGdlLnRvLFxuICAgICAgICB0eXBlOiBlZGdlLnR5cGUsXG4gICAgICAgIHN0YXR1czogZWRnZS5zdGF0dXMsXG4gICAgICAgIGxhYmVsOiBlZGdlLmxhYmVsLFxuICAgICAgfTtcbiAgICAgIC8vIE9taXQgdGhlIGtleSBlbnRpcmVseSB3aGVuIGFic2VudCBzbyB0aGUgRFRPIHN1cnZpdmVzIGEgSlNPTiByb3VuZC10cmlwXG4gICAgICAvLyB1bmNoYW5nZWQgKEpTT04gY2Fubm90IHJlcHJlc2VudCBgdW5kZWZpbmVkYCkuXG4gICAgICBpZiAoZWRnZS5yZWFzb25Db2RlKSB7XG4gICAgICAgIGR0b0VkZ2UucmVhc29uQ29kZSA9IGVkZ2UucmVhc29uQ29kZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkdG9FZGdlO1xuICAgIH0pLFxuICAgIGRpYWdub3N0aWNzOiBncmFwaC5kaWFnbm9zdGljcyxcbiAgICBkZWdyYWRhdGlvbnM6IGdyYXBoLmRlZ3JhZGF0aW9ucyxcbiAgICBleHRlbnQ6IHsgd2lkdGg6IGxheW91dC53aWR0aCwgaGVpZ2h0OiBsYXlvdXQuaGVpZ2h0IH0sXG4gICAgbGVnZW5kOiB7IHN0YXR1c2VzLCBraW5kcyB9LFxuICB9O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gZHRvXG4gKiBAcmV0dXJucyB7e29rOiB0cnVlLCBkdG86IEdyYXBoRHRvfSB8IHtvazogZmFsc2UsIGlzc3Vlczogc3RyaW5nW119fVxuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVEdG8oZHRvKSB7XG4gIC8qKiBAdHlwZSB7c3RyaW5nW119ICovXG4gIGNvbnN0IGlzc3VlcyA9IFtdO1xuICBpZiAodHlwZW9mIGR0byAhPT0gJ29iamVjdCcgfHwgZHRvID09PSBudWxsIHx8IEFycmF5LmlzQXJyYXkoZHRvKSkge1xuICAgIHJldHVybiB7IG9rOiBmYWxzZSwgaXNzdWVzOiBbJ0RUTyBtdXN0IGJlIGFuIG9iamVjdC4nXSB9O1xuICB9XG4gIGNvbnN0IGNhbmRpZGF0ZSA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChkdG8pO1xuICBpZiAoY2FuZGlkYXRlLmR0b1ZlcnNpb24gIT09IEdSQVBIX0RUT19WRVJTSU9OKSB7XG4gICAgaXNzdWVzLnB1c2goYFVuc3VwcG9ydGVkIGR0b1ZlcnNpb246ICR7U3RyaW5nKGNhbmRpZGF0ZS5kdG9WZXJzaW9uKX0uYCk7XG4gIH1cbiAgaWYgKGNhbmRpZGF0ZS5kdG9LaW5kID09PSAnY2ZnJykge1xuICAgIHZhbGlkYXRlQ2ZnRHRvKGNhbmRpZGF0ZSwgaXNzdWVzKTtcbiAgICByZXR1cm4gaXNzdWVzLmxlbmd0aCA+IDBcbiAgICAgID8geyBvazogZmFsc2UsIGlzc3VlcyB9XG4gICAgICA6IHsgb2s6IHRydWUsIGR0bzogLyoqIEB0eXBlIHtHcmFwaER0b30gKi8gKGR0bykgfTtcbiAgfVxuICBjb25zdCBub2RlcyA9IGNhbmRpZGF0ZS5ub2RlcztcbiAgY29uc3QgZWRnZXMgPSBjYW5kaWRhdGUuZWRnZXM7XG4gIGlmICghQXJyYXkuaXNBcnJheShub2RlcykpIHtcbiAgICBpc3N1ZXMucHVzaCgnbm9kZXMgbXVzdCBiZSBhbiBhcnJheS4nKTtcbiAgfVxuICBpZiAoIUFycmF5LmlzQXJyYXkoZWRnZXMpKSB7XG4gICAgaXNzdWVzLnB1c2goJ2VkZ2VzIG11c3QgYmUgYW4gYXJyYXkuJyk7XG4gIH1cbiAgaWYgKEFycmF5LmlzQXJyYXkobm9kZXMpICYmIEFycmF5LmlzQXJyYXkoZWRnZXMpKSB7XG4gICAgY29uc3QgaWRzID0gbmV3IFNldCgpO1xuICAgIGZvciAoY29uc3Qgbm9kZSBvZiBub2Rlcykge1xuICAgICAgY29uc3QgaWQgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAobm9kZSkuaWQ7XG4gICAgICBpZiAodHlwZW9mIGlkICE9PSAnc3RyaW5nJykge1xuICAgICAgICBpc3N1ZXMucHVzaCgnRXZlcnkgbm9kZSBuZWVkcyBhIHN0cmluZyBpZC4nKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoaWRzLmhhcyhpZCkpIHtcbiAgICAgICAgaXNzdWVzLnB1c2goYER1cGxpY2F0ZSBub2RlIGlkIFwiJHtpZH1cIi5gKTtcbiAgICAgIH1cbiAgICAgIGlkcy5hZGQoaWQpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGVkZ2Ugb2YgZWRnZXMpIHtcbiAgICAgIGNvbnN0IHJlY29yZCA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChlZGdlKTtcbiAgICAgIGlmICh0eXBlb2YgcmVjb3JkLmZyb20gIT09ICdzdHJpbmcnIHx8ICFpZHMuaGFzKHJlY29yZC5mcm9tKSkge1xuICAgICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7U3RyaW5nKHJlY29yZC5pZCl9XCIgaGFzIGFuIHVua25vd24gc291cmNlIG5vZGUuYCk7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIHJlY29yZC50byAhPT0gJ3N0cmluZycgfHwgIWlkcy5oYXMocmVjb3JkLnRvKSkge1xuICAgICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7U3RyaW5nKHJlY29yZC5pZCl9XCIgaGFzIGFuIHVua25vd24gdGFyZ2V0IG5vZGUuYCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChpc3N1ZXMubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiB7IG9rOiBmYWxzZSwgaXNzdWVzIH07XG4gIH1cbiAgcmV0dXJuIHsgb2s6IHRydWUsIGR0bzogLyoqIEB0eXBlIHtHcmFwaER0b30gKi8gKGR0bykgfTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBjYW5kaWRhdGVcbiAqIEBwYXJhbSB7c3RyaW5nW119IGlzc3Vlc1xuICovXG5mdW5jdGlvbiB2YWxpZGF0ZUNmZ0R0byhjYW5kaWRhdGUsIGlzc3Vlcykge1xuICBpZiAoY2FuZGlkYXRlLmdyYXBoS2luZCAhPT0gJ2NmZycpIHtcbiAgICBpc3N1ZXMucHVzaCgnQSBDRkcgRFRPIG11c3QgZGVjbGFyZSBncmFwaEtpbmQgXCJjZmdcIi4nKTtcbiAgfVxuICBjb25zdCBmbiA9IGNhbmRpZGF0ZS5mdW5jdGlvbjtcbiAgaWYgKHR5cGVvZiBmbiAhPT0gJ29iamVjdCcgfHwgZm4gPT09IG51bGwgfHwgQXJyYXkuaXNBcnJheShmbikpIHtcbiAgICBpc3N1ZXMucHVzaCgnZnVuY3Rpb24gbXVzdCBiZSBhbiBvYmplY3QuJyk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgcmVjb3JkID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKGZuKTtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBbJ3N5bWJvbElkJywgJ25hbWUnLCAncXVhbGlmaWVkTmFtZScsICdraW5kJ10pIHtcbiAgICAgIGlmICh0eXBlb2YgcmVjb3JkW2tleV0gIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGlzc3Vlcy5wdXNoKGBmdW5jdGlvbi4ke2tleX0gbXVzdCBiZSBhIHN0cmluZy5gKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHJlY29yZC5yYW5nZSAhPT0gbnVsbCAmJiAhaXNSYW5nZVJlZihyZWNvcmQucmFuZ2UpKSB7XG4gICAgICBpc3N1ZXMucHVzaCgnZnVuY3Rpb24ucmFuZ2UgbXVzdCBiZSBhIHJhbmdlIHJlZmVyZW5jZSBvciBudWxsLicpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG5vZGVzID0gY2FuZGlkYXRlLm5vZGVzO1xuICBjb25zdCBlZGdlcyA9IGNhbmRpZGF0ZS5lZGdlcztcbiAgaWYgKCFBcnJheS5pc0FycmF5KG5vZGVzKSkge1xuICAgIGlzc3Vlcy5wdXNoKCdub2RlcyBtdXN0IGJlIGFuIGFycmF5LicpO1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoIUFycmF5LmlzQXJyYXkoZWRnZXMpKSB7XG4gICAgaXNzdWVzLnB1c2goJ2VkZ2VzIG11c3QgYmUgYW4gYXJyYXkuJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgaWRzID0gbmV3IFNldCgpO1xuICAvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuICBjb25zdCBlbnRyeUlkcyA9IFtdO1xuICAvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuICBjb25zdCBleGl0SWRzID0gW107XG4gIGZvciAoY29uc3QgZW50cnkgb2Ygbm9kZXMpIHtcbiAgICBpZiAodHlwZW9mIGVudHJ5ICE9PSAnb2JqZWN0JyB8fCBlbnRyeSA9PT0gbnVsbCB8fCBBcnJheS5pc0FycmF5KGVudHJ5KSkge1xuICAgICAgaXNzdWVzLnB1c2goJ0V2ZXJ5IG5vZGUgbXVzdCBiZSBhbiBvYmplY3QuJyk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3Qgbm9kZSA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChlbnRyeSk7XG4gICAgY29uc3QgaWQgPSBub2RlLmlkO1xuICAgIGlmICh0eXBlb2YgaWQgIT09ICdzdHJpbmcnKSB7XG4gICAgICBpc3N1ZXMucHVzaCgnRXZlcnkgbm9kZSBuZWVkcyBhIHN0cmluZyBpZC4nKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoaWRzLmhhcyhpZCkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBEdXBsaWNhdGUgbm9kZSBpZCBcIiR7aWR9XCIuYCk7XG4gICAgfVxuICAgIGlkcy5hZGQoaWQpO1xuICAgIGlmICghQ0ZHX05PREVfS0lORFMuaW5jbHVkZXMoU3RyaW5nKG5vZGUua2luZCkpKSB7XG4gICAgICBpc3N1ZXMucHVzaChgTm9kZSBcIiR7aWR9XCIgaGFzIHVua25vd24ga2luZCBcIiR7U3RyaW5nKG5vZGUua2luZCl9XCIuYCk7XG4gICAgfVxuICAgIGlmICghQ0ZHX1NUQVRVU0VTLmluY2x1ZGVzKFN0cmluZyhub2RlLnN0YXR1cykpKSB7XG4gICAgICBpc3N1ZXMucHVzaChgTm9kZSBcIiR7aWR9XCIgaGFzIHVua25vd24gc3RhdHVzIFwiJHtTdHJpbmcobm9kZS5zdGF0dXMpfVwiLmApO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG5vZGUubGFiZWwgIT09ICdzdHJpbmcnKSB7XG4gICAgICBpc3N1ZXMucHVzaChgTm9kZSBcIiR7aWR9XCIgbmVlZHMgYSBzdHJpbmcgbGFiZWwuYCk7XG4gICAgfVxuICAgIGlmICghQXJyYXkuaXNBcnJheShub2RlLmxhYmVsTGluZXMpIHx8IG5vZGUubGFiZWxMaW5lcy5zb21lKChsaW5lKSA9PiB0eXBlb2YgbGluZSAhPT0gJ3N0cmluZycpKSB7XG4gICAgICBpc3N1ZXMucHVzaChgTm9kZSBcIiR7aWR9XCIgbmVlZHMgc3RyaW5nIGxhYmVsTGluZXMuYCk7XG4gICAgfVxuICAgIGlmIChub2RlLnJhbmdlICE9PSBudWxsICYmICFpc1JhbmdlUmVmKG5vZGUucmFuZ2UpKSB7XG4gICAgICBpc3N1ZXMucHVzaChgTm9kZSBcIiR7aWR9XCIgaGFzIGFuIGludmFsaWQgcmFuZ2UgcmVmZXJlbmNlLmApO1xuICAgIH1cbiAgICBpZiAoIWlzUG9zaXRpb24obm9kZS5wb3NpdGlvbikpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBOb2RlIFwiJHtpZH1cIiBoYXMgYW4gaW52YWxpZCBwb3NpdGlvbi5gKTtcbiAgICB9XG4gICAgaWYgKG5vZGUua2luZCA9PT0gJ2VudHJ5Jykge1xuICAgICAgZW50cnlJZHMucHVzaChpZCk7XG4gICAgfVxuICAgIGlmIChub2RlLmtpbmQgPT09ICdleGl0Jykge1xuICAgICAgZXhpdElkcy5wdXNoKGlkKTtcbiAgICB9XG4gICAgaWYgKG5vZGUuY2FsbHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KG5vZGUuY2FsbHMpKSB7XG4gICAgICAgIGlzc3Vlcy5wdXNoKGBOb2RlIFwiJHtpZH1cIiBjYWxscyBtdXN0IGJlIGFuIGFycmF5IHdoZW4gcHJlc2VudC5gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoY29uc3QgY2FsbCBvZiBub2RlLmNhbGxzKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgdHlwZW9mIGNhbGwgIT09ICdvYmplY3QnIHx8XG4gICAgICAgICAgICBjYWxsID09PSBudWxsIHx8XG4gICAgICAgICAgICB0eXBlb2YgY2FsbC50byAhPT0gJ3N0cmluZycgfHxcbiAgICAgICAgICAgIHR5cGVvZiBjYWxsLmxhYmVsICE9PSAnc3RyaW5nJyB8fFxuICAgICAgICAgICAgIUNGR19TVEFUVVNFUy5pbmNsdWRlcyhTdHJpbmcoY2FsbC5zdGF0dXMpKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgaXNzdWVzLnB1c2goYE5vZGUgXCIke2lkfVwiIGhhcyBhbiBpbnZhbGlkIGNhbGwgdGFyZ2V0LmApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAoZW50cnlJZHMubGVuZ3RoICE9PSAxKSB7XG4gICAgaXNzdWVzLnB1c2goYEEgQ0ZHIG5lZWRzIGV4YWN0bHkgb25lIGVudHJ5IG5vZGU7IGZvdW5kICR7ZW50cnlJZHMubGVuZ3RofS5gKTtcbiAgfVxuICBpZiAoZXhpdElkcy5sZW5ndGggIT09IDEpIHtcbiAgICBpc3N1ZXMucHVzaChgQSBDRkcgbmVlZHMgZXhhY3RseSBvbmUgZXhpdCBub2RlOyBmb3VuZCAke2V4aXRJZHMubGVuZ3RofS5gKTtcbiAgfVxuICBpZiAoY2FuZGlkYXRlLmVudHJ5SWQgIT09IGVudHJ5SWRzWzBdKSB7XG4gICAgaXNzdWVzLnB1c2goJ2VudHJ5SWQgbXVzdCByZWZlcmVuY2UgdGhlIGVudHJ5IG5vZGUuJyk7XG4gIH1cbiAgaWYgKGNhbmRpZGF0ZS5leGl0SWQgIT09IGV4aXRJZHNbMF0pIHtcbiAgICBpc3N1ZXMucHVzaCgnZXhpdElkIG11c3QgcmVmZXJlbmNlIHRoZSBleGl0IG5vZGUuJyk7XG4gIH1cblxuICBjb25zdCBlZGdlSWRzID0gbmV3IFNldCgpO1xuICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVkZ2VzKSB7XG4gICAgaWYgKHR5cGVvZiBlbnRyeSAhPT0gJ29iamVjdCcgfHwgZW50cnkgPT09IG51bGwgfHwgQXJyYXkuaXNBcnJheShlbnRyeSkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKCdFdmVyeSBlZGdlIG11c3QgYmUgYW4gb2JqZWN0LicpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IGVkZ2UgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAoZW50cnkpO1xuICAgIGNvbnN0IGlkID0gZWRnZS5pZDtcbiAgICBpZiAodHlwZW9mIGlkICE9PSAnc3RyaW5nJykge1xuICAgICAgaXNzdWVzLnB1c2goJ0V2ZXJ5IGVkZ2UgbmVlZHMgYSBzdHJpbmcgaWQuJyk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGVkZ2VJZHMuaGFzKGlkKSkge1xuICAgICAgaXNzdWVzLnB1c2goYER1cGxpY2F0ZSBlZGdlIGlkIFwiJHtpZH1cIi5gKTtcbiAgICB9XG4gICAgZWRnZUlkcy5hZGQoaWQpO1xuICAgIGlmICh0eXBlb2YgZWRnZS5mcm9tICE9PSAnc3RyaW5nJyB8fCAhaWRzLmhhcyhlZGdlLmZyb20pKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7aWR9XCIgaGFzIGFuIHVua25vd24gc291cmNlIG5vZGUuYCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgZWRnZS50byAhPT0gJ3N0cmluZycgfHwgIWlkcy5oYXMoZWRnZS50bykpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBFZGdlIFwiJHtpZH1cIiBoYXMgYW4gdW5rbm93biB0YXJnZXQgbm9kZS5gKTtcbiAgICB9XG4gICAgaWYgKCFDRkdfRURHRV9LSU5EUy5pbmNsdWRlcyhTdHJpbmcoZWRnZS5raW5kKSkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBFZGdlIFwiJHtpZH1cIiBoYXMgdW5rbm93biBraW5kIFwiJHtTdHJpbmcoZWRnZS5raW5kKX1cIi5gKTtcbiAgICB9XG4gICAgaWYgKCFDRkdfU1RBVFVTRVMuaW5jbHVkZXMoU3RyaW5nKGVkZ2Uuc3RhdHVzKSkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBFZGdlIFwiJHtpZH1cIiBoYXMgdW5rbm93biBzdGF0dXMgXCIke1N0cmluZyhlZGdlLnN0YXR1cyl9XCIuYCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgZWRnZS5sYWJlbCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBFZGdlIFwiJHtpZH1cIiBuZWVkcyBhIHN0cmluZyBsYWJlbC5gKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBlZGdlLmRhc2ggIT09ICdzdHJpbmcnIHx8IHR5cGVvZiBlZGdlLmdseXBoSGludCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBFZGdlIFwiJHtpZH1cIiBuZWVkcyBzdHJpbmcgZGFzaCBhbmQgZ2x5cGhIaW50IGZpZWxkcy5gKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBkZWdyYWRhdGlvbnMgPSBjYW5kaWRhdGUuZGVncmFkYXRpb25zO1xuICBpZiAoIUFycmF5LmlzQXJyYXkoZGVncmFkYXRpb25zKSkge1xuICAgIGlzc3Vlcy5wdXNoKCdkZWdyYWRhdGlvbnMgbXVzdCBiZSBhbiBhcnJheS4nKTtcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGRlZ3JhZGF0aW9ucykge1xuICAgICAgaWYgKFxuICAgICAgICB0eXBlb2YgZW50cnkgIT09ICdvYmplY3QnIHx8XG4gICAgICAgIGVudHJ5ID09PSBudWxsIHx8XG4gICAgICAgIHR5cGVvZiBlbnRyeS5jb2RlICE9PSAnc3RyaW5nJyB8fFxuICAgICAgICB0eXBlb2YgZW50cnkubWVzc2FnZSAhPT0gJ3N0cmluZycgfHxcbiAgICAgICAgIVsnaW5mbycsICd3YXJuaW5nJywgJ2Vycm9yJ10uaW5jbHVkZXMoU3RyaW5nKGVudHJ5LnNldmVyaXR5KSlcbiAgICAgICkge1xuICAgICAgICBpc3N1ZXMucHVzaCgnRXZlcnkgZGVncmFkYXRpb24gbmVlZHMgYSBjb2RlLCBtZXNzYWdlIGFuZCBzZXZlcml0eS4nKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCBleHRlbnQgPSBjYW5kaWRhdGUuZXh0ZW50O1xuICBpZiAoXG4gICAgdHlwZW9mIGV4dGVudCAhPT0gJ29iamVjdCcgfHxcbiAgICBleHRlbnQgPT09IG51bGwgfHxcbiAgICAhTnVtYmVyLmlzRmluaXRlKGV4dGVudC53aWR0aCkgfHxcbiAgICAhTnVtYmVyLmlzRmluaXRlKGV4dGVudC5oZWlnaHQpXG4gICkge1xuICAgIGlzc3Vlcy5wdXNoKCdleHRlbnQgbXVzdCBjYXJyeSBmaW5pdGUgd2lkdGggYW5kIGhlaWdodC4nKTtcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBpc1JhbmdlUmVmKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnIHx8IHZhbHVlID09PSBudWxsIHx8IEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IHJhbmdlID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKHZhbHVlKTtcbiAgcmV0dXJuIChcbiAgICB0eXBlb2YgcmFuZ2UuZmlsZUlkID09PSAnc3RyaW5nJyAmJlxuICAgIE51bWJlci5pc0ludGVnZXIocmFuZ2Uuc3RhcnRMaW5lKSAmJlxuICAgIE51bWJlci5pc0ludGVnZXIocmFuZ2Uuc3RhcnRDb2x1bW4pICYmXG4gICAgTnVtYmVyLmlzSW50ZWdlcihyYW5nZS5lbmRMaW5lKSAmJlxuICAgIE51bWJlci5pc0ludGVnZXIocmFuZ2UuZW5kQ29sdW1uKSAmJlxuICAgIHJhbmdlLnN0YXJ0TGluZSA+PSAwICYmXG4gICAgcmFuZ2Uuc3RhcnRDb2x1bW4gPj0gMCAmJlxuICAgIHJhbmdlLmVuZExpbmUgPj0gMCAmJlxuICAgIHJhbmdlLmVuZENvbHVtbiA+PSAwXG4gICk7XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGlzUG9zaXRpb24odmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcgfHwgdmFsdWUgPT09IG51bGwgfHwgQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgcG9zaXRpb24gPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAodmFsdWUpO1xuICByZXR1cm4gKFxuICAgIE51bWJlci5pc0Zpbml0ZShwb3NpdGlvbi54KSAmJlxuICAgIE51bWJlci5pc0Zpbml0ZShwb3NpdGlvbi55KSAmJlxuICAgIE51bWJlci5pc0Zpbml0ZShwb3NpdGlvbi53aWR0aCkgJiZcbiAgICBOdW1iZXIuaXNGaW5pdGUocG9zaXRpb24uaGVpZ2h0KSAmJlxuICAgIE51bWJlci5pc0ludGVnZXIocG9zaXRpb24ubGF5ZXIpXG4gICk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtHcmFwaER0b30gZHRvXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplRHRvKGR0bykge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoZHRvKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30ganNvblxuICogQHJldHVybnMge0dyYXBoRHRvfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VEdG8oanNvbikge1xuICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGpzb24pO1xuICBjb25zdCB2YWxpZGF0aW9uID0gdmFsaWRhdGVEdG8ocGFyc2VkKTtcbiAgaWYgKCF2YWxpZGF0aW9uLm9rKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGdyYXBoIERUTzogJHt2YWxpZGF0aW9uLmlzc3Vlcy5qb2luKCc7ICcpfWApO1xuICB9XG4gIHJldHVybiB2YWxpZGF0aW9uLmR0bztcbn1cbiIsICIvKipcbiAqIFNWRyByZW5kZXJlci5cbiAqXG4gKiBQaGFzZSAwIHJlbmRlcmVyOiBkZXRlcm1pbmlzdGljIGxheWVyZWQgcG9zaXRpb25zIGNvbWUgZnJvbSB0aGUgRFRPLCBzbyB0aGlzXG4gKiBtb2R1bGUgb25seSBkcmF3cy4gSXQgaGFzIG5vIGtub3dsZWRnZSBvZiBhbmFseXNpcywgYWRhcHRlcnMsIG9yIHRoZSBwcm90b2NvbC5cbiAqXG4gKiBLZXB0IGJlaGluZCBhIHNtYWxsIGludGVyZmFjZSAoYHJlbmRlcmAsIGBzZWxlY3RgLCBgZGVzdHJveWApIGJlY2F1c2UgUGhhc2UgNFxuICogYmVuY2htYXJrcyBDeXRvc2NhcGUvRUxLIGFuZCBtYXkgcmVwbGFjZSB0aGUgaW1wbGVtZW50YXRpb24uIENhbGxlcnMgbXVzdCBub3RcbiAqIGRlcGVuZCBvbiBTVkcgaW50ZXJuYWxzLlxuICovXG5cbmNvbnN0IFNWR19OUyA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG5cbi8qKlxuICogQHR5cGVkZWYge2ltcG9ydCgnLi4vLi4vY29yZS9ncmFwaC9kdG8uanMnKS5HcmFwaER0b30gR3JhcGhEdG9cbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4uLy4uL2NvcmUvZ3JhcGgvZHRvLmpzJykuRHRvTm9kZX0gRHRvTm9kZVxuICovXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgc3RyaW5nIHwgbnVtYmVyPn0gW2F0dHJpYnV0ZXNdXG4gKiBAcmV0dXJucyB7U1ZHRWxlbWVudH1cbiAqL1xuZnVuY3Rpb24gc3ZnRWwobmFtZSwgYXR0cmlidXRlcyA9IHt9KSB7XG4gIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoU1ZHX05TLCBuYW1lKTtcbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoYXR0cmlidXRlcykpIHtcbiAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShrZXksIFN0cmluZyh2YWx1ZSkpO1xuICB9XG4gIHJldHVybiBlbGVtZW50O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICogQHBhcmFtIHtudW1iZXJ9IG1heFxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gdHJ1bmNhdGUodmFsdWUsIG1heCkge1xuICBjb25zdCB0ZXh0ID0gU3RyaW5nKHZhbHVlID8/ICcnKTtcbiAgcmV0dXJuIHRleHQubGVuZ3RoID4gbWF4ID8gYCR7dGV4dC5zbGljZSgwLCBtYXggLSAxKX1cdTIwMjZgIDogdGV4dDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3tcbiAqICAgc3ZnOiBTVkdTVkdFbGVtZW50LFxuICogICBvblNlbGVjdDogKG5vZGVJZDogc3RyaW5nLCBub2RlOiBEdG9Ob2RlKSA9PiB2b2lkLFxuICogICBvbk5hdmlnYXRlPzogKG5vZGVJZDogc3RyaW5nLCBub2RlOiBEdG9Ob2RlLCB0cmlnZ2VyPzogJ3BvaW50ZXInfCdrZXlib2FyZCcpID0+IHZvaWQsXG4gKiAgIG9uUHJldmlld0VudGVyPzogKG5vZGVJZDogc3RyaW5nLCBub2RlOiBEdG9Ob2RlLCBwb2ludDoge3g6IG51bWJlciwgeTogbnVtYmVyfSkgPT4gdm9pZCxcbiAqICAgb25QcmV2aWV3TW92ZT86IChwb2ludDoge3g6IG51bWJlciwgeTogbnVtYmVyfSkgPT4gdm9pZCxcbiAqICAgb25QcmV2aWV3TGVhdmU/OiAobm9kZUlkOiBzdHJpbmcpID0+IHZvaWQsXG4gKiAgIG9uUHJldmlld0tleT86IChub2RlSWQ6IHN0cmluZywgbm9kZTogRHRvTm9kZSkgPT4gdm9pZCxcbiAqIH19IG9wdGlvbnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVN2Z1JlbmRlcmVyKG9wdGlvbnMpIHtcbiAgY29uc3QgeyBzdmcsIG9uU2VsZWN0IH0gPSBvcHRpb25zO1xuICAvKiogQHR5cGUge0dyYXBoRHRvIHwgbnVsbH0gKi9cbiAgbGV0IGR0byA9IG51bGw7XG4gIC8qKiBAdHlwZSB7U1ZHR0VsZW1lbnQgfCBudWxsfSAqL1xuICBsZXQgdmlld3BvcnQgPSBudWxsO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIFNWR0dFbGVtZW50Pn0gKi9cbiAgY29uc3Qgbm9kZUVsZW1lbnRzID0gbmV3IE1hcCgpO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIFNWR1BhdGhFbGVtZW50Pn0gKi9cbiAgY29uc3QgZWRnZUVsZW1lbnRzID0gbmV3IE1hcCgpO1xuICAvKiogQHR5cGUge3N0cmluZyB8IG51bGx9ICovXG4gIGxldCBzZWxlY3RlZElkID0gbnVsbDtcblxuICBsZXQgc2NhbGUgPSAxO1xuICBsZXQgdHJhbnNsYXRlWCA9IDA7XG4gIGxldCB0cmFuc2xhdGVZID0gMDtcbiAgbGV0IGRyYWdnaW5nID0gZmFsc2U7XG4gIGxldCBkcmFnU3RhcnQgPSB7IHg6IDAsIHk6IDAsIHR4OiAwLCB0eTogMCB9O1xuXG4gIGZ1bmN0aW9uIGFwcGx5VHJhbnNmb3JtKCkge1xuICAgIGlmICh2aWV3cG9ydCkge1xuICAgICAgdmlld3BvcnQuc2V0QXR0cmlidXRlKFxuICAgICAgICAndHJhbnNmb3JtJyxcbiAgICAgICAgYHRyYW5zbGF0ZSgke3RyYW5zbGF0ZVgudG9GaXhlZCgyKX0gJHt0cmFuc2xhdGVZLnRvRml4ZWQoMil9KSBzY2FsZSgke3NjYWxlLnRvRml4ZWQoMyl9KWAsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG5vZGVQb2ludChub2RlLCBzaWRlKSB7XG4gICAgaWYgKHNpZGUgPT09ICdvdXQnKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB4OiBub2RlLnBvc2l0aW9uLnggKyBub2RlLnBvc2l0aW9uLndpZHRoLFxuICAgICAgICB5OiBub2RlLnBvc2l0aW9uLnkgKyBub2RlLnBvc2l0aW9uLmhlaWdodCAvIDIsXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4geyB4OiBub2RlLnBvc2l0aW9uLngsIHk6IG5vZGUucG9zaXRpb24ueSArIG5vZGUucG9zaXRpb24uaGVpZ2h0IC8gMiB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZWRnZVBhdGgoc291cmNlLCB0YXJnZXQpIHtcbiAgICBpZiAoc291cmNlLmlkID09PSB0YXJnZXQuaWQpIHtcbiAgICAgIGNvbnN0IHsgeCwgeSwgd2lkdGgsIGhlaWdodCB9ID0gc291cmNlLnBvc2l0aW9uO1xuICAgICAgY29uc3QgY3ggPSB4ICsgd2lkdGggLyAyO1xuICAgICAgY29uc3Qgc3RhcnRZID0geSAtIDI7XG4gICAgICByZXR1cm4gYE0gJHtjeH0gJHtzdGFydFl9IEMgJHtjeCAtIDQ2fSAke3kgLSA2MH0sICR7Y3ggKyA0Nn0gJHt5IC0gNjB9LCAke2N4fSAke3kgKyBoZWlnaHQgKyAyfWA7XG4gICAgfVxuICAgIGNvbnN0IGZyb20gPSBub2RlUG9pbnQoc291cmNlLCAnb3V0Jyk7XG4gICAgY29uc3QgdG8gPSBub2RlUG9pbnQodGFyZ2V0LCAnaW4nKTtcbiAgICBjb25zdCBiZW5kID0gTWF0aC5tYXgoMzYsIE1hdGguYWJzKHRvLnggLSBmcm9tLngpIC8gMik7XG4gICAgcmV0dXJuIGBNICR7ZnJvbS54fSAke2Zyb20ueX0gQyAke2Zyb20ueCArIGJlbmR9ICR7ZnJvbS55fSwgJHt0by54IC0gYmVuZH0gJHt0by55fSwgJHt0by54fSAke3RvLnl9YDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIGlmICh2aWV3cG9ydCkge1xuICAgICAgc3ZnLnJlbW92ZUNoaWxkKHZpZXdwb3J0KTtcbiAgICB9XG4gICAgdmlld3BvcnQgPSBzdmdFbCgnZycsIHsgY2xhc3M6ICdjZi12aWV3cG9ydCcgfSk7XG4gICAgc3ZnLmFwcGVuZENoaWxkKHZpZXdwb3J0KTtcbiAgICBub2RlRWxlbWVudHMuY2xlYXIoKTtcbiAgICBlZGdlRWxlbWVudHMuY2xlYXIoKTtcbiAgICBzZWxlY3RlZElkID0gbnVsbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbGVjdChub2RlSWQpIHtcbiAgICBzZWxlY3RlZElkID0gbm9kZUlkO1xuICAgIGZvciAoY29uc3QgW2lkLCBlbGVtZW50XSBvZiBub2RlRWxlbWVudHMpIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZSgnaXMtc2VsZWN0ZWQnLCBpZCA9PT0gbm9kZUlkKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBbLCBlbGVtZW50XSBvZiBlZGdlRWxlbWVudHMpIHtcbiAgICAgIGNvbnN0IGFjdGl2ZSA9XG4gICAgICAgIG5vZGVJZCAhPT0gbnVsbCAmJiAoZWxlbWVudC5kYXRhc2V0LmZyb20gPT09IG5vZGVJZCB8fCBlbGVtZW50LmRhdGFzZXQudG8gPT09IG5vZGVJZCk7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoJ2lzLWFjdGl2ZScsIGFjdGl2ZSk7XG4gICAgfVxuICAgIGlmIChzZWxlY3RlZElkICYmIG5vZGVFbGVtZW50cy5oYXMoc2VsZWN0ZWRJZCkpIHtcbiAgICAgIGNvbnN0IG5vZGUgPSAvKiogQHR5cGUge0R0b05vZGV9ICovIChkdG8/Lm5vZGVzLmZpbmQoKGl0ZW0pID0+IGl0ZW0uaWQgPT09IHNlbGVjdGVkSWQpKTtcbiAgICAgIG9uU2VsZWN0KHNlbGVjdGVkSWQsIG5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHpvb21Ub0ZpdCgpIHtcbiAgICBpZiAoIWR0byB8fCAhdmlld3BvcnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgYm91bmRzID0gc3ZnLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IHBhZGRpbmcgPSA0ODtcbiAgICBjb25zdCB3aWR0aCA9IE1hdGgubWF4KDEsIGR0by5leHRlbnQud2lkdGgpO1xuICAgIGNvbnN0IGhlaWdodCA9IE1hdGgubWF4KDEsIGR0by5leHRlbnQuaGVpZ2h0KTtcbiAgICBjb25zdCBhdmFpbGFibGVXaWR0aCA9IE1hdGgubWF4KDEyMCwgYm91bmRzLndpZHRoIC0gcGFkZGluZyAqIDIpO1xuICAgIGNvbnN0IGF2YWlsYWJsZUhlaWdodCA9IE1hdGgubWF4KDEyMCwgYm91bmRzLmhlaWdodCAtIHBhZGRpbmcgKiAyKTtcbiAgICBzY2FsZSA9IE1hdGgubWluKDEuNCwgYXZhaWxhYmxlV2lkdGggLyB3aWR0aCwgYXZhaWxhYmxlSGVpZ2h0IC8gaGVpZ2h0KTtcbiAgICBzY2FsZSA9IE1hdGgubWF4KDAuMTUsIHNjYWxlKTtcbiAgICB0cmFuc2xhdGVYID0gKGJvdW5kcy53aWR0aCAtIHdpZHRoICogc2NhbGUpIC8gMjtcbiAgICB0cmFuc2xhdGVZID0gKGJvdW5kcy5oZWlnaHQgLSBoZWlnaHQgKiBzY2FsZSkgLyAyO1xuICAgIGFwcGx5VHJhbnNmb3JtKCk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtHcmFwaER0b30gbmV4dER0b1xuICAgKi9cbiAgZnVuY3Rpb24gcmVuZGVyKG5leHREdG8pIHtcbiAgICBkdG8gPSBuZXh0RHRvO1xuICAgIGNsZWFyKCk7XG4gICAgaWYgKCF2aWV3cG9ydCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGJ5SWQgPSBuZXcgTWFwKGR0by5ub2Rlcy5tYXAoKG5vZGUpID0+IFtub2RlLmlkLCBub2RlXSkpO1xuXG4gICAgZm9yIChjb25zdCBlZGdlIG9mIGR0by5lZGdlcykge1xuICAgICAgY29uc3Qgc291cmNlID0gYnlJZC5nZXQoZWRnZS5mcm9tKTtcbiAgICAgIGNvbnN0IHRhcmdldCA9IGJ5SWQuZ2V0KGVkZ2UudG8pO1xuICAgICAgaWYgKCFzb3VyY2UgfHwgIXRhcmdldCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhdGggPSAvKiogQHR5cGUge1NWR1BhdGhFbGVtZW50fSAqLyAoXG4gICAgICAgIHN2Z0VsKCdwYXRoJywge1xuICAgICAgICAgIGNsYXNzOiBgY2YtZWRnZSBjZi1lZGdlLS0ke2VkZ2Uuc3RhdHVzfSBjZi1lZGdlLS1raW5kLSR7ZWRnZS5raW5kID8/IGVkZ2UudHlwZX1gLFxuICAgICAgICAgIGQ6IGVkZ2VQYXRoKHNvdXJjZSwgdGFyZ2V0KSxcbiAgICAgICAgICAnZGF0YS1mcm9tJzogZWRnZS5mcm9tLFxuICAgICAgICAgICdkYXRhLXRvJzogZWRnZS50byxcbiAgICAgICAgICAuLi4oZWRnZS5kYXNoID8geyAnc3Ryb2tlLWRhc2hhcnJheSc6IGVkZ2UuZGFzaCB9IDoge30pLFxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICAgIHBhdGguZGF0YXNldC5mcm9tID0gZWRnZS5mcm9tO1xuICAgICAgcGF0aC5kYXRhc2V0LnRvID0gZWRnZS50bztcbiAgICAgIGNvbnN0IHRpdGxlID0gc3ZnRWwoJ3RpdGxlJyk7XG4gICAgICB0aXRsZS50ZXh0Q29udGVudCA9IGAke2VkZ2Uua2luZCA/PyBlZGdlLnR5cGV9ICgke2VkZ2Uuc3RhdHVzfSkke1xuICAgICAgICBlZGdlLnJlYXNvbkNvZGUgPyBgOiAke2VkZ2UucmVhc29uQ29kZX1gIDogJydcbiAgICAgIH0ke2VkZ2UuZ2x5cGhIaW50ID8gYCAke2VkZ2UuZ2x5cGhIaW50fWAgOiAnJ31gO1xuICAgICAgcGF0aC5hcHBlbmRDaGlsZCh0aXRsZSk7XG4gICAgICB2aWV3cG9ydC5hcHBlbmRDaGlsZChwYXRoKTtcbiAgICAgIGVkZ2VFbGVtZW50cy5zZXQoZWRnZS5pZCwgcGF0aCk7XG5cbiAgICAgIGlmIChlZGdlLmxhYmVsICYmIGVkZ2UubGFiZWwubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBmcm9tID0gbm9kZVBvaW50KHNvdXJjZSwgJ291dCcpO1xuICAgICAgICBjb25zdCB0byA9IG5vZGVQb2ludCh0YXJnZXQsICdpbicpO1xuICAgICAgICBjb25zdCBsYWJlbCA9IHN2Z0VsKCd0ZXh0Jywge1xuICAgICAgICAgIGNsYXNzOiAnY2YtZWRnZS1sYWJlbCcsXG4gICAgICAgICAgeDogKGZyb20ueCArIHRvLngpIC8gMixcbiAgICAgICAgICB5OiAoZnJvbS55ICsgdG8ueSkgLyAyIC0gNCxcbiAgICAgICAgICAndGV4dC1hbmNob3InOiAnbWlkZGxlJyxcbiAgICAgICAgfSk7XG4gICAgICAgIGxhYmVsLnRleHRDb250ZW50ID0gdHJ1bmNhdGUoZWRnZS5sYWJlbCwgMjIpO1xuICAgICAgICB2aWV3cG9ydC5hcHBlbmRDaGlsZChsYWJlbCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBub2RlIG9mIGR0by5ub2Rlcykge1xuICAgICAgY29uc3QgZ3JvdXAgPSAvKiogQHR5cGUge1NWR0dFbGVtZW50fSAqLyAoXG4gICAgICAgIHN2Z0VsKCdnJywge1xuICAgICAgICAgIGNsYXNzOiBgY2Ytbm9kZSBjZi1ub2RlLS0ke25vZGUuc3RhdHVzfSBjZi1ub2RlLS1raW5kLSR7bm9kZS5raW5kfSR7XG4gICAgICAgICAgICBub2RlLmV4dGVybmFsID8gJyBjZi1ub2RlLS1leHRlcm5hbCcgOiAnJ1xuICAgICAgICAgIH0ke25vZGUudW5yZWFjaGFibGUgPyAnIGNmLW5vZGUtLXVucmVhY2hhYmxlJyA6ICcnfWAsXG4gICAgICAgICAgdHJhbnNmb3JtOiBgdHJhbnNsYXRlKCR7bm9kZS5wb3NpdGlvbi54fSAke25vZGUucG9zaXRpb24ueX0pYCxcbiAgICAgICAgICB0YWJpbmRleDogJzAnLFxuICAgICAgICAgIHJvbGU6ICdidXR0b24nLFxuICAgICAgICAgICdhcmlhLWxhYmVsJzogYCR7bm9kZS5raW5kfSAke25vZGUubGFiZWx9LCAke25vZGUuc3RhdHVzfSR7XG4gICAgICAgICAgICBub2RlLnVucmVhY2hhYmxlID8gJywgdW5yZWFjaGFibGUnIDogJydcbiAgICAgICAgICB9JHtub2RlLmV4dGVybmFsID8gJywgZXh0ZXJuYWwgdGFyZ2V0JyA6ICcnfWAsXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICBncm91cC5hcHBlbmRDaGlsZChcbiAgICAgICAgc3ZnRWwoJ3JlY3QnLCB7XG4gICAgICAgICAgY2xhc3M6ICdjZi1ub2RlLWJveCcsXG4gICAgICAgICAgd2lkdGg6IG5vZGUucG9zaXRpb24ud2lkdGgsXG4gICAgICAgICAgaGVpZ2h0OiBub2RlLnBvc2l0aW9uLmhlaWdodCxcbiAgICAgICAgICByeDogNixcbiAgICAgICAgICByeTogNixcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgICBjb25zdCBsaW5lcyA9XG4gICAgICAgIEFycmF5LmlzQXJyYXkobm9kZS5sYWJlbExpbmVzKSAmJiBub2RlLmxhYmVsTGluZXMubGVuZ3RoID4gMFxuICAgICAgICAgID8gbm9kZS5sYWJlbExpbmVzLnNsaWNlKDAsIDMpXG4gICAgICAgICAgOiBbdHJ1bmNhdGUobm9kZS5sYWJlbCwgMjYpXTtcbiAgICAgIGNvbnN0IGxpbmVIZWlnaHQgPSAxMztcbiAgICAgIGNvbnN0IGJsb2NrSGVpZ2h0ID0gbGluZXMubGVuZ3RoICogbGluZUhlaWdodDtcbiAgICAgIGNvbnN0IGxhYmVsID0gc3ZnRWwoJ3RleHQnLCB7XG4gICAgICAgIGNsYXNzOiAnY2Ytbm9kZS1sYWJlbCcsXG4gICAgICAgIHg6IDEwLFxuICAgICAgICB5OiBub2RlLnBvc2l0aW9uLmhlaWdodCAvIDIgLSBibG9ja0hlaWdodCAvIDIgKyBsaW5lSGVpZ2h0IC0gMyxcbiAgICAgIH0pO1xuICAgICAgZm9yIChjb25zdCBbaW5kZXgsIHRleHRdIG9mIGxpbmVzLmVudHJpZXMoKSkge1xuICAgICAgICBjb25zdCBzcGFuID0gc3ZnRWwoJ3RzcGFuJywge1xuICAgICAgICAgIHg6IDEwLFxuICAgICAgICAgIC4uLihpbmRleCA9PT0gMCA/IHt9IDogeyBkeTogbGluZUhlaWdodCB9KSxcbiAgICAgICAgfSk7XG4gICAgICAgIHNwYW4udGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgICBsYWJlbC5hcHBlbmRDaGlsZChzcGFuKTtcbiAgICAgIH1cbiAgICAgIGdyb3VwLmFwcGVuZENoaWxkKGxhYmVsKTtcblxuICAgICAgY29uc3Qga2luZCA9IHN2Z0VsKCd0ZXh0Jywge1xuICAgICAgICBjbGFzczogJ2NmLW5vZGUta2luZCcsXG4gICAgICAgIHg6IDEwLFxuICAgICAgICB5OiBub2RlLnBvc2l0aW9uLmhlaWdodCAtIDgsXG4gICAgICB9KTtcbiAgICAgIGtpbmQudGV4dENvbnRlbnQgPSBub2RlLmV4dGVybmFsID8gYCR7bm9kZS5raW5kfSBcdTAwQjcgZXh0ZXJuYWxgIDogbm9kZS5raW5kO1xuICAgICAgZ3JvdXAuYXBwZW5kQ2hpbGQoa2luZCk7XG5cbiAgICAgIGNvbnN0IGJhZGdlVGV4dCA9XG4gICAgICAgIEFycmF5LmlzQXJyYXkobm9kZS5iYWRnZXMpICYmIG5vZGUuYmFkZ2VzLmxlbmd0aCA+IDBcbiAgICAgICAgICA/IG5vZGUuYmFkZ2VzLmpvaW4oJyBcdTAwQjcgJylcbiAgICAgICAgICA6IG5vZGUuYmFkZ2UgfHwgKG5vZGUuc3RhdHVzICE9PSAncmVzb2x2ZWQnID8gbm9kZS5zdGF0dXMgOiAnJyk7XG4gICAgICBpZiAoYmFkZ2VUZXh0KSB7XG4gICAgICAgIGNvbnN0IGJhZGdlID0gc3ZnRWwoJ3RleHQnLCB7XG4gICAgICAgICAgY2xhc3M6ICdjZi1ub2RlLWJhZGdlJyxcbiAgICAgICAgICB4OiBub2RlLnBvc2l0aW9uLndpZHRoIC0gOCxcbiAgICAgICAgICB5OiAxMyxcbiAgICAgICAgICAndGV4dC1hbmNob3InOiAnZW5kJyxcbiAgICAgICAgfSk7XG4gICAgICAgIGJhZGdlLnRleHRDb250ZW50ID0gdHJ1bmNhdGUoYmFkZ2VUZXh0LCAyNCk7XG4gICAgICAgIGdyb3VwLmFwcGVuZENoaWxkKGJhZGdlKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdGl0bGUgPSBzdmdFbCgndGl0bGUnKTtcbiAgICAgIGNvbnN0IGNhbGxUZXh0ID1cbiAgICAgICAgQXJyYXkuaXNBcnJheShub2RlLmNhbGxzKSAmJiBub2RlLmNhbGxzLmxlbmd0aCA+IDBcbiAgICAgICAgICA/IGBcXG5jYWxsczogJHtub2RlLmNhbGxzLm1hcCgoY2FsbCkgPT4gYCR7Y2FsbC5sYWJlbH0gKCR7Y2FsbC5zdGF0dXN9KWApLmpvaW4oJywgJyl9YFxuICAgICAgICAgIDogJyc7XG4gICAgICB0aXRsZS50ZXh0Q29udGVudCA9IGAke25vZGUua2luZH0gJHtub2RlLmxhYmVsfVxcbnN0YXR1czogJHtub2RlLnN0YXR1c30ke1xuICAgICAgICBub2RlLnJhbmdlID8gYFxcbmxpbmVzICR7bm9kZS5yYW5nZS5zdGFydExpbmUgKyAxfS0ke25vZGUucmFuZ2UuZW5kTGluZSArIDF9YCA6ICcnXG4gICAgICB9JHtub2RlLnJlYXNvbkNvZGUgPyBgXFxucmVhc29uOiAke25vZGUucmVhc29uQ29kZX1gIDogJyd9JHtjYWxsVGV4dH1gO1xuICAgICAgZ3JvdXAuYXBwZW5kQ2hpbGQodGl0bGUpO1xuXG4gICAgICBncm91cC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgc2VsZWN0KG5vZGUuaWQpO1xuICAgICAgfSk7XG4gICAgICBncm91cC5hZGRFdmVudExpc3RlbmVyKCdkYmxjbGljaycsIChldmVudCkgPT4ge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgc2VsZWN0KG5vZGUuaWQpO1xuICAgICAgICBvcHRpb25zLm9uTmF2aWdhdGU/Lihub2RlLmlkLCBub2RlLCAncG9pbnRlcicpO1xuICAgICAgfSk7XG4gICAgICBncm91cC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyZW50ZXInLCAoZXZlbnQpID0+IHtcbiAgICAgICAgb3B0aW9ucy5vblByZXZpZXdFbnRlcj8uKG5vZGUuaWQsIG5vZGUsIHsgeDogZXZlbnQuY2xpZW50WCwgeTogZXZlbnQuY2xpZW50WSB9KTtcbiAgICAgIH0pO1xuICAgICAgZ3JvdXAuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcm1vdmUnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgb3B0aW9ucy5vblByZXZpZXdNb3ZlPy4oeyB4OiBldmVudC5jbGllbnRYLCB5OiBldmVudC5jbGllbnRZIH0pO1xuICAgICAgfSk7XG4gICAgICBncm91cC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybGVhdmUnLCAoKSA9PiB7XG4gICAgICAgIG9wdGlvbnMub25QcmV2aWV3TGVhdmU/Lihub2RlLmlkKTtcbiAgICAgIH0pO1xuICAgICAgZ3JvdXAuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoZXZlbnQua2V5ID09PSAnRW50ZXInKSB7XG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBzZWxlY3Qobm9kZS5pZCk7XG4gICAgICAgICAgb3B0aW9ucy5vbk5hdmlnYXRlPy4obm9kZS5pZCwgbm9kZSwgJ2tleWJvYXJkJyk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChldmVudC5rZXkgPT09ICcgJyB8fCBldmVudC5rZXkgPT09ICdTcGFjZWJhcicpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGlmIChldmVudC5zaGlmdEtleSkge1xuICAgICAgICAgICAgb3B0aW9ucy5vblByZXZpZXdLZXk/Lihub2RlLmlkLCBub2RlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZWN0KG5vZGUuaWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gJ2gnIHx8IGV2ZW50LmtleSA9PT0gJ0gnKSB7XG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBvcHRpb25zLm9uUHJldmlld0tleT8uKG5vZGUuaWQsIG5vZGUpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgdmlld3BvcnQuYXBwZW5kQ2hpbGQoZ3JvdXApO1xuICAgICAgbm9kZUVsZW1lbnRzLnNldChub2RlLmlkLCBncm91cCk7XG4gICAgfVxuXG4gICAgem9vbVRvRml0KCk7XG4gIH1cblxuICBmdW5jdGlvbiBtb3ZlU2VsZWN0aW9uKGRpcmVjdGlvbikge1xuICAgIGlmICghZHRvIHx8IGR0by5ub2Rlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgY3VycmVudCA9IHNlbGVjdGVkSWQgPyBkdG8ubm9kZXMuZmluZCgobm9kZSkgPT4gbm9kZS5pZCA9PT0gc2VsZWN0ZWRJZCkgOiBudWxsO1xuICAgIGlmICghY3VycmVudCkge1xuICAgICAgY29uc3QgZmlyc3QgPSBkdG8ubm9kZXNbMF07XG4gICAgICBzZWxlY3QoZmlyc3QuaWQpO1xuICAgICAgbm9kZUVsZW1lbnRzLmdldChmaXJzdC5pZCk/LmZvY3VzKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IG9yaWdpbiA9IHtcbiAgICAgIHg6IGN1cnJlbnQucG9zaXRpb24ueCArIGN1cnJlbnQucG9zaXRpb24ud2lkdGggLyAyLFxuICAgICAgeTogY3VycmVudC5wb3NpdGlvbi55ICsgY3VycmVudC5wb3NpdGlvbi5oZWlnaHQgLyAyLFxuICAgIH07XG5cbiAgICBsZXQgYmVzdCA9IG51bGw7XG4gICAgbGV0IGJlc3RTY29yZSA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgICBmb3IgKGNvbnN0IGNhbmRpZGF0ZSBvZiBkdG8ubm9kZXMpIHtcbiAgICAgIGlmIChjYW5kaWRhdGUuaWQgPT09IGN1cnJlbnQuaWQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBwb2ludCA9IHtcbiAgICAgICAgeDogY2FuZGlkYXRlLnBvc2l0aW9uLnggKyBjYW5kaWRhdGUucG9zaXRpb24ud2lkdGggLyAyLFxuICAgICAgICB5OiBjYW5kaWRhdGUucG9zaXRpb24ueSArIGNhbmRpZGF0ZS5wb3NpdGlvbi5oZWlnaHQgLyAyLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IGR4ID0gcG9pbnQueCAtIG9yaWdpbi54O1xuICAgICAgY29uc3QgZHkgPSBwb2ludC55IC0gb3JpZ2luLnk7XG4gICAgICBjb25zdCBmb3J3YXJkID1cbiAgICAgICAgKGRpcmVjdGlvbiA9PT0gJ0Fycm93UmlnaHQnICYmIGR4ID4gOCkgfHxcbiAgICAgICAgKGRpcmVjdGlvbiA9PT0gJ0Fycm93TGVmdCcgJiYgZHggPCAtOCkgfHxcbiAgICAgICAgKGRpcmVjdGlvbiA9PT0gJ0Fycm93RG93bicgJiYgZHkgPiA4KSB8fFxuICAgICAgICAoZGlyZWN0aW9uID09PSAnQXJyb3dVcCcgJiYgZHkgPCAtOCk7XG4gICAgICBpZiAoIWZvcndhcmQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBwcmltYXJ5ID1cbiAgICAgICAgZGlyZWN0aW9uID09PSAnQXJyb3dSaWdodCcgfHwgZGlyZWN0aW9uID09PSAnQXJyb3dMZWZ0JyA/IE1hdGguYWJzKGR4KSA6IE1hdGguYWJzKGR5KTtcbiAgICAgIGNvbnN0IHNlY29uZGFyeSA9XG4gICAgICAgIGRpcmVjdGlvbiA9PT0gJ0Fycm93UmlnaHQnIHx8IGRpcmVjdGlvbiA9PT0gJ0Fycm93TGVmdCcgPyBNYXRoLmFicyhkeSkgOiBNYXRoLmFicyhkeCk7XG4gICAgICBjb25zdCBzY29yZSA9IHByaW1hcnkgKyBzZWNvbmRhcnkgKiAyLjI7XG4gICAgICBpZiAoc2NvcmUgPCBiZXN0U2NvcmUpIHtcbiAgICAgICAgYmVzdFNjb3JlID0gc2NvcmU7XG4gICAgICAgIGJlc3QgPSBjYW5kaWRhdGU7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChiZXN0KSB7XG4gICAgICBzZWxlY3QoYmVzdC5pZCk7XG4gICAgICBub2RlRWxlbWVudHMuZ2V0KGJlc3QuaWQpPy5mb2N1cygpO1xuICAgIH1cbiAgfVxuXG4gIHN2Zy5hZGRFdmVudExpc3RlbmVyKFxuICAgICd3aGVlbCcsXG4gICAgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoIWR0bykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgY29uc3QgYm91bmRzID0gc3ZnLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgY29uc3QgcG9pbnRlclggPSBldmVudC5jbGllbnRYIC0gYm91bmRzLmxlZnQ7XG4gICAgICBjb25zdCBwb2ludGVyWSA9IGV2ZW50LmNsaWVudFkgLSBib3VuZHMudG9wO1xuICAgICAgY29uc3QgZmFjdG9yID0gZXZlbnQuZGVsdGFZIDwgMCA/IDEuMTIgOiAxIC8gMS4xMjtcbiAgICAgIGNvbnN0IG5leHRTY2FsZSA9IE1hdGgubWluKDMuNSwgTWF0aC5tYXgoMC4xMiwgc2NhbGUgKiBmYWN0b3IpKTtcbiAgICAgIGNvbnN0IHJhdGlvID0gbmV4dFNjYWxlIC8gc2NhbGU7XG4gICAgICB0cmFuc2xhdGVYID0gcG9pbnRlclggLSAocG9pbnRlclggLSB0cmFuc2xhdGVYKSAqIHJhdGlvO1xuICAgICAgdHJhbnNsYXRlWSA9IHBvaW50ZXJZIC0gKHBvaW50ZXJZIC0gdHJhbnNsYXRlWSkgKiByYXRpbztcbiAgICAgIHNjYWxlID0gbmV4dFNjYWxlO1xuICAgICAgYXBwbHlUcmFuc2Zvcm0oKTtcbiAgICB9LFxuICAgIHsgcGFzc2l2ZTogZmFsc2UgfSxcbiAgKTtcblxuICBzdmcuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmRvd24nLCAoZXZlbnQpID0+IHtcbiAgICBpZiAoZXZlbnQuYnV0dG9uICE9PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWdnaW5nID0gdHJ1ZTtcbiAgICBkcmFnU3RhcnQgPSB7IHg6IGV2ZW50LmNsaWVudFgsIHk6IGV2ZW50LmNsaWVudFksIHR4OiB0cmFuc2xhdGVYLCB0eTogdHJhbnNsYXRlWSB9O1xuICAgIHN2Zy5zZXRQb2ludGVyQ2FwdHVyZShldmVudC5wb2ludGVySWQpO1xuICB9KTtcbiAgc3ZnLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgKGV2ZW50KSA9PiB7XG4gICAgaWYgKCFkcmFnZ2luZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0cmFuc2xhdGVYID0gZHJhZ1N0YXJ0LnR4ICsgKGV2ZW50LmNsaWVudFggLSBkcmFnU3RhcnQueCk7XG4gICAgdHJhbnNsYXRlWSA9IGRyYWdTdGFydC50eSArIChldmVudC5jbGllbnRZIC0gZHJhZ1N0YXJ0LnkpO1xuICAgIGFwcGx5VHJhbnNmb3JtKCk7XG4gIH0pO1xuICBjb25zdCBlbmREcmFnID0gKGV2ZW50KSA9PiB7XG4gICAgZHJhZ2dpbmcgPSBmYWxzZTtcbiAgICBpZiAoc3ZnLmhhc1BvaW50ZXJDYXB0dXJlKGV2ZW50LnBvaW50ZXJJZCkpIHtcbiAgICAgIHN2Zy5yZWxlYXNlUG9pbnRlckNhcHR1cmUoZXZlbnQucG9pbnRlcklkKTtcbiAgICB9XG4gIH07XG4gIHN2Zy5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVydXAnLCBlbmREcmFnKTtcbiAgc3ZnLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJjYW5jZWwnLCBlbmREcmFnKTtcblxuICBzdmcuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgaWYgKHNlbGVjdGVkSWQpIHtcbiAgICAgIHNlbGVjdChudWxsKTtcbiAgICB9XG4gIH0pO1xuXG4gIHN2Zy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGV2ZW50KSA9PiB7XG4gICAgaWYgKGV2ZW50LmtleS5zdGFydHNXaXRoKCdBcnJvdycpKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgbW92ZVNlbGVjdGlvbihldmVudC5rZXkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZXZlbnQua2V5ID09PSAnKycgfHwgZXZlbnQua2V5ID09PSAnPScpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBzY2FsZSA9IE1hdGgubWluKDMuNSwgc2NhbGUgKiAxLjE1KTtcbiAgICAgIGFwcGx5VHJhbnNmb3JtKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChldmVudC5rZXkgPT09ICctJykge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHNjYWxlID0gTWF0aC5tYXgoMC4xMiwgc2NhbGUgLyAxLjE1KTtcbiAgICAgIGFwcGx5VHJhbnNmb3JtKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChldmVudC5rZXkgPT09ICcwJykge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHpvb21Ub0ZpdCgpO1xuICAgIH1cbiAgfSk7XG5cbiAgLyoqXG4gICAqIEVkaXRvci1kcml2ZW4gaGlnaGxpZ2h0LiBEaXN0aW5jdCBmcm9tIHNlbGVjdGlvbiBzbyB0eXBpbmcgaW4gdGhlIGVkaXRvclxuICAgKiBuZXZlciBzdGVhbHMgZ3JhcGggZm9jdXMgb3IgcmV3cml0ZXMgdGhlIGRldGFpbCBwYW5lbC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gbm9kZUlkc1xuICAgKi9cbiAgZnVuY3Rpb24gaGlnaGxpZ2h0KG5vZGVJZHMpIHtcbiAgICBjb25zdCB3YW50ZWQgPSBuZXcgU2V0KEFycmF5LmlzQXJyYXkobm9kZUlkcykgPyBub2RlSWRzIDogW10pO1xuICAgIGZvciAoY29uc3QgW2lkLCBlbGVtZW50XSBvZiBub2RlRWxlbWVudHMpIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZSgnaXMtc3luY2VkJywgd2FudGVkLmhhcyhpZCkpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IFssIGVsZW1lbnRdIG9mIGVkZ2VFbGVtZW50cykge1xuICAgICAgY29uc3QgYWN0aXZlID1cbiAgICAgICAgd2FudGVkLnNpemUgPiAwICYmXG4gICAgICAgICh3YW50ZWQuaGFzKGVsZW1lbnQuZGF0YXNldC5mcm9tID8/ICcnKSB8fCB3YW50ZWQuaGFzKGVsZW1lbnQuZGF0YXNldC50byA/PyAnJykpO1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKCdpcy1zeW5jZWQnLCBhY3RpdmUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBub2RlSWRzXG4gICAqL1xuICBmdW5jdGlvbiBtYXJrU3RhbGUobm9kZUlkcykge1xuICAgIGNvbnN0IHdhbnRlZCA9IG5ldyBTZXQoQXJyYXkuaXNBcnJheShub2RlSWRzKSA/IG5vZGVJZHMgOiBbXSk7XG4gICAgZm9yIChjb25zdCBbaWQsIGVsZW1lbnRdIG9mIG5vZGVFbGVtZW50cykge1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKCdpcy1zdGFsZScsIHdhbnRlZC5oYXMoaWQpKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBmb2N1c1NlbGVjdGlvbigpIHtcbiAgICBpZiAoc2VsZWN0ZWRJZCkge1xuICAgICAgbm9kZUVsZW1lbnRzLmdldChzZWxlY3RlZElkKT8uZm9jdXMoKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHJlbmRlcixcbiAgICBzZWxlY3QsXG4gICAgaGlnaGxpZ2h0LFxuICAgIG1hcmtTdGFsZSxcbiAgICBmb2N1c1NlbGVjdGlvbixcbiAgICB6b29tVG9GaXQsXG4gICAgZGVzdHJveSgpIHtcbiAgICAgIGNsZWFyKCk7XG4gICAgICBkdG8gPSBudWxsO1xuICAgIH0sXG4gIH07XG59XG4iLCAiLyoqXG4gKiBTb3VyY2UgcmFuZ2UgdmFsaWRhdGlvbiBhbmQgc2xpY2luZy5cbiAqXG4gKiBUaGVzZSBoZWxwZXJzIGFyZSBwdXJlIGFuZCBob3N0LWluZGVwZW5kZW50LiBUaGUgZXh0ZW5zaW9uIGhvc3Qgc3VwcGxpZXMgdGhlXG4gKiByZWFsIGRvY3VtZW50IHRleHQgYW5kIHZlcnNpb247IHRoZSB3ZWJ2aWV3IGFuZCB0aGUgdGVzdHMgdXNlIHRoZSBzYW1lIHJhbmdlXG4gKiBydWxlcy4gTm90aGluZyBoZXJlIHJlYWRzIGEgZmlsZSBvciBhc3NlbWJsZXMgc291cmNlIGZyb20gYW4gQVNULlxuICovXG5cbi8qKiBEZWZhdWx0IHNsaWNlIGxpbWl0cyBmcm9tIHRoZSBQaGFzZSA1IGNvbnRyYWN0LiAqL1xuZXhwb3J0IGNvbnN0IFNPVVJDRV9MSU1JVFMgPSBPYmplY3QuZnJlZXplKHtcbiAgbWF4TGluZXM6IDEyLFxuICBtaW5MaW5lczogNCxcbiAgbWF4TGluZXNMaW1pdDogNDAsXG4gIG1heEJ5dGVzOiA2NV81MzYsXG4gIG1heFJhbmdlczogMl8wMDAsXG59KTtcblxuY29uc3QgSU5URUdFUl9GSUVMRFMgPSBbJ3N0YXJ0TGluZScsICdzdGFydENvbHVtbicsICdlbmRMaW5lJywgJ2VuZENvbHVtbiddO1xuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEByZXR1cm5zIHt2YWx1ZSBpcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn1cbiAqL1xuZnVuY3Rpb24gaXNSZWNvcmQodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpO1xufVxuXG4vKipcbiAqIFZhbGlkYXRlIHRoZSB3aXJlIHNoYXBlIG9mIGEgcmFuZ2UgcmVmZXJlbmNlLiBUaGlzIGRvZXMgbm90IGtub3cgdGhlXG4gKiBkb2N1bWVudDsgYHJhbmdlV2l0aGluRG9jdW1lbnRgIGRvZXMgdGhhdC5cbiAqXG4gKiBAcGFyYW0ge3Vua25vd259IHJhd1xuICogQHJldHVybnMge3tvazogdHJ1ZSwgdmFsdWU6IFJlY29yZDxzdHJpbmcsIGFueT59IHwge29rOiBmYWxzZSwgY29kZTogJ0VfUkFOR0UnLCBpc3N1ZXM6IHN0cmluZ1tdfX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVJhbmdlUmVmKHJhdykge1xuICBpZiAoIWlzUmVjb3JkKHJhdykpIHtcbiAgICByZXR1cm4geyBvazogZmFsc2UsIGNvZGU6ICdFX1JBTkdFJywgaXNzdWVzOiBbJ3JhbmdlIG11c3QgYmUgYW4gb2JqZWN0LiddIH07XG4gIH1cbiAgLyoqIEB0eXBlIHtzdHJpbmdbXX0gKi9cbiAgY29uc3QgaXNzdWVzID0gW107XG4gIGlmICh0eXBlb2YgcmF3LmZpbGVJZCAhPT0gJ3N0cmluZycgfHwgcmF3LmZpbGVJZC5sZW5ndGggPT09IDAgfHwgcmF3LmZpbGVJZC5sZW5ndGggPiA1MTIpIHtcbiAgICBpc3N1ZXMucHVzaCgnZmlsZUlkIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nLicpO1xuICB9XG4gIGZvciAoY29uc3Qga2V5IG9mIElOVEVHRVJfRklFTERTKSB7XG4gICAgY29uc3QgdmFsdWUgPSByYXdba2V5XTtcbiAgICBpZiAoIU51bWJlci5pc0ludGVnZXIodmFsdWUpIHx8IE51bWJlcih2YWx1ZSkgPCAwKSB7XG4gICAgICBpc3N1ZXMucHVzaChgJHtrZXl9IG11c3QgYmUgYSBub24tbmVnYXRpdmUgaW50ZWdlci5gKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzc3Vlcy5sZW5ndGggPT09IDApIHtcbiAgICBjb25zdCBzdGFydExpbmUgPSBOdW1iZXIocmF3LnN0YXJ0TGluZSk7XG4gICAgY29uc3Qgc3RhcnRDb2x1bW4gPSBOdW1iZXIocmF3LnN0YXJ0Q29sdW1uKTtcbiAgICBjb25zdCBlbmRMaW5lID0gTnVtYmVyKHJhdy5lbmRMaW5lKTtcbiAgICBjb25zdCBlbmRDb2x1bW4gPSBOdW1iZXIocmF3LmVuZENvbHVtbik7XG4gICAgaWYgKHN0YXJ0TGluZSA+IGVuZExpbmUgfHwgKHN0YXJ0TGluZSA9PT0gZW5kTGluZSAmJiBzdGFydENvbHVtbiA+IGVuZENvbHVtbikpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKCdyYW5nZSBzdGFydCBtdXN0IG5vdCBjb21lIGFmdGVyIHJhbmdlIGVuZC4nKTtcbiAgICB9XG4gIH1cbiAgZm9yIChjb25zdCBrZXkgb2YgWydzdGFydE9mZnNldCcsICdlbmRPZmZzZXQnXSkge1xuICAgIGlmIChyYXdba2V5XSAhPT0gdW5kZWZpbmVkICYmICghTnVtYmVyLmlzSW50ZWdlcihyYXdba2V5XSkgfHwgTnVtYmVyKHJhd1trZXldKSA8IDApKSB7XG4gICAgICBpc3N1ZXMucHVzaChgJHtrZXl9IG11c3QgYmUgYSBub24tbmVnYXRpdmUgaW50ZWdlciB3aGVuIHByZXNlbnQuYCk7XG4gICAgfVxuICB9XG4gIGlmIChpc3N1ZXMubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiB7IG9rOiBmYWxzZSwgY29kZTogJ0VfUkFOR0UnLCBpc3N1ZXMgfTtcbiAgfVxuICByZXR1cm4ge1xuICAgIG9rOiB0cnVlLFxuICAgIHZhbHVlOiB7XG4gICAgICBmaWxlSWQ6IFN0cmluZyhyYXcuZmlsZUlkKSxcbiAgICAgIHN0YXJ0TGluZTogTnVtYmVyKHJhdy5zdGFydExpbmUpLFxuICAgICAgc3RhcnRDb2x1bW46IE51bWJlcihyYXcuc3RhcnRDb2x1bW4pLFxuICAgICAgZW5kTGluZTogTnVtYmVyKHJhdy5lbmRMaW5lKSxcbiAgICAgIGVuZENvbHVtbjogTnVtYmVyKHJhdy5lbmRDb2x1bW4pLFxuICAgICAgLi4uKE51bWJlci5pc0ludGVnZXIocmF3LnN0YXJ0T2Zmc2V0KSA/IHsgc3RhcnRPZmZzZXQ6IE51bWJlcihyYXcuc3RhcnRPZmZzZXQpIH0gOiB7fSksXG4gICAgICAuLi4oTnVtYmVyLmlzSW50ZWdlcihyYXcuZW5kT2Zmc2V0KSA/IHsgZW5kT2Zmc2V0OiBOdW1iZXIocmF3LmVuZE9mZnNldCkgfSA6IHt9KSxcbiAgICB9LFxuICB9O1xufVxuXG4vKipcbiAqIE9mZnNldHMgb2YgdGhlIGZpcnN0IGNoYXJhY3RlciBvZiBldmVyeSBsaW5lLiBIYW5kbGVzIENSTEYsIENSIGFuZCBMRi5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dFxuICogQHJldHVybnMge251bWJlcltdfVxuICovXG5leHBvcnQgZnVuY3Rpb24gbGluZVN0YXJ0cyh0ZXh0KSB7XG4gIGNvbnN0IHN0YXJ0cyA9IFswXTtcbiAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHRleHQubGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgY29uc3QgY29kZSA9IHRleHQuY2hhckNvZGVBdChpbmRleCk7XG4gICAgaWYgKGNvZGUgPT09IDEwKSB7XG4gICAgICBzdGFydHMucHVzaChpbmRleCArIDEpO1xuICAgIH0gZWxzZSBpZiAoY29kZSA9PT0gMTMpIHtcbiAgICAgIGlmICh0ZXh0LmNoYXJDb2RlQXQoaW5kZXggKyAxKSA9PT0gMTApIHtcbiAgICAgICAgaW5kZXggKz0gMTtcbiAgICAgIH1cbiAgICAgIHN0YXJ0cy5wdXNoKGluZGV4ICsgMSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdGFydHM7XG59XG5cbi8qKlxuICogRG9jdW1lbnQgZmFjdHMgdGhlIHZhbGlkYXRvciBuZWVkcy4gYGxpbmVMZW5ndGhgIGV4Y2x1ZGVzIHRoZSBsaW5lIGVuZGluZy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dFxuICogQHJldHVybnMge3tsaW5lQ291bnQ6IG51bWJlciwgbGluZUxlbmd0aDogKGxpbmU6IG51bWJlcikgPT4gbnVtYmVyLCBzdGFydHM6IG51bWJlcltdfX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZURvY3VtZW50Vmlldyh0ZXh0KSB7XG4gIGNvbnN0IHN0YXJ0cyA9IGxpbmVTdGFydHModGV4dCk7XG4gIHJldHVybiB7XG4gICAgbGluZUNvdW50OiBzdGFydHMubGVuZ3RoLFxuICAgIHN0YXJ0cyxcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gbGluZVxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAgICovXG4gICAgbGluZUxlbmd0aChsaW5lKSB7XG4gICAgICBpZiAobGluZSA8IDAgfHwgbGluZSA+PSBzdGFydHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiAtMTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHN0YXJ0ID0gc3RhcnRzW2xpbmVdO1xuICAgICAgbGV0IGVuZCA9IGxpbmUgKyAxIDwgc3RhcnRzLmxlbmd0aCA/IHN0YXJ0c1tsaW5lICsgMV0gOiB0ZXh0Lmxlbmd0aDtcbiAgICAgIGlmIChlbmQgPiBzdGFydCAmJiB0ZXh0LmNoYXJDb2RlQXQoZW5kIC0gMSkgPT09IDEwKSB7XG4gICAgICAgIGVuZCAtPSAxO1xuICAgICAgfVxuICAgICAgaWYgKGVuZCA+IHN0YXJ0ICYmIHRleHQuY2hhckNvZGVBdChlbmQgLSAxKSA9PT0gMTMpIHtcbiAgICAgICAgZW5kIC09IDE7XG4gICAgICB9XG4gICAgICByZXR1cm4gZW5kIC0gc3RhcnQ7XG4gICAgfSxcbiAgfTtcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSBhIG5vcm1hbGl6ZWQgcmFuZ2UgYWdhaW5zdCBhIGRvY3VtZW50LiBOb3RoaW5nIGlzIGNsYW1wZWQ6IGFuXG4gKiBvdXQtb2YtYm91bmRzIHJhbmdlIGlzIHJlamVjdGVkIHNvIGEgcHJldmlldyBjYW4gbmV2ZXIgc2lsZW50bHkgc2hvdyB0aGVcbiAqIHdyb25nIHRleHQuXG4gKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSByYW5nZVxuICogQHBhcmFtIHt7bGluZUNvdW50OiBudW1iZXIsIGxpbmVMZW5ndGg6IChsaW5lOiBudW1iZXIpID0+IG51bWJlcn19IGRvY3VtZW50XG4gKiBAcmV0dXJucyB7e29rOiB0cnVlfSB8IHtvazogZmFsc2UsIGNvZGU6ICdFX1JBTkdFJywgaXNzdWVzOiBzdHJpbmdbXX19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByYW5nZVdpdGhpbkRvY3VtZW50KHJhbmdlLCBkb2N1bWVudCkge1xuICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplUmFuZ2VSZWYocmFuZ2UpO1xuICBpZiAoIW5vcm1hbGl6ZWQub2spIHtcbiAgICByZXR1cm4gbm9ybWFsaXplZDtcbiAgfVxuICBjb25zdCB2YWx1ZSA9IG5vcm1hbGl6ZWQudmFsdWU7XG4gIC8qKiBAdHlwZSB7c3RyaW5nW119ICovXG4gIGNvbnN0IGlzc3VlcyA9IFtdO1xuICBjb25zdCBsaW5lQ291bnQgPSBOdW1iZXIoZG9jdW1lbnQ/LmxpbmVDb3VudCk7XG4gIGlmICghTnVtYmVyLmlzSW50ZWdlcihsaW5lQ291bnQpIHx8IGxpbmVDb3VudCA8IDEpIHtcbiAgICByZXR1cm4geyBvazogZmFsc2UsIGNvZGU6ICdFX1JBTkdFJywgaXNzdWVzOiBbJ2RvY3VtZW50IGxpbmUgY291bnQgaXMgdW5rbm93bi4nXSB9O1xuICB9XG4gIGlmICh2YWx1ZS5lbmRMaW5lID49IGxpbmVDb3VudCkge1xuICAgIGlzc3Vlcy5wdXNoKGBlbmRMaW5lICR7dmFsdWUuZW5kTGluZX0gaXMgYmV5b25kIHRoZSBkb2N1bWVudCAoJHtsaW5lQ291bnR9IGxpbmVzKS5gKTtcbiAgfVxuICBpZiAoaXNzdWVzLmxlbmd0aCA9PT0gMCAmJiB0eXBlb2YgZG9jdW1lbnQubGluZUxlbmd0aCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNvbnN0IHN0YXJ0TGVuZ3RoID0gZG9jdW1lbnQubGluZUxlbmd0aCh2YWx1ZS5zdGFydExpbmUpO1xuICAgIGNvbnN0IGVuZExlbmd0aCA9IGRvY3VtZW50LmxpbmVMZW5ndGgodmFsdWUuZW5kTGluZSk7XG4gICAgaWYgKHN0YXJ0TGVuZ3RoIDwgMCB8fCB2YWx1ZS5zdGFydENvbHVtbiA+IHN0YXJ0TGVuZ3RoKSB7XG4gICAgICBpc3N1ZXMucHVzaChcbiAgICAgICAgYHN0YXJ0Q29sdW1uICR7dmFsdWUuc3RhcnRDb2x1bW59IGlzIGJleW9uZCBsaW5lICR7dmFsdWUuc3RhcnRMaW5lfSAoJHtzdGFydExlbmd0aH0gY29sdW1ucykuYCxcbiAgICAgICk7XG4gICAgfVxuICAgIGlmIChlbmRMZW5ndGggPCAwIHx8IHZhbHVlLmVuZENvbHVtbiA+IGVuZExlbmd0aCkge1xuICAgICAgaXNzdWVzLnB1c2goXG4gICAgICAgIGBlbmRDb2x1bW4gJHt2YWx1ZS5lbmRDb2x1bW59IGlzIGJleW9uZCBsaW5lICR7dmFsdWUuZW5kTGluZX0gKCR7ZW5kTGVuZ3RofSBjb2x1bW5zKS5gLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGlzc3Vlcy5sZW5ndGggPiAwID8geyBvazogZmFsc2UsIGNvZGU6ICdFX1JBTkdFJywgaXNzdWVzIH0gOiB7IG9rOiB0cnVlIH07XG59XG5cbi8qKlxuICogRXhhY3Qgc3Vic3RyaW5nIGZvciBhIHJhbmdlLiBLZWVwcyB0aGUgb3JpZ2luYWwgbGluZSBlbmRpbmdzIGFuZCBpbmRlbnRhdGlvbi5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dFxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSByYW5nZVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNsaWNlVGV4dCh0ZXh0LCByYW5nZSkge1xuICBjb25zdCBzdGFydHMgPSBsaW5lU3RhcnRzKHRleHQpO1xuICBjb25zdCBzdGFydExpbmUgPSBOdW1iZXIocmFuZ2U/LnN0YXJ0TGluZSk7XG4gIGNvbnN0IGVuZExpbmUgPSBOdW1iZXIocmFuZ2U/LmVuZExpbmUpO1xuICBjb25zdCBzdGFydCA9IChzdGFydHNbc3RhcnRMaW5lXSA/PyAwKSArIE51bWJlcihyYW5nZT8uc3RhcnRDb2x1bW4gPz8gMCk7XG4gIGNvbnN0IGVuZCA9IChzdGFydHNbZW5kTGluZV0gPz8gc3RhcnRzW3N0YXJ0cy5sZW5ndGggLSAxXSkgKyBOdW1iZXIocmFuZ2U/LmVuZENvbHVtbiA/PyAwKTtcbiAgcmV0dXJuIHRleHQuc2xpY2Uoc3RhcnQsIE1hdGgubWF4KHN0YXJ0LCBlbmQpKTtcbn1cblxuLyoqXG4gKiBUcmltIGEgc2xpY2UgZnJvbSB0aGUgZW5kIHRvIGBtYXhMaW5lc2AuIE5ldmVyIHJldHVybnMgbW9yZSBsaW5lcyB0aGFuIGFza2VkXG4gKiBmb3IgYW5kIHJlcG9ydHMgdGhlIHRyaW0uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAqIEBwYXJhbSB7bnVtYmVyfSBtYXhMaW5lc1xuICogQHJldHVybnMge3t0ZXh0OiBzdHJpbmcsIHRydW5jYXRlZDogYm9vbGVhbiwgbGluZUNvdW50OiBudW1iZXJ9fVxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJ1bmNhdGVTb3VyY2UodGV4dCwgbWF4TGluZXMpIHtcbiAgY29uc3QgbGltaXQgPSBNYXRoLm1pbihcbiAgICBTT1VSQ0VfTElNSVRTLm1heExpbmVzTGltaXQsXG4gICAgTWF0aC5tYXgoU09VUkNFX0xJTUlUUy5taW5MaW5lcywgTnVtYmVyLmlzSW50ZWdlcihtYXhMaW5lcykgPyBtYXhMaW5lcyA6IFNPVVJDRV9MSU1JVFMubWF4TGluZXMpLFxuICApO1xuICBjb25zdCBzdGFydHMgPSBsaW5lU3RhcnRzKHRleHQpO1xuICBjb25zdCBsaW5lQ291bnQgPSBzdGFydHMubGVuZ3RoO1xuICBpZiAobGluZUNvdW50IDw9IGxpbWl0KSB7XG4gICAgcmV0dXJuIHsgdGV4dCwgdHJ1bmNhdGVkOiBmYWxzZSwgbGluZUNvdW50IH07XG4gIH1cbiAgLy8gS2VlcCBleGFjdGx5IGBsaW1pdGAgbGluZXMgYnkgZHJvcHBpbmcgdGhlIHRyYWlsaW5nIGxpbmUgZW5kaW5nOyBvdGhlcndpc2UgYVxuICAvLyBjb25zdW1lciB0aGF0IHNwbGl0cyBvbiBuZXdsaW5lcyB3b3VsZCByZW5kZXIgb25lIGVtcHR5IGV4dHJhIGxpbmUuXG4gIGxldCBjbGlwcGVkID0gdGV4dC5zbGljZSgwLCBzdGFydHNbbGltaXRdKTtcbiAgaWYgKGNsaXBwZWQuZW5kc1dpdGgoJ1xcclxcbicpKSB7XG4gICAgY2xpcHBlZCA9IGNsaXBwZWQuc2xpY2UoMCwgLTIpO1xuICB9IGVsc2UgaWYgKGNsaXBwZWQuZW5kc1dpdGgoJ1xcbicpIHx8IGNsaXBwZWQuZW5kc1dpdGgoJ1xccicpKSB7XG4gICAgY2xpcHBlZCA9IGNsaXBwZWQuc2xpY2UoMCwgLTEpO1xuICB9XG4gIHJldHVybiB7XG4gICAgdGV4dDogY2xpcHBlZCxcbiAgICB0cnVuY2F0ZWQ6IHRydWUsXG4gICAgbGluZUNvdW50OiBsaW1pdCxcbiAgfTtcbn1cblxuLyoqXG4gKiBUcnVlIHdoZW4gdGhlIHBvc2l0aW9uIGlzIGluc2lkZSB0aGUgcmFuZ2UsIGluY2x1ZGluZyBpdHMgZW5kLlxuICpcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gcmFuZ2VcbiAqIEBwYXJhbSB7e2xpbmU6IG51bWJlciwgY29sdW1uOiBudW1iZXJ9fSBwb3NpdGlvblxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluc1Bvc2l0aW9uKHJhbmdlLCBwb3NpdGlvbikge1xuICBjb25zdCBsaW5lID0gTnVtYmVyKHBvc2l0aW9uPy5saW5lKTtcbiAgY29uc3QgY29sdW1uID0gTnVtYmVyKHBvc2l0aW9uPy5jb2x1bW4pO1xuICBpZiAoIU51bWJlci5pc0ludGVnZXIobGluZSkgfHwgIU51bWJlci5pc0ludGVnZXIoY29sdW1uKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAobGluZSA8IHJhbmdlLnN0YXJ0TGluZSB8fCBsaW5lID4gcmFuZ2UuZW5kTGluZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAobGluZSA9PT0gcmFuZ2Uuc3RhcnRMaW5lICYmIGNvbHVtbiA8IHJhbmdlLnN0YXJ0Q29sdW1uKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChsaW5lID09PSByYW5nZS5lbmRMaW5lICYmIGNvbHVtbiA+IHJhbmdlLmVuZENvbHVtbikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IG91dGVyXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IGlubmVyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnRhaW5zUmFuZ2Uob3V0ZXIsIGlubmVyKSB7XG4gIGlmICghb3V0ZXIgfHwgIWlubmVyIHx8IG91dGVyLmZpbGVJZCAhPT0gaW5uZXIuZmlsZUlkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiAoXG4gICAgY29udGFpbnNQb3NpdGlvbihvdXRlciwgeyBsaW5lOiBpbm5lci5zdGFydExpbmUsIGNvbHVtbjogaW5uZXIuc3RhcnRDb2x1bW4gfSkgJiZcbiAgICBjb250YWluc1Bvc2l0aW9uKG91dGVyLCB7IGxpbmU6IGlubmVyLmVuZExpbmUsIGNvbHVtbjogaW5uZXIuZW5kQ29sdW1uIH0pXG4gICk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBsZWZ0XG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IHJpZ2h0XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJhbmdlc092ZXJsYXAobGVmdCwgcmlnaHQpIHtcbiAgaWYgKCFsZWZ0IHx8ICFyaWdodCB8fCBsZWZ0LmZpbGVJZCAhPT0gcmlnaHQuZmlsZUlkKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiAoXG4gICAgY29udGFpbnNQb3NpdGlvbihsZWZ0LCB7IGxpbmU6IHJpZ2h0LnN0YXJ0TGluZSwgY29sdW1uOiByaWdodC5zdGFydENvbHVtbiB9KSB8fFxuICAgIGNvbnRhaW5zUG9zaXRpb24obGVmdCwgeyBsaW5lOiByaWdodC5lbmRMaW5lLCBjb2x1bW46IHJpZ2h0LmVuZENvbHVtbiB9KSB8fFxuICAgIGNvbnRhaW5zUG9zaXRpb24ocmlnaHQsIHsgbGluZTogbGVmdC5zdGFydExpbmUsIGNvbHVtbjogbGVmdC5zdGFydENvbHVtbiB9KVxuICApO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gcmFuZ2VcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByYW5nZUtleShyYW5nZSkge1xuICByZXR1cm4gYCR7cmFuZ2UuZmlsZUlkfToke3JhbmdlLnN0YXJ0TGluZX06JHtyYW5nZS5zdGFydENvbHVtbn0tJHtyYW5nZS5lbmRMaW5lfToke3JhbmdlLmVuZENvbHVtbn1gO1xufVxuXG4vKipcbiAqIEludGVncml0eSBpcyBhIGNvbXBhcmlzb24gb2YgdHdvIGZ1bGwtZG9jdW1lbnQgaGFzaGVzLiBDb25zZXJ2YXRpdmU6IGFcbiAqIG1pc21hdGNoIG1hcmtzIHRoZSB3aG9sZSBmaWxlIHN0YWxlLCBiZWNhdXNlIGFuIGV4dGVybmFsIHJld3JpdGUgZ2l2ZXMgdXMgbm9cbiAqIHRydXN0d29ydGh5IGVkaXQgZGVsdGEuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8dW5kZWZpbmVkfSBhbmFseXNpc0hhc2hcbiAqIEBwYXJhbSB7c3RyaW5nfHVuZGVmaW5lZH0gY3VycmVudEhhc2hcbiAqIEByZXR1cm5zIHsnZXhhY3QnfCdzdGFsZSd8J21pc3NpbmcnfVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZWdyaXR5Rm9yKGFuYWx5c2lzSGFzaCwgY3VycmVudEhhc2gpIHtcbiAgaWYgKCFhbmFseXNpc0hhc2ggfHwgIWN1cnJlbnRIYXNoKSB7XG4gICAgcmV0dXJuICdtaXNzaW5nJztcbiAgfVxuICByZXR1cm4gYW5hbHlzaXNIYXNoID09PSBjdXJyZW50SGFzaCA/ICdleGFjdCcgOiAnc3RhbGUnO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVNYXhMaW5lcyh2YWx1ZSkge1xuICBjb25zdCBjYW5kaWRhdGUgPSBOdW1iZXIodmFsdWUpO1xuICBpZiAoIU51bWJlci5pc0Zpbml0ZShjYW5kaWRhdGUpKSB7XG4gICAgcmV0dXJuIFNPVVJDRV9MSU1JVFMubWF4TGluZXM7XG4gIH1cbiAgcmV0dXJuIE1hdGgubWluKFxuICAgIFNPVVJDRV9MSU1JVFMubWF4TGluZXNMaW1pdCxcbiAgICBNYXRoLm1heChTT1VSQ0VfTElNSVRTLm1pbkxpbmVzLCBNYXRoLnRydW5jKGNhbmRpZGF0ZSkpLFxuICApO1xufVxuIiwgIi8qKlxuICogUHJldmlldyBwcmVzZW50YXRpb24gbW9kZWwuXG4gKlxuICogUHVyZTogZ2l2ZW4gYSBncmFwaCBub2RlIGFuZCBhbiBvcHRpb25hbCBzb3VyY2Ugc2xpY2UsIGRlY2lkZSB3aGF0IHRoZSBjYXJkXG4gKiBzYXlzLiBUaGUgd2VidmlldyB0dXJucyB0aGlzIGludG8gRE9NOyB0ZXN0cyBhc3NlcnQgdGhlIGRlY2lzaW9ucyB3aXRob3V0IGFcbiAqIGJyb3dzZXIuIFN5bnRoZXRpYyBhbmQgc3RhbGUgbm9kZXMgbXVzdCBleHBsYWluIHRoZW1zZWx2ZXMgaW5zdGVhZCBvZlxuICogc2hvd2luZyBtaXNsZWFkaW5nIHNvdXJjZS5cbiAqL1xuXG5pbXBvcnQgeyBTT1VSQ0VfTElNSVRTLCB0cnVuY2F0ZVNvdXJjZSB9IGZyb20gJy4vcmFuZ2VzLmpzJztcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBQcmV2aWV3Tm9kZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGlkXG4gKiBAcHJvcGVydHkge3N0cmluZ30ga2luZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGxhYmVsXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IFtpc1N5bnRoZXRpY11cbiAqIEBwcm9wZXJ0eSB7UmVjb3JkPHN0cmluZywgYW55PnxudWxsfSBbcmFuZ2VdXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBQcmV2aWV3U2xpY2VcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSB0ZXh0XG4gKiBAcHJvcGVydHkge3N0cmluZ30gcmVsYXRpdmVQYXRoXG4gKiBAcHJvcGVydHkge3tzdGFydExpbmU6IG51bWJlciwgZW5kTGluZTogbnVtYmVyfX0gW2xpbmVzXVxuICogQHByb3BlcnR5IHtib29sZWFufSBbdHJ1bmNhdGVkXVxuICogQHByb3BlcnR5IHsnZXhhY3QnfCdzdGFsZSd8J21pc3NpbmcnfSBbaW50ZWdyaXR5XVxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtkb2N1bWVudFZlcnNpb25dXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW2NvbnRlbnRIYXNoXVxuICogQHByb3BlcnR5IHtzdHJpbmd9IFtyZWFzb25dXG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge3tub2RlOiBQcmV2aWV3Tm9kZSwgc2xpY2U/OiBQcmV2aWV3U2xpY2V8bnVsbCwgbWF4TGluZXM/OiBudW1iZXJ9fSBpbnB1dFxuICogQHJldHVybnMge3tcbiAqICAgdGl0bGU6IHN0cmluZyxcbiAqICAga2luZDogc3RyaW5nLFxuICogICBmaWxlOiBzdHJpbmcsXG4gKiAgIGxpbmVMYWJlbDogc3RyaW5nLFxuICogICB0ZXh0OiBzdHJpbmcsXG4gKiAgIHRydW5jYXRlZDogYm9vbGVhbixcbiAqICAgc3ludGhldGljOiBib29sZWFuLFxuICogICBzdGFsZTogYm9vbGVhbixcbiAqICAgZW1wdHk6IGJvb2xlYW4sXG4gKiAgIG1lc3NhZ2U6IHN0cmluZyxcbiAqICAgaW50ZWdyaXR5OiAnZXhhY3QnfCdzdGFsZSd8J21pc3NpbmcnLFxuICogICBkb2N1bWVudFZlcnNpb246IG51bWJlcnxudWxsXG4gKiB9fVxuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRQcmV2aWV3TW9kZWwoeyBub2RlLCBzbGljZSA9IG51bGwsIG1heExpbmVzID0gU09VUkNFX0xJTUlUUy5tYXhMaW5lcyB9KSB7XG4gIGNvbnN0IHJhbmdlID0gbm9kZT8ucmFuZ2UgPz8gbnVsbDtcbiAgY29uc3QgdGl0bGUgPSBTdHJpbmcobm9kZT8ubGFiZWwgPz8gJ3NvdXJjZScpO1xuICBjb25zdCBsaW5lTGFiZWwgPSByYW5nZVxuICAgID8gYCR7TnVtYmVyKHJhbmdlLnN0YXJ0TGluZSkgKyAxfVx1MjAxMyR7TnVtYmVyKHJhbmdlLmVuZExpbmUpICsgMX1gXG4gICAgOiAnbm8gbGluZSByYW5nZSc7XG4gIGNvbnN0IHN5bnRoZXRpYyA9IG5vZGU/LmlzU3ludGhldGljID09PSB0cnVlIHx8ICFyYW5nZTtcblxuICBpZiAoc3ludGhldGljKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRpdGxlLFxuICAgICAga2luZDogU3RyaW5nKG5vZGU/LmtpbmQgPz8gJ25vZGUnKSxcbiAgICAgIGZpbGU6IHJhbmdlPy5maWxlSWQgPz8gJycsXG4gICAgICBsaW5lTGFiZWwsXG4gICAgICB0ZXh0OiAnJyxcbiAgICAgIHRydW5jYXRlZDogZmFsc2UsXG4gICAgICBzeW50aGV0aWM6IHRydWUsXG4gICAgICBzdGFsZTogZmFsc2UsXG4gICAgICBlbXB0eTogZmFsc2UsXG4gICAgICBtZXNzYWdlOiByYW5nZVxuICAgICAgICA/IGBTeW50aGV0aWMgJHtub2RlPy5raW5kID8/ICdub2RlJ30gXHUyMDE0IGZ1bmN0aW9uIHN0cnVjdHVyZSwgbm90IGEgc291cmNlIHN0YXRlbWVudC4gQW5jaG9yZWQgYXQgbGluZSAke051bWJlcihyYW5nZS5zdGFydExpbmUpICsgMX0uYFxuICAgICAgICA6IGBTeW50aGV0aWMgJHtub2RlPy5raW5kID8/ICdub2RlJ30gXHUyMDE0IHRoaXMgbm9kZSBoYXMgbm8gc291cmNlIHJhbmdlLmAsXG4gICAgICBpbnRlZ3JpdHk6ICdleGFjdCcsXG4gICAgICBkb2N1bWVudFZlcnNpb246IG51bGwsXG4gICAgfTtcbiAgfVxuXG4gIGlmICghc2xpY2UpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGl0bGUsXG4gICAgICBraW5kOiBTdHJpbmcobm9kZT8ua2luZCA/PyAnbm9kZScpLFxuICAgICAgZmlsZTogcmFuZ2U/LmZpbGVJZCA/PyAnJyxcbiAgICAgIGxpbmVMYWJlbCxcbiAgICAgIHRleHQ6ICcnLFxuICAgICAgdHJ1bmNhdGVkOiBmYWxzZSxcbiAgICAgIHN5bnRoZXRpYzogZmFsc2UsXG4gICAgICBzdGFsZTogZmFsc2UsXG4gICAgICBlbXB0eTogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6ICdTb3VyY2UgaXMgbm90IGF2YWlsYWJsZSBmb3IgdGhpcyByYW5nZS4nLFxuICAgICAgaW50ZWdyaXR5OiAnbWlzc2luZycsXG4gICAgICBkb2N1bWVudFZlcnNpb246IG51bGwsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IHRyaW1tZWQgPSB0cnVuY2F0ZVNvdXJjZShTdHJpbmcoc2xpY2UudGV4dCA/PyAnJyksIG1heExpbmVzKTtcbiAgY29uc3QgaW50ZWdyaXR5ID0gc2xpY2UuaW50ZWdyaXR5ID8/ICdleGFjdCc7XG4gIGNvbnN0IHN0YWxlID0gaW50ZWdyaXR5ID09PSAnc3RhbGUnO1xuICBjb25zdCBlbXB0eSA9IHRyaW1tZWQudGV4dC50cmltKCkubGVuZ3RoID09PSAwO1xuICBsZXQgbWVzc2FnZSA9ICcnO1xuICBpZiAoc3RhbGUpIHtcbiAgICBtZXNzYWdlID1cbiAgICAgICdUaGUgZG9jdW1lbnQgY2hhbmdlZCBzaW5jZSB0aGlzIGFuYWx5c2lzLiBUaGUgdGV4dCBiZWxvdyBpcyBjdXJyZW50LCBidXQgdGhlIGdyYXBoIG1heSBub3QgbWF0Y2ggaXQuIFJlLWFuYWx5emUgYmVmb3JlIHRydXN0aW5nIHRoZSByYW5nZS4nO1xuICB9IGVsc2UgaWYgKGludGVncml0eSA9PT0gJ21pc3NpbmcnKSB7XG4gICAgbWVzc2FnZSA9IHNsaWNlLnJlYXNvbiB8fCAnVGhlIGFuYWx5emVkIGRvY3VtZW50IGlzIG5vIGxvbmdlciBhdmFpbGFibGUuJztcbiAgfSBlbHNlIGlmIChlbXB0eSkge1xuICAgIG1lc3NhZ2UgPSAnVGhpcyByYW5nZSBoYXMgbm8gc291cmNlIGNvbnRlbnQuJztcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgdGl0bGUsXG4gICAga2luZDogU3RyaW5nKG5vZGU/LmtpbmQgPz8gJ25vZGUnKSxcbiAgICBmaWxlOiBTdHJpbmcoc2xpY2UucmVsYXRpdmVQYXRoID8/IHJhbmdlPy5maWxlSWQgPz8gJycpLFxuICAgIGxpbmVMYWJlbCxcbiAgICB0ZXh0OiB0cmltbWVkLnRleHQsXG4gICAgdHJ1bmNhdGVkOiBCb29sZWFuKHRyaW1tZWQudHJ1bmNhdGVkIHx8IHNsaWNlLnRydW5jYXRlZCksXG4gICAgc3ludGhldGljOiBmYWxzZSxcbiAgICBzdGFsZSxcbiAgICBlbXB0eSxcbiAgICBtZXNzYWdlLFxuICAgIGludGVncml0eSxcbiAgICBkb2N1bWVudFZlcnNpb246IE51bWJlci5pc0ludGVnZXIoc2xpY2UuZG9jdW1lbnRWZXJzaW9uKSA/IHNsaWNlLmRvY3VtZW50VmVyc2lvbiA6IG51bGwsXG4gIH07XG59XG4iLCAiLyoqXG4gKiBQcmV2aWV3IGFuZCBuYXZpZ2F0aW9uIHNldHRpbmdzLlxuICpcbiAqIFRoZSBkZWZhdWx0cyBoZXJlIGFyZSB0aGUgY29udHJhY3QuIGBwYWNrYWdlLmpzb25gIGRlY2xhcmVzIHRoZSBzYW1lIGtleXMgYW5kXG4gKiBkZWZhdWx0czsgYHRlc3RzL3VuaXQvc291cmNlU2V0dGluZ3MudGVzdC5qc2Aga2VlcHMgdGhlIG1hbmlmZXN0IGFuZCB0aGlzXG4gKiBtb2R1bGUgaW4gc3luYy5cbiAqL1xuXG5leHBvcnQgY29uc3QgUFJFVklFV19ERUZBVUxUUyA9IE9iamVjdC5mcmVlemUoe1xuICBlbmFibGVkOiB0cnVlLFxuICBkZWxheU1zOiAzMDAsXG4gIG1heExpbmVzOiAxMixcbiAgc3ludGF4SGlnaGxpZ2h0aW5nOiB0cnVlLFxuICBjbGlja1RvTmF2aWdhdGU6IHRydWUsXG4gIHBpbkJ5RGVmYXVsdDogZmFsc2UsXG4gIG9wZW5JblByZXZpZXdUYWI6IGZhbHNlLFxufSk7XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHBhcmFtIHtudW1iZXJ9IGZhbGxiYWNrXG4gKiBAcGFyYW0ge251bWJlcn0gbWluXG4gKiBAcGFyYW0ge251bWJlcn0gbWF4XG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5mdW5jdGlvbiBjbGFtcEludGVnZXIodmFsdWUsIGZhbGxiYWNrLCBtaW4sIG1heCkge1xuICBjb25zdCBjYW5kaWRhdGUgPSBOdW1iZXIodmFsdWUpO1xuICBpZiAoIU51bWJlci5pc0Zpbml0ZShjYW5kaWRhdGUpKSB7XG4gICAgcmV0dXJuIGZhbGxiYWNrO1xuICB9XG4gIHJldHVybiBNYXRoLm1pbihtYXgsIE1hdGgubWF4KG1pbiwgTWF0aC50cnVuYyhjYW5kaWRhdGUpKSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHBhcmFtIHtib29sZWFufSBmYWxsYmFja1xuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGFzQm9vbGVhbih2YWx1ZSwgZmFsbGJhY2spIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nID8gdmFsdWUgOiBmYWxsYmFjaztcbn1cblxuLyoqXG4gKiBOb3JtYWxpemUgc2V0dGluZ3MgZnJvbSBhbnkgc291cmNlIChWUyBDb2RlIGNvbmZpZ3VyYXRpb24sIHByb3RvY29sIHBheWxvYWQsXG4gKiB0ZXN0cykuIFVua25vd24gc2hhcGVzIGZhbGwgYmFjayB0byB0aGUgZG9jdW1lbnRlZCBkZWZhdWx0czsgbm90aGluZyB0aHJvd3MuXG4gKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW3Jhd11cbiAqIEByZXR1cm5zIHt7ZW5hYmxlZDogYm9vbGVhbiwgZGVsYXlNczogbnVtYmVyLCBtYXhMaW5lczogbnVtYmVyLCBzeW50YXhIaWdobGlnaHRpbmc6IGJvb2xlYW4sIGNsaWNrVG9OYXZpZ2F0ZTogYm9vbGVhbiwgcGluQnlEZWZhdWx0OiBib29sZWFuLCBvcGVuSW5QcmV2aWV3VGFiOiBib29sZWFufX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVQcmV2aWV3U2V0dGluZ3MocmF3ID0ge30pIHtcbiAgY29uc3Qgc291cmNlID0gcmF3ICYmIHR5cGVvZiByYXcgPT09ICdvYmplY3QnID8gcmF3IDoge307XG4gIHJldHVybiB7XG4gICAgZW5hYmxlZDogYXNCb29sZWFuKHNvdXJjZS5lbmFibGVkLCBQUkVWSUVXX0RFRkFVTFRTLmVuYWJsZWQpLFxuICAgIGRlbGF5TXM6IGNsYW1wSW50ZWdlcihzb3VyY2UuZGVsYXlNcywgUFJFVklFV19ERUZBVUxUUy5kZWxheU1zLCAwLCAyXzAwMCksXG4gICAgbWF4TGluZXM6IGNsYW1wSW50ZWdlcihzb3VyY2UubWF4TGluZXMsIFBSRVZJRVdfREVGQVVMVFMubWF4TGluZXMsIDQsIDQwKSxcbiAgICBzeW50YXhIaWdobGlnaHRpbmc6IGFzQm9vbGVhbihzb3VyY2Uuc3ludGF4SGlnaGxpZ2h0aW5nLCBQUkVWSUVXX0RFRkFVTFRTLnN5bnRheEhpZ2hsaWdodGluZyksXG4gICAgY2xpY2tUb05hdmlnYXRlOiBhc0Jvb2xlYW4oc291cmNlLmNsaWNrVG9OYXZpZ2F0ZSwgUFJFVklFV19ERUZBVUxUUy5jbGlja1RvTmF2aWdhdGUpLFxuICAgIHBpbkJ5RGVmYXVsdDogYXNCb29sZWFuKHNvdXJjZS5waW5CeURlZmF1bHQsIFBSRVZJRVdfREVGQVVMVFMucGluQnlEZWZhdWx0KSxcbiAgICBvcGVuSW5QcmV2aWV3VGFiOiBhc0Jvb2xlYW4oc291cmNlLm9wZW5JblByZXZpZXdUYWIsIFBSRVZJRVdfREVGQVVMVFMub3BlbkluUHJldmlld1RhYiksXG4gIH07XG59XG5cbi8qKlxuICogVHJ1ZSB3aGVuIGEgY29uZmlndXJhdGlvbi1jaGFuZ2UgZXZlbnQgdG91Y2hlcyBhIGtleSB0aGlzIG1vZHVsZSBvd25zLlxuICpcbiAqIEBwYXJhbSB7e2FmZmVjdHNDb25maWd1cmF0aW9uPzogKHNlY3Rpb246IHN0cmluZykgPT4gYm9vbGVhbn19IGV2ZW50XG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldHRpbmdzQ2hhbmdlZChldmVudCkge1xuICByZXR1cm4gKFxuICAgIEJvb2xlYW4oZXZlbnQ/LmFmZmVjdHNDb25maWd1cmF0aW9uPy4oJ2NvZGVmbG93LnByZXZpZXcnKSkgfHxcbiAgICBCb29sZWFuKGV2ZW50Py5hZmZlY3RzQ29uZmlndXJhdGlvbj8uKCdjb2RlZmxvdy5uYXZpZ2F0aW9uJykpXG4gICk7XG59XG4iLCAiLyoqXG4gKiBIb3Zlci1pbnRlbnQgc3RhdGUgbWFjaGluZS5cbiAqXG4gKiBEd2VsbCB0aW1lIHBsdXMgcG9pbnRlciBzdGFiaWxpdHkgcHJldmVudHMgcHJldmlldyBmbGlja2VyIHdoaWxlIHNjYW5uaW5nIGFcbiAqIGdyYXBoLiBUaGUgY29udHJvbGxlciBvd25zIHRpbWVycyBidXQgbm8gRE9NLCBzbyB0aGUgYmVoYXZpb3VyIGlzIHRlc3RhYmxlXG4gKiB3aXRoIGEgZmFrZSBjbG9jay5cbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHt7eDogbnVtYmVyLCB5OiBudW1iZXJ9fSBQb2ludFxuICovXG5cbi8qKlxuICogQHBhcmFtIHt7XG4gKiAgIGRlbGF5TXM/OiBudW1iZXIsXG4gKiAgIG1vdmVUb2xlcmFuY2U/OiBudW1iZXIsXG4gKiAgIGdyYWNlTXM/OiBudW1iZXIsXG4gKiAgIGVuYWJsZWQ/OiBib29sZWFuLFxuICogICBzZXRUaW1lb3V0PzogKGhhbmRsZXI6IEZ1bmN0aW9uLCBtczogbnVtYmVyKSA9PiB1bmtub3duLFxuICogICBjbGVhclRpbWVvdXQ/OiAoaGFuZGxlOiB1bmtub3duKSA9PiB2b2lkLFxuICogICBvblNob3c/OiAobm9kZUlkOiBzdHJpbmcsIGFuY2hvcjogUG9pbnQpID0+IHZvaWQsXG4gKiAgIG9uSGlkZT86IChub2RlSWQ6IHN0cmluZ3xudWxsKSA9PiB2b2lkLFxuICogfX0gW29wdGlvbnNdXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQcmV2aWV3Q29udHJvbGxlcihvcHRpb25zID0ge30pIHtcbiAgY29uc3Qgc2NoZWR1bGUgPSBvcHRpb25zLnNldFRpbWVvdXQgPz8gKChoYW5kbGVyLCBtcykgPT4gc2V0VGltZW91dChoYW5kbGVyLCBtcykpO1xuICBjb25zdCBjYW5jZWwgPSBvcHRpb25zLmNsZWFyVGltZW91dCA/PyAoKGhhbmRsZSkgPT4gY2xlYXJUaW1lb3V0KGhhbmRsZSkpO1xuXG4gIGxldCBkZWxheU1zID0gTWF0aC5tYXgoMCwgTnVtYmVyKG9wdGlvbnMuZGVsYXlNcyA/PyAzMDApKTtcbiAgbGV0IG1vdmVUb2xlcmFuY2UgPSBNYXRoLm1heCgwLCBOdW1iZXIob3B0aW9ucy5tb3ZlVG9sZXJhbmNlID8/IDEyKSk7XG4gIGNvbnN0IGdyYWNlTXMgPSBNYXRoLm1heCgwLCBOdW1iZXIob3B0aW9ucy5ncmFjZU1zID8/IDE1MCkpO1xuICBsZXQgZW5hYmxlZCA9IG9wdGlvbnMuZW5hYmxlZCAhPT0gZmFsc2U7XG4gIGxldCBwaW5CeURlZmF1bHQgPSBCb29sZWFuKG9wdGlvbnMucGluQnlEZWZhdWx0KTtcblxuICBsZXQgY3VycmVudElkID0gbnVsbDtcbiAgbGV0IGFuY2hvciA9IHsgeDogMCwgeTogMCB9O1xuICBsZXQgZHdlbGxUaW1lciA9IG51bGw7XG4gIGxldCBncmFjZVRpbWVyID0gbnVsbDtcbiAgbGV0IHBvaW50ZXJJbnNpZGUgPSBmYWxzZTtcbiAgbGV0IHBpbm5lZCA9IGZhbHNlO1xuICBsZXQgdmlzaWJsZSA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGNsZWFyRHdlbGwoKSB7XG4gICAgaWYgKGR3ZWxsVGltZXIgIT09IG51bGwpIHtcbiAgICAgIGNhbmNlbChkd2VsbFRpbWVyKTtcbiAgICAgIGR3ZWxsVGltZXIgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyR3JhY2UoKSB7XG4gICAgaWYgKGdyYWNlVGltZXIgIT09IG51bGwpIHtcbiAgICAgIGNhbmNlbChncmFjZVRpbWVyKTtcbiAgICAgIGdyYWNlVGltZXIgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNob3coKSB7XG4gICAgaWYgKCFlbmFibGVkIHx8IGN1cnJlbnRJZCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2aXNpYmxlID0gdHJ1ZTtcbiAgICBpZiAocGluQnlEZWZhdWx0KSB7XG4gICAgICBwaW5uZWQgPSB0cnVlO1xuICAgIH1cbiAgICBvcHRpb25zLm9uU2hvdz8uKGN1cnJlbnRJZCwgeyAuLi5hbmNob3IgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBoaWRlKCkge1xuICAgIGNsZWFyRHdlbGwoKTtcbiAgICBjbGVhckdyYWNlKCk7XG4gICAgaWYgKCF2aXNpYmxlICYmIGN1cnJlbnRJZCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBwcmV2aW91cyA9IGN1cnJlbnRJZDtcbiAgICB2aXNpYmxlID0gZmFsc2U7XG4gICAgY3VycmVudElkID0gbnVsbDtcbiAgICBwaW5uZWQgPSBmYWxzZTtcbiAgICBvcHRpb25zLm9uSGlkZT8uKHByZXZpb3VzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFybUR3ZWxsKCkge1xuICAgIGNsZWFyRHdlbGwoKTtcbiAgICBpZiAoIWVuYWJsZWQgfHwgY3VycmVudElkID09PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGR3ZWxsVGltZXIgPSBzY2hlZHVsZSgoKSA9PiB7XG4gICAgICBkd2VsbFRpbWVyID0gbnVsbDtcbiAgICAgIHNob3coKTtcbiAgICB9LCBkZWxheU1zKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFybUdyYWNlKCkge1xuICAgIGlmIChwaW5uZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY2xlYXJHcmFjZSgpO1xuICAgIGdyYWNlVGltZXIgPSBzY2hlZHVsZSgoKSA9PiB7XG4gICAgICBncmFjZVRpbWVyID0gbnVsbDtcbiAgICAgIGhpZGUoKTtcbiAgICB9LCBncmFjZU1zKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZFxuICAgICAqIEBwYXJhbSB7UG9pbnR9IHBvaW50XG4gICAgICovXG4gICAgcG9pbnRlckVudGVyKG5vZGVJZCwgcG9pbnQpIHtcbiAgICAgIGlmICh0eXBlb2Ygbm9kZUlkICE9PSAnc3RyaW5nJyB8fCBub2RlSWQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHBvaW50ZXJJbnNpZGUgPSB0cnVlO1xuICAgICAgY2xlYXJHcmFjZSgpO1xuICAgICAgaWYgKHZpc2libGUgJiYgY3VycmVudElkID09PSBub2RlSWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHZpc2libGUpIHtcbiAgICAgICAgb3B0aW9ucy5vbkhpZGU/LihjdXJyZW50SWQpO1xuICAgICAgICB2aXNpYmxlID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBjdXJyZW50SWQgPSBub2RlSWQ7XG4gICAgICBhbmNob3IgPSB7IHg6IE51bWJlcihwb2ludD8ueCA/PyAwKSwgeTogTnVtYmVyKHBvaW50Py55ID8/IDApIH07XG4gICAgICBwaW5uZWQgPSBmYWxzZTtcbiAgICAgIGFybUR3ZWxsKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE1vdmVtZW50IGxhcmdlciB0aGFuIHRoZSB0b2xlcmFuY2UgcmVzdGFydHMgdGhlIGR3ZWxsIHRpbWVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtQb2ludH0gcG9pbnRcbiAgICAgKi9cbiAgICBwb2ludGVyTW92ZShwb2ludCkge1xuICAgICAgaWYgKGN1cnJlbnRJZCA9PT0gbnVsbCB8fCB2aXNpYmxlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHggPSBOdW1iZXIocG9pbnQ/LnggPz8gMCk7XG4gICAgICBjb25zdCB5ID0gTnVtYmVyKHBvaW50Py55ID8/IDApO1xuICAgICAgY29uc3QgZHggPSB4IC0gYW5jaG9yLng7XG4gICAgICBjb25zdCBkeSA9IHkgLSBhbmNob3IueTtcbiAgICAgIGlmIChNYXRoLmh5cG90KGR4LCBkeSkgPiBtb3ZlVG9sZXJhbmNlKSB7XG4gICAgICAgIGFuY2hvciA9IHsgeCwgeSB9O1xuICAgICAgICBhcm1Ed2VsbCgpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICAvKiogUG9pbnRlciBsZWZ0IHRoZSBub2RlOiBnaXZlIHRoZSB1c2VyIHRpbWUgdG8gcmVhY2ggdGhlIGNhcmQuICovXG4gICAgcG9pbnRlckxlYXZlKCkge1xuICAgICAgcG9pbnRlckluc2lkZSA9IGZhbHNlO1xuICAgICAgY2xlYXJEd2VsbCgpO1xuICAgICAgaWYgKCF2aXNpYmxlKSB7XG4gICAgICAgIGN1cnJlbnRJZCA9IG51bGw7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGFybUdyYWNlKCk7XG4gICAgfSxcblxuICAgIC8qKiBQb2ludGVyIGVudGVyZWQgdGhlIGNhcmQ7IGNhbmNlbCB0aGUgaGlkZS4gKi9cbiAgICBwb2ludGVyRW50ZXJDYXJkKCkge1xuICAgICAgcG9pbnRlckluc2lkZSA9IHRydWU7XG4gICAgICBjbGVhckdyYWNlKCk7XG4gICAgfSxcblxuICAgIHBvaW50ZXJMZWF2ZUNhcmQoKSB7XG4gICAgICBwb2ludGVySW5zaWRlID0gZmFsc2U7XG4gICAgICBpZiAodmlzaWJsZSkge1xuICAgICAgICBhcm1HcmFjZSgpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICB0b2dnbGVQaW4oKSB7XG4gICAgICBwaW5uZWQgPSAhcGlubmVkO1xuICAgICAgaWYgKHBpbm5lZCkge1xuICAgICAgICBjbGVhckdyYWNlKCk7XG4gICAgICB9IGVsc2UgaWYgKCFwb2ludGVySW5zaWRlKSB7XG4gICAgICAgIGFybUdyYWNlKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGlubmVkO1xuICAgIH0sXG5cbiAgICAvKiogQHBhcmFtIHtib29sZWFufSB2YWx1ZSAqL1xuICAgIHNldFBpbm5lZCh2YWx1ZSkge1xuICAgICAgcGlubmVkID0gQm9vbGVhbih2YWx1ZSk7XG4gICAgICBpZiAocGlubmVkKSB7XG4gICAgICAgIGNsZWFyR3JhY2UoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwaW5uZWQ7XG4gICAgfSxcblxuICAgIC8qKiBFc2MgYWx3YXlzIGV4aXRzLCBldmVuIHdoZW4gcGlubmVkLiAqL1xuICAgIGRpc21pc3MoKSB7XG4gICAgICBoaWRlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIExpdmUgc2V0dGluZ3MgY2hhbmdlcyBtdXN0IG5vdCByZXF1aXJlIGEgcmVsb2FkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHt7ZGVsYXlNcz86IG51bWJlciwgZW5hYmxlZD86IGJvb2xlYW4sIG1vdmVUb2xlcmFuY2U/OiBudW1iZXIsIHBpbkJ5RGVmYXVsdD86IGJvb2xlYW59fSBuZXh0XG4gICAgICovXG4gICAgY29uZmlndXJlKG5leHQgPSB7fSkge1xuICAgICAgaWYgKG5leHQuZGVsYXlNcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGRlbGF5TXMgPSBNYXRoLm1heCgwLCBOdW1iZXIobmV4dC5kZWxheU1zKSk7XG4gICAgICB9XG4gICAgICBpZiAobmV4dC5tb3ZlVG9sZXJhbmNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbW92ZVRvbGVyYW5jZSA9IE1hdGgubWF4KDAsIE51bWJlcihuZXh0Lm1vdmVUb2xlcmFuY2UpKTtcbiAgICAgIH1cbiAgICAgIGlmIChuZXh0LnBpbkJ5RGVmYXVsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHBpbkJ5RGVmYXVsdCA9IEJvb2xlYW4obmV4dC5waW5CeURlZmF1bHQpO1xuICAgICAgfVxuICAgICAgaWYgKG5leHQuZW5hYmxlZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGVuYWJsZWQgPSBCb29sZWFuKG5leHQuZW5hYmxlZCk7XG4gICAgICAgIGlmICghZW5hYmxlZCkge1xuICAgICAgICAgIGhpZGUoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBpc1Zpc2libGU6ICgpID0+IHZpc2libGUsXG4gICAgaXNQaW5uZWQ6ICgpID0+IHBpbm5lZCxcbiAgICBjdXJyZW50SWQ6ICgpID0+IGN1cnJlbnRJZCxcbiAgICBkZXN0cm95KCkge1xuICAgICAgY2xlYXJEd2VsbCgpO1xuICAgICAgY2xlYXJHcmFjZSgpO1xuICAgICAgY3VycmVudElkID0gbnVsbDtcbiAgICAgIHZpc2libGUgPSBmYWxzZTtcbiAgICAgIHBpbm5lZCA9IGZhbHNlO1xuICAgIH0sXG4gIH07XG59XG4iLCAiLy8gaHR0cHM6Ly9ub2RlanMub3JnL2FwaS9wYWNrYWdlcy5odG1sI3BhY2thZ2VzX3dyaXRpbmdfZHVhbF9wYWNrYWdlc193aGlsZV9hdm9pZGluZ19vcl9taW5pbWl6aW5nX2hhemFyZHNcbmltcG9ydCBIaWdobGlnaHRKUyBmcm9tICcuLi9saWIvY29yZS5qcyc7XG5leHBvcnQgeyBIaWdobGlnaHRKUyB9O1xuZXhwb3J0IGRlZmF1bHQgSGlnaGxpZ2h0SlM7XG4iLCAiLypcbkxhbmd1YWdlOiBDKytcbkNhdGVnb3J5OiBjb21tb24sIHN5c3RlbVxuV2Vic2l0ZTogaHR0cHM6Ly9pc29jcHAub3JnXG4qL1xuXG4vKiogQHR5cGUgTGFuZ3VhZ2VGbiAqL1xuZnVuY3Rpb24gY3BwKGhsanMpIHtcbiAgY29uc3QgcmVnZXggPSBobGpzLnJlZ2V4O1xuICAvLyBhZGRlZCBmb3IgaGlzdG9yaWMgcmVhc29ucyBiZWNhdXNlIGBobGpzLkNfTElORV9DT01NRU5UX01PREVgIGRvZXNcbiAgLy8gbm90IGluY2x1ZGUgc3VjaCBzdXBwb3J0IG5vciBjYW4gd2UgYmUgc3VyZSBhbGwgdGhlIGdyYW1tYXJzIGRlcGVuZGluZ1xuICAvLyBvbiBpdCB3b3VsZCBkZXNpcmUgdGhpcyBiZWhhdmlvclxuICBjb25zdCBDX0xJTkVfQ09NTUVOVF9NT0RFID0gaGxqcy5DT01NRU5UKCcvLycsICckJywgeyBjb250YWluczogWyB7IGJlZ2luOiAvXFxcXFxcbi8gfSBdIH0pO1xuICBjb25zdCBERUNMVFlQRV9BVVRPX1JFID0gJ2RlY2x0eXBlXFxcXChhdXRvXFxcXCknO1xuICBjb25zdCBOQU1FU1BBQ0VfUkUgPSAnW2EtekEtWl9dXFxcXHcqOjonO1xuICBjb25zdCBURU1QTEFURV9BUkdVTUVOVF9SRSA9ICc8W148Pl0rPic7XG4gIGNvbnN0IEZVTkNUSU9OX1RZUEVfUkUgPSAnKD8hc3RydWN0KSgnXG4gICAgKyBERUNMVFlQRV9BVVRPX1JFICsgJ3wnXG4gICAgKyByZWdleC5vcHRpb25hbChOQU1FU1BBQ0VfUkUpXG4gICAgKyAnW2EtekEtWl9dXFxcXHcqJyArIHJlZ2V4Lm9wdGlvbmFsKFRFTVBMQVRFX0FSR1VNRU5UX1JFKVxuICArICcpJztcblxuICBjb25zdCBDUFBfUFJJTUlUSVZFX1RZUEVTID0ge1xuICAgIGNsYXNzTmFtZTogJ3R5cGUnLFxuICAgIGJlZ2luOiAnXFxcXGJbYS16XFxcXGRfXSpfdFxcXFxiJ1xuICB9O1xuXG4gIC8vIGh0dHBzOi8vZW4uY3BwcmVmZXJlbmNlLmNvbS93L2NwcC9sYW5ndWFnZS9lc2NhcGVcbiAgLy8gXFxcXCBcXHggXFx4RkYgXFx1MjgzNyBcXHUwMDMyMzc0NyBcXDM3NFxuICBjb25zdCBDSEFSQUNURVJfRVNDQVBFUyA9ICdcXFxcXFxcXCh4WzAtOUEtRmEtZl17Mn18dVswLTlBLUZhLWZdezQsOH18WzAtN117M318XFxcXFMpJztcbiAgY29uc3QgU1RSSU5HUyA9IHtcbiAgICBjbGFzc05hbWU6ICdzdHJpbmcnLFxuICAgIHZhcmlhbnRzOiBbXG4gICAgICB7XG4gICAgICAgIGJlZ2luOiAnKHU4P3xVfEwpP1wiJyxcbiAgICAgICAgZW5kOiAnXCInLFxuICAgICAgICBpbGxlZ2FsOiAnXFxcXG4nLFxuICAgICAgICBjb250YWluczogWyBobGpzLkJBQ0tTTEFTSF9FU0NBUEUgXVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgYmVnaW46ICcodTg/fFV8TCk/XFwnKCcgKyBDSEFSQUNURVJfRVNDQVBFUyArICd8LiknLFxuICAgICAgICBlbmQ6ICdcXCcnLFxuICAgICAgICBpbGxlZ2FsOiAnLidcbiAgICAgIH0sXG4gICAgICBobGpzLkVORF9TQU1FX0FTX0JFR0lOKHtcbiAgICAgICAgYmVnaW46IC8oPzp1OD98VXxMKT9SXCIoW14oKVxcXFwgXXswLDE2fSlcXCgvLFxuICAgICAgICBlbmQ6IC9cXCkoW14oKVxcXFwgXXswLDE2fSlcIi9cbiAgICAgIH0pXG4gICAgXVxuICB9O1xuXG4gIGNvbnN0IE5VTUJFUlMgPSB7XG4gICAgY2xhc3NOYW1lOiAnbnVtYmVyJyxcbiAgICB2YXJpYW50czogW1xuICAgICAgLy8gRmxvYXRpbmctcG9pbnQgbGl0ZXJhbC5cbiAgICAgIHsgYmVnaW46XG4gICAgICAgIFwiWystXT8oPzpcIiAvLyBMZWFkaW5nIHNpZ24uXG4gICAgICAgICAgLy8gRGVjaW1hbC5cbiAgICAgICAgICArIFwiKD86XCJcbiAgICAgICAgICAgICtcIlswLTldKD86Jz9bMC05XSkqXFxcXC4oPzpbMC05XSg/Oic/WzAtOV0pKik/XCJcbiAgICAgICAgICAgICsgXCJ8XFxcXC5bMC05XSg/Oic/WzAtOV0pKlwiXG4gICAgICAgICAgKyBcIikoPzpbRWVdWystXT9bMC05XSg/Oic/WzAtOV0pKik/XCJcbiAgICAgICAgICArIFwifFswLTldKD86Jz9bMC05XSkqW0VlXVsrLV0/WzAtOV0oPzonP1swLTldKSpcIlxuICAgICAgICAgIC8vIEhleGFkZWNpbWFsLlxuICAgICAgICAgICsgXCJ8MFtYeF0oPzpcIlxuICAgICAgICAgICAgK1wiWzAtOUEtRmEtZl0oPzonP1swLTlBLUZhLWZdKSooPzpcXFxcLig/OlswLTlBLUZhLWZdKD86Jz9bMC05QS1GYS1mXSkqKT8pP1wiXG4gICAgICAgICAgICArIFwifFxcXFwuWzAtOUEtRmEtZl0oPzonP1swLTlBLUZhLWZdKSpcIlxuICAgICAgICAgICsgXCIpW1BwXVsrLV0/WzAtOV0oPzonP1swLTldKSpcIlxuICAgICAgICArIFwiKSg/OlwiIC8vIExpdGVyYWwgc3VmZml4ZXMuXG4gICAgICAgICAgKyBcIltGZl0oPzoxNnwzMnw2NHwxMjgpP1wiXG4gICAgICAgICAgKyBcInwoQkZ8YmYpMTZcIlxuICAgICAgICAgICsgXCJ8W0xsXVwiXG4gICAgICAgICAgKyBcInxcIiAvLyBMaXRlcmFsIHN1ZmZpeCBpcyBvcHRpb25hbC5cbiAgICAgICAgKyBcIilcIlxuICAgICAgfSxcbiAgICAgIC8vIEludGVnZXIgbGl0ZXJhbC5cbiAgICAgIHsgYmVnaW46XG4gICAgICAgIFwiWystXT9cXFxcYig/OlwiIC8vIExlYWRpbmcgc2lnbi5cbiAgICAgICAgICArIFwiMFtCYl1bMDFdKD86Jz9bMDFdKSpcIiAvLyBCaW5hcnkuXG4gICAgICAgICAgKyBcInwwW1h4XVswLTlBLUZhLWZdKD86Jz9bMC05QS1GYS1mXSkqXCIgLy8gSGV4YWRlY2ltYWwuXG4gICAgICAgICAgKyBcInwwKD86Jz9bMC03XSkqXCIgLy8gT2N0YWwgb3IganVzdCBhIGxvbmUgemVyby5cbiAgICAgICAgICArIFwifFsxLTldKD86Jz9bMC05XSkqXCIgLy8gRGVjaW1hbC5cbiAgICAgICAgKyBcIikoPzpcIiAvLyBMaXRlcmFsIHN1ZmZpeGVzLlxuICAgICAgICAgICsgXCJbVXVdKD86TEw/fGxsPylcIlxuICAgICAgICAgICsgXCJ8W1V1XVtael0/XCJcbiAgICAgICAgICArIFwifCg/OkxMP3xsbD8pW1V1XT9cIlxuICAgICAgICAgICsgXCJ8W1p6XVtVdV1cIlxuICAgICAgICAgICsgXCJ8XCIgLy8gTGl0ZXJhbCBzdWZmaXggaXMgb3B0aW9uYWwuXG4gICAgICAgICsgXCIpXCJcbiAgICAgICAgLy8gTm90ZTogdGhlcmUgYXJlIHVzZXItZGVmaW5lZCBsaXRlcmFsIHN1ZmZpeGVzIHRvbywgYnV0IHBlcmhhcHMgaGF2aW5nIHRoZSBjdXN0b20gc3VmZml4IG5vdCBwYXJ0IG9mIHRoZVxuICAgICAgICAvLyBsaXRlcmFsIGhpZ2hsaWdodCBhY3R1YWxseSBtYWtlcyBpdCBzdGFuZCBvdXQgbW9yZS5cbiAgICAgIH1cbiAgICBdLFxuICAgIHJlbGV2YW5jZTogMFxuICB9O1xuXG4gIGNvbnN0IFBSRVBST0NFU1NPUiA9IHtcbiAgICBjbGFzc05hbWU6ICdtZXRhJyxcbiAgICBiZWdpbjogLyNcXHMqW2Etel0rXFxiLyxcbiAgICBlbmQ6IC8kLyxcbiAgICBrZXl3b3JkczogeyBrZXl3b3JkOlxuICAgICAgICAnaWYgZWxzZSBlbGlmIGVuZGlmIGRlZmluZSB1bmRlZiB3YXJuaW5nIGVycm9yIGxpbmUgJ1xuICAgICAgICArICdwcmFnbWEgX1ByYWdtYSBpZmRlZiBpZm5kZWYgaW5jbHVkZScgfSxcbiAgICBjb250YWluczogW1xuICAgICAge1xuICAgICAgICBiZWdpbjogL1xcXFxcXG4vLFxuICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgIH0sXG4gICAgICBobGpzLmluaGVyaXQoU1RSSU5HUywgeyBjbGFzc05hbWU6ICdzdHJpbmcnIH0pLFxuICAgICAge1xuICAgICAgICBjbGFzc05hbWU6ICdzdHJpbmcnLFxuICAgICAgICBiZWdpbjogLzwuKj8+L1xuICAgICAgfSxcbiAgICAgIENfTElORV9DT01NRU5UX01PREUsXG4gICAgICBobGpzLkNfQkxPQ0tfQ09NTUVOVF9NT0RFXG4gICAgXVxuICB9O1xuXG4gIGNvbnN0IFRJVExFX01PREUgPSB7XG4gICAgY2xhc3NOYW1lOiAndGl0bGUnLFxuICAgIGJlZ2luOiByZWdleC5vcHRpb25hbChOQU1FU1BBQ0VfUkUpICsgaGxqcy5JREVOVF9SRSxcbiAgICByZWxldmFuY2U6IDBcbiAgfTtcblxuICBjb25zdCBGVU5DVElPTl9USVRMRSA9IHJlZ2V4Lm9wdGlvbmFsKE5BTUVTUEFDRV9SRSkgKyBobGpzLklERU5UX1JFICsgJ1xcXFxzKlxcXFwoJztcblxuICAvLyBodHRwczovL2VuLmNwcHJlZmVyZW5jZS5jb20vdy9jcHAva2V5d29yZFxuICBjb25zdCBSRVNFUlZFRF9LRVlXT1JEUyA9IFtcbiAgICAnYWxpZ25hcycsXG4gICAgJ2FsaWdub2YnLFxuICAgICdhbmQnLFxuICAgICdhbmRfZXEnLFxuICAgICdhc20nLFxuICAgICdhdG9taWNfY2FuY2VsJyxcbiAgICAnYXRvbWljX2NvbW1pdCcsXG4gICAgJ2F0b21pY19ub2V4Y2VwdCcsXG4gICAgJ2F1dG8nLFxuICAgICdiaXRhbmQnLFxuICAgICdiaXRvcicsXG4gICAgJ2JyZWFrJyxcbiAgICAnY2FzZScsXG4gICAgJ2NhdGNoJyxcbiAgICAnY2xhc3MnLFxuICAgICdjb19hd2FpdCcsXG4gICAgJ2NvX3JldHVybicsXG4gICAgJ2NvX3lpZWxkJyxcbiAgICAnY29tcGwnLFxuICAgICdjb25jZXB0JyxcbiAgICAnY29uc3RfY2FzdHwxMCcsXG4gICAgJ2NvbnN0ZXZhbCcsXG4gICAgJ2NvbnN0ZXhwcicsXG4gICAgJ2NvbnN0aW5pdCcsXG4gICAgJ2NvbnRpbnVlJyxcbiAgICAnZGVjbHR5cGUnLFxuICAgICdkZWZhdWx0JyxcbiAgICAnZGVsZXRlJyxcbiAgICAnZG8nLFxuICAgICdkeW5hbWljX2Nhc3R8MTAnLFxuICAgICdlbHNlJyxcbiAgICAnZW51bScsXG4gICAgJ2V4cGxpY2l0JyxcbiAgICAnZXhwb3J0JyxcbiAgICAnZXh0ZXJuJyxcbiAgICAnZmFsc2UnLFxuICAgICdmaW5hbCcsXG4gICAgJ2ZvcicsXG4gICAgJ2ZyaWVuZCcsXG4gICAgJ2dvdG8nLFxuICAgICdpZicsXG4gICAgJ2ltcG9ydCcsXG4gICAgJ2lubGluZScsXG4gICAgJ21vZHVsZScsXG4gICAgJ211dGFibGUnLFxuICAgICduYW1lc3BhY2UnLFxuICAgICduZXcnLFxuICAgICdub2V4Y2VwdCcsXG4gICAgJ25vdCcsXG4gICAgJ25vdF9lcScsXG4gICAgJ251bGxwdHInLFxuICAgICdvcGVyYXRvcicsXG4gICAgJ29yJyxcbiAgICAnb3JfZXEnLFxuICAgICdvdmVycmlkZScsXG4gICAgJ3ByaXZhdGUnLFxuICAgICdwcm90ZWN0ZWQnLFxuICAgICdwdWJsaWMnLFxuICAgICdyZWZsZXhwcicsXG4gICAgJ3JlZ2lzdGVyJyxcbiAgICAncmVpbnRlcnByZXRfY2FzdHwxMCcsXG4gICAgJ3JlcXVpcmVzJyxcbiAgICAncmV0dXJuJyxcbiAgICAnc2l6ZW9mJyxcbiAgICAnc3RhdGljX2Fzc2VydCcsXG4gICAgJ3N0YXRpY19jYXN0fDEwJyxcbiAgICAnc3RydWN0JyxcbiAgICAnc3dpdGNoJyxcbiAgICAnc3luY2hyb25pemVkJyxcbiAgICAndGVtcGxhdGUnLFxuICAgICd0aGlzJyxcbiAgICAndGhyZWFkX2xvY2FsJyxcbiAgICAndGhyb3cnLFxuICAgICd0cmFuc2FjdGlvbl9zYWZlJyxcbiAgICAndHJhbnNhY3Rpb25fc2FmZV9keW5hbWljJyxcbiAgICAndHJ1ZScsXG4gICAgJ3RyeScsXG4gICAgJ3R5cGVkZWYnLFxuICAgICd0eXBlaWQnLFxuICAgICd0eXBlbmFtZScsXG4gICAgJ3VuaW9uJyxcbiAgICAndXNpbmcnLFxuICAgICd2aXJ0dWFsJyxcbiAgICAndm9sYXRpbGUnLFxuICAgICd3aGlsZScsXG4gICAgJ3hvcicsXG4gICAgJ3hvcl9lcSdcbiAgXTtcblxuICAvLyBodHRwczovL2VuLmNwcHJlZmVyZW5jZS5jb20vdy9jcHAva2V5d29yZFxuICBjb25zdCBSRVNFUlZFRF9UWVBFUyA9IFtcbiAgICAnYm9vbCcsXG4gICAgJ2NoYXInLFxuICAgICdjaGFyMTZfdCcsXG4gICAgJ2NoYXIzMl90JyxcbiAgICAnY2hhcjhfdCcsXG4gICAgJ2RvdWJsZScsXG4gICAgJ2Zsb2F0JyxcbiAgICAnaW50JyxcbiAgICAnbG9uZycsXG4gICAgJ3Nob3J0JyxcbiAgICAndm9pZCcsXG4gICAgJ3djaGFyX3QnLFxuICAgICd1bnNpZ25lZCcsXG4gICAgJ3NpZ25lZCcsXG4gICAgJ2NvbnN0JyxcbiAgICAnc3RhdGljJ1xuICBdO1xuXG4gIGNvbnN0IFRZUEVfSElOVFMgPSBbXG4gICAgJ2FueScsXG4gICAgJ2F1dG9fcHRyJyxcbiAgICAnYmFycmllcicsXG4gICAgJ2JpbmFyeV9zZW1hcGhvcmUnLFxuICAgICdiaXRzZXQnLFxuICAgICdjb21wbGV4JyxcbiAgICAnY29uZGl0aW9uX3ZhcmlhYmxlJyxcbiAgICAnY29uZGl0aW9uX3ZhcmlhYmxlX2FueScsXG4gICAgJ2NvdW50aW5nX3NlbWFwaG9yZScsXG4gICAgJ2RlcXVlJyxcbiAgICAnZmFsc2VfdHlwZScsXG4gICAgJ2ZsYXRfbWFwJyxcbiAgICAnZmxhdF9zZXQnLFxuICAgICdmdXR1cmUnLFxuICAgICdpbWFnaW5hcnknLFxuICAgICdpbml0aWFsaXplcl9saXN0JyxcbiAgICAnaXN0cmluZ3N0cmVhbScsXG4gICAgJ2p0aHJlYWQnLFxuICAgICdsYXRjaCcsXG4gICAgJ2xvY2tfZ3VhcmQnLFxuICAgICdtdWx0aW1hcCcsXG4gICAgJ211bHRpc2V0JyxcbiAgICAnbXV0ZXgnLFxuICAgICdvcHRpb25hbCcsXG4gICAgJ29zdHJpbmdzdHJlYW0nLFxuICAgICdwYWNrYWdlZF90YXNrJyxcbiAgICAncGFpcicsXG4gICAgJ3Byb21pc2UnLFxuICAgICdwcmlvcml0eV9xdWV1ZScsXG4gICAgJ3F1ZXVlJyxcbiAgICAncmVjdXJzaXZlX211dGV4JyxcbiAgICAncmVjdXJzaXZlX3RpbWVkX211dGV4JyxcbiAgICAnc2NvcGVkX2xvY2snLFxuICAgICdzZXQnLFxuICAgICdzaGFyZWRfZnV0dXJlJyxcbiAgICAnc2hhcmVkX2xvY2snLFxuICAgICdzaGFyZWRfbXV0ZXgnLFxuICAgICdzaGFyZWRfdGltZWRfbXV0ZXgnLFxuICAgICdzaGFyZWRfcHRyJyxcbiAgICAnc3RhY2snLFxuICAgICdzdHJpbmdfdmlldycsXG4gICAgJ3N0cmluZ3N0cmVhbScsXG4gICAgJ3RpbWVkX211dGV4JyxcbiAgICAndGhyZWFkJyxcbiAgICAndHJ1ZV90eXBlJyxcbiAgICAndHVwbGUnLFxuICAgICd1bmlxdWVfbG9jaycsXG4gICAgJ3VuaXF1ZV9wdHInLFxuICAgICd1bm9yZGVyZWRfbWFwJyxcbiAgICAndW5vcmRlcmVkX211bHRpbWFwJyxcbiAgICAndW5vcmRlcmVkX211bHRpc2V0JyxcbiAgICAndW5vcmRlcmVkX3NldCcsXG4gICAgJ3ZhcmlhbnQnLFxuICAgICd2ZWN0b3InLFxuICAgICd3ZWFrX3B0cicsXG4gICAgJ3dzdHJpbmcnLFxuICAgICd3c3RyaW5nX3ZpZXcnXG4gIF07XG5cbiAgY29uc3QgRlVOQ1RJT05fSElOVFMgPSBbXG4gICAgJ2Fib3J0JyxcbiAgICAnYWJzJyxcbiAgICAnYWNvcycsXG4gICAgJ2FwcGx5JyxcbiAgICAnYXNfY29uc3QnLFxuICAgICdhc2luJyxcbiAgICAnYXRhbicsXG4gICAgJ2F0YW4yJyxcbiAgICAnY2FsbG9jJyxcbiAgICAnY2VpbCcsXG4gICAgJ2NlcnInLFxuICAgICdjaW4nLFxuICAgICdjbG9nJyxcbiAgICAnY29zJyxcbiAgICAnY29zaCcsXG4gICAgJ2NvdXQnLFxuICAgICdkZWNsdmFsJyxcbiAgICAnZW5kbCcsXG4gICAgJ2V4Y2hhbmdlJyxcbiAgICAnZXhpdCcsXG4gICAgJ2V4cCcsXG4gICAgJ2ZhYnMnLFxuICAgICdmbG9vcicsXG4gICAgJ2Ztb2QnLFxuICAgICdmb3J3YXJkJyxcbiAgICAnZnByaW50ZicsXG4gICAgJ2ZwdXRzJyxcbiAgICAnZnJlZScsXG4gICAgJ2ZyZXhwJyxcbiAgICAnZnNjYW5mJyxcbiAgICAnZnV0dXJlJyxcbiAgICAnaW52b2tlJyxcbiAgICAnaXNhbG51bScsXG4gICAgJ2lzYWxwaGEnLFxuICAgICdpc2NudHJsJyxcbiAgICAnaXNkaWdpdCcsXG4gICAgJ2lzZ3JhcGgnLFxuICAgICdpc2xvd2VyJyxcbiAgICAnaXNwcmludCcsXG4gICAgJ2lzcHVuY3QnLFxuICAgICdpc3NwYWNlJyxcbiAgICAnaXN1cHBlcicsXG4gICAgJ2lzeGRpZ2l0JyxcbiAgICAnbGFicycsXG4gICAgJ2xhdW5kZXInLFxuICAgICdsZGV4cCcsXG4gICAgJ2xvZycsXG4gICAgJ2xvZzEwJyxcbiAgICAnbWFrZV9wYWlyJyxcbiAgICAnbWFrZV9zaGFyZWQnLFxuICAgICdtYWtlX3NoYXJlZF9mb3Jfb3ZlcndyaXRlJyxcbiAgICAnbWFrZV90dXBsZScsXG4gICAgJ21ha2VfdW5pcXVlJyxcbiAgICAnbWFsbG9jJyxcbiAgICAnbWVtY2hyJyxcbiAgICAnbWVtY21wJyxcbiAgICAnbWVtY3B5JyxcbiAgICAnbWVtc2V0JyxcbiAgICAnbW9kZicsXG4gICAgJ21vdmUnLFxuICAgICdwb3cnLFxuICAgICdwcmludGYnLFxuICAgICdwdXRjaGFyJyxcbiAgICAncHV0cycsXG4gICAgJ3JlYWxsb2MnLFxuICAgICdzY2FuZicsXG4gICAgJ3NpbicsXG4gICAgJ3NpbmgnLFxuICAgICdzbnByaW50ZicsXG4gICAgJ3NwcmludGYnLFxuICAgICdzcXJ0JyxcbiAgICAnc3NjYW5mJyxcbiAgICAnc3RkJyxcbiAgICAnc3RkZXJyJyxcbiAgICAnc3RkaW4nLFxuICAgICdzdGRvdXQnLFxuICAgICdzdHJjYXQnLFxuICAgICdzdHJjaHInLFxuICAgICdzdHJjbXAnLFxuICAgICdzdHJjcHknLFxuICAgICdzdHJjc3BuJyxcbiAgICAnc3RybGVuJyxcbiAgICAnc3RybmNhdCcsXG4gICAgJ3N0cm5jbXAnLFxuICAgICdzdHJuY3B5JyxcbiAgICAnc3RycGJyaycsXG4gICAgJ3N0cnJjaHInLFxuICAgICdzdHJzcG4nLFxuICAgICdzdHJzdHInLFxuICAgICdzd2FwJyxcbiAgICAndGFuJyxcbiAgICAndGFuaCcsXG4gICAgJ3Rlcm1pbmF0ZScsXG4gICAgJ3RvX3VuZGVybHlpbmcnLFxuICAgICd0b2xvd2VyJyxcbiAgICAndG91cHBlcicsXG4gICAgJ3ZmcHJpbnRmJyxcbiAgICAndmlzaXQnLFxuICAgICd2cHJpbnRmJyxcbiAgICAndnNwcmludGYnXG4gIF07XG5cbiAgY29uc3QgTElURVJBTFMgPSBbXG4gICAgJ05VTEwnLFxuICAgICdmYWxzZScsXG4gICAgJ251bGxvcHQnLFxuICAgICdudWxscHRyJyxcbiAgICAndHJ1ZSdcbiAgXTtcblxuICAvLyBodHRwczovL2VuLmNwcHJlZmVyZW5jZS5jb20vdy9jcHAva2V5d29yZFxuICBjb25zdCBCVUlMVF9JTiA9IFsgJ19QcmFnbWEnIF07XG5cbiAgY29uc3QgQ1BQX0tFWVdPUkRTID0ge1xuICAgIHR5cGU6IFJFU0VSVkVEX1RZUEVTLFxuICAgIGtleXdvcmQ6IFJFU0VSVkVEX0tFWVdPUkRTLFxuICAgIGxpdGVyYWw6IExJVEVSQUxTLFxuICAgIGJ1aWx0X2luOiBCVUlMVF9JTixcbiAgICBfdHlwZV9oaW50czogVFlQRV9ISU5UU1xuICB9O1xuXG4gIGNvbnN0IEZVTkNUSU9OX0RJU1BBVENIID0ge1xuICAgIGNsYXNzTmFtZTogJ2Z1bmN0aW9uLmRpc3BhdGNoJyxcbiAgICByZWxldmFuY2U6IDAsXG4gICAga2V5d29yZHM6IHtcbiAgICAgIC8vIE9ubHkgZm9yIHJlbGV2YW5jZSwgbm90IGhpZ2hsaWdodGluZy5cbiAgICAgIF9oaW50OiBGVU5DVElPTl9ISU5UUyB9LFxuICAgIGJlZ2luOiByZWdleC5jb25jYXQoXG4gICAgICAvXFxiLyxcbiAgICAgIC8oPyFkZWNsdHlwZSkvLFxuICAgICAgLyg/IWlmKS8sXG4gICAgICAvKD8hZm9yKS8sXG4gICAgICAvKD8hc3dpdGNoKS8sXG4gICAgICAvKD8hd2hpbGUpLyxcbiAgICAgIGhsanMuSURFTlRfUkUsXG4gICAgICByZWdleC5sb29rYWhlYWQoLyg8W148Pl0rPnwpXFxzKlxcKC8pKVxuICB9O1xuXG4gIGNvbnN0IEVYUFJFU1NJT05fQ09OVEFJTlMgPSBbXG4gICAgRlVOQ1RJT05fRElTUEFUQ0gsXG4gICAgUFJFUFJPQ0VTU09SLFxuICAgIENQUF9QUklNSVRJVkVfVFlQRVMsXG4gICAgQ19MSU5FX0NPTU1FTlRfTU9ERSxcbiAgICBobGpzLkNfQkxPQ0tfQ09NTUVOVF9NT0RFLFxuICAgIE5VTUJFUlMsXG4gICAgU1RSSU5HU1xuICBdO1xuXG4gIGNvbnN0IEVYUFJFU1NJT05fQ09OVEVYVCA9IHtcbiAgICAvLyBUaGlzIG1vZGUgY292ZXJzIGV4cHJlc3Npb24gY29udGV4dCB3aGVyZSB3ZSBjYW4ndCBleHBlY3QgYSBmdW5jdGlvblxuICAgIC8vIGRlZmluaXRpb24gYW5kIHNob3VsZG4ndCBoaWdobGlnaHQgYW55dGhpbmcgdGhhdCBsb29rcyBsaWtlIG9uZTpcbiAgICAvLyBgcmV0dXJuIHNvbWUoKWAsIGBlbHNlIGlmKClgLCBgKHgqc3VtKDEsIDIpKWBcbiAgICB2YXJpYW50czogW1xuICAgICAge1xuICAgICAgICBiZWdpbjogLz0vLFxuICAgICAgICBlbmQ6IC87L1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgYmVnaW46IC9cXCgvLFxuICAgICAgICBlbmQ6IC9cXCkvXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBiZWdpbktleXdvcmRzOiAnbmV3IHRocm93IHJldHVybiBlbHNlJyxcbiAgICAgICAgZW5kOiAvOy9cbiAgICAgIH1cbiAgICBdLFxuICAgIGtleXdvcmRzOiBDUFBfS0VZV09SRFMsXG4gICAgY29udGFpbnM6IEVYUFJFU1NJT05fQ09OVEFJTlMuY29uY2F0KFtcbiAgICAgIHtcbiAgICAgICAgYmVnaW46IC9cXCgvLFxuICAgICAgICBlbmQ6IC9cXCkvLFxuICAgICAgICBrZXl3b3JkczogQ1BQX0tFWVdPUkRTLFxuICAgICAgICBjb250YWluczogRVhQUkVTU0lPTl9DT05UQUlOUy5jb25jYXQoWyAnc2VsZicgXSksXG4gICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgfVxuICAgIF0pLFxuICAgIHJlbGV2YW5jZTogMFxuICB9O1xuXG4gIGNvbnN0IEZVTkNUSU9OX0RFQ0xBUkFUSU9OID0ge1xuICAgIGNsYXNzTmFtZTogJ2Z1bmN0aW9uJyxcbiAgICBiZWdpbjogJygnICsgRlVOQ1RJT05fVFlQRV9SRSArICdbXFxcXComXFxcXHNdKykrJyArIEZVTkNUSU9OX1RJVExFLFxuICAgIHJldHVybkJlZ2luOiB0cnVlLFxuICAgIGVuZDogL1t7Oz1dLyxcbiAgICBleGNsdWRlRW5kOiB0cnVlLFxuICAgIGtleXdvcmRzOiBDUFBfS0VZV09SRFMsXG4gICAgaWxsZWdhbDogL1teXFx3XFxzXFwqJjo8Pi5dLyxcbiAgICBjb250YWluczogW1xuICAgICAgeyAvLyB0byBwcmV2ZW50IGl0IGZyb20gYmVpbmcgY29uZnVzZWQgYXMgdGhlIGZ1bmN0aW9uIHRpdGxlXG4gICAgICAgIGJlZ2luOiBERUNMVFlQRV9BVVRPX1JFLFxuICAgICAgICBrZXl3b3JkczogQ1BQX0tFWVdPUkRTLFxuICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGJlZ2luOiBGVU5DVElPTl9USVRMRSxcbiAgICAgICAgcmV0dXJuQmVnaW46IHRydWUsXG4gICAgICAgIGNvbnRhaW5zOiBbIFRJVExFX01PREUgXSxcbiAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICB9LFxuICAgICAgLy8gbmVlZGVkIGJlY2F1c2Ugd2UgZG8gbm90IGhhdmUgbG9vay1iZWhpbmQgb24gdGhlIGJlbG93IHJ1bGVcbiAgICAgIC8vIHRvIHByZXZlbnQgaXQgZnJvbSBncmFiYmluZyB0aGUgZmluYWwgOiBpbiBhIDo6IHBhaXJcbiAgICAgIHtcbiAgICAgICAgYmVnaW46IC86Oi8sXG4gICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgfSxcbiAgICAgIC8vIGluaXRpYWxpemVyc1xuICAgICAge1xuICAgICAgICBiZWdpbjogLzovLFxuICAgICAgICBlbmRzV2l0aFBhcmVudDogdHJ1ZSxcbiAgICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgICBTVFJJTkdTLFxuICAgICAgICAgIE5VTUJFUlNcbiAgICAgICAgXVxuICAgICAgfSxcbiAgICAgIC8vIGFsbG93IGZvciBtdWx0aXBsZSBkZWNsYXJhdGlvbnMsIGUuZy46XG4gICAgICAvLyBleHRlcm4gdm9pZCBmKGludCksIGcoY2hhcik7XG4gICAgICB7XG4gICAgICAgIHJlbGV2YW5jZTogMCxcbiAgICAgICAgbWF0Y2g6IC8sL1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgY2xhc3NOYW1lOiAncGFyYW1zJyxcbiAgICAgICAgYmVnaW46IC9cXCgvLFxuICAgICAgICBlbmQ6IC9cXCkvLFxuICAgICAgICBrZXl3b3JkczogQ1BQX0tFWVdPUkRTLFxuICAgICAgICByZWxldmFuY2U6IDAsXG4gICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAgQ19MSU5FX0NPTU1FTlRfTU9ERSxcbiAgICAgICAgICBobGpzLkNfQkxPQ0tfQ09NTUVOVF9NT0RFLFxuICAgICAgICAgIFNUUklOR1MsXG4gICAgICAgICAgTlVNQkVSUyxcbiAgICAgICAgICBDUFBfUFJJTUlUSVZFX1RZUEVTLFxuICAgICAgICAgIC8vIENvdW50IG1hdGNoaW5nIHBhcmVudGhlc2VzLlxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGJlZ2luOiAvXFwoLyxcbiAgICAgICAgICAgIGVuZDogL1xcKS8sXG4gICAgICAgICAgICBrZXl3b3JkczogQ1BQX0tFWVdPUkRTLFxuICAgICAgICAgICAgcmVsZXZhbmNlOiAwLFxuICAgICAgICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgICAgICAgJ3NlbGYnLFxuICAgICAgICAgICAgICBDX0xJTkVfQ09NTUVOVF9NT0RFLFxuICAgICAgICAgICAgICBobGpzLkNfQkxPQ0tfQ09NTUVOVF9NT0RFLFxuICAgICAgICAgICAgICBTVFJJTkdTLFxuICAgICAgICAgICAgICBOVU1CRVJTLFxuICAgICAgICAgICAgICBDUFBfUFJJTUlUSVZFX1RZUEVTXG4gICAgICAgICAgICBdXG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9LFxuICAgICAgQ1BQX1BSSU1JVElWRV9UWVBFUyxcbiAgICAgIENfTElORV9DT01NRU5UX01PREUsXG4gICAgICBobGpzLkNfQkxPQ0tfQ09NTUVOVF9NT0RFLFxuICAgICAgUFJFUFJPQ0VTU09SXG4gICAgXVxuICB9O1xuXG4gIHJldHVybiB7XG4gICAgbmFtZTogJ0MrKycsXG4gICAgYWxpYXNlczogW1xuICAgICAgJ2NjJyxcbiAgICAgICdjKysnLFxuICAgICAgJ2grKycsXG4gICAgICAnaHBwJyxcbiAgICAgICdoaCcsXG4gICAgICAnaHh4JyxcbiAgICAgICdjeHgnXG4gICAgXSxcbiAgICBrZXl3b3JkczogQ1BQX0tFWVdPUkRTLFxuICAgIGlsbGVnYWw6ICc8LycsXG4gICAgY2xhc3NOYW1lQWxpYXNlczogeyAnZnVuY3Rpb24uZGlzcGF0Y2gnOiAnYnVpbHRfaW4nIH0sXG4gICAgY29udGFpbnM6IFtdLmNvbmNhdChcbiAgICAgIEVYUFJFU1NJT05fQ09OVEVYVCxcbiAgICAgIEZVTkNUSU9OX0RFQ0xBUkFUSU9OLFxuICAgICAgRlVOQ1RJT05fRElTUEFUQ0gsXG4gICAgICBFWFBSRVNTSU9OX0NPTlRBSU5TLFxuICAgICAgW1xuICAgICAgICBQUkVQUk9DRVNTT1IsXG4gICAgICAgIHsgLy8gY29udGFpbmVyczogaWUsIGB2ZWN0b3IgPGludD4gcm9vbXMgKDkpO2BcbiAgICAgICAgICBiZWdpbjogJ1xcXFxiKGRlcXVlfGxpc3R8cXVldWV8cHJpb3JpdHlfcXVldWV8cGFpcnxzdGFja3x2ZWN0b3J8bWFwfHNldHxiaXRzZXR8bXVsdGlzZXR8bXVsdGltYXB8dW5vcmRlcmVkX21hcHx1bm9yZGVyZWRfc2V0fHVub3JkZXJlZF9tdWx0aXNldHx1bm9yZGVyZWRfbXVsdGltYXB8YXJyYXl8dHVwbGV8b3B0aW9uYWx8dmFyaWFudHxmdW5jdGlvbnxmbGF0X21hcHxmbGF0X3NldClcXFxccyo8KD8hPCknLFxuICAgICAgICAgIGVuZDogJz4nLFxuICAgICAgICAgIGtleXdvcmRzOiBDUFBfS0VZV09SRFMsXG4gICAgICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgICAgICdzZWxmJyxcbiAgICAgICAgICAgIENQUF9QUklNSVRJVkVfVFlQRVNcbiAgICAgICAgICBdXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBiZWdpbjogaGxqcy5JREVOVF9SRSArICc6OicsXG4gICAgICAgICAga2V5d29yZHM6IENQUF9LRVlXT1JEU1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbWF0Y2g6IFtcbiAgICAgICAgICAgIC8vIGV4dHJhIGNvbXBsZXhpdHkgdG8gZGVhbCB3aXRoIGBlbnVtIGNsYXNzYCBhbmQgYGVudW0gc3RydWN0YFxuICAgICAgICAgICAgL1xcYig/OmVudW0oPzpcXHMrKD86Y2xhc3N8c3RydWN0KSk/fGNsYXNzfHN0cnVjdHx1bmlvbikvLFxuICAgICAgICAgICAgL1xccysvLFxuICAgICAgICAgICAgL1xcdysvXG4gICAgICAgICAgXSxcbiAgICAgICAgICBjbGFzc05hbWU6IHtcbiAgICAgICAgICAgIDE6ICdrZXl3b3JkJyxcbiAgICAgICAgICAgIDM6ICd0aXRsZS5jbGFzcydcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIF0pXG4gIH07XG59XG5cbmV4cG9ydCB7IGNwcCBhcyBkZWZhdWx0IH07XG4iLCAiY29uc3QgSURFTlRfUkUgPSAnW0EtWmEteiRfXVswLTlBLVphLXokX10qJztcbmNvbnN0IEtFWVdPUkRTID0gW1xuICBcImFzXCIsIC8vIGZvciBleHBvcnRzXG4gIFwiaW5cIixcbiAgXCJvZlwiLFxuICBcImlmXCIsXG4gIFwiZm9yXCIsXG4gIFwid2hpbGVcIixcbiAgXCJmaW5hbGx5XCIsXG4gIFwidmFyXCIsXG4gIFwibmV3XCIsXG4gIFwiZnVuY3Rpb25cIixcbiAgXCJkb1wiLFxuICBcInJldHVyblwiLFxuICBcInZvaWRcIixcbiAgXCJlbHNlXCIsXG4gIFwiYnJlYWtcIixcbiAgXCJjYXRjaFwiLFxuICBcImluc3RhbmNlb2ZcIixcbiAgXCJ3aXRoXCIsXG4gIFwidGhyb3dcIixcbiAgXCJjYXNlXCIsXG4gIFwiZGVmYXVsdFwiLFxuICBcInRyeVwiLFxuICBcInN3aXRjaFwiLFxuICBcImNvbnRpbnVlXCIsXG4gIFwidHlwZW9mXCIsXG4gIFwiZGVsZXRlXCIsXG4gIFwibGV0XCIsXG4gIFwieWllbGRcIixcbiAgXCJjb25zdFwiLFxuICBcImNsYXNzXCIsXG4gIC8vIEpTIGhhbmRsZXMgdGhlc2Ugd2l0aCBhIHNwZWNpYWwgcnVsZVxuICAvLyBcImdldFwiLFxuICAvLyBcInNldFwiLFxuICBcImRlYnVnZ2VyXCIsXG4gIFwiYXN5bmNcIixcbiAgXCJhd2FpdFwiLFxuICBcInN0YXRpY1wiLFxuICBcImltcG9ydFwiLFxuICBcImZyb21cIixcbiAgXCJleHBvcnRcIixcbiAgXCJleHRlbmRzXCIsXG4gIC8vIEl0J3MgcmVhY2hlZCBzdGFnZSAzLCB3aGljaCBpcyBcInJlY29tbWVuZGVkIGZvciBpbXBsZW1lbnRhdGlvblwiOlxuICBcInVzaW5nXCJcbl07XG5jb25zdCBMSVRFUkFMUyA9IFtcbiAgXCJ0cnVlXCIsXG4gIFwiZmFsc2VcIixcbiAgXCJudWxsXCIsXG4gIFwidW5kZWZpbmVkXCIsXG4gIFwiTmFOXCIsXG4gIFwiSW5maW5pdHlcIlxuXTtcblxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHNcbmNvbnN0IFRZUEVTID0gW1xuICAvLyBGdW5kYW1lbnRhbCBvYmplY3RzXG4gIFwiT2JqZWN0XCIsXG4gIFwiRnVuY3Rpb25cIixcbiAgXCJCb29sZWFuXCIsXG4gIFwiU3ltYm9sXCIsXG4gIC8vIG51bWJlcnMgYW5kIGRhdGVzXG4gIFwiTWF0aFwiLFxuICBcIkRhdGVcIixcbiAgXCJOdW1iZXJcIixcbiAgXCJCaWdJbnRcIixcbiAgLy8gdGV4dFxuICBcIlN0cmluZ1wiLFxuICBcIlJlZ0V4cFwiLFxuICAvLyBJbmRleGVkIGNvbGxlY3Rpb25zXG4gIFwiQXJyYXlcIixcbiAgXCJGbG9hdDMyQXJyYXlcIixcbiAgXCJGbG9hdDY0QXJyYXlcIixcbiAgXCJJbnQ4QXJyYXlcIixcbiAgXCJVaW50OEFycmF5XCIsXG4gIFwiVWludDhDbGFtcGVkQXJyYXlcIixcbiAgXCJJbnQxNkFycmF5XCIsXG4gIFwiSW50MzJBcnJheVwiLFxuICBcIlVpbnQxNkFycmF5XCIsXG4gIFwiVWludDMyQXJyYXlcIixcbiAgXCJCaWdJbnQ2NEFycmF5XCIsXG4gIFwiQmlnVWludDY0QXJyYXlcIixcbiAgLy8gS2V5ZWQgY29sbGVjdGlvbnNcbiAgXCJTZXRcIixcbiAgXCJNYXBcIixcbiAgXCJXZWFrU2V0XCIsXG4gIFwiV2Vha01hcFwiLFxuICAvLyBTdHJ1Y3R1cmVkIGRhdGFcbiAgXCJBcnJheUJ1ZmZlclwiLFxuICBcIlNoYXJlZEFycmF5QnVmZmVyXCIsXG4gIFwiQXRvbWljc1wiLFxuICBcIkRhdGFWaWV3XCIsXG4gIFwiSlNPTlwiLFxuICAvLyBDb250cm9sIGFic3RyYWN0aW9uIG9iamVjdHNcbiAgXCJQcm9taXNlXCIsXG4gIFwiR2VuZXJhdG9yXCIsXG4gIFwiR2VuZXJhdG9yRnVuY3Rpb25cIixcbiAgXCJBc3luY0Z1bmN0aW9uXCIsXG4gIC8vIFJlZmxlY3Rpb25cbiAgXCJSZWZsZWN0XCIsXG4gIFwiUHJveHlcIixcbiAgLy8gSW50ZXJuYXRpb25hbGl6YXRpb25cbiAgXCJJbnRsXCIsXG4gIC8vIFdlYkFzc2VtYmx5XG4gIFwiV2ViQXNzZW1ibHlcIlxuXTtcblxuY29uc3QgRVJST1JfVFlQRVMgPSBbXG4gIFwiRXJyb3JcIixcbiAgXCJFdmFsRXJyb3JcIixcbiAgXCJJbnRlcm5hbEVycm9yXCIsXG4gIFwiUmFuZ2VFcnJvclwiLFxuICBcIlJlZmVyZW5jZUVycm9yXCIsXG4gIFwiU3ludGF4RXJyb3JcIixcbiAgXCJUeXBlRXJyb3JcIixcbiAgXCJVUklFcnJvclwiXG5dO1xuXG5jb25zdCBCVUlMVF9JTl9HTE9CQUxTID0gW1xuICBcInNldEludGVydmFsXCIsXG4gIFwic2V0VGltZW91dFwiLFxuICBcImNsZWFySW50ZXJ2YWxcIixcbiAgXCJjbGVhclRpbWVvdXRcIixcblxuICBcInJlcXVpcmVcIixcbiAgXCJleHBvcnRzXCIsXG5cbiAgXCJldmFsXCIsXG4gIFwiaXNGaW5pdGVcIixcbiAgXCJpc05hTlwiLFxuICBcInBhcnNlRmxvYXRcIixcbiAgXCJwYXJzZUludFwiLFxuICBcImRlY29kZVVSSVwiLFxuICBcImRlY29kZVVSSUNvbXBvbmVudFwiLFxuICBcImVuY29kZVVSSVwiLFxuICBcImVuY29kZVVSSUNvbXBvbmVudFwiLFxuICBcImVzY2FwZVwiLFxuICBcInVuZXNjYXBlXCJcbl07XG5cbmNvbnN0IEJVSUxUX0lOX1ZBUklBQkxFUyA9IFtcbiAgXCJhcmd1bWVudHNcIixcbiAgXCJ0aGlzXCIsXG4gIFwic3VwZXJcIixcbiAgXCJjb25zb2xlXCIsXG4gIFwid2luZG93XCIsXG4gIFwiZG9jdW1lbnRcIixcbiAgXCJsb2NhbFN0b3JhZ2VcIixcbiAgXCJzZXNzaW9uU3RvcmFnZVwiLFxuICBcIm1vZHVsZVwiLFxuICBcImdsb2JhbFwiIC8vIE5vZGUuanNcbl07XG5cbmNvbnN0IEJVSUxUX0lOUyA9IFtdLmNvbmNhdChcbiAgQlVJTFRfSU5fR0xPQkFMUyxcbiAgVFlQRVMsXG4gIEVSUk9SX1RZUEVTXG4pO1xuXG4vKlxuTGFuZ3VhZ2U6IEphdmFTY3JpcHRcbkRlc2NyaXB0aW9uOiBKYXZhU2NyaXB0IChKUykgaXMgYSBsaWdodHdlaWdodCwgaW50ZXJwcmV0ZWQsIG9yIGp1c3QtaW4tdGltZSBjb21waWxlZCBwcm9ncmFtbWluZyBsYW5ndWFnZSB3aXRoIGZpcnN0LWNsYXNzIGZ1bmN0aW9ucy5cbkNhdGVnb3J5OiBjb21tb24sIHNjcmlwdGluZywgd2ViXG5XZWJzaXRlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0XG4qL1xuXG5cbi8qKiBAdHlwZSBMYW5ndWFnZUZuICovXG5mdW5jdGlvbiBqYXZhc2NyaXB0KGhsanMpIHtcbiAgY29uc3QgcmVnZXggPSBobGpzLnJlZ2V4O1xuICAvKipcbiAgICogVGFrZXMgYSBzdHJpbmcgbGlrZSBcIjxCb29nZXJcIiBhbmQgY2hlY2tzIHRvIHNlZVxuICAgKiBpZiB3ZSBjYW4gZmluZCBhIG1hdGNoaW5nIFwiPC9Cb29nZXJcIiBsYXRlciBpbiB0aGVcbiAgICogY29udGVudC5cbiAgICogQHBhcmFtIHtSZWdFeHBNYXRjaEFycmF5fSBtYXRjaFxuICAgKiBAcGFyYW0ge3thZnRlcjpudW1iZXJ9fSBwYXJhbTFcbiAgICovXG4gIGNvbnN0IGhhc0Nsb3NpbmdUYWcgPSAobWF0Y2gsIHsgYWZ0ZXIgfSkgPT4ge1xuICAgIGNvbnN0IHRhZyA9IFwiPC9cIiArIG1hdGNoWzBdLnNsaWNlKDEpO1xuICAgIGNvbnN0IHBvcyA9IG1hdGNoLmlucHV0LmluZGV4T2YodGFnLCBhZnRlcik7XG4gICAgcmV0dXJuIHBvcyAhPT0gLTE7XG4gIH07XG5cbiAgY29uc3QgSURFTlRfUkUkMSA9IElERU5UX1JFO1xuICBjb25zdCBGUkFHTUVOVCA9IHtcbiAgICBiZWdpbjogJzw+JyxcbiAgICBlbmQ6ICc8Lz4nXG4gIH07XG4gIC8vIHRvIGF2b2lkIHNvbWUgc3BlY2lhbCBjYXNlcyBpbnNpZGUgaXNUcnVseU9wZW5pbmdUYWdcbiAgY29uc3QgWE1MX1NFTEZfQ0xPU0lORyA9IC88W0EtWmEtejAtOVxcXFwuXzotXStcXHMqXFwvPi87XG4gIGNvbnN0IFhNTF9UQUcgPSB7XG4gICAgYmVnaW46IC88W0EtWmEtejAtOVxcXFwuXzotXSsvLFxuICAgIGVuZDogL1xcL1tBLVphLXowLTlcXFxcLl86LV0rPnxcXC8+LyxcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge1JlZ0V4cE1hdGNoQXJyYXl9IG1hdGNoXG4gICAgICogQHBhcmFtIHtDYWxsYmFja1Jlc3BvbnNlfSByZXNwb25zZVxuICAgICAqL1xuICAgIGlzVHJ1bHlPcGVuaW5nVGFnOiAobWF0Y2gsIHJlc3BvbnNlKSA9PiB7XG4gICAgICBjb25zdCBhZnRlck1hdGNoSW5kZXggPSBtYXRjaFswXS5sZW5ndGggKyBtYXRjaC5pbmRleDtcbiAgICAgIGNvbnN0IG5leHRDaGFyID0gbWF0Y2guaW5wdXRbYWZ0ZXJNYXRjaEluZGV4XTtcbiAgICAgIGlmIChcbiAgICAgICAgLy8gSFRNTCBzaG91bGQgbm90IGluY2x1ZGUgYW5vdGhlciByYXcgYDxgIGluc2lkZSBhIHRhZ1xuICAgICAgICAvLyBuZXN0ZWQgdHlwZT9cbiAgICAgICAgLy8gYDxBcnJheTxBcnJheTxudW1iZXI+PmAsIGV0Yy5cbiAgICAgICAgbmV4dENoYXIgPT09IFwiPFwiIHx8XG4gICAgICAgIC8vIHRoZSAsIGdpdmVzIGF3YXkgdGhhdCB0aGlzIGlzIG5vdCBIVE1MXG4gICAgICAgIC8vIGA8VCwgQSBleHRlbmRzIGtleW9mIFQsIFY+YFxuICAgICAgICBuZXh0Q2hhciA9PT0gXCIsXCJcbiAgICAgICAgKSB7XG4gICAgICAgIHJlc3BvbnNlLmlnbm9yZU1hdGNoKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLy8gYDxzb21ldGhpbmc+YFxuICAgICAgLy8gUXVpdGUgcG9zc2libHkgYSB0YWcsIGxldHMgbG9vayBmb3IgYSBtYXRjaGluZyBjbG9zaW5nIHRhZy4uLlxuICAgICAgaWYgKG5leHRDaGFyID09PSBcIj5cIikge1xuICAgICAgICAvLyBpZiB3ZSBjYW5ub3QgZmluZCBhIG1hdGNoaW5nIGNsb3NpbmcgdGFnLCB0aGVuIHdlXG4gICAgICAgIC8vIHdpbGwgaWdub3JlIGl0XG4gICAgICAgIGlmICghaGFzQ2xvc2luZ1RhZyhtYXRjaCwgeyBhZnRlcjogYWZ0ZXJNYXRjaEluZGV4IH0pKSB7XG4gICAgICAgICAgcmVzcG9uc2UuaWdub3JlTWF0Y2goKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBgPGJsYWggLz5gIChzZWxmLWNsb3NpbmcpXG4gICAgICAvLyBoYW5kbGVkIGJ5IHNpbXBsZVNlbGZDbG9zaW5nIHJ1bGVcblxuICAgICAgbGV0IG07XG4gICAgICBjb25zdCBhZnRlck1hdGNoID0gbWF0Y2guaW5wdXQuc3Vic3RyaW5nKGFmdGVyTWF0Y2hJbmRleCk7XG5cbiAgICAgIC8vIHNvbWUgbW9yZSB0ZW1wbGF0ZSB0eXBpbmcgc3R1ZmZcbiAgICAgIC8vICA8VCA9IGFueT4oa2V5Pzogc3RyaW5nKSA9PiBNb2RpZnk8XG4gICAgICBpZiAoKG0gPSBhZnRlck1hdGNoLm1hdGNoKC9eXFxzKj0vKSkpIHtcbiAgICAgICAgcmVzcG9uc2UuaWdub3JlTWF0Y2goKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBgPEZyb20gZXh0ZW5kcyBzdHJpbmc+YFxuICAgICAgLy8gdGVjaG5pY2FsbHkgdGhpcyBjb3VsZCBiZSBIVE1MLCBidXQgaXQgc21lbGxzIGxpa2UgYSB0eXBlXG4gICAgICAvLyBOT1RFOiBUaGlzIGlzIHVnaCwgYnV0IGFkZGVkIHNwZWNpZmljYWxseSBmb3IgaHR0cHM6Ly9naXRodWIuY29tL2hpZ2hsaWdodGpzL2hpZ2hsaWdodC5qcy9pc3N1ZXMvMzI3NlxuICAgICAgaWYgKChtID0gYWZ0ZXJNYXRjaC5tYXRjaCgvXlxccytleHRlbmRzXFxzKy8pKSkge1xuICAgICAgICBpZiAobS5pbmRleCA9PT0gMCkge1xuICAgICAgICAgIHJlc3BvbnNlLmlnbm9yZU1hdGNoKCk7XG4gICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVzZWxlc3MtcmV0dXJuXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuICBjb25zdCBLRVlXT1JEUyQxID0ge1xuICAgICRwYXR0ZXJuOiBJREVOVF9SRSxcbiAgICBrZXl3b3JkOiBLRVlXT1JEUyxcbiAgICBsaXRlcmFsOiBMSVRFUkFMUyxcbiAgICBidWlsdF9pbjogQlVJTFRfSU5TLFxuICAgIFwidmFyaWFibGUubGFuZ3VhZ2VcIjogQlVJTFRfSU5fVkFSSUFCTEVTXG4gIH07XG5cbiAgLy8gaHR0cHM6Ly90YzM5LmVzL2VjbWEyNjIvI3NlYy1saXRlcmFscy1udW1lcmljLWxpdGVyYWxzXG4gIGNvbnN0IGRlY2ltYWxEaWdpdHMgPSAnWzAtOV0oXz9bMC05XSkqJztcbiAgY29uc3QgZnJhYyA9IGBcXFxcLigke2RlY2ltYWxEaWdpdHN9KWA7XG4gIC8vIERlY2ltYWxJbnRlZ2VyTGl0ZXJhbCwgaW5jbHVkaW5nIEFubmV4IEIgTm9uT2N0YWxEZWNpbWFsSW50ZWdlckxpdGVyYWxcbiAgLy8gaHR0cHM6Ly90YzM5LmVzL2VjbWEyNjIvI3NlYy1hZGRpdGlvbmFsLXN5bnRheC1udW1lcmljLWxpdGVyYWxzXG4gIGNvbnN0IGRlY2ltYWxJbnRlZ2VyID0gYDB8WzEtOV0oXz9bMC05XSkqfDBbMC03XSpbODldWzAtOV0qYDtcbiAgY29uc3QgTlVNQkVSID0ge1xuICAgIGNsYXNzTmFtZTogJ251bWJlcicsXG4gICAgdmFyaWFudHM6IFtcbiAgICAgIC8vIERlY2ltYWxMaXRlcmFsXG4gICAgICB7IGJlZ2luOiBgKFxcXFxiKCR7ZGVjaW1hbEludGVnZXJ9KSgoJHtmcmFjfSl8XFxcXC4pP3woJHtmcmFjfSkpYCArXG4gICAgICAgIGBbZUVdWystXT8oJHtkZWNpbWFsRGlnaXRzfSlcXFxcYmAgfSxcbiAgICAgIHsgYmVnaW46IGBcXFxcYigke2RlY2ltYWxJbnRlZ2VyfSlcXFxcYigoJHtmcmFjfSlcXFxcYnxcXFxcLik/fCgke2ZyYWN9KVxcXFxiYCB9LFxuXG4gICAgICAvLyBEZWNpbWFsQmlnSW50ZWdlckxpdGVyYWxcbiAgICAgIHsgYmVnaW46IGBcXFxcYigwfFsxLTldKF8/WzAtOV0pKiluXFxcXGJgIH0sXG5cbiAgICAgIC8vIE5vbkRlY2ltYWxJbnRlZ2VyTGl0ZXJhbFxuICAgICAgeyBiZWdpbjogXCJcXFxcYjBbeFhdWzAtOWEtZkEtRl0oXz9bMC05YS1mQS1GXSkqbj9cXFxcYlwiIH0sXG4gICAgICB7IGJlZ2luOiBcIlxcXFxiMFtiQl1bMC0xXShfP1swLTFdKSpuP1xcXFxiXCIgfSxcbiAgICAgIHsgYmVnaW46IFwiXFxcXGIwW29PXVswLTddKF8/WzAtN10pKm4/XFxcXGJcIiB9LFxuXG4gICAgICAvLyBMZWdhY3lPY3RhbEludGVnZXJMaXRlcmFsIChkb2VzIG5vdCBpbmNsdWRlIHVuZGVyc2NvcmUgc2VwYXJhdG9ycylcbiAgICAgIC8vIGh0dHBzOi8vdGMzOS5lcy9lY21hMjYyLyNzZWMtYWRkaXRpb25hbC1zeW50YXgtbnVtZXJpYy1saXRlcmFsc1xuICAgICAgeyBiZWdpbjogXCJcXFxcYjBbMC03XStuP1xcXFxiXCIgfSxcbiAgICBdLFxuICAgIHJlbGV2YW5jZTogMFxuICB9O1xuXG4gIGNvbnN0IFNVQlNUID0ge1xuICAgIGNsYXNzTmFtZTogJ3N1YnN0JyxcbiAgICBiZWdpbjogJ1xcXFwkXFxcXHsnLFxuICAgIGVuZDogJ1xcXFx9JyxcbiAgICBrZXl3b3JkczogS0VZV09SRFMkMSxcbiAgICBjb250YWluczogW10gLy8gZGVmaW5lZCBsYXRlclxuICB9O1xuICBjb25zdCBIVE1MX1RFTVBMQVRFID0ge1xuICAgIGJlZ2luOiAnXFwuP2h0bWxgJyxcbiAgICBlbmQ6ICcnLFxuICAgIHN0YXJ0czoge1xuICAgICAgZW5kOiAnYCcsXG4gICAgICByZXR1cm5FbmQ6IGZhbHNlLFxuICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgaGxqcy5CQUNLU0xBU0hfRVNDQVBFLFxuICAgICAgICBTVUJTVFxuICAgICAgXSxcbiAgICAgIHN1Ykxhbmd1YWdlOiAneG1sJ1xuICAgIH1cbiAgfTtcbiAgY29uc3QgQ1NTX1RFTVBMQVRFID0ge1xuICAgIGJlZ2luOiAnXFwuP2Nzc2AnLFxuICAgIGVuZDogJycsXG4gICAgc3RhcnRzOiB7XG4gICAgICBlbmQ6ICdgJyxcbiAgICAgIHJldHVybkVuZDogZmFsc2UsXG4gICAgICBjb250YWluczogW1xuICAgICAgICBobGpzLkJBQ0tTTEFTSF9FU0NBUEUsXG4gICAgICAgIFNVQlNUXG4gICAgICBdLFxuICAgICAgc3ViTGFuZ3VhZ2U6ICdjc3MnXG4gICAgfVxuICB9O1xuICBjb25zdCBHUkFQSFFMX1RFTVBMQVRFID0ge1xuICAgIGJlZ2luOiAnXFwuP2dxbGAnLFxuICAgIGVuZDogJycsXG4gICAgc3RhcnRzOiB7XG4gICAgICBlbmQ6ICdgJyxcbiAgICAgIHJldHVybkVuZDogZmFsc2UsXG4gICAgICBjb250YWluczogW1xuICAgICAgICBobGpzLkJBQ0tTTEFTSF9FU0NBUEUsXG4gICAgICAgIFNVQlNUXG4gICAgICBdLFxuICAgICAgc3ViTGFuZ3VhZ2U6ICdncmFwaHFsJ1xuICAgIH1cbiAgfTtcbiAgY29uc3QgVEVNUExBVEVfU1RSSU5HID0ge1xuICAgIGNsYXNzTmFtZTogJ3N0cmluZycsXG4gICAgYmVnaW46ICdgJyxcbiAgICBlbmQ6ICdgJyxcbiAgICBjb250YWluczogW1xuICAgICAgaGxqcy5CQUNLU0xBU0hfRVNDQVBFLFxuICAgICAgU1VCU1RcbiAgICBdXG4gIH07XG4gIGNvbnN0IEpTRE9DX0NPTU1FTlQgPSBobGpzLkNPTU1FTlQoXG4gICAgL1xcL1xcKlxcKig/IVxcLykvLFxuICAgICdcXFxcKi8nLFxuICAgIHtcbiAgICAgIHJlbGV2YW5jZTogMCxcbiAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBiZWdpbjogJyg/PUBbQS1aYS16XSspJyxcbiAgICAgICAgICByZWxldmFuY2U6IDAsXG4gICAgICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgY2xhc3NOYW1lOiAnZG9jdGFnJyxcbiAgICAgICAgICAgICAgYmVnaW46ICdAW0EtWmEtel0rJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgY2xhc3NOYW1lOiAndHlwZScsXG4gICAgICAgICAgICAgIGJlZ2luOiAnXFxcXHsnLFxuICAgICAgICAgICAgICBlbmQ6ICdcXFxcfScsXG4gICAgICAgICAgICAgIGV4Y2x1ZGVFbmQ6IHRydWUsXG4gICAgICAgICAgICAgIGV4Y2x1ZGVCZWdpbjogdHJ1ZSxcbiAgICAgICAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBjbGFzc05hbWU6ICd2YXJpYWJsZScsXG4gICAgICAgICAgICAgIGJlZ2luOiBJREVOVF9SRSQxICsgJyg/PVxcXFxzKigtKXwkKScsXG4gICAgICAgICAgICAgIGVuZHNQYXJlbnQ6IHRydWUsXG4gICAgICAgICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIGVhdCBzcGFjZXMgKG5vdCBuZXdsaW5lcykgc28gd2UgY2FuIGZpbmRcbiAgICAgICAgICAgIC8vIHR5cGVzIG9yIHZhcmlhYmxlc1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBiZWdpbjogLyg/PVteXFxuXSlcXHMvLFxuICAgICAgICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9XG4gICk7XG4gIGNvbnN0IENPTU1FTlQgPSB7XG4gICAgY2xhc3NOYW1lOiBcImNvbW1lbnRcIixcbiAgICB2YXJpYW50czogW1xuICAgICAgSlNET0NfQ09NTUVOVCxcbiAgICAgIGhsanMuQ19CTE9DS19DT01NRU5UX01PREUsXG4gICAgICBobGpzLkNfTElORV9DT01NRU5UX01PREVcbiAgICBdXG4gIH07XG4gIGNvbnN0IFNVQlNUX0lOVEVSTkFMUyA9IFtcbiAgICBobGpzLkFQT1NfU1RSSU5HX01PREUsXG4gICAgaGxqcy5RVU9URV9TVFJJTkdfTU9ERSxcbiAgICBIVE1MX1RFTVBMQVRFLFxuICAgIENTU19URU1QTEFURSxcbiAgICBHUkFQSFFMX1RFTVBMQVRFLFxuICAgIFRFTVBMQVRFX1NUUklORyxcbiAgICAvLyBTa2lwIG51bWJlcnMgd2hlbiB0aGV5IGFyZSBwYXJ0IG9mIGEgdmFyaWFibGUgbmFtZVxuICAgIHsgbWF0Y2g6IC9cXCRcXGQrLyB9LFxuICAgIE5VTUJFUixcbiAgICAvLyBUaGlzIGlzIGludGVudGlvbmFsOlxuICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vaGlnaGxpZ2h0anMvaGlnaGxpZ2h0LmpzL2lzc3Vlcy8zMjg4XG4gICAgLy8gaGxqcy5SRUdFWFBfTU9ERVxuICBdO1xuICBTVUJTVC5jb250YWlucyA9IFNVQlNUX0lOVEVSTkFMU1xuICAgIC5jb25jYXQoe1xuICAgICAgLy8gd2UgbmVlZCB0byBwYWlyIHVwIHt9IGluc2lkZSBvdXIgc3Vic3QgdG8gcHJldmVudFxuICAgICAgLy8gaXQgZnJvbSBlbmRpbmcgdG9vIGVhcmx5IGJ5IG1hdGNoaW5nIGFub3RoZXIgfVxuICAgICAgYmVnaW46IC9cXHsvLFxuICAgICAgZW5kOiAvXFx9LyxcbiAgICAgIGtleXdvcmRzOiBLRVlXT1JEUyQxLFxuICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgXCJzZWxmXCJcbiAgICAgIF0uY29uY2F0KFNVQlNUX0lOVEVSTkFMUylcbiAgICB9KTtcbiAgY29uc3QgU1VCU1RfQU5EX0NPTU1FTlRTID0gW10uY29uY2F0KENPTU1FTlQsIFNVQlNULmNvbnRhaW5zKTtcbiAgY29uc3QgUEFSQU1TX0NPTlRBSU5TID0gU1VCU1RfQU5EX0NPTU1FTlRTLmNvbmNhdChbXG4gICAgLy8gZWF0IHJlY3Vyc2l2ZSBwYXJlbnMgaW4gc3ViIGV4cHJlc3Npb25zXG4gICAge1xuICAgICAgYmVnaW46IC8oXFxzKilcXCgvLFxuICAgICAgZW5kOiAvXFwpLyxcbiAgICAgIGtleXdvcmRzOiBLRVlXT1JEUyQxLFxuICAgICAgY29udGFpbnM6IFtcInNlbGZcIl0uY29uY2F0KFNVQlNUX0FORF9DT01NRU5UUylcbiAgICB9XG4gIF0pO1xuICBjb25zdCBQQVJBTVMgPSB7XG4gICAgY2xhc3NOYW1lOiAncGFyYW1zJyxcbiAgICAvLyBjb252ZXJ0IHRoaXMgdG8gbmVnYXRpdmUgbG9va2JlaGluZCBpbiB2MTJcbiAgICBiZWdpbjogLyhcXHMqKVxcKC8sIC8vIHRvIG1hdGNoIHRoZSBwYXJtcyB3aXRoXG4gICAgZW5kOiAvXFwpLyxcbiAgICBleGNsdWRlQmVnaW46IHRydWUsXG4gICAgZXhjbHVkZUVuZDogdHJ1ZSxcbiAgICBrZXl3b3JkczogS0VZV09SRFMkMSxcbiAgICBjb250YWluczogUEFSQU1TX0NPTlRBSU5TXG4gIH07XG5cbiAgLy8gRVM2IGNsYXNzZXNcbiAgY29uc3QgQ0xBU1NfT1JfRVhURU5EUyA9IHtcbiAgICB2YXJpYW50czogW1xuICAgICAgLy8gY2xhc3MgQ2FyIGV4dGVuZHMgdmVoaWNsZVxuICAgICAge1xuICAgICAgICBtYXRjaDogW1xuICAgICAgICAgIC9jbGFzcy8sXG4gICAgICAgICAgL1xccysvLFxuICAgICAgICAgIElERU5UX1JFJDEsXG4gICAgICAgICAgL1xccysvLFxuICAgICAgICAgIC9leHRlbmRzLyxcbiAgICAgICAgICAvXFxzKy8sXG4gICAgICAgICAgcmVnZXguY29uY2F0KElERU5UX1JFJDEsIFwiKFwiLCByZWdleC5jb25jYXQoL1xcLi8sIElERU5UX1JFJDEpLCBcIikqXCIpXG4gICAgICAgIF0sXG4gICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgMTogXCJrZXl3b3JkXCIsXG4gICAgICAgICAgMzogXCJ0aXRsZS5jbGFzc1wiLFxuICAgICAgICAgIDU6IFwia2V5d29yZFwiLFxuICAgICAgICAgIDc6IFwidGl0bGUuY2xhc3MuaW5oZXJpdGVkXCJcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIC8vIGNsYXNzIENhclxuICAgICAge1xuICAgICAgICBtYXRjaDogW1xuICAgICAgICAgIC9jbGFzcy8sXG4gICAgICAgICAgL1xccysvLFxuICAgICAgICAgIElERU5UX1JFJDFcbiAgICAgICAgXSxcbiAgICAgICAgc2NvcGU6IHtcbiAgICAgICAgICAxOiBcImtleXdvcmRcIixcbiAgICAgICAgICAzOiBcInRpdGxlLmNsYXNzXCJcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgIF1cbiAgfTtcblxuICBjb25zdCBDTEFTU19SRUZFUkVOQ0UgPSB7XG4gICAgcmVsZXZhbmNlOiAwLFxuICAgIG1hdGNoOlxuICAgIHJlZ2V4LmVpdGhlcihcbiAgICAgIC8vIEhhcmQgY29kZWQgZXhjZXB0aW9uc1xuICAgICAgL1xcYkpTT04vLFxuICAgICAgLy8gRmxvYXQzMkFycmF5LCBPdXRUXG4gICAgICAvXFxiW0EtWl1bYS16XSsoW0EtWl1bYS16XSp8XFxkKSovLFxuICAgICAgLy8gQ1NTRmFjdG9yeSwgQ1NTRmFjdG9yeVRcbiAgICAgIC9cXGJbQS1aXXsyLH0oW0EtWl1bYS16XSt8XFxkKSsoW0EtWl1bYS16XSopKi8sXG4gICAgICAvLyBGUHMsIEZQc1RcbiAgICAgIC9cXGJbQS1aXXsyLH1bYS16XSsoW0EtWl1bYS16XSt8XFxkKSooW0EtWl1bYS16XSopKi8sXG4gICAgICAvLyBQXG4gICAgICAvLyBzaW5nbGUgbGV0dGVycyBhcmUgbm90IGhpZ2hsaWdodGVkXG4gICAgICAvLyBCTEFIXG4gICAgICAvLyB0aGlzIHdpbGwgYmUgZmxhZ2dlZCBhcyBhIFVQUEVSX0NBU0VfQ09OU1RBTlQgaW5zdGVhZFxuICAgICksXG4gICAgY2xhc3NOYW1lOiBcInRpdGxlLmNsYXNzXCIsXG4gICAga2V5d29yZHM6IHtcbiAgICAgIF86IFtcbiAgICAgICAgLy8gc2Ugd2Ugc3RpbGwgZ2V0IHJlbGV2YW5jZSBjcmVkaXQgZm9yIEpTIGxpYnJhcnkgY2xhc3Nlc1xuICAgICAgICAuLi5UWVBFUyxcbiAgICAgICAgLi4uRVJST1JfVFlQRVNcbiAgICAgIF1cbiAgICB9XG4gIH07XG5cbiAgY29uc3QgVVNFX1NUUklDVCA9IHtcbiAgICBsYWJlbDogXCJ1c2Vfc3RyaWN0XCIsXG4gICAgY2xhc3NOYW1lOiAnbWV0YScsXG4gICAgcmVsZXZhbmNlOiAxMCxcbiAgICBiZWdpbjogL15cXHMqWydcIl11c2UgKHN0cmljdHxhc20pWydcIl0vXG4gIH07XG5cbiAgY29uc3QgRlVOQ1RJT05fREVGSU5JVElPTiA9IHtcbiAgICB2YXJpYW50czogW1xuICAgICAge1xuICAgICAgICBtYXRjaDogW1xuICAgICAgICAgIC9mdW5jdGlvbi8sXG4gICAgICAgICAgL1xccysvLFxuICAgICAgICAgIElERU5UX1JFJDEsXG4gICAgICAgICAgLyg/PVxccypcXCgpL1xuICAgICAgICBdXG4gICAgICB9LFxuICAgICAgLy8gYW5vbnltb3VzIGZ1bmN0aW9uXG4gICAgICB7XG4gICAgICAgIG1hdGNoOiBbXG4gICAgICAgICAgL2Z1bmN0aW9uLyxcbiAgICAgICAgICAvXFxzKig/PVxcKCkvXG4gICAgICAgIF1cbiAgICAgIH1cbiAgICBdLFxuICAgIGNsYXNzTmFtZToge1xuICAgICAgMTogXCJrZXl3b3JkXCIsXG4gICAgICAzOiBcInRpdGxlLmZ1bmN0aW9uXCJcbiAgICB9LFxuICAgIGxhYmVsOiBcImZ1bmMuZGVmXCIsXG4gICAgY29udGFpbnM6IFsgUEFSQU1TIF0sXG4gICAgaWxsZWdhbDogLyUvXG4gIH07XG5cbiAgY29uc3QgVVBQRVJfQ0FTRV9DT05TVEFOVCA9IHtcbiAgICByZWxldmFuY2U6IDAsXG4gICAgbWF0Y2g6IC9cXGJbQS1aXVtBLVpfMC05XStcXGIvLFxuICAgIGNsYXNzTmFtZTogXCJ2YXJpYWJsZS5jb25zdGFudFwiXG4gIH07XG5cbiAgZnVuY3Rpb24gbm9uZU9mKGxpc3QpIHtcbiAgICByZXR1cm4gcmVnZXguY29uY2F0KFwiKD8hXCIsIGxpc3Quam9pbihcInxcIiksIFwiKVwiKTtcbiAgfVxuXG4gIGNvbnN0IEZVTkNUSU9OX0NBTEwgPSB7XG4gICAgbWF0Y2g6IHJlZ2V4LmNvbmNhdChcbiAgICAgIC9cXGIvLFxuICAgICAgbm9uZU9mKFtcbiAgICAgICAgLi4uQlVJTFRfSU5fR0xPQkFMUyxcbiAgICAgICAgXCJzdXBlclwiLFxuICAgICAgICBcImltcG9ydFwiXG4gICAgICBdLm1hcCh4ID0+IGAke3h9XFxcXHMqXFxcXChgKSksXG4gICAgICBJREVOVF9SRSQxLCByZWdleC5sb29rYWhlYWQoL1xccypcXCgvKSksXG4gICAgY2xhc3NOYW1lOiBcInRpdGxlLmZ1bmN0aW9uXCIsXG4gICAgcmVsZXZhbmNlOiAwXG4gIH07XG5cbiAgY29uc3QgUFJPUEVSVFlfQUNDRVNTID0ge1xuICAgIGJlZ2luOiByZWdleC5jb25jYXQoL1xcLi8sIHJlZ2V4Lmxvb2thaGVhZChcbiAgICAgIHJlZ2V4LmNvbmNhdChJREVOVF9SRSQxLCAvKD8hWzAtOUEtWmEteiRfKF0pLylcbiAgICApKSxcbiAgICBlbmQ6IElERU5UX1JFJDEsXG4gICAgZXhjbHVkZUJlZ2luOiB0cnVlLFxuICAgIGtleXdvcmRzOiBcInByb3RvdHlwZVwiLFxuICAgIGNsYXNzTmFtZTogXCJwcm9wZXJ0eVwiLFxuICAgIHJlbGV2YW5jZTogMFxuICB9O1xuXG4gIGNvbnN0IEdFVFRFUl9PUl9TRVRURVIgPSB7XG4gICAgbWF0Y2g6IFtcbiAgICAgIC9nZXR8c2V0LyxcbiAgICAgIC9cXHMrLyxcbiAgICAgIElERU5UX1JFJDEsXG4gICAgICAvKD89XFwoKS9cbiAgICBdLFxuICAgIGNsYXNzTmFtZToge1xuICAgICAgMTogXCJrZXl3b3JkXCIsXG4gICAgICAzOiBcInRpdGxlLmZ1bmN0aW9uXCJcbiAgICB9LFxuICAgIGNvbnRhaW5zOiBbXG4gICAgICB7IC8vIGVhdCB0byBhdm9pZCBlbXB0eSBwYXJhbXNcbiAgICAgICAgYmVnaW46IC9cXChcXCkvXG4gICAgICB9LFxuICAgICAgUEFSQU1TXG4gICAgXVxuICB9O1xuXG4gIGNvbnN0IEZVTkNfTEVBRF9JTl9SRSA9ICcoXFxcXCgnICtcbiAgICAnW14oKV0qKFxcXFwoJyArXG4gICAgJ1teKCldKihcXFxcKCcgK1xuICAgICdbXigpXSonICtcbiAgICAnXFxcXClbXigpXSopKicgK1xuICAgICdcXFxcKVteKCldKikqJyArXG4gICAgJ1xcXFwpfCcgKyBobGpzLlVOREVSU0NPUkVfSURFTlRfUkUgKyAnKVxcXFxzKj0+JztcblxuICBjb25zdCBGVU5DVElPTl9WQVJJQUJMRSA9IHtcbiAgICBtYXRjaDogW1xuICAgICAgL2NvbnN0fHZhcnxsZXQvLCAvXFxzKy8sXG4gICAgICBJREVOVF9SRSQxLCAvXFxzKi8sXG4gICAgICAvPVxccyovLFxuICAgICAgLyhhc3luY1xccyopPy8sIC8vIGFzeW5jIGlzIG9wdGlvbmFsXG4gICAgICByZWdleC5sb29rYWhlYWQoRlVOQ19MRUFEX0lOX1JFKVxuICAgIF0sXG4gICAga2V5d29yZHM6IFwiYXN5bmNcIixcbiAgICBjbGFzc05hbWU6IHtcbiAgICAgIDE6IFwia2V5d29yZFwiLFxuICAgICAgMzogXCJ0aXRsZS5mdW5jdGlvblwiXG4gICAgfSxcbiAgICBjb250YWluczogW1xuICAgICAgUEFSQU1TXG4gICAgXVxuICB9O1xuXG4gIHJldHVybiB7XG4gICAgbmFtZTogJ0phdmFTY3JpcHQnLFxuICAgIGFsaWFzZXM6IFsnanMnLCAnanN4JywgJ21qcycsICdjanMnXSxcbiAgICBrZXl3b3JkczogS0VZV09SRFMkMSxcbiAgICAvLyB0aGlzIHdpbGwgYmUgZXh0ZW5kZWQgYnkgVHlwZVNjcmlwdFxuICAgIGV4cG9ydHM6IHsgUEFSQU1TX0NPTlRBSU5TLCBDTEFTU19SRUZFUkVOQ0UgfSxcbiAgICBpbGxlZ2FsOiAvIyg/IVskX0Etel0pLyxcbiAgICBjb250YWluczogW1xuICAgICAgaGxqcy5TSEVCQU5HKHtcbiAgICAgICAgbGFiZWw6IFwic2hlYmFuZ1wiLFxuICAgICAgICBiaW5hcnk6IFwibm9kZVwiLFxuICAgICAgICByZWxldmFuY2U6IDVcbiAgICAgIH0pLFxuICAgICAgVVNFX1NUUklDVCxcbiAgICAgIGhsanMuQVBPU19TVFJJTkdfTU9ERSxcbiAgICAgIGhsanMuUVVPVEVfU1RSSU5HX01PREUsXG4gICAgICBIVE1MX1RFTVBMQVRFLFxuICAgICAgQ1NTX1RFTVBMQVRFLFxuICAgICAgR1JBUEhRTF9URU1QTEFURSxcbiAgICAgIFRFTVBMQVRFX1NUUklORyxcbiAgICAgIENPTU1FTlQsXG4gICAgICAvLyBTa2lwIG51bWJlcnMgd2hlbiB0aGV5IGFyZSBwYXJ0IG9mIGEgdmFyaWFibGUgbmFtZVxuICAgICAgeyBtYXRjaDogL1xcJFxcZCsvIH0sXG4gICAgICBOVU1CRVIsXG4gICAgICBDTEFTU19SRUZFUkVOQ0UsXG4gICAgICB7XG4gICAgICAgIHNjb3BlOiAnYXR0cicsXG4gICAgICAgIG1hdGNoOiBJREVOVF9SRSQxICsgcmVnZXgubG9va2FoZWFkKCc6JyksXG4gICAgICAgIHJlbGV2YW5jZTogMFxuICAgICAgfSxcbiAgICAgIEZVTkNUSU9OX1ZBUklBQkxFLFxuICAgICAgeyAvLyBcInZhbHVlXCIgY29udGFpbmVyXG4gICAgICAgIGJlZ2luOiAnKCcgKyBobGpzLlJFX1NUQVJURVJTX1JFICsgJ3xcXFxcYihjYXNlfHJldHVybnx0aHJvdylcXFxcYilcXFxccyonLFxuICAgICAgICBrZXl3b3JkczogJ3JldHVybiB0aHJvdyBjYXNlJyxcbiAgICAgICAgcmVsZXZhbmNlOiAwLFxuICAgICAgICBjb250YWluczogW1xuICAgICAgICAgIENPTU1FTlQsXG4gICAgICAgICAgaGxqcy5SRUdFWFBfTU9ERSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjbGFzc05hbWU6ICdmdW5jdGlvbicsXG4gICAgICAgICAgICAvLyB3ZSBoYXZlIHRvIGNvdW50IHRoZSBwYXJlbnMgdG8gbWFrZSBzdXJlIHdlIGFjdHVhbGx5IGhhdmUgdGhlXG4gICAgICAgICAgICAvLyBjb3JyZWN0IGJvdW5kaW5nICggKSBiZWZvcmUgdGhlID0+LiAgVGhlcmUgY291bGQgYmUgYW55IG51bWJlciBvZlxuICAgICAgICAgICAgLy8gc3ViLWV4cHJlc3Npb25zIGluc2lkZSBhbHNvIHN1cnJvdW5kZWQgYnkgcGFyZW5zLlxuICAgICAgICAgICAgYmVnaW46IEZVTkNfTEVBRF9JTl9SRSxcbiAgICAgICAgICAgIHJldHVybkJlZ2luOiB0cnVlLFxuICAgICAgICAgICAgZW5kOiAnXFxcXHMqPT4nLFxuICAgICAgICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNsYXNzTmFtZTogJ3BhcmFtcycsXG4gICAgICAgICAgICAgICAgdmFyaWFudHM6IFtcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgYmVnaW46IGhsanMuVU5ERVJTQ09SRV9JREVOVF9SRSxcbiAgICAgICAgICAgICAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIGJlZ2luOiAvXFwoXFxzKlxcKS8sXG4gICAgICAgICAgICAgICAgICAgIHNraXA6IHRydWVcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGJlZ2luOiAvKFxccyopXFwoLyxcbiAgICAgICAgICAgICAgICAgICAgZW5kOiAvXFwpLyxcbiAgICAgICAgICAgICAgICAgICAgZXhjbHVkZUJlZ2luOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBleGNsdWRlRW5kOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBrZXl3b3JkczogS0VZV09SRFMkMSxcbiAgICAgICAgICAgICAgICAgICAgY29udGFpbnM6IFBBUkFNU19DT05UQUlOU1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICAgIH0sXG4gICAgICAgICAgeyAvLyBjb3VsZCBiZSBhIGNvbW1hIGRlbGltaXRlZCBsaXN0IG9mIHBhcmFtcyB0byBhIGZ1bmN0aW9uIGNhbGxcbiAgICAgICAgICAgIGJlZ2luOiAvLC8sXG4gICAgICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG1hdGNoOiAvXFxzKy8sXG4gICAgICAgICAgICByZWxldmFuY2U6IDBcbiAgICAgICAgICB9LFxuICAgICAgICAgIHsgLy8gSlNYXG4gICAgICAgICAgICB2YXJpYW50czogW1xuICAgICAgICAgICAgICB7IGJlZ2luOiBGUkFHTUVOVC5iZWdpbiwgZW5kOiBGUkFHTUVOVC5lbmQgfSxcbiAgICAgICAgICAgICAgeyBtYXRjaDogWE1MX1NFTEZfQ0xPU0lORyB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgYmVnaW46IFhNTF9UQUcuYmVnaW4sXG4gICAgICAgICAgICAgICAgLy8gd2UgY2FyZWZ1bGx5IGNoZWNrIHRoZSBvcGVuaW5nIHRhZyB0byBzZWUgaWYgaXQgdHJ1bHlcbiAgICAgICAgICAgICAgICAvLyBpcyBhIHRhZyBhbmQgbm90IGEgZmFsc2UgcG9zaXRpdmVcbiAgICAgICAgICAgICAgICAnb246YmVnaW4nOiBYTUxfVEFHLmlzVHJ1bHlPcGVuaW5nVGFnLFxuICAgICAgICAgICAgICAgIGVuZDogWE1MX1RBRy5lbmRcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHN1Ykxhbmd1YWdlOiAneG1sJyxcbiAgICAgICAgICAgIGNvbnRhaW5zOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBiZWdpbjogWE1MX1RBRy5iZWdpbixcbiAgICAgICAgICAgICAgICBlbmQ6IFhNTF9UQUcuZW5kLFxuICAgICAgICAgICAgICAgIHNraXA6IHRydWUsXG4gICAgICAgICAgICAgICAgY29udGFpbnM6IFsnc2VsZiddXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgICB9XG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgRlVOQ1RJT05fREVGSU5JVElPTixcbiAgICAgIHtcbiAgICAgICAgLy8gcHJldmVudCB0aGlzIGZyb20gZ2V0dGluZyBzd2FsbG93ZWQgdXAgYnkgZnVuY3Rpb25cbiAgICAgICAgLy8gc2luY2UgdGhleSBhcHBlYXIgXCJmdW5jdGlvbiBsaWtlXCJcbiAgICAgICAgYmVnaW5LZXl3b3JkczogXCJ3aGlsZSBpZiBzd2l0Y2ggY2F0Y2ggZm9yXCJcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIC8vIHdlIGhhdmUgdG8gY291bnQgdGhlIHBhcmVucyB0byBtYWtlIHN1cmUgd2UgYWN0dWFsbHkgaGF2ZSB0aGUgY29ycmVjdFxuICAgICAgICAvLyBib3VuZGluZyAoICkuICBUaGVyZSBjb3VsZCBiZSBhbnkgbnVtYmVyIG9mIHN1Yi1leHByZXNzaW9ucyBpbnNpZGVcbiAgICAgICAgLy8gYWxzbyBzdXJyb3VuZGVkIGJ5IHBhcmVucy5cbiAgICAgICAgYmVnaW46ICdcXFxcYig/IWZ1bmN0aW9uKScgKyBobGpzLlVOREVSU0NPUkVfSURFTlRfUkUgK1xuICAgICAgICAgICdcXFxcKCcgKyAvLyBmaXJzdCBwYXJlbnNcbiAgICAgICAgICAnW14oKV0qKFxcXFwoJyArXG4gICAgICAgICAgICAnW14oKV0qKFxcXFwoJyArXG4gICAgICAgICAgICAgICdbXigpXSonICtcbiAgICAgICAgICAgICdcXFxcKVteKCldKikqJyArXG4gICAgICAgICAgJ1xcXFwpW14oKV0qKSonICtcbiAgICAgICAgICAnXFxcXClcXFxccypcXFxceycsIC8vIGVuZCBwYXJlbnNcbiAgICAgICAgcmV0dXJuQmVnaW46dHJ1ZSxcbiAgICAgICAgbGFiZWw6IFwiZnVuYy5kZWZcIixcbiAgICAgICAgY29udGFpbnM6IFtcbiAgICAgICAgICBQQVJBTVMsXG4gICAgICAgICAgaGxqcy5pbmhlcml0KGhsanMuVElUTEVfTU9ERSwgeyBiZWdpbjogSURFTlRfUkUkMSwgY2xhc3NOYW1lOiBcInRpdGxlLmZ1bmN0aW9uXCIgfSlcbiAgICAgICAgXVxuICAgICAgfSxcbiAgICAgIC8vIGNhdGNoIC4uLiBzbyBpdCB3b24ndCB0cmlnZ2VyIHRoZSBwcm9wZXJ0eSBydWxlIGJlbG93XG4gICAgICB7XG4gICAgICAgIG1hdGNoOiAvXFwuXFwuXFwuLyxcbiAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICB9LFxuICAgICAgUFJPUEVSVFlfQUNDRVNTLFxuICAgICAgLy8gaGFjazogcHJldmVudHMgZGV0ZWN0aW9uIG9mIGtleXdvcmRzIGluIHNvbWUgY2lyY3Vtc3RhbmNlc1xuICAgICAgLy8gLmtleXdvcmQoKVxuICAgICAgLy8gJGtleXdvcmQgPSB4XG4gICAgICB7XG4gICAgICAgIG1hdGNoOiAnXFxcXCQnICsgSURFTlRfUkUkMSxcbiAgICAgICAgcmVsZXZhbmNlOiAwXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBtYXRjaDogWyAvXFxiY29uc3RydWN0b3IoPz1cXHMqXFwoKS8gXSxcbiAgICAgICAgY2xhc3NOYW1lOiB7IDE6IFwidGl0bGUuZnVuY3Rpb25cIiB9LFxuICAgICAgICBjb250YWluczogWyBQQVJBTVMgXVxuICAgICAgfSxcbiAgICAgIEZVTkNUSU9OX0NBTEwsXG4gICAgICBVUFBFUl9DQVNFX0NPTlNUQU5ULFxuICAgICAgQ0xBU1NfT1JfRVhURU5EUyxcbiAgICAgIEdFVFRFUl9PUl9TRVRURVIsXG4gICAgICB7XG4gICAgICAgIG1hdGNoOiAvXFwkWyguXS8gLy8gcmVsZXZhbmNlIGJvb3N0ZXIgZm9yIGEgcGF0dGVybiBjb21tb24gdG8gSlMgbGliczogYCQoc29tZXRoaW5nKWAgYW5kIGAkLnNvbWV0aGluZ2BcbiAgICAgIH1cbiAgICBdXG4gIH07XG59XG5cbmV4cG9ydCB7IGphdmFzY3JpcHQgYXMgZGVmYXVsdCB9O1xuIiwgIi8qKlxuICogV2VidmlldyBzeW50YXggaGlnaGxpZ2h0aW5nLlxuICpcbiAqIGhpZ2hsaWdodC5qcyBpcyBidW5kbGVkIGludG8gdGhlIHdlYnZpZXcgb25seS4gVGhlIGhvc3QgbmV2ZXIgaGlnaGxpZ2h0cywgYW5kXG4gKiBhIGZhaWx1cmUgYWx3YXlzIGRlZ3JhZGVzIHRvIHBsYWluIHRleHQ6IHRoZSBwcmV2aWV3IGlzIHN0aWxsIHJlYWRhYmxlLlxuICovXG5cbmltcG9ydCBobGpzIGZyb20gJ2hpZ2hsaWdodC5qcy9saWIvY29yZSc7XG5pbXBvcnQgY3BwIGZyb20gJ2hpZ2hsaWdodC5qcy9saWIvbGFuZ3VhZ2VzL2NwcCc7XG5pbXBvcnQgamF2YXNjcmlwdCBmcm9tICdoaWdobGlnaHQuanMvbGliL2xhbmd1YWdlcy9qYXZhc2NyaXB0JztcblxuaGxqcy5yZWdpc3Rlckxhbmd1YWdlKCdjcHAnLCBjcHApO1xuaGxqcy5yZWdpc3Rlckxhbmd1YWdlKCdqYXZhc2NyaXB0JywgamF2YXNjcmlwdCk7XG5cbi8qKlxuICogQHR5cGVkZWYge3t0ZXh0OiBzdHJpbmcsIGNsYXNzTmFtZTogc3RyaW5nfX0gUHJldmlld1Rva2VuXG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbGFuZ3VhZ2VJZFxuICogQHJldHVybnMge3tsYW5ndWFnZTogc3RyaW5nfG51bGwsIGRlZ3JhZGVkOiBib29sZWFufX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVMYW5ndWFnZShsYW5ndWFnZUlkKSB7XG4gIGNvbnN0IGlkID0gU3RyaW5nKGxhbmd1YWdlSWQgPz8gJycpLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChpZCA9PT0gJ2NwcCcgfHwgaWQgPT09ICdjKysnIHx8IGlkID09PSAnYycgfHwgaWQgPT09ICdvYmplY3RpdmUtYysrJykge1xuICAgIHJldHVybiB7IGxhbmd1YWdlOiAnY3BwJywgZGVncmFkZWQ6IGZhbHNlIH07XG4gIH1cbiAgaWYgKGlkID09PSAnamF2YXNjcmlwdCcgfHwgaWQgPT09ICdqcycgfHwgaWQgPT09ICdtanMnIHx8IGlkID09PSAnY2pzJykge1xuICAgIHJldHVybiB7IGxhbmd1YWdlOiAnamF2YXNjcmlwdCcsIGRlZ3JhZGVkOiBmYWxzZSB9O1xuICB9XG4gIHJldHVybiB7IGxhbmd1YWdlOiBudWxsLCBkZWdyYWRlZDogdHJ1ZSB9O1xufVxuXG4vKipcbiAqIFNwbGl0IGhpZ2hsaWdodC5qcyBIVE1MIGludG8gbGluZXMgb2YgY2xhc3NlZCB0b2tlbnMuIE9ubHkgdGhlIHNtYWxsIHN1YnNldFxuICogb2YgbWFya3VwIHRoYXQgaGlnaGxpZ2h0LmpzIGVtaXRzIGlzIHVuZGVyc3Rvb2Q7IGFueXRoaW5nIGVsc2UgYmVjb21lcyB0ZXh0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBodG1sXG4gKiBAcmV0dXJucyB7UHJldmlld1Rva2VuW11bXX1cbiAqL1xuZnVuY3Rpb24gaHRtbFRvTGluZXMoaHRtbCkge1xuICAvKiogQHR5cGUge1ByZXZpZXdUb2tlbltdW119ICovXG4gIGNvbnN0IGxpbmVzID0gW1tdXTtcbiAgY29uc3Qgc3RhY2sgPSBbXTtcbiAgY29uc3QgcGF0dGVybiA9IC88c3BhbiBjbGFzcz1cIihbXlwiXSspXCI+fDxcXC9zcGFuPnwoW148XSspL2c7XG4gIGxldCBtYXRjaDtcbiAgd2hpbGUgKChtYXRjaCA9IHBhdHRlcm4uZXhlYyhodG1sKSkgIT09IG51bGwpIHtcbiAgICBpZiAobWF0Y2hbMV0pIHtcbiAgICAgIHN0YWNrLnB1c2gobWF0Y2hbMV0pO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChtYXRjaFswXSA9PT0gJzwvc3Bhbj4nKSB7XG4gICAgICBzdGFjay5wb3AoKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCB0ZXh0ID0gZGVjb2RlRW50aXRpZXMobWF0Y2hbMl0gPz8gJycpO1xuICAgIGNvbnN0IHBhcnRzID0gdGV4dC5zcGxpdCgnXFxuJyk7XG4gICAgZm9yIChjb25zdCBbaW5kZXgsIHBhcnRdIG9mIHBhcnRzLmVudHJpZXMoKSkge1xuICAgICAgaWYgKGluZGV4ID4gMCkge1xuICAgICAgICBsaW5lcy5wdXNoKFtdKTtcbiAgICAgIH1cbiAgICAgIGlmIChwYXJ0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGluZXNbbGluZXMubGVuZ3RoIC0gMV0ucHVzaCh7XG4gICAgICAgICAgdGV4dDogcGFydCxcbiAgICAgICAgICBjbGFzc05hbWU6IHN0YWNrLmxlbmd0aCA+IDAgPyBzdGFja1tzdGFjay5sZW5ndGggLSAxXSA6ICcnLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGxpbmVzO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZGVjb2RlRW50aXRpZXModmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlXG4gICAgLnJlcGxhY2UoLyZsdDsvZywgJzwnKVxuICAgIC5yZXBsYWNlKC8mZ3Q7L2csICc+JylcbiAgICAucmVwbGFjZSgvJnF1b3Q7L2csICdcIicpXG4gICAgLnJlcGxhY2UoLyYjeDI3Oy9nLCBcIidcIilcbiAgICAucmVwbGFjZSgvJiMzOTsvZywgXCInXCIpXG4gICAgLnJlcGxhY2UoLyZhbXA7L2csICcmJyk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAqIEByZXR1cm5zIHtQcmV2aWV3VG9rZW5bXVtdfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcGxhaW5MaW5lcyh0ZXh0KSB7XG4gIHJldHVybiBTdHJpbmcodGV4dCA/PyAnJylcbiAgICAuc3BsaXQoL1xcclxcbnxcXHJ8XFxuLylcbiAgICAubWFwKChsaW5lKSA9PiAobGluZS5sZW5ndGggPiAwID8gW3sgdGV4dDogbGluZSwgY2xhc3NOYW1lOiAnJyB9XSA6IFtdKSk7XG59XG5cbi8qKlxuICogSGlnaGxpZ2h0IGEgc291cmNlIHNsaWNlLiBOZXZlciB0aHJvd3MuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAqIEBwYXJhbSB7c3RyaW5nfSBsYW5ndWFnZUlkXG4gKiBAcmV0dXJucyB7e2xpbmVzOiBQcmV2aWV3VG9rZW5bXVtdLCBkZWdyYWRlZDogYm9vbGVhbn19XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoaWdobGlnaHRMaW5lcyh0ZXh0LCBsYW5ndWFnZUlkKSB7XG4gIGNvbnN0IHJlc29sdmVkID0gcmVzb2x2ZUxhbmd1YWdlKGxhbmd1YWdlSWQpO1xuICBpZiAoIXJlc29sdmVkLmxhbmd1YWdlKSB7XG4gICAgcmV0dXJuIHsgbGluZXM6IHBsYWluTGluZXModGV4dCksIGRlZ3JhZGVkOiB0cnVlIH07XG4gIH1cbiAgdHJ5IHtcbiAgICBjb25zdCBodG1sID0gaGxqcy5oaWdobGlnaHQoU3RyaW5nKHRleHQgPz8gJycpLCB7IGxhbmd1YWdlOiByZXNvbHZlZC5sYW5ndWFnZSB9KS52YWx1ZTtcbiAgICByZXR1cm4geyBsaW5lczogaHRtbFRvTGluZXMoaHRtbCksIGRlZ3JhZGVkOiBmYWxzZSB9O1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4geyBsaW5lczogcGxhaW5MaW5lcyh0ZXh0KSwgZGVncmFkZWQ6IHRydWUgfTtcbiAgfVxufVxuIiwgIi8qKlxuICogV2VidmlldyBlbnRyeSBwb2ludC5cbiAqXG4gKiBSZXNwb25zaWJpbGl0aWVzIGFyZSBkZWxpYmVyYXRlbHkgbmFycm93OiB0YWxrIHByb3RvY29sLCByZW5kZXIgdGhlIERUTywgc2hvd1xuICogc2VsZWN0aW9uIGRldGFpbHMuIE5vIGFuYWx5c2lzLCBubyBmaWxlIGFjY2Vzcywgbm8gZ3JhcGggY29uc3RydWN0aW9uLlxuICovXG5cbmltcG9ydCB7IGNyZWF0ZUJyaWRnZSB9IGZyb20gJy4uL2NvcmUvcHJvdG9jb2wvYnJpZGdlLmpzJztcbmltcG9ydCB7IERJUkVDVElPTlMsIFBST1RPQ09MX1ZFUlNJT04gfSBmcm9tICcuLi9jb3JlL3Byb3RvY29sL2VudmVsb3BlLmpzJztcbmltcG9ydCB7IHZhbGlkYXRlRHRvIH0gZnJvbSAnLi4vY29yZS9ncmFwaC9kdG8uanMnO1xuaW1wb3J0IHsgY3JlYXRlU3ZnUmVuZGVyZXIgfSBmcm9tICcuLi92aXN1YWxpemF0aW9uL3JlbmRlcmVyL3N2Z1JlbmRlcmVyLmpzJztcbmltcG9ydCB7IGJ1aWxkUHJldmlld01vZGVsIH0gZnJvbSAnLi4vY29yZS9zb3VyY2UvcHJlc2VudGF0aW9uLmpzJztcbmltcG9ydCB7IHJlc29sdmVQcmV2aWV3U2V0dGluZ3MgfSBmcm9tICcuLi9jb3JlL3NvdXJjZS9zZXR0aW5ncy5qcyc7XG5pbXBvcnQgeyBjcmVhdGVQcmV2aWV3Q29udHJvbGxlciB9IGZyb20gJy4vcHJldmlld0NvbnRyb2xsZXIuanMnO1xuaW1wb3J0IHsgaGlnaGxpZ2h0TGluZXMgfSBmcm9tICcuL2hpZ2hsaWdodC5qcyc7XG5cbmNvbnN0IHZzY29kZUFwaSA9IGFjcXVpcmVWc0NvZGVBcGkoKTtcblxuY29uc3Qgc3ZnID0gLyoqIEB0eXBlIHtTVkdTVkdFbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWdyYXBoJykpO1xuY29uc3QgbWV0YSA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtbWV0YScpKTtcbmNvbnN0IHN0YXR1cyA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2Ytc3RhdHVzJykpO1xuY29uc3QgYmFubmVyID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1iYW5uZXInKSk7XG5jb25zdCBlbXB0eSA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtZW1wdHknKSk7XG5jb25zdCBkZXRhaWxCb2R5ID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1kZXRhaWwtYm9keScpKTtcbmNvbnN0IGxlZ2VuZCA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtbGVnZW5kJykpO1xuY29uc3QgcmVsb2FkQnV0dG9uID0gLyoqIEB0eXBlIHtIVE1MQnV0dG9uRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1yZWZyZXNoJykpO1xuY29uc3QgZnVuY3Rpb25QaWNrZXIgPSAvKiogQHR5cGUge0hUTUxTZWxlY3RFbGVtZW50fG51bGx9ICovIChcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWZ1bmN0aW9uJylcbik7XG5jb25zdCBwcmV2aWV3ID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1wcmV2aWV3JykpO1xuY29uc3QgcHJldmlld1RpdGxlID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1wcmV2aWV3LXRpdGxlJykpO1xuY29uc3QgcHJldmlld01ldGEgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLXByZXZpZXctbWV0YScpKTtcbmNvbnN0IHByZXZpZXdCb2R5ID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1wcmV2aWV3LWJvZHknKSk7XG5jb25zdCBwcmV2aWV3Tm90ZSA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtcHJldmlldy1ub3RlJykpO1xuY29uc3QgcHJldmlld1BpbiA9IC8qKiBAdHlwZSB7SFRNTEJ1dHRvbkVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtcHJldmlldy1waW4nKSk7XG5jb25zdCBwcmV2aWV3Q2xvc2UgPSAvKiogQHR5cGUge0hUTUxCdXR0b25FbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLXByZXZpZXctY2xvc2UnKSk7XG5jb25zdCBwcmV2aWV3T3BlbiA9IC8qKiBAdHlwZSB7SFRNTEJ1dHRvbkVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtcHJldmlldy1vcGVuJykpO1xuXG4vKiogQHR5cGUge2ltcG9ydCgnLi4vY29yZS9ncmFwaC9kdG8uanMnKS5HcmFwaER0byB8IG51bGx9ICovXG5sZXQgY3VycmVudER0byA9IG51bGw7XG5jb25zdCBwcmVmZXJyZWRTeW1ib2xJZCA9IGRvY3VtZW50LmJvZHkuZGF0YXNldC5wcmVmZXJyZWRTeW1ib2wgfHwgbnVsbDtcblxuLyoqIEB0eXBlIHtzdHJpbmcgfCBudWxsfSAqL1xubGV0IHNlbGVjdGVkU3ltYm9sSWQgPSBwcmVmZXJyZWRTeW1ib2xJZDtcblxuLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSAqL1xubGV0IHNldHRpbmdzID0gcmVzb2x2ZVByZXZpZXdTZXR0aW5ncyh7fSk7XG4vKiogQHR5cGUge01hcDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIGFueT4+fSAqL1xuY29uc3QgcHJldmlld0NhY2hlID0gbmV3IE1hcCgpO1xuLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBzdHJpbmc+fSAqL1xubGV0IGludGVncml0eUJ5Tm9kZSA9IG5ldyBNYXAoKTtcbi8qKiBAdHlwZSB7c3RyaW5nfG51bGx9ICovXG5sZXQgcHJldmlld05vZGVJZCA9IG51bGw7XG4vKiogQHR5cGUge251bWJlcn0gKi9cbmxldCBwcmV2aWV3UmVxdWVzdCA9IDA7XG4vKiogQHR5cGUge3t4OiBudW1iZXIsIHk6IG51bWJlcn18bnVsbH0gKi9cbmxldCBwcmV2aWV3QW5jaG9yID0gbnVsbDtcblxuY29uc3QgcmVuZGVyZXIgPSBjcmVhdGVTdmdSZW5kZXJlcih7XG4gIHN2ZyxcbiAgb25TZWxlY3Q6IChub2RlSWQsIG5vZGUpID0+IHtcbiAgICBzaG93Tm9kZURldGFpbHMobm9kZUlkLCBub2RlKTtcbiAgICBicmlkZ2UucmVzcG9uZCgnbm9kZS5zZWxlY3QnLCB7IG5vZGVJZCB9KTtcbiAgfSxcbiAgb25OYXZpZ2F0ZTogKG5vZGVJZCwgbm9kZSwgdHJpZ2dlcikgPT4ge1xuICAgIGlmICh0cmlnZ2VyID09PSAncG9pbnRlcicgJiYgIXNldHRpbmdzLmNsaWNrVG9OYXZpZ2F0ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2b2lkIG5hdmlnYXRlVG8obm9kZUlkLCBub2RlKTtcbiAgfSxcbiAgb25QcmV2aWV3RW50ZXI6IChub2RlSWQsIF9ub2RlLCBwb2ludCkgPT4ge1xuICAgIHByZXZpZXdDb250cm9sbGVyLnBvaW50ZXJFbnRlcihub2RlSWQsIHBvaW50KTtcbiAgfSxcbiAgb25QcmV2aWV3TW92ZTogKHBvaW50KSA9PiB7XG4gICAgcHJldmlld0NvbnRyb2xsZXIucG9pbnRlck1vdmUocG9pbnQpO1xuICB9LFxuICBvblByZXZpZXdMZWF2ZTogKCkgPT4ge1xuICAgIHByZXZpZXdDb250cm9sbGVyLnBvaW50ZXJMZWF2ZSgpO1xuICB9LFxuICBvblByZXZpZXdLZXk6IChub2RlSWQpID0+IHtcbiAgICB2b2lkIG9wZW5QcmV2aWV3KG5vZGVJZCwgbnVsbCwgdHJ1ZSk7XG4gIH0sXG59KTtcblxuY29uc3QgcHJldmlld0NvbnRyb2xsZXIgPSBjcmVhdGVQcmV2aWV3Q29udHJvbGxlcih7XG4gIGRlbGF5TXM6IHNldHRpbmdzLmRlbGF5TXMsXG4gIGVuYWJsZWQ6IHNldHRpbmdzLmVuYWJsZWQsXG4gIHBpbkJ5RGVmYXVsdDogc2V0dGluZ3MucGluQnlEZWZhdWx0LFxuICBvblNob3c6IChub2RlSWQsIGFuY2hvcikgPT4ge1xuICAgIHN5bmNQaW5CdXR0b24ocHJldmlld0NvbnRyb2xsZXIuaXNQaW5uZWQoKSk7XG4gICAgdm9pZCBvcGVuUHJldmlldyhub2RlSWQsIGFuY2hvciwgZmFsc2UpO1xuICB9LFxuICBvbkhpZGU6ICgpID0+IHtcbiAgICBoaWRlUHJldmlldygpO1xuICB9LFxufSk7XG5pZiAoc2V0dGluZ3MucGluQnlEZWZhdWx0KSB7XG4gIHByZXZpZXdDb250cm9sbGVyLnNldFBpbm5lZCh0cnVlKTtcbn1cbnN5bmNQaW5CdXR0b24oc2V0dGluZ3MucGluQnlEZWZhdWx0KTtcblxuY29uc3QgYnJpZGdlID0gY3JlYXRlQnJpZGdlKHtcbiAgcG9zdDogKG1lc3NhZ2UpID0+IHZzY29kZUFwaS5wb3N0TWVzc2FnZShtZXNzYWdlKSxcbiAgaW5ib3VuZERpcmVjdGlvbjogRElSRUNUSU9OUy5IT1NUX1RPX1dFQlZJRVcsXG4gIHRpbWVvdXRNczogODAwMCxcbiAgbG9nZ2VyOiB7XG4gICAgZGVidWc6ICgpID0+IHt9LFxuICAgIHdhcm46IChtZXNzYWdlLCBmaWVsZHMpID0+IGNvbnNvbGUud2FybignW2NvZGVmbG93XScsIG1lc3NhZ2UsIGZpZWxkcyksXG4gICAgZXJyb3I6IChtZXNzYWdlLCBmaWVsZHMpID0+IGNvbnNvbGUuZXJyb3IoJ1tjb2RlZmxvd10nLCBtZXNzYWdlLCBmaWVsZHMpLFxuICB9LFxufSk7XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzRXJyb3JdXG4gKi9cbmZ1bmN0aW9uIHNldEJhbm5lcihtZXNzYWdlLCBpc0Vycm9yID0gZmFsc2UpIHtcbiAgaWYgKCFtZXNzYWdlKSB7XG4gICAgYmFubmVyLmhpZGRlbiA9IHRydWU7XG4gICAgYmFubmVyLnRleHRDb250ZW50ID0gJyc7XG4gICAgcmV0dXJuO1xuICB9XG4gIGJhbm5lci5oaWRkZW4gPSBmYWxzZTtcbiAgYmFubmVyLmNsYXNzTGlzdC50b2dnbGUoJ2lzLWVycm9yJywgaXNFcnJvcik7XG4gIGJhbm5lci50ZXh0Q29udGVudCA9IG1lc3NhZ2U7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAqL1xuZnVuY3Rpb24gc2V0U3RhdHVzKHRleHQpIHtcbiAgc3RhdHVzLnRleHRDb250ZW50ID0gdGV4dDtcbn1cblxuZnVuY3Rpb24gY2xlYXJEZXRhaWwoKSB7XG4gIGRldGFpbEJvZHkucmVwbGFjZUNoaWxkcmVuKCk7XG4gIGNvbnN0IHBhcmFncmFwaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcbiAgcGFyYWdyYXBoLmNsYXNzTmFtZSA9ICdjZi1tdXRlZCc7XG4gIHBhcmFncmFwaC50ZXh0Q29udGVudCA9ICdTZWxlY3QgYSBub2RlIHRvIGluc3BlY3QgaXQuJztcbiAgZGV0YWlsQm9keS5hcHBlbmRDaGlsZChwYXJhZ3JhcGgpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBsYWJlbFxuICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gKiBAcmV0dXJucyB7W0hUTUxFbGVtZW50LCBIVE1MRWxlbWVudF19XG4gKi9cbmZ1bmN0aW9uIGRldGFpbFBhaXIobGFiZWwsIHZhbHVlKSB7XG4gIGNvbnN0IHRlcm0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkdCcpO1xuICB0ZXJtLnRleHRDb250ZW50ID0gbGFiZWw7XG4gIGNvbnN0IGRlc2NyaXB0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGQnKTtcbiAgZGVzY3JpcHRpb24udGV4dENvbnRlbnQgPSB2YWx1ZTtcbiAgcmV0dXJuIFt0ZXJtLCBkZXNjcmlwdGlvbl07XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZFxuICogQHBhcmFtIHtpbXBvcnQoJy4uL2NvcmUvZ3JhcGgvZHRvLmpzJykuRHRvTm9kZX0gW25vZGVdXG4gKi9cbmZ1bmN0aW9uIHNob3dOb2RlRGV0YWlscyhub2RlSWQsIG5vZGUpIHtcbiAgaWYgKCFub2RlSWQgfHwgIW5vZGUpIHtcbiAgICBjbGVhckRldGFpbCgpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBsaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGwnKTtcbiAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcignbGFiZWwnLCBub2RlLmxhYmVsKSk7XG4gIGxpc3QuYXBwZW5kKC4uLmRldGFpbFBhaXIoJ2tpbmQnLCBub2RlLmtpbmQpKTtcbiAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcignc3RhdHVzJywgbm9kZS5zdGF0dXMpKTtcbiAgaWYgKG5vZGUuZXh0ZXJuYWwpIHtcbiAgICBsaXN0LmFwcGVuZCguLi5kZXRhaWxQYWlyKCdvcmlnaW4nLCAnZXh0ZXJuYWwgdGFyZ2V0IChub3QgZGVjbGFyZWQgaW4gdGhlIGFuYWx5c2lzKScpKTtcbiAgfVxuICBpZiAobm9kZS5yYW5nZSkge1xuICAgIGxpc3QuYXBwZW5kKC4uLmRldGFpbFBhaXIoJ2xpbmVzJywgYCR7bm9kZS5yYW5nZS5zdGFydExpbmUgKyAxfVx1MjAxMyR7bm9kZS5yYW5nZS5lbmRMaW5lICsgMX1gKSk7XG4gICAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcignZmlsZScsIG5vZGUucmFuZ2UuZmlsZUlkKSk7XG4gIH1cbiAgaWYgKG5vZGUuYmFkZ2UpIHtcbiAgICBsaXN0LmFwcGVuZCguLi5kZXRhaWxQYWlyKCdub3RlJywgbm9kZS5iYWRnZSkpO1xuICB9XG4gIGlmIChub2RlLmlzU3ludGhldGljKSB7XG4gICAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcignb3JpZ2luJywgJ3N5bnRoZXRpYyBzdHJ1Y3R1cmFsIG5vZGUnKSk7XG4gIH1cbiAgaWYgKG5vZGUudW5yZWFjaGFibGUpIHtcbiAgICBsaXN0LmFwcGVuZCguLi5kZXRhaWxQYWlyKCdyZWFjaGFiaWxpdHknLCAnbm90IHJlYWNoYWJsZSBmcm9tIGVudHJ5JykpO1xuICB9XG4gIGlmIChub2RlLnJlYXNvbkNvZGUpIHtcbiAgICBsaXN0LmFwcGVuZCguLi5kZXRhaWxQYWlyKCdyZWFzb24nLCBub2RlLnJlYXNvbkNvZGUpKTtcbiAgfVxuICBpZiAoQXJyYXkuaXNBcnJheShub2RlLmNhbGxzKSAmJiBub2RlLmNhbGxzLmxlbmd0aCA+IDApIHtcbiAgICBsaXN0LmFwcGVuZChcbiAgICAgIC4uLmRldGFpbFBhaXIoJ2NhbGxzJywgbm9kZS5jYWxscy5tYXAoKGNhbGwpID0+IGAke2NhbGwubGFiZWx9ICgke2NhbGwuc3RhdHVzfSlgKS5qb2luKCcsICcpKSxcbiAgICApO1xuICB9XG5cbiAgY29uc3QgZWRnZXMgPSAoY3VycmVudER0bz8uZWRnZXMgPz8gW10pLmZpbHRlcihcbiAgICAoZWRnZSkgPT4gZWRnZS5mcm9tID09PSBub2RlSWQgfHwgZWRnZS50byA9PT0gbm9kZUlkLFxuICApO1xuICBpZiAoZWRnZXMubGVuZ3RoID4gMCkge1xuICAgIGxpc3QuYXBwZW5kKC4uLmRldGFpbFBhaXIoJ3JlbGF0aW9uc2hpcHMnLCBTdHJpbmcoZWRnZXMubGVuZ3RoKSkpO1xuICB9XG5cbiAgZGV0YWlsQm9keS5yZXBsYWNlQ2hpbGRyZW4obGlzdCk7XG5cbiAgaWYgKGVkZ2VzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBoZWFkaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDMnKTtcbiAgICBoZWFkaW5nLmNsYXNzTmFtZSA9ICdjZi1kZXRhaWwtdGl0bGUnO1xuICAgIGhlYWRpbmcudGV4dENvbnRlbnQgPSAnUmVsYXRpb25zaGlwcyc7XG4gICAgZGV0YWlsQm9keS5hcHBlbmRDaGlsZChoZWFkaW5nKTtcblxuICAgIGNvbnN0IGVkZ2VMaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgICBlZGdlTGlzdC5jbGFzc05hbWUgPSAnY2YtbGVnZW5kJztcbiAgICBmb3IgKGNvbnN0IGVkZ2Ugb2YgZWRnZXMuc2xpY2UoMCwgMTIpKSB7XG4gICAgICBjb25zdCBpdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IGVkZ2UuZnJvbSA9PT0gbm9kZUlkID8gJ1x1MjE5MicgOiAnXHUyMTkwJztcbiAgICAgIGNvbnN0IG90aGVyID0gZWRnZS5mcm9tID09PSBub2RlSWQgPyBlZGdlLnRvIDogZWRnZS5mcm9tO1xuICAgICAgaXRlbS50ZXh0Q29udGVudCA9IGAke2RpcmVjdGlvbn0gJHtlZGdlLnR5cGV9IFx1MDBCNyAke290aGVyfSAoJHtlZGdlLnN0YXR1c30pYDtcbiAgICAgIGVkZ2VMaXN0LmFwcGVuZENoaWxkKGl0ZW0pO1xuICAgIH1cbiAgICBkZXRhaWxCb2R5LmFwcGVuZENoaWxkKGVkZ2VMaXN0KTtcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gbmV4dFxuICovXG5mdW5jdGlvbiBhcHBseVNldHRpbmdzKG5leHQpIHtcbiAgY29uc3QgcHJldmlvdXNNYXhMaW5lcyA9IHNldHRpbmdzLm1heExpbmVzO1xuICBzZXR0aW5ncyA9IHJlc29sdmVQcmV2aWV3U2V0dGluZ3MoeyAuLi5zZXR0aW5ncywgLi4ubmV4dCB9KTtcbiAgcHJldmlld0NvbnRyb2xsZXIuY29uZmlndXJlKHtcbiAgICBkZWxheU1zOiBzZXR0aW5ncy5kZWxheU1zLFxuICAgIGVuYWJsZWQ6IHNldHRpbmdzLmVuYWJsZWQsXG4gICAgcGluQnlEZWZhdWx0OiBzZXR0aW5ncy5waW5CeURlZmF1bHQsXG4gIH0pO1xuICBpZiAoc2V0dGluZ3MubWF4TGluZXMgIT09IHByZXZpb3VzTWF4TGluZXMpIHtcbiAgICBwcmV2aWV3Q2FjaGUuY2xlYXIoKTtcbiAgfVxuICBpZiAoIXNldHRpbmdzLmVuYWJsZWQpIHtcbiAgICBwcmV2aWV3Q29udHJvbGxlci5kaXNtaXNzKCk7XG4gICAgaGlkZVByZXZpZXcoKTtcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gcGlubmVkXG4gKi9cbmZ1bmN0aW9uIHN5bmNQaW5CdXR0b24ocGlubmVkKSB7XG4gIHByZXZpZXdQaW4uc2V0QXR0cmlidXRlKCdhcmlhLXByZXNzZWQnLCBwaW5uZWQgPyAndHJ1ZScgOiAnZmFsc2UnKTtcbiAgcHJldmlld1Bpbi50ZXh0Q29udGVudCA9IHBpbm5lZCA/ICdQaW5uZWQnIDogJ1Bpbic7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZFxuICogQHJldHVybnMge1JlY29yZDxzdHJpbmcsIGFueT58bnVsbH1cbiAqL1xuZnVuY3Rpb24gbm9kZUJ5SWQobm9kZUlkKSB7XG4gIHJldHVybiBjdXJyZW50RHRvPy5ub2Rlcy5maW5kKChub2RlKSA9PiBub2RlLmlkID09PSBub2RlSWQpID8/IG51bGw7XG59XG5cbi8qKlxuICogQHBhcmFtIHt7eDogbnVtYmVyLCB5OiBudW1iZXJ9fG51bGx9IGFuY2hvclxuICovXG5mdW5jdGlvbiBwb3NpdGlvblByZXZpZXcoYW5jaG9yKSB7XG4gIGNvbnN0IHdyYXAgPSBzdmcucGFyZW50RWxlbWVudD8uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIGlmICghd3JhcCkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBwb2ludCA9IGFuY2hvciA/PyB7XG4gICAgeDogd3JhcC5sZWZ0ICsgMjQsXG4gICAgeTogd3JhcC50b3AgKyA3MixcbiAgfTtcbiAgY29uc3Qgd2lkdGggPSBNYXRoLm1pbigzODAsIE1hdGgubWF4KDI2MCwgd3JhcC53aWR0aCAtIDMyKSk7XG4gIGNvbnN0IG1heExlZnQgPSBNYXRoLm1heCg4LCB3cmFwLndpZHRoIC0gd2lkdGggLSA4KTtcbiAgY29uc3QgbGVmdCA9IE1hdGgubWF4KDgsIE1hdGgubWluKG1heExlZnQsIHBvaW50LnggLSB3cmFwLmxlZnQgKyAxNCkpO1xuICBjb25zdCB0b3AgPSBNYXRoLm1heCg4LCBNYXRoLm1pbihNYXRoLm1heCg4LCB3cmFwLmhlaWdodCAtIDIyMCksIHBvaW50LnkgLSB3cmFwLnRvcCArIDE0KSk7XG4gIHByZXZpZXcuc3R5bGUud2lkdGggPSBgJHt3aWR0aH1weGA7XG4gIHByZXZpZXcuc3R5bGUubGVmdCA9IGAke2xlZnR9cHhgO1xuICBwcmV2aWV3LnN0eWxlLnRvcCA9IGAke3RvcH1weGA7XG59XG5cbi8qKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBub2RlXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT58bnVsbH0gc2xpY2VcbiAqL1xuZnVuY3Rpb24gcmVuZGVyUHJldmlld0NhcmQobm9kZSwgc2xpY2UpIHtcbiAgY29uc3QgbW9kZWwgPSBidWlsZFByZXZpZXdNb2RlbCh7XG4gICAgbm9kZSxcbiAgICBzbGljZSxcbiAgICBtYXhMaW5lczogc2V0dGluZ3MubWF4TGluZXMsXG4gIH0pO1xuICBwcmV2aWV3VGl0bGUudGV4dENvbnRlbnQgPSBgJHttb2RlbC5raW5kfSBcdTAwQjcgJHttb2RlbC50aXRsZX1gO1xuICBwcmV2aWV3TWV0YS50ZXh0Q29udGVudCA9IFtcbiAgICBtb2RlbC5maWxlLFxuICAgIGBsaW5lcyAke21vZGVsLmxpbmVMYWJlbH1gLFxuICAgIG1vZGVsLmludGVncml0eSAhPT0gJ2V4YWN0J1xuICAgICAgPyBtb2RlbC5pbnRlZ3JpdHlcbiAgICAgIDogbW9kZWwuZG9jdW1lbnRWZXJzaW9uXG4gICAgICAgID8gYHYke21vZGVsLmRvY3VtZW50VmVyc2lvbn1gXG4gICAgICAgIDogJycsXG4gIF1cbiAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgLmpvaW4oJyBcdTAwQjcgJyk7XG4gIHByZXZpZXdCb2R5LnJlcGxhY2VDaGlsZHJlbigpO1xuXG4gIGlmICghbW9kZWwuc3ludGhldGljICYmICFtb2RlbC5lbXB0eSkge1xuICAgIGNvbnN0IGxhbmd1YWdlID1cbiAgICAgIHR5cGVvZiBzbGljZT8ubGFuZ3VhZ2VJZCA9PT0gJ3N0cmluZycgPyBzbGljZS5sYW5ndWFnZUlkIDogKG5vZGUucmFuZ2U/LmZpbGVJZCA/PyAnJyk7XG4gICAgY29uc3QgcmVuZGVyZWQgPSBzZXR0aW5ncy5zeW50YXhIaWdobGlnaHRpbmdcbiAgICAgID8gaGlnaGxpZ2h0TGluZXMobW9kZWwudGV4dCwgbGFuZ3VhZ2UpXG4gICAgICA6IGhpZ2hsaWdodExpbmVzKG1vZGVsLnRleHQsICcnKTtcbiAgICBjb25zdCBmaXJzdExpbmUgPSBOdW1iZXIoc2xpY2U/LmxpbmVzPy5zdGFydExpbmUgPz8gbm9kZS5yYW5nZT8uc3RhcnRMaW5lID8/IDApICsgMTtcbiAgICBjb25zdCBjb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgY29kZS5jbGFzc05hbWUgPSAnY2YtcHJldmlldy1jb2RlJztcbiAgICBmb3IgKGNvbnN0IFtpbmRleCwgdG9rZW5zXSBvZiByZW5kZXJlZC5saW5lcy5lbnRyaWVzKCkpIHtcbiAgICAgIGNvbnN0IGxpbmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIGxpbmUuY2xhc3NOYW1lID0gJ2NmLXByZXZpZXctbGluZSc7XG4gICAgICBjb25zdCBudW1iZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICBudW1iZXIuY2xhc3NOYW1lID0gJ2NmLXByZXZpZXctbGluZS1udW1iZXInO1xuICAgICAgbnVtYmVyLnRleHRDb250ZW50ID0gU3RyaW5nKGZpcnN0TGluZSArIGluZGV4KTtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICBjb250ZW50LmNsYXNzTmFtZSA9ICdjZi1wcmV2aWV3LWxpbmUtdGV4dCc7XG4gICAgICBmb3IgKGNvbnN0IHRva2VuIG9mIHRva2Vucykge1xuICAgICAgICBjb25zdCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICBpZiAodG9rZW4uY2xhc3NOYW1lKSB7XG4gICAgICAgICAgc3Bhbi5jbGFzc05hbWUgPSB0b2tlbi5jbGFzc05hbWU7XG4gICAgICAgIH1cbiAgICAgICAgc3Bhbi50ZXh0Q29udGVudCA9IHRva2VuLnRleHQ7XG4gICAgICAgIGNvbnRlbnQuYXBwZW5kQ2hpbGQoc3Bhbik7XG4gICAgICB9XG4gICAgICBsaW5lLmFwcGVuZChudW1iZXIsIGNvbnRlbnQpO1xuICAgICAgY29kZS5hcHBlbmRDaGlsZChsaW5lKTtcbiAgICB9XG4gICAgcHJldmlld0JvZHkuYXBwZW5kQ2hpbGQoY29kZSk7XG4gICAgaWYgKHJlbmRlcmVkLmRlZ3JhZGVkKSB7XG4gICAgICBwcmV2aWV3Qm9keS5jbGFzc0xpc3QuYWRkKCdpcy1wbGFpbicpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwcmV2aWV3Qm9keS5jbGFzc0xpc3QucmVtb3ZlKCdpcy1wbGFpbicpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG5vdGVzID0gW107XG4gIGlmIChtb2RlbC5tZXNzYWdlKSB7XG4gICAgbm90ZXMucHVzaChtb2RlbC5tZXNzYWdlKTtcbiAgfVxuICBpZiAobW9kZWwudHJ1bmNhdGVkKSB7XG4gICAgbm90ZXMucHVzaChgUHJldmlldyB0cnVuY2F0ZWQgdG8gJHtzZXR0aW5ncy5tYXhMaW5lc30gbGluZXMuYCk7XG4gIH1cbiAgcHJldmlld05vdGUudGV4dENvbnRlbnQgPSBub3Rlcy5qb2luKCcgJyk7XG4gIGNvbnN0IGNhbk9wZW4gPSAhbW9kZWwuc3ludGhldGljICYmICFtb2RlbC5lbXB0eSAmJiBtb2RlbC5pbnRlZ3JpdHkgPT09ICdleGFjdCc7XG4gIHByZXZpZXdCb2R5LmNsYXNzTGlzdC50b2dnbGUoJ2lzLWNsaWNrYWJsZScsIEJvb2xlYW4oc2V0dGluZ3MuY2xpY2tUb05hdmlnYXRlICYmIGNhbk9wZW4pKTtcbiAgcHJldmlld09wZW4uZGlzYWJsZWQgPSAhY2FuT3BlbjtcbiAgcHJldmlldy5jbGFzc0xpc3QudG9nZ2xlKCdpcy1zdGFsZScsIG1vZGVsLnN0YWxlKTtcbiAgcHJldmlldy5jbGFzc0xpc3QudG9nZ2xlKCdpcy1zeW50aGV0aWMnLCBtb2RlbC5zeW50aGV0aWMpO1xuICBwcmV2aWV3LmhpZGRlbiA9IGZhbHNlO1xuICBwb3NpdGlvblByZXZpZXcocHJldmlld0FuY2hvcik7XG59XG5cbmZ1bmN0aW9uIGhpZGVQcmV2aWV3KCkge1xuICBwcmV2aWV3UmVxdWVzdCArPSAxO1xuICBwcmV2aWV3Tm9kZUlkID0gbnVsbDtcbiAgcHJldmlld0FuY2hvciA9IG51bGw7XG4gIHByZXZpZXcuaGlkZGVuID0gdHJ1ZTtcbiAgcHJldmlld0JvZHkucmVwbGFjZUNoaWxkcmVuKCk7XG4gIHByZXZpZXdOb3RlLnRleHRDb250ZW50ID0gJyc7XG4gIHN5bmNQaW5CdXR0b24oZmFsc2UpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWRcbiAqIEBwYXJhbSB7e3g6IG51bWJlciwgeTogbnVtYmVyfXxudWxsfSBbYW5jaG9yXVxuICogQHBhcmFtIHtib29sZWFufSBbcGluXVxuICovXG5hc3luYyBmdW5jdGlvbiBvcGVuUHJldmlldyhub2RlSWQsIGFuY2hvciA9IG51bGwsIHBpbiA9IGZhbHNlKSB7XG4gIGNvbnN0IG5vZGUgPSBub2RlQnlJZChub2RlSWQpO1xuICBpZiAoIW5vZGUpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgcHJldmlld05vZGVJZCA9IG5vZGVJZDtcbiAgcHJldmlld0FuY2hvciA9IGFuY2hvcjtcbiAgaWYgKHBpbikge1xuICAgIHByZXZpZXdDb250cm9sbGVyLnNldFBpbm5lZCh0cnVlKTtcbiAgICBzeW5jUGluQnV0dG9uKHRydWUpO1xuICAgIHByZXZpZXcuZm9jdXMoKTtcbiAgfVxuICBpZiAobm9kZS5pc1N5bnRoZXRpYyB8fCAhbm9kZS5yYW5nZSkge1xuICAgIHJlbmRlclByZXZpZXdDYXJkKG5vZGUsIG51bGwpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBrZXkgPSBgJHtub2RlSWR9fCR7c2V0dGluZ3MubWF4TGluZXN9YDtcbiAgY29uc3QgY2FjaGVkID0gcHJldmlld0NhY2hlLmdldChrZXkpO1xuICBpZiAoY2FjaGVkKSB7XG4gICAgcmVuZGVyUHJldmlld0NhcmQobm9kZSwgY2FjaGVkKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgcmVxdWVzdCA9ICsrcHJldmlld1JlcXVlc3Q7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicmlkZ2UucmVxdWVzdCgnc291cmNlLnNsaWNlJywge1xuICAgICAgZmlsZUlkOiBub2RlLnJhbmdlLmZpbGVJZCxcbiAgICAgIHJhbmdlOiBub2RlLnJhbmdlLFxuICAgICAgbWF4TGluZXM6IHNldHRpbmdzLm1heExpbmVzLFxuICAgIH0pO1xuICAgIGlmIChyZXF1ZXN0ICE9PSBwcmV2aWV3UmVxdWVzdCB8fCBwcmV2aWV3Tm9kZUlkICE9PSBub2RlSWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc2xpY2UgPSByZXNwb25zZS5wYXlsb2FkLnNsaWNlID8/IG51bGw7XG4gICAgcHJldmlld0NhY2hlLnNldChrZXksIHNsaWNlKTtcbiAgICBpZiAoc2xpY2U/LmludGVncml0eSAmJiBzbGljZS5pbnRlZ3JpdHkgIT09ICdleGFjdCcpIHtcbiAgICAgIGludGVncml0eUJ5Tm9kZS5zZXQobm9kZUlkLCBzbGljZS5pbnRlZ3JpdHkpO1xuICAgICAgcmVuZGVyZXIubWFya1N0YWxlKFtub2RlSWRdKTtcbiAgICB9XG4gICAgcmVuZGVyUHJldmlld0NhcmQobm9kZSwgc2xpY2UpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGlmIChyZXF1ZXN0ICE9PSBwcmV2aWV3UmVxdWVzdCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZW5kZXJQcmV2aWV3Q2FyZChub2RlLCB7XG4gICAgICB0ZXh0OiAnJyxcbiAgICAgIHJlbGF0aXZlUGF0aDogJycsXG4gICAgICBpbnRlZ3JpdHk6ICdtaXNzaW5nJyxcbiAgICAgIHJlYXNvbjogZXJyb3I/Lm1lc3NhZ2UgPz8gU3RyaW5nKGVycm9yKSxcbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWRcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgYW55Pn0gW25vZGVdXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIG5hdmlnYXRlVG8obm9kZUlkLCBub2RlID0gbm9kZUJ5SWQobm9kZUlkKSkge1xuICBpZiAoIW5vZGU/LnJhbmdlIHx8IG5vZGUuaXNTeW50aGV0aWMpIHtcbiAgICBzZXRCYW5uZXIoJ1RoaXMgbm9kZSBoYXMgbm8gc291cmNlIHRvIG9wZW4uJywgZmFsc2UpO1xuICAgIHJldHVybjtcbiAgfVxuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ25hdmlnYXRlLnRvJywge1xuICAgICAgZmlsZUlkOiBub2RlLnJhbmdlLmZpbGVJZCxcbiAgICAgIHJhbmdlOiBub2RlLnJhbmdlLFxuICAgICAgbm9kZUlkLFxuICAgIH0pO1xuICAgIGlmIChyZXNwb25zZS5wYXlsb2FkLm9rICE9PSB0cnVlKSB7XG4gICAgICBzZXRCYW5uZXIoXG4gICAgICAgIGAke3Jlc3BvbnNlLnBheWxvYWQuY29kZSA/PyAnRV9OQVZJR0FUSU9OJ306ICR7cmVzcG9uc2UucGF5bG9hZC5tZXNzYWdlID8/ICdDb3VsZCBub3Qgb3BlbiBzb3VyY2UuJ31gLFxuICAgICAgICB0cnVlLFxuICAgICAgKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgc2V0QmFubmVyKGBDb3VsZCBub3Qgb3BlbiBzb3VyY2U6ICR7ZXJyb3I/Lm1lc3NhZ2UgPz8gU3RyaW5nKGVycm9yKX1gLCB0cnVlKTtcbiAgfVxufVxuXG4vKipcbiAqIFZhbGlkYXRlIGV2ZXJ5IHNvdXJjZS1iYWNrZWQgbm9kZSBvbmNlIG9uIGdyYXBoIGxvYWQuXG4gKlxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSBkdG9cbiAqL1xuYXN5bmMgZnVuY3Rpb24gdmFsaWRhdGVHcmFwaChkdG8pIHtcbiAgaW50ZWdyaXR5QnlOb2RlID0gbmV3IE1hcCgpO1xuICBjb25zdCByYW5nZXMgPSBkdG8ubm9kZXNcbiAgICAuZmlsdGVyKChub2RlKSA9PiBub2RlLnJhbmdlICYmICFub2RlLmlzU3ludGhldGljKVxuICAgIC5tYXAoKG5vZGUpID0+ICh7IG5vZGVJZDogbm9kZS5pZCwgLi4ubm9kZS5yYW5nZSB9KSk7XG4gIGlmIChyYW5nZXMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicmlkZ2UucmVxdWVzdCgnc291cmNlLnZhbGlkYXRpb24nLCB7XG4gICAgICByYW5nZXM6IHJhbmdlcy5tYXAoKHsgbm9kZUlkOiBfbm9kZUlkLCAuLi5yYW5nZSB9KSA9PiByYW5nZSksXG4gICAgfSk7XG4gICAgY29uc3QgcmVzdWx0cyA9IEFycmF5LmlzQXJyYXkocmVzcG9uc2UucGF5bG9hZC5yZXN1bHRzKSA/IHJlc3BvbnNlLnBheWxvYWQucmVzdWx0cyA6IFtdO1xuICAgIGNvbnN0IHN0YWxlID0gW107XG4gICAgZm9yIChjb25zdCBbaW5kZXgsIHJlc3VsdF0gb2YgcmVzdWx0cy5lbnRyaWVzKCkpIHtcbiAgICAgIGNvbnN0IG5vZGVJZCA9IHJhbmdlc1tpbmRleF0/Lm5vZGVJZDtcbiAgICAgIGlmICghbm9kZUlkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaW50ZWdyaXR5QnlOb2RlLnNldChub2RlSWQsIHJlc3VsdC5pbnRlZ3JpdHkgPz8gJ21pc3NpbmcnKTtcbiAgICAgIGlmIChyZXN1bHQuaW50ZWdyaXR5ICE9PSAnZXhhY3QnKSB7XG4gICAgICAgIHN0YWxlLnB1c2gobm9kZUlkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHN0YWxlLmxlbmd0aCA+IDApIHtcbiAgICAgIHJlbmRlcmVyLm1hcmtTdGFsZShzdGFsZSk7XG4gICAgICBzZXRCYW5uZXIoXG4gICAgICAgIGAke3N0YWxlLmxlbmd0aH0gbm9kZSR7c3RhbGUubGVuZ3RoID09PSAxID8gJycgOiAncyd9IHJlZmVyZW5jZSBjaGFuZ2VkIG9yIG1pc3Npbmcgc291cmNlLiBQcmV2aWV3IG1hcmtzIHRoZW0gc3RhbGU7IHJlLWFuYWx5emUgYmVmb3JlIHRydXN0aW5nIHRoZW0uYCxcbiAgICAgICAgZmFsc2UsXG4gICAgICApO1xuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgLy8gVmFsaWRhdGlvbiBpcyBhbiBlbmhhbmNlbWVudC4gQSBmYWlsdXJlIG11c3Qgbm90IGhpZGUgdGhlIGdyYXBoLlxuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmdbXX0gZmlsZUlkc1xuICovXG5mdW5jdGlvbiBtYXJrU3RhbGVGaWxlcyhmaWxlSWRzKSB7XG4gIGNvbnN0IHdhbnRlZCA9IG5ldyBTZXQoQXJyYXkuaXNBcnJheShmaWxlSWRzKSA/IGZpbGVJZHMgOiBbXSk7XG4gIGlmICghY3VycmVudER0byB8fCB3YW50ZWQuc2l6ZSA9PT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBzdGFsZSA9IGN1cnJlbnREdG8ubm9kZXNcbiAgICAuZmlsdGVyKChub2RlKSA9PiBub2RlLnJhbmdlICYmIHdhbnRlZC5oYXMobm9kZS5yYW5nZS5maWxlSWQpKVxuICAgIC5tYXAoKG5vZGUpID0+IG5vZGUuaWQpO1xuICBpZiAoc3RhbGUubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHByZXZpZXdDYWNoZS5jbGVhcigpO1xuICBmb3IgKGNvbnN0IG5vZGVJZCBvZiBzdGFsZSkge1xuICAgIGludGVncml0eUJ5Tm9kZS5zZXQobm9kZUlkLCAnc3RhbGUnKTtcbiAgfVxuICByZW5kZXJlci5tYXJrU3RhbGUoc3RhbGUpO1xuICBwcmV2aWV3Q29udHJvbGxlci5kaXNtaXNzKCk7XG4gIGhpZGVQcmV2aWV3KCk7XG4gIHNldEJhbm5lcihcbiAgICBgU291cmNlIGNoYW5nZWQgZm9yICR7c3RhbGUubGVuZ3RofSBub2RlJHtzdGFsZS5sZW5ndGggPT09IDEgPyAnJyA6ICdzJ30uIFByZXZpZXdzIGFyZSBzdGFsZTsgcmUtYW5hbHl6ZSBiZWZvcmUgdHJ1c3RpbmcgdGhlbS5gLFxuICAgIGZhbHNlLFxuICApO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7aW1wb3J0KCcuLi9jb3JlL2dyYXBoL2R0by5qcycpLkdyYXBoRHRvfSBkdG9cbiAqL1xuZnVuY3Rpb24gcmVuZGVyTGVnZW5kKGR0bykge1xuICBsZWdlbmQucmVwbGFjZUNoaWxkcmVuKCk7XG4gIGZvciAoY29uc3Qgc3RhdHVzTmFtZSBvZiBkdG8ubGVnZW5kLnN0YXR1c2VzKSB7XG4gICAgY29uc3QgaXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgY29uc3Qgc3dhdGNoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHN3YXRjaC5jbGFzc05hbWUgPSBgY2Ytc3dhdGNoIGNmLWVkZ2UtLSR7c3RhdHVzTmFtZX1gO1xuICAgIGNvbnN0IGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIGxhYmVsLnRleHRDb250ZW50ID0gc3RhdHVzTmFtZTtcbiAgICBpZiAoc3RhdHVzTmFtZSAhPT0gJ3Jlc29sdmVkJykge1xuICAgICAgbGFiZWwudGV4dENvbnRlbnQgPSBgJHtzdGF0dXNOYW1lfSAocGF0dGVybiArIGxhYmVsKWA7XG4gICAgfVxuICAgIGl0ZW0uYXBwZW5kKHN3YXRjaCwgbGFiZWwpO1xuICAgIGxlZ2VuZC5hcHBlbmRDaGlsZChpdGVtKTtcbiAgfVxuICBmb3IgKGNvbnN0IGVkZ2VLaW5kIG9mIGR0by5sZWdlbmQuZWRnZUtpbmRzID8/IFtdKSB7XG4gICAgY29uc3QgaXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgY29uc3Qgc3dhdGNoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHN3YXRjaC5jbGFzc05hbWUgPSBgY2Ytc3dhdGNoIGNmLWVkZ2UtLWtpbmQtJHtlZGdlS2luZH1gO1xuICAgIGNvbnN0IGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIGxhYmVsLnRleHRDb250ZW50ID0gYGVkZ2U6ICR7ZWRnZUtpbmR9YDtcbiAgICBpdGVtLmFwcGVuZChzd2F0Y2gsIGxhYmVsKTtcbiAgICBsZWdlbmQuYXBwZW5kQ2hpbGQoaXRlbSk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge0FycmF5PHtzeW1ib2xJZDogc3RyaW5nLCBuYW1lOiBzdHJpbmcsIHF1YWxpZmllZE5hbWU6IHN0cmluZywga2luZDogc3RyaW5nfT59IGxpc3RcbiAqL1xuZnVuY3Rpb24gcmVuZGVyRnVuY3Rpb25QaWNrZXIobGlzdCkge1xuICBpZiAoIWZ1bmN0aW9uUGlja2VyKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGZ1bmN0aW9uUGlja2VyLnJlcGxhY2VDaGlsZHJlbigpO1xuICBmb3IgKGNvbnN0IGVudHJ5IG9mIGxpc3QpIHtcbiAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcbiAgICBvcHRpb24udmFsdWUgPSBlbnRyeS5zeW1ib2xJZDtcbiAgICBvcHRpb24udGV4dENvbnRlbnQgPSBgJHtlbnRyeS5xdWFsaWZpZWROYW1lfSAoJHtlbnRyeS5raW5kfSlgO1xuICAgIGZ1bmN0aW9uUGlja2VyLmFwcGVuZENoaWxkKG9wdGlvbik7XG4gIH1cbiAgZnVuY3Rpb25QaWNrZXIuaGlkZGVuID0gbGlzdC5sZW5ndGggPD0gMTtcbiAgaWYgKHNlbGVjdGVkU3ltYm9sSWQpIHtcbiAgICBmdW5jdGlvblBpY2tlci52YWx1ZSA9IHNlbGVjdGVkU3ltYm9sSWQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2hvd0NhcGFiaWxpdGllcyhwYXlsb2FkKSB7XG4gIGNvbnN0IGFkYXB0ZXJzID0gQXJyYXkuaXNBcnJheShwYXlsb2FkLmFkYXB0ZXJzKSA/IHBheWxvYWQuYWRhcHRlcnMgOiBbXTtcbiAgY29uc3QgbmFtZXMgPSBhZGFwdGVycy5tYXAoKGFkYXB0ZXIpID0+IGFkYXB0ZXIuaWQpLmpvaW4oJywgJykgfHwgJ25vbmUnO1xuICBtZXRhLnRleHRDb250ZW50ID0gYE1vY2sgZGF0YSBcdTAwQjcgYWRhcHRlcnM6ICR7bmFtZXN9IFx1MDBCNyBwcm90b2NvbCB2JHtwYXlsb2FkLnByb3RvY29sVmVyc2lvbiA/PyAnPyd9YDtcbiAgaWYgKHBheWxvYWQ/LnNldHRpbmdzICYmIHR5cGVvZiBwYXlsb2FkLnNldHRpbmdzID09PSAnb2JqZWN0Jykge1xuICAgIGFwcGx5U2V0dGluZ3MocGF5bG9hZC5zZXR0aW5ncyk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHBheWxvYWRcbiAqL1xuZnVuY3Rpb24gaGFuZGxlR3JhcGgocGF5bG9hZCkge1xuICBjb25zdCBkdG9DYW5kaWRhdGUgPSAvKiogQHR5cGUge3tkdG8/OiB1bmtub3dufX0gKi8gKHBheWxvYWQpLmR0bztcbiAgY29uc3QgdmFsaWRhdGlvbiA9IHZhbGlkYXRlRHRvKGR0b0NhbmRpZGF0ZSk7XG4gIGlmICghdmFsaWRhdGlvbi5vaykge1xuICAgIHNldEJhbm5lcihgSW52YWxpZCBncmFwaCBwYXlsb2FkOiAke3ZhbGlkYXRpb24uaXNzdWVzWzBdfWAsIHRydWUpO1xuICAgIHNldFN0YXR1cygnUmVuZGVyIGZhaWxlZCcpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBkdG8gPSB2YWxpZGF0aW9uLmR0bztcbiAgY3VycmVudER0byA9IGR0bztcbiAgcHJldmlld0NhY2hlLmNsZWFyKCk7XG4gIGludGVncml0eUJ5Tm9kZSA9IG5ldyBNYXAoKTtcbiAgaGlkZVByZXZpZXcoKTtcbiAgZW1wdHkuaGlkZGVuID0gdHJ1ZTtcbiAgcmVuZGVyZXIucmVuZGVyKGR0byk7XG4gIHJlbmRlckxlZ2VuZChkdG8pO1xuICBjbGVhckRldGFpbCgpO1xuICB2b2lkIHZhbGlkYXRlR3JhcGgoZHRvKTtcbiAgY29uc3Qgc3ViamVjdCA9XG4gICAgZHRvLmR0b0tpbmQgPT09ICdjZmcnICYmIGR0by5mdW5jdGlvbiA/IGAke2R0by5mdW5jdGlvbi5xdWFsaWZpZWROYW1lfSBcdTAwQjcgQ0ZHYCA6ICdjYWxsIGdyYXBoJztcbiAgc2V0U3RhdHVzKFxuICAgIGAke3N1YmplY3R9IFx1MDBCNyAke2R0by5sYW5ndWFnZX0gXHUwMEI3ICR7ZHRvLm5vZGVzLmxlbmd0aH0gbm9kZXMgXHUwMEI3ICR7ZHRvLmVkZ2VzLmxlbmd0aH0gZWRnZXMgXHUwMEI3ICR7ZHRvLmNvbXBsZXRlbmVzc31gLFxuICApO1xuICBtZXRhLnRleHRDb250ZW50ID0gYCR7ZHRvLmFkYXB0ZXJJZH0gXHUwMEI3ICR7c3ViamVjdH0gXHUwMEI3IGR0byB2JHtkdG8uZHRvVmVyc2lvbn1gO1xuICBjb25zdCBkZWdyYWRhdGlvbnMgPSBkdG8uZGVncmFkYXRpb25zID8/IFtdO1xuICBjb25zdCBtZXNzYWdlcyA9IGRlZ3JhZGF0aW9ucy5tYXAoKGVudHJ5KSA9PlxuICAgIHR5cGVvZiBlbnRyeSA9PT0gJ3N0cmluZydcbiAgICAgID8gZW50cnlcbiAgICAgIDogYCR7ZW50cnkuc2V2ZXJpdHkgPT09ICdpbmZvJyA/ICcnIDogYCR7ZW50cnkuc2V2ZXJpdHl9OiBgfSR7ZW50cnkubWVzc2FnZX1gLFxuICApO1xuICBzZXRCYW5uZXIobWVzc2FnZXMubGVuZ3RoID4gMCA/IG1lc3NhZ2VzLmpvaW4oJyBcdTAwQjcgJykgOiAnJywgZmFsc2UpO1xufVxuXG5icmlkZ2Uub24oJ3Byb3RvY29sLmVycm9yJywgKHBheWxvYWQpID0+IHtcbiAgY29uc3QgY29kZSA9IHR5cGVvZiBwYXlsb2FkLmNvZGUgPT09ICdzdHJpbmcnID8gcGF5bG9hZC5jb2RlIDogJ0VfUFJPVE9DT0wnO1xuICBjb25zdCBtZXNzYWdlID0gdHlwZW9mIHBheWxvYWQubWVzc2FnZSA9PT0gJ3N0cmluZycgPyBwYXlsb2FkLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvci4nO1xuICBzZXRCYW5uZXIoYCR7Y29kZX06ICR7bWVzc2FnZX1gLCB0cnVlKTtcbiAgc2V0U3RhdHVzKCdFcnJvcicpO1xufSk7XG5cbmJyaWRnZS5vbignc2V0dGluZ3MuZGF0YScsIChwYXlsb2FkKSA9PiB7XG4gIGNvbnN0IG5leHQgPSBwYXlsb2FkPy5zZXR0aW5ncztcbiAgaWYgKG5leHQgJiYgdHlwZW9mIG5leHQgPT09ICdvYmplY3QnKSB7XG4gICAgYXBwbHlTZXR0aW5ncyhuZXh0KTtcbiAgfVxufSk7XG5cbmJyaWRnZS5vbignc291cmNlLnN0YWxlJywgKHBheWxvYWQpID0+IHtcbiAgbWFya1N0YWxlRmlsZXMoQXJyYXkuaXNBcnJheShwYXlsb2FkPy5maWxlSWRzKSA/IHBheWxvYWQuZmlsZUlkcyA6IFtdKTtcbn0pO1xuXG5icmlkZ2Uub24oJ3NlbGVjdGlvbi5jaGFuZ2VkJywgKHBheWxvYWQpID0+IHtcbiAgY29uc3Qgbm9kZUlkcyA9IEFycmF5LmlzQXJyYXkocGF5bG9hZD8ubm9kZUlkcykgPyBwYXlsb2FkLm5vZGVJZHMgOiBbXTtcbiAgcmVuZGVyZXIuaGlnaGxpZ2h0KG5vZGVJZHMpO1xuICBjb25zdCBhY3RpdmVOb2RlSWQgPSB0eXBlb2YgcGF5bG9hZD8uYWN0aXZlTm9kZUlkID09PSAnc3RyaW5nJyA/IHBheWxvYWQuYWN0aXZlTm9kZUlkIDogbnVsbDtcbiAgaWYgKGFjdGl2ZU5vZGVJZCkge1xuICAgIGNvbnN0IG5vZGUgPSBub2RlQnlJZChhY3RpdmVOb2RlSWQpO1xuICAgIGlmIChub2RlKSB7XG4gICAgICBzaG93Tm9kZURldGFpbHMoYWN0aXZlTm9kZUlkLCBub2RlKTtcbiAgICB9XG4gIH1cbn0pO1xuXG5icmlkZ2Uub24oJ2dyYXBoLmZvY3VzJywgKHBheWxvYWQpID0+IHtcbiAgaWYgKHR5cGVvZiBwYXlsb2FkPy5ub2RlSWQgPT09ICdzdHJpbmcnKSB7XG4gICAgY29uc3Qgbm9kZSA9IG5vZGVCeUlkKHBheWxvYWQubm9kZUlkKTtcbiAgICBpZiAobm9kZSkge1xuICAgICAgcmVuZGVyZXIuc2VsZWN0KHBheWxvYWQubm9kZUlkKTtcbiAgICAgIHNob3dOb2RlRGV0YWlscyhwYXlsb2FkLm5vZGVJZCwgbm9kZSk7XG4gICAgfVxuICB9XG4gIHN2Zy5mb2N1cz8uKCk7XG59KTtcblxucHJldmlldy5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyZW50ZXInLCAoKSA9PiB7XG4gIHByZXZpZXdDb250cm9sbGVyLnBvaW50ZXJFbnRlckNhcmQoKTtcbn0pO1xucHJldmlldy5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybGVhdmUnLCAoKSA9PiB7XG4gIHByZXZpZXdDb250cm9sbGVyLnBvaW50ZXJMZWF2ZUNhcmQoKTtcbn0pO1xucHJldmlld1Bpbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgc3luY1BpbkJ1dHRvbihwcmV2aWV3Q29udHJvbGxlci50b2dnbGVQaW4oKSk7XG59KTtcbnByZXZpZXdDbG9zZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgcHJldmlld0NvbnRyb2xsZXIuZGlzbWlzcygpO1xuICBoaWRlUHJldmlldygpO1xufSk7XG5wcmV2aWV3T3Blbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgaWYgKHByZXZpZXdOb2RlSWQpIHtcbiAgICB2b2lkIG5hdmlnYXRlVG8ocHJldmlld05vZGVJZCk7XG4gIH1cbn0pO1xucHJldmlld0JvZHkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gIGlmIChzZXR0aW5ncy5jbGlja1RvTmF2aWdhdGUgJiYgcHJldmlld05vZGVJZCAmJiAhcHJldmlld09wZW4uZGlzYWJsZWQpIHtcbiAgICB2b2lkIG5hdmlnYXRlVG8ocHJldmlld05vZGVJZCk7XG4gIH1cbn0pO1xucHJldmlldy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGV2ZW50KSA9PiB7XG4gIGlmIChldmVudC5rZXkgPT09ICdFc2NhcGUnKSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBwcmV2aWV3Q29udHJvbGxlci5kaXNtaXNzKCk7XG4gICAgaGlkZVByZXZpZXcoKTtcbiAgICByZW5kZXJlci5mb2N1c1NlbGVjdGlvbigpO1xuICB9XG59KTtcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGV2ZW50KSA9PiB7XG4gIGlmIChldmVudC5rZXkgPT09ICdFc2NhcGUnICYmICFwcmV2aWV3LmhpZGRlbikge1xuICAgIHByZXZpZXdDb250cm9sbGVyLmRpc21pc3MoKTtcbiAgICBoaWRlUHJldmlldygpO1xuICB9XG59KTtcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gc3ltYm9sSWRcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZENmZyhzeW1ib2xJZCkge1xuICBzZXRTdGF0dXMoJ0J1aWxkaW5nIGNvbnRyb2wtZmxvdyBncmFwaFx1MjAyNicpO1xuICBzZXRCYW5uZXIoJycpO1xuICB0cnkge1xuICAgIC8vIEEgcmVxdWVzdCByZXNvbHZlcyB3aXRoIGl0cyBjb3JyZWxhdGVkIHJlc3BvbnNlLiBUaGUgcmVzcG9uc2UgaXMgbm90XG4gICAgLy8gZGlzcGF0Y2hlZCB0byBgYnJpZGdlLm9uYCwgc28gaGFuZGxlIGl0IGhlcmUuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBicmlkZ2UucmVxdWVzdCgnY2ZnLmxvYWQnLCB7IHN5bWJvbElkIH0pO1xuICAgIHNlbGVjdGVkU3ltYm9sSWQgPSBzeW1ib2xJZDtcbiAgICBoYW5kbGVHcmFwaChyZXNwb25zZS5wYXlsb2FkKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBzZXRCYW5uZXIoYENvdWxkIG5vdCBidWlsZCBDRkc6ICR7ZXJyb3I/Lm1lc3NhZ2UgPz8gU3RyaW5nKGVycm9yKX1gLCB0cnVlKTtcbiAgICBzZXRTdGF0dXMoJ0NGRyB1bmF2YWlsYWJsZScpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBsb2FkR3JhcGgoKSB7XG4gIHNldFN0YXR1cygnTG9hZGluZyBncmFwaFx1MjAyNicpO1xuICBzZXRCYW5uZXIoJycpO1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ2NmZy5mdW5jdGlvbnMnLCB7fSk7XG4gICAgY29uc3QgbGlzdCA9IEFycmF5LmlzQXJyYXkocmVzcG9uc2UucGF5bG9hZC5mdW5jdGlvbnMpID8gcmVzcG9uc2UucGF5bG9hZC5mdW5jdGlvbnMgOiBbXTtcbiAgICBpZiAobGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICByZW5kZXJGdW5jdGlvblBpY2tlcihsaXN0KTtcbiAgICAgIGNvbnN0IHJldGFpbmVkID1cbiAgICAgICAgc2VsZWN0ZWRTeW1ib2xJZCAmJiBsaXN0LnNvbWUoKGVudHJ5KSA9PiBlbnRyeS5zeW1ib2xJZCA9PT0gc2VsZWN0ZWRTeW1ib2xJZClcbiAgICAgICAgICA/IHNlbGVjdGVkU3ltYm9sSWRcbiAgICAgICAgICA6IGxpc3RbMF0uc3ltYm9sSWQ7XG4gICAgICBjb25zdCBsb2FkZWQgPSBhd2FpdCBsb2FkQ2ZnKHJldGFpbmVkKTtcbiAgICAgIGlmIChsb2FkZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgLy8gVGhlIENGRyBjYXBhYmlsaXR5IG1heSBiZSBhYnNlbnQgKGZvciBleGFtcGxlIHRoZSBidWlsdC1pbiBkZW1vIHJ1bikuXG4gICAgLy8gRmFsbGluZyBiYWNrIHRvIHRoZSBjYWxsIGdyYXBoIGtlZXBzIHRoZSBwYW5lbCB1c2VmdWwgYW5kIGhvbmVzdC5cbiAgfVxuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ2dyYXBoLmxvYWQnLCB7IGRlbW86IHRydWUgfSk7XG4gICAgaGFuZGxlR3JhcGgocmVzcG9uc2UucGF5bG9hZCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgc2V0QmFubmVyKGBDb3VsZCBub3QgbG9hZCBncmFwaDogJHtlcnJvcj8ubWVzc2FnZSA/PyBTdHJpbmcoZXJyb3IpfWAsIHRydWUpO1xuICAgIHNldFN0YXR1cygnTG9hZCBmYWlsZWQnKTtcbiAgICBlbXB0eS5oaWRkZW4gPSBmYWxzZTtcbiAgfVxufVxuXG5yZWxvYWRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gIHZvaWQgbG9hZEdyYXBoKCk7XG59KTtcblxuZnVuY3Rpb25QaWNrZXI/LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHtcbiAgY29uc3Qgc3ltYm9sSWQgPSBmdW5jdGlvblBpY2tlci52YWx1ZTtcbiAgaWYgKHN5bWJvbElkKSB7XG4gICAgdm9pZCBsb2FkQ2ZnKHN5bWJvbElkKTtcbiAgfVxufSk7XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIChldmVudCkgPT4ge1xuICBzZXRCYW5uZXIoYFdlYnZpZXcgZXJyb3I6ICR7ZXZlbnQubWVzc2FnZX1gLCB0cnVlKTtcbn0pO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndW5oYW5kbGVkcmVqZWN0aW9uJywgKGV2ZW50KSA9PiB7XG4gIHNldEJhbm5lcihgVW5oYW5kbGVkIHJlamVjdGlvbjogJHtTdHJpbmcoZXZlbnQucmVhc29uKX1gLCB0cnVlKTtcbn0pO1xuXG5hc3luYyBmdW5jdGlvbiBib290KCkge1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ3dlYnZpZXcucmVhZHknLCB7XG4gICAgICBjbGllbnQ6ICd3ZWJ2aWV3JyxcbiAgICAgIHByb3RvY29sVmVyc2lvbjogUFJPVE9DT0xfVkVSU0lPTixcbiAgICB9KTtcbiAgICBzaG93Q2FwYWJpbGl0aWVzKHJlc3BvbnNlLnBheWxvYWQpO1xuICB9IGNhdGNoIHtcbiAgICAvLyBDYXBhYmlsaXRpZXMgYXJlIGluZm9ybWF0aW9uYWw7IGdyYXBoIGxvYWQgY2FuIHN0aWxsIHN1Y2NlZWQuXG4gIH1cbiAgYXdhaXQgbG9hZEdyYXBoKCk7XG59XG5cbnZvaWQgYm9vdCgpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFFQSxlQUFTLFdBQVcsS0FBSztBQUN2QixZQUFJLGVBQWUsS0FBSztBQUN0QixjQUFJLFFBQ0YsSUFBSSxTQUNKLElBQUksTUFDRixXQUFZO0FBQ1Ysa0JBQU0sSUFBSSxNQUFNLGtCQUFrQjtBQUFBLFVBQ3BDO0FBQUEsUUFDTixXQUFXLGVBQWUsS0FBSztBQUM3QixjQUFJLE1BQ0YsSUFBSSxRQUNKLElBQUksU0FDRixXQUFZO0FBQ1Ysa0JBQU0sSUFBSSxNQUFNLGtCQUFrQjtBQUFBLFVBQ3BDO0FBQUEsUUFDTjtBQUdBLGVBQU8sT0FBTyxHQUFHO0FBRWpCLGVBQU8sb0JBQW9CLEdBQUcsRUFBRSxRQUFRLENBQUMsU0FBUztBQUNoRCxnQkFBTSxPQUFPLElBQUksSUFBSTtBQUNyQixnQkFBTSxPQUFPLE9BQU87QUFHcEIsZUFBSyxTQUFTLFlBQVksU0FBUyxlQUFlLENBQUMsT0FBTyxTQUFTLElBQUksR0FBRztBQUN4RSx1QkFBVyxJQUFJO0FBQUEsVUFDakI7QUFBQSxRQUNGLENBQUM7QUFFRCxlQUFPO0FBQUEsTUFDVDtBQU1BLFVBQU0sV0FBTixNQUFlO0FBQUE7QUFBQTtBQUFBO0FBQUEsUUFJYixZQUFZLE1BQU07QUFFaEIsY0FBSSxLQUFLLFNBQVMsT0FBVyxNQUFLLE9BQU8sQ0FBQztBQUUxQyxlQUFLLE9BQU8sS0FBSztBQUNqQixlQUFLLGlCQUFpQjtBQUFBLFFBQ3hCO0FBQUEsUUFFQSxjQUFjO0FBQ1os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QSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBR0EsVUFBTSxpQkFBaUI7QUFBQSxNQUNyQjtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFFQSxVQUFNLGFBQWE7QUFBQSxNQUNqQjtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUVBLFVBQU0saUJBQWlCO0FBQUEsTUFDckI7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtB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LFlBQ0UsT0FBTztBQUFBO0FBQUEsY0FFTDtBQUFBLGNBQ0E7QUFBQSxjQUNBO0FBQUEsWUFDRjtBQUFBLFlBQ0EsV0FBVztBQUFBLGNBQ1QsR0FBRztBQUFBLGNBQ0gsR0FBRztBQUFBLFlBQ0w7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQUM7QUFBQSxJQUNMO0FBQUEsRUFDRjs7O0FDMWxCQSxNQUFNLFdBQVc7QUFDakIsTUFBTSxXQUFXO0FBQUEsSUFDZjtBQUFBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUlBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBO0FBQUEsSUFFQTtBQUFBLEVBQ0Y7QUFDQSxNQUFNLFdBQVc7QUFBQSxJQUNmO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBR0EsTUFBTSxRQUFRO0FBQUE7QUFBQSxJQUVaO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUE7QUFBQSxJQUVBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUE7QUFBQSxJQUVBO0FBQUEsSUFDQTtBQUFBO0FBQUEsSUFFQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNB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USxZQUFZLENBQUM7QUFDdkYsVUFBSSxLQUFLLFNBQVMsR0FBRztBQUNuQiw2QkFBcUIsSUFBSTtBQUN6QixjQUFNLFdBQ0osb0JBQW9CLEtBQUssS0FBSyxDQUFDLFVBQVUsTUFBTSxhQUFhLGdCQUFnQixJQUN4RSxtQkFDQSxLQUFLLENBQUMsRUFBRTtBQUNkLGNBQU0sU0FBUyxNQUFNLFFBQVEsUUFBUTtBQUNyQyxZQUFJLFFBQVE7QUFDVjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRixRQUFRO0FBQUEsSUFHUjtBQUNBLFFBQUk7QUFDRixZQUFNLFdBQVcsTUFBTSxPQUFPLFFBQVEsY0FBYyxFQUFFLE1BQU0sS0FBSyxDQUFDO0FBQ2xFLGtCQUFZLFNBQVMsT0FBTztBQUFBLElBQzlCLFNBQVMsT0FBTztBQUNkLGdCQUFVLHlCQUF5QixPQUFPLFdBQVcsT0FBTyxLQUFLLENBQUMsSUFBSSxJQUFJO0FBQzFFLGdCQUFVLGFBQWE7QUFDdkIsWUFBTSxTQUFTO0FBQUEsSUFDakI7QUFBQSxFQUNGO0FBRUEsZUFBYSxpQkFBaUIsU0FBUyxNQUFNO0FBQzNDLFNBQUssVUFBVTtBQUFBLEVBQ2pCLENBQUM7QUFFRCxrQkFBZ0IsaUJBQWlCLFVBQVUsTUFBTTtBQUMvQyxVQUFNLFdBQVcsZUFBZTtBQUNoQyxRQUFJLFVBQVU7QUFDWixXQUFLLFFBQVEsUUFBUTtBQUFBLElBQ3ZCO0FBQUEsRUFDRixDQUFDO0FBRUQsU0FBTyxpQkFBaUIsU0FBUyxDQUFDLFVBQVU7QUFDMUMsY0FBVSxrQkFBa0IsTUFBTSxPQUFPLElBQUksSUFBSTtBQUFBLEVBQ25ELENBQUM7QUFFRCxTQUFPLGlCQUFpQixzQkFBc0IsQ0FBQyxVQUFVO0FBQ3ZELGNBQVUsd0JBQXdCLE9BQU8sTUFBTSxNQUFNLENBQUMsSUFBSSxJQUFJO0FBQUEsRUFDaEUsQ0FBQztBQUVELGlCQUFlLE9BQU87QUFDcEIsUUFBSTtBQUNGLFlBQU0sV0FBVyxNQUFNLE9BQU8sUUFBUSxpQkFBaUI7QUFBQSxRQUNyRCxRQUFRO0FBQUEsUUFDUixpQkFBaUI7QUFBQSxNQUNuQixDQUFDO0FBQ0QsdUJBQWlCLFNBQVMsT0FBTztBQUFBLElBQ25DLFFBQVE7QUFBQSxJQUVSO0FBQ0EsVUFBTSxVQUFVO0FBQUEsRUFDbEI7QUFFQSxPQUFLLEtBQUs7IiwKICAibmFtZXMiOiBbInJlbmRlcmVyIiwgIklERU5UX1JFIiwgInNjb3BlTmFtZSIsICJ2ZXJzaW9uIiwgImkiLCAiaGlnaGxpZ2h0IiwgInJlc3VsdCIsICJib290IiwgInN2ZyIsICJlbXB0eSIsICJIaWdobGlnaHRKUyIsICJMSVRFUkFMUyJdCn0K
