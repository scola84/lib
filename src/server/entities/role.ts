import type { Struct } from '../../common'

export interface Role {
  ip: boolean

  permissions: Struct

  role_id: number | string

  validity: number
}
