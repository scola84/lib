import dompurify from 'dompurify'
import markdown from 'marked'

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

  return dompurify.sanitize(
    markdown(value, moptions)
  )
}
