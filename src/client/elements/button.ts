import type { CSSResultGroup, PropertyValues } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { ClipElement } from './clip'
import { NodeElement } from './node'
import type { ProgressElement } from './progress'
import type { RequestElement } from './request'
import type { SourceElement } from './source'
import type { ViewElement } from './view'
import { css } from 'lit'

declare global {
  interface HTMLElementTagNameMap {
    'scola-button': ButtonElement
  }
}

interface ButtonState extends Record<string, unknown> {
  activated?: boolean
}

@customElement('scola-button')
export class ButtonElement extends NodeElement {
  public static storage: Storage = window.sessionStorage

  public static styles: CSSResultGroup[] = [
    ...NodeElement.styles,
    css`
      :host,
      ::slotted(*) {
        cursor: pointer;
      }

      :host([started]:not([event="scola-request-toggle"])) {
        pointer-events: none;
      }

      :host([activated][color-activated="aux-1"]) slot[name="body"] {
        color: var(--scola-button-color-activated-aux-1, #000);
      }

      :host([activated][color-activated="aux-2"]) slot[name="body"] {
        color: var(--scola-button-color-activated-aux-2, #777);
      }

      :host([activated][color-activated="aux-3"]) slot[name="body"] {
        color: var(--scola-button-color-activated-aux-3, #fff);
      }

      :host([activated][color-activated="sig-1"]) slot[name="body"] {
        color: var(--scola-button-color-activated-sig-1, #b22222);
      }

      :host([activated][color-activated="sig-2"]) slot[name="body"] {
        color: var(--scola-button-color-activated-sig-2, #008000);
      }

      :host([activated][fill-activated="aux-1"]) slot[name="body"] {
        background: var(--scola-button-fill-activated-aux-1, #eee);
      }

      :host([activated][fill-activated="aux-2"]) slot[name="body"] {
        background: var(--scola-button-fill-activated-aux-2, #ddd);
      }

      :host([activated][fill-activated="aux-3"]) slot[name="body"] {
        background: var(--scola-button-fill-activated-aux-3, #ccc);
      }

      :host([activated][fill-activated="sig-1"]) slot[name="body"] {
        background: var(--scola-button-fill-activated-sig-1, #b22222);
      }

      :host([activated][fill-activated="sig-2"]) slot[name="body"] {
        background: var(--scola-button-fill-activated-sig-2, #008000);
      }

      slot:not([name])::slotted([is="abort"]),
      slot:not([name])::slotted([is="progress"]),
      slot:not([name])::slotted([is="start"]) {
        opacity: 0;
      }

      :host(:not([started])) slot:not([name])::slotted([is="start"]),
      :host([started]) slot:not([name])::slotted([is="abort"]),
      :host([started]) slot:not([name])::slotted([is="progress"]) {
        opacity: 1;
      }
    `
  ]

  public static updaters = {
    ...NodeElement.updaters,
    'scola-clip-content': (source: ButtonElement, target: NodeElement, properties: PropertyValues): void => {
      if (properties.has('hidden')) {
        source.activated = !target.hidden
      } else if (target.parentElement instanceof ClipElement) {
        if (source.activated === true) {
          target.parentElement.showContent(target, 0).catch(() => {})
        } else if (source.activated === false) {
          target.parentElement.hideContent(target).catch(() => {})
        }
      }
    },
    'scola-clip-content-or-inner': (source: ButtonElement, target: NodeElement, properties: PropertyValues): void => {
      if (properties.has('hidden')) {
        source.activated = !target.hidden
      } else if (target.parentElement instanceof ClipElement) {
        if (source.activated === true) {
          target.parentElement.showContentOrInner(target, 0).catch(() => {})
        }
      }
    },
    'scola-clip-inner': (source: ButtonElement, target: ClipElement, properties: PropertyValues): void => {
      if (properties.has('innerHidden')) {
        source.activated = target.innerHidden === false
      } else if (source.activated === true) {
        target.showInner(0).catch(() => {})
      } else if (source.activated === false) {
        target.hideInner(0).catch(() => {})
      }
    },
    'scola-clip-nested': (source: ButtonElement, target: ClipElement, properties: PropertyValues): void => {
      if (properties.has('innerHidden')) {
        source.activated = target.innerHidden === false
      } else if (target.parentElement instanceof ClipElement) {
        if (source.activated === true) {
          target.parentElement.toggleNested(target, 0).catch(() => {})
        }
      }
    },
    'scola-clip-outer': (source: ButtonElement, target: NodeElement, properties: PropertyValues): void => {
      if (properties.has('hidden')) {
        source.activated = !target.hidden
      } else if (target.parentElement instanceof ClipElement) {
        if (source.activated === true) {
          target.parentElement.showOuter(target, 0).catch(() => {})
        } else if (source.activated === false) {
          target.parentElement.hideOuter(target, 0).catch(() => {})
        }
      }
    },
    'scola-progress': (source: ButtonElement, target: ProgressElement): void => {
      source.started = target.started
    },
    'scola-request': (source: ButtonElement, target: RequestElement): void => {
      source.started = target.started
    },
    'scola-source': (source: ButtonElement, target: SourceElement): void => {
      if (source.isObject(target.data)) {
        source.data = target.data
      }
    },
    'scola-view-back': (source: ButtonElement, target: ViewElement): void => {
      source.disabled = !target.hasPast
    },
    'scola-view-forward': (source: ButtonElement, target: ViewElement): void => {
      source.disabled = !target.hasFuture
    },
    'scola-view-home': (source: ButtonElement, target: ViewElement): void => {
      source.disabled = !target.hasPast
    }
  }

  @property({
    reflect: true,
    type: Boolean
  })
  public activated?: boolean

  @property({
    type: Boolean
  })
  public cancel?: boolean

  @property({
    attribute: 'color-activated',
    reflect: true
  })
  public colorActivated?: 'aux-1' | 'aux-2' | 'aux-3' | 'sig-1' | 'sig-2'

  @property({
    attribute: false
  })
  public data?: Record<string, unknown>

  @property({
    attribute: 'fill-activated',
    reflect: true
  })
  public fillActivated?: 'aux-1' | 'aux-2' | 'aux-3' | 'sig-1' | 'sig-2'

  @property({
    type: Boolean
  })
  public save?: boolean

  @property({
    reflect: true,
    type: Boolean
  })
  public started?: boolean

  protected storage = ButtonElement.storage

  protected updaters = ButtonElement.updaters

  public connectedCallback (): void {
    if (this.save === true) {
      this.loadState()
    }

    super.connectedCallback()
  }

  public firstUpdated (properties: PropertyValues): void {
    this.addEventListener('click', this.handleClick.bind(this))
    super.firstUpdated(properties)
  }

  public updated (properties: PropertyValues): void {
    if (this.save === true) {
      this.saveState()
    }

    super.updated(properties)
  }

  protected handleClick (event: Event): void {
    event.cancelBubble = this.cancel === true
    this.dispatchEvents(this.data)
  }

  protected loadState (): void {
    const stateString = this.storage.getItem(this.id)

    if (stateString === null) {
      return
    }

    const state: unknown = JSON.parse(stateString)

    if (this.isObject<ButtonState>(state)) {
      this.activated = state.activated
    }
  }

  protected saveState (): void {
    const state = {
      activated: this.activated
    }

    this.storage.setItem(this.id, JSON.stringify(state))
  }
}
