import { css } from 'lit'

export default css`
  input[type="checkbox"],
  input[type="color"],
  input[type="date"],
  input[type="file"],
  input[type="radio"],
  input[type="time"] {
    appearance: none;
    margin: 0;
    opacity: 0;
    padding: 0;
    position: absolute;
    width: 0;
    z-index: -1;
  }

  input[type="date"],
  input[type="time"] {
    height: 100%;
    width: 100%;
    z-index: 0;
  }

  input[type="date"]::-webkit-calendar-picker-indicator,
  input[type="time"]::-webkit-calendar-picker-indicator {
    cursor: inherit;
    height: 100%;
    margin: 0;
    opacity: 0;
    padding: 0;
    position: absolute;
    width: 100%;
  }
`
