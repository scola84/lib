import {
  Broadcaster,
  HttpRouter,
  HttpServer,
  Queuer,
  Resolver,
  Slicer,
  Trigger
} from '../actor/api.js'

import {
  CleanupTriggerItemDeleter,
  CleanupTriggerRunDeleter,
  CleanupTriggerTaskDeleter,
  ItemUpdater,
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
  TaskBoxer,
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
  id: 'queue-broadcaster',
  resolve: false
})

const cleanupTrigger = new Trigger({
  description: 'Trigger cleanup',
  id: 'queue-cleanup-trigger',
  schedule: process.env.QUEUE_CLEANUP_TRIGGER_SCHEDULE
})

const cleanupTriggerRunDeleter = new CleanupTriggerRunDeleter({
  description: 'Delete runs after cleanup trigger',
  id: 'queue-cleanup-run-deleter',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const cleanupTriggerItemDeleter = new CleanupTriggerItemDeleter({
  description: 'Delete items after cleanup trigger',
  id: 'queue-cleanup-item-deleter',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const cleanupTriggerTaskDeleter = new CleanupTriggerTaskDeleter({
  description: 'Delete task after cleanup trigger',
  id: 'queue-cleanup-task-deleter',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const itemUpdater = new ItemUpdater({
  description: 'Update item after task execution',
  id: 'queue-item-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const nextQueueSelector = new NextQueueSelector({
  description: 'Select queues to run after task execution',
  id: 'queue-next-queue-selector',
  cleanup: process.env.QUEUE_CLEANUP_AFTER,
  client: process.env.QUEUE_DATABASE_CLIENT,
  result: 'stream'
})

const nextTaskSlicer = new NextTaskSlicer({
  description: 'Slice next tasks after task execution',
  id: 'queue-next-task-slicer',
  resolve: false
})

const queueStatAfterUpdater = new QueueStatAfterUpdater({
  description: 'Update queue done count after task execution',
  id: 'queue-stat-after-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const queueStatBeforeUpdater = new QueueStatBeforeUpdater({
  description: 'Update queue busy count before task execution',
  id: 'queue-stat-before-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const queueTrigger = new Trigger({
  description: 'Trigger queues',
  id: 'queue-trigger',
  schedule: process.env.QUEUE_TRIGGER_SCHEDULE
})

const queueTriggerItemInserter = new QueueTriggerItemInserter({
  description: 'Insert item for run after queue trigger',
  id: 'queue-trigger-item-inserter',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const queueTriggerItemSelector = new QueueTriggerItemSelector({
  description: 'Select items for run after queue trigger',
  id: 'queue-trigger-item-selector',
  name: 'queue',
  result: 'stream',
  throttle: true
})

const queueTriggerQueueSelector = new QueueTriggerQueueSelector({
  description: 'Select queues to run after queue trigger',
  id: 'queue-trigger-queue-selector',
  cleanup: process.env.QUEUE_CLEANUP_AFTER,
  client: process.env.QUEUE_DATABASE_CLIENT,
  regexp: process.env.QUEUE_TRIGGER_REGEXP,
  result: 'stream'
})

const queueTriggerQueueUpdater = new QueueTriggerQueueUpdater({
  description: 'Update queue next run timestamp after queue trigger',
  id: 'queue-trigger-queue-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const queueTriggerRunDecider = new RunDecider({
  description: 'Decide whether to execute run after queue trigger',
  id: 'trigger-queue-run-decider'
})

const queueTriggerRunInserter = new QueueTriggerRunInserter({
  description: 'Insert run after queue trigger',
  id: 'queue-trigger-run-inserter',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const runStatAfterUpdater = new RunStatAfterUpdater({
  description: 'Update run status count after task execution',
  id: 'queue-run-stat-after-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const runStatBeforeUpdater = new RunStatBeforeUpdater({
  description: 'Update run total count after task execution',
  id: 'queue-run-stat-before-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const runTrigger = new Trigger({
  description: 'Trigger runs',
  id: 'queue-run-trigger',
  schedule: process.env.QUEUE_RUN_TRIGGER_SCHEDULE
})

const runTriggerRunDecider = new RunDecider({
  description: 'Decide whether to execute run after run trigger',
  id: 'queue-run-trigger-run-decider'
})

const runTriggerItemSelector = new RunTriggerItemSelector({
  description: 'Select items for run after run trigger',
  id: 'queue-run-trigger-item-selector',
  client: process.env.QUEUE_DATABASE_CLIENT,
  name: 'queue',
  result: 'stream',
  throttle: true
})

const runTriggerRunSelector = new RunTriggerRunSelector({
  description: 'Select runs to run after run trigger',
  id: 'queue-run-trigger-run-selector',
  client: process.env.QUEUE_DATABASE_CLIENT,
  regexp: process.env.QUEUE_RUN_TRIGGER_REGEXP,
  result: 'stream'
})

const server = new HttpServer({
  description: 'Serve queue resources',
  id: 'queue-server',
  identifiers: process.env.QUEUE_HTTP_IDENTIFIERS,
  name: 'queue',
  server: process.env.QUEUE_HTTP_SERVER,
  throttle: true
})

const serverQueueSelector = new ServerQueueSelector({
  description: 'Select queue for task execution',
  id: 'queue-server-queue-selector',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const serverResultComposer = new ServerResultComposer({
  description: 'Compose task results for client',
  id: 'queue-server-result-composer'
})

const serverResultListener = new Queuer({
  description: 'Listen for streaming task results',
  id: 'queue-server-stream-listener',
  boxes: server.getBoxes(),
  client: process.env.QUEUE_QUEUER_CLIENT,
  streamer: true
})

const serverResultResponder = new ServerResultResponder({
  description: 'Send task results to client',
  id: 'queue-server-responder',
  name: 'queue'
})

const serverResultStreamer = new ServerResultStreamer({
  description: 'Stream task results to client',
  id: 'queue-server-streamer',
  name: 'queue'
})

const serverRouter = new HttpRouter({
  description: 'Route requests to queue resources',
  id: 'queue-server-router',
  name: 'queue'
})

const serverTaskFilter = new ServerTaskFilter({
  description: 'Filter tasks from request',
  id: 'queue-server-task-filter'
})

const serverTaskResolver = new Resolver({
  description: 'Resolve task slices',
  id: 'queue-server-task-resolver',
  collect: true,
  name: 'queue'
})

const serverTaskSlicer = new Slicer({
  description: 'Slice tasks from request',
  id: 'queue-server-task-slicer',
  name: 'queue'
})

const taskBoxer = new TaskBoxer({
  description: 'Create a new box for every task',
  id: 'queue-task-boxer'
})

const taskComposer = new TaskComposer({
  description: 'Compose task after trigger',
  id: 'queue-task-composer'
})

const taskInserter = new TaskInserter({
  description: 'Insert task before execution',
  id: 'queue-task-inserter',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const taskMerger = new TaskMerger({
  description: 'Merge task settings',
  id: 'queue-task-merger',
  cleanup: process.env.QUEUE_CLEANUP_AFTER,
  client: process.env.QUEUE_DATABASE_CLIENT,
  timeout: process.env.QUEUE_TIMEOUT_AFTER
})

const taskPusher = new Queuer({
  description: 'Push task',
  id: 'queue-task-pusher',
  boxes: server.getBoxes(),
  client: process.env.QUEUE_QUEUER_CLIENT,
  highWaterMark: process.env.QUEUE_HIGH_WATER_MARK,
  name: 'queue',
  pusher: true
})

const taskUpdater = new TaskUpdater({
  description: 'Update task after execution',
  id: 'queue-task-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const timeoutTrigger = new Trigger({
  description: 'Trigger timeout',
  id: 'queue-timeout-trigger',
  schedule: process.env.QUEUE_TIMEOUT_TRIGGER_SCHEDULE
})

const timeoutTriggerTaskSelector = new TimeoutTriggerTaskSelector({
  description: 'Select tasks to be timed out',
  id: 'queue-timeout-trigger-task-selector',
  client: process.env.QUEUE_DATABASE_CLIENT,
  result: 'stream'
})

const timeoutTriggerTaskUpdater = new TimeoutTriggerTaskUpdater({
  description: 'Update task to be timed out',
  id: 'queue-timeout-trigger-task-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const timeoutTriggerItemUpdater = new TimeoutTriggerItemUpdater({
  description: 'Update item after task timeout',
  id: 'queue-timeout-trigger-item-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const timeoutTriggerRunUpdater = new TimeoutTriggerRunUpdater({
  description: 'Update run after task timeout',
  id: 'queue-timeout-trigger-run-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const timeoutTriggerQueueUpdater = new TimeoutTriggerQueueUpdater({
  description: 'Update queue after task timeout',
  id: 'queue-timeout-trigger-queue-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
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
  .connect(runStatBeforeUpdater)

runTrigger
  .connect(runTriggerRunSelector)
  .connect(runTriggerRunDecider)

runTriggerRunDecider
  .bypass(false)
  .connect(runTriggerItemSelector)
  .connect(runStatBeforeUpdater)

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

runStatBeforeUpdater
  .connect(queueStatBeforeUpdater)
  .connect(taskComposer)
  .connect(taskMerger)

taskMerger
  .connect(taskInserter)
  .connect(taskBoxer)
  .connect(taskPusher)
  .bypass(serverResultComposer)
  .connect(taskUpdater)

taskUpdater
  .connect(itemUpdater)
  .connect(runStatAfterUpdater)
  .connect(queueStatAfterUpdater)
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
  .connect(taskMerger)

broadcaster
  .connect(nextQueueSelector)
  .bypass(false)
  .connect(queueTriggerRunDecider)

queueTrigger.call()
