## [25.1.1](https://github.com/scola84/lib/compare/v25.1.0...v25.1.1) (2021-08-14)


### Bug Fixes

* trigger release ([d51d3ef](https://github.com/scola84/lib/commit/d51d3ef955add9355658d285bc7ca161355e709c))

# [25.1.0](https://github.com/scola84/lib/compare/v25.0.0...v25.1.0) (2021-08-14)


### Bug Fixes

* **bin:** convert bigint/serial to strings again ([ad78e3c](https://github.com/scola84/lib/commit/ad78e3c03eb35979a2cf513608312655015e27fc))


### Features

* **docker:** add yarn flag to ignore optional dependencies ([c31b4f2](https://github.com/scola84/lib/commit/c31b4f2e9237881bb1eae82f4fd14da7d7a7783a))

# [25.0.0](https://github.com/scola84/lib/compare/v24.0.0...v25.0.0) (2021-08-07)


### Bug Fixes

* **client:** make child elements non-optional ([a3479d6](https://github.com/scola84/lib/commit/a3479d69f2f5abc7b36ade80ddb25ad0103771cb))


### Features

* **client:** improve elements ([8dfff54](https://github.com/scola84/lib/commit/8dfff54a8025d7e0ccf8c546127c136654e0b73f))


### BREAKING CHANGES

* **client:** Quite some interfaces have changed.

# [24.0.0](https://github.com/scola84/lib/compare/v23.0.0...v24.0.0) (2021-08-03)


### Bug Fixes

* **client:** use click method instead of custom event ([91e23cb](https://github.com/scola84/lib/commit/91e23cb10c3d3da141c80fce7902115e92cc5ef2))


### Features

* **client:** add interval to event ([6332482](https://github.com/scola84/lib/commit/63324829d4910239a3748e044c190c71915bb20f))
* **client:** implement svg ([6169270](https://github.com/scola84/lib/commit/61692701fe82fa454196790a166313d4cab964d6))
* **client:** improve elements ([7450ce5](https://github.com/scola84/lib/commit/7450ce5b0e2b77aa91d76e1442572de9ab62b267))


### BREAKING CHANGES

* **client:** Most interfaces have changed.

# [23.0.0](https://github.com/scola84/lib/compare/v22.0.8...v23.0.0) (2021-07-22)


### Bug Fixes

* **client:** add scola namespace as prefix to updaters ([83125fa](https://github.com/scola84/lib/commit/83125fa18fbb5416de4c77aa91547b7f5cca9542))
* **client:** make type guards non-static ([20dfca1](https://github.com/scola84/lib/commit/20dfca1a10057cdd5926b5ecf7c438be97e86a89))
* **stream:** improve pipeline ([af6d704](https://github.com/scola84/lib/commit/af6d704c9e9eb349c9deee591e99f3c9231a0679))


### Features

* **fastify:** add database and store to RouteHandler ([d851739](https://github.com/scola84/lib/commit/d851739b953907cac8cb81f7a9ebd3a0a875e0ce))
* **fastify:** add type guards to Server ([672d168](https://github.com/scola84/lib/commit/672d1682dbe94a76e0d1ab0bd088f65f44e044c1))
* **queue:** implement queue stop ([d6dbb6b](https://github.com/scola84/lib/commit/d6dbb6b7b6b465f68df186785e8a3062e45f4a35))
* **queue:** implement single payloads for queue runs ([8c6fac5](https://github.com/scola84/lib/commit/8c6fac5e90d3be9b4a429446e1b05a03e9881748))
* improve client elements ([73f31fc](https://github.com/scola84/lib/commit/73f31fc60e7347a0cd6b01ab343004bf35c53df3))


### BREAKING CHANGES

* **queue:** The channel to run a queue has changed.
* Elements have different properties and behaviour.

## [22.0.8](https://github.com/scola84/lib/compare/v22.0.7...v22.0.8) (2021-07-02)


### Bug Fixes

* **stream:** allow external listeners to be called after destroy ([42b2edc](https://github.com/scola84/lib/commit/42b2edc95680744e55d15342179644ae4a4ec53e))

## [22.0.7](https://github.com/scola84/lib/compare/v22.0.6...v22.0.7) (2021-06-30)


### Bug Fixes

* **deps:** move and update dependencies ([3a769e2](https://github.com/scola84/lib/commit/3a769e2c03d839b8e5f614024f5c7f3a23151529))

## [22.0.6](https://github.com/scola84/lib/compare/v22.0.5...v22.0.6) (2021-06-30)


### Bug Fixes

* **service:** make start/stop database/delegates sequential ([d13246c](https://github.com/scola84/lib/commit/d13246c857139fac3dda6631e8b2e7f143050665))

## [22.0.5](https://github.com/scola84/lib/compare/v22.0.4...v22.0.5) (2021-06-30)


### Bug Fixes

* **deps:** revert dependency due to bug ([9e59747](https://github.com/scola84/lib/commit/9e5974751b5430bbb8490693e01bdc05464e62cc))

## [22.0.4](https://github.com/scola84/lib/compare/v22.0.3...v22.0.4) (2021-06-30)


### Bug Fixes

* **sql:** escape table names too in de/populate ([43e890c](https://github.com/scola84/lib/commit/43e890c73154d72e63cd003154b975bdefc90903))

## [22.0.3](https://github.com/scola84/lib/compare/v22.0.2...v22.0.3) (2021-06-29)


### Bug Fixes

* enforce stricter newline rules ([633b848](https://github.com/scola84/lib/commit/633b848a6f0b29b0ea8f11dd74788d735d67a439))

## [22.0.2](https://github.com/scola84/lib/compare/v22.0.1...v22.0.2) (2021-06-28)


### Bug Fixes

* **service:** add context to errors ([1c399ad](https://github.com/scola84/lib/commit/1c399adab0d0f8cc48e2625a51b98b82b00b7c90))

## [22.0.1](https://github.com/scola84/lib/compare/v22.0.0...v22.0.1) (2021-06-28)


### Bug Fixes

* **sql:** escape column names in de/populate ([9093a6e](https://github.com/scola84/lib/commit/9093a6ea2670e606700cd7d6a11f428b9f2506d4))

# [22.0.0](https://github.com/scola84/lib/compare/v21.0.2...v22.0.0) (2021-06-28)


### Features

* **service:** let service manager manage (start/stop) database too ([2b90cd7](https://github.com/scola84/lib/commit/2b90cd7fa69c6421b635b1139b3803ed54d0ae36))


### BREAKING CHANGES

* **service:** Serivce Manager no longer returns Promises from start/stop.

## [21.0.2](https://github.com/scola84/lib/compare/v21.0.1...v21.0.2) (2021-06-26)


### Bug Fixes

* **bin:** prevent error if no command is given ([7b04877](https://github.com/scola84/lib/commit/7b048777e0fab50c49bdefead2732f0d89807257))

## [21.0.1](https://github.com/scola84/lib/compare/v21.0.0...v21.0.1) (2021-06-26)


### Bug Fixes

* **sql:** prevent errors when running populate multiple times ([f99018f](https://github.com/scola84/lib/commit/f99018f274bc0a5a89c30a95e9a89ade6c9bf266))
* **sql:** set password correctly in PostgresqlDatabase ([599b9a0](https://github.com/scola84/lib/commit/599b9a04206a3f2896bba2f77c5d97e04dee6740))

# [21.0.0](https://github.com/scola84/lib/compare/v20.0.0...v21.0.0) (2021-06-26)


### Bug Fixes

* **sql:** catch de/populate errors ([ea57eb9](https://github.com/scola84/lib/commit/ea57eb9dc92e770809fa70360b891ebada684f93))


### Features

* **sql:** improve database constructors, with consistent async start/stop ([0d3e691](https://github.com/scola84/lib/commit/0d3e691dedbfac98f9099a36b031279cbdbbd456))


### BREAKING CHANGES

* **sql:** The signature of the database has changed.

# [20.0.0](https://github.com/scola84/lib/compare/v19.0.0...v20.0.0) (2021-06-25)


### Features

* **queue:** improve factory methods for queue entities ([f3d6839](https://github.com/scola84/lib/commit/f3d683926c6a99fbfc8c91406f519068bc03b495))
* **queue:** return the pipeline ([8d997fd](https://github.com/scola84/lib/commit/8d997fdfa252844ff568fb3f4c2e6feba792c724))


### BREAKING CHANGES

* **queue:** factory methods require a partial entity as argument.

# [19.0.0](https://github.com/scola84/lib/compare/v18.3.1...v19.0.0) (2021-06-24)


### Features

* remove data from mysql and postgres (in .docker and bin) ([b1b2542](https://github.com/scola84/lib/commit/b1b2542b9e8d4dec1c5fc690b36af32c9b325ab4))
* **client:** use new lit package ([e38ec40](https://github.com/scola84/lib/commit/e38ec408dadd6451fb925727f5a5dab7f4e0770e))
* **fastify:** move plugins to object ([971dc53](https://github.com/scola84/lib/commit/971dc53e0a60b04407d2f268d088e4020d171bd3))
* **queue:** remove task and item ([79c7e0c](https://github.com/scola84/lib/commit/79c7e0ca94d796c59e3fa4d4ace31cd009c9428b))
* **redis:** remove ZScanner ([6f82021](https://github.com/scola84/lib/commit/6f820219805d0af98713d7b8c14b0aaa9b66231a))
* **sql:** remove tokens ([73d84d7](https://github.com/scola84/lib/commit/73d84d78ff8999240b3ed1912dadff971229d794))


### BREAKING CHANGES

* Data is loaded from a different entrypoint and
bin subcommands nog longer exist.
* **redis:** The ZScanner no longer exists.
* **fastify:** The plugins are grouped to one property.
* **sql:** The databases and connections no longer have
dialect-specific tokens.
* **client:** Symbols of lit are no longer exported.
* **queue:** Queues no longer use tasks and items.

## [18.3.1](https://github.com/scola84/lib/compare/v18.3.0...v18.3.1) (2021-06-14)


### Bug Fixes

* **sql:** move INSERT/DELETE directly into populate/depopulate methods ([cb7d47b](https://github.com/scola84/lib/commit/cb7d47b228aa18c4cbc9e6fc8ec131420ee2b1d0))

# [18.3.0](https://github.com/scola84/lib/compare/v18.2.0...v18.3.0) (2021-06-14)


### Features

* **queue:** make arguments of factory functions optional ([df4d266](https://github.com/scola84/lib/commit/df4d26618a8677f67dd342f9bf6df120ec69f11b))

# [18.2.0](https://github.com/scola84/lib/compare/v18.1.1...v18.2.0) (2021-06-12)


### Features

* **bin:** export Entities as interface in sql-ts ([c3328d9](https://github.com/scola84/lib/commit/c3328d98fb21d08eb3141ba573e90bc000801ef4))
* **sql:** add de/populate method to database/connection ([9234832](https://github.com/scola84/lib/commit/923483214b2ee7f9ee694e87b1f77adef55f64a7))

## [18.1.1](https://github.com/scola84/lib/compare/v18.1.0...v18.1.1) (2021-06-03)


### Bug Fixes

* **tsconfig:** restore rootDir reference in src ([596934e](https://github.com/scola84/lib/commit/596934e6a438c7c0fbb4638ba99d922b0ed0f9ba))

# [18.1.0](https://github.com/scola84/lib/compare/v18.0.3...v18.1.0) (2021-06-03)


### Bug Fixes

* **queue:** provide the previous queue run id in an object ([4e538c9](https://github.com/scola84/lib/commit/4e538c9e50d7e44b315710fc18580e7a80848757))


### Features

* **sql:** implement a class to format simple CRUD queries ([1a532b5](https://github.com/scola84/lib/commit/1a532b5630b20dd57875994c15fd41d243edd586))

## [18.0.3](https://github.com/scola84/lib/compare/v18.0.2...v18.0.3) (2021-05-26)


### Bug Fixes

* **deps:** update dependencies ([ce83ee5](https://github.com/scola84/lib/commit/ce83ee59f3422cd9637998c5400c067c0e4b9a18))

## [18.0.2](https://github.com/scola84/lib/compare/v18.0.1...v18.0.2) (2021-05-25)


### Bug Fixes

* **deps:** update dependencies ([dc5fb8f](https://github.com/scola84/lib/commit/dc5fb8fd07c54c1693444c26711eea7e96d11c73))

## [18.0.1](https://github.com/scola84/lib/compare/v18.0.0...v18.0.1) (2021-05-11)


### Bug Fixes

* **queue:** allow next task run to be undefined ([8fcbd2c](https://github.com/scola84/lib/commit/8fcbd2caaf581c54734296038239f2399787fde7))

# [18.0.0](https://github.com/scola84/lib/compare/v17.0.0...v18.0.0) (2021-05-11)


### Bug Fixes

* **bin:** set defaults in sql-ts ([d9fc5fd](https://github.com/scola84/lib/commit/d9fc5fd71a9349c6eb1a79975f6cafefab36bd88))
* **queue:** change validate method from public to private ([5ba081b](https://github.com/scola84/lib/commit/5ba081b317e272fb1f33b5e7a8a9ded3ae6ec70f))


### BREAKING CHANGES

* **queue:** The validate method is removed from the public API.

# [17.0.0](https://github.com/scola84/lib/compare/v16.1.0...v17.0.0) (2021-05-10)


### Features

* **sql:** add insertAll and selectAll methods ([29ac375](https://github.com/scola84/lib/commit/29ac3750fcfd16c9bac3a08eff1cdb0a93083a88))


### BREAKING CHANGES

* **sql:** The insert and select methods apply to single objects,
insertAll and selectAll apply to multiple objects.

# [16.1.0](https://github.com/scola84/lib/compare/v16.0.0...v16.1.0) (2021-05-08)


### Features

* **sql:** data format to database ([2fdc3a3](https://github.com/scola84/lib/commit/2fdc3a33d1996933e765260c8f0827a2c0edee7b))

# [16.0.0](https://github.com/scola84/lib/compare/v15.6.6...v16.0.0) (2021-05-08)


### Bug Fixes

* decode username and password everywhere ([108c6d0](https://github.com/scola84/lib/commit/108c6d05dc9f300b6b5f419687f0cd87f8f5e37d))
* remove less than smart sql connection property ([81446eb](https://github.com/scola84/lib/commit/81446ebeddf1c841074c0f13ea4d67986503c733))


### BREAKING CHANGES

* The SqlTaskRun and SqlRequest have been removed.

## [15.6.6](https://github.com/scola84/lib/compare/v15.6.5...v15.6.6) (2021-05-07)


### Bug Fixes

* **sql:** properly parse DSN ([52a9f80](https://github.com/scola84/lib/commit/52a9f802e1ee5eb8e35fa59a2b27c1bb79a9049f))

## [15.6.5](https://github.com/scola84/lib/compare/v15.6.4...v15.6.5) (2021-05-07)


### Bug Fixes

* **queue:** only update schedule_next if schedule_next was null ([1bddbd8](https://github.com/scola84/lib/commit/1bddbd82d57aba1402ccb9a4bad5a9690ed6acce))

## [15.6.4](https://github.com/scola84/lib/compare/v15.6.3...v15.6.4) (2021-05-06)


### Bug Fixes

* **bin:** improve output of sql-data ([7e0f342](https://github.com/scola84/lib/commit/7e0f342beb22d8e4e619aa6115d752493e9cb8a9))

## [15.6.3](https://github.com/scola84/lib/compare/v15.6.2...v15.6.3) (2021-05-06)


### Bug Fixes

* **docker:** add extra hosts to node service ([5a1f6bb](https://github.com/scola84/lib/commit/5a1f6bba4062829bcbdf56731a2fc46a35a3625e))

## [15.6.2](https://github.com/scola84/lib/compare/v15.6.1...v15.6.2) (2021-05-04)


### Bug Fixes

* **queue:** check if schema exists before validating options/payload ([e5fa4d3](https://github.com/scola84/lib/commit/e5fa4d376ff6afd8eef58f8bb77e63d32e782c41))

## [15.6.1](https://github.com/scola84/lib/compare/v15.6.0...v15.6.1) (2021-05-04)


### Bug Fixes

* **sql:** format and parse more data types correctly ([638ef97](https://github.com/scola84/lib/commit/638ef97f2defc6b21ffe25b8958cc1ac5a9aa216))

# [15.6.0](https://github.com/scola84/lib/compare/v15.5.2...v15.6.0) (2021-05-03)


### Features

* **sql:** add mssql ([1615148](https://github.com/scola84/lib/commit/1615148dc1d9d218dbb924589fa68753fd424cd7))

## [15.5.2](https://github.com/scola84/lib/compare/v15.5.1...v15.5.2) (2021-05-03)


### Bug Fixes

* **docker:** move files inside containers ([ae44539](https://github.com/scola84/lib/commit/ae445395b7e237ae82306f68008ecb44494fb2ff))

## [15.5.1](https://github.com/scola84/lib/compare/v15.5.0...v15.5.1) (2021-05-03)


### Bug Fixes

* **docker:** move nginx files to an existing location ([a785abb](https://github.com/scola84/lib/commit/a785abb2935c2bc14b5a76be82fa02eae3a6db93))

# [15.5.0](https://github.com/scola84/lib/compare/v15.4.2...v15.5.0) (2021-05-03)


### Features

* **queue:** make validate data optional ([2921a13](https://github.com/scola84/lib/commit/2921a1366dd99ee037f2312ed544af496318cdc8))

## [15.4.2](https://github.com/scola84/lib/compare/v15.4.1...v15.4.2) (2021-05-01)


### Bug Fixes

* **test:** add network to docker-compose files ([279e6e1](https://github.com/scola84/lib/commit/279e6e1b868801dff0bb5d833c6eaf4904a65223))
* **test:** docker-compose command in github workflow ([172f58d](https://github.com/scola84/lib/commit/172f58dd4bdae0c149956d2b6cb22f0e87613675))
* **test:** flush redis afterAll ([00480c8](https://github.com/scola84/lib/commit/00480c85ff31dae0a3e69504d673cc170b211d2f))
* **test:** move start containers to workflow ([ba23436](https://github.com/scola84/lib/commit/ba23436c25bf3306f9492cc3f98c92d585558133))
* **test:** set service name as hostname ([3611054](https://github.com/scola84/lib/commit/36110541d495d922f1c89225acafff4d96f77654))

## [15.4.1](https://github.com/scola84/lib/compare/v15.4.0...v15.4.1) (2021-05-01)


### Bug Fixes

* **deps:** update dependencies ([ec12e2b](https://github.com/scola84/lib/commit/ec12e2b2cbbe8a89b0fdec5e047c9275e1068727))

# [15.4.0](https://github.com/scola84/lib/compare/v15.3.1...v15.4.0) (2021-04-30)


### Features

* add docker files and restructure package accordingly ([1c442c1](https://github.com/scola84/lib/commit/1c442c17fc45a23f3798aab0a27db5804c6c743d))

## [15.3.1](https://github.com/scola84/lib/compare/v15.3.0...v15.3.1) (2021-04-29)


### Bug Fixes

* **fastify:** make property optional again ([582ebc1](https://github.com/scola84/lib/commit/582ebc1e03d53c77fc13eb41eb4b3c97c913f970))
* **fastify:** undefined property accessor ([7e96bed](https://github.com/scola84/lib/commit/7e96bedec251f80cec781e67f279cd1b3f05b9e0))

# [15.3.0](https://github.com/scola84/lib/compare/v15.2.0...v15.3.0) (2021-04-29)


### Bug Fixes

* add sql property to task runner and route handler ([7b39e8a](https://github.com/scola84/lib/commit/7b39e8a10bab6bd34c61c305111e2f3358680f2b))
* **cli:** add database create statement to schema dumps ([44bb41f](https://github.com/scola84/lib/commit/44bb41fd21a19615dbffeaca5d77bbf848a4259f))
* **cli:** make bigint a number in sql-ts ([9d3dc11](https://github.com/scola84/lib/commit/9d3dc116e716d2badbd91f2a50f826e459baba42))
* **queue:** add missing ConnectedTaskRun interface ([8805f24](https://github.com/scola84/lib/commit/8805f24fb0eef336c2a3172a41393ab25ee67ab6))
* **sql:** parameter transform of null and Array ([070716f](https://github.com/scola84/lib/commit/070716f51996666e7c7a94a7f0e41359719a0a8a))
* **sql:** support big numbers ([cc5debd](https://github.com/scola84/lib/commit/cc5debdbd6443086aab0930dfe244082c21fd201))
* **sql:** transform Buffer parameter correctly ([743af52](https://github.com/scola84/lib/commit/743af528a98ee1f9893ff18f50a6e471311c6abc))


### Features

* add database end, implement tests with DockerComposeEnvironment ([e939e38](https://github.com/scola84/lib/commit/e939e38b8dbedea85df39d02b3b0d01ce8eebfb7))

# [15.2.0](https://github.com/scola84/lib/compare/v15.1.0...v15.2.0) (2021-04-26)


### Features

* improve sql connection management ([28af86a](https://github.com/scola84/lib/commit/28af86a563b11cf7be4467718dce94f6380ce108))

# [15.1.0](https://github.com/scola84/lib/compare/v15.0.1...v15.1.0) (2021-04-23)


### Bug Fixes

* let connections handle JSON serialization ([d4383b1](https://github.com/scola84/lib/commit/d4383b11d1800bee91817ac7ce3cc393e9801e5d))


### Features

* **sql:** add template tag function for syntax highlighting ([d0b5180](https://github.com/scola84/lib/commit/d0b518038b1b2de0fcb718d6758be39dde57d13c))

## [15.0.1](https://github.com/scola84/lib/compare/v15.0.0...v15.0.1) (2021-04-22)


### Bug Fixes

* **service:** manager should listen to stop signal only once ([ba277c8](https://github.com/scola84/lib/commit/ba277c898825ed6d1765b24c9bc96750a54f2073))
* **stream:** error message format ([03e7d70](https://github.com/scola84/lib/commit/03e7d703eaedab676bf942e8e07a31b6f921d9c7))

# [15.0.0](https://github.com/scola84/lib/compare/v14.0.0...v15.0.0) (2021-04-21)


### Bug Fixes

* **test:** wrong expectation of error message ([799f9ab](https://github.com/scola84/lib/commit/799f9ab71945f24cf9eca5cf4d1b55051563bf55))


### Code Refactoring

* enforce stricter ESLint rules ([4695c1e](https://github.com/scola84/lib/commit/4695c1e7effaa07bd09cfa89a87931b81e286963))


### BREAKING CHANGES

* Some property names have changed.

# [14.0.0](https://github.com/scola84/lib/compare/v13.0.0...v14.0.0) (2021-04-08)


### Bug Fixes

* **cli:** pass password to pg_dump through env var ([000dd13](https://github.com/scola84/lib/commit/000dd13248b1b798ae1f9092f8b0ff9436838b23))


### Features

* **queue:** ensure next queue is triggered only once ([8708ba5](https://github.com/scola84/lib/commit/8708ba55a8aee7282b7d94e0728a544d82f5c879))


### BREAKING CHANGES

* **queue:** The queue_run table now contains a
reference to the last item which updated the aggr/date
of the queue_run.

# [13.0.0](https://github.com/scola84/lib/compare/v12.0.0...v13.0.0) (2021-04-07)


### Bug Fixes

* **sql:** make connection release sync again ([27b238f](https://github.com/scola84/lib/commit/27b238fc901ff3260ae1a06b660a94b0af2dee44))


### BREAKING CHANGES

* **sql:** Connection release method is now sync.

# [12.0.0](https://github.com/scola84/lib/compare/v11.2.1...v12.0.0) (2021-04-06)


### Features

* **sql:** make connection release async ([99393f0](https://github.com/scola84/lib/commit/99393f02eeb6162faec8424d7216c5e90798933a))


### BREAKING CHANGES

* **sql:** The release method now returns a Promise.

## [11.2.1](https://github.com/scola84/lib/compare/v11.2.0...v11.2.1) (2021-04-06)


### Bug Fixes

* **deps:** update dependencies ([08eb3ab](https://github.com/scola84/lib/commit/08eb3ab5880c09fade14695c5e58fbc84ed05018))

# [11.2.0](https://github.com/scola84/lib/compare/v11.1.0...v11.2.0) (2021-04-06)


### Features

* **cli:** add command to reload a Docker service ([0398d8e](https://github.com/scola84/lib/commit/0398d8ea7057a3e55affca442e792d723821b823))

# [11.1.0](https://github.com/scola84/lib/compare/v11.0.6...v11.1.0) (2021-04-06)


### Features

* **cli:** add database commands to CLI ([be1386e](https://github.com/scola84/lib/commit/be1386e522539fc29b4b2676bc9677ac073978db))
* **cli:** implement as commander ([ccf17a7](https://github.com/scola84/lib/commit/ccf17a7a10e71f6633e0a7cda5e03db464932ea0))

## [11.0.6](https://github.com/scola84/lib/compare/v11.0.5...v11.0.6) (2021-03-29)


### Bug Fixes

* **cli:** sort entity properties in sql-ts ([649fd1d](https://github.com/scola84/lib/commit/649fd1d99e8b8901bb49ebbd102b94d117718fa7))

## [11.0.5](https://github.com/scola84/lib/compare/v11.0.4...v11.0.5) (2021-03-29)


### Bug Fixes

* **cli:** reference to cli in package.json ([bf5a286](https://github.com/scola84/lib/commit/bf5a286d4c7df952e5d16c9183f943f4b83f9f1d))

## [11.0.4](https://github.com/scola84/lib/compare/v11.0.3...v11.0.4) (2021-03-29)


### Bug Fixes

* **deps:** update dependencies ([880d6ac](https://github.com/scola84/lib/commit/880d6ace5ff04ded5f56d6b998a4fef9087acf13))

## [11.0.3](https://github.com/scola84/lib/compare/v11.0.2...v11.0.3) (2021-03-29)


### Bug Fixes

* **cli:** move .bin to bin ([ef4ed3d](https://github.com/scola84/lib/commit/ef4ed3d0d7ac14e0a3cbc00fa978aa14dc1e1e17))

## [11.0.2](https://github.com/scola84/lib/compare/v11.0.1...v11.0.2) (2021-03-27)


### Bug Fixes

* **deps:** add missing dependency ([08424af](https://github.com/scola84/lib/commit/08424af14de21e778e09d7083002dda2f624dafa))

## [11.0.1](https://github.com/scola84/lib/compare/v11.0.0...v11.0.1) (2021-03-27)


### Bug Fixes

* **deps:** update dependencies ([1b81047](https://github.com/scola84/lib/commit/1b8104788c65b9260a8aca4d6216028edc55a781))

# [11.0.0](https://github.com/scola84/lib/compare/v10.0.0...v11.0.0) (2021-03-26)


### Features

* **queue:** remove name, number and options from TaskRun ([4eea9c1](https://github.com/scola84/lib/commit/4eea9c117757768337c79dff66e1472053c3bd96))


### BREAKING CHANGES

* **queue:** TaskRun no longer has an options object,
it is available on Task, which no is set on TaskRun (as "task").

# [10.0.0](https://github.com/scola84/lib/compare/v9.0.0...v10.0.0) (2021-03-24)


### Features

* implement tests and redesign several components accordingly ([960c075](https://github.com/scola84/lib/commit/960c075ef64f7def07f0cfff7d2c91b49ca45ae7))


### BREAKING CHANGES

* Many improvements.

# [9.0.0](https://github.com/scola84/lib/compare/v8.0.0...v9.0.0) (2021-03-12)


### Features

* implement TaskRunner and RouteHandler as base classes ([c0e7c37](https://github.com/scola84/lib/commit/c0e7c37bd0108734e99ac87c90fc51c655d060c6))


### BREAKING CHANGES

* The architecture has changed completely.
TaskRunners can be used standalone now and RouteHandlers
can be used to implement routes on a Fastify server.
The ServiceManager starts and stops services.

# [8.0.0](https://github.com/scola84/lib/compare/v7.1.1...v8.0.0) (2021-03-01)


### Bug Fixes

* type database ids as number too ([b2b0c16](https://github.com/scola84/lib/commit/b2b0c16acd8cbf3c5e386a406055b33f3c9ec880))
* **sql:** default Database constructor options ([949eb8b](https://github.com/scola84/lib/commit/949eb8b8959fe951d1ccc0eb02ebe78a0ed2b9b6))


### Features

* **queue:** move task options to task table ([9951018](https://github.com/scola84/lib/commit/9951018cf1fa51ce63e3db19df23c7af9abc5d48))


### BREAKING CHANGES

* **queue:** Task options no longer have their own table,
but instead can be defined in a column in the task table.

## [7.1.1](https://github.com/scola84/lib/compare/v7.1.0...v7.1.1) (2021-02-08)


### Bug Fixes

* **sql:** add missing default value ([eb15193](https://github.com/scola84/lib/commit/eb15193546ef9e4a841387d90f41f941a44a177a))
* **stream:** add data listener to always trigger stream ([dd370a3](https://github.com/scola84/lib/commit/dd370a364b23454367892325c747a1b6a9c42cb8))

# [7.1.0](https://github.com/scola84/lib/compare/v7.0.1...v7.1.0) (2021-01-19)


### Features

* **intl:** add static format function ([fcc82bb](https://github.com/scola84/lib/commit/fcc82bbdda8655c737b98e9a1644f237d014e34c))

## [7.0.1](https://github.com/scola84/lib/compare/v7.0.0...v7.0.1) (2021-01-12)


### Bug Fixes

* **sql:** pase DSN as connectionString in PostgreSQL ([0ce5dc5](https://github.com/scola84/lib/commit/0ce5dc5b10a839a44713269149c8d47da109801d))

# [7.0.0](https://github.com/scola84/lib/compare/v6.1.0...v7.0.0) (2021-01-12)


### Bug Fixes

* **queue:** order task runs to determine next task run ([9ccdde7](https://github.com/scola84/lib/commit/9ccdde747bbd70292aa7cda4a37c16a4012e68eb))


### Features

* **queue:** save task run consumer ([6805d65](https://github.com/scola84/lib/commit/6805d65a4e3e4a6c3411f409f723efd2fb194a2e))
* **sql:** add DSN parser for PostgreSQL ([2a17a15](https://github.com/scola84/lib/commit/2a17a1596edf16f09e53ac46a37710710ede7249))


### BREAKING CHANGES

* **sql:** Use uppercase letter for the acronym "DSN".

# [6.1.0](https://github.com/scola84/lib/compare/v6.0.0...v6.1.0) (2021-01-09)


### Bug Fixes

* **queue:** allow schedule next to be null ([6df5008](https://github.com/scola84/lib/commit/6df5008130e1875fb1ae64abef4d0b3349f8cba7))


### Features

* **queue:** distinguish queued and started date in task runner ([995c8d2](https://github.com/scola84/lib/commit/995c8d288781676e06b07b5e8d6aa2d9d4a272bc))

# [6.0.0](https://github.com/scola84/lib/compare/v5.0.1...v6.0.0) (2021-01-07)


### Features

* **queue:** catch and store queue runner errors ([8a14bdd](https://github.com/scola84/lib/commit/8a14bdd2412f22701f46b9ebfa92ba4b48854b29))


### BREAKING CHANGES

* **queue:** The queue_run table now contains a code and reason column.

## [5.0.1](https://github.com/scola84/lib/compare/v5.0.0...v5.0.1) (2021-01-06)


### Bug Fixes

* **deps:** add missing redis dependency ([cc33e00](https://github.com/scola84/lib/commit/cc33e008c3ea932ad5b5715c666a2d3049e7b5f8))

# [5.0.0](https://github.com/scola84/lib/compare/v4.1.1...v5.0.0) (2021-01-06)


### Features

* rewrite database and queue management ([8451e15](https://github.com/scola84/lib/commit/8451e1507474242a9f704ec0e51004b80105351f))


### BREAKING CHANGES

* Use a self-written database wrapper for consistent
connection management. Improve queue management by batching write
operations and many other small changes.

## [4.1.1](https://github.com/scola84/lib/compare/v4.1.0...v4.1.1) (2020-12-23)


### Bug Fixes

* **base:** close client of zscanner ([00d1119](https://github.com/scola84/lib/commit/00d1119831c81aba6ad0ae049e464b5c3c1c8eab))

# [4.1.0](https://github.com/scola84/lib/compare/v4.0.1...v4.1.0) (2020-12-23)


### Bug Fixes

* **queue:** correctly select task options ([4bbed74](https://github.com/scola84/lib/commit/4bbed7432d53cd9df259a6ef3c795743486dd9bd))


### Features

* **queue:** allow task options to be typed ([31ff8f1](https://github.com/scola84/lib/commit/31ff8f10c9e1a19c64fd35679db824a967443c37))

## [4.0.1](https://github.com/scola84/lib/compare/v4.0.0...v4.0.1) (2020-12-22)


### Bug Fixes

* **queue:** close the queue client only on finish event of QueueRunner ([f82a5e2](https://github.com/scola84/lib/commit/f82a5e29560481536998aed50b308603d56f29a8))

# [4.0.0](https://github.com/scola84/lib/compare/v3.0.1...v4.0.0) (2020-12-21)


### Bug Fixes

* **queue:** quit redis in queue runner ([c922197](https://github.com/scola84/lib/commit/c922197269b2c1802eb7d16a1382207911345c67))


### Code Refactoring

* **queue:** rename listenerClient to queueClient ([11a82c9](https://github.com/scola84/lib/commit/11a82c9fc2f7427521699aa05dd0ff30d99e773f))


### Performance Improvements

* **queue:** decrease blocking timeout ([b333043](https://github.com/scola84/lib/commit/b3330431b2475b5c6bca363568099eff1d47833c))
* use pg-promise ([7bc1dca](https://github.com/scola84/lib/commit/7bc1dcabd04b62845a3e07e821ecc440d4f45def))


### BREAKING CHANGES

* **queue:** The interface of QueueManager has changed.
* The queue classes have changed.

## [3.0.1](https://github.com/scola84/lib/compare/v3.0.0...v3.0.1) (2020-12-19)


### Bug Fixes

* **base:** cast the type of the zscan cursor correctly ([9c3ecb3](https://github.com/scola84/lib/commit/9c3ecb3a49054f98cc6327e41ed1a35b918181cd))

# [3.0.0](https://github.com/scola84/lib/compare/v2.2.3...v3.0.0) (2020-12-18)


### Bug Fixes

* **queue:** handle stream end/error properly ([0f08e40](https://github.com/scola84/lib/commit/0f08e40da68588b5b0c6bd1b69a80fa14bace964))


### Performance Improvements

* replace ioredis with redis ([6ac7712](https://github.com/scola84/lib/commit/6ac7712c3683afbabab2b6b1754ecb613cfa0c36))


### BREAKING CHANGES

* The interfaces of the classes using redis have changed.

## [2.2.3](https://github.com/scola84/lib/compare/v2.2.2...v2.2.3) (2020-12-15)


### Bug Fixes

* **queue:** select queues which have a schedule equal to now ([b61ee40](https://github.com/scola84/lib/commit/b61ee402e4e17be296e290d087968c7c238765fb))
* **queue:** use loop to infinitely read a task stream ([9fcb0f2](https://github.com/scola84/lib/commit/9fcb0f21e2699d2130bfe323843ae0fc81d6070f))

## [2.2.2](https://github.com/scola84/lib/compare/v2.2.1...v2.2.2) (2020-12-14)


### Bug Fixes

* **queue:** increase default blocking group read timeout ([b28462c](https://github.com/scola84/lib/commit/b28462c4c744b3b641a0676feb9e461bc398ed17))

## [2.2.1](https://github.com/scola84/lib/compare/v2.2.0...v2.2.1) (2020-12-09)


### Bug Fixes

* **npm:** update dependencies ([e9a006f](https://github.com/scola84/lib/commit/e9a006f3fc0f80579a5c5b3fced18e09dab9597a))
* **queue:** release queryrunner explicitly ([59d0ce4](https://github.com/scola84/lib/commit/59d0ce401fe3c96bf0507a76f0125ffdb98fdd13))

# [2.2.0](https://github.com/scola84/lib/compare/v2.1.1...v2.2.0) (2020-12-02)


### Features

* **queue:** add option to run queues immediately at start ([672ea95](https://github.com/scola84/lib/commit/672ea9524bc81fb373e4c3ea7a8599acddb76c94))

## [2.1.1](https://github.com/scola84/lib/compare/v2.1.0...v2.1.1) (2020-11-29)


### Bug Fixes

* **queue:** change condition for queues in manager listener ([c2bd0ed](https://github.com/scola84/lib/commit/c2bd0ed414e53fb3199d595cd8749021be67e55a))

# [2.1.0](https://github.com/scola84/lib/compare/v2.0.0...v2.1.0) (2020-11-26)


### Features

* **queue:** make queue manager find queues by name ([62b38d8](https://github.com/scola84/lib/commit/62b38d892a08e2c5e8729f01c4aa21d5218b3281))

# [2.0.0](https://github.com/scola84/lib/compare/v1.0.0...v2.0.0) (2020-11-25)


### Build System

* **npm:** bump version to trigger new release ([3c1b8dd](https://github.com/scola84/lib/commit/3c1b8ddffec1c2d3ef630b5f99d8ee198c32e4d7))


### BREAKING CHANGES

* **npm:** Bumping in the previous commit did not work.

# 1.0.0 (2020-11-25)


### Features

* implement first set of elements and entities ([85ada1b](https://github.com/scola84/lib/commit/85ada1bc0492122aaf1464aa08728033d4fc8644))
