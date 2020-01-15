import camelCase from 'lodash/camelCase.js'
import clientBase from './client.js'

const client = Object.keys(clientBase).reduce((master, group) => {
  return Object.keys(clientBase[group]).reduce((object, name) => {
    return {
      ...object,
      [camelCase(name)]: {
        object: clientBase[group][name]
      }
    }
  }, master)
}, {})

export {
  client
}
