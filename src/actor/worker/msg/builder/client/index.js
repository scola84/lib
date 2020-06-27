import camelCase from 'lodash/camelCase.js'
import { Sms } from './sms.js'
import { Smtp } from './smtp.js'

const client = {
  Sms,
  Smtp
}

export const map = Object
  .keys(client)
  .reduce((object, name) => {
    return {
      ...object,
      [camelCase(name)]: {
        object: client[name]
      }
    }
  }, {})

export default client
