import Busboy from 'busboy'
import fs from 'fs-extra'
import merge from 'lodash-es/merge'
import shortid from 'shortid'
import { Codec } from './codec'

const coptions = {
  tmpDir: '/tmp/'
}

export class FormDataCodec extends Codec {
  static type () {
    return 'multipart/form-data'
  }

  static getOptions () {
    return coptions
  }

  static setOptions (value) {
    merge(coptions, value)
  }

  decode (readable, callback) {
    const options = {
      ...coptions,
      headers: readable.headers
    }

    let formdata = null

    try {
      formdata = new Busboy(options)
    } catch (error) {
      callback(new Error(`400 ${error.message}`))
      return
    }

    const data = {}

    formdata.on('field', (name, value) => {
      this.setValue(data, name, value)
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
        this.setValue(data, fieldName, file)
      })

      stream.once('error', (error) => {
        this.setValue(data, fieldName, error)
      })

      stream.pipe(target)
    })

    formdata.once('error', (error) => {
      formdata.removeAllListeners()
      callback(new Error(`400 ${error.message}`))
    })

    formdata.once('finish', () => {
      formdata.removeAllListeners()
      callback(null, data)
    })

    readable.pipe(formdata)
  }

  encode (writable, data, callback) {
    const keys = Object.keys(data)
    const form = new window.FormData()

    let name = null
    let value = null

    for (let i = 0; i < keys.length; i += 1) {
      name = keys[i]

      value = data[name]
      value = Array.isArray(value) === true ? value : [value]

      for (let j = 0; j < value.length; j += 1) {
        form.append(name, this.prepareValue(value[j]))
      }
    }

    callback(null, form)
  }

  prepareValue (value) {
    return value === null || value === undefined ? '' : value
  }

  setValue (data, name, value) {
    if (data[name] === undefined) {
      data[name] = value
      return
    }

    data[name] = Array.isArray(data[name]) === true
      ? data[name].concat(value)
      : [data[name], value]
  }
}
