#! /usr/bin/env node

'use strcit';

var commander = require('commander'),
	bootstrap = require('./bootstrap'),
	nodectl = require('./nodectl'),
	version = require('../package.json').version;

var caught = false;

commander
	.command('start [config]')
	.description('Start as a background service')
	.action(function (config) {
		caught = true;
		bootstrap(function () {
			nodectl.start(config || 'config.js');
		});
	});

commander
	.command('stop')
	.description('Stop current service')
	.action(function (config) {
		caught = true;
		bootstrap(function () {
			nodectl.stop();
		});
	});

commander
	.command('restart')
	.description('Restart current service')
	.action(function (config) {
		caught = true;
		bootstrap(function () {
			nodectl.restart();
		});
	});

commander
	.usage('[command] [config]')
	.version(version)
	.parse(process.argv);

if (!caught) {
	bootstrap(function () {
		nodectl.run(commander.args[0] || 'config.js');
	});
}
