import {
  css,
  customElement,
  property
} from 'lit-element'

import type { CSSResult } from 'lit-element'
import { ClipElement } from './clip'

declare global {
  interface HTMLElementTagNameMap {
    'scola-app': AppElement
  }
}

@customElement('scola-app')
export class AppElement extends ClipElement {
  public static styles: CSSResult[] = [
    ...ClipElement.styles,
    css`
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
        --scola-button-color-activated-aux-1: var(--scola-color-1, #000);
        --scola-button-color-activated-aux-2: var(--scola-color-2, #777);
        --scola-button-color-activated-aux-3: var(--scola-color-3, #fff);
        --scola-button-color-activated-sig-1: var(--scola-color-5, #b22222);
        --scola-button-color-activated-sig-2: var(--scola-color-6, #008000);
        --scola-button-fill-activated-aux-1: var(--scola-fill-2, #eee);
        --scola-button-fill-activated-aux-2: var(--scola-fill-3, #ddd);
        --scola-button-fill-activated-aux-3: var(--scola-fill-4, #ccc);
        --scola-button-fill-activated-sig-1: var(--scola-fill-9, #b22222);
        --scola-button-fill-activated-sig-2: var(--scola-fill-10, #008000);
        --scola-node-outer-shadow-large: var(--scola-shadow-1, 0 0 0.75rem rgba(0, 0, 0, 0.35));
        --scola-node-outer-shadow-line: var(--scola-shadow-4, #eee);
        --scola-node-outer-shadow-medium: var(--scola-shadow-2, 0 0 0.5rem rgba(0, 0, 0, 0.35));
        --scola-node-outer-shadow-small: var(--scola-shadow-3, 0 0 0.25rem rgba(0, 0, 0, 0.35));
        --scola-node-color-aux-1: var(--scola-color-1, #000);
        --scola-node-color-aux-2: var(--scola-color-2, #777);
        --scola-node-color-aux-3: var(--scola-color-3, #fff);
        --scola-node-color-error: var(--scola-color-4, #b00020);
        --scola-node-color-sig-1: var(--scola-color-5, #b22222);
        --scola-node-color-sig-2: var(--scola-color-6, #008000);
        --scola-node-fill-aux-1: var(--scola-fill-1, #fff);
        --scola-node-fill-aux-2: var(--scola-fill-2, #eee);
        --scola-node-fill-aux-3: var(--scola-fill-3, #ddd);
        --scola-node-fill-error: var(--scola-fill-7, #b00020);
        --scola-node-fill-sig-1: var(--scola-fill-9, #b22222);
        --scola-node-fill-sig-2: var(--scola-fill-10, #008000);
        --scola-node-fill-translucent: var(--scola-fill-8, rgba(255, 255, 255, 0.25));
        --scola-node-fill-hover-aux-1: var(--scola-fill-3, #ddd);
        --scola-node-fill-hover-aux-2: var(--scola-fill-4, #ccc);
        --scola-node-fill-hover-aux-3: var(--scola-fill-5, #bbb);
        --scola-node-fill-hover-sig-1: var(--scola-fill-11, #9a0000);
        --scola-node-fill-hover-sig-2: var(--scola-fill-12, #009000);
        --scola-node-fill-active-aux-1: var(--scola-fill-4, #ccc);
        --scola-node-fill-active-aux-2: var(--scola-fill-5, #bbb);
        --scola-node-fill-active-aux-3: var(--scola-fill-6, #aaa);
        --scola-node-fill-active-sig-1: var(--scola-fill-13, #8a0000);
        --scola-node-fill-active-sig-2: var(--scola-fill-14, #00bf00);
        --scola-node-inner-shadow-large: var(--scola-shadow-1, 0 0 0.75rem rgba(0, 0, 0, 0.35));
        --scola-node-inner-shadow-medium: var(--scola-shadow-2, 0 0 0.5rem rgba(0, 0, 0, 0.35));
        --scola-node-inner-shadow-small: var(--scola-shadow-3, 0 0 0.25rem rgba(0, 0, 0, 0.35));
        --scola-scrollbar-color-translucent-aux-1: var(--scola-fill-1, #fff);
        --scola-scrollbar-color-translucent-aux-2: var(--scola-fill-2, #eee);
        --scola-scrollbar-color-translucent-aux-3: var(--scola-fill-3, #ddd);
        --scola-scrollbar-color-aux-1: var(--scola-fill-2, #eee);
        --scola-scrollbar-color-aux-2: var(--scola-fill-3, #ddd);
        --scola-scrollbar-color-aux-3: var(--scola-fill-4, #ccc);
        --scola-select-fill-aux-1: var(--scola-fill-3, #ddd);
        --scola-select-fill-aux-2: var(--scola-fill-4, #ccc);
        --scola-select-fill-aux-3: var(--scola-fill-5, #bbb);
        --scola-select-fill-checked: var(--scola-fill-15, #000);
        --scola-select-fill-checked-sig-1: var(--scola-fill-9, #b22222);
        --scola-select-fill-checked-sig-2: var(--scola-fill-10, #008000);
        --scola-select-fill-thumb: var(--scola-fill-16, #fff);
        --scola-select-fill-thumb: var(--scola-fill-16, #fff);
        --scola-slider-fill-progress: var(--scola-fill-15, #000);
        --scola-slider-fill-progress-sig-1: var(--scola-fill-9, #b22222);
        --scola-slider-fill-progress-sig-2: var(--scola-fill-10, #008000);
        --scola-slider-fill-thumb: var(--scola-fill-16, #fff);
        --scola-slider-fill-track-aux-1: var(--scola-fill-3, #ddd);
        --scola-slider-fill-track-aux-2: var(--scola-fill-4, #ccc);
        --scola-slider-fill-track-aux-3: var(--scola-fill-5, #bbb);
      }

      :host([theme="scola-solid"][mode="dark"]) {
        --scola-color-1: #fff;
        --scola-color-2: #777;
        --scola-color-3: #000;
        --scola-color-4: #cf6679;
        --scola-color-5: #b22222;
        --scola-color-6: #008000;
        --scola-fill-1: #000;
        --scola-fill-2: #111;
        --scola-fill-3: #222;
        --scola-fill-4: #333;
        --scola-fill-5: #444;
        --scola-fill-6: #555;
        --scola-fill-7: #cf6679;
        --scola-fill-8: rgba(0, 0, 0, 0.25);
        --scola-fill-9: #b22222;
        --scola-fill-10: #008000;
        --scola-fill-11: #9a0000;
        --scola-fill-12: #009000;
        --scola-fill-13: #8a0000;
        --scola-fill-14: #00bf00;
        --scola-fill-15: #000;
        --scola-fill-16: #fff;
        --scola-shadow-1: 0 0 0.75rem rgba(0, 0, 0, 0.35);
        --scola-shadow-2: 0 0 0.5rem rgba(0, 0, 0, 0.35);
        --scola-shadow-3: 0 0 0.25rem rgba(0, 0, 0, 0.35);
        --scola-shadow-4: #111;
      }

      @media (prefers-color-scheme: dark) {
        :host([theme="scola-solid"][mode="system"]) {
          --scola-color-1: #fff;
          --scola-color-2: #777;
          --scola-color-3: #000;
          --scola-color-4: #cf6679;
          --scola-color-5: #b22222;
          --scola-color-6: #008000;
          --scola-fill-1: #000;
          --scola-fill-2: #111;
          --scola-fill-3: #222;
          --scola-fill-4: #333;
          --scola-fill-5: #444;
          --scola-fill-6: #555;
          --scola-fill-7: #cf6679;
          --scola-fill-8: rgba(0, 0, 0, 0.25);
          --scola-fill-9: #b22222;
          --scola-fill-10: #008000;
          --scola-fill-11: #9a0000;
          --scola-fill-12: #009000;
          --scola-fill-13: #8a0000;
          --scola-fill-14: #00bf00;
          --scola-fill-15: #000;
          --scola-fill-16: #fff;
          --scola-shadow-1: 0 0 0.75rem rgba(0, 0, 0, 0.35);
          --scola-shadow-2: 0 0 0.5rem rgba(0, 0, 0, 0.35);
          --scola-shadow-3: 0 0 0.25rem rgba(0, 0, 0, 0.35);
          --scola-shadow-4: #eee;
        }
      }

      :host([theme="scola-solid"][mode="light"]) {
        --scola-color-1: #000;
        --scola-color-2: #777;
        --scola-color-3: #fff;
        --scola-color-4: #b00020;
        --scola-color-5: #b22222;
        --scola-color-6: #008000;
        --scola-fill-1: #fff;
        --scola-fill-2: #eee;
        --scola-fill-3: #ddd;
        --scola-fill-4: #ccc;
        --scola-fill-5: #bbb;
        --scola-fill-6: #aaa;
        --scola-fill-7: #b00020;
        --scola-fill-8: rgba(255, 255, 255, 0.25);
        --scola-fill-9: #b22222;
        --scola-fill-10: #008000;
        --scola-fill-11: #9a0000;
        --scola-fill-12: #009000;
        --scola-fill-13: #8a0000;
        --scola-fill-14: #00bf00;
        --scola-fill-15: #000;
        --scola-fill-16: #fff;
        --scola-shadow-1: 0 0 0.75rem rgba(0, 0, 0, 0.35);
        --scola-shadow-2: 0 0 0.5rem rgba(0, 0, 0, 0.35);
        --scola-shadow-3: 0 0 0.25rem rgba(0, 0, 0, 0.35);
        --scola-shadow-4: #eee;
      }

      @media (prefers-color-scheme: light) {
        :host([theme="scola-solid"][mode="system"]) {
          --scola-color-1: #000;
          --scola-color-2: #777;
          --scola-color-3: #fff;
          --scola-color-4: #b00020;
          --scola-color-5: #b22222;
          --scola-color-6: #008000;
          --scola-fill-1: #fff;
          --scola-fill-2: #eee;
          --scola-fill-3: #ddd;
          --scola-fill-4: #ccc;
          --scola-fill-5: #bbb;
          --scola-fill-6: #aaa;
          --scola-fill-7: #b00020;
          --scola-fill-8: rgba(255, 255, 255, 0.25);
          --scola-fill-9: #b22222;
          --scola-fill-10: #008000;
          --scola-fill-11: #9a0000;
          --scola-fill-12: #009000;
          --scola-fill-13: #8a0000;
          --scola-fill-14: #00bf00;
          --scola-fill-15: #000;
          --scola-fill-16: #fff;
          --scola-shadow-1: 0 0 0.75rem rgba(0, 0, 0, 0.35);
          --scola-shadow-2: 0 0 0.5rem rgba(0, 0, 0, 0.35);
          --scola-shadow-3: 0 0 0.25rem rgba(0, 0, 0, 0.35);
          --scola-shadow-4: #eee;
        }
      }

      :host([theme="scola-translucent"][mode="dark"]) {
        --scola-color-1: rgba(255, 255, 255, 1);
        --scola-color-2: rgba(255, 255, 255, 0.5);
        --scola-color-3: rgba(0, 0, 0, 1);
        --scola-color-4: #b00020;
        --scola-color-5: #b22222;
        --scola-color-6: #008000;
        --scola-fill-1: rgba(0, 0, 0, 0.1);
        --scola-fill-2: rgba(0, 0, 0, 0.15);
        --scola-fill-3: rgba(0, 0, 0, 0.2);
        --scola-fill-4: rgba(0, 0, 0, 0.25);
        --scola-fill-5: rgba(0, 0, 0, 0.3);
        --scola-fill-6: rgba(0, 0, 0, 0.35);
        --scola-fill-7: #b00020;
        --scola-fill-8: rgba(0, 0, 0, 0);
        --scola-fill-9: #b22222;
        --scola-fill-10: #008000;
        --scola-fill-11: #9a0000;
        --scola-fill-12: #009000;
        --scola-fill-13: #8a0000;
        --scola-fill-14: #00bf00;
        --scola-fill-15: #000;
        --scola-fill-16: #fff;
        --scola-shadow-1: 0 0 0.75rem rgba(0, 0, 0, 0.35);
        --scola-shadow-2: 0 0 0.5rem rgba(0, 0, 0, 0.35);
        --scola-shadow-3: 0 0 0.25rem rgba(0, 0, 0, 0.35);
        --scola-shadow-4: #eee;
        --scola-scrollbar-color-translucent-aux-1: transparent;
        --scola-scrollbar-color-translucent-aux-2: transparent;
        --scola-scrollbar-color-translucent-aux-3: transparent;
      }

      @media (prefers-color-scheme: dark) {
        :host([theme="scola-translucent"][mode="system"]) {
          --scola-color-1: rgba(255, 255, 255, 1);
          --scola-color-2: rgba(255, 255, 255, 0.5);
          --scola-color-3: rgba(0, 0, 0, 1);
          --scola-color-4: #b00020;
          --scola-color-5: #b22222;
          --scola-color-6: #008000;
          --scola-fill-1: rgba(0, 0, 0, 0.1);
          --scola-fill-2: rgba(0, 0, 0, 0.15);
          --scola-fill-3: rgba(0, 0, 0, 0.2);
          --scola-fill-4: rgba(0, 0, 0, 0.25);
          --scola-fill-5: rgba(0, 0, 0, 0.3);
          --scola-fill-6: rgba(0, 0, 0, 0.35);
          --scola-fill-7: #b00020;
          --scola-fill-8: rgba(0, 0, 0, 0);
          --scola-fill-9: #b22222;
          --scola-fill-10: #008000;
          --scola-fill-11: #9a0000;
          --scola-fill-12: #009000;
          --scola-fill-13: #8a0000;
          --scola-fill-14: #00bf00;
          --scola-fill-15: #000;
          --scola-fill-16: #fff;
          --scola-shadow-1: 0 0 0.75rem rgba(0, 0, 0, 0.35);
          --scola-shadow-2: 0 0 0.5rem rgba(0, 0, 0, 0.35);
          --scola-shadow-3: 0 0 0.25rem rgba(0, 0, 0, 0.35);
          --scola-shadow-4: #eee;
          --scola-scrollbar-color-translucent-aux-1: transparent;
          --scola-scrollbar-color-translucent-aux-2: transparent;
          --scola-scrollbar-color-translucent-aux-3: transparent;
        }
      }

      :host([theme="scola-translucent"][mode="light"]) {
        --scola-color-1: rgba(255, 255, 255, 1);
        --scola-color-2: rgba(255, 255, 255, 0.5);
        --scola-color-3: rgba(0, 0, 0, 1);
        --scola-color-4: #b22222;
        --scola-color-5: #b00020;
        --scola-color-6: #008000;
        --scola-fill-1: rgba(255, 255, 255, 0.1);
        --scola-fill-2: rgba(255, 255, 255, 0.15);
        --scola-fill-3: rgba(255, 255, 255, 0.2);
        --scola-fill-4: rgba(255, 255, 255, 0.25);
        --scola-fill-5: rgba(255, 255, 255, 0.3);
        --scola-fill-6: rgba(255, 255, 255, 0.35);
        --scola-fill-7: #b00020;
        --scola-fill-8: rgba(255, 255, 255, 0);
        --scola-fill-9: #b22222;
        --scola-fill-10: #008000;
        --scola-fill-11: #9a0000;
        --scola-fill-12: #009000;
        --scola-fill-13: #8a0000;
        --scola-fill-14: #00bf00;
        --scola-fill-15: #000;
        --scola-fill-16: #fff;
        --scola-shadow-1: 0 0 0.75rem rgba(0, 0, 0, 0.35);
        --scola-shadow-2: 0 0 0.5rem rgba(0, 0, 0, 0.35);
        --scola-shadow-3: 0 0 0.25rem rgba(0, 0, 0, 0.35);
        --scola-shadow-4: #eee;
        --scola-scrollbar-color-translucent-aux-1: transparent;
        --scola-scrollbar-color-translucent-aux-2: transparent;
        --scola-scrollbar-color-translucent-aux-3: transparent;
      }

      @media (prefers-color-scheme: light) {
        :host([theme="scola-translucent"][mode="system"]) {
          --scola-color-1: rgba(255, 255, 255, 1);
          --scola-color-2: rgba(255, 255, 255, 0.5);
          --scola-color-3: rgba(0, 0, 0, 1);
          --scola-color-4: #b22222;
          --scola-color-5: #b00020;
          --scola-color-6: #008000;
          --scola-fill-1: rgba(255, 255, 255, 0.1);
          --scola-fill-2: rgba(255, 255, 255, 0.15);
          --scola-fill-3: rgba(255, 255, 255, 0.2);
          --scola-fill-4: rgba(255, 255, 255, 0.25);
          --scola-fill-5: rgba(255, 255, 255, 0.3);
          --scola-fill-6: rgba(255, 255, 255, 0.35);
          --scola-fill-7: #b00020;
          --scola-fill-8: rgba(255, 255, 255, 0);
          --scola-fill-9: #b22222;
          --scola-fill-10: #008000;
          --scola-fill-11: #9a0000;
          --scola-fill-12: #009000;
          --scola-fill-13: #8a0000;
          --scola-fill-14: #00bf00;
          --scola-fill-15: #000;
          --scola-fill-16: #fff;
          --scola-shadow-1: 0 0 0.75rem rgba(0, 0, 0, 0.35);
          --scola-shadow-2: 0 0 0.5rem rgba(0, 0, 0, 0.35);
          --scola-shadow-3: 0 0 0.25rem rgba(0, 0, 0, 0.35);
          --scola-shadow-4: #eee;
          --scola-scrollbar-color-translucent-aux-1: transparent;
          --scola-scrollbar-color-translucent-aux-2: transparent;
          --scola-scrollbar-color-translucent-aux-3: transparent;
        }
      }

      @media not all and (max-height: 1080px) {
        :host([type="outer"][flow="column"]) slot[name="after"]::slotted(*) {
          position: relative;
        }

        :host([type="outer"][flow="column"])
          slot[name="after"]::slotted(:not([outer-shadow="line"])) {
          box-shadow: none;
        }
      }

      @media not all and (max-height: 810px) {
        :host([type="outer"][flow="column"]) slot[name="before"]::slotted(*) {
          position: relative;
        }

        :host([type="outer"][flow="column"])
          slot[name="before"]::slotted(:not([outer-shadow="line"])) {
          box-shadow: none;
        }
      }

      @media not all and (max-width: 1080px) {
        :host([type="outer"][flow="row"]) slot[name="after"]::slotted(*) {
          position: relative;
        }

        :host([type="outer"][flow="row"]) slot[name="after"]::slotted(:not([outer-shadow="line"])) {
          box-shadow: none;
        }
      }

      @media not all and (max-width: 810px) {
        :host([type="outer"][flow="row"]) slot[name="before"]::slotted(*) {
          position: relative;
        }

        :host([type="outer"][flow="row"])
          slot[name="before"]::slotted(:not([outer-shadow="line"])) {
          box-shadow: none;
        }
      }
    `
  ]

  @property({
    reflect: true
  })
  public mode: 'dark' | 'light' | 'system'

  @property({
    reflect: true
  })
  public theme: string

  public flow: ClipElement['flow'] = 'row'

  public height: ClipElement['height'] = 'max'

  public type: ClipElement['type'] = 'outer'

  public width: ClipElement['width'] = 'max'

  protected get hasDialogs (): boolean {
    return this.shadowRoot?.querySelector('scola-dialog') !== null
  }

  protected handleClick (event: Event): void {
    if (!this.hasDialogs) {
      super.handleClick(event)
    }
  }
}
