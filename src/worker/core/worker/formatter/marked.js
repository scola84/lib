import dompurify from 'dompurify'
import markdown from 'marked'
import jsdom from 'jsdom'

const sanitizer = dompurify(
  typeof window === 'object'
    ? window
    : new jsdom.JSDOM().window
)

export function marked (value, options) {
  if (value === undefined || value === null) {
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
