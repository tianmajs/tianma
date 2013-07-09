/**
 * Tianma - Pipe - Pipe
 * Copyright(c) 2010 ~ 2013 Alibaba.com, Inc.
 * MIT Licensed
 */

var pegasus = require('pegasus'),
	util = pegasus.util;

	/**
	 * Pipe function factory.
	 * @param config {Object}
	 */
var	pipe = pegasus.createPipe({
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = config;
		},

		/**
		 * Pipe function entrance.
		 * @param request {Object}
		 * @param response {Object}
		 */
		main: function (request, response) {
			var pipes = this._config.pipes,
				context = this.context,
				len = pipes.length,
				i = 0,
				self = this;

			(function next() {
				if (i < len) {
					pipes[i++](context, next);
				} else {
					self.next();
				}
			}());
		}
	});

/**
 * Refine arguments.
 * @param pipes {Array}
 * @return {Function}
 */
module.exports = function (pipes) {
	return pipe({
		pipes: pipes || [],
	});
};
