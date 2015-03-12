'use strict';

var is = require('type-is').is,
    mime = require('mime-types'),
    util = require('mini-util');

    // Message constructor.
var Message = util.inherit(Object, {
    /**
     * Constructor.
     * @param config {Object}
     */
    constructor: function (config) {
        // Private data stores here.
        Object.defineProperty(this, '__', {
            value: {
                headers: config.headers || {},
                data: config.data || [ new Buffer(0) ]
            }
        });
    },

    /**
     * Get/Set the message data.
     * @param [value] {string|Buffer|Array}
     * @return {Buffer|Object}
     */
    data: function (value) {
        if (util.isUndefined(value)) { // Getter.
            return Buffer.concat(this.__.data);
        } else { // Setter.
            value = [].concat(value).map(function (value) {
                return util.isBuffer(value) ?
                    value : new Buffer(String(value));
            });

            this.__.data = value;

            return this;
        }
    },

    /**
     * Get/Set the message header fields.
     * @param [key] {string|Object}
     * @param [value] {string|Array}
     * @return {string|Object}
     */
    head: function (key, value) {
        var headers = this.__.headers,
            obj;

        if (util.isUndefined(key)) { // Get all fields.
            // Make a copy.
            return util.merge(headers);
        }

        if (util.isObject(key)) { // Set multiple fields.
            obj = key;
            for (key in obj) {
                this.head(key, obj[key]);
            }
            return this;
        }

        key = key.toLowerCase();

        if (util.isUndefined(value)) { // Get one field.
            return headers[key] || '';
        } else {
            if (value === '') { // Remove one field.
                delete headers[key];
            } else if (util.isArray(value)) {// Set one field.
                headers[key] = value.map(String);
            } else { // Set one field.
                headers[key] = String(value);
            }

            return this;
        }
    },

    /**
     * Infer the content-type.
     * @param types {Array|string...}
     * @return {string|boolean}
     */
    is: function (types) {
        if (!util.isArray(types)) {
            types = util.toArray(arguments);
        }

        return is(this.type(), types);
    },

    /**
     * Get/Set the message type.
     * @param [key] {string|Object}
     * @param [value] {string|Array}
     * @return {string|Object}
     */
    type: function (value) {
        if (value) { // Setter.
            value = mime.contentType(String(value)) || '';

            if (value.indexOf('charset=') !== -1) {
                value = value.split(';')[0];
            }

            this.head('content-type', value);

            return this;
        } else { // Getter.
            return this.head('content-type').split(';')[0];
        }
    }
});

module.exports = Message;
