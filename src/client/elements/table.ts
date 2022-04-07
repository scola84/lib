import { Dragger, Dropper, Mutator, Observer, Propagator, TableLister, TableSelector, TableSorter, TableTree } from '../helpers'
import { cast, isArray, isPrimitive, isStruct } from '../../common'
import type { ScolaElement } from './element'
import { ScolaTableCellElement } from './table-cell'
import { ScolaTableRowElement } from './table-row'
import type { Struct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-table-add': CustomEvent
    'sc-table-add-all': CustomEvent
    'sc-table-clear': CustomEvent
    'sc-table-delete': CustomEvent
    'sc-table-delete-all': CustomEvent
    'sc-table-dispatch': CustomEvent
    'sc-table-put': CustomEvent
    'sc-table-put-all': CustomEvent
    'sc-table-request': CustomEvent
    'sc-table-start': CustomEvent
  }
}

export interface ScolaTableElementState extends Struct {
  added: number
  deleted: number
  elements: number
  selected: number
}

export class ScolaTableElement extends HTMLTableElement implements ScolaElement {
  public body: HTMLTableSectionElement

  public dragger?: Dragger

  public dropper?: Dropper

  public elements = new Map<unknown, ScolaTableRowElement>()

  public head: HTMLTableSectionElement

  public lister: TableLister

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public selector?: TableSelector

  public sorter?: TableSorter

  public templates: Map<string, HTMLTemplateElement>

  public tree?: TableTree

  public wait: boolean

  public get data (): unknown {
    return {
      ...this.dataset
    }
  }

  public set data (data: unknown) {
    if (this.tree?.requestItem === undefined) {
      this.lister.setData(data)
    } else {
      this.tree.setData(data)
    }

    this.update()
  }

  protected handleAddAllBound = this.handleAddAll.bind(this)

  protected handleAddBound = this.handleAdd.bind(this)

  protected handleClearBound = this.handleClear.bind(this)

  protected handleDeleteAllBound = this.handleDeleteAll.bind(this)

  protected handleDeleteBound = this.handleDelete.bind(this)

  protected handleDispatchBound = this.handleDispatch.bind(this)

  protected handleObserverBound = this.handleObserver.bind(this)

  protected handlePutAllBound = this.handlePutAll.bind(this)

  protected handlePutBound = this.handlePut.bind(this)

  protected handleRequestBound = this.handleRequest.bind(this)

  protected handleStartBound = this.handleStart.bind(this)

  public constructor () {
    super()
    this.body = this.selectBody()
    this.head = this.selectHead()
    this.lister = new TableLister(this)
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.templates = this.mutator.selectTemplates()

    if (this.hasAttribute('sc-drag')) {
      this.dragger = new Dragger(this)
    }

    if (this.hasAttribute('sc-drop')) {
      this.dropper = new Dropper(this)
    }

    if (this.hasAttribute('sc-select')) {
      this.selector = new TableSelector(this)
    }

    if (this.hasAttribute('sc-sort')) {
      this.sorter = new TableSorter(this)
    }

    if (this.hasAttribute('sc-tree')) {
      this.tree = new TableTree(this)
    }

    this.reset()

    if (!this.templates.has('body-row')) {
      this.updateAttributes()
    }
  }

  public static define (): void {
    customElements.define('sc-table', ScolaTableElement, {
      extends: 'table'
    })
  }

  public add (item: unknown): void {
    if (isStruct(item)) {
      this.lister.add(item)
    }
  }

  public addAll (items: unknown[]): void {
    items.forEach((item) => {
      this.add(item)
    })
  }

  public clear (): void {
    this.selector?.clear()
    this.lister.clear()

    this.elements.forEach((element) => {
      element.remove()
    })

    this.elements.clear()
  }

  public connectedCallback (): void {
    this.observer.observe(this.handleObserverBound)
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
        this.lister.start()
      })
    }
  }

  public delete (item: unknown): void {
    if (isStruct(item)) {
      this.selector?.delete(item)
      this.lister.delete(item)
    }
  }

  public deleteAll (items: unknown[]): void {
    items.forEach((item) => {
      this.delete(item)
    })
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

  public notify (): void {
    this.toggleAttribute('sc-updated', true)
    this.toggleAttribute('sc-updated', false)
    this.propagator.dispatch('update')

    if (this.elements.size === 0) {
      this.propagator.dispatch('empty')
    }
  }

  public put (item: unknown): void {
    if (isStruct(item)) {
      this.lister.put(item)
    }
  }

  public putAll (items: unknown[]): void {
    items.forEach((item) => {
      this.put(item)
    })
  }

  public reset (): void {
    this.wait = this.hasAttribute('sc-wait')
  }

  public update (): void {
    if (
      this.lister.limit === 0 &&
      this.lister.mode !== null
    ) {
      this.lister.start()
    } else {
      this.updateElements()
      this.updateAttributes()
      this.notify()
    }
  }

  public updateAttributes (): void {
    this.setAttribute('sc-elements', this.elements.size.toString())

    if (this.body.hasAttribute('tabindex')) {
      if (this.selector?.focusedRow === undefined) {
        this.body.setAttribute('tabindex', '0')
      } else {
        this.body.setAttribute('tabindex', '-1')
      }
    }
  }

  public updateElements (): void {
    if (
      this.head.lastElementChild instanceof HTMLTableRowElement &&
      this.head.lastElementChild.childElementCount === 0 &&
      this.templates.has('head-cell')
    ) {
      this.appendHeadCells(this.head.lastElementChild)
    }

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

  protected addEventListeners (): void {
    this.addEventListener('sc-table-add', this.handleAddBound)
    this.addEventListener('sc-table-add-all', this.handleAddAllBound)
    this.addEventListener('sc-table-clear', this.handleClearBound)
    this.addEventListener('sc-table-delete', this.handleDeleteBound)
    this.addEventListener('sc-table-delete-all', this.handleDeleteAllBound)
    this.addEventListener('sc-table-dispatch', this.handleDispatchBound)
    this.addEventListener('sc-table-put', this.handlePutBound)
    this.addEventListener('sc-table-put-all', this.handlePutAllBound)
    this.addEventListener('sc-table-request', this.handleRequestBound)
    this.addEventListener('sc-table-start', this.handleStartBound)
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
            element.data = {
              value
            }
          } else {
            window.requestAnimationFrame(() => {
              if (element instanceof ScolaTableCellElement) {
                element.data = {
                  value
                }
              }
            })
          }
        }
      })
  }

  protected appendBodyRow (item: Struct): ScolaTableRowElement | undefined {
    const key = item[this.lister.pkey]

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
          element.data = item
        } else {
          window.requestAnimationFrame(() => {
            if (element instanceof ScolaTableRowElement) {
              element.data = item
            }
          })
        }

        if (this.templates.has('body-cell')) {
          this.appendBodyCells(element, item)
        }
      }
    } else {
      if (!this.templates.has('body-cell')) {
        element.data = item
      }

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
        keys.push(item[this.lister.pkey])
        this.appendBodyRow(item)
        this.tree?.updateRow(item, level)

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
            .querySelectorAll('[sc-data-order]')
            .forEach((child) => {
              child.setAttribute(`data-data-order-${key}`, child.getAttribute('sc-data-order') ?? '')
            })

          element
            .querySelectorAll('[sc-order]')
            .forEach((child) => {
              child.setAttribute(`data-order-${key}`, child.getAttribute('sc-order') ?? '')
            })

          if (element instanceof ScolaTableCellElement) {
            element.data = { key }
          } else {
            window.requestAnimationFrame(() => {
              if (element instanceof ScolaTableCellElement) {
                element.data = { key }
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
          [this.lister.pkey]: detail
        })

        this.update()
      }
    }
  }

  protected handleAddAll (event: CustomEvent): void {
    if (isArray(event.detail)) {
      this.addAll(event.detail)
      this.update()
    }
  }

  protected handleClear (): void {
    this.clear()
  }

  protected handleDelete (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this.delete(event.detail)
      this.update()
    } else {
      const detail = cast(event.detail)

      if (isPrimitive(detail)) {
        this.delete({
          [this.lister.pkey]: detail
        })

        this.update()
      }
    }
  }

  protected handleDeleteAll (event: CustomEvent): void {
    if (isArray(event.detail)) {
      this.deleteAll(event.detail)
      this.update()
    }
  }

  protected handleDispatch (event: CustomEvent): void {
    if (
      isStruct(event.detail) &&
      typeof event.detail.data === 'string' &&
      typeof event.detail.event === 'string'
    ) {
      let data: unknown = null

      switch (event.detail.data) {
        case 'lister-diff':
          data = this.lister.getDiff()
          break
        case 'lister-items':
          data = this.lister.getItemsByRow()
          break
        case 'lister-keys':
          data = this.lister.getKeysByRow()
          break
        case 'selector-items':
          data = this.selector?.getItemsByRow()
          break
        case 'selector-keys':
          data = this.selector?.getKeysByRow()
          break
        default:
          break
      }

      this.propagator.dispatch(event.detail.event, [data], event)
    }
  }

  protected handleObserver (mutations: MutationRecord[]): void {
    this.observer
      .normalizeMutations(mutations)
      .forEach((attribute) => {
        if (attribute === 'sc-drag-handle') {
          this.handleObserverDragHandle()
        } else if (attribute === 'sc-select-all') {
          this.handleObserverSelectAll()
        } else if (attribute === 'sc-select-handle') {
          this.handleObserverSelectHandle()
        } else if (
          attribute.startsWith('data-join') ||
          attribute.startsWith('data-operator') ||
          attribute.startsWith('data-order') ||
          attribute.startsWith('data-where')
        ) {
          this.handleObserverList()
        }
      })
  }

  protected handleObserverDragHandle (): void {
    this.dragger?.reset()
  }

  protected handleObserverList (): void {
    if (this.lister.query) {
      this.update()
    } else {
      this.clear()
      this.lister.request()
    }
  }

  protected handleObserverSelectAll (): void {
    this.selector?.reset()
    this.selector?.toggleAll(this.selector.all)
  }

  protected handleObserverSelectHandle (): void {
    this.removeAttribute('sc-select-all')
    this.lister.reset()
    this.selector?.reset()
    this.selector?.clear()
  }

  protected handlePut (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this.put(event.detail)
      this.update()
    }
  }

  protected handlePutAll (event: CustomEvent): void {
    if (isArray(event.detail)) {
      this.putAll(event.detail)
      this.update()
    }
  }

  protected handleRequest (): void {
    this.lister.request()
  }

  protected handleStart (): void {
    this.lister.start()
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-table-add', this.handleAddBound)
    this.removeEventListener('sc-table-add-all', this.handleAddAllBound)
    this.removeEventListener('sc-table-clear', this.handleClearBound)
    this.removeEventListener('sc-table-delete', this.handleDeleteBound)
    this.removeEventListener('sc-table-delete-all', this.handleDeleteAllBound)
    this.removeEventListener('sc-table-dispatch', this.handleDispatchBound)
    this.removeEventListener('sc-table-put', this.handlePutBound)
    this.removeEventListener('sc-table-put-all', this.handlePutAllBound)
    this.removeEventListener('sc-table-request', this.handleRequestBound)
    this.removeEventListener('sc-table-start', this.handleStartBound)
  }

  protected selectBody (): HTMLTableSectionElement {
    return this.querySelector('tbody') ?? this.createTBody()
  }

  protected selectHead (): HTMLTableSectionElement {
    return this.querySelector('thead') ?? this.createTHead()
  }
}
