export interface Bucket {
  get: (key: string) => Promise<NodeJS.ReadableStream>
  put: (key: string, stream: NodeJS.ReadableStream) => Promise<unknown>
}
