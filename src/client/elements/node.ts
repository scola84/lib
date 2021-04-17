import type { CSSResult, PropertyValues, TemplateResult } from 'lit-element'
import { LitElement, css, customElement, html, property, query } from 'lit-element'

declare global {
  interface HTMLElementEventMap {
    'scola-log': LogEvent
  }

  interface HTMLElementTagNameMap {
    'scola-node': NodeElement
  }
}

export enum LogLevel {
  all = 1,
  info = 2,
  warn = 3,
  err = 4,
  off = 5
}

export interface Log extends NodeResult {
  error?: Error
  level: keyof typeof LogLevel
  origin: HTMLElement
  template?: TemplateResult
  timeout?: number
}

export interface LogEvent extends CustomEvent {
  detail: Log | null
}

export interface NodeEvent extends CustomEvent {
  detail: {
    origin?: HTMLElement
    target?: string
  } | null
}

export interface Presets {
  ''?: Record<string, string | unknown>
}

export interface NodeResult {
  code?: string
  data?: unknown
}

@customElement('scola-node')
export class NodeElement extends LitElement {
  public static presets: Presets

  public static styles: CSSResult[] = [
    css`
      :host {
        display: flex;
        flex-direction: column;
        position: relative;
      }

      :host([at-large]),
      :host([at-medium]),
      :host([at-small]) {
        display: none;
      }

      @media (max-width: 810px) {
        :host([at-small]) {
          display: inline-flex;
        }
      }

      @media (min-width: 811px) and (max-width: 1080px) {
        :host([at-medium]) {
          display: inline-flex;
        }
      }

      @media not all and (max-width: 1080px) {
        :host([at-large]) {
          display: inline-flex;
        }
      }

      :host([cols]),
      :host([rows]) {
        width: 100%;
      }

      @media (min-width: 512px) {
        :host([cols="1"]) {
          width: 4rem;
        }

        :host([cols="2"]) {
          width: 8rem;
        }

        :host([cols="3"]) {
          width: 12rem;
        }

        :host([cols="4"]) {
          width: 16rem;
        }

        :host([cols="5"]) {
          width: 20rem;
        }

        :host([cols="6"]) {
          width: 24rem;
        }

        :host([cols="7"]) {
          width: 28rem;
        }

        :host([cols="8"]) {
          width: 32rem;
        }

        :host([cols="9"]) {
          width: 36rem;
        }

        :host([cols="10"]) {
          width: 40rem;
        }

        :host([cols="11"]) {
          width: 44rem;
        }

        :host([cols="12"]) {
          width: 48rem;
        }

        :host([cols="13"]) {
          width: 52rem;
        }

        :host([cols="14"]) {
          width: 56rem;
        }

        :host([cols="15"]) {
          width: 60rem;
        }

        :host([cols="16"]) {
          width: 64rem;
        }

        :host([cols="17"]) {
          width: 68rem;
        }

        :host([cols="18"]) {
          width: 72rem;
        }

        :host([cols="19"]) {
          width: 76rem;
        }

        :host([cols="20"]) {
          width: 80rem;
        }
      }

      :host([disabled]) {
        filter: grayscale(50%) opacity(50%);
        pointer-events: none;
      }

      :host([height="auto"]) {
        height: auto;
      }

      :host([height="flex"]) {
        flex: 1;
      }

      :host([height="max"]) {
        height: 100%;
      }

      :host([hmargin="large"]),
      :host([margin="large"]) {
        margin-left: 0.75rem;
        margin-right: 0.75rem;
      }

      :host([hmargin="medium"]),
      :host([margin="medium"]) {
        margin-left: 0.5rem;
        margin-right: 0.5rem;
      }

      :host([hmargin="small"]),
      :host([margin="small"]) {
        margin-left: 0.25rem;
        margin-right: 0.25rem;
      }

      :host([hposition]),
      :host([vposition]) {
        position: absolute;
        z-index: 9;
      }

      :host([hposition="end"]) {
        right: 0;
      }

      :host([hposition="end"][dir="rtl"]) {
        left: 0;
        right: auto;
      }

      :host([hposition="start"]) {
        left: 0;
      }

      :host([hposition="start"][dir="rtl"]) {
        left: auto;
        right: 0;
      }

      :host([inner-backdrop="large"]) slot:not([name]) {
        backdrop-filter: blur(0.75rem);
        -webkit-backdrop-filter: blur(0.75rem);
      }

      :host([inner-backdrop="medium"]) slot:not([name]) {
        backdrop-filter: blur(0.5rem);
        -webkit-backdrop-filter: blur(0.5rem);
      }

      :host([inner-backdrop="small"]) slot:not([name]) {
        backdrop-filter: blur(0.25rem);
        -webkit-backdrop-filter: blur(0.25rem);
      }

      :host([inner-height]),
      :host([inner-height]) slot:not([name]) {
        height: 100%;
      }

      @media (min-height: 384px) {
        :host([inner-height="small-auto"]),
        :host([inner-height="small"]) {
          height: auto;
        }

        :host([inner-height="small"]) slot:not([name]) {
          height: 336px;
        }
      }

      @media (min-height: 544px) {
        :host([inner-height="medium-auto"]),
        :host([inner-height="medium"]) {
          height: auto;
        }

        :host([inner-height="medium"]) slot:not([name]) {
          height: 496px;
        }
      }

      @media (min-height: 704px) {
        :host([inner-height="large-auto"]),
        :host([inner-height="large"]) {
          height: auto;
        }

        :host([inner-height="large"]) slot:not([name]) {
          height: 656px;
        }
      }

      :host([inner-width]),
      :host([inner-width]) slot:not([name]) {
        width: 100%;
      }

      @media (min-width: 384px) {
        :host([inner-width="small-auto"]),
        :host([inner-width="small"]) {
          width: auto;
        }

        :host([inner-width="small"]) slot:not([name]) {
          width: 336px;
        }
      }

      @media (min-width: 544px) {
        :host([inner-width="medium-auto"]),
        :host([inner-width="medium"]) {
          width: auto;
        }

        :host([inner-width="medium"]) slot:not([name]) {
          width: 496px;
        }
      }

      @media (min-width: 704px) {
        :host([inner-width="large-auto"]),
        :host([inner-width="large"]) {
          width: auto;
        }

        :host([inner-width="large"]) slot:not([name]) {
          width: 656px;
        }
      }

      :host([no-overflow]) {
        overflow-x: hidden;
      }

      :host([no-wrap]) {
        flex: 1;
      }

      :host([outer-backdrop="large"]) {
        backdrop-filter: blur(0.75rem);
        -webkit-backdrop-filter: blur(0.75rem);
      }

      :host([outer-backdrop="medium"]) {
        backdrop-filter: blur(0.5rem);
        -webkit-backdrop-filter: blur(0.5rem);
      }

      :host([outer-backdrop="small"]) {
        backdrop-filter: blur(0.25rem);
        -webkit-backdrop-filter: blur(0.25rem);
      }

      :host([outer-height]) {
        height: 100%;
      }

      :host([outer-height][scrollable]) {
        max-height: none;
      }

      @media (min-height: 384px) {
        :host([outer-height="small"]) {
          height: 336px;
        }
      }

      @media (min-height: 544px) {
        :host([outer-height="medium"]) {
          height: 496px;
        }
      }

      @media (min-height: 704px) {
        :host([outer-height="large"]) {
          height: 656px;
        }
      }

      @media not screen and (min-width: 384px) {
        @media (min-height: 384px) {
          :host([outer-height="small"][outer-width="small"]) {
            height: 100%;
          }
        }

        @media (min-height: 544px) {
          :host([outer-height="medium"][outer-width="small"]) {
            height: 100%;
          }
        }

        @media (min-height: 704px) {
          :host([outer-height="large"][outer-width="small"]) {
            height: 100%;
          }
        }
      }

      @media not screen and (min-width: 544px) {
        @media (min-height: 384px) {
          :host([outer-height="small"][outer-width="medium"]) {
            height: 100%;
          }
        }

        @media (min-height: 544px) {
          :host([outer-height="medium"][outer-width="medium"]) {
            height: 100%;
          }
        }

        @media (min-height: 704px) {
          :host([outer-height="large"][outer-width="medium"]) {
            height: 100%;
          }
        }
      }

      @media not screen and (min-width: 704px) {
        @media (min-height: 384px) {
          :host([outer-height="small"][outer-width="large"]) {
            height: 100%;
          }
        }

        @media (min-height: 544px) {
          :host([outer-height="medium"][outer-width="large"]) {
            height: 100%;
          }
        }

        @media (min-height: 704px) {
          :host([outer-height="large"][outer-width="large"]) {
            height: 100%;
          }
        }
      }

      :host([outer-shadow="large"]) {
        box-shadow: var(--scola-node-outer-shadow-large, 0 0 0.75rem rgba(0, 0, 0, 0.35));
        z-index: 1;
      }

      :host([outer-shadow="medium"]) {
        box-shadow: var(--scola-node-outer-shadow-medium, 0 0 0.5rem rgba(0, 0, 0, 0.35));
        z-index: 1;
      }

      :host([outer-shadow="min"]) {
        box-shadow: 0 0 0 1px var(--scola-node-outer-shadow-min, #eee);
        z-index: 1;
      }

      :host([outer-shadow="small"]) {
        box-shadow: var(--scola-node-outer-shadow-small, 0 0 0.25rem rgba(0, 0, 0, 0.35));
        z-index: 1;
      }

      @media (-webkit-min-device-pixel-ratio: 2) {
        :host([outer-shadow="min"]) {
          box-shadow: 0 0 0 1px var(--scola-node-outer-shadow-min, #eee);
        }
      }

      :host([outer-shadow][hidden]) {
        box-shadow: none;
      }

      :host([outer-width]) {
        width: 100%;
      }

      :host([outer-width][scrollable]) {
        max-width: none;
      }

      @media (min-width: 384px) {
        :host([outer-width="small"]) {
          width: 336px;
        }
      }

      @media (min-width: 544px) {
        :host([outer-width="medium"]) {
          width: 496px;
        }
      }

      @media (min-width: 704px) {
        :host([outer-width="large"]) {
          width: 656px;
        }
      }

      @media not screen and (min-height: 384px) {
        @media (min-width: 384px) {
          :host([outer-height="small"][outer-width="small"]) {
            width: 100%;
          }
        }

        @media (min-width: 544px) {
          :host([outer-height="small"][outer-width="medium"]) {
            width: 100%;
          }
        }

        @media (min-width: 704px) {
          :host([outer-height="small"][outer-width="large"]) {
            width: 100%;
          }
        }
      }

      @media not screen and (min-height: 544px) {
        @media (min-width: 384px) {
          :host([outer-height="medium"][outer-width="small"]) {
            width: 100%;
          }
        }

        @media (min-width: 544px) {
          :host([outer-height="medium"][outer-width="medium"]) {
            width: 100%;
          }
        }

        @media (min-width: 704px) {
          :host([outer-height="medium"][outer-width="large"]) {
            width: 100%;
          }
        }
      }

      @media not screen and (min-height: 704px) {
        @media (min-width: 384px) {
          :host([outer-height="large"][outer-width="small"]) {
            width: 100%;
          }
        }

        @media (min-width: 544px) {
          :host([outer-height="large"][outer-width="medium"]) {
            width: 100%;
          }
        }

        @media (min-width: 704px) {
          :host([outer-height="large"][outer-width="large"]) {
            width: 100%;
          }
        }
      }

      :host([rows="1"]) {
        height: 4rem;
      }

      :host([rows="2"]) {
        height: 8rem;
      }

      :host([rows="3"]) {
        height: 12rem;
      }

      :host([rows="4"]) {
        height: 16rem;
      }

      :host([rows="5"]) {
        height: 20rem;
      }

      :host([rows="6"]) {
        height: 24rem;
      }

      :host([rows="7"]) {
        height: 28rem;
      }

      :host([rows="8"]) {
        height: 32rem;
      }

      :host([scrollable]) {
        max-height: 100%;
        max-width: 100%;
      }

      :host([spacing="large"]) {
        padding: 0.75rem;
      }

      :host([spacing="medium"]) {
        padding: 0.5rem;
      }

      :host([spacing="small"]) {
        padding: 0.25rem;
      }

      :host([vmargin="large"]),
      :host([margin="large"]) {
        margin-bottom: 0.75rem;
        margin-top: 0.75rem;
      }

      :host([vmargin="medium"]),
      :host([margin="medium"]) {
        margin-bottom: 0.5rem;
        margin-top: 0.5rem;
      }

      :host([vmargin="small"]),
      :host([margin="small"]) {
        margin-bottom: 0.25rem;
        margin-top: 0.25rem;
      }

      :host([vposition="bottom"]) {
        bottom: 0;
      }

      :host([vposition="top"]) {
        top: 0;
      }

      :host([weight="bold"]) {
        font-weight: 700;
      }

      :host([weight="light"]) {
        font-weight: 300;
      }

      :host([weight="medium"]) {
        font-weight: 500;
      }

      :host([width="auto"]) {
        flex: 1 0 auto;
        max-width: 100%;
      }

      :host([width="flex"]) {
        flex: 1;
      }

      :host([width="max"]) {
        width: 100%;
      }

      slot[name="body"] {
        box-sizing: border-box;
        display: inherit;
        overflow: inherit;
        position: relative;
      }

      :host([scrollable]) slot[name="body"] {
        flex: 1;
        display: block;
        overflow: auto;
        scrollbar-color: transparent transparent;
        -webkit-overflow-scrolling: touch;
      }

      :host([case="lower"]) slot[name="body"] {
        text-transform: lowercase;
      }

      :host([case="title"]) slot[name="body"] {
        text-transform: capitalize;
      }

      :host([case="upper"]) slot[name="body"] {
        text-transform: uppercase;
      }

      :host([color="aux-1"]) slot[name="body"] {
        color: var(--scola-node-color-aux-1, #000);
      }

      :host([color="aux-2"]) slot[name="body"] {
        color: var(--scola-node-color-aux-2, #777);
      }

      :host([color="aux-3"]) slot[name="body"] {
        color: var(--scola-node-color-aux-3, #fff);
      }

      :host([color="error"]) slot[name="body"] {
        color: var(--scola-node-color-aux-3, #b22222);
      }

      :host([color="sig-1"]) slot[name="body"] {
        color: var(--scola-node-color-sig-1, #b22222);
      }

      :host([color="sig-2"]) slot[name="body"] {
        color: var(--scola-node-color-sig-2, #008000);
      }

      :host([rows]) slot[name="body"] {
        flex: 1;
      }

      :host([fill="aux-1"]) slot[name="body"] {
        background: var(--scola-node-fill-aux-1, #fff);
      }

      :host([fill="aux-2"]) slot[name="body"] {
        background: var(--scola-node-fill-aux-2, #eee);
      }

      :host([fill="aux-3"]) slot[name="body"] {
        background: var(--scola-node-fill-aux-3, #ddd);
      }

      :host([fill="error"]) slot[name="body"] {
        background: var(--scola-node-fill-error, #b22222);
      }

      :host([fill="sig-1"]) slot[name="body"] {
        background: var(--scola-node-fill-sig-1, #b22222);
      }

      :host([fill="sig-2"]) slot[name="body"] {
        background: var(--scola-node-fill-sig-2, #008000);
      }

      :host([fill="translucent"]) slot[name="body"] {
        background: var(--scola-node-fill-translucent, rgba(255, 255, 255, 0.25));
      }

      @media (hover) {
        :host([fill-hover="aux-1"]) slot[name="body"]:hover {
          background: var(--scola-node-fill-hover-aux-1, #ddd);
        }

        :host([fill-hover="aux-2"]) slot[name="body"]:hover {
          background: var(--scola-node-fill-hover-aux-2, #ccc);
        }

        :host([fill-hover="aux-3"]) slot[name="body"]:hover {
          background: var(--scola-node-fill-hover-aux-3, #bbb);
        }

        :host([fill-hover="sig-1"]) slot[name="body"]:hover {
          background: var(--scola-node-fill-hover-sig-1, #9a0000);
        }

        :host([fill-hover="sig-2"]) slot[name="body"]:hover {
          background: var(--scola-node-fill-hover-sig-2, #009000);
        }

        :host([fill="aux-1"][scrollable]) slot[name="body"]:hover {
          scrollbar-color: var(--scola-scrollbar-color-aux-1, #ddd) transparent;
        }

        :host([fill="aux-2"][scrollable]) slot[name="body"]:hover {
          scrollbar-color: var(--scola-scrollbar-color-aux-2, #ccc) transparent;
        }

        :host([fill="aux-3"][scrollable]) slot[name="body"]:hover {
          scrollbar-color: var(--scola-scrollbar-color-aux-3, #bbb) transparent;
        }

        :host([scrollable]) slot[name="body"]::-webkit-scrollbar {
          width: 0.75rem;
        }

        :host([fill="aux-1"][scrollable]) slot[name="body"]:hover::-webkit-scrollbar-thumb {
          background: var(--scola-scrollbar-color-aux-1, #ddd);
        }

        :host([fill="aux-2"][scrollable]) slot[name="body"]:hover::-webkit-scrollbar-thumb {
          background: var(--scola-scrollbar-color-aux-2, #ccc);
        }

        :host([fill="aux-3"][scrollable]) slot[name="body"]:hover::-webkit-scrollbar-thumb {
          background: var(--scola-scrollbar-color-aux-3, #bbb);
        }
      }

      :host([fill-active="aux-1"]) slot[name="body"]:active {
        background: var(--scola-node-fill-active-aux-1, #ccc);
      }

      :host([fill-active="aux-2"]) slot[name="body"]:active {
        background: var(--scola-node-fill-active-aux-2, #bbb);
      }

      :host([fill-active="aux-3"]) slot[name="body"]:active {
        background: var(--scola-node-fill-active-aux-3, #aaa);
      }

      :host([fill-active="sig-1"]) slot[name="body"]:active {
        background: var(--scola-node-fill-active-sig-1, #8a0000);
      }

      :host([fill-active="sig-2"]) slot[name="body"]:active {
        background: var(--scola-node-fill-active-sig-2, #00bf00);
      }

      :host([flow="column"]) slot[name="body"] {
        flex-direction: column;
      }

      :host([flow="row"]) slot[name="body"] {
        flex-direction: row;
      }

      :host([font="large"]) slot[name="body"] {
        font-size: 1.25rem;
      }

      :host([font="medium"]) slot[name="body"] {
        font-size: 1.125rem;
      }

      :host([font="small"]) slot[name="body"] {
        font-size: 0.875rem;
      }

      :host([halign="center"][flow="column"]) slot[name="body"] {
        align-items: center;
      }

      :host([halign="end"][flow="column"]) slot[name="body"] {
        align-items: flex-end;
      }

      :host([halign="start"][flow="column"]) slot[name="body"] {
        align-items: flex-start;
      }

      :host([halign="between"][flow="row"]) slot[name="body"] {
        justify-content: space-between;
      }

      :host([halign="center"][flow="row"]) slot[name="body"] {
        justify-content: center;
      }

      :host([halign="end"][flow="row"]) slot[name="body"] {
        justify-content: flex-end;
      }

      :host([halign="evenly"][flow="row"]) slot[name="body"] {
        justify-content: space-evenly;
      }

      :host([halign="start"][flow="row"]) slot[name="body"] {
        justify-content: flex-start;
      }

      :host([height="auto"]) slot[name="body"] {
        flex: 1 0 auto;
        max-height: 100%;
      }

      :host([height="flex"]) slot[name="body"] {
        flex: 1;
      }

      :host([height="large"]) slot[name="body"] {
        height: 4.25rem;
      }

      :host([height="max"]) slot[name="body"] {
        height: 100%;
      }

      :host([height="medium"]) slot[name="body"] {
        height: 3.25rem;
      }

      :host([height="min"]) slot[name="body"] {
        height: 1px;
      }

      :host([height="small"]) slot[name="body"] {
        height: 2.25rem;
      }

      :host([hpadding="large"]) slot[name="body"],
      :host([padding="large"]) slot[name="body"] {
        padding-left: 0.75rem;
        padding-right: 0.75rem;
      }

      :host([hpadding="medium"]) slot[name="body"],
      :host([padding="medium"]) slot[name="body"] {
        padding-left: 0.5rem;
        padding-right: 0.5rem;
      }

      :host([hpadding="small"]) slot[name="body"],
      :host([padding="small"]) slot[name="body"] {
        padding-left: 0.25rem;
        padding-right: 0.25rem;
      }

      :host([inner-shadow="large"]) slot[name="body"] {
        box-shadow: var(--scola-node-inner-shadow-large, 0 0 0.75rem rgba(0, 0, 0, 0.35));
      }

      :host([inner-shadow="medium"]) slot[name="body"] {
        box-shadow: var(--scola-node-inner-shadow-medium, 0 0 0.5rem rgba(0, 0, 0, 0.35));
      }

      :host([inner-shadow="small"]) slot[name="body"] {
        box-shadow: var(--scola-node-inner-shadow-small, 0 0 0.25rem rgba(0, 0, 0, 0.35));
      }

      :host([line="large"]) slot[name="body"] {
        line-height: 1.5rem;
      }

      :host([line="medium"]) slot[name="body"] {
        line-height: 1.25rem;
      }

      :host([line="small"]) slot[name="body"] {
        line-height: 0.75rem;
      }

      :host([round]) slot[name="body"] {
        overflow: hidden;
        will-change: transform;
      }

      :host([round="large"]) slot[name="body"] {
        border-radius: 0.75rem;
      }

      :host([round="medium"]) slot[name="body"] {
        border-radius: 0.5rem;
      }

      :host([round="max"]) slot[name="body"] {
        border-radius: 50%;
      }

      :host([round="small"]) slot[name="body"] {
        border-radius: 0.25rem;
      }

      :host([valign="between"][flow="column"]) slot[name="body"] {
        justify-content: space-between;
      }

      :host([valign="center"][flow="column"]) slot[name="body"] {
        justify-content: center;
      }

      :host([valign="end"][flow="column"]) slot[name="body"] {
        justify-content: flex-end;
      }

      :host([valign="evenly"][flow="column"]) slot[name="body"] {
        justify-content: space-evenly;
      }

      :host([valign="start"][flow="column"]) slot[name="body"] {
        justify-content: flex-start;
      }

      :host([valign="center"][flow="row"]) slot[name="body"] {
        align-items: center;
      }

      :host([valign="end"][flow="row"]) slot[name="body"] {
        align-items: flex-end;
      }

      :host([valign="start"][flow="row"]) slot[name="body"] {
        align-items: flex-start;
      }

      :host([vpadding="large"]) slot[name="body"],
      :host([padding="large"]) slot[name="body"] {
        padding-bottom: 0.75rem;
        padding-top: 0.75rem;
      }

      :host([vpadding="medium"]) slot[name="body"],
      :host([padding="medium"]) slot[name="body"] {
        padding-bottom: 0.5rem;
        padding-top: 0.5rem;
      }

      :host([vpadding="small"]) slot[name="body"],
      :host([padding="small"]) slot[name="body"] {
        padding-bottom: 0.25rem;
        padding-top: 0.25rem;
      }

      :host([width="auto"]) slot[name="body"] {
        width: auto;
      }

      :host([width="large"]) slot[name="body"] {
        width: 4.25rem;
      }

      :host([width="max"]) slot[name="body"] {
        width: 100%;
      }

      :host([width="medium"]) slot[name="body"] {
        width: 3.25rem;
      }

      :host([width="min"]) slot[name="body"] {
        width: 1px;
      }

      :host([width="small"]) slot[name="body"] {
        width: 2.25rem;
      }

      :host([wrap]) slot[name="body"] {
        flex-wrap: wrap;
      }

      slot[name="footer"]::slotted(*),
      slot[name="header"]::slotted(*) {
        z-index: 1;
      }

      slot[name="body"] slot {
        align-items: inherit;
        display: inherit;
        flex-direction: inherit;
        justify-content: inherit;
      }

      slot:not([name]) {
        flex: 1;
        flex-wrap: inherit;
        overflow: inherit;
      }

      :host([no-wrap]) slot:not([name]) {
        display: inline-block;
        overflow: inherit;
        text-align: inherit;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `
  ]

  @property({
    attribute: 'at-large',
    reflect: true,
    type: Boolean
  })
  public atLarge?: boolean

  @property({
    attribute: 'at-medium',
    reflect: true,
    type: Boolean
  })
  public atMedium?: boolean

  @property({
    attribute: 'at-small',
    reflect: true,
    type: Boolean
  })
  public atSmall?: boolean

  @property({
    reflect: true
  })
  public case?: 'lower' | 'title' | 'upper'

  @property({
    reflect: true
  })
  public color?: 'aux-1' | 'aux-2' | 'aux-3' | 'error' | 'sig-1' | 'sig-2'

  @property({
    reflect: true,
    type: Number
  })
  public cols?: number

  @property({
    reflect: true
  })
  public dir: string

  @property({
    reflect: true,
    type: Boolean
  })
  public disabled?: boolean

  @property({
    reflect: true
  })
  public fill?: 'aux-1' | 'aux-2' | 'aux-3' | 'error' | 'sig-1' | 'sig-2' | 'translucent'

  @property({
    attribute: 'fill-active',
    reflect: true
  })
  public fillActive?: 'aux-1' | 'aux-2' | 'aux-3' | 'sig-1' | 'sig-2'

  @property({
    attribute: 'fill-hover',
    reflect: true
  })
  public fillHover?: 'aux-1' | 'aux-2' | 'aux-3' | 'sig-1' | 'sig-2'

  @property({
    reflect: true
  })
  public flow?: 'column' | 'row'

  @property({
    reflect: true
  })
  public font?: 'large' | 'medium' | 'small'

  @property({
    reflect: true
  })
  public halign?: 'between' | 'center' | 'end' | 'evenly' | 'start'

  @property({
    reflect: true
  })
  public height?: 'auto' | 'flex' | 'large' | 'max' | 'medium' | 'min' | 'small'

  @property({
    reflect: true,
    type: Boolean
  })
  public hidden: boolean

  @property({
    reflect: true
  })
  public hmargin?: 'large' | 'medium' | 'small'

  @property({
    reflect: true
  })
  public hpadding?: 'large' | 'medium' | 'small'

  @property({
    reflect: true
  })
  public hposition?: 'end' | 'start'

  @property({
    attribute: 'inner-backdrop',
    reflect: true
  })
  public innerBackdrop?: 'large' | 'medium' | 'small'

  @property({
    attribute: 'inner-height',
    reflect: true
  })
  public innerHeight?: 'large' | 'medium' | 'small'

  @property({
    attribute: 'inner-shadow',
    reflect: true
  })
  public innerShadow?: 'large' | 'medium' | 'small'

  @property({
    attribute: 'inner-width',
    reflect: true
  })
  public innerWidth: 'large' | 'medium-auto' | 'medium' | 'small'

  @property()
  public is?: string

  @property({
    reflect: true
  })
  public line?: 'large' | 'medium' | 'small'

  @property({
    attribute: 'log-level'
  })
  public logLevel: Log['level'] = 'off'

  @property({
    attribute: false
  })
  public logs: Log[] = []

  @property({
    reflect: true
  })
  public margin?: 'large' | 'medium' | 'small'

  @property({
    attribute: 'no-context',
    type: Boolean
  })
  public noContext?: boolean

  @property({
    attribute: 'no-overflow',
    reflect: true,
    type: Boolean
  })
  public noOverflow?: boolean

  @property({
    attribute: 'no-wrap',
    reflect: true,
    type: Boolean
  })
  public noWrap?: boolean

  @property()
  public observe?: string

  @property({
    attribute: 'outer-backdrop',
    reflect: true
  })
  public outerBackdrop?: 'large' | 'medium' | 'small'

  @property({
    attribute: 'outer-height',
    reflect: true
  })
  public outerHeight?: 'large' | 'medium' | 'small'

  @property({
    attribute: 'outer-shadow',
    reflect: true
  })
  public outerShadow?: 'large' | 'medium' | 'min' | 'small'

  @property({
    attribute: 'outer-width',
    reflect: true
  })
  public outerWidth?: 'large' | 'medium' | 'small'

  @property({
    reflect: true
  })
  public padding?: 'large' | 'medium' | 'small'

  @property()
  public preset?: keyof Presets

  @property({
    reflect: true
  })
  public round?: 'large' | 'max' | 'medium' | 'small'

  @property({
    reflect: true,
    type: Number
  })
  public rows?: number

  @property({
    reflect: true,
    type: Boolean
  })
  public scrollable?: boolean

  @property({
    reflect: true
  })
  public spacing?: 'large' | 'medium' | 'small'

  @property({
    reflect: true
  })
  public valign?: 'between' | 'center' | 'end' | 'evenly' | 'start'

  @property({
    reflect: true
  })
  public vmargin?: 'large' | 'medium' | 'small'

  @property({
    reflect: true
  })
  public vpadding?: 'large' | 'medium' | 'small'

  @property({
    reflect: true
  })
  public vposition?: 'bottom' | 'top'

  @property({
    reflect: true
  })
  public weight?: 'bold' | 'light' | 'medium'

  @property({
    reflect: true
  })
  public width?: 'auto' | 'flex' | 'large' | 'max' | 'medium' | 'min' | 'small'

  @property({
    reflect: true,
    type: Boolean
  })
  public wrap?: boolean

  @query('slot[name="after"]', true)
  protected afterSlotElement?: HTMLSlotElement

  @query('slot[name="before"]', true)
  protected beforeSlotElement?: HTMLSlotElement

  @query('slot[name="body"]', true)
  protected bodySlotElement?: HTMLSlotElement

  @query('slot:not([name])', true)
  protected defaultSlotElement?: HTMLSlotElement

  @query('slot[name="footer"]', true)
  protected footerSlotElement?: HTMLSlotElement

  @query('slot[name="header"]', true)
  protected headerSlotElement?: HTMLSlotElement

  @query('slot[name="prefix"]', true)
  protected prefixSlotElement?: HTMLSlotElement

  @query('slot[name="suffix"]', true)
  protected suffixSlotElement?: HTMLSlotElement

  protected easingIds: Record<string, number | null> = {}

  protected handleScrollBound: () => void

  protected observers: Set<NodeElement> = new Set<NodeElement>()

  public constructor () {
    super()
    this.handleScrollBound = this.throttle(this.handleScroll.bind(this))
  }

  public addObserver (element: NodeElement): void {
    this.observers.add(element)
  }

  public connectedCallback (): void {
    if (this.logLevel !== 'off') {
      this.addEventListener('scola-log', this.handleLog.bind(this))
    }

    if (this.noContext === true) {
      this.addEventListener('contextmenu', this.handleContextmenu.bind(this))
    }

    this.preset?.split(' ').forEach((preset) => {
      const undef: Record<string, unknown> = {}

      Object
        .keys(NodeElement.presets[preset as keyof Presets] ?? {})
        .forEach((name) => {
          if (this[name as keyof NodeElement] === undefined) {
            undef[name] = NodeElement.presets[preset as keyof Presets]?.[name]
          }
        })

      Object.assign(this, undef)
    })

    this.observe?.split(' ').forEach((id) => {
      const element = document.getElementById(id)

      if (element instanceof NodeElement) {
        element.addObserver(this)
      }
    })

    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    this.observe?.split(' ').forEach((id) => {
      const element = document.getElementById(id)

      if (element instanceof NodeElement) {
        element.removeObserver(this)
      }
    })

    this.observers.clear()
    super.disconnectedCallback()
  }

  public firstUpdated (properties: PropertyValues): void {
    if (this.scrollable === true) {
      this.bodySlotElement?.addEventListener('scroll', this.handleScrollBound)
    }

    super.firstUpdated(properties)
  }

  public observedUpdated (properties: PropertyValues, target: NodeElement): void

  public observedUpdated (): void {}

  public removeObserver (element: NodeElement): void {
    this.observers.delete(element)
  }

  public render (): TemplateResult {
    return html`
      <slot name="header"></slot>
      <slot name="body">
        <slot name="before"></slot>
        <slot name="prefix"></slot>
        <slot></slot>
        <slot name="suffix"></slot>
        <slot name="after"></slot>
      </slot>
      <slot name="footer"></slot>
    `
  }

  public updated (properties: PropertyValues): void {
    this.observers.forEach((observer) => {
      observer.observedUpdated(properties, this)
    })
  }

  protected ease (from: number, to: number, resolve: ({ value, done }: { value: number, done: boolean }) => void, { duration = 250, name }: { duration?: number, name?: string } = {}): void {
    let easingId = null
    let start = -1

    if (name !== undefined) {
      easingId = this.easingIds[name]

      if (easingId !== null) {
        window.cancelAnimationFrame(easingId)
        this.easingIds[name] = null
      }
    }

    // @see https://easings.net/#easeInOutQuint
    function easeInOutQuint (value: number): number {
      return value < 0.5 ? 16 * value ** 5 : 1 - (-2 * value + 2) ** 5 / 2
    }

    const frame = (time: number): void => {
      start = start === -1 ? time : start

      if (time - start >= duration) {
        resolve({
          done: true,
          value: to
        })

        if (name !== undefined) {
          this.easingIds[name] = null
        }
      } else {
        resolve({
          done: false,
          value: from + (to - from) * easeInOutQuint((time - start) / duration)
        })

        easingId = window.requestAnimationFrame(frame)

        if (name !== undefined) {
          this.easingIds[name] = easingId
        }
      }
    }

    easingId = window.requestAnimationFrame(frame)

    if (name !== undefined) {
      this.easingIds[name] = easingId
    }
  }

  protected handleContextmenu (event: Event): boolean {
    event.preventDefault()
    return false
  }

  protected handleLog (event: LogEvent): void {
    if (event.detail !== null && LogLevel[event.detail.level] >= LogLevel[this.logLevel]) {
      event.cancelBubble = true
      this.logs.push(event.detail)
      this.requestUpdateInternal('logs')
    }
  }

  protected handleScroll (): void {
    this.dispatchEvent(new CustomEvent<NodeEvent['detail']>('scola-scroll', {
      bubbles: true,
      composed: true,
      detail: {
        origin: this
      }
    }))
  }

  protected isTarget (event: NodeEvent, element: Element = this): boolean {
    if (event.detail?.target !== undefined) {
      if (event.detail.target !== element.id) {
        return false
      }
    } else if (!event.composedPath().includes(element)) {
      return false
    }

    return true
  }

  protected throttle (resolve: () => void, { duration = 250, once = false, trail = true } = {}): () => void {
    let diff = 0
    let last = 0
    let tid = 0

    return (...args): void => {
      diff = Date.now() - last
      window.clearTimeout(tid)

      if (once) {
        if (!trail && tid === 0) {
          resolve(...args)
        }
      } else if (diff > duration) {
        resolve(...args)
        last = Date.now()
        diff = 0
      }

      tid = window.setTimeout(() => {
        if (trail) {
          resolve(...args)
          last = Date.now()
        }
        tid = 0
      }, once ? duration : duration - diff)
    }
  }
}
