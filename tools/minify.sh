#!/bin/sh

compiler="compiler.jar"
file="../jsoneditor/jsoneditor.js"
minifiedFile="../jsoneditor/jsoneditor-min.js"

echo "Minifying file $file..."

java -jar $compiler --js $file --js_output_file $minifiedFile

echo "Minified file saved as $minifiedFile"
