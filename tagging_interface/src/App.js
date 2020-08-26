import React from 'react';
import logo from './favicon.png'
import './stylesheets/stylesheet.scss';
import {Component} from 'react';
import $ from 'jquery';
import awesomeCursor from 'jquery-awesome-cursor';

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





class MainWindow extends Component {
  constructor(props) {
    super(props);
    this.state = {
      project_id: '-PE1dNzht', // debug
      selections: this.getEmptySelectionsArray(10),
      currentSelection: this.getEmptyCurrentSelection(),
      data: {documentGroup: []},

      holdingCtrl: false, // Whether the user is currently holding the ctrl key
      holdingShift: false, // Whether the user is currently holding the shift key

    }    
  }


  // Sets up an event listener for mouseup so that if a user starts selecting a word, and then releases the mouse
  // when *not* hovered over another word, the selections can be updated properly.
  // The event listener will call the updateSelections method as if the last word in the sentence has been selected.
  //
  // Note that the majority of the mouse events are passed down to the Word elements via updateSelections.
  setupMouseEvents() {

    var words = $('.word-inner')

    

    document.addEventListener("selectionchange",event=>{
      if(this.state.currentSelection.wordStartIndex < 0) return;

      //var selection = document.getSelection ? document.getSelection().toString() :  document.selection.createRange().toString() ;
      var sel = window.getSelection && window.getSelection();

      if (sel && sel.rangeCount > 0) {

        

        //$('.word-inner').addClass('highlighted');

        var r =  getRangeSelectedNodes(sel.getRangeAt(0));


        
        words.removeClass('highlighted');
        $(r).addClass('highlighted');

        

      
      }
      //console.log(selection);
    })

    window.addEventListener('mouseup', (e) => {
      words.removeClass('highlighted');
      if(this.state.currentSelection.wordStartIndex < 0) return;
      if(!e.target.classList.contains('word-inner')) { // Ensure that the user is not hovering over a word            
        var sentenceIndex = this.state.currentSelection.sentenceIndex;
        this.updateSelections(sentenceIndex, this.state.data.documentGroup[sentenceIndex].length - 1, 'up');
      }        
    });
  }

  // Set up the key binds (ctrl, shift, left right up down etc).
  setupKeybinds() {

    document.addEventListener('keydown', (e) => {
      switch(e.keyCode) {
        case 16: if(!this.state.holdingShift) this.setState({ holdingShift: true }); break;
        case 17: if(!this.state.holdingCtrl) this.setState({ holdingCtrl: true }); break;
        case 37: e.preventDefault(); this.moveSelectionHorizontally('left'); break; // Call e.preventDefault() to prevent the window from scrolling
        case 38: e.preventDefault(); this.moveSelectionVertically('up'); break;
        case 39: e.preventDefault(); this.moveSelectionHorizontally('right'); break;
        case 40: e.preventDefault(); this.moveSelectionVertically('down'); break;
      }
    });

    document.addEventListener('keyup', (e) => {
      switch(e.keyCode) {
        case 16: if(this.state.holdingShift) this.setState({ holdingShift: false }); break;
        case 17: if(this.state.holdingCtrl) this.setState({ holdingCtrl: false }); break;
      }      
    });
  }


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

    fetch('http://localhost:3000/projects/zvJohtRLH/tagging/getDocumentGroup', fetchConfig) // TODO: move localhost out
      .then(response => response.text())
      .then((data) => {         
        var d = JSON.parse(data);
        this.setState(
          {
            data: d,
            selections: this.getEmptySelectionsArray(d.documentGroup.length)
          }, () => { console.log("Data:", this.state.data); this.setupKeybinds(); this.setupMouseEvents(); this.justifyWords(); })
      });
  }

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
    console.log("Moving", direction)

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

      // selections[sentenceIndex].push({  // Append a new selection object to selections[sentenceIndex].
      //   wordStartIndex: wordStartIndex,
      //   wordEndIndex: wordEndIndex;
      // })

      currentSelection = {
        sentenceIndex: sentenceIndex,
        wordStartIndex: wordStartIndex,
        wordEndIndex: wordEndIndex
      }      

      //console.log("Current selection:", currentSelection)


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

  render() {

    return (
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

    )

  }
}

function App() {
  return (
    <div id="app">
      <Navbar/>  
      <div className="tagging"></div>
      <div id="main-container">      
        
        <main id="main">  
          <MainWindow data={data}/> 
        </main>        
      </div>
      <div id="tagging-menu">
          <div className="category-hierarchy">
            <div className="tokens-info">Hello I am wikipedia</div>
            <div id="modify-hierarchy-container">Modify hierarchy container</div>
            <div id="category-hierarchy-tree">Tree</div>


          </div>
        </div>
    </div>
  );
}


export default App;
