java -jar ../../compiler.jar --js ../src/slmapapi.js --js_output_file ../build/slmapapi-min.js

cat ../LICENSE ../build/slmapapi-min.js > ../build/slmapapi.js
rm ../build/slmapapi-min.js