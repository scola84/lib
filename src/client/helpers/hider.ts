import { ScolaBreakpoint } from './breakpoint'
import type { ScolaBreakpointEvent } from './breakpoint'
import type { ScolaElement } from '../elements/element'
import { ScolaInteract } from './interact'
import type { ScolaInteractEvent } from './interact'
import { absorb } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-hide': CustomEvent
    'sc-hide-modal': CustomEvent
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

  public force: boolean

  public immediate = true

  public interact: ScolaInteract

  public mode: string

  public threshold: number

  public get isModal (): boolean {
    return window.getComputedStyle(this.element).position === 'fixed'
  }

  protected handleBreakpointBound = this.handleBreakpoint.bind(this)

  protected handleHideBound = this.handleHide.bind(this)

  protected handleHideModalBound = this.handleHideModal.bind(this)

  protected handleInteractBound = this.handleInteract.bind(this)

  protected handleKeydownBound = this.handleKeydown.bind(this)

  protected handleShowBound = this.handleShow.bind(this)

  protected handleTransitionendBound = this.handleTransitionend.bind(this)

  public constructor (element: ScolaElement) {
    this.element = element
    this.backdrop = this.selectBackdrop()
    this.breakpoint = new ScolaBreakpoint(this.element)
    this.interact = new ScolaInteract(this.element)

    if (this.breakpoint.parse('sc-hide-initial') === '') {
      this.element.toggleAttribute('hidden', true)
    }

    this.reset()
    this.toggle()
  }

  public connect (): void {
    this.breakpoint.observe(this.handleBreakpointBound)
    this.interact.observe(this.handleInteractBound)
    this.breakpoint.connect()
    this.interact.connect()
    this.addEventListeners()
  }

  public disconnect (): void {
    this.breakpoint.disconnect()
    this.interact.disconnect()
    this.removeEventListeners()
  }

  public hideModal (): boolean {
    if (
      this.isModal &&
      !this.force
    ) {
      this.element.toggleAttribute('hidden', true)
      return true
    }

    return false
  }

  public reset (): void {
    this.breakpoint.reset()

    this.direction = this.element.getAttribute('sc-hide-direction')
      ?.trim()
      .split(/\s+/u)

    this.force = this.breakpoint.parse('sc-hide-force') === ''
    this.interact.mouse = this.breakpoint.parse('sc-hide-interact-mouse') === ''
    this.interact.target = this.element.getAttribute('sc-hide-interact-target') ?? 'window'
    this.interact.threshold = Number(this.breakpoint.parse('sc-hide-interact-threshold') ?? 0.1)
    this.interact.touch = this.breakpoint.parse('sc-hide-interact-touch') === ''
    this.mode = this.breakpoint.parse('sc-hide-mode') ?? 'height'
    this.threshold = Number(this.breakpoint.parse('sc-hide-threshold') ?? 0.1)
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
    this.element.addEventListener('sc-hide-modal', this.handleHideModalBound)
    this.element.addEventListener('sc-show', this.handleShowBound)
    this.element.addEventListener('transitionend', this.handleTransitionendBound)
    window.addEventListener('keydown', this.handleKeydownBound)
  }

  protected changeFocus (): void {
    if (this.element.hasAttribute('hidden')) {
      this.activeElement?.focus()
      this.activeElement = undefined
    } else {
      const element = this.element.querySelector('[sc-focus]')

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

    this.changeFocus()
  }

  protected handleBreakpoint (event: ScolaBreakpointEvent): void {
    if (event.changed) {
      this.interact.disconnect()
      this.reset()
      this.interact.connect()

      if (!this.element.hasAttribute('hidden')) {
        this.immediate = true
        this.toggle()
      }
    }
  }

  protected handleHide (): void {
    this.element.toggleAttribute('hidden', true)
  }

  protected handleHideModal (): void {
    this.hideModal()
  }

  protected handleInteract (event: ScolaInteractEvent): boolean {
    switch (event.type) {
      case 'end':
        return this.handleInteractEnd(event)
      case 'move':
        return this.handleInteractMove(event)
      case 'start':
        return this.handleInteractStart(event)
      default:
        return false
    }
  }

  protected handleInteractEnd (event: ScolaInteractEvent): boolean {
    if (
      event.distanceX === 0 &&
      event.distanceY === 0
    ) {
      if (this.element.hasAttribute('hidden')) {
        this.element.style.setProperty('display', 'none', 'important')
        this.backdrop?.style.setProperty('display', 'none', 'important')
      } else if (
        this.backdrop?.hasAttribute('hidden') === false &&
        !event.originalEvent.composedPath().includes(this.element)
      ) {
        return this.hideModal()
      }
    } else if (this.shouldInteractBottom(event)) {
      return this.handleInteractEndBottom(event)
    } else if (this.shouldInteractLeft(event)) {
      return this.handleInteractEndLeft(event)
    } else if (this.shouldInteractRight(event)) {
      return this.handleInteractEndRight(event)
    } else if (this.shouldInteractTop(event)) {
      return this.handleInteractEndTop(event)
    }

    return false
  }

  protected handleInteractEndBottom (event: ScolaInteractEvent): boolean {
    if (this.element.hasAttribute('hidden')) {
      if (
        event.distanceY > (this.element.offsetHeight * this.threshold) &&
        event.startEdges.bottom &&
        this.direction?.includes('up') !== false
      ) {
        this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
        return true
      }

      this.immediate = this.isHiddenByMargin(window.getComputedStyle(this.element).marginBottom, this.element.offsetHeight)
      this.toggleMarginHidden('margin-bottom', 'offsetHeight')
      return true
    } else if (
      event.distanceY < (-this.element.offsetHeight * this.threshold) &&
      this.direction?.includes('down') !== false
    ) {
      this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
      return true
    }

    this.immediate = this.isVisibleByMargin(window.getComputedStyle(this.element).marginBottom)
    this.toggleMarginVisible('margin-bottom')
    return true
  }

  protected handleInteractEndLeft (event: ScolaInteractEvent): boolean {
    if (this.element.hasAttribute('hidden')) {
      if (
        event.distanceX < (-this.element.offsetWidth * this.threshold) &&
        event.startEdges.left &&
        this.direction?.includes(this.resolveDirection('end')) !== false
      ) {
        this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
        return true
      }

      this.immediate = this.isHiddenByMargin(window.getComputedStyle(this.element).marginLeft, this.element.offsetWidth)
      this.toggleMarginHidden('margin-left', 'offsetWidth')
      return true
    } else if (
      event.distanceX > (this.element.offsetWidth * this.threshold) &&
      this.direction?.includes(this.resolveDirection('start')) !== false
    ) {
      this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
      return true
    }

    this.immediate = this.isVisibleByMargin(window.getComputedStyle(this.element).marginLeft)
    this.toggleMarginVisible('margin-left')
    return true
  }

  protected handleInteractEndRight (event: ScolaInteractEvent): boolean {
    if (this.element.hasAttribute('hidden')) {
      if (
        event.distanceX > (this.element.offsetWidth * this.threshold) &&
        event.startEdges.right &&
        this.direction?.includes(this.resolveDirection('start')) !== false
      ) {
        this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
        return true
      }

      this.immediate = this.isHiddenByMargin(window.getComputedStyle(this.element).marginRight, this.element.offsetWidth)
      this.toggleMarginHidden('margin-right', 'offsetWidth')
      return true
    } else if (
      event.distanceX < (-this.element.offsetWidth * this.threshold) &&
      this.direction?.includes(this.resolveDirection('end')) !== false
    ) {
      this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
      return true
    }

    this.immediate = this.isVisibleByMargin(window.getComputedStyle(this.element).marginRight)
    this.toggleMarginVisible('margin-right')
    return true
  }

  protected handleInteractEndTop (event: ScolaInteractEvent): boolean {
    if (this.element.hasAttribute('hidden')) {
      if (
        event.distanceY < (-this.element.offsetHeight * this.threshold) &&
        event.startEdges.top &&
        this.direction?.includes('down') !== false
      ) {
        this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
        return true
      }

      this.immediate = this.isHiddenByMargin(window.getComputedStyle(this.element).marginTop, this.element.offsetHeight)
      this.toggleMarginHidden('margin-top', 'offsetHeight')
      return true
    } else if (
      event.distanceY > (this.element.offsetHeight * this.threshold) &&
      this.direction?.includes('up') !== false
    ) {
      this.element.toggleAttribute('hidden', !this.element.hasAttribute('hidden'))
      return true
    }

    this.immediate = this.isVisibleByMargin(window.getComputedStyle(this.element).marginTop)
    this.toggleMarginVisible('margin-top')
    return true
  }

  protected handleInteractMove (event: ScolaInteractEvent): boolean {
    if (this.shouldInteractBottom(event)) {
      return this.handleInteractMoveBottom(event)
    } else if (this.shouldInteractLeft(event)) {
      return this.handleInteractMoveLeft(event)
    } else if (this.shouldInteractRight(event)) {
      return this.handleInteractMoveRight(event)
    } else if (this.shouldInteractTop(event)) {
      return this.handleInteractMoveTop(event)
    }

    return false
  }

  protected handleInteractMoveBottom (event: ScolaInteractEvent): boolean {
    if (this.element.hasAttribute('hidden')) {
      if (
        this.isValidMargin(-this.element.offsetHeight + event.distanceY, -this.element.offsetHeight, 0) &&
        event.startEdges.bottom &&
        this.direction?.includes('up') !== false
      ) {
        this.moveMargin('bottom', -this.element.offsetHeight + event.distanceY, this.element.offsetHeight)
        return true
      }
    } else if (
      this.isValidMargin(event.distanceY, -this.element.offsetHeight, 0) &&
      this.direction?.includes('down') !== false
    ) {
      this.moveMargin('bottom', event.distanceY, this.element.offsetHeight)
      return true
    }

    return false
  }

  protected handleInteractMoveLeft (event: ScolaInteractEvent): boolean {
    if (this.element.hasAttribute('hidden')) {
      if (
        this.isValidMargin(-this.element.offsetWidth - event.distanceX, -this.element.offsetWidth, 0) &&
        event.startEdges.left &&
        this.direction?.includes(this.resolveDirection('end')) !== false
      ) {
        this.moveMargin('left', -this.element.offsetWidth - event.distanceX, this.element.offsetWidth)
        return true
      }
    } else if (
      this.isValidMargin(-event.distanceX, -this.element.offsetWidth, 0) &&
      this.direction?.includes(this.resolveDirection('start')) !== false
    ) {
      this.moveMargin('left', -event.distanceX, this.element.offsetWidth)
      return true
    }

    return false
  }

  protected handleInteractMoveRight (event: ScolaInteractEvent): boolean {
    if (this.element.hasAttribute('hidden')) {
      if (
        this.isValidMargin(-this.element.offsetWidth + event.distanceX, -this.element.offsetWidth, 0) &&
        event.startEdges.right &&
        this.direction?.includes(this.resolveDirection('start')) !== false
      ) {
        this.moveMargin('right', -this.element.offsetWidth + event.distanceX, this.element.offsetWidth)
        return true
      }
    } else if (
      this.isValidMargin(event.distanceX, -this.element.offsetWidth, 0) &&
      this.direction?.includes(this.resolveDirection('end')) !== false
    ) {
      this.moveMargin('right', event.distanceX, this.element.offsetWidth)
      return true
    }

    return false
  }

  protected handleInteractMoveTop (event: ScolaInteractEvent): boolean {
    if (this.element.hasAttribute('hidden')) {
      if (
        this.isValidMargin(-this.element.offsetHeight - event.distanceY, -this.element.offsetHeight, 0) &&
        event.startEdges.top &&
        this.direction?.includes('down') !== false
      ) {
        this.moveMargin('top', -this.element.offsetHeight - event.distanceY, this.element.offsetHeight)
        return true
      }
    } else if (
      this.isValidMargin(-event.distanceY, -this.element.offsetHeight, 0) &&
      this.direction?.includes('up') !== false
    ) {
      this.moveMargin('top', -event.distanceY, this.element.offsetHeight)
      return true
    }

    return false
  }

  protected handleInteractStart (event: ScolaInteractEvent): boolean {
    if (this.shouldInteractBottom(event)) {
      return this.handleInteractStartBottom()
    } else if (this.shouldInteractLeft(event)) {
      return this.handleInteractStartLeft()
    } else if (this.shouldInteractRight(event)) {
      return this.handleInteractStartRight()
    } else if (this.shouldInteractTop(event)) {
      return this.handleInteractStartTop()
    }

    return false
  }

  protected handleInteractStartBottom (): boolean {
    this.element.style.removeProperty('display')
    this.element.style.setProperty('transition-property', 'none')
    this.backdrop?.style.removeProperty('display')
    this.backdrop?.style.setProperty('transition-property', 'none')

    window.requestAnimationFrame(() => {
      if (this.element.hasAttribute('hidden')) {
        this.element.style.setProperty('margin-bottom', `-${this.element.offsetHeight}px`)
      }
    })

    return true
  }

  protected handleInteractStartLeft (): boolean {
    this.element.style.removeProperty('display')
    this.element.style.setProperty('transition-property', 'none')
    this.backdrop?.style.removeProperty('display')
    this.backdrop?.style.setProperty('transition-property', 'none')

    window.requestAnimationFrame(() => {
      if (this.element.hasAttribute('hidden')) {
        this.element.style.setProperty('margin-left', `-${this.element.offsetWidth}px`)
      }
    })

    return true
  }

  protected handleInteractStartRight (): boolean {
    this.element.style.removeProperty('display')
    this.element.style.setProperty('transition-property', 'none')
    this.backdrop?.style.removeProperty('display')
    this.backdrop?.style.setProperty('transition-property', 'none')

    window.requestAnimationFrame(() => {
      if (this.element.hasAttribute('hidden')) {
        this.element.style.setProperty('margin-right', `-${this.element.offsetWidth}px`)
      }
    })

    return true
  }

  protected handleInteractStartTop (): boolean {
    this.element.style.removeProperty('display')
    this.element.style.setProperty('transition-property', 'none')
    this.backdrop?.style.removeProperty('display')
    this.backdrop?.style.setProperty('transition-property', 'none')

    window.requestAnimationFrame(() => {
      if (this.element.hasAttribute('hidden')) {
        this.element.style.setProperty('margin-top', `-${this.element.offsetHeight}px`)
      }
    })

    return true
  }

  protected handleKeydown (event: KeyboardEvent): void {
    if (event.code === 'Escape') {
      event.cancelBubble = true
      this.hideModal()
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
    this.element.removeEventListener('sc-hide-modal', this.handleHideModalBound)
    this.element.removeEventListener('sc-show', this.handleShowBound)
    this.element.removeEventListener('transitionend', this.handleTransitionendBound)
    window.removeEventListener('keydown', this.handleKeydownBound)
  }

  protected resolveDirection (direction: string): string {
    if (
      direction === 'end' &&
      this.interact.dir === 'rtl'
    ) {
      return 'start'
    } else if (
      direction === 'start' &&
      this.interact.dir === 'rtl'
    ) {
      return 'end'
    }

    return direction
  }

  protected selectBackdrop (): HTMLElement | null {
    const { nextElementSibling } = this.element

    if (
      nextElementSibling?.hasAttribute('sc-modal-backdrop') === true &&
      nextElementSibling instanceof HTMLElement
    ) {
      return nextElementSibling
    }

    return null
  }

  protected shouldInteractBottom (event: ScolaInteractEvent): boolean {
    if (this.mode === 'bottom') {
      if (event.type === 'end') {
        this.toggleScrollElement(event, true)
        return (
          event.axis === 'y' &&
          !event.startScroll.top
        )
      } else if (event.type === 'start') {
        return true
      } else if (event.axis === 'y') {
        if (event.directionY === 'down') {
          if (!event.startScroll.top) {
            this.toggleScrollElement(event, false)
            return true
          }
        } else {
          return true
        }
      }
    }

    return false
  }

  protected shouldInteractLeft (event: ScolaInteractEvent): boolean {
    if ((
      this.mode === 'start' &&
      this.interact.dir === 'ltr'
    ) || (
      this.mode === 'end' &&
      this.interact.dir === 'rtl'
    )) {
      if (event.type === 'end') {
        this.toggleScrollElement(event, true)
        return (
          event.axis === 'x' &&
          !event.startScroll.right
        )
      } else if (event.type === 'start') {
        return true
      } else if (event.axis === 'x') {
        if (event.directionX === 'left') {
          if (!event.startScroll.right) {
            this.toggleScrollElement(event, false)
            return true
          }
        } else {
          return true
        }
      }
    }

    return false
  }

  protected shouldInteractRight (event: ScolaInteractEvent): boolean {
    if ((
      this.mode === 'end' &&
      this.interact.dir === 'ltr'
    ) || (
      this.mode === 'start' &&
      this.interact.dir === 'rtl'
    )) {
      if (event.type === 'end') {
        this.toggleScrollElement(event, true)
        return (
          event.axis === 'x' &&
          !event.startScroll.left
        )
      } else if (event.type === 'start') {
        return true
      } else if (event.axis === 'x') {
        if (event.directionX === 'right') {
          if (!event.startScroll.left) {
            this.toggleScrollElement(event, false)
            return true
          }
        } else {
          return true
        }
      }
    }

    return false
  }

  protected shouldInteractTop (event: ScolaInteractEvent): boolean {
    if (this.mode === 'top') {
      if (event.type === 'end') {
        this.toggleScrollElement(event, true)
        return (
          event.axis === 'y' &&
          !event.startScroll.bottom
        )
      } else if (event.type === 'start') {
        return true
      } else if (event.axis === 'y') {
        if (event.directionY === 'up') {
          if (!event.startScroll.bottom) {
            this.toggleScrollElement(event, false)
            return true
          }
        } else {
          return true
        }
      }
    }

    return false
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
    if (this.interact.dir === 'rtl') {
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
      this.element.style.setProperty('transition-property', 'height')

      window.requestAnimationFrame(() => {
        this.element.style.setProperty('height', `${this.element.scrollHeight}px`)

        window.requestAnimationFrame(() => {
          this.element.style.setProperty('height', '0px')
        })
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

      window.setTimeout(() => {
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

    if (margin === 'margin-left') {
      this.element.style.removeProperty('margin-right')
    } else if (margin === 'margin-right') {
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

  protected toggleScrollElement (event: ScolaInteractEvent, scroll: boolean): void {
    if (scroll) {
      event.startScroll.element?.style.removeProperty('overflow')
    } else {
      event.startScroll.element?.style.setProperty('overflow', 'hidden')
    }
  }

  protected toggleStart (): void {
    if (this.interact.dir === 'rtl') {
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
