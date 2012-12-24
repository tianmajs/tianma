/**
 * Tianma - Pipe - Proxy
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var pegasus = require('pegasus'),
	client = require('./client'),
	util = pegasus.util;

var PATTERN_REPLACEMENT = /\$(\d+)/g,

	/**
	 * Assemble href template and value.
	 * @param result {Object}
	 * @return {string}
	 */
	assemble = function (result) {
		return result.tmpl.replace(PATTERN_REPLACEMENT, function (all, index) {
			return result.value[index];
		});
	},

	/**
	 * Match request url.
	 * @param rules {Object}
	 * @param href {string}
	 * @return {Object|null}
	 */
	match = function (rules, href) {
		var keys = Object.keys(rules),
			len = keys.length,
			i = 0,
			re;

		for (; i < len; ++i) {
			re = href.match(rules[keys[i]]);
			if (re) {
				return {
					tmpl: keys[i],
					value: re
				};
			}
		}

		return null;
	},

	/**
	 * Pipe function factory.
	 * @param config {Object}
	 */
	proxy = pegasus.createPipe({
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = config || {};
		},

		/**
		 * Check whether to process current request.
		 * @param request {Object}
		 * @param response {Object}
		 * @return {boolean}
		 */
		fit: function (request, response) {
			var config = this._config,
				passed = response.status() === 404;

			if (passed) {
				this._matchResult = match(config, request.href);
				passed = !!this._matchResult;
			}

			return passed;
		},

		/**
		 * Pipe function entrance.
		 * @param request {Object}
		 * @param response {Object}
		 */
		main: function (request, response) {
			var result = this._matchResult,
				options = {
					href: assemble(result),
					method: request.method,
					headers: util.merge(request.head()), // Keep origin unmodified.
					body: request.body()
				};

			client.send(options, function (err, data) {
				if (err) {
					this.panic(err);
				} else {
					response
						.status(data.status)
						.head(data.head)
						.clear()
						.write(data.body);
					this.next();
				}
			}.bind(this));
		}
	});

module.exports = proxy;
