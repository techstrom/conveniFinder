var map;
var baseLatLng;
var baseZoom;
var myCircle;
var lastLatLng;

function relocation(){
    var w = window.innerWidth;
    var h = window.innerHeight;
    var v;
    if(w<h){
        if(h>w*2){
            v = h/2;
        }else{
            v = w;
        }
        $("#map").css("width", w);
        $("#map").css("height", v);
        $("#listarea").css("width", w);
        $("#listarea").css("height", h-v-50);
        $("#listarea").css("left", 0);
        $("#listarea").css("top", w);
    }else{
        if(w>h*2){
            v = w/2;
        } else {
            v = h;
        }
        $("#map").css("width", v);
        $("#map").css("height", h);
        $("#listarea").css("width", v);
        $("#listarea").css("height", h);
        $("#listarea").css("left", v);
        $("#listarea").css("top", 0);
    }
}

//地図の初期化
function initMap(){
    map = L.map('map');
    $(window).bind("load resize", function(){
        relocation();
    });
    relocation();
    
    $("#listarea").css("font-size", window.devicePixelRatio * 100 + "%");
    $("#listarea").css("overflow", "scroll");
    var tmp_llz = localStorage.getItem('last_llz');
    if(tmp_llz == null){
        baseLatLng = new L.LatLng(35.62571, 139.34145);
        baseZoom = 15;
    } else {
         tmp_llz = JSON.parse(tmp_llz);
         lastLatLng = baseLatLng = new L.LatLng(tmp_llz.lat, tmp_llz.lng);
         baseZoom = tmp_llz.zoom;
    }
    var w = document.documentElement.clientWidth;
    if(w > document.documentElement.clientHeight){
        w = document.documentElement.clientHeight;
    }
    sizectrl=parseInt(parseInt(w)*100/6400)*10;
    // leaflet.jsの初期設定
    //  OSMタイルサーバとタイル指定フォーマットの設定。コピーライトもつける
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
    	attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
	}).addTo(map);
    map.setView(baseLatLng, baseZoom, false);
    myCircle = L.circle(baseLatLng, 10, {color: "#ff0000"}).addTo(map);

    map.on('movestart', function(e) {
        lastLatLng = map.getCenter();
    });
    map.on('moveend', function(e) {
        var tmp_llz;
        var curLatLng = map.getCenter();
        tmp_llz = {"lat":curLatLng.lat,"lng":curLatLng.lng,"zoom":map.getZoom()};
        localStorage.setItem('last_llz', JSON.stringify(tmp_llz));
        recalcDist();
        myCircle.setRadius(10).setLatLng(curLatLng);
        if(lastLatLng.distanceTo(curLatLng) > 250){
            findConveni();
        }
    });
    map.on('drag', function(e) {
        map.stopLocate();
    });
    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);
    
    findConveni();
};

function recalcDist(){
    listItems = $('#myList').find('li');

    for ( i = 0; i < listItems.length; i++ ) {
        var p = new L.LatLng($(listItems[i]).find('span.lat')[0].innerText,
            $(listItems[i]).find('span.lon')[0].innerText);
        
        var dist = map.getCenter().distanceTo(p);
        var distv = dist;
        var distu = "m";
        if(distv > 1000){
            distv = Math.round(distv/10)/100;
            distu = "km";
        }else{
            distv = Math.round(distv);
            distu = "m";
        }

        $(listItems[i]).find('span.dist')[0].innerHTML = dist;
        $(listItems[i]).find('span.distv')[0].innerHTML = distv;
        $(listItems[i]).find('span.distu')[0].innerHTML = distu;
    }
    sortList();
}

var request=null;
var overpassGeoData=null;

function findConveni(){
    ll = map.getCenter();
    var url="http://overpass.osm.rambler.ru/cgi/interpreter?data=node(around:1000,"+ll.lat+","+ll.lng+")[%22shop%22=%22convenience%22];out;";
    request= new XMLHttpRequest();
    request.open("GET",url,true);
    request.onreadystatechange=gotData;
    request.send(null);
}

function gotData(){
    if (request.readyState == 4 && request.status == 200){
        overpassGeoData = new L.osm4Leaflet(request.responseText, {
            data_mode: "xml", 
            afterParse: showOnMap,
        });
        
    }else{
    }
}

var storename;
var brandname;
var sizectrl;
function showOnMap() {
    $('#myList').empty();
    mygeoj = new L.GeoJSON(overpassGeoData.getGeoJSON(), {
        pointToLayer: function (feature, latlng) {
            var d=100;
            var iconW=parseInt(96*sizectrl/d);
            var iconAx=parseInt(96*sizectrl/(d*2));
            var iconAy=parseInt(96*sizectrl/(d*2));
            var iconH=parseInt(96*sizectrl/d);
            var iconPx=parseInt(1*sizectrl/d);
            var iconPy=parseInt(-34*sizectrl/d);

            var imagename = "images/conv-icon-other.png";
            brandname = feature.properties.tags["brand:ja"];
            if(brandname == null) brandname = feature.properties.tags["brand"];
            if(brandname == null) brandname = feature.properties.tags["operator:ja"];
            if(brandname == null) brandname = feature.properties.tags["operator"];
            if(brandname == null) brandname = feature.properties.tags["name:ja"];
            if(brandname == null) brandname = feature.properties.tags["name"];
            if(brandname != null){
                var s = brandname.lastIndexOf(" ");
                if(brandname.substring(brandname.length-1) == "店" && s > 0){
                    brandname = brandname.substring(0,s);
                }
                s = brandname.lastIndexOf("(");
                if(s > 0){
                    brandname = brandname.substring(0,s);
                }
                while(brandname.substring(brandname.length-1) == " "){
                    brandname = brandname.substring(0,brandname.length-1);
                }
            }
            storename = feature.properties.tags["name:ja"];
            if(storename == null) storename = feature.properties.tags["name"];
            if(storename == null) storename = feature.properties.tags["operator:ja"];
            if(storename == null) storename = feature.properties.tags["operator"];
            var branchname = feature.properties.tags["branch:ja"];
            if(branchname == null) branchname = feature.properties.tags["branch"];
            if(branchname != null) storename += branchname;
            
            switch(brandname){
                case "7eleven":
                case "7Eleven":
                case "7ELEVEN":
                case "7 ELEVEN":
                case "7 Eleven":
                case "7 eleven":
                case "711":
                case "7-11":
                case "セブンイレブン":
                case "セブン-イレブン":
                case "セブンイレブン・ジャパン":
                case "seveneleven":
                case "SevenEleven":
                case "SEVENELEVEN":
                    imagename = "images/conv-icon-7eleven.png";
                    break;
                case "circlek":
                case "circleK":
                case "Circlek":
                case "CircleK":
                case "サークルK":
                    imagename = "images/conv-icon-circleK.png";
                    break;
                case "DailyYamazaki":
                case "dailyyamazaki":
                case "デイリーヤマザキ":
                    imagename = "images/conv-icon-dailyYamazaki.png";
                    break;
                case "ファミリーマート":
                case "familymart":
                case "Familymart":
                case "FamilyMart":
                case "FAMILYMART":
                case "family mart":
                case "Family mart":
                case "Family Mart":
                case "FAMILY MART":
                    imagename = "images/conv-icon-famima.png";
                    break;
                case "スリーエフ":
                case "スリーエフ(Three F)":
                case "Three F":
                case "FFF":
                    imagename = "images/conv-icon-fff.png";
                    break;
                case "Lawson":
                case "lawson":
                case "LAWSON":
                case "ローソン":
                case "ナチュラルローソン":
                case "ローソンストア100":
                    imagename = "images/conv-icon-lawson.png";
                    break;
                case "ミニストップ":
                case "ministop":
                case "mini stop":
                case "MiniStop":
                case "Mini Stop":
                    imagename = "images/conv-icon-ministop.png";
                    break;
                case "SUNKUS":
                case "Sunkus":
                case "sunkus":
                case "サンクス":
                    imagename = "images/conv-icon-sunkus.png";
                    break;
            }
            var icon = new L.Icon({
                iconUrl: imagename,
                iconSize: [iconW,iconH],
                iconAnchor: [iconAx, iconAy],
                popupAnchor: [iconPx, iconPy], 
            });
            var dist = latlng.distanceTo(map.getCenter());
            var distv = dist;
            var distu = "m";
            if(distv > 1000){
                distv = Math.round(distv/10)/100;
                distu = "km";
            }else{
                distv = Math.round(distv);
                distu = "m";
            }
            $('#myList').append('<li onClick="clickLabel(this);"><span style="padding-left:'+40*window.devicePixelRatio+'px;"><img src="'+imagename+'" style="max-width:'+40*window.devicePixelRatio+'px;max-height:'+40*window.devicePixelRatio+'px;top:0;left:0;" class="ui-li-icon">'+storename+'</span>'
                +' [<span style="display: none;" class="dist">'+dist+"</span><span class='distv'>"+distv+"</span><span class='distu'>"+distu+"</span>]"
                +'<span style="display: none;" class="lat">'+latlng.lat+'</span>'
                +'<span style="display: none;" class="lon">'+latlng.lng+'</span>'
                +"</li>");
            $('#myList').listview('refresh');
            sortList();
            return new L.Marker(latlng, {icon: icon});
        },
        style: function (feature) {
            return {color: "green"};
        },
        onEachFeature: function (feature, layer) {
            var popup = $('<div><div class="popupcontents"><h3>'+storename+'</h3>'
                +'<h4 class="brand">'+brandname+'</h4>'
                +'<ul>'
                +'<li style="color: #aaaaaa;" class="phone">TEL：---</li>'
                +'<li style="color: #aaaaaa;" class="opening_hours">営業時間：不明</li>'
                +'<li style="color: #aaaaaa;" class="toilet">トイレ利用：不明</li>'
                +'<li style="color: #aaaaaa;" class="atm">ATM：不明</li>'
                +'<li style="color: #aaaaaa;" class="internet_access">ネット：不明</li>'
                +'<li style="color: #aaaaaa;" class="source">情報源：不明</li>'
                +'</ul></div></div>');
            $(popup.find("div.popupcontents")[0]).css("font-size",window.devicePixelRatio*100+"%");

            var myval = "";
            if (feature.properties && feature.properties.tags && !$.isEmptyObject(feature.properties.tags)) {
                for ( var key in feature.properties.tags ) {
                    if(key == "name" || key == "name:ja" || key == "operator" || key == "operator:ja" || key == "shop") continue;
                    if(key == "phone"){
                        $(popup.find('li.phone')[0]).html("TEL："+feature.properties.tags[key].replace("+81-","0")).css("color","black");
                    }else if(key == "opening_hours"){
                        myval = "営業時間： ";
                        if(feature.properties.tags[key] == "24/7"){
                            myval += "24時間";
                        }else{
                            myval += toLowerCase(feature.properties.tags[key])
                                .replace("mo","月")
                                .replace("tu","火")
                                .replace("we","水")
                                .replace("th","木")
                                .replace("fr","金")
                                .replace("sa","土")
                                .replace("su","日") ;
                        }
                        $(popup.find('li.opening_hours')[0]).html(myval).css("color","black");
                    }else if(key == "toilet"){
                        if(feature.properties.tags[key] == "yes" || feature.properties.tags[key] == "true" || feature.properties.tags[key] > 0){
                            myval = "トイレ：有り";
                        }else{
                            myval = "トイレ：無し";
                        }
                        $(popup.find('li.toilet')[0]).html(myval).css("color","black");
                    }else if(key == "atm"){
                        if(feature.properties.tags[key] == "yes" || feature.properties.tags[key] == "true" || feature.properties.tags[key] > 0){
                            myval = "ATM：有り";
                        }else{
                            myval = "ATM：無し";
                        }
                        $(popup.find('li.atm')[0]).html(myval).css("color","black");
                    }else if(key == "internet_access"){
                        myval = "ネット："+feature.properties.tags[key];
                        $(popup.find('li.internet_access')[0]).html(myval).css("color","black");
                    }else if(key == "source"){
                        var myval = "情報源：";
                        if(feature.properties.tags[key].toLowerCase().substring(0,6) == "survey"){
                            myval += "現地調査";
                        }else{
                            myval += feature.properties.tags[key];
                        }
                        $(popup.find('li.source')[0]).html(myval).css("color","black");
                    }
                }
            }
            layer.bindPopup(popup.html(),{autoPan: false});
        }
    }).addTo(map);
    sortList();
}

function sortList(){
        $('ul#myList li').datasort({
        datatype: 'number',
        sortElement : 'span.dist'
    });
}

function clickLabel(lilabel){
    var curLatLng = new L.LatLng(
            $(lilabel).find('span.lat')[0].innerText,
            $(lilabel).find('span.lon')[0].innerText);
    map.stopLocate();
    map.panTo(curLatLng, {animate: true});
    listConveni(curLatLng);
}

function listConveni(latLng){
    if(lastLatLng.distanceTo(latLng) > 250){
        recalcDist();
        findConveni();
        lastLatLng = latLng;
    }else{
        recalcDist();
    }
}

function findLocation() {
    map.locate({watch:true, timeout:45000, enableHighAccuracy:true});
}

function onLocationFound(e) {
    myCircle.setLatLng(e.latlng);
    myCircle.setRadius(e.accuracy/2);
    map.panTo(e.latlng);
    listConveni(e.latlng);
}

function onLocationError(e) {
    map.stopLocate();
}
