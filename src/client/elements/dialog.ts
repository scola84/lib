import type { CSSResultGroup, PropertyValues } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { AppElement } from './app'
import { NodeElement } from './node'
import type { NodeEvent } from './node'
import { css } from 'lit'

declare global {
  interface HTMLElementEventMap {
    'scola-dialog-hide': NodeEvent
    'scola-dialog-show': NodeEvent
  }

  interface HTMLElementTagNameMap {
    'scola-dialog': DialogElement
  }

  interface WindowEventMap {
    'scola-dialog-hide': NodeEvent
    'scola-dialog-show': NodeEvent
  }
}

export type HorizontalFrom =
  | 'screen-center'
  | 'screen-end'
  | 'screen-start'

export type HorizontalTo =
  | 'center'
  | 'end-at-start'
  | 'end'
  | 'screen-center'
  | 'screen-end'
  | 'screen-start'
  | 'start-at-end'
  | 'start'

export type VerticalFrom =
  | 'screen-bottom'
  | 'screen-center'
  | 'screen-top'

export type VerticalTo =
  | 'bottom-at-top'
  | 'bottom'
  | 'center'
  | 'screen-bottom'
  | 'screen-center'
  | 'screen-top'
  | 'top-at-bottom'
  | 'top'

export interface DialogFrom {
  horizontal?: HorizontalFrom
  vertical?: VerticalFrom
}

export interface DialogTo {
  horizontal?: HorizontalTo
  vertical?: VerticalTo
}

export interface DialogPosition {
  left: number
  opacity?: number
  top: number
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
    css`
      :host {
        display: contents;
        position: inherit;
      }

      :host([hidden]) {
        display: none;
      }

      slot:not([name])::slotted(*) {
        flex: none;
        position: absolute;
        z-index: 9;
      }

      :host([hto-real="start-at-end"][hspacing="large"]) slot::slotted(*) {
        margin-left: 0.75rem;
      }

      :host([hto-real="start-at-end"][hspacing="large"][dir="rtl"]) slot::slotted(*) {
        margin-left: -0.75rem;
      }

      :host([hto-real="start-at-end"][hspacing="medium"]) slot::slotted(*) {
        margin-left: 0.5rem;
      }

      :host([hto-real="start-at-end"][hspacing="medium"][dir="rtl"]) slot::slotted(*) {
        margin-left: -0.5rem;
      }

      :host([hto-real="start-at-end"][hspacing="small"]) slot::slotted(*) {
        margin-left: 0.25rem;
      }

      :host([hto-real="start-at-end"][hspacing="small"][dir="rtl"]) slot::slotted(*) {
        margin-left: -0.25rem;
      }

      :host([hto-real="start"][hspacing="large"]) slot::slotted(*) {
        margin-left: -0.75rem;
      }

      :host([hto-real="start"][hspacing="large"][dir="rtl"]) slot::slotted(*) {
        margin-left: 0.75rem;
      }

      :host([hto-real="start"][hspacing="medium"]) slot::slotted(*) {
        margin-left: -0.5rem;
      }

      :host([hto-real="start"][hspacing="medium"][dir="rtl"]) slot::slotted(*) {
        margin-left: 0.5rem;
      }

      :host([hto-real="start"][hspacing="small"]) slot::slotted(*) {
        margin-left: -0.25rem;
      }

      :host([hto-real="start"][hspacing="small"][dir="rtl"]) slot::slotted(*) {
        margin-left: 0.25rem;
      }

      :host([hto-real="end-at-start"][hspacing="large"]) slot::slotted(*) {
        margin-left: -0.75rem;
      }

      :host([hto-real="end-at-start"][hspacing="large"][dir="rtl"]) slot::slotted(*) {
        margin-left: 0.75rem;
      }

      :host([hto-real="end-at-start"][hspacing="medium"]) slot::slotted(*) {
        margin-left: -0.5rem;
      }

      :host([hto-real="end-at-start"][hspacing="medium"][dir="rtl"]) slot::slotted(*) {
        margin-left: 0.5rem;
      }

      :host([hto-real="end-at-start"][hspacing="small"]) slot::slotted(*) {
        margin-left: -0.25rem;
      }

      :host([hto-real="end-at-start"][hspacing="small"][dir="rtl"]) slot::slotted(*) {
        margin-left: 0.25rem;
      }

      :host([hto-real="end"][hspacing="large"]) slot::slotted(*) {
        margin-left: 0.75rem;
      }

      :host([hto-real="end"][hspacing="large"][dir="rtl"]) slot::slotted(*) {
        margin-left: -0.75rem;
      }

      :host([hto-real="end"][hspacing="medium"]) slot::slotted(*) {
        margin-left: 0.5rem;
      }

      :host([hto-real="end"][hspacing="medium"][dir="rtl"]) slot::slotted(*) {
        margin-left: -0.5rem;
      }

      :host([hto-real="end"][hspacing="small"]) slot::slotted(*) {
        margin-left: 0.25rem;
      }

      :host([hto-real="end"][hspacing="small"][dir="rtl"]) slot::slotted(*) {
        margin-left: -0.25rem;
      }

      :host([vto-real="top"][vspacing="large"]) slot::slotted(*) {
        margin-top: -0.75rem;
      }

      :host([vto-real="top"][vspacing="medium"]) slot::slotted(*) {
        margin-top: -0.5rem;
      }

      :host([vto-real="top"][vspacing="small"]) slot::slotted(*) {
        margin-top: -0.25rem;
      }

      :host([vto-real="top-at-bottom"][vspacing="large"]) slot::slotted(*) {
        margin-top: 0.75rem;
      }

      :host([vto-real="top-at-bottom"][vspacing="medium"]) slot::slotted(*) {
        margin-top: 0.5rem;
      }

      :host([vto-real="top-at-bottom"][vspacing="small"]) slot::slotted(*) {
        margin-top: 0.25rem;
      }

      :host([vto-real="bottom"][vspacing="large"]) slot::slotted(*) {
        margin-top: 0.75rem;
      }

      :host([vto-real="bottom"][vspacing="medium"]) slot::slotted(*) {
        margin-top: 0.5rem;
      }

      :host([vto-real="bottom"][vspacing="small"]) slot::slotted(*) {
        margin-top: 0.25rem;
      }

      :host([vto-real="bottom-at-top"][vspacing="large"]) slot::slotted(*) {
        margin-top: -0.75rem;
      }

      :host([vto-real="bottom-at-top"][vspacing="medium"]) slot::slotted(*) {
        margin-top: -0.5rem;
      }

      :host([vto-real="bottom-at-top"][vspacing="small"]) slot::slotted(*) {
        margin-top: -0.25rem;
      }
    `
  ]

  @property()
  public hfrom?: HorizontalFrom

  @property({
    attribute: 'hfrom-screen'
  })
  public hfromScreen?: HorizontalFrom

  @property({
    reflect: true
  })
  public hspacing?: 'large' | 'medium' | 'small'

  @property()
  public hto?: HorizontalTo

  @property({
    attribute: 'hto-real',
    reflect: true
  })
  public htoReal?: HorizontalTo

  @property({
    attribute: 'hto-screen'
  })
  public htoScreen?: HorizontalTo

  @property({
    type: Boolean
  })
  public locked?: boolean

  @property()
  public vfrom?: VerticalFrom

  @property({
    attribute: 'vfrom-screen'
  })
  public vfromScreen?: VerticalFrom

  @property({
    reflect: true
  })
  public vspacing?: 'large' | 'medium' | 'small'

  @property()
  public vto?: VerticalTo

  @property({
    attribute: 'vto-real',
    reflect: true
  })
  public vtoReal?: VerticalTo

  @property({
    attribute: 'vto-screen'
  })
  public vtoScreen?: VerticalTo

  public anchorElement?: HTMLElement | null

  public get assignedElement (): HTMLElement | undefined {
    const assignedElement = this.defaultSlotElement
      .assignedElements()
      .pop()

    if (assignedElement instanceof HTMLElement) {
      return assignedElement
    }

    return undefined
  }

  protected handleClickBound: (event: Event) => void

  protected handleHideBound: (event: NodeEvent) => void

  protected handleResizeBound: () => void

  protected handleScrollBound: () => void

  protected handleShowBound: (event: NodeEvent) => void

  protected originElement?: HTMLElement | null

  protected updaters = DialogElement.updaters

  public constructor () {
    super()
    this.dir = document.dir
    this.originElement = this.parentElement
    this.handleClickBound = this.handleClick.bind(this)
    this.handleHideBound = this.handleHide.bind(this)
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
    super.firstUpdated(properties)
  }

  public async hide (duration = this.duration): Promise<void> {
    window.removeEventListener('click', this.handleClickBound)
    window.removeEventListener('resize', this.handleResizeBound)
    window.removeEventListener('scola-scroll', this.handleScrollBound)

    const {
      from,
      to
    } = this.calculateHidePositions()

    if (this.isSame(to, from)) {
      from.opacity = 1
      to.opacity = 0
    }

    await this.assignedElement
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
        this.originElement?.appendChild(this)
        this.toggleAttribute('hidden', true)
      })
  }

  public async show (duration = this.duration): Promise<void> {
    if (!this.hidden) {
      return
    }

    document
      .querySelector<AppElement>('scola-app')
      ?.shadowRoot
      ?.appendChild(this)

    this.toggleAttribute('hidden', false)

    const {
      from,
      to
    } = this.calculateShowPositions()

    if (this.isSame(to, from)) {
      from.opacity = 0
      to.opacity = 1
    }

    await this.assignedElement
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
        window.addEventListener('click', this.handleClickBound)
        window.addEventListener('resize', this.handleResizeBound)
        window.addEventListener('scola-scroll', this.handleScrollBound)
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

    const { width: elementWidth = 0 } = this.assignedElement
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

    const { height: elementHeight = 0 } = this.assignedElement
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
      this.htoReal !== this.hto &&
      this.vtoReal !== this.hto &&
      this.htoReal?.includes('screen') !== undefined &&
      this.vtoReal?.includes('screen') !== undefined
    ) {
      from.horizontal = this.hfromScreen ?? from.horizontal
      from.vertical = this.vfromScreen ?? from.vertical
    }

    let left = '0'
    let top = '0'

    if (this.assignedElement instanceof HTMLElement) {
      ({ left, top } = window.getComputedStyle(this.assignedElement))
    }

    const toPosition = {
      left: parseFloat(left),
      top: parseFloat(top)
    }

    if (
      Number.isNaN(toPosition.left) ||
      Number.isNaN(toPosition.top)
    ) {
      toPosition.left = 0
      toPosition.top = 0
    }

    let fromPosition = { ...toPosition }

    if (from.horizontal !== undefined) {
      fromPosition = this.calculateFromPosition(from)
    }

    return {
      from: fromPosition,
      to: toPosition
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
      to.horizontal = this.htoScreen ?? to.horizontal
      to.vertical = this.vtoScreen ?? to.vertical
      toPosition = this.findToPosition(to)
      from.horizontal = this.hfromScreen ?? from.horizontal
      from.vertical = this.vfromScreen ?? from.vertical
    }

    if (to.horizontal !== undefined) {
      this.htoReal = to.horizontal
    }

    if (to.vertical !== undefined) {
      this.vtoReal = to.vertical
    }

    let fromPosition = { ...toPosition }

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
    const elementRect = this.assignedElement?.getBoundingClientRect()
    const anchorRect = this.anchorElement?.getBoundingClientRect()

    if (
      appRect === undefined ||
      elementRect === undefined ||
      anchorRect === undefined
    ) {
      return {
        left: 0,
        top: 0
      }
    }

    return {
      left: this.calculateToPositionLeft(to, appRect, elementRect, anchorRect),
      top: this.calculateToPositionTop(to, appRect, elementRect, anchorRect)
    }
  }

  protected calculateToPositionLeft (to: DialogTo, appRect: DOMRect, elementRect: DOMRect, anchorRect: DOMRect): number {
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

  protected calculateToPositionTop (to: DialogTo, app: DOMRect, element: DOMRect, anchor: DOMRect): number {
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

  protected findToPosition (to: DialogTo): DialogPosition {
    const {
      height: elementHeight = Infinity,
      width: elementWidth = Infinity
    } = this.assignedElement
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

  protected handleClick (event: Event): void {
    if (
      this.assignedElement instanceof HTMLElement &&
      !event.composedPath().includes(this.assignedElement) &&
      this.locked !== true
    ) {
      this.hide().catch(() => {})
    }
  }

  protected handleHide (event: NodeEvent): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true
      this.hide().catch(() => {})
    }
  }

  protected handleResize (): void {
    this.show().catch(() => {})
  }

  protected handleScroll (): void {
    this.hide().catch(() => {})
  }

  protected handleShow (event: NodeEvent): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true
      this.anchorElement = event.detail?.origin
      this.show().catch(() => {})
    }
  }

  protected isSame (from: DialogPosition, to: DialogPosition): boolean {
    return (
      from.left === to.left &&
      from.top === to.top
    )
  }
}
