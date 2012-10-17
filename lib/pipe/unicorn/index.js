/**
 * Tianma - Pipe - Unicorn
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var combo = require('./combo'),
	tianma = require('tianma'),
	urlParser = require('./urlParser'),
	util = tianma.util,
	V1 = require('./v1'),
	V2 = require('./v2');

	/**
	 * Pipe function factory.
	 * @param config {Object}
	 */
var	unicorn = tianma.createPipe({
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = util.mix({
				combo: true,
				global: 'js/5v/lib/ae/debug/global-img-server.js', // Deprecated.
				modularize: false,
				prefix: { // Deprecated.
					'.css': 'css/',
					'.js': 'js/5v/',
				},
				roots: [ './' ]
			}, config);
		},

		/**
		 * Finish procesing request.
		 * @params status {number}
		 * @params data {string}
		 * @params [contextType] {string}
		 */
		done: function (status, data, contextType) {
			var context = this.context;

			context.response
				.status(status)
				.head('content-type', contextType || 'text/plain')
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
		fit: function (request, response) {
			var config = this._config,
				context = this.context,
				passed = response.status() !== 200,
				url;

			if (passed) {
				url = urlParser.parse(request.path, config.prefix);

				passed = !!url;
				if (passed) {
					this._url = url;

					if (url.version === '1') {
						this._handler = new V1({
							charset: context.charset,
							global: config.global,
							prefix: config.prefix,
							roots: config.roots
						});
					} else if (url.version === '2') {
						this._handler = new V2({
							charset: context.charset,
							modularize: config.modularize,
							roots: config.roots
						});
					}
				}
			}

			return passed;
		},

		/**
		 * Pipe function entrance.
		 * @param request {Object}
		 * @param response {Object}
		 */
		main: function (request, response) {
			var	config = this._config,
				context = this.context,
				handler = this._handler,
				url = this._url;

			handler.handle(url.pathnames, url.params, context.charset,
			function (err, result) {
				if (err) {
					if (err.message.indexOf('ENOENT') !== -1) { // File not found.
						this.done(404, '404 Not Found.\n' + err.message);
					} else {
						this.panic(err);
					}
				} else {
					this.done(200,
						combo.handle(result.files, context.charset,
							request.host, config.combo),
						result.type);
				}
			}.bind(this));
		}
	});

module.exports = unicorn;