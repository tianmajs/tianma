'use strict';

var fs = require('fs'),
	path = require('path'),
	pki = require('node-forge').pki,
	hash = require('./hash');
	
var DEFAULT_CERT = fs.readFileSync(
		path.join(__dirname, '../../deploy/certificates/tianma.cer')),
		
	DEFAULT_KEY = fs.readFileSync(
		path.join(__dirname, '../../deploy/certificates/tianma.key')),
	
	ONE_YEAR = 1000 * 3600 * 24 * 365;

/**
 * Sign a certificate.
 * @param cn {string}
 * @return {Object}
 */
function sign(cn) {
	var key = pki.privateKeyFromPem(DEFAULT_KEY),
		cert = pki.createCertificate(),
		now = Date.now();
	
	cert.publicKey = pki.setRsaPublicKey(key.n, key.e);
	cert.serialNumber = hash(cn);
	
	cert.validity.notBefore = new Date(now);
	cert.validity.notAfter = new Date(now + ONE_YEAR);

	cert.setSubject([{
	  name: 'commonName',
	  value: cn
	}]);
	
	cert.setIssuer(pki.certificateFromPem(DEFAULT_CERT)
		.subject.attributes);
	
	cert.sign(key);

	return {
		key: pki.privateKeyToPem(key),
		cert: pki.certificateToPem(cert)
	};
}

exports = module.exports = sign;
exports.DEFAULT_CERT = DEFAULT_CERT;
exports.DEFAULT_KEY = DEFAULT_KEY;
