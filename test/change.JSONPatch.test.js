// var assert = require('assert');
// var util = require('../src/js/util');

// var chai = require('chai')
// , spies = require('chai-spies');
// chai.use(spies);

var assert = chai.assert;
var expect = chai.expect;

describe('@change', function () {

  context('should return JSON Patch', function(){
    var container, editor, json, changeSpy;
    beforeEach(function(){
      container = document.createElement("div");
      document.body.appendChild(container);
      changeSpy = chai.spy();
      editor = new JSONEditor(container,{
        change: changeSpy
      });
      json = {
          "Array": [1, 2, 3],
          "Boolean": true,
          "Null": null,
          "Number": 123,
          "Object": {"a": "b", "c": "d"},
          "String": "Hello World"
      };
      editor.set(json);
    });
    afterEach(function(){
      container && container.parentElement && container.parentElement.removeChild(container);
    })

    context('when changes value', function () {
      it('from Boolean, replace', function () {
        var valueField = container.querySelectorAll("[contenteditable=true][class=value]")[0];
        valueField.textContent = "false";
        valueField.dispatchEvent(new Event("blur"));
        expect(changeSpy).to.have.been.called();
        expect(changeSpy).to.have.been.called.once;
        expect(changeSpy).to.have.been.called.with({op: "replace",path: "/Boolean",value: false});
      });

      it('from null, replace', function () {
        var valueField = container.querySelectorAll("[contenteditable=true][class=value]")[1];
        valueField.textContent = "notNull";
        valueField.dispatchEvent(new Event("blur"));
        expect(changeSpy).to.have.been.called();
        expect(changeSpy).to.have.been.called.once;
        expect(changeSpy).to.have.been.called.with({op: "replace",path: "/Null",value: "notNull"});
      });

      it('from Number, replace', function () {
        var valueField = container.querySelectorAll("[contenteditable=true][class=value]")[2];
        valueField.textContent = "1234";
        valueField.dispatchEvent(new Event("blur"));
        expect(changeSpy).to.have.been.called();
        expect(changeSpy).to.have.been.called.once;
        expect(changeSpy).to.have.been.called.with({op: "replace",path: "/Number",value: 1234});
      });

      it('from String, replace', function () {
        var valueField = container.querySelectorAll("[contenteditable=true][class=value]")[3];
        valueField.textContent = "Hello JSON Patch";
        valueField.dispatchEvent(new Event("blur"));
        expect(changeSpy).to.have.been.called();
        expect(changeSpy).to.have.been.called.once;
        expect(changeSpy).to.have.been.called.with({op: "replace",path: "/String",value: "Hello JSON Patch"});
      });

    });

    context('when changes type', function () {

      context('from Array', function () {
        it('to String, replace', function () {
          editor.node.childs[0]._onChangeType("string");

          expect(changeSpy).to.have.been.called();
          expect(changeSpy).to.have.been.called.once;
          expect(changeSpy).to.have.been.called.with({op: "replace",path: "/Array",value: ""});
        });
        it('to Object, replace (pending)', function () {
          editor.node.childs[0]._onChangeType("object");

          expect(changeSpy).to.have.been.called();
          expect(changeSpy).to.have.been.called.once;
          expect(changeSpy).to.have.been.called.with({op: "replace",path: "/Array",value: {"":3}});
        });

      }); // EO Array

      context('from Boolean', function () {
        it('to String, replace', function () {
          editor.node.childs[1]._onChangeType("string");

          expect(changeSpy).to.have.been.called();
          expect(changeSpy).to.have.been.called.once;
          expect(changeSpy).to.have.been.called.with({op: "replace",path: "/Boolean",value: "true"});
        });
        it('to Object, replace (pending)', function () {
          editor.node.childs[1]._onChangeType("object");

          expect(changeSpy).to.have.been.called();
          expect(changeSpy).to.have.been.called.once;
          expect(changeSpy).to.have.been.called.with({op: "replace",path: "/Boolean",value: {}});
        });
        it('to Array, replace (pending)', function () {
          editor.node.childs[1]._onChangeType("array");

          expect(changeSpy).to.have.been.called();
          expect(changeSpy).to.have.been.called.once;
          expect(changeSpy).to.have.been.called.with({op: "replace",path: "/Boolean",value: []});
        });

      }); // EO Boolean

      context('from Null', function () {
        it('to String, replace', function () {
          editor.node.childs[2]._onChangeType("string");

          expect(changeSpy).to.have.been.called();
          expect(changeSpy).to.have.been.called.once;
          expect(changeSpy).to.have.been.called.with({op: "replace",path: "/Null",value: "null"});
        });
        it('to Object, replace (pending)', function () {
          editor.node.childs[2]._onChangeType("object");

          expect(changeSpy).to.have.been.called();
          expect(changeSpy).to.have.been.called.once;
          expect(changeSpy).to.have.been.called.with({op: "replace",path: "/Null",value: {}});
        });
        it('to Array, replace (pending)', function () {
          editor.node.childs[2]._onChangeType("array");

          expect(changeSpy).to.have.been.called();
          expect(changeSpy).to.have.been.called.once;
          expect(changeSpy).to.have.been.called.with({op: "replace",path: "/Null",value: []});
        });

      }); // EO Null

      context('from Number', function () {
        it('to String, replace', function () {
          editor.node.childs[3]._onChangeType("string");

          expect(changeSpy).to.have.been.called();
          expect(changeSpy).to.have.been.called.once;
          expect(changeSpy).to.have.been.called.with({op: "replace",path: "/Number",value: "123"});
        });
        it('to Object, replace (pending)', function () {
          editor.node.childs[3]._onChangeType("object");

          expect(changeSpy).to.have.been.called();
          expect(changeSpy).to.have.been.called.once;
          expect(changeSpy).to.have.been.called.with({op: "replace",path: "/Number",value: {}});
        });
        it('to Array, replace (pending)', function () {
          editor.node.childs[3]._onChangeType("array");

          expect(changeSpy).to.have.been.called();
          expect(changeSpy).to.have.been.called.once;
          expect(changeSpy).to.have.been.called.with({op: "replace",path: "/Number",value: []});
        });

      }); // EO Number

      context('from Object', function () {
        it('to String, replace', function () {
          editor.node.childs[4]._onChangeType("string");

          expect(changeSpy).to.have.been.called();
          expect(changeSpy).to.have.been.called.once;
          expect(changeSpy).to.have.been.called.with({op: "replace",path: "/Object",value: ""});
        });
        it('to Array, replace (pending)', function () {
          editor.node.childs[4]._onChangeType("array");

          expect(changeSpy).to.have.been.called();
          expect(changeSpy).to.have.been.called.once;
          expect(changeSpy).to.have.been.called.with({op: "replace",path: "/Object",value: ["b","d"]});
        });

      }); // EO Object

      context('from String', function () {
        it('to Object, replace (pending)', function () {
          editor.node.childs[5]._onChangeType("object");

          expect(changeSpy).to.have.been.called();
          expect(changeSpy).to.have.been.called.once;
          expect(changeSpy).to.have.been.called.with({op: "replace",path: "/String",value: {}});
        });
        it('to Array, replace (pending)', function () {
          editor.node.childs[5]._onChangeType("array");

          expect(changeSpy).to.have.been.called();
          expect(changeSpy).to.have.been.called.once;
          expect(changeSpy).to.have.been.called.with({op: "replace",path: "/String",value: []});
        });

      }); // EO String
    });// EO change type

    context('when removes a node', function () {

      it('from Array, remove', function () {
        editor.node.childs[0].childs[1]._onRemove();

        expect(changeSpy).to.have.been.called();
        expect(changeSpy).to.have.been.called.once;
        expect(changeSpy).to.have.been.called.with({op: "remove",path: "/Array/1"});
      });
      it('from Object, remove', function () {
        editor.node.childs[1]._onRemove();

        expect(changeSpy).to.have.been.called();
        expect(changeSpy).to.have.been.called.once;
        expect(changeSpy).to.have.been.called.with({op: "remove",path: "/Boolean"});
      });
    });// EO remove node

    context('when edits a node\'s key', function () {

      it('move', function () {
        var keyField = container.querySelectorAll("[contenteditable=true][class=field]")[0];
        keyField.innerText = "newArray";
        keyField.dispatchEvent(new Event("blur"));

        expect(changeSpy).to.have.been.called();
        expect(changeSpy).to.have.been.called.once;
        expect(changeSpy).to.have.been.called.with({op: "move", from: "/Array", path: "/newArray"});
      });
    });// EO edit
  });
});
