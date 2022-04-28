import { Interactor, Mutator, Observer, Propagator } from '../helpers'
import type { InteractorEvent } from '../helpers'
import type { ScolaElement } from './element'

interface Offset {
  left: number
  top: number
}

export class ScolaMoverElement extends HTMLDivElement implements ScolaElement {
  public contain: boolean

  public interactor: Interactor

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public snap: number

  public target: string

  public targetOffsets = new Map<HTMLElement, Offset>()

  public get data (): unknown {
    return {
      ...this.dataset
    }
  }

  protected handleInteractorBound = this.handleInteractor.bind(this)

  public constructor () {
    super()
    this.interactor = new Interactor(this)
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-mover', ScolaMoverElement, {
      extends: 'div'
    })
  }

  public connectedCallback (): void {
    this.interactor.observe(this.handleInteractorBound)
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

  public reset (): void {
    this.contain = this.hasAttribute('sc-contain')
    this.interactor.mouse = this.interactor.hasMouse
    this.interactor.touch = this.interactor.hasTouch
    this.snap = Number(this.getAttribute('sc-snap') ?? 1)
    this.target = this.getAttribute('sc-target') ?? ''
  }

  public toJSON (): unknown {
    return {
      contain: this.contain,
      id: this.id,
      is: this.getAttribute('is'),
      nodeName: this.nodeName,
      snap: this.snap,
      target: this.target
    }
  }

  protected calculatePosition (position: number, distance: number): number {
    return Math.round((position + distance) / this.snap) * this.snap
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
    this.targetOffsets.forEach((offset, target) => {
      const {
        height: targetHeight,
        width: targetWidth
      } = target.getBoundingClientRect()

      const {
        height: parentHeight = 0,
        width: parentWidth = 0
      } = target.offsetParent?.getBoundingClientRect() ?? {}

      const left = this.calculatePosition(offset.left, event.distanceX)
      const top = this.calculatePosition(offset.top, event.distanceY)

      if (this.contain) {
        if (left < 0) {
          if (this.snap === 1) {
            target.style.setProperty('left', '0px')
          }
        } else if ((left + targetWidth) > parentWidth) {
          if (this.snap === 1) {
            target.style.setProperty('left', `${parentWidth - targetWidth}px`)
          }
        } else {
          target.style.setProperty('left', `${left}px`)
        }

        if (top < 0) {
          if (this.snap === 1) {
            target.style.setProperty('top', '0px')
          }
        } else if ((top + targetHeight) > parentHeight) {
          if (this.snap === 1) {
            target.style.setProperty('top', `${parentHeight - targetHeight}px`)
          }
        } else {
          target.style.setProperty('top', `${top}px`)
        }
      } else {
        target.style.setProperty('left', `${left}px`)
        target.style.setProperty('top', `${top}px`)
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
          left: target.offsetLeft,
          top: target.offsetTop
        })
      })

    this.toggleAttribute('sc-active', true)
    document.body.style.setProperty('cursor', window.getComputedStyle(this).getPropertyValue('cursor'))
    return true
  }
}
