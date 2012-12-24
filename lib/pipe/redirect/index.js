/**
 * Tianma - Pipe - Redirect
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var pegasus = require('pegasus'),
	util = pegasus.util;

var PATTERN_REPLACEMENT = /\$(\d+)/g,

	/**
	 * Match request pathname.
	 * @param rules {Object}
	 * @param request {Object}
	 * @return {Object|null}
	 */
	match = function (rules, request) {
		var pathname = request.pathname,
			keys = Object.keys(rules),
			len = keys.length,
			i = 0,
			re;

		for (; i < len; ++i) {
			re = pathname.match(rules[keys[i]]);
			if (re) {
				pathname = keys[i]
					.replace(PATTERN_REPLACEMENT, function (all, index) {
						return re[index];
					});

				return {
					href: request.protocol + '//' + request.host
						+ pathname + request.search,
					path: pathname + request.search,
					pathname: pathname
				};
			}
		}

		return null;
	},

	/**
	 * Pipe function factory.
	 * @param config {Object}
	 */
	redirect = pegasus.createPipe({
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
			return response.status() === 404;
		},

		/**
		 * Pipe function entrance.
		 * @param request {Object}
		 * @param response {Object}
		 */
		main: function (request, response) {
			var result = match(this._config, request);

			if (result) {
				util.mix(request, result);
			}

			this.next();
		}
	});

module.exports = redirect;
