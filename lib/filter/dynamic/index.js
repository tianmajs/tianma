'use strict';

var util = require('mini-util'),
	tpl = require('../../util/tpl');

/**
 * Render a template.
 * @param data {string}
 * @param context {Object}
 * @param callback {Function}
 */
function render(data, context, callback) {
	try {
		data = tpl(data, context);
	} catch (err) {
		return callback(err);
	}
	
	callback(null, data);
}

/**
 * Filter factory.
 * @param [context] {Function}
 * @return {Function}
 */
module.exports = function (context) {
	var ctx = util.isFunction(context) ?
			context : function () { return context; };
	
	return function (req, res) {
		req(function (err) {
			if (!err && res.is('html')) {
				render(res.toString(), ctx(req, res), function (err, data) {
					if (err) {
						res(err);
					} else {
						res.head('last-modified', new Date().toGMTString())
							.data(data)();
					}
				});
			} else {
				res(err);
			}
		});
	};
};
