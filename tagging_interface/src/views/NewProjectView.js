import React from "react";
import {Component} from "react";
import { Redirect, Link, BrowserRouter, Route, Switch, withRouter } from 'react-router-dom'
import Modal from 'react-modal';
import { TransitionGroup, CSSTransition } from "react-transition-group";
import Error404Page from 'views/Errors/Error404Page';

import NewProjectDetails from 'views/NewProjectView/NewProjectDetails';
import NewProjectEntityHierarchy from 'views/NewProjectView/NewProjectEntityHierarchy';
import NewProjectAutomaticTagging from 'views/NewProjectView/NewProjectAutomaticTagging';

import NewProjectFormHelpIcon from 'views/NewProjectView/NewProjectFormHelpIcon';

import _fetch from 'functions/_fetch';

import {json2slash} from 'views/NewProjectView/functions/hierarchy_helpers'

Modal.setAppElement('body');




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
      <div className={"item " + (this.props.active ? "active": "") + (this.props.ready ? "" : " disabled")}>
        <div className="inner">{this.props.name}
        {this.props.pageProgress === "saved" && <i className="fa fa-check"></i>}
        {this.props.pageProgress === "error" && <i className="fa fa-times"></i>}
        {this.props.pageProgress === "requires_attention" && <i className="fa fa-warning"></i>}
        </div>
      </div>
    )
  }
}

function getErrorPathsSet(errors) {
  if(!errors) return new Set();
  var errorPaths = new Set();
  for(var e of errors) {
    errorPaths.add(e.path);
  }
  return errorPaths;
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
        saving: this.state.saving,
        toggleFormHelp: this.toggleFormHelp.bind(this),
        errors: this.state.formErrors,
        errorPaths: getErrorPathsSet(this.state.formErrors),
        data: this.state.data,
        markModified: this.markModified.bind(this),
        updateFormPageData: this.updateFormPageData.bind(this),


      }
    }).bind(this);

    this.formPages = [
        {
          name: "Project details & data",
          pathname: "project_details",

          component: () => <NewProjectDetails
            //data={this.formPages[PROJECT_DETAILS].data}
            //uploadFormHasError={this.formPages[PROJECT_DETAILS].uploadFormHasError}
            { ... sharedProps() } />       
        },
        {
          name: "Entity hierarchy",
          pathname: "entity_hierarchy",

          component: () => <NewProjectEntityHierarchy
            //entity_hierarchy={this.formPages[ENTITY_HIERARCHY].data ? this.formPages[1].data.children : []}  
            hierarchyPresets={["Named Entity Recognition (NER)", "Fine-grained Entity Recognition (FIGER)", "Maintenance"]}
            { ... sharedProps() }/>
        },


        {
          name: "Automatic tagging",
          pathname: "automatic_tagging",
          component: () => <NewProjectAutomaticTagging
          
            { ... sharedProps() }/>
        },
        {
          name: "Annotators",
          pathname: "annotators",
          component: () => <NewProjectAnnotators
            //data={this.formPages[ANNOTATORS].data}
            { ... sharedProps() }/>
        },
        {
          name: "Project options",
          pathname: "project_options",
          component: () => <NewProjectProjectOptions
           { ... sharedProps() }/>
        },
    ]

    // Store the dependencies between form pages (in reverse), e.g.
    // automatic_tagging depends on entity_hierarchy. If entity_hierarchy is changed, automatic_tagging is reset.
    this.formPageDependencies = {
      "entity_hierarchy": ["automatic_tagging", AUTOMATIC_TAGGING],
      "project_details": ["project_options", PROJECT_OPTIONS],
      "annotators": ["project_options", PROJECT_OPTIONS],
    }

    this.state = {
      

      // Pass the data down to the form pages.
      // data: {
      //   entity_hierarchy: { children: [], },
      // },

      data: {},

      // Store JSON objects for each form page:
      // name: the name of the page
      // pathname: The url of the page
      // ready: Whether the user is able to navigate to this page yet
      // saved: Whether this page has been saved
      currentFormPageIndex: null,

      formErrors: null,
      formErrorShake: false, // Set to true when a front-end form error happens

      loading: true,
      saving: false,

      wasModified: false, // Whether the currently displayed form has been modified
      isSaved: false, // Whether the currently displayed form has been saved

      formHelpContent: null, // The content currently appearing in the modal. null if modal is not being displayed.

      verifyBack: false, // Whether or not the confirmation window is showing (do you want to go back?)


      formPageProgress: ["not_started", "not_started", "not_started", "not_started", "not_started"], // Store the progress of each form page

    }

    // Store the previous states of each form so that the API does not need to be queried when going back and forth between
    // form pages.
    // this.prevStates = {
    //   "Project details & data": null,
    //   "Entity hierarchy": null,
    // };
    

  }

  componentDidMount() {

    this.queryAPI(true);

    //this.updateCurrentFormPageIndex();
  }

  markModified() {
    this.setState({
      wasModified: true,
      isSaved: false,
    });
  }

  // Save the state of the given form page.
  async updateFormPageData(data, options) {
    //var formPages = this.formPages;
    //console.log(page, data);

    // await this.setState({
    //   data: data,
    // })
    if(options && options.reset_form) {
      //console.log('hello')
      await this.setState({
        data: {...data, file_metadata: null},
        wasModified: true,
        isSaved: false,
      });
      return;
    }

    this.setState({
      data: data,
      //formPages: formPages,
      wasModified: true,
      isSaved: false,
    }, () => {
      console.log(this.state.data);
    });
  }


  async queryAPI(firstLoad) {
    await this.setState({
      loading: true,
      data: {},
    })
    if(firstLoad) {
      formPage = '';
    } else {
      var formPage = '?formPage=' +this.getFormPagePathname();      
    }
    
    var d = await _fetch('http://localhost:3000/api/projects/new/get' + formPage, 'GET', this.props.setErrorCode, false, false, 555);



    var formPageProgress = this.state.formPageProgress;

    if(firstLoad) {
      var latestFormPage = d.latest_form_page;
      for(var i = 0; i < this.formPages.length; i++) {
        
        if(this.formPages[i].pathname === latestFormPage) {
          var latestFormPageIndex = i;
          break;
        }
      }
    } else {
      var latestFormPageIndex = this.state.currentFormPageIndex;
    }


    formPageProgress = d.form_page_progress;


    
    //console.log(d, d.is_saved, "<<<");
    
    this.setState({
      data: d.data,
      isSaved: d.is_saved,
      currentFormPageIndex: latestFormPageIndex,
      wasModified: false,
      //isSaved: true,
      loading: false,
      formPageProgress: formPageProgress,
    });
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
    return this.formPages[this.state.currentFormPageIndex].pathname;
  }

  async submitFormPage(e) {
    e.preventDefault();

    console.log("Submitting")

    await this.setState({
      saving: true,
    })
    // do something
    var formPath = this.getFormPagePathname();
    var data = this.state.data;

    console.log("THIS STATE DATA IS ", data);
    if(this.state.currentFormPageIndex === PROJECT_DETAILS) {

      // Upload name/desc first
      var response = await _fetch('http://localhost:3000/api/projects/new/submit?formPage=' + formPath, 'POST', this.props.setErrorCode, data);

      // Don't save the dataset again if it has not changed
      if(!response.errors && !this.state.data.file_metadata) {

        // Then upload the dataset
        var formData = new FormData();
        formData.append('file', data.dataset);

        var response = await _fetch('http://localhost:3000/api/projects/new/submit?formPage=dataset', 'POST', this.props.setErrorCode, formData, true);

        if(response.errors) {
          return this.renderWithErrors(response);
        } else {
          return this.setState({
            data: {...this.state.data, file_metadata: response.details },
            formErrors: null,
            isSaved: true,
            saving: false,
          });
        }
      }




    } else if(this.state.currentFormPageIndex === ENTITY_HIERARCHY) {

      if(this.state.currentFormPageIndex === ENTITY_HIERARCHY) {
        data = { entity_hierarchy: json2slash({children: data.entity_hierarchy}), hierarchy_preset: data.hierarchy_preset };
      }
      var response = await _fetch('http://localhost:3000/api/projects/new/submit?formPage=' + formPath, 'POST', this.props.setErrorCode, data);

    } else if(this.state.currentFormPageIndex === AUTOMATIC_TAGGING) {
      // Then upload the dataset

      if(data.dataset) {
        var formData = new FormData();
        formData.append('file', data.dataset);

        var response = await _fetch('http://localhost:3000/api/projects/new/submit?formPage=automatic_tagging', 'POST', this.props.setErrorCode, formData, true);


        if(response.errors) {
          return this.renderWithErrors(response);
        } else {
          return this.setState({
            data: {...this.state.data, file_metadata: response.details },            
            formErrors: null,
            isSaved: true,
            saving: false,
            formPageProgress: response.form_page_progress,
          }, () => {
            console.log(this.state.data, "X)");
          });
        }



      } else {
        var response = await _fetch('http://localhost:3000/api/projects/new/submit?formPage=automatic_tagging', 'POST', this.props.setErrorCode, { clear_automatic_tagging: true });
      }
      

    }



    console.log(response);

    if(response.errors) {
      this.renderWithErrors(response);
    } else {
      console.log("rRR", response.form_page_progress)

      this.setState({
        formPageProgress: response.form_page_progress,
        formErrors: null,
        isSaved: true,
        saving: false,
      }, () => {
        console.log(this.state.formPageProgress)
      })
    }
    return null;

  }

  renderWithErrors(response) {
    console.log("Response", response)
    var errors = response.errors;
    var formPageProgress = response.form_page_progress;

    //var formPageProgress = this.state.formPageProgress;
    //formPageProgress[this.state.currentFormPageIndex] = "error";
    console.log(formPageProgress, "XX")
    this.setState({
      formErrors: errors,
      isModified: false,
      isSaved: false,
      saving: false,
      formPageProgress: formPageProgress,
    }, () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    });
  }


  // Set wasModified to true, signifying that the current form page has been modified.
  // setModified() {
  //   this.setState({
  //     wasModified: true,
  //     isSaved: false,
  //   })
  // }

  // Go to the previous form page.
  async gotoPrevFormPage() {
    if(this.state.currentFormPageIndex === 0) return;

    // Reset form data
    //var d = await _fetch('http://localhost:3000/api/projects/new/clear?formPage=' + this.getFormPagePathname(), 'GET', this.props.setErrorCode, false, false, 333);
    //console.log(d);

    var prevIndex = this.state.currentFormPageIndex - 1;
    //this.props.history.push(this.formPages[prevIndex]);
    await this.setState({
      verifyBack: false,
      currentFormPageIndex: prevIndex,      
      loading: true,
      isSaved: false,
      formErrors: null,
    });
    this.queryAPI();

    window.scrollTo({
      top: 0,
      left: 0,
    });
  
  }

  // Go to the next form page.
  async gotoNextFormPage() {
    if(this.state.currentFormPageIndex === (this.formPages.length - 1)) return;
    var nextIndex = this.state.currentFormPageIndex + 1;
    await this.setState({
      currentFormPageIndex: nextIndex,
      loading: true,
      isSaved: false,
    });
    this.queryAPI();

    window.scrollTo({
      top: 0,
      left: 0,
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
  //   for(var i in this.formPages) {
  //     if(this.formPages[i].name === pageName) {
  //       formIndex = i;
  //       break;
  //     }
  //   }
  //   return this.formPages[i].saved ? this.prevStates[pageName] : null;
  // }

  // Verify that the user wants to go back to the previous page.
  verifyBack() {

    var wasModified = this.state.wasModified;
    var isSaved = this.state.isSaved;
    if(!wasModified || isSaved) {
      this.gotoPrevFormPage();
      return;
    }
    this.setState({
      verifyBack: true,
    });
  }

  // Shake the form when the save button is pressed. This applies the 'shake' class to the form, which will
  // shake any inputs marked as invalid in the front end. (i.e. inputs that are required but empty will shake).
  async shakeForm() {
    if(this.state.isSaved) return;
    await this.setState({
      formErrorShake: true,
    })
    window.setTimeout( () => this.setState({formErrorShake: false}), 500);
  }

  renderFormPage(index) {
    return this.formPages[index].component();
  }

  render() {
    //console.log(this.state.data);

    var lastPage = this.state.currentFormPageIndex === (this.formPages.length - 1);

    if(this.state.currentFormPageIndex) var formPath = this.getFormPagePathname();

    return (
      <form id="new-project-form" className={(this.state.formErrors ? "errors" : "") + (this.state.formErrorShake ? "shake" : "") + (this.state.saving ? " saving" : "") + (this.state.loading ? " loading" : "")} ref={this.ref} onSubmit={this.state.isSaved ? null : (e) => this.submitFormPage(e)}  >

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
                <p>You have unsaved changes. Are you sure you want to go back to the previous page?</p>
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
            { this.formPages.map((page, index) => 
              <NewProjectHeaderItem name={page.name}
                pathname={page.pathname}
                key={index}
                pageProgress={this.state.formPageProgress[index]}
                active={index === this.state.currentFormPageIndex}
                ready={this.state.currentFormPageIndex >= index || this.state.isSaved && index === this.state.currentFormPageIndex + 1}/>
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
                
                <section className={"route-section"}>

                    <div className={"form-notice form-loading " + (this.state.loading ? "" : "hidden")}><i className="fa fa-cog fa-spin"></i>Loading...</div>

                    <div className={"form-notice form-success " + (this.state.isSaved ? "" : "hidden")}><i className="fa fa-check"></i>This page is saved.
                      

                    </div>

                    <div className={"form-notice form-warning " + (!this.state.loading && this.state.formPageProgress[this.state.currentFormPageIndex] === "requires_attention" ? "" : "hidden")}><i className="fa fa-warning"></i>This form was reset by a previous form. Please fill it in again to continue.</div>

                    <div className={"form-notice small-margin-top form-warning " + (this.state.isSaved && this.formPageDependencies[formPath] && this.state.formPageProgress[this.formPageDependencies[formPath][1]] === "saved" ? "" : "hidden")}><i className="fa fa-warning"></i>Modifying the form below will reset the {formPath && this.formPageDependencies[formPath] && this.formPageDependencies[formPath][0] && this.formPageDependencies[formPath][0].replace("_", " ")} form.</div>

                    <div className={"form-notice form-errors " + (this.state.formErrors ? "" : "hidden")}>
                      <i className="fa fa-times"></i>Please fix the following errors before saving:
                      <ul>
                      { this.state.formErrors && this.state.formErrors.map((err, index) => 
                        <li key={index}>{err.message}</li>
                      )}
                      { !this.state.formErrors && <li></li>}
                      </ul>
                    </div>
                    
                    { !this.state.loading && this.renderFormPage(this.state.currentFormPageIndex) }
                </section>
              </CSSTransition>
            </TransitionGroup>

            </div>      
             
        </main> 
        <div className="new-project-submit-row">
          <div className="container">
            <button type="button" onClick={() => this.verifyBack()} className={"annotate-button new-project-button grey-button" + (this.state.currentFormPageIndex === 0 ? " disabled" : "")}><i className="fa fa-chevron-left"></i>Back</button>
            

            { lastPage && <button onClick={() => this.submitFormPage()} className="annotate-button new-project-button">Create project</button> }


            { !lastPage && 
            <div className="buttons-right">

              <button type={this.state.isSaved ? "button": "submit"} 
                      className={"annotate-button new-project-button " +
                      (!this.state.wasModified && !this.state.isSaved ? "disabled": "") +
                      (this.state.isSaved ? " saved": "") + 
                      (this.state.saving ? " saving" : "")
                      }
                      onClick={() => this.shakeForm()}>
                        <i className={"fa fa-" + (this.state.isSaved ? "check": (this.state.saving ? "cog fa-spin" : "save"))}></i>
                        {this.state.saving ? "Saving" : "Save" + (this.state.isSaved ? 'd' : '')}
              </button>

              <button type="button" onClick={() => this.gotoNextFormPage()}  className={"annotate-button new-project-button " + (this.state.isSaved ? "" : "disabled")}>Next<i className="fa fa-chevron-right after"></i></button>

              </div> }
          </div>
        </div>
       
      </form>
    )
  }
}

export default NewProjectView;

/*
<Route path="/projects/new/entity-hierarchy" render={() =>
                    <NewProjectEntityHierarchy loading={this.state.loading}

                      entity_hierarchy={this.formPages[ENTITY_HIERARCHY].data ? this.formPages[1].data.children : []}  

                      hierarchyPresets={["Named Entity Recognition (NER)", "Fine-grained Entity Recognition (FIGER)", "Maintenance"]}
                      toggleFormHelp={this.toggleFormHelp.bind(this)} 

                      setModified={this.setModified.bind(this)}

                      //prevState={ this.getPrevState('Entity hierarchy')}
                      updateFormPageData={this.updateFormPageData.bind(this, "Entity hierarchy")}

                      />} /> 
                  <Route path="/projects/new/automatic-tagging" render={() =>
                    <NewProjectAutomaticTagging loading={this.state.loading}
                      setModified={this.setModified.bind(this)}
                      data={this.formPages[AUTOMATIC_TAGGING].data}
                      toggleFormHelp={this.toggleFormHelp.bind(this)} />} /> 
                  <Route path="/projects/new/annotators" render={() =>
                    <NewProjectAnnotators loading={this.state.loading}
                      setModified={this.setModified.bind(this)}
                      data={this.formPages[ANNOTATORS].data}
                      toggleFormHelp={this.toggleFormHelp.bind(this)} />} />
                  <Route path="/projects/new/project-options" render={() =>
                    <NewProjectProjectOptions loading={this.state.loading}
                      setModified={this.setModified.bind(this)}
                      data={this.formPages[PROJECT_OPTIONS].data}
                      toggleFormHelp={this.toggleFormHelp.bind(this)} />} />
                  <Route exact path="/projects/new" render={() =>
                    <NewProjectDetails loading={this.state.loading}
                      data={this.formPages[PROJECT_DETAILS].data}
                      toggleFormHelp={this.toggleFormHelp.bind(this)} 
                      //prevState={ this.getPrevState('Project details & data')}
                      updateFormPageData={this.updateFormPageData.bind(this, "Project details & data")}
                      setModified={this.setModified.bind(this)}


                      />} /> 
                  <Route render={() => <Error404Page />} />    */