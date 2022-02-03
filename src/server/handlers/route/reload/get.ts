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

  public responseType = 'text/event-stream'

  public responses = new Set<ServerResponse>()

  public watcher?: FSWatcher

  public constructor (options: ReloadGetHandlerOptions) {
    super(options)
    this.debounce = options.debounce ?? 1000
    this.event = options.event ?? 'reload'
    this.file = options.file ?? '/usr/src/app/dist/client/index.js'
  }

  public start (): void {
    this.startWatcher()
    super.start()
  }

  protected handle (data: RouteData, response: ServerResponse): void {
    this.responses.add(response)

    response.once('close', () => {
      this.responses.delete(response)
    })

    response.setHeader('content-type', this.responseType)
    response.write('\n')
  }

  protected startWatcher (): void {
    this.watcher = watch(this.file)

    this.watcher.on('change', debounce(this.debounce, false, () => {
      if (readFileSync(this.file).length > 0) {
        this.responses.forEach((response) => {
          response.write(this.stringify({
            data: JSON.stringify({
              reload: true
            }),
            event: this.event
          }))
        })
      }
    }))
  }
}
