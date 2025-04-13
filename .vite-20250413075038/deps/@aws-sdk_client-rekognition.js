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
} from "./chunk-V333OXM4.js";
import {
  v4_default
} from "./chunk-3TAN77E7.js";
import "./chunk-W2ANHD2T.js";
import {
  AwsSdkSigV4Signer,
  Client,
  Command,
  DefaultIdentityProviderConfig,
  FetchHttpHandler,
  HttpRequest,
  LazyJsonString,
  NoOpLogger,
  SENSITIVE_STRING,
  ServiceException,
  _json,
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
  limitedParseFloat32,
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
} from "./chunk-WLALPDKA.js";
import {
  __publicField,
  __toESM,
  require_dist,
  require_dist2,
  require_dist3
} from "./chunk-GJFZQ5ET.js";

// node_modules/@aws-sdk/client-rekognition/dist-es/index.js
var import_dist343 = __toESM(require_dist());
var import_dist344 = __toESM(require_dist2());
var import_dist345 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-rekognition/dist-es/RekognitionClient.js
var import_dist25 = __toESM(require_dist());
var import_dist26 = __toESM(require_dist2());
var import_dist27 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-rekognition/dist-es/auth/httpAuthSchemeProvider.js
var import_dist = __toESM(require_dist());
var import_dist2 = __toESM(require_dist2());
var import_dist3 = __toESM(require_dist3());
var defaultRekognitionHttpAuthSchemeParametersProvider = async (config, context, input) => {
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
      name: "rekognition",
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
var defaultRekognitionHttpAuthSchemeProvider = (authParameters) => {
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

// node_modules/@aws-sdk/client-rekognition/dist-es/endpoint/EndpointParameters.js
var import_dist4 = __toESM(require_dist());
var import_dist5 = __toESM(require_dist2());
var import_dist6 = __toESM(require_dist3());
var resolveClientEndpointParameters = (options) => {
  return Object.assign(options, {
    useDualstackEndpoint: options.useDualstackEndpoint ?? false,
    useFipsEndpoint: options.useFipsEndpoint ?? false,
    defaultSigningName: "rekognition"
  });
};
var commonParams = {
  UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
  Endpoint: { type: "builtInParams", name: "endpoint" },
  Region: { type: "builtInParams", name: "region" },
  UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" }
};

// node_modules/@aws-sdk/client-rekognition/dist-es/runtimeConfig.browser.js
var import_dist16 = __toESM(require_dist());
var import_dist17 = __toESM(require_dist2());
var import_dist18 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-rekognition/package.json
var package_default = {
  name: "@aws-sdk/client-rekognition",
  description: "AWS SDK for JavaScript Rekognition Client for Node.js, Browser and React Native",
  version: "3.782.0",
  scripts: {
    build: "concurrently 'yarn:build:cjs' 'yarn:build:es' 'yarn:build:types'",
    "build:cjs": "node ../../scripts/compilation/inline client-rekognition",
    "build:es": "tsc -p tsconfig.es.json",
    "build:include:deps": "lerna run --scope $npm_package_name --include-dependencies build",
    "build:types": "tsc -p tsconfig.types.json",
    "build:types:downlevel": "downlevel-dts dist-types dist-types/ts3.4",
    clean: "rimraf ./dist-* && rimraf *.tsbuildinfo",
    "extract:docs": "api-extractor run --local",
    "generate:client": "node ../../scripts/generate-clients/single-service --solo rekognition"
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
  homepage: "https://github.com/aws/aws-sdk-js-v3/tree/main/clients/client-rekognition",
  repository: {
    type: "git",
    url: "https://github.com/aws/aws-sdk-js-v3.git",
    directory: "clients/client-rekognition"
  }
};

// node_modules/@aws-sdk/client-rekognition/dist-es/runtimeConfig.shared.js
var import_dist13 = __toESM(require_dist());
var import_dist14 = __toESM(require_dist2());
var import_dist15 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-rekognition/dist-es/endpoint/endpointResolver.js
var import_dist10 = __toESM(require_dist());
var import_dist11 = __toESM(require_dist2());
var import_dist12 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-rekognition/dist-es/endpoint/ruleset.js
var import_dist7 = __toESM(require_dist());
var import_dist8 = __toESM(require_dist2());
var import_dist9 = __toESM(require_dist3());
var s = "required";
var t = "fn";
var u = "argv";
var v = "ref";
var a = true;
var b = "isSet";
var c = "booleanEquals";
var d = "error";
var e = "endpoint";
var f = "tree";
var g = "PartitionResult";
var h = { [s]: false, "type": "String" };
var i = { [s]: true, "default": false, "type": "Boolean" };
var j = { [v]: "Endpoint" };
var k = { [t]: c, [u]: [{ [v]: "UseFIPS" }, true] };
var l = { [t]: c, [u]: [{ [v]: "UseDualStack" }, true] };
var m = {};
var n = { [t]: "getAttr", [u]: [{ [v]: g }, "supportsFIPS"] };
var o = { [t]: c, [u]: [true, { [t]: "getAttr", [u]: [{ [v]: g }, "supportsDualStack"] }] };
var p = [k];
var q = [l];
var r = [{ [v]: "Region" }];
var _data = { version: "1.0", parameters: { Region: h, UseDualStack: i, UseFIPS: i, Endpoint: h }, rules: [{ conditions: [{ [t]: b, [u]: [j] }], rules: [{ conditions: p, error: "Invalid Configuration: FIPS and custom endpoint are not supported", type: d }, { conditions: q, error: "Invalid Configuration: Dualstack and custom endpoint are not supported", type: d }, { endpoint: { url: j, properties: m, headers: m }, type: e }], type: f }, { conditions: [{ [t]: b, [u]: r }], rules: [{ conditions: [{ [t]: "aws.partition", [u]: r, assign: g }], rules: [{ conditions: [k, l], rules: [{ conditions: [{ [t]: c, [u]: [a, n] }, o], rules: [{ endpoint: { url: "https://rekognition-fips.{Region}.{PartitionResult#dualStackDnsSuffix}", properties: m, headers: m }, type: e }], type: f }, { error: "FIPS and DualStack are enabled, but this partition does not support one or both", type: d }], type: f }, { conditions: p, rules: [{ conditions: [{ [t]: c, [u]: [n, a] }], rules: [{ endpoint: { url: "https://rekognition-fips.{Region}.{PartitionResult#dnsSuffix}", properties: m, headers: m }, type: e }], type: f }, { error: "FIPS is enabled but this partition does not support FIPS", type: d }], type: f }, { conditions: q, rules: [{ conditions: [o], rules: [{ endpoint: { url: "https://rekognition.{Region}.{PartitionResult#dualStackDnsSuffix}", properties: m, headers: m }, type: e }], type: f }, { error: "DualStack is enabled but this partition does not support DualStack", type: d }], type: f }, { endpoint: { url: "https://rekognition.{Region}.{PartitionResult#dnsSuffix}", properties: m, headers: m }, type: e }], type: f }], type: f }, { error: "Invalid Configuration: Missing Region", type: d }] };
var ruleSet = _data;

// node_modules/@aws-sdk/client-rekognition/dist-es/endpoint/endpointResolver.js
var cache = new EndpointCache({
  size: 50,
  params: ["Endpoint", "Region", "UseDualStack", "UseFIPS"]
});
var defaultEndpointResolver = (endpointParams, context = {}) => {
  return cache.get(endpointParams, () => resolveEndpoint(ruleSet, {
    endpointParams,
    logger: context.logger
  }));
};
customEndpointFunctions.aws = awsEndpointFunctions;

// node_modules/@aws-sdk/client-rekognition/dist-es/runtimeConfig.shared.js
var getRuntimeConfig = (config) => {
  return {
    apiVersion: "2016-06-27",
    base64Decoder: (config == null ? void 0 : config.base64Decoder) ?? fromBase64,
    base64Encoder: (config == null ? void 0 : config.base64Encoder) ?? toBase64,
    disableHostPrefix: (config == null ? void 0 : config.disableHostPrefix) ?? false,
    endpointProvider: (config == null ? void 0 : config.endpointProvider) ?? defaultEndpointResolver,
    extensions: (config == null ? void 0 : config.extensions) ?? [],
    httpAuthSchemeProvider: (config == null ? void 0 : config.httpAuthSchemeProvider) ?? defaultRekognitionHttpAuthSchemeProvider,
    httpAuthSchemes: (config == null ? void 0 : config.httpAuthSchemes) ?? [
      {
        schemeId: "aws.auth#sigv4",
        identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4"),
        signer: new AwsSdkSigV4Signer()
      }
    ],
    logger: (config == null ? void 0 : config.logger) ?? new NoOpLogger(),
    serviceId: (config == null ? void 0 : config.serviceId) ?? "Rekognition",
    urlParser: (config == null ? void 0 : config.urlParser) ?? parseUrl,
    utf8Decoder: (config == null ? void 0 : config.utf8Decoder) ?? fromUtf8,
    utf8Encoder: (config == null ? void 0 : config.utf8Encoder) ?? toUtf8
  };
};

// node_modules/@aws-sdk/client-rekognition/dist-es/runtimeConfig.browser.js
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

// node_modules/@aws-sdk/client-rekognition/dist-es/runtimeExtensions.js
var import_dist22 = __toESM(require_dist());
var import_dist23 = __toESM(require_dist2());
var import_dist24 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-rekognition/dist-es/auth/httpAuthExtensionConfiguration.js
var import_dist19 = __toESM(require_dist());
var import_dist20 = __toESM(require_dist2());
var import_dist21 = __toESM(require_dist3());
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

// node_modules/@aws-sdk/client-rekognition/dist-es/runtimeExtensions.js
var resolveRuntimeExtensions = (runtimeConfig, extensions) => {
  const extensionConfiguration = Object.assign(getAwsRegionExtensionConfiguration(runtimeConfig), getDefaultExtensionConfiguration(runtimeConfig), getHttpHandlerExtensionConfiguration(runtimeConfig), getHttpAuthExtensionConfiguration(runtimeConfig));
  extensions.forEach((extension) => extension.configure(extensionConfiguration));
  return Object.assign(runtimeConfig, resolveAwsRegionExtensionConfiguration(extensionConfiguration), resolveDefaultRuntimeConfig(extensionConfiguration), resolveHttpHandlerRuntimeConfig(extensionConfiguration), resolveHttpAuthRuntimeConfig(extensionConfiguration));
};

// node_modules/@aws-sdk/client-rekognition/dist-es/RekognitionClient.js
var RekognitionClient = class extends Client {
  constructor(...[configuration]) {
    const _config_0 = getRuntimeConfig2(configuration || {});
    super(_config_0);
    __publicField(this, "config");
    this.initConfig = _config_0;
    const _config_1 = resolveClientEndpointParameters(_config_0);
    const _config_2 = resolveUserAgentConfig(_config_1);
    const _config_3 = resolveRetryConfig(_config_2);
    const _config_4 = resolveRegionConfig(_config_3);
    const _config_5 = resolveHostHeaderConfig(_config_4);
    const _config_6 = resolveEndpointConfig(_config_5);
    const _config_7 = resolveHttpAuthSchemeConfig(_config_6);
    const _config_8 = resolveRuntimeExtensions(_config_7, (configuration == null ? void 0 : configuration.extensions) || []);
    this.config = _config_8;
    this.middlewareStack.use(getUserAgentPlugin(this.config));
    this.middlewareStack.use(getRetryPlugin(this.config));
    this.middlewareStack.use(getContentLengthPlugin(this.config));
    this.middlewareStack.use(getHostHeaderPlugin(this.config));
    this.middlewareStack.use(getLoggerPlugin(this.config));
    this.middlewareStack.use(getRecursionDetectionPlugin(this.config));
    this.middlewareStack.use(getHttpAuthSchemeEndpointRuleSetPlugin(this.config, {
      httpAuthSchemeParametersProvider: defaultRekognitionHttpAuthSchemeParametersProvider,
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

// node_modules/@aws-sdk/client-rekognition/dist-es/Rekognition.js
var import_dist265 = __toESM(require_dist());
var import_dist266 = __toESM(require_dist2());
var import_dist267 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/AssociateFacesCommand.js
var import_dist40 = __toESM(require_dist());
var import_dist41 = __toESM(require_dist2());
var import_dist42 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-rekognition/dist-es/protocols/Aws_json1_1.js
var import_dist37 = __toESM(require_dist());
var import_dist38 = __toESM(require_dist2());
var import_dist39 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-rekognition/dist-es/models/models_0.js
var import_dist31 = __toESM(require_dist());
var import_dist32 = __toESM(require_dist2());
var import_dist33 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-rekognition/dist-es/models/RekognitionServiceException.js
var import_dist28 = __toESM(require_dist());
var import_dist29 = __toESM(require_dist2());
var import_dist30 = __toESM(require_dist3());
var RekognitionServiceException = class _RekognitionServiceException extends ServiceException {
  constructor(options) {
    super(options);
    Object.setPrototypeOf(this, _RekognitionServiceException.prototype);
  }
};

// node_modules/@aws-sdk/client-rekognition/dist-es/models/models_0.js
var AccessDeniedException = class _AccessDeniedException extends RekognitionServiceException {
  constructor(opts) {
    super({
      name: "AccessDeniedException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "AccessDeniedException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    __publicField(this, "Code");
    __publicField(this, "Logref");
    Object.setPrototypeOf(this, _AccessDeniedException.prototype);
    this.Message = opts.Message;
    this.Code = opts.Code;
    this.Logref = opts.Logref;
  }
};
var UnsuccessfulFaceAssociationReason = {
  ASSOCIATED_TO_A_DIFFERENT_USER: "ASSOCIATED_TO_A_DIFFERENT_USER",
  FACE_NOT_FOUND: "FACE_NOT_FOUND",
  LOW_MATCH_CONFIDENCE: "LOW_MATCH_CONFIDENCE"
};
var UserStatus = {
  ACTIVE: "ACTIVE",
  CREATED: "CREATED",
  CREATING: "CREATING",
  UPDATING: "UPDATING"
};
var ConflictException = class _ConflictException extends RekognitionServiceException {
  constructor(opts) {
    super({
      name: "ConflictException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ConflictException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    __publicField(this, "Code");
    __publicField(this, "Logref");
    Object.setPrototypeOf(this, _ConflictException.prototype);
    this.Message = opts.Message;
    this.Code = opts.Code;
    this.Logref = opts.Logref;
  }
};
var IdempotentParameterMismatchException = class _IdempotentParameterMismatchException extends RekognitionServiceException {
  constructor(opts) {
    super({
      name: "IdempotentParameterMismatchException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "IdempotentParameterMismatchException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    __publicField(this, "Code");
    __publicField(this, "Logref");
    Object.setPrototypeOf(this, _IdempotentParameterMismatchException.prototype);
    this.Message = opts.Message;
    this.Code = opts.Code;
    this.Logref = opts.Logref;
  }
};
var InternalServerError = class _InternalServerError extends RekognitionServiceException {
  constructor(opts) {
    super({
      name: "InternalServerError",
      $fault: "server",
      ...opts
    });
    __publicField(this, "name", "InternalServerError");
    __publicField(this, "$fault", "server");
    __publicField(this, "Message");
    __publicField(this, "Code");
    __publicField(this, "Logref");
    Object.setPrototypeOf(this, _InternalServerError.prototype);
    this.Message = opts.Message;
    this.Code = opts.Code;
    this.Logref = opts.Logref;
  }
};
var InvalidParameterException = class _InvalidParameterException extends RekognitionServiceException {
  constructor(opts) {
    super({
      name: "InvalidParameterException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "InvalidParameterException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    __publicField(this, "Code");
    __publicField(this, "Logref");
    Object.setPrototypeOf(this, _InvalidParameterException.prototype);
    this.Message = opts.Message;
    this.Code = opts.Code;
    this.Logref = opts.Logref;
  }
};
var ProvisionedThroughputExceededException = class _ProvisionedThroughputExceededException extends RekognitionServiceException {
  constructor(opts) {
    super({
      name: "ProvisionedThroughputExceededException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ProvisionedThroughputExceededException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    __publicField(this, "Code");
    __publicField(this, "Logref");
    Object.setPrototypeOf(this, _ProvisionedThroughputExceededException.prototype);
    this.Message = opts.Message;
    this.Code = opts.Code;
    this.Logref = opts.Logref;
  }
};
var ResourceNotFoundException = class _ResourceNotFoundException extends RekognitionServiceException {
  constructor(opts) {
    super({
      name: "ResourceNotFoundException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ResourceNotFoundException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    __publicField(this, "Code");
    __publicField(this, "Logref");
    Object.setPrototypeOf(this, _ResourceNotFoundException.prototype);
    this.Message = opts.Message;
    this.Code = opts.Code;
    this.Logref = opts.Logref;
  }
};
var ServiceQuotaExceededException = class _ServiceQuotaExceededException extends RekognitionServiceException {
  constructor(opts) {
    super({
      name: "ServiceQuotaExceededException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ServiceQuotaExceededException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    __publicField(this, "Code");
    __publicField(this, "Logref");
    Object.setPrototypeOf(this, _ServiceQuotaExceededException.prototype);
    this.Message = opts.Message;
    this.Code = opts.Code;
    this.Logref = opts.Logref;
  }
};
var ThrottlingException = class _ThrottlingException extends RekognitionServiceException {
  constructor(opts) {
    super({
      name: "ThrottlingException",
      $fault: "server",
      ...opts
    });
    __publicField(this, "name", "ThrottlingException");
    __publicField(this, "$fault", "server");
    __publicField(this, "Message");
    __publicField(this, "Code");
    __publicField(this, "Logref");
    Object.setPrototypeOf(this, _ThrottlingException.prototype);
    this.Message = opts.Message;
    this.Code = opts.Code;
    this.Logref = opts.Logref;
  }
};
var Attribute = {
  AGE_RANGE: "AGE_RANGE",
  ALL: "ALL",
  BEARD: "BEARD",
  DEFAULT: "DEFAULT",
  EMOTIONS: "EMOTIONS",
  EYEGLASSES: "EYEGLASSES",
  EYES_OPEN: "EYES_OPEN",
  EYE_DIRECTION: "EYE_DIRECTION",
  FACE_OCCLUDED: "FACE_OCCLUDED",
  GENDER: "GENDER",
  MOUTH_OPEN: "MOUTH_OPEN",
  MUSTACHE: "MUSTACHE",
  SMILE: "SMILE",
  SUNGLASSES: "SUNGLASSES"
};
var BodyPart = {
  FACE: "FACE",
  HEAD: "HEAD",
  LEFT_HAND: "LEFT_HAND",
  RIGHT_HAND: "RIGHT_HAND"
};
var ProtectiveEquipmentType = {
  FACE_COVER: "FACE_COVER",
  HAND_COVER: "HAND_COVER",
  HEAD_COVER: "HEAD_COVER"
};
var EmotionName = {
  ANGRY: "ANGRY",
  CALM: "CALM",
  CONFUSED: "CONFUSED",
  DISGUSTED: "DISGUSTED",
  FEAR: "FEAR",
  HAPPY: "HAPPY",
  SAD: "SAD",
  SURPRISED: "SURPRISED",
  UNKNOWN: "UNKNOWN"
};
var LandmarkType = {
  chinBottom: "chinBottom",
  eyeLeft: "eyeLeft",
  eyeRight: "eyeRight",
  leftEyeBrowLeft: "leftEyeBrowLeft",
  leftEyeBrowRight: "leftEyeBrowRight",
  leftEyeBrowUp: "leftEyeBrowUp",
  leftEyeDown: "leftEyeDown",
  leftEyeLeft: "leftEyeLeft",
  leftEyeRight: "leftEyeRight",
  leftEyeUp: "leftEyeUp",
  leftPupil: "leftPupil",
  midJawlineLeft: "midJawlineLeft",
  midJawlineRight: "midJawlineRight",
  mouthDown: "mouthDown",
  mouthLeft: "mouthLeft",
  mouthRight: "mouthRight",
  mouthUp: "mouthUp",
  nose: "nose",
  noseLeft: "noseLeft",
  noseRight: "noseRight",
  rightEyeBrowLeft: "rightEyeBrowLeft",
  rightEyeBrowRight: "rightEyeBrowRight",
  rightEyeBrowUp: "rightEyeBrowUp",
  rightEyeDown: "rightEyeDown",
  rightEyeLeft: "rightEyeLeft",
  rightEyeRight: "rightEyeRight",
  rightEyeUp: "rightEyeUp",
  rightPupil: "rightPupil",
  upperJawlineLeft: "upperJawlineLeft",
  upperJawlineRight: "upperJawlineRight"
};
var KnownGenderType = {
  Female: "Female",
  Male: "Male",
  Nonbinary: "Nonbinary",
  Unlisted: "Unlisted"
};
var GenderType = {
  Female: "Female",
  Male: "Male"
};
var CelebrityRecognitionSortBy = {
  ID: "ID",
  TIMESTAMP: "TIMESTAMP"
};
var QualityFilter = {
  AUTO: "AUTO",
  HIGH: "HIGH",
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  NONE: "NONE"
};
var OrientationCorrection = {
  ROTATE_0: "ROTATE_0",
  ROTATE_180: "ROTATE_180",
  ROTATE_270: "ROTATE_270",
  ROTATE_90: "ROTATE_90"
};
var ImageTooLargeException = class _ImageTooLargeException extends RekognitionServiceException {
  constructor(opts) {
    super({
      name: "ImageTooLargeException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ImageTooLargeException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    __publicField(this, "Code");
    __publicField(this, "Logref");
    Object.setPrototypeOf(this, _ImageTooLargeException.prototype);
    this.Message = opts.Message;
    this.Code = opts.Code;
    this.Logref = opts.Logref;
  }
};
var InvalidImageFormatException = class _InvalidImageFormatException extends RekognitionServiceException {
  constructor(opts) {
    super({
      name: "InvalidImageFormatException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "InvalidImageFormatException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    __publicField(this, "Code");
    __publicField(this, "Logref");
    Object.setPrototypeOf(this, _InvalidImageFormatException.prototype);
    this.Message = opts.Message;
    this.Code = opts.Code;
    this.Logref = opts.Logref;
  }
};
var InvalidS3ObjectException = class _InvalidS3ObjectException extends RekognitionServiceException {
  constructor(opts) {
    super({
      name: "InvalidS3ObjectException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "InvalidS3ObjectException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    __publicField(this, "Code");
    __publicField(this, "Logref");
    Object.setPrototypeOf(this, _InvalidS3ObjectException.prototype);
    this.Message = opts.Message;
    this.Code = opts.Code;
    this.Logref = opts.Logref;
  }
};
var ContentClassifier = {
  FREE_OF_ADULT_CONTENT: "FreeOfAdultContent",
  FREE_OF_PERSONALLY_IDENTIFIABLE_INFORMATION: "FreeOfPersonallyIdentifiableInformation"
};
var ContentModerationAggregateBy = {
  SEGMENTS: "SEGMENTS",
  TIMESTAMPS: "TIMESTAMPS"
};
var ContentModerationSortBy = {
  NAME: "NAME",
  TIMESTAMP: "TIMESTAMP"
};
var LimitExceededException = class _LimitExceededException extends RekognitionServiceException {
  constructor(opts) {
    super({
      name: "LimitExceededException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "LimitExceededException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    __publicField(this, "Code");
    __publicField(this, "Logref");
    Object.setPrototypeOf(this, _LimitExceededException.prototype);
    this.Message = opts.Message;
    this.Code = opts.Code;
    this.Logref = opts.Logref;
  }
};
var ResourceInUseException = class _ResourceInUseException extends RekognitionServiceException {
  constructor(opts) {
    super({
      name: "ResourceInUseException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ResourceInUseException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    __publicField(this, "Code");
    __publicField(this, "Logref");
    Object.setPrototypeOf(this, _ResourceInUseException.prototype);
    this.Message = opts.Message;
    this.Code = opts.Code;
    this.Logref = opts.Logref;
  }
};
var ResourceAlreadyExistsException = class _ResourceAlreadyExistsException extends RekognitionServiceException {
  constructor(opts) {
    super({
      name: "ResourceAlreadyExistsException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ResourceAlreadyExistsException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    __publicField(this, "Code");
    __publicField(this, "Logref");
    Object.setPrototypeOf(this, _ResourceAlreadyExistsException.prototype);
    this.Message = opts.Message;
    this.Code = opts.Code;
    this.Logref = opts.Logref;
  }
};
var DatasetType = {
  TEST: "TEST",
  TRAIN: "TRAIN"
};
var ProjectAutoUpdate = {
  DISABLED: "DISABLED",
  ENABLED: "ENABLED"
};
var CustomizationFeature = {
  CONTENT_MODERATION: "CONTENT_MODERATION",
  CUSTOM_LABELS: "CUSTOM_LABELS"
};
var DatasetStatus = {
  CREATE_COMPLETE: "CREATE_COMPLETE",
  CREATE_FAILED: "CREATE_FAILED",
  CREATE_IN_PROGRESS: "CREATE_IN_PROGRESS",
  DELETE_IN_PROGRESS: "DELETE_IN_PROGRESS",
  UPDATE_COMPLETE: "UPDATE_COMPLETE",
  UPDATE_FAILED: "UPDATE_FAILED",
  UPDATE_IN_PROGRESS: "UPDATE_IN_PROGRESS"
};
var DatasetStatusMessageCode = {
  CLIENT_ERROR: "CLIENT_ERROR",
  SERVICE_ERROR: "SERVICE_ERROR",
  SUCCESS: "SUCCESS"
};
var UnsuccessfulFaceDeletionReason = {
  ASSOCIATED_TO_AN_EXISTING_USER: "ASSOCIATED_TO_AN_EXISTING_USER",
  FACE_NOT_FOUND: "FACE_NOT_FOUND"
};
var ProjectStatus = {
  CREATED: "CREATED",
  CREATING: "CREATING",
  DELETING: "DELETING"
};
var InvalidPolicyRevisionIdException = class _InvalidPolicyRevisionIdException extends RekognitionServiceException {
  constructor(opts) {
    super({
      name: "InvalidPolicyRevisionIdException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "InvalidPolicyRevisionIdException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    __publicField(this, "Code");
    __publicField(this, "Logref");
    Object.setPrototypeOf(this, _InvalidPolicyRevisionIdException.prototype);
    this.Message = opts.Message;
    this.Code = opts.Code;
    this.Logref = opts.Logref;
  }
};
var ProjectVersionStatus = {
  COPYING_COMPLETED: "COPYING_COMPLETED",
  COPYING_FAILED: "COPYING_FAILED",
  COPYING_IN_PROGRESS: "COPYING_IN_PROGRESS",
  DELETING: "DELETING",
  DEPRECATED: "DEPRECATED",
  EXPIRED: "EXPIRED",
  FAILED: "FAILED",
  RUNNING: "RUNNING",
  STARTING: "STARTING",
  STOPPED: "STOPPED",
  STOPPING: "STOPPING",
  TRAINING_COMPLETED: "TRAINING_COMPLETED",
  TRAINING_FAILED: "TRAINING_FAILED",
  TRAINING_IN_PROGRESS: "TRAINING_IN_PROGRESS"
};
var InvalidPaginationTokenException = class _InvalidPaginationTokenException extends RekognitionServiceException {
  constructor(opts) {
    super({
      name: "InvalidPaginationTokenException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "InvalidPaginationTokenException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    __publicField(this, "Code");
    __publicField(this, "Logref");
    Object.setPrototypeOf(this, _InvalidPaginationTokenException.prototype);
    this.Message = opts.Message;
    this.Code = opts.Code;
    this.Logref = opts.Logref;
  }
};
var StreamProcessorStatus = {
  FAILED: "FAILED",
  RUNNING: "RUNNING",
  STARTING: "STARTING",
  STOPPED: "STOPPED",
  STOPPING: "STOPPING",
  UPDATING: "UPDATING"
};
var ResourceNotReadyException = class _ResourceNotReadyException extends RekognitionServiceException {
  constructor(opts) {
    super({
      name: "ResourceNotReadyException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ResourceNotReadyException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    __publicField(this, "Code");
    __publicField(this, "Logref");
    Object.setPrototypeOf(this, _ResourceNotReadyException.prototype);
    this.Message = opts.Message;
    this.Code = opts.Code;
    this.Logref = opts.Logref;
  }
};
var DetectLabelsFeatureName = {
  GENERAL_LABELS: "GENERAL_LABELS",
  IMAGE_PROPERTIES: "IMAGE_PROPERTIES"
};
var HumanLoopQuotaExceededException = class _HumanLoopQuotaExceededException extends RekognitionServiceException {
  constructor(opts) {
    super({
      name: "HumanLoopQuotaExceededException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "HumanLoopQuotaExceededException");
    __publicField(this, "$fault", "client");
    __publicField(this, "ResourceType");
    __publicField(this, "QuotaCode");
    __publicField(this, "ServiceCode");
    __publicField(this, "Message");
    __publicField(this, "Code");
    __publicField(this, "Logref");
    Object.setPrototypeOf(this, _HumanLoopQuotaExceededException.prototype);
    this.ResourceType = opts.ResourceType;
    this.QuotaCode = opts.QuotaCode;
    this.ServiceCode = opts.ServiceCode;
    this.Message = opts.Message;
    this.Code = opts.Code;
    this.Logref = opts.Logref;
  }
};
var TextTypes = {
  LINE: "LINE",
  WORD: "WORD"
};
var UnsuccessfulFaceDisassociationReason = {
  ASSOCIATED_TO_A_DIFFERENT_USER: "ASSOCIATED_TO_A_DIFFERENT_USER",
  FACE_NOT_FOUND: "FACE_NOT_FOUND"
};
var FaceAttributes = {
  ALL: "ALL",
  DEFAULT: "DEFAULT"
};
var FaceSearchSortBy = {
  INDEX: "INDEX",
  TIMESTAMP: "TIMESTAMP"
};
var VideoJobStatus = {
  FAILED: "FAILED",
  IN_PROGRESS: "IN_PROGRESS",
  SUCCEEDED: "SUCCEEDED"
};
var VideoColorRange = {
  FULL: "FULL",
  LIMITED: "LIMITED"
};
var LivenessSessionStatus = {
  CREATED: "CREATED",
  EXPIRED: "EXPIRED",
  FAILED: "FAILED",
  IN_PROGRESS: "IN_PROGRESS",
  SUCCEEDED: "SUCCEEDED"
};
var SessionNotFoundException = class _SessionNotFoundException extends RekognitionServiceException {
  constructor(opts) {
    super({
      name: "SessionNotFoundException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "SessionNotFoundException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    __publicField(this, "Code");
    __publicField(this, "Logref");
    Object.setPrototypeOf(this, _SessionNotFoundException.prototype);
    this.Message = opts.Message;
    this.Code = opts.Code;
    this.Logref = opts.Logref;
  }
};
var LabelDetectionAggregateBy = {
  SEGMENTS: "SEGMENTS",
  TIMESTAMPS: "TIMESTAMPS"
};
var LabelDetectionSortBy = {
  NAME: "NAME",
  TIMESTAMP: "TIMESTAMP"
};
var MediaAnalysisJobFailureCode = {
  ACCESS_DENIED: "ACCESS_DENIED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  INVALID_KMS_KEY: "INVALID_KMS_KEY",
  INVALID_MANIFEST: "INVALID_MANIFEST",
  INVALID_OUTPUT_CONFIG: "INVALID_OUTPUT_CONFIG",
  INVALID_S3_OBJECT: "INVALID_S3_OBJECT",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  RESOURCE_NOT_READY: "RESOURCE_NOT_READY",
  THROTTLED: "THROTTLED"
};
var MediaAnalysisJobStatus = {
  CREATED: "CREATED",
  FAILED: "FAILED",
  IN_PROGRESS: "IN_PROGRESS",
  QUEUED: "QUEUED",
  SUCCEEDED: "SUCCEEDED"
};
var PersonTrackingSortBy = {
  INDEX: "INDEX",
  TIMESTAMP: "TIMESTAMP"
};
var TechnicalCueType = {
  BLACK_FRAMES: "BlackFrames",
  COLOR_BARS: "ColorBars",
  CONTENT: "Content",
  END_CREDITS: "EndCredits",
  OPENING_CREDITS: "OpeningCredits",
  SLATE: "Slate",
  STUDIO_LOGO: "StudioLogo"
};
var SegmentType = {
  SHOT: "SHOT",
  TECHNICAL_CUE: "TECHNICAL_CUE"
};
var Reason = {
  EXCEEDS_MAX_FACES: "EXCEEDS_MAX_FACES",
  EXTREME_POSE: "EXTREME_POSE",
  LOW_BRIGHTNESS: "LOW_BRIGHTNESS",
  LOW_CONFIDENCE: "LOW_CONFIDENCE",
  LOW_FACE_QUALITY: "LOW_FACE_QUALITY",
  LOW_SHARPNESS: "LOW_SHARPNESS",
  SMALL_BOUNDING_BOX: "SMALL_BOUNDING_BOX"
};
var InvalidManifestException = class _InvalidManifestException extends RekognitionServiceException {
  constructor(opts) {
    super({
      name: "InvalidManifestException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "InvalidManifestException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    __publicField(this, "Code");
    __publicField(this, "Logref");
    Object.setPrototypeOf(this, _InvalidManifestException.prototype);
    this.Message = opts.Message;
    this.Code = opts.Code;
    this.Logref = opts.Logref;
  }
};
var LabelDetectionFeatureName = {
  GENERAL_LABELS: "GENERAL_LABELS"
};
var MalformedPolicyDocumentException = class _MalformedPolicyDocumentException extends RekognitionServiceException {
  constructor(opts) {
    super({
      name: "MalformedPolicyDocumentException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "MalformedPolicyDocumentException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    __publicField(this, "Code");
    __publicField(this, "Logref");
    Object.setPrototypeOf(this, _MalformedPolicyDocumentException.prototype);
    this.Message = opts.Message;
    this.Code = opts.Code;
    this.Logref = opts.Logref;
  }
};
var AuditImageFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Bytes && { Bytes: SENSITIVE_STRING }
});
var GetFaceLivenessSessionResultsResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ReferenceImage && { ReferenceImage: AuditImageFilterSensitiveLog(obj.ReferenceImage) },
  ...obj.AuditImages && { AuditImages: obj.AuditImages.map((item) => AuditImageFilterSensitiveLog(item)) }
});

// node_modules/@aws-sdk/client-rekognition/dist-es/models/models_1.js
var import_dist34 = __toESM(require_dist());
var import_dist35 = __toESM(require_dist2());
var import_dist36 = __toESM(require_dist3());
var UnsearchedFaceReason = {
  EXCEEDS_MAX_FACES: "EXCEEDS_MAX_FACES",
  EXTREME_POSE: "EXTREME_POSE",
  FACE_NOT_LARGEST: "FACE_NOT_LARGEST",
  LOW_BRIGHTNESS: "LOW_BRIGHTNESS",
  LOW_CONFIDENCE: "LOW_CONFIDENCE",
  LOW_FACE_QUALITY: "LOW_FACE_QUALITY",
  LOW_SHARPNESS: "LOW_SHARPNESS",
  SMALL_BOUNDING_BOX: "SMALL_BOUNDING_BOX"
};
var VideoTooLargeException = class _VideoTooLargeException extends RekognitionServiceException {
  constructor(opts) {
    super({
      name: "VideoTooLargeException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "VideoTooLargeException");
    __publicField(this, "$fault", "client");
    __publicField(this, "Message");
    __publicField(this, "Code");
    __publicField(this, "Logref");
    Object.setPrototypeOf(this, _VideoTooLargeException.prototype);
    this.Message = opts.Message;
    this.Code = opts.Code;
    this.Logref = opts.Logref;
  }
};
var StreamProcessorParameterToDelete = {
  ConnectedHomeMinConfidence: "ConnectedHomeMinConfidence",
  RegionsOfInterest: "RegionsOfInterest"
};

// node_modules/@aws-sdk/client-rekognition/dist-es/protocols/Aws_json1_1.js
var se_AssociateFacesCommand = async (input, context) => {
  const headers = sharedHeaders("AssociateFaces");
  let body;
  body = JSON.stringify(se_AssociateFacesRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_CompareFacesCommand = async (input, context) => {
  const headers = sharedHeaders("CompareFaces");
  let body;
  body = JSON.stringify(se_CompareFacesRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_CopyProjectVersionCommand = async (input, context) => {
  const headers = sharedHeaders("CopyProjectVersion");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_CreateCollectionCommand = async (input, context) => {
  const headers = sharedHeaders("CreateCollection");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_CreateDatasetCommand = async (input, context) => {
  const headers = sharedHeaders("CreateDataset");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_CreateFaceLivenessSessionCommand = async (input, context) => {
  const headers = sharedHeaders("CreateFaceLivenessSession");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_CreateProjectCommand = async (input, context) => {
  const headers = sharedHeaders("CreateProject");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_CreateProjectVersionCommand = async (input, context) => {
  const headers = sharedHeaders("CreateProjectVersion");
  let body;
  body = JSON.stringify(se_CreateProjectVersionRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_CreateStreamProcessorCommand = async (input, context) => {
  const headers = sharedHeaders("CreateStreamProcessor");
  let body;
  body = JSON.stringify(se_CreateStreamProcessorRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_CreateUserCommand = async (input, context) => {
  const headers = sharedHeaders("CreateUser");
  let body;
  body = JSON.stringify(se_CreateUserRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DeleteCollectionCommand = async (input, context) => {
  const headers = sharedHeaders("DeleteCollection");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DeleteDatasetCommand = async (input, context) => {
  const headers = sharedHeaders("DeleteDataset");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DeleteFacesCommand = async (input, context) => {
  const headers = sharedHeaders("DeleteFaces");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DeleteProjectCommand = async (input, context) => {
  const headers = sharedHeaders("DeleteProject");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DeleteProjectPolicyCommand = async (input, context) => {
  const headers = sharedHeaders("DeleteProjectPolicy");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DeleteProjectVersionCommand = async (input, context) => {
  const headers = sharedHeaders("DeleteProjectVersion");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DeleteStreamProcessorCommand = async (input, context) => {
  const headers = sharedHeaders("DeleteStreamProcessor");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DeleteUserCommand = async (input, context) => {
  const headers = sharedHeaders("DeleteUser");
  let body;
  body = JSON.stringify(se_DeleteUserRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeCollectionCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeCollection");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeDatasetCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeDataset");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeProjectsCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeProjects");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeProjectVersionsCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeProjectVersions");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeStreamProcessorCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeStreamProcessor");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DetectCustomLabelsCommand = async (input, context) => {
  const headers = sharedHeaders("DetectCustomLabels");
  let body;
  body = JSON.stringify(se_DetectCustomLabelsRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DetectFacesCommand = async (input, context) => {
  const headers = sharedHeaders("DetectFaces");
  let body;
  body = JSON.stringify(se_DetectFacesRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DetectLabelsCommand = async (input, context) => {
  const headers = sharedHeaders("DetectLabels");
  let body;
  body = JSON.stringify(se_DetectLabelsRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DetectModerationLabelsCommand = async (input, context) => {
  const headers = sharedHeaders("DetectModerationLabels");
  let body;
  body = JSON.stringify(se_DetectModerationLabelsRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DetectProtectiveEquipmentCommand = async (input, context) => {
  const headers = sharedHeaders("DetectProtectiveEquipment");
  let body;
  body = JSON.stringify(se_DetectProtectiveEquipmentRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DetectTextCommand = async (input, context) => {
  const headers = sharedHeaders("DetectText");
  let body;
  body = JSON.stringify(se_DetectTextRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DisassociateFacesCommand = async (input, context) => {
  const headers = sharedHeaders("DisassociateFaces");
  let body;
  body = JSON.stringify(se_DisassociateFacesRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DistributeDatasetEntriesCommand = async (input, context) => {
  const headers = sharedHeaders("DistributeDatasetEntries");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetCelebrityInfoCommand = async (input, context) => {
  const headers = sharedHeaders("GetCelebrityInfo");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetCelebrityRecognitionCommand = async (input, context) => {
  const headers = sharedHeaders("GetCelebrityRecognition");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetContentModerationCommand = async (input, context) => {
  const headers = sharedHeaders("GetContentModeration");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetFaceDetectionCommand = async (input, context) => {
  const headers = sharedHeaders("GetFaceDetection");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetFaceLivenessSessionResultsCommand = async (input, context) => {
  const headers = sharedHeaders("GetFaceLivenessSessionResults");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetFaceSearchCommand = async (input, context) => {
  const headers = sharedHeaders("GetFaceSearch");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetLabelDetectionCommand = async (input, context) => {
  const headers = sharedHeaders("GetLabelDetection");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetMediaAnalysisJobCommand = async (input, context) => {
  const headers = sharedHeaders("GetMediaAnalysisJob");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetPersonTrackingCommand = async (input, context) => {
  const headers = sharedHeaders("GetPersonTracking");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetSegmentDetectionCommand = async (input, context) => {
  const headers = sharedHeaders("GetSegmentDetection");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetTextDetectionCommand = async (input, context) => {
  const headers = sharedHeaders("GetTextDetection");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_IndexFacesCommand = async (input, context) => {
  const headers = sharedHeaders("IndexFaces");
  let body;
  body = JSON.stringify(se_IndexFacesRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ListCollectionsCommand = async (input, context) => {
  const headers = sharedHeaders("ListCollections");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ListDatasetEntriesCommand = async (input, context) => {
  const headers = sharedHeaders("ListDatasetEntries");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ListDatasetLabelsCommand = async (input, context) => {
  const headers = sharedHeaders("ListDatasetLabels");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ListFacesCommand = async (input, context) => {
  const headers = sharedHeaders("ListFaces");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ListMediaAnalysisJobsCommand = async (input, context) => {
  const headers = sharedHeaders("ListMediaAnalysisJobs");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ListProjectPoliciesCommand = async (input, context) => {
  const headers = sharedHeaders("ListProjectPolicies");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ListStreamProcessorsCommand = async (input, context) => {
  const headers = sharedHeaders("ListStreamProcessors");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ListTagsForResourceCommand = async (input, context) => {
  const headers = sharedHeaders("ListTagsForResource");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ListUsersCommand = async (input, context) => {
  const headers = sharedHeaders("ListUsers");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_PutProjectPolicyCommand = async (input, context) => {
  const headers = sharedHeaders("PutProjectPolicy");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_RecognizeCelebritiesCommand = async (input, context) => {
  const headers = sharedHeaders("RecognizeCelebrities");
  let body;
  body = JSON.stringify(se_RecognizeCelebritiesRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_SearchFacesCommand = async (input, context) => {
  const headers = sharedHeaders("SearchFaces");
  let body;
  body = JSON.stringify(se_SearchFacesRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_SearchFacesByImageCommand = async (input, context) => {
  const headers = sharedHeaders("SearchFacesByImage");
  let body;
  body = JSON.stringify(se_SearchFacesByImageRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_SearchUsersCommand = async (input, context) => {
  const headers = sharedHeaders("SearchUsers");
  let body;
  body = JSON.stringify(se_SearchUsersRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_SearchUsersByImageCommand = async (input, context) => {
  const headers = sharedHeaders("SearchUsersByImage");
  let body;
  body = JSON.stringify(se_SearchUsersByImageRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_StartCelebrityRecognitionCommand = async (input, context) => {
  const headers = sharedHeaders("StartCelebrityRecognition");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_StartContentModerationCommand = async (input, context) => {
  const headers = sharedHeaders("StartContentModeration");
  let body;
  body = JSON.stringify(se_StartContentModerationRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_StartFaceDetectionCommand = async (input, context) => {
  const headers = sharedHeaders("StartFaceDetection");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_StartFaceSearchCommand = async (input, context) => {
  const headers = sharedHeaders("StartFaceSearch");
  let body;
  body = JSON.stringify(se_StartFaceSearchRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_StartLabelDetectionCommand = async (input, context) => {
  const headers = sharedHeaders("StartLabelDetection");
  let body;
  body = JSON.stringify(se_StartLabelDetectionRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_StartMediaAnalysisJobCommand = async (input, context) => {
  const headers = sharedHeaders("StartMediaAnalysisJob");
  let body;
  body = JSON.stringify(se_StartMediaAnalysisJobRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_StartPersonTrackingCommand = async (input, context) => {
  const headers = sharedHeaders("StartPersonTracking");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_StartProjectVersionCommand = async (input, context) => {
  const headers = sharedHeaders("StartProjectVersion");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_StartSegmentDetectionCommand = async (input, context) => {
  const headers = sharedHeaders("StartSegmentDetection");
  let body;
  body = JSON.stringify(se_StartSegmentDetectionRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_StartStreamProcessorCommand = async (input, context) => {
  const headers = sharedHeaders("StartStreamProcessor");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_StartTextDetectionCommand = async (input, context) => {
  const headers = sharedHeaders("StartTextDetection");
  let body;
  body = JSON.stringify(se_StartTextDetectionRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_StopProjectVersionCommand = async (input, context) => {
  const headers = sharedHeaders("StopProjectVersion");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_StopStreamProcessorCommand = async (input, context) => {
  const headers = sharedHeaders("StopStreamProcessor");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_TagResourceCommand = async (input, context) => {
  const headers = sharedHeaders("TagResource");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_UntagResourceCommand = async (input, context) => {
  const headers = sharedHeaders("UntagResource");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_UpdateDatasetEntriesCommand = async (input, context) => {
  const headers = sharedHeaders("UpdateDatasetEntries");
  let body;
  body = JSON.stringify(se_UpdateDatasetEntriesRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_UpdateStreamProcessorCommand = async (input, context) => {
  const headers = sharedHeaders("UpdateStreamProcessor");
  let body;
  body = JSON.stringify(se_UpdateStreamProcessorRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var de_AssociateFacesCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_AssociateFacesResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_CompareFacesCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_CompareFacesResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_CopyProjectVersionCommand = async (output, context) => {
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
var de_CreateCollectionCommand = async (output, context) => {
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
var de_CreateDatasetCommand = async (output, context) => {
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
var de_CreateFaceLivenessSessionCommand = async (output, context) => {
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
var de_CreateProjectCommand = async (output, context) => {
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
var de_CreateProjectVersionCommand = async (output, context) => {
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
var de_CreateStreamProcessorCommand = async (output, context) => {
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
var de_CreateUserCommand = async (output, context) => {
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
var de_DeleteCollectionCommand = async (output, context) => {
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
var de_DeleteDatasetCommand = async (output, context) => {
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
var de_DeleteFacesCommand = async (output, context) => {
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
var de_DeleteProjectCommand = async (output, context) => {
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
var de_DeleteProjectPolicyCommand = async (output, context) => {
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
var de_DeleteProjectVersionCommand = async (output, context) => {
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
var de_DeleteStreamProcessorCommand = async (output, context) => {
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
var de_DeleteUserCommand = async (output, context) => {
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
var de_DescribeCollectionCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DescribeCollectionResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeDatasetCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DescribeDatasetResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeProjectsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DescribeProjectsResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeProjectVersionsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DescribeProjectVersionsResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeStreamProcessorCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DescribeStreamProcessorResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DetectCustomLabelsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DetectCustomLabelsResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DetectFacesCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DetectFacesResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DetectLabelsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DetectLabelsResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DetectModerationLabelsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DetectModerationLabelsResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DetectProtectiveEquipmentCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DetectProtectiveEquipmentResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DetectTextCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DetectTextResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DisassociateFacesCommand = async (output, context) => {
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
var de_DistributeDatasetEntriesCommand = async (output, context) => {
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
var de_GetCelebrityInfoCommand = async (output, context) => {
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
var de_GetCelebrityRecognitionCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_GetCelebrityRecognitionResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_GetContentModerationCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_GetContentModerationResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_GetFaceDetectionCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_GetFaceDetectionResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_GetFaceLivenessSessionResultsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_GetFaceLivenessSessionResultsResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_GetFaceSearchCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_GetFaceSearchResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_GetLabelDetectionCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_GetLabelDetectionResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_GetMediaAnalysisJobCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_GetMediaAnalysisJobResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_GetPersonTrackingCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_GetPersonTrackingResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_GetSegmentDetectionCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_GetSegmentDetectionResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_GetTextDetectionCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_GetTextDetectionResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_IndexFacesCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_IndexFacesResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_ListCollectionsCommand = async (output, context) => {
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
var de_ListDatasetEntriesCommand = async (output, context) => {
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
var de_ListDatasetLabelsCommand = async (output, context) => {
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
var de_ListFacesCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_ListFacesResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_ListMediaAnalysisJobsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_ListMediaAnalysisJobsResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_ListProjectPoliciesCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_ListProjectPoliciesResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_ListStreamProcessorsCommand = async (output, context) => {
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
var de_ListTagsForResourceCommand = async (output, context) => {
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
var de_ListUsersCommand = async (output, context) => {
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
var de_PutProjectPolicyCommand = async (output, context) => {
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
var de_RecognizeCelebritiesCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_RecognizeCelebritiesResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_SearchFacesCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_SearchFacesResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_SearchFacesByImageCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_SearchFacesByImageResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_SearchUsersCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_SearchUsersResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_SearchUsersByImageCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_SearchUsersByImageResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_StartCelebrityRecognitionCommand = async (output, context) => {
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
var de_StartContentModerationCommand = async (output, context) => {
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
var de_StartFaceDetectionCommand = async (output, context) => {
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
var de_StartFaceSearchCommand = async (output, context) => {
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
var de_StartLabelDetectionCommand = async (output, context) => {
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
var de_StartMediaAnalysisJobCommand = async (output, context) => {
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
var de_StartPersonTrackingCommand = async (output, context) => {
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
var de_StartProjectVersionCommand = async (output, context) => {
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
var de_StartSegmentDetectionCommand = async (output, context) => {
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
var de_StartStreamProcessorCommand = async (output, context) => {
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
var de_StartTextDetectionCommand = async (output, context) => {
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
var de_StopProjectVersionCommand = async (output, context) => {
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
var de_StopStreamProcessorCommand = async (output, context) => {
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
var de_TagResourceCommand = async (output, context) => {
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
var de_UntagResourceCommand = async (output, context) => {
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
var de_UpdateDatasetEntriesCommand = async (output, context) => {
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
var de_UpdateStreamProcessorCommand = async (output, context) => {
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
    case "AccessDeniedException":
    case "com.amazonaws.rekognition#AccessDeniedException":
      throw await de_AccessDeniedExceptionRes(parsedOutput, context);
    case "ConflictException":
    case "com.amazonaws.rekognition#ConflictException":
      throw await de_ConflictExceptionRes(parsedOutput, context);
    case "IdempotentParameterMismatchException":
    case "com.amazonaws.rekognition#IdempotentParameterMismatchException":
      throw await de_IdempotentParameterMismatchExceptionRes(parsedOutput, context);
    case "InternalServerError":
    case "com.amazonaws.rekognition#InternalServerError":
      throw await de_InternalServerErrorRes(parsedOutput, context);
    case "InvalidParameterException":
    case "com.amazonaws.rekognition#InvalidParameterException":
      throw await de_InvalidParameterExceptionRes(parsedOutput, context);
    case "ProvisionedThroughputExceededException":
    case "com.amazonaws.rekognition#ProvisionedThroughputExceededException":
      throw await de_ProvisionedThroughputExceededExceptionRes(parsedOutput, context);
    case "ResourceNotFoundException":
    case "com.amazonaws.rekognition#ResourceNotFoundException":
      throw await de_ResourceNotFoundExceptionRes(parsedOutput, context);
    case "ServiceQuotaExceededException":
    case "com.amazonaws.rekognition#ServiceQuotaExceededException":
      throw await de_ServiceQuotaExceededExceptionRes(parsedOutput, context);
    case "ThrottlingException":
    case "com.amazonaws.rekognition#ThrottlingException":
      throw await de_ThrottlingExceptionRes(parsedOutput, context);
    case "ImageTooLargeException":
    case "com.amazonaws.rekognition#ImageTooLargeException":
      throw await de_ImageTooLargeExceptionRes(parsedOutput, context);
    case "InvalidImageFormatException":
    case "com.amazonaws.rekognition#InvalidImageFormatException":
      throw await de_InvalidImageFormatExceptionRes(parsedOutput, context);
    case "InvalidS3ObjectException":
    case "com.amazonaws.rekognition#InvalidS3ObjectException":
      throw await de_InvalidS3ObjectExceptionRes(parsedOutput, context);
    case "LimitExceededException":
    case "com.amazonaws.rekognition#LimitExceededException":
      throw await de_LimitExceededExceptionRes(parsedOutput, context);
    case "ResourceInUseException":
    case "com.amazonaws.rekognition#ResourceInUseException":
      throw await de_ResourceInUseExceptionRes(parsedOutput, context);
    case "ResourceAlreadyExistsException":
    case "com.amazonaws.rekognition#ResourceAlreadyExistsException":
      throw await de_ResourceAlreadyExistsExceptionRes(parsedOutput, context);
    case "InvalidPolicyRevisionIdException":
    case "com.amazonaws.rekognition#InvalidPolicyRevisionIdException":
      throw await de_InvalidPolicyRevisionIdExceptionRes(parsedOutput, context);
    case "InvalidPaginationTokenException":
    case "com.amazonaws.rekognition#InvalidPaginationTokenException":
      throw await de_InvalidPaginationTokenExceptionRes(parsedOutput, context);
    case "ResourceNotReadyException":
    case "com.amazonaws.rekognition#ResourceNotReadyException":
      throw await de_ResourceNotReadyExceptionRes(parsedOutput, context);
    case "HumanLoopQuotaExceededException":
    case "com.amazonaws.rekognition#HumanLoopQuotaExceededException":
      throw await de_HumanLoopQuotaExceededExceptionRes(parsedOutput, context);
    case "SessionNotFoundException":
    case "com.amazonaws.rekognition#SessionNotFoundException":
      throw await de_SessionNotFoundExceptionRes(parsedOutput, context);
    case "MalformedPolicyDocumentException":
    case "com.amazonaws.rekognition#MalformedPolicyDocumentException":
      throw await de_MalformedPolicyDocumentExceptionRes(parsedOutput, context);
    case "VideoTooLargeException":
    case "com.amazonaws.rekognition#VideoTooLargeException":
      throw await de_VideoTooLargeExceptionRes(parsedOutput, context);
    case "InvalidManifestException":
    case "com.amazonaws.rekognition#InvalidManifestException":
      throw await de_InvalidManifestExceptionRes(parsedOutput, context);
    default:
      const parsedBody = parsedOutput.body;
      return throwDefaultError({
        output,
        parsedBody,
        errorCode
      });
  }
};
var de_AccessDeniedExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new AccessDeniedException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_ConflictExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new ConflictException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_HumanLoopQuotaExceededExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new HumanLoopQuotaExceededException({
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
var de_ImageTooLargeExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new ImageTooLargeException({
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
var de_InvalidImageFormatExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new InvalidImageFormatException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_InvalidManifestExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new InvalidManifestException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_InvalidPaginationTokenExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new InvalidPaginationTokenException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_InvalidParameterExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new InvalidParameterException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_InvalidPolicyRevisionIdExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new InvalidPolicyRevisionIdException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_InvalidS3ObjectExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new InvalidS3ObjectException({
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
var de_MalformedPolicyDocumentExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new MalformedPolicyDocumentException({
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
var de_ResourceAlreadyExistsExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new ResourceAlreadyExistsException({
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
var de_ResourceNotReadyExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new ResourceNotReadyException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_ServiceQuotaExceededExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new ServiceQuotaExceededException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_SessionNotFoundExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new SessionNotFoundException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_ThrottlingExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new ThrottlingException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_VideoTooLargeExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new VideoTooLargeException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var se_AssociateFacesRequest = (input, context) => {
  return take(input, {
    ClientRequestToken: [true, (_) => _ ?? v4_default()],
    CollectionId: [],
    FaceIds: _json,
    UserId: [],
    UserMatchThreshold: serializeFloat
  });
};
var se_BlackFrame = (input, context) => {
  return take(input, {
    MaxPixelThreshold: serializeFloat,
    MinCoveragePercentage: serializeFloat
  });
};
var se_BoundingBox = (input, context) => {
  return take(input, {
    Height: serializeFloat,
    Left: serializeFloat,
    Top: serializeFloat,
    Width: serializeFloat
  });
};
var se_CompareFacesRequest = (input, context) => {
  return take(input, {
    QualityFilter: [],
    SimilarityThreshold: serializeFloat,
    SourceImage: (_) => se_Image(_, context),
    TargetImage: (_) => se_Image(_, context)
  });
};
var se_ConnectedHomeSettings = (input, context) => {
  return take(input, {
    Labels: _json,
    MinConfidence: serializeFloat
  });
};
var se_ConnectedHomeSettingsForUpdate = (input, context) => {
  return take(input, {
    Labels: _json,
    MinConfidence: serializeFloat
  });
};
var se_CreateProjectVersionRequest = (input, context) => {
  return take(input, {
    FeatureConfig: (_) => se_CustomizationFeatureConfig(_, context),
    KmsKeyId: [],
    OutputConfig: _json,
    ProjectArn: [],
    Tags: _json,
    TestingData: _json,
    TrainingData: _json,
    VersionDescription: [],
    VersionName: []
  });
};
var se_CreateStreamProcessorRequest = (input, context) => {
  return take(input, {
    DataSharingPreference: _json,
    Input: _json,
    KmsKeyId: [],
    Name: [],
    NotificationChannel: _json,
    Output: _json,
    RegionsOfInterest: (_) => se_RegionsOfInterest(_, context),
    RoleArn: [],
    Settings: (_) => se_StreamProcessorSettings(_, context),
    Tags: _json
  });
};
var se_CreateUserRequest = (input, context) => {
  return take(input, {
    ClientRequestToken: [true, (_) => _ ?? v4_default()],
    CollectionId: [],
    UserId: []
  });
};
var se_CustomizationFeatureConfig = (input, context) => {
  return take(input, {
    ContentModeration: (_) => se_CustomizationFeatureContentModerationConfig(_, context)
  });
};
var se_CustomizationFeatureContentModerationConfig = (input, context) => {
  return take(input, {
    ConfidenceThreshold: serializeFloat
  });
};
var se_DatasetChanges = (input, context) => {
  return take(input, {
    GroundTruth: context.base64Encoder
  });
};
var se_DeleteUserRequest = (input, context) => {
  return take(input, {
    ClientRequestToken: [true, (_) => _ ?? v4_default()],
    CollectionId: [],
    UserId: []
  });
};
var se_DetectCustomLabelsRequest = (input, context) => {
  return take(input, {
    Image: (_) => se_Image(_, context),
    MaxResults: [],
    MinConfidence: serializeFloat,
    ProjectVersionArn: []
  });
};
var se_DetectFacesRequest = (input, context) => {
  return take(input, {
    Attributes: _json,
    Image: (_) => se_Image(_, context)
  });
};
var se_DetectionFilter = (input, context) => {
  return take(input, {
    MinBoundingBoxHeight: serializeFloat,
    MinBoundingBoxWidth: serializeFloat,
    MinConfidence: serializeFloat
  });
};
var se_DetectLabelsRequest = (input, context) => {
  return take(input, {
    Features: _json,
    Image: (_) => se_Image(_, context),
    MaxLabels: [],
    MinConfidence: serializeFloat,
    Settings: _json
  });
};
var se_DetectModerationLabelsRequest = (input, context) => {
  return take(input, {
    HumanLoopConfig: _json,
    Image: (_) => se_Image(_, context),
    MinConfidence: serializeFloat,
    ProjectVersion: []
  });
};
var se_DetectProtectiveEquipmentRequest = (input, context) => {
  return take(input, {
    Image: (_) => se_Image(_, context),
    SummarizationAttributes: (_) => se_ProtectiveEquipmentSummarizationAttributes(_, context)
  });
};
var se_DetectTextFilters = (input, context) => {
  return take(input, {
    RegionsOfInterest: (_) => se_RegionsOfInterest(_, context),
    WordFilter: (_) => se_DetectionFilter(_, context)
  });
};
var se_DetectTextRequest = (input, context) => {
  return take(input, {
    Filters: (_) => se_DetectTextFilters(_, context),
    Image: (_) => se_Image(_, context)
  });
};
var se_DisassociateFacesRequest = (input, context) => {
  return take(input, {
    ClientRequestToken: [true, (_) => _ ?? v4_default()],
    CollectionId: [],
    FaceIds: _json,
    UserId: []
  });
};
var se_FaceSearchSettings = (input, context) => {
  return take(input, {
    CollectionId: [],
    FaceMatchThreshold: serializeFloat
  });
};
var se_Image = (input, context) => {
  return take(input, {
    Bytes: context.base64Encoder,
    S3Object: _json
  });
};
var se_IndexFacesRequest = (input, context) => {
  return take(input, {
    CollectionId: [],
    DetectionAttributes: _json,
    ExternalImageId: [],
    Image: (_) => se_Image(_, context),
    MaxFaces: [],
    QualityFilter: []
  });
};
var se_MediaAnalysisDetectModerationLabelsConfig = (input, context) => {
  return take(input, {
    MinConfidence: serializeFloat,
    ProjectVersion: []
  });
};
var se_MediaAnalysisOperationsConfig = (input, context) => {
  return take(input, {
    DetectModerationLabels: (_) => se_MediaAnalysisDetectModerationLabelsConfig(_, context)
  });
};
var se_Point = (input, context) => {
  return take(input, {
    X: serializeFloat,
    Y: serializeFloat
  });
};
var se_Polygon = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    return se_Point(entry, context);
  });
};
var se_ProtectiveEquipmentSummarizationAttributes = (input, context) => {
  return take(input, {
    MinConfidence: serializeFloat,
    RequiredEquipmentTypes: _json
  });
};
var se_RecognizeCelebritiesRequest = (input, context) => {
  return take(input, {
    Image: (_) => se_Image(_, context)
  });
};
var se_RegionOfInterest = (input, context) => {
  return take(input, {
    BoundingBox: (_) => se_BoundingBox(_, context),
    Polygon: (_) => se_Polygon(_, context)
  });
};
var se_RegionsOfInterest = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    return se_RegionOfInterest(entry, context);
  });
};
var se_SearchFacesByImageRequest = (input, context) => {
  return take(input, {
    CollectionId: [],
    FaceMatchThreshold: serializeFloat,
    Image: (_) => se_Image(_, context),
    MaxFaces: [],
    QualityFilter: []
  });
};
var se_SearchFacesRequest = (input, context) => {
  return take(input, {
    CollectionId: [],
    FaceId: [],
    FaceMatchThreshold: serializeFloat,
    MaxFaces: []
  });
};
var se_SearchUsersByImageRequest = (input, context) => {
  return take(input, {
    CollectionId: [],
    Image: (_) => se_Image(_, context),
    MaxUsers: [],
    QualityFilter: [],
    UserMatchThreshold: serializeFloat
  });
};
var se_SearchUsersRequest = (input, context) => {
  return take(input, {
    CollectionId: [],
    FaceId: [],
    MaxUsers: [],
    UserId: [],
    UserMatchThreshold: serializeFloat
  });
};
var se_StartContentModerationRequest = (input, context) => {
  return take(input, {
    ClientRequestToken: [],
    JobTag: [],
    MinConfidence: serializeFloat,
    NotificationChannel: _json,
    Video: _json
  });
};
var se_StartFaceSearchRequest = (input, context) => {
  return take(input, {
    ClientRequestToken: [],
    CollectionId: [],
    FaceMatchThreshold: serializeFloat,
    JobTag: [],
    NotificationChannel: _json,
    Video: _json
  });
};
var se_StartLabelDetectionRequest = (input, context) => {
  return take(input, {
    ClientRequestToken: [],
    Features: _json,
    JobTag: [],
    MinConfidence: serializeFloat,
    NotificationChannel: _json,
    Settings: _json,
    Video: _json
  });
};
var se_StartMediaAnalysisJobRequest = (input, context) => {
  return take(input, {
    ClientRequestToken: [true, (_) => _ ?? v4_default()],
    Input: _json,
    JobName: [],
    KmsKeyId: [],
    OperationsConfig: (_) => se_MediaAnalysisOperationsConfig(_, context),
    OutputConfig: _json
  });
};
var se_StartSegmentDetectionFilters = (input, context) => {
  return take(input, {
    ShotFilter: (_) => se_StartShotDetectionFilter(_, context),
    TechnicalCueFilter: (_) => se_StartTechnicalCueDetectionFilter(_, context)
  });
};
var se_StartSegmentDetectionRequest = (input, context) => {
  return take(input, {
    ClientRequestToken: [],
    Filters: (_) => se_StartSegmentDetectionFilters(_, context),
    JobTag: [],
    NotificationChannel: _json,
    SegmentTypes: _json,
    Video: _json
  });
};
var se_StartShotDetectionFilter = (input, context) => {
  return take(input, {
    MinSegmentConfidence: serializeFloat
  });
};
var se_StartTechnicalCueDetectionFilter = (input, context) => {
  return take(input, {
    BlackFrame: (_) => se_BlackFrame(_, context),
    MinSegmentConfidence: serializeFloat
  });
};
var se_StartTextDetectionFilters = (input, context) => {
  return take(input, {
    RegionsOfInterest: (_) => se_RegionsOfInterest(_, context),
    WordFilter: (_) => se_DetectionFilter(_, context)
  });
};
var se_StartTextDetectionRequest = (input, context) => {
  return take(input, {
    ClientRequestToken: [],
    Filters: (_) => se_StartTextDetectionFilters(_, context),
    JobTag: [],
    NotificationChannel: _json,
    Video: _json
  });
};
var se_StreamProcessorSettings = (input, context) => {
  return take(input, {
    ConnectedHome: (_) => se_ConnectedHomeSettings(_, context),
    FaceSearch: (_) => se_FaceSearchSettings(_, context)
  });
};
var se_StreamProcessorSettingsForUpdate = (input, context) => {
  return take(input, {
    ConnectedHomeForUpdate: (_) => se_ConnectedHomeSettingsForUpdate(_, context)
  });
};
var se_UpdateDatasetEntriesRequest = (input, context) => {
  return take(input, {
    Changes: (_) => se_DatasetChanges(_, context),
    DatasetArn: []
  });
};
var se_UpdateStreamProcessorRequest = (input, context) => {
  return take(input, {
    DataSharingPreferenceForUpdate: _json,
    Name: [],
    ParametersToDelete: _json,
    RegionsOfInterestForUpdate: (_) => se_RegionsOfInterest(_, context),
    SettingsForUpdate: (_) => se_StreamProcessorSettingsForUpdate(_, context)
  });
};
var de_AssociateFacesResponse = (output, context) => {
  return take(output, {
    AssociatedFaces: _json,
    UnsuccessfulFaceAssociations: (_) => de_UnsuccessfulFaceAssociationList(_, context),
    UserStatus: expectString
  });
};
var de_AuditImage = (output, context) => {
  return take(output, {
    BoundingBox: (_) => de_BoundingBox(_, context),
    Bytes: context.base64Decoder,
    S3Object: _json
  });
};
var de_AuditImages = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_AuditImage(entry, context);
  });
  return retVal;
};
var de_Beard = (output, context) => {
  return take(output, {
    Confidence: limitedParseFloat32,
    Value: expectBoolean
  });
};
var de_BodyParts = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ProtectiveEquipmentBodyPart(entry, context);
  });
  return retVal;
};
var de_BoundingBox = (output, context) => {
  return take(output, {
    Height: limitedParseFloat32,
    Left: limitedParseFloat32,
    Top: limitedParseFloat32,
    Width: limitedParseFloat32
  });
};
var de_Celebrity = (output, context) => {
  return take(output, {
    Face: (_) => de_ComparedFace(_, context),
    Id: expectString,
    KnownGender: _json,
    MatchConfidence: limitedParseFloat32,
    Name: expectString,
    Urls: _json
  });
};
var de_CelebrityDetail = (output, context) => {
  return take(output, {
    BoundingBox: (_) => de_BoundingBox(_, context),
    Confidence: limitedParseFloat32,
    Face: (_) => de_FaceDetail(_, context),
    Id: expectString,
    KnownGender: _json,
    Name: expectString,
    Urls: _json
  });
};
var de_CelebrityList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_Celebrity(entry, context);
  });
  return retVal;
};
var de_CelebrityRecognition = (output, context) => {
  return take(output, {
    Celebrity: (_) => de_CelebrityDetail(_, context),
    Timestamp: expectLong
  });
};
var de_CelebrityRecognitions = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_CelebrityRecognition(entry, context);
  });
  return retVal;
};
var de_ComparedFace = (output, context) => {
  return take(output, {
    BoundingBox: (_) => de_BoundingBox(_, context),
    Confidence: limitedParseFloat32,
    Emotions: (_) => de_Emotions(_, context),
    Landmarks: (_) => de_Landmarks(_, context),
    Pose: (_) => de_Pose(_, context),
    Quality: (_) => de_ImageQuality(_, context),
    Smile: (_) => de_Smile(_, context)
  });
};
var de_ComparedFaceList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ComparedFace(entry, context);
  });
  return retVal;
};
var de_ComparedSourceImageFace = (output, context) => {
  return take(output, {
    BoundingBox: (_) => de_BoundingBox(_, context),
    Confidence: limitedParseFloat32
  });
};
var de_CompareFacesMatch = (output, context) => {
  return take(output, {
    Face: (_) => de_ComparedFace(_, context),
    Similarity: limitedParseFloat32
  });
};
var de_CompareFacesMatchList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_CompareFacesMatch(entry, context);
  });
  return retVal;
};
var de_CompareFacesResponse = (output, context) => {
  return take(output, {
    FaceMatches: (_) => de_CompareFacesMatchList(_, context),
    SourceImageFace: (_) => de_ComparedSourceImageFace(_, context),
    SourceImageOrientationCorrection: expectString,
    TargetImageOrientationCorrection: expectString,
    UnmatchedFaces: (_) => de_CompareFacesUnmatchList(_, context)
  });
};
var de_CompareFacesUnmatchList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ComparedFace(entry, context);
  });
  return retVal;
};
var de_ConnectedHomeSettings = (output, context) => {
  return take(output, {
    Labels: _json,
    MinConfidence: limitedParseFloat32
  });
};
var de_ContentModerationDetection = (output, context) => {
  return take(output, {
    ContentTypes: (_) => de_ContentTypes(_, context),
    DurationMillis: expectLong,
    EndTimestampMillis: expectLong,
    ModerationLabel: (_) => de_ModerationLabel(_, context),
    StartTimestampMillis: expectLong,
    Timestamp: expectLong
  });
};
var de_ContentModerationDetections = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ContentModerationDetection(entry, context);
  });
  return retVal;
};
var de_ContentType = (output, context) => {
  return take(output, {
    Confidence: limitedParseFloat32,
    Name: expectString
  });
};
var de_ContentTypes = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ContentType(entry, context);
  });
  return retVal;
};
var de_CoversBodyPart = (output, context) => {
  return take(output, {
    Confidence: limitedParseFloat32,
    Value: expectBoolean
  });
};
var de_CustomizationFeatureConfig = (output, context) => {
  return take(output, {
    ContentModeration: (_) => de_CustomizationFeatureContentModerationConfig(_, context)
  });
};
var de_CustomizationFeatureContentModerationConfig = (output, context) => {
  return take(output, {
    ConfidenceThreshold: limitedParseFloat32
  });
};
var de_CustomLabel = (output, context) => {
  return take(output, {
    Confidence: limitedParseFloat32,
    Geometry: (_) => de_Geometry(_, context),
    Name: expectString
  });
};
var de_CustomLabels = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_CustomLabel(entry, context);
  });
  return retVal;
};
var de_DatasetDescription = (output, context) => {
  return take(output, {
    CreationTimestamp: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    DatasetStats: _json,
    LastUpdatedTimestamp: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    Status: expectString,
    StatusMessage: expectString,
    StatusMessageCode: expectString
  });
};
var de_DatasetMetadata = (output, context) => {
  return take(output, {
    CreationTimestamp: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    DatasetArn: expectString,
    DatasetType: expectString,
    Status: expectString,
    StatusMessage: expectString,
    StatusMessageCode: expectString
  });
};
var de_DatasetMetadataList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_DatasetMetadata(entry, context);
  });
  return retVal;
};
var de_DescribeCollectionResponse = (output, context) => {
  return take(output, {
    CollectionARN: expectString,
    CreationTimestamp: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    FaceCount: expectLong,
    FaceModelVersion: expectString,
    UserCount: expectLong
  });
};
var de_DescribeDatasetResponse = (output, context) => {
  return take(output, {
    DatasetDescription: (_) => de_DatasetDescription(_, context)
  });
};
var de_DescribeProjectsResponse = (output, context) => {
  return take(output, {
    NextToken: expectString,
    ProjectDescriptions: (_) => de_ProjectDescriptions(_, context)
  });
};
var de_DescribeProjectVersionsResponse = (output, context) => {
  return take(output, {
    NextToken: expectString,
    ProjectVersionDescriptions: (_) => de_ProjectVersionDescriptions(_, context)
  });
};
var de_DescribeStreamProcessorResponse = (output, context) => {
  return take(output, {
    CreationTimestamp: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    DataSharingPreference: _json,
    Input: _json,
    KmsKeyId: expectString,
    LastUpdateTimestamp: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    Name: expectString,
    NotificationChannel: _json,
    Output: _json,
    RegionsOfInterest: (_) => de_RegionsOfInterest(_, context),
    RoleArn: expectString,
    Settings: (_) => de_StreamProcessorSettings(_, context),
    Status: expectString,
    StatusMessage: expectString,
    StreamProcessorArn: expectString
  });
};
var de_DetectCustomLabelsResponse = (output, context) => {
  return take(output, {
    CustomLabels: (_) => de_CustomLabels(_, context)
  });
};
var de_DetectFacesResponse = (output, context) => {
  return take(output, {
    FaceDetails: (_) => de_FaceDetailList(_, context),
    OrientationCorrection: expectString
  });
};
var de_DetectLabelsImageBackground = (output, context) => {
  return take(output, {
    DominantColors: (_) => de_DominantColors(_, context),
    Quality: (_) => de_DetectLabelsImageQuality(_, context)
  });
};
var de_DetectLabelsImageForeground = (output, context) => {
  return take(output, {
    DominantColors: (_) => de_DominantColors(_, context),
    Quality: (_) => de_DetectLabelsImageQuality(_, context)
  });
};
var de_DetectLabelsImageProperties = (output, context) => {
  return take(output, {
    Background: (_) => de_DetectLabelsImageBackground(_, context),
    DominantColors: (_) => de_DominantColors(_, context),
    Foreground: (_) => de_DetectLabelsImageForeground(_, context),
    Quality: (_) => de_DetectLabelsImageQuality(_, context)
  });
};
var de_DetectLabelsImageQuality = (output, context) => {
  return take(output, {
    Brightness: limitedParseFloat32,
    Contrast: limitedParseFloat32,
    Sharpness: limitedParseFloat32
  });
};
var de_DetectLabelsResponse = (output, context) => {
  return take(output, {
    ImageProperties: (_) => de_DetectLabelsImageProperties(_, context),
    LabelModelVersion: expectString,
    Labels: (_) => de_Labels(_, context),
    OrientationCorrection: expectString
  });
};
var de_DetectModerationLabelsResponse = (output, context) => {
  return take(output, {
    ContentTypes: (_) => de_ContentTypes(_, context),
    HumanLoopActivationOutput: (_) => de_HumanLoopActivationOutput(_, context),
    ModerationLabels: (_) => de_ModerationLabels(_, context),
    ModerationModelVersion: expectString,
    ProjectVersion: expectString
  });
};
var de_DetectProtectiveEquipmentResponse = (output, context) => {
  return take(output, {
    Persons: (_) => de_ProtectiveEquipmentPersons(_, context),
    ProtectiveEquipmentModelVersion: expectString,
    Summary: _json
  });
};
var de_DetectTextResponse = (output, context) => {
  return take(output, {
    TextDetections: (_) => de_TextDetectionList(_, context),
    TextModelVersion: expectString
  });
};
var de_DominantColor = (output, context) => {
  return take(output, {
    Blue: expectInt32,
    CSSColor: expectString,
    Green: expectInt32,
    HexCode: expectString,
    PixelPercent: limitedParseFloat32,
    Red: expectInt32,
    SimplifiedColor: expectString
  });
};
var de_DominantColors = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_DominantColor(entry, context);
  });
  return retVal;
};
var de_Emotion = (output, context) => {
  return take(output, {
    Confidence: limitedParseFloat32,
    Type: expectString
  });
};
var de_Emotions = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_Emotion(entry, context);
  });
  return retVal;
};
var de_EquipmentDetection = (output, context) => {
  return take(output, {
    BoundingBox: (_) => de_BoundingBox(_, context),
    Confidence: limitedParseFloat32,
    CoversBodyPart: (_) => de_CoversBodyPart(_, context),
    Type: expectString
  });
};
var de_EquipmentDetections = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_EquipmentDetection(entry, context);
  });
  return retVal;
};
var de_EvaluationResult = (output, context) => {
  return take(output, {
    F1Score: limitedParseFloat32,
    Summary: _json
  });
};
var de_EyeDirection = (output, context) => {
  return take(output, {
    Confidence: limitedParseFloat32,
    Pitch: limitedParseFloat32,
    Yaw: limitedParseFloat32
  });
};
var de_Eyeglasses = (output, context) => {
  return take(output, {
    Confidence: limitedParseFloat32,
    Value: expectBoolean
  });
};
var de_EyeOpen = (output, context) => {
  return take(output, {
    Confidence: limitedParseFloat32,
    Value: expectBoolean
  });
};
var de_Face = (output, context) => {
  return take(output, {
    BoundingBox: (_) => de_BoundingBox(_, context),
    Confidence: limitedParseFloat32,
    ExternalImageId: expectString,
    FaceId: expectString,
    ImageId: expectString,
    IndexFacesModelVersion: expectString,
    UserId: expectString
  });
};
var de_FaceDetail = (output, context) => {
  return take(output, {
    AgeRange: _json,
    Beard: (_) => de_Beard(_, context),
    BoundingBox: (_) => de_BoundingBox(_, context),
    Confidence: limitedParseFloat32,
    Emotions: (_) => de_Emotions(_, context),
    EyeDirection: (_) => de_EyeDirection(_, context),
    Eyeglasses: (_) => de_Eyeglasses(_, context),
    EyesOpen: (_) => de_EyeOpen(_, context),
    FaceOccluded: (_) => de_FaceOccluded(_, context),
    Gender: (_) => de_Gender(_, context),
    Landmarks: (_) => de_Landmarks(_, context),
    MouthOpen: (_) => de_MouthOpen(_, context),
    Mustache: (_) => de_Mustache(_, context),
    Pose: (_) => de_Pose(_, context),
    Quality: (_) => de_ImageQuality(_, context),
    Smile: (_) => de_Smile(_, context),
    Sunglasses: (_) => de_Sunglasses(_, context)
  });
};
var de_FaceDetailList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_FaceDetail(entry, context);
  });
  return retVal;
};
var de_FaceDetection = (output, context) => {
  return take(output, {
    Face: (_) => de_FaceDetail(_, context),
    Timestamp: expectLong
  });
};
var de_FaceDetections = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_FaceDetection(entry, context);
  });
  return retVal;
};
var de_FaceList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_Face(entry, context);
  });
  return retVal;
};
var de_FaceMatch = (output, context) => {
  return take(output, {
    Face: (_) => de_Face(_, context),
    Similarity: limitedParseFloat32
  });
};
var de_FaceMatchList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_FaceMatch(entry, context);
  });
  return retVal;
};
var de_FaceOccluded = (output, context) => {
  return take(output, {
    Confidence: limitedParseFloat32,
    Value: expectBoolean
  });
};
var de_FaceRecord = (output, context) => {
  return take(output, {
    Face: (_) => de_Face(_, context),
    FaceDetail: (_) => de_FaceDetail(_, context)
  });
};
var de_FaceRecordList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_FaceRecord(entry, context);
  });
  return retVal;
};
var de_FaceSearchSettings = (output, context) => {
  return take(output, {
    CollectionId: expectString,
    FaceMatchThreshold: limitedParseFloat32
  });
};
var de_Gender = (output, context) => {
  return take(output, {
    Confidence: limitedParseFloat32,
    Value: expectString
  });
};
var de_Geometry = (output, context) => {
  return take(output, {
    BoundingBox: (_) => de_BoundingBox(_, context),
    Polygon: (_) => de_Polygon(_, context)
  });
};
var de_GetCelebrityRecognitionResponse = (output, context) => {
  return take(output, {
    Celebrities: (_) => de_CelebrityRecognitions(_, context),
    JobId: expectString,
    JobStatus: expectString,
    JobTag: expectString,
    NextToken: expectString,
    StatusMessage: expectString,
    Video: _json,
    VideoMetadata: (_) => de_VideoMetadata(_, context)
  });
};
var de_GetContentModerationResponse = (output, context) => {
  return take(output, {
    GetRequestMetadata: _json,
    JobId: expectString,
    JobStatus: expectString,
    JobTag: expectString,
    ModerationLabels: (_) => de_ContentModerationDetections(_, context),
    ModerationModelVersion: expectString,
    NextToken: expectString,
    StatusMessage: expectString,
    Video: _json,
    VideoMetadata: (_) => de_VideoMetadata(_, context)
  });
};
var de_GetFaceDetectionResponse = (output, context) => {
  return take(output, {
    Faces: (_) => de_FaceDetections(_, context),
    JobId: expectString,
    JobStatus: expectString,
    JobTag: expectString,
    NextToken: expectString,
    StatusMessage: expectString,
    Video: _json,
    VideoMetadata: (_) => de_VideoMetadata(_, context)
  });
};
var de_GetFaceLivenessSessionResultsResponse = (output, context) => {
  return take(output, {
    AuditImages: (_) => de_AuditImages(_, context),
    Confidence: limitedParseFloat32,
    ReferenceImage: (_) => de_AuditImage(_, context),
    SessionId: expectString,
    Status: expectString
  });
};
var de_GetFaceSearchResponse = (output, context) => {
  return take(output, {
    JobId: expectString,
    JobStatus: expectString,
    JobTag: expectString,
    NextToken: expectString,
    Persons: (_) => de_PersonMatches(_, context),
    StatusMessage: expectString,
    Video: _json,
    VideoMetadata: (_) => de_VideoMetadata(_, context)
  });
};
var de_GetLabelDetectionResponse = (output, context) => {
  return take(output, {
    GetRequestMetadata: _json,
    JobId: expectString,
    JobStatus: expectString,
    JobTag: expectString,
    LabelModelVersion: expectString,
    Labels: (_) => de_LabelDetections(_, context),
    NextToken: expectString,
    StatusMessage: expectString,
    Video: _json,
    VideoMetadata: (_) => de_VideoMetadata(_, context)
  });
};
var de_GetMediaAnalysisJobResponse = (output, context) => {
  return take(output, {
    CompletionTimestamp: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    CreationTimestamp: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    FailureDetails: _json,
    Input: _json,
    JobId: expectString,
    JobName: expectString,
    KmsKeyId: expectString,
    ManifestSummary: _json,
    OperationsConfig: (_) => de_MediaAnalysisOperationsConfig(_, context),
    OutputConfig: _json,
    Results: _json,
    Status: expectString
  });
};
var de_GetPersonTrackingResponse = (output, context) => {
  return take(output, {
    JobId: expectString,
    JobStatus: expectString,
    JobTag: expectString,
    NextToken: expectString,
    Persons: (_) => de_PersonDetections(_, context),
    StatusMessage: expectString,
    Video: _json,
    VideoMetadata: (_) => de_VideoMetadata(_, context)
  });
};
var de_GetSegmentDetectionResponse = (output, context) => {
  return take(output, {
    AudioMetadata: _json,
    JobId: expectString,
    JobStatus: expectString,
    JobTag: expectString,
    NextToken: expectString,
    Segments: (_) => de_SegmentDetections(_, context),
    SelectedSegmentTypes: _json,
    StatusMessage: expectString,
    Video: _json,
    VideoMetadata: (_) => de_VideoMetadataList(_, context)
  });
};
var de_GetTextDetectionResponse = (output, context) => {
  return take(output, {
    JobId: expectString,
    JobStatus: expectString,
    JobTag: expectString,
    NextToken: expectString,
    StatusMessage: expectString,
    TextDetections: (_) => de_TextDetectionResults(_, context),
    TextModelVersion: expectString,
    Video: _json,
    VideoMetadata: (_) => de_VideoMetadata(_, context)
  });
};
var de_HumanLoopActivationOutput = (output, context) => {
  return take(output, {
    HumanLoopActivationConditionsEvaluationResults: LazyJsonString.from,
    HumanLoopActivationReasons: _json,
    HumanLoopArn: expectString
  });
};
var de_ImageQuality = (output, context) => {
  return take(output, {
    Brightness: limitedParseFloat32,
    Sharpness: limitedParseFloat32
  });
};
var de_IndexFacesResponse = (output, context) => {
  return take(output, {
    FaceModelVersion: expectString,
    FaceRecords: (_) => de_FaceRecordList(_, context),
    OrientationCorrection: expectString,
    UnindexedFaces: (_) => de_UnindexedFaces(_, context)
  });
};
var de_Instance = (output, context) => {
  return take(output, {
    BoundingBox: (_) => de_BoundingBox(_, context),
    Confidence: limitedParseFloat32,
    DominantColors: (_) => de_DominantColors(_, context)
  });
};
var de_Instances = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_Instance(entry, context);
  });
  return retVal;
};
var de_Label = (output, context) => {
  return take(output, {
    Aliases: _json,
    Categories: _json,
    Confidence: limitedParseFloat32,
    Instances: (_) => de_Instances(_, context),
    Name: expectString,
    Parents: _json
  });
};
var de_LabelDetection = (output, context) => {
  return take(output, {
    DurationMillis: expectLong,
    EndTimestampMillis: expectLong,
    Label: (_) => de_Label(_, context),
    StartTimestampMillis: expectLong,
    Timestamp: expectLong
  });
};
var de_LabelDetections = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_LabelDetection(entry, context);
  });
  return retVal;
};
var de_Labels = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_Label(entry, context);
  });
  return retVal;
};
var de_Landmark = (output, context) => {
  return take(output, {
    Type: expectString,
    X: limitedParseFloat32,
    Y: limitedParseFloat32
  });
};
var de_Landmarks = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_Landmark(entry, context);
  });
  return retVal;
};
var de_ListFacesResponse = (output, context) => {
  return take(output, {
    FaceModelVersion: expectString,
    Faces: (_) => de_FaceList(_, context),
    NextToken: expectString
  });
};
var de_ListMediaAnalysisJobsResponse = (output, context) => {
  return take(output, {
    MediaAnalysisJobs: (_) => de_MediaAnalysisJobDescriptions(_, context),
    NextToken: expectString
  });
};
var de_ListProjectPoliciesResponse = (output, context) => {
  return take(output, {
    NextToken: expectString,
    ProjectPolicies: (_) => de_ProjectPolicies(_, context)
  });
};
var de_MediaAnalysisDetectModerationLabelsConfig = (output, context) => {
  return take(output, {
    MinConfidence: limitedParseFloat32,
    ProjectVersion: expectString
  });
};
var de_MediaAnalysisJobDescription = (output, context) => {
  return take(output, {
    CompletionTimestamp: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    CreationTimestamp: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    FailureDetails: _json,
    Input: _json,
    JobId: expectString,
    JobName: expectString,
    KmsKeyId: expectString,
    ManifestSummary: _json,
    OperationsConfig: (_) => de_MediaAnalysisOperationsConfig(_, context),
    OutputConfig: _json,
    Results: _json,
    Status: expectString
  });
};
var de_MediaAnalysisJobDescriptions = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_MediaAnalysisJobDescription(entry, context);
  });
  return retVal;
};
var de_MediaAnalysisOperationsConfig = (output, context) => {
  return take(output, {
    DetectModerationLabels: (_) => de_MediaAnalysisDetectModerationLabelsConfig(_, context)
  });
};
var de_ModerationLabel = (output, context) => {
  return take(output, {
    Confidence: limitedParseFloat32,
    Name: expectString,
    ParentName: expectString,
    TaxonomyLevel: expectInt32
  });
};
var de_ModerationLabels = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ModerationLabel(entry, context);
  });
  return retVal;
};
var de_MouthOpen = (output, context) => {
  return take(output, {
    Confidence: limitedParseFloat32,
    Value: expectBoolean
  });
};
var de_Mustache = (output, context) => {
  return take(output, {
    Confidence: limitedParseFloat32,
    Value: expectBoolean
  });
};
var de_PersonDetail = (output, context) => {
  return take(output, {
    BoundingBox: (_) => de_BoundingBox(_, context),
    Face: (_) => de_FaceDetail(_, context),
    Index: expectLong
  });
};
var de_PersonDetection = (output, context) => {
  return take(output, {
    Person: (_) => de_PersonDetail(_, context),
    Timestamp: expectLong
  });
};
var de_PersonDetections = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_PersonDetection(entry, context);
  });
  return retVal;
};
var de_PersonMatch = (output, context) => {
  return take(output, {
    FaceMatches: (_) => de_FaceMatchList(_, context),
    Person: (_) => de_PersonDetail(_, context),
    Timestamp: expectLong
  });
};
var de_PersonMatches = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_PersonMatch(entry, context);
  });
  return retVal;
};
var de_Point = (output, context) => {
  return take(output, {
    X: limitedParseFloat32,
    Y: limitedParseFloat32
  });
};
var de_Polygon = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_Point(entry, context);
  });
  return retVal;
};
var de_Pose = (output, context) => {
  return take(output, {
    Pitch: limitedParseFloat32,
    Roll: limitedParseFloat32,
    Yaw: limitedParseFloat32
  });
};
var de_ProjectDescription = (output, context) => {
  return take(output, {
    AutoUpdate: expectString,
    CreationTimestamp: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    Datasets: (_) => de_DatasetMetadataList(_, context),
    Feature: expectString,
    ProjectArn: expectString,
    Status: expectString
  });
};
var de_ProjectDescriptions = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ProjectDescription(entry, context);
  });
  return retVal;
};
var de_ProjectPolicies = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ProjectPolicy(entry, context);
  });
  return retVal;
};
var de_ProjectPolicy = (output, context) => {
  return take(output, {
    CreationTimestamp: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    LastUpdatedTimestamp: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    PolicyDocument: expectString,
    PolicyName: expectString,
    PolicyRevisionId: expectString,
    ProjectArn: expectString
  });
};
var de_ProjectVersionDescription = (output, context) => {
  return take(output, {
    BaseModelVersion: expectString,
    BillableTrainingTimeInSeconds: expectLong,
    CreationTimestamp: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    EvaluationResult: (_) => de_EvaluationResult(_, context),
    Feature: expectString,
    FeatureConfig: (_) => de_CustomizationFeatureConfig(_, context),
    KmsKeyId: expectString,
    ManifestSummary: _json,
    MaxInferenceUnits: expectInt32,
    MinInferenceUnits: expectInt32,
    OutputConfig: _json,
    ProjectVersionArn: expectString,
    SourceProjectVersionArn: expectString,
    Status: expectString,
    StatusMessage: expectString,
    TestingDataResult: _json,
    TrainingDataResult: _json,
    TrainingEndTimestamp: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    VersionDescription: expectString
  });
};
var de_ProjectVersionDescriptions = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ProjectVersionDescription(entry, context);
  });
  return retVal;
};
var de_ProtectiveEquipmentBodyPart = (output, context) => {
  return take(output, {
    Confidence: limitedParseFloat32,
    EquipmentDetections: (_) => de_EquipmentDetections(_, context),
    Name: expectString
  });
};
var de_ProtectiveEquipmentPerson = (output, context) => {
  return take(output, {
    BodyParts: (_) => de_BodyParts(_, context),
    BoundingBox: (_) => de_BoundingBox(_, context),
    Confidence: limitedParseFloat32,
    Id: expectInt32
  });
};
var de_ProtectiveEquipmentPersons = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ProtectiveEquipmentPerson(entry, context);
  });
  return retVal;
};
var de_RecognizeCelebritiesResponse = (output, context) => {
  return take(output, {
    CelebrityFaces: (_) => de_CelebrityList(_, context),
    OrientationCorrection: expectString,
    UnrecognizedFaces: (_) => de_ComparedFaceList(_, context)
  });
};
var de_RegionOfInterest = (output, context) => {
  return take(output, {
    BoundingBox: (_) => de_BoundingBox(_, context),
    Polygon: (_) => de_Polygon(_, context)
  });
};
var de_RegionsOfInterest = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_RegionOfInterest(entry, context);
  });
  return retVal;
};
var de_SearchedFaceDetails = (output, context) => {
  return take(output, {
    FaceDetail: (_) => de_FaceDetail(_, context)
  });
};
var de_SearchFacesByImageResponse = (output, context) => {
  return take(output, {
    FaceMatches: (_) => de_FaceMatchList(_, context),
    FaceModelVersion: expectString,
    SearchedFaceBoundingBox: (_) => de_BoundingBox(_, context),
    SearchedFaceConfidence: limitedParseFloat32
  });
};
var de_SearchFacesResponse = (output, context) => {
  return take(output, {
    FaceMatches: (_) => de_FaceMatchList(_, context),
    FaceModelVersion: expectString,
    SearchedFaceId: expectString
  });
};
var de_SearchUsersByImageResponse = (output, context) => {
  return take(output, {
    FaceModelVersion: expectString,
    SearchedFace: (_) => de_SearchedFaceDetails(_, context),
    UnsearchedFaces: (_) => de_UnsearchedFacesList(_, context),
    UserMatches: (_) => de_UserMatchList(_, context)
  });
};
var de_SearchUsersResponse = (output, context) => {
  return take(output, {
    FaceModelVersion: expectString,
    SearchedFace: _json,
    SearchedUser: _json,
    UserMatches: (_) => de_UserMatchList(_, context)
  });
};
var de_SegmentDetection = (output, context) => {
  return take(output, {
    DurationFrames: expectLong,
    DurationMillis: expectLong,
    DurationSMPTE: expectString,
    EndFrameNumber: expectLong,
    EndTimecodeSMPTE: expectString,
    EndTimestampMillis: expectLong,
    ShotSegment: (_) => de_ShotSegment(_, context),
    StartFrameNumber: expectLong,
    StartTimecodeSMPTE: expectString,
    StartTimestampMillis: expectLong,
    TechnicalCueSegment: (_) => de_TechnicalCueSegment(_, context),
    Type: expectString
  });
};
var de_SegmentDetections = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_SegmentDetection(entry, context);
  });
  return retVal;
};
var de_ShotSegment = (output, context) => {
  return take(output, {
    Confidence: limitedParseFloat32,
    Index: expectLong
  });
};
var de_Smile = (output, context) => {
  return take(output, {
    Confidence: limitedParseFloat32,
    Value: expectBoolean
  });
};
var de_StreamProcessorSettings = (output, context) => {
  return take(output, {
    ConnectedHome: (_) => de_ConnectedHomeSettings(_, context),
    FaceSearch: (_) => de_FaceSearchSettings(_, context)
  });
};
var de_Sunglasses = (output, context) => {
  return take(output, {
    Confidence: limitedParseFloat32,
    Value: expectBoolean
  });
};
var de_TechnicalCueSegment = (output, context) => {
  return take(output, {
    Confidence: limitedParseFloat32,
    Type: expectString
  });
};
var de_TextDetection = (output, context) => {
  return take(output, {
    Confidence: limitedParseFloat32,
    DetectedText: expectString,
    Geometry: (_) => de_Geometry(_, context),
    Id: expectInt32,
    ParentId: expectInt32,
    Type: expectString
  });
};
var de_TextDetectionList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_TextDetection(entry, context);
  });
  return retVal;
};
var de_TextDetectionResult = (output, context) => {
  return take(output, {
    TextDetection: (_) => de_TextDetection(_, context),
    Timestamp: expectLong
  });
};
var de_TextDetectionResults = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_TextDetectionResult(entry, context);
  });
  return retVal;
};
var de_UnindexedFace = (output, context) => {
  return take(output, {
    FaceDetail: (_) => de_FaceDetail(_, context),
    Reasons: _json
  });
};
var de_UnindexedFaces = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_UnindexedFace(entry, context);
  });
  return retVal;
};
var de_UnsearchedFace = (output, context) => {
  return take(output, {
    FaceDetails: (_) => de_FaceDetail(_, context),
    Reasons: _json
  });
};
var de_UnsearchedFacesList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_UnsearchedFace(entry, context);
  });
  return retVal;
};
var de_UnsuccessfulFaceAssociation = (output, context) => {
  return take(output, {
    Confidence: limitedParseFloat32,
    FaceId: expectString,
    Reasons: _json,
    UserId: expectString
  });
};
var de_UnsuccessfulFaceAssociationList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_UnsuccessfulFaceAssociation(entry, context);
  });
  return retVal;
};
var de_UserMatch = (output, context) => {
  return take(output, {
    Similarity: limitedParseFloat32,
    User: _json
  });
};
var de_UserMatchList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_UserMatch(entry, context);
  });
  return retVal;
};
var de_VideoMetadata = (output, context) => {
  return take(output, {
    Codec: expectString,
    ColorRange: expectString,
    DurationMillis: expectLong,
    Format: expectString,
    FrameHeight: expectLong,
    FrameRate: limitedParseFloat32,
    FrameWidth: expectLong
  });
};
var de_VideoMetadataList = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_VideoMetadata(entry, context);
  });
  return retVal;
};
var deserializeMetadata = (output) => ({
  httpStatusCode: output.statusCode,
  requestId: output.headers["x-amzn-requestid"] ?? output.headers["x-amzn-request-id"] ?? output.headers["x-amz-request-id"],
  extendedRequestId: output.headers["x-amz-id-2"],
  cfId: output.headers["x-amz-cf-id"]
});
var throwDefaultError = withBaseException(RekognitionServiceException);
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
    "content-type": "application/x-amz-json-1.1",
    "x-amz-target": `RekognitionService.${operation}`
  };
}

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/AssociateFacesCommand.js
var AssociateFacesCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "AssociateFaces", {}).n("RekognitionClient", "AssociateFacesCommand").f(void 0, void 0).ser(se_AssociateFacesCommand).de(de_AssociateFacesCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/CompareFacesCommand.js
var import_dist43 = __toESM(require_dist());
var import_dist44 = __toESM(require_dist2());
var import_dist45 = __toESM(require_dist3());
var CompareFacesCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "CompareFaces", {}).n("RekognitionClient", "CompareFacesCommand").f(void 0, void 0).ser(se_CompareFacesCommand).de(de_CompareFacesCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/CopyProjectVersionCommand.js
var import_dist46 = __toESM(require_dist());
var import_dist47 = __toESM(require_dist2());
var import_dist48 = __toESM(require_dist3());
var CopyProjectVersionCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "CopyProjectVersion", {}).n("RekognitionClient", "CopyProjectVersionCommand").f(void 0, void 0).ser(se_CopyProjectVersionCommand).de(de_CopyProjectVersionCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/CreateCollectionCommand.js
var import_dist49 = __toESM(require_dist());
var import_dist50 = __toESM(require_dist2());
var import_dist51 = __toESM(require_dist3());
var CreateCollectionCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "CreateCollection", {}).n("RekognitionClient", "CreateCollectionCommand").f(void 0, void 0).ser(se_CreateCollectionCommand).de(de_CreateCollectionCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/CreateDatasetCommand.js
var import_dist52 = __toESM(require_dist());
var import_dist53 = __toESM(require_dist2());
var import_dist54 = __toESM(require_dist3());
var CreateDatasetCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "CreateDataset", {}).n("RekognitionClient", "CreateDatasetCommand").f(void 0, void 0).ser(se_CreateDatasetCommand).de(de_CreateDatasetCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/CreateFaceLivenessSessionCommand.js
var import_dist55 = __toESM(require_dist());
var import_dist56 = __toESM(require_dist2());
var import_dist57 = __toESM(require_dist3());
var CreateFaceLivenessSessionCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "CreateFaceLivenessSession", {}).n("RekognitionClient", "CreateFaceLivenessSessionCommand").f(void 0, void 0).ser(se_CreateFaceLivenessSessionCommand).de(de_CreateFaceLivenessSessionCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/CreateProjectCommand.js
var import_dist58 = __toESM(require_dist());
var import_dist59 = __toESM(require_dist2());
var import_dist60 = __toESM(require_dist3());
var CreateProjectCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "CreateProject", {}).n("RekognitionClient", "CreateProjectCommand").f(void 0, void 0).ser(se_CreateProjectCommand).de(de_CreateProjectCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/CreateProjectVersionCommand.js
var import_dist61 = __toESM(require_dist());
var import_dist62 = __toESM(require_dist2());
var import_dist63 = __toESM(require_dist3());
var CreateProjectVersionCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "CreateProjectVersion", {}).n("RekognitionClient", "CreateProjectVersionCommand").f(void 0, void 0).ser(se_CreateProjectVersionCommand).de(de_CreateProjectVersionCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/CreateStreamProcessorCommand.js
var import_dist64 = __toESM(require_dist());
var import_dist65 = __toESM(require_dist2());
var import_dist66 = __toESM(require_dist3());
var CreateStreamProcessorCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "CreateStreamProcessor", {}).n("RekognitionClient", "CreateStreamProcessorCommand").f(void 0, void 0).ser(se_CreateStreamProcessorCommand).de(de_CreateStreamProcessorCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/CreateUserCommand.js
var import_dist67 = __toESM(require_dist());
var import_dist68 = __toESM(require_dist2());
var import_dist69 = __toESM(require_dist3());
var CreateUserCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "CreateUser", {}).n("RekognitionClient", "CreateUserCommand").f(void 0, void 0).ser(se_CreateUserCommand).de(de_CreateUserCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/DeleteCollectionCommand.js
var import_dist70 = __toESM(require_dist());
var import_dist71 = __toESM(require_dist2());
var import_dist72 = __toESM(require_dist3());
var DeleteCollectionCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "DeleteCollection", {}).n("RekognitionClient", "DeleteCollectionCommand").f(void 0, void 0).ser(se_DeleteCollectionCommand).de(de_DeleteCollectionCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/DeleteDatasetCommand.js
var import_dist73 = __toESM(require_dist());
var import_dist74 = __toESM(require_dist2());
var import_dist75 = __toESM(require_dist3());
var DeleteDatasetCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "DeleteDataset", {}).n("RekognitionClient", "DeleteDatasetCommand").f(void 0, void 0).ser(se_DeleteDatasetCommand).de(de_DeleteDatasetCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/DeleteFacesCommand.js
var import_dist76 = __toESM(require_dist());
var import_dist77 = __toESM(require_dist2());
var import_dist78 = __toESM(require_dist3());
var DeleteFacesCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "DeleteFaces", {}).n("RekognitionClient", "DeleteFacesCommand").f(void 0, void 0).ser(se_DeleteFacesCommand).de(de_DeleteFacesCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/DeleteProjectCommand.js
var import_dist79 = __toESM(require_dist());
var import_dist80 = __toESM(require_dist2());
var import_dist81 = __toESM(require_dist3());
var DeleteProjectCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "DeleteProject", {}).n("RekognitionClient", "DeleteProjectCommand").f(void 0, void 0).ser(se_DeleteProjectCommand).de(de_DeleteProjectCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/DeleteProjectPolicyCommand.js
var import_dist82 = __toESM(require_dist());
var import_dist83 = __toESM(require_dist2());
var import_dist84 = __toESM(require_dist3());
var DeleteProjectPolicyCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "DeleteProjectPolicy", {}).n("RekognitionClient", "DeleteProjectPolicyCommand").f(void 0, void 0).ser(se_DeleteProjectPolicyCommand).de(de_DeleteProjectPolicyCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/DeleteProjectVersionCommand.js
var import_dist85 = __toESM(require_dist());
var import_dist86 = __toESM(require_dist2());
var import_dist87 = __toESM(require_dist3());
var DeleteProjectVersionCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "DeleteProjectVersion", {}).n("RekognitionClient", "DeleteProjectVersionCommand").f(void 0, void 0).ser(se_DeleteProjectVersionCommand).de(de_DeleteProjectVersionCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/DeleteStreamProcessorCommand.js
var import_dist88 = __toESM(require_dist());
var import_dist89 = __toESM(require_dist2());
var import_dist90 = __toESM(require_dist3());
var DeleteStreamProcessorCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "DeleteStreamProcessor", {}).n("RekognitionClient", "DeleteStreamProcessorCommand").f(void 0, void 0).ser(se_DeleteStreamProcessorCommand).de(de_DeleteStreamProcessorCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/DeleteUserCommand.js
var import_dist91 = __toESM(require_dist());
var import_dist92 = __toESM(require_dist2());
var import_dist93 = __toESM(require_dist3());
var DeleteUserCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "DeleteUser", {}).n("RekognitionClient", "DeleteUserCommand").f(void 0, void 0).ser(se_DeleteUserCommand).de(de_DeleteUserCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/DescribeCollectionCommand.js
var import_dist94 = __toESM(require_dist());
var import_dist95 = __toESM(require_dist2());
var import_dist96 = __toESM(require_dist3());
var DescribeCollectionCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "DescribeCollection", {}).n("RekognitionClient", "DescribeCollectionCommand").f(void 0, void 0).ser(se_DescribeCollectionCommand).de(de_DescribeCollectionCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/DescribeDatasetCommand.js
var import_dist97 = __toESM(require_dist());
var import_dist98 = __toESM(require_dist2());
var import_dist99 = __toESM(require_dist3());
var DescribeDatasetCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "DescribeDataset", {}).n("RekognitionClient", "DescribeDatasetCommand").f(void 0, void 0).ser(se_DescribeDatasetCommand).de(de_DescribeDatasetCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/DescribeProjectsCommand.js
var import_dist100 = __toESM(require_dist());
var import_dist101 = __toESM(require_dist2());
var import_dist102 = __toESM(require_dist3());
var DescribeProjectsCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "DescribeProjects", {}).n("RekognitionClient", "DescribeProjectsCommand").f(void 0, void 0).ser(se_DescribeProjectsCommand).de(de_DescribeProjectsCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/DescribeProjectVersionsCommand.js
var import_dist103 = __toESM(require_dist());
var import_dist104 = __toESM(require_dist2());
var import_dist105 = __toESM(require_dist3());
var DescribeProjectVersionsCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "DescribeProjectVersions", {}).n("RekognitionClient", "DescribeProjectVersionsCommand").f(void 0, void 0).ser(se_DescribeProjectVersionsCommand).de(de_DescribeProjectVersionsCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/DescribeStreamProcessorCommand.js
var import_dist106 = __toESM(require_dist());
var import_dist107 = __toESM(require_dist2());
var import_dist108 = __toESM(require_dist3());
var DescribeStreamProcessorCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "DescribeStreamProcessor", {}).n("RekognitionClient", "DescribeStreamProcessorCommand").f(void 0, void 0).ser(se_DescribeStreamProcessorCommand).de(de_DescribeStreamProcessorCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/DetectCustomLabelsCommand.js
var import_dist109 = __toESM(require_dist());
var import_dist110 = __toESM(require_dist2());
var import_dist111 = __toESM(require_dist3());
var DetectCustomLabelsCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "DetectCustomLabels", {}).n("RekognitionClient", "DetectCustomLabelsCommand").f(void 0, void 0).ser(se_DetectCustomLabelsCommand).de(de_DetectCustomLabelsCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/DetectFacesCommand.js
var import_dist112 = __toESM(require_dist());
var import_dist113 = __toESM(require_dist2());
var import_dist114 = __toESM(require_dist3());
var DetectFacesCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "DetectFaces", {}).n("RekognitionClient", "DetectFacesCommand").f(void 0, void 0).ser(se_DetectFacesCommand).de(de_DetectFacesCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/DetectLabelsCommand.js
var import_dist115 = __toESM(require_dist());
var import_dist116 = __toESM(require_dist2());
var import_dist117 = __toESM(require_dist3());
var DetectLabelsCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "DetectLabels", {}).n("RekognitionClient", "DetectLabelsCommand").f(void 0, void 0).ser(se_DetectLabelsCommand).de(de_DetectLabelsCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/DetectModerationLabelsCommand.js
var import_dist118 = __toESM(require_dist());
var import_dist119 = __toESM(require_dist2());
var import_dist120 = __toESM(require_dist3());
var DetectModerationLabelsCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "DetectModerationLabels", {}).n("RekognitionClient", "DetectModerationLabelsCommand").f(void 0, void 0).ser(se_DetectModerationLabelsCommand).de(de_DetectModerationLabelsCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/DetectProtectiveEquipmentCommand.js
var import_dist121 = __toESM(require_dist());
var import_dist122 = __toESM(require_dist2());
var import_dist123 = __toESM(require_dist3());
var DetectProtectiveEquipmentCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "DetectProtectiveEquipment", {}).n("RekognitionClient", "DetectProtectiveEquipmentCommand").f(void 0, void 0).ser(se_DetectProtectiveEquipmentCommand).de(de_DetectProtectiveEquipmentCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/DetectTextCommand.js
var import_dist124 = __toESM(require_dist());
var import_dist125 = __toESM(require_dist2());
var import_dist126 = __toESM(require_dist3());
var DetectTextCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "DetectText", {}).n("RekognitionClient", "DetectTextCommand").f(void 0, void 0).ser(se_DetectTextCommand).de(de_DetectTextCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/DisassociateFacesCommand.js
var import_dist127 = __toESM(require_dist());
var import_dist128 = __toESM(require_dist2());
var import_dist129 = __toESM(require_dist3());
var DisassociateFacesCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "DisassociateFaces", {}).n("RekognitionClient", "DisassociateFacesCommand").f(void 0, void 0).ser(se_DisassociateFacesCommand).de(de_DisassociateFacesCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/DistributeDatasetEntriesCommand.js
var import_dist130 = __toESM(require_dist());
var import_dist131 = __toESM(require_dist2());
var import_dist132 = __toESM(require_dist3());
var DistributeDatasetEntriesCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "DistributeDatasetEntries", {}).n("RekognitionClient", "DistributeDatasetEntriesCommand").f(void 0, void 0).ser(se_DistributeDatasetEntriesCommand).de(de_DistributeDatasetEntriesCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/GetCelebrityInfoCommand.js
var import_dist133 = __toESM(require_dist());
var import_dist134 = __toESM(require_dist2());
var import_dist135 = __toESM(require_dist3());
var GetCelebrityInfoCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "GetCelebrityInfo", {}).n("RekognitionClient", "GetCelebrityInfoCommand").f(void 0, void 0).ser(se_GetCelebrityInfoCommand).de(de_GetCelebrityInfoCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/GetCelebrityRecognitionCommand.js
var import_dist136 = __toESM(require_dist());
var import_dist137 = __toESM(require_dist2());
var import_dist138 = __toESM(require_dist3());
var GetCelebrityRecognitionCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "GetCelebrityRecognition", {}).n("RekognitionClient", "GetCelebrityRecognitionCommand").f(void 0, void 0).ser(se_GetCelebrityRecognitionCommand).de(de_GetCelebrityRecognitionCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/GetContentModerationCommand.js
var import_dist139 = __toESM(require_dist());
var import_dist140 = __toESM(require_dist2());
var import_dist141 = __toESM(require_dist3());
var GetContentModerationCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "GetContentModeration", {}).n("RekognitionClient", "GetContentModerationCommand").f(void 0, void 0).ser(se_GetContentModerationCommand).de(de_GetContentModerationCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/GetFaceDetectionCommand.js
var import_dist142 = __toESM(require_dist());
var import_dist143 = __toESM(require_dist2());
var import_dist144 = __toESM(require_dist3());
var GetFaceDetectionCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "GetFaceDetection", {}).n("RekognitionClient", "GetFaceDetectionCommand").f(void 0, void 0).ser(se_GetFaceDetectionCommand).de(de_GetFaceDetectionCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/GetFaceLivenessSessionResultsCommand.js
var import_dist145 = __toESM(require_dist());
var import_dist146 = __toESM(require_dist2());
var import_dist147 = __toESM(require_dist3());
var GetFaceLivenessSessionResultsCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "GetFaceLivenessSessionResults", {}).n("RekognitionClient", "GetFaceLivenessSessionResultsCommand").f(void 0, GetFaceLivenessSessionResultsResponseFilterSensitiveLog).ser(se_GetFaceLivenessSessionResultsCommand).de(de_GetFaceLivenessSessionResultsCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/GetFaceSearchCommand.js
var import_dist148 = __toESM(require_dist());
var import_dist149 = __toESM(require_dist2());
var import_dist150 = __toESM(require_dist3());
var GetFaceSearchCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "GetFaceSearch", {}).n("RekognitionClient", "GetFaceSearchCommand").f(void 0, void 0).ser(se_GetFaceSearchCommand).de(de_GetFaceSearchCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/GetLabelDetectionCommand.js
var import_dist151 = __toESM(require_dist());
var import_dist152 = __toESM(require_dist2());
var import_dist153 = __toESM(require_dist3());
var GetLabelDetectionCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "GetLabelDetection", {}).n("RekognitionClient", "GetLabelDetectionCommand").f(void 0, void 0).ser(se_GetLabelDetectionCommand).de(de_GetLabelDetectionCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/GetMediaAnalysisJobCommand.js
var import_dist154 = __toESM(require_dist());
var import_dist155 = __toESM(require_dist2());
var import_dist156 = __toESM(require_dist3());
var GetMediaAnalysisJobCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "GetMediaAnalysisJob", {}).n("RekognitionClient", "GetMediaAnalysisJobCommand").f(void 0, void 0).ser(se_GetMediaAnalysisJobCommand).de(de_GetMediaAnalysisJobCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/GetPersonTrackingCommand.js
var import_dist157 = __toESM(require_dist());
var import_dist158 = __toESM(require_dist2());
var import_dist159 = __toESM(require_dist3());
var GetPersonTrackingCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "GetPersonTracking", {}).n("RekognitionClient", "GetPersonTrackingCommand").f(void 0, void 0).ser(se_GetPersonTrackingCommand).de(de_GetPersonTrackingCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/GetSegmentDetectionCommand.js
var import_dist160 = __toESM(require_dist());
var import_dist161 = __toESM(require_dist2());
var import_dist162 = __toESM(require_dist3());
var GetSegmentDetectionCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "GetSegmentDetection", {}).n("RekognitionClient", "GetSegmentDetectionCommand").f(void 0, void 0).ser(se_GetSegmentDetectionCommand).de(de_GetSegmentDetectionCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/GetTextDetectionCommand.js
var import_dist163 = __toESM(require_dist());
var import_dist164 = __toESM(require_dist2());
var import_dist165 = __toESM(require_dist3());
var GetTextDetectionCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "GetTextDetection", {}).n("RekognitionClient", "GetTextDetectionCommand").f(void 0, void 0).ser(se_GetTextDetectionCommand).de(de_GetTextDetectionCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/IndexFacesCommand.js
var import_dist166 = __toESM(require_dist());
var import_dist167 = __toESM(require_dist2());
var import_dist168 = __toESM(require_dist3());
var IndexFacesCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "IndexFaces", {}).n("RekognitionClient", "IndexFacesCommand").f(void 0, void 0).ser(se_IndexFacesCommand).de(de_IndexFacesCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/ListCollectionsCommand.js
var import_dist169 = __toESM(require_dist());
var import_dist170 = __toESM(require_dist2());
var import_dist171 = __toESM(require_dist3());
var ListCollectionsCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "ListCollections", {}).n("RekognitionClient", "ListCollectionsCommand").f(void 0, void 0).ser(se_ListCollectionsCommand).de(de_ListCollectionsCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/ListDatasetEntriesCommand.js
var import_dist172 = __toESM(require_dist());
var import_dist173 = __toESM(require_dist2());
var import_dist174 = __toESM(require_dist3());
var ListDatasetEntriesCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "ListDatasetEntries", {}).n("RekognitionClient", "ListDatasetEntriesCommand").f(void 0, void 0).ser(se_ListDatasetEntriesCommand).de(de_ListDatasetEntriesCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/ListDatasetLabelsCommand.js
var import_dist175 = __toESM(require_dist());
var import_dist176 = __toESM(require_dist2());
var import_dist177 = __toESM(require_dist3());
var ListDatasetLabelsCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "ListDatasetLabels", {}).n("RekognitionClient", "ListDatasetLabelsCommand").f(void 0, void 0).ser(se_ListDatasetLabelsCommand).de(de_ListDatasetLabelsCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/ListFacesCommand.js
var import_dist178 = __toESM(require_dist());
var import_dist179 = __toESM(require_dist2());
var import_dist180 = __toESM(require_dist3());
var ListFacesCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "ListFaces", {}).n("RekognitionClient", "ListFacesCommand").f(void 0, void 0).ser(se_ListFacesCommand).de(de_ListFacesCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/ListMediaAnalysisJobsCommand.js
var import_dist181 = __toESM(require_dist());
var import_dist182 = __toESM(require_dist2());
var import_dist183 = __toESM(require_dist3());
var ListMediaAnalysisJobsCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "ListMediaAnalysisJobs", {}).n("RekognitionClient", "ListMediaAnalysisJobsCommand").f(void 0, void 0).ser(se_ListMediaAnalysisJobsCommand).de(de_ListMediaAnalysisJobsCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/ListProjectPoliciesCommand.js
var import_dist184 = __toESM(require_dist());
var import_dist185 = __toESM(require_dist2());
var import_dist186 = __toESM(require_dist3());
var ListProjectPoliciesCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "ListProjectPolicies", {}).n("RekognitionClient", "ListProjectPoliciesCommand").f(void 0, void 0).ser(se_ListProjectPoliciesCommand).de(de_ListProjectPoliciesCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/ListStreamProcessorsCommand.js
var import_dist187 = __toESM(require_dist());
var import_dist188 = __toESM(require_dist2());
var import_dist189 = __toESM(require_dist3());
var ListStreamProcessorsCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "ListStreamProcessors", {}).n("RekognitionClient", "ListStreamProcessorsCommand").f(void 0, void 0).ser(se_ListStreamProcessorsCommand).de(de_ListStreamProcessorsCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/ListTagsForResourceCommand.js
var import_dist190 = __toESM(require_dist());
var import_dist191 = __toESM(require_dist2());
var import_dist192 = __toESM(require_dist3());
var ListTagsForResourceCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "ListTagsForResource", {}).n("RekognitionClient", "ListTagsForResourceCommand").f(void 0, void 0).ser(se_ListTagsForResourceCommand).de(de_ListTagsForResourceCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/ListUsersCommand.js
var import_dist193 = __toESM(require_dist());
var import_dist194 = __toESM(require_dist2());
var import_dist195 = __toESM(require_dist3());
var ListUsersCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "ListUsers", {}).n("RekognitionClient", "ListUsersCommand").f(void 0, void 0).ser(se_ListUsersCommand).de(de_ListUsersCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/PutProjectPolicyCommand.js
var import_dist196 = __toESM(require_dist());
var import_dist197 = __toESM(require_dist2());
var import_dist198 = __toESM(require_dist3());
var PutProjectPolicyCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "PutProjectPolicy", {}).n("RekognitionClient", "PutProjectPolicyCommand").f(void 0, void 0).ser(se_PutProjectPolicyCommand).de(de_PutProjectPolicyCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/RecognizeCelebritiesCommand.js
var import_dist199 = __toESM(require_dist());
var import_dist200 = __toESM(require_dist2());
var import_dist201 = __toESM(require_dist3());
var RecognizeCelebritiesCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "RecognizeCelebrities", {}).n("RekognitionClient", "RecognizeCelebritiesCommand").f(void 0, void 0).ser(se_RecognizeCelebritiesCommand).de(de_RecognizeCelebritiesCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/SearchFacesByImageCommand.js
var import_dist202 = __toESM(require_dist());
var import_dist203 = __toESM(require_dist2());
var import_dist204 = __toESM(require_dist3());
var SearchFacesByImageCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "SearchFacesByImage", {}).n("RekognitionClient", "SearchFacesByImageCommand").f(void 0, void 0).ser(se_SearchFacesByImageCommand).de(de_SearchFacesByImageCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/SearchFacesCommand.js
var import_dist205 = __toESM(require_dist());
var import_dist206 = __toESM(require_dist2());
var import_dist207 = __toESM(require_dist3());
var SearchFacesCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "SearchFaces", {}).n("RekognitionClient", "SearchFacesCommand").f(void 0, void 0).ser(se_SearchFacesCommand).de(de_SearchFacesCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/SearchUsersByImageCommand.js
var import_dist208 = __toESM(require_dist());
var import_dist209 = __toESM(require_dist2());
var import_dist210 = __toESM(require_dist3());
var SearchUsersByImageCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "SearchUsersByImage", {}).n("RekognitionClient", "SearchUsersByImageCommand").f(void 0, void 0).ser(se_SearchUsersByImageCommand).de(de_SearchUsersByImageCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/SearchUsersCommand.js
var import_dist211 = __toESM(require_dist());
var import_dist212 = __toESM(require_dist2());
var import_dist213 = __toESM(require_dist3());
var SearchUsersCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "SearchUsers", {}).n("RekognitionClient", "SearchUsersCommand").f(void 0, void 0).ser(se_SearchUsersCommand).de(de_SearchUsersCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/StartCelebrityRecognitionCommand.js
var import_dist214 = __toESM(require_dist());
var import_dist215 = __toESM(require_dist2());
var import_dist216 = __toESM(require_dist3());
var StartCelebrityRecognitionCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "StartCelebrityRecognition", {}).n("RekognitionClient", "StartCelebrityRecognitionCommand").f(void 0, void 0).ser(se_StartCelebrityRecognitionCommand).de(de_StartCelebrityRecognitionCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/StartContentModerationCommand.js
var import_dist217 = __toESM(require_dist());
var import_dist218 = __toESM(require_dist2());
var import_dist219 = __toESM(require_dist3());
var StartContentModerationCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "StartContentModeration", {}).n("RekognitionClient", "StartContentModerationCommand").f(void 0, void 0).ser(se_StartContentModerationCommand).de(de_StartContentModerationCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/StartFaceDetectionCommand.js
var import_dist220 = __toESM(require_dist());
var import_dist221 = __toESM(require_dist2());
var import_dist222 = __toESM(require_dist3());
var StartFaceDetectionCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "StartFaceDetection", {}).n("RekognitionClient", "StartFaceDetectionCommand").f(void 0, void 0).ser(se_StartFaceDetectionCommand).de(de_StartFaceDetectionCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/StartFaceSearchCommand.js
var import_dist223 = __toESM(require_dist());
var import_dist224 = __toESM(require_dist2());
var import_dist225 = __toESM(require_dist3());
var StartFaceSearchCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "StartFaceSearch", {}).n("RekognitionClient", "StartFaceSearchCommand").f(void 0, void 0).ser(se_StartFaceSearchCommand).de(de_StartFaceSearchCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/StartLabelDetectionCommand.js
var import_dist226 = __toESM(require_dist());
var import_dist227 = __toESM(require_dist2());
var import_dist228 = __toESM(require_dist3());
var StartLabelDetectionCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "StartLabelDetection", {}).n("RekognitionClient", "StartLabelDetectionCommand").f(void 0, void 0).ser(se_StartLabelDetectionCommand).de(de_StartLabelDetectionCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/StartMediaAnalysisJobCommand.js
var import_dist229 = __toESM(require_dist());
var import_dist230 = __toESM(require_dist2());
var import_dist231 = __toESM(require_dist3());
var StartMediaAnalysisJobCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "StartMediaAnalysisJob", {}).n("RekognitionClient", "StartMediaAnalysisJobCommand").f(void 0, void 0).ser(se_StartMediaAnalysisJobCommand).de(de_StartMediaAnalysisJobCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/StartPersonTrackingCommand.js
var import_dist232 = __toESM(require_dist());
var import_dist233 = __toESM(require_dist2());
var import_dist234 = __toESM(require_dist3());
var StartPersonTrackingCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "StartPersonTracking", {}).n("RekognitionClient", "StartPersonTrackingCommand").f(void 0, void 0).ser(se_StartPersonTrackingCommand).de(de_StartPersonTrackingCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/StartProjectVersionCommand.js
var import_dist235 = __toESM(require_dist());
var import_dist236 = __toESM(require_dist2());
var import_dist237 = __toESM(require_dist3());
var StartProjectVersionCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "StartProjectVersion", {}).n("RekognitionClient", "StartProjectVersionCommand").f(void 0, void 0).ser(se_StartProjectVersionCommand).de(de_StartProjectVersionCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/StartSegmentDetectionCommand.js
var import_dist238 = __toESM(require_dist());
var import_dist239 = __toESM(require_dist2());
var import_dist240 = __toESM(require_dist3());
var StartSegmentDetectionCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "StartSegmentDetection", {}).n("RekognitionClient", "StartSegmentDetectionCommand").f(void 0, void 0).ser(se_StartSegmentDetectionCommand).de(de_StartSegmentDetectionCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/StartStreamProcessorCommand.js
var import_dist241 = __toESM(require_dist());
var import_dist242 = __toESM(require_dist2());
var import_dist243 = __toESM(require_dist3());
var StartStreamProcessorCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "StartStreamProcessor", {}).n("RekognitionClient", "StartStreamProcessorCommand").f(void 0, void 0).ser(se_StartStreamProcessorCommand).de(de_StartStreamProcessorCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/StartTextDetectionCommand.js
var import_dist244 = __toESM(require_dist());
var import_dist245 = __toESM(require_dist2());
var import_dist246 = __toESM(require_dist3());
var StartTextDetectionCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "StartTextDetection", {}).n("RekognitionClient", "StartTextDetectionCommand").f(void 0, void 0).ser(se_StartTextDetectionCommand).de(de_StartTextDetectionCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/StopProjectVersionCommand.js
var import_dist247 = __toESM(require_dist());
var import_dist248 = __toESM(require_dist2());
var import_dist249 = __toESM(require_dist3());
var StopProjectVersionCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "StopProjectVersion", {}).n("RekognitionClient", "StopProjectVersionCommand").f(void 0, void 0).ser(se_StopProjectVersionCommand).de(de_StopProjectVersionCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/StopStreamProcessorCommand.js
var import_dist250 = __toESM(require_dist());
var import_dist251 = __toESM(require_dist2());
var import_dist252 = __toESM(require_dist3());
var StopStreamProcessorCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "StopStreamProcessor", {}).n("RekognitionClient", "StopStreamProcessorCommand").f(void 0, void 0).ser(se_StopStreamProcessorCommand).de(de_StopStreamProcessorCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/TagResourceCommand.js
var import_dist253 = __toESM(require_dist());
var import_dist254 = __toESM(require_dist2());
var import_dist255 = __toESM(require_dist3());
var TagResourceCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "TagResource", {}).n("RekognitionClient", "TagResourceCommand").f(void 0, void 0).ser(se_TagResourceCommand).de(de_TagResourceCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/UntagResourceCommand.js
var import_dist256 = __toESM(require_dist());
var import_dist257 = __toESM(require_dist2());
var import_dist258 = __toESM(require_dist3());
var UntagResourceCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "UntagResource", {}).n("RekognitionClient", "UntagResourceCommand").f(void 0, void 0).ser(se_UntagResourceCommand).de(de_UntagResourceCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/UpdateDatasetEntriesCommand.js
var import_dist259 = __toESM(require_dist());
var import_dist260 = __toESM(require_dist2());
var import_dist261 = __toESM(require_dist3());
var UpdateDatasetEntriesCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "UpdateDatasetEntries", {}).n("RekognitionClient", "UpdateDatasetEntriesCommand").f(void 0, void 0).ser(se_UpdateDatasetEntriesCommand).de(de_UpdateDatasetEntriesCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/UpdateStreamProcessorCommand.js
var import_dist262 = __toESM(require_dist());
var import_dist263 = __toESM(require_dist2());
var import_dist264 = __toESM(require_dist3());
var UpdateStreamProcessorCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("RekognitionService", "UpdateStreamProcessor", {}).n("RekognitionClient", "UpdateStreamProcessorCommand").f(void 0, void 0).ser(se_UpdateStreamProcessorCommand).de(de_UpdateStreamProcessorCommand).build() {
};

// node_modules/@aws-sdk/client-rekognition/dist-es/Rekognition.js
var commands = {
  AssociateFacesCommand,
  CompareFacesCommand,
  CopyProjectVersionCommand,
  CreateCollectionCommand,
  CreateDatasetCommand,
  CreateFaceLivenessSessionCommand,
  CreateProjectCommand,
  CreateProjectVersionCommand,
  CreateStreamProcessorCommand,
  CreateUserCommand,
  DeleteCollectionCommand,
  DeleteDatasetCommand,
  DeleteFacesCommand,
  DeleteProjectCommand,
  DeleteProjectPolicyCommand,
  DeleteProjectVersionCommand,
  DeleteStreamProcessorCommand,
  DeleteUserCommand,
  DescribeCollectionCommand,
  DescribeDatasetCommand,
  DescribeProjectsCommand,
  DescribeProjectVersionsCommand,
  DescribeStreamProcessorCommand,
  DetectCustomLabelsCommand,
  DetectFacesCommand,
  DetectLabelsCommand,
  DetectModerationLabelsCommand,
  DetectProtectiveEquipmentCommand,
  DetectTextCommand,
  DisassociateFacesCommand,
  DistributeDatasetEntriesCommand,
  GetCelebrityInfoCommand,
  GetCelebrityRecognitionCommand,
  GetContentModerationCommand,
  GetFaceDetectionCommand,
  GetFaceLivenessSessionResultsCommand,
  GetFaceSearchCommand,
  GetLabelDetectionCommand,
  GetMediaAnalysisJobCommand,
  GetPersonTrackingCommand,
  GetSegmentDetectionCommand,
  GetTextDetectionCommand,
  IndexFacesCommand,
  ListCollectionsCommand,
  ListDatasetEntriesCommand,
  ListDatasetLabelsCommand,
  ListFacesCommand,
  ListMediaAnalysisJobsCommand,
  ListProjectPoliciesCommand,
  ListStreamProcessorsCommand,
  ListTagsForResourceCommand,
  ListUsersCommand,
  PutProjectPolicyCommand,
  RecognizeCelebritiesCommand,
  SearchFacesCommand,
  SearchFacesByImageCommand,
  SearchUsersCommand,
  SearchUsersByImageCommand,
  StartCelebrityRecognitionCommand,
  StartContentModerationCommand,
  StartFaceDetectionCommand,
  StartFaceSearchCommand,
  StartLabelDetectionCommand,
  StartMediaAnalysisJobCommand,
  StartPersonTrackingCommand,
  StartProjectVersionCommand,
  StartSegmentDetectionCommand,
  StartStreamProcessorCommand,
  StartTextDetectionCommand,
  StopProjectVersionCommand,
  StopStreamProcessorCommand,
  TagResourceCommand,
  UntagResourceCommand,
  UpdateDatasetEntriesCommand,
  UpdateStreamProcessorCommand
};
var Rekognition = class extends RekognitionClient {
};
createAggregatedClient(commands, Rekognition);

// node_modules/@aws-sdk/client-rekognition/dist-es/commands/index.js
var import_dist268 = __toESM(require_dist());
var import_dist269 = __toESM(require_dist2());
var import_dist270 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-rekognition/dist-es/pagination/index.js
var import_dist328 = __toESM(require_dist());
var import_dist329 = __toESM(require_dist2());
var import_dist330 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-rekognition/dist-es/pagination/DescribeProjectVersionsPaginator.js
var import_dist271 = __toESM(require_dist());
var import_dist272 = __toESM(require_dist2());
var import_dist273 = __toESM(require_dist3());
var paginateDescribeProjectVersions = createPaginator(RekognitionClient, DescribeProjectVersionsCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-rekognition/dist-es/pagination/DescribeProjectsPaginator.js
var import_dist274 = __toESM(require_dist());
var import_dist275 = __toESM(require_dist2());
var import_dist276 = __toESM(require_dist3());
var paginateDescribeProjects = createPaginator(RekognitionClient, DescribeProjectsCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-rekognition/dist-es/pagination/GetCelebrityRecognitionPaginator.js
var import_dist277 = __toESM(require_dist());
var import_dist278 = __toESM(require_dist2());
var import_dist279 = __toESM(require_dist3());
var paginateGetCelebrityRecognition = createPaginator(RekognitionClient, GetCelebrityRecognitionCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-rekognition/dist-es/pagination/GetContentModerationPaginator.js
var import_dist280 = __toESM(require_dist());
var import_dist281 = __toESM(require_dist2());
var import_dist282 = __toESM(require_dist3());
var paginateGetContentModeration = createPaginator(RekognitionClient, GetContentModerationCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-rekognition/dist-es/pagination/GetFaceDetectionPaginator.js
var import_dist283 = __toESM(require_dist());
var import_dist284 = __toESM(require_dist2());
var import_dist285 = __toESM(require_dist3());
var paginateGetFaceDetection = createPaginator(RekognitionClient, GetFaceDetectionCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-rekognition/dist-es/pagination/GetFaceSearchPaginator.js
var import_dist286 = __toESM(require_dist());
var import_dist287 = __toESM(require_dist2());
var import_dist288 = __toESM(require_dist3());
var paginateGetFaceSearch = createPaginator(RekognitionClient, GetFaceSearchCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-rekognition/dist-es/pagination/GetLabelDetectionPaginator.js
var import_dist289 = __toESM(require_dist());
var import_dist290 = __toESM(require_dist2());
var import_dist291 = __toESM(require_dist3());
var paginateGetLabelDetection = createPaginator(RekognitionClient, GetLabelDetectionCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-rekognition/dist-es/pagination/GetPersonTrackingPaginator.js
var import_dist292 = __toESM(require_dist());
var import_dist293 = __toESM(require_dist2());
var import_dist294 = __toESM(require_dist3());
var paginateGetPersonTracking = createPaginator(RekognitionClient, GetPersonTrackingCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-rekognition/dist-es/pagination/GetSegmentDetectionPaginator.js
var import_dist295 = __toESM(require_dist());
var import_dist296 = __toESM(require_dist2());
var import_dist297 = __toESM(require_dist3());
var paginateGetSegmentDetection = createPaginator(RekognitionClient, GetSegmentDetectionCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-rekognition/dist-es/pagination/GetTextDetectionPaginator.js
var import_dist298 = __toESM(require_dist());
var import_dist299 = __toESM(require_dist2());
var import_dist300 = __toESM(require_dist3());
var paginateGetTextDetection = createPaginator(RekognitionClient, GetTextDetectionCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-rekognition/dist-es/pagination/Interfaces.js
var import_dist301 = __toESM(require_dist());
var import_dist302 = __toESM(require_dist2());
var import_dist303 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-rekognition/dist-es/pagination/ListCollectionsPaginator.js
var import_dist304 = __toESM(require_dist());
var import_dist305 = __toESM(require_dist2());
var import_dist306 = __toESM(require_dist3());
var paginateListCollections = createPaginator(RekognitionClient, ListCollectionsCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-rekognition/dist-es/pagination/ListDatasetEntriesPaginator.js
var import_dist307 = __toESM(require_dist());
var import_dist308 = __toESM(require_dist2());
var import_dist309 = __toESM(require_dist3());
var paginateListDatasetEntries = createPaginator(RekognitionClient, ListDatasetEntriesCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-rekognition/dist-es/pagination/ListDatasetLabelsPaginator.js
var import_dist310 = __toESM(require_dist());
var import_dist311 = __toESM(require_dist2());
var import_dist312 = __toESM(require_dist3());
var paginateListDatasetLabels = createPaginator(RekognitionClient, ListDatasetLabelsCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-rekognition/dist-es/pagination/ListFacesPaginator.js
var import_dist313 = __toESM(require_dist());
var import_dist314 = __toESM(require_dist2());
var import_dist315 = __toESM(require_dist3());
var paginateListFaces = createPaginator(RekognitionClient, ListFacesCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-rekognition/dist-es/pagination/ListMediaAnalysisJobsPaginator.js
var import_dist316 = __toESM(require_dist());
var import_dist317 = __toESM(require_dist2());
var import_dist318 = __toESM(require_dist3());
var paginateListMediaAnalysisJobs = createPaginator(RekognitionClient, ListMediaAnalysisJobsCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-rekognition/dist-es/pagination/ListProjectPoliciesPaginator.js
var import_dist319 = __toESM(require_dist());
var import_dist320 = __toESM(require_dist2());
var import_dist321 = __toESM(require_dist3());
var paginateListProjectPolicies = createPaginator(RekognitionClient, ListProjectPoliciesCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-rekognition/dist-es/pagination/ListStreamProcessorsPaginator.js
var import_dist322 = __toESM(require_dist());
var import_dist323 = __toESM(require_dist2());
var import_dist324 = __toESM(require_dist3());
var paginateListStreamProcessors = createPaginator(RekognitionClient, ListStreamProcessorsCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-rekognition/dist-es/pagination/ListUsersPaginator.js
var import_dist325 = __toESM(require_dist());
var import_dist326 = __toESM(require_dist2());
var import_dist327 = __toESM(require_dist3());
var paginateListUsers = createPaginator(RekognitionClient, ListUsersCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-rekognition/dist-es/waiters/index.js
var import_dist337 = __toESM(require_dist());
var import_dist338 = __toESM(require_dist2());
var import_dist339 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-rekognition/dist-es/waiters/waitForProjectVersionRunning.js
var import_dist331 = __toESM(require_dist());
var import_dist332 = __toESM(require_dist2());
var import_dist333 = __toESM(require_dist3());
var checkState = async (client, input) => {
  let reason;
  try {
    const result = await client.send(new DescribeProjectVersionsCommand(input));
    reason = result;
    try {
      const returnComparator = () => {
        const flat_1 = [].concat(...result.ProjectVersionDescriptions);
        const projection_3 = flat_1.map((element_2) => {
          return element_2.Status;
        });
        return projection_3;
      };
      let allStringEq_5 = returnComparator().length > 0;
      for (const element_4 of returnComparator()) {
        allStringEq_5 = allStringEq_5 && element_4 == "RUNNING";
      }
      if (allStringEq_5) {
        return { state: WaiterState.SUCCESS, reason };
      }
    } catch (e2) {
    }
    try {
      const returnComparator = () => {
        const flat_1 = [].concat(...result.ProjectVersionDescriptions);
        const projection_3 = flat_1.map((element_2) => {
          return element_2.Status;
        });
        return projection_3;
      };
      for (const anyStringEq_4 of returnComparator()) {
        if (anyStringEq_4 == "FAILED") {
          return { state: WaiterState.FAILURE, reason };
        }
      }
    } catch (e2) {
    }
  } catch (exception) {
    reason = exception;
  }
  return { state: WaiterState.RETRY, reason };
};
var waitForProjectVersionRunning = async (params, input) => {
  const serviceDefaults = { minDelay: 30, maxDelay: 120 };
  return createWaiter({ ...serviceDefaults, ...params }, input, checkState);
};
var waitUntilProjectVersionRunning = async (params, input) => {
  const serviceDefaults = { minDelay: 30, maxDelay: 120 };
  const result = await createWaiter({ ...serviceDefaults, ...params }, input, checkState);
  return checkExceptions(result);
};

// node_modules/@aws-sdk/client-rekognition/dist-es/waiters/waitForProjectVersionTrainingCompleted.js
var import_dist334 = __toESM(require_dist());
var import_dist335 = __toESM(require_dist2());
var import_dist336 = __toESM(require_dist3());
var checkState2 = async (client, input) => {
  let reason;
  try {
    const result = await client.send(new DescribeProjectVersionsCommand(input));
    reason = result;
    try {
      const returnComparator = () => {
        const flat_1 = [].concat(...result.ProjectVersionDescriptions);
        const projection_3 = flat_1.map((element_2) => {
          return element_2.Status;
        });
        return projection_3;
      };
      let allStringEq_5 = returnComparator().length > 0;
      for (const element_4 of returnComparator()) {
        allStringEq_5 = allStringEq_5 && element_4 == "TRAINING_COMPLETED";
      }
      if (allStringEq_5) {
        return { state: WaiterState.SUCCESS, reason };
      }
    } catch (e2) {
    }
    try {
      const returnComparator = () => {
        const flat_1 = [].concat(...result.ProjectVersionDescriptions);
        const projection_3 = flat_1.map((element_2) => {
          return element_2.Status;
        });
        return projection_3;
      };
      for (const anyStringEq_4 of returnComparator()) {
        if (anyStringEq_4 == "TRAINING_FAILED") {
          return { state: WaiterState.FAILURE, reason };
        }
      }
    } catch (e2) {
    }
  } catch (exception) {
    reason = exception;
  }
  return { state: WaiterState.RETRY, reason };
};
var waitForProjectVersionTrainingCompleted = async (params, input) => {
  const serviceDefaults = { minDelay: 120, maxDelay: 120 };
  return createWaiter({ ...serviceDefaults, ...params }, input, checkState2);
};
var waitUntilProjectVersionTrainingCompleted = async (params, input) => {
  const serviceDefaults = { minDelay: 120, maxDelay: 120 };
  const result = await createWaiter({ ...serviceDefaults, ...params }, input, checkState2);
  return checkExceptions(result);
};

// node_modules/@aws-sdk/client-rekognition/dist-es/models/index.js
var import_dist340 = __toESM(require_dist());
var import_dist341 = __toESM(require_dist2());
var import_dist342 = __toESM(require_dist3());
export {
  Command as $Command,
  AccessDeniedException,
  AssociateFacesCommand,
  Attribute,
  AuditImageFilterSensitiveLog,
  BodyPart,
  CelebrityRecognitionSortBy,
  CompareFacesCommand,
  ConflictException,
  ContentClassifier,
  ContentModerationAggregateBy,
  ContentModerationSortBy,
  CopyProjectVersionCommand,
  CreateCollectionCommand,
  CreateDatasetCommand,
  CreateFaceLivenessSessionCommand,
  CreateProjectCommand,
  CreateProjectVersionCommand,
  CreateStreamProcessorCommand,
  CreateUserCommand,
  CustomizationFeature,
  DatasetStatus,
  DatasetStatusMessageCode,
  DatasetType,
  DeleteCollectionCommand,
  DeleteDatasetCommand,
  DeleteFacesCommand,
  DeleteProjectCommand,
  DeleteProjectPolicyCommand,
  DeleteProjectVersionCommand,
  DeleteStreamProcessorCommand,
  DeleteUserCommand,
  DescribeCollectionCommand,
  DescribeDatasetCommand,
  DescribeProjectVersionsCommand,
  DescribeProjectsCommand,
  DescribeStreamProcessorCommand,
  DetectCustomLabelsCommand,
  DetectFacesCommand,
  DetectLabelsCommand,
  DetectLabelsFeatureName,
  DetectModerationLabelsCommand,
  DetectProtectiveEquipmentCommand,
  DetectTextCommand,
  DisassociateFacesCommand,
  DistributeDatasetEntriesCommand,
  EmotionName,
  FaceAttributes,
  FaceSearchSortBy,
  GenderType,
  GetCelebrityInfoCommand,
  GetCelebrityRecognitionCommand,
  GetContentModerationCommand,
  GetFaceDetectionCommand,
  GetFaceLivenessSessionResultsCommand,
  GetFaceLivenessSessionResultsResponseFilterSensitiveLog,
  GetFaceSearchCommand,
  GetLabelDetectionCommand,
  GetMediaAnalysisJobCommand,
  GetPersonTrackingCommand,
  GetSegmentDetectionCommand,
  GetTextDetectionCommand,
  HumanLoopQuotaExceededException,
  IdempotentParameterMismatchException,
  ImageTooLargeException,
  IndexFacesCommand,
  InternalServerError,
  InvalidImageFormatException,
  InvalidManifestException,
  InvalidPaginationTokenException,
  InvalidParameterException,
  InvalidPolicyRevisionIdException,
  InvalidS3ObjectException,
  KnownGenderType,
  LabelDetectionAggregateBy,
  LabelDetectionFeatureName,
  LabelDetectionSortBy,
  LandmarkType,
  LimitExceededException,
  ListCollectionsCommand,
  ListDatasetEntriesCommand,
  ListDatasetLabelsCommand,
  ListFacesCommand,
  ListMediaAnalysisJobsCommand,
  ListProjectPoliciesCommand,
  ListStreamProcessorsCommand,
  ListTagsForResourceCommand,
  ListUsersCommand,
  LivenessSessionStatus,
  MalformedPolicyDocumentException,
  MediaAnalysisJobFailureCode,
  MediaAnalysisJobStatus,
  OrientationCorrection,
  PersonTrackingSortBy,
  ProjectAutoUpdate,
  ProjectStatus,
  ProjectVersionStatus,
  ProtectiveEquipmentType,
  ProvisionedThroughputExceededException,
  PutProjectPolicyCommand,
  QualityFilter,
  Reason,
  RecognizeCelebritiesCommand,
  Rekognition,
  RekognitionClient,
  RekognitionServiceException,
  ResourceAlreadyExistsException,
  ResourceInUseException,
  ResourceNotFoundException,
  ResourceNotReadyException,
  SearchFacesByImageCommand,
  SearchFacesCommand,
  SearchUsersByImageCommand,
  SearchUsersCommand,
  SegmentType,
  ServiceQuotaExceededException,
  SessionNotFoundException,
  StartCelebrityRecognitionCommand,
  StartContentModerationCommand,
  StartFaceDetectionCommand,
  StartFaceSearchCommand,
  StartLabelDetectionCommand,
  StartMediaAnalysisJobCommand,
  StartPersonTrackingCommand,
  StartProjectVersionCommand,
  StartSegmentDetectionCommand,
  StartStreamProcessorCommand,
  StartTextDetectionCommand,
  StopProjectVersionCommand,
  StopStreamProcessorCommand,
  StreamProcessorParameterToDelete,
  StreamProcessorStatus,
  TagResourceCommand,
  TechnicalCueType,
  TextTypes,
  ThrottlingException,
  UnsearchedFaceReason,
  UnsuccessfulFaceAssociationReason,
  UnsuccessfulFaceDeletionReason,
  UnsuccessfulFaceDisassociationReason,
  UntagResourceCommand,
  UpdateDatasetEntriesCommand,
  UpdateStreamProcessorCommand,
  UserStatus,
  VideoColorRange,
  VideoJobStatus,
  VideoTooLargeException,
  Client as __Client,
  paginateDescribeProjectVersions,
  paginateDescribeProjects,
  paginateGetCelebrityRecognition,
  paginateGetContentModeration,
  paginateGetFaceDetection,
  paginateGetFaceSearch,
  paginateGetLabelDetection,
  paginateGetPersonTracking,
  paginateGetSegmentDetection,
  paginateGetTextDetection,
  paginateListCollections,
  paginateListDatasetEntries,
  paginateListDatasetLabels,
  paginateListFaces,
  paginateListMediaAnalysisJobs,
  paginateListProjectPolicies,
  paginateListStreamProcessors,
  paginateListUsers,
  waitForProjectVersionRunning,
  waitForProjectVersionTrainingCompleted,
  waitUntilProjectVersionRunning,
  waitUntilProjectVersionTrainingCompleted
};
//# sourceMappingURL=@aws-sdk_client-rekognition.js.map
