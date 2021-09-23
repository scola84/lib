import 'fastify-sse-v2'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { FSWatcher } from 'fs-extra'
import { PassThrough } from 'stream'
import { RouteHandler } from '../../helpers'
import type { RouteHandlerOptions } from '../../helpers'
import { debounce } from 'throttle-debounce'
import { watch } from 'fs-extra'

export interface ReloadGetHandlerOptions extends Partial<RouteHandlerOptions> {
  debounce?: number
  event?: string
  file?: string
}

export class ReloadGetHandler extends RouteHandler {
  public debounce: number

  public event: string

  public file: string

  protected streams = new Set<PassThrough>()

  protected watcher?: FSWatcher

  public constructor (options: ReloadGetHandlerOptions) {
    super(options)
    this.debounce = options.debounce ?? 1000
    this.event = options.event ?? 'reload'
    this.file = options.file ?? '/usr/src/app/dist/client/index.js'
  }

  public async handle (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const stream = new PassThrough({
      objectMode: true
    })

    this.streams.add(stream)
    reply.sse(stream)

    reply.raw.once('close', () => {
      this.streams.delete(stream)
    })

    return Promise.resolve()
  }

  public start (): void {
    this.setUpWatcher()
    super.start()
  }

  protected setUpWatcher (): void {
    this.watcher = watch(this.file)

    this.watcher.on('change', debounce(this.debounce, true, () => {
      this.streams.forEach((stream) => {
        stream.write({
          data: JSON.stringify({
            reload: true
          }),
          event: this.event
        })
      })
    }))
  }
}
