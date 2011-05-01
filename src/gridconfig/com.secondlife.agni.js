/**
* @license License and Terms of Use
*
* Copyright (c) 2011 SignpostMarv
* Copyright (c) 2010 Linden Research, Inc.
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*/
(function(window, undefined){
	window['mapapi'] = window['mapapi'] || {};
	var
		document     = window['document'],
		mapapi       = window['mapapi'],
		gridConfig   = mapapi['gridConfig'],
		tileSource   = mapapi['tileSource'],
		size         = mapapi['size']
	;

	mapapi['gridConfigs'] = mapapi['gridConfigs'] || {};

	var SecondLifeTileSource = new tileSource({
		'copyright'       : '© 2007 - ' + (new Date).getFullYear() + ' Linden Lab',
		'label'           : 'Land & Objects',
		'maxZoom'         : 7,
		'backgroundColor' : '#1d475f'
	});

//  This Function returns the appropriate image tile from the S3 storage site corresponding to the
//  input location and zoom level on the google map.
	SecondLifeTileSource['getTileURL'] = function(pos, zoom){
		var
			sl_zoom               = Math.floor(zoom + 1),
			regions_per_tile_edge = Math.pow(2, sl_zoom - 1),
			x                     = pos['x'],
			y                     = pos['y']
		;
		x -= x % regions_per_tile_edge;
		y -= y % regions_per_tile_edge; 

		if(x < 0 || y < 0){
			return null;
		}
		return (
			[ // 2 hosts so that we get faster performance on clients with lots of bandwidth but possible browser limits on number of open files
				"http://map.secondlife.com.s3.amazonaws.com",
				"http://map.secondlife.com"
			][((x / regions_per_tile_edge) % 2)] //  Pick a server
			+ ["/map", sl_zoom, x, y, "objects.jpg"].join("-") //  Get image tiles from Amazon S3
		);
	}

	var agni = new gridConfig({
		'namespace'    : 'com.secondlife.agni',
		'vendor'       : 'Linden Lab',
		'name'         : 'Second Life',
		'label'        : 'Agni',
		'size'         : new size(1048576, 1048576),
		'_tileSources' : [
			SecondLifeTileSource
		],
		'maxZoom'      : 7
	});

	mapapi['gridConfigs']['com.secondlife.agni'] = agni;
})(window);