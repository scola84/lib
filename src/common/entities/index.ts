import type { Entities as AuthEntities } from './auth'
import type { Entities as QueueEntities } from './queue'
import type { Entities as ViewEntities } from './view'

export * from './auth'
export * from './queue'
export * from './view'

export type Entities = Partial<AuthEntities & QueueEntities & ViewEntities>
