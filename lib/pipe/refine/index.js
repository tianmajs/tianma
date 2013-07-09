var pegasus = require('pegasus'),
	util = pegasus.util;

var PATTERN_EXTNAME = /^\.\w+$/,

	/**
	 * Pipe function factory.
	 * @param config {Object}
	 */
	refine = pegasus.createPipe({
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			config = this._config = config || {};
			this._handler = {};

			util.each(config, function (fn, type) {
				if (PATTERN_EXTNAME.test(type)) { // Convert extname to mime.
					type = util.mime(type);
				}
				this._handler[type] = fn;
			}, this);
		},

		/**
		 * Pipe function entrance.
		 * @param request {Object}
		 * @param response {Object}
		 */
		main: function (request, response) {
			var handler = this._handler,
				type = response.head('content-type'),
				data = handler[type](response.body());

			response
				.clear()
				.write(data);

			this.next();
		},

		/**
		 * Check whether to process current request.
		 * @param request {Object}
		 * @param response {Object}
		 * @return {boolean}
		 */
		match: function (request, response) {
			var handler = this._handler;

			return response.status() === 200 &&
				response.head('content-type') in handler;
		}
	});

module.exports = refine;