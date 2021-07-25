import { css } from 'lit'

export default css`
  :host([rtl][dir="rtl"]) {
    transform: scaleX(-1);
  }

  slot:not([name]) > svg,
  slot:not([name])::slotted(:not(i)) {
    fill: currentColor;
  }

  :host([size="large"]:not([name])) slot[name="body"],
  :host([size="large"]) slot:not([name]) > *,
  :host([size="large"]) slot:not([name])::slotted(:not(i)) {
    height: 2.25rem;
    width: 2.25rem;
  }

  :host([size="medium"]:not([name])) slot[name="body"],
  :host([size="medium"]) slot:not([name]) > *,
  :host([size="medium"]) slot:not([name])::slotted(:not(i)) {
    height: 1.75rem;
    width: 1.75rem;
  }

  :host([size="small"]:not([name])) slot[name="body"],
  :host([size="small"]) slot:not([name]) > *,
  :host([size="small"]) slot:not([name])::slotted(:not(i)) {
    height: 1.25rem;
    width: 1.25rem;
  }

  :host([size="large"]) slot:not([name])::slotted(i) {
    font-size: 2.25rem;
  }

  :host([size="medium"]) slot:not([name])::slotted(i) {
    font-size: 1.75rem;
  }

  :host([size="small"]) slot:not([name])::slotted(i) {
    font-size: 1.25rem;
  }
`
