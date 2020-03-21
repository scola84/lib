import Busboy from 'busboy'
import fs from 'fs-extra'
import isArray from 'lodash/isArray.js'
import isNil from 'lodash/isNil.js'
import isUndefined from 'lodash/isUndefined.js'
import merge from 'lodash/merge.js'
import crypto from 'crypto'
import { Codec } from './codec.js'

const coptions = {
  tmpDir: '/tmp/'
}

export class FormDataCodec extends Codec {
  static getOptions () {
    return coptions
  }

  static setOptions (value) {
    merge(coptions, value)
    return coptions
  }

  setModules (value = { crypto, Busboy, fs }) {
    return super.setModules(value)
  }

  setType (value = 'multipart/form-data') {
    return super.setType(value)
  }

  decode (readable, callback) {
    const options = {
      ...coptions,
      headers: readable.headers
    }

    let formdata = null

    try {
      formdata = new this._modules.Busboy(options)
    } catch (error) {
      callback(new Error(`400 [form-data] ${error.message}`))
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
        tmppath: coptions.tmpDir + this._modules.crypto.randomBytes(32).toString('hex')
      }

      const target = this._modules.fs.createWriteStream(file.tmppath)

      stream.on('data', (chunk) => {
        file.size += chunk.length
      })

      stream.once('limit', () => {
        formdata.removeAllListeners()
        callback(new Error('400 [form-data] File size exceeds maximum'))
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
      callback(new Error(`400 [form-data] ${error.message}`))
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

      if (isArray(value) === false) {
        value = [value]
      }

      for (let j = 0; j < value.length; j += 1) {
        form.append(name, this.prepareValue(value[j]))
      }
    }

    callback(null, form)
  }

  prepareValue (value) {
    if (isNil(value) === true) {
      return ''
    }

    return value
  }

  setValue (data, name, value) {
    if (isUndefined(data[name]) === true) {
      data[name] = value
      return
    }

    if (isArray(data[name]) === true) {
      data[name] = data[name].concat(value)
    } else {
      data[name] = [data[name], value]
    }
  }
}
