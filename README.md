# About mapapi.js

mapapi.js originally started as a refactor of slmapapi.js for Open Hack 2009.
The initial refactor was mostly concerned with moving all the code under window.SLURL, although some improvement were added, making the API simpler to use. Additional support for plugins & callbacks were added, allowing default behaviours to be overwritten.
A later refactor fleshed out some experiments concerned with adding "grid config" support, allowing the single piece of core code to be used with either Second Life or the various OpenSim grids.

In March 2010, an issue was created in the Second Life public issue tracker: https://jira.secondlife.com/browse/WEB-1560
WEB-1560 was a formal request for Linden Lab to apply an open source license to slmapapi.js, and in January 2011 an MIT license was approved.

## Examples
* [Poly Shapes](http://signpostmarv.github.com/mapapi.js/examples/shape.html) (mapapi.shape is currently only implemented on the canvas renderer)

### Renderers
* [Canvas](http://signpostmarv.github.com/mapapi.js/examples/renderer-canvas.html)
* [Google v3](http://signpostmarv.github.com/mapapi.js/examples/renderer-google-v3.html)

### UI
* [minimalist UI](http://signpostmarv.github.com/mapapi.js/examples/ui.minimalist.html) (a work in progress port of the minimalist UI from mapapi.net)
* [infoWindow interface](http://signpostmarv.github.com/mapapi.js/examples/infoWindow.html)
* [marker interface](http://signpostmarv.github.com/mapapi.js/examples/marker.html)
