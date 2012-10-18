/**
 * Tianma - Pipe - Combo - AliasManager
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var url = require('url'),
	util = require('tianma').util;

var PATTERN_FILENAME = /([\w\-\.]+)$/,

	/**
	 * Read alias map.
	 * @param dirname {string}
	 * @param fileLoader {Object}
	 * @param callback {Function}
	 */
	readMap = function (dirname, fileLoader, callback) {
		var map = null;

		(function next(dirname) {
			var pathname;

			if (dirname !== '/') {
				pathname = decodeURI(url.resolve(dirname, '_alias.js'));
				fileLoader.load([ pathname ], function (err, datum) {
					try {
						if (!err) {
							map = map || {};
							util.mix(map, JSON.parse(datum[0]), false);
						}
						next(decodeURI(url.resolve(dirname, '../')));
					} catch (err) {
						callback(err);
					}
				});
			} else {
				if (map) {
					util.each(map, function (version, alias) {
						delete map[alias];
						map[alias + '.js'] = alias.replace(PATTERN_FILENAME, '$1/' + version + '/$1.js');
					});
				}
				callback(null, map);
			}
		}(dirname));
	},

	// Alias constructor.
	AliasManager = util.inherit(Object, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = config;
			this._cache = {};
		},

		/**
		 * Lookup alias map.
		 * @param pathname {string}
		 * @param callback {Function}
		 */
		lookup: function (pathname, callback) {
			var config = this._config,
				cache = this._cache,
				dirname;

			if (config.fake) {
				callback(null, null);
			} else {
				dirname = decodeURI(url.resolve(pathname, './'));

				if (dirname in cache) {
					callback(null, cache[dirname]);
				} else {
					readMap(dirname, config.fileLoader, function (err, map) {
						if (err) {
							callback(err);
						} else {
							cache[dirname] = map;
							callback(null, map);
						}
					});
				}
			}
		}
	});

module.exports = AliasManager;