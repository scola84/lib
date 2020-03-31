import dompurify from 'dompurify'
import isNil from 'lodash/isNil.js'
import jsdom from 'jsdom'
import markdown from 'marked'
import { Formatter } from './formatter.js'

export class MarkedFormatter extends Formatter {
  constructor (options = {}) {
    super(options)

    this._sanitizer = null
    this.setSanitizer(options.sanitizer)
  }

  getSanitizer () {
    return this._sanitizer
  }

  setSanitizer (value = null) {
    this._sanitizer = value === null
      ? dompurify(typeof window === 'undefined' ? new jsdom.JSDOM().window : window)
      : value
  }

  format (value, options = {}) {
    if (isNil(value) === true) {
      return ''
    }

    const moptions = Object.keys(options).reduce((result, name) => {
      return {
        ...result,
        [name]: Boolean(Number(options[name]))
      }
    }, {
      breaks: true
    })

    return this._sanitizer.sanitize(markdown(value, moptions))
  }
}
