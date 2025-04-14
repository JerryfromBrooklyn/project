import __buffer_polyfill from 'vite-plugin-node-polyfills/shims/buffer'
globalThis.Buffer = globalThis.Buffer || __buffer_polyfill
import __global_polyfill from 'vite-plugin-node-polyfills/shims/global'
globalThis.global = globalThis.global || __global_polyfill
import __process_polyfill from 'vite-plugin-node-polyfills/shims/process'
globalThis.process = globalThis.process || __process_polyfill

import {
  BasePlugin,
  UIPlugin_default,
  Uppy_default,
  debugLogger
} from "./chunk-L6BRPP5D.js";
import "./chunk-YJHZJMYG.js";
export {
  BasePlugin,
  UIPlugin_default as UIPlugin,
  Uppy_default as Uppy,
  debugLogger,
  Uppy_default as default
};
