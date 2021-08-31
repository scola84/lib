declare module 'image-capture' {
  export class ImageCapture {
    public constructor (track: MediaStreamTrack)
    public takePhoto (options?: Record<string, unknown>): Promise<Blob>
  }
}
