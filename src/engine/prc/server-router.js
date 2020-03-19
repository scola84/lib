import isArray from 'lodash/isArray.js'
import { HttpRouter } from '../../worker/api.js'

export class ServerRouter extends HttpRouter {
  filter (box, data) {
    if (isArray(data) === true) {
      return data
    }

    return []
  }
}
