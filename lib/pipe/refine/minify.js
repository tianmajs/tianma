/**
 * Tianma - Pipe - Refine - Minify
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var css = require('clean-css'),
	custom = require('./custom'),
	js = require('jsmin'),
	util = require('tianma').util;

	/**
	 * Minify JS using uglify-js.
	 * @param config {Object}
	 * @param data {string}
	 * @return {string}
	 */
var	minifyJS = function (data) {
		try {
			return js.jsmin(data);
		} catch (err) { // Refine error message.
			throw new Error(err.trim().replace('Error: ', ''));
		}
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