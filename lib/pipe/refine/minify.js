/**
 * Tianma - Pipe - Refine - Minify
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var custom = require('./custom'),
	minifier = require('./minifier');

var PATTERN_DEPENDENCIES = /^\s*\/[\/\*]\s*#(?:import|require)\b.*$/gm,

	STAMP = '/*@minified*/',

	/**
	 * Extract dependencies comments.
	 * @param data {string}
	 * @return {Array}
	 */
	extractComments = function (data) {
		var comments = [],
			re;

		PATTERN_DEPENDENCIES.lastIndex = 0;

		while (re = PATTERN_DEPENDENCIES.exec(data)) { // Assign.
			comments.push(re[0].trim());
		}

		return comments;
	},

	/**
	 * Minify JS using jsmin.
	 * @param data {string}
	 * @return {string}
	 */
	minifyJS = function (data) {
		var comments;

		if (data.indexOf(STAMP) === -1) {
			comments = extractComments(data);

			// Restore dependencies comments.
			return STAMP
				+ '\n'
				+ (comments.length > 0 ? comments.join('\n') + '\n' : '')
				+ minifier.jsmin(data);
		} else {
			return data;
		}
	},

	/**
	 * Minify CSS using cssmin.
	 * @param data {string}
	 * @return {string}
	 */
	minifyCSS = function (data) {
		var comments;

		if (data.indexOf(STAMP) === -1) {
			comments = extractComments(data);

			// Restore dependencies comments.
			return STAMP
				+ '\n'
				+ (comments.length > 0 ? comments.join('\n') + '\n' : '')
				+ minifier.cssmin(data);
		} else {
			return data;
		}
	},

	/**
	 * Pipe function factory.
	 */
	minify = function () {
		return custom({
			'text/css': minifyCSS,
			'text/javascript': minifyJS,
			'application/x-javascript': minifyJS,
			'application/javascript': minifyJS
		});
	};

module.exports = minify;