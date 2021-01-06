import type {
  CSSResult,
  PropertyValues
} from 'lit-element'
import {
  css,
  customElement,
  property
} from 'lit-element'

import { NodeElement } from './node'
import type { NodeEvent } from './node'
import type { ViewMoveEvent } from './view'

declare global {
  interface HTMLElementEventMap {
    'scola-clip-content': NodeEvent
    'scola-clip-content-or-inner': NodeEvent
    'scola-clip-inner': NodeEvent
    'scola-clip-nested': NodeEvent
    'scola-clip-outer': NodeEvent
  }

  interface HTMLElementTagNameMap {
    'scola-clip': ClipElement
  }
}

@customElement('scola-clip')
export class ClipElement extends NodeElement {
  public static styles: CSSResult[] = [
    ...NodeElement.styles,
    css`
      slot[name="body"] {
        overflow: hidden;
      }

      slot[name="body"] slot[name] {
        z-index: 2;
      }

      :host([type="content"]) slot:not([name])::slotted(*) {
        display: flex;
        flex: 0 0 100%;
        height: 100%;
        width: 100%;
      }

      :host([type="outer"]) slot[name="after"]::slotted(*),
      :host([type="outer"]) slot[name="before"]::slotted(*) {
        position: absolute;
        z-index: 2;
      }

      :host([type="outer"][flow="column"]) slot[name="after"]::slotted(*) {
        bottom: 0;
      }

      :host([type="outer"][flow="column"]) slot[name="before"]::slotted(*) {
        top: 0;
      }

      :host([type="outer"][flow="row"]) slot[name="after"]::slotted(*) {
        right: 0;
      }

      :host([type="outer"][flow="row"][dir="rtl"]) slot[name="after"]::slotted(*) {
        left: 0;
        right: auto;
      }

      :host([type="outer"][flow="row"]) slot[name="before"]::slotted(*) {
        left: 0;
      }

      :host([type="outer"][flow="row"][dir="rtl"]) slot[name="before"]::slotted(*) {
        left: auto;
        right: 0;
      }
    `
  ]

  @property()
  public amount?: 'any' | 'max-one' | 'min-one' | 'one'

  @property({
    attribute: 'content-dimension'
  })
  public contentDimension?: 'height' | 'width'

  @property({
    attribute: 'content-duration',
    type: Number
  })
  public contentDuration?: number

  @property({
    attribute: 'inner-duration',
    type: Number
  })
  public innerDuration?: number

  @property({
    attribute: 'inner-hidden',
    type: Boolean
  })
  public innerHidden?: boolean

  @property({
    attribute: 'outer-duration',
    type: Number
  })
  public outerDuration?: number

  @property({
    reflect: true
  })
  public type?: 'content' | 'inner' | 'nested' | 'outer'

  protected get contentElements (): NodeListOf<HTMLElement> {
    return this.querySelectorAll(':scope > :not([slot])')
  }

  protected get handleElement (): HTMLElement | null {
    return this.querySelector(':scope > [is="handle"]')
  }

  protected get outerElements (): NodeListOf<HTMLElement> {
    return this.querySelectorAll(':scope > [slot="after"], :scope > [slot="before"]')
  }

  public constructor () {
    super()
    this.dir = document.dir
    this.addEventListener('click', this.handleClick.bind(this))
    this.addEventListener('scola-view-move', this.handleViewMove.bind(this))
  }

  public firstUpdated (properties: PropertyValues): void {
    switch (this.type) {
      case 'content':
        this.addEventListener('scola-clip-content', this.handleContent.bind(this))
        this.addEventListener('scola-clip-content-or-inner', this.handleContentOrInner.bind(this))
        this.firstUpdatedContent()
        break
      case 'inner':
        this.addEventListener('scola-clip-inner', this.handleInner.bind(this))
        if (this.innerHidden === true) {
          this.firstUpdatedInner()
        }
        break
      case 'nested':
        this.addEventListener('scola-clip-nested', this.handleNested.bind(this))
        break
      case 'outer':
        this.addEventListener('scola-clip-outer', this.handleOuter.bind(this))
        this.firstUpdatedOuter()
        break
      default:
        break
    }

    super.firstUpdated(properties)
  }

  public hideContent (element: HTMLElement): void {
    element.hidden = true
  }

  public hideInner (
    duration = this.innerDuration,
    callback = (): void => {}
  ): void {
    const name = this.determineInnerPropertyName()

    let to = this.defaultSlotElement instanceof HTMLSlotElement
      ? this.determineInnerPropertyValue(this.defaultSlotElement)
      : 0

    to = Number.isNaN(to) ? 0 : to

    this.ease(0, to, ({ done, value }) => {
      this.defaultSlotElement?.style.setProperty(name, `-${value}px`)

      if (done) {
        if (this.defaultSlotElement instanceof HTMLSlotElement) {
          this.defaultSlotElement.hidden = true
        }

        callback()
      }
    }, {
      duration,
      name: 'inner'
    })
  }

  public hideOuter (
    element: HTMLElement,
    duration = this.outerDuration,
    callback = (): void => {}
  ): void {
    if (window.getComputedStyle(element).position === 'relative') {
      this.setZIndexRelative(element)
    }

    const name = this.determineOuterPropertyName(element)
    let to = this.determineOuterPropertyValue(element)
    to = Number.isNaN(to) ? 0 : to

    this.ease(0, to, ({ done, value }) => {
      element.style.setProperty(name, `-${value}px`)

      if (done) {
        if (window.getComputedStyle(element).position === 'absolute') {
          element.style.removeProperty('z-index')
        }

        element.hidden = true
        callback()
      }
    }, {
      duration,
      name: `outer-${element.id}`
    })
  }

  public showContent (
    element: HTMLElement,
    duration = this.contentDuration,
    callback = (): void => {}
  ): void {
    const contentElements = Array.from(this.contentElements)

    const dimensionName = this.flow === 'row' ? 'width' : 'height'
    const scrollName = this.flow === 'row' ? 'scrollLeft' : 'scrollTop'

    const from = this.defaultSlotElement instanceof HTMLSlotElement
      ? this.defaultSlotElement[scrollName]
      : 0

    const to =
      contentElements.indexOf(element) *
      element.getBoundingClientRect()[dimensionName] *
      (this.dir === 'rtl' ? -1 : 1)

    contentElements.forEach((contentElement) => {
      contentElement.hidden = contentElement !== element
    })

    this.ease(from, to, ({ done, value }) => {
      if (this.defaultSlotElement instanceof HTMLSlotElement) {
        this.defaultSlotElement[scrollName] = value
      }

      if (done) {
        callback()
      }
    }, {
      duration,
      name: 'content'
    })
  }

  public showInner (
    duration = this.innerDuration,
    callback = (): void => {}
  ): void {
    this.defaultSlotElement?.style.removeProperty('display')

    const name = this.determineInnerPropertyName()
    const from = this.defaultSlotElement instanceof HTMLSlotElement
      ? this.determineInnerPropertyValue(this.defaultSlotElement)
      : 0

    this.ease(from, 0, ({ done, value }) => {
      this.defaultSlotElement?.style.setProperty(name, `-${value}px`)

      if (done) {
        callback()
      }
    }, {
      duration,
      name: 'inner'
    })

    if (this.defaultSlotElement instanceof HTMLSlotElement) {
      this.defaultSlotElement.hidden = false
    }
  }

  public showOuter (
    element: HTMLElement,
    duration = this.outerDuration,
    callback = (): void => {}
  ): void {
    element.style.removeProperty('display')

    const name = this.determineOuterPropertyName(element)
    const from = this.determineOuterPropertyValue(element)

    if (window.getComputedStyle(element).position === 'absolute') {
      this.setZIndexAbsolute(element)
    } else {
      this.setZIndexRelative(element)
    }

    this.ease(from, 0, ({ done, value }) => {
      element.style.setProperty(name, `-${value}px`)

      if (done) {
        callback()
      }
    }, {
      duration,
      name: `outer-${element.id}`
    })

    element.hidden = false
  }

  public toggleContent (element: HTMLElement): void {
    if (element.hidden) {
      this.showContent(element)
    } else {
      this.hideContent(element)
    }
  }

  public toggleContentOrInner (element: HTMLElement): void {
    if (element.hidden) {
      if (this.defaultSlotElement?.hidden === true) {
        this.showInner()
      }

      this.showContent(element)
    } else {
      if (this.defaultSlotElement?.hidden !== true) {
        this.hideInner()
      }

      this.hideContent(element)
    }
  }

  public toggleInner (): void {
    if (this.defaultSlotElement?.hidden === true) {
      this.showInner()
    } else {
      this.hideInner()
    }
  }

  public toggleNested (element: HTMLElement): void {
    const countNotHidden = Array.from(this.contentElements).reduce(
      (count, contentElement): number => {
        return contentElement instanceof ClipElement
          ? count + (contentElement.defaultSlotElement?.hidden === true ? 0 : 1)
          : count
      },
      0
    )

    this.contentElements.forEach((contentElement) => {
      if (contentElement instanceof ClipElement) {
        if (contentElement === element) {
          if (contentElement.defaultSlotElement?.hidden === true) {
            contentElement.showInner()
          } else if (this.amount === 'min-one') {
            if (countNotHidden > 1) {
              contentElement.hideInner()
            }
          } else if (this.amount === 'any') {
            contentElement.hideInner()
          }
        } else if (this.amount === 'max-one') {
          if (contentElement.defaultSlotElement?.hidden !== true) {
            contentElement.hideInner()
          }
        } else if (this.amount === 'one') {
          if (contentElement.defaultSlotElement?.hidden !== true) {
            contentElement.hideInner()
          }
        }
      }
    })
  }

  public toggleOuter (element: HTMLElement): void {
    if (element.hidden) {
      this.showOuter(element)
    } else {
      this.hideOuter(element)
    }
  }

  protected determineInnerPropertyName (): string {
    const slotName = this.handleElement?.assignedSlot?.name

    switch (slotName) {
      case 'after':
        return this.dir === 'rtl' ? 'margin-left' : 'margin-right'
      case 'before':
        return this.dir === 'rtl' ? 'margin-right' : 'margin-left'
      case 'footer':
        return 'margin-bottom'
      case 'header':
        return 'margin-top'
      default:
        return ''
    }
  }

  protected determineInnerPropertyValue (element: HTMLElement): number {
    const style = window.getComputedStyle(element)
    const slotName = this.handleElement?.assignedSlot?.name

    if (slotName === undefined) {
      return 0
    }

    if (slotName === 'after' || slotName === 'before') {
      return parseInt(style.width, 10)
    }

    return parseInt(style.height, 10)
  }

  protected determineOuterPropertyName (element: HTMLElement): string {
    const flow = this.flow ?? ''
    const slotName = element.assignedSlot?.name ?? ''

    switch (`${flow}-${slotName}`) {
      case 'column-after':
        return 'margin-bottom'
      case 'column-before':
        return 'margin-top'
      case 'row-after':
        return this.dir === 'rtl' ? 'margin-left' : 'margin-right'
      case 'row-before':
        return this.dir === 'rtl' ? 'margin-right' : 'margin-left'
      default:
        return ''
    }
  }

  protected determineOuterPropertyValue (element: HTMLElement): number {
    const style = window.getComputedStyle(element)

    if (this.flow === 'row') {
      return parseInt(style.width, 10)
    }

    return parseInt(style.height, 10)
  }

  protected firstUpdatedContent (): void {
    if (this.defaultSlotElement instanceof HTMLSlotElement) {
      this.defaultSlotElement.scrollLeft = 0
      this.defaultSlotElement.scrollTop = 0
    }

    Array
      .from(this.contentElements)
      .forEach((element, index) => {
        if (index === 0 && this.innerHidden === true) {
          this.firstUpdatedInner()
        }

        element.hidden = index !== 0
      })
  }

  protected firstUpdatedInner (): void {
    if (this.defaultSlotElement instanceof HTMLSlotElement) {
      this.defaultSlotElement.style.setProperty('display', 'none')
      this.defaultSlotElement.hidden = true
    }
  }

  protected firstUpdatedOuter (): void {
    Array
      .from(this.outerElements)
      .forEach((element) => {
        if (element.hidden || window.getComputedStyle(element).position === 'absolute') {
          element.style.setProperty('display', 'none')
          element.hidden = true
        }
      })
  }

  protected handleClick (event: Event): void {
    const path = event.composedPath()

    Array
      .from(this.outerElements)
      .forEach((element) => {
        if (
          !path.includes(element) &&
          !element.hidden &&
          window.getComputedStyle(element).position === 'absolute'
        ) {
          this.hideOuter(element)
        }
      })
  }

  protected handleContent (event: NodeEvent): void {
    const element = this.querySelector<HTMLElement>(`#${event.detail?.target ?? ''}`)

    if (element instanceof HTMLElement) {
      event.cancelBubble = true
      this.toggleContent(element)
    }
  }

  protected handleContentOrInner (event: NodeEvent): void {
    const element = this.querySelector<HTMLElement>(`#${event.detail?.target ?? ''}`)

    if (element instanceof HTMLElement) {
      event.cancelBubble = true
      this.toggleContentOrInner(element)
    }
  }

  protected handleInner (event: Event): void {
    event.cancelBubble = true
    this.toggleInner()
  }

  protected handleNested (event: Event): void {
    const path = event.composedPath()

    const element = Array
      .from(this.contentElements)
      .find((contentElement) => {
        return path.includes(contentElement)
      })

    if (element instanceof HTMLElement) {
      event.cancelBubble = true
      this.toggleNested(element)
    }
  }

  protected handleOuter (event: NodeEvent): void {
    const element = this.querySelector<HTMLElement>(`#${event.detail?.target ?? ''}`)

    if (element instanceof HTMLElement) {
      event.cancelBubble = true
      this.toggleOuter(element)
    }
  }

  protected handleViewMove (event: ViewMoveEvent): void {
    const path = event.composedPath()

    if (
      this.defaultSlotElement instanceof HTMLSlotElement &&
      path.includes(this.defaultSlotElement) &&
      this.defaultSlotElement.hidden
    ) {
      this.showInner()
    }

    Array
      .from(this.contentElements)
      .forEach((element) => {
        if (path.includes(element)) {
          if (element.hidden) {
            this.showContent(element)
          }
        } else if (!element.hidden) {
          this.hideContent(element)
        }
      })

    Array
      .from(this.outerElements)
      .forEach((element) => {
        if (path.includes(element)) {
          if (element.hidden) {
            this.showOuter(element)
          }
        } else if (!element.hidden && window.getComputedStyle(element).position === 'absolute') {
          this.hideOuter(element)
        }
      })
  }

  protected setZIndexAbsolute (element: HTMLElement): void {
    element.style.setProperty(
      'z-index',
      String(2 + Array
        .from(this.outerElements)
        .map((outerElement) => {
          return outerElement === element
            ? 0
            : Number(outerElement.style.getPropertyValue('z-index'))
        })
        .reduce((left, right) => {
          return Math.max(left, right)
        }, 0))
    )
  }

  protected setZIndexRelative (element: HTMLElement): void {
    const assignedElements = Array.from(element.assignedSlot?.assignedElements() ?? [])

    assignedElements.forEach((assignedElement) => {
      if (assignedElement instanceof HTMLElement) {
        assignedElement.style.setProperty(
          'z-index',
          String(1 + assignedElements.length - assignedElements.indexOf(assignedElement))
        )
      }
    })
  }
}
