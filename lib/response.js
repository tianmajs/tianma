'use strict';

var cookie = require('cookie'),
    util = require('mini-util'),
    Message = require('./message');

// Response constructor.
var Response = util.inherit(Message, {
    /**
     * Constructor.
     * @param config {Object}
     */
    constructor: function (config) {
        Message.apply(this, arguments);

        this.__.status = config.status || 200;
    },

    /**
     * Write the cookie entries.
     * @param key {string|Object}
     * @param value {string}
     * @param options {Object}
     * @chaining
     */
    cookie: function (key, value, options) {
        if (util.isObject(key)) { // Batch.
            options = value;

            util.each(key, function (value, key) {
                this.cookie(key, value, options);
            }, this);

            return this;
        }

        var values = this.head('set-cookie');

        if (!util.isArray(values)) {
            values = values ? [ values ] : [ ];
        }

        values.push(cookie.serialize(key, value, options || {}));
        this.head('set-cookie', values);

        return this;
    },

    /**
     * Get/Set the response status code.
     * @param [value] {number}
     * @return {number|Object}
     */
    status: function (value) {
        if (value) { // Setter.
            this.__.status = parseInt(value, 10);
            return this;
        } else { // Getter.
            return this.__.status;
        }
    }
});

module.exports = Response;
