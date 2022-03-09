export function camelize (string: string): string {
  return string
    .trim()
    .split(/[^a-z0-9]/gui)
    .map((part, index) => {
      if (index === 0) {
        return part
      }

      return part[0].toUpperCase() + part.slice(1)
    })
    .join('')
}
