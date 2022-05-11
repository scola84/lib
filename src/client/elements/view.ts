import { Hider, Mutator, Observer, Propagator, Sanitizer } from '../helpers'
import { Struct, createView, flatten, isArray, isNil, isNumber, isSame, isStruct, isTransaction } from '../../common'
import type { Transaction, View } from '../../common'
import type { RequireAtLeastOne } from 'type-fest'
import type { ScolaElement } from './element'

declare global {
  interface HTMLElementEventMap {
    'sc-view-add': CustomEvent
    'sc-view-back': CustomEvent
    'sc-view-clear': CustomEvent
    'sc-view-delete': CustomEvent
    'sc-view-forward': CustomEvent
    'sc-view-rewind': CustomEvent
    'sc-view-sort': CustomEvent
  }
}

interface ScolaElementView extends RequireAtLeastOne<Partial<View>, 'name'> {
  element?: Element
  params?: Struct
  source?: string
  title?: string
}

export class ScolaViewElement extends HTMLDivElement implements ScolaElement {
  public static origin = window.location.origin

  public static snippets: Partial<Struct<string>> = {}

  public static storage: Partial<Struct<Storage>> = {
    local: window.localStorage,
    session: window.sessionStorage
  }

  public defaultView?: ScolaElementView

  public hider?: Hider

  public mutator: Mutator

  public name: string | null

  public observer: Observer

  public origin = ScolaViewElement.origin

  public params: string | null

  public pointer = -1

  public propagator: Propagator

  public regexp: RegExp

  public sanitizer: Sanitizer

  public save: string

  public saveLimit: number

  public storage: Storage

  public unique: boolean

  public views: ScolaElementView[] = []

  public wait: boolean

  public get data (): unknown {
    return {
      name: this.view?.name ?? '',
      params: new URLSearchParams(flatten(this.view?.params ?? {})).toString()
    }
  }

  public set data (data: unknown) {
    if (isTransaction(data)) {
      this.commit(data)
    } else {
      this.propagator.setData(data)
    }
  }

  public get hasNext (): boolean {
    return this.pointer < this.views.length - 1
  }

  public get hasPrevious (): boolean {
    return this.pointer > 0
  }

  public get pointerFromOne (): number {
    return this.pointer + 1
  }

  public get view (): ScolaElementView | null {
    return this.views[this.pointer] ?? null
  }

  protected handleAddBound = this.handleAdd.bind(this)

  protected handleBackBound = this.handleBack.bind(this)

  protected handleClearBound = this.handleClear.bind(this)

  protected handleDeleteBound = this.handleDelete.bind(this)

  protected handleForwardBound = this.handleForward.bind(this)

  protected handleObserverBound = this.handleObserver.bind(this)

  protected handleRewindBound = this.handleRewind.bind(this)

  protected handleSortBound = this.handleSort.bind(this)

  public constructor () {
    super()
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.sanitizer = new Sanitizer()

    if (this.hasAttribute('sc-hide')) {
      this.hider = new Hider(this)
    }

    this.reset()
  }

  public static define (): void {
    customElements.define('sc-view', ScolaViewElement, {
      extends: 'div'
    })
  }

  public static defineSnippets (snippets: Struct<string>): void {
    Object
      .entries(snippets)
      .forEach(([name, snippet]) => {
        ScolaViewElement.snippets[name] = snippet
      })
  }

  public add (options: Struct): void {
    const view = this.createView(options)

    if (this.unique) {
      const index = this.views.findIndex((findView) => {
        return isSame(view, findView)
      })

      if (index > -1) {
        if (index !== this.pointer) {
          this.pointer = index
          this.go(this.pointer)
        }

        return
      }

      this.views.push(view)
    } else {
      if (isSame(view, this.view)) {
        this.update()
        return
      }

      this.views.splice(this.pointer + 1, this.views.length - this.pointer - 1, view)
    }

    this.views = this.views.slice(-this.saveLimit)
    this.pointer = this.views.length - 1
    this.go(this.pointer)
  }

  public back (): void {
    this.go(this.pointer - 1)
  }

  public clear (): void {
    this.views = []
    this.pointer = -1
    this.saveState()
  }

  public connectedCallback (): void {
    this.observer.observe(this.handleObserverBound, [
      'hidden',
      'sc-updated'
    ])

    this.hider?.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()

    if (!this.wait) {
      this.wait = true
      this.loadState()
    }
  }

  public delete (options: Struct): void {
    const view = this.createView(options)

    const index = this.views.findIndex((findView) => {
      return isSame(view, findView)
    })

    const isPointer = index === this.pointer

    this.views.splice(index, 1)

    if (
      index < this.pointer ||
      this.pointer === this.views.length
    ) {
      this.pointer -= 1
    }

    if (this.pointer === -1) {
      this.update()
    } else if (isPointer) {
      this.go(this.pointer)
    } else {
      this.updateAttributes()
      this.notify()
    }
  }

  public disconnectedCallback (): void {
    this.hider?.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()

    if (this.save !== '') {
      this.saveState()
    }
  }

  public forward (): void {
    this.go(this.pointer + 1)
  }

  public go (pointer: number): void {
    if (
      pointer >= 0 &&
      pointer <= this.views.length - 1
    ) {
      this.pointer = pointer
    }

    if (this.view === null) {
      return
    }

    if (this.view.element !== undefined) {
      this.update()
      return
    }

    const snippet = ScolaViewElement.snippets[this.view.name]

    if (snippet === undefined) {
      const transaction = {
        commit: this.view,
        type: 'view'
      }

      this.propagator.dispatchEvents<Transaction>('request', [transaction])
      this.update()
    } else {
      this.view.snippet = snippet
      this.update()
    }
  }

  public load (view: ScolaElementView): void {
    this.defaultView = view
    this.loadState()
  }

  public notify (): void {
    this.toggleAttribute('sc-updated', true)
    this.toggleAttribute('sc-updated', false)
    this.propagator.dispatchEvents('update')
  }

  public reset (): void {
    this.name = this.getAttribute('sc-name')
    this.params = this.getAttribute('sc-params')
    this.regexp = new RegExp(`/(?<name>[^:/]+):?(?<params>[^:/]+)?@${this.id}`, 'u')
    this.save = this.getAttribute('sc-save') ?? ''
    this.saveLimit = Number(this.getAttribute('sc-save-limit') ?? Infinity)
    this.storage = ScolaViewElement.storage[this.getAttribute('sc-storage') ?? 'session'] ?? window.sessionStorage
    this.unique = this.hasAttribute('sc-unique')
    this.wait = this.hasAttribute('sc-wait')
  }

  public rewind (): void {
    this.go(0)
  }

  public toJSON (): unknown {
    return {
      hasNext: this.hasNext,
      hasPrevious: this.hasPrevious,
      id: this.id,
      is: this.getAttribute('is'),
      name: this.name,
      nodeName: this.nodeName,
      params: this.params,
      pointer: this.pointer,
      regexp: this.regexp,
      save: this.save,
      saveLimit: this.saveLimit,
      unique: this.unique,
      views: this.views.length,
      wait: this.wait
    }
  }

  public toString (): string {
    if (this.view === null) {
      return ''
    }

    if (
      isStruct(this.data) &&
      typeof this.data.name === 'string' &&
      typeof this.data.params === 'string'
    ) {
      let {
        name,
        params
      } = this.data

      if (params.length > 0) {
        params = `:${params}`
      }

      return `/${name}${params}@${this.id}`
    }

    return ''
  }

  public update (): void {
    this.updateElements()
    this.updateAttributes()
    this.notify()
  }

  public updateAttributes (): void {
    this.toggleAttribute('hidden', false)
  }

  public updateElements (): void {
    const { view } = this

    if (view !== null) {
      if (isNil(view.snippet)) {
        this.innerHTML = ''
      } else if (view.element === undefined) {
        this.innerHTML = this.sanitizer.sanitizeHtml(view.snippet)
        view.element = this.firstElementChild ?? undefined
      } else if (this.firstElementChild === null) {
        this.appendChild(view.element)
      } else {
        this.replaceChild(view.element, this.firstElementChild)
      }

      view.title = this.firstElementChild?.getAttribute('sc-view-title') ?? ''
    }
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-view-add', this.handleAddBound)
    this.addEventListener('sc-view-back', this.handleBackBound)
    this.addEventListener('sc-view-clear', this.handleClearBound)
    this.addEventListener('sc-view-delete', this.handleDeleteBound)
    this.addEventListener('sc-view-forward', this.handleForwardBound)
    this.addEventListener('sc-view-rewind', this.handleRewindBound)
    this.addEventListener('sc-view-sort', this.handleSortBound)
  }

  protected commit (transaction: Transaction): void {
    if (this.isView(transaction.commit)) {
      if (typeof transaction.result === 'string') {
        transaction.commit.snippet = transaction.result

        if (transaction.commit === this.view) {
          this.update()
        }
      } else {
        const index = this.views.indexOf(transaction.commit)

        this.views.splice(index, 1)

        if (this.pointer >= index) {
          this.pointer -= 1
        }

        if (this.pointer === -1) {
          this.loadStateFromDefault(this.defaultView)
          this.go(this.pointer)
        }
      }
    }
  }

  protected createView (options?: unknown): ScolaElementView {
    const view: ScolaElementView = {
      name: '',
      params: {}
    }

    if (this.name === null) {
      if (isStruct(options)) {
        if (typeof options.name === 'string') {
          view.name = options.name
        }

        if (typeof options.params === 'string') {
          view.params = Struct.fromQuery(options.params)
        } else if (isStruct(options.params)) {
          view.params = options.params
        }

        if (typeof options.source === 'string') {
          view.source = options.source
        }
      }
    } else {
      view.name = this.name

      if (isStruct(options)) {
        view.params = options
      }
    }

    return view
  }

  protected handleAdd (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this.add(event.detail)
    }
  }

  protected handleBack (): void {
    this.back()
  }

  protected handleClear (): void {
    this.clear()
  }

  protected handleDelete (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this.delete(event.detail)
    }
  }

  protected handleForward (): void {
    this.forward()
  }

  protected handleObserver (mutations: MutationRecord[]): void {
    const attributes = this.observer.normalizeMutations(mutations)

    if (attributes.includes('hidden')) {
      this.hider?.toggle()
    }

    if (this.save !== '') {
      this.saveState()
    }
  }

  protected handleRewind (): void {
    this.rewind()
  }

  protected handleSort (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      const { items } = event.detail
      const { view } = this

      if (isArray(items)) {
        this.views.sort((left, right) => {
          return items.findIndex((findView) => {
            return isSame(left, findView)
          }) - items.findIndex((findView) => {
            return isSame(right, findView)
          })
        })
      }

      if (view !== null) {
        this.pointer = this.views.indexOf(view)
      }

      if (this.save !== '') {
        this.saveState()
      }
    }
  }

  protected isView (value: unknown): value is View {
    return (
      isStruct(value) &&
      typeof value.name === 'string'
    ) && (
      value.params === undefined ||
      isStruct(value.params)
    )
  }

  protected loadState (): void {
    this.loadStateFromElement(this)

    const stateStruct: unknown = JSON.parse(this.storage.getItem(`sc-view-${this.id}`) ?? 'null')

    if (isStruct(stateStruct)) {
      this.loadStateFromStorage(stateStruct)
    } else {
      this.loadStateFromLocation(window.location.pathname)
    }

    if (this.pointer === -1) {
      this.loadStateFromDefault(this.defaultView)
    }

    if (
      this.pointer === -1 &&
      !this.hasAttribute('hidden')
    ) {
      this.update()
    }

    if (
      !this.hasAttribute('hidden') ||
      this.view?.source === 'location'
    ) {
      window.requestAnimationFrame(() => {
        if (this.hider !== undefined) {
          this.hider.immediate = true
        }

        this.go(this.pointer)
      })
    }
  }

  protected loadStateFromDefault (view?: ScolaElementView): void {
    if (view !== undefined) {
      this.views.push({
        name: view.name
      })

      this.pointer = this.views.length - 1
    }
  }

  protected loadStateFromElement (element: ScolaViewElement): void {
    if (element.name !== null) {
      this.views = [{
        ...createView({
          name: element.name
        }),
        params: Struct.fromQuery(element.params ?? ''),
        source: 'element'
      }]

      this.pointer = 0
    }
  }

  protected loadStateFromLocation (string: string): void {
    const result = string.match(this.regexp)

    if (result !== null) {
      const {
        name,
        params = ''
      } = result.groups ?? {}

      const view: ScolaElementView = {
        name: name,
        params: Struct.fromQuery(params),
        source: 'location'
      }

      if (!isSame(view, this.views[this.pointer])) {
        this.views.push(view)
        this.pointer = this.views.length - 1
      }
    }
  }

  protected loadStateFromStorage (struct: Struct): void {
    if (
      isArray(struct.views) &&
      struct.views.length > 0
    ) {
      this.views = struct.views as View[]

      if (
        isNumber(struct.pointer) &&
        struct.pointer > -1
      ) {
        this.pointer = struct.pointer
      }
    }
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-view-add', this.handleAddBound)
    this.removeEventListener('sc-view-back', this.handleBackBound)
    this.removeEventListener('sc-view-clear', this.handleClearBound)
    this.removeEventListener('sc-view-delete', this.handleDeleteBound)
    this.removeEventListener('sc-view-forward', this.handleForwardBound)
    this.removeEventListener('sc-view-rewind', this.handleRewindBound)
    this.removeEventListener('sc-view-sort', this.handleSortBound)
  }

  protected saveState (): void {
    let current = ''
    let url = (this.origin + window.location.pathname).replace(/\/$/u, '')

    if (
      this.isConnected &&
      !this.hasAttribute('hidden')
    ) {
      if (this.save.includes('storage')) {
        this.storage.setItem(`sc-view-${this.id}`, JSON.stringify({
          pointer: this.pointer,
          views: this.views.map((view) => {
            return {
              name: view.name,
              params: view.params
            }
          })
        }))
      }

      if (this.save.includes('location')) {
        current = this.toString()
      }
    }

    const previous = (url.match(this.regexp) ?? []).shift()

    if (previous === undefined) {
      url += current
    } else {
      url = url.replace(previous, current)
    }

    window.history.replaceState(null, '', url + window.location.search + window.location.hash)
  }
}
