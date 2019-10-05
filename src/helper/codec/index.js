import * as formData from './form-data'
import * as json from './json'
import * as html from './html'
import * as msgpack from './msgpack'
import * as octetStream from './octet-stream'
import * as plain from './plain'
import * as urlencoded from './urlencoded'

export const codec = {
  [formData.type]: formData.Codec,
  [json.type]: json.Codec,
  [html.type]: html.Codec,
  [msgpack.type]: msgpack.Codec,
  [octetStream.type]: octetStream.Codec,
  [plain.type]: plain.Codec,
  [urlencoded.type]: urlencoded.Codec
}
