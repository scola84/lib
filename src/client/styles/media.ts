import { css } from 'lit'

export default css`
  :host([center]) slot:not([name])::slotted(img),
  :host([center]) slot:not([name])::slotted(video) {
    bottom: -100%;
    left: -100%;
    margin: auto;
    position: absolute;
    right: -100%;
    top: -100%;
  }

  :host([center][orientation="landscape"]) slot:not([name])::slotted(img),
  :host([center][orientation="landscape"]) slot:not([name])::slotted(video) {
    height: 100%;
  }

  :host([center][orientation="portrait"]) slot:not([name])::slotted(img),
  :host([center][orientation="portrait"]) slot:not([name])::slotted(video) {
    width: 100%;
  }
`
