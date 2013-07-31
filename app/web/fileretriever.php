<?php

/**
 * Script to load and save JSON files from the Javascript client to disk and url.
 *
 * Usage:
 *
 * POST file.php with a JSON document as body
 *    Will store the JSON document on disk and return the id of the document.
 *
 * POST file.php with a JSON document with name "file" as body multipart/form-data
 *    Will store the JSON document on disk and return the id of the document.
 *
 * GET file.php?url=....
 *    Will fetch the url and return it (resolves cross-domain security issues)
 *
 * GET file.php?id=...
 * GET file.php?id=...&filename=...
 *    Will return the file with the id, and remove the file from disk.
 *    Optionally specify a filename for the download. Default is 'document.json'
 */

// TODO: neatly handle exceeding of the max size
$tmp = 'tmp';           // directory for temporarily storing the files

$method = $_SERVER['REQUEST_METHOD'];

// make temporary directory to store the file (if not existing)
if (!is_dir(getcwd() . '/' . $tmp)) {
    mkdir(getcwd() . '/' . $tmp);
}

/**
 * Create a filename from given id
 * @param {String} id          id of the file
 * @return {String} filename   path to the file
 */ 
function getFilename($id) {
    global $tmp;
    return "$tmp/$id";
}

if ($method == 'GET') {
    $filename = isset($_GET['filename']) ? $_GET['filename'] : 'document.json';
    if (isset($_GET['url'])) {
        // download a file from url and return the file
        $url = $_GET['url'];
        $context = stream_context_create(array(
            'http' => array(
                'method' => 'GET',
                'header' => "Accept: application/json\r\n"
            )
        ));
        if (preg_match('/^https?:\/\//', $url)) { // only allow to fetch http:// and https:// urls
            $body = file_get_contents($url, false, $context);
            if ($body != false) {
                header("Content-Disposition: attachment; filename=\"$filename\"");
                header('Content-type: application/json');
                echo $body;
            }
            else {
                header('HTTP/1.1 404 Not Found');
            }
        }
        else {
            header('HTTP/1.1 403 Forbidden');
        }
    }
    else if (isset($_GET['id'])) {
        // retrieve the file with given id from disk, return it,
        // and remove it from disk
        $id = $_GET['id'];
        $body = file_get_contents(getFilename($id));
        if ($body !== false) {
            header("Content-Disposition: attachment; filename=\"$filename\"");
            header('Content-type: application/json');
            echo $body;
            unlink(getFilename($id));
        }
        else {
            header('HTTP/1.1 404 Not Found');
        }
    }
    else {
        // TODO: error
    }
}
else if ($method == 'POST') {
    // retrieve the data, save it on disk with a random id,
    // and return the id.
    
    if (isset($_FILES['file'])) {
        // read body from uploaded form
        $file = $_FILES['file'];
        $id = uniqid();
        $filename = getFilename($id);
        move_uploaded_file($file['tmp_name'], $filename);
        echo $id;
    }
    else {
        // read raw body from post request
        $body = @file_get_contents('php://input');
        if ($body === false) {
            $body = '';
        }
        $id = uniqid();
        file_put_contents(getFilename($id), $body);
        echo $id;
    }
}

// cleanup files older than 1 hour
// http://stackoverflow.com/q/6411451/1262753
if ($dir = opendir($tmp)) {
    $now = time();
    while (false !== ($file = readdir($dir))) {
        $filename = "$tmp/$file";
        if (is_file($filename) && filemtime($filename) <= ($now - 60 * 60) ) {
           unlink($filename);
        }
    }
    closedir($dir);
}

?>
