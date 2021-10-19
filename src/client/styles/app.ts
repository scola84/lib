import { css } from 'lit'

export default css`
  :host {
    left: 0;
    position: fixed;
    top: 0;
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  :host([theme]) {
    --scola-button-color-activated-aux-1: var(--scola-color-aux-a, #000);
    --scola-button-color-activated-aux-2: var(--scola-color-aux-b, #777);
    --scola-button-color-activated-aux-3: var(--scola-color-aux-c, #fff);
    --scola-button-color-activated-sig-1: var(--scola-color-sig-a, #b22222);
    --scola-button-color-activated-sig-2: var(--scola-color-sig-b, #008000);
    --scola-button-fill-activated-aux-1: var(--scola-fill-aux-b, #eee);
    --scola-button-fill-activated-aux-2: var(--scola-fill-aux-c, #ddd);
    --scola-button-fill-activated-aux-3: var(--scola-fill-aux-d, #ccc);
    --scola-button-fill-activated-sig-1: var(--scola-fill-sig-a, #b22222);
    --scola-button-fill-activated-sig-2: var(--scola-fill-sig-b, #008000);
    --scola-node-outer-shadow-large: var(--scola-shadow-a, 0 0 0.75rem rgba(0, 0, 0, 0.35));
    --scola-node-outer-shadow-medium: var(--scola-shadow-b, 0 0 0.5rem rgba(0, 0, 0, 0.35));
    --scola-node-outer-shadow-min: var(--scola-shadow-d, #eee);
    --scola-node-outer-shadow-small: var(--scola-shadow-c, 0 0 0.25rem rgba(0, 0, 0, 0.35));
    --scola-node-color-aux-1: var(--scola-color-aux-a, #000);
    --scola-node-color-aux-2: var(--scola-color-aux-b, #777);
    --scola-node-color-aux-3: var(--scola-color-aux-c, #fff);
    --scola-node-color-error: var(--scola-color-error, #b00020);
    --scola-node-color-sig-1: var(--scola-color-sig-a, #b22222);
    --scola-node-color-sig-2: var(--scola-color-sig-b, #008000);
    --scola-node-fill-aux-1: var(--scola-fill-aux-a, #fff);
    --scola-node-fill-aux-2: var(--scola-fill-aux-b, #eee);
    --scola-node-fill-aux-3: var(--scola-fill-aux-c, #ddd);
    --scola-node-fill-error: var(--scola-fill-error, #b00020);
    --scola-node-fill-sig-1: var(--scola-fill-sig-a, #b22222);
    --scola-node-fill-sig-2: var(--scola-fill-sig-b, #008000);
    --scola-node-fill-tsp: var(--scola-fill-tsp, rgba(255, 255, 255, 0.25));
    --scola-node-fill-tsp-black: var(--scola-fill-tsp-black, rgba(0, 0, 0, 0.25));
    --scola-node-fill-tsp-white: var(--scola-fill-tsp-white, rgba(255, 255, 255, 0.25));
    --scola-node-fill-hover-aux-1: var(--scola-fill-aux-c, #ddd);
    --scola-node-fill-hover-aux-2: var(--scola-fill-aux-d, #ccc);
    --scola-node-fill-hover-aux-3: var(--scola-fill-aux-e, #bbb);
    --scola-node-fill-hover-sig-1: var(--scola-fill-sig-c, #9a0000);
    --scola-node-fill-hover-sig-2: var(--scola-fill-sig-d, #009000);
    --scola-node-fill-active-aux-1: var(--scola-fill-aux-d, #ccc);
    --scola-node-fill-active-aux-2: var(--scola-fill-aux-e, #bbb);
    --scola-node-fill-active-aux-3: var(--scola-fill-aux-f, #aaa);
    --scola-node-fill-active-sig-1: var(--scola-fill-sig-e, #8a0000);
    --scola-node-fill-active-sig-2: var(--scola-fill-sig-f, #00bf00);
    --scola-node-inner-shadow-large: var(--scola-shadow-a, 0 0 0.75rem rgba(0, 0, 0, 0.35));
    --scola-node-inner-shadow-medium: var(--scola-shadow-b, 0 0 0.5rem rgba(0, 0, 0, 0.35));
    --scola-node-inner-shadow-small: var(--scola-shadow-c, 0 0 0.25rem rgba(0, 0, 0, 0.35));
    --scola-scrollbar-color-aux-1: var(--scola-fill-aux-b, #eee);
    --scola-scrollbar-color-aux-2: var(--scola-fill-aux-c, #ddd);
    --scola-scrollbar-color-aux-3: var(--scola-fill-aux-d, #ccc);
    --scola-select-fill-aux-1: var(--scola-fill-aux-c, #ddd);
    --scola-select-fill-aux-2: var(--scola-fill-aux-d, #ccc);
    --scola-select-fill-aux-3: var(--scola-fill-aux-e, #bbb);
    --scola-select-fill-checked: var(--scola-fill-aux-g, #000);
    --scola-select-fill-checked-sig-1: var(--scola-fill-sig-a, #b22222);
    --scola-select-fill-checked-sig-2: var(--scola-fill-sig-b, #008000);
    --scola-select-fill-thumb: var(--scola-fill-aux-h, #fff);
    --scola-select-fill-thumb: var(--scola-fill-aux-h, #fff);
    --scola-slider-fill-progress: var(--scola-fill-aux-g, #000);
    --scola-slider-fill-progress-sig-1: var(--scola-fill-sig-a, #b22222);
    --scola-slider-fill-progress-sig-2: var(--scola-fill-sig-b, #008000);
    --scola-slider-fill-thumb: var(--scola-fill-aux-h, #fff);
    --scola-slider-fill-track-aux-1: var(--scola-fill-aux-c, #ddd);
    --scola-slider-fill-track-aux-2: var(--scola-fill-aux-d, #ccc);
    --scola-slider-fill-track-aux-3: var(--scola-fill-aux-e, #bbb);
  }

  :host([theme="scola-solid"][scheme="dark"]) {
    --scola-color-aux-a: #fff;
    --scola-color-aux-b: #777;
    --scola-color-aux-c: #000;
    --scola-color-error: #cf6679;
    --scola-color-sig-a: #b22222;
    --scola-color-sig-b: #008000;
    --scola-fill-aux-a: #000;
    --scola-fill-aux-b: #111;
    --scola-fill-aux-c: #222;
    --scola-fill-aux-d: #333;
    --scola-fill-aux-e: #444;
    --scola-fill-aux-f: #555;
    --scola-fill-aux-g: #000;
    --scola-fill-aux-h: #fff;
    --scola-fill-error: #cf6679;
    --scola-fill-sig-a: #b22222;
    --scola-fill-sig-b: #008000;
    --scola-fill-sig-c: #9a0000;
    --scola-fill-sig-d: #009000;
    --scola-fill-sig-e: #8a0000;
    --scola-fill-sig-f: #00bf00;
    --scola-fill-tsp: rgba(0, 0, 0, 0.25);
    --scola-fill-tsp-black: rgba(0, 0, 0, 0.25);
    --scola-fill-tsp-white: rgba(255, 255, 255, 0.25);
    --scola-shadow-a: 0 0 0.75rem rgba(0, 0, 0, 0.35);
    --scola-shadow-b: 0 0 0.5rem rgba(0, 0, 0, 0.35);
    --scola-shadow-c: 0 0 0.25rem rgba(0, 0, 0, 0.35);
    --scola-shadow-d: #111;
  }

  @media (prefers-color-scheme: dark) {
    :host([theme="scola-solid"][scheme="system"]) {
      --scola-color-aux-a: #fff;
      --scola-color-aux-b: #777;
      --scola-color-aux-c: #000;
      --scola-color-error: #cf6679;
      --scola-color-sig-a: #b22222;
      --scola-color-sig-b: #008000;
      --scola-fill-aux-a: #000;
      --scola-fill-aux-b: #111;
      --scola-fill-aux-c: #222;
      --scola-fill-aux-d: #333;
      --scola-fill-aux-e: #444;
      --scola-fill-aux-f: #555;
      --scola-fill-aux-g: #000;
      --scola-fill-aux-h: #fff;
      --scola-fill-error: #cf6679;
      --scola-fill-sig-a: #b22222;
      --scola-fill-sig-b: #008000;
      --scola-fill-sig-c: #9a0000;
      --scola-fill-sig-d: #009000;
      --scola-fill-sig-e: #8a0000;
      --scola-fill-sig-f: #00bf00;
      --scola-fill-tsp: rgba(0, 0, 0, 0.25);
      --scola-fill-tsp-black: rgba(0, 0, 0, 0.25);
      --scola-fill-tsp-white: rgba(255, 255, 255, 0.25);
      --scola-shadow-a: 0 0 0.75rem rgba(0, 0, 0, 0.35);
      --scola-shadow-b: 0 0 0.5rem rgba(0, 0, 0, 0.35);
      --scola-shadow-c: 0 0 0.25rem rgba(0, 0, 0, 0.35);
      --scola-shadow-d: #111;
    }
  }

  :host([theme="scola-solid"][scheme="light"]) {
    --scola-color-aux-a: #000;
    --scola-color-aux-b: #777;
    --scola-color-aux-c: #fff;
    --scola-color-error: #b00020;
    --scola-color-sig-a: #b22222;
    --scola-color-sig-b: #008000;
    --scola-fill-aux-a: #fff;
    --scola-fill-aux-b: #eee;
    --scola-fill-aux-c: #ddd;
    --scola-fill-aux-d: #ccc;
    --scola-fill-aux-e: #bbb;
    --scola-fill-aux-f: #aaa;
    --scola-fill-aux-g: #000;
    --scola-fill-aux-h: #fff;
    --scola-fill-error: #b00020;
    --scola-fill-sig-a: #b22222;
    --scola-fill-sig-b: #008000;
    --scola-fill-sig-c: #9a0000;
    --scola-fill-sig-d: #009000;
    --scola-fill-sig-e: #8a0000;
    --scola-fill-sig-f: #00bf00;
    --scola-fill-tsp: rgba(255, 255, 255, 0.25);
    --scola-fill-tsp-black: rgba(0, 0, 0, 0.25);
    --scola-fill-tsp-white: rgba(255, 255, 255, 0.25);
    --scola-shadow-a: 0 0 0.75rem rgba(0, 0, 0, 0.35);
    --scola-shadow-b: 0 0 0.5rem rgba(0, 0, 0, 0.35);
    --scola-shadow-c: 0 0 0.25rem rgba(0, 0, 0, 0.35);
    --scola-shadow-d: #eee;
  }

  @media (prefers-color-scheme: light) {
    :host([theme="scola-solid"][scheme="system"]) {
      --scola-color-aux-a: #000;
      --scola-color-aux-b: #777;
      --scola-color-aux-c: #fff;
      --scola-color-error: #b00020;
      --scola-color-sig-a: #b22222;
      --scola-color-sig-b: #008000;
      --scola-fill-aux-a: #fff;
      --scola-fill-aux-b: #eee;
      --scola-fill-aux-c: #ddd;
      --scola-fill-aux-d: #ccc;
      --scola-fill-aux-e: #bbb;
      --scola-fill-aux-f: #aaa;
      --scola-fill-aux-g: #000;
      --scola-fill-aux-h: #fff;
      --scola-fill-error: #b00020;
      --scola-fill-sig-a: #b22222;
      --scola-fill-sig-b: #008000;
      --scola-fill-sig-c: #9a0000;
      --scola-fill-sig-d: #009000;
      --scola-fill-sig-e: #8a0000;
      --scola-fill-sig-f: #00bf00;
      --scola-fill-tsp: rgba(255, 255, 255, 0.25);
      --scola-fill-tsp-black: rgba(0, 0, 0, 0.25);
      --scola-fill-tsp-white: rgba(255, 255, 255, 0.25);
      --scola-shadow-a: 0 0 0.75rem rgba(0, 0, 0, 0.35);
      --scola-shadow-b: 0 0 0.5rem rgba(0, 0, 0, 0.35);
      --scola-shadow-c: 0 0 0.25rem rgba(0, 0, 0, 0.35);
      --scola-shadow-d: #eee;
    }
  }

  :host([theme="scola-transparent"][scheme="dark"]) {
    --scola-color-aux-a: rgba(255, 255, 255, 1);
    --scola-color-aux-b: rgba(255, 255, 255, 0.5);
    --scola-color-aux-c: rgba(0, 0, 0, 1);
    --scola-color-error: #b00020;
    --scola-color-sig-1: #b22222;
    --scola-color-sig-2: #008000;
    --scola-fill-aux-a: rgba(0, 0, 0, 0.1);
    --scola-fill-aux-b: rgba(0, 0, 0, 0.15);
    --scola-fill-aux-c: rgba(0, 0, 0, 0.2);
    --scola-fill-aux-d: rgba(0, 0, 0, 0.25);
    --scola-fill-aux-e: rgba(0, 0, 0, 0.3);
    --scola-fill-aux-f: rgba(0, 0, 0, 0.35);
    --scola-fill-aux-g: #000;
    --scola-fill-aux-h: #fff;
    --scola-fill-error: #b00020;
    --scola-fill-sig-a: #b22222;
    --scola-fill-sig-b: #008000;
    --scola-fill-sig-c: #9a0000;
    --scola-fill-sig-d: #009000;
    --scola-fill-sig-e: #8a0000;
    --scola-fill-sig-f: #00bf00;
    --scola-fill-tsp: rgba(0, 0, 0, 0.25);
    --scola-fill-tsp-black: rgba(0, 0, 0, 0.25);
    --scola-fill-tsp-white: rgba(255, 255, 255, 0.25);
    --scola-shadow-a: 0 0 0.75rem rgba(0, 0, 0, 0.35);
    --scola-shadow-b: 0 0 0.5rem rgba(0, 0, 0, 0.35);
    --scola-shadow-c: 0 0 0.25rem rgba(0, 0, 0, 0.35);
    --scola-shadow-d: rgba(0, 0, 0, 0.15);
  }

  @media (prefers-color-scheme: dark) {
    :host([theme="scola-transparent"][scheme="system"]) {
      --scola-color-aux-a: rgba(255, 255, 255, 1);
      --scola-color-aux-b: rgba(255, 255, 255, 0.5);
      --scola-color-aux-c: rgba(0, 0, 0, 1);
      --scola-color-error: #b00020;
      --scola-color-sig-1: #b22222;
      --scola-color-sig-2: #008000;
      --scola-fill-aux-a: rgba(0, 0, 0, 0.1);
      --scola-fill-aux-b: rgba(0, 0, 0, 0.15);
      --scola-fill-aux-c: rgba(0, 0, 0, 0.2);
      --scola-fill-aux-d: rgba(0, 0, 0, 0.25);
      --scola-fill-aux-e: rgba(0, 0, 0, 0.3);
      --scola-fill-aux-f: rgba(0, 0, 0, 0.35);
      --scola-fill-aux-g: #000;
      --scola-fill-aux-h: #fff;
      --scola-fill-error: #b00020;
      --scola-fill-sig-a: #b22222;
      --scola-fill-sig-b: #008000;
      --scola-fill-sig-c: #9a0000;
      --scola-fill-sig-d: #009000;
      --scola-fill-sig-e: #8a0000;
      --scola-fill-sig-f: #00bf00;
      --scola-fill-tsp: rgba(0, 0, 0, 0.25);
      --scola-fill-tsp-black: rgba(0, 0, 0, 0.25);
      --scola-fill-tsp-white: rgba(255, 255, 255, 0.25);
      --scola-shadow-a: 0 0 0.75rem rgba(0, 0, 0, 0.35);
      --scola-shadow-b: 0 0 0.5rem rgba(0, 0, 0, 0.35);
      --scola-shadow-c: 0 0 0.25rem rgba(0, 0, 0, 0.35);
      --scola-shadow-d: rgba(0, 0, 0, 0.15);
    }
  }

  :host([theme="scola-transparent"][scheme="light"]) {
    --scola-color-aux-a: rgba(255, 255, 255, 1);
    --scola-color-aux-b: rgba(255, 255, 255, 0.5);
    --scola-color-aux-c: rgba(0, 0, 0, 1);
    --scola-color-error: #b22222;
    --scola-color-sig-a: #b00020;
    --scola-color-sig-b: #008000;
    --scola-fill-aux-a: rgba(255, 255, 255, 0.1);
    --scola-fill-aux-b: rgba(255, 255, 255, 0.15);
    --scola-fill-aux-c: rgba(255, 255, 255, 0.2);
    --scola-fill-aux-d: rgba(255, 255, 255, 0.25);
    --scola-fill-aux-e: rgba(255, 255, 255, 0.3);
    --scola-fill-aux-f: rgba(255, 255, 255, 0.35);
    --scola-fill-aux-g: #000;
    --scola-fill-aux-h: #fff;
    --scola-fill-error: #b00020;
    --scola-fill-sig-a: #b22222;
    --scola-fill-sig-b: #008000;
    --scola-fill-sig-c: #9a0000;
    --scola-fill-sig-d: #009000;
    --scola-fill-sig-e: #8a0000;
    --scola-fill-sig-f: #00bf00;
    --scola-fill-tsp: rgba(255, 255, 255, 0.25);
    --scola-fill-tsp-black: rgba(0, 0, 0, 0.25);
    --scola-fill-tsp-white: rgba(255, 255, 255, 0.25);
    --scola-shadow-a: 0 0 0.75rem rgba(0, 0, 0, 0.35);
    --scola-shadow-b: 0 0 0.5rem rgba(0, 0, 0, 0.35);
    --scola-shadow-c: 0 0 0.25rem rgba(0, 0, 0, 0.35);
    --scola-shadow-d: rgba(255, 255, 255, 0.15);
  }

  @media (prefers-color-scheme: light) {
    :host([theme="scola-transparent"][scheme="system"]) {
      --scola-color-aux-a: rgba(255, 255, 255, 1);
      --scola-color-aux-b: rgba(255, 255, 255, 0.5);
      --scola-color-aux-c: rgba(0, 0, 0, 1);
      --scola-color-error: #b22222;
      --scola-color-sig-a: #b00020;
      --scola-color-sig-b: #008000;
      --scola-fill-aux-a: rgba(255, 255, 255, 0.1);
      --scola-fill-aux-b: rgba(255, 255, 255, 0.15);
      --scola-fill-aux-c: rgba(255, 255, 255, 0.2);
      --scola-fill-aux-d: rgba(255, 255, 255, 0.25);
      --scola-fill-aux-e: rgba(255, 255, 255, 0.3);
      --scola-fill-aux-f: rgba(255, 255, 255, 0.35);
      --scola-fill-aux-g: #000;
      --scola-fill-aux-h: #fff;
      --scola-fill-error: #b00020;
      --scola-fill-sig-a: #b22222;
      --scola-fill-sig-b: #008000;
      --scola-fill-sig-c: #9a0000;
      --scola-fill-sig-d: #009000;
      --scola-fill-sig-e: #8a0000;
      --scola-fill-sig-f: #00bf00;
      --scola-fill-tsp: rgba(255, 255, 255, 0.25);
      --scola-fill-tsp-black: rgba(0, 0, 0, 0.25);
      --scola-fill-tsp-white: rgba(255, 255, 255, 0.25);
      --scola-shadow-a: 0 0 0.75rem rgba(0, 0, 0, 0.35);
      --scola-shadow-b: 0 0 0.5rem rgba(0, 0, 0, 0.35);
      --scola-shadow-c: 0 0 0.25rem rgba(0, 0, 0, 0.35);
      --scola-shadow-d: rgba(255, 255, 255, 0.15);
    }
  }

  @media (min-width: 1024px) {
    :host([mode="outer"][flow="row"]) slot[name="after"]::slotted(*) {
      position: relative;
    }

    :host([mode="outer"][flow="row"]) slot[name="after"]::slotted(:not([outer-shadow="min"])) {
      box-shadow: none;
    }
  }

  @media (min-width: 768px) {
    :host([mode="outer"][flow="row"]) slot[name="before"]::slotted(*) {
      position: relative;
    }

    :host([mode="outer"][flow="row"]) slot[name="before"]::slotted(:not([outer-shadow="min"])) {
      box-shadow: none;
    }
  }
`
