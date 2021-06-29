import type { LogEvent, NodeEvent, NodeResult } from './node'
import { customElement, property } from 'lit/decorators.js'
import type { AuthEvent } from './auth'
import { NodeElement } from './node'
import type { PropertyValues } from 'lit'

declare global {
  interface HTMLElementEventMap {
    'scola-request-abort': NodeEvent
    'scola-request-start': NodeEvent
    'scola-request-toggle': NodeEvent
  }

  interface HTMLElementTagNameMap {
    'scola-request': RequestElement
  }

  interface WindowEventMap {
    'scola-request-abort': NodeEvent
    'scola-request-start': NodeEvent
    'scola-request-toggle': NodeEvent
  }
}

export interface RequestFinishEvent {
  detail: {
    code?: string
    data?: unknown
    origin: HTMLElement
  } | null
}

export interface RequestReadEvent {
  detail: {
    buffer: Uint8Array | undefined
    origin: HTMLElement
  } | null
}

@customElement('scola-request')
export class RequestElement extends NodeElement {
  public static base = ''

  public static origin = window.location.origin

  @property()
  public base = RequestElement.base

  @property()
  public cache?: Request['cache']

  @property()
  public credentials?: Request['credentials']

  @property()
  public integrity?: Request['integrity']

  @property({
    type: Boolean
  })
  public keepalive?: Request['keepalive']

  @property({
    type: Number
  })
  public loaded = 0

  @property()
  public method?: Request['method']

  @property()
  public mode?: Request['mode']

  @property()
  public origin = RequestElement.origin

  @property()
  public redirect?: Request['redirect']

  @property()
  public referrer?: Request['referrer']

  @property({
    attribute: 'referrer-policy'
  })
  public referrerPolicy?: Request['referrerPolicy']

  @property({
    type: Boolean
  })
  public started?: boolean

  @property({
    type: Number
  })
  public total = 0

  @property()
  public url?: string

  @property({
    type: Boolean
  })
  public wait?: boolean

  public code?: string

  public data?: unknown

  public indeterminate?: boolean

  public request?: Request

  public response?: Response

  protected controller = new AbortController()

  protected readonly handleAbortBound: (event: NodeEvent) => void

  protected readonly handleStartBound: (event: NodeEvent) => void

  protected readonly handleToggleBound: (event: NodeEvent) => void

  public constructor () {
    super()
    this.handleAbortBound = this.handleAbort.bind(this)
    this.handleStartBound = this.handleStart.bind(this)
    this.handleToggleBound = this.handleToggle.bind(this)
    this.addEventListener('scola-request-abort', this.handleAbortBound)
    this.addEventListener('scola-request-start', this.handleStartBound)
    this.addEventListener('scola-request-toggle', this.handleToggleBound)
  }

  public abort (): void {
    this.controller.abort()
    this.controller = new AbortController()
    this.started = false
  }

  public connectedCallback (): void {
    window.addEventListener('scola-request-abort', this.handleAbortBound)
    window.addEventListener('scola-request-start', this.handleStartBound)
    window.addEventListener('scola-request-toggle', this.handleToggleBound)
    super.connectedCallback()
  }

  public disconnectedCallback (): void {
    window.removeEventListener('scola-request-abort', this.handleAbortBound)
    window.removeEventListener('scola-request-start', this.handleStartBound)
    window.removeEventListener('scola-request-toggle', this.handleToggleBound)
    super.disconnectedCallback()
  }

  public firstUpdated (properties: PropertyValues): void {
    if (this.wait !== true) {
      this.start()
    }

    super.firstUpdated(properties)
  }

  public start (request?: Request): void {
    if (this.started === true) {
      return
    }

    this.indeterminate = true
    this.loaded = 0
    this.started = true
    this.total = 0
    this.fetch(request)
  }

  public toggle (): void {
    if (this.started === true) {
      this.abort()
    } else {
      this.start()
    }
  }

  protected createRequest (): Request {
    return new Request(this.createURL(), {
      cache: this.cache,
      credentials: this.credentials,
      integrity: this.integrity,
      keepalive: this.keepalive,
      mode: this.mode,
      redirect: this.redirect,
      referrer: this.referrer,
      referrerPolicy: this.referrerPolicy,
      signal: this.controller.signal
    })
  }

  protected createURL (): string {
    return String(new URL(`${this.origin}${this.base}${this.url ?? ''}`))
  }

  protected dispatchAuth (request: Request): void {
    this.dispatchEvent(new CustomEvent<AuthEvent['detail']>('scola-auth', {
      detail: (authError?: unknown): void => {
        if (authError instanceof Error) {
          this.finishError(authError)
          return
        }

        this.fetch(request)
      }
    }))
  }

  protected dispatchLog (): void {
    this.dispatchEvent(new CustomEvent<LogEvent['detail']>('scola-log', {
      bubbles: true,
      composed: true,
      detail: {
        code: this.code,
        data: this.data,
        level: 'err',
        origin: this
      }
    }))
  }

  protected fetch (request = this.createRequest()): void {
    window
      .fetch(request)
      .then(async (response) => {
        if (response.status === 401) {
          this.dispatchAuth(request)
          return
        }

        this.request = request
        this.response = response
        await this.finish()
      })
      .catch((error: unknown) => {
        this.finishError(error)
      })
  }

  protected async finish (): Promise<void> {
    const status = this.response?.status ?? 200
    const contentLength = this.response?.headers.get('Content-Length')

    this.code = status < 400 ? `OK_${status}` : `ERR_${status}`

    if (contentLength !== null && contentLength !== undefined) {
      this.indeterminate = false
      this.total = parseFloat(contentLength)
    }

    const type = this.response?.headers.get('Content-Type')

    if (type?.startsWith('application/json') === true) {
      await this.finishJSON()
    } else if (type?.startsWith('text/') === true) {
      await this.finishText()
    }

    this.started = false

    if (!this.code.startsWith('OK_')) {
      this.dispatchLog()
    }
  }

  protected finishError (error: unknown): void {
    this.code = 'ERR_REQUEST_FETCH'
    this.started = false

    if (error instanceof Error && error.name !== 'AbortError') {
      this.dispatchLog()
    }
  }

  protected async finishJSON (): Promise<void> {
    const {
      code,
      data
    } = await this.response?.json() as NodeResult

    this.code = code
    this.data = data
    this.loaded = this.total
  }

  protected async finishText (): Promise<void> {
    this.data = { text: await this.response?.text() }
    this.loaded = this.total
  }

  protected handleAbort (event: NodeEvent): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true
      this.abort()
    }
  }

  protected handleStart (event: NodeEvent): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true
      this.start()
    }
  }

  protected handleToggle (event: NodeEvent): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true
      this.toggle()
    }
  }
}
