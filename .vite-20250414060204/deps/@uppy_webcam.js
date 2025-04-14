import __buffer_polyfill from 'vite-plugin-node-polyfills/shims/buffer'
globalThis.Buffer = globalThis.Buffer || __buffer_polyfill
import __global_polyfill from 'vite-plugin-node-polyfills/shims/global'
globalThis.global = globalThis.global || __global_polyfill
import __process_polyfill from 'vite-plugin-node-polyfills/shims/process'
globalThis.process = globalThis.process || __process_polyfill

import {
  UIPlugin_default,
  _,
  mimeTypes_default,
  x
} from "./chunk-L6BRPP5D.js";
import {
  __commonJS,
  __toESM,
  require_dist,
  require_dist2,
  require_dist3
} from "./chunk-YJHZJMYG.js";

// node_modules/is-mobile/index.js
var require_is_mobile = __commonJS({
  "node_modules/is-mobile/index.js"(exports, module) {
    "use strict";
    var import_dist49 = __toESM(require_dist());
    var import_dist50 = __toESM(require_dist2());
    var import_dist51 = __toESM(require_dist3());
    module.exports = isMobile2;
    module.exports.isMobile = isMobile2;
    module.exports.default = isMobile2;
    var mobileRE = /(android|bb\d+|meego).+mobile|armv7l|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series[46]0|samsungbrowser.*mobile|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i;
    var notMobileRE = /CrOS/;
    var tabletRE = /android|ipad|playbook|silk/i;
    function isMobile2(opts) {
      if (!opts) opts = {};
      let ua = opts.ua;
      if (!ua && typeof navigator !== "undefined") ua = navigator.userAgent;
      if (ua && ua.headers && typeof ua.headers["user-agent"] === "string") {
        ua = ua.headers["user-agent"];
      }
      if (typeof ua !== "string") return false;
      let result = mobileRE.test(ua) && !notMobileRE.test(ua) || !!opts.tablet && tabletRE.test(ua);
      if (!result && opts.tablet && opts.featureDetect && navigator && navigator.maxTouchPoints > 1 && ua.indexOf("Macintosh") !== -1 && ua.indexOf("Safari") !== -1) {
        result = true;
      }
      return result;
    }
  }
});

// node_modules/@uppy/webcam/lib/index.js
var import_dist46 = __toESM(require_dist());
var import_dist47 = __toESM(require_dist2());
var import_dist48 = __toESM(require_dist3());

// node_modules/@uppy/webcam/lib/Webcam.js
var import_dist43 = __toESM(require_dist(), 1);
var import_dist44 = __toESM(require_dist2(), 1);
var import_dist45 = __toESM(require_dist3(), 1);

// node_modules/@uppy/utils/lib/getFileTypeExtension.js
var import_dist = __toESM(require_dist());
var import_dist2 = __toESM(require_dist2());
var import_dist3 = __toESM(require_dist3());
var mimeToExtensions = {
  __proto__: null,
  "audio/mp3": "mp3",
  "audio/mp4": "mp4",
  "audio/ogg": "ogg",
  "audio/webm": "webm",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "video/ogg": "ogv",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/x-matroska": "mkv",
  "video/x-msvideo": "avi"
};
function getFileTypeExtension(mimeType) {
  ;
  [mimeType] = mimeType.split(";", 1);
  return mimeToExtensions[mimeType] || null;
}

// node_modules/@uppy/webcam/lib/Webcam.js
var import_is_mobile = __toESM(require_is_mobile(), 1);

// node_modules/@uppy/utils/lib/canvasToBlob.js
var import_dist4 = __toESM(require_dist());
var import_dist5 = __toESM(require_dist2());
var import_dist6 = __toESM(require_dist3());
function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

// node_modules/@uppy/webcam/lib/supportsMediaRecorder.js
var import_dist7 = __toESM(require_dist(), 1);
var import_dist8 = __toESM(require_dist2(), 1);
var import_dist9 = __toESM(require_dist3(), 1);
function supportsMediaRecorder() {
  return typeof MediaRecorder === "function" && !!MediaRecorder.prototype && typeof MediaRecorder.prototype.start === "function";
}

// node_modules/@uppy/webcam/lib/CameraIcon.js
var import_dist10 = __toESM(require_dist(), 1);
var import_dist11 = __toESM(require_dist2(), 1);
var import_dist12 = __toESM(require_dist3(), 1);
function CameraIcon() {
  return _("svg", {
    "aria-hidden": "true",
    focusable: "false",
    fill: "#0097DC",
    width: "66",
    height: "55",
    viewBox: "0 0 66 55"
  }, _("path", {
    d: "M57.3 8.433c4.59 0 8.1 3.51 8.1 8.1v29.7c0 4.59-3.51 8.1-8.1 8.1H8.7c-4.59 0-8.1-3.51-8.1-8.1v-29.7c0-4.59 3.51-8.1 8.1-8.1h9.45l4.59-7.02c.54-.54 1.35-1.08 2.16-1.08h16.2c.81 0 1.62.54 2.16 1.08l4.59 7.02h9.45zM33 14.64c-8.62 0-15.393 6.773-15.393 15.393 0 8.62 6.773 15.393 15.393 15.393 8.62 0 15.393-6.773 15.393-15.393 0-8.62-6.773-15.393-15.393-15.393zM33 40c-5.648 0-9.966-4.319-9.966-9.967 0-5.647 4.318-9.966 9.966-9.966s9.966 4.319 9.966 9.966C42.966 35.681 38.648 40 33 40z",
    fillRule: "evenodd"
  }));
}

// node_modules/@uppy/webcam/lib/CameraScreen.js
var import_dist34 = __toESM(require_dist(), 1);
var import_dist35 = __toESM(require_dist2(), 1);
var import_dist36 = __toESM(require_dist3(), 1);

// node_modules/@uppy/webcam/lib/SnapshotButton.js
var import_dist13 = __toESM(require_dist(), 1);
var import_dist14 = __toESM(require_dist2(), 1);
var import_dist15 = __toESM(require_dist3(), 1);
function SnapshotButton(_ref) {
  let {
    onSnapshot,
    i18n
  } = _ref;
  return _("button", {
    className: "uppy-u-reset uppy-c-btn uppy-Webcam-button uppy-Webcam-button--picture",
    type: "button",
    title: i18n("takePicture"),
    "aria-label": i18n("takePicture"),
    onClick: onSnapshot,
    "data-uppy-super-focusable": true
  }, CameraIcon());
}

// node_modules/@uppy/webcam/lib/RecordButton.js
var import_dist16 = __toESM(require_dist(), 1);
var import_dist17 = __toESM(require_dist2(), 1);
var import_dist18 = __toESM(require_dist3(), 1);
function RecordButton(_ref) {
  let {
    recording,
    onStartRecording,
    onStopRecording,
    i18n
  } = _ref;
  if (recording) {
    return _("button", {
      className: "uppy-u-reset uppy-c-btn uppy-Webcam-button",
      type: "button",
      title: i18n("stopRecording"),
      "aria-label": i18n("stopRecording"),
      onClick: onStopRecording,
      "data-uppy-super-focusable": true
    }, _("svg", {
      "aria-hidden": "true",
      focusable: "false",
      className: "uppy-c-icon",
      width: "100",
      height: "100",
      viewBox: "0 0 100 100"
    }, _("rect", {
      x: "15",
      y: "15",
      width: "70",
      height: "70"
    })));
  }
  return _("button", {
    className: "uppy-u-reset uppy-c-btn uppy-Webcam-button",
    type: "button",
    title: i18n("startRecording"),
    "aria-label": i18n("startRecording"),
    onClick: onStartRecording,
    "data-uppy-super-focusable": true
  }, _("svg", {
    "aria-hidden": "true",
    focusable: "false",
    className: "uppy-c-icon",
    width: "100",
    height: "100",
    viewBox: "0 0 100 100"
  }, _("circle", {
    cx: "50",
    cy: "50",
    r: "40"
  })));
}

// node_modules/@uppy/webcam/lib/RecordingLength.js
var import_dist22 = __toESM(require_dist(), 1);
var import_dist23 = __toESM(require_dist2(), 1);
var import_dist24 = __toESM(require_dist3(), 1);

// node_modules/@uppy/webcam/lib/formatSeconds.js
var import_dist19 = __toESM(require_dist(), 1);
var import_dist20 = __toESM(require_dist2(), 1);
var import_dist21 = __toESM(require_dist3(), 1);
function formatSeconds(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

// node_modules/@uppy/webcam/lib/RecordingLength.js
function RecordingLength(_ref) {
  let {
    recordingLengthSeconds,
    i18n
  } = _ref;
  const formattedRecordingLengthSeconds = formatSeconds(recordingLengthSeconds);
  return _("span", {
    "aria-label": i18n("recordingLength", {
      recording_length: formattedRecordingLengthSeconds
    })
  }, formattedRecordingLengthSeconds);
}

// node_modules/@uppy/webcam/lib/VideoSourceSelect.js
var import_dist25 = __toESM(require_dist(), 1);
var import_dist26 = __toESM(require_dist2(), 1);
var import_dist27 = __toESM(require_dist3(), 1);
function VideoSourceSelect(_ref) {
  let {
    currentDeviceId,
    videoSources,
    onChangeVideoSource
  } = _ref;
  return _("div", {
    className: "uppy-Webcam-videoSource"
  }, _("select", {
    className: "uppy-u-reset uppy-Webcam-videoSource-select",
    onChange: (event) => {
      onChangeVideoSource(event.target.value);
    }
  }, videoSources.map((videoSource) => _("option", {
    key: videoSource.deviceId,
    value: videoSource.deviceId,
    selected: videoSource.deviceId === currentDeviceId
  }, videoSource.label))));
}

// node_modules/@uppy/webcam/lib/SubmitButton.js
var import_dist28 = __toESM(require_dist(), 1);
var import_dist29 = __toESM(require_dist2(), 1);
var import_dist30 = __toESM(require_dist3(), 1);
function SubmitButton(_ref) {
  let {
    onSubmit,
    i18n
  } = _ref;
  return _("button", {
    className: "uppy-u-reset uppy-c-btn uppy-Webcam-button uppy-Webcam-button--submit",
    type: "button",
    title: i18n("submitRecordedFile"),
    "aria-label": i18n("submitRecordedFile"),
    onClick: onSubmit,
    "data-uppy-super-focusable": true
  }, _("svg", {
    width: "12",
    height: "9",
    viewBox: "0 0 12 9",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": "true",
    focusable: "false",
    className: "uppy-c-icon"
  }, _("path", {
    fill: "#fff",
    fillRule: "nonzero",
    d: "M10.66 0L12 1.31 4.136 9 0 4.956l1.34-1.31L4.136 6.38z"
  })));
}
var SubmitButton_default = SubmitButton;

// node_modules/@uppy/webcam/lib/DiscardButton.js
var import_dist31 = __toESM(require_dist(), 1);
var import_dist32 = __toESM(require_dist2(), 1);
var import_dist33 = __toESM(require_dist3(), 1);
function DiscardButton(_ref) {
  let {
    onDiscard,
    i18n
  } = _ref;
  return _("button", {
    className: "uppy-u-reset uppy-c-btn uppy-Webcam-button uppy-Webcam-button--discard",
    type: "button",
    title: i18n("discardRecordedFile"),
    "aria-label": i18n("discardRecordedFile"),
    onClick: onDiscard,
    "data-uppy-super-focusable": true
  }, _("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 13 13",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": "true",
    focusable: "false",
    className: "uppy-c-icon"
  }, _("g", {
    fill: "#FFF",
    fillRule: "evenodd"
  }, _("path", {
    d: "M.496 11.367L11.103.76l1.414 1.414L1.911 12.781z"
  }), _("path", {
    d: "M11.104 12.782L.497 2.175 1.911.76l10.607 10.606z"
  }))));
}
var DiscardButton_default = DiscardButton;

// node_modules/@uppy/webcam/lib/CameraScreen.js
function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function(n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
}
function isModeAvailable(modes, mode) {
  return modes.includes(mode);
}
var CameraScreen = class extends x {
  componentDidMount() {
    const {
      onFocus
    } = this.props;
    onFocus();
  }
  componentWillUnmount() {
    const {
      onStop
    } = this.props;
    onStop();
  }
  render() {
    const {
      src,
      recordedVideo,
      recording,
      modes,
      supportsRecording,
      videoSources,
      showVideoSourceDropdown,
      showRecordingLength,
      onSubmit,
      i18n,
      mirror,
      onSnapshot,
      onStartRecording,
      onStopRecording,
      onDiscardRecordedVideo,
      recordingLengthSeconds
    } = this.props;
    const hasRecordedVideo = !!recordedVideo;
    const shouldShowRecordButton = !hasRecordedVideo && supportsRecording && (isModeAvailable(modes, "video-only") || isModeAvailable(modes, "audio-only") || isModeAvailable(modes, "video-audio"));
    const shouldShowSnapshotButton = !hasRecordedVideo && isModeAvailable(modes, "picture");
    const shouldShowRecordingLength = supportsRecording && showRecordingLength && !hasRecordedVideo;
    const shouldShowVideoSourceDropdown = showVideoSourceDropdown && videoSources && videoSources.length > 1;
    const videoProps = {
      playsInline: true
    };
    if (recordedVideo) {
      videoProps.muted = false;
      videoProps.controls = true;
      videoProps.src = recordedVideo;
      if (this.videoElement) {
        this.videoElement.srcObject = null;
      }
    } else {
      videoProps.muted = true;
      videoProps.autoPlay = true;
      videoProps.srcObject = src;
    }
    return _("div", {
      className: "uppy uppy-Webcam-container"
    }, _("div", {
      className: "uppy-Webcam-videoContainer"
    }, _("video", _extends({
      /* eslint-disable-next-line no-return-assign */
      ref: (videoElement) => this.videoElement = videoElement,
      className: `uppy-Webcam-video  ${mirror ? "uppy-Webcam-video--mirrored" : ""}`
      /* eslint-disable-next-line react/jsx-props-no-spreading */
    }, videoProps))), _("div", {
      className: "uppy-Webcam-footer"
    }, _("div", {
      className: "uppy-Webcam-videoSourceContainer"
    }, shouldShowVideoSourceDropdown ? VideoSourceSelect(this.props) : null), _("div", {
      className: "uppy-Webcam-buttonContainer"
    }, shouldShowSnapshotButton && _(SnapshotButton, {
      onSnapshot,
      i18n
    }), shouldShowRecordButton && _(RecordButton, {
      recording,
      onStartRecording,
      onStopRecording,
      i18n
    }), hasRecordedVideo && _(SubmitButton_default, {
      onSubmit,
      i18n
    }), hasRecordedVideo && _(DiscardButton_default, {
      onDiscard: onDiscardRecordedVideo,
      i18n
    })), _("div", {
      className: "uppy-Webcam-recordingLength"
    }, shouldShowRecordingLength && _(RecordingLength, {
      recordingLengthSeconds,
      i18n
    }))));
  }
};
var CameraScreen_default = CameraScreen;

// node_modules/@uppy/webcam/lib/PermissionsScreen.js
var import_dist37 = __toESM(require_dist(), 1);
var import_dist38 = __toESM(require_dist2(), 1);
var import_dist39 = __toESM(require_dist3(), 1);
function PermissionsScreen(_ref) {
  let {
    icon,
    i18n,
    hasCamera
  } = _ref;
  return _("div", {
    className: "uppy-Webcam-permissons"
  }, _("div", {
    className: "uppy-Webcam-permissonsIcon"
  }, icon()), _("div", {
    className: "uppy-Webcam-title"
  }, hasCamera ? i18n("allowAccessTitle") : i18n("noCameraTitle")), _("p", null, hasCamera ? i18n("allowAccessDescription") : i18n("noCameraDescription")));
}

// node_modules/@uppy/webcam/lib/locale.js
var import_dist40 = __toESM(require_dist(), 1);
var import_dist41 = __toESM(require_dist2(), 1);
var import_dist42 = __toESM(require_dist3(), 1);
var locale_default = {
  strings: {
    pluginNameCamera: "Camera",
    noCameraTitle: "Camera Not Available",
    noCameraDescription: "In order to take pictures or record video, please connect a camera device",
    recordingStoppedMaxSize: "Recording stopped because the file size is about to exceed the limit",
    submitRecordedFile: "Submit recorded file",
    discardRecordedFile: "Discard recorded file",
    // Shown before a picture is taken when the `countdown` option is set.
    smile: "Smile!",
    // Used as the label for the button that takes a picture.
    // This is not visibly rendered but is picked up by screen readers.
    takePicture: "Take a picture",
    // Used as the label for the button that starts a video recording.
    // This is not visibly rendered but is picked up by screen readers.
    startRecording: "Begin video recording",
    // Used as the label for the button that stops a video recording.
    // This is not visibly rendered but is picked up by screen readers.
    stopRecording: "Stop video recording",
    // Used as the label for the recording length counter. See the showRecordingLength option.
    // This is not visibly rendered but is picked up by screen readers.
    recordingLength: "Recording length %{recording_length}",
    // Title on the “allow access” screen
    allowAccessTitle: "Please allow access to your camera",
    // Description on the “allow access” screen
    allowAccessDescription: "In order to take pictures or record video with your camera, please allow camera access for this site."
  }
};

// node_modules/@uppy/webcam/lib/Webcam.js
function _extends2() {
  return _extends2 = Object.assign ? Object.assign.bind() : function(n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends2.apply(null, arguments);
}
function _classPrivateFieldLooseBase(e, t) {
  if (!{}.hasOwnProperty.call(e, t)) throw new TypeError("attempted to use private field on non-instance");
  return e;
}
var id = 0;
function _classPrivateFieldLooseKey(e) {
  return "__private_" + id++ + "_" + e;
}
var packageJson = {
  "version": "4.1.2"
};
function toMimeType(fileType) {
  if (fileType[0] === ".") {
    return mimeTypes_default[fileType.slice(1)];
  }
  return fileType;
}
function isVideoMimeType(mimeType) {
  return /^video\/[^*]+$/.test(mimeType);
}
function isImageMimeType(mimeType) {
  return /^image\/[^*]+$/.test(mimeType);
}
function getMediaDevices() {
  return navigator.mediaDevices;
}
function isModeAvailable2(modes, mode) {
  return modes.includes(mode);
}
var defaultOptions = {
  onBeforeSnapshot: () => Promise.resolve(),
  countdown: false,
  modes: ["video-audio", "video-only", "audio-only", "picture"],
  mirror: true,
  showVideoSourceDropdown: false,
  preferredImageMimeType: null,
  preferredVideoMimeType: null,
  showRecordingLength: false,
  mobileNativeCamera: (0, import_is_mobile.default)({
    tablet: true
  })
};
var _enableMirror = _classPrivateFieldLooseKey("enableMirror");
var Webcam = class extends UIPlugin_default {
  constructor(uppy, opts) {
    super(uppy, {
      ...defaultOptions,
      ...opts
    });
    Object.defineProperty(this, _enableMirror, {
      writable: true,
      value: void 0
    });
    this.stream = null;
    this.recorder = null;
    this.recordingChunks = null;
    this.captureInProgress = false;
    this.mediaDevices = getMediaDevices();
    this.supportsUserMedia = !!this.mediaDevices;
    this.protocol = location.protocol.match(/https/i) ? "https" : "http";
    this.id = this.opts.id || "Webcam";
    this.type = "acquirer";
    this.capturedMediaFile = null;
    this.icon = () => _("svg", {
      "aria-hidden": "true",
      focusable: "false",
      width: "32",
      height: "32",
      viewBox: "0 0 32 32"
    }, _("path", {
      d: "M23.5 9.5c1.417 0 2.5 1.083 2.5 2.5v9.167c0 1.416-1.083 2.5-2.5 2.5h-15c-1.417 0-2.5-1.084-2.5-2.5V12c0-1.417 1.083-2.5 2.5-2.5h2.917l1.416-2.167C13 7.167 13.25 7 13.5 7h5c.25 0 .5.167.667.333L20.583 9.5H23.5zM16 11.417a4.706 4.706 0 00-4.75 4.75 4.704 4.704 0 004.75 4.75 4.703 4.703 0 004.75-4.75c0-2.663-2.09-4.75-4.75-4.75zm0 7.825c-1.744 0-3.076-1.332-3.076-3.074 0-1.745 1.333-3.077 3.076-3.077 1.744 0 3.074 1.333 3.074 3.076s-1.33 3.075-3.074 3.075z",
      fill: "#02B383",
      fillRule: "nonzero"
    }));
    this.defaultLocale = locale_default;
    this.i18nInit();
    this.title = this.i18n("pluginNameCamera");
    _classPrivateFieldLooseBase(this, _enableMirror)[_enableMirror] = this.opts.mirror;
    this.install = this.install.bind(this);
    this.setPluginState = this.setPluginState.bind(this);
    this.render = this.render.bind(this);
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.takeSnapshot = this.takeSnapshot.bind(this);
    this.startRecording = this.startRecording.bind(this);
    this.stopRecording = this.stopRecording.bind(this);
    this.discardRecordedVideo = this.discardRecordedVideo.bind(this);
    this.submit = this.submit.bind(this);
    this.oneTwoThreeSmile = this.oneTwoThreeSmile.bind(this);
    this.focus = this.focus.bind(this);
    this.changeVideoSource = this.changeVideoSource.bind(this);
    this.webcamActive = false;
    if (this.opts.countdown) {
      this.opts.onBeforeSnapshot = this.oneTwoThreeSmile;
    }
    this.setPluginState({
      hasCamera: false,
      cameraReady: false,
      cameraError: null,
      recordingLengthSeconds: 0,
      videoSources: [],
      currentDeviceId: null
    });
  }
  setOptions(newOpts) {
    super.setOptions({
      ...newOpts,
      videoConstraints: {
        // May be undefined but ... handles that
        ...this.opts.videoConstraints,
        ...newOpts == null ? void 0 : newOpts.videoConstraints
      }
    });
  }
  hasCameraCheck() {
    if (!this.mediaDevices) {
      return Promise.resolve(false);
    }
    return this.mediaDevices.enumerateDevices().then((devices) => {
      return devices.some((device) => device.kind === "videoinput");
    });
  }
  isAudioOnly() {
    return this.opts.modes.length === 1 && this.opts.modes[0] === "audio-only";
  }
  getConstraints(deviceId) {
    if (deviceId === void 0) {
      deviceId = null;
    }
    const acceptsAudio = this.opts.modes.indexOf("video-audio") !== -1 || this.opts.modes.indexOf("audio-only") !== -1;
    const acceptsVideo = !this.isAudioOnly() && (this.opts.modes.indexOf("video-audio") !== -1 || this.opts.modes.indexOf("video-only") !== -1 || this.opts.modes.indexOf("picture") !== -1);
    const videoConstraints = {
      ...this.opts.videoConstraints || {},
      ...deviceId != null && {
        deviceId
      }
    };
    return {
      audio: acceptsAudio,
      video: acceptsVideo ? videoConstraints : false
    };
  }
  // eslint-disable-next-line consistent-return
  start(options) {
    var _options;
    if (options === void 0) {
      options = null;
    }
    if (!this.supportsUserMedia) {
      return Promise.reject(new Error("Webcam access not supported"));
    }
    this.webcamActive = true;
    if (this.opts.mirror) {
      _classPrivateFieldLooseBase(this, _enableMirror)[_enableMirror] = true;
    }
    const constraints = this.getConstraints((_options = options) == null ? void 0 : _options.deviceId);
    this.hasCameraCheck().then((hasCamera) => {
      this.setPluginState({
        hasCamera
      });
      return this.mediaDevices.getUserMedia(constraints).then((stream) => {
        this.stream = stream;
        let currentDeviceId = null;
        const tracks = this.isAudioOnly() ? stream.getAudioTracks() : stream.getVideoTracks();
        if (!options || !options.deviceId) {
          currentDeviceId = tracks[0].getSettings().deviceId;
        } else {
          tracks.forEach((track) => {
            if (track.getSettings().deviceId === options.deviceId) {
              currentDeviceId = track.getSettings().deviceId;
            }
          });
        }
        this.updateVideoSources();
        this.setPluginState({
          currentDeviceId,
          cameraReady: true
        });
      }).catch((err) => {
        this.setPluginState({
          cameraReady: false,
          cameraError: err
        });
        this.uppy.info(err.message, "error");
      });
    });
  }
  getMediaRecorderOptions() {
    const options = {};
    if (MediaRecorder.isTypeSupported) {
      const {
        restrictions
      } = this.uppy.opts;
      let preferredVideoMimeTypes = [];
      if (this.opts.preferredVideoMimeType) {
        preferredVideoMimeTypes = [this.opts.preferredVideoMimeType];
      } else if (restrictions.allowedFileTypes) {
        preferredVideoMimeTypes = restrictions.allowedFileTypes.map(toMimeType).filter(isVideoMimeType);
      }
      const filterSupportedTypes = (candidateType) => MediaRecorder.isTypeSupported(candidateType) && getFileTypeExtension(candidateType);
      const acceptableMimeTypes = preferredVideoMimeTypes.filter(filterSupportedTypes);
      if (acceptableMimeTypes.length > 0) {
        options.mimeType = acceptableMimeTypes[0];
      }
    }
    return options;
  }
  startRecording() {
    this.recorder = new MediaRecorder(this.stream, this.getMediaRecorderOptions());
    this.recordingChunks = [];
    let stoppingBecauseOfMaxSize = false;
    this.recorder.addEventListener("dataavailable", (event) => {
      this.recordingChunks.push(event.data);
      const {
        restrictions
      } = this.uppy.opts;
      if (this.recordingChunks.length > 1 && restrictions.maxFileSize != null && !stoppingBecauseOfMaxSize) {
        const totalSize = this.recordingChunks.reduce((acc, chunk) => acc + chunk.size, 0);
        const averageChunkSize = (totalSize - this.recordingChunks[0].size) / (this.recordingChunks.length - 1);
        const expectedEndChunkSize = averageChunkSize * 3;
        const maxSize = Math.max(0, restrictions.maxFileSize - expectedEndChunkSize);
        if (totalSize > maxSize) {
          stoppingBecauseOfMaxSize = true;
          this.uppy.info(this.i18n("recordingStoppedMaxSize"), "warning", 4e3);
          this.stopRecording();
        }
      }
    });
    this.recorder.start(500);
    if (this.opts.showRecordingLength) {
      this.recordingLengthTimer = setInterval(() => {
        const currentRecordingLength = this.getPluginState().recordingLengthSeconds;
        this.setPluginState({
          recordingLengthSeconds: currentRecordingLength + 1
        });
      }, 1e3);
    }
    this.setPluginState({
      isRecording: true
    });
  }
  stopRecording() {
    const stopped = new Promise((resolve) => {
      this.recorder.addEventListener("stop", () => {
        resolve();
      });
      this.recorder.stop();
      if (this.opts.showRecordingLength) {
        clearInterval(this.recordingLengthTimer);
        this.setPluginState({
          recordingLengthSeconds: 0
        });
      }
    });
    return stopped.then(() => {
      this.setPluginState({
        isRecording: false
      });
      return this.getVideo();
    }).then((file) => {
      try {
        this.capturedMediaFile = file;
        this.setPluginState({
          // eslint-disable-next-line compat/compat
          recordedVideo: URL.createObjectURL(file.data)
        });
        _classPrivateFieldLooseBase(this, _enableMirror)[_enableMirror] = false;
      } catch (err) {
        if (!err.isRestriction) {
          this.uppy.log(err);
        }
      }
    }).then(() => {
      this.recordingChunks = null;
      this.recorder = null;
    }, (error) => {
      this.recordingChunks = null;
      this.recorder = null;
      throw error;
    });
  }
  discardRecordedVideo() {
    this.setPluginState({
      recordedVideo: null
    });
    if (this.opts.mirror) {
      _classPrivateFieldLooseBase(this, _enableMirror)[_enableMirror] = true;
    }
    this.capturedMediaFile = null;
  }
  submit() {
    try {
      if (this.capturedMediaFile) {
        this.uppy.addFile(this.capturedMediaFile);
      }
    } catch (err) {
      if (!err.isRestriction) {
        this.uppy.log(err, "error");
      }
    }
  }
  async stop() {
    if (this.stream) {
      const audioTracks = this.stream.getAudioTracks();
      const videoTracks = this.stream.getVideoTracks();
      audioTracks.concat(videoTracks).forEach((track) => track.stop());
    }
    if (this.recorder) {
      await new Promise((resolve) => {
        this.recorder.addEventListener("stop", resolve, {
          once: true
        });
        this.recorder.stop();
        if (this.opts.showRecordingLength) {
          clearInterval(this.recordingLengthTimer);
        }
      });
    }
    this.recordingChunks = null;
    this.recorder = null;
    this.webcamActive = false;
    this.stream = null;
    this.setPluginState({
      recordedVideo: null,
      isRecording: false,
      recordingLengthSeconds: 0
    });
  }
  getVideoElement() {
    return this.el.querySelector(".uppy-Webcam-video");
  }
  oneTwoThreeSmile() {
    return new Promise((resolve, reject) => {
      let count = this.opts.countdown;
      const countDown = setInterval(() => {
        if (!this.webcamActive) {
          clearInterval(countDown);
          this.captureInProgress = false;
          return reject(new Error("Webcam is not active"));
        }
        if (count) {
          this.uppy.info(`${count}...`, "warning", 800);
          count--;
        } else {
          clearInterval(countDown);
          this.uppy.info(this.i18n("smile"), "success", 1500);
          setTimeout(() => resolve(), 1500);
        }
      }, 1e3);
    });
  }
  takeSnapshot() {
    if (this.captureInProgress) return;
    this.captureInProgress = true;
    this.opts.onBeforeSnapshot().catch((err) => {
      const message = typeof err === "object" ? err.message : err;
      this.uppy.info(message, "error", 5e3);
      return Promise.reject(new Error(`onBeforeSnapshot: ${message}`));
    }).then(() => {
      return this.getImage();
    }).then((tagFile) => {
      this.captureInProgress = false;
      try {
        this.uppy.addFile(tagFile);
      } catch (err) {
        if (!err.isRestriction) {
          this.uppy.log(err);
        }
      }
    }, (error) => {
      this.captureInProgress = false;
      throw error;
    });
  }
  getImage() {
    const video = this.getVideoElement();
    if (!video) {
      return Promise.reject(new Error("No video element found, likely due to the Webcam tab being closed."));
    }
    const width = video.videoWidth;
    const height = video.videoHeight;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    const {
      restrictions
    } = this.uppy.opts;
    let preferredImageMimeTypes = [];
    if (this.opts.preferredImageMimeType) {
      preferredImageMimeTypes = [this.opts.preferredImageMimeType];
    } else if (restrictions.allowedFileTypes) {
      preferredImageMimeTypes = restrictions.allowedFileTypes.map(toMimeType).filter(isImageMimeType);
    }
    const mimeType = preferredImageMimeTypes[0] || "image/jpeg";
    const ext = getFileTypeExtension(mimeType) || "jpg";
    const name = `cam-${Date.now()}.${ext}`;
    return canvasToBlob(canvas, mimeType).then((blob) => {
      return {
        source: this.id,
        name,
        data: new Blob([blob], {
          type: mimeType
        }),
        type: mimeType
      };
    });
  }
  getVideo() {
    const mimeType = this.recordingChunks.find((blob2) => {
      var _blob$type;
      return ((_blob$type = blob2.type) == null ? void 0 : _blob$type.length) > 0;
    }).type;
    const fileExtension = getFileTypeExtension(mimeType);
    if (!fileExtension) {
      return Promise.reject(new Error(`Could not retrieve recording: Unsupported media type "${mimeType}"`));
    }
    const name = `webcam-${Date.now()}.${fileExtension}`;
    const blob = new Blob(this.recordingChunks, {
      type: mimeType
    });
    const file = {
      source: this.id,
      name,
      data: new Blob([blob], {
        type: mimeType
      }),
      type: mimeType
    };
    return Promise.resolve(file);
  }
  focus() {
    if (!this.opts.countdown) return;
    setTimeout(() => {
      this.uppy.info(this.i18n("smile"), "success", 1500);
    }, 1e3);
  }
  changeVideoSource(deviceId) {
    this.stop();
    this.start({
      deviceId
    });
  }
  updateVideoSources() {
    this.mediaDevices.enumerateDevices().then((devices) => {
      this.setPluginState({
        videoSources: devices.filter((device) => device.kind === "videoinput")
      });
    });
  }
  render() {
    if (!this.webcamActive) {
      this.start();
    }
    const webcamState = this.getPluginState();
    if (!webcamState.cameraReady || !webcamState.hasCamera) {
      return _(PermissionsScreen, {
        icon: CameraIcon,
        i18n: this.i18n,
        hasCamera: webcamState.hasCamera
      });
    }
    return _(
      CameraScreen_default,
      _extends2({}, webcamState, {
        onChangeVideoSource: this.changeVideoSource,
        onSnapshot: this.takeSnapshot,
        onStartRecording: this.startRecording,
        onStopRecording: this.stopRecording,
        onDiscardRecordedVideo: this.discardRecordedVideo,
        onSubmit: this.submit,
        onFocus: this.focus,
        onStop: this.stop,
        i18n: this.i18n,
        modes: this.opts.modes,
        showRecordingLength: this.opts.showRecordingLength,
        showVideoSourceDropdown: this.opts.showVideoSourceDropdown,
        supportsRecording: supportsMediaRecorder(),
        recording: webcamState.isRecording,
        mirror: _classPrivateFieldLooseBase(this, _enableMirror)[_enableMirror],
        src: this.stream
      })
    );
  }
  install() {
    const {
      mobileNativeCamera,
      modes,
      videoConstraints
    } = this.opts;
    const {
      target
    } = this.opts;
    if (mobileNativeCamera && target) {
      var _this$getTargetPlugin;
      (_this$getTargetPlugin = this.getTargetPlugin(target)) == null || _this$getTargetPlugin.setOptions({
        showNativeVideoCameraButton: isModeAvailable2(modes, "video-only") || isModeAvailable2(modes, "video-audio"),
        showNativePhotoCameraButton: isModeAvailable2(modes, "picture"),
        nativeCameraFacingMode: videoConstraints == null ? void 0 : videoConstraints.facingMode
      });
      return;
    }
    this.setPluginState({
      cameraReady: false,
      recordingLengthSeconds: 0
    });
    if (target) {
      this.mount(target, this);
    }
    if (this.mediaDevices) {
      this.updateVideoSources();
      this.mediaDevices.ondevicechange = () => {
        this.updateVideoSources();
        if (this.stream) {
          let restartStream = true;
          const {
            videoSources,
            currentDeviceId
          } = this.getPluginState();
          videoSources.forEach((videoSource) => {
            if (currentDeviceId === videoSource.deviceId) {
              restartStream = false;
            }
          });
          if (restartStream) {
            this.stop();
            this.start();
          }
        }
      };
    }
  }
  uninstall() {
    this.stop();
    this.unmount();
  }
  onUnmount() {
    this.stop();
  }
};
Webcam.VERSION = packageJson.version;
export {
  Webcam as default
};
//# sourceMappingURL=@uppy_webcam.js.map
