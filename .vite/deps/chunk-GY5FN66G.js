import __buffer_polyfill from 'vite-plugin-node-polyfills/shims/buffer'
globalThis.Buffer = globalThis.Buffer || __buffer_polyfill
import __global_polyfill from 'vite-plugin-node-polyfills/shims/global'
globalThis.global = globalThis.global || __global_polyfill
import __process_polyfill from 'vite-plugin-node-polyfills/shims/process'
globalThis.process = globalThis.process || __process_polyfill

import {
  WaiterState,
  checkExceptions,
  createWaiter
} from "./chunk-ZCIX2HLB.js";
import {
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_RETRY_MODE,
  DEFAULT_USE_DUALSTACK_ENDPOINT,
  DEFAULT_USE_FIPS_ENDPOINT,
  EndpointCache,
  Sha256,
  awsEndpointFunctions,
  calculateBodyLength,
  createDefaultUserAgentProvider,
  customEndpointFunctions,
  getAwsRegionExtensionConfiguration,
  getContentLengthPlugin,
  getHostHeaderPlugin,
  getLoggerPlugin,
  getRecursionDetectionPlugin,
  getRetryPlugin,
  getUserAgentPlugin,
  invalidProvider,
  resolveAwsRegionExtensionConfiguration,
  resolveDefaultsModeConfig,
  resolveEndpoint,
  resolveHostHeaderConfig,
  resolveRegionConfig,
  resolveRetryConfig,
  resolveUserAgentConfig
} from "./chunk-DIMKL7G7.js";
import {
  v4_default
} from "./chunk-3TAN77E7.js";
import {
  AwsSdkSigV4Signer,
  Client,
  Command,
  DefaultIdentityProviderConfig,
  FetchHttpHandler,
  HttpRequest,
  NoOpLogger,
  ServiceException,
  _json,
  awsExpectUnion,
  collectBody,
  createAggregatedClient,
  createPaginator,
  decorateServiceException,
  expectBoolean,
  expectInt32,
  expectLong,
  expectNonNull,
  expectNumber,
  expectString,
  fromBase64,
  fromUtf8,
  getDefaultExtensionConfiguration,
  getEndpointPlugin,
  getHttpAuthSchemeEndpointRuleSetPlugin,
  getHttpHandlerExtensionConfiguration,
  getHttpSigningPlugin,
  getSerdePlugin,
  getSmithyContext,
  limitedParseDouble,
  loadConfigsForDefaultMode,
  loadRestJsonErrorCode,
  normalizeProvider,
  parseEpochTimestamp,
  parseJsonBody,
  parseJsonErrorBody,
  parseUrl,
  resolveAwsSdkSigV4Config,
  resolveDefaultRuntimeConfig,
  resolveEndpointConfig,
  resolveHttpHandlerRuntimeConfig,
  serializeFloat,
  streamCollector,
  take,
  toBase64,
  toUtf8,
  withBaseException
} from "./chunk-546YFRZM.js";
import {
  __commonJS,
  __publicField,
  __toESM,
  require_dist,
  require_dist2,
  require_dist3
} from "./chunk-GJFZQ5ET.js";

// node_modules/obliterator/iterator.js
var require_iterator = __commonJS({
  "node_modules/obliterator/iterator.js"(exports, module) {
    var import_dist295 = __toESM(require_dist());
    var import_dist296 = __toESM(require_dist2());
    var import_dist297 = __toESM(require_dist3());
    function Iterator(next) {
      Object.defineProperty(this, "_next", {
        writable: false,
        enumerable: false,
        value: next
      });
      this.done = false;
    }
    Iterator.prototype.next = function() {
      if (this.done)
        return { done: true };
      var step = this._next();
      if (step.done)
        this.done = true;
      return step;
    };
    if (typeof Symbol !== "undefined")
      Iterator.prototype[Symbol.iterator] = function() {
        return this;
      };
    Iterator.of = function() {
      var args = arguments, l2 = args.length, i2 = 0;
      return new Iterator(function() {
        if (i2 >= l2)
          return { done: true };
        return { done: false, value: args[i2++] };
      });
    };
    Iterator.empty = function() {
      var iterator = new Iterator(null);
      iterator.done = true;
      return iterator;
    };
    Iterator.is = function(value) {
      if (value instanceof Iterator)
        return true;
      return typeof value === "object" && value !== null && typeof value.next === "function";
    };
    module.exports = Iterator;
  }
});

// node_modules/obliterator/foreach.js
var require_foreach = __commonJS({
  "node_modules/obliterator/foreach.js"(exports, module) {
    var import_dist295 = __toESM(require_dist());
    var import_dist296 = __toESM(require_dist2());
    var import_dist297 = __toESM(require_dist3());
    var ARRAY_BUFFER_SUPPORT = typeof ArrayBuffer !== "undefined";
    var SYMBOL_SUPPORT = typeof Symbol !== "undefined";
    function forEach(iterable, callback) {
      var iterator, k2, i2, l2, s2;
      if (!iterable)
        throw new Error("obliterator/forEach: invalid iterable.");
      if (typeof callback !== "function")
        throw new Error("obliterator/forEach: expecting a callback.");
      if (Array.isArray(iterable) || ARRAY_BUFFER_SUPPORT && ArrayBuffer.isView(iterable) || typeof iterable === "string" || iterable.toString() === "[object Arguments]") {
        for (i2 = 0, l2 = iterable.length; i2 < l2; i2++)
          callback(iterable[i2], i2);
        return;
      }
      if (typeof iterable.forEach === "function") {
        iterable.forEach(callback);
        return;
      }
      if (SYMBOL_SUPPORT && Symbol.iterator in iterable && typeof iterable.next !== "function") {
        iterable = iterable[Symbol.iterator]();
      }
      if (typeof iterable.next === "function") {
        iterator = iterable;
        i2 = 0;
        while (s2 = iterator.next(), s2.done !== true) {
          callback(s2.value, i2);
          i2++;
        }
        return;
      }
      for (k2 in iterable) {
        if (iterable.hasOwnProperty(k2)) {
          callback(iterable[k2], k2);
        }
      }
      return;
    }
    forEach.forEachWithNullKeys = function(iterable, callback) {
      var iterator, k2, i2, l2, s2;
      if (!iterable)
        throw new Error("obliterator/forEachWithNullKeys: invalid iterable.");
      if (typeof callback !== "function")
        throw new Error("obliterator/forEachWithNullKeys: expecting a callback.");
      if (Array.isArray(iterable) || ARRAY_BUFFER_SUPPORT && ArrayBuffer.isView(iterable) || typeof iterable === "string" || iterable.toString() === "[object Arguments]") {
        for (i2 = 0, l2 = iterable.length; i2 < l2; i2++)
          callback(iterable[i2], null);
        return;
      }
      if (iterable instanceof Set) {
        iterable.forEach(function(value) {
          callback(value, null);
        });
        return;
      }
      if (typeof iterable.forEach === "function") {
        iterable.forEach(callback);
        return;
      }
      if (SYMBOL_SUPPORT && Symbol.iterator in iterable && typeof iterable.next !== "function") {
        iterable = iterable[Symbol.iterator]();
      }
      if (typeof iterable.next === "function") {
        iterator = iterable;
        i2 = 0;
        while (s2 = iterator.next(), s2.done !== true) {
          callback(s2.value, null);
          i2++;
        }
        return;
      }
      for (k2 in iterable) {
        if (iterable.hasOwnProperty(k2)) {
          callback(iterable[k2], k2);
        }
      }
      return;
    };
    module.exports = forEach;
  }
});

// node_modules/mnemonist/utils/typed-arrays.js
var require_typed_arrays = __commonJS({
  "node_modules/mnemonist/utils/typed-arrays.js"(exports) {
    var import_dist295 = __toESM(require_dist());
    var import_dist296 = __toESM(require_dist2());
    var import_dist297 = __toESM(require_dist3());
    var MAX_8BIT_INTEGER = Math.pow(2, 8) - 1;
    var MAX_16BIT_INTEGER = Math.pow(2, 16) - 1;
    var MAX_32BIT_INTEGER = Math.pow(2, 32) - 1;
    var MAX_SIGNED_8BIT_INTEGER = Math.pow(2, 7) - 1;
    var MAX_SIGNED_16BIT_INTEGER = Math.pow(2, 15) - 1;
    var MAX_SIGNED_32BIT_INTEGER = Math.pow(2, 31) - 1;
    exports.getPointerArray = function(size) {
      var maxIndex = size - 1;
      if (maxIndex <= MAX_8BIT_INTEGER)
        return Uint8Array;
      if (maxIndex <= MAX_16BIT_INTEGER)
        return Uint16Array;
      if (maxIndex <= MAX_32BIT_INTEGER)
        return Uint32Array;
      return Float64Array;
    };
    exports.getSignedPointerArray = function(size) {
      var maxIndex = size - 1;
      if (maxIndex <= MAX_SIGNED_8BIT_INTEGER)
        return Int8Array;
      if (maxIndex <= MAX_SIGNED_16BIT_INTEGER)
        return Int16Array;
      if (maxIndex <= MAX_SIGNED_32BIT_INTEGER)
        return Int32Array;
      return Float64Array;
    };
    exports.getNumberType = function(value) {
      if (value === (value | 0)) {
        if (Math.sign(value) === -1) {
          if (value <= 127 && value >= -128)
            return Int8Array;
          if (value <= 32767 && value >= -32768)
            return Int16Array;
          return Int32Array;
        } else {
          if (value <= 255)
            return Uint8Array;
          if (value <= 65535)
            return Uint16Array;
          return Uint32Array;
        }
      }
      return Float64Array;
    };
    var TYPE_PRIORITY = {
      Uint8Array: 1,
      Int8Array: 2,
      Uint16Array: 3,
      Int16Array: 4,
      Uint32Array: 5,
      Int32Array: 6,
      Float32Array: 7,
      Float64Array: 8
    };
    exports.getMinimalRepresentation = function(array, getter) {
      var maxType = null, maxPriority = 0, p2, t2, v2, i2, l2;
      for (i2 = 0, l2 = array.length; i2 < l2; i2++) {
        v2 = getter ? getter(array[i2]) : array[i2];
        t2 = exports.getNumberType(v2);
        p2 = TYPE_PRIORITY[t2.name];
        if (p2 > maxPriority) {
          maxPriority = p2;
          maxType = t2;
        }
      }
      return maxType;
    };
    exports.isTypedArray = function(value) {
      return typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(value);
    };
    exports.concat = function() {
      var length = 0, i2, o2, l2;
      for (i2 = 0, l2 = arguments.length; i2 < l2; i2++)
        length += arguments[i2].length;
      var array = new arguments[0].constructor(length);
      for (i2 = 0, o2 = 0; i2 < l2; i2++) {
        array.set(arguments[i2], o2);
        o2 += arguments[i2].length;
      }
      return array;
    };
    exports.indices = function(length) {
      var PointerArray = exports.getPointerArray(length);
      var array = new PointerArray(length);
      for (var i2 = 0; i2 < length; i2++)
        array[i2] = i2;
      return array;
    };
  }
});

// node_modules/mnemonist/utils/iterables.js
var require_iterables = __commonJS({
  "node_modules/mnemonist/utils/iterables.js"(exports) {
    var import_dist295 = __toESM(require_dist());
    var import_dist296 = __toESM(require_dist2());
    var import_dist297 = __toESM(require_dist3());
    var forEach = require_foreach();
    var typed = require_typed_arrays();
    function isArrayLike(target) {
      return Array.isArray(target) || typed.isTypedArray(target);
    }
    function guessLength(target) {
      if (typeof target.length === "number")
        return target.length;
      if (typeof target.size === "number")
        return target.size;
      return;
    }
    function toArray(target) {
      var l2 = guessLength(target);
      var array = typeof l2 === "number" ? new Array(l2) : [];
      var i2 = 0;
      forEach(target, function(value) {
        array[i2++] = value;
      });
      return array;
    }
    function toArrayWithIndices(target) {
      var l2 = guessLength(target);
      var IndexArray = typeof l2 === "number" ? typed.getPointerArray(l2) : Array;
      var array = typeof l2 === "number" ? new Array(l2) : [];
      var indices = typeof l2 === "number" ? new IndexArray(l2) : [];
      var i2 = 0;
      forEach(target, function(value) {
        array[i2] = value;
        indices[i2] = i2++;
      });
      return [array, indices];
    }
    exports.isArrayLike = isArrayLike;
    exports.guessLength = guessLength;
    exports.toArray = toArray;
    exports.toArrayWithIndices = toArrayWithIndices;
  }
});

// node_modules/mnemonist/lru-cache.js
var require_lru_cache = __commonJS({
  "node_modules/mnemonist/lru-cache.js"(exports, module) {
    var import_dist295 = __toESM(require_dist());
    var import_dist296 = __toESM(require_dist2());
    var import_dist297 = __toESM(require_dist3());
    var Iterator = require_iterator();
    var forEach = require_foreach();
    var typed = require_typed_arrays();
    var iterables = require_iterables();
    function LRUCache2(Keys, Values, capacity) {
      if (arguments.length < 2) {
        capacity = Keys;
        Keys = null;
        Values = null;
      }
      this.capacity = capacity;
      if (typeof this.capacity !== "number" || this.capacity <= 0)
        throw new Error("mnemonist/lru-cache: capacity should be positive number.");
      var PointerArray = typed.getPointerArray(capacity);
      this.forward = new PointerArray(capacity);
      this.backward = new PointerArray(capacity);
      this.K = typeof Keys === "function" ? new Keys(capacity) : new Array(capacity);
      this.V = typeof Values === "function" ? new Values(capacity) : new Array(capacity);
      this.size = 0;
      this.head = 0;
      this.tail = 0;
      this.items = {};
    }
    LRUCache2.prototype.clear = function() {
      this.size = 0;
      this.head = 0;
      this.tail = 0;
      this.items = {};
    };
    LRUCache2.prototype.splayOnTop = function(pointer) {
      var oldHead = this.head;
      if (this.head === pointer)
        return this;
      var previous = this.backward[pointer], next = this.forward[pointer];
      if (this.tail === pointer) {
        this.tail = previous;
      } else {
        this.backward[next] = previous;
      }
      this.forward[previous] = next;
      this.backward[oldHead] = pointer;
      this.head = pointer;
      this.forward[pointer] = oldHead;
      return this;
    };
    LRUCache2.prototype.set = function(key, value) {
      var pointer = this.items[key];
      if (typeof pointer !== "undefined") {
        this.splayOnTop(pointer);
        this.V[pointer] = value;
        return;
      }
      if (this.size < this.capacity) {
        pointer = this.size++;
      } else {
        pointer = this.tail;
        this.tail = this.backward[pointer];
        delete this.items[this.K[pointer]];
      }
      this.items[key] = pointer;
      this.K[pointer] = key;
      this.V[pointer] = value;
      this.forward[pointer] = this.head;
      this.backward[this.head] = pointer;
      this.head = pointer;
    };
    LRUCache2.prototype.setpop = function(key, value) {
      var oldValue = null;
      var oldKey = null;
      var pointer = this.items[key];
      if (typeof pointer !== "undefined") {
        this.splayOnTop(pointer);
        oldValue = this.V[pointer];
        this.V[pointer] = value;
        return { evicted: false, key, value: oldValue };
      }
      if (this.size < this.capacity) {
        pointer = this.size++;
      } else {
        pointer = this.tail;
        this.tail = this.backward[pointer];
        oldValue = this.V[pointer];
        oldKey = this.K[pointer];
        delete this.items[this.K[pointer]];
      }
      this.items[key] = pointer;
      this.K[pointer] = key;
      this.V[pointer] = value;
      this.forward[pointer] = this.head;
      this.backward[this.head] = pointer;
      this.head = pointer;
      if (oldKey) {
        return { evicted: true, key: oldKey, value: oldValue };
      } else {
        return null;
      }
    };
    LRUCache2.prototype.has = function(key) {
      return key in this.items;
    };
    LRUCache2.prototype.get = function(key) {
      var pointer = this.items[key];
      if (typeof pointer === "undefined")
        return;
      this.splayOnTop(pointer);
      return this.V[pointer];
    };
    LRUCache2.prototype.peek = function(key) {
      var pointer = this.items[key];
      if (typeof pointer === "undefined")
        return;
      return this.V[pointer];
    };
    LRUCache2.prototype.forEach = function(callback, scope) {
      scope = arguments.length > 1 ? scope : this;
      var i2 = 0, l2 = this.size;
      var pointer = this.head, keys = this.K, values = this.V, forward = this.forward;
      while (i2 < l2) {
        callback.call(scope, values[pointer], keys[pointer], this);
        pointer = forward[pointer];
        i2++;
      }
    };
    LRUCache2.prototype.keys = function() {
      var i2 = 0, l2 = this.size;
      var pointer = this.head, keys = this.K, forward = this.forward;
      return new Iterator(function() {
        if (i2 >= l2)
          return { done: true };
        var key = keys[pointer];
        i2++;
        if (i2 < l2)
          pointer = forward[pointer];
        return {
          done: false,
          value: key
        };
      });
    };
    LRUCache2.prototype.values = function() {
      var i2 = 0, l2 = this.size;
      var pointer = this.head, values = this.V, forward = this.forward;
      return new Iterator(function() {
        if (i2 >= l2)
          return { done: true };
        var value = values[pointer];
        i2++;
        if (i2 < l2)
          pointer = forward[pointer];
        return {
          done: false,
          value
        };
      });
    };
    LRUCache2.prototype.entries = function() {
      var i2 = 0, l2 = this.size;
      var pointer = this.head, keys = this.K, values = this.V, forward = this.forward;
      return new Iterator(function() {
        if (i2 >= l2)
          return { done: true };
        var key = keys[pointer], value = values[pointer];
        i2++;
        if (i2 < l2)
          pointer = forward[pointer];
        return {
          done: false,
          value: [key, value]
        };
      });
    };
    if (typeof Symbol !== "undefined")
      LRUCache2.prototype[Symbol.iterator] = LRUCache2.prototype.entries;
    LRUCache2.prototype.inspect = function() {
      var proxy = /* @__PURE__ */ new Map();
      var iterator = this.entries(), step;
      while (step = iterator.next(), !step.done)
        proxy.set(step.value[0], step.value[1]);
      Object.defineProperty(proxy, "constructor", {
        value: LRUCache2,
        enumerable: false
      });
      return proxy;
    };
    if (typeof Symbol !== "undefined")
      LRUCache2.prototype[Symbol.for("nodejs.util.inspect.custom")] = LRUCache2.prototype.inspect;
    LRUCache2.from = function(iterable, Keys, Values, capacity) {
      if (arguments.length < 2) {
        capacity = iterables.guessLength(iterable);
        if (typeof capacity !== "number")
          throw new Error("mnemonist/lru-cache.from: could not guess iterable length. Please provide desired capacity as last argument.");
      } else if (arguments.length === 2) {
        capacity = Keys;
        Keys = null;
        Values = null;
      }
      var cache2 = new LRUCache2(Keys, Values, capacity);
      forEach(iterable, function(value, key) {
        cache2.set(key, value);
      });
      return cache2;
    };
    module.exports = LRUCache2;
  }
});

// node_modules/@aws-sdk/client-dynamodb/dist-es/index.js
var import_dist292 = __toESM(require_dist());
var import_dist293 = __toESM(require_dist2());
var import_dist294 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-dynamodb/dist-es/DynamoDBClient.js
var import_dist79 = __toESM(require_dist());
var import_dist80 = __toESM(require_dist2());
var import_dist81 = __toESM(require_dist3());

// node_modules/@aws-sdk/core/dist-es/submodules/account-id-endpoint/index.js
var import_dist10 = __toESM(require_dist());
var import_dist11 = __toESM(require_dist2());
var import_dist12 = __toESM(require_dist3());

// node_modules/@aws-sdk/core/dist-es/submodules/account-id-endpoint/AccountIdEndpointModeConfigResolver.js
var import_dist4 = __toESM(require_dist());
var import_dist5 = __toESM(require_dist2());
var import_dist6 = __toESM(require_dist3());

// node_modules/@aws-sdk/core/dist-es/submodules/account-id-endpoint/AccountIdEndpointModeConstants.js
var import_dist = __toESM(require_dist());
var import_dist2 = __toESM(require_dist2());
var import_dist3 = __toESM(require_dist3());
var DEFAULT_ACCOUNT_ID_ENDPOINT_MODE = "preferred";
var ACCOUNT_ID_ENDPOINT_MODE_VALUES = ["disabled", "preferred", "required"];
function validateAccountIdEndpointMode(value) {
  return ACCOUNT_ID_ENDPOINT_MODE_VALUES.includes(value);
}

// node_modules/@aws-sdk/core/dist-es/submodules/account-id-endpoint/AccountIdEndpointModeConfigResolver.js
var resolveAccountIdEndpointModeConfig = (input) => {
  const { accountIdEndpointMode } = input;
  const accountIdEndpointModeProvider = normalizeProvider(accountIdEndpointMode ?? DEFAULT_ACCOUNT_ID_ENDPOINT_MODE);
  return Object.assign(input, {
    accountIdEndpointMode: async () => {
      const accIdMode = await accountIdEndpointModeProvider();
      if (!validateAccountIdEndpointMode(accIdMode)) {
        throw new Error(`Invalid value for accountIdEndpointMode: ${accIdMode}. Valid values are: "required", "preferred", "disabled".`);
      }
      return accIdMode;
    }
  });
};

// node_modules/@aws-sdk/core/dist-es/submodules/account-id-endpoint/NodeAccountIdEndpointModeConfigOptions.js
var import_dist7 = __toESM(require_dist());
var import_dist8 = __toESM(require_dist2());
var import_dist9 = __toESM(require_dist3());

// node_modules/@aws-sdk/middleware-endpoint-discovery/dist-es/index.js
var import_dist40 = __toESM(require_dist());
var import_dist41 = __toESM(require_dist2());
var import_dist42 = __toESM(require_dist3());

// node_modules/@aws-sdk/middleware-endpoint-discovery/dist-es/configurations.js
var import_dist13 = __toESM(require_dist());
var import_dist14 = __toESM(require_dist2());
var import_dist15 = __toESM(require_dist3());

// node_modules/@aws-sdk/middleware-endpoint-discovery/dist-es/getEndpointDiscoveryPlugin.js
var import_dist25 = __toESM(require_dist());
var import_dist26 = __toESM(require_dist2());
var import_dist27 = __toESM(require_dist3());

// node_modules/@aws-sdk/middleware-endpoint-discovery/dist-es/endpointDiscoveryMiddleware.js
var import_dist22 = __toESM(require_dist());
var import_dist23 = __toESM(require_dist2());
var import_dist24 = __toESM(require_dist3());

// node_modules/@aws-sdk/middleware-endpoint-discovery/dist-es/getCacheKey.js
var import_dist16 = __toESM(require_dist());
var import_dist17 = __toESM(require_dist2());
var import_dist18 = __toESM(require_dist3());

// node_modules/@aws-sdk/middleware-endpoint-discovery/dist-es/updateDiscoveredEndpointInCache.js
var import_dist19 = __toESM(require_dist());
var import_dist20 = __toESM(require_dist2());
var import_dist21 = __toESM(require_dist3());

// node_modules/@aws-sdk/middleware-endpoint-discovery/dist-es/resolveEndpointDiscoveryConfig.js
var import_dist37 = __toESM(require_dist());
var import_dist38 = __toESM(require_dist2());
var import_dist39 = __toESM(require_dist3());

// node_modules/@aws-sdk/endpoint-cache/dist-es/index.js
var import_dist34 = __toESM(require_dist());
var import_dist35 = __toESM(require_dist2());
var import_dist36 = __toESM(require_dist3());

// node_modules/@aws-sdk/endpoint-cache/dist-es/Endpoint.js
var import_dist28 = __toESM(require_dist());
var import_dist29 = __toESM(require_dist2());
var import_dist30 = __toESM(require_dist3());

// node_modules/@aws-sdk/endpoint-cache/dist-es/EndpointCache.js
var import_dist31 = __toESM(require_dist());
var import_dist32 = __toESM(require_dist2());
var import_dist33 = __toESM(require_dist3());
var import_lru_cache = __toESM(require_lru_cache());
var EndpointCache2 = class {
  constructor(capacity) {
    __publicField(this, "cache");
    this.cache = new import_lru_cache.default(capacity);
  }
  getEndpoint(key) {
    const endpointsWithExpiry = this.get(key);
    if (!endpointsWithExpiry || endpointsWithExpiry.length === 0) {
      return void 0;
    }
    const endpoints = endpointsWithExpiry.map((endpoint) => endpoint.Address);
    return endpoints[Math.floor(Math.random() * endpoints.length)];
  }
  get(key) {
    if (!this.has(key)) {
      return;
    }
    const value = this.cache.get(key);
    if (!value) {
      return;
    }
    const now = Date.now();
    const endpointsWithExpiry = value.filter((endpoint) => now < endpoint.Expires);
    if (endpointsWithExpiry.length === 0) {
      this.delete(key);
      return void 0;
    }
    return endpointsWithExpiry;
  }
  set(key, endpoints) {
    const now = Date.now();
    this.cache.set(key, endpoints.map(({ Address, CachePeriodInMinutes }) => ({
      Address,
      Expires: now + CachePeriodInMinutes * 60 * 1e3
    })));
  }
  delete(key) {
    this.cache.set(key, []);
  }
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }
    const endpoints = this.cache.peek(key);
    if (!endpoints) {
      return false;
    }
    return endpoints.length > 0;
  }
  clear() {
    this.cache.clear();
  }
};

// node_modules/@aws-sdk/middleware-endpoint-discovery/dist-es/resolveEndpointDiscoveryConfig.js
var resolveEndpointDiscoveryConfig = (input, { endpointDiscoveryCommandCtor }) => {
  const { endpointCacheSize, endpointDiscoveryEnabled, endpointDiscoveryEnabledProvider } = input;
  return Object.assign(input, {
    endpointDiscoveryCommandCtor,
    endpointCache: new EndpointCache2(endpointCacheSize ?? 1e3),
    endpointDiscoveryEnabled: endpointDiscoveryEnabled !== void 0 ? () => Promise.resolve(endpointDiscoveryEnabled) : endpointDiscoveryEnabledProvider,
    isClientEndpointDiscoveryEnabled: endpointDiscoveryEnabled !== void 0
  });
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/auth/httpAuthSchemeProvider.js
var import_dist43 = __toESM(require_dist());
var import_dist44 = __toESM(require_dist2());
var import_dist45 = __toESM(require_dist3());
var defaultDynamoDBHttpAuthSchemeParametersProvider = async (config, context, input) => {
  return {
    operation: getSmithyContext(context).operation,
    region: await normalizeProvider(config.region)() || (() => {
      throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
    })()
  };
};
function createAwsAuthSigv4HttpAuthOption(authParameters) {
  return {
    schemeId: "aws.auth#sigv4",
    signingProperties: {
      name: "dynamodb",
      region: authParameters.region
    },
    propertiesExtractor: (config, context) => ({
      signingProperties: {
        config,
        context
      }
    })
  };
}
var defaultDynamoDBHttpAuthSchemeProvider = (authParameters) => {
  const options = [];
  switch (authParameters.operation) {
    default: {
      options.push(createAwsAuthSigv4HttpAuthOption(authParameters));
    }
  }
  return options;
};
var resolveHttpAuthSchemeConfig = (config) => {
  const config_0 = resolveAwsSdkSigV4Config(config);
  return Object.assign(config_0, {});
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/DescribeEndpointsCommand.js
var import_dist58 = __toESM(require_dist());
var import_dist59 = __toESM(require_dist2());
var import_dist60 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-dynamodb/dist-es/endpoint/EndpointParameters.js
var import_dist46 = __toESM(require_dist());
var import_dist47 = __toESM(require_dist2());
var import_dist48 = __toESM(require_dist3());
var resolveClientEndpointParameters = (options) => {
  return Object.assign(options, {
    useDualstackEndpoint: options.useDualstackEndpoint ?? false,
    useFipsEndpoint: options.useFipsEndpoint ?? false,
    defaultSigningName: "dynamodb"
  });
};
var commonParams = {
  UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
  AccountId: { type: "builtInParams", name: "accountId" },
  Endpoint: { type: "builtInParams", name: "endpoint" },
  Region: { type: "builtInParams", name: "region" },
  UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" },
  AccountIdEndpointMode: { type: "builtInParams", name: "accountIdEndpointMode" }
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/protocols/Aws_json1_0.js
var import_dist55 = __toESM(require_dist());
var import_dist56 = __toESM(require_dist2());
var import_dist57 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-dynamodb/dist-es/models/DynamoDBServiceException.js
var import_dist49 = __toESM(require_dist());
var import_dist50 = __toESM(require_dist2());
var import_dist51 = __toESM(require_dist3());
var DynamoDBServiceException = class _DynamoDBServiceException extends ServiceException {
  constructor(options) {
    super(options);
    Object.setPrototypeOf(this, _DynamoDBServiceException.prototype);
  }
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/models/models_0.js
var import_dist52 = __toESM(require_dist());
var import_dist53 = __toESM(require_dist2());
var import_dist54 = __toESM(require_dist3());
var ApproximateCreationDateTimePrecision = {
  MICROSECOND: "MICROSECOND",
  MILLISECOND: "MILLISECOND"
};
var AttributeAction = {
  ADD: "ADD",
  DELETE: "DELETE",
  PUT: "PUT"
};
var ScalarAttributeType = {
  B: "B",
  N: "N",
  S: "S"
};
var BackupStatus = {
  AVAILABLE: "AVAILABLE",
  CREATING: "CREATING",
  DELETED: "DELETED"
};
var BackupType = {
  AWS_BACKUP: "AWS_BACKUP",
  SYSTEM: "SYSTEM",
  USER: "USER"
};
var BillingMode = {
  PAY_PER_REQUEST: "PAY_PER_REQUEST",
  PROVISIONED: "PROVISIONED"
};
var KeyType = {
  HASH: "HASH",
  RANGE: "RANGE"
};
var ProjectionType = {
  ALL: "ALL",
  INCLUDE: "INCLUDE",
  KEYS_ONLY: "KEYS_ONLY"
};
var SSEType = {
  AES256: "AES256",
  KMS: "KMS"
};
var SSEStatus = {
  DISABLED: "DISABLED",
  DISABLING: "DISABLING",
  ENABLED: "ENABLED",
  ENABLING: "ENABLING",
  UPDATING: "UPDATING"
};
var StreamViewType = {
  KEYS_ONLY: "KEYS_ONLY",
  NEW_AND_OLD_IMAGES: "NEW_AND_OLD_IMAGES",
  NEW_IMAGE: "NEW_IMAGE",
  OLD_IMAGE: "OLD_IMAGE"
};
var TimeToLiveStatus = {
  DISABLED: "DISABLED",
  DISABLING: "DISABLING",
  ENABLED: "ENABLED",
  ENABLING: "ENABLING"
};
var BackupInUseException = class _BackupInUseException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "BackupInUseException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "BackupInUseException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _BackupInUseException.prototype);
  }
};
var BackupNotFoundException = class _BackupNotFoundException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "BackupNotFoundException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "BackupNotFoundException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _BackupNotFoundException.prototype);
  }
};
var BackupTypeFilter = {
  ALL: "ALL",
  AWS_BACKUP: "AWS_BACKUP",
  SYSTEM: "SYSTEM",
  USER: "USER"
};
var ReturnConsumedCapacity = {
  INDEXES: "INDEXES",
  NONE: "NONE",
  TOTAL: "TOTAL"
};
var ReturnValuesOnConditionCheckFailure = {
  ALL_OLD: "ALL_OLD",
  NONE: "NONE"
};
var BatchStatementErrorCodeEnum = {
  AccessDenied: "AccessDenied",
  ConditionalCheckFailed: "ConditionalCheckFailed",
  DuplicateItem: "DuplicateItem",
  InternalServerError: "InternalServerError",
  ItemCollectionSizeLimitExceeded: "ItemCollectionSizeLimitExceeded",
  ProvisionedThroughputExceeded: "ProvisionedThroughputExceeded",
  RequestLimitExceeded: "RequestLimitExceeded",
  ResourceNotFound: "ResourceNotFound",
  ThrottlingError: "ThrottlingError",
  TransactionConflict: "TransactionConflict",
  ValidationError: "ValidationError"
};
var InternalServerError = class _InternalServerError extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "InternalServerError",
      $fault: "server",
      ...opts
    });
    __publicField(this, "name", "InternalServerError");
    __publicField(this, "$fault", "server");
    Object.setPrototypeOf(this, _InternalServerError.prototype);
  }
};
var RequestLimitExceeded = class _RequestLimitExceeded extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "RequestLimitExceeded",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "RequestLimitExceeded");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _RequestLimitExceeded.prototype);
  }
};
var InvalidEndpointException = class _InvalidEndpointException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "InvalidEndpointException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "InvalidEndpointException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    Object.setPrototypeOf(this, _InvalidEndpointException.prototype);
    this.Message = opts.Message;
  }
};
var ProvisionedThroughputExceededException = class _ProvisionedThroughputExceededException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "ProvisionedThroughputExceededException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ProvisionedThroughputExceededException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _ProvisionedThroughputExceededException.prototype);
  }
};
var ResourceNotFoundException = class _ResourceNotFoundException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "ResourceNotFoundException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ResourceNotFoundException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _ResourceNotFoundException.prototype);
  }
};
var ReturnItemCollectionMetrics = {
  NONE: "NONE",
  SIZE: "SIZE"
};
var ItemCollectionSizeLimitExceededException = class _ItemCollectionSizeLimitExceededException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "ItemCollectionSizeLimitExceededException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ItemCollectionSizeLimitExceededException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _ItemCollectionSizeLimitExceededException.prototype);
  }
};
var ComparisonOperator = {
  BEGINS_WITH: "BEGINS_WITH",
  BETWEEN: "BETWEEN",
  CONTAINS: "CONTAINS",
  EQ: "EQ",
  GE: "GE",
  GT: "GT",
  IN: "IN",
  LE: "LE",
  LT: "LT",
  NE: "NE",
  NOT_CONTAINS: "NOT_CONTAINS",
  NOT_NULL: "NOT_NULL",
  NULL: "NULL"
};
var ConditionalOperator = {
  AND: "AND",
  OR: "OR"
};
var ContinuousBackupsStatus = {
  DISABLED: "DISABLED",
  ENABLED: "ENABLED"
};
var PointInTimeRecoveryStatus = {
  DISABLED: "DISABLED",
  ENABLED: "ENABLED"
};
var ContinuousBackupsUnavailableException = class _ContinuousBackupsUnavailableException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "ContinuousBackupsUnavailableException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ContinuousBackupsUnavailableException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _ContinuousBackupsUnavailableException.prototype);
  }
};
var ContributorInsightsAction = {
  DISABLE: "DISABLE",
  ENABLE: "ENABLE"
};
var ContributorInsightsStatus = {
  DISABLED: "DISABLED",
  DISABLING: "DISABLING",
  ENABLED: "ENABLED",
  ENABLING: "ENABLING",
  FAILED: "FAILED"
};
var LimitExceededException = class _LimitExceededException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "LimitExceededException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "LimitExceededException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _LimitExceededException.prototype);
  }
};
var TableInUseException = class _TableInUseException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "TableInUseException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "TableInUseException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _TableInUseException.prototype);
  }
};
var TableNotFoundException = class _TableNotFoundException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "TableNotFoundException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "TableNotFoundException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _TableNotFoundException.prototype);
  }
};
var GlobalTableStatus = {
  ACTIVE: "ACTIVE",
  CREATING: "CREATING",
  DELETING: "DELETING",
  UPDATING: "UPDATING"
};
var IndexStatus = {
  ACTIVE: "ACTIVE",
  CREATING: "CREATING",
  DELETING: "DELETING",
  UPDATING: "UPDATING"
};
var ReplicaStatus = {
  ACTIVE: "ACTIVE",
  CREATING: "CREATING",
  CREATION_FAILED: "CREATION_FAILED",
  DELETING: "DELETING",
  INACCESSIBLE_ENCRYPTION_CREDENTIALS: "INACCESSIBLE_ENCRYPTION_CREDENTIALS",
  REGION_DISABLED: "REGION_DISABLED",
  UPDATING: "UPDATING"
};
var TableClass = {
  STANDARD: "STANDARD",
  STANDARD_INFREQUENT_ACCESS: "STANDARD_INFREQUENT_ACCESS"
};
var TableStatus = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
  ARCHIVING: "ARCHIVING",
  CREATING: "CREATING",
  DELETING: "DELETING",
  INACCESSIBLE_ENCRYPTION_CREDENTIALS: "INACCESSIBLE_ENCRYPTION_CREDENTIALS",
  UPDATING: "UPDATING"
};
var GlobalTableAlreadyExistsException = class _GlobalTableAlreadyExistsException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "GlobalTableAlreadyExistsException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "GlobalTableAlreadyExistsException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _GlobalTableAlreadyExistsException.prototype);
  }
};
var MultiRegionConsistency = {
  EVENTUAL: "EVENTUAL",
  STRONG: "STRONG"
};
var ResourceInUseException = class _ResourceInUseException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "ResourceInUseException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ResourceInUseException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _ResourceInUseException.prototype);
  }
};
var ReturnValue = {
  ALL_NEW: "ALL_NEW",
  ALL_OLD: "ALL_OLD",
  NONE: "NONE",
  UPDATED_NEW: "UPDATED_NEW",
  UPDATED_OLD: "UPDATED_OLD"
};
var ReplicatedWriteConflictException = class _ReplicatedWriteConflictException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "ReplicatedWriteConflictException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ReplicatedWriteConflictException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _ReplicatedWriteConflictException.prototype);
  }
};
var TransactionConflictException = class _TransactionConflictException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "TransactionConflictException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "TransactionConflictException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _TransactionConflictException.prototype);
  }
};
var PolicyNotFoundException = class _PolicyNotFoundException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "PolicyNotFoundException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "PolicyNotFoundException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _PolicyNotFoundException.prototype);
  }
};
var ExportFormat = {
  DYNAMODB_JSON: "DYNAMODB_JSON",
  ION: "ION"
};
var ExportStatus = {
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  IN_PROGRESS: "IN_PROGRESS"
};
var ExportType = {
  FULL_EXPORT: "FULL_EXPORT",
  INCREMENTAL_EXPORT: "INCREMENTAL_EXPORT"
};
var ExportViewType = {
  NEW_AND_OLD_IMAGES: "NEW_AND_OLD_IMAGES",
  NEW_IMAGE: "NEW_IMAGE"
};
var S3SseAlgorithm = {
  AES256: "AES256",
  KMS: "KMS"
};
var ExportNotFoundException = class _ExportNotFoundException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "ExportNotFoundException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ExportNotFoundException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _ExportNotFoundException.prototype);
  }
};
var GlobalTableNotFoundException = class _GlobalTableNotFoundException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "GlobalTableNotFoundException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "GlobalTableNotFoundException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _GlobalTableNotFoundException.prototype);
  }
};
var ImportStatus = {
  CANCELLED: "CANCELLED",
  CANCELLING: "CANCELLING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  IN_PROGRESS: "IN_PROGRESS"
};
var InputCompressionType = {
  GZIP: "GZIP",
  NONE: "NONE",
  ZSTD: "ZSTD"
};
var InputFormat = {
  CSV: "CSV",
  DYNAMODB_JSON: "DYNAMODB_JSON",
  ION: "ION"
};
var ImportNotFoundException = class _ImportNotFoundException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "ImportNotFoundException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ImportNotFoundException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _ImportNotFoundException.prototype);
  }
};
var DestinationStatus = {
  ACTIVE: "ACTIVE",
  DISABLED: "DISABLED",
  DISABLING: "DISABLING",
  ENABLE_FAILED: "ENABLE_FAILED",
  ENABLING: "ENABLING",
  UPDATING: "UPDATING"
};
var DuplicateItemException = class _DuplicateItemException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "DuplicateItemException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "DuplicateItemException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _DuplicateItemException.prototype);
  }
};
var IdempotentParameterMismatchException = class _IdempotentParameterMismatchException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "IdempotentParameterMismatchException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "IdempotentParameterMismatchException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    Object.setPrototypeOf(this, _IdempotentParameterMismatchException.prototype);
    this.Message = opts.Message;
  }
};
var TransactionInProgressException = class _TransactionInProgressException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "TransactionInProgressException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "TransactionInProgressException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    Object.setPrototypeOf(this, _TransactionInProgressException.prototype);
    this.Message = opts.Message;
  }
};
var ExportConflictException = class _ExportConflictException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "ExportConflictException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ExportConflictException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _ExportConflictException.prototype);
  }
};
var InvalidExportTimeException = class _InvalidExportTimeException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "InvalidExportTimeException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "InvalidExportTimeException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _InvalidExportTimeException.prototype);
  }
};
var PointInTimeRecoveryUnavailableException = class _PointInTimeRecoveryUnavailableException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "PointInTimeRecoveryUnavailableException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "PointInTimeRecoveryUnavailableException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _PointInTimeRecoveryUnavailableException.prototype);
  }
};
var ImportConflictException = class _ImportConflictException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "ImportConflictException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ImportConflictException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _ImportConflictException.prototype);
  }
};
var Select = {
  ALL_ATTRIBUTES: "ALL_ATTRIBUTES",
  ALL_PROJECTED_ATTRIBUTES: "ALL_PROJECTED_ATTRIBUTES",
  COUNT: "COUNT",
  SPECIFIC_ATTRIBUTES: "SPECIFIC_ATTRIBUTES"
};
var TableAlreadyExistsException = class _TableAlreadyExistsException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "TableAlreadyExistsException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "TableAlreadyExistsException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _TableAlreadyExistsException.prototype);
  }
};
var InvalidRestoreTimeException = class _InvalidRestoreTimeException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "InvalidRestoreTimeException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "InvalidRestoreTimeException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _InvalidRestoreTimeException.prototype);
  }
};
var ReplicaAlreadyExistsException = class _ReplicaAlreadyExistsException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "ReplicaAlreadyExistsException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ReplicaAlreadyExistsException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _ReplicaAlreadyExistsException.prototype);
  }
};
var ReplicaNotFoundException = class _ReplicaNotFoundException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "ReplicaNotFoundException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ReplicaNotFoundException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _ReplicaNotFoundException.prototype);
  }
};
var IndexNotFoundException = class _IndexNotFoundException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "IndexNotFoundException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "IndexNotFoundException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _IndexNotFoundException.prototype);
  }
};
var AttributeValue;
(function(AttributeValue2) {
  AttributeValue2.visit = (value, visitor) => {
    if (value.S !== void 0)
      return visitor.S(value.S);
    if (value.N !== void 0)
      return visitor.N(value.N);
    if (value.B !== void 0)
      return visitor.B(value.B);
    if (value.SS !== void 0)
      return visitor.SS(value.SS);
    if (value.NS !== void 0)
      return visitor.NS(value.NS);
    if (value.BS !== void 0)
      return visitor.BS(value.BS);
    if (value.M !== void 0)
      return visitor.M(value.M);
    if (value.L !== void 0)
      return visitor.L(value.L);
    if (value.NULL !== void 0)
      return visitor.NULL(value.NULL);
    if (value.BOOL !== void 0)
      return visitor.BOOL(value.BOOL);
    return visitor._(value.$unknown[0], value.$unknown[1]);
  };
})(AttributeValue || (AttributeValue = {}));
var ConditionalCheckFailedException = class _ConditionalCheckFailedException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "ConditionalCheckFailedException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ConditionalCheckFailedException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Item");
    Object.setPrototypeOf(this, _ConditionalCheckFailedException.prototype);
    this.Item = opts.Item;
  }
};
var TransactionCanceledException = class _TransactionCanceledException extends DynamoDBServiceException {
  constructor(opts) {
    super({
      name: "TransactionCanceledException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "TransactionCanceledException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    __publicField(this, "CancellationReasons");
    Object.setPrototypeOf(this, _TransactionCanceledException.prototype);
    this.Message = opts.Message;
    this.CancellationReasons = opts.CancellationReasons;
  }
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/protocols/Aws_json1_0.js
var se_BatchExecuteStatementCommand = async (input, context) => {
  const headers = sharedHeaders("BatchExecuteStatement");
  let body;
  body = JSON.stringify(se_BatchExecuteStatementInput(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_BatchGetItemCommand = async (input, context) => {
  const headers = sharedHeaders("BatchGetItem");
  let body;
  body = JSON.stringify(se_BatchGetItemInput(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_BatchWriteItemCommand = async (input, context) => {
  const headers = sharedHeaders("BatchWriteItem");
  let body;
  body = JSON.stringify(se_BatchWriteItemInput(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_CreateBackupCommand = async (input, context) => {
  const headers = sharedHeaders("CreateBackup");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_CreateGlobalTableCommand = async (input, context) => {
  const headers = sharedHeaders("CreateGlobalTable");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_CreateTableCommand = async (input, context) => {
  const headers = sharedHeaders("CreateTable");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DeleteBackupCommand = async (input, context) => {
  const headers = sharedHeaders("DeleteBackup");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DeleteItemCommand = async (input, context) => {
  const headers = sharedHeaders("DeleteItem");
  let body;
  body = JSON.stringify(se_DeleteItemInput(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DeleteResourcePolicyCommand = async (input, context) => {
  const headers = sharedHeaders("DeleteResourcePolicy");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DeleteTableCommand = async (input, context) => {
  const headers = sharedHeaders("DeleteTable");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeBackupCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeBackup");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeContinuousBackupsCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeContinuousBackups");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeContributorInsightsCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeContributorInsights");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeEndpointsCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeEndpoints");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeExportCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeExport");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeGlobalTableCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeGlobalTable");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeGlobalTableSettingsCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeGlobalTableSettings");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeImportCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeImport");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeKinesisStreamingDestinationCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeKinesisStreamingDestination");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeLimitsCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeLimits");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeTableCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeTable");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeTableReplicaAutoScalingCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeTableReplicaAutoScaling");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeTimeToLiveCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeTimeToLive");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DisableKinesisStreamingDestinationCommand = async (input, context) => {
  const headers = sharedHeaders("DisableKinesisStreamingDestination");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_EnableKinesisStreamingDestinationCommand = async (input, context) => {
  const headers = sharedHeaders("EnableKinesisStreamingDestination");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ExecuteStatementCommand = async (input, context) => {
  const headers = sharedHeaders("ExecuteStatement");
  let body;
  body = JSON.stringify(se_ExecuteStatementInput(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ExecuteTransactionCommand = async (input, context) => {
  const headers = sharedHeaders("ExecuteTransaction");
  let body;
  body = JSON.stringify(se_ExecuteTransactionInput(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ExportTableToPointInTimeCommand = async (input, context) => {
  const headers = sharedHeaders("ExportTableToPointInTime");
  let body;
  body = JSON.stringify(se_ExportTableToPointInTimeInput(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetItemCommand = async (input, context) => {
  const headers = sharedHeaders("GetItem");
  let body;
  body = JSON.stringify(se_GetItemInput(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetResourcePolicyCommand = async (input, context) => {
  const headers = sharedHeaders("GetResourcePolicy");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ImportTableCommand = async (input, context) => {
  const headers = sharedHeaders("ImportTable");
  let body;
  body = JSON.stringify(se_ImportTableInput(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ListBackupsCommand = async (input, context) => {
  const headers = sharedHeaders("ListBackups");
  let body;
  body = JSON.stringify(se_ListBackupsInput(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ListContributorInsightsCommand = async (input, context) => {
  const headers = sharedHeaders("ListContributorInsights");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ListExportsCommand = async (input, context) => {
  const headers = sharedHeaders("ListExports");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ListGlobalTablesCommand = async (input, context) => {
  const headers = sharedHeaders("ListGlobalTables");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ListImportsCommand = async (input, context) => {
  const headers = sharedHeaders("ListImports");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ListTablesCommand = async (input, context) => {
  const headers = sharedHeaders("ListTables");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ListTagsOfResourceCommand = async (input, context) => {
  const headers = sharedHeaders("ListTagsOfResource");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_PutItemCommand = async (input, context) => {
  const headers = sharedHeaders("PutItem");
  let body;
  body = JSON.stringify(se_PutItemInput(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_PutResourcePolicyCommand = async (input, context) => {
  const headers = sharedHeaders("PutResourcePolicy");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_QueryCommand = async (input, context) => {
  const headers = sharedHeaders("Query");
  let body;
  body = JSON.stringify(se_QueryInput(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_RestoreTableFromBackupCommand = async (input, context) => {
  const headers = sharedHeaders("RestoreTableFromBackup");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_RestoreTableToPointInTimeCommand = async (input, context) => {
  const headers = sharedHeaders("RestoreTableToPointInTime");
  let body;
  body = JSON.stringify(se_RestoreTableToPointInTimeInput(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ScanCommand = async (input, context) => {
  const headers = sharedHeaders("Scan");
  let body;
  body = JSON.stringify(se_ScanInput(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_TagResourceCommand = async (input, context) => {
  const headers = sharedHeaders("TagResource");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_TransactGetItemsCommand = async (input, context) => {
  const headers = sharedHeaders("TransactGetItems");
  let body;
  body = JSON.stringify(se_TransactGetItemsInput(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_TransactWriteItemsCommand = async (input, context) => {
  const headers = sharedHeaders("TransactWriteItems");
  let body;
  body = JSON.stringify(se_TransactWriteItemsInput(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_UntagResourceCommand = async (input, context) => {
  const headers = sharedHeaders("UntagResource");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_UpdateContinuousBackupsCommand = async (input, context) => {
  const headers = sharedHeaders("UpdateContinuousBackups");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_UpdateContributorInsightsCommand = async (input, context) => {
  const headers = sharedHeaders("UpdateContributorInsights");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_UpdateGlobalTableCommand = async (input, context) => {
  const headers = sharedHeaders("UpdateGlobalTable");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_UpdateGlobalTableSettingsCommand = async (input, context) => {
  const headers = sharedHeaders("UpdateGlobalTableSettings");
  let body;
  body = JSON.stringify(se_UpdateGlobalTableSettingsInput(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_UpdateItemCommand = async (input, context) => {
  const headers = sharedHeaders("UpdateItem");
  let body;
  body = JSON.stringify(se_UpdateItemInput(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_UpdateKinesisStreamingDestinationCommand = async (input, context) => {
  const headers = sharedHeaders("UpdateKinesisStreamingDestination");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_UpdateTableCommand = async (input, context) => {
  const headers = sharedHeaders("UpdateTable");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_UpdateTableReplicaAutoScalingCommand = async (input, context) => {
  const headers = sharedHeaders("UpdateTableReplicaAutoScaling");
  let body;
  body = JSON.stringify(se_UpdateTableReplicaAutoScalingInput(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_UpdateTimeToLiveCommand = async (input, context) => {
  const headers = sharedHeaders("UpdateTimeToLive");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var de_BatchExecuteStatementCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_BatchExecuteStatementOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_BatchGetItemCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_BatchGetItemOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_BatchWriteItemCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_BatchWriteItemOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_CreateBackupCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_CreateBackupOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_CreateGlobalTableCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_CreateGlobalTableOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_CreateTableCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_CreateTableOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DeleteBackupCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DeleteBackupOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DeleteItemCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DeleteItemOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DeleteResourcePolicyCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = _json(data);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DeleteTableCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DeleteTableOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeBackupCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DescribeBackupOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeContinuousBackupsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DescribeContinuousBackupsOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeContributorInsightsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DescribeContributorInsightsOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeEndpointsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = _json(data);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeExportCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DescribeExportOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeGlobalTableCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DescribeGlobalTableOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeGlobalTableSettingsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DescribeGlobalTableSettingsOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeImportCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DescribeImportOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeKinesisStreamingDestinationCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = _json(data);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeLimitsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = _json(data);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeTableCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DescribeTableOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeTableReplicaAutoScalingCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DescribeTableReplicaAutoScalingOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeTimeToLiveCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = _json(data);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DisableKinesisStreamingDestinationCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = _json(data);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_EnableKinesisStreamingDestinationCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = _json(data);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_ExecuteStatementCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_ExecuteStatementOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_ExecuteTransactionCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_ExecuteTransactionOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_ExportTableToPointInTimeCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_ExportTableToPointInTimeOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_GetItemCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_GetItemOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_GetResourcePolicyCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = _json(data);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_ImportTableCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_ImportTableOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_ListBackupsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_ListBackupsOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_ListContributorInsightsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = _json(data);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_ListExportsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = _json(data);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_ListGlobalTablesCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = _json(data);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_ListImportsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_ListImportsOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_ListTablesCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = _json(data);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_ListTagsOfResourceCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = _json(data);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_PutItemCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_PutItemOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_PutResourcePolicyCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = _json(data);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_QueryCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_QueryOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_RestoreTableFromBackupCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_RestoreTableFromBackupOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_RestoreTableToPointInTimeCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_RestoreTableToPointInTimeOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_ScanCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_ScanOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_TagResourceCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  await collectBody(output.body, context);
  const response = {
    $metadata: deserializeMetadata(output)
  };
  return response;
};
var de_TransactGetItemsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_TransactGetItemsOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_TransactWriteItemsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_TransactWriteItemsOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_UntagResourceCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  await collectBody(output.body, context);
  const response = {
    $metadata: deserializeMetadata(output)
  };
  return response;
};
var de_UpdateContinuousBackupsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_UpdateContinuousBackupsOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_UpdateContributorInsightsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = _json(data);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_UpdateGlobalTableCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_UpdateGlobalTableOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_UpdateGlobalTableSettingsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_UpdateGlobalTableSettingsOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_UpdateItemCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_UpdateItemOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_UpdateKinesisStreamingDestinationCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = _json(data);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_UpdateTableCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_UpdateTableOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_UpdateTableReplicaAutoScalingCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_UpdateTableReplicaAutoScalingOutput(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_UpdateTimeToLiveCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = _json(data);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_CommandError = async (output, context) => {
  const parsedOutput = {
    ...output,
    body: await parseJsonErrorBody(output.body, context)
  };
  const errorCode = loadRestJsonErrorCode(output, parsedOutput.body);
  switch (errorCode) {
    case "InternalServerError":
    case "com.amazonaws.dynamodb#InternalServerError":
      throw await de_InternalServerErrorRes(parsedOutput, context);
    case "RequestLimitExceeded":
    case "com.amazonaws.dynamodb#RequestLimitExceeded":
      throw await de_RequestLimitExceededRes(parsedOutput, context);
    case "InvalidEndpointException":
    case "com.amazonaws.dynamodb#InvalidEndpointException":
      throw await de_InvalidEndpointExceptionRes(parsedOutput, context);
    case "ProvisionedThroughputExceededException":
    case "com.amazonaws.dynamodb#ProvisionedThroughputExceededException":
      throw await de_ProvisionedThroughputExceededExceptionRes(parsedOutput, context);
    case "ResourceNotFoundException":
    case "com.amazonaws.dynamodb#ResourceNotFoundException":
      throw await de_ResourceNotFoundExceptionRes(parsedOutput, context);
    case "ItemCollectionSizeLimitExceededException":
    case "com.amazonaws.dynamodb#ItemCollectionSizeLimitExceededException":
      throw await de_ItemCollectionSizeLimitExceededExceptionRes(parsedOutput, context);
    case "BackupInUseException":
    case "com.amazonaws.dynamodb#BackupInUseException":
      throw await de_BackupInUseExceptionRes(parsedOutput, context);
    case "ContinuousBackupsUnavailableException":
    case "com.amazonaws.dynamodb#ContinuousBackupsUnavailableException":
      throw await de_ContinuousBackupsUnavailableExceptionRes(parsedOutput, context);
    case "LimitExceededException":
    case "com.amazonaws.dynamodb#LimitExceededException":
      throw await de_LimitExceededExceptionRes(parsedOutput, context);
    case "TableInUseException":
    case "com.amazonaws.dynamodb#TableInUseException":
      throw await de_TableInUseExceptionRes(parsedOutput, context);
    case "TableNotFoundException":
    case "com.amazonaws.dynamodb#TableNotFoundException":
      throw await de_TableNotFoundExceptionRes(parsedOutput, context);
    case "GlobalTableAlreadyExistsException":
    case "com.amazonaws.dynamodb#GlobalTableAlreadyExistsException":
      throw await de_GlobalTableAlreadyExistsExceptionRes(parsedOutput, context);
    case "ResourceInUseException":
    case "com.amazonaws.dynamodb#ResourceInUseException":
      throw await de_ResourceInUseExceptionRes(parsedOutput, context);
    case "BackupNotFoundException":
    case "com.amazonaws.dynamodb#BackupNotFoundException":
      throw await de_BackupNotFoundExceptionRes(parsedOutput, context);
    case "ConditionalCheckFailedException":
    case "com.amazonaws.dynamodb#ConditionalCheckFailedException":
      throw await de_ConditionalCheckFailedExceptionRes(parsedOutput, context);
    case "ReplicatedWriteConflictException":
    case "com.amazonaws.dynamodb#ReplicatedWriteConflictException":
      throw await de_ReplicatedWriteConflictExceptionRes(parsedOutput, context);
    case "TransactionConflictException":
    case "com.amazonaws.dynamodb#TransactionConflictException":
      throw await de_TransactionConflictExceptionRes(parsedOutput, context);
    case "PolicyNotFoundException":
    case "com.amazonaws.dynamodb#PolicyNotFoundException":
      throw await de_PolicyNotFoundExceptionRes(parsedOutput, context);
    case "ExportNotFoundException":
    case "com.amazonaws.dynamodb#ExportNotFoundException":
      throw await de_ExportNotFoundExceptionRes(parsedOutput, context);
    case "GlobalTableNotFoundException":
    case "com.amazonaws.dynamodb#GlobalTableNotFoundException":
      throw await de_GlobalTableNotFoundExceptionRes(parsedOutput, context);
    case "ImportNotFoundException":
    case "com.amazonaws.dynamodb#ImportNotFoundException":
      throw await de_ImportNotFoundExceptionRes(parsedOutput, context);
    case "DuplicateItemException":
    case "com.amazonaws.dynamodb#DuplicateItemException":
      throw await de_DuplicateItemExceptionRes(parsedOutput, context);
    case "IdempotentParameterMismatchException":
    case "com.amazonaws.dynamodb#IdempotentParameterMismatchException":
      throw await de_IdempotentParameterMismatchExceptionRes(parsedOutput, context);
    case "TransactionCanceledException":
    case "com.amazonaws.dynamodb#TransactionCanceledException":
      throw await de_TransactionCanceledExceptionRes(parsedOutput, context);
    case "TransactionInProgressException":
    case "com.amazonaws.dynamodb#TransactionInProgressException":
      throw await de_TransactionInProgressExceptionRes(parsedOutput, context);
    case "ExportConflictException":
    case "com.amazonaws.dynamodb#ExportConflictException":
      throw await de_ExportConflictExceptionRes(parsedOutput, context);
    case "InvalidExportTimeException":
    case "com.amazonaws.dynamodb#InvalidExportTimeException":
      throw await de_InvalidExportTimeExceptionRes(parsedOutput, context);
    case "PointInTimeRecoveryUnavailableException":
    case "com.amazonaws.dynamodb#PointInTimeRecoveryUnavailableException":
      throw await de_PointInTimeRecoveryUnavailableExceptionRes(parsedOutput, context);
    case "ImportConflictException":
    case "com.amazonaws.dynamodb#ImportConflictException":
      throw await de_ImportConflictExceptionRes(parsedOutput, context);
    case "TableAlreadyExistsException":
    case "com.amazonaws.dynamodb#TableAlreadyExistsException":
      throw await de_TableAlreadyExistsExceptionRes(parsedOutput, context);
    case "InvalidRestoreTimeException":
    case "com.amazonaws.dynamodb#InvalidRestoreTimeException":
      throw await de_InvalidRestoreTimeExceptionRes(parsedOutput, context);
    case "ReplicaAlreadyExistsException":
    case "com.amazonaws.dynamodb#ReplicaAlreadyExistsException":
      throw await de_ReplicaAlreadyExistsExceptionRes(parsedOutput, context);
    case "ReplicaNotFoundException":
    case "com.amazonaws.dynamodb#ReplicaNotFoundException":
      throw await de_ReplicaNotFoundExceptionRes(parsedOutput, context);
    case "IndexNotFoundException":
    case "com.amazonaws.dynamodb#IndexNotFoundException":
      throw await de_IndexNotFoundExceptionRes(parsedOutput, context);
    default:
      const parsedBody = parsedOutput.body;
      return throwDefaultError({
        output,
        parsedBody,
        errorCode
      });
  }
};
var de_BackupInUseExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new BackupInUseException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_BackupNotFoundExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new BackupNotFoundException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_ConditionalCheckFailedExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = de_ConditionalCheckFailedException(body, context);
  const exception = new ConditionalCheckFailedException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_ContinuousBackupsUnavailableExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new ContinuousBackupsUnavailableException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_DuplicateItemExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new DuplicateItemException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_ExportConflictExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new ExportConflictException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_ExportNotFoundExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new ExportNotFoundException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_GlobalTableAlreadyExistsExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new GlobalTableAlreadyExistsException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_GlobalTableNotFoundExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new GlobalTableNotFoundException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_IdempotentParameterMismatchExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new IdempotentParameterMismatchException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_ImportConflictExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new ImportConflictException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_ImportNotFoundExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new ImportNotFoundException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_IndexNotFoundExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new IndexNotFoundException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_InternalServerErrorRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new InternalServerError({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_InvalidEndpointExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new InvalidEndpointException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_InvalidExportTimeExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new InvalidExportTimeException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_InvalidRestoreTimeExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new InvalidRestoreTimeException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_ItemCollectionSizeLimitExceededExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new ItemCollectionSizeLimitExceededException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_LimitExceededExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new LimitExceededException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_PointInTimeRecoveryUnavailableExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new PointInTimeRecoveryUnavailableException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_PolicyNotFoundExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new PolicyNotFoundException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_ProvisionedThroughputExceededExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new ProvisionedThroughputExceededException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_ReplicaAlreadyExistsExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new ReplicaAlreadyExistsException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_ReplicaNotFoundExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new ReplicaNotFoundException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_ReplicatedWriteConflictExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new ReplicatedWriteConflictException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_RequestLimitExceededRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new RequestLimitExceeded({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_ResourceInUseExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new ResourceInUseException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_ResourceNotFoundExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new ResourceNotFoundException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_TableAlreadyExistsExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new TableAlreadyExistsException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_TableInUseExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new TableInUseException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_TableNotFoundExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new TableNotFoundException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_TransactionCanceledExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = de_TransactionCanceledException(body, context);
  const exception = new TransactionCanceledException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_TransactionConflictExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new TransactionConflictException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_TransactionInProgressExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new TransactionInProgressException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var se_AttributeUpdates = (input, context) => {
  return Object.entries(input).reduce((acc, [key, value]) => {
    if (value === null) {
      return acc;
    }
    acc[key] = se_AttributeValueUpdate(value, context);
    return acc;
  }, {});
};
var se_AttributeValue = (input, context) => {
  return AttributeValue.visit(input, {
    B: (value) => ({ B: context.base64Encoder(value) }),
    BOOL: (value) => ({ BOOL: value }),
    BS: (value) => ({ BS: se_BinarySetAttributeValue(value, context) }),
    L: (value) => ({ L: se_ListAttributeValue(value, context) }),
    M: (value) => ({ M: se_MapAttributeValue(value, context) }),
    N: (value) => ({ N: value }),
    NS: (value) => ({ NS: _json(value) }),
    NULL: (value) => ({ NULL: value }),
    S: (value) => ({ S: value }),
    SS: (value) => ({ SS: _json(value) }),
    _: (name, value) => ({ [name]: value })
  });
};
var se_AttributeValueList = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    return se_AttributeValue(entry, context);
  });
};
var se_AttributeValueUpdate = (input, context) => {
  return take(input, {
    Action: [],
    Value: (_) => se_AttributeValue(_, context)
  });
};
var se_AutoScalingPolicyUpdate = (input, context) => {
  return take(input, {
    PolicyName: [],
    TargetTrackingScalingPolicyConfiguration: (_) => se_AutoScalingTargetTrackingScalingPolicyConfigurationUpdate(_, context)
  });
};
var se_AutoScalingSettingsUpdate = (input, context) => {
  return take(input, {
    AutoScalingDisabled: [],
    AutoScalingRoleArn: [],
    MaximumUnits: [],
    MinimumUnits: [],
    ScalingPolicyUpdate: (_) => se_AutoScalingPolicyUpdate(_, context)
  });
};
var se_AutoScalingTargetTrackingScalingPolicyConfigurationUpdate = (input, context) => {
  return take(input, {
    DisableScaleIn: [],
    ScaleInCooldown: [],
    ScaleOutCooldown: [],
    TargetValue: serializeFloat
  });
};
var se_BatchExecuteStatementInput = (input, context) => {
  return take(input, {
    ReturnConsumedCapacity: [],
    Statements: (_) => se_PartiQLBatchRequest(_, context)
  });
};
var se_BatchGetItemInput = (input, context) => {
  return take(input, {
    RequestItems: (_) => se_BatchGetRequestMap(_, context),
    ReturnConsumedCapacity: []
  });
};
var se_BatchGetRequestMap = (input, context) => {
  return Object.entries(input).reduce((acc, [key, value]) => {
    if (value === null) {
      return acc;
    }
    acc[key] = se_KeysAndAttributes(value, context);
    return acc;
  }, {});
};
var se_BatchStatementRequest = (input, context) => {
  return take(input, {
    ConsistentRead: [],
    Parameters: (_) => se_PreparedStatementParameters(_, context),
    ReturnValuesOnConditionCheckFailure: [],
    Statement: []
  });
};
var se_BatchWriteItemInput = (input, context) => {
  return take(input, {
    RequestItems: (_) => se_BatchWriteItemRequestMap(_, context),
    ReturnConsumedCapacity: [],
    ReturnItemCollectionMetrics: []
  });
};
var se_BatchWriteItemRequestMap = (input, context) => {
  return Object.entries(input).reduce((acc, [key, value]) => {
    if (value === null) {
      return acc;
    }
    acc[key] = se_WriteRequests(value, context);
    return acc;
  }, {});
};
var se_BinarySetAttributeValue = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    return context.base64Encoder(entry);
  });
};
var se_Condition = (input, context) => {
  return take(input, {
    AttributeValueList: (_) => se_AttributeValueList(_, context),
    ComparisonOperator: []
  });
};
var se_ConditionCheck = (input, context) => {
  return take(input, {
    ConditionExpression: [],
    ExpressionAttributeNames: _json,
    ExpressionAttributeValues: (_) => se_ExpressionAttributeValueMap(_, context),
    Key: (_) => se_Key(_, context),
    ReturnValuesOnConditionCheckFailure: [],
    TableName: []
  });
};
var se_Delete = (input, context) => {
  return take(input, {
    ConditionExpression: [],
    ExpressionAttributeNames: _json,
    ExpressionAttributeValues: (_) => se_ExpressionAttributeValueMap(_, context),
    Key: (_) => se_Key(_, context),
    ReturnValuesOnConditionCheckFailure: [],
    TableName: []
  });
};
var se_DeleteItemInput = (input, context) => {
  return take(input, {
    ConditionExpression: [],
    ConditionalOperator: [],
    Expected: (_) => se_ExpectedAttributeMap(_, context),
    ExpressionAttributeNames: _json,
    ExpressionAttributeValues: (_) => se_ExpressionAttributeValueMap(_, context),
    Key: (_) => se_Key(_, context),
    ReturnConsumedCapacity: [],
    ReturnItemCollectionMetrics: [],
    ReturnValues: [],
    ReturnValuesOnConditionCheckFailure: [],
    TableName: []
  });
};
var se_DeleteRequest = (input, context) => {
  return take(input, {
    Key: (_) => se_Key(_, context)
  });
};
var se_ExecuteStatementInput = (input, context) => {
  return take(input, {
    ConsistentRead: [],
    Limit: [],
    NextToken: [],
    Parameters: (_) => se_PreparedStatementParameters(_, context),
    ReturnConsumedCapacity: [],
    ReturnValuesOnConditionCheckFailure: [],
    Statement: []
  });
};
var se_ExecuteTransactionInput = (input, context) => {
  return take(input, {
    ClientRequestToken: [true, (_) => _ ?? v4_default()],
    ReturnConsumedCapacity: [],
    TransactStatements: (_) => se_ParameterizedStatements(_, context)
  });
};
var se_ExpectedAttributeMap = (input, context) => {
  return Object.entries(input).reduce((acc, [key, value]) => {
    if (value === null) {
      return acc;
    }
    acc[key] = se_ExpectedAttributeValue(value, context);
    return acc;
  }, {});
};
var se_ExpectedAttributeValue = (input, context) => {
  return take(input, {
    AttributeValueList: (_) => se_AttributeValueList(_, context),
    ComparisonOperator: [],
    Exists: [],
    Value: (_) => se_AttributeValue(_, context)
  });
};
var se_ExportTableToPointInTimeInput = (input, context) => {
  return take(input, {
    ClientToken: [true, (_) => _ ?? v4_default()],
    ExportFormat: [],
    ExportTime: (_) => _.getTime() / 1e3,
    ExportType: [],
    IncrementalExportSpecification: (_) => se_IncrementalExportSpecification(_, context),
    S3Bucket: [],
    S3BucketOwner: [],
    S3Prefix: [],
    S3SseAlgorithm: [],
    S3SseKmsKeyId: [],
    TableArn: []
  });
};
var se_ExpressionAttributeValueMap = (input, context) => {
  return Object.entries(input).reduce((acc, [key, value]) => {
    if (value === null) {
      return acc;
    }
    acc[key] = se_AttributeValue(value, context);
    return acc;
  }, {});
};
var se_FilterConditionMap = (input, context) => {
  return Object.entries(input).reduce((acc, [key, value]) => {
    if (value === null) {
      return acc;
    }
    acc[key] = se_Condition(value, context);
    return acc;
  }, {});
};
var se_Get = (input, context) => {
  return take(input, {
    ExpressionAttributeNames: _json,
    Key: (_) => se_Key(_, context),
    ProjectionExpression: [],
    TableName: []
  });
};
var se_GetItemInput = (input, context) => {
  return take(input, {
    AttributesToGet: _json,
    ConsistentRead: [],
    ExpressionAttributeNames: _json,
    Key: (_) => se_Key(_, context),
    ProjectionExpression: [],
    ReturnConsumedCapacity: [],
    TableName: []
  });
};
var se_GlobalSecondaryIndexAutoScalingUpdate = (input, context) => {
  return take(input, {
    IndexName: [],
    ProvisionedWriteCapacityAutoScalingUpdate: (_) => se_AutoScalingSettingsUpdate(_, context)
  });
};
var se_GlobalSecondaryIndexAutoScalingUpdateList = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    return se_GlobalSecondaryIndexAutoScalingUpdate(entry, context);
  });
};
var se_GlobalTableGlobalSecondaryIndexSettingsUpdate = (input, context) => {
  return take(input, {
    IndexName: [],
    ProvisionedWriteCapacityAutoScalingSettingsUpdate: (_) => se_AutoScalingSettingsUpdate(_, context),
    ProvisionedWriteCapacityUnits: []
  });
};
var se_GlobalTableGlobalSecondaryIndexSettingsUpdateList = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    return se_GlobalTableGlobalSecondaryIndexSettingsUpdate(entry, context);
  });
};
var se_ImportTableInput = (input, context) => {
  return take(input, {
    ClientToken: [true, (_) => _ ?? v4_default()],
    InputCompressionType: [],
    InputFormat: [],
    InputFormatOptions: _json,
    S3BucketSource: _json,
    TableCreationParameters: _json
  });
};
var se_IncrementalExportSpecification = (input, context) => {
  return take(input, {
    ExportFromTime: (_) => _.getTime() / 1e3,
    ExportToTime: (_) => _.getTime() / 1e3,
    ExportViewType: []
  });
};
var se_Key = (input, context) => {
  return Object.entries(input).reduce((acc, [key, value]) => {
    if (value === null) {
      return acc;
    }
    acc[key] = se_AttributeValue(value, context);
    return acc;
  }, {});
};
var se_KeyConditions = (input, context) => {
  return Object.entries(input).reduce((acc, [key, value]) => {
    if (value === null) {
      return acc;
    }
    acc[key] = se_Condition(value, context);
    return acc;
  }, {});
};
var se_KeyList = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    return se_Key(entry, context);
  });
};
var se_KeysAndAttributes = (input, context) => {
  return take(input, {
    AttributesToGet: _json,
    ConsistentRead: [],
    ExpressionAttributeNames: _json,
    Keys: (_) => se_KeyList(_, context),
    ProjectionExpression: []
  });
};
var se_ListAttributeValue = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    return se_AttributeValue(entry, context);
  });
};
var se_ListBackupsInput = (input, context) => {
  return take(input, {
    BackupType: [],
    ExclusiveStartBackupArn: [],
    Limit: [],
    TableName: [],
    TimeRangeLowerBound: (_) => _.getTime() / 1e3,
    TimeRangeUpperBound: (_) => _.getTime() / 1e3
  });
};
var se_MapAttributeValue = (input, context) => {
  return Object.entries(input).reduce((acc, [key, value]) => {
    if (value === null) {
      return acc;
    }
    acc[key] = se_AttributeValue(value, context);
    return acc;
  }, {});
};
var se_ParameterizedStatement = (input, context) => {
  return take(input, {
    Parameters: (_) => se_PreparedStatementParameters(_, context),
    ReturnValuesOnConditionCheckFailure: [],
    Statement: []
  });
};
var se_ParameterizedStatements = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    return se_ParameterizedStatement(entry, context);
  });
};
var se_PartiQLBatchRequest = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    return se_BatchStatementRequest(entry, context);
  });
};
var se_PreparedStatementParameters = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    return se_AttributeValue(entry, context);
  });
};
var se_Put = (input, context) => {
  return take(input, {
    ConditionExpression: [],
    ExpressionAttributeNames: _json,
    ExpressionAttributeValues: (_) => se_ExpressionAttributeValueMap(_, context),
    Item: (_) => se_PutItemInputAttributeMap(_, context),
    ReturnValuesOnConditionCheckFailure: [],
    TableName: []
  });
};
var se_PutItemInput = (input, context) => {
  return take(input, {
    ConditionExpression: [],
    ConditionalOperator: [],
    Expected: (_) => se_ExpectedAttributeMap(_, context),
    ExpressionAttributeNames: _json,
    ExpressionAttributeValues: (_) => se_ExpressionAttributeValueMap(_, context),
    Item: (_) => se_PutItemInputAttributeMap(_, context),
    ReturnConsumedCapacity: [],
    ReturnItemCollectionMetrics: [],
    ReturnValues: [],
    ReturnValuesOnConditionCheckFailure: [],
    TableName: []
  });
};
var se_PutItemInputAttributeMap = (input, context) => {
  return Object.entries(input).reduce((acc, [key, value]) => {
    if (value === null) {
      return acc;
    }
    acc[key] = se_AttributeValue(value, context);
    return acc;
  }, {});
};
var se_PutRequest = (input, context) => {
  return take(input, {
    Item: (_) => se_PutItemInputAttributeMap(_, context)
  });
};
var se_QueryInput = (input, context) => {
  return take(input, {
    AttributesToGet: _json,
    ConditionalOperator: [],
    ConsistentRead: [],
    ExclusiveStartKey: (_) => se_Key(_, context),
    ExpressionAttributeNames: _json,
    ExpressionAttributeValues: (_) => se_ExpressionAttributeValueMap(_, context),
    FilterExpression: [],
    IndexName: [],
    KeyConditionExpression: [],
    KeyConditions: (_) => se_KeyConditions(_, context),
    Limit: [],
    ProjectionExpression: [],
    QueryFilter: (_) => se_FilterConditionMap(_, context),
    ReturnConsumedCapacity: [],
    ScanIndexForward: [],
    Select: [],
    TableName: []
  });
};
var se_ReplicaAutoScalingUpdate = (input, context) => {
  return take(input, {
    RegionName: [],
    ReplicaGlobalSecondaryIndexUpdates: (_) => se_ReplicaGlobalSecondaryIndexAutoScalingUpdateList(_, context),
    ReplicaProvisionedReadCapacityAutoScalingUpdate: (_) => se_AutoScalingSettingsUpdate(_, context)
  });
};
var se_ReplicaAutoScalingUpdateList = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    return se_ReplicaAutoScalingUpdate(entry, context);
  });
};
var se_ReplicaGlobalSecondaryIndexAutoScalingUpdate = (input, context) => {
  return take(input, {
    IndexName: [],
    ProvisionedReadCapacityAutoScalingUpdate: (_) => se_AutoScalingSettingsUpdate(_, context)
  });
};
var se_ReplicaGlobalSecondaryIndexAutoScalingUpdateList = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    return se_ReplicaGlobalSecondaryIndexAutoScalingUpdate(entry, context);
  });
};
var se_ReplicaGlobalSecondaryIndexSettingsUpdate = (input, context) => {
  return take(input, {
    IndexName: [],
    ProvisionedReadCapacityAutoScalingSettingsUpdate: (_) => se_AutoScalingSettingsUpdate(_, context),
    ProvisionedReadCapacityUnits: []
  });
};
var se_ReplicaGlobalSecondaryIndexSettingsUpdateList = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    return se_ReplicaGlobalSecondaryIndexSettingsUpdate(entry, context);
  });
};
var se_ReplicaSettingsUpdate = (input, context) => {
  return take(input, {
    RegionName: [],
    ReplicaGlobalSecondaryIndexSettingsUpdate: (_) => se_ReplicaGlobalSecondaryIndexSettingsUpdateList(_, context),
    ReplicaProvisionedReadCapacityAutoScalingSettingsUpdate: (_) => se_AutoScalingSettingsUpdate(_, context),
    ReplicaProvisionedReadCapacityUnits: [],
    ReplicaTableClass: []
  });
};
var se_ReplicaSettingsUpdateList = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    return se_ReplicaSettingsUpdate(entry, context);
  });
};
var se_RestoreTableToPointInTimeInput = (input, context) => {
  return take(input, {
    BillingModeOverride: [],
    GlobalSecondaryIndexOverride: _json,
    LocalSecondaryIndexOverride: _json,
    OnDemandThroughputOverride: _json,
    ProvisionedThroughputOverride: _json,
    RestoreDateTime: (_) => _.getTime() / 1e3,
    SSESpecificationOverride: _json,
    SourceTableArn: [],
    SourceTableName: [],
    TargetTableName: [],
    UseLatestRestorableTime: []
  });
};
var se_ScanInput = (input, context) => {
  return take(input, {
    AttributesToGet: _json,
    ConditionalOperator: [],
    ConsistentRead: [],
    ExclusiveStartKey: (_) => se_Key(_, context),
    ExpressionAttributeNames: _json,
    ExpressionAttributeValues: (_) => se_ExpressionAttributeValueMap(_, context),
    FilterExpression: [],
    IndexName: [],
    Limit: [],
    ProjectionExpression: [],
    ReturnConsumedCapacity: [],
    ScanFilter: (_) => se_FilterConditionMap(_, context),
    Segment: [],
    Select: [],
    TableName: [],
    TotalSegments: []
  });
};
var se_TransactGetItem = (input, context) => {
  return take(input, {
    Get: (_) => se_Get(_, context)
  });
};
var se_TransactGetItemList = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    return se_TransactGetItem(entry, context);
  });
};
var se_TransactGetItemsInput = (input, context) => {
  return take(input, {
    ReturnConsumedCapacity: [],
    TransactItems: (_) => se_TransactGetItemList(_, context)
  });
};
var se_TransactWriteItem = (input, context) => {
  return take(input, {
    ConditionCheck: (_) => se_ConditionCheck(_, context),
    Delete: (_) => se_Delete(_, context),
    Put: (_) => se_Put(_, context),
    Update: (_) => se_Update(_, context)
  });
};
var se_TransactWriteItemList = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    return se_TransactWriteItem(entry, context);
  });
};
var se_TransactWriteItemsInput = (input, context) => {
  return take(input, {
    ClientRequestToken: [true, (_) => _ ?? v4_default()],
    ReturnConsumedCapacity: [],
    ReturnItemCollectionMetrics: [],
    TransactItems: (_) => se_TransactWriteItemList(_, context)
  });
};
var se_Update = (input, context) => {
  return take(input, {
    ConditionExpression: [],
    ExpressionAttributeNames: _json,
    ExpressionAttributeValues: (_) => se_ExpressionAttributeValueMap(_, context),
    Key: (_) => se_Key(_, context),
    ReturnValuesOnConditionCheckFailure: [],
    TableName: [],
    UpdateExpression: []
  });
};
var se_UpdateGlobalTableSettingsInput = (input, context) => {
  return take(input, {
    GlobalTableBillingMode: [],
    GlobalTableGlobalSecondaryIndexSettingsUpdate: (_) => se_GlobalTableGlobalSecondaryIndexSettingsUpdateList(_, context),
    GlobalTableName: [],
    GlobalTableProvisionedWriteCapacityAutoScalingSettingsUpdate: (_) => se_AutoScalingSettingsUpdate(_, context),
    GlobalTableProvisionedWriteCapacityUnits: [],
    ReplicaSettingsUpdate: (_) => se_ReplicaSettingsUpdateList(_, context)
  });
};
var se_UpdateItemInput = (input, context) => {
  return take(input, {
    AttributeUpdates: (_) => se_AttributeUpdates(_, context),
    ConditionExpression: [],
    ConditionalOperator: [],
    Expected: (_) => se_ExpectedAttributeMap(_, context),
    ExpressionAttributeNames: _json,
    ExpressionAttributeValues: (_) => se_ExpressionAttributeValueMap(_, context),
    Key: (_) => se_Key(_, context),
    ReturnConsumedCapacity: [],
    ReturnItemCollectionMetrics: [],
    ReturnValues: [],
    ReturnValuesOnConditionCheckFailure: [],
    TableName: [],
    UpdateExpression: []
  });
};
var se_UpdateTableReplicaAutoScalingInput = (input, context) => {
  return take(input, {
    GlobalSecondaryIndexUpdates: (_) => se_GlobalSecondaryIndexAutoScalingUpdateList(_, context),
    ProvisionedWriteCapacityAutoScalingUpdate: (_) => se_AutoScalingSettingsUpdate(_, context),
    ReplicaUpdates: (_) => se_ReplicaAutoScalingUpdateList(_, context),
    TableName: []
  });
};
var se_WriteRequest = (input, context) => {
  return take(input, {
    DeleteRequest: (_) => se_DeleteRequest(_, context),
    PutRequest: (_) => se_PutRequest(_, context)
  });
};
var se_WriteRequests = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    return se_WriteRequest(entry, context);
  });
};
var de_ArchivalSummary = (output, context) => {
  return take(output, {
    ArchivalBackupArn: expectString,
    ArchivalDateTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    ArchivalReason: expectString
  });
};
var de_AttributeMap = (output, context) => {
  return Object.entries(output).reduce((acc, [key, value]) => {
    if (value === null) {
      return acc;
    }
    acc[key] = de_AttributeValue(awsExpectUnion(value), context);
    return acc;
  }, {});
};
var de_AttributeValue = (output, context) => {
  if (output.B != null) {
    return {
      B: context.base64Decoder(output.B)
    };
  }
  if (expectBoolean(output.BOOL) !== void 0) {
    return { BOOL: expectBoolean(output.BOOL) };
  }
  if (output.BS != null) {
    return {
      BS: de_BinarySetAttributeValue(output.BS, context)
    };
  }
  if (output.L != null) {
    return {
      L: de_ListAttributeValue(output.L, context)
    };
  }
  if (output.M != null) {
    return {
      M: de_MapAttributeValue(output.M, context)
    };
  }
  if (expectString(output.N) !== void 0) {
    return { N: expectString(output.N) };
  }
  if (output.NS != null) {
    return {
      NS: _json(output.NS)
    };
  }
  if (expectBoolean(output.NULL) !== void 0) {
    return { NULL: expectBoolean(output.NULL) };
  }
  if (expectString(output.S) !== void 0) {
    return { S: expectString(output.S) };
  }
  if (output.SS != null) {
    return {
      SS: _json(output.SS)
    };
  }
  return { $unknown: Object.entries(output)[0] };
};
var de_AutoScalingPolicyDescription = (output, context) => {
  return take(output, {
    PolicyName: expectString,
    TargetTrackingScalingPolicyConfiguration: (_) => de_AutoScalingTargetTrackingScalingPolicyConfigurationDescription(_, context)
  });
};
var de_AutoScalingPolicyDescriptionList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_AutoScalingPolicyDescription(entry, context);
  });
  return retVal;
};
var de_AutoScalingSettingsDescription = (output, context) => {
  return take(output, {
    AutoScalingDisabled: expectBoolean,
    AutoScalingRoleArn: expectString,
    MaximumUnits: expectLong,
    MinimumUnits: expectLong,
    ScalingPolicies: (_) => de_AutoScalingPolicyDescriptionList(_, context)
  });
};
var de_AutoScalingTargetTrackingScalingPolicyConfigurationDescription = (output, context) => {
  return take(output, {
    DisableScaleIn: expectBoolean,
    ScaleInCooldown: expectInt32,
    ScaleOutCooldown: expectInt32,
    TargetValue: limitedParseDouble
  });
};
var de_BackupDescription = (output, context) => {
  return take(output, {
    BackupDetails: (_) => de_BackupDetails(_, context),
    SourceTableDetails: (_) => de_SourceTableDetails(_, context),
    SourceTableFeatureDetails: (_) => de_SourceTableFeatureDetails(_, context)
  });
};
var de_BackupDetails = (output, context) => {
  return take(output, {
    BackupArn: expectString,
    BackupCreationDateTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    BackupExpiryDateTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    BackupName: expectString,
    BackupSizeBytes: expectLong,
    BackupStatus: expectString,
    BackupType: expectString
  });
};
var de_BackupSummaries = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_BackupSummary(entry, context);
  });
  return retVal;
};
var de_BackupSummary = (output, context) => {
  return take(output, {
    BackupArn: expectString,
    BackupCreationDateTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    BackupExpiryDateTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    BackupName: expectString,
    BackupSizeBytes: expectLong,
    BackupStatus: expectString,
    BackupType: expectString,
    TableArn: expectString,
    TableId: expectString,
    TableName: expectString
  });
};
var de_BatchExecuteStatementOutput = (output, context) => {
  return take(output, {
    ConsumedCapacity: (_) => de_ConsumedCapacityMultiple(_, context),
    Responses: (_) => de_PartiQLBatchResponse(_, context)
  });
};
var de_BatchGetItemOutput = (output, context) => {
  return take(output, {
    ConsumedCapacity: (_) => de_ConsumedCapacityMultiple(_, context),
    Responses: (_) => de_BatchGetResponseMap(_, context),
    UnprocessedKeys: (_) => de_BatchGetRequestMap(_, context)
  });
};
var de_BatchGetRequestMap = (output, context) => {
  return Object.entries(output).reduce((acc, [key, value]) => {
    if (value === null) {
      return acc;
    }
    acc[key] = de_KeysAndAttributes(value, context);
    return acc;
  }, {});
};
var de_BatchGetResponseMap = (output, context) => {
  return Object.entries(output).reduce((acc, [key, value]) => {
    if (value === null) {
      return acc;
    }
    acc[key] = de_ItemList(value, context);
    return acc;
  }, {});
};
var de_BatchStatementError = (output, context) => {
  return take(output, {
    Code: expectString,
    Item: (_) => de_AttributeMap(_, context),
    Message: expectString
  });
};
var de_BatchStatementResponse = (output, context) => {
  return take(output, {
    Error: (_) => de_BatchStatementError(_, context),
    Item: (_) => de_AttributeMap(_, context),
    TableName: expectString
  });
};
var de_BatchWriteItemOutput = (output, context) => {
  return take(output, {
    ConsumedCapacity: (_) => de_ConsumedCapacityMultiple(_, context),
    ItemCollectionMetrics: (_) => de_ItemCollectionMetricsPerTable(_, context),
    UnprocessedItems: (_) => de_BatchWriteItemRequestMap(_, context)
  });
};
var de_BatchWriteItemRequestMap = (output, context) => {
  return Object.entries(output).reduce((acc, [key, value]) => {
    if (value === null) {
      return acc;
    }
    acc[key] = de_WriteRequests(value, context);
    return acc;
  }, {});
};
var de_BillingModeSummary = (output, context) => {
  return take(output, {
    BillingMode: expectString,
    LastUpdateToPayPerRequestDateTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_)))
  });
};
var de_BinarySetAttributeValue = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return context.base64Decoder(entry);
  });
  return retVal;
};
var de_CancellationReason = (output, context) => {
  return take(output, {
    Code: expectString,
    Item: (_) => de_AttributeMap(_, context),
    Message: expectString
  });
};
var de_CancellationReasonList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_CancellationReason(entry, context);
  });
  return retVal;
};
var de_Capacity = (output, context) => {
  return take(output, {
    CapacityUnits: limitedParseDouble,
    ReadCapacityUnits: limitedParseDouble,
    WriteCapacityUnits: limitedParseDouble
  });
};
var de_ConditionalCheckFailedException = (output, context) => {
  return take(output, {
    Item: (_) => de_AttributeMap(_, context),
    message: expectString
  });
};
var de_ConsumedCapacity = (output, context) => {
  return take(output, {
    CapacityUnits: limitedParseDouble,
    GlobalSecondaryIndexes: (_) => de_SecondaryIndexesCapacityMap(_, context),
    LocalSecondaryIndexes: (_) => de_SecondaryIndexesCapacityMap(_, context),
    ReadCapacityUnits: limitedParseDouble,
    Table: (_) => de_Capacity(_, context),
    TableName: expectString,
    WriteCapacityUnits: limitedParseDouble
  });
};
var de_ConsumedCapacityMultiple = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ConsumedCapacity(entry, context);
  });
  return retVal;
};
var de_ContinuousBackupsDescription = (output, context) => {
  return take(output, {
    ContinuousBackupsStatus: expectString,
    PointInTimeRecoveryDescription: (_) => de_PointInTimeRecoveryDescription(_, context)
  });
};
var de_CreateBackupOutput = (output, context) => {
  return take(output, {
    BackupDetails: (_) => de_BackupDetails(_, context)
  });
};
var de_CreateGlobalTableOutput = (output, context) => {
  return take(output, {
    GlobalTableDescription: (_) => de_GlobalTableDescription(_, context)
  });
};
var de_CreateTableOutput = (output, context) => {
  return take(output, {
    TableDescription: (_) => de_TableDescription(_, context)
  });
};
var de_DeleteBackupOutput = (output, context) => {
  return take(output, {
    BackupDescription: (_) => de_BackupDescription(_, context)
  });
};
var de_DeleteItemOutput = (output, context) => {
  return take(output, {
    Attributes: (_) => de_AttributeMap(_, context),
    ConsumedCapacity: (_) => de_ConsumedCapacity(_, context),
    ItemCollectionMetrics: (_) => de_ItemCollectionMetrics(_, context)
  });
};
var de_DeleteRequest = (output, context) => {
  return take(output, {
    Key: (_) => de_Key(_, context)
  });
};
var de_DeleteTableOutput = (output, context) => {
  return take(output, {
    TableDescription: (_) => de_TableDescription(_, context)
  });
};
var de_DescribeBackupOutput = (output, context) => {
  return take(output, {
    BackupDescription: (_) => de_BackupDescription(_, context)
  });
};
var de_DescribeContinuousBackupsOutput = (output, context) => {
  return take(output, {
    ContinuousBackupsDescription: (_) => de_ContinuousBackupsDescription(_, context)
  });
};
var de_DescribeContributorInsightsOutput = (output, context) => {
  return take(output, {
    ContributorInsightsRuleList: _json,
    ContributorInsightsStatus: expectString,
    FailureException: _json,
    IndexName: expectString,
    LastUpdateDateTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    TableName: expectString
  });
};
var de_DescribeExportOutput = (output, context) => {
  return take(output, {
    ExportDescription: (_) => de_ExportDescription(_, context)
  });
};
var de_DescribeGlobalTableOutput = (output, context) => {
  return take(output, {
    GlobalTableDescription: (_) => de_GlobalTableDescription(_, context)
  });
};
var de_DescribeGlobalTableSettingsOutput = (output, context) => {
  return take(output, {
    GlobalTableName: expectString,
    ReplicaSettings: (_) => de_ReplicaSettingsDescriptionList(_, context)
  });
};
var de_DescribeImportOutput = (output, context) => {
  return take(output, {
    ImportTableDescription: (_) => de_ImportTableDescription(_, context)
  });
};
var de_DescribeTableOutput = (output, context) => {
  return take(output, {
    Table: (_) => de_TableDescription(_, context)
  });
};
var de_DescribeTableReplicaAutoScalingOutput = (output, context) => {
  return take(output, {
    TableAutoScalingDescription: (_) => de_TableAutoScalingDescription(_, context)
  });
};
var de_ExecuteStatementOutput = (output, context) => {
  return take(output, {
    ConsumedCapacity: (_) => de_ConsumedCapacity(_, context),
    Items: (_) => de_ItemList(_, context),
    LastEvaluatedKey: (_) => de_Key(_, context),
    NextToken: expectString
  });
};
var de_ExecuteTransactionOutput = (output, context) => {
  return take(output, {
    ConsumedCapacity: (_) => de_ConsumedCapacityMultiple(_, context),
    Responses: (_) => de_ItemResponseList(_, context)
  });
};
var de_ExportDescription = (output, context) => {
  return take(output, {
    BilledSizeBytes: expectLong,
    ClientToken: expectString,
    EndTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    ExportArn: expectString,
    ExportFormat: expectString,
    ExportManifest: expectString,
    ExportStatus: expectString,
    ExportTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    ExportType: expectString,
    FailureCode: expectString,
    FailureMessage: expectString,
    IncrementalExportSpecification: (_) => de_IncrementalExportSpecification(_, context),
    ItemCount: expectLong,
    S3Bucket: expectString,
    S3BucketOwner: expectString,
    S3Prefix: expectString,
    S3SseAlgorithm: expectString,
    S3SseKmsKeyId: expectString,
    StartTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    TableArn: expectString,
    TableId: expectString
  });
};
var de_ExportTableToPointInTimeOutput = (output, context) => {
  return take(output, {
    ExportDescription: (_) => de_ExportDescription(_, context)
  });
};
var de_GetItemOutput = (output, context) => {
  return take(output, {
    ConsumedCapacity: (_) => de_ConsumedCapacity(_, context),
    Item: (_) => de_AttributeMap(_, context)
  });
};
var de_GlobalSecondaryIndexDescription = (output, context) => {
  return take(output, {
    Backfilling: expectBoolean,
    IndexArn: expectString,
    IndexName: expectString,
    IndexSizeBytes: expectLong,
    IndexStatus: expectString,
    ItemCount: expectLong,
    KeySchema: _json,
    OnDemandThroughput: _json,
    Projection: _json,
    ProvisionedThroughput: (_) => de_ProvisionedThroughputDescription(_, context),
    WarmThroughput: _json
  });
};
var de_GlobalSecondaryIndexDescriptionList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_GlobalSecondaryIndexDescription(entry, context);
  });
  return retVal;
};
var de_GlobalTableDescription = (output, context) => {
  return take(output, {
    CreationDateTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    GlobalTableArn: expectString,
    GlobalTableName: expectString,
    GlobalTableStatus: expectString,
    ReplicationGroup: (_) => de_ReplicaDescriptionList(_, context)
  });
};
var de_ImportSummary = (output, context) => {
  return take(output, {
    CloudWatchLogGroupArn: expectString,
    EndTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    ImportArn: expectString,
    ImportStatus: expectString,
    InputFormat: expectString,
    S3BucketSource: _json,
    StartTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    TableArn: expectString
  });
};
var de_ImportSummaryList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ImportSummary(entry, context);
  });
  return retVal;
};
var de_ImportTableDescription = (output, context) => {
  return take(output, {
    ClientToken: expectString,
    CloudWatchLogGroupArn: expectString,
    EndTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    ErrorCount: expectLong,
    FailureCode: expectString,
    FailureMessage: expectString,
    ImportArn: expectString,
    ImportStatus: expectString,
    ImportedItemCount: expectLong,
    InputCompressionType: expectString,
    InputFormat: expectString,
    InputFormatOptions: _json,
    ProcessedItemCount: expectLong,
    ProcessedSizeBytes: expectLong,
    S3BucketSource: _json,
    StartTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    TableArn: expectString,
    TableCreationParameters: _json,
    TableId: expectString
  });
};
var de_ImportTableOutput = (output, context) => {
  return take(output, {
    ImportTableDescription: (_) => de_ImportTableDescription(_, context)
  });
};
var de_IncrementalExportSpecification = (output, context) => {
  return take(output, {
    ExportFromTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    ExportToTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    ExportViewType: expectString
  });
};
var de_ItemCollectionKeyAttributeMap = (output, context) => {
  return Object.entries(output).reduce((acc, [key, value]) => {
    if (value === null) {
      return acc;
    }
    acc[key] = de_AttributeValue(awsExpectUnion(value), context);
    return acc;
  }, {});
};
var de_ItemCollectionMetrics = (output, context) => {
  return take(output, {
    ItemCollectionKey: (_) => de_ItemCollectionKeyAttributeMap(_, context),
    SizeEstimateRangeGB: (_) => de_ItemCollectionSizeEstimateRange(_, context)
  });
};
var de_ItemCollectionMetricsMultiple = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ItemCollectionMetrics(entry, context);
  });
  return retVal;
};
var de_ItemCollectionMetricsPerTable = (output, context) => {
  return Object.entries(output).reduce((acc, [key, value]) => {
    if (value === null) {
      return acc;
    }
    acc[key] = de_ItemCollectionMetricsMultiple(value, context);
    return acc;
  }, {});
};
var de_ItemCollectionSizeEstimateRange = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return limitedParseDouble(entry);
  });
  return retVal;
};
var de_ItemList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_AttributeMap(entry, context);
  });
  return retVal;
};
var de_ItemResponse = (output, context) => {
  return take(output, {
    Item: (_) => de_AttributeMap(_, context)
  });
};
var de_ItemResponseList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ItemResponse(entry, context);
  });
  return retVal;
};
var de_Key = (output, context) => {
  return Object.entries(output).reduce((acc, [key, value]) => {
    if (value === null) {
      return acc;
    }
    acc[key] = de_AttributeValue(awsExpectUnion(value), context);
    return acc;
  }, {});
};
var de_KeyList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_Key(entry, context);
  });
  return retVal;
};
var de_KeysAndAttributes = (output, context) => {
  return take(output, {
    AttributesToGet: _json,
    ConsistentRead: expectBoolean,
    ExpressionAttributeNames: _json,
    Keys: (_) => de_KeyList(_, context),
    ProjectionExpression: expectString
  });
};
var de_ListAttributeValue = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_AttributeValue(awsExpectUnion(entry), context);
  });
  return retVal;
};
var de_ListBackupsOutput = (output, context) => {
  return take(output, {
    BackupSummaries: (_) => de_BackupSummaries(_, context),
    LastEvaluatedBackupArn: expectString
  });
};
var de_ListImportsOutput = (output, context) => {
  return take(output, {
    ImportSummaryList: (_) => de_ImportSummaryList(_, context),
    NextToken: expectString
  });
};
var de_MapAttributeValue = (output, context) => {
  return Object.entries(output).reduce((acc, [key, value]) => {
    if (value === null) {
      return acc;
    }
    acc[key] = de_AttributeValue(awsExpectUnion(value), context);
    return acc;
  }, {});
};
var de_PartiQLBatchResponse = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_BatchStatementResponse(entry, context);
  });
  return retVal;
};
var de_PointInTimeRecoveryDescription = (output, context) => {
  return take(output, {
    EarliestRestorableDateTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    LatestRestorableDateTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    PointInTimeRecoveryStatus: expectString,
    RecoveryPeriodInDays: expectInt32
  });
};
var de_ProvisionedThroughputDescription = (output, context) => {
  return take(output, {
    LastDecreaseDateTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    LastIncreaseDateTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    NumberOfDecreasesToday: expectLong,
    ReadCapacityUnits: expectLong,
    WriteCapacityUnits: expectLong
  });
};
var de_PutItemInputAttributeMap = (output, context) => {
  return Object.entries(output).reduce((acc, [key, value]) => {
    if (value === null) {
      return acc;
    }
    acc[key] = de_AttributeValue(awsExpectUnion(value), context);
    return acc;
  }, {});
};
var de_PutItemOutput = (output, context) => {
  return take(output, {
    Attributes: (_) => de_AttributeMap(_, context),
    ConsumedCapacity: (_) => de_ConsumedCapacity(_, context),
    ItemCollectionMetrics: (_) => de_ItemCollectionMetrics(_, context)
  });
};
var de_PutRequest = (output, context) => {
  return take(output, {
    Item: (_) => de_PutItemInputAttributeMap(_, context)
  });
};
var de_QueryOutput = (output, context) => {
  return take(output, {
    ConsumedCapacity: (_) => de_ConsumedCapacity(_, context),
    Count: expectInt32,
    Items: (_) => de_ItemList(_, context),
    LastEvaluatedKey: (_) => de_Key(_, context),
    ScannedCount: expectInt32
  });
};
var de_ReplicaAutoScalingDescription = (output, context) => {
  return take(output, {
    GlobalSecondaryIndexes: (_) => de_ReplicaGlobalSecondaryIndexAutoScalingDescriptionList(_, context),
    RegionName: expectString,
    ReplicaProvisionedReadCapacityAutoScalingSettings: (_) => de_AutoScalingSettingsDescription(_, context),
    ReplicaProvisionedWriteCapacityAutoScalingSettings: (_) => de_AutoScalingSettingsDescription(_, context),
    ReplicaStatus: expectString
  });
};
var de_ReplicaAutoScalingDescriptionList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ReplicaAutoScalingDescription(entry, context);
  });
  return retVal;
};
var de_ReplicaDescription = (output, context) => {
  return take(output, {
    GlobalSecondaryIndexes: _json,
    KMSMasterKeyId: expectString,
    OnDemandThroughputOverride: _json,
    ProvisionedThroughputOverride: _json,
    RegionName: expectString,
    ReplicaInaccessibleDateTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    ReplicaStatus: expectString,
    ReplicaStatusDescription: expectString,
    ReplicaStatusPercentProgress: expectString,
    ReplicaTableClassSummary: (_) => de_TableClassSummary(_, context),
    WarmThroughput: _json
  });
};
var de_ReplicaDescriptionList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ReplicaDescription(entry, context);
  });
  return retVal;
};
var de_ReplicaGlobalSecondaryIndexAutoScalingDescription = (output, context) => {
  return take(output, {
    IndexName: expectString,
    IndexStatus: expectString,
    ProvisionedReadCapacityAutoScalingSettings: (_) => de_AutoScalingSettingsDescription(_, context),
    ProvisionedWriteCapacityAutoScalingSettings: (_) => de_AutoScalingSettingsDescription(_, context)
  });
};
var de_ReplicaGlobalSecondaryIndexAutoScalingDescriptionList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ReplicaGlobalSecondaryIndexAutoScalingDescription(entry, context);
  });
  return retVal;
};
var de_ReplicaGlobalSecondaryIndexSettingsDescription = (output, context) => {
  return take(output, {
    IndexName: expectString,
    IndexStatus: expectString,
    ProvisionedReadCapacityAutoScalingSettings: (_) => de_AutoScalingSettingsDescription(_, context),
    ProvisionedReadCapacityUnits: expectLong,
    ProvisionedWriteCapacityAutoScalingSettings: (_) => de_AutoScalingSettingsDescription(_, context),
    ProvisionedWriteCapacityUnits: expectLong
  });
};
var de_ReplicaGlobalSecondaryIndexSettingsDescriptionList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ReplicaGlobalSecondaryIndexSettingsDescription(entry, context);
  });
  return retVal;
};
var de_ReplicaSettingsDescription = (output, context) => {
  return take(output, {
    RegionName: expectString,
    ReplicaBillingModeSummary: (_) => de_BillingModeSummary(_, context),
    ReplicaGlobalSecondaryIndexSettings: (_) => de_ReplicaGlobalSecondaryIndexSettingsDescriptionList(_, context),
    ReplicaProvisionedReadCapacityAutoScalingSettings: (_) => de_AutoScalingSettingsDescription(_, context),
    ReplicaProvisionedReadCapacityUnits: expectLong,
    ReplicaProvisionedWriteCapacityAutoScalingSettings: (_) => de_AutoScalingSettingsDescription(_, context),
    ReplicaProvisionedWriteCapacityUnits: expectLong,
    ReplicaStatus: expectString,
    ReplicaTableClassSummary: (_) => de_TableClassSummary(_, context)
  });
};
var de_ReplicaSettingsDescriptionList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ReplicaSettingsDescription(entry, context);
  });
  return retVal;
};
var de_RestoreSummary = (output, context) => {
  return take(output, {
    RestoreDateTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    RestoreInProgress: expectBoolean,
    SourceBackupArn: expectString,
    SourceTableArn: expectString
  });
};
var de_RestoreTableFromBackupOutput = (output, context) => {
  return take(output, {
    TableDescription: (_) => de_TableDescription(_, context)
  });
};
var de_RestoreTableToPointInTimeOutput = (output, context) => {
  return take(output, {
    TableDescription: (_) => de_TableDescription(_, context)
  });
};
var de_ScanOutput = (output, context) => {
  return take(output, {
    ConsumedCapacity: (_) => de_ConsumedCapacity(_, context),
    Count: expectInt32,
    Items: (_) => de_ItemList(_, context),
    LastEvaluatedKey: (_) => de_Key(_, context),
    ScannedCount: expectInt32
  });
};
var de_SecondaryIndexesCapacityMap = (output, context) => {
  return Object.entries(output).reduce((acc, [key, value]) => {
    if (value === null) {
      return acc;
    }
    acc[key] = de_Capacity(value, context);
    return acc;
  }, {});
};
var de_SourceTableDetails = (output, context) => {
  return take(output, {
    BillingMode: expectString,
    ItemCount: expectLong,
    KeySchema: _json,
    OnDemandThroughput: _json,
    ProvisionedThroughput: _json,
    TableArn: expectString,
    TableCreationDateTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    TableId: expectString,
    TableName: expectString,
    TableSizeBytes: expectLong
  });
};
var de_SourceTableFeatureDetails = (output, context) => {
  return take(output, {
    GlobalSecondaryIndexes: _json,
    LocalSecondaryIndexes: _json,
    SSEDescription: (_) => de_SSEDescription(_, context),
    StreamDescription: _json,
    TimeToLiveDescription: _json
  });
};
var de_SSEDescription = (output, context) => {
  return take(output, {
    InaccessibleEncryptionDateTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    KMSMasterKeyArn: expectString,
    SSEType: expectString,
    Status: expectString
  });
};
var de_TableAutoScalingDescription = (output, context) => {
  return take(output, {
    Replicas: (_) => de_ReplicaAutoScalingDescriptionList(_, context),
    TableName: expectString,
    TableStatus: expectString
  });
};
var de_TableClassSummary = (output, context) => {
  return take(output, {
    LastUpdateDateTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    TableClass: expectString
  });
};
var de_TableDescription = (output, context) => {
  return take(output, {
    ArchivalSummary: (_) => de_ArchivalSummary(_, context),
    AttributeDefinitions: _json,
    BillingModeSummary: (_) => de_BillingModeSummary(_, context),
    CreationDateTime: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    DeletionProtectionEnabled: expectBoolean,
    GlobalSecondaryIndexes: (_) => de_GlobalSecondaryIndexDescriptionList(_, context),
    GlobalTableVersion: expectString,
    ItemCount: expectLong,
    KeySchema: _json,
    LatestStreamArn: expectString,
    LatestStreamLabel: expectString,
    LocalSecondaryIndexes: _json,
    MultiRegionConsistency: expectString,
    OnDemandThroughput: _json,
    ProvisionedThroughput: (_) => de_ProvisionedThroughputDescription(_, context),
    Replicas: (_) => de_ReplicaDescriptionList(_, context),
    RestoreSummary: (_) => de_RestoreSummary(_, context),
    SSEDescription: (_) => de_SSEDescription(_, context),
    StreamSpecification: _json,
    TableArn: expectString,
    TableClassSummary: (_) => de_TableClassSummary(_, context),
    TableId: expectString,
    TableName: expectString,
    TableSizeBytes: expectLong,
    TableStatus: expectString,
    WarmThroughput: _json
  });
};
var de_TransactGetItemsOutput = (output, context) => {
  return take(output, {
    ConsumedCapacity: (_) => de_ConsumedCapacityMultiple(_, context),
    Responses: (_) => de_ItemResponseList(_, context)
  });
};
var de_TransactionCanceledException = (output, context) => {
  return take(output, {
    CancellationReasons: (_) => de_CancellationReasonList(_, context),
    Message: expectString
  });
};
var de_TransactWriteItemsOutput = (output, context) => {
  return take(output, {
    ConsumedCapacity: (_) => de_ConsumedCapacityMultiple(_, context),
    ItemCollectionMetrics: (_) => de_ItemCollectionMetricsPerTable(_, context)
  });
};
var de_UpdateContinuousBackupsOutput = (output, context) => {
  return take(output, {
    ContinuousBackupsDescription: (_) => de_ContinuousBackupsDescription(_, context)
  });
};
var de_UpdateGlobalTableOutput = (output, context) => {
  return take(output, {
    GlobalTableDescription: (_) => de_GlobalTableDescription(_, context)
  });
};
var de_UpdateGlobalTableSettingsOutput = (output, context) => {
  return take(output, {
    GlobalTableName: expectString,
    ReplicaSettings: (_) => de_ReplicaSettingsDescriptionList(_, context)
  });
};
var de_UpdateItemOutput = (output, context) => {
  return take(output, {
    Attributes: (_) => de_AttributeMap(_, context),
    ConsumedCapacity: (_) => de_ConsumedCapacity(_, context),
    ItemCollectionMetrics: (_) => de_ItemCollectionMetrics(_, context)
  });
};
var de_UpdateTableOutput = (output, context) => {
  return take(output, {
    TableDescription: (_) => de_TableDescription(_, context)
  });
};
var de_UpdateTableReplicaAutoScalingOutput = (output, context) => {
  return take(output, {
    TableAutoScalingDescription: (_) => de_TableAutoScalingDescription(_, context)
  });
};
var de_WriteRequest = (output, context) => {
  return take(output, {
    DeleteRequest: (_) => de_DeleteRequest(_, context),
    PutRequest: (_) => de_PutRequest(_, context)
  });
};
var de_WriteRequests = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_WriteRequest(entry, context);
  });
  return retVal;
};
var deserializeMetadata = (output) => ({
  httpStatusCode: output.statusCode,
  requestId: output.headers["x-amzn-requestid"] ?? output.headers["x-amzn-request-id"] ?? output.headers["x-amz-request-id"],
  extendedRequestId: output.headers["x-amz-id-2"],
  cfId: output.headers["x-amz-cf-id"]
});
var throwDefaultError = withBaseException(DynamoDBServiceException);
var buildHttpRpcRequest = async (context, headers, path, resolvedHostname, body) => {
  const { hostname, protocol = "https", port, path: basePath } = await context.endpoint();
  const contents = {
    protocol,
    hostname,
    port,
    method: "POST",
    path: basePath.endsWith("/") ? basePath.slice(0, -1) + path : basePath + path,
    headers
  };
  if (resolvedHostname !== void 0) {
    contents.hostname = resolvedHostname;
  }
  if (body !== void 0) {
    contents.body = body;
  }
  return new HttpRequest(contents);
};
function sharedHeaders(operation) {
  return {
    "content-type": "application/x-amz-json-1.0",
    "x-amz-target": `DynamoDB_20120810.${operation}`
  };
}

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/DescribeEndpointsCommand.js
var DescribeEndpointsCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "DescribeEndpoints", {}).n("DynamoDBClient", "DescribeEndpointsCommand").f(void 0, void 0).ser(se_DescribeEndpointsCommand).de(de_DescribeEndpointsCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/runtimeConfig.browser.js
var import_dist70 = __toESM(require_dist());
var import_dist71 = __toESM(require_dist2());
var import_dist72 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-dynamodb/package.json
var package_default = {
  name: "@aws-sdk/client-dynamodb",
  description: "AWS SDK for JavaScript Dynamodb Client for Node.js, Browser and React Native",
  version: "3.782.0",
  scripts: {
    build: "concurrently 'yarn:build:cjs' 'yarn:build:es' 'yarn:build:types'",
    "build:cjs": "node ../../scripts/compilation/inline client-dynamodb",
    "build:es": "tsc -p tsconfig.es.json",
    "build:include:deps": "lerna run --scope $npm_package_name --include-dependencies build",
    "build:types": "tsc -p tsconfig.types.json",
    "build:types:downlevel": "downlevel-dts dist-types dist-types/ts3.4",
    clean: "rimraf ./dist-* && rimraf *.tsbuildinfo",
    "extract:docs": "api-extractor run --local",
    "generate:client": "node ../../scripts/generate-clients/single-service --solo dynamodb"
  },
  main: "./dist-cjs/index.js",
  types: "./dist-types/index.d.ts",
  module: "./dist-es/index.js",
  sideEffects: false,
  dependencies: {
    "@aws-crypto/sha256-browser": "5.2.0",
    "@aws-crypto/sha256-js": "5.2.0",
    "@aws-sdk/core": "3.775.0",
    "@aws-sdk/credential-provider-node": "3.782.0",
    "@aws-sdk/middleware-endpoint-discovery": "3.775.0",
    "@aws-sdk/middleware-host-header": "3.775.0",
    "@aws-sdk/middleware-logger": "3.775.0",
    "@aws-sdk/middleware-recursion-detection": "3.775.0",
    "@aws-sdk/middleware-user-agent": "3.782.0",
    "@aws-sdk/region-config-resolver": "3.775.0",
    "@aws-sdk/types": "3.775.0",
    "@aws-sdk/util-endpoints": "3.782.0",
    "@aws-sdk/util-user-agent-browser": "3.775.0",
    "@aws-sdk/util-user-agent-node": "3.782.0",
    "@smithy/config-resolver": "^4.1.0",
    "@smithy/core": "^3.2.0",
    "@smithy/fetch-http-handler": "^5.0.2",
    "@smithy/hash-node": "^4.0.2",
    "@smithy/invalid-dependency": "^4.0.2",
    "@smithy/middleware-content-length": "^4.0.2",
    "@smithy/middleware-endpoint": "^4.1.0",
    "@smithy/middleware-retry": "^4.1.0",
    "@smithy/middleware-serde": "^4.0.3",
    "@smithy/middleware-stack": "^4.0.2",
    "@smithy/node-config-provider": "^4.0.2",
    "@smithy/node-http-handler": "^4.0.4",
    "@smithy/protocol-http": "^5.1.0",
    "@smithy/smithy-client": "^4.2.0",
    "@smithy/types": "^4.2.0",
    "@smithy/url-parser": "^4.0.2",
    "@smithy/util-base64": "^4.0.0",
    "@smithy/util-body-length-browser": "^4.0.0",
    "@smithy/util-body-length-node": "^4.0.0",
    "@smithy/util-defaults-mode-browser": "^4.0.8",
    "@smithy/util-defaults-mode-node": "^4.0.8",
    "@smithy/util-endpoints": "^3.0.2",
    "@smithy/util-middleware": "^4.0.2",
    "@smithy/util-retry": "^4.0.2",
    "@smithy/util-utf8": "^4.0.0",
    "@smithy/util-waiter": "^4.0.3",
    "@types/uuid": "^9.0.1",
    tslib: "^2.6.2",
    uuid: "^9.0.1"
  },
  devDependencies: {
    "@tsconfig/node18": "18.2.4",
    "@types/node": "^18.19.69",
    concurrently: "7.0.0",
    "downlevel-dts": "0.10.1",
    rimraf: "3.0.2",
    typescript: "~5.2.2"
  },
  engines: {
    node: ">=18.0.0"
  },
  typesVersions: {
    "<4.0": {
      "dist-types/*": [
        "dist-types/ts3.4/*"
      ]
    }
  },
  files: [
    "dist-*/**"
  ],
  author: {
    name: "AWS SDK for JavaScript Team",
    url: "https://aws.amazon.com/javascript/"
  },
  license: "Apache-2.0",
  browser: {
    "./dist-es/runtimeConfig": "./dist-es/runtimeConfig.browser"
  },
  "react-native": {
    "./dist-es/runtimeConfig": "./dist-es/runtimeConfig.native"
  },
  homepage: "https://github.com/aws/aws-sdk-js-v3/tree/main/clients/client-dynamodb",
  repository: {
    type: "git",
    url: "https://github.com/aws/aws-sdk-js-v3.git",
    directory: "clients/client-dynamodb"
  }
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/runtimeConfig.shared.js
var import_dist67 = __toESM(require_dist());
var import_dist68 = __toESM(require_dist2());
var import_dist69 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-dynamodb/dist-es/endpoint/endpointResolver.js
var import_dist64 = __toESM(require_dist());
var import_dist65 = __toESM(require_dist2());
var import_dist66 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-dynamodb/dist-es/endpoint/ruleset.js
var import_dist61 = __toESM(require_dist());
var import_dist62 = __toESM(require_dist2());
var import_dist63 = __toESM(require_dist3());
var S = "required";
var T = "type";
var U = "fn";
var V = "argv";
var W = "ref";
var X = "properties";
var Y = "headers";
var a = false;
var b = "isSet";
var c = "error";
var d = "endpoint";
var e = "tree";
var f = "PartitionResult";
var g = "stringEquals";
var h = "dynamodb";
var i = "getAttr";
var j = "aws.parseArn";
var k = "ParsedArn";
var l = "isValidHostLabel";
var m = "FirstArn";
var n = { [S]: false, [T]: "String" };
var o = { [S]: true, "default": false, [T]: "Boolean" };
var p = { [U]: "booleanEquals", [V]: [{ [W]: "UseFIPS" }, true] };
var q = { [U]: "booleanEquals", [V]: [{ [W]: "UseDualStack" }, true] };
var r = {};
var s = { [W]: "Region" };
var t = { [U]: "booleanEquals", [V]: [{ [U]: i, [V]: [{ [W]: f }, "supportsFIPS"] }, true] };
var u = { [U]: "booleanEquals", [V]: [{ [U]: i, [V]: [{ [W]: f }, "supportsDualStack"] }, true] };
var v = { "conditions": [{ [U]: b, [V]: [{ [W]: "AccountIdEndpointMode" }] }, { [U]: g, [V]: [{ [W]: "AccountIdEndpointMode" }, "required"] }], "rules": [{ [c]: "Invalid Configuration: AccountIdEndpointMode is required and FIPS is enabled, but FIPS account endpoints are not supported", [T]: c }], [T]: e };
var w = { [U]: b, [V]: [{ [W]: "AccountIdEndpointMode" }] };
var x = { [c]: "Invalid Configuration: AccountIdEndpointMode is required and FIPS is enabled, but FIPS account endpoints are not supported", [T]: c };
var y = { [U]: i, [V]: [{ [W]: f }, "name"] };
var z = { [d]: { "url": "https://dynamodb.{Region}.{PartitionResult#dnsSuffix}", [X]: {}, [Y]: {} }, [T]: d };
var A = { [U]: "not", [V]: [p] };
var B = { [c]: "Invalid Configuration: AccountIdEndpointMode is required and DualStack is enabled, but DualStack account endpoints are not supported", [T]: c };
var C = { [U]: "not", [V]: [{ [U]: g, [V]: [{ [W]: "AccountIdEndpointMode" }, "disabled"] }] };
var D = { [U]: g, [V]: [y, "aws"] };
var E = { [U]: "not", [V]: [q] };
var F = { [U]: g, [V]: [{ [U]: i, [V]: [{ [W]: k }, "service"] }, h] };
var G = { [U]: l, [V]: [{ [U]: i, [V]: [{ [W]: k }, "region"] }, false] };
var H = { [U]: g, [V]: [{ [U]: i, [V]: [{ [W]: k }, "region"] }, "{Region}"] };
var I = { [U]: l, [V]: [{ [U]: i, [V]: [{ [W]: k }, "accountId"] }, false] };
var J = { "url": "https://{ParsedArn#accountId}.ddb.{Region}.{PartitionResult#dnsSuffix}", [X]: {}, [Y]: {} };
var K = { [W]: "ResourceArnList" };
var L = { [W]: "AccountId" };
var M = [p];
var N = [q];
var O = [s];
var P = [w, { [U]: g, [V]: [{ [W]: "AccountIdEndpointMode" }, "required"] }];
var Q = [A];
var R = [{ [W]: "ResourceArn" }];
var _data = { version: "1.0", parameters: { Region: n, UseDualStack: o, UseFIPS: o, Endpoint: n, AccountId: n, AccountIdEndpointMode: n, ResourceArn: n, ResourceArnList: { [S]: a, [T]: "stringArray" } }, rules: [{ conditions: [{ [U]: b, [V]: [{ [W]: "Endpoint" }] }], rules: [{ conditions: M, error: "Invalid Configuration: FIPS and custom endpoint are not supported", [T]: c }, { conditions: N, error: "Invalid Configuration: Dualstack and custom endpoint are not supported", [T]: c }, { endpoint: { url: "{Endpoint}", [X]: r, [Y]: r }, [T]: d }], [T]: e }, { conditions: [{ [U]: b, [V]: O }], rules: [{ conditions: [{ [U]: "aws.partition", [V]: O, assign: f }], rules: [{ conditions: [{ [U]: g, [V]: [s, "local"] }], rules: [{ conditions: M, error: "Invalid Configuration: FIPS and local endpoint are not supported", [T]: c }, { conditions: N, error: "Invalid Configuration: Dualstack and local endpoint are not supported", [T]: c }, { endpoint: { url: "http://localhost:8000", [X]: { authSchemes: [{ signingRegion: "us-east-1", signingName: h, name: "sigv4" }] }, [Y]: r }, [T]: d }], [T]: e }, { conditions: [p, q], rules: [{ conditions: [t, u], rules: [v, { endpoint: { url: "https://dynamodb-fips.{Region}.{PartitionResult#dualStackDnsSuffix}", [X]: r, [Y]: r }, [T]: d }], [T]: e }, { error: "FIPS and DualStack are enabled, but this partition does not support one or both", [T]: c }], [T]: e }, { conditions: M, rules: [{ conditions: [t], rules: [{ conditions: [{ [U]: g, [V]: [y, "aws-us-gov"] }], rules: [v, z], [T]: e }, v, { endpoint: { url: "https://dynamodb-fips.{Region}.{PartitionResult#dnsSuffix}", [X]: r, [Y]: r }, [T]: d }], [T]: e }, { error: "FIPS is enabled but this partition does not support FIPS", [T]: c }], [T]: e }, { conditions: N, rules: [{ conditions: [u], rules: [{ conditions: P, rules: [{ conditions: Q, rules: [B], [T]: e }, x], [T]: e }, { endpoint: { url: "https://dynamodb.{Region}.{PartitionResult#dualStackDnsSuffix}", [X]: r, [Y]: r }, [T]: d }], [T]: e }, { error: "DualStack is enabled but this partition does not support DualStack", [T]: c }], [T]: e }, { conditions: [w, C, D, A, E, { [U]: b, [V]: R }, { [U]: j, [V]: R, assign: k }, F, G, H, I], endpoint: J, [T]: d }, { conditions: [w, C, D, A, E, { [U]: b, [V]: [K] }, { [U]: i, [V]: [K, "[0]"], assign: m }, { [U]: j, [V]: [{ [W]: m }], assign: k }, F, G, H, I], endpoint: J, [T]: d }, { conditions: [w, C, D, A, E, { [U]: b, [V]: [L] }], rules: [{ conditions: [{ [U]: l, [V]: [L, a] }], rules: [{ endpoint: { url: "https://{AccountId}.ddb.{Region}.{PartitionResult#dnsSuffix}", [X]: r, [Y]: r }, [T]: d }], [T]: e }, { error: "Credentials-sourced account ID parameter is invalid", [T]: c }], [T]: e }, { conditions: P, rules: [{ conditions: Q, rules: [{ conditions: [E], rules: [{ conditions: [D], rules: [{ error: "AccountIdEndpointMode is required but no AccountID was provided or able to be loaded", [T]: c }], [T]: e }, { error: "Invalid Configuration: AccountIdEndpointMode is required but account endpoints are not supported in this partition", [T]: c }], [T]: e }, B], [T]: e }, x], [T]: e }, z], [T]: e }], [T]: e }, { error: "Invalid Configuration: Missing Region", [T]: c }] };
var ruleSet = _data;

// node_modules/@aws-sdk/client-dynamodb/dist-es/endpoint/endpointResolver.js
var cache = new EndpointCache({
  size: 50,
  params: [
    "AccountId",
    "AccountIdEndpointMode",
    "Endpoint",
    "Region",
    "ResourceArn",
    "ResourceArnList",
    "UseDualStack",
    "UseFIPS"
  ]
});
var defaultEndpointResolver = (endpointParams, context = {}) => {
  return cache.get(endpointParams, () => resolveEndpoint(ruleSet, {
    endpointParams,
    logger: context.logger
  }));
};
customEndpointFunctions.aws = awsEndpointFunctions;

// node_modules/@aws-sdk/client-dynamodb/dist-es/runtimeConfig.shared.js
var getRuntimeConfig = (config) => {
  return {
    apiVersion: "2012-08-10",
    base64Decoder: (config == null ? void 0 : config.base64Decoder) ?? fromBase64,
    base64Encoder: (config == null ? void 0 : config.base64Encoder) ?? toBase64,
    disableHostPrefix: (config == null ? void 0 : config.disableHostPrefix) ?? false,
    endpointProvider: (config == null ? void 0 : config.endpointProvider) ?? defaultEndpointResolver,
    extensions: (config == null ? void 0 : config.extensions) ?? [],
    httpAuthSchemeProvider: (config == null ? void 0 : config.httpAuthSchemeProvider) ?? defaultDynamoDBHttpAuthSchemeProvider,
    httpAuthSchemes: (config == null ? void 0 : config.httpAuthSchemes) ?? [
      {
        schemeId: "aws.auth#sigv4",
        identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4"),
        signer: new AwsSdkSigV4Signer()
      }
    ],
    logger: (config == null ? void 0 : config.logger) ?? new NoOpLogger(),
    serviceId: (config == null ? void 0 : config.serviceId) ?? "DynamoDB",
    urlParser: (config == null ? void 0 : config.urlParser) ?? parseUrl,
    utf8Decoder: (config == null ? void 0 : config.utf8Decoder) ?? fromUtf8,
    utf8Encoder: (config == null ? void 0 : config.utf8Encoder) ?? toUtf8
  };
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/runtimeConfig.browser.js
var getRuntimeConfig2 = (config) => {
  const defaultsMode = resolveDefaultsModeConfig(config);
  const defaultConfigProvider = () => defaultsMode().then(loadConfigsForDefaultMode);
  const clientSharedValues = getRuntimeConfig(config);
  return {
    ...clientSharedValues,
    ...config,
    runtime: "browser",
    defaultsMode,
    accountIdEndpointMode: (config == null ? void 0 : config.accountIdEndpointMode) ?? (() => Promise.resolve(DEFAULT_ACCOUNT_ID_ENDPOINT_MODE)),
    bodyLengthChecker: (config == null ? void 0 : config.bodyLengthChecker) ?? calculateBodyLength,
    credentialDefaultProvider: (config == null ? void 0 : config.credentialDefaultProvider) ?? ((_) => () => Promise.reject(new Error("Credential is missing"))),
    defaultUserAgentProvider: (config == null ? void 0 : config.defaultUserAgentProvider) ?? createDefaultUserAgentProvider({ serviceId: clientSharedValues.serviceId, clientVersion: package_default.version }),
    endpointDiscoveryEnabledProvider: (config == null ? void 0 : config.endpointDiscoveryEnabledProvider) ?? (() => Promise.resolve(void 0)),
    maxAttempts: (config == null ? void 0 : config.maxAttempts) ?? DEFAULT_MAX_ATTEMPTS,
    region: (config == null ? void 0 : config.region) ?? invalidProvider("Region is missing"),
    requestHandler: FetchHttpHandler.create((config == null ? void 0 : config.requestHandler) ?? defaultConfigProvider),
    retryMode: (config == null ? void 0 : config.retryMode) ?? (async () => (await defaultConfigProvider()).retryMode || DEFAULT_RETRY_MODE),
    sha256: (config == null ? void 0 : config.sha256) ?? Sha256,
    streamCollector: (config == null ? void 0 : config.streamCollector) ?? streamCollector,
    useDualstackEndpoint: (config == null ? void 0 : config.useDualstackEndpoint) ?? (() => Promise.resolve(DEFAULT_USE_DUALSTACK_ENDPOINT)),
    useFipsEndpoint: (config == null ? void 0 : config.useFipsEndpoint) ?? (() => Promise.resolve(DEFAULT_USE_FIPS_ENDPOINT))
  };
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/runtimeExtensions.js
var import_dist76 = __toESM(require_dist());
var import_dist77 = __toESM(require_dist2());
var import_dist78 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-dynamodb/dist-es/auth/httpAuthExtensionConfiguration.js
var import_dist73 = __toESM(require_dist());
var import_dist74 = __toESM(require_dist2());
var import_dist75 = __toESM(require_dist3());
var getHttpAuthExtensionConfiguration = (runtimeConfig) => {
  const _httpAuthSchemes = runtimeConfig.httpAuthSchemes;
  let _httpAuthSchemeProvider = runtimeConfig.httpAuthSchemeProvider;
  let _credentials = runtimeConfig.credentials;
  return {
    setHttpAuthScheme(httpAuthScheme) {
      const index = _httpAuthSchemes.findIndex((scheme) => scheme.schemeId === httpAuthScheme.schemeId);
      if (index === -1) {
        _httpAuthSchemes.push(httpAuthScheme);
      } else {
        _httpAuthSchemes.splice(index, 1, httpAuthScheme);
      }
    },
    httpAuthSchemes() {
      return _httpAuthSchemes;
    },
    setHttpAuthSchemeProvider(httpAuthSchemeProvider) {
      _httpAuthSchemeProvider = httpAuthSchemeProvider;
    },
    httpAuthSchemeProvider() {
      return _httpAuthSchemeProvider;
    },
    setCredentials(credentials) {
      _credentials = credentials;
    },
    credentials() {
      return _credentials;
    }
  };
};
var resolveHttpAuthRuntimeConfig = (config) => {
  return {
    httpAuthSchemes: config.httpAuthSchemes(),
    httpAuthSchemeProvider: config.httpAuthSchemeProvider(),
    credentials: config.credentials()
  };
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/runtimeExtensions.js
var resolveRuntimeExtensions = (runtimeConfig, extensions) => {
  const extensionConfiguration = Object.assign(getAwsRegionExtensionConfiguration(runtimeConfig), getDefaultExtensionConfiguration(runtimeConfig), getHttpHandlerExtensionConfiguration(runtimeConfig), getHttpAuthExtensionConfiguration(runtimeConfig));
  extensions.forEach((extension) => extension.configure(extensionConfiguration));
  return Object.assign(runtimeConfig, resolveAwsRegionExtensionConfiguration(extensionConfiguration), resolveDefaultRuntimeConfig(extensionConfiguration), resolveHttpHandlerRuntimeConfig(extensionConfiguration), resolveHttpAuthRuntimeConfig(extensionConfiguration));
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/DynamoDBClient.js
var DynamoDBClient = class extends Client {
  constructor(...[configuration]) {
    const _config_0 = getRuntimeConfig2(configuration || {});
    super(_config_0);
    __publicField(this, "config");
    this.initConfig = _config_0;
    const _config_1 = resolveClientEndpointParameters(_config_0);
    const _config_2 = resolveAccountIdEndpointModeConfig(_config_1);
    const _config_3 = resolveUserAgentConfig(_config_2);
    const _config_4 = resolveRetryConfig(_config_3);
    const _config_5 = resolveRegionConfig(_config_4);
    const _config_6 = resolveHostHeaderConfig(_config_5);
    const _config_7 = resolveEndpointConfig(_config_6);
    const _config_8 = resolveHttpAuthSchemeConfig(_config_7);
    const _config_9 = resolveEndpointDiscoveryConfig(_config_8, {
      endpointDiscoveryCommandCtor: DescribeEndpointsCommand
    });
    const _config_10 = resolveRuntimeExtensions(_config_9, (configuration == null ? void 0 : configuration.extensions) || []);
    this.config = _config_10;
    this.middlewareStack.use(getUserAgentPlugin(this.config));
    this.middlewareStack.use(getRetryPlugin(this.config));
    this.middlewareStack.use(getContentLengthPlugin(this.config));
    this.middlewareStack.use(getHostHeaderPlugin(this.config));
    this.middlewareStack.use(getLoggerPlugin(this.config));
    this.middlewareStack.use(getRecursionDetectionPlugin(this.config));
    this.middlewareStack.use(getHttpAuthSchemeEndpointRuleSetPlugin(this.config, {
      httpAuthSchemeParametersProvider: defaultDynamoDBHttpAuthSchemeParametersProvider,
      identityProviderConfigProvider: async (config) => new DefaultIdentityProviderConfig({
        "aws.auth#sigv4": config.credentials
      })
    }));
    this.middlewareStack.use(getHttpSigningPlugin(this.config));
  }
  destroy() {
    super.destroy();
  }
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/DynamoDB.js
var import_dist250 = __toESM(require_dist());
var import_dist251 = __toESM(require_dist2());
var import_dist252 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/BatchExecuteStatementCommand.js
var import_dist82 = __toESM(require_dist());
var import_dist83 = __toESM(require_dist2());
var import_dist84 = __toESM(require_dist3());
var BatchExecuteStatementCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "BatchExecuteStatement", {}).n("DynamoDBClient", "BatchExecuteStatementCommand").f(void 0, void 0).ser(se_BatchExecuteStatementCommand).de(de_BatchExecuteStatementCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/BatchGetItemCommand.js
var import_dist85 = __toESM(require_dist());
var import_dist86 = __toESM(require_dist2());
var import_dist87 = __toESM(require_dist3());
var BatchGetItemCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArnList: { type: "operationContextParams", get: (input) => Object.keys((input == null ? void 0 : input.RequestItems) ?? {}) }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "BatchGetItem", {}).n("DynamoDBClient", "BatchGetItemCommand").f(void 0, void 0).ser(se_BatchGetItemCommand).de(de_BatchGetItemCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/BatchWriteItemCommand.js
var import_dist88 = __toESM(require_dist());
var import_dist89 = __toESM(require_dist2());
var import_dist90 = __toESM(require_dist3());
var BatchWriteItemCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArnList: { type: "operationContextParams", get: (input) => Object.keys((input == null ? void 0 : input.RequestItems) ?? {}) }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "BatchWriteItem", {}).n("DynamoDBClient", "BatchWriteItemCommand").f(void 0, void 0).ser(se_BatchWriteItemCommand).de(de_BatchWriteItemCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/CreateBackupCommand.js
var import_dist91 = __toESM(require_dist());
var import_dist92 = __toESM(require_dist2());
var import_dist93 = __toESM(require_dist3());
var CreateBackupCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "CreateBackup", {}).n("DynamoDBClient", "CreateBackupCommand").f(void 0, void 0).ser(se_CreateBackupCommand).de(de_CreateBackupCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/CreateGlobalTableCommand.js
var import_dist94 = __toESM(require_dist());
var import_dist95 = __toESM(require_dist2());
var import_dist96 = __toESM(require_dist3());
var CreateGlobalTableCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "GlobalTableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "CreateGlobalTable", {}).n("DynamoDBClient", "CreateGlobalTableCommand").f(void 0, void 0).ser(se_CreateGlobalTableCommand).de(de_CreateGlobalTableCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/CreateTableCommand.js
var import_dist97 = __toESM(require_dist());
var import_dist98 = __toESM(require_dist2());
var import_dist99 = __toESM(require_dist3());
var CreateTableCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "CreateTable", {}).n("DynamoDBClient", "CreateTableCommand").f(void 0, void 0).ser(se_CreateTableCommand).de(de_CreateTableCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/DeleteBackupCommand.js
var import_dist100 = __toESM(require_dist());
var import_dist101 = __toESM(require_dist2());
var import_dist102 = __toESM(require_dist3());
var DeleteBackupCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "BackupArn" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "DeleteBackup", {}).n("DynamoDBClient", "DeleteBackupCommand").f(void 0, void 0).ser(se_DeleteBackupCommand).de(de_DeleteBackupCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/DeleteItemCommand.js
var import_dist103 = __toESM(require_dist());
var import_dist104 = __toESM(require_dist2());
var import_dist105 = __toESM(require_dist3());
var DeleteItemCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "DeleteItem", {}).n("DynamoDBClient", "DeleteItemCommand").f(void 0, void 0).ser(se_DeleteItemCommand).de(de_DeleteItemCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/DeleteResourcePolicyCommand.js
var import_dist106 = __toESM(require_dist());
var import_dist107 = __toESM(require_dist2());
var import_dist108 = __toESM(require_dist3());
var DeleteResourcePolicyCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "ResourceArn" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "DeleteResourcePolicy", {}).n("DynamoDBClient", "DeleteResourcePolicyCommand").f(void 0, void 0).ser(se_DeleteResourcePolicyCommand).de(de_DeleteResourcePolicyCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/DeleteTableCommand.js
var import_dist109 = __toESM(require_dist());
var import_dist110 = __toESM(require_dist2());
var import_dist111 = __toESM(require_dist3());
var DeleteTableCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "DeleteTable", {}).n("DynamoDBClient", "DeleteTableCommand").f(void 0, void 0).ser(se_DeleteTableCommand).de(de_DeleteTableCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/DescribeBackupCommand.js
var import_dist112 = __toESM(require_dist());
var import_dist113 = __toESM(require_dist2());
var import_dist114 = __toESM(require_dist3());
var DescribeBackupCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "BackupArn" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "DescribeBackup", {}).n("DynamoDBClient", "DescribeBackupCommand").f(void 0, void 0).ser(se_DescribeBackupCommand).de(de_DescribeBackupCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/DescribeContinuousBackupsCommand.js
var import_dist115 = __toESM(require_dist());
var import_dist116 = __toESM(require_dist2());
var import_dist117 = __toESM(require_dist3());
var DescribeContinuousBackupsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "DescribeContinuousBackups", {}).n("DynamoDBClient", "DescribeContinuousBackupsCommand").f(void 0, void 0).ser(se_DescribeContinuousBackupsCommand).de(de_DescribeContinuousBackupsCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/DescribeContributorInsightsCommand.js
var import_dist118 = __toESM(require_dist());
var import_dist119 = __toESM(require_dist2());
var import_dist120 = __toESM(require_dist3());
var DescribeContributorInsightsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "DescribeContributorInsights", {}).n("DynamoDBClient", "DescribeContributorInsightsCommand").f(void 0, void 0).ser(se_DescribeContributorInsightsCommand).de(de_DescribeContributorInsightsCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/DescribeExportCommand.js
var import_dist121 = __toESM(require_dist());
var import_dist122 = __toESM(require_dist2());
var import_dist123 = __toESM(require_dist3());
var DescribeExportCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "ExportArn" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "DescribeExport", {}).n("DynamoDBClient", "DescribeExportCommand").f(void 0, void 0).ser(se_DescribeExportCommand).de(de_DescribeExportCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/DescribeGlobalTableCommand.js
var import_dist124 = __toESM(require_dist());
var import_dist125 = __toESM(require_dist2());
var import_dist126 = __toESM(require_dist3());
var DescribeGlobalTableCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "GlobalTableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "DescribeGlobalTable", {}).n("DynamoDBClient", "DescribeGlobalTableCommand").f(void 0, void 0).ser(se_DescribeGlobalTableCommand).de(de_DescribeGlobalTableCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/DescribeGlobalTableSettingsCommand.js
var import_dist127 = __toESM(require_dist());
var import_dist128 = __toESM(require_dist2());
var import_dist129 = __toESM(require_dist3());
var DescribeGlobalTableSettingsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "GlobalTableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "DescribeGlobalTableSettings", {}).n("DynamoDBClient", "DescribeGlobalTableSettingsCommand").f(void 0, void 0).ser(se_DescribeGlobalTableSettingsCommand).de(de_DescribeGlobalTableSettingsCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/DescribeImportCommand.js
var import_dist130 = __toESM(require_dist());
var import_dist131 = __toESM(require_dist2());
var import_dist132 = __toESM(require_dist3());
var DescribeImportCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "ImportArn" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "DescribeImport", {}).n("DynamoDBClient", "DescribeImportCommand").f(void 0, void 0).ser(se_DescribeImportCommand).de(de_DescribeImportCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/DescribeKinesisStreamingDestinationCommand.js
var import_dist133 = __toESM(require_dist());
var import_dist134 = __toESM(require_dist2());
var import_dist135 = __toESM(require_dist3());
var DescribeKinesisStreamingDestinationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "DescribeKinesisStreamingDestination", {}).n("DynamoDBClient", "DescribeKinesisStreamingDestinationCommand").f(void 0, void 0).ser(se_DescribeKinesisStreamingDestinationCommand).de(de_DescribeKinesisStreamingDestinationCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/DescribeLimitsCommand.js
var import_dist136 = __toESM(require_dist());
var import_dist137 = __toESM(require_dist2());
var import_dist138 = __toESM(require_dist3());
var DescribeLimitsCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "DescribeLimits", {}).n("DynamoDBClient", "DescribeLimitsCommand").f(void 0, void 0).ser(se_DescribeLimitsCommand).de(de_DescribeLimitsCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/DescribeTableCommand.js
var import_dist139 = __toESM(require_dist());
var import_dist140 = __toESM(require_dist2());
var import_dist141 = __toESM(require_dist3());
var DescribeTableCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "DescribeTable", {}).n("DynamoDBClient", "DescribeTableCommand").f(void 0, void 0).ser(se_DescribeTableCommand).de(de_DescribeTableCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/DescribeTableReplicaAutoScalingCommand.js
var import_dist142 = __toESM(require_dist());
var import_dist143 = __toESM(require_dist2());
var import_dist144 = __toESM(require_dist3());
var DescribeTableReplicaAutoScalingCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "DescribeTableReplicaAutoScaling", {}).n("DynamoDBClient", "DescribeTableReplicaAutoScalingCommand").f(void 0, void 0).ser(se_DescribeTableReplicaAutoScalingCommand).de(de_DescribeTableReplicaAutoScalingCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/DescribeTimeToLiveCommand.js
var import_dist145 = __toESM(require_dist());
var import_dist146 = __toESM(require_dist2());
var import_dist147 = __toESM(require_dist3());
var DescribeTimeToLiveCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "DescribeTimeToLive", {}).n("DynamoDBClient", "DescribeTimeToLiveCommand").f(void 0, void 0).ser(se_DescribeTimeToLiveCommand).de(de_DescribeTimeToLiveCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/DisableKinesisStreamingDestinationCommand.js
var import_dist148 = __toESM(require_dist());
var import_dist149 = __toESM(require_dist2());
var import_dist150 = __toESM(require_dist3());
var DisableKinesisStreamingDestinationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "DisableKinesisStreamingDestination", {}).n("DynamoDBClient", "DisableKinesisStreamingDestinationCommand").f(void 0, void 0).ser(se_DisableKinesisStreamingDestinationCommand).de(de_DisableKinesisStreamingDestinationCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/EnableKinesisStreamingDestinationCommand.js
var import_dist151 = __toESM(require_dist());
var import_dist152 = __toESM(require_dist2());
var import_dist153 = __toESM(require_dist3());
var EnableKinesisStreamingDestinationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "EnableKinesisStreamingDestination", {}).n("DynamoDBClient", "EnableKinesisStreamingDestinationCommand").f(void 0, void 0).ser(se_EnableKinesisStreamingDestinationCommand).de(de_EnableKinesisStreamingDestinationCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/ExecuteStatementCommand.js
var import_dist154 = __toESM(require_dist());
var import_dist155 = __toESM(require_dist2());
var import_dist156 = __toESM(require_dist3());
var ExecuteStatementCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "ExecuteStatement", {}).n("DynamoDBClient", "ExecuteStatementCommand").f(void 0, void 0).ser(se_ExecuteStatementCommand).de(de_ExecuteStatementCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/ExecuteTransactionCommand.js
var import_dist157 = __toESM(require_dist());
var import_dist158 = __toESM(require_dist2());
var import_dist159 = __toESM(require_dist3());
var ExecuteTransactionCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "ExecuteTransaction", {}).n("DynamoDBClient", "ExecuteTransactionCommand").f(void 0, void 0).ser(se_ExecuteTransactionCommand).de(de_ExecuteTransactionCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/ExportTableToPointInTimeCommand.js
var import_dist160 = __toESM(require_dist());
var import_dist161 = __toESM(require_dist2());
var import_dist162 = __toESM(require_dist3());
var ExportTableToPointInTimeCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableArn" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "ExportTableToPointInTime", {}).n("DynamoDBClient", "ExportTableToPointInTimeCommand").f(void 0, void 0).ser(se_ExportTableToPointInTimeCommand).de(de_ExportTableToPointInTimeCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/GetItemCommand.js
var import_dist163 = __toESM(require_dist());
var import_dist164 = __toESM(require_dist2());
var import_dist165 = __toESM(require_dist3());
var GetItemCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "GetItem", {}).n("DynamoDBClient", "GetItemCommand").f(void 0, void 0).ser(se_GetItemCommand).de(de_GetItemCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/GetResourcePolicyCommand.js
var import_dist166 = __toESM(require_dist());
var import_dist167 = __toESM(require_dist2());
var import_dist168 = __toESM(require_dist3());
var GetResourcePolicyCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "ResourceArn" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "GetResourcePolicy", {}).n("DynamoDBClient", "GetResourcePolicyCommand").f(void 0, void 0).ser(se_GetResourcePolicyCommand).de(de_GetResourcePolicyCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/ImportTableCommand.js
var import_dist169 = __toESM(require_dist());
var import_dist170 = __toESM(require_dist2());
var import_dist171 = __toESM(require_dist3());
var ImportTableCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "operationContextParams", get: (input) => {
    var _a;
    return (_a = input == null ? void 0 : input.TableCreationParameters) == null ? void 0 : _a.TableName;
  } }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "ImportTable", {}).n("DynamoDBClient", "ImportTableCommand").f(void 0, void 0).ser(se_ImportTableCommand).de(de_ImportTableCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/ListBackupsCommand.js
var import_dist172 = __toESM(require_dist());
var import_dist173 = __toESM(require_dist2());
var import_dist174 = __toESM(require_dist3());
var ListBackupsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "ListBackups", {}).n("DynamoDBClient", "ListBackupsCommand").f(void 0, void 0).ser(se_ListBackupsCommand).de(de_ListBackupsCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/ListContributorInsightsCommand.js
var import_dist175 = __toESM(require_dist());
var import_dist176 = __toESM(require_dist2());
var import_dist177 = __toESM(require_dist3());
var ListContributorInsightsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "ListContributorInsights", {}).n("DynamoDBClient", "ListContributorInsightsCommand").f(void 0, void 0).ser(se_ListContributorInsightsCommand).de(de_ListContributorInsightsCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/ListExportsCommand.js
var import_dist178 = __toESM(require_dist());
var import_dist179 = __toESM(require_dist2());
var import_dist180 = __toESM(require_dist3());
var ListExportsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableArn" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "ListExports", {}).n("DynamoDBClient", "ListExportsCommand").f(void 0, void 0).ser(se_ListExportsCommand).de(de_ListExportsCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/ListGlobalTablesCommand.js
var import_dist181 = __toESM(require_dist());
var import_dist182 = __toESM(require_dist2());
var import_dist183 = __toESM(require_dist3());
var ListGlobalTablesCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "ListGlobalTables", {}).n("DynamoDBClient", "ListGlobalTablesCommand").f(void 0, void 0).ser(se_ListGlobalTablesCommand).de(de_ListGlobalTablesCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/ListImportsCommand.js
var import_dist184 = __toESM(require_dist());
var import_dist185 = __toESM(require_dist2());
var import_dist186 = __toESM(require_dist3());
var ListImportsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableArn" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "ListImports", {}).n("DynamoDBClient", "ListImportsCommand").f(void 0, void 0).ser(se_ListImportsCommand).de(de_ListImportsCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/ListTablesCommand.js
var import_dist187 = __toESM(require_dist());
var import_dist188 = __toESM(require_dist2());
var import_dist189 = __toESM(require_dist3());
var ListTablesCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "ListTables", {}).n("DynamoDBClient", "ListTablesCommand").f(void 0, void 0).ser(se_ListTablesCommand).de(de_ListTablesCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/ListTagsOfResourceCommand.js
var import_dist190 = __toESM(require_dist());
var import_dist191 = __toESM(require_dist2());
var import_dist192 = __toESM(require_dist3());
var ListTagsOfResourceCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "ResourceArn" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "ListTagsOfResource", {}).n("DynamoDBClient", "ListTagsOfResourceCommand").f(void 0, void 0).ser(se_ListTagsOfResourceCommand).de(de_ListTagsOfResourceCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/PutItemCommand.js
var import_dist193 = __toESM(require_dist());
var import_dist194 = __toESM(require_dist2());
var import_dist195 = __toESM(require_dist3());
var PutItemCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "PutItem", {}).n("DynamoDBClient", "PutItemCommand").f(void 0, void 0).ser(se_PutItemCommand).de(de_PutItemCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/PutResourcePolicyCommand.js
var import_dist196 = __toESM(require_dist());
var import_dist197 = __toESM(require_dist2());
var import_dist198 = __toESM(require_dist3());
var PutResourcePolicyCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "ResourceArn" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "PutResourcePolicy", {}).n("DynamoDBClient", "PutResourcePolicyCommand").f(void 0, void 0).ser(se_PutResourcePolicyCommand).de(de_PutResourcePolicyCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/QueryCommand.js
var import_dist199 = __toESM(require_dist());
var import_dist200 = __toESM(require_dist2());
var import_dist201 = __toESM(require_dist3());
var QueryCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "Query", {}).n("DynamoDBClient", "QueryCommand").f(void 0, void 0).ser(se_QueryCommand).de(de_QueryCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/RestoreTableFromBackupCommand.js
var import_dist202 = __toESM(require_dist());
var import_dist203 = __toESM(require_dist2());
var import_dist204 = __toESM(require_dist3());
var RestoreTableFromBackupCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TargetTableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "RestoreTableFromBackup", {}).n("DynamoDBClient", "RestoreTableFromBackupCommand").f(void 0, void 0).ser(se_RestoreTableFromBackupCommand).de(de_RestoreTableFromBackupCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/RestoreTableToPointInTimeCommand.js
var import_dist205 = __toESM(require_dist());
var import_dist206 = __toESM(require_dist2());
var import_dist207 = __toESM(require_dist3());
var RestoreTableToPointInTimeCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TargetTableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "RestoreTableToPointInTime", {}).n("DynamoDBClient", "RestoreTableToPointInTimeCommand").f(void 0, void 0).ser(se_RestoreTableToPointInTimeCommand).de(de_RestoreTableToPointInTimeCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/ScanCommand.js
var import_dist208 = __toESM(require_dist());
var import_dist209 = __toESM(require_dist2());
var import_dist210 = __toESM(require_dist3());
var ScanCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "Scan", {}).n("DynamoDBClient", "ScanCommand").f(void 0, void 0).ser(se_ScanCommand).de(de_ScanCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/TagResourceCommand.js
var import_dist211 = __toESM(require_dist());
var import_dist212 = __toESM(require_dist2());
var import_dist213 = __toESM(require_dist3());
var TagResourceCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "ResourceArn" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "TagResource", {}).n("DynamoDBClient", "TagResourceCommand").f(void 0, void 0).ser(se_TagResourceCommand).de(de_TagResourceCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/TransactGetItemsCommand.js
var import_dist214 = __toESM(require_dist());
var import_dist215 = __toESM(require_dist2());
var import_dist216 = __toESM(require_dist3());
var TransactGetItemsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArnList: {
    type: "operationContextParams",
    get: (input) => {
      var _a;
      return (_a = input == null ? void 0 : input.TransactItems) == null ? void 0 : _a.map((obj) => {
        var _a2;
        return (_a2 = obj == null ? void 0 : obj.Get) == null ? void 0 : _a2.TableName;
      });
    }
  }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "TransactGetItems", {}).n("DynamoDBClient", "TransactGetItemsCommand").f(void 0, void 0).ser(se_TransactGetItemsCommand).de(de_TransactGetItemsCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/TransactWriteItemsCommand.js
var import_dist217 = __toESM(require_dist());
var import_dist218 = __toESM(require_dist2());
var import_dist219 = __toESM(require_dist3());
var TransactWriteItemsCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "TransactWriteItems", {}).n("DynamoDBClient", "TransactWriteItemsCommand").f(void 0, void 0).ser(se_TransactWriteItemsCommand).de(de_TransactWriteItemsCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/UntagResourceCommand.js
var import_dist220 = __toESM(require_dist());
var import_dist221 = __toESM(require_dist2());
var import_dist222 = __toESM(require_dist3());
var UntagResourceCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "ResourceArn" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "UntagResource", {}).n("DynamoDBClient", "UntagResourceCommand").f(void 0, void 0).ser(se_UntagResourceCommand).de(de_UntagResourceCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/UpdateContinuousBackupsCommand.js
var import_dist223 = __toESM(require_dist());
var import_dist224 = __toESM(require_dist2());
var import_dist225 = __toESM(require_dist3());
var UpdateContinuousBackupsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "UpdateContinuousBackups", {}).n("DynamoDBClient", "UpdateContinuousBackupsCommand").f(void 0, void 0).ser(se_UpdateContinuousBackupsCommand).de(de_UpdateContinuousBackupsCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/UpdateContributorInsightsCommand.js
var import_dist226 = __toESM(require_dist());
var import_dist227 = __toESM(require_dist2());
var import_dist228 = __toESM(require_dist3());
var UpdateContributorInsightsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "UpdateContributorInsights", {}).n("DynamoDBClient", "UpdateContributorInsightsCommand").f(void 0, void 0).ser(se_UpdateContributorInsightsCommand).de(de_UpdateContributorInsightsCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/UpdateGlobalTableCommand.js
var import_dist229 = __toESM(require_dist());
var import_dist230 = __toESM(require_dist2());
var import_dist231 = __toESM(require_dist3());
var UpdateGlobalTableCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "GlobalTableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "UpdateGlobalTable", {}).n("DynamoDBClient", "UpdateGlobalTableCommand").f(void 0, void 0).ser(se_UpdateGlobalTableCommand).de(de_UpdateGlobalTableCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/UpdateGlobalTableSettingsCommand.js
var import_dist232 = __toESM(require_dist());
var import_dist233 = __toESM(require_dist2());
var import_dist234 = __toESM(require_dist3());
var UpdateGlobalTableSettingsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "GlobalTableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "UpdateGlobalTableSettings", {}).n("DynamoDBClient", "UpdateGlobalTableSettingsCommand").f(void 0, void 0).ser(se_UpdateGlobalTableSettingsCommand).de(de_UpdateGlobalTableSettingsCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/UpdateItemCommand.js
var import_dist235 = __toESM(require_dist());
var import_dist236 = __toESM(require_dist2());
var import_dist237 = __toESM(require_dist3());
var UpdateItemCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "UpdateItem", {}).n("DynamoDBClient", "UpdateItemCommand").f(void 0, void 0).ser(se_UpdateItemCommand).de(de_UpdateItemCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/UpdateKinesisStreamingDestinationCommand.js
var import_dist238 = __toESM(require_dist());
var import_dist239 = __toESM(require_dist2());
var import_dist240 = __toESM(require_dist3());
var UpdateKinesisStreamingDestinationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "UpdateKinesisStreamingDestination", {}).n("DynamoDBClient", "UpdateKinesisStreamingDestinationCommand").f(void 0, void 0).ser(se_UpdateKinesisStreamingDestinationCommand).de(de_UpdateKinesisStreamingDestinationCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/UpdateTableCommand.js
var import_dist241 = __toESM(require_dist());
var import_dist242 = __toESM(require_dist2());
var import_dist243 = __toESM(require_dist3());
var UpdateTableCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "UpdateTable", {}).n("DynamoDBClient", "UpdateTableCommand").f(void 0, void 0).ser(se_UpdateTableCommand).de(de_UpdateTableCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/UpdateTableReplicaAutoScalingCommand.js
var import_dist244 = __toESM(require_dist());
var import_dist245 = __toESM(require_dist2());
var import_dist246 = __toESM(require_dist3());
var UpdateTableReplicaAutoScalingCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "UpdateTableReplicaAutoScaling", {}).n("DynamoDBClient", "UpdateTableReplicaAutoScalingCommand").f(void 0, void 0).ser(se_UpdateTableReplicaAutoScalingCommand).de(de_UpdateTableReplicaAutoScalingCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/UpdateTimeToLiveCommand.js
var import_dist247 = __toESM(require_dist());
var import_dist248 = __toESM(require_dist2());
var import_dist249 = __toESM(require_dist3());
var UpdateTimeToLiveCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  ResourceArn: { type: "contextParams", name: "TableName" }
}).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("DynamoDB_20120810", "UpdateTimeToLive", {}).n("DynamoDBClient", "UpdateTimeToLiveCommand").f(void 0, void 0).ser(se_UpdateTimeToLiveCommand).de(de_UpdateTimeToLiveCommand).build() {
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/DynamoDB.js
var commands = {
  BatchExecuteStatementCommand,
  BatchGetItemCommand,
  BatchWriteItemCommand,
  CreateBackupCommand,
  CreateGlobalTableCommand,
  CreateTableCommand,
  DeleteBackupCommand,
  DeleteItemCommand,
  DeleteResourcePolicyCommand,
  DeleteTableCommand,
  DescribeBackupCommand,
  DescribeContinuousBackupsCommand,
  DescribeContributorInsightsCommand,
  DescribeEndpointsCommand,
  DescribeExportCommand,
  DescribeGlobalTableCommand,
  DescribeGlobalTableSettingsCommand,
  DescribeImportCommand,
  DescribeKinesisStreamingDestinationCommand,
  DescribeLimitsCommand,
  DescribeTableCommand,
  DescribeTableReplicaAutoScalingCommand,
  DescribeTimeToLiveCommand,
  DisableKinesisStreamingDestinationCommand,
  EnableKinesisStreamingDestinationCommand,
  ExecuteStatementCommand,
  ExecuteTransactionCommand,
  ExportTableToPointInTimeCommand,
  GetItemCommand,
  GetResourcePolicyCommand,
  ImportTableCommand,
  ListBackupsCommand,
  ListContributorInsightsCommand,
  ListExportsCommand,
  ListGlobalTablesCommand,
  ListImportsCommand,
  ListTablesCommand,
  ListTagsOfResourceCommand,
  PutItemCommand,
  PutResourcePolicyCommand,
  QueryCommand,
  RestoreTableFromBackupCommand,
  RestoreTableToPointInTimeCommand,
  ScanCommand,
  TagResourceCommand,
  TransactGetItemsCommand,
  TransactWriteItemsCommand,
  UntagResourceCommand,
  UpdateContinuousBackupsCommand,
  UpdateContributorInsightsCommand,
  UpdateGlobalTableCommand,
  UpdateGlobalTableSettingsCommand,
  UpdateItemCommand,
  UpdateKinesisStreamingDestinationCommand,
  UpdateTableCommand,
  UpdateTableReplicaAutoScalingCommand,
  UpdateTimeToLiveCommand
};
var DynamoDB = class extends DynamoDBClient {
};
createAggregatedClient(commands, DynamoDB);

// node_modules/@aws-sdk/client-dynamodb/dist-es/commands/index.js
var import_dist253 = __toESM(require_dist());
var import_dist254 = __toESM(require_dist2());
var import_dist255 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-dynamodb/dist-es/pagination/index.js
var import_dist277 = __toESM(require_dist());
var import_dist278 = __toESM(require_dist2());
var import_dist279 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-dynamodb/dist-es/pagination/Interfaces.js
var import_dist256 = __toESM(require_dist());
var import_dist257 = __toESM(require_dist2());
var import_dist258 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-dynamodb/dist-es/pagination/ListContributorInsightsPaginator.js
var import_dist259 = __toESM(require_dist());
var import_dist260 = __toESM(require_dist2());
var import_dist261 = __toESM(require_dist3());
var paginateListContributorInsights = createPaginator(DynamoDBClient, ListContributorInsightsCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-dynamodb/dist-es/pagination/ListExportsPaginator.js
var import_dist262 = __toESM(require_dist());
var import_dist263 = __toESM(require_dist2());
var import_dist264 = __toESM(require_dist3());
var paginateListExports = createPaginator(DynamoDBClient, ListExportsCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-dynamodb/dist-es/pagination/ListImportsPaginator.js
var import_dist265 = __toESM(require_dist());
var import_dist266 = __toESM(require_dist2());
var import_dist267 = __toESM(require_dist3());
var paginateListImports = createPaginator(DynamoDBClient, ListImportsCommand, "NextToken", "NextToken", "PageSize");

// node_modules/@aws-sdk/client-dynamodb/dist-es/pagination/ListTablesPaginator.js
var import_dist268 = __toESM(require_dist());
var import_dist269 = __toESM(require_dist2());
var import_dist270 = __toESM(require_dist3());
var paginateListTables = createPaginator(DynamoDBClient, ListTablesCommand, "ExclusiveStartTableName", "LastEvaluatedTableName", "Limit");

// node_modules/@aws-sdk/client-dynamodb/dist-es/pagination/QueryPaginator.js
var import_dist271 = __toESM(require_dist());
var import_dist272 = __toESM(require_dist2());
var import_dist273 = __toESM(require_dist3());
var paginateQuery = createPaginator(DynamoDBClient, QueryCommand, "ExclusiveStartKey", "LastEvaluatedKey", "Limit");

// node_modules/@aws-sdk/client-dynamodb/dist-es/pagination/ScanPaginator.js
var import_dist274 = __toESM(require_dist());
var import_dist275 = __toESM(require_dist2());
var import_dist276 = __toESM(require_dist3());
var paginateScan = createPaginator(DynamoDBClient, ScanCommand, "ExclusiveStartKey", "LastEvaluatedKey", "Limit");

// node_modules/@aws-sdk/client-dynamodb/dist-es/waiters/index.js
var import_dist286 = __toESM(require_dist());
var import_dist287 = __toESM(require_dist2());
var import_dist288 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-dynamodb/dist-es/waiters/waitForTableExists.js
var import_dist280 = __toESM(require_dist());
var import_dist281 = __toESM(require_dist2());
var import_dist282 = __toESM(require_dist3());
var checkState = async (client, input) => {
  let reason;
  try {
    const result = await client.send(new DescribeTableCommand(input));
    reason = result;
    try {
      const returnComparator = () => {
        return result.Table.TableStatus;
      };
      if (returnComparator() === "ACTIVE") {
        return { state: WaiterState.SUCCESS, reason };
      }
    } catch (e2) {
    }
  } catch (exception) {
    reason = exception;
    if (exception.name && exception.name == "ResourceNotFoundException") {
      return { state: WaiterState.RETRY, reason };
    }
  }
  return { state: WaiterState.RETRY, reason };
};
var waitForTableExists = async (params, input) => {
  const serviceDefaults = { minDelay: 20, maxDelay: 120 };
  return createWaiter({ ...serviceDefaults, ...params }, input, checkState);
};
var waitUntilTableExists = async (params, input) => {
  const serviceDefaults = { minDelay: 20, maxDelay: 120 };
  const result = await createWaiter({ ...serviceDefaults, ...params }, input, checkState);
  return checkExceptions(result);
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/waiters/waitForTableNotExists.js
var import_dist283 = __toESM(require_dist());
var import_dist284 = __toESM(require_dist2());
var import_dist285 = __toESM(require_dist3());
var checkState2 = async (client, input) => {
  let reason;
  try {
    const result = await client.send(new DescribeTableCommand(input));
    reason = result;
  } catch (exception) {
    reason = exception;
    if (exception.name && exception.name == "ResourceNotFoundException") {
      return { state: WaiterState.SUCCESS, reason };
    }
  }
  return { state: WaiterState.RETRY, reason };
};
var waitForTableNotExists = async (params, input) => {
  const serviceDefaults = { minDelay: 20, maxDelay: 120 };
  return createWaiter({ ...serviceDefaults, ...params }, input, checkState2);
};
var waitUntilTableNotExists = async (params, input) => {
  const serviceDefaults = { minDelay: 20, maxDelay: 120 };
  const result = await createWaiter({ ...serviceDefaults, ...params }, input, checkState2);
  return checkExceptions(result);
};

// node_modules/@aws-sdk/client-dynamodb/dist-es/models/index.js
var import_dist289 = __toESM(require_dist());
var import_dist290 = __toESM(require_dist2());
var import_dist291 = __toESM(require_dist3());

export {
  DynamoDBServiceException,
  ApproximateCreationDateTimePrecision,
  AttributeAction,
  ScalarAttributeType,
  BackupStatus,
  BackupType,
  BillingMode,
  KeyType,
  ProjectionType,
  SSEType,
  SSEStatus,
  StreamViewType,
  TimeToLiveStatus,
  BackupInUseException,
  BackupNotFoundException,
  BackupTypeFilter,
  ReturnConsumedCapacity,
  ReturnValuesOnConditionCheckFailure,
  BatchStatementErrorCodeEnum,
  InternalServerError,
  RequestLimitExceeded,
  InvalidEndpointException,
  ProvisionedThroughputExceededException,
  ResourceNotFoundException,
  ReturnItemCollectionMetrics,
  ItemCollectionSizeLimitExceededException,
  ComparisonOperator,
  ConditionalOperator,
  ContinuousBackupsStatus,
  PointInTimeRecoveryStatus,
  ContinuousBackupsUnavailableException,
  ContributorInsightsAction,
  ContributorInsightsStatus,
  LimitExceededException,
  TableInUseException,
  TableNotFoundException,
  GlobalTableStatus,
  IndexStatus,
  ReplicaStatus,
  TableClass,
  TableStatus,
  GlobalTableAlreadyExistsException,
  MultiRegionConsistency,
  ResourceInUseException,
  ReturnValue,
  ReplicatedWriteConflictException,
  TransactionConflictException,
  PolicyNotFoundException,
  ExportFormat,
  ExportStatus,
  ExportType,
  ExportViewType,
  S3SseAlgorithm,
  ExportNotFoundException,
  GlobalTableNotFoundException,
  ImportStatus,
  InputCompressionType,
  InputFormat,
  ImportNotFoundException,
  DestinationStatus,
  DuplicateItemException,
  IdempotentParameterMismatchException,
  TransactionInProgressException,
  ExportConflictException,
  InvalidExportTimeException,
  PointInTimeRecoveryUnavailableException,
  ImportConflictException,
  Select,
  TableAlreadyExistsException,
  InvalidRestoreTimeException,
  ReplicaAlreadyExistsException,
  ReplicaNotFoundException,
  IndexNotFoundException,
  AttributeValue,
  ConditionalCheckFailedException,
  TransactionCanceledException,
  DescribeEndpointsCommand,
  DynamoDBClient,
  BatchExecuteStatementCommand,
  BatchGetItemCommand,
  BatchWriteItemCommand,
  CreateBackupCommand,
  CreateGlobalTableCommand,
  CreateTableCommand,
  DeleteBackupCommand,
  DeleteItemCommand,
  DeleteResourcePolicyCommand,
  DeleteTableCommand,
  DescribeBackupCommand,
  DescribeContinuousBackupsCommand,
  DescribeContributorInsightsCommand,
  DescribeExportCommand,
  DescribeGlobalTableCommand,
  DescribeGlobalTableSettingsCommand,
  DescribeImportCommand,
  DescribeKinesisStreamingDestinationCommand,
  DescribeLimitsCommand,
  DescribeTableCommand,
  DescribeTableReplicaAutoScalingCommand,
  DescribeTimeToLiveCommand,
  DisableKinesisStreamingDestinationCommand,
  EnableKinesisStreamingDestinationCommand,
  ExecuteStatementCommand,
  ExecuteTransactionCommand,
  ExportTableToPointInTimeCommand,
  GetItemCommand,
  GetResourcePolicyCommand,
  ImportTableCommand,
  ListBackupsCommand,
  ListContributorInsightsCommand,
  ListExportsCommand,
  ListGlobalTablesCommand,
  ListImportsCommand,
  ListTablesCommand,
  ListTagsOfResourceCommand,
  PutItemCommand,
  PutResourcePolicyCommand,
  QueryCommand,
  RestoreTableFromBackupCommand,
  RestoreTableToPointInTimeCommand,
  ScanCommand,
  TagResourceCommand,
  TransactGetItemsCommand,
  TransactWriteItemsCommand,
  UntagResourceCommand,
  UpdateContinuousBackupsCommand,
  UpdateContributorInsightsCommand,
  UpdateGlobalTableCommand,
  UpdateGlobalTableSettingsCommand,
  UpdateItemCommand,
  UpdateKinesisStreamingDestinationCommand,
  UpdateTableCommand,
  UpdateTableReplicaAutoScalingCommand,
  UpdateTimeToLiveCommand,
  DynamoDB,
  paginateListContributorInsights,
  paginateListExports,
  paginateListImports,
  paginateListTables,
  paginateQuery,
  paginateScan,
  waitForTableExists,
  waitUntilTableExists,
  waitForTableNotExists,
  waitUntilTableNotExists
};
//# sourceMappingURL=chunk-GY5FN66G.js.map
