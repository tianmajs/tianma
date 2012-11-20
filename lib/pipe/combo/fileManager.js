/**
 * Tianma - Pipe - Combo - FileManager
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var Compiler = require('./compiler'),
	util = require('pegasus').util;

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

	// FileManager constructor.
	FileManager = util.inherit(Object, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = config;
			this._cache = {};

			this._compiler = new Compiler(config);
		},

		/**
		 * Compile file.
		 * @param pathname {string}
		 * @param callback {Function}
		 */
		_compile: function (pathname, callback) {
			var config = this._config,
				cache = this._cache,
				compiler = this._compiler;

			if (cache[pathname]) {
				callback(null, cache[pathname]);
			} else {
				compiler.compile(pathname, function (err, file) {
					if (err) {
						callback(err);
					} else {
						cache[pathname] = file;
						callback(null, file);
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
					self._compile(pathnames[i], function (err, file) {
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
		 * Return required files.
		 * @param pathnames {Array}
		 * @param callback {Function}
		 */
		require: function (pathnames, callback) {
			this._travel(pathnames, callback);
		}
	});

module.exports = FileManager;
