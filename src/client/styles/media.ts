import { css } from 'lit'

export default css`
  slot:not([name])::slotted(*) {
    max-width: 100%;
  }
`
