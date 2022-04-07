export interface ToJointOptions {
  caps?: boolean
  chars?: boolean
  separator?: string
}

export function toJoint (string: string, options: ToJointOptions): string {
  const {
    caps = true,
    chars = true,
    separator = ''
  } = options

  let jointString = string
    .trim()
    .replace(/^[^a-z0-9]+/ui, '')
    .replace(/[^a-z0-9]+$/ui, '')

  if (caps) {
    jointString = jointString.replace(/[A-Z]/gu, (match) => {
      return `${separator}${match.toLowerCase()}`
    })
  }

  if (chars) {
    jointString = jointString.replace(/[^a-z0-9]+/gui, separator)
  }

  return jointString
}
