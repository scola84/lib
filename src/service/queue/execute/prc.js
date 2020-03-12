import {
  Broadcaster,
  HttpRouter,
  HttpServer,
  Queuer,
  Resolver,
  Trigger
} from '../../../worker/api.js'

import {
  ItemInserter,
  ItemSelector,
  ItemUpdater,
  NextQueueSelector,
  NextTaskSlicer,
  RunInserter,
  RunCountUpdater,
  RunTotalUpdater,
  ServerQueueSelector,
  ServerResponder,
  ServerStreamer,
  ServerTaskSlicer,
  TaskInserter,
  TaskSelector,
  TaskUpdater,
  TriggerQueueSelector,
  TriggerQueueUpdater
} from './prc/index.js'

const broadcaster = new Broadcaster({
  description: 'Broadcast task results',
  id: 'queue-broadcaster',
  resolve: false
})

const itemInserter = new ItemInserter({
  description: 'Insert item for run',
  id: 'queue-item-inserter',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const itemSelector = new ItemSelector({
  description: 'Select items for run',
  id: 'queue-item-selector',
  client: process.env.QUEUE_DATABASE_CLIENT,
  stream: true
})

const itemUpdater = new ItemUpdater({
  description: 'Update item after task execution',
  id: 'queue-item-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const nextQueueSelector = new NextQueueSelector({
  description: 'Select queues to run after task execution',
  id: 'queue-next-queue-selector',
  client: process.env.QUEUE_DATABASE_CLIENT,
  stream: true
})

const nextTaskSlicer = new NextTaskSlicer({
  description: 'Slice next tasks after task execution',
  id: 'queue-next-task-slicer',
  resolve: false
})

const runCountUpdater = new RunCountUpdater({
  description: 'Update run count after task execution',
  id: 'queue-run-count-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const runInserter = new RunInserter({
  description: 'Insert run',
  id: 'queue-run-inserter',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const runTotalUpdater = new RunTotalUpdater({
  description: 'Update run total after task insert',
  id: 'queue-run-total-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const server = new HttpServer({
  description: 'Serve queue resources',
  id: 'queue-server',
  server: process.env.QUEUE_HTTP_SERVER
})

const serverQueueSelector = new ServerQueueSelector({
  description: 'Select queue for task execution',
  id: 'queue-server-queue-selector',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const serverResponder = new ServerResponder({
  description: 'Send task results to client',
  id: 'queue-server-responder'
})

const serverRouter = new HttpRouter({
  description: 'Route requests to queue resources',
  id: 'queue-server-router'
})

const serverTaskResolver = new Resolver({
  description: 'Resolve task slices',
  id: 'queue-server-task-resolver',
  collect: true,
  name: 'task'
})

const serverTaskSlicer = new ServerTaskSlicer({
  description: 'Slice tasks from request',
  id: 'queue-server-task-slicer',
  name: 'task'
})

const serverStreamListener = new Queuer({
  description: 'Listen for streaming task results',
  id: 'queue-server-stream-listener',
  boxes: server.getBoxes(),
  client: process.env.QUEUE_QUEUER_CLIENT,
  streamer: true
})

const serverStreamer = new ServerStreamer({
  description: 'Stream task results to client',
  id: 'queue-server-streamer'
})

const taskInserter = new TaskInserter({
  description: 'Insert task before execution',
  id: 'queue-task-inserter',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const taskPusher = new Queuer({
  description: 'Push task',
  id: 'queue-task-pusher',
  boxes: server.getBoxes(),
  client: process.env.QUEUE_QUEUER_CLIENT,
  pusher: true
})

const taskSelector = new TaskSelector({
  description: 'Select task definition',
  id: 'queue-task-selector',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const taskUpdater = new TaskUpdater({
  description: 'Update task after execution',
  id: 'queue-task-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

const trigger = new Trigger({
  description: 'Trigger runs',
  id: 'queue-trigger',
  schedule: process.env.QUEUE_TRIGGER_SCHEDULE
})

const triggerQueueSelector = new TriggerQueueSelector({
  description: 'Select queues to run',
  id: 'queue-trigger-queue-selector',
  client: process.env.QUEUE_DATABASE_CLIENT,
  stream: true
})

const triggerQueueUpdater = new TriggerQueueUpdater({
  description: 'Update queue next run timestamp',
  id: 'queue-trigger-queue-updater',
  client: process.env.QUEUE_DATABASE_CLIENT
})

server
  .connect(serverRouter)
  .connect('POST /q/p', serverTaskSlicer)
  .connect(serverQueueSelector
    .bypass(serverTaskResolver))
  .connect(taskSelector)

serverRouter
  .connect('GET /q/r', serverStreamListener
    .bypass(serverStreamer))
  .connect(taskUpdater)

trigger
  .connect(triggerQueueSelector)
  .connect(triggerQueueUpdater)
  .connect(runInserter
    .bypass(false))

runInserter
  .connect(itemSelector
    .bypass(taskSelector))
  .connect(runTotalUpdater)
  .connect(itemInserter)
  .connect(taskSelector)

taskSelector
  .connect(taskInserter)
  .connect(taskPusher)
  .connect(taskUpdater)

taskUpdater
  .connect(itemUpdater)
  .connect(runCountUpdater)
  .connect(broadcaster)

broadcaster
  .connect(serverTaskResolver)
  .connect(serverStreamer)
  .connect(serverResponder)

broadcaster
  .connect(nextTaskSlicer
    .bypass(false))
  .connect(taskSelector)

broadcaster
  .connect(nextQueueSelector)
  .connect(runInserter)
