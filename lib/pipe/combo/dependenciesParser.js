/**
 * Tianma - Pipe - Combo - DependenciesParser
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var path = require('path'),
	url = require('url');

var PATTERN_IMPORT = /\/\/\s*#(?:import|require)\s+<?([\w\/-]+\.js)>?$/gm,

	PATTERN_MACRO_REQUIRE = /#require\('(.*?)'\)/g,

	PATTERN_MACRO_OPTIONAL = /#optional\('(.*?)'\)/g,

	PATTERN_MACRO_STAMP = /#stamp\('(.*?)'\)/g,

	/**
	 * Parse unicorn style dependencies.
	 * @param file {Object}
	 * @return {Object}
	 */
	parse = function (file) {
		var extname = path.extname(file.pathname),
			deps = [];

		if (extname === '.js') { // Unicorn support js dependency only.
			file.data = file.data
				.replace(PATTERN_IMPORT, function ($0, $1) {
					deps.push('js/5v/' + $1);

					return ''; // Remove dependency comments.
				})
				.replace(PATTERN_MACRO_REQUIRE, function (all, pathname) {
					deps.push(pathname.charAt(0) === '.' ?
						decodeURI(url.resolve(file.pathname, pathname)) : pathname);

					return ''; // Remove dependency comments.
				})
				.replace(PATTERN_MACRO_OPTIONAL, function () {
					return ''; // Skip optional dependency in dev mode.
				})
				.replace(PATTERN_MACRO_STAMP, function () {
					return '0.0'; // Return fake time stamp.
				});
		}

		file.deps = deps;

		return file;
	};

exports.parse = parse;
