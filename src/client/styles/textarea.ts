import { css } from 'lit'

export default css`
  textarea {
    background: none;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    color: inherit;
    cursor: inherit;
    font-family: inherit;
    font-size: inherit;
    height: 100%;
    line-height: inherit;
    margin: 0;
    outline: none;
    padding: 0;
    width: 100%;
    -moz-appearance: textfield-multiline;
    -webkit-appearance: textfield-multiline;
  }

  :host([resize="auto"]) textarea,
  :host([resize="none"]) textarea {
    resize: none;
  }

  :host([resize="both"]) textarea {
    resize: both;
  }

  :host([resize="horizontal"]) textarea {
    resize: horizontal;
  }

  :host([resize="vertical"]) textarea {
    resize: vertical;
  }

  textarea::placeholder {
    color: inherit;
    opacity: 0.35;
  }

  slot::slotted([hidden]) {
    display: none;
  }

  slot:not([name])::slotted(textarea) {
    appearance: none;
    border: 0;
    margin: 0;
    opacity: 0;
    padding: 0;
    position: absolute;
    width: 0;
    z-index: -1;
  }
`
