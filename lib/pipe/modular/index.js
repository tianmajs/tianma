/**
 * Tianma - Pipe - Modular
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var path = require('path'),
	pegasus = require('pegasus'),
	util = pegasus.util;

var PATTERN_COMMENT = /\/\/.*$|\/\*[\s\S]*?\*\//gm,

	PATTERN_DEFINE = /^\s*define\s*\((.*?)function/m,

	PATTERN_REQUIRE = /[^\.]require\s*\(\s*['"](.*?)['"]\s*\)/gm,

	contentTypes = [ 'text/javascript', 'application/x-javascript', 'application/javascript' ],

	/**
	 * Pipe function factory.
	 * @param config {Object}
	 */
	modular = pegasus.createPipe({
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = util.mix({
				force: false
			}, config);
		},

		/**
		 * Parse shallow dependencies.
		 * @param data {string}
		 * @return {Array}
		 */
		_parseDependencies: function (data) {
			var deps = [],
				re;

			data = data.replace(PATTERN_COMMENT, '');

			PATTERN_REQUIRE.lastIndex = 0;

			while (re = PATTERN_REQUIRE.exec(data)) { // Assign.
				deps.push(re[1]);
			}

			return deps;
		},

		/**
		 * Check whether to process current request.
		 * @param request {Object}
		 * @param response {Object}
		 * @return {boolean}
		 */
		fit: function (request, response) {
			return response.status() === 200 ||
				contentTypes.indexOf(response.head('content-type')) !== -1;
		},

		/**
		 * Pipe function entrance.
		 * @param request {Object}
		 * @param response {Object}
		 */
		main: function (request, response) {
			var config = this._config,
				data = response.body(),
				re, id, deps;

			re = data.match(PATTERN_DEFINE);

			if (re && re[1].trim() === '' || !re && config.force) {
				id = request.protocol + '//' + request.hostname + request.pathname;

				deps = this._parseDependencies(data);
				deps = deps.length === 0 ?
					'[]' : '[ "' + deps.join('", "') + '" ]';

				data = re ?
					data.replace(PATTERN_DEFINE, function (all, head) {
						return util.format('define("%s", %s, function', id, deps);
					}) :
					util.format('define("%s", %s, function (exports, module, require) {\n',
						id, deps) + data + '\n});\n';

				response
					.clear()
					.write(data);
			}

			this.next();
		}
	});

module.exports = modular;
