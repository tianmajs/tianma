/**
 * Tianma - Pipe - Combo - FileLoader
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var fs = require('fs'),
	path = require('path'),
	server = {
		'http:': require('http'),
		'https:': require('https')
	},
	url = require('url'),
	util = require('tianma').util,
	zlib = require('zlib');

	/**
	 * Decompress gzip or deflate data.
	 * @param data {Buffer}
	 * @param encoding {string}
	 * @param callback {Function}
	 */
var decompress = function (data, encoding, callback) {
		if (encoding === 'gzip') {
			zlib.gunzip(data, callback);
		} else if (encoding === 'deflate') {
			zlib.inflate(data, callback);
		} else {
			callback(null, data);
		}
	},

	/**
	 * Read files.
	 * @param roots {Array}
	 * @param pathnames {Array}
	 * @param callback {Function}
	 */
	read = function (source, pathnames, callback) {
		var datum = [];

		(function next(i) {
			if (i < pathnames.length) {
				readRemote(url.resolve(source, pathnames[i]),
					function (err, data) {
						if (err) {
							callback(err);
						} else {
							datum.push(data);
							next(i + 1);
						}
					});
			} else {
				callback(null, datum);
			}
		}(0));
	},

	/**
	 * Read file from remote HTTP server.
	 * @param href {string}
	 * @param callback {Function}
	 */
	readRemote = function (href, callback) {
		var meta = url.parse(href),
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
		 * @param pathnames {Array}
		 * @param callback {Function}
		 */
		load: function (pathnames, callback) {
			var config = this._config,
				cache = this._cache,
				missing;

			missing = pathnames.filter(function (pathname) {
				return !(pathname in cache);
			});

			if (missing.length > 0) {
				read(config.source, missing, function (err, datum) {
					if (err) {
						callback(err);
					} else {
						datum.forEach(function (data, index) {
							cache[missing[index]] = util.decode(data, config.charset);
						});
						this.load(pathnames, callback);
					}
				}.bind(this));
			} else {
				callback(null, pathnames.map(function (pathname) {
					return cache[pathname];
				}));
			}
		}
	});

module.exports = FileLoader;