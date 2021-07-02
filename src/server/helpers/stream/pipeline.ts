import { Transform, Writable } from 'stream'
import type { Readable } from 'stream'

/**
 * Handles a data stream as a Promise.
 *
 * Destroys all streams, removes all listeners and rejects the Promise if an error occurs during setup.
 *
 * Destroys all streams, removes all listeners and rejects the Promise if one of the streams emits an error.
 *
 * Removes all listeners and resolves the Promise if the streams finish successfully.
 *
 * @param streams - The streams
 * @returns void
 * @throws less than 2 streams are provided
 * @throws the streams are provided in the wrong order
 * @throws one of the streams emits an error
 *
 * @example
 * ```ts
 * const reader = createReadStream('some/source')
 * const writer = createWriteStream('some/target')
 *
 * pipeline(reader, writer)
 *   .then(() => {
 *     console.log('done')
 *   })
 *   .catch((error) => {
 *      console.error(error)
 *   })
 * ```
 */
export async function pipeline (...streams: Array<Readable | Transform | Writable>): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    if (streams.length < 2) {
      for (const stream of streams) {
        stream.destroy()
        process.nextTick(stream.removeAllListeners.bind(stream))
      }

      throw new Error('Less than 2 streams provided')
    }

    streams.reduce((previous: Readable | Transform | Writable | null, current, index) => {
      if (previous instanceof Writable && !(previous instanceof Transform)) {
        for (const stream of streams) {
          stream.destroy()
          process.nextTick(stream.removeAllListeners.bind(stream))
        }

        throw new Error('Cannot pipe a Writable')
      }

      current
        .on('data', () => {})
        .on('error', (error: Error) => {
          for (const stream of streams) {
            stream.destroy()
            process.nextTick(stream.removeAllListeners.bind(stream))
          }

          reject(new Error(`Stream #${index} failed: ${error.message}`))
        })

      if (index === streams.length - 1) {
        current.once('finish', () => {
          for (const stream of streams) {
            process.nextTick(stream.removeAllListeners.bind(stream))
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
