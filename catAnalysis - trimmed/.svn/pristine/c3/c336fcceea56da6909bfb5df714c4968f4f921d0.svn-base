/**
 * Created by pmeenaks on 7/28/2015.
 */
var cat = require('../controllers/cat.server.controller');


module.exports = function (app) {

  app.route('/cat/facet')
    .get(cat.facets);

  app.route('/cat/listAddress')
    .get(cat.listAddress);
  app.route('/cat/policy')
    .get(cat.policy);

  app.route('/cat/listLatLongs')
    .get(cat.facetQuery);
  app.route('/cat/listAddress')
    .get(cat.facetQuery);

  app.route('/proxix/session')
    .get(cat.authenticate);

  app.route('/cat/activeFire')
    .get(cat.activeFires);
    app.route('/cat/policies')
        .get(cat.policies);
    app.route('/cat/policy')
        .get(cat.policy);
    app.route('/cat/nearby')
        .get(cat.nearby);


}
