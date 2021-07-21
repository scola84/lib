import type { CSSResultGroup, TemplateResult } from 'lit'
import { css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { NodeElement } from './node'
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
    css`
      :host([rtl][dir="rtl"]) {
        transform: scaleX(-1)
      }

      slot:not([name]) > svg,
      slot:not([name])::slotted(:not(i)) {
        fill: currentColor;
      }

      :host([size="large"]:not([name])) slot[name="body"],
      :host([size="large"]) slot:not([name]) > *,
      :host([size="large"]) slot:not([name])::slotted(:not(i)) {
        height: 2.25rem;
        width: 2.25rem;
      }

      :host([size="medium"]:not([name])) slot[name="body"],
      :host([size="medium"]) slot:not([name]) > *,
      :host([size="medium"]) slot:not([name])::slotted(:not(i)) {
        height: 1.75rem;
        width: 1.75rem;
      }

      :host([size="small"]:not([name])) slot[name="body"],
      :host([size="small"]) slot:not([name]) > *,
      :host([size="small"]) slot:not([name])::slotted(:not(i)) {
        height: 1.25rem;
        width: 1.25rem;
      }

      :host([size="large"]) slot:not([name])::slotted(i) {
        font-size: 2.25rem;
      }

      :host([size="medium"]) slot:not([name])::slotted(i) {
        font-size: 1.75rem;
      }

      :host([size="small"]) slot:not([name])::slotted(i) {
        font-size: 1.25rem;
      }
    `
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
