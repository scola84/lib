import { css } from 'lit'

export default css`
  :host([busy]:not([toggle])) {
    pointer-events: none;
  }

  :host([color-activated="aux-1"][activated]) slot[name="body"] {
    color: var(--scola-button-color-activated-aux-1, #000);
  }

  :host([color-activated="aux-2"][activated]) slot[name="body"] {
    color: var(--scola-button-color-activated-aux-2, #777);
  }

  :host([color-activated="aux-3"][activated]) slot[name="body"] {
    color: var(--scola-button-color-activated-aux-3, #fff);
  }

  :host([color-activated="sig-1"][activated]) slot[name="body"] {
    color: var(--scola-button-color-activated-sig-1, #b22222);
  }

  :host([color-activated="sig-2"][activated]) slot[name="body"] {
    color: var(--scola-button-color-activated-sig-2, #008000);
  }

  :host([fill-activated="aux-1"][activated]) slot[name="body"] {
    background: var(--scola-button-fill-activated-aux-1, #eee);
  }

  :host([fill-activated="aux-2"][activated]) slot[name="body"] {
    background: var(--scola-button-fill-activated-aux-2, #ddd);
  }

  :host([fill-activated="aux-3"][activated]) slot[name="body"] {
    background: var(--scola-button-fill-activated-aux-3, #ccc);
  }

  :host([fill-activated="sig-1"][activated]) slot[name="body"] {
    background: var(--scola-button-fill-activated-sig-1, #b22222);
  }

  :host([fill-activated="sig-2"][activated]) slot[name="body"] {
    background: var(--scola-button-fill-activated-sig-2, #008000);
  }

  slot:not([name])::slotted([as="abort"]),
  slot:not([name])::slotted([as="progress"]),
  slot:not([name])::slotted([as="start"]) {
    opacity: 0;
  }

  :host(:not([busy])) slot:not([name])::slotted([as="start"]),
  :host([busy]) slot:not([name])::slotted([as="abort"]),
  :host([busy]) slot:not([name])::slotted([as="progress"]) {
    opacity: 1;
  }
`
