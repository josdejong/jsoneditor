#!/bin/sh

sh minify.sh

cd ..

package="jsoneditoronline.zip"
files="index.html jsoneditor.js jsoneditor-min.js jsoneditor.css favicon.ico changelog.txt img LICENSE ../NOTICE"

rm $package

# create zip file
zip -r $package $files
