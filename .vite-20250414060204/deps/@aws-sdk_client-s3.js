import __buffer_polyfill from 'vite-plugin-node-polyfills/shims/buffer'
globalThis.Buffer = globalThis.Buffer || __buffer_polyfill
import __global_polyfill from 'vite-plugin-node-polyfills/shims/global'
globalThis.global = globalThis.global || __global_polyfill
import __process_polyfill from 'vite-plugin-node-polyfills/shims/process'
globalThis.process = globalThis.process || __process_polyfill

import {
  SignatureV4MultiRegion,
  getCheckContentLengthHeaderPlugin,
  getRegionRedirectMiddlewarePlugin,
  getS3ExpiresMiddlewarePlugin,
  getS3ExpressHttpSigningPlugin,
  getS3ExpressPlugin,
  getThrow200ExceptionsPlugin,
  getValidateBucketNamePlugin,
  resolveS3Config,
  signatureV4CrtContainer
} from "./chunk-YLBASHB2.js";
import {
  WaiterState,
  checkExceptions,
  createWaiter
} from "./chunk-2C3IIZPC.js";
import {
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_RETRY_MODE,
  DEFAULT_USE_DUALSTACK_ENDPOINT,
  DEFAULT_USE_FIPS_ENDPOINT,
  EndpointCache,
  Sha256,
  awsEndpointFunctions,
  calculateBodyLength,
  convertToBuffer,
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
  isEmptyData,
  locateWindow,
  numToUint8,
  resolveAwsRegionExtensionConfiguration,
  resolveDefaultsModeConfig,
  resolveEndpoint,
  resolveHostHeaderConfig,
  resolveRegionConfig,
  resolveRetryConfig,
  resolveUserAgentConfig,
  supportsWebCrypto,
  uint32ArrayFrom
} from "./chunk-LU5PQ5O4.js";
import "./chunk-YW2T63S4.js";
import {
  AwsSdkSigV4ASigner,
  AwsSdkSigV4Signer,
  Client,
  Command,
  DefaultIdentityProviderConfig,
  FetchHttpHandler,
  HttpRequest,
  NoOpLogger,
  SENSITIVE_STRING,
  ServiceException,
  collectBody,
  createAggregatedClient,
  createBufferedReadable,
  createChecksumStream,
  createPaginator,
  dateToUtcString,
  decorateServiceException,
  expectNonNull,
  expectObject,
  expectString,
  expectUnion,
  fromBase64,
  fromHex,
  fromUtf8,
  getArrayIfSingleItem,
  getAwsChunkedEncodingStream,
  getDefaultExtensionConfiguration,
  getEndpointPlugin,
  getHttpAuthSchemeEndpointRuleSetPlugin,
  getHttpHandlerExtensionConfiguration,
  getHttpSigningPlugin,
  getSerdePlugin,
  getSmithyContext,
  isArrayBuffer,
  isSerializableHeaderValue,
  isValidHostname,
  loadConfigsForDefaultMode,
  loadRestXmlErrorCode,
  map,
  normalizeProvider,
  parseBoolean,
  parseRfc3339DateTimeWithOffset,
  parseRfc7231DateTime,
  parseUrl,
  parseXmlBody,
  parseXmlErrorBody,
  quoteHeader,
  requestBuilder,
  resolveAwsSdkSigV4AConfig,
  resolveAwsSdkSigV4Config,
  resolveDefaultRuntimeConfig,
  resolveEndpointConfig,
  resolveHttpHandlerRuntimeConfig,
  resolveParams,
  sdkStreamMixin,
  serializeDateTime,
  setFeature,
  streamCollector,
  strictParseInt32,
  strictParseLong,
  toBase64,
  toHex,
  toUint8Array,
  toUtf8,
  withBaseException
} from "./chunk-XMFGMGPV.js";
import {
  __awaiter,
  __generator,
  __values
} from "./chunk-EQYPCM4A.js";
import {
  __publicField,
  __toESM,
  require_dist,
  require_dist2,
  require_dist3
} from "./chunk-YJHZJMYG.js";

// node_modules/@aws-sdk/client-s3/dist-es/index.js
var import_dist586 = __toESM(require_dist());
var import_dist587 = __toESM(require_dist2());
var import_dist588 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-s3/dist-es/S3Client.js
var import_dist244 = __toESM(require_dist());
var import_dist245 = __toESM(require_dist2());
var import_dist246 = __toESM(require_dist3());

// node_modules/@aws-sdk/middleware-expect-continue/dist-es/index.js
var import_dist = __toESM(require_dist());
var import_dist2 = __toESM(require_dist2());
var import_dist3 = __toESM(require_dist3());
function addExpectContinueMiddleware(options) {
  return (next) => async (args) => {
    var _a2, _b;
    const { request } = args;
    if (HttpRequest.isInstance(request) && request.body && options.runtime === "node") {
      if (((_b = (_a2 = options.requestHandler) == null ? void 0 : _a2.constructor) == null ? void 0 : _b.name) !== "FetchHttpHandler") {
        request.headers = {
          ...request.headers,
          Expect: "100-continue"
        };
      }
    }
    return next({
      ...args,
      request
    });
  };
}
var addExpectContinueMiddlewareOptions = {
  step: "build",
  tags: ["SET_EXPECT_HEADER", "EXPECT_HEADER"],
  name: "addExpectContinueMiddleware",
  override: true
};
var getAddExpectContinuePlugin = (options) => ({
  applyToStack: (clientStack) => {
    clientStack.add(addExpectContinueMiddleware(options), addExpectContinueMiddlewareOptions);
  }
});

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/index.js
var import_dist85 = __toESM(require_dist());
var import_dist86 = __toESM(require_dist2());
var import_dist87 = __toESM(require_dist3());

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/NODE_REQUEST_CHECKSUM_CALCULATION_CONFIG_OPTIONS.js
var import_dist10 = __toESM(require_dist());
var import_dist11 = __toESM(require_dist2());
var import_dist12 = __toESM(require_dist3());

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/constants.js
var import_dist4 = __toESM(require_dist());
var import_dist5 = __toESM(require_dist2());
var import_dist6 = __toESM(require_dist3());
var RequestChecksumCalculation = {
  WHEN_SUPPORTED: "WHEN_SUPPORTED",
  WHEN_REQUIRED: "WHEN_REQUIRED"
};
var DEFAULT_REQUEST_CHECKSUM_CALCULATION = RequestChecksumCalculation.WHEN_SUPPORTED;
var ResponseChecksumValidation = {
  WHEN_SUPPORTED: "WHEN_SUPPORTED",
  WHEN_REQUIRED: "WHEN_REQUIRED"
};
var DEFAULT_RESPONSE_CHECKSUM_VALIDATION = RequestChecksumCalculation.WHEN_SUPPORTED;
var ChecksumAlgorithm;
(function(ChecksumAlgorithm3) {
  ChecksumAlgorithm3["MD5"] = "MD5";
  ChecksumAlgorithm3["CRC32"] = "CRC32";
  ChecksumAlgorithm3["CRC32C"] = "CRC32C";
  ChecksumAlgorithm3["CRC64NVME"] = "CRC64NVME";
  ChecksumAlgorithm3["SHA1"] = "SHA1";
  ChecksumAlgorithm3["SHA256"] = "SHA256";
})(ChecksumAlgorithm || (ChecksumAlgorithm = {}));
var ChecksumLocation;
(function(ChecksumLocation2) {
  ChecksumLocation2["HEADER"] = "header";
  ChecksumLocation2["TRAILER"] = "trailer";
})(ChecksumLocation || (ChecksumLocation = {}));
var DEFAULT_CHECKSUM_ALGORITHM = ChecksumAlgorithm.CRC32;

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/stringUnionSelector.js
var import_dist7 = __toESM(require_dist());
var import_dist8 = __toESM(require_dist2());
var import_dist9 = __toESM(require_dist3());
var SelectorType;
(function(SelectorType2) {
  SelectorType2["ENV"] = "env";
  SelectorType2["CONFIG"] = "shared config entry";
})(SelectorType || (SelectorType = {}));

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/NODE_RESPONSE_CHECKSUM_VALIDATION_CONFIG_OPTIONS.js
var import_dist13 = __toESM(require_dist());
var import_dist14 = __toESM(require_dist2());
var import_dist15 = __toESM(require_dist3());

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/crc64-nvme-crt-container.js
var import_dist16 = __toESM(require_dist());
var import_dist17 = __toESM(require_dist2());
var import_dist18 = __toESM(require_dist3());
var crc64NvmeCrtContainer = {
  CrtCrc64Nvme: null
};

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/flexibleChecksumsMiddleware.js
var import_dist58 = __toESM(require_dist());
var import_dist59 = __toESM(require_dist2());
var import_dist60 = __toESM(require_dist3());

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/getChecksumAlgorithmForRequest.js
var import_dist22 = __toESM(require_dist());
var import_dist23 = __toESM(require_dist2());
var import_dist24 = __toESM(require_dist3());

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/types.js
var import_dist19 = __toESM(require_dist());
var import_dist20 = __toESM(require_dist2());
var import_dist21 = __toESM(require_dist3());
var CLIENT_SUPPORTED_ALGORITHMS = [
  ChecksumAlgorithm.CRC32,
  ChecksumAlgorithm.CRC32C,
  ChecksumAlgorithm.CRC64NVME,
  ChecksumAlgorithm.SHA1,
  ChecksumAlgorithm.SHA256
];
var PRIORITY_ORDER_ALGORITHMS = [
  ChecksumAlgorithm.SHA256,
  ChecksumAlgorithm.SHA1,
  ChecksumAlgorithm.CRC32,
  ChecksumAlgorithm.CRC32C,
  ChecksumAlgorithm.CRC64NVME
];

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/getChecksumAlgorithmForRequest.js
var getChecksumAlgorithmForRequest = (input, { requestChecksumRequired, requestAlgorithmMember, requestChecksumCalculation }) => {
  if (!requestAlgorithmMember) {
    return requestChecksumCalculation === RequestChecksumCalculation.WHEN_SUPPORTED || requestChecksumRequired ? DEFAULT_CHECKSUM_ALGORITHM : void 0;
  }
  if (!input[requestAlgorithmMember]) {
    return void 0;
  }
  const checksumAlgorithm = input[requestAlgorithmMember];
  if (!CLIENT_SUPPORTED_ALGORITHMS.includes(checksumAlgorithm)) {
    throw new Error(`The checksum algorithm "${checksumAlgorithm}" is not supported by the client. Select one of ${CLIENT_SUPPORTED_ALGORITHMS}.`);
  }
  return checksumAlgorithm;
};

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/getChecksumLocationName.js
var import_dist25 = __toESM(require_dist());
var import_dist26 = __toESM(require_dist2());
var import_dist27 = __toESM(require_dist3());
var getChecksumLocationName = (algorithm) => algorithm === ChecksumAlgorithm.MD5 ? "content-md5" : `x-amz-checksum-${algorithm.toLowerCase()}`;

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/hasHeader.js
var import_dist28 = __toESM(require_dist());
var import_dist29 = __toESM(require_dist2());
var import_dist30 = __toESM(require_dist3());
var hasHeader = (header, headers) => {
  const soughtHeader = header.toLowerCase();
  for (const headerName of Object.keys(headers)) {
    if (soughtHeader === headerName.toLowerCase()) {
      return true;
    }
  }
  return false;
};

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/hasHeaderWithPrefix.js
var import_dist31 = __toESM(require_dist());
var import_dist32 = __toESM(require_dist2());
var import_dist33 = __toESM(require_dist3());
var hasHeaderWithPrefix = (headerPrefix, headers) => {
  const soughtHeaderPrefix = headerPrefix.toLowerCase();
  for (const headerName of Object.keys(headers)) {
    if (headerName.toLowerCase().startsWith(soughtHeaderPrefix)) {
      return true;
    }
  }
  return false;
};

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/isStreaming.js
var import_dist34 = __toESM(require_dist());
var import_dist35 = __toESM(require_dist2());
var import_dist36 = __toESM(require_dist3());
var isStreaming = (body) => body !== void 0 && typeof body !== "string" && !ArrayBuffer.isView(body) && !isArrayBuffer(body);

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/selectChecksumAlgorithmFunction.js
var import_dist52 = __toESM(require_dist());
var import_dist53 = __toESM(require_dist2());
var import_dist54 = __toESM(require_dist3());

// node_modules/@aws-crypto/crc32c/build/module/index.js
var import_dist40 = __toESM(require_dist());
var import_dist41 = __toESM(require_dist2());
var import_dist42 = __toESM(require_dist3());

// node_modules/@aws-crypto/crc32c/build/module/aws_crc32c.js
var import_dist37 = __toESM(require_dist());
var import_dist38 = __toESM(require_dist2());
var import_dist39 = __toESM(require_dist3());
var AwsCrc32c = (
  /** @class */
  function() {
    function AwsCrc32c2() {
      this.crc32c = new Crc32c();
    }
    AwsCrc32c2.prototype.update = function(toHash) {
      if (isEmptyData(toHash))
        return;
      this.crc32c.update(convertToBuffer(toHash));
    };
    AwsCrc32c2.prototype.digest = function() {
      return __awaiter(this, void 0, void 0, function() {
        return __generator(this, function(_a2) {
          return [2, numToUint8(this.crc32c.digest())];
        });
      });
    };
    AwsCrc32c2.prototype.reset = function() {
      this.crc32c = new Crc32c();
    };
    return AwsCrc32c2;
  }()
);

// node_modules/@aws-crypto/crc32c/build/module/index.js
var Crc32c = (
  /** @class */
  function() {
    function Crc32c2() {
      this.checksum = 4294967295;
    }
    Crc32c2.prototype.update = function(data) {
      var e_1, _a2;
      try {
        for (var data_1 = __values(data), data_1_1 = data_1.next(); !data_1_1.done; data_1_1 = data_1.next()) {
          var byte = data_1_1.value;
          this.checksum = this.checksum >>> 8 ^ lookupTable[(this.checksum ^ byte) & 255];
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (data_1_1 && !data_1_1.done && (_a2 = data_1.return)) _a2.call(data_1);
        } finally {
          if (e_1) throw e_1.error;
        }
      }
      return this;
    };
    Crc32c2.prototype.digest = function() {
      return (this.checksum ^ 4294967295) >>> 0;
    };
    return Crc32c2;
  }()
);
var a_lookupTable = [
  0,
  4067132163,
  3778769143,
  324072436,
  3348797215,
  904991772,
  648144872,
  3570033899,
  2329499855,
  2024987596,
  1809983544,
  2575936315,
  1296289744,
  3207089363,
  2893594407,
  1578318884,
  274646895,
  3795141740,
  4049975192,
  51262619,
  3619967088,
  632279923,
  922689671,
  3298075524,
  2592579488,
  1760304291,
  2075979607,
  2312596564,
  1562183871,
  2943781820,
  3156637768,
  1313733451,
  549293790,
  3537243613,
  3246849577,
  871202090,
  3878099393,
  357341890,
  102525238,
  4101499445,
  2858735121,
  1477399826,
  1264559846,
  3107202533,
  1845379342,
  2677391885,
  2361733625,
  2125378298,
  820201905,
  3263744690,
  3520608582,
  598981189,
  4151959214,
  85089709,
  373468761,
  3827903834,
  3124367742,
  1213305469,
  1526817161,
  2842354314,
  2107672161,
  2412447074,
  2627466902,
  1861252501,
  1098587580,
  3004210879,
  2688576843,
  1378610760,
  2262928035,
  1955203488,
  1742404180,
  2511436119,
  3416409459,
  969524848,
  714683780,
  3639785095,
  205050476,
  4266873199,
  3976438427,
  526918040,
  1361435347,
  2739821008,
  2954799652,
  1114974503,
  2529119692,
  1691668175,
  2005155131,
  2247081528,
  3690758684,
  697762079,
  986182379,
  3366744552,
  476452099,
  3993867776,
  4250756596,
  255256311,
  1640403810,
  2477592673,
  2164122517,
  1922457750,
  2791048317,
  1412925310,
  1197962378,
  3037525897,
  3944729517,
  427051182,
  170179418,
  4165941337,
  746937522,
  3740196785,
  3451792453,
  1070968646,
  1905808397,
  2213795598,
  2426610938,
  1657317369,
  3053634322,
  1147748369,
  1463399397,
  2773627110,
  4215344322,
  153784257,
  444234805,
  3893493558,
  1021025245,
  3467647198,
  3722505002,
  797665321,
  2197175160,
  1889384571,
  1674398607,
  2443626636,
  1164749927,
  3070701412,
  2757221520,
  1446797203,
  137323447,
  4198817972,
  3910406976,
  461344835,
  3484808360,
  1037989803,
  781091935,
  3705997148,
  2460548119,
  1623424788,
  1939049696,
  2180517859,
  1429367560,
  2807687179,
  3020495871,
  1180866812,
  410100952,
  3927582683,
  4182430767,
  186734380,
  3756733383,
  763408580,
  1053836080,
  3434856499,
  2722870694,
  1344288421,
  1131464017,
  2971354706,
  1708204729,
  2545590714,
  2229949006,
  1988219213,
  680717673,
  3673779818,
  3383336350,
  1002577565,
  4010310262,
  493091189,
  238226049,
  4233660802,
  2987750089,
  1082061258,
  1395524158,
  2705686845,
  1972364758,
  2279892693,
  2494862625,
  1725896226,
  952904198,
  3399985413,
  3656866545,
  731699698,
  4283874585,
  222117402,
  510512622,
  3959836397,
  3280807620,
  837199303,
  582374963,
  3504198960,
  68661723,
  4135334616,
  3844915500,
  390545967,
  1230274059,
  3141532936,
  2825850620,
  1510247935,
  2395924756,
  2091215383,
  1878366691,
  2644384480,
  3553878443,
  565732008,
  854102364,
  3229815391,
  340358836,
  3861050807,
  4117890627,
  119113024,
  1493875044,
  2875275879,
  3090270611,
  1247431312,
  2660249211,
  1828433272,
  2141937292,
  2378227087,
  3811616794,
  291187481,
  34330861,
  4032846830,
  615137029,
  3603020806,
  3314634738,
  939183345,
  1776939221,
  2609017814,
  2295496738,
  2058945313,
  2926798794,
  1545135305,
  1330124605,
  3173225534,
  4084100981,
  17165430,
  307568514,
  3762199681,
  888469610,
  3332340585,
  3587147933,
  665062302,
  2042050490,
  2346497209,
  2559330125,
  1793573966,
  3190661285,
  1279665062,
  1595330642,
  2910671697
];
var lookupTable = uint32ArrayFrom(a_lookupTable);

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/getCrc32ChecksumAlgorithmFunction.browser.js
var import_dist49 = __toESM(require_dist());
var import_dist50 = __toESM(require_dist2());
var import_dist51 = __toESM(require_dist3());

// node_modules/@aws-crypto/crc32/build/module/index.js
var import_dist46 = __toESM(require_dist());
var import_dist47 = __toESM(require_dist2());
var import_dist48 = __toESM(require_dist3());

// node_modules/@aws-crypto/crc32/build/module/aws_crc32.js
var import_dist43 = __toESM(require_dist());
var import_dist44 = __toESM(require_dist2());
var import_dist45 = __toESM(require_dist3());
var AwsCrc32 = (
  /** @class */
  function() {
    function AwsCrc322() {
      this.crc32 = new Crc32();
    }
    AwsCrc322.prototype.update = function(toHash) {
      if (isEmptyData(toHash))
        return;
      this.crc32.update(convertToBuffer(toHash));
    };
    AwsCrc322.prototype.digest = function() {
      return __awaiter(this, void 0, void 0, function() {
        return __generator(this, function(_a2) {
          return [2, numToUint8(this.crc32.digest())];
        });
      });
    };
    AwsCrc322.prototype.reset = function() {
      this.crc32 = new Crc32();
    };
    return AwsCrc322;
  }()
);

// node_modules/@aws-crypto/crc32/build/module/index.js
var Crc32 = (
  /** @class */
  function() {
    function Crc322() {
      this.checksum = 4294967295;
    }
    Crc322.prototype.update = function(data) {
      var e_1, _a2;
      try {
        for (var data_1 = __values(data), data_1_1 = data_1.next(); !data_1_1.done; data_1_1 = data_1.next()) {
          var byte = data_1_1.value;
          this.checksum = this.checksum >>> 8 ^ lookupTable2[(this.checksum ^ byte) & 255];
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (data_1_1 && !data_1_1.done && (_a2 = data_1.return)) _a2.call(data_1);
        } finally {
          if (e_1) throw e_1.error;
        }
      }
      return this;
    };
    Crc322.prototype.digest = function() {
      return (this.checksum ^ 4294967295) >>> 0;
    };
    return Crc322;
  }()
);
var a_lookUpTable = [
  0,
  1996959894,
  3993919788,
  2567524794,
  124634137,
  1886057615,
  3915621685,
  2657392035,
  249268274,
  2044508324,
  3772115230,
  2547177864,
  162941995,
  2125561021,
  3887607047,
  2428444049,
  498536548,
  1789927666,
  4089016648,
  2227061214,
  450548861,
  1843258603,
  4107580753,
  2211677639,
  325883990,
  1684777152,
  4251122042,
  2321926636,
  335633487,
  1661365465,
  4195302755,
  2366115317,
  997073096,
  1281953886,
  3579855332,
  2724688242,
  1006888145,
  1258607687,
  3524101629,
  2768942443,
  901097722,
  1119000684,
  3686517206,
  2898065728,
  853044451,
  1172266101,
  3705015759,
  2882616665,
  651767980,
  1373503546,
  3369554304,
  3218104598,
  565507253,
  1454621731,
  3485111705,
  3099436303,
  671266974,
  1594198024,
  3322730930,
  2970347812,
  795835527,
  1483230225,
  3244367275,
  3060149565,
  1994146192,
  31158534,
  2563907772,
  4023717930,
  1907459465,
  112637215,
  2680153253,
  3904427059,
  2013776290,
  251722036,
  2517215374,
  3775830040,
  2137656763,
  141376813,
  2439277719,
  3865271297,
  1802195444,
  476864866,
  2238001368,
  4066508878,
  1812370925,
  453092731,
  2181625025,
  4111451223,
  1706088902,
  314042704,
  2344532202,
  4240017532,
  1658658271,
  366619977,
  2362670323,
  4224994405,
  1303535960,
  984961486,
  2747007092,
  3569037538,
  1256170817,
  1037604311,
  2765210733,
  3554079995,
  1131014506,
  879679996,
  2909243462,
  3663771856,
  1141124467,
  855842277,
  2852801631,
  3708648649,
  1342533948,
  654459306,
  3188396048,
  3373015174,
  1466479909,
  544179635,
  3110523913,
  3462522015,
  1591671054,
  702138776,
  2966460450,
  3352799412,
  1504918807,
  783551873,
  3082640443,
  3233442989,
  3988292384,
  2596254646,
  62317068,
  1957810842,
  3939845945,
  2647816111,
  81470997,
  1943803523,
  3814918930,
  2489596804,
  225274430,
  2053790376,
  3826175755,
  2466906013,
  167816743,
  2097651377,
  4027552580,
  2265490386,
  503444072,
  1762050814,
  4150417245,
  2154129355,
  426522225,
  1852507879,
  4275313526,
  2312317920,
  282753626,
  1742555852,
  4189708143,
  2394877945,
  397917763,
  1622183637,
  3604390888,
  2714866558,
  953729732,
  1340076626,
  3518719985,
  2797360999,
  1068828381,
  1219638859,
  3624741850,
  2936675148,
  906185462,
  1090812512,
  3747672003,
  2825379669,
  829329135,
  1181335161,
  3412177804,
  3160834842,
  628085408,
  1382605366,
  3423369109,
  3138078467,
  570562233,
  1426400815,
  3317316542,
  2998733608,
  733239954,
  1555261956,
  3268935591,
  3050360625,
  752459403,
  1541320221,
  2607071920,
  3965973030,
  1969922972,
  40735498,
  2617837225,
  3943577151,
  1913087877,
  83908371,
  2512341634,
  3803740692,
  2075208622,
  213261112,
  2463272603,
  3855990285,
  2094854071,
  198958881,
  2262029012,
  4057260610,
  1759359992,
  534414190,
  2176718541,
  4139329115,
  1873836001,
  414664567,
  2282248934,
  4279200368,
  1711684554,
  285281116,
  2405801727,
  4167216745,
  1634467795,
  376229701,
  2685067896,
  3608007406,
  1308918612,
  956543938,
  2808555105,
  3495958263,
  1231636301,
  1047427035,
  2932959818,
  3654703836,
  1088359270,
  936918e3,
  2847714899,
  3736837829,
  1202900863,
  817233897,
  3183342108,
  3401237130,
  1404277552,
  615818150,
  3134207493,
  3453421203,
  1423857449,
  601450431,
  3009837614,
  3294710456,
  1567103746,
  711928724,
  3020668471,
  3272380065,
  1510334235,
  755167117
];
var lookupTable2 = uint32ArrayFrom(a_lookUpTable);

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/getCrc32ChecksumAlgorithmFunction.browser.js
var getCrc32ChecksumAlgorithmFunction = () => AwsCrc32;

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/selectChecksumAlgorithmFunction.js
var selectChecksumAlgorithmFunction = (checksumAlgorithm, config) => {
  switch (checksumAlgorithm) {
    case ChecksumAlgorithm.MD5:
      return config.md5;
    case ChecksumAlgorithm.CRC32:
      return getCrc32ChecksumAlgorithmFunction();
    case ChecksumAlgorithm.CRC32C:
      return AwsCrc32c;
    case ChecksumAlgorithm.CRC64NVME:
      if (typeof crc64NvmeCrtContainer.CrtCrc64Nvme !== "function") {
        throw new Error(`Please check whether you have installed the "@aws-sdk/crc64-nvme-crt" package explicitly. 
You must also register the package by calling [require("@aws-sdk/crc64-nvme-crt");] or an ESM equivalent such as [import "@aws-sdk/crc64-nvme-crt";]. 
For more information please go to https://github.com/aws/aws-sdk-js-v3#functionality-requiring-aws-common-runtime-crt`);
      }
      return crc64NvmeCrtContainer.CrtCrc64Nvme;
    case ChecksumAlgorithm.SHA1:
      return config.sha1;
    case ChecksumAlgorithm.SHA256:
      return config.sha256;
    default:
      throw new Error(`Unsupported checksum algorithm: ${checksumAlgorithm}`);
  }
};

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/stringHasher.js
var import_dist55 = __toESM(require_dist());
var import_dist56 = __toESM(require_dist2());
var import_dist57 = __toESM(require_dist3());
var stringHasher = (checksumAlgorithmFn, body) => {
  const hash = new checksumAlgorithmFn();
  hash.update(toUint8Array(body || ""));
  return hash.digest();
};

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/flexibleChecksumsMiddleware.js
var flexibleChecksumsMiddlewareOptions = {
  name: "flexibleChecksumsMiddleware",
  step: "build",
  tags: ["BODY_CHECKSUM"],
  override: true
};
var flexibleChecksumsMiddleware = (config, middlewareConfig) => (next, context) => async (args) => {
  if (!HttpRequest.isInstance(args.request)) {
    return next(args);
  }
  if (hasHeaderWithPrefix("x-amz-checksum-", args.request.headers)) {
    return next(args);
  }
  const { request, input } = args;
  const { body: requestBody, headers } = request;
  const { base64Encoder, streamHasher } = config;
  const { requestChecksumRequired, requestAlgorithmMember } = middlewareConfig;
  const requestChecksumCalculation = await config.requestChecksumCalculation();
  const requestAlgorithmMemberName = requestAlgorithmMember == null ? void 0 : requestAlgorithmMember.name;
  const requestAlgorithmMemberHttpHeader = requestAlgorithmMember == null ? void 0 : requestAlgorithmMember.httpHeader;
  if (requestAlgorithmMemberName && !input[requestAlgorithmMemberName]) {
    if (requestChecksumCalculation === RequestChecksumCalculation.WHEN_SUPPORTED || requestChecksumRequired) {
      input[requestAlgorithmMemberName] = DEFAULT_CHECKSUM_ALGORITHM;
      if (requestAlgorithmMemberHttpHeader) {
        headers[requestAlgorithmMemberHttpHeader] = DEFAULT_CHECKSUM_ALGORITHM;
      }
    }
  }
  const checksumAlgorithm = getChecksumAlgorithmForRequest(input, {
    requestChecksumRequired,
    requestAlgorithmMember: requestAlgorithmMember == null ? void 0 : requestAlgorithmMember.name,
    requestChecksumCalculation
  });
  let updatedBody = requestBody;
  let updatedHeaders = headers;
  if (checksumAlgorithm) {
    switch (checksumAlgorithm) {
      case ChecksumAlgorithm.CRC32:
        setFeature(context, "FLEXIBLE_CHECKSUMS_REQ_CRC32", "U");
        break;
      case ChecksumAlgorithm.CRC32C:
        setFeature(context, "FLEXIBLE_CHECKSUMS_REQ_CRC32C", "V");
        break;
      case ChecksumAlgorithm.CRC64NVME:
        setFeature(context, "FLEXIBLE_CHECKSUMS_REQ_CRC64", "W");
        break;
      case ChecksumAlgorithm.SHA1:
        setFeature(context, "FLEXIBLE_CHECKSUMS_REQ_SHA1", "X");
        break;
      case ChecksumAlgorithm.SHA256:
        setFeature(context, "FLEXIBLE_CHECKSUMS_REQ_SHA256", "Y");
        break;
    }
    const checksumLocationName = getChecksumLocationName(checksumAlgorithm);
    const checksumAlgorithmFn = selectChecksumAlgorithmFunction(checksumAlgorithm, config);
    if (isStreaming(requestBody)) {
      const { getAwsChunkedEncodingStream: getAwsChunkedEncodingStream2, bodyLengthChecker } = config;
      updatedBody = getAwsChunkedEncodingStream2(typeof config.requestStreamBufferSize === "number" && config.requestStreamBufferSize >= 8 * 1024 ? createBufferedReadable(requestBody, config.requestStreamBufferSize, context.logger) : requestBody, {
        base64Encoder,
        bodyLengthChecker,
        checksumLocationName,
        checksumAlgorithmFn,
        streamHasher
      });
      updatedHeaders = {
        ...headers,
        "content-encoding": headers["content-encoding"] ? `${headers["content-encoding"]},aws-chunked` : "aws-chunked",
        "transfer-encoding": "chunked",
        "x-amz-decoded-content-length": headers["content-length"],
        "x-amz-content-sha256": "STREAMING-UNSIGNED-PAYLOAD-TRAILER",
        "x-amz-trailer": checksumLocationName
      };
      delete updatedHeaders["content-length"];
    } else if (!hasHeader(checksumLocationName, headers)) {
      const rawChecksum = await stringHasher(checksumAlgorithmFn, requestBody);
      updatedHeaders = {
        ...headers,
        [checksumLocationName]: base64Encoder(rawChecksum)
      };
    }
  }
  const result = await next({
    ...args,
    request: {
      ...request,
      headers: updatedHeaders,
      body: updatedBody
    }
  });
  return result;
};

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/getFlexibleChecksumsPlugin.js
var import_dist79 = __toESM(require_dist());
var import_dist80 = __toESM(require_dist2());
var import_dist81 = __toESM(require_dist3());

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/flexibleChecksumsInputMiddleware.js
var import_dist61 = __toESM(require_dist());
var import_dist62 = __toESM(require_dist2());
var import_dist63 = __toESM(require_dist3());
var flexibleChecksumsInputMiddlewareOptions = {
  name: "flexibleChecksumsInputMiddleware",
  toMiddleware: "serializerMiddleware",
  relation: "before",
  tags: ["BODY_CHECKSUM"],
  override: true
};
var flexibleChecksumsInputMiddleware = (config, middlewareConfig) => (next, context) => async (args) => {
  const input = args.input;
  const { requestValidationModeMember } = middlewareConfig;
  const requestChecksumCalculation = await config.requestChecksumCalculation();
  const responseChecksumValidation = await config.responseChecksumValidation();
  switch (requestChecksumCalculation) {
    case RequestChecksumCalculation.WHEN_REQUIRED:
      setFeature(context, "FLEXIBLE_CHECKSUMS_REQ_WHEN_REQUIRED", "a");
      break;
    case RequestChecksumCalculation.WHEN_SUPPORTED:
      setFeature(context, "FLEXIBLE_CHECKSUMS_REQ_WHEN_SUPPORTED", "Z");
      break;
  }
  switch (responseChecksumValidation) {
    case ResponseChecksumValidation.WHEN_REQUIRED:
      setFeature(context, "FLEXIBLE_CHECKSUMS_RES_WHEN_REQUIRED", "c");
      break;
    case ResponseChecksumValidation.WHEN_SUPPORTED:
      setFeature(context, "FLEXIBLE_CHECKSUMS_RES_WHEN_SUPPORTED", "b");
      break;
  }
  if (requestValidationModeMember && !input[requestValidationModeMember]) {
    if (responseChecksumValidation === ResponseChecksumValidation.WHEN_SUPPORTED) {
      input[requestValidationModeMember] = "ENABLED";
    }
  }
  return next(args);
};

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/flexibleChecksumsResponseMiddleware.js
var import_dist76 = __toESM(require_dist());
var import_dist77 = __toESM(require_dist2());
var import_dist78 = __toESM(require_dist3());

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/getChecksumAlgorithmListForResponse.js
var import_dist64 = __toESM(require_dist());
var import_dist65 = __toESM(require_dist2());
var import_dist66 = __toESM(require_dist3());
var getChecksumAlgorithmListForResponse = (responseAlgorithms = []) => {
  const validChecksumAlgorithms = [];
  for (const algorithm of PRIORITY_ORDER_ALGORITHMS) {
    if (!responseAlgorithms.includes(algorithm) || !CLIENT_SUPPORTED_ALGORITHMS.includes(algorithm)) {
      continue;
    }
    validChecksumAlgorithms.push(algorithm);
  }
  return validChecksumAlgorithms;
};

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/isChecksumWithPartNumber.js
var import_dist67 = __toESM(require_dist());
var import_dist68 = __toESM(require_dist2());
var import_dist69 = __toESM(require_dist3());
var isChecksumWithPartNumber = (checksum) => {
  const lastHyphenIndex = checksum.lastIndexOf("-");
  if (lastHyphenIndex !== -1) {
    const numberPart = checksum.slice(lastHyphenIndex + 1);
    if (!numberPart.startsWith("0")) {
      const number = parseInt(numberPart, 10);
      if (!isNaN(number) && number >= 1 && number <= 1e4) {
        return true;
      }
    }
  }
  return false;
};

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/validateChecksumFromResponse.js
var import_dist73 = __toESM(require_dist());
var import_dist74 = __toESM(require_dist2());
var import_dist75 = __toESM(require_dist3());

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/getChecksum.js
var import_dist70 = __toESM(require_dist());
var import_dist71 = __toESM(require_dist2());
var import_dist72 = __toESM(require_dist3());
var getChecksum = async (body, { checksumAlgorithmFn, base64Encoder }) => base64Encoder(await stringHasher(checksumAlgorithmFn, body));

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/validateChecksumFromResponse.js
var validateChecksumFromResponse = async (response, { config, responseAlgorithms, logger }) => {
  const checksumAlgorithms = getChecksumAlgorithmListForResponse(responseAlgorithms);
  const { body: responseBody, headers: responseHeaders } = response;
  for (const algorithm of checksumAlgorithms) {
    const responseHeader = getChecksumLocationName(algorithm);
    const checksumFromResponse = responseHeaders[responseHeader];
    if (checksumFromResponse) {
      let checksumAlgorithmFn;
      try {
        checksumAlgorithmFn = selectChecksumAlgorithmFunction(algorithm, config);
      } catch (error) {
        if (algorithm === ChecksumAlgorithm.CRC64NVME) {
          logger == null ? void 0 : logger.warn(`Skipping ${ChecksumAlgorithm.CRC64NVME} checksum validation: ${error.message}`);
          continue;
        }
        throw error;
      }
      const { base64Encoder } = config;
      if (isStreaming(responseBody)) {
        response.body = createChecksumStream({
          expectedChecksum: checksumFromResponse,
          checksumSourceLocation: responseHeader,
          checksum: new checksumAlgorithmFn(),
          source: responseBody,
          base64Encoder
        });
        return;
      }
      const checksum = await getChecksum(responseBody, { checksumAlgorithmFn, base64Encoder });
      if (checksum === checksumFromResponse) {
        break;
      }
      throw new Error(`Checksum mismatch: expected "${checksum}" but received "${checksumFromResponse}" in response header "${responseHeader}".`);
    }
  }
};

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/flexibleChecksumsResponseMiddleware.js
var flexibleChecksumsResponseMiddlewareOptions = {
  name: "flexibleChecksumsResponseMiddleware",
  toMiddleware: "deserializerMiddleware",
  relation: "after",
  tags: ["BODY_CHECKSUM"],
  override: true
};
var flexibleChecksumsResponseMiddleware = (config, middlewareConfig) => (next, context) => async (args) => {
  if (!HttpRequest.isInstance(args.request)) {
    return next(args);
  }
  const input = args.input;
  const result = await next(args);
  const response = result.response;
  const { requestValidationModeMember, responseAlgorithms } = middlewareConfig;
  if (requestValidationModeMember && input[requestValidationModeMember] === "ENABLED") {
    const { clientName, commandName } = context;
    const isS3WholeObjectMultipartGetResponseChecksum = clientName === "S3Client" && commandName === "GetObjectCommand" && getChecksumAlgorithmListForResponse(responseAlgorithms).every((algorithm) => {
      const responseHeader = getChecksumLocationName(algorithm);
      const checksumFromResponse = response.headers[responseHeader];
      return !checksumFromResponse || isChecksumWithPartNumber(checksumFromResponse);
    });
    if (isS3WholeObjectMultipartGetResponseChecksum) {
      return result;
    }
    await validateChecksumFromResponse(response, {
      config,
      responseAlgorithms,
      logger: context.logger
    });
  }
  return result;
};

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/getFlexibleChecksumsPlugin.js
var getFlexibleChecksumsPlugin = (config, middlewareConfig) => ({
  applyToStack: (clientStack) => {
    clientStack.add(flexibleChecksumsMiddleware(config, middlewareConfig), flexibleChecksumsMiddlewareOptions);
    clientStack.addRelativeTo(flexibleChecksumsInputMiddleware(config, middlewareConfig), flexibleChecksumsInputMiddlewareOptions);
    clientStack.addRelativeTo(flexibleChecksumsResponseMiddleware(config, middlewareConfig), flexibleChecksumsResponseMiddlewareOptions);
  }
});

// node_modules/@aws-sdk/middleware-flexible-checksums/dist-es/resolveFlexibleChecksumsConfig.js
var import_dist82 = __toESM(require_dist());
var import_dist83 = __toESM(require_dist2());
var import_dist84 = __toESM(require_dist3());
var resolveFlexibleChecksumsConfig = (input) => {
  const { requestChecksumCalculation, responseChecksumValidation, requestStreamBufferSize } = input;
  return Object.assign(input, {
    requestChecksumCalculation: normalizeProvider(requestChecksumCalculation ?? DEFAULT_REQUEST_CHECKSUM_CALCULATION),
    responseChecksumValidation: normalizeProvider(responseChecksumValidation ?? DEFAULT_RESPONSE_CHECKSUM_VALIDATION),
    requestStreamBufferSize: Number(requestStreamBufferSize ?? 0)
  });
};

// node_modules/@smithy/eventstream-serde-config-resolver/dist-es/index.js
var import_dist91 = __toESM(require_dist());
var import_dist92 = __toESM(require_dist2());
var import_dist93 = __toESM(require_dist3());

// node_modules/@smithy/eventstream-serde-config-resolver/dist-es/EventStreamSerdeConfig.js
var import_dist88 = __toESM(require_dist());
var import_dist89 = __toESM(require_dist2());
var import_dist90 = __toESM(require_dist3());
var resolveEventStreamSerdeConfig = (input) => Object.assign(input, {
  eventStreamMarshaller: input.eventStreamSerdeProvider(input)
});

// node_modules/@aws-sdk/client-s3/dist-es/auth/httpAuthSchemeProvider.js
var import_dist100 = __toESM(require_dist());
var import_dist101 = __toESM(require_dist2());
var import_dist102 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-s3/dist-es/endpoint/endpointResolver.js
var import_dist97 = __toESM(require_dist());
var import_dist98 = __toESM(require_dist2());
var import_dist99 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-s3/dist-es/endpoint/ruleset.js
var import_dist94 = __toESM(require_dist());
var import_dist95 = __toESM(require_dist2());
var import_dist96 = __toESM(require_dist3());
var cp = "required";
var cq = "type";
var cr = "rules";
var cs = "conditions";
var ct = "fn";
var cu = "argv";
var cv = "ref";
var cw = "assign";
var cx = "url";
var cy = "properties";
var cz = "backend";
var cA = "authSchemes";
var cB = "disableDoubleEncoding";
var cC = "signingName";
var cD = "signingRegion";
var cE = "headers";
var cF = "signingRegionSet";
var a = 6;
var b = false;
var c = true;
var d = "isSet";
var e = "booleanEquals";
var f = "error";
var g = "aws.partition";
var h = "stringEquals";
var i = "getAttr";
var j = "name";
var k = "substring";
var l = "bucketSuffix";
var m = "parseURL";
var n = "endpoint";
var o = "tree";
var p = "aws.isVirtualHostableS3Bucket";
var q = "{url#scheme}://{Bucket}.{url#authority}{url#path}";
var r = "not";
var s = "accessPointSuffix";
var t = "{url#scheme}://{url#authority}{url#path}";
var u = "hardwareType";
var v = "regionPrefix";
var w = "bucketAliasSuffix";
var x = "outpostId";
var y = "isValidHostLabel";
var z = "sigv4a";
var A = "s3-outposts";
var B = "s3";
var C = "{url#scheme}://{url#authority}{url#normalizedPath}{Bucket}";
var D = "https://{Bucket}.s3-accelerate.{partitionResult#dnsSuffix}";
var E = "https://{Bucket}.s3.{partitionResult#dnsSuffix}";
var F = "aws.parseArn";
var G = "bucketArn";
var H = "arnType";
var I = "";
var J = "s3-object-lambda";
var K = "accesspoint";
var L = "accessPointName";
var M = "{url#scheme}://{accessPointName}-{bucketArn#accountId}.{url#authority}{url#path}";
var N = "mrapPartition";
var O = "outpostType";
var P = "arnPrefix";
var Q = "{url#scheme}://{url#authority}{url#normalizedPath}{uri_encoded_bucket}";
var R = "https://s3.{partitionResult#dnsSuffix}/{uri_encoded_bucket}";
var S = "https://s3.{partitionResult#dnsSuffix}";
var T = { [cp]: false, [cq]: "String" };
var U = { [cp]: true, "default": false, [cq]: "Boolean" };
var V = { [cp]: false, [cq]: "Boolean" };
var W = { [ct]: e, [cu]: [{ [cv]: "Accelerate" }, true] };
var X = { [ct]: e, [cu]: [{ [cv]: "UseFIPS" }, true] };
var Y = { [ct]: e, [cu]: [{ [cv]: "UseDualStack" }, true] };
var Z = { [ct]: d, [cu]: [{ [cv]: "Endpoint" }] };
var aa = { [ct]: g, [cu]: [{ [cv]: "Region" }], [cw]: "partitionResult" };
var ab = { [ct]: h, [cu]: [{ [ct]: i, [cu]: [{ [cv]: "partitionResult" }, j] }, "aws-cn"] };
var ac = { [ct]: d, [cu]: [{ [cv]: "Bucket" }] };
var ad = { [cv]: "Bucket" };
var ae = { [cs]: [Y], [f]: "S3Express does not support Dual-stack.", [cq]: f };
var af = { [cs]: [W], [f]: "S3Express does not support S3 Accelerate.", [cq]: f };
var ag = { [cs]: [Z, { [ct]: m, [cu]: [{ [cv]: "Endpoint" }], [cw]: "url" }], [cr]: [{ [cs]: [{ [ct]: d, [cu]: [{ [cv]: "DisableS3ExpressSessionAuth" }] }, { [ct]: e, [cu]: [{ [cv]: "DisableS3ExpressSessionAuth" }, true] }], [cr]: [{ [cs]: [{ [ct]: e, [cu]: [{ [ct]: i, [cu]: [{ [cv]: "url" }, "isIp"] }, true] }], [cr]: [{ [cs]: [{ [ct]: "uriEncode", [cu]: [ad], [cw]: "uri_encoded_bucket" }], [cr]: [{ [n]: { [cx]: "{url#scheme}://{url#authority}/{uri_encoded_bucket}{url#path}", [cy]: { [cz]: "S3Express", [cA]: [{ [cB]: true, [j]: "sigv4", [cC]: "s3express", [cD]: "{Region}" }] }, [cE]: {} }, [cq]: n }], [cq]: o }], [cq]: o }, { [cs]: [{ [ct]: p, [cu]: [ad, false] }], [cr]: [{ [n]: { [cx]: q, [cy]: { [cz]: "S3Express", [cA]: [{ [cB]: true, [j]: "sigv4", [cC]: "s3express", [cD]: "{Region}" }] }, [cE]: {} }, [cq]: n }], [cq]: o }, { [f]: "S3Express bucket name is not a valid virtual hostable name.", [cq]: f }], [cq]: o }, { [cs]: [{ [ct]: e, [cu]: [{ [ct]: i, [cu]: [{ [cv]: "url" }, "isIp"] }, true] }], [cr]: [{ [cs]: [{ [ct]: "uriEncode", [cu]: [ad], [cw]: "uri_encoded_bucket" }], [cr]: [{ [n]: { [cx]: "{url#scheme}://{url#authority}/{uri_encoded_bucket}{url#path}", [cy]: { [cz]: "S3Express", [cA]: [{ [cB]: true, [j]: "sigv4-s3express", [cC]: "s3express", [cD]: "{Region}" }] }, [cE]: {} }, [cq]: n }], [cq]: o }], [cq]: o }, { [cs]: [{ [ct]: p, [cu]: [ad, false] }], [cr]: [{ [n]: { [cx]: q, [cy]: { [cz]: "S3Express", [cA]: [{ [cB]: true, [j]: "sigv4-s3express", [cC]: "s3express", [cD]: "{Region}" }] }, [cE]: {} }, [cq]: n }], [cq]: o }, { [f]: "S3Express bucket name is not a valid virtual hostable name.", [cq]: f }], [cq]: o };
var ah = { [ct]: m, [cu]: [{ [cv]: "Endpoint" }], [cw]: "url" };
var ai = { [ct]: e, [cu]: [{ [ct]: i, [cu]: [{ [cv]: "url" }, "isIp"] }, true] };
var aj = { [cv]: "url" };
var ak = { [ct]: "uriEncode", [cu]: [ad], [cw]: "uri_encoded_bucket" };
var al = { [cz]: "S3Express", [cA]: [{ [cB]: true, [j]: "sigv4", [cC]: "s3express", [cD]: "{Region}" }] };
var am = {};
var an = { [ct]: p, [cu]: [ad, false] };
var ao = { [f]: "S3Express bucket name is not a valid virtual hostable name.", [cq]: f };
var ap = { [ct]: d, [cu]: [{ [cv]: "UseS3ExpressControlEndpoint" }] };
var aq = { [ct]: e, [cu]: [{ [cv]: "UseS3ExpressControlEndpoint" }, true] };
var ar = { [ct]: r, [cu]: [Z] };
var as = { [f]: "Unrecognized S3Express bucket name format.", [cq]: f };
var at = { [ct]: r, [cu]: [ac] };
var au = { [cv]: u };
var av = { [cs]: [ar], [f]: "Expected a endpoint to be specified but no endpoint was found", [cq]: f };
var aw = { [cA]: [{ [cB]: true, [j]: z, [cC]: A, [cF]: ["*"] }, { [cB]: true, [j]: "sigv4", [cC]: A, [cD]: "{Region}" }] };
var ax = { [ct]: e, [cu]: [{ [cv]: "ForcePathStyle" }, false] };
var ay = { [cv]: "ForcePathStyle" };
var az = { [ct]: e, [cu]: [{ [cv]: "Accelerate" }, false] };
var aA = { [ct]: h, [cu]: [{ [cv]: "Region" }, "aws-global"] };
var aB = { [cA]: [{ [cB]: true, [j]: "sigv4", [cC]: B, [cD]: "us-east-1" }] };
var aC = { [ct]: r, [cu]: [aA] };
var aD = { [ct]: e, [cu]: [{ [cv]: "UseGlobalEndpoint" }, true] };
var aE = { [cx]: "https://{Bucket}.s3-fips.dualstack.{Region}.{partitionResult#dnsSuffix}", [cy]: { [cA]: [{ [cB]: true, [j]: "sigv4", [cC]: B, [cD]: "{Region}" }] }, [cE]: {} };
var aF = { [cA]: [{ [cB]: true, [j]: "sigv4", [cC]: B, [cD]: "{Region}" }] };
var aG = { [ct]: e, [cu]: [{ [cv]: "UseGlobalEndpoint" }, false] };
var aH = { [ct]: e, [cu]: [{ [cv]: "UseDualStack" }, false] };
var aI = { [cx]: "https://{Bucket}.s3-fips.{Region}.{partitionResult#dnsSuffix}", [cy]: aF, [cE]: {} };
var aJ = { [ct]: e, [cu]: [{ [cv]: "UseFIPS" }, false] };
var aK = { [cx]: "https://{Bucket}.s3-accelerate.dualstack.{partitionResult#dnsSuffix}", [cy]: aF, [cE]: {} };
var aL = { [cx]: "https://{Bucket}.s3.dualstack.{Region}.{partitionResult#dnsSuffix}", [cy]: aF, [cE]: {} };
var aM = { [ct]: e, [cu]: [{ [ct]: i, [cu]: [aj, "isIp"] }, false] };
var aN = { [cx]: C, [cy]: aF, [cE]: {} };
var aO = { [cx]: q, [cy]: aF, [cE]: {} };
var aP = { [n]: aO, [cq]: n };
var aQ = { [cx]: D, [cy]: aF, [cE]: {} };
var aR = { [cx]: "https://{Bucket}.s3.{Region}.{partitionResult#dnsSuffix}", [cy]: aF, [cE]: {} };
var aS = { [f]: "Invalid region: region was not a valid DNS name.", [cq]: f };
var aT = { [cv]: G };
var aU = { [cv]: H };
var aV = { [ct]: i, [cu]: [aT, "service"] };
var aW = { [cv]: L };
var aX = { [cs]: [Y], [f]: "S3 Object Lambda does not support Dual-stack", [cq]: f };
var aY = { [cs]: [W], [f]: "S3 Object Lambda does not support S3 Accelerate", [cq]: f };
var aZ = { [cs]: [{ [ct]: d, [cu]: [{ [cv]: "DisableAccessPoints" }] }, { [ct]: e, [cu]: [{ [cv]: "DisableAccessPoints" }, true] }], [f]: "Access points are not supported for this operation", [cq]: f };
var ba = { [cs]: [{ [ct]: d, [cu]: [{ [cv]: "UseArnRegion" }] }, { [ct]: e, [cu]: [{ [cv]: "UseArnRegion" }, false] }, { [ct]: r, [cu]: [{ [ct]: h, [cu]: [{ [ct]: i, [cu]: [aT, "region"] }, "{Region}"] }] }], [f]: "Invalid configuration: region from ARN `{bucketArn#region}` does not match client region `{Region}` and UseArnRegion is `false`", [cq]: f };
var bb = { [ct]: i, [cu]: [{ [cv]: "bucketPartition" }, j] };
var bc = { [ct]: i, [cu]: [aT, "accountId"] };
var bd = { [cA]: [{ [cB]: true, [j]: "sigv4", [cC]: J, [cD]: "{bucketArn#region}" }] };
var be = { [f]: "Invalid ARN: The access point name may only contain a-z, A-Z, 0-9 and `-`. Found: `{accessPointName}`", [cq]: f };
var bf = { [f]: "Invalid ARN: The account id may only contain a-z, A-Z, 0-9 and `-`. Found: `{bucketArn#accountId}`", [cq]: f };
var bg = { [f]: "Invalid region in ARN: `{bucketArn#region}` (invalid DNS name)", [cq]: f };
var bh = { [f]: "Client was configured for partition `{partitionResult#name}` but ARN (`{Bucket}`) has `{bucketPartition#name}`", [cq]: f };
var bi = { [f]: "Invalid ARN: The ARN may only contain a single resource component after `accesspoint`.", [cq]: f };
var bj = { [f]: "Invalid ARN: Expected a resource of the format `accesspoint:<accesspoint name>` but no name was provided", [cq]: f };
var bk = { [cA]: [{ [cB]: true, [j]: "sigv4", [cC]: B, [cD]: "{bucketArn#region}" }] };
var bl = { [cA]: [{ [cB]: true, [j]: z, [cC]: A, [cF]: ["*"] }, { [cB]: true, [j]: "sigv4", [cC]: A, [cD]: "{bucketArn#region}" }] };
var bm = { [ct]: F, [cu]: [ad] };
var bn = { [cx]: "https://s3-fips.dualstack.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cy]: aF, [cE]: {} };
var bo = { [cx]: "https://s3-fips.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cy]: aF, [cE]: {} };
var bp = { [cx]: "https://s3.dualstack.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cy]: aF, [cE]: {} };
var bq = { [cx]: Q, [cy]: aF, [cE]: {} };
var br = { [cx]: "https://s3.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cy]: aF, [cE]: {} };
var bs = { [cv]: "UseObjectLambdaEndpoint" };
var bt = { [cA]: [{ [cB]: true, [j]: "sigv4", [cC]: J, [cD]: "{Region}" }] };
var bu = { [cx]: "https://s3-fips.dualstack.{Region}.{partitionResult#dnsSuffix}", [cy]: aF, [cE]: {} };
var bv = { [cx]: "https://s3-fips.{Region}.{partitionResult#dnsSuffix}", [cy]: aF, [cE]: {} };
var bw = { [cx]: "https://s3.dualstack.{Region}.{partitionResult#dnsSuffix}", [cy]: aF, [cE]: {} };
var bx = { [cx]: t, [cy]: aF, [cE]: {} };
var by = { [cx]: "https://s3.{Region}.{partitionResult#dnsSuffix}", [cy]: aF, [cE]: {} };
var bz = [{ [cv]: "Region" }];
var bA = [{ [cv]: "Endpoint" }];
var bB = [ad];
var bC = [Y];
var bD = [W];
var bE = [Z, ah];
var bF = [{ [ct]: d, [cu]: [{ [cv]: "DisableS3ExpressSessionAuth" }] }, { [ct]: e, [cu]: [{ [cv]: "DisableS3ExpressSessionAuth" }, true] }];
var bG = [ak];
var bH = [an];
var bI = [aa];
var bJ = [X];
var bK = [{ [ct]: k, [cu]: [ad, 6, 14, true], [cw]: "s3expressAvailabilityZoneId" }, { [ct]: k, [cu]: [ad, 14, 16, true], [cw]: "s3expressAvailabilityZoneDelim" }, { [ct]: h, [cu]: [{ [cv]: "s3expressAvailabilityZoneDelim" }, "--"] }];
var bL = [{ [cs]: [X], [n]: { [cx]: "https://{Bucket}.s3express-fips-{s3expressAvailabilityZoneId}.{Region}.{partitionResult#dnsSuffix}", [cy]: al, [cE]: {} }, [cq]: n }, { [n]: { [cx]: "https://{Bucket}.s3express-{s3expressAvailabilityZoneId}.{Region}.{partitionResult#dnsSuffix}", [cy]: al, [cE]: {} }, [cq]: n }];
var bM = [{ [ct]: k, [cu]: [ad, 6, 15, true], [cw]: "s3expressAvailabilityZoneId" }, { [ct]: k, [cu]: [ad, 15, 17, true], [cw]: "s3expressAvailabilityZoneDelim" }, { [ct]: h, [cu]: [{ [cv]: "s3expressAvailabilityZoneDelim" }, "--"] }];
var bN = [{ [ct]: k, [cu]: [ad, 6, 19, true], [cw]: "s3expressAvailabilityZoneId" }, { [ct]: k, [cu]: [ad, 19, 21, true], [cw]: "s3expressAvailabilityZoneDelim" }, { [ct]: h, [cu]: [{ [cv]: "s3expressAvailabilityZoneDelim" }, "--"] }];
var bO = [{ [ct]: k, [cu]: [ad, 6, 20, true], [cw]: "s3expressAvailabilityZoneId" }, { [ct]: k, [cu]: [ad, 20, 22, true], [cw]: "s3expressAvailabilityZoneDelim" }, { [ct]: h, [cu]: [{ [cv]: "s3expressAvailabilityZoneDelim" }, "--"] }];
var bP = [{ [ct]: k, [cu]: [ad, 6, 26, true], [cw]: "s3expressAvailabilityZoneId" }, { [ct]: k, [cu]: [ad, 26, 28, true], [cw]: "s3expressAvailabilityZoneDelim" }, { [ct]: h, [cu]: [{ [cv]: "s3expressAvailabilityZoneDelim" }, "--"] }];
var bQ = [{ [cs]: [X], [n]: { [cx]: "https://{Bucket}.s3express-fips-{s3expressAvailabilityZoneId}.{Region}.{partitionResult#dnsSuffix}", [cy]: { [cz]: "S3Express", [cA]: [{ [cB]: true, [j]: "sigv4-s3express", [cC]: "s3express", [cD]: "{Region}" }] }, [cE]: {} }, [cq]: n }, { [n]: { [cx]: "https://{Bucket}.s3express-{s3expressAvailabilityZoneId}.{Region}.{partitionResult#dnsSuffix}", [cy]: { [cz]: "S3Express", [cA]: [{ [cB]: true, [j]: "sigv4-s3express", [cC]: "s3express", [cD]: "{Region}" }] }, [cE]: {} }, [cq]: n }];
var bR = [ad, 0, 7, true];
var bS = [{ [ct]: k, [cu]: [ad, 7, 15, true], [cw]: "s3expressAvailabilityZoneId" }, { [ct]: k, [cu]: [ad, 15, 17, true], [cw]: "s3expressAvailabilityZoneDelim" }, { [ct]: h, [cu]: [{ [cv]: "s3expressAvailabilityZoneDelim" }, "--"] }];
var bT = [{ [ct]: k, [cu]: [ad, 7, 16, true], [cw]: "s3expressAvailabilityZoneId" }, { [ct]: k, [cu]: [ad, 16, 18, true], [cw]: "s3expressAvailabilityZoneDelim" }, { [ct]: h, [cu]: [{ [cv]: "s3expressAvailabilityZoneDelim" }, "--"] }];
var bU = [{ [ct]: k, [cu]: [ad, 7, 20, true], [cw]: "s3expressAvailabilityZoneId" }, { [ct]: k, [cu]: [ad, 20, 22, true], [cw]: "s3expressAvailabilityZoneDelim" }, { [ct]: h, [cu]: [{ [cv]: "s3expressAvailabilityZoneDelim" }, "--"] }];
var bV = [{ [ct]: k, [cu]: [ad, 7, 21, true], [cw]: "s3expressAvailabilityZoneId" }, { [ct]: k, [cu]: [ad, 21, 23, true], [cw]: "s3expressAvailabilityZoneDelim" }, { [ct]: h, [cu]: [{ [cv]: "s3expressAvailabilityZoneDelim" }, "--"] }];
var bW = [{ [ct]: k, [cu]: [ad, 7, 27, true], [cw]: "s3expressAvailabilityZoneId" }, { [ct]: k, [cu]: [ad, 27, 29, true], [cw]: "s3expressAvailabilityZoneDelim" }, { [ct]: h, [cu]: [{ [cv]: "s3expressAvailabilityZoneDelim" }, "--"] }];
var bX = [ac];
var bY = [{ [ct]: y, [cu]: [{ [cv]: x }, false] }];
var bZ = [{ [ct]: h, [cu]: [{ [cv]: v }, "beta"] }];
var ca = ["*"];
var cb = [{ [ct]: y, [cu]: [{ [cv]: "Region" }, false] }];
var cc = [{ [ct]: h, [cu]: [{ [cv]: "Region" }, "us-east-1"] }];
var cd = [{ [ct]: h, [cu]: [aU, K] }];
var ce = [{ [ct]: i, [cu]: [aT, "resourceId[1]"], [cw]: L }, { [ct]: r, [cu]: [{ [ct]: h, [cu]: [aW, I] }] }];
var cf = [aT, "resourceId[1]"];
var cg = [{ [ct]: r, [cu]: [{ [ct]: h, [cu]: [{ [ct]: i, [cu]: [aT, "region"] }, I] }] }];
var ch = [{ [ct]: r, [cu]: [{ [ct]: d, [cu]: [{ [ct]: i, [cu]: [aT, "resourceId[2]"] }] }] }];
var ci = [aT, "resourceId[2]"];
var cj = [{ [ct]: g, [cu]: [{ [ct]: i, [cu]: [aT, "region"] }], [cw]: "bucketPartition" }];
var ck = [{ [ct]: h, [cu]: [bb, { [ct]: i, [cu]: [{ [cv]: "partitionResult" }, j] }] }];
var cl = [{ [ct]: y, [cu]: [{ [ct]: i, [cu]: [aT, "region"] }, true] }];
var cm = [{ [ct]: y, [cu]: [bc, false] }];
var cn = [{ [ct]: y, [cu]: [aW, false] }];
var co = [{ [ct]: y, [cu]: [{ [cv]: "Region" }, true] }];
var _data = { version: "1.0", parameters: { Bucket: T, Region: T, UseFIPS: U, UseDualStack: U, Endpoint: T, ForcePathStyle: U, Accelerate: U, UseGlobalEndpoint: U, UseObjectLambdaEndpoint: V, Key: T, Prefix: T, CopySource: T, DisableAccessPoints: V, DisableMultiRegionAccessPoints: U, UseArnRegion: V, UseS3ExpressControlEndpoint: V, DisableS3ExpressSessionAuth: V }, [cr]: [{ [cs]: [{ [ct]: d, [cu]: bz }], [cr]: [{ [cs]: [W, X], error: "Accelerate cannot be used with FIPS", [cq]: f }, { [cs]: [Y, Z], error: "Cannot set dual-stack in combination with a custom endpoint.", [cq]: f }, { [cs]: [Z, X], error: "A custom endpoint cannot be combined with FIPS", [cq]: f }, { [cs]: [Z, W], error: "A custom endpoint cannot be combined with S3 Accelerate", [cq]: f }, { [cs]: [X, aa, ab], error: "Partition does not support FIPS", [cq]: f }, { [cs]: [ac, { [ct]: k, [cu]: [ad, 0, a, c], [cw]: l }, { [ct]: h, [cu]: [{ [cv]: l }, "--x-s3"] }], [cr]: [ae, af, ag, { [cs]: [ap, aq], [cr]: [{ [cs]: bI, [cr]: [{ [cs]: [ak, ar], [cr]: [{ [cs]: bJ, endpoint: { [cx]: "https://s3express-control-fips.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cy]: al, [cE]: am }, [cq]: n }, { endpoint: { [cx]: "https://s3express-control.{Region}.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cy]: al, [cE]: am }, [cq]: n }], [cq]: o }], [cq]: o }], [cq]: o }, { [cs]: bH, [cr]: [{ [cs]: bI, [cr]: [{ [cs]: bF, [cr]: [{ [cs]: bK, [cr]: bL, [cq]: o }, { [cs]: bM, [cr]: bL, [cq]: o }, { [cs]: bN, [cr]: bL, [cq]: o }, { [cs]: bO, [cr]: bL, [cq]: o }, { [cs]: bP, [cr]: bL, [cq]: o }, as], [cq]: o }, { [cs]: bK, [cr]: bQ, [cq]: o }, { [cs]: bM, [cr]: bQ, [cq]: o }, { [cs]: bN, [cr]: bQ, [cq]: o }, { [cs]: bO, [cr]: bQ, [cq]: o }, { [cs]: bP, [cr]: bQ, [cq]: o }, as], [cq]: o }], [cq]: o }, ao], [cq]: o }, { [cs]: [ac, { [ct]: k, [cu]: bR, [cw]: s }, { [ct]: h, [cu]: [{ [cv]: s }, "--xa-s3"] }], [cr]: [ae, af, ag, { [cs]: bH, [cr]: [{ [cs]: bI, [cr]: [{ [cs]: bF, [cr]: [{ [cs]: bS, [cr]: bL, [cq]: o }, { [cs]: bT, [cr]: bL, [cq]: o }, { [cs]: bU, [cr]: bL, [cq]: o }, { [cs]: bV, [cr]: bL, [cq]: o }, { [cs]: bW, [cr]: bL, [cq]: o }, as], [cq]: o }, { [cs]: bS, [cr]: bQ, [cq]: o }, { [cs]: bT, [cr]: bQ, [cq]: o }, { [cs]: bU, [cr]: bQ, [cq]: o }, { [cs]: bV, [cr]: bQ, [cq]: o }, { [cs]: bW, [cr]: bQ, [cq]: o }, as], [cq]: o }], [cq]: o }, ao], [cq]: o }, { [cs]: [at, ap, aq], [cr]: [{ [cs]: bI, [cr]: [{ [cs]: bE, endpoint: { [cx]: t, [cy]: al, [cE]: am }, [cq]: n }, { [cs]: bJ, endpoint: { [cx]: "https://s3express-control-fips.{Region}.{partitionResult#dnsSuffix}", [cy]: al, [cE]: am }, [cq]: n }, { endpoint: { [cx]: "https://s3express-control.{Region}.{partitionResult#dnsSuffix}", [cy]: al, [cE]: am }, [cq]: n }], [cq]: o }], [cq]: o }, { [cs]: [ac, { [ct]: k, [cu]: [ad, 49, 50, c], [cw]: u }, { [ct]: k, [cu]: [ad, 8, 12, c], [cw]: v }, { [ct]: k, [cu]: bR, [cw]: w }, { [ct]: k, [cu]: [ad, 32, 49, c], [cw]: x }, { [ct]: g, [cu]: bz, [cw]: "regionPartition" }, { [ct]: h, [cu]: [{ [cv]: w }, "--op-s3"] }], [cr]: [{ [cs]: bY, [cr]: [{ [cs]: [{ [ct]: h, [cu]: [au, "e"] }], [cr]: [{ [cs]: bZ, [cr]: [av, { [cs]: bE, endpoint: { [cx]: "https://{Bucket}.ec2.{url#authority}", [cy]: aw, [cE]: am }, [cq]: n }], [cq]: o }, { endpoint: { [cx]: "https://{Bucket}.ec2.s3-outposts.{Region}.{regionPartition#dnsSuffix}", [cy]: aw, [cE]: am }, [cq]: n }], [cq]: o }, { [cs]: [{ [ct]: h, [cu]: [au, "o"] }], [cr]: [{ [cs]: bZ, [cr]: [av, { [cs]: bE, endpoint: { [cx]: "https://{Bucket}.op-{outpostId}.{url#authority}", [cy]: aw, [cE]: am }, [cq]: n }], [cq]: o }, { endpoint: { [cx]: "https://{Bucket}.op-{outpostId}.s3-outposts.{Region}.{regionPartition#dnsSuffix}", [cy]: aw, [cE]: am }, [cq]: n }], [cq]: o }, { error: 'Unrecognized hardware type: "Expected hardware type o or e but got {hardwareType}"', [cq]: f }], [cq]: o }, { error: "Invalid ARN: The outpost Id must only contain a-z, A-Z, 0-9 and `-`.", [cq]: f }], [cq]: o }, { [cs]: bX, [cr]: [{ [cs]: [Z, { [ct]: r, [cu]: [{ [ct]: d, [cu]: [{ [ct]: m, [cu]: bA }] }] }], error: "Custom endpoint `{Endpoint}` was not a valid URI", [cq]: f }, { [cs]: [ax, an], [cr]: [{ [cs]: bI, [cr]: [{ [cs]: cb, [cr]: [{ [cs]: [W, ab], error: "S3 Accelerate cannot be used in this region", [cq]: f }, { [cs]: [Y, X, az, ar, aA], endpoint: { [cx]: "https://{Bucket}.s3-fips.dualstack.us-east-1.{partitionResult#dnsSuffix}", [cy]: aB, [cE]: am }, [cq]: n }, { [cs]: [Y, X, az, ar, aC, aD], [cr]: [{ endpoint: aE, [cq]: n }], [cq]: o }, { [cs]: [Y, X, az, ar, aC, aG], endpoint: aE, [cq]: n }, { [cs]: [aH, X, az, ar, aA], endpoint: { [cx]: "https://{Bucket}.s3-fips.us-east-1.{partitionResult#dnsSuffix}", [cy]: aB, [cE]: am }, [cq]: n }, { [cs]: [aH, X, az, ar, aC, aD], [cr]: [{ endpoint: aI, [cq]: n }], [cq]: o }, { [cs]: [aH, X, az, ar, aC, aG], endpoint: aI, [cq]: n }, { [cs]: [Y, aJ, W, ar, aA], endpoint: { [cx]: "https://{Bucket}.s3-accelerate.dualstack.us-east-1.{partitionResult#dnsSuffix}", [cy]: aB, [cE]: am }, [cq]: n }, { [cs]: [Y, aJ, W, ar, aC, aD], [cr]: [{ endpoint: aK, [cq]: n }], [cq]: o }, { [cs]: [Y, aJ, W, ar, aC, aG], endpoint: aK, [cq]: n }, { [cs]: [Y, aJ, az, ar, aA], endpoint: { [cx]: "https://{Bucket}.s3.dualstack.us-east-1.{partitionResult#dnsSuffix}", [cy]: aB, [cE]: am }, [cq]: n }, { [cs]: [Y, aJ, az, ar, aC, aD], [cr]: [{ endpoint: aL, [cq]: n }], [cq]: o }, { [cs]: [Y, aJ, az, ar, aC, aG], endpoint: aL, [cq]: n }, { [cs]: [aH, aJ, az, Z, ah, ai, aA], endpoint: { [cx]: C, [cy]: aB, [cE]: am }, [cq]: n }, { [cs]: [aH, aJ, az, Z, ah, aM, aA], endpoint: { [cx]: q, [cy]: aB, [cE]: am }, [cq]: n }, { [cs]: [aH, aJ, az, Z, ah, ai, aC, aD], [cr]: [{ [cs]: cc, endpoint: aN, [cq]: n }, { endpoint: aN, [cq]: n }], [cq]: o }, { [cs]: [aH, aJ, az, Z, ah, aM, aC, aD], [cr]: [{ [cs]: cc, endpoint: aO, [cq]: n }, aP], [cq]: o }, { [cs]: [aH, aJ, az, Z, ah, ai, aC, aG], endpoint: aN, [cq]: n }, { [cs]: [aH, aJ, az, Z, ah, aM, aC, aG], endpoint: aO, [cq]: n }, { [cs]: [aH, aJ, W, ar, aA], endpoint: { [cx]: D, [cy]: aB, [cE]: am }, [cq]: n }, { [cs]: [aH, aJ, W, ar, aC, aD], [cr]: [{ [cs]: cc, endpoint: aQ, [cq]: n }, { endpoint: aQ, [cq]: n }], [cq]: o }, { [cs]: [aH, aJ, W, ar, aC, aG], endpoint: aQ, [cq]: n }, { [cs]: [aH, aJ, az, ar, aA], endpoint: { [cx]: E, [cy]: aB, [cE]: am }, [cq]: n }, { [cs]: [aH, aJ, az, ar, aC, aD], [cr]: [{ [cs]: cc, endpoint: { [cx]: E, [cy]: aF, [cE]: am }, [cq]: n }, { endpoint: aR, [cq]: n }], [cq]: o }, { [cs]: [aH, aJ, az, ar, aC, aG], endpoint: aR, [cq]: n }], [cq]: o }, aS], [cq]: o }], [cq]: o }, { [cs]: [Z, ah, { [ct]: h, [cu]: [{ [ct]: i, [cu]: [aj, "scheme"] }, "http"] }, { [ct]: p, [cu]: [ad, c] }, ax, aJ, aH, az], [cr]: [{ [cs]: bI, [cr]: [{ [cs]: cb, [cr]: [aP], [cq]: o }, aS], [cq]: o }], [cq]: o }, { [cs]: [ax, { [ct]: F, [cu]: bB, [cw]: G }], [cr]: [{ [cs]: [{ [ct]: i, [cu]: [aT, "resourceId[0]"], [cw]: H }, { [ct]: r, [cu]: [{ [ct]: h, [cu]: [aU, I] }] }], [cr]: [{ [cs]: [{ [ct]: h, [cu]: [aV, J] }], [cr]: [{ [cs]: cd, [cr]: [{ [cs]: ce, [cr]: [aX, aY, { [cs]: cg, [cr]: [aZ, { [cs]: ch, [cr]: [ba, { [cs]: cj, [cr]: [{ [cs]: bI, [cr]: [{ [cs]: ck, [cr]: [{ [cs]: cl, [cr]: [{ [cs]: [{ [ct]: h, [cu]: [bc, I] }], error: "Invalid ARN: Missing account id", [cq]: f }, { [cs]: cm, [cr]: [{ [cs]: cn, [cr]: [{ [cs]: bE, endpoint: { [cx]: M, [cy]: bd, [cE]: am }, [cq]: n }, { [cs]: bJ, endpoint: { [cx]: "https://{accessPointName}-{bucketArn#accountId}.s3-object-lambda-fips.{bucketArn#region}.{bucketPartition#dnsSuffix}", [cy]: bd, [cE]: am }, [cq]: n }, { endpoint: { [cx]: "https://{accessPointName}-{bucketArn#accountId}.s3-object-lambda.{bucketArn#region}.{bucketPartition#dnsSuffix}", [cy]: bd, [cE]: am }, [cq]: n }], [cq]: o }, be], [cq]: o }, bf], [cq]: o }, bg], [cq]: o }, bh], [cq]: o }], [cq]: o }], [cq]: o }, bi], [cq]: o }, { error: "Invalid ARN: bucket ARN is missing a region", [cq]: f }], [cq]: o }, bj], [cq]: o }, { error: "Invalid ARN: Object Lambda ARNs only support `accesspoint` arn types, but found: `{arnType}`", [cq]: f }], [cq]: o }, { [cs]: cd, [cr]: [{ [cs]: ce, [cr]: [{ [cs]: cg, [cr]: [{ [cs]: cd, [cr]: [{ [cs]: cg, [cr]: [aZ, { [cs]: ch, [cr]: [ba, { [cs]: cj, [cr]: [{ [cs]: bI, [cr]: [{ [cs]: [{ [ct]: h, [cu]: [bb, "{partitionResult#name}"] }], [cr]: [{ [cs]: cl, [cr]: [{ [cs]: [{ [ct]: h, [cu]: [aV, B] }], [cr]: [{ [cs]: cm, [cr]: [{ [cs]: cn, [cr]: [{ [cs]: bD, error: "Access Points do not support S3 Accelerate", [cq]: f }, { [cs]: [X, Y], endpoint: { [cx]: "https://{accessPointName}-{bucketArn#accountId}.s3-accesspoint-fips.dualstack.{bucketArn#region}.{bucketPartition#dnsSuffix}", [cy]: bk, [cE]: am }, [cq]: n }, { [cs]: [X, aH], endpoint: { [cx]: "https://{accessPointName}-{bucketArn#accountId}.s3-accesspoint-fips.{bucketArn#region}.{bucketPartition#dnsSuffix}", [cy]: bk, [cE]: am }, [cq]: n }, { [cs]: [aJ, Y], endpoint: { [cx]: "https://{accessPointName}-{bucketArn#accountId}.s3-accesspoint.dualstack.{bucketArn#region}.{bucketPartition#dnsSuffix}", [cy]: bk, [cE]: am }, [cq]: n }, { [cs]: [aJ, aH, Z, ah], endpoint: { [cx]: M, [cy]: bk, [cE]: am }, [cq]: n }, { [cs]: [aJ, aH], endpoint: { [cx]: "https://{accessPointName}-{bucketArn#accountId}.s3-accesspoint.{bucketArn#region}.{bucketPartition#dnsSuffix}", [cy]: bk, [cE]: am }, [cq]: n }], [cq]: o }, be], [cq]: o }, bf], [cq]: o }, { error: "Invalid ARN: The ARN was not for the S3 service, found: {bucketArn#service}", [cq]: f }], [cq]: o }, bg], [cq]: o }, bh], [cq]: o }], [cq]: o }], [cq]: o }, bi], [cq]: o }], [cq]: o }], [cq]: o }, { [cs]: [{ [ct]: y, [cu]: [aW, c] }], [cr]: [{ [cs]: bC, error: "S3 MRAP does not support dual-stack", [cq]: f }, { [cs]: bJ, error: "S3 MRAP does not support FIPS", [cq]: f }, { [cs]: bD, error: "S3 MRAP does not support S3 Accelerate", [cq]: f }, { [cs]: [{ [ct]: e, [cu]: [{ [cv]: "DisableMultiRegionAccessPoints" }, c] }], error: "Invalid configuration: Multi-Region Access Point ARNs are disabled.", [cq]: f }, { [cs]: [{ [ct]: g, [cu]: bz, [cw]: N }], [cr]: [{ [cs]: [{ [ct]: h, [cu]: [{ [ct]: i, [cu]: [{ [cv]: N }, j] }, { [ct]: i, [cu]: [aT, "partition"] }] }], [cr]: [{ endpoint: { [cx]: "https://{accessPointName}.accesspoint.s3-global.{mrapPartition#dnsSuffix}", [cy]: { [cA]: [{ [cB]: c, name: z, [cC]: B, [cF]: ca }] }, [cE]: am }, [cq]: n }], [cq]: o }, { error: "Client was configured for partition `{mrapPartition#name}` but bucket referred to partition `{bucketArn#partition}`", [cq]: f }], [cq]: o }], [cq]: o }, { error: "Invalid Access Point Name", [cq]: f }], [cq]: o }, bj], [cq]: o }, { [cs]: [{ [ct]: h, [cu]: [aV, A] }], [cr]: [{ [cs]: bC, error: "S3 Outposts does not support Dual-stack", [cq]: f }, { [cs]: bJ, error: "S3 Outposts does not support FIPS", [cq]: f }, { [cs]: bD, error: "S3 Outposts does not support S3 Accelerate", [cq]: f }, { [cs]: [{ [ct]: d, [cu]: [{ [ct]: i, [cu]: [aT, "resourceId[4]"] }] }], error: "Invalid Arn: Outpost Access Point ARN contains sub resources", [cq]: f }, { [cs]: [{ [ct]: i, [cu]: cf, [cw]: x }], [cr]: [{ [cs]: bY, [cr]: [ba, { [cs]: cj, [cr]: [{ [cs]: bI, [cr]: [{ [cs]: ck, [cr]: [{ [cs]: cl, [cr]: [{ [cs]: cm, [cr]: [{ [cs]: [{ [ct]: i, [cu]: ci, [cw]: O }], [cr]: [{ [cs]: [{ [ct]: i, [cu]: [aT, "resourceId[3]"], [cw]: L }], [cr]: [{ [cs]: [{ [ct]: h, [cu]: [{ [cv]: O }, K] }], [cr]: [{ [cs]: bE, endpoint: { [cx]: "https://{accessPointName}-{bucketArn#accountId}.{outpostId}.{url#authority}", [cy]: bl, [cE]: am }, [cq]: n }, { endpoint: { [cx]: "https://{accessPointName}-{bucketArn#accountId}.{outpostId}.s3-outposts.{bucketArn#region}.{bucketPartition#dnsSuffix}", [cy]: bl, [cE]: am }, [cq]: n }], [cq]: o }, { error: "Expected an outpost type `accesspoint`, found {outpostType}", [cq]: f }], [cq]: o }, { error: "Invalid ARN: expected an access point name", [cq]: f }], [cq]: o }, { error: "Invalid ARN: Expected a 4-component resource", [cq]: f }], [cq]: o }, bf], [cq]: o }, bg], [cq]: o }, bh], [cq]: o }], [cq]: o }], [cq]: o }, { error: "Invalid ARN: The outpost Id may only contain a-z, A-Z, 0-9 and `-`. Found: `{outpostId}`", [cq]: f }], [cq]: o }, { error: "Invalid ARN: The Outpost Id was not set", [cq]: f }], [cq]: o }, { error: "Invalid ARN: Unrecognized format: {Bucket} (type: {arnType})", [cq]: f }], [cq]: o }, { error: "Invalid ARN: No ARN type specified", [cq]: f }], [cq]: o }, { [cs]: [{ [ct]: k, [cu]: [ad, 0, 4, b], [cw]: P }, { [ct]: h, [cu]: [{ [cv]: P }, "arn:"] }, { [ct]: r, [cu]: [{ [ct]: d, [cu]: [bm] }] }], error: "Invalid ARN: `{Bucket}` was not a valid ARN", [cq]: f }, { [cs]: [{ [ct]: e, [cu]: [ay, c] }, bm], error: "Path-style addressing cannot be used with ARN buckets", [cq]: f }, { [cs]: bG, [cr]: [{ [cs]: bI, [cr]: [{ [cs]: [az], [cr]: [{ [cs]: [Y, ar, X, aA], endpoint: { [cx]: "https://s3-fips.dualstack.us-east-1.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cy]: aB, [cE]: am }, [cq]: n }, { [cs]: [Y, ar, X, aC, aD], [cr]: [{ endpoint: bn, [cq]: n }], [cq]: o }, { [cs]: [Y, ar, X, aC, aG], endpoint: bn, [cq]: n }, { [cs]: [aH, ar, X, aA], endpoint: { [cx]: "https://s3-fips.us-east-1.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cy]: aB, [cE]: am }, [cq]: n }, { [cs]: [aH, ar, X, aC, aD], [cr]: [{ endpoint: bo, [cq]: n }], [cq]: o }, { [cs]: [aH, ar, X, aC, aG], endpoint: bo, [cq]: n }, { [cs]: [Y, ar, aJ, aA], endpoint: { [cx]: "https://s3.dualstack.us-east-1.{partitionResult#dnsSuffix}/{uri_encoded_bucket}", [cy]: aB, [cE]: am }, [cq]: n }, { [cs]: [Y, ar, aJ, aC, aD], [cr]: [{ endpoint: bp, [cq]: n }], [cq]: o }, { [cs]: [Y, ar, aJ, aC, aG], endpoint: bp, [cq]: n }, { [cs]: [aH, Z, ah, aJ, aA], endpoint: { [cx]: Q, [cy]: aB, [cE]: am }, [cq]: n }, { [cs]: [aH, Z, ah, aJ, aC, aD], [cr]: [{ [cs]: cc, endpoint: bq, [cq]: n }, { endpoint: bq, [cq]: n }], [cq]: o }, { [cs]: [aH, Z, ah, aJ, aC, aG], endpoint: bq, [cq]: n }, { [cs]: [aH, ar, aJ, aA], endpoint: { [cx]: R, [cy]: aB, [cE]: am }, [cq]: n }, { [cs]: [aH, ar, aJ, aC, aD], [cr]: [{ [cs]: cc, endpoint: { [cx]: R, [cy]: aF, [cE]: am }, [cq]: n }, { endpoint: br, [cq]: n }], [cq]: o }, { [cs]: [aH, ar, aJ, aC, aG], endpoint: br, [cq]: n }], [cq]: o }, { error: "Path-style addressing cannot be used with S3 Accelerate", [cq]: f }], [cq]: o }], [cq]: o }], [cq]: o }, { [cs]: [{ [ct]: d, [cu]: [bs] }, { [ct]: e, [cu]: [bs, c] }], [cr]: [{ [cs]: bI, [cr]: [{ [cs]: co, [cr]: [aX, aY, { [cs]: bE, endpoint: { [cx]: t, [cy]: bt, [cE]: am }, [cq]: n }, { [cs]: bJ, endpoint: { [cx]: "https://s3-object-lambda-fips.{Region}.{partitionResult#dnsSuffix}", [cy]: bt, [cE]: am }, [cq]: n }, { endpoint: { [cx]: "https://s3-object-lambda.{Region}.{partitionResult#dnsSuffix}", [cy]: bt, [cE]: am }, [cq]: n }], [cq]: o }, aS], [cq]: o }], [cq]: o }, { [cs]: [at], [cr]: [{ [cs]: bI, [cr]: [{ [cs]: co, [cr]: [{ [cs]: [X, Y, ar, aA], endpoint: { [cx]: "https://s3-fips.dualstack.us-east-1.{partitionResult#dnsSuffix}", [cy]: aB, [cE]: am }, [cq]: n }, { [cs]: [X, Y, ar, aC, aD], [cr]: [{ endpoint: bu, [cq]: n }], [cq]: o }, { [cs]: [X, Y, ar, aC, aG], endpoint: bu, [cq]: n }, { [cs]: [X, aH, ar, aA], endpoint: { [cx]: "https://s3-fips.us-east-1.{partitionResult#dnsSuffix}", [cy]: aB, [cE]: am }, [cq]: n }, { [cs]: [X, aH, ar, aC, aD], [cr]: [{ endpoint: bv, [cq]: n }], [cq]: o }, { [cs]: [X, aH, ar, aC, aG], endpoint: bv, [cq]: n }, { [cs]: [aJ, Y, ar, aA], endpoint: { [cx]: "https://s3.dualstack.us-east-1.{partitionResult#dnsSuffix}", [cy]: aB, [cE]: am }, [cq]: n }, { [cs]: [aJ, Y, ar, aC, aD], [cr]: [{ endpoint: bw, [cq]: n }], [cq]: o }, { [cs]: [aJ, Y, ar, aC, aG], endpoint: bw, [cq]: n }, { [cs]: [aJ, aH, Z, ah, aA], endpoint: { [cx]: t, [cy]: aB, [cE]: am }, [cq]: n }, { [cs]: [aJ, aH, Z, ah, aC, aD], [cr]: [{ [cs]: cc, endpoint: bx, [cq]: n }, { endpoint: bx, [cq]: n }], [cq]: o }, { [cs]: [aJ, aH, Z, ah, aC, aG], endpoint: bx, [cq]: n }, { [cs]: [aJ, aH, ar, aA], endpoint: { [cx]: S, [cy]: aB, [cE]: am }, [cq]: n }, { [cs]: [aJ, aH, ar, aC, aD], [cr]: [{ [cs]: cc, endpoint: { [cx]: S, [cy]: aF, [cE]: am }, [cq]: n }, { endpoint: by, [cq]: n }], [cq]: o }, { [cs]: [aJ, aH, ar, aC, aG], endpoint: by, [cq]: n }], [cq]: o }, aS], [cq]: o }], [cq]: o }], [cq]: o }, { error: "A region must be set when sending requests to S3.", [cq]: f }] };
var ruleSet = _data;

// node_modules/@aws-sdk/client-s3/dist-es/endpoint/endpointResolver.js
var cache = new EndpointCache({
  size: 50,
  params: [
    "Accelerate",
    "Bucket",
    "DisableAccessPoints",
    "DisableMultiRegionAccessPoints",
    "DisableS3ExpressSessionAuth",
    "Endpoint",
    "ForcePathStyle",
    "Region",
    "UseArnRegion",
    "UseDualStack",
    "UseFIPS",
    "UseGlobalEndpoint",
    "UseObjectLambdaEndpoint",
    "UseS3ExpressControlEndpoint"
  ]
});
var defaultEndpointResolver = (endpointParams, context = {}) => {
  return cache.get(endpointParams, () => resolveEndpoint(ruleSet, {
    endpointParams,
    logger: context.logger
  }));
};
customEndpointFunctions.aws = awsEndpointFunctions;

// node_modules/@aws-sdk/client-s3/dist-es/auth/httpAuthSchemeProvider.js
var createEndpointRuleSetHttpAuthSchemeParametersProvider = (defaultHttpAuthSchemeParametersProvider) => async (config, context, input) => {
  var _a2, _b, _c2;
  if (!input) {
    throw new Error(`Could not find \`input\` for \`defaultEndpointRuleSetHttpAuthSchemeParametersProvider\``);
  }
  const defaultParameters = await defaultHttpAuthSchemeParametersProvider(config, context, input);
  const instructionsFn = (_c2 = (_b = (_a2 = getSmithyContext(context)) == null ? void 0 : _a2.commandInstance) == null ? void 0 : _b.constructor) == null ? void 0 : _c2.getEndpointParameterInstructions;
  if (!instructionsFn) {
    throw new Error(`getEndpointParameterInstructions() is not defined on \`${context.commandName}\``);
  }
  const endpointParameters = await resolveParams(input, { getEndpointParameterInstructions: instructionsFn }, config);
  return Object.assign(defaultParameters, endpointParameters);
};
var _defaultS3HttpAuthSchemeParametersProvider = async (config, context, input) => {
  return {
    operation: getSmithyContext(context).operation,
    region: await normalizeProvider(config.region)() || (() => {
      throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
    })()
  };
};
var defaultS3HttpAuthSchemeParametersProvider = createEndpointRuleSetHttpAuthSchemeParametersProvider(_defaultS3HttpAuthSchemeParametersProvider);
function createAwsAuthSigv4HttpAuthOption(authParameters) {
  return {
    schemeId: "aws.auth#sigv4",
    signingProperties: {
      name: "s3",
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
function createAwsAuthSigv4aHttpAuthOption(authParameters) {
  return {
    schemeId: "aws.auth#sigv4a",
    signingProperties: {
      name: "s3",
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
var createEndpointRuleSetHttpAuthSchemeProvider = (defaultEndpointResolver2, defaultHttpAuthSchemeResolver, createHttpAuthOptionFunctions) => {
  const endpointRuleSetHttpAuthSchemeProvider = (authParameters) => {
    var _a2;
    const endpoint = defaultEndpointResolver2(authParameters);
    const authSchemes = (_a2 = endpoint.properties) == null ? void 0 : _a2.authSchemes;
    if (!authSchemes) {
      return defaultHttpAuthSchemeResolver(authParameters);
    }
    const options = [];
    for (const scheme of authSchemes) {
      const { name: resolvedName, properties = {}, ...rest } = scheme;
      const name = resolvedName.toLowerCase();
      if (resolvedName !== name) {
        console.warn(`HttpAuthScheme has been normalized with lowercasing: \`${resolvedName}\` to \`${name}\``);
      }
      let schemeId;
      if (name === "sigv4a") {
        schemeId = "aws.auth#sigv4a";
        const sigv4Present = authSchemes.find((s2) => {
          const name2 = s2.name.toLowerCase();
          return name2 !== "sigv4a" && name2.startsWith("sigv4");
        });
        if (!signatureV4CrtContainer.CrtSignerV4 && sigv4Present) {
          continue;
        }
      } else if (name.startsWith("sigv4")) {
        schemeId = "aws.auth#sigv4";
      } else {
        throw new Error(`Unknown HttpAuthScheme found in \`@smithy.rules#endpointRuleSet\`: \`${name}\``);
      }
      const createOption = createHttpAuthOptionFunctions[schemeId];
      if (!createOption) {
        throw new Error(`Could not find HttpAuthOption create function for \`${schemeId}\``);
      }
      const option = createOption(authParameters);
      option.schemeId = schemeId;
      option.signingProperties = { ...option.signingProperties || {}, ...rest, ...properties };
      options.push(option);
    }
    return options;
  };
  return endpointRuleSetHttpAuthSchemeProvider;
};
var _defaultS3HttpAuthSchemeProvider = (authParameters) => {
  const options = [];
  switch (authParameters.operation) {
    default: {
      options.push(createAwsAuthSigv4HttpAuthOption(authParameters));
      options.push(createAwsAuthSigv4aHttpAuthOption(authParameters));
    }
  }
  return options;
};
var defaultS3HttpAuthSchemeProvider = createEndpointRuleSetHttpAuthSchemeProvider(defaultEndpointResolver, _defaultS3HttpAuthSchemeProvider, {
  "aws.auth#sigv4": createAwsAuthSigv4HttpAuthOption,
  "aws.auth#sigv4a": createAwsAuthSigv4aHttpAuthOption
});
var resolveHttpAuthSchemeConfig = (config) => {
  const config_0 = resolveAwsSdkSigV4Config(config);
  const config_1 = resolveAwsSdkSigV4AConfig(config_0);
  return Object.assign(config_1, {});
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/CreateSessionCommand.js
var import_dist133 = __toESM(require_dist());
var import_dist134 = __toESM(require_dist2());
var import_dist135 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-s3/dist-es/endpoint/EndpointParameters.js
var import_dist103 = __toESM(require_dist());
var import_dist104 = __toESM(require_dist2());
var import_dist105 = __toESM(require_dist3());
var resolveClientEndpointParameters = (options) => {
  return Object.assign(options, {
    useFipsEndpoint: options.useFipsEndpoint ?? false,
    useDualstackEndpoint: options.useDualstackEndpoint ?? false,
    forcePathStyle: options.forcePathStyle ?? false,
    useAccelerateEndpoint: options.useAccelerateEndpoint ?? false,
    useGlobalEndpoint: options.useGlobalEndpoint ?? false,
    disableMultiregionAccessPoints: options.disableMultiregionAccessPoints ?? false,
    defaultSigningName: "s3"
  });
};
var commonParams = {
  ForcePathStyle: { type: "clientContextParams", name: "forcePathStyle" },
  UseArnRegion: { type: "clientContextParams", name: "useArnRegion" },
  DisableMultiRegionAccessPoints: { type: "clientContextParams", name: "disableMultiregionAccessPoints" },
  Accelerate: { type: "clientContextParams", name: "useAccelerateEndpoint" },
  DisableS3ExpressSessionAuth: { type: "clientContextParams", name: "disableS3ExpressSessionAuth" },
  UseGlobalEndpoint: { type: "builtInParams", name: "useGlobalEndpoint" },
  UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
  Endpoint: { type: "builtInParams", name: "endpoint" },
  Region: { type: "builtInParams", name: "region" },
  UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" }
};

// node_modules/@aws-sdk/client-s3/dist-es/models/models_0.js
var import_dist109 = __toESM(require_dist());
var import_dist110 = __toESM(require_dist2());
var import_dist111 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-s3/dist-es/models/S3ServiceException.js
var import_dist106 = __toESM(require_dist());
var import_dist107 = __toESM(require_dist2());
var import_dist108 = __toESM(require_dist3());
var S3ServiceException = class _S3ServiceException extends ServiceException {
  constructor(options) {
    super(options);
    Object.setPrototypeOf(this, _S3ServiceException.prototype);
  }
};

// node_modules/@aws-sdk/client-s3/dist-es/models/models_0.js
var RequestCharged = {
  requester: "requester"
};
var RequestPayer = {
  requester: "requester"
};
var NoSuchUpload = class _NoSuchUpload extends S3ServiceException {
  constructor(opts) {
    super({
      name: "NoSuchUpload",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "NoSuchUpload");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _NoSuchUpload.prototype);
  }
};
var BucketAccelerateStatus = {
  Enabled: "Enabled",
  Suspended: "Suspended"
};
var Type = {
  AmazonCustomerByEmail: "AmazonCustomerByEmail",
  CanonicalUser: "CanonicalUser",
  Group: "Group"
};
var Permission = {
  FULL_CONTROL: "FULL_CONTROL",
  READ: "READ",
  READ_ACP: "READ_ACP",
  WRITE: "WRITE",
  WRITE_ACP: "WRITE_ACP"
};
var OwnerOverride = {
  Destination: "Destination"
};
var ChecksumType = {
  COMPOSITE: "COMPOSITE",
  FULL_OBJECT: "FULL_OBJECT"
};
var ServerSideEncryption = {
  AES256: "AES256",
  aws_kms: "aws:kms",
  aws_kms_dsse: "aws:kms:dsse"
};
var ObjectCannedACL = {
  authenticated_read: "authenticated-read",
  aws_exec_read: "aws-exec-read",
  bucket_owner_full_control: "bucket-owner-full-control",
  bucket_owner_read: "bucket-owner-read",
  private: "private",
  public_read: "public-read",
  public_read_write: "public-read-write"
};
var ChecksumAlgorithm2 = {
  CRC32: "CRC32",
  CRC32C: "CRC32C",
  CRC64NVME: "CRC64NVME",
  SHA1: "SHA1",
  SHA256: "SHA256"
};
var MetadataDirective = {
  COPY: "COPY",
  REPLACE: "REPLACE"
};
var ObjectLockLegalHoldStatus = {
  OFF: "OFF",
  ON: "ON"
};
var ObjectLockMode = {
  COMPLIANCE: "COMPLIANCE",
  GOVERNANCE: "GOVERNANCE"
};
var StorageClass = {
  DEEP_ARCHIVE: "DEEP_ARCHIVE",
  EXPRESS_ONEZONE: "EXPRESS_ONEZONE",
  GLACIER: "GLACIER",
  GLACIER_IR: "GLACIER_IR",
  INTELLIGENT_TIERING: "INTELLIGENT_TIERING",
  ONEZONE_IA: "ONEZONE_IA",
  OUTPOSTS: "OUTPOSTS",
  REDUCED_REDUNDANCY: "REDUCED_REDUNDANCY",
  SNOW: "SNOW",
  STANDARD: "STANDARD",
  STANDARD_IA: "STANDARD_IA"
};
var TaggingDirective = {
  COPY: "COPY",
  REPLACE: "REPLACE"
};
var ObjectNotInActiveTierError = class _ObjectNotInActiveTierError extends S3ServiceException {
  constructor(opts) {
    super({
      name: "ObjectNotInActiveTierError",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ObjectNotInActiveTierError");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _ObjectNotInActiveTierError.prototype);
  }
};
var BucketAlreadyExists = class _BucketAlreadyExists extends S3ServiceException {
  constructor(opts) {
    super({
      name: "BucketAlreadyExists",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "BucketAlreadyExists");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _BucketAlreadyExists.prototype);
  }
};
var BucketAlreadyOwnedByYou = class _BucketAlreadyOwnedByYou extends S3ServiceException {
  constructor(opts) {
    super({
      name: "BucketAlreadyOwnedByYou",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "BucketAlreadyOwnedByYou");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _BucketAlreadyOwnedByYou.prototype);
  }
};
var BucketCannedACL = {
  authenticated_read: "authenticated-read",
  private: "private",
  public_read: "public-read",
  public_read_write: "public-read-write"
};
var DataRedundancy = {
  SingleAvailabilityZone: "SingleAvailabilityZone",
  SingleLocalZone: "SingleLocalZone"
};
var BucketType = {
  Directory: "Directory"
};
var LocationType = {
  AvailabilityZone: "AvailabilityZone",
  LocalZone: "LocalZone"
};
var BucketLocationConstraint = {
  EU: "EU",
  af_south_1: "af-south-1",
  ap_east_1: "ap-east-1",
  ap_northeast_1: "ap-northeast-1",
  ap_northeast_2: "ap-northeast-2",
  ap_northeast_3: "ap-northeast-3",
  ap_south_1: "ap-south-1",
  ap_south_2: "ap-south-2",
  ap_southeast_1: "ap-southeast-1",
  ap_southeast_2: "ap-southeast-2",
  ap_southeast_3: "ap-southeast-3",
  ap_southeast_4: "ap-southeast-4",
  ap_southeast_5: "ap-southeast-5",
  ca_central_1: "ca-central-1",
  cn_north_1: "cn-north-1",
  cn_northwest_1: "cn-northwest-1",
  eu_central_1: "eu-central-1",
  eu_central_2: "eu-central-2",
  eu_north_1: "eu-north-1",
  eu_south_1: "eu-south-1",
  eu_south_2: "eu-south-2",
  eu_west_1: "eu-west-1",
  eu_west_2: "eu-west-2",
  eu_west_3: "eu-west-3",
  il_central_1: "il-central-1",
  me_central_1: "me-central-1",
  me_south_1: "me-south-1",
  sa_east_1: "sa-east-1",
  us_east_2: "us-east-2",
  us_gov_east_1: "us-gov-east-1",
  us_gov_west_1: "us-gov-west-1",
  us_west_1: "us-west-1",
  us_west_2: "us-west-2"
};
var ObjectOwnership = {
  BucketOwnerEnforced: "BucketOwnerEnforced",
  BucketOwnerPreferred: "BucketOwnerPreferred",
  ObjectWriter: "ObjectWriter"
};
var SessionMode = {
  ReadOnly: "ReadOnly",
  ReadWrite: "ReadWrite"
};
var NoSuchBucket = class _NoSuchBucket extends S3ServiceException {
  constructor(opts) {
    super({
      name: "NoSuchBucket",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "NoSuchBucket");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _NoSuchBucket.prototype);
  }
};
var AnalyticsFilter;
(function(AnalyticsFilter2) {
  AnalyticsFilter2.visit = (value, visitor) => {
    if (value.Prefix !== void 0)
      return visitor.Prefix(value.Prefix);
    if (value.Tag !== void 0)
      return visitor.Tag(value.Tag);
    if (value.And !== void 0)
      return visitor.And(value.And);
    return visitor._(value.$unknown[0], value.$unknown[1]);
  };
})(AnalyticsFilter || (AnalyticsFilter = {}));
var AnalyticsS3ExportFileFormat = {
  CSV: "CSV"
};
var StorageClassAnalysisSchemaVersion = {
  V_1: "V_1"
};
var IntelligentTieringStatus = {
  Disabled: "Disabled",
  Enabled: "Enabled"
};
var IntelligentTieringAccessTier = {
  ARCHIVE_ACCESS: "ARCHIVE_ACCESS",
  DEEP_ARCHIVE_ACCESS: "DEEP_ARCHIVE_ACCESS"
};
var InventoryFormat = {
  CSV: "CSV",
  ORC: "ORC",
  Parquet: "Parquet"
};
var InventoryIncludedObjectVersions = {
  All: "All",
  Current: "Current"
};
var InventoryOptionalField = {
  BucketKeyStatus: "BucketKeyStatus",
  ChecksumAlgorithm: "ChecksumAlgorithm",
  ETag: "ETag",
  EncryptionStatus: "EncryptionStatus",
  IntelligentTieringAccessTier: "IntelligentTieringAccessTier",
  IsMultipartUploaded: "IsMultipartUploaded",
  LastModifiedDate: "LastModifiedDate",
  ObjectAccessControlList: "ObjectAccessControlList",
  ObjectLockLegalHoldStatus: "ObjectLockLegalHoldStatus",
  ObjectLockMode: "ObjectLockMode",
  ObjectLockRetainUntilDate: "ObjectLockRetainUntilDate",
  ObjectOwner: "ObjectOwner",
  ReplicationStatus: "ReplicationStatus",
  Size: "Size",
  StorageClass: "StorageClass"
};
var InventoryFrequency = {
  Daily: "Daily",
  Weekly: "Weekly"
};
var TransitionStorageClass = {
  DEEP_ARCHIVE: "DEEP_ARCHIVE",
  GLACIER: "GLACIER",
  GLACIER_IR: "GLACIER_IR",
  INTELLIGENT_TIERING: "INTELLIGENT_TIERING",
  ONEZONE_IA: "ONEZONE_IA",
  STANDARD_IA: "STANDARD_IA"
};
var ExpirationStatus = {
  Disabled: "Disabled",
  Enabled: "Enabled"
};
var TransitionDefaultMinimumObjectSize = {
  all_storage_classes_128K: "all_storage_classes_128K",
  varies_by_storage_class: "varies_by_storage_class"
};
var BucketLogsPermission = {
  FULL_CONTROL: "FULL_CONTROL",
  READ: "READ",
  WRITE: "WRITE"
};
var PartitionDateSource = {
  DeliveryTime: "DeliveryTime",
  EventTime: "EventTime"
};
var MetricsFilter;
(function(MetricsFilter2) {
  MetricsFilter2.visit = (value, visitor) => {
    if (value.Prefix !== void 0)
      return visitor.Prefix(value.Prefix);
    if (value.Tag !== void 0)
      return visitor.Tag(value.Tag);
    if (value.AccessPointArn !== void 0)
      return visitor.AccessPointArn(value.AccessPointArn);
    if (value.And !== void 0)
      return visitor.And(value.And);
    return visitor._(value.$unknown[0], value.$unknown[1]);
  };
})(MetricsFilter || (MetricsFilter = {}));
var Event = {
  s3_IntelligentTiering: "s3:IntelligentTiering",
  s3_LifecycleExpiration_: "s3:LifecycleExpiration:*",
  s3_LifecycleExpiration_Delete: "s3:LifecycleExpiration:Delete",
  s3_LifecycleExpiration_DeleteMarkerCreated: "s3:LifecycleExpiration:DeleteMarkerCreated",
  s3_LifecycleTransition: "s3:LifecycleTransition",
  s3_ObjectAcl_Put: "s3:ObjectAcl:Put",
  s3_ObjectCreated_: "s3:ObjectCreated:*",
  s3_ObjectCreated_CompleteMultipartUpload: "s3:ObjectCreated:CompleteMultipartUpload",
  s3_ObjectCreated_Copy: "s3:ObjectCreated:Copy",
  s3_ObjectCreated_Post: "s3:ObjectCreated:Post",
  s3_ObjectCreated_Put: "s3:ObjectCreated:Put",
  s3_ObjectRemoved_: "s3:ObjectRemoved:*",
  s3_ObjectRemoved_Delete: "s3:ObjectRemoved:Delete",
  s3_ObjectRemoved_DeleteMarkerCreated: "s3:ObjectRemoved:DeleteMarkerCreated",
  s3_ObjectRestore_: "s3:ObjectRestore:*",
  s3_ObjectRestore_Completed: "s3:ObjectRestore:Completed",
  s3_ObjectRestore_Delete: "s3:ObjectRestore:Delete",
  s3_ObjectRestore_Post: "s3:ObjectRestore:Post",
  s3_ObjectTagging_: "s3:ObjectTagging:*",
  s3_ObjectTagging_Delete: "s3:ObjectTagging:Delete",
  s3_ObjectTagging_Put: "s3:ObjectTagging:Put",
  s3_ReducedRedundancyLostObject: "s3:ReducedRedundancyLostObject",
  s3_Replication_: "s3:Replication:*",
  s3_Replication_OperationFailedReplication: "s3:Replication:OperationFailedReplication",
  s3_Replication_OperationMissedThreshold: "s3:Replication:OperationMissedThreshold",
  s3_Replication_OperationNotTracked: "s3:Replication:OperationNotTracked",
  s3_Replication_OperationReplicatedAfterThreshold: "s3:Replication:OperationReplicatedAfterThreshold"
};
var FilterRuleName = {
  prefix: "prefix",
  suffix: "suffix"
};
var DeleteMarkerReplicationStatus = {
  Disabled: "Disabled",
  Enabled: "Enabled"
};
var MetricsStatus = {
  Disabled: "Disabled",
  Enabled: "Enabled"
};
var ReplicationTimeStatus = {
  Disabled: "Disabled",
  Enabled: "Enabled"
};
var ExistingObjectReplicationStatus = {
  Disabled: "Disabled",
  Enabled: "Enabled"
};
var ReplicaModificationsStatus = {
  Disabled: "Disabled",
  Enabled: "Enabled"
};
var SseKmsEncryptedObjectsStatus = {
  Disabled: "Disabled",
  Enabled: "Enabled"
};
var ReplicationRuleStatus = {
  Disabled: "Disabled",
  Enabled: "Enabled"
};
var Payer = {
  BucketOwner: "BucketOwner",
  Requester: "Requester"
};
var MFADeleteStatus = {
  Disabled: "Disabled",
  Enabled: "Enabled"
};
var BucketVersioningStatus = {
  Enabled: "Enabled",
  Suspended: "Suspended"
};
var Protocol = {
  http: "http",
  https: "https"
};
var ReplicationStatus = {
  COMPLETE: "COMPLETE",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  PENDING: "PENDING",
  REPLICA: "REPLICA"
};
var ChecksumMode = {
  ENABLED: "ENABLED"
};
var InvalidObjectState = class _InvalidObjectState extends S3ServiceException {
  constructor(opts) {
    super({
      name: "InvalidObjectState",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "InvalidObjectState");
    __publicField(this, "$fault", "client");
    __publicField(this, "StorageClass");
    __publicField(this, "AccessTier");
    Object.setPrototypeOf(this, _InvalidObjectState.prototype);
    this.StorageClass = opts.StorageClass;
    this.AccessTier = opts.AccessTier;
  }
};
var NoSuchKey = class _NoSuchKey extends S3ServiceException {
  constructor(opts) {
    super({
      name: "NoSuchKey",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "NoSuchKey");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _NoSuchKey.prototype);
  }
};
var ObjectAttributes = {
  CHECKSUM: "Checksum",
  ETAG: "ETag",
  OBJECT_PARTS: "ObjectParts",
  OBJECT_SIZE: "ObjectSize",
  STORAGE_CLASS: "StorageClass"
};
var ObjectLockEnabled = {
  Enabled: "Enabled"
};
var ObjectLockRetentionMode = {
  COMPLIANCE: "COMPLIANCE",
  GOVERNANCE: "GOVERNANCE"
};
var NotFound = class _NotFound extends S3ServiceException {
  constructor(opts) {
    super({
      name: "NotFound",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "NotFound");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _NotFound.prototype);
  }
};
var ArchiveStatus = {
  ARCHIVE_ACCESS: "ARCHIVE_ACCESS",
  DEEP_ARCHIVE_ACCESS: "DEEP_ARCHIVE_ACCESS"
};
var EncodingType = {
  url: "url"
};
var ObjectStorageClass = {
  DEEP_ARCHIVE: "DEEP_ARCHIVE",
  EXPRESS_ONEZONE: "EXPRESS_ONEZONE",
  GLACIER: "GLACIER",
  GLACIER_IR: "GLACIER_IR",
  INTELLIGENT_TIERING: "INTELLIGENT_TIERING",
  ONEZONE_IA: "ONEZONE_IA",
  OUTPOSTS: "OUTPOSTS",
  REDUCED_REDUNDANCY: "REDUCED_REDUNDANCY",
  SNOW: "SNOW",
  STANDARD: "STANDARD",
  STANDARD_IA: "STANDARD_IA"
};
var OptionalObjectAttributes = {
  RESTORE_STATUS: "RestoreStatus"
};
var ObjectVersionStorageClass = {
  STANDARD: "STANDARD"
};
var CompleteMultipartUploadOutputFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SSEKMSKeyId && { SSEKMSKeyId: SENSITIVE_STRING }
});
var CompleteMultipartUploadRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SSECustomerKey && { SSECustomerKey: SENSITIVE_STRING }
});
var CopyObjectOutputFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SSEKMSKeyId && { SSEKMSKeyId: SENSITIVE_STRING },
  ...obj.SSEKMSEncryptionContext && { SSEKMSEncryptionContext: SENSITIVE_STRING }
});
var CopyObjectRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SSECustomerKey && { SSECustomerKey: SENSITIVE_STRING },
  ...obj.SSEKMSKeyId && { SSEKMSKeyId: SENSITIVE_STRING },
  ...obj.SSEKMSEncryptionContext && { SSEKMSEncryptionContext: SENSITIVE_STRING },
  ...obj.CopySourceSSECustomerKey && { CopySourceSSECustomerKey: SENSITIVE_STRING }
});
var CreateMultipartUploadOutputFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SSEKMSKeyId && { SSEKMSKeyId: SENSITIVE_STRING },
  ...obj.SSEKMSEncryptionContext && { SSEKMSEncryptionContext: SENSITIVE_STRING }
});
var CreateMultipartUploadRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SSECustomerKey && { SSECustomerKey: SENSITIVE_STRING },
  ...obj.SSEKMSKeyId && { SSEKMSKeyId: SENSITIVE_STRING },
  ...obj.SSEKMSEncryptionContext && { SSEKMSEncryptionContext: SENSITIVE_STRING }
});
var SessionCredentialsFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SecretAccessKey && { SecretAccessKey: SENSITIVE_STRING },
  ...obj.SessionToken && { SessionToken: SENSITIVE_STRING }
});
var CreateSessionOutputFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SSEKMSKeyId && { SSEKMSKeyId: SENSITIVE_STRING },
  ...obj.SSEKMSEncryptionContext && { SSEKMSEncryptionContext: SENSITIVE_STRING },
  ...obj.Credentials && { Credentials: SessionCredentialsFilterSensitiveLog(obj.Credentials) }
});
var CreateSessionRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SSEKMSKeyId && { SSEKMSKeyId: SENSITIVE_STRING },
  ...obj.SSEKMSEncryptionContext && { SSEKMSEncryptionContext: SENSITIVE_STRING }
});
var ServerSideEncryptionByDefaultFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.KMSMasterKeyID && { KMSMasterKeyID: SENSITIVE_STRING }
});
var ServerSideEncryptionRuleFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ApplyServerSideEncryptionByDefault && {
    ApplyServerSideEncryptionByDefault: ServerSideEncryptionByDefaultFilterSensitiveLog(obj.ApplyServerSideEncryptionByDefault)
  }
});
var ServerSideEncryptionConfigurationFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Rules && { Rules: obj.Rules.map((item) => ServerSideEncryptionRuleFilterSensitiveLog(item)) }
});
var GetBucketEncryptionOutputFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ServerSideEncryptionConfiguration && {
    ServerSideEncryptionConfiguration: ServerSideEncryptionConfigurationFilterSensitiveLog(obj.ServerSideEncryptionConfiguration)
  }
});
var SSEKMSFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.KeyId && { KeyId: SENSITIVE_STRING }
});
var InventoryEncryptionFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SSEKMS && { SSEKMS: SSEKMSFilterSensitiveLog(obj.SSEKMS) }
});
var InventoryS3BucketDestinationFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Encryption && { Encryption: InventoryEncryptionFilterSensitiveLog(obj.Encryption) }
});
var InventoryDestinationFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.S3BucketDestination && {
    S3BucketDestination: InventoryS3BucketDestinationFilterSensitiveLog(obj.S3BucketDestination)
  }
});
var InventoryConfigurationFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Destination && { Destination: InventoryDestinationFilterSensitiveLog(obj.Destination) }
});
var GetBucketInventoryConfigurationOutputFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.InventoryConfiguration && {
    InventoryConfiguration: InventoryConfigurationFilterSensitiveLog(obj.InventoryConfiguration)
  }
});
var GetObjectOutputFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SSEKMSKeyId && { SSEKMSKeyId: SENSITIVE_STRING }
});
var GetObjectRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SSECustomerKey && { SSECustomerKey: SENSITIVE_STRING }
});
var GetObjectAttributesRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SSECustomerKey && { SSECustomerKey: SENSITIVE_STRING }
});
var GetObjectTorrentOutputFilterSensitiveLog = (obj) => ({
  ...obj
});
var HeadObjectOutputFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SSEKMSKeyId && { SSEKMSKeyId: SENSITIVE_STRING }
});
var HeadObjectRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SSECustomerKey && { SSECustomerKey: SENSITIVE_STRING }
});
var ListBucketInventoryConfigurationsOutputFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.InventoryConfigurationList && {
    InventoryConfigurationList: obj.InventoryConfigurationList.map((item) => InventoryConfigurationFilterSensitiveLog(item))
  }
});
var ListPartsRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SSECustomerKey && { SSECustomerKey: SENSITIVE_STRING }
});

// node_modules/@aws-sdk/client-s3/dist-es/protocols/Aws_restXml.js
var import_dist130 = __toESM(require_dist());
var import_dist131 = __toESM(require_dist2());
var import_dist132 = __toESM(require_dist3());

// node_modules/@aws-sdk/xml-builder/dist-es/index.js
var import_dist124 = __toESM(require_dist());
var import_dist125 = __toESM(require_dist2());
var import_dist126 = __toESM(require_dist3());

// node_modules/@aws-sdk/xml-builder/dist-es/XmlNode.js
var import_dist121 = __toESM(require_dist());
var import_dist122 = __toESM(require_dist2());
var import_dist123 = __toESM(require_dist3());

// node_modules/@aws-sdk/xml-builder/dist-es/escape-attribute.js
var import_dist112 = __toESM(require_dist());
var import_dist113 = __toESM(require_dist2());
var import_dist114 = __toESM(require_dist3());
function escapeAttribute(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// node_modules/@aws-sdk/xml-builder/dist-es/XmlText.js
var import_dist118 = __toESM(require_dist());
var import_dist119 = __toESM(require_dist2());
var import_dist120 = __toESM(require_dist3());

// node_modules/@aws-sdk/xml-builder/dist-es/escape-element.js
var import_dist115 = __toESM(require_dist());
var import_dist116 = __toESM(require_dist2());
var import_dist117 = __toESM(require_dist3());
function escapeElement(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r/g, "&#x0D;").replace(/\n/g, "&#x0A;").replace(/\u0085/g, "&#x85;").replace(/\u2028/, "&#x2028;");
}

// node_modules/@aws-sdk/xml-builder/dist-es/XmlText.js
var XmlText = class {
  constructor(value) {
    __publicField(this, "value");
    this.value = value;
  }
  toString() {
    return escapeElement("" + this.value);
  }
};

// node_modules/@aws-sdk/xml-builder/dist-es/XmlNode.js
var XmlNode = class _XmlNode {
  constructor(name, children = []) {
    __publicField(this, "name");
    __publicField(this, "children");
    __publicField(this, "attributes", {});
    this.name = name;
    this.children = children;
  }
  static of(name, childText, withName) {
    const node = new _XmlNode(name);
    if (childText !== void 0) {
      node.addChildNode(new XmlText(childText));
    }
    if (withName !== void 0) {
      node.withName(withName);
    }
    return node;
  }
  withName(name) {
    this.name = name;
    return this;
  }
  addAttribute(name, value) {
    this.attributes[name] = value;
    return this;
  }
  addChildNode(child) {
    this.children.push(child);
    return this;
  }
  removeAttribute(name) {
    delete this.attributes[name];
    return this;
  }
  n(name) {
    this.name = name;
    return this;
  }
  c(child) {
    this.children.push(child);
    return this;
  }
  a(name, value) {
    if (value != null) {
      this.attributes[name] = value;
    }
    return this;
  }
  cc(input, field, withName = field) {
    if (input[field] != null) {
      const node = _XmlNode.of(field, input[field]).withName(withName);
      this.c(node);
    }
  }
  l(input, listName, memberName, valueProvider) {
    if (input[listName] != null) {
      const nodes = valueProvider();
      nodes.map((node) => {
        node.withName(memberName);
        this.c(node);
      });
    }
  }
  lc(input, listName, memberName, valueProvider) {
    if (input[listName] != null) {
      const nodes = valueProvider();
      const containerNode = new _XmlNode(memberName);
      nodes.map((node) => {
        containerNode.c(node);
      });
      this.c(containerNode);
    }
  }
  toString() {
    const hasChildren = Boolean(this.children.length);
    let xmlText = `<${this.name}`;
    const attributes = this.attributes;
    for (const attributeName of Object.keys(attributes)) {
      const attribute = attributes[attributeName];
      if (attribute != null) {
        xmlText += ` ${attributeName}="${escapeAttribute("" + attribute)}"`;
      }
    }
    return xmlText += !hasChildren ? "/>" : `>${this.children.map((c2) => c2.toString()).join("")}</${this.name}>`;
  }
};

// node_modules/@aws-sdk/client-s3/dist-es/models/models_1.js
var import_dist127 = __toESM(require_dist());
var import_dist128 = __toESM(require_dist2());
var import_dist129 = __toESM(require_dist3());
var MFADelete = {
  Disabled: "Disabled",
  Enabled: "Enabled"
};
var EncryptionTypeMismatch = class _EncryptionTypeMismatch extends S3ServiceException {
  constructor(opts) {
    super({
      name: "EncryptionTypeMismatch",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "EncryptionTypeMismatch");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _EncryptionTypeMismatch.prototype);
  }
};
var InvalidRequest = class _InvalidRequest extends S3ServiceException {
  constructor(opts) {
    super({
      name: "InvalidRequest",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "InvalidRequest");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _InvalidRequest.prototype);
  }
};
var InvalidWriteOffset = class _InvalidWriteOffset extends S3ServiceException {
  constructor(opts) {
    super({
      name: "InvalidWriteOffset",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "InvalidWriteOffset");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _InvalidWriteOffset.prototype);
  }
};
var TooManyParts = class _TooManyParts extends S3ServiceException {
  constructor(opts) {
    super({
      name: "TooManyParts",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "TooManyParts");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _TooManyParts.prototype);
  }
};
var ObjectAlreadyInActiveTierError = class _ObjectAlreadyInActiveTierError extends S3ServiceException {
  constructor(opts) {
    super({
      name: "ObjectAlreadyInActiveTierError",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ObjectAlreadyInActiveTierError");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _ObjectAlreadyInActiveTierError.prototype);
  }
};
var Tier = {
  Bulk: "Bulk",
  Expedited: "Expedited",
  Standard: "Standard"
};
var ExpressionType = {
  SQL: "SQL"
};
var CompressionType = {
  BZIP2: "BZIP2",
  GZIP: "GZIP",
  NONE: "NONE"
};
var FileHeaderInfo = {
  IGNORE: "IGNORE",
  NONE: "NONE",
  USE: "USE"
};
var JSONType = {
  DOCUMENT: "DOCUMENT",
  LINES: "LINES"
};
var QuoteFields = {
  ALWAYS: "ALWAYS",
  ASNEEDED: "ASNEEDED"
};
var RestoreRequestType = {
  SELECT: "SELECT"
};
var SelectObjectContentEventStream;
(function(SelectObjectContentEventStream2) {
  SelectObjectContentEventStream2.visit = (value, visitor) => {
    if (value.Records !== void 0)
      return visitor.Records(value.Records);
    if (value.Stats !== void 0)
      return visitor.Stats(value.Stats);
    if (value.Progress !== void 0)
      return visitor.Progress(value.Progress);
    if (value.Cont !== void 0)
      return visitor.Cont(value.Cont);
    if (value.End !== void 0)
      return visitor.End(value.End);
    return visitor._(value.$unknown[0], value.$unknown[1]);
  };
})(SelectObjectContentEventStream || (SelectObjectContentEventStream = {}));
var PutBucketEncryptionRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ServerSideEncryptionConfiguration && {
    ServerSideEncryptionConfiguration: ServerSideEncryptionConfigurationFilterSensitiveLog(obj.ServerSideEncryptionConfiguration)
  }
});
var PutBucketInventoryConfigurationRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.InventoryConfiguration && {
    InventoryConfiguration: InventoryConfigurationFilterSensitiveLog(obj.InventoryConfiguration)
  }
});
var PutObjectOutputFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SSEKMSKeyId && { SSEKMSKeyId: SENSITIVE_STRING },
  ...obj.SSEKMSEncryptionContext && { SSEKMSEncryptionContext: SENSITIVE_STRING }
});
var PutObjectRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SSECustomerKey && { SSECustomerKey: SENSITIVE_STRING },
  ...obj.SSEKMSKeyId && { SSEKMSKeyId: SENSITIVE_STRING },
  ...obj.SSEKMSEncryptionContext && { SSEKMSEncryptionContext: SENSITIVE_STRING }
});
var EncryptionFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.KMSKeyId && { KMSKeyId: SENSITIVE_STRING }
});
var S3LocationFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Encryption && { Encryption: EncryptionFilterSensitiveLog(obj.Encryption) }
});
var OutputLocationFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.S3 && { S3: S3LocationFilterSensitiveLog(obj.S3) }
});
var RestoreRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.OutputLocation && { OutputLocation: OutputLocationFilterSensitiveLog(obj.OutputLocation) }
});
var RestoreObjectRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.RestoreRequest && { RestoreRequest: RestoreRequestFilterSensitiveLog(obj.RestoreRequest) }
});
var SelectObjectContentEventStreamFilterSensitiveLog = (obj) => {
  if (obj.Records !== void 0)
    return { Records: obj.Records };
  if (obj.Stats !== void 0)
    return { Stats: obj.Stats };
  if (obj.Progress !== void 0)
    return { Progress: obj.Progress };
  if (obj.Cont !== void 0)
    return { Cont: obj.Cont };
  if (obj.End !== void 0)
    return { End: obj.End };
  if (obj.$unknown !== void 0)
    return { [obj.$unknown[0]]: "UNKNOWN" };
};
var SelectObjectContentOutputFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Payload && { Payload: "STREAMING_CONTENT" }
});
var SelectObjectContentRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SSECustomerKey && { SSECustomerKey: SENSITIVE_STRING }
});
var UploadPartOutputFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SSEKMSKeyId && { SSEKMSKeyId: SENSITIVE_STRING }
});
var UploadPartRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SSECustomerKey && { SSECustomerKey: SENSITIVE_STRING }
});
var UploadPartCopyOutputFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SSEKMSKeyId && { SSEKMSKeyId: SENSITIVE_STRING }
});
var UploadPartCopyRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SSECustomerKey && { SSECustomerKey: SENSITIVE_STRING },
  ...obj.CopySourceSSECustomerKey && { CopySourceSSECustomerKey: SENSITIVE_STRING }
});
var WriteGetObjectResponseRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SSEKMSKeyId && { SSEKMSKeyId: SENSITIVE_STRING }
});

// node_modules/@aws-sdk/client-s3/dist-es/protocols/Aws_restXml.js
var se_AbortMultipartUploadCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xarp]: input[_RP],
    [_xaebo]: input[_EBO],
    [_xaimit]: [() => isSerializableHeaderValue(input[_IMIT]), () => dateToUtcString(input[_IMIT]).toString()]
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_xi]: [, "AbortMultipartUpload"],
    [_uI]: [, expectNonNull(input[_UI], `UploadId`)]
  });
  let body;
  b2.m("DELETE").h(headers).q(query).b(body);
  return b2.build();
};
var se_CompleteMultipartUploadCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_xacc]: input[_CCRC],
    [_xacc_]: input[_CCRCC],
    [_xacc__]: input[_CCRCNVME],
    [_xacs]: input[_CSHA],
    [_xacs_]: input[_CSHAh],
    [_xact]: input[_CT],
    [_xamos]: [() => isSerializableHeaderValue(input[_MOS]), () => input[_MOS].toString()],
    [_xarp]: input[_RP],
    [_xaebo]: input[_EBO],
    [_im]: input[_IM],
    [_inm]: input[_INM],
    [_xasseca]: input[_SSECA],
    [_xasseck]: input[_SSECK],
    [_xasseckm]: input[_SSECKMD]
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_uI]: [, expectNonNull(input[_UI], `UploadId`)]
  });
  let body;
  let contents;
  if (input.MultipartUpload !== void 0) {
    contents = se_CompletedMultipartUpload(input.MultipartUpload, context);
    contents = contents.n("CompleteMultipartUpload");
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("POST").h(headers).q(query).b(body);
  return b2.build();
};
var se_CopyObjectCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaa]: input[_ACL],
    [_cc]: input[_CC],
    [_xaca]: input[_CA],
    [_cd]: input[_CD],
    [_ce]: input[_CE],
    [_cl]: input[_CL],
    [_ct]: input[_CTo],
    [_xacs__]: input[_CS],
    [_xacsim]: input[_CSIM],
    [_xacsims]: [() => isSerializableHeaderValue(input[_CSIMS]), () => dateToUtcString(input[_CSIMS]).toString()],
    [_xacsinm]: input[_CSINM],
    [_xacsius]: [() => isSerializableHeaderValue(input[_CSIUS]), () => dateToUtcString(input[_CSIUS]).toString()],
    [_e]: [() => isSerializableHeaderValue(input[_E]), () => dateToUtcString(input[_E]).toString()],
    [_xagfc]: input[_GFC],
    [_xagr]: input[_GR],
    [_xagra]: input[_GRACP],
    [_xagwa]: input[_GWACP],
    [_xamd]: input[_MD],
    [_xatd]: input[_TD],
    [_xasse]: input[_SSE],
    [_xasc]: input[_SC],
    [_xawrl]: input[_WRL],
    [_xasseca]: input[_SSECA],
    [_xasseck]: input[_SSECK],
    [_xasseckm]: input[_SSECKMD],
    [_xasseakki]: input[_SSEKMSKI],
    [_xassec]: input[_SSEKMSEC],
    [_xassebke]: [() => isSerializableHeaderValue(input[_BKE]), () => input[_BKE].toString()],
    [_xacssseca]: input[_CSSSECA],
    [_xacssseck]: input[_CSSSECK],
    [_xacssseckm]: input[_CSSSECKMD],
    [_xarp]: input[_RP],
    [_xat]: input[_T],
    [_xaolm]: input[_OLM],
    [_xaolrud]: [() => isSerializableHeaderValue(input[_OLRUD]), () => serializeDateTime(input[_OLRUD]).toString()],
    [_xaollh]: input[_OLLHS],
    [_xaebo]: input[_EBO],
    [_xasebo]: input[_ESBO],
    ...input.Metadata !== void 0 && Object.keys(input.Metadata).reduce((acc, suffix) => {
      acc[`x-amz-meta-${suffix.toLowerCase()}`] = input.Metadata[suffix];
      return acc;
    }, {})
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_xi]: [, "CopyObject"]
  });
  let body;
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_CreateBucketCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_xaa]: input[_ACL],
    [_xagfc]: input[_GFC],
    [_xagr]: input[_GR],
    [_xagra]: input[_GRACP],
    [_xagw]: input[_GW],
    [_xagwa]: input[_GWACP],
    [_xabole]: [() => isSerializableHeaderValue(input[_OLEFB]), () => input[_OLEFB].toString()],
    [_xaoo]: input[_OO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  let body;
  let contents;
  if (input.CreateBucketConfiguration !== void 0) {
    contents = se_CreateBucketConfiguration(input.CreateBucketConfiguration, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).b(body);
  return b2.build();
};
var se_CreateBucketMetadataTableConfigurationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_cm]: input[_CMD],
    [_xasca]: input[_CA],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_mT]: [, ""]
  });
  let body;
  let contents;
  if (input.MetadataTableConfiguration !== void 0) {
    contents = se_MetadataTableConfiguration(input.MetadataTableConfiguration, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("POST").h(headers).q(query).b(body);
  return b2.build();
};
var se_CreateMultipartUploadCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaa]: input[_ACL],
    [_cc]: input[_CC],
    [_cd]: input[_CD],
    [_ce]: input[_CE],
    [_cl]: input[_CL],
    [_ct]: input[_CTo],
    [_e]: [() => isSerializableHeaderValue(input[_E]), () => dateToUtcString(input[_E]).toString()],
    [_xagfc]: input[_GFC],
    [_xagr]: input[_GR],
    [_xagra]: input[_GRACP],
    [_xagwa]: input[_GWACP],
    [_xasse]: input[_SSE],
    [_xasc]: input[_SC],
    [_xawrl]: input[_WRL],
    [_xasseca]: input[_SSECA],
    [_xasseck]: input[_SSECK],
    [_xasseckm]: input[_SSECKMD],
    [_xasseakki]: input[_SSEKMSKI],
    [_xassec]: input[_SSEKMSEC],
    [_xassebke]: [() => isSerializableHeaderValue(input[_BKE]), () => input[_BKE].toString()],
    [_xarp]: input[_RP],
    [_xat]: input[_T],
    [_xaolm]: input[_OLM],
    [_xaolrud]: [() => isSerializableHeaderValue(input[_OLRUD]), () => serializeDateTime(input[_OLRUD]).toString()],
    [_xaollh]: input[_OLLHS],
    [_xaebo]: input[_EBO],
    [_xaca]: input[_CA],
    [_xact]: input[_CT],
    ...input.Metadata !== void 0 && Object.keys(input.Metadata).reduce((acc, suffix) => {
      acc[`x-amz-meta-${suffix.toLowerCase()}`] = input.Metadata[suffix];
      return acc;
    }, {})
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_u]: [, ""]
  });
  let body;
  b2.m("POST").h(headers).q(query).b(body);
  return b2.build();
};
var se_CreateSessionCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xacsm]: input[_SM],
    [_xasse]: input[_SSE],
    [_xasseakki]: input[_SSEKMSKI],
    [_xassec]: input[_SSEKMSEC],
    [_xassebke]: [() => isSerializableHeaderValue(input[_BKE]), () => input[_BKE].toString()]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_s]: [, ""]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_DeleteBucketCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  let body;
  b2.m("DELETE").h(headers).b(body);
  return b2.build();
};
var se_DeleteBucketAnalyticsConfigurationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_a]: [, ""],
    [_i]: [, expectNonNull(input[_I], `Id`)]
  });
  let body;
  b2.m("DELETE").h(headers).q(query).b(body);
  return b2.build();
};
var se_DeleteBucketCorsCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_c]: [, ""]
  });
  let body;
  b2.m("DELETE").h(headers).q(query).b(body);
  return b2.build();
};
var se_DeleteBucketEncryptionCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_en]: [, ""]
  });
  let body;
  b2.m("DELETE").h(headers).q(query).b(body);
  return b2.build();
};
var se_DeleteBucketIntelligentTieringConfigurationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = {};
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_it]: [, ""],
    [_i]: [, expectNonNull(input[_I], `Id`)]
  });
  let body;
  b2.m("DELETE").h(headers).q(query).b(body);
  return b2.build();
};
var se_DeleteBucketInventoryConfigurationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_in]: [, ""],
    [_i]: [, expectNonNull(input[_I], `Id`)]
  });
  let body;
  b2.m("DELETE").h(headers).q(query).b(body);
  return b2.build();
};
var se_DeleteBucketLifecycleCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_l]: [, ""]
  });
  let body;
  b2.m("DELETE").h(headers).q(query).b(body);
  return b2.build();
};
var se_DeleteBucketMetadataTableConfigurationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_mT]: [, ""]
  });
  let body;
  b2.m("DELETE").h(headers).q(query).b(body);
  return b2.build();
};
var se_DeleteBucketMetricsConfigurationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_m]: [, ""],
    [_i]: [, expectNonNull(input[_I], `Id`)]
  });
  let body;
  b2.m("DELETE").h(headers).q(query).b(body);
  return b2.build();
};
var se_DeleteBucketOwnershipControlsCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_oC]: [, ""]
  });
  let body;
  b2.m("DELETE").h(headers).q(query).b(body);
  return b2.build();
};
var se_DeleteBucketPolicyCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_p]: [, ""]
  });
  let body;
  b2.m("DELETE").h(headers).q(query).b(body);
  return b2.build();
};
var se_DeleteBucketReplicationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_r]: [, ""]
  });
  let body;
  b2.m("DELETE").h(headers).q(query).b(body);
  return b2.build();
};
var se_DeleteBucketTaggingCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_t]: [, ""]
  });
  let body;
  b2.m("DELETE").h(headers).q(query).b(body);
  return b2.build();
};
var se_DeleteBucketWebsiteCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_w]: [, ""]
  });
  let body;
  b2.m("DELETE").h(headers).q(query).b(body);
  return b2.build();
};
var se_DeleteObjectCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xam]: input[_MFA],
    [_xarp]: input[_RP],
    [_xabgr]: [() => isSerializableHeaderValue(input[_BGR]), () => input[_BGR].toString()],
    [_xaebo]: input[_EBO],
    [_im]: input[_IM],
    [_xaimlmt]: [() => isSerializableHeaderValue(input[_IMLMT]), () => dateToUtcString(input[_IMLMT]).toString()],
    [_xaims]: [() => isSerializableHeaderValue(input[_IMS]), () => input[_IMS].toString()]
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_xi]: [, "DeleteObject"],
    [_vI]: [, input[_VI]]
  });
  let body;
  b2.m("DELETE").h(headers).q(query).b(body);
  return b2.build();
};
var se_DeleteObjectsCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_xam]: input[_MFA],
    [_xarp]: input[_RP],
    [_xabgr]: [() => isSerializableHeaderValue(input[_BGR]), () => input[_BGR].toString()],
    [_xaebo]: input[_EBO],
    [_xasca]: input[_CA]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_d]: [, ""]
  });
  let body;
  let contents;
  if (input.Delete !== void 0) {
    contents = se_Delete(input.Delete, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("POST").h(headers).q(query).b(body);
  return b2.build();
};
var se_DeleteObjectTaggingCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_t]: [, ""],
    [_vI]: [, input[_VI]]
  });
  let body;
  b2.m("DELETE").h(headers).q(query).b(body);
  return b2.build();
};
var se_DeletePublicAccessBlockCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_pAB]: [, ""]
  });
  let body;
  b2.m("DELETE").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetBucketAccelerateConfigurationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO],
    [_xarp]: input[_RP]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_ac]: [, ""]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetBucketAclCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_acl]: [, ""]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetBucketAnalyticsConfigurationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_a]: [, ""],
    [_xi]: [, "GetBucketAnalyticsConfiguration"],
    [_i]: [, expectNonNull(input[_I], `Id`)]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetBucketCorsCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_c]: [, ""]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetBucketEncryptionCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_en]: [, ""]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetBucketIntelligentTieringConfigurationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = {};
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_it]: [, ""],
    [_xi]: [, "GetBucketIntelligentTieringConfiguration"],
    [_i]: [, expectNonNull(input[_I], `Id`)]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetBucketInventoryConfigurationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_in]: [, ""],
    [_xi]: [, "GetBucketInventoryConfiguration"],
    [_i]: [, expectNonNull(input[_I], `Id`)]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetBucketLifecycleConfigurationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_l]: [, ""]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetBucketLocationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_lo]: [, ""]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetBucketLoggingCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_log]: [, ""]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetBucketMetadataTableConfigurationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_mT]: [, ""]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetBucketMetricsConfigurationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_m]: [, ""],
    [_xi]: [, "GetBucketMetricsConfiguration"],
    [_i]: [, expectNonNull(input[_I], `Id`)]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetBucketNotificationConfigurationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_n]: [, ""]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetBucketOwnershipControlsCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_oC]: [, ""]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetBucketPolicyCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_p]: [, ""]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetBucketPolicyStatusCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_pS]: [, ""]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetBucketReplicationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_r]: [, ""]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetBucketRequestPaymentCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_rP]: [, ""]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetBucketTaggingCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_t]: [, ""]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetBucketVersioningCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_v]: [, ""]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetBucketWebsiteCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_w]: [, ""]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetObjectCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_im]: input[_IM],
    [_ims]: [() => isSerializableHeaderValue(input[_IMSf]), () => dateToUtcString(input[_IMSf]).toString()],
    [_inm]: input[_INM],
    [_ius]: [() => isSerializableHeaderValue(input[_IUS]), () => dateToUtcString(input[_IUS]).toString()],
    [_ra]: input[_R],
    [_xasseca]: input[_SSECA],
    [_xasseck]: input[_SSECK],
    [_xasseckm]: input[_SSECKMD],
    [_xarp]: input[_RP],
    [_xaebo]: input[_EBO],
    [_xacm]: input[_CM]
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_xi]: [, "GetObject"],
    [_rcc]: [, input[_RCC]],
    [_rcd]: [, input[_RCD]],
    [_rce]: [, input[_RCE]],
    [_rcl]: [, input[_RCL]],
    [_rct]: [, input[_RCT]],
    [_re]: [() => input.ResponseExpires !== void 0, () => dateToUtcString(input[_RE]).toString()],
    [_vI]: [, input[_VI]],
    [_pN]: [() => input.PartNumber !== void 0, () => input[_PN].toString()]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetObjectAclCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xarp]: input[_RP],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_acl]: [, ""],
    [_vI]: [, input[_VI]]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetObjectAttributesCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xamp]: [() => isSerializableHeaderValue(input[_MP]), () => input[_MP].toString()],
    [_xapnm]: input[_PNM],
    [_xasseca]: input[_SSECA],
    [_xasseck]: input[_SSECK],
    [_xasseckm]: input[_SSECKMD],
    [_xarp]: input[_RP],
    [_xaebo]: input[_EBO],
    [_xaoa]: [() => isSerializableHeaderValue(input[_OA]), () => (input[_OA] || []).map(quoteHeader).join(", ")]
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_at]: [, ""],
    [_vI]: [, input[_VI]]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetObjectLegalHoldCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xarp]: input[_RP],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_lh]: [, ""],
    [_vI]: [, input[_VI]]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetObjectLockConfigurationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_ol]: [, ""]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetObjectRetentionCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xarp]: input[_RP],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_ret]: [, ""],
    [_vI]: [, input[_VI]]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetObjectTaggingCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO],
    [_xarp]: input[_RP]
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_t]: [, ""],
    [_vI]: [, input[_VI]]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetObjectTorrentCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xarp]: input[_RP],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_to]: [, ""]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_GetPublicAccessBlockCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_pAB]: [, ""]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_HeadBucketCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  let body;
  b2.m("HEAD").h(headers).b(body);
  return b2.build();
};
var se_HeadObjectCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_im]: input[_IM],
    [_ims]: [() => isSerializableHeaderValue(input[_IMSf]), () => dateToUtcString(input[_IMSf]).toString()],
    [_inm]: input[_INM],
    [_ius]: [() => isSerializableHeaderValue(input[_IUS]), () => dateToUtcString(input[_IUS]).toString()],
    [_ra]: input[_R],
    [_xasseca]: input[_SSECA],
    [_xasseck]: input[_SSECK],
    [_xasseckm]: input[_SSECKMD],
    [_xarp]: input[_RP],
    [_xaebo]: input[_EBO],
    [_xacm]: input[_CM]
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_rcc]: [, input[_RCC]],
    [_rcd]: [, input[_RCD]],
    [_rce]: [, input[_RCE]],
    [_rcl]: [, input[_RCL]],
    [_rct]: [, input[_RCT]],
    [_re]: [() => input.ResponseExpires !== void 0, () => dateToUtcString(input[_RE]).toString()],
    [_vI]: [, input[_VI]],
    [_pN]: [() => input.PartNumber !== void 0, () => input[_PN].toString()]
  });
  let body;
  b2.m("HEAD").h(headers).q(query).b(body);
  return b2.build();
};
var se_ListBucketAnalyticsConfigurationsCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_a]: [, ""],
    [_xi]: [, "ListBucketAnalyticsConfigurations"],
    [_ct_]: [, input[_CTon]]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_ListBucketIntelligentTieringConfigurationsCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = {};
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_it]: [, ""],
    [_xi]: [, "ListBucketIntelligentTieringConfigurations"],
    [_ct_]: [, input[_CTon]]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_ListBucketInventoryConfigurationsCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_in]: [, ""],
    [_xi]: [, "ListBucketInventoryConfigurations"],
    [_ct_]: [, input[_CTon]]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_ListBucketMetricsConfigurationsCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_m]: [, ""],
    [_xi]: [, "ListBucketMetricsConfigurations"],
    [_ct_]: [, input[_CTon]]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_ListBucketsCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = {};
  b2.bp("/");
  const query = map({
    [_xi]: [, "ListBuckets"],
    [_mb]: [() => input.MaxBuckets !== void 0, () => input[_MB].toString()],
    [_ct_]: [, input[_CTon]],
    [_pr]: [, input[_P]],
    [_br]: [, input[_BR]]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_ListDirectoryBucketsCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = {};
  b2.bp("/");
  const query = map({
    [_xi]: [, "ListDirectoryBuckets"],
    [_ct_]: [, input[_CTon]],
    [_mdb]: [() => input.MaxDirectoryBuckets !== void 0, () => input[_MDB].toString()]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_ListMultipartUploadsCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO],
    [_xarp]: input[_RP]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_u]: [, ""],
    [_de]: [, input[_D]],
    [_et]: [, input[_ET]],
    [_km]: [, input[_KM]],
    [_mu]: [() => input.MaxUploads !== void 0, () => input[_MU].toString()],
    [_pr]: [, input[_P]],
    [_uim]: [, input[_UIM]]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_ListObjectsCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xarp]: input[_RP],
    [_xaebo]: input[_EBO],
    [_xaooa]: [() => isSerializableHeaderValue(input[_OOA]), () => (input[_OOA] || []).map(quoteHeader).join(", ")]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_de]: [, input[_D]],
    [_et]: [, input[_ET]],
    [_ma]: [, input[_M]],
    [_mk]: [() => input.MaxKeys !== void 0, () => input[_MK].toString()],
    [_pr]: [, input[_P]]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_ListObjectsV2Command = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xarp]: input[_RP],
    [_xaebo]: input[_EBO],
    [_xaooa]: [() => isSerializableHeaderValue(input[_OOA]), () => (input[_OOA] || []).map(quoteHeader).join(", ")]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_lt]: [, "2"],
    [_de]: [, input[_D]],
    [_et]: [, input[_ET]],
    [_mk]: [() => input.MaxKeys !== void 0, () => input[_MK].toString()],
    [_pr]: [, input[_P]],
    [_ct_]: [, input[_CTon]],
    [_fo]: [() => input.FetchOwner !== void 0, () => input[_FO].toString()],
    [_sa]: [, input[_SA]]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_ListObjectVersionsCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xaebo]: input[_EBO],
    [_xarp]: input[_RP],
    [_xaooa]: [() => isSerializableHeaderValue(input[_OOA]), () => (input[_OOA] || []).map(quoteHeader).join(", ")]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_ver]: [, ""],
    [_de]: [, input[_D]],
    [_et]: [, input[_ET]],
    [_km]: [, input[_KM]],
    [_mk]: [() => input.MaxKeys !== void 0, () => input[_MK].toString()],
    [_pr]: [, input[_P]],
    [_vim]: [, input[_VIM]]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_ListPartsCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xarp]: input[_RP],
    [_xaebo]: input[_EBO],
    [_xasseca]: input[_SSECA],
    [_xasseck]: input[_SSECK],
    [_xasseckm]: input[_SSECKMD]
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_xi]: [, "ListParts"],
    [_mp]: [() => input.MaxParts !== void 0, () => input[_MP].toString()],
    [_pnm]: [, input[_PNM]],
    [_uI]: [, expectNonNull(input[_UI], `UploadId`)]
  });
  let body;
  b2.m("GET").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutBucketAccelerateConfigurationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_xaebo]: input[_EBO],
    [_xasca]: input[_CA]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_ac]: [, ""]
  });
  let body;
  let contents;
  if (input.AccelerateConfiguration !== void 0) {
    contents = se_AccelerateConfiguration(input.AccelerateConfiguration, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutBucketAclCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_xaa]: input[_ACL],
    [_cm]: input[_CMD],
    [_xasca]: input[_CA],
    [_xagfc]: input[_GFC],
    [_xagr]: input[_GR],
    [_xagra]: input[_GRACP],
    [_xagw]: input[_GW],
    [_xagwa]: input[_GWACP],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_acl]: [, ""]
  });
  let body;
  let contents;
  if (input.AccessControlPolicy !== void 0) {
    contents = se_AccessControlPolicy(input.AccessControlPolicy, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutBucketAnalyticsConfigurationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_a]: [, ""],
    [_i]: [, expectNonNull(input[_I], `Id`)]
  });
  let body;
  let contents;
  if (input.AnalyticsConfiguration !== void 0) {
    contents = se_AnalyticsConfiguration(input.AnalyticsConfiguration, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutBucketCorsCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_cm]: input[_CMD],
    [_xasca]: input[_CA],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_c]: [, ""]
  });
  let body;
  let contents;
  if (input.CORSConfiguration !== void 0) {
    contents = se_CORSConfiguration(input.CORSConfiguration, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutBucketEncryptionCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_cm]: input[_CMD],
    [_xasca]: input[_CA],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_en]: [, ""]
  });
  let body;
  let contents;
  if (input.ServerSideEncryptionConfiguration !== void 0) {
    contents = se_ServerSideEncryptionConfiguration(input.ServerSideEncryptionConfiguration, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutBucketIntelligentTieringConfigurationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = {
    "content-type": "application/xml"
  };
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_it]: [, ""],
    [_i]: [, expectNonNull(input[_I], `Id`)]
  });
  let body;
  let contents;
  if (input.IntelligentTieringConfiguration !== void 0) {
    contents = se_IntelligentTieringConfiguration(input.IntelligentTieringConfiguration, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutBucketInventoryConfigurationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_in]: [, ""],
    [_i]: [, expectNonNull(input[_I], `Id`)]
  });
  let body;
  let contents;
  if (input.InventoryConfiguration !== void 0) {
    contents = se_InventoryConfiguration(input.InventoryConfiguration, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutBucketLifecycleConfigurationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_xasca]: input[_CA],
    [_xaebo]: input[_EBO],
    [_xatdmos]: input[_TDMOS]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_l]: [, ""]
  });
  let body;
  let contents;
  if (input.LifecycleConfiguration !== void 0) {
    contents = se_BucketLifecycleConfiguration(input.LifecycleConfiguration, context);
    contents = contents.n("LifecycleConfiguration");
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutBucketLoggingCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_cm]: input[_CMD],
    [_xasca]: input[_CA],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_log]: [, ""]
  });
  let body;
  let contents;
  if (input.BucketLoggingStatus !== void 0) {
    contents = se_BucketLoggingStatus(input.BucketLoggingStatus, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutBucketMetricsConfigurationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_m]: [, ""],
    [_i]: [, expectNonNull(input[_I], `Id`)]
  });
  let body;
  let contents;
  if (input.MetricsConfiguration !== void 0) {
    contents = se_MetricsConfiguration(input.MetricsConfiguration, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutBucketNotificationConfigurationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_xaebo]: input[_EBO],
    [_xasdv]: [() => isSerializableHeaderValue(input[_SDV]), () => input[_SDV].toString()]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_n]: [, ""]
  });
  let body;
  let contents;
  if (input.NotificationConfiguration !== void 0) {
    contents = se_NotificationConfiguration(input.NotificationConfiguration, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutBucketOwnershipControlsCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_cm]: input[_CMD],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_oC]: [, ""]
  });
  let body;
  let contents;
  if (input.OwnershipControls !== void 0) {
    contents = se_OwnershipControls(input.OwnershipControls, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutBucketPolicyCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "text/plain",
    [_cm]: input[_CMD],
    [_xasca]: input[_CA],
    [_xacrsba]: [() => isSerializableHeaderValue(input[_CRSBA]), () => input[_CRSBA].toString()],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_p]: [, ""]
  });
  let body;
  let contents;
  if (input.Policy !== void 0) {
    contents = input.Policy;
    body = contents;
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutBucketReplicationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_cm]: input[_CMD],
    [_xasca]: input[_CA],
    [_xabolt]: input[_To],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_r]: [, ""]
  });
  let body;
  let contents;
  if (input.ReplicationConfiguration !== void 0) {
    contents = se_ReplicationConfiguration(input.ReplicationConfiguration, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutBucketRequestPaymentCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_cm]: input[_CMD],
    [_xasca]: input[_CA],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_rP]: [, ""]
  });
  let body;
  let contents;
  if (input.RequestPaymentConfiguration !== void 0) {
    contents = se_RequestPaymentConfiguration(input.RequestPaymentConfiguration, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutBucketTaggingCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_cm]: input[_CMD],
    [_xasca]: input[_CA],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_t]: [, ""]
  });
  let body;
  let contents;
  if (input.Tagging !== void 0) {
    contents = se_Tagging(input.Tagging, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutBucketVersioningCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_cm]: input[_CMD],
    [_xasca]: input[_CA],
    [_xam]: input[_MFA],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_v]: [, ""]
  });
  let body;
  let contents;
  if (input.VersioningConfiguration !== void 0) {
    contents = se_VersioningConfiguration(input.VersioningConfiguration, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutBucketWebsiteCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_cm]: input[_CMD],
    [_xasca]: input[_CA],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_w]: [, ""]
  });
  let body;
  let contents;
  if (input.WebsiteConfiguration !== void 0) {
    contents = se_WebsiteConfiguration(input.WebsiteConfiguration, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutObjectCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_ct]: input[_CTo] || "application/octet-stream",
    [_xaa]: input[_ACL],
    [_cc]: input[_CC],
    [_cd]: input[_CD],
    [_ce]: input[_CE],
    [_cl]: input[_CL],
    [_cl_]: [() => isSerializableHeaderValue(input[_CLo]), () => input[_CLo].toString()],
    [_cm]: input[_CMD],
    [_xasca]: input[_CA],
    [_xacc]: input[_CCRC],
    [_xacc_]: input[_CCRCC],
    [_xacc__]: input[_CCRCNVME],
    [_xacs]: input[_CSHA],
    [_xacs_]: input[_CSHAh],
    [_e]: [() => isSerializableHeaderValue(input[_E]), () => dateToUtcString(input[_E]).toString()],
    [_im]: input[_IM],
    [_inm]: input[_INM],
    [_xagfc]: input[_GFC],
    [_xagr]: input[_GR],
    [_xagra]: input[_GRACP],
    [_xagwa]: input[_GWACP],
    [_xawob]: [() => isSerializableHeaderValue(input[_WOB]), () => input[_WOB].toString()],
    [_xasse]: input[_SSE],
    [_xasc]: input[_SC],
    [_xawrl]: input[_WRL],
    [_xasseca]: input[_SSECA],
    [_xasseck]: input[_SSECK],
    [_xasseckm]: input[_SSECKMD],
    [_xasseakki]: input[_SSEKMSKI],
    [_xassec]: input[_SSEKMSEC],
    [_xassebke]: [() => isSerializableHeaderValue(input[_BKE]), () => input[_BKE].toString()],
    [_xarp]: input[_RP],
    [_xat]: input[_T],
    [_xaolm]: input[_OLM],
    [_xaolrud]: [() => isSerializableHeaderValue(input[_OLRUD]), () => serializeDateTime(input[_OLRUD]).toString()],
    [_xaollh]: input[_OLLHS],
    [_xaebo]: input[_EBO],
    ...input.Metadata !== void 0 && Object.keys(input.Metadata).reduce((acc, suffix) => {
      acc[`x-amz-meta-${suffix.toLowerCase()}`] = input.Metadata[suffix];
      return acc;
    }, {})
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_xi]: [, "PutObject"]
  });
  let body;
  let contents;
  if (input.Body !== void 0) {
    contents = input.Body;
    body = contents;
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutObjectAclCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_xaa]: input[_ACL],
    [_cm]: input[_CMD],
    [_xasca]: input[_CA],
    [_xagfc]: input[_GFC],
    [_xagr]: input[_GR],
    [_xagra]: input[_GRACP],
    [_xagw]: input[_GW],
    [_xagwa]: input[_GWACP],
    [_xarp]: input[_RP],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_acl]: [, ""],
    [_vI]: [, input[_VI]]
  });
  let body;
  let contents;
  if (input.AccessControlPolicy !== void 0) {
    contents = se_AccessControlPolicy(input.AccessControlPolicy, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutObjectLegalHoldCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_xarp]: input[_RP],
    [_cm]: input[_CMD],
    [_xasca]: input[_CA],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_lh]: [, ""],
    [_vI]: [, input[_VI]]
  });
  let body;
  let contents;
  if (input.LegalHold !== void 0) {
    contents = se_ObjectLockLegalHold(input.LegalHold, context);
    contents = contents.n("LegalHold");
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutObjectLockConfigurationCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_xarp]: input[_RP],
    [_xabolt]: input[_To],
    [_cm]: input[_CMD],
    [_xasca]: input[_CA],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_ol]: [, ""]
  });
  let body;
  let contents;
  if (input.ObjectLockConfiguration !== void 0) {
    contents = se_ObjectLockConfiguration(input.ObjectLockConfiguration, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutObjectRetentionCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_xarp]: input[_RP],
    [_xabgr]: [() => isSerializableHeaderValue(input[_BGR]), () => input[_BGR].toString()],
    [_cm]: input[_CMD],
    [_xasca]: input[_CA],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_ret]: [, ""],
    [_vI]: [, input[_VI]]
  });
  let body;
  let contents;
  if (input.Retention !== void 0) {
    contents = se_ObjectLockRetention(input.Retention, context);
    contents = contents.n("Retention");
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutObjectTaggingCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_cm]: input[_CMD],
    [_xasca]: input[_CA],
    [_xaebo]: input[_EBO],
    [_xarp]: input[_RP]
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_t]: [, ""],
    [_vI]: [, input[_VI]]
  });
  let body;
  let contents;
  if (input.Tagging !== void 0) {
    contents = se_Tagging(input.Tagging, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_PutPublicAccessBlockCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_cm]: input[_CMD],
    [_xasca]: input[_CA],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  const query = map({
    [_pAB]: [, ""]
  });
  let body;
  let contents;
  if (input.PublicAccessBlockConfiguration !== void 0) {
    contents = se_PublicAccessBlockConfiguration(input.PublicAccessBlockConfiguration, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_RestoreObjectCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_xarp]: input[_RP],
    [_xasca]: input[_CA],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_res]: [, ""],
    [_vI]: [, input[_VI]]
  });
  let body;
  let contents;
  if (input.RestoreRequest !== void 0) {
    contents = se_RestoreRequest(input.RestoreRequest, context);
    body = _ve;
    contents.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
    body += contents.toString();
  }
  b2.m("POST").h(headers).q(query).b(body);
  return b2.build();
};
var se_SelectObjectContentCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/xml",
    [_xasseca]: input[_SSECA],
    [_xasseck]: input[_SSECK],
    [_xasseckm]: input[_SSECKMD],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_se]: [, ""],
    [_st]: [, "2"]
  });
  let body;
  body = _ve;
  const bn2 = new XmlNode(_SOCR);
  bn2.a("xmlns", "http://s3.amazonaws.com/doc/2006-03-01/");
  bn2.cc(input, _Ex);
  bn2.cc(input, _ETx);
  if (input[_IS] != null) {
    bn2.c(se_InputSerialization(input[_IS], context).n(_IS));
  }
  if (input[_OS] != null) {
    bn2.c(se_OutputSerialization(input[_OS], context).n(_OS));
  }
  if (input[_RPe] != null) {
    bn2.c(se_RequestProgress(input[_RPe], context).n(_RPe));
  }
  if (input[_SR] != null) {
    bn2.c(se_ScanRange(input[_SR], context).n(_SR));
  }
  body += bn2.toString();
  b2.m("POST").h(headers).q(query).b(body);
  return b2.build();
};
var se_UploadPartCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "content-type": "application/octet-stream",
    [_cl_]: [() => isSerializableHeaderValue(input[_CLo]), () => input[_CLo].toString()],
    [_cm]: input[_CMD],
    [_xasca]: input[_CA],
    [_xacc]: input[_CCRC],
    [_xacc_]: input[_CCRCC],
    [_xacc__]: input[_CCRCNVME],
    [_xacs]: input[_CSHA],
    [_xacs_]: input[_CSHAh],
    [_xasseca]: input[_SSECA],
    [_xasseck]: input[_SSECK],
    [_xasseckm]: input[_SSECKMD],
    [_xarp]: input[_RP],
    [_xaebo]: input[_EBO]
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_xi]: [, "UploadPart"],
    [_pN]: [expectNonNull(input.PartNumber, `PartNumber`) != null, () => input[_PN].toString()],
    [_uI]: [, expectNonNull(input[_UI], `UploadId`)]
  });
  let body;
  let contents;
  if (input.Body !== void 0) {
    contents = input.Body;
    body = contents;
  }
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_UploadPartCopyCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    [_xacs__]: input[_CS],
    [_xacsim]: input[_CSIM],
    [_xacsims]: [() => isSerializableHeaderValue(input[_CSIMS]), () => dateToUtcString(input[_CSIMS]).toString()],
    [_xacsinm]: input[_CSINM],
    [_xacsius]: [() => isSerializableHeaderValue(input[_CSIUS]), () => dateToUtcString(input[_CSIUS]).toString()],
    [_xacsr]: input[_CSR],
    [_xasseca]: input[_SSECA],
    [_xasseck]: input[_SSECK],
    [_xasseckm]: input[_SSECKMD],
    [_xacssseca]: input[_CSSSECA],
    [_xacssseck]: input[_CSSSECK],
    [_xacssseckm]: input[_CSSSECKMD],
    [_xarp]: input[_RP],
    [_xaebo]: input[_EBO],
    [_xasebo]: input[_ESBO]
  });
  b2.bp("/{Key+}");
  b2.p("Bucket", () => input.Bucket, "{Bucket}", false);
  b2.p("Key", () => input.Key, "{Key+}", true);
  const query = map({
    [_xi]: [, "UploadPartCopy"],
    [_pN]: [expectNonNull(input.PartNumber, `PartNumber`) != null, () => input[_PN].toString()],
    [_uI]: [, expectNonNull(input[_UI], `UploadId`)]
  });
  let body;
  b2.m("PUT").h(headers).q(query).b(body);
  return b2.build();
};
var se_WriteGetObjectResponseCommand = async (input, context) => {
  const b2 = requestBuilder(input, context);
  const headers = map({}, isSerializableHeaderValue, {
    "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
    "content-type": "application/octet-stream",
    [_xarr]: input[_RR],
    [_xart]: input[_RT],
    [_xafs]: [() => isSerializableHeaderValue(input[_SCt]), () => input[_SCt].toString()],
    [_xafec]: input[_EC],
    [_xafem]: input[_EM],
    [_xafhar]: input[_AR],
    [_xafhcc]: input[_CC],
    [_xafhcd]: input[_CD],
    [_xafhce]: input[_CE],
    [_xafhcl]: input[_CL],
    [_cl_]: [() => isSerializableHeaderValue(input[_CLo]), () => input[_CLo].toString()],
    [_xafhcr]: input[_CR],
    [_xafhct]: input[_CTo],
    [_xafhxacc]: input[_CCRC],
    [_xafhxacc_]: input[_CCRCC],
    [_xafhxacc__]: input[_CCRCNVME],
    [_xafhxacs]: input[_CSHA],
    [_xafhxacs_]: input[_CSHAh],
    [_xafhxadm]: [() => isSerializableHeaderValue(input[_DM]), () => input[_DM].toString()],
    [_xafhe]: input[_ETa],
    [_xafhe_]: [() => isSerializableHeaderValue(input[_E]), () => dateToUtcString(input[_E]).toString()],
    [_xafhxae]: input[_Exp],
    [_xafhlm]: [() => isSerializableHeaderValue(input[_LM]), () => dateToUtcString(input[_LM]).toString()],
    [_xafhxamm]: [() => isSerializableHeaderValue(input[_MM]), () => input[_MM].toString()],
    [_xafhxaolm]: input[_OLM],
    [_xafhxaollh]: input[_OLLHS],
    [_xafhxaolrud]: [
      () => isSerializableHeaderValue(input[_OLRUD]),
      () => serializeDateTime(input[_OLRUD]).toString()
    ],
    [_xafhxampc]: [() => isSerializableHeaderValue(input[_PC]), () => input[_PC].toString()],
    [_xafhxars]: input[_RS],
    [_xafhxarc]: input[_RC],
    [_xafhxar]: input[_Re],
    [_xafhxasse]: input[_SSE],
    [_xafhxasseca]: input[_SSECA],
    [_xafhxasseakki]: input[_SSEKMSKI],
    [_xafhxasseckm]: input[_SSECKMD],
    [_xafhxasc]: input[_SC],
    [_xafhxatc]: [() => isSerializableHeaderValue(input[_TC]), () => input[_TC].toString()],
    [_xafhxavi]: input[_VI],
    [_xafhxassebke]: [() => isSerializableHeaderValue(input[_BKE]), () => input[_BKE].toString()],
    ...input.Metadata !== void 0 && Object.keys(input.Metadata).reduce((acc, suffix) => {
      acc[`x-amz-meta-${suffix.toLowerCase()}`] = input.Metadata[suffix];
      return acc;
    }, {})
  });
  b2.bp("/WriteGetObjectResponse");
  let body;
  let contents;
  if (input.Body !== void 0) {
    contents = input.Body;
    body = contents;
  }
  let { hostname: resolvedHostname } = await context.endpoint();
  if (context.disableHostPrefix !== true) {
    resolvedHostname = "{RequestRoute}." + resolvedHostname;
    if (input.RequestRoute === void 0) {
      throw new Error("Empty value provided for input host prefix: RequestRoute.");
    }
    resolvedHostname = resolvedHostname.replace("{RequestRoute}", input.RequestRoute);
    if (!isValidHostname(resolvedHostname)) {
      throw new Error("ValidationError: prefixed hostname must be hostname compatible.");
    }
  }
  b2.hn(resolvedHostname);
  b2.m("POST").h(headers).b(body);
  return b2.build();
};
var de_AbortMultipartUploadCommand = async (output, context) => {
  if (output.statusCode !== 204 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_RC]: [, output.headers[_xarc]]
  });
  await collectBody(output.body, context);
  return contents;
};
var de_CompleteMultipartUploadCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_Exp]: [, output.headers[_xae]],
    [_SSE]: [, output.headers[_xasse]],
    [_VI]: [, output.headers[_xavi]],
    [_SSEKMSKI]: [, output.headers[_xasseakki]],
    [_BKE]: [() => void 0 !== output.headers[_xassebke], () => parseBoolean(output.headers[_xassebke])],
    [_RC]: [, output.headers[_xarc]]
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data[_B] != null) {
    contents[_B] = expectString(data[_B]);
  }
  if (data[_CCRC] != null) {
    contents[_CCRC] = expectString(data[_CCRC]);
  }
  if (data[_CCRCC] != null) {
    contents[_CCRCC] = expectString(data[_CCRCC]);
  }
  if (data[_CCRCNVME] != null) {
    contents[_CCRCNVME] = expectString(data[_CCRCNVME]);
  }
  if (data[_CSHA] != null) {
    contents[_CSHA] = expectString(data[_CSHA]);
  }
  if (data[_CSHAh] != null) {
    contents[_CSHAh] = expectString(data[_CSHAh]);
  }
  if (data[_CT] != null) {
    contents[_CT] = expectString(data[_CT]);
  }
  if (data[_ETa] != null) {
    contents[_ETa] = expectString(data[_ETa]);
  }
  if (data[_K] != null) {
    contents[_K] = expectString(data[_K]);
  }
  if (data[_L] != null) {
    contents[_L] = expectString(data[_L]);
  }
  return contents;
};
var de_CopyObjectCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_Exp]: [, output.headers[_xae]],
    [_CSVI]: [, output.headers[_xacsvi]],
    [_VI]: [, output.headers[_xavi]],
    [_SSE]: [, output.headers[_xasse]],
    [_SSECA]: [, output.headers[_xasseca]],
    [_SSECKMD]: [, output.headers[_xasseckm]],
    [_SSEKMSKI]: [, output.headers[_xasseakki]],
    [_SSEKMSEC]: [, output.headers[_xassec]],
    [_BKE]: [() => void 0 !== output.headers[_xassebke], () => parseBoolean(output.headers[_xassebke])],
    [_RC]: [, output.headers[_xarc]]
  });
  const data = expectObject(await parseXmlBody(output.body, context));
  contents.CopyObjectResult = de_CopyObjectResult(data, context);
  return contents;
};
var de_CreateBucketCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_L]: [, output.headers[_lo]]
  });
  await collectBody(output.body, context);
  return contents;
};
var de_CreateBucketMetadataTableConfigurationCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_CreateMultipartUploadCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_AD]: [
      () => void 0 !== output.headers[_xaad],
      () => expectNonNull(parseRfc7231DateTime(output.headers[_xaad]))
    ],
    [_ARI]: [, output.headers[_xaari]],
    [_SSE]: [, output.headers[_xasse]],
    [_SSECA]: [, output.headers[_xasseca]],
    [_SSECKMD]: [, output.headers[_xasseckm]],
    [_SSEKMSKI]: [, output.headers[_xasseakki]],
    [_SSEKMSEC]: [, output.headers[_xassec]],
    [_BKE]: [() => void 0 !== output.headers[_xassebke], () => parseBoolean(output.headers[_xassebke])],
    [_RC]: [, output.headers[_xarc]],
    [_CA]: [, output.headers[_xaca]],
    [_CT]: [, output.headers[_xact]]
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data[_B] != null) {
    contents[_B] = expectString(data[_B]);
  }
  if (data[_K] != null) {
    contents[_K] = expectString(data[_K]);
  }
  if (data[_UI] != null) {
    contents[_UI] = expectString(data[_UI]);
  }
  return contents;
};
var de_CreateSessionCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_SSE]: [, output.headers[_xasse]],
    [_SSEKMSKI]: [, output.headers[_xasseakki]],
    [_SSEKMSEC]: [, output.headers[_xassec]],
    [_BKE]: [() => void 0 !== output.headers[_xassebke], () => parseBoolean(output.headers[_xassebke])]
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data[_C] != null) {
    contents[_C] = de_SessionCredentials(data[_C], context);
  }
  return contents;
};
var de_DeleteBucketCommand = async (output, context) => {
  if (output.statusCode !== 204 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_DeleteBucketAnalyticsConfigurationCommand = async (output, context) => {
  if (output.statusCode !== 204 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_DeleteBucketCorsCommand = async (output, context) => {
  if (output.statusCode !== 204 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_DeleteBucketEncryptionCommand = async (output, context) => {
  if (output.statusCode !== 204 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_DeleteBucketIntelligentTieringConfigurationCommand = async (output, context) => {
  if (output.statusCode !== 204 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_DeleteBucketInventoryConfigurationCommand = async (output, context) => {
  if (output.statusCode !== 204 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_DeleteBucketLifecycleCommand = async (output, context) => {
  if (output.statusCode !== 204 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_DeleteBucketMetadataTableConfigurationCommand = async (output, context) => {
  if (output.statusCode !== 204 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_DeleteBucketMetricsConfigurationCommand = async (output, context) => {
  if (output.statusCode !== 204 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_DeleteBucketOwnershipControlsCommand = async (output, context) => {
  if (output.statusCode !== 204 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_DeleteBucketPolicyCommand = async (output, context) => {
  if (output.statusCode !== 204 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_DeleteBucketReplicationCommand = async (output, context) => {
  if (output.statusCode !== 204 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_DeleteBucketTaggingCommand = async (output, context) => {
  if (output.statusCode !== 204 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_DeleteBucketWebsiteCommand = async (output, context) => {
  if (output.statusCode !== 204 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_DeleteObjectCommand = async (output, context) => {
  if (output.statusCode !== 204 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_DM]: [() => void 0 !== output.headers[_xadm], () => parseBoolean(output.headers[_xadm])],
    [_VI]: [, output.headers[_xavi]],
    [_RC]: [, output.headers[_xarc]]
  });
  await collectBody(output.body, context);
  return contents;
};
var de_DeleteObjectsCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_RC]: [, output.headers[_xarc]]
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data.Deleted === "") {
    contents[_De] = [];
  } else if (data[_De] != null) {
    contents[_De] = de_DeletedObjects(getArrayIfSingleItem(data[_De]), context);
  }
  if (data.Error === "") {
    contents[_Err] = [];
  } else if (data[_Er] != null) {
    contents[_Err] = de_Errors(getArrayIfSingleItem(data[_Er]), context);
  }
  return contents;
};
var de_DeleteObjectTaggingCommand = async (output, context) => {
  if (output.statusCode !== 204 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_VI]: [, output.headers[_xavi]]
  });
  await collectBody(output.body, context);
  return contents;
};
var de_DeletePublicAccessBlockCommand = async (output, context) => {
  if (output.statusCode !== 204 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_GetBucketAccelerateConfigurationCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_RC]: [, output.headers[_xarc]]
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data[_S] != null) {
    contents[_S] = expectString(data[_S]);
  }
  return contents;
};
var de_GetBucketAclCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data.AccessControlList === "") {
    contents[_Gr] = [];
  } else if (data[_ACLc] != null && data[_ACLc][_G] != null) {
    contents[_Gr] = de_Grants(getArrayIfSingleItem(data[_ACLc][_G]), context);
  }
  if (data[_O] != null) {
    contents[_O] = de_Owner(data[_O], context);
  }
  return contents;
};
var de_GetBucketAnalyticsConfigurationCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectObject(await parseXmlBody(output.body, context));
  contents.AnalyticsConfiguration = de_AnalyticsConfiguration(data, context);
  return contents;
};
var de_GetBucketCorsCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data.CORSRule === "") {
    contents[_CORSRu] = [];
  } else if (data[_CORSR] != null) {
    contents[_CORSRu] = de_CORSRules(getArrayIfSingleItem(data[_CORSR]), context);
  }
  return contents;
};
var de_GetBucketEncryptionCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectObject(await parseXmlBody(output.body, context));
  contents.ServerSideEncryptionConfiguration = de_ServerSideEncryptionConfiguration(data, context);
  return contents;
};
var de_GetBucketIntelligentTieringConfigurationCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectObject(await parseXmlBody(output.body, context));
  contents.IntelligentTieringConfiguration = de_IntelligentTieringConfiguration(data, context);
  return contents;
};
var de_GetBucketInventoryConfigurationCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectObject(await parseXmlBody(output.body, context));
  contents.InventoryConfiguration = de_InventoryConfiguration(data, context);
  return contents;
};
var de_GetBucketLifecycleConfigurationCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_TDMOS]: [, output.headers[_xatdmos]]
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data.Rule === "") {
    contents[_Rul] = [];
  } else if (data[_Ru] != null) {
    contents[_Rul] = de_LifecycleRules(getArrayIfSingleItem(data[_Ru]), context);
  }
  return contents;
};
var de_GetBucketLocationCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data[_LC] != null) {
    contents[_LC] = expectString(data[_LC]);
  }
  return contents;
};
var de_GetBucketLoggingCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data[_LE] != null) {
    contents[_LE] = de_LoggingEnabled(data[_LE], context);
  }
  return contents;
};
var de_GetBucketMetadataTableConfigurationCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectObject(await parseXmlBody(output.body, context));
  contents.GetBucketMetadataTableConfigurationResult = de_GetBucketMetadataTableConfigurationResult(data, context);
  return contents;
};
var de_GetBucketMetricsConfigurationCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectObject(await parseXmlBody(output.body, context));
  contents.MetricsConfiguration = de_MetricsConfiguration(data, context);
  return contents;
};
var de_GetBucketNotificationConfigurationCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data[_EBC] != null) {
    contents[_EBC] = de_EventBridgeConfiguration(data[_EBC], context);
  }
  if (data.CloudFunctionConfiguration === "") {
    contents[_LFC] = [];
  } else if (data[_CFC] != null) {
    contents[_LFC] = de_LambdaFunctionConfigurationList(getArrayIfSingleItem(data[_CFC]), context);
  }
  if (data.QueueConfiguration === "") {
    contents[_QCu] = [];
  } else if (data[_QC] != null) {
    contents[_QCu] = de_QueueConfigurationList(getArrayIfSingleItem(data[_QC]), context);
  }
  if (data.TopicConfiguration === "") {
    contents[_TCop] = [];
  } else if (data[_TCo] != null) {
    contents[_TCop] = de_TopicConfigurationList(getArrayIfSingleItem(data[_TCo]), context);
  }
  return contents;
};
var de_GetBucketOwnershipControlsCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectObject(await parseXmlBody(output.body, context));
  contents.OwnershipControls = de_OwnershipControls(data, context);
  return contents;
};
var de_GetBucketPolicyCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = await collectBodyString(output.body, context);
  contents.Policy = expectString(data);
  return contents;
};
var de_GetBucketPolicyStatusCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectObject(await parseXmlBody(output.body, context));
  contents.PolicyStatus = de_PolicyStatus(data, context);
  return contents;
};
var de_GetBucketReplicationCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectObject(await parseXmlBody(output.body, context));
  contents.ReplicationConfiguration = de_ReplicationConfiguration(data, context);
  return contents;
};
var de_GetBucketRequestPaymentCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data[_Pa] != null) {
    contents[_Pa] = expectString(data[_Pa]);
  }
  return contents;
};
var de_GetBucketTaggingCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data.TagSet === "") {
    contents[_TS] = [];
  } else if (data[_TS] != null && data[_TS][_Ta] != null) {
    contents[_TS] = de_TagSet(getArrayIfSingleItem(data[_TS][_Ta]), context);
  }
  return contents;
};
var de_GetBucketVersioningCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data[_MDf] != null) {
    contents[_MFAD] = expectString(data[_MDf]);
  }
  if (data[_S] != null) {
    contents[_S] = expectString(data[_S]);
  }
  return contents;
};
var de_GetBucketWebsiteCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data[_ED] != null) {
    contents[_ED] = de_ErrorDocument(data[_ED], context);
  }
  if (data[_ID] != null) {
    contents[_ID] = de_IndexDocument(data[_ID], context);
  }
  if (data[_RART] != null) {
    contents[_RART] = de_RedirectAllRequestsTo(data[_RART], context);
  }
  if (data.RoutingRules === "") {
    contents[_RRo] = [];
  } else if (data[_RRo] != null && data[_RRo][_RRou] != null) {
    contents[_RRo] = de_RoutingRules(getArrayIfSingleItem(data[_RRo][_RRou]), context);
  }
  return contents;
};
var de_GetObjectCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_DM]: [() => void 0 !== output.headers[_xadm], () => parseBoolean(output.headers[_xadm])],
    [_AR]: [, output.headers[_ar]],
    [_Exp]: [, output.headers[_xae]],
    [_Re]: [, output.headers[_xar]],
    [_LM]: [() => void 0 !== output.headers[_lm], () => expectNonNull(parseRfc7231DateTime(output.headers[_lm]))],
    [_CLo]: [() => void 0 !== output.headers[_cl_], () => strictParseLong(output.headers[_cl_])],
    [_ETa]: [, output.headers[_eta]],
    [_CCRC]: [, output.headers[_xacc]],
    [_CCRCC]: [, output.headers[_xacc_]],
    [_CCRCNVME]: [, output.headers[_xacc__]],
    [_CSHA]: [, output.headers[_xacs]],
    [_CSHAh]: [, output.headers[_xacs_]],
    [_CT]: [, output.headers[_xact]],
    [_MM]: [() => void 0 !== output.headers[_xamm], () => strictParseInt32(output.headers[_xamm])],
    [_VI]: [, output.headers[_xavi]],
    [_CC]: [, output.headers[_cc]],
    [_CD]: [, output.headers[_cd]],
    [_CE]: [, output.headers[_ce]],
    [_CL]: [, output.headers[_cl]],
    [_CR]: [, output.headers[_cr]],
    [_CTo]: [, output.headers[_ct]],
    [_E]: [() => void 0 !== output.headers[_e], () => expectNonNull(parseRfc7231DateTime(output.headers[_e]))],
    [_ES]: [, output.headers[_ex]],
    [_WRL]: [, output.headers[_xawrl]],
    [_SSE]: [, output.headers[_xasse]],
    [_SSECA]: [, output.headers[_xasseca]],
    [_SSECKMD]: [, output.headers[_xasseckm]],
    [_SSEKMSKI]: [, output.headers[_xasseakki]],
    [_BKE]: [() => void 0 !== output.headers[_xassebke], () => parseBoolean(output.headers[_xassebke])],
    [_SC]: [, output.headers[_xasc]],
    [_RC]: [, output.headers[_xarc]],
    [_RS]: [, output.headers[_xars]],
    [_PC]: [() => void 0 !== output.headers[_xampc], () => strictParseInt32(output.headers[_xampc])],
    [_TC]: [() => void 0 !== output.headers[_xatc], () => strictParseInt32(output.headers[_xatc])],
    [_OLM]: [, output.headers[_xaolm]],
    [_OLRUD]: [
      () => void 0 !== output.headers[_xaolrud],
      () => expectNonNull(parseRfc3339DateTimeWithOffset(output.headers[_xaolrud]))
    ],
    [_OLLHS]: [, output.headers[_xaollh]],
    Metadata: [
      ,
      Object.keys(output.headers).filter((header) => header.startsWith("x-amz-meta-")).reduce((acc, header) => {
        acc[header.substring(11)] = output.headers[header];
        return acc;
      }, {})
    ]
  });
  const data = output.body;
  context.sdkStreamMixin(data);
  contents.Body = data;
  return contents;
};
var de_GetObjectAclCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_RC]: [, output.headers[_xarc]]
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data.AccessControlList === "") {
    contents[_Gr] = [];
  } else if (data[_ACLc] != null && data[_ACLc][_G] != null) {
    contents[_Gr] = de_Grants(getArrayIfSingleItem(data[_ACLc][_G]), context);
  }
  if (data[_O] != null) {
    contents[_O] = de_Owner(data[_O], context);
  }
  return contents;
};
var de_GetObjectAttributesCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_DM]: [() => void 0 !== output.headers[_xadm], () => parseBoolean(output.headers[_xadm])],
    [_LM]: [() => void 0 !== output.headers[_lm], () => expectNonNull(parseRfc7231DateTime(output.headers[_lm]))],
    [_VI]: [, output.headers[_xavi]],
    [_RC]: [, output.headers[_xarc]]
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data[_Ch] != null) {
    contents[_Ch] = de_Checksum(data[_Ch], context);
  }
  if (data[_ETa] != null) {
    contents[_ETa] = expectString(data[_ETa]);
  }
  if (data[_OP] != null) {
    contents[_OP] = de_GetObjectAttributesParts(data[_OP], context);
  }
  if (data[_OSb] != null) {
    contents[_OSb] = strictParseLong(data[_OSb]);
  }
  if (data[_SC] != null) {
    contents[_SC] = expectString(data[_SC]);
  }
  return contents;
};
var de_GetObjectLegalHoldCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectObject(await parseXmlBody(output.body, context));
  contents.LegalHold = de_ObjectLockLegalHold(data, context);
  return contents;
};
var de_GetObjectLockConfigurationCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectObject(await parseXmlBody(output.body, context));
  contents.ObjectLockConfiguration = de_ObjectLockConfiguration(data, context);
  return contents;
};
var de_GetObjectRetentionCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectObject(await parseXmlBody(output.body, context));
  contents.Retention = de_ObjectLockRetention(data, context);
  return contents;
};
var de_GetObjectTaggingCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_VI]: [, output.headers[_xavi]]
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data.TagSet === "") {
    contents[_TS] = [];
  } else if (data[_TS] != null && data[_TS][_Ta] != null) {
    contents[_TS] = de_TagSet(getArrayIfSingleItem(data[_TS][_Ta]), context);
  }
  return contents;
};
var de_GetObjectTorrentCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_RC]: [, output.headers[_xarc]]
  });
  const data = output.body;
  context.sdkStreamMixin(data);
  contents.Body = data;
  return contents;
};
var de_GetPublicAccessBlockCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectObject(await parseXmlBody(output.body, context));
  contents.PublicAccessBlockConfiguration = de_PublicAccessBlockConfiguration(data, context);
  return contents;
};
var de_HeadBucketCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_BLT]: [, output.headers[_xablt]],
    [_BLN]: [, output.headers[_xabln]],
    [_BR]: [, output.headers[_xabr]],
    [_APA]: [() => void 0 !== output.headers[_xaapa], () => parseBoolean(output.headers[_xaapa])]
  });
  await collectBody(output.body, context);
  return contents;
};
var de_HeadObjectCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_DM]: [() => void 0 !== output.headers[_xadm], () => parseBoolean(output.headers[_xadm])],
    [_AR]: [, output.headers[_ar]],
    [_Exp]: [, output.headers[_xae]],
    [_Re]: [, output.headers[_xar]],
    [_AS]: [, output.headers[_xaas]],
    [_LM]: [() => void 0 !== output.headers[_lm], () => expectNonNull(parseRfc7231DateTime(output.headers[_lm]))],
    [_CLo]: [() => void 0 !== output.headers[_cl_], () => strictParseLong(output.headers[_cl_])],
    [_CCRC]: [, output.headers[_xacc]],
    [_CCRCC]: [, output.headers[_xacc_]],
    [_CCRCNVME]: [, output.headers[_xacc__]],
    [_CSHA]: [, output.headers[_xacs]],
    [_CSHAh]: [, output.headers[_xacs_]],
    [_CT]: [, output.headers[_xact]],
    [_ETa]: [, output.headers[_eta]],
    [_MM]: [() => void 0 !== output.headers[_xamm], () => strictParseInt32(output.headers[_xamm])],
    [_VI]: [, output.headers[_xavi]],
    [_CC]: [, output.headers[_cc]],
    [_CD]: [, output.headers[_cd]],
    [_CE]: [, output.headers[_ce]],
    [_CL]: [, output.headers[_cl]],
    [_CTo]: [, output.headers[_ct]],
    [_CR]: [, output.headers[_cr]],
    [_E]: [() => void 0 !== output.headers[_e], () => expectNonNull(parseRfc7231DateTime(output.headers[_e]))],
    [_ES]: [, output.headers[_ex]],
    [_WRL]: [, output.headers[_xawrl]],
    [_SSE]: [, output.headers[_xasse]],
    [_SSECA]: [, output.headers[_xasseca]],
    [_SSECKMD]: [, output.headers[_xasseckm]],
    [_SSEKMSKI]: [, output.headers[_xasseakki]],
    [_BKE]: [() => void 0 !== output.headers[_xassebke], () => parseBoolean(output.headers[_xassebke])],
    [_SC]: [, output.headers[_xasc]],
    [_RC]: [, output.headers[_xarc]],
    [_RS]: [, output.headers[_xars]],
    [_PC]: [() => void 0 !== output.headers[_xampc], () => strictParseInt32(output.headers[_xampc])],
    [_OLM]: [, output.headers[_xaolm]],
    [_OLRUD]: [
      () => void 0 !== output.headers[_xaolrud],
      () => expectNonNull(parseRfc3339DateTimeWithOffset(output.headers[_xaolrud]))
    ],
    [_OLLHS]: [, output.headers[_xaollh]],
    Metadata: [
      ,
      Object.keys(output.headers).filter((header) => header.startsWith("x-amz-meta-")).reduce((acc, header) => {
        acc[header.substring(11)] = output.headers[header];
        return acc;
      }, {})
    ]
  });
  await collectBody(output.body, context);
  return contents;
};
var de_ListBucketAnalyticsConfigurationsCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data.AnalyticsConfiguration === "") {
    contents[_ACLn] = [];
  } else if (data[_AC] != null) {
    contents[_ACLn] = de_AnalyticsConfigurationList(getArrayIfSingleItem(data[_AC]), context);
  }
  if (data[_CTon] != null) {
    contents[_CTon] = expectString(data[_CTon]);
  }
  if (data[_IT] != null) {
    contents[_IT] = parseBoolean(data[_IT]);
  }
  if (data[_NCT] != null) {
    contents[_NCT] = expectString(data[_NCT]);
  }
  return contents;
};
var de_ListBucketIntelligentTieringConfigurationsCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data[_CTon] != null) {
    contents[_CTon] = expectString(data[_CTon]);
  }
  if (data.IntelligentTieringConfiguration === "") {
    contents[_ITCL] = [];
  } else if (data[_ITC] != null) {
    contents[_ITCL] = de_IntelligentTieringConfigurationList(getArrayIfSingleItem(data[_ITC]), context);
  }
  if (data[_IT] != null) {
    contents[_IT] = parseBoolean(data[_IT]);
  }
  if (data[_NCT] != null) {
    contents[_NCT] = expectString(data[_NCT]);
  }
  return contents;
};
var de_ListBucketInventoryConfigurationsCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data[_CTon] != null) {
    contents[_CTon] = expectString(data[_CTon]);
  }
  if (data.InventoryConfiguration === "") {
    contents[_ICL] = [];
  } else if (data[_IC] != null) {
    contents[_ICL] = de_InventoryConfigurationList(getArrayIfSingleItem(data[_IC]), context);
  }
  if (data[_IT] != null) {
    contents[_IT] = parseBoolean(data[_IT]);
  }
  if (data[_NCT] != null) {
    contents[_NCT] = expectString(data[_NCT]);
  }
  return contents;
};
var de_ListBucketMetricsConfigurationsCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data[_CTon] != null) {
    contents[_CTon] = expectString(data[_CTon]);
  }
  if (data[_IT] != null) {
    contents[_IT] = parseBoolean(data[_IT]);
  }
  if (data.MetricsConfiguration === "") {
    contents[_MCL] = [];
  } else if (data[_MC] != null) {
    contents[_MCL] = de_MetricsConfigurationList(getArrayIfSingleItem(data[_MC]), context);
  }
  if (data[_NCT] != null) {
    contents[_NCT] = expectString(data[_NCT]);
  }
  return contents;
};
var de_ListBucketsCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data.Buckets === "") {
    contents[_Bu] = [];
  } else if (data[_Bu] != null && data[_Bu][_B] != null) {
    contents[_Bu] = de_Buckets(getArrayIfSingleItem(data[_Bu][_B]), context);
  }
  if (data[_CTon] != null) {
    contents[_CTon] = expectString(data[_CTon]);
  }
  if (data[_O] != null) {
    contents[_O] = de_Owner(data[_O], context);
  }
  if (data[_P] != null) {
    contents[_P] = expectString(data[_P]);
  }
  return contents;
};
var de_ListDirectoryBucketsCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data.Buckets === "") {
    contents[_Bu] = [];
  } else if (data[_Bu] != null && data[_Bu][_B] != null) {
    contents[_Bu] = de_Buckets(getArrayIfSingleItem(data[_Bu][_B]), context);
  }
  if (data[_CTon] != null) {
    contents[_CTon] = expectString(data[_CTon]);
  }
  return contents;
};
var de_ListMultipartUploadsCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_RC]: [, output.headers[_xarc]]
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data[_B] != null) {
    contents[_B] = expectString(data[_B]);
  }
  if (data.CommonPrefixes === "") {
    contents[_CP] = [];
  } else if (data[_CP] != null) {
    contents[_CP] = de_CommonPrefixList(getArrayIfSingleItem(data[_CP]), context);
  }
  if (data[_D] != null) {
    contents[_D] = expectString(data[_D]);
  }
  if (data[_ET] != null) {
    contents[_ET] = expectString(data[_ET]);
  }
  if (data[_IT] != null) {
    contents[_IT] = parseBoolean(data[_IT]);
  }
  if (data[_KM] != null) {
    contents[_KM] = expectString(data[_KM]);
  }
  if (data[_MU] != null) {
    contents[_MU] = strictParseInt32(data[_MU]);
  }
  if (data[_NKM] != null) {
    contents[_NKM] = expectString(data[_NKM]);
  }
  if (data[_NUIM] != null) {
    contents[_NUIM] = expectString(data[_NUIM]);
  }
  if (data[_P] != null) {
    contents[_P] = expectString(data[_P]);
  }
  if (data[_UIM] != null) {
    contents[_UIM] = expectString(data[_UIM]);
  }
  if (data.Upload === "") {
    contents[_Up] = [];
  } else if (data[_U] != null) {
    contents[_Up] = de_MultipartUploadList(getArrayIfSingleItem(data[_U]), context);
  }
  return contents;
};
var de_ListObjectsCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_RC]: [, output.headers[_xarc]]
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data.CommonPrefixes === "") {
    contents[_CP] = [];
  } else if (data[_CP] != null) {
    contents[_CP] = de_CommonPrefixList(getArrayIfSingleItem(data[_CP]), context);
  }
  if (data.Contents === "") {
    contents[_Co] = [];
  } else if (data[_Co] != null) {
    contents[_Co] = de_ObjectList(getArrayIfSingleItem(data[_Co]), context);
  }
  if (data[_D] != null) {
    contents[_D] = expectString(data[_D]);
  }
  if (data[_ET] != null) {
    contents[_ET] = expectString(data[_ET]);
  }
  if (data[_IT] != null) {
    contents[_IT] = parseBoolean(data[_IT]);
  }
  if (data[_M] != null) {
    contents[_M] = expectString(data[_M]);
  }
  if (data[_MK] != null) {
    contents[_MK] = strictParseInt32(data[_MK]);
  }
  if (data[_N] != null) {
    contents[_N] = expectString(data[_N]);
  }
  if (data[_NM] != null) {
    contents[_NM] = expectString(data[_NM]);
  }
  if (data[_P] != null) {
    contents[_P] = expectString(data[_P]);
  }
  return contents;
};
var de_ListObjectsV2Command = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_RC]: [, output.headers[_xarc]]
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data.CommonPrefixes === "") {
    contents[_CP] = [];
  } else if (data[_CP] != null) {
    contents[_CP] = de_CommonPrefixList(getArrayIfSingleItem(data[_CP]), context);
  }
  if (data.Contents === "") {
    contents[_Co] = [];
  } else if (data[_Co] != null) {
    contents[_Co] = de_ObjectList(getArrayIfSingleItem(data[_Co]), context);
  }
  if (data[_CTon] != null) {
    contents[_CTon] = expectString(data[_CTon]);
  }
  if (data[_D] != null) {
    contents[_D] = expectString(data[_D]);
  }
  if (data[_ET] != null) {
    contents[_ET] = expectString(data[_ET]);
  }
  if (data[_IT] != null) {
    contents[_IT] = parseBoolean(data[_IT]);
  }
  if (data[_KC] != null) {
    contents[_KC] = strictParseInt32(data[_KC]);
  }
  if (data[_MK] != null) {
    contents[_MK] = strictParseInt32(data[_MK]);
  }
  if (data[_N] != null) {
    contents[_N] = expectString(data[_N]);
  }
  if (data[_NCT] != null) {
    contents[_NCT] = expectString(data[_NCT]);
  }
  if (data[_P] != null) {
    contents[_P] = expectString(data[_P]);
  }
  if (data[_SA] != null) {
    contents[_SA] = expectString(data[_SA]);
  }
  return contents;
};
var de_ListObjectVersionsCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_RC]: [, output.headers[_xarc]]
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data.CommonPrefixes === "") {
    contents[_CP] = [];
  } else if (data[_CP] != null) {
    contents[_CP] = de_CommonPrefixList(getArrayIfSingleItem(data[_CP]), context);
  }
  if (data.DeleteMarker === "") {
    contents[_DMe] = [];
  } else if (data[_DM] != null) {
    contents[_DMe] = de_DeleteMarkers(getArrayIfSingleItem(data[_DM]), context);
  }
  if (data[_D] != null) {
    contents[_D] = expectString(data[_D]);
  }
  if (data[_ET] != null) {
    contents[_ET] = expectString(data[_ET]);
  }
  if (data[_IT] != null) {
    contents[_IT] = parseBoolean(data[_IT]);
  }
  if (data[_KM] != null) {
    contents[_KM] = expectString(data[_KM]);
  }
  if (data[_MK] != null) {
    contents[_MK] = strictParseInt32(data[_MK]);
  }
  if (data[_N] != null) {
    contents[_N] = expectString(data[_N]);
  }
  if (data[_NKM] != null) {
    contents[_NKM] = expectString(data[_NKM]);
  }
  if (data[_NVIM] != null) {
    contents[_NVIM] = expectString(data[_NVIM]);
  }
  if (data[_P] != null) {
    contents[_P] = expectString(data[_P]);
  }
  if (data[_VIM] != null) {
    contents[_VIM] = expectString(data[_VIM]);
  }
  if (data.Version === "") {
    contents[_Ve] = [];
  } else if (data[_V] != null) {
    contents[_Ve] = de_ObjectVersionList(getArrayIfSingleItem(data[_V]), context);
  }
  return contents;
};
var de_ListPartsCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_AD]: [
      () => void 0 !== output.headers[_xaad],
      () => expectNonNull(parseRfc7231DateTime(output.headers[_xaad]))
    ],
    [_ARI]: [, output.headers[_xaari]],
    [_RC]: [, output.headers[_xarc]]
  });
  const data = expectNonNull(expectObject(await parseXmlBody(output.body, context)), "body");
  if (data[_B] != null) {
    contents[_B] = expectString(data[_B]);
  }
  if (data[_CA] != null) {
    contents[_CA] = expectString(data[_CA]);
  }
  if (data[_CT] != null) {
    contents[_CT] = expectString(data[_CT]);
  }
  if (data[_In] != null) {
    contents[_In] = de_Initiator(data[_In], context);
  }
  if (data[_IT] != null) {
    contents[_IT] = parseBoolean(data[_IT]);
  }
  if (data[_K] != null) {
    contents[_K] = expectString(data[_K]);
  }
  if (data[_MP] != null) {
    contents[_MP] = strictParseInt32(data[_MP]);
  }
  if (data[_NPNM] != null) {
    contents[_NPNM] = expectString(data[_NPNM]);
  }
  if (data[_O] != null) {
    contents[_O] = de_Owner(data[_O], context);
  }
  if (data[_PNM] != null) {
    contents[_PNM] = expectString(data[_PNM]);
  }
  if (data.Part === "") {
    contents[_Part] = [];
  } else if (data[_Par] != null) {
    contents[_Part] = de_Parts(getArrayIfSingleItem(data[_Par]), context);
  }
  if (data[_SC] != null) {
    contents[_SC] = expectString(data[_SC]);
  }
  if (data[_UI] != null) {
    contents[_UI] = expectString(data[_UI]);
  }
  return contents;
};
var de_PutBucketAccelerateConfigurationCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutBucketAclCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutBucketAnalyticsConfigurationCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutBucketCorsCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutBucketEncryptionCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutBucketIntelligentTieringConfigurationCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutBucketInventoryConfigurationCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutBucketLifecycleConfigurationCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_TDMOS]: [, output.headers[_xatdmos]]
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutBucketLoggingCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutBucketMetricsConfigurationCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutBucketNotificationConfigurationCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutBucketOwnershipControlsCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutBucketPolicyCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutBucketReplicationCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutBucketRequestPaymentCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutBucketTaggingCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutBucketVersioningCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutBucketWebsiteCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutObjectCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_Exp]: [, output.headers[_xae]],
    [_ETa]: [, output.headers[_eta]],
    [_CCRC]: [, output.headers[_xacc]],
    [_CCRCC]: [, output.headers[_xacc_]],
    [_CCRCNVME]: [, output.headers[_xacc__]],
    [_CSHA]: [, output.headers[_xacs]],
    [_CSHAh]: [, output.headers[_xacs_]],
    [_CT]: [, output.headers[_xact]],
    [_SSE]: [, output.headers[_xasse]],
    [_VI]: [, output.headers[_xavi]],
    [_SSECA]: [, output.headers[_xasseca]],
    [_SSECKMD]: [, output.headers[_xasseckm]],
    [_SSEKMSKI]: [, output.headers[_xasseakki]],
    [_SSEKMSEC]: [, output.headers[_xassec]],
    [_BKE]: [() => void 0 !== output.headers[_xassebke], () => parseBoolean(output.headers[_xassebke])],
    [_Si]: [() => void 0 !== output.headers[_xaos], () => strictParseLong(output.headers[_xaos])],
    [_RC]: [, output.headers[_xarc]]
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutObjectAclCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_RC]: [, output.headers[_xarc]]
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutObjectLegalHoldCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_RC]: [, output.headers[_xarc]]
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutObjectLockConfigurationCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_RC]: [, output.headers[_xarc]]
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutObjectRetentionCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_RC]: [, output.headers[_xarc]]
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutObjectTaggingCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_VI]: [, output.headers[_xavi]]
  });
  await collectBody(output.body, context);
  return contents;
};
var de_PutPublicAccessBlockCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_RestoreObjectCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_RC]: [, output.headers[_xarc]],
    [_ROP]: [, output.headers[_xarop]]
  });
  await collectBody(output.body, context);
  return contents;
};
var de_SelectObjectContentCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  const data = output.body;
  contents.Payload = de_SelectObjectContentEventStream(data, context);
  return contents;
};
var de_UploadPartCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_SSE]: [, output.headers[_xasse]],
    [_ETa]: [, output.headers[_eta]],
    [_CCRC]: [, output.headers[_xacc]],
    [_CCRCC]: [, output.headers[_xacc_]],
    [_CCRCNVME]: [, output.headers[_xacc__]],
    [_CSHA]: [, output.headers[_xacs]],
    [_CSHAh]: [, output.headers[_xacs_]],
    [_SSECA]: [, output.headers[_xasseca]],
    [_SSECKMD]: [, output.headers[_xasseckm]],
    [_SSEKMSKI]: [, output.headers[_xasseakki]],
    [_BKE]: [() => void 0 !== output.headers[_xassebke], () => parseBoolean(output.headers[_xassebke])],
    [_RC]: [, output.headers[_xarc]]
  });
  await collectBody(output.body, context);
  return contents;
};
var de_UploadPartCopyCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output),
    [_CSVI]: [, output.headers[_xacsvi]],
    [_SSE]: [, output.headers[_xasse]],
    [_SSECA]: [, output.headers[_xasseca]],
    [_SSECKMD]: [, output.headers[_xasseckm]],
    [_SSEKMSKI]: [, output.headers[_xasseakki]],
    [_BKE]: [() => void 0 !== output.headers[_xassebke], () => parseBoolean(output.headers[_xassebke])],
    [_RC]: [, output.headers[_xarc]]
  });
  const data = expectObject(await parseXmlBody(output.body, context));
  contents.CopyPartResult = de_CopyPartResult(data, context);
  return contents;
};
var de_WriteGetObjectResponseCommand = async (output, context) => {
  if (output.statusCode !== 200 && output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const contents = map({
    $metadata: deserializeMetadata(output)
  });
  await collectBody(output.body, context);
  return contents;
};
var de_CommandError = async (output, context) => {
  const parsedOutput = {
    ...output,
    body: await parseXmlErrorBody(output.body, context)
  };
  const errorCode = loadRestXmlErrorCode(output, parsedOutput.body);
  switch (errorCode) {
    case "NoSuchUpload":
    case "com.amazonaws.s3#NoSuchUpload":
      throw await de_NoSuchUploadRes(parsedOutput, context);
    case "ObjectNotInActiveTierError":
    case "com.amazonaws.s3#ObjectNotInActiveTierError":
      throw await de_ObjectNotInActiveTierErrorRes(parsedOutput, context);
    case "BucketAlreadyExists":
    case "com.amazonaws.s3#BucketAlreadyExists":
      throw await de_BucketAlreadyExistsRes(parsedOutput, context);
    case "BucketAlreadyOwnedByYou":
    case "com.amazonaws.s3#BucketAlreadyOwnedByYou":
      throw await de_BucketAlreadyOwnedByYouRes(parsedOutput, context);
    case "NoSuchBucket":
    case "com.amazonaws.s3#NoSuchBucket":
      throw await de_NoSuchBucketRes(parsedOutput, context);
    case "InvalidObjectState":
    case "com.amazonaws.s3#InvalidObjectState":
      throw await de_InvalidObjectStateRes(parsedOutput, context);
    case "NoSuchKey":
    case "com.amazonaws.s3#NoSuchKey":
      throw await de_NoSuchKeyRes(parsedOutput, context);
    case "NotFound":
    case "com.amazonaws.s3#NotFound":
      throw await de_NotFoundRes(parsedOutput, context);
    case "EncryptionTypeMismatch":
    case "com.amazonaws.s3#EncryptionTypeMismatch":
      throw await de_EncryptionTypeMismatchRes(parsedOutput, context);
    case "InvalidRequest":
    case "com.amazonaws.s3#InvalidRequest":
      throw await de_InvalidRequestRes(parsedOutput, context);
    case "InvalidWriteOffset":
    case "com.amazonaws.s3#InvalidWriteOffset":
      throw await de_InvalidWriteOffsetRes(parsedOutput, context);
    case "TooManyParts":
    case "com.amazonaws.s3#TooManyParts":
      throw await de_TooManyPartsRes(parsedOutput, context);
    case "ObjectAlreadyInActiveTierError":
    case "com.amazonaws.s3#ObjectAlreadyInActiveTierError":
      throw await de_ObjectAlreadyInActiveTierErrorRes(parsedOutput, context);
    default:
      const parsedBody = parsedOutput.body;
      return throwDefaultError({
        output,
        parsedBody,
        errorCode
      });
  }
};
var throwDefaultError = withBaseException(S3ServiceException);
var de_BucketAlreadyExistsRes = async (parsedOutput, context) => {
  const contents = map({});
  const data = parsedOutput.body;
  const exception = new BucketAlreadyExists({
    $metadata: deserializeMetadata(parsedOutput),
    ...contents
  });
  return decorateServiceException(exception, parsedOutput.body);
};
var de_BucketAlreadyOwnedByYouRes = async (parsedOutput, context) => {
  const contents = map({});
  const data = parsedOutput.body;
  const exception = new BucketAlreadyOwnedByYou({
    $metadata: deserializeMetadata(parsedOutput),
    ...contents
  });
  return decorateServiceException(exception, parsedOutput.body);
};
var de_EncryptionTypeMismatchRes = async (parsedOutput, context) => {
  const contents = map({});
  const data = parsedOutput.body;
  const exception = new EncryptionTypeMismatch({
    $metadata: deserializeMetadata(parsedOutput),
    ...contents
  });
  return decorateServiceException(exception, parsedOutput.body);
};
var de_InvalidObjectStateRes = async (parsedOutput, context) => {
  const contents = map({});
  const data = parsedOutput.body;
  if (data[_AT] != null) {
    contents[_AT] = expectString(data[_AT]);
  }
  if (data[_SC] != null) {
    contents[_SC] = expectString(data[_SC]);
  }
  const exception = new InvalidObjectState({
    $metadata: deserializeMetadata(parsedOutput),
    ...contents
  });
  return decorateServiceException(exception, parsedOutput.body);
};
var de_InvalidRequestRes = async (parsedOutput, context) => {
  const contents = map({});
  const data = parsedOutput.body;
  const exception = new InvalidRequest({
    $metadata: deserializeMetadata(parsedOutput),
    ...contents
  });
  return decorateServiceException(exception, parsedOutput.body);
};
var de_InvalidWriteOffsetRes = async (parsedOutput, context) => {
  const contents = map({});
  const data = parsedOutput.body;
  const exception = new InvalidWriteOffset({
    $metadata: deserializeMetadata(parsedOutput),
    ...contents
  });
  return decorateServiceException(exception, parsedOutput.body);
};
var de_NoSuchBucketRes = async (parsedOutput, context) => {
  const contents = map({});
  const data = parsedOutput.body;
  const exception = new NoSuchBucket({
    $metadata: deserializeMetadata(parsedOutput),
    ...contents
  });
  return decorateServiceException(exception, parsedOutput.body);
};
var de_NoSuchKeyRes = async (parsedOutput, context) => {
  const contents = map({});
  const data = parsedOutput.body;
  const exception = new NoSuchKey({
    $metadata: deserializeMetadata(parsedOutput),
    ...contents
  });
  return decorateServiceException(exception, parsedOutput.body);
};
var de_NoSuchUploadRes = async (parsedOutput, context) => {
  const contents = map({});
  const data = parsedOutput.body;
  const exception = new NoSuchUpload({
    $metadata: deserializeMetadata(parsedOutput),
    ...contents
  });
  return decorateServiceException(exception, parsedOutput.body);
};
var de_NotFoundRes = async (parsedOutput, context) => {
  const contents = map({});
  const data = parsedOutput.body;
  const exception = new NotFound({
    $metadata: deserializeMetadata(parsedOutput),
    ...contents
  });
  return decorateServiceException(exception, parsedOutput.body);
};
var de_ObjectAlreadyInActiveTierErrorRes = async (parsedOutput, context) => {
  const contents = map({});
  const data = parsedOutput.body;
  const exception = new ObjectAlreadyInActiveTierError({
    $metadata: deserializeMetadata(parsedOutput),
    ...contents
  });
  return decorateServiceException(exception, parsedOutput.body);
};
var de_ObjectNotInActiveTierErrorRes = async (parsedOutput, context) => {
  const contents = map({});
  const data = parsedOutput.body;
  const exception = new ObjectNotInActiveTierError({
    $metadata: deserializeMetadata(parsedOutput),
    ...contents
  });
  return decorateServiceException(exception, parsedOutput.body);
};
var de_TooManyPartsRes = async (parsedOutput, context) => {
  const contents = map({});
  const data = parsedOutput.body;
  const exception = new TooManyParts({
    $metadata: deserializeMetadata(parsedOutput),
    ...contents
  });
  return decorateServiceException(exception, parsedOutput.body);
};
var de_SelectObjectContentEventStream = (output, context) => {
  return context.eventStreamMarshaller.deserialize(output, async (event) => {
    if (event["Records"] != null) {
      return {
        Records: await de_RecordsEvent_event(event["Records"], context)
      };
    }
    if (event["Stats"] != null) {
      return {
        Stats: await de_StatsEvent_event(event["Stats"], context)
      };
    }
    if (event["Progress"] != null) {
      return {
        Progress: await de_ProgressEvent_event(event["Progress"], context)
      };
    }
    if (event["Cont"] != null) {
      return {
        Cont: await de_ContinuationEvent_event(event["Cont"], context)
      };
    }
    if (event["End"] != null) {
      return {
        End: await de_EndEvent_event(event["End"], context)
      };
    }
    return { $unknown: output };
  });
};
var de_ContinuationEvent_event = async (output, context) => {
  const contents = {};
  const data = await parseXmlBody(output.body, context);
  Object.assign(contents, de_ContinuationEvent(data, context));
  return contents;
};
var de_EndEvent_event = async (output, context) => {
  const contents = {};
  const data = await parseXmlBody(output.body, context);
  Object.assign(contents, de_EndEvent(data, context));
  return contents;
};
var de_ProgressEvent_event = async (output, context) => {
  const contents = {};
  const data = await parseXmlBody(output.body, context);
  contents.Details = de_Progress(data, context);
  return contents;
};
var de_RecordsEvent_event = async (output, context) => {
  const contents = {};
  contents.Payload = output.body;
  return contents;
};
var de_StatsEvent_event = async (output, context) => {
  const contents = {};
  const data = await parseXmlBody(output.body, context);
  contents.Details = de_Stats(data, context);
  return contents;
};
var se_AbortIncompleteMultipartUpload = (input, context) => {
  const bn2 = new XmlNode(_AIMU);
  if (input[_DAI] != null) {
    bn2.c(XmlNode.of(_DAI, String(input[_DAI])).n(_DAI));
  }
  return bn2;
};
var se_AccelerateConfiguration = (input, context) => {
  const bn2 = new XmlNode(_ACc);
  if (input[_S] != null) {
    bn2.c(XmlNode.of(_BAS, input[_S]).n(_S));
  }
  return bn2;
};
var se_AccessControlPolicy = (input, context) => {
  const bn2 = new XmlNode(_ACP);
  bn2.lc(input, "Grants", "AccessControlList", () => se_Grants(input[_Gr], context));
  if (input[_O] != null) {
    bn2.c(se_Owner(input[_O], context).n(_O));
  }
  return bn2;
};
var se_AccessControlTranslation = (input, context) => {
  const bn2 = new XmlNode(_ACT);
  if (input[_O] != null) {
    bn2.c(XmlNode.of(_OOw, input[_O]).n(_O));
  }
  return bn2;
};
var se_AllowedHeaders = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = XmlNode.of(_AH, entry);
    return n2.n(_me);
  });
};
var se_AllowedMethods = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = XmlNode.of(_AM, entry);
    return n2.n(_me);
  });
};
var se_AllowedOrigins = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = XmlNode.of(_AO, entry);
    return n2.n(_me);
  });
};
var se_AnalyticsAndOperator = (input, context) => {
  const bn2 = new XmlNode(_AAO);
  bn2.cc(input, _P);
  bn2.l(input, "Tags", "Tag", () => se_TagSet(input[_Tag], context));
  return bn2;
};
var se_AnalyticsConfiguration = (input, context) => {
  const bn2 = new XmlNode(_AC);
  if (input[_I] != null) {
    bn2.c(XmlNode.of(_AI, input[_I]).n(_I));
  }
  if (input[_F] != null) {
    bn2.c(se_AnalyticsFilter(input[_F], context).n(_F));
  }
  if (input[_SCA] != null) {
    bn2.c(se_StorageClassAnalysis(input[_SCA], context).n(_SCA));
  }
  return bn2;
};
var se_AnalyticsExportDestination = (input, context) => {
  const bn2 = new XmlNode(_AED);
  if (input[_SBD] != null) {
    bn2.c(se_AnalyticsS3BucketDestination(input[_SBD], context).n(_SBD));
  }
  return bn2;
};
var se_AnalyticsFilter = (input, context) => {
  const bn2 = new XmlNode(_AF);
  AnalyticsFilter.visit(input, {
    Prefix: (value) => {
      if (input[_P] != null) {
        bn2.c(XmlNode.of(_P, value).n(_P));
      }
    },
    Tag: (value) => {
      if (input[_Ta] != null) {
        bn2.c(se_Tag(value, context).n(_Ta));
      }
    },
    And: (value) => {
      if (input[_A] != null) {
        bn2.c(se_AnalyticsAndOperator(value, context).n(_A));
      }
    },
    _: (name, value) => {
      if (!(value instanceof XmlNode || value instanceof XmlText)) {
        throw new Error("Unable to serialize unknown union members in XML.");
      }
      bn2.c(new XmlNode(name).c(value));
    }
  });
  return bn2;
};
var se_AnalyticsS3BucketDestination = (input, context) => {
  const bn2 = new XmlNode(_ASBD);
  if (input[_Fo] != null) {
    bn2.c(XmlNode.of(_ASEFF, input[_Fo]).n(_Fo));
  }
  if (input[_BAI] != null) {
    bn2.c(XmlNode.of(_AIc, input[_BAI]).n(_BAI));
  }
  if (input[_B] != null) {
    bn2.c(XmlNode.of(_BN, input[_B]).n(_B));
  }
  bn2.cc(input, _P);
  return bn2;
};
var se_BucketInfo = (input, context) => {
  const bn2 = new XmlNode(_BI);
  bn2.cc(input, _DR);
  if (input[_Ty] != null) {
    bn2.c(XmlNode.of(_BT, input[_Ty]).n(_Ty));
  }
  return bn2;
};
var se_BucketLifecycleConfiguration = (input, context) => {
  const bn2 = new XmlNode(_BLC);
  bn2.l(input, "Rules", "Rule", () => se_LifecycleRules(input[_Rul], context));
  return bn2;
};
var se_BucketLoggingStatus = (input, context) => {
  const bn2 = new XmlNode(_BLS);
  if (input[_LE] != null) {
    bn2.c(se_LoggingEnabled(input[_LE], context).n(_LE));
  }
  return bn2;
};
var se_CompletedMultipartUpload = (input, context) => {
  const bn2 = new XmlNode(_CMU);
  bn2.l(input, "Parts", "Part", () => se_CompletedPartList(input[_Part], context));
  return bn2;
};
var se_CompletedPart = (input, context) => {
  const bn2 = new XmlNode(_CPo);
  bn2.cc(input, _ETa);
  bn2.cc(input, _CCRC);
  bn2.cc(input, _CCRCC);
  bn2.cc(input, _CCRCNVME);
  bn2.cc(input, _CSHA);
  bn2.cc(input, _CSHAh);
  if (input[_PN] != null) {
    bn2.c(XmlNode.of(_PN, String(input[_PN])).n(_PN));
  }
  return bn2;
};
var se_CompletedPartList = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = se_CompletedPart(entry, context);
    return n2.n(_me);
  });
};
var se_Condition = (input, context) => {
  const bn2 = new XmlNode(_Con);
  bn2.cc(input, _HECRE);
  bn2.cc(input, _KPE);
  return bn2;
};
var se_CORSConfiguration = (input, context) => {
  const bn2 = new XmlNode(_CORSC);
  bn2.l(input, "CORSRules", "CORSRule", () => se_CORSRules(input[_CORSRu], context));
  return bn2;
};
var se_CORSRule = (input, context) => {
  const bn2 = new XmlNode(_CORSR);
  bn2.cc(input, _ID_);
  bn2.l(input, "AllowedHeaders", "AllowedHeader", () => se_AllowedHeaders(input[_AHl], context));
  bn2.l(input, "AllowedMethods", "AllowedMethod", () => se_AllowedMethods(input[_AMl], context));
  bn2.l(input, "AllowedOrigins", "AllowedOrigin", () => se_AllowedOrigins(input[_AOl], context));
  bn2.l(input, "ExposeHeaders", "ExposeHeader", () => se_ExposeHeaders(input[_EH], context));
  if (input[_MAS] != null) {
    bn2.c(XmlNode.of(_MAS, String(input[_MAS])).n(_MAS));
  }
  return bn2;
};
var se_CORSRules = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = se_CORSRule(entry, context);
    return n2.n(_me);
  });
};
var se_CreateBucketConfiguration = (input, context) => {
  const bn2 = new XmlNode(_CBC);
  if (input[_LC] != null) {
    bn2.c(XmlNode.of(_BLCu, input[_LC]).n(_LC));
  }
  if (input[_L] != null) {
    bn2.c(se_LocationInfo(input[_L], context).n(_L));
  }
  if (input[_B] != null) {
    bn2.c(se_BucketInfo(input[_B], context).n(_B));
  }
  return bn2;
};
var se_CSVInput = (input, context) => {
  const bn2 = new XmlNode(_CSVIn);
  bn2.cc(input, _FHI);
  bn2.cc(input, _Com);
  bn2.cc(input, _QEC);
  bn2.cc(input, _RD);
  bn2.cc(input, _FD);
  bn2.cc(input, _QCuo);
  if (input[_AQRD] != null) {
    bn2.c(XmlNode.of(_AQRD, String(input[_AQRD])).n(_AQRD));
  }
  return bn2;
};
var se_CSVOutput = (input, context) => {
  const bn2 = new XmlNode(_CSVO);
  bn2.cc(input, _QF);
  bn2.cc(input, _QEC);
  bn2.cc(input, _RD);
  bn2.cc(input, _FD);
  bn2.cc(input, _QCuo);
  return bn2;
};
var se_DefaultRetention = (input, context) => {
  const bn2 = new XmlNode(_DRe);
  if (input[_Mo] != null) {
    bn2.c(XmlNode.of(_OLRM, input[_Mo]).n(_Mo));
  }
  if (input[_Da] != null) {
    bn2.c(XmlNode.of(_Da, String(input[_Da])).n(_Da));
  }
  if (input[_Y] != null) {
    bn2.c(XmlNode.of(_Y, String(input[_Y])).n(_Y));
  }
  return bn2;
};
var se_Delete = (input, context) => {
  const bn2 = new XmlNode(_Del);
  bn2.l(input, "Objects", "Object", () => se_ObjectIdentifierList(input[_Ob], context));
  if (input[_Q] != null) {
    bn2.c(XmlNode.of(_Q, String(input[_Q])).n(_Q));
  }
  return bn2;
};
var se_DeleteMarkerReplication = (input, context) => {
  const bn2 = new XmlNode(_DMR);
  if (input[_S] != null) {
    bn2.c(XmlNode.of(_DMRS, input[_S]).n(_S));
  }
  return bn2;
};
var se_Destination = (input, context) => {
  const bn2 = new XmlNode(_Des);
  if (input[_B] != null) {
    bn2.c(XmlNode.of(_BN, input[_B]).n(_B));
  }
  if (input[_Ac] != null) {
    bn2.c(XmlNode.of(_AIc, input[_Ac]).n(_Ac));
  }
  bn2.cc(input, _SC);
  if (input[_ACT] != null) {
    bn2.c(se_AccessControlTranslation(input[_ACT], context).n(_ACT));
  }
  if (input[_ECn] != null) {
    bn2.c(se_EncryptionConfiguration(input[_ECn], context).n(_ECn));
  }
  if (input[_RTe] != null) {
    bn2.c(se_ReplicationTime(input[_RTe], context).n(_RTe));
  }
  if (input[_Me] != null) {
    bn2.c(se_Metrics(input[_Me], context).n(_Me));
  }
  return bn2;
};
var se_Encryption = (input, context) => {
  const bn2 = new XmlNode(_En);
  if (input[_ETn] != null) {
    bn2.c(XmlNode.of(_SSE, input[_ETn]).n(_ETn));
  }
  if (input[_KMSKI] != null) {
    bn2.c(XmlNode.of(_SSEKMSKI, input[_KMSKI]).n(_KMSKI));
  }
  bn2.cc(input, _KMSC);
  return bn2;
};
var se_EncryptionConfiguration = (input, context) => {
  const bn2 = new XmlNode(_ECn);
  bn2.cc(input, _RKKID);
  return bn2;
};
var se_ErrorDocument = (input, context) => {
  const bn2 = new XmlNode(_ED);
  if (input[_K] != null) {
    bn2.c(XmlNode.of(_OK, input[_K]).n(_K));
  }
  return bn2;
};
var se_EventBridgeConfiguration = (input, context) => {
  const bn2 = new XmlNode(_EBC);
  return bn2;
};
var se_EventList = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = XmlNode.of(_Ev, entry);
    return n2.n(_me);
  });
};
var se_ExistingObjectReplication = (input, context) => {
  const bn2 = new XmlNode(_EOR);
  if (input[_S] != null) {
    bn2.c(XmlNode.of(_EORS, input[_S]).n(_S));
  }
  return bn2;
};
var se_ExposeHeaders = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = XmlNode.of(_EHx, entry);
    return n2.n(_me);
  });
};
var se_FilterRule = (input, context) => {
  const bn2 = new XmlNode(_FR);
  if (input[_N] != null) {
    bn2.c(XmlNode.of(_FRN, input[_N]).n(_N));
  }
  if (input[_Va] != null) {
    bn2.c(XmlNode.of(_FRV, input[_Va]).n(_Va));
  }
  return bn2;
};
var se_FilterRuleList = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = se_FilterRule(entry, context);
    return n2.n(_me);
  });
};
var se_GlacierJobParameters = (input, context) => {
  const bn2 = new XmlNode(_GJP);
  bn2.cc(input, _Ti);
  return bn2;
};
var se_Grant = (input, context) => {
  const bn2 = new XmlNode(_G);
  if (input[_Gra] != null) {
    const n2 = se_Grantee(input[_Gra], context).n(_Gra);
    n2.a("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
    bn2.c(n2);
  }
  bn2.cc(input, _Pe);
  return bn2;
};
var se_Grantee = (input, context) => {
  const bn2 = new XmlNode(_Gra);
  bn2.cc(input, _DN);
  bn2.cc(input, _EA);
  bn2.cc(input, _ID_);
  bn2.cc(input, _URI);
  bn2.a("xsi:type", input[_Ty]);
  return bn2;
};
var se_Grants = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = se_Grant(entry, context);
    return n2.n(_G);
  });
};
var se_IndexDocument = (input, context) => {
  const bn2 = new XmlNode(_ID);
  bn2.cc(input, _Su);
  return bn2;
};
var se_InputSerialization = (input, context) => {
  const bn2 = new XmlNode(_IS);
  if (input[_CSV] != null) {
    bn2.c(se_CSVInput(input[_CSV], context).n(_CSV));
  }
  bn2.cc(input, _CTom);
  if (input[_JSON] != null) {
    bn2.c(se_JSONInput(input[_JSON], context).n(_JSON));
  }
  if (input[_Parq] != null) {
    bn2.c(se_ParquetInput(input[_Parq], context).n(_Parq));
  }
  return bn2;
};
var se_IntelligentTieringAndOperator = (input, context) => {
  const bn2 = new XmlNode(_ITAO);
  bn2.cc(input, _P);
  bn2.l(input, "Tags", "Tag", () => se_TagSet(input[_Tag], context));
  return bn2;
};
var se_IntelligentTieringConfiguration = (input, context) => {
  const bn2 = new XmlNode(_ITC);
  if (input[_I] != null) {
    bn2.c(XmlNode.of(_ITI, input[_I]).n(_I));
  }
  if (input[_F] != null) {
    bn2.c(se_IntelligentTieringFilter(input[_F], context).n(_F));
  }
  if (input[_S] != null) {
    bn2.c(XmlNode.of(_ITS, input[_S]).n(_S));
  }
  bn2.l(input, "Tierings", "Tiering", () => se_TieringList(input[_Tie], context));
  return bn2;
};
var se_IntelligentTieringFilter = (input, context) => {
  const bn2 = new XmlNode(_ITF);
  bn2.cc(input, _P);
  if (input[_Ta] != null) {
    bn2.c(se_Tag(input[_Ta], context).n(_Ta));
  }
  if (input[_A] != null) {
    bn2.c(se_IntelligentTieringAndOperator(input[_A], context).n(_A));
  }
  return bn2;
};
var se_InventoryConfiguration = (input, context) => {
  const bn2 = new XmlNode(_IC);
  if (input[_Des] != null) {
    bn2.c(se_InventoryDestination(input[_Des], context).n(_Des));
  }
  if (input[_IE] != null) {
    bn2.c(XmlNode.of(_IE, String(input[_IE])).n(_IE));
  }
  if (input[_F] != null) {
    bn2.c(se_InventoryFilter(input[_F], context).n(_F));
  }
  if (input[_I] != null) {
    bn2.c(XmlNode.of(_II, input[_I]).n(_I));
  }
  if (input[_IOV] != null) {
    bn2.c(XmlNode.of(_IIOV, input[_IOV]).n(_IOV));
  }
  bn2.lc(input, "OptionalFields", "OptionalFields", () => se_InventoryOptionalFields(input[_OF], context));
  if (input[_Sc] != null) {
    bn2.c(se_InventorySchedule(input[_Sc], context).n(_Sc));
  }
  return bn2;
};
var se_InventoryDestination = (input, context) => {
  const bn2 = new XmlNode(_IDn);
  if (input[_SBD] != null) {
    bn2.c(se_InventoryS3BucketDestination(input[_SBD], context).n(_SBD));
  }
  return bn2;
};
var se_InventoryEncryption = (input, context) => {
  const bn2 = new XmlNode(_IEn);
  if (input[_SSES] != null) {
    bn2.c(se_SSES3(input[_SSES], context).n(_SS));
  }
  if (input[_SSEKMS] != null) {
    bn2.c(se_SSEKMS(input[_SSEKMS], context).n(_SK));
  }
  return bn2;
};
var se_InventoryFilter = (input, context) => {
  const bn2 = new XmlNode(_IF);
  bn2.cc(input, _P);
  return bn2;
};
var se_InventoryOptionalFields = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = XmlNode.of(_IOF, entry);
    return n2.n(_Fi);
  });
};
var se_InventoryS3BucketDestination = (input, context) => {
  const bn2 = new XmlNode(_ISBD);
  bn2.cc(input, _AIc);
  if (input[_B] != null) {
    bn2.c(XmlNode.of(_BN, input[_B]).n(_B));
  }
  if (input[_Fo] != null) {
    bn2.c(XmlNode.of(_IFn, input[_Fo]).n(_Fo));
  }
  bn2.cc(input, _P);
  if (input[_En] != null) {
    bn2.c(se_InventoryEncryption(input[_En], context).n(_En));
  }
  return bn2;
};
var se_InventorySchedule = (input, context) => {
  const bn2 = new XmlNode(_ISn);
  if (input[_Fr] != null) {
    bn2.c(XmlNode.of(_IFnv, input[_Fr]).n(_Fr));
  }
  return bn2;
};
var se_JSONInput = (input, context) => {
  const bn2 = new XmlNode(_JSONI);
  if (input[_Ty] != null) {
    bn2.c(XmlNode.of(_JSONT, input[_Ty]).n(_Ty));
  }
  return bn2;
};
var se_JSONOutput = (input, context) => {
  const bn2 = new XmlNode(_JSONO);
  bn2.cc(input, _RD);
  return bn2;
};
var se_LambdaFunctionConfiguration = (input, context) => {
  const bn2 = new XmlNode(_LFCa);
  if (input[_I] != null) {
    bn2.c(XmlNode.of(_NI, input[_I]).n(_I));
  }
  if (input[_LFA] != null) {
    bn2.c(XmlNode.of(_LFA, input[_LFA]).n(_CF));
  }
  bn2.l(input, "Events", "Event", () => se_EventList(input[_Eve], context));
  if (input[_F] != null) {
    bn2.c(se_NotificationConfigurationFilter(input[_F], context).n(_F));
  }
  return bn2;
};
var se_LambdaFunctionConfigurationList = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = se_LambdaFunctionConfiguration(entry, context);
    return n2.n(_me);
  });
};
var se_LifecycleExpiration = (input, context) => {
  const bn2 = new XmlNode(_LEi);
  if (input[_Dat] != null) {
    bn2.c(XmlNode.of(_Dat, serializeDateTime(input[_Dat]).toString()).n(_Dat));
  }
  if (input[_Da] != null) {
    bn2.c(XmlNode.of(_Da, String(input[_Da])).n(_Da));
  }
  if (input[_EODM] != null) {
    bn2.c(XmlNode.of(_EODM, String(input[_EODM])).n(_EODM));
  }
  return bn2;
};
var se_LifecycleRule = (input, context) => {
  const bn2 = new XmlNode(_LR);
  if (input[_Exp] != null) {
    bn2.c(se_LifecycleExpiration(input[_Exp], context).n(_Exp));
  }
  bn2.cc(input, _ID_);
  bn2.cc(input, _P);
  if (input[_F] != null) {
    bn2.c(se_LifecycleRuleFilter(input[_F], context).n(_F));
  }
  if (input[_S] != null) {
    bn2.c(XmlNode.of(_ESx, input[_S]).n(_S));
  }
  bn2.l(input, "Transitions", "Transition", () => se_TransitionList(input[_Tr], context));
  bn2.l(input, "NoncurrentVersionTransitions", "NoncurrentVersionTransition", () => se_NoncurrentVersionTransitionList(input[_NVT], context));
  if (input[_NVE] != null) {
    bn2.c(se_NoncurrentVersionExpiration(input[_NVE], context).n(_NVE));
  }
  if (input[_AIMU] != null) {
    bn2.c(se_AbortIncompleteMultipartUpload(input[_AIMU], context).n(_AIMU));
  }
  return bn2;
};
var se_LifecycleRuleAndOperator = (input, context) => {
  const bn2 = new XmlNode(_LRAO);
  bn2.cc(input, _P);
  bn2.l(input, "Tags", "Tag", () => se_TagSet(input[_Tag], context));
  if (input[_OSGT] != null) {
    bn2.c(XmlNode.of(_OSGTB, String(input[_OSGT])).n(_OSGT));
  }
  if (input[_OSLT] != null) {
    bn2.c(XmlNode.of(_OSLTB, String(input[_OSLT])).n(_OSLT));
  }
  return bn2;
};
var se_LifecycleRuleFilter = (input, context) => {
  const bn2 = new XmlNode(_LRF);
  bn2.cc(input, _P);
  if (input[_Ta] != null) {
    bn2.c(se_Tag(input[_Ta], context).n(_Ta));
  }
  if (input[_OSGT] != null) {
    bn2.c(XmlNode.of(_OSGTB, String(input[_OSGT])).n(_OSGT));
  }
  if (input[_OSLT] != null) {
    bn2.c(XmlNode.of(_OSLTB, String(input[_OSLT])).n(_OSLT));
  }
  if (input[_A] != null) {
    bn2.c(se_LifecycleRuleAndOperator(input[_A], context).n(_A));
  }
  return bn2;
};
var se_LifecycleRules = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = se_LifecycleRule(entry, context);
    return n2.n(_me);
  });
};
var se_LocationInfo = (input, context) => {
  const bn2 = new XmlNode(_LI);
  if (input[_Ty] != null) {
    bn2.c(XmlNode.of(_LT, input[_Ty]).n(_Ty));
  }
  if (input[_N] != null) {
    bn2.c(XmlNode.of(_LNAS, input[_N]).n(_N));
  }
  return bn2;
};
var se_LoggingEnabled = (input, context) => {
  const bn2 = new XmlNode(_LE);
  bn2.cc(input, _TB);
  bn2.lc(input, "TargetGrants", "TargetGrants", () => se_TargetGrants(input[_TG], context));
  bn2.cc(input, _TP);
  if (input[_TOKF] != null) {
    bn2.c(se_TargetObjectKeyFormat(input[_TOKF], context).n(_TOKF));
  }
  return bn2;
};
var se_MetadataEntry = (input, context) => {
  const bn2 = new XmlNode(_ME);
  if (input[_N] != null) {
    bn2.c(XmlNode.of(_MKe, input[_N]).n(_N));
  }
  if (input[_Va] != null) {
    bn2.c(XmlNode.of(_MV, input[_Va]).n(_Va));
  }
  return bn2;
};
var se_MetadataTableConfiguration = (input, context) => {
  const bn2 = new XmlNode(_MTC);
  if (input[_STD] != null) {
    bn2.c(se_S3TablesDestination(input[_STD], context).n(_STD));
  }
  return bn2;
};
var se_Metrics = (input, context) => {
  const bn2 = new XmlNode(_Me);
  if (input[_S] != null) {
    bn2.c(XmlNode.of(_MS, input[_S]).n(_S));
  }
  if (input[_ETv] != null) {
    bn2.c(se_ReplicationTimeValue(input[_ETv], context).n(_ETv));
  }
  return bn2;
};
var se_MetricsAndOperator = (input, context) => {
  const bn2 = new XmlNode(_MAO);
  bn2.cc(input, _P);
  bn2.l(input, "Tags", "Tag", () => se_TagSet(input[_Tag], context));
  bn2.cc(input, _APAc);
  return bn2;
};
var se_MetricsConfiguration = (input, context) => {
  const bn2 = new XmlNode(_MC);
  if (input[_I] != null) {
    bn2.c(XmlNode.of(_MI, input[_I]).n(_I));
  }
  if (input[_F] != null) {
    bn2.c(se_MetricsFilter(input[_F], context).n(_F));
  }
  return bn2;
};
var se_MetricsFilter = (input, context) => {
  const bn2 = new XmlNode(_MF);
  MetricsFilter.visit(input, {
    Prefix: (value) => {
      if (input[_P] != null) {
        bn2.c(XmlNode.of(_P, value).n(_P));
      }
    },
    Tag: (value) => {
      if (input[_Ta] != null) {
        bn2.c(se_Tag(value, context).n(_Ta));
      }
    },
    AccessPointArn: (value) => {
      if (input[_APAc] != null) {
        bn2.c(XmlNode.of(_APAc, value).n(_APAc));
      }
    },
    And: (value) => {
      if (input[_A] != null) {
        bn2.c(se_MetricsAndOperator(value, context).n(_A));
      }
    },
    _: (name, value) => {
      if (!(value instanceof XmlNode || value instanceof XmlText)) {
        throw new Error("Unable to serialize unknown union members in XML.");
      }
      bn2.c(new XmlNode(name).c(value));
    }
  });
  return bn2;
};
var se_NoncurrentVersionExpiration = (input, context) => {
  const bn2 = new XmlNode(_NVE);
  if (input[_ND] != null) {
    bn2.c(XmlNode.of(_Da, String(input[_ND])).n(_ND));
  }
  if (input[_NNV] != null) {
    bn2.c(XmlNode.of(_VC, String(input[_NNV])).n(_NNV));
  }
  return bn2;
};
var se_NoncurrentVersionTransition = (input, context) => {
  const bn2 = new XmlNode(_NVTo);
  if (input[_ND] != null) {
    bn2.c(XmlNode.of(_Da, String(input[_ND])).n(_ND));
  }
  if (input[_SC] != null) {
    bn2.c(XmlNode.of(_TSC, input[_SC]).n(_SC));
  }
  if (input[_NNV] != null) {
    bn2.c(XmlNode.of(_VC, String(input[_NNV])).n(_NNV));
  }
  return bn2;
};
var se_NoncurrentVersionTransitionList = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = se_NoncurrentVersionTransition(entry, context);
    return n2.n(_me);
  });
};
var se_NotificationConfiguration = (input, context) => {
  const bn2 = new XmlNode(_NC);
  bn2.l(input, "TopicConfigurations", "TopicConfiguration", () => se_TopicConfigurationList(input[_TCop], context));
  bn2.l(input, "QueueConfigurations", "QueueConfiguration", () => se_QueueConfigurationList(input[_QCu], context));
  bn2.l(input, "LambdaFunctionConfigurations", "CloudFunctionConfiguration", () => se_LambdaFunctionConfigurationList(input[_LFC], context));
  if (input[_EBC] != null) {
    bn2.c(se_EventBridgeConfiguration(input[_EBC], context).n(_EBC));
  }
  return bn2;
};
var se_NotificationConfigurationFilter = (input, context) => {
  const bn2 = new XmlNode(_NCF);
  if (input[_K] != null) {
    bn2.c(se_S3KeyFilter(input[_K], context).n(_SKe));
  }
  return bn2;
};
var se_ObjectIdentifier = (input, context) => {
  const bn2 = new XmlNode(_OI);
  if (input[_K] != null) {
    bn2.c(XmlNode.of(_OK, input[_K]).n(_K));
  }
  if (input[_VI] != null) {
    bn2.c(XmlNode.of(_OVI, input[_VI]).n(_VI));
  }
  bn2.cc(input, _ETa);
  if (input[_LMT] != null) {
    bn2.c(XmlNode.of(_LMT, dateToUtcString(input[_LMT]).toString()).n(_LMT));
  }
  if (input[_Si] != null) {
    bn2.c(XmlNode.of(_Si, String(input[_Si])).n(_Si));
  }
  return bn2;
};
var se_ObjectIdentifierList = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = se_ObjectIdentifier(entry, context);
    return n2.n(_me);
  });
};
var se_ObjectLockConfiguration = (input, context) => {
  const bn2 = new XmlNode(_OLC);
  bn2.cc(input, _OLE);
  if (input[_Ru] != null) {
    bn2.c(se_ObjectLockRule(input[_Ru], context).n(_Ru));
  }
  return bn2;
};
var se_ObjectLockLegalHold = (input, context) => {
  const bn2 = new XmlNode(_OLLH);
  if (input[_S] != null) {
    bn2.c(XmlNode.of(_OLLHS, input[_S]).n(_S));
  }
  return bn2;
};
var se_ObjectLockRetention = (input, context) => {
  const bn2 = new XmlNode(_OLR);
  if (input[_Mo] != null) {
    bn2.c(XmlNode.of(_OLRM, input[_Mo]).n(_Mo));
  }
  if (input[_RUD] != null) {
    bn2.c(XmlNode.of(_Dat, serializeDateTime(input[_RUD]).toString()).n(_RUD));
  }
  return bn2;
};
var se_ObjectLockRule = (input, context) => {
  const bn2 = new XmlNode(_OLRb);
  if (input[_DRe] != null) {
    bn2.c(se_DefaultRetention(input[_DRe], context).n(_DRe));
  }
  return bn2;
};
var se_OutputLocation = (input, context) => {
  const bn2 = new XmlNode(_OL);
  if (input[_S_] != null) {
    bn2.c(se_S3Location(input[_S_], context).n(_S_));
  }
  return bn2;
};
var se_OutputSerialization = (input, context) => {
  const bn2 = new XmlNode(_OS);
  if (input[_CSV] != null) {
    bn2.c(se_CSVOutput(input[_CSV], context).n(_CSV));
  }
  if (input[_JSON] != null) {
    bn2.c(se_JSONOutput(input[_JSON], context).n(_JSON));
  }
  return bn2;
};
var se_Owner = (input, context) => {
  const bn2 = new XmlNode(_O);
  bn2.cc(input, _DN);
  bn2.cc(input, _ID_);
  return bn2;
};
var se_OwnershipControls = (input, context) => {
  const bn2 = new XmlNode(_OC);
  bn2.l(input, "Rules", "Rule", () => se_OwnershipControlsRules(input[_Rul], context));
  return bn2;
};
var se_OwnershipControlsRule = (input, context) => {
  const bn2 = new XmlNode(_OCR);
  bn2.cc(input, _OO);
  return bn2;
};
var se_OwnershipControlsRules = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = se_OwnershipControlsRule(entry, context);
    return n2.n(_me);
  });
};
var se_ParquetInput = (input, context) => {
  const bn2 = new XmlNode(_PI);
  return bn2;
};
var se_PartitionedPrefix = (input, context) => {
  const bn2 = new XmlNode(_PP);
  bn2.cc(input, _PDS);
  return bn2;
};
var se_PublicAccessBlockConfiguration = (input, context) => {
  const bn2 = new XmlNode(_PABC);
  if (input[_BPA] != null) {
    bn2.c(XmlNode.of(_Se, String(input[_BPA])).n(_BPA));
  }
  if (input[_IPA] != null) {
    bn2.c(XmlNode.of(_Se, String(input[_IPA])).n(_IPA));
  }
  if (input[_BPP] != null) {
    bn2.c(XmlNode.of(_Se, String(input[_BPP])).n(_BPP));
  }
  if (input[_RPB] != null) {
    bn2.c(XmlNode.of(_Se, String(input[_RPB])).n(_RPB));
  }
  return bn2;
};
var se_QueueConfiguration = (input, context) => {
  const bn2 = new XmlNode(_QC);
  if (input[_I] != null) {
    bn2.c(XmlNode.of(_NI, input[_I]).n(_I));
  }
  if (input[_QA] != null) {
    bn2.c(XmlNode.of(_QA, input[_QA]).n(_Qu));
  }
  bn2.l(input, "Events", "Event", () => se_EventList(input[_Eve], context));
  if (input[_F] != null) {
    bn2.c(se_NotificationConfigurationFilter(input[_F], context).n(_F));
  }
  return bn2;
};
var se_QueueConfigurationList = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = se_QueueConfiguration(entry, context);
    return n2.n(_me);
  });
};
var se_Redirect = (input, context) => {
  const bn2 = new XmlNode(_Red);
  bn2.cc(input, _HN);
  bn2.cc(input, _HRC);
  bn2.cc(input, _Pr);
  bn2.cc(input, _RKPW);
  bn2.cc(input, _RKW);
  return bn2;
};
var se_RedirectAllRequestsTo = (input, context) => {
  const bn2 = new XmlNode(_RART);
  bn2.cc(input, _HN);
  bn2.cc(input, _Pr);
  return bn2;
};
var se_ReplicaModifications = (input, context) => {
  const bn2 = new XmlNode(_RM);
  if (input[_S] != null) {
    bn2.c(XmlNode.of(_RMS, input[_S]).n(_S));
  }
  return bn2;
};
var se_ReplicationConfiguration = (input, context) => {
  const bn2 = new XmlNode(_RCe);
  bn2.cc(input, _Ro);
  bn2.l(input, "Rules", "Rule", () => se_ReplicationRules(input[_Rul], context));
  return bn2;
};
var se_ReplicationRule = (input, context) => {
  const bn2 = new XmlNode(_RRe);
  bn2.cc(input, _ID_);
  if (input[_Pri] != null) {
    bn2.c(XmlNode.of(_Pri, String(input[_Pri])).n(_Pri));
  }
  bn2.cc(input, _P);
  if (input[_F] != null) {
    bn2.c(se_ReplicationRuleFilter(input[_F], context).n(_F));
  }
  if (input[_S] != null) {
    bn2.c(XmlNode.of(_RRS, input[_S]).n(_S));
  }
  if (input[_SSC] != null) {
    bn2.c(se_SourceSelectionCriteria(input[_SSC], context).n(_SSC));
  }
  if (input[_EOR] != null) {
    bn2.c(se_ExistingObjectReplication(input[_EOR], context).n(_EOR));
  }
  if (input[_Des] != null) {
    bn2.c(se_Destination(input[_Des], context).n(_Des));
  }
  if (input[_DMR] != null) {
    bn2.c(se_DeleteMarkerReplication(input[_DMR], context).n(_DMR));
  }
  return bn2;
};
var se_ReplicationRuleAndOperator = (input, context) => {
  const bn2 = new XmlNode(_RRAO);
  bn2.cc(input, _P);
  bn2.l(input, "Tags", "Tag", () => se_TagSet(input[_Tag], context));
  return bn2;
};
var se_ReplicationRuleFilter = (input, context) => {
  const bn2 = new XmlNode(_RRF);
  bn2.cc(input, _P);
  if (input[_Ta] != null) {
    bn2.c(se_Tag(input[_Ta], context).n(_Ta));
  }
  if (input[_A] != null) {
    bn2.c(se_ReplicationRuleAndOperator(input[_A], context).n(_A));
  }
  return bn2;
};
var se_ReplicationRules = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = se_ReplicationRule(entry, context);
    return n2.n(_me);
  });
};
var se_ReplicationTime = (input, context) => {
  const bn2 = new XmlNode(_RTe);
  if (input[_S] != null) {
    bn2.c(XmlNode.of(_RTS, input[_S]).n(_S));
  }
  if (input[_Tim] != null) {
    bn2.c(se_ReplicationTimeValue(input[_Tim], context).n(_Tim));
  }
  return bn2;
};
var se_ReplicationTimeValue = (input, context) => {
  const bn2 = new XmlNode(_RTV);
  if (input[_Mi] != null) {
    bn2.c(XmlNode.of(_Mi, String(input[_Mi])).n(_Mi));
  }
  return bn2;
};
var se_RequestPaymentConfiguration = (input, context) => {
  const bn2 = new XmlNode(_RPC);
  bn2.cc(input, _Pa);
  return bn2;
};
var se_RequestProgress = (input, context) => {
  const bn2 = new XmlNode(_RPe);
  if (input[_Ena] != null) {
    bn2.c(XmlNode.of(_ERP, String(input[_Ena])).n(_Ena));
  }
  return bn2;
};
var se_RestoreRequest = (input, context) => {
  const bn2 = new XmlNode(_RRes);
  if (input[_Da] != null) {
    bn2.c(XmlNode.of(_Da, String(input[_Da])).n(_Da));
  }
  if (input[_GJP] != null) {
    bn2.c(se_GlacierJobParameters(input[_GJP], context).n(_GJP));
  }
  if (input[_Ty] != null) {
    bn2.c(XmlNode.of(_RRT, input[_Ty]).n(_Ty));
  }
  bn2.cc(input, _Ti);
  bn2.cc(input, _Desc);
  if (input[_SP] != null) {
    bn2.c(se_SelectParameters(input[_SP], context).n(_SP));
  }
  if (input[_OL] != null) {
    bn2.c(se_OutputLocation(input[_OL], context).n(_OL));
  }
  return bn2;
};
var se_RoutingRule = (input, context) => {
  const bn2 = new XmlNode(_RRou);
  if (input[_Con] != null) {
    bn2.c(se_Condition(input[_Con], context).n(_Con));
  }
  if (input[_Red] != null) {
    bn2.c(se_Redirect(input[_Red], context).n(_Red));
  }
  return bn2;
};
var se_RoutingRules = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = se_RoutingRule(entry, context);
    return n2.n(_RRou);
  });
};
var se_S3KeyFilter = (input, context) => {
  const bn2 = new XmlNode(_SKF);
  bn2.l(input, "FilterRules", "FilterRule", () => se_FilterRuleList(input[_FRi], context));
  return bn2;
};
var se_S3Location = (input, context) => {
  const bn2 = new XmlNode(_SL);
  bn2.cc(input, _BN);
  if (input[_P] != null) {
    bn2.c(XmlNode.of(_LP, input[_P]).n(_P));
  }
  if (input[_En] != null) {
    bn2.c(se_Encryption(input[_En], context).n(_En));
  }
  if (input[_CACL] != null) {
    bn2.c(XmlNode.of(_OCACL, input[_CACL]).n(_CACL));
  }
  bn2.lc(input, "AccessControlList", "AccessControlList", () => se_Grants(input[_ACLc], context));
  if (input[_T] != null) {
    bn2.c(se_Tagging(input[_T], context).n(_T));
  }
  bn2.lc(input, "UserMetadata", "UserMetadata", () => se_UserMetadata(input[_UM], context));
  bn2.cc(input, _SC);
  return bn2;
};
var se_S3TablesDestination = (input, context) => {
  const bn2 = new XmlNode(_STD);
  if (input[_TBA] != null) {
    bn2.c(XmlNode.of(_STBA, input[_TBA]).n(_TBA));
  }
  if (input[_TN] != null) {
    bn2.c(XmlNode.of(_STN, input[_TN]).n(_TN));
  }
  return bn2;
};
var se_ScanRange = (input, context) => {
  const bn2 = new XmlNode(_SR);
  if (input[_St] != null) {
    bn2.c(XmlNode.of(_St, String(input[_St])).n(_St));
  }
  if (input[_End] != null) {
    bn2.c(XmlNode.of(_End, String(input[_End])).n(_End));
  }
  return bn2;
};
var se_SelectParameters = (input, context) => {
  const bn2 = new XmlNode(_SP);
  if (input[_IS] != null) {
    bn2.c(se_InputSerialization(input[_IS], context).n(_IS));
  }
  bn2.cc(input, _ETx);
  bn2.cc(input, _Ex);
  if (input[_OS] != null) {
    bn2.c(se_OutputSerialization(input[_OS], context).n(_OS));
  }
  return bn2;
};
var se_ServerSideEncryptionByDefault = (input, context) => {
  const bn2 = new XmlNode(_SSEBD);
  if (input[_SSEA] != null) {
    bn2.c(XmlNode.of(_SSE, input[_SSEA]).n(_SSEA));
  }
  if (input[_KMSMKID] != null) {
    bn2.c(XmlNode.of(_SSEKMSKI, input[_KMSMKID]).n(_KMSMKID));
  }
  return bn2;
};
var se_ServerSideEncryptionConfiguration = (input, context) => {
  const bn2 = new XmlNode(_SSEC);
  bn2.l(input, "Rules", "Rule", () => se_ServerSideEncryptionRules(input[_Rul], context));
  return bn2;
};
var se_ServerSideEncryptionRule = (input, context) => {
  const bn2 = new XmlNode(_SSER);
  if (input[_ASSEBD] != null) {
    bn2.c(se_ServerSideEncryptionByDefault(input[_ASSEBD], context).n(_ASSEBD));
  }
  if (input[_BKE] != null) {
    bn2.c(XmlNode.of(_BKE, String(input[_BKE])).n(_BKE));
  }
  return bn2;
};
var se_ServerSideEncryptionRules = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = se_ServerSideEncryptionRule(entry, context);
    return n2.n(_me);
  });
};
var se_SimplePrefix = (input, context) => {
  const bn2 = new XmlNode(_SPi);
  return bn2;
};
var se_SourceSelectionCriteria = (input, context) => {
  const bn2 = new XmlNode(_SSC);
  if (input[_SKEO] != null) {
    bn2.c(se_SseKmsEncryptedObjects(input[_SKEO], context).n(_SKEO));
  }
  if (input[_RM] != null) {
    bn2.c(se_ReplicaModifications(input[_RM], context).n(_RM));
  }
  return bn2;
};
var se_SSEKMS = (input, context) => {
  const bn2 = new XmlNode(_SK);
  if (input[_KI] != null) {
    bn2.c(XmlNode.of(_SSEKMSKI, input[_KI]).n(_KI));
  }
  return bn2;
};
var se_SseKmsEncryptedObjects = (input, context) => {
  const bn2 = new XmlNode(_SKEO);
  if (input[_S] != null) {
    bn2.c(XmlNode.of(_SKEOS, input[_S]).n(_S));
  }
  return bn2;
};
var se_SSES3 = (input, context) => {
  const bn2 = new XmlNode(_SS);
  return bn2;
};
var se_StorageClassAnalysis = (input, context) => {
  const bn2 = new XmlNode(_SCA);
  if (input[_DE] != null) {
    bn2.c(se_StorageClassAnalysisDataExport(input[_DE], context).n(_DE));
  }
  return bn2;
};
var se_StorageClassAnalysisDataExport = (input, context) => {
  const bn2 = new XmlNode(_SCADE);
  if (input[_OSV] != null) {
    bn2.c(XmlNode.of(_SCASV, input[_OSV]).n(_OSV));
  }
  if (input[_Des] != null) {
    bn2.c(se_AnalyticsExportDestination(input[_Des], context).n(_Des));
  }
  return bn2;
};
var se_Tag = (input, context) => {
  const bn2 = new XmlNode(_Ta);
  if (input[_K] != null) {
    bn2.c(XmlNode.of(_OK, input[_K]).n(_K));
  }
  bn2.cc(input, _Va);
  return bn2;
};
var se_Tagging = (input, context) => {
  const bn2 = new XmlNode(_T);
  bn2.lc(input, "TagSet", "TagSet", () => se_TagSet(input[_TS], context));
  return bn2;
};
var se_TagSet = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = se_Tag(entry, context);
    return n2.n(_Ta);
  });
};
var se_TargetGrant = (input, context) => {
  const bn2 = new XmlNode(_TGa);
  if (input[_Gra] != null) {
    const n2 = se_Grantee(input[_Gra], context).n(_Gra);
    n2.a("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
    bn2.c(n2);
  }
  if (input[_Pe] != null) {
    bn2.c(XmlNode.of(_BLP, input[_Pe]).n(_Pe));
  }
  return bn2;
};
var se_TargetGrants = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = se_TargetGrant(entry, context);
    return n2.n(_G);
  });
};
var se_TargetObjectKeyFormat = (input, context) => {
  const bn2 = new XmlNode(_TOKF);
  if (input[_SPi] != null) {
    bn2.c(se_SimplePrefix(input[_SPi], context).n(_SPi));
  }
  if (input[_PP] != null) {
    bn2.c(se_PartitionedPrefix(input[_PP], context).n(_PP));
  }
  return bn2;
};
var se_Tiering = (input, context) => {
  const bn2 = new XmlNode(_Tier);
  if (input[_Da] != null) {
    bn2.c(XmlNode.of(_ITD, String(input[_Da])).n(_Da));
  }
  if (input[_AT] != null) {
    bn2.c(XmlNode.of(_ITAT, input[_AT]).n(_AT));
  }
  return bn2;
};
var se_TieringList = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = se_Tiering(entry, context);
    return n2.n(_me);
  });
};
var se_TopicConfiguration = (input, context) => {
  const bn2 = new XmlNode(_TCo);
  if (input[_I] != null) {
    bn2.c(XmlNode.of(_NI, input[_I]).n(_I));
  }
  if (input[_TA] != null) {
    bn2.c(XmlNode.of(_TA, input[_TA]).n(_Top));
  }
  bn2.l(input, "Events", "Event", () => se_EventList(input[_Eve], context));
  if (input[_F] != null) {
    bn2.c(se_NotificationConfigurationFilter(input[_F], context).n(_F));
  }
  return bn2;
};
var se_TopicConfigurationList = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = se_TopicConfiguration(entry, context);
    return n2.n(_me);
  });
};
var se_Transition = (input, context) => {
  const bn2 = new XmlNode(_Tra);
  if (input[_Dat] != null) {
    bn2.c(XmlNode.of(_Dat, serializeDateTime(input[_Dat]).toString()).n(_Dat));
  }
  if (input[_Da] != null) {
    bn2.c(XmlNode.of(_Da, String(input[_Da])).n(_Da));
  }
  if (input[_SC] != null) {
    bn2.c(XmlNode.of(_TSC, input[_SC]).n(_SC));
  }
  return bn2;
};
var se_TransitionList = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = se_Transition(entry, context);
    return n2.n(_me);
  });
};
var se_UserMetadata = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    const n2 = se_MetadataEntry(entry, context);
    return n2.n(_ME);
  });
};
var se_VersioningConfiguration = (input, context) => {
  const bn2 = new XmlNode(_VCe);
  if (input[_MFAD] != null) {
    bn2.c(XmlNode.of(_MFAD, input[_MFAD]).n(_MDf));
  }
  if (input[_S] != null) {
    bn2.c(XmlNode.of(_BVS, input[_S]).n(_S));
  }
  return bn2;
};
var se_WebsiteConfiguration = (input, context) => {
  const bn2 = new XmlNode(_WC);
  if (input[_ED] != null) {
    bn2.c(se_ErrorDocument(input[_ED], context).n(_ED));
  }
  if (input[_ID] != null) {
    bn2.c(se_IndexDocument(input[_ID], context).n(_ID));
  }
  if (input[_RART] != null) {
    bn2.c(se_RedirectAllRequestsTo(input[_RART], context).n(_RART));
  }
  bn2.lc(input, "RoutingRules", "RoutingRules", () => se_RoutingRules(input[_RRo], context));
  return bn2;
};
var de_AbortIncompleteMultipartUpload = (output, context) => {
  const contents = {};
  if (output[_DAI] != null) {
    contents[_DAI] = strictParseInt32(output[_DAI]);
  }
  return contents;
};
var de_AccessControlTranslation = (output, context) => {
  const contents = {};
  if (output[_O] != null) {
    contents[_O] = expectString(output[_O]);
  }
  return contents;
};
var de_AllowedHeaders = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return expectString(entry);
  });
};
var de_AllowedMethods = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return expectString(entry);
  });
};
var de_AllowedOrigins = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return expectString(entry);
  });
};
var de_AnalyticsAndOperator = (output, context) => {
  const contents = {};
  if (output[_P] != null) {
    contents[_P] = expectString(output[_P]);
  }
  if (output.Tag === "") {
    contents[_Tag] = [];
  } else if (output[_Ta] != null) {
    contents[_Tag] = de_TagSet(getArrayIfSingleItem(output[_Ta]), context);
  }
  return contents;
};
var de_AnalyticsConfiguration = (output, context) => {
  const contents = {};
  if (output[_I] != null) {
    contents[_I] = expectString(output[_I]);
  }
  if (output.Filter === "") {
  } else if (output[_F] != null) {
    contents[_F] = de_AnalyticsFilter(expectUnion(output[_F]), context);
  }
  if (output[_SCA] != null) {
    contents[_SCA] = de_StorageClassAnalysis(output[_SCA], context);
  }
  return contents;
};
var de_AnalyticsConfigurationList = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_AnalyticsConfiguration(entry, context);
  });
};
var de_AnalyticsExportDestination = (output, context) => {
  const contents = {};
  if (output[_SBD] != null) {
    contents[_SBD] = de_AnalyticsS3BucketDestination(output[_SBD], context);
  }
  return contents;
};
var de_AnalyticsFilter = (output, context) => {
  if (output[_P] != null) {
    return {
      Prefix: expectString(output[_P])
    };
  }
  if (output[_Ta] != null) {
    return {
      Tag: de_Tag(output[_Ta], context)
    };
  }
  if (output[_A] != null) {
    return {
      And: de_AnalyticsAndOperator(output[_A], context)
    };
  }
  return { $unknown: Object.entries(output)[0] };
};
var de_AnalyticsS3BucketDestination = (output, context) => {
  const contents = {};
  if (output[_Fo] != null) {
    contents[_Fo] = expectString(output[_Fo]);
  }
  if (output[_BAI] != null) {
    contents[_BAI] = expectString(output[_BAI]);
  }
  if (output[_B] != null) {
    contents[_B] = expectString(output[_B]);
  }
  if (output[_P] != null) {
    contents[_P] = expectString(output[_P]);
  }
  return contents;
};
var de_Bucket = (output, context) => {
  const contents = {};
  if (output[_N] != null) {
    contents[_N] = expectString(output[_N]);
  }
  if (output[_CDr] != null) {
    contents[_CDr] = expectNonNull(parseRfc3339DateTimeWithOffset(output[_CDr]));
  }
  if (output[_BR] != null) {
    contents[_BR] = expectString(output[_BR]);
  }
  return contents;
};
var de_Buckets = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_Bucket(entry, context);
  });
};
var de_Checksum = (output, context) => {
  const contents = {};
  if (output[_CCRC] != null) {
    contents[_CCRC] = expectString(output[_CCRC]);
  }
  if (output[_CCRCC] != null) {
    contents[_CCRCC] = expectString(output[_CCRCC]);
  }
  if (output[_CCRCNVME] != null) {
    contents[_CCRCNVME] = expectString(output[_CCRCNVME]);
  }
  if (output[_CSHA] != null) {
    contents[_CSHA] = expectString(output[_CSHA]);
  }
  if (output[_CSHAh] != null) {
    contents[_CSHAh] = expectString(output[_CSHAh]);
  }
  if (output[_CT] != null) {
    contents[_CT] = expectString(output[_CT]);
  }
  return contents;
};
var de_ChecksumAlgorithmList = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return expectString(entry);
  });
};
var de_CommonPrefix = (output, context) => {
  const contents = {};
  if (output[_P] != null) {
    contents[_P] = expectString(output[_P]);
  }
  return contents;
};
var de_CommonPrefixList = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_CommonPrefix(entry, context);
  });
};
var de_Condition = (output, context) => {
  const contents = {};
  if (output[_HECRE] != null) {
    contents[_HECRE] = expectString(output[_HECRE]);
  }
  if (output[_KPE] != null) {
    contents[_KPE] = expectString(output[_KPE]);
  }
  return contents;
};
var de_ContinuationEvent = (output, context) => {
  const contents = {};
  return contents;
};
var de_CopyObjectResult = (output, context) => {
  const contents = {};
  if (output[_ETa] != null) {
    contents[_ETa] = expectString(output[_ETa]);
  }
  if (output[_LM] != null) {
    contents[_LM] = expectNonNull(parseRfc3339DateTimeWithOffset(output[_LM]));
  }
  if (output[_CT] != null) {
    contents[_CT] = expectString(output[_CT]);
  }
  if (output[_CCRC] != null) {
    contents[_CCRC] = expectString(output[_CCRC]);
  }
  if (output[_CCRCC] != null) {
    contents[_CCRCC] = expectString(output[_CCRCC]);
  }
  if (output[_CCRCNVME] != null) {
    contents[_CCRCNVME] = expectString(output[_CCRCNVME]);
  }
  if (output[_CSHA] != null) {
    contents[_CSHA] = expectString(output[_CSHA]);
  }
  if (output[_CSHAh] != null) {
    contents[_CSHAh] = expectString(output[_CSHAh]);
  }
  return contents;
};
var de_CopyPartResult = (output, context) => {
  const contents = {};
  if (output[_ETa] != null) {
    contents[_ETa] = expectString(output[_ETa]);
  }
  if (output[_LM] != null) {
    contents[_LM] = expectNonNull(parseRfc3339DateTimeWithOffset(output[_LM]));
  }
  if (output[_CCRC] != null) {
    contents[_CCRC] = expectString(output[_CCRC]);
  }
  if (output[_CCRCC] != null) {
    contents[_CCRCC] = expectString(output[_CCRCC]);
  }
  if (output[_CCRCNVME] != null) {
    contents[_CCRCNVME] = expectString(output[_CCRCNVME]);
  }
  if (output[_CSHA] != null) {
    contents[_CSHA] = expectString(output[_CSHA]);
  }
  if (output[_CSHAh] != null) {
    contents[_CSHAh] = expectString(output[_CSHAh]);
  }
  return contents;
};
var de_CORSRule = (output, context) => {
  const contents = {};
  if (output[_ID_] != null) {
    contents[_ID_] = expectString(output[_ID_]);
  }
  if (output.AllowedHeader === "") {
    contents[_AHl] = [];
  } else if (output[_AH] != null) {
    contents[_AHl] = de_AllowedHeaders(getArrayIfSingleItem(output[_AH]), context);
  }
  if (output.AllowedMethod === "") {
    contents[_AMl] = [];
  } else if (output[_AM] != null) {
    contents[_AMl] = de_AllowedMethods(getArrayIfSingleItem(output[_AM]), context);
  }
  if (output.AllowedOrigin === "") {
    contents[_AOl] = [];
  } else if (output[_AO] != null) {
    contents[_AOl] = de_AllowedOrigins(getArrayIfSingleItem(output[_AO]), context);
  }
  if (output.ExposeHeader === "") {
    contents[_EH] = [];
  } else if (output[_EHx] != null) {
    contents[_EH] = de_ExposeHeaders(getArrayIfSingleItem(output[_EHx]), context);
  }
  if (output[_MAS] != null) {
    contents[_MAS] = strictParseInt32(output[_MAS]);
  }
  return contents;
};
var de_CORSRules = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_CORSRule(entry, context);
  });
};
var de_DefaultRetention = (output, context) => {
  const contents = {};
  if (output[_Mo] != null) {
    contents[_Mo] = expectString(output[_Mo]);
  }
  if (output[_Da] != null) {
    contents[_Da] = strictParseInt32(output[_Da]);
  }
  if (output[_Y] != null) {
    contents[_Y] = strictParseInt32(output[_Y]);
  }
  return contents;
};
var de_DeletedObject = (output, context) => {
  const contents = {};
  if (output[_K] != null) {
    contents[_K] = expectString(output[_K]);
  }
  if (output[_VI] != null) {
    contents[_VI] = expectString(output[_VI]);
  }
  if (output[_DM] != null) {
    contents[_DM] = parseBoolean(output[_DM]);
  }
  if (output[_DMVI] != null) {
    contents[_DMVI] = expectString(output[_DMVI]);
  }
  return contents;
};
var de_DeletedObjects = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_DeletedObject(entry, context);
  });
};
var de_DeleteMarkerEntry = (output, context) => {
  const contents = {};
  if (output[_O] != null) {
    contents[_O] = de_Owner(output[_O], context);
  }
  if (output[_K] != null) {
    contents[_K] = expectString(output[_K]);
  }
  if (output[_VI] != null) {
    contents[_VI] = expectString(output[_VI]);
  }
  if (output[_IL] != null) {
    contents[_IL] = parseBoolean(output[_IL]);
  }
  if (output[_LM] != null) {
    contents[_LM] = expectNonNull(parseRfc3339DateTimeWithOffset(output[_LM]));
  }
  return contents;
};
var de_DeleteMarkerReplication = (output, context) => {
  const contents = {};
  if (output[_S] != null) {
    contents[_S] = expectString(output[_S]);
  }
  return contents;
};
var de_DeleteMarkers = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_DeleteMarkerEntry(entry, context);
  });
};
var de_Destination = (output, context) => {
  const contents = {};
  if (output[_B] != null) {
    contents[_B] = expectString(output[_B]);
  }
  if (output[_Ac] != null) {
    contents[_Ac] = expectString(output[_Ac]);
  }
  if (output[_SC] != null) {
    contents[_SC] = expectString(output[_SC]);
  }
  if (output[_ACT] != null) {
    contents[_ACT] = de_AccessControlTranslation(output[_ACT], context);
  }
  if (output[_ECn] != null) {
    contents[_ECn] = de_EncryptionConfiguration(output[_ECn], context);
  }
  if (output[_RTe] != null) {
    contents[_RTe] = de_ReplicationTime(output[_RTe], context);
  }
  if (output[_Me] != null) {
    contents[_Me] = de_Metrics(output[_Me], context);
  }
  return contents;
};
var de_EncryptionConfiguration = (output, context) => {
  const contents = {};
  if (output[_RKKID] != null) {
    contents[_RKKID] = expectString(output[_RKKID]);
  }
  return contents;
};
var de_EndEvent = (output, context) => {
  const contents = {};
  return contents;
};
var de__Error = (output, context) => {
  const contents = {};
  if (output[_K] != null) {
    contents[_K] = expectString(output[_K]);
  }
  if (output[_VI] != null) {
    contents[_VI] = expectString(output[_VI]);
  }
  if (output[_Cod] != null) {
    contents[_Cod] = expectString(output[_Cod]);
  }
  if (output[_Mes] != null) {
    contents[_Mes] = expectString(output[_Mes]);
  }
  return contents;
};
var de_ErrorDetails = (output, context) => {
  const contents = {};
  if (output[_EC] != null) {
    contents[_EC] = expectString(output[_EC]);
  }
  if (output[_EM] != null) {
    contents[_EM] = expectString(output[_EM]);
  }
  return contents;
};
var de_ErrorDocument = (output, context) => {
  const contents = {};
  if (output[_K] != null) {
    contents[_K] = expectString(output[_K]);
  }
  return contents;
};
var de_Errors = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de__Error(entry, context);
  });
};
var de_EventBridgeConfiguration = (output, context) => {
  const contents = {};
  return contents;
};
var de_EventList = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return expectString(entry);
  });
};
var de_ExistingObjectReplication = (output, context) => {
  const contents = {};
  if (output[_S] != null) {
    contents[_S] = expectString(output[_S]);
  }
  return contents;
};
var de_ExposeHeaders = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return expectString(entry);
  });
};
var de_FilterRule = (output, context) => {
  const contents = {};
  if (output[_N] != null) {
    contents[_N] = expectString(output[_N]);
  }
  if (output[_Va] != null) {
    contents[_Va] = expectString(output[_Va]);
  }
  return contents;
};
var de_FilterRuleList = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_FilterRule(entry, context);
  });
};
var de_GetBucketMetadataTableConfigurationResult = (output, context) => {
  const contents = {};
  if (output[_MTCR] != null) {
    contents[_MTCR] = de_MetadataTableConfigurationResult(output[_MTCR], context);
  }
  if (output[_S] != null) {
    contents[_S] = expectString(output[_S]);
  }
  if (output[_Er] != null) {
    contents[_Er] = de_ErrorDetails(output[_Er], context);
  }
  return contents;
};
var de_GetObjectAttributesParts = (output, context) => {
  const contents = {};
  if (output[_PC] != null) {
    contents[_TPC] = strictParseInt32(output[_PC]);
  }
  if (output[_PNM] != null) {
    contents[_PNM] = expectString(output[_PNM]);
  }
  if (output[_NPNM] != null) {
    contents[_NPNM] = expectString(output[_NPNM]);
  }
  if (output[_MP] != null) {
    contents[_MP] = strictParseInt32(output[_MP]);
  }
  if (output[_IT] != null) {
    contents[_IT] = parseBoolean(output[_IT]);
  }
  if (output.Part === "") {
    contents[_Part] = [];
  } else if (output[_Par] != null) {
    contents[_Part] = de_PartsList(getArrayIfSingleItem(output[_Par]), context);
  }
  return contents;
};
var de_Grant = (output, context) => {
  const contents = {};
  if (output[_Gra] != null) {
    contents[_Gra] = de_Grantee(output[_Gra], context);
  }
  if (output[_Pe] != null) {
    contents[_Pe] = expectString(output[_Pe]);
  }
  return contents;
};
var de_Grantee = (output, context) => {
  const contents = {};
  if (output[_DN] != null) {
    contents[_DN] = expectString(output[_DN]);
  }
  if (output[_EA] != null) {
    contents[_EA] = expectString(output[_EA]);
  }
  if (output[_ID_] != null) {
    contents[_ID_] = expectString(output[_ID_]);
  }
  if (output[_URI] != null) {
    contents[_URI] = expectString(output[_URI]);
  }
  if (output[_x] != null) {
    contents[_Ty] = expectString(output[_x]);
  }
  return contents;
};
var de_Grants = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_Grant(entry, context);
  });
};
var de_IndexDocument = (output, context) => {
  const contents = {};
  if (output[_Su] != null) {
    contents[_Su] = expectString(output[_Su]);
  }
  return contents;
};
var de_Initiator = (output, context) => {
  const contents = {};
  if (output[_ID_] != null) {
    contents[_ID_] = expectString(output[_ID_]);
  }
  if (output[_DN] != null) {
    contents[_DN] = expectString(output[_DN]);
  }
  return contents;
};
var de_IntelligentTieringAndOperator = (output, context) => {
  const contents = {};
  if (output[_P] != null) {
    contents[_P] = expectString(output[_P]);
  }
  if (output.Tag === "") {
    contents[_Tag] = [];
  } else if (output[_Ta] != null) {
    contents[_Tag] = de_TagSet(getArrayIfSingleItem(output[_Ta]), context);
  }
  return contents;
};
var de_IntelligentTieringConfiguration = (output, context) => {
  const contents = {};
  if (output[_I] != null) {
    contents[_I] = expectString(output[_I]);
  }
  if (output[_F] != null) {
    contents[_F] = de_IntelligentTieringFilter(output[_F], context);
  }
  if (output[_S] != null) {
    contents[_S] = expectString(output[_S]);
  }
  if (output.Tiering === "") {
    contents[_Tie] = [];
  } else if (output[_Tier] != null) {
    contents[_Tie] = de_TieringList(getArrayIfSingleItem(output[_Tier]), context);
  }
  return contents;
};
var de_IntelligentTieringConfigurationList = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_IntelligentTieringConfiguration(entry, context);
  });
};
var de_IntelligentTieringFilter = (output, context) => {
  const contents = {};
  if (output[_P] != null) {
    contents[_P] = expectString(output[_P]);
  }
  if (output[_Ta] != null) {
    contents[_Ta] = de_Tag(output[_Ta], context);
  }
  if (output[_A] != null) {
    contents[_A] = de_IntelligentTieringAndOperator(output[_A], context);
  }
  return contents;
};
var de_InventoryConfiguration = (output, context) => {
  const contents = {};
  if (output[_Des] != null) {
    contents[_Des] = de_InventoryDestination(output[_Des], context);
  }
  if (output[_IE] != null) {
    contents[_IE] = parseBoolean(output[_IE]);
  }
  if (output[_F] != null) {
    contents[_F] = de_InventoryFilter(output[_F], context);
  }
  if (output[_I] != null) {
    contents[_I] = expectString(output[_I]);
  }
  if (output[_IOV] != null) {
    contents[_IOV] = expectString(output[_IOV]);
  }
  if (output.OptionalFields === "") {
    contents[_OF] = [];
  } else if (output[_OF] != null && output[_OF][_Fi] != null) {
    contents[_OF] = de_InventoryOptionalFields(getArrayIfSingleItem(output[_OF][_Fi]), context);
  }
  if (output[_Sc] != null) {
    contents[_Sc] = de_InventorySchedule(output[_Sc], context);
  }
  return contents;
};
var de_InventoryConfigurationList = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_InventoryConfiguration(entry, context);
  });
};
var de_InventoryDestination = (output, context) => {
  const contents = {};
  if (output[_SBD] != null) {
    contents[_SBD] = de_InventoryS3BucketDestination(output[_SBD], context);
  }
  return contents;
};
var de_InventoryEncryption = (output, context) => {
  const contents = {};
  if (output[_SS] != null) {
    contents[_SSES] = de_SSES3(output[_SS], context);
  }
  if (output[_SK] != null) {
    contents[_SSEKMS] = de_SSEKMS(output[_SK], context);
  }
  return contents;
};
var de_InventoryFilter = (output, context) => {
  const contents = {};
  if (output[_P] != null) {
    contents[_P] = expectString(output[_P]);
  }
  return contents;
};
var de_InventoryOptionalFields = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return expectString(entry);
  });
};
var de_InventoryS3BucketDestination = (output, context) => {
  const contents = {};
  if (output[_AIc] != null) {
    contents[_AIc] = expectString(output[_AIc]);
  }
  if (output[_B] != null) {
    contents[_B] = expectString(output[_B]);
  }
  if (output[_Fo] != null) {
    contents[_Fo] = expectString(output[_Fo]);
  }
  if (output[_P] != null) {
    contents[_P] = expectString(output[_P]);
  }
  if (output[_En] != null) {
    contents[_En] = de_InventoryEncryption(output[_En], context);
  }
  return contents;
};
var de_InventorySchedule = (output, context) => {
  const contents = {};
  if (output[_Fr] != null) {
    contents[_Fr] = expectString(output[_Fr]);
  }
  return contents;
};
var de_LambdaFunctionConfiguration = (output, context) => {
  const contents = {};
  if (output[_I] != null) {
    contents[_I] = expectString(output[_I]);
  }
  if (output[_CF] != null) {
    contents[_LFA] = expectString(output[_CF]);
  }
  if (output.Event === "") {
    contents[_Eve] = [];
  } else if (output[_Ev] != null) {
    contents[_Eve] = de_EventList(getArrayIfSingleItem(output[_Ev]), context);
  }
  if (output[_F] != null) {
    contents[_F] = de_NotificationConfigurationFilter(output[_F], context);
  }
  return contents;
};
var de_LambdaFunctionConfigurationList = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_LambdaFunctionConfiguration(entry, context);
  });
};
var de_LifecycleExpiration = (output, context) => {
  const contents = {};
  if (output[_Dat] != null) {
    contents[_Dat] = expectNonNull(parseRfc3339DateTimeWithOffset(output[_Dat]));
  }
  if (output[_Da] != null) {
    contents[_Da] = strictParseInt32(output[_Da]);
  }
  if (output[_EODM] != null) {
    contents[_EODM] = parseBoolean(output[_EODM]);
  }
  return contents;
};
var de_LifecycleRule = (output, context) => {
  const contents = {};
  if (output[_Exp] != null) {
    contents[_Exp] = de_LifecycleExpiration(output[_Exp], context);
  }
  if (output[_ID_] != null) {
    contents[_ID_] = expectString(output[_ID_]);
  }
  if (output[_P] != null) {
    contents[_P] = expectString(output[_P]);
  }
  if (output[_F] != null) {
    contents[_F] = de_LifecycleRuleFilter(output[_F], context);
  }
  if (output[_S] != null) {
    contents[_S] = expectString(output[_S]);
  }
  if (output.Transition === "") {
    contents[_Tr] = [];
  } else if (output[_Tra] != null) {
    contents[_Tr] = de_TransitionList(getArrayIfSingleItem(output[_Tra]), context);
  }
  if (output.NoncurrentVersionTransition === "") {
    contents[_NVT] = [];
  } else if (output[_NVTo] != null) {
    contents[_NVT] = de_NoncurrentVersionTransitionList(getArrayIfSingleItem(output[_NVTo]), context);
  }
  if (output[_NVE] != null) {
    contents[_NVE] = de_NoncurrentVersionExpiration(output[_NVE], context);
  }
  if (output[_AIMU] != null) {
    contents[_AIMU] = de_AbortIncompleteMultipartUpload(output[_AIMU], context);
  }
  return contents;
};
var de_LifecycleRuleAndOperator = (output, context) => {
  const contents = {};
  if (output[_P] != null) {
    contents[_P] = expectString(output[_P]);
  }
  if (output.Tag === "") {
    contents[_Tag] = [];
  } else if (output[_Ta] != null) {
    contents[_Tag] = de_TagSet(getArrayIfSingleItem(output[_Ta]), context);
  }
  if (output[_OSGT] != null) {
    contents[_OSGT] = strictParseLong(output[_OSGT]);
  }
  if (output[_OSLT] != null) {
    contents[_OSLT] = strictParseLong(output[_OSLT]);
  }
  return contents;
};
var de_LifecycleRuleFilter = (output, context) => {
  const contents = {};
  if (output[_P] != null) {
    contents[_P] = expectString(output[_P]);
  }
  if (output[_Ta] != null) {
    contents[_Ta] = de_Tag(output[_Ta], context);
  }
  if (output[_OSGT] != null) {
    contents[_OSGT] = strictParseLong(output[_OSGT]);
  }
  if (output[_OSLT] != null) {
    contents[_OSLT] = strictParseLong(output[_OSLT]);
  }
  if (output[_A] != null) {
    contents[_A] = de_LifecycleRuleAndOperator(output[_A], context);
  }
  return contents;
};
var de_LifecycleRules = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_LifecycleRule(entry, context);
  });
};
var de_LoggingEnabled = (output, context) => {
  const contents = {};
  if (output[_TB] != null) {
    contents[_TB] = expectString(output[_TB]);
  }
  if (output.TargetGrants === "") {
    contents[_TG] = [];
  } else if (output[_TG] != null && output[_TG][_G] != null) {
    contents[_TG] = de_TargetGrants(getArrayIfSingleItem(output[_TG][_G]), context);
  }
  if (output[_TP] != null) {
    contents[_TP] = expectString(output[_TP]);
  }
  if (output[_TOKF] != null) {
    contents[_TOKF] = de_TargetObjectKeyFormat(output[_TOKF], context);
  }
  return contents;
};
var de_MetadataTableConfigurationResult = (output, context) => {
  const contents = {};
  if (output[_STDR] != null) {
    contents[_STDR] = de_S3TablesDestinationResult(output[_STDR], context);
  }
  return contents;
};
var de_Metrics = (output, context) => {
  const contents = {};
  if (output[_S] != null) {
    contents[_S] = expectString(output[_S]);
  }
  if (output[_ETv] != null) {
    contents[_ETv] = de_ReplicationTimeValue(output[_ETv], context);
  }
  return contents;
};
var de_MetricsAndOperator = (output, context) => {
  const contents = {};
  if (output[_P] != null) {
    contents[_P] = expectString(output[_P]);
  }
  if (output.Tag === "") {
    contents[_Tag] = [];
  } else if (output[_Ta] != null) {
    contents[_Tag] = de_TagSet(getArrayIfSingleItem(output[_Ta]), context);
  }
  if (output[_APAc] != null) {
    contents[_APAc] = expectString(output[_APAc]);
  }
  return contents;
};
var de_MetricsConfiguration = (output, context) => {
  const contents = {};
  if (output[_I] != null) {
    contents[_I] = expectString(output[_I]);
  }
  if (output.Filter === "") {
  } else if (output[_F] != null) {
    contents[_F] = de_MetricsFilter(expectUnion(output[_F]), context);
  }
  return contents;
};
var de_MetricsConfigurationList = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_MetricsConfiguration(entry, context);
  });
};
var de_MetricsFilter = (output, context) => {
  if (output[_P] != null) {
    return {
      Prefix: expectString(output[_P])
    };
  }
  if (output[_Ta] != null) {
    return {
      Tag: de_Tag(output[_Ta], context)
    };
  }
  if (output[_APAc] != null) {
    return {
      AccessPointArn: expectString(output[_APAc])
    };
  }
  if (output[_A] != null) {
    return {
      And: de_MetricsAndOperator(output[_A], context)
    };
  }
  return { $unknown: Object.entries(output)[0] };
};
var de_MultipartUpload = (output, context) => {
  const contents = {};
  if (output[_UI] != null) {
    contents[_UI] = expectString(output[_UI]);
  }
  if (output[_K] != null) {
    contents[_K] = expectString(output[_K]);
  }
  if (output[_Ini] != null) {
    contents[_Ini] = expectNonNull(parseRfc3339DateTimeWithOffset(output[_Ini]));
  }
  if (output[_SC] != null) {
    contents[_SC] = expectString(output[_SC]);
  }
  if (output[_O] != null) {
    contents[_O] = de_Owner(output[_O], context);
  }
  if (output[_In] != null) {
    contents[_In] = de_Initiator(output[_In], context);
  }
  if (output[_CA] != null) {
    contents[_CA] = expectString(output[_CA]);
  }
  if (output[_CT] != null) {
    contents[_CT] = expectString(output[_CT]);
  }
  return contents;
};
var de_MultipartUploadList = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_MultipartUpload(entry, context);
  });
};
var de_NoncurrentVersionExpiration = (output, context) => {
  const contents = {};
  if (output[_ND] != null) {
    contents[_ND] = strictParseInt32(output[_ND]);
  }
  if (output[_NNV] != null) {
    contents[_NNV] = strictParseInt32(output[_NNV]);
  }
  return contents;
};
var de_NoncurrentVersionTransition = (output, context) => {
  const contents = {};
  if (output[_ND] != null) {
    contents[_ND] = strictParseInt32(output[_ND]);
  }
  if (output[_SC] != null) {
    contents[_SC] = expectString(output[_SC]);
  }
  if (output[_NNV] != null) {
    contents[_NNV] = strictParseInt32(output[_NNV]);
  }
  return contents;
};
var de_NoncurrentVersionTransitionList = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_NoncurrentVersionTransition(entry, context);
  });
};
var de_NotificationConfigurationFilter = (output, context) => {
  const contents = {};
  if (output[_SKe] != null) {
    contents[_K] = de_S3KeyFilter(output[_SKe], context);
  }
  return contents;
};
var de__Object = (output, context) => {
  const contents = {};
  if (output[_K] != null) {
    contents[_K] = expectString(output[_K]);
  }
  if (output[_LM] != null) {
    contents[_LM] = expectNonNull(parseRfc3339DateTimeWithOffset(output[_LM]));
  }
  if (output[_ETa] != null) {
    contents[_ETa] = expectString(output[_ETa]);
  }
  if (output.ChecksumAlgorithm === "") {
    contents[_CA] = [];
  } else if (output[_CA] != null) {
    contents[_CA] = de_ChecksumAlgorithmList(getArrayIfSingleItem(output[_CA]), context);
  }
  if (output[_CT] != null) {
    contents[_CT] = expectString(output[_CT]);
  }
  if (output[_Si] != null) {
    contents[_Si] = strictParseLong(output[_Si]);
  }
  if (output[_SC] != null) {
    contents[_SC] = expectString(output[_SC]);
  }
  if (output[_O] != null) {
    contents[_O] = de_Owner(output[_O], context);
  }
  if (output[_RSe] != null) {
    contents[_RSe] = de_RestoreStatus(output[_RSe], context);
  }
  return contents;
};
var de_ObjectList = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de__Object(entry, context);
  });
};
var de_ObjectLockConfiguration = (output, context) => {
  const contents = {};
  if (output[_OLE] != null) {
    contents[_OLE] = expectString(output[_OLE]);
  }
  if (output[_Ru] != null) {
    contents[_Ru] = de_ObjectLockRule(output[_Ru], context);
  }
  return contents;
};
var de_ObjectLockLegalHold = (output, context) => {
  const contents = {};
  if (output[_S] != null) {
    contents[_S] = expectString(output[_S]);
  }
  return contents;
};
var de_ObjectLockRetention = (output, context) => {
  const contents = {};
  if (output[_Mo] != null) {
    contents[_Mo] = expectString(output[_Mo]);
  }
  if (output[_RUD] != null) {
    contents[_RUD] = expectNonNull(parseRfc3339DateTimeWithOffset(output[_RUD]));
  }
  return contents;
};
var de_ObjectLockRule = (output, context) => {
  const contents = {};
  if (output[_DRe] != null) {
    contents[_DRe] = de_DefaultRetention(output[_DRe], context);
  }
  return contents;
};
var de_ObjectPart = (output, context) => {
  const contents = {};
  if (output[_PN] != null) {
    contents[_PN] = strictParseInt32(output[_PN]);
  }
  if (output[_Si] != null) {
    contents[_Si] = strictParseLong(output[_Si]);
  }
  if (output[_CCRC] != null) {
    contents[_CCRC] = expectString(output[_CCRC]);
  }
  if (output[_CCRCC] != null) {
    contents[_CCRCC] = expectString(output[_CCRCC]);
  }
  if (output[_CCRCNVME] != null) {
    contents[_CCRCNVME] = expectString(output[_CCRCNVME]);
  }
  if (output[_CSHA] != null) {
    contents[_CSHA] = expectString(output[_CSHA]);
  }
  if (output[_CSHAh] != null) {
    contents[_CSHAh] = expectString(output[_CSHAh]);
  }
  return contents;
};
var de_ObjectVersion = (output, context) => {
  const contents = {};
  if (output[_ETa] != null) {
    contents[_ETa] = expectString(output[_ETa]);
  }
  if (output.ChecksumAlgorithm === "") {
    contents[_CA] = [];
  } else if (output[_CA] != null) {
    contents[_CA] = de_ChecksumAlgorithmList(getArrayIfSingleItem(output[_CA]), context);
  }
  if (output[_CT] != null) {
    contents[_CT] = expectString(output[_CT]);
  }
  if (output[_Si] != null) {
    contents[_Si] = strictParseLong(output[_Si]);
  }
  if (output[_SC] != null) {
    contents[_SC] = expectString(output[_SC]);
  }
  if (output[_K] != null) {
    contents[_K] = expectString(output[_K]);
  }
  if (output[_VI] != null) {
    contents[_VI] = expectString(output[_VI]);
  }
  if (output[_IL] != null) {
    contents[_IL] = parseBoolean(output[_IL]);
  }
  if (output[_LM] != null) {
    contents[_LM] = expectNonNull(parseRfc3339DateTimeWithOffset(output[_LM]));
  }
  if (output[_O] != null) {
    contents[_O] = de_Owner(output[_O], context);
  }
  if (output[_RSe] != null) {
    contents[_RSe] = de_RestoreStatus(output[_RSe], context);
  }
  return contents;
};
var de_ObjectVersionList = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ObjectVersion(entry, context);
  });
};
var de_Owner = (output, context) => {
  const contents = {};
  if (output[_DN] != null) {
    contents[_DN] = expectString(output[_DN]);
  }
  if (output[_ID_] != null) {
    contents[_ID_] = expectString(output[_ID_]);
  }
  return contents;
};
var de_OwnershipControls = (output, context) => {
  const contents = {};
  if (output.Rule === "") {
    contents[_Rul] = [];
  } else if (output[_Ru] != null) {
    contents[_Rul] = de_OwnershipControlsRules(getArrayIfSingleItem(output[_Ru]), context);
  }
  return contents;
};
var de_OwnershipControlsRule = (output, context) => {
  const contents = {};
  if (output[_OO] != null) {
    contents[_OO] = expectString(output[_OO]);
  }
  return contents;
};
var de_OwnershipControlsRules = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_OwnershipControlsRule(entry, context);
  });
};
var de_Part = (output, context) => {
  const contents = {};
  if (output[_PN] != null) {
    contents[_PN] = strictParseInt32(output[_PN]);
  }
  if (output[_LM] != null) {
    contents[_LM] = expectNonNull(parseRfc3339DateTimeWithOffset(output[_LM]));
  }
  if (output[_ETa] != null) {
    contents[_ETa] = expectString(output[_ETa]);
  }
  if (output[_Si] != null) {
    contents[_Si] = strictParseLong(output[_Si]);
  }
  if (output[_CCRC] != null) {
    contents[_CCRC] = expectString(output[_CCRC]);
  }
  if (output[_CCRCC] != null) {
    contents[_CCRCC] = expectString(output[_CCRCC]);
  }
  if (output[_CCRCNVME] != null) {
    contents[_CCRCNVME] = expectString(output[_CCRCNVME]);
  }
  if (output[_CSHA] != null) {
    contents[_CSHA] = expectString(output[_CSHA]);
  }
  if (output[_CSHAh] != null) {
    contents[_CSHAh] = expectString(output[_CSHAh]);
  }
  return contents;
};
var de_PartitionedPrefix = (output, context) => {
  const contents = {};
  if (output[_PDS] != null) {
    contents[_PDS] = expectString(output[_PDS]);
  }
  return contents;
};
var de_Parts = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_Part(entry, context);
  });
};
var de_PartsList = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ObjectPart(entry, context);
  });
};
var de_PolicyStatus = (output, context) => {
  const contents = {};
  if (output[_IP] != null) {
    contents[_IP] = parseBoolean(output[_IP]);
  }
  return contents;
};
var de_Progress = (output, context) => {
  const contents = {};
  if (output[_BS] != null) {
    contents[_BS] = strictParseLong(output[_BS]);
  }
  if (output[_BP] != null) {
    contents[_BP] = strictParseLong(output[_BP]);
  }
  if (output[_BRy] != null) {
    contents[_BRy] = strictParseLong(output[_BRy]);
  }
  return contents;
};
var de_PublicAccessBlockConfiguration = (output, context) => {
  const contents = {};
  if (output[_BPA] != null) {
    contents[_BPA] = parseBoolean(output[_BPA]);
  }
  if (output[_IPA] != null) {
    contents[_IPA] = parseBoolean(output[_IPA]);
  }
  if (output[_BPP] != null) {
    contents[_BPP] = parseBoolean(output[_BPP]);
  }
  if (output[_RPB] != null) {
    contents[_RPB] = parseBoolean(output[_RPB]);
  }
  return contents;
};
var de_QueueConfiguration = (output, context) => {
  const contents = {};
  if (output[_I] != null) {
    contents[_I] = expectString(output[_I]);
  }
  if (output[_Qu] != null) {
    contents[_QA] = expectString(output[_Qu]);
  }
  if (output.Event === "") {
    contents[_Eve] = [];
  } else if (output[_Ev] != null) {
    contents[_Eve] = de_EventList(getArrayIfSingleItem(output[_Ev]), context);
  }
  if (output[_F] != null) {
    contents[_F] = de_NotificationConfigurationFilter(output[_F], context);
  }
  return contents;
};
var de_QueueConfigurationList = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_QueueConfiguration(entry, context);
  });
};
var de_Redirect = (output, context) => {
  const contents = {};
  if (output[_HN] != null) {
    contents[_HN] = expectString(output[_HN]);
  }
  if (output[_HRC] != null) {
    contents[_HRC] = expectString(output[_HRC]);
  }
  if (output[_Pr] != null) {
    contents[_Pr] = expectString(output[_Pr]);
  }
  if (output[_RKPW] != null) {
    contents[_RKPW] = expectString(output[_RKPW]);
  }
  if (output[_RKW] != null) {
    contents[_RKW] = expectString(output[_RKW]);
  }
  return contents;
};
var de_RedirectAllRequestsTo = (output, context) => {
  const contents = {};
  if (output[_HN] != null) {
    contents[_HN] = expectString(output[_HN]);
  }
  if (output[_Pr] != null) {
    contents[_Pr] = expectString(output[_Pr]);
  }
  return contents;
};
var de_ReplicaModifications = (output, context) => {
  const contents = {};
  if (output[_S] != null) {
    contents[_S] = expectString(output[_S]);
  }
  return contents;
};
var de_ReplicationConfiguration = (output, context) => {
  const contents = {};
  if (output[_Ro] != null) {
    contents[_Ro] = expectString(output[_Ro]);
  }
  if (output.Rule === "") {
    contents[_Rul] = [];
  } else if (output[_Ru] != null) {
    contents[_Rul] = de_ReplicationRules(getArrayIfSingleItem(output[_Ru]), context);
  }
  return contents;
};
var de_ReplicationRule = (output, context) => {
  const contents = {};
  if (output[_ID_] != null) {
    contents[_ID_] = expectString(output[_ID_]);
  }
  if (output[_Pri] != null) {
    contents[_Pri] = strictParseInt32(output[_Pri]);
  }
  if (output[_P] != null) {
    contents[_P] = expectString(output[_P]);
  }
  if (output[_F] != null) {
    contents[_F] = de_ReplicationRuleFilter(output[_F], context);
  }
  if (output[_S] != null) {
    contents[_S] = expectString(output[_S]);
  }
  if (output[_SSC] != null) {
    contents[_SSC] = de_SourceSelectionCriteria(output[_SSC], context);
  }
  if (output[_EOR] != null) {
    contents[_EOR] = de_ExistingObjectReplication(output[_EOR], context);
  }
  if (output[_Des] != null) {
    contents[_Des] = de_Destination(output[_Des], context);
  }
  if (output[_DMR] != null) {
    contents[_DMR] = de_DeleteMarkerReplication(output[_DMR], context);
  }
  return contents;
};
var de_ReplicationRuleAndOperator = (output, context) => {
  const contents = {};
  if (output[_P] != null) {
    contents[_P] = expectString(output[_P]);
  }
  if (output.Tag === "") {
    contents[_Tag] = [];
  } else if (output[_Ta] != null) {
    contents[_Tag] = de_TagSet(getArrayIfSingleItem(output[_Ta]), context);
  }
  return contents;
};
var de_ReplicationRuleFilter = (output, context) => {
  const contents = {};
  if (output[_P] != null) {
    contents[_P] = expectString(output[_P]);
  }
  if (output[_Ta] != null) {
    contents[_Ta] = de_Tag(output[_Ta], context);
  }
  if (output[_A] != null) {
    contents[_A] = de_ReplicationRuleAndOperator(output[_A], context);
  }
  return contents;
};
var de_ReplicationRules = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ReplicationRule(entry, context);
  });
};
var de_ReplicationTime = (output, context) => {
  const contents = {};
  if (output[_S] != null) {
    contents[_S] = expectString(output[_S]);
  }
  if (output[_Tim] != null) {
    contents[_Tim] = de_ReplicationTimeValue(output[_Tim], context);
  }
  return contents;
};
var de_ReplicationTimeValue = (output, context) => {
  const contents = {};
  if (output[_Mi] != null) {
    contents[_Mi] = strictParseInt32(output[_Mi]);
  }
  return contents;
};
var de_RestoreStatus = (output, context) => {
  const contents = {};
  if (output[_IRIP] != null) {
    contents[_IRIP] = parseBoolean(output[_IRIP]);
  }
  if (output[_RED] != null) {
    contents[_RED] = expectNonNull(parseRfc3339DateTimeWithOffset(output[_RED]));
  }
  return contents;
};
var de_RoutingRule = (output, context) => {
  const contents = {};
  if (output[_Con] != null) {
    contents[_Con] = de_Condition(output[_Con], context);
  }
  if (output[_Red] != null) {
    contents[_Red] = de_Redirect(output[_Red], context);
  }
  return contents;
};
var de_RoutingRules = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_RoutingRule(entry, context);
  });
};
var de_S3KeyFilter = (output, context) => {
  const contents = {};
  if (output.FilterRule === "") {
    contents[_FRi] = [];
  } else if (output[_FR] != null) {
    contents[_FRi] = de_FilterRuleList(getArrayIfSingleItem(output[_FR]), context);
  }
  return contents;
};
var de_S3TablesDestinationResult = (output, context) => {
  const contents = {};
  if (output[_TBA] != null) {
    contents[_TBA] = expectString(output[_TBA]);
  }
  if (output[_TN] != null) {
    contents[_TN] = expectString(output[_TN]);
  }
  if (output[_TAa] != null) {
    contents[_TAa] = expectString(output[_TAa]);
  }
  if (output[_TNa] != null) {
    contents[_TNa] = expectString(output[_TNa]);
  }
  return contents;
};
var de_ServerSideEncryptionByDefault = (output, context) => {
  const contents = {};
  if (output[_SSEA] != null) {
    contents[_SSEA] = expectString(output[_SSEA]);
  }
  if (output[_KMSMKID] != null) {
    contents[_KMSMKID] = expectString(output[_KMSMKID]);
  }
  return contents;
};
var de_ServerSideEncryptionConfiguration = (output, context) => {
  const contents = {};
  if (output.Rule === "") {
    contents[_Rul] = [];
  } else if (output[_Ru] != null) {
    contents[_Rul] = de_ServerSideEncryptionRules(getArrayIfSingleItem(output[_Ru]), context);
  }
  return contents;
};
var de_ServerSideEncryptionRule = (output, context) => {
  const contents = {};
  if (output[_ASSEBD] != null) {
    contents[_ASSEBD] = de_ServerSideEncryptionByDefault(output[_ASSEBD], context);
  }
  if (output[_BKE] != null) {
    contents[_BKE] = parseBoolean(output[_BKE]);
  }
  return contents;
};
var de_ServerSideEncryptionRules = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ServerSideEncryptionRule(entry, context);
  });
};
var de_SessionCredentials = (output, context) => {
  const contents = {};
  if (output[_AKI] != null) {
    contents[_AKI] = expectString(output[_AKI]);
  }
  if (output[_SAK] != null) {
    contents[_SAK] = expectString(output[_SAK]);
  }
  if (output[_ST] != null) {
    contents[_ST] = expectString(output[_ST]);
  }
  if (output[_Exp] != null) {
    contents[_Exp] = expectNonNull(parseRfc3339DateTimeWithOffset(output[_Exp]));
  }
  return contents;
};
var de_SimplePrefix = (output, context) => {
  const contents = {};
  return contents;
};
var de_SourceSelectionCriteria = (output, context) => {
  const contents = {};
  if (output[_SKEO] != null) {
    contents[_SKEO] = de_SseKmsEncryptedObjects(output[_SKEO], context);
  }
  if (output[_RM] != null) {
    contents[_RM] = de_ReplicaModifications(output[_RM], context);
  }
  return contents;
};
var de_SSEKMS = (output, context) => {
  const contents = {};
  if (output[_KI] != null) {
    contents[_KI] = expectString(output[_KI]);
  }
  return contents;
};
var de_SseKmsEncryptedObjects = (output, context) => {
  const contents = {};
  if (output[_S] != null) {
    contents[_S] = expectString(output[_S]);
  }
  return contents;
};
var de_SSES3 = (output, context) => {
  const contents = {};
  return contents;
};
var de_Stats = (output, context) => {
  const contents = {};
  if (output[_BS] != null) {
    contents[_BS] = strictParseLong(output[_BS]);
  }
  if (output[_BP] != null) {
    contents[_BP] = strictParseLong(output[_BP]);
  }
  if (output[_BRy] != null) {
    contents[_BRy] = strictParseLong(output[_BRy]);
  }
  return contents;
};
var de_StorageClassAnalysis = (output, context) => {
  const contents = {};
  if (output[_DE] != null) {
    contents[_DE] = de_StorageClassAnalysisDataExport(output[_DE], context);
  }
  return contents;
};
var de_StorageClassAnalysisDataExport = (output, context) => {
  const contents = {};
  if (output[_OSV] != null) {
    contents[_OSV] = expectString(output[_OSV]);
  }
  if (output[_Des] != null) {
    contents[_Des] = de_AnalyticsExportDestination(output[_Des], context);
  }
  return contents;
};
var de_Tag = (output, context) => {
  const contents = {};
  if (output[_K] != null) {
    contents[_K] = expectString(output[_K]);
  }
  if (output[_Va] != null) {
    contents[_Va] = expectString(output[_Va]);
  }
  return contents;
};
var de_TagSet = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_Tag(entry, context);
  });
};
var de_TargetGrant = (output, context) => {
  const contents = {};
  if (output[_Gra] != null) {
    contents[_Gra] = de_Grantee(output[_Gra], context);
  }
  if (output[_Pe] != null) {
    contents[_Pe] = expectString(output[_Pe]);
  }
  return contents;
};
var de_TargetGrants = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_TargetGrant(entry, context);
  });
};
var de_TargetObjectKeyFormat = (output, context) => {
  const contents = {};
  if (output[_SPi] != null) {
    contents[_SPi] = de_SimplePrefix(output[_SPi], context);
  }
  if (output[_PP] != null) {
    contents[_PP] = de_PartitionedPrefix(output[_PP], context);
  }
  return contents;
};
var de_Tiering = (output, context) => {
  const contents = {};
  if (output[_Da] != null) {
    contents[_Da] = strictParseInt32(output[_Da]);
  }
  if (output[_AT] != null) {
    contents[_AT] = expectString(output[_AT]);
  }
  return contents;
};
var de_TieringList = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_Tiering(entry, context);
  });
};
var de_TopicConfiguration = (output, context) => {
  const contents = {};
  if (output[_I] != null) {
    contents[_I] = expectString(output[_I]);
  }
  if (output[_Top] != null) {
    contents[_TA] = expectString(output[_Top]);
  }
  if (output.Event === "") {
    contents[_Eve] = [];
  } else if (output[_Ev] != null) {
    contents[_Eve] = de_EventList(getArrayIfSingleItem(output[_Ev]), context);
  }
  if (output[_F] != null) {
    contents[_F] = de_NotificationConfigurationFilter(output[_F], context);
  }
  return contents;
};
var de_TopicConfigurationList = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_TopicConfiguration(entry, context);
  });
};
var de_Transition = (output, context) => {
  const contents = {};
  if (output[_Dat] != null) {
    contents[_Dat] = expectNonNull(parseRfc3339DateTimeWithOffset(output[_Dat]));
  }
  if (output[_Da] != null) {
    contents[_Da] = strictParseInt32(output[_Da]);
  }
  if (output[_SC] != null) {
    contents[_SC] = expectString(output[_SC]);
  }
  return contents;
};
var de_TransitionList = (output, context) => {
  return (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_Transition(entry, context);
  });
};
var deserializeMetadata = (output) => ({
  httpStatusCode: output.statusCode,
  requestId: output.headers["x-amzn-requestid"] ?? output.headers["x-amzn-request-id"] ?? output.headers["x-amz-request-id"],
  extendedRequestId: output.headers["x-amz-id-2"],
  cfId: output.headers["x-amz-cf-id"]
});
var collectBodyString = (streamBody, context) => collectBody(streamBody, context).then((body) => context.utf8Encoder(body));
var _A = "And";
var _AAO = "AnalyticsAndOperator";
var _AC = "AnalyticsConfiguration";
var _ACL = "ACL";
var _ACLc = "AccessControlList";
var _ACLn = "AnalyticsConfigurationList";
var _ACP = "AccessControlPolicy";
var _ACT = "AccessControlTranslation";
var _ACc = "AccelerateConfiguration";
var _AD = "AbortDate";
var _AED = "AnalyticsExportDestination";
var _AF = "AnalyticsFilter";
var _AH = "AllowedHeader";
var _AHl = "AllowedHeaders";
var _AI = "AnalyticsId";
var _AIMU = "AbortIncompleteMultipartUpload";
var _AIc = "AccountId";
var _AKI = "AccessKeyId";
var _AM = "AllowedMethod";
var _AMl = "AllowedMethods";
var _AO = "AllowedOrigin";
var _AOl = "AllowedOrigins";
var _APA = "AccessPointAlias";
var _APAc = "AccessPointArn";
var _AQRD = "AllowQuotedRecordDelimiter";
var _AR = "AcceptRanges";
var _ARI = "AbortRuleId";
var _AS = "ArchiveStatus";
var _ASBD = "AnalyticsS3BucketDestination";
var _ASEFF = "AnalyticsS3ExportFileFormat";
var _ASSEBD = "ApplyServerSideEncryptionByDefault";
var _AT = "AccessTier";
var _Ac = "Account";
var _B = "Bucket";
var _BAI = "BucketAccountId";
var _BAS = "BucketAccelerateStatus";
var _BGR = "BypassGovernanceRetention";
var _BI = "BucketInfo";
var _BKE = "BucketKeyEnabled";
var _BLC = "BucketLifecycleConfiguration";
var _BLCu = "BucketLocationConstraint";
var _BLN = "BucketLocationName";
var _BLP = "BucketLogsPermission";
var _BLS = "BucketLoggingStatus";
var _BLT = "BucketLocationType";
var _BN = "BucketName";
var _BP = "BytesProcessed";
var _BPA = "BlockPublicAcls";
var _BPP = "BlockPublicPolicy";
var _BR = "BucketRegion";
var _BRy = "BytesReturned";
var _BS = "BytesScanned";
var _BT = "BucketType";
var _BVS = "BucketVersioningStatus";
var _Bu = "Buckets";
var _C = "Credentials";
var _CA = "ChecksumAlgorithm";
var _CACL = "CannedACL";
var _CBC = "CreateBucketConfiguration";
var _CC = "CacheControl";
var _CCRC = "ChecksumCRC32";
var _CCRCC = "ChecksumCRC32C";
var _CCRCNVME = "ChecksumCRC64NVME";
var _CD = "ContentDisposition";
var _CDr = "CreationDate";
var _CE = "ContentEncoding";
var _CF = "CloudFunction";
var _CFC = "CloudFunctionConfiguration";
var _CL = "ContentLanguage";
var _CLo = "ContentLength";
var _CM = "ChecksumMode";
var _CMD = "ContentMD5";
var _CMU = "CompletedMultipartUpload";
var _CORSC = "CORSConfiguration";
var _CORSR = "CORSRule";
var _CORSRu = "CORSRules";
var _CP = "CommonPrefixes";
var _CPo = "CompletedPart";
var _CR = "ContentRange";
var _CRSBA = "ConfirmRemoveSelfBucketAccess";
var _CS = "CopySource";
var _CSHA = "ChecksumSHA1";
var _CSHAh = "ChecksumSHA256";
var _CSIM = "CopySourceIfMatch";
var _CSIMS = "CopySourceIfModifiedSince";
var _CSINM = "CopySourceIfNoneMatch";
var _CSIUS = "CopySourceIfUnmodifiedSince";
var _CSR = "CopySourceRange";
var _CSSSECA = "CopySourceSSECustomerAlgorithm";
var _CSSSECK = "CopySourceSSECustomerKey";
var _CSSSECKMD = "CopySourceSSECustomerKeyMD5";
var _CSV = "CSV";
var _CSVI = "CopySourceVersionId";
var _CSVIn = "CSVInput";
var _CSVO = "CSVOutput";
var _CT = "ChecksumType";
var _CTo = "ContentType";
var _CTom = "CompressionType";
var _CTon = "ContinuationToken";
var _Ch = "Checksum";
var _Co = "Contents";
var _Cod = "Code";
var _Com = "Comments";
var _Con = "Condition";
var _D = "Delimiter";
var _DAI = "DaysAfterInitiation";
var _DE = "DataExport";
var _DM = "DeleteMarker";
var _DMR = "DeleteMarkerReplication";
var _DMRS = "DeleteMarkerReplicationStatus";
var _DMVI = "DeleteMarkerVersionId";
var _DMe = "DeleteMarkers";
var _DN = "DisplayName";
var _DR = "DataRedundancy";
var _DRe = "DefaultRetention";
var _Da = "Days";
var _Dat = "Date";
var _De = "Deleted";
var _Del = "Delete";
var _Des = "Destination";
var _Desc = "Description";
var _E = "Expires";
var _EA = "EmailAddress";
var _EBC = "EventBridgeConfiguration";
var _EBO = "ExpectedBucketOwner";
var _EC = "ErrorCode";
var _ECn = "EncryptionConfiguration";
var _ED = "ErrorDocument";
var _EH = "ExposeHeaders";
var _EHx = "ExposeHeader";
var _EM = "ErrorMessage";
var _EODM = "ExpiredObjectDeleteMarker";
var _EOR = "ExistingObjectReplication";
var _EORS = "ExistingObjectReplicationStatus";
var _ERP = "EnableRequestProgress";
var _ES = "ExpiresString";
var _ESBO = "ExpectedSourceBucketOwner";
var _ESx = "ExpirationStatus";
var _ET = "EncodingType";
var _ETa = "ETag";
var _ETn = "EncryptionType";
var _ETv = "EventThreshold";
var _ETx = "ExpressionType";
var _En = "Encryption";
var _Ena = "Enabled";
var _End = "End";
var _Er = "Error";
var _Err = "Errors";
var _Ev = "Event";
var _Eve = "Events";
var _Ex = "Expression";
var _Exp = "Expiration";
var _F = "Filter";
var _FD = "FieldDelimiter";
var _FHI = "FileHeaderInfo";
var _FO = "FetchOwner";
var _FR = "FilterRule";
var _FRN = "FilterRuleName";
var _FRV = "FilterRuleValue";
var _FRi = "FilterRules";
var _Fi = "Field";
var _Fo = "Format";
var _Fr = "Frequency";
var _G = "Grant";
var _GFC = "GrantFullControl";
var _GJP = "GlacierJobParameters";
var _GR = "GrantRead";
var _GRACP = "GrantReadACP";
var _GW = "GrantWrite";
var _GWACP = "GrantWriteACP";
var _Gr = "Grants";
var _Gra = "Grantee";
var _HECRE = "HttpErrorCodeReturnedEquals";
var _HN = "HostName";
var _HRC = "HttpRedirectCode";
var _I = "Id";
var _IC = "InventoryConfiguration";
var _ICL = "InventoryConfigurationList";
var _ID = "IndexDocument";
var _ID_ = "ID";
var _IDn = "InventoryDestination";
var _IE = "IsEnabled";
var _IEn = "InventoryEncryption";
var _IF = "InventoryFilter";
var _IFn = "InventoryFormat";
var _IFnv = "InventoryFrequency";
var _II = "InventoryId";
var _IIOV = "InventoryIncludedObjectVersions";
var _IL = "IsLatest";
var _IM = "IfMatch";
var _IMIT = "IfMatchInitiatedTime";
var _IMLMT = "IfMatchLastModifiedTime";
var _IMS = "IfMatchSize";
var _IMSf = "IfModifiedSince";
var _INM = "IfNoneMatch";
var _IOF = "InventoryOptionalField";
var _IOV = "IncludedObjectVersions";
var _IP = "IsPublic";
var _IPA = "IgnorePublicAcls";
var _IRIP = "IsRestoreInProgress";
var _IS = "InputSerialization";
var _ISBD = "InventoryS3BucketDestination";
var _ISn = "InventorySchedule";
var _IT = "IsTruncated";
var _ITAO = "IntelligentTieringAndOperator";
var _ITAT = "IntelligentTieringAccessTier";
var _ITC = "IntelligentTieringConfiguration";
var _ITCL = "IntelligentTieringConfigurationList";
var _ITD = "IntelligentTieringDays";
var _ITF = "IntelligentTieringFilter";
var _ITI = "IntelligentTieringId";
var _ITS = "IntelligentTieringStatus";
var _IUS = "IfUnmodifiedSince";
var _In = "Initiator";
var _Ini = "Initiated";
var _JSON = "JSON";
var _JSONI = "JSONInput";
var _JSONO = "JSONOutput";
var _JSONT = "JSONType";
var _K = "Key";
var _KC = "KeyCount";
var _KI = "KeyId";
var _KM = "KeyMarker";
var _KMSC = "KMSContext";
var _KMSKI = "KMSKeyId";
var _KMSMKID = "KMSMasterKeyID";
var _KPE = "KeyPrefixEquals";
var _L = "Location";
var _LC = "LocationConstraint";
var _LE = "LoggingEnabled";
var _LEi = "LifecycleExpiration";
var _LFA = "LambdaFunctionArn";
var _LFC = "LambdaFunctionConfigurations";
var _LFCa = "LambdaFunctionConfiguration";
var _LI = "LocationInfo";
var _LM = "LastModified";
var _LMT = "LastModifiedTime";
var _LNAS = "LocationNameAsString";
var _LP = "LocationPrefix";
var _LR = "LifecycleRule";
var _LRAO = "LifecycleRuleAndOperator";
var _LRF = "LifecycleRuleFilter";
var _LT = "LocationType";
var _M = "Marker";
var _MAO = "MetricsAndOperator";
var _MAS = "MaxAgeSeconds";
var _MB = "MaxBuckets";
var _MC = "MetricsConfiguration";
var _MCL = "MetricsConfigurationList";
var _MD = "MetadataDirective";
var _MDB = "MaxDirectoryBuckets";
var _MDf = "MfaDelete";
var _ME = "MetadataEntry";
var _MF = "MetricsFilter";
var _MFA = "MFA";
var _MFAD = "MFADelete";
var _MI = "MetricsId";
var _MK = "MaxKeys";
var _MKe = "MetadataKey";
var _MM = "MissingMeta";
var _MOS = "MpuObjectSize";
var _MP = "MaxParts";
var _MS = "MetricsStatus";
var _MTC = "MetadataTableConfiguration";
var _MTCR = "MetadataTableConfigurationResult";
var _MU = "MaxUploads";
var _MV = "MetadataValue";
var _Me = "Metrics";
var _Mes = "Message";
var _Mi = "Minutes";
var _Mo = "Mode";
var _N = "Name";
var _NC = "NotificationConfiguration";
var _NCF = "NotificationConfigurationFilter";
var _NCT = "NextContinuationToken";
var _ND = "NoncurrentDays";
var _NI = "NotificationId";
var _NKM = "NextKeyMarker";
var _NM = "NextMarker";
var _NNV = "NewerNoncurrentVersions";
var _NPNM = "NextPartNumberMarker";
var _NUIM = "NextUploadIdMarker";
var _NVE = "NoncurrentVersionExpiration";
var _NVIM = "NextVersionIdMarker";
var _NVT = "NoncurrentVersionTransitions";
var _NVTo = "NoncurrentVersionTransition";
var _O = "Owner";
var _OA = "ObjectAttributes";
var _OC = "OwnershipControls";
var _OCACL = "ObjectCannedACL";
var _OCR = "OwnershipControlsRule";
var _OF = "OptionalFields";
var _OI = "ObjectIdentifier";
var _OK = "ObjectKey";
var _OL = "OutputLocation";
var _OLC = "ObjectLockConfiguration";
var _OLE = "ObjectLockEnabled";
var _OLEFB = "ObjectLockEnabledForBucket";
var _OLLH = "ObjectLockLegalHold";
var _OLLHS = "ObjectLockLegalHoldStatus";
var _OLM = "ObjectLockMode";
var _OLR = "ObjectLockRetention";
var _OLRM = "ObjectLockRetentionMode";
var _OLRUD = "ObjectLockRetainUntilDate";
var _OLRb = "ObjectLockRule";
var _OO = "ObjectOwnership";
var _OOA = "OptionalObjectAttributes";
var _OOw = "OwnerOverride";
var _OP = "ObjectParts";
var _OS = "OutputSerialization";
var _OSGT = "ObjectSizeGreaterThan";
var _OSGTB = "ObjectSizeGreaterThanBytes";
var _OSLT = "ObjectSizeLessThan";
var _OSLTB = "ObjectSizeLessThanBytes";
var _OSV = "OutputSchemaVersion";
var _OSb = "ObjectSize";
var _OVI = "ObjectVersionId";
var _Ob = "Objects";
var _P = "Prefix";
var _PABC = "PublicAccessBlockConfiguration";
var _PC = "PartsCount";
var _PDS = "PartitionDateSource";
var _PI = "ParquetInput";
var _PN = "PartNumber";
var _PNM = "PartNumberMarker";
var _PP = "PartitionedPrefix";
var _Pa = "Payer";
var _Par = "Part";
var _Parq = "Parquet";
var _Part = "Parts";
var _Pe = "Permission";
var _Pr = "Protocol";
var _Pri = "Priority";
var _Q = "Quiet";
var _QA = "QueueArn";
var _QC = "QueueConfiguration";
var _QCu = "QueueConfigurations";
var _QCuo = "QuoteCharacter";
var _QEC = "QuoteEscapeCharacter";
var _QF = "QuoteFields";
var _Qu = "Queue";
var _R = "Range";
var _RART = "RedirectAllRequestsTo";
var _RC = "RequestCharged";
var _RCC = "ResponseCacheControl";
var _RCD = "ResponseContentDisposition";
var _RCE = "ResponseContentEncoding";
var _RCL = "ResponseContentLanguage";
var _RCT = "ResponseContentType";
var _RCe = "ReplicationConfiguration";
var _RD = "RecordDelimiter";
var _RE = "ResponseExpires";
var _RED = "RestoreExpiryDate";
var _RKKID = "ReplicaKmsKeyID";
var _RKPW = "ReplaceKeyPrefixWith";
var _RKW = "ReplaceKeyWith";
var _RM = "ReplicaModifications";
var _RMS = "ReplicaModificationsStatus";
var _ROP = "RestoreOutputPath";
var _RP = "RequestPayer";
var _RPB = "RestrictPublicBuckets";
var _RPC = "RequestPaymentConfiguration";
var _RPe = "RequestProgress";
var _RR = "RequestRoute";
var _RRAO = "ReplicationRuleAndOperator";
var _RRF = "ReplicationRuleFilter";
var _RRS = "ReplicationRuleStatus";
var _RRT = "RestoreRequestType";
var _RRe = "ReplicationRule";
var _RRes = "RestoreRequest";
var _RRo = "RoutingRules";
var _RRou = "RoutingRule";
var _RS = "ReplicationStatus";
var _RSe = "RestoreStatus";
var _RT = "RequestToken";
var _RTS = "ReplicationTimeStatus";
var _RTV = "ReplicationTimeValue";
var _RTe = "ReplicationTime";
var _RUD = "RetainUntilDate";
var _Re = "Restore";
var _Red = "Redirect";
var _Ro = "Role";
var _Ru = "Rule";
var _Rul = "Rules";
var _S = "Status";
var _SA = "StartAfter";
var _SAK = "SecretAccessKey";
var _SBD = "S3BucketDestination";
var _SC = "StorageClass";
var _SCA = "StorageClassAnalysis";
var _SCADE = "StorageClassAnalysisDataExport";
var _SCASV = "StorageClassAnalysisSchemaVersion";
var _SCt = "StatusCode";
var _SDV = "SkipDestinationValidation";
var _SK = "SSE-KMS";
var _SKEO = "SseKmsEncryptedObjects";
var _SKEOS = "SseKmsEncryptedObjectsStatus";
var _SKF = "S3KeyFilter";
var _SKe = "S3Key";
var _SL = "S3Location";
var _SM = "SessionMode";
var _SOCR = "SelectObjectContentRequest";
var _SP = "SelectParameters";
var _SPi = "SimplePrefix";
var _SR = "ScanRange";
var _SS = "SSE-S3";
var _SSC = "SourceSelectionCriteria";
var _SSE = "ServerSideEncryption";
var _SSEA = "SSEAlgorithm";
var _SSEBD = "ServerSideEncryptionByDefault";
var _SSEC = "ServerSideEncryptionConfiguration";
var _SSECA = "SSECustomerAlgorithm";
var _SSECK = "SSECustomerKey";
var _SSECKMD = "SSECustomerKeyMD5";
var _SSEKMS = "SSEKMS";
var _SSEKMSEC = "SSEKMSEncryptionContext";
var _SSEKMSKI = "SSEKMSKeyId";
var _SSER = "ServerSideEncryptionRule";
var _SSES = "SSES3";
var _ST = "SessionToken";
var _STBA = "S3TablesBucketArn";
var _STD = "S3TablesDestination";
var _STDR = "S3TablesDestinationResult";
var _STN = "S3TablesName";
var _S_ = "S3";
var _Sc = "Schedule";
var _Se = "Setting";
var _Si = "Size";
var _St = "Start";
var _Su = "Suffix";
var _T = "Tagging";
var _TA = "TopicArn";
var _TAa = "TableArn";
var _TB = "TargetBucket";
var _TBA = "TableBucketArn";
var _TC = "TagCount";
var _TCo = "TopicConfiguration";
var _TCop = "TopicConfigurations";
var _TD = "TaggingDirective";
var _TDMOS = "TransitionDefaultMinimumObjectSize";
var _TG = "TargetGrants";
var _TGa = "TargetGrant";
var _TN = "TableName";
var _TNa = "TableNamespace";
var _TOKF = "TargetObjectKeyFormat";
var _TP = "TargetPrefix";
var _TPC = "TotalPartsCount";
var _TS = "TagSet";
var _TSC = "TransitionStorageClass";
var _Ta = "Tag";
var _Tag = "Tags";
var _Ti = "Tier";
var _Tie = "Tierings";
var _Tier = "Tiering";
var _Tim = "Time";
var _To = "Token";
var _Top = "Topic";
var _Tr = "Transitions";
var _Tra = "Transition";
var _Ty = "Type";
var _U = "Upload";
var _UI = "UploadId";
var _UIM = "UploadIdMarker";
var _UM = "UserMetadata";
var _URI = "URI";
var _Up = "Uploads";
var _V = "Version";
var _VC = "VersionCount";
var _VCe = "VersioningConfiguration";
var _VI = "VersionId";
var _VIM = "VersionIdMarker";
var _Va = "Value";
var _Ve = "Versions";
var _WC = "WebsiteConfiguration";
var _WOB = "WriteOffsetBytes";
var _WRL = "WebsiteRedirectLocation";
var _Y = "Years";
var _a = "analytics";
var _ac = "accelerate";
var _acl = "acl";
var _ar = "accept-ranges";
var _at = "attributes";
var _br = "bucket-region";
var _c = "cors";
var _cc = "cache-control";
var _cd = "content-disposition";
var _ce = "content-encoding";
var _cl = "content-language";
var _cl_ = "content-length";
var _cm = "content-md5";
var _cr = "content-range";
var _ct = "content-type";
var _ct_ = "continuation-token";
var _d = "delete";
var _de = "delimiter";
var _e = "expires";
var _en = "encryption";
var _et = "encoding-type";
var _eta = "etag";
var _ex = "expiresstring";
var _fo = "fetch-owner";
var _i = "id";
var _im = "if-match";
var _ims = "if-modified-since";
var _in = "inventory";
var _inm = "if-none-match";
var _it = "intelligent-tiering";
var _ius = "if-unmodified-since";
var _km = "key-marker";
var _l = "lifecycle";
var _lh = "legal-hold";
var _lm = "last-modified";
var _lo = "location";
var _log = "logging";
var _lt = "list-type";
var _m = "metrics";
var _mT = "metadataTable";
var _ma = "marker";
var _mb = "max-buckets";
var _mdb = "max-directory-buckets";
var _me = "member";
var _mk = "max-keys";
var _mp = "max-parts";
var _mu = "max-uploads";
var _n = "notification";
var _oC = "ownershipControls";
var _ol = "object-lock";
var _p = "policy";
var _pAB = "publicAccessBlock";
var _pN = "partNumber";
var _pS = "policyStatus";
var _pnm = "part-number-marker";
var _pr = "prefix";
var _r = "replication";
var _rP = "requestPayment";
var _ra = "range";
var _rcc = "response-cache-control";
var _rcd = "response-content-disposition";
var _rce = "response-content-encoding";
var _rcl = "response-content-language";
var _rct = "response-content-type";
var _re = "response-expires";
var _res = "restore";
var _ret = "retention";
var _s = "session";
var _sa = "start-after";
var _se = "select";
var _st = "select-type";
var _t = "tagging";
var _to = "torrent";
var _u = "uploads";
var _uI = "uploadId";
var _uim = "upload-id-marker";
var _v = "versioning";
var _vI = "versionId";
var _ve = '<?xml version="1.0" encoding="UTF-8"?>';
var _ver = "versions";
var _vim = "version-id-marker";
var _w = "website";
var _x = "xsi:type";
var _xaa = "x-amz-acl";
var _xaad = "x-amz-abort-date";
var _xaapa = "x-amz-access-point-alias";
var _xaari = "x-amz-abort-rule-id";
var _xaas = "x-amz-archive-status";
var _xabgr = "x-amz-bypass-governance-retention";
var _xabln = "x-amz-bucket-location-name";
var _xablt = "x-amz-bucket-location-type";
var _xabole = "x-amz-bucket-object-lock-enabled";
var _xabolt = "x-amz-bucket-object-lock-token";
var _xabr = "x-amz-bucket-region";
var _xaca = "x-amz-checksum-algorithm";
var _xacc = "x-amz-checksum-crc32";
var _xacc_ = "x-amz-checksum-crc32c";
var _xacc__ = "x-amz-checksum-crc64nvme";
var _xacm = "x-amz-checksum-mode";
var _xacrsba = "x-amz-confirm-remove-self-bucket-access";
var _xacs = "x-amz-checksum-sha1";
var _xacs_ = "x-amz-checksum-sha256";
var _xacs__ = "x-amz-copy-source";
var _xacsim = "x-amz-copy-source-if-match";
var _xacsims = "x-amz-copy-source-if-modified-since";
var _xacsinm = "x-amz-copy-source-if-none-match";
var _xacsius = "x-amz-copy-source-if-unmodified-since";
var _xacsm = "x-amz-create-session-mode";
var _xacsr = "x-amz-copy-source-range";
var _xacssseca = "x-amz-copy-source-server-side-encryption-customer-algorithm";
var _xacssseck = "x-amz-copy-source-server-side-encryption-customer-key";
var _xacssseckm = "x-amz-copy-source-server-side-encryption-customer-key-md5";
var _xacsvi = "x-amz-copy-source-version-id";
var _xact = "x-amz-checksum-type";
var _xadm = "x-amz-delete-marker";
var _xae = "x-amz-expiration";
var _xaebo = "x-amz-expected-bucket-owner";
var _xafec = "x-amz-fwd-error-code";
var _xafem = "x-amz-fwd-error-message";
var _xafhar = "x-amz-fwd-header-accept-ranges";
var _xafhcc = "x-amz-fwd-header-cache-control";
var _xafhcd = "x-amz-fwd-header-content-disposition";
var _xafhce = "x-amz-fwd-header-content-encoding";
var _xafhcl = "x-amz-fwd-header-content-language";
var _xafhcr = "x-amz-fwd-header-content-range";
var _xafhct = "x-amz-fwd-header-content-type";
var _xafhe = "x-amz-fwd-header-etag";
var _xafhe_ = "x-amz-fwd-header-expires";
var _xafhlm = "x-amz-fwd-header-last-modified";
var _xafhxacc = "x-amz-fwd-header-x-amz-checksum-crc32";
var _xafhxacc_ = "x-amz-fwd-header-x-amz-checksum-crc32c";
var _xafhxacc__ = "x-amz-fwd-header-x-amz-checksum-crc64nvme";
var _xafhxacs = "x-amz-fwd-header-x-amz-checksum-sha1";
var _xafhxacs_ = "x-amz-fwd-header-x-amz-checksum-sha256";
var _xafhxadm = "x-amz-fwd-header-x-amz-delete-marker";
var _xafhxae = "x-amz-fwd-header-x-amz-expiration";
var _xafhxamm = "x-amz-fwd-header-x-amz-missing-meta";
var _xafhxampc = "x-amz-fwd-header-x-amz-mp-parts-count";
var _xafhxaollh = "x-amz-fwd-header-x-amz-object-lock-legal-hold";
var _xafhxaolm = "x-amz-fwd-header-x-amz-object-lock-mode";
var _xafhxaolrud = "x-amz-fwd-header-x-amz-object-lock-retain-until-date";
var _xafhxar = "x-amz-fwd-header-x-amz-restore";
var _xafhxarc = "x-amz-fwd-header-x-amz-request-charged";
var _xafhxars = "x-amz-fwd-header-x-amz-replication-status";
var _xafhxasc = "x-amz-fwd-header-x-amz-storage-class";
var _xafhxasse = "x-amz-fwd-header-x-amz-server-side-encryption";
var _xafhxasseakki = "x-amz-fwd-header-x-amz-server-side-encryption-aws-kms-key-id";
var _xafhxassebke = "x-amz-fwd-header-x-amz-server-side-encryption-bucket-key-enabled";
var _xafhxasseca = "x-amz-fwd-header-x-amz-server-side-encryption-customer-algorithm";
var _xafhxasseckm = "x-amz-fwd-header-x-amz-server-side-encryption-customer-key-md5";
var _xafhxatc = "x-amz-fwd-header-x-amz-tagging-count";
var _xafhxavi = "x-amz-fwd-header-x-amz-version-id";
var _xafs = "x-amz-fwd-status";
var _xagfc = "x-amz-grant-full-control";
var _xagr = "x-amz-grant-read";
var _xagra = "x-amz-grant-read-acp";
var _xagw = "x-amz-grant-write";
var _xagwa = "x-amz-grant-write-acp";
var _xaimit = "x-amz-if-match-initiated-time";
var _xaimlmt = "x-amz-if-match-last-modified-time";
var _xaims = "x-amz-if-match-size";
var _xam = "x-amz-mfa";
var _xamd = "x-amz-metadata-directive";
var _xamm = "x-amz-missing-meta";
var _xamos = "x-amz-mp-object-size";
var _xamp = "x-amz-max-parts";
var _xampc = "x-amz-mp-parts-count";
var _xaoa = "x-amz-object-attributes";
var _xaollh = "x-amz-object-lock-legal-hold";
var _xaolm = "x-amz-object-lock-mode";
var _xaolrud = "x-amz-object-lock-retain-until-date";
var _xaoo = "x-amz-object-ownership";
var _xaooa = "x-amz-optional-object-attributes";
var _xaos = "x-amz-object-size";
var _xapnm = "x-amz-part-number-marker";
var _xar = "x-amz-restore";
var _xarc = "x-amz-request-charged";
var _xarop = "x-amz-restore-output-path";
var _xarp = "x-amz-request-payer";
var _xarr = "x-amz-request-route";
var _xars = "x-amz-replication-status";
var _xart = "x-amz-request-token";
var _xasc = "x-amz-storage-class";
var _xasca = "x-amz-sdk-checksum-algorithm";
var _xasdv = "x-amz-skip-destination-validation";
var _xasebo = "x-amz-source-expected-bucket-owner";
var _xasse = "x-amz-server-side-encryption";
var _xasseakki = "x-amz-server-side-encryption-aws-kms-key-id";
var _xassebke = "x-amz-server-side-encryption-bucket-key-enabled";
var _xassec = "x-amz-server-side-encryption-context";
var _xasseca = "x-amz-server-side-encryption-customer-algorithm";
var _xasseck = "x-amz-server-side-encryption-customer-key";
var _xasseckm = "x-amz-server-side-encryption-customer-key-md5";
var _xat = "x-amz-tagging";
var _xatc = "x-amz-tagging-count";
var _xatd = "x-amz-tagging-directive";
var _xatdmos = "x-amz-transition-default-minimum-object-size";
var _xavi = "x-amz-version-id";
var _xawob = "x-amz-write-offset-bytes";
var _xawrl = "x-amz-website-redirect-location";
var _xi = "x-id";

// node_modules/@aws-sdk/client-s3/dist-es/commands/CreateSessionCommand.js
var CreateSessionCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  DisableS3ExpressSessionAuth: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "CreateSession", {}).n("S3Client", "CreateSessionCommand").f(CreateSessionRequestFilterSensitiveLog, CreateSessionOutputFilterSensitiveLog).ser(se_CreateSessionCommand).de(de_CreateSessionCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/runtimeConfig.browser.js
var import_dist235 = __toESM(require_dist());
var import_dist236 = __toESM(require_dist2());
var import_dist237 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-s3/package.json
var package_default = {
  name: "@aws-sdk/client-s3",
  description: "AWS SDK for JavaScript S3 Client for Node.js, Browser and React Native",
  version: "3.782.0",
  scripts: {
    build: "concurrently 'yarn:build:cjs' 'yarn:build:es' 'yarn:build:types'",
    "build:cjs": "node ../../scripts/compilation/inline client-s3",
    "build:es": "tsc -p tsconfig.es.json",
    "build:include:deps": "lerna run --scope $npm_package_name --include-dependencies build",
    "build:types": "tsc -p tsconfig.types.json",
    "build:types:downlevel": "downlevel-dts dist-types dist-types/ts3.4",
    clean: "rimraf ./dist-* && rimraf *.tsbuildinfo",
    "extract:docs": "api-extractor run --local",
    "generate:client": "node ../../scripts/generate-clients/single-service --solo s3",
    test: "yarn g:vitest run",
    "test:browser": "node ./test/browser-build/esbuild && yarn g:vitest run -c vitest.config.browser.ts",
    "test:browser:watch": "node ./test/browser-build/esbuild && yarn g:vitest watch -c vitest.config.browser.ts",
    "test:e2e": "yarn g:vitest run -c vitest.config.e2e.ts && yarn test:browser",
    "test:e2e:watch": "yarn g:vitest watch -c vitest.config.e2e.ts",
    "test:watch": "yarn g:vitest watch"
  },
  main: "./dist-cjs/index.js",
  types: "./dist-types/index.d.ts",
  module: "./dist-es/index.js",
  sideEffects: false,
  dependencies: {
    "@aws-crypto/sha1-browser": "5.2.0",
    "@aws-crypto/sha256-browser": "5.2.0",
    "@aws-crypto/sha256-js": "5.2.0",
    "@aws-sdk/core": "3.775.0",
    "@aws-sdk/credential-provider-node": "3.782.0",
    "@aws-sdk/middleware-bucket-endpoint": "3.775.0",
    "@aws-sdk/middleware-expect-continue": "3.775.0",
    "@aws-sdk/middleware-flexible-checksums": "3.775.0",
    "@aws-sdk/middleware-host-header": "3.775.0",
    "@aws-sdk/middleware-location-constraint": "3.775.0",
    "@aws-sdk/middleware-logger": "3.775.0",
    "@aws-sdk/middleware-recursion-detection": "3.775.0",
    "@aws-sdk/middleware-sdk-s3": "3.775.0",
    "@aws-sdk/middleware-ssec": "3.775.0",
    "@aws-sdk/middleware-user-agent": "3.782.0",
    "@aws-sdk/region-config-resolver": "3.775.0",
    "@aws-sdk/signature-v4-multi-region": "3.775.0",
    "@aws-sdk/types": "3.775.0",
    "@aws-sdk/util-endpoints": "3.782.0",
    "@aws-sdk/util-user-agent-browser": "3.775.0",
    "@aws-sdk/util-user-agent-node": "3.782.0",
    "@aws-sdk/xml-builder": "3.775.0",
    "@smithy/config-resolver": "^4.1.0",
    "@smithy/core": "^3.2.0",
    "@smithy/eventstream-serde-browser": "^4.0.2",
    "@smithy/eventstream-serde-config-resolver": "^4.1.0",
    "@smithy/eventstream-serde-node": "^4.0.2",
    "@smithy/fetch-http-handler": "^5.0.2",
    "@smithy/hash-blob-browser": "^4.0.2",
    "@smithy/hash-node": "^4.0.2",
    "@smithy/hash-stream-node": "^4.0.2",
    "@smithy/invalid-dependency": "^4.0.2",
    "@smithy/md5-js": "^4.0.2",
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
    "@smithy/util-stream": "^4.2.0",
    "@smithy/util-utf8": "^4.0.0",
    "@smithy/util-waiter": "^4.0.3",
    tslib: "^2.6.2"
  },
  devDependencies: {
    "@aws-sdk/signature-v4-crt": "3.782.0",
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
  homepage: "https://github.com/aws/aws-sdk-js-v3/tree/main/clients/client-s3",
  repository: {
    type: "git",
    url: "https://github.com/aws/aws-sdk-js-v3.git",
    directory: "clients/client-s3"
  }
};

// node_modules/@aws-crypto/sha1-browser/build/module/index.js
var import_dist160 = __toESM(require_dist());
var import_dist161 = __toESM(require_dist2());
var import_dist162 = __toESM(require_dist3());

// node_modules/@aws-crypto/sha1-browser/build/module/crossPlatformSha1.js
var import_dist157 = __toESM(require_dist());
var import_dist158 = __toESM(require_dist2());
var import_dist159 = __toESM(require_dist3());

// node_modules/@aws-crypto/sha1-browser/build/module/webCryptoSha1.js
var import_dist154 = __toESM(require_dist());
var import_dist155 = __toESM(require_dist2());
var import_dist156 = __toESM(require_dist3());

// node_modules/@aws-crypto/sha1-browser/node_modules/@smithy/util-utf8/dist-es/index.js
var import_dist145 = __toESM(require_dist());
var import_dist146 = __toESM(require_dist2());
var import_dist147 = __toESM(require_dist3());

// node_modules/@aws-crypto/sha1-browser/node_modules/@smithy/util-utf8/dist-es/fromUtf8.browser.js
var import_dist136 = __toESM(require_dist());
var import_dist137 = __toESM(require_dist2());
var import_dist138 = __toESM(require_dist3());
var fromUtf82 = (input) => new TextEncoder().encode(input);

// node_modules/@aws-crypto/sha1-browser/node_modules/@smithy/util-utf8/dist-es/toUint8Array.js
var import_dist139 = __toESM(require_dist());
var import_dist140 = __toESM(require_dist2());
var import_dist141 = __toESM(require_dist3());

// node_modules/@aws-crypto/sha1-browser/node_modules/@smithy/util-utf8/dist-es/toUtf8.browser.js
var import_dist142 = __toESM(require_dist());
var import_dist143 = __toESM(require_dist2());
var import_dist144 = __toESM(require_dist3());

// node_modules/@aws-crypto/sha1-browser/build/module/isEmptyData.js
var import_dist148 = __toESM(require_dist());
var import_dist149 = __toESM(require_dist2());
var import_dist150 = __toESM(require_dist3());
function isEmptyData2(data) {
  if (typeof data === "string") {
    return data.length === 0;
  }
  return data.byteLength === 0;
}

// node_modules/@aws-crypto/sha1-browser/build/module/constants.js
var import_dist151 = __toESM(require_dist());
var import_dist152 = __toESM(require_dist2());
var import_dist153 = __toESM(require_dist3());
var SHA_1_HASH = { name: "SHA-1" };
var SHA_1_HMAC_ALGO = {
  name: "HMAC",
  hash: SHA_1_HASH
};
var EMPTY_DATA_SHA_1 = new Uint8Array([
  218,
  57,
  163,
  238,
  94,
  107,
  75,
  13,
  50,
  85,
  191,
  239,
  149,
  96,
  24,
  144,
  175,
  216,
  7,
  9
]);

// node_modules/@aws-crypto/sha1-browser/build/module/webCryptoSha1.js
var Sha1 = (
  /** @class */
  function() {
    function Sha13(secret) {
      this.toHash = new Uint8Array(0);
      if (secret !== void 0) {
        this.key = new Promise(function(resolve, reject) {
          locateWindow().crypto.subtle.importKey("raw", convertToBuffer2(secret), SHA_1_HMAC_ALGO, false, ["sign"]).then(resolve, reject);
        });
        this.key.catch(function() {
        });
      }
    }
    Sha13.prototype.update = function(data) {
      if (isEmptyData2(data)) {
        return;
      }
      var update = convertToBuffer2(data);
      var typedArray = new Uint8Array(this.toHash.byteLength + update.byteLength);
      typedArray.set(this.toHash, 0);
      typedArray.set(update, this.toHash.byteLength);
      this.toHash = typedArray;
    };
    Sha13.prototype.digest = function() {
      var _this = this;
      if (this.key) {
        return this.key.then(function(key) {
          return locateWindow().crypto.subtle.sign(SHA_1_HMAC_ALGO, key, _this.toHash).then(function(data) {
            return new Uint8Array(data);
          });
        });
      }
      if (isEmptyData2(this.toHash)) {
        return Promise.resolve(EMPTY_DATA_SHA_1);
      }
      return Promise.resolve().then(function() {
        return locateWindow().crypto.subtle.digest(SHA_1_HASH, _this.toHash);
      }).then(function(data) {
        return Promise.resolve(new Uint8Array(data));
      });
    };
    Sha13.prototype.reset = function() {
      this.toHash = new Uint8Array(0);
    };
    return Sha13;
  }()
);
function convertToBuffer2(data) {
  if (typeof data === "string") {
    return fromUtf82(data);
  }
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength / Uint8Array.BYTES_PER_ELEMENT);
  }
  return new Uint8Array(data);
}

// node_modules/@aws-crypto/sha1-browser/build/module/crossPlatformSha1.js
var Sha12 = (
  /** @class */
  function() {
    function Sha13(secret) {
      if (supportsWebCrypto(locateWindow())) {
        this.hash = new Sha1(secret);
      } else {
        throw new Error("SHA1 not supported");
      }
    }
    Sha13.prototype.update = function(data, encoding) {
      this.hash.update(convertToBuffer(data));
    };
    Sha13.prototype.digest = function() {
      return this.hash.digest();
    };
    Sha13.prototype.reset = function() {
      this.hash.reset();
    };
    return Sha13;
  }()
);

// node_modules/@smithy/eventstream-serde-browser/dist-es/index.js
var import_dist217 = __toESM(require_dist());
var import_dist218 = __toESM(require_dist2());
var import_dist219 = __toESM(require_dist3());

// node_modules/@smithy/eventstream-serde-browser/dist-es/EventStreamMarshaller.js
var import_dist211 = __toESM(require_dist());
var import_dist212 = __toESM(require_dist2());
var import_dist213 = __toESM(require_dist3());

// node_modules/@smithy/eventstream-serde-universal/dist-es/index.js
var import_dist205 = __toESM(require_dist());
var import_dist206 = __toESM(require_dist2());
var import_dist207 = __toESM(require_dist3());

// node_modules/@smithy/eventstream-serde-universal/dist-es/EventStreamMarshaller.js
var import_dist199 = __toESM(require_dist());
var import_dist200 = __toESM(require_dist2());
var import_dist201 = __toESM(require_dist3());

// node_modules/@smithy/eventstream-codec/dist-es/index.js
var import_dist190 = __toESM(require_dist());
var import_dist191 = __toESM(require_dist2());
var import_dist192 = __toESM(require_dist3());

// node_modules/@smithy/eventstream-codec/dist-es/EventStreamCodec.js
var import_dist172 = __toESM(require_dist());
var import_dist173 = __toESM(require_dist2());
var import_dist174 = __toESM(require_dist3());

// node_modules/@smithy/eventstream-codec/dist-es/HeaderMarshaller.js
var import_dist166 = __toESM(require_dist());
var import_dist167 = __toESM(require_dist2());
var import_dist168 = __toESM(require_dist3());

// node_modules/@smithy/eventstream-codec/dist-es/Int64.js
var import_dist163 = __toESM(require_dist());
var import_dist164 = __toESM(require_dist2());
var import_dist165 = __toESM(require_dist3());
var Int64 = class _Int64 {
  constructor(bytes) {
    this.bytes = bytes;
    if (bytes.byteLength !== 8) {
      throw new Error("Int64 buffers must be exactly 8 bytes");
    }
  }
  static fromNumber(number) {
    if (number > 9223372036854776e3 || number < -9223372036854776e3) {
      throw new Error(`${number} is too large (or, if negative, too small) to represent as an Int64`);
    }
    const bytes = new Uint8Array(8);
    for (let i2 = 7, remaining = Math.abs(Math.round(number)); i2 > -1 && remaining > 0; i2--, remaining /= 256) {
      bytes[i2] = remaining;
    }
    if (number < 0) {
      negate(bytes);
    }
    return new _Int64(bytes);
  }
  valueOf() {
    const bytes = this.bytes.slice(0);
    const negative = bytes[0] & 128;
    if (negative) {
      negate(bytes);
    }
    return parseInt(toHex(bytes), 16) * (negative ? -1 : 1);
  }
  toString() {
    return String(this.valueOf());
  }
};
function negate(bytes) {
  for (let i2 = 0; i2 < 8; i2++) {
    bytes[i2] ^= 255;
  }
  for (let i2 = 7; i2 > -1; i2--) {
    bytes[i2]++;
    if (bytes[i2] !== 0)
      break;
  }
}

// node_modules/@smithy/eventstream-codec/dist-es/HeaderMarshaller.js
var HeaderMarshaller = class {
  constructor(toUtf82, fromUtf83) {
    this.toUtf8 = toUtf82;
    this.fromUtf8 = fromUtf83;
  }
  format(headers) {
    const chunks = [];
    for (const headerName of Object.keys(headers)) {
      const bytes = this.fromUtf8(headerName);
      chunks.push(Uint8Array.from([bytes.byteLength]), bytes, this.formatHeaderValue(headers[headerName]));
    }
    const out = new Uint8Array(chunks.reduce((carry, bytes) => carry + bytes.byteLength, 0));
    let position = 0;
    for (const chunk of chunks) {
      out.set(chunk, position);
      position += chunk.byteLength;
    }
    return out;
  }
  formatHeaderValue(header) {
    switch (header.type) {
      case "boolean":
        return Uint8Array.from([header.value ? 0 : 1]);
      case "byte":
        return Uint8Array.from([2, header.value]);
      case "short":
        const shortView = new DataView(new ArrayBuffer(3));
        shortView.setUint8(0, 3);
        shortView.setInt16(1, header.value, false);
        return new Uint8Array(shortView.buffer);
      case "integer":
        const intView = new DataView(new ArrayBuffer(5));
        intView.setUint8(0, 4);
        intView.setInt32(1, header.value, false);
        return new Uint8Array(intView.buffer);
      case "long":
        const longBytes = new Uint8Array(9);
        longBytes[0] = 5;
        longBytes.set(header.value.bytes, 1);
        return longBytes;
      case "binary":
        const binView = new DataView(new ArrayBuffer(3 + header.value.byteLength));
        binView.setUint8(0, 6);
        binView.setUint16(1, header.value.byteLength, false);
        const binBytes = new Uint8Array(binView.buffer);
        binBytes.set(header.value, 3);
        return binBytes;
      case "string":
        const utf8Bytes = this.fromUtf8(header.value);
        const strView = new DataView(new ArrayBuffer(3 + utf8Bytes.byteLength));
        strView.setUint8(0, 7);
        strView.setUint16(1, utf8Bytes.byteLength, false);
        const strBytes = new Uint8Array(strView.buffer);
        strBytes.set(utf8Bytes, 3);
        return strBytes;
      case "timestamp":
        const tsBytes = new Uint8Array(9);
        tsBytes[0] = 8;
        tsBytes.set(Int64.fromNumber(header.value.valueOf()).bytes, 1);
        return tsBytes;
      case "uuid":
        if (!UUID_PATTERN.test(header.value)) {
          throw new Error(`Invalid UUID received: ${header.value}`);
        }
        const uuidBytes = new Uint8Array(17);
        uuidBytes[0] = 9;
        uuidBytes.set(fromHex(header.value.replace(/\-/g, "")), 1);
        return uuidBytes;
    }
  }
  parse(headers) {
    const out = {};
    let position = 0;
    while (position < headers.byteLength) {
      const nameLength = headers.getUint8(position++);
      const name = this.toUtf8(new Uint8Array(headers.buffer, headers.byteOffset + position, nameLength));
      position += nameLength;
      switch (headers.getUint8(position++)) {
        case 0:
          out[name] = {
            type: BOOLEAN_TAG,
            value: true
          };
          break;
        case 1:
          out[name] = {
            type: BOOLEAN_TAG,
            value: false
          };
          break;
        case 2:
          out[name] = {
            type: BYTE_TAG,
            value: headers.getInt8(position++)
          };
          break;
        case 3:
          out[name] = {
            type: SHORT_TAG,
            value: headers.getInt16(position, false)
          };
          position += 2;
          break;
        case 4:
          out[name] = {
            type: INT_TAG,
            value: headers.getInt32(position, false)
          };
          position += 4;
          break;
        case 5:
          out[name] = {
            type: LONG_TAG,
            value: new Int64(new Uint8Array(headers.buffer, headers.byteOffset + position, 8))
          };
          position += 8;
          break;
        case 6:
          const binaryLength = headers.getUint16(position, false);
          position += 2;
          out[name] = {
            type: BINARY_TAG,
            value: new Uint8Array(headers.buffer, headers.byteOffset + position, binaryLength)
          };
          position += binaryLength;
          break;
        case 7:
          const stringLength = headers.getUint16(position, false);
          position += 2;
          out[name] = {
            type: STRING_TAG,
            value: this.toUtf8(new Uint8Array(headers.buffer, headers.byteOffset + position, stringLength))
          };
          position += stringLength;
          break;
        case 8:
          out[name] = {
            type: TIMESTAMP_TAG,
            value: new Date(new Int64(new Uint8Array(headers.buffer, headers.byteOffset + position, 8)).valueOf())
          };
          position += 8;
          break;
        case 9:
          const uuidBytes = new Uint8Array(headers.buffer, headers.byteOffset + position, 16);
          position += 16;
          out[name] = {
            type: UUID_TAG,
            value: `${toHex(uuidBytes.subarray(0, 4))}-${toHex(uuidBytes.subarray(4, 6))}-${toHex(uuidBytes.subarray(6, 8))}-${toHex(uuidBytes.subarray(8, 10))}-${toHex(uuidBytes.subarray(10))}`
          };
          break;
        default:
          throw new Error(`Unrecognized header type tag`);
      }
    }
    return out;
  }
};
var HEADER_VALUE_TYPE;
(function(HEADER_VALUE_TYPE2) {
  HEADER_VALUE_TYPE2[HEADER_VALUE_TYPE2["boolTrue"] = 0] = "boolTrue";
  HEADER_VALUE_TYPE2[HEADER_VALUE_TYPE2["boolFalse"] = 1] = "boolFalse";
  HEADER_VALUE_TYPE2[HEADER_VALUE_TYPE2["byte"] = 2] = "byte";
  HEADER_VALUE_TYPE2[HEADER_VALUE_TYPE2["short"] = 3] = "short";
  HEADER_VALUE_TYPE2[HEADER_VALUE_TYPE2["integer"] = 4] = "integer";
  HEADER_VALUE_TYPE2[HEADER_VALUE_TYPE2["long"] = 5] = "long";
  HEADER_VALUE_TYPE2[HEADER_VALUE_TYPE2["byteArray"] = 6] = "byteArray";
  HEADER_VALUE_TYPE2[HEADER_VALUE_TYPE2["string"] = 7] = "string";
  HEADER_VALUE_TYPE2[HEADER_VALUE_TYPE2["timestamp"] = 8] = "timestamp";
  HEADER_VALUE_TYPE2[HEADER_VALUE_TYPE2["uuid"] = 9] = "uuid";
})(HEADER_VALUE_TYPE || (HEADER_VALUE_TYPE = {}));
var BOOLEAN_TAG = "boolean";
var BYTE_TAG = "byte";
var SHORT_TAG = "short";
var INT_TAG = "integer";
var LONG_TAG = "long";
var BINARY_TAG = "binary";
var STRING_TAG = "string";
var TIMESTAMP_TAG = "timestamp";
var UUID_TAG = "uuid";
var UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

// node_modules/@smithy/eventstream-codec/dist-es/splitMessage.js
var import_dist169 = __toESM(require_dist());
var import_dist170 = __toESM(require_dist2());
var import_dist171 = __toESM(require_dist3());
var PRELUDE_MEMBER_LENGTH = 4;
var PRELUDE_LENGTH = PRELUDE_MEMBER_LENGTH * 2;
var CHECKSUM_LENGTH = 4;
var MINIMUM_MESSAGE_LENGTH = PRELUDE_LENGTH + CHECKSUM_LENGTH * 2;
function splitMessage({ byteLength, byteOffset, buffer }) {
  if (byteLength < MINIMUM_MESSAGE_LENGTH) {
    throw new Error("Provided message too short to accommodate event stream message overhead");
  }
  const view = new DataView(buffer, byteOffset, byteLength);
  const messageLength = view.getUint32(0, false);
  if (byteLength !== messageLength) {
    throw new Error("Reported message length does not match received message length");
  }
  const headerLength = view.getUint32(PRELUDE_MEMBER_LENGTH, false);
  const expectedPreludeChecksum = view.getUint32(PRELUDE_LENGTH, false);
  const expectedMessageChecksum = view.getUint32(byteLength - CHECKSUM_LENGTH, false);
  const checksummer = new Crc32().update(new Uint8Array(buffer, byteOffset, PRELUDE_LENGTH));
  if (expectedPreludeChecksum !== checksummer.digest()) {
    throw new Error(`The prelude checksum specified in the message (${expectedPreludeChecksum}) does not match the calculated CRC32 checksum (${checksummer.digest()})`);
  }
  checksummer.update(new Uint8Array(buffer, byteOffset + PRELUDE_LENGTH, byteLength - (PRELUDE_LENGTH + CHECKSUM_LENGTH)));
  if (expectedMessageChecksum !== checksummer.digest()) {
    throw new Error(`The message checksum (${checksummer.digest()}) did not match the expected value of ${expectedMessageChecksum}`);
  }
  return {
    headers: new DataView(buffer, byteOffset + PRELUDE_LENGTH + CHECKSUM_LENGTH, headerLength),
    body: new Uint8Array(buffer, byteOffset + PRELUDE_LENGTH + CHECKSUM_LENGTH + headerLength, messageLength - headerLength - (PRELUDE_LENGTH + CHECKSUM_LENGTH + CHECKSUM_LENGTH))
  };
}

// node_modules/@smithy/eventstream-codec/dist-es/EventStreamCodec.js
var EventStreamCodec = class {
  constructor(toUtf82, fromUtf83) {
    this.headerMarshaller = new HeaderMarshaller(toUtf82, fromUtf83);
    this.messageBuffer = [];
    this.isEndOfStream = false;
  }
  feed(message) {
    this.messageBuffer.push(this.decode(message));
  }
  endOfStream() {
    this.isEndOfStream = true;
  }
  getMessage() {
    const message = this.messageBuffer.pop();
    const isEndOfStream = this.isEndOfStream;
    return {
      getMessage() {
        return message;
      },
      isEndOfStream() {
        return isEndOfStream;
      }
    };
  }
  getAvailableMessages() {
    const messages = this.messageBuffer;
    this.messageBuffer = [];
    const isEndOfStream = this.isEndOfStream;
    return {
      getMessages() {
        return messages;
      },
      isEndOfStream() {
        return isEndOfStream;
      }
    };
  }
  encode({ headers: rawHeaders, body }) {
    const headers = this.headerMarshaller.format(rawHeaders);
    const length = headers.byteLength + body.byteLength + 16;
    const out = new Uint8Array(length);
    const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
    const checksum = new Crc32();
    view.setUint32(0, length, false);
    view.setUint32(4, headers.byteLength, false);
    view.setUint32(8, checksum.update(out.subarray(0, 8)).digest(), false);
    out.set(headers, 12);
    out.set(body, headers.byteLength + 12);
    view.setUint32(length - 4, checksum.update(out.subarray(8, length - 4)).digest(), false);
    return out;
  }
  decode(message) {
    const { headers, body } = splitMessage(message);
    return { headers: this.headerMarshaller.parse(headers), body };
  }
  formatHeaders(rawHeaders) {
    return this.headerMarshaller.format(rawHeaders);
  }
};

// node_modules/@smithy/eventstream-codec/dist-es/Message.js
var import_dist175 = __toESM(require_dist());
var import_dist176 = __toESM(require_dist2());
var import_dist177 = __toESM(require_dist3());

// node_modules/@smithy/eventstream-codec/dist-es/MessageDecoderStream.js
var import_dist178 = __toESM(require_dist());
var import_dist179 = __toESM(require_dist2());
var import_dist180 = __toESM(require_dist3());
var MessageDecoderStream = class {
  constructor(options) {
    this.options = options;
  }
  [Symbol.asyncIterator]() {
    return this.asyncIterator();
  }
  async *asyncIterator() {
    for await (const bytes of this.options.inputStream) {
      const decoded = this.options.decoder.decode(bytes);
      yield decoded;
    }
  }
};

// node_modules/@smithy/eventstream-codec/dist-es/MessageEncoderStream.js
var import_dist181 = __toESM(require_dist());
var import_dist182 = __toESM(require_dist2());
var import_dist183 = __toESM(require_dist3());
var MessageEncoderStream = class {
  constructor(options) {
    this.options = options;
  }
  [Symbol.asyncIterator]() {
    return this.asyncIterator();
  }
  async *asyncIterator() {
    for await (const msg of this.options.messageStream) {
      const encoded = this.options.encoder.encode(msg);
      yield encoded;
    }
    if (this.options.includeEndFrame) {
      yield new Uint8Array(0);
    }
  }
};

// node_modules/@smithy/eventstream-codec/dist-es/SmithyMessageDecoderStream.js
var import_dist184 = __toESM(require_dist());
var import_dist185 = __toESM(require_dist2());
var import_dist186 = __toESM(require_dist3());
var SmithyMessageDecoderStream = class {
  constructor(options) {
    this.options = options;
  }
  [Symbol.asyncIterator]() {
    return this.asyncIterator();
  }
  async *asyncIterator() {
    for await (const message of this.options.messageStream) {
      const deserialized = await this.options.deserializer(message);
      if (deserialized === void 0)
        continue;
      yield deserialized;
    }
  }
};

// node_modules/@smithy/eventstream-codec/dist-es/SmithyMessageEncoderStream.js
var import_dist187 = __toESM(require_dist());
var import_dist188 = __toESM(require_dist2());
var import_dist189 = __toESM(require_dist3());
var SmithyMessageEncoderStream = class {
  constructor(options) {
    this.options = options;
  }
  [Symbol.asyncIterator]() {
    return this.asyncIterator();
  }
  async *asyncIterator() {
    for await (const chunk of this.options.inputStream) {
      const payloadBuf = this.options.serializer(chunk);
      yield payloadBuf;
    }
  }
};

// node_modules/@smithy/eventstream-serde-universal/dist-es/getChunkedStream.js
var import_dist193 = __toESM(require_dist());
var import_dist194 = __toESM(require_dist2());
var import_dist195 = __toESM(require_dist3());
function getChunkedStream(source) {
  let currentMessageTotalLength = 0;
  let currentMessagePendingLength = 0;
  let currentMessage = null;
  let messageLengthBuffer = null;
  const allocateMessage = (size) => {
    if (typeof size !== "number") {
      throw new Error("Attempted to allocate an event message where size was not a number: " + size);
    }
    currentMessageTotalLength = size;
    currentMessagePendingLength = 4;
    currentMessage = new Uint8Array(size);
    const currentMessageView = new DataView(currentMessage.buffer);
    currentMessageView.setUint32(0, size, false);
  };
  const iterator = async function* () {
    const sourceIterator = source[Symbol.asyncIterator]();
    while (true) {
      const { value, done } = await sourceIterator.next();
      if (done) {
        if (!currentMessageTotalLength) {
          return;
        } else if (currentMessageTotalLength === currentMessagePendingLength) {
          yield currentMessage;
        } else {
          throw new Error("Truncated event message received.");
        }
        return;
      }
      const chunkLength = value.length;
      let currentOffset = 0;
      while (currentOffset < chunkLength) {
        if (!currentMessage) {
          const bytesRemaining = chunkLength - currentOffset;
          if (!messageLengthBuffer) {
            messageLengthBuffer = new Uint8Array(4);
          }
          const numBytesForTotal = Math.min(4 - currentMessagePendingLength, bytesRemaining);
          messageLengthBuffer.set(value.slice(currentOffset, currentOffset + numBytesForTotal), currentMessagePendingLength);
          currentMessagePendingLength += numBytesForTotal;
          currentOffset += numBytesForTotal;
          if (currentMessagePendingLength < 4) {
            break;
          }
          allocateMessage(new DataView(messageLengthBuffer.buffer).getUint32(0, false));
          messageLengthBuffer = null;
        }
        const numBytesToWrite = Math.min(currentMessageTotalLength - currentMessagePendingLength, chunkLength - currentOffset);
        currentMessage.set(value.slice(currentOffset, currentOffset + numBytesToWrite), currentMessagePendingLength);
        currentMessagePendingLength += numBytesToWrite;
        currentOffset += numBytesToWrite;
        if (currentMessageTotalLength && currentMessageTotalLength === currentMessagePendingLength) {
          yield currentMessage;
          currentMessage = null;
          currentMessageTotalLength = 0;
          currentMessagePendingLength = 0;
        }
      }
    }
  };
  return {
    [Symbol.asyncIterator]: iterator
  };
}

// node_modules/@smithy/eventstream-serde-universal/dist-es/getUnmarshalledStream.js
var import_dist196 = __toESM(require_dist());
var import_dist197 = __toESM(require_dist2());
var import_dist198 = __toESM(require_dist3());
function getMessageUnmarshaller(deserializer, toUtf82) {
  return async function(message) {
    const { value: messageType } = message.headers[":message-type"];
    if (messageType === "error") {
      const unmodeledError = new Error(message.headers[":error-message"].value || "UnknownError");
      unmodeledError.name = message.headers[":error-code"].value;
      throw unmodeledError;
    } else if (messageType === "exception") {
      const code = message.headers[":exception-type"].value;
      const exception = { [code]: message };
      const deserializedException = await deserializer(exception);
      if (deserializedException.$unknown) {
        const error = new Error(toUtf82(message.body));
        error.name = code;
        throw error;
      }
      throw deserializedException[code];
    } else if (messageType === "event") {
      const event = {
        [message.headers[":event-type"].value]: message
      };
      const deserialized = await deserializer(event);
      if (deserialized.$unknown)
        return;
      return deserialized;
    } else {
      throw Error(`Unrecognizable event type: ${message.headers[":event-type"].value}`);
    }
  };
}

// node_modules/@smithy/eventstream-serde-universal/dist-es/EventStreamMarshaller.js
var EventStreamMarshaller = class {
  constructor({ utf8Encoder, utf8Decoder }) {
    this.eventStreamCodec = new EventStreamCodec(utf8Encoder, utf8Decoder);
    this.utfEncoder = utf8Encoder;
  }
  deserialize(body, deserializer) {
    const inputStream = getChunkedStream(body);
    return new SmithyMessageDecoderStream({
      messageStream: new MessageDecoderStream({ inputStream, decoder: this.eventStreamCodec }),
      deserializer: getMessageUnmarshaller(deserializer, this.utfEncoder)
    });
  }
  serialize(inputStream, serializer) {
    return new MessageEncoderStream({
      messageStream: new SmithyMessageEncoderStream({ inputStream, serializer }),
      encoder: this.eventStreamCodec,
      includeEndFrame: true
    });
  }
};

// node_modules/@smithy/eventstream-serde-universal/dist-es/provider.js
var import_dist202 = __toESM(require_dist());
var import_dist203 = __toESM(require_dist2());
var import_dist204 = __toESM(require_dist3());

// node_modules/@smithy/eventstream-serde-browser/dist-es/utils.js
var import_dist208 = __toESM(require_dist());
var import_dist209 = __toESM(require_dist2());
var import_dist210 = __toESM(require_dist3());
var readableStreamtoIterable = (readableStream) => ({
  [Symbol.asyncIterator]: async function* () {
    const reader = readableStream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done)
          return;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  }
});
var iterableToReadableStream = (asyncIterable) => {
  const iterator = asyncIterable[Symbol.asyncIterator]();
  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await iterator.next();
      if (done) {
        return controller.close();
      }
      controller.enqueue(value);
    }
  });
};

// node_modules/@smithy/eventstream-serde-browser/dist-es/EventStreamMarshaller.js
var EventStreamMarshaller2 = class {
  constructor({ utf8Encoder, utf8Decoder }) {
    this.universalMarshaller = new EventStreamMarshaller({
      utf8Decoder,
      utf8Encoder
    });
  }
  deserialize(body, deserializer) {
    const bodyIterable = isReadableStream(body) ? readableStreamtoIterable(body) : body;
    return this.universalMarshaller.deserialize(bodyIterable, deserializer);
  }
  serialize(input, serializer) {
    const serialziedIterable = this.universalMarshaller.serialize(input, serializer);
    return typeof ReadableStream === "function" ? iterableToReadableStream(serialziedIterable) : serialziedIterable;
  }
};
var isReadableStream = (body) => typeof ReadableStream === "function" && body instanceof ReadableStream;

// node_modules/@smithy/eventstream-serde-browser/dist-es/provider.js
var import_dist214 = __toESM(require_dist());
var import_dist215 = __toESM(require_dist2());
var import_dist216 = __toESM(require_dist3());
var eventStreamSerdeProvider = (options) => new EventStreamMarshaller2(options);

// node_modules/@smithy/hash-blob-browser/dist-es/index.js
var import_dist223 = __toESM(require_dist());
var import_dist224 = __toESM(require_dist2());
var import_dist225 = __toESM(require_dist3());

// node_modules/@smithy/chunked-blob-reader/dist-es/index.js
var import_dist220 = __toESM(require_dist());
var import_dist221 = __toESM(require_dist2());
var import_dist222 = __toESM(require_dist3());
async function blobReader(blob, onChunk, chunkSize = 1024 * 1024) {
  const size = blob.size;
  let totalBytesRead = 0;
  while (totalBytesRead < size) {
    const slice = blob.slice(totalBytesRead, Math.min(size, totalBytesRead + chunkSize));
    onChunk(new Uint8Array(await slice.arrayBuffer()));
    totalBytesRead += slice.size;
  }
}

// node_modules/@smithy/hash-blob-browser/dist-es/index.js
var blobHasher = async function blobHasher2(hashCtor, blob) {
  const hash = new hashCtor();
  await blobReader(blob, (chunk) => {
    hash.update(chunk);
  });
  return hash.digest();
};

// node_modules/@smithy/md5-js/dist-es/index.js
var import_dist229 = __toESM(require_dist());
var import_dist230 = __toESM(require_dist2());
var import_dist231 = __toESM(require_dist3());

// node_modules/@smithy/md5-js/dist-es/constants.js
var import_dist226 = __toESM(require_dist());
var import_dist227 = __toESM(require_dist2());
var import_dist228 = __toESM(require_dist3());
var BLOCK_SIZE = 64;
var DIGEST_LENGTH = 16;
var INIT = [1732584193, 4023233417, 2562383102, 271733878];

// node_modules/@smithy/md5-js/dist-es/index.js
var Md5 = class {
  constructor() {
    this.reset();
  }
  update(sourceData) {
    if (isEmptyData3(sourceData)) {
      return;
    } else if (this.finished) {
      throw new Error("Attempted to update an already finished hash.");
    }
    const data = convertToBuffer3(sourceData);
    let position = 0;
    let { byteLength } = data;
    this.bytesHashed += byteLength;
    while (byteLength > 0) {
      this.buffer.setUint8(this.bufferLength++, data[position++]);
      byteLength--;
      if (this.bufferLength === BLOCK_SIZE) {
        this.hashBuffer();
        this.bufferLength = 0;
      }
    }
  }
  async digest() {
    if (!this.finished) {
      const { buffer, bufferLength: undecoratedLength, bytesHashed } = this;
      const bitsHashed = bytesHashed * 8;
      buffer.setUint8(this.bufferLength++, 128);
      if (undecoratedLength % BLOCK_SIZE >= BLOCK_SIZE - 8) {
        for (let i2 = this.bufferLength; i2 < BLOCK_SIZE; i2++) {
          buffer.setUint8(i2, 0);
        }
        this.hashBuffer();
        this.bufferLength = 0;
      }
      for (let i2 = this.bufferLength; i2 < BLOCK_SIZE - 8; i2++) {
        buffer.setUint8(i2, 0);
      }
      buffer.setUint32(BLOCK_SIZE - 8, bitsHashed >>> 0, true);
      buffer.setUint32(BLOCK_SIZE - 4, Math.floor(bitsHashed / 4294967296), true);
      this.hashBuffer();
      this.finished = true;
    }
    const out = new DataView(new ArrayBuffer(DIGEST_LENGTH));
    for (let i2 = 0; i2 < 4; i2++) {
      out.setUint32(i2 * 4, this.state[i2], true);
    }
    return new Uint8Array(out.buffer, out.byteOffset, out.byteLength);
  }
  hashBuffer() {
    const { buffer, state } = this;
    let a2 = state[0], b2 = state[1], c2 = state[2], d2 = state[3];
    a2 = ff(a2, b2, c2, d2, buffer.getUint32(0, true), 7, 3614090360);
    d2 = ff(d2, a2, b2, c2, buffer.getUint32(4, true), 12, 3905402710);
    c2 = ff(c2, d2, a2, b2, buffer.getUint32(8, true), 17, 606105819);
    b2 = ff(b2, c2, d2, a2, buffer.getUint32(12, true), 22, 3250441966);
    a2 = ff(a2, b2, c2, d2, buffer.getUint32(16, true), 7, 4118548399);
    d2 = ff(d2, a2, b2, c2, buffer.getUint32(20, true), 12, 1200080426);
    c2 = ff(c2, d2, a2, b2, buffer.getUint32(24, true), 17, 2821735955);
    b2 = ff(b2, c2, d2, a2, buffer.getUint32(28, true), 22, 4249261313);
    a2 = ff(a2, b2, c2, d2, buffer.getUint32(32, true), 7, 1770035416);
    d2 = ff(d2, a2, b2, c2, buffer.getUint32(36, true), 12, 2336552879);
    c2 = ff(c2, d2, a2, b2, buffer.getUint32(40, true), 17, 4294925233);
    b2 = ff(b2, c2, d2, a2, buffer.getUint32(44, true), 22, 2304563134);
    a2 = ff(a2, b2, c2, d2, buffer.getUint32(48, true), 7, 1804603682);
    d2 = ff(d2, a2, b2, c2, buffer.getUint32(52, true), 12, 4254626195);
    c2 = ff(c2, d2, a2, b2, buffer.getUint32(56, true), 17, 2792965006);
    b2 = ff(b2, c2, d2, a2, buffer.getUint32(60, true), 22, 1236535329);
    a2 = gg(a2, b2, c2, d2, buffer.getUint32(4, true), 5, 4129170786);
    d2 = gg(d2, a2, b2, c2, buffer.getUint32(24, true), 9, 3225465664);
    c2 = gg(c2, d2, a2, b2, buffer.getUint32(44, true), 14, 643717713);
    b2 = gg(b2, c2, d2, a2, buffer.getUint32(0, true), 20, 3921069994);
    a2 = gg(a2, b2, c2, d2, buffer.getUint32(20, true), 5, 3593408605);
    d2 = gg(d2, a2, b2, c2, buffer.getUint32(40, true), 9, 38016083);
    c2 = gg(c2, d2, a2, b2, buffer.getUint32(60, true), 14, 3634488961);
    b2 = gg(b2, c2, d2, a2, buffer.getUint32(16, true), 20, 3889429448);
    a2 = gg(a2, b2, c2, d2, buffer.getUint32(36, true), 5, 568446438);
    d2 = gg(d2, a2, b2, c2, buffer.getUint32(56, true), 9, 3275163606);
    c2 = gg(c2, d2, a2, b2, buffer.getUint32(12, true), 14, 4107603335);
    b2 = gg(b2, c2, d2, a2, buffer.getUint32(32, true), 20, 1163531501);
    a2 = gg(a2, b2, c2, d2, buffer.getUint32(52, true), 5, 2850285829);
    d2 = gg(d2, a2, b2, c2, buffer.getUint32(8, true), 9, 4243563512);
    c2 = gg(c2, d2, a2, b2, buffer.getUint32(28, true), 14, 1735328473);
    b2 = gg(b2, c2, d2, a2, buffer.getUint32(48, true), 20, 2368359562);
    a2 = hh(a2, b2, c2, d2, buffer.getUint32(20, true), 4, 4294588738);
    d2 = hh(d2, a2, b2, c2, buffer.getUint32(32, true), 11, 2272392833);
    c2 = hh(c2, d2, a2, b2, buffer.getUint32(44, true), 16, 1839030562);
    b2 = hh(b2, c2, d2, a2, buffer.getUint32(56, true), 23, 4259657740);
    a2 = hh(a2, b2, c2, d2, buffer.getUint32(4, true), 4, 2763975236);
    d2 = hh(d2, a2, b2, c2, buffer.getUint32(16, true), 11, 1272893353);
    c2 = hh(c2, d2, a2, b2, buffer.getUint32(28, true), 16, 4139469664);
    b2 = hh(b2, c2, d2, a2, buffer.getUint32(40, true), 23, 3200236656);
    a2 = hh(a2, b2, c2, d2, buffer.getUint32(52, true), 4, 681279174);
    d2 = hh(d2, a2, b2, c2, buffer.getUint32(0, true), 11, 3936430074);
    c2 = hh(c2, d2, a2, b2, buffer.getUint32(12, true), 16, 3572445317);
    b2 = hh(b2, c2, d2, a2, buffer.getUint32(24, true), 23, 76029189);
    a2 = hh(a2, b2, c2, d2, buffer.getUint32(36, true), 4, 3654602809);
    d2 = hh(d2, a2, b2, c2, buffer.getUint32(48, true), 11, 3873151461);
    c2 = hh(c2, d2, a2, b2, buffer.getUint32(60, true), 16, 530742520);
    b2 = hh(b2, c2, d2, a2, buffer.getUint32(8, true), 23, 3299628645);
    a2 = ii(a2, b2, c2, d2, buffer.getUint32(0, true), 6, 4096336452);
    d2 = ii(d2, a2, b2, c2, buffer.getUint32(28, true), 10, 1126891415);
    c2 = ii(c2, d2, a2, b2, buffer.getUint32(56, true), 15, 2878612391);
    b2 = ii(b2, c2, d2, a2, buffer.getUint32(20, true), 21, 4237533241);
    a2 = ii(a2, b2, c2, d2, buffer.getUint32(48, true), 6, 1700485571);
    d2 = ii(d2, a2, b2, c2, buffer.getUint32(12, true), 10, 2399980690);
    c2 = ii(c2, d2, a2, b2, buffer.getUint32(40, true), 15, 4293915773);
    b2 = ii(b2, c2, d2, a2, buffer.getUint32(4, true), 21, 2240044497);
    a2 = ii(a2, b2, c2, d2, buffer.getUint32(32, true), 6, 1873313359);
    d2 = ii(d2, a2, b2, c2, buffer.getUint32(60, true), 10, 4264355552);
    c2 = ii(c2, d2, a2, b2, buffer.getUint32(24, true), 15, 2734768916);
    b2 = ii(b2, c2, d2, a2, buffer.getUint32(52, true), 21, 1309151649);
    a2 = ii(a2, b2, c2, d2, buffer.getUint32(16, true), 6, 4149444226);
    d2 = ii(d2, a2, b2, c2, buffer.getUint32(44, true), 10, 3174756917);
    c2 = ii(c2, d2, a2, b2, buffer.getUint32(8, true), 15, 718787259);
    b2 = ii(b2, c2, d2, a2, buffer.getUint32(36, true), 21, 3951481745);
    state[0] = a2 + state[0] & 4294967295;
    state[1] = b2 + state[1] & 4294967295;
    state[2] = c2 + state[2] & 4294967295;
    state[3] = d2 + state[3] & 4294967295;
  }
  reset() {
    this.state = Uint32Array.from(INIT);
    this.buffer = new DataView(new ArrayBuffer(BLOCK_SIZE));
    this.bufferLength = 0;
    this.bytesHashed = 0;
    this.finished = false;
  }
};
function cmn(q2, a2, b2, x2, s2, t2) {
  a2 = (a2 + q2 & 4294967295) + (x2 + t2 & 4294967295) & 4294967295;
  return (a2 << s2 | a2 >>> 32 - s2) + b2 & 4294967295;
}
function ff(a2, b2, c2, d2, x2, s2, t2) {
  return cmn(b2 & c2 | ~b2 & d2, a2, b2, x2, s2, t2);
}
function gg(a2, b2, c2, d2, x2, s2, t2) {
  return cmn(b2 & d2 | c2 & ~d2, a2, b2, x2, s2, t2);
}
function hh(a2, b2, c2, d2, x2, s2, t2) {
  return cmn(b2 ^ c2 ^ d2, a2, b2, x2, s2, t2);
}
function ii(a2, b2, c2, d2, x2, s2, t2) {
  return cmn(c2 ^ (b2 | ~d2), a2, b2, x2, s2, t2);
}
function isEmptyData3(data) {
  if (typeof data === "string") {
    return data.length === 0;
  }
  return data.byteLength === 0;
}
function convertToBuffer3(data) {
  if (typeof data === "string") {
    return fromUtf8(data);
  }
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength / Uint8Array.BYTES_PER_ELEMENT);
  }
  return new Uint8Array(data);
}

// node_modules/@aws-sdk/client-s3/dist-es/runtimeConfig.shared.js
var import_dist232 = __toESM(require_dist());
var import_dist233 = __toESM(require_dist2());
var import_dist234 = __toESM(require_dist3());
var getRuntimeConfig = (config) => {
  return {
    apiVersion: "2006-03-01",
    base64Decoder: (config == null ? void 0 : config.base64Decoder) ?? fromBase64,
    base64Encoder: (config == null ? void 0 : config.base64Encoder) ?? toBase64,
    disableHostPrefix: (config == null ? void 0 : config.disableHostPrefix) ?? false,
    endpointProvider: (config == null ? void 0 : config.endpointProvider) ?? defaultEndpointResolver,
    extensions: (config == null ? void 0 : config.extensions) ?? [],
    getAwsChunkedEncodingStream: (config == null ? void 0 : config.getAwsChunkedEncodingStream) ?? getAwsChunkedEncodingStream,
    httpAuthSchemeProvider: (config == null ? void 0 : config.httpAuthSchemeProvider) ?? defaultS3HttpAuthSchemeProvider,
    httpAuthSchemes: (config == null ? void 0 : config.httpAuthSchemes) ?? [
      {
        schemeId: "aws.auth#sigv4",
        identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4"),
        signer: new AwsSdkSigV4Signer()
      },
      {
        schemeId: "aws.auth#sigv4a",
        identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4a"),
        signer: new AwsSdkSigV4ASigner()
      }
    ],
    logger: (config == null ? void 0 : config.logger) ?? new NoOpLogger(),
    sdkStreamMixin: (config == null ? void 0 : config.sdkStreamMixin) ?? sdkStreamMixin,
    serviceId: (config == null ? void 0 : config.serviceId) ?? "S3",
    signerConstructor: (config == null ? void 0 : config.signerConstructor) ?? SignatureV4MultiRegion,
    signingEscapePath: (config == null ? void 0 : config.signingEscapePath) ?? false,
    urlParser: (config == null ? void 0 : config.urlParser) ?? parseUrl,
    useArnRegion: (config == null ? void 0 : config.useArnRegion) ?? false,
    utf8Decoder: (config == null ? void 0 : config.utf8Decoder) ?? fromUtf8,
    utf8Encoder: (config == null ? void 0 : config.utf8Encoder) ?? toUtf8
  };
};

// node_modules/@aws-sdk/client-s3/dist-es/runtimeConfig.browser.js
var getRuntimeConfig2 = (config) => {
  const defaultsMode = resolveDefaultsModeConfig(config);
  const defaultConfigProvider = () => defaultsMode().then(loadConfigsForDefaultMode);
  const clientSharedValues = getRuntimeConfig(config);
  return {
    ...clientSharedValues,
    ...config,
    runtime: "browser",
    defaultsMode,
    bodyLengthChecker: (config == null ? void 0 : config.bodyLengthChecker) ?? calculateBodyLength,
    credentialDefaultProvider: (config == null ? void 0 : config.credentialDefaultProvider) ?? ((_) => () => Promise.reject(new Error("Credential is missing"))),
    defaultUserAgentProvider: (config == null ? void 0 : config.defaultUserAgentProvider) ?? createDefaultUserAgentProvider({ serviceId: clientSharedValues.serviceId, clientVersion: package_default.version }),
    eventStreamSerdeProvider: (config == null ? void 0 : config.eventStreamSerdeProvider) ?? eventStreamSerdeProvider,
    maxAttempts: (config == null ? void 0 : config.maxAttempts) ?? DEFAULT_MAX_ATTEMPTS,
    md5: (config == null ? void 0 : config.md5) ?? Md5,
    region: (config == null ? void 0 : config.region) ?? invalidProvider("Region is missing"),
    requestHandler: FetchHttpHandler.create((config == null ? void 0 : config.requestHandler) ?? defaultConfigProvider),
    retryMode: (config == null ? void 0 : config.retryMode) ?? (async () => (await defaultConfigProvider()).retryMode || DEFAULT_RETRY_MODE),
    sha1: (config == null ? void 0 : config.sha1) ?? Sha12,
    sha256: (config == null ? void 0 : config.sha256) ?? Sha256,
    streamCollector: (config == null ? void 0 : config.streamCollector) ?? streamCollector,
    streamHasher: (config == null ? void 0 : config.streamHasher) ?? blobHasher,
    useDualstackEndpoint: (config == null ? void 0 : config.useDualstackEndpoint) ?? (() => Promise.resolve(DEFAULT_USE_DUALSTACK_ENDPOINT)),
    useFipsEndpoint: (config == null ? void 0 : config.useFipsEndpoint) ?? (() => Promise.resolve(DEFAULT_USE_FIPS_ENDPOINT))
  };
};

// node_modules/@aws-sdk/client-s3/dist-es/runtimeExtensions.js
var import_dist241 = __toESM(require_dist());
var import_dist242 = __toESM(require_dist2());
var import_dist243 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-s3/dist-es/auth/httpAuthExtensionConfiguration.js
var import_dist238 = __toESM(require_dist());
var import_dist239 = __toESM(require_dist2());
var import_dist240 = __toESM(require_dist3());
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

// node_modules/@aws-sdk/client-s3/dist-es/runtimeExtensions.js
var resolveRuntimeExtensions = (runtimeConfig, extensions) => {
  const extensionConfiguration = Object.assign(getAwsRegionExtensionConfiguration(runtimeConfig), getDefaultExtensionConfiguration(runtimeConfig), getHttpHandlerExtensionConfiguration(runtimeConfig), getHttpAuthExtensionConfiguration(runtimeConfig));
  extensions.forEach((extension) => extension.configure(extensionConfiguration));
  return Object.assign(runtimeConfig, resolveAwsRegionExtensionConfiguration(extensionConfiguration), resolveDefaultRuntimeConfig(extensionConfiguration), resolveHttpHandlerRuntimeConfig(extensionConfiguration), resolveHttpAuthRuntimeConfig(extensionConfiguration));
};

// node_modules/@aws-sdk/client-s3/dist-es/S3Client.js
var S3Client = class extends Client {
  constructor(...[configuration]) {
    const _config_0 = getRuntimeConfig2(configuration || {});
    super(_config_0);
    __publicField(this, "config");
    this.initConfig = _config_0;
    const _config_1 = resolveClientEndpointParameters(_config_0);
    const _config_2 = resolveUserAgentConfig(_config_1);
    const _config_3 = resolveFlexibleChecksumsConfig(_config_2);
    const _config_4 = resolveRetryConfig(_config_3);
    const _config_5 = resolveRegionConfig(_config_4);
    const _config_6 = resolveHostHeaderConfig(_config_5);
    const _config_7 = resolveEndpointConfig(_config_6);
    const _config_8 = resolveEventStreamSerdeConfig(_config_7);
    const _config_9 = resolveHttpAuthSchemeConfig(_config_8);
    const _config_10 = resolveS3Config(_config_9, { session: [() => this, CreateSessionCommand] });
    const _config_11 = resolveRuntimeExtensions(_config_10, (configuration == null ? void 0 : configuration.extensions) || []);
    this.config = _config_11;
    this.middlewareStack.use(getUserAgentPlugin(this.config));
    this.middlewareStack.use(getRetryPlugin(this.config));
    this.middlewareStack.use(getContentLengthPlugin(this.config));
    this.middlewareStack.use(getHostHeaderPlugin(this.config));
    this.middlewareStack.use(getLoggerPlugin(this.config));
    this.middlewareStack.use(getRecursionDetectionPlugin(this.config));
    this.middlewareStack.use(getHttpAuthSchemeEndpointRuleSetPlugin(this.config, {
      httpAuthSchemeParametersProvider: defaultS3HttpAuthSchemeParametersProvider,
      identityProviderConfigProvider: async (config) => new DefaultIdentityProviderConfig({
        "aws.auth#sigv4": config.credentials,
        "aws.auth#sigv4a": config.credentials
      })
    }));
    this.middlewareStack.use(getHttpSigningPlugin(this.config));
    this.middlewareStack.use(getValidateBucketNamePlugin(this.config));
    this.middlewareStack.use(getAddExpectContinuePlugin(this.config));
    this.middlewareStack.use(getRegionRedirectMiddlewarePlugin(this.config));
    this.middlewareStack.use(getS3ExpressPlugin(this.config));
    this.middlewareStack.use(getS3ExpressHttpSigningPlugin(this.config));
  }
  destroy() {
    super.destroy();
  }
};

// node_modules/@aws-sdk/client-s3/dist-es/S3.js
var import_dist544 = __toESM(require_dist());
var import_dist545 = __toESM(require_dist2());
var import_dist546 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-s3/dist-es/commands/AbortMultipartUploadCommand.js
var import_dist247 = __toESM(require_dist());
var import_dist248 = __toESM(require_dist2());
var import_dist249 = __toESM(require_dist3());
var AbortMultipartUploadCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" },
  Key: { type: "contextParams", name: "Key" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "AbortMultipartUpload", {}).n("S3Client", "AbortMultipartUploadCommand").f(void 0, void 0).ser(se_AbortMultipartUploadCommand).de(de_AbortMultipartUploadCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/CompleteMultipartUploadCommand.js
var import_dist253 = __toESM(require_dist());
var import_dist254 = __toESM(require_dist2());
var import_dist255 = __toESM(require_dist3());

// node_modules/@aws-sdk/middleware-ssec/dist-es/index.js
var import_dist250 = __toESM(require_dist());
var import_dist251 = __toESM(require_dist2());
var import_dist252 = __toESM(require_dist3());
function ssecMiddleware(options) {
  return (next) => async (args) => {
    const input = { ...args.input };
    const properties = [
      {
        target: "SSECustomerKey",
        hash: "SSECustomerKeyMD5"
      },
      {
        target: "CopySourceSSECustomerKey",
        hash: "CopySourceSSECustomerKeyMD5"
      }
    ];
    for (const prop of properties) {
      const value = input[prop.target];
      if (value) {
        let valueForHash;
        if (typeof value === "string") {
          if (isValidBase64EncodedSSECustomerKey(value, options)) {
            valueForHash = options.base64Decoder(value);
          } else {
            valueForHash = options.utf8Decoder(value);
            input[prop.target] = options.base64Encoder(valueForHash);
          }
        } else {
          valueForHash = ArrayBuffer.isView(value) ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength) : new Uint8Array(value);
          input[prop.target] = options.base64Encoder(valueForHash);
        }
        const hash = new options.md5();
        hash.update(valueForHash);
        input[prop.hash] = options.base64Encoder(await hash.digest());
      }
    }
    return next({
      ...args,
      input
    });
  };
}
var ssecMiddlewareOptions = {
  name: "ssecMiddleware",
  step: "initialize",
  tags: ["SSE"],
  override: true
};
var getSsecPlugin = (config) => ({
  applyToStack: (clientStack) => {
    clientStack.add(ssecMiddleware(config), ssecMiddlewareOptions);
  }
});
function isValidBase64EncodedSSECustomerKey(str, options) {
  const base64Regex = /^(?:[A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  if (!base64Regex.test(str))
    return false;
  try {
    const decodedBytes = options.base64Decoder(str);
    return decodedBytes.length === 32;
  } catch {
    return false;
  }
}

// node_modules/@aws-sdk/client-s3/dist-es/commands/CompleteMultipartUploadCommand.js
var CompleteMultipartUploadCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" },
  Key: { type: "contextParams", name: "Key" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config),
    getSsecPlugin(config)
  ];
}).s("AmazonS3", "CompleteMultipartUpload", {}).n("S3Client", "CompleteMultipartUploadCommand").f(CompleteMultipartUploadRequestFilterSensitiveLog, CompleteMultipartUploadOutputFilterSensitiveLog).ser(se_CompleteMultipartUploadCommand).de(de_CompleteMultipartUploadCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/CopyObjectCommand.js
var import_dist256 = __toESM(require_dist());
var import_dist257 = __toESM(require_dist2());
var import_dist258 = __toESM(require_dist3());
var CopyObjectCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  DisableS3ExpressSessionAuth: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" },
  Key: { type: "contextParams", name: "Key" },
  CopySource: { type: "contextParams", name: "CopySource" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config),
    getSsecPlugin(config)
  ];
}).s("AmazonS3", "CopyObject", {}).n("S3Client", "CopyObjectCommand").f(CopyObjectRequestFilterSensitiveLog, CopyObjectOutputFilterSensitiveLog).ser(se_CopyObjectCommand).de(de_CopyObjectCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/CreateBucketCommand.js
var import_dist262 = __toESM(require_dist());
var import_dist263 = __toESM(require_dist2());
var import_dist264 = __toESM(require_dist3());

// node_modules/@aws-sdk/middleware-location-constraint/dist-es/index.js
var import_dist259 = __toESM(require_dist());
var import_dist260 = __toESM(require_dist2());
var import_dist261 = __toESM(require_dist3());
function locationConstraintMiddleware(options) {
  return (next) => async (args) => {
    const { CreateBucketConfiguration } = args.input;
    const region = await options.region();
    if (!(CreateBucketConfiguration == null ? void 0 : CreateBucketConfiguration.LocationConstraint) && !(CreateBucketConfiguration == null ? void 0 : CreateBucketConfiguration.Location)) {
      args = {
        ...args,
        input: {
          ...args.input,
          CreateBucketConfiguration: region === "us-east-1" ? void 0 : { LocationConstraint: region }
        }
      };
    }
    return next(args);
  };
}
var locationConstraintMiddlewareOptions = {
  step: "initialize",
  tags: ["LOCATION_CONSTRAINT", "CREATE_BUCKET_CONFIGURATION"],
  name: "locationConstraintMiddleware",
  override: true
};
var getLocationConstraintPlugin = (config) => ({
  applyToStack: (clientStack) => {
    clientStack.add(locationConstraintMiddleware(config), locationConstraintMiddlewareOptions);
  }
});

// node_modules/@aws-sdk/client-s3/dist-es/commands/CreateBucketCommand.js
var CreateBucketCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  DisableAccessPoints: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config),
    getLocationConstraintPlugin(config)
  ];
}).s("AmazonS3", "CreateBucket", {}).n("S3Client", "CreateBucketCommand").f(void 0, void 0).ser(se_CreateBucketCommand).de(de_CreateBucketCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/CreateBucketMetadataTableConfigurationCommand.js
var import_dist265 = __toESM(require_dist());
var import_dist266 = __toESM(require_dist2());
var import_dist267 = __toESM(require_dist3());
var CreateBucketMetadataTableConfigurationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: true
    })
  ];
}).s("AmazonS3", "CreateBucketMetadataTableConfiguration", {}).n("S3Client", "CreateBucketMetadataTableConfigurationCommand").f(void 0, void 0).ser(se_CreateBucketMetadataTableConfigurationCommand).de(de_CreateBucketMetadataTableConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/CreateMultipartUploadCommand.js
var import_dist268 = __toESM(require_dist());
var import_dist269 = __toESM(require_dist2());
var import_dist270 = __toESM(require_dist3());
var CreateMultipartUploadCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" },
  Key: { type: "contextParams", name: "Key" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config),
    getSsecPlugin(config)
  ];
}).s("AmazonS3", "CreateMultipartUpload", {}).n("S3Client", "CreateMultipartUploadCommand").f(CreateMultipartUploadRequestFilterSensitiveLog, CreateMultipartUploadOutputFilterSensitiveLog).ser(se_CreateMultipartUploadCommand).de(de_CreateMultipartUploadCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/DeleteBucketAnalyticsConfigurationCommand.js
var import_dist271 = __toESM(require_dist());
var import_dist272 = __toESM(require_dist2());
var import_dist273 = __toESM(require_dist3());
var DeleteBucketAnalyticsConfigurationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AmazonS3", "DeleteBucketAnalyticsConfiguration", {}).n("S3Client", "DeleteBucketAnalyticsConfigurationCommand").f(void 0, void 0).ser(se_DeleteBucketAnalyticsConfigurationCommand).de(de_DeleteBucketAnalyticsConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/DeleteBucketCommand.js
var import_dist274 = __toESM(require_dist());
var import_dist275 = __toESM(require_dist2());
var import_dist276 = __toESM(require_dist3());
var DeleteBucketCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AmazonS3", "DeleteBucket", {}).n("S3Client", "DeleteBucketCommand").f(void 0, void 0).ser(se_DeleteBucketCommand).de(de_DeleteBucketCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/DeleteBucketCorsCommand.js
var import_dist277 = __toESM(require_dist());
var import_dist278 = __toESM(require_dist2());
var import_dist279 = __toESM(require_dist3());
var DeleteBucketCorsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AmazonS3", "DeleteBucketCors", {}).n("S3Client", "DeleteBucketCorsCommand").f(void 0, void 0).ser(se_DeleteBucketCorsCommand).de(de_DeleteBucketCorsCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/DeleteBucketEncryptionCommand.js
var import_dist280 = __toESM(require_dist());
var import_dist281 = __toESM(require_dist2());
var import_dist282 = __toESM(require_dist3());
var DeleteBucketEncryptionCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AmazonS3", "DeleteBucketEncryption", {}).n("S3Client", "DeleteBucketEncryptionCommand").f(void 0, void 0).ser(se_DeleteBucketEncryptionCommand).de(de_DeleteBucketEncryptionCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/DeleteBucketIntelligentTieringConfigurationCommand.js
var import_dist283 = __toESM(require_dist());
var import_dist284 = __toESM(require_dist2());
var import_dist285 = __toESM(require_dist3());
var DeleteBucketIntelligentTieringConfigurationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AmazonS3", "DeleteBucketIntelligentTieringConfiguration", {}).n("S3Client", "DeleteBucketIntelligentTieringConfigurationCommand").f(void 0, void 0).ser(se_DeleteBucketIntelligentTieringConfigurationCommand).de(de_DeleteBucketIntelligentTieringConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/DeleteBucketInventoryConfigurationCommand.js
var import_dist286 = __toESM(require_dist());
var import_dist287 = __toESM(require_dist2());
var import_dist288 = __toESM(require_dist3());
var DeleteBucketInventoryConfigurationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AmazonS3", "DeleteBucketInventoryConfiguration", {}).n("S3Client", "DeleteBucketInventoryConfigurationCommand").f(void 0, void 0).ser(se_DeleteBucketInventoryConfigurationCommand).de(de_DeleteBucketInventoryConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/DeleteBucketLifecycleCommand.js
var import_dist289 = __toESM(require_dist());
var import_dist290 = __toESM(require_dist2());
var import_dist291 = __toESM(require_dist3());
var DeleteBucketLifecycleCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AmazonS3", "DeleteBucketLifecycle", {}).n("S3Client", "DeleteBucketLifecycleCommand").f(void 0, void 0).ser(se_DeleteBucketLifecycleCommand).de(de_DeleteBucketLifecycleCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/DeleteBucketMetadataTableConfigurationCommand.js
var import_dist292 = __toESM(require_dist());
var import_dist293 = __toESM(require_dist2());
var import_dist294 = __toESM(require_dist3());
var DeleteBucketMetadataTableConfigurationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AmazonS3", "DeleteBucketMetadataTableConfiguration", {}).n("S3Client", "DeleteBucketMetadataTableConfigurationCommand").f(void 0, void 0).ser(se_DeleteBucketMetadataTableConfigurationCommand).de(de_DeleteBucketMetadataTableConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/DeleteBucketMetricsConfigurationCommand.js
var import_dist295 = __toESM(require_dist());
var import_dist296 = __toESM(require_dist2());
var import_dist297 = __toESM(require_dist3());
var DeleteBucketMetricsConfigurationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AmazonS3", "DeleteBucketMetricsConfiguration", {}).n("S3Client", "DeleteBucketMetricsConfigurationCommand").f(void 0, void 0).ser(se_DeleteBucketMetricsConfigurationCommand).de(de_DeleteBucketMetricsConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/DeleteBucketOwnershipControlsCommand.js
var import_dist298 = __toESM(require_dist());
var import_dist299 = __toESM(require_dist2());
var import_dist300 = __toESM(require_dist3());
var DeleteBucketOwnershipControlsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AmazonS3", "DeleteBucketOwnershipControls", {}).n("S3Client", "DeleteBucketOwnershipControlsCommand").f(void 0, void 0).ser(se_DeleteBucketOwnershipControlsCommand).de(de_DeleteBucketOwnershipControlsCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/DeleteBucketPolicyCommand.js
var import_dist301 = __toESM(require_dist());
var import_dist302 = __toESM(require_dist2());
var import_dist303 = __toESM(require_dist3());
var DeleteBucketPolicyCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AmazonS3", "DeleteBucketPolicy", {}).n("S3Client", "DeleteBucketPolicyCommand").f(void 0, void 0).ser(se_DeleteBucketPolicyCommand).de(de_DeleteBucketPolicyCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/DeleteBucketReplicationCommand.js
var import_dist304 = __toESM(require_dist());
var import_dist305 = __toESM(require_dist2());
var import_dist306 = __toESM(require_dist3());
var DeleteBucketReplicationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AmazonS3", "DeleteBucketReplication", {}).n("S3Client", "DeleteBucketReplicationCommand").f(void 0, void 0).ser(se_DeleteBucketReplicationCommand).de(de_DeleteBucketReplicationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/DeleteBucketTaggingCommand.js
var import_dist307 = __toESM(require_dist());
var import_dist308 = __toESM(require_dist2());
var import_dist309 = __toESM(require_dist3());
var DeleteBucketTaggingCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AmazonS3", "DeleteBucketTagging", {}).n("S3Client", "DeleteBucketTaggingCommand").f(void 0, void 0).ser(se_DeleteBucketTaggingCommand).de(de_DeleteBucketTaggingCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/DeleteBucketWebsiteCommand.js
var import_dist310 = __toESM(require_dist());
var import_dist311 = __toESM(require_dist2());
var import_dist312 = __toESM(require_dist3());
var DeleteBucketWebsiteCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AmazonS3", "DeleteBucketWebsite", {}).n("S3Client", "DeleteBucketWebsiteCommand").f(void 0, void 0).ser(se_DeleteBucketWebsiteCommand).de(de_DeleteBucketWebsiteCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/DeleteObjectCommand.js
var import_dist313 = __toESM(require_dist());
var import_dist314 = __toESM(require_dist2());
var import_dist315 = __toESM(require_dist3());
var DeleteObjectCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" },
  Key: { type: "contextParams", name: "Key" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "DeleteObject", {}).n("S3Client", "DeleteObjectCommand").f(void 0, void 0).ser(se_DeleteObjectCommand).de(de_DeleteObjectCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/DeleteObjectsCommand.js
var import_dist316 = __toESM(require_dist());
var import_dist317 = __toESM(require_dist2());
var import_dist318 = __toESM(require_dist3());
var DeleteObjectsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: true
    }),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "DeleteObjects", {}).n("S3Client", "DeleteObjectsCommand").f(void 0, void 0).ser(se_DeleteObjectsCommand).de(de_DeleteObjectsCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/DeleteObjectTaggingCommand.js
var import_dist319 = __toESM(require_dist());
var import_dist320 = __toESM(require_dist2());
var import_dist321 = __toESM(require_dist3());
var DeleteObjectTaggingCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "DeleteObjectTagging", {}).n("S3Client", "DeleteObjectTaggingCommand").f(void 0, void 0).ser(se_DeleteObjectTaggingCommand).de(de_DeleteObjectTaggingCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/DeletePublicAccessBlockCommand.js
var import_dist322 = __toESM(require_dist());
var import_dist323 = __toESM(require_dist2());
var import_dist324 = __toESM(require_dist3());
var DeletePublicAccessBlockCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AmazonS3", "DeletePublicAccessBlock", {}).n("S3Client", "DeletePublicAccessBlockCommand").f(void 0, void 0).ser(se_DeletePublicAccessBlockCommand).de(de_DeletePublicAccessBlockCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetBucketAccelerateConfigurationCommand.js
var import_dist325 = __toESM(require_dist());
var import_dist326 = __toESM(require_dist2());
var import_dist327 = __toESM(require_dist3());
var GetBucketAccelerateConfigurationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetBucketAccelerateConfiguration", {}).n("S3Client", "GetBucketAccelerateConfigurationCommand").f(void 0, void 0).ser(se_GetBucketAccelerateConfigurationCommand).de(de_GetBucketAccelerateConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetBucketAclCommand.js
var import_dist328 = __toESM(require_dist());
var import_dist329 = __toESM(require_dist2());
var import_dist330 = __toESM(require_dist3());
var GetBucketAclCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetBucketAcl", {}).n("S3Client", "GetBucketAclCommand").f(void 0, void 0).ser(se_GetBucketAclCommand).de(de_GetBucketAclCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetBucketAnalyticsConfigurationCommand.js
var import_dist331 = __toESM(require_dist());
var import_dist332 = __toESM(require_dist2());
var import_dist333 = __toESM(require_dist3());
var GetBucketAnalyticsConfigurationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetBucketAnalyticsConfiguration", {}).n("S3Client", "GetBucketAnalyticsConfigurationCommand").f(void 0, void 0).ser(se_GetBucketAnalyticsConfigurationCommand).de(de_GetBucketAnalyticsConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetBucketCorsCommand.js
var import_dist334 = __toESM(require_dist());
var import_dist335 = __toESM(require_dist2());
var import_dist336 = __toESM(require_dist3());
var GetBucketCorsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetBucketCors", {}).n("S3Client", "GetBucketCorsCommand").f(void 0, void 0).ser(se_GetBucketCorsCommand).de(de_GetBucketCorsCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetBucketEncryptionCommand.js
var import_dist337 = __toESM(require_dist());
var import_dist338 = __toESM(require_dist2());
var import_dist339 = __toESM(require_dist3());
var GetBucketEncryptionCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetBucketEncryption", {}).n("S3Client", "GetBucketEncryptionCommand").f(void 0, GetBucketEncryptionOutputFilterSensitiveLog).ser(se_GetBucketEncryptionCommand).de(de_GetBucketEncryptionCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetBucketIntelligentTieringConfigurationCommand.js
var import_dist340 = __toESM(require_dist());
var import_dist341 = __toESM(require_dist2());
var import_dist342 = __toESM(require_dist3());
var GetBucketIntelligentTieringConfigurationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetBucketIntelligentTieringConfiguration", {}).n("S3Client", "GetBucketIntelligentTieringConfigurationCommand").f(void 0, void 0).ser(se_GetBucketIntelligentTieringConfigurationCommand).de(de_GetBucketIntelligentTieringConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetBucketInventoryConfigurationCommand.js
var import_dist343 = __toESM(require_dist());
var import_dist344 = __toESM(require_dist2());
var import_dist345 = __toESM(require_dist3());
var GetBucketInventoryConfigurationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetBucketInventoryConfiguration", {}).n("S3Client", "GetBucketInventoryConfigurationCommand").f(void 0, GetBucketInventoryConfigurationOutputFilterSensitiveLog).ser(se_GetBucketInventoryConfigurationCommand).de(de_GetBucketInventoryConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetBucketLifecycleConfigurationCommand.js
var import_dist346 = __toESM(require_dist());
var import_dist347 = __toESM(require_dist2());
var import_dist348 = __toESM(require_dist3());
var GetBucketLifecycleConfigurationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetBucketLifecycleConfiguration", {}).n("S3Client", "GetBucketLifecycleConfigurationCommand").f(void 0, void 0).ser(se_GetBucketLifecycleConfigurationCommand).de(de_GetBucketLifecycleConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetBucketLocationCommand.js
var import_dist349 = __toESM(require_dist());
var import_dist350 = __toESM(require_dist2());
var import_dist351 = __toESM(require_dist3());
var GetBucketLocationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetBucketLocation", {}).n("S3Client", "GetBucketLocationCommand").f(void 0, void 0).ser(se_GetBucketLocationCommand).de(de_GetBucketLocationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetBucketLoggingCommand.js
var import_dist352 = __toESM(require_dist());
var import_dist353 = __toESM(require_dist2());
var import_dist354 = __toESM(require_dist3());
var GetBucketLoggingCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetBucketLogging", {}).n("S3Client", "GetBucketLoggingCommand").f(void 0, void 0).ser(se_GetBucketLoggingCommand).de(de_GetBucketLoggingCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetBucketMetadataTableConfigurationCommand.js
var import_dist355 = __toESM(require_dist());
var import_dist356 = __toESM(require_dist2());
var import_dist357 = __toESM(require_dist3());
var GetBucketMetadataTableConfigurationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetBucketMetadataTableConfiguration", {}).n("S3Client", "GetBucketMetadataTableConfigurationCommand").f(void 0, void 0).ser(se_GetBucketMetadataTableConfigurationCommand).de(de_GetBucketMetadataTableConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetBucketMetricsConfigurationCommand.js
var import_dist358 = __toESM(require_dist());
var import_dist359 = __toESM(require_dist2());
var import_dist360 = __toESM(require_dist3());
var GetBucketMetricsConfigurationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetBucketMetricsConfiguration", {}).n("S3Client", "GetBucketMetricsConfigurationCommand").f(void 0, void 0).ser(se_GetBucketMetricsConfigurationCommand).de(de_GetBucketMetricsConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetBucketNotificationConfigurationCommand.js
var import_dist361 = __toESM(require_dist());
var import_dist362 = __toESM(require_dist2());
var import_dist363 = __toESM(require_dist3());
var GetBucketNotificationConfigurationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetBucketNotificationConfiguration", {}).n("S3Client", "GetBucketNotificationConfigurationCommand").f(void 0, void 0).ser(se_GetBucketNotificationConfigurationCommand).de(de_GetBucketNotificationConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetBucketOwnershipControlsCommand.js
var import_dist364 = __toESM(require_dist());
var import_dist365 = __toESM(require_dist2());
var import_dist366 = __toESM(require_dist3());
var GetBucketOwnershipControlsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetBucketOwnershipControls", {}).n("S3Client", "GetBucketOwnershipControlsCommand").f(void 0, void 0).ser(se_GetBucketOwnershipControlsCommand).de(de_GetBucketOwnershipControlsCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetBucketPolicyCommand.js
var import_dist367 = __toESM(require_dist());
var import_dist368 = __toESM(require_dist2());
var import_dist369 = __toESM(require_dist3());
var GetBucketPolicyCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetBucketPolicy", {}).n("S3Client", "GetBucketPolicyCommand").f(void 0, void 0).ser(se_GetBucketPolicyCommand).de(de_GetBucketPolicyCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetBucketPolicyStatusCommand.js
var import_dist370 = __toESM(require_dist());
var import_dist371 = __toESM(require_dist2());
var import_dist372 = __toESM(require_dist3());
var GetBucketPolicyStatusCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetBucketPolicyStatus", {}).n("S3Client", "GetBucketPolicyStatusCommand").f(void 0, void 0).ser(se_GetBucketPolicyStatusCommand).de(de_GetBucketPolicyStatusCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetBucketReplicationCommand.js
var import_dist373 = __toESM(require_dist());
var import_dist374 = __toESM(require_dist2());
var import_dist375 = __toESM(require_dist3());
var GetBucketReplicationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetBucketReplication", {}).n("S3Client", "GetBucketReplicationCommand").f(void 0, void 0).ser(se_GetBucketReplicationCommand).de(de_GetBucketReplicationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetBucketRequestPaymentCommand.js
var import_dist376 = __toESM(require_dist());
var import_dist377 = __toESM(require_dist2());
var import_dist378 = __toESM(require_dist3());
var GetBucketRequestPaymentCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetBucketRequestPayment", {}).n("S3Client", "GetBucketRequestPaymentCommand").f(void 0, void 0).ser(se_GetBucketRequestPaymentCommand).de(de_GetBucketRequestPaymentCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetBucketTaggingCommand.js
var import_dist379 = __toESM(require_dist());
var import_dist380 = __toESM(require_dist2());
var import_dist381 = __toESM(require_dist3());
var GetBucketTaggingCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetBucketTagging", {}).n("S3Client", "GetBucketTaggingCommand").f(void 0, void 0).ser(se_GetBucketTaggingCommand).de(de_GetBucketTaggingCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetBucketVersioningCommand.js
var import_dist382 = __toESM(require_dist());
var import_dist383 = __toESM(require_dist2());
var import_dist384 = __toESM(require_dist3());
var GetBucketVersioningCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetBucketVersioning", {}).n("S3Client", "GetBucketVersioningCommand").f(void 0, void 0).ser(se_GetBucketVersioningCommand).de(de_GetBucketVersioningCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetBucketWebsiteCommand.js
var import_dist385 = __toESM(require_dist());
var import_dist386 = __toESM(require_dist2());
var import_dist387 = __toESM(require_dist3());
var GetBucketWebsiteCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetBucketWebsite", {}).n("S3Client", "GetBucketWebsiteCommand").f(void 0, void 0).ser(se_GetBucketWebsiteCommand).de(de_GetBucketWebsiteCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetObjectAclCommand.js
var import_dist388 = __toESM(require_dist());
var import_dist389 = __toESM(require_dist2());
var import_dist390 = __toESM(require_dist3());
var GetObjectAclCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" },
  Key: { type: "contextParams", name: "Key" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetObjectAcl", {}).n("S3Client", "GetObjectAclCommand").f(void 0, void 0).ser(se_GetObjectAclCommand).de(de_GetObjectAclCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetObjectAttributesCommand.js
var import_dist391 = __toESM(require_dist());
var import_dist392 = __toESM(require_dist2());
var import_dist393 = __toESM(require_dist3());
var GetObjectAttributesCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config),
    getSsecPlugin(config)
  ];
}).s("AmazonS3", "GetObjectAttributes", {}).n("S3Client", "GetObjectAttributesCommand").f(GetObjectAttributesRequestFilterSensitiveLog, void 0).ser(se_GetObjectAttributesCommand).de(de_GetObjectAttributesCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetObjectCommand.js
var import_dist394 = __toESM(require_dist());
var import_dist395 = __toESM(require_dist2());
var import_dist396 = __toESM(require_dist3());
var GetObjectCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" },
  Key: { type: "contextParams", name: "Key" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestChecksumRequired: false,
      requestValidationModeMember: "ChecksumMode",
      responseAlgorithms: ["CRC64NVME", "CRC32", "CRC32C", "SHA256", "SHA1"]
    }),
    getSsecPlugin(config),
    getS3ExpiresMiddlewarePlugin(config)
  ];
}).s("AmazonS3", "GetObject", {}).n("S3Client", "GetObjectCommand").f(GetObjectRequestFilterSensitiveLog, GetObjectOutputFilterSensitiveLog).ser(se_GetObjectCommand).de(de_GetObjectCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetObjectLegalHoldCommand.js
var import_dist397 = __toESM(require_dist());
var import_dist398 = __toESM(require_dist2());
var import_dist399 = __toESM(require_dist3());
var GetObjectLegalHoldCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetObjectLegalHold", {}).n("S3Client", "GetObjectLegalHoldCommand").f(void 0, void 0).ser(se_GetObjectLegalHoldCommand).de(de_GetObjectLegalHoldCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetObjectLockConfigurationCommand.js
var import_dist400 = __toESM(require_dist());
var import_dist401 = __toESM(require_dist2());
var import_dist402 = __toESM(require_dist3());
var GetObjectLockConfigurationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetObjectLockConfiguration", {}).n("S3Client", "GetObjectLockConfigurationCommand").f(void 0, void 0).ser(se_GetObjectLockConfigurationCommand).de(de_GetObjectLockConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetObjectRetentionCommand.js
var import_dist403 = __toESM(require_dist());
var import_dist404 = __toESM(require_dist2());
var import_dist405 = __toESM(require_dist3());
var GetObjectRetentionCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetObjectRetention", {}).n("S3Client", "GetObjectRetentionCommand").f(void 0, void 0).ser(se_GetObjectRetentionCommand).de(de_GetObjectRetentionCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetObjectTaggingCommand.js
var import_dist406 = __toESM(require_dist());
var import_dist407 = __toESM(require_dist2());
var import_dist408 = __toESM(require_dist3());
var GetObjectTaggingCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetObjectTagging", {}).n("S3Client", "GetObjectTaggingCommand").f(void 0, void 0).ser(se_GetObjectTaggingCommand).de(de_GetObjectTaggingCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetObjectTorrentCommand.js
var import_dist409 = __toESM(require_dist());
var import_dist410 = __toESM(require_dist2());
var import_dist411 = __toESM(require_dist3());
var GetObjectTorrentCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AmazonS3", "GetObjectTorrent", {}).n("S3Client", "GetObjectTorrentCommand").f(void 0, GetObjectTorrentOutputFilterSensitiveLog).ser(se_GetObjectTorrentCommand).de(de_GetObjectTorrentCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/GetPublicAccessBlockCommand.js
var import_dist412 = __toESM(require_dist());
var import_dist413 = __toESM(require_dist2());
var import_dist414 = __toESM(require_dist3());
var GetPublicAccessBlockCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "GetPublicAccessBlock", {}).n("S3Client", "GetPublicAccessBlockCommand").f(void 0, void 0).ser(se_GetPublicAccessBlockCommand).de(de_GetPublicAccessBlockCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/HeadBucketCommand.js
var import_dist415 = __toESM(require_dist());
var import_dist416 = __toESM(require_dist2());
var import_dist417 = __toESM(require_dist3());
var HeadBucketCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "HeadBucket", {}).n("S3Client", "HeadBucketCommand").f(void 0, void 0).ser(se_HeadBucketCommand).de(de_HeadBucketCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/HeadObjectCommand.js
var import_dist418 = __toESM(require_dist());
var import_dist419 = __toESM(require_dist2());
var import_dist420 = __toESM(require_dist3());
var HeadObjectCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" },
  Key: { type: "contextParams", name: "Key" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config),
    getSsecPlugin(config),
    getS3ExpiresMiddlewarePlugin(config)
  ];
}).s("AmazonS3", "HeadObject", {}).n("S3Client", "HeadObjectCommand").f(HeadObjectRequestFilterSensitiveLog, HeadObjectOutputFilterSensitiveLog).ser(se_HeadObjectCommand).de(de_HeadObjectCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/ListBucketAnalyticsConfigurationsCommand.js
var import_dist421 = __toESM(require_dist());
var import_dist422 = __toESM(require_dist2());
var import_dist423 = __toESM(require_dist3());
var ListBucketAnalyticsConfigurationsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "ListBucketAnalyticsConfigurations", {}).n("S3Client", "ListBucketAnalyticsConfigurationsCommand").f(void 0, void 0).ser(se_ListBucketAnalyticsConfigurationsCommand).de(de_ListBucketAnalyticsConfigurationsCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/ListBucketIntelligentTieringConfigurationsCommand.js
var import_dist424 = __toESM(require_dist());
var import_dist425 = __toESM(require_dist2());
var import_dist426 = __toESM(require_dist3());
var ListBucketIntelligentTieringConfigurationsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "ListBucketIntelligentTieringConfigurations", {}).n("S3Client", "ListBucketIntelligentTieringConfigurationsCommand").f(void 0, void 0).ser(se_ListBucketIntelligentTieringConfigurationsCommand).de(de_ListBucketIntelligentTieringConfigurationsCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/ListBucketInventoryConfigurationsCommand.js
var import_dist427 = __toESM(require_dist());
var import_dist428 = __toESM(require_dist2());
var import_dist429 = __toESM(require_dist3());
var ListBucketInventoryConfigurationsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "ListBucketInventoryConfigurations", {}).n("S3Client", "ListBucketInventoryConfigurationsCommand").f(void 0, ListBucketInventoryConfigurationsOutputFilterSensitiveLog).ser(se_ListBucketInventoryConfigurationsCommand).de(de_ListBucketInventoryConfigurationsCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/ListBucketMetricsConfigurationsCommand.js
var import_dist430 = __toESM(require_dist());
var import_dist431 = __toESM(require_dist2());
var import_dist432 = __toESM(require_dist3());
var ListBucketMetricsConfigurationsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "ListBucketMetricsConfigurations", {}).n("S3Client", "ListBucketMetricsConfigurationsCommand").f(void 0, void 0).ser(se_ListBucketMetricsConfigurationsCommand).de(de_ListBucketMetricsConfigurationsCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/ListBucketsCommand.js
var import_dist433 = __toESM(require_dist());
var import_dist434 = __toESM(require_dist2());
var import_dist435 = __toESM(require_dist3());
var ListBucketsCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "ListBuckets", {}).n("S3Client", "ListBucketsCommand").f(void 0, void 0).ser(se_ListBucketsCommand).de(de_ListBucketsCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/ListDirectoryBucketsCommand.js
var import_dist436 = __toESM(require_dist());
var import_dist437 = __toESM(require_dist2());
var import_dist438 = __toESM(require_dist3());
var ListDirectoryBucketsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "ListDirectoryBuckets", {}).n("S3Client", "ListDirectoryBucketsCommand").f(void 0, void 0).ser(se_ListDirectoryBucketsCommand).de(de_ListDirectoryBucketsCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/ListMultipartUploadsCommand.js
var import_dist439 = __toESM(require_dist());
var import_dist440 = __toESM(require_dist2());
var import_dist441 = __toESM(require_dist3());
var ListMultipartUploadsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" },
  Prefix: { type: "contextParams", name: "Prefix" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "ListMultipartUploads", {}).n("S3Client", "ListMultipartUploadsCommand").f(void 0, void 0).ser(se_ListMultipartUploadsCommand).de(de_ListMultipartUploadsCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/ListObjectsCommand.js
var import_dist442 = __toESM(require_dist());
var import_dist443 = __toESM(require_dist2());
var import_dist444 = __toESM(require_dist3());
var ListObjectsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" },
  Prefix: { type: "contextParams", name: "Prefix" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "ListObjects", {}).n("S3Client", "ListObjectsCommand").f(void 0, void 0).ser(se_ListObjectsCommand).de(de_ListObjectsCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/ListObjectsV2Command.js
var import_dist445 = __toESM(require_dist());
var import_dist446 = __toESM(require_dist2());
var import_dist447 = __toESM(require_dist3());
var ListObjectsV2Command = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" },
  Prefix: { type: "contextParams", name: "Prefix" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "ListObjectsV2", {}).n("S3Client", "ListObjectsV2Command").f(void 0, void 0).ser(se_ListObjectsV2Command).de(de_ListObjectsV2Command).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/ListObjectVersionsCommand.js
var import_dist448 = __toESM(require_dist());
var import_dist449 = __toESM(require_dist2());
var import_dist450 = __toESM(require_dist3());
var ListObjectVersionsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" },
  Prefix: { type: "contextParams", name: "Prefix" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "ListObjectVersions", {}).n("S3Client", "ListObjectVersionsCommand").f(void 0, void 0).ser(se_ListObjectVersionsCommand).de(de_ListObjectVersionsCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/ListPartsCommand.js
var import_dist451 = __toESM(require_dist());
var import_dist452 = __toESM(require_dist2());
var import_dist453 = __toESM(require_dist3());
var ListPartsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" },
  Key: { type: "contextParams", name: "Key" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config),
    getSsecPlugin(config)
  ];
}).s("AmazonS3", "ListParts", {}).n("S3Client", "ListPartsCommand").f(ListPartsRequestFilterSensitiveLog, void 0).ser(se_ListPartsCommand).de(de_ListPartsCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutBucketAccelerateConfigurationCommand.js
var import_dist454 = __toESM(require_dist());
var import_dist455 = __toESM(require_dist2());
var import_dist456 = __toESM(require_dist3());
var PutBucketAccelerateConfigurationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: false
    })
  ];
}).s("AmazonS3", "PutBucketAccelerateConfiguration", {}).n("S3Client", "PutBucketAccelerateConfigurationCommand").f(void 0, void 0).ser(se_PutBucketAccelerateConfigurationCommand).de(de_PutBucketAccelerateConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutBucketAclCommand.js
var import_dist457 = __toESM(require_dist());
var import_dist458 = __toESM(require_dist2());
var import_dist459 = __toESM(require_dist3());
var PutBucketAclCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: true
    })
  ];
}).s("AmazonS3", "PutBucketAcl", {}).n("S3Client", "PutBucketAclCommand").f(void 0, void 0).ser(se_PutBucketAclCommand).de(de_PutBucketAclCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutBucketAnalyticsConfigurationCommand.js
var import_dist460 = __toESM(require_dist());
var import_dist461 = __toESM(require_dist2());
var import_dist462 = __toESM(require_dist3());
var PutBucketAnalyticsConfigurationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AmazonS3", "PutBucketAnalyticsConfiguration", {}).n("S3Client", "PutBucketAnalyticsConfigurationCommand").f(void 0, void 0).ser(se_PutBucketAnalyticsConfigurationCommand).de(de_PutBucketAnalyticsConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutBucketCorsCommand.js
var import_dist463 = __toESM(require_dist());
var import_dist464 = __toESM(require_dist2());
var import_dist465 = __toESM(require_dist3());
var PutBucketCorsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: true
    })
  ];
}).s("AmazonS3", "PutBucketCors", {}).n("S3Client", "PutBucketCorsCommand").f(void 0, void 0).ser(se_PutBucketCorsCommand).de(de_PutBucketCorsCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutBucketEncryptionCommand.js
var import_dist466 = __toESM(require_dist());
var import_dist467 = __toESM(require_dist2());
var import_dist468 = __toESM(require_dist3());
var PutBucketEncryptionCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: true
    })
  ];
}).s("AmazonS3", "PutBucketEncryption", {}).n("S3Client", "PutBucketEncryptionCommand").f(PutBucketEncryptionRequestFilterSensitiveLog, void 0).ser(se_PutBucketEncryptionCommand).de(de_PutBucketEncryptionCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutBucketIntelligentTieringConfigurationCommand.js
var import_dist469 = __toESM(require_dist());
var import_dist470 = __toESM(require_dist2());
var import_dist471 = __toESM(require_dist3());
var PutBucketIntelligentTieringConfigurationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AmazonS3", "PutBucketIntelligentTieringConfiguration", {}).n("S3Client", "PutBucketIntelligentTieringConfigurationCommand").f(void 0, void 0).ser(se_PutBucketIntelligentTieringConfigurationCommand).de(de_PutBucketIntelligentTieringConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutBucketInventoryConfigurationCommand.js
var import_dist472 = __toESM(require_dist());
var import_dist473 = __toESM(require_dist2());
var import_dist474 = __toESM(require_dist3());
var PutBucketInventoryConfigurationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AmazonS3", "PutBucketInventoryConfiguration", {}).n("S3Client", "PutBucketInventoryConfigurationCommand").f(PutBucketInventoryConfigurationRequestFilterSensitiveLog, void 0).ser(se_PutBucketInventoryConfigurationCommand).de(de_PutBucketInventoryConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutBucketLifecycleConfigurationCommand.js
var import_dist475 = __toESM(require_dist());
var import_dist476 = __toESM(require_dist2());
var import_dist477 = __toESM(require_dist3());
var PutBucketLifecycleConfigurationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: true
    }),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "PutBucketLifecycleConfiguration", {}).n("S3Client", "PutBucketLifecycleConfigurationCommand").f(void 0, void 0).ser(se_PutBucketLifecycleConfigurationCommand).de(de_PutBucketLifecycleConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutBucketLoggingCommand.js
var import_dist478 = __toESM(require_dist());
var import_dist479 = __toESM(require_dist2());
var import_dist480 = __toESM(require_dist3());
var PutBucketLoggingCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: true
    })
  ];
}).s("AmazonS3", "PutBucketLogging", {}).n("S3Client", "PutBucketLoggingCommand").f(void 0, void 0).ser(se_PutBucketLoggingCommand).de(de_PutBucketLoggingCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutBucketMetricsConfigurationCommand.js
var import_dist481 = __toESM(require_dist());
var import_dist482 = __toESM(require_dist2());
var import_dist483 = __toESM(require_dist3());
var PutBucketMetricsConfigurationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AmazonS3", "PutBucketMetricsConfiguration", {}).n("S3Client", "PutBucketMetricsConfigurationCommand").f(void 0, void 0).ser(se_PutBucketMetricsConfigurationCommand).de(de_PutBucketMetricsConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutBucketNotificationConfigurationCommand.js
var import_dist484 = __toESM(require_dist());
var import_dist485 = __toESM(require_dist2());
var import_dist486 = __toESM(require_dist3());
var PutBucketNotificationConfigurationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AmazonS3", "PutBucketNotificationConfiguration", {}).n("S3Client", "PutBucketNotificationConfigurationCommand").f(void 0, void 0).ser(se_PutBucketNotificationConfigurationCommand).de(de_PutBucketNotificationConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutBucketOwnershipControlsCommand.js
var import_dist487 = __toESM(require_dist());
var import_dist488 = __toESM(require_dist2());
var import_dist489 = __toESM(require_dist3());
var PutBucketOwnershipControlsCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestChecksumRequired: true
    })
  ];
}).s("AmazonS3", "PutBucketOwnershipControls", {}).n("S3Client", "PutBucketOwnershipControlsCommand").f(void 0, void 0).ser(se_PutBucketOwnershipControlsCommand).de(de_PutBucketOwnershipControlsCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutBucketPolicyCommand.js
var import_dist490 = __toESM(require_dist());
var import_dist491 = __toESM(require_dist2());
var import_dist492 = __toESM(require_dist3());
var PutBucketPolicyCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: true
    })
  ];
}).s("AmazonS3", "PutBucketPolicy", {}).n("S3Client", "PutBucketPolicyCommand").f(void 0, void 0).ser(se_PutBucketPolicyCommand).de(de_PutBucketPolicyCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutBucketReplicationCommand.js
var import_dist493 = __toESM(require_dist());
var import_dist494 = __toESM(require_dist2());
var import_dist495 = __toESM(require_dist3());
var PutBucketReplicationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: true
    })
  ];
}).s("AmazonS3", "PutBucketReplication", {}).n("S3Client", "PutBucketReplicationCommand").f(void 0, void 0).ser(se_PutBucketReplicationCommand).de(de_PutBucketReplicationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutBucketRequestPaymentCommand.js
var import_dist496 = __toESM(require_dist());
var import_dist497 = __toESM(require_dist2());
var import_dist498 = __toESM(require_dist3());
var PutBucketRequestPaymentCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: true
    })
  ];
}).s("AmazonS3", "PutBucketRequestPayment", {}).n("S3Client", "PutBucketRequestPaymentCommand").f(void 0, void 0).ser(se_PutBucketRequestPaymentCommand).de(de_PutBucketRequestPaymentCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutBucketTaggingCommand.js
var import_dist499 = __toESM(require_dist());
var import_dist500 = __toESM(require_dist2());
var import_dist501 = __toESM(require_dist3());
var PutBucketTaggingCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: true
    })
  ];
}).s("AmazonS3", "PutBucketTagging", {}).n("S3Client", "PutBucketTaggingCommand").f(void 0, void 0).ser(se_PutBucketTaggingCommand).de(de_PutBucketTaggingCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutBucketVersioningCommand.js
var import_dist502 = __toESM(require_dist());
var import_dist503 = __toESM(require_dist2());
var import_dist504 = __toESM(require_dist3());
var PutBucketVersioningCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: true
    })
  ];
}).s("AmazonS3", "PutBucketVersioning", {}).n("S3Client", "PutBucketVersioningCommand").f(void 0, void 0).ser(se_PutBucketVersioningCommand).de(de_PutBucketVersioningCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutBucketWebsiteCommand.js
var import_dist505 = __toESM(require_dist());
var import_dist506 = __toESM(require_dist2());
var import_dist507 = __toESM(require_dist3());
var PutBucketWebsiteCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: true
    })
  ];
}).s("AmazonS3", "PutBucketWebsite", {}).n("S3Client", "PutBucketWebsiteCommand").f(void 0, void 0).ser(se_PutBucketWebsiteCommand).de(de_PutBucketWebsiteCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutObjectAclCommand.js
var import_dist508 = __toESM(require_dist());
var import_dist509 = __toESM(require_dist2());
var import_dist510 = __toESM(require_dist3());
var PutObjectAclCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" },
  Key: { type: "contextParams", name: "Key" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: true
    }),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "PutObjectAcl", {}).n("S3Client", "PutObjectAclCommand").f(void 0, void 0).ser(se_PutObjectAclCommand).de(de_PutObjectAclCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutObjectCommand.js
var import_dist511 = __toESM(require_dist());
var import_dist512 = __toESM(require_dist2());
var import_dist513 = __toESM(require_dist3());
var PutObjectCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" },
  Key: { type: "contextParams", name: "Key" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: false
    }),
    getCheckContentLengthHeaderPlugin(config),
    getThrow200ExceptionsPlugin(config),
    getSsecPlugin(config)
  ];
}).s("AmazonS3", "PutObject", {}).n("S3Client", "PutObjectCommand").f(PutObjectRequestFilterSensitiveLog, PutObjectOutputFilterSensitiveLog).ser(se_PutObjectCommand).de(de_PutObjectCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutObjectLegalHoldCommand.js
var import_dist514 = __toESM(require_dist());
var import_dist515 = __toESM(require_dist2());
var import_dist516 = __toESM(require_dist3());
var PutObjectLegalHoldCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: true
    }),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "PutObjectLegalHold", {}).n("S3Client", "PutObjectLegalHoldCommand").f(void 0, void 0).ser(se_PutObjectLegalHoldCommand).de(de_PutObjectLegalHoldCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutObjectLockConfigurationCommand.js
var import_dist517 = __toESM(require_dist());
var import_dist518 = __toESM(require_dist2());
var import_dist519 = __toESM(require_dist3());
var PutObjectLockConfigurationCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: true
    }),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "PutObjectLockConfiguration", {}).n("S3Client", "PutObjectLockConfigurationCommand").f(void 0, void 0).ser(se_PutObjectLockConfigurationCommand).de(de_PutObjectLockConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutObjectRetentionCommand.js
var import_dist520 = __toESM(require_dist());
var import_dist521 = __toESM(require_dist2());
var import_dist522 = __toESM(require_dist3());
var PutObjectRetentionCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: true
    }),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "PutObjectRetention", {}).n("S3Client", "PutObjectRetentionCommand").f(void 0, void 0).ser(se_PutObjectRetentionCommand).de(de_PutObjectRetentionCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutObjectTaggingCommand.js
var import_dist523 = __toESM(require_dist());
var import_dist524 = __toESM(require_dist2());
var import_dist525 = __toESM(require_dist3());
var PutObjectTaggingCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: true
    }),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "PutObjectTagging", {}).n("S3Client", "PutObjectTaggingCommand").f(void 0, void 0).ser(se_PutObjectTaggingCommand).de(de_PutObjectTaggingCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/PutPublicAccessBlockCommand.js
var import_dist526 = __toESM(require_dist());
var import_dist527 = __toESM(require_dist2());
var import_dist528 = __toESM(require_dist3());
var PutPublicAccessBlockCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseS3ExpressControlEndpoint: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: true
    })
  ];
}).s("AmazonS3", "PutPublicAccessBlock", {}).n("S3Client", "PutPublicAccessBlockCommand").f(void 0, void 0).ser(se_PutPublicAccessBlockCommand).de(de_PutPublicAccessBlockCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/RestoreObjectCommand.js
var import_dist529 = __toESM(require_dist());
var import_dist530 = __toESM(require_dist2());
var import_dist531 = __toESM(require_dist3());
var RestoreObjectCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: false
    }),
    getThrow200ExceptionsPlugin(config)
  ];
}).s("AmazonS3", "RestoreObject", {}).n("S3Client", "RestoreObjectCommand").f(RestoreObjectRequestFilterSensitiveLog, void 0).ser(se_RestoreObjectCommand).de(de_RestoreObjectCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/SelectObjectContentCommand.js
var import_dist532 = __toESM(require_dist());
var import_dist533 = __toESM(require_dist2());
var import_dist534 = __toESM(require_dist3());
var SelectObjectContentCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config),
    getSsecPlugin(config)
  ];
}).s("AmazonS3", "SelectObjectContent", {
  eventStream: {
    output: true
  }
}).n("S3Client", "SelectObjectContentCommand").f(SelectObjectContentRequestFilterSensitiveLog, SelectObjectContentOutputFilterSensitiveLog).ser(se_SelectObjectContentCommand).de(de_SelectObjectContentCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/UploadPartCommand.js
var import_dist535 = __toESM(require_dist());
var import_dist536 = __toESM(require_dist2());
var import_dist537 = __toESM(require_dist3());
var UploadPartCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  Bucket: { type: "contextParams", name: "Bucket" },
  Key: { type: "contextParams", name: "Key" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getFlexibleChecksumsPlugin(config, {
      requestAlgorithmMember: { httpHeader: "x-amz-sdk-checksum-algorithm", name: "ChecksumAlgorithm" },
      requestChecksumRequired: false
    }),
    getThrow200ExceptionsPlugin(config),
    getSsecPlugin(config)
  ];
}).s("AmazonS3", "UploadPart", {}).n("S3Client", "UploadPartCommand").f(UploadPartRequestFilterSensitiveLog, UploadPartOutputFilterSensitiveLog).ser(se_UploadPartCommand).de(de_UploadPartCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/UploadPartCopyCommand.js
var import_dist538 = __toESM(require_dist());
var import_dist539 = __toESM(require_dist2());
var import_dist540 = __toESM(require_dist3());
var UploadPartCopyCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  DisableS3ExpressSessionAuth: { type: "staticContextParams", value: true },
  Bucket: { type: "contextParams", name: "Bucket" }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions()),
    getThrow200ExceptionsPlugin(config),
    getSsecPlugin(config)
  ];
}).s("AmazonS3", "UploadPartCopy", {}).n("S3Client", "UploadPartCopyCommand").f(UploadPartCopyRequestFilterSensitiveLog, UploadPartCopyOutputFilterSensitiveLog).ser(se_UploadPartCopyCommand).de(de_UploadPartCopyCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/commands/WriteGetObjectResponseCommand.js
var import_dist541 = __toESM(require_dist());
var import_dist542 = __toESM(require_dist2());
var import_dist543 = __toESM(require_dist3());
var WriteGetObjectResponseCommand = class extends Command.classBuilder().ep({
  ...commonParams,
  UseObjectLambdaEndpoint: { type: "staticContextParams", value: true }
}).m(function(Command2, cs2, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AmazonS3", "WriteGetObjectResponse", {}).n("S3Client", "WriteGetObjectResponseCommand").f(WriteGetObjectResponseRequestFilterSensitiveLog, void 0).ser(se_WriteGetObjectResponseCommand).de(de_WriteGetObjectResponseCommand).build() {
};

// node_modules/@aws-sdk/client-s3/dist-es/S3.js
var commands = {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CopyObjectCommand,
  CreateBucketCommand,
  CreateBucketMetadataTableConfigurationCommand,
  CreateMultipartUploadCommand,
  CreateSessionCommand,
  DeleteBucketCommand,
  DeleteBucketAnalyticsConfigurationCommand,
  DeleteBucketCorsCommand,
  DeleteBucketEncryptionCommand,
  DeleteBucketIntelligentTieringConfigurationCommand,
  DeleteBucketInventoryConfigurationCommand,
  DeleteBucketLifecycleCommand,
  DeleteBucketMetadataTableConfigurationCommand,
  DeleteBucketMetricsConfigurationCommand,
  DeleteBucketOwnershipControlsCommand,
  DeleteBucketPolicyCommand,
  DeleteBucketReplicationCommand,
  DeleteBucketTaggingCommand,
  DeleteBucketWebsiteCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  DeleteObjectTaggingCommand,
  DeletePublicAccessBlockCommand,
  GetBucketAccelerateConfigurationCommand,
  GetBucketAclCommand,
  GetBucketAnalyticsConfigurationCommand,
  GetBucketCorsCommand,
  GetBucketEncryptionCommand,
  GetBucketIntelligentTieringConfigurationCommand,
  GetBucketInventoryConfigurationCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketLocationCommand,
  GetBucketLoggingCommand,
  GetBucketMetadataTableConfigurationCommand,
  GetBucketMetricsConfigurationCommand,
  GetBucketNotificationConfigurationCommand,
  GetBucketOwnershipControlsCommand,
  GetBucketPolicyCommand,
  GetBucketPolicyStatusCommand,
  GetBucketReplicationCommand,
  GetBucketRequestPaymentCommand,
  GetBucketTaggingCommand,
  GetBucketVersioningCommand,
  GetBucketWebsiteCommand,
  GetObjectCommand,
  GetObjectAclCommand,
  GetObjectAttributesCommand,
  GetObjectLegalHoldCommand,
  GetObjectLockConfigurationCommand,
  GetObjectRetentionCommand,
  GetObjectTaggingCommand,
  GetObjectTorrentCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListBucketAnalyticsConfigurationsCommand,
  ListBucketIntelligentTieringConfigurationsCommand,
  ListBucketInventoryConfigurationsCommand,
  ListBucketMetricsConfigurationsCommand,
  ListBucketsCommand,
  ListDirectoryBucketsCommand,
  ListMultipartUploadsCommand,
  ListObjectsCommand,
  ListObjectsV2Command,
  ListObjectVersionsCommand,
  ListPartsCommand,
  PutBucketAccelerateConfigurationCommand,
  PutBucketAclCommand,
  PutBucketAnalyticsConfigurationCommand,
  PutBucketCorsCommand,
  PutBucketEncryptionCommand,
  PutBucketIntelligentTieringConfigurationCommand,
  PutBucketInventoryConfigurationCommand,
  PutBucketLifecycleConfigurationCommand,
  PutBucketLoggingCommand,
  PutBucketMetricsConfigurationCommand,
  PutBucketNotificationConfigurationCommand,
  PutBucketOwnershipControlsCommand,
  PutBucketPolicyCommand,
  PutBucketReplicationCommand,
  PutBucketRequestPaymentCommand,
  PutBucketTaggingCommand,
  PutBucketVersioningCommand,
  PutBucketWebsiteCommand,
  PutObjectCommand,
  PutObjectAclCommand,
  PutObjectLegalHoldCommand,
  PutObjectLockConfigurationCommand,
  PutObjectRetentionCommand,
  PutObjectTaggingCommand,
  PutPublicAccessBlockCommand,
  RestoreObjectCommand,
  SelectObjectContentCommand,
  UploadPartCommand,
  UploadPartCopyCommand,
  WriteGetObjectResponseCommand
};
var S3 = class extends S3Client {
};
createAggregatedClient(commands, S3);

// node_modules/@aws-sdk/client-s3/dist-es/commands/index.js
var import_dist547 = __toESM(require_dist());
var import_dist548 = __toESM(require_dist2());
var import_dist549 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-s3/dist-es/pagination/index.js
var import_dist565 = __toESM(require_dist());
var import_dist566 = __toESM(require_dist2());
var import_dist567 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-s3/dist-es/pagination/Interfaces.js
var import_dist550 = __toESM(require_dist());
var import_dist551 = __toESM(require_dist2());
var import_dist552 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-s3/dist-es/pagination/ListBucketsPaginator.js
var import_dist553 = __toESM(require_dist());
var import_dist554 = __toESM(require_dist2());
var import_dist555 = __toESM(require_dist3());
var paginateListBuckets = createPaginator(S3Client, ListBucketsCommand, "ContinuationToken", "ContinuationToken", "MaxBuckets");

// node_modules/@aws-sdk/client-s3/dist-es/pagination/ListDirectoryBucketsPaginator.js
var import_dist556 = __toESM(require_dist());
var import_dist557 = __toESM(require_dist2());
var import_dist558 = __toESM(require_dist3());
var paginateListDirectoryBuckets = createPaginator(S3Client, ListDirectoryBucketsCommand, "ContinuationToken", "ContinuationToken", "MaxDirectoryBuckets");

// node_modules/@aws-sdk/client-s3/dist-es/pagination/ListObjectsV2Paginator.js
var import_dist559 = __toESM(require_dist());
var import_dist560 = __toESM(require_dist2());
var import_dist561 = __toESM(require_dist3());
var paginateListObjectsV2 = createPaginator(S3Client, ListObjectsV2Command, "ContinuationToken", "NextContinuationToken", "MaxKeys");

// node_modules/@aws-sdk/client-s3/dist-es/pagination/ListPartsPaginator.js
var import_dist562 = __toESM(require_dist());
var import_dist563 = __toESM(require_dist2());
var import_dist564 = __toESM(require_dist3());
var paginateListParts = createPaginator(S3Client, ListPartsCommand, "PartNumberMarker", "NextPartNumberMarker", "MaxParts");

// node_modules/@aws-sdk/client-s3/dist-es/waiters/index.js
var import_dist580 = __toESM(require_dist());
var import_dist581 = __toESM(require_dist2());
var import_dist582 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-s3/dist-es/waiters/waitForBucketExists.js
var import_dist568 = __toESM(require_dist());
var import_dist569 = __toESM(require_dist2());
var import_dist570 = __toESM(require_dist3());
var checkState = async (client, input) => {
  let reason;
  try {
    const result = await client.send(new HeadBucketCommand(input));
    reason = result;
    return { state: WaiterState.SUCCESS, reason };
  } catch (exception) {
    reason = exception;
    if (exception.name && exception.name == "NotFound") {
      return { state: WaiterState.RETRY, reason };
    }
  }
  return { state: WaiterState.RETRY, reason };
};
var waitForBucketExists = async (params, input) => {
  const serviceDefaults = { minDelay: 5, maxDelay: 120 };
  return createWaiter({ ...serviceDefaults, ...params }, input, checkState);
};
var waitUntilBucketExists = async (params, input) => {
  const serviceDefaults = { minDelay: 5, maxDelay: 120 };
  const result = await createWaiter({ ...serviceDefaults, ...params }, input, checkState);
  return checkExceptions(result);
};

// node_modules/@aws-sdk/client-s3/dist-es/waiters/waitForBucketNotExists.js
var import_dist571 = __toESM(require_dist());
var import_dist572 = __toESM(require_dist2());
var import_dist573 = __toESM(require_dist3());
var checkState2 = async (client, input) => {
  let reason;
  try {
    const result = await client.send(new HeadBucketCommand(input));
    reason = result;
  } catch (exception) {
    reason = exception;
    if (exception.name && exception.name == "NotFound") {
      return { state: WaiterState.SUCCESS, reason };
    }
  }
  return { state: WaiterState.RETRY, reason };
};
var waitForBucketNotExists = async (params, input) => {
  const serviceDefaults = { minDelay: 5, maxDelay: 120 };
  return createWaiter({ ...serviceDefaults, ...params }, input, checkState2);
};
var waitUntilBucketNotExists = async (params, input) => {
  const serviceDefaults = { minDelay: 5, maxDelay: 120 };
  const result = await createWaiter({ ...serviceDefaults, ...params }, input, checkState2);
  return checkExceptions(result);
};

// node_modules/@aws-sdk/client-s3/dist-es/waiters/waitForObjectExists.js
var import_dist574 = __toESM(require_dist());
var import_dist575 = __toESM(require_dist2());
var import_dist576 = __toESM(require_dist3());
var checkState3 = async (client, input) => {
  let reason;
  try {
    const result = await client.send(new HeadObjectCommand(input));
    reason = result;
    return { state: WaiterState.SUCCESS, reason };
  } catch (exception) {
    reason = exception;
    if (exception.name && exception.name == "NotFound") {
      return { state: WaiterState.RETRY, reason };
    }
  }
  return { state: WaiterState.RETRY, reason };
};
var waitForObjectExists = async (params, input) => {
  const serviceDefaults = { minDelay: 5, maxDelay: 120 };
  return createWaiter({ ...serviceDefaults, ...params }, input, checkState3);
};
var waitUntilObjectExists = async (params, input) => {
  const serviceDefaults = { minDelay: 5, maxDelay: 120 };
  const result = await createWaiter({ ...serviceDefaults, ...params }, input, checkState3);
  return checkExceptions(result);
};

// node_modules/@aws-sdk/client-s3/dist-es/waiters/waitForObjectNotExists.js
var import_dist577 = __toESM(require_dist());
var import_dist578 = __toESM(require_dist2());
var import_dist579 = __toESM(require_dist3());
var checkState4 = async (client, input) => {
  let reason;
  try {
    const result = await client.send(new HeadObjectCommand(input));
    reason = result;
  } catch (exception) {
    reason = exception;
    if (exception.name && exception.name == "NotFound") {
      return { state: WaiterState.SUCCESS, reason };
    }
  }
  return { state: WaiterState.RETRY, reason };
};
var waitForObjectNotExists = async (params, input) => {
  const serviceDefaults = { minDelay: 5, maxDelay: 120 };
  return createWaiter({ ...serviceDefaults, ...params }, input, checkState4);
};
var waitUntilObjectNotExists = async (params, input) => {
  const serviceDefaults = { minDelay: 5, maxDelay: 120 };
  const result = await createWaiter({ ...serviceDefaults, ...params }, input, checkState4);
  return checkExceptions(result);
};

// node_modules/@aws-sdk/client-s3/dist-es/models/index.js
var import_dist583 = __toESM(require_dist());
var import_dist584 = __toESM(require_dist2());
var import_dist585 = __toESM(require_dist3());
export {
  Command as $Command,
  AbortMultipartUploadCommand,
  AnalyticsFilter,
  AnalyticsS3ExportFileFormat,
  ArchiveStatus,
  BucketAccelerateStatus,
  BucketAlreadyExists,
  BucketAlreadyOwnedByYou,
  BucketCannedACL,
  BucketLocationConstraint,
  BucketLogsPermission,
  BucketType,
  BucketVersioningStatus,
  ChecksumAlgorithm2 as ChecksumAlgorithm,
  ChecksumMode,
  ChecksumType,
  CompleteMultipartUploadCommand,
  CompleteMultipartUploadOutputFilterSensitiveLog,
  CompleteMultipartUploadRequestFilterSensitiveLog,
  CompressionType,
  CopyObjectCommand,
  CopyObjectOutputFilterSensitiveLog,
  CopyObjectRequestFilterSensitiveLog,
  CreateBucketCommand,
  CreateBucketMetadataTableConfigurationCommand,
  CreateMultipartUploadCommand,
  CreateMultipartUploadOutputFilterSensitiveLog,
  CreateMultipartUploadRequestFilterSensitiveLog,
  CreateSessionCommand,
  CreateSessionOutputFilterSensitiveLog,
  CreateSessionRequestFilterSensitiveLog,
  DataRedundancy,
  DeleteBucketAnalyticsConfigurationCommand,
  DeleteBucketCommand,
  DeleteBucketCorsCommand,
  DeleteBucketEncryptionCommand,
  DeleteBucketIntelligentTieringConfigurationCommand,
  DeleteBucketInventoryConfigurationCommand,
  DeleteBucketLifecycleCommand,
  DeleteBucketMetadataTableConfigurationCommand,
  DeleteBucketMetricsConfigurationCommand,
  DeleteBucketOwnershipControlsCommand,
  DeleteBucketPolicyCommand,
  DeleteBucketReplicationCommand,
  DeleteBucketTaggingCommand,
  DeleteBucketWebsiteCommand,
  DeleteMarkerReplicationStatus,
  DeleteObjectCommand,
  DeleteObjectTaggingCommand,
  DeleteObjectsCommand,
  DeletePublicAccessBlockCommand,
  EncodingType,
  EncryptionFilterSensitiveLog,
  EncryptionTypeMismatch,
  Event,
  ExistingObjectReplicationStatus,
  ExpirationStatus,
  ExpressionType,
  FileHeaderInfo,
  FilterRuleName,
  GetBucketAccelerateConfigurationCommand,
  GetBucketAclCommand,
  GetBucketAnalyticsConfigurationCommand,
  GetBucketCorsCommand,
  GetBucketEncryptionCommand,
  GetBucketEncryptionOutputFilterSensitiveLog,
  GetBucketIntelligentTieringConfigurationCommand,
  GetBucketInventoryConfigurationCommand,
  GetBucketInventoryConfigurationOutputFilterSensitiveLog,
  GetBucketLifecycleConfigurationCommand,
  GetBucketLocationCommand,
  GetBucketLoggingCommand,
  GetBucketMetadataTableConfigurationCommand,
  GetBucketMetricsConfigurationCommand,
  GetBucketNotificationConfigurationCommand,
  GetBucketOwnershipControlsCommand,
  GetBucketPolicyCommand,
  GetBucketPolicyStatusCommand,
  GetBucketReplicationCommand,
  GetBucketRequestPaymentCommand,
  GetBucketTaggingCommand,
  GetBucketVersioningCommand,
  GetBucketWebsiteCommand,
  GetObjectAclCommand,
  GetObjectAttributesCommand,
  GetObjectAttributesRequestFilterSensitiveLog,
  GetObjectCommand,
  GetObjectLegalHoldCommand,
  GetObjectLockConfigurationCommand,
  GetObjectOutputFilterSensitiveLog,
  GetObjectRequestFilterSensitiveLog,
  GetObjectRetentionCommand,
  GetObjectTaggingCommand,
  GetObjectTorrentCommand,
  GetObjectTorrentOutputFilterSensitiveLog,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  HeadObjectOutputFilterSensitiveLog,
  HeadObjectRequestFilterSensitiveLog,
  IntelligentTieringAccessTier,
  IntelligentTieringStatus,
  InvalidObjectState,
  InvalidRequest,
  InvalidWriteOffset,
  InventoryConfigurationFilterSensitiveLog,
  InventoryDestinationFilterSensitiveLog,
  InventoryEncryptionFilterSensitiveLog,
  InventoryFormat,
  InventoryFrequency,
  InventoryIncludedObjectVersions,
  InventoryOptionalField,
  InventoryS3BucketDestinationFilterSensitiveLog,
  JSONType,
  ListBucketAnalyticsConfigurationsCommand,
  ListBucketIntelligentTieringConfigurationsCommand,
  ListBucketInventoryConfigurationsCommand,
  ListBucketInventoryConfigurationsOutputFilterSensitiveLog,
  ListBucketMetricsConfigurationsCommand,
  ListBucketsCommand,
  ListDirectoryBucketsCommand,
  ListMultipartUploadsCommand,
  ListObjectVersionsCommand,
  ListObjectsCommand,
  ListObjectsV2Command,
  ListPartsCommand,
  ListPartsRequestFilterSensitiveLog,
  LocationType,
  MFADelete,
  MFADeleteStatus,
  MetadataDirective,
  MetricsFilter,
  MetricsStatus,
  NoSuchBucket,
  NoSuchKey,
  NoSuchUpload,
  NotFound,
  ObjectAlreadyInActiveTierError,
  ObjectAttributes,
  ObjectCannedACL,
  ObjectLockEnabled,
  ObjectLockLegalHoldStatus,
  ObjectLockMode,
  ObjectLockRetentionMode,
  ObjectNotInActiveTierError,
  ObjectOwnership,
  ObjectStorageClass,
  ObjectVersionStorageClass,
  OptionalObjectAttributes,
  OutputLocationFilterSensitiveLog,
  OwnerOverride,
  PartitionDateSource,
  Payer,
  Permission,
  Protocol,
  PutBucketAccelerateConfigurationCommand,
  PutBucketAclCommand,
  PutBucketAnalyticsConfigurationCommand,
  PutBucketCorsCommand,
  PutBucketEncryptionCommand,
  PutBucketEncryptionRequestFilterSensitiveLog,
  PutBucketIntelligentTieringConfigurationCommand,
  PutBucketInventoryConfigurationCommand,
  PutBucketInventoryConfigurationRequestFilterSensitiveLog,
  PutBucketLifecycleConfigurationCommand,
  PutBucketLoggingCommand,
  PutBucketMetricsConfigurationCommand,
  PutBucketNotificationConfigurationCommand,
  PutBucketOwnershipControlsCommand,
  PutBucketPolicyCommand,
  PutBucketReplicationCommand,
  PutBucketRequestPaymentCommand,
  PutBucketTaggingCommand,
  PutBucketVersioningCommand,
  PutBucketWebsiteCommand,
  PutObjectAclCommand,
  PutObjectCommand,
  PutObjectLegalHoldCommand,
  PutObjectLockConfigurationCommand,
  PutObjectOutputFilterSensitiveLog,
  PutObjectRequestFilterSensitiveLog,
  PutObjectRetentionCommand,
  PutObjectTaggingCommand,
  PutPublicAccessBlockCommand,
  QuoteFields,
  ReplicaModificationsStatus,
  ReplicationRuleStatus,
  ReplicationStatus,
  ReplicationTimeStatus,
  RequestCharged,
  RequestPayer,
  RestoreObjectCommand,
  RestoreObjectRequestFilterSensitiveLog,
  RestoreRequestFilterSensitiveLog,
  RestoreRequestType,
  S3,
  S3Client,
  S3LocationFilterSensitiveLog,
  S3ServiceException,
  SSEKMSFilterSensitiveLog,
  SelectObjectContentCommand,
  SelectObjectContentEventStream,
  SelectObjectContentEventStreamFilterSensitiveLog,
  SelectObjectContentOutputFilterSensitiveLog,
  SelectObjectContentRequestFilterSensitiveLog,
  ServerSideEncryption,
  ServerSideEncryptionByDefaultFilterSensitiveLog,
  ServerSideEncryptionConfigurationFilterSensitiveLog,
  ServerSideEncryptionRuleFilterSensitiveLog,
  SessionCredentialsFilterSensitiveLog,
  SessionMode,
  SseKmsEncryptedObjectsStatus,
  StorageClass,
  StorageClassAnalysisSchemaVersion,
  TaggingDirective,
  Tier,
  TooManyParts,
  TransitionDefaultMinimumObjectSize,
  TransitionStorageClass,
  Type,
  UploadPartCommand,
  UploadPartCopyCommand,
  UploadPartCopyOutputFilterSensitiveLog,
  UploadPartCopyRequestFilterSensitiveLog,
  UploadPartOutputFilterSensitiveLog,
  UploadPartRequestFilterSensitiveLog,
  WriteGetObjectResponseCommand,
  WriteGetObjectResponseRequestFilterSensitiveLog,
  Client as __Client,
  paginateListBuckets,
  paginateListDirectoryBuckets,
  paginateListObjectsV2,
  paginateListParts,
  waitForBucketExists,
  waitForBucketNotExists,
  waitForObjectExists,
  waitForObjectNotExists,
  waitUntilBucketExists,
  waitUntilBucketNotExists,
  waitUntilObjectExists,
  waitUntilObjectNotExists
};
//# sourceMappingURL=@aws-sdk_client-s3.js.map
