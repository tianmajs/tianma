/*
 * Tianma - Utility
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var mime = require('mime'),
	pegasus = require('pegasus');

	// Inherit from pegasus utility.
var util = Object.create(pegasus.util),

	/**
	 * Fill template with data.
	 * Modified version of Simple JavaScript Templating
	 * John Resig - http://ejohn.org/ - MIT Licensed
	 * @param str {string}
	 * @param [data] {Object}
	 * @return {string|Function}
	 */
	tmpl = util.tmpl = (function () {
		var PATTERN_BACK_SLASH = /\\/g,
			PATTERN_LITERAL = /%>([\s\S]*?)<%/gm,
			PATTERN_QUOTE = /"/g,
			PATTERN_CR = /\r/g,
			PATTERN_LF = /\n/g,
			PATTERN_TAB = /\t/g,
			PATTERN_EXP = /<%=(.*?)%>/g,
			cache = {};

		return function (str, data) {
			var fn;

			if (!cache[str]) {
				cache[str] = new Function(
					'data',
					'var p=[],print=function(){p.push.apply(p,arguments);};' +
					'with(data){' +
						('%>' + str + '<%')
							.replace(PATTERN_LITERAL, function ($0, $1) {
								return '%>'
									+ $1.replace(PATTERN_BACK_SLASH, '\\\\')
										.replace(PATTERN_QUOTE, '\\"')
										.replace(PATTERN_CR, '\\r')
										.replace(PATTERN_LF, '\\n')
										.replace(PATTERN_TAB, '\\t')
									+ '<%';
							})
							.replace(PATTERN_EXP, '",$1,"')
							.replace(PATTERN_LITERAL, 'p.push("$1");') +
					'}return p.join("");'
				);
			}

			fn = cache[str];

			return data ? fn(data) : fn;
		};
	}()),

	/**
	 * Lookup a mime type based on extension.
	 * @param extname {string}
	 * @return {string}
	 */
	mime = util.mime = mime.lookup.bind(mime);

module.exports = util;