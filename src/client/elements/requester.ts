import { I18n, flatten, isArray, isNil, isPrimitive, isStruct, isTransaction, revive, toString } from '../../common'
import { Mutator, Observer, Propagator } from '../helpers'
import type { ScolaError, ScolaTransaction, Struct } from '../../common'
import type { ScolaElement } from './element'
import type { ScolaViewElement } from './view'
import type { queue as fastq } from 'fastq'
import queue from 'fastq'
import { saveAs } from 'file-saver'

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

  public download: boolean

  public i18n: I18n

  public max: number

  public method: string

  public mutator: Mutator

  public observer: Observer

  public origin = ScolaRequesterElement.origin

  public propagator: Propagator

  public queue: fastq

  public requestType: string

  public responseType: string

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
    this.i18n = new I18n()
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
    this.download = this.hasAttribute('sc-download')
    this.max = Number(this.getAttribute('sc-max') ?? 1)
    this.method = this.getAttribute('sc-method') ?? 'GET'
    this.requestType = (this.getAttribute('sc-request-type')) ?? 'application/x-www-form-urlencoded'
    this.responseType = this.getAttribute('sc-response-type') ?? 'text'
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

    const url = `${this.origin}${this.i18n.format(this.url, data)}`

    let body: FormData | URLSearchParams | string | null = null

    if (method === 'POST') {
      body = this.encode(data)
    }

    return {
      body,
      method,
      url
    }
  }

  protected async decode (xhr: XMLHttpRequest): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const contentType = xhr.getResponseHeader('content-type')

      if (
        contentType?.startsWith('application/json') === true ||
        contentType?.startsWith('text/') === true
      ) {
        if (xhr.responseType === 'text') {
          if (contentType.startsWith('application/json')) {
            resolve(JSON.parse(xhr.responseText, revive) as Struct)
          } else {
            resolve(xhr.responseText)
          }
        } else if (xhr.response instanceof Blob) {
          const reader = new FileReader()

          reader.onloadend = () => {
            if (
              contentType.startsWith('application/json') &&
              typeof reader.result === 'string'
            ) {
              resolve(JSON.parse(reader.result, revive) as Struct)
            } else {
              resolve(reader.result)
            }
          }

          reader.onerror = reject
          reader.readAsText(xhr.response)
        }
      } else {
        resolve(xhr.response)
      }
    })
  }

  protected encode (data: unknown): FormData | URLSearchParams | string | null {
    switch (this.requestType) {
      case 'application/json':
        return this.encodeJson(data)
      case 'application/x-www-form-urlencoded':
        return this.encodeFormUrlencoded(data)
      case 'multipart/form-data':
        return this.encodeFormData(data)
      default:
        return null
    }
  }

  protected encodeFormData (data: unknown): FormData {
    const body = new FormData()

    if (isStruct(data)) {
      Object
        .entries(flatten(data))
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

  protected encodeFormUrlencoded (data: unknown): URLSearchParams {
    const body = new URLSearchParams()

    if (isStruct(data)) {
      Object
        .entries(flatten(data))
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

  protected encodeJson (data?: unknown): string | null {
    if (isNil(data)) {
      return null
    }

    return JSON.stringify(data)
  }

  protected handleAbort (): void {
    this.abort()
  }

  protected handleError (error: unknown): void {
    this.propagator.dispatch<ScolaError>('error', [{
      code: 'err_requester',
      message: toString(error)
    }])
  }

  protected handleLoadend (event: ProgressEvent, options: unknown): void {
    const xhr = event.target as XMLHttpRequest

    if (this.concurrency === 1) {
      this.setAttribute('sc-state', xhr.readyState.toString())
    }

    this
      .decode(xhr)
      .then((data) => {
        if (xhr.status < 400) {
          this.handleLoadendOk(event, options, data)
        } else {
          this.handleLoadendError(event, options, data)
        }
      })
      .catch((error) => {
        this.handleError(error)
      })
  }

  protected handleLoadendError (event: ProgressEvent, options: unknown, data: unknown): void {
    const xhr = event.target as XMLHttpRequest

    this.propagator.dispatch('error', [{
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

      this.propagator.dispatch<ScolaTransaction>('terror', [options], event)
    }
  }

  protected handleLoadendOk (event: ProgressEvent, options: unknown, data: unknown): void {
    const xhr = event.target as XMLHttpRequest

    if (this.download) {
      if (data instanceof Blob) {
        const { name = 'download' } = xhr
          .getResponseHeader('content-disposition')
          ?.match(/filename="(?<name>.+)"/ui)?.groups ?? {}

        saveAs(data, name)
      }

      return
    }

    this.propagator.dispatch('message', [data], event)

    if (isTransaction(options)) {
      options.result = data
      this.propagator.dispatch<ScolaTransaction>('tmessage', [options], event)
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

    xhr.responseType = this.responseType as XMLHttpRequestResponseType
    xhr.onprogress = this.handleProgressBound

    try {
      xhr.open(request.method, request.url)
      this.xhr.add(xhr)
      this.setAttribute('sc-opened', this.opened.toString())

      if (
        request.body !== null &&
        this.requestType !== ''
      ) {
        if (this.requestType !== 'multipart/form-data') {
          xhr.setRequestHeader('Content-Type', this.requestType)
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
