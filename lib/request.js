'use strict';

var accepts = require('accepts'),
	cookie = require('cookie'),
	mu = require('mini-util'),
	Message = require('./message'),
	Response = require('./response');

var PATTERN_HREF = /^(\w+:)?(?:\/\/)?([^\/\?]+@)?([^\/\?\:]+?)?(:\d+)?(\/[^\?]*)?(\?.*)?$/;

var	URL_PARTS = [
	'protocol',
	'auth',
	'host',
	'port',
	'hostname',
	'search',
	'query',
	'pathname',
	'path'
];
	
var ACCEPTS = {
	'accepts'          : 'types',
	'acceptsEncodings' : 'encodings',
	'acceptsCharsets'  : 'charsets',
	'acceptsLanguages' : 'languages'
};

/**
 * A much faster query string parser than the native one.
 * @param query {string}
 * @return {Object}
 */
function parseQueryString(query) {
	var obj = {},
		parts = query.split('&'),
		i = 0,
		len = parts.length,
		kv, k, v;

	for (; i < len; ++i) {
		kv = parts[i].split('=');
		k = kv[0];
		v = decodeURIComponent(kv[1] || '');

		if (typeof obj[k] === 'undefined') {
			obj[k] = v;
		} else if (typeof obj[k] === 'string') {
			obj[k] = [ obj[k], v ];
		} else {
			obj[k].push(v);
		}
	}

	return obj;
}

/**
 * A much faster URL parser than the native one.
 * @param url {string}
 * @return {Object}
 */
function parseURL(url) {
	var re = url.match(PATTERN_HREF) || {},
		obj = {};

	obj.protocol = re[1] || '';
	obj.auth = re[2] ? re[2].split('@')[0] : '';
	obj.host = (re[3] || '') + (re[4] || '');
	obj.port = re[4] ? re[4].split(':')[1] : ''
	obj.hostname = re[3] || '';
	obj.search = re[6] || '';
	obj.query = re[6] ? parseQueryString(re[6].substring(1)) : {};
	obj.pathname = re[5] || '';
	obj.path = re[5] + (re[6] || '');
	obj.href = url;

	return obj;
}

// Request constructor.
var	Request = mu.inherit(Message, {
	/**
	 * Constructor.
	 * @param config {Object}
	 */
	constructor: function (config) {
		Message.apply(this, arguments);

		this.__.method = config.method || 'GET';
		this.__.ip = config.ip || '0.0.0.0';
		this.__.url = parseURL(config.url || '/');
	},
	
	/**
	 * Get the cookie entries.
	 * @param [key] {string}
	 * @return {string|Object}
	 */
	cookie: function (key) {
		var __ = this.__,
			cookies = __.cookies,
			raw = this.head('cookie');
		
		if (!cookies || cookies[0] !== raw) { // Stale.
			cookies = __.cookies = [ raw, cookie.parse(raw) ];
		}
		
		return key ? (cookies[1][key] || '') : cookies[1];
	},

	/**
	 * Get/Set the request method.
	 * @param [value] {string}
	 * @return {string|Object}
	 */
	method: function (value) {
		if (value) { // Setter.
			this.__.method = String(value).toUpperCase();
			return this;
		} else { // Getter.
			return this.__.method;
		}
	},

	/**
	 * Get/Set the remote address.
	 * @param [value] {string}
	 * @return {string|Object}
	 */
	ip: function (value) {
		if (value) { // Setter.
			this.__.ip = String(value);
			return this;
		} else { // Getter.
			return this.__.ip;
		}
	},

	/**
	 * Get/Set the request URL.
	 * @param [value] {string}
	 * @return {string|Object}
	 */
	url: function (value) {
		var current = this.__.url || {};

		if (value) { // Setter.
			// Parse the full or partial URL.
			value = parseURL(String(value));

			var protocol = value.protocol || current.protocol || '',
				auth = value.auth || current.auth,
				hostname = value.hostname || current.hostname || '',
				port = value.port || current.port,
				host = (auth ? auth + '@' : '')
					+ hostname
					+ (port ? ':' + port : ''),
				pathname = value.pathname || current.pathname || '/',
				search = value.search || current.search || '';

			// Assemble a full URL.
			value = protocol
				+ (host ? '//' + host : '')
				+ pathname
				+ (search === '?' ? '' : search);

			// Parse the full URL.
			this.__.url = parseURL(value);

			return this;
		} else { // Getter.
			return current.href || '';
		}
	}
});

// Define the URL properties Getter.
URL_PARTS.forEach(function (key) {
	Object.defineProperty(Request.prototype, key, {
		get: function () {
			return this.__.url[key];
		}
	});
});

// Define the accepts-series function.
mu.each(ACCEPTS, function (value, key) {
	Object.defineProperty(Request.prototype, key, {
		value: function () {
			var __ = this.__,
				accept = __.accept;
				
			if (!accept) { // Lazy initiation.
				accept = __.accept = accepts(__);
			}
		
			return accept[value].apply(accept, arguments);
		}
	});
});

module.exports = Request;
