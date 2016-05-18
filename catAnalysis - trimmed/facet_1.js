
> catanalysis@0.0.1 test D:\pattabi\idea\node-and-others\catAnalysis
> mocha --reporter spec --timeout 3000

solr client initiated 
MEAN.JS application started on port 3000


  solrClient
    mapService
[0mGET /cat/activeFire [32m200 [0m1885.568 ms - -[0m
      √ should return kml for active fires  (1911ms)
[0mGET /cat/activeFire [32m200 [0m36.023 ms - -[0m
      √ should return kml from cache  (47ms)
    facet query
{ responseHeader: 
   { status: 0,
     QTime: 23,
     params: 
      { facet: 'on',
        q: '*:*',
        'facet.limit': '-1',
        'facet.field': [Object],
        fq: [Object],
        rows: '0' } },
  response: { numFound: 15849, start: 0, docs: [] },
  facet_counts: 
   { facet_queries: {},
     facet_fields: { latLong: [Object], city: [Object] },
     facet_dates: {},
     facet_ranges: {},
     facet_intervals: {},
     facet_heatmaps: {} } }
      1) should return latlongs


  2 passing (2s)
  1 failing

  1) solrClient facet query should return latlongs:
     Uncaught TypeError: Cannot read property 'forEach' of undefined
      at D:\pattabi\idea\node-and-others\catAnalysis\app\controllers\cat\cat.facet.server.controller.js:55:9
      at D:\pattabi\idea\node-and-others\catAnalysis\app\controllers\cat\cat.facet.server.controller.js:44:5
      at _stream_readable.js:908:16



 ran 0 of 0 tests.
