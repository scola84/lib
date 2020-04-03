import camelCase from 'lodash/camelCase.js'
import * as scale from './scale/index.js'

export * from './scale/index.js'

const map = Object.keys(scale).reduce((object, name) => {
  return {
    ...object,
    [camelCase(name)]: {
      object: scale[name]
    }
  }
}, {})

export {
  map
}
