import {
  format,
  formatLocale,
  formatPrefix
} from 'd3-format'

const defaultFormat = {
  format,
  formatPrefix
}

const definitions = {}

export function n (value, options = '', locale = 'nl_NL') {
  options = options ? options.split(';') : []

  const [
    specifier = 'f',
    val = '',
    separator = ''
  ] = options

  const definition = definitions[locale]
    ? formatLocale(definitions[locale])
    : defaultFormat

  const formatter = val === ''
    ? definition.format(specifier)
    : definition.formatPrefix(specifier, val)

  value = formatter(value)
  value = separator === ''
    ? value
    : value.slice(0, -1) + separator + value.slice(-1)

  return value
}

n.definitions = definitions
