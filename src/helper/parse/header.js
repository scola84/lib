export function parseHeader (header = '') {
  const result = {}

  let char = null
  let i = 0
  let key = 'value'
  let value = ''

  for (; i <= header.length; i += 1) {
    char = header[i]

    if (char === ',' || i === header.length) {
      result[key] = value
      key = null
      value = ''
    } else if (char === ';') {
      result[key] = value
      key = ''
      value = ''
    } else if (char === '=') {
      key = value
      value = ''
    } else if (char === '"') {
      continue
    } else if (char === ' ' && value === '') {
      continue
    } else {
      value += char
    }
  }

  return result
}
