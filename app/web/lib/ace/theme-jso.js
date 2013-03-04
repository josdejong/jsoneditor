/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/theme/jso', ['require', 'exports', 'module' , 'ace/lib/dom'], function(require, exports, module) {

exports.isDark = false;
exports.cssClass = "ace-jso";
exports.cssText = ".ace-jso .ace_gutter {\
background: #ebebeb;\
color: #333\
}\
\
.ace-jso.ace_editor {\
font-family: droid sans mono, monospace, courier new, courier, sans-serif;\
line-height: 1.3;\
}\
.ace-jso .ace_print-margin {\
width: 1px;\
background: #e8e8e8\
}\
.ace-jso .ace_scroller {\
background-color: #FFFFFF\
}\
.ace-jso .ace_text-layer {\
color: gray\
}\
.ace-jso .ace_variable {\
color: #1a1a1a\
}\
.ace-jso .ace_cursor {\
border-left: 2px solid #000000\
}\
.ace-jso .ace_overwrite-cursors .ace_cursor {\
border-left: 0px;\
border-bottom: 1px solid #000000\
}\
.ace-jso .ace_marker-layer .ace_selection {\
background: #D5DDF6\
}\
.ace-jso.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #FFFFFF;\
border-radius: 2px\
}\
.ace-jso .ace_marker-layer .ace_step {\
background: rgb(255, 255, 0)\
}\
.ace-jso .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #BFBFBF\
}\
.ace-jso .ace_marker-layer .ace_active-line {\
background: #FFFBD1\
}\
.ace-jso .ace_gutter-active-line {\
background-color : #dcdcdc\
}\
.ace-jso .ace_marker-layer .ace_selected-word {\
border: 1px solid #D5DDF6\
}\
.ace-jso .ace_invisible {\
color: #BFBFBF\
}\
.ace-jso .ace_keyword,\
.ace-jso .ace_meta,\
.ace-jso .ace_support.ace_constant.ace_property-value {\
color: #AF956F\
}\
.ace-jso .ace_keyword.ace_operator {\
color: #484848\
}\
.ace-jso .ace_keyword.ace_other.ace_unit {\
color: #96DC5F\
}\
.ace-jso .ace_constant.ace_language {\
color: orange\
}\
.ace-jso .ace_constant.ace_numeric {\
color: red\
}\
.ace-jso .ace_constant.ace_character.ace_entity {\
color: #BF78CC\
}\
.ace-jso .ace_invalid {\
background-color: #FF002A\
}\
.ace-jso .ace_fold {\
background-color: #AF956F;\
border-color: #000000\
}\
.ace-jso .ace_storage,\
.ace-jso .ace_support.ace_class,\
.ace-jso .ace_support.ace_function,\
.ace-jso .ace_support.ace_other,\
.ace-jso .ace_support.ace_type {\
color: #C52727\
}\
.ace-jso .ace_string {\
color: green\
}\
.ace-jso .ace_comment {\
color: #BCC8BA\
}\
.ace-jso .ace_entity.ace_name.ace_tag,\
.ace-jso .ace_entity.ace_other.ace_attribute-name {\
color: #606060\
}\
.ace-jso .ace_markup.ace_underline {\
text-decoration: underline\
}\
.ace-jso .ace_indent-guide {\
background: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAE0lEQVQImWP4////f4bLly//BwAmVgd1/w11/gAAAABJRU5ErkJggg==\") right repeat-y\
}";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
