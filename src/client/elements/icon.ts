import { customElement, property } from 'lit/decorators.js'
import { NodeElement } from './node'
import type { PropertyValues } from 'lit'
import styles from '../styles/icon'

declare global {
  interface HTMLElementTagNameMap {
    'scola-icon': IconElement
  }
}

export interface Icons {
  ''?: string
}

@customElement('scola-icon')
export class IconElement extends NodeElement {
  public static icons: Icons = {}

  public static styles = [
    ...NodeElement.styles,
    styles
  ]

  @property()
  public name: keyof Icons

  @property({
    type: Boolean
  })
  public rtl?: boolean

  @property({
    reflect: true
  })
  public size?: 'large' | 'medium' | 'small'

  protected updaters = IconElement.updaters

  public constructor () {
    super()
    this.dir = document.dir
  }

  public update (properties: PropertyValues): void {
    this.setIcon()
    super.update(properties)
  }

  protected setIcon (): void {
    this.innerHTML = IconElement.icons[this.name] ?? ''
  }
}
