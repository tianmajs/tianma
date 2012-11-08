/**
 * Tianma - Pipe - Combo - DependenciesParser
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var path = require('path');

var PATTERN_IMPORT = /\/\/\s*#import\s+([\w\/-]+\.js).*$/gm,

	PATTERN_REQUIRE = /^\/\/\s#require\s<([\w\/-]+\.js)>$/gm,

	PATTERN_OPTIONAL = /^\/\/\s#optional\s<(.*?)>$/gm,

	PATTERN_TS = /#ts\("(.*?)"\)/g,

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
				.replace(PATTERN_REQUIRE, function ($0, $1) {
					deps.push($1);

					return ''; // Remove dependency comments.
				})
				.replace(PATTERN_OPTIONAL, function ($0, $1) {
					// Skip optional dependency in dev mode.

					return ''; // Remove dependency comments.
				})
				.replace(PATTERN_TS, function ($0, $1) {
					return '0.0'; // Return fake time stamp.
				});
		}

		file.deps = deps;

		return file;
	};

exports.parse = parse;
