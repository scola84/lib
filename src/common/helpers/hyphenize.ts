export function hyphenize (string: string): string {
  return string.replace(/[A-Z]/gu, (match) => {
    return `-${match.toLowerCase()}`
  })
}
