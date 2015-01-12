'use strict';

var is = require('type-is').is,
	mime = require('mime-types'),
	mu = require('mini-util'),
	readable = require('./readable');

	// Message constructor.
var Message = mu.inherit(Object, {
	/**
	 * Constructor.
	 * @param config {Object}
	 */
	constructor: function (config) {
		// Private data stores here.
		Object.defineProperty(this, '__', {
			value: {
				headers: config.headers || {},
				data: config.data || ''
			}
		});
		
		this.data = this.data.bind(this);
	},

	/**
	 * Get/Set the message data.
	 * @param [value] {string|Buffer|Array}
	 * @return {Buffer|Object}
	 */
	data: function (value) {
		var __ = this.__,
			self = this,
			chunks = [],
			callback;

		if (mu.isUndefined(value)) { // Getter.
			value = __.data;
			
			if (!mu.isStream(value)) {
				value = readable(value);
			}
			
			return value;
		} else if (mu.isFunction(callback = value)) { // Collector.
			value = __.data;

			if (!mu.isStream(value)) {
				callback(null, value);
			} else {
				value.on('data', function (chunk) {
					chunks.push(chunk);
				});
				
				value.on('end', function () {
					value = mu.isString(chunks[0]) ?
						chunks.join('') : Buffer.concat(chunks);
					self.data(value);
					callback(null, value);
				});
				
				value.on('error', function (err) {
					callback(err);
				});
			}
			
			return this;
		} else { // Setter.
			if (!mu.isStream(value) && !mu.isBuffer(value)) {
				value = String(value);
			}
			
			__.data = value;

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
		
		if (mu.isUndefined(key)) { // Get all fields.
			// Make a copy.
			return mu.merge(headers);
		}
		
		if (mu.isObject(key)) { // Set multiple fields.
			obj = key;
			for (key in obj) {
				this.head(key, obj[key]);
			}
			return this;
		}
		
		key = key.toLowerCase();
		
		if (mu.isUndefined(value)) { // Get one field.
			return headers[key] || '';
		} else {
			if (value === '') { // Remove one field.
				delete headers[key];
			} else if (mu.isArray(value)) {// Set one field.
				headers[key] = value.map(String);
			} else { // Set one field.
				headers[key] = String(value);
			}
			
			return this;
		}
	},
	
	/**
	 * Infer the content-type.
	 * @param ... {string}
	 * @return {string|boolean}
	 */
	is: function () {
		return is(this.head('content-type'), mu.toArray(arguments));
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
