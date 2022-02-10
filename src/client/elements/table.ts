import { cast, isPrimitive, isStruct } from '../../common'
import { ScolaDragger } from '../helpers/dragger'
import { ScolaDropper } from '../helpers/dropper'
import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import { ScolaTableCellElement } from './table-cell'
import { ScolaTableLister } from '../helpers/table-lister'
import { ScolaTableRowElement } from './table-row'
import { ScolaTableSelector } from '../helpers/table-selector'
import { ScolaTableSorter } from '../helpers/table-sorter'
import { ScolaTableTree } from '../helpers/table-tree'
import type { Struct } from '../../common'
import { isArray } from 'lodash'

declare global {
  interface HTMLElementEventMap {
    'sc-table-add': CustomEvent
    'sc-table-clear': CustomEvent
    'sc-table-delete': CustomEvent
    'sc-table-export': CustomEvent
    'sc-table-request': CustomEvent
  }
}

export class ScolaTableElement extends HTMLTableElement implements ScolaElement {
  public body: HTMLTableSectionElement

  public dragger?: ScolaDragger

  public dropper?: ScolaDropper

  public elements = new Map<unknown, ScolaTableRowElement>()

  public hasBodyCell: boolean

  public hasBodyRow: boolean

  public hasHeadCell: boolean

  public head: HTMLTableSectionElement

  public lister: ScolaTableLister

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public selector?: ScolaTableSelector

  public sorter?: ScolaTableSorter

  public templates: Map<string, HTMLTemplateElement>

  public tree?: ScolaTableTree

  public wait: boolean

  protected handleAddBound = this.handleAdd.bind(this)

  protected handleClearBound = this.handleClear.bind(this)

  protected handleDeleteBound = this.handleDelete.bind(this)

  protected handleExportBound = this.handleExport.bind(this)

  protected handleObserverBound = this.handleObserver.bind(this)

  protected handleRequestBound = this.handleRequest.bind(this)

  protected handleRequestItemsBound = this.handleRequestItems.bind(this)

  public constructor () {
    super()
    this.lister = new ScolaTableLister(this)
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.head = this.selectHead()
    this.body = this.selectBody()
    this.templates = this.mutator.selectTemplates()

    if (this.hasAttribute('sc-drag')) {
      this.dragger = new ScolaDragger(this)
    }

    if (this.hasAttribute('sc-drop')) {
      this.dropper = new ScolaDropper(this)
    }

    if (this.hasAttribute('sc-select')) {
      this.selector = new ScolaTableSelector(this)
    }

    if (this.hasAttribute('sc-sort')) {
      this.sorter = new ScolaTableSorter(this)
    }

    if (this.hasAttribute('sc-tree')) {
      this.tree = new ScolaTableTree(this)
    }

    this.reset()

    if (!this.hasBodyRow) {
      this.updateAttributes()
    }
  }

  public static define (): void {
    customElements.define('sc-table', ScolaTableElement, {
      extends: 'table'
    })
  }

  public addItem (item: Struct): void {
    this.lister.addItem(item)
  }

  public clearItems (): void {
    this.selector?.clearRows()
    this.lister.clearItems()

    this.elements.forEach((element) => {
      element.remove()
    })

    this.elements.clear()
  }

  public connectedCallback (): void {
    this.observer.observe(this.handleObserverBound, [
      'sc-drag-handle',
      'sc-list-filter',
      'sc-list-sort-key',
      'sc-list-sort-order',
      'sc-select-all',
      'sc-select-handle'
    ])

    this.dragger?.connect()
    this.dropper?.connect()
    this.lister.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.selector?.connect()
    this.sorter?.connect()
    this.addEventListeners()

    if (!this.wait) {
      this.wait = true

      window.requestAnimationFrame(() => {
        this.lister.request()
      })
    }
  }

  public deleteItem (item: Struct): void {
    this.selector?.deleteRow(item)
    this.lister.deleteItem(item)
  }

  public disconnectedCallback (): void {
    this.dragger?.disconnect()
    this.dropper?.disconnect()
    this.lister.disconnect()
    this.mutator.disconnect()
    this.propagator.disconnect()
    this.selector?.disconnect()
    this.sorter?.disconnect()
    this.removeEventListeners()
  }

  public getData (): unknown {
    return {
      selected: this.selector?.rows.length,
      ...this.selector?.firstRow?.datamap
    }
  }

  public reset (): void {
    this.hasBodyCell = this.templates.has('body-cell')
    this.hasBodyRow = this.templates.has('body-row')
    this.hasHeadCell = this.templates.has('head-cell')
    this.wait = this.hasAttribute('sc-wait')
  }

  public setData (data: unknown): void {
    if (this.tree?.requestItem === undefined) {
      this.lister.setData(data)
    } else {
      this.tree.setData(data)
    }
  }

  public update (): void {
    if (
      this.lister.limit === 0 &&
      this.lister.mode !== null
    ) {
      this.clearItems()
      this.lister.request()
    } else {
      this.propagator.dispatch('beforeupdate', [{}])
      this.updateHead()
      this.updateBody()
      this.updateAttributes()

      window.requestAnimationFrame(() => {
        this.propagator.dispatch('update', [{}])
      })
    }
  }

  public updateAttributes (): void {
    this.setAttribute('sc-elements', this.elements.size.toString())

    if (this.body.hasAttribute('tabindex')) {
      if (this.selector?.rows.length === 0) {
        this.body.setAttribute('tabindex', '0')
      } else {
        this.body.setAttribute('tabindex', '-1')
      }
    }
  }

  public updateBody (): void {
    const keys = this.appendBodyRows(this.lister.getItems(), [])

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
      this.head.lastElementChild.childElementCount === 0 &&
      this.hasHeadCell
    ) {
      this.appendHeadCells(this.head.lastElementChild)
    }
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-table-add', this.handleAddBound)
    this.addEventListener('sc-table-clear', this.handleClearBound)
    this.addEventListener('sc-table-delete', this.handleDeleteBound)
    this.addEventListener('sc-table-export', this.handleExportBound)
    this.addEventListener('sc-table-request', this.handleRequestBound)
    this.addEventListener('sc-table-request-items', this.handleRequestItemsBound)
  }

  protected appendBodyCells (row: HTMLTableRowElement, item: Struct): void {
    Object
      .entries(item)
      .forEach(([key, value]) => {
        const property = Object.getOwnPropertyDescriptor(item, key)
        const template = this.templates.get('body-cell')?.content.cloneNode(true)

        let element: ScolaTableCellElement | null = null

        if (
          property?.writable === true &&
          template instanceof DocumentFragment
        ) {
          element = template.firstElementChild as ScolaTableCellElement
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

  protected appendBodyRow (item: Struct): ScolaTableRowElement | undefined {
    const key = item[this.lister.key]

    let element = this.elements.get(key)

    if (element === undefined) {
      let templateName = 'body-row'

      if (this.tree !== undefined) {
        templateName = `body-${String(item.type)}`
      }

      const template = this.templates.get(templateName)?.content.cloneNode(true)

      if (template instanceof DocumentFragment) {
        element = template.firstElementChild as ScolaTableRowElement
        this.elements.set(key, element)
        this.body.appendChild(template)

        if (element instanceof ScolaTableRowElement) {
          element.setData(item)
        } else {
          window.requestAnimationFrame(() => {
            if (element instanceof ScolaTableRowElement) {
              element.setData(item)
            }
          })
        }

        if (this.hasBodyCell) {
          this.appendBodyCells(element, item)
        }
      }
    } else {
      this.body.appendChild(element)
    }

    if (element !== undefined) {
      if (this.selector?.all === true) {
        this.selector.addRow(element)
      }
    }

    return element
  }

  protected appendBodyRows (items: unknown[], keys: unknown[], level = 0): unknown[] {
    items.forEach((item) => {
      if (isStruct(item)) {
        keys.push(item[this.lister.key])
        this.appendBodyRow(item)
        this.tree?.update(item, level)

        if (
          isArray(item.items) &&
          this.tree?.isOpen(item) === true
        ) {
          this.appendBodyRows(item.items, keys, level + 1)
        }
      }
    })

    return keys
  }

  protected appendHeadCells (row: HTMLTableRowElement): void {
    row.innerHTML = ''

    const [item] = this.lister.items as Array<Struct | undefined>

    Object
      .keys(item ?? {})
      .forEach((key) => {
        const property = Object.getOwnPropertyDescriptor(item, key)
        const template = this.templates.get('head-cell')?.content.cloneNode(true)

        if (
          property?.writable === true &&
          template instanceof DocumentFragment &&
          template.firstElementChild instanceof HTMLTableCellElement
        ) {
          const element = template.firstElementChild

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
      this.addItem(event.detail)
      this.update()
    } else {
      const detail = cast(event.detail)

      if (isPrimitive(detail)) {
        this.addItem({
          [this.lister.key]: detail
        })

        this.update()
      }
    }
  }

  protected handleClear (): void {
    this.clearItems()
  }

  protected handleDelete (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this.deleteItem(event.detail)
      this.update()
    } else {
      const detail = cast(event.detail)

      if (isPrimitive(detail)) {
        this.deleteItem({
          [this.lister.key]: detail
        })

        this.update()
      }
    }
  }

  protected handleExport (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      if (cast(event.detail.diff) === true) {
        this.propagator.dispatch('exportdiff', [{
          added: Array.from(this.lister.added),
          deleted: Array.from(this.lister.deleted)
        }], event)
      } else if (cast(event.detail.list) === true) {
        this.propagator.dispatch('exportlist', [{
          items: this.lister.getItemsByRow(),
          keys: this.lister.getKeysByRow()
        }], event)
      } else if (cast(event.detail.select) === true) {
        this.propagator.dispatch('exportselect', [{
          items: this.selector?.getItemsByRow(),
          keys: this.selector?.getKeysByRow()
        }], event)
      }
    }
  }

  protected handleObserver (mutations: MutationRecord[]): void {
    const attributes = this.observer.normalize(mutations)

    if (attributes.includes('sc-drag-handle')) {
      this.handleObserverDragHandle()
    } else if (
      attributes.includes('sc-list-filter') ||
      attributes.includes('sc-list-sort-key') ||
      attributes.includes('sc-list-sort-order')
    ) {
      this.handleObserverList()
    } else if (attributes.includes('sc-select-all')) {
      this.handleObserverSelectAll()
    } else if (attributes.includes('sc-select-handle')) {
      this.handleObserverSelectHandle()
    }
  }

  protected handleObserverDragHandle (): void {
    this.dragger?.reset()
  }

  protected handleObserverList (): void {
    this.lister.reset()
    this.update()
  }

  protected handleObserverSelectAll (): void {
    this.selector?.reset()
    this.selector?.toggleAll(this.selector.all)
  }

  protected handleObserverSelectHandle (): void {
    this.removeAttribute('sc-select-all')
    this.selector?.reset()
    this.selector?.clearRows()
  }

  protected handleRequest (): void {
    this.clearItems()
    this.lister.request()
  }

  protected handleRequestItems (): void {
    this.lister.requestItems()
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-table-add', this.handleAddBound)
    this.removeEventListener('sc-table-clear', this.handleClearBound)
    this.removeEventListener('sc-table-delete', this.handleDeleteBound)
    this.removeEventListener('sc-table-export', this.handleExportBound)
    this.removeEventListener('sc-table-request', this.handleRequestBound)
    this.removeEventListener('sc-table-request-items', this.handleRequestItemsBound)
  }

  protected selectBody (): HTMLTableSectionElement {
    return this.querySelector('tbody') ?? this.createTBody()
  }

  protected selectHead (): HTMLTableSectionElement {
    return this.querySelector('thead') ?? this.createTHead()
  }
}
