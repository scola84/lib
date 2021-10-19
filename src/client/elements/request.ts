import { Struct, isPrimitive, isStruct } from '../../common'
import { customElement, property } from 'lit/decorators.js'
import type { AuthEvent } from './auth'
import { NodeElement } from './node'
import type { PropertyValues } from 'lit'
import styles from '../styles/request'
import updaters from '../updaters/request'

declare global {
  interface HTMLElementEventMap {
    'scola-request-start': CustomEvent
    'scola-request-stop': CustomEvent
    'scola-request-toggle': CustomEvent
  }

  interface HTMLElementTagNameMap {
    'scola-request': RequestElement
  }

  interface WindowEventMap {
    'scola-request-start': CustomEvent
    'scola-request-stop': CustomEvent
    'scola-request-toggle': CustomEvent
  }
}

@customElement('scola-request')
export class RequestElement extends NodeElement {
  public static origin = window.location.origin

  public static styles = [
    ...NodeElement.styles,
    styles
  ]

  public static updaters = {
    ...NodeElement.updaters,
    ...updaters
  }

  @property()
  public code?: string

  @property({
    type: Number
  })
  public loaded: number

  @property()
  public method = 'GET'

  @property()
  public origin = RequestElement.origin

  @property()
  public path?: string

  @property({
    reflect: true,
    type: Boolean
  })
  public started = false

  @property({
    type: Number
  })
  public total: number

  @property({
    type: Boolean
  })
  public wait?: boolean

  public request?: Request | null

  public response?: Response | null

  protected controller = new AbortController()

  protected handleStartBound = this.handleStart.bind(this)

  protected handleStopBound = this.handleStop.bind(this)

  protected handleToggleBound = this.handleToggle.bind(this)

  protected updaters = RequestElement.updaters

  public firstUpdated (properties: PropertyValues): void {
    super.firstUpdated(properties)

    if (this.wait !== true) {
      this.start()
    }
  }

  public start (options?: Struct): void {
    if (!this.started) {
      this.fetch(this.createRequest(options))
      this.started = true
    }
  }

  public stop (): void {
    if (this.started) {
      this.controller.abort()
      this.controller = new AbortController()
      this.loaded = this.total
      this.started = false
    }
  }

  public toggle (options?: Struct): void {
    if (this.started) {
      this.stop()
    } else {
      this.start(options)
    }
  }

  public update (properties: PropertyValues): void {
    if (properties.has('data')) {
      this.handleData()
    }

    super.update(properties)
  }

  protected createDispatchItems (): unknown[] {
    const item: Struct = {
      code: this.code,
      data: this.data
    }

    if (this.code?.startsWith('ok_') === false) {
      item.level = 'err'
    }

    return [item]
  }

  protected createRequest (options?: Struct): Request {
    return new Request(this.createURL(options).toString(), {
      method: this.method,
      signal: this.controller.signal,
      ...options
    })
  }

  protected createURL (options?: Struct): URL {
    const urlParts = [
      this.origin
    ]

    if (typeof options?.path === 'string') {
      urlParts.push(options.path)
    } else {
      urlParts.push(this.path ?? '')
    }

    const parameters = {
      ...this.dataset,
      ...this.closest('scola-view')?.view?.parameters,
      ...options
    }

    const url = new URL(Struct.replace(urlParts.join(''), parameters))

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

  protected handleData (): void {
    const status = this.response?.status ?? 200

    if ((
      this.request?.method === 'GET' &&
      status === 200
    ) || (
      this.request?.method !== 'GET' &&
      status >= 400
    )) {
      this.setDataOn(this.scopedDataNodeElements)
    }
  }

  protected handleError (error: unknown): void {
    this.loaded = this.total
    this.started = false

    if (
      error instanceof Error &&
      error.name !== 'AbortError'
    ) {
      this.dispatchError(error, this.code ?? 'err_request')
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

    this.loaded = this.total
    this.started = false
    this.dispatchEvents(this.dispatch, this.createDispatchItems())
  }

  protected handleStart (event: CustomEvent<Struct | null>): void {
    if (this.isTarget(event)) {
      if (isStruct(event.detail?.data)) {
        this.start(event.detail?.data)
      } else {
        this.start()
      }
    }
  }

  protected handleStop (event: CustomEvent): void {
    if (this.isTarget(event)) {
      this.stop()
    }
  }

  protected handleToggle (event: CustomEvent<Struct | null>): void {
    if (this.isTarget(event)) {
      if (isStruct(event.detail?.data)) {
        this.toggle(event.detail?.data)
      } else {
        this.toggle()
      }
    }
  }

  protected setUpElementListeners (): void {
    this.addEventListener('scola-request-start', this.handleStartBound)
    this.addEventListener('scola-request-stop', this.handleStopBound)
    this.addEventListener('scola-request-toggle', this.handleToggleBound)
    super.setUpElementListeners()
  }

  protected setUpWindowListeners (): void {
    window.addEventListener('scola-request-start', this.handleStartBound)
    window.addEventListener('scola-request-stop', this.handleStopBound)
    window.addEventListener('scola-request-toggle', this.handleToggleBound)
    super.setUpWindowListeners()
  }

  protected tearDownWindowListeners (): void {
    window.removeEventListener('scola-request-start', this.handleStartBound)
    window.removeEventListener('scola-request-stop', this.handleStopBound)
    window.removeEventListener('scola-request-toggle', this.handleToggleBound)
    super.tearDownWindowListeners()
  }
}
