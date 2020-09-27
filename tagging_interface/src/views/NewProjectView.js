import React from "react";
import {Component} from "react";
import { Redirect, Link, BrowserRouter, Route, Switch, withRouter } from 'react-router-dom'
import Modal from 'react-modal';
import { TransitionGroup, CSSTransition } from "react-transition-group";

import Error404Page from 'views/Errors/Error404Page';

import NewProjectDetails from 'views/NewProjectView/NewProjectDetails';
import NewProjectEntityHierarchy from 'views/NewProjectView/NewProjectEntityHierarchy';

import NewProjectFormHelpIcon from 'views/NewProjectView/NewProjectFormHelpIcon';


Modal.setAppElement('body');



class NewProjectAutomaticTagging extends Component {
  constructor(props) {
    super(props);
  }

  render() {

    var help = (<div>
        <h2>Automatic Tagging</h2>
        <p>Redcoat can automatically annotate terms according to a dictionary, helping to save annotation time. These annotations can be adjusted by your annotators when necessary.</p>
      </div>
    )


    return (
      <div>
        <h2>Automatic Tagging <NewProjectFormHelpIcon onClick={() => this.props.toggleFormHelp(help)} /></h2>
        <p>Redcoat can automatically annotate terms according to a dictionary, helping to save annotation time. These annotations can be adjusted by your annotators when necessary.</p>
      </div>
    )
  }
}


class NewProjectAnnotators extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    var help = (<div>
        <h2>Annotators</h2>
        <p>Please specify the annotators of this project.</p>
      </div>
    )


    return (
      <div>
        <h2>Annotators <NewProjectFormHelpIcon onClick={() => this.props.toggleFormHelp(help)} /></h2>
        <p></p>
      </div>
    )
  }
}


class NewProjectProjectOptions extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    var help = (<div>
        <h2>Project Options</h2>
        <p>Please specify the options of this project.
          <ul>
            <li><b>Overlap</b>: The number of times each document will be annotated.</li>
            <li><b>Hierarchy permissions</b>: Whether your users can modify the hierarchy during annotation.</li>
          </ul>

        </p>
      </div>
    )


    return (
      <div>
        <h2>Project Options <NewProjectFormHelpIcon onClick={() => this.props.toggleFormHelp(help)} /></h2>
        <p></p>
      </div>
    )
  }
}



class NewProjectHeaderItem extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className={"item " + (this.props.currentPathname === this.props.pathname ? "active": "") + (this.props.ready ? "" : " disabled")}><div className="inner">{this.props.name}</div></div>
    )
  }
}

const PROJECT_DETAILS = 0;
const ENTITY_HIERARCHY = 1;
const AUTOMATIC_TAGGING = 2;
const ANNOTATORS = 3;
const PROJECT_OPTIONS = 4;

class NewProjectView extends Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.state = {
      loading: false,

      // Pass the data down to the form pages.
      // data: {
      //   entity_hierarchy: { children: [], },
      // },

      // Store JSON objects for each form page:
      // name: the name of the page
      // pathname: The url of the page
      // ready: Whether the user is able to navigate to this page yet
      // saved: Whether this page has been saved
      formPages: [
        {
          name: "Project details & data",
          pathname: "/projects/new",
          ready: true,
          saved: true,
          data: null,         
        },
        {
          name: "Entity hierarchy",
          pathname: "/projects/new/entity-hierarchy",
          ready: true,
          saved: false,
          data: null,
        },
        {
          name: "Automatic tagging",
          pathname: "/projects/new/automatic-tagging",
          ready: false,
          saved: false,
        },
        {
          name: "Annotators",
          pathname: "/projects/new/annotators",
          ready: false,
          saved: false,
        },
        {
          name: "Project options",
          pathname: "/projects/new/project-options",
          ready: false,
          saved: false,
        },
      ],

      currentFormPageIndex: 0,

      wasModified: false, // Whether the currently displayed form has been modified
      formHelpContent: null, // The content currently appearing in the modal. null if modal is not being displayed.
      verifyBack: false, // Whether or not the confirmation window is showing (do you want to go back?)
    }

    // Store the previous states of each form so that the API does not need to be queried when going back and forth between
    // form pages.
    this.prevStates = {
      "Project details & data": null,
      "Entity hierarchy": null,
    };
    

  }

  componentDidMount() {
    this.updateCurrentFormPageIndex();
  }

  // Save the previous state of the given form page.
  saveData(page, data) {
    //this.prevStates[page] = state;
    var formPages = this.state.formPages;
    console.log(page, data);

    if(page === 'Project details & data') {

      formPages[PROJECT_DETAILS].data = data;
    }
    if(page === "Entity hierarchy") {      
      formPages[ENTITY_HIERARCHY].data = { children: data };      
    }

    this.setState({
      formPages: formPages,
    })
  }

  // Update the form page index when this component's location is updated (i.e. a route change).
  componentDidUpdate(prevProps) {    
    if(this.props.location !== prevProps.location) {
      this.updateCurrentFormPageIndex();
    }
  }

  // Display the form help content (which pops the modal up).
  toggleFormHelp(formHelpContent) {
    this.setState({
      formHelpContent: formHelpContent,
    })
  }

  // Update the current form page index, using the pathname to determine the index.
  updateCurrentFormPageIndex() {  
    var location = this.props.location;
    var currentPathname = location.pathname;

    this.setState({
      currentFormPageIndex: this.getFormPageIndex(currentPathname),
      wasModified: false,
    }, () => {
      console.log(this.state.currentFormPageIndex)
    })
  }

  // Get the name, pathname and ready JSON obj from this.state.formPages that correspond to the current path name.
  getFormPageIndex(currentPathname) {
    for(var i in this.state.formPages) {
      var formPage = this.state.formPages[i];
      if(currentPathname === formPage.pathname) return parseInt(i);
    }
  }

  submitFormPage() {
    // do something
  }


  // Set wasModified to true, signifying that the current form page has been modified.
  setModified() {
    this.setState({
      wasModified: true,
    })
  }

  // Go to the previous form page.
  gotoPrevFormPage() {
    if(this.state.currentFormPageIndex === 0) return;

    // Reset form data
    var formPages = this.state.formPages;
    formPages[this.state.currentFormPageIndex].data = null;

    var prevIndex = this.state.currentFormPageIndex - 1;
    this.props.history.push(this.state.formPages[prevIndex]);
    this.setState({
      verifyBack: false,
      formPages: formPages,
    })
  }

  // Go to the next form page.
  gotoNextFormPage() {
    if(this.state.currentFormPageIndex === (this.state.formPages.length - 1)) return;
    var nextIndex = this.state.currentFormPageIndex + 1;
    this.props.history.push(this.state.formPages[nextIndex]);
  }

  // Close the modal, setting formHelpContent to null.
  handleCloseModal() {
    this.setState({
      formHelpContent: null,
    })
  }

  // Get the previous state of the requested page.
  // If this page was not saved, return null instead.
  getPrevState(pageName) {
    var formIndex = -1;
    for(var i in this.state.formPages) {
      if(this.state.formPages[i].name === pageName) {
        formIndex = i;
        break;
      }
    }
    return this.state.formPages[i].saved ? this.prevStates[pageName] : null;
  }

  // Verify that the user wants to go back to the previous page.
  verifyBack() {
    var wasModified = this.state.wasModified;
    if(!wasModified) {
      this.gotoPrevFormPage();
      return;
    }
    this.setState({
      verifyBack: true,
    });
  }

  render() {
    var location = this.props.location;    
    var currentPathname = location.pathname;    

    var lastPage = this.state.currentFormPageIndex === (this.state.formPages.length - 1);

    return (
      <div id="new-project-form" ref={this.ref} >

        <Modal 
           isOpen={this.state.formHelpContent || this.state.verifyBack ? true : false}
           contentLabel="Hello there"
           onRequestClose={this.handleCloseModal.bind(this)}
           className={"modal" + (this.state.verifyBack ? " verify-back" : "")}
           overlayClassName="modal-overlay"
           app={this.ref}
        >
          {
            this.state.verifyBack
            ? <div>
                <p>Going back to the previous page will reset this form. Are you sure?</p>
                <div className="verify-back-row">
                  <button className="annotate-button grey-button" onClick={() => this.setState({ verifyBack: false })}>No</button>
                  <button className="annotate-button grey-button" onClick={() => this.gotoPrevFormPage()}>Yes</button>
                </div>
              </div>
            : this.state.formHelpContent
          }
        </Modal>


        <header className="bg-header">
          <div id="header-project-details" className="title">
            <h1>New project</h1>
          </div>
        </header>
        
        <header className="new-project-header">
          <div className="container flex-container">
            { this.state.formPages.map((page, index) => 
              <NewProjectHeaderItem name={page.name} pathname={page.pathname} saved={page.saved} currentPathname={currentPathname} ready={page.ready}/>
            )}            
          </div>
        </header>
        <main className="container new-project">

          <div className="new-project-form-body">
          <TransitionGroup className="transition-group">
            <CSSTransition
            key={location.key}
            timeout={{ enter: 400, exit:400 }}
            classNames="fade"
            >
              <section className={"route-section" + (!this.state.loading ? " loaded" : "")}>
               <Switch location={location}>
                   
                  <Route path="/projects/new/entity-hierarchy" render={() =>
                    <NewProjectEntityHierarchy loading={this.state.loading}

                      entity_hierarchy={this.state.formPages[ENTITY_HIERARCHY].data ? this.state.formPages[1].data.children : []}  

                      hierarchyPresets={["Named Entity Recognition (NER)", "Fine-grained Entity Recognition (FIGER)", "Maintenance"]}
                      toggleFormHelp={this.toggleFormHelp.bind(this)} 

                      setModified={this.setModified.bind(this)}

                      //prevState={ this.getPrevState('Entity hierarchy')}
                      saveData={this.saveData.bind(this, "Entity hierarchy")}

                      />} /> 
                  <Route path="/projects/new/automatic-tagging" render={() =>
                    <NewProjectAutomaticTagging loading={this.state.loading}
                      setModified={this.setModified.bind(this)}
                      data={this.state.data.automatic_tagging}
                      toggleFormHelp={this.toggleFormHelp.bind(this)} />} /> 
                  <Route path="/projects/new/annotators" render={() =>
                    <NewProjectAnnotators loading={this.state.loading}
                      setModified={this.setModified.bind(this)}
                      data={this.state.data.annotators}
                      toggleFormHelp={this.toggleFormHelp.bind(this)} />} />
                  <Route path="/projects/new/project-options" render={() =>
                    <NewProjectProjectOptions loading={this.state.loading}
                      setModified={this.setModified.bind(this)}
                      data={this.state.data.project_options}
                      toggleFormHelp={this.toggleFormHelp.bind(this)} />} />
                  <Route exact path="/projects/new" render={() =>
                    <NewProjectDetails loading={this.state.loading}
                      data={this.state.formPages[PROJECT_DETAILS].data}
                      toggleFormHelp={this.toggleFormHelp.bind(this)} 
                      //prevState={ this.getPrevState('Project details & data')}
                      saveData={this.saveData.bind(this, "Project details & data")}
                      setModified={this.setModified.bind(this)}


                      />} /> 
                  <Route render={() => <Error404Page />} />   
                </Switch>
              </section>
            </CSSTransition>
          </TransitionGroup>
          </div>          
        </main> 
        <div className="new-project-submit-row">
          <div className="container">
            <button onClick={() => this.verifyBack()} className={"annotate-button new-project-button grey-button" + (this.state.currentFormPageIndex === 0 ? " disabled" : "")}><i className="fa fa-chevron-left"></i>Back</button>
            

            { lastPage && <button onClick={() => this.submitFormPage()} className="annotate-button new-project-button">Create project</button> }


            { !lastPage && 
            <div className="buttons-right">
              <button onClick={() => this.submitFormPage()} className="annotate-button new-project-button"><i className="fa fa-save"></i>Save</button>
              <button onClick={() => this.gotoNextFormPage()}  className="annotate-button new-project-button grey-button">Next<i className="fa fa-chevron-right after"></i></button>

              </div> }
          </div>
        </div>
       
      </div>
    )
  }
}

export default withRouter(NewProjectView);