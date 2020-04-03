import digest from 'digest-header'
import { Auth } from './auth.js'

export class Digest extends Auth {
  createHeader (init) {
    const {
      method,
      url
    } = init

    const {
      header,
      password,
      username,
      userpass = `${username}:${password}`
    } = this._credentials

    return digest(method, url, header, `${userpass}`)
  }
}
