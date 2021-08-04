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

type HorizontalFrom =
  | 'screen-center'
  | 'screen-end'
  | 'screen-start'

type HorizontalTo =
  | 'center'
  | 'end-at-start'
  | 'end'
  | 'screen-center'
  | 'screen-end'
  | 'screen-start'
  | 'start-at-end'
  | 'start'

type VerticalFrom =
  | 'screen-bottom'
  | 'screen-center'
  | 'screen-top'

type VerticalTo =
  | 'bottom-at-top'
  | 'bottom'
  | 'center'
  | 'screen-bottom'
  | 'screen-center'
  | 'screen-top'
  | 'top-at-bottom'
  | 'top'

interface DialogFrom {
  horizontal?: HorizontalFrom
  vertical?: VerticalFrom
}

interface DialogTo {
  horizontal?: HorizontalTo
  vertical?: VerticalTo
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

const htoAlternatives: Record<HorizontalTo, HorizontalTo[]> = {
  'center': ['center', 'start', 'end', 'screen-center'],
  'end': ['end', 'start', 'center', 'screen-center'],
  'end-at-start': ['end-at-start', 'start-at-end', 'screen-center'],
  'screen-center': ['screen-center'],
  'screen-end': ['screen-end'],
  'screen-start': ['screen-start'],
  'start': ['start', 'end', 'center', 'screen-center'],
  'start-at-end': ['start-at-end', 'end-at-start', 'screen-center']
}

const vtoAlternatives: Record<VerticalTo, VerticalTo[]> = {
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

  @property()
  public hfrom?: HorizontalFrom

  @property({
    reflect: true
  })
  public hspacing?: 'large' | 'medium' | 'small'

  @property()
  public hto?: HorizontalTo

  @property({
    type: Boolean
  })
  public locked?: boolean

  @property({
    attribute: 'real-hto',
    reflect: true
  })
  public realHto?: HorizontalTo

  @property({
    attribute: 'real-vto',
    reflect: true
  })
  public realVto?: VerticalTo

  @property({
    attribute: 'screen-height'
  })
  public screenHeight?: NodeElement['height']

  @property({
    attribute: 'screen-hfrom'
  })
  public screenHfrom?: HorizontalFrom

  @property({
    attribute: 'screen-hto'
  })
  public screenHto?: HorizontalTo

  @property({
    attribute: 'screen-vfrom'
  })
  public screenVfrom?: VerticalFrom

  @property({
    attribute: 'screen-vto'
  })
  public screenVto?: VerticalTo

  @property({
    attribute: 'screen-width'
  })
  public screenWidth?: NodeElement['width']

  @property()
  public vfrom?: VerticalFrom

  @property({
    reflect: true
  })
  public vspacing?: 'large' | 'medium' | 'small'

  @property()
  public vto?: VerticalTo

  public anchorElement?: HTMLElement | null

  public contentElement: HTMLElement | null

  public position?: DialogPosition | null

  public scrimElement: HTMLElement | null

  protected handleClickBound: (event: Event) => void

  protected handleHideBound: (event: CustomEvent) => void

  protected handleKeydownBound: (event: KeyboardEvent) => void

  protected handleResizeBound: () => void

  protected handleScrollBound: () => void

  protected handleShowBound: (event: CustomEvent) => void

  protected originElement: HTMLElement | null

  protected updaters = DialogElement.updaters

  public constructor () {
    super()
    this.dir = document.dir
    this.contentElement = this.querySelector<HTMLElement>('[is="content"]')
    this.originElement = this.parentElement
    this.scrimElement = this.querySelector<HTMLElement>('[is="scrim"]')
    this.handleClickBound = this.handleClick.bind(this)
    this.handleHideBound = this.handleHide.bind(this)
    this.handleKeydownBound = this.handleKeydown.bind(this)
    this.handleResizeBound = this.handleResize.bind(this)
    this.handleScrollBound = this.handleScroll.bind(this)
    this.handleShowBound = this.handleShow.bind(this)
  }

  public connectedCallback (): void {
    window.addEventListener('scola-dialog-hide', this.handleHideBound)
    window.addEventListener('scola-dialog-show', this.handleShowBound)
    super.connectedCallback()
  }

  public disconnectedCallback (): void {
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
    if (this.hidden) {
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
    if (!this.hidden) {
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
    const from = {
      horizontal: this.hfrom,
      vertical: this.vfrom
    }

    if (
      this.realHto !== this.hto &&
      this.realVto !== this.hto &&
      this.realHto?.includes('screen') !== undefined &&
      this.realVto?.includes('screen') !== undefined
    ) {
      from.horizontal = this.screenHfrom ?? from.horizontal
      from.vertical = this.screenVfrom ?? from.vertical
    }

    const toPosition = {
      left: 0,
      top: 0
    }

    if (this.contentElement instanceof HTMLElement) {
      const style = window.getComputedStyle(this.contentElement)

      toPosition.left = parseFloat(style.left)
      toPosition.top = parseFloat(style.top)

      if (
        Number.isNaN(toPosition.left) ||
        Number.isNaN(toPosition.top)
      ) {
        toPosition.left = 0
        toPosition.top = 0
      }
    }

    let fromPosition = {
      ...toPosition
    }

    if (from.horizontal !== undefined) {
      fromPosition = this.calculateFromPosition(from)
    }

    return {
      from: toPosition,
      to: fromPosition
    }
  }

  protected calculateShowPositions (): { from: DialogPosition, to: DialogPosition } {
    const from = {
      horizontal: this.hfrom,
      vertical: this.vfrom
    }

    const to = {
      horizontal: this.hto,
      vertical: this.vto
    }

    let toPosition = this.findToPosition(to)

    if ((
      to.horizontal !== this.hto &&
      to.horizontal?.includes('screen') !== undefined
    ) || (
      to.vertical !== this.vto &&
      to.vertical?.includes('screen') !== undefined
    )) {
      toPosition = this.findScreenPosition(from, to)
    }

    if (to.horizontal !== undefined) {
      this.realHto = to.horizontal
    }

    if (to.vertical !== undefined) {
      this.realVto = to.vertical
    }

    let fromPosition = {
      ...toPosition
    }

    if (
      from.horizontal !== undefined &&
      from.vertical !== undefined
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
        top = 0
        break
      default:
        break
    }

    return top
  }

  protected findScreenPosition (from: DialogFrom, to: DialogTo): DialogPosition {
    to.horizontal = this.screenHto ?? to.horizontal
    to.vertical = this.screenVto ?? to.vertical
    from.horizontal = this.screenHfrom ?? from.horizontal
    from.vertical = this.screenVfrom ?? from.vertical

    if (this.screenWidth !== undefined) {
      this.contentElement?.setAttribute('width', this.screenWidth)
    }

    if (this.screenHeight !== undefined) {
      this.contentElement?.setAttribute('height', this.screenHeight)
    }

    if (this.width === 'auto') {
      this.contentElement?.style.removeProperty('max-width')
    }

    return this.findToPosition(to)
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

    htoAlternatives[to.horizontal ?? 'center'].some((hto: HorizontalTo): boolean => {
      to.horizontal = hto
      position = this.calculateToPosition(to)
      return (
        position.left >= 0 &&
        position.left + elementWidth <= appWidth
      )
    })

    vtoAlternatives[to.vertical ?? 'center'].some((vto: VerticalTo): boolean => {
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
    this.hidden = true
    this.position = null
  }

  protected finishShow (): void {
    this.contentElement?.style.removeProperty('opacity')
    window.addEventListener('click', this.handleClickBound)
    window.addEventListener('keydown', this.handleKeydownBound)
    window.addEventListener('resize', this.handleResizeBound)
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
      event.cancelBubble = true
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
    const { to } = this.calculateShowPositions()

    this.contentElement?.animate({
      left: `${to.left}px`,
      to: `${to.top}px`
    }, {
      fill: 'forwards'
    })
  }

  protected handleScroll (): void {
    this.hide(0).catch(() => {})
  }

  protected handleShow (event: CustomEvent<Record<string, unknown> | null>): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true

      if (isObject(event.detail?.data)) {
        if (event.detail?.origin instanceof HTMLElement) {
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
    window.removeEventListener('click', this.handleClickBound)
    window.removeEventListener('keydown', this.handleKeydownBound)
    window.removeEventListener('resize', this.handleResizeBound)
  }

  protected async prepareShow (): Promise<void> {
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

    if (
      this.width === 'auto' &&
      this.anchorElement instanceof HTMLElement
    ) {
      this.contentElement?.style.setProperty('max-width', `${this.anchorElement.getBoundingClientRect().width}px`)
    }

    await new Promise((resolve) => {
      window.setTimeout(resolve)
    })
  }
}
