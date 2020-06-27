import camelCase from 'lodash/camelCase.js'
import snippet from './snippet/index.js'

export default Object
  .keys(snippet)
  .reduce((master, group) => {
    return Object
      .keys(snippet[group])
      .reduce((object, name) => {
        return {
          ...object,
          [camelCase(name)]: {
            object: snippet[group][name]
          }
        }
      }, master)
  }, {})
