/**
 * Tianma - Pipe - Combo - Compiler
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */
var FileLoader = require('./fileLoader'),
	depsParser = require('./dependenciesParser'),
	path = require('path'),
	SMC = require('smc'),
	util = require('pegasus').util;

var PATTERN_IMAGE_URL = /url\s*\(\s*["']?(.*?\.(?:png|gif|jpg|jpeg))["']?\s*\)/gim,

	// Compiler constructor.
	Compiler = util.inherit(Object, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = config;

			this._fileLoader = new FileLoader({
				charset: config.charset,
				source: config.source
			});

			this._smc = new SMC({
				base: config.base,
				fileLoader: this._fileLoader
			});
		},

		/**
		 * Compile css file.
		 * @param file {Object}
		 * @param callback {Function}
		 */
		_compileCSS: function (file, callback) {
			file.data = file.data.replace(PATTERN_IMAGE_URL, function ($0, $1) {
				if ($1.indexOf('http') !== 0) {
					return 'url(http://img.alibaba.com/' + $1 + ')';
				} else {
					return $0;
				}
			});

			callback(null, depsParser.parse(file));
		},

		/**
		 * Compile js file.
		 * @param file {Object}
		 * @param callback {Function}
		 */
		_compileJS: function (file, callback) {
			callback(null, depsParser.parse(file));
		},

		/**
		 * Load a file.
		 * @param pathname {string}
		 * @param callback {Function}
		 */
		_load: function (pathname, callback) {
			var config = this._config,
				fileLoader = this._fileLoader,
				smc = this._smc;

			if (pathname.indexOf(config.base) === 0) {
				// Use SMC to load seajs module.
				smc.compile(pathname, callback);
			} else {
				fileLoader.load(pathname, callback);
			}
		},

		/**
		 * Compile file.
		 * @param pathname {string}
		 * @param callback {Function}
		 */
		compile: function (pathname, callback) {
			var extname = path.extname(pathname),
				self = this;

			this._load(pathname, function (err, file) {
				if (err) {
					callback(err);
				} else {
					if (extname === '.js') {
						self._compileJS(file, callback);
					} else if (extname === '.css') {
						self._compileCSS(file, callback);
					} else {
						callback(null, file);
					}
				}
			});
		}
	});

module.exports = Compiler;
