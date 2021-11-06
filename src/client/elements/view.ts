import { absorb, isArray, isPrimitive, isSame, isStruct } from '../../common'
import { ScolaBreakpoint } from '../helpers/breakpoint'
import type { ScolaBreakpointEvent } from '../helpers/breakpoint'
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
    'sc-view-delete': CustomEvent
    'sc-view-forward': CustomEvent
    'sc-view-rewind': CustomEvent
  }
}

export interface View extends Struct {
  element?: Element
  html?: string
  name: string
  params?: Struct
  source?: string
}

export class ScolaViewElement extends HTMLDivElement implements ScolaElement {
  public static origin = window.location.origin

  public static storage: Struct<Storage | undefined> = {
    local: window.localStorage,
    session: window.sessionStorage
  }

  public static views: Struct<string | undefined> = {}

  public breakpoint: ScolaBreakpoint

  public hider?: ScolaHider

  public mutator: ScolaMutator

  public name: string | null

  public observer: ScolaObserver

  public origin = ScolaViewElement.origin

  public params: Struct

  public pointer = -1

  public propagator: ScolaPropagator

  public regexp: RegExp

  public sanitizer: ScolaSanitizer

  public save: string

  public saveLimit: number

  public storage: Storage

  public unique: boolean

  public views: View[] = []

  public get view (): View | undefined {
    return this.views[this.pointer]
  }

  protected handleAddBound = this.handleAdd.bind(this)

  protected handleBackBound = this.handleBack.bind(this)

  protected handleBreakpointBound = this.handleBreakpoint.bind(this)

  protected handleDeleteBound = this.handleDelete.bind(this)

  protected handleForwardBound = this.handleForward.bind(this)

  protected handleMutationsBound = this.handleMutations.bind(this)

  protected handleRewindBound = this.handleRewind.bind(this)

  public constructor () {
    super()
    this.breakpoint = new ScolaBreakpoint(this)
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

    if (this.unique) {
      const index = this.views.findIndex((findView) => {
        return this.isSame(view, findView)
      })

      if (index > -1) {
        this.pointer = index
        this.go(this.pointer)
        return
      }

      this.views.push(view)
    } else {
      if (this.isSame(view, this.view)) {
        this.go(this.pointer)
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
    this.breakpoint.observe(this.handleBreakpointBound)

    this.observer.observe(this.handleMutationsBound, [
      'hidden',
      'sc-views'
    ])

    this.breakpoint.connect()
    this.mutator.connect()
    this.observer.connect()
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
    this.breakpoint.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.hider?.disconnect()
    this.removeEventListeners()

    if (this.save !== '') {
      this.saveState()
    }
  }

  public forward (): void {
    this.go(this.pointer + 1)
  }

  public getData (): string | undefined {
    return this.view?.html
  }

  public go (pointer: number): void {
    if (
      pointer >= 0 &&
      pointer <= this.views.length - 1
    ) {
      this.pointer = pointer
    }

    if (this.view === undefined) {
      return
    }

    if (this.view.element !== undefined) {
      this.update()
      return
    }

    const html = ScolaViewElement.views[this.view.name]

    if (html === undefined) {
      this.propagator.dispatch('load', [this.view])
    } else {
      this.setData(html)
    }
  }

  public isSame (left?: Struct | null, right?: Struct | null): boolean {
    return isSame(this.createView(left), this.createView(right))
  }

  public loadState (): void {
    this.loadStateFromElement(this)

    const stateStruct: unknown = JSON.parse(this.storage.getItem(`sc-view-${this.id}`) ?? 'null')

    if (isStruct(stateStruct)) {
      this.loadStateFromStorage(stateStruct)
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
    this.regexp = new RegExp(`/(?<name>[^:/]+):?(?<params>[^:/]+)?@${this.id}`, 'u')
    this.save = this.getAttribute('sc-save') ?? ''
    this.saveLimit = Number(this.getAttribute('sc-save-limit') ?? Infinity)
    this.storage = ScolaViewElement.storage[this.getAttribute('sc-storage') ?? 'session'] ?? window.sessionStorage
    this.unique = this.breakpoint.parse('sc-unique') === ''
  }

  public rewind (): void {
    this.go(0)
  }

  public saveState (): void {
    let current = ''
    let url = (this.origin + window.location.pathname).replace(/\/$/u, '')

    if (
      this.isConnected &&
      !this.hasAttribute('hidden')
    ) {
      if (this.save.includes('storage')) {
        this.storage.setItem(`sc-view-${this.id}`, JSON.stringify(this.toObject()))
      }

      if (this.save.includes('location')) {
        current = this.toString()
      }
    }

    const previous = (this.regexp.exec(url) ?? []).shift()

    if (previous === undefined) {
      url += current
    } else {
      url = url.replace(previous, current)
    }

    window.history.replaceState(null, '', url)
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

    if (view?.html === undefined) {
      this.innerHTML = ''
    } else if (view.element === undefined) {
      this.innerHTML = this.sanitizer.sanitizeHtml(view.html)
      view.element = this.firstElementChild ?? undefined
    } else if (this.firstElementChild === null) {
      this.appendChild(view.element)
    } else {
      this.replaceChild(view.element, this.firstElementChild)
    }

    this.updateAttributes()
  }

  public updateAttributes (): void {
    this.toggleAttribute('hidden', false)
    this.toggleAttribute('sc-has-next', this.pointer < this.views.length - 1)
    this.toggleAttribute('sc-has-previous', this.pointer > 0)
    this.setAttribute('sc-views', this.views.length.toString())
    this.setAttribute('sc-pointer', this.pointer.toString())
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-view-add', this.handleAddBound)
    this.addEventListener('sc-view-back', this.handleBackBound)
    this.addEventListener('sc-view-delete', this.handleDeleteBound)
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

  protected handleBreakpoint (event: ScolaBreakpointEvent): void {
    if (event.changed) {
      this.reset()
      this.clear()

      if (this.save !== '') {
        this.saveState()
        this.loadState()
      }

      this.go(this.pointer)
    }
  }

  protected handleDelete (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this.delete(event.detail)
    }
  }

  protected handleForward (): void {
    this.forward()
  }

  protected handleMutations (mutations: MutationRecord[]): void {
    const attributes = mutations.map((mutation) => {
      return mutation.attributeName
    })

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
    const result = this.regexp.exec(string)

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
    this.removeEventListener('sc-view-delete', this.handleDeleteBound)
    this.removeEventListener('sc-view-forward', this.handleForwardBound)
    this.removeEventListener('sc-view-rewind', this.handleRewindBound)
  }
}
