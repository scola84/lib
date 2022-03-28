import type { ScolaTableElement } from '../elements'
import type { Struct } from '../../common'
import { isArray } from '../../common'

export class TableTree {
  public element: ScolaTableElement

  public keys = new Set<unknown>()

  public requestItem?: Struct

  public constructor (element: ScolaTableElement) {
    this.element = element
  }

  public add (item: Struct): void {
    const key = item[this.element.lister.pkey]
    const row = this.element.elements.get(key)

    if (item.items === null) {
      if (this.requestItem === undefined) {
        this.requestItem = item
        this.element.propagator.dispatch('request', [item])
      }
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
    if (isArray(data)) {
      if (this.requestItem !== undefined) {
        this.requestItem.items = data
        this.add(this.requestItem)
      }
    }

    this.requestItem = undefined
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
