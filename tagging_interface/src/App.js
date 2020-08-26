import React from 'react';
import logo from './favicon.png'
import './stylesheets/stylesheet.scss';
import {Component} from 'react';

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


class MainWindow extends Component {
  constructor(props) {
    super(props);
    this.state = {
      project_id: '-PE1dNzht', // debug
      selections: this.getEmptySelectionsArray(10),
      currentSelection: this.getEmptyCurrentSelection(),
      data: {documentGroup: []},

      holdingCtrl: false, // Whether the user is currently holding the ctrl key

    }
    this.setupKeybinds();
  }


  setupKeybinds() {
    document.addEventListener('keydown', (e) => {
      if(e.keyCode === 17 && !this.state.holdingCtrl) {
        this.setState({
          holdingCtrl: true
        });
      }

    });
    document.addEventListener('keyup', (e) => {
      if(e.keyCode === 17 && this.state.holdingCtrl) {
        this.setState({
          holdingCtrl: false
        });
      }
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

  componentWillMount() {

    const fetchConfig = {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      };

    fetch('http://localhost:3000/projects/zvJohtRLH/tagging/getDocumentGroup', fetchConfig) // TODO: move localhost out
      .then(response =>
        response.text())
      .then((data) => {         
        var d = JSON.parse(data);
        this.setState(
          {data: d, selections: this.getEmptySelectionsArray(d.documentGroup.length)}, () => { console.log(this.state.data) })
      });
  }

  // Clear all active selections by resetting the selections array.
  clearSelections() {
    this.setState( {
      currentSelection: this.getEmptyCurrentSelection(),
      selections: this.getEmptySelectionsArray()
    });
  }

  updateSelections(sentenceIndex, wordIndex, action) {
    var wordStartIndex, wordEndIndex;

    //var selection = this.state.selections[sentenceIndex]

    //var selections = this.getEmptySelectionsArray();

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

      console.log("Current selection:", currentSelection)


    } else if(action === "up") { // Mouse up, i.e. mouse was released when hovering over a word.

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

    console.log(this.state.selections, "||")

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
