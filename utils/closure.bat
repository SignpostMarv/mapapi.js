java -jar ..\..\compiler.jar --js ..\src\slmapapi.js --js_output_file ..\build\slmapapi-min.js

copy /b ..\LICENSE + ..\build\slmapapi-min.js ..\build\slmapapi.js
del ..\build\slmapapi-min.js