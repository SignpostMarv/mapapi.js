/*
 License and Terms of Use

 Copyright (c) 2011 SignpostMarv

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
*/
(function(f){f.Array.prototype.indexOf||(f.Array.prototype.indexOf=function(g){for(var c=0;c<this.length;++c)if(this[c]==g)return c;return-1});f.mapapi={utils:{addClass:function(g,c){var h=(g.className||"").split(" ");if(h.indexOf(c)==-1){h.push(c);g.className=h.join(" ")}}},gridPoint:function(g,c){this.x=g;this.y=c},size:function(g,c){this.width=Math.max(0,g||0);this.height=Math.max(0,c||0)}}})(window);(function(f,g){function c(a,e){for(var j=0;j<a.length;++j)e(a[j],j)}f.mapapi=f.mapapi||{};var h=f.mapapi,i=function(a){var e=this;c(["options"],function(j){e[j]={}});a=a||{};e.minZoom(a.minZoom||0);e.maxZoom(a.maxZoom||0);e.panUnitUD(a.panUnitUD||1);e.panUnitLR(a.panUnitLR||1);a.container&&e.container(a.container)};i.prototype.container=function(a){var e=this.options;if(a)if(a.appendChild){e.container=a;if(this.contentNode){this.contentNode.style.width="100%";this.contentNode.style.height="100%";
a.appendChild(this.contentNode)}}else throw"Container is invalid";return e.container};i.prototype.minZoom=function(a){var e=this.options;if(a!=g)e.minZoom=Math.max(0,a);return e.minZoom};i.prototype.maxZoom=function(a){var e=this.options;if(a!=g)e.maxZoom=Math.max(this.minZoom()+1,a);return e.maxZoom};i.prototype.zoom=function(a){var e=this.options;if(a!=g)e.zoom=Math.min(Math.max(a,this.minZoom()),this.maxZoom());return e.zoom};i.prototype.panUnitUD=function(a){var e=this.options;if(a)e.panUnitUD=
Math.max(a,1);return e.panUnitUD};i.prototype.panUnitLR=function(a){var e=this.options;if(a)e.panUnitLR=Math.max(a,1);return e.panUnitLR};i.prototype.scrollWheelZoom=function(a){if(a!=g)return a?true:false;return a};i.prototype.smoothZoom=function(a){if(a!=g)return a?true:false;return a};i.prototype.draggable=function(a){if(a!=g)return a?true:false;return a};i.prototype.focus=function(a){if(a instanceof h.gridPoint)obj._focus=a;return obj._focus};h.renderer=i;h.renderer.prototype.container=i.prototype.container;
h.renderer.prototype.minZoom=i.prototype.minZoom;h.renderer.prototype.maxZoom=i.prototype.maxZoom;h.renderer.prototype.zoom=i.prototype.zoom;h.renderer.prototype.panUnitUD=i.prototype.panUnitUD;h.renderer.prototype.panUnitLR=i.prototype.panUnitLR})(window);(function(f){f.mapapi=f.mapapi||{};f=f.mapapi;var g=function(c){var h=this.options={};c=c||{};var i=c.copyright,a=c.label,e=c.minZoom||0,j=c.maxZoom||0;c=c.backgroundColor||"#000000";if(i){if(!a)throw"tile source label not specified";}else throw"tile source copyright not specified";h.copyright=i;h.label=a;h.minZoom=Math.max(e,0);h.maxZoom=Math.max(h.minZoom+1,j);h.backgroundColor=c};g.prototype.getTileURL=function(){return"data:text/plain,"};f.tileSource=g;f.tileSource.prototype.getTileURL=g.prototype.getTileURL})(window);(function(f){f.mapapi=f.mapapi||{};var g=f.mapapi;f=function(c){c=c||{};this.namespace=c.namespace;this.vendor=c.vendor;this.name=c.name;this.label=c.label;this.size=new g.size(c.gridWidth||1048576,c.gridHeight||1048576)};f.prototype.tileSources=function(){return this._tileSources};g.gridConfig=f})(window);/*
 License and Terms of Use

 Copyright (c) 2011 SignpostMarv
 Copyright (c) 2010 Linden Research, Inc.

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
*/
(function(f,g){if(f.mapapi)if(f.mapapi.renderer){if(!f.GMap2)throw"Google Maps v2 not loaded";}else throw"mapapi.js renderer class not loaded";else throw"mapapi.js not loaded";var c=f.document,h=f.mapapi,i=f.SLURL,a=h.renderer,e=h.gridConfig,j=h.gridPoint,t=i.XYPoint,r=f.GEvent,k=function(d){var b=this;d=d||{};var l=d.gridConfig;if(l instanceof e==false)throw"Grid Configuration object must be instance of mapapi.gridConfig";b.gridConfig=l;b.contentNode=c.createElement("div");h.utils.addClass(b.contentNode,
"mapapi-renderer");h.renderer.call(b,d);d=[];for(var m=l.tileSources(),p=new GCopyrightCollection("SecondLife"),n=0;n<m.length;++n){var o=m[n];p=new GCopyrightCollection(l.name);var s=new GTileLayer(p,10,16),q=new GMapType([s],new i.EuclideanProjection(18),o.options.label);p.addCopyright(new GCopyright(1,new GLatLngBounds(new GLatLng(0,0),new GLatLng(-90,90)),0,o.options.copyright));s.getTileUrl=m[n].getTileURL;q.getMinimumResolution=function(){return o.options.minZoom};q.getMaximumResolution=function(){return o.options.maxZoom};
d.push(q)}b.vendorContent=new GMap2(b.contentNode,{mapTypes:d,backgroundColor:m[0].options.backgroundColor});b.focus(0,0,0);r.addListener(b.vendorContent,"zoomend",function(v,u){b.options.zoom=i.convertZoom(u)-1});r.addListener(b.vendorContent,"moveend",function(){b._focus=b.GLatLng2gridPoint(b.vendorContent.getCenter())})};k.prototype=new a;k.prototype.gridPoint2GLatLng=function(d){var b=this.gridConfig.size;return new GLatLng(-(b.height-d.y)*(90/b.height),d.x*(90/b.width))};k.prototype.GLatLng2gridPoint=
function(d){var b=this.gridConfig.size;return new j(d.lng()/(90/b.width),b.height- -d.lat()/(90/b.height))};k.prototype.panTo=function(d){this.vendorContent.panTo(d instanceof t?d.GetGLatLng():this.gridPoint2GLatLng(d))};k.prototype.scrollWheelZoom=function(d){var b=this.vendorContent;if(d!=g)d?b.enableScrollWheelZoom():b.disableScrollWheelZoom();return b.scrollWheelZoomEnabled()};k.prototype.smoothZoom=function(d){var b=this.vendorContent;if(d!=g)d?b.enableContinuousZoom():b.disableContinuousZoom();
return b.continuousZoomEnabled()};k.prototype.draggable=function(d){var b=this.vendorContent;if(d!=g)d?b.enableDragging():b.disableDragging();return b.draggingEnabled()};k.prototype.focus=function(d,b,l){if(typeof d=="number"){d=new j(d,b);b=l}if(d){b=i.convertZoom((b!=g?b:a.prototype.zoom.call(this))+1);this._focus=d;this.vendorContent.setCenter(this.gridPoint2GLatLng(d),b)}return this.GLatLng2gridPoint(this.vendorContent.getCenter())};h.google2Renderer=k})(window);
