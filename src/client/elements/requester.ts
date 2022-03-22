import { Mutator, Observer, Propagator } from '../helpers'
import { absorb, isArray, isNil, isPrimitive, isStruct, isTransaction } from '../../common'
import type { ScolaElement } from './element'
import type { ScolaViewElement } from './view'
import type { Struct } from '../../common'

declare global {
  interface HTMLElementEventMap {
    'sc-requester-abort': CustomEvent
    'sc-requester-send': CustomEvent
    'sc-requester-toggle': CustomEvent
  }
}

interface ScolaRequesterElementData extends Struct {
  loaded: number
  state: number
  total: number
}

interface Request {
  body: FormData | URLSearchParams | string | null
  method: string
  url: string | null
}

export class ScolaRequesterElement extends HTMLObjectElement implements ScolaElement {
  public static origin = window.location.origin

  public enctype: string

  public exact: boolean

  public method: string

  public mutator: Mutator

  public observer: Observer

  public origin = ScolaRequesterElement.origin

  public propagator: Propagator

  public url: string

  public view?: ScolaViewElement

  public wait: boolean

  public xhr?: XMLHttpRequest

  protected handleAbortBound = this.handleAbort.bind(this)

  protected handleErrorBound = this.handleError.bind(this)

  protected handleLoadendBound = this.handleLoadend.bind(this)

  protected handleProgressBound = this.handleProgress.bind(this)

  protected handleSendBound = this.handleSend.bind(this)

  protected handleToggleBound = this.handleToggle.bind(this)

  public constructor () {
    super()
    this.view = this.closest<ScolaViewElement>('[is="sc-view"]') ?? undefined
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.reset()
  }

  public static define (): void {
    customElements.define('sc-requester', ScolaRequesterElement, {
      extends: 'object'
    })
  }

  public abort (): void {
    this.xhr?.abort()
    this.clear()
  }

  public clear (): void {
    if (this.xhr !== undefined) {
      this.xhr.upload.onprogress = null
      this.xhr.onerror = null
      this.xhr.onloadend = null
      this.xhr.onprogress = null
      this.xhr = undefined
    }
  }

  public connectedCallback (): void {
    this.mutator.connect()
    this.observer.connect()
    this.propagator.connect()
    this.addEventListeners()

    if (!this.wait) {
      this.wait = true
      this.send()
    }
  }

  public disconnectedCallback (): void {
    this.abort()
    this.mutator.disconnect()
    this.observer.disconnect()
    this.propagator.disconnect()
    this.removeEventListeners()
  }

  public getData (): ScolaRequesterElementData {
    return {
      loaded: Number(this.getAttribute('sc-loaded')),
      state: Number(this.getAttribute('sc-state')),
      total: Number(this.getAttribute('sc-total'))
    }
  }

  public reset (): void {
    this.enctype = (this.getAttribute('sc-enctype')) ?? 'application/x-www-form-urlencoded'
    this.exact = this.hasAttribute('sc-exact')
    this.method = this.getAttribute('sc-method') ?? 'GET'
    this.url = this.getAttribute('sc-url') ?? ''
    this.wait = this.hasAttribute('sc-wait')
  }

  public send (options?: unknown): void {
    if (this.xhr !== undefined) {
      this.propagator.dispatch('pending', [options])
      return
    }

    if (!window.navigator.onLine) {
      this.propagator.dispatch('offline', [options])
      return
    }

    this.sendRequest(options)
  }

  public setData (): void {}

  public toObject (): Struct {
    return {
      method: this.method,
      url: this.url
    }
  }

  public toggle (options?: unknown): void {
    if (this.xhr === undefined) {
      this.send(options)
    } else {
      this.abort()
    }
  }

  public update (): void {}

  protected addEventListeners (): void {
    this.addEventListener('sc-requester-send', this.handleSendBound)
    this.addEventListener('sc-requester-abort', this.handleAbortBound)
    this.addEventListener('sc-requester-toggle', this.handleToggleBound)
  }

  protected createRequest (options?: unknown): Request {
    let data = null
    let { method } = this

    if (isTransaction(options)) {
      data = options.commit
    } else {
      data = options
    }

    if (isStruct(data)) {
      if (typeof data.method === 'string') {
        ({ method } = data)
      }

      data = {
        ...this.view?.view?.params,
        ...data
      }
    }

    let { url } = this as { url: string | null }
    let body: FormData | URLSearchParams | string | null = null

    if (method === 'GET') {
      if (isStruct(data)) {
        url = this.createRequestUrl(data)
      }
    } else if (method === 'POST') {
      body = this.createRequestBody(data)
    }

    return {
      body,
      method,
      url
    }
  }

  protected createRequestBody (data: unknown): FormData | URLSearchParams | string | null {
    switch (this.enctype) {
      case 'application/json':
        return this.createRequestBodyJson(data)
      case 'application/x-www-form-urlencoded':
        return this.createRequestBodyFormUrlencoded(data)
      case 'multipart/form-data':
        return this.createRequestBodyFormData(data)
      default:
        return null
    }
  }

  protected createRequestBodyFormData (data: unknown): FormData {
    const body = new FormData()

    if (isStruct(data)) {
      Object
        .entries(data)
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
            if (isNil(value)) {
              body.append(key, '')
            } else if (isPrimitive(value)) {
              body.append(key, value.toString())
            } else if (value instanceof Date) {
              body.append(key, value.toISOString())
            } else if (value instanceof File) {
              body.append(key, value, value.name)
            }
          })
        })
    }

    return body
  }

  protected createRequestBodyFormUrlencoded (data: unknown): URLSearchParams {
    const body = new URLSearchParams()

    if (isStruct(data)) {
      Object
        .entries(data)
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
            if (isNil(value)) {
              body.append(key, '')
            } else if (isPrimitive(value)) {
              body.append(key, value.toString())
            } else if (value instanceof Date) {
              body.append(key, value.toISOString())
            }
          })
        })
    }

    return body
  }

  protected createRequestBodyJson (data?: unknown): string | null {
    if (isNil(data)) {
      return null
    }

    return JSON.stringify(data)
  }

  protected createRequestUrl (data?: Struct): string | null {
    const url = new URL(`${this.origin}${this.url}`)

    Object
      .entries(absorb(this.dataset, data))
      .forEach(([key, value]) => {
        if (isNil(value)) {
          url.searchParams.append(key, '')
        } else if (isPrimitive(value)) {
          url.searchParams.append(key, value.toString())
        }
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

  protected handleAbort (): void {
    this.abort()
  }

  protected handleError (error: unknown): void {
    this.propagator.dispatch('error', [{
      code: 'err_requester',
      message: this.propagator.extractMessage(error)
    }])
  }

  protected handleLoadend (options: unknown, event: Event): void {
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

        if (isTransaction(options)) {
          options.result = data
          this.propagator.dispatch('tmessage', [options], event)
        }
      } else {
        this.propagator.dispatch('error', [{
          body: this.xhr.responseText,
          code: `err_requester_${this.xhr.status}`,
          message: this.xhr.statusText
        }], event)

        if (isStruct(data)) {
          this.propagator.dispatch('errordata', [
            data.body ?? data.query ?? data.headers ?? data
          ], event)
        }

        if (isTransaction(options)) {
          if (isStruct(data)) {
            options.result = data.body ?? data.query ?? data.headers ?? data
          }

          this.propagator.dispatch('terror', [options], event)
        }
      }

      this.clear()
    }
  }

  protected handleProgress (event: ProgressEvent): void {
    this.setAttribute('sc-loaded', event.loaded.toString())
    this.setAttribute('sc-total', event.total.toString())
  }

  protected handleSend (event: CustomEvent): void {
    this.send(event.detail)
  }

  protected handleToggle (event: CustomEvent): void {
    this.toggle(event.detail)
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-requester-abort', this.handleAbortBound)
    this.removeEventListener('sc-requester-send', this.handleSendBound)
    this.removeEventListener('sc-requester-toggle', this.handleToggleBound)
  }

  protected sendRequest (options?: unknown): void {
    const request = this.createRequest(options)

    if (request.url !== null) {
      this.xhr = new window.XMLHttpRequest()

      if (request.method !== 'GET') {
        this.xhr.upload.onprogress = this.handleProgressBound
      }

      this.xhr.onerror = this.handleErrorBound
      this.xhr.onloadend = this.handleLoadend.bind(this, options)
      this.xhr.onprogress = this.handleProgressBound

      try {
        this.xhr.open(request.method, request.url)

        if (
          request.body !== null &&
          this.enctype !== ''
        ) {
          this.xhr.setRequestHeader('Content-Type', this.enctype)
          this.xhr.send(request.body)
        } else {
          this.xhr.send()
        }

        this.setAttribute('sc-state', this.xhr.readyState.toString())
      } catch (error: unknown) {
        this.handleError(error)
      }
    }
  }
}
