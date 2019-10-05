import markdown from 'marked'

export function m (value, options = '') {
  options = options ? options.split(';') : []

  const moptions = {
    breaks: true
  }

  let key = null
  let val = null

  for (let i = 0; i < options.length; i += 1) {
    [key, val] = options[i].split('=')
    moptions[key] = val !== '0'
  }

  return markdown(value, moptions)
}
