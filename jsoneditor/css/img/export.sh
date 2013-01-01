#!/bin/sh
# Export the SVG icons to PNG and GIF formats

echo "Exporting the SVG icons..."

outputdir=./
mogrify -format png -background transparent -path $outputdir *.svg
# mogrify -format gif -background transparent -path $outputdir dots_gray.svg
echo "PNG's exported to $outputdir"

# mogrify -format gif -background transparent -path gif *.svg
# echo "GIF's exported to /gif"
# mogrify -format png -background transparent -path png *.svg
# echo "PNG's exported to /png"

echo "Done"
