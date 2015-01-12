'use strict';

var mu = require('mini-util'),
	stream = require('stream');

var Readable = mu.inherit(stream.Readable, {
	constructor: function (data) {
		stream.Readable.call(this);
		this._chunks = [ data ];
	},
	
	_read: function () {
		var chunk = this._chunks.shift();
		
		if (chunk) {
			this.push(chunk);
		} else {
			this.push(null);
		}
	}
});

module.exports = function (data) {
	return new Readable(data);
};