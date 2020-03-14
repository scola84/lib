import isNil from 'lodash/isNil.js'

export function string (value) {
  if (isNil(value) === true) {
    return ''
  }

  return String(value)
}
