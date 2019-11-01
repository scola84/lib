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
  const foptions = options === ''
    ? []
    : options.split(';')

  const [
    specifier = 'f',
    val = '',
    separator = ''
  ] = foptions

  const definition = definitions[locale] === undefined
    ? defaultFormat
    : formatLocale(definitions[locale])

  const formatter = val === ''
    ? definition.format(specifier)
    : definition.formatPrefix(specifier, val)

  let result = formatter(value)

  result = separator === ''
    ? result
    : result.slice(0, -1) + separator + result.slice(-1)

  return result
}

n.definitions = definitions
