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
        onMouseDown={() => this.props.wordMouseDown(this.props.index, this.props.text)}
        onMouseUp=  {() => this.props.wordMouseUp(this.props.index, this.props.text)}>
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
    this.state = {
      selectionStart: -1,
      selectionEnd: -1,
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(prevProps.selected != this.props.selected && !this.props.selected) {
      this.clearSelection();
    }
  }

  clearSelection() {
    this.setState({
      selectionStart: -1,
      selectionEnd: -1,
    })
  }

  wordMouseDown(index, word) {
    console.log("mouse down:", word, index);
    this.setState({
      selectionEnd: -1,
      selectionStart: index
    }, () => this.props.updateSelectedSentence(this.props.index));
    // }, () => {
    //   window.addEventListener('mouseup', () => {
    //     this.setState({
    //       selectionStart: -1,
    //       selectionEnd: -1,
    //     })
    //   })
    // })
  }

  wordMouseUp(index, word) {
    console.log("mouse up:", word, index);
    clearWindowSelection();
    this.setState({
      selectionEnd: index
    }, () => {    
      this.props.updateSelectedSentence(this.props.index)  
      console.log(this.state.selectionStart, this.state.selectionEnd, '<<<')
    });

  }

  render() {
    return (
      <div className="sentence" data-ind={this.props.index} data-ind1={this.props.index + 1}>
        { this.props.words.map((word, i) => 
          <Word key={i}
                index={i}
                text={word}
                selected={this.state.selectionEnd >= 0 && (this.state.selectionEnd >= i && i >= this.state.selectionStart )}
                wordMouseDown={this.wordMouseDown.bind(this)}
                wordMouseUp={this.wordMouseUp.bind(this)}
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
      selectedSentenceIndex: -1,
      data: {documentGroup: []}
    }
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
        this.setState({data: JSON.parse(data)}, () => { console.log(this.state.data) })
      });
  }

  updateSelectedSentence(index) {
    this.setState({
      selectedSentenceIndex: index,
    })
  }

  render() {

    console.log(this.state.selectedSentenceIndex, ">>xx<<")

    return (
      <div id="tagging-container">
        <div id="sentence-tagging">
          { this.state.data.documentGroup.map((doc, i) => <Sentence key={i} index={i} words={doc} selected={i === this.state.selectedSentenceIndex} updateSelectedSentence={this.updateSelectedSentence.bind(this)}/>)}
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
