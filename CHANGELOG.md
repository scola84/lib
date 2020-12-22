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
