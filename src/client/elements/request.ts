import type { CSSResultGroup, PropertyValues } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { isObject, isPrimitive } from '../../common'
import type { AuthEvent } from './auth'
import { NodeElement } from './node'
import { css } from 'lit'

declare global {
  interface HTMLElementEventMap {
    'scola-request-abort': CustomEvent
    'scola-request-start': CustomEvent
    'scola-request-toggle': CustomEvent
  }

  interface HTMLElementTagNameMap {
    'scola-request': RequestElement
  }

  interface WindowEventMap {
    'scola-request-abort': CustomEvent
    'scola-request-start': CustomEvent
    'scola-request-toggle': CustomEvent
  }
}

@customElement('scola-request')
export class RequestElement extends NodeElement {
  public static base = ''

  public static origin = window.location.origin

  public static styles: CSSResultGroup[] = [
    ...NodeElement.styles,
    css`
      :host {
        display: contents;
      }
    `
  ]

  @property()
  public base = RequestElement.base

  @property({
    type: Boolean
  })
  public busy?: boolean

  @property()
  public cache?: Request['cache']

  @property()
  public code?: string

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
    attribute: 'status-filter'
  })
  public statusFilter = '^(?!400)'

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

  public request?: Request | null

  public response?: Response | null

  protected controller = new AbortController()

  protected handleAbortBound: (event: CustomEvent) => void

  protected handleStartBound: (event: CustomEvent) => void

  protected handleToggleBound: (event: CustomEvent) => void

  protected updaters = RequestElement.updaters

  public constructor () {
    super()
    this.handleAbortBound = this.handleAbort.bind(this)
    this.handleStartBound = this.handleStart.bind(this)
    this.handleToggleBound = this.handleToggle.bind(this)
  }

  public abort (): void {
    this.busy = false
    this.loaded = this.total
    this.controller.abort()
    this.controller = new AbortController()
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

  public start (options?: Record<string, unknown>): void {
    if (this.busy === true) {
      return
    }

    this.busy = true
    this.fetch(this.createRequest(options))
  }

  public toggle (options?: Record<string, unknown>): void {
    if (this.busy === true) {
      this.abort()
    } else {
      this.start(options)
    }
  }

  public update (properties: PropertyValues): void {
    if (properties.has('data')) {
      this.dataNodeElements.forEach((dataNodeElement) => {
        dataNodeElement.data = this.data
      })
    }

    super.update(properties)
  }

  protected createEventData (): Record<string, unknown> {
    let {
      code,
      data
    } = this

    if (code?.startsWith('ok_') === true) {
      code = undefined
      data = undefined
    }

    return {
      code,
      data,
      level: 'err'
    }
  }

  protected createRequest (options?: Record<string, unknown>): Request {
    return new Request(this.createURL(options).toString(), {
      cache: this.cache,
      credentials: this.credentials,
      integrity: this.integrity,
      keepalive: this.keepalive,
      method: this.method,
      mode: this.mode,
      redirect: this.redirect,
      referrer: this.referrer,
      referrerPolicy: this.referrerPolicy,
      signal: this.controller.signal,
      ...options
    })
  }

  protected createURL (options?: Record<string, unknown>): URL {
    const urlParts = [
      this.origin,
      this.base
    ]

    if (typeof options?.url === 'string') {
      urlParts.push(options.url)
    } else {
      urlParts.push(this.url ?? '')
    }

    const parameters = {
      ...this.dataset,
      ...this.closest('scola-view')?.view?.parameters,
      ...options
    }

    const url = new URL(this.replaceParameters(urlParts.join(''), parameters))

    Object
      .entries(this.parameters)
      .forEach(([name, value]) => {
        if (isPrimitive(value)) {
          url.searchParams.append(name, value.toString())
        }
      })

    return url
  }

  protected dispatchAuth (request: Request): void {
    this.dispatchEvent(new CustomEvent<AuthEvent['detail']>('scola-auth', {
      bubbles: true,
      composed: true,
      detail: {
        callback: (authError?: unknown): void => {
          if (authError instanceof Error) {
            this.code = 'err_403'
            this.handleError(authError)
          } else {
            this.fetch(request)
          }
        }
      }
    }))
  }

  protected fetch (request: Request): void {
    this.loaded = 0
    this.request = request
    this.total = 0

    window
      .fetch(request)
      .then(async (response) => {
        if (response.status === 401) {
          this.dispatchAuth(request)
        } else {
          this.response = response
          await this.handleFetch()
        }
      })
      .catch((error: unknown) => {
        this.code = 'err_fetch'
        this.handleError(error)
      })
  }

  protected handleAbort (event: CustomEvent): void {
    if (this.isTarget(event)) {
      this.abort()
    }
  }

  protected handleError (error: unknown): void {
    this.busy = false
    this.loaded = this.total

    if (
      error instanceof Error &&
      error.name !== 'AbortError' &&
      new RegExp(this.statusFilter, 'u').test((this.response?.status ?? 200).toString())
    ) {
      this.dispatchEvents(this.createEventData())
    }
  }

  protected async handleFetch (): Promise<void> {
    const status = this.response?.status ?? 200

    if (status < 400) {
      this.code = `ok_${status}`
    } else {
      this.code = `err_${status}`
    }

    const contentLength = this.response?.headers.get('Content-Length')
    const contentType = this.response?.headers.get('Content-Type')

    if (typeof contentLength === 'string') {
      this.total = parseFloat(contentLength)
    }

    if (contentType?.startsWith('application/json') === true) {
      this.data = await this.response?.json()
    } else if (contentType?.startsWith('text/') === true) {
      this.data = await this.response?.text()
    }

    this.busy = false
    this.loaded = this.total

    if (new RegExp(this.statusFilter, 'u').test(status.toString())) {
      this.dispatchEvents(this.createEventData())
    }
  }

  protected handleStart (event: CustomEvent<Record<string, unknown> | null>): void {
    if (this.isTarget(event)) {
      if (isObject(event.detail?.data)) {
        this.start(event.detail?.data)
      } else {
        this.start()
      }
    }
  }

  protected handleToggle (event: CustomEvent<Record<string, unknown> | null>): void {
    if (this.isTarget(event)) {
      if (isObject(event.detail?.data)) {
        this.toggle(event.detail?.data)
      } else {
        this.toggle()
      }
    }
  }
}
