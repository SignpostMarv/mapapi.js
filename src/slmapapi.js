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
//
//  Map of how SL map relates to the Google map:
//
//  ( 0, 0) Google map pixels
//  (90, 0) lat, long
//  (0, SLURL.gridEdgeSizeInRegions) grid_x, grid_y
//  /\
//   |------------------------------------+
//   |                                    |
//   |                                    |
//   |                                    |
//   |                                    |
//   |                                    |
//   |                                    |
//   |                                    |
//   |                                    |
//   | xxx                                |
//   | xxx                                |       (big, big) Google map pixels
//   ------------------------------------------>  (0,90) lat, long
//                                                (SLURL.gridEdgeSizeInRegions, 0) grid_x, grid_y
//
//  As this map shows, SL is mapped to the upper right quadrant of the
//  'world' map as used by Google lat/long coordinates.  A large scaling value
//  called SLURL.gridEdgeSizeInRegions is used to set the largest region coordinate
//  at the top and far right edge of the displayed area.  At the current
//  value of 2^20 = 1M, this creates a map area with room for 1 trillion sims.
//  The little xxx's in the diagram shows where the populated sims are in SL
//  today.
//
//

// === Constants ===
var SL_OCEAN_COLOR = "#1D475F";   // color when no region tile available

//
// Taken from prototype.js...
//

Object.extend = function(destination, source) 
{
	for (property in source) 
	{
			destination[property] = source[property];
	}

	return destination;
}

//
// ...end of prototype.js functions
//

// SLURL namespace
var SLURL = {
// SL map tile widths and heights are equal, so there's only one constant for tile size
	tileSize                   : 256.0,

// The maximum width/height of the SL grid in regions:
// 2^20 regions on a side = 1,048,786  ("This should be enough for anyone")
// *NOTE: This must be a power of 2 and divisible by 2^(max zoom) = 256
	gridEdgeSizeInRegions      : 1048576,

// We map a 1,048,576 (2^20) regions-per-side square positioned at the origin onto Lat/Long (0, 0) to (-90, 90)
	mapFactor                  : 90.0 / 1048576,

// Max/min zoom levels for SL maps (they are mapped to GMap zoom levels in a centralised place)
	minZoomLevel               : 8, // Zoomed out as much as possible
	maxZoomLevel               : 1, // Zoomed in as much as possible

// Delay for mouse hover action (mouse has to be still for this many milliseconds)
	mouseHoverDelay            : 1000,

// To allow for asynchronous access to the slurl.com APIs, we need to have a work around that allows us to assign variables in the global window scope
	getRegionCoordsByNameQueue : 0, // simple increment, rather than using randomly generated numbers
	getRegionCoordsByNameVar   : function(){ // returns a variable name more-or-less guaranteed to be unoccupied by any other API call
		return 'slurlGetRegionCoordsByName_' + (++SLURL.getRegionCoordsByNameQueue);
	},
	getRegionCoordsByName      : function(region, onLoadHandler, variable){
		variable = variable || 'slRegionPos_result'; // if no variable is specified, assign a default
		SLURL.loadScript(
			'http://slurl.com/get-region-coords-by-name?var=' + encodeURIComponent(variable) + '&sim_name=' + encodeURIComponent(region),
			function(){
				onLoadHandler(window[variable]);
			}
		);
	},
	getRegionNameByCoordsQueue : 0,
	getRegionNameByCoordsVar   : function(){
		return 'slurlGetRegionNameByCoords_' + (++SLURL.getRegionNameByCoordsQueue);
	},
	getRegionNameByCoords      : function(x, y, onLoadHandler, variable){
		variable = variable || 'slRegionName';
		SLURL.loadScript(
			'http://slurl.com/get-region-name-by-coords?var=' + encodeURIComponent(variable) + '&grid_x=' + encodeURIComponent(x) + '&grid_y=' + encodeURIComponent(y),
			function(){
				onLoadHandler(window[variable]);
			}
		);
	},

	gotoSLURL                  : function(slMap, region, x, y){ // two modes of use: SLURL.gotoSLURL(map instance, region name, local x coordinate, local y coordinate) and SLURL.gotoSLURL(map instance, grid x coordinate, grid y coordinate)
		if(typeof region == 'number'){ // if region is a number, then we're operating in the second mode so we reassign the variables appropriately
			y = x;
			x = region;
			region = undefined;
		}
		function mapWindow(regionName, gridX, gridY){
			var
				url       = ['secondlife://' + encodeURIComponent(regionName), (gridX % 1) * 256, (gridY % 1) * 256].join('/'),
				debugInfo = slDebugMap ? ' x: ' + Math.floor(gridX) + ' y: ' + Math.floor(gridY) : '';
			;
			slMap.addMapWindow( new window.MapWindow('<b>' + regionName + '</b><br>' + debugInfo + '<a href="' + url + '" class="teleport-button">Teleport Now</a>'), new SLURL.XYPoint(gridX, gridY));
		}
		if(region == undefined){
			SLURL.getRegionNameByCoords(Math.floor(x), Math.floor(y), function(result){
				if(typeof result == 'string'){
					mapWindow(result, x, y);
				}else if((result == null || result.error) && slDebugMap){
					alert('The coordinates of the SLURL (' + x + ', ' + y + ') were not recognised as being in a SecondLife region.');
				}
			}, SLURL.getRegionCoordsByNameVar());
		}else{
			x = x || 128;
			y = y || 128;
			SLURL.getRegionCoordsByName(region, function(result){
				if(result.x && result.y){
					x = result.x + (x / 256);
					y = result.y + (y / 256);
					if(slParanoidMap){
						SLURL.gotoSLURL(slMap, x, y);
					}else{
						mapWindow(region, x, y);
					}
				}else if(result.error && slDebugMap){
					alert('No coordinates could be found for region "' + region + '"');
				}
			}, SLURL.getRegionNameByCoordsVar());
		}
	},

	loadScript                 : function(scriptURL, onLoadHandler){
		var script  = document.createElement('script');
		script.src  = scriptURL;
		script.type = 'text/javascript';

		if(onLoadHandler){ // Install the specified onload handler
			script.onload = onLoadHandler;  // Standard onload for Firefox/Safari/Opera etc
			script.onreadystatechange = function(){ // Need to use ready state change for IE as it doesn't support onload for scripts
				if(script.readyState == 'complete' || script.readyState == 'loaded'){
					onLoadHandler();
				}
			}
		}

		document.body.appendChild(script);
	},

//  This Function returns the appropriate image tile from the S3 storage site corresponding to the
//  input location and zoom level on the google map.
	getTileUrl                 : function(pos, zoom){
		var sl_zoom = SLURL.convertZoom(zoom);

		var regions_per_tile_edge = Math.pow(2, sl_zoom - 1);
		
		var x = pos.x * regions_per_tile_edge;
		var y = pos.y * regions_per_tile_edge;

		// Adjust Y axis flip location by zoom value, in case the size of the whole
		// world is not divisible by powers-of-two.
		var offset = SLURL.gridEdgeSizeInRegions;
		offset -= offset % regions_per_tile_edge;
		y = offset - y;

		// Google tiles are named (numbered) based on top-left corner, but ours
		// are named by lower-left corner.  Since we flipped in Y, correct the
		// name.  JC
		y -= regions_per_tile_edge;
		
		// We name our tiles based on the grid_x, grid_y of the region in the
		// lower-left corner.
		x -= x % regions_per_tile_edge;
		y -= y % regions_per_tile_edge; 

		return (
			[ // this used to be a variable, but it wasn't used anywhere else in the JS, so it was moved here
//
//  Add 2 hosts so that we get faster performance on clients with lots
//  of bandwidth but possible browser limits on number of open files
//
				"http://map.secondlife.com.s3.amazonaws.com",
				"http://map.secondlife.com"
			][((x / regions_per_tile_edge) % 2)] //  Pick a server
			+ ["/map", sl_zoom, x, y, "objects.jpg"].join("-") //  Get image tiles from Amazon S3
		);
	},

// We map SL zoom levels to farthest out zoom levels for GMaps, as the Zoom control will then
// remove ticks for any zoom levels higher than we allow. (We map it in this way because it doesn't
// do the same for zoom levels lower than we allow).
	convertZoom                : function(zoom){
		return 8 - zoom;
	},

// Represents grid coordinates, equivalent LSL: integer pos = (llGetRegionCorner() / 256);
	XYPoint                    : function(x,y){
		this.x = x;
		this.y = y;
	},

// Represents named region coordinate with local region coordinate offset
	RegionPoint                : function(regionName, localX, localY){
		var obj = this;
		SLURL.getRegionCoordsByName(regionName, function(result){
			if(slDebugMap){
				if(result == undefined){
					alert('API query for region coordinates failed');
				}else if(result.error){
					alert('API query returned an error');
				}
			}else if(typeof result == 'object'){
				if(result.x && result.y){
					obj.x = result.x + (Math.min(Math.max(localX, 0), 256) / 256);
					obj.y = result.y + (Math.min(Math.max(localY, 0), 256) / 256);
					obj.found = true;
				}
			}
		}, SLURL.getRegionCoordsByNameVar());
	},

// Represents an area of the grid
	Bounds                     : function(xMin, xMax, yMin, yMax){
		this.xMin = xMin || 0;
		this.xMax = xMax || 0;
		this.yMin = yMin || 0;
		this.yMax = yMax || 0;
	}
}

SLURL.RegionPoint.prototype = new SLURL.XYPoint;

// Utility functions

function getRandomNumber(maxNumber)
{
	return Math.floor(Math.random() * maxNumber);
}

var slDebugMap = false;
var slParanoidMap = false; // this is to be used if we want to be paranoid about case-sensitivity in region names


// ====== Create the Euclidean Projection for the flat map ======
// == Constructor ==

// Do we want to display hover information for the map?
var slShowHoverTips = false;

function EuclideanProjection(NumZoomLevels)
{
    this.pixelsPerLonDegree=[];
    this.pixelsPerLonRadian=[];
    this.pixelOrigo=[];
    this.tileBounds=[];
    var BitmapSize = 512;
    var c=1;
    
    for(var d=0; d < NumZoomLevels; d++)
    {
        var e= BitmapSize / 2;
        this.pixelsPerLonDegree.push(BitmapSize / 360);
        this.pixelsPerLonRadian.push(BitmapSize / (2*Math.PI));
        this.pixelOrigo.push(new GPoint(e,e));
        this.tileBounds.push(c);
        BitmapSize *= 2;
        c*=2
    }
}


// == Attach it to the GProjection() class ==
EuclideanProjection.prototype=new GProjection();


// == A method for converting latitudes and longitudes to pixel coordinates == 
EuclideanProjection.prototype.fromLatLngToPixel=function(LatLng,zoom)
{
    var RawMapX = LatLng.lng() / SLURL.mapFactor;
    var RawMapY = -LatLng.lat() / SLURL.mapFactor;
    
    // Now map this square onto a 1:1 bitmap of the entire SL map, based
    // on the size of SL map tiles (at zoom level 1, the closest)
    var RawPixelX = RawMapX * SLURL.tileSize;
    var RawPixelY = RawMapY * SLURL.tileSize;
    
    // Now account for the fact that the map may be zoomed out
    zoom = SLURL.convertZoom(zoom);
    var ZoomFactor = Math.pow(2, zoom - 1);

    var PixelX = RawPixelX / ZoomFactor;
    var PixelY = RawPixelY / ZoomFactor;
    
    return new GPoint(PixelX, PixelY)
};

// == a method for converting pixel coordinates to latitudes and longitudes ==

EuclideanProjection.prototype.fromPixelToLatLng=function(pos,zoom,c)
{
    // First, account for the fact that the map may be zoomed out
    zoom = SLURL.convertZoom(zoom);
    var ZoomFactor = Math.pow(2, zoom - 1);

    var RawPixelX = pos.x * ZoomFactor;
    var RawPixelY = pos.y * ZoomFactor;
    
    // Now map this 1:1 bitmap position onto a 10k square of SL tiles, located at the origin
    var RawMapX = RawPixelX / SLURL.tileSize;
    var RawMapY = RawPixelY / SLURL.tileSize;
    
    // Now map this 10k SL square onto a 90 LatLng square
    var Lng = RawMapX * SLURL.mapFactor;
    var Lat = RawMapY * SLURL.mapFactor;
    
    return new GLatLng(-Lat,Lng,c)
};
 
// == a method that checks if the x/y value is in range ==
EuclideanProjection.prototype.tileCheckRange=function(pos, zoom, tileSize)
{
	return ((pos.x < 0) || (pos.y < 0)) ? false : true;
}

// == a method that returns the width of the tilespace (the bounding box of the map) ==      
EuclideanProjection.prototype.getWrapWidth=function(zoom) 
{
	return this.tileBounds[zoom] * SLURL.gridEdgeSizeInRegions;		
}


/////////////////////////////////////////////////////////////////////////////////////////////////
// SL Map API ///////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////


// ------------------------------------
//
//              SLURL.XYPoint
//
//
// ------------------------------------

SLURL.XYPoint.prototype.GetGLatLng = function()
{
    // Invert Y axis
	var corrected_y = SLURL.gridEdgeSizeInRegions - this.y;
    var lat = -corrected_y * SLURL.mapFactor;
    var lng = this.x * SLURL.mapFactor;
	return new GLatLng(lat, lng);
}
 

SLURL.XYPoint.prototype._SetFromGLatLng = function(gpos)
{
    this.x = gpos.lng() / SLURL.mapFactor;
    this.y = -gpos.lat() / SLURL.mapFactor;
    // Invert Y axis back
    this.y = SLURL.gridEdgeSizeInRegions - this.y;
}

// ------------------------------------
//
//               SLURL.Bounds
//
// ------------------------------------

SLURL.Bounds.prototype._SetFromGLatLngBounds = function(gbounds)
{
		var SW = new SLURL.XYPoint();
		var NE = new SLURL.XYPoint();
		
		SW._SetFromGLatLng(gbounds.getSouthWest());
		NE._SetFromGLatLng(gbounds.getNorthEast());
		
		this.xMin = SW.x;
		this.yMin = SW.y;
		
		this.xMax = NE.x;
		this.yMax = NE.y;
}


// ------------------------------------
//
//               Img
//
// ------------------------------------

function Img(imgURL, imgWidth, imgHeight, hasAlpha)
{
		this.isAlpha = function()
		{
				return this.alpha;
		};
		
		this.URL = imgURL;
		this.width = imgWidth;
		this.height = imgHeight;
		
		if (hasAlpha)
		{
				this.alpha = true;
		}
		else
		{
				this.alpha = false;
		}
}


// ------------------------------------
//
//               Icon
//
// ------------------------------------

function Icon(imageMain, imageShadow)
{
		this.hasShadow=function()
		{
				if (this.shadowImg)
				{
						return true;
				}
				else
				{
						return false;
				}
		};
		
		this.mainImg=imageMain;
		
		if (imageShadow)
		{
				this.shadowImg = imageShadow;
		}
}


// ------------------------------------
//
//              Marker
//
// ------------------------------------

function Marker(icons, pos, options)
{
		this.icons = icons;
		this.slCoord = pos;
		this.options= new MarkerOptions(options);
		
};

function MarkerOptions(options)
{
		this.clickHandler=false;
		this.onMouseOverHandler=false;
		this.onMouseOutHandler=false;
		this.centerOnClick=false;
		this.autopanOnClick=true;
		this.autopanPadding=45;
		this.verticalAlign="middle";
		this.horizontalAlign="center";
		this.zLayer=0;
		
		if (options)
				Object.extend(this, options);
		
};


// ------------------------------------
//
//             MapWindow
//
// ------------------------------------

function MapWindow(text, options)
{
		this.text = text;
		this.options = options;
}

MapWindow.prototype.getGMapOptions = function()
{
		var width = 252;
		if (this.options && this.options.width)
				width = this.options.width;
				
		return {maxWidth: width};
}

// ------------------------------------
//
//            SLMapOptions
//
// ------------------------------------

function SLMapOptions(options)
{
		this.hasZoomControls=true;
		this.hasPanningControls=true;
		this.hasOverviewMapControl=true;
		this.onStateChangedClickHandler=null;
		this.zoomMin = SLURL.minZoomLevel;
		this.zoomMax = SLURL.maxZoomLevel;
		
		if (options)
				Object.extend(this, options);
				
		if (this.zoomMin > SLURL.minZoomLevel)
				this.zoomMin = SLURL.minZoomLevel;
				
		if (this.zoomMax < SLURL.maxZoomLevel)
				this.zoomMax = SLURL.maxZoomLevel;
				
};

// ------------------------------------
//
//               SLMap
//
// ------------------------------------


function SLMap(map_element, map_options)
{
	this.ID = null;
	this.showingHoverWindow = false;
	
		if (GBrowserIsCompatible()) 
		{
				this.options = new SLMapOptions(map_options);
				this.mapProjection = new EuclideanProjection(18);

				// Create our custom map types and initialise map with them
				var mapTypes = this.CreateMapTypes();
				var mapDiv = this.CreateMapDiv(map_element);
                var mapOpts = {"mapTypes": mapTypes,
                               "backgroundColor": SL_OCEAN_COLOR };
				this.GMap = new GMap2(mapDiv, mapOpts);

				// Link GMap back to us
				this.GMap.slMap = this;
				
				// No GMap info windows open yet
				this.currentMapWindow = null;

		// No voice markers yet
		this.voiceMarkers = [];
						
				var addZoomControls = true;
				var addPanControls = true;
				var overviewMapControl = true;
				
				if (this.options != undefined)
				{
						if (this.options.hasPanningControls == false)
						{
								addPanControls = false;
						}
						
						if (this.options.hasZoomControls == false)
						{
								addZoomControls = false;
						}
						
						if (this.options.hasOverviewMapControl == false)
						{
								overviewMapControl = false;
						}

				}
				
				// Use GMaps native controls
				if (addZoomControls || addPanControls)
				{
					this.GMap.addControl(new GSmallMapControl());
				}
				
				if (overviewMapControl)
				{
					this.GMap.addControl(new GOverviewMapControl());
				}
				
				// Use GMaps xtra control methods
				this.GMap.enableContinuousZoom();
				this.GMap.enableScrollWheelZoom();
				
				this.GMap.setCenter(new GLatLng(0, 0), 16);
	
				// Allow user to switch map types
				this.GMap.addControl(new GMapTypeControl());

				// Install our various event handlers
				var slMap = this;
				
				GEvent.addListener(
						this.GMap, 
						"click", 
						function(marker, point) 
						{
								slMapClickHandler(slMap, marker, point);
						});
						
				/*
				GEvent.addListener(
								this.GMap, 
								"dblclick", 
								function(marker, point) 
								{
                                                                                slMapDoubleClickHandler(slMap, marker, point);
								});
				*/
				
				GEvent.addListener(
						this.GMap, 
						"moveend", 
						function() { slMap.onStateChangedHandler(); });

		if (slShowHoverTips)
		{
			// Enable, If we want mouse move handlers 
                                GEvent.addListener(
                                                this.GMap, 
						"mousemove", 
						function(pos) { slMap.onMouseMoveHandler(pos); });
			
				GEvent.addListener(
						this.GMap, 
						"mouseout", 
						function(pos) { slMap.onMouseOutHandler(pos); });
		}

				
				GEvent.addListener(
						this.GMap, 
						"dragstart", 
						function() 
						{
								slMapDragHandler(slMap);
						});        
						
				// Moved this to the end as GMaps seemed to fail if I did it right
				// after map creation, and I don't have time to debug other people's code.
			this.GMarkerManager = new GMarkerManager(this.GMap);
						
		}
		else
		{
				// Browser does not support Google Maps
				this.GMap = null;
		}
}

SLMap.prototype.onStateChangedHandler = function()
{
	// Service user supplied handler if it exists
	if (this.options && this.options.onStateChangedHandler)
	{
				this.options.onStateChangedHandler();
	}
}

SLMap.prototype.onMouseMoveHandler = function(pos)
{
	// We just got a mouse move, so the user isn't 'hovering' right now
	this.resetHoverTimeout(true);
	this.hoverPos = pos;
	
	// If we're showing a tooltip, close it
	if (this.showingHoverWindow)
	{
		this.GMap.closeInfoWindow();
	}
}

SLMap.prototype.onMouseOutHandler = function(pos)
{
	// Mouse is leaving map - clear tooltip timers
	this.clearHoverTimeout(true);
}

SLMap.prototype.clearHoverTimeout = function()
{
	if (this.ID != null)
	{
		window.clearTimeout(this.ID);
		this.ID = null;
	}
}

SLMap.prototype.resetHoverTimeout = function(forceTimerSet)
{
	var timerWasSet = (this.ID != null);
	this.clearHoverTimeout();
	
	if (timerWasSet || forceTimerSet)
	{		
		var map = this;
		this.ID = window.setTimeout(function() { map.mousehoverHandler(); }, SLURL.mouseHoverDelay);
	}
}

SLMap.prototype.mousehoverHandler = function()
{
	// Get tile coordinate
	tilePos = new SLURL.XYPoint;
	tilePos._SetFromGLatLng(this.hoverPos);
	
	var tileX = Math.floor(tilePos.x);
	var tileY = Math.floor(tilePos.y);

        this.showTileToolTip();
}

SLMap.prototype.getRegionName = function()
{
                var text = "Test Region Name";
                return text;
}

SLMap.prototype.showTileToolTip = function()
{
	var map = this;
	this.ID = null;

	var HoverText = "";
	
	if (true)
		//HoverText = "<b>" + this.getRegionName() + "</b><br/>";
                HoverText = this.getRegionName();
		
	this.GMap.openInfoWindowHtml(this.hoverPos, HoverText, { onCloseFn: function() { map.hoverWindowCloseHandler(); }});
	this.showingHoverWindow = true;
}

SLMap.prototype.hoverWindowCloseHandler = function()
{
	// Window has just closed, so reset any hover timer, so a window doesn't appear immediately
	this.showingHoverWindow = false;

	this.resetHoverTimeout(false);	
}

SLMap.prototype.CreateMapTypes = function()
{
	var mapTypes = [];
	
		var copyCollection = new GCopyrightCollection('SecondLife');
		var copyright = new GCopyright(1, new GLatLngBounds(new GLatLng(0, 0), new GLatLng(-90, 90)), 0, "(C) 2007 - " + (new Date).getFullYear() + " Linden Lab");
		copyCollection.addCopyright(copyright);

		// Create the 'Land' type of map
		var landTilelayers = [new GTileLayer(copyCollection, 10, 16)];
		landTilelayers[0].getTileUrl = SLURL.getTileUrl;
		
		//var landMap = new GMapType(landTilelayers, this.mapProjection, "Land", {errorMessage:"No SL data available"});
		var landMap = new GMapType(landTilelayers, this.mapProjection, "Land" );
		landMap.getMinimumResolution = function() { return SLURL.convertZoom(SLURL.minZoomLevel); };
		landMap.getMaximumResolution = function() { return SLURL.convertZoom(SLURL.maxZoomLevel); };

		mapTypes.push(landMap);
		
	return mapTypes;
}

SLMap.prototype.CreateMapDiv = function(mainDiv)
{
	var SLMap = this;

	// Create a unique ID for the region name field
	var inputFieldID = "slRegionNameField_" + getRandomNumber(10000);
	
	// Create a click handler
	var clickHandler = function() 
	{ 
		var textField = document.getElementById(inputFieldID);
		
		if (textField)
		{
			SLMap.gotoRegion(textField.value); 
		}
		else
		{
			alert("Can't find textField!");
		}
		
		return false;
	};
	
	// Create a div to be the main map container as a child of the main div
	var mapDiv = document.createElement("div");
	
	// Match parent height
	mapDiv.style.height = "100%";
	
//	// Now create the div for the text input form
//	var form = document.createElement("form");
//	form.name = "slregionname";
//	form.style.textAlign = "center";
//	form.style.padding = "4px";
//	form.onsubmit = clickHandler;
//	
//	// Label for the text field
//	var formLabel = document.createTextNode("Enter region name:");
//	var formLabelSpan = document.createElement("span");
//	formLabelSpan.style.fontSize = "80%";
//	formLabelSpan.appendChild(formLabel);
//
//	// Text field for the region name
//	var formText = document.createElement("input");
//	
//	formText.type = "text";
//	formText.name = "regionname";
//	formText.id = inputFieldID;
//	formText.value = "Ahern";
//	formText.size = 15;
//
//	// Button to activate 'go to region'
//	var formButton = document.createElement("input");
//	formButton.type = "submit";
//	formButton.value = "Go!";
//	formButton.onsubmit = clickHandler;
//	
//	// Put form on the page
//	form.appendChild(formLabelSpan);	
//	form.appendChild(formText);
//	form.appendChild(formButton);
//
//	mainDiv.appendChild(form);
	
	mainDiv.appendChild(mapDiv);

	return mapDiv;
}

SLMap.prototype.gotoRegion = function(regionName)
{
	var SLMap = this;
	
	// Add a dynamic script to get this region position, and then trigger a map center
	// change based on the results
	var varName = "slRegionPos_result";
	
	var scriptURL = "http://slurl.com/get-region-coords-by-name"
                + "?var=" + varName
                + "&sim_name=" + encodeURIComponent(regionName);

		// Once the script has loaded, we use the result to center the map on the position
		var onLoadHandler = function () 
		{
			if (slRegionPos_result.error)
			{
                alert("The region name '" + regionName + "' was not recognised.");
            }
            else
            {
				var x = slRegionPos_result.x;
				var y = slRegionPos_result.y;
            //  alert("Going to " + x + "," + y);
				
				var pos = new SLURL.XYPoint(x, y);
				SLMap.panOrRecenterToSLCoord(pos);
            }
		};
						
		SLURL.loadScript(scriptURL, onLoadHandler);
}

SLMap.prototype.centerAndZoomAtSLCoord = function(pos, zoom)
{
    if (this.GMap != null)
    {
        // Enforce zoom limits specified by client
        zoom = this._forceZoomToLimits(zoom);

        this.GMap.setCenter(pos.GetGLatLng(), SLURL.convertZoom(zoom));
    }
}

SLMap.prototype.disableDragging = function()
{
    if (this.GMap != null)
    {
        this.GMap.disableDragging();
    }
}

SLMap.prototype.enableDragging = function()
{
    if (this.GMap != null)
    {
            this.GMap.enableDragging();
    }
}

SLMap.prototype.getViewportBounds = function()
{
		if (this.GMap != null)
		{
				gLatLngBounds = this.GMap.getBounds();
				
				viewBounds = new SLURL.Bounds();
				viewBounds._SetFromGLatLngBounds(gLatLngBounds);
				return viewBounds;
		}
}

SLMap.prototype.getMapCenter = function()
{
		if (this.GMap != null)
		{
				gCenter = this.GMap.getCenter();
				
				center = new SLURL.XYPoint();
				center._SetFromGLatLng(gCenter);
				return center;
		}
}

function slMapDragHandler(slMap)
{
		if (slMap.currentMapWindow != null)
		{
				if (slMap.currentMapWindow.options)
				{
						if (slMap.currentMapWindow.options.closeOnMove)
						{
								slMap.GMap.closeInfoWindow();
								slMap.currentMapWindow = null;
						}
				}
		}    
}

function slMapClickHandler(slMap, gmarker, point)
{
	// DEBUG:  Show various data about the region clicked
                 

    /*
	alert("GLatLng: " + point.toString()
                      //+"\n Gpoint: " + slMap.GMap.mapProjection.fromLatLngToPixel(point)
                      //+"\n SLCoord: " + slCoord.x.toString() + "," + slCoord.y.toString()
                      +"\n slZoom: " + slZoom.toString()
                      +"\n GZoom: " + gZoom.toString()
                      +"\n SL Region: " + slCoord.x.toString() + "," + slCoord.y.toString()
                      //+"\n URL: " + tileURL
                      );
                */
                                
	if (gmarker == null)
	{
		// Generic click on map teleports directly to the location
        slCoord = new SLURL.XYPoint;
		slCoord._SetFromGLatLng(point);
        gotoSLURL(slCoord.x, slCoord.y, slMap);
	}
	else
	{
            // Handle clicking on a marker
           	var slMarker = gmarker.slMarker;

            if (slMarker)
            {        
				if (slMarker.options.centerOnClick)
				{
					slMap.panOrRecenterToSLCoord(slMarker.slCoord);
				}
					
				if (slMarker.options.clickHandler)
				{
					slMarker.options.clickHandler(slMarker);
				}
            }
	}
}


/*
function slMapDoubleClickHandler(slMap, gmarker, point)
{
		if (gmarker == null)
		{
				// on a double-click on land, simply teleport directly to the location!
                slCoord = new SLURL.XYPoint;
				slCoord._SetFromGLatLng(point);
                gotoSLURL(slCoord.x, slCoord.y, slMap);
		}
		else
		{
				// Handle clicking on a marker
				var slMarker = gmarker.slMarker;
				
				if (slMarker.options.clickHandler)
				{
						slMarker.options.clickHandler(slMarker);
				}
		}
}
*/

SLMap.prototype.clickMarker = function(marker)
{
		// Simulate a GMap click event on the centre of this marker
		slMapClickHandler(this, marker.gmarker, marker.gmarker.getPoint());
}

SLMap.prototype.addMarker = function(marker, mapWindow)
{
		if (this.GMap != null)
		{
				// Create the GMarker
				var markerImg = marker.icons[0];
				
				var gicon = new GIcon();
				gicon.image = markerImg.mainImg.URL;

				gicon.iconSize = new GSize(markerImg.mainImg.width, markerImg.mainImg.height);
				
				if (markerImg.shadowImg)
				{
						gicon.shadow = markerImg.shadowImg.URL;
						gicon.shadowSize = new GSize(markerImg.shadowImg.width, markerImg.shadowImg.height);
				}
				else
				{
						gicon.shadowSize = gicon.iconSize;
				}
						
				// Work out hotspot of marker
				var hotspotX = gicon.iconSize.width / 2;
				
				if (marker.options.horizontalAlign == "left")
						hotspotX = 0;
				else if (marker.options.horizontalAlign == "right")
						hotspotX = gicon.iconSize.width;
						
				var hotspotY = gicon.iconSize.height/ 2;
				
				if (marker.options.verticalAlign == "top")
						hotspotY = 0;
				else if (marker.options.verticalAlign == "bottom")
						hotspotY = gicon.iconSize.height;
						
				gicon.iconAnchor = new GPoint(hotspotX, hotspotY);
				
				// TODO: need to change this? It's probably ok for most cases
				gicon.infoWindowAnchor = gicon.iconAnchor;

				// Add the GMarker to the map
				var point = marker.slCoord.GetGLatLng();
				
				// The SL marker 'owns' the GMarker, and we insert a link from GMarker
				// back to SL marker to assist callback/event processing
				var isClickable = false;
				if (mapWindow ||
						marker.options.centerOnClick || 
						marker.options.clickHandler ||
						marker.options.onMouseOverHandler ||
						marker.options.onMouseOutHandler)
				{
						// Mouse over/out events are not clicks, but if we're not clickable or draggable, then
						// GMaps doesn't send us any events.
						isClickable = true;
				}
						
				var markerZIndex = 0;
				
				if (marker.options.zLayer)
						markerZIndex = marker.options.zLayer;
						
				var gmarkeroptions = 
						{
								icon: gicon, 
								clickable: isClickable, 
								draggable: false,
								zIndexProcess: function() { return markerZIndex; }
						};
				
				marker.gmarker = new GMarker(point, gmarkeroptions);
				
				marker.gmarker.slMarker = marker;
				
				if (mapWindow)
				{
						GEvent.addListener(marker.gmarker, "click", 
								function() 
								{
										marker.gmarker.openInfoWindowHtml(mapWindow.text, mapWindow.getGMapOptions());
										this.currentMapWindow = mapWindow;
								});
				}
				
				if (marker.options.onMouseOverHandler)
				{
						GEvent.addListener(marker.gmarker, "mouseover",
								function()
								{
										marker.options.onMouseOverHandler(marker);
								});
				}
				
				if (marker.options.onMouseOutHandler)
				{
						GEvent.addListener(marker.gmarker, "mouseout",
								function()
								{
										marker.options.onMouseOutHandler(marker);
								});
				}
				
				this.GMap.addOverlay(marker.gmarker);
		}
}

SLMap.prototype.removeMarker = function(marker)
{
		if (this.GMap != null)
		{
				if (marker.gmarker)
				{
						this.GMap.removeOverlay(marker.gmarker);
						marker.gmarker = null;
				}
		}
}

SLMap.prototype.removeAllMarkers = function()
{
		if (this.GMap != null)
		{
				this.GMap.clearOverlays();
		}
}

SLMap.prototype.addMapWindow = function(mapWindow, pos)
{
		if (this.GMap != null)
		{                           
				this.GMap.openInfoWindowHtml(pos.GetGLatLng(), mapWindow.text, mapWindow.getGMapOptions());
				this.currentMapWindow = mapWindow;
		}
}

SLMap.prototype.zoomIn = function()
{
		if (this.GMap != null)
		{
				if (this.options && this.options.zoomMax)
				{
						// Client specified zoom limit, so enforce it
						if (this.getCurrentZoomLevel() <= this.options.zoomMax)
								return;
				}
				
				// Ok to zoom in
				this.GMap.zoomIn();
		}
}

SLMap.prototype.zoomOut = function()
{
		if (this.GMap != null)
		{                           
				if (this.options && this.options.zoomMin)
				{
						// Client specified zoom limit, so enforce it
						if (this.getCurrentZoomLevel() >= this.options.zoomMin)
								return;
				}
				
				this.GMap.zoomOut();
		}
}

SLMap.prototype.getCurrentZoomLevel = function()
{
		if (this.GMap != null)
		{                           
				return SLURL.convertZoom(this.GMap.getZoom());
		}
}

SLMap.prototype._forceZoomToLimits = function(zoom)
{
		// Enforce zoom limits specified by client
		if (this.options && this.options.zoomMax)
		{
				if (zoom < this.options.zoomMax)
						zoom = this.options.zoomMax;
		}
		
		if (this.options && this.options.zoomMin)
		{
				if (zoom > this.options.zoomMin)
						zoom = this.options.zoomMin;
		}
		
		return zoom;
}

SLMap.prototype.setCurrentZoomLevel = function(zoom)
{
		if (this.GMap != null)
		{                           
				// Enforce zoom limits specified by client
				zoom = this._forceZoomToLimits(zoom);
				
				this.GMap.setZoom(SLURL.convertZoom(zoom));
		}
}

SLMap.prototype.panBy = function(x, y)
{
		if (this.GMap != null)
		{
				var pos = this.GMap.getCenter();
				
				var tileSize = new SLURL.XYPoint(x, y);
				
				var offset = this.mapProjection.fromPixelToLatLng(tileSize, this.GMap.getZoom());
				
				var newPos = new GLatLng(pos.lat() + offset.lat(), pos.lng() + offset.lng());
				this.GMap.panTo(newPos);
		}
}

SLMap.prototype.panLeft = function()
{
		this.panBy(-SLURL.tileSize, 0);
}

SLMap.prototype.panRight = function()
{
		this.panBy(SLURL.tileSize, 0);
}

SLMap.prototype.panUp = function()
{
		this.panBy(0, -SLURL.tileSize);
}

SLMap.prototype.panDown = function()
{
		this.panBy(0, SLURL.tileSize);
}

SLMap.prototype.panOrRecenterToSLCoord = function(pos, forceCenter)
{
		if (this.GMap != null)
		{
				this.GMap.panTo(pos.GetGLatLng());
		}
}