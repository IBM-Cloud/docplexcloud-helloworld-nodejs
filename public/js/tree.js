/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * Returns a type for the specified object.
 * Returned type can be one of the following: <ul>
 *   <li>object</li>
 *   <li>array</li>
 *   <li>number</li>
 *   <li>string</li>
 *   <li>boolean</li>
 *   <li>undefined</li>
 *   <li>function</li>
 *   <li>date</li>
 *   <li>regexp</li>
 * </ul>
 */
var getType = (function() {
  var cache = {};
  return function(obj) {
    var key;
    return obj === null ? 'null' // null
      : obj === window ? 'global' // window in browser or global in nodejs
      : (key = typeof obj) !== 'object' ? key // basic: string, boolean, number, undefined, function
      : obj.nodeType ? 'object' // DOM element
      : cache[key = ({}).toString.call(obj)] // cached. date, regexp, error, object, array, math
    || (cache[key] = key.slice(8, -1).toLowerCase()); // get XXXX from [object XXXX], and cache it
  };
}());

/**
 * Returns true if the specified value can is primitive and can be displayed as a leaf in the HTML tree built with
 * the {@link #makeTree} function.
 * @param value the value to test/
 * @returns {boolean} true if the value is primitive; false otherwise.
 */
function isPrimitiveType( value ) {
  var t = getType( value );
  return ( t == 'number' ) || ( t == 'string' ) || ( t == 'boolean' ) || ( t == 'undefined' ) || ( t == 'function' ) || ( t == 'date' ) || ( t == 'regexp' );
}

/**
 * Constructs an HTML tree into the element with the specified id and from the specified JSON data
 * object.
 * The options object parameter can provide optional fields: <ul>
 *   <li>renderer</li> A object with a renderValue( key, value ) method to render a value into an HTML node.
 *   The key parameter provides the name of the field that holds the value to be converted.
 *   <li>convertValue</li> The function convertValue( key, value ) converts the specify value into a string to be
 *   rendered. This function, if specified, is only called if a renderer has not been specified. The key parameter
 *   provides the name of the field that holds the value to be converted.
 *  </ul>
 */
var makeTree = (function() {
  var idAttrs = [ 'id', '_id', 'name', '_name' ];
  var EXPANDED_STYLE = 'fa-minus-square-o';//'fa-caret-down';
  var COLLAPSED_STYLE = 'fa-plus-square-o';//'fa-caret-right';
  var LI_EXPANDED_STYLE = 'tree-node-expanded';
  var LI_COLLAPSED_STYLE = 'tree-node-collapsed';

  // Callback function to process the click event on a parent tree node.
  function onClickParentNode( ev ) {
    var $li = $( ev.target ).closest( 'li' );
    var li = $li.get( 0 );
    var i = $li.find( 'i' ).get( 0 );
    var index = i.className.indexOf( EXPANDED_STYLE );
    if( index >= 0 ) {
      i.className = i.className.replace( EXPANDED_STYLE, COLLAPSED_STYLE );
      li.className = li.className.replace( LI_EXPANDED_STYLE, LI_COLLAPSED_STYLE );
    }
    else {
      i.className = i.className.replace( COLLAPSED_STYLE, EXPANDED_STYLE );
      li.className = li.className.replace( LI_COLLAPSED_STYLE, LI_EXPANDED_STYLE );
    }
    ev.preventDefault();
    ev.stopPropagation();
    return false;
  }

  // Function to create an HTML tree node.
  function createPropertyLI( value, key, arrIndex, recursive, options ) {
    var li = document.createElement( 'li' );

    var primitive = isPrimitiveType( value );

    var spanParent;

    // If the tree node being created will have child nodes, provides it with according CSS styles and
    // mouse click handler.
    if( !primitive && recursive ) {
      var a = document.createElement( 'a' );
      a.href = "#";
      var i = document.createElement( 'i' );
      i.className = 'fa ' + COLLAPSED_STYLE;
      a.onclick = onClickParentNode;
      li.className = 'tree-parent-node ' + LI_COLLAPSED_STYLE;
      a.appendChild( i );
      li.appendChild( a );
      spanParent = a;
    }
    else if( primitive ) {
      // Otherwise, the tree node is a leaf.
      li.className = 'tree-leaf';
      spanParent = li;
    }


    var spanKey = document.createElement('span');
    spanKey.className = 'treeKey';
    var t = getType( value );
    // If the element being rendered belongs to an array, at the index in that array in the tree node representation.
    if( arrIndex >= 0 ) {
      if( !primitive ) {
        for( var id = 0, c = idAttrs.length; id < c; id++ ) {
          if( value[ idAttrs[ id ] ] ) {
            t = value[ idAttrs[ id ] ];
            break;
          }
        }
      }
      key = t + ' [' + arrIndex + ']';
    }

    spanKey.appendChild( document.createTextNode( key + ( primitive? ":" : "" ) ) );
    spanParent.appendChild( spanKey );

    if( !primitive ) {
      // If the li tree node represents an object, fills the li node with tree nodes for the child fields of the
      // value object.
      if( recursive ) {
        var ol = document.createElement( 'ol' );
        fillNode( ol, value, options );
        li.appendChild( ol );
      }
    }
    else {
      // Render a primitive value
      var spanValue;
      // If a renderer has been specified with the options, use it
      if( options && options.renderer ) {
        spanValue = options.renderer.renderValue( key, value );
      }
      else {
        // Otherwise, convert the value into a string a show it in a text node added to a <span>.
        spanValue = document.createElement('span');
        spanValue.className = 'treeValue';
        spanValue.appendChild( document.createTextNode( options && options.convertValue? options.convertValue( key, value ) : value ) );
        spanParent.appendChild( spanValue );
      }
    }
    return li;
  }

  /**
   * Fills the specified ulNode UL tree node with the child fields of the obj parameter.
   */
  function fillNode( ulNode, obj, options ) {
    if( getType( obj ) == 'array' ) {
      for(var i = 0, count = obj.length; i < count; i++ ) {
        ulNode.appendChild( createPropertyLI( obj[ i ], null, i, true, options ) );
      }
    }
    else {
      for(var prop in obj) {
        if( obj.hasOwnProperty( prop ) ) {
          var li = createPropertyLI( obj[ prop ], prop, -1, true, options );
          if( li ) {
            ulNode.appendChild( li );
          }
        }
      }
    }
  }

  // Create the HTML at the DOM node with the specified id and from the specified data source.
  return function( id, data, options ) {
    // The root tree must be a UL element.
    // Use the DOM node element with the specified id as the root tree node if it is a UL
    // Otherwise, create a new UL as a child of the specified DOM node.
    var elt = document.getElementById( id );
    var treeRoot;
    if( ( elt.className == 'ol' ) || ( elt.className == 'ul' ) ) {
      treeRoot = elt;
    }
    else {
      treeRoot = document.createElement( 'ol' );
    }
    // Empty the UL tree node
    while( elt.firstChild ) {
      elt.removeChild( elt.firstChild );
    }
    treeRoot.className = 'tree';
    fillNode( treeRoot, data, options );

    // To avoid too many DOM updates, add the tree root to the specified DOM elt after it has been filled.
    if( treeRoot != elt ) {
      elt.appendChild( treeRoot );
    }
    return elt;
  };
}());