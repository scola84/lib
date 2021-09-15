import { css } from 'lit'

export default css`
  :host(:not([dragging])) ::slotted([as="scrim"]) {
    display: none;
  }
`
