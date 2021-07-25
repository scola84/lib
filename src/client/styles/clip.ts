import { css } from 'lit'

export default css`
  slot[name="body"] slot[name] {
    z-index: 2;
  }

  :host([mode="content"]) slot:not([name])::slotted(*) {
    display: flex;
    flex: 0 0 100%;
    height: 100%;
    width: 100%;
  }

  :host([mode="content"][resize]) slot:not([name])::slotted([hidden]) {
    display: none;
  }

  :host([mode="outer"]) slot[name="after"]::slotted(*),
  :host([mode="outer"]) slot[name="before"]::slotted(*) {
    position: absolute;
    z-index: 2;
  }

  :host([mode="outer"][flow="column"]) slot[name="after"]::slotted(*) {
    bottom: 0;
  }

  :host([mode="outer"][flow="column"]) slot[name="before"]::slotted(*) {
    top: 0;
  }

  :host([mode="outer"][flow="row"]) slot[name="after"]::slotted(*) {
    right: 0;
  }

  :host([mode="outer"][flow="row"][dir="rtl"]) slot[name="after"]::slotted(*) {
    left: 0;
    right: auto;
  }

  :host([mode="outer"][flow="row"]) slot[name="before"]::slotted(*) {
    left: 0;
  }

  :host([mode="outer"][flow="row"][dir="rtl"]) slot[name="before"]::slotted(*) {
    left: auto;
    right: 0;
  }
`
