import React from "react";
import {Component} from "react";
import { Redirect, Link, BrowserRouter, Route, Switch, withRouter } from 'react-router-dom'
import Modal from 'react-modal';
import { TransitionGroup, CSSTransition } from "react-transition-group";

import Error404Page from 'views/Errors/Error404Page';

import NewProjectDetails from 'views/NewProjectView/NewProjectDetails';
import NewProjectEntityHierarchy from 'views/NewProjectView/NewProjectEntityHierarchy';

import NewProjectFormHelpIcon from 'views/NewProjectView/NewProjectFormHelpIcon';

import _fetch from 'functions/_fetch';

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
      <div className={"item " + (this.props.active ? "active": "") + (this.props.ready ? "" : " disabled")}><div className="inner">{this.props.name}</div></div>
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

    var sharedProps = (function() {
      return {
      loading: this.state.loading,
      toggleFormHelp: this.toggleFormHelp.bind(this),
      setModified: this.setModified.bind(this),
      }
    }).bind(this);

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
          pathname: "project_details",
          saved: false,
          data: null,  
          component: () => <NewProjectDetails
            data={this.state.formPages[PROJECT_DETAILS].data}
            saveData={this.saveData.bind(this, "Project details & data")}
            { ... sharedProps() } />       
        },
        {
          name: "Entity hierarchy",
          pathname: "entity_hierarchy",
          saved: false,
          data: null,
          component: () => <NewProjectEntityHierarchy
            entity_hierarchy={this.state.formPages[ENTITY_HIERARCHY].data ? this.state.formPages[1].data.children : []}  
            hierarchyPresets={["Named Entity Recognition (NER)", "Fine-grained Entity Recognition (FIGER)", "Maintenance"]}
            saveData={this.saveData.bind(this, "Entity hierarchy")}
            { ... sharedProps() }/>
        },


        {
          name: "Automatic tagging",
          pathname: "automatic_tagging",
          saved: false,
          data: null,
          component: () => <NewProjectAutomaticTagging
            data={this.state.formPages[AUTOMATIC_TAGGING].data}
            { ... sharedProps() }/>
        },
        {
          name: "Annotators",
          pathname: "annotators",
          saved: false,
          data: null,
          component: () => <NewProjectAnnotators
            data={this.state.formPages[ANNOTATORS].data}
            { ... sharedProps() }/>
        },
        {
          name: "Project options",
          pathname: "project_options",
          saved: false,
          data: null,
          component: () => <NewProjectProjectOptions
            data={this.state.formPages[PROJECT_OPTIONS].data} { ... sharedProps() }/>
        },
      ],

      formErrors: ["Name cannot be blank"],

      currentFormPageIndex: 0,

      wasModified: false, // Whether the currently displayed form has been modified
      isSaved: false, // Whether the currently displayed form has been saved
      formHelpContent: null, // The content currently appearing in the modal. null if modal is not being displayed.
      verifyBack: false, // Whether or not the confirmation window is showing (do you want to go back?)
    }

    // Store the previous states of each form so that the API does not need to be queried when going back and forth between
    // form pages.
    // this.prevStates = {
    //   "Project details & data": null,
    //   "Entity hierarchy": null,
    // };
    

  }

  componentDidMount() {
    //this.updateCurrentFormPageIndex();
  }

  // Save the previous state of the given form page.
  saveData(page, data) {
    var formPages = this.state.formPages;
    console.log(page, data);

    if(page === 'Project details & data') {
      formPages[PROJECT_DETAILS].data = data;
    }
    if(page === "Entity hierarchy") {      
      formPages[ENTITY_HIERARCHY].data = { children: data };    
      console.log(formPages[ENTITY_HIERARCHY].data)  
    }

    this.setState({
      formPages: formPages,
      wasModified: false,      
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

  getFormPagePathname() {
    return this.state.formPages[this.state.currentFormPageIndex].pathname;
  }

  async submitFormPage() {
    // do something
    var formPath = this.getFormPagePathname();
    var data = this.state.formPages[this.state.currentFormPageIndex].data;
    var d = await _fetch('http://localhost:3000/api/projects/new?formPage=' + formPath, 'POST', this.props.setErrorCode, data);

    console.log(d);

    this.setState({
      isSaved: true,
    })



  }


  // Set wasModified to true, signifying that the current form page has been modified.
  setModified() {
    this.setState({
      wasModified: true,
      isSaved: false,
    })
  }

  // Go to the previous form page.
  gotoPrevFormPage() {
    if(this.state.currentFormPageIndex === 0) return;

    // Reset form data
    var formPages = this.state.formPages;
    formPages[this.state.currentFormPageIndex].data = null;

    var prevIndex = this.state.currentFormPageIndex - 1;
    //this.props.history.push(this.state.formPages[prevIndex]);
    this.setState({
      verifyBack: false,
      formPages: formPages,
      currentFormPageIndex: prevIndex,
      wasModified: false,
      isSaved: true,
    })
  }

  // Go to the next form page.
  gotoNextFormPage() {
    if(this.state.currentFormPageIndex === (this.state.formPages.length - 1)) return;
    var nextIndex = this.state.currentFormPageIndex + 1;
    this.setState({
      currentFormPageIndex: nextIndex,
      wasModified: false,
      isSaved: false,

    });
  }

  // Close the modal, setting formHelpContent to null.
  handleCloseModal() {
    this.setState({
      formHelpContent: null,
    })
  }

  // Get the previous state of the requested page.
  // If this page was not saved, return null instead.
  // getPrevState(pageName) {
  //   var formIndex = -1;
  //   for(var i in this.state.formPages) {
  //     if(this.state.formPages[i].name === pageName) {
  //       formIndex = i;
  //       break;
  //     }
  //   }
  //   return this.state.formPages[i].saved ? this.prevStates[pageName] : null;
  // }

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

  renderFormPage(index) {
    return this.state.formPages[index].component();
  }

  render() {

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
              <NewProjectHeaderItem name={page.name} pathname={page.pathname} saved={page.saved} active={index === this.state.currentFormPageIndex} ready={this.state.currentFormPageIndex >= index}/>
            )}            
          </div>
        </header>
        <main className="container new-project">

          <div className="new-project-form-body">
          <TransitionGroup className="transition-group">
            <CSSTransition
            key={this.state.currentFormPageIndex}
            timeout={{ enter: 400, exit:400 }}
            classNames="fade"
            >
              
              <section className={"route-section" + (!this.state.loading ? " loaded" : "")}>
                  { this.state.formErrors && 
                    <div className="form-errors">
                      Please fix the following errors before saving:
                      <ul>
                      { this.state.formErrors.map((err, index) => 
                        <li>{err}</li>
                      )}
                      </ul>
                    </div>
                  }
                  { this.renderFormPage(this.state.currentFormPageIndex) }
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
              <button onClick={() => this.submitFormPage()} className={"annotate-button new-project-button " + (this.state.wasModified ? "": "disabled")}><i className="fa fa-save"></i>Save</button>
              <button onClick={() => this.gotoNextFormPage()}  className={"annotate-button new-project-button grey-button " + (this.state.isSaved ? "" : "disabled")}>Next<i className="fa fa-chevron-right after"></i></button>

              </div> }
          </div>
        </div>
       
      </div>
    )
  }
}

export default NewProjectView;

/*
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
                      data={this.state.formPages[AUTOMATIC_TAGGING].data}
                      toggleFormHelp={this.toggleFormHelp.bind(this)} />} /> 
                  <Route path="/projects/new/annotators" render={() =>
                    <NewProjectAnnotators loading={this.state.loading}
                      setModified={this.setModified.bind(this)}
                      data={this.state.formPages[ANNOTATORS].data}
                      toggleFormHelp={this.toggleFormHelp.bind(this)} />} />
                  <Route path="/projects/new/project-options" render={() =>
                    <NewProjectProjectOptions loading={this.state.loading}
                      setModified={this.setModified.bind(this)}
                      data={this.state.formPages[PROJECT_OPTIONS].data}
                      toggleFormHelp={this.toggleFormHelp.bind(this)} />} />
                  <Route exact path="/projects/new" render={() =>
                    <NewProjectDetails loading={this.state.loading}
                      data={this.state.formPages[PROJECT_DETAILS].data}
                      toggleFormHelp={this.toggleFormHelp.bind(this)} 
                      //prevState={ this.getPrevState('Project details & data')}
                      saveData={this.saveData.bind(this, "Project details & data")}
                      setModified={this.setModified.bind(this)}


                      />} /> 
                  <Route render={() => <Error404Page />} />    */