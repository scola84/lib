import { customElement, property } from 'lit/decorators.js'
import type { CSSResultGroup } from 'lit'
import { ClipElement } from './clip'
import type { DialogElement } from './dialog'
import styles from '../styles/app'

declare global {
  interface HTMLElementTagNameMap {
    'scola-app': AppElement
  }
}

@customElement('scola-app')
export class AppElement extends ClipElement {
  public static styles: CSSResultGroup[] = [
    ...ClipElement.styles,
    styles
  ]

  @property({
    reflect: true
  })
  public scheme: 'dark' | 'light' | 'system'

  @property({
    reflect: true
  })
  public theme: string

  public flow: ClipElement['flow'] = 'row'

  public height: ClipElement['height'] = 'max'

  public mode: ClipElement['mode'] = 'outer'

  public width: ClipElement['width'] = 'max'

  protected updaters = AppElement.updaters

  protected get hasDialogs (): boolean {
    return this.shadowRoot?.querySelector<DialogElement>('scola-dialog') !== null
  }

  protected handleClick (event: Event): void {
    if (!this.hasDialogs) {
      super.handleClick(event)
    }
  }
}
