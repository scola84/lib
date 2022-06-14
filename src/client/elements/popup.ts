import { Breakpoint, Indexer, Interactor, Mutator, Observer, Propagator } from '../helpers'
import type { InteractorEvent, ScolaEvent } from '../helpers'
import type { ScolaElement } from './element'

declare global {
  interface HTMLElementEventMap {
    'sc-popup-hide': ScolaEvent
    'sc-popup-show': ScolaEvent
    'sc-popup-toggle': ScolaEvent
  }
}

type Left =
| 'center'
| 'end-at-start'
| 'end'
| 'screen-center'
| 'start-at-end'
| 'start'

type Sync =
| 'both'
| 'height'
| 'width'

type Top =
| 'bottom-at-top'
| 'bottom'
| 'center'
| 'screen-center'
| 'top-at-bottom'
| 'top'

interface Position {
  left: Left
  top: Top
}

interface Style {
  left: number
  top: number
}

const leftAlternatives: Record<Left, Left[]> = {
  'center': ['center', 'start', 'end', 'screen-center'],
  'end': ['end', 'start', 'center', 'screen-center'],
  'end-at-start': ['end-at-start', 'start-at-end', 'screen-center'],
  'screen-center': ['screen-center'],
  'start': ['start', 'end', 'center', 'screen-center'],
  'start-at-end': ['start-at-end', 'end-at-start', 'screen-center']
}

const topAlternatives: Record<Top, Top[]> = {
  'bottom': ['bottom', 'top', 'center', 'screen-center'],
  'bottom-at-top': ['bottom-at-top', 'top-at-bottom', 'screen-center'],
  'center': ['center', 'top', 'bottom', 'screen-center'],
  'screen-center': ['screen-center'],
  'top': ['top', 'bottom', 'center', 'screen-center'],
  'top-at-bottom': ['top-at-bottom', 'bottom-at-top', 'screen-center']
}

export class ScolaPopupElement extends HTMLDivElement implements ScolaElement {
  public anchor?: HTMLElement

  public breakpoint: Breakpoint

  public immediate = true

  public indexer: Indexer

  public interactor: Interactor

  public left: Left

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public sync: Sync | null

  public top: Top

  public transition: boolean

  public trigger?: MouseEvent

  public get data (): unknown {
    return {
      ...this.dataset
    }
  }

  public set data (data: unknown) {
    this.propagator.setData(data)
  }

  protected handleBreakpointBound = this.handleBreakpoint.bind(this)

  protected handleHideBound = this.handleHide.bind(this)

  protected handleInteractorBound = this.handleInteractor.bind(this)

  protected handleObserverBound = this.handleObserver.bind(this)

  protected handleScrollBound = this.handleScroll.bind(this)

  protected handleShowBound = this.handleShow.bind(this)

  protected handleToggleBound = this.handleToggle.bind(this)

  protected handleTransitionendBound = this.handleTransitionend.bind(this)

  public constructor () {
    super()
    this.breakpoint = new Breakpoint(this)
    this.indexer = new Indexer()
    this.interactor = new Interactor(this)
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.reset()
    this.hide()
  }

  public static define (): void {
    customElements.define('sc-popup', ScolaPopupElement, {
      extends: 'div'
    })
  }

  public connectedCallback (): void {
    this.breakpoint.observe(this.handleBreakpointBound)
    this.interactor.observe(this.handleInteractorBound)

    this.observer.observe(this.handleObserverBound, [
      'hidden'
    ])

    this.breakpoint.connect()
    this.interactor.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()
  }

  public disconnectedCallback (): void {
    if (this.hasAttribute('hidden')) {
      this.finalize()
    }

    this.breakpoint.disconnect()
    this.interactor.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
  }

  public hide (): void {
    if (this.immediate) {
      this.style.setProperty('opacity', '0')
      this.style.setProperty('transition-property', 'none')
      this.finalize()
    } else {
      this.style.setProperty('opacity', '1')
      this.style.setProperty('transition-property', 'opacity')

      window.requestAnimationFrame(() => {
        this.style.setProperty('opacity', '0')
      })
    }
  }

  public reset (): void {
    this.interactor.keyboard = this.interactor.hasKeyboard
    this.interactor.mouse = this.interactor.hasMouse
    this.interactor.target = 'window'
    this.interactor.touch = this.interactor.hasTouch
    this.left = (this.breakpoint.parseAttribute('sc-left') as Left | null) ?? 'center'
    this.sync = this.breakpoint.parseAttribute('sc-sync') as Sync | null
    this.top = (this.breakpoint.parseAttribute('sc-top') as Top | null) ?? 'center'
    this.transition = this.breakpoint.parseAttribute('sc-transition') === ''
  }

  public show (): void {
    this.style.removeProperty('display')
    this.style.setProperty('opacity', '0')
    this.indexer.set(this)
    this.syncSize()

    const position = {
      left: this.left,
      top: this.top
    }

    let style = {
      left: 0,
      top: 0
    }

    if (this.trigger !== undefined) {
      style.left = this.trigger.clientX
      style.top = this.trigger.clientY
    } else if (this.anchor !== undefined) {
      style = this.calculateStyle(position)
    }

    this.setAttribute('sc-left-calc', position.left)
    this.setAttribute('sc-top-calc', position.top)
    this.style.setProperty('left', `${style.left}px`)
    this.style.setProperty('top', `${style.top}px`)

    if (this.immediate) {
      this.style.setProperty('transition-property', 'none')
    } else {
      this.style.setProperty('transition-property', 'opacity')
    }

    window.requestAnimationFrame(() => {
      this.style.setProperty('opacity', '1')

      if (this.immediate) {
        this.finalize()
      }
    })
  }

  public toJSON (): unknown {
    return {
      id: this.id,
      immediate: this.immediate,
      is: this.getAttribute('is'),
      left: this.left,
      nodeName: this.nodeName,
      top: this.top,
      transition: this.transition
    }
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-popup-hide', this.handleHideBound)
    this.addEventListener('sc-popup-show', this.handleShowBound)
    this.addEventListener('sc-popup-toggle', this.handleToggleBound)
    this.addEventListener('transitionend', this.handleTransitionendBound)
    window.addEventListener('scroll', this.handleScrollBound, true)
  }

  protected calculateAlternativeStyle (position: Position): Style {
    return {
      left: this.calculateAlternativeStyleLeft(position),
      top: this.calculateAlternativeStyleTop(position)
    }
  }

  protected calculateAlternativeStyleLeft (position: Position): number {
    const {
      left: offsetLeft = 0,
      width: offsetWidth = 0
    } = this.anchor?.getBoundingClientRect() ?? {}

    let left = offsetLeft

    switch (`${position.left}-${this.interactor.dir}`) {
      case 'center-ltr':
      case 'center-rtl':
        left += -(this.offsetWidth - offsetWidth) / 2
        break
      case 'end-rtl':
      case 'start-ltr':
        left += 0
        break
      case 'end-ltr':
      case 'start-rtl':
        left += -this.offsetWidth + offsetWidth
        break
      case 'end-at-start-rtl':
      case 'start-at-end-ltr':
        left += offsetWidth
        break
      case 'end-at-start-ltr':
      case 'start-at-end-rtl':
        left += -this.offsetWidth
        break
      case 'screen-center-ltr':
      case 'screen-center-rtl':
        left = (window.innerWidth - this.offsetWidth) / 2
        break
      default:
        break
    }

    return left - (this.offsetParent?.getBoundingClientRect().left ?? 0)
  }

  protected calculateAlternativeStyleTop (position: Position): number {
    const {
      height: offsetHeight = 0,
      top: offsetTop = 0
    } = this.anchor?.getBoundingClientRect() ?? {}

    let top = offsetTop + offsetHeight

    switch (position.top) {
      case 'bottom':
        top += -this.offsetHeight
        break
      case 'bottom-at-top':
        top += -this.offsetHeight - offsetHeight
        break
      case 'center':
        top += -(this.offsetHeight + offsetHeight) / 2
        break
      case 'screen-center':
        top = (window.innerHeight - this.offsetHeight) / 2
        break
      case 'top':
        top += -offsetHeight
        break
      case 'top-at-bottom':
        break
      default:
        break
    }

    return top - (this.offsetParent?.getBoundingClientRect().top ?? 0)
  }

  protected calculateStyle (position: Position): Style {
    let style = {
      left: 0,
      top: 0
    }

    leftAlternatives[this.left].some((alternative: Left): boolean => {
      position.left = alternative
      style = this.calculateAlternativeStyle(position)
      return (
        style.left >= 0 &&
        (style.left + this.offsetWidth) <= (this.offsetParent?.getBoundingClientRect().width ?? window.innerWidth)
      )
    })

    topAlternatives[this.top].some((alternative: Top): boolean => {
      position.top = alternative
      style = this.calculateAlternativeStyle(position)
      return (
        style.top >= 0 &&
        (style.top + this.offsetHeight) <= (this.offsetParent?.getBoundingClientRect().height ?? window.innerHeight)
      )
    })

    return style
  }

  protected finalize (): void {
    if (this.transition) {
      this.immediate = false
    }

    if (this.hasAttribute('hidden')) {
      this.style.setProperty('display', 'none', 'important')
      this.indexer.remove(this)
      this.propagator.dispatchEvents('afterhide')
    } else {
      this.propagator.dispatchEvents('aftershow')
    }

    this.focusElement()
  }

  protected focusElement (): void {
    if (!this.hasAttribute('hidden')) {
      const element = this.querySelector('[sc-focus~="popup"]')

      if (element instanceof HTMLElement) {
        element.focus()
      }
    }
  }

  protected handleBreakpoint (): void {
    this.reset()

    if (!this.hasAttribute('hidden')) {
      this.show()
    }
  }

  protected handleHide (): void {
    this.toggleAttribute('hidden', true)
  }

  protected handleInteractor (event: InteractorEvent): boolean {
    switch (event.type) {
      case 'start':
        return this.handleInteractorStart(event)
      default:
        return false
    }
  }

  protected handleInteractorStart (event: InteractorEvent): boolean {
    if ((
      !this.hasAttribute('hidden')
    ) && (
      this.interactor.isKey(event.originalEvent, 'Escape') ||
      !event.originalEvent.composedPath().includes(this)
    )) {
      this.toggleAttribute('hidden', true)
    }

    return false
  }

  protected handleObserver (): void {
    this.handleObserverHidden()
  }

  protected handleObserverHidden (): void {
    if (this.hasAttribute('hidden')) {
      this.hide()
    } else {
      this.show()
    }
  }

  protected handleScroll (): void {
    this.toggleAttribute('hidden', true)
  }

  protected handleShow (event: ScolaEvent): void {
    const anchor = event.element.getAttribute('sc-popup-anchor')

    if (anchor !== null) {
      if (anchor === '') {
        this.anchor = event.element
        this.trigger = undefined
      } else {
        this.anchor = document.getElementById(anchor) ?? undefined
        this.trigger = undefined
      }
    } else if (event.trigger instanceof MouseEvent) {
      this.trigger = event.trigger
    }

    if (this.hasAttribute('hidden')) {
      this.toggleAttribute('hidden', false)
    } else {
      this.show()
    }
  }

  protected handleToggle (event: ScolaEvent): void {
    const anchor = event.element.getAttribute('sc-popup-anchor')

    if (anchor !== null) {
      if (anchor === '') {
        this.anchor = event.element
        this.trigger = undefined
      } else {
        this.anchor = document.getElementById(anchor) ?? undefined
        this.trigger = undefined
      }
    } else if (event.trigger instanceof MouseEvent) {
      this.trigger = event.trigger
    }

    this.toggleAttribute('hidden')
  }

  protected handleTouchstart (event: TouchEvent): void {
    if (!event.composedPath().includes(this)) {
      this.toggleAttribute('hidden', true)
    }
  }

  protected handleTransitionend (event: TransitionEvent): void {
    if (event.target === this) {
      this.finalize()
    }
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-popup-hide', this.handleHideBound)
    this.removeEventListener('sc-popup-show', this.handleShowBound)
    this.removeEventListener('sc-popup-toggle', this.handleToggleBound)
    this.removeEventListener('transitionend', this.handleTransitionendBound)
    window.removeEventListener('scroll', this.handleScrollBound, true)
  }

  protected syncSize (): void {
    if (
      this.sync === 'height' ||
      this.sync === 'both'
    ) {
      this.style.setProperty('height', `${this.anchor?.offsetHeight ?? 0}px`)
    }

    if (
      this.sync === 'width' ||
      this.sync === 'both'
    ) {
      this.style.setProperty('width', `${this.anchor?.offsetWidth ?? 0}px`)
    }
  }
}
