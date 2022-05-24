import authEntitiesGroup from './auth/entities/group.html'
import authEntitiesRole from './auth/entities/role.html'
import authEntitiesUser from './auth/entities/user.html'
import authEntitiesUserGroup from './auth/entities/user-group.html'
import authEntitiesUserGroupRole from './auth/entities/user-group-role.html'
import authEntitiesUserRole from './auth/entities/user-role.html'
import authEntitiesUserToken from './auth/entities/user-token.html'
import authSfaGate from './auth/sfa/gate.html'
import authSfaUpdate from './auth/sfa/update.html'
import queueEntitiesQueue from './queue/entities/queue.html'
import queueEntitiesRun from './queue/entities/run.html'
import queueEntitiesTask from './queue/entities/task.html'
import viewEntitiesView from './view/entities/view.html'
import viewEntitiesViewGroup from './view/entities/view-group.html'
import viewEntitiesViewUser from './view/entities/view-user.html'

export const snippets = {
  'sc-auth-entities-group': authEntitiesGroup,
  'sc-auth-entities-role': authEntitiesRole,
  'sc-auth-entities-user': authEntitiesUser,
  'sc-auth-entities-user-group': authEntitiesUserGroup,
  'sc-auth-entities-user-group-role': authEntitiesUserGroupRole,
  'sc-auth-entities-user-role': authEntitiesUserRole,
  'sc-auth-entities-user-token': authEntitiesUserToken,
  'sc-auth-sfa-gate': authSfaGate,
  'sc-auth-sfa-update': authSfaUpdate,
  'sc-queue-entities-queue': queueEntitiesQueue,
  'sc-queue-entities-run': queueEntitiesRun,
  'sc-queue-entities-task': queueEntitiesTask,
  'sc-view-entities-view': viewEntitiesView,
  'sc-view-entities-view-group': viewEntitiesViewGroup,
  'sc-view-entities-view-user': viewEntitiesViewUser
}
