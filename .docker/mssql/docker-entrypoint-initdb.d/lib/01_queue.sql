USE [scola];
CREATE TABLE [queue] (
  [date_created] DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  [date_updated] DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  [db_name] VARCHAR(255),
  [db_query] TEXT,
  [name] VARCHAR(255) NOT NULL,
  [options] TEXT NOT NULL DEFAULT '{}',
  [parent_id] INTEGER,
  [queue_id] INTEGER NOT NULL IDENTITY(1,1),
  [schedule_begin] DATETIME,
  [schedule_cron] VARCHAR(255),
  [schedule_end] DATETIME,
  [schedule_next] DATETIME,
  CONSTRAINT [pkey_queue] PRIMARY KEY ([queue_id])
);
CREATE TABLE [run] (
  [aggr_err] INTEGER NOT NULL DEFAULT 0,
  [aggr_ok] INTEGER NOT NULL DEFAULT 0,
  [aggr_total] INTEGER NOT NULL DEFAULT 0,
  [date_created] DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  [date_updated] DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  [name] VARCHAR(255),
  [options] TEXT,
  [queue_id] INTEGER NOT NULL,
  [reason] TEXT,
  [run_id] INTEGER NOT NULL IDENTITY(1,1),
  [status] VARCHAR(255) NOT NULL DEFAULT 'pending',
  [task_id] INTEGER,
  CONSTRAINT [pkey_run] PRIMARY KEY ([run_id])
);
CREATE TABLE [task] (
  [date_created] DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  [date_queued] DATETIME,
  [date_started] DATETIME,
  [date_updated] DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  [host] VARCHAR(255),
  [payload] TEXT NOT NULL DEFAULT '{}',
  [reason] TEXT,
  [result] TEXT NOT NULL DEFAULT '{}',
  [run_id] INTEGER NOT NULL,
  [status] VARCHAR(255) NOT NULL DEFAULT 'pending',
  [task_id] INTEGER NOT NULL IDENTITY(1,1),
  CONSTRAINT [pkey_task] PRIMARY KEY ([task_id])
);
CREATE INDEX [index_queue_queue] ON [queue] ([parent_id]);
CREATE INDEX [index_run_queue] ON [run] ([queue_id]);
CREATE INDEX [index_task_run] ON [task] ([run_id]);
ALTER TABLE [queue] ADD CONSTRAINT [fkey_queue_parent_id] FOREIGN KEY ([parent_id]) REFERENCES [queue] ([queue_id]) ON DELETE NO ACTION;
ALTER TABLE [run] ADD CONSTRAINT [fkey_run_queue_id] FOREIGN KEY ([queue_id]) REFERENCES [queue] ([queue_id]) ON DELETE CASCADE;
ALTER TABLE [task] ADD CONSTRAINT [fkey_task_run_id] FOREIGN KEY ([run_id]) REFERENCES [run] ([run_id]) ON DELETE CASCADE;
