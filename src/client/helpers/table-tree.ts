import type { Struct, Transaction } from '../../common'
import { isArray, isStruct, isTransaction } from '../../common'
import type { ScolaTableElement } from '../elements'

export class TableTree {
  public element: ScolaTableElement

  public keys = new Set<unknown>()

  public constructor (element: ScolaTableElement) {
    this.element = element
  }

  public add (item: Struct): void {
    const key = item[this.element.lister.pkey]
    const row = this.element.elements.get(key)

    if (item.items === null) {
      this.element.propagator.dispatchEvents<Transaction>('request', [{
        commit: item,
        type: 'table-tree'
      }])
    } else {
      this.keys.add(key)
      this.element.update()
      row?.focus()
    }
  }

  public delete (item: Struct): void {
    const key = item[this.element.lister.pkey]
    const row = this.element.elements.get(key)

    this.keys.delete(key)
    this.element.update()
    row?.focus()
  }

  public isOpen (item: Struct): boolean {
    return this.keys.has(item[this.element.lister.pkey])
  }

  public setData (data: unknown): void {
    if (isTransaction(data)) {
      if (
        isStruct(data.commit) &&
        isArray(data.result)
      ) {
        const key = data.commit[this.element.lister.pkey]
        const row = this.element.elements.get(key)
        const item = row?.data

        if (isStruct(item)) {
          item.items = data.result
          this.add(item)
        }
      }
    }
  }

  public toggle (item: Struct, force?: boolean): void {
    const key = item[this.element.lister.pkey]

    if (
      force === false ||
      this.keys.has(key)
    ) {
      this.delete(item)
    } else if (
      force === true ||
      !this.keys.has(key)
    ) {
      this.add(item)
    }
  }

  public updateRow (item: Struct, level: number): void {
    const key = item[this.element.lister.pkey]
    const row = this.element.elements.get(key)

    row?.toggleAttribute('sc-open', this.isOpen(item))
    row?.style.setProperty('--sc-tree-level', level.toString())
  }
}
