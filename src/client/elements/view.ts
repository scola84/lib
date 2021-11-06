import { absorb, isArray, isPrimitive, isSame, isStruct } from '../../common'
import type { ScolaElement } from './element'
import { ScolaHider } from '../helpers/hider'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import { ScolaSanitizer } from '../helpers/sanitizer'
import type { Struct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-view-add': CustomEvent
    'sc-view-back': CustomEvent
    'sc-view-forward': CustomEvent
    'sc-view-rewind': CustomEvent
  }
}

export interface View extends Struct {
  html?: string
  name: string
  params?: Struct
  source?: string
}

const viewElements = new Set<ScolaViewElement>()

export class ScolaViewElement extends HTMLDivElement implements ScolaElement {
  public static storage: Struct<Storage | undefined> = {
    local: window.localStorage,
    session: window.sessionStorage
  }

  public static views: Struct<string | undefined> = {}

  public hider?: ScolaHider

  public mutator: ScolaMutator

  public name: string | null

  public observer: ScolaObserver

  public params: Struct

  public pointer = -1

  public propagator: ScolaPropagator

  public sanitizer: ScolaSanitizer

  public save: string

  public storage: Storage

  public views: View[] = []

  public get view (): View | undefined {
    return this.views[this.pointer]
  }

  protected handleAddBound = this.handleAdd.bind(this)

  protected handleBackBound = this.handleBack.bind(this)

  protected handleForwardBound = this.handleForward.bind(this)

  protected handleMutationsBound = this.handleMutations.bind(this)

  protected handleRewindBound = this.handleRewind.bind(this)

  public constructor () {
    super()
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.sanitizer = new ScolaSanitizer()

    if (this.hasAttribute('sc-hide')) {
      this.hider = new ScolaHider(this)
    }

    this.reset()
  }

  public static define (): void {
    customElements.define('sc-view', ScolaViewElement, {
      extends: 'div'
    })
  }

  public static defineViews (views: Struct<string>): void {
    Object
      .entries(views)
      .forEach(([name, html]) => {
        ScolaViewElement.views[name] = html
      })
  }

  public add (options: Struct): void {
    const view = this.createView(options)

    if (this.isSame(view, this.view)) {
      this.go(this.pointer)
      return
    }

    this.views.splice(this.pointer + 1, this.views.length - this.pointer - 1, view)
    this.pointer = this.views.length - 1
    this.go(this.pointer)
  }

  public back (): void {
    this.go(this.pointer - 1)
  }

  public connectedCallback (): void {
    viewElements.add(this)

    this.observer.connect(this.handleMutationsBound, [
      'hidden'
    ])

    this.mutator.connect()
    this.propagator.connect()
    this.hider?.connect()
    this.addEventListeners()

    if (this.save !== '') {
      this.loadState()
    }

    if (
      !this.hasAttribute('hidden') ||
      this.view?.source === 'location'
    ) {
      window.setTimeout(() => {
        if (this.hider !== undefined) {
          this.hider.immediate = true
        }

        this.go(this.pointer)
      })
    }
  }

  public disconnectedCallback (): void {
    viewElements.delete(this)
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.hider?.disconnect()
    this.removeEventListeners()
    this.saveState()
  }

  public forward (): void {
    this.go(this.pointer + 1)
  }

  public getData (): string | undefined {
    return this.view?.html
  }

  public go (pointer = 0): void {
    if (
      pointer >= 0 &&
      pointer <= this.views.length - 1
    ) {
      this.pointer = pointer
    }

    if (this.view === undefined) {
      return
    }

    const html = ScolaViewElement.views[this.view.name]

    if (html === undefined) {
      this.propagator.dispatch('load', [this.view])
    } else {
      this.setData(html)
    }
  }

  public isSame (left?: View | null, right?: View | null): boolean {
    return isSame({
      name: left?.name,
      params: left?.params
    }, {
      name: right?.name,
      params: right?.params
    })
  }

  public loadPointer (): void {
    const pointers: unknown = window.history.state

    if (isStruct(pointers)) {
      const pointer = pointers[this.id]

      if (typeof pointer === 'number') {
        this.pointer = pointer
      }
    } else {
      this.pointer = 0
    }
  }

  public loadState (): void {
    this.loadStateFromElement(this)

    const stateStruct: unknown = JSON.parse(this.storage.getItem(`sc-view-${this.id}`) ?? 'null')

    if (isStruct(stateStruct)) {
      this.loadStateFromStorage(stateStruct)
      this.loadPointer()
    } else {
      this.loadStateFromLocation(window.location.pathname)
    }

    if (this.pointer === -1) {
      this.update()
    }
  }

  public reset (): void {
    this.name = this.getAttribute('sc-name')
    this.params = Object.fromEntries(new URLSearchParams(this.getAttribute('sc-params') ?? '').entries())
    this.save = this.getAttribute('sc-save') ?? ''
    this.storage = ScolaViewElement.storage[this.getAttribute('sc-storage') ?? 'session'] ?? window.sessionStorage
  }

  public rewind (): void {
    this.go(0)
  }

  public saveState (): void {
    const pointers: Struct<number> = {}

    const path = Array
      .from(viewElements)
      .reduce((result, viewElement) => {
        if (!viewElement.hasAttribute('hidden')) {
          if (viewElement.save.includes('storage')) {
            this.storage.setItem(`sc-view-${viewElement.id}`, JSON.stringify(viewElement.toObject()))
          }

          if (viewElement.save.includes('location')) {
            pointers[viewElement.id] = viewElement.pointer
            return `${result}${viewElement.toString()}`
          }
        }

        return result
      }, '')

    window.history.replaceState(pointers, '', path)
  }

  public setData (data: unknown): void {
    if (
      this.view !== undefined &&
      typeof data === 'string'
    ) {
      this.view.html = data
      this.update()
    }
  }

  public toObject (): Struct {
    return {
      pointer: this.pointer,
      views: this.views.map((view) => {
        return {
          name: view.name,
          params: view.params
        }
      })
    }
  }

  public toString (): string {
    if (this.view === undefined) {
      return ''
    }

    let params = Object
      .entries(this.view.params ?? {})
      .map(([name, value]) => {
        if (isPrimitive(value)) {
          return `${name}=${value.toString()}`
        }

        return name
      })
      .join('&')

    if (params.length > 0) {
      params = `:${params}`
    }

    return `/${this.view.name}${params}@${this.id}`
  }

  public update (): void {
    const { view } = this

    if (view?.html !== undefined) {
      this.innerHTML = this.sanitizer.sanitizeHtml(view.html)
      this.updateAttributes()
    }

    if (this.save !== '') {
      this.saveState()
    }
  }

  public updateAttributes (): void {
    this.toggleAttribute('hidden', false)
    this.toggleAttribute('sc-has-next', this.pointer < this.views.length - 1)
    this.toggleAttribute('sc-has-previous', this.pointer > 0)
    this.setAttribute('sc-pointer', this.pointer.toString())
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-view-add', this.handleAddBound)
    this.addEventListener('sc-view-back', this.handleBackBound)
    this.addEventListener('sc-view-forward', this.handleForwardBound)
    this.addEventListener('sc-view-rewind', this.handleRewindBound)
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

  protected handleForward (): void {
    this.forward()
  }

  protected handleMutations (mutations: MutationRecord[]): void {
    const attributes = mutations.map((mutation) => {
      return mutation.attributeName
    })

    if (attributes.includes('sc-pointer')) {
      this.update()
    } else if (attributes.includes('hidden')) {
      this.hider?.toggle()
      this.saveState()
    }
  }

  protected handleRewind (): void {
    this.rewind()
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
    const result = new RegExp(`/(?<name>[^:/]+):?(?<params>[^:/]+)?@${this.id}`, 'u').exec(string)

    if (result !== null) {
      const {
        name,
        params
      } = result.groups ?? {}

      const view = this.createView({
        name,
        params,
        source: 'location'
      })

      if (!this.isSame(view, this.views[this.pointer])) {
        this.views.push(view)
        this.pointer = this.views.length - 1
      }
    }
  }

  protected loadStateFromStorage (struct: Struct): void {
    if (isArray(struct.views)) {
      this.views = struct.views.map((view) => {
        return this.createView(view)
      })
    }

    if (
      typeof struct.pointer === 'number' &&
      struct.pointer > -1
    ) {
      this.pointer = struct.pointer
    }
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-view-add', this.handleAddBound)
    this.removeEventListener('sc-view-back', this.handleBackBound)
    this.removeEventListener('sc-view-forward', this.handleForwardBound)
    this.removeEventListener('sc-view-rewind', this.handleRewindBound)
  }
}
