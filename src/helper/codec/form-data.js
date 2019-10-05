import Busboy from 'busboy'
import fs from 'fs-extra'
import merge from 'lodash-es/merge'
import shortid from 'shortid'

const type = 'multipart/form-data'
const coptions = { tmpDir: '/tmp/' }

class Codec {
  static getOptions () {
    return coptions
  }

  static setOptions (options) {
    merge(coptions, options)
  }

  static setValue (data, name, value) {
    if (data[name] !== undefined) {
      value = Array.isArray(data[name]) === true
        ? data[name].concat(value)
        : [data[name], value]
    }

    data[name] = value
  }

  static decode (readable, callback) {
    const options = Object.assign({}, coptions, {
      headers: readable.headers
    })

    const formdata = new Busboy(options)
    const parsed = {}

    formdata.on('field', (name, value) => {
      Codec.setValue(parsed, name, value)
    })

    formdata.on('file', (fieldName, stream, name, encoding, type) => {
      const file = {
        name,
        type,
        size: 0,
        tmppath: coptions.tmpDir + shortid.generate()
      }

      const target = fs.createWriteStream(file.tmppath)

      stream.on('data', (chunk) => {
        file.size += chunk.length
      })

      stream.once('limit', () => {
        formdata.removeAllListeners()
        callback(new Error('400 File size exceeds maximum'))
      })

      stream.once('end', () => {
        Codec.setValue(parsed, fieldName, file)
      })

      stream.once('error', (error) => {
        Codec.setValue(parsed, fieldName, error)
      })

      stream.pipe(target)
    })

    formdata.once('error', (error) => {
      formdata.removeAllListeners()
      callback(new Error('400 ' + error.message))
    })

    formdata.once('finish', () => {
      formdata.removeAllListeners()
      callback(null, parsed)
    })

    readable.pipe(formdata)
  }

  static encode (writable, data, callback) {
    const keys = Object.keys(data)
    const form = new window.FormData()

    let name = null
    let value = null

    for (let i = 0; i < keys.length; i += 1) {
      name = keys[i]
      value = data[name]
      value = Array.isArray(value) ? value : [value]

      for (let j = 0; j < value.length; j += 1) {
        form.append(name, value[j])
      }
    }

    try {
      writable.end(form, callback)
    } catch (error) {
      callback(error)
    }
  }
}

export {
  Codec,
  type
}
