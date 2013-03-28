/**
 * Tianma - Pipe - Modular - Loader
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var events = require('events'),
	path = require('path'),
	server = {
		'http:': require('http'),
		'https:': require('https')
	},
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
	 * @param href {string}
	 * @param callback {Function}
	 */
	read = function (href, callback) {
		var	meta = url.parse(href),
			options = {
				hostname: '127.0.0.1',
				path: meta.path,
				port: meta.port,
				headers: {
					'accept-encoding': 'gzip, deflate',
					'host': meta.hostname,
					'user-agent': 'tianma/pipe.modular'
				},
				rejectUnauthorized: false
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

	// Loader constructor.
	Loader = util.inherit(events.EventEmitter, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = config;
		},

		/**
		 * Load files.
		 * @param pathnames {Array}
		 * @param callback {Function}
		 */
		load: function (pathnames, callback) {
			var config = this._config,
				files = {},
				self = this;

			(function next(i) {
				if (i < pathnames.length) {
					read(config.source + pathnames[i], function (err, data) {
						if (err) {
							self.emit('error', err);
						} else {
							files[pathnames[i]] = util.decode(data, config.charset);
							next(i + 1);
						}
					});
				} else {
					callback(files);
				}
			}(0));
		}
	});

module.exports = Loader;
