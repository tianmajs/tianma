/**
 * Tianma - Pipe - Combo - DependenciesManager
 * Copyright(c) 2010 ~ 2012 Alibaba.com, Inc.
 * MIT Licensed
 */

var AliasManager = require('./aliasManager'),
	util = require('tianma').util;

var PATTERN_EXTNAME = /\.[a-z]+$/i,

	/**
	 * Resolve alias.
	 * @param node {string|Array}
	 * @param map {Object}
	 * @return {Array}
	 */
	resolve = function (node, map) {
		var parts, first;

		map = map || {};

		if (util.isArray(node)) {
			return node.map(function (node) {
				return resolve(node, map);
			});
		}

		parts = node.split('/');
		first = parts[0];

		if (map.hasOwnProperty(first)) {
			parts[0] = map[first];
		}

		node = parts.join('/');

		if (!PATTERN_EXTNAME.test(node)) { // Append default extname.
			node += '.js';
		}

		return node;
	},

	/**
	 * Get full dependencies.
	 * @param node {Array}
	 * @param callback {Function}
	 * @param fileLoader {Object}
	 * @param depsParser {Function}
	 * @param aliasMgr {Object}
	 * @param cache {Function}
	 * @param [defaultMap] {Object}
	 * @param [footprint] {Array}
	 */
	travel = function (nodes, callback, fileLoader, depsParser, aliasMgr, cache, defaultMap, footprint) {
		var visited = [];

		footprint = footprint || []; // Initiate for the first time.

		(function next(i) {
			var node,
				pathname;

			if (i < nodes.length) {
				node = nodes[i];
				pathname = resolve(node, defaultMap);

				if (cache[pathname]) { // Use cached dependencies info.
					// Visited nodes includes current node.
					visited = visited.concat(cache[pathname], node);

					// Visit next node.
					next(i + 1);
				} else if (footprint.indexOf(pathname) !== -1) { // Find circular dependencies.
					callback(new Error(
						'Circular dependencies found: ' +
						footprint.join(' -> ') + ' -> ' + pathname
					));
				} else { // Visit current node.
					aliasMgr.lookup(pathname, function (err, currentMap) { // Get current alias map.
						if (err) {
							callback(err);
						} else {
							// Move forward.
							footprint.push(pathname);

							fileLoader.load([ pathname ], function (err, datum) { // Read file content for parsing dependencies.
								if (err) {
									callback(err);
								} else { // Visit child nodes.
									travel(depsParser(datum[0], pathname), function (err, nodes) {
										if (err) {
											callback(err);
										} else {
											// Move backward
											footprint.pop();

											// Cache dependencies info.
											cache[pathname] = resolve(nodes, currentMap);

											// Visited nodes includes current node.
											visited = visited.concat(cache[pathname], node);

											// Visit next node.
											next(i + 1);
										}
									}, fileLoader, depsParser, aliasMgr, cache, currentMap || defaultMap, footprint);
								}
							});
						}
					});
				}
			} else { // Finished traveling.
				callback(null, visited.filter(function (value, index, arr) {
					// Remove duplicated nodes.
					return arr.indexOf(value) === index;
				}));
			}
		}(0));
	},

	// Dependencies constructor.
	DependenciesManager = util.inherit(Object, {
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = config;
			this._cache = {};

			this._aliasMgr = new AliasManager({
				fake: !config.useAlias,
				fileLoader: config.fileLoader
			});
		},

		/**
		 * Lookup full dependencies.
		 * @param node {string|Array}
		 * @param callback {Function}
		 */
		lookup: function (nodes, callback) {
			var config = this._config,
				cache = this._cache,
				aliasMgr = this._aliasMgr,
				single = util.isString(nodes);

			travel(single ? [ nodes ] : nodes, function (err, visited) {
				if (err) {
					callback(err);
				} else {
					callback(null, single ? visited.slice(0, -1) : visited);
				}
			}, config.fileLoader, config.depsParser, aliasMgr, cache);
		}
	});

module.exports = DependenciesManager;