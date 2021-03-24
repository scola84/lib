import type { CSSResult, PropertyValues } from 'lit-element'
import { css, customElement, property } from 'lit-element'
import { FormatElement } from './format'
import { InputElement } from './input'
import type { NodeEvent } from './node'

declare global {
  interface HTMLElementEventMap {
    'scola-slider-max': NodeEvent
    'scola-slider-min': NodeEvent
  }

  interface HTMLElementTagNameMap {
    'scola-slider': SliderElement
  }
}

// https://css-tricks.com/sliding-nightmare-understanding-range-input/
@customElement('scola-slider')
export class SliderElement extends InputElement {
  public static styles: CSSResult[] = [
    ...InputElement.styles,
    css`
      slot:not([name]) {
        flex: none;
      }

      input {
        background: none;
        cursor: pointer;
        flex: 1;
        outline: none;
        -moz-appearance: none;
        -webkit-appearance: none;
        --range: calc(var(--max) - var(--min));
        --ratio: calc((var(--val) - var(--min)) / var(--range));
        --sx: calc(0.5 * 1.5em + var(--ratio) * (100% - 1.5em));
      }

      input::-moz-range-progress {
        background: var(--scola-slider-fill-progress, #000);
        border: none;
        border-radius: 0.125rem;
        height: 0.25rem;
        -moz-appearance: none;
        -webkit-appearance: none;
      }

      :host([fill-progress="sig-1"]) input::-moz-range-progress {
        background: var(--scola-slider-fill-progress-sig-1, #b22222);
      }

      :host([fill-progress="sig-2"]) input::-moz-range-progress {
        background: var(--scola-slider-fill-progress-sig-2, #008000);
      }

      input::-moz-range-thumb {
        background: var(--scola-slider-fill-thumb, #fff);
        border: none;
        border-radius: 50%;
        box-shadow: 0 0 0.25rem rgba(0, 0, 0, 0.25);
        cursor: move;
        height: 1.5rem;
        width: 1.5rem;
        -moz-appearance: none;
        -webkit-appearance: none;
      }

      input::-moz-range-track {
        border: none;
        border-radius: 0.125rem;
        height: 0.25rem;
        -moz-appearance: none;
        -webkit-appearance: none;
      }

      :host([fill="aux-1"]) input::-moz-range-track {
        background: var(--scola-slider-fill-track-aux-1, #ddd);
      }

      :host([fill="aux-2"]) input::-moz-range-track {
        background: var(--scola-slider-fill-track-aux-2, #ccc);
      }

      :host([fill="aux-3"]) input::-moz-range-track {
        background: var(--scola-slider-fill-track-aux-3, #bbb);
      }

      input::-webkit-slider-runnable-track {
        border: none;
        border-radius: 0.125rem;
        height: 0.25rem;
        -moz-appearance: none;
        -webkit-appearance: none;
      }

      :host([fill="aux-1"]) input::-webkit-slider-runnable-track {
        background: linear-gradient(
          to right,
          var(--scola-slider-fill-progress-sig-1, #000),
          var(--scola-slider-fill-progress-sig-1, #000) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ddd) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ddd)
        );
      }

      :host([fill="aux-1"][dir="rtl"]) input::-webkit-slider-runnable-track {
        background: linear-gradient(
          to left,
          var(--scola-slider-fill-progress-sig-1, #000),
          var(--scola-slider-fill-progress-sig-1, #000) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ddd) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ddd)
        );
      }

      :host([fill="aux-2"]) input::-webkit-slider-runnable-track {
        background: linear-gradient(
          to right,
          var(--scola-slider-fill-progress-sig-1, #000),
          var(--scola-slider-fill-progress-sig-1, #000) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ccc) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ccc)
        );
      }

      :host([fill="aux-2"][dir="rtl"]) input::-webkit-slider-runnable-track {
        background: linear-gradient(
          to left,
          var(--scola-slider-fill-progress-sig-1, #000),
          var(--scola-slider-fill-progress-sig-1, #000) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ccc) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ccc)
        );
      }

      :host([fill="aux-3"]) input::-webkit-slider-runnable-track {
        background: linear-gradient(
          to right,
          var(--scola-slider-fill-progress-sig-1, #000),
          var(--scola-slider-fill-progress-sig-1, #000) var(--sx),
          var(--scola-slider-fill-track-aux-1, #bbb) var(--sx),
          var(--scola-slider-fill-track-aux-1, #bbb)
        );
      }

      :host([fill="aux-3"][dir="rtl"]) input::-webkit-slider-runnable-track {
        background: linear-gradient(
          to left,
          var(--scola-slider-fill-progress-sig-1, #000),
          var(--scola-slider-fill-progress-sig-1, #000) var(--sx),
          var(--scola-slider-fill-track-aux-1, #bbb) var(--sx),
          var(--scola-slider-fill-track-aux-1, #bbb)
        );
      }

      :host([fill-progress="sig-1"][fill="aux-1"]) input::-webkit-slider-runnable-track {
        background: linear-gradient(
          to right,
          var(--scola-slider-fill-progress-sig-1, #b22222),
          var(--scola-slider-fill-progress-sig-1, #b22222) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ddd) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ddd)
        );
      }

      :host([fill-progress="sig-1"][fill="aux-1"][dir="rtl"]) input::-webkit-slider-runnable-track {
        background: linear-gradient(
          to left,
          var(--scola-slider-fill-progress-sig-1, #b22222),
          var(--scola-slider-fill-progress-sig-1, #b22222) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ddd) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ddd)
        );
      }

      :host([fill-progress="sig-1"][fill="aux-2"]) input::-webkit-slider-runnable-track {
        background: linear-gradient(
          to right,
          var(--scola-slider-fill-progress-sig-1, #b22222),
          var(--scola-slider-fill-progress-sig-1, #b22222) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ccc) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ccc)
        );
      }

      :host([fill-progress="sig-1"][fill="aux-2"][dir="rtl"]) input::-webkit-slider-runnable-track {
        background: linear-gradient(
          to left,
          var(--scola-slider-fill-progress-sig-1, #b22222),
          var(--scola-slider-fill-progress-sig-1, #b22222) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ccc) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ccc)
        );
      }

      :host([fill-progress="sig-1"][fill="aux-3"]) input::-webkit-slider-runnable-track {
        background: linear-gradient(
          to right,
          var(--scola-slider-fill-progress-sig-1, #b22222),
          var(--scola-slider-fill-progress-sig-1, #b22222) var(--sx),
          var(--scola-slider-fill-track-aux-1, #bbb) var(--sx),
          var(--scola-slider-fill-track-aux-1, #bbb)
        );
      }

      :host([fill-progress="sig-1"][fill="aux-3"][dir="rtl"]) input::-webkit-slider-runnable-track {
        background: linear-gradient(
          to left,
          var(--scola-slider-fill-progress-sig-1, #b22222),
          var(--scola-slider-fill-progress-sig-1, #b22222) var(--sx),
          var(--scola-slider-fill-track-aux-1, #bbb) var(--sx),
          var(--scola-slider-fill-track-aux-1, #bbb)
        );
      }

      :host([fill-progress="sig-2"][fill="aux-1"]) input::-webkit-slider-runnable-track {
        background: linear-gradient(
          to right,
          var(--scola-slider-fill-progress-sig-1, #008000),
          var(--scola-slider-fill-progress-sig-1, #008000) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ddd) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ddd)
        );
      }

      :host([fill-progress="sig-2"][fill="aux-1"][dir="rtl"]) input::-webkit-slider-runnable-track {
        background: linear-gradient(
          to left,
          var(--scola-slider-fill-progress-sig-1, #008000),
          var(--scola-slider-fill-progress-sig-1, #008000) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ddd) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ddd)
        );
      }

      :host([fill-progress="sig-2"][fill="aux-2"]) input::-webkit-slider-runnable-track {
        background: linear-gradient(
          to right,
          var(--scola-slider-fill-progress-sig-1, #008000),
          var(--scola-slider-fill-progress-sig-1, #008000) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ccc) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ccc)
        );
      }

      :host([fill-progress="sig-2"][fill="aux-2"][dir="rtl"]) input::-webkit-slider-runnable-track {
        background: linear-gradient(
          to left,
          var(--scola-slider-fill-progress-sig-1, #008000),
          var(--scola-slider-fill-progress-sig-1, #008000) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ccc) var(--sx),
          var(--scola-slider-fill-track-aux-1, #ccc)
        );
      }

      :host([fill-progress="sig-2"][fill="aux-3"]) input::-webkit-slider-runnable-track {
        background: linear-gradient(
          to right,
          var(--scola-slider-fill-progress-sig-1, #008000),
          var(--scola-slider-fill-progress-sig-1, #008000) var(--sx),
          var(--scola-slider-fill-track-aux-1, #bbb) var(--sx),
          var(--scola-slider-fill-track-aux-1, #bbb)
        );
      }

      :host([fill-progress="sig-2"][fill="aux-3"][dir="rtl"]) input::-webkit-slider-runnable-track {
        background: linear-gradient(
          to left,
          var(--scola-slider-fill-progress-sig-1, #008000),
          var(--scola-slider-fill-progress-sig-1, #008000) var(--sx),
          var(--scola-slider-fill-track-aux-1, #bbb) var(--sx),
          var(--scola-slider-fill-track-aux-1, #bbb)
        );
      }

      input::-webkit-slider-thumb {
        background: var(--scola-slider-fill-thumb, #fff);
        border: none;
        border-radius: 50%;
        box-shadow: 0 0 0.25rem rgba(0, 0, 0, 0.25);
        height: 1.5rem;
        margin-top: -0.625rem;
        width: 1.5rem;
        -moz-appearance: none;
        -webkit-appearance: none;
      }
    `
  ]

  @property({
    type: Number
  })
  public duration?: number

  @property({
    attribute: 'fill-progress',
    reflect: true
  })
  public fillProgress?: 'sig-1' | 'sig-2'

  protected get valueElement (): FormatElement | null {
    return this.querySelector<FormatElement>('[is="value"]')
  }

  public constructor () {
    super()
    this.dir = document.dir
  }

  public appendValueTo (data: FormData | URLSearchParams): void {
    this.clearError()
    const { inputElement } = this

    if (inputElement instanceof HTMLInputElement && this.isSuccessful(inputElement)) {
      data.append(inputElement.name, inputElement.value)
    }
  }

  public firstUpdated (properties: PropertyValues): void {
    super.firstUpdated(properties)

    this.addEventListener('scola-slider-max', this.handleMax.bind(this))
    this.addEventListener('scola-slider-min', this.handleMin.bind(this))

    this.inputElement?.addEventListener('input', this.handleSlide.bind(this))
    this.inputElement?.style.setProperty('--max', this.inputElement.max)
    this.inputElement?.style.setProperty('--min', this.inputElement.min)

    this.setValueStyle()
    this.setValueText()
  }

  public setMax (): void {
    this.clearError()

    const {
      name,
      max,
      value
    } = this.inputElement ?? {}

    this.ease(Number(value), Number(max), ({ value: newValue }) => {
      this.setValue({ [name ?? '']: newValue })
    }, {
      duration: this.duration,
      name: 'slider'
    })
  }

  public setMin (): void {
    this.clearError()

    const {
      name,
      min,
      value
    } = this.inputElement ?? {}

    this.ease(Number(value), Number(min), ({ value: newValue }) => {
      this.setValue({ [name ?? '']: newValue })
    }, {
      duration: this.duration,
      name: 'slider'
    })
  }

  public setValue (data: Record<string, unknown>): void {
    this.clearError()
    const { inputElement } = this

    if (inputElement instanceof HTMLInputElement && this.isDefined(inputElement, data)) {
      inputElement.value = String(data[inputElement.name])
    }

    this.setValueStyle()
    this.setValueText()
  }

  protected handleInput (): void {
    super.handleInput()
    this.setValueStyle()
    this.setValueText()
  }

  protected handleMax (): void {
    this.setMax()
  }

  protected handleMin (): void {
    this.setMin()
  }

  protected handleSlide (): void {
    this.setValueStyle()
  }

  protected setValueStyle (): void {
    this.inputElement?.style.setProperty('--val', this.inputElement.value)
  }

  protected setValueText (): void {
    const {
      inputElement,
      valueElement
    } = this

    if (
      inputElement instanceof HTMLInputElement &&
      valueElement instanceof FormatElement
    ) {
      valueElement.data = {
        value: inputElement.value
      }
    }
  }
}
