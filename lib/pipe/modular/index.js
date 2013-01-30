/**
 * Tianma - Pipe - Modular
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var Compiler = require('./compiler'),
	Loader = require('./loader'),
	path = require('path'),
	pegasus = require('pegasus'),
	Preprocessor = require('./preprocessor'),
	util = pegasus.util;

var PATTERN_DEFINE = /^\s*define\s*\(\s*(?:function|\{)/m,

	contentTypes = [
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
				level: 'lite'
			}, config);
		},

		/**
		 * Check whether to process current request.
		 * @param request {Object}
		 * @param response {Object}
		 * @return {boolean}
		 */
		fit: function (request, response) {
			return response.status() === 200
				&& contentTypes.indexOf(response.head('content-type')) !== -1
				&& PATTERN_DEFINE.test(response.body());
		},

		/**
		 * Pipe function entrance.
		 * @param request {Object}
		 * @param response {Object}
		 */
		main: function (request, response) {
			var loader = new Loader({
					charset: this.context.charset,
					source: request.protocol + '//' + request.host + '/'
				}),
				processor = new Preprocessor({
					loader: loader
				}),
				compiler = new Compiler({
					level: this._config.level,
					loader: loader
				}),
				onError = this.panic.bind(this),
				self = this;

			loader.on('error', onError);
			processor.on('error', onError);
			compiler.on('error', onError);

			processor.process(request.pathname.replace('/', ''), response.body(),
				function (file) {
					compiler.compile(file.pathname, file.data, function (file) {
						response
							.clear()
							.write(file.data);
						self.next();
					});
				});
		}
	});

module.exports = modular;
