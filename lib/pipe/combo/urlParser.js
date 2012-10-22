/**
 * Tianma - Pipe - Combo - URL
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var path = require('path'),
	qs = require('querystring'),
	util = require('tianma').util;

var PATTERN_V1_URL = /^\/(.*?)(\|MODERN_BROWSER|\|OLD_BROWSER)?(\|v_[a-f0-9]+_[a-f0-9]+)?(\.js|\.css)/,

	PATTERN_V2_URL = /^\/(.*?)\?\?(.*?)(?:\?(.*))?$/,

	PATTERN_V2_EXTNAME = /^\.(?:js|css)$/,

	/**
	 * Parse old unicorn URL.
	 * @param url {string}
	 * @param prefix {Object}
	 * @return {Object|null}
	 */
	parseV1 = function (url, prefix) {
		var re = url.match(PATTERN_V1_URL),
			pathnames, extname,
			params = {};

		if (re) {
			pathnames = re[1].split('|');

			if (re[2]) { // Extract version info.
				params.ver = re[2].substring(1);
			}

			if (re[3]) { // Extract browser info.
				params.ua = re[3].substring(1);
			}

			extname = re[4];

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

	/**
	 * Parse URL.
	 * @param url {string}
	 * @param prefix {Object}
	 * @return {Object|null}
	 */
	parse = function (url, prefix) {
		if (url.indexOf('??') !== -1) {
			return parseV2(url); // nginx style url needn't prefix.
		} else if (url.indexOf('|') !== -1) {
			return parseV1(url, prefix);
		} else { // Convert normal url to nginx style url.
			return parseV2(url.replace('/', '/??'));
		}
	};

exports.parse = parse;