#!/bin/sh

sh minify.sh

cd ..

package="jsoneditoronline.zip"
files="index.html jsoneditor/jsoneditor.js jsoneditor/jsoneditor-min.js jsoneditor/jsoneditor.css favicon.ico changelog.txt jsoneditor/img LICENSE NOTICE README"

rm $package

# create zip file
zip -r $package $files
