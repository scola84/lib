import { css } from 'lit'

export default css`
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
`
