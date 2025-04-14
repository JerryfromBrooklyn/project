import __buffer_polyfill from 'vite-plugin-node-polyfills/shims/buffer'
globalThis.Buffer = globalThis.Buffer || __buffer_polyfill
import __global_polyfill from 'vite-plugin-node-polyfills/shims/global'
globalThis.global = globalThis.global || __global_polyfill
import __process_polyfill from 'vite-plugin-node-polyfills/shims/process'
globalThis.process = globalThis.process || __process_polyfill

import {
  StatusBar,
  require_classnames
} from "./chunk-ZGB3J7GR.js";
import {
  H,
  J,
  UIPlugin_default,
  _,
  b,
  getFileNameAndExtension,
  getSafeFileId,
  isDOMElement,
  k,
  l,
  require_debounce,
  require_prettierBytes,
  x
} from "./chunk-L6BRPP5D.js";
import {
  require_react
} from "./chunk-AWIUT3R6.js";
import {
  __commonJS,
  __privateAdd,
  __privateGet,
  __privateMethod,
  __privateSet,
  __privateWrapper,
  __publicField,
  __toESM,
  require_dist,
  require_dist2,
  require_dist3
} from "./chunk-YJHZJMYG.js";

// node_modules/eventemitter3/index.js
var require_eventemitter3 = __commonJS({
  "node_modules/eventemitter3/index.js"(exports, module) {
    "use strict";
    var import_dist304 = __toESM(require_dist());
    var import_dist305 = __toESM(require_dist2());
    var import_dist306 = __toESM(require_dist3());
    var has = Object.prototype.hasOwnProperty;
    var prefix = "~";
    function Events() {
    }
    if (Object.create) {
      Events.prototype = /* @__PURE__ */ Object.create(null);
      if (!new Events().__proto__) prefix = false;
    }
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }
    function addListener(emitter, event, fn, context, once) {
      if (typeof fn !== "function") {
        throw new TypeError("The listener must be a function");
      }
      var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
      if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
      else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
      else emitter._events[evt] = [emitter._events[evt], listener];
      return emitter;
    }
    function clearEvent(emitter, evt) {
      if (--emitter._eventsCount === 0) emitter._events = new Events();
      else delete emitter._events[evt];
    }
    function EventEmitter2() {
      this._events = new Events();
      this._eventsCount = 0;
    }
    EventEmitter2.prototype.eventNames = function eventNames() {
      var names = [], events, name;
      if (this._eventsCount === 0) return names;
      for (name in events = this._events) {
        if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
      }
      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }
      return names;
    };
    EventEmitter2.prototype.listeners = function listeners(event) {
      var evt = prefix ? prefix + event : event, handlers = this._events[evt];
      if (!handlers) return [];
      if (handlers.fn) return [handlers.fn];
      for (var i3 = 0, l4 = handlers.length, ee2 = new Array(l4); i3 < l4; i3++) {
        ee2[i3] = handlers[i3].fn;
      }
      return ee2;
    };
    EventEmitter2.prototype.listenerCount = function listenerCount(event) {
      var evt = prefix ? prefix + event : event, listeners = this._events[evt];
      if (!listeners) return 0;
      if (listeners.fn) return 1;
      return listeners.length;
    };
    EventEmitter2.prototype.emit = function emit(event, a1, a22, a3, a4, a5) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return false;
      var listeners = this._events[evt], len = arguments.length, args, i3;
      if (listeners.fn) {
        if (listeners.once) this.removeListener(event, listeners.fn, void 0, true);
        switch (len) {
          case 1:
            return listeners.fn.call(listeners.context), true;
          case 2:
            return listeners.fn.call(listeners.context, a1), true;
          case 3:
            return listeners.fn.call(listeners.context, a1, a22), true;
          case 4:
            return listeners.fn.call(listeners.context, a1, a22, a3), true;
          case 5:
            return listeners.fn.call(listeners.context, a1, a22, a3, a4), true;
          case 6:
            return listeners.fn.call(listeners.context, a1, a22, a3, a4, a5), true;
        }
        for (i3 = 1, args = new Array(len - 1); i3 < len; i3++) {
          args[i3 - 1] = arguments[i3];
        }
        listeners.fn.apply(listeners.context, args);
      } else {
        var length = listeners.length, j3;
        for (i3 = 0; i3 < length; i3++) {
          if (listeners[i3].once) this.removeListener(event, listeners[i3].fn, void 0, true);
          switch (len) {
            case 1:
              listeners[i3].fn.call(listeners[i3].context);
              break;
            case 2:
              listeners[i3].fn.call(listeners[i3].context, a1);
              break;
            case 3:
              listeners[i3].fn.call(listeners[i3].context, a1, a22);
              break;
            case 4:
              listeners[i3].fn.call(listeners[i3].context, a1, a22, a3);
              break;
            default:
              if (!args) for (j3 = 1, args = new Array(len - 1); j3 < len; j3++) {
                args[j3 - 1] = arguments[j3];
              }
              listeners[i3].fn.apply(listeners[i3].context, args);
          }
        }
      }
      return true;
    };
    EventEmitter2.prototype.on = function on(event, fn, context) {
      return addListener(this, event, fn, context, false);
    };
    EventEmitter2.prototype.once = function once(event, fn, context) {
      return addListener(this, event, fn, context, true);
    };
    EventEmitter2.prototype.removeListener = function removeListener(event, fn, context, once) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return this;
      if (!fn) {
        clearEvent(this, evt);
        return this;
      }
      var listeners = this._events[evt];
      if (listeners.fn) {
        if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
          clearEvent(this, evt);
        }
      } else {
        for (var i3 = 0, events = [], length = listeners.length; i3 < length; i3++) {
          if (listeners[i3].fn !== fn || once && !listeners[i3].once || context && listeners[i3].context !== context) {
            events.push(listeners[i3]);
          }
        }
        if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
        else clearEvent(this, evt);
      }
      return this;
    };
    EventEmitter2.prototype.removeAllListeners = function removeAllListeners(event) {
      var evt;
      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt]) clearEvent(this, evt);
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }
      return this;
    };
    EventEmitter2.prototype.off = EventEmitter2.prototype.removeListener;
    EventEmitter2.prototype.addListener = EventEmitter2.prototype.on;
    EventEmitter2.prefixed = prefix;
    EventEmitter2.EventEmitter = EventEmitter2;
    if ("undefined" !== typeof module) {
      module.exports = EventEmitter2;
    }
  }
});

// optional-peer-dep:__vite-optional-peer-dep:@uppy/drag-drop:@uppy/react
var require_react2 = __commonJS({
  "optional-peer-dep:__vite-optional-peer-dep:@uppy/drag-drop:@uppy/react"() {
    var import_dist304 = __toESM(require_dist());
    var import_dist305 = __toESM(require_dist2());
    var import_dist306 = __toESM(require_dist3());
    throw new Error(`Could not resolve "@uppy/drag-drop" imported by "@uppy/react". Is it installed?`);
  }
});

// optional-peer-dep:__vite-optional-peer-dep:@uppy/progress-bar:@uppy/react
var require_react3 = __commonJS({
  "optional-peer-dep:__vite-optional-peer-dep:@uppy/progress-bar:@uppy/react"() {
    var import_dist304 = __toESM(require_dist());
    var import_dist305 = __toESM(require_dist2());
    var import_dist306 = __toESM(require_dist3());
    throw new Error(`Could not resolve "@uppy/progress-bar" imported by "@uppy/react". Is it installed?`);
  }
});

// optional-peer-dep:__vite-optional-peer-dep:@uppy/file-input:@uppy/react
var require_react4 = __commonJS({
  "optional-peer-dep:__vite-optional-peer-dep:@uppy/file-input:@uppy/react"() {
    var import_dist304 = __toESM(require_dist());
    var import_dist305 = __toESM(require_dist2());
    var import_dist306 = __toESM(require_dist3());
    throw new Error(`Could not resolve "@uppy/file-input" imported by "@uppy/react". Is it installed?`);
  }
});

// node_modules/use-sync-external-store/cjs/use-sync-external-store-with-selector.production.js
var require_use_sync_external_store_with_selector_production = __commonJS({
  "node_modules/use-sync-external-store/cjs/use-sync-external-store-with-selector.production.js"(exports) {
    "use strict";
    var import_dist304 = __toESM(require_dist());
    var import_dist305 = __toESM(require_dist2());
    var import_dist306 = __toESM(require_dist3());
    var React = require_react();
    function is(x3, y3) {
      return x3 === y3 && (0 !== x3 || 1 / x3 === 1 / y3) || x3 !== x3 && y3 !== y3;
    }
    var objectIs = "function" === typeof Object.is ? Object.is : is;
    var useSyncExternalStore = React.useSyncExternalStore;
    var useRef = React.useRef;
    var useEffect2 = React.useEffect;
    var useMemo2 = React.useMemo;
    var useDebugValue = React.useDebugValue;
    exports.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual2) {
      var instRef = useRef(null);
      if (null === instRef.current) {
        var inst = { hasValue: false, value: null };
        instRef.current = inst;
      } else inst = instRef.current;
      instRef = useMemo2(
        function() {
          function memoizedSelector(nextSnapshot) {
            if (!hasMemo) {
              hasMemo = true;
              memoizedSnapshot = nextSnapshot;
              nextSnapshot = selector(nextSnapshot);
              if (void 0 !== isEqual2 && inst.hasValue) {
                var currentSelection = inst.value;
                if (isEqual2(currentSelection, nextSnapshot))
                  return memoizedSelection = currentSelection;
              }
              return memoizedSelection = nextSnapshot;
            }
            currentSelection = memoizedSelection;
            if (objectIs(memoizedSnapshot, nextSnapshot)) return currentSelection;
            var nextSelection = selector(nextSnapshot);
            if (void 0 !== isEqual2 && isEqual2(currentSelection, nextSelection))
              return memoizedSnapshot = nextSnapshot, currentSelection;
            memoizedSnapshot = nextSnapshot;
            return memoizedSelection = nextSelection;
          }
          var hasMemo = false, memoizedSnapshot, memoizedSelection, maybeGetServerSnapshot = void 0 === getServerSnapshot ? null : getServerSnapshot;
          return [
            function() {
              return memoizedSelector(getSnapshot());
            },
            null === maybeGetServerSnapshot ? void 0 : function() {
              return memoizedSelector(maybeGetServerSnapshot());
            }
          ];
        },
        [getSnapshot, getServerSnapshot, selector, isEqual2]
      );
      var value = useSyncExternalStore(subscribe, instRef[0], instRef[1]);
      useEffect2(
        function() {
          inst.hasValue = true;
          inst.value = value;
        },
        [value]
      );
      useDebugValue(value);
      return value;
    };
  }
});

// node_modules/use-sync-external-store/cjs/use-sync-external-store-with-selector.development.js
var require_use_sync_external_store_with_selector_development = __commonJS({
  "node_modules/use-sync-external-store/cjs/use-sync-external-store-with-selector.development.js"(exports) {
    "use strict";
    var import_dist304 = __toESM(require_dist());
    var import_dist305 = __toESM(require_dist2());
    var import_dist306 = __toESM(require_dist3());
    "production" !== process.env.NODE_ENV && function() {
      function is(x3, y3) {
        return x3 === y3 && (0 !== x3 || 1 / x3 === 1 / y3) || x3 !== x3 && y3 !== y3;
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var React = require_react(), objectIs = "function" === typeof Object.is ? Object.is : is, useSyncExternalStore = React.useSyncExternalStore, useRef = React.useRef, useEffect2 = React.useEffect, useMemo2 = React.useMemo, useDebugValue = React.useDebugValue;
      exports.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual2) {
        var instRef = useRef(null);
        if (null === instRef.current) {
          var inst = { hasValue: false, value: null };
          instRef.current = inst;
        } else inst = instRef.current;
        instRef = useMemo2(
          function() {
            function memoizedSelector(nextSnapshot) {
              if (!hasMemo) {
                hasMemo = true;
                memoizedSnapshot = nextSnapshot;
                nextSnapshot = selector(nextSnapshot);
                if (void 0 !== isEqual2 && inst.hasValue) {
                  var currentSelection = inst.value;
                  if (isEqual2(currentSelection, nextSnapshot))
                    return memoizedSelection = currentSelection;
                }
                return memoizedSelection = nextSnapshot;
              }
              currentSelection = memoizedSelection;
              if (objectIs(memoizedSnapshot, nextSnapshot))
                return currentSelection;
              var nextSelection = selector(nextSnapshot);
              if (void 0 !== isEqual2 && isEqual2(currentSelection, nextSelection))
                return memoizedSnapshot = nextSnapshot, currentSelection;
              memoizedSnapshot = nextSnapshot;
              return memoizedSelection = nextSelection;
            }
            var hasMemo = false, memoizedSnapshot, memoizedSelection, maybeGetServerSnapshot = void 0 === getServerSnapshot ? null : getServerSnapshot;
            return [
              function() {
                return memoizedSelector(getSnapshot());
              },
              null === maybeGetServerSnapshot ? void 0 : function() {
                return memoizedSelector(maybeGetServerSnapshot());
              }
            ];
          },
          [getSnapshot, getServerSnapshot, selector, isEqual2]
        );
        var value = useSyncExternalStore(subscribe, instRef[0], instRef[1]);
        useEffect2(
          function() {
            inst.hasValue = true;
            inst.value = value;
          },
          [value]
        );
        useDebugValue(value);
        return value;
      };
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    }();
  }
});

// node_modules/use-sync-external-store/with-selector.js
var require_with_selector = __commonJS({
  "node_modules/use-sync-external-store/with-selector.js"(exports, module) {
    "use strict";
    var import_dist304 = __toESM(require_dist());
    var import_dist305 = __toESM(require_dist2());
    var import_dist306 = __toESM(require_dist3());
    if (process.env.NODE_ENV === "production") {
      module.exports = require_use_sync_external_store_with_selector_production();
    } else {
      module.exports = require_use_sync_external_store_with_selector_development();
    }
  }
});

// node_modules/@uppy/react/lib/index.js
var import_dist301 = __toESM(require_dist());
var import_dist302 = __toESM(require_dist2());
var import_dist303 = __toESM(require_dist3());

// node_modules/@uppy/react/lib/Dashboard.js
var import_dist277 = __toESM(require_dist(), 1);
var import_dist278 = __toESM(require_dist2(), 1);
var import_dist279 = __toESM(require_dist3(), 1);
var import_react = __toESM(require_react(), 1);

// node_modules/@uppy/dashboard/lib/index.js
var import_dist268 = __toESM(require_dist());
var import_dist269 = __toESM(require_dist2());
var import_dist270 = __toESM(require_dist3());

// node_modules/@uppy/dashboard/lib/Dashboard.js
var import_dist265 = __toESM(require_dist(), 1);
var import_dist266 = __toESM(require_dist2(), 1);
var import_dist267 = __toESM(require_dist3(), 1);

// node_modules/@uppy/informer/lib/index.js
var import_dist10 = __toESM(require_dist());
var import_dist11 = __toESM(require_dist2());
var import_dist12 = __toESM(require_dist3());

// node_modules/@uppy/informer/lib/Informer.js
var import_dist7 = __toESM(require_dist(), 1);
var import_dist8 = __toESM(require_dist2(), 1);
var import_dist9 = __toESM(require_dist3(), 1);

// node_modules/@uppy/informer/lib/FadeIn.js
var import_dist = __toESM(require_dist(), 1);
var import_dist2 = __toESM(require_dist2(), 1);
var import_dist3 = __toESM(require_dist3(), 1);
var TRANSITION_MS = 300;
var FadeIn = class extends x {
  constructor() {
    super(...arguments);
    this.ref = b();
  }
  componentWillEnter(callback) {
    this.ref.current.style.opacity = "1";
    this.ref.current.style.transform = "none";
    setTimeout(callback, TRANSITION_MS);
  }
  componentWillLeave(callback) {
    this.ref.current.style.opacity = "0";
    this.ref.current.style.transform = "translateY(350%)";
    setTimeout(callback, TRANSITION_MS);
  }
  render() {
    const {
      children
    } = this.props;
    return _("div", {
      className: "uppy-Informer-animated",
      ref: this.ref
    }, children);
  }
};

// node_modules/@uppy/informer/lib/TransitionGroup.js
var import_dist4 = __toESM(require_dist(), 1);
var import_dist5 = __toESM(require_dist2(), 1);
var import_dist6 = __toESM(require_dist3(), 1);
function assign(obj, props) {
  return Object.assign(obj, props);
}
function getKey(vnode, fallback) {
  var _vnode$key;
  return (_vnode$key = vnode == null ? void 0 : vnode.key) != null ? _vnode$key : fallback;
}
function linkRef(component, name) {
  const cache = component._ptgLinkedRefs || (component._ptgLinkedRefs = {});
  return cache[name] || (cache[name] = (c3) => {
    component.refs[name] = c3;
  });
}
function getChildMapping(children) {
  const out = {};
  for (let i3 = 0; i3 < children.length; i3++) {
    if (children[i3] != null) {
      const key = getKey(children[i3], i3.toString(36));
      out[key] = children[i3];
    }
  }
  return out;
}
function mergeChildMappings(prev, next) {
  prev = prev || {};
  next = next || {};
  const getValueForKey = (key) => next.hasOwnProperty(key) ? next[key] : prev[key];
  const nextKeysPending = {};
  let pendingKeys = [];
  for (const prevKey in prev) {
    if (next.hasOwnProperty(prevKey)) {
      if (pendingKeys.length) {
        nextKeysPending[prevKey] = pendingKeys;
        pendingKeys = [];
      }
    } else {
      pendingKeys.push(prevKey);
    }
  }
  const childMapping = {};
  for (const nextKey in next) {
    if (nextKeysPending.hasOwnProperty(nextKey)) {
      for (let i3 = 0; i3 < nextKeysPending[nextKey].length; i3++) {
        const pendingNextKey = nextKeysPending[nextKey][i3];
        childMapping[nextKeysPending[nextKey][i3]] = getValueForKey(pendingNextKey);
      }
    }
    childMapping[nextKey] = getValueForKey(nextKey);
  }
  for (let i3 = 0; i3 < pendingKeys.length; i3++) {
    childMapping[pendingKeys[i3]] = getValueForKey(pendingKeys[i3]);
  }
  return childMapping;
}
var identity = (i3) => i3;
var TransitionGroup = class extends x {
  constructor(props, context) {
    super(props, context);
    this.refs = {};
    this.state = {
      children: getChildMapping(H(H(this.props.children)) || [])
    };
    this.performAppear = this.performAppear.bind(this);
    this.performEnter = this.performEnter.bind(this);
    this.performLeave = this.performLeave.bind(this);
  }
  componentWillMount() {
    this.currentlyTransitioningKeys = {};
    this.keysToAbortLeave = [];
    this.keysToEnter = [];
    this.keysToLeave = [];
  }
  componentDidMount() {
    const initialChildMapping = this.state.children;
    for (const key in initialChildMapping) {
      if (initialChildMapping[key]) {
        this.performAppear(key);
      }
    }
  }
  componentWillReceiveProps(nextProps) {
    const nextChildMapping = getChildMapping(H(nextProps.children) || []);
    const prevChildMapping = this.state.children;
    this.setState((prevState) => ({
      children: mergeChildMappings(prevState.children, nextChildMapping)
    }));
    let key;
    for (key in nextChildMapping) {
      if (nextChildMapping.hasOwnProperty(key)) {
        const hasPrev = prevChildMapping && prevChildMapping.hasOwnProperty(key);
        if (nextChildMapping[key] && hasPrev && this.currentlyTransitioningKeys[key]) {
          this.keysToEnter.push(key);
          this.keysToAbortLeave.push(key);
        } else if (nextChildMapping[key] && !hasPrev && !this.currentlyTransitioningKeys[key]) {
          this.keysToEnter.push(key);
        }
      }
    }
    for (key in prevChildMapping) {
      if (prevChildMapping.hasOwnProperty(key)) {
        const hasNext = nextChildMapping && nextChildMapping.hasOwnProperty(key);
        if (prevChildMapping[key] && !hasNext && !this.currentlyTransitioningKeys[key]) {
          this.keysToLeave.push(key);
        }
      }
    }
  }
  componentDidUpdate() {
    const {
      keysToEnter
    } = this;
    this.keysToEnter = [];
    keysToEnter.forEach(this.performEnter);
    const {
      keysToLeave
    } = this;
    this.keysToLeave = [];
    keysToLeave.forEach(this.performLeave);
  }
  _finishAbort(key) {
    const idx = this.keysToAbortLeave.indexOf(key);
    if (idx !== -1) {
      this.keysToAbortLeave.splice(idx, 1);
    }
  }
  performAppear(key) {
    this.currentlyTransitioningKeys[key] = true;
    const component = this.refs[key];
    if (component != null && component.componentWillAppear) {
      component.componentWillAppear(this._handleDoneAppearing.bind(this, key));
    } else {
      this._handleDoneAppearing(key);
    }
  }
  _handleDoneAppearing(key) {
    const component = this.refs[key];
    if (component != null && component.componentDidAppear) {
      component.componentDidAppear();
    }
    delete this.currentlyTransitioningKeys[key];
    this._finishAbort(key);
    const currentChildMapping = getChildMapping(H(this.props.children) || []);
    if (!currentChildMapping || !currentChildMapping.hasOwnProperty(key)) {
      this.performLeave(key);
    }
  }
  performEnter(key) {
    this.currentlyTransitioningKeys[key] = true;
    const component = this.refs[key];
    if (component != null && component.componentWillEnter) {
      component.componentWillEnter(this._handleDoneEntering.bind(this, key));
    } else {
      this._handleDoneEntering(key);
    }
  }
  _handleDoneEntering(key) {
    const component = this.refs[key];
    if (component != null && component.componentDidEnter) {
      component.componentDidEnter();
    }
    delete this.currentlyTransitioningKeys[key];
    this._finishAbort(key);
    const currentChildMapping = getChildMapping(H(this.props.children) || []);
    if (!currentChildMapping || !currentChildMapping.hasOwnProperty(key)) {
      this.performLeave(key);
    }
  }
  performLeave(key) {
    const idx = this.keysToAbortLeave.indexOf(key);
    if (idx !== -1) {
      return;
    }
    this.currentlyTransitioningKeys[key] = true;
    const component = this.refs[key];
    if (component != null && component.componentWillLeave) {
      component.componentWillLeave(this._handleDoneLeaving.bind(this, key));
    } else {
      this._handleDoneLeaving(key);
    }
  }
  _handleDoneLeaving(key) {
    const idx = this.keysToAbortLeave.indexOf(key);
    if (idx !== -1) {
      return;
    }
    const component = this.refs[key];
    if (component != null && component.componentDidLeave) {
      component.componentDidLeave();
    }
    delete this.currentlyTransitioningKeys[key];
    const currentChildMapping = getChildMapping(H(this.props.children) || []);
    if (currentChildMapping && currentChildMapping.hasOwnProperty(key)) {
      this.performEnter(key);
    } else {
      const children = assign({}, this.state.children);
      delete children[key];
      this.setState({
        children
      });
    }
  }
  render(_ref, _ref2) {
    let {
      childFactory,
      transitionLeave,
      transitionName: transitionName2,
      transitionAppear,
      transitionEnter,
      transitionLeaveTimeout,
      transitionEnterTimeout,
      transitionAppearTimeout,
      component,
      ...props
    } = _ref;
    let {
      children
    } = _ref2;
    const childrenToRender = Object.entries(children).map((_ref3) => {
      let [key, child] = _ref3;
      if (!child) return void 0;
      const ref = linkRef(this, key);
      return J(childFactory(child), {
        ref,
        key
      });
    }).filter(Boolean);
    return _(component, props, childrenToRender);
  }
};
TransitionGroup.defaultProps = {
  component: "span",
  childFactory: identity
};
var TransitionGroup_default = TransitionGroup;

// node_modules/@uppy/informer/lib/Informer.js
var packageJson = {
  "version": "4.2.1"
};
var Informer = class extends UIPlugin_default {
  constructor(uppy, opts) {
    super(uppy, opts);
    this.render = (state) => {
      return _("div", {
        className: "uppy uppy-Informer"
      }, _(TransitionGroup_default, null, state.info.map((info) => _(FadeIn, {
        key: info.message
      }, _("p", {
        role: "alert"
      }, info.message, " ", info.details && _("span", {
        "aria-label": info.details,
        "data-microtip-position": "top-left",
        "data-microtip-size": "medium",
        role: "tooltip",
        onClick: () => (
          // eslint-disable-next-line no-alert
          alert(`${info.message} 

 ${info.details}`)
        )
      }, "?"))))));
    };
    this.type = "progressindicator";
    this.id = this.opts.id || "Informer";
    this.title = "Informer";
  }
  install() {
    const {
      target
    } = this.opts;
    if (target) {
      this.mount(target, this);
    }
  }
};
Informer.VERSION = packageJson.version;

// node_modules/@uppy/thumbnail-generator/lib/index.js
var import_dist28 = __toESM(require_dist());
var import_dist29 = __toESM(require_dist2());
var import_dist30 = __toESM(require_dist3());

// node_modules/@uppy/utils/lib/dataURItoBlob.js
var import_dist13 = __toESM(require_dist());
var import_dist14 = __toESM(require_dist2());
var import_dist15 = __toESM(require_dist3());
var DATA_URL_PATTERN = /^data:([^/]+\/[^,;]+(?:[^,]*?))(;base64)?,([\s\S]*)$/;
function dataURItoBlob(dataURI, opts, toFile) {
  var _ref, _opts$mimeType;
  const dataURIData = DATA_URL_PATTERN.exec(dataURI);
  const mimeType = (_ref = (_opts$mimeType = opts.mimeType) != null ? _opts$mimeType : dataURIData == null ? void 0 : dataURIData[1]) != null ? _ref : "plain/text";
  let data;
  if ((dataURIData == null ? void 0 : dataURIData[2]) != null) {
    const binary = atob(decodeURIComponent(dataURIData[3]));
    const bytes = new Uint8Array(binary.length);
    for (let i3 = 0; i3 < binary.length; i3++) {
      bytes[i3] = binary.charCodeAt(i3);
    }
    data = [bytes];
  } else if ((dataURIData == null ? void 0 : dataURIData[3]) != null) {
    data = [decodeURIComponent(dataURIData[3])];
  }
  if (toFile) {
    return new File(data, opts.name || "", {
      type: mimeType
    });
  }
  return new Blob(data, {
    type: mimeType
  });
}
var dataURItoBlob_default = dataURItoBlob;

// node_modules/@uppy/utils/lib/isObjectURL.js
var import_dist16 = __toESM(require_dist());
var import_dist17 = __toESM(require_dist2());
var import_dist18 = __toESM(require_dist3());
function isObjectURL(url) {
  return url.startsWith("blob:");
}

// node_modules/@uppy/utils/lib/isPreviewSupported.js
var import_dist19 = __toESM(require_dist());
var import_dist20 = __toESM(require_dist2());
var import_dist21 = __toESM(require_dist3());
function isPreviewSupported(fileType) {
  if (!fileType) return false;
  return /^[^/]+\/(jpe?g|gif|png|svg|svg\+xml|bmp|webp|avif)$/.test(fileType);
}

// node_modules/exifr/dist/mini.esm.mjs
var import_dist22 = __toESM(require_dist(), 1);
var import_dist23 = __toESM(require_dist2(), 1);
var import_dist24 = __toESM(require_dist3(), 1);
function e(e3, t3, s3) {
  return t3 in e3 ? Object.defineProperty(e3, t3, { value: s3, enumerable: true, configurable: true, writable: true }) : e3[t3] = s3, e3;
}
var t = "undefined" != typeof self ? self : global;
var s = "undefined" != typeof navigator;
var i = s && "undefined" == typeof HTMLImageElement;
var n = !("undefined" == typeof global || "undefined" == typeof process || !process.versions || !process.versions.node);
var r = t.Buffer;
var a = !!r;
var h = (e3) => void 0 !== e3;
function f(e3) {
  return void 0 === e3 || (e3 instanceof Map ? 0 === e3.size : 0 === Object.values(e3).filter(h).length);
}
function l2(e3) {
  let t3 = new Error(e3);
  throw delete t3.stack, t3;
}
function o(e3) {
  let t3 = function(e4) {
    let t4 = 0;
    return e4.ifd0.enabled && (t4 += 1024), e4.exif.enabled && (t4 += 2048), e4.makerNote && (t4 += 2048), e4.userComment && (t4 += 1024), e4.gps.enabled && (t4 += 512), e4.interop.enabled && (t4 += 100), e4.ifd1.enabled && (t4 += 1024), t4 + 2048;
  }(e3);
  return e3.jfif.enabled && (t3 += 50), e3.xmp.enabled && (t3 += 2e4), e3.iptc.enabled && (t3 += 14e3), e3.icc.enabled && (t3 += 6e3), t3;
}
var u = (e3) => String.fromCharCode.apply(null, e3);
var d = "undefined" != typeof TextDecoder ? new TextDecoder("utf-8") : void 0;
var c = class _c {
  static from(e3, t3) {
    return e3 instanceof this && e3.le === t3 ? e3 : new _c(e3, void 0, void 0, t3);
  }
  constructor(e3, t3 = 0, s3, i3) {
    if ("boolean" == typeof i3 && (this.le = i3), Array.isArray(e3) && (e3 = new Uint8Array(e3)), 0 === e3) this.byteOffset = 0, this.byteLength = 0;
    else if (e3 instanceof ArrayBuffer) {
      void 0 === s3 && (s3 = e3.byteLength - t3);
      let i4 = new DataView(e3, t3, s3);
      this._swapDataView(i4);
    } else if (e3 instanceof Uint8Array || e3 instanceof DataView || e3 instanceof _c) {
      void 0 === s3 && (s3 = e3.byteLength - t3), (t3 += e3.byteOffset) + s3 > e3.byteOffset + e3.byteLength && l2("Creating view outside of available memory in ArrayBuffer");
      let i4 = new DataView(e3.buffer, t3, s3);
      this._swapDataView(i4);
    } else if ("number" == typeof e3) {
      let t4 = new DataView(new ArrayBuffer(e3));
      this._swapDataView(t4);
    } else l2("Invalid input argument for BufferView: " + e3);
  }
  _swapArrayBuffer(e3) {
    this._swapDataView(new DataView(e3));
  }
  _swapBuffer(e3) {
    this._swapDataView(new DataView(e3.buffer, e3.byteOffset, e3.byteLength));
  }
  _swapDataView(e3) {
    this.dataView = e3, this.buffer = e3.buffer, this.byteOffset = e3.byteOffset, this.byteLength = e3.byteLength;
  }
  _lengthToEnd(e3) {
    return this.byteLength - e3;
  }
  set(e3, t3, s3 = _c) {
    return e3 instanceof DataView || e3 instanceof _c ? e3 = new Uint8Array(e3.buffer, e3.byteOffset, e3.byteLength) : e3 instanceof ArrayBuffer && (e3 = new Uint8Array(e3)), e3 instanceof Uint8Array || l2("BufferView.set(): Invalid data argument."), this.toUint8().set(e3, t3), new s3(this, t3, e3.byteLength);
  }
  subarray(e3, t3) {
    return t3 = t3 || this._lengthToEnd(e3), new _c(this, e3, t3);
  }
  toUint8() {
    return new Uint8Array(this.buffer, this.byteOffset, this.byteLength);
  }
  getUint8Array(e3, t3) {
    return new Uint8Array(this.buffer, this.byteOffset + e3, t3);
  }
  getString(e3 = 0, t3 = this.byteLength) {
    let s3 = this.getUint8Array(e3, t3);
    return i3 = s3, d ? d.decode(i3) : a ? Buffer.from(i3).toString("utf8") : decodeURIComponent(escape(u(i3)));
    var i3;
  }
  getLatin1String(e3 = 0, t3 = this.byteLength) {
    let s3 = this.getUint8Array(e3, t3);
    return u(s3);
  }
  getUnicodeString(e3 = 0, t3 = this.byteLength) {
    const s3 = [];
    for (let i3 = 0; i3 < t3 && e3 + i3 < this.byteLength; i3 += 2) s3.push(this.getUint16(e3 + i3));
    return u(s3);
  }
  getInt8(e3) {
    return this.dataView.getInt8(e3);
  }
  getUint8(e3) {
    return this.dataView.getUint8(e3);
  }
  getInt16(e3, t3 = this.le) {
    return this.dataView.getInt16(e3, t3);
  }
  getInt32(e3, t3 = this.le) {
    return this.dataView.getInt32(e3, t3);
  }
  getUint16(e3, t3 = this.le) {
    return this.dataView.getUint16(e3, t3);
  }
  getUint32(e3, t3 = this.le) {
    return this.dataView.getUint32(e3, t3);
  }
  getFloat32(e3, t3 = this.le) {
    return this.dataView.getFloat32(e3, t3);
  }
  getFloat64(e3, t3 = this.le) {
    return this.dataView.getFloat64(e3, t3);
  }
  getFloat(e3, t3 = this.le) {
    return this.dataView.getFloat32(e3, t3);
  }
  getDouble(e3, t3 = this.le) {
    return this.dataView.getFloat64(e3, t3);
  }
  getUintBytes(e3, t3, s3) {
    switch (t3) {
      case 1:
        return this.getUint8(e3, s3);
      case 2:
        return this.getUint16(e3, s3);
      case 4:
        return this.getUint32(e3, s3);
      case 8:
        return this.getUint64 && this.getUint64(e3, s3);
    }
  }
  getUint(e3, t3, s3) {
    switch (t3) {
      case 8:
        return this.getUint8(e3, s3);
      case 16:
        return this.getUint16(e3, s3);
      case 32:
        return this.getUint32(e3, s3);
      case 64:
        return this.getUint64 && this.getUint64(e3, s3);
    }
  }
  toString(e3) {
    return this.dataView.toString(e3, this.constructor.name);
  }
  ensureChunk() {
  }
};
function p(e3, t3) {
  l2(`${e3} '${t3}' was not loaded, try using full build of exifr.`);
}
var g = class extends Map {
  constructor(e3) {
    super(), this.kind = e3;
  }
  get(e3, t3) {
    return this.has(e3) || p(this.kind, e3), t3 && (e3 in t3 || function(e4, t4) {
      l2(`Unknown ${e4} '${t4}'.`);
    }(this.kind, e3), t3[e3].enabled || p(this.kind, e3)), super.get(e3);
  }
  keyList() {
    return Array.from(this.keys());
  }
};
var m = new g("file parser");
var y = new g("segment parser");
var b2 = new g("file reader");
var w = t.fetch;
function k2(e3, t3) {
  return (i3 = e3).startsWith("data:") || i3.length > 1e4 ? v(e3, t3, "base64") : n && e3.includes("://") ? O(e3, t3, "url", S) : n ? v(e3, t3, "fs") : s ? O(e3, t3, "url", S) : void l2("Invalid input argument");
  var i3;
}
async function O(e3, t3, s3, i3) {
  return b2.has(s3) ? v(e3, t3, s3) : i3 ? async function(e4, t4) {
    let s4 = await t4(e4);
    return new c(s4);
  }(e3, i3) : void l2(`Parser ${s3} is not loaded`);
}
async function v(e3, t3, s3) {
  let i3 = new (b2.get(s3))(e3, t3);
  return await i3.read(), i3;
}
var S = (e3) => w(e3).then((e4) => e4.arrayBuffer());
var A = (e3) => new Promise((t3, s3) => {
  let i3 = new FileReader();
  i3.onloadend = () => t3(i3.result || new ArrayBuffer()), i3.onerror = s3, i3.readAsArrayBuffer(e3);
});
var U = class extends Map {
  get tagKeys() {
    return this.allKeys || (this.allKeys = Array.from(this.keys())), this.allKeys;
  }
  get tagValues() {
    return this.allValues || (this.allValues = Array.from(this.values())), this.allValues;
  }
};
function x2(e3, t3, s3) {
  let i3 = new U();
  for (let [e4, t4] of s3) i3.set(e4, t4);
  if (Array.isArray(t3)) for (let s4 of t3) e3.set(s4, i3);
  else e3.set(t3, i3);
  return i3;
}
function C(e3, t3, s3) {
  let i3, n2 = e3.get(t3);
  for (i3 of s3) n2.set(i3[0], i3[1]);
}
var B = /* @__PURE__ */ new Map();
var V = /* @__PURE__ */ new Map();
var I = /* @__PURE__ */ new Map();
var L = ["chunked", "firstChunkSize", "firstChunkSizeNode", "firstChunkSizeBrowser", "chunkSize", "chunkLimit"];
var T = ["jfif", "xmp", "icc", "iptc", "ihdr"];
var z = ["tiff", ...T];
var P = ["ifd0", "ifd1", "exif", "gps", "interop"];
var F = [...z, ...P];
var j = ["makerNote", "userComment"];
var E = ["translateKeys", "translateValues", "reviveValues", "multiSegment"];
var M = [...E, "sanitize", "mergeOutput", "silentErrors"];
var _2 = class {
  get translate() {
    return this.translateKeys || this.translateValues || this.reviveValues;
  }
};
var D = class extends _2 {
  get needed() {
    return this.enabled || this.deps.size > 0;
  }
  constructor(t3, s3, i3, n2) {
    if (super(), e(this, "enabled", false), e(this, "skip", /* @__PURE__ */ new Set()), e(this, "pick", /* @__PURE__ */ new Set()), e(this, "deps", /* @__PURE__ */ new Set()), e(this, "translateKeys", false), e(this, "translateValues", false), e(this, "reviveValues", false), this.key = t3, this.enabled = s3, this.parse = this.enabled, this.applyInheritables(n2), this.canBeFiltered = P.includes(t3), this.canBeFiltered && (this.dict = B.get(t3)), void 0 !== i3) if (Array.isArray(i3)) this.parse = this.enabled = true, this.canBeFiltered && i3.length > 0 && this.translateTagSet(i3, this.pick);
    else if ("object" == typeof i3) {
      if (this.enabled = true, this.parse = false !== i3.parse, this.canBeFiltered) {
        let { pick: e3, skip: t4 } = i3;
        e3 && e3.length > 0 && this.translateTagSet(e3, this.pick), t4 && t4.length > 0 && this.translateTagSet(t4, this.skip);
      }
      this.applyInheritables(i3);
    } else true === i3 || false === i3 ? this.parse = this.enabled = i3 : l2(`Invalid options argument: ${i3}`);
  }
  applyInheritables(e3) {
    let t3, s3;
    for (t3 of E) s3 = e3[t3], void 0 !== s3 && (this[t3] = s3);
  }
  translateTagSet(e3, t3) {
    if (this.dict) {
      let s3, i3, { tagKeys: n2, tagValues: r3 } = this.dict;
      for (s3 of e3) "string" == typeof s3 ? (i3 = r3.indexOf(s3), -1 === i3 && (i3 = n2.indexOf(Number(s3))), -1 !== i3 && t3.add(Number(n2[i3]))) : t3.add(s3);
    } else for (let s3 of e3) t3.add(s3);
  }
  finalizeFilters() {
    !this.enabled && this.deps.size > 0 ? (this.enabled = true, X(this.pick, this.deps)) : this.enabled && this.pick.size > 0 && X(this.pick, this.deps);
  }
};
var N = { jfif: false, tiff: true, xmp: false, icc: false, iptc: false, ifd0: true, ifd1: false, exif: true, gps: true, interop: false, ihdr: void 0, makerNote: false, userComment: false, multiSegment: false, skip: [], pick: [], translateKeys: true, translateValues: true, reviveValues: true, sanitize: true, mergeOutput: true, silentErrors: true, chunked: true, firstChunkSize: void 0, firstChunkSizeNode: 512, firstChunkSizeBrowser: 65536, chunkSize: 65536, chunkLimit: 5 };
var $ = /* @__PURE__ */ new Map();
var R = class extends _2 {
  static useCached(e3) {
    let t3 = $.get(e3);
    return void 0 !== t3 || (t3 = new this(e3), $.set(e3, t3)), t3;
  }
  constructor(e3) {
    super(), true === e3 ? this.setupFromTrue() : void 0 === e3 ? this.setupFromUndefined() : Array.isArray(e3) ? this.setupFromArray(e3) : "object" == typeof e3 ? this.setupFromObject(e3) : l2(`Invalid options argument ${e3}`), void 0 === this.firstChunkSize && (this.firstChunkSize = s ? this.firstChunkSizeBrowser : this.firstChunkSizeNode), this.mergeOutput && (this.ifd1.enabled = false), this.filterNestedSegmentTags(), this.traverseTiffDependencyTree(), this.checkLoadedPlugins();
  }
  setupFromUndefined() {
    let e3;
    for (e3 of L) this[e3] = N[e3];
    for (e3 of M) this[e3] = N[e3];
    for (e3 of j) this[e3] = N[e3];
    for (e3 of F) this[e3] = new D(e3, N[e3], void 0, this);
  }
  setupFromTrue() {
    let e3;
    for (e3 of L) this[e3] = N[e3];
    for (e3 of M) this[e3] = N[e3];
    for (e3 of j) this[e3] = true;
    for (e3 of F) this[e3] = new D(e3, true, void 0, this);
  }
  setupFromArray(e3) {
    let t3;
    for (t3 of L) this[t3] = N[t3];
    for (t3 of M) this[t3] = N[t3];
    for (t3 of j) this[t3] = N[t3];
    for (t3 of F) this[t3] = new D(t3, false, void 0, this);
    this.setupGlobalFilters(e3, void 0, P);
  }
  setupFromObject(e3) {
    let t3;
    for (t3 of (P.ifd0 = P.ifd0 || P.image, P.ifd1 = P.ifd1 || P.thumbnail, Object.assign(this, e3), L)) this[t3] = W(e3[t3], N[t3]);
    for (t3 of M) this[t3] = W(e3[t3], N[t3]);
    for (t3 of j) this[t3] = W(e3[t3], N[t3]);
    for (t3 of z) this[t3] = new D(t3, N[t3], e3[t3], this);
    for (t3 of P) this[t3] = new D(t3, N[t3], e3[t3], this.tiff);
    this.setupGlobalFilters(e3.pick, e3.skip, P, F), true === e3.tiff ? this.batchEnableWithBool(P, true) : false === e3.tiff ? this.batchEnableWithUserValue(P, e3) : Array.isArray(e3.tiff) ? this.setupGlobalFilters(e3.tiff, void 0, P) : "object" == typeof e3.tiff && this.setupGlobalFilters(e3.tiff.pick, e3.tiff.skip, P);
  }
  batchEnableWithBool(e3, t3) {
    for (let s3 of e3) this[s3].enabled = t3;
  }
  batchEnableWithUserValue(e3, t3) {
    for (let s3 of e3) {
      let e4 = t3[s3];
      this[s3].enabled = false !== e4 && void 0 !== e4;
    }
  }
  setupGlobalFilters(e3, t3, s3, i3 = s3) {
    if (e3 && e3.length) {
      for (let e4 of i3) this[e4].enabled = false;
      let t4 = K(e3, s3);
      for (let [e4, s4] of t4) X(this[e4].pick, s4), this[e4].enabled = true;
    } else if (t3 && t3.length) {
      let e4 = K(t3, s3);
      for (let [t4, s4] of e4) X(this[t4].skip, s4);
    }
  }
  filterNestedSegmentTags() {
    let { ifd0: e3, exif: t3, xmp: s3, iptc: i3, icc: n2 } = this;
    this.makerNote ? t3.deps.add(37500) : t3.skip.add(37500), this.userComment ? t3.deps.add(37510) : t3.skip.add(37510), s3.enabled || e3.skip.add(700), i3.enabled || e3.skip.add(33723), n2.enabled || e3.skip.add(34675);
  }
  traverseTiffDependencyTree() {
    let { ifd0: e3, exif: t3, gps: s3, interop: i3 } = this;
    i3.needed && (t3.deps.add(40965), e3.deps.add(40965)), t3.needed && e3.deps.add(34665), s3.needed && e3.deps.add(34853), this.tiff.enabled = P.some((e4) => true === this[e4].enabled) || this.makerNote || this.userComment;
    for (let e4 of P) this[e4].finalizeFilters();
  }
  get onlyTiff() {
    return !T.map((e3) => this[e3].enabled).some((e3) => true === e3) && this.tiff.enabled;
  }
  checkLoadedPlugins() {
    for (let e3 of z) this[e3].enabled && !y.has(e3) && p("segment parser", e3);
  }
};
function K(e3, t3) {
  let s3, i3, n2, r3, a3 = [];
  for (n2 of t3) {
    for (r3 of (s3 = B.get(n2), i3 = [], s3)) (e3.includes(r3[0]) || e3.includes(r3[1])) && i3.push(r3[0]);
    i3.length && a3.push([n2, i3]);
  }
  return a3;
}
function W(e3, t3) {
  return void 0 !== e3 ? e3 : void 0 !== t3 ? t3 : void 0;
}
function X(e3, t3) {
  for (let s3 of t3) e3.add(s3);
}
e(R, "default", N);
var H2 = class {
  constructor(t3) {
    e(this, "parsers", {}), e(this, "output", {}), e(this, "errors", []), e(this, "pushToErrors", (e3) => this.errors.push(e3)), this.options = R.useCached(t3);
  }
  async read(e3) {
    this.file = await function(e4, t3) {
      return "string" == typeof e4 ? k2(e4, t3) : s && !i && e4 instanceof HTMLImageElement ? k2(e4.src, t3) : e4 instanceof Uint8Array || e4 instanceof ArrayBuffer || e4 instanceof DataView ? new c(e4) : s && e4 instanceof Blob ? O(e4, t3, "blob", A) : void l2("Invalid input argument");
    }(e3, this.options);
  }
  setup() {
    if (this.fileParser) return;
    let { file: e3 } = this, t3 = e3.getUint16(0);
    for (let [s3, i3] of m) if (i3.canHandle(e3, t3)) return this.fileParser = new i3(this.options, this.file, this.parsers), e3[s3] = true;
    this.file.close && this.file.close(), l2("Unknown file format");
  }
  async parse() {
    let { output: e3, errors: t3 } = this;
    return this.setup(), this.options.silentErrors ? (await this.executeParsers().catch(this.pushToErrors), t3.push(...this.fileParser.errors)) : await this.executeParsers(), this.file.close && this.file.close(), this.options.silentErrors && t3.length > 0 && (e3.errors = t3), f(s3 = e3) ? void 0 : s3;
    var s3;
  }
  async executeParsers() {
    let { output: e3 } = this;
    await this.fileParser.parse();
    let t3 = Object.values(this.parsers).map(async (t4) => {
      let s3 = await t4.parse();
      t4.assignToOutput(e3, s3);
    });
    this.options.silentErrors && (t3 = t3.map((e4) => e4.catch(this.pushToErrors))), await Promise.all(t3);
  }
  async extractThumbnail() {
    this.setup();
    let { options: e3, file: t3 } = this, s3 = y.get("tiff", e3);
    var i3;
    if (t3.tiff ? i3 = { start: 0, type: "tiff" } : t3.jpeg && (i3 = await this.fileParser.getOrFindSegment("tiff")), void 0 === i3) return;
    let n2 = await this.fileParser.ensureSegmentChunk(i3), r3 = this.parsers.tiff = new s3(n2, e3, t3), a3 = await r3.extractThumbnail();
    return t3.close && t3.close(), a3;
  }
};
async function Y(e3, t3) {
  let s3 = new H2(t3);
  return await s3.read(e3), s3.parse();
}
var G = Object.freeze({ __proto__: null, parse: Y, Exifr: H2, fileParsers: m, segmentParsers: y, fileReaders: b2, tagKeys: B, tagValues: V, tagRevivers: I, createDictionary: x2, extendDictionary: C, fetchUrlAsArrayBuffer: S, readBlobAsArrayBuffer: A, chunkedProps: L, otherSegments: T, segments: z, tiffBlocks: P, segmentsAndBlocks: F, tiffExtractables: j, inheritables: E, allFormatters: M, Options: R });
var J2 = class {
  static findPosition(e3, t3) {
    let s3 = e3.getUint16(t3 + 2) + 2, i3 = "function" == typeof this.headerLength ? this.headerLength(e3, t3, s3) : this.headerLength, n2 = t3 + i3, r3 = s3 - i3;
    return { offset: t3, length: s3, headerLength: i3, start: n2, size: r3, end: n2 + r3 };
  }
  static parse(e3, t3 = {}) {
    return new this(e3, new R({ [this.type]: t3 }), e3).parse();
  }
  normalizeInput(e3) {
    return e3 instanceof c ? e3 : new c(e3);
  }
  constructor(t3, s3 = {}, i3) {
    e(this, "errors", []), e(this, "raw", /* @__PURE__ */ new Map()), e(this, "handleError", (e3) => {
      if (!this.options.silentErrors) throw e3;
      this.errors.push(e3.message);
    }), this.chunk = this.normalizeInput(t3), this.file = i3, this.type = this.constructor.type, this.globalOptions = this.options = s3, this.localOptions = s3[this.type], this.canTranslate = this.localOptions && this.localOptions.translate;
  }
  translate() {
    this.canTranslate && (this.translated = this.translateBlock(this.raw, this.type));
  }
  get output() {
    return this.translated ? this.translated : this.raw ? Object.fromEntries(this.raw) : void 0;
  }
  translateBlock(e3, t3) {
    let s3 = I.get(t3), i3 = V.get(t3), n2 = B.get(t3), r3 = this.options[t3], a3 = r3.reviveValues && !!s3, h9 = r3.translateValues && !!i3, f3 = r3.translateKeys && !!n2, l4 = {};
    for (let [t4, r4] of e3) a3 && s3.has(t4) ? r4 = s3.get(t4)(r4) : h9 && i3.has(t4) && (r4 = this.translateValue(r4, i3.get(t4))), f3 && n2.has(t4) && (t4 = n2.get(t4) || t4), l4[t4] = r4;
    return l4;
  }
  translateValue(e3, t3) {
    return t3[e3] || t3.DEFAULT || e3;
  }
  assignToOutput(e3, t3) {
    this.assignObjectToOutput(e3, this.constructor.type, t3);
  }
  assignObjectToOutput(e3, t3, s3) {
    if (this.globalOptions.mergeOutput) return Object.assign(e3, s3);
    e3[t3] ? Object.assign(e3[t3], s3) : e3[t3] = s3;
  }
};
e(J2, "headerLength", 4), e(J2, "type", void 0), e(J2, "multiSegment", false), e(J2, "canHandle", () => false);
function q(e3) {
  return 192 === e3 || 194 === e3 || 196 === e3 || 219 === e3 || 221 === e3 || 218 === e3 || 254 === e3;
}
function Q(e3) {
  return e3 >= 224 && e3 <= 239;
}
function Z(e3, t3, s3) {
  for (let [i3, n2] of y) if (n2.canHandle(e3, t3, s3)) return i3;
}
var ee = class extends class {
  constructor(t3, s3, i3) {
    e(this, "errors", []), e(this, "ensureSegmentChunk", async (e3) => {
      let t4 = e3.start, s4 = e3.size || 65536;
      if (this.file.chunked) if (this.file.available(t4, s4)) e3.chunk = this.file.subarray(t4, s4);
      else try {
        e3.chunk = await this.file.readChunk(t4, s4);
      } catch (t5) {
        l2(`Couldn't read segment: ${JSON.stringify(e3)}. ${t5.message}`);
      }
      else this.file.byteLength > t4 + s4 ? e3.chunk = this.file.subarray(t4, s4) : void 0 === e3.size ? e3.chunk = this.file.subarray(t4) : l2("Segment unreachable: " + JSON.stringify(e3));
      return e3.chunk;
    }), this.extendOptions && this.extendOptions(t3), this.options = t3, this.file = s3, this.parsers = i3;
  }
  injectSegment(e3, t3) {
    this.options[e3].enabled && this.createParser(e3, t3);
  }
  createParser(e3, t3) {
    let s3 = new (y.get(e3))(t3, this.options, this.file);
    return this.parsers[e3] = s3;
  }
  createParsers(e3) {
    for (let t3 of e3) {
      let { type: e4, chunk: s3 } = t3, i3 = this.options[e4];
      if (i3 && i3.enabled) {
        let t4 = this.parsers[e4];
        t4 && t4.append || t4 || this.createParser(e4, s3);
      }
    }
  }
  async readSegments(e3) {
    let t3 = e3.map(this.ensureSegmentChunk);
    await Promise.all(t3);
  }
} {
  constructor(...t3) {
    super(...t3), e(this, "appSegments", []), e(this, "jpegSegments", []), e(this, "unknownSegments", []);
  }
  static canHandle(e3, t3) {
    return 65496 === t3;
  }
  async parse() {
    await this.findAppSegments(), await this.readSegments(this.appSegments), this.mergeMultiSegments(), this.createParsers(this.mergedAppSegments || this.appSegments);
  }
  setupSegmentFinderArgs(e3) {
    true === e3 ? (this.findAll = true, this.wanted = new Set(y.keyList())) : (e3 = void 0 === e3 ? y.keyList().filter((e4) => this.options[e4].enabled) : e3.filter((e4) => this.options[e4].enabled && y.has(e4)), this.findAll = false, this.remaining = new Set(e3), this.wanted = new Set(e3)), this.unfinishedMultiSegment = false;
  }
  async findAppSegments(e3 = 0, t3) {
    this.setupSegmentFinderArgs(t3);
    let { file: s3, findAll: i3, wanted: n2, remaining: r3 } = this;
    if (!i3 && this.file.chunked && (i3 = Array.from(n2).some((e4) => {
      let t4 = y.get(e4), s4 = this.options[e4];
      return t4.multiSegment && s4.multiSegment;
    }), i3 && await this.file.readWhole()), e3 = this.findAppSegmentsInRange(e3, s3.byteLength), !this.options.onlyTiff && s3.chunked) {
      let t4 = false;
      for (; r3.size > 0 && !t4 && (s3.canReadNextChunk || this.unfinishedMultiSegment); ) {
        let { nextChunkOffset: i4 } = s3, n3 = this.appSegments.some((e4) => !this.file.available(e4.offset || e4.start, e4.length || e4.size));
        if (t4 = e3 > i4 && !n3 ? !await s3.readNextChunk(e3) : !await s3.readNextChunk(i4), void 0 === (e3 = this.findAppSegmentsInRange(e3, s3.byteLength))) return;
      }
    }
  }
  findAppSegmentsInRange(e3, t3) {
    t3 -= 2;
    let s3, i3, n2, r3, a3, h9, { file: f3, findAll: l4, wanted: o3, remaining: u3, options: d3 } = this;
    for (; e3 < t3; e3++) if (255 === f3.getUint8(e3)) {
      if (s3 = f3.getUint8(e3 + 1), Q(s3)) {
        if (i3 = f3.getUint16(e3 + 2), n2 = Z(f3, e3, i3), n2 && o3.has(n2) && (r3 = y.get(n2), a3 = r3.findPosition(f3, e3), h9 = d3[n2], a3.type = n2, this.appSegments.push(a3), !l4 && (r3.multiSegment && h9.multiSegment ? (this.unfinishedMultiSegment = a3.chunkNumber < a3.chunkCount, this.unfinishedMultiSegment || u3.delete(n2)) : u3.delete(n2), 0 === u3.size))) break;
        d3.recordUnknownSegments && (a3 = J2.findPosition(f3, e3), a3.marker = s3, this.unknownSegments.push(a3)), e3 += i3 + 1;
      } else if (q(s3)) {
        if (i3 = f3.getUint16(e3 + 2), 218 === s3 && false !== d3.stopAfterSos) return;
        d3.recordJpegSegments && this.jpegSegments.push({ offset: e3, length: i3, marker: s3 }), e3 += i3 + 1;
      }
    }
    return e3;
  }
  mergeMultiSegments() {
    if (!this.appSegments.some((e4) => e4.multiSegment)) return;
    let e3 = function(e4, t3) {
      let s3, i3, n2, r3 = /* @__PURE__ */ new Map();
      for (let a3 = 0; a3 < e4.length; a3++) s3 = e4[a3], i3 = s3[t3], r3.has(i3) ? n2 = r3.get(i3) : r3.set(i3, n2 = []), n2.push(s3);
      return Array.from(r3);
    }(this.appSegments, "type");
    this.mergedAppSegments = e3.map(([e4, t3]) => {
      let s3 = y.get(e4, this.options);
      if (s3.handleMultiSegments) {
        return { type: e4, chunk: s3.handleMultiSegments(t3) };
      }
      return t3[0];
    });
  }
  getSegment(e3) {
    return this.appSegments.find((t3) => t3.type === e3);
  }
  async getOrFindSegment(e3) {
    let t3 = this.getSegment(e3);
    return void 0 === t3 && (await this.findAppSegments(0, [e3]), t3 = this.getSegment(e3)), t3;
  }
};
e(ee, "type", "jpeg"), m.set("jpeg", ee);
var te = [void 0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8, 4];
var se = class extends J2 {
  parseHeader() {
    var e3 = this.chunk.getUint16();
    18761 === e3 ? this.le = true : 19789 === e3 && (this.le = false), this.chunk.le = this.le, this.headerParsed = true;
  }
  parseTags(e3, t3, s3 = /* @__PURE__ */ new Map()) {
    let { pick: i3, skip: n2 } = this.options[t3];
    i3 = new Set(i3);
    let r3 = i3.size > 0, a3 = 0 === n2.size, h9 = this.chunk.getUint16(e3);
    e3 += 2;
    for (let f3 = 0; f3 < h9; f3++) {
      let h10 = this.chunk.getUint16(e3);
      if (r3) {
        if (i3.has(h10) && (s3.set(h10, this.parseTag(e3, h10, t3)), i3.delete(h10), 0 === i3.size)) break;
      } else !a3 && n2.has(h10) || s3.set(h10, this.parseTag(e3, h10, t3));
      e3 += 12;
    }
    return s3;
  }
  parseTag(e3, t3, s3) {
    let { chunk: i3 } = this, n2 = i3.getUint16(e3 + 2), r3 = i3.getUint32(e3 + 4), a3 = te[n2];
    if (a3 * r3 <= 4 ? e3 += 8 : e3 = i3.getUint32(e3 + 8), (n2 < 1 || n2 > 13) && l2(`Invalid TIFF value type. block: ${s3.toUpperCase()}, tag: ${t3.toString(16)}, type: ${n2}, offset ${e3}`), e3 > i3.byteLength && l2(`Invalid TIFF value offset. block: ${s3.toUpperCase()}, tag: ${t3.toString(16)}, type: ${n2}, offset ${e3} is outside of chunk size ${i3.byteLength}`), 1 === n2) return i3.getUint8Array(e3, r3);
    if (2 === n2) return "" === (h9 = function(e4) {
      for (; e4.endsWith("\0"); ) e4 = e4.slice(0, -1);
      return e4;
    }(h9 = i3.getString(e3, r3)).trim()) ? void 0 : h9;
    var h9;
    if (7 === n2) return i3.getUint8Array(e3, r3);
    if (1 === r3) return this.parseTagValue(n2, e3);
    {
      let t4 = new (function(e4) {
        switch (e4) {
          case 1:
            return Uint8Array;
          case 3:
            return Uint16Array;
          case 4:
            return Uint32Array;
          case 5:
            return Array;
          case 6:
            return Int8Array;
          case 8:
            return Int16Array;
          case 9:
            return Int32Array;
          case 10:
            return Array;
          case 11:
            return Float32Array;
          case 12:
            return Float64Array;
          default:
            return Array;
        }
      }(n2))(r3), s4 = a3;
      for (let i4 = 0; i4 < r3; i4++) t4[i4] = this.parseTagValue(n2, e3), e3 += s4;
      return t4;
    }
  }
  parseTagValue(e3, t3) {
    let { chunk: s3 } = this;
    switch (e3) {
      case 1:
        return s3.getUint8(t3);
      case 3:
        return s3.getUint16(t3);
      case 4:
        return s3.getUint32(t3);
      case 5:
        return s3.getUint32(t3) / s3.getUint32(t3 + 4);
      case 6:
        return s3.getInt8(t3);
      case 8:
        return s3.getInt16(t3);
      case 9:
        return s3.getInt32(t3);
      case 10:
        return s3.getInt32(t3) / s3.getInt32(t3 + 4);
      case 11:
        return s3.getFloat(t3);
      case 12:
        return s3.getDouble(t3);
      case 13:
        return s3.getUint32(t3);
      default:
        l2(`Invalid tiff type ${e3}`);
    }
  }
};
var ie = class extends se {
  static canHandle(e3, t3) {
    return 225 === e3.getUint8(t3 + 1) && 1165519206 === e3.getUint32(t3 + 4) && 0 === e3.getUint16(t3 + 8);
  }
  async parse() {
    this.parseHeader();
    let { options: e3 } = this;
    return e3.ifd0.enabled && await this.parseIfd0Block(), e3.exif.enabled && await this.safeParse("parseExifBlock"), e3.gps.enabled && await this.safeParse("parseGpsBlock"), e3.interop.enabled && await this.safeParse("parseInteropBlock"), e3.ifd1.enabled && await this.safeParse("parseThumbnailBlock"), this.createOutput();
  }
  safeParse(e3) {
    let t3 = this[e3]();
    return void 0 !== t3.catch && (t3 = t3.catch(this.handleError)), t3;
  }
  findIfd0Offset() {
    void 0 === this.ifd0Offset && (this.ifd0Offset = this.chunk.getUint32(4));
  }
  findIfd1Offset() {
    if (void 0 === this.ifd1Offset) {
      this.findIfd0Offset();
      let e3 = this.chunk.getUint16(this.ifd0Offset), t3 = this.ifd0Offset + 2 + 12 * e3;
      this.ifd1Offset = this.chunk.getUint32(t3);
    }
  }
  parseBlock(e3, t3) {
    let s3 = /* @__PURE__ */ new Map();
    return this[t3] = s3, this.parseTags(e3, t3, s3), s3;
  }
  async parseIfd0Block() {
    if (this.ifd0) return;
    let { file: e3 } = this;
    this.findIfd0Offset(), this.ifd0Offset < 8 && l2("Malformed EXIF data"), !e3.chunked && this.ifd0Offset > e3.byteLength && l2(`IFD0 offset points to outside of file.
this.ifd0Offset: ${this.ifd0Offset}, file.byteLength: ${e3.byteLength}`), e3.tiff && await e3.ensureChunk(this.ifd0Offset, o(this.options));
    let t3 = this.parseBlock(this.ifd0Offset, "ifd0");
    return 0 !== t3.size ? (this.exifOffset = t3.get(34665), this.interopOffset = t3.get(40965), this.gpsOffset = t3.get(34853), this.xmp = t3.get(700), this.iptc = t3.get(33723), this.icc = t3.get(34675), this.options.sanitize && (t3.delete(34665), t3.delete(40965), t3.delete(34853), t3.delete(700), t3.delete(33723), t3.delete(34675)), t3) : void 0;
  }
  async parseExifBlock() {
    if (this.exif) return;
    if (this.ifd0 || await this.parseIfd0Block(), void 0 === this.exifOffset) return;
    this.file.tiff && await this.file.ensureChunk(this.exifOffset, o(this.options));
    let e3 = this.parseBlock(this.exifOffset, "exif");
    return this.interopOffset || (this.interopOffset = e3.get(40965)), this.makerNote = e3.get(37500), this.userComment = e3.get(37510), this.options.sanitize && (e3.delete(40965), e3.delete(37500), e3.delete(37510)), this.unpack(e3, 41728), this.unpack(e3, 41729), e3;
  }
  unpack(e3, t3) {
    let s3 = e3.get(t3);
    s3 && 1 === s3.length && e3.set(t3, s3[0]);
  }
  async parseGpsBlock() {
    if (this.gps) return;
    if (this.ifd0 || await this.parseIfd0Block(), void 0 === this.gpsOffset) return;
    let e3 = this.parseBlock(this.gpsOffset, "gps");
    return e3 && e3.has(2) && e3.has(4) && (e3.set("latitude", ne(...e3.get(2), e3.get(1))), e3.set("longitude", ne(...e3.get(4), e3.get(3)))), e3;
  }
  async parseInteropBlock() {
    if (!this.interop && (this.ifd0 || await this.parseIfd0Block(), void 0 !== this.interopOffset || this.exif || await this.parseExifBlock(), void 0 !== this.interopOffset)) return this.parseBlock(this.interopOffset, "interop");
  }
  async parseThumbnailBlock(e3 = false) {
    if (!this.ifd1 && !this.ifd1Parsed && (!this.options.mergeOutput || e3)) return this.findIfd1Offset(), this.ifd1Offset > 0 && (this.parseBlock(this.ifd1Offset, "ifd1"), this.ifd1Parsed = true), this.ifd1;
  }
  async extractThumbnail() {
    if (this.headerParsed || this.parseHeader(), this.ifd1Parsed || await this.parseThumbnailBlock(true), void 0 === this.ifd1) return;
    let e3 = this.ifd1.get(513), t3 = this.ifd1.get(514);
    return this.chunk.getUint8Array(e3, t3);
  }
  get image() {
    return this.ifd0;
  }
  get thumbnail() {
    return this.ifd1;
  }
  createOutput() {
    let e3, t3, s3, i3 = {};
    for (t3 of P) if (e3 = this[t3], !f(e3)) if (s3 = this.canTranslate ? this.translateBlock(e3, t3) : Object.fromEntries(e3), this.options.mergeOutput) {
      if ("ifd1" === t3) continue;
      Object.assign(i3, s3);
    } else i3[t3] = s3;
    return this.makerNote && (i3.makerNote = this.makerNote), this.userComment && (i3.userComment = this.userComment), i3;
  }
  assignToOutput(e3, t3) {
    if (this.globalOptions.mergeOutput) Object.assign(e3, t3);
    else for (let [s3, i3] of Object.entries(t3)) this.assignObjectToOutput(e3, s3, i3);
  }
};
function ne(e3, t3, s3, i3) {
  var n2 = e3 + t3 / 60 + s3 / 3600;
  return "S" !== i3 && "W" !== i3 || (n2 *= -1), n2;
}
e(ie, "type", "tiff"), e(ie, "headerLength", 10), y.set("tiff", ie);
var re = Object.freeze({ __proto__: null, default: G, Exifr: H2, fileParsers: m, segmentParsers: y, fileReaders: b2, tagKeys: B, tagValues: V, tagRevivers: I, createDictionary: x2, extendDictionary: C, fetchUrlAsArrayBuffer: S, readBlobAsArrayBuffer: A, chunkedProps: L, otherSegments: T, segments: z, tiffBlocks: P, segmentsAndBlocks: F, tiffExtractables: j, inheritables: E, allFormatters: M, Options: R, parse: Y });
var ae = { ifd0: false, ifd1: false, exif: false, gps: false, interop: false, sanitize: false, reviveValues: true, translateKeys: false, translateValues: false, mergeOutput: false };
var he = Object.assign({}, ae, { firstChunkSize: 4e4, gps: [1, 2, 3, 4] });
var le = Object.assign({}, ae, { tiff: false, ifd1: true, mergeOutput: false });
var de = Object.assign({}, ae, { firstChunkSize: 4e4, ifd0: [274] });
async function ce(e3) {
  let t3 = new H2(de);
  await t3.read(e3);
  let s3 = await t3.parse();
  if (s3 && s3.ifd0) return s3.ifd0[274];
}
var pe = Object.freeze({ 1: { dimensionSwapped: false, scaleX: 1, scaleY: 1, deg: 0, rad: 0 }, 2: { dimensionSwapped: false, scaleX: -1, scaleY: 1, deg: 0, rad: 0 }, 3: { dimensionSwapped: false, scaleX: 1, scaleY: 1, deg: 180, rad: 180 * Math.PI / 180 }, 4: { dimensionSwapped: false, scaleX: -1, scaleY: 1, deg: 180, rad: 180 * Math.PI / 180 }, 5: { dimensionSwapped: true, scaleX: 1, scaleY: -1, deg: 90, rad: 90 * Math.PI / 180 }, 6: { dimensionSwapped: true, scaleX: 1, scaleY: 1, deg: 90, rad: 90 * Math.PI / 180 }, 7: { dimensionSwapped: true, scaleX: 1, scaleY: -1, deg: 270, rad: 270 * Math.PI / 180 }, 8: { dimensionSwapped: true, scaleX: 1, scaleY: 1, deg: 270, rad: 270 * Math.PI / 180 } });
var ge = true;
var me = true;
if ("object" == typeof navigator) {
  let e3 = navigator.userAgent;
  if (e3.includes("iPad") || e3.includes("iPhone")) {
    let t3 = e3.match(/OS (\d+)_(\d+)/);
    if (t3) {
      let [, e4, s3] = t3, i3 = Number(e4) + 0.1 * Number(s3);
      ge = i3 < 13.4, me = false;
    }
  } else if (e3.includes("OS X 10")) {
    let [, t3] = e3.match(/OS X 10[_.](\d+)/);
    ge = me = Number(t3) < 15;
  }
  if (e3.includes("Chrome/")) {
    let [, t3] = e3.match(/Chrome\/(\d+)/);
    ge = me = Number(t3) < 81;
  } else if (e3.includes("Firefox/")) {
    let [, t3] = e3.match(/Firefox\/(\d+)/);
    ge = me = Number(t3) < 77;
  }
}
async function ye(e3) {
  let t3 = await ce(e3);
  return Object.assign({ canvas: ge, css: me }, pe[t3]);
}
var be = class extends c {
  constructor(...t3) {
    super(...t3), e(this, "ranges", new we()), 0 !== this.byteLength && this.ranges.add(0, this.byteLength);
  }
  _tryExtend(e3, t3, s3) {
    if (0 === e3 && 0 === this.byteLength && s3) {
      let e4 = new DataView(s3.buffer || s3, s3.byteOffset, s3.byteLength);
      this._swapDataView(e4);
    } else {
      let s4 = e3 + t3;
      if (s4 > this.byteLength) {
        let { dataView: e4 } = this._extend(s4);
        this._swapDataView(e4);
      }
    }
  }
  _extend(e3) {
    let t3;
    t3 = a ? r.allocUnsafe(e3) : new Uint8Array(e3);
    let s3 = new DataView(t3.buffer, t3.byteOffset, t3.byteLength);
    return t3.set(new Uint8Array(this.buffer, this.byteOffset, this.byteLength), 0), { uintView: t3, dataView: s3 };
  }
  subarray(e3, t3, s3 = false) {
    return t3 = t3 || this._lengthToEnd(e3), s3 && this._tryExtend(e3, t3), this.ranges.add(e3, t3), super.subarray(e3, t3);
  }
  set(e3, t3, s3 = false) {
    s3 && this._tryExtend(t3, e3.byteLength, e3);
    let i3 = super.set(e3, t3);
    return this.ranges.add(t3, i3.byteLength), i3;
  }
  async ensureChunk(e3, t3) {
    this.chunked && (this.ranges.available(e3, t3) || await this.readChunk(e3, t3));
  }
  available(e3, t3) {
    return this.ranges.available(e3, t3);
  }
};
var we = class {
  constructor() {
    e(this, "list", []);
  }
  get length() {
    return this.list.length;
  }
  add(e3, t3, s3 = 0) {
    let i3 = e3 + t3, n2 = this.list.filter((t4) => ke(e3, t4.offset, i3) || ke(e3, t4.end, i3));
    if (n2.length > 0) {
      e3 = Math.min(e3, ...n2.map((e4) => e4.offset)), i3 = Math.max(i3, ...n2.map((e4) => e4.end)), t3 = i3 - e3;
      let s4 = n2.shift();
      s4.offset = e3, s4.length = t3, s4.end = i3, this.list = this.list.filter((e4) => !n2.includes(e4));
    } else this.list.push({ offset: e3, length: t3, end: i3 });
  }
  available(e3, t3) {
    let s3 = e3 + t3;
    return this.list.some((t4) => t4.offset <= e3 && s3 <= t4.end);
  }
};
function ke(e3, t3, s3) {
  return e3 <= t3 && t3 <= s3;
}
var Oe = class extends be {
  constructor(t3, s3) {
    super(0), e(this, "chunksRead", 0), this.input = t3, this.options = s3;
  }
  async readWhole() {
    this.chunked = false, await this.readChunk(this.nextChunkOffset);
  }
  async readChunked() {
    this.chunked = true, await this.readChunk(0, this.options.firstChunkSize);
  }
  async readNextChunk(e3 = this.nextChunkOffset) {
    if (this.fullyRead) return this.chunksRead++, false;
    let t3 = this.options.chunkSize, s3 = await this.readChunk(e3, t3);
    return !!s3 && s3.byteLength === t3;
  }
  async readChunk(e3, t3) {
    if (this.chunksRead++, 0 !== (t3 = this.safeWrapAddress(e3, t3))) return this._readChunk(e3, t3);
  }
  safeWrapAddress(e3, t3) {
    return void 0 !== this.size && e3 + t3 > this.size ? Math.max(0, this.size - e3) : t3;
  }
  get nextChunkOffset() {
    if (0 !== this.ranges.list.length) return this.ranges.list[0].length;
  }
  get canReadNextChunk() {
    return this.chunksRead < this.options.chunkLimit;
  }
  get fullyRead() {
    return void 0 !== this.size && this.nextChunkOffset === this.size;
  }
  read() {
    return this.options.chunked ? this.readChunked() : this.readWhole();
  }
  close() {
  }
};
b2.set("blob", class extends Oe {
  async readWhole() {
    this.chunked = false;
    let e3 = await A(this.input);
    this._swapArrayBuffer(e3);
  }
  readChunked() {
    return this.chunked = true, this.size = this.input.size, super.readChunked();
  }
  async _readChunk(e3, t3) {
    let s3 = t3 ? e3 + t3 : void 0, i3 = this.input.slice(e3, s3), n2 = await A(i3);
    return this.set(n2, e3, true);
  }
});

// node_modules/@uppy/thumbnail-generator/lib/locale.js
var import_dist25 = __toESM(require_dist(), 1);
var import_dist26 = __toESM(require_dist2(), 1);
var import_dist27 = __toESM(require_dist3(), 1);
var locale_default = {
  strings: {
    generatingThumbnails: "Generating thumbnails..."
  }
};

// node_modules/@uppy/thumbnail-generator/lib/index.js
var packageJson2 = {
  "version": "4.1.1"
};
function canvasToBlob(canvas, type, quality) {
  try {
    canvas.getContext("2d").getImageData(0, 0, 1, 1);
  } catch (err) {
    if (err.code === 18) {
      return Promise.reject(new Error("cannot read image, probably an svg with external resources"));
    }
  }
  if (canvas.toBlob) {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, type, quality);
    }).then((blob) => {
      if (blob === null) {
        throw new Error("cannot read image, probably an svg with external resources");
      }
      return blob;
    });
  }
  return Promise.resolve().then(() => {
    return dataURItoBlob_default(canvas.toDataURL(type, quality), {});
  }).then((blob) => {
    if (blob === null) {
      throw new Error("could not extract blob, probably an old browser");
    }
    return blob;
  });
}
function rotateImage(image, translate) {
  let w3 = image.width;
  let h9 = image.height;
  if (translate.deg === 90 || translate.deg === 270) {
    w3 = image.height;
    h9 = image.width;
  }
  const canvas = document.createElement("canvas");
  canvas.width = w3;
  canvas.height = h9;
  const context = canvas.getContext("2d");
  context.translate(w3 / 2, h9 / 2);
  if (translate.canvas) {
    context.rotate(translate.rad);
    context.scale(translate.scaleX, translate.scaleY);
  }
  context.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height);
  return canvas;
}
function protect(image) {
  const ratio = image.width / image.height;
  const maxSquare = 5e6;
  const maxSize = 4096;
  let maxW = Math.floor(Math.sqrt(maxSquare * ratio));
  let maxH = Math.floor(maxSquare / Math.sqrt(maxSquare * ratio));
  if (maxW > maxSize) {
    maxW = maxSize;
    maxH = Math.round(maxW / ratio);
  }
  if (maxH > maxSize) {
    maxH = maxSize;
    maxW = Math.round(ratio * maxH);
  }
  if (image.width > maxW) {
    const canvas = document.createElement("canvas");
    canvas.width = maxW;
    canvas.height = maxH;
    canvas.getContext("2d").drawImage(image, 0, 0, maxW, maxH);
    return canvas;
  }
  return image;
}
var defaultOptions = {
  thumbnailWidth: null,
  thumbnailHeight: null,
  thumbnailType: "image/jpeg",
  waitForThumbnailsBeforeUpload: false,
  lazy: false
};
var ThumbnailGenerator = class extends UIPlugin_default {
  constructor(uppy, opts) {
    super(uppy, {
      ...defaultOptions,
      ...opts
    });
    this.onFileAdded = (file) => {
      if (!file.preview && file.data && isPreviewSupported(file.type) && !file.isRemote) {
        this.addToQueue(file.id);
      }
    };
    this.onCancelRequest = (file) => {
      const index = this.queue.indexOf(file.id);
      if (index !== -1) {
        this.queue.splice(index, 1);
      }
    };
    this.onFileRemoved = (file) => {
      const index = this.queue.indexOf(file.id);
      if (index !== -1) {
        this.queue.splice(index, 1);
      }
      if (file.preview && isObjectURL(file.preview)) {
        URL.revokeObjectURL(file.preview);
      }
    };
    this.onRestored = () => {
      const restoredFiles = this.uppy.getFiles().filter((file) => file.isRestored);
      restoredFiles.forEach((file) => {
        if (!file.preview || isObjectURL(file.preview)) {
          this.addToQueue(file.id);
        }
      });
    };
    this.onAllFilesRemoved = () => {
      this.queue = [];
    };
    this.waitUntilAllProcessed = (fileIDs) => {
      fileIDs.forEach((fileID) => {
        const file = this.uppy.getFile(fileID);
        this.uppy.emit("preprocess-progress", file, {
          mode: "indeterminate",
          message: this.i18n("generatingThumbnails")
        });
      });
      const emitPreprocessCompleteForAll = () => {
        fileIDs.forEach((fileID) => {
          const file = this.uppy.getFile(fileID);
          this.uppy.emit("preprocess-complete", file);
        });
      };
      return new Promise((resolve) => {
        if (this.queueProcessing) {
          this.uppy.once("thumbnail:all-generated", () => {
            emitPreprocessCompleteForAll();
            resolve();
          });
        } else {
          emitPreprocessCompleteForAll();
          resolve();
        }
      });
    };
    this.type = "modifier";
    this.id = this.opts.id || "ThumbnailGenerator";
    this.title = "Thumbnail Generator";
    this.queue = [];
    this.queueProcessing = false;
    this.defaultThumbnailDimension = 200;
    this.thumbnailType = this.opts.thumbnailType;
    this.defaultLocale = locale_default;
    this.i18nInit();
    if (this.opts.lazy && this.opts.waitForThumbnailsBeforeUpload) {
      throw new Error("ThumbnailGenerator: The `lazy` and `waitForThumbnailsBeforeUpload` options are mutually exclusive. Please ensure at most one of them is set to `true`.");
    }
  }
  createThumbnail(file, targetWidth, targetHeight) {
    const originalUrl = URL.createObjectURL(file.data);
    const onload = new Promise((resolve, reject) => {
      const image = new Image();
      image.src = originalUrl;
      image.addEventListener("load", () => {
        URL.revokeObjectURL(originalUrl);
        resolve(image);
      });
      image.addEventListener("error", (event) => {
        URL.revokeObjectURL(originalUrl);
        reject(event.error || new Error("Could not create thumbnail"));
      });
    });
    const orientationPromise = ye(file.data).catch(() => 1);
    return Promise.all([onload, orientationPromise]).then((_ref) => {
      let [image, orientation] = _ref;
      const dimensions = this.getProportionalDimensions(image, targetWidth, targetHeight, orientation.deg);
      const rotatedImage = rotateImage(image, orientation);
      const resizedImage = this.resizeImage(rotatedImage, dimensions.width, dimensions.height);
      return canvasToBlob(resizedImage, this.thumbnailType, 80);
    }).then((blob) => {
      return URL.createObjectURL(blob);
    });
  }
  /**
   * Get the new calculated dimensions for the given image and a target width
   * or height. If both width and height are given, only width is taken into
   * account. If neither width nor height are given, the default dimension
   * is used.
   */
  getProportionalDimensions(img, width, height, deg) {
    let aspect = img.width / img.height;
    if (deg === 90 || deg === 270) {
      aspect = img.height / img.width;
    }
    if (width != null) {
      return {
        width,
        height: Math.round(width / aspect)
      };
    }
    if (height != null) {
      return {
        width: Math.round(height * aspect),
        height
      };
    }
    return {
      width: this.defaultThumbnailDimension,
      height: Math.round(this.defaultThumbnailDimension / aspect)
    };
  }
  /**
   * Resize an image to the target `width` and `height`.
   *
   * Returns a Canvas with the resized image on it.
   */
  // eslint-disable-next-line class-methods-use-this
  resizeImage(image, targetWidth, targetHeight) {
    let img = protect(image);
    let steps = Math.ceil(Math.log2(img.width / targetWidth));
    if (steps < 1) {
      steps = 1;
    }
    let sW = targetWidth * 2 ** (steps - 1);
    let sH = targetHeight * 2 ** (steps - 1);
    const x3 = 2;
    while (steps--) {
      const canvas = document.createElement("canvas");
      canvas.width = sW;
      canvas.height = sH;
      canvas.getContext("2d").drawImage(img, 0, 0, sW, sH);
      img = canvas;
      sW = Math.round(sW / x3);
      sH = Math.round(sH / x3);
    }
    return img;
  }
  /**
   * Set the preview URL for a file.
   */
  setPreviewURL(fileID, preview) {
    this.uppy.setFileState(fileID, {
      preview
    });
  }
  addToQueue(fileID) {
    this.queue.push(fileID);
    if (this.queueProcessing === false) {
      this.processQueue();
    }
  }
  processQueue() {
    this.queueProcessing = true;
    if (this.queue.length > 0) {
      const current = this.uppy.getFile(this.queue.shift());
      if (!current) {
        this.uppy.log("[ThumbnailGenerator] file was removed before a thumbnail could be generated, but not removed from the queue. This is probably a bug", "error");
        return Promise.resolve();
      }
      return this.requestThumbnail(current).catch(() => {
      }).then(() => this.processQueue());
    }
    this.queueProcessing = false;
    this.uppy.log("[ThumbnailGenerator] Emptied thumbnail queue");
    this.uppy.emit("thumbnail:all-generated");
    return Promise.resolve();
  }
  requestThumbnail(file) {
    if (isPreviewSupported(file.type) && !file.isRemote) {
      return this.createThumbnail(file, this.opts.thumbnailWidth, this.opts.thumbnailHeight).then((preview) => {
        this.setPreviewURL(file.id, preview);
        this.uppy.log(`[ThumbnailGenerator] Generated thumbnail for ${file.id}`);
        this.uppy.emit("thumbnail:generated", this.uppy.getFile(file.id), preview);
      }).catch((err) => {
        this.uppy.log(`[ThumbnailGenerator] Failed thumbnail for ${file.id}:`, "warning");
        this.uppy.log(err, "warning");
        this.uppy.emit("thumbnail:error", this.uppy.getFile(file.id), err);
      });
    }
    return Promise.resolve();
  }
  install() {
    this.uppy.on("file-removed", this.onFileRemoved);
    this.uppy.on("cancel-all", this.onAllFilesRemoved);
    if (this.opts.lazy) {
      this.uppy.on("thumbnail:request", this.onFileAdded);
      this.uppy.on("thumbnail:cancel", this.onCancelRequest);
    } else {
      this.uppy.on("thumbnail:request", this.onFileAdded);
      this.uppy.on("file-added", this.onFileAdded);
      this.uppy.on("restored", this.onRestored);
    }
    if (this.opts.waitForThumbnailsBeforeUpload) {
      this.uppy.addPreProcessor(this.waitUntilAllProcessed);
    }
  }
  uninstall() {
    this.uppy.off("file-removed", this.onFileRemoved);
    this.uppy.off("cancel-all", this.onAllFilesRemoved);
    if (this.opts.lazy) {
      this.uppy.off("thumbnail:request", this.onFileAdded);
      this.uppy.off("thumbnail:cancel", this.onCancelRequest);
    } else {
      this.uppy.off("thumbnail:request", this.onFileAdded);
      this.uppy.off("file-added", this.onFileAdded);
      this.uppy.off("restored", this.onRestored);
    }
    if (this.opts.waitForThumbnailsBeforeUpload) {
      this.uppy.removePreProcessor(this.waitUntilAllProcessed);
    }
  }
};
ThumbnailGenerator.VERSION = packageJson2.version;

// node_modules/@uppy/utils/lib/findAllDOMElements.js
var import_dist31 = __toESM(require_dist());
var import_dist32 = __toESM(require_dist2());
var import_dist33 = __toESM(require_dist3());
function findAllDOMElements(element) {
  if (typeof element === "string") {
    const elements = document.querySelectorAll(element);
    return elements.length === 0 ? null : Array.from(elements);
  }
  if (typeof element === "object" && isDOMElement(element)) {
    return [element];
  }
  return null;
}
var findAllDOMElements_default = findAllDOMElements;

// node_modules/@uppy/utils/lib/toArray.js
var import_dist34 = __toESM(require_dist());
var import_dist35 = __toESM(require_dist2());
var import_dist36 = __toESM(require_dist3());
var toArray_default = Array.from;

// node_modules/@uppy/utils/lib/getDroppedFiles/index.js
var import_dist46 = __toESM(require_dist());
var import_dist47 = __toESM(require_dist2());
var import_dist48 = __toESM(require_dist3());

// node_modules/@uppy/utils/lib/getDroppedFiles/utils/webkitGetAsEntryApi/index.js
var import_dist40 = __toESM(require_dist(), 1);
var import_dist41 = __toESM(require_dist2(), 1);
var import_dist42 = __toESM(require_dist3(), 1);

// node_modules/@uppy/utils/lib/getDroppedFiles/utils/webkitGetAsEntryApi/getFilesAndDirectoriesFromDirectory.js
var import_dist37 = __toESM(require_dist(), 1);
var import_dist38 = __toESM(require_dist2(), 1);
var import_dist39 = __toESM(require_dist3(), 1);
function getFilesAndDirectoriesFromDirectory(directoryReader, oldEntries, logDropError, _ref) {
  let {
    onSuccess
  } = _ref;
  directoryReader.readEntries(
    (entries) => {
      const newEntries = [...oldEntries, ...entries];
      if (entries.length) {
        queueMicrotask(() => {
          getFilesAndDirectoriesFromDirectory(directoryReader, newEntries, logDropError, {
            onSuccess
          });
        });
      } else {
        onSuccess(newEntries);
      }
    },
    // Make sure we resolve on error anyway, it's fine if only one directory couldn't be parsed!
    (error) => {
      logDropError(error);
      onSuccess(oldEntries);
    }
  );
}

// node_modules/@uppy/utils/lib/getDroppedFiles/utils/webkitGetAsEntryApi/index.js
function getAsFileSystemHandleFromEntry(entry, logDropError) {
  if (entry == null) return entry;
  return {
    kind: (
      // eslint-disable-next-line no-nested-ternary
      entry.isFile ? "file" : entry.isDirectory ? "directory" : void 0
    ),
    name: entry.name,
    getFile() {
      return new Promise((resolve, reject) => entry.file(resolve, reject));
    },
    async *values() {
      const directoryReader = entry.createReader();
      const entries = await new Promise((resolve) => {
        getFilesAndDirectoriesFromDirectory(directoryReader, [], logDropError, {
          onSuccess: (dirEntries) => resolve(dirEntries.map((file) => getAsFileSystemHandleFromEntry(file, logDropError)))
        });
      });
      yield* entries;
    },
    isSameEntry: void 0
  };
}
function createPromiseToAddFileOrParseDirectory(entry, relativePath, lastResortFile) {
  try {
    if (lastResortFile === void 0) {
      lastResortFile = void 0;
    }
    return async function* () {
      const getNextRelativePath = () => `${relativePath}/${entry.name}`;
      if (entry.kind === "file") {
        const file = await entry.getFile();
        if (file != null) {
          ;
          file.relativePath = relativePath ? getNextRelativePath() : null;
          yield file;
        } else if (lastResortFile != null) yield lastResortFile;
      } else if (entry.kind === "directory") {
        for await (const handle of entry.values()) {
          yield* createPromiseToAddFileOrParseDirectory(handle, relativePath ? getNextRelativePath() : entry.name);
        }
      } else if (lastResortFile != null) yield lastResortFile;
    }();
  } catch (e3) {
    return Promise.reject(e3);
  }
}
async function* getFilesFromDataTransfer(dataTransfer, logDropError) {
  const fileSystemHandles = await Promise.all(Array.from(dataTransfer.items, async (item) => {
    var _fileSystemHandle;
    let fileSystemHandle;
    const getAsEntry = () => typeof item.getAsEntry === "function" ? item.getAsEntry() : item.webkitGetAsEntry();
    (_fileSystemHandle = fileSystemHandle) != null ? _fileSystemHandle : fileSystemHandle = getAsFileSystemHandleFromEntry(getAsEntry(), logDropError);
    return {
      fileSystemHandle,
      lastResortFile: item.getAsFile()
      // can be used as a fallback in case other methods fail
    };
  }));
  for (const {
    lastResortFile,
    fileSystemHandle
  } of fileSystemHandles) {
    if (fileSystemHandle != null) {
      try {
        yield* createPromiseToAddFileOrParseDirectory(fileSystemHandle, "", lastResortFile);
      } catch (err) {
        if (lastResortFile != null) {
          yield lastResortFile;
        } else {
          logDropError(err);
        }
      }
    } else if (lastResortFile != null) yield lastResortFile;
  }
}

// node_modules/@uppy/utils/lib/getDroppedFiles/utils/fallbackApi.js
var import_dist43 = __toESM(require_dist(), 1);
var import_dist44 = __toESM(require_dist2(), 1);
var import_dist45 = __toESM(require_dist3(), 1);
function fallbackApi(dataTransfer) {
  const files = toArray_default(dataTransfer.files);
  return Promise.resolve(files);
}

// node_modules/@uppy/utils/lib/getDroppedFiles/index.js
async function getDroppedFiles(dataTransfer, options) {
  var _options$logDropError;
  const logDropError = (_options$logDropError = options == null ? void 0 : options.logDropError) != null ? _options$logDropError : Function.prototype;
  try {
    const accumulator = [];
    for await (const file of getFilesFromDataTransfer(dataTransfer, logDropError)) {
      accumulator.push(file);
    }
    return accumulator;
  } catch {
    return fallbackApi(dataTransfer);
  }
}

// node_modules/@uppy/provider-views/lib/index.js
var import_dist172 = __toESM(require_dist());
var import_dist173 = __toESM(require_dist2());
var import_dist174 = __toESM(require_dist3());

// node_modules/@uppy/provider-views/lib/ProviderView/index.js
var import_dist154 = __toESM(require_dist(), 1);
var import_dist155 = __toESM(require_dist2(), 1);
var import_dist156 = __toESM(require_dist3(), 1);

// node_modules/@uppy/provider-views/lib/ProviderView/ProviderView.js
var import_dist151 = __toESM(require_dist(), 1);
var import_dist152 = __toESM(require_dist2(), 1);
var import_dist153 = __toESM(require_dist3(), 1);
var import_classnames4 = __toESM(require_classnames(), 1);

// node_modules/@uppy/utils/lib/remoteFileObjToLocal.js
var import_dist49 = __toESM(require_dist());
var import_dist50 = __toESM(require_dist2());
var import_dist51 = __toESM(require_dist3());
function remoteFileObjToLocal(file) {
  return {
    ...file,
    type: file.mimeType,
    extension: file.name ? getFileNameAndExtension(file.name).extension : null
  };
}

// node_modules/@uppy/provider-views/lib/ProviderView/AuthView.js
var import_dist55 = __toESM(require_dist(), 1);
var import_dist56 = __toESM(require_dist2(), 1);
var import_dist57 = __toESM(require_dist3(), 1);

// node_modules/preact/hooks/dist/hooks.module.js
var import_dist52 = __toESM(require_dist());
var import_dist53 = __toESM(require_dist2());
var import_dist54 = __toESM(require_dist3());
var t2;
var r2;
var u2;
var i2;
var o2 = 0;
var f2 = [];
var c2 = l;
var e2 = c2.__b;
var a2 = c2.__r;
var v2 = c2.diffed;
var l3 = c2.__c;
var m2 = c2.unmount;
var s2 = c2.__;
function p2(n2, t3) {
  c2.__h && c2.__h(r2, n2, o2 || t3), o2 = 0;
  var u3 = r2.__H || (r2.__H = { __: [], __h: [] });
  return n2 >= u3.__.length && u3.__.push({}), u3.__[n2];
}
function d2(n2) {
  return o2 = 1, h2(D2, n2);
}
function h2(n2, u3, i3) {
  var o3 = p2(t2++, 2);
  if (o3.t = n2, !o3.__c && (o3.__ = [i3 ? i3(u3) : D2(void 0, u3), function(n3) {
    var t3 = o3.__N ? o3.__N[0] : o3.__[0], r3 = o3.t(t3, n3);
    t3 !== r3 && (o3.__N = [r3, o3.__[1]], o3.__c.setState({}));
  }], o3.__c = r2, !r2.__f)) {
    var f3 = function(n3, t3, r3) {
      if (!o3.__c.__H) return true;
      var u4 = o3.__c.__H.__.filter(function(n4) {
        return !!n4.__c;
      });
      if (u4.every(function(n4) {
        return !n4.__N;
      })) return !c3 || c3.call(this, n3, t3, r3);
      var i4 = o3.__c.props !== n3;
      return u4.forEach(function(n4) {
        if (n4.__N) {
          var t4 = n4.__[0];
          n4.__ = n4.__N, n4.__N = void 0, t4 !== n4.__[0] && (i4 = true);
        }
      }), c3 && c3.call(this, n3, t3, r3) || i4;
    };
    r2.__f = true;
    var c3 = r2.shouldComponentUpdate, e3 = r2.componentWillUpdate;
    r2.componentWillUpdate = function(n3, t3, r3) {
      if (this.__e) {
        var u4 = c3;
        c3 = void 0, f3(n3, t3, r3), c3 = u4;
      }
      e3 && e3.call(this, n3, t3, r3);
    }, r2.shouldComponentUpdate = f3;
  }
  return o3.__N || o3.__;
}
function y2(n2, u3) {
  var i3 = p2(t2++, 3);
  !c2.__s && C2(i3.__H, u3) && (i3.__ = n2, i3.u = u3, r2.__H.__h.push(i3));
}
function A2(n2) {
  return o2 = 5, T2(function() {
    return { current: n2 };
  }, []);
}
function T2(n2, r3) {
  var u3 = p2(t2++, 7);
  return C2(u3.__H, r3) && (u3.__ = n2(), u3.__H = r3, u3.__h = n2), u3.__;
}
function q2(n2, t3) {
  return o2 = 8, T2(function() {
    return n2;
  }, t3);
}
function j2() {
  for (var n2; n2 = f2.shift(); ) if (n2.__P && n2.__H) try {
    n2.__H.__h.forEach(z2), n2.__H.__h.forEach(B2), n2.__H.__h = [];
  } catch (t3) {
    n2.__H.__h = [], c2.__e(t3, n2.__v);
  }
}
c2.__b = function(n2) {
  r2 = null, e2 && e2(n2);
}, c2.__ = function(n2, t3) {
  n2 && t3.__k && t3.__k.__m && (n2.__m = t3.__k.__m), s2 && s2(n2, t3);
}, c2.__r = function(n2) {
  a2 && a2(n2), t2 = 0;
  var i3 = (r2 = n2.__c).__H;
  i3 && (u2 === r2 ? (i3.__h = [], r2.__h = [], i3.__.forEach(function(n3) {
    n3.__N && (n3.__ = n3.__N), n3.u = n3.__N = void 0;
  })) : (i3.__h.forEach(z2), i3.__h.forEach(B2), i3.__h = [], t2 = 0)), u2 = r2;
}, c2.diffed = function(n2) {
  v2 && v2(n2);
  var t3 = n2.__c;
  t3 && t3.__H && (t3.__H.__h.length && (1 !== f2.push(t3) && i2 === c2.requestAnimationFrame || ((i2 = c2.requestAnimationFrame) || w2)(j2)), t3.__H.__.forEach(function(n3) {
    n3.u && (n3.__H = n3.u), n3.u = void 0;
  })), u2 = r2 = null;
}, c2.__c = function(n2, t3) {
  t3.some(function(n3) {
    try {
      n3.__h.forEach(z2), n3.__h = n3.__h.filter(function(n4) {
        return !n4.__ || B2(n4);
      });
    } catch (r3) {
      t3.some(function(n4) {
        n4.__h && (n4.__h = []);
      }), t3 = [], c2.__e(r3, n3.__v);
    }
  }), l3 && l3(n2, t3);
}, c2.unmount = function(n2) {
  m2 && m2(n2);
  var t3, r3 = n2.__c;
  r3 && r3.__H && (r3.__H.__.forEach(function(n3) {
    try {
      z2(n3);
    } catch (n4) {
      t3 = n4;
    }
  }), r3.__H = void 0, t3 && c2.__e(t3, r3.__v));
};
var k3 = "function" == typeof requestAnimationFrame;
function w2(n2) {
  var t3, r3 = function() {
    clearTimeout(u3), k3 && cancelAnimationFrame(t3), setTimeout(n2);
  }, u3 = setTimeout(r3, 100);
  k3 && (t3 = requestAnimationFrame(r3));
}
function z2(n2) {
  var t3 = r2, u3 = n2.__c;
  "function" == typeof u3 && (n2.__c = void 0, u3()), r2 = t3;
}
function B2(n2) {
  var t3 = r2;
  n2.__c = n2.__(), r2 = t3;
}
function C2(n2, t3) {
  return !n2 || n2.length !== t3.length || t3.some(function(t4, r3) {
    return t4 !== n2[r3];
  });
}
function D2(n2, t3) {
  return "function" == typeof t3 ? t3(n2) : t3;
}

// node_modules/@uppy/provider-views/lib/ProviderView/AuthView.js
function GoogleIcon() {
  return _("svg", {
    width: "26",
    height: "26",
    viewBox: "0 0 26 26",
    xmlns: "http://www.w3.org/2000/svg"
  }, _("g", {
    fill: "none",
    "fill-rule": "evenodd"
  }, _("circle", {
    fill: "#FFF",
    cx: "13",
    cy: "13",
    r: "13"
  }), _("path", {
    d: "M21.64 13.205c0-.639-.057-1.252-.164-1.841H13v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z",
    fill: "#4285F4",
    "fill-rule": "nonzero"
  }), _("path", {
    d: "M13 22c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H4.957v2.332A8.997 8.997 0 0013 22z",
    fill: "#34A853",
    "fill-rule": "nonzero"
  }), _("path", {
    d: "M7.964 14.71A5.41 5.41 0 017.682 13c0-.593.102-1.17.282-1.71V8.958H4.957A8.996 8.996 0 004 13c0 1.452.348 2.827.957 4.042l3.007-2.332z",
    fill: "#FBBC05",
    "fill-rule": "nonzero"
  }), _("path", {
    d: "M13 7.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C17.463 4.891 15.426 4 13 4a8.997 8.997 0 00-8.043 4.958l3.007 2.332C8.672 9.163 10.656 7.58 13 7.58z",
    fill: "#EA4335",
    "fill-rule": "nonzero"
  }), _("path", {
    d: "M4 4h18v18H4z"
  })));
}
function DefaultForm(_ref) {
  let {
    pluginName,
    i18n,
    onAuth
  } = _ref;
  const isGoogleDrive = pluginName === "Google Drive";
  const onSubmit = q2((e3) => {
    e3.preventDefault();
    onAuth();
  }, [onAuth]);
  return _("form", {
    onSubmit
  }, isGoogleDrive ? _("button", {
    type: "submit",
    className: "uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Provider-authBtn uppy-Provider-btn-google",
    "data-uppy-super-focusable": true
  }, _(GoogleIcon, null), i18n("signInWithGoogle")) : _("button", {
    type: "submit",
    className: "uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Provider-authBtn",
    "data-uppy-super-focusable": true
  }, i18n("authenticateWith", {
    pluginName
  })));
}
var defaultRenderForm = (_ref2) => {
  let {
    pluginName,
    i18n,
    onAuth
  } = _ref2;
  return _(DefaultForm, {
    pluginName,
    i18n,
    onAuth
  });
};
function AuthView(_ref3) {
  let {
    loading,
    pluginName,
    pluginIcon,
    i18n,
    handleAuth,
    renderForm = defaultRenderForm
  } = _ref3;
  return _("div", {
    className: "uppy-Provider-auth"
  }, _("div", {
    className: "uppy-Provider-authIcon"
  }, pluginIcon()), _("div", {
    className: "uppy-Provider-authTitle"
  }, i18n("authenticateWithTitle", {
    pluginName
  })), renderForm({
    pluginName,
    i18n,
    loading,
    onAuth: handleAuth
  }));
}

// node_modules/@uppy/provider-views/lib/ProviderView/Header.js
var import_dist64 = __toESM(require_dist(), 1);
var import_dist65 = __toESM(require_dist2(), 1);
var import_dist66 = __toESM(require_dist3(), 1);
var import_classnames = __toESM(require_classnames(), 1);

// node_modules/@uppy/provider-views/lib/ProviderView/User.js
var import_dist58 = __toESM(require_dist(), 1);
var import_dist59 = __toESM(require_dist2(), 1);
var import_dist60 = __toESM(require_dist3(), 1);
function User(_ref) {
  let {
    i18n,
    logout: logout2,
    username
  } = _ref;
  return _(k, null, username && _("span", {
    className: "uppy-ProviderBrowser-user",
    key: "username"
  }, username), _("button", {
    type: "button",
    onClick: logout2,
    className: "uppy-u-reset uppy-c-btn uppy-ProviderBrowser-userLogout",
    key: "logout"
  }, i18n("logOut")));
}

// node_modules/@uppy/provider-views/lib/Breadcrumbs.js
var import_dist61 = __toESM(require_dist(), 1);
var import_dist62 = __toESM(require_dist2(), 1);
var import_dist63 = __toESM(require_dist3(), 1);
function Breadcrumbs(props) {
  const {
    openFolder,
    title,
    breadcrumbsIcon,
    breadcrumbs,
    i18n
  } = props;
  return _("div", {
    className: "uppy-Provider-breadcrumbs"
  }, _("div", {
    className: "uppy-Provider-breadcrumbsIcon"
  }, breadcrumbsIcon), breadcrumbs.map((folder, index) => {
    var _folder$data$name;
    return _(k, null, _("button", {
      key: folder.id,
      type: "button",
      className: "uppy-u-reset uppy-c-btn",
      onClick: () => openFolder(folder.id)
    }, folder.type === "root" ? title : (_folder$data$name = folder.data.name) != null ? _folder$data$name : i18n("unnamed")), breadcrumbs.length === index + 1 ? "" : " / ");
  }));
}

// node_modules/@uppy/provider-views/lib/ProviderView/Header.js
function Header(props) {
  return _("div", {
    className: "uppy-ProviderBrowser-header"
  }, _("div", {
    className: (0, import_classnames.default)("uppy-ProviderBrowser-headerBar", !props.showBreadcrumbs && "uppy-ProviderBrowser-headerBar--simple")
  }, props.showBreadcrumbs && _(Breadcrumbs, {
    openFolder: props.openFolder,
    breadcrumbs: props.breadcrumbs,
    breadcrumbsIcon: props.pluginIcon && props.pluginIcon(),
    title: props.title,
    i18n: props.i18n
  }), _(User, {
    logout: props.logout,
    username: props.username,
    i18n: props.i18n
  })));
}

// node_modules/@uppy/provider-views/lib/Browser.js
var import_dist82 = __toESM(require_dist(), 1);
var import_dist83 = __toESM(require_dist2(), 1);
var import_dist84 = __toESM(require_dist3(), 1);

// node_modules/@uppy/utils/lib/VirtualList.js
var import_dist67 = __toESM(require_dist());
var import_dist68 = __toESM(require_dist2());
var import_dist69 = __toESM(require_dist3());
function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function(n2) {
    for (var e3 = 1; e3 < arguments.length; e3++) {
      var t3 = arguments[e3];
      for (var r3 in t3) ({}).hasOwnProperty.call(t3, r3) && (n2[r3] = t3[r3]);
    }
    return n2;
  }, _extends.apply(null, arguments);
}
var STYLE_INNER = {
  position: "relative",
  // Disabled for our use case: the wrapper elements around FileList already deal with overflow,
  // and this additional property would hide things that we want to show.
  //
  // overflow: 'hidden',
  width: "100%",
  minHeight: "100%"
};
var STYLE_CONTENT = {
  position: "absolute",
  top: 0,
  left: 0,
  // Because the `top` value gets set to some offset, this `height` being 100% would make the scrollbar
  // stretch far beyond the content. For our use case, the content div actually can get its height from
  // the elements inside it, so we don't need to specify a `height` property at all.
  //
  // height: '100%',
  width: "100%",
  overflow: "visible"
};
var VirtualList = class extends x {
  constructor(props) {
    super(props);
    this.handleScroll = () => {
      this.setState({
        offset: this.base.scrollTop
      });
    };
    this.handleResize = () => {
      this.resize();
    };
    this.focusElement = null;
    this.state = {
      offset: 0,
      height: 0
    };
  }
  componentDidMount() {
    this.resize();
    window.addEventListener("resize", this.handleResize);
  }
  // TODO: refactor to stable lifecycle method
  // eslint-disable-next-line
  componentWillUpdate() {
    if (this.base.contains(document.activeElement)) {
      this.focusElement = document.activeElement;
    }
  }
  componentDidUpdate() {
    if (this.focusElement && this.focusElement.parentNode && document.activeElement !== this.focusElement) {
      this.focusElement.focus();
    }
    this.focusElement = null;
    this.resize();
  }
  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }
  resize() {
    const {
      height
    } = this.state;
    if (height !== this.base.offsetHeight) {
      this.setState({
        height: this.base.offsetHeight
      });
    }
  }
  render(_ref) {
    let {
      data,
      rowHeight,
      renderRow,
      overscanCount = 10,
      ...props
    } = _ref;
    const {
      offset,
      height
    } = this.state;
    let start = Math.floor(offset / rowHeight);
    let visibleRowCount = Math.floor(height / rowHeight);
    if (overscanCount) {
      start = Math.max(0, start - start % overscanCount);
      visibleRowCount += overscanCount;
    }
    const end = start + visibleRowCount + 4;
    const selection = data.slice(start, end);
    const styleInner = {
      ...STYLE_INNER,
      height: data.length * rowHeight
    };
    const styleContent = {
      ...STYLE_CONTENT,
      top: start * rowHeight
    };
    return (
      // eslint-disable-next-line react/jsx-props-no-spreading
      _("div", _extends({
        onScroll: this.handleScroll
      }, props), _("div", {
        role: "presentation",
        style: styleInner
      }, _("div", {
        role: "presentation",
        style: styleContent
      }, selection.map(renderRow))))
    );
  }
};
var VirtualList_default = VirtualList;

// node_modules/@uppy/provider-views/lib/Item/index.js
var import_dist79 = __toESM(require_dist(), 1);
var import_dist80 = __toESM(require_dist2(), 1);
var import_dist81 = __toESM(require_dist3(), 1);
var import_classnames2 = __toESM(require_classnames(), 1);

// node_modules/@uppy/provider-views/lib/Item/components/GridItem.js
var import_dist73 = __toESM(require_dist(), 1);
var import_dist74 = __toESM(require_dist2(), 1);
var import_dist75 = __toESM(require_dist3(), 1);

// node_modules/@uppy/provider-views/lib/Item/components/ItemIcon.js
var import_dist70 = __toESM(require_dist(), 1);
var import_dist71 = __toESM(require_dist2(), 1);
var import_dist72 = __toESM(require_dist3(), 1);
function FileIcon() {
  return _("svg", {
    "aria-hidden": "true",
    focusable: "false",
    className: "uppy-c-icon",
    width: 11,
    height: 14.5,
    viewBox: "0 0 44 58"
  }, _("path", {
    d: "M27.437.517a1 1 0 0 0-.094.03H4.25C2.037.548.217 2.368.217 4.58v48.405c0 2.212 1.82 4.03 4.03 4.03H39.03c2.21 0 4.03-1.818 4.03-4.03V15.61a1 1 0 0 0-.03-.28 1 1 0 0 0 0-.093 1 1 0 0 0-.03-.032 1 1 0 0 0 0-.03 1 1 0 0 0-.032-.063 1 1 0 0 0-.03-.063 1 1 0 0 0-.032 0 1 1 0 0 0-.03-.063 1 1 0 0 0-.032-.03 1 1 0 0 0-.03-.063 1 1 0 0 0-.063-.062l-14.593-14a1 1 0 0 0-.062-.062A1 1 0 0 0 28 .708a1 1 0 0 0-.374-.157 1 1 0 0 0-.156 0 1 1 0 0 0-.03-.03l-.003-.003zM4.25 2.547h22.218v9.97c0 2.21 1.82 4.03 4.03 4.03h10.564v36.438a2.02 2.02 0 0 1-2.032 2.032H4.25c-1.13 0-2.032-.9-2.032-2.032V4.58c0-1.13.902-2.032 2.03-2.032zm24.218 1.345l10.375 9.937.75.718H30.5c-1.13 0-2.032-.9-2.032-2.03V3.89z"
  }));
}
function FolderIcon() {
  return _("svg", {
    "aria-hidden": "true",
    focusable: "false",
    className: "uppy-c-icon",
    style: {
      minWidth: 16,
      marginRight: 3
    },
    viewBox: "0 0 276.157 276.157"
  }, _("path", {
    d: "M273.08 101.378c-3.3-4.65-8.86-7.32-15.254-7.32h-24.34V67.59c0-10.2-8.3-18.5-18.5-18.5h-85.322c-3.63 0-9.295-2.875-11.436-5.805l-6.386-8.735c-4.982-6.814-15.104-11.954-23.546-11.954H58.73c-9.292 0-18.638 6.608-21.737 15.372l-2.033 5.752c-.958 2.71-4.72 5.37-7.596 5.37H18.5C8.3 49.09 0 57.39 0 67.59v167.07c0 .886.16 1.73.443 2.52.152 3.306 1.18 6.424 3.053 9.064 3.3 4.652 8.86 7.32 15.255 7.32h188.487c11.395 0 23.27-8.425 27.035-19.18l40.677-116.188c2.11-6.035 1.43-12.164-1.87-16.816zM18.5 64.088h8.864c9.295 0 18.64-6.607 21.738-15.37l2.032-5.75c.96-2.712 4.722-5.373 7.597-5.373h29.565c3.63 0 9.295 2.876 11.437 5.806l6.386 8.735c4.982 6.815 15.104 11.954 23.546 11.954h85.322c1.898 0 3.5 1.602 3.5 3.5v26.47H69.34c-11.395 0-23.27 8.423-27.035 19.178L15 191.23V67.59c0-1.898 1.603-3.5 3.5-3.5zm242.29 49.15l-40.676 116.188c-1.674 4.78-7.812 9.135-12.877 9.135H18.75c-1.447 0-2.576-.372-3.02-.997-.442-.625-.422-1.814.057-3.18l40.677-116.19c1.674-4.78 7.812-9.134 12.877-9.134h188.487c1.448 0 2.577.372 3.02.997.443.625.423 1.814-.056 3.18z"
  }));
}
function VideoIcon() {
  return _("svg", {
    "aria-hidden": "true",
    focusable: "false",
    style: {
      width: 16,
      marginRight: 4
    },
    viewBox: "0 0 58 58"
  }, _("path", {
    d: "M36.537 28.156l-11-7a1.005 1.005 0 0 0-1.02-.033C24.2 21.3 24 21.635 24 22v14a1 1 0 0 0 1.537.844l11-7a1.002 1.002 0 0 0 0-1.688zM26 34.18V23.82L34.137 29 26 34.18z"
  }), _("path", {
    d: "M57 6H1a1 1 0 0 0-1 1v44a1 1 0 0 0 1 1h56a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1zM10 28H2v-9h8v9zm-8 2h8v9H2v-9zm10 10V8h34v42H12V40zm44-12h-8v-9h8v9zm-8 2h8v9h-8v-9zm8-22v9h-8V8h8zM2 8h8v9H2V8zm0 42v-9h8v9H2zm54 0h-8v-9h8v9z"
  }));
}
function ItemIcon(_ref) {
  let {
    itemIconString,
    alt = void 0
  } = _ref;
  if (itemIconString === null) return null;
  switch (itemIconString) {
    case "file":
      return _(FileIcon, null);
    case "folder":
      return _(FolderIcon, null);
    case "video":
      return _(VideoIcon, null);
    default: {
      return _("img", {
        src: itemIconString,
        alt,
        referrerPolicy: "no-referrer",
        loading: "lazy",
        width: 16,
        height: 16
      });
    }
  }
}

// node_modules/@uppy/provider-views/lib/Item/components/GridItem.js
function GridItem(_ref) {
  var _file$data$name, _file$data$name2;
  let {
    file,
    toggleCheckbox,
    className,
    isDisabled,
    restrictionError,
    showTitles,
    children = null,
    i18n
  } = _ref;
  return _("li", {
    className,
    title: isDisabled && restrictionError ? restrictionError : void 0
  }, _("input", {
    type: "checkbox",
    className: "uppy-u-reset uppy-ProviderBrowserItem-checkbox uppy-ProviderBrowserItem-checkbox--grid",
    onChange: toggleCheckbox,
    name: "listitem",
    id: file.id,
    checked: file.status === "checked",
    disabled: isDisabled,
    "data-uppy-super-focusable": true
  }), _("label", {
    htmlFor: file.id,
    "aria-label": (_file$data$name = file.data.name) != null ? _file$data$name : i18n("unnamed"),
    className: "uppy-u-reset uppy-ProviderBrowserItem-inner"
  }, _(ItemIcon, {
    itemIconString: file.data.thumbnail || file.data.icon
  }), showTitles && ((_file$data$name2 = file.data.name) != null ? _file$data$name2 : i18n("unnamed")), children));
}
var GridItem_default = GridItem;

// node_modules/@uppy/provider-views/lib/Item/components/ListItem.js
var import_dist76 = __toESM(require_dist(), 1);
var import_dist77 = __toESM(require_dist2(), 1);
var import_dist78 = __toESM(require_dist3(), 1);
function ListItem(_ref) {
  var _file$data$name, _file$data$name2, _file$data$name3;
  let {
    file,
    openFolder,
    className,
    isDisabled,
    restrictionError,
    toggleCheckbox,
    showTitles,
    i18n
  } = _ref;
  return _("li", {
    className,
    title: file.status !== "checked" && restrictionError ? restrictionError : void 0
  }, _("input", {
    type: "checkbox",
    className: "uppy-u-reset uppy-ProviderBrowserItem-checkbox",
    onChange: toggleCheckbox,
    name: "listitem",
    id: file.id,
    checked: file.status === "checked",
    "aria-label": file.data.isFolder ? i18n("allFilesFromFolderNamed", {
      name: (_file$data$name = file.data.name) != null ? _file$data$name : i18n("unnamed")
    }) : null,
    disabled: isDisabled,
    "data-uppy-super-focusable": true
  }), file.data.isFolder ? (
    // button to open a folder
    _("button", {
      type: "button",
      className: "uppy-u-reset uppy-c-btn uppy-ProviderBrowserItem-inner",
      onClick: () => openFolder(file.id),
      "aria-label": i18n("openFolderNamed", {
        name: (_file$data$name2 = file.data.name) != null ? _file$data$name2 : i18n("unnamed")
      })
    }, _("div", {
      className: "uppy-ProviderBrowserItem-iconWrap"
    }, _(ItemIcon, {
      itemIconString: file.data.icon
    })), showTitles && file.data.name ? _("span", null, file.data.name) : i18n("unnamed"))
  ) : _("label", {
    htmlFor: file.id,
    className: "uppy-u-reset uppy-ProviderBrowserItem-inner"
  }, _("div", {
    className: "uppy-ProviderBrowserItem-iconWrap"
  }, _(ItemIcon, {
    itemIconString: file.data.icon
  })), showTitles && ((_file$data$name3 = file.data.name) != null ? _file$data$name3 : i18n("unnamed"))));
}

// node_modules/@uppy/provider-views/lib/Item/index.js
function Item(props) {
  const {
    viewType,
    toggleCheckbox,
    showTitles,
    i18n,
    openFolder,
    file,
    utmSource
  } = props;
  const restrictionError = file.type === "folder" ? null : file.restrictionError;
  const isDisabled = !!restrictionError && file.status !== "checked";
  const ourProps = {
    file,
    openFolder,
    toggleCheckbox,
    utmSource,
    i18n,
    viewType,
    showTitles,
    className: (0, import_classnames2.default)("uppy-ProviderBrowserItem", {
      "uppy-ProviderBrowserItem--disabled": isDisabled
    }, {
      "uppy-ProviderBrowserItem--noPreview": file.data.icon === "video"
    }, {
      "uppy-ProviderBrowserItem--is-checked": file.status === "checked"
    }, {
      "uppy-ProviderBrowserItem--is-partial": file.status === "partial"
    }),
    isDisabled,
    restrictionError
  };
  switch (viewType) {
    case "grid":
      return _(GridItem_default, ourProps);
    case "list":
      return _(ListItem, ourProps);
    case "unsplash":
      return _(GridItem_default, ourProps, _("a", {
        href: `${file.data.author.url}?utm_source=${utmSource}&utm_medium=referral`,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "uppy-ProviderBrowserItem-author",
        tabIndex: -1
      }, file.data.author.name));
    default:
      throw new Error(`There is no such type ${viewType}`);
  }
}

// node_modules/@uppy/provider-views/lib/Browser.js
function Browser(props) {
  const {
    displayedPartialTree,
    viewType,
    toggleCheckbox,
    handleScroll,
    showTitles,
    i18n,
    isLoading,
    openFolder,
    noResultsLabel,
    virtualList,
    utmSource
  } = props;
  const [isShiftKeyPressed, setIsShiftKeyPressed] = d2(false);
  y2(() => {
    const handleKeyUp = (e3) => {
      if (e3.key === "Shift") setIsShiftKeyPressed(false);
    };
    const handleKeyDown = (e3) => {
      if (e3.key === "Shift") setIsShiftKeyPressed(true);
    };
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  if (isLoading) {
    return _("div", {
      className: "uppy-Provider-loading"
    }, typeof isLoading === "string" ? isLoading : i18n("loading"));
  }
  if (displayedPartialTree.length === 0) {
    return _("div", {
      className: "uppy-Provider-empty"
    }, noResultsLabel);
  }
  const renderItem = (item) => _(Item, {
    viewType,
    toggleCheckbox: (event) => {
      var _document$getSelectio;
      event.stopPropagation();
      event.preventDefault();
      (_document$getSelectio = document.getSelection()) == null || _document$getSelectio.removeAllRanges();
      toggleCheckbox(item, isShiftKeyPressed);
    },
    showTitles,
    i18n,
    openFolder,
    file: item,
    utmSource
  });
  if (virtualList) {
    return _("div", {
      className: "uppy-ProviderBrowser-body"
    }, _("ul", {
      className: "uppy-ProviderBrowser-list"
    }, _(VirtualList_default, {
      data: displayedPartialTree,
      renderRow: renderItem,
      rowHeight: 31
    })));
  }
  return _("div", {
    className: "uppy-ProviderBrowser-body"
  }, _("ul", {
    className: "uppy-ProviderBrowser-list",
    onScroll: handleScroll,
    role: "listbox",
    tabIndex: -1
  }, displayedPartialTree.map(renderItem)));
}
var Browser_default = Browser;

// node_modules/@uppy/provider-views/lib/utils/PartialTreeUtils/index.js
var import_dist115 = __toESM(require_dist(), 1);
var import_dist116 = __toESM(require_dist2(), 1);
var import_dist117 = __toESM(require_dist3(), 1);

// node_modules/@uppy/provider-views/lib/utils/PartialTreeUtils/afterOpenFolder.js
var import_dist85 = __toESM(require_dist(), 1);
var import_dist86 = __toESM(require_dist2(), 1);
var import_dist87 = __toESM(require_dist3(), 1);
var afterOpenFolder = (oldPartialTree, discoveredItems, clickedFolder, currentPagePath, validateSingleFile) => {
  const discoveredFolders = discoveredItems.filter((i3) => i3.isFolder === true);
  const discoveredFiles = discoveredItems.filter((i3) => i3.isFolder === false);
  const isParentFolderChecked = clickedFolder.type === "folder" && clickedFolder.status === "checked";
  const folders = discoveredFolders.map((folder) => ({
    type: "folder",
    id: folder.requestPath,
    cached: false,
    nextPagePath: null,
    status: isParentFolderChecked ? "checked" : "unchecked",
    parentId: clickedFolder.id,
    data: folder
  }));
  const files = discoveredFiles.map((file) => {
    const restrictionError = validateSingleFile(file);
    return {
      type: "file",
      id: file.requestPath,
      restrictionError,
      status: isParentFolderChecked && !restrictionError ? "checked" : "unchecked",
      parentId: clickedFolder.id,
      data: file
    };
  });
  const updatedClickedFolder = {
    ...clickedFolder,
    cached: true,
    nextPagePath: currentPagePath
  };
  const partialTreeWithUpdatedClickedFolder = oldPartialTree.map((folder) => folder.id === updatedClickedFolder.id ? updatedClickedFolder : folder);
  const newPartialTree = [...partialTreeWithUpdatedClickedFolder, ...folders, ...files];
  return newPartialTree;
};
var afterOpenFolder_default = afterOpenFolder;

// node_modules/@uppy/provider-views/lib/utils/PartialTreeUtils/afterScrollFolder.js
var import_dist88 = __toESM(require_dist(), 1);
var import_dist89 = __toESM(require_dist2(), 1);
var import_dist90 = __toESM(require_dist3(), 1);
var afterScrollFolder = (oldPartialTree, currentFolderId, items, nextPagePath, validateSingleFile) => {
  const currentFolder = oldPartialTree.find((i3) => i3.id === currentFolderId);
  const newFolders = items.filter((i3) => i3.isFolder === true);
  const newFiles = items.filter((i3) => i3.isFolder === false);
  const scrolledFolder = {
    ...currentFolder,
    nextPagePath
  };
  const partialTreeWithUpdatedScrolledFolder = oldPartialTree.map((folder) => folder.id === scrolledFolder.id ? scrolledFolder : folder);
  const isParentFolderChecked = scrolledFolder.type === "folder" && scrolledFolder.status === "checked";
  const folders = newFolders.map((folder) => ({
    type: "folder",
    id: folder.requestPath,
    cached: false,
    nextPagePath: null,
    status: isParentFolderChecked ? "checked" : "unchecked",
    parentId: scrolledFolder.id,
    data: folder
  }));
  const files = newFiles.map((file) => {
    const restrictionError = validateSingleFile(file);
    return {
      type: "file",
      id: file.requestPath,
      restrictionError,
      status: isParentFolderChecked && !restrictionError ? "checked" : "unchecked",
      parentId: scrolledFolder.id,
      data: file
    };
  });
  const newPartialTree = [...partialTreeWithUpdatedScrolledFolder, ...folders, ...files];
  return newPartialTree;
};
var afterScrollFolder_default = afterScrollFolder;

// node_modules/@uppy/provider-views/lib/utils/PartialTreeUtils/afterToggleCheckbox.js
var import_dist94 = __toESM(require_dist(), 1);
var import_dist95 = __toESM(require_dist2(), 1);
var import_dist96 = __toESM(require_dist3(), 1);

// node_modules/@uppy/provider-views/lib/utils/PartialTreeUtils/shallowClone.js
var import_dist91 = __toESM(require_dist(), 1);
var import_dist92 = __toESM(require_dist2(), 1);
var import_dist93 = __toESM(require_dist3(), 1);
var shallowClone = (partialTree) => {
  return partialTree.map((item) => ({
    ...item
  }));
};
var shallowClone_default = shallowClone;

// node_modules/@uppy/provider-views/lib/utils/PartialTreeUtils/afterToggleCheckbox.js
var percolateDown = (tree, id3, shouldMarkAsChecked) => {
  const children = tree.filter((item) => item.type !== "root" && item.parentId === id3);
  children.forEach((item) => {
    item.status = shouldMarkAsChecked && !(item.type === "file" && item.restrictionError) ? "checked" : "unchecked";
    percolateDown(tree, item.id, shouldMarkAsChecked);
  });
};
var percolateUp = (tree, id3) => {
  const folder = tree.find((item) => item.id === id3);
  if (folder.type === "root") return;
  const validChildren = tree.filter((item) => (
    // is a child
    item.type !== "root" && item.parentId === folder.id && // does pass validations
    !(item.type === "file" && item.restrictionError)
  ));
  const areAllChildrenChecked = validChildren.every((item) => item.status === "checked");
  const areAllChildrenUnchecked = validChildren.every((item) => item.status === "unchecked");
  if (areAllChildrenChecked) {
    folder.status = "checked";
  } else if (areAllChildrenUnchecked) {
    folder.status = "unchecked";
  } else {
    folder.status = "partial";
  }
  percolateUp(tree, folder.parentId);
};
var afterToggleCheckbox = (oldTree, clickedRange) => {
  const tree = shallowClone_default(oldTree);
  if (clickedRange.length >= 2) {
    const newlyCheckedItems = tree.filter((item) => item.type !== "root" && clickedRange.includes(item.id));
    newlyCheckedItems.forEach((item) => {
      if (item.type === "file") {
        item.status = item.restrictionError ? "unchecked" : "checked";
      } else {
        item.status = "checked";
      }
    });
    newlyCheckedItems.forEach((item) => {
      percolateDown(tree, item.id, true);
    });
    percolateUp(tree, newlyCheckedItems[0].parentId);
  } else {
    const clickedItem = tree.find((item) => item.id === clickedRange[0]);
    clickedItem.status = clickedItem.status === "checked" ? "unchecked" : "checked";
    percolateDown(tree, clickedItem.id, clickedItem.status === "checked");
    percolateUp(tree, clickedItem.parentId);
  }
  return tree;
};
var afterToggleCheckbox_default = afterToggleCheckbox;

// node_modules/@uppy/provider-views/lib/utils/PartialTreeUtils/afterFill.js
var import_dist112 = __toESM(require_dist(), 1);
var import_dist113 = __toESM(require_dist2(), 1);
var import_dist114 = __toESM(require_dist3(), 1);

// node_modules/p-queue/dist/index.js
var import_dist109 = __toESM(require_dist());
var import_dist110 = __toESM(require_dist2());
var import_dist111 = __toESM(require_dist3());

// node_modules/eventemitter3/index.mjs
var import_dist97 = __toESM(require_dist(), 1);
var import_dist98 = __toESM(require_dist2(), 1);
var import_dist99 = __toESM(require_dist3(), 1);
var import_index = __toESM(require_eventemitter3(), 1);

// node_modules/p-timeout/index.js
var import_dist100 = __toESM(require_dist());
var import_dist101 = __toESM(require_dist2());
var import_dist102 = __toESM(require_dist3());
var TimeoutError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "TimeoutError";
  }
};
var AbortError = class extends Error {
  constructor(message) {
    super();
    this.name = "AbortError";
    this.message = message;
  }
};
var getDOMException = (errorMessage) => globalThis.DOMException === void 0 ? new AbortError(errorMessage) : new DOMException(errorMessage);
var getAbortedReason = (signal) => {
  const reason = signal.reason === void 0 ? getDOMException("This operation was aborted.") : signal.reason;
  return reason instanceof Error ? reason : getDOMException(reason);
};
function pTimeout(promise, options) {
  const {
    milliseconds,
    fallback,
    message,
    customTimers = { setTimeout, clearTimeout }
  } = options;
  let timer;
  let abortHandler;
  const wrappedPromise = new Promise((resolve, reject) => {
    if (typeof milliseconds !== "number" || Math.sign(milliseconds) !== 1) {
      throw new TypeError(`Expected \`milliseconds\` to be a positive number, got \`${milliseconds}\``);
    }
    if (options.signal) {
      const { signal } = options;
      if (signal.aborted) {
        reject(getAbortedReason(signal));
      }
      abortHandler = () => {
        reject(getAbortedReason(signal));
      };
      signal.addEventListener("abort", abortHandler, { once: true });
    }
    if (milliseconds === Number.POSITIVE_INFINITY) {
      promise.then(resolve, reject);
      return;
    }
    const timeoutError = new TimeoutError();
    timer = customTimers.setTimeout.call(void 0, () => {
      if (fallback) {
        try {
          resolve(fallback());
        } catch (error) {
          reject(error);
        }
        return;
      }
      if (typeof promise.cancel === "function") {
        promise.cancel();
      }
      if (message === false) {
        resolve();
      } else if (message instanceof Error) {
        reject(message);
      } else {
        timeoutError.message = message ?? `Promise timed out after ${milliseconds} milliseconds`;
        reject(timeoutError);
      }
    }, milliseconds);
    (async () => {
      try {
        resolve(await promise);
      } catch (error) {
        reject(error);
      }
    })();
  });
  const cancelablePromise = wrappedPromise.finally(() => {
    cancelablePromise.clear();
    if (abortHandler && options.signal) {
      options.signal.removeEventListener("abort", abortHandler);
    }
  });
  cancelablePromise.clear = () => {
    customTimers.clearTimeout.call(void 0, timer);
    timer = void 0;
  };
  return cancelablePromise;
}

// node_modules/p-queue/dist/priority-queue.js
var import_dist106 = __toESM(require_dist(), 1);
var import_dist107 = __toESM(require_dist2(), 1);
var import_dist108 = __toESM(require_dist3(), 1);

// node_modules/p-queue/dist/lower-bound.js
var import_dist103 = __toESM(require_dist(), 1);
var import_dist104 = __toESM(require_dist2(), 1);
var import_dist105 = __toESM(require_dist3(), 1);
function lowerBound(array, value, comparator) {
  let first = 0;
  let count = array.length;
  while (count > 0) {
    const step = Math.trunc(count / 2);
    let it = first + step;
    if (comparator(array[it], value) <= 0) {
      first = ++it;
      count -= step + 1;
    } else {
      count = step;
    }
  }
  return first;
}

// node_modules/p-queue/dist/priority-queue.js
var _queue;
var PriorityQueue = class {
  constructor() {
    __privateAdd(this, _queue, []);
  }
  enqueue(run, options) {
    options = {
      priority: 0,
      ...options
    };
    const element = {
      priority: options.priority,
      id: options.id,
      run
    };
    if (this.size === 0 || __privateGet(this, _queue)[this.size - 1].priority >= options.priority) {
      __privateGet(this, _queue).push(element);
      return;
    }
    const index = lowerBound(__privateGet(this, _queue), element, (a3, b3) => b3.priority - a3.priority);
    __privateGet(this, _queue).splice(index, 0, element);
  }
  setPriority(id3, priority) {
    const index = __privateGet(this, _queue).findIndex((element) => element.id === id3);
    if (index === -1) {
      throw new ReferenceError(`No promise function with the id "${id3}" exists in the queue.`);
    }
    const [item] = __privateGet(this, _queue).splice(index, 1);
    this.enqueue(item.run, { priority, id: id3 });
  }
  dequeue() {
    const item = __privateGet(this, _queue).shift();
    return item == null ? void 0 : item.run;
  }
  filter(options) {
    return __privateGet(this, _queue).filter((element) => element.priority === options.priority).map((element) => element.run);
  }
  get size() {
    return __privateGet(this, _queue).length;
  }
};
_queue = new WeakMap();

// node_modules/p-queue/dist/index.js
var _carryoverConcurrencyCount, _isIntervalIgnored, _intervalCount, _intervalCap, _interval, _intervalEnd, _intervalId, _timeoutId, _queue2, _queueClass, _pending, _concurrency, _isPaused, _throwOnTimeout, _idAssigner, _PQueue_instances, doesIntervalAllowAnother_get, doesConcurrentAllowAnother_get, next_fn, onResumeInterval_fn, isIntervalPaused_get, tryToStartAnother_fn, initializeIntervalIfNeeded_fn, onInterval_fn, processQueue_fn, throwOnAbort_fn, onEvent_fn;
var PQueue = class extends import_index.default {
  // TODO: The `throwOnTimeout` option should affect the return types of `add()` and `addAll()`
  constructor(options) {
    var _a, _b;
    super();
    __privateAdd(this, _PQueue_instances);
    __privateAdd(this, _carryoverConcurrencyCount);
    __privateAdd(this, _isIntervalIgnored);
    __privateAdd(this, _intervalCount, 0);
    __privateAdd(this, _intervalCap);
    __privateAdd(this, _interval);
    __privateAdd(this, _intervalEnd, 0);
    __privateAdd(this, _intervalId);
    __privateAdd(this, _timeoutId);
    __privateAdd(this, _queue2);
    __privateAdd(this, _queueClass);
    __privateAdd(this, _pending, 0);
    // The `!` is needed because of https://github.com/microsoft/TypeScript/issues/32194
    __privateAdd(this, _concurrency);
    __privateAdd(this, _isPaused);
    __privateAdd(this, _throwOnTimeout);
    // Use to assign a unique identifier to a promise function, if not explicitly specified
    __privateAdd(this, _idAssigner, 1n);
    /**
        Per-operation timeout in milliseconds. Operations fulfill once `timeout` elapses if they haven't already.
    
        Applies to each future operation.
        */
    __publicField(this, "timeout");
    options = {
      carryoverConcurrencyCount: false,
      intervalCap: Number.POSITIVE_INFINITY,
      interval: 0,
      concurrency: Number.POSITIVE_INFINITY,
      autoStart: true,
      queueClass: PriorityQueue,
      ...options
    };
    if (!(typeof options.intervalCap === "number" && options.intervalCap >= 1)) {
      throw new TypeError(`Expected \`intervalCap\` to be a number from 1 and up, got \`${((_a = options.intervalCap) == null ? void 0 : _a.toString()) ?? ""}\` (${typeof options.intervalCap})`);
    }
    if (options.interval === void 0 || !(Number.isFinite(options.interval) && options.interval >= 0)) {
      throw new TypeError(`Expected \`interval\` to be a finite number >= 0, got \`${((_b = options.interval) == null ? void 0 : _b.toString()) ?? ""}\` (${typeof options.interval})`);
    }
    __privateSet(this, _carryoverConcurrencyCount, options.carryoverConcurrencyCount);
    __privateSet(this, _isIntervalIgnored, options.intervalCap === Number.POSITIVE_INFINITY || options.interval === 0);
    __privateSet(this, _intervalCap, options.intervalCap);
    __privateSet(this, _interval, options.interval);
    __privateSet(this, _queue2, new options.queueClass());
    __privateSet(this, _queueClass, options.queueClass);
    this.concurrency = options.concurrency;
    this.timeout = options.timeout;
    __privateSet(this, _throwOnTimeout, options.throwOnTimeout === true);
    __privateSet(this, _isPaused, options.autoStart === false);
  }
  get concurrency() {
    return __privateGet(this, _concurrency);
  }
  set concurrency(newConcurrency) {
    if (!(typeof newConcurrency === "number" && newConcurrency >= 1)) {
      throw new TypeError(`Expected \`concurrency\` to be a number from 1 and up, got \`${newConcurrency}\` (${typeof newConcurrency})`);
    }
    __privateSet(this, _concurrency, newConcurrency);
    __privateMethod(this, _PQueue_instances, processQueue_fn).call(this);
  }
  /**
      Updates the priority of a promise function by its id, affecting its execution order. Requires a defined concurrency limit to take effect.
  
      For example, this can be used to prioritize a promise function to run earlier.
  
      ```js
      import PQueue from 'p-queue';
  
      const queue = new PQueue({concurrency: 1});
  
      queue.add(async () => '🦄', {priority: 1});
      queue.add(async () => '🦀', {priority: 0, id: '🦀'});
      queue.add(async () => '🦄', {priority: 1});
      queue.add(async () => '🦄', {priority: 1});
  
      queue.setPriority('🦀', 2);
      ```
  
      In this case, the promise function with `id: '🦀'` runs second.
  
      You can also deprioritize a promise function to delay its execution:
  
      ```js
      import PQueue from 'p-queue';
  
      const queue = new PQueue({concurrency: 1});
  
      queue.add(async () => '🦄', {priority: 1});
      queue.add(async () => '🦀', {priority: 1, id: '🦀'});
      queue.add(async () => '🦄');
      queue.add(async () => '🦄', {priority: 0});
  
      queue.setPriority('🦀', -1);
      ```
      Here, the promise function with `id: '🦀'` executes last.
      */
  setPriority(id3, priority) {
    __privateGet(this, _queue2).setPriority(id3, priority);
  }
  async add(function_, options = {}) {
    options.id ?? (options.id = (__privateWrapper(this, _idAssigner)._++).toString());
    options = {
      timeout: this.timeout,
      throwOnTimeout: __privateGet(this, _throwOnTimeout),
      ...options
    };
    return new Promise((resolve, reject) => {
      __privateGet(this, _queue2).enqueue(async () => {
        var _a;
        __privateWrapper(this, _pending)._++;
        __privateWrapper(this, _intervalCount)._++;
        try {
          (_a = options.signal) == null ? void 0 : _a.throwIfAborted();
          let operation = function_({ signal: options.signal });
          if (options.timeout) {
            operation = pTimeout(Promise.resolve(operation), { milliseconds: options.timeout });
          }
          if (options.signal) {
            operation = Promise.race([operation, __privateMethod(this, _PQueue_instances, throwOnAbort_fn).call(this, options.signal)]);
          }
          const result = await operation;
          resolve(result);
          this.emit("completed", result);
        } catch (error) {
          if (error instanceof TimeoutError && !options.throwOnTimeout) {
            resolve();
            return;
          }
          reject(error);
          this.emit("error", error);
        } finally {
          __privateMethod(this, _PQueue_instances, next_fn).call(this);
        }
      }, options);
      this.emit("add");
      __privateMethod(this, _PQueue_instances, tryToStartAnother_fn).call(this);
    });
  }
  async addAll(functions, options) {
    return Promise.all(functions.map(async (function_) => this.add(function_, options)));
  }
  /**
  Start (or resume) executing enqueued tasks within concurrency limit. No need to call this if queue is not paused (via `options.autoStart = false` or by `.pause()` method.)
  */
  start() {
    if (!__privateGet(this, _isPaused)) {
      return this;
    }
    __privateSet(this, _isPaused, false);
    __privateMethod(this, _PQueue_instances, processQueue_fn).call(this);
    return this;
  }
  /**
  Put queue execution on hold.
  */
  pause() {
    __privateSet(this, _isPaused, true);
  }
  /**
  Clear the queue.
  */
  clear() {
    __privateSet(this, _queue2, new (__privateGet(this, _queueClass))());
  }
  /**
      Can be called multiple times. Useful if you for example add additional items at a later time.
  
      @returns A promise that settles when the queue becomes empty.
      */
  async onEmpty() {
    if (__privateGet(this, _queue2).size === 0) {
      return;
    }
    await __privateMethod(this, _PQueue_instances, onEvent_fn).call(this, "empty");
  }
  /**
      @returns A promise that settles when the queue size is less than the given limit: `queue.size < limit`.
  
      If you want to avoid having the queue grow beyond a certain size you can `await queue.onSizeLessThan()` before adding a new item.
  
      Note that this only limits the number of items waiting to start. There could still be up to `concurrency` jobs already running that this call does not include in its calculation.
      */
  async onSizeLessThan(limit) {
    if (__privateGet(this, _queue2).size < limit) {
      return;
    }
    await __privateMethod(this, _PQueue_instances, onEvent_fn).call(this, "next", () => __privateGet(this, _queue2).size < limit);
  }
  /**
      The difference with `.onEmpty` is that `.onIdle` guarantees that all work from the queue has finished. `.onEmpty` merely signals that the queue is empty, but it could mean that some promises haven't completed yet.
  
      @returns A promise that settles when the queue becomes empty, and all promises have completed; `queue.size === 0 && queue.pending === 0`.
      */
  async onIdle() {
    if (__privateGet(this, _pending) === 0 && __privateGet(this, _queue2).size === 0) {
      return;
    }
    await __privateMethod(this, _PQueue_instances, onEvent_fn).call(this, "idle");
  }
  /**
  Size of the queue, the number of queued items waiting to run.
  */
  get size() {
    return __privateGet(this, _queue2).size;
  }
  /**
      Size of the queue, filtered by the given options.
  
      For example, this can be used to find the number of items remaining in the queue with a specific priority level.
      */
  sizeBy(options) {
    return __privateGet(this, _queue2).filter(options).length;
  }
  /**
  Number of running items (no longer in the queue).
  */
  get pending() {
    return __privateGet(this, _pending);
  }
  /**
  Whether the queue is currently paused.
  */
  get isPaused() {
    return __privateGet(this, _isPaused);
  }
};
_carryoverConcurrencyCount = new WeakMap();
_isIntervalIgnored = new WeakMap();
_intervalCount = new WeakMap();
_intervalCap = new WeakMap();
_interval = new WeakMap();
_intervalEnd = new WeakMap();
_intervalId = new WeakMap();
_timeoutId = new WeakMap();
_queue2 = new WeakMap();
_queueClass = new WeakMap();
_pending = new WeakMap();
_concurrency = new WeakMap();
_isPaused = new WeakMap();
_throwOnTimeout = new WeakMap();
_idAssigner = new WeakMap();
_PQueue_instances = new WeakSet();
doesIntervalAllowAnother_get = function() {
  return __privateGet(this, _isIntervalIgnored) || __privateGet(this, _intervalCount) < __privateGet(this, _intervalCap);
};
doesConcurrentAllowAnother_get = function() {
  return __privateGet(this, _pending) < __privateGet(this, _concurrency);
};
next_fn = function() {
  __privateWrapper(this, _pending)._--;
  __privateMethod(this, _PQueue_instances, tryToStartAnother_fn).call(this);
  this.emit("next");
};
onResumeInterval_fn = function() {
  __privateMethod(this, _PQueue_instances, onInterval_fn).call(this);
  __privateMethod(this, _PQueue_instances, initializeIntervalIfNeeded_fn).call(this);
  __privateSet(this, _timeoutId, void 0);
};
isIntervalPaused_get = function() {
  const now = Date.now();
  if (__privateGet(this, _intervalId) === void 0) {
    const delay = __privateGet(this, _intervalEnd) - now;
    if (delay < 0) {
      __privateSet(this, _intervalCount, __privateGet(this, _carryoverConcurrencyCount) ? __privateGet(this, _pending) : 0);
    } else {
      if (__privateGet(this, _timeoutId) === void 0) {
        __privateSet(this, _timeoutId, setTimeout(() => {
          __privateMethod(this, _PQueue_instances, onResumeInterval_fn).call(this);
        }, delay));
      }
      return true;
    }
  }
  return false;
};
tryToStartAnother_fn = function() {
  if (__privateGet(this, _queue2).size === 0) {
    if (__privateGet(this, _intervalId)) {
      clearInterval(__privateGet(this, _intervalId));
    }
    __privateSet(this, _intervalId, void 0);
    this.emit("empty");
    if (__privateGet(this, _pending) === 0) {
      this.emit("idle");
    }
    return false;
  }
  if (!__privateGet(this, _isPaused)) {
    const canInitializeInterval = !__privateGet(this, _PQueue_instances, isIntervalPaused_get);
    if (__privateGet(this, _PQueue_instances, doesIntervalAllowAnother_get) && __privateGet(this, _PQueue_instances, doesConcurrentAllowAnother_get)) {
      const job = __privateGet(this, _queue2).dequeue();
      if (!job) {
        return false;
      }
      this.emit("active");
      job();
      if (canInitializeInterval) {
        __privateMethod(this, _PQueue_instances, initializeIntervalIfNeeded_fn).call(this);
      }
      return true;
    }
  }
  return false;
};
initializeIntervalIfNeeded_fn = function() {
  if (__privateGet(this, _isIntervalIgnored) || __privateGet(this, _intervalId) !== void 0) {
    return;
  }
  __privateSet(this, _intervalId, setInterval(() => {
    __privateMethod(this, _PQueue_instances, onInterval_fn).call(this);
  }, __privateGet(this, _interval)));
  __privateSet(this, _intervalEnd, Date.now() + __privateGet(this, _interval));
};
onInterval_fn = function() {
  if (__privateGet(this, _intervalCount) === 0 && __privateGet(this, _pending) === 0 && __privateGet(this, _intervalId)) {
    clearInterval(__privateGet(this, _intervalId));
    __privateSet(this, _intervalId, void 0);
  }
  __privateSet(this, _intervalCount, __privateGet(this, _carryoverConcurrencyCount) ? __privateGet(this, _pending) : 0);
  __privateMethod(this, _PQueue_instances, processQueue_fn).call(this);
};
/**
Executes all queued functions until it reaches the limit.
*/
processQueue_fn = function() {
  while (__privateMethod(this, _PQueue_instances, tryToStartAnother_fn).call(this)) {
  }
};
throwOnAbort_fn = async function(signal) {
  return new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => {
      reject(signal.reason);
    }, { once: true });
  });
};
onEvent_fn = async function(event, filter) {
  return new Promise((resolve) => {
    const listener = () => {
      if (filter && !filter()) {
        return;
      }
      this.off(event, listener);
      resolve();
    };
    this.on(event, listener);
  });
};

// node_modules/@uppy/provider-views/lib/utils/PartialTreeUtils/afterFill.js
var recursivelyFetch = async (queue, poorTree, poorFolder, apiList, validateSingleFile) => {
  let items = [];
  let currentPath = poorFolder.cached ? poorFolder.nextPagePath : poorFolder.id;
  while (currentPath) {
    const response = await apiList(currentPath);
    items = items.concat(response.items);
    currentPath = response.nextPagePath;
  }
  const newFolders = items.filter((i3) => i3.isFolder === true);
  const newFiles = items.filter((i3) => i3.isFolder === false);
  const folders = newFolders.map((folder) => ({
    type: "folder",
    id: folder.requestPath,
    cached: false,
    nextPagePath: null,
    status: "checked",
    parentId: poorFolder.id,
    data: folder
  }));
  const files = newFiles.map((file) => {
    const restrictionError = validateSingleFile(file);
    return {
      type: "file",
      id: file.requestPath,
      restrictionError,
      status: restrictionError ? "unchecked" : "checked",
      parentId: poorFolder.id,
      data: file
    };
  });
  poorFolder.cached = true;
  poorFolder.nextPagePath = null;
  poorTree.push(...files, ...folders);
  folders.forEach(async (folder) => {
    queue.add(() => recursivelyFetch(queue, poorTree, folder, apiList, validateSingleFile));
  });
};
var afterFill = async (partialTree, apiList, validateSingleFile, reportProgress) => {
  const queue = new PQueue({
    concurrency: 6
  });
  const poorTree = shallowClone_default(partialTree);
  const poorFolders = poorTree.filter((item) => item.type === "folder" && item.status === "checked" && // either "not yet cached at all" or "some pages are left to fetch"
  (item.cached === false || item.nextPagePath));
  poorFolders.forEach((poorFolder) => {
    queue.add(() => recursivelyFetch(queue, poorTree, poorFolder, apiList, validateSingleFile));
  });
  queue.on("completed", () => {
    const nOfFilesChecked = poorTree.filter((i3) => i3.type === "file" && i3.status === "checked").length;
    reportProgress(nOfFilesChecked);
  });
  await queue.onIdle();
  return poorTree;
};
var afterFill_default = afterFill;

// node_modules/@uppy/provider-views/lib/utils/PartialTreeUtils/index.js
var PartialTreeUtils_default = {
  afterOpenFolder: afterOpenFolder_default,
  afterScrollFolder: afterScrollFolder_default,
  afterToggleCheckbox: afterToggleCheckbox_default,
  afterFill: afterFill_default
};

// node_modules/@uppy/provider-views/lib/utils/shouldHandleScroll.js
var import_dist118 = __toESM(require_dist(), 1);
var import_dist119 = __toESM(require_dist2(), 1);
var import_dist120 = __toESM(require_dist3(), 1);
var shouldHandleScroll = (event) => {
  const {
    scrollHeight,
    scrollTop,
    offsetHeight
  } = event.target;
  const scrollPosition = scrollHeight - (scrollTop + offsetHeight);
  return scrollPosition < 50;
};
var shouldHandleScroll_default = shouldHandleScroll;

// node_modules/@uppy/provider-views/lib/utils/handleError.js
var import_dist121 = __toESM(require_dist(), 1);
var import_dist122 = __toESM(require_dist2(), 1);
var import_dist123 = __toESM(require_dist3(), 1);
var handleError = (uppy) => (error) => {
  if (error.isAuthError) {
    return;
  }
  if (error.name === "AbortError") {
    uppy.log("Aborting request", "warning");
    return;
  }
  uppy.log(error, "error");
  if (error.name === "UserFacingApiError") {
    uppy.info({
      message: uppy.i18n("companionError"),
      details: uppy.i18n(error.message)
    }, "warning", 5e3);
  }
};
var handleError_default = handleError;

// node_modules/@uppy/provider-views/lib/utils/getClickedRange.js
var import_dist124 = __toESM(require_dist(), 1);
var import_dist125 = __toESM(require_dist2(), 1);
var import_dist126 = __toESM(require_dist3(), 1);
var getClickedRange = (clickedId, displayedPartialTree, isShiftKeyPressed, lastCheckbox) => {
  const lastCheckboxIndex = displayedPartialTree.findIndex((item) => item.id === lastCheckbox);
  if (lastCheckboxIndex !== -1 && isShiftKeyPressed) {
    const newCheckboxIndex = displayedPartialTree.findIndex((item) => item.id === clickedId);
    const clickedRange = displayedPartialTree.slice(Math.min(lastCheckboxIndex, newCheckboxIndex), Math.max(lastCheckboxIndex, newCheckboxIndex) + 1);
    return clickedRange.map((item) => item.id);
  }
  return [clickedId];
};
var getClickedRange_default = getClickedRange;

// node_modules/@uppy/provider-views/lib/SearchInput.js
var import_dist130 = __toESM(require_dist(), 1);
var import_dist131 = __toESM(require_dist2(), 1);
var import_dist132 = __toESM(require_dist3(), 1);

// node_modules/@uppy/provider-views/node_modules/nanoid/non-secure/index.js
var import_dist127 = __toESM(require_dist());
var import_dist128 = __toESM(require_dist2());
var import_dist129 = __toESM(require_dist3());
var urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
var nanoid = (size = 21) => {
  let id3 = "";
  let i3 = size | 0;
  while (i3--) {
    id3 += urlAlphabet[Math.random() * 64 | 0];
  }
  return id3;
};

// node_modules/@uppy/provider-views/lib/SearchInput.js
function SearchInput(_ref) {
  let {
    searchString,
    setSearchString,
    submitSearchString,
    wrapperClassName,
    inputClassName,
    inputLabel,
    clearSearchLabel = "",
    showButton = false,
    buttonLabel = "",
    buttonCSSClassName = ""
  } = _ref;
  const onInput = (e3) => {
    setSearchString(e3.target.value);
  };
  const submit = q2((ev) => {
    ev.preventDefault();
    submitSearchString();
  }, [submitSearchString]);
  const [form] = d2(() => {
    const formEl = document.createElement("form");
    formEl.setAttribute("tabindex", "-1");
    formEl.id = nanoid();
    return formEl;
  });
  y2(() => {
    document.body.appendChild(form);
    form.addEventListener("submit", submit);
    return () => {
      form.removeEventListener("submit", submit);
      document.body.removeChild(form);
    };
  }, [form, submit]);
  return _("section", {
    className: wrapperClassName
  }, _("input", {
    className: `uppy-u-reset ${inputClassName}`,
    type: "search",
    "aria-label": inputLabel,
    placeholder: inputLabel,
    value: searchString,
    onInput,
    form: form.id,
    "data-uppy-super-focusable": true
  }), !showButton && // 🔍
  _("svg", {
    "aria-hidden": "true",
    focusable: "false",
    className: "uppy-c-icon uppy-ProviderBrowser-searchFilterIcon",
    width: "12",
    height: "12",
    viewBox: "0 0 12 12"
  }, _("path", {
    d: "M8.638 7.99l3.172 3.172a.492.492 0 1 1-.697.697L7.91 8.656a4.977 4.977 0 0 1-2.983.983C2.206 9.639 0 7.481 0 4.819 0 2.158 2.206 0 4.927 0c2.721 0 4.927 2.158 4.927 4.82a4.74 4.74 0 0 1-1.216 3.17zm-3.71.685c2.176 0 3.94-1.726 3.94-3.856 0-2.129-1.764-3.855-3.94-3.855C2.75.964.984 2.69.984 4.819c0 2.13 1.765 3.856 3.942 3.856z"
  })), !showButton && searchString && // ❌
  _("button", {
    className: "uppy-u-reset uppy-ProviderBrowser-searchFilterReset",
    type: "button",
    "aria-label": clearSearchLabel,
    title: clearSearchLabel,
    onClick: () => setSearchString("")
  }, _("svg", {
    "aria-hidden": "true",
    focusable: "false",
    className: "uppy-c-icon",
    viewBox: "0 0 19 19"
  }, _("path", {
    d: "M17.318 17.232L9.94 9.854 9.586 9.5l-.354.354-7.378 7.378h.707l-.62-.62v.706L9.318 9.94l.354-.354-.354-.354L1.94 1.854v.707l.62-.62h-.706l7.378 7.378.354.354.354-.354 7.378-7.378h-.707l.622.62v-.706L9.854 9.232l-.354.354.354.354 7.378 7.378.708-.707-7.38-7.378v.708l7.38-7.38.353-.353-.353-.353-.622-.622-.353-.353-.354.352-7.378 7.38h.708L2.56 1.23 2.208.88l-.353.353-.622.62-.353.355.352.353 7.38 7.38v-.708l-7.38 7.38-.353.353.352.353.622.622.353.353.354-.353 7.38-7.38h-.708l7.38 7.38z"
  }))), showButton && _("button", {
    className: `uppy-u-reset uppy-c-btn uppy-c-btn-primary ${buttonCSSClassName}`,
    type: "submit",
    form: form.id
  }, buttonLabel));
}
var SearchInput_default = SearchInput;

// node_modules/@uppy/provider-views/lib/FooterActions.js
var import_dist136 = __toESM(require_dist(), 1);
var import_dist137 = __toESM(require_dist2(), 1);
var import_dist138 = __toESM(require_dist3(), 1);
var import_classnames3 = __toESM(require_classnames(), 1);

// node_modules/@uppy/provider-views/lib/utils/PartialTreeUtils/getNumberOfSelectedFiles.js
var import_dist133 = __toESM(require_dist(), 1);
var import_dist134 = __toESM(require_dist2(), 1);
var import_dist135 = __toESM(require_dist3(), 1);
var getNumberOfSelectedFiles = (partialTree) => {
  const checkedLeaves = partialTree.filter((item) => {
    if (item.type === "file" && item.status === "checked") {
      return true;
    }
    if (item.type === "folder" && item.status === "checked") {
      const doesItHaveChildren = partialTree.some((i3) => i3.type !== "root" && i3.parentId === item.id);
      return !doesItHaveChildren;
    }
    return false;
  });
  return checkedLeaves.length;
};
var getNumberOfSelectedFiles_default = getNumberOfSelectedFiles;

// node_modules/@uppy/provider-views/lib/FooterActions.js
function FooterActions(_ref) {
  let {
    cancelSelection,
    donePicking,
    i18n,
    partialTree,
    validateAggregateRestrictions
  } = _ref;
  const aggregateRestrictionError = T2(() => {
    return validateAggregateRestrictions(partialTree);
  }, [partialTree, validateAggregateRestrictions]);
  const nOfSelectedFiles = T2(() => {
    return getNumberOfSelectedFiles_default(partialTree);
  }, [partialTree]);
  if (nOfSelectedFiles === 0) {
    return null;
  }
  return _("div", {
    className: "uppy-ProviderBrowser-footer"
  }, _("div", {
    className: "uppy-ProviderBrowser-footer-buttons"
  }, _("button", {
    className: (0, import_classnames3.default)("uppy-u-reset uppy-c-btn uppy-c-btn-primary", {
      "uppy-c-btn--disabled": aggregateRestrictionError
    }),
    disabled: !!aggregateRestrictionError,
    onClick: donePicking,
    type: "button"
  }, i18n("selectX", {
    smart_count: nOfSelectedFiles
  })), _("button", {
    className: "uppy-u-reset uppy-c-btn uppy-c-btn-link",
    onClick: cancelSelection,
    type: "button"
  }, i18n("cancel"))), aggregateRestrictionError && _("div", {
    className: "uppy-ProviderBrowser-footer-error"
  }, aggregateRestrictionError));
}

// node_modules/@uppy/provider-views/lib/utils/addFiles.js
var import_dist142 = __toESM(require_dist(), 1);
var import_dist143 = __toESM(require_dist2(), 1);
var import_dist144 = __toESM(require_dist3(), 1);

// node_modules/@uppy/provider-views/lib/utils/getTagFile.js
var import_dist139 = __toESM(require_dist(), 1);
var import_dist140 = __toESM(require_dist2(), 1);
var import_dist141 = __toESM(require_dist3(), 1);
var getTagFile = (file, plugin, provider) => {
  var _file$author, _file$author2;
  const tagFile = {
    id: file.id,
    source: plugin.id,
    name: file.name || file.id,
    type: file.mimeType,
    isRemote: true,
    data: file,
    preview: file.thumbnail || void 0,
    meta: {
      authorName: (_file$author = file.author) == null ? void 0 : _file$author.name,
      authorUrl: (_file$author2 = file.author) == null ? void 0 : _file$author2.url,
      // We need to do this `|| null` check, because null value
      // for .relDirPath is `undefined` and for .relativePath is `null`.
      // I do think we should just use `null` everywhere.
      relativePath: file.relDirPath || null,
      absolutePath: file.absDirPath
    },
    body: {
      fileId: file.id
    },
    remote: {
      companionUrl: plugin.opts.companionUrl,
      url: `${provider.fileUrl(file.requestPath)}`,
      body: {
        fileId: file.id
      },
      providerName: provider.name,
      provider: provider.provider,
      requestClientId: provider.provider
    }
  };
  return tagFile;
};
var getTagFile_default = getTagFile;

// node_modules/@uppy/provider-views/lib/utils/addFiles.js
var addFiles = (companionFiles, plugin, provider) => {
  const tagFiles = companionFiles.map((f3) => getTagFile_default(f3, plugin, provider));
  const filesToAdd = [];
  const filesAlreadyAdded = [];
  tagFiles.forEach((tagFile) => {
    if (plugin.uppy.checkIfFileAlreadyExists(getSafeFileId(tagFile, plugin.uppy.getID()))) {
      filesAlreadyAdded.push(tagFile);
    } else {
      filesToAdd.push(tagFile);
    }
  });
  if (filesToAdd.length > 0) {
    plugin.uppy.info(plugin.uppy.i18n("addedNumFiles", {
      numFiles: filesToAdd.length
    }));
  }
  if (filesAlreadyAdded.length > 0) {
    plugin.uppy.info(`Not adding ${filesAlreadyAdded.length} files because they already exist`);
  }
  plugin.uppy.addFiles(filesToAdd);
};
var addFiles_default = addFiles;

// node_modules/@uppy/provider-views/lib/utils/PartialTreeUtils/getCheckedFilesWithPaths.js
var import_dist145 = __toESM(require_dist(), 1);
var import_dist146 = __toESM(require_dist2(), 1);
var import_dist147 = __toESM(require_dist3(), 1);
var getPath = (partialTree, id3, cache) => {
  const sId = id3 === null ? "null" : id3;
  if (cache[sId]) return cache[sId];
  const file = partialTree.find((f3) => f3.id === id3);
  if (file.type === "root") return [];
  const meAndParentPath = [...getPath(partialTree, file.parentId, cache), file];
  cache[sId] = meAndParentPath;
  return meAndParentPath;
};
var getCheckedFilesWithPaths = (partialTree) => {
  const cache = /* @__PURE__ */ Object.create(null);
  const checkedFiles = partialTree.filter((item) => item.type === "file" && item.status === "checked");
  const companionFilesWithInjectedPaths = checkedFiles.map((file) => {
    const absFolders = getPath(partialTree, file.id, cache);
    const firstCheckedFolderIndex = absFolders.findIndex((i3) => i3.type === "folder" && i3.status === "checked");
    const relFolders = absFolders.slice(firstCheckedFolderIndex);
    const absDirPath = `/${absFolders.map((i3) => i3.data.name).join("/")}`;
    const relDirPath = relFolders.length === 1 ? (
      // Must return `undefined` (which later turns into `null` in `.getTagFile()`)
      // (https://github.com/transloadit/uppy/pull/4537#issuecomment-1629136652)
      void 0
    ) : relFolders.map((i3) => i3.data.name).join("/");
    return {
      ...file.data,
      absDirPath,
      relDirPath
    };
  });
  return companionFilesWithInjectedPaths;
};
var getCheckedFilesWithPaths_default = getCheckedFilesWithPaths;

// node_modules/@uppy/provider-views/lib/utils/PartialTreeUtils/getBreadcrumbs.js
var import_dist148 = __toESM(require_dist(), 1);
var import_dist149 = __toESM(require_dist2(), 1);
var import_dist150 = __toESM(require_dist3(), 1);
var getBreadcrumbs = (partialTree, currentFolderId) => {
  let folder = partialTree.find((f3) => f3.id === currentFolderId);
  let breadcrumbs = [];
  while (true) {
    breadcrumbs = [folder, ...breadcrumbs];
    if (folder.type === "root") break;
    const currentParentId = folder.parentId;
    folder = partialTree.find((f3) => f3.id === currentParentId);
  }
  return breadcrumbs;
};
var getBreadcrumbs_default = getBreadcrumbs;

// node_modules/@uppy/provider-views/lib/ProviderView/ProviderView.js
function _classPrivateFieldLooseBase(e3, t3) {
  if (!{}.hasOwnProperty.call(e3, t3)) throw new TypeError("attempted to use private field on non-instance");
  return e3;
}
var id = 0;
function _classPrivateFieldLooseKey(e3) {
  return "__private_" + id++ + "_" + e3;
}
var packageJson3 = {
  "version": "4.4.2"
};
function defaultPickerIcon() {
  return _("svg", {
    "aria-hidden": "true",
    focusable: "false",
    width: "30",
    height: "30",
    viewBox: "0 0 30 30"
  }, _("path", {
    d: "M15 30c8.284 0 15-6.716 15-15 0-8.284-6.716-15-15-15C6.716 0 0 6.716 0 15c0 8.284 6.716 15 15 15zm4.258-12.676v6.846h-8.426v-6.846H5.204l9.82-12.364 9.82 12.364H19.26z"
  }));
}
var getDefaultState = (rootFolderId) => ({
  authenticated: void 0,
  // we don't know yet
  partialTree: [{
    type: "root",
    id: rootFolderId,
    cached: false,
    nextPagePath: null
  }],
  currentFolderId: rootFolderId,
  searchString: "",
  didFirstRender: false,
  username: null,
  loading: false
});
var _abortController = _classPrivateFieldLooseKey("abortController");
var _withAbort = _classPrivateFieldLooseKey("withAbort");
var ProviderView = class {
  constructor(plugin, opts) {
    Object.defineProperty(this, _withAbort, {
      value: _withAbort2
    });
    this.isHandlingScroll = false;
    this.lastCheckbox = null;
    Object.defineProperty(this, _abortController, {
      writable: true,
      value: void 0
    });
    this.validateSingleFile = (file) => {
      const companionFile = remoteFileObjToLocal(file);
      const result = this.plugin.uppy.validateSingleFile(companionFile);
      return result;
    };
    this.getDisplayedPartialTree = () => {
      const {
        partialTree,
        currentFolderId,
        searchString
      } = this.plugin.getPluginState();
      const inThisFolder = partialTree.filter((item) => item.type !== "root" && item.parentId === currentFolderId);
      const filtered = searchString === "" ? inThisFolder : inThisFolder.filter((item) => {
        var _item$data$name;
        return ((_item$data$name = item.data.name) != null ? _item$data$name : this.plugin.uppy.i18n("unnamed")).toLowerCase().indexOf(searchString.toLowerCase()) !== -1;
      });
      return filtered;
    };
    this.validateAggregateRestrictions = (partialTree) => {
      const checkedFiles = partialTree.filter((item) => item.type === "file" && item.status === "checked");
      const uppyFiles = checkedFiles.map((file) => file.data);
      return this.plugin.uppy.validateAggregateRestrictions(uppyFiles);
    };
    this.plugin = plugin;
    this.provider = opts.provider;
    const defaultOptions4 = {
      viewType: "list",
      showTitles: true,
      showFilter: true,
      showBreadcrumbs: true,
      loadAllFiles: false,
      virtualList: false
    };
    this.opts = {
      ...defaultOptions4,
      ...opts
    };
    this.openFolder = this.openFolder.bind(this);
    this.logout = this.logout.bind(this);
    this.handleAuth = this.handleAuth.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.resetPluginState = this.resetPluginState.bind(this);
    this.donePicking = this.donePicking.bind(this);
    this.render = this.render.bind(this);
    this.cancelSelection = this.cancelSelection.bind(this);
    this.toggleCheckbox = this.toggleCheckbox.bind(this);
    this.resetPluginState();
    this.plugin.uppy.on("dashboard:close-panel", this.resetPluginState);
    this.plugin.uppy.registerRequestClient(this.provider.provider, this.provider);
  }
  resetPluginState() {
    this.plugin.setPluginState(getDefaultState(this.plugin.rootFolderId));
  }
  // eslint-disable-next-line class-methods-use-this
  tearDown() {
  }
  setLoading(loading) {
    this.plugin.setPluginState({
      loading
    });
  }
  cancelSelection() {
    const {
      partialTree
    } = this.plugin.getPluginState();
    const newPartialTree = partialTree.map((item) => item.type === "root" ? item : {
      ...item,
      status: "unchecked"
    });
    this.plugin.setPluginState({
      partialTree: newPartialTree
    });
  }
  async openFolder(folderId) {
    this.lastCheckbox = null;
    const {
      partialTree
    } = this.plugin.getPluginState();
    const clickedFolder = partialTree.find((folder) => folder.id === folderId);
    if (clickedFolder.cached) {
      this.plugin.setPluginState({
        currentFolderId: folderId,
        searchString: ""
      });
      return;
    }
    this.setLoading(true);
    await _classPrivateFieldLooseBase(this, _withAbort)[_withAbort](async (signal) => {
      let currentPagePath = folderId;
      let currentItems = [];
      do {
        const {
          username,
          nextPagePath,
          items
        } = await this.provider.list(currentPagePath, {
          signal
        });
        this.plugin.setPluginState({
          username
        });
        currentPagePath = nextPagePath;
        currentItems = currentItems.concat(items);
        this.setLoading(this.plugin.uppy.i18n("loadedXFiles", {
          numFiles: currentItems.length
        }));
      } while (this.opts.loadAllFiles && currentPagePath);
      const newPartialTree = PartialTreeUtils_default.afterOpenFolder(partialTree, currentItems, clickedFolder, currentPagePath, this.validateSingleFile);
      this.plugin.setPluginState({
        partialTree: newPartialTree,
        currentFolderId: folderId,
        searchString: ""
      });
    }).catch(handleError_default(this.plugin.uppy));
    this.setLoading(false);
  }
  /**
   * Removes session token on client side.
   */
  async logout() {
    await _classPrivateFieldLooseBase(this, _withAbort)[_withAbort](async (signal) => {
      const res = await this.provider.logout({
        signal
      });
      if (res.ok) {
        if (!res.revoked) {
          const message = this.plugin.uppy.i18n("companionUnauthorizeHint", {
            provider: this.plugin.title,
            url: res.manual_revoke_url
          });
          this.plugin.uppy.info(message, "info", 7e3);
        }
        this.plugin.setPluginState({
          ...getDefaultState(this.plugin.rootFolderId),
          authenticated: false
        });
      }
    }).catch(handleError_default(this.plugin.uppy));
  }
  async handleAuth(authFormData) {
    await _classPrivateFieldLooseBase(this, _withAbort)[_withAbort](async (signal) => {
      this.setLoading(true);
      await this.provider.login({
        authFormData,
        signal
      });
      this.plugin.setPluginState({
        authenticated: true
      });
      await Promise.all([this.provider.fetchPreAuthToken(), this.openFolder(this.plugin.rootFolderId)]);
    }).catch(handleError_default(this.plugin.uppy));
    this.setLoading(false);
  }
  async handleScroll(event) {
    const {
      partialTree,
      currentFolderId
    } = this.plugin.getPluginState();
    const currentFolder = partialTree.find((i3) => i3.id === currentFolderId);
    if (shouldHandleScroll_default(event) && !this.isHandlingScroll && currentFolder.nextPagePath) {
      this.isHandlingScroll = true;
      await _classPrivateFieldLooseBase(this, _withAbort)[_withAbort](async (signal) => {
        const {
          nextPagePath,
          items
        } = await this.provider.list(currentFolder.nextPagePath, {
          signal
        });
        const newPartialTree = PartialTreeUtils_default.afterScrollFolder(partialTree, currentFolderId, items, nextPagePath, this.validateSingleFile);
        this.plugin.setPluginState({
          partialTree: newPartialTree
        });
      }).catch(handleError_default(this.plugin.uppy));
      this.isHandlingScroll = false;
    }
  }
  async donePicking() {
    const {
      partialTree
    } = this.plugin.getPluginState();
    this.setLoading(true);
    await _classPrivateFieldLooseBase(this, _withAbort)[_withAbort](async (signal) => {
      const enrichedTree = await PartialTreeUtils_default.afterFill(partialTree, (path) => this.provider.list(path, {
        signal
      }), this.validateSingleFile, (n2) => {
        this.setLoading(this.plugin.uppy.i18n("addedNumFiles", {
          numFiles: n2
        }));
      });
      const aggregateRestrictionError = this.validateAggregateRestrictions(enrichedTree);
      if (aggregateRestrictionError) {
        this.plugin.setPluginState({
          partialTree: enrichedTree
        });
        return;
      }
      const companionFiles = getCheckedFilesWithPaths_default(enrichedTree);
      addFiles_default(companionFiles, this.plugin, this.provider);
      this.resetPluginState();
    }).catch(handleError_default(this.plugin.uppy));
    this.setLoading(false);
  }
  toggleCheckbox(ourItem, isShiftKeyPressed) {
    const {
      partialTree
    } = this.plugin.getPluginState();
    const clickedRange = getClickedRange_default(ourItem.id, this.getDisplayedPartialTree(), isShiftKeyPressed, this.lastCheckbox);
    const newPartialTree = PartialTreeUtils_default.afterToggleCheckbox(partialTree, clickedRange);
    this.plugin.setPluginState({
      partialTree: newPartialTree
    });
    this.lastCheckbox = ourItem.id;
  }
  render(state, viewOptions) {
    if (viewOptions === void 0) {
      viewOptions = {};
    }
    const {
      didFirstRender
    } = this.plugin.getPluginState();
    const {
      i18n
    } = this.plugin.uppy;
    if (!didFirstRender) {
      this.plugin.setPluginState({
        didFirstRender: true
      });
      this.provider.fetchPreAuthToken();
      this.openFolder(this.plugin.rootFolderId);
    }
    const opts = {
      ...this.opts,
      ...viewOptions
    };
    const {
      authenticated,
      loading
    } = this.plugin.getPluginState();
    const pluginIcon = this.plugin.icon || defaultPickerIcon;
    if (authenticated === false) {
      return _(AuthView, {
        pluginName: this.plugin.title,
        pluginIcon,
        handleAuth: this.handleAuth,
        i18n: this.plugin.uppy.i18n,
        renderForm: opts.renderAuthForm,
        loading
      });
    }
    const {
      partialTree,
      currentFolderId,
      username,
      searchString
    } = this.plugin.getPluginState();
    const breadcrumbs = getBreadcrumbs_default(partialTree, currentFolderId);
    return _("div", {
      className: (0, import_classnames4.default)("uppy-ProviderBrowser", `uppy-ProviderBrowser-viewType--${opts.viewType}`)
    }, _(Header, {
      showBreadcrumbs: opts.showBreadcrumbs,
      openFolder: this.openFolder,
      breadcrumbs,
      pluginIcon,
      title: this.plugin.title,
      logout: this.logout,
      username,
      i18n
    }), opts.showFilter && _(SearchInput_default, {
      searchString,
      setSearchString: (s3) => {
        this.plugin.setPluginState({
          searchString: s3
        });
      },
      submitSearchString: () => {
      },
      inputLabel: i18n("filter"),
      clearSearchLabel: i18n("resetFilter"),
      wrapperClassName: "uppy-ProviderBrowser-searchFilter",
      inputClassName: "uppy-ProviderBrowser-searchFilterInput"
    }), _(Browser_default, {
      toggleCheckbox: this.toggleCheckbox,
      displayedPartialTree: this.getDisplayedPartialTree(),
      openFolder: this.openFolder,
      virtualList: opts.virtualList,
      noResultsLabel: i18n("noFilesFound"),
      handleScroll: this.handleScroll,
      viewType: opts.viewType,
      showTitles: opts.showTitles,
      i18n: this.plugin.uppy.i18n,
      isLoading: loading,
      utmSource: "Companion"
    }), _(FooterActions, {
      partialTree,
      donePicking: this.donePicking,
      cancelSelection: this.cancelSelection,
      i18n,
      validateAggregateRestrictions: this.validateAggregateRestrictions
    }));
  }
};
async function _withAbort2(op) {
  var _classPrivateFieldLoo;
  (_classPrivateFieldLoo = _classPrivateFieldLooseBase(this, _abortController)[_abortController]) == null || _classPrivateFieldLoo.abort();
  const abortController = new AbortController();
  _classPrivateFieldLooseBase(this, _abortController)[_abortController] = abortController;
  const cancelRequest = () => {
    abortController.abort();
  };
  try {
    this.plugin.uppy.on("dashboard:close-panel", cancelRequest);
    this.plugin.uppy.on("cancel-all", cancelRequest);
    await op(abortController.signal);
  } finally {
    this.plugin.uppy.off("dashboard:close-panel", cancelRequest);
    this.plugin.uppy.off("cancel-all", cancelRequest);
    _classPrivateFieldLooseBase(this, _abortController)[_abortController] = void 0;
  }
}
ProviderView.VERSION = packageJson3.version;

// node_modules/@uppy/provider-views/lib/SearchProviderView/index.js
var import_dist160 = __toESM(require_dist(), 1);
var import_dist161 = __toESM(require_dist2(), 1);
var import_dist162 = __toESM(require_dist3(), 1);

// node_modules/@uppy/provider-views/lib/SearchProviderView/SearchProviderView.js
var import_dist157 = __toESM(require_dist(), 1);
var import_dist158 = __toESM(require_dist2(), 1);
var import_dist159 = __toESM(require_dist3(), 1);
var import_classnames5 = __toESM(require_classnames(), 1);
var packageJson4 = {
  "version": "4.4.2"
};
var defaultState = {
  loading: false,
  searchString: "",
  partialTree: [{
    type: "root",
    id: null,
    cached: false,
    nextPagePath: null
  }],
  currentFolderId: null,
  isInputMode: true
};
var defaultOptions2 = {
  viewType: "grid",
  showTitles: true,
  showFilter: true,
  utmSource: "Companion"
};
var SearchProviderView = class {
  constructor(plugin, opts) {
    this.isHandlingScroll = false;
    this.lastCheckbox = null;
    this.validateSingleFile = (file) => {
      const companionFile = remoteFileObjToLocal(file);
      const result = this.plugin.uppy.validateSingleFile(companionFile);
      return result;
    };
    this.getDisplayedPartialTree = () => {
      const {
        partialTree
      } = this.plugin.getPluginState();
      return partialTree.filter((item) => item.type !== "root");
    };
    this.setSearchString = (searchString) => {
      this.plugin.setPluginState({
        searchString
      });
      if (searchString === "") {
        this.plugin.setPluginState({
          partialTree: []
        });
      }
    };
    this.validateAggregateRestrictions = (partialTree) => {
      const checkedFiles = partialTree.filter((item) => item.type === "file" && item.status === "checked");
      const uppyFiles = checkedFiles.map((file) => file.data);
      return this.plugin.uppy.validateAggregateRestrictions(uppyFiles);
    };
    this.plugin = plugin;
    this.provider = opts.provider;
    this.opts = {
      ...defaultOptions2,
      ...opts
    };
    this.setSearchString = this.setSearchString.bind(this);
    this.search = this.search.bind(this);
    this.resetPluginState = this.resetPluginState.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.donePicking = this.donePicking.bind(this);
    this.cancelSelection = this.cancelSelection.bind(this);
    this.toggleCheckbox = this.toggleCheckbox.bind(this);
    this.render = this.render.bind(this);
    this.resetPluginState();
    this.plugin.uppy.on("dashboard:close-panel", this.resetPluginState);
    this.plugin.uppy.registerRequestClient(this.provider.provider, this.provider);
  }
  // eslint-disable-next-line class-methods-use-this
  tearDown() {
  }
  setLoading(loading) {
    this.plugin.setPluginState({
      loading
    });
  }
  resetPluginState() {
    this.plugin.setPluginState(defaultState);
  }
  cancelSelection() {
    const {
      partialTree
    } = this.plugin.getPluginState();
    const newPartialTree = partialTree.map((item) => item.type === "root" ? item : {
      ...item,
      status: "unchecked"
    });
    this.plugin.setPluginState({
      partialTree: newPartialTree
    });
  }
  async search() {
    const {
      searchString
    } = this.plugin.getPluginState();
    if (searchString === "") return;
    this.setLoading(true);
    try {
      const response = await this.provider.search(searchString);
      const newPartialTree = [{
        type: "root",
        id: null,
        cached: false,
        nextPagePath: response.nextPageQuery
      }, ...response.items.map((item) => ({
        type: "file",
        id: item.requestPath,
        status: "unchecked",
        parentId: null,
        data: item
      }))];
      this.plugin.setPluginState({
        partialTree: newPartialTree,
        isInputMode: false
      });
    } catch (error) {
      handleError_default(this.plugin.uppy)(error);
    }
    this.setLoading(false);
  }
  async handleScroll(event) {
    const {
      partialTree,
      searchString
    } = this.plugin.getPluginState();
    const root = partialTree.find((i3) => i3.type === "root");
    if (shouldHandleScroll_default(event) && !this.isHandlingScroll && root.nextPagePath) {
      this.isHandlingScroll = true;
      try {
        const response = await this.provider.search(searchString, root.nextPagePath);
        const newRoot = {
          ...root,
          nextPagePath: response.nextPageQuery
        };
        const oldItems = partialTree.filter((i3) => i3.type !== "root");
        const newPartialTree = [newRoot, ...oldItems, ...response.items.map((item) => ({
          type: "file",
          id: item.requestPath,
          status: "unchecked",
          parentId: null,
          data: item
        }))];
        this.plugin.setPluginState({
          partialTree: newPartialTree
        });
      } catch (error) {
        handleError_default(this.plugin.uppy)(error);
      }
      this.isHandlingScroll = false;
    }
  }
  async donePicking() {
    const {
      partialTree
    } = this.plugin.getPluginState();
    const companionFiles = getCheckedFilesWithPaths_default(partialTree);
    addFiles_default(companionFiles, this.plugin, this.provider);
    this.resetPluginState();
  }
  toggleCheckbox(ourItem, isShiftKeyPressed) {
    const {
      partialTree
    } = this.plugin.getPluginState();
    const clickedRange = getClickedRange_default(ourItem.id, this.getDisplayedPartialTree(), isShiftKeyPressed, this.lastCheckbox);
    const newPartialTree = PartialTreeUtils_default.afterToggleCheckbox(partialTree, clickedRange);
    this.plugin.setPluginState({
      partialTree: newPartialTree
    });
    this.lastCheckbox = ourItem.id;
  }
  render(state, viewOptions) {
    if (viewOptions === void 0) {
      viewOptions = {};
    }
    const {
      isInputMode,
      searchString,
      loading,
      partialTree
    } = this.plugin.getPluginState();
    const {
      i18n
    } = this.plugin.uppy;
    const opts = {
      ...this.opts,
      ...viewOptions
    };
    if (isInputMode) {
      return _(SearchInput_default, {
        searchString,
        setSearchString: this.setSearchString,
        submitSearchString: this.search,
        inputLabel: i18n("enterTextToSearch"),
        buttonLabel: i18n("searchImages"),
        wrapperClassName: "uppy-SearchProvider",
        inputClassName: "uppy-c-textInput uppy-SearchProvider-input",
        showButton: true,
        buttonCSSClassName: "uppy-SearchProvider-searchButton"
      });
    }
    return _("div", {
      className: (0, import_classnames5.default)("uppy-ProviderBrowser", `uppy-ProviderBrowser-viewType--${opts.viewType}`)
    }, opts.showFilter && _(SearchInput_default, {
      searchString,
      setSearchString: this.setSearchString,
      submitSearchString: this.search,
      inputLabel: i18n("search"),
      clearSearchLabel: i18n("resetSearch"),
      wrapperClassName: "uppy-ProviderBrowser-searchFilter",
      inputClassName: "uppy-ProviderBrowser-searchFilterInput"
    }), _(Browser_default, {
      toggleCheckbox: this.toggleCheckbox,
      displayedPartialTree: this.getDisplayedPartialTree(),
      handleScroll: this.handleScroll,
      openFolder: async () => {
      },
      noResultsLabel: i18n("noSearchResults"),
      viewType: opts.viewType,
      showTitles: opts.showTitles,
      isLoading: loading,
      i18n,
      virtualList: false,
      utmSource: this.opts.utmSource
    }), _(FooterActions, {
      partialTree,
      donePicking: this.donePicking,
      cancelSelection: this.cancelSelection,
      i18n,
      validateAggregateRestrictions: this.validateAggregateRestrictions
    }));
  }
};
SearchProviderView.VERSION = packageJson4.version;

// node_modules/@uppy/provider-views/lib/GooglePicker/GooglePickerView.js
var import_dist169 = __toESM(require_dist(), 1);
var import_dist170 = __toESM(require_dist2(), 1);
var import_dist171 = __toESM(require_dist3(), 1);

// node_modules/@uppy/provider-views/lib/GooglePicker/googlePicker.js
var import_dist163 = __toESM(require_dist(), 1);
var import_dist164 = __toESM(require_dist2(), 1);
var import_dist165 = __toESM(require_dist3(), 1);

// node_modules/@uppy/provider-views/lib/GooglePicker/icons.js
var import_dist166 = __toESM(require_dist(), 1);
var import_dist167 = __toESM(require_dist2(), 1);
var import_dist168 = __toESM(require_dist3(), 1);

// node_modules/@uppy/dashboard/node_modules/nanoid/non-secure/index.js
var import_dist175 = __toESM(require_dist());
var import_dist176 = __toESM(require_dist2());
var import_dist177 = __toESM(require_dist3());
var urlAlphabet2 = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
var nanoid2 = (size = 21) => {
  let id3 = "";
  let i3 = size | 0;
  while (i3--) {
    id3 += urlAlphabet2[Math.random() * 64 | 0];
  }
  return id3;
};

// node_modules/memoize-one/dist/memoize-one.esm.js
var import_dist178 = __toESM(require_dist());
var import_dist179 = __toESM(require_dist2());
var import_dist180 = __toESM(require_dist3());
var safeIsNaN = Number.isNaN || function ponyfill(value) {
  return typeof value === "number" && value !== value;
};
function isEqual(first, second) {
  if (first === second) {
    return true;
  }
  if (safeIsNaN(first) && safeIsNaN(second)) {
    return true;
  }
  return false;
}
function areInputsEqual(newInputs, lastInputs) {
  if (newInputs.length !== lastInputs.length) {
    return false;
  }
  for (var i3 = 0; i3 < newInputs.length; i3++) {
    if (!isEqual(newInputs[i3], lastInputs[i3])) {
      return false;
    }
  }
  return true;
}
function memoizeOne(resultFn, isEqual2) {
  if (isEqual2 === void 0) {
    isEqual2 = areInputsEqual;
  }
  var cache = null;
  function memoized() {
    var newArgs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      newArgs[_i] = arguments[_i];
    }
    if (cache && cache.lastThis === this && isEqual2(newArgs, cache.lastArgs)) {
      return cache.lastResult;
    }
    var lastResult = resultFn.apply(this, newArgs);
    cache = {
      lastResult,
      lastArgs: newArgs,
      lastThis: this
    };
    return lastResult;
  }
  memoized.clear = function clear() {
    cache = null;
  };
  return memoized;
}

// node_modules/@uppy/dashboard/lib/utils/trapFocus.js
var import_dist187 = __toESM(require_dist(), 1);
var import_dist188 = __toESM(require_dist2(), 1);
var import_dist189 = __toESM(require_dist3(), 1);

// node_modules/@uppy/utils/lib/FOCUSABLE_ELEMENTS.js
var import_dist181 = __toESM(require_dist());
var import_dist182 = __toESM(require_dist2());
var import_dist183 = __toESM(require_dist3());
var FOCUSABLE_ELEMENTS_default = ['a[href]:not([tabindex^="-"]):not([inert]):not([aria-hidden])', 'area[href]:not([tabindex^="-"]):not([inert]):not([aria-hidden])', "input:not([disabled]):not([inert]):not([aria-hidden])", "select:not([disabled]):not([inert]):not([aria-hidden])", "textarea:not([disabled]):not([inert]):not([aria-hidden])", "button:not([disabled]):not([inert]):not([aria-hidden])", 'iframe:not([tabindex^="-"]):not([inert]):not([aria-hidden])', 'object:not([tabindex^="-"]):not([inert]):not([aria-hidden])', 'embed:not([tabindex^="-"]):not([inert]):not([aria-hidden])', '[contenteditable]:not([tabindex^="-"]):not([inert]):not([aria-hidden])', '[tabindex]:not([tabindex^="-"]):not([inert]):not([aria-hidden])'];

// node_modules/@uppy/dashboard/lib/utils/getActiveOverlayEl.js
var import_dist184 = __toESM(require_dist(), 1);
var import_dist185 = __toESM(require_dist2(), 1);
var import_dist186 = __toESM(require_dist3(), 1);
function getActiveOverlayEl(dashboardEl, activeOverlayType) {
  if (activeOverlayType) {
    const overlayEl = dashboardEl.querySelector(`[data-uppy-paneltype="${activeOverlayType}"]`);
    if (overlayEl) return overlayEl;
  }
  return dashboardEl;
}

// node_modules/@uppy/dashboard/lib/utils/trapFocus.js
function focusOnFirstNode(event, nodes) {
  const node = nodes[0];
  if (node) {
    node.focus();
    event.preventDefault();
  }
}
function focusOnLastNode(event, nodes) {
  const node = nodes[nodes.length - 1];
  if (node) {
    node.focus();
    event.preventDefault();
  }
}
function isFocusInOverlay(activeOverlayEl) {
  return activeOverlayEl.contains(document.activeElement);
}
function trapFocus(event, activeOverlayType, dashboardEl) {
  const activeOverlayEl = getActiveOverlayEl(dashboardEl, activeOverlayType);
  const focusableNodes = toArray_default(activeOverlayEl.querySelectorAll(FOCUSABLE_ELEMENTS_default));
  const focusedItemIndex = focusableNodes.indexOf(document.activeElement);
  if (!isFocusInOverlay(activeOverlayEl)) {
    focusOnFirstNode(event, focusableNodes);
  } else if (event.shiftKey && focusedItemIndex === 0) {
    focusOnLastNode(event, focusableNodes);
  } else if (!event.shiftKey && focusedItemIndex === focusableNodes.length - 1) {
    focusOnFirstNode(event, focusableNodes);
  }
}
function forInline(event, activeOverlayType, dashboardEl) {
  if (activeOverlayType === null) {
  } else {
    trapFocus(event, activeOverlayType, dashboardEl);
  }
}

// node_modules/@uppy/dashboard/lib/utils/createSuperFocus.js
var import_dist190 = __toESM(require_dist(), 1);
var import_dist191 = __toESM(require_dist2(), 1);
var import_dist192 = __toESM(require_dist3(), 1);
var import_debounce = __toESM(require_debounce(), 1);
function createSuperFocus() {
  let lastFocusWasOnSuperFocusableEl = false;
  const superFocus = (dashboardEl, activeOverlayType) => {
    const overlayEl = getActiveOverlayEl(dashboardEl, activeOverlayType);
    const isFocusInOverlay2 = overlayEl.contains(document.activeElement);
    if (isFocusInOverlay2 && lastFocusWasOnSuperFocusableEl) return;
    const superFocusableEl = overlayEl.querySelector("[data-uppy-super-focusable]");
    if (isFocusInOverlay2 && !superFocusableEl) return;
    if (superFocusableEl) {
      superFocusableEl.focus({
        preventScroll: true
      });
      lastFocusWasOnSuperFocusableEl = true;
    } else {
      const firstEl = overlayEl.querySelector(FOCUSABLE_ELEMENTS_default);
      firstEl == null || firstEl.focus({
        preventScroll: true
      });
      lastFocusWasOnSuperFocusableEl = false;
    }
  };
  return (0, import_debounce.default)(superFocus, 260);
}

// node_modules/@uppy/dashboard/lib/components/Dashboard.js
var import_dist259 = __toESM(require_dist(), 1);
var import_dist260 = __toESM(require_dist2(), 1);
var import_dist261 = __toESM(require_dist3(), 1);
var import_classnames12 = __toESM(require_classnames(), 1);

// node_modules/@uppy/utils/lib/isDragDropSupported.js
var import_dist193 = __toESM(require_dist());
var import_dist194 = __toESM(require_dist2());
var import_dist195 = __toESM(require_dist3());
function isDragDropSupported() {
  const div = document.body;
  if (!("draggable" in div) || !("ondragstart" in div && "ondrop" in div)) {
    return false;
  }
  if (!("FormData" in window)) {
    return false;
  }
  if (!("FileReader" in window)) {
    return false;
  }
  return true;
}

// node_modules/@uppy/dashboard/lib/components/FileList.js
var import_dist229 = __toESM(require_dist(), 1);
var import_dist230 = __toESM(require_dist2(), 1);
var import_dist231 = __toESM(require_dist3(), 1);

// node_modules/@uppy/dashboard/lib/components/FileItem/index.js
var import_dist226 = __toESM(require_dist(), 1);
var import_dist227 = __toESM(require_dist2(), 1);
var import_dist228 = __toESM(require_dist3(), 1);
var import_classnames6 = __toESM(require_classnames(), 1);

// node_modules/shallow-equal/dist/index.modern.mjs
var import_dist196 = __toESM(require_dist(), 1);
var import_dist197 = __toESM(require_dist2(), 1);
var import_dist198 = __toESM(require_dist3(), 1);
function shallowEqualObjects(objA, objB) {
  if (objA === objB) {
    return true;
  }
  if (!objA || !objB) {
    return false;
  }
  const aKeys = Object.keys(objA);
  const bKeys = Object.keys(objB);
  const len = aKeys.length;
  if (bKeys.length !== len) {
    return false;
  }
  for (let i3 = 0; i3 < len; i3++) {
    const key = aKeys[i3];
    if (objA[key] !== objB[key] || !Object.prototype.hasOwnProperty.call(objB, key)) {
      return false;
    }
  }
  return true;
}

// node_modules/@uppy/dashboard/lib/components/FileItem/FilePreviewAndLink/index.js
var import_dist208 = __toESM(require_dist(), 1);
var import_dist209 = __toESM(require_dist2(), 1);
var import_dist210 = __toESM(require_dist3(), 1);

// node_modules/@uppy/dashboard/lib/components/FilePreview.js
var import_dist202 = __toESM(require_dist(), 1);
var import_dist203 = __toESM(require_dist2(), 1);
var import_dist204 = __toESM(require_dist3(), 1);

// node_modules/@uppy/dashboard/lib/utils/getFileTypeIcon.js
var import_dist199 = __toESM(require_dist(), 1);
var import_dist200 = __toESM(require_dist2(), 1);
var import_dist201 = __toESM(require_dist3(), 1);
function iconImage() {
  return _("svg", {
    "aria-hidden": "true",
    focusable: "false",
    width: "25",
    height: "25",
    viewBox: "0 0 25 25"
  }, _("g", {
    fill: "#686DE0",
    fillRule: "evenodd"
  }, _("path", {
    d: "M5 7v10h15V7H5zm0-1h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z",
    fillRule: "nonzero"
  }), _("path", {
    d: "M6.35 17.172l4.994-5.026a.5.5 0 0 1 .707 0l2.16 2.16 3.505-3.505a.5.5 0 0 1 .707 0l2.336 2.31-.707.72-1.983-1.97-3.505 3.505a.5.5 0 0 1-.707 0l-2.16-2.159-3.938 3.939-1.409.026z",
    fillRule: "nonzero"
  }), _("circle", {
    cx: "7.5",
    cy: "9.5",
    r: "1.5"
  })));
}
function iconAudio() {
  return _("svg", {
    "aria-hidden": "true",
    focusable: "false",
    className: "uppy-c-icon",
    width: "25",
    height: "25",
    viewBox: "0 0 25 25"
  }, _("path", {
    d: "M9.5 18.64c0 1.14-1.145 2-2.5 2s-2.5-.86-2.5-2c0-1.14 1.145-2 2.5-2 .557 0 1.079.145 1.5.396V7.25a.5.5 0 0 1 .379-.485l9-2.25A.5.5 0 0 1 18.5 5v11.64c0 1.14-1.145 2-2.5 2s-2.5-.86-2.5-2c0-1.14 1.145-2 2.5-2 .557 0 1.079.145 1.5.396V8.67l-8 2v7.97zm8-11v-2l-8 2v2l8-2zM7 19.64c.855 0 1.5-.484 1.5-1s-.645-1-1.5-1-1.5.484-1.5 1 .645 1 1.5 1zm9-2c.855 0 1.5-.484 1.5-1s-.645-1-1.5-1-1.5.484-1.5 1 .645 1 1.5 1z",
    fill: "#049BCF",
    fillRule: "nonzero"
  }));
}
function iconVideo() {
  return _("svg", {
    "aria-hidden": "true",
    focusable: "false",
    className: "uppy-c-icon",
    width: "25",
    height: "25",
    viewBox: "0 0 25 25"
  }, _("path", {
    d: "M16 11.834l4.486-2.691A1 1 0 0 1 22 10v6a1 1 0 0 1-1.514.857L16 14.167V17a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2.834zM15 9H5v8h10V9zm1 4l5 3v-6l-5 3z",
    fill: "#19AF67",
    fillRule: "nonzero"
  }));
}
function iconPDF() {
  return _("svg", {
    "aria-hidden": "true",
    focusable: "false",
    className: "uppy-c-icon",
    width: "25",
    height: "25",
    viewBox: "0 0 25 25"
  }, _("path", {
    d: "M9.766 8.295c-.691-1.843-.539-3.401.747-3.726 1.643-.414 2.505.938 2.39 3.299-.039.79-.194 1.662-.537 3.148.324.49.66.967 1.055 1.51.17.231.382.488.629.757 1.866-.128 3.653.114 4.918.655 1.487.635 2.192 1.685 1.614 2.84-.566 1.133-1.839 1.084-3.416.249-1.141-.604-2.457-1.634-3.51-2.707a13.467 13.467 0 0 0-2.238.426c-1.392 4.051-4.534 6.453-5.707 4.572-.986-1.58 1.38-4.206 4.914-5.375.097-.322.185-.656.264-1.001.08-.353.306-1.31.407-1.737-.678-1.059-1.2-2.031-1.53-2.91zm2.098 4.87c-.033.144-.068.287-.104.427l.033-.01-.012.038a14.065 14.065 0 0 1 1.02-.197l-.032-.033.052-.004a7.902 7.902 0 0 1-.208-.271c-.197-.27-.38-.526-.555-.775l-.006.028-.002-.003c-.076.323-.148.632-.186.8zm5.77 2.978c1.143.605 1.832.632 2.054.187.26-.519-.087-1.034-1.113-1.473-.911-.39-2.175-.608-3.55-.608.845.766 1.787 1.459 2.609 1.894zM6.559 18.789c.14.223.693.16 1.425-.413.827-.648 1.61-1.747 2.208-3.206-2.563 1.064-4.102 2.867-3.633 3.62zm5.345-10.97c.088-1.793-.351-2.48-1.146-2.28-.473.119-.564 1.05-.056 2.405.213.566.52 1.188.908 1.859.18-.858.268-1.453.294-1.984z",
    fill: "#E2514A",
    fillRule: "nonzero"
  }));
}
function iconArchive() {
  return _("svg", {
    "aria-hidden": "true",
    focusable: "false",
    width: "25",
    height: "25",
    viewBox: "0 0 25 25"
  }, _("path", {
    d: "M10.45 2.05h1.05a.5.5 0 0 1 .5.5v.024a.5.5 0 0 1-.5.5h-1.05a.5.5 0 0 1-.5-.5V2.55a.5.5 0 0 1 .5-.5zm2.05 1.024h1.05a.5.5 0 0 1 .5.5V3.6a.5.5 0 0 1-.5.5H12.5a.5.5 0 0 1-.5-.5v-.025a.5.5 0 0 1 .5-.5v-.001zM10.45 0h1.05a.5.5 0 0 1 .5.5v.025a.5.5 0 0 1-.5.5h-1.05a.5.5 0 0 1-.5-.5V.5a.5.5 0 0 1 .5-.5zm2.05 1.025h1.05a.5.5 0 0 1 .5.5v.024a.5.5 0 0 1-.5.5H12.5a.5.5 0 0 1-.5-.5v-.024a.5.5 0 0 1 .5-.5zm-2.05 3.074h1.05a.5.5 0 0 1 .5.5v.025a.5.5 0 0 1-.5.5h-1.05a.5.5 0 0 1-.5-.5v-.025a.5.5 0 0 1 .5-.5zm2.05 1.025h1.05a.5.5 0 0 1 .5.5v.024a.5.5 0 0 1-.5.5H12.5a.5.5 0 0 1-.5-.5v-.024a.5.5 0 0 1 .5-.5zm-2.05 1.024h1.05a.5.5 0 0 1 .5.5v.025a.5.5 0 0 1-.5.5h-1.05a.5.5 0 0 1-.5-.5v-.025a.5.5 0 0 1 .5-.5zm2.05 1.025h1.05a.5.5 0 0 1 .5.5v.025a.5.5 0 0 1-.5.5H12.5a.5.5 0 0 1-.5-.5v-.025a.5.5 0 0 1 .5-.5zm-2.05 1.025h1.05a.5.5 0 0 1 .5.5v.025a.5.5 0 0 1-.5.5h-1.05a.5.5 0 0 1-.5-.5v-.025a.5.5 0 0 1 .5-.5zm2.05 1.025h1.05a.5.5 0 0 1 .5.5v.024a.5.5 0 0 1-.5.5H12.5a.5.5 0 0 1-.5-.5v-.024a.5.5 0 0 1 .5-.5zm-1.656 3.074l-.82 5.946c.52.302 1.174.458 1.976.458.803 0 1.455-.156 1.975-.458l-.82-5.946h-2.311zm0-1.025h2.312c.512 0 .946.378 1.015.885l.82 5.946c.056.412-.142.817-.501 1.026-.686.398-1.515.597-2.49.597-.974 0-1.804-.199-2.49-.597a1.025 1.025 0 0 1-.5-1.026l.819-5.946c.07-.507.503-.885 1.015-.885zm.545 6.6a.5.5 0 0 1-.397-.561l.143-.999a.5.5 0 0 1 .495-.429h.74a.5.5 0 0 1 .495.43l.143.998a.5.5 0 0 1-.397.561c-.404.08-.819.08-1.222 0z",
    fill: "#00C469",
    fillRule: "nonzero"
  }));
}
function iconFile() {
  return _("svg", {
    "aria-hidden": "true",
    focusable: "false",
    className: "uppy-c-icon",
    width: "25",
    height: "25",
    viewBox: "0 0 25 25"
  }, _("g", {
    fill: "#A7AFB7",
    fillRule: "nonzero"
  }, _("path", {
    d: "M5.5 22a.5.5 0 0 1-.5-.5v-18a.5.5 0 0 1 .5-.5h10.719a.5.5 0 0 1 .367.16l3.281 3.556a.5.5 0 0 1 .133.339V21.5a.5.5 0 0 1-.5.5h-14zm.5-1h13V7.25L16 4H6v17z"
  }), _("path", {
    d: "M15 4v3a1 1 0 0 0 1 1h3V7h-3V4h-1z"
  })));
}
function iconText() {
  return _("svg", {
    "aria-hidden": "true",
    focusable: "false",
    className: "uppy-c-icon",
    width: "25",
    height: "25",
    viewBox: "0 0 25 25"
  }, _("path", {
    d: "M4.5 7h13a.5.5 0 1 1 0 1h-13a.5.5 0 0 1 0-1zm0 3h15a.5.5 0 1 1 0 1h-15a.5.5 0 1 1 0-1zm0 3h15a.5.5 0 1 1 0 1h-15a.5.5 0 1 1 0-1zm0 3h10a.5.5 0 1 1 0 1h-10a.5.5 0 1 1 0-1z",
    fill: "#5A5E69",
    fillRule: "nonzero"
  }));
}
function getIconByMime(fileType) {
  const defaultChoice = {
    color: "#838999",
    icon: iconFile()
  };
  if (!fileType) return defaultChoice;
  const fileTypeGeneral = fileType.split("/")[0];
  const fileTypeSpecific = fileType.split("/")[1];
  if (fileTypeGeneral === "text") {
    return {
      color: "#5a5e69",
      icon: iconText()
    };
  }
  if (fileTypeGeneral === "image") {
    return {
      color: "#686de0",
      icon: iconImage()
    };
  }
  if (fileTypeGeneral === "audio") {
    return {
      color: "#068dbb",
      icon: iconAudio()
    };
  }
  if (fileTypeGeneral === "video") {
    return {
      color: "#19af67",
      icon: iconVideo()
    };
  }
  if (fileTypeGeneral === "application" && fileTypeSpecific === "pdf") {
    return {
      color: "#e25149",
      icon: iconPDF()
    };
  }
  const archiveTypes = ["zip", "x-7z-compressed", "x-zip-compressed", "x-rar-compressed", "x-tar", "x-gzip", "x-apple-diskimage"];
  if (fileTypeGeneral === "application" && archiveTypes.indexOf(fileTypeSpecific) !== -1) {
    return {
      color: "#00C469",
      icon: iconArchive()
    };
  }
  return defaultChoice;
}

// node_modules/@uppy/dashboard/lib/components/FilePreview.js
function FilePreview(props) {
  const {
    file
  } = props;
  if (file.preview) {
    return _("img", {
      draggable: false,
      className: "uppy-Dashboard-Item-previewImg",
      alt: file.name,
      src: file.preview
    });
  }
  const {
    color,
    icon
  } = getIconByMime(file.type);
  return _("div", {
    className: "uppy-Dashboard-Item-previewIconWrap"
  }, _("span", {
    className: "uppy-Dashboard-Item-previewIcon",
    style: {
      color
    }
  }, icon), _("svg", {
    "aria-hidden": "true",
    focusable: "false",
    className: "uppy-Dashboard-Item-previewIconBg",
    width: "58",
    height: "76",
    viewBox: "0 0 58 76"
  }, _("rect", {
    fill: "#FFF",
    width: "58",
    height: "76",
    rx: "3",
    fillRule: "evenodd"
  })));
}

// node_modules/@uppy/dashboard/lib/components/FileItem/MetaErrorMessage.js
var import_dist205 = __toESM(require_dist(), 1);
var import_dist206 = __toESM(require_dist2(), 1);
var import_dist207 = __toESM(require_dist3(), 1);
var metaFieldIdToName = (metaFieldId, metaFields) => {
  const fields = typeof metaFields === "function" ? metaFields() : metaFields;
  const field = fields.filter((f3) => f3.id === metaFieldId);
  return field[0].name;
};
function MetaErrorMessage(props) {
  const {
    file,
    toggleFileCard,
    i18n,
    metaFields
  } = props;
  const {
    missingRequiredMetaFields
  } = file;
  if (!(missingRequiredMetaFields != null && missingRequiredMetaFields.length)) {
    return null;
  }
  const metaFieldsString = missingRequiredMetaFields.map((missingMetaField) => metaFieldIdToName(missingMetaField, metaFields)).join(", ");
  return _("div", {
    className: "uppy-Dashboard-Item-errorMessage"
  }, i18n("missingRequiredMetaFields", {
    smart_count: missingRequiredMetaFields.length,
    fields: metaFieldsString
  }), " ", _("button", {
    type: "button",
    class: "uppy-u-reset uppy-Dashboard-Item-errorMessageBtn",
    onClick: () => toggleFileCard(true, file.id)
  }, i18n("editFile")));
}

// node_modules/@uppy/dashboard/lib/components/FileItem/FilePreviewAndLink/index.js
function FilePreviewAndLink(props) {
  const {
    file,
    i18n,
    toggleFileCard,
    metaFields,
    showLinkToFileUploadResult
  } = props;
  const white = "rgba(255, 255, 255, 0.5)";
  const previewBackgroundColor = file.preview ? white : getIconByMime(file.type).color;
  return _("div", {
    className: "uppy-Dashboard-Item-previewInnerWrap",
    style: {
      backgroundColor: previewBackgroundColor
    }
  }, showLinkToFileUploadResult && file.uploadURL && _("a", {
    className: "uppy-Dashboard-Item-previewLink",
    href: file.uploadURL,
    rel: "noreferrer noopener",
    target: "_blank",
    "aria-label": file.meta.name
  }, _("span", {
    hidden: true
  }, file.meta.name)), _(FilePreview, {
    file
  }), _(MetaErrorMessage, {
    file,
    i18n,
    toggleFileCard,
    metaFields
  }));
}

// node_modules/@uppy/dashboard/lib/components/FileItem/FileProgress/index.js
var import_dist211 = __toESM(require_dist(), 1);
var import_dist212 = __toESM(require_dist2(), 1);
var import_dist213 = __toESM(require_dist3(), 1);
function onPauseResumeCancelRetry(props) {
  if (props.isUploaded) return;
  if (props.error && !props.hideRetryButton) {
    props.uppy.retryUpload(props.file.id);
    return;
  }
  if (props.resumableUploads && !props.hidePauseResumeButton) {
    props.uppy.pauseResume(props.file.id);
  } else if (props.individualCancellation && !props.hideCancelButton) {
    props.uppy.removeFile(props.file.id);
  }
}
function progressIndicatorTitle(props) {
  if (props.isUploaded) {
    return props.i18n("uploadComplete");
  }
  if (props.error) {
    return props.i18n("retryUpload");
  }
  if (props.resumableUploads) {
    if (props.file.isPaused) {
      return props.i18n("resumeUpload");
    }
    return props.i18n("pauseUpload");
  }
  if (props.individualCancellation) {
    return props.i18n("cancelUpload");
  }
  return "";
}
function ProgressIndicatorButton(props) {
  return _("div", {
    className: "uppy-Dashboard-Item-progress"
  }, _("button", {
    className: "uppy-u-reset uppy-c-btn uppy-Dashboard-Item-progressIndicator",
    type: "button",
    "aria-label": progressIndicatorTitle(props),
    title: progressIndicatorTitle(props),
    onClick: () => onPauseResumeCancelRetry(props)
  }, props.children));
}
function ProgressCircleContainer(_ref) {
  let {
    children
  } = _ref;
  return _("svg", {
    "aria-hidden": "true",
    focusable: "false",
    width: "70",
    height: "70",
    viewBox: "0 0 36 36",
    className: "uppy-c-icon uppy-Dashboard-Item-progressIcon--circle"
  }, children);
}
function ProgressCircle(_ref2) {
  let {
    progress
  } = _ref2;
  const circleLength = 2 * Math.PI * 15;
  return _("g", null, _("circle", {
    className: "uppy-Dashboard-Item-progressIcon--bg",
    r: "15",
    cx: "18",
    cy: "18",
    "stroke-width": "2",
    fill: "none"
  }), _("circle", {
    className: "uppy-Dashboard-Item-progressIcon--progress",
    r: "15",
    cx: "18",
    cy: "18",
    transform: "rotate(-90, 18, 18)",
    fill: "none",
    "stroke-width": "2",
    "stroke-dasharray": circleLength,
    "stroke-dashoffset": circleLength - circleLength / 100 * progress
  }));
}
function FileProgress(props) {
  if (!props.file.progress.uploadStarted) {
    return null;
  }
  if (props.file.progress.percentage === void 0) {
    return null;
  }
  if (props.isUploaded) {
    return _("div", {
      className: "uppy-Dashboard-Item-progress"
    }, _("div", {
      className: "uppy-Dashboard-Item-progressIndicator"
    }, _(ProgressCircleContainer, null, _("circle", {
      r: "15",
      cx: "18",
      cy: "18",
      fill: "#1bb240"
    }), _("polygon", {
      className: "uppy-Dashboard-Item-progressIcon--check",
      transform: "translate(2, 3)",
      points: "14 22.5 7 15.2457065 8.99985857 13.1732815 14 18.3547104 22.9729883 9 25 11.1005634"
    }))));
  }
  if (props.recoveredState) {
    return null;
  }
  if (props.error && !props.hideRetryButton) {
    return (
      // eslint-disable-next-line react/jsx-props-no-spreading
      _(ProgressIndicatorButton, props, _("svg", {
        "aria-hidden": "true",
        focusable: "false",
        className: "uppy-c-icon uppy-Dashboard-Item-progressIcon--retry",
        width: "28",
        height: "31",
        viewBox: "0 0 16 19"
      }, _("path", {
        d: "M16 11a8 8 0 1 1-8-8v2a6 6 0 1 0 6 6h2z"
      }), _("path", {
        d: "M7.9 3H10v2H7.9z"
      }), _("path", {
        d: "M8.536.5l3.535 3.536-1.414 1.414L7.12 1.914z"
      }), _("path", {
        d: "M10.657 2.621l1.414 1.415L8.536 7.57 7.12 6.157z"
      })))
    );
  }
  if (props.resumableUploads && !props.hidePauseResumeButton) {
    return (
      // eslint-disable-next-line react/jsx-props-no-spreading
      _(ProgressIndicatorButton, props, _(ProgressCircleContainer, null, _(ProgressCircle, {
        progress: props.file.progress.percentage
      }), props.file.isPaused ? _("polygon", {
        className: "uppy-Dashboard-Item-progressIcon--play",
        transform: "translate(3, 3)",
        points: "12 20 12 10 20 15"
      }) : _("g", {
        className: "uppy-Dashboard-Item-progressIcon--pause",
        transform: "translate(14.5, 13)"
      }, _("rect", {
        x: "0",
        y: "0",
        width: "2",
        height: "10",
        rx: "0"
      }), _("rect", {
        x: "5",
        y: "0",
        width: "2",
        height: "10",
        rx: "0"
      }))))
    );
  }
  if (!props.resumableUploads && props.individualCancellation && !props.hideCancelButton) {
    return (
      // eslint-disable-next-line react/jsx-props-no-spreading
      _(ProgressIndicatorButton, props, _(ProgressCircleContainer, null, _(ProgressCircle, {
        progress: props.file.progress.percentage
      }), _("polygon", {
        className: "cancel",
        transform: "translate(2, 2)",
        points: "19.8856516 11.0625 16 14.9481516 12.1019737 11.0625 11.0625 12.1143484 14.9481516 16 11.0625 19.8980263 12.1019737 20.9375 16 17.0518484 19.8856516 20.9375 20.9375 19.8980263 17.0518484 16 20.9375 12"
      })))
    );
  }
  return _("div", {
    className: "uppy-Dashboard-Item-progress"
  }, _("div", {
    className: "uppy-Dashboard-Item-progressIndicator"
  }, _(ProgressCircleContainer, null, _(ProgressCircle, {
    progress: props.file.progress.percentage
  }))));
}

// node_modules/@uppy/dashboard/lib/components/FileItem/FileInfo/index.js
var import_dist217 = __toESM(require_dist(), 1);
var import_dist218 = __toESM(require_dist2(), 1);
var import_dist219 = __toESM(require_dist3(), 1);
var import_prettier_bytes = __toESM(require_prettierBytes(), 1);

// node_modules/@uppy/utils/lib/truncateString.js
var import_dist214 = __toESM(require_dist());
var import_dist215 = __toESM(require_dist2());
var import_dist216 = __toESM(require_dist3());
var separator = "...";
function truncateString(string, maxLength) {
  if (maxLength === 0) return "";
  if (string.length <= maxLength) return string;
  if (maxLength <= separator.length + 1) return `${string.slice(0, maxLength - 1)}…`;
  const charsToShow = maxLength - separator.length;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);
  return string.slice(0, frontChars) + separator + string.slice(-backChars);
}

// node_modules/@uppy/dashboard/lib/components/FileItem/FileInfo/index.js
var renderFileName = (props) => {
  const {
    author,
    name
  } = props.file.meta;
  function getMaxNameLength() {
    if (props.isSingleFile && props.containerHeight >= 350) {
      return 90;
    }
    if (props.containerWidth <= 352) {
      return 35;
    }
    if (props.containerWidth <= 576) {
      return 60;
    }
    return author ? 20 : 30;
  }
  return _("div", {
    className: "uppy-Dashboard-Item-name",
    title: name
  }, truncateString(name, getMaxNameLength()));
};
var renderAuthor = (props) => {
  var _props$file$remote;
  const {
    author
  } = props.file.meta;
  const providerName = (_props$file$remote = props.file.remote) == null ? void 0 : _props$file$remote.providerName;
  const dot = `·`;
  if (!author) {
    return null;
  }
  return _("div", {
    className: "uppy-Dashboard-Item-author"
  }, _("a", {
    href: `${author.url}?utm_source=Companion&utm_medium=referral`,
    target: "_blank",
    rel: "noopener noreferrer"
  }, truncateString(author.name, 13)), providerName ? _(Fragment, null, ` ${dot} `, providerName, ` ${dot} `) : null);
};
var renderFileSize = (props) => props.file.size && _("div", {
  className: "uppy-Dashboard-Item-statusSize"
}, (0, import_prettier_bytes.default)(props.file.size));
var ReSelectButton = (props) => props.file.isGhost && _("span", null, " • ", _("button", {
  className: "uppy-u-reset uppy-c-btn uppy-Dashboard-Item-reSelect",
  type: "button",
  onClick: () => props.toggleAddFilesPanel(true)
}, props.i18n("reSelect")));
var ErrorButton = (_ref) => {
  let {
    file,
    onClick
  } = _ref;
  if (file.error) {
    return _("button", {
      className: "uppy-u-reset uppy-c-btn uppy-Dashboard-Item-errorDetails",
      "aria-label": file.error,
      "data-microtip-position": "bottom",
      "data-microtip-size": "medium",
      onClick,
      type: "button"
    }, "?");
  }
  return null;
};
function FileInfo(props) {
  const {
    file,
    i18n,
    toggleFileCard,
    metaFields,
    toggleAddFilesPanel,
    isSingleFile,
    containerHeight,
    containerWidth
  } = props;
  return _("div", {
    className: "uppy-Dashboard-Item-fileInfo",
    "data-uppy-file-source": file.source
  }, _("div", {
    className: "uppy-Dashboard-Item-fileName"
  }, renderFileName({
    file,
    isSingleFile,
    containerHeight,
    containerWidth
  }), _(ErrorButton, {
    file,
    onClick: () => alert(file.error)
  })), _("div", {
    className: "uppy-Dashboard-Item-status"
  }, renderAuthor({
    file
  }), renderFileSize({
    file
  }), ReSelectButton({
    file,
    toggleAddFilesPanel,
    i18n
  })), _(MetaErrorMessage, {
    file,
    i18n,
    toggleFileCard,
    metaFields
  }));
}

// node_modules/@uppy/dashboard/lib/components/FileItem/Buttons/index.js
var import_dist223 = __toESM(require_dist(), 1);
var import_dist224 = __toESM(require_dist2(), 1);
var import_dist225 = __toESM(require_dist3(), 1);

// node_modules/@uppy/dashboard/lib/utils/copyToClipboard.js
var import_dist220 = __toESM(require_dist(), 1);
var import_dist221 = __toESM(require_dist2(), 1);
var import_dist222 = __toESM(require_dist3(), 1);
function copyToClipboard(textToCopy, fallbackString) {
  if (fallbackString === void 0) {
    fallbackString = "Copy the URL below";
  }
  return new Promise((resolve) => {
    const textArea = document.createElement("textarea");
    textArea.setAttribute("style", {
      position: "fixed",
      top: 0,
      left: 0,
      width: "2em",
      height: "2em",
      padding: 0,
      border: "none",
      outline: "none",
      boxShadow: "none",
      background: "transparent"
    });
    textArea.value = textToCopy;
    document.body.appendChild(textArea);
    textArea.select();
    const magicCopyFailed = () => {
      document.body.removeChild(textArea);
      window.prompt(fallbackString, textToCopy);
      resolve();
    };
    try {
      const successful = document.execCommand("copy");
      if (!successful) {
        return magicCopyFailed();
      }
      document.body.removeChild(textArea);
      return resolve();
    } catch (err) {
      document.body.removeChild(textArea);
      return magicCopyFailed();
    }
  });
}

// node_modules/@uppy/dashboard/lib/components/FileItem/Buttons/index.js
function EditButton(_ref) {
  let {
    file,
    uploadInProgressOrComplete,
    metaFields,
    canEditFile,
    i18n,
    onClick
  } = _ref;
  if (!uploadInProgressOrComplete && metaFields && metaFields.length > 0 || !uploadInProgressOrComplete && canEditFile(file)) {
    return _("button", {
      className: "uppy-u-reset uppy-c-btn uppy-Dashboard-Item-action uppy-Dashboard-Item-action--edit",
      type: "button",
      "aria-label": i18n("editFileWithFilename", {
        file: file.meta.name
      }),
      title: i18n("editFileWithFilename", {
        file: file.meta.name
      }),
      onClick: () => onClick()
    }, _("svg", {
      "aria-hidden": "true",
      focusable: "false",
      className: "uppy-c-icon",
      width: "14",
      height: "14",
      viewBox: "0 0 14 14"
    }, _("g", {
      fillRule: "evenodd"
    }, _("path", {
      d: "M1.5 10.793h2.793A1 1 0 0 0 5 10.5L11.5 4a1 1 0 0 0 0-1.414L9.707.793a1 1 0 0 0-1.414 0l-6.5 6.5A1 1 0 0 0 1.5 8v2.793zm1-1V8L9 1.5l1.793 1.793-6.5 6.5H2.5z",
      fillRule: "nonzero"
    }), _("rect", {
      x: "1",
      y: "12.293",
      width: "11",
      height: "1",
      rx: ".5"
    }), _("path", {
      fillRule: "nonzero",
      d: "M6.793 2.5L9.5 5.207l.707-.707L7.5 1.793z"
    }))));
  }
  return null;
}
function RemoveButton(_ref2) {
  let {
    i18n,
    onClick,
    file
  } = _ref2;
  return _("button", {
    className: "uppy-u-reset uppy-Dashboard-Item-action uppy-Dashboard-Item-action--remove",
    type: "button",
    "aria-label": i18n("removeFile", {
      file: file.meta.name
    }),
    title: i18n("removeFile", {
      file: file.meta.name
    }),
    onClick: () => onClick()
  }, _("svg", {
    "aria-hidden": "true",
    focusable: "false",
    className: "uppy-c-icon",
    width: "18",
    height: "18",
    viewBox: "0 0 18 18"
  }, _("path", {
    d: "M9 0C4.034 0 0 4.034 0 9s4.034 9 9 9 9-4.034 9-9-4.034-9-9-9z"
  }), _("path", {
    fill: "#FFF",
    d: "M13 12.222l-.778.778L9 9.778 5.778 13 5 12.222 8.222 9 5 5.778 5.778 5 9 8.222 12.222 5l.778.778L9.778 9z"
  })));
}
function CopyLinkButton(_ref3) {
  let {
    file,
    uppy,
    i18n
  } = _ref3;
  const copyLinkToClipboard = (event) => {
    copyToClipboard(file.uploadURL, i18n("copyLinkToClipboardFallback")).then(() => {
      uppy.log("Link copied to clipboard.");
      uppy.info(i18n("copyLinkToClipboardSuccess"), "info", 3e3);
    }).catch(uppy.log).then(() => event.target.focus({
      preventScroll: true
    }));
  };
  return _("button", {
    className: "uppy-u-reset uppy-Dashboard-Item-action uppy-Dashboard-Item-action--copyLink",
    type: "button",
    "aria-label": i18n("copyLink"),
    title: i18n("copyLink"),
    onClick: (event) => copyLinkToClipboard(event)
  }, _("svg", {
    "aria-hidden": "true",
    focusable: "false",
    className: "uppy-c-icon",
    width: "14",
    height: "14",
    viewBox: "0 0 14 12"
  }, _("path", {
    d: "M7.94 7.703a2.613 2.613 0 0 1-.626 2.681l-.852.851a2.597 2.597 0 0 1-1.849.766A2.616 2.616 0 0 1 2.764 7.54l.852-.852a2.596 2.596 0 0 1 2.69-.625L5.267 7.099a1.44 1.44 0 0 0-.833.407l-.852.851a1.458 1.458 0 0 0 1.03 2.486c.39 0 .755-.152 1.03-.426l.852-.852c.231-.231.363-.522.406-.824l1.04-1.038zm4.295-5.937A2.596 2.596 0 0 0 10.387 1c-.698 0-1.355.272-1.849.766l-.852.851a2.614 2.614 0 0 0-.624 2.688l1.036-1.036c.041-.304.173-.6.407-.833l.852-.852c.275-.275.64-.426 1.03-.426a1.458 1.458 0 0 1 1.03 2.486l-.852.851a1.442 1.442 0 0 1-.824.406l-1.04 1.04a2.596 2.596 0 0 0 2.683-.628l.851-.85a2.616 2.616 0 0 0 0-3.697zm-6.88 6.883a.577.577 0 0 0 .82 0l3.474-3.474a.579.579 0 1 0-.819-.82L5.355 7.83a.579.579 0 0 0 0 .819z"
  })));
}
function Buttons(props) {
  const {
    uppy,
    file,
    uploadInProgressOrComplete,
    canEditFile,
    metaFields,
    showLinkToFileUploadResult,
    showRemoveButton,
    i18n,
    toggleFileCard,
    openFileEditor
  } = props;
  const editAction = () => {
    if (metaFields && metaFields.length > 0) {
      toggleFileCard(true, file.id);
    } else {
      openFileEditor(file);
    }
  };
  return _("div", {
    className: "uppy-Dashboard-Item-actionWrapper"
  }, _(EditButton, {
    i18n,
    file,
    uploadInProgressOrComplete,
    canEditFile,
    metaFields,
    onClick: editAction
  }), showLinkToFileUploadResult && file.uploadURL ? _(CopyLinkButton, {
    file,
    uppy,
    i18n
  }) : null, showRemoveButton ? _(RemoveButton, {
    i18n,
    file,
    onClick: () => uppy.removeFile(file.id)
  }) : null);
}

// node_modules/@uppy/dashboard/lib/components/FileItem/index.js
var FileItem = class extends x {
  componentDidMount() {
    const {
      file
    } = this.props;
    if (!file.preview) {
      this.props.handleRequestThumbnail(file);
    }
  }
  shouldComponentUpdate(nextProps) {
    return !shallowEqualObjects(this.props, nextProps);
  }
  // VirtualList mounts FileItems again and they emit `thumbnail:request`
  // Otherwise thumbnails are broken or missing after Golden Retriever restores files
  componentDidUpdate() {
    const {
      file
    } = this.props;
    if (!file.preview) {
      this.props.handleRequestThumbnail(file);
    }
  }
  componentWillUnmount() {
    const {
      file
    } = this.props;
    if (!file.preview) {
      this.props.handleCancelThumbnail(file);
    }
  }
  render() {
    const {
      file
    } = this.props;
    const isProcessing = file.progress.preprocess || file.progress.postprocess;
    const isUploaded = !!file.progress.uploadComplete && !isProcessing && !file.error;
    const uploadInProgressOrComplete = !!file.progress.uploadStarted || !!isProcessing;
    const uploadInProgress = file.progress.uploadStarted && !file.progress.uploadComplete || isProcessing;
    const error = file.error || false;
    const {
      isGhost
    } = file;
    let showRemoveButton = this.props.individualCancellation ? !isUploaded : !uploadInProgress && !isUploaded;
    if (isUploaded && this.props.showRemoveButtonAfterComplete) {
      showRemoveButton = true;
    }
    const dashboardItemClass = (0, import_classnames6.default)({
      "uppy-Dashboard-Item": true,
      "is-inprogress": uploadInProgress && !this.props.recoveredState,
      "is-processing": isProcessing,
      "is-complete": isUploaded,
      "is-error": !!error,
      "is-resumable": this.props.resumableUploads,
      "is-noIndividualCancellation": !this.props.individualCancellation,
      "is-ghost": isGhost
    });
    return _("div", {
      className: dashboardItemClass,
      id: `uppy_${file.id}`,
      role: this.props.role
    }, _("div", {
      className: "uppy-Dashboard-Item-preview"
    }, _(FilePreviewAndLink, {
      file,
      showLinkToFileUploadResult: this.props.showLinkToFileUploadResult,
      i18n: this.props.i18n,
      toggleFileCard: this.props.toggleFileCard,
      metaFields: this.props.metaFields
    }), _(FileProgress, {
      uppy: this.props.uppy,
      file,
      error,
      isUploaded,
      hideRetryButton: this.props.hideRetryButton,
      hideCancelButton: this.props.hideCancelButton,
      hidePauseResumeButton: this.props.hidePauseResumeButton,
      recoveredState: this.props.recoveredState,
      resumableUploads: this.props.resumableUploads,
      individualCancellation: this.props.individualCancellation,
      i18n: this.props.i18n
    })), _("div", {
      className: "uppy-Dashboard-Item-fileInfoAndButtons"
    }, _(FileInfo, {
      file,
      containerWidth: this.props.containerWidth,
      containerHeight: this.props.containerHeight,
      i18n: this.props.i18n,
      toggleAddFilesPanel: this.props.toggleAddFilesPanel,
      toggleFileCard: this.props.toggleFileCard,
      metaFields: this.props.metaFields,
      isSingleFile: this.props.isSingleFile
    }), _(Buttons, {
      file,
      metaFields: this.props.metaFields,
      showLinkToFileUploadResult: this.props.showLinkToFileUploadResult,
      showRemoveButton,
      canEditFile: this.props.canEditFile,
      uploadInProgressOrComplete,
      toggleFileCard: this.props.toggleFileCard,
      openFileEditor: this.props.openFileEditor,
      uppy: this.props.uppy,
      i18n: this.props.i18n
    })));
  }
};

// node_modules/@uppy/dashboard/lib/components/FileList.js
function chunks(list, size) {
  const chunked = [];
  let currentChunk = [];
  list.forEach((item) => {
    if (currentChunk.length < size) {
      currentChunk.push(item);
    } else {
      chunked.push(currentChunk);
      currentChunk = [item];
    }
  });
  if (currentChunk.length) chunked.push(currentChunk);
  return chunked;
}
function FileList(_ref) {
  let {
    id: id3,
    i18n,
    uppy,
    files,
    resumableUploads,
    hideRetryButton,
    hidePauseResumeButton,
    hideCancelButton,
    showLinkToFileUploadResult,
    showRemoveButtonAfterComplete,
    metaFields,
    isSingleFile,
    toggleFileCard,
    handleRequestThumbnail,
    handleCancelThumbnail,
    recoveredState,
    individualCancellation,
    itemsPerRow,
    openFileEditor,
    canEditFile,
    toggleAddFilesPanel,
    containerWidth,
    containerHeight
  } = _ref;
  const rowHeight = itemsPerRow === 1 ? (
    // Mobile
    71
  ) : 200;
  const rows = T2(() => {
    const sortByGhostComesFirst = (file1, file2) => Number(files[file2].isGhost) - Number(files[file1].isGhost);
    const fileIds = Object.keys(files);
    if (recoveredState) fileIds.sort(sortByGhostComesFirst);
    return chunks(fileIds, itemsPerRow);
  }, [files, itemsPerRow, recoveredState]);
  const renderRow = (row) => _("div", {
    class: "uppy-Dashboard-filesInner",
    role: "presentation",
    key: row[0]
  }, row.map((fileID) => _(FileItem, {
    key: fileID,
    uppy,
    id: id3,
    i18n,
    resumableUploads,
    individualCancellation,
    hideRetryButton,
    hidePauseResumeButton,
    hideCancelButton,
    showLinkToFileUploadResult,
    showRemoveButtonAfterComplete,
    metaFields,
    recoveredState,
    isSingleFile,
    containerWidth,
    containerHeight,
    toggleFileCard,
    handleRequestThumbnail,
    handleCancelThumbnail,
    role: "listitem",
    openFileEditor,
    canEditFile,
    toggleAddFilesPanel,
    file: files[fileID]
  })));
  if (isSingleFile) {
    return _("div", {
      class: "uppy-Dashboard-files"
    }, renderRow(rows[0]));
  }
  return _(VirtualList_default, {
    class: "uppy-Dashboard-files",
    role: "list",
    data: rows,
    renderRow,
    rowHeight
  });
}

// node_modules/@uppy/dashboard/lib/components/AddFiles.js
var import_dist232 = __toESM(require_dist(), 1);
var import_dist233 = __toESM(require_dist2(), 1);
var import_dist234 = __toESM(require_dist3(), 1);
var AddFiles = class extends x {
  constructor() {
    super(...arguments);
    this.fileInput = null;
    this.folderInput = null;
    this.mobilePhotoFileInput = null;
    this.mobileVideoFileInput = null;
    this.triggerFileInputClick = () => {
      var _this$fileInput;
      (_this$fileInput = this.fileInput) == null || _this$fileInput.click();
    };
    this.triggerFolderInputClick = () => {
      var _this$folderInput;
      (_this$folderInput = this.folderInput) == null || _this$folderInput.click();
    };
    this.triggerVideoCameraInputClick = () => {
      var _this$mobileVideoFile;
      (_this$mobileVideoFile = this.mobileVideoFileInput) == null || _this$mobileVideoFile.click();
    };
    this.triggerPhotoCameraInputClick = () => {
      var _this$mobilePhotoFile;
      (_this$mobilePhotoFile = this.mobilePhotoFileInput) == null || _this$mobilePhotoFile.click();
    };
    this.onFileInputChange = (event) => {
      this.props.handleInputChange(event);
      event.currentTarget.value = "";
    };
    this.renderHiddenInput = (isFolder, refCallback) => {
      var _this$props$allowedFi;
      return _("input", {
        className: "uppy-Dashboard-input",
        hidden: true,
        "aria-hidden": "true",
        tabIndex: -1,
        webkitdirectory: isFolder,
        type: "file",
        name: "files[]",
        multiple: this.props.maxNumberOfFiles !== 1,
        onChange: this.onFileInputChange,
        accept: (_this$props$allowedFi = this.props.allowedFileTypes) == null ? void 0 : _this$props$allowedFi.join(", "),
        ref: refCallback
      });
    };
    this.renderHiddenCameraInput = (type, nativeCameraFacingMode, refCallback) => {
      const typeToAccept = {
        photo: "image/*",
        video: "video/*"
      };
      const accept = typeToAccept[type];
      return _("input", {
        className: "uppy-Dashboard-input",
        hidden: true,
        "aria-hidden": "true",
        tabIndex: -1,
        type: "file",
        name: `camera-${type}`,
        onChange: this.onFileInputChange,
        capture: nativeCameraFacingMode,
        accept,
        ref: refCallback
      });
    };
    this.renderMyDeviceAcquirer = () => {
      return _("div", {
        className: "uppy-DashboardTab",
        role: "presentation",
        "data-uppy-acquirer-id": "MyDevice"
      }, _("button", {
        type: "button",
        className: "uppy-u-reset uppy-c-btn uppy-DashboardTab-btn",
        role: "tab",
        tabIndex: 0,
        "data-uppy-super-focusable": true,
        onClick: this.triggerFileInputClick
      }, _("div", {
        className: "uppy-DashboardTab-inner"
      }, _("svg", {
        className: "uppy-DashboardTab-iconMyDevice",
        "aria-hidden": "true",
        focusable: "false",
        width: "32",
        height: "32",
        viewBox: "0 0 32 32"
      }, _("path", {
        d: "M8.45 22.087l-1.305-6.674h17.678l-1.572 6.674H8.45zm4.975-12.412l1.083 1.765a.823.823 0 00.715.386h7.951V13.5H8.587V9.675h4.838zM26.043 13.5h-1.195v-2.598c0-.463-.336-.75-.798-.75h-8.356l-1.082-1.766A.823.823 0 0013.897 8H7.728c-.462 0-.815.256-.815.718V13.5h-.956a.97.97 0 00-.746.37.972.972 0 00-.19.81l1.724 8.565c.095.44.484.755.933.755H24c.44 0 .824-.3.929-.727l2.043-8.568a.972.972 0 00-.176-.825.967.967 0 00-.753-.38z",
        fill: "currentcolor",
        "fill-rule": "evenodd"
      }))), _("div", {
        className: "uppy-DashboardTab-name"
      }, this.props.i18n("myDevice"))));
    };
    this.renderPhotoCamera = () => {
      return _("div", {
        className: "uppy-DashboardTab",
        role: "presentation",
        "data-uppy-acquirer-id": "MobilePhotoCamera"
      }, _("button", {
        type: "button",
        className: "uppy-u-reset uppy-c-btn uppy-DashboardTab-btn",
        role: "tab",
        tabIndex: 0,
        "data-uppy-super-focusable": true,
        onClick: this.triggerPhotoCameraInputClick
      }, _("div", {
        className: "uppy-DashboardTab-inner"
      }, _("svg", {
        "aria-hidden": "true",
        focusable: "false",
        width: "32",
        height: "32",
        viewBox: "0 0 32 32"
      }, _("path", {
        d: "M23.5 9.5c1.417 0 2.5 1.083 2.5 2.5v9.167c0 1.416-1.083 2.5-2.5 2.5h-15c-1.417 0-2.5-1.084-2.5-2.5V12c0-1.417 1.083-2.5 2.5-2.5h2.917l1.416-2.167C13 7.167 13.25 7 13.5 7h5c.25 0 .5.167.667.333L20.583 9.5H23.5zM16 11.417a4.706 4.706 0 00-4.75 4.75 4.704 4.704 0 004.75 4.75 4.703 4.703 0 004.75-4.75c0-2.663-2.09-4.75-4.75-4.75zm0 7.825c-1.744 0-3.076-1.332-3.076-3.074 0-1.745 1.333-3.077 3.076-3.077 1.744 0 3.074 1.333 3.074 3.076s-1.33 3.075-3.074 3.075z",
        fill: "#02B383",
        "fill-rule": "nonzero"
      }))), _("div", {
        className: "uppy-DashboardTab-name"
      }, this.props.i18n("takePictureBtn"))));
    };
    this.renderVideoCamera = () => {
      return _("div", {
        className: "uppy-DashboardTab",
        role: "presentation",
        "data-uppy-acquirer-id": "MobileVideoCamera"
      }, _("button", {
        type: "button",
        className: "uppy-u-reset uppy-c-btn uppy-DashboardTab-btn",
        role: "tab",
        tabIndex: 0,
        "data-uppy-super-focusable": true,
        onClick: this.triggerVideoCameraInputClick
      }, _("div", {
        className: "uppy-DashboardTab-inner"
      }, _("svg", {
        "aria-hidden": "true",
        width: "32",
        height: "32",
        viewBox: "0 0 32 32"
      }, _("path", {
        fill: "#FF675E",
        fillRule: "nonzero",
        d: "m21.254 14.277 2.941-2.588c.797-.313 1.243.818 1.09 1.554-.01 2.094.02 4.189-.017 6.282-.126.915-1.145 1.08-1.58.34l-2.434-2.142c-.192.287-.504 1.305-.738.468-.104-1.293-.028-2.596-.05-3.894.047-.312.381.823.426 1.069.063-.384.206-.744.362-1.09zm-12.939-3.73c3.858.013 7.717-.025 11.574.02.912.129 1.492 1.237 1.351 2.217-.019 2.412.04 4.83-.03 7.239-.17 1.025-1.166 1.59-2.029 1.429-3.705-.012-7.41.025-11.114-.019-.913-.129-1.492-1.237-1.352-2.217.018-2.404-.036-4.813.029-7.214.136-.82.83-1.473 1.571-1.454z "
      }))), _("div", {
        className: "uppy-DashboardTab-name"
      }, this.props.i18n("recordVideoBtn"))));
    };
    this.renderBrowseButton = (text, onClickFn) => {
      const numberOfAcquirers = this.props.acquirers.length;
      return _("button", {
        type: "button",
        className: "uppy-u-reset uppy-c-btn uppy-Dashboard-browse",
        onClick: onClickFn,
        "data-uppy-super-focusable": numberOfAcquirers === 0
      }, text);
    };
    this.renderDropPasteBrowseTagline = (numberOfAcquirers) => {
      const browseFiles = this.renderBrowseButton(this.props.i18n("browseFiles"), this.triggerFileInputClick);
      const browseFolders = this.renderBrowseButton(this.props.i18n("browseFolders"), this.triggerFolderInputClick);
      const lowerFMSelectionType = this.props.fileManagerSelectionType;
      const camelFMSelectionType = lowerFMSelectionType.charAt(0).toUpperCase() + lowerFMSelectionType.slice(1);
      return _(
        "div",
        {
          class: "uppy-Dashboard-AddFiles-title"
        },
        // eslint-disable-next-line no-nested-ternary
        this.props.disableLocalFiles ? this.props.i18n("importFiles") : numberOfAcquirers > 0 ? this.props.i18nArray(`dropPasteImport${camelFMSelectionType}`, {
          browseFiles,
          browseFolders,
          browse: browseFiles
        }) : this.props.i18nArray(`dropPaste${camelFMSelectionType}`, {
          browseFiles,
          browseFolders,
          browse: browseFiles
        })
      );
    };
    this.renderAcquirer = (acquirer) => {
      var _this$props$activePic;
      return _("div", {
        className: "uppy-DashboardTab",
        role: "presentation",
        "data-uppy-acquirer-id": acquirer.id
      }, _("button", {
        type: "button",
        className: "uppy-u-reset uppy-c-btn uppy-DashboardTab-btn",
        role: "tab",
        tabIndex: 0,
        "data-cy": acquirer.id,
        "aria-controls": `uppy-DashboardContent-panel--${acquirer.id}`,
        "aria-selected": ((_this$props$activePic = this.props.activePickerPanel) == null ? void 0 : _this$props$activePic.id) === acquirer.id,
        "data-uppy-super-focusable": true,
        onClick: () => this.props.showPanel(acquirer.id)
      }, _("div", {
        className: "uppy-DashboardTab-inner"
      }, acquirer.icon()), _("div", {
        className: "uppy-DashboardTab-name"
      }, acquirer.name)));
    };
    this.renderAcquirers = (acquirers) => {
      const acquirersWithoutLastTwo = [...acquirers];
      const lastTwoAcquirers = acquirersWithoutLastTwo.splice(acquirers.length - 2, acquirers.length);
      return _(k, null, acquirersWithoutLastTwo.map((acquirer) => this.renderAcquirer(acquirer)), _("span", {
        role: "presentation",
        style: {
          "white-space": "nowrap"
        }
      }, lastTwoAcquirers.map((acquirer) => this.renderAcquirer(acquirer))));
    };
    this.renderSourcesList = (acquirers, disableLocalFiles) => {
      const {
        showNativePhotoCameraButton,
        showNativeVideoCameraButton
      } = this.props;
      let list = [];
      const myDeviceKey = "myDevice";
      if (!disableLocalFiles) list.push({
        key: myDeviceKey,
        elements: this.renderMyDeviceAcquirer()
      });
      if (showNativePhotoCameraButton) list.push({
        key: "nativePhotoCameraButton",
        elements: this.renderPhotoCamera()
      });
      if (showNativeVideoCameraButton) list.push({
        key: "nativePhotoCameraButton",
        elements: this.renderVideoCamera()
      });
      list.push(...acquirers.map((acquirer) => ({
        key: acquirer.id,
        elements: this.renderAcquirer(acquirer)
      })));
      const hasOnlyMyDevice = list.length === 1 && list[0].key === myDeviceKey;
      if (hasOnlyMyDevice) list = [];
      const listWithoutLastTwo = [...list];
      const lastTwo = listWithoutLastTwo.splice(list.length - 2, list.length);
      return _(k, null, this.renderDropPasteBrowseTagline(list.length), _("div", {
        className: "uppy-Dashboard-AddFiles-list",
        role: "tablist"
      }, listWithoutLastTwo.map((_ref) => {
        let {
          key,
          elements
        } = _ref;
        return _(k, {
          key
        }, elements);
      }), _("span", {
        role: "presentation",
        style: {
          "white-space": "nowrap"
        }
      }, lastTwo.map((_ref2) => {
        let {
          key,
          elements
        } = _ref2;
        return _(k, {
          key
        }, elements);
      }))));
    };
  }
  [Symbol.for("uppy test: disable unused locale key warning")]() {
    this.props.i18nArray("dropPasteBoth");
    this.props.i18nArray("dropPasteFiles");
    this.props.i18nArray("dropPasteFolders");
    this.props.i18nArray("dropPasteImportBoth");
    this.props.i18nArray("dropPasteImportFiles");
    this.props.i18nArray("dropPasteImportFolders");
  }
  renderPoweredByUppy() {
    const {
      i18nArray
    } = this.props;
    const uppyBranding = _("span", null, _("svg", {
      "aria-hidden": "true",
      focusable: "false",
      className: "uppy-c-icon uppy-Dashboard-poweredByIcon",
      width: "11",
      height: "11",
      viewBox: "0 0 11 11"
    }, _("path", {
      d: "M7.365 10.5l-.01-4.045h2.612L5.5.806l-4.467 5.65h2.604l.01 4.044h3.718z",
      fillRule: "evenodd"
    })), _("span", {
      className: "uppy-Dashboard-poweredByUppy"
    }, "Uppy"));
    const linkText = i18nArray("poweredBy", {
      uppy: uppyBranding
    });
    return _("a", {
      tabIndex: -1,
      href: "https://uppy.io",
      rel: "noreferrer noopener",
      target: "_blank",
      className: "uppy-Dashboard-poweredBy"
    }, linkText);
  }
  render() {
    const {
      showNativePhotoCameraButton,
      showNativeVideoCameraButton,
      nativeCameraFacingMode
    } = this.props;
    return _("div", {
      className: "uppy-Dashboard-AddFiles"
    }, this.renderHiddenInput(false, (ref) => {
      this.fileInput = ref;
    }), this.renderHiddenInput(true, (ref) => {
      this.folderInput = ref;
    }), showNativePhotoCameraButton && this.renderHiddenCameraInput("photo", nativeCameraFacingMode, (ref) => {
      this.mobilePhotoFileInput = ref;
    }), showNativeVideoCameraButton && this.renderHiddenCameraInput("video", nativeCameraFacingMode, (ref) => {
      this.mobileVideoFileInput = ref;
    }), this.renderSourcesList(this.props.acquirers, this.props.disableLocalFiles), _("div", {
      className: "uppy-Dashboard-AddFiles-info"
    }, this.props.note && _("div", {
      className: "uppy-Dashboard-note"
    }, this.props.note), this.props.proudlyDisplayPoweredByUppy && this.renderPoweredByUppy()));
  }
};
var AddFiles_default = AddFiles;

// node_modules/@uppy/dashboard/lib/components/AddFilesPanel.js
var import_dist235 = __toESM(require_dist(), 1);
var import_dist236 = __toESM(require_dist2(), 1);
var import_dist237 = __toESM(require_dist3(), 1);
var import_classnames7 = __toESM(require_classnames(), 1);
var AddFilesPanel = (props) => {
  return _("div", {
    className: (0, import_classnames7.default)("uppy-Dashboard-AddFilesPanel", props.className),
    "data-uppy-panelType": "AddFiles",
    "aria-hidden": !props.showAddFilesPanel
  }, _("div", {
    className: "uppy-DashboardContent-bar"
  }, _("div", {
    className: "uppy-DashboardContent-title",
    role: "heading",
    "aria-level": "1"
  }, props.i18n("addingMoreFiles")), _("button", {
    className: "uppy-DashboardContent-back",
    type: "button",
    onClick: () => props.toggleAddFilesPanel(false)
  }, props.i18n("back"))), _(AddFiles_default, props));
};
var AddFilesPanel_default = AddFilesPanel;

// node_modules/@uppy/dashboard/lib/components/PickerPanelContent.js
var import_dist241 = __toESM(require_dist(), 1);
var import_dist242 = __toESM(require_dist2(), 1);
var import_dist243 = __toESM(require_dist3(), 1);
var import_classnames8 = __toESM(require_classnames(), 1);

// node_modules/@uppy/dashboard/lib/utils/ignoreEvent.js
var import_dist238 = __toESM(require_dist(), 1);
var import_dist239 = __toESM(require_dist2(), 1);
var import_dist240 = __toESM(require_dist3(), 1);
function ignoreEvent(ev) {
  const {
    tagName
  } = ev.target;
  if (tagName === "INPUT" || tagName === "TEXTAREA") {
    ev.stopPropagation();
    return;
  }
  ev.preventDefault();
  ev.stopPropagation();
}
var ignoreEvent_default = ignoreEvent;

// node_modules/@uppy/dashboard/lib/components/PickerPanelContent.js
function PickerPanelContent(_ref) {
  let {
    activePickerPanel,
    className,
    hideAllPanels,
    i18n,
    state,
    uppy
  } = _ref;
  const ref = A2(null);
  return _("div", {
    className: (0, import_classnames8.default)("uppy-DashboardContent-panel", className),
    role: "tabpanel",
    "data-uppy-panelType": "PickerPanel",
    id: `uppy-DashboardContent-panel--${activePickerPanel.id}`,
    onDragOver: ignoreEvent_default,
    onDragLeave: ignoreEvent_default,
    onDrop: ignoreEvent_default,
    onPaste: ignoreEvent_default
  }, _("div", {
    className: "uppy-DashboardContent-bar"
  }, _("div", {
    className: "uppy-DashboardContent-title",
    role: "heading",
    "aria-level": "1"
  }, i18n("importFrom", {
    name: activePickerPanel.name
  })), _("button", {
    className: "uppy-DashboardContent-back",
    type: "button",
    onClick: hideAllPanels
  }, i18n("cancel"))), _("div", {
    ref,
    className: "uppy-DashboardContent-panelBody"
  }, uppy.getPlugin(activePickerPanel.id).render(state, ref.current)));
}
var PickerPanelContent_default = PickerPanelContent;

// node_modules/@uppy/dashboard/lib/components/EditorPanel.js
var import_dist244 = __toESM(require_dist(), 1);
var import_dist245 = __toESM(require_dist2(), 1);
var import_dist246 = __toESM(require_dist3(), 1);
var import_classnames9 = __toESM(require_classnames(), 1);
function EditorPanel(props) {
  const file = props.files[props.fileCardFor];
  const handleCancel = () => {
    props.uppy.emit("file-editor:cancel", file);
    props.closeFileEditor();
  };
  return _("div", {
    className: (0, import_classnames9.default)("uppy-DashboardContent-panel", props.className),
    role: "tabpanel",
    "data-uppy-panelType": "FileEditor",
    id: "uppy-DashboardContent-panel--editor"
  }, _("div", {
    className: "uppy-DashboardContent-bar"
  }, _("div", {
    className: "uppy-DashboardContent-title",
    role: "heading",
    "aria-level": "1"
  }, props.i18nArray("editing", {
    file: _("span", {
      className: "uppy-DashboardContent-titleFile"
    }, file.meta ? file.meta.name : file.name)
  })), _("button", {
    className: "uppy-DashboardContent-back",
    type: "button",
    onClick: handleCancel
  }, props.i18n("cancel")), _("button", {
    className: "uppy-DashboardContent-save",
    type: "button",
    onClick: props.saveFileEditor
  }, props.i18n("save"))), _("div", {
    className: "uppy-DashboardContent-panelBody"
  }, props.editors.map((target) => {
    return props.uppy.getPlugin(target.id).render(props.state);
  })));
}
var EditorPanel_default = EditorPanel;

// node_modules/@uppy/dashboard/lib/components/PickerPanelTopBar.js
var import_dist247 = __toESM(require_dist(), 1);
var import_dist248 = __toESM(require_dist2(), 1);
var import_dist249 = __toESM(require_dist3(), 1);
var uploadStates = {
  STATE_ERROR: "error",
  STATE_WAITING: "waiting",
  STATE_PREPROCESSING: "preprocessing",
  STATE_UPLOADING: "uploading",
  STATE_POSTPROCESSING: "postprocessing",
  STATE_COMPLETE: "complete",
  STATE_PAUSED: "paused"
};
function getUploadingState(isAllErrored, isAllComplete, isAllPaused, files) {
  if (files === void 0) {
    files = {};
  }
  if (isAllErrored) {
    return uploadStates.STATE_ERROR;
  }
  if (isAllComplete) {
    return uploadStates.STATE_COMPLETE;
  }
  if (isAllPaused) {
    return uploadStates.STATE_PAUSED;
  }
  let state = uploadStates.STATE_WAITING;
  const fileIDs = Object.keys(files);
  for (let i3 = 0; i3 < fileIDs.length; i3++) {
    const {
      progress
    } = files[fileIDs[i3]];
    if (progress.uploadStarted && !progress.uploadComplete) {
      return uploadStates.STATE_UPLOADING;
    }
    if (progress.preprocess && state !== uploadStates.STATE_UPLOADING) {
      state = uploadStates.STATE_PREPROCESSING;
    }
    if (progress.postprocess && state !== uploadStates.STATE_UPLOADING && state !== uploadStates.STATE_PREPROCESSING) {
      state = uploadStates.STATE_POSTPROCESSING;
    }
  }
  return state;
}
function UploadStatus(_ref) {
  let {
    files,
    i18n,
    isAllComplete,
    isAllErrored,
    isAllPaused,
    inProgressNotPausedFiles,
    newFiles,
    processingFiles
  } = _ref;
  const uploadingState = getUploadingState(isAllErrored, isAllComplete, isAllPaused, files);
  switch (uploadingState) {
    case "uploading":
      return i18n("uploadingXFiles", {
        smart_count: inProgressNotPausedFiles.length
      });
    case "preprocessing":
    case "postprocessing":
      return i18n("processingXFiles", {
        smart_count: processingFiles.length
      });
    case "paused":
      return i18n("uploadPaused");
    case "waiting":
      return i18n("xFilesSelected", {
        smart_count: newFiles.length
      });
    case "complete":
      return i18n("uploadComplete");
    case "error":
      return i18n("error");
    default:
  }
}
function PanelTopBar(props) {
  const {
    i18n,
    isAllComplete,
    hideCancelButton,
    maxNumberOfFiles,
    toggleAddFilesPanel,
    uppy
  } = props;
  let {
    allowNewUpload
  } = props;
  if (allowNewUpload && maxNumberOfFiles) {
    allowNewUpload = props.totalFileCount < props.maxNumberOfFiles;
  }
  return _("div", {
    className: "uppy-DashboardContent-bar"
  }, !isAllComplete && !hideCancelButton ? _("button", {
    className: "uppy-DashboardContent-back",
    type: "button",
    onClick: () => uppy.cancelAll()
  }, i18n("cancel")) : _("div", null), _("div", {
    className: "uppy-DashboardContent-title",
    role: "heading",
    "aria-level": "1"
  }, _(UploadStatus, props)), allowNewUpload ? _("button", {
    className: "uppy-DashboardContent-addMore",
    type: "button",
    "aria-label": i18n("addMoreFiles"),
    title: i18n("addMoreFiles"),
    onClick: () => toggleAddFilesPanel(true)
  }, _("svg", {
    "aria-hidden": "true",
    focusable: "false",
    className: "uppy-c-icon",
    width: "15",
    height: "15",
    viewBox: "0 0 15 15"
  }, _("path", {
    d: "M8 6.5h6a.5.5 0 0 1 .5.5v.5a.5.5 0 0 1-.5.5H8v6a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V8h-6a.5.5 0 0 1-.5-.5V7a.5.5 0 0 1 .5-.5h6v-6A.5.5 0 0 1 7 0h.5a.5.5 0 0 1 .5.5v6z"
  })), _("span", {
    className: "uppy-DashboardContent-addMoreCaption"
  }, i18n("addMore"))) : _("div", null));
}
var PickerPanelTopBar_default = PanelTopBar;

// node_modules/@uppy/dashboard/lib/components/FileCard/index.js
var import_dist253 = __toESM(require_dist(), 1);
var import_dist254 = __toESM(require_dist2(), 1);
var import_dist255 = __toESM(require_dist3(), 1);
var import_classnames10 = __toESM(require_classnames(), 1);

// node_modules/@uppy/dashboard/lib/components/FileCard/RenderMetaFields.js
var import_dist250 = __toESM(require_dist(), 1);
var import_dist251 = __toESM(require_dist2(), 1);
var import_dist252 = __toESM(require_dist3(), 1);
function RenderMetaFields(props) {
  const {
    computedMetaFields,
    requiredMetaFields,
    updateMeta,
    form,
    formState
  } = props;
  const fieldCSSClasses = {
    text: "uppy-u-reset uppy-c-textInput uppy-Dashboard-FileCard-input"
  };
  return computedMetaFields.map((field) => {
    const id3 = `uppy-Dashboard-FileCard-input-${field.id}`;
    const required = requiredMetaFields.includes(field.id);
    return _("fieldset", {
      key: field.id,
      className: "uppy-Dashboard-FileCard-fieldset"
    }, _("label", {
      className: "uppy-Dashboard-FileCard-label",
      htmlFor: id3
    }, field.name), field.render !== void 0 ? field.render({
      value: formState[field.id],
      onChange: (newVal) => updateMeta(newVal, field.id),
      fieldCSSClasses,
      required,
      form: form.id
    }, _) : _("input", {
      className: fieldCSSClasses.text,
      id: id3,
      form: form.id,
      type: field.type || "text",
      required,
      value: formState[field.id],
      placeholder: field.placeholder,
      onInput: (ev) => updateMeta(ev.target.value, field.id),
      "data-uppy-super-focusable": true
    }));
  });
}

// node_modules/@uppy/dashboard/lib/components/FileCard/index.js
function FileCard(props) {
  var _getMetaFields;
  const {
    files,
    fileCardFor,
    toggleFileCard,
    saveFileCard,
    metaFields,
    requiredMetaFields,
    openFileEditor,
    i18n,
    i18nArray,
    className,
    canEditFile
  } = props;
  const getMetaFields = () => {
    return typeof metaFields === "function" ? metaFields(files[fileCardFor]) : metaFields;
  };
  const file = files[fileCardFor];
  const computedMetaFields = (_getMetaFields = getMetaFields()) != null ? _getMetaFields : [];
  const showEditButton = canEditFile(file);
  const storedMetaData = {};
  computedMetaFields.forEach((field) => {
    var _file$meta$field$id;
    storedMetaData[field.id] = (_file$meta$field$id = file.meta[field.id]) != null ? _file$meta$field$id : "";
  });
  const [formState, setFormState] = d2(storedMetaData);
  const handleSave = q2((ev) => {
    ev.preventDefault();
    saveFileCard(formState, fileCardFor);
  }, [saveFileCard, formState, fileCardFor]);
  const updateMeta = (newVal, name) => {
    setFormState({
      ...formState,
      [name]: newVal
    });
  };
  const handleCancel = () => {
    toggleFileCard(false);
  };
  const [form] = d2(() => {
    const formEl = document.createElement("form");
    formEl.setAttribute("tabindex", "-1");
    formEl.id = nanoid2();
    return formEl;
  });
  y2(() => {
    document.body.appendChild(form);
    form.addEventListener("submit", handleSave);
    return () => {
      form.removeEventListener("submit", handleSave);
      document.body.removeChild(form);
    };
  }, [form, handleSave]);
  return _("div", {
    className: (0, import_classnames10.default)("uppy-Dashboard-FileCard", className),
    "data-uppy-panelType": "FileCard",
    onDragOver: ignoreEvent_default,
    onDragLeave: ignoreEvent_default,
    onDrop: ignoreEvent_default,
    onPaste: ignoreEvent_default
  }, _("div", {
    className: "uppy-DashboardContent-bar"
  }, _("div", {
    className: "uppy-DashboardContent-title",
    role: "heading",
    "aria-level": "1"
  }, i18nArray("editing", {
    file: _("span", {
      className: "uppy-DashboardContent-titleFile"
    }, file.meta ? file.meta.name : file.name)
  })), _("button", {
    className: "uppy-DashboardContent-back",
    type: "button",
    form: form.id,
    title: i18n("finishEditingFile"),
    onClick: handleCancel
  }, i18n("cancel"))), _("div", {
    className: "uppy-Dashboard-FileCard-inner"
  }, _("div", {
    className: "uppy-Dashboard-FileCard-preview",
    style: {
      backgroundColor: getIconByMime(file.type).color
    }
  }, _(FilePreview, {
    file
  }), showEditButton && _("button", {
    type: "button",
    className: "uppy-u-reset uppy-c-btn uppy-Dashboard-FileCard-edit",
    onClick: (event) => {
      handleSave(event);
      openFileEditor(file);
    }
  }, i18n("editImage"))), _("div", {
    className: "uppy-Dashboard-FileCard-info"
  }, _(RenderMetaFields, {
    computedMetaFields,
    requiredMetaFields,
    updateMeta,
    form,
    formState
  })), _("div", {
    className: "uppy-Dashboard-FileCard-actions"
  }, _("button", {
    className: "uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Dashboard-FileCard-actionsBtn",
    type: "submit",
    form: form.id
  }, i18n("saveChanges")), _("button", {
    className: "uppy-u-reset uppy-c-btn uppy-c-btn-link uppy-Dashboard-FileCard-actionsBtn",
    type: "button",
    onClick: handleCancel,
    form: form.id
  }, i18n("cancel")))));
}

// node_modules/@uppy/dashboard/lib/components/Slide.js
var import_dist256 = __toESM(require_dist(), 1);
var import_dist257 = __toESM(require_dist2(), 1);
var import_dist258 = __toESM(require_dist3(), 1);
var import_classnames11 = __toESM(require_classnames(), 1);
var transitionName = "uppy-transition-slideDownUp";
var duration = 250;
function Slide(_ref) {
  let {
    children
  } = _ref;
  const [cachedChildren, setCachedChildren] = d2(null);
  const [className, setClassName] = d2("");
  const enterTimeoutRef = A2();
  const leaveTimeoutRef = A2();
  const animationFrameRef = A2();
  const handleEnterTransition = () => {
    setClassName(`${transitionName}-enter`);
    cancelAnimationFrame(animationFrameRef.current);
    clearTimeout(leaveTimeoutRef.current);
    leaveTimeoutRef.current = void 0;
    animationFrameRef.current = requestAnimationFrame(() => {
      setClassName(`${transitionName}-enter ${transitionName}-enter-active`);
      enterTimeoutRef.current = setTimeout(() => {
        setClassName("");
      }, duration);
    });
  };
  const handleLeaveTransition = () => {
    setClassName(`${transitionName}-leave`);
    cancelAnimationFrame(animationFrameRef.current);
    clearTimeout(enterTimeoutRef.current);
    enterTimeoutRef.current = void 0;
    animationFrameRef.current = requestAnimationFrame(() => {
      setClassName(`${transitionName}-leave ${transitionName}-leave-active`);
      leaveTimeoutRef.current = setTimeout(() => {
        setCachedChildren(null);
        setClassName("");
      }, duration);
    });
  };
  y2(() => {
    const child = H(children)[0];
    if (cachedChildren === child) return;
    if (child && !cachedChildren) {
      handleEnterTransition();
    } else if (cachedChildren && !child && !leaveTimeoutRef.current) {
      handleLeaveTransition();
    }
    setCachedChildren(child);
  }, [children, cachedChildren]);
  y2(() => {
    return () => {
      clearTimeout(enterTimeoutRef.current);
      clearTimeout(leaveTimeoutRef.current);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);
  if (!cachedChildren) return null;
  return J(cachedChildren, {
    className: (0, import_classnames11.default)(className, cachedChildren.props.className)
  });
}
var Slide_default = Slide;

// node_modules/@uppy/dashboard/lib/components/Dashboard.js
function _extends2() {
  return _extends2 = Object.assign ? Object.assign.bind() : function(n2) {
    for (var e3 = 1; e3 < arguments.length; e3++) {
      var t3 = arguments[e3];
      for (var r3 in t3) ({}).hasOwnProperty.call(t3, r3) && (n2[r3] = t3[r3]);
    }
    return n2;
  }, _extends2.apply(null, arguments);
}
var WIDTH_XL = 900;
var WIDTH_LG = 700;
var WIDTH_MD = 576;
var HEIGHT_MD = 330;
function Dashboard(props) {
  const isNoFiles = props.totalFileCount === 0;
  const isSingleFile = props.totalFileCount === 1;
  const isSizeMD = props.containerWidth > WIDTH_MD;
  const isSizeHeightMD = props.containerHeight > HEIGHT_MD;
  const dashboardClassName = (0, import_classnames12.default)({
    "uppy-Dashboard": true,
    "uppy-Dashboard--isDisabled": props.disabled,
    "uppy-Dashboard--animateOpenClose": props.animateOpenClose,
    "uppy-Dashboard--isClosing": props.isClosing,
    "uppy-Dashboard--isDraggingOver": props.isDraggingOver,
    "uppy-Dashboard--modal": !props.inline,
    "uppy-size--md": props.containerWidth > WIDTH_MD,
    "uppy-size--lg": props.containerWidth > WIDTH_LG,
    "uppy-size--xl": props.containerWidth > WIDTH_XL,
    "uppy-size--height-md": props.containerHeight > HEIGHT_MD,
    // We might want to enable this in the future
    // 'uppy-size--height-lg': props.containerHeight > HEIGHT_LG,
    // 'uppy-size--height-xl': props.containerHeight > HEIGHT_XL,
    "uppy-Dashboard--isAddFilesPanelVisible": props.showAddFilesPanel,
    "uppy-Dashboard--isInnerWrapVisible": props.areInsidesReadyToBeVisible,
    // Only enable “centered single file” mode when Dashboard is tall enough
    "uppy-Dashboard--singleFile": props.singleFileFullScreen && isSingleFile && isSizeHeightMD
  });
  let itemsPerRow = 1;
  if (props.containerWidth > WIDTH_XL) {
    itemsPerRow = 5;
  } else if (props.containerWidth > WIDTH_LG) {
    itemsPerRow = 4;
  } else if (props.containerWidth > WIDTH_MD) {
    itemsPerRow = 3;
  }
  const showFileList = props.showSelectedFiles && !isNoFiles;
  const numberOfFilesForRecovery = props.recoveredState ? Object.keys(props.recoveredState.files).length : null;
  const numberOfGhosts = props.files ? Object.keys(props.files).filter((fileID) => props.files[fileID].isGhost).length : 0;
  const renderRestoredText = () => {
    if (numberOfGhosts > 0) {
      return props.i18n("recoveredXFiles", {
        smart_count: numberOfGhosts
      });
    }
    return props.i18n("recoveredAllFiles");
  };
  const dashboard = _("div", {
    className: dashboardClassName,
    "data-uppy-theme": props.theme,
    "data-uppy-num-acquirers": props.acquirers.length,
    "data-uppy-drag-drop-supported": !props.disableLocalFiles && isDragDropSupported(),
    "aria-hidden": props.inline ? "false" : props.isHidden,
    "aria-disabled": props.disabled,
    "aria-label": !props.inline ? props.i18n("dashboardWindowTitle") : props.i18n("dashboardTitle"),
    onPaste: props.handlePaste,
    onDragOver: props.handleDragOver,
    onDragLeave: props.handleDragLeave,
    onDrop: props.handleDrop
  }, _("div", {
    "aria-hidden": "true",
    className: "uppy-Dashboard-overlay",
    tabIndex: -1,
    onClick: props.handleClickOutside
  }), _("div", {
    className: "uppy-Dashboard-inner",
    "aria-modal": !props.inline && "true",
    role: props.inline ? void 0 : "dialog",
    style: {
      width: props.inline && props.width ? props.width : "",
      height: props.inline && props.height ? props.height : ""
    }
  }, !props.inline ? _("button", {
    className: "uppy-u-reset uppy-Dashboard-close",
    type: "button",
    "aria-label": props.i18n("closeModal"),
    title: props.i18n("closeModal"),
    onClick: props.closeModal
  }, _("span", {
    "aria-hidden": "true"
  }, "×")) : null, _("div", {
    className: "uppy-Dashboard-innerWrap"
  }, _("div", {
    className: "uppy-Dashboard-dropFilesHereHint"
  }, props.i18n("dropHint")), showFileList && _(PickerPanelTopBar_default, props), numberOfFilesForRecovery && _("div", {
    className: "uppy-Dashboard-serviceMsg"
  }, _("svg", {
    className: "uppy-Dashboard-serviceMsg-icon",
    "aria-hidden": "true",
    focusable: "false",
    width: "21",
    height: "16",
    viewBox: "0 0 24 19"
  }, _("g", {
    transform: "translate(0 -1)",
    fill: "none",
    fillRule: "evenodd"
  }, _("path", {
    d: "M12.857 1.43l10.234 17.056A1 1 0 0122.234 20H1.766a1 1 0 01-.857-1.514L11.143 1.429a1 1 0 011.714 0z",
    fill: "#FFD300"
  }), _("path", {
    fill: "#000",
    d: "M11 6h2l-.3 8h-1.4z"
  }), _("circle", {
    fill: "#000",
    cx: "12",
    cy: "17",
    r: "1"
  }))), _("strong", {
    className: "uppy-Dashboard-serviceMsg-title"
  }, props.i18n("sessionRestored")), _("div", {
    className: "uppy-Dashboard-serviceMsg-text"
  }, renderRestoredText())), showFileList ? _(FileList, {
    id: props.id,
    i18n: props.i18n,
    uppy: props.uppy,
    files: props.files,
    resumableUploads: props.resumableUploads,
    hideRetryButton: props.hideRetryButton,
    hidePauseResumeButton: props.hidePauseResumeButton,
    hideCancelButton: props.hideCancelButton,
    showLinkToFileUploadResult: props.showLinkToFileUploadResult,
    showRemoveButtonAfterComplete: props.showRemoveButtonAfterComplete,
    metaFields: props.metaFields,
    toggleFileCard: props.toggleFileCard,
    handleRequestThumbnail: props.handleRequestThumbnail,
    handleCancelThumbnail: props.handleCancelThumbnail,
    recoveredState: props.recoveredState,
    individualCancellation: props.individualCancellation,
    openFileEditor: props.openFileEditor,
    canEditFile: props.canEditFile,
    toggleAddFilesPanel: props.toggleAddFilesPanel,
    isSingleFile,
    itemsPerRow,
    containerWidth: props.containerWidth,
    containerHeight: props.containerHeight
  }) : _(AddFiles_default, {
    i18n: props.i18n,
    i18nArray: props.i18nArray,
    acquirers: props.acquirers,
    handleInputChange: props.handleInputChange,
    maxNumberOfFiles: props.maxNumberOfFiles,
    allowedFileTypes: props.allowedFileTypes,
    showNativePhotoCameraButton: props.showNativePhotoCameraButton,
    showNativeVideoCameraButton: props.showNativeVideoCameraButton,
    nativeCameraFacingMode: props.nativeCameraFacingMode,
    showPanel: props.showPanel,
    activePickerPanel: props.activePickerPanel,
    disableLocalFiles: props.disableLocalFiles,
    fileManagerSelectionType: props.fileManagerSelectionType,
    note: props.note,
    proudlyDisplayPoweredByUppy: props.proudlyDisplayPoweredByUppy
  }), _(Slide_default, null, props.showAddFilesPanel ? _(AddFilesPanel_default, _extends2({
    key: "AddFiles"
  }, props, {
    isSizeMD
  })) : null), _(Slide_default, null, props.fileCardFor ? _(FileCard, _extends2({
    key: "FileCard"
  }, props)) : null), _(Slide_default, null, props.activePickerPanel ? _(PickerPanelContent_default, _extends2({
    key: "Picker"
  }, props)) : null), _(Slide_default, null, props.showFileEditor ? _(EditorPanel_default, _extends2({
    key: "Editor"
  }, props)) : null), _("div", {
    className: "uppy-Dashboard-progressindicators"
  }, props.progressindicators.map((target) => {
    return props.uppy.getPlugin(target.id).render(props.state);
  })))));
  return dashboard;
}

// node_modules/@uppy/dashboard/lib/locale.js
var import_dist262 = __toESM(require_dist(), 1);
var import_dist263 = __toESM(require_dist2(), 1);
var import_dist264 = __toESM(require_dist3(), 1);
var locale_default2 = {
  strings: {
    // When `inline: false`, used as the screen reader label for the button that closes the modal.
    closeModal: "Close Modal",
    // Used as the screen reader label for the plus (+) button that shows the “Add more files” screen
    addMoreFiles: "Add more files",
    addingMoreFiles: "Adding more files",
    // Used as the header for import panels, e.g., “Import from Google Drive”.
    importFrom: "Import from %{name}",
    // When `inline: false`, used as the screen reader label for the dashboard modal.
    dashboardWindowTitle: "Uppy Dashboard Window (Press escape to close)",
    // When `inline: true`, used as the screen reader label for the dashboard area.
    dashboardTitle: "Uppy Dashboard",
    // Shown in the Informer when a link to a file was copied to the clipboard.
    copyLinkToClipboardSuccess: "Link copied to clipboard.",
    // Used when a link cannot be copied automatically — the user has to select the text from the
    // input element below this string.
    copyLinkToClipboardFallback: "Copy the URL below",
    // Used as the hover title and screen reader label for buttons that copy a file link.
    copyLink: "Copy link",
    back: "Back",
    // Used as the screen reader label for buttons that remove a file.
    removeFile: "Remove file",
    // Used as the screen reader label for buttons that open the metadata editor panel for a file.
    editFile: "Edit file",
    editImage: "Edit image",
    // Shown in the panel header for the metadata editor. Rendered as “Editing image.png”.
    editing: "Editing %{file}",
    // Shown on the main upload screen when an upload error occurs
    error: "Error",
    // Used as the screen reader label for the button that saves metadata edits and returns to the
    // file list view.
    finishEditingFile: "Finish editing file",
    saveChanges: "Save changes",
    // Used as the label for the tab button that opens the system file selection dialog.
    myDevice: "My Device",
    dropHint: "Drop your files here",
    // Used as the hover text and screen reader label for file progress indicators when
    // they have been fully uploaded.
    uploadComplete: "Upload complete",
    uploadPaused: "Upload paused",
    // Used as the hover text and screen reader label for the buttons to resume paused uploads.
    resumeUpload: "Resume upload",
    // Used as the hover text and screen reader label for the buttons to pause uploads.
    pauseUpload: "Pause upload",
    // Used as the hover text and screen reader label for the buttons to retry failed uploads.
    retryUpload: "Retry upload",
    // Used as the hover text and screen reader label for the buttons to cancel uploads.
    cancelUpload: "Cancel upload",
    // Used in a title, how many files are currently selected
    xFilesSelected: {
      0: "%{smart_count} file selected",
      1: "%{smart_count} files selected"
    },
    uploadingXFiles: {
      0: "Uploading %{smart_count} file",
      1: "Uploading %{smart_count} files"
    },
    processingXFiles: {
      0: "Processing %{smart_count} file",
      1: "Processing %{smart_count} files"
    },
    // The "powered by Uppy" link at the bottom of the Dashboard.
    poweredBy: "Powered by %{uppy}",
    addMore: "Add more",
    editFileWithFilename: "Edit file %{file}",
    save: "Save",
    cancel: "Cancel",
    dropPasteFiles: "Drop files here or %{browseFiles}",
    dropPasteFolders: "Drop files here or %{browseFolders}",
    dropPasteBoth: "Drop files here, %{browseFiles} or %{browseFolders}",
    dropPasteImportFiles: "Drop files here, %{browseFiles} or import from:",
    dropPasteImportFolders: "Drop files here, %{browseFolders} or import from:",
    dropPasteImportBoth: "Drop files here, %{browseFiles}, %{browseFolders} or import from:",
    importFiles: "Import files from:",
    browseFiles: "browse files",
    browseFolders: "browse folders",
    recoveredXFiles: {
      0: "We could not fully recover 1 file. Please re-select it and resume the upload.",
      1: "We could not fully recover %{smart_count} files. Please re-select them and resume the upload."
    },
    recoveredAllFiles: "We restored all files. You can now resume the upload.",
    sessionRestored: "Session restored",
    reSelect: "Re-select",
    missingRequiredMetaFields: {
      0: "Missing required meta field: %{fields}.",
      1: "Missing required meta fields: %{fields}."
    },
    // Used for native device camera buttons on mobile
    takePictureBtn: "Take Picture",
    recordVideoBtn: "Record Video"
  }
};

// node_modules/@uppy/dashboard/lib/Dashboard.js
function _classPrivateFieldLooseBase2(e3, t3) {
  if (!{}.hasOwnProperty.call(e3, t3)) throw new TypeError("attempted to use private field on non-instance");
  return e3;
}
var id2 = 0;
function _classPrivateFieldLooseKey2(e3) {
  return "__private_" + id2++ + "_" + e3;
}
var packageJson5 = {
  "version": "4.3.3"
};
var memoize = memoizeOne.default || memoizeOne;
var TAB_KEY = 9;
var ESC_KEY = 27;
function createPromise() {
  const o3 = {};
  o3.promise = new Promise((resolve, reject) => {
    o3.resolve = resolve;
    o3.reject = reject;
  });
  return o3;
}
var defaultOptions3 = {
  target: "body",
  metaFields: [],
  thumbnailWidth: 280,
  thumbnailType: "image/jpeg",
  waitForThumbnailsBeforeUpload: false,
  defaultPickerIcon,
  showLinkToFileUploadResult: false,
  showProgressDetails: false,
  hideUploadButton: false,
  hideCancelButton: false,
  hideRetryButton: false,
  hidePauseResumeButton: false,
  hideProgressAfterFinish: false,
  note: null,
  singleFileFullScreen: true,
  disableStatusBar: false,
  disableInformer: false,
  disableThumbnailGenerator: false,
  fileManagerSelectionType: "files",
  proudlyDisplayPoweredByUppy: true,
  showSelectedFiles: true,
  showRemoveButtonAfterComplete: false,
  showNativePhotoCameraButton: false,
  showNativeVideoCameraButton: false,
  theme: "light",
  autoOpen: null,
  disabled: false,
  disableLocalFiles: false,
  nativeCameraFacingMode: "",
  onDragLeave: () => {
  },
  onDragOver: () => {
  },
  onDrop: () => {
  },
  plugins: [],
  // Dynamic default options, they have to be defined in the constructor (because
  // they require access to the `this` keyword), but we still want them to
  // appear in the default options so TS knows they'll be defined.
  doneButtonHandler: void 0,
  onRequestCloseModal: null,
  // defaultModalOptions
  inline: false,
  animateOpenClose: true,
  browserBackButtonClose: false,
  closeAfterFinish: false,
  closeModalOnClickOutside: false,
  disablePageScrollWhenModalOpen: true,
  trigger: null,
  // defaultInlineOptions
  width: 750,
  height: 550
};
var _disabledNodes = _classPrivateFieldLooseKey2("disabledNodes");
var _generateLargeThumbnailIfSingleFile = _classPrivateFieldLooseKey2("generateLargeThumbnailIfSingleFile");
var _openFileEditorWhenFilesAdded = _classPrivateFieldLooseKey2("openFileEditorWhenFilesAdded");
var _attachRenderFunctionToTarget = _classPrivateFieldLooseKey2("attachRenderFunctionToTarget");
var _isTargetSupported = _classPrivateFieldLooseKey2("isTargetSupported");
var _getAcquirers = _classPrivateFieldLooseKey2("getAcquirers");
var _getProgressIndicators = _classPrivateFieldLooseKey2("getProgressIndicators");
var _getEditors = _classPrivateFieldLooseKey2("getEditors");
var _addSpecifiedPluginsFromOptions = _classPrivateFieldLooseKey2("addSpecifiedPluginsFromOptions");
var _autoDiscoverPlugins = _classPrivateFieldLooseKey2("autoDiscoverPlugins");
var _addSupportedPluginIfNoTarget = _classPrivateFieldLooseKey2("addSupportedPluginIfNoTarget");
var _getStatusBarOpts = _classPrivateFieldLooseKey2("getStatusBarOpts");
var _getThumbnailGeneratorOpts = _classPrivateFieldLooseKey2("getThumbnailGeneratorOpts");
var _getInformerOpts = _classPrivateFieldLooseKey2("getInformerOpts");
var _getStatusBarId = _classPrivateFieldLooseKey2("getStatusBarId");
var _getThumbnailGeneratorId = _classPrivateFieldLooseKey2("getThumbnailGeneratorId");
var _getInformerId = _classPrivateFieldLooseKey2("getInformerId");
var Dashboard2 = class extends UIPlugin_default {
  // Timeouts
  constructor(uppy, _opts) {
    var _opts$autoOpen, _this$opts, _this$opts$onRequestC;
    const autoOpen = (_opts$autoOpen = _opts == null ? void 0 : _opts.autoOpen) != null ? _opts$autoOpen : null;
    super(uppy, {
      ...defaultOptions3,
      ..._opts,
      autoOpen
    });
    Object.defineProperty(this, _getInformerId, {
      value: _getInformerId2
    });
    Object.defineProperty(this, _getThumbnailGeneratorId, {
      value: _getThumbnailGeneratorId2
    });
    Object.defineProperty(this, _getStatusBarId, {
      value: _getStatusBarId2
    });
    Object.defineProperty(this, _getInformerOpts, {
      value: _getInformerOpts2
    });
    Object.defineProperty(this, _getThumbnailGeneratorOpts, {
      value: _getThumbnailGeneratorOpts2
    });
    Object.defineProperty(this, _getStatusBarOpts, {
      value: _getStatusBarOpts2
    });
    Object.defineProperty(this, _disabledNodes, {
      writable: true,
      value: void 0
    });
    this.modalName = `uppy-Dashboard-${nanoid2()}`;
    this.superFocus = createSuperFocus();
    this.ifFocusedOnUppyRecently = false;
    this.removeTarget = (plugin) => {
      const pluginState = this.getPluginState();
      const newTargets = pluginState.targets.filter((target) => target.id !== plugin.id);
      this.setPluginState({
        targets: newTargets
      });
    };
    this.addTarget = (plugin) => {
      const callerPluginId = plugin.id || plugin.constructor.name;
      const callerPluginName = plugin.title || callerPluginId;
      const callerPluginType = plugin.type;
      if (callerPluginType !== "acquirer" && callerPluginType !== "progressindicator" && callerPluginType !== "editor") {
        const msg = "Dashboard: can only be targeted by plugins of types: acquirer, progressindicator, editor";
        this.uppy.log(msg, "error");
        return null;
      }
      const target = {
        id: callerPluginId,
        name: callerPluginName,
        type: callerPluginType
      };
      const state = this.getPluginState();
      const newTargets = state.targets.slice();
      newTargets.push(target);
      this.setPluginState({
        targets: newTargets
      });
      return this.el;
    };
    this.hideAllPanels = () => {
      var _state$activePickerPa;
      const state = this.getPluginState();
      const update = {
        activePickerPanel: void 0,
        showAddFilesPanel: false,
        activeOverlayType: null,
        fileCardFor: null,
        showFileEditor: false
      };
      if (state.activePickerPanel === update.activePickerPanel && state.showAddFilesPanel === update.showAddFilesPanel && state.showFileEditor === update.showFileEditor && state.activeOverlayType === update.activeOverlayType) {
        return;
      }
      this.setPluginState(update);
      this.uppy.emit("dashboard:close-panel", (_state$activePickerPa = state.activePickerPanel) == null ? void 0 : _state$activePickerPa.id);
    };
    this.showPanel = (id3) => {
      const {
        targets
      } = this.getPluginState();
      const activePickerPanel = targets.find((target) => {
        return target.type === "acquirer" && target.id === id3;
      });
      this.setPluginState({
        activePickerPanel,
        activeOverlayType: "PickerPanel"
      });
      this.uppy.emit("dashboard:show-panel", id3);
    };
    this.canEditFile = (file) => {
      const {
        targets
      } = this.getPluginState();
      const editors = _classPrivateFieldLooseBase2(this, _getEditors)[_getEditors](targets);
      return editors.some((target) => this.uppy.getPlugin(target.id).canEditFile(file));
    };
    this.openFileEditor = (file) => {
      const {
        targets
      } = this.getPluginState();
      const editors = _classPrivateFieldLooseBase2(this, _getEditors)[_getEditors](targets);
      this.setPluginState({
        showFileEditor: true,
        fileCardFor: file.id || null,
        activeOverlayType: "FileEditor"
      });
      editors.forEach((editor) => {
        ;
        this.uppy.getPlugin(editor.id).selectFile(file);
      });
    };
    this.closeFileEditor = () => {
      const {
        metaFields
      } = this.getPluginState();
      const isMetaEditorEnabled = metaFields && metaFields.length > 0;
      if (isMetaEditorEnabled) {
        this.setPluginState({
          showFileEditor: false,
          activeOverlayType: "FileCard"
        });
      } else {
        this.setPluginState({
          showFileEditor: false,
          fileCardFor: null,
          activeOverlayType: "AddFiles"
        });
      }
    };
    this.saveFileEditor = () => {
      const {
        targets
      } = this.getPluginState();
      const editors = _classPrivateFieldLooseBase2(this, _getEditors)[_getEditors](targets);
      editors.forEach((editor) => {
        ;
        this.uppy.getPlugin(editor.id).save();
      });
      this.closeFileEditor();
    };
    this.openModal = () => {
      const {
        promise,
        resolve
      } = createPromise();
      this.savedScrollPosition = window.pageYOffset;
      this.savedActiveElement = document.activeElement;
      if (this.opts.disablePageScrollWhenModalOpen) {
        document.body.classList.add("uppy-Dashboard-isFixed");
      }
      if (this.opts.animateOpenClose && this.getPluginState().isClosing) {
        const handler = () => {
          this.setPluginState({
            isHidden: false
          });
          this.el.removeEventListener("animationend", handler, false);
          resolve();
        };
        this.el.addEventListener("animationend", handler, false);
      } else {
        this.setPluginState({
          isHidden: false
        });
        resolve();
      }
      if (this.opts.browserBackButtonClose) {
        this.updateBrowserHistory();
      }
      document.addEventListener("keydown", this.handleKeyDownInModal);
      this.uppy.emit("dashboard:modal-open");
      return promise;
    };
    this.closeModal = (opts) => {
      var _opts$manualClose;
      const manualClose = (_opts$manualClose = opts == null ? void 0 : opts.manualClose) != null ? _opts$manualClose : true;
      const {
        isHidden,
        isClosing
      } = this.getPluginState();
      if (isHidden || isClosing) {
        return void 0;
      }
      const {
        promise,
        resolve
      } = createPromise();
      if (this.opts.disablePageScrollWhenModalOpen) {
        document.body.classList.remove("uppy-Dashboard-isFixed");
      }
      if (this.opts.animateOpenClose) {
        this.setPluginState({
          isClosing: true
        });
        const handler = () => {
          this.setPluginState({
            isHidden: true,
            isClosing: false
          });
          this.superFocus.cancel();
          this.savedActiveElement.focus();
          this.el.removeEventListener("animationend", handler, false);
          resolve();
        };
        this.el.addEventListener("animationend", handler, false);
      } else {
        this.setPluginState({
          isHidden: true
        });
        this.superFocus.cancel();
        this.savedActiveElement.focus();
        resolve();
      }
      document.removeEventListener("keydown", this.handleKeyDownInModal);
      if (manualClose) {
        if (this.opts.browserBackButtonClose) {
          var _history$state;
          if ((_history$state = history.state) != null && _history$state[this.modalName]) {
            history.back();
          }
        }
      }
      this.uppy.emit("dashboard:modal-closed");
      return promise;
    };
    this.isModalOpen = () => {
      return !this.getPluginState().isHidden || false;
    };
    this.requestCloseModal = () => {
      if (this.opts.onRequestCloseModal) {
        return this.opts.onRequestCloseModal();
      }
      return this.closeModal();
    };
    this.setDarkModeCapability = (isDarkModeOn) => {
      const {
        capabilities
      } = this.uppy.getState();
      this.uppy.setState({
        capabilities: {
          ...capabilities,
          darkMode: isDarkModeOn
        }
      });
    };
    this.handleSystemDarkModeChange = (event) => {
      const isDarkModeOnNow = event.matches;
      this.uppy.log(`[Dashboard] Dark mode is ${isDarkModeOnNow ? "on" : "off"}`);
      this.setDarkModeCapability(isDarkModeOnNow);
    };
    this.toggleFileCard = (show, fileID) => {
      const file = this.uppy.getFile(fileID);
      if (show) {
        this.uppy.emit("dashboard:file-edit-start", file);
      } else {
        this.uppy.emit("dashboard:file-edit-complete", file);
      }
      this.setPluginState({
        fileCardFor: show ? fileID : null,
        activeOverlayType: show ? "FileCard" : null
      });
    };
    this.toggleAddFilesPanel = (show) => {
      this.setPluginState({
        showAddFilesPanel: show,
        activeOverlayType: show ? "AddFiles" : null
      });
    };
    this.addFiles = (files) => {
      const descriptors = files.map((file) => ({
        source: this.id,
        name: file.name,
        type: file.type,
        data: file,
        meta: {
          // path of the file relative to the ancestor directory the user selected.
          // e.g. 'docs/Old Prague/airbnb.pdf'
          relativePath: file.relativePath || file.webkitRelativePath || null
        }
      }));
      try {
        this.uppy.addFiles(descriptors);
      } catch (err) {
        this.uppy.log(err);
      }
    };
    this.startListeningToResize = () => {
      this.resizeObserver = new ResizeObserver((entries) => {
        const uppyDashboardInnerEl = entries[0];
        const {
          width,
          height
        } = uppyDashboardInnerEl.contentRect;
        this.setPluginState({
          containerWidth: width,
          containerHeight: height,
          areInsidesReadyToBeVisible: true
        });
      });
      this.resizeObserver.observe(this.el.querySelector(".uppy-Dashboard-inner"));
      this.makeDashboardInsidesVisibleAnywayTimeout = setTimeout(() => {
        const pluginState = this.getPluginState();
        const isModalAndClosed = !this.opts.inline && pluginState.isHidden;
        if (
          // We might want to enable this in the future
          // if ResizeObserver hasn't yet fired,
          !pluginState.areInsidesReadyToBeVisible && // and it's not due to the modal being closed
          !isModalAndClosed
        ) {
          this.uppy.log("[Dashboard] resize event didn’t fire on time: defaulted to mobile layout", "warning");
          this.setPluginState({
            areInsidesReadyToBeVisible: true
          });
        }
      }, 1e3);
    };
    this.stopListeningToResize = () => {
      this.resizeObserver.disconnect();
      clearTimeout(this.makeDashboardInsidesVisibleAnywayTimeout);
    };
    this.recordIfFocusedOnUppyRecently = (event) => {
      if (this.el.contains(event.target)) {
        this.ifFocusedOnUppyRecently = true;
      } else {
        this.ifFocusedOnUppyRecently = false;
        this.superFocus.cancel();
      }
    };
    this.disableInteractiveElements = (disable) => {
      var _classPrivateFieldLoo;
      const NODES_TO_DISABLE = ["a[href]", "input:not([disabled])", "select:not([disabled])", "textarea:not([disabled])", "button:not([disabled])", '[role="button"]:not([disabled])'];
      const nodesToDisable = (_classPrivateFieldLoo = _classPrivateFieldLooseBase2(this, _disabledNodes)[_disabledNodes]) != null ? _classPrivateFieldLoo : toArray_default(this.el.querySelectorAll(NODES_TO_DISABLE)).filter((node) => !node.classList.contains("uppy-Dashboard-close"));
      for (const node of nodesToDisable) {
        if (node.tagName === "A") {
          node.setAttribute("aria-disabled", disable);
        } else {
          node.disabled = disable;
        }
      }
      if (disable) {
        _classPrivateFieldLooseBase2(this, _disabledNodes)[_disabledNodes] = nodesToDisable;
      } else {
        _classPrivateFieldLooseBase2(this, _disabledNodes)[_disabledNodes] = null;
      }
      this.dashboardIsDisabled = disable;
    };
    this.updateBrowserHistory = () => {
      var _history$state2;
      if (!((_history$state2 = history.state) != null && _history$state2[this.modalName])) {
        history.pushState({
          // eslint-disable-next-line no-restricted-globals
          ...history.state,
          [this.modalName]: true
        }, "");
      }
      window.addEventListener("popstate", this.handlePopState, false);
    };
    this.handlePopState = (event) => {
      var _event$state;
      if (this.isModalOpen() && (!event.state || !event.state[this.modalName])) {
        this.closeModal({
          manualClose: false
        });
      }
      if (!this.isModalOpen() && (_event$state = event.state) != null && _event$state[this.modalName]) {
        history.back();
      }
    };
    this.handleKeyDownInModal = (event) => {
      if (event.keyCode === ESC_KEY) this.requestCloseModal();
      if (event.keyCode === TAB_KEY) trapFocus(event, this.getPluginState().activeOverlayType, this.el);
    };
    this.handleClickOutside = () => {
      if (this.opts.closeModalOnClickOutside) this.requestCloseModal();
    };
    this.handlePaste = (event) => {
      this.uppy.iteratePlugins((plugin) => {
        if (plugin.type === "acquirer") {
          ;
          plugin.handleRootPaste == null || plugin.handleRootPaste(event);
        }
      });
      const files = toArray_default(event.clipboardData.files);
      if (files.length > 0) {
        this.uppy.log("[Dashboard] Files pasted");
        this.addFiles(files);
      }
    };
    this.handleInputChange = (event) => {
      event.preventDefault();
      const files = toArray_default(event.currentTarget.files || []);
      if (files.length > 0) {
        this.uppy.log("[Dashboard] Files selected through input");
        this.addFiles(files);
      }
    };
    this.handleDragOver = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const canSomePluginHandleRootDrop = () => {
        let somePluginCanHandleRootDrop2 = true;
        this.uppy.iteratePlugins((plugin) => {
          if (plugin.canHandleRootDrop != null && plugin.canHandleRootDrop(event)) {
            somePluginCanHandleRootDrop2 = true;
          }
        });
        return somePluginCanHandleRootDrop2;
      };
      const doesEventHaveFiles = () => {
        const {
          types
        } = event.dataTransfer;
        return types.some((type) => type === "Files");
      };
      const somePluginCanHandleRootDrop = canSomePluginHandleRootDrop();
      const hasFiles = doesEventHaveFiles();
      if (!somePluginCanHandleRootDrop && !hasFiles || this.opts.disabled || // opts.disableLocalFiles should only be taken into account if no plugins
      // can handle the datatransfer
      this.opts.disableLocalFiles && (hasFiles || !somePluginCanHandleRootDrop) || !this.uppy.getState().allowNewUpload) {
        event.dataTransfer.dropEffect = "none";
        return;
      }
      event.dataTransfer.dropEffect = "copy";
      this.setPluginState({
        isDraggingOver: true
      });
      this.opts.onDragOver(event);
    };
    this.handleDragLeave = (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.setPluginState({
        isDraggingOver: false
      });
      this.opts.onDragLeave(event);
    };
    this.handleDrop = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.setPluginState({
        isDraggingOver: false
      });
      this.uppy.iteratePlugins((plugin) => {
        if (plugin.type === "acquirer") {
          ;
          plugin.handleRootDrop == null || plugin.handleRootDrop(event);
        }
      });
      let executedDropErrorOnce = false;
      const logDropError = (error) => {
        this.uppy.log(error, "error");
        if (!executedDropErrorOnce) {
          this.uppy.info(error.message, "error");
          executedDropErrorOnce = true;
        }
      };
      this.uppy.log("[Dashboard] Processing dropped files");
      const files = await getDroppedFiles(event.dataTransfer, {
        logDropError
      });
      if (files.length > 0) {
        this.uppy.log("[Dashboard] Files dropped");
        this.addFiles(files);
      }
      this.opts.onDrop(event);
    };
    this.handleRequestThumbnail = (file) => {
      if (!this.opts.waitForThumbnailsBeforeUpload) {
        this.uppy.emit("thumbnail:request", file);
      }
    };
    this.handleCancelThumbnail = (file) => {
      if (!this.opts.waitForThumbnailsBeforeUpload) {
        this.uppy.emit("thumbnail:cancel", file);
      }
    };
    this.handleKeyDownInInline = (event) => {
      if (event.keyCode === TAB_KEY) forInline(event, this.getPluginState().activeOverlayType, this.el);
    };
    this.handlePasteOnBody = (event) => {
      const isFocusInOverlay2 = this.el.contains(document.activeElement);
      if (isFocusInOverlay2) {
        this.handlePaste(event);
      }
    };
    this.handleComplete = (_ref) => {
      let {
        failed
      } = _ref;
      if (this.opts.closeAfterFinish && !(failed != null && failed.length)) {
        this.requestCloseModal();
      }
    };
    this.handleCancelRestore = () => {
      this.uppy.emit("restore-canceled");
    };
    Object.defineProperty(this, _generateLargeThumbnailIfSingleFile, {
      writable: true,
      value: () => {
        if (this.opts.disableThumbnailGenerator) {
          return;
        }
        const LARGE_THUMBNAIL = 600;
        const files = this.uppy.getFiles();
        if (files.length === 1) {
          const thumbnailGenerator = this.uppy.getPlugin(`${this.id}:ThumbnailGenerator`);
          thumbnailGenerator == null || thumbnailGenerator.setOptions({
            thumbnailWidth: LARGE_THUMBNAIL
          });
          const fileForThumbnail = {
            ...files[0],
            preview: void 0
          };
          thumbnailGenerator == null || thumbnailGenerator.requestThumbnail(fileForThumbnail).then(() => {
            thumbnailGenerator == null || thumbnailGenerator.setOptions({
              thumbnailWidth: this.opts.thumbnailWidth
            });
          });
        }
      }
    });
    Object.defineProperty(this, _openFileEditorWhenFilesAdded, {
      writable: true,
      value: (files) => {
        const firstFile = files[0];
        const {
          metaFields
        } = this.getPluginState();
        const isMetaEditorEnabled = metaFields && metaFields.length > 0;
        const isImageEditorEnabled = this.canEditFile(firstFile);
        if (isMetaEditorEnabled && this.opts.autoOpen === "metaEditor") {
          this.toggleFileCard(true, firstFile.id);
        } else if (isImageEditorEnabled && this.opts.autoOpen === "imageEditor") {
          this.openFileEditor(firstFile);
        }
      }
    });
    this.initEvents = () => {
      if (this.opts.trigger && !this.opts.inline) {
        const showModalTrigger = findAllDOMElements_default(this.opts.trigger);
        if (showModalTrigger) {
          showModalTrigger.forEach((trigger) => trigger.addEventListener("click", this.openModal));
        } else {
          this.uppy.log("Dashboard modal trigger not found. Make sure `trigger` is set in Dashboard options, unless you are planning to call `dashboard.openModal()` method yourself", "warning");
        }
      }
      this.startListeningToResize();
      document.addEventListener("paste", this.handlePasteOnBody);
      this.uppy.on("plugin-added", _classPrivateFieldLooseBase2(this, _addSupportedPluginIfNoTarget)[_addSupportedPluginIfNoTarget]);
      this.uppy.on("plugin-remove", this.removeTarget);
      this.uppy.on("file-added", this.hideAllPanels);
      this.uppy.on("dashboard:modal-closed", this.hideAllPanels);
      this.uppy.on("complete", this.handleComplete);
      this.uppy.on("files-added", _classPrivateFieldLooseBase2(this, _generateLargeThumbnailIfSingleFile)[_generateLargeThumbnailIfSingleFile]);
      this.uppy.on("file-removed", _classPrivateFieldLooseBase2(this, _generateLargeThumbnailIfSingleFile)[_generateLargeThumbnailIfSingleFile]);
      document.addEventListener("focus", this.recordIfFocusedOnUppyRecently, true);
      document.addEventListener("click", this.recordIfFocusedOnUppyRecently, true);
      if (this.opts.inline) {
        this.el.addEventListener("keydown", this.handleKeyDownInInline);
      }
      if (this.opts.autoOpen) {
        this.uppy.on("files-added", _classPrivateFieldLooseBase2(this, _openFileEditorWhenFilesAdded)[_openFileEditorWhenFilesAdded]);
      }
    };
    this.removeEvents = () => {
      const showModalTrigger = findAllDOMElements_default(this.opts.trigger);
      if (!this.opts.inline && showModalTrigger) {
        showModalTrigger.forEach((trigger) => trigger.removeEventListener("click", this.openModal));
      }
      this.stopListeningToResize();
      document.removeEventListener("paste", this.handlePasteOnBody);
      window.removeEventListener("popstate", this.handlePopState, false);
      this.uppy.off("plugin-added", _classPrivateFieldLooseBase2(this, _addSupportedPluginIfNoTarget)[_addSupportedPluginIfNoTarget]);
      this.uppy.off("plugin-remove", this.removeTarget);
      this.uppy.off("file-added", this.hideAllPanels);
      this.uppy.off("dashboard:modal-closed", this.hideAllPanels);
      this.uppy.off("complete", this.handleComplete);
      this.uppy.off("files-added", _classPrivateFieldLooseBase2(this, _generateLargeThumbnailIfSingleFile)[_generateLargeThumbnailIfSingleFile]);
      this.uppy.off("file-removed", _classPrivateFieldLooseBase2(this, _generateLargeThumbnailIfSingleFile)[_generateLargeThumbnailIfSingleFile]);
      document.removeEventListener("focus", this.recordIfFocusedOnUppyRecently);
      document.removeEventListener("click", this.recordIfFocusedOnUppyRecently);
      if (this.opts.inline) {
        this.el.removeEventListener("keydown", this.handleKeyDownInInline);
      }
      if (this.opts.autoOpen) {
        this.uppy.off("files-added", _classPrivateFieldLooseBase2(this, _openFileEditorWhenFilesAdded)[_openFileEditorWhenFilesAdded]);
      }
    };
    this.superFocusOnEachUpdate = () => {
      const isFocusInUppy = this.el.contains(document.activeElement);
      const isFocusNowhere = document.activeElement === document.body || document.activeElement === null;
      const isInformerHidden = this.uppy.getState().info.length === 0;
      const isModal = !this.opts.inline;
      if (
        // If update is connected to showing the Informer - let the screen reader calmly read it.
        isInformerHidden && // If we are in a modal - always superfocus without concern for other elements
        // on the page (user is unlikely to want to interact with the rest of the page)
        (isModal || // If we are already inside of Uppy, or
        isFocusInUppy || // If we are not focused on anything BUT we have already, at least once, focused on uppy
        //   1. We focus when isFocusNowhere, because when the element we were focused
        //      on disappears (e.g. an overlay), - focus gets lost. If user is typing
        //      something somewhere else on the page, - focus won't be 'nowhere'.
        //   2. We only focus when focus is nowhere AND this.ifFocusedOnUppyRecently,
        //      to avoid focus jumps if we do something else on the page.
        //   [Practical check] Without '&& this.ifFocusedOnUppyRecently', in Safari, in inline mode,
        //                     when file is uploading, - navigate via tab to the checkbox,
        //                     try to press space multiple times. Focus will jump to Uppy.
        isFocusNowhere && this.ifFocusedOnUppyRecently)
      ) {
        this.superFocus(this.el, this.getPluginState().activeOverlayType);
      } else {
        this.superFocus.cancel();
      }
    };
    this.afterUpdate = () => {
      if (this.opts.disabled && !this.dashboardIsDisabled) {
        this.disableInteractiveElements(true);
        return;
      }
      if (!this.opts.disabled && this.dashboardIsDisabled) {
        this.disableInteractiveElements(false);
      }
      this.superFocusOnEachUpdate();
    };
    this.saveFileCard = (meta, fileID) => {
      this.uppy.setFileMeta(fileID, meta);
      this.toggleFileCard(false, fileID);
    };
    Object.defineProperty(this, _attachRenderFunctionToTarget, {
      writable: true,
      value: (target) => {
        const plugin = this.uppy.getPlugin(target.id);
        return {
          ...target,
          icon: plugin.icon || this.opts.defaultPickerIcon,
          render: plugin.render
        };
      }
    });
    Object.defineProperty(this, _isTargetSupported, {
      writable: true,
      value: (target) => {
        const plugin = this.uppy.getPlugin(target.id);
        if (typeof plugin.isSupported !== "function") {
          return true;
        }
        return plugin.isSupported();
      }
    });
    Object.defineProperty(this, _getAcquirers, {
      writable: true,
      value: memoize((targets) => {
        return targets.filter((target) => target.type === "acquirer" && _classPrivateFieldLooseBase2(this, _isTargetSupported)[_isTargetSupported](target)).map(_classPrivateFieldLooseBase2(this, _attachRenderFunctionToTarget)[_attachRenderFunctionToTarget]);
      })
    });
    Object.defineProperty(this, _getProgressIndicators, {
      writable: true,
      value: memoize((targets) => {
        return targets.filter((target) => target.type === "progressindicator").map(_classPrivateFieldLooseBase2(this, _attachRenderFunctionToTarget)[_attachRenderFunctionToTarget]);
      })
    });
    Object.defineProperty(this, _getEditors, {
      writable: true,
      value: memoize((targets) => {
        return targets.filter((target) => target.type === "editor").map(_classPrivateFieldLooseBase2(this, _attachRenderFunctionToTarget)[_attachRenderFunctionToTarget]);
      })
    });
    this.render = (state) => {
      const pluginState = this.getPluginState();
      const {
        files,
        capabilities,
        allowNewUpload
      } = state;
      const {
        newFiles,
        uploadStartedFiles,
        completeFiles,
        erroredFiles,
        inProgressFiles,
        inProgressNotPausedFiles,
        processingFiles,
        isUploadStarted,
        isAllComplete,
        isAllPaused
      } = this.uppy.getObjectOfFilesPerState();
      const acquirers = _classPrivateFieldLooseBase2(this, _getAcquirers)[_getAcquirers](pluginState.targets);
      const progressindicators = _classPrivateFieldLooseBase2(this, _getProgressIndicators)[_getProgressIndicators](pluginState.targets);
      const editors = _classPrivateFieldLooseBase2(this, _getEditors)[_getEditors](pluginState.targets);
      let theme;
      if (this.opts.theme === "auto") {
        theme = capabilities.darkMode ? "dark" : "light";
      } else {
        theme = this.opts.theme;
      }
      if (["files", "folders", "both"].indexOf(this.opts.fileManagerSelectionType) < 0) {
        this.opts.fileManagerSelectionType = "files";
        console.warn(`Unsupported option for "fileManagerSelectionType". Using default of "${this.opts.fileManagerSelectionType}".`);
      }
      return Dashboard({
        state,
        isHidden: pluginState.isHidden,
        files,
        newFiles,
        uploadStartedFiles,
        completeFiles,
        erroredFiles,
        inProgressFiles,
        inProgressNotPausedFiles,
        processingFiles,
        isUploadStarted,
        isAllComplete,
        isAllPaused,
        totalFileCount: Object.keys(files).length,
        totalProgress: state.totalProgress,
        allowNewUpload,
        acquirers,
        theme,
        disabled: this.opts.disabled,
        disableLocalFiles: this.opts.disableLocalFiles,
        direction: this.opts.direction,
        activePickerPanel: pluginState.activePickerPanel,
        showFileEditor: pluginState.showFileEditor,
        saveFileEditor: this.saveFileEditor,
        closeFileEditor: this.closeFileEditor,
        disableInteractiveElements: this.disableInteractiveElements,
        animateOpenClose: this.opts.animateOpenClose,
        isClosing: pluginState.isClosing,
        progressindicators,
        editors,
        autoProceed: this.uppy.opts.autoProceed,
        id: this.id,
        closeModal: this.requestCloseModal,
        handleClickOutside: this.handleClickOutside,
        handleInputChange: this.handleInputChange,
        handlePaste: this.handlePaste,
        inline: this.opts.inline,
        showPanel: this.showPanel,
        hideAllPanels: this.hideAllPanels,
        i18n: this.i18n,
        i18nArray: this.i18nArray,
        uppy: this.uppy,
        note: this.opts.note,
        recoveredState: state.recoveredState,
        metaFields: pluginState.metaFields,
        resumableUploads: capabilities.resumableUploads || false,
        individualCancellation: capabilities.individualCancellation,
        isMobileDevice: capabilities.isMobileDevice,
        fileCardFor: pluginState.fileCardFor,
        toggleFileCard: this.toggleFileCard,
        toggleAddFilesPanel: this.toggleAddFilesPanel,
        showAddFilesPanel: pluginState.showAddFilesPanel,
        saveFileCard: this.saveFileCard,
        openFileEditor: this.openFileEditor,
        canEditFile: this.canEditFile,
        width: this.opts.width,
        height: this.opts.height,
        showLinkToFileUploadResult: this.opts.showLinkToFileUploadResult,
        fileManagerSelectionType: this.opts.fileManagerSelectionType,
        proudlyDisplayPoweredByUppy: this.opts.proudlyDisplayPoweredByUppy,
        hideCancelButton: this.opts.hideCancelButton,
        hideRetryButton: this.opts.hideRetryButton,
        hidePauseResumeButton: this.opts.hidePauseResumeButton,
        showRemoveButtonAfterComplete: this.opts.showRemoveButtonAfterComplete,
        containerWidth: pluginState.containerWidth,
        containerHeight: pluginState.containerHeight,
        areInsidesReadyToBeVisible: pluginState.areInsidesReadyToBeVisible,
        parentElement: this.el,
        allowedFileTypes: this.uppy.opts.restrictions.allowedFileTypes,
        maxNumberOfFiles: this.uppy.opts.restrictions.maxNumberOfFiles,
        requiredMetaFields: this.uppy.opts.restrictions.requiredMetaFields,
        showSelectedFiles: this.opts.showSelectedFiles,
        showNativePhotoCameraButton: this.opts.showNativePhotoCameraButton,
        showNativeVideoCameraButton: this.opts.showNativeVideoCameraButton,
        nativeCameraFacingMode: this.opts.nativeCameraFacingMode,
        singleFileFullScreen: this.opts.singleFileFullScreen,
        handleCancelRestore: this.handleCancelRestore,
        handleRequestThumbnail: this.handleRequestThumbnail,
        handleCancelThumbnail: this.handleCancelThumbnail,
        // drag props
        isDraggingOver: pluginState.isDraggingOver,
        handleDragOver: this.handleDragOver,
        handleDragLeave: this.handleDragLeave,
        handleDrop: this.handleDrop
      });
    };
    Object.defineProperty(this, _addSpecifiedPluginsFromOptions, {
      writable: true,
      value: () => {
        const {
          plugins
        } = this.opts;
        plugins.forEach((pluginID) => {
          const plugin = this.uppy.getPlugin(pluginID);
          if (plugin) {
            ;
            plugin.mount(this, plugin);
          } else {
            this.uppy.log(`[Uppy] Dashboard could not find plugin '${pluginID}', make sure to uppy.use() the plugins you are specifying`, "warning");
          }
        });
      }
    });
    Object.defineProperty(this, _autoDiscoverPlugins, {
      writable: true,
      value: () => {
        this.uppy.iteratePlugins(_classPrivateFieldLooseBase2(this, _addSupportedPluginIfNoTarget)[_addSupportedPluginIfNoTarget]);
      }
    });
    Object.defineProperty(this, _addSupportedPluginIfNoTarget, {
      writable: true,
      value: (plugin) => {
        var _plugin$opts;
        const typesAllowed = ["acquirer", "editor"];
        if (plugin && !((_plugin$opts = plugin.opts) != null && _plugin$opts.target) && typesAllowed.includes(plugin.type)) {
          const pluginAlreadyAdded = this.getPluginState().targets.some((installedPlugin) => plugin.id === installedPlugin.id);
          if (!pluginAlreadyAdded) {
            ;
            plugin.mount(this, plugin);
          }
        }
      }
    });
    this.install = () => {
      this.setPluginState({
        isHidden: true,
        fileCardFor: null,
        activeOverlayType: null,
        showAddFilesPanel: false,
        activePickerPanel: void 0,
        showFileEditor: false,
        metaFields: this.opts.metaFields,
        targets: [],
        // We'll make them visible once .containerWidth is determined
        areInsidesReadyToBeVisible: false,
        isDraggingOver: false
      });
      const {
        inline,
        closeAfterFinish
      } = this.opts;
      if (inline && closeAfterFinish) {
        throw new Error("[Dashboard] `closeAfterFinish: true` cannot be used on an inline Dashboard, because an inline Dashboard cannot be closed at all. Either set `inline: false`, or disable the `closeAfterFinish` option.");
      }
      const {
        allowMultipleUploads,
        allowMultipleUploadBatches
      } = this.uppy.opts;
      if ((allowMultipleUploads || allowMultipleUploadBatches) && closeAfterFinish) {
        this.uppy.log("[Dashboard] When using `closeAfterFinish`, we recommended setting the `allowMultipleUploadBatches` option to `false` in the Uppy constructor. See https://uppy.io/docs/uppy/#allowMultipleUploads-true", "warning");
      }
      const {
        target
      } = this.opts;
      if (target) {
        this.mount(target, this);
      }
      if (!this.opts.disableStatusBar) {
        this.uppy.use(StatusBar, {
          id: _classPrivateFieldLooseBase2(this, _getStatusBarId)[_getStatusBarId](),
          target: this,
          ..._classPrivateFieldLooseBase2(this, _getStatusBarOpts)[_getStatusBarOpts]()
        });
      }
      if (!this.opts.disableInformer) {
        this.uppy.use(Informer, {
          id: _classPrivateFieldLooseBase2(this, _getInformerId)[_getInformerId](),
          target: this,
          ..._classPrivateFieldLooseBase2(this, _getInformerOpts)[_getInformerOpts]()
        });
      }
      if (!this.opts.disableThumbnailGenerator) {
        this.uppy.use(ThumbnailGenerator, {
          id: _classPrivateFieldLooseBase2(this, _getThumbnailGeneratorId)[_getThumbnailGeneratorId](),
          ..._classPrivateFieldLooseBase2(this, _getThumbnailGeneratorOpts)[_getThumbnailGeneratorOpts]()
        });
      }
      this.darkModeMediaQuery = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
      const isDarkModeOnFromTheStart = this.darkModeMediaQuery ? this.darkModeMediaQuery.matches : false;
      this.uppy.log(`[Dashboard] Dark mode is ${isDarkModeOnFromTheStart ? "on" : "off"}`);
      this.setDarkModeCapability(isDarkModeOnFromTheStart);
      if (this.opts.theme === "auto") {
        var _this$darkModeMediaQu;
        (_this$darkModeMediaQu = this.darkModeMediaQuery) == null || _this$darkModeMediaQu.addListener(this.handleSystemDarkModeChange);
      }
      _classPrivateFieldLooseBase2(this, _addSpecifiedPluginsFromOptions)[_addSpecifiedPluginsFromOptions]();
      _classPrivateFieldLooseBase2(this, _autoDiscoverPlugins)[_autoDiscoverPlugins]();
      this.initEvents();
    };
    this.uninstall = () => {
      if (!this.opts.disableInformer) {
        const informer = this.uppy.getPlugin(`${this.id}:Informer`);
        if (informer) this.uppy.removePlugin(informer);
      }
      if (!this.opts.disableStatusBar) {
        const statusBar = this.uppy.getPlugin(`${this.id}:StatusBar`);
        if (statusBar) this.uppy.removePlugin(statusBar);
      }
      if (!this.opts.disableThumbnailGenerator) {
        const thumbnail = this.uppy.getPlugin(`${this.id}:ThumbnailGenerator`);
        if (thumbnail) this.uppy.removePlugin(thumbnail);
      }
      const {
        plugins
      } = this.opts;
      plugins.forEach((pluginID) => {
        const plugin = this.uppy.getPlugin(pluginID);
        if (plugin) plugin.unmount();
      });
      if (this.opts.theme === "auto") {
        var _this$darkModeMediaQu2;
        (_this$darkModeMediaQu2 = this.darkModeMediaQuery) == null || _this$darkModeMediaQu2.removeListener(this.handleSystemDarkModeChange);
      }
      if (this.opts.disablePageScrollWhenModalOpen) {
        document.body.classList.remove("uppy-Dashboard-isFixed");
      }
      this.unmount();
      this.removeEvents();
    };
    this.id = this.opts.id || "Dashboard";
    this.title = "Dashboard";
    this.type = "orchestrator";
    this.defaultLocale = locale_default2;
    if (this.opts.doneButtonHandler === void 0) {
      this.opts.doneButtonHandler = () => {
        this.uppy.clear();
        this.requestCloseModal();
      };
    }
    (_this$opts$onRequestC = (_this$opts = this.opts).onRequestCloseModal) != null ? _this$opts$onRequestC : _this$opts.onRequestCloseModal = () => this.closeModal();
    this.i18nInit();
  }
  setOptions(opts) {
    var _this$uppy$getPlugin, _this$uppy$getPlugin2;
    super.setOptions(opts);
    (_this$uppy$getPlugin = this.uppy.getPlugin(_classPrivateFieldLooseBase2(this, _getStatusBarId)[_getStatusBarId]())) == null || _this$uppy$getPlugin.setOptions(_classPrivateFieldLooseBase2(this, _getStatusBarOpts)[_getStatusBarOpts]());
    (_this$uppy$getPlugin2 = this.uppy.getPlugin(_classPrivateFieldLooseBase2(this, _getThumbnailGeneratorId)[_getThumbnailGeneratorId]())) == null || _this$uppy$getPlugin2.setOptions(_classPrivateFieldLooseBase2(this, _getThumbnailGeneratorOpts)[_getThumbnailGeneratorOpts]());
  }
};
function _getStatusBarOpts2() {
  const {
    hideUploadButton,
    hideRetryButton,
    hidePauseResumeButton,
    hideCancelButton,
    showProgressDetails,
    hideProgressAfterFinish,
    locale: l4,
    doneButtonHandler
  } = this.opts;
  return {
    hideUploadButton,
    hideRetryButton,
    hidePauseResumeButton,
    hideCancelButton,
    showProgressDetails,
    hideAfterFinish: hideProgressAfterFinish,
    locale: l4,
    doneButtonHandler
  };
}
function _getThumbnailGeneratorOpts2() {
  const {
    thumbnailWidth,
    thumbnailHeight,
    thumbnailType,
    waitForThumbnailsBeforeUpload
  } = this.opts;
  return {
    thumbnailWidth,
    thumbnailHeight,
    thumbnailType,
    waitForThumbnailsBeforeUpload,
    // If we don't block on thumbnails, we can lazily generate them
    lazy: !waitForThumbnailsBeforeUpload
  };
}
function _getInformerOpts2() {
  return {
    // currently no options
  };
}
function _getStatusBarId2() {
  return `${this.id}:StatusBar`;
}
function _getThumbnailGeneratorId2() {
  return `${this.id}:ThumbnailGenerator`;
}
function _getInformerId2() {
  return `${this.id}:Informer`;
}
Dashboard2.VERSION = packageJson5.version;

// node_modules/@uppy/react/lib/getHTMLProps.js
var import_dist271 = __toESM(require_dist(), 1);
var import_dist272 = __toESM(require_dist2(), 1);
var import_dist273 = __toESM(require_dist3(), 1);
var reactSupportedHtmlAttr = [
  // React-specific Attributes
  "defaultChecked",
  "defaultValue",
  "suppressContentEditableWarning",
  "suppressHydrationWarning",
  "dangerouslySetInnerHTML",
  // Standard HTML Attributes
  "accessKey",
  "className",
  "contentEditable",
  "contextMenu",
  "dir",
  "draggable",
  "hidden",
  "id",
  "lang",
  "placeholder",
  "slot",
  "spellCheck",
  "style",
  "tabIndex",
  "title",
  "translate",
  // Unknown
  "radioGroup",
  // WAI-ARIA
  "role",
  // RDFa Attributes
  "about",
  "datatype",
  "inlist",
  "prefix",
  "property",
  "resource",
  "typeof",
  "vocab",
  // Non-standard Attributes
  "autoCapitalize",
  "autoCorrect",
  "autoSave",
  "color",
  "itemProp",
  "itemScope",
  "itemType",
  "itemID",
  "itemRef",
  "results",
  "security",
  "unselectable",
  // Living Standard
  "inputMode",
  "is",
  // Clipboard Events
  "onCopy",
  "onCopyCapture",
  "onCut",
  "onCutCapture",
  "onPaste",
  "onPasteCapture",
  // Composition Events
  "onCompositionEnd",
  "onCompositionEndCapture",
  "onCompositionStart",
  "onCompositionStartCapture",
  "onCompositionUpdate",
  "onCompositionUpdateCapture",
  // Focus Events
  "onFocus",
  "onFocusCapture",
  "onBlur",
  "onBlurCapture",
  // Form Events
  "onChange",
  "onChangeCapture",
  "onBeforeInput",
  "onBeforeInputCapture",
  "onInput",
  "onInputCapture",
  "onReset",
  "onResetCapture",
  "onSubmit",
  "onSubmitCapture",
  "onInvalid",
  "onInvalidCapture",
  // Image Events
  "onLoad",
  "onLoadCapture",
  "onError",
  // also a Media Event
  "onErrorCapture",
  // also a Media Event
  // Keyboard Events
  "onKeyDown",
  "onKeyDownCapture",
  "onKeyPress",
  "onKeyPressCapture",
  "onKeyUp",
  "onKeyUpCapture",
  // Media Events
  "onAbort",
  "onAbortCapture",
  "onCanPlay",
  "onCanPlayCapture",
  "onCanPlayThrough",
  "onCanPlayThroughCapture",
  "onDurationChange",
  "onDurationChangeCapture",
  "onEmptied",
  "onEmptiedCapture",
  "onEncrypted",
  "onEncryptedCapture",
  "onEnded",
  "onEndedCapture",
  "onLoadedData",
  "onLoadedDataCapture",
  "onLoadedMetadata",
  "onLoadedMetadataCapture",
  "onLoadStart",
  "onLoadStartCapture",
  "onPause",
  "onPauseCapture",
  "onPlay",
  "onPlayCapture",
  "onPlaying",
  "onPlayingCapture",
  "onProgress",
  "onProgressCapture",
  "onRateChange",
  "onRateChangeCapture",
  "onSeeked",
  "onSeekedCapture",
  "onSeeking",
  "onSeekingCapture",
  "onStalled",
  "onStalledCapture",
  "onSuspend",
  "onSuspendCapture",
  "onTimeUpdate",
  "onTimeUpdateCapture",
  "onVolumeChange",
  "onVolumeChangeCapture",
  "onWaiting",
  "onWaitingCapture",
  // MouseEvents
  "onAuxClick",
  "onAuxClickCapture",
  "onClick",
  "onClickCapture",
  "onContextMenu",
  "onContextMenuCapture",
  "onDoubleClick",
  "onDoubleClickCapture",
  "onDrag",
  "onDragCapture",
  "onDragEnd",
  "onDragEndCapture",
  "onDragEnter",
  "onDragEnterCapture",
  "onDragExit",
  "onDragExitCapture",
  "onDragLeave",
  "onDragLeaveCapture",
  "onDragOver",
  "onDragOverCapture",
  "onDragStart",
  "onDragStartCapture",
  "onDrop",
  "onDropCapture",
  "onMouseDown",
  "onMouseDownCapture",
  "onMouseEnter",
  "onMouseLeave",
  "onMouseMove",
  "onMouseMoveCapture",
  "onMouseOut",
  "onMouseOutCapture",
  "onMouseOver",
  "onMouseOverCapture",
  "onMouseUp",
  "onMouseUpCapture",
  // Selection Events
  "onSelect",
  "onSelectCapture",
  // Touch Events
  "onTouchCancel",
  "onTouchCancelCapture",
  "onTouchEnd",
  "onTouchEndCapture",
  "onTouchMove",
  "onTouchMoveCapture",
  "onTouchStart",
  "onTouchStartCapture",
  // Pointer Events
  "onPointerDown",
  "onPointerDownCapture",
  "onPointerMove",
  "onPointerMoveCapture",
  "onPointerUp",
  "onPointerUpCapture",
  "onPointerCancel",
  "onPointerCancelCapture",
  "onPointerEnter",
  "onPointerEnterCapture",
  "onPointerLeave",
  "onPointerLeaveCapture",
  "onPointerOver",
  "onPointerOverCapture",
  "onPointerOut",
  "onPointerOutCapture",
  "onGotPointerCapture",
  "onGotPointerCaptureCapture",
  "onLostPointerCapture",
  "onLostPointerCaptureCapture",
  // UI Events
  "onScroll",
  "onScrollCapture",
  // Wheel Events
  "onWheel",
  "onWheelCapture",
  // Animation Events
  "onAnimationStart",
  "onAnimationStartCapture",
  "onAnimationEnd",
  "onAnimationEndCapture",
  "onAnimationIteration",
  "onAnimationIterationCapture",
  // Transition Events
  "onTransitionEnd",
  "onTransitionEndCapture"
];
var validHTMLAttribute = /^(aria-|data-)/;
var getHTMLProps = (props) => {
  return Object.fromEntries(Object.entries(props).filter((_ref) => {
    let [key] = _ref;
    return validHTMLAttribute.test(key) || reactSupportedHtmlAttr.includes(key);
  }));
};
var getHTMLProps_default = getHTMLProps;

// node_modules/@uppy/react/lib/nonHtmlPropsHaveChanged.js
var import_dist274 = __toESM(require_dist(), 1);
var import_dist275 = __toESM(require_dist2(), 1);
var import_dist276 = __toESM(require_dist3(), 1);
function nonHtmlPropsHaveChanged(props, prevProps) {
  const htmlProps = getHTMLProps_default(props);
  return Object.keys(props).some((key) => !Object.hasOwn(htmlProps, key) && props[key] !== prevProps[key]);
}

// node_modules/@uppy/react/lib/Dashboard.js
var Dashboard3 = class extends import_react.Component {
  componentDidMount() {
    this.installPlugin();
  }
  componentDidUpdate(prevProps) {
    if (prevProps.uppy !== this.props.uppy) {
      this.uninstallPlugin(prevProps);
      this.installPlugin();
    } else if (nonHtmlPropsHaveChanged(this.props, prevProps)) {
      const {
        uppy,
        ...options
      } = {
        ...this.props,
        target: this.container
      };
      this.plugin.setOptions(options);
    }
  }
  componentWillUnmount() {
    this.uninstallPlugin();
  }
  installPlugin() {
    const {
      uppy,
      ...options
    } = {
      id: "Dashboard",
      ...this.props,
      inline: true,
      target: this.container
    };
    uppy.use(Dashboard2, options);
    this.plugin = uppy.getPlugin(options.id);
  }
  uninstallPlugin(props) {
    if (props === void 0) {
      props = this.props;
    }
    const {
      uppy
    } = props;
    uppy.removePlugin(this.plugin);
  }
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  render() {
    return (0, import_react.createElement)("div", {
      className: "uppy-Container",
      ref: (container) => {
        this.container = container;
      },
      ...getHTMLProps_default(this.props)
    });
  }
};
var Dashboard_default = Dashboard3;

// node_modules/@uppy/react/lib/DashboardModal.js
var import_dist280 = __toESM(require_dist(), 1);
var import_dist281 = __toESM(require_dist2(), 1);
var import_dist282 = __toESM(require_dist3(), 1);
var import_react2 = __toESM(require_react(), 1);
var DashboardModal = class extends import_react2.Component {
  componentDidMount() {
    this.installPlugin();
  }
  componentDidUpdate(prevProps) {
    const {
      uppy,
      open,
      onRequestClose
    } = this.props;
    if (prevProps.uppy !== uppy) {
      this.uninstallPlugin(prevProps);
      this.installPlugin();
    } else if (nonHtmlPropsHaveChanged(this.props, prevProps)) {
      const {
        uppy: uppy2,
        ...options
      } = {
        ...this.props,
        inline: false,
        onRequestCloseModal: onRequestClose
      };
      this.plugin.setOptions(options);
    }
    if (prevProps.open && !open) {
      this.plugin.closeModal();
    } else if (!prevProps.open && open) {
      this.plugin.openModal();
    }
  }
  componentWillUnmount() {
    this.uninstallPlugin();
  }
  installPlugin() {
    const {
      target = this.container,
      open,
      onRequestClose,
      uppy,
      ...rest
    } = this.props;
    const options = {
      id: "DashboardModal",
      ...rest,
      inline: false,
      target,
      open,
      onRequestCloseModal: onRequestClose
    };
    uppy.use(Dashboard2, options);
    this.plugin = uppy.getPlugin(options.id);
    if (open) {
      this.plugin.openModal();
    }
  }
  uninstallPlugin(props) {
    if (props === void 0) {
      props = this.props;
    }
    const {
      uppy
    } = props;
    uppy.removePlugin(this.plugin);
  }
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  render() {
    return (0, import_react2.createElement)("div", {
      className: "uppy-Container",
      ref: (container) => {
        this.container = container;
      },
      ...getHTMLProps_default(this.props)
    });
  }
};
DashboardModal.defaultProps = {
  open: void 0,
  onRequestClose: void 0
};
var DashboardModal_default = DashboardModal;

// node_modules/@uppy/react/lib/DragDrop.js
var import_dist283 = __toESM(require_dist(), 1);
var import_dist284 = __toESM(require_dist2(), 1);
var import_dist285 = __toESM(require_dist3(), 1);
var import_react3 = __toESM(require_react(), 1);
var import_drag_drop = __toESM(require_react2(), 1);
var DragDrop = class extends import_react3.Component {
  componentDidMount() {
    this.installPlugin();
  }
  componentDidUpdate(prevProps) {
    if (prevProps.uppy !== this.props.uppy) {
      this.uninstallPlugin(prevProps);
      this.installPlugin();
    } else if (nonHtmlPropsHaveChanged(this.props, prevProps)) {
      const {
        uppy,
        ...options
      } = {
        ...this.props,
        target: this.container
      };
      this.plugin.setOptions(options);
    }
  }
  componentWillUnmount() {
    this.uninstallPlugin();
  }
  installPlugin() {
    const {
      uppy,
      locale,
      inputName,
      width,
      height,
      note,
      id: id3
    } = this.props;
    const options = {
      id: id3 || "DragDrop",
      locale,
      inputName,
      width,
      height,
      note,
      target: this.container
    };
    uppy.use(import_drag_drop.default, options);
    this.plugin = uppy.getPlugin(options.id);
  }
  uninstallPlugin(props) {
    if (props === void 0) {
      props = this.props;
    }
    const {
      uppy
    } = props;
    uppy.removePlugin(this.plugin);
  }
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  render() {
    return (0, import_react3.createElement)("div", {
      className: "uppy-Container",
      ref: (container) => {
        this.container = container;
      },
      ...getHTMLProps_default(this.props)
    });
  }
};
var DragDrop_default = DragDrop;

// node_modules/@uppy/react/lib/ProgressBar.js
var import_dist286 = __toESM(require_dist(), 1);
var import_dist287 = __toESM(require_dist2(), 1);
var import_dist288 = __toESM(require_dist3(), 1);
var import_react4 = __toESM(require_react(), 1);
var import_progress_bar = __toESM(require_react3(), 1);
var ProgressBar = class extends import_react4.Component {
  componentDidMount() {
    this.installPlugin();
  }
  componentDidUpdate(prevProps) {
    if (prevProps.uppy !== this.props.uppy) {
      this.uninstallPlugin(prevProps);
      this.installPlugin();
    } else if (nonHtmlPropsHaveChanged(this.props, prevProps)) {
      const {
        uppy,
        ...options
      } = {
        ...this.props,
        target: this.container
      };
      this.plugin.setOptions(options);
    }
  }
  componentWillUnmount() {
    this.uninstallPlugin();
  }
  installPlugin() {
    const {
      uppy,
      fixed,
      hideAfterFinish,
      id: id3
    } = this.props;
    const options = {
      id: id3 || "ProgressBar",
      fixed,
      hideAfterFinish,
      target: this.container
    };
    uppy.use(import_progress_bar.default, options);
    this.plugin = uppy.getPlugin(options.id);
  }
  uninstallPlugin(props) {
    if (props === void 0) {
      props = this.props;
    }
    const {
      uppy
    } = props;
    uppy.removePlugin(this.plugin);
  }
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  render() {
    return (0, import_react4.createElement)("div", {
      className: "uppy-Container",
      ref: (container) => {
        this.container = container;
      },
      ...getHTMLProps_default(this.props)
    });
  }
};
var ProgressBar_default = ProgressBar;

// node_modules/@uppy/react/lib/StatusBar.js
var import_dist289 = __toESM(require_dist(), 1);
var import_dist290 = __toESM(require_dist2(), 1);
var import_dist291 = __toESM(require_dist3(), 1);
var import_react5 = __toESM(require_react(), 1);
var StatusBar2 = class extends import_react5.Component {
  componentDidMount() {
    this.installPlugin();
  }
  componentDidUpdate(prevProps) {
    if (prevProps.uppy !== this.props.uppy) {
      this.uninstallPlugin(prevProps);
      this.installPlugin();
    } else if (nonHtmlPropsHaveChanged(this.props, prevProps)) {
      const {
        uppy,
        ...options
      } = {
        ...this.props,
        target: this.container
      };
      this.plugin.setOptions(options);
    }
  }
  componentWillUnmount() {
    this.uninstallPlugin();
  }
  installPlugin() {
    const {
      uppy,
      hideUploadButton,
      hideRetryButton,
      hidePauseResumeButton,
      hideCancelButton,
      showProgressDetails,
      hideAfterFinish,
      doneButtonHandler,
      id: id3
    } = this.props;
    const options = {
      id: id3 || "StatusBar",
      hideUploadButton,
      hideRetryButton,
      hidePauseResumeButton,
      hideCancelButton,
      showProgressDetails,
      hideAfterFinish,
      doneButtonHandler,
      target: this.container
    };
    uppy.use(StatusBar, options);
    this.plugin = uppy.getPlugin(options.id);
  }
  uninstallPlugin(props) {
    if (props === void 0) {
      props = this.props;
    }
    const {
      uppy
    } = props;
    uppy.removePlugin(this.plugin);
  }
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  render() {
    return (0, import_react5.createElement)("div", {
      className: "uppy-Container",
      ref: (container) => {
        this.container = container;
      },
      ...getHTMLProps_default(this.props)
    });
  }
};
var StatusBar_default = StatusBar2;

// node_modules/@uppy/react/lib/FileInput.js
var import_dist292 = __toESM(require_dist(), 1);
var import_dist293 = __toESM(require_dist2(), 1);
var import_dist294 = __toESM(require_dist3(), 1);
var import_react6 = __toESM(require_react(), 1);
var import_file_input = __toESM(require_react4(), 1);
var FileInput = class extends import_react6.Component {
  componentDidMount() {
    this.installPlugin();
  }
  componentDidUpdate(prevProps) {
    if (prevProps.uppy !== this.props.uppy) {
      this.uninstallPlugin(prevProps);
      this.installPlugin();
    }
  }
  componentWillUnmount() {
    this.uninstallPlugin();
  }
  installPlugin() {
    const {
      uppy,
      locale,
      pretty,
      inputName,
      id: id3
    } = this.props;
    const options = {
      id: id3 || "FileInput",
      locale,
      pretty,
      inputName,
      target: this.container
    };
    uppy.use(import_file_input.default, options);
    this.plugin = uppy.getPlugin(options.id);
  }
  uninstallPlugin(props) {
    if (props === void 0) {
      props = this.props;
    }
    const {
      uppy
    } = props;
    uppy.removePlugin(this.plugin);
  }
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  render() {
    return (0, import_react6.createElement)("div", {
      className: "uppy-Container",
      ref: (container) => {
        this.container = container;
      }
    });
  }
};
FileInput.defaultProps = {
  locale: void 0,
  pretty: true,
  inputName: "files[]"
};
var FileInput_default = FileInput;

// node_modules/@uppy/react/lib/useUppyState.js
var import_dist295 = __toESM(require_dist(), 1);
var import_dist296 = __toESM(require_dist2(), 1);
var import_dist297 = __toESM(require_dist3(), 1);
var import_react7 = __toESM(require_react(), 1);
var import_with_selector = __toESM(require_with_selector(), 1);
function useUppyState(uppy, selector) {
  const subscribe = (0, import_react7.useMemo)(() => uppy.store.subscribe.bind(uppy.store), [uppy.store]);
  const getSnapshot = (0, import_react7.useCallback)(() => uppy.store.getState(), [uppy.store]);
  return (0, import_with_selector.useSyncExternalStoreWithSelector)(
    subscribe,
    getSnapshot,
    // client
    getSnapshot,
    // server
    selector
  );
}

// node_modules/@uppy/react/lib/useUppyEvent.js
var import_dist298 = __toESM(require_dist(), 1);
var import_dist299 = __toESM(require_dist2(), 1);
var import_dist300 = __toESM(require_dist3(), 1);
var import_react8 = __toESM(require_react(), 1);
function useUppyEvent(uppy, event, callback) {
  const [result, setResult] = (0, import_react8.useState)([]);
  const clear = () => setResult([]);
  (0, import_react8.useEffect)(() => {
    const handler = function() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      setResult(args);
      callback == null || callback(...args);
    };
    uppy.on(event, handler);
    return function cleanup() {
      uppy.off(event, handler);
    };
  }, [uppy, event, callback]);
  return [result, clear];
}
export {
  Dashboard_default as Dashboard,
  DashboardModal_default as DashboardModal,
  DragDrop_default as DragDrop,
  FileInput_default as FileInput,
  ProgressBar_default as ProgressBar,
  StatusBar_default as StatusBar,
  useUppyEvent,
  useUppyState
};
/*! Bundled license information:

use-sync-external-store/cjs/use-sync-external-store-with-selector.production.js:
  (**
   * @license React
   * use-sync-external-store-with-selector.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

use-sync-external-store/cjs/use-sync-external-store-with-selector.development.js:
  (**
   * @license React
   * use-sync-external-store-with-selector.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
//# sourceMappingURL=@uppy_react.js.map
