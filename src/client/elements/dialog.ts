import {
  css,
  customElement,
  property
} from 'lit-element'

import type { AppElement } from './app'
import type { CSSResult } from 'lit-element'
import { NodeElement } from './node'
import type { NodeEvent } from './node'

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
  | 'start'
  | 'start-at-end'
  | 'end'
  | 'end-at-start'
  | 'screen-center'
  | 'screen-end'
  | 'screen-start'

export type VerticalFrom =
  | 'screen-bottom'
  | 'screen-center'
  | 'screen-top'

export type VerticalTo =
  | 'bottom'
  | 'bottom-at-top'
  | 'center'
  | 'top'
  | 'top-at-bottom'
  | 'screen-bottom'
  | 'screen-center'
  | 'screen-top'

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
  public static styles: CSSResult[] = [
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

  @property({
    type: Number
  })
  public duration?: number

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

  public originElement?: HTMLElement | null

  public get assignedElement (): HTMLElement | undefined {
    return this.defaultSlotElement
      ?.assignedElements()
      .pop() as HTMLElement
  }

  protected handleClickBound: (event: Event) => void

  protected handleHideBound: (event: NodeEvent) => void

  protected handleResizeBound: () => void

  protected handleScrollBound: () => void

  protected handleShowBound: (event: NodeEvent) => void

  public constructor () {
    super()
    this.dir = document.dir
    this.handleClickBound = this.handleClick.bind(this)
    this.handleHideBound = this.handleHide.bind(this)
    this.handleResizeBound = this.handleResize.bind(this)
    this.handleScrollBound = this.handleScroll.bind(this)
    this.handleShowBound = this.handleShow.bind(this)
    this.addEventListener('scola-dialog-hide', this.handleHideBound)
    this.addEventListener('scola-dialog-show', this.handleShowBound)
  }

  public connectedCallback (): void {
    this.originElement = this.parentElement
    window.addEventListener('scola-dialog-hide', this.handleHideBound)
    window.addEventListener('scola-dialog-show', this.handleShowBound)
    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    window.removeEventListener('scola-dialog-hide', this.handleHideBound)
    window.removeEventListener('scola-dialog-show', this.handleShowBound)
    super.disconnectedCallback()
  }

  public hide (duration = this.duration): void {
    window.removeEventListener('click', this.handleClickBound)
    window.removeEventListener('resize', this.handleResizeBound)
    window.removeEventListener('scola-scroll', this.handleScrollBound)

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

    const {
      left = '0',
      top = '0'
    } = this.assignedElement instanceof HTMLElement
      ? window.getComputedStyle(this.assignedElement)
      : {}

    const toPosition = {
      left: parseFloat(left),
      top: parseFloat(top)
    }

    const fromPosition = from.horizontal === undefined
      ? toPosition
      : this.calculateFromPosition(from)

    const easings = [
      this.easePosition(toPosition, fromPosition, duration)
    ]

    if (this.isSame(toPosition, fromPosition)) {
      easings.push(this.easeOpacity(1, 0, duration))
    }

    Promise
      .all(easings)
      .then(() => {
        this.originElement?.appendChild(this)
        this.toggleAttribute('hidden', true)
      })
      .catch(() => {})
  }

  public show (duration = this.duration): void {
    if (!this.hidden) {
      return
    }

    document
      .querySelector<AppElement>('scola-app')
      ?.shadowRoot
      ?.appendChild(this)

    this.toggleAttribute('hidden', false)

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

    const fromPosition = from.horizontal === undefined || from.vertical === undefined
      ? toPosition
      : this.calculateFromPosition(from)

    const easings = [
      this.easePosition(fromPosition, toPosition, duration)
    ]

    if (this.isSame(toPosition, fromPosition)) {
      easings.push(this.easeOpacity(0, 1, duration))
    }

    Promise
      .all(easings)
      .then(() => {
        window.addEventListener('click', this.handleClickBound)
        window.addEventListener('resize', this.handleResizeBound)
        window.addEventListener('scola-scroll', this.handleScrollBound)
      })
      .catch(() => {})
  }

  protected calculateFromPosition (from: DialogFrom): DialogPosition {
    const {
      height: appHeight = Infinity,
      width: appWidth = Infinity
    } = document
      .querySelector<AppElement>('scola-app')
      ?.getBoundingClientRect() ?? {}

    const {
      height: elementHeight = 0,
      width: elementWidth = 0
    } = this.assignedElement
      ?.getBoundingClientRect() ?? {}

    let left = 0
    let top = 0

    switch (from.horizontal) {
      case 'screen-center':
        left = (appWidth - elementWidth) / 2
        break
      case 'screen-end':
        left += this.dir === 'rtl'
          ? -elementWidth
          : appWidth + elementWidth
        break
      case 'screen-start':
        left += this.dir === 'rtl'
          ? appWidth + elementWidth
          : -elementWidth
        break
      default:
        break
    }

    switch (from.vertical) {
      case 'screen-bottom':
        top += appHeight + elementHeight
        break
      case 'screen-center':
        top = (appHeight - elementHeight) / 2
        break
      case 'screen-top':
        top += -elementHeight
        break
      default:
        break
    }

    return {
      left,
      top
    }
  }

  protected calculateToPosition (to: DialogTo): DialogPosition {
    const {
      height: appHeight = Infinity,
      width: appWidth = Infinity
    } = document
      .querySelector<AppElement>('scola-app')
      ?.getBoundingClientRect() ?? {}

    const {
      height: elementHeight = 0,
      width: elementWidth = 0
    } = this.assignedElement
      ?.getBoundingClientRect() ?? {}

    const {
      height: anchorHeight = 0,
      left: anchorLeft = 0,
      top: anchorTop = 0,
      width: anchorWidth = 0
    } = this.anchorElement
      ?.getBoundingClientRect() ?? {}

    let left = anchorLeft
    let top = anchorTop + anchorHeight

    switch (to.horizontal) {
      case 'center':
        left += -(elementWidth - anchorWidth) / 2
        break
      case 'start':
        left += this.dir === 'rtl'
          ? -elementWidth + anchorWidth
          : 0
        break
      case 'start-at-end':
        left += this.dir === 'rtl'
          ? -elementWidth
          : anchorWidth
        break
      case 'end':
        left += this.dir === 'rtl'
          ? 0
          : -elementWidth + anchorWidth
        break
      case 'end-at-start':
        left += this.dir === 'rtl'
          ? anchorWidth
          : -elementWidth
        break
      case 'screen-center':
        left = (appWidth - elementWidth) / 2
        break
      case 'screen-end':
        left = this.dir === 'rtl'
          ? 0
          : appWidth - elementWidth
        break
      case 'screen-start':
        left = this.dir === 'rtl'
          ? appWidth - elementWidth
          : 0
        break
      default:
        break
    }

    switch (to.vertical) {
      case 'bottom':
        top += -elementHeight
        break
      case 'bottom-at-top':
        top += -elementHeight - anchorHeight
        break
      case 'center':
        top += -(elementHeight + anchorHeight) / 2
        break
      case 'top':
        top += -anchorHeight
        break
      case 'top-at-bottom':
        break
      case 'screen-bottom':
        top = appHeight - elementHeight
        break
      case 'screen-center':
        top = (appHeight - elementHeight) / 2
        break
      case 'screen-top':
        top = 0
        break
      default:
        break
    }

    return {
      left,
      top
    }
  }

  protected async easeOpacity (from: number, to: number, duration?: number): Promise<unknown> {
    const { assignedElement } = this

    return await new Promise<unknown>((resolve) => {
      this.ease(from, to, ({ done, value }) => {
        assignedElement?.style.setProperty('opacity', `${value}`)

        if (done) {
          resolve(done)
        }
      }, {
        duration,
        name: 'opacity'
      })
    })
  }

  protected async easePosition (
    from: DialogPosition,
    to: DialogPosition,
    duration?: number
  ): Promise<unknown> {
    const { assignedElement } = this

    const leftPromise = new Promise<unknown>((resolve) => {
      this.ease(from.left, to.left, ({ done, value }) => {
        assignedElement?.style.setProperty('left', `${value}px`)

        if (done) {
          resolve(done)
        }
      }, {
        duration,
        name: 'left'
      })
    })

    const topPromise = new Promise<unknown>((resolve) => {
      this.ease(from.top, to.top, ({ done, value }) => {
        assignedElement?.style.setProperty('top', `${value}px`)

        if (done) {
          resolve(done)
        }
      }, {
        duration,
        name: 'top'
      })
    })

    return Promise.all([leftPromise, topPromise])
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
      return position.left >= 0 && position.left + elementWidth <= appWidth
    })

    vtoAlternatives[to.vertical ?? 'center'].some((vto: VerticalTo): boolean => {
      to.vertical = vto
      position = this.calculateToPosition(to)
      return position.top >= 0 && position.top + elementHeight <= appHeight
    })

    return position
  }

  protected handleClick (event: Event): void {
    if (
      this.assignedElement instanceof HTMLElement &&
      !event.composedPath().includes(this.assignedElement) &&
      this.locked !== true
    ) {
      this.hide()
    }
  }

  protected handleHide (event: NodeEvent): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true
      this.hide()
    }
  }

  protected handleResize (): void {
    this.show()
  }

  protected handleScroll (): void {
    this.hide()
  }

  protected handleShow (event: NodeEvent): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true
      this.anchorElement = event.detail?.origin
      this.show()
    }
  }

  protected isSame (from: DialogPosition, to: DialogPosition): boolean {
    return from.left === to.left && from.top === to.top
  }
}
