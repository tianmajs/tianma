/**
 * Tianma - Pipe - Refine - Beautify
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var beautifier = require('beautifier'),
	custom = require('./custom');

	/**
	 * Beautify JS using jsbeautifier.
	 * @param data {string}
	 * @return {string}
	 */
var	beautifyJS = function (data) {
		return beautifier.js_beautify(data);
	},

	/**
	 * Beautify CSS using cssbeautifier.
	 * @param data {string}
	 * @return {string}
	 */
	beautifyCSS = function (data) {
		return beautifier.css_beautify(data);
	},

	/**
	 * Pipe function factory.
	 * @param config {Object}
	 */
	beautify = function (config) {
		return custom({
			'.css': beautifyCSS,
			'.js': beautifyJS
		});
	};

module.exports = beautify;