import isString from 'lodash/isString.js'
import isError from 'lodash/isError.js'
import { JsonCodec } from './json.js'

export class EventStreamCodec extends JsonCodec {
  setType (value = 'text/event-stream') {
    return super.setType(value)
  }

  parse (buffer, options, callback) {
    const event = {}
    const lines = buffer.split('\n')

    let name = null
    let value = null

    for (let i = 0; i < lines.length; i += 1) {
      [name, value] = lines[i].split(':')

      if (name === '') {
        continue
      } else if (isString(event[name]) === true) {
        event[name] += `\n${value.trim()}`
      } else {
        event[name] = value.trim()
      }
    }

    super.parse(event.data, options, (error, object) => {
      if (isError(error) === true) {
        callback(error)
        return
      }

      event.data = object
      callback(null, event)
    })
  }

  stringify (object, options, callback) {
    super.stringify(object, options, (error, buffer) => {
      if (isError(error) === true) {
        callback(error)
        return
      }

      callback(null, `data: ${buffer}\n\n`)
    })
  }
}
