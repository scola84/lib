import { css } from 'lit'

export default css`
  input {
    background: none;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    color: inherit;
    cursor: inherit;
    font-family: inherit;
    font-size: inherit;
    outline: none;
    padding: 0;
    width: 100%;
    -moz-appearance: textfield;
    -webkit-appearance: textfield;
  }

  input::placeholder {
    color: inherit;
    opacity: 0.35;
  }

  input[type="search"]::-webkit-search-decoration,
  input[type="search"]::-webkit-search-cancel-button,
  input[type="search"]::-webkit-search-results-button,
  input[type="search"]::-webkit-search-results-decoration {
    display: none;
  }

  slot::slotted([hidden]) {
    display: none;
  }

  slot:not([name])::slotted(input) {
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
