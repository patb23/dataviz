/**
 * Created by pmeenaks on 7/28/2015.
 */
var _ = require('lodash'),

  common = require('../common.server.controller'),
  json2csv = require('json2csv'),
  solrPivot = require('../../models/catquery.server.model'),
  memoize = require('memoize'),
  solrClient = common.createClient();


getPolicyDetails = function(json){

  var a = {policyNumber: json.policyNumber, addressLine : json.addressLine, city:json.city, aalToPremium:json.aalToPremium } ;
  return a;

};

exports.statsByProximity=function(req,res){

  var latLng = req.param('latLong');
  solrClient.get('catAnalysis/query?q=*:*&rows=10000' +
    'json.facet= { group_by_cities: {' +
    ' type:terms, field: city, limit:-1, mincount:50, facet:{' +
    ' soil_type:{ type:terms, field:soilDesc, facet: {' +
    'fault_distance:{ type:range, ' +
    ' field:faultDistance, ' +
    'start:0,  end:3, gap:0.2, mincount:1, hardend:true, ' +
    '     facet:{ avg_premium:"avg(premium)", ' +
    '             premium_percentile:"percentile(premium,50,90,95)" } ' +
    '  } } } } } }' +
    '&fq=state:%22CA%22%20AND%20model:33%20AND%20report_date:(%222015-06-30T00:00:00Z%22)' +
    '&fq={!geofilt}&sfield=riskLocation&pt='+latLng+'&d=10', function(err, result){


    var json = JSON.parse(result);
    if(json.response.docs){
      var list = convertToCSV(json.response.docs);

      res.jsonp(getPolicyDetails(json.response.docs[0]));
    }


  });

};

exports.policy = function (req, res) {

  var latLng = req.param('latLong');
  solrClient.get('catAnalysis/query?q=latLong:' + latLng + '' +
    '&fq=report_date:(%222015-06-30T00:00:00Z%22)' +
    '&fq=state:(CA)', function (err,result) {

    var json = JSON.parse(result);
    ////console.log(json);
      if(json.response.docs){
        var pol = getPolicyDetails(json.response.docs[0]);

        res.jsonp(getPolicyDetails(json.response.docs[0]));
      }
  });


}

exports.listAddress = function (req, res) {

  var solrResponse = null;
  var str = req.param('addrStr');
  solrClient.get('catAnalysis/query?' +
    'q=addressLine:*' + str + '*&facet=on&facet.field=addressLine&rows=0', function (err, result) {

    var addressLines = [];
    var json = JSON.parse(result);
    var results = json.facet_counts.facet_fields.addressLine;

    if (results) {
      results.forEach(function (item, index, array) {
        if (!(typeof item === "number")) {
          addressLines.push(item);
        }
      });
    }
    res.jsonp(results);
  });
}

facetQuery = function (state, facet, date, callback) {


  solrClient.get('catAnalysis/query?q=*:*&' +
    'facet=on&facet.field=' + facet +
    '&rows=0&' +
    'fq=report_date:(%22' + date + '%22)' +
    '&fq=state:(' + state + ')&facet.limit=-1&json.nl=arrarr&facet.mincount=1', function (err, result) {

    //console.log('Going a fresh load of lat/long');
    var theJson = JSON.parse(result)
    // //console.log(theJson.facet_counts.facet_fields.latLong);
    var arrayObj = theJson.facet_counts.facet_fields[facet];
    callback(null, arrayObj);

  });
}

cachedFacets = memoize(facetQuery, {async: true, maxAge: -1})

exports.facetQuery = function (req, res) {

  var facetNames = [];
  cachedFacets('CA', 'latLong', '2015-06-30T00:00:00Z', function (err, data) {


    data.forEach(function (item, index, array) {
      ////console.log(item);
      facetNames.push(item[0]);
    });
    //console.log('The size of latlongs -> ' + facetNames.length);
    res.jsonp(facetNames);
  });

}

exports.facets = function (req, res) {

  var solrResponse = null;
  solrClient.get('cat_analysis/select?q=*:*' +
    '&facet.pivot=state,event,accumulationIndex' +
    '&facet=true&facet.field=state' +
    '&facet.field=event' +
    '&facet.field=accumulationIndex' +
    '&rows=0&wt=json&indent=true', function (err, result) {
    if (err) throw err;
    var json = JSON.parse(result);
    var pivot = json.responseHeader.params["facet.pivot"];
    solrResponse = new solrPivot(json);
    res.send({'testParam': 'testVaue'});
    //res.jsonp(JSON.stringify(solrResponse));

  });


}

