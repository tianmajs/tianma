/**
 * Configure your website here.
 */

var tianma = require('tianma'),
	pipe = tianma.pipe;

tianma
	.createHost({ port: 80 })
		.mount('/', [
			pipe.static({ root: './htdocs' })
		])
		.start();
