/**
 * Tianma - Bin - LibPath
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var path = require('path');

	/**
	 * Generate and print NODE_PATH.
	 */
var libpath = function () {
		var nodePath = process.env['NODE_PATH'],
			current = path.join(__dirname, '../../'),
			separator = process.platform === 'win32' ?
				';' : ':';

		nodePath = (nodePath ? nodePath.split(separator) : [])
			.concat(current).join(separator);

		console.log(nodePath);
	};

module.exports = libpath;