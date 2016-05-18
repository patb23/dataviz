/**
 * Created by pmeenaks on 7/28/2015.
 */
var _ = require('lodash');


module.exports = _.extend(
    require('./cat/cat.facet.server.controller'),
    require('./cat/cat.proxix.server.controller'),
    require('./cat/cat.map.server.controller'),
    require('./cat/solr.server.controller'),
    require('./cat/cat.search.server.controller')
);
