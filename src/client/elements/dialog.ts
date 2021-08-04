import type { CSSResultGroup, PropertyValues } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { AppElement } from './app'
import { NodeElement } from './node'
import { isObject } from '../../common'
import styles from '../styles/dialog'

declare global {
  interface HTMLElementEventMap {
    'scola-dialog-hide': CustomEvent
    'scola-dialog-show': CustomEvent
  }

  interface HTMLElementTagNameMap {
    'scola-dialog': DialogElement
  }

  interface WindowEventMap {
    'scola-dialog-hide': CustomEvent
    'scola-dialog-show': CustomEvent
  }
}

interface DialogFrom {
  horizontal?: string
  vertical?: string
}

interface DialogTo {
  horizontal?: string
  vertical?: string
}

interface DialogPosition {
  left: number
  opacity?: number
  top: number
}

interface Rect {
  height: number
  left: number
  top: number
  width: number
}

const htoAlternatives: Record<string, string[]> = {
  'center': ['center', 'start', 'end', 'screen-center'],
  'end': ['end', 'start', 'center', 'screen-center'],
  'end-at-start': ['end-at-start', 'start-at-end', 'screen-center'],
  'screen-center': ['screen-center'],
  'screen-end': ['screen-end'],
  'screen-start': ['screen-start'],
  'start': ['start', 'end', 'center', 'screen-center'],
  'start-at-end': ['start-at-end', 'end-at-start', 'screen-center']
}

const vtoAlternatives: Record<string, string[]> = {
  'bottom': ['bottom', 'top', 'center', 'screen-center'],
  'bottom-at-top': ['bottom-at-top', 'top-at-bottom', 'screen-center'],
  'center': ['center', 'top', 'bottom', 'screen-center'],
  'screen-bottom': ['screen-bottom'],
  'screen-center': ['screen-center'],
  'screen-top': ['screen-top'],
  'top': ['top', 'bottom', 'center', 'screen-center'],
  'top-at-bottom': ['top-at-bottom', 'bottom-at-top', 'screen-center']
}

@customElement('scola-dialog')
export class DialogElement extends NodeElement {
  public static styles: CSSResultGroup[] = [
    ...NodeElement.styles,
    styles
  ]

  @property({
    reflect: true
  })
  public hcalc?: string

  @property()
  public hfrom?: string

  @property({
    reflect: true
  })
  public hspacing?: 'large' | 'medium' | 'small'

  @property()
  public hto?: string

  @property({
    type: Boolean
  })
  public locked?: boolean

  @property({
    reflect: true
  })
  public vcalc?: string

  @property()
  public vfrom?: string

  @property({
    reflect: true
  })
  public vspacing?: 'large' | 'medium' | 'small'

  @property()
  public vto?: string

  public anchorElement?: HTMLElement | null

  public contentElement: HTMLElement | null

  public position?: DialogPosition | null

  public scrimElement: HTMLElement | null

  protected busy = false

  protected handleClickBound: (event: Event) => void

  protected handleHideBound: (event: CustomEvent) => void

  protected handleKeydownBound: (event: KeyboardEvent) => void

  protected handleScrollBound: () => void

  protected handleShowBound: (event: CustomEvent) => void

  protected observer: ResizeObserver

  protected originElement: HTMLElement | null

  protected updaters = DialogElement.updaters

  public constructor () {
    super()
    this.dir = document.dir
    this.observer = new ResizeObserver(this.handleResize.bind(this))
    this.contentElement = this.querySelector<HTMLElement>(':scope > [as="content"]')
    this.originElement = this.parentElement
    this.scrimElement = this.querySelector<HTMLElement>(':scope > [as="scrim"]')
    this.handleClickBound = this.handleClick.bind(this)
    this.handleHideBound = this.handleHide.bind(this)
    this.handleKeydownBound = this.handleKeydown.bind(this)
    this.handleScrollBound = this.handleScroll.bind(this)
    this.handleShowBound = this.handleShow.bind(this)
  }

  public connectedCallback (): void {
    window.addEventListener('scola-dialog-hide', this.handleHideBound)
    window.addEventListener('scola-dialog-show', this.handleShowBound)
    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    this.observer.disconnect()
    window.removeEventListener('scola-dialog-hide', this.handleHideBound)
    window.removeEventListener('scola-dialog-show', this.handleShowBound)
    super.disconnectedCallback()
  }

  public firstUpdated (properties: PropertyValues): void {
    this.addEventListener('scola-dialog-hide', this.handleHideBound)
    this.addEventListener('scola-dialog-show', this.handleShowBound)
    this.addEventListener('scola-view-move', this.handleViewMove.bind(this))
    super.firstUpdated(properties)
  }

  public async hide (duration = this.duration): Promise<void> {
    if (
      this.hidden ||
      this.busy
    ) {
      return
    }

    this.prepareHide()

    const {
      from,
      to
    } = this.calculateHidePositions()

    if (this.isSame(to, from)) {
      from.opacity = 1
      to.opacity = 0
    }

    this.scrimElement
      ?.animate([{
        opacity: 1
      }, {
        opacity: 0
      }], {
        duration,
        easing: this.easing,
        fill: 'forwards'
      })

    await this.contentElement
      ?.animate([{
        left: `${from.left}px`,
        opacity: from.opacity ?? 1,
        top: `${from.top}px`
      }, {
        left: `${to.left}px`,
        opacity: to.opacity ?? 1,
        top: `${to.top}px`
      }], {
        duration,
        easing: this.easing,
        fill: 'forwards'
      })
      .finished
      .then(() => {
        this.finishHide()
      })
  }

  public async show (duration = this.duration): Promise<void> {
    if (
      !this.hidden ||
      this.busy
    ) {
      return
    }

    await this.prepareShow()

    const {
      from,
      to
    } = this.calculateShowPositions()

    if (this.isSame(to, from)) {
      from.opacity = 0
      to.opacity = 1
    }

    this.scrimElement
      ?.animate([{
        opacity: 0
      }, {
        opacity: 1
      }], {
        duration,
        easing: this.easing,
        fill: 'forwards'
      })

    await this.contentElement
      ?.animate([{
        left: `${from.left}px`,
        opacity: from.opacity ?? 1,
        top: `${from.top}px`
      }, {
        left: `${to.left}px`,
        opacity: to.opacity ?? 1,
        top: `${to.top}px`
      }], {
        duration,
        easing: this.easing,
        fill: 'forwards'
      })
      .finished
      .then(() => {
        this.finishShow()
      })
  }

  protected calculateFromPosition (from: DialogFrom): DialogPosition {
    return {
      left: this.calculateFromPositionLeft(from),
      top: this.calculateFromPositionTop(from)
    }
  }

  protected calculateFromPositionLeft (from: DialogFrom): number {
    const { width: appWidth = Infinity } = document
      .querySelector<AppElement>('scola-app')
      ?.getBoundingClientRect() ?? {}

    const { width: elementWidth = 0 } = this.contentElement
      ?.getBoundingClientRect() ?? {}

    let { dir } = this

    if (dir === '') {
      dir = 'ltr'
    }

    switch (`${from.horizontal ?? ''}-${dir}`) {
      case 'screen-center-ltr':
      case 'screen-center-rtl':
        return (appWidth - elementWidth) / 2
      case 'screen-end-ltr':
      case 'screen-start-rtl':
        return appWidth + elementWidth
      case 'screen-end-rtl':
      case 'screen-start-ltr':
        return -elementWidth
      default:
        return 0
    }
  }

  protected calculateFromPositionTop (from: DialogFrom): number {
    const { height: appHeight = Infinity } = document
      .querySelector<AppElement>('scola-app')
      ?.getBoundingClientRect() ?? {}

    const { height: elementHeight = 0 } = this.contentElement
      ?.getBoundingClientRect() ?? {}

    switch (from.vertical) {
      case 'screen-bottom':
        return appHeight + elementHeight
      case 'screen-center':
        return (appHeight - elementHeight) / 2
      case 'screen-top':
        return -elementHeight
      default:
        return 0
    }
  }

  protected calculateHidePositions (): { from: DialogPosition, to: DialogPosition } {
    const regExp = new RegExp(`(?<=(?<position>[^@\\s]+))${this.breakpoint}`, 'u')

    const from = {
      horizontal: this.hfrom?.match(regExp)?.groups?.position,
      vertical: this.vfrom?.match(regExp)?.groups?.position
    }

    const fromPosition = {
      left: 0,
      top: 0
    }

    if (this.contentElement instanceof HTMLElement) {
      const style = window.getComputedStyle(this.contentElement)

      fromPosition.left = parseFloat(style.left)
      fromPosition.top = parseFloat(style.top)

      if (
        Number.isNaN(fromPosition.left) ||
        Number.isNaN(fromPosition.top)
      ) {
        fromPosition.left = 0
        fromPosition.top = 0
      }
    }

    let toPosition = {
      ...fromPosition
    }

    if (typeof from.horizontal === 'string') {
      toPosition = this.calculateFromPosition(from)
    }

    return {
      from: fromPosition,
      to: toPosition
    }
  }

  protected calculateShowPositions (): { from: DialogPosition, to: DialogPosition } {
    const regExp = new RegExp(`(?<=(?<position>[^@\\s]+))${this.breakpoint}`, 'u')

    const from = {
      horizontal: this.hfrom?.match(regExp)?.groups?.position,
      vertical: this.vfrom?.match(regExp)?.groups?.position
    }

    const to = {
      horizontal: this.hto?.match(regExp)?.groups?.position,
      vertical: this.vto?.match(regExp)?.groups?.position
    }

    const toPosition = this.findToPosition(to)

    if (typeof to.horizontal === 'string') {
      this.hcalc = to.horizontal
    }

    if (typeof to.vertical === 'string') {
      this.vcalc = to.vertical
    }

    let fromPosition = {
      ...toPosition
    }

    if (
      typeof from.horizontal === 'string' &&
      typeof from.vertical === 'string'
    ) {
      fromPosition = this.calculateFromPosition(from)
    }

    return {
      from: fromPosition,
      to: toPosition
    }
  }

  protected calculateToPosition (to: DialogTo): DialogPosition {
    const appElement = document.querySelector<AppElement>('scola-app')
    const appRect = appElement?.getBoundingClientRect()
    const elementRect = this.contentElement?.getBoundingClientRect()

    if (
      appRect === undefined ||
      elementRect === undefined
    ) {
      return {
        left: 0,
        top: 0
      }
    }

    let anchorRect = {
      height: 0,
      left: 0,
      top: 0,
      width: 0
    }

    if (isObject(this.position)) {
      anchorRect = {
        ...anchorRect,
        left: this.position.left,
        top: this.position.top
      }
    } else if (this.anchorElement instanceof HTMLElement) {
      anchorRect = this.anchorElement.getBoundingClientRect()
    }

    return {
      left: this.calculateToPositionLeft(to, appRect, elementRect, anchorRect),
      top: this.calculateToPositionTop(to, appRect, elementRect, anchorRect)
    }
  }

  protected calculateToPositionLeft (to: DialogTo, appRect: Rect, elementRect: Rect, anchorRect: Rect): number {
    let { left } = anchorRect
    let { dir } = this

    if (dir === '') {
      dir = 'ltr'
    }

    switch (`${to.horizontal ?? ''}-${dir}`) {
      case 'center-ltr':
      case 'center-rtl':
        left += -(elementRect.width - anchorRect.width) / 2
        break
      case 'end-rtl':
      case 'start-ltr':
        left += 0
        break
      case 'end-ltr':
      case 'start-rtl':
        left += -elementRect.width + anchorRect.width
        break
      case 'end-at-start-rtl':
      case 'start-at-end-ltr':
        left += anchorRect.width
        break
      case 'end-at-start-ltr':
      case 'start-at-end-rtl':
        left += -elementRect.width
        break
      case 'screen-center-ltr':
      case 'screen-center-rtl':
        left = (appRect.width - elementRect.width) / 2
        break
      case 'screen-end-ltr':
      case 'screen-start-rtl':
        left = appRect.width - elementRect.width
        break
      case 'screen-end-rtl':
      case 'screen-start-ltr':
        left = 0
        break
      default:
        break
    }

    return left
  }

  protected calculateToPositionTop (to: DialogTo, app: Rect, element: Rect, anchor: Rect): number {
    let top = anchor.top + anchor.height

    switch (to.vertical) {
      case 'bottom':
        top += -element.height
        break
      case 'bottom-at-top':
        top += -element.height - anchor.height
        break
      case 'center':
        top += -(element.height + anchor.height) / 2
        break
      case 'top':
        top += -anchor.height
        break
      case 'top-at-bottom':
        break
      case 'screen-bottom':
        top = app.height - element.height
        break
      case 'screen-center':
        top = (app.height - element.height) / 2
        break
      case 'screen-top':
        top = -element.height
        break
      default:
        break
    }

    return top
  }

  protected findScrollParentElements (): NodeElement[] {
    const parents = []

    let element = this.closest<NodeElement>('[scrollbar]')

    while (element !== null) {
      parents.push(element)
      element = element.parentElement?.closest<NodeElement>('[scrollbar]') ?? null
    }

    return parents
  }

  protected findToPosition (to: DialogTo): DialogPosition {
    const {
      height: elementHeight = Infinity,
      width: elementWidth = Infinity
    } = this.contentElement
      ?.getBoundingClientRect() ?? {}

    const {
      height: appHeight = Infinity,
      width: appWidth = Infinity
    } = document
      .querySelector<AppElement>('scola-app')
      ?.getBoundingClientRect() ?? {}

    let position = {
      left: 0,
      top: 0
    }

    htoAlternatives[to.horizontal ?? 'center'].some((hto: string): boolean => {
      to.horizontal = hto
      position = this.calculateToPosition(to)
      return (
        position.left >= 0 &&
        position.left + elementWidth <= appWidth
      )
    })

    vtoAlternatives[to.vertical ?? 'center'].some((vto: string): boolean => {
      to.vertical = vto
      position = this.calculateToPosition(to)
      return (
        position.top >= 0 &&
        position.top + elementHeight <= appHeight
      )
    })

    return position
  }

  protected finishHide (): void {
    this.originElement?.appendChild(this)

    this
      .findScrollParentElements()
      .forEach((parentElement) => {
        parentElement.shadowBody.removeEventListener('scroll', this.handleScrollBound)
      })

    this.anchorElement = null
    this.busy = false
    this.hidden = true
    this.position = null
  }

  protected finishShow (): void {
    this.contentElement?.style.removeProperty('opacity')

    if (this.anchorElement instanceof HTMLElement) {
      this.observer.observe(this.anchorElement)
    }

    this.observer.observe(document.body)
    window.addEventListener('click', this.handleClickBound)
    window.addEventListener('keydown', this.handleKeydownBound)
    this.busy = false
  }

  protected handleClick (event: Event): void {
    if (
      this.contentElement instanceof HTMLElement &&
      !event.composedPath().includes(this.contentElement) &&
      this.locked !== true
    ) {
      this.hide().catch(() => {})
    }
  }

  protected handleHide (event: CustomEvent): void {
    if (this.isTarget(event)) {
      this.hide().catch(() => {})
    }
  }

  protected handleKeydown (event: KeyboardEvent): void {
    if (
      event.key === 'Escape' &&
      this.locked !== true
    ) {
      event.cancelBubble = true
      this.hide().catch(() => {})
    }
  }

  protected handleResize (): void {
    this.setMaxWidth()
    this.setPosition()
  }

  protected handleScroll (): void {
    this.hide(0).catch(() => {})
  }

  protected handleShow (event: CustomEvent<Record<string, unknown> | null>): void {
    if (this.isTarget(event)) {
      if (isObject(event.detail?.data)) {
        if (event.detail?.origin instanceof NodeElement) {
          this.anchorElement = event.detail.origin
        }

        if (
          isObject(event.detail?.data.position) &&
          typeof event.detail?.data.position.left === 'number' &&
          typeof event.detail.data.position.top === 'number'
        ) {
          this.position = {
            left: event.detail.data.position.left,
            top: event.detail.data.position.top
          }
        }
      }

      this.show().catch(() => {})
    }
  }

  protected handleViewMove (): void {
    this.show().catch(() => {})
  }

  protected isSame (from: DialogPosition, to: DialogPosition): boolean {
    return (
      from.left === to.left &&
      from.top === to.top
    )
  }

  protected prepareHide (): void {
    this.busy = true

    if (this.anchorElement instanceof HTMLElement) {
      this.observer.unobserve(this.anchorElement)
    }

    this.observer.unobserve(document.body)
    window.removeEventListener('click', this.handleClickBound)
    window.removeEventListener('keydown', this.handleKeydownBound)
  }

  protected async prepareShow (): Promise<void> {
    this.busy = true
    this.hidden = false

    this
      .findScrollParentElements()
      .forEach((parentElement) => {
        parentElement.shadowBody.addEventListener('scroll', this.handleScrollBound)
      })

    document
      .querySelector<AppElement>('scola-app')
      ?.shadowRoot
      ?.appendChild(this)

    this.contentElement?.style.setProperty('opacity', '0')
    this.scrimElement?.style.setProperty('opacity', '0')
    this.setMaxWidth()

    await new Promise((resolve) => {
      window.setTimeout(resolve)
    })
  }

  protected setMaxWidth (): void {
    if (
      this.anchorElement instanceof HTMLElement &&
      this.contentElement instanceof NodeElement
    ) {
      if (this.contentElement.width?.includes(`flex${this.breakpoint}`) === true) {
        this.contentElement.style.setProperty('width', `${this.anchorElement.getBoundingClientRect().width}px`)
      } else {
        this.contentElement.style.removeProperty('width')
      }
    }
  }

  protected setPosition (): void {
    const { to } = this.calculateShowPositions()

    this.contentElement?.animate({
      left: `${to.left}px`,
      top: `${to.top}px`
    }, {
      fill: 'forwards'
    })
  }
}
