/**
 * Tianma - Pipe - Cache
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var pegasus = require('pegasus'),
	util = pegasus.util;

	/**
	 * Pipe function factory.
	 * @param config {Object}
	 */
var	cache = pegasus.createPipe({
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = config;
		},

		/**
		 * Add cache-control headers to response.
		 */
		_stamp: function () {
			var request = this.context.request,
				response = this.context.response,
				expires = this._config.expires,
				now = new Date();

			if (request.method === 'GET' && response.status() === 200 && expires) {
				response
					.head('last-modified', now.toGMTString())
					.head('expires', new Date(now.getTime() + 1000 * expires).toGMTString())
					.head('cache-control', 'max-age=' + expires);
			}
		},

		/**
		 * Check condition request.
		 * @return {boolean}
		 */
		_validate: function () {
			var request = this.context.request,
				response = this.context.response,
				expires = this._config.expires,
				stamp = request.head('if-modified-since') || 0,
				now = new Date();

			if (request.method !== 'GET' || now - new Date(stamp).getTime() > 1000 * expires) {
				return false;
			} else {
				response
					.status(304)
					.head('last-modified', stamp);
				return true;
			}
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

			if (this._validate()) {
				this.next();
			} else {
				(function next() {
					if (i < len) {
						pipes[i++](context, next);
					} else {
						self._stamp();
						self.next();
					}
				}());
			}
		}
	});

/**
 * Refine arguments.
 * @param pipes {Array}
 * @param config {Object|null}
 * @return {Function}
 */
module.exports = function (pipes, config) {
	return cache({
		pipes: pipes || [],
		expires: (config || {}).expires || 1800 // seconds
	});
};
