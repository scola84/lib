import type { RouteData, RouteHandlerOptions } from '../../../helpers'
import { readFileSync, watch } from 'fs-extra'
import type { FSWatcher } from 'fs-extra'
import { RouteHandler } from '../../../helpers'
import type { ServerResponse } from 'http'
import { debounce } from 'throttle-debounce'

export interface ReloadGetHandlerOptions extends Partial<RouteHandlerOptions> {
  debounce?: number
  event?: string
  file?: string
}

export class ReloadGetHandler extends RouteHandler {
  public debounce: number

  public event: string

  public file: string

  public responses = new Set<ServerResponse>()

  public watcher?: FSWatcher

  protected handleChangeBound = debounce(1000, this.handleChange.bind(this))

  public constructor (options: ReloadGetHandlerOptions) {
    super(options)
    this.debounce = options.debounce ?? 1000
    this.event = options.event ?? 'reload'
    this.file = options.file ?? '/usr/src/app/dist/client/index.js'
  }

  public handle (data: RouteData, response: ServerResponse): void {
    this.responses.add(response)

    response.once('close', () => {
      this.responses.delete(response)
    })

    response.setHeader('content-type', 'text/event-stream')
    response.write('\n')
  }

  public start (): void {
    this.handleChangeBound = debounce(this.debounce, this.handleChange.bind(this))
    this.startWatcher()
    super.start()
  }

  public async stop (): Promise<void> {
    await super.stop()
    this.handleChangeBound.cancel()

    await Promise.all(Array
      .from(this.responses)
      .map(async (response) => {
        return new Promise((resolve) => {
          response.end(resolve)
        })
      }))
  }

  protected handleChange (): void {
    if (readFileSync(this.file).length > 0) {
      this.notifyClients()
    }
  }

  protected notifyClient (response: ServerResponse): void {
    response.write(this.codec.encode({
      data: JSON.stringify({
        reload: true
      }),
      event: this.event
    }, response))
  }

  protected notifyClients (): void {
    this.responses.forEach((response) => {
      this.notifyClient(response)
    })
  }

  protected startWatcher (): void {
    this.watcher = watch(this.file)
    this.watcher.on('change', this.handleChangeBound)
  }
}
