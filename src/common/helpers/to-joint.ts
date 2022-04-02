export function toJoint (string: string, separator = '', chars = true): string {
  let jointString = string
    .trim()
    .replace(/[A-Z]/gu, (match) => {
      return `${separator}${match.toLowerCase()}`
    })
    .replace(/^[^a-z0-9]+/ui, '')
    .replace(/[^a-z0-9]+$/ui, '')

  if (chars) {
    jointString = jointString.replace(/[^a-z0-9]+/gui, separator)
  }

  return jointString
}
