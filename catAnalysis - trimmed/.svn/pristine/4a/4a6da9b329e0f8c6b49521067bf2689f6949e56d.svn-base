/**
 * Created by pmeenaks on 7/28/2015.
 */

var _ = require('lodash'),
  solr = require('../../node_modules/solr');

exports.createClient = function(options){
  var solrClient = solr.createClient(options);
  solrClient.on('error', function(e){
    throw new Error('unable to connect to Solr');
  });
  console.log('solr client initiated ' );
  return solrClient;
};
