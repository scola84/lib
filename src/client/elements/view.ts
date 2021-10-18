import { Struct, elements, isArray, isNil, isPrimitive, isSame, isStruct } from '../../common'
import { addHook, isValidAttribute, sanitize } from 'dompurify'
import { customElement, property } from 'lit/decorators.js'
import { ClipElement } from './clip'
import type { Config } from 'dompurify'
import type { PropertyValues } from 'lit'

declare global {
  interface HTMLElementEventMap {
    'scola-view-append': CustomEvent
    'scola-view-move': CustomEvent
    'scola-view-back': CustomEvent
    'scola-view-forward': CustomEvent
    'scola-view-rewind': CustomEvent
  }

  interface HTMLElementTagNameMap {
    'scola-view': ViewElement
  }

  interface WindowEventMap {
    'scola-view-append': CustomEvent
    'scola-view-back': CustomEvent
    'scola-view-forward': CustomEvent
    'scola-view-rewind': CustomEvent
  }
}

interface View extends Struct {
  element?: HTMLElement & {
    viewTitle?: string
  }
  name: string
  parameters?: Struct
}

addHook('uponSanitizeAttribute', (node, data) => {
  data.forceKeepAttr = isValidAttribute(node.nodeName.toLowerCase(), 'href', data.attrValue)
})

const viewElements = new Set<ViewElement>()

@customElement('scola-view')
export class ViewElement extends ClipElement {
  public static dompurifyOptions: Config = {
    ADD_TAGS: elements
  }

  public static mode: 'push' | 'replace'

  public static origin = window.location.origin

  public static storage: Storage = window.sessionStorage

  @property({
    type: Boolean
  })
  public hasNext = false

  @property({
    type: Boolean
  })
  public hasPrevious = false

  @property()
  public origin = ViewElement.origin

  @property()
  public path?: string

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

  public mode: ClipElement['mode'] = 'content'

  protected handleAppendBound = this.handleAppend.bind(this)

  protected handleBackBound = this.handleBack.bind(this)

  protected handleForwardBound = this.handleForward.bind(this)

  protected handlePopstateBound = this.handlePopstate.bind(this)

  protected handleRewindBound = this.handleRewind.bind(this)

  protected pointer = -1

  protected updaters = ViewElement.updaters

  protected views: View[] = []

  public back (): void {
    this.go(-1).catch(() => {})
  }

  public connectedCallback (): void {
    viewElements.add(this)

    if (this.save === true) {
      this.loadState()
    }

    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    viewElements.delete(this)
    super.disconnectedCallback()
  }

  public firstUpdated (properties: PropertyValues): void {
    this
      .go(0, false, false)
      .finally(() => {
        super.firstUpdated(properties)
      })
  }

  public forward (): void {
    this.go(1).catch(() => {})
  }

  public rewind (): void {
    this.go(-this.pointer).catch(() => {})
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

  protected appendView (options?: unknown): void {
    const view = this.createView(options)

    if (this.isSameView(this.view, view)) {
      this.go(0, false, true).catch(() => {})
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

    this.go(0).catch(() => {})
  }

  protected async createElement (view: View, delta: number): Promise<HTMLElement | undefined> {
    let element = null

    if (window.customElements.get(view.name) !== undefined) {
      element = document.createElement(view.name)
    } else if (this.path === undefined) {
      element = undefined
    } else {
      element = await this.fetchElement(view.name)
    }

    if (element instanceof HTMLElement) {
      if (delta < 0) {
        this.insertBefore(element, this.querySelector<HTMLElement>(':scope > :not([slot])'))
        this.setScroll(element)
      } else {
        this.appendChild(element)
      }
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
        view.parameters = Struct.parse(options.parameters, options)
      } else if (isStruct(options.parameters)) {
        view.parameters = options.parameters
      }
    }

    return view
  }

  protected async fetchElement (name: string): Promise<HTMLElement | undefined> {
    const element = document.createElement('scola-node')

    try {
      const urlParts = [
        this.origin,
        this.path
      ]

      const parameters = {
        name
      }

      const url = new URL(Struct.replace(urlParts.join(''), parameters))
      const response = await window.fetch(url.toString())

      if (response.status === 200) {
        const html = sanitize(await response.text(), ViewElement.dompurifyOptions)

        if (typeof html === 'string') {
          element.innerHTML = html
          element.viewTitle = element.firstElementChild?.getAttribute('view-title') ?? ''
        }
      }
    } catch (error: unknown) {
      this.handleError(error)
    }

    return element
  }

  protected async go (delta: number, save = true, dispatch = true): Promise<void> {
    if (
      this.pointer + delta >= 0 &&
      this.pointer + delta <= this.views.length - 1
    ) {
      this.setPointer(this.pointer + delta)
    }

    const newView = this.views[this.pointer] as View | undefined

    if (newView === undefined) {
      this.view = null
      return
    }

    this.view = newView

    if (this.view.element === undefined) {
      this.view.element = await this.createElement(this.view, delta)
    }

    if (
      save &&
      this.save === true
    ) {
      this.saveState()
    }

    if (dispatch) {
      this.dispatchEvents('scola-view-move', [this.view])
    }

    if (this.view.element instanceof HTMLElement) {
      await this.showContent(this.view.element)

      this.views.forEach((view) => {
        if (view !== this.view) {
          view.element?.remove()
          delete view.element
        }
      })
    }
  }

  protected handleAppend (event: CustomEvent<Struct | null>): void {
    if (this.isTarget(event)) {
      this.appendView(event.detail?.data)
    }
  }

  protected handleBack (event: CustomEvent): void {
    if (this.isTarget(event)) {
      if (
        ViewElement.mode === 'push' &&
        this.save === true
      ) {
        window.history.back()
      } else {
        this.back()
      }
    }
  }

  protected handleError (error: unknown): void {
    this.dispatchError(error, 'err_view')
  }

  protected handleForward (event: CustomEvent): void {
    if (this.isTarget(event)) {
      if (
        ViewElement.mode === 'push' &&
        this.save === true
      ) {
        window.history.forward()
      } else {
        this.forward()
      }
    }
  }

  protected handlePopstate (): void {
    this.loadPointer()
    this.go(0).catch(() => {})
  }

  protected handleRewind (event: CustomEvent): void {
    if (this.isTarget(event)) {
      if (
        ViewElement.mode === 'push' &&
        this.save === true
      ) {
        window.history.go(-this.pointer)
      } else {
        this.rewind()
      }
    }
  }

  protected isSameView (left?: View | null, right?: View | null): boolean {
    return isSame({
      name: left?.name,
      parameters: left?.parameters
    }, {
      name: right?.name,
      parameters: right?.parameters
    })
  }

  protected loadPointer (): void {
    const pointers: unknown = window.history.state

    if (isStruct(pointers)) {
      const pointer = pointers[this.id]

      if (typeof pointer === 'number') {
        this.setPointer(pointer)
      }
    } else {
      this.setPointer(0)
    }
  }

  protected loadState (): void {
    this.loadStateFromViewElement(this)

    const stateStruct: unknown = JSON.parse(this.storage.getItem(`view-${this.id}`) ?? 'null')
    const stateString = window.location.pathname

    if (isStruct(stateStruct)) {
      this.loadStateFromStruct(stateStruct)
      this.loadPointer()
    } else {
      this.loadStateFromString(stateString)
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

        this.setPointer(this.views.length - 1)
      }
    }
  }

  protected loadStateFromStruct (struct: Struct): void {
    if (isArray(struct.views)) {
      this.views = struct.views.map((view) => {
        return this.createView(view)
      })
    }

    if (typeof struct.pointer === 'number') {
      this.setPointer(struct.pointer)
    }
  }

  protected loadStateFromViewElement (viewElement: ViewElement): void {
    if (viewElement.name !== '') {
      this.views = [{
        name: viewElement.name,
        parameters: viewElement.parameters
      }]

      this.setPointer(0)
    }
  }

  protected saveState (location = true): void {
    const pointers: Struct<number> = {}

    const path = Array
      .from(viewElements)
      .reduce((result, viewElement) => {
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

  protected setPointer (pointer: number): void {
    this.pointer = pointer
    this.hasNext = this.pointer < this.views.length - 1
    this.hasPrevious = this.pointer > 0
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

  protected setUpElementListeners (): void {
    this.addEventListener('scola-view-append', this.handleAppendBound)
    this.addEventListener('scola-view-back', this.handleBackBound)
    this.addEventListener('scola-view-forward', this.handleForwardBound)
    this.addEventListener('scola-view-rewind', this.handleRewindBound)
    super.setUpElementListeners()
  }

  protected setUpWindowListeners (): void {
    window.addEventListener('popstate', this.handlePopstateBound)
    window.addEventListener('scola-view-append', this.handleAppendBound)
    window.addEventListener('scola-view-back', this.handleBackBound)
    window.addEventListener('scola-view-forward', this.handleForwardBound)
    window.addEventListener('scola-view-rewind', this.handleRewindBound)
    super.setUpWindowListeners()
  }

  protected tearDownWindowListeners (): void {
    window.removeEventListener('popstate', this.handlePopstateBound)
    window.removeEventListener('scola-view-append', this.handleAppendBound)
    window.removeEventListener('scola-view-back', this.handleBackBound)
    window.removeEventListener('scola-view-forward', this.handleForwardBound)
    window.removeEventListener('scola-view-rewind', this.handleRewindBound)
    super.tearDownWindowListeners()
  }
}
