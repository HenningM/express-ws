export default function addTrailingSlash(string) {
  if (string.charAt(string.length - 1) !== '/') {
    return `${string}/`;
  }
  return string;
}
