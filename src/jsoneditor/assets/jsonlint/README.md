The file jsonlint.js is copied from the following project:

https://github.com/josdejong/jsonlint  at 85a19d7

which is a fork of the (currently not maintained) project:

https://github.com/zaach/jsonlint

The forked project contains some fixes to allow the file to be bundled with 
browserify. The file is copied in this project to prevent issues with linking 
to a github project from package.json, which is for example not supported 
by jspm. 

As soon as zaach/jsonlint is being maintained again we can push the fix
to the original library and use it as dependency again.
