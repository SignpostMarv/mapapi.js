/*
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
(function(a){a.mapapi=a.mapapi||{};a=a.mapapi;var d=a.gridConfig,e=a.tileSource;a.gridConfigs=a.gridConfigs||{};e=new e({copyright:"\u00a9 2007 - "+(new Date).getFullYear()+" Linden Lab",label:"Land & Objects",maxZoom:7,backgroundColor:"#1d475f"});e.getTileURL=function(h,j){var i=SLURL.convertZoom(j),b=Math.pow(2,i-1),f=h.x*b,c=h.y*b,g=SLURL.gridEdgeSizeInRegions;g-=g%b;c=g-c;c-=b;f-=f%b;c-=c%b;return["http://map.secondlife.com.s3.amazonaws.com","http://map.secondlife.com"][f/b%2]+["/map",i,f,c,"objects.jpg"].join("-")};
d=new d({namespace:"com.secondlife.agni",vendor:"Linden Lab",name:"Second Life",label:"Agni"});d._tileSources=[e];a.gridConfigs["com.secondlife.agni"]=d})(window);
