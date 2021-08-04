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
    position: absolute;
    z-index: 9;
  }

  :host([hcalc="start-at-end"][hspacing="large"]) slot::slotted(*) {
    margin-left: 0.75rem;
  }

  :host([hcalc="start-at-end"][hspacing="large"][dir="rtl"]) slot::slotted(*) {
    margin-left: -0.75rem;
  }

  :host([hcalc="start-at-end"][hspacing="medium"]) slot::slotted(*) {
    margin-left: 0.5rem;
  }

  :host([hcalc="start-at-end"][hspacing="medium"][dir="rtl"]) slot::slotted(*) {
    margin-left: -0.5rem;
  }

  :host([hcalc="start-at-end"][hspacing="small"]) slot::slotted(*) {
    margin-left: 0.25rem;
  }

  :host([hcalc="start-at-end"][hspacing="small"][dir="rtl"]) slot::slotted(*) {
    margin-left: -0.25rem;
  }

  :host([hcalc="start"][hspacing="large"]) slot::slotted(*) {
    margin-left: -0.75rem;
  }

  :host([hcalc="start"][hspacing="large"][dir="rtl"]) slot::slotted(*) {
    margin-left: 0.75rem;
  }

  :host([hcalc="start"][hspacing="medium"]) slot::slotted(*) {
    margin-left: -0.5rem;
  }

  :host([hcalc="start"][hspacing="medium"][dir="rtl"]) slot::slotted(*) {
    margin-left: 0.5rem;
  }

  :host([hcalc="start"][hspacing="small"]) slot::slotted(*) {
    margin-left: -0.25rem;
  }

  :host([hcalc="start"][hspacing="small"][dir="rtl"]) slot::slotted(*) {
    margin-left: 0.25rem;
  }

  :host([hcalc="end-at-start"][hspacing="large"]) slot::slotted(*) {
    margin-left: -0.75rem;
  }

  :host([hcalc="end-at-start"][hspacing="large"][dir="rtl"]) slot::slotted(*) {
    margin-left: 0.75rem;
  }

  :host([hcalc="end-at-start"][hspacing="medium"]) slot::slotted(*) {
    margin-left: -0.5rem;
  }

  :host([hcalc="end-at-start"][hspacing="medium"][dir="rtl"]) slot::slotted(*) {
    margin-left: 0.5rem;
  }

  :host([hcalc="end-at-start"][hspacing="small"]) slot::slotted(*) {
    margin-left: -0.25rem;
  }

  :host([hcalc="end-at-start"][hspacing="small"][dir="rtl"]) slot::slotted(*) {
    margin-left: 0.25rem;
  }

  :host([hcalc="end"][hspacing="large"]) slot::slotted(*) {
    margin-left: 0.75rem;
  }

  :host([hcalc="end"][hspacing="large"][dir="rtl"]) slot::slotted(*) {
    margin-left: -0.75rem;
  }

  :host([hcalc="end"][hspacing="medium"]) slot::slotted(*) {
    margin-left: 0.5rem;
  }

  :host([hcalc="end"][hspacing="medium"][dir="rtl"]) slot::slotted(*) {
    margin-left: -0.5rem;
  }

  :host([hcalc="end"][hspacing="small"]) slot::slotted(*) {
    margin-left: 0.25rem;
  }

  :host([hcalc="end"][hspacing="small"][dir="rtl"]) slot::slotted(*) {
    margin-left: -0.25rem;
  }

  :host([vcalc="top"][vspacing="large"]) slot::slotted(*) {
    margin-top: -0.75rem;
  }

  :host([vcalc="top"][vspacing="medium"]) slot::slotted(*) {
    margin-top: -0.5rem;
  }

  :host([vcalc="top"][vspacing="small"]) slot::slotted(*) {
    margin-top: -0.25rem;
  }

  :host([vcalc="top-at-bottom"][vspacing="large"]) slot::slotted(*) {
    margin-top: 0.75rem;
  }

  :host([vcalc="top-at-bottom"][vspacing="medium"]) slot::slotted(*) {
    margin-top: 0.5rem;
  }

  :host([vcalc="top-at-bottom"][vspacing="small"]) slot::slotted(*) {
    margin-top: 0.25rem;
  }

  :host([vcalc="bottom"][vspacing="large"]) slot::slotted(*) {
    margin-top: 0.75rem;
  }

  :host([vcalc="bottom"][vspacing="medium"]) slot::slotted(*) {
    margin-top: 0.5rem;
  }

  :host([vcalc="bottom"][vspacing="small"]) slot::slotted(*) {
    margin-top: 0.25rem;
  }

  :host([vcalc="bottom-at-top"][vspacing="large"]) slot::slotted(*) {
    margin-top: -0.75rem;
  }

  :host([vcalc="bottom-at-top"][vspacing="medium"]) slot::slotted(*) {
    margin-top: -0.5rem;
  }

  :host([vcalc="bottom-at-top"][vspacing="small"]) slot::slotted(*) {
    margin-top: -0.25rem;
  }
`
