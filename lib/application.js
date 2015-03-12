'use strict';

var bl = require('bl'),
    fs = require('fs'),
    http = require('http'),
    milu = require('milu'),
    Request = require('./request'),
    Response = require('./response');

// Generate the MAGIC verb.
var verb = (function () {
    var PATTERN = /^tianma-(.*)$/,
        re,
        verb = {};

    module.paths.forEach(function (p) {
        if (fs.existsSync(p)) {
            fs.readdirSync(p).forEach(function (name) {
                if (re = name.match(PATTERN)) { // Assign.
                    verb[toCamel(re[1])] = function () {
                        // Lazy require.
                        return require(name).apply(this, arguments);
                    };
                }
            });
        }
    });

    return verb;
}());

/**
 * Convert "foo-bar" to "fooBar".
 * @param name {string}
 * @return {string}
 */
function toCamel(name) {
    name = name.split('-').map(function (part) {
        return part[0].toUpperCase() + part.substring(1);
    }).join('');

    name = name[0].toLowerCase() + name.substring(1);

    return name;
}

/**
 * Prepare the high-level request & response object.
 * @param next {Function}
 * @param done {Function}
 */
function prepare(next, done) {
    var req = this.request,
        res = this.response,

        url = (req.connection.encrypted ? 'https:' : 'http:')
            + '//' + req.headers.host + req.url,

        context = this;

    req.pipe(bl(function (err, data) {
        if (err) {
            done(err);
        } else {
            context.request = new Request({
                url: url,
                method: req.method,
                ip: req.client.remoteAddress,
                headers: req.headers,
                data: [ data ]
            });

            context.response = new Response({});

            next(done);
        }
    }));
}

/**
 * Create the root node.
 * @param [port] {number}
 * @return {Object}
 */
module.exports = function (port) {
    var root = milu(verb).use(prepare),
        run = root.run;

    root.run = function (req, res, callback) {
        run({
            request: req,
            response: res
        }, callback || function (err) {
            var response = this.response;

            if (err) {
                res.writeHead(500);
                res.end(err.stack);
            } else {
                res.writeHead(response.status(),
                    response.head('content-length', '').head());
                bl(response.__.data).pipe(res);
            }
        });
    };

    if (port) {
        http.createServer(root.run).listen(parseInt(port, 10));
    }

    return root;
};
