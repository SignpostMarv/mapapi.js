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
(function(i,j){i.Array.prototype.indexOf||(i.Array.prototype.indexOf=function(e){for(var f=0;f<this.length;++f)if(this[f]==e)return f;return-1});var g={utils:{addClass:function(e,f){var c=(e.className||"").split(" ");if(c.indexOf(f)==-1){c.push(f);e.className=c.join(" ")}}},gridPoint:function(e,f){this.x=e;this.y=f},size:function(e,f){this.width=Math.max(0,e||0);this.height=Math.max(0,f||0)},bounds:function(e,f){if(e instanceof g.gridPoint==false)if(typeof e=="object"&&e.x!=j&&e.y!=j)e=new g.gridPoint(e.x,
e.y);else throw"South-West point should be an instance of mapapi.gridPoint";else if(f instanceof g.gridPoint==false)if(typeof f=="object"&&f.x!=j&&e.y!=j)f=new g.gridPoint(f.x,f.y);else throw"North-East point should be an instance of mapapi.gridPoint";this.sw=e;this.ne=f}};g.bounds.prototype.isWithin=function(e,f){if(e instanceof g.gridPoint){f=e.y;e=e.x}var c=this.sw,h=this.ne;return e>=c.x&&e<=h.x&&f>=c.y&&f<=h.y};i.mapapi=g})(window);(function(i,j){function g(c,h){for(var q=0;q<c.length;++q)h(c[q],q)}i.mapapi=i.mapapi||{};var e=i.mapapi,f=function(c){var h=this;g(["options"],function(q){h[q]={}});c=c||{};h.minZoom(c.minZoom||0);h.maxZoom(c.maxZoom||0);h.panUnitUD(c.panUnitUD||1);h.panUnitLR(c.panUnitLR||1);c.container&&h.container(c.container)};f.prototype.container=function(c){var h=this.options;if(c)if(c.appendChild){h.container=c;if(this.contentNode){this.contentNode.style.width="100%";this.contentNode.style.height="100%";
c.appendChild(this.contentNode)}}else throw"Container is invalid";this._focus=new e.gridPoint(0,0);return h.container};f.prototype.minZoom=function(c){var h=this.options;if(c!=j)h.minZoom=Math.max(0,c);return h.minZoom};f.prototype.maxZoom=function(c){var h=this.options;if(c!=j)h.maxZoom=Math.max(this.minZoom()+1,c);return h.maxZoom};f.prototype.zoom=function(c){var h=this.options;if(c!=j)h.zoom=Math.min(Math.max(c,this.minZoom()),this.maxZoom());return h.zoom};f.prototype.panUnitUD=function(c){var h=
this.options;if(c)h.panUnitUD=Math.max(c,1);return h.panUnitUD};f.prototype.panUnitLR=function(c){var h=this.options;if(c)h.panUnitLR=Math.max(c,1);return h.panUnitLR};f.prototype.scrollWheelZoom=function(c){if(c!=j)return c?true:false;return c};f.prototype.smoothZoom=function(c){if(c!=j)return c?true:false;return c};f.prototype.draggable=function(c){if(c!=j)return c?true:false;return c};f.prototype.focus=function(c,h){if(typeof c=="number")c=new e.gridPoint(c,h);if(c instanceof e.gridPoint)this._focus=
c;return this._focus};e.renderer=f;e.renderer.prototype.container=f.prototype.container;e.renderer.prototype.minZoom=f.prototype.minZoom;e.renderer.prototype.maxZoom=f.prototype.maxZoom;e.renderer.prototype.zoom=f.prototype.zoom;e.renderer.prototype.panUnitUD=f.prototype.panUnitUD;e.renderer.prototype.panUnitLR=f.prototype.panUnitLR})(window);(function(i){i.mapapi=i.mapapi||{};var j=i.mapapi;i=function(g){var e=this.options={};g=g||{};var f=g.copyright,c=g.label,h=g.minZoom||0,q=g.maxZoom||0,r=g.backgroundColor||"#000000",d=Math.max(1,g.width||256);g=Math.max(1,g.height||d);if(f){if(!c)throw"tile source label not specified";}else throw"tile source copyright not specified";this.size=new j.size(d,g);e.copyright=f;e.label=c;e.minZoom=Math.max(h,0);e.maxZoom=Math.max(e.minZoom+1,q);e.backgroundColor=r};i.prototype.getTileURL=function(){return"data:text/plain,"};
j.tileSource=i;j.tileSource.prototype.getTileURL=i.prototype.getTileURL})(window);(function(i){i.mapapi=i.mapapi||{};var j=i.mapapi;i=function(g){g=g||{};this.namespace=g.namespace;this.vendor=g.vendor;this.name=g.name;this.label=g.label;this.size=new j.size(g.gridWidth||1048576,g.gridHeight||1048576)};i.prototype.tileSources=function(){return this._tileSources};j.gridConfig=i})(window);/*
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
(function(i,j){if(i.mapapi){if(!i.mapapi.renderer)throw"mapapi.js renderer class not loaded";}else throw"mapapi.js not loaded";var g=i.document,e=i.mapapi,f=i.SLURL,c=e.renderer,h=e.gridConfig,q=e.gridPoint,r=i.GEvent,d=function(a){if(!i.GMap2)throw"Google Maps v2 not loaded";var b=this;a=a||{};var l=a.gridConfig;if(l instanceof h==false)throw"Grid Configuration object must be instance of mapapi.gridConfig";b.gridConfig=l;b.contentNode=g.createElement("div");e.utils.addClass(b.contentNode,"mapapi-renderer");
e.renderer.call(b,a);a=[];for(var m=l.tileSources(),p=new GCopyrightCollection("SecondLife"),k=0;k<m.length;++k){var n=m[k];p=new GCopyrightCollection(l.name);var o=new GTileLayer(p,10,16),s=new GMapType([o],new f.EuclideanProjection(18),n.options.label);p.addCopyright(new GCopyright(1,new GLatLngBounds(new GLatLng(0,0),new GLatLng(-90,90)),0,n.options.copyright));o.getTileUrl=m[k].getTileURL;s.getMinimumResolution=function(){return n.options.minZoom};s.getMaximumResolution=function(){return n.options.maxZoom};
a.push(s)}b.vendorContent=new GMap2(b.contentNode,{mapTypes:a,backgroundColor:m[0].options.backgroundColor});b.focus(0,0,0);r.addListener(b.vendorContent,"zoomend",function(t,u){b.options.zoom=f.convertZoom(u)-1});r.addListener(b.vendorContent,"moveend",function(){b._focus=b.GLatLng2gridPoint(b.vendorContent.getCenter())})};d.prototype=new c;d.prototype.gridPoint2GLatLng=function(a){var b=this.gridConfig.size;return new GLatLng(-(b.height-a.y)*(90/b.height),a.x*(90/b.width))};d.prototype.GLatLng2gridPoint=
function(a){var b=this.gridConfig.size;return new q(a.lng()/(90/b.width),b.height- -a.lat()/(90/b.height))};d.prototype.panTo=function(a){this.vendorContent.panTo(a instanceof f.XYPoint?a.GetGLatLng():this.gridPoint2GLatLng(a))};d.prototype.scrollWheelZoom=function(a){var b=this.vendorContent;if(a!=j)a?b.enableScrollWheelZoom():b.disableScrollWheelZoom();return b.scrollWheelZoomEnabled()};d.prototype.smoothZoom=function(a){var b=this.vendorContent;if(a!=j)a?b.enableContinuousZoom():b.disableContinuousZoom();
return b.continuousZoomEnabled()};d.prototype.draggable=function(a){var b=this.vendorContent;if(a!=j)a?b.enableDragging():b.disableDragging();return b.draggingEnabled()};d.prototype.focus=function(a,b,l){if(typeof a=="number"){a=new q(a,b);b=l}if(a){b=f.convertZoom((b!=j?b:c.prototype.zoom.call(this))+1);this._focus=a;this.vendorContent.setCenter(this.gridPoint2GLatLng(a),b)}return this.GLatLng2gridPoint(this.vendorContent.getCenter())};e.google2Renderer=d})(window);/*
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
(function(i){if(i.mapapi){if(!i.mapapi.renderer)throw"mapapi.js renderer class not loaded";}else throw"mapapi.js not loaded";var j=i.document,g=i.mapapi,e=g.renderer,f=g.gridConfig,c=g.gridPoint,h=g.bounds,q=function(d,a,b){this.from=d;this.to=a;this.frames=Math.max(1,b);this.current=0;this.incrX=(a.x-d.x)/b;this.incrY=(a.y-d.y)/b},r=function(d){var a=j.createElement("canvas");if(a)a=a.getContext&&a.getContext("2d");if(!a)throw"Browser does not support canvas renderer";var b=this;d=d||{};a=d.gridConfig;
if(a instanceof f==false)throw"Grid Configuration object must be instance of mapapi.gridConfig";b.gridConfig=a;b.contentNode=j.createElement("canvas");b.vendorContent=b.contentNode.getContext("2d");g.utils.addClass(b.contentNode,"mapapi-renderer");g.renderer.call(b,d);b.options.fps=Math.max(1,d.fps||15);b.grid_images={};b.contentNode.width=b.contentNode.clientWidth;b.contentNode.height=b.contentNode.clientHeight;b.tileSource=a.tileSources()[0];i.addEventListener("resize",function(){b.dirty=true;b.updateBounds()},
true);b.zoom(0);b.focus(0,0);b.updateBounds();b.dirty=true;b.draw(b.options.fps)};r.prototype=new e;r.prototype.updateBounds=function(){var d=this.contentNode,a=this.zoom(),b=0.5+0.5*(1-a%1),l=1<<Math.floor(a);a=this.focus();var m=Math.ceil((Math.ceil(d.width/(this.tileSource.size.width*b/l))+1)/2);d=Math.ceil((Math.ceil(d.height/(this.tileSource.size.height*b/l))+1)/2);this.bounds=new h({x:a.x-m,y:a.y-d},{x:a.x+m,y:a.y+d});this.dirty=true};r.prototype.imageQueued=function(d,a,b){b=Math.floor(b);
zoom_b=1<<b;images=this.grid_images;a-=a%zoom_b;d-=d%zoom_b;return images[b]&&images[b][d]&&images[b][d][a]instanceof Image};r.prototype.getImage=function(d,a,b,l){var m=this;b=Math.floor(b);var p=1<<b,k=m.grid_images;a-=a%p;d-=d%p;if(l=!!l){var n,o;o=b+1;p=d-d%o;n=a-a%o;b<m.maxZoom()&&!m.imageQueued(p,n,o)&&m.getImage(p,n,o)}k[b]||(k[b]=[]);k[b][d]||(k[b][d]=[]);if(!k[b][d][a]){k[b][d][a]=new Image;k[b][d][a]._mapapi={x:d,y:a,preloaded:l==true};k[b][d][a].onload=function(){this._mapapi.loaded=true;
if(m.bounds.isWithin(this._mapapi.x,this._mapapi.y))m.dirty=true};k[b][d][a].src=m.tileSource.getTileURL(new c(d,a),b,true)}return k[b][d][a]};r.prototype.draw=function(d){d=Math.max(1,d||0);var a=this;a.dirty=a.dirty||a.moving;if(a.dirty){a.dirty=false;var b=a.vendorContent,l=b.canvas;l.width=l.clientWidth;l.height=l.clientHeight;b.save();if(a.moving){++a.moving.current;a.setFocus({x:a.moving.from.x+a.moving.incrX*a.moving.current,y:a.moving.from.y+a.moving.incrY*a.moving.current});a.moving.current>=
a.moving.frames&&delete a.moving}var m=a.zoom(),p=0.5+0.5*(1-m%1),k=1<<Math.floor(m),n=a.focus(),o=a.bounds,s=l.width,t=s/2;l=l.height;var u=l/2,w=a.tileSource.size.width*p/k,v=a.tileSource.size.height*p/k,x=o.sw.x-o.sw.x%k;p=o.sw.y-o.sw.y%k;b.fillStyle=a.tileSource.options.backgroundColor;b.fillRect(0,0,s,l);b.translate(n.x*-w+t,n.y*v+u-v*k);b.scale(w,v);for(n=x;n<=o.ne.x;n+=k)for(s=p;s<=o.ne.y;s+=k){t=a.getImage(n,s,m);t._mapapi.loaded&&b.drawImage(t,t._mapapi.x,-t._mapapi.y,k,k)}b.restore();a.dirty=
false}setTimeout(function(){a.draw(d)},1E3/d)};r.prototype.focus=function(d,a){if(d){e.prototype.focus.call(this,d,a);this.updateBounds()}return e.prototype.focus.call(this)};r.prototype.panTo=function(d,a){if(!this.moving)this.moving=new q(this.focus(),d,a||15)};g.canvasRenderer=r})(window);
