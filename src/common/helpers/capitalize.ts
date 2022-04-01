export function capitalize (string: string, lower = false): string {
  const capsString = string
    .trim()
    .split(/[^a-z0-9]+/gui)
    .map((part) => {
      return part[0].toUpperCase() + part.slice(1)
    })
    .join('')

  if (lower) {
    return capsString[0].toLowerCase() + capsString.slice(1)
  }

  return capsString
}
