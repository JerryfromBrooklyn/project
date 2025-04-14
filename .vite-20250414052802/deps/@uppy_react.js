import __buffer_polyfill from 'vite-plugin-node-polyfills/shims/buffer'
globalThis.Buffer = globalThis.Buffer || __buffer_polyfill
import __global_polyfill from 'vite-plugin-node-polyfills/shims/global'
globalThis.global = globalThis.global || __global_polyfill
import __process_polyfill from 'vite-plugin-node-polyfills/shims/process'
globalThis.process = globalThis.process || __process_polyfill

import {
  StatusBar
} from "./chunk-7Z7YQ7NU.js";
import "./chunk-JTUKK432.js";
import {
  require_react
} from "./chunk-OUB4EOU6.js";
import {
  __commonJS,
  __toESM,
  require_dist,
  require_dist2,
  require_dist3
} from "./chunk-QQN4L6SB.js";

// optional-peer-dep:__vite-optional-peer-dep:@uppy/dashboard:@uppy/react
var require_react2 = __commonJS({
  "optional-peer-dep:__vite-optional-peer-dep:@uppy/dashboard:@uppy/react"() {
    var import_dist34 = __toESM(require_dist());
    var import_dist35 = __toESM(require_dist2());
    var import_dist36 = __toESM(require_dist3());
    throw new Error(`Could not resolve "@uppy/dashboard" imported by "@uppy/react". Is it installed?`);
  }
});

// optional-peer-dep:__vite-optional-peer-dep:@uppy/drag-drop:@uppy/react
var require_react3 = __commonJS({
  "optional-peer-dep:__vite-optional-peer-dep:@uppy/drag-drop:@uppy/react"() {
    var import_dist34 = __toESM(require_dist());
    var import_dist35 = __toESM(require_dist2());
    var import_dist36 = __toESM(require_dist3());
    throw new Error(`Could not resolve "@uppy/drag-drop" imported by "@uppy/react". Is it installed?`);
  }
});

// optional-peer-dep:__vite-optional-peer-dep:@uppy/progress-bar:@uppy/react
var require_react4 = __commonJS({
  "optional-peer-dep:__vite-optional-peer-dep:@uppy/progress-bar:@uppy/react"() {
    var import_dist34 = __toESM(require_dist());
    var import_dist35 = __toESM(require_dist2());
    var import_dist36 = __toESM(require_dist3());
    throw new Error(`Could not resolve "@uppy/progress-bar" imported by "@uppy/react". Is it installed?`);
  }
});

// optional-peer-dep:__vite-optional-peer-dep:@uppy/file-input:@uppy/react
var require_react5 = __commonJS({
  "optional-peer-dep:__vite-optional-peer-dep:@uppy/file-input:@uppy/react"() {
    var import_dist34 = __toESM(require_dist());
    var import_dist35 = __toESM(require_dist2());
    var import_dist36 = __toESM(require_dist3());
    throw new Error(`Could not resolve "@uppy/file-input" imported by "@uppy/react". Is it installed?`);
  }
});

// node_modules/use-sync-external-store/cjs/use-sync-external-store-with-selector.production.js
var require_use_sync_external_store_with_selector_production = __commonJS({
  "node_modules/use-sync-external-store/cjs/use-sync-external-store-with-selector.production.js"(exports) {
    "use strict";
    var import_dist34 = __toESM(require_dist());
    var import_dist35 = __toESM(require_dist2());
    var import_dist36 = __toESM(require_dist3());
    var React = require_react();
    function is(x, y) {
      return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
    }
    var objectIs = "function" === typeof Object.is ? Object.is : is;
    var useSyncExternalStore = React.useSyncExternalStore;
    var useRef = React.useRef;
    var useEffect2 = React.useEffect;
    var useMemo2 = React.useMemo;
    var useDebugValue = React.useDebugValue;
    exports.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
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
              if (void 0 !== isEqual && inst.hasValue) {
                var currentSelection = inst.value;
                if (isEqual(currentSelection, nextSnapshot))
                  return memoizedSelection = currentSelection;
              }
              return memoizedSelection = nextSnapshot;
            }
            currentSelection = memoizedSelection;
            if (objectIs(memoizedSnapshot, nextSnapshot)) return currentSelection;
            var nextSelection = selector(nextSnapshot);
            if (void 0 !== isEqual && isEqual(currentSelection, nextSelection))
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
        [getSnapshot, getServerSnapshot, selector, isEqual]
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
    var import_dist34 = __toESM(require_dist());
    var import_dist35 = __toESM(require_dist2());
    var import_dist36 = __toESM(require_dist3());
    "production" !== process.env.NODE_ENV && function() {
      function is(x, y) {
        return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var React = require_react(), objectIs = "function" === typeof Object.is ? Object.is : is, useSyncExternalStore = React.useSyncExternalStore, useRef = React.useRef, useEffect2 = React.useEffect, useMemo2 = React.useMemo, useDebugValue = React.useDebugValue;
      exports.useSyncExternalStoreWithSelector = function(subscribe, getSnapshot, getServerSnapshot, selector, isEqual) {
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
                if (void 0 !== isEqual && inst.hasValue) {
                  var currentSelection = inst.value;
                  if (isEqual(currentSelection, nextSnapshot))
                    return memoizedSelection = currentSelection;
                }
                return memoizedSelection = nextSnapshot;
              }
              currentSelection = memoizedSelection;
              if (objectIs(memoizedSnapshot, nextSnapshot))
                return currentSelection;
              var nextSelection = selector(nextSnapshot);
              if (void 0 !== isEqual && isEqual(currentSelection, nextSelection))
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
          [getSnapshot, getServerSnapshot, selector, isEqual]
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
    var import_dist34 = __toESM(require_dist());
    var import_dist35 = __toESM(require_dist2());
    var import_dist36 = __toESM(require_dist3());
    if (process.env.NODE_ENV === "production") {
      module.exports = require_use_sync_external_store_with_selector_production();
    } else {
      module.exports = require_use_sync_external_store_with_selector_development();
    }
  }
});

// node_modules/@uppy/react/lib/index.js
var import_dist31 = __toESM(require_dist());
var import_dist32 = __toESM(require_dist2());
var import_dist33 = __toESM(require_dist3());

// node_modules/@uppy/react/lib/Dashboard.js
var import_dist7 = __toESM(require_dist(), 1);
var import_dist8 = __toESM(require_dist2(), 1);
var import_dist9 = __toESM(require_dist3(), 1);
var import_react = __toESM(require_react(), 1);
var import_dashboard = __toESM(require_react2(), 1);

// node_modules/@uppy/react/lib/getHTMLProps.js
var import_dist = __toESM(require_dist(), 1);
var import_dist2 = __toESM(require_dist2(), 1);
var import_dist3 = __toESM(require_dist3(), 1);
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
var import_dist4 = __toESM(require_dist(), 1);
var import_dist5 = __toESM(require_dist2(), 1);
var import_dist6 = __toESM(require_dist3(), 1);
function nonHtmlPropsHaveChanged(props, prevProps) {
  const htmlProps = getHTMLProps_default(props);
  return Object.keys(props).some((key) => !Object.hasOwn(htmlProps, key) && props[key] !== prevProps[key]);
}

// node_modules/@uppy/react/lib/Dashboard.js
var Dashboard = class extends import_react.Component {
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
    uppy.use(import_dashboard.default, options);
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
var Dashboard_default = Dashboard;

// node_modules/@uppy/react/lib/DashboardModal.js
var import_dist10 = __toESM(require_dist(), 1);
var import_dist11 = __toESM(require_dist2(), 1);
var import_dist12 = __toESM(require_dist3(), 1);
var import_react2 = __toESM(require_react(), 1);
var import_dashboard2 = __toESM(require_react2(), 1);
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
    uppy.use(import_dashboard2.default, options);
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
var import_dist13 = __toESM(require_dist(), 1);
var import_dist14 = __toESM(require_dist2(), 1);
var import_dist15 = __toESM(require_dist3(), 1);
var import_react3 = __toESM(require_react(), 1);
var import_drag_drop = __toESM(require_react3(), 1);
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
      id
    } = this.props;
    const options = {
      id: id || "DragDrop",
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
var import_dist16 = __toESM(require_dist(), 1);
var import_dist17 = __toESM(require_dist2(), 1);
var import_dist18 = __toESM(require_dist3(), 1);
var import_react4 = __toESM(require_react(), 1);
var import_progress_bar = __toESM(require_react4(), 1);
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
      id
    } = this.props;
    const options = {
      id: id || "ProgressBar",
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
var import_dist19 = __toESM(require_dist(), 1);
var import_dist20 = __toESM(require_dist2(), 1);
var import_dist21 = __toESM(require_dist3(), 1);
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
      id
    } = this.props;
    const options = {
      id: id || "StatusBar",
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
var import_dist22 = __toESM(require_dist(), 1);
var import_dist23 = __toESM(require_dist2(), 1);
var import_dist24 = __toESM(require_dist3(), 1);
var import_react6 = __toESM(require_react(), 1);
var import_file_input = __toESM(require_react5(), 1);
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
      id
    } = this.props;
    const options = {
      id: id || "FileInput",
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
var import_dist25 = __toESM(require_dist(), 1);
var import_dist26 = __toESM(require_dist2(), 1);
var import_dist27 = __toESM(require_dist3(), 1);
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
var import_dist28 = __toESM(require_dist(), 1);
var import_dist29 = __toESM(require_dist2(), 1);
var import_dist30 = __toESM(require_dist3(), 1);
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
