import { JsonCodec } from './json.js'

export class EventStreamCodec extends JsonCodec {
  setType (value = 'text/event-stream') {
    return super.setType(value)
  }

  parse (data) {
    const event = {}
    const lines = data.split('\n')

    let name = null
    let value = null

    for (let i = 0; i < lines.length; i += 1) {
      [name, value] = lines[i].split(':')

      if (name === '') {
        continue
      } else if (typeof event[name] === 'string') {
        event[name] += `\n${value.trim()}`
      } else {
        event[name] = value.trim()
      }
    }

    event.data = super.parse(event.data)

    return event
  }

  stringify (data) {
    return `data: ${super.stringify(data)}\n\n`
  }
}
