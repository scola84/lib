import type { CSSResultGroup, TemplateResult } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { NodeElement } from './node'
import { html } from 'lit'
import styles from '../styles/icon'
import { unsafeSVG } from 'lit/directives/unsafe-svg.js'

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

  public static styles: CSSResultGroup[] = [
    ...NodeElement.styles,
    styles
  ]

  @property()
  public name?: keyof Icons

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

  public render (): TemplateResult {
    if (
      this.name !== undefined &&
      IconElement.icons[this.name] !== undefined
    ) {
      return html`
        <slot name="body">
          <slot>${unsafeSVG(IconElement.icons[this.name] ?? '')}</slot>
        </slot>
      `
    }

    return html`
      <slot name="body">
        <slot>
          <i></i>
        </slot>
      </slot>
    `
  }
}
