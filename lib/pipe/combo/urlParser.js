/**
 * Tianma - Pipe - Combo - URLParser
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var path = require('path'),
	qs = require('querystring'),
	util = require('pegasus').util;

var PATTERN_V1_URL = /^\/(.*?)(\|MODERN_BROWSER|\|OLD_BROWSER)?(\|v_[a-f0-9]+_[a-f0-9]+)?(\.js|\.css)(?:\?.*)?$/,

	PATTERN_V2_URL = /^\/(.*?)\?\?(.*?)(?:\?(.*))?$/,

	PATTERN_V2_FILES = /^[^,]+?(\.js|\.css)(?:,[^,]+?\1)*$/,

	/**
	 * Parse unicorn style url.
	 * @param re {Object}
	 * @return {Object}
	 */
	parseV1 = function (re) {
		var pathnames, extname,
			// $base will be replaced with 'css/' or 'js/5v/' when loading.
			base = '$base/',
			// Deprecated unicorn global file is hard coded.
			global = 'lib/ae/debug/global-img-server',
			params = {};

		if (re[2]) { // Extract version info.
			params.ver = re[2].substring(1);
		}

		if (re[3]) { // Extract browser info.
			params.ua = re[3].substring(1);
		}

		extname = re[4];

		pathnames = (extname === '.js' ? [ global ] : [])
			.concat(re[1].split('|'))
			.filter(function (value, index, arr) { // Remove duplication.
				return index === arr.indexOf(value);
			})
			.map(function (value) { // Prepend base and attach extname.
				return base + value + extname;
			});

		return {
			pathnames: pathnames,
			params: params
		};
	},

	/**
	 * Parse nginx style url.
	 * @param re {Object}
	 * @return {Object}
	 */
	parseV2 = function (re) {
		var base = re[1],
			params = qs.parse(re[3] || ''),
			pathnames;

		util.each(params, function (value, key, obj) {
			if (value === '') {
				obj[key] = true;
			}
		});

		pathnames = re[2].split(',')
			.filter(function (value, index, arr) { // Remove duplication.
				return index === arr.indexOf(value);
			})
			.map(function (value) { // Prepend base.
				return base + value;
			});

		return {
			pathnames: pathnames,
			params: params
		};
	},

	/**
	 * Parse url.
	 * @param url {string}
	 * @return {Object|null}
	 */
	parse = function (url) {
		var re;

		if (url.indexOf('|') !== -1) { // unicorn style url.
			re = url.match(PATTERN_V1_URL);
			if (re) {
				return parseV1(re);
			}
		} else if (url.indexOf('??') !== -1) { // nginx style url.
			re = url.match(PATTERN_V2_URL);
			if (re && PATTERN_V2_FILES.test(re[2])) {
				return parseV2(re);
			}
		} else { // Convert to nginx style url and retry.
			re = url.replace('/', '/??').match(PATTERN_V2_URL);
			if (re && PATTERN_V2_FILES.test(re[2])) {
				return parseV2(re);
			}
		}

		return null;
	};

exports.parse = parse;
