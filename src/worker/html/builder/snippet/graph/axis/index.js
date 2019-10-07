import camel from 'lodash-es/camelCase'
import * as scale from './scale'

export * from './scale'

const map = Object.keys(scale).reduce((object, name) => {
  return {
    ...object,
    [camel(name)]: {
      object: scale[name]
    }
  }
}, {})

export {
  map
}
