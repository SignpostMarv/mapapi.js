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
(function(h,m){h.Array.prototype.indexOf||(h.Array.prototype.indexOf=function(e){for(var f=0;f<this.length;++f)if(this[f]==e)return f;return-1});var i={utils:{addClass:function(e,f){var d=(e.className||"").split(" ");if(d.indexOf(f)==-1){d.push(f);e.className=d.join(" ")}}},gridPoint:function(e,f){this.x=e;this.y=f},size:function(e,f){this.width=Math.max(0,e||0);this.height=Math.max(0,f||0)},bounds:function(e,f){if(e instanceof i.gridPoint==false)if(typeof e=="object"&&e.x!=m&&e.y!=m)e=new i.gridPoint(e.x,
e.y);else throw"South-West point should be an instance of mapapi.gridPoint";else if(f instanceof i.gridPoint==false)if(typeof f=="object"&&f.x!=m&&e.y!=m)f=new i.gridPoint(f.x,f.y);else throw"North-East point should be an instance of mapapi.gridPoint";this.sw=e;this.ne=f}};i.bounds.prototype.isWithin=function(e,f){if(e instanceof i.gridPoint){f=e.y;e=e.x}var d=this.sw,g=this.ne;return e>=d.x&&e<=g.x&&f>=d.y&&f<=g.y};h.mapapi=i})(window);(function(h,m){function i(d,g){for(var r=0;r<d.length;++r)g(d[r],r)}h.mapapi=h.mapapi||{};var e=h.mapapi,f=function(d){var g=this;i(["options"],function(r){g[r]={}});d=d||{};g.minZoom(d.minZoom||0);g.maxZoom(d.maxZoom||0);g.panUnitUD(d.panUnitUD||1);g.panUnitLR(d.panUnitLR||1);d.container&&g.container(d.container)};f.prototype.container=function(d){var g=this.options;if(d)if(d.appendChild){g.container=d;if(this.contentNode){this.contentNode.style.width="100%";this.contentNode.style.height="100%";
d.appendChild(this.contentNode)}}else throw"Container is invalid";this._focus=new e.gridPoint(0,0);return g.container};f.prototype.minZoom=function(d){var g=this.options;if(d!=m)g.minZoom=Math.max(0,d);return g.minZoom};f.prototype.maxZoom=function(d){var g=this.options;if(d!=m)g.maxZoom=Math.max(this.minZoom()+1,d);return g.maxZoom};f.prototype.zoom=function(d){var g=this.options;if(d!=m)g.zoom=Math.min(Math.max(d,this.minZoom()),this.maxZoom());return g.zoom};f.prototype.panUnitUD=function(d){var g=
this.options;if(d)g.panUnitUD=Math.max(d,1);return g.panUnitUD};f.prototype.panUnitLR=function(d){var g=this.options;if(d)g.panUnitLR=Math.max(d,1);return g.panUnitLR};f.prototype.scrollWheelZoom=function(d){if(d!=m)return d?true:false;return d};f.prototype.smoothZoom=function(d){if(d!=m)return d?true:false;return d};f.prototype.draggable=function(d){if(d!=m)return d?true:false;return d};f.prototype.focus=function(d,g){if(typeof d=="number")d=new e.gridPoint(d,g);if(d instanceof e.gridPoint)this._focus=
d;return this._focus};e.renderer=f;e.renderer.prototype.container=f.prototype.container;e.renderer.prototype.minZoom=f.prototype.minZoom;e.renderer.prototype.maxZoom=f.prototype.maxZoom;e.renderer.prototype.zoom=f.prototype.zoom;e.renderer.prototype.panUnitUD=f.prototype.panUnitUD;e.renderer.prototype.panUnitLR=f.prototype.panUnitLR})(window);(function(h){h.mapapi=h.mapapi||{};var m=h.mapapi;h=function(i){var e=this.options={};i=i||{};var f=i.copyright,d=i.label,g=i.minZoom||0,r=i.maxZoom||0,t=i.backgroundColor||"#000000",n=Math.max(1,i.width||256);i=Math.max(1,i.height||n);if(f){if(!d)throw"tile source label not specified";}else throw"tile source copyright not specified";this.size=new m.size(n,i);e.copyright=f;e.label=d;e.minZoom=Math.max(g,0);e.maxZoom=Math.max(e.minZoom+1,r);e.backgroundColor=t};h.prototype.getTileURL=function(){return"data:text/plain,"};
m.tileSource=h;m.tileSource.prototype.getTileURL=h.prototype.getTileURL})(window);(function(h){h.mapapi=h.mapapi||{};var m=h.mapapi;h=function(i){i=i||{};this.namespace=i.namespace;this.vendor=i.vendor;this.name=i.name;this.label=i.label;this.size=new m.size(i.gridWidth||1048576,i.gridHeight||1048576)};h.prototype.tileSources=function(){return this._tileSources};m.gridConfig=h})(window);/*
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
(function(h,m){if(h.mapapi){if(!h.mapapi.renderer)throw"mapapi.js renderer class not loaded";}else throw"mapapi.js not loaded";var i=h.document,e=h.mapapi,f=h.SLURL,d=e.renderer,g=e.gridConfig,r=e.gridPoint,t=h.GEvent,n=function(b){if(!h.GMap2)throw"Google Maps v2 not loaded";var a=this;b=b||{};var c=b.gridConfig;if(c instanceof g==false)throw"Grid Configuration object must be instance of mapapi.gridConfig";a.gridConfig=c;a.contentNode=i.createElement("div");e.utils.addClass(a.contentNode,"mapapi-renderer");
e.renderer.call(a,b);b=[];for(var k=c.tileSources(),l=new GCopyrightCollection("SecondLife"),o=0;o<k.length;++o){var j=k[o];l=new GCopyrightCollection(c.name);var p=new GTileLayer(l,10,16),q=new GMapType([p],new f.EuclideanProjection(18),j.options.label);l.addCopyright(new GCopyright(1,new GLatLngBounds(new GLatLng(0,0),new GLatLng(-90,90)),0,j.options.copyright));p.getTileUrl=k[o].getTileURL;q.getMinimumResolution=function(){return j.options.minZoom};q.getMaximumResolution=function(){return j.options.maxZoom};
b.push(q)}a.vendorContent=new GMap2(a.contentNode,{mapTypes:b,backgroundColor:k[0].options.backgroundColor});a.zoom(0);a.focus(0,0,0);t.addListener(a.vendorContent,"zoomend",function(u,s){a.options.zoom=f.convertZoom(s)-1});t.addListener(a.vendorContent,"moveend",function(){a._focus=a.GLatLng2gridPoint(a.vendorContent.getCenter())})};n.prototype=new d;n.prototype.gridPoint2GLatLng=function(b){var a=this.gridConfig.size;return new GLatLng(-(a.height-b.y)*(90/a.height),b.x*(90/a.width))};n.prototype.GLatLng2gridPoint=
function(b){var a=this.gridConfig.size;return new r(b.lng()/(90/a.width),a.height- -b.lat()/(90/a.height))};n.prototype.panTo=function(b,a){if(typeof b=="number")b=new r(b,a);this.vendorContent.panTo(b instanceof f.XYPoint?b.GetGLatLng():this.gridPoint2GLatLng(b))};n.prototype.scrollWheelZoom=function(b){var a=this.vendorContent;if(b!=m)b?a.enableScrollWheelZoom():a.disableScrollWheelZoom();return a.scrollWheelZoomEnabled()};n.prototype.smoothZoom=function(b){var a=this.vendorContent;if(b!=m)b?a.enableContinuousZoom():
a.disableContinuousZoom();return a.continuousZoomEnabled()};n.prototype.draggable=function(b){var a=this.vendorContent;if(b!=m)b?a.enableDragging():a.disableDragging();return a.draggingEnabled()};n.prototype.focus=function(b,a,c){if(typeof b=="number"){b=new r(b,a);a=c}if(a==m)a=this.zoom();if(b){a=f.convertZoom((a!=m?a:d.prototype.zoom.call(this))+1);this._focus=b;this.vendorContent.setCenter(this.gridPoint2GLatLng(b),a)}return this.GLatLng2gridPoint(this.vendorContent.getCenter())};e.google2Renderer=
n})(window);/*
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
(function(h,m){if(h.mapapi){if(!h.mapapi.renderer)throw"mapapi.js renderer class not loaded";}else throw"mapapi.js not loaded";var i=h.document,e=h.mapapi,f=e.renderer,d=e.gridConfig,g=e.gridPoint,r=e.bounds,t=function(b,a){this.from=b;this.to=a;this.current=0};t.prototype.overTime=function(b,a){if(!this.frames){var c=this.frames=Math.max(1,Math.floor(b*a)),k=this.to,l=this.from;this.incrX=(k.x-l.x)/c;this.incrY=(k.y-l.y)/c}};var n=function(b){var a=i.createElement("canvas");if(a)a=a.getContext&&
a.getContext("2d");if(!a)throw"Browser does not support canvas renderer";var c=this;b=b||{};a=b.gridConfig;if(a instanceof d==false)throw"Grid Configuration object must be instance of mapapi.gridConfig";c.gridConfig=a;c.contentNode=i.createElement("canvas");c.vendorContent=c.contentNode.getContext("2d");e.utils.addClass(c.contentNode,"mapapi-renderer");e.renderer.call(c,b);c.options.fps=Math.max(1,b.fps||15);c.grid_images={};c.contentNode.width=c.contentNode.clientWidth;c.contentNode.height=c.contentNode.clientHeight;
c.tileSource=a.tileSources()[0];h.addEventListener("resize",function(){c.dirty=true;c.updateBounds()},true);var k=false,l=m,o=m;c.contentNode.addEventListener("mousedown",function(j){o=c.px2point(j.clientX-this.offsetLeft,j.clientY-this.offsetTop);clearTimeout(l);l=setTimeout(function(){k=true},50)},false);c.contentNode.addEventListener("mouseup",function(){clearTimeout(l);k=false},false);c.contentNode.addEventListener("mousemove",function(j){j=c.px2point(j.clientX-this.offsetLeft,j.clientY-this.offsetTop);
var p=c.focus();k&&c.focus(p.x-(j.x-o.x),p.y-(j.y-o.y))},false);c.zoom(0);c.focus(0,0);c.updateBounds();c.dirty=true;c.draw(c.options.fps)};n.prototype=new f;n.prototype.updateBounds=function(){var b=this.contentNode,a=this.zoom(),c=0.5+0.5*(1-a%1),k=1<<Math.floor(a);a=this.focus();var l=Math.ceil((Math.ceil(b.width/(this.tileSource.size.width*c/k))+1)/2);b=Math.ceil((Math.ceil(b.height/(this.tileSource.size.height*c/k))+1)/2);this.bounds=new r({x:a.x-l,y:a.y-b},{x:a.x+l,y:a.y+b});this.dirty=true};
n.prototype.imageQueued=function(b,a,c){c=Math.floor(c);zoom_b=1<<c;images=this.grid_images;a-=a%zoom_b;b-=b%zoom_b;return images[c]&&images[c][b]&&images[c][b][a]instanceof Image};n.prototype.px2point=function(b,a){var c=this.contentNode,k=this.bounds.sw,l=this.bounds.ne;return new g(k.x+(l.x-k.x)*(b/c.width),l.y-(l.y-k.y)*(a/c.height))};n.prototype.getImage=function(b,a,c,k){var l=this;c=Math.floor(c);var o=1<<c,j=l.grid_images;a-=a%o;b-=b%o;if(k=!!k){var p,q;q=c+1;o=b-b%q;p=a-a%q;c<l.maxZoom()&&
!l.imageQueued(o,p,q)&&l.getImage(o,p,q)}j[c]||(j[c]=[]);j[c][b]||(j[c][b]=[]);if(!j[c][b][a]){j[c][b][a]=new Image;j[c][b][a]._mapapi={x:b,y:a,preloaded:k==true};j[c][b][a].onload=function(){this._mapapi.loaded=true;if(l.bounds.isWithin(this._mapapi.x,this._mapapi.y))l.dirty=true};j[c][b][a].src=l.tileSource.getTileURL(new g(b,a),c,true)}return j[c][b][a]};n.prototype.draw=function(b){b=Math.max(1,b||0);var a=this;a.dirty=a.dirty||a.moving;if(a.dirty){a.dirty=false;var c=a.vendorContent,k=c.canvas;
k.width=k.clientWidth;k.height=k.clientHeight;c.save();if(a.moving){a.moving.overTime(3,b);h.status=[a.moving.from.x,a.moving.incrX,a.moving.current,a.moving.frames];++a.moving.current;a.focus(a.moving.from.x+a.moving.incrX*a.moving.current,a.moving.from.y+a.moving.incrY*a.moving.current);a.moving.current>=a.moving.frames&&delete a.moving}var l=a.zoom(),o=0.5+0.5*(1-l%1),j=1<<Math.floor(l),p=a.focus(),q=a.bounds,u=k.width,s=u/2;k=k.height;var x=k/2,w=a.tileSource.size.width*o/j,v=a.tileSource.size.height*
o/j,y=q.sw.x-q.sw.x%j;o=q.sw.y-q.sw.y%j;c.fillStyle=a.tileSource.options.backgroundColor;c.fillRect(0,0,u,k);c.translate(p.x*-w+s,p.y*v+x-v*j);c.scale(w,v);for(p=y;p<=q.ne.x;p+=j)for(u=o;u<=q.ne.y;u+=j){s=a.getImage(p,u,l);s._mapapi.loaded&&c.drawImage(s,s._mapapi.x,-s._mapapi.y,j,j)}c.restore();a.dirty=false}setTimeout(function(){a.draw(b)},1E3/b)};n.prototype.focus=function(b,a){if(b){f.prototype.focus.call(this,b,a);this.updateBounds()}return f.prototype.focus.call(this)};n.prototype.panTo=function(b,
a){if(typeof b=="number")b=new g(b,a);if(!this.moving)this.moving=new t(this.focus(),b)};e.canvasRenderer=n})(window);
