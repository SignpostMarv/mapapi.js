// License and Terms of Use
//
// Copyright (c) 2010 Linden Research, Inc.
// Copyright (c) 2011 SignpostMarv
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//
// This javascript makes use of the Second Life Map API, which is documented
// at http://wiki.secondlife.com/wiki/Map_API 
//
// Use of the Second Life Map API is subject to the Second Life API Terms of Use:
//   https://wiki.secondlife.com/wiki/Linden_Lab_Official:API_Terms_of_Use
//
// Questions regarding this javascript, and any suggested improvements to it, 
// should be sent to the mailing list opensource-dev@list.secondlife.com 
// ==============================================================================

Object.extend=function(a,b){for(property in b)a[property]=b[property];return a};
var SLURL={tileSize:256,gridEdgeSizeInRegions:1048576,mapFactor:90/1048576,minZoomLevel:8,maxZoomLevel:1,mouseHoverDelay:1E3,showHoverTips:false,backgroundColor:"#1D475F",getRegionCoordsByNameQueue:0,getRegionCoordsByNameVar:function(){return"slurlGetRegionCoordsByName_"+ ++SLURL.getRegionCoordsByNameQueue},getRegionCoordsByName:function(a,b,c){c=c||"slRegionPos_result";SLURL.loadScript("http://slurl.com/get-region-coords-by-name?var="+encodeURIComponent(c)+"&sim_name="+encodeURIComponent(a),function(){b(window[c])})},
getRegionNameByCoordsQueue:0,getRegionNameByCoordsVar:function(){return"slurlGetRegionNameByCoords_"+ ++SLURL.getRegionNameByCoordsQueue},getRegionNameByCoords:function(a,b,c,d){d=d||"slRegionName";SLURL.loadScript("http://slurl.com/get-region-name-by-coords?var="+encodeURIComponent(d)+"&grid_x="+encodeURIComponent(a)+"&grid_y="+encodeURIComponent(b),function(){c(window[d])})},gotoSLURL:function(a,b,c,d){function e(f,g,h){var i=["secondlife://"+encodeURIComponent(f),g%1*256,h%1*256].join("/");a.addMapWindow(new window.MapWindow("<b>"+
f+"</b><br>"+(slDebugMap?" x: "+Math.floor(g)+" y: "+Math.floor(h):"")+'<a href="'+i+'" class="teleport-button">Teleport Now</a>'),new SLURL.XYPoint(g,h))}if(typeof b=="number"){d=c;c=b;b=undefined}if(b==undefined)SLURL.getRegionNameByCoords(Math.floor(c),Math.floor(d),function(f){if(typeof f=="string")e(f,c,d);else if((f==null||f.error)&&slDebugMap)alert("The coordinates of the SLURL ("+c+", "+d+") were not recognised as being in a SecondLife region.")},SLURL.getRegionCoordsByNameVar());else{c=c||
128;d=d||128;SLURL.getRegionCoordsByName(b,function(f){if(f.x&&f.y){c=f.x+c/256;d=f.y+d/256;slParanoidMap?SLURL.gotoSLURL(a,c,d):e(b,c,d)}else f.error&&slDebugMap&&alert('No coordinates could be found for region "'+b+'"')},SLURL.getRegionNameByCoordsVar())}},loadScript:function(a,b){var c=document.createElement("script");c.src=a;c.type="text/javascript";if(b){c.onload=b;c.onreadystatechange=function(){if(c.readyState=="complete"||c.readyState=="loaded")b()}}document.body.appendChild(c)},getTileUrl:function(a,
b){var c=SLURL.convertZoom(b),d=Math.pow(2,c-1),e=a.x*d,f=a.y*d,g=SLURL.gridEdgeSizeInRegions;g-=g%d;f=g-f;f-=d;e-=e%d;f-=f%d;return["http://map.secondlife.com.s3.amazonaws.com","http://map.secondlife.com"][e/d%2]+["/map",c,e,f,"objects.jpg"].join("-")},convertZoom:function(a){return 8-a},XYPoint:function(a,b){this.x=a;this.y=b},RegionPoint:function(a,b,c){var d=this;SLURL.getRegionCoordsByName(a,function(e){if(slDebugMap)if(e==undefined)alert("API query for region coordinates failed");else e.error&&
alert("API query returned an error");else if(typeof e=="object")if(e.x&&e.y){d.x=e.x+Math.min(Math.max(b,0),256)/256;d.y=e.y+Math.min(Math.max(c,0),256)/256;d.found=true}},SLURL.getRegionCoordsByNameVar())},Bounds:function(a,b,c,d){this.xMin=a||0;this.xMax=b||0;this.yMin=c||0;this.yMax=d||0}};SLURL.RegionPoint.prototype=new SLURL.XYPoint;function getRandomNumber(a){return Math.floor(Math.random()*a)}var slDebugMap=false,slParanoidMap=false;
function EuclideanProjection(a){this.pixelsPerLonDegree=[];this.pixelsPerLonRadian=[];this.pixelOrigo=[];this.tileBounds=[];for(var b=512,c=1,d=0;d<a;d++){var e=b/2;this.pixelsPerLonDegree.push(b/360);this.pixelsPerLonRadian.push(b/(2*Math.PI));this.pixelOrigo.push(new GPoint(e,e));this.tileBounds.push(c);b*=2;c*=2}}EuclideanProjection.prototype=new GProjection;
EuclideanProjection.prototype.fromLatLngToPixel=function(a,b){var c=a.lng()/SLURL.mapFactor,d=-a.lat()/SLURL.mapFactor;c=c*SLURL.tileSize;d=d*SLURL.tileSize;b=SLURL.convertZoom(b);var e=Math.pow(2,b-1);return new GPoint(c/e,d/e)};EuclideanProjection.prototype.fromPixelToLatLng=function(a,b,c){b=SLURL.convertZoom(b);b=Math.pow(2,b-1);return new GLatLng(-(a.y*b/SLURL.tileSize*SLURL.mapFactor),a.x*b/SLURL.tileSize*SLURL.mapFactor,c)};
EuclideanProjection.prototype.tileCheckRange=function(a){return a.x<0||a.y<0?false:true};EuclideanProjection.prototype.getWrapWidth=function(a){return this.tileBounds[a]*SLURL.gridEdgeSizeInRegions};SLURL.XYPoint.prototype.GetGLatLng=function(){return new GLatLng(-(SLURL.gridEdgeSizeInRegions-this.y)*SLURL.mapFactor,this.x*SLURL.mapFactor)};SLURL.XYPoint.prototype._SetFromGLatLng=function(a){this.x=a.lng()/SLURL.mapFactor;this.y=-a.lat()/SLURL.mapFactor;this.y=SLURL.gridEdgeSizeInRegions-this.y};
SLURL.Bounds.prototype._SetFromGLatLngBounds=function(a){var b=new SLURL.XYPoint,c=new SLURL.XYPoint;b._SetFromGLatLng(a.getSouthWest());c._SetFromGLatLng(a.getNorthEast());this.xMin=b.x;this.yMin=b.y;this.xMax=c.x;this.yMax=c.y};function Img(a,b,c,d){this.isAlpha=function(){return this.alpha};this.URL=a;this.width=b;this.height=c;this.alpha=d?true:false}function Icon(a,b){this.hasShadow=function(){return this.shadowImg?true:false};this.mainImg=a;if(b)this.shadowImg=b}
function Marker(a,b,c){this.icons=a;this.slCoord=b;this.options=new MarkerOptions(c)}function MarkerOptions(a){this.centerOnClick=this.onMouseOutHandler=this.onMouseOverHandler=this.clickHandler=false;this.autopanOnClick=true;this.autopanPadding=45;this.verticalAlign="middle";this.horizontalAlign="center";this.zLayer=0;a&&Object.extend(this,a)}function MapWindow(a,b){this.text=a;this.options=b}
MapWindow.prototype.getGMapOptions=function(){var a=252;if(this.options&&this.options.width)a=this.options.width;return{maxWidth:a}};function SLMapOptions(a){this.hasOverviewMapControl=this.hasPanningControls=this.hasZoomControls=true;this.onStateChangedClickHandler=null;this.zoomMin=SLURL.minZoomLevel;this.zoomMax=SLURL.maxZoomLevel;a&&Object.extend(this,a);if(this.zoomMin>SLURL.minZoomLevel)this.zoomMin=SLURL.minZoomLevel;if(this.zoomMax<SLURL.maxZoomLevel)this.zoomMax=SLURL.maxZoomLevel}
function SLMap(a,b){this.ID=null;this.showingHoverWindow=false;if(GBrowserIsCompatible()){this.options=new SLMapOptions(b);this.mapProjection=new EuclideanProjection(18);var c=this.CreateMapTypes(),d=this.CreateMapDiv(a);this.GMap=new GMap2(d,{mapTypes:c,backgroundColor:SLURL.backgroundColor});this.GMap.slMap=this;this.currentMapWindow=null;this.voiceMarkers=[];var e=d=c=true;if(this.options!=undefined){if(this.options.hasPanningControls==false)d=false;if(this.options.hasZoomControls==false)c=false;
if(this.options.hasOverviewMapControl==false)e=false}if(c||d)this.GMap.addControl(new GSmallMapControl);e&&this.GMap.addControl(new GOverviewMapControl);this.GMap.enableContinuousZoom();this.GMap.enableScrollWheelZoom();this.GMap.setCenter(new GLatLng(0,0),16);this.GMap.addControl(new GMapTypeControl);var f=this;GEvent.addListener(this.GMap,"click",function(g,h){slMapClickHandler(f,g,h)});GEvent.addListener(this.GMap,"moveend",function(){f.onStateChangedHandler()});if(SLURL.showHoverTips){GEvent.addListener(this.GMap,
"mousemove",function(g){f.onMouseMoveHandler(g)});GEvent.addListener(this.GMap,"mouseout",function(g){f.onMouseOutHandler(g)})}GEvent.addListener(this.GMap,"dragstart",function(){slMapDragHandler(f)});this.GMarkerManager=new GMarkerManager(this.GMap)}else this.GMap=null}SLMap.prototype.onStateChangedHandler=function(){this.options&&this.options.onStateChangedHandler&&this.options.onStateChangedHandler()};
SLMap.prototype.onMouseMoveHandler=function(a){this.resetHoverTimeout(true);this.hoverPos=a;this.showingHoverWindow&&this.GMap.closeInfoWindow()};SLMap.prototype.onMouseOutHandler=function(){this.clearHoverTimeout(true)};SLMap.prototype.clearHoverTimeout=function(){if(this.ID!=null){window.clearTimeout(this.ID);this.ID=null}};SLMap.prototype.resetHoverTimeout=function(a){var b=this.ID!=null;this.clearHoverTimeout();if(b||a){var c=this;this.ID=window.setTimeout(function(){c.mousehoverHandler()},SLURL.mouseHoverDelay)}};
SLMap.prototype.mousehoverHandler=function(){tilePos=new SLURL.XYPoint;tilePos._SetFromGLatLng(this.hoverPos);this.showTileToolTip()};SLMap.prototype.getRegionName=function(){return"Test Region Name"};SLMap.prototype.showTileToolTip=function(){var a=this;this.ID=null;var b="";b=this.getRegionName();this.GMap.openInfoWindowHtml(this.hoverPos,b,{onCloseFn:function(){a.hoverWindowCloseHandler()}});this.showingHoverWindow=true};
SLMap.prototype.hoverWindowCloseHandler=function(){this.showingHoverWindow=false;this.resetHoverTimeout(false)};
SLMap.prototype.CreateMapTypes=function(){var a=[],b=new GCopyrightCollection("SecondLife"),c=new GCopyright(1,new GLatLngBounds(new GLatLng(0,0),new GLatLng(-90,90)),0,"(C) 2007 - "+(new Date).getFullYear()+" Linden Lab");b.addCopyright(c);b=[new GTileLayer(b,10,16)];b[0].getTileUrl=SLURL.getTileUrl;b=new GMapType(b,this.mapProjection,"Land");b.getMinimumResolution=function(){return SLURL.convertZoom(SLURL.minZoomLevel)};b.getMaximumResolution=function(){return SLURL.convertZoom(SLURL.maxZoomLevel)};
a.push(b);return a};
SLMap.prototype.CreateMapDiv=function(a){var b=this,c=document.createElement("div");c.style.height="100%";if(b.options.showRegionSearchForm){var d=document.createElement("form"),e=document.createTextNode("Enter region name:"),f=document.createElement("span"),g=document.createElement("input"),h=document.createElement("input"),i=function(){g?b.gotoRegion(g.value):alert("Can't find textField!");return false};d.setAttribute("style","text-align:center;padding:4px;width:270px;margin-left:auto;margin-right:auto;background-color:#fff");d.onsubmit=
i;f.style.fontSize="80%";f.appendChild(e);g.value="Ahern";g.size=15;h.type="submit";h.value="Go!";h.onsubmit=i;d.appendChild(f);d.appendChild(g);d.appendChild(h);a.appendChild(d)}a.appendChild(c);return c};
SLMap.prototype.gotoRegion=function(a){var b=this,c="http://slurl.com/get-region-coords-by-name?var=slRegionPos_result&sim_name="+encodeURIComponent(a);SLURL.loadScript(c,function(){if(slRegionPos_result.error)alert("The region name '"+a+"' was not recognised.");else{var d=new SLURL.XYPoint(slRegionPos_result.x,slRegionPos_result.y);b.panOrRecenterToSLCoord(d)}})};
SLMap.prototype.centerAndZoomAtSLCoord=function(a,b){if(this.GMap!=null){b=this._forceZoomToLimits(b);this.GMap.setCenter(a.GetGLatLng(),SLURL.convertZoom(b))}};SLMap.prototype.disableDragging=function(){this.GMap!=null&&this.GMap.disableDragging()};SLMap.prototype.enableDragging=function(){this.GMap!=null&&this.GMap.enableDragging()};
SLMap.prototype.getViewportBounds=function(){if(this.GMap!=null){gLatLngBounds=this.GMap.getBounds();viewBounds=new SLURL.Bounds;viewBounds._SetFromGLatLngBounds(gLatLngBounds);return viewBounds}};SLMap.prototype.getMapCenter=function(){if(this.GMap!=null){gCenter=this.GMap.getCenter();center=new SLURL.XYPoint;center._SetFromGLatLng(gCenter);return center}};
function slMapDragHandler(a){if(a.currentMapWindow!=null)if(a.currentMapWindow.options)if(a.currentMapWindow.options.closeOnMove){a.GMap.closeInfoWindow();a.currentMapWindow=null}}function slMapClickHandler(a,b,c){if(b==null){slCoord=new SLURL.XYPoint;slCoord._SetFromGLatLng(c);SLURL.gotoSLURL(a,slCoord.x,slCoord.y)}else if(b=b.slMarker){b.options.centerOnClick&&a.panOrRecenterToSLCoord(b.slCoord);b.options.clickHandler&&b.options.clickHandler(b)}}
SLMap.prototype.clickMarker=function(a){slMapClickHandler(this,a.gmarker,a.gmarker.getPoint())};
SLMap.prototype.addMarker=function(a,b){if(this.GMap!=null){var c=a.icons[0],d=new GIcon;d.image=c.mainImg.URL;d.iconSize=new GSize(c.mainImg.width,c.mainImg.height);if(c.shadowImg){d.shadow=c.shadowImg.URL;d.shadowSize=new GSize(c.shadowImg.width,c.shadowImg.height)}else d.shadowSize=d.iconSize;c=d.iconSize.width/2;if(a.options.horizontalAlign=="left")c=0;else if(a.options.horizontalAlign=="right")c=d.iconSize.width;var e=d.iconSize.height/2;if(a.options.verticalAlign=="top")e=0;else if(a.options.verticalAlign==
"bottom")e=d.iconSize.height;d.iconAnchor=new GPoint(c,e);d.infoWindowAnchor=d.iconAnchor;c=a.slCoord.GetGLatLng();e=false;if(b||a.options.centerOnClick||a.options.clickHandler||a.options.onMouseOverHandler||a.options.onMouseOutHandler)e=true;var f=0;if(a.options.zLayer)f=a.options.zLayer;a.gmarker=new GMarker(c,{icon:d,clickable:e,draggable:false,zIndexProcess:function(){return f}});a.gmarker.slMarker=a;b&&GEvent.addListener(a.gmarker,"click",function(){a.gmarker.openInfoWindowHtml(b.text,b.getGMapOptions());
this.currentMapWindow=b});a.options.onMouseOverHandler&&GEvent.addListener(a.gmarker,"mouseover",function(){a.options.onMouseOverHandler(a)});a.options.onMouseOutHandler&&GEvent.addListener(a.gmarker,"mouseout",function(){a.options.onMouseOutHandler(a)});this.GMap.addOverlay(a.gmarker)}};SLMap.prototype.removeMarker=function(a){if(this.GMap!=null)if(a.gmarker){this.GMap.removeOverlay(a.gmarker);a.gmarker=null}};SLMap.prototype.removeAllMarkers=function(){this.GMap!=null&&this.GMap.clearOverlays()};
SLMap.prototype.addMapWindow=function(a,b){if(this.GMap!=null){this.GMap.openInfoWindowHtml(b.GetGLatLng(),a.text,a.getGMapOptions());this.currentMapWindow=a}};SLMap.prototype.zoomIn=function(){if(this.GMap!=null){if(this.options&&this.options.zoomMax)if(this.getCurrentZoomLevel()<=this.options.zoomMax)return;this.GMap.zoomIn()}};SLMap.prototype.zoomOut=function(){if(this.GMap!=null){if(this.options&&this.options.zoomMin)if(this.getCurrentZoomLevel()>=this.options.zoomMin)return;this.GMap.zoomOut()}};
SLMap.prototype.getCurrentZoomLevel=function(){if(this.GMap!=null)return SLURL.convertZoom(this.GMap.getZoom())};SLMap.prototype._forceZoomToLimits=function(a){if(this.options&&this.options.zoomMax)if(a<this.options.zoomMax)a=this.options.zoomMax;if(this.options&&this.options.zoomMin)if(a>this.options.zoomMin)a=this.options.zoomMin;return a};SLMap.prototype.setCurrentZoomLevel=function(a){if(this.GMap!=null){a=this._forceZoomToLimits(a);this.GMap.setZoom(SLURL.convertZoom(a))}};
SLMap.prototype.panBy=function(a,b){if(this.GMap!=null){var c=this.GMap.getCenter(),d=this.mapProjection.fromPixelToLatLng(new SLURL.XYPoint(a,b),this.GMap.getZoom());this.GMap.panTo(new GLatLng(c.lat()+d.lat(),c.lng()+d.lng()))}};SLMap.prototype.panLeft=function(){this.panBy(-SLURL.tileSize,0)};SLMap.prototype.panRight=function(){this.panBy(SLURL.tileSize,0)};SLMap.prototype.panUp=function(){this.panBy(0,-SLURL.tileSize)};SLMap.prototype.panDown=function(){this.panBy(0,SLURL.tileSize)};
SLMap.prototype.panOrRecenterToSLCoord=function(a){this.GMap!=null&&this.GMap.panTo(a.GetGLatLng())};
