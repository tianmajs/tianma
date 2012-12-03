/**
 * Tianma - Pipe - Combo - DependenciesParser
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var path = require('path'),
	url = require('url');

var PATTERN_IMPORT = /^\s*\/\/\s*#import\s+([\w\/-]+\.js)\s*$/gm,

	PATTERN_REQUIRE = /^\s*\/[\/\*]\s*#require\s+(["<])([\w\/\.-]+)[">](?:\s*\*\/)?\s*$/gm,

	PATTERN_SLASH = /\\/g,

	/**
	 * Normalize pathname.
	 * @param base {string}
	 * @param pathname {string}
	 * @return {string}
	 */
	normalize = function (base, pathname) {
		return path
				.join(base, pathname)
				.replace(PATTERN_SLASH, '/'); // Correct slash under windows.
	},

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
				.replace(PATTERN_IMPORT, function (all, pathname) {
					deps.push(normalize('js/5v/', pathname));

					return ''; // Remove dependency comments.
				})
				.replace(PATTERN_REQUIRE, function (all, wrapper, pathname) {
					var root = '.';

					if (wrapper === '"') {
						root = path.dirname(file.pathname);
					}

					deps.push(normalize(root, pathname));

					return ''; // Remove dependency comments.
				});
		}

		file.deps = deps;

		return file;
	};

exports.parse = parse;
