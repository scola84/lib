import { css } from 'lit'

export default css`
  input {
    display: none;
  }

  :host([switch]) input[type="range"] {
    border-radius: 0.875rem;
    box-sizing: border-box;
    display: inline-flex;
    height: 1.75rem;
    margin: 0;
    opacity: 1;
    padding: 0.125rem;
    pointer-events: none;
    transition: background 250ms cubic-bezier(0.83, 0, 0.17, 1);
    width: 2.75rem;
    -moz-appearance: none;
    -webkit-appearance: none;
  }

  :host([fill="aux-1"]) input[type="range"] {
    background: var(--scola-select-fill-aux-1, #ddd);
  }

  :host([fill="aux-2"]) input[type="range"] {
    background: var(--scola-select-fill-aux-2, #ccc);
  }

  :host([fill="aux-3"]) input[type="range"] {
    background: var(--scola-select-fill-aux-3, #bbb);
  }

  :host([checked]) input[type="range"] {
    background: var(--scola-select-fill-checked, #000);
  }

  :host([checked][fill-checked="sig-1"]) input[type="range"] {
    background: var(--scola-select-fill-checked-sig-1, #b22222);
  }

  :host([checked][fill-checked="sig-2"]) input[type="range"] {
    background: var(--scola-select-fill-checked-sig-2, #008000);
  }

  input[type="range"]::-moz-range-thumb {
    background: var(--scola-select-fill-thumb, #fff);
    border: none;
    border-radius: 50%;
    box-shadow: 0 0 0.25rem rgba(0, 0, 0, 0.25);
    height: 1.5rem;
    width: 1.5rem;
    -moz-appearance: none;
    -webkit-appearance: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    background: var(--scola-select-fill-thumb, #fff);
    border: none;
    border-radius: 50%;
    box-shadow: 0 0 0.25rem rgba(0, 0, 0, 0.25);
    height: 1.5rem;
    width: 1.5rem;
    -moz-appearance: none;
    -webkit-appearance: none;
  }

  slot[name="after"]::slotted([as="off"]),
  slot[name="before"]::slotted([as="off"]),
  slot[name="after"]::slotted([as="on"]),
  slot[name="before"]::slotted([as="on"]) {
    display: none;
  }

  :host(:not([checked])) slot[name="after"]::slotted([as="off"]),
  :host(:not([checked])) slot[name="before"]::slotted([as="off"]),
  :host([checked]) slot[name="after"]::slotted([as="on"]),
  :host([checked]) slot[name="before"]::slotted([as="on"]) {
    display: inline-flex;
  }
`
