export interface ToCapsOptions {
  chars?: RegExp
  lcfirst?: boolean
}

export function toCaps (string: string, options: ToCapsOptions = {}): string {
  const {
    chars = /[^a-z0-9_]+/iu,
    lcfirst = false
  } = options

  const capsString = string
    .trim()
    .split(chars)
    .map((part) => {
      if (part === '') {
        return part
      }

      return part[0].toUpperCase() + part.slice(1)
    })
    .join('')

  if (capsString === '') {
    return ''
  }

  if (lcfirst) {
    return capsString[0].toLowerCase() + capsString.slice(1)
  }

  return capsString
}
