/**
 * Created by pmeenaks on 8/14/2015.
 */
var _ = require('lodash'),

    common = require('../common.server.controller'),
    json2csv = require('json2csv'),
    solrPivot = require('../../models/catquery.server.model'),
    memoize = require('memoize'),
    solrClient = common.createClient();

searchSolr = function (param, value,callback) {

    solrClient.get('catAnalysis/query?q=' + param + ':*' + value + '*&rows=0&&facet.pivot=state,policyNumber&facet=true', function (err, result) {
        var json = JSON.parse(result);
        var solrResponse = new solrPivot(json);

        callback(null,solrResponse);

    })

}

exports.nearby= function(req,res){


    var latLong = req.param('latLong');
    //console.log('lat long passed to /cat/nearby is ' + latLong);

    solrClient.get('catAnalysis/query?q=*:*&fl=latLong&stats=true&stats.field=aalToPremium&stats.field=aal&stats.field=premium&fq={!geofilt}&sfield=riskLocation&geo=true&distanceUnits=kilometers&pt='+latLong+'&d=8&sort=geodist()+asc&rows=1000&fq=report_date:(%222015-06-30T00:00:00Z%22)&json.facet={premium_percentiles:"percentile(premium,50,90)",%20aal_percentiles:"percentile(aal,50,90)",%20aal_2_premium:"percentile(aalToPremium,%2050,90)"}}', function(err,result){
        var response = {docs:[], stats:null, facets:null};
        var json = JSON.parse(result);
        response.stats = json.stats;
        response.facets = json.facets;
        //console.log('Reponse found for ' + latLong + ' is ' + json.response.numFound );
        json.response.docs.forEach(function(item, index, arr){
            response.docs.push(item.latLong);
        });
        res.send(response);
    });
}

exports.policy=function(req,res){

    var polNo = req.param('policyNumber');
    //console.log('policy no  passed to /cat/policy -'+ polNo);
    solrClient.get('catAnalysis/query?q=policyNumber:'+polNo+'&sort=report_date%20desc,%20locationNo%20asc', function(err, result){
        var json = JSON.parse(result);
        res.send(json.response.docs);

    });
}

exports.policies = function (req, res) {


    var param = 'policyNumber';
    var searchStr = req.param('searchStr');
    var result = {count: 0, policyByState: null};
    var policiesByState = new Map();
    searchSolr(param, searchStr, function (err, data) {
            res.send(data);
        }
    )
}

