import type { ScolaElement } from '../elements/element'
import { ScolaEvent } from './event'
import { ScolaInteract } from './interact'
import type { ScolaInteractEvent } from './interact'
import { isStruct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-data-set': CustomEvent
  }
}

export class ScolaPropagator {
  public static selector = '[is^="sc-"]:not([sc-nodata])'

  public element: ScolaElement

  public interact: ScolaInteract

  public keydown: string[][]

  public target: string[]

  protected handleInteractBound = this.handleInteract.bind(this)

  protected handleSetBound = this.handleSet.bind(this)

  public constructor (element: ScolaElement) {
    this.element = element
    this.interact = new ScolaInteract(element)
    this.reset()
  }

  public connect (): void {
    this.interact.observe(this.handleInteractBound)
    this.interact.connect()
    this.addEventListeners()
  }

  public disconnect (): void {
    this.interact.disconnect()
    this.removeEventListeners()
  }

  public dispatch (on: string, data: unknown[], trigger?: Event): void {
    this.element
      .getAttribute(`sc-on${on}`)
      ?.trim()
      .split(/\s+/u)
      .forEach((event) => {
        this.dispatchEvent(event, data, trigger)
      })
  }

  public dispatchEvent (event: string, data: unknown[], trigger?: Event): void {
    const [
      name = '',
      selector = ''
    ] = event.split('@')

    if (name !== '') {
      let targets: HTMLElement[] | NodeList = []

      if (selector === '') {
        targets = [this.element]
      } else {
        targets = document.querySelectorAll(selector)
      }

      data.forEach((datum) => {
        targets.forEach((target) => {
          target.dispatchEvent(new ScolaEvent(name, {
            bubbles: target === this.element,
            detail: datum,
            element: this.element,
            trigger
          }))
        })
      })
    }
  }

  public reset (): void {
    this.interact.keyboard = this.interact.hasKeyboard
    this.keydown = this.parseKeydown()

    this.target = (this.element.getAttribute('sc-data-target') ?? '')
      .trim()
      .split(/\s+/u)
  }

  public set (data: unknown): void {
    this.target.forEach((target) => {
      this.setData(data, target)
    })
  }

  public setData (data: unknown, target: string): void {
    let selector = ''
    let source: Document | Element | null = null

    if (target === '') {
      ({ selector } = ScolaPropagator)
      source = this.element
    } else {
      selector = target
      source = document
    }

    source
      .querySelectorAll<ScolaElement>(selector)
      .forEach((element) => {
        const name = element.getAttribute('sc-data-name') ?? ''

        if (
          isStruct(data) &&
          data[name] !== undefined
        ) {
          element.setData(data[name])
        } else {
          element.setData(data)
        }
      })
  }

  protected addEventListeners (): void {
    this.element.addEventListener('sc-data-set', this.handleSetBound)
  }

  protected handleInteract (event: ScolaInteractEvent): boolean {
    if (this.interact.isKeyboard(event.originalEvent, 'down')) {
      return this.handleKeydown(event.originalEvent)
    }

    return false
  }

  protected handleKeydown (event: KeyboardEvent): boolean {
    this.keydown.forEach(([binding, boundEvent]) => {
      if (this.isBound(binding, event)) {
        event.cancelBubble = this.element.hasAttribute('sc-cancel')
        this.dispatchEvent(boundEvent, [this.element.getData()], event)
      }
    })

    return true
  }

  protected handleSet (event: CustomEvent): void {
    this.element.setData(event.detail)
  }

  protected isBound (binding: string, event: KeyboardEvent): boolean {
    return binding
      .split('+')
      .every((key) => {
        if (
          key === 'alt' &&
          event.altKey
        ) {
          return true
        } else if (
          key === 'arrowend' &&
          this.interact.isArrowEnd(event)
        ) {
          return true
        } else if (
          key === 'arrowstart' &&
          this.interact.isArrowStart(event)
        ) {
          return true
        } else if (
          key === 'ctrl' &&
          event.ctrlKey
        ) {
          return true
        } else if (
          key === 'shift' &&
          event.shiftKey
        ) {
          return true
        } else if (
          event.key.toLowerCase() === key ||
          event.code.toLowerCase() === key
        ) {
          return true
        }

        return false
      })
  }

  protected parseKeydown (): string[][] {
    return this.element
      .getAttribute('sc-onkeydown')
      ?.trim()
      .split(/\s+/u)
      .map((event) => {
        return ((/^(?<type>[^:]+):(?<event>.*)$/u).exec(event))?.slice(1) ?? []
      }) ?? []
  }

  protected removeEventListeners (): void {
    this.element.removeEventListener('sc-data-set', this.handleSetBound)
  }
}
