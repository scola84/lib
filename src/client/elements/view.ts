import { cast, isArray, isNil, isPrimitive, isStruct } from '../../common'
import { customElement, property, state } from 'lit/decorators.js'
import { ClipElement } from './clip'
import type { PropertyValues } from 'lit'
import type { Struct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'scola-view-append': CustomEvent
    'scola-view-move': CustomEvent
    'scola-view-back': CustomEvent
    'scola-view-forward': CustomEvent
    'scola-view-home': CustomEvent
  }

  interface HTMLElementTagNameMap {
    'scola-view': ViewElement
  }

  interface WindowEventMap {
    'scola-view-append': CustomEvent
    'scola-view-back': CustomEvent
    'scola-view-forward': CustomEvent
    'scola-view-home': CustomEvent
  }
}

interface View extends Struct{
  element?: HTMLElement & {
    viewTitle?: string
  }
  name: string
  parameters?: Struct
}

const viewElements: ViewElement[] = []

@customElement('scola-view')
export class ViewElement extends ClipElement {
  public static base = ''

  public static mode: 'push' | 'replace'

  public static storage: Storage = window.sessionStorage

  @property()
  public base = ViewElement.base

  @property({
    type: Boolean
  })
  public save?: boolean

  @property({
    attribute: false
  })
  public storage = ViewElement.storage

  @property({
    attribute: false
  })
  public view?: View | null

  @state()
  protected pointer = -1

  public mode: ClipElement['mode'] = 'content'

  protected handleAppendBound: (event: CustomEvent) => void

  protected handleBackBound: (event: CustomEvent) => void

  protected handleForwardBound: (event: CustomEvent) => void

  protected handleHomeBound: (event: CustomEvent) => void

  protected handlePopstateBound: (event: Event) => void

  protected updaters = ViewElement.updaters

  protected views: View[] = []

  public get hasFuture (): boolean {
    return this.pointer < this.views.length - 1
  }

  public get hasPast (): boolean {
    return this.pointer > 0
  }

  public constructor () {
    super()
    this.handleAppendBound = this.handleAppend.bind(this)
    this.handleBackBound = this.handleBack.bind(this)
    this.handleForwardBound = this.handleForward.bind(this)
    this.handleHomeBound = this.handleHome.bind(this)
    this.handlePopstateBound = this.handlePopstate.bind(this)
    viewElements.push(this)
  }

  public connectedCallback (): void {
    window.addEventListener('popstate', this.handlePopstateBound)
    window.addEventListener('scola-view-append', this.handleAppendBound)
    window.addEventListener('scola-view-back', this.handleBackBound)
    window.addEventListener('scola-view-forward', this.handleForwardBound)
    window.addEventListener('scola-view-home', this.handleHomeBound)

    if (this.save === true) {
      this.loadState()
    }

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
      this.pointer + delta >= 0 &&
      this.pointer + delta <= this.views.length - 1
    ) {
      this.pointer += delta
    }

    const newView = this.views
      .slice(this.pointer, this.pointer + 1)
      .pop()

    if (newView === undefined) {
      this.view = null
      return
    }

    this.view = newView

    if (window.customElements.get(this.view.name) === undefined) {
      return
    }

    this.view.element = this.view.element ?? this.createElement(this.view, delta)

    if (dispatch) {
      this.dispatchEvent(new CustomEvent('scola-view-move', {
        bubbles: true,
        composed: true,
        detail: {
          data: this.view,
          origin: this
        }
      }))
    }

    if (this.view.element instanceof HTMLElement) {
      this
        .showContent(this.view.element)
        .then(() => {
          this.views.forEach((view) => {
            if (view !== this.view) {
              view.element?.remove()
              delete view.element
            }
          })
        })
        .catch(() => {})
    }
  }

  public toObject (): Struct {
    return {
      pointer: this.pointer,
      views: this.views.map((view) => {
        return {
          name: view.name,
          parameters: view.parameters
        }
      })
    }
  }

  public toString (): string {
    if (isNil(this.view)) {
      return ''
    }

    let parameters = Object
      .entries(this.view.parameters ?? {})
      .map(([name, value]) => {
        if (isPrimitive(value)) {
          return `${name}=${value.toString()}`
        }

        return name
      })
      .join('&')

    if (parameters.length > 0) {
      parameters = `:${parameters}`
    }

    return `/${this.view.name}${parameters}@${this.id}`
  }

  protected createElement (view: View, delta: number): HTMLElement {
    const element = document.createElement(view.name)

    if (delta < 0) {
      this.insertBefore(element, this.querySelector<HTMLElement>(':scope > :not([slot])'))
      this.setScroll(element)
    } else {
      this.appendChild(element)
    }

    return element
  }

  protected createView (options?: unknown): View {
    const view: View = {
      name: '',
      parameters: {}
    }

    if (isStruct(options)) {
      if (typeof options.name === 'string') {
        view.name = options.name
      }

      if (typeof options.parameters === 'string') {
        view.parameters = this
          .replaceParameters(options.parameters, options)
          .split('&')
          .reduce((object, parameter) => {
            const [name, value] = parameter.split('=')
            return {
              [name]: cast(value),
              ...object
            }
          }, {})
      } else if (isStruct(options.parameters)) {
        view.parameters = options.parameters
      }
    }

    return view
  }

  protected handleAppend (event: CustomEvent<Struct | null>): void {
    if (this.isTarget(event)) {
      const view = this.createView(event.detail?.data)

      if (this.isSame(this.view, view)) {
        this.go(0)
        return
      }

      viewElements.forEach((viewElement) => {
        if (viewElement === this) {
          viewElement.views.splice(viewElement.pointer + 1, viewElement.views.length - viewElement.pointer - 1, view)
          viewElement.pointer = viewElement.views.length - 1
        } else if (
          ViewElement.mode === 'push' &&
          this.save === true &&
          viewElement.save === true
        ) {
          viewElement.views.splice(viewElement.pointer + 1, viewElement.views.length - viewElement.pointer - 1, viewElement.views[viewElement.pointer])
          viewElement.pointer = viewElement.views.length - 1
        }
      })

      this.go(0)
      this.saveState()
    }
  }

  protected handleBack (event: CustomEvent): void {
    if (this.isTarget(event)) {
      if (
        ViewElement.mode === 'push' &&
        this.save === true
      ) {
        window.history.go(-1)
      } else {
        this.go(-1)
        this.saveState()
      }
    }
  }

  protected handleForward (event: CustomEvent): void {
    if (this.isTarget(event)) {
      if (
        ViewElement.mode === 'push' &&
        this.save === true
      ) {
        window.history.go(1)
      } else {
        this.go(1)
        this.saveState()
      }
    }
  }

  protected handleHome (event: CustomEvent): void {
    if (this.isTarget(event)) {
      if (
        ViewElement.mode === 'push' &&
        this.save === true
      ) {
        window.history.go(-this.pointer)
      } else {
        this.go(-this.pointer)
        this.saveState()
      }
    }
  }

  protected handlePopstate (): void {
    this.loadPointer()
    this.go(0)
    this.saveState(false)
  }

  protected isSame (left?: View | null, right?: View | null): boolean {
    return (
      left?.name === right?.name &&
      JSON.stringify(left?.parameters) === JSON.stringify(right?.parameters)
    )
  }

  protected loadPointer (): void {
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

  protected loadState (): void {
    this.loadStateFromViewElement(this)

    const stateObject: unknown = JSON.parse(this.storage.getItem(`view-${this.id}`) ?? 'null')
    const stateString = window.location.pathname

    if (isStruct(stateObject)) {
      this.loadStateFromObject(stateObject)
      this.loadPointer()
    } else {
      this.loadStateFromString(stateString)
    }
  }

  protected loadStateFromObject (object: Struct): void {
    if (isArray(object.views)) {
      this.views = object.views.map((view) => {
        return this.createView(view)
      })
    }

    if (typeof object.pointer === 'number') {
      this.pointer = object.pointer
    }
  }

  protected loadStateFromString (string: string): void {
    const result = new RegExp(`/(?<name>[^:/]+):?(?<parameters>[^:/]+)?@${this.id}`, 'u').exec(string)

    if (result !== null) {
      const {
        name,
        parameters
      } = result.groups ?? {}

      if (name !== this.views[this.pointer]?.name) {
        this.views.push(this.createView({
          name,
          parameters
        }))

        this.pointer = this.views.length - 1
      }
    }
  }

  protected loadStateFromViewElement (viewElement: ViewElement): void {
    if (viewElement.name !== '') {
      this.views = [{
        name: viewElement.name,
        parameters: viewElement.parameters
      }]

      this.pointer = 0
    }
  }

  protected saveState (location = true): void {
    if (this.save === true) {
      const pointers: Struct<number> = {}

      const path = viewElements.reduce((result, viewElement) => {
        if (viewElement.save === true) {
          viewElement.storage.setItem(`view-${viewElement.id}`, JSON.stringify(viewElement.toObject()))
          pointers[viewElement.id] = viewElement.pointer
          return `${result}${viewElement.toString()}`
        }

        return result
      }, '')

      if (location) {
        if (ViewElement.mode === 'push') {
          window.history.pushState(pointers, '', path)
        } else {
          window.history.replaceState(pointers, '', path)
        }
      }
    }
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

    if (!Number.isNaN(size)) {
      this.defaultSlotElement[scrollName] += scrollFactor * size
    }
  }
}
