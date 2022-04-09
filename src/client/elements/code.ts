import { Mutator, Observer, Propagator } from '../helpers'
import type { ScolaElement } from './element'
import { cast } from '../../common'
import { highlightElement } from 'prismjs'

/**
 * Many thanks to https://css-tricks.com/creating-an-editable-textarea-that-supports-syntax-highlighted-code/
 */
export class ScolaCodeElement extends HTMLDivElement implements ScolaElement {
  public editor: HTMLTextAreaElement | null

  public mutator: Mutator

  public observer: Observer

  public propagator: Propagator

  public tab: string | null

  public get data (): unknown {
    return this.innerHTML
  }

  public set data (data: unknown) {
    this.highlight(cast(data)?.toString() ?? '')
  }

  protected handleInputBound = this.handleInput.bind(this)

  protected handleKeydownBound = this.handleKeydown.bind(this)

  protected handleScrollBound = this.handleScroll.bind(this)

  public constructor () {
    super()
    this.editor = this.selectEditor()
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-code', ScolaCodeElement, {
      extends: 'div'
    })
  }

  public connectedCallback (): void {
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()

    if (this.editor === null) {
      this.highlight(this.innerHTML)
    } else {
      this.highlight(this.editor.value)
    }
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
  }

  public reset (): void {
    this.tab = this.getAttribute('sc-tab')
  }

  public toJSON (): unknown {
    return {
      id: this.id,
      is: this.getAttribute('is'),
      nodeName: this.nodeName,
      tab: this.tab
    }
  }

  protected addEventListeners (): void {
    if (this.editor !== null) {
      this.editor.addEventListener('input', this.handleInputBound)
      this.editor.addEventListener('keydown', this.handleKeydownBound)
      this.editor.addEventListener('scroll', this.handleScrollBound)
    }
  }

  protected handleInput (): void {
    if (this.editor !== null) {
      this.highlight(this.editor.value)
    }
  }

  protected handleKeydown (event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      if (
        this.editor !== null &&
        this.tab !== null
      ) {
        event.preventDefault()
        this.insertTab(this.editor, this.tab)
        this.highlight(this.editor.value)
      }
    }
  }

  protected handleScroll (): void {
    if (this.editor !== null) {
      this.scrollLeft = this.editor.scrollLeft
      this.scrollTop = this.editor.scrollTop
    }
  }

  protected highlight (code: string): void {
    let value = code

    if (value.endsWith('\n')) {
      value += ' '
    }

    this.innerHTML = value
      .replace(/&/gu, '&amp;')
      .replace(/</gu, '&lt;')

    highlightElement(this)
  }

  protected insertTab (editor: HTMLTextAreaElement, tab: string): void {
    const { value } = editor
    const before = value.slice(0, editor.selectionStart)
    const after = value.slice(editor.selectionEnd, value.length)
    const position = editor.selectionEnd + tab.length

    editor.value = `${before}${tab}${after}`
    editor.selectionStart = position
    editor.selectionEnd = position
  }

  protected removeEventListeners (): void {
    if (this.editor !== null) {
      this.editor.removeEventListener('input', this.handleInputBound)
      this.editor.removeEventListener('keydown', this.handleKeydownBound)
      this.editor.removeEventListener('scroll', this.handleScrollBound)
    }
  }

  protected selectEditor (): HTMLTextAreaElement | null {
    const selector = this.getAttribute('sc-editor')

    if (selector !== null) {
      const editor = document.querySelector(selector)

      if (editor instanceof HTMLTextAreaElement) {
        return editor
      }
    }

    return null
  }
}
