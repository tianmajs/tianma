/**
 * Tianma - Pipe - Dynamic
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var path = require('path'),
	pegasus = require('pegasus'),
	url = require('url'),
	util = pegasus.util;

var PATTERN_SSI = /<!--\s*#include\s+virtual\s*=\s*"([^"]*)"\s*-->/g,

	/**
	 * Compile template to function.
	 * @param tmpl {string}
	 * @return {Function}
	 */
	compile = (function () {
		var PATTERN_LITERAL = /%>([\s\S]*?)<%/gm,
			PATTERN_QUOTE = /"/g,
			PATTERN_CR = /\r/g,
			PATTERN_LF = /\n/g,
			PATTERN_TAB = /\t/g,
			PATTERN_EXP = /<%=(.*?)%>/g,
			cache = {};

		return function (tmpl) {
			if (!cache[tmpl]) {
				cache[tmpl] = new Function(
					'context',
					'with(context){' +
						('%>' + tmpl + '<%')
							.replace(PATTERN_LITERAL, function ($0, $1) {
								return '%>'
									+ $1.replace(PATTERN_QUOTE, '\\"')
										.replace(PATTERN_CR, '\\r')
										.replace(PATTERN_LF, '\\n')
										.replace(PATTERN_TAB, '\\t')
									+ '<%';
							})
							.replace(PATTERN_EXP, '"+($1)+"')
							.replace(PATTERN_LITERAL, 'response.write("$1");') +
					'}'
				);
			}

			return cache[tmpl];
		};
	}()),

	/**
	 * Pipe function factory.
	 * @param config {Object}
	 */
	dynamic = pegasus.createPipe({
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = util.mix({
				extname: '.psp'
			}, config);
		},

		/**
		 * Replace SSI placeholder.
		 * @param data {string}
		 * @param callback {Function}
		 */
		_ssi: function (data, callback) {
			var charset = this.context.charset,
				request = this.context.request,
				source = 'loop://' + request.hostname,
				pathname = request.pathname,
				replacement = [],
				href, re;

			PATTERN_SSI.lastIndex = 0;

			(function next() {
				if (re = PATTERN_SSI.exec(data)) {
					href = source + url.resolve(pathname, re[1]);
					request(href, function (res) {
						if (res.status !== 200) {
							util.throwError('Cannot read "%s"', href);
						} else {
							replacement.push(res.body(charset));
							next();
						}
					});
				} else {
					data = data.replace(PATTERN_SSI, function () {
						return replacement.shift();
					});
					callback(data);
				}
			}());
		},

		/**
		 * Pipe function entrance.
		 * @param request {Object}
		 * @param response {Object}
		 */
		main: function (request, response) {
			var context = this.context,
				fn,
				self = this;

			this._ssi(response.body(), function (data) {
				// Compile template.
				try {
					fn = compile(data);
				} catch (err) {
					util.throwError(err);
				}

				// Set default content-type.
				response.head('content-type', 'text/html');

				// Clear template string.
				response.clear();

				// Execute template function.
				try {
					fn(context);
				} catch (err) {
					util.throwError(err);
				}

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
			var config = this._config;

			return response.status() === 200 &&
				path.extname(request.pathname) === config.extname;
		}
	});

module.exports = dynamic;
