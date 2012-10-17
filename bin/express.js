/**
 * Tianma - Bin - Express
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var tianma = require('tianma'),
	pipe = tianma.pipe;

	/**
	 * Run express service at dir.
	 * @param dir {string}
	 * @param silent {boolean}
	 * @param log {boolean}
	 */
var express = function (dir, silent, log) {
		process.chdir(dir);

		tianma
			.init({ silent: silent, log: log })
			.createHost({ port: 80, portssl: 443 })
				.mount('/', [
					pipe.static({ wwwroot: './' })
				])
				.start();
	};

module.exports = express;