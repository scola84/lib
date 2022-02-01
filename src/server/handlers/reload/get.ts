import 'fastify-sse-v2'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { readFileSync, watch } from 'fs-extra'
import type { FSWatcher } from 'fs-extra'
import { FastifyHandler } from '../../helpers'
import type { FastifyHandlerOptions } from '../../helpers'
import { PassThrough } from 'stream'
import { debounce } from 'throttle-debounce'

export interface ReloadGetHandlerOptions extends Partial<FastifyHandlerOptions> {
  debounce?: number
  event?: string
  file?: string
}

export class ReloadGetHandler extends FastifyHandler {
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

    this.watcher.on('change', debounce(this.debounce, false, () => {
      if (readFileSync(this.file).length > 0) {
        this.streams.forEach((stream) => {
          stream.write({
            data: JSON.stringify({
              reload: true
            }),
            event: this.event
          })
        })
      }
    }))
  }
}
