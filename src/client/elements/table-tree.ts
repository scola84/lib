import { isArray, isStruct } from '../../common'
import type { ScolaElement } from './element'
import { ScolaSelectTree } from '../helpers/select-tree'
import { ScolaTableElement } from './table'

export class ScolaTableTreeElement extends ScolaTableElement implements ScolaElement {
  public constructor () {
    super()

    if (this.hasAttribute('sc-select')) {
      this.select = new ScolaSelectTree(this)
    }
  }

  public static define (): void {
    customElements.define('sc-table-tree', ScolaTableTreeElement, {
      extends: 'table'
    })
  }

  protected appendBodyRows (items: unknown[], keys: unknown[], level = 0): unknown[] {
    items.forEach((item) => {
      if (isStruct(item)) {
        keys.push(item[this.list.key])

        const element = this.appendBodyRow(item)

        element?.style.setProperty('--sc-table-tree-level', level.toString())

        if (
          isArray(item.items) &&
          item.open === true
        ) {
          this.appendBodyRows(item.items, keys, level + 1)
        }
      }
    })

    return keys
  }
}
