import {
  Broadcaster,
  HttpRouter,
  HttpServer,
  Queuer,
  Resolver,
  Slicer,
  Trigger,
  Worker
} from '../actor/api.js'

import {
  BoxCreator,
  CleanupItemDeleter,
  CleanupRunDeleter,
  CleanupTaskDeleter,
  ItemUpdater,
  NextQueueSelector,
  NextTaskSlicer,
  QueueRunInserter,
  QueueRunItemInserter,
  QueueRunItemSelector,
  QueueSelector,
  QueueStatAfterUpdater,
  QueueStatBeforeUpdater,
  QueueUpdater,
  RunDecider,
  RunItemSelector,
  RunSelector,
  RunStatAfterUpdater,
  RunStatBeforeUpdater,
  ServerQueueSelector,
  ServerResultComposer,
  ServerResultResponder,
  ServerResultStreamer,
  ServerTaskFilter,
  TaskComposer,
  TaskInserter,
  TaskMerger,
  TaskPusher,
  TaskUpdater,
  TimeoutItemUpdater,
  TimeoutRunUpdater,
  TimeoutTaskSelector,
  TimeoutTaskUpdater
} from './prc/index.js'

const broadcaster = new Broadcaster({
  description: 'Broadcast task results',
  id: 'broadcaster',
  resolve: false
})

const cleanupItemDeleter = new CleanupItemDeleter({
  description: 'Clean up items',
  id: 'cleanup-item-deleter',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const cleanupRunDeleter = new CleanupRunDeleter({
  description: 'Clean up runs',
  id: 'cleanup-run-deleter',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const cleanupTaskDeleter = new CleanupTaskDeleter({
  description: 'Clean up tasks',
  id: 'cleanup-task-deleter',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const cleanupTrigger = new Trigger({
  description: 'Trigger cleanup',
  id: 'cleanup-trigger',
  schedule: process.env.QUEUE_CLEANUP_TRIGGER_SCHEDULE
})

const itemUpdater = new ItemUpdater({
  description: 'Update item after task execution',
  id: 'item-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const nextQueueSelector = new NextQueueSelector({
  description: 'Select queues to run after task execution',
  id: 'next-queue-selector',
  cleanup: process.env.QUEUE_CLEANUP_AFTER,
  client: process.env.QUEUE_DATABASE_CLIENT,
  result: 'stream'
})

const nextTaskSlicer = new NextTaskSlicer({
  description: 'Slice next tasks after task execution',
  id: 'next-task-slicer',
  resolve: false
})

const queueRunBoxCreator = new BoxCreator({
  description: 'Create a new box for every run',
  id: 'queue-run-box-creator'
})

const queueRunDecider = new RunDecider({
  description: 'Decide whether to execute queue run',
  id: 'queue-run-decider'
})

const queueRunInserter = new QueueRunInserter({
  description: 'Insert queue run',
  id: 'queue-run-inserter',
  client: process.env.QUEUE_DATABASE_CLIENT
})
const queueRunItemInserter = new QueueRunItemInserter({
  description: 'Insert item for queue run',
  id: 'queue-run-item-inserter',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const queueRunItemSelector = new QueueRunItemSelector({
  description: 'Select items for queue run',
  id: 'queue-run-item-selector',
  name: 'queue',
  result: 'stream',
  throttle: true
})

const queueSelector = new QueueSelector({
  description: 'Select queues to run after queue trigger',
  id: 'queue-selector',
  cleanup: process.env.QUEUE_CLEANUP_AFTER,
  client: process.env.QUEUE_DATABASE_CLIENT,
  regexp: process.env.QUEUE_TRIGGER_REGEXP,
  result: 'stream'
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
  interval: process.env.QUEUE_TRIGGER_INTERVAL,
  schedule: process.env.QUEUE_TRIGGER_SCHEDULE
})

const queueUpdater = new QueueUpdater({
  description: 'Update queue next run timestamp after queue trigger',
  id: 'queue-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const runDecider = new RunDecider({
  description: 'Decide whether to execute run after run trigger',
  id: 'run-decider'
})

const runItemSelector = new RunItemSelector({
  description: 'Select items for run after run trigger',
  id: 'run-item-selector',
  client: process.env.QUEUE_DATABASE_CLIENT,
  name: 'queue',
  result: 'stream',
  throttle: true
})

const runSelector = new RunSelector({
  description: 'Select runs to run after run trigger',
  id: 'run-selector',
  client: process.env.QUEUE_DATABASE_CLIENT,
  regexp: process.env.QUEUE_RUN_TRIGGER_REGEXP,
  result: 'stream'
})

const runStatAfterUpdater = new RunStatAfterUpdater({
  description: 'Update run status count after task execution',
  id: 'run-stat-after-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const runStatBeforeUpdater = new RunStatBeforeUpdater({
  description: 'Update run total count after task execution',
  id: 'run-stat-before-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const runTrigger = new Trigger({
  description: 'Trigger runs',
  id: 'run-trigger',
  schedule: process.env.QUEUE_RUN_TRIGGER_SCHEDULE
})

const server = new HttpServer({
  description: 'Serve queue resources',
  id: 'server',
  identifiers: process.env.QUEUE_HTTP_IDENTIFIERS,
  name: 'queue',
  server: process.env.QUEUE_HTTP_SERVER,
  throttle: true
})

const serverQueueDecider = new Worker({
  description: 'Decide whether to execute task',
  id: 'server-queue-decider'
})

const serverQueueSelector = new ServerQueueSelector({
  description: 'Select queue for task execution',
  id: 'server-queue-selector',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const serverResultComposer = new ServerResultComposer({
  description: 'Compose task results for client',
  id: 'server-result-composer',
  name: 'queue'
})

const serverResultResponder = new ServerResultResponder({
  description: 'Send task results to client',
  id: 'server-result-responder',
  name: 'queue'
})

const serverResultStreamer = new ServerResultStreamer({
  description: 'Stream task results to client',
  id: 'server-result-streamer',
  name: 'queue'
})

const serverRouter = new HttpRouter({
  description: 'Route requests to queue resources',
  id: 'server-router',
  name: 'queue'
})

const serverStreamHandler = new Queuer({
  description: 'Handle task streams',
  id: 'server-stream-listener',
  boxes: server.getBoxes(),
  client: process.env.QUEUE_QUEUER_CLIENT,
  streamer: true
})

const serverTaskFilter = new ServerTaskFilter({
  description: 'Filter tasks from request',
  id: 'server-task-filter'
})

const serverTaskSlicer = new Slicer({
  description: 'Slice tasks from request',
  id: 'server-task-slicer',
  name: 'queue'
})

const serverTaskSlicerResolver = new Resolver({
  description: 'Resolve task slice',
  id: 'server-task-slicer-resolver',
  collect: true,
  name: 'queue'
})

const taskBoxCreator = new BoxCreator({
  description: 'Create a new box for every task',
  id: 'task-box-creator'
})

const taskComposer = new TaskComposer({
  description: 'Compose task after trigger',
  id: 'task-composer'
})

const taskInserter = new TaskInserter({
  description: 'Insert task before execution',
  id: 'task-inserter',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const taskMerger = new TaskMerger({
  description: 'Merge task options',
  id: 'task-merger',
  cleanup: process.env.QUEUE_CLEANUP_AFTER,
  client: process.env.QUEUE_DATABASE_CLIENT,
  timeout: process.env.QUEUE_TIMEOUT_AFTER
})

const taskPusher = new TaskPusher({
  description: 'Push task',
  id: 'task-pusher',
  boxes: server.getBoxes(),
  client: process.env.QUEUE_QUEUER_CLIENT,
  highWaterMark: process.env.QUEUE_HIGH_WATER_MARK,
  name: 'queue',
  pusher: true
})

const taskUpdater = new TaskUpdater({
  description: 'Update task after execution',
  id: 'task-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const timeoutItemUpdater = new TimeoutItemUpdater({
  description: 'Time out item',
  id: 'timeout-item-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const timeoutQueueStatAfterUpdater = new QueueStatAfterUpdater({
  description: 'Timeout queue',
  id: 'timeout-queue-stat-after-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const timeoutRunUpdater = new TimeoutRunUpdater({
  description: 'Time out run',
  id: 'timeout-run-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const timeoutTaskSelector = new TimeoutTaskSelector({
  description: 'Select tasks to be timed out',
  id: 'timeout-task-selector',
  client: process.env.QUEUE_DATABASE_CLIENT,
  result: 'stream'
})

const timeoutTaskUpdater = new TimeoutTaskUpdater({
  description: 'Time out task',
  id: 'timeout-task-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const timeoutTrigger = new Trigger({
  description: 'Trigger timeout',
  id: 'timeout-trigger',
  schedule: process.env.QUEUE_TIMEOUT_TRIGGER_SCHEDULE
})

cleanupTrigger
  .connect(cleanupRunDeleter)
  .connect(cleanupItemDeleter)
  .connect(cleanupTaskDeleter)

timeoutTrigger
  .connect(timeoutTaskSelector)
  .connect(timeoutTaskUpdater)
  .connect(timeoutItemUpdater)
  .connect(timeoutRunUpdater)
  .connect(timeoutQueueStatAfterUpdater)
  .connect(nextQueueSelector)

queueTrigger
  .connect(queueSelector)
  .connect(queueUpdater)
  .connect(queueRunDecider
    .bypass(false))
  .connect(queueRunInserter)
  .connect(queueRunBoxCreator)
  .connect(queueRunItemSelector)
  .connect(queueRunItemInserter)
  .connect(runStatBeforeUpdater)

runTrigger
  .connect(runSelector)
  .connect(runDecider
    .bypass(false))
  .connect(runItemSelector)
  .connect(runStatBeforeUpdater)

server
  .connect(serverRouter)

serverRouter
  .connect('POST /q/p', serverTaskFilter
    .bypass(serverResultResponder))
  .connect(serverTaskSlicer
    .bypass(serverTaskSlicerResolver))
  .connect(serverQueueSelector)
  .connect(serverQueueDecider
    .bypass(serverResultComposer))
  .connect(taskMerger)

serverRouter
  .connect('GET /q/r', serverStreamHandler
    .bypass(serverResultStreamer))
  .connect(taskUpdater)

runStatBeforeUpdater
  .connect(queueStatBeforeUpdater)
  .connect(taskComposer)
  .connect(taskMerger)

taskMerger
  .connect(taskInserter)
  .connect(taskBoxCreator)
  .connect(taskPusher
    .bypass(serverResultComposer))
  .connect(taskUpdater)

taskUpdater
  .connect(itemUpdater)
  .connect(runStatAfterUpdater)
  .connect(queueStatAfterUpdater)
  .connect(broadcaster)

broadcaster
  .connect(nextTaskSlicer
    .bypass(false))
  .connect(taskMerger)

broadcaster
  .connect(nextQueueSelector
    .bypass(false))
  .connect(queueRunDecider)

broadcaster
  .connect(serverResultComposer
    .bypass(false))
  .connect(serverTaskSlicerResolver)
  .connect(serverResultStreamer)
  .connect(serverResultResponder)
