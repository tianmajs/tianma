'use strict';

var	util = require('mini-util'),
	zlib = require('zlib');

/**
 * Filter factory.
 * @param [...] {string}
 * @return {Function}
 */
module.exports = function () {
	var types = util.toArray(arguments);
	
	if (types.length === 0) {
		types = [ 'js', 'css', 'html' ];
	}

	return function (req, res) {
		var enc = req.acceptsEncodings('gzip', 'deflate');
		
		req(function (err) {
			var match = !err
				&& enc
				&& res.status() === 200
				&& res.is.apply(res, types);
		
			if (match) {
				zlib[enc](res.data(), function (err, data) {
					if (err) {
						res(err);
					} else {
						res.head('content-encoding', enc)
							.data(data)();
					}
				});
			} else {
				res(err);
			}
		});
	};
};
