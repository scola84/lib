import camel from 'lodash-es/camelCase'
import * as data from './data'

export * from './data'

const map = Object.keys(data).reduce((object, name) => {
  return {
    ...object,
    [camel(name)]: {
      object: data[name]
    }
  }
}, {})

export {
  map
}
