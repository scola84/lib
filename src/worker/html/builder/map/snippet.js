import camelCase from 'lodash/camelCase.js'
import base from '../snippet/index.js'

export default Object.keys(base).reduce((master, group) => {
  return Object.keys(base[group]).reduce((object, name) => {
    return {
      ...object,
      [camelCase(name)]: {
        object: base[group][name]
      }
    }
  }, master)
}, {})
