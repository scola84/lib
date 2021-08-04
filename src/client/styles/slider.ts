import { css } from 'lit'

export default css`
  slot:not([name]) {
    flex: none;
  }

  input {
    background: none;
    cursor: pointer;
    flex: 1;
    outline: none;
    -moz-appearance: none;
    -webkit-appearance: none;
    --range: calc(var(--max) - var(--min));
    --ratio: calc((var(--val) - var(--min)) / var(--range));
    --sx: calc(0.5 * 1.5em + var(--ratio) * (100% - 1.5em));
  }

  input::-moz-range-progress {
    background: var(--scola-slider-fill-progress, #000);
    border: none;
    border-radius: 0.125rem;
    height: 0.25rem;
    -moz-appearance: none;
    -webkit-appearance: none;
  }

  :host([fill-progress="sig-1"]) input::-moz-range-progress {
    background: var(--scola-slider-fill-progress-sig-1, #b22222);
  }

  :host([fill-progress="sig-2"]) input::-moz-range-progress {
    background: var(--scola-slider-fill-progress-sig-2, #008000);
  }

  input::-moz-range-thumb {
    background: var(--scola-slider-fill-thumb, #fff);
    border: none;
    border-radius: 50%;
    box-shadow: 0 0 0.25rem rgba(0, 0, 0, 0.25);
    cursor: move;
    height: 1.5rem;
    width: 1.5rem;
    -moz-appearance: none;
    -webkit-appearance: none;
  }

  input::-moz-range-track {
    border: none;
    border-radius: 0.125rem;
    height: 0.25rem;
    -moz-appearance: none;
    -webkit-appearance: none;
  }

  :host([fill="aux-1"]) input::-moz-range-track {
    background: var(--scola-slider-fill-track-aux-1, #ddd);
  }

  :host([fill="aux-2"]) input::-moz-range-track {
    background: var(--scola-slider-fill-track-aux-2, #ccc);
  }

  :host([fill="aux-3"]) input::-moz-range-track {
    background: var(--scola-slider-fill-track-aux-3, #bbb);
  }

  input::-webkit-slider-runnable-track {
    border: none;
    border-radius: 0.125rem;
    height: 0.25rem;
    -moz-appearance: none;
    -webkit-appearance: none;
  }

  :host([fill="aux-1"]) input::-webkit-slider-runnable-track {
    background: linear-gradient(
      to right,
      var(--scola-slider-fill-progress-sig-1, #000),
      var(--scola-slider-fill-progress-sig-1, #000) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ddd) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ddd)
    );
  }

  :host([fill="aux-1"][dir="rtl"]) input::-webkit-slider-runnable-track {
    background: linear-gradient(
      to left,
      var(--scola-slider-fill-progress-sig-1, #000),
      var(--scola-slider-fill-progress-sig-1, #000) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ddd) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ddd)
    );
  }

  :host([fill="aux-1"][fill-progress="sig-1"]) input::-webkit-slider-runnable-track {
    background: linear-gradient(
      to right,
      var(--scola-slider-fill-progress-sig-1, #b22222),
      var(--scola-slider-fill-progress-sig-1, #b22222) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ddd) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ddd)
    );
  }

  :host([fill="aux-1"][fill-progress="sig-1"][dir="rtl"]) input::-webkit-slider-runnable-track {
    background: linear-gradient(
      to left,
      var(--scola-slider-fill-progress-sig-1, #b22222),
      var(--scola-slider-fill-progress-sig-1, #b22222) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ddd) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ddd)
    );
  }

  :host([fill="aux-1"][fill-progress="sig-2"]) input::-webkit-slider-runnable-track {
    background: linear-gradient(
      to right,
      var(--scola-slider-fill-progress-sig-1, #008000),
      var(--scola-slider-fill-progress-sig-1, #008000) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ddd) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ddd)
    );
  }

  :host([fill="aux-1"][fill-progress="sig-2"][dir="rtl"]) input::-webkit-slider-runnable-track {
    background: linear-gradient(
      to left,
      var(--scola-slider-fill-progress-sig-1, #008000),
      var(--scola-slider-fill-progress-sig-1, #008000) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ddd) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ddd)
    );
  }

  :host([fill="aux-2"]) input::-webkit-slider-runnable-track {
    background: linear-gradient(
      to right,
      var(--scola-slider-fill-progress-sig-1, #000),
      var(--scola-slider-fill-progress-sig-1, #000) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ccc) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ccc)
    );
  }

  :host([fill="aux-2"][dir="rtl"]) input::-webkit-slider-runnable-track {
    background: linear-gradient(
      to left,
      var(--scola-slider-fill-progress-sig-1, #000),
      var(--scola-slider-fill-progress-sig-1, #000) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ccc) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ccc)
    );
  }

  :host([fill="aux-2"][fill-progress="sig-1"]) input::-webkit-slider-runnable-track {
    background: linear-gradient(
      to right,
      var(--scola-slider-fill-progress-sig-1, #b22222),
      var(--scola-slider-fill-progress-sig-1, #b22222) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ccc) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ccc)
    );
  }

  :host([fill="aux-2"][fill-progress="sig-1"][dir="rtl"]) input::-webkit-slider-runnable-track {
    background: linear-gradient(
      to left,
      var(--scola-slider-fill-progress-sig-1, #b22222),
      var(--scola-slider-fill-progress-sig-1, #b22222) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ccc) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ccc)
    );
  }

  :host([fill="aux-2"][fill-progress="sig-2"]) input::-webkit-slider-runnable-track {
    background: linear-gradient(
      to right,
      var(--scola-slider-fill-progress-sig-1, #008000),
      var(--scola-slider-fill-progress-sig-1, #008000) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ccc) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ccc)
    );
  }

  :host([fill="aux-2"][fill-progress="sig-2"][dir="rtl"]) input::-webkit-slider-runnable-track {
    background: linear-gradient(
      to left,
      var(--scola-slider-fill-progress-sig-1, #008000),
      var(--scola-slider-fill-progress-sig-1, #008000) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ccc) var(--sx),
      var(--scola-slider-fill-track-aux-1, #ccc)
    );
  }

  :host([fill="aux-3"]) input::-webkit-slider-runnable-track {
    background: linear-gradient(
      to right,
      var(--scola-slider-fill-progress-sig-1, #000),
      var(--scola-slider-fill-progress-sig-1, #000) var(--sx),
      var(--scola-slider-fill-track-aux-1, #bbb) var(--sx),
      var(--scola-slider-fill-track-aux-1, #bbb)
    );
  }

  :host([fill="aux-3"][dir="rtl"]) input::-webkit-slider-runnable-track {
    background: linear-gradient(
      to left,
      var(--scola-slider-fill-progress-sig-1, #000),
      var(--scola-slider-fill-progress-sig-1, #000) var(--sx),
      var(--scola-slider-fill-track-aux-1, #bbb) var(--sx),
      var(--scola-slider-fill-track-aux-1, #bbb)
    );
  }

  :host([fill="aux-3"][fill-progress="sig-1"]) input::-webkit-slider-runnable-track {
    background: linear-gradient(
      to right,
      var(--scola-slider-fill-progress-sig-1, #b22222),
      var(--scola-slider-fill-progress-sig-1, #b22222) var(--sx),
      var(--scola-slider-fill-track-aux-1, #bbb) var(--sx),
      var(--scola-slider-fill-track-aux-1, #bbb)
    );
  }

  :host([fill="aux-3"][fill-progress="sig-1"][dir="rtl"]) input::-webkit-slider-runnable-track {
    background: linear-gradient(
      to left,
      var(--scola-slider-fill-progress-sig-1, #b22222),
      var(--scola-slider-fill-progress-sig-1, #b22222) var(--sx),
      var(--scola-slider-fill-track-aux-1, #bbb) var(--sx),
      var(--scola-slider-fill-track-aux-1, #bbb)
    );
  }

  :host([fill="aux-3"][fill-progress="sig-2"]) input::-webkit-slider-runnable-track {
    background: linear-gradient(
      to right,
      var(--scola-slider-fill-progress-sig-1, #008000),
      var(--scola-slider-fill-progress-sig-1, #008000) var(--sx),
      var(--scola-slider-fill-track-aux-1, #bbb) var(--sx),
      var(--scola-slider-fill-track-aux-1, #bbb)
    );
  }

  :host([fill="aux-3"][fill-progress="sig-2"][dir="rtl"]) input::-webkit-slider-runnable-track {
    background: linear-gradient(
      to left,
      var(--scola-slider-fill-progress-sig-1, #008000),
      var(--scola-slider-fill-progress-sig-1, #008000) var(--sx),
      var(--scola-slider-fill-track-aux-1, #bbb) var(--sx),
      var(--scola-slider-fill-track-aux-1, #bbb)
    );
  }

  input::-webkit-slider-thumb {
    background: var(--scola-slider-fill-thumb, #fff);
    border: none;
    border-radius: 50%;
    box-shadow: 0 0 0.25rem rgba(0, 0, 0, 0.25);
    height: 1.5rem;
    margin-top: -0.625rem;
    width: 1.5rem;
    -moz-appearance: none;
    -webkit-appearance: none;
  }
`
