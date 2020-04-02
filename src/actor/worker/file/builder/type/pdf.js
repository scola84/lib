import get from 'lodash/get.js'
import isError from 'lodash/isError.js'
import { Type } from './type.js'

export class Pdf extends Type {
  transformFile (file, callback) {
    this.readFile(file, (readError, buffer) => {
      if (isError(readError) === true) {
        callback(readError)
      }

      const codec = this._origin.getCodec('application/pdf')

      codec.parse(buffer, {}, (parseError, document) => {
        if (isError(parseError) === true) {
          callback(parseError)
          return
        }

        codec.stringify(this.formatFile(document, file), {}, callback)
      })
    })
  }

  formatFile (document, file) {
    const {
      PDFHexString,
      PDFName
    } = document.pdfLib

    document
      .context
      .lookup(document.catalog.get(PDFName.of('AcroForm')))
      .get(PDFName.of('Fields'))
      .array
      .map((field) => document.context.lookup(field))
      .forEach((field) => {
        field.set(
          PDFName.of('V'),
          PDFHexString.fromText(
            String(get(file, field.get(PDFName.of('T')).value, ''))
          )
        )
      })

    return document
  }
}
