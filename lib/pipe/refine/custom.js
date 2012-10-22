/**
 * Tianma - Pipe - Refine - Custom
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var tianma = require('tianma'),
	util = tianma.util;

	/**
	 * Pipe function factory.
	 * @param config {Object}
	 */
var	custom = tianma.createPipe({
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			config = this._config = config || {};
			this._handler = {};

			util.each(config, function (fn, extname) {
				var type = util.mime(extname);

				this._handler[type] = fn;
			}, this);
		},

		/**
		 * Check whether to process current request.
		 * @param request {Object}
		 * @param response {Object}
		 * @return {boolean}
		 */
		fit: function (request, response) {
			var handler = this._handler;

			return response.status() === 200 &&
				response.head('content-type') in handler;
		},

		/**
		 * Pipe function entrance.
		 * @param request {Object}
		 * @param response {Object}
		 */
		main: function (request, response) {
			var handler = this._handler,
				type, data;

			try {
				type = response.head('content-type');
				data = handler[type](response.body());
				response
					.clear()
					.write(data);
				this.next();
			} catch (err) {
				this.panic(err);
			}
		}
	});

module.exports = custom;