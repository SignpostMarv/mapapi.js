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
(function(d){d.Array.prototype.indexOf||(d.Array.prototype.indexOf=function(g){for(var c=0;c<this.length;++c)if(this[c]==g)return c;return-1});d.mapapi={utils:{addClass:function(g,c){var f=(g.className||"").split(" ");if(f.indexOf(c)==-1){f.push(c);g.className=f.join(" ")}}}}})(window);(function(d,g){function c(a,b){for(var h=0;h<a.length;++h)b(a[h],h)}d.mapapi=d.mapapi||{};var f=d.mapapi,e=function(a){var b=this;c(["options"],function(h){b[h]={}});a=a||{};b.minZoom(a.minZoom||0);b.maxZoom(a.maxZoom||0);b.panUnitUD(a.panUnitUD||1);b.panUnitLR(a.panUnitLR||1);a.container&&b.container(a.container)};e.prototype.container=function(a){var b=this.options;if(a)if(a.appendChild){b.container=a;this.contentNode&&a.appendChild(this.contentNode)}else throw"Container is invalid";return b.container};
e.prototype.minZoom=function(a){var b=this.options;if(a)b.minZoom=Math.max(0,a);return b.minZoom};e.prototype.maxZoom=function(a){var b=this.options;if(a)b.maxZoom=Math.max(this.minZoom()+1,a);return b.maxZoom};e.prototype.zoom=function(a){var b=this.options;if(a)b.zoom=Math.min(Math.max(a,this.minZoom()),this.maxZoom());return b.zoom};e.prototype.panUnitUD=function(a){var b=this.options;if(a)b.panUnitUD=Math.max(a,1);return b.panUnitUD};e.prototype.panUnitLR=function(a){var b=this.options;if(a)b.panUnitLR=
Math.max(a,1);return b.panUnitLR};e.prototype.scrollWheelZoom=function(a){if(a!=g)return a?true:false;return a};e.prototype.smoothZoom=function(a){if(a!=g)return a?true:false;return a};e.prototype.draggable=function(a){if(a!=g)return a?true:false;return a};f.renderer=e;f.renderer.prototype.container=e.prototype.container;f.renderer.prototype.minZoom=e.prototype.minZoom;f.renderer.prototype.maxZoom=e.prototype.maxZoom;f.renderer.prototype.zoom=e.prototype.zoom;f.renderer.prototype.panUnitUD=e.prototype.panUnitUD;
f.renderer.prototype.panUnitLR=e.prototype.panUnitLR})(window);(function(d){d.mapapi=d.mapapi||{};d=d.mapapi;var g=function(c){var f=this.options={};c=c||{};var e=c.copyright,a=c.label,b=c.minZoom||0,h=c.maxZoom||0;c=c.backgroundColor||"#000000";if(e){if(!a)throw"tile source label not specified";}else throw"tile source copyright not specified";f.copyright=e;f.label=a;f.minZoom=Math.max(b,0);f.maxZoom=Math.max(f.minZoom+1,h);f.backgroundColor=c};g.prototype.getTileURL=function(){return"data:text/plain,"};d.tileSource=g;d.tileSource.prototype.getTileURL=g.prototype.getTileURL})(window);(function(d){d.mapapi=d.mapapi||{};d=d.mapapi;var g=function(c){c=c||{};this.namespace=c.namespace;this.vendor=c.vendor;this.name=c.name;this.label=c.label};g.prototype.tileSources=function(){return this._tileSources};d.gridConfig=g})(window);/*
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
(function(d,g){if(d.mapapi)if(d.mapapi.renderer){if(!d.GMap2)throw"Google Maps v2 not loaded";}else throw"mapapi.js renderer class not loaded";else throw"mapapi.js not loaded";var c=d.document,f=d.mapapi,e=function(a){a=a||{};var b=a.gridConfig;if(b instanceof f.gridConfig==false)throw"Grid Configuration object must be instance of mapapi.gridConfig";this.contentNode=c.createElement("div");f.utils.addClass(this.contentNode,"mapapi-renderer");f.renderer.call(this,a);a=[];for(var h=b.tileSources(),k=
new GCopyrightCollection("SecondLife"),i=0;i<h.length;++i){var j=h[i];k=new GCopyrightCollection(b.name);var m=new GTileLayer(k,10,16),l=new GMapType([m],new SLURL.EuclideanProjection(18),j.options.label);k.addCopyright(new GCopyright(1,new GLatLngBounds(new GLatLng(0,0),new GLatLng(-90,90)),0,j.options.copyright));m.getTileUrl=h[i].getTileURL;l.getMinimumResolution=function(){return j.options.minZoom};l.getMaximumResolution=function(){return j.options.maxZoom};a.push(l)}this.vendorContent=new GMap2(this.contentNode,
{mapTypes:a,backgroundColor:h[0].options.backgroundColor});this.vendorContent.setCenter(new GLatLng(0,0),16)};e.prototype=new f.renderer;e.prototype.panTo=function(a){this.vendorContent.panTo(a.GetGLatLng())};e.prototype.scrollWheelZoom=function(a){var b=this.vendorContent;if(a!=g)a?b.enableScrollWheelZoom():b.disableScrollWheelZoom();return b.scrollWheelZoomEnabled()};e.prototype.smoothZoom=function(a){var b=this.vendorContent;if(a!=g)a?b.enableContinuousZoom():b.disableContinuousZoom();return b.continuousZoomEnabled()};
e.prototype.draggable=function(a){var b=this.vendorContent;if(a!=g)a?b.enableDragging():b.disableDragging();return b.draggingEnabled()};f.google2Renderer=e})(window);
