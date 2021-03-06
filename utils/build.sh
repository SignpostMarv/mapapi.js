DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd ${DIR}
rm -fr ../mapapi.js/
mkdir -p ../mapapi.js/

java -jar ../../compiler.jar \
	--js ../src/slmapapi.js \
	--js_output_file ../mapapi.js/slmapapi.js

java -jar ../../yuicompressor-2.4.2.jar --type css --charset utf-8 -o ../mapapi.js/slmapapi.css ../src/slmapapi.css

java -jar ../../compiler.jar \
	--js ../src/gridconfig/com.secondlife.agni.js \
	--js_output_file ../mapapi.js/mapapi.gridConfigs.js

java -jar ../../compiler.jar \
	--js ../src/lib/EventTarget.js \
	--js ../src/mapapi.js \
	--js ../src/mapapi.storage.js \
	--js ../src/mapapi.shape.js \
	--js ../src/mapapi.polyregion.js \
	--js ../src/mapapi.search.js \
	--js ../src/mapapi.ui.js \
	--js ../src/uiitem/list.js \
	--js ../src/uiitem/search-list.js \
	--js ../src/uiitem/search-section.js \
	--js ../src/ui/minimalist.js \
	--js ../src/ui/contextmenu.js \
	--js ../src/mapapi.renderer.js \
	--js ../src/mapapi.tileSource.js \
	--js ../src/mapapi.gridConfig.js \
	--js ../src/renderer/canvas.js \
	--js ../src/renderer/google-v3.js \
	--js ../src/gridconfig/opensim.js \
	--js_output_file ../mapapi.js/mapapi-complete.js

rm -fr ../mapapi.js/ui
mkdir ../mapapi.js/ui
cp ../src/ui/marker.png ../mapapi.js/ui/marker.png
cp ../src/ui/marker-shadows.png ../mapapi.js/ui/marker-shadows.png
cp ../src/ui/marker-tail-top-slice.png ../mapapi.js/ui/marker-tail-top-slice.png
lessc --clean-css --clean-option=--selectors-merge-mode:ie8 ../src/ui/minimalist.less ../mapapi.js/ui/minimalist.css

mkdir ../mapapi.js/lib
cp ../src/lib/less.js ../mapapi.js/lib/less.js

if command -v zopfli 2>/dev/null ;
then
	zopfli --i1000 --gzip ../mapapi.js/mapapi-complete.js
	zopfli --i1000 --gzip ../mapapi.js/mapapi.gridConfigs.js
	zopfli --i1000 --gzip ../mapapi.js/ui/minimalist.css
else
if [ -f ../../7za.exe ];
then
	if [ -f ../mapapi.js/mapapi-complete.js.gz ];
		then rm -f ../mapapi.js/mapapi-complete.js.gz
	fi;
	if [ -f ../mapapi.js/mapapi.gridConfigs.js.gz ];
		then rm -f ../mapapi.js/mapapi.gridConfigs.js.gz
	fi;
	../../7za.exe a -tgzip ../mapapi.js/mapapi-complete.js.gz ../mapapi.js/mapapi-complete.js -mx=9 -mfb=258 -mpass=15
	../../7za.exe a -tgzip ../mapapi.js/mapapi.gridConfigs.js.gz ../mapapi.js/mapapi.gridConfigs.js -mx=9 -mfb=258 -mpass=15
	../../7za.exe a -tgzip ../mapapi.js/ui/minimalist.css.gz ../mapapi.js/ui/minimalist.css -mx=9 -mfb=258 -mpass=15
else
	gzip -cf --best ../mapapi.js/mapapi-complete.js > ../mapapi.js/mapapi-complete.js.gz
	gzip -cf --best ../mapapi.js/mapapi.gridConfigs.js > ../mapapi.js/mapapi.gridConfigs.js.gz
	gzip -cf --best ../mapapi.js/ui/minimalist.css > ../mapapi.js/ui/minimalist.css.gz
fi;
fi

rm -fr ../build
mkdir ../build
cd ../
tar -cjf build/mapapi.js.tbz mapapi.js
