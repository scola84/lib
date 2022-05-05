import { I18n, Struct, flatten, isArray, isFlow, isNil, isPrimitive, isResult, isStruct, isTransaction, revive, toJoint, toString } from '../../common'
import { Mutator, Observer, Propagator } from '../helpers'
import type { Result, ScolaError, Transaction } from '../../common'
import type { ScolaElement } from './element'
import type { ScolaViewElement } from './view'
import type { queue as fastq } from 'fastq'
import queue from 'fastq'
import { saveAs } from 'file-saver'

declare global {
  interface HTMLElementEventMap {
    'sc-requester-abort': CustomEvent
    'sc-requester-reset': CustomEvent
    'sc-requester-send': CustomEvent
  }
}

declare module 'fastq' {
  interface queue {
    running: () => number
  }
}

interface Request {
  body: FormData | URLSearchParams | string | null
  method: string
  url: string
}

export class ScolaRequesterElement extends HTMLObjectElement implements ScolaElement {
  public static origin = window.location.origin

  public static timeout = 60000

  public concurrency: number

  public download: boolean

  public error?: ScolaError

  public errorData?: unknown

  public i18n: I18n

  public loaded = 0

  public max: number

  public method: string

  public mutator: Mutator

  public observer: Observer

  public origin = ScolaRequesterElement.origin

  public propagator: Propagator

  public queue: fastq

  public requestType: string

  public responseType: string

  public result?: Result

  public state = 0

  public strict: boolean

  public timeout: number

  public total = 0

  public url: string

  public view?: ScolaViewElement

  public wait: boolean

  public xhr: Set<XMLHttpRequest> = new Set()

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  public get data (): string {
    return ''
  }

  public set data (value: unknown) {}

  public get opened (): number {
    return this.xhr.size
  }

  public get queued (): number {
    return this.queue.length() + this.queue.running()
  }

  public get running (): number {
    return this.queue.running()
  }

  protected handleAbortBound = this.handleAbort.bind(this)

  protected handleErrorBound = this.handleError.bind(this)

  protected handleLoadendBound = this.handleLoadend.bind(this)

  protected handleProgressBound = this.handleProgress.bind(this)

  protected handleQueueBound = this.handleQueue.bind(this)

  protected handleResetBound = this.handleReset.bind(this)

  protected handleSendBound = this.handleSend.bind(this)

  public constructor () {
    super()
    this.i18n = new I18n()
    this.mutator = new Mutator(this)
    this.observer = new Observer(this)
    this.propagator = new Propagator(this)
    this.view = this.closest<ScolaViewElement>('[is="sc-view"]') ?? undefined
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

  public clear (): void {
    this.error = undefined
    this.errorData = undefined
    this.loaded = 0
    this.state = 0
    this.total = 0
    this.removeAttribute('aria-invalid')
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

  public notify (): void {
    this.toggleAttribute('sc-updated', true)
    this.toggleAttribute('sc-updated', false)
    this.propagator.dispatchEvents('update')
  }

  public reset (): void {
    this.concurrency = Number(this.getAttribute('sc-concurrency') ?? 1)
    this.download = this.hasAttribute('sc-download')
    this.max = Number(this.getAttribute('sc-max') ?? 1)
    this.method = this.getAttribute('sc-method') ?? 'GET'
    this.queue = queue(this.handleQueueBound, this.concurrency)
    this.requestType = (this.getAttribute('sc-request-type')) ?? 'application/x-www-form-urlencoded'
    this.responseType = this.getAttribute('sc-response-type') ?? 'text'
    this.strict = this.hasAttribute('sc-strict')
    this.timeout = Number(this.getAttribute('sc-timeout') ?? ScolaRequesterElement.timeout)
    this.url = this.getAttribute('sc-url') ?? ''
    this.wait = this.hasAttribute('sc-wait')
  }

  public send (options?: unknown): void {
    if (
      this.max > -1 &&
      this.opened === this.max
    ) {
      this.propagator.dispatchEvents('max', [options])
      return
    }

    if (!window.navigator.onLine) {
      this.propagator.dispatchEvents('offline', [options])
      return
    }

    this.queue.push(options, () => {
      window.requestAnimationFrame(() => {
        this.notify()
      })
    })

    this.notify()
  }

  public toJSON (): unknown {
    return {
      concurrency: this.concurrency,
      download: this.download,
      id: this.id,
      is: this.getAttribute('is'),
      loaded: this.loaded,
      max: this.max,
      method: this.method,
      nodeName: this.nodeName,
      opened: this.opened,
      queue: this.queue,
      queued: this.queued,
      requestType: this.requestType,
      running: this.running,
      state: this.state,
      strict: this.strict,
      timeout: this.timeout,
      total: this.total,
      url: this.url,
      wait: this.wait
    }
  }

  protected addEventListeners (): void {
    this.addEventListener('sc-requester-abort', this.handleAbortBound)
    this.addEventListener('sc-requester-reset', this.handleResetBound)
    this.addEventListener('sc-requester-send', this.handleSendBound)
  }

  protected createRequest (options?: unknown): Request {
    let data = null
    let { method } = this

    if (isTransaction(options)) {
      data = options.commit
    } else if (isArray(options)) {
      data = options
    } else if (isStruct(options)) {
      if (typeof options.method === 'string') {
        ({ method } = options)
      }

      data = {
        ...this.view?.view?.params,
        ...options
      }
    } else {
      data = this.view?.view?.params
    }

    const url = `${this.origin}${this.i18n.formatText(this.url, data)}`

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
    this.error = {
      code: 'err_requester',
      message: toString(error)
    }

    this.propagator.dispatchEvents<ScolaError>('error', [this.error])
    this.setAttribute('aria-invalid', 'true')
  }

  protected handleLoadend (event: ProgressEvent, options: unknown): void {
    const xhr = event.target as XMLHttpRequest

    if (this.concurrency === 1) {
      this.state = xhr.readyState
      this.notify()
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

    this.error = {
      code: `err_requester_${xhr.status}`,
      message: xhr.statusText
    }

    this.propagator.dispatchEvents<ScolaError>('error', [this.error], event)

    if (isStruct(data)) {
      this.errorData = data.body ?? data.query ?? data.headers ?? data
      this.propagator.dispatchEvents('errordata', [this.errorData], event)
    }

    if (isTransaction(options)) {
      if (isStruct(data)) {
        options.result = data.body ?? data.query ?? data.headers ?? data
      }

      this.propagator.dispatchEvents<Transaction>('terror', [options], event)
    }

    this.setAttribute('aria-invalid', 'true')
  }

  protected handleLoadendOk (event: ProgressEvent, options: unknown, data: unknown): void {
    const xhr = event.target as XMLHttpRequest

    if (this.download) {
      if (data instanceof Blob) {
        const { name = 'download' } = xhr
          .getResponseHeader('content-disposition')
          ?.match(/filename="(?<name>.+)"/iu)?.groups ?? {}

        saveAs(data, name)
      }
    } else if (isTransaction(options)) {
      options.result = data
      this.propagator.dispatchEvents<Transaction>('tresult', [options], event)
    } else if (isFlow(data)) {
      this.propagator.dispatchEvents(toJoint(data.next, {
        chars: /[^a-z0-9]+/gui
      }), [data.data])
    } else if (isResult(data)) {
      this.result = data
      this.propagator.dispatchEvents('result', [data], event)
    } else {
      this.propagator.dispatchEvents('data', [data], event)
    }

    this.setAttribute('aria-invalid', 'false')
  }

  protected handleProgress (event: ProgressEvent): void {
    if (this.concurrency === 1) {
      this.loaded = event.loaded
      this.total = event.total
      this.notify()
    }
  }

  protected handleQueue (options: unknown, callback: (error: Error | null) => void): void {
    const request = this.createRequest(options)

    if (!this.isValid(request.url)) {
      this.propagator.dispatchEvents('invalidurl', [options])
      callback(null)
      return
    }

    const xhr = new window.XMLHttpRequest()

    if (request.method === 'POST') {
      xhr.upload.onprogress = this.handleProgressBound
    }

    xhr.onerror = (event) => {
      this.xhr.delete(event.target as XMLHttpRequest)
      this.notify()
      this.handleError(event)
      callback(null)
    }

    xhr.onloadend = (event) => {
      this.xhr.delete(event.target as XMLHttpRequest)
      this.notify()
      this.handleLoadend(event, options)
      callback(null)
    }

    xhr.ontimeout = (event) => {
      this.xhr.delete(event.target as XMLHttpRequest)
      this.notify()
      this.handleTimeout(event, options)
      callback(null)
    }

    xhr.responseType = this.responseType as XMLHttpRequestResponseType
    xhr.timeout = this.timeout
    xhr.onprogress = this.handleProgressBound

    try {
      xhr.open(request.method, request.url)
      this.xhr.add(xhr)
      this.notify()

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
        this.clear()
        this.state = xhr.readyState
        this.notify()
      }
    } catch (error: unknown) {
      this.handleError(error)
    }
  }

  protected handleReset (): void {
    this.clear()
    this.reset()
    this.notify()
  }

  protected handleSend (event: CustomEvent): void {
    this.send(event.detail)
  }

  protected handleTimeout (event: ProgressEvent, options: unknown): void {
    this.propagator.dispatchEvents('timeout', [options], event)
  }

  protected isValid (url: string): boolean {
    if (this.strict) {
      const expected = Struct.fromQuery(this.url.split('?').pop() ?? '')
      const actual = Struct.fromQuery(url.split('?').pop() ?? '')
      return Object
        .keys(expected)
        .every((key) => {
          return actual[key] !== undefined
        })
    }

    return true
  }

  protected removeEventListeners (): void {
    this.removeEventListener('sc-requester-abort', this.handleAbortBound)
    this.removeEventListener('sc-requester-reset', this.handleResetBound)
    this.removeEventListener('sc-requester-send', this.handleSendBound)
  }
}
