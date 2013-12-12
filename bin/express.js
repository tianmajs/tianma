var tianma = require('tianma'),
	pipe = tianma.pipe;

	/**
	 * Run express service.
	 * @param dir {string}
	 */
var express = function (dir) {
		process.chdir(dir);

		tianma
			.createHost({ port: 80 })
				.mount('/', [
					pipe.static({ wwwroot: './' })
				])
				.start();

		console.log('Press [Ctrl+C] to stop service..');
	};

module.exports = express;
