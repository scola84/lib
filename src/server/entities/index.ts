import type { Entities as AuthEntities } from './auth'
import type { Entities as QueueEntities } from './queue'

export * from './auth'
export * from './queue'

export type Entities = Partial<AuthEntities & QueueEntities>
