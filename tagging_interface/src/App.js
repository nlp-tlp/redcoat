import React from 'react';
import logo from './favicon.png'
import './stylesheets/stylesheet.scss';
import {Component} from 'react';
import $ from 'jquery';
//const ReactDragListView = require('react-drag-listview');
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import styled from 'styled-components';
import _ from 'underscore';

var data = {
  hello: 5,
  hi: 7
}
/* a(href="" + base_url + "")
        span.inner
          span.img
            img(src="" + base_url + "images/favicon.png")
          span Redcoat
          */



// https://stackoverflow.com/questions/3169786/clear-text-selection-with-javascript
function clearWindowSelection() {
  if (window.getSelection) {
    if (window.getSelection().empty) {  // Chrome
      window.getSelection().empty();
    } else if (window.getSelection().removeAllRanges) {  // Firefox
      window.getSelection().removeAllRanges();
    }
  } else if (document.selection) {  // IE?
    document.selection.empty();
  }
}

class Navbar extends Component {
  render() {
    return (
      <nav id="navbar">
        <div className="navbar-left">
          <div id="logo">
            <a href="/redcoat">
              <span className="inner">
                <span className="img">
                  <img src={logo}/>
                </span>
                <span>Redcoat</span>
              </span>
            </a>
          </div>
        </div>
        <div className="navbar-centre">Tagging Interface (WIP)</div>
        <div className="navbar-right">
          <div className="dropdown-menu short">
            <a href="features">v1.0</a>
          </div>
        </div>
      </nav>
    )
  }
}










class SubCategory extends Component {
  constructor(props) {
    super(props);
  }


  render() {
    var children = this.props.item.children;
    if(children) {
      var childItems = (
        <ul className={this.props.open ? "" : "hidden"}>
          { children.map((item, index) => (
            <SubCategory  item={item}
                          open={this.props.openedItems.has(item.full_name)}
                          openedItems={this.props.openedItems}
                          onClick={this.props.onClick}
                          hotkeyArray={index < 9 ? Array.prototype.concat(this.props.hotkeyArray, [index + 1]) : null}
                          hotkeyMap={this.props.hotkeyMap}
            />)) }
        </ul>
      );
    } else {
      childItems = '';
    }

    var hasHotkey = this.props.hotkeyMap.hasOwnProperty(this.props.item.full_name)
    var hotkeyStr = hasHotkey ? this.props.hotkeyMap[this.props.item.full_name].join('') : '';


    return (
      <li>
        <span className="inner-container">
          {children && <span className="open-button" onClick={() => this.props.onClick(this.props.item.full_name)}><i className={"fa fa-chevron-" + (this.props.open ? "up" : "down")}></i></span>}
          <span className={"category-name" + (hasHotkey ? " has-hotkey" :"")}
                    data-hotkey-id={hotkeyStr}>
            {this.props.item.name}
          </span>
        </span>
        {childItems}

      </li>
    )

  }
}

class Category extends Component {


  constructor(props) {
    super(props);
  }


  render() {
    var item = this.props.item;
    var index = this.props.index;
    var children = this.props.item.children;



    if(children) {
      var childItems = (
        <ul className={this.props.open ? "" : "hidden"}>
          { children.map((item, index) => (
            <SubCategory  item={item}
                          open={this.props.openedItems.has(item.full_name)}
                          openedItems={this.props.openedItems}
                          onClick={this.props.onClick}
                          hotkeyArray={index < 9 ? Array.prototype.concat(this.props.hotkeyArray, [index + 1]) : null}
                          hotkeyMap={this.props.hotkeyMap}
            />)) }
        </ul>
      );
    } else {
      childItems = '';
    }

    var hasHotkey = this.props.hotkeyMap.hasOwnProperty(this.props.item.full_name)
    var hotkeyStr = hasHotkey ? this.props.hotkeyMap[this.props.item.full_name].join('') : '';


    return (
      <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
        {(provided, snapshot) => (
          <li
            ref={provided.innerRef}
            {...provided.draggableProps}

            className={"draggable " + (snapshot.isDragging ? "dragging": "not-dragging") + " color-" + (item.colorId + 1)}
          
          >
            <span className="inner-container">
              <div {...provided.dragHandleProps} className="drag-handle-container"><span className="drag-handle"></span></div>
               {children && <span className="open-button" onClick={() => this.props.onClick(item.full_name)}><i className={"fa fa-chevron-" + (this.props.open ? "up" : "down")}></i></span>}
             
              <span className={"category-name" + (hasHotkey ? " has-hotkey" :"")}
                    data-hotkey-id={hotkeyStr}>             

                {item.name}
              </span>
            </span>
            {childItems}
            
          </li>
        )}
      </Draggable>


    )


  }


}



// https://codesandbox.io/s/k260nyxq9v?file=/index.js:154-2795
// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};



function getOrderedItems(items, order) {
  var orderedItems = new Array(items.length);
  for(var i = 0; i < order.length; i++) {
    orderedItems[i] = items[order[i]];
  }
  return orderedItems;
}

class CategoryHierarchy extends Component {
  constructor(props) {
    super(props);
    this.state = {
      itemOrder: [],      // An array that maintains the ordering of the top-level categories.
                          // e.g. [0, 1, 3, 2]
      orderedItems: [],
      openedItems: new Set(),    // An set keep track of the items that have been open (indexed by name).
    }
    this.onDragEnd = this.onDragEnd.bind(this);
  }

  // When this component's items changes, setup a new itemOrder state.
  componentDidUpdate(prevProps, prevState) {
    var t = this;
    function setupItemOrder() {
      var itemOrder = new Array(t.props.items.length);
      for(var i = 0; i < itemOrder.length; i++) {
        itemOrder[i] = i;
      }
      return itemOrder;
    }

    
    var itemOrder = setupItemOrder();
    if(!_.isEqual(prevProps.items, this.props.items)) {
      this.setState({
        openedItems: new Set(),
        orderedItems: this.props.items,
        itemOrder: itemOrder,
      });
    }
  }

  // Open or close a category.
  // It's pretty awkward that this function is necessary. It would be ideal to store 'open' as a state variable inside the Category and Subcategory
  // components, but that results in the wrong categories being open when the top-level categories are moved around.
  // Storing them in the openedItems array allows for the opened categories to be maintained when the user
  // drags a category from one place to another.
  // full_name should be the full name of the category, e.g. item/pump/centrifugal_pump, which are unique.
  toggleCategory(full_name) {
    var openedItems = this.state.openedItems;    

    if(openedItems.has(full_name)) {
      openedItems.delete(full_name);
    } else {
      openedItems.add(full_name);
    }

    this.setState({
      openedItems: openedItems
    })
  }




  // When the user has finished dragging a category, determine the new item order and save this order to the state.
  onDragEnd(result) {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const itemOrder = reorder(
      this.state.itemOrder,
      result.source.index,
      result.destination.index
    );

    var orderedItems = getOrderedItems(this.props.items, itemOrder)

    this.props.setupHotkeyMap(orderedItems, () =>
      this.setState({
        itemOrder: itemOrder,
        orderedItems: orderedItems,
      })
    );
  }

  
  render() {


    var items       = this.state.orderedItems;
    var openedItems = this.state.openedItems;

    //this.props.setupHotkeyMap();

    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <Droppable droppableId="droppable">
          {(provided, snapshot) => (
            <ul
              {...provided.droppableProps}
              className={"draggable-list" + (snapshot.isDraggingOver ? " dragging" : "")}
              ref={provided.innerRef}

            >
              {items.map((item, index) => (
                <Category item={item}
                          index={index}
                          onClick={this.toggleCategory.bind(this)}
                          open={openedItems.has(item.name)} 
                          openedItems={this.state.openedItems} 
                          hotkeyMap={this.props.hotkeyMap}
                          hotkeyArray={index < 9 ? new Array([index + 1]) : null}
                />
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}

class Word extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: false,
    }
  }




  render() {
    return (
      <span className={"word" + (this.props.selected ? " selected" : "")}
        onMouseDown={() => this.props.updateSelections(this.props.index, 'down')}
        onMouseUp=  {() => this.props.updateSelections(this.props.index, 'up')}>
        <span className="word-inner">
          {this.props.text}
        </span>
      </span>
    );
  }
}


class Sentence extends Component {
  constructor(props) {
    super(props);
  }

  // wordMouseDown(index, word) {
  //   console.log("mouse down:", word, index);
  //   this.setState({
  //     selectionEnd: -1,
  //     selectionStart: index
  //   }, () => this.props.updateSelectedSentence(this.props.index));
  //   // }, () => {
  //   //   window.addEventListener('mouseup', () => {
  //   //     this.setState({
  //   //       selectionStart: -1,
  //   //       selectionEnd: -1,
  //   //     })
  //   //   })
  //   // })
  // }

  // wordMouseUp(index, word) {
  //   console.log("mouse up:", word, index);
  //   clearWindowSelection();
  //   this.setState({
  //     selectionEnd: index
  //   }, () => {    
  //     this.props.updateSelectedSentence(this.props.index)  
  //     console.log(this.state.selectionStart, this.state.selectionEnd, '<<<')
  //   });

  // }

  updateSelections(wordIndex, action) {
    this.props.updateSelections(this.props.index, wordIndex, action)
  }



  render() {

    var selections = this.props.selections;

    // Check props.selections to determine whether the word with a given index in this sentence is selected.
    function isWordSelected(wordIndex) {      
      if(selections.length === 0) return false;     
      for(var i = 0; i < selections.length; i++) {
        var selection = selections[i];
        if(selection.wordEndIndex < 0) continue;
        if(selection.wordEndIndex >= wordIndex && wordIndex >= selection.wordStartIndex ) {
          return true;
        }
      }
      return false;
    }

    return (
      <div className="sentence" data-ind={this.props.index} data-ind1={this.props.index + 1}>
        { this.props.words.map((word, i) => 
          <Word key={i}
                index={i}
                text={word}
                selected={isWordSelected(i)}
                updateSelections={this.updateSelections.bind(this)}
                //wordMouseUp={this.props.updateSelection.bind(this)}
          />)
        }
        
      </div>
    );
  }

}


function nextNode(node) {
    if (node.hasChildNodes()) {
        return node.firstChild;
    } else {
        while (node && !node.nextSibling) {
            node = node.parentNode;
        }
        if (!node) {
            return null;
        }
        return node.nextSibling;
    }
}


// I found most of the code for getRangeSelectedNodes on Stackoverflow:
// https://stackoverflow.com/questions/7781963/js-get-array-of-all-selected-nodes-in-contenteditable-div
function getRangeSelectedNodes(range) {
    var node = range.startContainer;
    var endNode = range.endContainer;

    // Special case for a range that is contained within a single node
    if (node == endNode) {
        return [node.parentNode];
    }


    // Iterate nodes until we hit the end container
    var rangeNodes = [];
    while (node && node != endNode) {
        rangeNodes.push( node = nextNode(node) );
    }

    // Add partially selected nodes at the start of the range
    node = range.startContainer;
    while (node && node != range.commonAncestorContainer) {
        rangeNodes.unshift(node);
        node = node.parentNode;
    }

    return rangeNodes;
}





class TaggingInterface extends Component {
  constructor(props) {
    super(props);
    this.state = {
      project_id: '-PE1dNzht', // debug

      selections: this.getEmptySelectionsArray(10),
      currentSelection: this.getEmptyCurrentSelection(),

      data: {
        documentGroup: [],
        categoryHierarchy: {'children': []}
      },

      hotkeyMap: {},
      reverseHotkeyMap: {},
      hotkeyChain: [], // Stores the current hotkey chain, e.g. [1, 2, 3] = the user has pressed 1, then 2, then 3 in quick succession
      hotkeyBindingFn: null,  // Stores the function that gets called via an eventlistener when a hotkey is pressed. Must be stored as a state
                              // variable so that it can be detached when the hotkeys change.
      hotkeyTimeoutFn: null,   // Stores the current hotkey timeout function

      holdingCtrl: false, // Whether the user is currently holding the ctrl key
      holdingShift: false, // Whether the user is currently holding the shift key


    }    
  }

  /* Mouse and keyboard events */

  // Sets up an event listener for mouseup so that if a user starts selecting a word, and then releases the mouse
  // when *not* hovered over another word, the selections can be updated properly.
  // The event listener will call the updateSelections method as if the last word in the sentence has been selected.
  //
  // Note that the majority of the mouse events are passed down to the Word elements via updateSelections.
  setupMouseEvents() {

    var words = $('.word-inner')
    document.addEventListener("selectionchange",event=>{
      if(this.state.currentSelection.wordStartIndex < 0) {
        return;
      }
      var sel = window.getSelection && window.getSelection();

      if (sel && sel.rangeCount > 0) {
        var r =  getRangeSelectedNodes(sel.getRangeAt(0));        
        words.removeClass('highlighted');
        $(r).addClass('highlighted');          
      }
    })

    window.addEventListener('mouseup', (e) => {
      words.removeClass('highlighted');
      if(this.state.currentSelection.wordStartIndex < 0) {
        clearWindowSelection();
        return;
      }
      if(!e.target.classList.contains('word-inner')) { // Ensure that the user is not hovering over a word            
        var sentenceIndex = this.state.currentSelection.sentenceIndex;
        this.updateSelections(sentenceIndex, this.state.data.documentGroup[sentenceIndex].length - 1, 'up');
      }        
    });
  }

  // Set up the key binds (ctrl, shift, left right up down etc).
  // This function does not set up the hotkeys (that is done via setupHotkeyKeybinds)
  setupKeybinds() {

    document.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'Shift':       if(!this.state.holdingShift) this.setState({ holdingShift: true }); break;
        case 'Control':     if(!this.state.holdingCtrl) this.setState({ holdingCtrl: true }); break;

        // For the arrows, call e.preventDefault() to prevent the window from scrolling
        case 'ArrowLeft':   e.preventDefault(); this.moveSelectionHorizontally('left'); break; 
        case 'ArrowUp':     e.preventDefault(); this.moveSelectionVertically('up'); break;
        case 'ArrowRight':  e.preventDefault(); this.moveSelectionHorizontally('right'); break;
        case 'ArrowDown':   e.preventDefault(); this.moveSelectionVertically('down'); break;
      }
    });

    document.addEventListener('keyup', (e) => {
      switch(e.key) {
        case 'Shift':   if(this.state.holdingShift) this.setState({ holdingShift: false }); break;
        case 'Control': if(this.state.holdingCtrl) this.setState({ holdingCtrl: false }); break;
      }      
    });
  }



  /* Hotkey functions */

  // When the user has pressed a hotkey that is not quickly followed up with another hotkey, this function is called.
  // Apply the corresponding entity class and reset the hotkey chain.
  hotkeyTimeout() {
    var hotkeyChainStr = this.state.hotkeyChain.join('');
    this.applyTag(this.state.reverseHotkeyMap[hotkeyChainStr]);

    // Clear the existing hotkey timeout fn.
    window.clearTimeout(this.state.hotkeyTimeoutFn);
    this.setState({
      hotkeyTimeoutFn: null,      
      hotkeyChain: [],
    })
  }

  // This function is called when a hotkey is pressed.
  // If a hotkey was pressed previously within 250ms, the chain will grow until the point the user no longer presses a hotkey
  // for 250ms.
  bindHotkeys(e, hotkeyMap) {
    if(e.keyCode < 49 || e.keyCode > 57) return; // Hotkeys are in the range 1-9, which are keyCode 49-57.
    var key = e.keyCode - 48;

    // Update the hotkey chain to include the key that was pressed
    var hotkeyChain = Array.prototype.concat(this.state.hotkeyChain, key);
    this.setState({
      hotkeyChain: hotkeyChain
    }, () => {
      // Remove the previous timeout and set up a new one
      window.clearTimeout(this.state.hotkeyTimeoutFn);      
      var hotkeyTimeoutFn = window.setTimeout(() => this.hotkeyTimeout(), 250);

      this.setState({
        hotkeyTimeoutFn: hotkeyTimeoutFn
      });
    });
  }

  // Assign keybinds to each of the hotkeys in the hotkey map.
  setupHotkeyKeybinds() {
    
    console.log("Setting up hotkey keybinds...")

    // Clear the current hotkey binding function and set up a new one.
    document.removeEventListener('keydown', this.state.hotkeyBindingFn);
    var hotkeyBindingFn = (e) => this.bindHotkeys(e, this.state.hotkeyMap);

    document.addEventListener('keydown', hotkeyBindingFn);

    // Store the binding function in this.state so that it can be removed in subsequent calls of this function.
    this.setState({
      hotkeyBindingFn: hotkeyBindingFn,
    });
  }

  // Builds the hotkey map according to the ordered category hierarchy, and saves it to this component's state.
  // The hotkey map will change whenever the user changes the order of them items via drag and drop.
  setupHotkeyMap(orderedItems, next) {

    console.log("Setting up hotkey map...")
    // Annoying that is a recursive function but I think it's the only way to do it.
    // The result is a hotkeyMap as follows:
    /*  {
          'item': [1],
          'item/pump': [1, 1],
          'item/pump/centrifugal_pump': [1, 1, 1],
          'item/pump/big_pump': [1, 1, 2],
          'item/compressor': [1, 2],
          'activity': [2]
        }
    */
    function traverseChild(child, index, hotkeyMap, hotkeys, firstPass) {
      if(!firstPass) {
        hotkeyMap[child.full_name] = hotkeys;
      }
      if(child.children) {
        for(var i = 0; i < Math.min(9, child.children.length); i++) { // Don't go past index 9 so that the hotkeys make sense
          traverseChild(child.children[i], i + 1, hotkeyMap, Array.prototype.concat(hotkeys, i + 1));
        }
      }
      return hotkeyMap;          
    }
    

    // Build the reverse of the hotkeyMap, i.e. swap the keys with the values.
    // This assists with the hotkey bindings function.
    function buildReverseHotkeyMap(hotkeyMap) {
      var reverseHotkeyMap = {};
      for(var key in hotkeyMap){
        var val = hotkeyMap[key].join('');
        reverseHotkeyMap[val] = key;
      }
      return reverseHotkeyMap;    
    }


    var hotkeyMap = traverseChild({children: orderedItems}, 1, [], [], true);
    var reverseHotkeyMap = buildReverseHotkeyMap(hotkeyMap);

    this.setState({
      hotkeyMap: hotkeyMap,
      reverseHotkeyMap: reverseHotkeyMap
    }, () => { this.setupHotkeyKeybinds(); if(next) next(); });
  }


  /* Miscellaneous */

  // Justify the words to the nearest 25px (i.e. round their width up to the nearest 25px).
  // Not really necessary but makes the diagonal stripey lines line up properly when multiple tokens are selected.
  // I spent about 2 hours trying to figure out how to get the stripey lines to line up properly, this is the result :D
  justifyWords() {
    $('.word-inner').each((i, ele) => {
      var width = ele.offsetWidth;
      var newWidth = Math.ceil(width / 25) * 25;
      $(ele).css('min-width', newWidth + 'px');
    });
  }

  /* Mounting function */

  // When this component is mounted, call the API.
  // Set up the keybinds and mouseup event when done.
  componentWillMount() {

    const fetchConfig = {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      };

    var pid = 'oekGXtMzK';

    fetch('http://localhost:3000/projects/' + pid + '/tagging/getDocumentGroup', fetchConfig) // TODO: move localhost out
      .then(response => response.text())
      .then((data) => {         
        var d = JSON.parse(data);
        this.setState(
          {
            data: d,
            selections: this.getEmptySelectionsArray(d.documentGroup.length)
          }, () => { 
            console.log("Data:", this.state.data);
            this.setupKeybinds();
            this.setupMouseEvents();
            this.setupHotkeyMap(this.state.data.categoryHierarchy.children);
            this.justifyWords(); })
      });
  }  

  /* Selection functions */

  // Get an empty current selection.
  getEmptyCurrentSelection() {
    return {
      wordStartIndex: -1,
      wordEndIndex: -1,
      sentenceIndex: -1
    }
  }

  // Move the selection up or down.
  // This function should be called when one of those keys is pressed.
  moveSelectionVertically(direction) {
    console.log("Moving", direction) // TODO: Make this move up and down
  }

  // Move the selection in the specified direction ('left', 'right').
  // This function should be called when one of those keys is pressed.
  moveSelectionHorizontally(direction) {
    console.log("Moving", direction)

    var shift = direction === "left" ? -1 : 1;
    var selections = this.state.selections;


    // Move left or right
    for(var i = 0; i < selections.length; i++) {
      for(var j = 0; j < selections[i].length; j++) {
        var selection = selections[i][j];

        if(direction === "left") {
          if(!this.state.holdingShift) {
            selection.wordStartIndex = Math.max(selection.wordStartIndex - 1, 0);
            selection.wordEndIndex = selection.wordStartIndex;
          } else {
            if(selection.wordEndIndex > selection.wordStartIndex) {
              selection.wordEndIndex--;
            } else {
              selection.wordStartIndex = Math.max(selection.wordStartIndex - 1, 0);
            }
          }
        } else if (direction === "right") {
          if(!this.state.holdingShift) {
            selection.wordStartIndex = Math.min(this.state.data.documentGroup[i].length - 1, selection.wordEndIndex + 1);
          }
          selection.wordEndIndex   = Math.min(this.state.data.documentGroup[i].length - 1, selection.wordEndIndex + 1);
        }
      }
    }

    console.log(selections);
    this.setState({
      selections: selections
    });
  }

  // Get an empty selections array whose length is the number of docs in this documentGroup.
  getEmptySelectionsArray(numDocs) {
    if(!numDocs) {
      var numDocs = this.state.data.documentGroup.length;
    }
    var selections = new Array(numDocs);
    for(var i = 0; i < selections.length; i++) {
      selections[i] = new Array();
    }
    return selections;
  }

  

  // Clear all active selections by resetting the selections array.
  clearSelections() {
    this.setState( {
      currentSelection: this.getEmptyCurrentSelection(),
      selections: this.getEmptySelectionsArray()
    });
  }

  // Update this component's selections state.
  // sentenceIndex: The index of the sentence in which the selection was made.
  // wordIndex: the index of the word that was clicked on, or hovered over and the mouse released.
  // action: Whether the mouse was pressed down ('down') or released ('up').
  updateSelections(sentenceIndex, wordIndex, action) {
    var wordStartIndex, wordEndIndex;

    var selections = this.state.selections;
    var currentSelection = this.state.currentSelection;


    if (action === "down") { // Mouse down, i.e. a word was clicked.

      if(!this.state.holdingCtrl) {
        selections = this.getEmptySelectionsArray(); // Reset all selections upon clicking a word, unless Ctrl is being held.
      }
      wordStartIndex = wordIndex;
      wordEndIndex = -1;

      currentSelection = {
        sentenceIndex: sentenceIndex,
        wordStartIndex: wordStartIndex,
        wordEndIndex: wordEndIndex
      }      

    } else if(action === "up") { // Mouse up, i.e. mouse was released when hovering over a word.

      console.log(currentSelection, sentenceIndex, wordIndex);

      // Only allow selections where the user has clicked on a starting word.
      if(currentSelection.wordStartIndex === -1) {
        this.clearSelections();
        return;
      }

      wordStartIndex = currentSelection.wordStartIndex;

      // If the first word selected was in a different sentence, the wordStartIndex becomes the start of the sentence where the mouse was released.
      if(currentSelection.sentenceIndex !== sentenceIndex) { 
        wordStartIndex = 0;
      };

      wordEndIndex = wordIndex;

      // If the second word selected was before the first, swapperino them around (so that backwards selections work as expected).
      if(wordIndex < wordStartIndex) {
        var s = wordStartIndex;
        wordStartIndex = wordIndex;
        wordEndIndex = s;
      }     

      currentSelection = this.getEmptyCurrentSelection();
      selections[sentenceIndex].push({
        wordStartIndex: wordStartIndex,
        wordEndIndex: wordEndIndex
      });

      clearWindowSelection(); // Remove the default browser selection highlighty thing.
    }    

    this.setState({
      currentSelection: currentSelection,
      selections: selections
    });
  }


  /* Tag application function */

  // Apply a specific tag to all current selections.
  // entityClass: The full name of the entity class, e.g. 'item/pump/centrifugal_pump'.
  // This function can be either called via clicking on an entity class in the tree, or by using hotkeys.
  applyTag(entityClass) {
    console.log("Applying tag:", entityClass);
  }

  /* Rendering function */

  render() {
    return (
      <div id="tagging-interface">
        <div id="tagging-container">
          <div id="sentence-tagging">
            { this.state.data.documentGroup.map((doc, i) => 
              <Sentence 
                key={i}
                index={i}
                words={doc}
                // selection={ { wordStartIndex: i === this.state.selection.sentenceIndex ? this.state.selection.wordStartIndex : -1,
                //               wordEndIndex:   i === this.state.selection.sentenceIndex ? this.state.selection.wordEndIndex : -1 }
                // }
                selections={this.state.selections[i]}
                // selected={i === this.state.selection.sentenceIndex}
                updateSelections={this.updateSelections.bind(this)}
                //updateSelectedSentence={this.updateSelectedSentence.bind(this)}
            />)}
          </div>



        </div>
        <div id="tagging-menu">
          <div className="category-hierarchy">
            <div className="tokens-info">Hello I am wikipedia</div>
            <div id="modify-hierarchy-container">Modify hierarchy container</div>
            <div id="category-hierarchy-tree">
              <CategoryHierarchy
                items={this.state.data.categoryHierarchy.children}
                hotkeyMap={this.state.hotkeyMap}
                setupHotkeyMap={this.setupHotkeyMap.bind(this)}
              />

            </div>


          </div>
        </div>
      </div>
    )
  }
}

function App() {
  return (
    <div id="app">
      <Navbar/>  
      




      <TaggingInterface/>
        
    
                
      
      
    </div>
  );
}


export default App;
