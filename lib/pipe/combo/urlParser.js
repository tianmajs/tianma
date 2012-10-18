/**
 * Tianma - Pipe - Combo - URL
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var path = require('path'),
	qs = require('querystring'),
	util = require('tianma').util;

var PATTERN_V1_URL = /^\/(.*?)(\.js|\.css)/,

	PATTERN_V1_VERSION = /^v_[a-f0-9]+_[a-f0-9]+$/,

	PATTERN_V1_BROWSER = /^(?:MODERN_BROWSER|OLD_BROWSER)$/,

	PATTERN_V2_URL = /^\/(.*?)\?\?(.*?)(?:\?(.*))?$/,

	PATTERN_V2_EXTNAME = /^\.(?:js|css)$/,

	/**
	 * Parse old unicorn URL.
	 * @param url {string}
	 * @param prefix {Object}
	 * @return {Object|null}
	 */
	parseV1 = function (url, prefix) {
		var re = url.indexOf('|') !== -1 && url.match(PATTERN_V1_URL),
			pathnames, extname,
			params = {};

		if (re) {
			pathnames = re[1].split('|');
			extname = re[2];

			if (PATTERN_V1_VERSION.test(pathnames[pathnames.length - 1])) { // Extract version info.
				params.ver = pathnames.pop();
			}

			if (PATTERN_V1_BROWSER.test(pathnames[pathnames.length - 1])) { // Extract browser info.
				params.ua = pathnames.pop();
			}

			pathnames = pathnames.filter(function (value, index, arr) { // Remove duplicate pathname.
				return index === arr.indexOf(value);
			}).map(function (value) { // Prepend prefix and attach extname.
				return prefix[extname] + value + extname;
			});

			return {
				pathnames: pathnames,
				params: params,
				version: '1'
			};
		} else {
			return null;
		}
	},


	/**
	 * Parse nginx combo style URL.
	 * @param url {string}
	 * @return {Object|null}
	 */
	parseV2 = function (url) {
		var re = url.match(PATTERN_V2_URL),
			accepted = !!re,
			prefix, pathnames, params;

		if (re) {
			prefix = re[1];

			pathnames = re[2].split(',').filter(function (value, index, arr) { // Remove duplicate pathname.
				return index === arr.indexOf(value);
			}).map(function (value) {
				accepted = accepted &&
					PATTERN_V2_EXTNAME.test(path.extname(value));

				// Prepend prefix.
				return prefix + value;
			});

			params = qs.parse(re[3] || '');
		}

		return accepted ? {
			pathnames: pathnames,
			params: params,
			version: '2'
		} : null;
	},

	parse = function (url, prefix) {
		if (url.indexOf('??') !== -1) {
			return parseV2(url); // nginx style url needn't prefix.
		} else {
			return parseV1(url, prefix);
		}
	};

exports.parse = parse;