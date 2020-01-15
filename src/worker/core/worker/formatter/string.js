export function string (value) {
  if (value === undefined || value === null) {
    return ''
  }

  return String(value)
}
