/**
 * Converts an express URL into a 'websocket' URL by appending .websocket
 * to the path. Preserves trailing slashes and works on most RegExp routes
 * as well.
 * @param {string|RegExp} url express URL to modify
 */
export default function websocketRoute(url) {
  if (url instanceof RegExp) {
    return new RegExp(url.source.replace(/(\/)?(\$)?$/, '/.websocket$1$2'), url.flags);
  }
  return url.replace(/(\/)?$/, '/.websocket$1');
}
