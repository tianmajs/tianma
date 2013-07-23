var path = require('path');

	/**
	 * Generate and print NODE_PATH.
	 */
var libpath = function () {
		var nodePath = process.env['NODE_PATH'],
			pathname = path.join(__dirname, '../bridge/'),
			separator = process.platform === 'win32' ?
				';' : ':';

		nodePath = nodePath ? nodePath.split(separator) : [];

		if (nodePath.indexOf(pathname) === -1) {
			nodePath = nodePath.concat(pathname);
		}

		console.log(nodePath.join(separator));
	};

module.exports = libpath;
