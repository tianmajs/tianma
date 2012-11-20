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

var PATTERN_MACRO_INCLUDE = /#include\('(.*?)'\)/g,

	/**
	 * Handle circular references error.
	 * @param file {Object}
	 * @param trace {Array}
	 * @param callback {Function}
	 */
	circle = function (pathname, trace, callback) {
		var orbit = trace.concat(pathname).join(' -> '),
			message = 'Circular references found: ' + orbit;

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
	 * Parse #include comments.
	 * @param file {Object}
	 * @param return {Array}
	 */
	parse = function (file) {
		var result = [],
			re;

		PATTERN_MACRO_INCLUDE.lastIndex = 0;

		while (re = PATTERN_MACRO_INCLUDE.exec(file.data)) { // Assign.
			result.push(re[1].charAt(0) === '.' ?
				decodeURI(url.resolve(file.pathname, re[1])) : re[1]);
		}

		return result;
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
		 * Replace #include comments to file contents.
		 * @param file {Object}
		 * @param callback {Function}
		 * @param [_trace] {Array}
		 */
		_expand: function (file, callback, _trace) {
			var	self = this,
				externalFiles;

			_trace = _trace || [];

			if (_trace.indexOf(file.pathname) !== -1) {
				// Found circular dependencies.
				circle(file.pathname, _trace, callback);
			} else {
				externalFiles = parse(file);

				if (externalFiles.length > 0) {
					// Go forward.
					_trace.push(file.pathname);

					(function next(i) {
						if (i < externalFiles.length) {
							self.load(externalFiles[i], function (err, file) {
								if (err) {
									callback(err);
								} else {
									externalFiles[i] = file.data;
									next(i + 1);
								}
							}, _trace);
						} else {
							// Come back.
							_trace.pop();

							file.data = file.data.replace(PATTERN_MACRO_INCLUDE, function () {
								return externalFiles.shift();
							});
							callback(null, file);
						}
					}(0));
				} else {
					callback(null, file);
				}
			}
		},

		/**
		 * Load files.
		 * @param pathname {string}
		 * @param callback {Function}
		 */
		load: function (pathname, callback, _trace) {
			var config = this._config,
				cache = this._cache,
				self = this;

			if (cache[pathname]) {
				callback(null, cache[pathname]);
			} else {
				read(config.source, pathname, function (err, data) {
					if (err) {
						callback(err);
					} else {
						self._expand({
							data: util.decode(data, config.charset),
							pathname: pathname
						}, function (err, file) {
							if (err) {
								callback(err);
							} else {
								cache[pathname] = file;
								callback(null, cache[pathname]);
							}
						}, _trace);
					}
				});
			}
		}
	});

module.exports = FileLoader;
