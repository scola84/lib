export interface ToJointOptions {
  caps?: RegExp | null
  chars?: RegExp | null
  lower?: boolean
  separator?: string
}

export function toJoint (string: string, options: ToJointOptions = {}): string {
  const {
    caps = /(?<![A-Z])[A-Z]/gu,
    chars = /[^a-z0-9_]+/gui,
    lower = true,
    separator = ''
  } = options

  let jointString = string
    .trim()
    .replace(/^[^a-z0-9]+/gui, '')
    .replace(/[^a-z0-9]+$/gui, '')

  if (caps !== null) {
    jointString = jointString.replace(caps, (match) => {
      if (lower) {
        return `${separator}${match.toLowerCase()}`
      }

      return `${separator}${match}`
    })
  }

  if (chars !== null) {
    jointString = jointString.replace(chars, separator)
  }

  return jointString
}
