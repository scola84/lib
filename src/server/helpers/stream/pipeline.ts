import { Transform, Writable } from 'stream'
import type { Readable } from 'stream'

export async function pipeline (...streams: Array<Readable | Transform | Writable>): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    streams
      .reduce((previous: Readable | Transform | Writable | null, current, index) => {
        if (previous instanceof Writable && !(previous instanceof Transform)) {
          for (const stream of streams) {
            stream.removeAllListeners()
          }

          throw new Error(`Stream error (${index}): Cannot pipe a Writable`)
        }

        current
          .on('data', () => {})
          .on('error', (error: Error) => {
            for (const stream of streams) {
              stream.destroy()
              stream.removeAllListeners()
            }

            reject(new Error(`Stream error (${index}): ${String(error)}`))
          })

        if (current instanceof Transform || current instanceof Writable) {
          previous?.pipe(current)
        }

        return current
      }, null)
      ?.once('finish', () => {
        for (const stream of streams) {
          stream.removeAllListeners()
        }

        resolve()
      })
  })
}
