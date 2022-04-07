import { Interactor, Mutator, Observer, Propagator } from '../helpers'
import type { InteractorEvent } from '../helpers'
import type { ScolaElement } from './element'

interface Offset {
  height: number
  width: number
}

export class ScolaResizerElement extends HTMLDivElement implements ScolaElement {
  public contain: boolean

  public direction?: string[]

  public interactor: Interactor

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public snap: number

  public target: string

  public targetOffsets = new Map<HTMLElement, Offset>()

  public targetStyles = new Map<HTMLElement, string>()

  public get data (): unknown {
    return {
      ...this.dataset
    }
  }

  protected handleInteractorBound = this.handleInteractor.bind(this)

  protected handleObserverBound = this.handleObserver.bind(this)

  public constructor () {
    super()
    this.interactor = new Interactor(this)
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-resizer', ScolaResizerElement, {
      extends: 'div'
    })
  }

  public connectedCallback (): void {
    this.interactor.observe(this.handleInteractorBound)

    this.observer.observe(this.handleObserverBound, [
      'sc-maximized'
    ])

    this.interactor.connect()
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
  }

  public disconnectedCallback (): void {
    this.interactor.disconnect()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
  }

  public maximize (): void {
    this.targetStyles.clear()

    document
      .querySelectorAll<HTMLElement>(this.target)
      .forEach((target) => {
        this.targetStyles.set(target, target.getAttribute('style') ?? '')
        target.style.removeProperty('transform')
        target.style.setProperty('height', '100%')
        target.style.setProperty('left', '0px')
        target.style.setProperty('top', '0px')
        target.style.setProperty('width', '100%')
      })
  }

  public minimize (): void {
    document
      .querySelectorAll<HTMLElement>(this.target)
      .forEach((target) => {
        target.setAttribute('style', this.targetStyles.get(target) ?? '')
      })

    this.targetStyles.clear()
  }

  public reset (): void {
    this.contain = this.hasAttribute('sc-contain')

    this.direction = this.getAttribute('sc-direction')
      ?.trim()
      .split(/\s+/u)

    this.interactor.mouse = this.interactor.hasMouse
    this.interactor.touch = this.interactor.hasTouch
    this.snap = Number(this.getAttribute('sc-snap') ?? 1)
    this.target = this.getAttribute('sc-target') ?? ''
  }

  protected calculateSize (size: number, distance: number): number {
    return Math.round((size + distance) / this.snap) * this.snap
  }

  protected handleInteractor (event: InteractorEvent): boolean {
    switch (event.type) {
      case 'end':
        return this.handleInteractorEnd()
      case 'move':
        return this.handleInteractorMove(event)
      case 'start':
        return this.handleInteractorStart()
      default:
        return false
    }
  }

  protected handleInteractorEnd (): boolean {
    this.toggleAttribute('sc-active', false)
    document.body.style.removeProperty('cursor')
    return true
  }

  protected handleInteractorMove (event: InteractorEvent): boolean {
    let handled = false

    if (this.shouldInteractorMoveBottom()) {
      handled = this.handleInteractorMoveBottom(event)
    } else if (this.shouldInteractorMoveTop()) {
      handled = this.handleInteractorMoveTop(event)
    }

    if (this.shouldInteractorMoveLeft()) {
      handled = this.handleInteractorMoveLeft(event)
    } else if (this.shouldInteractorMoveRight()) {
      handled = this.handleInteractorMoveRight(event)
    }

    return handled
  }

  protected handleInteractorMoveBottom (event: InteractorEvent): boolean {
    this.targetOffsets.forEach((offset, target) => {
      const {
        offsetTop: targetTop
      } = target

      const {
        height: parentHeight = 0
      } = target.offsetParent?.getBoundingClientRect() ?? {}

      const height = this.calculateSize(offset.height, event.distanceY)

      if (this.contain) {
        if ((targetTop + height) > parentHeight) {
          if (this.snap === 1) {
            target.style.setProperty('height', `${parentHeight - targetTop}px`)
          }
        } else {
          target.style.setProperty('height', `${height}px`)
        }
      } else {
        target.style.setProperty('height', `${height}px`)
      }
    })

    return true
  }

  protected handleInteractorMoveLeft (event: InteractorEvent): boolean {
    this.targetOffsets.forEach((offset, target) => {
      const position = window.getComputedStyle(target).getPropertyValue('position')

      const {
        offsetLeft: targetLeft,
        offsetWidth: targetWidth
      } = target

      const width = this.calculateSize(offset.width, -event.distanceX)

      if (this.contain) {
        if ((targetLeft - (width - targetWidth) < 0)) {
          if (this.snap === 1) {
            target.style.setProperty('width', `${targetWidth + targetLeft}px`)
          }
        } else {
          target.style.setProperty('width', `${width}px`)
        }
      } else {
        target.style.setProperty('width', `${width}px`)
      }

      const sizeDiff = target.offsetWidth - targetWidth

      if ((
        sizeDiff !== 0
      ) && (
        position === 'absolute' ||
        position === 'fixed'
      )) {
        target.style.setProperty('left', `${target.offsetLeft - sizeDiff}px`)
      }
    })

    return true
  }

  protected handleInteractorMoveRight (event: InteractorEvent): boolean {
    this.targetOffsets.forEach((offset, target) => {
      const {
        offsetLeft: targetLeft
      } = target

      const {
        width: parentWidth = 0
      } = target.offsetParent?.getBoundingClientRect() ?? {}

      const width = this.calculateSize(offset.width, event.distanceX)

      if (this.contain) {
        if ((targetLeft + width) > parentWidth) {
          if (this.snap === 1) {
            target.style.setProperty('width', `${parentWidth - targetLeft}px`)
          }
        } else {
          target.style.setProperty('width', `${width}px`)
        }
      } else {
        target.style.setProperty('width', `${width}px`)
      }
    })

    return true
  }

  protected handleInteractorMoveTop (event: InteractorEvent): boolean {
    this.targetOffsets.forEach((offset, target) => {
      const position = window.getComputedStyle(target).getPropertyValue('position')

      const {
        offsetHeight: targetHeight,
        offsetTop: targetTop
      } = target

      const height = this.calculateSize(offset.height, -event.distanceY)

      if (this.contain) {
        if ((targetTop - (height - targetHeight) < 0)) {
          if (this.snap === 1) {
            target.style.setProperty('height', `${targetHeight + targetTop}px`)
          }
        } else {
          target.style.setProperty('height', `${height}px`)
        }
      } else {
        target.style.setProperty('height', `${height}px`)
      }

      const sizeDiff = target.offsetHeight - targetHeight

      if ((
        sizeDiff !== 0
      ) && (
        position === 'absolute' ||
        position === 'fixed'
      )) {
        target.style.setProperty('top', `${target.offsetTop - sizeDiff}px`)
      }
    })

    return true
  }

  protected handleInteractorStart (): boolean {
    this.targetOffsets.clear()

    document
      .querySelectorAll<HTMLElement>(this.target)
      .forEach((target) => {
        this.targetOffsets.set(target, {
          height: target.offsetHeight,
          width: target.offsetWidth
        })
      })

    this.toggleAttribute('sc-active', true)
    document.body.style.setProperty('cursor', window.getComputedStyle(this).getPropertyValue('cursor'))
    return true
  }

  protected handleObserver (): void {
    this.handleObserverMaximized()
  }

  protected handleObserverMaximized (): void {
    if (this.hasAttribute('sc-maximized')) {
      this.maximize()
    } else {
      this.minimize()
    }
  }

  protected shouldInteractorMoveBottom (): boolean {
    return this.direction?.includes('down') === true
  }

  protected shouldInteractorMoveLeft (): boolean {
    return (
      this.direction?.includes('start') === true &&
      this.interactor.dir === 'ltr'
    ) || (
      this.direction?.includes('end') === true &&
      this.interactor.dir === 'rtl'
    )
  }

  protected shouldInteractorMoveRight (): boolean {
    return (
      this.direction?.includes('end') === true &&
      this.interactor.dir === 'ltr'
    ) || (
      this.direction?.includes('start') === true &&
      this.interactor.dir === 'rtl'
    )
  }

  protected shouldInteractorMoveTop (): boolean {
    return this.direction?.includes('up') === true
  }
}
