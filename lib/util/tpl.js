'use strict';

var LRU = require('lru-cache'),
	hash = require('./hash');

var PATTERN_BACK_SLASH = /\\/g,
	PATTERN_LITERAL = /%>([\s\S]*?)<%/gm,
	PATTERN_QUOTE = /"/g,
	PATTERN_CR = /\r/g,
	PATTERN_LF = /\n/g,
	PATTERN_TAB = /\t/g,
	PATTERN_EXP = /<%=(.*?)%>/g;
	
var	cache = LRU(1024);

/**
 * Compile a template.
 * @param tpl {string}
 * @return {Function}
 */
function compile(tpl) {
	return new Function(
		'data',
		'var __=[],write=function(){__.push.apply(__,arguments);};' +
		'with(data){' +
			('%>' + tpl + '<%')
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
				.replace(PATTERN_LITERAL, '__.push("$1");') +
		'}return __.join("");'
	);
}

/**
 * Get compiled template, or render template with data.
 * @param tpl {string}
 * @param data {Object}
 * @return {string}
 */
module.exports = function (tpl, data) {
	var key = hash(tpl),
		fn = cache[key];
		
	if (!fn) {
		fn = cache[key] = compile(tpl)
	}
	
	return data ? fn(data) : fn;
};
