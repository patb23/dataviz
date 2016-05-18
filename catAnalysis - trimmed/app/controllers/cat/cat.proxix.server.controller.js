/**
 * Created by pmeenaks on 7/29/2015.
 */

var _ = require('lodash'),
  memoize = require('memoize'),
  soap = require('soap'),
  http = require('http'),
  wsdlUrl = 'http://www.proxixnetwork.com/gsert/PxPointGeocode.asmx?WSDL';

var getSessionId = function (username, password,  callback) {
  soap.createClient(wsdlUrl, function (err, client) {
    //console.log('Inside soap client');

    var args = {"username": username, "password": password};
    client.PxPointGeocode.PxPointGeocodeSoap.Authenticate(args, function (err, result) {
      if (err) {
        return callback(err);
      }
      //console.log('inside soap client' + result.AuthenticateResult.SessionID);
      callback(null, result.AuthenticateResult.SessionID);
    })
  });
};

var getSessionIdCached = memoize(getSessionId, {async: true,maxAge:900000});

var geocode = function (req, res) {
  getSessionIdCached('aigtest', 'gia123', function (err, sessionId) {
    if (err) {
      //do some error handling, and probably return
    }
    res.jsonp(sessionId);
  });
};


exports.authenticate = geocode;



