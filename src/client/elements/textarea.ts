import type { CSSResultGroup, PropertyValues } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { FieldElement } from './field'
import styles from '../styles/textarea'

declare global {
  interface HTMLElementTagNameMap {
    'scola-textarea': TextAreaElement
  }
}

@customElement('scola-textarea')
export class TextAreaElement extends FieldElement {
  public static styles: CSSResultGroup[] = [
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

  public fieldElement: HTMLTextAreaElement

  protected updaters = TextAreaElement.updaters

  public firstUpdated (properties: PropertyValues): void {
    const fieldElement = this.fieldElement.cloneNode(true)

    if (fieldElement instanceof HTMLTextAreaElement) {
      this.fieldElement = fieldElement
      this.bodySlotElement.insertBefore(fieldElement, this.suffixSlotElement)
    }

    if (this.resize === 'auto') {
      this.resizeFieldElement()
    }

    super.firstUpdated(properties)
  }

  protected handleInput (): void {
    if (this.resize === 'auto') {
      this.resizeFieldElement()
    }

    super.handleInput()
  }

  protected resizeFieldElement (): void {
    this.fieldElement.style.setProperty('height', '0px')
    this.fieldElement.style.setProperty('height', `${Math.min(this.resizeMax, this.fieldElement.scrollHeight)}px`)
  }
}
