import React from 'react';

import {Component} from 'react';
import $ from 'jquery';
import { findDOMNode } from 'react-dom';
import { Link } from 'react-router-dom'

//const ReactDragListView = require('react-drag-listview');

import _ from 'underscore';

import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import domtoimage from 'dom-to-image';

import CategoryHierarchy from 'views/SharedComponents/CategoryHierarchy';
import {Word, Sentence} from 'views/TaggingInterfaceView/documentComponents';

import {Comment, CommentInput} from '../views/SharedComponents/Comment';
import ControlBar from 'views/SharedComponents/ControlBar';

import getCookie from 'functions/getCookie';

import formatDate  from 'functions/formatDate';

import initAnnotationsArray from 'views/TaggingInterfaceView/initAnnotationsArray';
import Annotation from 'views/TaggingInterfaceView/Annotation';
import Error403Page from 'views/Errors/Error403Page';
import Error404Page from 'views/Errors/Error404Page';


const BASE_URL = "/"

// Config for all API fetch requests
const fetchConfigGET = {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};


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









// A single confidence button, which may have the value 'low' 'medium' or 'high'.
class ConfidenceButton extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    var docIdx = this.props.docIdx;
    var value = this.props.value;
    return (
      <span className={"confidence-button conf-" + value + (this.props.checked ? " checked" : "")}
            onClick={() => this.props.updateConfidence(docIdx, value)} title={"Assign a " + value + " confidence to this document."} ></span>
    )
  }
}


class ConfidenceButtons extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className={"confidence-buttons"}>
        <ConfidenceButton value="low"    checked={this.props.confidence === "low"} { ...this.props }/>
        <ConfidenceButton value="medium" checked={this.props.confidence === "medium"} { ...this.props }/>
        <ConfidenceButton value="high"   checked={this.props.confidence === "high"} { ...this.props }/>        
      </div>
    )
  }
}


// The document container header, which appears at the top of the sentence tagging page.
class DocumentContainerHeader extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div className="document-container header">
        <div className="document header">
          <div className="sentence-index"></div>
          <div className="sentence">Document</div>
          <div className="confidence-buttons">Confidence</div>
        </div>
      </div>
    )
  }
}

// A document container, which contains the sentence index (on the left), the sentence, and the confidence buttons.
class DocumentContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      commentsOpen: false,
      // windowMouseDownFn: null,
    }
    this.sentenceRef = React.createRef();
    this.documentUnderneathRef = React.createRef(); // The reference for the grey area underneath the doc
    this.commentBoxRef = React.createRef();
  }


  // Close the comment box when changing doc groups.
  componentDidUpdate(prevProps, prevState) {
    if(!_.isEqual(prevProps.words, this.props.words) && this.state.commentsOpen) {
      this.setState({
        commentsOpen: false,
      })
    }
  }

  // closeCommentBox(e) {
  //   if(this.documentUnderneathRef.current && this.documentUnderneathRef.current.contains(e.target)) return;
  //   this.setState({
  //     commentsOpen: false,
  //   })
  // }

  // Opens or closes the comments.
  // Binds the mouse down function on the window if opening the comment box.
  toggleOpenComments() {


    // var windowMouseDownFn = (e) => this.closeCommentBox(e);
    
    // Remove the old event listeners.
    // window.removeEventListener('mousedown', this.state.windowMouseDownFn);
    // window.addEventListener('mousedown', windowMouseDownFn);

    this.setState({
      // windowMouseDownFn: windowMouseDownFn,
      commentsOpen: !this.state.commentsOpen,
    }, () => {
    });
  }

  // Saves this sentence to a PNG file. wow!
  saveToPng() {
    var t = this;
    var node = this.sentenceRef.current;

    function filter(node) {
      if(node.classList) {
        return !node.classList.contains('sentence-index') && !node.classList.contains('confidence-buttons');
      }
      return node;
    }

    domtoimage.toBlob(node, {bgcolor: '#fefefe'})
    .then(function(blob) {
      saveAs(blob, "document-" + t.props.index + ".png"); 
    });

  }

  submitComment(message, next) {
    var t = this;
    this.props.submitComment(message, this.props.index, () => {
      next();
      t.commentBoxRef.current.scrollTop = t.commentBoxRef.current.scrollHeight;
    });
  }

  render() {



    return (
      <div className={"document-container" + (this.props.confidence ? " conf conf-" + this.props.confidence : "")}>

        <div className="document-wrapper">
          <div className="document">
            <div className="sentence-index"><span className="inner">{this.props.displayIndex}</span></div>
            <div className="sentence" ref={this.sentenceRef}>
              <Sentence 
                index={this.props.index}
                words={this.props.words}              
                annotations={this.props.annotations}  
                selections={this.props.selections}
                updateSelections={this.props.updateSelections}
                entityColourMap={this.props.entityColourMap}
                deleteTag={this.props.deleteTag}
              />
            </div>
            <ConfidenceButtons docIdx={this.props.index} confidence={this.props.confidence} updateConfidence={this.props.updateConfidence}/>
          </div>



          <div className={"document document-underneath" + (this.state.commentsOpen ? " open" : "")} ref={this.documentUnderneathRef}>
            <div className="sentence-index"></div>
            <div className="sentence">

              <div className="bottom-buttons">
            
            
                <div className={"open-comments-button" + (this.props.comments.length > 0 ? " has-comment" : "")}>
                  <span className="inner" onClick={this.toggleOpenComments.bind(this)}>
                    <i className="fa fa-comment"></i>
                    <span className="num-comments">{this.props.comments.length}</span>
                  </span>            
                </div> 

                <div className="save-to-png" onClick={this.saveToPng.bind(this)} title="Click to download a .png file of this document"><span className="inner"><i className="fa fa-download"></i></span>
                </div>     
              </div>



              { this.props.user && 
                <div className="comments-wrapper">
                  <div className="comments-inner">
                    <div className="comments-even-more-inner" ref={this.commentBoxRef}>
                      { this.props.comments.map((comment, i) => <Comment index={i} {...comment} hideDocumentString={true} />) }
                    </div>
                    <CommentInput user_profile_icon={this.props.user.profile_icon} submitComment={this.submitComment.bind(this)}/>

                  </div>
                </div>
              }
            </div>
            <div className="confidence-buttons"></div>

          </div>



        </div>
      </div>
    )
  }

}




// A simple function for traversing a list of nodes. Goes with the function below.
// Both functions found on StackOverflow: https://stackoverflow.com/questions/7781963/js-get-array-of-all-selected-nodes-in-contenteditable-div
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

// A function for traversing the nodes present in the range object, which allows us to determine all html nodes
// corresponding to selected items (items in which part of them are highlighted).
// Note that you can't see the highlighted text on the screen because it has been hidden by css.
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


// A simple class for displaying information related to the hotkeys the user is currently pressing.
class HotkeyInfo extends Component {
  constructor(props) {
    super(props);
  }

  render() {

    var ec = this.props.entityClass;
    if(ec === undefined) {
      ec = '(not a valid class)';
    }

    return (
      <div className={"hotkey-info" + (this.props.chain.length === 0 ? " hidden": "")}>
        <span className="chain">{this.props.chain}</span>: <span>{ec}</span>
      </div>
    )

  }
}



// A debug printing function for printing out a list of annotations for a document.
function prettyPrintAnnotations(documentAnnotations) {
  console.log("Annotations:\n")
  console.log("=====================")  
  for(var token_idx in documentAnnotations) {
    documentAnnotations[token_idx].prettyPrint();
  }
}

// The Wikipedia summary container, at the top-left.
class WikipediaSummary extends Component {

  _isMounted = false;

  constructor(props) {
    super(props);
    this.state = {
      visible: true,
      querying: false, // Currently in the middle of a query
      wikipediaSummary: null,
      wikipediaReadMoreUrl: null,
    }

  }


  queryWikipedia() {
    if(this.state.querying) return; // Don't query multiple things at once

    var tokens = this.props.tokens;

    // Query Wikipedia for the currently selected tokens.
    function runQuery(next) {

      // Processes the result of a Wikipedia query.
      function getResult(data, next) {
        function stripTags(str) {
          return str.replace(/<\/?[^>]+(>|$)/g, "");
        }
        try {
          var title = data.query.search[0].title;
          var snippet = stripTags(data.query.search[0].snippet);
          var wurl = "https://en.wikipedia.org/wiki/" + data.query.search[0].title.replace(/ /g, '_');
          return next(title, snippet, wurl);
        } catch(err) {
          next();
        }
      }
      $.ajax({
        url: 'https://en.wikipedia.org/w/api.php',
        data: { action: 'query', list: 'search', srsearch: tokens, format: 'json' },
        dataType: 'jsonp',
        success: function(data) {
          getResult(data, next);
        }
      });
    } 

    this.setState({
      querying: true
    }, () => {
      var wikipediaSummary, wikipediaReadMoreUrl;
      var t = this;

      runQuery(function(title, snippet, wurl) {
        if(!t._isMounted) return;


        var wikipediaTitle = tokens;
        if(snippet) {        
          if(title.toLowerCase() !== tokens.toLowerCase()) {
            wikipediaTitle = title;
          }
          wikipediaSummary = snippet + "...";
          wikipediaReadMoreUrl = wurl;
        } else {
          wikipediaReadMoreUrl = null;
          wikipediaSummary = null;  
        }      

        t.setState({
          wikipediaTitle: wikipediaTitle,
          wikipediaSummary: wikipediaSummary,
          wikipediaReadMoreUrl: wikipediaReadMoreUrl,
          querying: false,
        })  
      });

    });
  }


  // Ensure API calls to Wikipedia aren't being made while this component is not mounted.
  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  toggleVisibility() {
    this.setState({
      visible: !this.state.visible
    })
  }


  componentDidUpdate(prevProps, prevState) {
    if(prevProps.tokens !== this.props.tokens) {
      this.queryWikipedia();
    }
  }

  render() {    

    if(!this.state.querying && this.state.wikipediaTitle && this.state.wikipediaTitle !== this.props.tokens) {
      var title = <span className="different">[{this.state.wikipediaTitle}] </span>
    } else {
      title = '';
    }

    var summary = this.state.wikipediaSummary ? this.state.wikipediaSummary : "(no Wikipedia entry)";
    if(!this.props.tokens) {
      summary = "Select one or more words to automatically look them up on Wikipedia.";
    }
    if(this.state.querying) {
      summary = <span><i className="fa fa-spin fa-cog"></i>&nbsp;&nbsp;Loading...</span>
    }

    // Rendering is a bit awkward, this could be tidied up
    return (
      <div className="tokens-info">
        <div id="wikipedia-summary-container" className={this.state.visible ? "show" : "hidden"}>
          <p className="tokens">{this.props.tokens || 'Wikipedia lookup'}</p>
          <p className="summary">{ title }{ summary }</p>
          <span className="more show">
            {(this.state.querying || !this.props.tokens) && <span className="left" style={{"color": "rgba(0, 0, 0, 0)"}}>.</span>}
            {!this.state.querying && this.props.tokens && <span className="left">Results from Wikipedia</span>}
            <span className="right">
              { !this.state.querying && this.props.tokens && <a id="ec-read-more" href={this.state.wikipediaReadMoreUrl} target="_blank">Read more <i className="fa fa-sm fa-external-link"></i></a> } 
            </span>
          </span>
        </div>
        <button id="wikipedia-hide-show" className={this.state.visible ? "up" : "down"} onClick={this.toggleVisibility.bind(this)}>Show</button>
      </div>
    )
  }
}

// The TaggingInterface class. Contains the vast majority of the logic for the interface.
class TaggingInterfaceView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // Data (from the server)
      // The data in this object is only changed by calling the queryAPI method.
      // data: {
      //   documentGroup: [],
      //   documentIds:   [],
      //   categoryHierarchy: {'children': []},
      //   pageNumber: -1,
      //   annotatedDocGroups: -1,
      //   username: "",
      // },

      documentGroupAnnotationId: null, // The ID of the document group annotation object related to the document group the user is currently
                                       // looking at. Will be null if the doc group has not been annotated by the user yet.
                                       // Will be set when querying the API (for a previously annotated document group) or when
                                       // submitting the annotations of a document group via submitAnnotations().


      documents:   [],    // Stores the current documents
      documentIds: [],    // Stores the Mongo IDs of the current documents,

      documentAnnotationIds: [],    // Stores the Mongo IDs of the current document annotations (if they exist already)

      categoryHierarchy: {'children': []},  // Stores the category hierarchy



      annotations: [],  // Stores the user's annotations.
      confidences: [],  // Stores the user's confidences.
      comments:    [],  // Stores the comments (made by any user)


      

      // Selections
      selections: this.getEmptySelectionsArray(10),       // The selections is an array containing a sub-array for each document,
                                                          // which in turn hold all of the current selections made by the user for that
                                                          // document.
      currentSelection: this.getEmptyCurrentSelection(),  // The current selection is for when the user clicks a word and is in the process
                                                          // of selecting an end word. 
      mostRecentSelectionText: null, // Keeps track of the tokens that the user most recently selected (for Wikipedia querying)
      // Hotkeys
      hotkeyMap: {},  // Stores a mapping of hotkey to number, e.g. 'item/pump': '11'.
      reverseHotkeyMap: {}, // Stores the reverse of the above (number to hotkey), e.g. '11': 'item/pump'.
      terminalHotkeys: new Set(),  // Stores the hotkeys of classes that are terminal, e.g. '1', '2' because Item and Activity do not have subclasses

      hotkeyChain: [], // Stores the current hotkey chain, e.g. [1, 2, 3] = the user has pressed 1, then 2, then 3 in quick succession
      hotkeyBindingFn: null,  // Stores the function that gets called via an eventlistener when a hotkey is pressed. Must be stored as a state
                              // variable so that it can be detached when the hotkeys change.
      hotkeyTimeoutFn: null,   // Stores the current hotkey timeout function.

      // Key events
      holdingCtrl: false, // Whether the user is currently holding the ctrl key.
      holdingShift: false, // Whether the user is currently holding the shift key.

      entityColourMap: {}, // A mapping of the top-level entity classes to a colour

      docGroupLastModified: null, // Stores when the current document group was last saved.

      pageNumber: -1, // The current page number the user is looking at.
      totalPagesAvailable: -1, // The total number of pages available to the user, e.g. if they have annotated 1 group so far, then it's 2.

      changesMade: false, // Stores whether the user has made any changes to the current document group.
      recentlySaved: false, // Whether the doc group has been recently saved

      selectionChangeFn: null,
      windowMouseUpFn: null,

      loading: {  // Stores whether this interface is currently requesting a docgroup from the server, or saving one
        querying: true,
        saving: false,
        firstLoad: true,
      },
      showingProgressBar: false, // Whether the progress bar is currently visible

      searchTerm: null, // Whether the user is currently searching for docs

      docsPerPage: 10, // The number of docs per page, can be changed by the user

      taggingCompletePage: false, // Set to true when the user is on the 'tagging complete' page.

    }    
  }



  // When the user highlights text anywhere on the page, this function captures the event.
  // If the user never selected a word to begin with, nothing happens.
  // All it does is apply the 'highlighted' class onto any words that were caught in the highlighting.
  // This function is purely stylistic, i.e. it doesn't affect any other components etc.
  selectionChange(e, words) {
    if(this.state.currentSelection.wordStartIndex < 0) {
      return;
    }
    var sel = window.getSelection && window.getSelection();

    if (sel && sel.rangeCount > 0) {
      var r =  getRangeSelectedNodes(sel.getRangeAt(0));  
      words.removeClass('highlighted');
      $(r).find('.word-inner').addClass('highlighted');  
    }
  }

  // When the user releases the mouse, remove all highlighting from words (i.e. the words in the selection).
  // If the user never selected a word to begin with (i.e. wordStartIndex < 0), don't do anything.
  windowMouseUp(e, words) {
    if(e.target.classList.contains('page-input') || e.target.classList.contains('comment-input') || e.target.classList.contains('search-bar')) return;

    words.removeClass('highlighted');
    if(this.state.currentSelection.wordStartIndex < 0) {
      //clearWindowSelection();
      return;
    }
    if(!e.target.classList.contains('word-inner')) { // Ensure that the user is not hovering over a word            
      var sentenceIndex = this.state.currentSelection.sentenceIndex;
      this.updateSelections(sentenceIndex, this.state.documents[sentenceIndex].length - 1, 'up');
    } 
  }

  /* Mouse and keyboard events */

  // Set up some mouse events - one for when text is selected (highlighted) in the browser.
  // Note that in order to see the default browser highlighting the CSS file needs to be modified (it makes it invisible).
  // Another for when the user releases the mouse anywhere on the page.
  // Note that the majority of the mouse events are not in this function but are passed down to the Word elements via updateSelections.
  // The event listeners need to be removed and reapplied to prevent duplication.
  initMouseEvents() {

    var words = $('.word-inner');

    var selectionChangeFn = (e) => this.selectionChange(e, words);
    var windowMouseUpFn = (e) => this.windowMouseUp(e, words);
    
    // Remove the old event listeners.
    document.removeEventListener("selectionchange", this.state.selectionChangeFn);   
    window.removeEventListener('mouseup', this.state.windowMouseUpFn);

    this.setState({
      selectionChangeFn: selectionChangeFn,
      windowMouseUpFn: windowMouseUpFn
    }, () => {
      // Add the new event listeners.
      document.addEventListener("selectionchange", this.state.selectionChangeFn);
      window.addEventListener('mouseup', this.state.windowMouseUpFn);
    });    
  }

  // Set up the key binds (ctrl, shift, left right up down etc).
  // This function does not set up the hotkeys (that is done via setupHotkeyKeybinds)
  initKeybinds() {

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

    var entityClass = this.state.reverseHotkeyMap[hotkeyChainStr];
    if(entityClass !== undefined) this.applyTag(entityClass);

    // Clear the existing hotkey timeout fn.
    window.clearTimeout(this.state.hotkeyTimeoutFn);
    this.setState({
      hotkeyTimeoutFn: null,      
      hotkeyChain: [],
    })
  }

  // This function is called when a hotkey is pressed.
  // If a hotkey was pressed previously within 333ms, the chain will grow until the point the user no longer presses a hotkey
  // for 333ms.
  bindHotkeys(e, hotkeyMap) {
    if(e.keyCode < 49 || e.keyCode > 57) return; // Hotkeys are in the range 1-9, which are keyCode 49-57.
    var key = e.keyCode - 48;

    // If user is currently focused on the page input, do nothing.
    if($("#page-input").is(":focus")) return;
    if($("textarea").is(":focus")) return;

    // Update the hotkey chain to include the key that was pressed
    var hotkeyChain = Array.prototype.concat(this.state.hotkeyChain, key);
    this.setState({
      hotkeyChain: hotkeyChain
    }, () => {

      // Remove the previous timeout and set up a new one
      window.clearTimeout(this.state.hotkeyTimeoutFn);



      // Check if hotkey was terminal, i.e. at the leaf of the tree
      if(this.state.terminalHotkeys.has(hotkeyChain.join(''))) {
        this.hotkeyTimeout();
      } else {
        var hotkeyTimeoutFn = window.setTimeout(() => this.hotkeyTimeout(), 333);
        this.setState({
          hotkeyTimeoutFn: hotkeyTimeoutFn
        });
      }

            
      
    });
  }

  // Assign keybinds to each of the hotkeys in the hotkey map.
  setupHotkeyKeybinds() {
    
    console.log("Setting up hotkey keybinds...")

    console.log(this.state.reverseHotkeyMap);

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
  initHotkeyMap(orderedItems, next) {

    console.log("Setting up hotkey map...")
    // Annoying that the following is a recursive function but I think it's the only way to do it.
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
    function traverseChild(child, index, hotkeyMap, hotkeys, terminalHotkeys, firstPass) {
      if(!firstPass) {
        hotkeyMap[child.full_name] = hotkeys;
      }
      if(child.children) {
        for(var i = 0; i < Math.min(9, child.children.length); i++) { // Don't go past index 9 so that the hotkeys make sense
          traverseChild(child.children[i], i + 1, hotkeyMap, Array.prototype.concat(hotkeys, i + 1), terminalHotkeys);
        }
      } else {
        terminalHotkeys.add(hotkeys.join(''));
      }
      return {hotkeyMap: hotkeyMap, terminalHotkeys: terminalHotkeys};          
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


    var d = traverseChild({children: orderedItems}, 1, [], [], new Set(), true);
    var hotkeyMap = d.hotkeyMap;
    var terminalHotkeys = d.terminalHotkeys;
    var reverseHotkeyMap = buildReverseHotkeyMap(hotkeyMap);

    // Once the hotkeyMap (and reverseHotkeyMap) has been created, set up the hotkey keybinds and call the callback fn.
    this.setState({
      hotkeyMap: hotkeyMap,
      reverseHotkeyMap: reverseHotkeyMap,
      terminalHotkeys: terminalHotkeys,
    }, () => { this.setupHotkeyKeybinds(); if(next) next(); });
  }


  

  // Initialise the confidences array.
  initConfidencesArray(documents) {
    var confidences = new Array(documents.length);
    return confidences;
  }

  // Initialise the entity colour map, which maps entity_class: colour_index, e.g. "Item": 1. Passed to the Word components to colour
  // their labels accordingly.
  initEntityColourMap(categoryHierarchy) {
    var entityColourMap = {}
    for(var ec_idx in categoryHierarchy) {
      var entityClass = categoryHierarchy[ec_idx];
      entityColourMap[entityClass.name] = entityClass.colorId + 1;
    }
    return entityColourMap;
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

  // Remove min-width from words that do not have a tag
  // (necessary to call between pages)
  clearWordJustification() {
    $('.word:not(.tag) .word-inner').each((i, ele) => {
       $(ele).css('min-width', 'auto');
    })
  }

  // Load the next page by calling the API.
  // Query without a page number (i.e. request the latest group)
  // if the user is looking at the group before the latest group.
  //
  // TODO: Make it so that when the user has made a change to the group they're looking at,
  // pop up a confirmation window to confirm their changes before loading the next page?
  loadNextPage() {
    if(this.state.loading.querying) return; // Don't load new page if currently loading
    var nextPageNumber = this.state.pageNumber + 1;

    if(nextPageNumber === (this.state.totalPagesAvailable)  && !this.state.searchTerm) {
      this.queryAPI(false);
    } else {
      this.queryAPI(false, nextPageNumber);
    }
  }

  goToPage(pageNumber) {
    if(this.state.loading.querying) return; // Don't load new page if currently loading
    
    console.log(pageNumber);
    if(this.state.searchTerm) {
      this.queryAPI(false, pageNumber);
      return;
    }

    if(pageNumber === this.state.totalPagesAvailable) {
      this.queryAPI(false);
    } else {
      this.queryAPI(false, pageNumber);
    }
  }

  // Load the previous page by calling the API.
  loadPreviousPage() {
    this.queryAPI(false, this.state.pageNumber - 1);
  }

  // Search all documents for a specific search term.
  searchDocuments(searchTerm) {
    this.setState({
      searchTerm: searchTerm 
    }, () => {
      if(searchTerm) {
        this.queryAPI(false, 1);
      } else {
        this.queryAPI(false);
      }
      
    });   
  }

  setDocsPerPage(e) {

    var docsPerPage = e.target.value;
    var pageNumber = this.state.pageNumber;
    var prevDocsPerPage = this.state.docsPerPage;

    // Load the page roughly resembling the position the user is currently in by doing some maths on the page number
    var newPageNumber = Math.min(this.state.totalPagesAvailable + 1, Math.floor(pageNumber / docsPerPage * prevDocsPerPage));
    if(newPageNumber === this.state.totalPagesAvailable + 1) {
      newPageNumber = null;
    }

    this.setState({
      docsPerPage: docsPerPage,
    }, () => {
      //if(this.state.searchTerm) {
      this.queryAPI(false, newPageNumber);
      //} else {
      //  this.queryAPI(false, newPageNumber);
      //}
    })
  }

  /* API calls */

  queryAPI(firstLoad, pageNumber) {

    var route;
    var searchTerm = this.state.searchTerm;

    // If this function was called with a pageNumber, load a specific documentGroupAnnotation.
    if(pageNumber) {
      //route = 'getPreviouslyAnnotatedDocumentGroup?pageNumber=' + pageNumber + "&perPage=20";
      route = 'getDocumentGroup?pageNumber=' + pageNumber + '&perPage=' + this.state.docsPerPage;
    } else {
      route = 'getDocumentGroup?pageNumber=latest&perPage=' + this.state.docsPerPage;
    }
    if(searchTerm) {
      route += "&searchTerm=" + searchTerm;
    }



    this.setState({
      loading: {
        querying: true,
        saving: false,
        firstLoad: firstLoad,
      }
    }, function() {
      fetch('http://localhost:3000/api/projects/' + this.props.project_id + '/tagging/' + route, fetchConfigGET) // TODO: move localhost out
        .then((response) => {
            if(response.status !== 200) {
              var t = response.text();
              console.log(t);
              throw new Error(response.status); 
            }              
            return response.text()
        })
        .then((data) => {
          //console.log("data:", data);
          try { 
            var d = JSON.parse(data);
          } catch(err) {
            alert(err);
            return;
          }


          if(d.tagging_complete) {
            //console.log(d);
            this.setState({
              taggingCompletePage: true,

              pageNumber: d.pageNumber,
              totalPages: d.totalPages,
              totalPagesAvailable: d.totalPagesAvailable + 1,

              changesMade: false,
              recentlySaved: false,

              loading: {
                querying: false,
                saving: false,
              },
            })
            console.log(d)
            return;
          } 

          
          this.setState(
            {

              data: d,
              
              documents:   d.documents,
              documentIds: d.documentIds,

              documentAnnotationIds: d.documentAnnotationIds ? d.documentAnnotationIds : null, // Will only be present when querying existing annotations

              confidences: this.initConfidencesArray(d.documents),
              annotations: initAnnotationsArray(d.documents, d.automaticAnnotations),

              comments:    d.comments,

              categoryHierarchy: d.categoryHierarchy,

              entityColourMap: this.initEntityColourMap(d.categoryHierarchy.children),
              
              selections: this.getEmptySelectionsArray(d.documents.length),
              mostRecentSelectionText: null,

              pageNumber: d.pageNumber,
              totalPages: d.totalPages,
              totalPagesAvailable: d.totalPagesAvailable,

              docGroupLastModified: d.lastModified,
              documentGroupAnnotationId: d.documentGroupAnnotationId, // Will be null if this doc group has not yet been annotated

              changesMade: false,
              recentlySaved: false,
              loading: {
                querying: false,
                saving: false
              },     
              taggingCompletePage: false,         
            }, () => { 

              if(d.projectTitle && d.projectAuthor) {
                this.props.setProject(d.projectTitle, d.projectAuthor)
              }

              // Initialise keybinds and mouse events only on the first API call.
              if(firstLoad) {
                this.initKeybinds();              
                this.initHotkeyMap(this.state.categoryHierarchy.children);   
              }

              this.initMouseEvents();
              this.clearWordJustification();    
              this.justifyWords();    
              this.selectFirstWord();


              window.scrollTo(0, 0);
            })
        }).catch((err) => {
          console.log(err.message);

          this.props.setErrorCode(parseInt(err.message));

        });
        

    }.bind(this));
  }

  // Convert the annotations array into JSON.
  annotationsToJSON() {
    var annotations = this.state.annotations;
    var annotationsJSON = [];
    for(var doc_idx in annotations) {
        
      var docLabels = [];
      for(var token_idx in annotations[doc_idx]) {
        var ann = annotations[doc_idx][token_idx];
        if(ann.entityClasses) {
          docLabels.push([ann.bioTag + "-", ann.entityClasses]);
        } else {
          docLabels.push([""])
        }
      }
      annotationsJSON.push(docLabels);
    }
    return annotationsJSON;
  }


  // Submit the annotations of the document group that the user is currently looking at.
  // TODO: Maybe make it so that you can't save the annoations until the user has put all their confidences in?
  // Or perhaps do a check and pop a confirmation window up if they click save without doing anything to >= 1 document
  submitAnnotations() {
    if(this.state.recentlySaved) { return; } // If the user clicks on the green save button, provide them with the illusion that it is doing
                                             // something when in fact nothing actually happens. Prevents people from spam clicking the save and
                                             // calling the API 5000 times...
                                             // It's kind of like how google sheets allows you to press Ctrl + S despite it saving every action
                                             // automatically.

    const csrfToken = getCookie('csrf-token');

    var annotationsJSON = this.annotationsToJSON();

    const fetchConfigPOST = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'csrf-token': csrfToken,
      },
      dataType: "json",
      body: JSON.stringify({
        documentIds: this.state.documentIds,
        documentAnnotationIds: this.state.documentAnnotationIds,
        labels: annotationsJSON
      }),  
    };

    this.setState({
      loading: {
        querying: false,
        saving: true,
      }
    }, () => {

      fetch('http://localhost:3000/api/projects/' + this.props.project_id + '/tagging/submitAnnotations', fetchConfigPOST) // TODO: move localhost out
      .then((response) => {
        if(response.status !== 200) {          
          throw new Error(response.status); 
        }              
        return response.text()
      })
      .then((data) => {
        try { 
          var d = JSON.parse(data);

          var documentAnnotationIds = d.documentAnnotationIds;

          console.log("Submitted annotations OK");

          // If the user is on the last page (i.e. the 'current group'), add one to the totalPages array so that the user can
          // click 'Next' to go to the latest doc group.
          if(this.state.pageNumber === this.state.totalPagesAvailable && !this.state.searchTerm) {
            var newTotalPagesAvailable = this.state.totalPagesAvailable + 1;
            this.setState({
              showingProgressBar: true,
            }, () => {
              window.setTimeout(() => this.setState({
                showingProgressBar: false,
              }), 3000);
            })

          } else {
            var newTotalPagesAvailable = this.state.totalPagesAvailable;
          }

          this.setState({
             docGroupLastModified: Date.now(),

             totalPagesAvailable: newTotalPagesAvailable,       

             documentAnnotationIds: documentAnnotationIds,

             changesMade: false,
             recentlySaved: true,
             loading: {
              querying: false,
              saving: false
             }
          });
        } catch(err) {
          console.log("ERROR:", err);
          alert(data);
        }
        
      }).catch((err) => {
        console.log(err.message);
        this.props.setErrorCode(parseInt(err.message));
      });;
    })
  }

  /* Mounting function */

  // When this component is mounted, call the API.
  // Set up the keybinds and mouseup event when done.
  componentWillMount() {

    // var pathname = window.location.pathname;
    // var project_id = pathname.split('/')[2];
    // if(pathname === "/") {
    //   //var project_id = 'RtJp98vxk'; // React development (completed project)
    //   //var project_id = 'KPJqR4HB8'; // React development (long docs)
    //   var project_id = '-krXeW3R2'; // React development (big work order one)
    // }
    // if(!project_id || project_id.length < 8) {
    //   alert("invalid project");
    //   return;
    // }



    // this.setState({
    //   project_id: project_id
    // }, () => { 
    this.queryAPI(true);
  }  

  /* Selection functions */

  // Get an empty current selection.
  // Called when we need to clear the current selection.
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

    var selections = this.state.selections;

    var newSelections = this.getEmptySelectionsArray();

    var mostRecentSelectionText;

    
    // Move all selections in the specified direction (up or down)
    for(var i = 0; i < selections.length; i++) {
      for(var j = 0; j < selections[i].length; j++) {

        var selection = selections[i][j];
        var x;

        if(direction === "up") {     
          var x = -1;
          if(i === 0) x = 0;

        } else if (direction === "down") {          

          var x = 1;
          if(i === selections.length - 1) x = 0;
        }
        newSelections[i + x] = [{
          wordStartIndex: 0,
          wordEndIndex: 0
        }]
        mostRecentSelectionText = this.state.documents[i + x].slice(0, 1).join(' ');
      }
    }
    this.setState({
      selections: newSelections,
      mostRecentSelectionText: mostRecentSelectionText
    });
  }

  // Move the selection in the specified direction ('left', 'right').
  // This function should be called when one of those keys is pressed.
  moveSelectionHorizontally(direction) {
    console.log("Moving", direction)

    var selections = this.state.selections;
    var mostRecentSelectionText;

    // Move all selections left or right
    for(var i = 0; i < selections.length; i++) {
      for(var j = 0; j < selections[i].length; j++) {
        var selection = selections[i][j];

        // Behaviour depends on whether shift is currently being held down.
        if(direction === "left") {
          if(!this.state.holdingShift) {
            selection.wordStartIndex = Math.max(selection.wordStartIndex - 1, 0);
            selection.wordEndIndex = selection.wordStartIndex;
          } else { // If shift is being held down, move the wordEndIndex backwards or move the wordStartIndex backwards depending on the current selection.
            if(selection.wordEndIndex > selection.wordStartIndex) {
              selection.wordEndIndex--;
            } else {
              selection.wordStartIndex = Math.max(selection.wordStartIndex - 1, 0);
            }
          }
        } else if (direction === "right") {
          if(!this.state.holdingShift) { // If shift *is* being held down, this won't happen (the wordStartIndex won't change).
            selection.wordStartIndex = Math.min(this.state.documents[i].length - 1, selection.wordEndIndex + 1);
          }
          selection.wordEndIndex   = Math.min(this.state.documents[i].length - 1, selection.wordEndIndex + 1);
        }

        mostRecentSelectionText = this.state.documents[i].slice(selection.wordStartIndex, selection.wordEndIndex + 1).join(' ');
      }
    }
    this.setState({
      selections: selections,
      mostRecentSelectionText: mostRecentSelectionText
    });
  }

  // Get an empty selections array whose length is the number of docs in the current documentGroup.
  getEmptySelectionsArray(numDocs) {
    if(!numDocs) {
      var numDocs = this.state.documents.length;
    }
    var selections = new Array(numDocs);
    for(var i = 0; i < selections.length; i++) {
      selections[i] = new Array();
    }    
    return selections;
  }  

  // Select the first word in the first sentence.
  // (called when a new group is loaded).
  selectFirstWord() {
    var selections = this.state.selections;
    if(selections.length === 0) return;
    selections[0].push({
      wordStartIndex: 0,
      wordEndIndex: 0
    });
    this.setState({
      selections: selections,
      mostRecentSelectionText: this.state.documents.length > 0 ? this.state.documents[0][0] : "",
    });
  }

  // Clear all active selections by resetting the selections array.
  clearSelections() {
    this.setState( {
      currentSelection: this.getEmptyCurrentSelection(),
      selections: this.getEmptySelectionsArray()
    });
  }

  // Update this component's selections state.
  // This function is called via the mouse, and has no relation to the keyboard (keyboard selections are handled above).
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

      // A new selection is made, capturing the index of the sentence that the user clicked on and the index of the word that they clicked.
      currentSelection = {
        sentenceIndex: sentenceIndex,
        wordStartIndex: wordStartIndex
      }      

    } else if(action === "up") { // Mouse up, i.e. mouse was released when hovering over a word.

      // Only allow selections where the user has clicked on a starting word.
      if(currentSelection.wordStartIndex === -1) {
        this.clearSelections();
        return;
      }

      wordStartIndex = currentSelection.wordStartIndex;

      // If the first word selected was in a different sentence, the wordStartIndex becomes the start of the sentence where the mouse was released.
      if(currentSelection.sentenceIndex !== sentenceIndex) {  // TODO: Make this consider mouseX relative to the X of the initial token?
        wordStartIndex = 0;
      };

      wordEndIndex = wordIndex;

      // If the second word selected was before the first, swapperino them around (so that backwards selections work as expected).
      if(wordIndex < wordStartIndex) {
        var s = wordStartIndex;
        wordStartIndex = wordIndex;
        wordEndIndex = s;
      }     

      // Create a new selections json object and push it to the selections array for this sentence.
      currentSelection = this.getEmptyCurrentSelection();
      selections[sentenceIndex].push({
        wordStartIndex: wordStartIndex,
        wordEndIndex: wordEndIndex
      });
      var mostRecentSelectionText = this.state.documents[sentenceIndex].slice(wordStartIndex, wordEndIndex + 1).join(' ');

      clearWindowSelection(); // Remove the default browser selection highlighty thing.
    }    

    this.setState({
      currentSelection: currentSelection,
      selections: selections,
      mostRecentSelectionText: mostRecentSelectionText ? mostRecentSelectionText : this.state.mostRecentSelectionText,
    });
  }




  /* Tag application function */

  // Apply a specific tag to all current selections.
  // entityClass: The full name of the entity class, e.g. 'item/pump/centrifugal_pump'.
  // This function will either be called via clicking on an entity class in the tree, or by using hotkeys.
  applyTag(entityClass) {    
    //console.log("Applying tag:", entityClass);
    var selections = this.state.selections;
    var documents = this.state.documents;
    var annotations = this.state.annotations;

    for(var doc_idx in selections) {
      for(var sel_idx in selections[doc_idx]) {
        var sel = selections[doc_idx][sel_idx];
        var start = sel.wordStartIndex;
        var end = sel.wordEndIndex;


        /* 1. Disjoint spans */
        // Check all labels across this selected span of tokens are the same before proceeding.
        // If they are not, they must be cleared before adding a label.
        var annotationSpanStart = annotations[doc_idx][start].spanStartIdx;
        var annotationSpanEnd   = annotations[doc_idx][start].spanEndIdx;
        var notAllEqual = false;          
        for(var k = start + 1; k <= end; k++) {
          var otherAnnotation = annotations[doc_idx][k]; 
          if(annotationSpanStart !== otherAnnotation.spanStartIdx || annotationSpanEnd !== otherAnnotation.spanEndIdx) {
            notAllEqual = true;
            break;
          }          
        }        

        // If the labels across all tokens in the selected span are not the same, remove all labels for the entire span.
        // Then modify the spanEndIdx of any annotations in this document whose spanEndIdx was overlapping the
        // span that the user selected, setting them to be start index - 1 (before the span).
        // This ensures the ends of the spans are drawn properly.
        if(notAllEqual) {
          for(var k = start; k <= end; k++) {
            var annotation = annotations[doc_idx][k];
            annotation.removeAllLabels();
          }          
          // Adjust the span end index of all prev labels to be start index - 1
          // A shame that we have to iterate across all annotations in this document - this could probably be optimised
          // but it probably barely impacts performance even on large docs (I think)
          for(var x in annotations[doc_idx]) {
            var annotation = annotations[doc_idx][x];


            // If this new span overlaps the *end* of an existing span, change that span's end index to the start of this new
            // span, -1

            if(annotation.spanEndIdx >= start && annotation.spanStartIdx <= start) {              
              annotation.setSpanEndIdx(start - 1);

            }

            // If this new span overlaps the *start* of an existing span, change that span's start index to be the end of this new span -1
            // and change the BIO tag to "B".
            if(annotation.spanStartIdx <= end) {
              annotation.setSpanStartIdx(end + 1);              
              if(annotation.tokenIndex === (end + 1)) {
                annotation.changeBioTag("B") // I am realising now that this BIO tag is unnecessary - it could be inferred
              }
            }
          }
        }

        /* 2. Overlapping spans */
        // Check for any spans that this new span will cut into.
        // First, check to the left and adjust the spanEndIdx of all Annotation objects
        // to the left of this span if they overlap.
        for(var ann_idx in annotations[doc_idx].slice(0, start)) {
          var annotation = annotations[doc_idx][ann_idx];          
          if(annotation.spanStartIdx < start && annotation.spanEndIdx >= end) {            
            annotation.setSpanEndIdx(start - 1);
          }
        }

        // Do the same for any Annotation objects on the right hand side of this span, which are part of the same
        // mention.
        for(var ann_idx in annotations[doc_idx].slice(end + 1, annotations[doc_idx].length)) {
          var annotation = annotations[doc_idx][parseInt(ann_idx) + end + 1];
          if(annotation.spanStartIdx <= start && annotation.spanEndIdx >= end) {
            annotation.setSpanStartIdx(end + 1);
            if(ann_idx === '0') {
              annotation.changeBioTag("B");
            }
          }
        }

        /* 3. Applying the labels */
        // Now, apply the tags to every token in the selected span.
        var labelWasModified = false;
        for(var k = start; k <= end; k++) {
          var bioTag = k === start ? "B" : "I";
          var spanText = documents[doc_idx].slice(start, end + 1).join(' ');

          //var prevAnnotation = k > 0 ? annotations[doc_idx][k - 1] : null;
          //var nextAnnotation = k < (documents[doc_idx].length - 1) ? annotations[doc_idx][k + 1] : null;          

          labelWasModified = annotations[doc_idx][k].addLabel(bioTag, entityClass, spanText, start, end);

        }

        if(labelWasModified) this.captureEvent('Applied label', parseInt(doc_idx), start, end, entityClass);
      }
    }
    this.setState({
      annotations: annotations,
    }, () => {
      this.justifyWords(); // Justify the words again to ensure the stripey lines line up correctly

      // Debug:
      //prettyPrintAnnotations(this.state.annotations[0]);
      //console.log("Updated annotations[0]:", this.state.annotations[0]);
    })

  }

  // Deletes the specified tag.
  // Unlike applyTag, this is applied to a specified sentenceIndex and wordIndex rather than to all current selections.
  deleteTag(sentenceIndex, wordIndex, entityClass) {
    
    var annotations = this.state.annotations;
    var annotation = annotations[sentenceIndex][wordIndex];

    // Retrieve the span start idx and span end idx of the annotation corresponding to (sentence_index, word_index)
    var spanStart = annotation.spanStartIdx;
    var spanEnd = annotation.spanEndIdx;

    this.captureEvent('Deleted label', sentenceIndex, spanStart, spanEnd, entityClass);

    // Find all annotations in this document in the same mention span and remove the label from all of them.
    // (this will also remove the label from the annotation object at (sentence_index, word_index)).
    for(var ann_idx in annotations[sentenceIndex]) {
      var otherAnnotation = annotations[sentenceIndex][ann_idx];       
      if(otherAnnotation.spanStartIdx === spanStart && otherAnnotation.spanEndIdx === spanEnd) {
        otherAnnotation.removeLabel(entityClass);
      }
    }

    this.setState({
      annotations: annotations
    });

  }

  /* Confidence */

  // Updates the confidences array for the given doc.
  // If the user clicks on the button they already clicked, then the confidence is reset to undefined.
  updateConfidence(sentenceIndex, confidence) {
    var confidences = this.state.confidences;
    if(confidences[sentenceIndex] === confidence) {
      confidences[sentenceIndex] = undefined;
    } else {
      confidences[sentenceIndex] = confidence;
    }
    this.setState({
      confidences: confidences
    });
  }


  /* Comments */

  submitComment(message, documentIndex, next) {
    console.log("Message:", message, "Document index", documentIndex);

    const csrfToken = getCookie('csrf-token');

    const fetchConfigPOST = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'csrf-token': csrfToken,
      },
      dataType: "json",
      body: JSON.stringify({
        text: message,
        documentId: this.state.documentIds[documentIndex],
      }),  
    };

    fetch('http://localhost:3000/api/projects/' + this.props.project_id + '/comments/submit', fetchConfigPOST) // TODO: move localhost out
    .then((response) => {
        if(response.status !== 200) {
          throw new Error(response.status); 
        }              
        return response.text()
    })
    .then((data) => {
      console.log(data);
      try { 
        var d = JSON.parse(data);
        

        console.log("Submitted comment OK");

        var comments = this.state.comments;
        comments[documentIndex].push(d.comment);

        this.setState({
           comments: comments,
        }, next);
      } catch(err) {
        console.log("ERROR:", err);
      }      
    }).catch((err) => {
      console.log(err.message);

      this.props.setErrorCode(parseInt(err.message));

    });


    
  }

  /* Events */

  // Capture an event
  // TODO: Make it do something
  captureEvent(eventAction, sentenceIndex, spanStart, spanEnd, entityClass) {

    var tokenString = this.state.documents[sentenceIndex].slice(spanStart, spanEnd + 1).join(' ')

    var event = {
      "action": eventAction,
      "sentenceIndex": sentenceIndex,
      "wordIndex": {
        "start": spanStart,
        "end": spanEnd,
      },
      "entityClass": entityClass,
      "tokenString": tokenString
    }

    if(eventAction === "Applied label" || eventAction === "Deleted label") {
      this.setState({
        changesMade: true,
        recentlySaved: false,
      })
    }

  }

  /* Rendering function */


  render() {
    var taggingCompletePage = this.state.taggingCompletePage;

    //console.log(this.state.documents, taggingCompletePage);

    return (
        <div>   
          {!this.state.error &&          
          <div id="tagging-interface" className={(this.state.loading.querying ? "loading" : "") + (taggingCompletePage ? " tagging-complete-page" : "")}>

            <div id="tagging-container">
              { taggingCompletePage && <TaggingCompletePage/>}
              <div id="sentence-tagging">

                { this.state.loading.firstLoad && 
                  <div className="loading-message">
                    <i className="fa fa-cog fa-spin"></i>Loading...
                  </div>
                }

                <ControlBar
                  showingProgressBar = {this.state.showingProgressBar}
                  pageNumber = {this.state.pageNumber}
                  totalPages = {this.state.totalPages}
                  totalPagesAvailable = {this.state.totalPagesAvailable}
                  lastModified={this.state.docGroupLastModified}
                  recentlySaved={this.state.recentlySaved}
                  changesMade={this.state.changesMade}
                  querying={this.state.loading.querying}
                  saving={this.state.loading.saving}
                  inSearchMode={this.state.searchTerm}

                  showDocsPerPage={true}
                  docsPerPage={this.state.docsPerPage}
                  docsPerPageOptions={[1, 3, 5, 10, 15, 20]}

                  showSaveButton={true}

                  searchDocuments={this.searchDocuments.bind(this)}
                  submitAnnotations={this.submitAnnotations.bind(this)}
                  loadPreviousPage={this.loadPreviousPage.bind(this)}
                  loadNextPage={this.loadNextPage.bind(this)}
                  goToPage={this.goToPage.bind(this)}
                  setDocsPerPage={this.setDocsPerPage.bind(this)}
                />

                <DocumentContainerHeader/>
                    
                { this.state.documents.map((doc, i) => 
                  <DocumentContainer
                    key={i}
                    index={ i }
                    displayIndex={( (this.state.pageNumber - 1) * 10 ) + i + 1  }
                    words={doc}              
                    annotations={this.state.annotations[i]}  
                    comments={this.state.comments[i]}
                    confidence={this.state.confidences[i]}
                    selections={this.state.selections[i]}
                    updateSelections={this.updateSelections.bind(this)}
                    updateConfidence={this.updateConfidence.bind(this)}
                    entityColourMap={this.state.entityColourMap}
                    deleteTag={this.deleteTag.bind(this)}
                    submitComment={this.submitComment.bind(this)}
                    user={this.props.user}
                  />
                  )}
                  {
                    (!this.state.loading.querying && this.state.documents.length === 0 && !this.state.taggingCompletePage) && <div className="loading-message no-results-found">No results found.</div>


                  }

              </div>
            </div>
            <div id="tagging-menu">

              <div className="project-card">
                <div>
                  <div className={"project-name" + (!this.props.projectTitle ? " st" : "")} style={{'display': 'block'}}><Link to={"/projects/" + this.props.project_id + "/dashboard"}>{this.props.projectTitle ? this.props.projectTitle : "xxxxxxxx"}</Link></div>
                  <div className={"project-creator" + (!this.props.projectAuthor ? " st" : "")} style={{'display': 'block'}}>Created by <span className="creator-name">{this.props.projectAuthor ? this.props.projectAuthor : "xxxxxxxx"}</span></div>
                </div>
              </div>

              <WikipediaSummary tokens={this.state.mostRecentSelectionText}/>
              <HotkeyInfo 
                chain={this.state.hotkeyChain}
                entityClass={this.state.reverseHotkeyMap[this.state.hotkeyChain.join('')]}
              />            
              
              <CategoryHierarchy
                items={this.state.categoryHierarchy.children}
                hotkeyMap={this.state.hotkeyMap}
                hotkeyChain={this.state.hotkeyChain.join('')}
                initHotkeyMap={this.initHotkeyMap.bind(this)}
                applyTag={this.applyTag.bind(this)}        
                visible={!taggingCompletePage}      
                draggable={true}
              />
            </div>      
          </div> }
   
        </div>
       
    )
  }
}




class TaggingCompletePage extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div id="tagging-complete-message">
        <span class="tagging-complete-text">
          <h2>Annotation complete!</h2>
          <p>Thank you for your participation in this project.</p>

        </span>


      </div>
    )

  }
}

export default TaggingInterfaceView