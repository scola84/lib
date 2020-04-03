import pdf from 'pdf-lib'
import isObject from 'lodash/isObject.js'
import { Codec } from './codec.js'

export class PdfCodec extends Codec {
  setType (value = 'application/pdf') {
    return super.setType(value)
  }

  parse (buffer, options, callback) {
    if (isObject(pdf) === false) {
      callback(null, buffer)
      return
    }

    pdf
      .PDFDocument
      .load(buffer)
      .then((document) => {
        document.pdfLib = pdf
        callback(null, document)
      })
      .catch((error) => {
        callback(error)
      })
  }

  stringify (document, options, callback) {
    document
      .save()
      .then((buffer) => {
        callback(null, buffer)
      })
      .catch((error) => {
        callback(error)
      })
  }
}
