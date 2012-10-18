/**
 * Tianma - Pipe - Proxy
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var tianma = require('tianma'),
	transfer = require('./transfer'),
	util = tianma.util;

var STATUS_BLACK_LIST = {
		'204': true,
		'404': true
	},

	PATTERN_REPLACEMENT = /\$(\d+)/g,

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
	proxy = tianma.createPipe({
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = config;
		},

		/**
		 * Check whether to process current request.
		 * @param request {Object}
		 * @param response {Object}
		 * @return {boolean}
		 */
		fit: function (request, response) {
			var config = this._config,
				passed = STATUS_BLACK_LIST[response.status()];

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
			var result = this._matchResult;

			transfer(request, assemble(result), function (err, result) {
				if (err) {
					this.panic(err);
				} else {
					response
						.status(result.status)
						.head(result.headers)
						.clear()
						.write(result.body);
					this.next();
				}
			}.bind(this));
		}
	});

module.exports = proxy;