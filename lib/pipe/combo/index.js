var path = require('path'),
	pegasus = require('pegasus'),
	util = pegasus.util;

var PATTERN_SLASH = /\/?$/,

	PATTERN_COMBO_URL = /^\/(.*?)\?\?(.*?)(?:\?.*)?$/,

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
				source: null,
				separator: {
					'.js': '\n;\n',
					'.css': '\n'
				}
			}, config);

			var separator = this._separator = {};

			util.each(config.separator, function (value, key) {
				separator[util.mime(key)] = value;
			});

			if (config.source) { // Pathname should end with "/".
				config.source =
					config.source.replace(PATTERN_SLASH, '/');
			}
		},

		/**
		 * Parse combo URL.
		 * @param url {string}
		 * @return {Array}
		 */
		_parseURL: function (url) {
			if (url.indexOf('??') === -1) { // Convert simple URL to combo URL.
				url = url.replace('/', '/??');
			}

			var re = url.match(PATTERN_COMBO_URL),
				base = re[1],
				pathnames = re[2];

			pathnames = pathnames.split(',').map(function (pathname) {
				return base + pathname;
			});

			return pathnames;
		},

		/**
		 * Pipe function entrance.
		 * @param request {Object}
		 * @param response {Object}
		 */
		main: function (request, response) {
			var	config = this._config,
				source = config.source || 'loop://' + request.hostname + '/',
				load = function (pathname, callback) {
					request({
						href: source + pathname,
						headers: {
							'user-agent': 'tianma/pipe.combo'
						}
					}, function (res) {
						if (res.status !== 200) {
							callback(null);
						} else {
							callback({
								data: res.body('binary'),
								mime: res.head('content-type'),
								pathname: pathname
							});
						}
					});
				},
				pathnames = this._parseURL(request.path),
				mime, separator,
				output = [],
				self = this;

			(function next(i) {
				if (i < pathnames.length) {
					load(pathnames[i], function (file) {
						if (file) {
							if (mime && mime !== file.mime) {
								util.throwError('Inconsistent MIME type');
							} else {
								mime = file.mime;
							}
							output.push(file.data);
						}
						next(i + 1);
					});
				} else {
					if (output.length === 0) {
						response
							.status(404)
							.head('content-type', 'text/plain')
							.clear()
							.write('404 Not Found');
					} else {
						response
							.status(200)
							.head('content-type', mime)
							.clear();

						separator = self._separator[mime] || '';

						output.forEach(function (data) {
							response
								.write(data)
								.write(separator);
						});
					}
					self.next();
				}
			}(0));
		},

		/**
		 * Check whether to process current request.
		 * @param request {Object}
		 * @param response {Object}
		 * @return {boolean}
		 */
		match: function (request, response) {
			return response.status() === 404
				&& request.method === 'GET'
				&& request.head('user-agent') !== 'tianma/pipe.combo'; // Skip loopback.
		}
	});

module.exports = combo;
