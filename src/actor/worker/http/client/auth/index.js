import camelCase from 'lodash/camelCase.js'
import { Basic } from './basic.js'
import { Bearer } from './bearer.js'
import { Digest } from './digest.js'

const auth = {
  Basic,
  Bearer,
  Digest
}

export const map = Object
  .keys(auth)
  .reduce((object, name) => {
    return {
      ...object,
      [camelCase(name)]: {
        object: auth[name]
      }
    }
  }, {})

export default auth
