import __buffer_polyfill from 'vite-plugin-node-polyfills/shims/buffer'
globalThis.Buffer = globalThis.Buffer || __buffer_polyfill
import __global_polyfill from 'vite-plugin-node-polyfills/shims/global'
globalThis.global = globalThis.global || __global_polyfill
import __process_polyfill from 'vite-plugin-node-polyfills/shims/process'
globalThis.process = globalThis.process || __process_polyfill

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
} from "./chunk-THSADROD.js";
import "./chunk-3TAN77E7.js";
import "./chunk-W2ANHD2T.js";
import {
  AwsSdkSigV4Signer,
  Client,
  Command,
  DefaultIdentityProviderConfig,
  FetchHttpHandler,
  HttpRequest,
  NoAuthSigner,
  NoOpLogger,
  SENSITIVE_STRING,
  ServiceException,
  _json,
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
  streamCollector,
  take,
  toBase64,
  toUtf8,
  withBaseException
} from "./chunk-VSJWH2EA.js";
import {
  __publicField,
  __toESM,
  require_dist,
  require_dist2,
  require_dist3
} from "./chunk-GJFZQ5ET.js";

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/index.js
var import_dist421 = __toESM(require_dist());
var import_dist422 = __toESM(require_dist2());
var import_dist423 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/CognitoIdentityProviderClient.js
var import_dist25 = __toESM(require_dist());
var import_dist26 = __toESM(require_dist2());
var import_dist27 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/auth/httpAuthSchemeProvider.js
var import_dist = __toESM(require_dist());
var import_dist2 = __toESM(require_dist2());
var import_dist3 = __toESM(require_dist3());
var defaultCognitoIdentityProviderHttpAuthSchemeParametersProvider = async (config, context, input) => {
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
      name: "cognito-idp",
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
function createSmithyApiNoAuthHttpAuthOption(authParameters) {
  return {
    schemeId: "smithy.api#noAuth"
  };
}
var defaultCognitoIdentityProviderHttpAuthSchemeProvider = (authParameters) => {
  const options = [];
  switch (authParameters.operation) {
    case "AssociateSoftwareToken": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "ChangePassword": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "CompleteWebAuthnRegistration": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "ConfirmDevice": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "ConfirmForgotPassword": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "ConfirmSignUp": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "DeleteUser": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "DeleteUserAttributes": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "DeleteWebAuthnCredential": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "ForgetDevice": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "ForgotPassword": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "GetDevice": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "GetUser": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "GetUserAttributeVerificationCode": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "GetUserAuthFactors": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "GlobalSignOut": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "InitiateAuth": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "ListDevices": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "ListWebAuthnCredentials": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "ResendConfirmationCode": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "RespondToAuthChallenge": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "RevokeToken": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "SetUserMFAPreference": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "SetUserSettings": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "SignUp": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "StartWebAuthnRegistration": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "UpdateAuthEventFeedback": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "UpdateDeviceStatus": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "UpdateUserAttributes": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "VerifySoftwareToken": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
    case "VerifyUserAttribute": {
      options.push(createSmithyApiNoAuthHttpAuthOption(authParameters));
      break;
    }
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

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/endpoint/EndpointParameters.js
var import_dist4 = __toESM(require_dist());
var import_dist5 = __toESM(require_dist2());
var import_dist6 = __toESM(require_dist3());
var resolveClientEndpointParameters = (options) => {
  return Object.assign(options, {
    useDualstackEndpoint: options.useDualstackEndpoint ?? false,
    useFipsEndpoint: options.useFipsEndpoint ?? false,
    defaultSigningName: "cognito-idp"
  });
};
var commonParams = {
  UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
  Endpoint: { type: "builtInParams", name: "endpoint" },
  Region: { type: "builtInParams", name: "region" },
  UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" }
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/runtimeConfig.browser.js
var import_dist16 = __toESM(require_dist());
var import_dist17 = __toESM(require_dist2());
var import_dist18 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-cognito-identity-provider/package.json
var package_default = {
  name: "@aws-sdk/client-cognito-identity-provider",
  description: "AWS SDK for JavaScript Cognito Identity Provider Client for Node.js, Browser and React Native",
  version: "3.782.0",
  scripts: {
    build: "concurrently 'yarn:build:cjs' 'yarn:build:es' 'yarn:build:types'",
    "build:cjs": "node ../../scripts/compilation/inline client-cognito-identity-provider",
    "build:es": "tsc -p tsconfig.es.json",
    "build:include:deps": "lerna run --scope $npm_package_name --include-dependencies build",
    "build:types": "tsc -p tsconfig.types.json",
    "build:types:downlevel": "downlevel-dts dist-types dist-types/ts3.4",
    clean: "rimraf ./dist-* && rimraf *.tsbuildinfo",
    "extract:docs": "api-extractor run --local",
    "generate:client": "node ../../scripts/generate-clients/single-service --solo cognito-identity-provider"
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
    tslib: "^2.6.2"
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
  homepage: "https://github.com/aws/aws-sdk-js-v3/tree/main/clients/client-cognito-identity-provider",
  repository: {
    type: "git",
    url: "https://github.com/aws/aws-sdk-js-v3.git",
    directory: "clients/client-cognito-identity-provider"
  }
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/runtimeConfig.shared.js
var import_dist13 = __toESM(require_dist());
var import_dist14 = __toESM(require_dist2());
var import_dist15 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/endpoint/endpointResolver.js
var import_dist10 = __toESM(require_dist());
var import_dist11 = __toESM(require_dist2());
var import_dist12 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/endpoint/ruleset.js
var import_dist7 = __toESM(require_dist());
var import_dist8 = __toESM(require_dist2());
var import_dist9 = __toESM(require_dist3());
var w = "required";
var x = "fn";
var y = "argv";
var z = "ref";
var a = true;
var b = "isSet";
var c = "booleanEquals";
var d = "error";
var e = "endpoint";
var f = "tree";
var g = "PartitionResult";
var h = "getAttr";
var i = "stringEquals";
var j = { [w]: false, "type": "String" };
var k = { [w]: true, "default": false, "type": "Boolean" };
var l = { [z]: "Endpoint" };
var m = { [x]: c, [y]: [{ [z]: "UseFIPS" }, true] };
var n = { [x]: c, [y]: [{ [z]: "UseDualStack" }, true] };
var o = {};
var p = { [z]: "Region" };
var q = { [x]: h, [y]: [{ [z]: g }, "supportsFIPS"] };
var r = { [z]: g };
var s = { [x]: c, [y]: [true, { [x]: h, [y]: [r, "supportsDualStack"] }] };
var t = [m];
var u = [n];
var v = [p];
var _data = { version: "1.0", parameters: { Region: j, UseDualStack: k, UseFIPS: k, Endpoint: j }, rules: [{ conditions: [{ [x]: b, [y]: [l] }], rules: [{ conditions: t, error: "Invalid Configuration: FIPS and custom endpoint are not supported", type: d }, { conditions: u, error: "Invalid Configuration: Dualstack and custom endpoint are not supported", type: d }, { endpoint: { url: l, properties: o, headers: o }, type: e }], type: f }, { conditions: [{ [x]: b, [y]: v }], rules: [{ conditions: [{ [x]: "aws.partition", [y]: v, assign: g }], rules: [{ conditions: [m, n], rules: [{ conditions: [{ [x]: c, [y]: [a, q] }, s], rules: [{ conditions: [{ [x]: i, [y]: [p, "us-east-1"] }], endpoint: { url: "https://cognito-idp-fips.us-east-1.amazonaws.com", properties: o, headers: o }, type: e }, { conditions: [{ [x]: i, [y]: [p, "us-east-2"] }], endpoint: { url: "https://cognito-idp-fips.us-east-2.amazonaws.com", properties: o, headers: o }, type: e }, { conditions: [{ [x]: i, [y]: [p, "us-west-1"] }], endpoint: { url: "https://cognito-idp-fips.us-west-1.amazonaws.com", properties: o, headers: o }, type: e }, { conditions: [{ [x]: i, [y]: [p, "us-west-2"] }], endpoint: { url: "https://cognito-idp-fips.us-west-2.amazonaws.com", properties: o, headers: o }, type: e }, { endpoint: { url: "https://cognito-idp-fips.{Region}.{PartitionResult#dualStackDnsSuffix}", properties: o, headers: o }, type: e }], type: f }, { error: "FIPS and DualStack are enabled, but this partition does not support one or both", type: d }], type: f }, { conditions: t, rules: [{ conditions: [{ [x]: c, [y]: [q, a] }], rules: [{ endpoint: { url: "https://cognito-idp-fips.{Region}.{PartitionResult#dnsSuffix}", properties: o, headers: o }, type: e }], type: f }, { error: "FIPS is enabled but this partition does not support FIPS", type: d }], type: f }, { conditions: u, rules: [{ conditions: [s], rules: [{ conditions: [{ [x]: i, [y]: ["aws", { [x]: h, [y]: [r, "name"] }] }], endpoint: { url: "https://cognito-idp.{Region}.amazonaws.com", properties: o, headers: o }, type: e }, { endpoint: { url: "https://cognito-idp.{Region}.{PartitionResult#dualStackDnsSuffix}", properties: o, headers: o }, type: e }], type: f }, { error: "DualStack is enabled but this partition does not support DualStack", type: d }], type: f }, { endpoint: { url: "https://cognito-idp.{Region}.{PartitionResult#dnsSuffix}", properties: o, headers: o }, type: e }], type: f }], type: f }, { error: "Invalid Configuration: Missing Region", type: d }] };
var ruleSet = _data;

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/endpoint/endpointResolver.js
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

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/runtimeConfig.shared.js
var getRuntimeConfig = (config) => {
  return {
    apiVersion: "2016-04-18",
    base64Decoder: (config == null ? void 0 : config.base64Decoder) ?? fromBase64,
    base64Encoder: (config == null ? void 0 : config.base64Encoder) ?? toBase64,
    disableHostPrefix: (config == null ? void 0 : config.disableHostPrefix) ?? false,
    endpointProvider: (config == null ? void 0 : config.endpointProvider) ?? defaultEndpointResolver,
    extensions: (config == null ? void 0 : config.extensions) ?? [],
    httpAuthSchemeProvider: (config == null ? void 0 : config.httpAuthSchemeProvider) ?? defaultCognitoIdentityProviderHttpAuthSchemeProvider,
    httpAuthSchemes: (config == null ? void 0 : config.httpAuthSchemes) ?? [
      {
        schemeId: "aws.auth#sigv4",
        identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4"),
        signer: new AwsSdkSigV4Signer()
      },
      {
        schemeId: "smithy.api#noAuth",
        identityProvider: (ipc) => ipc.getIdentityProvider("smithy.api#noAuth") || (async () => ({})),
        signer: new NoAuthSigner()
      }
    ],
    logger: (config == null ? void 0 : config.logger) ?? new NoOpLogger(),
    serviceId: (config == null ? void 0 : config.serviceId) ?? "Cognito Identity Provider",
    urlParser: (config == null ? void 0 : config.urlParser) ?? parseUrl,
    utf8Decoder: (config == null ? void 0 : config.utf8Decoder) ?? fromUtf8,
    utf8Encoder: (config == null ? void 0 : config.utf8Encoder) ?? toUtf8
  };
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/runtimeConfig.browser.js
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

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/runtimeExtensions.js
var import_dist22 = __toESM(require_dist());
var import_dist23 = __toESM(require_dist2());
var import_dist24 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/auth/httpAuthExtensionConfiguration.js
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

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/runtimeExtensions.js
var resolveRuntimeExtensions = (runtimeConfig, extensions) => {
  const extensionConfiguration = Object.assign(getAwsRegionExtensionConfiguration(runtimeConfig), getDefaultExtensionConfiguration(runtimeConfig), getHttpHandlerExtensionConfiguration(runtimeConfig), getHttpAuthExtensionConfiguration(runtimeConfig));
  extensions.forEach((extension) => extension.configure(extensionConfiguration));
  return Object.assign(runtimeConfig, resolveAwsRegionExtensionConfiguration(extensionConfiguration), resolveDefaultRuntimeConfig(extensionConfiguration), resolveHttpHandlerRuntimeConfig(extensionConfiguration), resolveHttpAuthRuntimeConfig(extensionConfiguration));
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/CognitoIdentityProviderClient.js
var CognitoIdentityProviderClient = class extends Client {
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
      httpAuthSchemeParametersProvider: defaultCognitoIdentityProviderHttpAuthSchemeParametersProvider,
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

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/CognitoIdentityProvider.js
var import_dist379 = __toESM(require_dist());
var import_dist380 = __toESM(require_dist2());
var import_dist381 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AddCustomAttributesCommand.js
var import_dist40 = __toESM(require_dist());
var import_dist41 = __toESM(require_dist2());
var import_dist42 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/protocols/Aws_json1_1.js
var import_dist37 = __toESM(require_dist());
var import_dist38 = __toESM(require_dist2());
var import_dist39 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/models/CognitoIdentityProviderServiceException.js
var import_dist28 = __toESM(require_dist());
var import_dist29 = __toESM(require_dist2());
var import_dist30 = __toESM(require_dist3());
var CognitoIdentityProviderServiceException = class _CognitoIdentityProviderServiceException extends ServiceException {
  constructor(options) {
    super(options);
    Object.setPrototypeOf(this, _CognitoIdentityProviderServiceException.prototype);
  }
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/models/models_0.js
var import_dist31 = __toESM(require_dist());
var import_dist32 = __toESM(require_dist2());
var import_dist33 = __toESM(require_dist3());
var RecoveryOptionNameType = {
  ADMIN_ONLY: "admin_only",
  VERIFIED_EMAIL: "verified_email",
  VERIFIED_PHONE_NUMBER: "verified_phone_number"
};
var AccountTakeoverEventActionType = {
  BLOCK: "BLOCK",
  MFA_IF_CONFIGURED: "MFA_IF_CONFIGURED",
  MFA_REQUIRED: "MFA_REQUIRED",
  NO_ACTION: "NO_ACTION"
};
var AttributeDataType = {
  BOOLEAN: "Boolean",
  DATETIME: "DateTime",
  NUMBER: "Number",
  STRING: "String"
};
var InternalErrorException = class _InternalErrorException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "InternalErrorException",
      $fault: "server",
      ...opts
    });
    __publicField(this, "name", "InternalErrorException");
    __publicField(this, "$fault", "server");
    Object.setPrototypeOf(this, _InternalErrorException.prototype);
  }
};
var InvalidParameterException = class _InvalidParameterException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "InvalidParameterException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "InvalidParameterException");
    __publicField(this, "$fault", "client");
    __publicField(this, "reasonCode");
    Object.setPrototypeOf(this, _InvalidParameterException.prototype);
    this.reasonCode = opts.reasonCode;
  }
};
var NotAuthorizedException = class _NotAuthorizedException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "NotAuthorizedException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "NotAuthorizedException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _NotAuthorizedException.prototype);
  }
};
var ResourceNotFoundException = class _ResourceNotFoundException extends CognitoIdentityProviderServiceException {
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
var TooManyRequestsException = class _TooManyRequestsException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "TooManyRequestsException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "TooManyRequestsException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _TooManyRequestsException.prototype);
  }
};
var UserImportInProgressException = class _UserImportInProgressException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "UserImportInProgressException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "UserImportInProgressException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _UserImportInProgressException.prototype);
  }
};
var UserNotFoundException = class _UserNotFoundException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "UserNotFoundException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "UserNotFoundException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _UserNotFoundException.prototype);
  }
};
var InvalidLambdaResponseException = class _InvalidLambdaResponseException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "InvalidLambdaResponseException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "InvalidLambdaResponseException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _InvalidLambdaResponseException.prototype);
  }
};
var LimitExceededException = class _LimitExceededException extends CognitoIdentityProviderServiceException {
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
var TooManyFailedAttemptsException = class _TooManyFailedAttemptsException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "TooManyFailedAttemptsException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "TooManyFailedAttemptsException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _TooManyFailedAttemptsException.prototype);
  }
};
var UnexpectedLambdaException = class _UnexpectedLambdaException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "UnexpectedLambdaException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "UnexpectedLambdaException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _UnexpectedLambdaException.prototype);
  }
};
var UserLambdaValidationException = class _UserLambdaValidationException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "UserLambdaValidationException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "UserLambdaValidationException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _UserLambdaValidationException.prototype);
  }
};
var DeliveryMediumType = {
  EMAIL: "EMAIL",
  SMS: "SMS"
};
var MessageActionType = {
  RESEND: "RESEND",
  SUPPRESS: "SUPPRESS"
};
var UserStatusType = {
  ARCHIVED: "ARCHIVED",
  COMPROMISED: "COMPROMISED",
  CONFIRMED: "CONFIRMED",
  EXTERNAL_PROVIDER: "EXTERNAL_PROVIDER",
  FORCE_CHANGE_PASSWORD: "FORCE_CHANGE_PASSWORD",
  RESET_REQUIRED: "RESET_REQUIRED",
  UNCONFIRMED: "UNCONFIRMED",
  UNKNOWN: "UNKNOWN"
};
var CodeDeliveryFailureException = class _CodeDeliveryFailureException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "CodeDeliveryFailureException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "CodeDeliveryFailureException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _CodeDeliveryFailureException.prototype);
  }
};
var InvalidPasswordException = class _InvalidPasswordException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "InvalidPasswordException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "InvalidPasswordException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _InvalidPasswordException.prototype);
  }
};
var InvalidSmsRoleAccessPolicyException = class _InvalidSmsRoleAccessPolicyException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "InvalidSmsRoleAccessPolicyException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "InvalidSmsRoleAccessPolicyException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _InvalidSmsRoleAccessPolicyException.prototype);
  }
};
var InvalidSmsRoleTrustRelationshipException = class _InvalidSmsRoleTrustRelationshipException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "InvalidSmsRoleTrustRelationshipException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "InvalidSmsRoleTrustRelationshipException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _InvalidSmsRoleTrustRelationshipException.prototype);
  }
};
var PreconditionNotMetException = class _PreconditionNotMetException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "PreconditionNotMetException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "PreconditionNotMetException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _PreconditionNotMetException.prototype);
  }
};
var UnsupportedUserStateException = class _UnsupportedUserStateException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "UnsupportedUserStateException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "UnsupportedUserStateException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _UnsupportedUserStateException.prototype);
  }
};
var UsernameExistsException = class _UsernameExistsException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "UsernameExistsException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "UsernameExistsException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _UsernameExistsException.prototype);
  }
};
var AliasExistsException = class _AliasExistsException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "AliasExistsException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "AliasExistsException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _AliasExistsException.prototype);
  }
};
var InvalidUserPoolConfigurationException = class _InvalidUserPoolConfigurationException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "InvalidUserPoolConfigurationException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "InvalidUserPoolConfigurationException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _InvalidUserPoolConfigurationException.prototype);
  }
};
var AuthFlowType = {
  ADMIN_NO_SRP_AUTH: "ADMIN_NO_SRP_AUTH",
  ADMIN_USER_PASSWORD_AUTH: "ADMIN_USER_PASSWORD_AUTH",
  CUSTOM_AUTH: "CUSTOM_AUTH",
  REFRESH_TOKEN: "REFRESH_TOKEN",
  REFRESH_TOKEN_AUTH: "REFRESH_TOKEN_AUTH",
  USER_AUTH: "USER_AUTH",
  USER_PASSWORD_AUTH: "USER_PASSWORD_AUTH",
  USER_SRP_AUTH: "USER_SRP_AUTH"
};
var ChallengeNameType = {
  ADMIN_NO_SRP_AUTH: "ADMIN_NO_SRP_AUTH",
  CUSTOM_CHALLENGE: "CUSTOM_CHALLENGE",
  DEVICE_PASSWORD_VERIFIER: "DEVICE_PASSWORD_VERIFIER",
  DEVICE_SRP_AUTH: "DEVICE_SRP_AUTH",
  EMAIL_OTP: "EMAIL_OTP",
  MFA_SETUP: "MFA_SETUP",
  NEW_PASSWORD_REQUIRED: "NEW_PASSWORD_REQUIRED",
  PASSWORD: "PASSWORD",
  PASSWORD_SRP: "PASSWORD_SRP",
  PASSWORD_VERIFIER: "PASSWORD_VERIFIER",
  SELECT_CHALLENGE: "SELECT_CHALLENGE",
  SELECT_MFA_TYPE: "SELECT_MFA_TYPE",
  SMS_MFA: "SMS_MFA",
  SMS_OTP: "SMS_OTP",
  SOFTWARE_TOKEN_MFA: "SOFTWARE_TOKEN_MFA",
  WEB_AUTHN: "WEB_AUTHN"
};
var InvalidEmailRoleAccessPolicyException = class _InvalidEmailRoleAccessPolicyException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "InvalidEmailRoleAccessPolicyException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "InvalidEmailRoleAccessPolicyException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _InvalidEmailRoleAccessPolicyException.prototype);
  }
};
var MFAMethodNotFoundException = class _MFAMethodNotFoundException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "MFAMethodNotFoundException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "MFAMethodNotFoundException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _MFAMethodNotFoundException.prototype);
  }
};
var PasswordResetRequiredException = class _PasswordResetRequiredException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "PasswordResetRequiredException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "PasswordResetRequiredException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _PasswordResetRequiredException.prototype);
  }
};
var UserNotConfirmedException = class _UserNotConfirmedException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "UserNotConfirmedException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "UserNotConfirmedException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _UserNotConfirmedException.prototype);
  }
};
var ChallengeName = {
  Mfa: "Mfa",
  Password: "Password"
};
var ChallengeResponse = {
  Failure: "Failure",
  Success: "Success"
};
var FeedbackValueType = {
  INVALID: "Invalid",
  VALID: "Valid"
};
var EventResponseType = {
  Fail: "Fail",
  InProgress: "InProgress",
  Pass: "Pass"
};
var RiskDecisionType = {
  AccountTakeover: "AccountTakeover",
  Block: "Block",
  NoRisk: "NoRisk"
};
var RiskLevelType = {
  High: "High",
  Low: "Low",
  Medium: "Medium"
};
var EventType = {
  ForgotPassword: "ForgotPassword",
  PasswordChange: "PasswordChange",
  ResendCode: "ResendCode",
  SignIn: "SignIn",
  SignUp: "SignUp"
};
var UserPoolAddOnNotEnabledException = class _UserPoolAddOnNotEnabledException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "UserPoolAddOnNotEnabledException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "UserPoolAddOnNotEnabledException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _UserPoolAddOnNotEnabledException.prototype);
  }
};
var CodeMismatchException = class _CodeMismatchException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "CodeMismatchException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "CodeMismatchException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _CodeMismatchException.prototype);
  }
};
var ExpiredCodeException = class _ExpiredCodeException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "ExpiredCodeException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ExpiredCodeException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _ExpiredCodeException.prototype);
  }
};
var PasswordHistoryPolicyViolationException = class _PasswordHistoryPolicyViolationException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "PasswordHistoryPolicyViolationException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "PasswordHistoryPolicyViolationException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _PasswordHistoryPolicyViolationException.prototype);
  }
};
var SoftwareTokenMFANotFoundException = class _SoftwareTokenMFANotFoundException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "SoftwareTokenMFANotFoundException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "SoftwareTokenMFANotFoundException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _SoftwareTokenMFANotFoundException.prototype);
  }
};
var DeviceRememberedStatusType = {
  NOT_REMEMBERED: "not_remembered",
  REMEMBERED: "remembered"
};
var AdvancedSecurityEnabledModeType = {
  AUDIT: "AUDIT",
  ENFORCED: "ENFORCED"
};
var AdvancedSecurityModeType = {
  AUDIT: "AUDIT",
  ENFORCED: "ENFORCED",
  OFF: "OFF"
};
var AliasAttributeType = {
  EMAIL: "email",
  PHONE_NUMBER: "phone_number",
  PREFERRED_USERNAME: "preferred_username"
};
var AuthFactorType = {
  EMAIL_OTP: "EMAIL_OTP",
  PASSWORD: "PASSWORD",
  SMS_OTP: "SMS_OTP",
  WEB_AUTHN: "WEB_AUTHN"
};
var AssetCategoryType = {
  AUTH_APP_GRAPHIC: "AUTH_APP_GRAPHIC",
  EMAIL_GRAPHIC: "EMAIL_GRAPHIC",
  FAVICON_ICO: "FAVICON_ICO",
  FAVICON_SVG: "FAVICON_SVG",
  FORM_BACKGROUND: "FORM_BACKGROUND",
  FORM_LOGO: "FORM_LOGO",
  IDP_BUTTON_ICON: "IDP_BUTTON_ICON",
  PAGE_BACKGROUND: "PAGE_BACKGROUND",
  PAGE_FOOTER_BACKGROUND: "PAGE_FOOTER_BACKGROUND",
  PAGE_FOOTER_LOGO: "PAGE_FOOTER_LOGO",
  PAGE_HEADER_BACKGROUND: "PAGE_HEADER_BACKGROUND",
  PAGE_HEADER_LOGO: "PAGE_HEADER_LOGO",
  PASSKEY_GRAPHIC: "PASSKEY_GRAPHIC",
  PASSWORD_GRAPHIC: "PASSWORD_GRAPHIC",
  SMS_GRAPHIC: "SMS_GRAPHIC"
};
var AssetExtensionType = {
  ICO: "ICO",
  JPEG: "JPEG",
  PNG: "PNG",
  SVG: "SVG",
  WEBP: "WEBP"
};
var ColorSchemeModeType = {
  DARK: "DARK",
  DYNAMIC: "DYNAMIC",
  LIGHT: "LIGHT"
};
var ConcurrentModificationException = class _ConcurrentModificationException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "ConcurrentModificationException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ConcurrentModificationException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _ConcurrentModificationException.prototype);
  }
};
var ForbiddenException = class _ForbiddenException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "ForbiddenException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ForbiddenException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _ForbiddenException.prototype);
  }
};
var VerifiedAttributeType = {
  EMAIL: "email",
  PHONE_NUMBER: "phone_number"
};
var WebAuthnChallengeNotFoundException = class _WebAuthnChallengeNotFoundException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "WebAuthnChallengeNotFoundException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "WebAuthnChallengeNotFoundException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _WebAuthnChallengeNotFoundException.prototype);
  }
};
var WebAuthnClientMismatchException = class _WebAuthnClientMismatchException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "WebAuthnClientMismatchException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "WebAuthnClientMismatchException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _WebAuthnClientMismatchException.prototype);
  }
};
var WebAuthnCredentialNotSupportedException = class _WebAuthnCredentialNotSupportedException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "WebAuthnCredentialNotSupportedException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "WebAuthnCredentialNotSupportedException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _WebAuthnCredentialNotSupportedException.prototype);
  }
};
var WebAuthnNotEnabledException = class _WebAuthnNotEnabledException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "WebAuthnNotEnabledException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "WebAuthnNotEnabledException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _WebAuthnNotEnabledException.prototype);
  }
};
var WebAuthnOriginNotAllowedException = class _WebAuthnOriginNotAllowedException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "WebAuthnOriginNotAllowedException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "WebAuthnOriginNotAllowedException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _WebAuthnOriginNotAllowedException.prototype);
  }
};
var WebAuthnRelyingPartyMismatchException = class _WebAuthnRelyingPartyMismatchException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "WebAuthnRelyingPartyMismatchException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "WebAuthnRelyingPartyMismatchException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _WebAuthnRelyingPartyMismatchException.prototype);
  }
};
var DeviceKeyExistsException = class _DeviceKeyExistsException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "DeviceKeyExistsException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "DeviceKeyExistsException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _DeviceKeyExistsException.prototype);
  }
};
var GroupExistsException = class _GroupExistsException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "GroupExistsException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "GroupExistsException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _GroupExistsException.prototype);
  }
};
var IdentityProviderTypeType = {
  Facebook: "Facebook",
  Google: "Google",
  LoginWithAmazon: "LoginWithAmazon",
  OIDC: "OIDC",
  SAML: "SAML",
  SignInWithApple: "SignInWithApple"
};
var DuplicateProviderException = class _DuplicateProviderException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "DuplicateProviderException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "DuplicateProviderException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _DuplicateProviderException.prototype);
  }
};
var ManagedLoginBrandingExistsException = class _ManagedLoginBrandingExistsException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "ManagedLoginBrandingExistsException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ManagedLoginBrandingExistsException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _ManagedLoginBrandingExistsException.prototype);
  }
};
var UserImportJobStatusType = {
  Created: "Created",
  Expired: "Expired",
  Failed: "Failed",
  InProgress: "InProgress",
  Pending: "Pending",
  Stopped: "Stopped",
  Stopping: "Stopping",
  Succeeded: "Succeeded"
};
var DeletionProtectionType = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE"
};
var EmailSendingAccountType = {
  COGNITO_DEFAULT: "COGNITO_DEFAULT",
  DEVELOPER: "DEVELOPER"
};
var CustomEmailSenderLambdaVersionType = {
  V1_0: "V1_0"
};
var CustomSMSSenderLambdaVersionType = {
  V1_0: "V1_0"
};
var PreTokenGenerationLambdaVersionType = {
  V1_0: "V1_0",
  V2_0: "V2_0",
  V3_0: "V3_0"
};
var UserPoolMfaType = {
  OFF: "OFF",
  ON: "ON",
  OPTIONAL: "OPTIONAL"
};
var UsernameAttributeType = {
  EMAIL: "email",
  PHONE_NUMBER: "phone_number"
};
var UserPoolTierType = {
  ESSENTIALS: "ESSENTIALS",
  LITE: "LITE",
  PLUS: "PLUS"
};
var DefaultEmailOptionType = {
  CONFIRM_WITH_CODE: "CONFIRM_WITH_CODE",
  CONFIRM_WITH_LINK: "CONFIRM_WITH_LINK"
};
var StatusType = {
  Disabled: "Disabled",
  Enabled: "Enabled"
};
var FeatureUnavailableInTierException = class _FeatureUnavailableInTierException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "FeatureUnavailableInTierException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "FeatureUnavailableInTierException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _FeatureUnavailableInTierException.prototype);
  }
};
var TierChangeNotAllowedException = class _TierChangeNotAllowedException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "TierChangeNotAllowedException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "TierChangeNotAllowedException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _TierChangeNotAllowedException.prototype);
  }
};
var UserPoolTaggingException = class _UserPoolTaggingException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "UserPoolTaggingException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "UserPoolTaggingException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _UserPoolTaggingException.prototype);
  }
};
var OAuthFlowType = {
  client_credentials: "client_credentials",
  code: "code",
  implicit: "implicit"
};
var ExplicitAuthFlowsType = {
  ADMIN_NO_SRP_AUTH: "ADMIN_NO_SRP_AUTH",
  ALLOW_ADMIN_USER_PASSWORD_AUTH: "ALLOW_ADMIN_USER_PASSWORD_AUTH",
  ALLOW_CUSTOM_AUTH: "ALLOW_CUSTOM_AUTH",
  ALLOW_REFRESH_TOKEN_AUTH: "ALLOW_REFRESH_TOKEN_AUTH",
  ALLOW_USER_AUTH: "ALLOW_USER_AUTH",
  ALLOW_USER_PASSWORD_AUTH: "ALLOW_USER_PASSWORD_AUTH",
  ALLOW_USER_SRP_AUTH: "ALLOW_USER_SRP_AUTH",
  CUSTOM_AUTH_FLOW_ONLY: "CUSTOM_AUTH_FLOW_ONLY",
  USER_PASSWORD_AUTH: "USER_PASSWORD_AUTH"
};
var PreventUserExistenceErrorTypes = {
  ENABLED: "ENABLED",
  LEGACY: "LEGACY"
};
var TimeUnitsType = {
  DAYS: "days",
  HOURS: "hours",
  MINUTES: "minutes",
  SECONDS: "seconds"
};
var InvalidOAuthFlowException = class _InvalidOAuthFlowException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "InvalidOAuthFlowException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "InvalidOAuthFlowException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _InvalidOAuthFlowException.prototype);
  }
};
var ScopeDoesNotExistException = class _ScopeDoesNotExistException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "ScopeDoesNotExistException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "ScopeDoesNotExistException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _ScopeDoesNotExistException.prototype);
  }
};
var UnsupportedIdentityProviderException = class _UnsupportedIdentityProviderException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "UnsupportedIdentityProviderException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "UnsupportedIdentityProviderException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _UnsupportedIdentityProviderException.prototype);
  }
};
var CompromisedCredentialsEventActionType = {
  BLOCK: "BLOCK",
  NO_ACTION: "NO_ACTION"
};
var EventFilterType = {
  PASSWORD_CHANGE: "PASSWORD_CHANGE",
  SIGN_IN: "SIGN_IN",
  SIGN_UP: "SIGN_UP"
};
var DomainStatusType = {
  ACTIVE: "ACTIVE",
  CREATING: "CREATING",
  DELETING: "DELETING",
  FAILED: "FAILED",
  UPDATING: "UPDATING"
};
var EventSourceName = {
  USER_AUTH_EVENTS: "userAuthEvents",
  USER_NOTIFICATION: "userNotification"
};
var LogLevel = {
  ERROR: "ERROR",
  INFO: "INFO"
};
var AdminAddUserToGroupRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING }
});
var AdminConfirmSignUpRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING }
});
var AttributeTypeFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Value && { Value: SENSITIVE_STRING }
});
var AdminCreateUserRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING },
  ...obj.UserAttributes && {
    UserAttributes: obj.UserAttributes.map((item) => AttributeTypeFilterSensitiveLog(item))
  },
  ...obj.ValidationData && {
    ValidationData: obj.ValidationData.map((item) => AttributeTypeFilterSensitiveLog(item))
  },
  ...obj.TemporaryPassword && { TemporaryPassword: SENSITIVE_STRING }
});
var UserTypeFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING },
  ...obj.Attributes && { Attributes: obj.Attributes.map((item) => AttributeTypeFilterSensitiveLog(item)) }
});
var AdminCreateUserResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.User && { User: UserTypeFilterSensitiveLog(obj.User) }
});
var AdminDeleteUserRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING }
});
var AdminDeleteUserAttributesRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING }
});
var AdminDisableUserRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING }
});
var AdminEnableUserRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING }
});
var AdminForgetDeviceRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING }
});
var AdminGetDeviceRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING }
});
var DeviceTypeFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.DeviceAttributes && {
    DeviceAttributes: obj.DeviceAttributes.map((item) => AttributeTypeFilterSensitiveLog(item))
  }
});
var AdminGetDeviceResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Device && { Device: DeviceTypeFilterSensitiveLog(obj.Device) }
});
var AdminGetUserRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING }
});
var AdminGetUserResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING },
  ...obj.UserAttributes && {
    UserAttributes: obj.UserAttributes.map((item) => AttributeTypeFilterSensitiveLog(item))
  }
});
var AdminInitiateAuthRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ClientId && { ClientId: SENSITIVE_STRING },
  ...obj.AuthParameters && { AuthParameters: SENSITIVE_STRING },
  ...obj.Session && { Session: SENSITIVE_STRING }
});
var AuthenticationResultTypeFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.AccessToken && { AccessToken: SENSITIVE_STRING },
  ...obj.RefreshToken && { RefreshToken: SENSITIVE_STRING },
  ...obj.IdToken && { IdToken: SENSITIVE_STRING }
});
var AdminInitiateAuthResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Session && { Session: SENSITIVE_STRING },
  ...obj.AuthenticationResult && {
    AuthenticationResult: AuthenticationResultTypeFilterSensitiveLog(obj.AuthenticationResult)
  }
});
var AdminListDevicesRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING }
});
var AdminListDevicesResponseFilterSensitiveLog = (obj) => ({
  ...obj
});
var AdminListGroupsForUserRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING }
});
var AdminListUserAuthEventsRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING }
});
var AdminRemoveUserFromGroupRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING }
});
var AdminResetUserPasswordRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING }
});
var AdminRespondToAuthChallengeRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ClientId && { ClientId: SENSITIVE_STRING },
  ...obj.ChallengeResponses && { ChallengeResponses: SENSITIVE_STRING },
  ...obj.Session && { Session: SENSITIVE_STRING }
});
var AdminRespondToAuthChallengeResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Session && { Session: SENSITIVE_STRING },
  ...obj.AuthenticationResult && {
    AuthenticationResult: AuthenticationResultTypeFilterSensitiveLog(obj.AuthenticationResult)
  }
});
var AdminSetUserMFAPreferenceRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING }
});
var AdminSetUserPasswordRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING },
  ...obj.Password && { Password: SENSITIVE_STRING }
});
var AdminSetUserSettingsRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING }
});
var AdminUpdateAuthEventFeedbackRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING }
});
var AdminUpdateDeviceStatusRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING }
});
var AdminUpdateUserAttributesRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING },
  ...obj.UserAttributes && {
    UserAttributes: obj.UserAttributes.map((item) => AttributeTypeFilterSensitiveLog(item))
  }
});
var AdminUserGlobalSignOutRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING }
});
var AssociateSoftwareTokenRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.AccessToken && { AccessToken: SENSITIVE_STRING },
  ...obj.Session && { Session: SENSITIVE_STRING }
});
var AssociateSoftwareTokenResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.SecretCode && { SecretCode: SENSITIVE_STRING },
  ...obj.Session && { Session: SENSITIVE_STRING }
});
var ChangePasswordRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.PreviousPassword && { PreviousPassword: SENSITIVE_STRING },
  ...obj.ProposedPassword && { ProposedPassword: SENSITIVE_STRING },
  ...obj.AccessToken && { AccessToken: SENSITIVE_STRING }
});
var CompleteWebAuthnRegistrationRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.AccessToken && { AccessToken: SENSITIVE_STRING }
});
var ConfirmDeviceRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.AccessToken && { AccessToken: SENSITIVE_STRING }
});
var UserContextDataTypeFilterSensitiveLog = (obj) => ({
  ...obj
});
var ConfirmForgotPasswordRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ClientId && { ClientId: SENSITIVE_STRING },
  ...obj.SecretHash && { SecretHash: SENSITIVE_STRING },
  ...obj.Username && { Username: SENSITIVE_STRING },
  ...obj.Password && { Password: SENSITIVE_STRING },
  ...obj.UserContextData && { UserContextData: SENSITIVE_STRING }
});
var ConfirmSignUpRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ClientId && { ClientId: SENSITIVE_STRING },
  ...obj.SecretHash && { SecretHash: SENSITIVE_STRING },
  ...obj.Username && { Username: SENSITIVE_STRING },
  ...obj.UserContextData && { UserContextData: SENSITIVE_STRING },
  ...obj.Session && { Session: SENSITIVE_STRING }
});
var ConfirmSignUpResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Session && { Session: SENSITIVE_STRING }
});
var CreateManagedLoginBrandingRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ClientId && { ClientId: SENSITIVE_STRING }
});
var UserPoolClientTypeFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ClientId && { ClientId: SENSITIVE_STRING },
  ...obj.ClientSecret && { ClientSecret: SENSITIVE_STRING }
});
var CreateUserPoolClientResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.UserPoolClient && { UserPoolClient: UserPoolClientTypeFilterSensitiveLog(obj.UserPoolClient) }
});
var DeleteUserRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.AccessToken && { AccessToken: SENSITIVE_STRING }
});
var DeleteUserAttributesRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.AccessToken && { AccessToken: SENSITIVE_STRING }
});
var DeleteUserPoolClientRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ClientId && { ClientId: SENSITIVE_STRING }
});
var DeleteWebAuthnCredentialRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.AccessToken && { AccessToken: SENSITIVE_STRING }
});
var DescribeManagedLoginBrandingByClientRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ClientId && { ClientId: SENSITIVE_STRING }
});
var DescribeRiskConfigurationRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ClientId && { ClientId: SENSITIVE_STRING }
});
var RiskConfigurationTypeFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ClientId && { ClientId: SENSITIVE_STRING }
});
var DescribeRiskConfigurationResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.RiskConfiguration && { RiskConfiguration: RiskConfigurationTypeFilterSensitiveLog(obj.RiskConfiguration) }
});
var DescribeUserPoolClientRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ClientId && { ClientId: SENSITIVE_STRING }
});
var DescribeUserPoolClientResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.UserPoolClient && { UserPoolClient: UserPoolClientTypeFilterSensitiveLog(obj.UserPoolClient) }
});
var ForgetDeviceRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.AccessToken && { AccessToken: SENSITIVE_STRING }
});
var ForgotPasswordRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ClientId && { ClientId: SENSITIVE_STRING },
  ...obj.SecretHash && { SecretHash: SENSITIVE_STRING },
  ...obj.UserContextData && { UserContextData: SENSITIVE_STRING },
  ...obj.Username && { Username: SENSITIVE_STRING }
});
var GetDeviceRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.AccessToken && { AccessToken: SENSITIVE_STRING }
});
var GetDeviceResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Device && { Device: DeviceTypeFilterSensitiveLog(obj.Device) }
});
var GetUICustomizationRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ClientId && { ClientId: SENSITIVE_STRING }
});
var UICustomizationTypeFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ClientId && { ClientId: SENSITIVE_STRING }
});
var GetUICustomizationResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.UICustomization && { UICustomization: UICustomizationTypeFilterSensitiveLog(obj.UICustomization) }
});
var GetUserRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.AccessToken && { AccessToken: SENSITIVE_STRING }
});
var GetUserResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING },
  ...obj.UserAttributes && {
    UserAttributes: obj.UserAttributes.map((item) => AttributeTypeFilterSensitiveLog(item))
  }
});
var GetUserAttributeVerificationCodeRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.AccessToken && { AccessToken: SENSITIVE_STRING }
});
var GetUserAuthFactorsRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.AccessToken && { AccessToken: SENSITIVE_STRING }
});
var GetUserAuthFactorsResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING }
});

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/models/models_1.js
var import_dist34 = __toESM(require_dist());
var import_dist35 = __toESM(require_dist2());
var import_dist36 = __toESM(require_dist3());
var UserVerificationType = {
  PREFERRED: "preferred",
  REQUIRED: "required"
};
var UnauthorizedException = class _UnauthorizedException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "UnauthorizedException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "UnauthorizedException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _UnauthorizedException.prototype);
  }
};
var UnsupportedOperationException = class _UnsupportedOperationException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "UnsupportedOperationException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "UnsupportedOperationException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _UnsupportedOperationException.prototype);
  }
};
var UnsupportedTokenTypeException = class _UnsupportedTokenTypeException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "UnsupportedTokenTypeException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "UnsupportedTokenTypeException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _UnsupportedTokenTypeException.prototype);
  }
};
var WebAuthnConfigurationMissingException = class _WebAuthnConfigurationMissingException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "WebAuthnConfigurationMissingException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "WebAuthnConfigurationMissingException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _WebAuthnConfigurationMissingException.prototype);
  }
};
var EnableSoftwareTokenMFAException = class _EnableSoftwareTokenMFAException extends CognitoIdentityProviderServiceException {
  constructor(opts) {
    super({
      name: "EnableSoftwareTokenMFAException",
      $fault: "client",
      ...opts
    });
    __publicField(this, "name", "EnableSoftwareTokenMFAException");
    __publicField(this, "$fault", "client");
    Object.setPrototypeOf(this, _EnableSoftwareTokenMFAException.prototype);
  }
};
var VerifySoftwareTokenResponseType = {
  ERROR: "ERROR",
  SUCCESS: "SUCCESS"
};
var GlobalSignOutRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.AccessToken && { AccessToken: SENSITIVE_STRING }
});
var InitiateAuthRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.AuthParameters && { AuthParameters: SENSITIVE_STRING },
  ...obj.ClientId && { ClientId: SENSITIVE_STRING },
  ...obj.UserContextData && { UserContextData: SENSITIVE_STRING },
  ...obj.Session && { Session: SENSITIVE_STRING }
});
var InitiateAuthResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Session && { Session: SENSITIVE_STRING },
  ...obj.AuthenticationResult && {
    AuthenticationResult: AuthenticationResultTypeFilterSensitiveLog(obj.AuthenticationResult)
  }
});
var ListDevicesRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.AccessToken && { AccessToken: SENSITIVE_STRING }
});
var ListDevicesResponseFilterSensitiveLog = (obj) => ({
  ...obj
});
var UserPoolClientDescriptionFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ClientId && { ClientId: SENSITIVE_STRING }
});
var ListUserPoolClientsResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.UserPoolClients && {
    UserPoolClients: obj.UserPoolClients.map((item) => UserPoolClientDescriptionFilterSensitiveLog(item))
  }
});
var ListUsersResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Users && { Users: obj.Users.map((item) => UserTypeFilterSensitiveLog(item)) }
});
var ListUsersInGroupResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Users && { Users: obj.Users.map((item) => UserTypeFilterSensitiveLog(item)) }
});
var ListWebAuthnCredentialsRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.AccessToken && { AccessToken: SENSITIVE_STRING }
});
var ResendConfirmationCodeRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ClientId && { ClientId: SENSITIVE_STRING },
  ...obj.SecretHash && { SecretHash: SENSITIVE_STRING },
  ...obj.UserContextData && { UserContextData: SENSITIVE_STRING },
  ...obj.Username && { Username: SENSITIVE_STRING }
});
var RespondToAuthChallengeRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ClientId && { ClientId: SENSITIVE_STRING },
  ...obj.Session && { Session: SENSITIVE_STRING },
  ...obj.ChallengeResponses && { ChallengeResponses: SENSITIVE_STRING },
  ...obj.UserContextData && { UserContextData: SENSITIVE_STRING }
});
var RespondToAuthChallengeResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Session && { Session: SENSITIVE_STRING },
  ...obj.AuthenticationResult && {
    AuthenticationResult: AuthenticationResultTypeFilterSensitiveLog(obj.AuthenticationResult)
  }
});
var RevokeTokenRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Token && { Token: SENSITIVE_STRING },
  ...obj.ClientId && { ClientId: SENSITIVE_STRING },
  ...obj.ClientSecret && { ClientSecret: SENSITIVE_STRING }
});
var SetRiskConfigurationRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ClientId && { ClientId: SENSITIVE_STRING }
});
var SetRiskConfigurationResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.RiskConfiguration && { RiskConfiguration: RiskConfigurationTypeFilterSensitiveLog(obj.RiskConfiguration) }
});
var SetUICustomizationRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ClientId && { ClientId: SENSITIVE_STRING }
});
var SetUICustomizationResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.UICustomization && { UICustomization: UICustomizationTypeFilterSensitiveLog(obj.UICustomization) }
});
var SetUserMFAPreferenceRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.AccessToken && { AccessToken: SENSITIVE_STRING }
});
var SetUserSettingsRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.AccessToken && { AccessToken: SENSITIVE_STRING }
});
var SignUpRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ClientId && { ClientId: SENSITIVE_STRING },
  ...obj.SecretHash && { SecretHash: SENSITIVE_STRING },
  ...obj.Username && { Username: SENSITIVE_STRING },
  ...obj.Password && { Password: SENSITIVE_STRING },
  ...obj.UserAttributes && {
    UserAttributes: obj.UserAttributes.map((item) => AttributeTypeFilterSensitiveLog(item))
  },
  ...obj.ValidationData && {
    ValidationData: obj.ValidationData.map((item) => AttributeTypeFilterSensitiveLog(item))
  },
  ...obj.UserContextData && { UserContextData: SENSITIVE_STRING }
});
var SignUpResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Session && { Session: SENSITIVE_STRING }
});
var StartWebAuthnRegistrationRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.AccessToken && { AccessToken: SENSITIVE_STRING }
});
var UpdateAuthEventFeedbackRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Username && { Username: SENSITIVE_STRING },
  ...obj.FeedbackToken && { FeedbackToken: SENSITIVE_STRING }
});
var UpdateDeviceStatusRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.AccessToken && { AccessToken: SENSITIVE_STRING }
});
var UpdateUserAttributesRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.UserAttributes && {
    UserAttributes: obj.UserAttributes.map((item) => AttributeTypeFilterSensitiveLog(item))
  },
  ...obj.AccessToken && { AccessToken: SENSITIVE_STRING }
});
var UpdateUserPoolClientRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.ClientId && { ClientId: SENSITIVE_STRING }
});
var UpdateUserPoolClientResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.UserPoolClient && { UserPoolClient: UserPoolClientTypeFilterSensitiveLog(obj.UserPoolClient) }
});
var VerifySoftwareTokenRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.AccessToken && { AccessToken: SENSITIVE_STRING },
  ...obj.Session && { Session: SENSITIVE_STRING },
  ...obj.UserCode && { UserCode: SENSITIVE_STRING }
});
var VerifySoftwareTokenResponseFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.Session && { Session: SENSITIVE_STRING }
});
var VerifyUserAttributeRequestFilterSensitiveLog = (obj) => ({
  ...obj,
  ...obj.AccessToken && { AccessToken: SENSITIVE_STRING }
});

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/protocols/Aws_json1_1.js
var se_AddCustomAttributesCommand = async (input, context) => {
  const headers = sharedHeaders("AddCustomAttributes");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminAddUserToGroupCommand = async (input, context) => {
  const headers = sharedHeaders("AdminAddUserToGroup");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminConfirmSignUpCommand = async (input, context) => {
  const headers = sharedHeaders("AdminConfirmSignUp");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminCreateUserCommand = async (input, context) => {
  const headers = sharedHeaders("AdminCreateUser");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminDeleteUserCommand = async (input, context) => {
  const headers = sharedHeaders("AdminDeleteUser");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminDeleteUserAttributesCommand = async (input, context) => {
  const headers = sharedHeaders("AdminDeleteUserAttributes");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminDisableProviderForUserCommand = async (input, context) => {
  const headers = sharedHeaders("AdminDisableProviderForUser");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminDisableUserCommand = async (input, context) => {
  const headers = sharedHeaders("AdminDisableUser");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminEnableUserCommand = async (input, context) => {
  const headers = sharedHeaders("AdminEnableUser");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminForgetDeviceCommand = async (input, context) => {
  const headers = sharedHeaders("AdminForgetDevice");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminGetDeviceCommand = async (input, context) => {
  const headers = sharedHeaders("AdminGetDevice");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminGetUserCommand = async (input, context) => {
  const headers = sharedHeaders("AdminGetUser");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminInitiateAuthCommand = async (input, context) => {
  const headers = sharedHeaders("AdminInitiateAuth");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminLinkProviderForUserCommand = async (input, context) => {
  const headers = sharedHeaders("AdminLinkProviderForUser");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminListDevicesCommand = async (input, context) => {
  const headers = sharedHeaders("AdminListDevices");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminListGroupsForUserCommand = async (input, context) => {
  const headers = sharedHeaders("AdminListGroupsForUser");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminListUserAuthEventsCommand = async (input, context) => {
  const headers = sharedHeaders("AdminListUserAuthEvents");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminRemoveUserFromGroupCommand = async (input, context) => {
  const headers = sharedHeaders("AdminRemoveUserFromGroup");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminResetUserPasswordCommand = async (input, context) => {
  const headers = sharedHeaders("AdminResetUserPassword");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminRespondToAuthChallengeCommand = async (input, context) => {
  const headers = sharedHeaders("AdminRespondToAuthChallenge");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminSetUserMFAPreferenceCommand = async (input, context) => {
  const headers = sharedHeaders("AdminSetUserMFAPreference");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminSetUserPasswordCommand = async (input, context) => {
  const headers = sharedHeaders("AdminSetUserPassword");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminSetUserSettingsCommand = async (input, context) => {
  const headers = sharedHeaders("AdminSetUserSettings");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminUpdateAuthEventFeedbackCommand = async (input, context) => {
  const headers = sharedHeaders("AdminUpdateAuthEventFeedback");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminUpdateDeviceStatusCommand = async (input, context) => {
  const headers = sharedHeaders("AdminUpdateDeviceStatus");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminUpdateUserAttributesCommand = async (input, context) => {
  const headers = sharedHeaders("AdminUpdateUserAttributes");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AdminUserGlobalSignOutCommand = async (input, context) => {
  const headers = sharedHeaders("AdminUserGlobalSignOut");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_AssociateSoftwareTokenCommand = async (input, context) => {
  const headers = sharedHeaders("AssociateSoftwareToken");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ChangePasswordCommand = async (input, context) => {
  const headers = sharedHeaders("ChangePassword");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_CompleteWebAuthnRegistrationCommand = async (input, context) => {
  const headers = sharedHeaders("CompleteWebAuthnRegistration");
  let body;
  body = JSON.stringify(se_CompleteWebAuthnRegistrationRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ConfirmDeviceCommand = async (input, context) => {
  const headers = sharedHeaders("ConfirmDevice");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ConfirmForgotPasswordCommand = async (input, context) => {
  const headers = sharedHeaders("ConfirmForgotPassword");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ConfirmSignUpCommand = async (input, context) => {
  const headers = sharedHeaders("ConfirmSignUp");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_CreateGroupCommand = async (input, context) => {
  const headers = sharedHeaders("CreateGroup");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_CreateIdentityProviderCommand = async (input, context) => {
  const headers = sharedHeaders("CreateIdentityProvider");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_CreateManagedLoginBrandingCommand = async (input, context) => {
  const headers = sharedHeaders("CreateManagedLoginBranding");
  let body;
  body = JSON.stringify(se_CreateManagedLoginBrandingRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_CreateResourceServerCommand = async (input, context) => {
  const headers = sharedHeaders("CreateResourceServer");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_CreateUserImportJobCommand = async (input, context) => {
  const headers = sharedHeaders("CreateUserImportJob");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_CreateUserPoolCommand = async (input, context) => {
  const headers = sharedHeaders("CreateUserPool");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_CreateUserPoolClientCommand = async (input, context) => {
  const headers = sharedHeaders("CreateUserPoolClient");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_CreateUserPoolDomainCommand = async (input, context) => {
  const headers = sharedHeaders("CreateUserPoolDomain");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DeleteGroupCommand = async (input, context) => {
  const headers = sharedHeaders("DeleteGroup");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DeleteIdentityProviderCommand = async (input, context) => {
  const headers = sharedHeaders("DeleteIdentityProvider");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DeleteManagedLoginBrandingCommand = async (input, context) => {
  const headers = sharedHeaders("DeleteManagedLoginBranding");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DeleteResourceServerCommand = async (input, context) => {
  const headers = sharedHeaders("DeleteResourceServer");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DeleteUserCommand = async (input, context) => {
  const headers = sharedHeaders("DeleteUser");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DeleteUserAttributesCommand = async (input, context) => {
  const headers = sharedHeaders("DeleteUserAttributes");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DeleteUserPoolCommand = async (input, context) => {
  const headers = sharedHeaders("DeleteUserPool");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DeleteUserPoolClientCommand = async (input, context) => {
  const headers = sharedHeaders("DeleteUserPoolClient");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DeleteUserPoolDomainCommand = async (input, context) => {
  const headers = sharedHeaders("DeleteUserPoolDomain");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DeleteWebAuthnCredentialCommand = async (input, context) => {
  const headers = sharedHeaders("DeleteWebAuthnCredential");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeIdentityProviderCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeIdentityProvider");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeManagedLoginBrandingCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeManagedLoginBranding");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeManagedLoginBrandingByClientCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeManagedLoginBrandingByClient");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeResourceServerCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeResourceServer");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeRiskConfigurationCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeRiskConfiguration");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeUserImportJobCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeUserImportJob");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeUserPoolCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeUserPool");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeUserPoolClientCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeUserPoolClient");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_DescribeUserPoolDomainCommand = async (input, context) => {
  const headers = sharedHeaders("DescribeUserPoolDomain");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ForgetDeviceCommand = async (input, context) => {
  const headers = sharedHeaders("ForgetDevice");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ForgotPasswordCommand = async (input, context) => {
  const headers = sharedHeaders("ForgotPassword");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetCSVHeaderCommand = async (input, context) => {
  const headers = sharedHeaders("GetCSVHeader");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetDeviceCommand = async (input, context) => {
  const headers = sharedHeaders("GetDevice");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetGroupCommand = async (input, context) => {
  const headers = sharedHeaders("GetGroup");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetIdentityProviderByIdentifierCommand = async (input, context) => {
  const headers = sharedHeaders("GetIdentityProviderByIdentifier");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetLogDeliveryConfigurationCommand = async (input, context) => {
  const headers = sharedHeaders("GetLogDeliveryConfiguration");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetSigningCertificateCommand = async (input, context) => {
  const headers = sharedHeaders("GetSigningCertificate");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetUICustomizationCommand = async (input, context) => {
  const headers = sharedHeaders("GetUICustomization");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetUserCommand = async (input, context) => {
  const headers = sharedHeaders("GetUser");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetUserAttributeVerificationCodeCommand = async (input, context) => {
  const headers = sharedHeaders("GetUserAttributeVerificationCode");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetUserAuthFactorsCommand = async (input, context) => {
  const headers = sharedHeaders("GetUserAuthFactors");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GetUserPoolMfaConfigCommand = async (input, context) => {
  const headers = sharedHeaders("GetUserPoolMfaConfig");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_GlobalSignOutCommand = async (input, context) => {
  const headers = sharedHeaders("GlobalSignOut");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_InitiateAuthCommand = async (input, context) => {
  const headers = sharedHeaders("InitiateAuth");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ListDevicesCommand = async (input, context) => {
  const headers = sharedHeaders("ListDevices");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ListGroupsCommand = async (input, context) => {
  const headers = sharedHeaders("ListGroups");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ListIdentityProvidersCommand = async (input, context) => {
  const headers = sharedHeaders("ListIdentityProviders");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ListResourceServersCommand = async (input, context) => {
  const headers = sharedHeaders("ListResourceServers");
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
var se_ListUserImportJobsCommand = async (input, context) => {
  const headers = sharedHeaders("ListUserImportJobs");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ListUserPoolClientsCommand = async (input, context) => {
  const headers = sharedHeaders("ListUserPoolClients");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ListUserPoolsCommand = async (input, context) => {
  const headers = sharedHeaders("ListUserPools");
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
var se_ListUsersInGroupCommand = async (input, context) => {
  const headers = sharedHeaders("ListUsersInGroup");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ListWebAuthnCredentialsCommand = async (input, context) => {
  const headers = sharedHeaders("ListWebAuthnCredentials");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_ResendConfirmationCodeCommand = async (input, context) => {
  const headers = sharedHeaders("ResendConfirmationCode");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_RespondToAuthChallengeCommand = async (input, context) => {
  const headers = sharedHeaders("RespondToAuthChallenge");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_RevokeTokenCommand = async (input, context) => {
  const headers = sharedHeaders("RevokeToken");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_SetLogDeliveryConfigurationCommand = async (input, context) => {
  const headers = sharedHeaders("SetLogDeliveryConfiguration");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_SetRiskConfigurationCommand = async (input, context) => {
  const headers = sharedHeaders("SetRiskConfiguration");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_SetUICustomizationCommand = async (input, context) => {
  const headers = sharedHeaders("SetUICustomization");
  let body;
  body = JSON.stringify(se_SetUICustomizationRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_SetUserMFAPreferenceCommand = async (input, context) => {
  const headers = sharedHeaders("SetUserMFAPreference");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_SetUserPoolMfaConfigCommand = async (input, context) => {
  const headers = sharedHeaders("SetUserPoolMfaConfig");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_SetUserSettingsCommand = async (input, context) => {
  const headers = sharedHeaders("SetUserSettings");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_SignUpCommand = async (input, context) => {
  const headers = sharedHeaders("SignUp");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_StartUserImportJobCommand = async (input, context) => {
  const headers = sharedHeaders("StartUserImportJob");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_StartWebAuthnRegistrationCommand = async (input, context) => {
  const headers = sharedHeaders("StartWebAuthnRegistration");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_StopUserImportJobCommand = async (input, context) => {
  const headers = sharedHeaders("StopUserImportJob");
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
var se_UpdateAuthEventFeedbackCommand = async (input, context) => {
  const headers = sharedHeaders("UpdateAuthEventFeedback");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_UpdateDeviceStatusCommand = async (input, context) => {
  const headers = sharedHeaders("UpdateDeviceStatus");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_UpdateGroupCommand = async (input, context) => {
  const headers = sharedHeaders("UpdateGroup");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_UpdateIdentityProviderCommand = async (input, context) => {
  const headers = sharedHeaders("UpdateIdentityProvider");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_UpdateManagedLoginBrandingCommand = async (input, context) => {
  const headers = sharedHeaders("UpdateManagedLoginBranding");
  let body;
  body = JSON.stringify(se_UpdateManagedLoginBrandingRequest(input, context));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_UpdateResourceServerCommand = async (input, context) => {
  const headers = sharedHeaders("UpdateResourceServer");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_UpdateUserAttributesCommand = async (input, context) => {
  const headers = sharedHeaders("UpdateUserAttributes");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_UpdateUserPoolCommand = async (input, context) => {
  const headers = sharedHeaders("UpdateUserPool");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_UpdateUserPoolClientCommand = async (input, context) => {
  const headers = sharedHeaders("UpdateUserPoolClient");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_UpdateUserPoolDomainCommand = async (input, context) => {
  const headers = sharedHeaders("UpdateUserPoolDomain");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_VerifySoftwareTokenCommand = async (input, context) => {
  const headers = sharedHeaders("VerifySoftwareToken");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var se_VerifyUserAttributeCommand = async (input, context) => {
  const headers = sharedHeaders("VerifyUserAttribute");
  let body;
  body = JSON.stringify(_json(input));
  return buildHttpRpcRequest(context, headers, "/", void 0, body);
};
var de_AddCustomAttributesCommand = async (output, context) => {
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
var de_AdminAddUserToGroupCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  await collectBody(output.body, context);
  const response = {
    $metadata: deserializeMetadata(output)
  };
  return response;
};
var de_AdminConfirmSignUpCommand = async (output, context) => {
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
var de_AdminCreateUserCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_AdminCreateUserResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_AdminDeleteUserCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  await collectBody(output.body, context);
  const response = {
    $metadata: deserializeMetadata(output)
  };
  return response;
};
var de_AdminDeleteUserAttributesCommand = async (output, context) => {
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
var de_AdminDisableProviderForUserCommand = async (output, context) => {
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
var de_AdminDisableUserCommand = async (output, context) => {
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
var de_AdminEnableUserCommand = async (output, context) => {
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
var de_AdminForgetDeviceCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  await collectBody(output.body, context);
  const response = {
    $metadata: deserializeMetadata(output)
  };
  return response;
};
var de_AdminGetDeviceCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_AdminGetDeviceResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_AdminGetUserCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_AdminGetUserResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_AdminInitiateAuthCommand = async (output, context) => {
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
var de_AdminLinkProviderForUserCommand = async (output, context) => {
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
var de_AdminListDevicesCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_AdminListDevicesResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_AdminListGroupsForUserCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_AdminListGroupsForUserResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_AdminListUserAuthEventsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_AdminListUserAuthEventsResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_AdminRemoveUserFromGroupCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  await collectBody(output.body, context);
  const response = {
    $metadata: deserializeMetadata(output)
  };
  return response;
};
var de_AdminResetUserPasswordCommand = async (output, context) => {
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
var de_AdminRespondToAuthChallengeCommand = async (output, context) => {
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
var de_AdminSetUserMFAPreferenceCommand = async (output, context) => {
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
var de_AdminSetUserPasswordCommand = async (output, context) => {
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
var de_AdminSetUserSettingsCommand = async (output, context) => {
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
var de_AdminUpdateAuthEventFeedbackCommand = async (output, context) => {
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
var de_AdminUpdateDeviceStatusCommand = async (output, context) => {
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
var de_AdminUpdateUserAttributesCommand = async (output, context) => {
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
var de_AdminUserGlobalSignOutCommand = async (output, context) => {
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
var de_AssociateSoftwareTokenCommand = async (output, context) => {
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
var de_ChangePasswordCommand = async (output, context) => {
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
var de_CompleteWebAuthnRegistrationCommand = async (output, context) => {
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
var de_ConfirmDeviceCommand = async (output, context) => {
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
var de_ConfirmForgotPasswordCommand = async (output, context) => {
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
var de_ConfirmSignUpCommand = async (output, context) => {
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
var de_CreateGroupCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_CreateGroupResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_CreateIdentityProviderCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_CreateIdentityProviderResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_CreateManagedLoginBrandingCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_CreateManagedLoginBrandingResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_CreateResourceServerCommand = async (output, context) => {
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
var de_CreateUserImportJobCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_CreateUserImportJobResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_CreateUserPoolCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_CreateUserPoolResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_CreateUserPoolClientCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_CreateUserPoolClientResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_CreateUserPoolDomainCommand = async (output, context) => {
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
var de_DeleteGroupCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  await collectBody(output.body, context);
  const response = {
    $metadata: deserializeMetadata(output)
  };
  return response;
};
var de_DeleteIdentityProviderCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  await collectBody(output.body, context);
  const response = {
    $metadata: deserializeMetadata(output)
  };
  return response;
};
var de_DeleteManagedLoginBrandingCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  await collectBody(output.body, context);
  const response = {
    $metadata: deserializeMetadata(output)
  };
  return response;
};
var de_DeleteResourceServerCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  await collectBody(output.body, context);
  const response = {
    $metadata: deserializeMetadata(output)
  };
  return response;
};
var de_DeleteUserCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  await collectBody(output.body, context);
  const response = {
    $metadata: deserializeMetadata(output)
  };
  return response;
};
var de_DeleteUserAttributesCommand = async (output, context) => {
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
var de_DeleteUserPoolCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  await collectBody(output.body, context);
  const response = {
    $metadata: deserializeMetadata(output)
  };
  return response;
};
var de_DeleteUserPoolClientCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  await collectBody(output.body, context);
  const response = {
    $metadata: deserializeMetadata(output)
  };
  return response;
};
var de_DeleteUserPoolDomainCommand = async (output, context) => {
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
var de_DeleteWebAuthnCredentialCommand = async (output, context) => {
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
var de_DescribeIdentityProviderCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DescribeIdentityProviderResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeManagedLoginBrandingCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DescribeManagedLoginBrandingResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeManagedLoginBrandingByClientCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DescribeManagedLoginBrandingByClientResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeResourceServerCommand = async (output, context) => {
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
var de_DescribeRiskConfigurationCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DescribeRiskConfigurationResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeUserImportJobCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DescribeUserImportJobResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeUserPoolCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DescribeUserPoolResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeUserPoolClientCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_DescribeUserPoolClientResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_DescribeUserPoolDomainCommand = async (output, context) => {
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
var de_ForgetDeviceCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  await collectBody(output.body, context);
  const response = {
    $metadata: deserializeMetadata(output)
  };
  return response;
};
var de_ForgotPasswordCommand = async (output, context) => {
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
var de_GetCSVHeaderCommand = async (output, context) => {
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
var de_GetDeviceCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_GetDeviceResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_GetGroupCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_GetGroupResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_GetIdentityProviderByIdentifierCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_GetIdentityProviderByIdentifierResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_GetLogDeliveryConfigurationCommand = async (output, context) => {
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
var de_GetSigningCertificateCommand = async (output, context) => {
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
var de_GetUICustomizationCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_GetUICustomizationResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_GetUserCommand = async (output, context) => {
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
var de_GetUserAttributeVerificationCodeCommand = async (output, context) => {
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
var de_GetUserAuthFactorsCommand = async (output, context) => {
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
var de_GetUserPoolMfaConfigCommand = async (output, context) => {
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
var de_GlobalSignOutCommand = async (output, context) => {
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
var de_InitiateAuthCommand = async (output, context) => {
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
var de_ListDevicesCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_ListDevicesResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_ListGroupsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_ListGroupsResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_ListIdentityProvidersCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_ListIdentityProvidersResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_ListResourceServersCommand = async (output, context) => {
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
var de_ListUserImportJobsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_ListUserImportJobsResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_ListUserPoolClientsCommand = async (output, context) => {
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
var de_ListUserPoolsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_ListUserPoolsResponse(data, context);
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
  contents = de_ListUsersResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_ListUsersInGroupCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_ListUsersInGroupResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_ListWebAuthnCredentialsCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_ListWebAuthnCredentialsResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_ResendConfirmationCodeCommand = async (output, context) => {
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
var de_RespondToAuthChallengeCommand = async (output, context) => {
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
var de_RevokeTokenCommand = async (output, context) => {
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
var de_SetLogDeliveryConfigurationCommand = async (output, context) => {
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
var de_SetRiskConfigurationCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_SetRiskConfigurationResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_SetUICustomizationCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_SetUICustomizationResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_SetUserMFAPreferenceCommand = async (output, context) => {
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
var de_SetUserPoolMfaConfigCommand = async (output, context) => {
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
var de_SetUserSettingsCommand = async (output, context) => {
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
var de_SignUpCommand = async (output, context) => {
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
var de_StartUserImportJobCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_StartUserImportJobResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_StartWebAuthnRegistrationCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_StartWebAuthnRegistrationResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_StopUserImportJobCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_StopUserImportJobResponse(data, context);
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
var de_UpdateAuthEventFeedbackCommand = async (output, context) => {
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
var de_UpdateDeviceStatusCommand = async (output, context) => {
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
var de_UpdateGroupCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_UpdateGroupResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_UpdateIdentityProviderCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_UpdateIdentityProviderResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_UpdateManagedLoginBrandingCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_UpdateManagedLoginBrandingResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_UpdateResourceServerCommand = async (output, context) => {
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
var de_UpdateUserAttributesCommand = async (output, context) => {
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
var de_UpdateUserPoolCommand = async (output, context) => {
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
var de_UpdateUserPoolClientCommand = async (output, context) => {
  if (output.statusCode >= 300) {
    return de_CommandError(output, context);
  }
  const data = await parseJsonBody(output.body, context);
  let contents = {};
  contents = de_UpdateUserPoolClientResponse(data, context);
  const response = {
    $metadata: deserializeMetadata(output),
    ...contents
  };
  return response;
};
var de_UpdateUserPoolDomainCommand = async (output, context) => {
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
var de_VerifySoftwareTokenCommand = async (output, context) => {
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
var de_VerifyUserAttributeCommand = async (output, context) => {
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
    case "InternalErrorException":
    case "com.amazonaws.cognitoidentityprovider#InternalErrorException":
      throw await de_InternalErrorExceptionRes(parsedOutput, context);
    case "InvalidParameterException":
    case "com.amazonaws.cognitoidentityprovider#InvalidParameterException":
      throw await de_InvalidParameterExceptionRes(parsedOutput, context);
    case "NotAuthorizedException":
    case "com.amazonaws.cognitoidentityprovider#NotAuthorizedException":
      throw await de_NotAuthorizedExceptionRes(parsedOutput, context);
    case "ResourceNotFoundException":
    case "com.amazonaws.cognitoidentityprovider#ResourceNotFoundException":
      throw await de_ResourceNotFoundExceptionRes(parsedOutput, context);
    case "TooManyRequestsException":
    case "com.amazonaws.cognitoidentityprovider#TooManyRequestsException":
      throw await de_TooManyRequestsExceptionRes(parsedOutput, context);
    case "UserImportInProgressException":
    case "com.amazonaws.cognitoidentityprovider#UserImportInProgressException":
      throw await de_UserImportInProgressExceptionRes(parsedOutput, context);
    case "UserNotFoundException":
    case "com.amazonaws.cognitoidentityprovider#UserNotFoundException":
      throw await de_UserNotFoundExceptionRes(parsedOutput, context);
    case "InvalidLambdaResponseException":
    case "com.amazonaws.cognitoidentityprovider#InvalidLambdaResponseException":
      throw await de_InvalidLambdaResponseExceptionRes(parsedOutput, context);
    case "LimitExceededException":
    case "com.amazonaws.cognitoidentityprovider#LimitExceededException":
      throw await de_LimitExceededExceptionRes(parsedOutput, context);
    case "TooManyFailedAttemptsException":
    case "com.amazonaws.cognitoidentityprovider#TooManyFailedAttemptsException":
      throw await de_TooManyFailedAttemptsExceptionRes(parsedOutput, context);
    case "UnexpectedLambdaException":
    case "com.amazonaws.cognitoidentityprovider#UnexpectedLambdaException":
      throw await de_UnexpectedLambdaExceptionRes(parsedOutput, context);
    case "UserLambdaValidationException":
    case "com.amazonaws.cognitoidentityprovider#UserLambdaValidationException":
      throw await de_UserLambdaValidationExceptionRes(parsedOutput, context);
    case "CodeDeliveryFailureException":
    case "com.amazonaws.cognitoidentityprovider#CodeDeliveryFailureException":
      throw await de_CodeDeliveryFailureExceptionRes(parsedOutput, context);
    case "InvalidPasswordException":
    case "com.amazonaws.cognitoidentityprovider#InvalidPasswordException":
      throw await de_InvalidPasswordExceptionRes(parsedOutput, context);
    case "InvalidSmsRoleAccessPolicyException":
    case "com.amazonaws.cognitoidentityprovider#InvalidSmsRoleAccessPolicyException":
      throw await de_InvalidSmsRoleAccessPolicyExceptionRes(parsedOutput, context);
    case "InvalidSmsRoleTrustRelationshipException":
    case "com.amazonaws.cognitoidentityprovider#InvalidSmsRoleTrustRelationshipException":
      throw await de_InvalidSmsRoleTrustRelationshipExceptionRes(parsedOutput, context);
    case "PreconditionNotMetException":
    case "com.amazonaws.cognitoidentityprovider#PreconditionNotMetException":
      throw await de_PreconditionNotMetExceptionRes(parsedOutput, context);
    case "UnsupportedUserStateException":
    case "com.amazonaws.cognitoidentityprovider#UnsupportedUserStateException":
      throw await de_UnsupportedUserStateExceptionRes(parsedOutput, context);
    case "UsernameExistsException":
    case "com.amazonaws.cognitoidentityprovider#UsernameExistsException":
      throw await de_UsernameExistsExceptionRes(parsedOutput, context);
    case "AliasExistsException":
    case "com.amazonaws.cognitoidentityprovider#AliasExistsException":
      throw await de_AliasExistsExceptionRes(parsedOutput, context);
    case "InvalidUserPoolConfigurationException":
    case "com.amazonaws.cognitoidentityprovider#InvalidUserPoolConfigurationException":
      throw await de_InvalidUserPoolConfigurationExceptionRes(parsedOutput, context);
    case "InvalidEmailRoleAccessPolicyException":
    case "com.amazonaws.cognitoidentityprovider#InvalidEmailRoleAccessPolicyException":
      throw await de_InvalidEmailRoleAccessPolicyExceptionRes(parsedOutput, context);
    case "MFAMethodNotFoundException":
    case "com.amazonaws.cognitoidentityprovider#MFAMethodNotFoundException":
      throw await de_MFAMethodNotFoundExceptionRes(parsedOutput, context);
    case "PasswordResetRequiredException":
    case "com.amazonaws.cognitoidentityprovider#PasswordResetRequiredException":
      throw await de_PasswordResetRequiredExceptionRes(parsedOutput, context);
    case "UserNotConfirmedException":
    case "com.amazonaws.cognitoidentityprovider#UserNotConfirmedException":
      throw await de_UserNotConfirmedExceptionRes(parsedOutput, context);
    case "UserPoolAddOnNotEnabledException":
    case "com.amazonaws.cognitoidentityprovider#UserPoolAddOnNotEnabledException":
      throw await de_UserPoolAddOnNotEnabledExceptionRes(parsedOutput, context);
    case "CodeMismatchException":
    case "com.amazonaws.cognitoidentityprovider#CodeMismatchException":
      throw await de_CodeMismatchExceptionRes(parsedOutput, context);
    case "ExpiredCodeException":
    case "com.amazonaws.cognitoidentityprovider#ExpiredCodeException":
      throw await de_ExpiredCodeExceptionRes(parsedOutput, context);
    case "PasswordHistoryPolicyViolationException":
    case "com.amazonaws.cognitoidentityprovider#PasswordHistoryPolicyViolationException":
      throw await de_PasswordHistoryPolicyViolationExceptionRes(parsedOutput, context);
    case "SoftwareTokenMFANotFoundException":
    case "com.amazonaws.cognitoidentityprovider#SoftwareTokenMFANotFoundException":
      throw await de_SoftwareTokenMFANotFoundExceptionRes(parsedOutput, context);
    case "ConcurrentModificationException":
    case "com.amazonaws.cognitoidentityprovider#ConcurrentModificationException":
      throw await de_ConcurrentModificationExceptionRes(parsedOutput, context);
    case "ForbiddenException":
    case "com.amazonaws.cognitoidentityprovider#ForbiddenException":
      throw await de_ForbiddenExceptionRes(parsedOutput, context);
    case "WebAuthnChallengeNotFoundException":
    case "com.amazonaws.cognitoidentityprovider#WebAuthnChallengeNotFoundException":
      throw await de_WebAuthnChallengeNotFoundExceptionRes(parsedOutput, context);
    case "WebAuthnClientMismatchException":
    case "com.amazonaws.cognitoidentityprovider#WebAuthnClientMismatchException":
      throw await de_WebAuthnClientMismatchExceptionRes(parsedOutput, context);
    case "WebAuthnCredentialNotSupportedException":
    case "com.amazonaws.cognitoidentityprovider#WebAuthnCredentialNotSupportedException":
      throw await de_WebAuthnCredentialNotSupportedExceptionRes(parsedOutput, context);
    case "WebAuthnNotEnabledException":
    case "com.amazonaws.cognitoidentityprovider#WebAuthnNotEnabledException":
      throw await de_WebAuthnNotEnabledExceptionRes(parsedOutput, context);
    case "WebAuthnOriginNotAllowedException":
    case "com.amazonaws.cognitoidentityprovider#WebAuthnOriginNotAllowedException":
      throw await de_WebAuthnOriginNotAllowedExceptionRes(parsedOutput, context);
    case "WebAuthnRelyingPartyMismatchException":
    case "com.amazonaws.cognitoidentityprovider#WebAuthnRelyingPartyMismatchException":
      throw await de_WebAuthnRelyingPartyMismatchExceptionRes(parsedOutput, context);
    case "DeviceKeyExistsException":
    case "com.amazonaws.cognitoidentityprovider#DeviceKeyExistsException":
      throw await de_DeviceKeyExistsExceptionRes(parsedOutput, context);
    case "GroupExistsException":
    case "com.amazonaws.cognitoidentityprovider#GroupExistsException":
      throw await de_GroupExistsExceptionRes(parsedOutput, context);
    case "DuplicateProviderException":
    case "com.amazonaws.cognitoidentityprovider#DuplicateProviderException":
      throw await de_DuplicateProviderExceptionRes(parsedOutput, context);
    case "ManagedLoginBrandingExistsException":
    case "com.amazonaws.cognitoidentityprovider#ManagedLoginBrandingExistsException":
      throw await de_ManagedLoginBrandingExistsExceptionRes(parsedOutput, context);
    case "FeatureUnavailableInTierException":
    case "com.amazonaws.cognitoidentityprovider#FeatureUnavailableInTierException":
      throw await de_FeatureUnavailableInTierExceptionRes(parsedOutput, context);
    case "TierChangeNotAllowedException":
    case "com.amazonaws.cognitoidentityprovider#TierChangeNotAllowedException":
      throw await de_TierChangeNotAllowedExceptionRes(parsedOutput, context);
    case "UserPoolTaggingException":
    case "com.amazonaws.cognitoidentityprovider#UserPoolTaggingException":
      throw await de_UserPoolTaggingExceptionRes(parsedOutput, context);
    case "InvalidOAuthFlowException":
    case "com.amazonaws.cognitoidentityprovider#InvalidOAuthFlowException":
      throw await de_InvalidOAuthFlowExceptionRes(parsedOutput, context);
    case "ScopeDoesNotExistException":
    case "com.amazonaws.cognitoidentityprovider#ScopeDoesNotExistException":
      throw await de_ScopeDoesNotExistExceptionRes(parsedOutput, context);
    case "UnsupportedIdentityProviderException":
    case "com.amazonaws.cognitoidentityprovider#UnsupportedIdentityProviderException":
      throw await de_UnsupportedIdentityProviderExceptionRes(parsedOutput, context);
    case "UnauthorizedException":
    case "com.amazonaws.cognitoidentityprovider#UnauthorizedException":
      throw await de_UnauthorizedExceptionRes(parsedOutput, context);
    case "UnsupportedOperationException":
    case "com.amazonaws.cognitoidentityprovider#UnsupportedOperationException":
      throw await de_UnsupportedOperationExceptionRes(parsedOutput, context);
    case "UnsupportedTokenTypeException":
    case "com.amazonaws.cognitoidentityprovider#UnsupportedTokenTypeException":
      throw await de_UnsupportedTokenTypeExceptionRes(parsedOutput, context);
    case "WebAuthnConfigurationMissingException":
    case "com.amazonaws.cognitoidentityprovider#WebAuthnConfigurationMissingException":
      throw await de_WebAuthnConfigurationMissingExceptionRes(parsedOutput, context);
    case "EnableSoftwareTokenMFAException":
    case "com.amazonaws.cognitoidentityprovider#EnableSoftwareTokenMFAException":
      throw await de_EnableSoftwareTokenMFAExceptionRes(parsedOutput, context);
    default:
      const parsedBody = parsedOutput.body;
      return throwDefaultError({
        output,
        parsedBody,
        errorCode
      });
  }
};
var de_AliasExistsExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new AliasExistsException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_CodeDeliveryFailureExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new CodeDeliveryFailureException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_CodeMismatchExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new CodeMismatchException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_ConcurrentModificationExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new ConcurrentModificationException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_DeviceKeyExistsExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new DeviceKeyExistsException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_DuplicateProviderExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new DuplicateProviderException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_EnableSoftwareTokenMFAExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new EnableSoftwareTokenMFAException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_ExpiredCodeExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new ExpiredCodeException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_FeatureUnavailableInTierExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new FeatureUnavailableInTierException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_ForbiddenExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new ForbiddenException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_GroupExistsExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new GroupExistsException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_InternalErrorExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new InternalErrorException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_InvalidEmailRoleAccessPolicyExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new InvalidEmailRoleAccessPolicyException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_InvalidLambdaResponseExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new InvalidLambdaResponseException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_InvalidOAuthFlowExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new InvalidOAuthFlowException({
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
var de_InvalidPasswordExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new InvalidPasswordException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_InvalidSmsRoleAccessPolicyExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new InvalidSmsRoleAccessPolicyException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_InvalidSmsRoleTrustRelationshipExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new InvalidSmsRoleTrustRelationshipException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_InvalidUserPoolConfigurationExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new InvalidUserPoolConfigurationException({
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
var de_ManagedLoginBrandingExistsExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new ManagedLoginBrandingExistsException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_MFAMethodNotFoundExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new MFAMethodNotFoundException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_NotAuthorizedExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new NotAuthorizedException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_PasswordHistoryPolicyViolationExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new PasswordHistoryPolicyViolationException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_PasswordResetRequiredExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new PasswordResetRequiredException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_PreconditionNotMetExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new PreconditionNotMetException({
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
var de_ScopeDoesNotExistExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new ScopeDoesNotExistException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_SoftwareTokenMFANotFoundExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new SoftwareTokenMFANotFoundException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_TierChangeNotAllowedExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new TierChangeNotAllowedException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_TooManyFailedAttemptsExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new TooManyFailedAttemptsException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_TooManyRequestsExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new TooManyRequestsException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_UnauthorizedExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new UnauthorizedException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_UnexpectedLambdaExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new UnexpectedLambdaException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_UnsupportedIdentityProviderExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new UnsupportedIdentityProviderException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_UnsupportedOperationExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new UnsupportedOperationException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_UnsupportedTokenTypeExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new UnsupportedTokenTypeException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_UnsupportedUserStateExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new UnsupportedUserStateException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_UserImportInProgressExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new UserImportInProgressException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_UserLambdaValidationExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new UserLambdaValidationException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_UsernameExistsExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new UsernameExistsException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_UserNotConfirmedExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new UserNotConfirmedException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_UserNotFoundExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new UserNotFoundException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_UserPoolAddOnNotEnabledExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new UserPoolAddOnNotEnabledException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_UserPoolTaggingExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new UserPoolTaggingException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_WebAuthnChallengeNotFoundExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new WebAuthnChallengeNotFoundException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_WebAuthnClientMismatchExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new WebAuthnClientMismatchException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_WebAuthnConfigurationMissingExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new WebAuthnConfigurationMissingException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_WebAuthnCredentialNotSupportedExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new WebAuthnCredentialNotSupportedException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_WebAuthnNotEnabledExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new WebAuthnNotEnabledException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_WebAuthnOriginNotAllowedExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new WebAuthnOriginNotAllowedException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var de_WebAuthnRelyingPartyMismatchExceptionRes = async (parsedOutput, context) => {
  const body = parsedOutput.body;
  const deserialized = _json(body);
  const exception = new WebAuthnRelyingPartyMismatchException({
    $metadata: deserializeMetadata(parsedOutput),
    ...deserialized
  });
  return decorateServiceException(exception, body);
};
var se_AssetListType = (input, context) => {
  return input.filter((e2) => e2 != null).map((entry) => {
    return se_AssetType(entry, context);
  });
};
var se_AssetType = (input, context) => {
  return take(input, {
    Bytes: context.base64Encoder,
    Category: [],
    ColorMode: [],
    Extension: [],
    ResourceId: []
  });
};
var se_CompleteWebAuthnRegistrationRequest = (input, context) => {
  return take(input, {
    AccessToken: [],
    Credential: (_) => se_Document(_, context)
  });
};
var se_CreateManagedLoginBrandingRequest = (input, context) => {
  return take(input, {
    Assets: (_) => se_AssetListType(_, context),
    ClientId: [],
    Settings: (_) => se_Document(_, context),
    UseCognitoProvidedValues: [],
    UserPoolId: []
  });
};
var se_Document = (input, context) => {
  return input;
};
var se_SetUICustomizationRequest = (input, context) => {
  return take(input, {
    CSS: [],
    ClientId: [],
    ImageFile: context.base64Encoder,
    UserPoolId: []
  });
};
var se_UpdateManagedLoginBrandingRequest = (input, context) => {
  return take(input, {
    Assets: (_) => se_AssetListType(_, context),
    ManagedLoginBrandingId: [],
    Settings: (_) => se_Document(_, context),
    UseCognitoProvidedValues: [],
    UserPoolId: []
  });
};
var de_AdminCreateUserResponse = (output, context) => {
  return take(output, {
    User: (_) => de_UserType(_, context)
  });
};
var de_AdminGetDeviceResponse = (output, context) => {
  return take(output, {
    Device: (_) => de_DeviceType(_, context)
  });
};
var de_AdminGetUserResponse = (output, context) => {
  return take(output, {
    Enabled: expectBoolean,
    MFAOptions: _json,
    PreferredMfaSetting: expectString,
    UserAttributes: _json,
    UserCreateDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    UserLastModifiedDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    UserMFASettingList: _json,
    UserStatus: expectString,
    Username: expectString
  });
};
var de_AdminListDevicesResponse = (output, context) => {
  return take(output, {
    Devices: (_) => de_DeviceListType(_, context),
    PaginationToken: expectString
  });
};
var de_AdminListGroupsForUserResponse = (output, context) => {
  return take(output, {
    Groups: (_) => de_GroupListType(_, context),
    NextToken: expectString
  });
};
var de_AdminListUserAuthEventsResponse = (output, context) => {
  return take(output, {
    AuthEvents: (_) => de_AuthEventsType(_, context),
    NextToken: expectString
  });
};
var de_AssetListType = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_AssetType(entry, context);
  });
  return retVal;
};
var de_AssetType = (output, context) => {
  return take(output, {
    Bytes: context.base64Decoder,
    Category: expectString,
    ColorMode: expectString,
    Extension: expectString,
    ResourceId: expectString
  });
};
var de_AuthEventsType = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_AuthEventType(entry, context);
  });
  return retVal;
};
var de_AuthEventType = (output, context) => {
  return take(output, {
    ChallengeResponses: _json,
    CreationDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    EventContextData: _json,
    EventFeedback: (_) => de_EventFeedbackType(_, context),
    EventId: expectString,
    EventResponse: expectString,
    EventRisk: _json,
    EventType: expectString
  });
};
var de_CreateGroupResponse = (output, context) => {
  return take(output, {
    Group: (_) => de_GroupType(_, context)
  });
};
var de_CreateIdentityProviderResponse = (output, context) => {
  return take(output, {
    IdentityProvider: (_) => de_IdentityProviderType(_, context)
  });
};
var de_CreateManagedLoginBrandingResponse = (output, context) => {
  return take(output, {
    ManagedLoginBranding: (_) => de_ManagedLoginBrandingType(_, context)
  });
};
var de_CreateUserImportJobResponse = (output, context) => {
  return take(output, {
    UserImportJob: (_) => de_UserImportJobType(_, context)
  });
};
var de_CreateUserPoolClientResponse = (output, context) => {
  return take(output, {
    UserPoolClient: (_) => de_UserPoolClientType(_, context)
  });
};
var de_CreateUserPoolResponse = (output, context) => {
  return take(output, {
    UserPool: (_) => de_UserPoolType(_, context)
  });
};
var de_DescribeIdentityProviderResponse = (output, context) => {
  return take(output, {
    IdentityProvider: (_) => de_IdentityProviderType(_, context)
  });
};
var de_DescribeManagedLoginBrandingByClientResponse = (output, context) => {
  return take(output, {
    ManagedLoginBranding: (_) => de_ManagedLoginBrandingType(_, context)
  });
};
var de_DescribeManagedLoginBrandingResponse = (output, context) => {
  return take(output, {
    ManagedLoginBranding: (_) => de_ManagedLoginBrandingType(_, context)
  });
};
var de_DescribeRiskConfigurationResponse = (output, context) => {
  return take(output, {
    RiskConfiguration: (_) => de_RiskConfigurationType(_, context)
  });
};
var de_DescribeUserImportJobResponse = (output, context) => {
  return take(output, {
    UserImportJob: (_) => de_UserImportJobType(_, context)
  });
};
var de_DescribeUserPoolClientResponse = (output, context) => {
  return take(output, {
    UserPoolClient: (_) => de_UserPoolClientType(_, context)
  });
};
var de_DescribeUserPoolResponse = (output, context) => {
  return take(output, {
    UserPool: (_) => de_UserPoolType(_, context)
  });
};
var de_DeviceListType = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_DeviceType(entry, context);
  });
  return retVal;
};
var de_DeviceType = (output, context) => {
  return take(output, {
    DeviceAttributes: _json,
    DeviceCreateDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    DeviceKey: expectString,
    DeviceLastAuthenticatedDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    DeviceLastModifiedDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_)))
  });
};
var de_Document = (output, context) => {
  return output;
};
var de_EventFeedbackType = (output, context) => {
  return take(output, {
    FeedbackDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    FeedbackValue: expectString,
    Provider: expectString
  });
};
var de_GetDeviceResponse = (output, context) => {
  return take(output, {
    Device: (_) => de_DeviceType(_, context)
  });
};
var de_GetGroupResponse = (output, context) => {
  return take(output, {
    Group: (_) => de_GroupType(_, context)
  });
};
var de_GetIdentityProviderByIdentifierResponse = (output, context) => {
  return take(output, {
    IdentityProvider: (_) => de_IdentityProviderType(_, context)
  });
};
var de_GetUICustomizationResponse = (output, context) => {
  return take(output, {
    UICustomization: (_) => de_UICustomizationType(_, context)
  });
};
var de_GroupListType = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_GroupType(entry, context);
  });
  return retVal;
};
var de_GroupType = (output, context) => {
  return take(output, {
    CreationDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    Description: expectString,
    GroupName: expectString,
    LastModifiedDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    Precedence: expectInt32,
    RoleArn: expectString,
    UserPoolId: expectString
  });
};
var de_IdentityProviderType = (output, context) => {
  return take(output, {
    AttributeMapping: _json,
    CreationDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    IdpIdentifiers: _json,
    LastModifiedDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    ProviderDetails: _json,
    ProviderName: expectString,
    ProviderType: expectString,
    UserPoolId: expectString
  });
};
var de_ListDevicesResponse = (output, context) => {
  return take(output, {
    Devices: (_) => de_DeviceListType(_, context),
    PaginationToken: expectString
  });
};
var de_ListGroupsResponse = (output, context) => {
  return take(output, {
    Groups: (_) => de_GroupListType(_, context),
    NextToken: expectString
  });
};
var de_ListIdentityProvidersResponse = (output, context) => {
  return take(output, {
    NextToken: expectString,
    Providers: (_) => de_ProvidersListType(_, context)
  });
};
var de_ListUserImportJobsResponse = (output, context) => {
  return take(output, {
    PaginationToken: expectString,
    UserImportJobs: (_) => de_UserImportJobsListType(_, context)
  });
};
var de_ListUserPoolsResponse = (output, context) => {
  return take(output, {
    NextToken: expectString,
    UserPools: (_) => de_UserPoolListType(_, context)
  });
};
var de_ListUsersInGroupResponse = (output, context) => {
  return take(output, {
    NextToken: expectString,
    Users: (_) => de_UsersListType(_, context)
  });
};
var de_ListUsersResponse = (output, context) => {
  return take(output, {
    PaginationToken: expectString,
    Users: (_) => de_UsersListType(_, context)
  });
};
var de_ListWebAuthnCredentialsResponse = (output, context) => {
  return take(output, {
    Credentials: (_) => de_WebAuthnCredentialDescriptionListType(_, context),
    NextToken: expectString
  });
};
var de_ManagedLoginBrandingType = (output, context) => {
  return take(output, {
    Assets: (_) => de_AssetListType(_, context),
    CreationDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    LastModifiedDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    ManagedLoginBrandingId: expectString,
    Settings: (_) => de_Document(_, context),
    UseCognitoProvidedValues: expectBoolean,
    UserPoolId: expectString
  });
};
var de_ProviderDescription = (output, context) => {
  return take(output, {
    CreationDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    LastModifiedDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    ProviderName: expectString,
    ProviderType: expectString
  });
};
var de_ProvidersListType = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_ProviderDescription(entry, context);
  });
  return retVal;
};
var de_RiskConfigurationType = (output, context) => {
  return take(output, {
    AccountTakeoverRiskConfiguration: _json,
    ClientId: expectString,
    CompromisedCredentialsRiskConfiguration: _json,
    LastModifiedDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    RiskExceptionConfiguration: _json,
    UserPoolId: expectString
  });
};
var de_SetRiskConfigurationResponse = (output, context) => {
  return take(output, {
    RiskConfiguration: (_) => de_RiskConfigurationType(_, context)
  });
};
var de_SetUICustomizationResponse = (output, context) => {
  return take(output, {
    UICustomization: (_) => de_UICustomizationType(_, context)
  });
};
var de_StartUserImportJobResponse = (output, context) => {
  return take(output, {
    UserImportJob: (_) => de_UserImportJobType(_, context)
  });
};
var de_StartWebAuthnRegistrationResponse = (output, context) => {
  return take(output, {
    CredentialCreationOptions: (_) => de_Document(_, context)
  });
};
var de_StopUserImportJobResponse = (output, context) => {
  return take(output, {
    UserImportJob: (_) => de_UserImportJobType(_, context)
  });
};
var de_UICustomizationType = (output, context) => {
  return take(output, {
    CSS: expectString,
    CSSVersion: expectString,
    ClientId: expectString,
    CreationDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    ImageUrl: expectString,
    LastModifiedDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    UserPoolId: expectString
  });
};
var de_UpdateGroupResponse = (output, context) => {
  return take(output, {
    Group: (_) => de_GroupType(_, context)
  });
};
var de_UpdateIdentityProviderResponse = (output, context) => {
  return take(output, {
    IdentityProvider: (_) => de_IdentityProviderType(_, context)
  });
};
var de_UpdateManagedLoginBrandingResponse = (output, context) => {
  return take(output, {
    ManagedLoginBranding: (_) => de_ManagedLoginBrandingType(_, context)
  });
};
var de_UpdateUserPoolClientResponse = (output, context) => {
  return take(output, {
    UserPoolClient: (_) => de_UserPoolClientType(_, context)
  });
};
var de_UserImportJobsListType = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_UserImportJobType(entry, context);
  });
  return retVal;
};
var de_UserImportJobType = (output, context) => {
  return take(output, {
    CloudWatchLogsRoleArn: expectString,
    CompletionDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    CompletionMessage: expectString,
    CreationDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    FailedUsers: expectLong,
    ImportedUsers: expectLong,
    JobId: expectString,
    JobName: expectString,
    PreSignedUrl: expectString,
    SkippedUsers: expectLong,
    StartDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    Status: expectString,
    UserPoolId: expectString
  });
};
var de_UserPoolClientType = (output, context) => {
  return take(output, {
    AccessTokenValidity: expectInt32,
    AllowedOAuthFlows: _json,
    AllowedOAuthFlowsUserPoolClient: expectBoolean,
    AllowedOAuthScopes: _json,
    AnalyticsConfiguration: _json,
    AuthSessionValidity: expectInt32,
    CallbackURLs: _json,
    ClientId: expectString,
    ClientName: expectString,
    ClientSecret: expectString,
    CreationDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    DefaultRedirectURI: expectString,
    EnablePropagateAdditionalUserContextData: expectBoolean,
    EnableTokenRevocation: expectBoolean,
    ExplicitAuthFlows: _json,
    IdTokenValidity: expectInt32,
    LastModifiedDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    LogoutURLs: _json,
    PreventUserExistenceErrors: expectString,
    ReadAttributes: _json,
    RefreshTokenValidity: expectInt32,
    SupportedIdentityProviders: _json,
    TokenValidityUnits: _json,
    UserPoolId: expectString,
    WriteAttributes: _json
  });
};
var de_UserPoolDescriptionType = (output, context) => {
  return take(output, {
    CreationDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    Id: expectString,
    LambdaConfig: _json,
    LastModifiedDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    Name: expectString,
    Status: expectString
  });
};
var de_UserPoolListType = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_UserPoolDescriptionType(entry, context);
  });
  return retVal;
};
var de_UserPoolType = (output, context) => {
  return take(output, {
    AccountRecoverySetting: _json,
    AdminCreateUserConfig: _json,
    AliasAttributes: _json,
    Arn: expectString,
    AutoVerifiedAttributes: _json,
    CreationDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    CustomDomain: expectString,
    DeletionProtection: expectString,
    DeviceConfiguration: _json,
    Domain: expectString,
    EmailConfiguration: _json,
    EmailConfigurationFailure: expectString,
    EmailVerificationMessage: expectString,
    EmailVerificationSubject: expectString,
    EstimatedNumberOfUsers: expectInt32,
    Id: expectString,
    LambdaConfig: _json,
    LastModifiedDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    MfaConfiguration: expectString,
    Name: expectString,
    Policies: _json,
    SchemaAttributes: _json,
    SmsAuthenticationMessage: expectString,
    SmsConfiguration: _json,
    SmsConfigurationFailure: expectString,
    SmsVerificationMessage: expectString,
    Status: expectString,
    UserAttributeUpdateSettings: _json,
    UserPoolAddOns: _json,
    UserPoolTags: _json,
    UserPoolTier: expectString,
    UsernameAttributes: _json,
    UsernameConfiguration: _json,
    VerificationMessageTemplate: _json
  });
};
var de_UsersListType = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_UserType(entry, context);
  });
  return retVal;
};
var de_UserType = (output, context) => {
  return take(output, {
    Attributes: _json,
    Enabled: expectBoolean,
    MFAOptions: _json,
    UserCreateDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    UserLastModifiedDate: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    UserStatus: expectString,
    Username: expectString
  });
};
var de_WebAuthnCredentialDescription = (output, context) => {
  return take(output, {
    AuthenticatorAttachment: expectString,
    AuthenticatorTransports: _json,
    CreatedAt: (_) => expectNonNull(parseEpochTimestamp(expectNumber(_))),
    CredentialId: expectString,
    FriendlyCredentialName: expectString,
    RelyingPartyId: expectString
  });
};
var de_WebAuthnCredentialDescriptionListType = (output, context) => {
  const retVal = (output || []).filter((e2) => e2 != null).map((entry) => {
    return de_WebAuthnCredentialDescription(entry, context);
  });
  return retVal;
};
var deserializeMetadata = (output) => ({
  httpStatusCode: output.statusCode,
  requestId: output.headers["x-amzn-requestid"] ?? output.headers["x-amzn-request-id"] ?? output.headers["x-amz-request-id"],
  extendedRequestId: output.headers["x-amz-id-2"],
  cfId: output.headers["x-amz-cf-id"]
});
var throwDefaultError = withBaseException(CognitoIdentityProviderServiceException);
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
    "x-amz-target": `AWSCognitoIdentityProviderService.${operation}`
  };
}

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AddCustomAttributesCommand.js
var AddCustomAttributesCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AddCustomAttributes", {}).n("CognitoIdentityProviderClient", "AddCustomAttributesCommand").f(void 0, void 0).ser(se_AddCustomAttributesCommand).de(de_AddCustomAttributesCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminAddUserToGroupCommand.js
var import_dist43 = __toESM(require_dist());
var import_dist44 = __toESM(require_dist2());
var import_dist45 = __toESM(require_dist3());
var AdminAddUserToGroupCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminAddUserToGroup", {}).n("CognitoIdentityProviderClient", "AdminAddUserToGroupCommand").f(AdminAddUserToGroupRequestFilterSensitiveLog, void 0).ser(se_AdminAddUserToGroupCommand).de(de_AdminAddUserToGroupCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminConfirmSignUpCommand.js
var import_dist46 = __toESM(require_dist());
var import_dist47 = __toESM(require_dist2());
var import_dist48 = __toESM(require_dist3());
var AdminConfirmSignUpCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminConfirmSignUp", {}).n("CognitoIdentityProviderClient", "AdminConfirmSignUpCommand").f(AdminConfirmSignUpRequestFilterSensitiveLog, void 0).ser(se_AdminConfirmSignUpCommand).de(de_AdminConfirmSignUpCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminCreateUserCommand.js
var import_dist49 = __toESM(require_dist());
var import_dist50 = __toESM(require_dist2());
var import_dist51 = __toESM(require_dist3());
var AdminCreateUserCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminCreateUser", {}).n("CognitoIdentityProviderClient", "AdminCreateUserCommand").f(AdminCreateUserRequestFilterSensitiveLog, AdminCreateUserResponseFilterSensitiveLog).ser(se_AdminCreateUserCommand).de(de_AdminCreateUserCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminDeleteUserAttributesCommand.js
var import_dist52 = __toESM(require_dist());
var import_dist53 = __toESM(require_dist2());
var import_dist54 = __toESM(require_dist3());
var AdminDeleteUserAttributesCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminDeleteUserAttributes", {}).n("CognitoIdentityProviderClient", "AdminDeleteUserAttributesCommand").f(AdminDeleteUserAttributesRequestFilterSensitiveLog, void 0).ser(se_AdminDeleteUserAttributesCommand).de(de_AdminDeleteUserAttributesCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminDeleteUserCommand.js
var import_dist55 = __toESM(require_dist());
var import_dist56 = __toESM(require_dist2());
var import_dist57 = __toESM(require_dist3());
var AdminDeleteUserCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminDeleteUser", {}).n("CognitoIdentityProviderClient", "AdminDeleteUserCommand").f(AdminDeleteUserRequestFilterSensitiveLog, void 0).ser(se_AdminDeleteUserCommand).de(de_AdminDeleteUserCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminDisableProviderForUserCommand.js
var import_dist58 = __toESM(require_dist());
var import_dist59 = __toESM(require_dist2());
var import_dist60 = __toESM(require_dist3());
var AdminDisableProviderForUserCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminDisableProviderForUser", {}).n("CognitoIdentityProviderClient", "AdminDisableProviderForUserCommand").f(void 0, void 0).ser(se_AdminDisableProviderForUserCommand).de(de_AdminDisableProviderForUserCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminDisableUserCommand.js
var import_dist61 = __toESM(require_dist());
var import_dist62 = __toESM(require_dist2());
var import_dist63 = __toESM(require_dist3());
var AdminDisableUserCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminDisableUser", {}).n("CognitoIdentityProviderClient", "AdminDisableUserCommand").f(AdminDisableUserRequestFilterSensitiveLog, void 0).ser(se_AdminDisableUserCommand).de(de_AdminDisableUserCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminEnableUserCommand.js
var import_dist64 = __toESM(require_dist());
var import_dist65 = __toESM(require_dist2());
var import_dist66 = __toESM(require_dist3());
var AdminEnableUserCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminEnableUser", {}).n("CognitoIdentityProviderClient", "AdminEnableUserCommand").f(AdminEnableUserRequestFilterSensitiveLog, void 0).ser(se_AdminEnableUserCommand).de(de_AdminEnableUserCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminForgetDeviceCommand.js
var import_dist67 = __toESM(require_dist());
var import_dist68 = __toESM(require_dist2());
var import_dist69 = __toESM(require_dist3());
var AdminForgetDeviceCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminForgetDevice", {}).n("CognitoIdentityProviderClient", "AdminForgetDeviceCommand").f(AdminForgetDeviceRequestFilterSensitiveLog, void 0).ser(se_AdminForgetDeviceCommand).de(de_AdminForgetDeviceCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminGetDeviceCommand.js
var import_dist70 = __toESM(require_dist());
var import_dist71 = __toESM(require_dist2());
var import_dist72 = __toESM(require_dist3());
var AdminGetDeviceCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminGetDevice", {}).n("CognitoIdentityProviderClient", "AdminGetDeviceCommand").f(AdminGetDeviceRequestFilterSensitiveLog, AdminGetDeviceResponseFilterSensitiveLog).ser(se_AdminGetDeviceCommand).de(de_AdminGetDeviceCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminGetUserCommand.js
var import_dist73 = __toESM(require_dist());
var import_dist74 = __toESM(require_dist2());
var import_dist75 = __toESM(require_dist3());
var AdminGetUserCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminGetUser", {}).n("CognitoIdentityProviderClient", "AdminGetUserCommand").f(AdminGetUserRequestFilterSensitiveLog, AdminGetUserResponseFilterSensitiveLog).ser(se_AdminGetUserCommand).de(de_AdminGetUserCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminInitiateAuthCommand.js
var import_dist76 = __toESM(require_dist());
var import_dist77 = __toESM(require_dist2());
var import_dist78 = __toESM(require_dist3());
var AdminInitiateAuthCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminInitiateAuth", {}).n("CognitoIdentityProviderClient", "AdminInitiateAuthCommand").f(AdminInitiateAuthRequestFilterSensitiveLog, AdminInitiateAuthResponseFilterSensitiveLog).ser(se_AdminInitiateAuthCommand).de(de_AdminInitiateAuthCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminLinkProviderForUserCommand.js
var import_dist79 = __toESM(require_dist());
var import_dist80 = __toESM(require_dist2());
var import_dist81 = __toESM(require_dist3());
var AdminLinkProviderForUserCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminLinkProviderForUser", {}).n("CognitoIdentityProviderClient", "AdminLinkProviderForUserCommand").f(void 0, void 0).ser(se_AdminLinkProviderForUserCommand).de(de_AdminLinkProviderForUserCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminListDevicesCommand.js
var import_dist82 = __toESM(require_dist());
var import_dist83 = __toESM(require_dist2());
var import_dist84 = __toESM(require_dist3());
var AdminListDevicesCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminListDevices", {}).n("CognitoIdentityProviderClient", "AdminListDevicesCommand").f(AdminListDevicesRequestFilterSensitiveLog, AdminListDevicesResponseFilterSensitiveLog).ser(se_AdminListDevicesCommand).de(de_AdminListDevicesCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminListGroupsForUserCommand.js
var import_dist85 = __toESM(require_dist());
var import_dist86 = __toESM(require_dist2());
var import_dist87 = __toESM(require_dist3());
var AdminListGroupsForUserCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminListGroupsForUser", {}).n("CognitoIdentityProviderClient", "AdminListGroupsForUserCommand").f(AdminListGroupsForUserRequestFilterSensitiveLog, void 0).ser(se_AdminListGroupsForUserCommand).de(de_AdminListGroupsForUserCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminListUserAuthEventsCommand.js
var import_dist88 = __toESM(require_dist());
var import_dist89 = __toESM(require_dist2());
var import_dist90 = __toESM(require_dist3());
var AdminListUserAuthEventsCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminListUserAuthEvents", {}).n("CognitoIdentityProviderClient", "AdminListUserAuthEventsCommand").f(AdminListUserAuthEventsRequestFilterSensitiveLog, void 0).ser(se_AdminListUserAuthEventsCommand).de(de_AdminListUserAuthEventsCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminRemoveUserFromGroupCommand.js
var import_dist91 = __toESM(require_dist());
var import_dist92 = __toESM(require_dist2());
var import_dist93 = __toESM(require_dist3());
var AdminRemoveUserFromGroupCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminRemoveUserFromGroup", {}).n("CognitoIdentityProviderClient", "AdminRemoveUserFromGroupCommand").f(AdminRemoveUserFromGroupRequestFilterSensitiveLog, void 0).ser(se_AdminRemoveUserFromGroupCommand).de(de_AdminRemoveUserFromGroupCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminResetUserPasswordCommand.js
var import_dist94 = __toESM(require_dist());
var import_dist95 = __toESM(require_dist2());
var import_dist96 = __toESM(require_dist3());
var AdminResetUserPasswordCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminResetUserPassword", {}).n("CognitoIdentityProviderClient", "AdminResetUserPasswordCommand").f(AdminResetUserPasswordRequestFilterSensitiveLog, void 0).ser(se_AdminResetUserPasswordCommand).de(de_AdminResetUserPasswordCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminRespondToAuthChallengeCommand.js
var import_dist97 = __toESM(require_dist());
var import_dist98 = __toESM(require_dist2());
var import_dist99 = __toESM(require_dist3());
var AdminRespondToAuthChallengeCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminRespondToAuthChallenge", {}).n("CognitoIdentityProviderClient", "AdminRespondToAuthChallengeCommand").f(AdminRespondToAuthChallengeRequestFilterSensitiveLog, AdminRespondToAuthChallengeResponseFilterSensitiveLog).ser(se_AdminRespondToAuthChallengeCommand).de(de_AdminRespondToAuthChallengeCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminSetUserMFAPreferenceCommand.js
var import_dist100 = __toESM(require_dist());
var import_dist101 = __toESM(require_dist2());
var import_dist102 = __toESM(require_dist3());
var AdminSetUserMFAPreferenceCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminSetUserMFAPreference", {}).n("CognitoIdentityProviderClient", "AdminSetUserMFAPreferenceCommand").f(AdminSetUserMFAPreferenceRequestFilterSensitiveLog, void 0).ser(se_AdminSetUserMFAPreferenceCommand).de(de_AdminSetUserMFAPreferenceCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminSetUserPasswordCommand.js
var import_dist103 = __toESM(require_dist());
var import_dist104 = __toESM(require_dist2());
var import_dist105 = __toESM(require_dist3());
var AdminSetUserPasswordCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminSetUserPassword", {}).n("CognitoIdentityProviderClient", "AdminSetUserPasswordCommand").f(AdminSetUserPasswordRequestFilterSensitiveLog, void 0).ser(se_AdminSetUserPasswordCommand).de(de_AdminSetUserPasswordCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminSetUserSettingsCommand.js
var import_dist106 = __toESM(require_dist());
var import_dist107 = __toESM(require_dist2());
var import_dist108 = __toESM(require_dist3());
var AdminSetUserSettingsCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminSetUserSettings", {}).n("CognitoIdentityProviderClient", "AdminSetUserSettingsCommand").f(AdminSetUserSettingsRequestFilterSensitiveLog, void 0).ser(se_AdminSetUserSettingsCommand).de(de_AdminSetUserSettingsCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminUpdateAuthEventFeedbackCommand.js
var import_dist109 = __toESM(require_dist());
var import_dist110 = __toESM(require_dist2());
var import_dist111 = __toESM(require_dist3());
var AdminUpdateAuthEventFeedbackCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminUpdateAuthEventFeedback", {}).n("CognitoIdentityProviderClient", "AdminUpdateAuthEventFeedbackCommand").f(AdminUpdateAuthEventFeedbackRequestFilterSensitiveLog, void 0).ser(se_AdminUpdateAuthEventFeedbackCommand).de(de_AdminUpdateAuthEventFeedbackCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminUpdateDeviceStatusCommand.js
var import_dist112 = __toESM(require_dist());
var import_dist113 = __toESM(require_dist2());
var import_dist114 = __toESM(require_dist3());
var AdminUpdateDeviceStatusCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminUpdateDeviceStatus", {}).n("CognitoIdentityProviderClient", "AdminUpdateDeviceStatusCommand").f(AdminUpdateDeviceStatusRequestFilterSensitiveLog, void 0).ser(se_AdminUpdateDeviceStatusCommand).de(de_AdminUpdateDeviceStatusCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminUpdateUserAttributesCommand.js
var import_dist115 = __toESM(require_dist());
var import_dist116 = __toESM(require_dist2());
var import_dist117 = __toESM(require_dist3());
var AdminUpdateUserAttributesCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminUpdateUserAttributes", {}).n("CognitoIdentityProviderClient", "AdminUpdateUserAttributesCommand").f(AdminUpdateUserAttributesRequestFilterSensitiveLog, void 0).ser(se_AdminUpdateUserAttributesCommand).de(de_AdminUpdateUserAttributesCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AdminUserGlobalSignOutCommand.js
var import_dist118 = __toESM(require_dist());
var import_dist119 = __toESM(require_dist2());
var import_dist120 = __toESM(require_dist3());
var AdminUserGlobalSignOutCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AdminUserGlobalSignOut", {}).n("CognitoIdentityProviderClient", "AdminUserGlobalSignOutCommand").f(AdminUserGlobalSignOutRequestFilterSensitiveLog, void 0).ser(se_AdminUserGlobalSignOutCommand).de(de_AdminUserGlobalSignOutCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/AssociateSoftwareTokenCommand.js
var import_dist121 = __toESM(require_dist());
var import_dist122 = __toESM(require_dist2());
var import_dist123 = __toESM(require_dist3());
var AssociateSoftwareTokenCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "AssociateSoftwareToken", {}).n("CognitoIdentityProviderClient", "AssociateSoftwareTokenCommand").f(AssociateSoftwareTokenRequestFilterSensitiveLog, AssociateSoftwareTokenResponseFilterSensitiveLog).ser(se_AssociateSoftwareTokenCommand).de(de_AssociateSoftwareTokenCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/ChangePasswordCommand.js
var import_dist124 = __toESM(require_dist());
var import_dist125 = __toESM(require_dist2());
var import_dist126 = __toESM(require_dist3());
var ChangePasswordCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "ChangePassword", {}).n("CognitoIdentityProviderClient", "ChangePasswordCommand").f(ChangePasswordRequestFilterSensitiveLog, void 0).ser(se_ChangePasswordCommand).de(de_ChangePasswordCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/CompleteWebAuthnRegistrationCommand.js
var import_dist127 = __toESM(require_dist());
var import_dist128 = __toESM(require_dist2());
var import_dist129 = __toESM(require_dist3());
var CompleteWebAuthnRegistrationCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "CompleteWebAuthnRegistration", {}).n("CognitoIdentityProviderClient", "CompleteWebAuthnRegistrationCommand").f(CompleteWebAuthnRegistrationRequestFilterSensitiveLog, void 0).ser(se_CompleteWebAuthnRegistrationCommand).de(de_CompleteWebAuthnRegistrationCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/ConfirmDeviceCommand.js
var import_dist130 = __toESM(require_dist());
var import_dist131 = __toESM(require_dist2());
var import_dist132 = __toESM(require_dist3());
var ConfirmDeviceCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "ConfirmDevice", {}).n("CognitoIdentityProviderClient", "ConfirmDeviceCommand").f(ConfirmDeviceRequestFilterSensitiveLog, void 0).ser(se_ConfirmDeviceCommand).de(de_ConfirmDeviceCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/ConfirmForgotPasswordCommand.js
var import_dist133 = __toESM(require_dist());
var import_dist134 = __toESM(require_dist2());
var import_dist135 = __toESM(require_dist3());
var ConfirmForgotPasswordCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "ConfirmForgotPassword", {}).n("CognitoIdentityProviderClient", "ConfirmForgotPasswordCommand").f(ConfirmForgotPasswordRequestFilterSensitiveLog, void 0).ser(se_ConfirmForgotPasswordCommand).de(de_ConfirmForgotPasswordCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/ConfirmSignUpCommand.js
var import_dist136 = __toESM(require_dist());
var import_dist137 = __toESM(require_dist2());
var import_dist138 = __toESM(require_dist3());
var ConfirmSignUpCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "ConfirmSignUp", {}).n("CognitoIdentityProviderClient", "ConfirmSignUpCommand").f(ConfirmSignUpRequestFilterSensitiveLog, ConfirmSignUpResponseFilterSensitiveLog).ser(se_ConfirmSignUpCommand).de(de_ConfirmSignUpCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/CreateGroupCommand.js
var import_dist139 = __toESM(require_dist());
var import_dist140 = __toESM(require_dist2());
var import_dist141 = __toESM(require_dist3());
var CreateGroupCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "CreateGroup", {}).n("CognitoIdentityProviderClient", "CreateGroupCommand").f(void 0, void 0).ser(se_CreateGroupCommand).de(de_CreateGroupCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/CreateIdentityProviderCommand.js
var import_dist142 = __toESM(require_dist());
var import_dist143 = __toESM(require_dist2());
var import_dist144 = __toESM(require_dist3());
var CreateIdentityProviderCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "CreateIdentityProvider", {}).n("CognitoIdentityProviderClient", "CreateIdentityProviderCommand").f(void 0, void 0).ser(se_CreateIdentityProviderCommand).de(de_CreateIdentityProviderCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/CreateManagedLoginBrandingCommand.js
var import_dist145 = __toESM(require_dist());
var import_dist146 = __toESM(require_dist2());
var import_dist147 = __toESM(require_dist3());
var CreateManagedLoginBrandingCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "CreateManagedLoginBranding", {}).n("CognitoIdentityProviderClient", "CreateManagedLoginBrandingCommand").f(CreateManagedLoginBrandingRequestFilterSensitiveLog, void 0).ser(se_CreateManagedLoginBrandingCommand).de(de_CreateManagedLoginBrandingCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/CreateResourceServerCommand.js
var import_dist148 = __toESM(require_dist());
var import_dist149 = __toESM(require_dist2());
var import_dist150 = __toESM(require_dist3());
var CreateResourceServerCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "CreateResourceServer", {}).n("CognitoIdentityProviderClient", "CreateResourceServerCommand").f(void 0, void 0).ser(se_CreateResourceServerCommand).de(de_CreateResourceServerCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/CreateUserImportJobCommand.js
var import_dist151 = __toESM(require_dist());
var import_dist152 = __toESM(require_dist2());
var import_dist153 = __toESM(require_dist3());
var CreateUserImportJobCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "CreateUserImportJob", {}).n("CognitoIdentityProviderClient", "CreateUserImportJobCommand").f(void 0, void 0).ser(se_CreateUserImportJobCommand).de(de_CreateUserImportJobCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/CreateUserPoolClientCommand.js
var import_dist154 = __toESM(require_dist());
var import_dist155 = __toESM(require_dist2());
var import_dist156 = __toESM(require_dist3());
var CreateUserPoolClientCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "CreateUserPoolClient", {}).n("CognitoIdentityProviderClient", "CreateUserPoolClientCommand").f(void 0, CreateUserPoolClientResponseFilterSensitiveLog).ser(se_CreateUserPoolClientCommand).de(de_CreateUserPoolClientCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/CreateUserPoolCommand.js
var import_dist157 = __toESM(require_dist());
var import_dist158 = __toESM(require_dist2());
var import_dist159 = __toESM(require_dist3());
var CreateUserPoolCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "CreateUserPool", {}).n("CognitoIdentityProviderClient", "CreateUserPoolCommand").f(void 0, void 0).ser(se_CreateUserPoolCommand).de(de_CreateUserPoolCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/CreateUserPoolDomainCommand.js
var import_dist160 = __toESM(require_dist());
var import_dist161 = __toESM(require_dist2());
var import_dist162 = __toESM(require_dist3());
var CreateUserPoolDomainCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "CreateUserPoolDomain", {}).n("CognitoIdentityProviderClient", "CreateUserPoolDomainCommand").f(void 0, void 0).ser(se_CreateUserPoolDomainCommand).de(de_CreateUserPoolDomainCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/DeleteGroupCommand.js
var import_dist163 = __toESM(require_dist());
var import_dist164 = __toESM(require_dist2());
var import_dist165 = __toESM(require_dist3());
var DeleteGroupCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "DeleteGroup", {}).n("CognitoIdentityProviderClient", "DeleteGroupCommand").f(void 0, void 0).ser(se_DeleteGroupCommand).de(de_DeleteGroupCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/DeleteIdentityProviderCommand.js
var import_dist166 = __toESM(require_dist());
var import_dist167 = __toESM(require_dist2());
var import_dist168 = __toESM(require_dist3());
var DeleteIdentityProviderCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "DeleteIdentityProvider", {}).n("CognitoIdentityProviderClient", "DeleteIdentityProviderCommand").f(void 0, void 0).ser(se_DeleteIdentityProviderCommand).de(de_DeleteIdentityProviderCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/DeleteManagedLoginBrandingCommand.js
var import_dist169 = __toESM(require_dist());
var import_dist170 = __toESM(require_dist2());
var import_dist171 = __toESM(require_dist3());
var DeleteManagedLoginBrandingCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "DeleteManagedLoginBranding", {}).n("CognitoIdentityProviderClient", "DeleteManagedLoginBrandingCommand").f(void 0, void 0).ser(se_DeleteManagedLoginBrandingCommand).de(de_DeleteManagedLoginBrandingCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/DeleteResourceServerCommand.js
var import_dist172 = __toESM(require_dist());
var import_dist173 = __toESM(require_dist2());
var import_dist174 = __toESM(require_dist3());
var DeleteResourceServerCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "DeleteResourceServer", {}).n("CognitoIdentityProviderClient", "DeleteResourceServerCommand").f(void 0, void 0).ser(se_DeleteResourceServerCommand).de(de_DeleteResourceServerCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/DeleteUserAttributesCommand.js
var import_dist175 = __toESM(require_dist());
var import_dist176 = __toESM(require_dist2());
var import_dist177 = __toESM(require_dist3());
var DeleteUserAttributesCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "DeleteUserAttributes", {}).n("CognitoIdentityProviderClient", "DeleteUserAttributesCommand").f(DeleteUserAttributesRequestFilterSensitiveLog, void 0).ser(se_DeleteUserAttributesCommand).de(de_DeleteUserAttributesCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/DeleteUserCommand.js
var import_dist178 = __toESM(require_dist());
var import_dist179 = __toESM(require_dist2());
var import_dist180 = __toESM(require_dist3());
var DeleteUserCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "DeleteUser", {}).n("CognitoIdentityProviderClient", "DeleteUserCommand").f(DeleteUserRequestFilterSensitiveLog, void 0).ser(se_DeleteUserCommand).de(de_DeleteUserCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/DeleteUserPoolClientCommand.js
var import_dist181 = __toESM(require_dist());
var import_dist182 = __toESM(require_dist2());
var import_dist183 = __toESM(require_dist3());
var DeleteUserPoolClientCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "DeleteUserPoolClient", {}).n("CognitoIdentityProviderClient", "DeleteUserPoolClientCommand").f(DeleteUserPoolClientRequestFilterSensitiveLog, void 0).ser(se_DeleteUserPoolClientCommand).de(de_DeleteUserPoolClientCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/DeleteUserPoolCommand.js
var import_dist184 = __toESM(require_dist());
var import_dist185 = __toESM(require_dist2());
var import_dist186 = __toESM(require_dist3());
var DeleteUserPoolCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "DeleteUserPool", {}).n("CognitoIdentityProviderClient", "DeleteUserPoolCommand").f(void 0, void 0).ser(se_DeleteUserPoolCommand).de(de_DeleteUserPoolCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/DeleteUserPoolDomainCommand.js
var import_dist187 = __toESM(require_dist());
var import_dist188 = __toESM(require_dist2());
var import_dist189 = __toESM(require_dist3());
var DeleteUserPoolDomainCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "DeleteUserPoolDomain", {}).n("CognitoIdentityProviderClient", "DeleteUserPoolDomainCommand").f(void 0, void 0).ser(se_DeleteUserPoolDomainCommand).de(de_DeleteUserPoolDomainCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/DeleteWebAuthnCredentialCommand.js
var import_dist190 = __toESM(require_dist());
var import_dist191 = __toESM(require_dist2());
var import_dist192 = __toESM(require_dist3());
var DeleteWebAuthnCredentialCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "DeleteWebAuthnCredential", {}).n("CognitoIdentityProviderClient", "DeleteWebAuthnCredentialCommand").f(DeleteWebAuthnCredentialRequestFilterSensitiveLog, void 0).ser(se_DeleteWebAuthnCredentialCommand).de(de_DeleteWebAuthnCredentialCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/DescribeIdentityProviderCommand.js
var import_dist193 = __toESM(require_dist());
var import_dist194 = __toESM(require_dist2());
var import_dist195 = __toESM(require_dist3());
var DescribeIdentityProviderCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "DescribeIdentityProvider", {}).n("CognitoIdentityProviderClient", "DescribeIdentityProviderCommand").f(void 0, void 0).ser(se_DescribeIdentityProviderCommand).de(de_DescribeIdentityProviderCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/DescribeManagedLoginBrandingByClientCommand.js
var import_dist196 = __toESM(require_dist());
var import_dist197 = __toESM(require_dist2());
var import_dist198 = __toESM(require_dist3());
var DescribeManagedLoginBrandingByClientCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "DescribeManagedLoginBrandingByClient", {}).n("CognitoIdentityProviderClient", "DescribeManagedLoginBrandingByClientCommand").f(DescribeManagedLoginBrandingByClientRequestFilterSensitiveLog, void 0).ser(se_DescribeManagedLoginBrandingByClientCommand).de(de_DescribeManagedLoginBrandingByClientCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/DescribeManagedLoginBrandingCommand.js
var import_dist199 = __toESM(require_dist());
var import_dist200 = __toESM(require_dist2());
var import_dist201 = __toESM(require_dist3());
var DescribeManagedLoginBrandingCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "DescribeManagedLoginBranding", {}).n("CognitoIdentityProviderClient", "DescribeManagedLoginBrandingCommand").f(void 0, void 0).ser(se_DescribeManagedLoginBrandingCommand).de(de_DescribeManagedLoginBrandingCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/DescribeResourceServerCommand.js
var import_dist202 = __toESM(require_dist());
var import_dist203 = __toESM(require_dist2());
var import_dist204 = __toESM(require_dist3());
var DescribeResourceServerCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "DescribeResourceServer", {}).n("CognitoIdentityProviderClient", "DescribeResourceServerCommand").f(void 0, void 0).ser(se_DescribeResourceServerCommand).de(de_DescribeResourceServerCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/DescribeRiskConfigurationCommand.js
var import_dist205 = __toESM(require_dist());
var import_dist206 = __toESM(require_dist2());
var import_dist207 = __toESM(require_dist3());
var DescribeRiskConfigurationCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "DescribeRiskConfiguration", {}).n("CognitoIdentityProviderClient", "DescribeRiskConfigurationCommand").f(DescribeRiskConfigurationRequestFilterSensitiveLog, DescribeRiskConfigurationResponseFilterSensitiveLog).ser(se_DescribeRiskConfigurationCommand).de(de_DescribeRiskConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/DescribeUserImportJobCommand.js
var import_dist208 = __toESM(require_dist());
var import_dist209 = __toESM(require_dist2());
var import_dist210 = __toESM(require_dist3());
var DescribeUserImportJobCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "DescribeUserImportJob", {}).n("CognitoIdentityProviderClient", "DescribeUserImportJobCommand").f(void 0, void 0).ser(se_DescribeUserImportJobCommand).de(de_DescribeUserImportJobCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/DescribeUserPoolClientCommand.js
var import_dist211 = __toESM(require_dist());
var import_dist212 = __toESM(require_dist2());
var import_dist213 = __toESM(require_dist3());
var DescribeUserPoolClientCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "DescribeUserPoolClient", {}).n("CognitoIdentityProviderClient", "DescribeUserPoolClientCommand").f(DescribeUserPoolClientRequestFilterSensitiveLog, DescribeUserPoolClientResponseFilterSensitiveLog).ser(se_DescribeUserPoolClientCommand).de(de_DescribeUserPoolClientCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/DescribeUserPoolCommand.js
var import_dist214 = __toESM(require_dist());
var import_dist215 = __toESM(require_dist2());
var import_dist216 = __toESM(require_dist3());
var DescribeUserPoolCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "DescribeUserPool", {}).n("CognitoIdentityProviderClient", "DescribeUserPoolCommand").f(void 0, void 0).ser(se_DescribeUserPoolCommand).de(de_DescribeUserPoolCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/DescribeUserPoolDomainCommand.js
var import_dist217 = __toESM(require_dist());
var import_dist218 = __toESM(require_dist2());
var import_dist219 = __toESM(require_dist3());
var DescribeUserPoolDomainCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "DescribeUserPoolDomain", {}).n("CognitoIdentityProviderClient", "DescribeUserPoolDomainCommand").f(void 0, void 0).ser(se_DescribeUserPoolDomainCommand).de(de_DescribeUserPoolDomainCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/ForgetDeviceCommand.js
var import_dist220 = __toESM(require_dist());
var import_dist221 = __toESM(require_dist2());
var import_dist222 = __toESM(require_dist3());
var ForgetDeviceCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "ForgetDevice", {}).n("CognitoIdentityProviderClient", "ForgetDeviceCommand").f(ForgetDeviceRequestFilterSensitiveLog, void 0).ser(se_ForgetDeviceCommand).de(de_ForgetDeviceCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/ForgotPasswordCommand.js
var import_dist223 = __toESM(require_dist());
var import_dist224 = __toESM(require_dist2());
var import_dist225 = __toESM(require_dist3());
var ForgotPasswordCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "ForgotPassword", {}).n("CognitoIdentityProviderClient", "ForgotPasswordCommand").f(ForgotPasswordRequestFilterSensitiveLog, void 0).ser(se_ForgotPasswordCommand).de(de_ForgotPasswordCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/GetCSVHeaderCommand.js
var import_dist226 = __toESM(require_dist());
var import_dist227 = __toESM(require_dist2());
var import_dist228 = __toESM(require_dist3());
var GetCSVHeaderCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "GetCSVHeader", {}).n("CognitoIdentityProviderClient", "GetCSVHeaderCommand").f(void 0, void 0).ser(se_GetCSVHeaderCommand).de(de_GetCSVHeaderCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/GetDeviceCommand.js
var import_dist229 = __toESM(require_dist());
var import_dist230 = __toESM(require_dist2());
var import_dist231 = __toESM(require_dist3());
var GetDeviceCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "GetDevice", {}).n("CognitoIdentityProviderClient", "GetDeviceCommand").f(GetDeviceRequestFilterSensitiveLog, GetDeviceResponseFilterSensitiveLog).ser(se_GetDeviceCommand).de(de_GetDeviceCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/GetGroupCommand.js
var import_dist232 = __toESM(require_dist());
var import_dist233 = __toESM(require_dist2());
var import_dist234 = __toESM(require_dist3());
var GetGroupCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "GetGroup", {}).n("CognitoIdentityProviderClient", "GetGroupCommand").f(void 0, void 0).ser(se_GetGroupCommand).de(de_GetGroupCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/GetIdentityProviderByIdentifierCommand.js
var import_dist235 = __toESM(require_dist());
var import_dist236 = __toESM(require_dist2());
var import_dist237 = __toESM(require_dist3());
var GetIdentityProviderByIdentifierCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "GetIdentityProviderByIdentifier", {}).n("CognitoIdentityProviderClient", "GetIdentityProviderByIdentifierCommand").f(void 0, void 0).ser(se_GetIdentityProviderByIdentifierCommand).de(de_GetIdentityProviderByIdentifierCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/GetLogDeliveryConfigurationCommand.js
var import_dist238 = __toESM(require_dist());
var import_dist239 = __toESM(require_dist2());
var import_dist240 = __toESM(require_dist3());
var GetLogDeliveryConfigurationCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "GetLogDeliveryConfiguration", {}).n("CognitoIdentityProviderClient", "GetLogDeliveryConfigurationCommand").f(void 0, void 0).ser(se_GetLogDeliveryConfigurationCommand).de(de_GetLogDeliveryConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/GetSigningCertificateCommand.js
var import_dist241 = __toESM(require_dist());
var import_dist242 = __toESM(require_dist2());
var import_dist243 = __toESM(require_dist3());
var GetSigningCertificateCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "GetSigningCertificate", {}).n("CognitoIdentityProviderClient", "GetSigningCertificateCommand").f(void 0, void 0).ser(se_GetSigningCertificateCommand).de(de_GetSigningCertificateCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/GetUICustomizationCommand.js
var import_dist244 = __toESM(require_dist());
var import_dist245 = __toESM(require_dist2());
var import_dist246 = __toESM(require_dist3());
var GetUICustomizationCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "GetUICustomization", {}).n("CognitoIdentityProviderClient", "GetUICustomizationCommand").f(GetUICustomizationRequestFilterSensitiveLog, GetUICustomizationResponseFilterSensitiveLog).ser(se_GetUICustomizationCommand).de(de_GetUICustomizationCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/GetUserAttributeVerificationCodeCommand.js
var import_dist247 = __toESM(require_dist());
var import_dist248 = __toESM(require_dist2());
var import_dist249 = __toESM(require_dist3());
var GetUserAttributeVerificationCodeCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "GetUserAttributeVerificationCode", {}).n("CognitoIdentityProviderClient", "GetUserAttributeVerificationCodeCommand").f(GetUserAttributeVerificationCodeRequestFilterSensitiveLog, void 0).ser(se_GetUserAttributeVerificationCodeCommand).de(de_GetUserAttributeVerificationCodeCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/GetUserAuthFactorsCommand.js
var import_dist250 = __toESM(require_dist());
var import_dist251 = __toESM(require_dist2());
var import_dist252 = __toESM(require_dist3());
var GetUserAuthFactorsCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "GetUserAuthFactors", {}).n("CognitoIdentityProviderClient", "GetUserAuthFactorsCommand").f(GetUserAuthFactorsRequestFilterSensitiveLog, GetUserAuthFactorsResponseFilterSensitiveLog).ser(se_GetUserAuthFactorsCommand).de(de_GetUserAuthFactorsCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/GetUserCommand.js
var import_dist253 = __toESM(require_dist());
var import_dist254 = __toESM(require_dist2());
var import_dist255 = __toESM(require_dist3());
var GetUserCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "GetUser", {}).n("CognitoIdentityProviderClient", "GetUserCommand").f(GetUserRequestFilterSensitiveLog, GetUserResponseFilterSensitiveLog).ser(se_GetUserCommand).de(de_GetUserCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/GetUserPoolMfaConfigCommand.js
var import_dist256 = __toESM(require_dist());
var import_dist257 = __toESM(require_dist2());
var import_dist258 = __toESM(require_dist3());
var GetUserPoolMfaConfigCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "GetUserPoolMfaConfig", {}).n("CognitoIdentityProviderClient", "GetUserPoolMfaConfigCommand").f(void 0, void 0).ser(se_GetUserPoolMfaConfigCommand).de(de_GetUserPoolMfaConfigCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/GlobalSignOutCommand.js
var import_dist259 = __toESM(require_dist());
var import_dist260 = __toESM(require_dist2());
var import_dist261 = __toESM(require_dist3());
var GlobalSignOutCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "GlobalSignOut", {}).n("CognitoIdentityProviderClient", "GlobalSignOutCommand").f(GlobalSignOutRequestFilterSensitiveLog, void 0).ser(se_GlobalSignOutCommand).de(de_GlobalSignOutCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/InitiateAuthCommand.js
var import_dist262 = __toESM(require_dist());
var import_dist263 = __toESM(require_dist2());
var import_dist264 = __toESM(require_dist3());
var InitiateAuthCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "InitiateAuth", {}).n("CognitoIdentityProviderClient", "InitiateAuthCommand").f(InitiateAuthRequestFilterSensitiveLog, InitiateAuthResponseFilterSensitiveLog).ser(se_InitiateAuthCommand).de(de_InitiateAuthCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/ListDevicesCommand.js
var import_dist265 = __toESM(require_dist());
var import_dist266 = __toESM(require_dist2());
var import_dist267 = __toESM(require_dist3());
var ListDevicesCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "ListDevices", {}).n("CognitoIdentityProviderClient", "ListDevicesCommand").f(ListDevicesRequestFilterSensitiveLog, ListDevicesResponseFilterSensitiveLog).ser(se_ListDevicesCommand).de(de_ListDevicesCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/ListGroupsCommand.js
var import_dist268 = __toESM(require_dist());
var import_dist269 = __toESM(require_dist2());
var import_dist270 = __toESM(require_dist3());
var ListGroupsCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "ListGroups", {}).n("CognitoIdentityProviderClient", "ListGroupsCommand").f(void 0, void 0).ser(se_ListGroupsCommand).de(de_ListGroupsCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/ListIdentityProvidersCommand.js
var import_dist271 = __toESM(require_dist());
var import_dist272 = __toESM(require_dist2());
var import_dist273 = __toESM(require_dist3());
var ListIdentityProvidersCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "ListIdentityProviders", {}).n("CognitoIdentityProviderClient", "ListIdentityProvidersCommand").f(void 0, void 0).ser(se_ListIdentityProvidersCommand).de(de_ListIdentityProvidersCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/ListResourceServersCommand.js
var import_dist274 = __toESM(require_dist());
var import_dist275 = __toESM(require_dist2());
var import_dist276 = __toESM(require_dist3());
var ListResourceServersCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "ListResourceServers", {}).n("CognitoIdentityProviderClient", "ListResourceServersCommand").f(void 0, void 0).ser(se_ListResourceServersCommand).de(de_ListResourceServersCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/ListTagsForResourceCommand.js
var import_dist277 = __toESM(require_dist());
var import_dist278 = __toESM(require_dist2());
var import_dist279 = __toESM(require_dist3());
var ListTagsForResourceCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "ListTagsForResource", {}).n("CognitoIdentityProviderClient", "ListTagsForResourceCommand").f(void 0, void 0).ser(se_ListTagsForResourceCommand).de(de_ListTagsForResourceCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/ListUserImportJobsCommand.js
var import_dist280 = __toESM(require_dist());
var import_dist281 = __toESM(require_dist2());
var import_dist282 = __toESM(require_dist3());
var ListUserImportJobsCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "ListUserImportJobs", {}).n("CognitoIdentityProviderClient", "ListUserImportJobsCommand").f(void 0, void 0).ser(se_ListUserImportJobsCommand).de(de_ListUserImportJobsCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/ListUserPoolClientsCommand.js
var import_dist283 = __toESM(require_dist());
var import_dist284 = __toESM(require_dist2());
var import_dist285 = __toESM(require_dist3());
var ListUserPoolClientsCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "ListUserPoolClients", {}).n("CognitoIdentityProviderClient", "ListUserPoolClientsCommand").f(void 0, ListUserPoolClientsResponseFilterSensitiveLog).ser(se_ListUserPoolClientsCommand).de(de_ListUserPoolClientsCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/ListUserPoolsCommand.js
var import_dist286 = __toESM(require_dist());
var import_dist287 = __toESM(require_dist2());
var import_dist288 = __toESM(require_dist3());
var ListUserPoolsCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "ListUserPools", {}).n("CognitoIdentityProviderClient", "ListUserPoolsCommand").f(void 0, void 0).ser(se_ListUserPoolsCommand).de(de_ListUserPoolsCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/ListUsersCommand.js
var import_dist289 = __toESM(require_dist());
var import_dist290 = __toESM(require_dist2());
var import_dist291 = __toESM(require_dist3());
var ListUsersCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "ListUsers", {}).n("CognitoIdentityProviderClient", "ListUsersCommand").f(void 0, ListUsersResponseFilterSensitiveLog).ser(se_ListUsersCommand).de(de_ListUsersCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/ListUsersInGroupCommand.js
var import_dist292 = __toESM(require_dist());
var import_dist293 = __toESM(require_dist2());
var import_dist294 = __toESM(require_dist3());
var ListUsersInGroupCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "ListUsersInGroup", {}).n("CognitoIdentityProviderClient", "ListUsersInGroupCommand").f(void 0, ListUsersInGroupResponseFilterSensitiveLog).ser(se_ListUsersInGroupCommand).de(de_ListUsersInGroupCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/ListWebAuthnCredentialsCommand.js
var import_dist295 = __toESM(require_dist());
var import_dist296 = __toESM(require_dist2());
var import_dist297 = __toESM(require_dist3());
var ListWebAuthnCredentialsCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "ListWebAuthnCredentials", {}).n("CognitoIdentityProviderClient", "ListWebAuthnCredentialsCommand").f(ListWebAuthnCredentialsRequestFilterSensitiveLog, void 0).ser(se_ListWebAuthnCredentialsCommand).de(de_ListWebAuthnCredentialsCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/ResendConfirmationCodeCommand.js
var import_dist298 = __toESM(require_dist());
var import_dist299 = __toESM(require_dist2());
var import_dist300 = __toESM(require_dist3());
var ResendConfirmationCodeCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "ResendConfirmationCode", {}).n("CognitoIdentityProviderClient", "ResendConfirmationCodeCommand").f(ResendConfirmationCodeRequestFilterSensitiveLog, void 0).ser(se_ResendConfirmationCodeCommand).de(de_ResendConfirmationCodeCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/RespondToAuthChallengeCommand.js
var import_dist301 = __toESM(require_dist());
var import_dist302 = __toESM(require_dist2());
var import_dist303 = __toESM(require_dist3());
var RespondToAuthChallengeCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "RespondToAuthChallenge", {}).n("CognitoIdentityProviderClient", "RespondToAuthChallengeCommand").f(RespondToAuthChallengeRequestFilterSensitiveLog, RespondToAuthChallengeResponseFilterSensitiveLog).ser(se_RespondToAuthChallengeCommand).de(de_RespondToAuthChallengeCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/RevokeTokenCommand.js
var import_dist304 = __toESM(require_dist());
var import_dist305 = __toESM(require_dist2());
var import_dist306 = __toESM(require_dist3());
var RevokeTokenCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "RevokeToken", {}).n("CognitoIdentityProviderClient", "RevokeTokenCommand").f(RevokeTokenRequestFilterSensitiveLog, void 0).ser(se_RevokeTokenCommand).de(de_RevokeTokenCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/SetLogDeliveryConfigurationCommand.js
var import_dist307 = __toESM(require_dist());
var import_dist308 = __toESM(require_dist2());
var import_dist309 = __toESM(require_dist3());
var SetLogDeliveryConfigurationCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "SetLogDeliveryConfiguration", {}).n("CognitoIdentityProviderClient", "SetLogDeliveryConfigurationCommand").f(void 0, void 0).ser(se_SetLogDeliveryConfigurationCommand).de(de_SetLogDeliveryConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/SetRiskConfigurationCommand.js
var import_dist310 = __toESM(require_dist());
var import_dist311 = __toESM(require_dist2());
var import_dist312 = __toESM(require_dist3());
var SetRiskConfigurationCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "SetRiskConfiguration", {}).n("CognitoIdentityProviderClient", "SetRiskConfigurationCommand").f(SetRiskConfigurationRequestFilterSensitiveLog, SetRiskConfigurationResponseFilterSensitiveLog).ser(se_SetRiskConfigurationCommand).de(de_SetRiskConfigurationCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/SetUICustomizationCommand.js
var import_dist313 = __toESM(require_dist());
var import_dist314 = __toESM(require_dist2());
var import_dist315 = __toESM(require_dist3());
var SetUICustomizationCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "SetUICustomization", {}).n("CognitoIdentityProviderClient", "SetUICustomizationCommand").f(SetUICustomizationRequestFilterSensitiveLog, SetUICustomizationResponseFilterSensitiveLog).ser(se_SetUICustomizationCommand).de(de_SetUICustomizationCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/SetUserMFAPreferenceCommand.js
var import_dist316 = __toESM(require_dist());
var import_dist317 = __toESM(require_dist2());
var import_dist318 = __toESM(require_dist3());
var SetUserMFAPreferenceCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "SetUserMFAPreference", {}).n("CognitoIdentityProviderClient", "SetUserMFAPreferenceCommand").f(SetUserMFAPreferenceRequestFilterSensitiveLog, void 0).ser(se_SetUserMFAPreferenceCommand).de(de_SetUserMFAPreferenceCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/SetUserPoolMfaConfigCommand.js
var import_dist319 = __toESM(require_dist());
var import_dist320 = __toESM(require_dist2());
var import_dist321 = __toESM(require_dist3());
var SetUserPoolMfaConfigCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "SetUserPoolMfaConfig", {}).n("CognitoIdentityProviderClient", "SetUserPoolMfaConfigCommand").f(void 0, void 0).ser(se_SetUserPoolMfaConfigCommand).de(de_SetUserPoolMfaConfigCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/SetUserSettingsCommand.js
var import_dist322 = __toESM(require_dist());
var import_dist323 = __toESM(require_dist2());
var import_dist324 = __toESM(require_dist3());
var SetUserSettingsCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "SetUserSettings", {}).n("CognitoIdentityProviderClient", "SetUserSettingsCommand").f(SetUserSettingsRequestFilterSensitiveLog, void 0).ser(se_SetUserSettingsCommand).de(de_SetUserSettingsCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/SignUpCommand.js
var import_dist325 = __toESM(require_dist());
var import_dist326 = __toESM(require_dist2());
var import_dist327 = __toESM(require_dist3());
var SignUpCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "SignUp", {}).n("CognitoIdentityProviderClient", "SignUpCommand").f(SignUpRequestFilterSensitiveLog, SignUpResponseFilterSensitiveLog).ser(se_SignUpCommand).de(de_SignUpCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/StartUserImportJobCommand.js
var import_dist328 = __toESM(require_dist());
var import_dist329 = __toESM(require_dist2());
var import_dist330 = __toESM(require_dist3());
var StartUserImportJobCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "StartUserImportJob", {}).n("CognitoIdentityProviderClient", "StartUserImportJobCommand").f(void 0, void 0).ser(se_StartUserImportJobCommand).de(de_StartUserImportJobCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/StartWebAuthnRegistrationCommand.js
var import_dist331 = __toESM(require_dist());
var import_dist332 = __toESM(require_dist2());
var import_dist333 = __toESM(require_dist3());
var StartWebAuthnRegistrationCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "StartWebAuthnRegistration", {}).n("CognitoIdentityProviderClient", "StartWebAuthnRegistrationCommand").f(StartWebAuthnRegistrationRequestFilterSensitiveLog, void 0).ser(se_StartWebAuthnRegistrationCommand).de(de_StartWebAuthnRegistrationCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/StopUserImportJobCommand.js
var import_dist334 = __toESM(require_dist());
var import_dist335 = __toESM(require_dist2());
var import_dist336 = __toESM(require_dist3());
var StopUserImportJobCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "StopUserImportJob", {}).n("CognitoIdentityProviderClient", "StopUserImportJobCommand").f(void 0, void 0).ser(se_StopUserImportJobCommand).de(de_StopUserImportJobCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/TagResourceCommand.js
var import_dist337 = __toESM(require_dist());
var import_dist338 = __toESM(require_dist2());
var import_dist339 = __toESM(require_dist3());
var TagResourceCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "TagResource", {}).n("CognitoIdentityProviderClient", "TagResourceCommand").f(void 0, void 0).ser(se_TagResourceCommand).de(de_TagResourceCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/UntagResourceCommand.js
var import_dist340 = __toESM(require_dist());
var import_dist341 = __toESM(require_dist2());
var import_dist342 = __toESM(require_dist3());
var UntagResourceCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "UntagResource", {}).n("CognitoIdentityProviderClient", "UntagResourceCommand").f(void 0, void 0).ser(se_UntagResourceCommand).de(de_UntagResourceCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/UpdateAuthEventFeedbackCommand.js
var import_dist343 = __toESM(require_dist());
var import_dist344 = __toESM(require_dist2());
var import_dist345 = __toESM(require_dist3());
var UpdateAuthEventFeedbackCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "UpdateAuthEventFeedback", {}).n("CognitoIdentityProviderClient", "UpdateAuthEventFeedbackCommand").f(UpdateAuthEventFeedbackRequestFilterSensitiveLog, void 0).ser(se_UpdateAuthEventFeedbackCommand).de(de_UpdateAuthEventFeedbackCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/UpdateDeviceStatusCommand.js
var import_dist346 = __toESM(require_dist());
var import_dist347 = __toESM(require_dist2());
var import_dist348 = __toESM(require_dist3());
var UpdateDeviceStatusCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "UpdateDeviceStatus", {}).n("CognitoIdentityProviderClient", "UpdateDeviceStatusCommand").f(UpdateDeviceStatusRequestFilterSensitiveLog, void 0).ser(se_UpdateDeviceStatusCommand).de(de_UpdateDeviceStatusCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/UpdateGroupCommand.js
var import_dist349 = __toESM(require_dist());
var import_dist350 = __toESM(require_dist2());
var import_dist351 = __toESM(require_dist3());
var UpdateGroupCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "UpdateGroup", {}).n("CognitoIdentityProviderClient", "UpdateGroupCommand").f(void 0, void 0).ser(se_UpdateGroupCommand).de(de_UpdateGroupCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/UpdateIdentityProviderCommand.js
var import_dist352 = __toESM(require_dist());
var import_dist353 = __toESM(require_dist2());
var import_dist354 = __toESM(require_dist3());
var UpdateIdentityProviderCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "UpdateIdentityProvider", {}).n("CognitoIdentityProviderClient", "UpdateIdentityProviderCommand").f(void 0, void 0).ser(se_UpdateIdentityProviderCommand).de(de_UpdateIdentityProviderCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/UpdateManagedLoginBrandingCommand.js
var import_dist355 = __toESM(require_dist());
var import_dist356 = __toESM(require_dist2());
var import_dist357 = __toESM(require_dist3());
var UpdateManagedLoginBrandingCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "UpdateManagedLoginBranding", {}).n("CognitoIdentityProviderClient", "UpdateManagedLoginBrandingCommand").f(void 0, void 0).ser(se_UpdateManagedLoginBrandingCommand).de(de_UpdateManagedLoginBrandingCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/UpdateResourceServerCommand.js
var import_dist358 = __toESM(require_dist());
var import_dist359 = __toESM(require_dist2());
var import_dist360 = __toESM(require_dist3());
var UpdateResourceServerCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "UpdateResourceServer", {}).n("CognitoIdentityProviderClient", "UpdateResourceServerCommand").f(void 0, void 0).ser(se_UpdateResourceServerCommand).de(de_UpdateResourceServerCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/UpdateUserAttributesCommand.js
var import_dist361 = __toESM(require_dist());
var import_dist362 = __toESM(require_dist2());
var import_dist363 = __toESM(require_dist3());
var UpdateUserAttributesCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "UpdateUserAttributes", {}).n("CognitoIdentityProviderClient", "UpdateUserAttributesCommand").f(UpdateUserAttributesRequestFilterSensitiveLog, void 0).ser(se_UpdateUserAttributesCommand).de(de_UpdateUserAttributesCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/UpdateUserPoolClientCommand.js
var import_dist364 = __toESM(require_dist());
var import_dist365 = __toESM(require_dist2());
var import_dist366 = __toESM(require_dist3());
var UpdateUserPoolClientCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "UpdateUserPoolClient", {}).n("CognitoIdentityProviderClient", "UpdateUserPoolClientCommand").f(UpdateUserPoolClientRequestFilterSensitiveLog, UpdateUserPoolClientResponseFilterSensitiveLog).ser(se_UpdateUserPoolClientCommand).de(de_UpdateUserPoolClientCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/UpdateUserPoolCommand.js
var import_dist367 = __toESM(require_dist());
var import_dist368 = __toESM(require_dist2());
var import_dist369 = __toESM(require_dist3());
var UpdateUserPoolCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "UpdateUserPool", {}).n("CognitoIdentityProviderClient", "UpdateUserPoolCommand").f(void 0, void 0).ser(se_UpdateUserPoolCommand).de(de_UpdateUserPoolCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/UpdateUserPoolDomainCommand.js
var import_dist370 = __toESM(require_dist());
var import_dist371 = __toESM(require_dist2());
var import_dist372 = __toESM(require_dist3());
var UpdateUserPoolDomainCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "UpdateUserPoolDomain", {}).n("CognitoIdentityProviderClient", "UpdateUserPoolDomainCommand").f(void 0, void 0).ser(se_UpdateUserPoolDomainCommand).de(de_UpdateUserPoolDomainCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/VerifySoftwareTokenCommand.js
var import_dist373 = __toESM(require_dist());
var import_dist374 = __toESM(require_dist2());
var import_dist375 = __toESM(require_dist3());
var VerifySoftwareTokenCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "VerifySoftwareToken", {}).n("CognitoIdentityProviderClient", "VerifySoftwareTokenCommand").f(VerifySoftwareTokenRequestFilterSensitiveLog, VerifySoftwareTokenResponseFilterSensitiveLog).ser(se_VerifySoftwareTokenCommand).de(de_VerifySoftwareTokenCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/VerifyUserAttributeCommand.js
var import_dist376 = __toESM(require_dist());
var import_dist377 = __toESM(require_dist2());
var import_dist378 = __toESM(require_dist3());
var VerifyUserAttributeCommand = class extends Command.classBuilder().ep(commonParams).m(function(Command2, cs, config, o2) {
  return [
    getSerdePlugin(config, this.serialize, this.deserialize),
    getEndpointPlugin(config, Command2.getEndpointParameterInstructions())
  ];
}).s("AWSCognitoIdentityProviderService", "VerifyUserAttribute", {}).n("CognitoIdentityProviderClient", "VerifyUserAttributeCommand").f(VerifyUserAttributeRequestFilterSensitiveLog, void 0).ser(se_VerifyUserAttributeCommand).de(de_VerifyUserAttributeCommand).build() {
};

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/CognitoIdentityProvider.js
var commands = {
  AddCustomAttributesCommand,
  AdminAddUserToGroupCommand,
  AdminConfirmSignUpCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminDeleteUserAttributesCommand,
  AdminDisableProviderForUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminForgetDeviceCommand,
  AdminGetDeviceCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
  AdminLinkProviderForUserCommand,
  AdminListDevicesCommand,
  AdminListGroupsForUserCommand,
  AdminListUserAuthEventsCommand,
  AdminRemoveUserFromGroupCommand,
  AdminResetUserPasswordCommand,
  AdminRespondToAuthChallengeCommand,
  AdminSetUserMFAPreferenceCommand,
  AdminSetUserPasswordCommand,
  AdminSetUserSettingsCommand,
  AdminUpdateAuthEventFeedbackCommand,
  AdminUpdateDeviceStatusCommand,
  AdminUpdateUserAttributesCommand,
  AdminUserGlobalSignOutCommand,
  AssociateSoftwareTokenCommand,
  ChangePasswordCommand,
  CompleteWebAuthnRegistrationCommand,
  ConfirmDeviceCommand,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  CreateGroupCommand,
  CreateIdentityProviderCommand,
  CreateManagedLoginBrandingCommand,
  CreateResourceServerCommand,
  CreateUserImportJobCommand,
  CreateUserPoolCommand,
  CreateUserPoolClientCommand,
  CreateUserPoolDomainCommand,
  DeleteGroupCommand,
  DeleteIdentityProviderCommand,
  DeleteManagedLoginBrandingCommand,
  DeleteResourceServerCommand,
  DeleteUserCommand,
  DeleteUserAttributesCommand,
  DeleteUserPoolCommand,
  DeleteUserPoolClientCommand,
  DeleteUserPoolDomainCommand,
  DeleteWebAuthnCredentialCommand,
  DescribeIdentityProviderCommand,
  DescribeManagedLoginBrandingCommand,
  DescribeManagedLoginBrandingByClientCommand,
  DescribeResourceServerCommand,
  DescribeRiskConfigurationCommand,
  DescribeUserImportJobCommand,
  DescribeUserPoolCommand,
  DescribeUserPoolClientCommand,
  DescribeUserPoolDomainCommand,
  ForgetDeviceCommand,
  ForgotPasswordCommand,
  GetCSVHeaderCommand,
  GetDeviceCommand,
  GetGroupCommand,
  GetIdentityProviderByIdentifierCommand,
  GetLogDeliveryConfigurationCommand,
  GetSigningCertificateCommand,
  GetUICustomizationCommand,
  GetUserCommand,
  GetUserAttributeVerificationCodeCommand,
  GetUserAuthFactorsCommand,
  GetUserPoolMfaConfigCommand,
  GlobalSignOutCommand,
  InitiateAuthCommand,
  ListDevicesCommand,
  ListGroupsCommand,
  ListIdentityProvidersCommand,
  ListResourceServersCommand,
  ListTagsForResourceCommand,
  ListUserImportJobsCommand,
  ListUserPoolClientsCommand,
  ListUserPoolsCommand,
  ListUsersCommand,
  ListUsersInGroupCommand,
  ListWebAuthnCredentialsCommand,
  ResendConfirmationCodeCommand,
  RespondToAuthChallengeCommand,
  RevokeTokenCommand,
  SetLogDeliveryConfigurationCommand,
  SetRiskConfigurationCommand,
  SetUICustomizationCommand,
  SetUserMFAPreferenceCommand,
  SetUserPoolMfaConfigCommand,
  SetUserSettingsCommand,
  SignUpCommand,
  StartUserImportJobCommand,
  StartWebAuthnRegistrationCommand,
  StopUserImportJobCommand,
  TagResourceCommand,
  UntagResourceCommand,
  UpdateAuthEventFeedbackCommand,
  UpdateDeviceStatusCommand,
  UpdateGroupCommand,
  UpdateIdentityProviderCommand,
  UpdateManagedLoginBrandingCommand,
  UpdateResourceServerCommand,
  UpdateUserAttributesCommand,
  UpdateUserPoolCommand,
  UpdateUserPoolClientCommand,
  UpdateUserPoolDomainCommand,
  VerifySoftwareTokenCommand,
  VerifyUserAttributeCommand
};
var CognitoIdentityProvider = class extends CognitoIdentityProviderClient {
};
createAggregatedClient(commands, CognitoIdentityProvider);

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/commands/index.js
var import_dist382 = __toESM(require_dist());
var import_dist383 = __toESM(require_dist2());
var import_dist384 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/pagination/index.js
var import_dist415 = __toESM(require_dist());
var import_dist416 = __toESM(require_dist2());
var import_dist417 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/pagination/AdminListGroupsForUserPaginator.js
var import_dist385 = __toESM(require_dist());
var import_dist386 = __toESM(require_dist2());
var import_dist387 = __toESM(require_dist3());
var paginateAdminListGroupsForUser = createPaginator(CognitoIdentityProviderClient, AdminListGroupsForUserCommand, "NextToken", "NextToken", "Limit");

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/pagination/AdminListUserAuthEventsPaginator.js
var import_dist388 = __toESM(require_dist());
var import_dist389 = __toESM(require_dist2());
var import_dist390 = __toESM(require_dist3());
var paginateAdminListUserAuthEvents = createPaginator(CognitoIdentityProviderClient, AdminListUserAuthEventsCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/pagination/Interfaces.js
var import_dist391 = __toESM(require_dist());
var import_dist392 = __toESM(require_dist2());
var import_dist393 = __toESM(require_dist3());

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/pagination/ListGroupsPaginator.js
var import_dist394 = __toESM(require_dist());
var import_dist395 = __toESM(require_dist2());
var import_dist396 = __toESM(require_dist3());
var paginateListGroups = createPaginator(CognitoIdentityProviderClient, ListGroupsCommand, "NextToken", "NextToken", "Limit");

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/pagination/ListIdentityProvidersPaginator.js
var import_dist397 = __toESM(require_dist());
var import_dist398 = __toESM(require_dist2());
var import_dist399 = __toESM(require_dist3());
var paginateListIdentityProviders = createPaginator(CognitoIdentityProviderClient, ListIdentityProvidersCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/pagination/ListResourceServersPaginator.js
var import_dist400 = __toESM(require_dist());
var import_dist401 = __toESM(require_dist2());
var import_dist402 = __toESM(require_dist3());
var paginateListResourceServers = createPaginator(CognitoIdentityProviderClient, ListResourceServersCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/pagination/ListUserPoolClientsPaginator.js
var import_dist403 = __toESM(require_dist());
var import_dist404 = __toESM(require_dist2());
var import_dist405 = __toESM(require_dist3());
var paginateListUserPoolClients = createPaginator(CognitoIdentityProviderClient, ListUserPoolClientsCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/pagination/ListUserPoolsPaginator.js
var import_dist406 = __toESM(require_dist());
var import_dist407 = __toESM(require_dist2());
var import_dist408 = __toESM(require_dist3());
var paginateListUserPools = createPaginator(CognitoIdentityProviderClient, ListUserPoolsCommand, "NextToken", "NextToken", "MaxResults");

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/pagination/ListUsersInGroupPaginator.js
var import_dist409 = __toESM(require_dist());
var import_dist410 = __toESM(require_dist2());
var import_dist411 = __toESM(require_dist3());
var paginateListUsersInGroup = createPaginator(CognitoIdentityProviderClient, ListUsersInGroupCommand, "NextToken", "NextToken", "Limit");

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/pagination/ListUsersPaginator.js
var import_dist412 = __toESM(require_dist());
var import_dist413 = __toESM(require_dist2());
var import_dist414 = __toESM(require_dist3());
var paginateListUsers = createPaginator(CognitoIdentityProviderClient, ListUsersCommand, "PaginationToken", "PaginationToken", "Limit");

// node_modules/@aws-sdk/client-cognito-identity-provider/dist-es/models/index.js
var import_dist418 = __toESM(require_dist());
var import_dist419 = __toESM(require_dist2());
var import_dist420 = __toESM(require_dist3());
export {
  Command as $Command,
  AccountTakeoverEventActionType,
  AddCustomAttributesCommand,
  AdminAddUserToGroupCommand,
  AdminAddUserToGroupRequestFilterSensitiveLog,
  AdminConfirmSignUpCommand,
  AdminConfirmSignUpRequestFilterSensitiveLog,
  AdminCreateUserCommand,
  AdminCreateUserRequestFilterSensitiveLog,
  AdminCreateUserResponseFilterSensitiveLog,
  AdminDeleteUserAttributesCommand,
  AdminDeleteUserAttributesRequestFilterSensitiveLog,
  AdminDeleteUserCommand,
  AdminDeleteUserRequestFilterSensitiveLog,
  AdminDisableProviderForUserCommand,
  AdminDisableUserCommand,
  AdminDisableUserRequestFilterSensitiveLog,
  AdminEnableUserCommand,
  AdminEnableUserRequestFilterSensitiveLog,
  AdminForgetDeviceCommand,
  AdminForgetDeviceRequestFilterSensitiveLog,
  AdminGetDeviceCommand,
  AdminGetDeviceRequestFilterSensitiveLog,
  AdminGetDeviceResponseFilterSensitiveLog,
  AdminGetUserCommand,
  AdminGetUserRequestFilterSensitiveLog,
  AdminGetUserResponseFilterSensitiveLog,
  AdminInitiateAuthCommand,
  AdminInitiateAuthRequestFilterSensitiveLog,
  AdminInitiateAuthResponseFilterSensitiveLog,
  AdminLinkProviderForUserCommand,
  AdminListDevicesCommand,
  AdminListDevicesRequestFilterSensitiveLog,
  AdminListDevicesResponseFilterSensitiveLog,
  AdminListGroupsForUserCommand,
  AdminListGroupsForUserRequestFilterSensitiveLog,
  AdminListUserAuthEventsCommand,
  AdminListUserAuthEventsRequestFilterSensitiveLog,
  AdminRemoveUserFromGroupCommand,
  AdminRemoveUserFromGroupRequestFilterSensitiveLog,
  AdminResetUserPasswordCommand,
  AdminResetUserPasswordRequestFilterSensitiveLog,
  AdminRespondToAuthChallengeCommand,
  AdminRespondToAuthChallengeRequestFilterSensitiveLog,
  AdminRespondToAuthChallengeResponseFilterSensitiveLog,
  AdminSetUserMFAPreferenceCommand,
  AdminSetUserMFAPreferenceRequestFilterSensitiveLog,
  AdminSetUserPasswordCommand,
  AdminSetUserPasswordRequestFilterSensitiveLog,
  AdminSetUserSettingsCommand,
  AdminSetUserSettingsRequestFilterSensitiveLog,
  AdminUpdateAuthEventFeedbackCommand,
  AdminUpdateAuthEventFeedbackRequestFilterSensitiveLog,
  AdminUpdateDeviceStatusCommand,
  AdminUpdateDeviceStatusRequestFilterSensitiveLog,
  AdminUpdateUserAttributesCommand,
  AdminUpdateUserAttributesRequestFilterSensitiveLog,
  AdminUserGlobalSignOutCommand,
  AdminUserGlobalSignOutRequestFilterSensitiveLog,
  AdvancedSecurityEnabledModeType,
  AdvancedSecurityModeType,
  AliasAttributeType,
  AliasExistsException,
  AssetCategoryType,
  AssetExtensionType,
  AssociateSoftwareTokenCommand,
  AssociateSoftwareTokenRequestFilterSensitiveLog,
  AssociateSoftwareTokenResponseFilterSensitiveLog,
  AttributeDataType,
  AttributeTypeFilterSensitiveLog,
  AuthFactorType,
  AuthFlowType,
  AuthenticationResultTypeFilterSensitiveLog,
  ChallengeName,
  ChallengeNameType,
  ChallengeResponse,
  ChangePasswordCommand,
  ChangePasswordRequestFilterSensitiveLog,
  CodeDeliveryFailureException,
  CodeMismatchException,
  CognitoIdentityProvider,
  CognitoIdentityProviderClient,
  CognitoIdentityProviderServiceException,
  ColorSchemeModeType,
  CompleteWebAuthnRegistrationCommand,
  CompleteWebAuthnRegistrationRequestFilterSensitiveLog,
  CompromisedCredentialsEventActionType,
  ConcurrentModificationException,
  ConfirmDeviceCommand,
  ConfirmDeviceRequestFilterSensitiveLog,
  ConfirmForgotPasswordCommand,
  ConfirmForgotPasswordRequestFilterSensitiveLog,
  ConfirmSignUpCommand,
  ConfirmSignUpRequestFilterSensitiveLog,
  ConfirmSignUpResponseFilterSensitiveLog,
  CreateGroupCommand,
  CreateIdentityProviderCommand,
  CreateManagedLoginBrandingCommand,
  CreateManagedLoginBrandingRequestFilterSensitiveLog,
  CreateResourceServerCommand,
  CreateUserImportJobCommand,
  CreateUserPoolClientCommand,
  CreateUserPoolClientResponseFilterSensitiveLog,
  CreateUserPoolCommand,
  CreateUserPoolDomainCommand,
  CustomEmailSenderLambdaVersionType,
  CustomSMSSenderLambdaVersionType,
  DefaultEmailOptionType,
  DeleteGroupCommand,
  DeleteIdentityProviderCommand,
  DeleteManagedLoginBrandingCommand,
  DeleteResourceServerCommand,
  DeleteUserAttributesCommand,
  DeleteUserAttributesRequestFilterSensitiveLog,
  DeleteUserCommand,
  DeleteUserPoolClientCommand,
  DeleteUserPoolClientRequestFilterSensitiveLog,
  DeleteUserPoolCommand,
  DeleteUserPoolDomainCommand,
  DeleteUserRequestFilterSensitiveLog,
  DeleteWebAuthnCredentialCommand,
  DeleteWebAuthnCredentialRequestFilterSensitiveLog,
  DeletionProtectionType,
  DeliveryMediumType,
  DescribeIdentityProviderCommand,
  DescribeManagedLoginBrandingByClientCommand,
  DescribeManagedLoginBrandingByClientRequestFilterSensitiveLog,
  DescribeManagedLoginBrandingCommand,
  DescribeResourceServerCommand,
  DescribeRiskConfigurationCommand,
  DescribeRiskConfigurationRequestFilterSensitiveLog,
  DescribeRiskConfigurationResponseFilterSensitiveLog,
  DescribeUserImportJobCommand,
  DescribeUserPoolClientCommand,
  DescribeUserPoolClientRequestFilterSensitiveLog,
  DescribeUserPoolClientResponseFilterSensitiveLog,
  DescribeUserPoolCommand,
  DescribeUserPoolDomainCommand,
  DeviceKeyExistsException,
  DeviceRememberedStatusType,
  DeviceTypeFilterSensitiveLog,
  DomainStatusType,
  DuplicateProviderException,
  EmailSendingAccountType,
  EnableSoftwareTokenMFAException,
  EventFilterType,
  EventResponseType,
  EventSourceName,
  EventType,
  ExpiredCodeException,
  ExplicitAuthFlowsType,
  FeatureUnavailableInTierException,
  FeedbackValueType,
  ForbiddenException,
  ForgetDeviceCommand,
  ForgetDeviceRequestFilterSensitiveLog,
  ForgotPasswordCommand,
  ForgotPasswordRequestFilterSensitiveLog,
  GetCSVHeaderCommand,
  GetDeviceCommand,
  GetDeviceRequestFilterSensitiveLog,
  GetDeviceResponseFilterSensitiveLog,
  GetGroupCommand,
  GetIdentityProviderByIdentifierCommand,
  GetLogDeliveryConfigurationCommand,
  GetSigningCertificateCommand,
  GetUICustomizationCommand,
  GetUICustomizationRequestFilterSensitiveLog,
  GetUICustomizationResponseFilterSensitiveLog,
  GetUserAttributeVerificationCodeCommand,
  GetUserAttributeVerificationCodeRequestFilterSensitiveLog,
  GetUserAuthFactorsCommand,
  GetUserAuthFactorsRequestFilterSensitiveLog,
  GetUserAuthFactorsResponseFilterSensitiveLog,
  GetUserCommand,
  GetUserPoolMfaConfigCommand,
  GetUserRequestFilterSensitiveLog,
  GetUserResponseFilterSensitiveLog,
  GlobalSignOutCommand,
  GlobalSignOutRequestFilterSensitiveLog,
  GroupExistsException,
  IdentityProviderTypeType,
  InitiateAuthCommand,
  InitiateAuthRequestFilterSensitiveLog,
  InitiateAuthResponseFilterSensitiveLog,
  InternalErrorException,
  InvalidEmailRoleAccessPolicyException,
  InvalidLambdaResponseException,
  InvalidOAuthFlowException,
  InvalidParameterException,
  InvalidPasswordException,
  InvalidSmsRoleAccessPolicyException,
  InvalidSmsRoleTrustRelationshipException,
  InvalidUserPoolConfigurationException,
  LimitExceededException,
  ListDevicesCommand,
  ListDevicesRequestFilterSensitiveLog,
  ListDevicesResponseFilterSensitiveLog,
  ListGroupsCommand,
  ListIdentityProvidersCommand,
  ListResourceServersCommand,
  ListTagsForResourceCommand,
  ListUserImportJobsCommand,
  ListUserPoolClientsCommand,
  ListUserPoolClientsResponseFilterSensitiveLog,
  ListUserPoolsCommand,
  ListUsersCommand,
  ListUsersInGroupCommand,
  ListUsersInGroupResponseFilterSensitiveLog,
  ListUsersResponseFilterSensitiveLog,
  ListWebAuthnCredentialsCommand,
  ListWebAuthnCredentialsRequestFilterSensitiveLog,
  LogLevel,
  MFAMethodNotFoundException,
  ManagedLoginBrandingExistsException,
  MessageActionType,
  NotAuthorizedException,
  OAuthFlowType,
  PasswordHistoryPolicyViolationException,
  PasswordResetRequiredException,
  PreTokenGenerationLambdaVersionType,
  PreconditionNotMetException,
  PreventUserExistenceErrorTypes,
  RecoveryOptionNameType,
  ResendConfirmationCodeCommand,
  ResendConfirmationCodeRequestFilterSensitiveLog,
  ResourceNotFoundException,
  RespondToAuthChallengeCommand,
  RespondToAuthChallengeRequestFilterSensitiveLog,
  RespondToAuthChallengeResponseFilterSensitiveLog,
  RevokeTokenCommand,
  RevokeTokenRequestFilterSensitiveLog,
  RiskConfigurationTypeFilterSensitiveLog,
  RiskDecisionType,
  RiskLevelType,
  ScopeDoesNotExistException,
  SetLogDeliveryConfigurationCommand,
  SetRiskConfigurationCommand,
  SetRiskConfigurationRequestFilterSensitiveLog,
  SetRiskConfigurationResponseFilterSensitiveLog,
  SetUICustomizationCommand,
  SetUICustomizationRequestFilterSensitiveLog,
  SetUICustomizationResponseFilterSensitiveLog,
  SetUserMFAPreferenceCommand,
  SetUserMFAPreferenceRequestFilterSensitiveLog,
  SetUserPoolMfaConfigCommand,
  SetUserSettingsCommand,
  SetUserSettingsRequestFilterSensitiveLog,
  SignUpCommand,
  SignUpRequestFilterSensitiveLog,
  SignUpResponseFilterSensitiveLog,
  SoftwareTokenMFANotFoundException,
  StartUserImportJobCommand,
  StartWebAuthnRegistrationCommand,
  StartWebAuthnRegistrationRequestFilterSensitiveLog,
  StatusType,
  StopUserImportJobCommand,
  TagResourceCommand,
  TierChangeNotAllowedException,
  TimeUnitsType,
  TooManyFailedAttemptsException,
  TooManyRequestsException,
  UICustomizationTypeFilterSensitiveLog,
  UnauthorizedException,
  UnexpectedLambdaException,
  UnsupportedIdentityProviderException,
  UnsupportedOperationException,
  UnsupportedTokenTypeException,
  UnsupportedUserStateException,
  UntagResourceCommand,
  UpdateAuthEventFeedbackCommand,
  UpdateAuthEventFeedbackRequestFilterSensitiveLog,
  UpdateDeviceStatusCommand,
  UpdateDeviceStatusRequestFilterSensitiveLog,
  UpdateGroupCommand,
  UpdateIdentityProviderCommand,
  UpdateManagedLoginBrandingCommand,
  UpdateResourceServerCommand,
  UpdateUserAttributesCommand,
  UpdateUserAttributesRequestFilterSensitiveLog,
  UpdateUserPoolClientCommand,
  UpdateUserPoolClientRequestFilterSensitiveLog,
  UpdateUserPoolClientResponseFilterSensitiveLog,
  UpdateUserPoolCommand,
  UpdateUserPoolDomainCommand,
  UserContextDataTypeFilterSensitiveLog,
  UserImportInProgressException,
  UserImportJobStatusType,
  UserLambdaValidationException,
  UserNotConfirmedException,
  UserNotFoundException,
  UserPoolAddOnNotEnabledException,
  UserPoolClientDescriptionFilterSensitiveLog,
  UserPoolClientTypeFilterSensitiveLog,
  UserPoolMfaType,
  UserPoolTaggingException,
  UserPoolTierType,
  UserStatusType,
  UserTypeFilterSensitiveLog,
  UserVerificationType,
  UsernameAttributeType,
  UsernameExistsException,
  VerifiedAttributeType,
  VerifySoftwareTokenCommand,
  VerifySoftwareTokenRequestFilterSensitiveLog,
  VerifySoftwareTokenResponseFilterSensitiveLog,
  VerifySoftwareTokenResponseType,
  VerifyUserAttributeCommand,
  VerifyUserAttributeRequestFilterSensitiveLog,
  WebAuthnChallengeNotFoundException,
  WebAuthnClientMismatchException,
  WebAuthnConfigurationMissingException,
  WebAuthnCredentialNotSupportedException,
  WebAuthnNotEnabledException,
  WebAuthnOriginNotAllowedException,
  WebAuthnRelyingPartyMismatchException,
  Client as __Client,
  paginateAdminListGroupsForUser,
  paginateAdminListUserAuthEvents,
  paginateListGroups,
  paginateListIdentityProviders,
  paginateListResourceServers,
  paginateListUserPoolClients,
  paginateListUserPools,
  paginateListUsers,
  paginateListUsersInGroup
};
//# sourceMappingURL=@aws-sdk_client-cognito-identity-provider.js.map
