import __buffer_polyfill from 'vite-plugin-node-polyfills/shims/buffer'
globalThis.Buffer = globalThis.Buffer || __buffer_polyfill
import __global_polyfill from 'vite-plugin-node-polyfills/shims/global'
globalThis.global = globalThis.global || __global_polyfill
import __process_polyfill from 'vite-plugin-node-polyfills/shims/process'
globalThis.process = globalThis.process || __process_polyfill

import {
  __publicField,
  __toESM,
  require_dist,
  require_dist2,
  require_dist3
} from "./chunk-TJZ7TNHW.js";

// node_modules/@aws-sdk/util-dynamodb/dist-es/index.js
var import_dist19 = __toESM(require_dist());
var import_dist20 = __toESM(require_dist2());
var import_dist21 = __toESM(require_dist3());

// node_modules/@aws-sdk/util-dynamodb/dist-es/NumberValue.js
var import_dist = __toESM(require_dist());
var import_dist2 = __toESM(require_dist2());
var import_dist3 = __toESM(require_dist3());
var NumberValue = class _NumberValue {
  constructor(value) {
    __publicField(this, "value");
    if (typeof value === "object" && "N" in value) {
      this.value = String(value.N);
    } else {
      this.value = String(value);
    }
    const valueOf = typeof value.valueOf() === "number" ? value.valueOf() : 0;
    const imprecise = valueOf > Number.MAX_SAFE_INTEGER || valueOf < Number.MIN_SAFE_INTEGER || Math.abs(valueOf) === Infinity || Number.isNaN(valueOf);
    if (imprecise) {
      throw new Error(`NumberValue should not be initialized with an imprecise number=${valueOf}. Use a string instead.`);
    }
  }
  static from(value) {
    return new _NumberValue(value);
  }
  toAttributeValue() {
    return {
      N: this.toString()
    };
  }
  toBigInt() {
    const stringValue = this.toString();
    return BigInt(stringValue);
  }
  toString() {
    return String(this.value);
  }
  valueOf() {
    return this.toString();
  }
};

// node_modules/@aws-sdk/util-dynamodb/dist-es/convertToAttr.js
var import_dist4 = __toESM(require_dist());
var import_dist5 = __toESM(require_dist2());
var import_dist6 = __toESM(require_dist3());
var convertToAttr = (data, options) => {
  var _a, _b, _c, _d, _e, _f;
  if (data === void 0) {
    throw new Error(`Pass options.removeUndefinedValues=true to remove undefined values from map/array/set.`);
  } else if (data === null && typeof data === "object") {
    return convertToNullAttr();
  } else if (Array.isArray(data)) {
    return convertToListAttr(data, options);
  } else if (((_a = data == null ? void 0 : data.constructor) == null ? void 0 : _a.name) === "Set") {
    return convertToSetAttr(data, options);
  } else if (((_b = data == null ? void 0 : data.constructor) == null ? void 0 : _b.name) === "Map") {
    return convertToMapAttrFromIterable(data, options);
  } else if (((_c = data == null ? void 0 : data.constructor) == null ? void 0 : _c.name) === "Object" || !data.constructor && typeof data === "object") {
    return convertToMapAttrFromEnumerableProps(data, options);
  } else if (isBinary(data)) {
    if (data.length === 0 && (options == null ? void 0 : options.convertEmptyValues)) {
      return convertToNullAttr();
    }
    return convertToBinaryAttr(data);
  } else if (typeof data === "boolean" || ((_d = data == null ? void 0 : data.constructor) == null ? void 0 : _d.name) === "Boolean") {
    return { BOOL: data.valueOf() };
  } else if (typeof data === "number" || ((_e = data == null ? void 0 : data.constructor) == null ? void 0 : _e.name) === "Number") {
    return convertToNumberAttr(data, options);
  } else if (data instanceof NumberValue) {
    return data.toAttributeValue();
  } else if (typeof data === "bigint") {
    return convertToBigIntAttr(data);
  } else if (typeof data === "string" || ((_f = data == null ? void 0 : data.constructor) == null ? void 0 : _f.name) === "String") {
    if (data.length === 0 && (options == null ? void 0 : options.convertEmptyValues)) {
      return convertToNullAttr();
    }
    return convertToStringAttr(data);
  } else if ((options == null ? void 0 : options.convertClassInstanceToMap) && typeof data === "object") {
    return convertToMapAttrFromEnumerableProps(data, options);
  }
  throw new Error(`Unsupported type passed: ${data}. Pass options.convertClassInstanceToMap=true to marshall typeof object as map attribute.`);
};
var convertToListAttr = (data, options) => ({
  L: data.filter((item) => typeof item !== "function" && (!(options == null ? void 0 : options.removeUndefinedValues) || (options == null ? void 0 : options.removeUndefinedValues) && item !== void 0)).map((item) => convertToAttr(item, options))
});
var convertToSetAttr = (set, options) => {
  const setToOperate = (options == null ? void 0 : options.removeUndefinedValues) ? new Set([...set].filter((value) => value !== void 0)) : set;
  if (!(options == null ? void 0 : options.removeUndefinedValues) && setToOperate.has(void 0)) {
    throw new Error(`Pass options.removeUndefinedValues=true to remove undefined values from map/array/set.`);
  }
  if (setToOperate.size === 0) {
    if (options == null ? void 0 : options.convertEmptyValues) {
      return convertToNullAttr();
    }
    throw new Error(`Pass a non-empty set, or options.convertEmptyValues=true.`);
  }
  const item = setToOperate.values().next().value;
  if (item instanceof NumberValue) {
    return {
      NS: Array.from(setToOperate).map((_) => _.toString())
    };
  } else if (typeof item === "number") {
    return {
      NS: Array.from(setToOperate).map((num) => convertToNumberAttr(num, options)).map((item2) => item2.N)
    };
  } else if (typeof item === "bigint") {
    return {
      NS: Array.from(setToOperate).map(convertToBigIntAttr).map((item2) => item2.N)
    };
  } else if (typeof item === "string") {
    return {
      SS: Array.from(setToOperate).map(convertToStringAttr).map((item2) => item2.S)
    };
  } else if (isBinary(item)) {
    return {
      BS: Array.from(setToOperate).map(convertToBinaryAttr).map((item2) => item2.B)
    };
  } else {
    throw new Error(`Only Number Set (NS), Binary Set (BS) or String Set (SS) are allowed.`);
  }
};
var convertToMapAttrFromIterable = (data, options) => ({
  M: ((data2) => {
    const map = {};
    for (const [key, value] of data2) {
      if (typeof value !== "function" && (value !== void 0 || !(options == null ? void 0 : options.removeUndefinedValues))) {
        map[key] = convertToAttr(value, options);
      }
    }
    return map;
  })(data)
});
var convertToMapAttrFromEnumerableProps = (data, options) => ({
  M: ((data2) => {
    const map = {};
    for (const key in data2) {
      const value = data2[key];
      if (typeof value !== "function" && (value !== void 0 || !(options == null ? void 0 : options.removeUndefinedValues))) {
        map[key] = convertToAttr(value, options);
      }
    }
    return map;
  })(data)
});
var convertToNullAttr = () => ({ NULL: true });
var convertToBinaryAttr = (data) => ({ B: data });
var convertToStringAttr = (data) => ({ S: data.toString() });
var convertToBigIntAttr = (data) => ({ N: data.toString() });
var validateBigIntAndThrow = (errorPrefix) => {
  throw new Error(`${errorPrefix} Use NumberValue from @aws-sdk/lib-dynamodb.`);
};
var convertToNumberAttr = (num, options) => {
  if ([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY].map((val) => val.toString()).includes(num.toString())) {
    throw new Error(`Special numeric value ${num.toString()} is not allowed`);
  } else if (!(options == null ? void 0 : options.allowImpreciseNumbers)) {
    if (Number(num) > Number.MAX_SAFE_INTEGER) {
      validateBigIntAndThrow(`Number ${num.toString()} is greater than Number.MAX_SAFE_INTEGER.`);
    } else if (Number(num) < Number.MIN_SAFE_INTEGER) {
      validateBigIntAndThrow(`Number ${num.toString()} is lesser than Number.MIN_SAFE_INTEGER.`);
    }
  }
  return { N: num.toString() };
};
var isBinary = (data) => {
  const binaryTypes = [
    "ArrayBuffer",
    "Blob",
    "Buffer",
    "DataView",
    "File",
    "Int8Array",
    "Uint8Array",
    "Uint8ClampedArray",
    "Int16Array",
    "Uint16Array",
    "Int32Array",
    "Uint32Array",
    "Float32Array",
    "Float64Array",
    "BigInt64Array",
    "BigUint64Array"
  ];
  if (data == null ? void 0 : data.constructor) {
    return binaryTypes.includes(data.constructor.name);
  }
  return false;
};

// node_modules/@aws-sdk/util-dynamodb/dist-es/convertToNative.js
var import_dist7 = __toESM(require_dist());
var import_dist8 = __toESM(require_dist2());
var import_dist9 = __toESM(require_dist3());
var convertToNative = (data, options) => {
  for (const [key, value] of Object.entries(data)) {
    if (value !== void 0) {
      switch (key) {
        case "NULL":
          return null;
        case "BOOL":
          return Boolean(value);
        case "N":
          return convertNumber(value, options);
        case "B":
          return convertBinary(value);
        case "S":
          return convertString(value);
        case "L":
          return convertList(value, options);
        case "M":
          return convertMap(value, options);
        case "NS":
          return new Set(value.map((item) => convertNumber(item, options)));
        case "BS":
          return new Set(value.map(convertBinary));
        case "SS":
          return new Set(value.map(convertString));
        default:
          throw new Error(`Unsupported type passed: ${key}`);
      }
    }
  }
  throw new Error(`No value defined: ${JSON.stringify(data)}`);
};
var convertNumber = (numString, options) => {
  if (typeof (options == null ? void 0 : options.wrapNumbers) === "function") {
    return options == null ? void 0 : options.wrapNumbers(numString);
  }
  if (options == null ? void 0 : options.wrapNumbers) {
    return NumberValue.from(numString);
  }
  const num = Number(numString);
  const infinityValues = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];
  const isLargeFiniteNumber = (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) && !infinityValues.includes(num);
  if (isLargeFiniteNumber) {
    if (typeof BigInt === "function") {
      try {
        return BigInt(numString);
      } catch (error) {
        throw new Error(`${numString} can't be converted to BigInt. Set options.wrapNumbers to get string value.`);
      }
    } else {
      throw new Error(`${numString} is outside SAFE_INTEGER bounds. Set options.wrapNumbers to get string value.`);
    }
  }
  return num;
};
var convertString = (stringValue) => stringValue;
var convertBinary = (binaryValue) => binaryValue;
var convertList = (list, options) => list.map((item) => convertToNative(item, options));
var convertMap = (map, options) => Object.entries(map).reduce((acc, [key, value]) => (acc[key] = convertToNative(value, options), acc), {});

// node_modules/@aws-sdk/util-dynamodb/dist-es/marshall.js
var import_dist10 = __toESM(require_dist());
var import_dist11 = __toESM(require_dist2());
var import_dist12 = __toESM(require_dist3());
function marshall(data, options) {
  const attributeValue = convertToAttr(data, options);
  const [key, value] = Object.entries(attributeValue)[0];
  switch (key) {
    case "M":
    case "L":
      return (options == null ? void 0 : options.convertTopLevelContainer) ? attributeValue : value;
    case "SS":
    case "NS":
    case "BS":
    case "S":
    case "N":
    case "B":
    case "NULL":
    case "BOOL":
    case "$unknown":
    default:
      return attributeValue;
  }
}

// node_modules/@aws-sdk/util-dynamodb/dist-es/models.js
var import_dist13 = __toESM(require_dist());
var import_dist14 = __toESM(require_dist2());
var import_dist15 = __toESM(require_dist3());

// node_modules/@aws-sdk/util-dynamodb/dist-es/unmarshall.js
var import_dist16 = __toESM(require_dist());
var import_dist17 = __toESM(require_dist2());
var import_dist18 = __toESM(require_dist3());
var unmarshall = (data, options) => {
  if (options == null ? void 0 : options.convertWithoutMapWrapper) {
    return convertToNative(data, options);
  }
  return convertToNative({ M: data }, options);
};

export {
  NumberValue,
  convertToAttr,
  convertToNative,
  marshall,
  unmarshall
};
//# sourceMappingURL=chunk-3XGQZKZ2.js.map
