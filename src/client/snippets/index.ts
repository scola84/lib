import authFlowLogin from './auth/flow/login.html'
import authFormGroup from './auth/form/group.html'
import authFormRole from './auth/form/role.html'
import authFormUser from './auth/form/user.html'
import authFormUserGroup from './auth/form/user-group.html'
import authFormUserGroupRole from './auth/form/user-group-role.html'
import authFormUserRole from './auth/form/user-role.html'
import authFormUserToken from './auth/form/user-token.html'
import queueFormQueue from './queue/form/queue.html'
import queueFormRun from './queue/form/run.html'
import queueFormTask from './queue/form/task.html'

export const snippets = {
  'sc-auth-flow-login': authFlowLogin,
  'sc-auth-form-group': authFormGroup,
  'sc-auth-form-role': authFormRole,
  'sc-auth-form-user': authFormUser,
  'sc-auth-form-user-group': authFormUserGroup,
  'sc-auth-form-user-group-role': authFormUserGroupRole,
  'sc-auth-form-user-role': authFormUserRole,
  'sc-auth-form-user-token': authFormUserToken,
  'sc-queue-form-queue': queueFormQueue,
  'sc-queue-form-run': queueFormRun,
  'sc-queue-form-task': queueFormTask
}
