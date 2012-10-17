/**
 * Tianma - Pipe - Handler V2
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var DependenciesManager = require('./dependenciesManager'),
	FileLoader = require('./fileLoader'),
	path = require('path'),
	util = require('tianma').util;

var PATTERN_REQUIRE = /(?:^|[^\.])require\(['"](.*?)(?:\.js)?['"]\)/g,

	PATTERN_DEFINE = /(^|[^\.])define\s*\(\s*function/,

	PATTERN_COMMENT = /\/\/.*$|\/\*[\s\S]*?\*\//gm,

	/**
	 * Compile source code.
	 * @param data {string}
	 * @param pathname {string}
	 * @param deps {Array}
	 * @param modularize {boolean}
	 * @return {string}
	 */
	compile = function (data, pathname, deps, modularize) {
		PATTERN_REQUIRE.lastIndex = 0;

		data = data.trim();

		if (PATTERN_DEFINE.test(data)) {
			return data.replace(PATTERN_DEFINE,
				'$1' +
				util.format(
					'define("#%s", [ %s ], function',
					pathname.replace(/\.js$/, ''),
					deps.map(function (pathname) {
						return '"#' + pathname.replace(/\.js$/, '') + '"';
					}).join(', ')
				)
			);
		} else if (modularize && PATTERN_REQUIRE.test(data)) {
			return util.format(
				'define("#%s", [ %s ], function (require, exports, module) {\r\n',
				pathname.replace(/\.js$/, ''),
				deps.map(function (pathname) {
					return '"#' + pathname.replace(/\.js$/, '') + '"';
				}).join(', ')
			) + data + '\r\n});\r\n';
		} else {
			return data;
		}
	},

	/**
	 * Parse dependencies declaration.
	 * @param data {string}
	 * @param pathname {string}
	 */
	depsParser = function (data, pathname) {
		var pathnames = [],
			re,
			required;

		PATTERN_REQUIRE.lastIndex = 0;

		data = data.replace(PATTERN_COMMENT, '');

		while (re = PATTERN_REQUIRE.exec(data)) {
			required = re[1] + '.js';
			if (required.charAt(0) === '.') {
				required = decodeURI(url.resolve(pathname, required));
			}
			pathnames.push(required);
		}

		return pathnames;
	},

	// V2 constructor.
	V2 = util.inherit(Object, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = config;

			this._fileLoader = new FileLoader({
				charset: config.charset,
				roots: config.roots
			});

			this._depsMgr = new DependenciesManager({
				fileLoader: this._fileLoader,
				depsParser: depsParser,
				useAlias: true
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
				extname = path.extname(pathnames[0]),
				aio = 'aio' in params;

			depsMgr.lookup(pathnames, function (err, deps) {
				if (err) {
					callback(err);
				} else {
					deps = aio ?
						deps : // Load all dependencies.
						deps.filter(function (value) { // Load files in URL.
							return pathnames.indexOf(value) !== -1;
						});

					fileLoader.load(deps, function (err, datum) {
						if (err) {
							callback(err);
						} else {
							datum = datum.map(function (data, index) {
								return { pathname: deps[index], data: data };
							});

							this.refine(datum, function (err, files) {
								if (err) {
									callback(err);
								} else {
									callback(null, {
										files: files,
										type: util.mime(extname)
									});
								}
							});
						}
					}.bind(this));
				}
			}.bind(this));
		},

		/**
		 * Refine JS file contents to combine.
		 * @param files {Array}
		 * @param deps {Object}
		 * @param modularize {boolean}
		 * @param callback {Function}
		 */
		refine: function (files, callback) {
			var config = this._config,
				depsMgr = this._depsMgr;

			(function next(i) {
				var pathname;

				if (i < files.length) {
					pathname = files[i].pathname;
					depsMgr.lookup(pathname, function (err, deps) {
						if (err) {
							callback(err);
						} else {
							files[i].data = compile(files[i].data,
								pathname, deps, config.modularize);
							next(i + 1);
						}
					});
				} else {
					callback(null, files);
				}
			}(0));
		}
	});

module.exports = V2;