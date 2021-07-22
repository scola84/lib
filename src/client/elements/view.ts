import { customElement, property } from 'lit/decorators.js'
import { ClipElement } from './clip'
import type { NodeEvent } from './node'
import type { PropertyValues } from 'lit'

declare global {
  interface HTMLElementEventMap {
    'scola-view-append': ViewAppendEvent
    'scola-view-move': ViewMoveEvent
    'scola-view-back': NodeEvent
    'scola-view-forward': NodeEvent
    'scola-view-home': NodeEvent
  }

  interface HTMLElementTagNameMap {
    'scola-view': ViewElement
  }

  interface WindowEventMap {
    'scola-view-append': ViewAppendEvent
    'scola-view-back': NodeEvent
    'scola-view-forward': NodeEvent
    'scola-view-home': NodeEvent
  }
}

export interface View extends Record<string, unknown>{
  element?: HTMLElement & {
    viewTitle?: string
  }
  origin?: HTMLElement
  name: string
  params?: URLSearchParams
  target?: string
}

export interface ViewAppendEvent extends NodeEvent {
  detail: Record<string, unknown> & ViewInAppend | null
}

export interface ViewMoveEvent extends NodeEvent {
  detail: Record<string, unknown> & View | null
}

interface ViewInAppend extends ViewInStore {
  element?: HTMLElement
  origin?: HTMLElement
  target?: string
}

interface ViewInStore {
  name: string
  params?: string
}

interface ViewState {
  pointer: number
  save: boolean
  views: View[]
}

interface ViewStateInStore {
  pointer: number
  save: boolean
  views: ViewInStore[]
}

interface ViewStates {
  [key: string]: ViewState | undefined
}

interface ViewStatesInStore {
  [key: string]: ViewStateInStore | undefined
}

const viewStates: ViewStates = {}

@customElement('scola-view')
export class ViewElement extends ClipElement {
  public static base = ''

  public static storage: Storage = window.sessionStorage

  public static type: 'push' | 'replace'

  public static get states (): ViewStates {
    return viewStates
  }

  public static set states (states: ViewStates) {
    Object.assign(viewStates, states)
  }

  @property()
  public base = ViewElement.base

  @property({
    attribute: 'has-future',
    type: Boolean
  })
  public hasFuture = false

  @property({
    attribute: 'has-past',
    type: Boolean
  })
  public hasPast = false

  public state: ViewState

  public type: ClipElement['type'] = 'content'

  public get view (): View | undefined {
    return this.state.views[this.state.pointer]
  }

  protected handleAppendBound: (event: ViewAppendEvent) => void

  protected handleBackBound: (event: NodeEvent) => void

  protected handleForwardBound: (event: NodeEvent) => void

  protected handleHomeBound: (event: NodeEvent) => void

  protected handlePopstateBound: (event: Event) => void

  protected storage = ViewElement.storage

  protected updaters = ViewElement.updaters

  public constructor () {
    super()
    this.handleAppendBound = this.handleAppend.bind(this)
    this.handleBackBound = this.handleBack.bind(this)
    this.handleForwardBound = this.handleForward.bind(this)
    this.handleHomeBound = this.handleHome.bind(this)
    this.handlePopstateBound = this.handlePopstate.bind(this)
  }

  public connectedCallback (): void {
    window.addEventListener('popstate', this.handlePopstateBound)
    window.addEventListener('scola-view-append', this.handleAppendBound)
    window.addEventListener('scola-view-back', this.handleBackBound)
    window.addEventListener('scola-view-forward', this.handleForwardBound)
    window.addEventListener('scola-view-home', this.handleHomeBound)
    this.setupState()
    this.loadState()
    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    window.removeEventListener('popstate', this.handlePopstateBound)
    window.removeEventListener('scola-view-append', this.handleAppendBound)
    window.removeEventListener('scola-view-back', this.handleBackBound)
    window.removeEventListener('scola-view-forward', this.handleForwardBound)
    window.removeEventListener('scola-view-home', this.handleHomeBound)
    super.disconnectedCallback()
  }

  public firstUpdated (properties: PropertyValues): void {
    this.addEventListener('scola-view-append', this.handleAppendBound)
    this.addEventListener('scola-view-back', this.handleBackBound)
    this.addEventListener('scola-view-forward', this.handleForwardBound)
    this.addEventListener('scola-view-home', this.handleHomeBound)
    this.go(0, false)
    super.firstUpdated(properties)
  }

  public go (delta: number, dispatch = true): void {
    if (
      this.state.pointer + delta >= 0 &&
      this.state.pointer + delta <= this.state.views.length - 1
    ) {
      this.state.pointer += delta
    }

    this.hasFuture = this.state.pointer < this.state.views.length - 1
    this.hasPast = this.state.pointer > 0

    const nextView = this.view

    if (nextView === undefined) {
      return
    }

    if (window.customElements.get(nextView.name) === undefined) {
      return
    }

    nextView.element = nextView.element ?? this.createElement(nextView, delta)

    if (dispatch) {
      this.dispatchEvent(new CustomEvent<ViewMoveEvent['detail']>('scola-view-move', {
        bubbles: true,
        composed: true,
        detail: this.state.views[this.state.pointer]
      }))
    }

    if (nextView.element instanceof HTMLElement) {
      this
        .showContent(nextView.element)
        .then(() => {
          this.state.views.forEach((view) => {
            if (view !== nextView) {
              view.element?.remove()
              delete view.element
            }
          })
        })
        .catch(() => {})
    }
  }

  protected createElement (view: View, delta: number): HTMLElement {
    const element = document.createElement(view.name)

    if (delta < 0) {
      this.insertBefore(element, this.querySelector<HTMLElement>(':not([slot])'))
      this.setScroll(element)
    } else {
      this.appendChild(element)
    }

    return element
  }

  protected createURL (detail: ViewAppendEvent['detail']): URL {
    const url = `http://${detail?.name ?? ''}?${detail?.params ?? ''}`

    const params = Object.keys(detail ?? {}).reduce((result, key) => {
      result.append(key, String(detail?.[key]))
      return result
    }, new URLSearchParams())

    return new URL(this.replaceParams(url, params))
  }

  protected handleAppend (event: ViewAppendEvent): void {
    if (!this.isTarget(event)) {
      return
    }

    event.cancelBubble = true

    const url = this.createURL(event.detail)

    const nextView = {
      name: url.hostname,
      params: url.searchParams
    }

    if (this.isSame(this.view, nextView)) {
      this.go(0)
      return
    }

    Object
      .keys(viewStates)
      .forEach((target) => {
        const state = viewStates[target]

        if (state !== undefined) {
          if (target === this.id) {
            state.views.splice(
              state.pointer + 1,
              state.views.length - state.pointer - 1,
              nextView
            )
          } else if (ViewElement.type === 'push') {
            if (state.save && this.state.save) {
              state.views.splice(
                state.pointer + 1,
                state.views.length - state.pointer - 1,
                state.views[state.pointer]
              )
            }
          }

          state.pointer = state.views.length - 1
        }
      })

    this.go(0)
    this.saveState()
  }

  protected handleBack (event: NodeEvent): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true

      if (
        ViewElement.type === 'push' &&
        this.state.save
      ) {
        window.history.go(-1)
      } else {
        this.go(-1)
        this.saveState()
      }
    }
  }

  protected handleForward (event: NodeEvent): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true

      if (
        ViewElement.type === 'push' &&
        this.state.save
      ) {
        window.history.go(1)
      } else {
        this.go(1)
        this.saveState()
      }
    }
  }

  protected handleHome (event: NodeEvent): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true

      if (
        ViewElement.type === 'push' &&
        this.state.save
      ) {
        window.history.go(-this.state.pointer)
      } else {
        this.go(-this.state.pointer)
        this.saveState()
      }
    }
  }

  protected handlePopstate (): void {
    this.loadHistory()
    this.go(0)
    this.saveState(false)
  }

  protected handleViewMove (): void {}

  protected isSame (left?: View, right?: View): boolean {
    return (
      left?.name === right?.name &&
      left?.params?.toString() === right?.params?.toString()
    )
  }

  protected loadHistory (): void {
    const pointers: unknown = window.history.state

    if (this.isObject(pointers)) {
      const pointer = pointers[this.id]

      if (pointer !== undefined) {
        this.state.pointer = Number(pointer)
      }
    }
  }

  protected loadLocation (): void {
    window.location.pathname
      .split('/')
      .forEach((part) => {
        const {
          name,
          params,
          target
        } = (/(?<name>[^:]+):?(?<params>.+)?@(?<target>.+)/gu).exec(part)?.groups ?? {}

        if (target === this.id) {
          if (this.state.views[this.state.pointer]?.name !== name) {
            this.state = {
              pointer: this.state.views.length,
              save: this.state.save,
              views: [...this.state.views, {
                name,
                params: new URLSearchParams(params)
              }]
            }

            viewStates[this.id] = this.state
          }
        }
      })
  }

  protected loadState (): void {
    if (!this.loadStorage()) {
      this.loadLocation()
    }

    this.loadHistory()
  }

  protected loadStorage (): boolean {
    const statesString = this.storage.getItem('view-states')

    if (statesString === null) {
      return false
    }

    const viewStatesInStore: unknown = JSON.parse(statesString)

    if (!this.isObject<ViewStatesInStore>(viewStatesInStore)) {
      return false
    }

    Object
      .keys(viewStates)
      .forEach((target) => {
        if (target === this.id) {
          const viewStateInStore = viewStatesInStore[target]

          if (viewStateInStore !== undefined) {
            this.state = {
              ...viewStateInStore,
              views: viewStateInStore.views.map((view) => {
                return {
                  name: view.name,
                  params: new URLSearchParams(view.params)
                }
              })
            }

            viewStates[this.id] = this.state
          }
        }
      })

    return true
  }

  protected saveLocation (): void {
    const pointers: Record<string, number> = {}

    const path = Object
      .keys(viewStates)
      .reduce((result, target) => {
        const state = viewStates[target]

        if (state === undefined) {
          return result
        }

        if (!state.save) {
          return result
        }

        pointers[target] = state.pointer

        const view = state.views
          .slice(state.pointer, state.pointer + 1)
          .pop()

        if (view === undefined) {
          return result
        }

        const params = view.params?.toString() ?? ''

        if (params.length === 0) {
          return `${result}/${view.name}@${target}`
        }

        return `${result}/${view.name}:${params}@${target}`
      }, '')

    if (ViewElement.type === 'push') {
      window.history.pushState(pointers, '', path)
    } else {
      window.history.replaceState(pointers, '', path)
    }
  }

  protected saveState (location = true, storage = true): void {
    if (this.state.save) {
      if (location) {
        this.saveLocation()
      }

      if (storage) {
        this.saveStorage()
      }
    }
  }

  protected saveStorage (): void {
    const viewStatesInStore: ViewStatesInStore = {}

    Object
      .keys(viewStates)
      .forEach((target) => {
        if (this.state.save) {
          const state = viewStates[target]

          if (state !== undefined) {
            viewStatesInStore[target] = {
              ...state,
              views: state.views.map((view) => {
                return {
                  name: view.name,
                  params: view.params?.toString()
                }
              })
            }
          }
        }
      })

    this.storage.setItem('view-states', JSON.stringify(viewStatesInStore))
  }

  protected setScroll (element: HTMLElement): void {
    const style = window.getComputedStyle(element)

    let dimensionName: 'height' | 'width' = 'height'
    let scrollFactor = 1
    let scrollName: 'scrollLeft' | 'scrollTop' = 'scrollTop'

    if (this.flow === 'row') {
      dimensionName = 'width'
      scrollName = 'scrollLeft'
    }

    if (this.dir === 'rtl') {
      scrollFactor = -1
    }

    const size = parseFloat(style[dimensionName])

    if (Number.isNaN(size)) {
      return
    }

    this.defaultSlotElement[scrollName] += scrollFactor * size
  }

  protected setupState (): void {
    let state = viewStates[this.id]

    if (state === undefined) {
      state = {
        pointer: -1,
        save: false,
        views: []
      }

      viewStates[this.id] = state
    }

    this.state = state
  }
}
