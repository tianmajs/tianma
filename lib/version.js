/**
 * Tianma - Version
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var number = require('../package.json').version,
	parts = number.split('.');

// Full version number.
exports.number = number;

// Major version number.
exports.major = parts[0];

// Minor version number.
exports.minor = parts[1];

// Patch version number.
exports.patch = parts[2];