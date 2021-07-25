import { css } from 'lit'

export default css`
  :host {
    display: contents;
    position: inherit;
  }

  :host([hidden]) {
    display: none;
  }

  slot:not([name])::slotted(*) {
    flex: none;
    position: absolute;
    z-index: 9;
  }

  :host([real-hto="start-at-end"][hspacing="large"]) slot::slotted(*) {
    margin-left: 0.75rem;
  }

  :host([real-hto="start-at-end"][hspacing="large"][dir="rtl"]) slot::slotted(*) {
    margin-left: -0.75rem;
  }

  :host([real-hto="start-at-end"][hspacing="medium"]) slot::slotted(*) {
    margin-left: 0.5rem;
  }

  :host([real-hto="start-at-end"][hspacing="medium"][dir="rtl"]) slot::slotted(*) {
    margin-left: -0.5rem;
  }

  :host([real-hto="start-at-end"][hspacing="small"]) slot::slotted(*) {
    margin-left: 0.25rem;
  }

  :host([real-hto="start-at-end"][hspacing="small"][dir="rtl"]) slot::slotted(*) {
    margin-left: -0.25rem;
  }

  :host([real-hto="start"][hspacing="large"]) slot::slotted(*) {
    margin-left: -0.75rem;
  }

  :host([real-hto="start"][hspacing="large"][dir="rtl"]) slot::slotted(*) {
    margin-left: 0.75rem;
  }

  :host([real-hto="start"][hspacing="medium"]) slot::slotted(*) {
    margin-left: -0.5rem;
  }

  :host([real-hto="start"][hspacing="medium"][dir="rtl"]) slot::slotted(*) {
    margin-left: 0.5rem;
  }

  :host([real-hto="start"][hspacing="small"]) slot::slotted(*) {
    margin-left: -0.25rem;
  }

  :host([real-hto="start"][hspacing="small"][dir="rtl"]) slot::slotted(*) {
    margin-left: 0.25rem;
  }

  :host([real-hto="end-at-start"][hspacing="large"]) slot::slotted(*) {
    margin-left: -0.75rem;
  }

  :host([real-hto="end-at-start"][hspacing="large"][dir="rtl"]) slot::slotted(*) {
    margin-left: 0.75rem;
  }

  :host([real-hto="end-at-start"][hspacing="medium"]) slot::slotted(*) {
    margin-left: -0.5rem;
  }

  :host([real-hto="end-at-start"][hspacing="medium"][dir="rtl"]) slot::slotted(*) {
    margin-left: 0.5rem;
  }

  :host([real-hto="end-at-start"][hspacing="small"]) slot::slotted(*) {
    margin-left: -0.25rem;
  }

  :host([real-hto="end-at-start"][hspacing="small"][dir="rtl"]) slot::slotted(*) {
    margin-left: 0.25rem;
  }

  :host([real-hto="end"][hspacing="large"]) slot::slotted(*) {
    margin-left: 0.75rem;
  }

  :host([real-hto="end"][hspacing="large"][dir="rtl"]) slot::slotted(*) {
    margin-left: -0.75rem;
  }

  :host([real-hto="end"][hspacing="medium"]) slot::slotted(*) {
    margin-left: 0.5rem;
  }

  :host([real-hto="end"][hspacing="medium"][dir="rtl"]) slot::slotted(*) {
    margin-left: -0.5rem;
  }

  :host([real-hto="end"][hspacing="small"]) slot::slotted(*) {
    margin-left: 0.25rem;
  }

  :host([real-hto="end"][hspacing="small"][dir="rtl"]) slot::slotted(*) {
    margin-left: -0.25rem;
  }

  :host([real-vto="top"][vspacing="large"]) slot::slotted(*) {
    margin-top: -0.75rem;
  }

  :host([real-vto="top"][vspacing="medium"]) slot::slotted(*) {
    margin-top: -0.5rem;
  }

  :host([real-vto="top"][vspacing="small"]) slot::slotted(*) {
    margin-top: -0.25rem;
  }

  :host([real-vto="top-at-bottom"][vspacing="large"]) slot::slotted(*) {
    margin-top: 0.75rem;
  }

  :host([real-vto="top-at-bottom"][vspacing="medium"]) slot::slotted(*) {
    margin-top: 0.5rem;
  }

  :host([real-vto="top-at-bottom"][vspacing="small"]) slot::slotted(*) {
    margin-top: 0.25rem;
  }

  :host([real-vto="bottom"][vspacing="large"]) slot::slotted(*) {
    margin-top: 0.75rem;
  }

  :host([real-vto="bottom"][vspacing="medium"]) slot::slotted(*) {
    margin-top: 0.5rem;
  }

  :host([real-vto="bottom"][vspacing="small"]) slot::slotted(*) {
    margin-top: 0.25rem;
  }

  :host([real-vto="bottom-at-top"][vspacing="large"]) slot::slotted(*) {
    margin-top: -0.75rem;
  }

  :host([real-vto="bottom-at-top"][vspacing="medium"]) slot::slotted(*) {
    margin-top: -0.5rem;
  }

  :host([real-vto="bottom-at-top"][vspacing="small"]) slot::slotted(*) {
    margin-top: -0.25rem;
  }
`
