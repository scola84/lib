import { ScolaBreakpoint } from './breakpoint'
import type { ScolaElement } from '../elements/element'
import { ScolaInteract } from './interact'
import type { ScolaInteractEvent } from './interact'
import { absorb } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-hide': CustomEvent
    'sc-hide-fixed': CustomEvent
    'sc-show': CustomEvent
  }
}

type MarginProperty = 'margin-bottom' | 'margin-left' | 'margin-right' | 'margin-top'

type SizeProperty = 'offsetHeight' | 'offsetWidth'

export class ScolaHider {
  public static selector = '[is^="sc-"]'

  public activeElement?: HTMLElement

  public backdrop: HTMLElement | null

  public breakpoint: ScolaBreakpoint

  public direction?: string[]

  public element: ScolaElement

  public focus: boolean

  public force: boolean

  public immediate = true

  public interact?: ScolaInteract

  public mode: string

  public threshold: number

  public get dir (): string {
    if (document.dir === '') {
      return 'ltr'
    }

    return document.dir
  }

  public get isFixed (): boolean {
    return window.getComputedStyle(this.element).position === 'fixed'
  }

  protected handleClickBound = this.handleClick.bind(this)

  protected handleHideBound = this.handleHide.bind(this)

  protected handleHideFixedBound = this.handleHideFixed.bind(this)

  protected handleInteractBound = this.handleInteract.bind(this)

  protected handleKeydownBound = this.handleKeydown.bind(this)

  protected handleResizeBound = this.handleResize.bind(this)

  protected handleShowBound = this.handleShow.bind(this)

  protected handleTransitionendBound = this.handleTransitionend.bind(this)

  public constructor (element: ScolaElement) {
    this.element = element
    this.backdrop = this.selectBackdrop()
    this.breakpoint = new ScolaBreakpoint(this.element)

    if (this.element.hasAttribute('sc-hide-interact')) {
      this.interact = new ScolaInteract(this.element)
      this.interact.observe(this.handleInteractBound)
    }

    if (this.breakpoint.parse('sc-hide-initial') === '') {
      this.element.toggleAttribute('hidden', true)
    }

    this.reset()
    this.toggle()
  }

  public connect (): void {
    this.immediate = false
    this.addEventListeners()
  }

  public disconnect (): void {
    this.interact?.disconnect()
    this.removeEventListeners()
  }

  public hideFixed (): void {
    if (
      this.isFixed &&
      !this.force
    ) {
      this.element.toggleAttribute('hidden', true)
    }
  }

  public observe (interact: ScolaInteract): void {
    interact.observe(this.handleInteractBound)
  }

  public reset (): void {
    this.breakpoint.reset()
    this.direction = this.element.getAttribute('sc-hide-direction')?.split(' ')
    this.focus = this.element.hasAttribute('sc-hide-focus')
    this.force = this.breakpoint.parse('sc-hide-force') === ''
    this.mode = this.breakpoint.parse('sc-hide-mode') ?? 'height'
    this.threshold = Number(this.breakpoint.parse('sc-hide-threshold') ?? 0.1)

    if (this.interact !== undefined) {
      this.interact.disconnect()

      if (this.breakpoint.parse('sc-hide-interact') === '') {
        this.interact.mouse = this.breakpoint.parse('sc-hide-interact-mouse') === ''
        this.interact.target = this.element.getAttribute('sc-hide-interact-target') ?? 'window'
        this.interact.threshold = Number(this.breakpoint.parse('sc-hide-interact-threshold') ?? 0.1)
        this.interact.touch = this.breakpoint.parse('sc-hide-interact-touch') === ''
        this.interact.connect()
      }
    }
  }

  public toggle (): void {
    switch (this.mode) {
      case 'height':
        this.toggleHeight()
        break
      case 'bottom':
        this.toggleBottom()
        break
      case 'center':
        this.toggleCenter()
        break
      case 'end':
        this.toggleEnd()
        break
      case 'start':
        this.toggleStart()
        break
      case 'top':
        this.toggleTop()
        break
      case 'opacity':
        this.toggleOpacity()
        break
      default:
        break
    }
  }

  protected addEventListeners (): void {
    this.element.addEventListener('sc-hide', this.handleHideBound)
    this.element.addEventListener('sc-hide-fixed', this.handleHideFixedBound)
    this.element.addEventListener('sc-show', this.handleShowBound)
    this.element.addEventListener('transitionend', this.handleTransitionendBound)
    window.addEventListener('keydown', this.handleKeydownBound)
    window.addEventListener('resize', this.handleResizeBound)

    if (this.interact === undefined) {
      window.addEventListener('click', this.handleClickBound)
    }
  }

  protected changeFocus (): void {
    if (this.element.hasAttribute('hidden')) {
      this.activeElement?.focus()
      this.activeElement = undefined
    } else {
      const element = this.element.querySelector('button, input, select, textarea')

      if (
        element instanceof HTMLElement &&
        document.activeElement instanceof HTMLElement
      ) {
        this.activeElement = document.activeElement

        window.requestAnimationFrame(() => {
          element.focus()
        })
      }
    }
  }

  protected finalize (): void {
    this.immediate = false

    if (this.element.hasAttribute('hidden')) {
      this.element.style.setProperty('display', 'none', 'important')
      this.backdrop?.style.setProperty('display', 'none', 'important')
      this.element.propagator.dispatch('hide', [absorb(this.element.dataset)])
    } else {
      this.updateElements()
      this.element.propagator.dispatch('show', [absorb(this.element.dataset)])
    }

    if (
      this.isFixed &&
      this.focus
    ) {
      this.changeFocus()
    }
  }

  protected handleClick (event: MouseEvent | TouchEvent): void {
    if (
      this.backdrop !== null &&
      !this.backdrop.hasAttribute('hidden') &&
      !event.composedPath().includes(this.element)
    ) {
      this.hideFixed()
    }
  }

  protected handleHide (): void {
    this.element.toggleAttribute('hidden', true)
  }

  protected handleHideFixed (): void {
    this.hideFixed()
  }

  protected handleInteract (event: ScolaInteractEvent): void {
    switch (event.type) {
      case 'end':
        this.handleInteractEnd(event)
        break
      case 'move':
        this.handleInteractMove(event)
        break
      case 'start':
        this.handleInteractStart()
        break
      default:
        break
    }
  }

  protected handleInteractEnd (event: ScolaInteractEvent): void {
    if (
      event.distanceX === 0 &&
      event.distanceY === 0
    ) {
      if (this.element.hasAttribute('hidden')) {
        this.element.style.setProperty('display', 'none', 'important')
        this.backdrop?.style.setProperty('display', 'none', 'important')
      } else {
        this.handleClick(event.originalEvent)
      }
    } else if (this.mode === 'bottom') {
      this.handleInteractEndBottom(event)
    } else if ((
      this.mode === 'start' &&
      this.dir === 'ltr'
    ) || (
      this.mode === 'end' &&
      this.dir === 'rtl'
    )) {
      this.handleInteractEndLeft(event)
    } else if ((
      this.mode === 'end' &&
      this.dir === 'ltr'
    ) || (
      this.mode === 'start' &&
      this.dir === 'rtl'
    )) {
      this.handleInteractEndRight(event)
    } else if (this.mode === 'top') {
      this.handleInteractEndTop(event)
    }
  }

  protected handleInteractEndBottom (event: ScolaInteractEvent): void {
    if (this.element.hasAttribute('hidden')) {
      if (
        event.distanceY > (this.element.offsetHeight * this.threshold) &&
        event.startEdges.bottom &&
        this.direction?.includes('up') !== false
      ) {
        this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
      } else {
        this.immediate = this.isHiddenByMargin(window.getComputedStyle(this.element).marginBottom, this.element.offsetHeight)
        this.toggleMarginHidden('margin-bottom', 'offsetHeight')
      }
    } else if (
      event.distanceY < (-this.element.offsetHeight * this.threshold) &&
      this.direction?.includes('down') !== false
    ) {
      this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
    } else {
      this.immediate = this.isVisibleByMargin(window.getComputedStyle(this.element).marginBottom)
      this.toggleMarginVisible('margin-bottom')
    }
  }

  protected handleInteractEndLeft (event: ScolaInteractEvent): void {
    if (this.element.hasAttribute('hidden')) {
      if (
        event.distanceX < (-this.element.offsetWidth * this.threshold) &&
        event.startEdges.left &&
        this.direction?.includes(this.resolveDirection('end', this.dir)) !== false
      ) {
        this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
      } else {
        this.immediate = this.isHiddenByMargin(window.getComputedStyle(this.element).marginLeft, this.element.offsetWidth)
        this.toggleMarginHidden('margin-left', 'offsetWidth')
      }
    } else if (
      event.distanceX > (this.element.offsetWidth * this.threshold) &&
      this.direction?.includes(this.resolveDirection('start', this.dir)) !== false
    ) {
      this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
    } else {
      this.immediate = this.isVisibleByMargin(window.getComputedStyle(this.element).marginLeft)
      this.toggleMarginVisible('margin-left')
    }
  }

  protected handleInteractEndRight (event: ScolaInteractEvent): void {
    if (this.element.hasAttribute('hidden')) {
      if (
        event.distanceX > (this.element.offsetWidth * this.threshold) &&
        event.startEdges.right &&
        this.direction?.includes(this.resolveDirection('start', this.dir)) !== false
      ) {
        this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
      } else {
        this.immediate = this.isHiddenByMargin(window.getComputedStyle(this.element).marginRight, this.element.offsetWidth)
        this.toggleMarginHidden('margin-right', 'offsetWidth')
      }
    } else if (
      event.distanceX < (-this.element.offsetWidth * this.threshold) &&
      this.direction?.includes(this.resolveDirection('end', this.dir)) !== false
    ) {
      this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
    } else {
      this.immediate = this.isVisibleByMargin(window.getComputedStyle(this.element).marginRight)
      this.toggleMarginVisible('margin-right')
    }
  }

  protected handleInteractEndTop (event: ScolaInteractEvent): void {
    if (this.element.hasAttribute('hidden')) {
      if (
        event.distanceY < (-this.element.offsetHeight * this.threshold) &&
        event.startEdges.top &&
        this.direction?.includes('down') !== false
      ) {
        this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
      } else {
        this.immediate = this.isHiddenByMargin(window.getComputedStyle(this.element).marginTop, this.element.offsetHeight)
        this.toggleMarginHidden('margin-top', 'offsetHeight')
      }
    } else if (
      event.distanceY > (this.element.offsetHeight * this.threshold) &&
      this.direction?.includes('up') !== false
    ) {
      this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
    } else {
      this.immediate = this.isVisibleByMargin(window.getComputedStyle(this.element).marginTop)
      this.toggleMarginVisible('margin-top')
    }
  }

  protected handleInteractMove (event: ScolaInteractEvent): void {
    if (this.mode === 'bottom') {
      this.handleInteractMoveBottom(event)
    } else if ((
      this.mode === 'start' &&
      this.dir === 'ltr'
    ) || (
      this.mode === 'end' &&
      this.dir === 'rtl'
    )) {
      this.handleInteractMoveLeft(event)
    } else if ((
      this.mode === 'end' &&
      this.dir === 'ltr'
    ) || (
      this.mode === 'start' &&
      this.dir === 'rtl'
    )) {
      this.handleInteractMoveRight(event)
    } else if (this.mode === 'top') {
      this.handleInteractMoveTop(event)
    }
  }

  protected handleInteractMoveBottom (event: ScolaInteractEvent): void {
    if (this.element.hasAttribute('hidden')) {
      if (
        this.isValidMargin(-this.element.offsetHeight + event.distanceY, -this.element.offsetHeight, 0) &&
        event.startEdges.bottom &&
        this.direction?.includes('up') !== false
      ) {
        this.moveMargin('bottom', -this.element.offsetHeight + event.distanceY, this.element.offsetHeight)
      }
    } else if (
      this.isValidMargin(event.distanceY, -this.element.offsetHeight, 0) &&
      this.direction?.includes('down') !== false
    ) {
      this.moveMargin('bottom', event.distanceY, this.element.offsetHeight)
    }
  }

  protected handleInteractMoveLeft (event: ScolaInteractEvent): void {
    if (this.element.hasAttribute('hidden')) {
      if (
        this.isValidMargin(-this.element.offsetWidth - event.distanceX, -this.element.offsetWidth, 0) &&
        event.startEdges.left &&
        this.direction?.includes(this.resolveDirection('end', this.dir)) !== false
      ) {
        this.moveMargin('left', -this.element.offsetWidth - event.distanceX, this.element.offsetWidth)
      }
    } else if (
      this.isValidMargin(-event.distanceX, -this.element.offsetWidth, 0) &&
      this.direction?.includes(this.resolveDirection('start', this.dir)) !== false
    ) {
      this.moveMargin('left', -event.distanceX, this.element.offsetWidth)
    }
  }

  protected handleInteractMoveRight (event: ScolaInteractEvent): void {
    if (this.element.hasAttribute('hidden')) {
      if (
        this.isValidMargin(-this.element.offsetWidth + event.distanceX, -this.element.offsetWidth, 0) &&
        event.startEdges.right &&
        this.direction?.includes(this.resolveDirection('start', this.dir)) !== false
      ) {
        this.moveMargin('right', -this.element.offsetWidth + event.distanceX, this.element.offsetWidth)
      }
    } else if (
      this.isValidMargin(event.distanceX, -this.element.offsetWidth, 0) &&
      this.direction?.includes(this.resolveDirection('end', this.dir)) !== false
    ) {
      this.moveMargin('right', event.distanceX, this.element.offsetWidth)
    }
  }

  protected handleInteractMoveTop (event: ScolaInteractEvent): void {
    if (this.element.hasAttribute('hidden')) {
      if (
        this.isValidMargin(-this.element.offsetHeight - event.distanceY, -this.element.offsetHeight, 0) &&
        event.startEdges.top &&
        this.direction?.includes('down') !== false
      ) {
        this.moveMargin('top', -this.element.offsetHeight - event.distanceY, this.element.offsetHeight)
      }
    } else if (
      this.isValidMargin(-event.distanceY, -this.element.offsetHeight, 0) &&
      this.direction?.includes('up') !== false
    ) {
      this.moveMargin('top', -event.distanceY, this.element.offsetHeight)
    }
  }

  protected handleInteractStart (): void {
    if (this.mode === 'bottom') {
      this.handleInteractStartBottom()
    } else if ((
      this.mode === 'start' &&
      this.dir === 'ltr'
    ) || (
      this.mode === 'end' &&
      this.dir === 'rtl'
    )) {
      this.handleInteractStartLeft()
    } else if ((
      this.mode === 'end' &&
      this.dir === 'ltr'
    ) || (
      this.mode === 'start' &&
      this.dir === 'rtl'
    )) {
      this.handleInteractStartRight()
    } else if (this.mode === 'top') {
      this.handleInteractStartTop()
    }
  }

  protected handleInteractStartBottom (): void {
    this.element.style.removeProperty('display')
    this.element.style.setProperty('transition-property', 'none')
    this.backdrop?.style.removeProperty('display')
    this.backdrop?.style.setProperty('transition-property', 'none')

    window.requestAnimationFrame(() => {
      if (this.element.hasAttribute('hidden')) {
        this.element.style.setProperty('margin-bottom', `-${this.element.offsetHeight}px`)
      }
    })
  }

  protected handleInteractStartLeft (): void {
    this.element.style.removeProperty('display')
    this.element.style.setProperty('transition-property', 'none')
    this.backdrop?.style.removeProperty('display')
    this.backdrop?.style.setProperty('transition-property', 'none')

    window.requestAnimationFrame(() => {
      if (this.element.hasAttribute('hidden')) {
        this.element.style.setProperty('margin-left', `-${this.element.offsetWidth}px`)
      }
    })
  }

  protected handleInteractStartRight (): void {
    this.element.style.removeProperty('display')
    this.element.style.setProperty('transition-property', 'none')
    this.backdrop?.style.removeProperty('display')
    this.backdrop?.style.setProperty('transition-property', 'none')

    window.requestAnimationFrame(() => {
      if (this.element.hasAttribute('hidden')) {
        this.element.style.setProperty('margin-right', `-${this.element.offsetWidth}px`)
      }
    })
  }

  protected handleInteractStartTop (): void {
    this.element.style.removeProperty('display')
    this.element.style.setProperty('transition-property', 'none')
    this.backdrop?.style.removeProperty('display')
    this.backdrop?.style.setProperty('transition-property', 'none')

    window.requestAnimationFrame(() => {
      if (this.element.hasAttribute('hidden')) {
        this.element.style.setProperty('margin-top', `-${this.element.offsetHeight}px`)
      }
    })
  }

  protected handleKeydown (event: KeyboardEvent): void {
    if (event.code === 'Escape') {
      event.cancelBubble = true
      this.hideFixed()
    }
  }

  protected handleResize (): void {
    this.reset()

    if (!this.element.hasAttribute('hidden')) {
      this.immediate = true
      this.toggle()
    }
  }

  protected handleShow (): void {
    this.element.toggleAttribute('hidden', false)
  }

  protected handleTransitionend (event: TransitionEvent): void {
    if (event.target === this.element) {
      this.finalize()
    }
  }

  protected isHiddenByMargin (margin: string, size: number): boolean {
    return Math.abs(Math.round(parseFloat(margin))) === size
  }

  protected isValidMargin (margin: number, min: number, max: number): boolean {
    return margin > min && margin < max
  }

  protected isVisibleByMargin (margin: string): boolean {
    return Math.round(parseFloat(margin)) === 0
  }

  protected moveMargin (property: string, margin: number, size: number): void {
    this.element.style.setProperty(`margin-${property}`, `${margin}px`)
    this.backdrop?.style.setProperty('opacity', (1 - Math.abs(margin / size)).toString())
  }

  protected removeEventListeners (): void {
    this.element.removeEventListener('sc-hide', this.handleHideBound)
    this.element.removeEventListener('sc-hide-fixed', this.handleHideFixedBound)
    this.element.removeEventListener('sc-show', this.handleShowBound)
    this.element.removeEventListener('transitionend', this.handleTransitionendBound)
    window.removeEventListener('keydown', this.handleKeydownBound)
    window.removeEventListener('resize', this.handleResizeBound)

    if (this.interact === undefined) {
      window.removeEventListener('click', this.handleClickBound)
    }
  }

  protected resolveDirection (direction: string, dir: string): string {
    if (
      direction === 'end' &&
      dir === 'rtl'
    ) {
      return 'start'
    } else if (
      direction === 'start' &&
      dir === 'rtl'
    ) {
      return 'end'
    }

    return direction
  }

  protected selectBackdrop (): HTMLElement | null {
    const { nextElementSibling } = this.element

    if (
      nextElementSibling?.hasAttribute('sc-fixed-backdrop') === true &&
      nextElementSibling instanceof HTMLElement
    ) {
      return nextElementSibling
    }

    return null
  }

  protected toggleBottom (): void {
    this.toggleMargin('margin-bottom', 'offsetHeight')
  }

  protected toggleCenter (): void {
    if (this.element.hasAttribute('hidden')) {
      this.toggleCenterHidden()
    } else {
      this.toggleCenterVisible()
    }
  }

  protected toggleCenterHidden (): void {
    if (this.immediate) {
      this.element.style.setProperty('transition-property', 'none')
      this.backdrop?.style.setProperty('transition-property', 'none')
    } else {
      this.element.style.setProperty('transition-property', 'margin-bottom')
      this.backdrop?.style.setProperty('transition-property', 'opacity')
    }

    window.requestAnimationFrame(() => {
      this.element.style.setProperty('margin-bottom', `-${this.element.offsetHeight}px`)
      this.backdrop?.style.setProperty('opacity', '0')

      if (this.immediate) {
        this.finalize()
      }
    })
  }

  protected toggleCenterVisible (): void {
    this.element.style.removeProperty('display')
    this.element.style.setProperty('margin-bottom', `-${this.element.offsetHeight}px`)
    this.backdrop?.style.removeProperty('display')
    this.backdrop?.style.setProperty('opacity', '0')

    window.requestAnimationFrame(() => {
      if (this.immediate) {
        this.element.style.setProperty('transition-property', 'none')
        this.backdrop?.style.setProperty('transition-property', 'none')
      } else {
        this.element.style.setProperty('transition-property', 'margin-bottom')
        this.backdrop?.style.setProperty('transition-property', 'opacity')
      }

      window.requestAnimationFrame(() => {
        const left = (window.innerWidth - this.element.offsetWidth) / 2
        const top = (window.innerHeight - this.element.offsetHeight) / 2

        this.element.style.setProperty('margin-bottom', `${top}px`)
        this.element.style.setProperty('margin-left', `${left}px`)
        this.backdrop?.style.setProperty('opacity', '1')

        if (this.immediate) {
          this.finalize()
        }
      })
    })
  }

  protected toggleEnd (): void {
    if (this.dir === 'rtl') {
      this.toggleMargin('margin-left', 'offsetWidth')
    } else {
      this.toggleMargin('margin-right', 'offsetWidth')
    }
  }

  protected toggleHeight (): void {
    if (this.element.hasAttribute('hidden')) {
      this.toggleHeightHidden()
    } else {
      this.toggleHeightVisible()
    }
  }

  protected toggleHeightHidden (): void {
    if (this.immediate) {
      this.element.style.setProperty('height', '0px')
      this.element.style.setProperty('transition-property', 'none')
      this.finalize()
    } else {
      this.element.style.setProperty('height', `${this.element.scrollHeight}px`)
      this.element.style.setProperty('transition-property', 'height')

      window.requestAnimationFrame(() => {
        this.element.style.setProperty('height', '0px')
      })
    }
  }

  protected toggleHeightVisible (): void {
    this.element.style.removeProperty('display')

    window.requestAnimationFrame(() => {
      if (this.immediate) {
        this.element.style.setProperty('transition-property', 'none')
      } else {
        this.element.style.setProperty('transition-property', 'height')
      }

      window.requestAnimationFrame(() => {
        if (this.element.offsetHeight === 0) {
          if (
            this.element.scrollHeight > 0 &&
            window.getComputedStyle(this.element).overflow === 'hidden'
          ) {
            this.element.style.setProperty('height', `${this.element.scrollHeight}px`)
          } else {
            this.element.style.removeProperty('height')
          }
        }

        if (this.immediate) {
          this.finalize()
        }
      })
    })
  }

  protected toggleMargin (margin: MarginProperty, size: SizeProperty): void {
    if (this.element.hasAttribute('hidden')) {
      this.toggleMarginHidden(margin, size)
    } else {
      this.toggleMarginVisible(margin)
    }
  }

  protected toggleMarginHidden (margin: MarginProperty, size: SizeProperty): void {
    if (this.immediate) {
      this.element.style.setProperty('transition-property', 'none')
      this.backdrop?.style.setProperty('transition-property', 'none')
    } else {
      this.element.style.setProperty('transition-property', margin)
      this.backdrop?.style.setProperty('transition-property', 'opacity')
    }

    window.requestAnimationFrame(() => {
      this.element.style.setProperty(margin, `-${this.element[size]}px`)
      this.backdrop?.style.setProperty('opacity', '0')

      if (this.immediate) {
        this.finalize()
      }
    })
  }

  protected toggleMarginVisible (margin: MarginProperty): void {
    this.element.style.removeProperty('display')
    this.backdrop?.style.removeProperty('display')

    if (margin !== 'margin-left') {
      this.element.style.removeProperty('margin-left')
    }

    window.requestAnimationFrame(() => {
      if (this.immediate) {
        this.element.style.setProperty('transition-property', 'none')
        this.backdrop?.style.setProperty('transition-property', 'none')
      } else {
        this.element.style.setProperty('transition-property', margin)
        this.backdrop?.style.setProperty('transition-property', 'opacity')
      }

      window.requestAnimationFrame(() => {
        this.element.style.setProperty(margin, '0px')
        this.backdrop?.style.setProperty('opacity', '1')

        if (this.immediate) {
          this.finalize()
        }
      })
    })
  }

  protected toggleOpacity (): void {
    if (this.element.hasAttribute('hidden')) {
      this.toggleOpacityHidden()
    } else {
      this.toggleOpacityVisible()
    }
  }

  protected toggleOpacityHidden (): void {
    this.element.style.setProperty('opacity', '0')
    this.backdrop?.style.setProperty('opacity', '0')

    if (this.immediate) {
      this.finalize()
    }
  }

  protected toggleOpacityVisible (): void {
    this.element.style.removeProperty('display')
    this.element.style.setProperty('opacity', '0')
    this.backdrop?.style.removeProperty('display')
    this.backdrop?.style.setProperty('opacity', '0')

    window.requestAnimationFrame(() => {
      if (this.immediate) {
        this.element.style.setProperty('transition-property', 'none')
        this.backdrop?.style.setProperty('transition-property', 'none')
      } else {
        this.element.style.setProperty('transition-property', 'opacity')
        this.backdrop?.style.setProperty('transition-property', 'opacity')
      }

      window.requestAnimationFrame(() => {
        this.element.style.setProperty('opacity', '1')
        this.backdrop?.style.setProperty('opacity', '1')

        if (this.immediate) {
          this.finalize()
        }
      })
    })
  }

  protected toggleStart (): void {
    if (this.dir === 'rtl') {
      this.toggleMargin('margin-right', 'offsetWidth')
    } else {
      this.toggleMargin('margin-left', 'offsetWidth')
    }
  }

  protected toggleTop (): void {
    this.toggleMargin('margin-top', 'offsetHeight')
  }

  protected updateElements (): void {
    this.element
      .querySelectorAll<ScolaElement>(ScolaHider.selector)
      .forEach((element) => {
        element.update()
      })
  }
}
