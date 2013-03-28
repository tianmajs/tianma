/**
 * Tianma - Pipe - Modular - Compiler
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var events = require('events'),
	util = require('pegasus').util;

var PATTERN_COMMENT = /\/\/.*$|\/\*[\s\S]*?\*\//gm,

	PATTERN_DEFINE = /^\s*define\s*\(\s*(function|\{)/m,

	PATTERN_DEFINE_FULL = /^\s*define\s*\(.*?\[(.*?)\]\s*,\s*(function|\{)/m,

	PATTERN_REQUIRE = /[^\.]require\s*\(\s*['"]((?:[\w\-\.\{\}]+\/?)+)(\?.*?)?['"]\s*\)/g,

	PATTERN_VAR = /\{[\w\-\.]+\}/,

	/**
	 * Read dependencies info from header.
	 * @param pathname {string}
	 * @param data {string}
	 * @return {Array}
	 */
	readDependencies = function (pathname, data) {
		var re = data.match(PATTERN_DEFINE_FULL);

		if (!re) {
			throw new Error(util.format('%s is not a valid CMD module.', pathname));
		} else {
			return re[1].split(',')
				.map(function (value) {
					value = value.trim();
					return value && value.substring(1, value.length - 1);
				})
				.filter(function (value) {
					return value !== '';
				});
		}
	},

	/**
	 * Remove duplicate item in an array.
	 * @param arr {Array}
	 * @return {Array}
	 */
	unique = function (arr) {
		return arr.filter(function (value, index, arr) {
			return index === arr.indexOf(value);
		});
	},

	Compiler = util.inherit(events.EventEmitter, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = config;
		},

		/**
		 * Compile source file.
		 * @param pathname {string}
		 * @param data {string}
		 * @param callback {Function}
		 */
		compile: function (pathname, data, callback) {
			this.parseDependencies(pathname, data, function (deps) {
				deps = deps.length === 0 ?
					'[]' : '[ "' + deps.join('", "') + '" ]';

				data = data
					.replace(PATTERN_DEFINE, function (all, suffix) {
						return util.format('define("%s", %s, %s', pathname, deps, suffix);
					});

				callback({
					data: data,
					deps: deps,
					pathname: pathname
				});
			});
		},

		/**
		 * Parse dependencies of source file.
		 * @param pathname {string}
		 * @param data {string}
		 * @param callback {Function}
		 */
		parseDependencies: function (pathname, data, callback) {
			var config = this._config,
				loader = config.loader,
				full = config.level === 'full',
				deps = [],
				pathnames = [],
				self = this;

			data = data.replace(PATTERN_COMMENT, '');

			PATTERN_REQUIRE.lastIndex = 0;

			while (re = PATTERN_REQUIRE.exec(data)) { // Assign.
				deps.push(re[1] + (re[2] || ''));
				pathnames.push(re[1]);
			}

			pathnames = full ? pathnames.filter(function (value) {
				return !PATTERN_VAR.test(value);
			}) : [];

			loader.load(pathnames, function (files) {
				try {
					pathnames.forEach(function (pathname) {
						deps = deps.concat(readDependencies(pathname, files[pathname]));
					});
					callback(unique(deps));
				} catch (err) {
					self.emit('error', err);
				}
			});
		}
	});

module.exports = Compiler;
