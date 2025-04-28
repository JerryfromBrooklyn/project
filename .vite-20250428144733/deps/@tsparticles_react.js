import __buffer_polyfill from 'vite-plugin-node-polyfills/shims/buffer'
globalThis.Buffer = globalThis.Buffer || __buffer_polyfill
import __global_polyfill from 'vite-plugin-node-polyfills/shims/global'
globalThis.global = globalThis.global || __global_polyfill
import __process_polyfill from 'vite-plugin-node-polyfills/shims/process'
globalThis.process = globalThis.process || __process_polyfill

import {
  tsParticles
} from "./chunk-ZL2BF2IJ.js";
import {
  require_jsx_runtime
} from "./chunk-HUCHNPY6.js";
import {
  require_react
} from "./chunk-KMLDHAXH.js";
import {
  __toESM,
  require_dist,
  require_dist2,
  require_dist3
} from "./chunk-GJFZQ5ET.js";

// node_modules/@tsparticles/react/dist/index.js
var import_dist4 = __toESM(require_dist());
var import_dist5 = __toESM(require_dist2());
var import_dist6 = __toESM(require_dist3());

// node_modules/@tsparticles/react/dist/Particles.js
var import_dist = __toESM(require_dist(), 1);
var import_dist2 = __toESM(require_dist2(), 1);
var import_dist3 = __toESM(require_dist3(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var import_react = __toESM(require_react(), 1);
var f = (t) => {
  const i = t.id ?? "tsparticles";
  return (0, import_react.useEffect)(() => {
    let e;
    return tsParticles.load({ id: i, url: t.url, options: t.options }).then((l) => {
      var a;
      e = l, (a = t.particlesLoaded) == null || a.call(t, l);
    }), () => {
      e == null || e.destroy();
    };
  }, [i, t, t.url, t.options]), (0, import_jsx_runtime.jsx)("div", { id: i, className: t.className });
};

// node_modules/@tsparticles/react/dist/index.js
var import_jsx_runtime2 = __toESM(require_jsx_runtime());
var import_react2 = __toESM(require_react());
async function n(t) {
  await t(tsParticles);
}
export {
  f as Particles,
  f as default,
  n as initParticlesEngine
};
//# sourceMappingURL=@tsparticles_react.js.map
