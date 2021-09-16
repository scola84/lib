import { customElement, property } from 'lit/decorators.js'
import type { AppElement } from './app'
import type { InteractEvent } from '@interactjs/core/InteractEvent'
import type { Interactable } from '@interactjs/core/Interactable'
import { NodeElement } from './node'
import type { Struct } from '../../common'
import interact from 'interactjs'
import { isStruct } from '../../common'
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

interface ContentPosition {
  horizontal?: string
  vertical?: string
}

interface ContentStyle {
  left: number
  opacity?: number
  top: number
}

interface Positions {
  extension: ContentPosition
  from: ContentPosition
  to: ContentPosition
}

interface Rect {
  height: number
  left: number
  top: number
  width: number
}

interface Styles {
  from: ContentStyle
  to: ContentStyle
}

type Direction = 'down' | 'left' | 'none' | 'right' | 'up'

const htoAlternatives: Struct<string[]> = {
  'center': ['center', 'start', 'end', 'screen-center'],
  'end': ['end', 'start', 'center', 'screen-center'],
  'end-at-start': ['end-at-start', 'start-at-end', 'screen-center'],
  'screen-center': ['screen-center'],
  'screen-end': ['screen-end'],
  'screen-start': ['screen-start'],
  'start': ['start', 'end', 'center', 'screen-center'],
  'start-at-end': ['start-at-end', 'end-at-start', 'screen-center']
}

const vtoAlternatives: Struct<string[]> = {
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
  public static styles = [
    ...NodeElement.styles,
    styles
  ]

  @property()
  public drag?: string

  @property({
    reflect: true
  })
  public hcalc?: string

  @property()
  public hext?: string

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
  public vext?: string

  @property()
  public vfrom?: string

  @property({
    reflect: true
  })
  public vspacing?: 'large' | 'medium' | 'small'

  @property()
  public vto?: string

  public anchorElement?: HTMLElement | null

  public contentElement: HTMLElement

  protected busy = false

  protected contentStyle?: ContentStyle | null

  protected dragInteractable?: Interactable

  protected handleClickBound = this.handleClick.bind(this)

  protected handleDragendBound = this.handleDragend.bind(this)

  protected handleHideBound = this.handleHide.bind(this)

  protected handleKeydownBound = this.handleKeydown.bind(this)

  protected handleMoveBound = this.handleMove.bind(this)

  protected handleResizeBound = this.handleResize.bind(this)

  protected handleScrollBound = this.handleScroll.bind(this)

  protected handleShowBound = this.handleShow.bind(this)

  protected handleTapBound = this.handleTap.bind(this)

  protected handleViewMoveBound = this.handleViewMove.bind(this)

  protected originElement: HTMLElement | null

  protected resizeObserver?: ResizeObserver

  protected scrimElement: HTMLElement | null

  protected updaters = DialogElement.updaters

  public constructor () {
    super()

    const contentElement = this.querySelector<HTMLElement>(':scope > [as="content"]')

    if (contentElement === null) {
      throw new Error('Content element is null')
    }

    this.dir = document.dir
    this.contentElement = contentElement
    this.originElement = this.parentElement
    this.scrimElement = this.querySelector<HTMLElement>(':scope > [as="scrim"]')
  }

  public connectedCallback (): void {
    this.setUpResize()

    if (this.drag?.includes(this.breakpoint) === true) {
      this.setUpDrag()
    }

    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    this.tearDownDrag()
    this.tearDownResize()
    super.disconnectedCallback()
  }

  public async extend (duration = this.duration): Promise<void> {
    if (this.busy) {
      return
    }

    const { to } = this.calculateShowStyles(false)

    this.contentElement.style.setProperty('transition', `transform ${duration}ms ${this.easing}`)
    this.contentElement.style.setProperty('transform', 'translate(0, 0)')

    await this.contentElement
      .animate([{
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
        this.finishExtend()
      })
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
    } = this.calculateHideStyles()

    await Promise.all([
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
        .finished,
      this.contentElement
        .animate([{
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
    ])
  }

  public async resize (duration = this.duration): Promise<void> {
    if (this.busy) {
      return
    }

    const { to } = this.calculateShowStyles()

    this.contentElement.style.setProperty('transition', `transform ${duration}ms ${this.easing}`)
    this.contentElement.style.setProperty('transform', 'translate(0, 0)')

    await this.contentElement
      .animate([{
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
        this.finishResize()
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
    } = this.calculateShowStyles()

    await Promise.all([
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
        .finished,
      this.contentElement
        .animate([{
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
    ])
  }

  protected calculateExtendStyle (style: ContentStyle, from: ContentPosition, extension: ContentPosition): ContentStyle {
    return {
      left: this.calculateExtendStyleLeft(style, from, extension),
      top: this.calculateExtendStyleTop(style, from, extension)
    }
  }

  protected calculateExtendStyleLeft (style: ContentStyle, from: ContentPosition, extension: ContentPosition): number {
    const { width: appWidth = Infinity } = document
      .querySelector<AppElement>('scola-app')
      ?.getBoundingClientRect() ?? {}

    let { left } = style
    let { dir } = this

    if (dir === '') {
      dir = 'ltr'
    }

    switch (`${from.horizontal ?? ''}-${dir}`) {
      case 'screen-end-ltr':
      case 'screen-start-rtl':
        left = appWidth * (100 - Number(extension.horizontal ?? 100)) / 100
        break
      case 'screen-end-rtl':
      case 'screen-start-ltr':
        left = -appWidth * (100 - Number(extension.horizontal ?? 100)) / 100
        break
      default:
        break
    }

    return left
  }

  protected calculateExtendStyleTop (style: ContentStyle, from: ContentPosition, extension: ContentPosition): number {
    const { height: appHeight = Infinity } = document
      .querySelector<AppElement>('scola-app')
      ?.getBoundingClientRect() ?? {}

    let { top } = style

    switch (from.vertical) {
      case 'screen-bottom':
        top = appHeight * (100 - Number(extension.vertical ?? 100)) / 100
        break
      case 'screen-top':
        top = -appHeight * (100 - Number(extension.vertical ?? 100)) / 100
        break
      default:
        break
    }

    return top
  }

  protected calculateFromStyle (from: ContentPosition): ContentStyle {
    return {
      left: this.calculateFromStyleLeft(from),
      top: this.calculateFromStyleTop(from)
    }
  }

  protected calculateFromStyleLeft (from: ContentPosition): number {
    const { width: appWidth = Infinity } = document
      .querySelector<AppElement>('scola-app')
      ?.getBoundingClientRect() ?? {}

    const { width: elementWidth = 0 } = this.contentElement
      .getBoundingClientRect()

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

  protected calculateFromStyleTop (from: ContentPosition): number {
    const { height: appHeight = Infinity } = document
      .querySelector<AppElement>('scola-app')
      ?.getBoundingClientRect() ?? {}

    const { height: elementHeight = 0 } = this.contentElement
      .getBoundingClientRect()

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

  protected calculateHideStyles (): Styles {
    const { from } = this.determinePositions()

    const fromStyle: ContentStyle = {
      left: 0,
      top: 0
    }

    if (this.contentElement instanceof HTMLElement) {
      const style = window.getComputedStyle(this.contentElement)

      fromStyle.left = parseFloat(style.left)
      fromStyle.top = parseFloat(style.top)

      if (
        Number.isNaN(fromStyle.left) ||
        Number.isNaN(fromStyle.top)
      ) {
        fromStyle.left = 0
        fromStyle.top = 0
      }
    }

    let toStyle = {
      ...fromStyle
    }

    if (typeof from.horizontal === 'string') {
      toStyle = this.calculateFromStyle(from)
    }

    if (this.isSame(toStyle, fromStyle)) {
      fromStyle.opacity = 1
      toStyle.opacity = 0
    }

    return {
      from: fromStyle,
      to: toStyle
    }
  }

  protected calculateShowStyles (extend = true): Styles {
    const {
      extension,
      from,
      to
    } = this.determinePositions()

    let toStyle = this.findToStyle(to)

    if (
      extend && (
        typeof extension.horizontal === 'string' ||
        typeof extension.vertical === 'string'
      )
    ) {
      toStyle = this.calculateExtendStyle(toStyle, from, extension)
    }

    if (typeof to.horizontal === 'string') {
      this.hcalc = to.horizontal
    }

    if (typeof to.vertical === 'string') {
      this.vcalc = to.vertical
    }

    let fromStyle = {
      ...toStyle
    }

    if (
      typeof from.horizontal === 'string' &&
      typeof from.vertical === 'string'
    ) {
      fromStyle = this.calculateFromStyle(from)
    }

    if (this.isSame(toStyle, fromStyle)) {
      fromStyle.opacity = 0
      toStyle.opacity = 1
    }

    return {
      from: fromStyle,
      to: toStyle
    }
  }

  protected calculateToStyle (to: ContentPosition): ContentStyle {
    const appElement = document.querySelector<AppElement>('scola-app')
    const appRect = appElement?.getBoundingClientRect()
    const elementRect = this.contentElement.getBoundingClientRect()

    if (appRect === undefined) {
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

    if (isStruct(this.contentStyle)) {
      anchorRect = {
        ...anchorRect,
        left: this.contentStyle.left,
        top: this.contentStyle.top
      }
    } else if (this.anchorElement instanceof HTMLElement) {
      anchorRect = this.anchorElement.getBoundingClientRect()
    }

    return {
      left: this.calculateToStyleLeft(to, appRect, elementRect, anchorRect),
      top: this.calculateToStyleTop(to, appRect, elementRect, anchorRect)
    }
  }

  protected calculateToStyleLeft (to: ContentPosition, appRect: Rect, elementRect: Rect, anchorRect: Rect): number {
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

  protected calculateToStyleTop (to: ContentPosition, app: Rect, element: Rect, anchor: Rect): number {
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

  protected determineDirection (): Direction {
    const {
      from,
      to
    } = this.determinePositions()

    let direction: Direction = 'none'

    const { dir } = this

    switch (`${from.horizontal ?? ''}-${to.horizontal ?? ''}-${dir}`) {
      case 'screen-start-screen-start-ltr':
      case 'screen-end-screen-start-rtl':
        direction = 'right'
        break
      case 'screen-end-screen-start-ltr':
      case 'screen-start-screen-start-rtl':
        direction = 'left'
        break
      default:
        break
    }

    switch (`${from.vertical ?? ''}-${to.vertical ?? ''}`) {
      case 'screen-top-screen-bottom':
        direction = 'down'
        break
      case 'screen-bottom-screen-bottom':
        direction = 'up'
        break
      default:
        break
    }

    return direction
  }

  protected determinePositions (): Positions {
    const regExp = new RegExp(`(?<position>[^@\\s]+)${this.breakpoint}`, 'u')

    const extension = {
      horizontal: this.hext?.match(regExp)?.groups?.position,
      vertical: this.vext?.match(regExp)?.groups?.position
    }

    const from = {
      horizontal: this.hfrom?.match(regExp)?.groups?.position,
      vertical: this.vfrom?.match(regExp)?.groups?.position
    }

    const to = {
      horizontal: this.hto?.match(regExp)?.groups?.position,
      vertical: this.vto?.match(regExp)?.groups?.position
    }

    const positions = {
      extension,
      from,
      to
    }

    return positions
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

  protected findToStyle (to: ContentPosition): ContentStyle {
    const {
      height: elementHeight = Infinity,
      width: elementWidth = Infinity
    } = this.contentElement.getBoundingClientRect()

    const {
      height: appHeight = Infinity,
      width: appWidth = Infinity
    } = document
      .querySelector<AppElement>('scola-app')
      ?.getBoundingClientRect() ?? {}

    let style = {
      left: 0,
      top: 0
    }

    htoAlternatives[to.horizontal ?? 'center'].some((hto: string): boolean => {
      to.horizontal = hto
      style = this.calculateToStyle(to)
      return (
        style.left >= 0 &&
        style.left + elementWidth <= appWidth
      )
    })

    vtoAlternatives[to.vertical ?? 'center'].some((vto: string): boolean => {
      to.vertical = vto
      style = this.calculateToStyle(to)
      return (
        style.top >= 0 &&
        style.top + elementHeight <= appHeight
      )
    })

    return style
  }

  protected finishExtend (): void {
    this.setContentStyleAfterFinish()
  }

  protected finishHide (): void {
    this.originElement?.appendChild(this)
    this.setContentStyleAfterFinish()

    this
      .findScrollParentElements()
      .forEach((parentElement) => {
        parentElement.shadowBody.removeEventListener('scroll', this.handleScrollBound)
      })

    this.anchorElement = null
    this.busy = false
    this.contentStyle = null
    this.hidden = true
  }

  protected finishResize (): void {
    this.setContentStyleAfterFinish()
  }

  protected finishShow (): void {
    if (this.anchorElement instanceof HTMLElement) {
      this.resizeObserver?.observe(this.anchorElement)
    }

    this.resizeObserver?.observe(document.body)
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

  protected handleDragend (event: InteractEvent): void {
    const direction = this.determineDirection()

    if ((
      direction === 'up' &&
      event.velocity.y > 0
    ) || (
      direction === 'down' &&
      event.velocity.y < 0
    ) || (
      direction === 'right' &&
      event.velocity.x < 0
    ) || (
      direction === 'left' &&
      event.velocity.x > 0
    )) {
      this.hide().catch(() => {})
    } else {
      this.extend().catch(() => {})
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

  protected handleMove (event: InteractEvent): void {
    const {
      left = 0,
      top = 0
    } = ((/(?<left>[.\-\d]+)px(?<opt>, ?(?<top>[.\-\d]+)px)?/u).exec(this.contentElement.style.getPropertyValue('transform')))?.groups ?? {}

    this.contentElement.style.setProperty('transform', `translate(${Number(left) + event.dx}px, ${Number(top) + event.dy}px)`)
  }

  protected handleResize (): void {
    this.setContentWidth()
    this.resize(0).catch(() => {})
  }

  protected handleScroll (): void {
    this.hide(0).catch(() => {})
  }

  protected handleShow (event: CustomEvent<Struct | null>): void {
    if (this.isTarget(event)) {
      if (isStruct(event.detail?.data)) {
        if (event.detail?.origin instanceof NodeElement) {
          this.anchorElement = event.detail.origin
        }

        if (
          isStruct(event.detail?.data.style) &&
          typeof event.detail?.data.style.left === 'number' &&
          typeof event.detail.data.style.top === 'number'
        ) {
          this.contentStyle = {
            left: event.detail.data.style.left,
            top: event.detail.data.style.top
          }
        }
      }

      this.show().catch(() => {})
    }
  }

  protected handleTap (): void {
    this.extend().catch(() => {})
  }

  protected handleViewMove (): void {
    this.show().catch(() => {})
  }

  protected isSame (from: ContentStyle, to: ContentStyle): boolean {
    return (
      from.left === to.left &&
      from.top === to.top
    )
  }

  protected prepareHide (): void {
    this.busy = true

    if (this.anchorElement instanceof HTMLElement) {
      this.resizeObserver?.unobserve(this.anchorElement)
    }

    this.resizeObserver?.unobserve(document.body)
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

    this.contentElement.style.setProperty('opacity', '0')
    this.scrimElement?.style.setProperty('opacity', '0')
    this.setContentWidth()

    await new Promise((resolve) => {
      window.setTimeout(resolve)
    })
  }

  protected setContentStyleAfterFinish (): void {
    this.contentElement.style.removeProperty('opacity')
    this.contentElement.style.removeProperty('transform')
    this.contentElement.style.removeProperty('transition')
  }

  protected setContentWidth (): void {
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

  protected setUpDrag (): void {
    const direction = this.determineDirection()

    let allowFrom: boolean | string = false
    let lockAxis: 'x' | 'xy' | 'y' = 'xy'

    if (this.contentElement.querySelector('[as="handle"]') !== null) {
      allowFrom = '[as="handle"]'
    }

    if ((
      direction === 'up' ||
      direction === 'down'
    )) {
      lockAxis = 'y'
    } else if ((
      direction === 'left' ||
      direction === 'right'
    )) {
      lockAxis = 'x'
    }

    this.dragInteractable = interact(this.contentElement)
      .draggable({
        allowFrom,
        listeners: {
          move: this.handleMoveBound
        },
        lockAxis
      })
      .on('tap', this.handleTapBound)
      .on('dragend', this.handleDragendBound)
  }

  protected setUpElementListeners (): void {
    this.addEventListener('scola-dialog-hide', this.handleHideBound)
    this.addEventListener('scola-dialog-show', this.handleShowBound)
    this.addEventListener('scola-view-move', this.handleViewMoveBound)
    super.setUpElementListeners()
  }

  protected setUpResize (): void {
    this.resizeObserver = new ResizeObserver(this.handleResizeBound)
  }

  protected setUpWindowListeners (): void {
    window.addEventListener('scola-dialog-hide', this.handleHideBound)
    window.addEventListener('scola-dialog-show', this.handleShowBound)
    super.setUpWindowListeners()
  }

  protected tearDownDrag (): void {
    this.dragInteractable?.unset()
  }

  protected tearDownResize (): void {
    this.resizeObserver?.disconnect()
  }

  protected tearDownWindowListeners (): void {
    window.removeEventListener('scola-dialog-hide', this.handleHideBound)
    window.removeEventListener('scola-dialog-show', this.handleShowBound)
    super.tearDownWindowListeners()
  }
}
