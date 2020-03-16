import dompurify from 'dompurify'
import isNil from 'lodash/isNil.js'
import markdown from 'marked'
import jsdom from 'jsdom'

const sanitizer = dompurify(
  typeof window === 'undefined' ? new jsdom.JSDOM().window : window
)

export function marked (value, options) {
  if (isNil(value) === true) {
    return ''
  }

  const moptions = Object.keys(options).reduce((result, name) => {
    return {
      ...result,
      [name]: Boolean(Number(options[name]))
    }
  }, {
    breaks: true
  })

  return sanitizer.sanitize(markdown(value, moptions))
}
