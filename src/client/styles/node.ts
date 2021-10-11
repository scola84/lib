/* eslint-disable max-lines-per-function */

import { css, unsafeCSS } from 'lit'

const breakpoints = [{
  name: '',
  query: '@media all'
}, {
  name: '@mobile',
  query: '@media not all and (min-width: 768px)'
}, {
  name: '@tablet',
  query: '@media (min-width: 768px) and (max-width: 1024px)'
}, {
  name: '@desktop',
  query: '@media not all and (max-width: 1024px)'
}]

const sizes = new Array(64)
  .fill('')
  .map((fill, index) => {
    return index + 1
  })

export default css`
  :host {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  :host([disabled]) {
    filter: grayscale(50%) opacity(50%);
    pointer-events: none;
  }

  :host([display]) {
    display: none;
  }

  :host([fade]) {
    opacity: 1;
    transition: opacity 250ms cubic-bezier(0.83, 0, 0.17, 1);
  }

  :host([hidden][fade]) {
    opacity: 0;
    pointer-events: none;
  }

  :host([hidden]:not([fade])) {
    display: none;
  }

  :host([hposition]) {
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

  :host([vposition]) {
    position: absolute;
    z-index: 9;
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

  slot[name="body"] {
    box-sizing: border-box;
    display: inherit;
    overflow: inherit;
    position: relative;
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

  :host([cursor="default"]) slot[name="body"] {
    cursor: default;
  }

  :host([cursor="pointer"]) slot[name="body"] {
    cursor: pointer;
  }

  :host([cursor="text"]) slot[name="body"] {
    cursor: text;
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

    :host([fill="translucent"]) slot[name="body"]:hover {
      background: var(--scola-node-fill-translucent, rgba(255, 255, 255, 0.30));
    }

    :host([fill="aux-1"][scrollbar]) slot[name="body"]:hover {
      scrollbar-color: var(--scola-scrollbar-color-aux-1, #ddd) transparent;
    }

    :host([fill="aux-2"][scrollbar]) slot[name="body"]:hover {
      scrollbar-color: var(--scola-scrollbar-color-aux-2, #ccc) transparent;
    }

    :host([fill="aux-3"][scrollbar]) slot[name="body"]:hover {
      scrollbar-color: var(--scola-scrollbar-color-aux-3, #bbb) transparent;
    }

    :host([fill="aux-1"][scrollbar]) slot[name="body"]:hover::-webkit-scrollbar-thumb {
      background: var(--scola-scrollbar-color-aux-1, #ddd);
    }

    :host([fill="aux-2"][scrollbar]) slot[name="body"]:hover::-webkit-scrollbar-thumb {
      background: var(--scola-scrollbar-color-aux-2, #ccc);
    }

    :host([fill="aux-3"][scrollbar]) slot[name="body"]:hover::-webkit-scrollbar-thumb {
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

  :host([fill-active="translucent"]) slot[name="body"]:active {
    background: var(--scola-node-fill-translucent, rgba(255, 255, 255, 0.35));
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

  :host([height]) slot[name="body"] {
    flex: 1;
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

  :host([scrollbar]) slot[name="body"] {
    overflow: auto;
    scrollbar-color: transparent transparent;
    -webkit-overflow-scrolling: touch;
  }

  :host([scrollbar][height]) slot[name="body"] {
    display: block;
  }

  :host([scrollbar="large"]) slot[name="body"] {
    scrollbar-width: auto;
  }

  :host([scrollbar="large"]) slot[name="body"]::-webkit-scrollbar {
    height: 0.75rem;
    width: 0.75rem;
  }

  :host([scrollbar="small"]) slot[name="body"] {
    scrollbar-width: thin;
  }

  :host([scrollbar="small"]) slot[name="body"]::-webkit-scrollbar {
    height: 0.25rem;
    width: 0.25rem;
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

  :host([no-wrap]) slot:not([name]) {
    display: inline-block;
    overflow: inherit;
    text-align: inherit;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :host([scrollbar][flow="row"]) slot:not([name]) {
    flex: 1 0 auto;
  }

  ${breakpoints.reduce((breakpointResult, breakpoint) => {
    const unsafe = {
      name: unsafeCSS(breakpoint.name),
      query: unsafeCSS(breakpoint.query)
    }

    return css`
      ${breakpointResult}

      ${unsafe.query} ${unsafeCSS('{')}
        :host::after {
          content: "${unsafe.name}";
          display: none;
        }

        :host([display~="${unsafe.name}"]) {
          display: inline-flex;
        }

        :host([height~="auto${unsafe.name}"]) {
          flex: 1 0 auto;
          max-height: 100%;
        }

        :host([height~="flex${unsafe.name}"]) {
          flex: 1;
        }

        :host([height~="max${unsafe.name}"]) {
          height: 100%;
        }

        :host([height~="min${unsafe.name}"]) {
          height: 1px;
        }

        :host([hmargin~="large${unsafe.name}"]) {
          margin-left: 0.75rem;
          margin-right: 0.75rem;
        }

        :host([hmargin~="medium${unsafe.name}"]) {
          margin-left: 0.5rem;
          margin-right: 0.5rem;
        }

        :host([hmargin~="small${unsafe.name}"]) {
          margin-left: 0.25rem;
          margin-right: 0.25rem;
        }

        :host([margin~="large${unsafe.name}"]) {
          margin: 0.75rem;
        }

        :host([margin~="medium${unsafe.name}"]) {
          margin: 0.5rem;
        }

        :host([margin~="small${unsafe.name}"]) {
          margin: 0.25rem;
        }

        :host([outer-shadow~="large${unsafe.name}"]) {
          box-shadow: var(--scola-node-outer-shadow-large, 0 0 0.75rem rgba(0, 0, 0, 0.35));
        }

        :host([outer-shadow~="medium${unsafe.name}"]) {
          box-shadow: var(--scola-node-outer-shadow-medium, 0 0 0.5rem rgba(0, 0, 0, 0.35));
        }

        :host([outer-shadow~="min${unsafe.name}"]) {
          box-shadow: 0 0 0 1px var(--scola-node-outer-shadow-min, #eee);
        }

        :host([outer-shadow~="small${unsafe.name}"]) {
          box-shadow: var(--scola-node-outer-shadow-small, 0 0 0.25rem rgba(0, 0, 0, 0.35));
        }

        :host([spacing~="large${unsafe.name}"]) {
          padding: 0.75rem;
        }

        :host([spacing~="medium${unsafe.name}"]) {
          padding: 0.5rem;
        }

        :host([spacing~="small${unsafe.name}"]) {
          padding: 0.25rem;
        }

        :host([vmargin~="large${unsafe.name}"]) {
          margin-bottom: 0.75rem;
          margin-top: 0.75rem;
        }

        :host([vmargin~="medium${unsafe.name}"]) {
          margin-bottom: 0.5rem;
          margin-top: 0.5rem;
        }

        :host([vmargin~="small${unsafe.name}"]) {
          margin-bottom: 0.25rem;
          margin-top: 0.25rem;
        }

        :host([width~="auto${unsafe.name}"]) {
          flex: 1 0 auto;
          max-width: 100%;
        }

        :host([width~="flex${unsafe.name}"]) {
          flex: 1;
        }

        :host([width~="max${unsafe.name}"]) {
          width: 100%;
        }

        :host([width~="min${unsafe.name}"]) {
          width: 1px;
        }

        :host([hpadding~="large${unsafe.name}"]) slot[name="body"] {
          padding-left: 0.75rem;
          padding-right: 0.75rem;
        }

        :host([hpadding~="medium${unsafe.name}"]) slot[name="body"] {
          padding-left: 0.5rem;
          padding-right: 0.5rem;
        }

        :host([hpadding~="small${unsafe.name}"]) slot[name="body"] {
          padding-left: 0.25rem;
          padding-right: 0.25rem;
        }

        :host([round~="large${unsafe.name}"]) slot[name="body"] {
          border-radius: 0.75rem;
        }

        :host([round~="medium${unsafe.name}"]) slot[name="body"] {
          border-radius: 0.5rem;
        }

        :host([round~="max${unsafe.name}"]) slot[name="body"] {
          border-radius: 50%;
        }

        :host([round~="small${unsafe.name}"]) slot[name="body"] {
          border-radius: 0.25rem;
        }

        :host([vpadding~="large${unsafe.name}"]) slot[name="body"] {
          padding-bottom: 0.75rem;
          padding-top: 0.75rem;
        }

        :host([vpadding~="medium${unsafe.name}"]) slot[name="body"] {
          padding-bottom: 0.5rem;
          padding-top: 0.5rem;
        }

        :host([vpadding~="small${unsafe.name}"]) slot[name="body"] {
          padding-bottom: 0.25rem;
          padding-top: 0.25rem;
        }

        :host([inner-height~="max${unsafe.name}"]) slot:not([name]) {
          height: 100%;
        }

        :host([inner-height~="min${unsafe.name}"]) slot:not([name]) {
          height: 1px;
        }

        :host([inner-spacing~="large${unsafe.name}"]) slot:not([name]) {
          padding: 0.75rem;
        }

        :host([inner-spacing~="medium${unsafe.name}"]) slot:not([name]) {
          padding: 0.5rem;
        }

        :host([inner-spacing~="small${unsafe.name}"]) slot:not([name]) {
          padding: 0.25rem;
        }

        :host([inner-width~="max${unsafe.name}"]) slot:not([name]) {
          width: 100%;
        }

        :host([inner-width~="min${unsafe.name}"]) slot:not([name]) {
          width: 1px;
        }

        ${sizes.reduce((sizeResult, size) => {
          return css`
            ${sizeResult}

            :host([height~="${size}${unsafe.name}"]) {
              height: ${unsafeCSS(`${size}rem`)};
            }

            :host([max-height~="${size}${unsafe.name}"]) {
              max-height: ${unsafeCSS(`${size}rem`)};
            }

            :host([max-width~="${size}${unsafe.name}"]) {
              max-width: ${unsafeCSS(`${size}rem`)};
            }

            :host([width~="${size}${unsafe.name}"]) {
              width: ${unsafeCSS(`${size}rem`)};
            }

            :host([inner-height~="${size}${unsafe.name}"]) slot:not([name]) {
              height: ${unsafeCSS(`${size}rem`)};
            }

            :host([inner-width~="${size}${unsafe.name}"]) slot:not([name]) {
              width: ${unsafeCSS(`${size}rem`)};
            }
          `
        }, css``)}
      ${unsafeCSS('}')}
    `
  }, css``)}
`
