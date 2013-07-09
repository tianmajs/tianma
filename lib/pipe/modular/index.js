var path = require('path'),
	pegasus = require('pegasus'),
	util = pegasus.util;

var PATTERN_SLASH = /^\//,

	PATTERN_DEFINE = /^\s*define\s*\(\s*(function|\{)/m,

	PATTERN_REQUIRE = /[^\.]require\s*\(\s*['"]([^'"]+?)['"]\s*\)/g,

	PATTERN_EXPORTS = /\bmodule\.exports\b|[^\.]\bexports\.|^exports\./m,

	CONTENT_TYPES = [
		'text/javascript',
		'application/x-javascript',
		'application/javascript'
	],

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
				auto: false
			}, config);
		},

		/**
		 * Parse dependencies.
		 * @param data {string}
		 * @return {Array}
		 */
		_deps: function (data) {
			var deps = [],
				re;

			PATTERN_REQUIRE.lastIndex = 0;

			while (re = PATTERN_REQUIRE.exec(data)) { // Assign.
				deps.push(re[1]);
			}

			return util.unique(deps);
		},

		/**
		 * Rewrite module definition wrapper.
		 * @param data {string}
		 * @param pathname {string}
		 * @param deps {Array}
		 * @return {string}
		 */
		_rewriteWrapper: function (data, pathname, deps) {
			deps = deps.length === 0 ?
				'[ ]' : '[ "' + deps.join('", "') + '" ]';

			return data.replace(PATTERN_DEFINE, function (all, suffix) {
				return util.format('define("%s", %s, %s', pathname, deps, suffix);
			});
		},

		/**
		 * Add module definition wrapper.
		 * @param data {string}
		 * @param pathname {string}
		 * @param deps {Array}
		 * @return {string}
		 */
		_wrap: function (data, pathname, deps) {
			deps = deps.length === 0 ?
				'[ ]' : '[ "' + deps.join('", "') + '" ]';

			return util.format(
				'define("%s", %s, function (require, exports, module) {\n' +
				'%s\n' +
				'});', pathname, deps, data
			);
		},

		/**
		 * Pipe function entrance.
		 * @param request {Object}
		 * @param response {Object}
		 */
		main: function (request, response) {
			var config = this._config,
				pathname = request.pathname.replace(PATTERN_SLASH, ''),
				data = response.body();

			if (PATTERN_DEFINE.test(data)) {
				data = this._rewriteWrapper(data, pathname, this._deps(data));
			} else if (config.auto && PATTERN_EXPORTS.test(data)) {
				data = this._wrap(data, pathname, this._deps(data));
			} else {
				data = null;
			}

			if (data) {
				response
					.clear()
					.write(data);
			}

			this.next();
		},

		/**
		 * Check whether to process current request.
		 * @param request {Object}
		 * @param response {Object}
		 * @return {boolean}
		 */
		match: function (request, response) {
			return response.status() === 200
				&& CONTENT_TYPES.indexOf(response.head('content-type')) !== -1;
		}
	});

module.exports = modular;
