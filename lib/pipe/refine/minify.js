/**
 * Tianma - Pipe - Refine - Minify
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var css = require('clean-css'),
	custom = require('./custom'),
	js = require('jsmin');

var PATTERN_DEPS = /(?:\/\/\s*#import\s+([\w\/-]+\.js).*$|^\/\/\s#require\s<([\w\/-]+\.js)>$)/gm,

	/**
	 * Minify JS using jsmin.
	 * @param config {Object}
	 * @param data {string}
	 * @return {string}
	 */
	minifyJS = function (data) {
		var imported = [],
			required = [],
			re;

		PATTERN_DEPS.lastIndex = 0;

		while (re = PATTERN_DEPS.exec(data)) { // Assign.
			re[1] && imported.push(re[1]);
			re[2] && required.push(re[2]);
		}

		try {
			data = js.jsmin(data);
		} catch (err) { // Refine error message.
			throw new Error(err.trim().replace('Error: ', ''));
		}

		return imported // Restore dependencies comments.
			.map(function (value) {
				return '// #import ' + value;
			}).join('\r\n') + required
			.map(function (value) {
				return '// #require <' + value + '>';
			}).join('\r\n') + data;
	},

	/**
	 * Minify CSS using clean-css.
	 * @param data {string}
	 * @return {string}
	 */
	minifyCSS = function (data) {
		return css.process(data);
	},

	/**
	 * Pipe function factory.
	 * @param config {Object}
	 */
	minify = function (config) {
		return custom({
			'.css': minifyCSS,
			'.js': minifyJS
		});
	};

module.exports = minify;