export function barrel (object: string): string {
  return `
import { DeleteHandler } from './delete'
import { GetAllHandler } from './get-all'
import { GetHandler } from './get'
import { PostHandler } from './post'
import { PutHandler } from './put'

export function ${object} (): void {
  const deleteHandler = new DeleteHandler({
    method: 'DELETE',
    url: '/api/${object}'
  })

  const getAllHandler = new GetAllHandler({
    method: 'GET',
    url: '/api/${object}s'
  })

  const getHandler = new GetHandler({
    method: 'GET',
    url: '/api/${object}'
  })

  const postHandler = new PostHandler({
    method: 'POST',
    url: '/api/${object}'
  })

  const putHandler = new PutHandler({
    method: 'PUT',
    url: '/api/${object}'
  })

  deleteHandler.start()
  getAllHandler.start()
  getHandler.start()
  postHandler.start()
  putHandler.start()
}
`.trim()
}
