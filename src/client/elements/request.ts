import { absorb, isArray, isNil, isStruct } from '../../common'
import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { Struct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-request-start': CustomEvent
    'sc-request-stop': CustomEvent
    'sc-request-toggle': CustomEvent
  }
}

interface Request {
  body: FormData | URLSearchParams | null
  method: string
  url: string
}

export class ScolaRequestElement extends HTMLObjectElement implements ScolaElement {
  public static origin = window.location.origin

  public datamap: Struct = {}

  public enctype: string

  public method: string

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public origin = ScolaRequestElement.origin

  public propagator: ScolaPropagator

  public url: URL

  public view?: HTMLElement

  public wait: boolean

  public xhr?: XMLHttpRequest

  protected handleErrorBound = this.handleError.bind(this)

  protected handleLoadendBound = this.handleLoadend.bind(this)

  protected handleProgressBound = this.handleProgress.bind(this)

  protected handleStartBound = this.handleStart.bind(this)

  protected handleStopBound = this.handleStop.bind(this)

  protected handleToggleBound = this.handleToggle.bind(this)

  public constructor () {
    super()
    this.view = this.closest<HTMLElement>('[is="sc-view"]') ?? undefined
    this.mutator = new ScolaMutator(this)
    this.observer = new ScolaObserver(this)
    this.propagator = new ScolaPropagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-request', ScolaRequestElement, {
      extends: 'object'
    })
  }

  public connectedCallback (): void {
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()

    if (!this.wait) {
      this.wait = true
      this.start()
    }
  }

  public disconnectedCallback (): void {
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
    this.stop()
  }

  public getData (): Struct {
    return absorb(this.dataset, this.datamap, true)
  }

  public reset (): void {
    this.enctype = this.getAttribute('sc-enctype') ?? 'application/x-www-form-urlencoded'
    this.method = this.getAttribute('sc-method') ?? 'GET'
    this.url = new URL(`${this.origin}${this.getAttribute('sc-path') ?? ''}`)
    this.wait = this.hasAttribute('sc-wait')
  }

  public setData (data: unknown): void {
    if (isStruct(data)) {
      Object.assign(this.datamap, data)
      this.update()
    }
  }

  public start (options?: Struct): void {
    if (this.xhr === undefined) {
      this.send(this.createRequest(options))
    }
  }

  public stop (): void {
    this.xhr?.abort()
    this.xhr = undefined
  }

  public toggle (options?: Struct): void {
    if (this.xhr === undefined) {
      this.start(options)
    } else {
      this.stop()
    }
  }

  public update (): void {
    this.start()
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-request-start', this.handleStartBound)
    this.addEventListener('sc-request-stop', this.handleStopBound)
    this.addEventListener('sc-request-toggle', this.handleToggleBound)
  }

  protected createRequest (options?: Struct): Request {
    const method = String(options?.method ?? this.method)

    let { url } = this
    let body: FormData | URLSearchParams | null = null

    if (method === 'GET') {
      url = this.createRequestUrl({
        ...this.view?.dataset,
        ...options
      })
    } else if (
      options?.body instanceof FormData ||
      options?.body instanceof URLSearchParams
    ) {
      ({ body } = options)
    } else {
      body = this.createRequestBody({
        ...this.view?.dataset,
        ...options
      })
    }

    return {
      body,
      method,
      url: url.toString()
    }
  }

  protected createRequestBody (data?: Struct): FormData | URLSearchParams | null {
    let body: FormData | URLSearchParams | null = null

    if (this.enctype === 'application/x-www-form-urlencoded') {
      body = new URLSearchParams()
    } else if (this.enctype === 'multipart/form-data') {
      body = new FormData()
    }

    Object
      .entries(absorb(this.getData(), data))
      .map((key, value) => {
        if (isArray(value)) {
          return [key, value]
        }

        return [key, [value]]
      })
      .forEach(([key, values]) => {
        values.forEach((value) => {
          if (
            value instanceof File &&
            body instanceof FormData
          ) {
            body.append(String(key), value, value.name)
          } else {
            body?.append(String(key), String(value))
          }
        })
      })

    return body
  }

  protected createRequestUrl (data?: Struct): URL {
    Object
      .entries(absorb(this.getData(), data, true))
      .forEach(([key, value]) => {
        if (
          isNil(value) ||
          value === ''
        ) {
          this.url.searchParams.delete(key)
        } else {
          this.url.searchParams.set(key, String(value))
        }
      })

    return this.url
  }

  protected handleError (error: unknown): void {
    this.propagator.dispatch('error', [{
      code: 'err_request',
      message: String(error)
    }])
  }

  protected handleLoadend (event: Event): void {
    if (this.xhr !== undefined) {
      let data: Struct | string | null = null

      const contentType = this.xhr.getResponseHeader('content-type')

      if (contentType?.startsWith('application/json') === true) {
        data = JSON.parse(this.xhr.responseText) as Struct
      } else if (contentType?.startsWith('text/') === true) {
        data = this.xhr.responseText
      }

      if (this.xhr.status < 400) {
        this.propagator.dispatch('ok', [data], event)
      } else {
        const error = {
          body: this.xhr.responseText,
          code: `err_${this.xhr.status}`,
          message: this.xhr.statusText
        }

        if (isStruct(data)) {
          this.propagator.dispatch('error', [{
            ...error,
            ...data
          }], event)
        } else {
          this.propagator.dispatch('error', [error], event)
        }
      }

      this.setAttribute('sc-state', this.xhr.readyState.toString())
      this.propagator.set(data)
    }

    this.xhr = undefined
  }

  protected handleProgress (event: ProgressEvent): void {
    this.setAttribute('sc-loaded', event.loaded.toString())
    this.setAttribute('sc-total', event.total.toString())
  }

  protected handleStart (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this.start(event.detail)
    } else {
      this.start()
    }
  }

  protected handleStop (): void {
    this.stop()
  }

  protected handleToggle (event: CustomEvent): void {
    if (isStruct(event.detail)) {
      this.toggle(event.detail)
    } else {
      this.toggle()
    }
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-request-start', this.handleStartBound)
    this.removeEventListener('sc-request-stop', this.handleStopBound)
    this.removeEventListener('sc-request-toggle', this.handleToggleBound)
  }

  protected send (request: Request): void {
    this.xhr = new window.XMLHttpRequest()

    if (request.method !== 'GET') {
      this.xhr.upload.addEventListener('progress', this.handleProgressBound)
    }

    this.xhr.addEventListener('error', this.handleErrorBound)
    this.xhr.addEventListener('loadend', this.handleLoadendBound)
    this.xhr.addEventListener('progress', this.handleProgressBound)

    try {
      this.xhr.open(request.method, request.url)
      this.xhr.send(request.body)
      this.setAttribute('sc-state', this.xhr.readyState.toString())
    } catch (error: unknown) {
      this.handleError(error)
    }
  }
}
