export interface ToJointOptions {
  caps?: RegExp | null
  chars?: RegExp | null
  separator?: string
}

export function toJoint (string: string, options: ToJointOptions = {}): string {
  const {
    caps = /[A-Z]/gu,
    chars = /[^a-z0-9_]+/gui,
    separator = ''
  } = options

  let jointString = string
    .trim()
    .replace(/^[^a-z0-9]+/gui, '')
    .replace(/[^a-z0-9]+$/gui, '')

  if (caps !== null) {
    jointString = jointString.replace(caps, (match) => {
      return `${separator}${match.toLowerCase()}`
    })
  }

  if (chars !== null) {
    jointString = jointString.replace(chars, separator)
  }

  return jointString
}
