/**
 * Tianma - Pipe - Unicorn - FileLoader
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var fs = require('fs'),
	http = require('http'),
	path = require('path'),
	url = require('url'),
	util = require('tianma').util;

	/**
	 * Read files.
	 * @param roots {Array}
	 * @param pathnames {Array}
	 * @param callback {Function}
	 */
var read = function (roots, pathnames, callback) {
		var result = [];

		(function next(i) {
			if (i < pathnames.length) {
				readCandidates(roots.map(function (root) {
					return root.indexOf('http:') === 0 ?
						url.resolve(root, pathnames[i]) :
						path.join(root, pathnames[i]);
				}), function (err, data) {
					if (err) {
						callback(err);
					} else {
						result.push(data);
						next(i + 1);
					}
				});
			} else {
				callback(null, result);
			}
		}(0));
	},

	/**
	 * Read the first usable file from candidates.
	 * @param candidates {Array}
	 * @param callback {Function}
	 */
	readCandidates = function (candidates, callback) {
		var lastError = null;

		(function next(i) {
			var source,
				reader;

			if (i < candidates.length) {
				source = candidates[i];
				reader = source.indexOf('http:') === 0 ? readRemote : readLocal;
				reader(source, function (err, data) {
					if (err) {
						lastError = err;
						next(i + 1);
					} else {
						callback(null, data);
					}
				});
			} else {
				callback(lastError, null);
			}
		}(0));
	},

	/**
	 * Read file from local disk.
	 * @param pathname {string}
	 * @param callback {Function}
	 */
	readLocal = fs.readFile,

	/**
	 * Read file from remote HTTP server.
	 * @param url {string}
	 * @param callback {Function}
	 */
	readRemote = function (url, callback) {
		var request = http.request(url, function (response) {
				var status = response.statusCode,
					body = [];

				if (status === 200 || status === 304) {
					response.on('data', function (chunk) {
						body.push(chunk);
					});
					response.on('end', function () {
						callback(null, Buffer.concat(body));
					});
				} else {
					callback(new Error(util.format('ENOENT, open \'%s\'', url)));
				}
			});

		request.on('error', function (err) {
			callback(err);
		});

		request.end();
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
				read(config.roots, missing, function (err, datum) {
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