import { EventStreamCodec } from './event-stream.js'
import { FormDataCodec } from './form-data.js'
import { HtmlCodec } from './html.js'
import { JsonCodec } from './json.js'
import { MsgpackCodec } from './msgpack.js'
import { OctetStreamCodec } from './octet-stream.js'
import { PlainCodec } from './plain.js'
import { UrlencodedCodec } from './urlencoded.js'

const objects = [
  new EventStreamCodec(),
  new FormDataCodec(),
  new HtmlCodec(),
  new JsonCodec(),
  new MsgpackCodec(),
  new OctetStreamCodec(),
  new PlainCodec(),
  new UrlencodedCodec()
]

export const codec = objects.reduce((result, object) => {
  return {
    ...result,
    [object.getType()]: object
  }
}, {})
