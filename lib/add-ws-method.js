"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = addWsMethod;

var _wrapMiddleware = _interopRequireDefault(require("./wrap-middleware"));

var _websocketUrl = _interopRequireWildcard(require("./websocket-url"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function addWsMethod(target) {
  /* This prevents conflict with other things setting `.ws`. */
  if (target.ws === null || target.ws === undefined) {
    target.ws = function addWsRoute(route) {
      for (var _len = arguments.length, middlewares = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        middlewares[_key - 1] = arguments[_key];
      }

      var wrappedMiddlewares = middlewares.map(_wrapMiddleware["default"]);
      /* We append `/.websocket` to the route path here. Why? To prevent conflicts when
       * a non-WebSocket request is made to the same GET route - after all, we are only
       * interested in handling WebSocket requests.
       *
       * Whereas the original `express-ws` prefixed this path segment, we suffix it -
       * this makes it possible to let requests propagate through Routers like normal,
       * which allows us to specify WebSocket routes on Routers as well \o/! */

      var wsRoute = (0, _websocketUrl["default"])(route);
      /* Here we configure our new GET route. It will never get called by a client
       * directly, it's just to let our request propagate internally, so that we can
       * leave the regular middleware execution and error handling to Express. */

      this.get.apply(this, _toConsumableArray([wsRoute].concat(wrappedMiddlewares)));
      /* This is a trick. Just as what it is above, we use a trick url appending with
       * `/.websocket_check` to config a route. when we handle the upgrade the event,
       * we pipeline the req and res to let the Express check whether the url is avaliable.
      */

      this.get(_websocketUrl.websocketUrlCheck, function (req, res, next) {
        req.wsUrlChecked = true;
        next();
      });
      /*
       * Return `this` to allow for chaining:
       */

      return this;
    };
  }
}