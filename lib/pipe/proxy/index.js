var pegasus = require('pegasus'),
	url = require('url'),
	util = pegasus.util;

var PATTERN_REPLACEMENT = /\$(\d+)/g,

	PATTERN_IP = /^(?:\d+\.){3}\d+$/,

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
		 * Pipe function entrance.
		 * @param request {Object}
		 * @param response {Object}
		 */
		main: function (request, response) {
			var result = this._matchResult,
				href = assemble(result),
				meta = url.parse(href),
				options = {
					href: href,
					method: request.method,
					headers: util.merge(request.head()), // Keep origin unmodified.
					body: request.body()
				},
				self = this;

			// If remote hostname is not ip, change headers.host to the same.
			options.headers.host =
				(PATTERN_IP.test(meta.hostname) ? request.hostname : meta.hostname)
				+ (meta.port ? ':' + meta.port : '');

			request(options, function (res) {
				response
					.status(res.status)
					.head(res.head())
					.clear()
					.write(res.body('binary'));
				self.next();
			});
		},

		/**
		 * Check whether to process current request.
		 * @param request {Object}
		 * @param response {Object}
		 * @return {boolean}
		 */
		match: function (request, response) {
			var config = this._config,
				passed = response.status() === 404;

			if (passed) {
				this._matchResult = match(config, request.href);
				passed = !!this._matchResult;
			}

			return passed;
		}
	});

module.exports = proxy;
