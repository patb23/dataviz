/**
 * Created by pmeenaks on 8/4/2015.
 */

var _ = require('lodash'),
  kmlFileDir = './data/',
  toGeoJson = require('togeojson'),
  cheerio = require('cheerio'),
  fs = require('fs'),
  $= require('jquery'),
  xmldom = require('xmldom'),
  memoize = require('memoize');

var toDom = function (str) {
  if (typeof DOMParser === 'undefined') {
    return (new xmldom.DOMParser()).parseFromString(str.toString());
  } else {
    return (new DOMParser()).parseFromString(str, 'text/xml');
  }
};
var xml = function(str, options){

  options = _.extend({xmlMode:true}, options);
  var dom = cheerio.load(str, options);
  var domObj =toDom(dom.xml());
  return domObj;
};


var getGeoJson = function (kmlFile, callback) {

  var file = kmlFileDir + kmlFile;
  var kml = xml(fs.readFileSync(file, 'utf-8'), {
    normalizeWhitespace: true,
    xmlMode: true
  });

  var converted = toGeoJson.kml(kml);
  var trimmedJson ={'type': 'FeatureCollection', 'features':[]};

  converted.features.forEach(function(item, index, array){


    var fireName = item.properties.name;
    if(fireName && (_.startsWith(fireName, 'CA') || _.startsWith(fireName, 'WA') ) &&_.startsWith(item.geometry.type,'Polygon') ){
      //item.properties.description='';
      trimmedJson.features.push(item);
      //console.log('get GeoJSON complete');
    }


  });
  callback(null,trimmedJson);

};
var cachedKml = memoize(getGeoJson, {async: true, maxAge: 90000000});


exports.activeFires = function (req, res) {


  cachedKml('ActiveFirePerimeters.kml', function (err, result) {
    if(err)console.log('error ' + err);
    res.jsonp(result);
  });


}




