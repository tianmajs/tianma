/**
 * Default config for AENV.
 * @author: nanqiao.dengnq@alibaba-inc.com
 */

var tianma = require('tianma'),
	pipe = tianma.pipe;

tianma
	.createHost({ port: config.port || 81, portssl: config.portssl || 443 })
		.mount('*.aliunicorn.com', [
			pipe('tianma-unicorn@1.0.15', { source: 'loop://localhost/' }),
			(function (proxy) {
				return function (context, next) {
					if (context.request.protocol === 'https:') {
						proxy(context, next);
					} else {
						next();
					}
				};
			}(pipe.proxy({
				'loop://localhost/$1': /\/\/.*?\/([sw]img\/.*)/,
				'http://img.alibaba.com@42.156.172.43/$1': /\/\/.*?\/(img\/(?:portrait|company)\/.*)/
			})))
		])
		.mount('*.aliunicorn.com/version', [
			pipe.proxy({
				'http://style.aliunicorn.com@42.156.220.50/$1': /\/\/.*?\/(.*)/
			})
		])
		.mount('/', [
			pipe.static({ root: config.root || '../intl-style' }),
			pipe.proxy({
				'http://style.alibaba.com@42.156.172.43/$1': /\/\/.*?\/(.*)/
			}),
			//pipe.debug(),
			pipe('tianma-mark@0.9.7', { mode: 'test' }),
			pipe('tianma-hozdebug@0.9.1'),
			function (context, next) {
				var response = context.response,
					mime = [
						'application/vnd.ms-fontobject',
						'application/x-font-ttf',
						'font/opentype',
						'application/x-font-woff',
						'application/font-woff'
					];

				if (mime.indexOf(response.head('content-type')) !== -1) {
					context.response.head('access-control-allow-origin', '*');
				}

				next();
			}
		])
		.start();
