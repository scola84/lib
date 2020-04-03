import { Auth } from './auth.js'

export class Bearer extends Auth {
  createHeader () {
    const {
      token
    } = this._credentials

    return `Bearer ${token}`
  }
}
