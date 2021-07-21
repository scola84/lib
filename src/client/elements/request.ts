import type { LogEvent, NodeEvent } from './node'
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
    'scola-request-abort': RequestEvent
    'scola-request-start': RequestEvent
    'scola-request-toggle': RequestEvent
  }
}

export interface RequestEvent extends NodeEvent {
  detail: Record<string, unknown> & RequestInit & {
    origin?: HTMLElement
    url?: string
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

  @property({
    attribute: false
  })
  public data?: unknown

  @property()
  public integrity?: Request['integrity']

  @property({
    type: Boolean
  })
  public keepalive?: Request['keepalive']

  @property({
    type: Number
  })
  public loaded: number

  @property()
  public method: Request['method'] = 'GET'

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
    type: Number
  })
  public total: number

  @property()
  public url?: Request['url']

  @property({
    type: Boolean
  })
  public wait?: boolean

  public code?: string

  public request?: Request

  public response?: Response

  public started?: boolean

  protected controller = new AbortController()

  protected readonly handleAbortBound: (event: RequestEvent) => void

  protected readonly handleStartBound: (event: RequestEvent) => void

  protected readonly handleToggleBound: (event: RequestEvent) => void

  protected updaters = RequestElement.updaters

  public constructor () {
    super()
    this.handleAbortBound = this.handleAbort.bind(this)
    this.handleStartBound = this.handleStart.bind(this)
    this.handleToggleBound = this.handleToggle.bind(this)
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
    this.addEventListener('scola-request-abort', this.handleAbortBound)
    this.addEventListener('scola-request-start', this.handleStartBound)
    this.addEventListener('scola-request-toggle', this.handleToggleBound)
    super.firstUpdated(properties)

    if (this.wait !== true) {
      this.start()
    }
  }

  public start (detail?: RequestEvent['detail']): void {
    if (this.started === true) {
      return
    }

    this.loaded = 0
    this.started = true
    this.total = 0
    this.fetch(this.createRequest(detail))
  }

  public toggle (detail?: RequestEvent['detail']): void {
    if (this.started === true) {
      this.abort()
    } else {
      this.start(detail)
    }
  }

  protected createBody (): BodyInit | undefined {
    return undefined
  }

  protected createHeaders (): HeadersInit | undefined {
    return undefined
  }

  protected createRequest (detail?: RequestEvent['detail']): Request {
    const method = detail?.method ?? this.method
    const headers = this.createHeaders()

    let body = null

    if ((/PATCH|POST|PUT/u).exec(method) !== null) {
      body = this.createBody()
    }

    return new Request(this.createURL(detail).toString(), {
      body,
      cache: this.cache,
      credentials: this.credentials,
      headers,
      integrity: this.integrity,
      keepalive: this.keepalive,
      method: this.method,
      mode: this.mode,
      redirect: this.redirect,
      referrer: this.referrer,
      referrerPolicy: this.referrerPolicy,
      signal: this.controller.signal,
      ...detail
    })
  }

  protected createURL (detail?: RequestEvent['detail']): URL {
    const url = `${this.origin}${this.base}${detail?.url ?? this.url ?? ''}`

    const params = Object.keys(detail ?? {}).reduce((result, key) => {
      result.append(key, String(detail?.[key]))
      return result
    }, new URLSearchParams(this.closest('scola-view')?.view?.params))

    return new URL(this.replaceParams(url, params))
  }

  protected dispatchAuth (request: Request): void {
    this.dispatchEvent(new CustomEvent<AuthEvent['detail']>('scola-auth', {
      detail: (authError?: unknown): void => {
        if (authError instanceof Error) {
          this.code = 'err_403'
          this.handleError(authError)
          return
        }

        this.fetch(request)
      }
    }))
  }

  protected dispatchLog (): void {
    let {
      code,
      data
    } = this

    if (code?.startsWith('ok_') === true) {
      code = undefined
      data = undefined
    }

    this.dispatchEvent(new CustomEvent<LogEvent['detail']>('scola-log', {
      bubbles: true,
      composed: true,
      detail: {
        code,
        data,
        level: 'err',
        origin: this
      }
    }))
  }

  protected fetch (request: Request): void {
    window
      .fetch(request)
      .then(async (response) => {
        if (response.status === 401) {
          this.dispatchAuth(request)
          return
        }

        this.request = request
        this.response = response
        await this.handleFetch()
      })
      .catch((error: unknown) => {
        this.code = 'err_fetch'
        this.handleError(error)
      })
  }

  protected handleAbort (event: RequestEvent): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true
      this.abort()
    }
  }

  protected handleError (error: unknown): void {
    this.loaded = this.total
    this.started = false

    if (
      error instanceof Error &&
      error.name !== 'AbortError'
    ) {
      this.dispatchLog()
    }
  }

  protected async handleFetch (): Promise<void> {
    const status = this.response?.status ?? 200

    if (status < 400) {
      this.code = `ok_${status}`
    } else {
      this.code = `err_${status}`
    }

    if (this.response?.headers.has('Content-Length') === true) {
      this.total = parseFloat(this.response.headers.get('Content-Length') ?? '')
    }

    if (this.response?.headers.get('Content-Type')?.startsWith('application/json') === true) {
      this.data = await this.response.json()
    }

    this.loaded = this.total
    this.started = false
    this.dispatchLog()
  }

  protected handleStart (event: RequestEvent): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true
      this.start(event.detail ?? undefined)
    }
  }

  protected handleToggle (event: RequestEvent): void {
    if (this.isTarget(event)) {
      event.cancelBubble = true
      this.toggle(event.detail ?? undefined)
    }
  }
}
