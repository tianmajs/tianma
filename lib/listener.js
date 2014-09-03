'use strict';

var fs = require('fs'),
	path = require('path'),
	pegasus = require('pegasus');
	
var FILTER_DIR = './filter/',

	FILTERS = fs.readdirSync(path.join(__dirname, 'filter'));
	
/**
 * Create a pegasus listener.
 * @param charset {string}
 * @return {Function}
 */
function create(charset) {
	var listener = pegasus({
		charset: charset,
		detailedError: true
	});

	return equip(listener);
}

/**
 * Equip all filters.
 * @param listener {Object}
 * @return {Object}
 */
function equip(listener) {
	var use = listener.use;
	
	FILTERS.forEach(function (name) {
		listener[name] = function () {
			var filter = require(FILTER_DIR + name);
			
			use(filter.apply(null, arguments));
			
			return listener;
		};
	});
	
	return listener;
}

exports.create = create;