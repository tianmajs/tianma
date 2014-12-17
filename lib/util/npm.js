'use strict';

var fs = require('fs'),
    path = require('path'),
    semver = require('semver'),
    util = require('mini-util'),
    cp = require('child_process');

var PATTERN_ID = /^(http:\/\/.*?\/)?(.*)$/;

var options = {
        loglevel: 'silent',
        tmp: './tmp',
        prefix: process.env['TIANMA_PATH'] || path.dirname(process.argv[1])
    },

    queue = [],

    running = false;

/**
 * Load a local module.
 * @param id {string}
 * @return {Object|null}
 */
function load(id) {
    var index = id.lastIndexOf('@'),
        name, version, pkg, exports = null;

    //avoid scope parse error.
    if(index > 0){
        name = id.substring(0, index);
        version = id.substring(index + 1) || '';
    }else{
        name = id;
        version = '';
    }
    id = path.resolve(path.join(options.prefix, 'node_modules', name));
    pkg = path.join(id, 'package.json');
    try {
        if (version) {
            pkg = fs.readFileSync(pkg, 'utf-8');
            pkg = JSON.parse(pkg);

            if (!semver.satisfies(pkg.version, version)) {
                throw new Error('Version not match');
            }
        }
        exports = require(id);
    } catch (err) {
        // Not exists.
        exports = null;
    }

    return exports;
}

/**
 * Install a module.
 * @param id {string}
 * @param registry {string|null}
 * @param callback {Function}
 */
function install(id, registry, callback) {
    queue.push({
        id: id,
        callback: callback
    });

    if (!running) {
        running = true;
        (function next() {
            if (queue.length > 0) {
                var task = queue.shift(),
                    opt = util.merge(options),
                    cmd;

                console.log('Install remote module "%s"..', task.id);
                cmd = 'npm install ' + task.id;

                for (var key in opt) {
                    cmd += ' --' + key + ' ' + opt[key];
                }

                if (registry) {
                    cmd += ' --registry=' + registry;
                }

                cp.exec(cmd, function (err, stdout, stderr) {
                    task.callback(err);
                    next();
                });

            } else {
                running = false;
            }
        }());
    }
}

exports.load = function (url, callback) {

    // Change to a normal loader.
    exports.load = function (url, callback) {
        var re = url.match(PATTERN_ID),
            registry = re[1] || null,
            id = re[2],
            exports;

        // Try to load.
        exports = load(id);

        if (!exports) {
            // Install by NPM.
            install(id, registry, function (err) {
                if (err) {
                    callback(err);
                } else {
                    if (exports = load(id)) { // Assign.
                        callback(null, exports);
                    } else {
                        callback(new Error());
                    }
                }
            });
        } else { // Exists.
            callback(null, exports);
        }
    };
    // Call the normal loader.
    exports.load(url, callback);
};

