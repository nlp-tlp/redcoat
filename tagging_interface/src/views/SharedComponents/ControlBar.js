import React from 'react';
import {Component} from 'react';
import $ from 'jquery';
import formatDate  from 'functions/formatDate';

// The humble save button that appears at the top of the page.
class SaveButton extends Component {
  constructor(props) {
    super(props);
  }
  render() {

    var buttonClass = " disabled";
    if(this.props.changesMade) buttonClass = "";
    if(this.props.recentlySaved) buttonClass = " recently-saved";
    if(this.props.saving) buttonClass = " saving";

    var iconClass = "fa-save";
    if(this.props.recentlySaved) iconClass = "fa-check";
    if(this.props.saving) iconClass = "fa-cog fa-spin"

    var text = "Save";
    if(this.props.recentlySaved) text = "Saved";
    if(this.props.saving) text = "Saving";

    return (
      <button className={"save-button" + buttonClass} onClick={this.props.submitAnnotations}>
        <i className={"fa " + iconClass}></i>
        { text }
      </button>
    )
  }
}


// The progress bar that appears when the user saves a new doc group.
class ProgressBar extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div id="tagging-progress-bar" className={(this.props.show ? "show" : "hide")}>
        <span className="progress-bar">
          <span className="inner" style={{"width": (this.props.totalPagesAvailable - 1) / this.props.totalPages * 100 + "%"}}></span>
        </span>
      </div>
    )
  }
}






// The search bar that appears in the control bar, for searching through previously annotated docs.
class DocumentSearchBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
    }
    this.inputRef = React.createRef();
  }  

  updateValue(e) {
    var value = e.target.value;
    if(value.trim().length === 0) {
      value = '';
    }
    this.setState({
      value: value,
    });
  }

  submit(e) {
    

    this.props.searchDocuments(this.state.value);

    // this.setState({
    //   value: null,
    // }, () => {
      var ele = $(this.inputRef.current);
      ele.blur();
    // });

    e.preventDefault();
    return null;
  }


  render() {
    return (
      <form className={"search-container" + (this.props.inSearchMode ? " active" : "")} onSubmit={this.submit.bind(this)} >
        <input ref={this.inputRef} className="search-bar" id="document-search-bar" placeholder="Search..." value={this.state.value} onChange={(e) => this.updateValue(e)} ></input><button className="search-button"><i class="fa fa-search"></i></button>
      </form>
    )
  }
}




// The 'control bar', which appears at the top of the interface (with page numbers, group number etc).
class ControlBar extends Component {

  constructor(props) {
    super(props);
    this.state =  {
      pageNumber: null, // The desired page number of the user (not necessarily the one they are currently on).
      pageNumberError: false,
    }
    this.pageInputRef = React.createRef();
  }

  // clearPageNumberError() {
  //   this.setState({
  //     pageNumber: this.props.pageNumber,
  //     pageNumberError: false,
  //   })
  // }

  clearPageNumberInput() {
    var ele = $(this.pageInputRef.current);
    ele.val('');
    ele.blur();
  }

  goToPage(e) {

    this.clearPageNumberInput();
    if(this.state.pageNumber === '') {
      this.setState({ pageNumber: this.props.pageNumber })
      e.preventDefault();
      return null;
    }



    if(this.state.pageNumber !== parseInt(this.state.pageNumber).toString()) {
      this.setState({
        pageNumber: this.props.totalPagesAvailable,
      }, () => { this.props.goToPage(this.state.pageNumber)});
      e.preventDefault();
      return null;
    }

    if(this.state.pageNumber < 1) {
      this.setState({
        pageNumber: 1,
      }, () => { this.props.goToPage(this.state.pageNumber)});
    } else if (this.state.pageNumber > this.props.totalPagesAvailable) {
      this.setState({
        pageNumber: this.props.totalPagesAvailable,
      }, () => { this.props.goToPage(this.state.pageNumber)});
    } else {
      this.props.goToPage(this.state.pageNumber);
    }
 

    e.preventDefault();
    return null;
  }

  componentDidMount() {
    if(!this.state.pageNumber && this.props.pageNumber) {
      this.setState({
        pageNumber: this.props.pageNumber
      })
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.props.pageNumber !== prevProps.pageNumber) {
      this.setState({
        pageNumber: this.props.pageNumber
      })
    }
  }


  changePageNumber(e) {
    this.setState({
      pageNumber: e.target.value,
    });
  }

  render() {



    var groupName = (
      <span className={"group-name"}>
        <span>Page <b>
          <form onSubmit={this.goToPage.bind(this)}>
          <input 
                 id="page-input"
                 className={"page-input" + (this.state.pageNumberError ? " error" : "")}
                 placeholder={this.state.pageNumber}
                 name="page-input"
                 onChange={(e) => this.changePageNumber(e)}
                 ref={this.pageInputRef}
                 />
          </form>
          
        </b> of <b>{this.props.totalPages}</b></span>
      </span>
    );

    var latestGroup = (this.props.totalPagesAvailable) === this.props.pageNumber // Whether the user is looking at the latest group, that they have not yet annotated

    var lastModified = this.props.changesMade ? (this.props.saving ? "" : "Changes not saved") : (this.props.lastModified ? "Saved on " + formatDate(this.props.lastModified) : "");

    return (
      <div id="pagination" className={this.props.curationPage ? "curation-page" : ""}>
        <div className="page-button-container previous-page">
          <button className={(this.props.pageNumber === 1 ? " disabled" : (this.props.querying ? "loading" : ""))} onClick={this.props.loadPreviousPage}><i className="fa fa-chevron-left"></i>Prev
          </button>
        </div>
        <div className="filler-left">
          <DocumentSearchBar inSearchMode={this.props.inSearchMode} searchDocuments={this.props.searchDocuments} />
          
        </div>
        <div className="highlight-oov-container"><input type="checkbox" checked={this.props.renderOOVHighlight} onClick={this.props.toggleOOVHighlight} /> Highlight OOV</div>
        <div className={"current-page-container" + (this.props.showingProgressBar ? " progress-bar-underneath" : "")}>
          { groupName }


          { this.props.showDocsPerPage && <div className="docs-per-page-select-container">
            <label>Per page:</label>
            <select className="docs-per-page-select" onChange={(e) => {this.props.setDocsPerPage(e); $(e.target).blur()}} >
              {this.props.docsPerPageOptions.map((p, index) => 
                <option value={p} selected={p === this.props.docsPerPage}>{p}</option>
              )}
            </select>
          </div> }

          { this.props.showSortBy && <div className="docs-per-page-select-container">
            <label>Sort by:</label>
            <select className="docs-per-page-select sort-by" onChange={(e) => {this.props.setSortBy(e); $(e.target).blur()}} >
              {this.props.sortByOptions.map((p, index) => 
                <option value={p} selected={p === this.props.sortBy}>{p === "Annotations" ? "# Annotations" : p}</option>
              )}
            </select>
          </div> }



          <ProgressBar 
            show={this.props.showingProgressBar}
            totalPagesAvailable={this.props.totalPagesAvailable}
            totalPages={this.props.totalPages}
          />
        </div>
        <div className="group-last-modified">{lastModified }</div>

        { this.props.showSaveButton && <div className="page-button-container " ><SaveButton changesMade={this.props.changesMade} recentlySaved={this.props.recentlySaved} saving={this.props.saving} submitAnnotations={this.props.submitAnnotations}  /></div> }
        <div className="page-button-container next-page" title={latestGroup && !this.props.inSearchMode ? "Finish annotating this page to move on to the next page." : ""}>
          <button className={(latestGroup  ? " disabled" : (this.props.querying ? "loading" : ""))}  onClick={this.props.loadNextPage}>Next<i className="fa fa-chevron-right"></i></button>
        </div>              
      </div>
    )
  }
}

export default ControlBar;