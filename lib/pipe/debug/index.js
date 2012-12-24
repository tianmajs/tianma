/**
 * Tianma - Pipe - Debug
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var pegasus = require('pegasus');

var PATTERN_YUI = /(YAHOO\.register\(\s*['"]event['"].*?\);)/m,

	PATTERN_HOZ = /(\s*\}\s*\(\s*this\s*,\s*['"]AE['"]\s*\)\s*\)\s*\;)/m,

	PATTERN_DEBUG = /\/\*@debug\b([\s\S]*?)\*\//gm,

	contentTypes = [
		'text/javascript',
		'application/x-javascript',
		'application/javascript'
	],

	/**
	 * Turn on the switch.
	 * @param source {string}
	 * @return {string}
	 */
	switchOn = function (source) {
		return source
			.replace(PATTERN_YUI,
				'$1\r\nYAHOO.util.Event.throwErrors = true;')
			.replace(PATTERN_HOZ,
				'$1\r\nAE.use("hoz",function(hoz){hoz.config({debug:true});});');
	},

	/**
	 * Active debug code.
	 * @param source {string}
	 * @return {string}
	 */
	active = function (source) {
		return source
			.replace(PATTERN_DEBUG, '$1');
	},

	/**
	 * Pipe function factory.
	 * @param config {Object}
	 */
	debug = pegasus.createPipe({
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			// Need not to configurate.
		},

		/**
		 * Check whether to process current request.
		 * @param request {Object}
		 * @param response {Object}
		 * @return {boolean}
		 */
		fit: function (request, response) {
			return response.status() === 200 ||
				contentTypes.indexOf(response.head('content-type')) !== -1;
		},

		/**
		 * Pipe function entrance.
		 * @param request {Object}
		 * @param response {Object}
		 */
		main: function (request, response) {
			var source = response.body();

			response
				.clear()
				.write(active(switchOn(source)));

			this.next();
		}
	});

module.exports = debug;
