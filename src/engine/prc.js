import {
  Broadcaster,
  HttpRouter,
  HttpServer,
  Queuer,
  Resolver,
  Slicer,
  Trigger
} from '../worker/api.js'

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
  id: 'engine-broadcaster',
  resolve: false
})

const cleanupTrigger = new Trigger({
  description: 'Trigger cleanup',
  id: 'engine-cleanup-trigger',
  schedule: process.env.ENGINE_CLEANUP_TRIGGER_SCHEDULE
})

const cleanupTriggerRunDeleter = new CleanupTriggerRunDeleter({
  description: 'Delete runs after cleanup trigger',
  id: 'engine-cleanup-run-deleter',
  client: process.env.ENGINE_DATABASE_CLIENT
})

const cleanupTriggerItemDeleter = new CleanupTriggerItemDeleter({
  description: 'Delete items after cleanup trigger',
  id: 'engine-cleanup-item-deleter',
  client: process.env.ENGINE_DATABASE_CLIENT
})

const cleanupTriggerTaskDeleter = new CleanupTriggerTaskDeleter({
  description: 'Delete task after cleanup trigger',
  id: 'engine-cleanup-task-deleter',
  client: process.env.ENGINE_DATABASE_CLIENT
})

const itemUpdater = new ItemUpdater({
  description: 'Update item after task execution',
  id: 'engine-item-updater',
  client: process.env.ENGINE_DATABASE_CLIENT
})

const nextQueueSelector = new NextQueueSelector({
  description: 'Select queues to run after task execution',
  id: 'engine-next-queue-selector',
  cleanup: process.env.ENGINE_QUEUE_CLEANUP,
  client: process.env.ENGINE_DATABASE_CLIENT,
  result: 'stream'
})

const nextTaskSlicer = new NextTaskSlicer({
  description: 'Slice next tasks after task execution',
  id: 'engine-next-task-slicer',
  resolve: false
})

const queueStatAfterUpdater = new QueueStatAfterUpdater({
  description: 'Update queue done count after task execution',
  id: 'engine-queue-stat-after-updater',
  client: process.env.ENGINE_DATABASE_CLIENT
})

const queueStatBeforeUpdater = new QueueStatBeforeUpdater({
  description: 'Update queue busy count before task execution',
  id: 'engine-queue-stat-before-updater',
  client: process.env.ENGINE_DATABASE_CLIENT
})

const queueTrigger = new Trigger({
  description: 'Trigger queues',
  id: 'engine-queue-trigger',
  schedule: process.env.ENGINE_QUEUE_TRIGGER_SCHEDULE
})

const queueTriggerItemInserter = new QueueTriggerItemInserter({
  description: 'Insert item for run after queue trigger',
  id: 'engine-queue-trigger-item-inserter',
  client: process.env.ENGINE_DATABASE_CLIENT
})

const queueTriggerItemSelector = new QueueTriggerItemSelector({
  description: 'Select items for run after queue trigger',
  id: 'engine-queue-trigger-item-selector',
  client: process.env.ENGINE_DATABASE_CLIENT,
  name: 'engine',
  result: 'stream',
  throttle: true
})

const queueTriggerQueueSelector = new QueueTriggerQueueSelector({
  description: 'Select queues to run after queue trigger',
  id: 'engine-queue-trigger-queue-selector',
  cleanup: process.env.ENGINE_QUEUE_CLEANUP,
  client: process.env.ENGINE_DATABASE_CLIENT,
  regexp: process.env.ENGINE_QUEUE_TRIGGER_REGEXP,
  result: 'stream'
})

const queueTriggerQueueUpdater = new QueueTriggerQueueUpdater({
  description: 'Update queue next run timestamp after queue trigger',
  id: 'engine-queue-trigger-queue-updater',
  client: process.env.ENGINE_DATABASE_CLIENT
})

const queueTriggerRunDecider = new RunDecider({
  description: 'Decide whether to execute run after queue trigger',
  id: 'engine-trigger-queue-run-decider'
})

const queueTriggerRunInserter = new QueueTriggerRunInserter({
  description: 'Insert run after queue trigger',
  id: 'engine-queue-trigger-run-inserter',
  client: process.env.ENGINE_DATABASE_CLIENT
})

const runStatAfterUpdater = new RunStatAfterUpdater({
  description: 'Update run status count after task execution',
  id: 'engine-run-stat-after-updater',
  client: process.env.ENGINE_DATABASE_CLIENT
})

const runStatBeforeUpdater = new RunStatBeforeUpdater({
  description: 'Update run total count after task execution',
  id: 'engine-run-stat-before-updater',
  client: process.env.ENGINE_DATABASE_CLIENT
})

const runTrigger = new Trigger({
  description: 'Trigger runs',
  id: 'engine-run-trigger',
  schedule: process.env.ENGINE_RUN_TRIGGER_SCHEDULE
})

const runTriggerRunDecider = new RunDecider({
  description: 'Decide whether to execute run after run trigger',
  id: 'engine-run-trigger-run-decider'
})

const runTriggerItemSelector = new RunTriggerItemSelector({
  description: 'Select items for run after run trigger',
  id: 'engine-run-trigger-item-selector',
  client: process.env.ENGINE_DATABASE_CLIENT,
  name: 'engine',
  result: 'stream',
  throttle: true
})

const runTriggerRunSelector = new RunTriggerRunSelector({
  description: 'Select runs to run after run trigger',
  id: 'engine-run-trigger-run-selector',
  client: process.env.ENGINE_DATABASE_CLIENT,
  regexp: process.env.ENGINE_RUN_TRIGGER_REGEXP,
  result: 'stream'
})

const server = new HttpServer({
  description: 'Serve queue resources',
  id: 'engine-server',
  name: 'engine',
  server: process.env.ENGINE_HTTP_SERVER,
  throttle: true
})

const serverQueueSelector = new ServerQueueSelector({
  description: 'Select queue for task execution',
  id: 'engine-server-queue-selector',
  client: process.env.ENGINE_DATABASE_CLIENT
})

const serverResultComposer = new ServerResultComposer({
  description: 'Compose task results for client',
  id: 'engine-server-result-composer'
})

const serverResultListener = new Queuer({
  description: 'Listen for streaming task results',
  id: 'engine-server-stream-listener',
  boxes: server.getBoxes(),
  client: process.env.ENGINE_QUEUER_CLIENT,
  streamer: true
})

const serverResultResponder = new ServerResultResponder({
  description: 'Send task results to client',
  id: 'engine-server-responder',
  name: 'engine'
})

const serverResultStreamer = new ServerResultStreamer({
  description: 'Stream task results to client',
  id: 'engine-server-streamer',
  name: 'engine'
})

const serverRouter = new HttpRouter({
  description: 'Route requests to queue resources',
  id: 'engine-server-router',
  name: 'engine'
})

const serverTaskFilter = new ServerTaskFilter({
  description: 'Filter tasks from request',
  id: 'engine-server-task-filter'
})

const serverTaskResolver = new Resolver({
  description: 'Resolve task slices',
  id: 'engine-server-task-resolver',
  collect: true,
  name: 'engine'
})

const serverTaskSlicer = new Slicer({
  description: 'Slice tasks from request',
  id: 'engine-server-task-slicer',
  name: 'engine'
})

const taskComposer = new TaskComposer({
  description: 'Compose task after trigger',
  id: 'engine-task-composer'
})

const taskInserter = new TaskInserter({
  description: 'Insert task before execution',
  id: 'engine-task-inserter',
  client: process.env.ENGINE_DATABASE_CLIENT
})

const taskMerger = new TaskMerger({
  description: 'Merge task settings',
  id: 'engine-task-merger',
  cleanup: process.env.ENGINE_QUEUE_CLEANUP,
  client: process.env.ENGINE_DATABASE_CLIENT,
  timeout: process.env.ENGINE_QUEUE_TIMEOUT
})

const taskPusher = new Queuer({
  description: 'Push task',
  id: 'engine-task-pusher',
  boxes: server.getBoxes(),
  client: process.env.ENGINE_QUEUER_CLIENT,
  highWaterMark: process.env.ENGINE_HIGH_WATER_MARK,
  name: 'engine',
  pusher: true
})

const taskUpdater = new TaskUpdater({
  description: 'Update task after execution',
  id: 'engine-task-updater',
  client: process.env.ENGINE_DATABASE_CLIENT
})

const timeoutTrigger = new Trigger({
  description: 'Trigger timeout',
  id: 'engine-timeout-trigger',
  schedule: process.env.ENGINE_TIMEOUT_TRIGGER_SCHEDULE
})

const timeoutTriggerTaskSelector = new TimeoutTriggerTaskSelector({
  description: 'Select tasks to be timed out',
  id: 'engine-timeout-trigger-task-selector',
  client: process.env.ENGINE_DATABASE_CLIENT,
  result: 'stream'
})

const timeoutTriggerTaskUpdater = new TimeoutTriggerTaskUpdater({
  description: 'Update task to be timed out',
  id: 'engine-timeout-trigger-task-updater',
  client: process.env.ENGINE_DATABASE_CLIENT
})

const timeoutTriggerItemUpdater = new TimeoutTriggerItemUpdater({
  description: 'Update item after task timeout',
  id: 'engine-timeout-trigger-item-updater',
  client: process.env.ENGINE_DATABASE_CLIENT
})

const timeoutTriggerRunUpdater = new TimeoutTriggerRunUpdater({
  description: 'Update run after task timeout',
  id: 'engine-timeout-trigger-run-updater',
  client: process.env.ENGINE_DATABASE_CLIENT
})

const timeoutTriggerQueueUpdater = new TimeoutTriggerQueueUpdater({
  description: 'Update queue after task timeout',
  id: 'engine-timeout-trigger-queue-updater',
  client: process.env.ENGINE_DATABASE_CLIENT
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
  .connect(taskMerger)

broadcaster
  .connect(nextQueueSelector)
  .bypass(false)
  .connect(queueTriggerRunDecider)
