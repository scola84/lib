import camel from 'lodash-es/camelCase'
import transportBase from './transport'

const transport = Object.keys(transportBase).reduce((master, group) => {
  return Object.keys(transportBase[group]).reduce((object, name) => {
    return Object.assign(object, {
      [camel(name)]: {
        object: transportBase[group][name]
      }
    })
  }, master)
}, {})

export {
  transport
}
