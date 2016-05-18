var dashboard = dashboard || {};
$(document).ready(function () {
  start();
  function start() {
    readconfig(init)
  }

  function readconfig(next) {
    $.ajax({url: "config.json", dataType: "json"}).success(function (data) {
      dashboard.config = data;
      if (next)next()
    }).fail(function (err) {
      alert("error loading config.json");
      dashboard.message(err)
    })
  }

  function init() {
    $("#loadinganimation").show();
    var csvpath = Mustache.render(dashboard.config.data.url, window);
    var csvpath = $("<textarea />").html(csvpath).val();
    var myrequest = $.ajax({type: "GET", url: csvpath}).error(function () {
      alert("Failed to download data from:\n" + csvpath)
    }).done(function (rsptxt) {
      dashboard.campaign_urn = oh.utils.state()[0];
      loaddata(oh.utils.parsecsv(rsptxt));
      if (hasdata()) {
        initcharts();
        loadgui();
        inithelp()
      }
    })
  }

  function loaddata(records) {
    dashboard.data = crossfilter(records);
    dashboard.dim = {main: dashboard.data.dimension(oh.utils.get(dashboard.config["item_main"]))};
    dashboard.groups = {all: dashboard.data.groupAll()}
  }

  function hasdata() {
    if (dashboard.groups.all.value() == 0) {
      alert("Campaign '" + dashboard.campaign_urn + '" has no responses! Try again later (or press F5)');
      $("#loadinganimation").hide();
      return false
    }
    return true
  }

  function loadgui() {
    $("#buttonpanel").show();
    $("#loadinganimation").hide();
    $(".hoverinfo").css({left: ($(window).width() - $(".hoverinfo").width()) / 2, right: ""});
    $("#timeseriesbutton").trigger("click");
    $("#piechartbutton").trigger("click");
    dc.renderAll();
    $("head title").text(dashboard.config.title);
    if (oh.utils.state()[1]) {
      var myhash = +oh.utils.state()[1];
      var alldata = dashboard.dim.main.top(9999);
      var allhashes = $.map(alldata, function (d) {
        return d.hash
      });
      var i = $.inArray(myhash, allhashes);
      if (i > -1) {
        dashboard.modal.showmodal(alldata[i])
      } else {
        oh.utils.state(oh.utils.state()[0])
      }
    }
  }
});
dashboard.debug = false;
dashboard.message = function (x) {
  if (dashboard.debug && console && console.log) {
    console.log(x)
  }
};
function initcharts() {
  dashboard.renderlet = function () {
    var funstack = [];

    function call() {
      $.each(funstack, function (index, value) {
        value()
      })
    }

    function register(newfun, delay) {
      if (!delay) {
        funstack.push(newfun)
      } else {
        funstack.push(_.debounce(newfun, delay))
      }
      dashboard.message("registered a new renderlet!")
    }

    var init = _.once(function (renderlet) {
      renderlet(call);
      dashboard.message("renderlet initiated!")
    });
    return {init: init, register: register}
  }();
  dc.constants.EVENT_DELAY = 5;
  dashboard.charts = dashboard.charts || {};
  $(dashboard.config.datecharts).each(function (index, conf) {
    $("#bottompanel").datechart(conf)
  });
  $(dashboard.config.hourcharts).each(function (index, conf) {
    $("#bottompanel").hourchart(conf)
  });
  $("#piepanel").draggable({containment: "body", snap: "body", snapMode: "inner"}).resizable();
  $(dashboard.config.piecharts).each(function (index, conf) {
    $("#piepanel").piechart(conf)
  });
  $(dashboard.config.barcharts).each(function (index, conf) {
    $("#histpanel").barchart(conf)
  });
  $(dashboard.config.wordclouds).each(function (index, conf) {
    $("#wcpanel").wordcloud(conf)
  });
  $("#infodiv").filtercount();
  dashboard.map = $("#map").filtermap(dashboard.config.maps[0]);
  $(".leaflet-control-layers-base").addClass("radio");
  dashboard.modal = $("#responsemodal").responsemodal();
  dashboard.photopanel = $("#photopanel").photopanel(dashboard.config.photo);
  $("#buttonpanel button").on("dblclick", function (e) {
    return false
  });
  $(".widgetbutton").on("click", function () {
    var panel = $(this).attr("data-panel");
    this.state = !this.state;
    if (this.state) {
      if (panel == "photopanel") {
        dashboard.photopanel.showme()
      }
      $("#" + panel + ".ui-resizable").width("").height("");
      $("#" + panel + ".ui-draggable").css({top: "", bottom: "", left: "", right: ""});
      $("#" + panel + " .ui-resizable").width("").height("");
      $("#" + panel + " .ui-draggable").css({top: "", bottom: "", left: "", right: ""});
      $("#" + panel).show();
      $("#" + panel + " a.refresh").trigger("click")
    } else {
      $("#" + panel + " a.reset").trigger("click");
      $("#" + panel).hide()
    }
  })
}
var oh = oh || {};
oh.utils = oh.utils || {};
oh.user = oh.user || {};
oh.utils.getRandomSubarray = function (arr, size) {
  var shuffled = arr.slice(0), i = arr.length, temp, index;
  while (i--) {
    index = Math.floor(i * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp
  }
  return shuffled.slice(0, size)
};
oh.utils.delayexec = function () {
  var timer;

  function exec(call, delay) {
    if (timer) {
      dashboard.message("clear " + timer);
      clearTimeout(timer)
    }
    timer = setTimeout(function () {
      timer = null;
      call()
    }, delay);
    dashboard.message("added " + timer)
  }

  return exec
};
oh.utils.parsedate = function (datestring) {
  if (!datestring) {
    return null
  }
  var a = datestring.split(/[^0-9]/);
  return new Date(a[0], a[1] - 1, a[2], a[3], a[4], a[5])
};
oh.utils.get = function (item) {
  return function (d) {
    if (d[item] && d[item] != "NOT_DISPLAYED") {
      return d[item]
    }
    return "NA"
  }
};
oh.utils.getnum = function (item) {
  return function (d) {
    if (d[item] && d[item] != "NOT_DISPLAYED") {
      return parseFloat(d[item]) || null
    }
  }
};
oh.utils.getdate = function (item) {
  return function (d) {
    if (d[item] && d[item] != "NOT_DISPLAYED") {
      return d3.time.day(oh.utils.parsedate(d[item]))
    }
  }
};
oh.utils.bin = function (binwidth) {
  return function (x) {
    return Math.floor(x / binwidth) * binwidth
  }
};
oh.utils.gethour = function (item) {
  return function (d) {
    if (d[item] && d[item] != "NOT_DISPLAYED") {
      return oh.utils.parsedate(d[item]).getHours()
    }
  }
};
oh.utils.state = function (mycampaign, myresponse) {
  if (!mycampaign) {
    return window.location.hash.substring(1).split("/")
  }
  if (!myresponse) {
    window.location.hash = mycampaign;
    return
  }
  window.location.hash = mycampaign + "/" + myresponse
};
oh.utils.readconfig = function (next) {
  $.ajax({url: "config.json", dataType: "json"}).success(function (data) {
    dashboard.config = data;
    if (next)next()
  }).fail(function (err) {
    alert("error loading config.json");
    dashboard.message(err)
  })
};
oh.utils.error = function (msg) {
  throw new Error(msg)
};
oh.call = function (path, data, datafun) {
  function processError(errors) {
    if (errors[0].code && errors[0].code == "0200") {
      var pattern = /(is unknown)|(authentication token)|(not provided)/i;
      if (!errors[0].text.match(pattern)) {
        alert(errors[0].text)
      }
      if (!/login.html$/.test(window.location.pathname)) {
        oh.sendtologin()
      }
    } else {
      alert(errors[0].text)
    }
  }

  var data = data ? data : {};
  data.client = "dashboard";
  var myrequest = $.ajax({
    type: "POST",
    url: "/app" + path,
    data: data,
    dataType: "text",
    xhrFields: {withCredentials: true}
  }).done(function (rsptxt) {
    if (!rsptxt || rsptxt == "") {
      alert("Undefined error.");
      return false
    }
    var response = jQuery.parseJSON(rsptxt);
    if (response.result == "success") {
      if (datafun)datafun(response)
    } else if (response.result == "failure") {
      processError(response.errors);
      return false
    } else {
      alert("JSON response did not contain result attribute.")
    }
  }).error(function () {
    alert("Ohmage returned an undefined error.")
  });
  return myrequest
};
oh.login = function (user, password, cb) {
  var req = oh.call("/user/auth_token", {user: user, password: password}, function (response) {
    if (!cb)return;
    cb()
  });
  return req
};
oh.logout = function (cb) {
  oh.call("/user/logout", {}, cb)
};
oh.sendtologin = function () {
  window.location = "../web/#login"
};
oh.campaign_read = function (cb) {
  var req = oh.call("/campaign/read", {output_format: "short"}, function (res) {
    if (!cb)return;
    var arg = res.metadata && res.metadata.items ? res.metadata.items : null;
    cb(arg)
  });
  return req
};
oh.utils.parsecsv = function (string) {
  var rows = d3.csv.parse(string);
  var records = [];
  rows.forEach(function (d, i) {
    if (d[dashboard.config.item_main] == "NOT_DISPLAYED")return;
    d.hash = murmurhash3_32_gc(JSON.stringify(d));
    records.push(d)
  });
  return records
};
oh.user.whoami = function (cb) {
  var req = oh.call("/user/whoami", {}, function (res) {
    if (!cb)return;
    cb(res.username)
  });
  return req
};
oh.ping = _.debounce(oh.user.whoami, 60 * 1e3, true);
oh.keepalive = _.once(function (t) {
  t = t || 60;
  setInterval(oh.ping, t * 1e3)
});
oh.keepactive = _.once(function (t) {
  $("html").click(function () {
    oh.ping()
  })
});
oh.getimageurl = function (record) {
  var photo = dashboard.config.photo.item;
  if (!record[photo] || record[photo] == "SKIPPED" || record[photo] == "NOT_DISPLAYED") {
    return "images/nophoto.jpg"
  }
  var thumbtemplate = dashboard.config.photo.image || oh.utils.error("No dashboard.config.photo.image specified");
  return Mustache.render(thumbtemplate, record)
};
oh.getcsvurl = function () {
  var filter = dashboard.config.data.filter || ".";
  var pattern = new RegExp(filter, "i");
  var campaign_urn = oh.utils.state()[0];
  if (!campaign_urn || !pattern.test(campaign_urn)) {
    window.location = "choosecampaign.html?filter=" + filter;
    oh.utils.error("Invalid campaign. Redirecting page.")
  }
  var params = {
    campaign_urn: campaign_urn,
    client: "dashboard",
    user_list: "urn:ohmage:special:all",
    prompt_id_list: "urn:ohmage:special:all",
    output_format: "csv",
    sort_oder: "timestamp",
    column_list: "" + ["urn:ohmage:context:timestamp", "urn:ohmage:prompt:response", "urn:ohmage:context:location:latitude", "urn:ohmage:context:location:longitude"],
    suppress_metadata: "true"
  };
  oh.user.whoami(function () {
    oh.campaign_read(function (campaigns) {
      if ($.inArray(campaign_urn, campaigns) < 0) {
        alert("No such campaign: " + campaign_urn);
        window.location = "choosecampaign.html?filter=" + filter
      }
    })
  });
  return decodeURIComponent("/app/survey_response/read?" + jQuery.param(params))
};
(function ($) {
  $.fn.filtermap = function (options) {
    var mapid = this.attr("id");
    var mymap = new L.Map(mapid);
    mymap.whenReady(function () {
      $("#" + mapid).hide()
    });
    var center = options.center || [0, 0];
    var zoom = options.zoom || 9;
    mymap.setView(center, zoom);
    var cloudmaps = {};
    var defaultmap;
    $(options.tilelayers).each(function (index, conf) {
      cloudmaps[conf.title] = tilelayer(conf);
      if (!defaultmap || conf["default"]) {
        defaultmap = cloudmaps[conf.title]
      }
    });
    defaultmap && defaultmap.addTo(mymap);
    var markerlayer = buildmarkerlayer(options).setmap(mymap);
    var geolayers = [markerlayer];
    var mapcontrol = new L.Control.Layers(cloudmaps, {}).setPosition("bottomright").addTo(mymap);
    var layercontrol = new L.Control.Layers({
      Disable: L.layerGroup(),
      Markers: markerlayer
    }, {}).setPosition("topright").addTo(mymap);
    var infobox = makeinfo();
    mymap.addControl(infobox);
    markerlayer.setinfo(infobox);
    $(options.geojson).each(function (index, conf) {
      downloadgeojson(conf.url, function (data) {
        var newlayer = buildgeojsonlayer(data).setinfo(infobox).setmap(mymap).setfilter(conf.item, options.item).colormap();
        newlayer.setcontrol(layercontrol, conf.title || urltail(conf.url));
        geolayers.push(newlayer)
      })
    });
    mymap.on("baselayerchange", function (LayerEvent) {
      if (LayerEvent.layer.options && LayerEvent.layer.options.tileSize) {
        return
      }
      dashboard.message("changing base layers...");
      infobox.update("");
      $(geolayers).each(function (index, layer) {
        if (layer.reset)layer.reset()
      })
    });
    $("<a>").addClass("refresh").addClass("hide").appendTo("#" + mapid).on("click", function () {
      dashboard.message("forcing map refresh");
      mymap.invalidateSize()
    });
    $("<a>").addClass("reset").addClass("hide").appendTo("#" + mapid).on("click", function () {
      dashboard.message("resetting map state");
      $("#" + mapid + " input[type=radio]:first").trigger("click");
      mymap.setView(center, zoom, true)
    });
    mymap.resetall = function () {
      $(geolayers).each(function (index, layer) {
        layer.reset()
      })
    };
    return mymap
  };
  function buildmarkerlayer(options) {
    var map;
    var markerblocker;
    var info;
    var getlat = oh.utils.getnum(options.item.lat);
    var getlng = oh.utils.getnum(options.item.lng);
    var latdim = dashboard.data.dimension(getlat);
    var lngdim = dashboard.data.dimension(getlng);
    var markerlayer = new L.MarkerClusterGroup(options.clusteroptions || {});
    dashboard.dim["lat"] = latdim;
    dashboard.dim["lng"] = lngdim;
    function renderMarkers() {
      if (!map)return;
      map.removeLayer(markerlayer);
      markerlayer.clearLayers();
      var markerdata = dashboard.dim.main.top(Infinity);
      for (var i = 0; i < markerdata.length; i++) {
        var a = markerdata[i];
        if (!getlat(a)) {
          dashboard.message("skipping record " + i + " (no valid latlng)");
          continue
        }
        var marker = new L.Marker(new L.LatLng(getlat(a), getlng(a)), {title: a[dashboard.config["item_main"]]});
        markerlayer.addLayer(marker);
        marker.on("click", function () {
          var k = a;
          return function () {
            dashboard.modal.showmodal(k)
          }
        }())
      }
      map.addLayer(markerlayer);
      return markerlayer
    }

    function geofilter() {
      if (!map.hasLayer(markerlayer)) {
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

      info && info.update("<pre>" + round(bounds.getSouthWest()["lat"]) + " < lat < " + round(bounds.getNorthEast()["lat"]) + "\n" + round(bounds.getSouthWest()["lng"]) + " < lng < " + round(bounds.getNorthEast()["lng"]) + "</pre>");
      return markerlayer
    }

    function domarkers() {
      var starttime = (new Date).getTime();
      markerlayer.clearLayers();
      latdim.filter(null);
      lngdim.filter(null);
      renderMarkers(Infinity);
      geofilter();
      var enddtime = (new Date).getTime();
      var delta = enddtime - starttime;
      dashboard.message("updating markers took: " + delta + "ms.")
    }

    function setmap(newmap) {
      map = newmap;
      map.on("moveend", function () {
        if (map.hasLayer(markerlayer)) {
          geofilter();
          markerblocker = true;
          dc.redrawAll()
        }
      });
      dashboard.renderlet.register(function () {
        if (map.hasLayer(markerlayer)) {
          if (markerblocker) {
            markerblocker = false
          } else {
            domarkers()
          }
        }
      }, 200);
      return markerlayer
    }

    markerlayer.setinfo = function (newinfo) {
      info = newinfo;
      return markerlayer
    };
    markerlayer.setmap = setmap;
    markerlayer.reset = function () {
      markerlayer.clearLayers();
      latdim.filter(null);
      lngdim.filter(null)
    };
    return markerlayer
  }

  function buildgeojsonlayer(geojsondata, getlat, getlng) {
    var geojson;
    var info;
    var map;
    var geodim;
    var geogroup;
    var selected;

    function hoverin(e) {
      var layer = e.target;
      var infotemplate = "<div><h4>Neighborhood</h4> <b> {{ name }} </b></div>";
      layer.setStyle({weight: 3, color: "#666", dashArray: "0"});
      if (!L.Browser.ie && !L.Browser.opera) {
        layer.bringToFront()
      }
      info && info.update(Mustache.render(infotemplate, layer.feature.properties))
    }

    function hoverout(e) {
      e.target.setStyle({weight: 2, color: "white", dashArray: "3"});
      info && info.update("<div><h4>Neighborhood</h4><i>Hover over map</i></div>")
    }

    function selectNeighborhood(e) {
      selected = e && selected != e.target ? e.target : null;
      if (geodim)geodim.filter(selected && selected.feature.properties.name);
      dc.redrawAll()
    }

    function onEachFeature(feature, layer) {
      layer.on({mouseover: hoverin, mouseout: hoverout, click: selectNeighborhood})
    }

    function getColor(properties) {
      return properties.count > 0 ? "#CCCCCC" : "#F0F0FF"
    }

    function style(feature) {
      return {
        weight: 2,
        opacity: 1,
        color: "white",
        dashArray: "3",
        fillOpacity: .85,
        fillColor: getColor(feature.properties)
      }
    }

    function colormap() {
      if (!geogroup || !map) {
        return geojson
      }
      if (!map.hasLayer(geojson)) {
        return geojson
      }
      var starttime = (new Date).getTime();
      var allgroups = geogroup.all();
      var countobject = {};
      $.each(allgroups, function (index, neighborhood) {
        countobject[neighborhood.key] = neighborhood.value
      });
      geojson.eachLayer(function (layer) {
        layer.feature.properties.count = countobject[layer.feature.properties.name];
        geojson.resetStyle(layer)
      });
      selected && selected.setStyle({fillColor: "steelblue"});
      var enddtime = (new Date).getTime();
      var delta = enddtime - starttime;
      dashboard.message("coloring maps took: " + delta + "ms.");
      return geojson
    }

    function classify(itemgeo, name) {
      var getlat = oh.utils.getnum(itemgeo.lat);
      var getlng = oh.utils.getnum(itemgeo.lng);
      var markerdata = dashboard.dim.main.top(Infinity);
      var starttime = (new Date).getTime();
      for (var i = 0; i < markerdata.length; i++) {
        var a = markerdata[i];
        if (!getlat(a)) {
          continue
        }
        var result = leafletPip.pointInLayer([getlng(a), getlat(a)], geojson, true);
        a[name] = result[0] ? result[0].feature.properties.name : "NA"
      }
      var enddtime = (new Date).getTime();
      var delta = enddtime - starttime;
      dashboard.message("classification of " + markerdata.length + "points took: " + delta + "ms.")
    }

    geojson = L.geoJson(geojsondata, {style: style, onEachFeature: onEachFeature});
    geojson.setinfo = function (newinfo) {
      info = newinfo;
      return geojson
    };
    geojson.setmap = function (newmap) {
      map = newmap;
      return geojson
    };
    geojson.reset = function () {
      selectNeighborhood();
      return geojson
    };
    geojson.setcontrol = function (newcontrol, name) {
      newcontrol.addBaseLayer(geojson, name)
    };
    geojson.colormap = colormap;
    geojson.setfilter = function (newitem, itemgeo) {
      if (newitem) {
        var getgeo = oh.utils.get(newitem)
      } else {
        var dimname = "jsonpip";
        classify(itemgeo, dimname);
        var getgeo = oh.utils.get(dimname)
      }
      geodim = dashboard.data.dimension(getgeo);
      geogroup = geodim.group();
      dashboard.renderlet.register(colormap, 100);
      return geojson
    };
    return geojson
  }

  function downloadgeojson(url, cb) {
    var jqxhr = $.getJSON(url, cb).fail(function () {
      alert("failed to download geojson file: " + url)
    })
  }

  function tilelayer(conf) {
    var mapoptions = conf || {};
    var url = conf.url || "https://tile.mobilizingcs.org/{z}/{x}/{y}.png";
    mapoptions.attribution = mapoptions.attribution || false;
    mapoptions.maxZoom = mapoptions.maxZoom || 18;
    var mylayer = new L.TileLayer(url, mapoptions);
    return mylayer
  }

  function urltail(mystring) {
    var x = mystring.split("/");
    return x[x.length - 1]
  }

  function makeinfo() {
    var info = L.control();
    info.onAdd = function () {
      this._div = L.DomUtil.create("div", "info");
      this._div.id = "infobox";
      this.update();
      return this._div
    };
    info.update = function (infotext) {
      this._div.innerHTML = infotext || "<div><h4>Load Data</h4><i>Select Data Layer</i></div>"
    };
    return info
  }
})(jQuery);
(function ($) {
  $.fn.photopanel = function (options) {
    var pages;
    var pagesize = 20;
    var currentpage = 0;
    var panel = $(this).draggable({containment: "body", snap: "body", snapMode: "inner"}).addClass("well");

    function prevthumbs() {
      var pagecount = pages.length;
      currentpage = (pagecount + currentpage - 1) % pagecount;
      updatepictures();
      return false
    }

    function nextthumbs() {
      var pagecount = pages.length;
      currentpage = (pagecount + currentpage + 1) % pagecount;
      updatepictures();
      return false
    }

    function fixanchors() {
      currentpage == 0 ? $("#prevthumbs").hide() : $("#prevthumbs").show();
      currentpage == pages.length - 1 ? $("#nextthumbs").hide() : $("#nextthumbs").show()
    }

    function updatepictures() {
      var starttime = (new Date).getTime();
      if (pages.length == 0)return;
      var newlist = $("<ul>", {"class": "thumbnails"});
      var thispage = pages[currentpage];
      for (var i = 0; i < thispage.length; i++) {
        var d = thispage[i];
        var li = $("<li>", {"class": "span2"}).appendTo(newlist);
        var a = $("<a>", {"class": "thumbnail", href: "#"}).appendTo(li);
        var img = $("<img>", {alt: d[dashboard.config.item_main], "class": "img-rounded", src: getthumburl(d)});
        img.appendTo(a);
        a.on("click", function () {
          var k = d;
          return function () {
            dashboard.modal.showmodal(k);
            return false
          }
        }());
        img.on("error", imgerror)
      }
      var enddtime = (new Date).getTime();
      var delta = enddtime - starttime;
      dashboard.message("updating thumbnails took: " + delta + "ms.");
      function displaythumblist() {
        newlist.appendTo("#imagelist");
        $("#imagelist").fadeIn(300);
        fixanchors()
      }

      function imgerror() {
        $(this).attr("src", "images/photothumb.jpg")
      }

      if (!$("#imagelist").is(":empty")) {
        $("#imagelist").fadeOut(500, function () {
          $("#imagelist").empty();
          displaythumblist()
        })
      } else {
        displaythumblist()
      }
    }

    function updatepages() {
      pages = [];
      currentpage = 0;
      var alldata = oh.utils.getRandomSubarray(dashboard.dim.main.top(9999));
      for (var i = 0; i < alldata.length; i++) {
        var x = Math.floor(i / pagesize);
        var y = i % pagesize;
        pages[x] = pages[x] || [];
        pages[x][y] = alldata[i]
      }
      updatepictures()
    }

    function getthumburl(record) {
      var photoItem = options.item;
      if (!record[photoItem] || record[photoItem] == "SKIPPED" || record[photoItem] == "NOT_DISPLAYED") {
        return "images/photothumb.jpg"
      }
      var thumbtemplate = options.thumb || oh.utils.error("No photo.thumb specified in config.");
      return Mustache.render(thumbtemplate, record)
    }

    $("#prevthumbs").on("click", prevthumbs);
    $("#nextthumbs").on("click", nextthumbs);
    dashboard.renderlet.register(function () {
      if (panel.is(":visible")) {
        updatepages()
      }
    }, 500);
    panel.showme = function () {
      $("#imagelist").empty();
      _.delay(updatepages, 250)
    };
    return panel
  }
})(jQuery);
(function ($) {
  var colorschema = ["#8DD3C7", "#BEBADA", "#FB8072", "#80B1D3", "#FDB462", "#B3DE69", "#FCCDE5", "#CCEBC5", "#FFED6F"];
  $.fn.piechart = function (options) {
    var target = this;
    var item = options.item;
    var title = options.title || "pie chart";
    var label = options.label || {};
    var chartid = "pie-" + Math.random().toString(36).substring(7);
    dashboard.dim[item] = dashboard.data.dimension(oh.utils.get(item));
    dashboard.groups[item] = dashboard.dim[item].group();
    var mydiv = $("<div/>").addClass("chart").attr("id", chartid);
    var titlediv = $("<div/>").addClass("title").appendTo(mydiv);
    $("<span/>").text(title).appendTo(titlediv);
    titlediv.append("&nbsp;");
    $("<a/>").addClass("reset").attr("href", "#").attr("style", "display:none;").text("(reset)").appendTo(titlediv).on("click", function (e) {
      e.preventDefault();
      mychart.filterAll();
      dc.redrawAll();
      return false
    });
    mydiv.appendTo(target);
    var mychart = dc.pieChart("#" + mydiv.attr("id")).width(180).height(180).radius(80).colors(colorschema).innerRadius(20).label(getlabel).dimension(dashboard.dim[item]).group(dashboard.groups[item]);
    dashboard.renderlet.init(mychart.renderlet);
    dashboard.piecharts = dashboard.piecharts || [];
    dashboard.piecharts.push(mychart);
    return target;
    function getlabel(d) {
      return label[d.data.key] || d.data.key
    }
  }
})(jQuery);
(function ($) {
  $.fn.barchart = function (options) {
    var target = this;
    var id = "#" + target.attr("id");
    var item = options.item;
    var title = options.title || item;
    var domain = options.domain || [];
    var chartid = "bar-" + Math.random().toString(36).substring(7);
    dashboard.dim[item] = dashboard.data.dimension(oh.utils.getnum(item));
    domain[0] = domain[0] || +dashboard.dim[item].bottom(1)[0][item];
    domain[1] = domain[1] || +dashboard.dim[item].top(1)[0][item];
    var binwidth = options.binwidth || calcbin(domain);
    domain[0] = rounddown(domain[0], binwidth);
    domain[1] = roundup(domain[1], binwidth);
    var centerbars = binwidth == 1;
    if (centerbars) {
      domain[0] = domain[0] - 1;
      domain[1] = domain[1] + 1
    }
    var x_units = (domain[1] - domain[0]) / binwidth;
    dashboard.groups[item] = dashboard.dim[item].group(oh.utils.bin(binwidth));
    var mydiv = $("<div/>").addClass("chart").addClass("histcontainer").attr("id", chartid);
    var titlediv = $("<div/>").addClass("title").appendTo(mydiv);
    $("<span/>").text(title).appendTo(titlediv);
    titlediv.append("&nbsp;");
    $("<a/>").addClass("reset").attr("href", "#").attr("style", "display:none;").text("(reset)").appendTo(titlediv).on("click", function (e) {
      e.preventDefault();
      mychart.filterAll();
      dc.redrawAll();
      return false
    });
    mydiv.appendTo(target);
    mydiv.draggable({containment: "body", snap: "body", snapMode: "inner"});
    var plotwidth = rounddown(295 - 30 - 25, x_units);
    var remainder = 295 - 30 - 25 - plotwidth;
    dashboard.message("Domain:" + domain);
    dashboard.message("Binwidth:" + binwidth);
    dashboard.message("x_units:" + x_units);
    dashboard.message("plotwidth:" + plotwidth);
    dashboard.message("remainder:" + remainder);
    var mychart = dc.barChart("#" + mydiv.attr("id")).width(295).height(130).gap(1 + centerbars).margins({
      top: 10,
      right: 25 + remainder,
      bottom: 20,
      left: 30
    }).dimension(dashboard.dim[item]).group(dashboard.groups[item]).elasticY(true).centerBar(centerbars).xUnits(function () {
      return x_units
    }).x(d3.scale.linear().domain(domain).rangeRound([0, plotwidth])).renderHorizontalGridLines(true).renderVerticalGridLines(true);
    mychart.xAxis().tickFormat(d3.format("d")).tickValues(seq(domain[0], domain[1], binwidth));
    dashboard.renderlet.init(mychart.renderlet);
    return target
  };
  function seq(x, y, by) {
    if (!by)by = 1;
    x = rounddown(x, by);
    y = roundup(y, by);
    out = [];
    for (var i = x; i <= y; i = i + by) {
      out.push(i)
    }
    return out
  }

  function roundup(x, y) {
    return Math.ceil(x / y) * y
  }

  function rounddown(x, y) {
    return Math.floor(x / y) * y
  }

  function calcbin(domain, maxbars) {
    if (!maxbars)maxbars = 10;
    var k = [1, 2, 5];
    var bin = 1;
    while (true) {
      for (i = 0; i < k.length; i++) {
        newbin = bin * k[i];
        if (Math.abs(rounddown(domain[0], newbin) - roundup(domain[1], newbin)) / newbin < maxbars + 1) {
          return newbin
        }
      }
      bin = bin * 10
    }
  }
})(jQuery);
(function ($) {
  $.fn.datechart = function (options) {
    var target = this;
    var id = "#" + target.attr("id");
    var item = options.item;
    var dimname = item + "_date";
    var title = options.title || "Date";
    var chartid = "date-chart";
    dashboard.dim[dimname] = dashboard.data.dimension(oh.utils.getdate(item));
    dashboard.groups[dimname] = dashboard.dim[dimname].group();
    var mydiv = $("<div/>").addClass("chart").attr("id", chartid);
    var titlediv = $("<div/>").addClass("title").appendTo(mydiv);
    $("<span/>").text(title).appendTo(titlediv);
    titlediv.append("&nbsp;");
    $("<a/>").addClass("reset").attr("href", "#").attr("style", "display:none;").text("(reset)").appendTo(titlediv).on("click", function (e) {
      e.preventDefault();
      mychart.filterAll();
      dc.redrawAll();
      return false
    });
    mydiv.appendTo(target);
    var mindate = oh.utils.getdate(item)(dashboard.dim[dimname].bottom(1)[0]);
    var maxdate = oh.utils.getdate(item)(dashboard.dim[dimname].top(1)[0]);
    mindate = new Date(mindate.getFullYear(), mindate.getMonth(), mindate.getDate() - 2);
    maxdate = new Date(maxdate.getFullYear(), maxdate.getMonth(), maxdate.getDate() + 2);
    var ndays = (maxdate - mindate) / (24 * 60 * 60 * 1e3);
    if (ndays < 71) {
      maxdate = new Date(mindate.getFullYear(), mindate.getMonth(), mindate.getDate() + 72)
    }
    if (ndays > 180) {
      mindate = new Date(maxdate.getFullYear(), maxdate.getMonth(), maxdate.getDate() - 181)
    }
    var ndays = Math.round((maxdate - mindate) / (24 * 60 * 60 * 1e3));
    var remainder = (750 - 30) % ndays;
    if (remainder > 90) {
      var remainder = (750 - 30) % Math.floor(ndays / 2)
    }
    var mychart = dc.barChart("#" + mydiv.attr("id")).width(750).height(130).transitionDuration(200).margins({
      top: 10,
      right: remainder,
      bottom: 20,
      left: 30
    }).dimension(dashboard.dim[dimname]).group(dashboard.groups[dimname]).centerBar(false).gap(1).elasticY(true).x(d3.time.scale().domain([mindate, maxdate]).rangeRound([ndays])).round(d3.time.day.round).xUnits(d3.time.days).renderHorizontalGridLines(true).renderVerticalGridLines(true);
    dashboard.renderlet.init(mychart.renderlet);
    return target
  }
})(jQuery);
(function ($) {
  $.fn.hourchart = function (options) {
    var target = this;
    var id = "#" + target.attr("id");
    var item = options.item;
    var dimname = item + "_hour";
    var title = options.title || "Date";
    var chartid = "hour-chart";
    dashboard.dim[dimname] = dashboard.data.dimension(oh.utils.gethour(item));
    dashboard.groups[dimname] = dashboard.dim[dimname].group(Math.floor);
    var mydiv = $("<div/>").addClass("chart").attr("id", chartid);
    var titlediv = $("<div/>").addClass("title").appendTo(mydiv);
    $("<span/>").text(title).appendTo(titlediv);
    titlediv.append("&nbsp;");
    $("<a/>").addClass("reset").attr("href", "#").attr("style", "display:none;").text("(reset)").appendTo(titlediv).on("click", function (e) {
      e.preventDefault();
      mychart.filterAll();
      dc.redrawAll();
      return false
    });
    mydiv.appendTo(target);
    var mychart = dc.barChart("#" + mydiv.attr("id")).width(295).height(130).transitionDuration(200).margins({
      top: 10,
      right: 25,
      bottom: 20,
      left: 30
    }).dimension(dashboard.dim[dimname]).group(dashboard.groups[dimname]).elasticY(true).centerBar(false).gap(1).round(dc.round.floor).x(d3.scale.linear().domain([0, 24]).rangeRound([0, 10 * 24])).renderHorizontalGridLines(true).renderVerticalGridLines(true);
    dashboard.renderlet.init(mychart.renderlet);
    return target
  }
})(jQuery);
(function ($) {
  $.fn.wordcloud = function (options) {
    var target = this;
    var id = "#" + target.attr("id");
    var variable = options.item;
    var title = options.title || "";
    var width = options.width || 350;
    var height = options.height || 240;
    var font = options.font || "Helvetica";
    var wcdelay = oh.utils.delayexec();
    var chartid = "wc-" + Math.random().toString(36).substring(7);
    var resizable = options.resizable || false;
    var maxwords = options.maxwords || 50;
    var mydim = dashboard.dim[variable] = dashboard.data.dimension(oh.utils.get(variable));
    var mydiv = $("<div/>").addClass("wccontainer").addClass("well").css("height", height).appendTo(target);
    var titlediv = $("<div/>").addClass("title").appendTo(mydiv);
    titlediv.append("&nbsp;");
    $("<span/>").text(title).appendTo(titlediv);
    $("<a/>").addClass("refresh").addClass("hide").text("(refresh)").appendTo(titlediv).on("click", function (e) {
      chartdiv.empty();
      _.delay(update, 300)
    });
    var filterinput = $("<input />").attr("type", "text").attr("placeholder", "filter").appendTo(mydiv).on("keyup", function () {
      filter(this.value);
      dc.redrawAll()
    });
    $("<a/>").addClass("reset").addClass("hide").appendTo(titlediv).on("click", function () {
      setvalue()
    });
    var chartdiv = $("<div/>").addClass("chart").attr("id", chartid).appendTo(mydiv);

    function setvalue(newval) {
      filterinput.val(newval || "");
      filterinput.trigger("keyup")
    }

    function filter(word) {
      var filterfun = word ? function (val) {
        return new RegExp(word, "i").test(val)
      } : null;
      mydim.filter(filterfun)
    }

    function build(words) {
      var fill = d3.scale.category20();
      var minval = words.slice(-1)[0]["size"];
      var maxval = words[0]["size"];
      var logscale = d3.scale.linear().range([18, 30]).domain([minval, maxval]);
      d3.layout.cloud().size([width, height]).words(words).rotate(function (d) {
        return ~~(Math.random() * 3) * 45 - 45
      }).font(font).fontSize(function (d) {
        return logscale(d.size)
      }).on("end", function (words) {
        d3.select("#" + chartid).append("svg").attr("width", width).attr("height", height).append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")").selectAll("text").data(words).enter().append("a").on("click", function (d) {
          setvalue(d.text);
          return false
        }).append("text").style("font-size", function (d) {
          return d.size + "px"
        }).style("font-family", font).style("fill", function (d, i) {
          return fill(i)
        }).attr("text-anchor", "middle").attr("transform", function (d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"
        }).text(function (d) {
          return d.text
        })
      }).start()
    }

    function refresh(fade) {
      if (fade && !chartdiv.is(":empty")) {
        chartdiv.fadeOut(500, function () {
          update()
        })
      } else {
        update()
      }
    }

    function update() {
      var starttime = (new Date).getTime();
      chartdiv.empty();
      var alldata = dashboard.dim.main.top(9999);
      var textarray = alldata.map(function (d) {
        return d[variable]
      });
      var wordcounts = wordmap(textarray.join(" "), maxwords);
      var words = wordcounts.map(function (d) {
        return {text: d.key, size: d.value}
      });
      build(words);
      var enddtime = (new Date).getTime();
      var delta = enddtime - starttime;
      dashboard.message("updating wordcloud took: " + delta + "ms.");
      $(chartdiv).fadeIn(500)
    }

    dashboard.renderlet.register(function () {
      if (chartdiv.is(":visible")) {
        refresh()
      }
    }, 500);
    dashboard.wordcloud = dashboard.wordcloud || [];
    dashboard.wordcloud.push(chartdiv);
    mydiv.draggable({containment: "body", snap: "body", snapMode: "inner"});
    if (resizable) {
      mydiv.resizable({
        start: function () {
          chartdiv.empty()
        }, stop: function (event, ui) {
          width = ui.size.width;
          height = ui.size.height;
          update()
        }
      })
    }
    return chartdiv
  };
  wordmap = function () {
    var stopWords = /^(not_displayed|skipped|i|me|my|myself|we|us|our|ours|ourselves|you|your|yours|yourself|yourselves|he|him|his|himself|she|her|hers|herself|it|its|itself|they|them|their|theirs|themselves|what|which|who|whom|whose|this|that|these|those|am|is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|will|would|should|can|could|ought|i'm|you're|he's|she's|it's|we're|they're|i've|you've|we've|they've|i'd|you'd|he'd|she'd|we'd|they'd|i'll|you'll|he'll|she'll|we'll|they'll|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|doesn't|don't|didn't|won't|wouldn't|shan't|shouldn't|can't|cannot|couldn't|mustn't|let's|that's|who's|what's|here's|there's|when's|where's|why's|how's|a|an|the|and|but|if|or|because|as|until|while|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|up|upon|down|in|out|on|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|say|says|said|shall)$/;
    var punctuation = /[!"&()*+,-\.\/:;<=>?\[\\\]^`\{|\}~]+/g;
    var wordSeparators = /[\s\u3031-\u3035\u309b\u309c\u30a0\u30fc\uff70]+/g;
    var discard = /^(@|https?:)/;
    var maxLength = 30;

    function entries(map) {
      var entries = [];
      for (var key in map)entries.push({key: key, value: map[key]});
      return entries
    }

    return function (text, maxwords) {
      var tags = {};
      var cases = {};
      text.split(wordSeparators).forEach(function (word) {
        if (discard.test(word))return;
        word = word.replace(punctuation, "");
        if (stopWords.test(word.toLowerCase()))return;
        word = word.substr(0, maxLength);
        cases[word.toLowerCase()] = word;
        tags[word = word.toLowerCase()] = (tags[word] || 0) + 1
      });
      tags = entries(tags).sort(function (a, b) {
        return b.value - a.value
      });
      tags.forEach(function (d) {
        d.key = cases[d.key]
      });
      return tags.slice(0, maxwords)
    }
  }()
})(jQuery);
(function ($) {
  $.fn.responsemodal = function (options) {
    var target = this;
    var itemcells = {};
    var titleitem = dashboard.config.item_main;
    $(dashboard.config.modal).each(function (i, value) {
      var mytr = $("<tr />");
      $("<td />").text(value.title).appendTo(mytr);
      itemcells[value.item] = $("<td />").text(" - ").appendTo(mytr);
      $("#responsemodal tbody").append(mytr)
    });
    var currentd;

    function showmodal(d) {
      currentd = d;
      $.each(itemcells, function (item, td) {
        td.text(replaceit(d[item]))
      });
      var modaltitle = d[titleitem] || "title unavailable";
      $("#responsemodal .modal-header h3").text(modaltitle.substring(0, 30));
      $("#resphoto").attr("src", "images/loading1.gif");
      $("#resphoto").attr("src", oh.getimageurl(d));
      $("#responsemodal").modal();
      oh.utils.state(dashboard.campaign_urn, d["hash"])
    }

    function showfirst() {
      showmodal(dashboard.dim.main.top(1)[0])
    }

    function shownext() {
      if (!currentd) {
        showfirst()
      } else {
        var alldata = dashboard.dim.main.top(9999);
        var index = $.inArray(currentd, alldata);
        if (index < 0 || index == alldata.length - 1) {
          return showmodal(alldata[0])
        }
        showmodal(alldata[index + 1])
      }
    }

    function showprev() {
      if (!currentd) {
        showfirst()
      } else {
        var alldata = dashboard.dim.main.top(9999);
        var index = $.inArray(currentd, alldata);
        if (index < 0 || index == 0) {
          return showmodal(alldata[alldata.length - 1])
        }
        showmodal(alldata[index - 1])
      }
    }

    $("#previtem").on("click", function () {
      showprev();
      return false
    });
    $("#nextitem").on("click", function () {
      shownext();
      return false
    });
    $("#responsemodal").on("hide", function () {
      oh.utils.state(dashboard.campaign_urn)
    });
    $("img#resphoto").on("error", function () {
      $(this).attr("src", "images/nophoto.jpg")
    });
    return {showmodal: showmodal, shownext: shownext, showprev: showprev}
  };
  function replaceit(x) {
    if (!x || x == "" || x == "NOT_DISPLAYED" || x == "SKIPPED")return " - ";
    return x
  }
})(jQuery);
(function ($) {
  $.fn.filtercount = function (options) {
    var titlediv = $("<div/>").addClass("title").addClass("dc-data-count").attr("id", "data-count");
    $("<span/>").addClass("filter-count").appendTo(titlediv);
    titlediv.append(" selected out of ");
    $("<span/>").addClass("total-count").appendTo(titlediv);
    titlediv.append(" records | ");
    $("<a/>").addClass("reset").attr("href", "#").text("(reset all)").appendTo(titlediv).on("click", function (e) {
      e.preventDefault();
      $("#wcpanel .reset").trigger("click");
      if (dashboard.map)dashboard.map.resetall();
      dc.filterAll();
      dc.renderAll();
      return false
    });
    this.append(titlediv);
    dc.dataCount("#data-count").dimension(dashboard.data).group(dashboard.groups.all);
    return this
  }
})(jQuery);
function inithelp() {
  $("#helpbutton").on("click", function () {
    window.open("help.html");
    return false
  })
}
