import __buffer_polyfill from 'vite-plugin-node-polyfills/shims/buffer'
globalThis.Buffer = globalThis.Buffer || __buffer_polyfill
import __global_polyfill from 'vite-plugin-node-polyfills/shims/global'
globalThis.global = globalThis.global || __global_polyfill
import __process_polyfill from 'vite-plugin-node-polyfills/shims/process'
globalThis.process = globalThis.process || __process_polyfill

import {
  require_jsx_runtime
} from "./chunk-Y7OIJR5I.js";
import "./chunk-OUB4EOU6.js";
import "./chunk-QQN4L6SB.js";
export default require_jsx_runtime();
