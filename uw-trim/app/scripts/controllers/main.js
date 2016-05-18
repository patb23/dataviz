'use strict';

/**
 * @ngdoc function
 * @name uwApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the uwApp
 */
angular.module('uwApp')
  .controller('MainCtrl', ['$resource', '$scope', '$location', '$window', function ($resource, $scope, $location, $window, angularDc) {


    //var accumChart = dc.rowChart('#accum');
    var dateFormat = d3.time.format("%m/%d/%Y");
    var numberFormat = d3.format(".2f");
    var s = $scope;
    var theMap;
    var mapId = 'map-div';
    var hideMap = true;
    var allData;
    var ndx;
    var tileLayer;
    var markerLayer;
    var all;
    var mapChart = {
      markerLayer: null,
      map: null,
      geoLayers: []
    };

    angular.module('uwApp').constant('_', window._);

    var getnum = function (item) {
      return function (d) {
        if (d[item] && d[item] != "NOT_DISPLAYED") {
          return parseFloat(d[item]) || null
        }
      }
    };



    d3.csv("data/ho_qob.csv", function (data) {
      /* since its a csv file we need to format the data a bit */
      s.colorbrewer = colorbrewer
      var numberFormat = d3.format(".2f");
      var i = 0;
      data.forEach(function (d) {
        d.dd = dateFormat.parse(d.since);
        d.premium = +d.inPrm ? d.inPrm / 1000000 : 0;
        d.accumIdx = d.accumIdx == 'null' ? 'N/A' : d.accumIdx;
        d.pm= d.pm=='null'?'Z': d.pm;
        i++;
      });
      console.log('Done loading ................');
      //### Create Crossfilter Dimensions and Groups
      //See the [crossfilter API](https://github.com/square/crossfilter/wiki/API-Reference) for reference.
      ndx = s.ndx = crossfilter(data);
      all = s.all = ndx.groupAll();

      theMap = new L.Map(mapId, {center: [37.8, -96.9], zoom: 3})
      theMap.whenReady(function () {
        console.log('Hiding map');
        $("#" + mapId).hide()
      });
      tileLayer = tilelayer();
      tileLayer.addTo(theMap);
      markerLayer = buildMapLayer().setmap(theMap);

      //allData = ndx.dimension(function (d) {
      //  return d;
      //}).top(Infinity);
      s.states = ndx.dimension(function (d) {
        return d.st;
      });
      s.stateRaisedSum = s.states.group().reduceSum(function (d) {
        return d.premium;
      });
      s.accum = ndx.dimension(function (d) {
        return d.accumIdx
      });

      s.accumPrm = s.accum.group().reduceSum(function (d) {
        return d.premium;
      });

      // dimension by full date
      s.dateDimension = ndx.dimension(function (d) {
        return d.dd;
      });
      s.latDimension = ndx.dimension(function (d) {
        return d.lat;
      });
      allData = s.latDimension.top(Infinity);
      s.lngDimension = ndx.dimension(function (d) {
        return d.lng;
      });

      s.pmDimension = ndx.dimension(function(d){
        return d.pm;
      })

      s.groupByPm= s.pmDimension.group().reduceCount();

      s.profit = ndx.dimension(function (d) {
        var margin = d.pBkt;
        return d.pBkt;
      })
      s.basis = ndx.dimension(function (d) {
        return d.basis;
      });
      s.prmByBasis = s.basis.group().reduceCount();

      s.latestCount = function (chart) {
        var filters = [];
        s.selected = ndx.groupAll().value();
        var a = dc.printers.filters(chart.filters());
        filters = a.split(',')

      };


      s.groupByProfit = s.profit.group().reduce(
        function (p, v) {
          p.policies += 1;
          p.premium += +(v.inPrm ? v.inPrm / 1000000 : 0);
          return p;
        },
        function (p, v) {
          p.policies -= 1;
          p.premium -= +(v.inPrm ? v.inPrm / 1000000 : 0);
          return p;
        },
        function () {
          return {policies: 0, premium: 0}
        }
      );

      s.bubbleChartOptions = {
        colorAccessor: function (d) {
          return d.value.policies;
        },
        keyAccessor: function (p) {
          return p.value.policies;
        },
        valueAccessor: function (p) {
          return p.value.premium;
        },
        radiusValueAccessor: function (p) {
          return p.value.premium;
        },
        //r:d3.scale.linear().domain([0, 5])
        //,
        label: function (p) {
          return '  ' + p.key + ' ';
        },
        title: function (p) {
          return [p.key,
            "No. Of Policies: " + p.value.policies,
            "Premium (millions): " + numberFormat(p.value.premium)]
            .join("\n");
        }

      }


      s.postSetupMap = function (chart) {
        d3.json('data/us-states.json', function (json) {
          chart.width(480).height(300)
            .dimension(s.states).group(s.stateRaisedSum)
            .colors(d3.scale.quantize().range(["#ffffcc", "#c2e699", "#78c679", "#31a354", "#006837"]))
            // .colorDomain([0, 30]).addLayer(json.features, "state", function (d) {
            //   return d.properties.name;
            // })
            .projection(d3.geo.albersUsa())
            .title(function (d) {
              var titleText = 'State: ' + d.key + ' Total Premium ' + numberFormat(d.value ? d.value : 0) + 'M';
              return titleText
            });
          //.overlayGeoJson(json.features, "state", function (d) {
          //    return d.properties.name;
          //})
          //;
          //chart.scale();
          chart.render();

        });
      };

      s.accumPostSetupChart = function (c) {
        c.label(function (d) {
          return d.key;
        })
          .title(function (d) {
            return ' Total Premium (M) ' + numberFormat(d.value ? d.value : 0);
          })
          .margins({top: 20, left: 10, right: 10, bottom: 20})
          .xAxis().ticks(3);
      }


      mapChart.init = function () {
        if (theMap) {
          theMap.setZoom(4);
          return;
        }
        this.markerLayer = buildMapLayer().setmap(theMap);
        this.geoLayers = [this.markerLayer];
        this.map = theMap;

      }

      mapChart.filterAll = function () {

        s.latDimension.filterAll();
        s.lngDimension.filterAll();
        hideMap = true;
        this.markerLayer = buildMapLayer().renderMarkers();
        //this.init();
        this.reset();
      }
      dc.registerChart(mapChart);
      dc.renderAll();
      s.resetAll = function () {
        dc.filterAll();
        dc.redrawAll();
      }
      //$scope.$apply();
    })

    function buildMapLayer(options) {
      //var mapChart = new mapChart();

      var map;
      var getlat = getnum('lat');
      var getlng = getnum('lng');
      var latdim = ndx.dimension(getlat);
      var lngdim = ndx.dimension(getlng);
      s.latDimension = latdim;
      s.lngDimension = lngdim;
      var markerLayer = new L.MarkerClusterGroup({
        "spiderfyOnMaxZoom": true,
        "showCoverageOnHover": true,
        "zoomToBoundsOnClick": true,
        "maxClusterRadius":40,
        "removeOutsideVisibleBounds": true
      });
      var markerblocker;

      function renderMarkers() {
        console.log('calling redraw    ' + map);

        if (!map)return;
        map.removeLayer(markerLayer);
        markerLayer.clearLayers();

        var markerData = s.latDimension.top(Infinity);
        console.log('All data length '+allData.length );
        console.log('Marker Data length ' + markerData.length);
        if(markerData.length>50000) return;
        for (var i = 0; i < markerData.length; i++) {
          var aRecord = markerData[i];
          var lat = getlat(aRecord);
          var lng = getlng(aRecord);
          //console.log(getlat(aRecord));
          if (lat != null && lng != null) {
            var marker = new L.Marker(new L.LatLng(getlat(aRecord), getlng(aRecord)), {title: 'Risk Locations'})
            markerLayer.addLayer(marker);
          }
        }
        map.addLayer(markerLayer);
        $("#" + mapId).show();
        console.log('done adding layer ' + markerData.length);
        //mapChart = new mapChart(map, markerLayer);
        //return markerLayer;
      }
      function geofilter() {
        if (!map.hasLayer(markerLayer)) {
          latdim.filter(null);
          lngdim.filter(null)
        } else {
          var bounds = map.getBounds();
          var lat = [bounds.getNorthEast()["lat"], bounds.getSouthWest()["lat"]];
          var lng = [bounds.getNorthEast()["lng"], bounds.getSouthWest()["lng"]];
          lat = lat[0] < lat[1] ? lat : [lat[1], lat[0]];
          lng = lng[0] < lng[1] ? lng : [lng[1], lng[0]];
          latdim.filter(lat);
          lngdim.filter(lng)
        }
        function round(original) {
          return original.toFixed(3)
        }

        return markerLayer
      }

      function domarkers() {
        markerLayer.clearLayers();
        latdim.filter(null);
        lngdim.filter(null);
        renderMarkers(Infinity);
        geofilter();
      }

      function setmap(newmap) {
        map = newmap;
        console.log('  setmap ' + markerLayer);
        console.log('  setmap ' + map);
        map.on("zoomend", function () {
          if (map.hasLayer(markerLayer)) {
            geofilter();
            markerblocker = true;
            dc.redrawAll()
          }
        });
        map.on("dragend", function () {
          if (map.hasLayer(markerLayer)) {
            geofilter();
            markerblocker = true;
            dc.redrawAll()
          }
        });

        mapChart.render = function () {
          console.log('  render ' + markerLayer);
          console.log('  render ' + map);
          console.log('  render ' + map.hasLayer(markerLayer));
          if (map.hasLayer(markerLayer)) {
            console.log('Map chart render    called');
            if (markerblocker) {
              markerblocker = false
            } else {
              console.log('Map chart render   else  called');
              domarkers()
            }
          }
        };
        mapChart.reset = function(){
          if (!map)return;
          map.removeLayer(markerLayer);
          markerLayer.clearLayers();
          map.setView(new L.LatLng(37.8, -96.9),3);
          console.log('Total records length   '+ allData.length);
        };

        mapChart.redraw = renderMarkers;
        //mapChart.reset = reset();
        console.log('setmap called  ');
        return markerLayer;
      }

      markerLayer.setmap = setmap;
      markerLayer.renderMarkers = renderMarkers;
      //markerLayer.geoFilter = geoFilter;
      return markerLayer

      //console.log(setmap);
      //markerLayer.setmap(theMap);
      //return mapChart;
    }

    function tilelayer(url) {
      var mapoptions = {};
      var url = url || "https://tile.mobilizingcs.org/{z}/{x}/{y}.png";
      mapoptions.attribution = mapoptions.attribution || false;
      mapoptions.maxZoom = mapoptions.maxZoom || 18;
      var mylayer = new L.TileLayer(url, mapoptions);
      return mylayer
    }
  }

  ])
;
