import { cast, hyphenize, isStruct } from '../../common'
import type { ScolaElement } from '../elements/element'
import { ScolaSanitizer } from './sanitizer'
import { isValidAttribute } from 'dompurify'

declare global {
  interface HTMLElementEventMap {
    'sc-attrs-set': CustomEvent
    'sc-attrs-toggle': CustomEvent
    'sc-class-set': CustomEvent
    'sc-class-toggle': CustomEvent
  }
}

export class ScolaMutator {
  public element: ScolaElement

  public sanitizer: ScolaSanitizer

  protected handleSetAttributesBound = this.handleSetAttributes.bind(this)

  protected handleSetClassesBound = this.handleSetClasses.bind(this)

  protected handleToggleAttributesBound = this.handleToggleAttributes.bind(this)

  protected handleToggleClassesBound = this.handleToggleClasses.bind(this)

  public constructor (element: ScolaElement) {
    this.element = element
    this.sanitizer = new ScolaSanitizer()
  }

  public connect (): void {
    this.addEventListeners()
  }

  public disconnect (): void {
    this.removeEventListeners()
  }

  public setAttributes (data: unknown): void {
    if (isStruct(data)) {
      Object
        .entries(data)
        .map(([name, value]) => {
          return [hyphenize(name), value]
        })
        .forEach(([name, value]) => {
          const attrName = String(name)
          const attrValue = String(value)
          const castValue = cast(value)

          if (typeof castValue === 'boolean') {
            this.element.toggleAttribute(attrName, castValue)
          } else if (this.sanitizer.checkAttribute(this.element.nodeName, attrName, attrValue)) {
            this.element.setAttribute(attrName, attrValue)
          }
        })
    }
  }

  public setClasses (data: unknown): void {
    if (
      isStruct(data) &&
      typeof data.name === 'string'
    ) {
      data.name
        .split(' ')
        .forEach((name) => {
          this.element.classList.add(name)
        })
    }
  }

  public toggleAttributes (data: unknown): void {
    if (isStruct(data)) {
      Object
        .entries(data)
        .map(([name, value]) => {
          return [hyphenize(name), value]
        })
        .forEach(([name, value]) => {
          const attrName = String(name)
          const attrValue = String(value)
          const castValue = cast(value)

          if (typeof castValue === 'boolean') {
            this.element.toggleAttribute(attrName)
          } else if (value === this.element.getAttribute(attrName)) {
            this.element.removeAttribute(attrName)
          } else if (isValidAttribute(this.element.nodeName, attrName, attrValue)) {
            this.element.setAttribute(attrName, attrValue)
          }
        })
    }
  }

  public toggleClasses (data: unknown): void {
    if (
      isStruct(data) &&
      typeof data.name === 'string'
    ) {
      data.name
        .split(' ')
        .forEach((name) => {
          this.element.classList.toggle(name)
        })
    }
  }

  protected addEventListeners (): void {
    this.element.addEventListener('sc-attrs-set', this.handleSetAttributesBound)
    this.element.addEventListener('sc-attrs-toggle', this.handleToggleAttributesBound)
    this.element.addEventListener('sc-class-set', this.handleSetClassesBound)
    this.element.addEventListener('sc-class-toggle', this.handleToggleClassesBound)
  }

  protected handleSetAttributes (event: CustomEvent): void {
    this.setAttributes(event.detail)
  }

  protected handleSetClasses (event: CustomEvent): void {
    this.setClasses(event.detail)
  }

  protected handleToggleAttributes (event: CustomEvent): void {
    this.toggleAttributes(event.detail)
  }

  protected handleToggleClasses (event: CustomEvent): void {
    this.toggleClasses(event.detail)
  }

  protected removeEventListeners (): void {
    this.element.removeEventListener('sc-attrs-set', this.handleSetAttributesBound)
    this.element.removeEventListener('sc-attrs-toggle', this.handleToggleAttributesBound)
    this.element.removeEventListener('sc-class-set', this.handleSetClassesBound)
    this.element.removeEventListener('sc-class-toggle', this.handleToggleClassesBound)
  }
}
