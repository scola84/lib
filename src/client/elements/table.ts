import { cast, isArray, isPrimitive, isStruct } from '../../common'
import { ScolaDrag } from '../helpers/drag'
import type { ScolaElement } from './element'
import { ScolaList } from '../helpers/list'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import { ScolaSelect } from '../helpers/select'
import { ScolaSort } from '../helpers/sort'
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

  public drag?: ScolaDrag

  public elements = new Map<unknown, Element>()

  public list: ScolaList

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public propagator: ScolaPropagator

  public select?: ScolaSelect

  public sort?: ScolaSort

  public template: HTMLTemplateElement | null

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
    this.body = this.selectTBody()
    this.template = this.selectTemplate()
    this.list = new ScolaList(this)
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)

    if (this.hasAttribute('sc-drag')) {
      this.drag = new ScolaDrag(this)
    }

    if (this.hasAttribute('sc-select')) {
      this.select = new ScolaSelect(this)
    }

    if (this.hasAttribute('sc-sort')) {
      this.sort = new ScolaSort(this)
    }

    this.reset()

    if (this.template === null) {
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

    this.list.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.drag?.connect()
    this.select?.connect()
    this.sort?.connect()
    this.addEventListeners()

    if (!this.wait) {
      this.wait = true

      window.setTimeout(() => {
        this.list.load()
      })
    }
  }

  public delete (item: Struct): void {
    this.select?.delete(item)
    this.list.delete(item)
  }

  public disconnectedCallback (): void {
    this.list.disconnect()
    this.mutator.disconnect()
    this.propagator.disconnect()
    this.drag?.disconnect()
    this.select?.disconnect()
    this.sort?.disconnect()
    this.removeEventListeners()
  }

  public getData (): Struct[] {
    return this.list.items
  }

  public reset (): void {
    this.wait = this.hasAttribute('sc-wait')
  }

  public setData (data: unknown): void {
    if (isArray(data)) {
      data.forEach((datum) => {
        if (isStruct(datum)) {
          this.list.items.push(datum)
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
      this.updateElements()
      this.updateAttributes()
    }
  }

  public updateAttributes (): void {
    this.setAttribute('sc-elements', this.elements.size.toString())
  }

  public updateElements (): void {
    const keys = this.list
      .getItems()
      .map((item) => {
        return this.appendElement(item)
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

  protected addEventListeners (): void {
    this.addEventListener('sc-table-add', this.handleAddBound)
    this.addEventListener('sc-table-clear', this.handleClearBound)
    this.addEventListener('sc-table-delete', this.handleDeleteBound)
    this.addEventListener('sc-table-load', this.handleLoadBound)
    this.addEventListener('sc-table-load-items', this.handleLoadItemsBound)
    this.addEventListener('sc-table-report', this.handleReportBound)
  }

  protected appendElement (item: Struct): unknown {
    const key = item[this.list.key]

    let element = this.elements.get(key)

    if (element === undefined) {
      const template = this.template?.content.cloneNode(true)

      if (
        template instanceof DocumentFragment &&
        template.firstElementChild !== null
      ) {
        element = template.firstElementChild
        this.body.appendChild(template)
        this.elements.set(key, element)

        window.requestAnimationFrame(() => {
          if (element instanceof ScolaTableRowElement) {
            element.setData(item)
          }
        })
      }
    } else {
      this.body.appendChild(element)
    }

    if (element?.getAttribute('is') === 'sc-table-row') {
      if (
        this.select?.all === true ||
        item.selected === true
      ) {
        this.select?.add(element as ScolaTableRowElement)
      }
    }

    return key
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
    const attributes = mutations.map((mutation) => {
      return mutation.attributeName
    })

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
      items: this.list.getKeys(),
      selected: this.select?.getKeys()
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

  protected selectTBody (): HTMLTableSectionElement {
    return this.querySelector('tbody') ?? this.createTBody()
  }

  protected selectTemplate (): HTMLTemplateElement | null {
    return this.querySelector('template[sc-name="item"]')
  }
}
