import type { CSSResultGroup, PropertyValues } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { NodeElement } from './node'
import type { NodeEvent } from './node'
import type { ViewMoveEvent } from './view'
import { css } from 'lit'

declare global {
  interface HTMLElementEventMap {
    'scola-clip-content': ClipEvent
    'scola-clip-content-or-inner': ClipEvent
    'scola-clip-inner': ClipEvent
    'scola-clip-nested': ClipEvent
    'scola-clip-outer': ClipEvent
  }

  interface HTMLElementTagNameMap {
    'scola-clip': ClipElement
  }
}

export interface ClipEvent extends NodeEvent {
  detail: Record<string, unknown> & {
    id?: string
  } | null
}

@customElement('scola-clip')
export class ClipElement extends NodeElement {
  public static styles: CSSResultGroup[] = [
    ...NodeElement.styles,
    css`
      slot[name="body"] slot[name] {
        z-index: 2;
      }

      :host([type="content"]) slot:not([name])::slotted(*) {
        display: flex;
        flex: 0 0 100%;
        height: 100%;
        width: 100%;
      }

      :host([type="content"][resize]) slot:not([name])::slotted([hidden]) {
        display: none;
      }

      :host([type="outer"]) slot[name="after"]::slotted(*),
      :host([type="outer"]) slot[name="before"]::slotted(*) {
        position: absolute;
        z-index: 2;
      }

      :host([type="outer"][flow="column"]) slot[name="after"]::slotted(*) {
        bottom: 0;
      }

      :host([type="outer"][flow="column"]) slot[name="before"]::slotted(*) {
        top: 0;
      }

      :host([type="outer"][flow="row"]) slot[name="after"]::slotted(*) {
        right: 0;
      }

      :host([type="outer"][flow="row"][dir="rtl"]) slot[name="after"]::slotted(*) {
        left: 0;
        right: auto;
      }

      :host([type="outer"][flow="row"]) slot[name="before"]::slotted(*) {
        left: 0;
      }

      :host([type="outer"][flow="row"][dir="rtl"]) slot[name="before"]::slotted(*) {
        left: auto;
        right: 0;
      }
    `
  ]

  @property()
  public amount?: 'any' | 'max-one' | 'min-one' | 'one'

  @property({
    attribute: 'inner-hidden',
    type: Boolean
  })
  public innerHidden?: boolean

  @property({
    reflect: true,
    type: Boolean
  })
  public resize?: boolean

  @property({
    reflect: true
  })
  public type?: 'content' | 'inner' | 'nested' | 'outer'

  protected contentElements: NodeListOf<HTMLElement>

  protected handleContentBound: (event: NodeEvent) => void

  protected handleContentOrInnerBound: (event: NodeEvent) => void

  protected handleElement?: HTMLElement | null

  protected handleInnerBound: (event: NodeEvent) => void

  protected handleNestedBound: (event: NodeEvent) => void

  protected handleOuterBound: (event: NodeEvent) => void

  protected outerElements: NodeListOf<HTMLElement>

  protected updaters = ClipElement.updaters

  public constructor () {
    super()
    this.dir = document.dir
    this.contentElements = this.querySelectorAll<HTMLElement>(':scope > :not([slot])')
    this.handleElement = this.querySelector<HTMLElement>(':scope > [is="handle"]')
    this.outerElements = this.querySelectorAll<HTMLElement>(':scope > [slot="after"], :scope > [slot="before"]')
    this.handleContentBound = this.handleContent.bind(this)
    this.handleContentOrInnerBound = this.handleContentOrInner.bind(this)
    this.handleInnerBound = this.handleInner.bind(this)
    this.handleNestedBound = this.handleNested.bind(this)
    this.handleOuterBound = this.handleOuter.bind(this)
  }

  public connectedCallback (): void {
    window.addEventListener('scola-clip-content', this.handleContentBound)
    window.addEventListener('scola-clip-content-or-inner', this.handleContentOrInnerBound)
    window.addEventListener('scola-clip-inner', this.handleInnerBound)
    window.addEventListener('scola-clip-nested', this.handleNestedBound)
    window.addEventListener('scola-clip-outer', this.handleOuterBound)
    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    window.removeEventListener('scola-clip-content', this.handleContentBound)
    window.removeEventListener('scola-clip-content-or-inner', this.handleContentOrInnerBound)
    window.removeEventListener('scola-clip-inner', this.handleInnerBound)
    window.removeEventListener('scola-clip-nested', this.handleNestedBound)
    window.removeEventListener('scola-clip-outer', this.handleOuterBound)
    super.disconnectedCallback()
  }

  public firstUpdated (properties: PropertyValues): void {
    this.addEventListener('click', this.handleClick.bind(this))
    this.addEventListener('scola-clip-content', this.handleContentBound)
    this.addEventListener('scola-clip-content-or-inner', this.handleContentOrInnerBound)
    this.addEventListener('scola-clip-inner', this.handleInnerBound)
    this.addEventListener('scola-clip-nested', this.handleNestedBound)
    this.addEventListener('scola-clip-outer', this.handleOuterBound)
    this.addEventListener('scola-view-move', this.handleViewMove.bind(this))

    switch (this.type) {
      case 'content':
        this.firstUpdatedContent()
        break
      case 'inner':
        this.firstUpdatedInner()
        break
      case 'outer':
        this.firstUpdatedOuter()
        break
      default:
        break
    }

    super.firstUpdated(properties)
  }

  public async hideContent (element: HTMLElement): Promise<void> {
    element.hidden = true
    return Promise.resolve()
  }

  public async hideContentOrInner (element: HTMLElement, duration = this.duration): Promise<void> {
    const promises = []

    if (this.innerHidden !== true) {
      promises.push(this.hideInner(duration))
    }

    promises.push(this.hideContent(element))
    await Promise.all(promises)
  }

  public async hideInner (duration = this.duration): Promise<void> {
    if (duration === 0) {
      this.defaultSlotElement.style.setProperty('display', 'none')
    }

    const name = this.determineInnerPropertyName()
    const to = this.determineInnerPropertyValue(this.defaultSlotElement)

    await this.defaultSlotElement
      .animate([{
        [name]: '0px'
      }, {
        [name]: `-${to}px`
      }], {
        duration,
        easing: this.easing,
        fill: 'forwards'
      })
      .finished
      .then(() => {
        this.innerHidden = true
      })
  }

  public async hideOuter (element: HTMLElement, duration = this.duration): Promise<void> {
    if (duration === 0) {
      element.style.setProperty('display', 'none')
    }

    if (window.getComputedStyle(element).position === 'relative') {
      this.setZIndexRelative(element)
    }

    const name = this.determineOuterPropertyName(element)
    const to = this.determineOuterPropertyValue(element)

    await element
      .animate([{
        [name]: `-${to}px`
      }], {
        duration,
        easing: this.easing,
        fill: 'forwards'
      })
      .finished
      .then(() => {
        if (window.getComputedStyle(element).position === 'absolute') {
          element.style.removeProperty('z-index')
        }

        element.hidden = true
      })
  }

  public async showContent (element: HTMLElement, duration = this.duration): Promise<void> {
    const contentElements = Array.from(this.contentElements)
    const style = window.getComputedStyle(element.assignedSlot ?? element)

    let dimensionName: 'height' | 'width' = 'height'
    let scrollName: 'scrollLeft' | 'scrollTop' = 'scrollTop'
    let toFactor = 1

    if (this.flow === 'row') {
      dimensionName = 'width'
      scrollName = 'scrollLeft'
    }

    if (this.dir === 'rtl') {
      toFactor = -1
    }

    const from = this.defaultSlotElement[scrollName]
    const index = contentElements.indexOf(element)
    const size = parseFloat(style[dimensionName])

    if (Number.isNaN(size)) {
      return
    }

    const to = index * size * toFactor

    contentElements.forEach((contentElement) => {
      contentElement.hidden = contentElement !== element
    })

    await this.ease(from, to, (value) => {
      this.defaultSlotElement[scrollName] = value
    }, duration)
  }

  public async showContentOrInner (element: HTMLElement, duration = this.duration): Promise<void> {
    const promises = []

    if (this.innerHidden === true) {
      promises.push(this.showInner(duration))
    }

    promises.push(this.showContent(element, duration))
    await Promise.all(promises)
  }

  public async showInner (duration = this.duration): Promise<void> {
    this.defaultSlotElement.style.removeProperty('display')

    const name = this.determineInnerPropertyName()
    const from = this.determineInnerPropertyValue(this.defaultSlotElement)

    this.innerHidden = false

    await this.defaultSlotElement
      .animate([{
        [name]: `-${from}px`
      }, {
        [name]: '0px'
      }], {
        duration,
        easing: this.easing,
        fill: 'forwards'
      })
      .finished
  }

  public async showOuter (element: HTMLElement, duration = this.duration): Promise<void> {
    element.style.removeProperty('display')

    const name = this.determineOuterPropertyName(element)
    const from = this.determineOuterPropertyValue(element)

    if (window.getComputedStyle(element).position === 'absolute') {
      this.setZIndexAbsolute(element)
    } else {
      this.setZIndexRelative(element)
    }

    element.hidden = false

    await element
      .animate([{
        [name]: `-${from}px`
      }, {
        [name]: '0px'
      }], {
        duration,
        easing: this.easing,
        fill: 'forwards'
      })
      .finished
  }

  public async toggleContent (element: HTMLElement, duration = this.duration): Promise<void> {
    if (element.hidden) {
      await this.showContent(element, duration)
    } else {
      await this.hideContent(element)
    }
  }

  public async toggleContentOrInner (element: HTMLElement, duration = this.duration): Promise<void> {
    if (element.hidden) {
      await this.showContentOrInner(element, duration)
    } else {
      await this.hideContentOrInner(element, duration)
    }
  }

  public async toggleInner (duration = this.duration): Promise<void> {
    if (this.innerHidden === true) {
      await this.showInner(duration)
    } else {
      await this.hideInner(duration)
    }
  }

  public async toggleNested (element: HTMLElement, duration = this.duration): Promise<void> {
    const contentElements = Array.from(this.contentElements)

    const visibleElements = contentElements.filter((contentElement) => {
      return contentElement instanceof ClipElement &&
        contentElement.innerHidden === false
    })

    await Promise.all(contentElements.map(async (contentElement) => {
      if (contentElement instanceof ClipElement) {
        if (contentElement === element) {
          if (contentElement.innerHidden === true) {
            await contentElement.showInner(duration)
          } else if (this.amount === 'min-one') {
            if (visibleElements.length > 1) {
              await contentElement.hideInner(duration)
            }
          } else if (this.amount === 'any') {
            await contentElement.hideInner(duration)
          }
        } else if (this.amount === 'max-one') {
          if (contentElement.innerHidden === false) {
            await contentElement.hideInner(duration)
          }
        } else if (this.amount === 'one') {
          if (contentElement.innerHidden === false) {
            await contentElement.hideInner(duration)
          }
        }
      }
    }))
  }

  public async toggleOuter (element: HTMLElement, duration = this.duration): Promise<void> {
    if (element.hidden) {
      await this.showOuter(element, duration)
    } else {
      await this.hideOuter(element, duration)
    }
  }

  protected determineInnerPropertyName (): string {
    const slotName = this.handleElement?.assignedSlot?.name ?? 'default'

    let { dir } = this

    if (dir === '') {
      dir = 'ltr'
    }

    switch (`${slotName}-${dir}`) {
      case 'after-ltr':
      case 'before-rtl':
        return 'marginRight'
      case 'after-rtl':
      case 'before-ltr':
        return 'marginLeft'
      case 'footer-ltr':
      case 'footer-rtl':
        return 'marginBottom'
      case 'header-ltr':
      case 'header-rtl':
        return 'marginTop'
      default:
        return ''
    }
  }

  protected determineInnerPropertyValue (element: HTMLElement): number {
    const style = window.getComputedStyle(element)
    const slotName = this.handleElement?.assignedSlot?.name

    let value = 0

    if (
      slotName === 'after' ||
      slotName === 'before'
    ) {
      value = parseInt(style.width, 10)
    } else {
      value = parseInt(style.height, 10)
    }

    if (Number.isNaN(value)) {
      value = 0
    }

    return value
  }

  protected determineOuterPropertyName (element: HTMLElement): string {
    const flow = this.flow ?? ''
    const slotName = element.assignedSlot?.name ?? ''

    let { dir } = this

    if (dir === '') {
      dir = 'ltr'
    }

    switch (`${flow}-${slotName}-${dir}`) {
      case 'column-after':
        return 'marginBottom'
      case 'column-before':
        return 'marginTop'
      case 'row-after-ltr':
      case 'row-before-rtl':
        return 'marginRight'
      case 'row-after-rtl':
      case 'row-before-ltr':
        return 'marginLeft'
      default:
        return ''
    }
  }

  protected determineOuterPropertyValue (element: HTMLElement): number {
    const style = window.getComputedStyle(element)

    let value = 0

    if (this.flow === 'row') {
      value = parseInt(style.width, 10)
    } else {
      value = parseInt(style.height, 10)
    }

    if (Number.isNaN(value)) {
      value = 0
    }

    return value
  }

  protected firstUpdatedContent (): void {
    this.defaultSlotElement.scrollLeft = 0
    this.defaultSlotElement.scrollTop = 0

    Array
      .from(this.contentElements)
      .forEach((contentElement, index) => {
        if (
          index === 0 &&
          this.innerHidden === true
        ) {
          this.firstUpdatedInner()
        }

        if (!contentElement.hidden) {
          contentElement.hidden = index !== 0
        }
      })
  }

  protected firstUpdatedInner (): void {
    this.defaultSlotElement.style.setProperty('display', 'none')
    this.innerHidden = true
  }

  protected firstUpdatedOuter (): void {
    Array
      .from(this.outerElements)
      .forEach((outerElement) => {
        window.requestAnimationFrame(() => {
          if (
            outerElement.hidden ||
            window.getComputedStyle(outerElement).position === 'absolute'
          ) {
            this.hideOuter(outerElement, 0).catch(() => {})
          }
        })
      })
  }

  protected handleClick (event: Event): void {
    const path = event.composedPath()

    Array
      .from(this.outerElements)
      .forEach((outerElement) => {
        if (
          !path.includes(outerElement) &&
          !outerElement.hidden &&
          window.getComputedStyle(outerElement).position === 'absolute'
        ) {
          this.hideOuter(outerElement).catch(() => {})
        }
      })
  }

  protected handleContent (event: ClipEvent): void {
    if (this.isTarget(event)) {
      const element = this.querySelector<HTMLElement>(`#${event.detail?.id ?? ''}`)

      if (element instanceof HTMLElement) {
        event.cancelBubble = true
        this.showContent(element).catch(() => {})
      }
    }
  }

  protected handleContentOrInner (event: ClipEvent): void {
    if (this.isTarget(event)) {
      if (event.detail?.id === undefined) {
        this.toggleInner().catch(() => {})
        return
      }

      const element = this.querySelector<HTMLElement>(`#${event.detail.id}`)

      if (element instanceof HTMLElement) {
        event.cancelBubble = true
        this.toggleContentOrInner(element).catch(() => {})
      }
    }
  }

  protected handleInner (event: ClipEvent): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true
      this.toggleInner().catch(() => {})
    }
  }

  protected handleNested (event: ClipEvent): void {
    if (this.isTarget(event)) {
      const element = this.querySelector<HTMLElement>(`#${event.detail?.id ?? ''}`)

      if (element instanceof HTMLElement) {
        event.cancelBubble = true
        this.toggleNested(element).catch(() => {})
      }
    }
  }

  protected handleOuter (event: ClipEvent): void {
    if (this.isTarget(event)) {
      const element = this.querySelector<HTMLElement>(`#${event.detail?.id ?? ''}`)

      if (element instanceof HTMLElement) {
        event.cancelBubble = true
        this.toggleOuter(element).catch(() => {})
      }
    }
  }

  protected handleViewMove (event: ViewMoveEvent): void {
    const path = event.composedPath()

    if (
      this.defaultSlotElement instanceof HTMLSlotElement &&
      path.includes(this.defaultSlotElement) &&
      this.innerHidden === true
    ) {
      this.showInner().catch(() => {})
    }

    Array
      .from(this.contentElements)
      .forEach((contentElement) => {
        if (path.includes(contentElement)) {
          if (contentElement.hidden) {
            this.showContent(contentElement).catch(() => {})
          }
        } else if (!contentElement.hidden) {
          this.hideContent(contentElement).catch(() => {})
        }
      })

    Array
      .from(this.outerElements)
      .forEach((outerElement) => {
        if (path.includes(outerElement)) {
          if (outerElement.hidden) {
            this.showOuter(outerElement).catch(() => {})
          }
        } else if (
          !outerElement.hidden &&
          window.getComputedStyle(outerElement).position === 'absolute'
        ) {
          this.hideOuter(outerElement).catch(() => {})
        }
      })
  }

  protected setZIndexAbsolute (element: HTMLElement): void {
    const zIndex = 2 + Array
      .from(this.outerElements)
      .map((outerElement) => {
        if (outerElement === element) {
          return 0
        }

        return parseFloat(outerElement.style.getPropertyValue('z-index'))
      })
      .reduce((left, right) => {
        return Math.max(left, right)
      }, 0)

    element.style.setProperty('z-index', `${zIndex}`)
  }

  protected setZIndexRelative (element: HTMLElement): void {
    const assignedElements = Array.from(element.assignedSlot?.assignedElements() ?? [])

    assignedElements.forEach((assignedElement) => {
      if (assignedElement instanceof HTMLElement) {
        assignedElement.style.setProperty(
          'z-index',
          `${1 + assignedElements.length - assignedElements.indexOf(assignedElement)}`
        )
      }
    })
  }
}
