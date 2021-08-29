import type { CSSResultGroup, PropertyValues } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { NodeElement } from './node'
import type { Struct } from '../../common'
import { isStruct } from '../../common'
import styles from '../styles/button'
import updaters from '../updaters/button'

declare global {
  interface HTMLElementTagNameMap {
    'scola-button': ButtonElement
  }
}

@customElement('scola-button')
export class ButtonElement extends NodeElement {
  public static storage: Storage = window.sessionStorage

  public static styles: CSSResultGroup[] = [
    ...NodeElement.styles,
    styles
  ]

  public static updaters = {
    ...NodeElement.updaters,
    ...updaters
  }

  @property({
    reflect: true,
    type: Boolean
  })
  public activated?: boolean

  @property({
    reflect: true,
    type: Boolean
  })
  public busy?: boolean

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
    attribute: 'fill-activated',
    reflect: true
  })
  public fillActivated?: 'aux-1' | 'aux-2' | 'aux-3' | 'sig-1' | 'sig-2'

  @property({
    type: Boolean
  })
  public save?: boolean

  @property({
    attribute: false
  })
  public storage = ButtonElement.storage

  @property({
    reflect: true,
    type: Boolean
  })
  public toggle?: boolean

  public cursor: NodeElement['cursor'] = 'pointer'

  protected updaters = ButtonElement.updaters

  public connectedCallback (): void {
    if (this.save === true) {
      this.loadState()
    }

    super.connectedCallback()
  }

  public update (properties: PropertyValues): void {
    if (this.save === true) {
      this.saveState()
    }

    super.update(properties)
  }

  protected createEventData (): Struct {
    const data = {
      ...this.dataset
    }

    if (isStruct(this.data)) {
      Object.assign(data, this.data)
    }

    return data
  }

  protected handleClick (event: Event): void {
    event.cancelBubble = this.cancel === true
    this.dispatchEvents(this.createEventData())
  }

  protected loadState (): void {
    const state: unknown = JSON.parse(this.storage.getItem(`button-${this.id}`) ?? 'null')

    if (isStruct(state)) {
      if (typeof state.activated === 'boolean') {
        this.activated = state.activated
      }
    }
  }

  protected saveState (): void {
    const state = {
      activated: this.activated
    }

    this.storage.setItem(`button-${this.id}`, JSON.stringify(state))
  }

  protected setUpElementListeners (): void {
    this.addEventListener('click', this.handleClick.bind(this))
    super.setUpElementListeners()
  }
}
