/**
 * Tianma - Pipe - Combo - Handler V1
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var DependenciesManager = require('./dependenciesManager'),
	FileLoader = require('./fileLoader'),
	path = require('path'),
	util = require('tianma').util;

var PATTERN_DEPS = /(?:^\/\/\s#require\s<(.*?)>$|\/\/\s*#import\s+([\w\/-]+\.js).*$)/gm,

	/**
	 * Parse dependencies declaration.
	 * @param prefix {Object}
	 * @param data {string}
	 * @param pathname {string}
	 */
	depsParser = function (prefix, data, pathname) {
		var deps = [],
			extname = path.extname(pathname),
			re;

		PATTERN_DEPS.lastIndex = 0;

		while (re = PATTERN_DEPS.exec(data)) {
			deps.push(prefix[extname] + (re[1] || re[2]));
		}

		return deps;
	},

	refiner = {
		/**
		 * Refine CSS file contents to combine.
		 * @param files {Array}
		 * @return {Array}
		 */
		'.css': function (files) {
			files.forEach(function (file) {
				file.data = file.data.replace(PATTERN_DEPS, '');
			});

			return files;
		},

		/**
		 * Refine JS file contents to combine.
		 * @param files {Array}
		 * @return {Array}
		 */
		'.js': function (files) {
			files.forEach(function (file) {
				file.data = file.data.replace(PATTERN_DEPS, '');
			});

			return files;
		}
	},

	// V1 constructor.
	V1 = util.inherit(Object, {
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

			this._depsMgr = new DependenciesManager({
				fileLoader: this._fileLoader,
				depsParser: depsParser.bind(null, config.prefix),
				useAlias: false
			});
		},

		/**
		 * Handle requested files.
		 * @param pathnames {Array}
		 * @param params {Object}
		 * @param charset {string}
		 * @param callback {Function}
		 */
		handle: function (pathnames, params, charset, callback) {
			var config = this._config,
				fileLoader = this._fileLoader,
				depsMgr = this._depsMgr,
				extname = path.extname(pathnames[0]);

			if (extname === '.js' && config.global) {
				pathnames = [ config.global ].concat(pathnames);
			}

			depsMgr.lookup(pathnames, function (err, deps) {
				if (err) {
					callback(err);
				} else {
					fileLoader.load(deps, function (err, datum) {
						if (err) {
							callback(err);
						} else {
							datum = datum.map(function (data, index) {
								return { pathname: deps[index], data: data };
							});

							callback(null, {
								files: refiner[extname](datum),
								type: util.mime(extname)
							});
						}
					});
				}
			});
		}
	});

module.exports = V1;