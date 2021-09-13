import { css } from 'lit'

export default css`
  slot:not([name])::slotted(audio:not([autoplay]):empty),
  slot:not([name])::slotted(picture:empty),
  slot:not([name])::slotted(video:not([autoplay]):empty) {
    display: none;
  }

  slot:not([name])::slotted(picture:not(:empty)) {
    align-items: center;
    display: flex;
    justify-content: center;
  }
`
