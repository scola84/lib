import type { Readable, Stream } from 'stream'
import { Transform, Writable } from 'stream'

export async function pipeline (...streams: Array<Readable | Transform | Writable>): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    function removeListeners (): void {
      let stream = null

      for (stream of streams) {
        const listener = listeners.get(stream)
        listeners.delete(stream)

        if (listener !== undefined) {
          stream.removeListener('error', listener)
        }
      }

      stream?.removeListener('finish', handleFinish)
    }

    function handleError (index: number, error: Error): void {
      for (const stream of streams) {
        stream.destroy()
      }

      removeListeners()
      reject(new Error(`stream(${index}): ${String(error)}`))
    }

    function handleFinish (): void {
      removeListeners()
      resolve()
    }

    const listeners = new Map<Stream, (error: Error) => void>()
    let previous = null

    for (const stream of streams) {
      if (previous instanceof Writable && !(previous instanceof Transform)) {
        throw new Error(`Cannot pipe a Writable (stream[${streams.indexOf(previous)}])`)
      }

      const listener = handleError.bind(stream, streams.indexOf(stream))
      listeners.set(stream, listener)
      stream.on('error', listener)

      if (previous !== null && (stream instanceof Transform || stream instanceof Writable)) {
        previous.pipe(stream)
      }

      previous = stream
    }

    previous?.once('finish', handleFinish)
  })
}
