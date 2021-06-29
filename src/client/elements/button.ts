import type { CSSResultGroup, PropertyValues } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { ClipElement } from './clip'
import { NodeElement } from './node'
import type { NodeEvent } from './node'
import { ProgressElement } from './progress'
import { RequestElement } from './request'
import { ViewElement } from './view'
import { css } from 'lit'

declare global {
  interface HTMLElementTagNameMap {
    'scola-button': ButtonElement
  }
}

@customElement('scola-button')
export class ButtonElement extends NodeElement {
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

  @property()
  public event?: string

  @property({
    attribute: 'fill-activated',
    reflect: true
  })
  public fillActivated?: 'aux-1' | 'aux-2' | 'aux-3' | 'sig-1' | 'sig-2'

  @property({
    reflect: true,
    type: Boolean
  })
  public started?: boolean

  @property()
  public target?: string

  public constructor () {
    super()
    this.addEventListener('click', this.handleClick.bind(this))
  }

  public connectedCallback (): void {
    if (this.observe === '') {
      this.observe = this.target
    }

    this.observe?.split(' ').forEach((id) => {
      const element = document.getElementById(id)

      if (element?.parentElement instanceof ClipElement) {
        this.toggleClip(element)
      } else if (element instanceof ProgressElement) {
        this.toggleProgress(element)
      } else if (element instanceof RequestElement) {
        this.toggleRequest(element)
      } else if (element instanceof ViewElement) {
        this.toggleView(element)
      }
    })

    super.connectedCallback()
  }

  public observedUpdated (properties: PropertyValues, target: NodeElement): void {
    if (target.parentElement instanceof ClipElement) {
      this.observedUpdatedClip(properties, target)
    } else if (target instanceof ProgressElement) {
      this.observedUpdatedProgress(properties, target)
    } else if (target instanceof RequestElement) {
      this.observedUpdatedRequest(properties, target)
    } else if (target instanceof ViewElement) {
      this.observedUpdatedView(properties, target)
    }

    super.observedUpdated(properties, target)
  }

  public toggleClip (element: HTMLElement): void {
    this.activated = !element.hidden
  }

  public toggleProgress (element: ProgressElement): void {
    this.started = element.started
  }

  public toggleRequest (element: RequestElement): void {
    this.started = element.started
  }

  public toggleView (element: ViewElement): void {
    switch (this.event) {
      case 'scola-view-back':
        this.disabled = !element.hasPast
        break
      case 'scola-view-forward':
        this.disabled = !element.hasFuture
        break
      case 'scola-view-home':
        this.disabled = !element.hasPast
        break
      default:
        break
    }
  }

  protected handleClick (event: Event): void {
    event.cancelBubble = this.cancel === true

    const targets = this.target?.split(' ') ?? []

    this.event?.split(' ').forEach((type, index) => {
      this.dispatchEvent(new CustomEvent<NodeEvent['detail']>(type, {
        bubbles: true,
        composed: true,
        detail: {
          ...this.dataset,
          ...this.data,
          origin: this,
          target: targets[index]
        }
      }))
    })
  }

  protected observedUpdatedClip (properties: PropertyValues, target: NodeElement): void {
    this.toggleClip(target)
  }

  protected observedUpdatedProgress (properties: PropertyValues, target: ProgressElement): void {
    this.toggleProgress(target)
  }

  protected observedUpdatedRequest (properties: PropertyValues, target: RequestElement): void {
    this.toggleRequest(target)
  }

  protected observedUpdatedView (properties: PropertyValues, target: ViewElement): void {
    this.toggleView(target)
  }
}
