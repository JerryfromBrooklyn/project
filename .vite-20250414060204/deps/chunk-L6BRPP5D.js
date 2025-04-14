import __buffer_polyfill from 'vite-plugin-node-polyfills/shims/buffer'
globalThis.Buffer = globalThis.Buffer || __buffer_polyfill
import __global_polyfill from 'vite-plugin-node-polyfills/shims/global'
globalThis.global = globalThis.global || __global_polyfill
import __process_polyfill from 'vite-plugin-node-polyfills/shims/process'
globalThis.process = globalThis.process || __process_polyfill

import {
  __commonJS,
  __toESM,
  require_dist,
  require_dist2,
  require_dist3
} from "./chunk-YJHZJMYG.js";

// node_modules/namespace-emitter/index.js
var require_namespace_emitter = __commonJS({
  "node_modules/namespace-emitter/index.js"(exports, module) {
    var import_dist64 = __toESM(require_dist());
    var import_dist65 = __toESM(require_dist2());
    var import_dist66 = __toESM(require_dist3());
    module.exports = function createNamespaceEmitter() {
      var emitter = {};
      var _fns = emitter._fns = {};
      emitter.emit = function emit(event, arg1, arg2, arg3, arg4, arg5, arg6) {
        var toEmit = getListeners(event);
        if (toEmit.length) {
          emitAll(event, toEmit, [arg1, arg2, arg3, arg4, arg5, arg6]);
        }
      };
      emitter.on = function on(event, fn) {
        if (!_fns[event]) {
          _fns[event] = [];
        }
        _fns[event].push(fn);
      };
      emitter.once = function once(event, fn) {
        function one() {
          fn.apply(this, arguments);
          emitter.off(event, one);
        }
        this.on(event, one);
      };
      emitter.off = function off(event, fn) {
        var keep = [];
        if (event && fn) {
          var fns = this._fns[event];
          var i2 = 0;
          var l2 = fns ? fns.length : 0;
          for (i2; i2 < l2; i2++) {
            if (fns[i2] !== fn) {
              keep.push(fns[i2]);
            }
          }
        }
        keep.length ? this._fns[event] = keep : delete this._fns[event];
      };
      function getListeners(e2) {
        var out = _fns[e2] ? _fns[e2] : [];
        var idx = e2.indexOf(":");
        var args = idx === -1 ? [e2] : [e2.substring(0, idx), e2.substring(idx + 1)];
        var keys = Object.keys(_fns);
        var i2 = 0;
        var l2 = keys.length;
        for (i2; i2 < l2; i2++) {
          var key = keys[i2];
          if (key === "*") {
            out = out.concat(_fns[key]);
          }
          if (args.length === 2 && args[0] === key) {
            out = out.concat(_fns[key]);
            break;
          }
        }
        return out;
      }
      function emitAll(e2, fns, args) {
        var i2 = 0;
        var l2 = fns.length;
        for (i2; i2 < l2; i2++) {
          if (!fns[i2]) break;
          fns[i2].event = e2;
          fns[i2].apply(fns[i2], args);
        }
      }
      return emitter;
    };
  }
});

// node_modules/lodash/isObject.js
var require_isObject = __commonJS({
  "node_modules/lodash/isObject.js"(exports, module) {
    var import_dist64 = __toESM(require_dist());
    var import_dist65 = __toESM(require_dist2());
    var import_dist66 = __toESM(require_dist3());
    function isObject(value) {
      var type = typeof value;
      return value != null && (type == "object" || type == "function");
    }
    module.exports = isObject;
  }
});

// node_modules/lodash/_freeGlobal.js
var require_freeGlobal = __commonJS({
  "node_modules/lodash/_freeGlobal.js"(exports, module) {
    var import_dist64 = __toESM(require_dist());
    var import_dist65 = __toESM(require_dist2());
    var import_dist66 = __toESM(require_dist3());
    var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
    module.exports = freeGlobal;
  }
});

// node_modules/lodash/_root.js
var require_root = __commonJS({
  "node_modules/lodash/_root.js"(exports, module) {
    var import_dist64 = __toESM(require_dist());
    var import_dist65 = __toESM(require_dist2());
    var import_dist66 = __toESM(require_dist3());
    var freeGlobal = require_freeGlobal();
    var freeSelf = typeof self == "object" && self && self.Object === Object && self;
    var root = freeGlobal || freeSelf || Function("return this")();
    module.exports = root;
  }
});

// node_modules/lodash/now.js
var require_now = __commonJS({
  "node_modules/lodash/now.js"(exports, module) {
    var import_dist64 = __toESM(require_dist());
    var import_dist65 = __toESM(require_dist2());
    var import_dist66 = __toESM(require_dist3());
    var root = require_root();
    var now = function() {
      return root.Date.now();
    };
    module.exports = now;
  }
});

// node_modules/lodash/_trimmedEndIndex.js
var require_trimmedEndIndex = __commonJS({
  "node_modules/lodash/_trimmedEndIndex.js"(exports, module) {
    var import_dist64 = __toESM(require_dist());
    var import_dist65 = __toESM(require_dist2());
    var import_dist66 = __toESM(require_dist3());
    var reWhitespace = /\s/;
    function trimmedEndIndex(string) {
      var index = string.length;
      while (index-- && reWhitespace.test(string.charAt(index))) {
      }
      return index;
    }
    module.exports = trimmedEndIndex;
  }
});

// node_modules/lodash/_baseTrim.js
var require_baseTrim = __commonJS({
  "node_modules/lodash/_baseTrim.js"(exports, module) {
    var import_dist64 = __toESM(require_dist());
    var import_dist65 = __toESM(require_dist2());
    var import_dist66 = __toESM(require_dist3());
    var trimmedEndIndex = require_trimmedEndIndex();
    var reTrimStart = /^\s+/;
    function baseTrim(string) {
      return string ? string.slice(0, trimmedEndIndex(string) + 1).replace(reTrimStart, "") : string;
    }
    module.exports = baseTrim;
  }
});

// node_modules/lodash/_Symbol.js
var require_Symbol = __commonJS({
  "node_modules/lodash/_Symbol.js"(exports, module) {
    var import_dist64 = __toESM(require_dist());
    var import_dist65 = __toESM(require_dist2());
    var import_dist66 = __toESM(require_dist3());
    var root = require_root();
    var Symbol2 = root.Symbol;
    module.exports = Symbol2;
  }
});

// node_modules/lodash/_getRawTag.js
var require_getRawTag = __commonJS({
  "node_modules/lodash/_getRawTag.js"(exports, module) {
    var import_dist64 = __toESM(require_dist());
    var import_dist65 = __toESM(require_dist2());
    var import_dist66 = __toESM(require_dist3());
    var Symbol2 = require_Symbol();
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var nativeObjectToString = objectProto.toString;
    var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
    function getRawTag(value) {
      var isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
      try {
        value[symToStringTag] = void 0;
        var unmasked = true;
      } catch (e2) {
      }
      var result = nativeObjectToString.call(value);
      if (unmasked) {
        if (isOwn) {
          value[symToStringTag] = tag;
        } else {
          delete value[symToStringTag];
        }
      }
      return result;
    }
    module.exports = getRawTag;
  }
});

// node_modules/lodash/_objectToString.js
var require_objectToString = __commonJS({
  "node_modules/lodash/_objectToString.js"(exports, module) {
    var import_dist64 = __toESM(require_dist());
    var import_dist65 = __toESM(require_dist2());
    var import_dist66 = __toESM(require_dist3());
    var objectProto = Object.prototype;
    var nativeObjectToString = objectProto.toString;
    function objectToString(value) {
      return nativeObjectToString.call(value);
    }
    module.exports = objectToString;
  }
});

// node_modules/lodash/_baseGetTag.js
var require_baseGetTag = __commonJS({
  "node_modules/lodash/_baseGetTag.js"(exports, module) {
    var import_dist64 = __toESM(require_dist());
    var import_dist65 = __toESM(require_dist2());
    var import_dist66 = __toESM(require_dist3());
    var Symbol2 = require_Symbol();
    var getRawTag = require_getRawTag();
    var objectToString = require_objectToString();
    var nullTag = "[object Null]";
    var undefinedTag = "[object Undefined]";
    var symToStringTag = Symbol2 ? Symbol2.toStringTag : void 0;
    function baseGetTag(value) {
      if (value == null) {
        return value === void 0 ? undefinedTag : nullTag;
      }
      return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
    }
    module.exports = baseGetTag;
  }
});

// node_modules/lodash/isObjectLike.js
var require_isObjectLike = __commonJS({
  "node_modules/lodash/isObjectLike.js"(exports, module) {
    var import_dist64 = __toESM(require_dist());
    var import_dist65 = __toESM(require_dist2());
    var import_dist66 = __toESM(require_dist3());
    function isObjectLike(value) {
      return value != null && typeof value == "object";
    }
    module.exports = isObjectLike;
  }
});

// node_modules/lodash/isSymbol.js
var require_isSymbol = __commonJS({
  "node_modules/lodash/isSymbol.js"(exports, module) {
    var import_dist64 = __toESM(require_dist());
    var import_dist65 = __toESM(require_dist2());
    var import_dist66 = __toESM(require_dist3());
    var baseGetTag = require_baseGetTag();
    var isObjectLike = require_isObjectLike();
    var symbolTag = "[object Symbol]";
    function isSymbol(value) {
      return typeof value == "symbol" || isObjectLike(value) && baseGetTag(value) == symbolTag;
    }
    module.exports = isSymbol;
  }
});

// node_modules/lodash/toNumber.js
var require_toNumber = __commonJS({
  "node_modules/lodash/toNumber.js"(exports, module) {
    var import_dist64 = __toESM(require_dist());
    var import_dist65 = __toESM(require_dist2());
    var import_dist66 = __toESM(require_dist3());
    var baseTrim = require_baseTrim();
    var isObject = require_isObject();
    var isSymbol = require_isSymbol();
    var NAN = 0 / 0;
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
    var reIsBinary = /^0b[01]+$/i;
    var reIsOctal = /^0o[0-7]+$/i;
    var freeParseInt = parseInt;
    function toNumber(value) {
      if (typeof value == "number") {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject(value)) {
        var other = typeof value.valueOf == "function" ? value.valueOf() : value;
        value = isObject(other) ? other + "" : other;
      }
      if (typeof value != "string") {
        return value === 0 ? value : +value;
      }
      value = baseTrim(value);
      var isBinary = reIsBinary.test(value);
      return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
    }
    module.exports = toNumber;
  }
});

// node_modules/lodash/debounce.js
var require_debounce = __commonJS({
  "node_modules/lodash/debounce.js"(exports, module) {
    var import_dist64 = __toESM(require_dist());
    var import_dist65 = __toESM(require_dist2());
    var import_dist66 = __toESM(require_dist3());
    var isObject = require_isObject();
    var now = require_now();
    var toNumber = require_toNumber();
    var FUNC_ERROR_TEXT = "Expected a function";
    var nativeMax = Math.max;
    var nativeMin = Math.min;
    function debounce2(func, wait, options) {
      var lastArgs, lastThis, maxWait, result, timerId, lastCallTime, lastInvokeTime = 0, leading = false, maxing = false, trailing = true;
      if (typeof func != "function") {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      wait = toNumber(wait) || 0;
      if (isObject(options)) {
        leading = !!options.leading;
        maxing = "maxWait" in options;
        maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
        trailing = "trailing" in options ? !!options.trailing : trailing;
      }
      function invokeFunc(time) {
        var args = lastArgs, thisArg = lastThis;
        lastArgs = lastThis = void 0;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
      }
      function leadingEdge(time) {
        lastInvokeTime = time;
        timerId = setTimeout(timerExpired, wait);
        return leading ? invokeFunc(time) : result;
      }
      function remainingWait(time) {
        var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime, timeWaiting = wait - timeSinceLastCall;
        return maxing ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
      }
      function shouldInvoke(time) {
        var timeSinceLastCall = time - lastCallTime, timeSinceLastInvoke = time - lastInvokeTime;
        return lastCallTime === void 0 || timeSinceLastCall >= wait || timeSinceLastCall < 0 || maxing && timeSinceLastInvoke >= maxWait;
      }
      function timerExpired() {
        var time = now();
        if (shouldInvoke(time)) {
          return trailingEdge(time);
        }
        timerId = setTimeout(timerExpired, remainingWait(time));
      }
      function trailingEdge(time) {
        timerId = void 0;
        if (trailing && lastArgs) {
          return invokeFunc(time);
        }
        lastArgs = lastThis = void 0;
        return result;
      }
      function cancel() {
        if (timerId !== void 0) {
          clearTimeout(timerId);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timerId = void 0;
      }
      function flush() {
        return timerId === void 0 ? result : trailingEdge(now());
      }
      function debounced() {
        var time = now(), isInvoking = shouldInvoke(time);
        lastArgs = arguments;
        lastThis = this;
        lastCallTime = time;
        if (isInvoking) {
          if (timerId === void 0) {
            return leadingEdge(lastCallTime);
          }
          if (maxing) {
            clearTimeout(timerId);
            timerId = setTimeout(timerExpired, wait);
            return invokeFunc(lastCallTime);
          }
        }
        if (timerId === void 0) {
          timerId = setTimeout(timerExpired, wait);
        }
        return result;
      }
      debounced.cancel = cancel;
      debounced.flush = flush;
      return debounced;
    }
    module.exports = debounce2;
  }
});

// node_modules/lodash/throttle.js
var require_throttle = __commonJS({
  "node_modules/lodash/throttle.js"(exports, module) {
    var import_dist64 = __toESM(require_dist());
    var import_dist65 = __toESM(require_dist2());
    var import_dist66 = __toESM(require_dist3());
    var debounce2 = require_debounce();
    var isObject = require_isObject();
    var FUNC_ERROR_TEXT = "Expected a function";
    function throttle2(func, wait, options) {
      var leading = true, trailing = true;
      if (typeof func != "function") {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      if (isObject(options)) {
        leading = "leading" in options ? !!options.leading : leading;
        trailing = "trailing" in options ? !!options.trailing : trailing;
      }
      return debounce2(func, wait, {
        "leading": leading,
        "maxWait": wait,
        "trailing": trailing
      });
    }
    module.exports = throttle2;
  }
});

// node_modules/@transloadit/prettier-bytes/dist/prettierBytes.js
var require_prettierBytes = __commonJS({
  "node_modules/@transloadit/prettier-bytes/dist/prettierBytes.js"(exports, module) {
    "use strict";
    var import_dist64 = __toESM(require_dist());
    var import_dist65 = __toESM(require_dist2());
    var import_dist66 = __toESM(require_dist3());
    module.exports = function prettierBytes2(input) {
      if (typeof input !== "number" || Number.isNaN(input)) {
        throw new TypeError(`Expected a number, got ${typeof input}`);
      }
      const neg = input < 0;
      let num = Math.abs(input);
      if (neg) {
        num = -num;
      }
      if (num === 0) {
        return "0 B";
      }
      const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
      const exponent = Math.min(Math.floor(Math.log(num) / Math.log(1024)), units.length - 1);
      const value = Number(num / 1024 ** exponent);
      const unit = units[exponent];
      return `${value >= 10 || value % 1 === 0 ? Math.round(value) : value.toFixed(1)} ${unit}`;
    };
  }
});

// node_modules/wildcard/index.js
var require_wildcard = __commonJS({
  "node_modules/wildcard/index.js"(exports, module) {
    "use strict";
    var import_dist64 = __toESM(require_dist());
    var import_dist65 = __toESM(require_dist2());
    var import_dist66 = __toESM(require_dist3());
    function WildcardMatcher(text, separator) {
      this.text = text = text || "";
      this.hasWild = ~text.indexOf("*");
      this.separator = separator;
      this.parts = text.split(separator);
    }
    WildcardMatcher.prototype.match = function(input) {
      var matches = true;
      var parts = this.parts;
      var ii;
      var partsCount = parts.length;
      var testParts;
      if (typeof input == "string" || input instanceof String) {
        if (!this.hasWild && this.text != input) {
          matches = false;
        } else {
          testParts = (input || "").split(this.separator);
          for (ii = 0; matches && ii < partsCount; ii++) {
            if (parts[ii] === "*") {
              continue;
            } else if (ii < testParts.length) {
              matches = parts[ii] === testParts[ii];
            } else {
              matches = false;
            }
          }
          matches = matches && testParts;
        }
      } else if (typeof input.splice == "function") {
        matches = [];
        for (ii = input.length; ii--; ) {
          if (this.match(input[ii])) {
            matches[matches.length] = input[ii];
          }
        }
      } else if (typeof input == "object") {
        matches = {};
        for (var key in input) {
          if (this.match(key)) {
            matches[key] = input[key];
          }
        }
      }
      return matches;
    };
    module.exports = function(text, test, separator) {
      var matcher = new WildcardMatcher(text, separator || /[\/\.]/);
      if (typeof test != "undefined") {
        return matcher.match(test);
      }
      return matcher;
    };
  }
});

// node_modules/mime-match/index.js
var require_mime_match = __commonJS({
  "node_modules/mime-match/index.js"(exports, module) {
    var import_dist64 = __toESM(require_dist());
    var import_dist65 = __toESM(require_dist2());
    var import_dist66 = __toESM(require_dist3());
    var wildcard = require_wildcard();
    var reMimePartSplit = /[\/\+\.]/;
    module.exports = function(target, pattern) {
      function test(pattern2) {
        var result = wildcard(pattern2, target, reMimePartSplit);
        return result && result.length >= 2;
      }
      return pattern ? test(pattern.split(";")[0]) : test;
    };
  }
});

// node_modules/@uppy/core/lib/index.js
var import_dist61 = __toESM(require_dist());
var import_dist62 = __toESM(require_dist2());
var import_dist63 = __toESM(require_dist3());

// node_modules/@uppy/core/lib/Uppy.js
var import_dist40 = __toESM(require_dist(), 1);
var import_dist41 = __toESM(require_dist2(), 1);
var import_dist42 = __toESM(require_dist3(), 1);

// node_modules/@uppy/utils/lib/Translator.js
var import_dist = __toESM(require_dist());
var import_dist2 = __toESM(require_dist2());
var import_dist3 = __toESM(require_dist3());
function _classPrivateFieldLooseBase(e2, t2) {
  if (!{}.hasOwnProperty.call(e2, t2)) throw new TypeError("attempted to use private field on non-instance");
  return e2;
}
var id = 0;
function _classPrivateFieldLooseKey(e2) {
  return "__private_" + id++ + "_" + e2;
}
function insertReplacement(source, rx, replacement) {
  const newParts = [];
  source.forEach((chunk) => {
    if (typeof chunk !== "string") {
      return newParts.push(chunk);
    }
    return rx[Symbol.split](chunk).forEach((raw, i2, list) => {
      if (raw !== "") {
        newParts.push(raw);
      }
      if (i2 < list.length - 1) {
        newParts.push(replacement);
      }
    });
  });
  return newParts;
}
function interpolate(phrase, options) {
  const dollarRegex = /\$/g;
  const dollarBillsYall = "$$$$";
  let interpolated = [phrase];
  if (options == null) return interpolated;
  for (const arg of Object.keys(options)) {
    if (arg !== "_") {
      let replacement = options[arg];
      if (typeof replacement === "string") {
        replacement = dollarRegex[Symbol.replace](replacement, dollarBillsYall);
      }
      interpolated = insertReplacement(interpolated, new RegExp(`%\\{${arg}\\}`, "g"), replacement);
    }
  }
  return interpolated;
}
var defaultOnMissingKey = (key) => {
  throw new Error(`missing string: ${key}`);
};
var _onMissingKey = _classPrivateFieldLooseKey("onMissingKey");
var _apply = _classPrivateFieldLooseKey("apply");
var Translator = class {
  constructor(locales, _temp) {
    let {
      onMissingKey = defaultOnMissingKey
    } = _temp === void 0 ? {} : _temp;
    Object.defineProperty(this, _apply, {
      value: _apply2
    });
    Object.defineProperty(this, _onMissingKey, {
      writable: true,
      value: void 0
    });
    this.locale = {
      strings: {},
      pluralize(n2) {
        if (n2 === 1) {
          return 0;
        }
        return 1;
      }
    };
    if (Array.isArray(locales)) {
      locales.forEach(_classPrivateFieldLooseBase(this, _apply)[_apply], this);
    } else {
      _classPrivateFieldLooseBase(this, _apply)[_apply](locales);
    }
    _classPrivateFieldLooseBase(this, _onMissingKey)[_onMissingKey] = onMissingKey;
  }
  /**
   * Public translate method
   *
   * @param key
   * @param options with values that will be used later to replace placeholders in string
   * @returns string translated (and interpolated)
   */
  translate(key, options) {
    return this.translateArray(key, options).join("");
  }
  /**
   * Get a translation and return the translated and interpolated parts as an array.
   *
   * @returns The translated and interpolated parts, in order.
   */
  translateArray(key, options) {
    let string = this.locale.strings[key];
    if (string == null) {
      _classPrivateFieldLooseBase(this, _onMissingKey)[_onMissingKey](key);
      string = key;
    }
    const hasPluralForms = typeof string === "object";
    if (hasPluralForms) {
      if (options && typeof options.smart_count !== "undefined") {
        const plural = this.locale.pluralize(options.smart_count);
        return interpolate(string[plural], options);
      }
      throw new Error("Attempted to use a string with plural forms, but no value was given for %{smart_count}");
    }
    if (typeof string !== "string") {
      throw new Error(`string was not a string`);
    }
    return interpolate(string, options);
  }
};
function _apply2(locale) {
  if (!(locale != null && locale.strings)) {
    return;
  }
  const prevLocale = this.locale;
  Object.assign(this.locale, {
    strings: {
      ...prevLocale.strings,
      ...locale.strings
    },
    pluralize: locale.pluralize || prevLocale.pluralize
  });
}

// node_modules/@uppy/core/lib/Uppy.js
var import_namespace_emitter = __toESM(require_namespace_emitter(), 1);

// node_modules/@uppy/core/node_modules/nanoid/non-secure/index.js
var import_dist4 = __toESM(require_dist());
var import_dist5 = __toESM(require_dist2());
var import_dist6 = __toESM(require_dist3());
var urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
var nanoid = (size = 21) => {
  let id5 = "";
  let i2 = size | 0;
  while (i2--) {
    id5 += urlAlphabet[Math.random() * 64 | 0];
  }
  return id5;
};

// node_modules/@uppy/core/lib/Uppy.js
var import_throttle = __toESM(require_throttle(), 1);

// node_modules/@uppy/store-default/lib/index.js
var import_dist7 = __toESM(require_dist());
var import_dist8 = __toESM(require_dist2());
var import_dist9 = __toESM(require_dist3());
function _classPrivateFieldLooseBase2(e2, t2) {
  if (!{}.hasOwnProperty.call(e2, t2)) throw new TypeError("attempted to use private field on non-instance");
  return e2;
}
var id2 = 0;
function _classPrivateFieldLooseKey2(e2) {
  return "__private_" + id2++ + "_" + e2;
}
var packageJson = {
  "version": "4.2.0"
};
var _callbacks = _classPrivateFieldLooseKey2("callbacks");
var _publish = _classPrivateFieldLooseKey2("publish");
var DefaultStore = class {
  constructor() {
    Object.defineProperty(this, _publish, {
      value: _publish2
    });
    this.state = {};
    Object.defineProperty(this, _callbacks, {
      writable: true,
      value: /* @__PURE__ */ new Set()
    });
  }
  getState() {
    return this.state;
  }
  setState(patch) {
    const prevState = {
      ...this.state
    };
    const nextState = {
      ...this.state,
      ...patch
    };
    this.state = nextState;
    _classPrivateFieldLooseBase2(this, _publish)[_publish](prevState, nextState, patch);
  }
  subscribe(listener) {
    _classPrivateFieldLooseBase2(this, _callbacks)[_callbacks].add(listener);
    return () => {
      _classPrivateFieldLooseBase2(this, _callbacks)[_callbacks].delete(listener);
    };
  }
};
function _publish2() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }
  _classPrivateFieldLooseBase2(this, _callbacks)[_callbacks].forEach((listener) => {
    listener(...args);
  });
}
DefaultStore.VERSION = packageJson.version;
var lib_default = DefaultStore;

// node_modules/@uppy/utils/lib/getFileType.js
var import_dist16 = __toESM(require_dist());
var import_dist17 = __toESM(require_dist2());
var import_dist18 = __toESM(require_dist3());

// node_modules/@uppy/utils/lib/getFileNameAndExtension.js
var import_dist10 = __toESM(require_dist());
var import_dist11 = __toESM(require_dist2());
var import_dist12 = __toESM(require_dist3());
function getFileNameAndExtension(fullFileName) {
  const lastDot = fullFileName.lastIndexOf(".");
  if (lastDot === -1 || lastDot === fullFileName.length - 1) {
    return {
      name: fullFileName,
      extension: void 0
    };
  }
  return {
    name: fullFileName.slice(0, lastDot),
    extension: fullFileName.slice(lastDot + 1)
  };
}

// node_modules/@uppy/utils/lib/mimeTypes.js
var import_dist13 = __toESM(require_dist());
var import_dist14 = __toESM(require_dist2());
var import_dist15 = __toESM(require_dist3());
var mimeTypes_default = {
  __proto__: null,
  md: "text/markdown",
  markdown: "text/markdown",
  mp4: "video/mp4",
  mp3: "audio/mp3",
  svg: "image/svg+xml",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  yaml: "text/yaml",
  yml: "text/yaml",
  csv: "text/csv",
  tsv: "text/tab-separated-values",
  tab: "text/tab-separated-values",
  avi: "video/x-msvideo",
  mks: "video/x-matroska",
  mkv: "video/x-matroska",
  mov: "video/quicktime",
  dicom: "application/dicom",
  doc: "application/msword",
  msg: "application/vnd.ms-outlook",
  docm: "application/vnd.ms-word.document.macroenabled.12",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  dot: "application/msword",
  dotm: "application/vnd.ms-word.template.macroenabled.12",
  dotx: "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
  xla: "application/vnd.ms-excel",
  xlam: "application/vnd.ms-excel.addin.macroenabled.12",
  xlc: "application/vnd.ms-excel",
  xlf: "application/x-xliff+xml",
  xlm: "application/vnd.ms-excel",
  xls: "application/vnd.ms-excel",
  xlsb: "application/vnd.ms-excel.sheet.binary.macroenabled.12",
  xlsm: "application/vnd.ms-excel.sheet.macroenabled.12",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xlt: "application/vnd.ms-excel",
  xltm: "application/vnd.ms-excel.template.macroenabled.12",
  xltx: "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
  xlw: "application/vnd.ms-excel",
  txt: "text/plain",
  text: "text/plain",
  conf: "text/plain",
  log: "text/plain",
  pdf: "application/pdf",
  zip: "application/zip",
  "7z": "application/x-7z-compressed",
  rar: "application/x-rar-compressed",
  tar: "application/x-tar",
  gz: "application/gzip",
  dmg: "application/x-apple-diskimage"
};

// node_modules/@uppy/utils/lib/getFileType.js
function getFileType(file) {
  var _getFileNameAndExtens;
  if (file.type) return file.type;
  const fileExtension = file.name ? (_getFileNameAndExtens = getFileNameAndExtension(file.name).extension) == null ? void 0 : _getFileNameAndExtens.toLowerCase() : null;
  if (fileExtension && fileExtension in mimeTypes_default) {
    return mimeTypes_default[fileExtension];
  }
  return "application/octet-stream";
}

// node_modules/@uppy/utils/lib/generateFileID.js
var import_dist19 = __toESM(require_dist());
var import_dist20 = __toESM(require_dist2());
var import_dist21 = __toESM(require_dist3());
function encodeCharacter(character) {
  return character.charCodeAt(0).toString(32);
}
function encodeFilename(name) {
  let suffix = "";
  return name.replace(/[^A-Z0-9]/gi, (character) => {
    suffix += `-${encodeCharacter(character)}`;
    return "/";
  }) + suffix;
}
function generateFileID(file, instanceId) {
  let id5 = instanceId || "uppy";
  if (typeof file.name === "string") {
    id5 += `-${encodeFilename(file.name.toLowerCase())}`;
  }
  if (file.type !== void 0) {
    id5 += `-${file.type}`;
  }
  if (file.meta && typeof file.meta.relativePath === "string") {
    id5 += `-${encodeFilename(file.meta.relativePath.toLowerCase())}`;
  }
  if (file.data.size !== void 0) {
    id5 += `-${file.data.size}`;
  }
  if (file.data.lastModified !== void 0) {
    id5 += `-${file.data.lastModified}`;
  }
  return id5;
}
function hasFileStableId(file) {
  if (!file.isRemote || !file.remote) return false;
  const stableIdProviders = /* @__PURE__ */ new Set(["box", "dropbox", "drive", "facebook", "unsplash"]);
  return stableIdProviders.has(file.remote.provider);
}
function getSafeFileId(file, instanceId) {
  if (hasFileStableId(file)) return file.id;
  const fileType = getFileType(file);
  return generateFileID({
    ...file,
    type: fileType
  }, instanceId);
}

// node_modules/@uppy/core/lib/supportsUploadProgress.js
var import_dist22 = __toESM(require_dist(), 1);
var import_dist23 = __toESM(require_dist2(), 1);
var import_dist24 = __toESM(require_dist3(), 1);
function supportsUploadProgress(userAgent) {
  if (userAgent == null && typeof navigator !== "undefined") {
    userAgent = navigator.userAgent;
  }
  if (!userAgent) return true;
  const m2 = /Edge\/(\d+\.\d+)/.exec(userAgent);
  if (!m2) return true;
  const edgeVersion = m2[1];
  const version = edgeVersion.split(".", 2);
  const major = parseInt(version[0], 10);
  const minor = parseInt(version[1], 10);
  if (major < 15 || major === 15 && minor < 15063) {
    return true;
  }
  if (major > 18 || major === 18 && minor >= 18218) {
    return true;
  }
  return false;
}

// node_modules/@uppy/core/lib/getFileName.js
var import_dist25 = __toESM(require_dist(), 1);
var import_dist26 = __toESM(require_dist2(), 1);
var import_dist27 = __toESM(require_dist3(), 1);
function getFileName(fileType, fileDescriptor) {
  if (fileDescriptor.name) {
    return fileDescriptor.name;
  }
  if (fileType.split("/")[0] === "image") {
    return `${fileType.split("/")[0]}.${fileType.split("/")[1]}`;
  }
  return "noname";
}

// node_modules/@uppy/core/lib/loggers.js
var import_dist31 = __toESM(require_dist(), 1);
var import_dist32 = __toESM(require_dist2(), 1);
var import_dist33 = __toESM(require_dist3(), 1);

// node_modules/@uppy/utils/lib/getTimeStamp.js
var import_dist28 = __toESM(require_dist());
var import_dist29 = __toESM(require_dist2());
var import_dist30 = __toESM(require_dist3());
function pad(number) {
  return number < 10 ? `0${number}` : number.toString();
}
function getTimeStamp() {
  const date = /* @__PURE__ */ new Date();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${hours}:${minutes}:${seconds}`;
}

// node_modules/@uppy/core/lib/loggers.js
var justErrorsLogger = {
  debug: () => {
  },
  warn: () => {
  },
  error: function() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    return console.error(`[Uppy] [${getTimeStamp()}]`, ...args);
  }
};
var debugLogger = {
  debug: function() {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }
    return console.debug(`[Uppy] [${getTimeStamp()}]`, ...args);
  },
  warn: function() {
    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }
    return console.warn(`[Uppy] [${getTimeStamp()}]`, ...args);
  },
  error: function() {
    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }
    return console.error(`[Uppy] [${getTimeStamp()}]`, ...args);
  }
};

// node_modules/@uppy/core/lib/Restricter.js
var import_dist34 = __toESM(require_dist(), 1);
var import_dist35 = __toESM(require_dist2(), 1);
var import_dist36 = __toESM(require_dist3(), 1);
var import_prettier_bytes = __toESM(require_prettierBytes(), 1);
var import_mime_match = __toESM(require_mime_match(), 1);
var defaultOptions = {
  maxFileSize: null,
  minFileSize: null,
  maxTotalFileSize: null,
  maxNumberOfFiles: null,
  minNumberOfFiles: null,
  allowedFileTypes: null,
  requiredMetaFields: []
};
var RestrictionError = class extends Error {
  constructor(message, opts) {
    var _opts$isUserFacing;
    super(message);
    this.isRestriction = true;
    this.isUserFacing = (_opts$isUserFacing = opts == null ? void 0 : opts.isUserFacing) != null ? _opts$isUserFacing : true;
    if (opts != null && opts.file) {
      this.file = opts.file;
    }
  }
};
var Restricter = class {
  constructor(getOpts, getI18n) {
    this.getI18n = getI18n;
    this.getOpts = () => {
      var _opts$restrictions;
      const opts = getOpts();
      if (((_opts$restrictions = opts.restrictions) == null ? void 0 : _opts$restrictions.allowedFileTypes) != null && !Array.isArray(opts.restrictions.allowedFileTypes)) {
        throw new TypeError("`restrictions.allowedFileTypes` must be an array");
      }
      return opts;
    };
  }
  // Because these operations are slow, we cannot run them for every file (if we are adding multiple files)
  validateAggregateRestrictions(existingFiles, addingFiles) {
    const {
      maxTotalFileSize,
      maxNumberOfFiles
    } = this.getOpts().restrictions;
    if (maxNumberOfFiles) {
      const nonGhostFiles = existingFiles.filter((f2) => !f2.isGhost);
      if (nonGhostFiles.length + addingFiles.length > maxNumberOfFiles) {
        throw new RestrictionError(`${this.getI18n()("youCanOnlyUploadX", {
          smart_count: maxNumberOfFiles
        })}`);
      }
    }
    if (maxTotalFileSize) {
      const totalFilesSize = [...existingFiles, ...addingFiles].reduce((total, f2) => {
        var _f$size;
        return total + ((_f$size = f2.size) != null ? _f$size : 0);
      }, 0);
      if (totalFilesSize > maxTotalFileSize) {
        throw new RestrictionError(this.getI18n()("aggregateExceedsSize", {
          sizeAllowed: (0, import_prettier_bytes.default)(maxTotalFileSize),
          size: (0, import_prettier_bytes.default)(totalFilesSize)
        }));
      }
    }
  }
  validateSingleFile(file) {
    const {
      maxFileSize,
      minFileSize,
      allowedFileTypes
    } = this.getOpts().restrictions;
    if (allowedFileTypes) {
      const isCorrectFileType = allowedFileTypes.some((type) => {
        if (type.includes("/")) {
          if (!file.type) return false;
          return (0, import_mime_match.default)(file.type.replace(/;.*?$/, ""), type);
        }
        if (type[0] === "." && file.extension) {
          return file.extension.toLowerCase() === type.slice(1).toLowerCase();
        }
        return false;
      });
      if (!isCorrectFileType) {
        const allowedFileTypesString = allowedFileTypes.join(", ");
        throw new RestrictionError(this.getI18n()("youCanOnlyUploadFileTypes", {
          types: allowedFileTypesString
        }), {
          file
        });
      }
    }
    if (maxFileSize && file.size != null && file.size > maxFileSize) {
      var _file$name;
      throw new RestrictionError(this.getI18n()("exceedsSize", {
        size: (0, import_prettier_bytes.default)(maxFileSize),
        file: (_file$name = file.name) != null ? _file$name : this.getI18n()("unnamed")
      }), {
        file
      });
    }
    if (minFileSize && file.size != null && file.size < minFileSize) {
      throw new RestrictionError(this.getI18n()("inferiorSize", {
        size: (0, import_prettier_bytes.default)(minFileSize)
      }), {
        file
      });
    }
  }
  validate(existingFiles, addingFiles) {
    addingFiles.forEach((addingFile) => {
      this.validateSingleFile(addingFile);
    });
    this.validateAggregateRestrictions(existingFiles, addingFiles);
  }
  validateMinNumberOfFiles(files) {
    const {
      minNumberOfFiles
    } = this.getOpts().restrictions;
    if (minNumberOfFiles && Object.keys(files).length < minNumberOfFiles) {
      throw new RestrictionError(this.getI18n()("youHaveToAtLeastSelectX", {
        smart_count: minNumberOfFiles
      }));
    }
  }
  getMissingRequiredMetaFields(file) {
    var _file$name2;
    const error = new RestrictionError(this.getI18n()("missingRequiredMetaFieldOnFile", {
      fileName: (_file$name2 = file.name) != null ? _file$name2 : this.getI18n()("unnamed")
    }));
    const {
      requiredMetaFields
    } = this.getOpts().restrictions;
    const missingFields = [];
    for (const field of requiredMetaFields) {
      if (!Object.hasOwn(file.meta, field) || file.meta[field] === "") {
        missingFields.push(field);
      }
    }
    return {
      missingFields,
      error
    };
  }
};

// node_modules/@uppy/core/lib/locale.js
var import_dist37 = __toESM(require_dist(), 1);
var import_dist38 = __toESM(require_dist2(), 1);
var import_dist39 = __toESM(require_dist3(), 1);
var locale_default = {
  strings: {
    addBulkFilesFailed: {
      0: "Failed to add %{smart_count} file due to an internal error",
      1: "Failed to add %{smart_count} files due to internal errors"
    },
    youCanOnlyUploadX: {
      0: "You can only upload %{smart_count} file",
      1: "You can only upload %{smart_count} files"
    },
    youHaveToAtLeastSelectX: {
      0: "You have to select at least %{smart_count} file",
      1: "You have to select at least %{smart_count} files"
    },
    aggregateExceedsSize: "You selected %{size} of files, but maximum allowed size is %{sizeAllowed}",
    exceedsSize: "%{file} exceeds maximum allowed size of %{size}",
    missingRequiredMetaField: "Missing required meta fields",
    missingRequiredMetaFieldOnFile: "Missing required meta fields in %{fileName}",
    inferiorSize: "This file is smaller than the allowed size of %{size}",
    youCanOnlyUploadFileTypes: "You can only upload: %{types}",
    noMoreFilesAllowed: "Cannot add more files",
    noDuplicates: "Cannot add the duplicate file '%{fileName}', it already exists",
    companionError: "Connection with Companion failed",
    authAborted: "Authentication aborted",
    companionUnauthorizeHint: "To unauthorize to your %{provider} account, please go to %{url}",
    failedToUpload: "Failed to upload %{file}",
    noInternetConnection: "No Internet connection",
    connectedToInternet: "Connected to the Internet",
    // Strings for remote providers
    noFilesFound: "You have no files or folders here",
    noSearchResults: "Unfortunately, there are no results for this search",
    selectX: {
      0: "Select %{smart_count}",
      1: "Select %{smart_count}"
    },
    allFilesFromFolderNamed: "All files from folder %{name}",
    openFolderNamed: "Open folder %{name}",
    cancel: "Cancel",
    logOut: "Log out",
    logIn: "Log in",
    pickFiles: "Pick files",
    pickPhotos: "Pick photos",
    filter: "Filter",
    resetFilter: "Reset filter",
    loading: "Loading...",
    loadedXFiles: "Loaded %{numFiles} files",
    authenticateWithTitle: "Please authenticate with %{pluginName} to select files",
    authenticateWith: "Connect to %{pluginName}",
    signInWithGoogle: "Sign in with Google",
    searchImages: "Search for images",
    enterTextToSearch: "Enter text to search for images",
    search: "Search",
    resetSearch: "Reset search",
    emptyFolderAdded: "No files were added from empty folder",
    addedNumFiles: "Added %{numFiles} file(s)",
    folderAlreadyAdded: 'The folder "%{folder}" was already added',
    folderAdded: {
      0: "Added %{smart_count} file from %{folder}",
      1: "Added %{smart_count} files from %{folder}"
    },
    additionalRestrictionsFailed: "%{count} additional restrictions were not fulfilled",
    unnamed: "Unnamed",
    pleaseWait: "Please wait"
  }
};

// node_modules/@uppy/core/lib/Uppy.js
function _classPrivateFieldLooseBase3(e2, t2) {
  if (!{}.hasOwnProperty.call(e2, t2)) throw new TypeError("attempted to use private field on non-instance");
  return e2;
}
var id3 = 0;
function _classPrivateFieldLooseKey3(e2) {
  return "__private_" + id3++ + "_" + e2;
}
var packageJson2 = {
  "version": "4.4.4"
};
var defaultUploadState = {
  totalProgress: 0,
  allowNewUpload: true,
  error: null,
  recoveredState: null
};
var _plugins = _classPrivateFieldLooseKey3("plugins");
var _restricter = _classPrivateFieldLooseKey3("restricter");
var _storeUnsubscribe = _classPrivateFieldLooseKey3("storeUnsubscribe");
var _emitter = _classPrivateFieldLooseKey3("emitter");
var _preProcessors = _classPrivateFieldLooseKey3("preProcessors");
var _uploaders = _classPrivateFieldLooseKey3("uploaders");
var _postProcessors = _classPrivateFieldLooseKey3("postProcessors");
var _informAndEmit = _classPrivateFieldLooseKey3("informAndEmit");
var _checkRequiredMetaFieldsOnFile = _classPrivateFieldLooseKey3("checkRequiredMetaFieldsOnFile");
var _checkRequiredMetaFields = _classPrivateFieldLooseKey3("checkRequiredMetaFields");
var _assertNewUploadAllowed = _classPrivateFieldLooseKey3("assertNewUploadAllowed");
var _transformFile = _classPrivateFieldLooseKey3("transformFile");
var _startIfAutoProceed = _classPrivateFieldLooseKey3("startIfAutoProceed");
var _checkAndUpdateFileState = _classPrivateFieldLooseKey3("checkAndUpdateFileState");
var _getFilesToRetry = _classPrivateFieldLooseKey3("getFilesToRetry");
var _doRetryAll = _classPrivateFieldLooseKey3("doRetryAll");
var _handleUploadProgress = _classPrivateFieldLooseKey3("handleUploadProgress");
var _updateTotalProgress = _classPrivateFieldLooseKey3("updateTotalProgress");
var _updateTotalProgressThrottled = _classPrivateFieldLooseKey3("updateTotalProgressThrottled");
var _calculateTotalProgress = _classPrivateFieldLooseKey3("calculateTotalProgress");
var _addListeners = _classPrivateFieldLooseKey3("addListeners");
var _updateOnlineStatus = _classPrivateFieldLooseKey3("updateOnlineStatus");
var _requestClientById = _classPrivateFieldLooseKey3("requestClientById");
var _createUpload = _classPrivateFieldLooseKey3("createUpload");
var _getUpload = _classPrivateFieldLooseKey3("getUpload");
var _removeUpload = _classPrivateFieldLooseKey3("removeUpload");
var _runUpload = _classPrivateFieldLooseKey3("runUpload");
var Uppy = class _Uppy {
  /**
   * Instantiate Uppy
   */
  constructor(_opts) {
    Object.defineProperty(this, _runUpload, {
      value: _runUpload2
    });
    Object.defineProperty(this, _removeUpload, {
      value: _removeUpload2
    });
    Object.defineProperty(this, _getUpload, {
      value: _getUpload2
    });
    Object.defineProperty(this, _createUpload, {
      value: _createUpload2
    });
    Object.defineProperty(this, _addListeners, {
      value: _addListeners2
    });
    Object.defineProperty(this, _calculateTotalProgress, {
      value: _calculateTotalProgress2
    });
    Object.defineProperty(this, _updateTotalProgress, {
      value: _updateTotalProgress2
    });
    Object.defineProperty(this, _doRetryAll, {
      value: _doRetryAll2
    });
    Object.defineProperty(this, _getFilesToRetry, {
      value: _getFilesToRetry2
    });
    Object.defineProperty(this, _checkAndUpdateFileState, {
      value: _checkAndUpdateFileState2
    });
    Object.defineProperty(this, _startIfAutoProceed, {
      value: _startIfAutoProceed2
    });
    Object.defineProperty(this, _transformFile, {
      value: _transformFile2
    });
    Object.defineProperty(this, _assertNewUploadAllowed, {
      value: _assertNewUploadAllowed2
    });
    Object.defineProperty(this, _checkRequiredMetaFields, {
      value: _checkRequiredMetaFields2
    });
    Object.defineProperty(this, _checkRequiredMetaFieldsOnFile, {
      value: _checkRequiredMetaFieldsOnFile2
    });
    Object.defineProperty(this, _informAndEmit, {
      value: _informAndEmit2
    });
    Object.defineProperty(this, _plugins, {
      writable: true,
      value: /* @__PURE__ */ Object.create(null)
    });
    Object.defineProperty(this, _restricter, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _storeUnsubscribe, {
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, _emitter, {
      writable: true,
      value: (0, import_namespace_emitter.default)()
    });
    Object.defineProperty(this, _preProcessors, {
      writable: true,
      value: /* @__PURE__ */ new Set()
    });
    Object.defineProperty(this, _uploaders, {
      writable: true,
      value: /* @__PURE__ */ new Set()
    });
    Object.defineProperty(this, _postProcessors, {
      writable: true,
      value: /* @__PURE__ */ new Set()
    });
    this.scheduledAutoProceed = null;
    this.wasOffline = false;
    Object.defineProperty(this, _handleUploadProgress, {
      writable: true,
      value: (file, progress) => {
        const fileInState = file ? this.getFile(file.id) : void 0;
        if (file == null || !fileInState) {
          this.log(`Not setting progress for a file that has been removed: ${file == null ? void 0 : file.id}`);
          return;
        }
        if (fileInState.progress.percentage === 100) {
          this.log(`Not setting progress for a file that has been already uploaded: ${file.id}`);
          return;
        }
        const newProgress = {
          bytesTotal: progress.bytesTotal,
          // bytesTotal may be null or zero; in that case we can't divide by it
          percentage: progress.bytesTotal != null && Number.isFinite(progress.bytesTotal) && progress.bytesTotal > 0 ? Math.round(progress.bytesUploaded / progress.bytesTotal * 100) : void 0
        };
        if (fileInState.progress.uploadStarted != null) {
          this.setFileState(file.id, {
            progress: {
              ...fileInState.progress,
              ...newProgress,
              bytesUploaded: progress.bytesUploaded
            }
          });
        } else {
          this.setFileState(file.id, {
            progress: {
              ...fileInState.progress,
              ...newProgress
            }
          });
        }
        _classPrivateFieldLooseBase3(this, _updateTotalProgressThrottled)[_updateTotalProgressThrottled]();
      }
    });
    Object.defineProperty(this, _updateTotalProgressThrottled, {
      writable: true,
      value: (0, import_throttle.default)(() => _classPrivateFieldLooseBase3(this, _updateTotalProgress)[_updateTotalProgress](), 500, {
        leading: true,
        trailing: true
      })
    });
    Object.defineProperty(this, _updateOnlineStatus, {
      writable: true,
      value: this.updateOnlineStatus.bind(this)
    });
    Object.defineProperty(this, _requestClientById, {
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    this.defaultLocale = locale_default;
    const defaultOptions2 = {
      id: "uppy",
      autoProceed: false,
      allowMultipleUploadBatches: true,
      debug: false,
      restrictions: defaultOptions,
      meta: {},
      onBeforeFileAdded: (file, files) => !Object.hasOwn(files, file.id),
      onBeforeUpload: (files) => files,
      store: new lib_default(),
      logger: justErrorsLogger,
      infoTimeout: 5e3
    };
    const merged = {
      ...defaultOptions2,
      ..._opts
    };
    this.opts = {
      ...merged,
      restrictions: {
        ...defaultOptions2.restrictions,
        ..._opts && _opts.restrictions
      }
    };
    if (_opts && _opts.logger && _opts.debug) {
      this.log("You are using a custom `logger`, but also set `debug: true`, which uses built-in logger to output logs to console. Ignoring `debug: true` and using your custom `logger`.", "warning");
    } else if (_opts && _opts.debug) {
      this.opts.logger = debugLogger;
    }
    this.log(`Using Core v${_Uppy.VERSION}`);
    this.i18nInit();
    this.store = this.opts.store;
    this.setState({
      ...defaultUploadState,
      plugins: {},
      files: {},
      currentUploads: {},
      capabilities: {
        uploadProgress: supportsUploadProgress(),
        individualCancellation: true,
        resumableUploads: false
      },
      meta: {
        ...this.opts.meta
      },
      info: []
    });
    _classPrivateFieldLooseBase3(this, _restricter)[_restricter] = new Restricter(() => this.opts, () => this.i18n);
    _classPrivateFieldLooseBase3(this, _storeUnsubscribe)[_storeUnsubscribe] = this.store.subscribe((prevState, nextState, patch) => {
      this.emit("state-update", prevState, nextState, patch);
      this.updateAll(nextState);
    });
    if (this.opts.debug && typeof window !== "undefined") {
      window[this.opts.id] = this;
    }
    _classPrivateFieldLooseBase3(this, _addListeners)[_addListeners]();
  }
  emit(event) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
    _classPrivateFieldLooseBase3(this, _emitter)[_emitter].emit(event, ...args);
  }
  on(event, callback) {
    _classPrivateFieldLooseBase3(this, _emitter)[_emitter].on(event, callback);
    return this;
  }
  once(event, callback) {
    _classPrivateFieldLooseBase3(this, _emitter)[_emitter].once(event, callback);
    return this;
  }
  off(event, callback) {
    _classPrivateFieldLooseBase3(this, _emitter)[_emitter].off(event, callback);
    return this;
  }
  /**
   * Iterate on all plugins and run `update` on them.
   * Called each time state changes.
   *
   */
  updateAll(state) {
    this.iteratePlugins((plugin) => {
      plugin.update(state);
    });
  }
  /**
   * Updates state with a patch
   */
  setState(patch) {
    this.store.setState(patch);
  }
  /**
   * Returns current state.
   */
  getState() {
    return this.store.getState();
  }
  patchFilesState(filesWithNewState) {
    const existingFilesState = this.getState().files;
    this.setState({
      files: {
        ...existingFilesState,
        ...Object.fromEntries(Object.entries(filesWithNewState).map((_ref) => {
          let [fileID, newFileState] = _ref;
          return [fileID, {
            ...existingFilesState[fileID],
            ...newFileState
          }];
        }))
      }
    });
  }
  /**
   * Shorthand to set state for a specific file.
   */
  setFileState(fileID, state) {
    if (!this.getState().files[fileID]) {
      throw new Error(`Can’t set state for ${fileID} (the file could have been removed)`);
    }
    this.patchFilesState({
      [fileID]: state
    });
  }
  i18nInit() {
    const onMissingKey = (key) => this.log(`Missing i18n string: ${key}`, "error");
    const translator = new Translator([this.defaultLocale, this.opts.locale], {
      onMissingKey
    });
    this.i18n = translator.translate.bind(translator);
    this.i18nArray = translator.translateArray.bind(translator);
    this.locale = translator.locale;
  }
  setOptions(newOpts) {
    this.opts = {
      ...this.opts,
      ...newOpts,
      restrictions: {
        ...this.opts.restrictions,
        ...newOpts == null ? void 0 : newOpts.restrictions
      }
    };
    if (newOpts.meta) {
      this.setMeta(newOpts.meta);
    }
    this.i18nInit();
    if (newOpts.locale) {
      this.iteratePlugins((plugin) => {
        plugin.setOptions(newOpts);
      });
    }
    this.setState(void 0);
  }
  resetProgress() {
    const defaultProgress = {
      percentage: 0,
      bytesUploaded: false,
      uploadComplete: false,
      uploadStarted: null
    };
    const files = {
      ...this.getState().files
    };
    const updatedFiles = /* @__PURE__ */ Object.create(null);
    Object.keys(files).forEach((fileID) => {
      updatedFiles[fileID] = {
        ...files[fileID],
        progress: {
          ...files[fileID].progress,
          ...defaultProgress
        },
        // @ts-expect-error these typed are inserted
        // into the namespace in their respective packages
        // but core isn't ware of those
        tus: void 0,
        transloadit: void 0
      };
    });
    this.setState({
      files: updatedFiles,
      ...defaultUploadState
    });
  }
  clear() {
    const {
      capabilities,
      currentUploads
    } = this.getState();
    if (Object.keys(currentUploads).length > 0 && !capabilities.individualCancellation) {
      throw new Error("The installed uploader plugin does not allow removing files during an upload.");
    }
    this.setState({
      ...defaultUploadState,
      files: {}
    });
  }
  addPreProcessor(fn) {
    _classPrivateFieldLooseBase3(this, _preProcessors)[_preProcessors].add(fn);
  }
  removePreProcessor(fn) {
    return _classPrivateFieldLooseBase3(this, _preProcessors)[_preProcessors].delete(fn);
  }
  addPostProcessor(fn) {
    _classPrivateFieldLooseBase3(this, _postProcessors)[_postProcessors].add(fn);
  }
  removePostProcessor(fn) {
    return _classPrivateFieldLooseBase3(this, _postProcessors)[_postProcessors].delete(fn);
  }
  addUploader(fn) {
    _classPrivateFieldLooseBase3(this, _uploaders)[_uploaders].add(fn);
  }
  removeUploader(fn) {
    return _classPrivateFieldLooseBase3(this, _uploaders)[_uploaders].delete(fn);
  }
  setMeta(data) {
    const updatedMeta = {
      ...this.getState().meta,
      ...data
    };
    const updatedFiles = {
      ...this.getState().files
    };
    Object.keys(updatedFiles).forEach((fileID) => {
      updatedFiles[fileID] = {
        ...updatedFiles[fileID],
        meta: {
          ...updatedFiles[fileID].meta,
          ...data
        }
      };
    });
    this.log("Adding metadata:");
    this.log(data);
    this.setState({
      meta: updatedMeta,
      files: updatedFiles
    });
  }
  setFileMeta(fileID, data) {
    const updatedFiles = {
      ...this.getState().files
    };
    if (!updatedFiles[fileID]) {
      this.log(`Was trying to set metadata for a file that has been removed: ${fileID}`);
      return;
    }
    const newMeta = {
      ...updatedFiles[fileID].meta,
      ...data
    };
    updatedFiles[fileID] = {
      ...updatedFiles[fileID],
      meta: newMeta
    };
    this.setState({
      files: updatedFiles
    });
  }
  /**
   * Get a file object.
   */
  getFile(fileID) {
    return this.getState().files[fileID];
  }
  /**
   * Get all files in an array.
   */
  getFiles() {
    const {
      files
    } = this.getState();
    return Object.values(files);
  }
  getFilesByIds(ids) {
    return ids.map((id5) => this.getFile(id5));
  }
  getObjectOfFilesPerState() {
    const {
      files: filesObject,
      totalProgress,
      error
    } = this.getState();
    const files = Object.values(filesObject);
    const inProgressFiles = [];
    const newFiles = [];
    const startedFiles = [];
    const uploadStartedFiles = [];
    const pausedFiles = [];
    const completeFiles = [];
    const erroredFiles = [];
    const inProgressNotPausedFiles = [];
    const processingFiles = [];
    for (const file of files) {
      const {
        progress
      } = file;
      if (!progress.uploadComplete && progress.uploadStarted) {
        inProgressFiles.push(file);
        if (!file.isPaused) {
          inProgressNotPausedFiles.push(file);
        }
      }
      if (!progress.uploadStarted) {
        newFiles.push(file);
      }
      if (progress.uploadStarted || progress.preprocess || progress.postprocess) {
        startedFiles.push(file);
      }
      if (progress.uploadStarted) {
        uploadStartedFiles.push(file);
      }
      if (file.isPaused) {
        pausedFiles.push(file);
      }
      if (progress.uploadComplete) {
        completeFiles.push(file);
      }
      if (file.error) {
        erroredFiles.push(file);
      }
      if (progress.preprocess || progress.postprocess) {
        processingFiles.push(file);
      }
    }
    return {
      newFiles,
      startedFiles,
      uploadStartedFiles,
      pausedFiles,
      completeFiles,
      erroredFiles,
      inProgressFiles,
      inProgressNotPausedFiles,
      processingFiles,
      isUploadStarted: uploadStartedFiles.length > 0,
      isAllComplete: totalProgress === 100 && completeFiles.length === files.length && processingFiles.length === 0,
      isAllErrored: !!error && erroredFiles.length === files.length,
      isAllPaused: inProgressFiles.length !== 0 && pausedFiles.length === inProgressFiles.length,
      isUploadInProgress: inProgressFiles.length > 0,
      isSomeGhost: files.some((file) => file.isGhost)
    };
  }
  validateRestrictions(file, files) {
    if (files === void 0) {
      files = this.getFiles();
    }
    try {
      _classPrivateFieldLooseBase3(this, _restricter)[_restricter].validate(files, [file]);
    } catch (err) {
      return err;
    }
    return null;
  }
  validateSingleFile(file) {
    try {
      _classPrivateFieldLooseBase3(this, _restricter)[_restricter].validateSingleFile(file);
    } catch (err) {
      return err.message;
    }
    return null;
  }
  validateAggregateRestrictions(files) {
    const existingFiles = this.getFiles();
    try {
      _classPrivateFieldLooseBase3(this, _restricter)[_restricter].validateAggregateRestrictions(existingFiles, files);
    } catch (err) {
      return err.message;
    }
    return null;
  }
  checkIfFileAlreadyExists(fileID) {
    const {
      files
    } = this.getState();
    if (files[fileID] && !files[fileID].isGhost) {
      return true;
    }
    return false;
  }
  /**
   * Add a new file to `state.files`. This will run `onBeforeFileAdded`,
   * try to guess file type in a clever way, check file against restrictions,
   * and start an upload if `autoProceed === true`.
   */
  addFile(file) {
    _classPrivateFieldLooseBase3(this, _assertNewUploadAllowed)[_assertNewUploadAllowed](file);
    const {
      nextFilesState,
      validFilesToAdd,
      errors
    } = _classPrivateFieldLooseBase3(this, _checkAndUpdateFileState)[_checkAndUpdateFileState]([file]);
    const restrictionErrors = errors.filter((error) => error.isRestriction);
    _classPrivateFieldLooseBase3(this, _informAndEmit)[_informAndEmit](restrictionErrors);
    if (errors.length > 0) throw errors[0];
    this.setState({
      files: nextFilesState
    });
    const [firstValidFileToAdd] = validFilesToAdd;
    this.emit("file-added", firstValidFileToAdd);
    this.emit("files-added", validFilesToAdd);
    this.log(`Added file: ${firstValidFileToAdd.name}, ${firstValidFileToAdd.id}, mime type: ${firstValidFileToAdd.type}`);
    _classPrivateFieldLooseBase3(this, _startIfAutoProceed)[_startIfAutoProceed]();
    return firstValidFileToAdd.id;
  }
  /**
   * Add multiple files to `state.files`. See the `addFile()` documentation.
   *
   * If an error occurs while adding a file, it is logged and the user is notified.
   * This is good for UI plugins, but not for programmatic use.
   * Programmatic users should usually still use `addFile()` on individual files.
   */
  addFiles(fileDescriptors) {
    _classPrivateFieldLooseBase3(this, _assertNewUploadAllowed)[_assertNewUploadAllowed]();
    const {
      nextFilesState,
      validFilesToAdd,
      errors
    } = _classPrivateFieldLooseBase3(this, _checkAndUpdateFileState)[_checkAndUpdateFileState](fileDescriptors);
    const restrictionErrors = errors.filter((error) => error.isRestriction);
    _classPrivateFieldLooseBase3(this, _informAndEmit)[_informAndEmit](restrictionErrors);
    const nonRestrictionErrors = errors.filter((error) => !error.isRestriction);
    if (nonRestrictionErrors.length > 0) {
      let message = "Multiple errors occurred while adding files:\n";
      nonRestrictionErrors.forEach((subError) => {
        message += `
 * ${subError.message}`;
      });
      this.info({
        message: this.i18n("addBulkFilesFailed", {
          smart_count: nonRestrictionErrors.length
        }),
        details: message
      }, "error", this.opts.infoTimeout);
      if (typeof AggregateError === "function") {
        throw new AggregateError(nonRestrictionErrors, message);
      } else {
        const err = new Error(message);
        err.errors = nonRestrictionErrors;
        throw err;
      }
    }
    this.setState({
      files: nextFilesState
    });
    validFilesToAdd.forEach((file) => {
      this.emit("file-added", file);
    });
    this.emit("files-added", validFilesToAdd);
    if (validFilesToAdd.length > 5) {
      this.log(`Added batch of ${validFilesToAdd.length} files`);
    } else {
      Object.values(validFilesToAdd).forEach((file) => {
        this.log(`Added file: ${file.name}
 id: ${file.id}
 type: ${file.type}`);
      });
    }
    if (validFilesToAdd.length > 0) {
      _classPrivateFieldLooseBase3(this, _startIfAutoProceed)[_startIfAutoProceed]();
    }
  }
  removeFiles(fileIDs) {
    const {
      files,
      currentUploads
    } = this.getState();
    const updatedFiles = {
      ...files
    };
    const updatedUploads = {
      ...currentUploads
    };
    const removedFiles = /* @__PURE__ */ Object.create(null);
    fileIDs.forEach((fileID) => {
      if (files[fileID]) {
        removedFiles[fileID] = files[fileID];
        delete updatedFiles[fileID];
      }
    });
    function fileIsNotRemoved(uploadFileID) {
      return removedFiles[uploadFileID] === void 0;
    }
    Object.keys(updatedUploads).forEach((uploadID) => {
      const newFileIDs = currentUploads[uploadID].fileIDs.filter(fileIsNotRemoved);
      if (newFileIDs.length === 0) {
        delete updatedUploads[uploadID];
        return;
      }
      const {
        capabilities
      } = this.getState();
      if (newFileIDs.length !== currentUploads[uploadID].fileIDs.length && !capabilities.individualCancellation) {
        throw new Error("The installed uploader plugin does not allow removing files during an upload.");
      }
      updatedUploads[uploadID] = {
        ...currentUploads[uploadID],
        fileIDs: newFileIDs
      };
    });
    const stateUpdate = {
      currentUploads: updatedUploads,
      files: updatedFiles
    };
    if (Object.keys(updatedFiles).length === 0) {
      stateUpdate.allowNewUpload = true;
      stateUpdate.error = null;
      stateUpdate.recoveredState = null;
    }
    this.setState(stateUpdate);
    _classPrivateFieldLooseBase3(this, _updateTotalProgressThrottled)[_updateTotalProgressThrottled]();
    const removedFileIDs = Object.keys(removedFiles);
    removedFileIDs.forEach((fileID) => {
      this.emit("file-removed", removedFiles[fileID]);
    });
    if (removedFileIDs.length > 5) {
      this.log(`Removed ${removedFileIDs.length} files`);
    } else {
      this.log(`Removed files: ${removedFileIDs.join(", ")}`);
    }
  }
  removeFile(fileID) {
    this.removeFiles([fileID]);
  }
  pauseResume(fileID) {
    if (!this.getState().capabilities.resumableUploads || this.getFile(fileID).progress.uploadComplete) {
      return void 0;
    }
    const file = this.getFile(fileID);
    const wasPaused = file.isPaused || false;
    const isPaused = !wasPaused;
    this.setFileState(fileID, {
      isPaused
    });
    this.emit("upload-pause", file, isPaused);
    return isPaused;
  }
  pauseAll() {
    const updatedFiles = {
      ...this.getState().files
    };
    const inProgressUpdatedFiles = Object.keys(updatedFiles).filter((file) => {
      return !updatedFiles[file].progress.uploadComplete && updatedFiles[file].progress.uploadStarted;
    });
    inProgressUpdatedFiles.forEach((file) => {
      const updatedFile = {
        ...updatedFiles[file],
        isPaused: true
      };
      updatedFiles[file] = updatedFile;
    });
    this.setState({
      files: updatedFiles
    });
    this.emit("pause-all");
  }
  resumeAll() {
    const updatedFiles = {
      ...this.getState().files
    };
    const inProgressUpdatedFiles = Object.keys(updatedFiles).filter((file) => {
      return !updatedFiles[file].progress.uploadComplete && updatedFiles[file].progress.uploadStarted;
    });
    inProgressUpdatedFiles.forEach((file) => {
      const updatedFile = {
        ...updatedFiles[file],
        isPaused: false,
        error: null
      };
      updatedFiles[file] = updatedFile;
    });
    this.setState({
      files: updatedFiles
    });
    this.emit("resume-all");
  }
  async retryAll() {
    const result = await _classPrivateFieldLooseBase3(this, _doRetryAll)[_doRetryAll]();
    this.emit("complete", result);
    return result;
  }
  cancelAll() {
    this.emit("cancel-all");
    const {
      files
    } = this.getState();
    const fileIDs = Object.keys(files);
    if (fileIDs.length) {
      this.removeFiles(fileIDs);
    }
    this.setState(defaultUploadState);
  }
  retryUpload(fileID) {
    this.setFileState(fileID, {
      error: null,
      isPaused: false
    });
    this.emit("upload-retry", this.getFile(fileID));
    const uploadID = _classPrivateFieldLooseBase3(this, _createUpload)[_createUpload]([fileID], {
      forceAllowNewUpload: true
      // create new upload even if allowNewUpload: false
    });
    return _classPrivateFieldLooseBase3(this, _runUpload)[_runUpload](uploadID);
  }
  logout() {
    this.iteratePlugins((plugin) => {
      var _provider;
      ;
      (_provider = plugin.provider) == null || _provider.logout == null || _provider.logout();
    });
  }
  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/explicit-module-boundary-types
  [Symbol.for("uppy test: updateTotalProgress")]() {
    return _classPrivateFieldLooseBase3(this, _updateTotalProgress)[_updateTotalProgress]();
  }
  updateOnlineStatus() {
    var _window$navigator$onL;
    const online = (_window$navigator$onL = window.navigator.onLine) != null ? _window$navigator$onL : true;
    if (!online) {
      this.emit("is-offline");
      this.info(this.i18n("noInternetConnection"), "error", 0);
      this.wasOffline = true;
    } else {
      this.emit("is-online");
      if (this.wasOffline) {
        this.emit("back-online");
        this.info(this.i18n("connectedToInternet"), "success", 3e3);
        this.wasOffline = false;
      }
    }
  }
  getID() {
    return this.opts.id;
  }
  /**
   * Registers a plugin with Core.
   */
  use(Plugin) {
    if (typeof Plugin !== "function") {
      const msg = `Expected a plugin class, but got ${Plugin === null ? "null" : typeof Plugin}. Please verify that the plugin was imported and spelled correctly.`;
      throw new TypeError(msg);
    }
    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }
    const plugin = new Plugin(this, ...args);
    const pluginId = plugin.id;
    if (!pluginId) {
      throw new Error("Your plugin must have an id");
    }
    if (!plugin.type) {
      throw new Error("Your plugin must have a type");
    }
    const existsPluginAlready = this.getPlugin(pluginId);
    if (existsPluginAlready) {
      const msg = `Already found a plugin named '${existsPluginAlready.id}'. Tried to use: '${pluginId}'.
Uppy plugins must have unique \`id\` options.`;
      throw new Error(msg);
    }
    if (Plugin.VERSION) {
      this.log(`Using ${pluginId} v${Plugin.VERSION}`);
    }
    if (plugin.type in _classPrivateFieldLooseBase3(this, _plugins)[_plugins]) {
      _classPrivateFieldLooseBase3(this, _plugins)[_plugins][plugin.type].push(plugin);
    } else {
      _classPrivateFieldLooseBase3(this, _plugins)[_plugins][plugin.type] = [plugin];
    }
    plugin.install();
    this.emit("plugin-added", plugin);
    return this;
  }
  /**
   * Find one Plugin by name.
   */
  getPlugin(id5) {
    for (const plugins of Object.values(_classPrivateFieldLooseBase3(this, _plugins)[_plugins])) {
      const foundPlugin = plugins.find((plugin) => plugin.id === id5);
      if (foundPlugin != null) return foundPlugin;
    }
    return void 0;
  }
  [Symbol.for("uppy test: getPlugins")](type) {
    return _classPrivateFieldLooseBase3(this, _plugins)[_plugins][type];
  }
  /**
   * Iterate through all `use`d plugins.
   *
   */
  iteratePlugins(method) {
    Object.values(_classPrivateFieldLooseBase3(this, _plugins)[_plugins]).flat(1).forEach(method);
  }
  /**
   * Uninstall and remove a plugin.
   *
   * @param {object} instance The plugin instance to remove.
   */
  removePlugin(instance) {
    this.log(`Removing plugin ${instance.id}`);
    this.emit("plugin-remove", instance);
    if (instance.uninstall) {
      instance.uninstall();
    }
    const list = _classPrivateFieldLooseBase3(this, _plugins)[_plugins][instance.type];
    const index = list.findIndex((item) => item.id === instance.id);
    if (index !== -1) {
      list.splice(index, 1);
    }
    const state = this.getState();
    const updatedState = {
      plugins: {
        ...state.plugins,
        [instance.id]: void 0
      }
    };
    this.setState(updatedState);
  }
  /**
   * Uninstall all plugins and close down this Uppy instance.
   */
  destroy() {
    this.log(`Closing Uppy instance ${this.opts.id}: removing all files and uninstalling plugins`);
    this.cancelAll();
    _classPrivateFieldLooseBase3(this, _storeUnsubscribe)[_storeUnsubscribe]();
    this.iteratePlugins((plugin) => {
      this.removePlugin(plugin);
    });
    if (typeof window !== "undefined" && window.removeEventListener) {
      window.removeEventListener("online", _classPrivateFieldLooseBase3(this, _updateOnlineStatus)[_updateOnlineStatus]);
      window.removeEventListener("offline", _classPrivateFieldLooseBase3(this, _updateOnlineStatus)[_updateOnlineStatus]);
    }
  }
  hideInfo() {
    const {
      info
    } = this.getState();
    this.setState({
      info: info.slice(1)
    });
    this.emit("info-hidden");
  }
  /**
   * Set info message in `state.info`, so that UI plugins like `Informer`
   * can display the message.
   */
  info(message, type, duration) {
    if (type === void 0) {
      type = "info";
    }
    if (duration === void 0) {
      duration = 3e3;
    }
    const isComplexMessage = typeof message === "object";
    this.setState({
      info: [...this.getState().info, {
        type,
        message: isComplexMessage ? message.message : message,
        details: isComplexMessage ? message.details : null
      }]
    });
    setTimeout(() => this.hideInfo(), duration);
    this.emit("info-visible");
  }
  /**
   * Passes messages to a function, provided in `opts.logger`.
   * If `opts.logger: Uppy.debugLogger` or `opts.debug: true`, logs to the browser console.
   */
  log(message, type) {
    const {
      logger
    } = this.opts;
    switch (type) {
      case "error":
        logger.error(message);
        break;
      case "warning":
        logger.warn(message);
        break;
      default:
        logger.debug(message);
        break;
    }
  }
  registerRequestClient(id5, client) {
    _classPrivateFieldLooseBase3(this, _requestClientById)[_requestClientById].set(id5, client);
  }
  /** @protected */
  getRequestClientForFile(file) {
    if (!file.remote) throw new Error(`Tried to get RequestClient for a non-remote file ${file.id}`);
    const requestClient = _classPrivateFieldLooseBase3(this, _requestClientById)[_requestClientById].get(file.remote.requestClientId);
    if (requestClient == null) throw new Error(`requestClientId "${file.remote.requestClientId}" not registered for file "${file.id}"`);
    return requestClient;
  }
  /**
   * Restore an upload by its ID.
   */
  restore(uploadID) {
    this.log(`Core: attempting to restore upload "${uploadID}"`);
    if (!this.getState().currentUploads[uploadID]) {
      _classPrivateFieldLooseBase3(this, _removeUpload)[_removeUpload](uploadID);
      return Promise.reject(new Error("Nonexistent upload"));
    }
    return _classPrivateFieldLooseBase3(this, _runUpload)[_runUpload](uploadID);
  }
  [Symbol.for("uppy test: createUpload")]() {
    return _classPrivateFieldLooseBase3(this, _createUpload)[_createUpload](...arguments);
  }
  /**
   * Add data to an upload's result object.
   */
  addResultData(uploadID, data) {
    if (!_classPrivateFieldLooseBase3(this, _getUpload)[_getUpload](uploadID)) {
      this.log(`Not setting result for an upload that has been removed: ${uploadID}`);
      return;
    }
    const {
      currentUploads
    } = this.getState();
    const currentUpload = {
      ...currentUploads[uploadID],
      result: {
        ...currentUploads[uploadID].result,
        ...data
      }
    };
    this.setState({
      currentUploads: {
        ...currentUploads,
        [uploadID]: currentUpload
      }
    });
  }
  /**
   * Start an upload for all the files that are not currently being uploaded.
   */
  async upload() {
    var _classPrivateFieldLoo;
    if (!((_classPrivateFieldLoo = _classPrivateFieldLooseBase3(this, _plugins)[_plugins]["uploader"]) != null && _classPrivateFieldLoo.length)) {
      this.log("No uploader type plugins are used", "warning");
    }
    let {
      files
    } = this.getState();
    const filesToRetry = _classPrivateFieldLooseBase3(this, _getFilesToRetry)[_getFilesToRetry]();
    if (filesToRetry.length > 0) {
      const retryResult = await _classPrivateFieldLooseBase3(this, _doRetryAll)[_doRetryAll]();
      const hasNewFiles = this.getFiles().filter((file) => file.progress.uploadStarted == null).length > 0;
      if (!hasNewFiles) {
        this.emit("complete", retryResult);
        return retryResult;
      }
      ;
      ({
        files
      } = this.getState());
    }
    const onBeforeUploadResult = this.opts.onBeforeUpload(files);
    if (onBeforeUploadResult === false) {
      return Promise.reject(new Error("Not starting the upload because onBeforeUpload returned false"));
    }
    if (onBeforeUploadResult && typeof onBeforeUploadResult === "object") {
      files = onBeforeUploadResult;
      this.setState({
        files
      });
    }
    return Promise.resolve().then(() => _classPrivateFieldLooseBase3(this, _restricter)[_restricter].validateMinNumberOfFiles(files)).catch((err) => {
      _classPrivateFieldLooseBase3(this, _informAndEmit)[_informAndEmit]([err]);
      throw err;
    }).then(() => {
      if (!_classPrivateFieldLooseBase3(this, _checkRequiredMetaFields)[_checkRequiredMetaFields](files)) {
        throw new RestrictionError(this.i18n("missingRequiredMetaField"));
      }
    }).catch((err) => {
      throw err;
    }).then(async () => {
      const {
        currentUploads
      } = this.getState();
      const currentlyUploadingFiles = Object.values(currentUploads).flatMap((curr) => curr.fileIDs);
      const waitingFileIDs = [];
      Object.keys(files).forEach((fileID) => {
        const file = this.getFile(fileID);
        if (!file.progress.uploadStarted && currentlyUploadingFiles.indexOf(fileID) === -1) {
          waitingFileIDs.push(file.id);
        }
      });
      const uploadID = _classPrivateFieldLooseBase3(this, _createUpload)[_createUpload](waitingFileIDs);
      const result = await _classPrivateFieldLooseBase3(this, _runUpload)[_runUpload](uploadID);
      this.emit("complete", result);
      return result;
    }).catch((err) => {
      this.emit("error", err);
      this.log(err, "error");
      throw err;
    });
  }
};
function _informAndEmit2(errors) {
  for (const error of errors) {
    if (error.isRestriction) {
      this.emit("restriction-failed", error.file, error);
    } else {
      this.emit("error", error, error.file);
    }
    this.log(error, "warning");
  }
  const userFacingErrors = errors.filter((error) => error.isUserFacing);
  const maxNumToShow = 4;
  const firstErrors = userFacingErrors.slice(0, maxNumToShow);
  const additionalErrors = userFacingErrors.slice(maxNumToShow);
  firstErrors.forEach((_ref2) => {
    let {
      message,
      details = ""
    } = _ref2;
    this.info({
      message,
      details
    }, "error", this.opts.infoTimeout);
  });
  if (additionalErrors.length > 0) {
    this.info({
      message: this.i18n("additionalRestrictionsFailed", {
        count: additionalErrors.length
      })
    });
  }
}
function _checkRequiredMetaFieldsOnFile2(file) {
  const {
    missingFields,
    error
  } = _classPrivateFieldLooseBase3(this, _restricter)[_restricter].getMissingRequiredMetaFields(file);
  if (missingFields.length > 0) {
    this.setFileState(file.id, {
      missingRequiredMetaFields: missingFields
    });
    this.log(error.message);
    this.emit("restriction-failed", file, error);
    return false;
  }
  return true;
}
function _checkRequiredMetaFields2(files) {
  let success = true;
  for (const file of Object.values(files)) {
    if (!_classPrivateFieldLooseBase3(this, _checkRequiredMetaFieldsOnFile)[_checkRequiredMetaFieldsOnFile](file)) {
      success = false;
    }
  }
  return success;
}
function _assertNewUploadAllowed2(file) {
  const {
    allowNewUpload
  } = this.getState();
  if (allowNewUpload === false) {
    const error = new RestrictionError(this.i18n("noMoreFilesAllowed"), {
      file
    });
    _classPrivateFieldLooseBase3(this, _informAndEmit)[_informAndEmit]([error]);
    throw error;
  }
}
function _transformFile2(fileDescriptorOrFile) {
  const file = fileDescriptorOrFile instanceof File ? {
    name: fileDescriptorOrFile.name,
    type: fileDescriptorOrFile.type,
    size: fileDescriptorOrFile.size,
    data: fileDescriptorOrFile
  } : fileDescriptorOrFile;
  const fileType = getFileType(file);
  const fileName = getFileName(fileType, file);
  const fileExtension = getFileNameAndExtension(fileName).extension;
  const id5 = getSafeFileId(file, this.getID());
  const meta = file.meta || {};
  meta.name = fileName;
  meta.type = fileType;
  const size = Number.isFinite(file.data.size) ? file.data.size : null;
  return {
    source: file.source || "",
    id: id5,
    name: fileName,
    extension: fileExtension || "",
    meta: {
      ...this.getState().meta,
      ...meta
    },
    type: fileType,
    data: file.data,
    progress: {
      percentage: 0,
      bytesUploaded: false,
      bytesTotal: size,
      uploadComplete: false,
      uploadStarted: null
    },
    size,
    isGhost: false,
    isRemote: file.isRemote || false,
    remote: file.remote,
    preview: file.preview
  };
}
function _startIfAutoProceed2() {
  if (this.opts.autoProceed && !this.scheduledAutoProceed) {
    this.scheduledAutoProceed = setTimeout(() => {
      this.scheduledAutoProceed = null;
      this.upload().catch((err) => {
        if (!err.isRestriction) {
          this.log(err.stack || err.message || err);
        }
      });
    }, 4);
  }
}
function _checkAndUpdateFileState2(filesToAdd) {
  const {
    files: existingFiles
  } = this.getState();
  const nextFilesState = {
    ...existingFiles
  };
  const validFilesToAdd = [];
  const errors = [];
  for (const fileToAdd of filesToAdd) {
    try {
      var _existingFiles$newFil;
      let newFile = _classPrivateFieldLooseBase3(this, _transformFile)[_transformFile](fileToAdd);
      const isGhost = (_existingFiles$newFil = existingFiles[newFile.id]) == null ? void 0 : _existingFiles$newFil.isGhost;
      if (isGhost) {
        const existingFileState = existingFiles[newFile.id];
        newFile = {
          ...existingFileState,
          isGhost: false,
          data: fileToAdd.data
        };
        this.log(`Replaced the blob in the restored ghost file: ${newFile.name}, ${newFile.id}`);
      }
      const onBeforeFileAddedResult = this.opts.onBeforeFileAdded(newFile, nextFilesState);
      if (!onBeforeFileAddedResult && this.checkIfFileAlreadyExists(newFile.id)) {
        var _newFile$name;
        throw new RestrictionError(this.i18n("noDuplicates", {
          fileName: (_newFile$name = newFile.name) != null ? _newFile$name : this.i18n("unnamed")
        }), {
          file: fileToAdd
        });
      }
      if (onBeforeFileAddedResult === false && !isGhost) {
        throw new RestrictionError("Cannot add the file because onBeforeFileAdded returned false.", {
          isUserFacing: false,
          file: fileToAdd
        });
      } else if (typeof onBeforeFileAddedResult === "object" && onBeforeFileAddedResult !== null) {
        newFile = onBeforeFileAddedResult;
      }
      _classPrivateFieldLooseBase3(this, _restricter)[_restricter].validateSingleFile(newFile);
      nextFilesState[newFile.id] = newFile;
      validFilesToAdd.push(newFile);
    } catch (err) {
      errors.push(err);
    }
  }
  try {
    _classPrivateFieldLooseBase3(this, _restricter)[_restricter].validateAggregateRestrictions(Object.values(existingFiles), validFilesToAdd);
  } catch (err) {
    errors.push(err);
    return {
      nextFilesState: existingFiles,
      validFilesToAdd: [],
      errors
    };
  }
  return {
    nextFilesState,
    validFilesToAdd,
    errors
  };
}
function _getFilesToRetry2() {
  const {
    files
  } = this.getState();
  return Object.keys(files).filter((file) => {
    return files[file].error;
  });
}
async function _doRetryAll2() {
  const filesToRetry = _classPrivateFieldLooseBase3(this, _getFilesToRetry)[_getFilesToRetry]();
  const updatedFiles = {
    ...this.getState().files
  };
  filesToRetry.forEach((fileID) => {
    updatedFiles[fileID] = {
      ...updatedFiles[fileID],
      isPaused: false,
      error: null
    };
  });
  this.setState({
    files: updatedFiles,
    error: null
  });
  this.emit("retry-all", this.getFilesByIds(filesToRetry));
  if (filesToRetry.length === 0) {
    return {
      successful: [],
      failed: []
    };
  }
  const uploadID = _classPrivateFieldLooseBase3(this, _createUpload)[_createUpload](filesToRetry, {
    forceAllowNewUpload: true
    // create new upload even if allowNewUpload: false
  });
  return _classPrivateFieldLooseBase3(this, _runUpload)[_runUpload](uploadID);
}
function _updateTotalProgress2() {
  var _totalProgressPercent, _totalProgressPercent2;
  const totalProgress = _classPrivateFieldLooseBase3(this, _calculateTotalProgress)[_calculateTotalProgress]();
  let totalProgressPercent = null;
  if (totalProgress != null) {
    totalProgressPercent = Math.round(totalProgress * 100);
    if (totalProgressPercent > 100) totalProgressPercent = 100;
    else if (totalProgressPercent < 0) totalProgressPercent = 0;
  }
  this.emit("progress", (_totalProgressPercent = totalProgressPercent) != null ? _totalProgressPercent : 0);
  this.setState({
    totalProgress: (_totalProgressPercent2 = totalProgressPercent) != null ? _totalProgressPercent2 : 0
  });
}
function _calculateTotalProgress2() {
  const files = this.getFiles();
  const filesInProgress = files.filter((file) => {
    return file.progress.uploadStarted || file.progress.preprocess || file.progress.postprocess;
  });
  if (filesInProgress.length === 0) {
    return 0;
  }
  if (filesInProgress.every((file) => file.progress.uploadComplete)) {
    return 1;
  }
  const isSizedFile = (file) => file.progress.bytesTotal != null && file.progress.bytesTotal !== 0;
  const sizedFilesInProgress = filesInProgress.filter(isSizedFile);
  const unsizedFilesInProgress = filesInProgress.filter((file) => !isSizedFile(file));
  if (sizedFilesInProgress.every((file) => file.progress.uploadComplete) && unsizedFilesInProgress.length > 0 && !unsizedFilesInProgress.every((file) => file.progress.uploadComplete)) {
    return null;
  }
  const totalFilesSize = sizedFilesInProgress.reduce((acc, file) => {
    var _file$progress$bytesT;
    return acc + ((_file$progress$bytesT = file.progress.bytesTotal) != null ? _file$progress$bytesT : 0);
  }, 0);
  const totalUploadedSize = sizedFilesInProgress.reduce((acc, file) => acc + (file.progress.bytesUploaded || 0), 0);
  return totalFilesSize === 0 ? 0 : totalUploadedSize / totalFilesSize;
}
function _addListeners2() {
  const errorHandler = (error, file, response) => {
    let errorMsg = error.message || "Unknown error";
    if (error.details) {
      errorMsg += ` ${error.details}`;
    }
    this.setState({
      error: errorMsg
    });
    if (file != null && file.id in this.getState().files) {
      this.setFileState(file.id, {
        error: errorMsg,
        response
      });
    }
  };
  this.on("error", errorHandler);
  this.on("upload-error", (file, error, response) => {
    errorHandler(error, file, response);
    if (typeof error === "object" && error.message) {
      var _file$name;
      this.log(error.message, "error");
      const newError = new Error(this.i18n("failedToUpload", {
        file: (_file$name = file == null ? void 0 : file.name) != null ? _file$name : ""
      }));
      newError.isUserFacing = true;
      newError.details = error.message;
      if (error.details) {
        newError.details += ` ${error.details}`;
      }
      _classPrivateFieldLooseBase3(this, _informAndEmit)[_informAndEmit]([newError]);
    } else {
      _classPrivateFieldLooseBase3(this, _informAndEmit)[_informAndEmit]([error]);
    }
  });
  let uploadStalledWarningRecentlyEmitted = null;
  this.on("upload-stalled", (error, files) => {
    const {
      message
    } = error;
    const details = files.map((file) => file.meta.name).join(", ");
    if (!uploadStalledWarningRecentlyEmitted) {
      this.info({
        message,
        details
      }, "warning", this.opts.infoTimeout);
      uploadStalledWarningRecentlyEmitted = setTimeout(() => {
        uploadStalledWarningRecentlyEmitted = null;
      }, this.opts.infoTimeout);
    }
    this.log(`${message} ${details}`.trim(), "warning");
  });
  this.on("upload", () => {
    this.setState({
      error: null
    });
  });
  const onUploadStarted = (files) => {
    const filesFiltered = files.filter((file) => {
      const exists = file != null && this.getFile(file.id);
      if (!exists) this.log(`Not setting progress for a file that has been removed: ${file == null ? void 0 : file.id}`);
      return exists;
    });
    const filesState = Object.fromEntries(filesFiltered.map((file) => [file.id, {
      progress: {
        uploadStarted: Date.now(),
        uploadComplete: false,
        bytesUploaded: 0,
        bytesTotal: file.size
      }
    }]));
    this.patchFilesState(filesState);
  };
  this.on("upload-start", onUploadStarted);
  this.on("upload-progress", _classPrivateFieldLooseBase3(this, _handleUploadProgress)[_handleUploadProgress]);
  this.on("upload-success", (file, uploadResp) => {
    if (file == null || !this.getFile(file.id)) {
      this.log(`Not setting progress for a file that has been removed: ${file == null ? void 0 : file.id}`);
      return;
    }
    const currentProgress = this.getFile(file.id).progress;
    this.setFileState(file.id, {
      progress: {
        ...currentProgress,
        postprocess: _classPrivateFieldLooseBase3(this, _postProcessors)[_postProcessors].size > 0 ? {
          mode: "indeterminate"
        } : void 0,
        uploadComplete: true,
        percentage: 100,
        bytesUploaded: currentProgress.bytesTotal
      },
      response: uploadResp,
      uploadURL: uploadResp.uploadURL,
      isPaused: false
    });
    if (file.size == null) {
      this.setFileState(file.id, {
        size: uploadResp.bytesUploaded || currentProgress.bytesTotal
      });
    }
    _classPrivateFieldLooseBase3(this, _updateTotalProgressThrottled)[_updateTotalProgressThrottled]();
  });
  this.on("preprocess-progress", (file, progress) => {
    if (file == null || !this.getFile(file.id)) {
      this.log(`Not setting progress for a file that has been removed: ${file == null ? void 0 : file.id}`);
      return;
    }
    this.setFileState(file.id, {
      progress: {
        ...this.getFile(file.id).progress,
        preprocess: progress
      }
    });
  });
  this.on("preprocess-complete", (file) => {
    if (file == null || !this.getFile(file.id)) {
      this.log(`Not setting progress for a file that has been removed: ${file == null ? void 0 : file.id}`);
      return;
    }
    const files = {
      ...this.getState().files
    };
    files[file.id] = {
      ...files[file.id],
      progress: {
        ...files[file.id].progress
      }
    };
    delete files[file.id].progress.preprocess;
    this.setState({
      files
    });
  });
  this.on("postprocess-progress", (file, progress) => {
    if (file == null || !this.getFile(file.id)) {
      this.log(`Not setting progress for a file that has been removed: ${file == null ? void 0 : file.id}`);
      return;
    }
    this.setFileState(file.id, {
      progress: {
        ...this.getState().files[file.id].progress,
        postprocess: progress
      }
    });
  });
  this.on("postprocess-complete", (file) => {
    if (file == null || !this.getFile(file.id)) {
      this.log(`Not setting progress for a file that has been removed: ${file == null ? void 0 : file.id}`);
      return;
    }
    const files = {
      ...this.getState().files
    };
    files[file.id] = {
      ...files[file.id],
      progress: {
        ...files[file.id].progress
      }
    };
    delete files[file.id].progress.postprocess;
    this.setState({
      files
    });
  });
  this.on("restored", () => {
    _classPrivateFieldLooseBase3(this, _updateTotalProgressThrottled)[_updateTotalProgressThrottled]();
  });
  this.on("dashboard:file-edit-complete", (file) => {
    if (file) {
      _classPrivateFieldLooseBase3(this, _checkRequiredMetaFieldsOnFile)[_checkRequiredMetaFieldsOnFile](file);
    }
  });
  if (typeof window !== "undefined" && window.addEventListener) {
    window.addEventListener("online", _classPrivateFieldLooseBase3(this, _updateOnlineStatus)[_updateOnlineStatus]);
    window.addEventListener("offline", _classPrivateFieldLooseBase3(this, _updateOnlineStatus)[_updateOnlineStatus]);
    setTimeout(_classPrivateFieldLooseBase3(this, _updateOnlineStatus)[_updateOnlineStatus], 3e3);
  }
}
function _createUpload2(fileIDs, opts) {
  if (opts === void 0) {
    opts = {};
  }
  const {
    forceAllowNewUpload = false
  } = opts;
  const {
    allowNewUpload,
    currentUploads
  } = this.getState();
  if (!allowNewUpload && !forceAllowNewUpload) {
    throw new Error("Cannot create a new upload: already uploading.");
  }
  const uploadID = nanoid();
  this.emit("upload", uploadID, this.getFilesByIds(fileIDs));
  this.setState({
    allowNewUpload: this.opts.allowMultipleUploadBatches !== false && this.opts.allowMultipleUploads !== false,
    currentUploads: {
      ...currentUploads,
      [uploadID]: {
        fileIDs,
        step: 0,
        result: {}
      }
    }
  });
  return uploadID;
}
function _getUpload2(uploadID) {
  const {
    currentUploads
  } = this.getState();
  return currentUploads[uploadID];
}
function _removeUpload2(uploadID) {
  const currentUploads = {
    ...this.getState().currentUploads
  };
  delete currentUploads[uploadID];
  this.setState({
    currentUploads
  });
}
async function _runUpload2(uploadID) {
  const getCurrentUpload = () => {
    const {
      currentUploads
    } = this.getState();
    return currentUploads[uploadID];
  };
  let currentUpload = getCurrentUpload();
  const steps = [..._classPrivateFieldLooseBase3(this, _preProcessors)[_preProcessors], ..._classPrivateFieldLooseBase3(this, _uploaders)[_uploaders], ..._classPrivateFieldLooseBase3(this, _postProcessors)[_postProcessors]];
  try {
    for (let step = currentUpload.step || 0; step < steps.length; step++) {
      if (!currentUpload) {
        break;
      }
      const fn = steps[step];
      this.setState({
        currentUploads: {
          ...this.getState().currentUploads,
          [uploadID]: {
            ...currentUpload,
            step
          }
        }
      });
      const {
        fileIDs
      } = currentUpload;
      await fn(fileIDs, uploadID);
      currentUpload = getCurrentUpload();
    }
  } catch (err) {
    _classPrivateFieldLooseBase3(this, _removeUpload)[_removeUpload](uploadID);
    throw err;
  }
  if (currentUpload) {
    currentUpload.fileIDs.forEach((fileID) => {
      const file = this.getFile(fileID);
      if (file && file.progress.postprocess) {
        this.emit("postprocess-complete", file);
      }
    });
    const files = currentUpload.fileIDs.map((fileID) => this.getFile(fileID));
    const successful = files.filter((file) => !file.error);
    const failed = files.filter((file) => file.error);
    this.addResultData(uploadID, {
      successful,
      failed,
      uploadID
    });
    currentUpload = getCurrentUpload();
  }
  let result;
  if (currentUpload) {
    result = currentUpload.result;
    _classPrivateFieldLooseBase3(this, _removeUpload)[_removeUpload](uploadID);
  }
  if (result == null) {
    this.log(`Not setting result for an upload that has been removed: ${uploadID}`);
  }
  return result;
}
Uppy.VERSION = packageJson2.version;
var Uppy_default = Uppy;

// node_modules/@uppy/core/lib/UIPlugin.js
var import_dist58 = __toESM(require_dist(), 1);
var import_dist59 = __toESM(require_dist2(), 1);
var import_dist60 = __toESM(require_dist3(), 1);

// node_modules/preact/dist/preact.module.js
var import_dist43 = __toESM(require_dist());
var import_dist44 = __toESM(require_dist2());
var import_dist45 = __toESM(require_dist3());
var n;
var l;
var u;
var t;
var i;
var r;
var o;
var e;
var f;
var c;
var s;
var a;
var h;
var p = {};
var y = [];
var v = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
var w = Array.isArray;
function d(n2, l2) {
  for (var u2 in l2) n2[u2] = l2[u2];
  return n2;
}
function g(n2) {
  n2 && n2.parentNode && n2.parentNode.removeChild(n2);
}
function _(l2, u2, t2) {
  var i2, r2, o2, e2 = {};
  for (o2 in u2) "key" == o2 ? i2 = u2[o2] : "ref" == o2 ? r2 = u2[o2] : e2[o2] = u2[o2];
  if (arguments.length > 2 && (e2.children = arguments.length > 3 ? n.call(arguments, 2) : t2), "function" == typeof l2 && null != l2.defaultProps) for (o2 in l2.defaultProps) null == e2[o2] && (e2[o2] = l2.defaultProps[o2]);
  return m(l2, e2, i2, r2, null);
}
function m(n2, t2, i2, r2, o2) {
  var e2 = { type: n2, props: t2, key: i2, ref: r2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: null == o2 ? ++u : o2, __i: -1, __u: 0 };
  return null == o2 && null != l.vnode && l.vnode(e2), e2;
}
function b() {
  return { current: null };
}
function k(n2) {
  return n2.children;
}
function x(n2, l2) {
  this.props = n2, this.context = l2;
}
function S(n2, l2) {
  if (null == l2) return n2.__ ? S(n2.__, n2.__i + 1) : null;
  for (var u2; l2 < n2.__k.length; l2++) if (null != (u2 = n2.__k[l2]) && null != u2.__e) return u2.__e;
  return "function" == typeof n2.type ? S(n2) : null;
}
function C(n2) {
  var l2, u2;
  if (null != (n2 = n2.__) && null != n2.__c) {
    for (n2.__e = n2.__c.base = null, l2 = 0; l2 < n2.__k.length; l2++) if (null != (u2 = n2.__k[l2]) && null != u2.__e) {
      n2.__e = n2.__c.base = u2.__e;
      break;
    }
    return C(n2);
  }
}
function M(n2) {
  (!n2.__d && (n2.__d = true) && i.push(n2) && !$.__r++ || r != l.debounceRendering) && ((r = l.debounceRendering) || o)($);
}
function $() {
  for (var n2, u2, t2, r2, o2, f2, c2, s2 = 1; i.length; ) i.length > s2 && i.sort(e), n2 = i.shift(), s2 = i.length, n2.__d && (t2 = void 0, o2 = (r2 = (u2 = n2).__v).__e, f2 = [], c2 = [], u2.__P && ((t2 = d({}, r2)).__v = r2.__v + 1, l.vnode && l.vnode(t2), O(u2.__P, t2, r2, u2.__n, u2.__P.namespaceURI, 32 & r2.__u ? [o2] : null, f2, null == o2 ? S(r2) : o2, !!(32 & r2.__u), c2), t2.__v = r2.__v, t2.__.__k[t2.__i] = t2, z(f2, t2, c2), t2.__e != o2 && C(t2)));
  $.__r = 0;
}
function I(n2, l2, u2, t2, i2, r2, o2, e2, f2, c2, s2) {
  var a2, h2, v2, w2, d2, g2, _2 = t2 && t2.__k || y, m2 = l2.length;
  for (f2 = P(u2, l2, _2, f2, m2), a2 = 0; a2 < m2; a2++) null != (v2 = u2.__k[a2]) && (h2 = -1 == v2.__i ? p : _2[v2.__i] || p, v2.__i = a2, g2 = O(n2, v2, h2, i2, r2, o2, e2, f2, c2, s2), w2 = v2.__e, v2.ref && h2.ref != v2.ref && (h2.ref && q(h2.ref, null, v2), s2.push(v2.ref, v2.__c || w2, v2)), null == d2 && null != w2 && (d2 = w2), 4 & v2.__u || h2.__k === v2.__k ? f2 = A(v2, f2, n2) : "function" == typeof v2.type && void 0 !== g2 ? f2 = g2 : w2 && (f2 = w2.nextSibling), v2.__u &= -7);
  return u2.__e = d2, f2;
}
function P(n2, l2, u2, t2, i2) {
  var r2, o2, e2, f2, c2, s2 = u2.length, a2 = s2, h2 = 0;
  for (n2.__k = new Array(i2), r2 = 0; r2 < i2; r2++) null != (o2 = l2[r2]) && "boolean" != typeof o2 && "function" != typeof o2 ? (f2 = r2 + h2, (o2 = n2.__k[r2] = "string" == typeof o2 || "number" == typeof o2 || "bigint" == typeof o2 || o2.constructor == String ? m(null, o2, null, null, null) : w(o2) ? m(k, { children: o2 }, null, null, null) : null == o2.constructor && o2.__b > 0 ? m(o2.type, o2.props, o2.key, o2.ref ? o2.ref : null, o2.__v) : o2).__ = n2, o2.__b = n2.__b + 1, e2 = null, -1 != (c2 = o2.__i = L(o2, u2, f2, a2)) && (a2--, (e2 = u2[c2]) && (e2.__u |= 2)), null == e2 || null == e2.__v ? (-1 == c2 && (i2 > s2 ? h2-- : i2 < s2 && h2++), "function" != typeof o2.type && (o2.__u |= 4)) : c2 != f2 && (c2 == f2 - 1 ? h2-- : c2 == f2 + 1 ? h2++ : (c2 > f2 ? h2-- : h2++, o2.__u |= 4))) : n2.__k[r2] = null;
  if (a2) for (r2 = 0; r2 < s2; r2++) null != (e2 = u2[r2]) && 0 == (2 & e2.__u) && (e2.__e == t2 && (t2 = S(e2)), B(e2, e2));
  return t2;
}
function A(n2, l2, u2) {
  var t2, i2;
  if ("function" == typeof n2.type) {
    for (t2 = n2.__k, i2 = 0; t2 && i2 < t2.length; i2++) t2[i2] && (t2[i2].__ = n2, l2 = A(t2[i2], l2, u2));
    return l2;
  }
  n2.__e != l2 && (l2 && n2.type && !u2.contains(l2) && (l2 = S(n2)), u2.insertBefore(n2.__e, l2 || null), l2 = n2.__e);
  do {
    l2 = l2 && l2.nextSibling;
  } while (null != l2 && 8 == l2.nodeType);
  return l2;
}
function H(n2, l2) {
  return l2 = l2 || [], null == n2 || "boolean" == typeof n2 || (w(n2) ? n2.some(function(n3) {
    H(n3, l2);
  }) : l2.push(n2)), l2;
}
function L(n2, l2, u2, t2) {
  var i2, r2, o2 = n2.key, e2 = n2.type, f2 = l2[u2];
  if (null === f2 && null == n2.key || f2 && o2 == f2.key && e2 == f2.type && 0 == (2 & f2.__u)) return u2;
  if (t2 > (null != f2 && 0 == (2 & f2.__u) ? 1 : 0)) for (i2 = u2 - 1, r2 = u2 + 1; i2 >= 0 || r2 < l2.length; ) {
    if (i2 >= 0) {
      if ((f2 = l2[i2]) && 0 == (2 & f2.__u) && o2 == f2.key && e2 == f2.type) return i2;
      i2--;
    }
    if (r2 < l2.length) {
      if ((f2 = l2[r2]) && 0 == (2 & f2.__u) && o2 == f2.key && e2 == f2.type) return r2;
      r2++;
    }
  }
  return -1;
}
function T(n2, l2, u2) {
  "-" == l2[0] ? n2.setProperty(l2, null == u2 ? "" : u2) : n2[l2] = null == u2 ? "" : "number" != typeof u2 || v.test(l2) ? u2 : u2 + "px";
}
function j(n2, l2, u2, t2, i2) {
  var r2;
  n: if ("style" == l2) if ("string" == typeof u2) n2.style.cssText = u2;
  else {
    if ("string" == typeof t2 && (n2.style.cssText = t2 = ""), t2) for (l2 in t2) u2 && l2 in u2 || T(n2.style, l2, "");
    if (u2) for (l2 in u2) t2 && u2[l2] == t2[l2] || T(n2.style, l2, u2[l2]);
  }
  else if ("o" == l2[0] && "n" == l2[1]) r2 = l2 != (l2 = l2.replace(f, "$1")), l2 = l2.toLowerCase() in n2 || "onFocusOut" == l2 || "onFocusIn" == l2 ? l2.toLowerCase().slice(2) : l2.slice(2), n2.l || (n2.l = {}), n2.l[l2 + r2] = u2, u2 ? t2 ? u2.u = t2.u : (u2.u = c, n2.addEventListener(l2, r2 ? a : s, r2)) : n2.removeEventListener(l2, r2 ? a : s, r2);
  else {
    if ("http://www.w3.org/2000/svg" == i2) l2 = l2.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
    else if ("width" != l2 && "height" != l2 && "href" != l2 && "list" != l2 && "form" != l2 && "tabIndex" != l2 && "download" != l2 && "rowSpan" != l2 && "colSpan" != l2 && "role" != l2 && "popover" != l2 && l2 in n2) try {
      n2[l2] = null == u2 ? "" : u2;
      break n;
    } catch (n3) {
    }
    "function" == typeof u2 || (null == u2 || false === u2 && "-" != l2[4] ? n2.removeAttribute(l2) : n2.setAttribute(l2, "popover" == l2 && 1 == u2 ? "" : u2));
  }
}
function F(n2) {
  return function(u2) {
    if (this.l) {
      var t2 = this.l[u2.type + n2];
      if (null == u2.t) u2.t = c++;
      else if (u2.t < t2.u) return;
      return t2(l.event ? l.event(u2) : u2);
    }
  };
}
function O(n2, u2, t2, i2, r2, o2, e2, f2, c2, s2) {
  var a2, h2, p2, y2, v2, _2, m2, b2, S2, C2, M2, $2, P2, A2, H2, L2, T2, j2 = u2.type;
  if (null != u2.constructor) return null;
  128 & t2.__u && (c2 = !!(32 & t2.__u), o2 = [f2 = u2.__e = t2.__e]), (a2 = l.__b) && a2(u2);
  n: if ("function" == typeof j2) try {
    if (b2 = u2.props, S2 = "prototype" in j2 && j2.prototype.render, C2 = (a2 = j2.contextType) && i2[a2.__c], M2 = a2 ? C2 ? C2.props.value : a2.__ : i2, t2.__c ? m2 = (h2 = u2.__c = t2.__c).__ = h2.__E : (S2 ? u2.__c = h2 = new j2(b2, M2) : (u2.__c = h2 = new x(b2, M2), h2.constructor = j2, h2.render = D), C2 && C2.sub(h2), h2.props = b2, h2.state || (h2.state = {}), h2.context = M2, h2.__n = i2, p2 = h2.__d = true, h2.__h = [], h2._sb = []), S2 && null == h2.__s && (h2.__s = h2.state), S2 && null != j2.getDerivedStateFromProps && (h2.__s == h2.state && (h2.__s = d({}, h2.__s)), d(h2.__s, j2.getDerivedStateFromProps(b2, h2.__s))), y2 = h2.props, v2 = h2.state, h2.__v = u2, p2) S2 && null == j2.getDerivedStateFromProps && null != h2.componentWillMount && h2.componentWillMount(), S2 && null != h2.componentDidMount && h2.__h.push(h2.componentDidMount);
    else {
      if (S2 && null == j2.getDerivedStateFromProps && b2 !== y2 && null != h2.componentWillReceiveProps && h2.componentWillReceiveProps(b2, M2), !h2.__e && null != h2.shouldComponentUpdate && false === h2.shouldComponentUpdate(b2, h2.__s, M2) || u2.__v == t2.__v) {
        for (u2.__v != t2.__v && (h2.props = b2, h2.state = h2.__s, h2.__d = false), u2.__e = t2.__e, u2.__k = t2.__k, u2.__k.some(function(n3) {
          n3 && (n3.__ = u2);
        }), $2 = 0; $2 < h2._sb.length; $2++) h2.__h.push(h2._sb[$2]);
        h2._sb = [], h2.__h.length && e2.push(h2);
        break n;
      }
      null != h2.componentWillUpdate && h2.componentWillUpdate(b2, h2.__s, M2), S2 && null != h2.componentDidUpdate && h2.__h.push(function() {
        h2.componentDidUpdate(y2, v2, _2);
      });
    }
    if (h2.context = M2, h2.props = b2, h2.__P = n2, h2.__e = false, P2 = l.__r, A2 = 0, S2) {
      for (h2.state = h2.__s, h2.__d = false, P2 && P2(u2), a2 = h2.render(h2.props, h2.state, h2.context), H2 = 0; H2 < h2._sb.length; H2++) h2.__h.push(h2._sb[H2]);
      h2._sb = [];
    } else do {
      h2.__d = false, P2 && P2(u2), a2 = h2.render(h2.props, h2.state, h2.context), h2.state = h2.__s;
    } while (h2.__d && ++A2 < 25);
    h2.state = h2.__s, null != h2.getChildContext && (i2 = d(d({}, i2), h2.getChildContext())), S2 && !p2 && null != h2.getSnapshotBeforeUpdate && (_2 = h2.getSnapshotBeforeUpdate(y2, v2)), L2 = a2, null != a2 && a2.type === k && null == a2.key && (L2 = N(a2.props.children)), f2 = I(n2, w(L2) ? L2 : [L2], u2, t2, i2, r2, o2, e2, f2, c2, s2), h2.base = u2.__e, u2.__u &= -161, h2.__h.length && e2.push(h2), m2 && (h2.__E = h2.__ = null);
  } catch (n3) {
    if (u2.__v = null, c2 || null != o2) if (n3.then) {
      for (u2.__u |= c2 ? 160 : 128; f2 && 8 == f2.nodeType && f2.nextSibling; ) f2 = f2.nextSibling;
      o2[o2.indexOf(f2)] = null, u2.__e = f2;
    } else for (T2 = o2.length; T2--; ) g(o2[T2]);
    else u2.__e = t2.__e, u2.__k = t2.__k;
    l.__e(n3, u2, t2);
  }
  else null == o2 && u2.__v == t2.__v ? (u2.__k = t2.__k, u2.__e = t2.__e) : f2 = u2.__e = V(t2.__e, u2, t2, i2, r2, o2, e2, c2, s2);
  return (a2 = l.diffed) && a2(u2), 128 & u2.__u ? void 0 : f2;
}
function z(n2, u2, t2) {
  for (var i2 = 0; i2 < t2.length; i2++) q(t2[i2], t2[++i2], t2[++i2]);
  l.__c && l.__c(u2, n2), n2.some(function(u3) {
    try {
      n2 = u3.__h, u3.__h = [], n2.some(function(n3) {
        n3.call(u3);
      });
    } catch (n3) {
      l.__e(n3, u3.__v);
    }
  });
}
function N(n2) {
  return "object" != typeof n2 || null == n2 || n2.__b && n2.__b > 0 ? n2 : w(n2) ? n2.map(N) : d({}, n2);
}
function V(u2, t2, i2, r2, o2, e2, f2, c2, s2) {
  var a2, h2, y2, v2, d2, _2, m2, b2 = i2.props, k2 = t2.props, x2 = t2.type;
  if ("svg" == x2 ? o2 = "http://www.w3.org/2000/svg" : "math" == x2 ? o2 = "http://www.w3.org/1998/Math/MathML" : o2 || (o2 = "http://www.w3.org/1999/xhtml"), null != e2) {
    for (a2 = 0; a2 < e2.length; a2++) if ((d2 = e2[a2]) && "setAttribute" in d2 == !!x2 && (x2 ? d2.localName == x2 : 3 == d2.nodeType)) {
      u2 = d2, e2[a2] = null;
      break;
    }
  }
  if (null == u2) {
    if (null == x2) return document.createTextNode(k2);
    u2 = document.createElementNS(o2, x2, k2.is && k2), c2 && (l.__m && l.__m(t2, e2), c2 = false), e2 = null;
  }
  if (null == x2) b2 === k2 || c2 && u2.data == k2 || (u2.data = k2);
  else {
    if (e2 = e2 && n.call(u2.childNodes), b2 = i2.props || p, !c2 && null != e2) for (b2 = {}, a2 = 0; a2 < u2.attributes.length; a2++) b2[(d2 = u2.attributes[a2]).name] = d2.value;
    for (a2 in b2) if (d2 = b2[a2], "children" == a2) ;
    else if ("dangerouslySetInnerHTML" == a2) y2 = d2;
    else if (!(a2 in k2)) {
      if ("value" == a2 && "defaultValue" in k2 || "checked" == a2 && "defaultChecked" in k2) continue;
      j(u2, a2, null, d2, o2);
    }
    for (a2 in k2) d2 = k2[a2], "children" == a2 ? v2 = d2 : "dangerouslySetInnerHTML" == a2 ? h2 = d2 : "value" == a2 ? _2 = d2 : "checked" == a2 ? m2 = d2 : c2 && "function" != typeof d2 || b2[a2] === d2 || j(u2, a2, d2, b2[a2], o2);
    if (h2) c2 || y2 && (h2.__html == y2.__html || h2.__html == u2.innerHTML) || (u2.innerHTML = h2.__html), t2.__k = [];
    else if (y2 && (u2.innerHTML = ""), I("template" == t2.type ? u2.content : u2, w(v2) ? v2 : [v2], t2, i2, r2, "foreignObject" == x2 ? "http://www.w3.org/1999/xhtml" : o2, e2, f2, e2 ? e2[0] : i2.__k && S(i2, 0), c2, s2), null != e2) for (a2 = e2.length; a2--; ) g(e2[a2]);
    c2 || (a2 = "value", "progress" == x2 && null == _2 ? u2.removeAttribute("value") : null != _2 && (_2 !== u2[a2] || "progress" == x2 && !_2 || "option" == x2 && _2 != b2[a2]) && j(u2, a2, _2, b2[a2], o2), a2 = "checked", null != m2 && m2 != u2[a2] && j(u2, a2, m2, b2[a2], o2));
  }
  return u2;
}
function q(n2, u2, t2) {
  try {
    if ("function" == typeof n2) {
      var i2 = "function" == typeof n2.__u;
      i2 && n2.__u(), i2 && null == u2 || (n2.__u = n2(u2));
    } else n2.current = u2;
  } catch (n3) {
    l.__e(n3, t2);
  }
}
function B(n2, u2, t2) {
  var i2, r2;
  if (l.unmount && l.unmount(n2), (i2 = n2.ref) && (i2.current && i2.current != n2.__e || q(i2, null, u2)), null != (i2 = n2.__c)) {
    if (i2.componentWillUnmount) try {
      i2.componentWillUnmount();
    } catch (n3) {
      l.__e(n3, u2);
    }
    i2.base = i2.__P = null;
  }
  if (i2 = n2.__k) for (r2 = 0; r2 < i2.length; r2++) i2[r2] && B(i2[r2], u2, t2 || "function" != typeof n2.type);
  t2 || g(n2.__e), n2.__c = n2.__ = n2.__e = void 0;
}
function D(n2, l2, u2) {
  return this.constructor(n2, u2);
}
function E(u2, t2, i2) {
  var r2, o2, e2, f2;
  t2 == document && (t2 = document.documentElement), l.__ && l.__(u2, t2), o2 = (r2 = "function" == typeof i2) ? null : i2 && i2.__k || t2.__k, e2 = [], f2 = [], O(t2, u2 = (!r2 && i2 || t2).__k = _(k, null, [u2]), o2 || p, p, t2.namespaceURI, !r2 && i2 ? [i2] : o2 ? null : t2.firstChild ? n.call(t2.childNodes) : null, e2, !r2 && i2 ? i2 : o2 ? o2.__e : t2.firstChild, r2, f2), z(e2, u2, f2);
}
function J(l2, u2, t2) {
  var i2, r2, o2, e2, f2 = d({}, l2.props);
  for (o2 in l2.type && l2.type.defaultProps && (e2 = l2.type.defaultProps), u2) "key" == o2 ? i2 = u2[o2] : "ref" == o2 ? r2 = u2[o2] : f2[o2] = null == u2[o2] && null != e2 ? e2[o2] : u2[o2];
  return arguments.length > 2 && (f2.children = arguments.length > 3 ? n.call(arguments, 2) : t2), m(l2.type, f2, i2 || l2.key, r2 || l2.ref, null);
}
n = y.slice, l = { __e: function(n2, l2, u2, t2) {
  for (var i2, r2, o2; l2 = l2.__; ) if ((i2 = l2.__c) && !i2.__) try {
    if ((r2 = i2.constructor) && null != r2.getDerivedStateFromError && (i2.setState(r2.getDerivedStateFromError(n2)), o2 = i2.__d), null != i2.componentDidCatch && (i2.componentDidCatch(n2, t2 || {}), o2 = i2.__d), o2) return i2.__E = i2;
  } catch (l3) {
    n2 = l3;
  }
  throw n2;
} }, u = 0, t = function(n2) {
  return null != n2 && null == n2.constructor;
}, x.prototype.setState = function(n2, l2) {
  var u2;
  u2 = null != this.__s && this.__s != this.state ? this.__s : this.__s = d({}, this.state), "function" == typeof n2 && (n2 = n2(d({}, u2), this.props)), n2 && d(u2, n2), null != n2 && this.__v && (l2 && this._sb.push(l2), M(this));
}, x.prototype.forceUpdate = function(n2) {
  this.__v && (this.__e = true, n2 && this.__h.push(n2), M(this));
}, x.prototype.render = k, i = [], o = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n2, l2) {
  return n2.__v.__b - l2.__v.__b;
}, $.__r = 0, f = /(PointerCapture)$|Capture$/i, c = 0, s = F(false), a = F(true), h = 0;

// node_modules/@uppy/utils/lib/findDOMElement.js
var import_dist49 = __toESM(require_dist());
var import_dist50 = __toESM(require_dist2());
var import_dist51 = __toESM(require_dist3());

// node_modules/@uppy/utils/lib/isDOMElement.js
var import_dist46 = __toESM(require_dist(), 1);
var import_dist47 = __toESM(require_dist2(), 1);
var import_dist48 = __toESM(require_dist3(), 1);
function isDOMElement(obj) {
  if (typeof obj !== "object" || obj === null) return false;
  if (!("nodeType" in obj)) return false;
  return obj.nodeType === Node.ELEMENT_NODE;
}

// node_modules/@uppy/utils/lib/findDOMElement.js
function findDOMElement(element, context) {
  if (context === void 0) {
    context = document;
  }
  if (typeof element === "string") {
    return context.querySelector(element);
  }
  if (isDOMElement(element)) {
    return element;
  }
  return null;
}
var findDOMElement_default = findDOMElement;

// node_modules/@uppy/utils/lib/getTextDirection.js
var import_dist52 = __toESM(require_dist());
var import_dist53 = __toESM(require_dist2());
var import_dist54 = __toESM(require_dist3());
function getTextDirection(element) {
  var _element;
  while (element && !element.dir) {
    element = element.parentNode;
  }
  return (_element = element) == null ? void 0 : _element.dir;
}
var getTextDirection_default = getTextDirection;

// node_modules/@uppy/core/lib/BasePlugin.js
var import_dist55 = __toESM(require_dist(), 1);
var import_dist56 = __toESM(require_dist2(), 1);
var import_dist57 = __toESM(require_dist3(), 1);
var BasePlugin = class {
  constructor(uppy, opts) {
    this.uppy = uppy;
    this.opts = opts != null ? opts : {};
  }
  getPluginState() {
    const {
      plugins
    } = this.uppy.getState();
    return (plugins == null ? void 0 : plugins[this.id]) || {};
  }
  setPluginState(update) {
    const {
      plugins
    } = this.uppy.getState();
    this.uppy.setState({
      plugins: {
        ...plugins,
        [this.id]: {
          ...plugins[this.id],
          ...update
        }
      }
    });
  }
  setOptions(newOpts) {
    this.opts = {
      ...this.opts,
      ...newOpts
    };
    this.setPluginState(void 0);
    this.i18nInit();
  }
  i18nInit() {
    const translator = new Translator([this.defaultLocale, this.uppy.locale, this.opts.locale]);
    this.i18n = translator.translate.bind(translator);
    this.i18nArray = translator.translateArray.bind(translator);
    this.setPluginState(void 0);
  }
  /**
   * Extendable methods
   * ==================
   * These methods are here to serve as an overview of the extendable methods as well as
   * making them not conditional in use, such as `if (this.afterUpdate)`.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addTarget(plugin) {
    throw new Error("Extend the addTarget method to add your plugin to another plugin's target");
  }
  install() {
  }
  uninstall() {
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(state) {
  }
  // Called after every state update, after everything's mounted. Debounced.
  afterUpdate() {
  }
};

// node_modules/@uppy/core/lib/UIPlugin.js
function _classPrivateFieldLooseBase4(e2, t2) {
  if (!{}.hasOwnProperty.call(e2, t2)) throw new TypeError("attempted to use private field on non-instance");
  return e2;
}
var id4 = 0;
function _classPrivateFieldLooseKey4(e2) {
  return "__private_" + id4++ + "_" + e2;
}
function debounce(fn) {
  let calling = null;
  let latestArgs;
  return function() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    latestArgs = args;
    if (!calling) {
      calling = Promise.resolve().then(() => {
        calling = null;
        return fn(...latestArgs);
      });
    }
    return calling;
  };
}
var _updateUI = _classPrivateFieldLooseKey4("updateUI");
var UIPlugin = class _UIPlugin extends BasePlugin {
  constructor() {
    super(...arguments);
    Object.defineProperty(this, _updateUI, {
      writable: true,
      value: void 0
    });
  }
  getTargetPlugin(target) {
    let targetPlugin;
    if (typeof (target == null ? void 0 : target.addTarget) === "function") {
      targetPlugin = target;
      if (!(targetPlugin instanceof _UIPlugin)) {
        console.warn(new Error("The provided plugin is not an instance of UIPlugin. This is an indication of a bug with the way Uppy is bundled.", {
          cause: {
            targetPlugin,
            UIPlugin: _UIPlugin
          }
        }));
      }
    } else if (typeof target === "function") {
      const Target = target;
      this.uppy.iteratePlugins((p2) => {
        if (p2 instanceof Target) {
          targetPlugin = p2;
        }
      });
    }
    return targetPlugin;
  }
  /**
   * Check if supplied `target` is a DOM element or an `object`.
   * If it’s an object — target is a plugin, and we search `plugins`
   * for a plugin with same name and return its target.
   */
  mount(target, plugin) {
    const callerPluginName = plugin.id;
    const targetElement = findDOMElement_default(target);
    if (targetElement) {
      this.isTargetDOMEl = true;
      const uppyRootElement = document.createElement("div");
      uppyRootElement.classList.add("uppy-Root");
      _classPrivateFieldLooseBase4(this, _updateUI)[_updateUI] = debounce((state) => {
        if (!this.uppy.getPlugin(this.id)) return;
        E(this.render(state, uppyRootElement), uppyRootElement);
        this.afterUpdate();
      });
      this.uppy.log(`Installing ${callerPluginName} to a DOM element '${target}'`);
      if (this.opts.replaceTargetContent) {
        targetElement.innerHTML = "";
      }
      E(this.render(this.uppy.getState(), uppyRootElement), uppyRootElement);
      this.el = uppyRootElement;
      targetElement.appendChild(uppyRootElement);
      uppyRootElement.dir = this.opts.direction || getTextDirection_default(uppyRootElement) || "ltr";
      this.onMount();
      return this.el;
    }
    const targetPlugin = this.getTargetPlugin(target);
    if (targetPlugin) {
      this.uppy.log(`Installing ${callerPluginName} to ${targetPlugin.id}`);
      this.parent = targetPlugin;
      this.el = targetPlugin.addTarget(plugin);
      this.onMount();
      return this.el;
    }
    this.uppy.log(`Not installing ${callerPluginName}`);
    let message = `Invalid target option given to ${callerPluginName}.`;
    if (typeof target === "function") {
      message += " The given target is not a Plugin class. Please check that you're not specifying a React Component instead of a plugin. If you are using @uppy/* packages directly, make sure you have only 1 version of @uppy/core installed: run `npm ls @uppy/core` on the command line and verify that all the versions match and are deduped correctly.";
    } else {
      message += "If you meant to target an HTML element, please make sure that the element exists. Check that the <script> tag initializing Uppy is right before the closing </body> tag at the end of the page. (see https://github.com/transloadit/uppy/issues/1042)\n\nIf you meant to target a plugin, please confirm that your `import` statements or `require` calls are correct.";
    }
    throw new Error(message);
  }
  /**
   * Called when plugin is mounted, whether in DOM or into another plugin.
   * Needed because sometimes plugins are mounted separately/after `install`,
   * so this.el and this.parent might not be available in `install`.
   * This is the case with @uppy/react plugins, for example.
   */
  render(state, container) {
    throw new Error("Extend the render method to add your plugin to a DOM element");
  }
  update(state) {
    if (this.el != null) {
      var _classPrivateFieldLoo, _classPrivateFieldLoo2;
      (_classPrivateFieldLoo = (_classPrivateFieldLoo2 = _classPrivateFieldLooseBase4(this, _updateUI))[_updateUI]) == null || _classPrivateFieldLoo.call(_classPrivateFieldLoo2, state);
    }
  }
  unmount() {
    if (this.isTargetDOMEl) {
      var _this$el;
      (_this$el = this.el) == null || _this$el.remove();
    }
    this.onUnmount();
  }
  onMount() {
  }
  onUnmount() {
  }
};
var UIPlugin_default = UIPlugin;

export {
  require_debounce,
  getFileNameAndExtension,
  mimeTypes_default,
  getSafeFileId,
  debugLogger,
  require_prettierBytes,
  Uppy_default,
  l,
  _,
  b,
  k,
  x,
  H,
  J,
  isDOMElement,
  getTextDirection_default,
  BasePlugin,
  UIPlugin_default
};
/*! Bundled license information:

@uppy/utils/lib/Translator.js:
  (**
   * Takes a string with placeholder variables like `%{smart_count} file selected`
   * and replaces it with values from options `{smart_count: 5}`
   *
   * @license https://github.com/airbnb/polyglot.js/blob/master/LICENSE
   * taken from https://github.com/airbnb/polyglot.js/blob/master/lib/polyglot.js#L299
   *
   * @param phrase that needs interpolation, with placeholders
   * @param options with values that will be used to replace placeholders
   *)
*/
//# sourceMappingURL=chunk-L6BRPP5D.js.map
