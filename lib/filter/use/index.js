'use strict';

var util = require('mini-util'),
	npm = require('../../util/npm');

module.exports = function () {
	var options = util.toArray(arguments),
		id = options.shift(),
		pending = [],
		filter = null;
		
	if (util.isFunction(id)) { // Use function as a filter.
		return id;
	}
	
	function create(factory) {
		filter = factory.apply(null, options);
		run();
	}
	
	function run() {
		if (filter) {
			while (pending.length !== 0) {
				filter.apply(null, pending.shift());
			}
		}
	}
	
	npm.load(id, function (err, exports) {
		if (err) {
			err.code = 'ENPM';
			err.vars = [ id ];
			throw err;
		} else {
			create(exports);
		}
	});

	return function () {
		pending.push(util.toArray(arguments));
		run();
	};
};