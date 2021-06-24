import type { PropertyValues, TemplateResult } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { NodeElement } from './node'
import type { ViewElement } from './view'
import { html } from 'lit'

declare global {
  interface HTMLElementTagNameMap {
    'scola-title': TitleElement
  }
}

@customElement('scola-title')
export class TitleElement extends NodeElement {
  @property()
  public value?: string

  public connectedCallback (): void {
    window.requestAnimationFrame(() => {
      this.observe?.split(' ').forEach((id) => {
        this.value = document.getElementById(id)?.title
      })
    })

    super.connectedCallback()
  }

  public observedUpdated (properties: PropertyValues, target: ViewElement): void {
    if (properties.has('title')) {
      this.value = target.title
    }

    super.observedUpdated(properties, target)
  }

  public render (): TemplateResult {
    return html`
      <slot name="body">
        <slot>${this.value}</slot>
      </slot>
    `
  }
}
