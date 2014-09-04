var path = require('path'),
	tianma = require('tianma');

tianma(80)
	.mount('i.alicdn.com')
		.use('unicornis')
		.refresh({
			action: 'ucc',
			target: path.join(config.root || './assets', '$1'),
			pattern: /^\/((?:[^\/]+\/){3})/
		})
		.rewrite({
			'/$1build/$2': /^\/((?:[^\/]+\/){3})(.*)$/,
		})
		.static(config.root || './assets')
		.cache()
		.rewrite({
			'http://raw.alicdn.com@10.125.12.111/$1$2': /^\/((?:[^\/]+\/){3})build\/(.*)$/
		});