import {
  customElement,
  property
} from 'lit-element'

import { ClipElement } from './clip'
import type { NodeEvent } from './node'

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

export interface View {
  element?: HTMLElement
  origin?: HTMLElement
  ref: string
  target?: string
}

export interface ViewAppendEvent extends CustomEvent {
  detail: View | null
}

export interface ViewMoveEvent extends CustomEvent {
  detail: View | null
}

export interface ViewState {
  pointer: number
  save: boolean
  views: Array<View | null | undefined>
}

const viewStates: Record<string, ViewState> = {}

@customElement('scola-view')
export class ViewElement extends ClipElement {
  public static base = ''

  public static type: 'push' | 'replace'

  public static get states (): Record<string, Partial<ViewState>> {
    return viewStates
  }

  public static set states (states: Record<string, Partial<ViewState>>) {
    Object.assign(viewStates, states)
  }

  @property()
  public base = ViewElement.base

  @property({
    attribute: 'has-future',
    reflect: true,
    type: Boolean
  })
  public hasFuture = false

  @property({
    attribute: 'has-past',
    reflect: true,
    type: Boolean
  })
  public hasPast = false

  @property()
  public title: string

  public type: ClipElement['type'] = 'content'

  protected handleAppendBound: (event: ViewAppendEvent) => void

  protected handleBackBound: (event: NodeEvent) => void

  protected handleForwardBound: (event: NodeEvent) => void

  protected handleHomeBound: (event: NodeEvent) => void

  protected handlePopstateBound: (event: Event) => void

  public constructor () {
    super()
    this.handleAppendBound = this.handleAppend.bind(this)
    this.handleBackBound = this.handleBack.bind(this)
    this.handleForwardBound = this.handleForward.bind(this)
    this.handleHomeBound = this.handleHome.bind(this)
    this.handlePopstateBound = this.handlePopstate.bind(this)
    this.addEventListener('scola-view-append', this.handleAppendBound)
    this.addEventListener('scola-view-back', this.handleBackBound)
    this.addEventListener('scola-view-forward', this.handleForwardBound)
    this.addEventListener('scola-view-home', this.handleHomeBound)
  }

  public connectedCallback (): void {
    window.addEventListener('popstate', this.handlePopstateBound)
    window.addEventListener('scola-view-append', this.handleAppendBound)
    window.addEventListener('scola-view-back', this.handleBackBound)
    window.addEventListener('scola-view-forward', this.handleForwardBound)
    window.addEventListener('scola-view-home', this.handleHomeBound)
    super.connectedCallback()

    this.setupState()

    if (!this.loadStorage()) {
      this.loadLocation()
    }

    this.loadState()
  }

  public disconnectedCallback (): void {
    window.removeEventListener('popstate', this.handlePopstateBound)
    window.removeEventListener('scola-view-append', this.handleAppendBound)
    window.removeEventListener('scola-view-back', this.handleBackBound)
    window.removeEventListener('scola-view-forward', this.handleForwardBound)
    window.removeEventListener('scola-view-home', this.handleHomeBound)
    super.disconnectedCallback()
  }

  public firstUpdated (): void {
    this.go(0, false)
  }

  public go (delta: number, dispatch = true): void {
    const state = viewStates[this.id]
    const currentView = state.views[state.pointer]

    if (state.pointer + delta >= 0 && state.pointer + delta <= state.views.length - 1) {
      state.pointer += delta
    }

    this.hasFuture = state.pointer < state.views.length - 1
    this.hasPast = state.pointer > 0

    const nextView = state.views[state.pointer]

    if (nextView === null || nextView === undefined) {
      return
    }

    if (window.customElements.get(nextView.ref) === undefined) {
      return
    }

    nextView.element = nextView.element ?? this.createElement(nextView, delta)
    this.title = (nextView.element as HTMLElement & { viewTitle: string }).viewTitle

    if (dispatch) {
      this.dispatchEvent(new CustomEvent<ViewMoveEvent['detail']>('scola-view-move', {
        bubbles: true,
        composed: true,
        detail: state.views[state.pointer]
      }))
    }

    window.requestAnimationFrame(() => {
      if (nextView.element instanceof HTMLElement) {
        this.showContent(nextView.element, this.contentDuration, () => {
          if (delta !== 0 && currentView?.element instanceof HTMLElement) {
            currentView.element.remove()
            delete currentView.element
          }
        })
      }
    })
  }

  protected createElement (view: View, delta: number): HTMLElement {
    const element = document.createElement(view.ref)

    if (delta < 0) {
      this.insertBefore(element, this.querySelector(':not([slot])'))
      this.setScroll(element)
    } else {
      this.appendChild(element)
    }

    return element
  }

  protected handleAppend (event: ViewAppendEvent): void {
    if (!this.isTarget(event)) {
      return
    }

    event.cancelBubble = true
    let state = viewStates[this.id]

    if (state.views[state.pointer]?.ref === event.detail?.ref) {
      this.go(0)
      return
    }

    Object
      .keys(viewStates)
      .forEach((target) => {
        state = viewStates[target]

        if (target === this.id) {
          state.views.splice(
            state.pointer + 1,
            state.views.length - state.pointer - 1,
            event.detail
          ).forEach((view) => {
            view?.element?.remove()
          })
        } else if (ViewElement.type === 'push') {
          if (state.save && viewStates[this.id].save) {
            state.views.splice(
              state.pointer + 1,
              state.views.length - state.pointer - 1,
              state.views[state.pointer]
            ).forEach((view) => {
              view?.element?.remove()
            })
          }
        }

        state.pointer = state.views.length - 1
      })

    this.go(0)
    this.save()
  }

  protected handleBack (event: NodeEvent): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true
      const state = viewStates[this.id]

      if (ViewElement.type === 'push' && state.save) {
        window.history.go(-1)
      } else {
        this.go(-1)
        this.save()
      }
    }
  }

  protected handleForward (event: NodeEvent): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true
      const state = viewStates[this.id]

      if (ViewElement.type === 'push' && state.save) {
        window.history.go(1)
      } else {
        this.go(1)
        this.save()
      }
    }
  }

  protected handleHome (event: NodeEvent): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true
      const state = viewStates[this.id]

      if (ViewElement.type === 'push' && state.save) {
        window.history.go(-state.pointer)
      } else {
        this.go(-state.pointer)
        this.save()
      }
    }
  }

  protected handlePopstate (): void {
    this.loadState()
    this.go(0)
    this.save(false)
  }

  protected handleViewMove (): void {}

  protected loadLocation (): void {
    const state = viewStates[this.id]

    window.location.pathname
      .split('/')
      .forEach((part) => {
        const [ref, target] = part.split('@')

        if (target === this.id) {
          if (state.views[state.pointer]?.ref !== ref) {
            viewStates[this.id] = {
              pointer: state.views.length,
              save: state.save,
              views: [...state.views, {
                ref
              }]
            }
          }
        }
      })
  }

  protected loadState (): void {
    const pointers = (window.history.state ?? {}) as Partial<Record<string, number>>
    const pointer = pointers[this.id]

    if (pointer !== undefined) {
      viewStates[this.id].pointer = pointer
    }
  }

  protected loadStorage (): boolean {
    const statesString = window.sessionStorage.getItem('view-states')

    if (statesString === null) {
      return false
    }

    const storedStates = JSON.parse(statesString) as Record<string, ViewState>

    Object
      .keys(viewStates)
      .forEach((target) => {
        if (target === this.id) {
          viewStates[this.id] = {
            ...viewStates[this.id],
            ...storedStates[target]
          }
        }
      })

    return true
  }

  protected save (location = true, storage = true): void {
    if (viewStates[this.id].save) {
      if (location) {
        this.saveLocation()
      }

      if (storage) {
        this.saveStorage()
      }
    }
  }

  protected saveLocation (): void {
    const pointers: Record<string, number> = {}

    const path = Object
      .keys(viewStates)
      .reduce((result, target) => {
        const state = viewStates[target]

        if (!state.save) {
          return result
        }

        const view = state.views[state.pointer]
        pointers[target] = state.pointer

        return view !== null && view !== undefined
          ? `${result}/${view.ref}@${target}`
          : result
      }, '')

    if (ViewElement.type === 'push') {
      window.history.pushState(pointers, '', path)
    } else {
      window.history.replaceState(pointers, '', path)
    }
  }

  protected saveStorage (): void {
    const storedStates: Record<string, ViewState> = {}

    Object
      .keys(viewStates)
      .forEach((target) => {
        if (viewStates[target].save) {
          storedStates[target] = {
            ...viewStates[target],
            views: viewStates[target].views.map((view) => {
              return view !== null && view !== undefined
                ? { ref: view.ref }
                : view
            })
          }
        }
      })

    window.sessionStorage.setItem('view-states', JSON.stringify(storedStates))
  }

  protected setScroll (element: HTMLElement): void {
    const dimensionName = this.flow === 'row' ? 'width' : 'height'
    const scrollFactor = this.dir === 'rtl' ? -1 : 1
    const scrollName = this.flow === 'row' ? 'scrollLeft' : 'scrollTop'

    const style = window.getComputedStyle(element)
    const scrollDelta = scrollFactor * parseFloat(style[dimensionName])

    if (this.defaultSlotElement instanceof HTMLSlotElement) {
      this.defaultSlotElement[scrollName] += scrollDelta
    }
  }

  protected setupState (): void {
    viewStates[this.id] = {
      pointer: -1,
      save: false,
      views: [],
      ...viewStates[this.id] as ViewState | undefined
    }

    viewStates[this.id].pointer = viewStates[this.id].views.length - 1
  }
}
