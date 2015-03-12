'use strict';

var accepts = require('accepts'),
    cookie = require('cookie'),
    qs = require('querystring'),
    url = require('url'),
    util = require('mini-util'),
    Message = require('./message');

var URL_PARTS = [
    'protocol',
    'auth',
    'host',
    'port',
    'hostname',
    'pathname',
    'search',
    'path',
    'hash'
];

var ACCEPTS = {
    'accepts'          : 'types',
    'acceptsEncodings' : 'encodings',
    'acceptsCharsets'  : 'charsets',
    'acceptsLanguages' : 'languages'
};

// Request constructor.
var Request = util.inherit(Message, {
    /**
     * Constructor.
     * @param config {Object}
     */
    constructor: function (config) {
        Message.apply(this, arguments);

        this.__.method = config.method || 'GET';
        this.__.ip = config.ip || '0.0.0.0';
        this.__.url = url.parse(config.url || '', false, true);
    },

    /**
     * Get the parsed query object.
     * @return {Object}
     */
    get query() {
        return qs.parse(this.__.url.query || '');
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
        if (value) { // Setter.
            this.__.url.parse(String(value), false, true);
            return this;
        } else { // Getter.
            return this.__.url.href || '';
        }
    }
});

// Define the URL properties Getter.
URL_PARTS.forEach(function (key) {
    Object.defineProperty(Request.prototype, key, {
        get: function () {
            return this.__.url[key] || '';
        }
    });
});

// Define the accepts-series function.
util.each(ACCEPTS, function (value, key) {
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
