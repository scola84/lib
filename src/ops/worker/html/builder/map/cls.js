import camelCase from 'lodash/camelCase.js'
import { Node } from '../snippet/node.js'

const list = [
  'body',
  'bottom',
  'center',
  'col',
  'comment',
  'dialog',
  'footer',
  'graph',
  'group',
  'header',
  'icon',
  'item',
  'label',
  'main',
  'modal',
  'row',
  'left',
  'right',
  'title',
  'top'
]

export default list.reduce((object, name) => {
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
