#!/bin/sh

compiler="/home/jos/Dropbox/Jos/programming/javascript/tools/compiler.jar"
file="jsoneditor.js"
minifiedFile="jsoneditor-min.js"

echo "Minifying file $file..."

java -jar $compiler --js $file --js_output_file $minifiedFile

echo "Minified file saved as $minifiedFile"
