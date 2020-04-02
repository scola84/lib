import { Type } from './type.js'

export class OctetStream extends Type {
  transformFile (file, callback) {
    callback(null, file)
  }
}
