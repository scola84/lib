export function pascalize (string: string): string {
  return string
    .trim()
    .split(/[^a-z0-9]/gui)
    .map((part) => {
      return part[0].toUpperCase() + part.slice(1)
    })
    .join('')
}
