import React from 'react';
import {Component} from 'react';
import ReactHtmlParser from 'react-html-parser';


// Returns the colour id of the given entityClass according to the entityColourMap, e.g.
// 'item/pump': 1 (because "item" is the top level category)
function getColourIdx(entityClass, entityColourMap) {
  var baseClass = entityClass.split("/").slice(0, 1)[0];
  return entityColourMap[baseClass];
}

// A label, drawn underneath a word.
class Label extends Component {
  constructor(props) {
    super(props);
  }

  render() {

    var split = this.props.entityClass.split('/');
    var truncatedLabel = split.length > 1 ? "/" : ""
    truncatedLabel = truncatedLabel + split[split.length - 1];

    return (
      <span className={"label tag-" + this.props.colourIdx} onClick={(e) => {this.props.deleteTag(this.props.entityClass);  }}><span className="label-name">{truncatedLabel}</span></span>
    )
  }
}





// A single word (or token) in the tagging interface.
class Word extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: false,
    }
    this.wordInnerRef = React.createRef();
  }

  // Calls this.props.deleteTag with the index of this word as a parameter.
  deleteTag(entityClass) {
    this.props.deleteTag(this.props.index, entityClass);
  }

  // Clear the word justification of this word if it is does not have a label.
  componentDidUpdate(prevProps, prevState) {

    /* TODO: Fix the below to be much faster.
       The code should update the width of this word back to auto if this word no longer has a label,
       but it is too slow on long docs so I took it out.
    */

    // if(this.props.entityClasses.length === 0) {

    //   var ele =  this.wordInnerRef.current;
    //   $(ele).css("min-width", "auto");

    //   var width = ele.offsetWidth;
    //   var newWidth = Math.ceil(width / 25) * 25;
    //   $(ele).css('min-width', newWidth + 'px');        

    // }
  }

  getHighlightedWord() {
    var text = this.props.text;
    var highlighting = this.props.highlighting;

    var output = '';

    for(var i = 0; i < text.length; i++) {
      if(i === highlighting[0]) {
        output += '<span class="search-highlight">'
      }
      output += text[i];
      if(i === highlighting[1]) {
        output += '</span>'
      }
    }

    //console.log(output);
    return ReactHtmlParser(output);
  }

  render() {

    var hasLabel = this.props.entityClasses.length > 0;

    var tagClass = hasLabel ? (" tag " + ((this.props.bioTag === "B") ? "tag-begin" : "") + (this.props.isLastInSpan ? " tag-end" : "")) : "";

    if(hasLabel) {
      var labels = this.props.entityClasses.map((entityClass, i) => 
                  <Label deleteTag={this.deleteTag.bind(this)} key={i} bioTag={this.props.bioTag} entityClass={entityClass} colourIdx={getColourIdx(entityClass, this.props.entityColourMap)} />
                  )
      
    } else {
      var labels = '';
    }

    var text = this.props.text;
    if(this.props.highlighting) {
      text = this.getHighlightedWord();
    }

    var wordColourClass = (hasLabel ? (" tag-" + getColourIdx(this.props.entityClasses[0], this.props.entityColourMap)) : "")
    return (
      <span className={"word" + (this.props.selected ? " selected" : "") + tagClass}>

        <span className={"word-inner" + wordColourClass + (this.props.highlighting ? " search-highlight" : "") } ref={this.wordInnerRef}
              onMouseUp=  {() => this.props.updateSelections(this.props.index, 'up')}
              onMouseDown={() => this.props.updateSelections(this.props.index, 'down')}>

          {text}
        </span>
        {labels}
        
      </span>
    );
  }
}

// A sentence in the tagging interface.
class Sentence extends Component {
  constructor(props) {
    super(props);
    this.sentenceRef = React.createRef();
  }

  // Call the updateSelections function of the parent of this component (i.e. TaggingInterface), with this sentence's index included.
  updateSelections(wordIndex, action) {
    this.props.updateSelections(this.props.index, wordIndex, action)
  }

  deleteTag(wordIndex, entityClass) {
    this.props.deleteTag(this.props.index, wordIndex, entityClass);
  }

  // Scroll to this sentence if it receives a new selection.
  // https://stackoverflow.com/questions/442404/retrieve-the-position-x-y-of-an-html-element-relative-to-the-browser-window
  componentDidUpdate(prevProps, prevState) {
    if(prevProps.selections.length === 0 && this.props.selections.length > 0) {

      var element = this.sentenceRef.current;
      var bodyRect = document.body.getBoundingClientRect(),
          elemRect = element.getBoundingClientRect(),
          offset   = elemRect.top - bodyRect.top;

       window.scrollTo({
        top: offset - 200,
        left: 0,
        behavior: 'smooth',
      });
    }
  }

  render() {

    var selections = this.props.selections;

    // Check props.selections to determine whether the word with a given index in this sentence is selected.
    // This is passed to the word as a prop so that it can be highlighted accordingly.
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



    if(this.props.displayOnly) {
      return (
        <div className={"sentence-inner" + (this.props.displayOnly ? " display-only" : "")} ref={this.sentenceRef}>
          { this.props.words.map((word, i) => 
            <Word key={i}
                  index={i}
                  text={word}
                  entityClasses={this.props.annotations[i].entityClasses || []}
                  bioTag={this.props.annotations[i].bioTag}
                  entityColourMap={this.props.entityColourMap}
                  highlighting={this.props.annotations[i].highlighting}
                  updateSelections={() => {return null}}
                  deleteTag={() => {return null}}
                  isLastInSpan={this.props.annotations[i].isLastInSpan()}
            />)
          }   
        </div>
      );      
    }


    return (
      <div className="sentence-inner" ref={this.sentenceRef}>
        { this.props.words.map((word, i) => 
          <Word key={i}
                index={i}
                text={word}
                selected={isWordSelected(i)}
                entityClasses={this.props.annotations[i].entityClasses || []}
                isLastInSpan={this.props.annotations[i].isLastInSpan()}
                bioTag={this.props.annotations[i].bioTag}
                updateSelections={this.updateSelections.bind(this)}
                entityColourMap={this.props.entityColourMap}
                deleteTag={this.deleteTag.bind(this)}
                highlighting={this.props.annotations[i].highlighting}


          />)
        }   
        


       
      </div>
    );
  }

}





export { Word };
export { Sentence };