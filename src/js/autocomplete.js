'use strict';

function completely(config) {
    config = config || {};
    config.fontSize = config.fontSize || '16px';
    config.fontFamily = config.fontFamily || 'sans-serif';
    config.promptInnerHTML = config.promptInnerHTML || '';
    config.color = config.color || '#333';
    config.hintColor = config.hintColor || '#aaa';
    config.backgroundColor = config.backgroundColor || '#fff';
    config.dropDownBorderColor = config.dropDownBorderColor || '#aaa';
    config.dropDownZIndex = config.dropDownZIndex || '100'; // to ensure we are in front of everybody
    config.dropDownOnHoverBackgroundColor = config.dropDownOnHoverBackgroundColor || '#ddd';

    var wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.outline = '0';
    wrapper.style.border = '0';
    wrapper.style.margin = '0';
    wrapper.style.padding = '0';

    var dropDown = document.createElement('div');
    dropDown.style.position = 'absolute';
    dropDown.style.visibility = 'hidden';
    dropDown.style.outline = '0';
    dropDown.style.margin = '0';
    dropDown.style.paddingLeft = '2pt';
    dropDown.style.paddingRight = '10pt';
    dropDown.style.textAlign = 'left';
    dropDown.style.fontSize = config.fontSize;
    dropDown.style.fontFamily = config.fontFamily;
    dropDown.style.backgroundColor = config.backgroundColor;
    dropDown.style.zIndex = config.dropDownZIndex;
    dropDown.style.cursor = 'default';
    dropDown.style.borderStyle = 'solid';
    dropDown.style.borderWidth = '1px';
    dropDown.style.borderColor = config.dropDownBorderColor;
    dropDown.style.overflowX = 'hidden';
    dropDown.style.whiteSpace = 'pre';
    dropDown.style.overflowY = 'scroll';  // note: this might be ugly when the scrollbar is not required. however in this way the width of the dropDown takes into account


    var spacer;
    var leftSide; // <-- it will contain the leftSide part of the textfield (the bit that was already autocompleted)
    var createDropDownController = function (elem, rs) {
        var rows = [];
        var ix = 0;
        var oldIndex = -1;

        var onMouseOver = function () { this.style.outline = '1px solid #ddd'; }
        var onMouseOut = function () { this.style.outline = '0'; }
        var onMouseDown = function () { p.hide(); p.onmouseselection(this.__hint, p.rs); }

        var p = {
            rs: rs,
            hide: function () {
                elem.style.visibility = 'hidden';
                //rs.hideDropDown();
            },
            refresh: function (token, array) {
                elem.style.visibility = 'hidden';
                ix = 0;
                elem.innerHTML = '';
                var vph = (window.innerHeight || document.documentElement.clientHeight);
                var rect = elem.parentNode.getBoundingClientRect();
                var distanceToTop = rect.top - 6;                        // heuristic give 6px 
                var distanceToBottom = vph - rect.bottom - 6;  // distance from the browser border.

                rows = [];
                for (var i = 0; i < array.length; i++) {
                    if (array[i].indexOf(token) !== 0) { continue; }
                    var divRow = document.createElement('div');
                    divRow.style.color = config.color;
                    divRow.onmouseover = onMouseOver;
                    divRow.onmouseout = onMouseOut;
                    divRow.onmousedown = onMouseDown;
                    divRow.__hint = array[i];
                    divRow.innerHTML = token + '<b>' + array[i].substring(token.length) + '</b>';
                    rows.push(divRow);
                    elem.appendChild(divRow);
                }
                if (rows.length === 0) {
                    return; // nothing to show.
                }
                if (rows.length === 1 && token === rows[0].__hint) {
                    return; // do not show the dropDown if it has only one element which matches what we have just displayed.
                }

                if (rows.length < 2) return;
                p.highlight(0);

                if (distanceToTop > distanceToBottom * 3) {        // Heuristic (only when the distance to the to top is 4 times more than distance to the bottom
                    elem.style.maxHeight = distanceToTop + 'px';  // we display the dropDown on the top of the input text
                    elem.style.top = '';
                    elem.style.bottom = '100%';
                } else {
                    elem.style.top = '100%';
                    elem.style.bottom = '';
                    elem.style.maxHeight = distanceToBottom + 'px';
                }
                elem.style.visibility = 'visible';
            },
            highlight: function (index) {
                if (oldIndex != -1 && rows[oldIndex]) {
                    rows[oldIndex].style.backgroundColor = config.backgroundColor;
                }
                rows[index].style.backgroundColor = config.dropDownOnHoverBackgroundColor; // <-- should be config
                oldIndex = index;
            },
            move: function (step) { // moves the selection either up or down (unless it's not possible) step is either +1 or -1.
                if (elem.style.visibility === 'hidden') return ''; // nothing to move if there is no dropDown. (this happens if the user hits escape and then down or up)
                if (ix + step === -1 || ix + step === rows.length) return rows[ix].__hint; // NO CIRCULAR SCROLLING. 
                ix += step;
                p.highlight(ix);
                return rows[ix].__hint;//txtShadow.value = uRows[uIndex].__hint ;
            },
            onmouseselection: function () { } // it will be overwritten. 
        };
        return p;
    }

    function setEndOfContenteditable(contentEditableElement) {
        var range, selection;
        if (document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
        {
            range = document.createRange();//Create a range (a range is a like the selection but invisible)
            range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
            range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
            selection = window.getSelection();//get the selection object (allows you to change selection)
            selection.removeAllRanges();//remove any selections already made
            selection.addRange(range);//make the range you have just created the visible selection
        }
        else if (document.selection)//IE 8 and lower
        {
            range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
            range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
            range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
            range.select();//Select the range (make it the visible selection
        }
    }

    function calculateWidthForText(text) {
        if (spacer === undefined) { // on first call only.
            spacer = document.createElement('span');
            spacer.style.visibility = 'hidden';
            spacer.style.position = 'fixed';
            spacer.style.outline = '0';
            spacer.style.margin = '0';
            spacer.style.padding = '0';
            spacer.style.border = '0';
            spacer.style.left = '0';
            spacer.style.whiteSpace = 'pre';
            spacer.style.fontSize = config.fontSize;
            spacer.style.fontFamily = config.fontFamily;
            spacer.style.fontWeight = 'normal';
            document.body.appendChild(spacer);
        }

        // Used to encode an HTML string into a plain text.
        // taken from http://stackoverflow.com/questions/1219860/javascript-jquery-html-encoding
        spacer.innerHTML = String(text).replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        return spacer.getBoundingClientRect().right;
    }

    var rs = {
        onArrowDown: function () { },               // defaults to no action.
        onArrowUp: function () { },               // defaults to no action.
        onEnter: function () { },               // defaults to no action.
        onTab: function () { },               // defaults to no action.
        onChange: function () { }, // defaults to repainting.
        startFrom: 0,
        options: [],
        element: null,
        elementHint: null,
        elementStyle: null,
        wrapper: wrapper,      // Only to allow  easy access to the HTML elements to the final user (possibly for minor customizations)
        Show: function (element, options) {
            this.wrapper.remove();
            if (this.elementHint) {
                this.elementHint.remove();
                this.elementHint = null;
            }
            var w = element.getBoundingClientRect().right - element.getBoundingClientRect().left;
            dropDown.style.marginLeft = '0';
            dropDown.style.marginTop = element.getBoundingClientRect().height + 'px';
            this.options = options;

            if (this.element != element) {
                this.element = element;
                this.elementStyle = {
                    zIndex: this.element.style.zIndex,
                    position: this.element.style.position,
                    backgroundColor: this.element.style.backgroundColor,
                    borderColor: this.element.style.borderColor
                }
            }

            this.element.style.zIndex = 3;
            this.element.style.position = 'relative';
            this.element.style.backgroundColor = 'transparent';
            this.element.style.borderColor = 'transparent';
            

            this.elementHint = element.cloneNode();
            this.elementHint.style.zIndex = 2;
            this.elementHint.style.position = 'absolute';
            this.elementHint.style.top = '0';
            this.elementHint.style.left = '0';
            this.elementHint.style.color = config.hintColor;
            this.elementHint.onfocus = function () { this.element.focus(); }.bind(this);

            /*
            registerOnTextChange(this.element, function (text) { // note the function needs to be wrapped as API-users will define their onChange
                rs.onChange(text);
            });*/

            if (this.element.addEventListener) {
                this.element.removeEventListener("keydown", keyDownHandler);
                this.element.addEventListener("keydown", keyDownHandler, false);
                this.element.removeEventListener("blur", onBlurHandler);
                this.element.addEventListener("blur", onBlurHandler, false);                
            } 

            wrapper.appendChild(this.elementHint);
            wrapper.appendChild(dropDown);
            element.parentElement.appendChild(wrapper);


            this.repaint(element);
        },
        setText: function (text) {
            this.element.innerText = text;
        },
        getText: function () {
            return this.element.innerText;
        },
        hideDropDown: function () {
            this.wrapper.remove();
            if (this.elementHint) {
                this.elementHint.remove();
                this.elementHint = null;
            }
            dropDownController.hide();            
            this.element.style.zIndex = this.elementStyle.zIndex;
            this.element.style.position = this.elementStyle.position;
            this.element.style.backgroundColor = this.elementStyle.backgroundColor;
            this.element.style.borderColor = this.elementStyle.borderColor;
        },
        repaint: function (element) {
            var text = element.innerText;
            text = text.replace('\n', '');

            var startFrom = this.startFrom;
            var options = this.options;
            var optionsLength = this.options.length;

            // breaking text in leftSide and token.
            
            var token = text.substring(this.startFrom);
            leftSide = text.substring(0, this.startFrom);
            
            for (var i = 0; i < optionsLength; i++) {
                var opt = this.options[i];
                if (opt.indexOf(token) === 0) {         // <-- how about upperCase vs. lowercase
                    this.elementHint.innerText = leftSide + opt;
                    break;
                }
            }

            // moving the dropDown and refreshing it.
            dropDown.style.left = calculateWidthForText(leftSide) + 'px';
            dropDownController.refresh(token, this.options);
            this.elementHint.style.width = calculateWidthForText(this.elementHint.innerText) + 'px'
            var wasDropDownHidden = (dropDown.style.visibility == 'hidden');
            if (!wasDropDownHidden)
                this.elementHint.style.width = calculateWidthForText(this.elementHint.innerText) + dropDown.clientWidth + 'px';
        }
    };

    var dropDownController = createDropDownController(dropDown, rs);

    var keyDownHandler = function (e) {
        console.log("Keydown:" + e.keyCode);
        e = e || window.event;
        var keyCode = e.keyCode;

        if (this.elementHint == null) return;

        if (keyCode == 33) { return; } // page up (do nothing)
        if (keyCode == 34) { return; } // page down (do nothing);

        if (keyCode == 27) { //escape
            dropDownController.hide();
            this.elementHint.innerText = this.element.innerText; // ensure that no hint is left.
            this.element.focus();
            return;
        }

        if (keyCode == 39 || keyCode == 35 || keyCode == 9) { // right,  end, tab  (autocomplete triggered)
            if (keyCode == 9) { // for tabs we need to ensure that we override the default behaviour: move to the next focusable HTML-element 
                e.preventDefault();
                e.stopPropagation();
                if (this.elementHint.innerText.length == 0) {
                    rs.onTab(); // tab was called with no action.
                    // users might want to re-enable its default behaviour or handle the call somehow.
                }
            }
            if (this.elementHint.innerText.length > 0) { // if there is a hint
                dropDownController.hide();
                if (this.element.innerText != this.elementHint.innerText) {
                    this.element.innerText = this.elementHint.innerText;
                    setEndOfContenteditable(this.element);
                    var hasTextChanged = registerOnTextChangeOldValue != this.element.innerText
                    registerOnTextChangeOldValue = this.element.innerText; // <-- to avoid dropDown to appear again. 
                    // for example imagine the array contains the following words: bee, beef, beetroot
                    // user has hit enter to get 'bee' it would be prompted with the dropDown again (as beef and beetroot also match)
                    if (hasTextChanged) {
                        rs.onChange(this.element.innerText); // <-- forcing it.
                    }
                }
            }
            return;
        }

        if (keyCode == 13) {       // enter  (autocomplete triggered)
            if (this.elementHint.innerText.length == 0) { // if there is a hint
                rs.onEnter();
            } else {
                var wasDropDownHidden = (dropDown.style.visibility == 'hidden');
                dropDownController.hide();

                if (wasDropDownHidden) {
                    this.elementHint.innerText = this.element.innerText; // ensure that no hint is left.
                    this.element.focus();
                    rs.onEnter();
                    return;
                }

                this.element.innerText = this.elementHint.innerText;
                var hasTextChanged = registerOnTextChangeOldValue != this.element.innerText
                registerOnTextChangeOldValue = this.element.innerText; // <-- to avoid dropDown to appear again. 
                // for example imagine the array contains the following words: bee, beef, beetroot
                // user has hit enter to get 'bee' it would be prompted with the dropDown again (as beef and beetroot also match)
                if (hasTextChanged) {
                    rs.onChange(this.element.innerText); // <-- forcing it.
                }
                e.preventDefault();
                e.stopPropagation();
                setEndOfContenteditable(this.element);

            }
            return;
        }

        if (keyCode == 40) {     // down
            var m = dropDownController.move(+1);
            if (m == '') { rs.onArrowDown(); }
            this.elementHint.innerText = leftSide + m;
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        if (keyCode == 38) {    // up
            var m = dropDownController.move(-1);
            if (m == '') { rs.onArrowUp(); }
            this.elementHint.innerText = leftSide + m;
            e.preventDefault();
            e.stopPropagation();
            return;
        }

    }.bind(rs);

    var onBlurHandler = function (e) {
        rs.hideDropDown();
    }.bind(rs);

    dropDownController.onmouseselection = function (text, rs) {
        rs.element.innerText = rs.elementHint.innerText = leftSide + text;
        rs.hideDropDown();
    };

    var registerOnTextChangeOldValue;

    /**
     * Register a callback function to detect changes to the content of the input-type-text.
     * Those changes are typically followed by user's action: a key-stroke event but sometimes it might be a mouse click.
    **/
    var registerOnTextChange = function (txt, callback) {
        registerOnTextChangeOldValue = txt.value;
        var handler = function () {
            var value = txt.value;
            if (registerOnTextChangeOldValue !== value) {
                registerOnTextChangeOldValue = value;
                callback(value);
            }
        };

        //  
        // For user's actions, we listen to both input events and key up events
        // It appears that input events are not enough so we defensively listen to key up events too.
        // source: http://help.dottoro.com/ljhxklln.php
        //
        // The cost of listening to three sources should be negligible as the handler will invoke callback function
        // only if the text.value was effectively changed. 
        //  
        // 
        if (txt.addEventListener) {
            txt.addEventListener("input", handler, false);
            txt.addEventListener('keyup', handler, false);
            txt.addEventListener('change', handler, false);
        } else { // is this a fair assumption: that attachEvent will exist ?
            txt.attachEvent('oninput', handler); // IE<9
            txt.attachEvent('onkeyup', handler); // IE<9
            txt.attachEvent('onchange', handler); // IE<9
        }
    };

    

    return rs;
}

if (window.module != undefined)
    module.exports = completely;