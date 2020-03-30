import {
  Broadcaster,
  HttpRouter,
  HttpServer,
  Queuer,
  Resolver,
  Slicer,
  Trigger
} from '../ops/api.js'

import {
  CleanupTriggerItemDeleter,
  CleanupTriggerRunDeleter,
  CleanupTriggerTaskDeleter,
  ItemUpdater,
  NextBoxer,
  NextQueueSelector,
  NextTaskSlicer,
  QueueStatAfterUpdater,
  QueueStatBeforeUpdater,
  RunDecider,
  RunStatAfterUpdater,
  RunStatBeforeUpdater,
  RunTriggerItemSelector,
  RunTriggerRunSelector,
  ServerQueueSelector,
  ServerResultComposer,
  ServerResultResponder,
  ServerResultStreamer,
  ServerTaskFilter,
  TaskComposer,
  TaskInserter,
  TaskMerger,
  TaskUpdater,
  QueueTriggerItemInserter,
  QueueTriggerItemSelector,
  QueueTriggerQueueSelector,
  QueueTriggerQueueUpdater,
  QueueTriggerRunInserter,
  TimeoutTriggerItemUpdater,
  TimeoutTriggerQueueUpdater,
  TimeoutTriggerRunUpdater,
  TimeoutTriggerTaskSelector,
  TimeoutTriggerTaskUpdater
} from './prc/index.js'

const broadcaster = new Broadcaster({
  description: 'Broadcast task results',
  id: 'mgt-broadcaster',
  resolve: false
})

const cleanupTrigger = new Trigger({
  description: 'Trigger cleanup',
  id: 'mgt-cleanup-trigger',
  schedule: process.env.MGT_CLEANUP_TRIGGER_SCHEDULE
})

const cleanupTriggerRunDeleter = new CleanupTriggerRunDeleter({
  description: 'Delete runs after cleanup trigger',
  id: 'mgt-cleanup-run-deleter',
  client: process.env.MGT_DATABASE_CLIENT
})

const cleanupTriggerItemDeleter = new CleanupTriggerItemDeleter({
  description: 'Delete items after cleanup trigger',
  id: 'mgt-cleanup-item-deleter',
  client: process.env.MGT_DATABASE_CLIENT
})

const cleanupTriggerTaskDeleter = new CleanupTriggerTaskDeleter({
  description: 'Delete task after cleanup trigger',
  id: 'mgt-cleanup-task-deleter',
  client: process.env.MGT_DATABASE_CLIENT
})

const itemUpdater = new ItemUpdater({
  description: 'Update item after task execution',
  id: 'mgt-item-updater',
  client: process.env.MGT_DATABASE_CLIENT
})

const nextQueueBoxer = new NextBoxer({
  description: 'Create new box for next queud',
  id: 'mgt-next-queue-boxer'
})

const nextQueueSelector = new NextQueueSelector({
  description: 'Select queues to run after task execution',
  id: 'mgt-next-queue-selector',
  cleanup: process.env.MGT_QUEUE_CLEANUP,
  client: process.env.MGT_DATABASE_CLIENT,
  result: 'stream'
})

const nextTaskBoxer = new NextBoxer({
  description: 'Create new box for next task',
  id: 'mgt-next-task-boxer'
})

const nextTaskSlicer = new NextTaskSlicer({
  description: 'Slice next tasks after task execution',
  id: 'mgt-next-task-slicer',
  resolve: false
})

const queueStatAfterUpdater = new QueueStatAfterUpdater({
  description: 'Update queue done count after task execution',
  id: 'mgt-queue-stat-after-updater',
  client: process.env.MGT_DATABASE_CLIENT
})

const queueStatBeforeUpdater = new QueueStatBeforeUpdater({
  description: 'Update queue busy count before task execution',
  id: 'mgt-queue-stat-before-updater',
  client: process.env.MGT_DATABASE_CLIENT
})

const queueTrigger = new Trigger({
  description: 'Trigger queues',
  id: 'mgt-queue-trigger',
  schedule: process.env.MGT_QUEUE_TRIGGER_SCHEDULE
})

const queueTriggerItemInserter = new QueueTriggerItemInserter({
  description: 'Insert item for run after queue trigger',
  id: 'mgt-queue-trigger-item-inserter',
  client: process.env.MGT_DATABASE_CLIENT
})

const queueTriggerItemSelector = new QueueTriggerItemSelector({
  description: 'Select items for run after queue trigger',
  id: 'mgt-queue-trigger-item-selector',
  name: 'mgt',
  result: 'stream',
  throttle: true
})

const queueTriggerQueueSelector = new QueueTriggerQueueSelector({
  description: 'Select queues to run after queue trigger',
  id: 'mgt-queue-trigger-queue-selector',
  cleanup: process.env.MGT_QUEUE_CLEANUP,
  client: process.env.MGT_DATABASE_CLIENT,
  regexp: process.env.MGT_QUEUE_TRIGGER_REGEXP,
  result: 'stream'
})

const queueTriggerQueueUpdater = new QueueTriggerQueueUpdater({
  description: 'Update queue next run timestamp after queue trigger',
  id: 'mgt-queue-trigger-queue-updater',
  client: process.env.MGT_DATABASE_CLIENT
})

const queueTriggerRunDecider = new RunDecider({
  description: 'Decide whether to execute run after queue trigger',
  id: 'mgt-trigger-queue-run-decider'
})

const queueTriggerRunInserter = new QueueTriggerRunInserter({
  description: 'Insert run after queue trigger',
  id: 'mgt-queue-trigger-run-inserter',
  client: process.env.MGT_DATABASE_CLIENT
})

const runStatAfterUpdater = new RunStatAfterUpdater({
  description: 'Update run status count after task execution',
  id: 'mgt-run-stat-after-updater',
  client: process.env.MGT_DATABASE_CLIENT
})

const runStatBeforeUpdater = new RunStatBeforeUpdater({
  description: 'Update run total count after task execution',
  id: 'mgt-run-stat-before-updater',
  client: process.env.MGT_DATABASE_CLIENT
})

const runTrigger = new Trigger({
  description: 'Trigger runs',
  id: 'mgt-run-trigger',
  schedule: process.env.MGT_RUN_TRIGGER_SCHEDULE
})

const runTriggerRunDecider = new RunDecider({
  description: 'Decide whether to execute run after run trigger',
  id: 'mgt-run-trigger-run-decider'
})

const runTriggerItemSelector = new RunTriggerItemSelector({
  description: 'Select items for run after run trigger',
  id: 'mgt-run-trigger-item-selector',
  client: process.env.MGT_DATABASE_CLIENT,
  name: 'mgt',
  result: 'stream',
  throttle: true
})

const runTriggerRunSelector = new RunTriggerRunSelector({
  description: 'Select runs to run after run trigger',
  id: 'mgt-run-trigger-run-selector',
  client: process.env.MGT_DATABASE_CLIENT,
  regexp: process.env.MGT_RUN_TRIGGER_REGEXP,
  result: 'stream'
})

const server = new HttpServer({
  description: 'Serve queue resources',
  id: 'mgt-server',
  identifiers: process.env.MGT_HTTP_IDENTIFIERS,
  name: 'mgt',
  server: process.env.MGT_HTTP_SERVER,
  throttle: true
})

const serverQueueSelector = new ServerQueueSelector({
  description: 'Select queue for task execution',
  id: 'mgt-server-queue-selector',
  client: process.env.MGT_DATABASE_CLIENT
})

const serverResultComposer = new ServerResultComposer({
  description: 'Compose task results for client',
  id: 'mgt-server-result-composer'
})

const serverResultListener = new Queuer({
  description: 'Listen for streaming task results',
  id: 'mgt-server-stream-listener',
  boxes: server.getBoxes(),
  client: process.env.MGT_QUEUER_CLIENT,
  streamer: true
})

const serverResultResponder = new ServerResultResponder({
  description: 'Send task results to client',
  id: 'mgt-server-responder',
  name: 'mgt'
})

const serverResultStreamer = new ServerResultStreamer({
  description: 'Stream task results to client',
  id: 'mgt-server-streamer',
  name: 'mgt'
})

const serverRouter = new HttpRouter({
  description: 'Route requests to queue resources',
  id: 'mgt-server-router',
  name: 'mgt'
})

const serverTaskFilter = new ServerTaskFilter({
  description: 'Filter tasks from request',
  id: 'mgt-server-task-filter'
})

const serverTaskResolver = new Resolver({
  description: 'Resolve task slices',
  id: 'mgt-server-task-resolver',
  collect: true,
  name: 'mgt'
})

const serverTaskSlicer = new Slicer({
  description: 'Slice tasks from request',
  id: 'mgt-server-task-slicer',
  name: 'mgt'
})

const taskComposer = new TaskComposer({
  description: 'Compose task after trigger',
  id: 'mgt-task-composer'
})

const taskInserter = new TaskInserter({
  description: 'Insert task before execution',
  id: 'mgt-task-inserter',
  client: process.env.MGT_DATABASE_CLIENT
})

const taskMerger = new TaskMerger({
  description: 'Merge task settings',
  id: 'mgt-task-merger',
  cleanup: process.env.MGT_QUEUE_CLEANUP,
  client: process.env.MGT_DATABASE_CLIENT,
  timeout: process.env.MGT_QUEUE_TIMEOUT
})

const taskPusher = new Queuer({
  description: 'Push task',
  id: 'mgt-task-pusher',
  boxes: server.getBoxes(),
  client: process.env.MGT_QUEUER_CLIENT,
  highWaterMark: process.env.MGT_HIGH_WATER_MARK,
  name: 'mgt',
  pusher: true
})

const taskUpdater = new TaskUpdater({
  description: 'Update task after execution',
  id: 'mgt-task-updater',
  client: process.env.MGT_DATABASE_CLIENT
})

const timeoutTrigger = new Trigger({
  description: 'Trigger timeout',
  id: 'mgt-timeout-trigger',
  schedule: process.env.MGT_TIMEOUT_TRIGGER_SCHEDULE
})

const timeoutTriggerTaskSelector = new TimeoutTriggerTaskSelector({
  description: 'Select tasks to be timed out',
  id: 'mgt-timeout-trigger-task-selector',
  client: process.env.MGT_DATABASE_CLIENT,
  result: 'stream'
})

const timeoutTriggerTaskUpdater = new TimeoutTriggerTaskUpdater({
  description: 'Update task to be timed out',
  id: 'mgt-timeout-trigger-task-updater',
  client: process.env.MGT_DATABASE_CLIENT
})

const timeoutTriggerItemUpdater = new TimeoutTriggerItemUpdater({
  description: 'Update item after task timeout',
  id: 'mgt-timeout-trigger-item-updater',
  client: process.env.MGT_DATABASE_CLIENT
})

const timeoutTriggerRunUpdater = new TimeoutTriggerRunUpdater({
  description: 'Update run after task timeout',
  id: 'mgt-timeout-trigger-run-updater',
  client: process.env.MGT_DATABASE_CLIENT
})

const timeoutTriggerQueueUpdater = new TimeoutTriggerQueueUpdater({
  description: 'Update queue after task timeout',
  id: 'mgt-timeout-trigger-queue-updater',
  client: process.env.MGT_DATABASE_CLIENT
})

cleanupTrigger
  .connect(cleanupTriggerRunDeleter)
  .connect(cleanupTriggerItemDeleter)
  .connect(cleanupTriggerTaskDeleter)

timeoutTrigger
  .connect(timeoutTriggerTaskSelector)
  .connect(timeoutTriggerTaskUpdater)
  .connect(timeoutTriggerItemUpdater)
  .connect(timeoutTriggerRunUpdater)
  .connect(timeoutTriggerQueueUpdater)

queueTrigger
  .connect(queueTriggerQueueSelector)
  .connect(queueTriggerQueueUpdater)
  .connect(queueTriggerRunDecider)

queueTriggerRunDecider
  .bypass(false)
  .connect(queueTriggerRunInserter)
  .connect(queueTriggerItemSelector)
  .connect(queueTriggerItemInserter)
  .connect(queueStatBeforeUpdater)

runTrigger
  .connect(runTriggerRunSelector)
  .connect(runTriggerRunDecider)

runTriggerRunDecider
  .bypass(false)
  .connect(runTriggerItemSelector)
  .connect(queueStatBeforeUpdater)

server
  .connect(serverRouter)

serverRouter
  .connect('POST /q/p', serverTaskFilter)
  .bypass(serverResultResponder)
  .connect(serverTaskSlicer)
  .bypass(serverTaskResolver)
  .connect(serverQueueSelector)
  .connect(taskMerger)

serverRouter
  .connect('GET /q/r', serverResultListener)
  .bypass(serverResultStreamer)
  .connect(taskUpdater)

queueStatBeforeUpdater
  .connect(runStatBeforeUpdater)
  .connect(taskComposer)
  .connect(taskMerger)

taskMerger
  .connect(taskInserter)
  .connect(taskPusher)
  .bypass(serverResultComposer)
  .connect(taskUpdater)

taskUpdater
  .connect(itemUpdater)
  .connect(queueStatAfterUpdater)
  .connect(runStatAfterUpdater)
  .connect(broadcaster)

broadcaster
  .connect(serverResultComposer)
  .bypass(false)
  .connect(serverTaskResolver)
  .connect(serverResultStreamer)
  .connect(serverResultResponder)

broadcaster
  .connect(nextTaskSlicer)
  .bypass(false)
  .connect(nextTaskBoxer)
  .connect(taskMerger)

broadcaster
  .connect(nextQueueSelector)
  .bypass(false)
  .connect(nextQueueBoxer)
  .connect(queueTriggerRunDecider)
