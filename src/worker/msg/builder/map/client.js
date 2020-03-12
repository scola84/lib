import camelCase from 'lodash/camelCase.js'
import base from '../client/index.js'

export default Object.keys(base).reduce((object, name) => {
  return {
    ...object,
    [camelCase(name)]: {
      object: base[name]
    }
  }
}, {})
