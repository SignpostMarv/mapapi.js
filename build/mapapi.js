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
(function(c){c.Array.prototype.indexOf||(c.Array.prototype.indexOf=function(e){for(var b=0;b<this.length;++b)if(this[b]==e)return b;return-1});c.mapapi={utils:{addClass:function(e,b){var a=(e.className||"").split(" ");if(a.indexOf(b)==-1){a.push(b);e.className=a.join(" ")}}}}})(window);(function(c){function e(a,d){for(var f=0;f<a.length;++f)d(a[f],f)}c.mapapi=c.mapapi||{};c=c.mapapi;var b=function(a){var d=this;e(["options"],function(f){d[f]={}});a=a||{};d.minZoom(a.minZoom||0);d.maxZoom(a.maxZoom||0);d.panUnitUD(a.panUnitUD||1);d.panUnitLR(a.panUnitLR||1);a.container&&d.container(a.container)};b.prototype.container=function(a){var d=this.options;if(a)if(a.appendChild){d.container=a;this.contentNode&&a.appendChild(this.contentNode)}else throw"Container is invalid";return d.container};
b.prototype.minZoom=function(a){var d=this.options;if(a)d.minZoom=Math.max(0,a);return d.minZoom};b.prototype.maxZoom=function(a){var d=this.options;if(a)d.maxZoom=Math.max(this.minZoom()+1,a);return d.maxZoom};b.prototype.zoom=function(a){var d=this.options;if(a)d.zoom=Math.min(Math.max(a,this.minZoom()),this.maxZoom());return d.zoom};b.prototype.panUnitUD=function(a){var d=this.options;if(a)d.panUnitUD=Math.max(a,1);return d.panUnitUD};b.prototype.panUnitLR=function(a){var d=this.options;if(a)d.panUnitLR=
Math.max(a,1);return d.panUnitLR};c.renderer=b;c.renderer.prototype.container=b.prototype.container;c.renderer.prototype.minZoom=b.prototype.minZoom;c.renderer.prototype.maxZoom=b.prototype.maxZoom;c.renderer.prototype.zoom=b.prototype.zoom;c.renderer.prototype.panUnitUD=b.prototype.panUnitUD;c.renderer.prototype.panUnitLR=b.prototype.panUnitLR})(window);(function(c){c.mapapi=c.mapapi||{};c=c.mapapi;var e=function(b){var a=this.options={};b=b||{};var d=b.copyright;b=b.label;if(d){if(!b)throw"tile source label not specified";}else throw"tile source copyright not specified";a.copyright=d;a.label=b};e.prototype.getTileURL=function(){return"data:text/plain,"};c.tileSource=e;c.tileSource.prototype.getTileURL=e.prototype.getTileURL})(window);(function(c){c.mapapi=c.mapapi||{};c=c.mapapi;c.gridConfigs={};var e=function(b){b=b||{};this.namespace=b.namespace;this.vendor=b.vendor;this.name=b.name;this.label=b.label};e.prototype.tileSources=function(){return this._tileSources};c.gridConfig=e})(window);/*
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
(function(c){if(c.mapapi)if(c.mapapi.renderer){if(!c.GMap2)throw"Google Maps v2 not loaded";}else throw"mapapi.js renderer class not loaded";else throw"mapapi.js not loaded";var e=c.document,b=c.mapapi;c=function(a){a=a||{};var d=a.gridConfig;if(d instanceof b.gridConfig==false)throw"Grid Configuration object must be instance of mapapi.gridConfig";this.contentNode=e.createElement("div");b.utils.addClass(this.contentNode,"mapapi-renderer");b.renderer.call(this,a);a=[];for(var f=d.tileSources(),h=new GCopyrightCollection("SecondLife"),
g=0;g<f.length;++g){h=new GCopyrightCollection(d.name);var j=new GTileLayer(h,10,16),i=new GMapType([j],new SLURL.EuclideanProjection(18),f[g].label);h.addCopyright(new GCopyright(1,new GLatLngBounds(new GLatLng(0,0),new GLatLng(-90,90)),0,f[g].copyright));j.getTileUrl=f[g].getTileURL;i.getMinimumResolution=function(){return SLURL.convertZoom(SLURL.minZoomLevel)};i.getMaximumResolution=function(){return SLURL.convertZoom(SLURL.maxZoomLevel)};a.push(i)}this.vendorContent=new GMap2(this.contentNode,
{mapTypes:a,backgroundColor:SLURL.backgroundColor});this.vendorContent.setCenter(new GLatLng(0,0),16)};c.prototype=new b.renderer;c.prototype.panTo=function(a){this.vendorContent.panTo(a.GetGLatLng())};b.google2Renderer=c})(window);
