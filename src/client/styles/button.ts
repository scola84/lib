import { css } from 'lit'

export default css`
  :host([busy]:not([toggle])) {
    pointer-events: none;
  }

  :host([activated][color-activated="aux-1"]) slot[name="body"] {
    color: var(--scola-button-color-activated-aux-1, #000);
  }

  :host([activated][color-activated="aux-2"]) slot[name="body"] {
    color: var(--scola-button-color-activated-aux-2, #777);
  }

  :host([activated][color-activated="aux-3"]) slot[name="body"] {
    color: var(--scola-button-color-activated-aux-3, #fff);
  }

  :host([activated][color-activated="sig-1"]) slot[name="body"] {
    color: var(--scola-button-color-activated-sig-1, #b22222);
  }

  :host([activated][color-activated="sig-2"]) slot[name="body"] {
    color: var(--scola-button-color-activated-sig-2, #008000);
  }

  :host([activated][fill-activated="aux-1"]) slot[name="body"] {
    background: var(--scola-button-fill-activated-aux-1, #eee);
  }

  :host([activated][fill-activated="aux-2"]) slot[name="body"] {
    background: var(--scola-button-fill-activated-aux-2, #ddd);
  }

  :host([activated][fill-activated="aux-3"]) slot[name="body"] {
    background: var(--scola-button-fill-activated-aux-3, #ccc);
  }

  :host([activated][fill-activated="sig-1"]) slot[name="body"] {
    background: var(--scola-button-fill-activated-sig-1, #b22222);
  }

  :host([activated][fill-activated="sig-2"]) slot[name="body"] {
    background: var(--scola-button-fill-activated-sig-2, #008000);
  }

  slot:not([name])::slotted([is="abort"]),
  slot:not([name])::slotted([is="progress"]),
  slot:not([name])::slotted([is="start"]) {
    opacity: 0;
  }

  :host(:not([busy])) slot:not([name])::slotted([is="start"]),
  :host([busy]) slot:not([name])::slotted([is="abort"]),
  :host([busy]) slot:not([name])::slotted([is="progress"]) {
    opacity: 1;
  }
`
