import camelCase from 'lodash/camelCase.js'
import { Node } from '../snippet/node.js'
import clsBase from './cls.js'
import domBase from './dom.js'
import snippetBase from './snippet.js'

const cls = clsBase.reduce((object, name) => {
  return {
    ...object,
    [camelCase(name)]: {
      object: Node,
      options: {
        class: camelCase(name),
        name: 'div'
      }
    }
  }
}, {})

const dom = domBase.reduce((object, name) => {
  return {
    ...object,
    [camelCase(name)]: {
      object: Node,
      options: {
        name
      }
    }
  }
}, {})

const snippet = Object.keys(snippetBase).reduce((master, group) => {
  return Object.keys(snippetBase[group]).reduce((object, name) => {
    return {
      ...object,
      [camelCase(name)]: {
        object: snippetBase[group][name],
        options: {
          class: camelCase(name)
        }
      }
    }
  }, master)
}, {})

export default {
  snippet,
  cls,
  dom
}
