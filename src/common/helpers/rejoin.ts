export function rejoin (string: string, separator = ''): string {
  return string
    .trim()
    .replace(/[A-Z]/gu, (match, index) => {
      if (index === 0) {
        return match.toLowerCase()
      }

      return `${separator}${match.toLowerCase()}`
    })
    .replace(/^[^a-z0-9]+/ui, '')
    .replace(/[^a-z0-9]+$/ui, '')
    .replace(/[^a-z0-9]+/gui, separator)
}
