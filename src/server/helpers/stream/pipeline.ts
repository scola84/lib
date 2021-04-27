import { Transform, Writable } from 'stream'
import type { Readable } from 'stream'

export async function pipeline (...streams: Array<Readable | Transform | Writable>): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    if (streams.length < 2) {
      throw new Error('Less than 2 streams provided')
    }

    streams.reduce((previous: Readable | Transform | Writable | null, current, index) => {
      if (previous instanceof Writable && !(previous instanceof Transform)) {
        for (const stream of streams) {
          stream.removeAllListeners()
        }

        throw new Error('Cannot pipe a Writable')
      }

      current
        .on('data', () => {})
        .on('error', (error: Error) => {
          for (const stream of streams) {
            stream.destroy()
            stream.removeAllListeners()
          }

          reject(new Error(`Stream #${index} failed: ${error.message}`))
        })

      if (index === streams.length - 1) {
        current.once('finish', () => {
          for (const stream of streams) {
            stream.removeAllListeners()
          }

          resolve()
        })
      }

      if (current instanceof Transform || current instanceof Writable) {
        previous?.pipe(current)
      }

      return current
    }, null)
  })
}
