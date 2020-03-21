import fsExtra from 'fs-extra'

const files = new Map()

export function file (value = null, options = {}) {
  const {
    fs = fsExtra,
    from = 'utf-8',
    path = value,
    to = 'utf-8'
  } = options

  if (path === null) {
    return ''
  }

  const key = `${path}:${from}:${to}`

  if (files.has(key) === true) {
    return files.get(key)
  }

  const content = fs
    .readFileSync(path, { encoding: from })
    .toString(to)

  files.set(key, content)

  return content
}
