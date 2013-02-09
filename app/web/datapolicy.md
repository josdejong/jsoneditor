# JSON Editor online - Data policy

http://jsoneditoronline.org


This file describes the data policy of JSON Editor Online. When using the
open/save functionality of the editor, files may need to be downloaded via the
server, therefore:

**DO NOT LOAD OR SAVE SENSITIVE DATA VIA THE EDITORS OPEN/SAVE FUNCTIONALITY.**

Files which are downloaded via the server are sent unsecured and unencrypted.


## 1. Opening files

If the browser in use supports HTML5 FileReader, files are directly loaded
from disk into the editor. The files are not send to the server.

If HTML5 is not supported, the files are first uploaded to the server and then
downloaded by the editor. The files are deleted from the server as soon as
they are downloaded once. If a file is not downloaded for some reason, it will
be deleted from the server after one hour.


## 2. Saving files

If the browser in use supports HTML5 a.download, files are directly saved
from the browser to disk. The files are not send to the server.

If HTML5 is not supported, the files are first uploaded to the server and then
downloaded to disk. The files are deleted from the server as soon as they are
downloaded once. If a file is not downloaded for some reason, it will be
deleted from the server after one hour.


## 3. Opening urls

When opening an url, the editor first opens the url directly. If this fails
due to cross-domain restrictions, the url will be retrieved via the server.
In that case, the retrieved data is sent directly to the browser and is not
stored on the server.


## 4. Cutting/pasting clipboard data

When cutting and pasting text in the editor using the system clipboard, no
data is sent via the server.
