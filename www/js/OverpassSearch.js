function OverpassSearch(map){
    OverpassSearch.map = map;
    this.searchOptions = {};
}

function _setOverpassSearchOptions(options){
    // options:  center, radius, icon , baseURL, 
    //           onGotPOI | geoJsonOptions | (pointToLayer, onEachFeature, style, filter, coordsToLatLng)
    if(options===undefined) OverpassSearch.searchOptions = {};
    else {
        OverpassSearch.searchOptions = options;
        if(OverpassSearch.searchOptions.center == undefined) OverpassSearch.searchOptions.center = OverpassSearch.map.getCenter();
        if(OverpassSearch.searchOptions.radius == undefined) OverpassSearch.searchOptions.radius = 500;
        if(OverpassSearch.searchOptions.iconImage == undefined) OverpassSearch.searchOptions.iconImage = "images/marker-icon.png";
        if(OverpassSearch.searchOptions.icon == undefined) OverpassSearch.searchOptions.icon = new L.Icon({
                iconUrl: OverpassSearch.searchOptions.iconImage,
                iconSize: [25, 41],
                iconAnchor: [13, 41],
                popupAnchor: [0, -35], 
            });
        if(OverpassSearch.searchOptions.baseURL == undefined) OverpassSearch.searchOptions.baseURL = "http://overpass.osm.rambler.ru/cgi/interpreter?data=";

        if(OverpassSearch.searchOptions.onGotPOI == undefined) OverpassSearch.searchOptions.onGotPOI = _defaultGotPOI;

        if(OverpassSearch.searchOptions.geoJsonOptions == undefined)
            OverpassSearch.searchOptions.geoJsonOptions = {};
        if(OverpassSearch.searchOptions.geoJsonOptions.pointToLayer == undefined){
            if(OverpassSearch.searchOptions.pointToLayer != undefined){
                OverpassSearch.searchOptions.geoJsonOptions.pointToLayer = OverpassSearch.searchOptions.pointToLayer;
            }else{
                OverpassSearch.searchOptions.geoJsonOptions.pointToLayer = _defaultPointToLayer;
            }
        }
        if(OverpassSearch.searchOptions.geoJsonOptions.onEachFeature == undefined){
            if(OverpassSearch.searchOptions.onEachFeature != undefined){
                OverpassSearch.searchOptions.geoJsonOptions.onEachFeature = OverpassSearch.searchOptions.onEachFeature;
            }else{
                OverpassSearch.searchOptions.geoJsonOptions.onEachFeature = _defaultOnEachFeature;
            }
        }
        if(OverpassSearch.searchOptions.style != undefined){
            OverpassSearch.searchOptions.geoJsonOptions.style = OverpassSearch.searchOptions.style;
        }
        if(OverpassSearch.searchOptions.filter != undefined){
            OverpassSearch.searchOptions.geoJsonOptions.filter = OverpassSearch.searchOptions.filter;
        }
        if(OverpassSearch.searchOptions.coordsToLatLng != undefined){
            OverpassSearch.searchOptions.geoJsonOptions.coordsToLatLng = OverpassSearch.searchOptions.coordsToLatLng;
        }
    }
}

OverpassSearch.prototype = {
    searchPOI: function (target, options){
        if(target.key == undefined){
            this.searchPOIbyOverpassQL(target, options);
        }else{
            this.searchPOIbyKV(target, options);
        }
    },
    searchPOIbyKV: function (keyValue, options){
        _setOverpassSearchOptions(options);
        var query = "node(around:"
                +OverpassSearch.searchOptions.radius+","
                +OverpassSearch.searchOptions.center.lat+","
                +OverpassSearch.searchOptions.center.lng+")"
            +"[%22"
                +keyValue.key+"%22=%22"
                +keyValue.value+"%22];"
            +"out;"
        this.searchPOIbyOverpassQL(query, OverpassSearch.searchOptions);
    },
    searchPOIbyOverpassQL: function (query, options){
        _setOverpassSearchOptions(options);

        var url=OverpassSearch.searchOptions.baseURL
            +query;
        OverpassSearch.request= new XMLHttpRequest();
        OverpassSearch.request.open("GET",url,true);
        OverpassSearch.request.onreadystatechange=this.gotData;
        OverpassSearch.request.send(null);
    },
    gotData: function(){
        if (OverpassSearch.request.readyState == 4 && OverpassSearch.request.status == 200){
            OverpassSearch.overpassGeoData = new L.osm4Leaflet(OverpassSearch.request.responseText, {
                data_mode: "xml", 
                afterParse: OverpassSearch.onGotPOI,
            });
        }else{
        }
    },
}

OverpassSearch.onGotPOI = function(){
    OverpassSearch.searchOptions.onGotPOI(OverpassSearch.overpassGeoData);
}

function _defaultGotPOI(overpassGeoData){
    mygeoj = new L.GeoJSON(overpassGeoData.getGeoJSON(), OverpassSearch.searchOptions.geoJsonOptions).addTo(map);
}

function _defaultPointToLayer (feature, latlng) {
    return new L.Marker(latlng, {icon: OverpassSearch.searchOptions.icon});
}

function _defaultOnEachFeature (feature, layer) {
    layer.bindPopup('<div><div class="popupcontents"><h3>'+feature.properties.tags.name+'</h3>',{autoPan: false});
}