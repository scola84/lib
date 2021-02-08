import type { Readable, Stream } from 'stream'
import { Transform, Writable } from 'stream'

export async function pipeline (...streams: Array<Readable | Transform | Writable>): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    function removeListeners (): void {
      let stream = null

      for (stream of streams) {
        const dataListener = dataListeners.get(stream)
        const errorListener = errorListeners.get(stream)

        dataListeners.delete(stream)
        errorListeners.delete(stream)

        if (dataListener !== undefined) {
          stream.removeListener('data', dataListener)
        }

        if (errorListener !== undefined) {
          stream.removeListener('error', errorListener)
        }
      }

      stream?.removeListener('finish', handleFinish)
    }

    function handleData (): void {}

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

    const dataListeners = new Map<Stream, () => void>()
    const errorListeners = new Map<Stream, (error: Error) => void>()

    let previous = null

    for (const stream of streams) {
      if (previous instanceof Writable && !(previous instanceof Transform)) {
        throw new Error(`Cannot pipe a Writable (stream[${streams.indexOf(previous)}])`)
      }

      const errorListener = handleError.bind(stream, streams.indexOf(stream))
      errorListeners.set(stream, errorListener)
      stream.on('error', errorListener)

      if (previous !== null && (stream instanceof Transform || stream instanceof Writable)) {
        previous.pipe(stream)
      }

      const dataListener = handleData.bind(stream)
      dataListeners.set(stream, dataListener)
      stream.on('data', dataListener)

      previous = stream
    }

    previous?.once('finish', handleFinish)
  })
}
