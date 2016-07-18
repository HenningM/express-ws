import trailingSlash from './trailing-slash';

/* The following fixes HenningM/express-ws#17, correctly. */
export default function websocketUrl(url, eventName) {
  if (eventName === null || eventName === undefined)
    eventName = '';
  if (url.indexOf('?') !== -1) {
    const [baseUrl, query] = url.split('?');

    return `${trailingSlash(baseUrl)}.websocket.${eventName}?${query}`;
  }
  return `${trailingSlash(url)}.websocket.${eventName}`;
}
