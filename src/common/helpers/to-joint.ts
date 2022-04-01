export function toJoint (string: string, separator = ''): string {
  return string
    .trim()
    .replace(/[A-Z]/gu, (match) => {
      return `${separator}${match.toLowerCase()}`
    })
    .replace(/^[^a-z0-9]+/ui, '')
    .replace(/[^a-z0-9]+$/ui, '')
    .replace(/[^a-z0-9]+/gui, separator)
}
