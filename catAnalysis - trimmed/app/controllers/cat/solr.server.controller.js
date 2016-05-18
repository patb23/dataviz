/**
 * Created by pmeenaks on 8/26/2015.
 */
var promise = require('node-promise');
var when = require('node-promise').when;

var _ = require('lodash'),
    common = require('../common.server.controller'),
    fieldNames = ["PrecisionDescSource", "ConstructionType", "PropertyState","SquareFootageUnderRoof","DistanceToCoast","StructureType","RoofCoveringType","PropertyTerritory"],
    baseUrl = "dm/query?q=*:*&rows=0",
    solrClient = common.createClient();


function SolrFacetClient() {

    this.fieldNames = fieldNames;
    this.facets = new Map();
}


SolrFacetClient.prototype.getFqUrl = function (fq) {

    var urlStart = '&fq=';
    var result = "";

    console.log(result);
    var paramArr = [];


    fq.forEach(function (value, key) {

        var values = []
        values.push(value);
        var url = '{!tag='+key+'}'+key+':(';
        var varArr = []
         values.forEach(function(val, idx, arr) {
            // val = '"' + val +'"';
             console.log('going to push ' + val);
                varArr.push(val);

            });
        var combined = varArr.join(separator = '",');
        var paramUrl = url+combined + ')';
        paramArr.push(paramUrl);
        console.log('paramUrl ' + paramUrl);
    }, fq)

    result = '&fq='+ paramArr.join(separator = '&fq=');
    console.log(result);
    return result;
}


SolrFacetClient.prototype.getData = function (fieldName, fq) {
    //console.log(this);


    if ((!this.facets) || !this.facets.get(fieldName)) {
        var facetUrl = "&facet=true&facet.limit=-1&facet.mincount=1&json.nl=arrarr" + "&facet.field={!ex=" + fieldName +'}' + fieldName;
        var deferred = promise.defer();
        console.log(baseUrl + facetUrl+fq);
        solrClient.get(baseUrl + facetUrl+fq, function (err, res) {

            var json = JSON.parse(res);
            var data = json.facet_counts.facet_fields[fieldName];

            var modified = data.map(function (dat) {
                return {'key': dat[0], 'value': dat[1], 'fieldName': fieldName};
            })

            deferred.resolve(modified);
        });

        return deferred.promise;

    }

}


SolrFacetClient.prototype.init = function (fq) {
    var all = promise.all;
    var getSolrData = this.getData;

    var aRef = this.getFqUrl;
    console.log('calling fqUrl ' + fq);
    var fqUrl = aRef(fq);

    //this.fqUrl(fq);
    return all(this.fieldNames.map(function (item) {
        var aPromise = getSolrData(item, fqUrl);
        return aPromise;
    }));

}

exports.facets = function (req, res) {

    console.log(req.query);
    console.log('Inside facets controller');
    var fq = new Map();

    var params = Object.keys(req.query);
    params.forEach(function(val, idx, arr){

        var filters = [].concat(req.query[val]).join();
        if(filters.indexOf('[')>-1){
            filters = filters.replace(',', '%20TO%20');
        }else {
            filters = filters.replace(',', '","');
        }
        console.log('setting ' + val + ' with value ' + filters);

        fq.set(val,filters )

    });
    for(var attr in params){
    }
    var facetClient = new SolrFacetClient();
    var facetMap = new Map();


//    fq.set('PropertyState', ["FL", "NJ"]);
 //   fq.set('reportDate', ["2015-06-30T00:00:00.000-04:00Z"]);
    when(facetClient.init(fq), function (result) {

        res.jsonp(result);
    })
}

