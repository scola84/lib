import dompurify from 'dompurify'
import markdown from 'marked'
import { JSDOM } from 'jsdom'

const sanitizer = dompurify(
  typeof window === 'undefined' ? new JSDOM().window : window
)

export function m (value, options = '') {
  const foptions = options === ''
    ? []
    : options.split(';')

  const moptions = {
    breaks: true
  }

  let key = null
  let val = null

  for (let i = 0; i < foptions.length; i += 1) {
    [key, val] = foptions[i].split('=')
    moptions[key] = val !== '0'
  }

  return sanitizer.sanitize(
    markdown(value, moptions)
  )
}
