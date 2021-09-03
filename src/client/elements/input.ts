import { FieldElement } from './field'
import type { PropertyValues } from 'lit'
import { customElement } from 'lit/decorators.js'
import styles from '../styles/input'

declare global {
  interface HTMLElementTagNameMap {
    'scola-input': InputElement
  }
}

@customElement('scola-input')
export class InputElement extends FieldElement {
  public static styles = [
    ...FieldElement.styles,
    styles
  ]

  public fieldElement: HTMLInputElement

  protected updaters = InputElement.updaters

  public firstUpdated (properties: PropertyValues): void {
    const fieldElement = this.fieldElement.cloneNode(true)

    if (fieldElement instanceof HTMLInputElement) {
      this.fieldElement = fieldElement
      this.bodySlotElement.insertBefore(fieldElement, this.suffixSlotElement)
    }

    super.firstUpdated(properties)
  }
}
