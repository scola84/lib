import { css } from 'lit'

export default css`
  :host(:not([started])) {
    display: none;
  }

  :host([type="circle"]) {
    align-items: center;
    justify-content: center;
  }

  :host([fill]) slot[name="body"] {
    background: none;
  }

  :host([type="circle"]) slot[name="body"] {
    display: inline-block;
  }

  :host([type="circle"][size="large"]) slot[name="body"] {
    height: 2rem;
    width: 2rem;
  }

  :host([type="circle"][size="medium"]) slot[name="body"] {
    height: 1.5rem;
    width: 1.5rem;
  }

  :host([type="circle"][size="small"]) slot[name="body"] {
    height: 1rem;
    width: 1rem;
  }

  :host([type="rect"][stroke="large"]) slot[name="body"] {
    height: 0.5rem;
  }

  :host([type="rect"][stroke="medium"]) slot[name="body"] {
    height: 0.25rem;
  }

  :host([type="rect"][stroke="min"]) slot[name="body"] {
    height: 1px;
  }

  :host([type="rect"][stroke="small"]) slot[name="body"] {
    height: 0.125rem;
  }

  circle {
    fill: transparent;
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
  }

  :host([type="circle"][fill="aux-1"]) circle {
    stroke: var(--scola-node-fill-aux-1, #fff);
  }

  :host([type="circle"][fill="aux-2"]) circle {
    stroke: var(--scola-node-fill-aux-2, #eee);
  }

  :host([type="circle"][fill="aux-3"]) circle {
    stroke: var(--scola-node-fill-aux-3, #ddd);
  }

  :host([type="circle"][fill="aux-4"]) circle {
    stroke: var(--scola-node-fill-aux-4, rgba(255, 255, 255, 0.25));
  }

  :host([type="circle"][fill="sig-1"]) circle {
    stroke: var(--scola-node-fill-sig-1, #b22222);
  }

  :host([type="circle"][fill="sig-2"]) circle {
    stroke: var(--scola-node-fill-sig-2, #008000);
  }

  :host([type="circle"][mode="indeterminate"][started]) circle {
    animation: spin 1s infinite ease-in-out;
    stroke-dashoffset: 1rem !important;
  }

  :host([type="circle"][stroke="large"]) circle {
    stroke-width: 0.5rem;
  }

  :host([type="circle"][stroke="medium"]) circle {
    stroke-width: 0.25rem;
  }

  :host([type="circle"][stroke="min"]) circle {
    stroke-width: 1px;
  }

  :host([type="circle"][stroke="small"]) circle {
    stroke-width: 0.125rem;
  }

  :host([type="rect"][fill="aux-1"]) rect {
    fill: var(--scola-node-fill-aux-1, #fff);
  }

  :host([type="rect"][fill="aux-2"]) rect {
    fill: var(--scola-node-fill-aux-2, #eee);
  }

  :host([type="rect"][fill="aux-3"]) rect {
    fill: var(--scola-node-fill-aux-3, #ddd);
  }

  :host([type="rect"][fill="aux-4"]) rect {
    fill: var(--scola-node-fill-aux-4, rgba(255, 255, 255, 0.25));
  }

  :host([type="rect"][fill="sig-1"]) rect {
    fill: var(--scola-node-fill-sig-1, #b22222);
  }

  :host([type="rect"][fill="sig-2"]) rect {
    fill: var(--scola-node-fill-sig-2, #008000);
  }

  :host([type="rect"][mode="indeterminate"][started]) rect {
    animation: flow 1s infinite ease-in-out;
    width: 33% !important;
  }

  svg {
    height: 100%;
    width: 100%;
  }

  @keyframes flow {
    0% {
      transform: translateX(-33%);
    }

    100% {
      transform: translateX(100%);
    }
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
`
