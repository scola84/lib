import { absorb, isArray, isStruct } from '../../common'
import type { ScolaElement } from './element'
import { ScolaMutator } from '../helpers/mutator'
import { ScolaObserver } from '../helpers/observer'
import { ScolaPropagator } from '../helpers/propagator'
import type { ScolaViewElement } from './view'
import type { Struct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-request-start': CustomEvent
    'sc-request-stop': CustomEvent
    'sc-request-toggle': CustomEvent
  }
}

type Method =
  | 'CONNECT'
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'OPTIONS'
  | 'POST'
  | 'PUT'
  | 'TRACE'

type Enctype =
  | 'application/x-www-form-urlencoded'
  | 'multipart/form-data'

interface Request {
  body: FormData | URLSearchParams | null
  method: Method
  url: string | null
}

export class ScolaRequestElement extends HTMLObjectElement implements ScolaElement {
  public static origin = window.location.origin

  public enctype: Enctype

  public exact: boolean

  public method: Method

  public mutator: ScolaMutator

  public observer: ScolaObserver

  public origin = ScolaRequestElement.origin

  public propagator: ScolaPropagator

  public url: string

  public view?: ScolaViewElement

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
    this.view = this.closest<ScolaViewElement>('[is="sc-view"]') ?? undefined
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

  public getData (): void {}

  public reset (): void {
    this.enctype = (this.getAttribute('sc-enctype') as Enctype | null) ?? 'application/x-www-form-urlencoded'
    this.exact = this.hasAttribute('sc-exact')
    this.method = (this.getAttribute('sc-method') as Method | null) ?? 'GET'
    this.url = `${this.origin}${this.getAttribute('sc-path') ?? ''}`
    this.wait = this.hasAttribute('sc-wait')
  }

  public setData (): void {}

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

  public update (): void {}

  protected addEventListeners (): void {
    this.addEventListener('sc-request-start', this.handleStartBound)
    this.addEventListener('sc-request-stop', this.handleStopBound)
    this.addEventListener('sc-request-toggle', this.handleToggleBound)
  }

  protected createRequest (options?: Struct): Request {
    const method = String(options?.method ?? this.method) as Method

    let { url } = this as { url: string | null }
    let body: FormData | URLSearchParams | null = null

    if (method === 'GET') {
      url = this.createRequestUrl({
        ...this.view?.view?.params,
        ...options
      })
    } else if (
      options?.body instanceof FormData ||
      options?.body instanceof URLSearchParams
    ) {
      ({ body } = options)
    } else {
      body = this.createRequestBody({
        ...this.view?.view?.params,
        ...options
      })
    }

    return {
      body,
      method,
      url
    }
  }

  protected createRequestBody (data?: Struct): FormData | URLSearchParams | null {
    let body: FormData | URLSearchParams | null = null

    if (this.enctype === 'application/x-www-form-urlencoded') {
      body = new URLSearchParams()
    } else {
      body = new FormData()
    }

    Object
      .entries(absorb(this.dataset, data))
      .map<[string, unknown[]]>(([key, value]) => {
      /* eslint-disable @typescript-eslint/indent */
        if (isArray(value)) {
          return [key, value]
        }

        return [key, [value]]
      })
      /* eslint-enable @typescript-eslint/indent */
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

  protected createRequestUrl (data?: Struct): string | null {
    const url = new URL(this.url)

    Object
      .entries(absorb(this.dataset, data))
      .forEach(([key, value]) => {
        url.searchParams.set(key, String(value))
      })

    if (this.exact) {
      const exact = Object
        .keys(this.dataset)
        .every((key) => {
          return url.searchParams.has(key)
        })

      if (!exact) {
        return null
      }
    }

    return url.toString()
  }

  protected handleError (error: unknown): void {
    this.propagator.dispatch('error', [{
      code: 'err_request',
      message: String(error)
    }])
  }

  protected handleLoadend (event: Event): void {
    if (this.xhr !== undefined) {
      this.setAttribute('sc-state', this.xhr.readyState.toString())

      let data: Struct | string | null = null

      const contentType = this.xhr.getResponseHeader('content-type')

      if (contentType?.startsWith('application/json') === true) {
        data = JSON.parse(this.xhr.responseText) as Struct
      } else if (contentType?.startsWith('text/') === true) {
        data = this.xhr.responseText
      }

      if (this.xhr.status < 400) {
        this.propagator.dispatch('message', [data], event)
      } else {
        this.propagator.dispatch('error', [{
          body: this.xhr.responseText,
          code: `err_${this.xhr.status}`,
          message: this.xhr.statusText
        }], event)

        if (isStruct(data)) {
          this.propagator.dispatch('errordata', [data], event)
        }
      }
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
    if (request.url !== null) {
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
}
