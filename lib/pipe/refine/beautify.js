/**
 * Tianma - Pipe - Refine - Beautify
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var beautifier = require('./beautifier'),
	custom = require('./custom');

var STAMP = '/*@beautified*/',

	/**
	 * Pipe function factory.
	 */
	beautify = function () {
		return custom({
			'text/css': beautifyCSS,
			'text/javascript': beautifyJS,
			'application/x-javascript': beautifyJS,
			'application/javascript': beautifyJS
		});
	},

	/**
	 * Beautify JS using jsbeautifier.
	 * @param data {string}
	 * @return {string}
	 */
	beautifyJS = function (data) {
		if (data.indexOf(STAMP) === -1) {
			return STAMP
				+ '\n'
				+ beautifier.jsBeautify(data);
		} else {
			return data;
		}
	},

	/**
	 * Beautify CSS using cssbeautifier.
	 * @param data {string}
	 * @return {string}
	 */
	beautifyCSS = function (data) {
		if (data.indexOf(STAMP) === -1) {
			return STAMP
				+ '\n'
				+ beautifier.cssBeautify(data);
		} else {
			return data;
		}
	};

module.exports = beautify;