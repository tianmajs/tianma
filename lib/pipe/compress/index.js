/**
 * Tianma - Pipe - Compress
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var tianma = require('tianma'),
	util = tianma.util,
	zlib = require('zlib');

	/**
	 * Pipe function factory.
	 * @param config {Object}
	 */
var	compress = tianma.createPipe({
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			config = this._config = util.mix({
				extname: [ '.js', '.css', '.html' ]
			}, config);

			this._mime = config.extname.map(function (value) {
				return util.mime(value);
			});
		},

		/**
		 * Check whether to process current request.
		 * @param request {Object}
		 * @param response {Object}
		 * @return {boolean}
		 */
		fit: function (request, response) {
			var mime = this._mime;

			return response.status() === 200 &&
				mime.some(function (value) {
					return response.head('content-type').indexOf(value) !== -1;
				});
		},

		/**
		 * Pipe function entrance.
		 * @param request {Object}
		 * @param response {Object}
		 */
		main: function (request, response) {
			var encoding = request.head('accept-encoding') || '';

			encoding = encoding.indexOf('gzip') !== -1 ?
				'gzip' :
				(encoding.indexOf('deflate') !== -1 ? 'deflate': null);

			if (encoding) {
				zlib[encoding](response.body('binary'), function (err, data) {
					if (err) {
						this.panic(err);
					} else {
						response
							.head('content-encoding', encoding)
							.clear()
							.write(data);
						this.next();
					}
				}.bind(this));
			}
		}
	});

module.exports = compress;