/**
 * Tianma - Pipe - Combo - FileLoader
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var server = {
		'http:': require('http'),
		'https:': require('https')
	},
	path = require('path'),
	url = require('url'),
	util = require('pegasus').util,
	zlib = require('zlib');

	/**
	 * Decompress gzip or deflate data.
	 * @param data {Buffer}
	 * @param encoding {string}
	 * @param callback {Function}
	 */
var	decompress = function (data, encoding, callback) {
		if (encoding === 'gzip') {
			zlib.gunzip(data, callback);
		} else if (encoding === 'deflate') {
			zlib.inflate(data, callback);
		} else {
			callback(null, data);
		}
	},

	/**
	 * Read file from remote HTTP server.
	 * @param source {string}
	 * @param pathname {string}
	 * @param callback {Function}
	 */
	read = function (source, pathname, callback) {
		var href = url.resolve(source, pathname),
			meta = url.parse(href),
			options = {
				hostname: meta.hostname,
				path: meta.path,
				port: meta.port,
				headers: {
					'accept-encoding': 'gzip, deflate'
				}
			};

		server[meta.protocol].get(options, function (response) {
			var status = response.statusCode,
				encoding = response.headers['content-encoding'],
				body = [],
				err;

			if (status === 200 || status === 304) {
				response.on('data', function (chunk) {
					body.push(chunk);
				});
				response.on('end', function () {
					decompress(Buffer.concat(body), encoding, callback);
				});
			} else {
				err = new Error(util.format('ENOENT, open \'%s\'', href));
				err.code = 'ENOENT';
				callback(err);
			}
		}).on('error', function (err) {
			callback(err);
		});
	},

	// FileLoader constructor.
	FileLoader = util.inherit(Object, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = config;
			this._cache = {};
		},

		/**
		 * Load files.
		 * @param pathname {string}
		 * @param callback {Function}
		 */
		load: function (pathname, callback) {
			var config = this._config,
				cache = this._cache;

			if (cache[pathname]) {
				callback(null, cache[pathname]);
			} else {
				read(config.source, pathname, function (err, data) {
					if (err) {
						callback(err);
					} else {
						cache[pathname] = {
							data: util.decode(data, config.charset),
							pathname: pathname
						};
						callback(null, cache[pathname]);
					}
				});
			}
		}
	});

module.exports = FileLoader;
