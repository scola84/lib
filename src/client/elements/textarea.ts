import { customElement, property } from 'lit/decorators.js'
import { FieldElement } from './field'
import type { PropertyValues } from 'lit'
import styles from '../styles/textarea'

declare global {
  interface HTMLElementTagNameMap {
    'scola-textarea': TextAreaElement
  }
}

@customElement('scola-textarea')
export class TextAreaElement extends FieldElement {
  public static styles = [
    ...FieldElement.styles,
    styles
  ]

  @property({
    reflect: true
  })
  public resize?: 'auto' | 'both' | 'horizontal' | 'vertical'

  @property({
    attribute: 'resize-max',
    type: Number
  })
  public resizeMax = Infinity

  public fieldElement: HTMLTextAreaElement | null

  protected updaters = TextAreaElement.updaters

  public firstUpdated (properties: PropertyValues): void {
    const fieldElement = this.fieldElement?.cloneNode(true)

    if (fieldElement instanceof HTMLTextAreaElement) {
      this.fieldElement = fieldElement
      this.bodySlotElement.insertBefore(fieldElement, this.suffixSlotElement)
    }

    if (this.resize === 'auto') {
      this.setStyle()
    }

    super.firstUpdated(properties)
  }

  protected handleInput (): void {
    if (this.resize === 'auto') {
      this.setStyle()
    }

    super.handleInput()
  }

  protected setStyle (): void {
    if (this.fieldElement instanceof HTMLTextAreaElement) {
      this.fieldElement.style.setProperty('height', '0px')
      this.fieldElement.style.setProperty('height', `${Math.min(this.resizeMax, this.fieldElement.scrollHeight)}px`)
    }
  }
}
