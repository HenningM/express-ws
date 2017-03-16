/**
 * Converts a request URL into a websocket URL. Preserves trailing
 * slashes and correctly handles query params and hash fragments.
 * @param {string} url Request URL to process
 */
export default function websocketUrl(url) {
  return url.replace(/(\/)?((?:\?|#).*)?$/, '/.websocket$1$2');
}
