import isError from 'lodash/isError.js'
import isNil from 'lodash/isNil.js'
import { Type } from './type.js'

export class Pdf extends Type {
  formatDocument (document, file) {
    const {
      PDFName
    } = document.pdfLib

    document
      .context
      .lookup(document.catalog.get(PDFName.of('AcroForm')))
      .get(PDFName.of('Fields'))
      .array
      .map((field) => document.context.lookup(field))
      .forEach((field) => {
        this.formatField(document, file, field)
      })

    return document
  }

  formatField (document, file, field) {
    const {
      PDFHexString,
      PDFName
    } = document.pdfLib

    const name = PDFName.of('V')
    const value = field.get(name)

    if (isNil(value) === true) {
      return
    }

    const format = Buffer
      .from(value.value, 'hex')
      .swap16()
      .toString('utf16le')
      .slice(1)

    field.set(
      name,
      PDFHexString.fromText(
        this._origin.format(format, [file], file.locale)
      )
    )
  }

  transformFile (file, callback) {
    this.readFile(file, (readError, readBuffer) => {
      if (isError(readError) === true) {
        callback(readError)
        return
      }

      const codec = this._origin.getCodec('application/pdf')

      codec.parse(readBuffer, file.options, (parseError, parseDocument) => {
        if (isError(parseError) === true) {
          callback(parseError)
          return
        }

        const document = this.formatDocument(parseDocument, file)

        codec.stringify(document, file.options, (stringifyError, stringifyBuffer) => {
          if (isError(stringifyError) === true) {
            callback(stringifyError)
            return
          }

          callback(null, stringifyBuffer)
        })
      })
    })
  }
}
