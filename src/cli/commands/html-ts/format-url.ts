export function formatUrl (url: string, name: string, long: string, short: string): string {
  return url
    .replace(/\[name\]/gu, name)
    .replace(/\[action-long\]/gu, long)
    .replace(/\[action-short\]/gu, short)
}
