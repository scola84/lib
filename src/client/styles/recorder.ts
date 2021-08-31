import { css } from 'lit'

export default css`
  slot:not([name])::slotted(*) {
    width: 100%;
  }

  :host(:not([back])) slot:not([name])::slotted(*) {
    transform: scaleX(-1);
  }
`
