var path = require('path');

	/**
	 * Generate and print NODE_PATH.
	 */
var libpath = function () {
		var nodePath = process.env['NODE_PATH'],
			pathnames = [
				path.join(__dirname, '../../'),
				path.join(__dirname, '../node_modules/')
			],
			separator = process.platform === 'win32' ?
				';' : ':';

		nodePath = nodePath ? nodePath.split(separator) : [];

		pathnames.forEach(function (pathname) {
			if (nodePath.indexOf(pathname) === -1) {
				nodePath = nodePath.concat(pathname);
			}
		});

		console.log(nodePath.join(separator));
	};

module.exports = libpath;
