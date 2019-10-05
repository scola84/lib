import camel from 'lodash-es/camelCase'
import { Node } from '../snippet/node'

import clsBase from './cls'
import domBase from './dom'
import snippetBase from './snippet'

const cls = clsBase.reduce((object, name) => {
  return Object.assign(object, {
    [camel(name)]: {
      object: Node,
      options: {
        class: camel(name),
        name: 'div'
      }
    }
  })
}, {})

const dom = domBase.reduce((object, name) => {
  return Object.assign(object, {
    [camel(name)]: {
      object: Node,
      options: {
        name
      }
    }
  })
}, {})

const snippet = Object.keys(snippetBase).reduce((master, group) => {
  return Object.keys(snippetBase[group]).reduce((object, name) => {
    return Object.assign(object, {
      [camel(name)]: {
        object: snippetBase[group][name],
        options: {
          class: camel(name)
        }
      }
    })
  }, master)
}, {})

export default {
  snippet,
  cls,
  dom
}
