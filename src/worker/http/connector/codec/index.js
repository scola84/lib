import { FormDataCodec } from './form-data'
import { HtmlCodec } from './html'
import { JsonCodec } from './json'
import { MsgpackCodec } from './msgpack'
import { OctetStreamCodec } from './octet-stream'
import { PlainCodec } from './plain'
import { UrlencodedCodec } from './urlencoded'

export const codec = {
  'multipart/form-data': new FormDataCodec(),
  'text/html': new HtmlCodec(),
  'application/json': new JsonCodec(),
  'application/msgpack': new MsgpackCodec(),
  'application/octet-stream': new OctetStreamCodec(),
  'text/plain': new PlainCodec(),
  'application/x-www-form-urlencoded': new UrlencodedCodec()
}
