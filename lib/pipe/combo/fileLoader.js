/**
 * Tianma - Pipe - Combo - FileLoader
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var compiler = require('./compiler'),
	server = {
		'http:': require('http'),
		'https:': require('https')
	},
	url = require('url'),
	util = require('pegasus').util,
	zlib = require('zlib');


	/**
	 * Handle circular dependencies error.
	 * @param file {Object}
	 * @param trace {Array}
	 * @param callback {Function}
	 */
var circle = function (file, trace, callback) {
		var orbit = trace.concat(file).map(function (value) {
				return value.pathname;
			}).join(' -> '),
			message = 'Circular dependencies found: ' + orbit;

		callback(new Error(message));
	},

	/**
	 * Decompress gzip or deflate data.
	 * @param data {Buffer}
	 * @param encoding {string}
	 * @param callback {Function}
	 */
	decompress = function (data, encoding, callback) {
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
					'accept-encoding': 'gzip, deflate',
					'user-agent': 'tianma/pipe.combo'
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
		 * Load a file.
		 * @param pathname {string}
		 * @param callback {Function}
		 */
		_load: function (pathname, callback) {
			var config = this._config,
				cache = this._cache;

			if (cache[pathname]) {
				callback(null, cache[pathname]);
			} else {
				read(config.source, pathname, function (err, data) {
					if (err) {
						callback(err);
					} else {
						data = util.decode(data, config.charset);

						compiler.compile({
							data: data,
							pathname: pathname
						}, function (err, file) {
							if (err) {
								callback(err);
							} else {
								cache[pathname] = file;
								callback(null, file);
							}
						});
					}
				});
			}
		},

		/**
		 * Travel dependencies tree.
		 * @param pathnames {Array}
		 * @param callback {Function}
		 * @param [_trace] {Array}
		 * @param [_output] {Array}
		 */
		_travel: function (pathnames, callback, _trace, _output) {
			var self = this;

			_trace = _trace || [];
			_output = _output || [];

			(function next(i) {
				if (i < pathnames.length) {
					self._load(pathnames[i], function (err, file) {
						if (err) {
							callback(err);
						} else if (_trace.indexOf(file) !== -1) {
							// Found circular dependencies.
							circle(file, _trace, callback);
						} else if (_output.indexOf(file) !== -1) {
							// Skip visited node.
							next(i + 1);
						} else {
							// Go forward.
							_trace.push(file);
							// Visite children.
							self._travel(file.deps, function (err) {
								if (err) {
									callback(err);
								} else {
									// Come back.
									_trace.pop();
									// Save visited node.
									_output.push(file);
									// Visit next sibling.
									next(i + 1);
								}
							}, _trace, _output);
						}
					});
				} else {
					callback(null, _output);
				}
			}(0));
		},

		/**
		 * Load files and all dependencies.
		 * @param pathnames {Array}
		 * @param callback {Function}
		 */
		load: function (pathnames, callback) {
			this._travel(pathnames, callback);
		}
	});

module.exports = FileLoader;
