/**
 * Tianma - Pipe - Combo
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var FileLoader = require('./fileLoader'),
	pegasus = require('pegasus'),
	urlParser = require('./urlParser'),
	util = pegasus.util;

var PATTERN_SLASH = /\/?$/,

	/**
	 * Pipe function factory.
	 * @param config {Object}
	 */
	combo = pegasus.createPipe({
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			config = this._config = util.mix({
				source: null
			}, config);

			if (config.source) { // Pathname should end with "/".
				config.source =
					config.source.replace(PATTERN_SLASH, '/');
			}
		},

		/**
		 * Combine files.
		 * @param files {Array}
		 * @return {Buffer}
		 */
		_combine: function (files) {
			var context = this.context,
				output = [];

			// Output pathname for debugging.
			files.forEach(function (file) {
				output.push(util.format('/* ----- START OF "%s" */', file.pathname));
				output.push(file.data.trim());
				output.push('/* ----- END */');
				output.push('')
			});

			return util.encode(output.join('\r\n'), context.charset);
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
				loopback = request.head('user-agent') === 'tianma/pipe.combo';

			if (!loopback && response.status() === 404) {
				this._url = urlParser.parse(request.path);
			}

			return !!this._url;
		},

		/**
		 * Pipe function entrance.
		 * @param request {Object}
		 * @param response {Object}
		 */
		main: function (request, response) {
			var	config = this._config,
				context = this.context,
				url = this._url,
				self = this;

			new FileLoader({
					charset: context.charset,
					source: config.source || request.protocol + '//' + request.host + '/',
					ssl: request.protocol === 'https:'
				})
				.load(url.pathnames, function (err, files) {
					if (err) {
						if (err.code === 'ENOENT') {
							// File not found.
							util.error(err);
							self.done(404, err.message);
						} else {
							self.panic(err);
						}
					} else {
						self.done(200, self._combine(files), util.mime(files[0].pathname));
					}
				});
		}
	});

module.exports = combo;
