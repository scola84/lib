import { Auth } from './auth.js'

export class Basic extends Auth {
  createHeader () {
    const {
      password,
      username,
      userpass = `${username}:${password}`
    } = this._credentials

    return `Basic ${Buffer.from(`${userpass}`).toString('base64')}`
  }
}
