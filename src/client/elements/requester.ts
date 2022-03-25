import { Mutator, Observer, Propagator } from '../helpers'
import { absorb, isArray, isNil, isPrimitive, isStruct, isTransaction } from '../../common'
import type { ScolaElement } from './element'
import type { ScolaViewElement } from './view'
import type { Struct } from '../../common'
import type { queue as fastq } from 'fastq'
import queue from 'fastq'

declare global {
  interface HTMLElementEventMap {
    'sc-requester-abort': CustomEvent
    'sc-requester-send': CustomEvent
  }
}

declare module 'fastq' {
  interface queue {
    running: () => number
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
  url: string
}

export class ScolaRequesterElement extends HTMLObjectElement implements ScolaElement {
  public static origin = window.location.origin

  public concurrency: number

  public enctype: string

  public max: number

  public method: string

  public mutator: Mutator

  public observer: Observer

  public origin = ScolaRequesterElement.origin

  public propagator: Propagator

  public queue: fastq

  public url: string

  public view?: ScolaViewElement

  public wait: boolean

  public xhr: Set<XMLHttpRequest> = new Set()

  public get opened (): number {
    return this.xhr.size
  }

  public get queued (): number {
    return this.queue.length() + this.queue.running()
  }

  protected handleAbortBound = this.handleAbort.bind(this)

  protected handleErrorBound = this.handleError.bind(this)

  protected handleLoadendBound = this.handleLoadend.bind(this)

  protected handleProgressBound = this.handleProgress.bind(this)

  protected handleQueueBound = this.handleQueue.bind(this)

  protected handleSendBound = this.handleSend.bind(this)

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
    this.xhr.forEach((xhr) => {
      xhr.abort()
    })

    this.xhr.clear()
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
      opened: Number(this.getAttribute('sc-opened')),
      queued: Number(this.getAttribute('sc-queued')),
      state: Number(this.getAttribute('sc-state')),
      total: Number(this.getAttribute('sc-total'))
    }
  }

  public reset (): void {
    this.concurrency = Number(this.getAttribute('sc-concurrency') ?? 1)
    this.enctype = (this.getAttribute('sc-enctype')) ?? 'application/x-www-form-urlencoded'
    this.max = Number(this.getAttribute('sc-max') ?? 1)
    this.method = this.getAttribute('sc-method') ?? 'GET'
    this.url = this.getAttribute('sc-url') ?? ''
    this.wait = this.hasAttribute('sc-wait')
    this.queue = queue(this.handleQueueBound, this.concurrency)
  }

  public send (options?: unknown): void {
    if (
      this.max > -1 &&
      this.opened === this.max
    ) {
      this.propagator.dispatch('max', [options])
      return
    }

    if (!window.navigator.onLine) {
      this.propagator.dispatch('offline', [options])
      return
    }

    this.queue.push(options, () => {
      window.requestAnimationFrame(() => {
        this.setAttribute('sc-queued', this.queued.toString())
      })
    })

    this.setAttribute('sc-queued', this.queued.toString())
  }

  public setData (): void {}

  public toObject (): Struct {
    return {
      method: this.method,
      url: this.url
    }
  }

  public update (): void {}

  protected addEventListeners (): void {
    this.addEventListener('sc-requester-send', this.handleSendBound)
    this.addEventListener('sc-requester-abort', this.handleAbortBound)
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

    let { url } = this
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

  protected createRequestUrl (data?: Struct): string {
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

  protected handleLoadend (event: ProgressEvent, options: unknown): void {
    const xhr = event.target as XMLHttpRequest

    if (this.concurrency === 1) {
      this.setAttribute('sc-state', xhr.readyState.toString())
    }

    let data: Struct | string | null = null

    const contentType = xhr.getResponseHeader('content-type')

    if (contentType?.startsWith('application/json') === true) {
      data = JSON.parse(xhr.responseText) as Struct
    } else if (contentType?.startsWith('text/') === true) {
      data = xhr.responseText
    }

    if (xhr.status < 400) {
      this.propagator.dispatch('message', [data], event)

      if (isTransaction(options)) {
        options.result = data
        this.propagator.dispatch('tmessage', [options], event)
      }
    } else {
      this.propagator.dispatch('error', [{
        body: xhr.responseText,
        code: `err_requester_${xhr.status}`,
        message: xhr.statusText
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
  }

  protected handleProgress (event: ProgressEvent): void {
    if (this.concurrency === 1) {
      this.setAttribute('sc-loaded', event.loaded.toString())
      this.setAttribute('sc-total', event.total.toString())
    }
  }

  protected handleQueue (options: unknown, callback: (error: Error | null) => void): void {
    const request = this.createRequest(options)
    const xhr = new window.XMLHttpRequest()

    if (request.method === 'POST') {
      xhr.upload.onprogress = this.handleProgressBound
    }

    xhr.onerror = (event) => {
      this.xhr.delete(event.target as XMLHttpRequest)
      this.setAttribute('sc-opened', this.opened.toString())
      this.handleError(event)
      callback(null)
    }

    xhr.onloadend = (event) => {
      this.xhr.delete(event.target as XMLHttpRequest)
      this.setAttribute('sc-opened', this.opened.toString())
      this.handleLoadend(event, options)
      callback(null)
    }

    xhr.onprogress = this.handleProgressBound

    try {
      xhr.open(request.method, request.url)
      this.xhr.add(xhr)
      this.setAttribute('sc-opened', this.opened.toString())

      if (
        request.body !== null &&
        this.enctype !== ''
      ) {
        if (this.enctype !== 'multipart/form-data') {
          xhr.setRequestHeader('Content-Type', this.enctype)
        }

        xhr.send(request.body)
      } else {
        xhr.send()
      }

      if (this.concurrency === 1) {
        this.setAttribute('sc-state', xhr.readyState.toString())
      }
    } catch (error: unknown) {
      this.handleError(error)
    }
  }

  protected handleSend (event: CustomEvent): void {
    this.send(event.detail)
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-requester-abort', this.handleAbortBound)
    this.removeEventListener('sc-requester-send', this.handleSendBound)
  }
}
