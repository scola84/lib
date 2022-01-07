import { cast, isArray, isPrimitive, isStruct } from '../../common'
import { ScolaDrag } from '../helpers/drag'
import { ScolaDrop } from '../helpers/drop'
import type { ScolaElement } from './element'
import { ScolaList } from '../helpers/list'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import { ScolaSelect } from '../helpers/select'
import { ScolaSort } from '../helpers/sort'
import { ScolaTableCellElement } from './table-cell'
import { ScolaTableRowElement } from './table-row'
import type { Struct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-table-add': CustomEvent
    'sc-table-clear': CustomEvent
    'sc-table-delete': CustomEvent
    'sc-table-load': CustomEvent
    'sc-table-report': CustomEvent
  }
}

export class ScolaTableElement extends HTMLTableElement implements ScolaElement {
  public body: HTMLTableSectionElement

  public bodyCellTemplate: HTMLTemplateElement | null

  public bodyRowTemplate: HTMLTemplateElement | null

  public drag?: ScolaDrag

  public drop?: ScolaDrop

  public elements = new Map<unknown, HTMLTableRowElement>()

  public head: HTMLTableSectionElement

  public headCellTemplate: HTMLTemplateElement | null

  public list: ScolaList

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public select?: ScolaSelect

  public sort?: ScolaSort

  public wait: boolean

  protected handleAddBound = this.handleAdd.bind(this)

  protected handleClearBound = this.handleClear.bind(this)

  protected handleDeleteBound = this.handleDelete.bind(this)

  protected handleLoadBound = this.handleLoad.bind(this)

  protected handleLoadItemsBound = this.handleLoadItems.bind(this)

  protected handleMutationsBound = this.handleMutations.bind(this)

  protected handleReportBound = this.handleReport.bind(this)

  public constructor () {
    super()
    this.list = new ScolaList(this)
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.head = this.selectHead()
    this.body = this.selectBody()
    this.bodyCellTemplate = this.mutator.selectTemplate('body-cell')
    this.bodyRowTemplate = this.mutator.selectTemplate('body-row')
    this.headCellTemplate = this.mutator.selectTemplate('head-cell')

    if (this.hasAttribute('sc-drag')) {
      this.drag = new ScolaDrag(this)
    }

    if (this.hasAttribute('sc-drop')) {
      this.drop = new ScolaDrop(this)
    }

    if (this.hasAttribute('sc-select')) {
      this.select = new ScolaSelect(this)
    }

    if (this.hasAttribute('sc-sort')) {
      this.sort = new ScolaSort(this)
    }

    this.reset()

    if (this.bodyRowTemplate === null) {
      this.updateAttributes()
    }
  }

  public static define (): void {
    customElements.define('sc-table', ScolaTableElement, {
      extends: 'table'
    })
  }

  public add (item: Struct): void {
    this.list.add(item)
  }

  public clear (): void {
    this.select?.clear()
    this.list.clear()

    this.elements.forEach((element) => {
      element.remove()
    })

    this.elements.clear()
  }

  public connectedCallback (): void {
    this.observer.observe(this.handleMutationsBound, [
      'sc-drag-handle',
      'sc-list-filter',
      'sc-list-sort-key',
      'sc-list-sort-order',
      'sc-select-all',
      'sc-select-handle'
    ])

    this.drag?.connect()
    this.drop?.connect()
    this.list.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.select?.connect()
    this.sort?.connect()
    this.addEventListeners()

    if (!this.wait) {
      this.wait = true

      window.requestAnimationFrame(() => {
        this.list.load()
      })
    }
  }

  public delete (item: Struct): void {
    this.select?.delete(item)
    this.list.delete(item)
  }

  public disconnectedCallback (): void {
    this.drag?.disconnect()
    this.drop?.disconnect()
    this.list.disconnect()
    this.mutator.disconnect()
    this.propagator.disconnect()
    this.select?.disconnect()
    this.sort?.disconnect()
    this.removeEventListeners()
  }

  public getData (): unknown {
    return {
      selected: this.select?.rows.length,
      ...this.select?.firstRow?.datamap
    }
  }

  public reset (): void {
    this.wait = this.hasAttribute('sc-wait')
  }

  public setData (data: unknown): void {
    if (isArray(data)) {
      data.forEach((item) => {
        if (isStruct(item)) {
          if (item[this.list.key] === undefined) {
            Object.defineProperty(item, this.list.key, {
              enumerable: true,
              value: `${Date.now()}-${this.list.items.length}`,
              writable: false
            })
          }

          this.list.items.push(item)
        }
      })

      this.update()
    }
  }

  public update (): void {
    if (
      this.list.limit === 0 &&
      this.list.mode !== undefined
    ) {
      this.clear()
      this.list.load()
    } else {
      this.updateHead()
      this.updateBody()
      this.updateAttributes()
    }
  }

  public updateAttributes (): void {
    this.setAttribute('sc-elements', this.elements.size.toString())
  }

  public updateBody (): void {
    const keys = this.list
      .getItems()
      .map((item, index) => {
        return this.appendBodyRow(item, index)
      })

    Array
      .from(this.elements.entries())
      .forEach(([key, element]) => {
        if (!keys.includes(key)) {
          element.remove()
          this.elements.delete(key)
        }
      })
  }

  public updateHead (): void {
    if (
      this.head.lastElementChild instanceof HTMLTableRowElement &&
      this.headCellTemplate !== null
    ) {
      this.appendHeadCells(this.head.lastElementChild)
    }
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-table-add', this.handleAddBound)
    this.addEventListener('sc-table-clear', this.handleClearBound)
    this.addEventListener('sc-table-delete', this.handleDeleteBound)
    this.addEventListener('sc-table-load', this.handleLoadBound)
    this.addEventListener('sc-table-load-items', this.handleLoadItemsBound)
    this.addEventListener('sc-table-report', this.handleReportBound)
  }

  protected appendBodyCells (row: HTMLTableRowElement, item: Struct): void {
    Object
      .entries(item)
      .forEach(([key, value]) => {
        const property = Object.getOwnPropertyDescriptor(item, key)
        const template = this.bodyCellTemplate?.content.cloneNode(true)

        let element: HTMLTableCellElement | null = null

        if (
          property?.writable === true &&
          template instanceof DocumentFragment &&
          template.firstElementChild instanceof HTMLTableCellElement
        ) {
          element = template.firstElementChild
          row.appendChild(template)

          if (element instanceof ScolaTableCellElement) {
            element.setData({
              value
            })
          } else {
            window.requestAnimationFrame(() => {
              if (element instanceof ScolaTableCellElement) {
                element.setData({
                  value
                })
              }
            })
          }
        }
      })
  }

  protected appendBodyRow (item: Struct, index: number): unknown {
    const key = item[this.list.key]

    let element = this.elements.get(key)

    if (element === undefined) {
      const template = this.bodyRowTemplate?.content.cloneNode(true)

      if (
        template instanceof DocumentFragment &&
        template.firstElementChild instanceof HTMLTableRowElement
      ) {
        element = template.firstElementChild
        this.body.appendChild(template)
        this.elements.set(key, element)

        if (element instanceof ScolaTableRowElement) {
          element.setData(item)
          this.appendBodyCells(element, item)
        } else {
          window.requestAnimationFrame(() => {
            if (element instanceof ScolaTableRowElement) {
              element.setData(item)
              this.appendBodyCells(element, item)
            }
          })
        }
      }
    } else if (Array.prototype.indexOf.call(this.body.children, element) !== index) {
      if (index === 0) {
        this.body.prepend(element)
      } else {
        this.body.children.item(index - 1)?.after(element)
      }
    }

    if (
      this.select?.all === true ||
      item.selected === true
    ) {
      this.select?.add(element as ScolaTableRowElement)
    }

    return key
  }

  protected appendHeadCells (row: HTMLTableRowElement): void {
    row.innerHTML = ''

    const [item] = this.list.items

    Object
      .keys(item)
      .forEach((key) => {
        const property = Object.getOwnPropertyDescriptor(item, key)
        const template = this.headCellTemplate?.content.cloneNode(true)

        let element: HTMLTableCellElement | null = null

        if (
          property?.writable === true &&
          template instanceof DocumentFragment &&
          template.firstElementChild instanceof HTMLTableCellElement
        ) {
          element = template.firstElementChild
          row.appendChild(template)

          element
            .querySelectorAll('[data-sc-list-sort-order]')
            .forEach((child) => {
              child.setAttribute('data-sc-list-sort-key', String(key))
            })

          if (element instanceof ScolaTableCellElement) {
            element.setData({ key })
          } else {
            window.requestAnimationFrame(() => {
              if (element instanceof ScolaTableCellElement) {
                element.setData({ key })
              }
            })
          }
        }
      })
  }

  protected handleAdd (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this.add(event.detail)
      this.update()
    } else {
      const detail = cast(event.detail)

      if (isPrimitive(detail)) {
        this.add({
          [this.list.key]: detail
        })

        this.update()
      }
    }
  }

  protected handleClear (): void {
    this.clear()
    this.update()
  }

  protected handleDelete (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this.delete(event.detail)
      this.update()
    } else {
      const detail = cast(event.detail)

      if (isPrimitive(detail)) {
        this.delete({
          [this.list.key]: detail
        })

        this.update()
      }
    }
  }

  protected handleLoad (): void {
    this.clear()
    this.list.load()
  }

  protected handleLoadItems (): void {
    this.list.loadItems()
  }

  protected handleMutations (mutations: MutationRecord[]): void {
    const attributes = this.observer.normalize(mutations)

    if (attributes.includes('sc-drag-handle')) {
      this.handleMutationsDragHandle()
    } else if (
      attributes.includes('sc-list-filter') ||
      attributes.includes('sc-list-sort-key') ||
      attributes.includes('sc-list-sort-order')
    ) {
      this.handleMutationsList()
    } else if (attributes.includes('sc-select-all')) {
      this.handleMutationsSelectAll()
    } else if (attributes.includes('sc-select-handle')) {
      this.handleMutationsSelectHandle()
    }
  }

  protected handleMutationsDragHandle (): void {
    this.drag?.reset()
  }

  protected handleMutationsList (): void {
    this.list.reset()
    this.update()
  }

  protected handleMutationsSelectAll (): void {
    this.select?.reset()
    this.select?.toggleAll(this.select.all)
  }

  protected handleMutationsSelectHandle (): void {
    this.removeAttribute('sc-select-all')
    this.select?.reset()
    this.select?.clear()

    this
      .querySelectorAll('[sc-handle="select"] > *')
      .forEach((element) => {
        element.toggleAttribute('disabled', this.select?.handle === false)
      })
  }

  protected handleReport (event: CustomEvent): void {
    this.propagator.dispatch('report', [{
      added: Array.from(this.list.added),
      deleted: Array.from(this.list.deleted),
      items: this.list.getItemsByRow(),
      keys: this.list.getKeysByRow(),
      selected: this.select?.getKeysByRow()
    }], event)
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-table-add', this.handleAddBound)
    this.removeEventListener('sc-table-clear', this.handleClearBound)
    this.removeEventListener('sc-table-delete', this.handleDeleteBound)
    this.removeEventListener('sc-table-load', this.handleLoadBound)
    this.removeEventListener('sc-table-load-items', this.handleLoadItemsBound)
    this.removeEventListener('sc-table-report', this.handleReportBound)
  }

  protected selectBody (): HTMLTableSectionElement {
    return this.querySelector('tbody') ?? this.createTBody()
  }

  protected selectHead (): HTMLTableSectionElement {
    return this.querySelector('thead') ?? this.createTHead()
  }
}
