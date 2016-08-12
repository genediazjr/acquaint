# acquaint
[![Build Status](https://travis-ci.org/genediazjr/acquaint.svg?branch=master)](https://travis-ci.org/genediazjr/acquaint)
[![Coverage Status](https://coveralls.io/repos/github/genediazjr/acquaint/badge.svg?branch=master)](https://coveralls.io/github/genediazjr/acquaint?branch=master)
[![Code Climate](https://codeclimate.com/github/genediazjr/acquaint/badges/gpa.svg)](https://codeclimate.com/github/genediazjr/acquaint)
[![npm](https://img.shields.io/npm/dt/acquaint.svg?maxAge=2592000)](https://www.npmjs.com/acquaint)
[![npm version](https://badge.fury.io/js/acquaint.svg)](https://www.npmjs.com/acquaint)
[![Dependency Status](https://david-dm.org/genediazjr/acquaint.svg)](https://david-dm.org/genediazjr/acquaint)

Hapi plugin to load `routes`, `handlers`, `methods`, `binds` ([server.bind](http://hapijs.com/api#serverbindcontext)), and `apps` ([server.app](http://hapijs.com/api#serverapp)) through [globs](https://github.com/isaacs/node-glob).
All glob [rules](https://github.com/isaacs/node-glob/blob/master/README.md) apply.

* Supports glob patterns for injecting.
* Supports direct injection through plugin register options.
* Access autoloaded methods on other methods with working `cache` and `bind`.
* Set *default options* such as `cache` and `bind` on loaded `methods` capable for override or merge.

Head to the [API](API.md) documentation.

See it in action in this [TodoMVC demo](https://github.com/genediazjr/hapitodo) for hapi.

## Credits
* [hapi-router](https://github.com/bsiddiqui/hapi-router) - Auto route loading for Hapi
* [hapi-handlers](https://github.com/ar4mirez/hapi-handlers) - Autoload handlers for Hapi
* [hapi-methods-injection](https://github.com/amgohan/hapi-methods-injection) - Scan and register automatically your hapi methods
