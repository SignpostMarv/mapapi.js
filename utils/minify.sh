mkdir -p ../build/

java -jar ../../compiler.jar --js ../src/slmapapi.js --js_output_file ../build/slmapapi.js
java -jar ../../yuicompressor-2.4.2.jar --type css --charset utf-8 -o ../build/slmapapi.css ../src/slmapapi.css

java -jar ../../compiler.jar --js ../src/mapapi.js --js ../src/mapapi.renderer.js --js ../src/mapapi.tileSource.js --js ../src/mapapi.gridConfig.js --js ../src/renderer/google-v3.js --js ../src/renderer/canvas.js --js_output_file ../build/mapapi.js
java -jar ../../compiler.jar --js ../src/gridconfig/com.secondlife.agni.js --js_output_file ../build/mapapi.gridConfigs.js