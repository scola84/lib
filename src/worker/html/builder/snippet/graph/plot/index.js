import camelCase from 'lodash/camelCase.js'
import * as data from './data/index.js'

export * from './data/index.js'

const map = Object.keys(data).reduce((object, name) => {
  return {
    ...object,
    [camelCase(name)]: {
      object: data[name]
    }
  }
}, {})

export {
  map
}
