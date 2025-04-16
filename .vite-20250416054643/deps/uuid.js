import __buffer_polyfill from 'vite-plugin-node-polyfills/shims/buffer'
globalThis.Buffer = globalThis.Buffer || __buffer_polyfill
import __global_polyfill from 'vite-plugin-node-polyfills/shims/global'
globalThis.global = globalThis.global || __global_polyfill
import __process_polyfill from 'vite-plugin-node-polyfills/shims/process'
globalThis.process = globalThis.process || __process_polyfill

import {
  nil_default,
  parse_default,
  stringify_default,
  v1_default,
  v3_default,
  v4_default,
  v5_default,
  validate_default,
  version_default
} from "./chunk-D2IROZXL.js";
import "./chunk-QQN4L6SB.js";
export {
  nil_default as NIL,
  parse_default as parse,
  stringify_default as stringify,
  v1_default as v1,
  v3_default as v3,
  v4_default as v4,
  v5_default as v5,
  validate_default as validate,
  version_default as version
};
