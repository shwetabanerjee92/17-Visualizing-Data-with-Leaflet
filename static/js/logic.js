// Store our API endpoint inside queryUrl
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";
var queryUrl2 = "PB2002_boundaries.json"; //requires local server

// Perform a GET request to the query URL
d3.json(queryUrl, function(data) {
  d3.json(queryUrl2, function(data2) {
  createFeatures(data, data2);
});
});

function createFeatures(earthquakeData, faultlineData) {

  faultlines = L.geoJson(faultlineData, {style:{color:"red",weight: 5}});

  var geojson = L.choropleth(earthquakeData, {
    valueProperty: "mag",   // Define what  property in the features to use
    scale: ["#ffffb2", "#b10026"], // Set color scale
    steps: 6, // Number of breaks in step range
    mode: "e", // q for quartile, e for equidistant, k for k-means
  });

  // function to color cirles and legend based on mag
  function chooseColor(mag) {
    if (parseInt(mag) >= 5)
      {return "#b10026";}
    else if (parseInt(mag) >= 4)
      {return "#c03342";}
    else if (parseInt(mag) >= 3)
      {return "#d0665e";}
    else if (parseInt(mag) >= 2)
      {return "#df997a";}
    else if (parseInt(mag) >= 1)
      {return "#efcc96";}
    else {
      return "#ffffb2";
    }
  }

  var earthquakes = L.geoJSON(earthquakeData, {
    // add circle marker with size and color based on mag
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(
          latlng,{
          radius: feature.properties.mag * 10,
          fillColor: chooseColor(feature.properties.mag),
          color: chooseColor(feature.properties.mag),
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8})
    },
    // add popup text to each circle
    onEachFeature: function(feature, layer) {
      layer.bindPopup("Location: " + feature.properties.place + "<br>Magnitude: " + feature.properties.mag);
    }
  });

  var legend = L.control({ position: "bottomright" });
  legend.onAdd = function() {
    var div = L.DomUtil.create("div", "info legend");
    var limits = geojson.options.limits;
    var colors = geojson.options.colors;
    var labels = [];

    // Add legend headers
    var legendInfo = "<h3>Earthquake Magnitude</h3>" +
      "<div class=\"labels\">" +
        "<div class=\"mid\">0-1</div>" +
        "<div class=\"mid\">1-2</div>" +
        "<div class=\"mid\">2-3</div>" +
        "<div class=\"mid\">3-4</div>" +
        "<div class=\"mid\">4-5</div>" +
        "<div class=\"mid\">5+</div>" +
      "</div>";

    div.innerHTML = legendInfo;

    limits.forEach(function(limit, index) {
      labels.push("<li style=\"background-color: " + chooseColor(index) + "\"></li>");
    });

    div.innerHTML += "<ul>" + labels.join("") + "</ul>";
    return div;
  };

  // Sending our earthquakes layer to the createMap function
  createMap(earthquakes, faultlines, legend);
}

function createMap(earthquakes, faultlines, legend) {

  // Define lightmap layers
  var lightmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.light",
    accessToken: API_KEY
  });

  // Define outdoorsmap layers
  var outdoorsmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.outdoors",
    accessToken: API_KEY
  });

  // Define satellitemap layers
  var satellitemap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.satellite",
    accessToken: API_KEY
  });

  // Define a baseMaps object to hold our base layers
  var baseMaps = {
    "Satellite Map": satellitemap,
    "Outdoors Map": outdoorsmap,
    "Light Map": lightmap
  };

  // Create overlay object to hold our overlay layer
  var overlayMaps = {
    Earthquakes: earthquakes,
    "Fault Lines": faultlines
  };

  // Create our map, giving it the satellitemap and earthquakes layers to display as defaults
  var myMap = L.map("map", {
    center: [
      37.09, -95.71
    ],
    zoom: 5,
    layers: [satellitemap, earthquakes]
  });

  // Create a layer control
  // Pass in our baseMaps and overlayMaps
  // Add the layer control to the map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);

  // Adding legend to the map
  legend.addTo(myMap);
}
