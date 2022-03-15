import { Hider, Mutator, Observer, Propagator, Sanitizer } from '../helpers'
import { absorb, isArray, isPrimitive, isSame, isStruct } from '../../common'
import type { ScolaElement } from './element'
import type { Struct } from '../../common'

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

export interface View extends Struct {
  element?: Element
  name: string
  params?: Struct
  snippet?: string
  source?: string
  title?: string
}

export class ScolaViewElement extends HTMLDivElement implements ScolaElement {
  public static origin = window.location.origin

  public static snippets: Struct<string | undefined> = {}

  public static storage: Struct<Storage | undefined> = {
    local: window.localStorage,
    session: window.sessionStorage
  }

  public hider?: Hider

  public mutator: Mutator

  public name: string | null

  public observer: Observer

  public origin = ScolaViewElement.origin

  public params: Struct

  public pointer = -1

  public propagator: Propagator

  public regexp: RegExp

  public requestView?: View

  public sanitizer: Sanitizer

  public save: string

  public saveLimit: number

  public storage: Storage

  public unique: boolean

  public views: View[] = []

  public wait: boolean

  public get view (): View | null {
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
        return this.isSame(view, findView)
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
      if (this.isSame(view, this.view)) {
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
  }

  public connectedCallback (): void {
    this.observer.observe(this.handleObserverBound, [
      'hidden',
      'sc-views'
    ])

    this.hider?.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()

    if (this.wait) {
      if (this.save !== '') {
        this.saveState()
      }
    } else {
      this.wait = true
      this.loadState()

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
  }

  public delete (options: Struct): void {
    const view = this.createView(options)

    const index = this.views.findIndex((findView) => {
      return this.isSame(view, findView)
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

  public getData (): View | null {
    return this.view
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
      if (this.requestView === undefined) {
        this.requestView = this.view
        this.propagator.dispatch('request', [this.view])
        this.update()
      }
    } else {
      this.view.snippet = snippet
      this.update()
    }
  }

  public reset (): void {
    this.name = this.getAttribute('sc-name')
    this.params = Object.fromEntries(new URLSearchParams(this.getAttribute('sc-params') ?? '').entries())
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

  public setData (data: unknown): void {
    if (typeof data === 'string') {
      if (this.requestView !== undefined) {
        this.requestView.snippet = data
        this.update()
        this.requestView = undefined
      }
    } else {
      this.propagator.set(data)
    }
  }

  public toObject (): Struct<string> {
    return {
      name: this.view?.name ?? '',
      params: Object
        .entries(this.view?.params ?? {})
        .map(([name, value]) => {
          if (isPrimitive(value)) {
            return `${name}=${value.toString()}`
          }

          return name
        })
        .join('&')
    }
  }

  public toString (): string {
    if (this.view === null) {
      return ''
    }

    let {
      name,
      params
    } = this.toObject()

    if (params.length > 0) {
      params = `:${params}`
    }

    return `/${name}${params}@${this.id}`
  }

  public update (): void {
    this.updateElements()
    this.updateAttributes()
    this.propagator.dispatch('update', [this.getData()])
  }

  public updateAttributes (): void {
    this.toggleAttribute('hidden', false)
    this.toggleAttribute('sc-has-next', this.pointer < this.views.length - 1)
    this.toggleAttribute('sc-has-previous', this.pointer > 0)
    this.setAttribute('sc-views', this.views.length.toString())
    this.setAttribute('sc-pointer', this.pointer.toString())
    this.setAttribute('sc-updated', Date.now().toString())
  }

  public updateElements (): void {
    const { view } = this

    if (view !== null) {
      if (view.snippet === undefined) {
        this.innerHTML = ''
      } else if (view.element === undefined) {
        this.innerHTML = this.sanitizer.sanitizeHtml(view.snippet)
        view.element = this.firstElementChild ?? undefined
      } else if (this.firstElementChild === null) {
        this.appendChild(view.element)
      } else {
        this.replaceChild(view.element, this.firstElementChild)
      }

      view.title = this.firstElementChild?.getAttribute('sc-title') ?? ''
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

  protected createView (options?: unknown): View {
    const view: View = {
      name: '',
      params: {}
    }

    if (isStruct(options)) {
      if (typeof options.name === 'string') {
        view.name = options.name
      } else if (this.name !== null) {
        view.name = this.name
      }

      if (typeof options.params === 'string') {
        view.params = Object.fromEntries(new URLSearchParams(options.params).entries())
      } else if (isStruct(options.params)) {
        view.params = options.params
      } else {
        view.params = absorb(this.dataset, options)
      }

      if (typeof options.source === 'string') {
        view.source = options.source
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
    const attributes = this.observer.normalize(mutations)

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
            return this.isSame(left, findView)
          }) - items.findIndex((findView) => {
            return this.isSame(right, findView)
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

  protected isSame (data: unknown, view: unknown = this.view): boolean {
    return isSame(this.createView(data), this.createView(view))
  }

  protected loadState (): void {
    this.loadStateFromElement(this)

    const stateStruct: unknown = JSON.parse(this.storage.getItem(`sc-view-${this.id}`) ?? 'null')

    if (isStruct(stateStruct)) {
      this.loadStateFromStorage(stateStruct)
    } else {
      this.loadStateFromLocation(window.location.pathname)
    }

    if (
      this.pointer === -1 &&
      !this.hasAttribute('hidden')
    ) {
      this.update()
    }
  }

  protected loadStateFromElement (element: ScolaViewElement): void {
    if (element.name !== null) {
      this.views = [{
        name: element.name,
        params: element.params,
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
        params
      } = result.groups ?? {}

      const view = this.createView({
        name: name,
        params: params,
        source: 'location'
      })

      if (!this.isSame(view, this.views[this.pointer])) {
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
      this.views = struct.views.map((view) => {
        return this.createView(view)
      })

      if (
        typeof struct.pointer === 'number' &&
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

    window.history.replaceState(null, '', url)
  }
}
