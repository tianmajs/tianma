/**
 * Tianma - Pipe - Dynamic
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var path = require('path'),
	pegasus = require('pegasus'),
	util = pegasus.util;

	/**
	 * Compile template to function.
	 * @param tmpl {string}
	 * @return {Function}
	 */
var	compile = (function () {
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
		 * Check whether to process current request.
		 * @param request {Object}
		 * @param response {Object}
		 * @return {boolean}
		 */
		fit: function (request, response) {
			var config = this._config;

			return response.status() === 200 &&
				path.extname(request.pathname) === config.extname;
		},

		/**
		 * Pipe function entrance.
		 * @param request {Object}
		 * @param response {Object}
		 */
		main: function (request, response) {
			var context = this.context,
				fn;

			try {
				fn = compile(response.body());

				// Clear template string.
				response.clear();

				// Execute template function.
				fn(context);

				// Change context-type if no error.
				response.head('content-type', 'text/html');

				this.next();
			} catch (err) {
				this.panic(err);
			}
		}
	});

module.exports = dynamic;
