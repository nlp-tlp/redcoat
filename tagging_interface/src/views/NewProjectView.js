import React from "react";
import {Component} from "react";
import { Redirect, Link, BrowserRouter, Route, Switch, withRouter } from 'react-router-dom'
import Modal from 'react-modal';
import { TransitionGroup, CSSTransition } from "react-transition-group";
import Error404Page from 'views/Errors/Error404Page';

import NewProjectDetails from 'views/NewProjectView/NewProjectDetails';
import NewProjectEntityHierarchy from 'views/NewProjectView/NewProjectEntityHierarchy';
import NewProjectAutomaticTagging from 'views/NewProjectView/NewProjectAutomaticTagging';
import NewProjectAnnotators from 'views/NewProjectView/NewProjectAnnotators';
import NewProjectProjectOptions from 'views/NewProjectView/NewProjectProjectOptions';

import NewProjectFormHelpIcon from 'views/NewProjectView/NewProjectFormHelpIcon';

import _fetch from 'functions/_fetch';

import {json2slash} from 'views/NewProjectView/functions/hierarchy_helpers'

Modal.setAppElement('body');


function generateEmptyTable() {
  var n = 15;
  var arr = new Array(n).fill(0);
  

  function stringOfRandomLength(minlen, maxlen) {
    var s = '';
    for(var i = 0; i < minlen + Math.floor(Math.random() * maxlen); i++) {
      s += 'x';
    }
    return s;
  }

  return (
    <table className="project-page-table">
      <tbody>
       { arr.map((x, i) => 
        <tr> 
          <td><span className="inner"><span className="st">{stringOfRandomLength(30, 70)}</span></span></td>
          <td><span className="inner"><span className="st">{stringOfRandomLength(30, 70)}</span></span></td>
        </tr>
      ) }
    </tbody>
  </table>
  )  
}


class FormLoadingSkeleton extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div>
        <h2><span className="st st-darker">Empty form hello</span></h2>
        { this.props.page === "entity_hierarchy" && 
          <div>
            <div className="form-group no-padding">
              <label><span className="st st-darker">Preset</span></label>
              <select className="st">
                <option>Hello</option>
              </select>
            </div>
            <div className="category-hierarchy-wrapper">
              { generateEmptyTable() }
            </div>
          </div>
        }
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
      <div onClick={this.props.gotoFormPage} className={"item " + (this.props.active ? "active": "") + (this.props.ready ? "" : " disabled")}>
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
        userIsModifying: this.userIsModifying.bind(this),



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

      verifyFormPageChange: false, // Whether or not the confirmation window is showing (do you want to go back?)
      nextPageAfterVerification: 0, // The next page after verification complete

      verifySubmitNewProjectForm: false, // Whether the user is ready to submit the new project
      creatingNewProject: false, // Whether the project is currently being created
      creatingNewProjectErrors: null, // Any errors that appear when trying to create the new project
      creatingNewProjectSuccess: false,
      newlyCreatedProjectId: null, // Set when project is created

      userIsModifying: false, // Whether the user is making a modification (to disable the save button). Only used for the hierarchy

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

  userIsModifying(b) {
    this.setState({
      userIsModifying: b,
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
      }, () => {
        console.log(this.state.data, "<data")
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
    
    var d = await _fetch('projects/new/get' + formPage, 'GET', this.props.setErrorCode, false, false, firstLoad ? 0 : 555);



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

    console.log(d, "RES")
    
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

    var post_url = 'projects/new/submit?formPage='

    console.log("THIS STATE DATA IS ", data);

    // Project details is a bit different - we need to upload the details first and then upload the dataset afterwards
    // This is because formidable (in the backend) seems to require the file to be the entire post body, so it has to be 
    // done separately from other data.
    if(this.state.currentFormPageIndex === PROJECT_DETAILS) {

      // Upload name/desc first
      var response = await _fetch(post_url + 'project_details', 'POST', this.props.setErrorCode, data);


      // Don't save the dataset again if it has not changed
      if(!response.errors && !this.state.data.file_metadata) {

        console.log(data.dataset,'xxxx')
        // Then upload the dataset
        var formData = new FormData();
        formData.append('file', data.dataset);

        var response = await _fetch(post_url + 'dataset', 'POST', this.props.setErrorCode, formData, true);
      }

    } else if(this.state.currentFormPageIndex === ENTITY_HIERARCHY) {

      // Convert the JSON tree into 'slash' notation before sending to the back end.
      data = { entity_hierarchy: json2slash({children: data.entity_hierarchy}), hierarchy_preset: data.hierarchy_preset };      
      var response = await _fetch(post_url + 'entity_hierarchy', 'POST', this.props.setErrorCode, data);

    } else if(this.state.currentFormPageIndex === AUTOMATIC_TAGGING) {
      // Then upload the dataset

      if(data.use_automatic_tagging === "yes") {
        var formData = new FormData();
        formData.append('file', data.dataset);

        var response = await _fetch(post_url + 'automatic_tagging', 'POST', this.props.setErrorCode, formData, true);

      // If there was no dataset (i.e. "no" was selected), clear the automatic tagging
      } else {
        var response = await _fetch(post_url + 'automatic_tagging', 'POST', this.props.setErrorCode, { clear_automatic_tagging: true });
      }
      

    } else if(this.state.currentFormPageIndex === ANNOTATORS) {
      var response = await _fetch(post_url + 'annotators', 'POST', this.props.setErrorCode, data);
    } else if(this.state.currentFormPageIndex === PROJECT_OPTIONS) {
      var response = await _fetch(post_url + 'project_options', 'POST', this.props.setErrorCode, data);
    }




    console.log("Response: ", response);

    if(response.errors) {
      this.renderWithErrors(response);
    } else {
      var updated_data = this.state.data;
      if(response.file_metadata) {
        updated_data.file_metadata = response.file_metadata;
      }
      return this.setState({
        data: updated_data,
        formErrors: null,
        isSaved: true,
        saving: false,
        formPageProgress: response.form_page_progress,
      });
        
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
    //var d = await _fetch('projects/new/clear?formPage=' + this.getFormPagePathname(), 'GET', this.props.setErrorCode, false, false, 333);
    //console.log(d);

    var prevIndex = this.state.currentFormPageIndex - 1;

    this.gotoFormPage(prevIndex);
    //this.props.history.push(this.formPages[prevIndex]);
    // await this.setState({
    //   verifyFormPageChange: false,
    //   currentFormPageIndex: prevIndex,      
    //   loading: true,
    //   isSaved: false,
    //   formErrors: null,
    // });
    // this.queryAPI();

    // window.scrollTo({
    //   top: 0,
    //   left: 0,
    // });
  
  }

  // Go to the next form page.
  async gotoNextFormPage() {



    if(this.state.currentFormPageIndex === (this.formPages.length - 1)) return;
    var nextIndex = this.state.currentFormPageIndex + 1;

    this.gotoFormPage(nextIndex);

    // await this.setState({
    //   currentFormPageIndex: nextIndex,
    //   loading: true,
    //   isSaved: false,
    // });
    // this.queryAPI();

    // window.scrollTo({
    //   top: 0,
    //   left: 0,
    // });
  }

  // Close the modal, setting formHelpContent to null.
  handleCloseModal() {
    if(this.state.creatingNewProject) return;
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

  // Jump to the form page at the specified index (e.g. 0 = project details)
  async gotoFormPage(formPageIndex) {


    
    await this.setState({
      currentFormPageIndex: formPageIndex,
      loading: true,
      isSaved: false,
      formErrors: null,
      verifyFormPageChange: false,
    });
    this.queryAPI();
    window.scrollTo({
      top: 0,
      left: 0,
    });
  

    // this.setState({
    //   verifyFormPageChange: true,
    // });
  }

  // Verify that the user wants to go back to the previous page.
  verifyFormPageChange(nextIndex) {

    var wasModified = this.state.wasModified;
    var isSaved = this.state.isSaved;
    if(!wasModified || isSaved) {
      this.gotoFormPage(nextIndex);
      return;
    }
    this.setState({
      verifyFormPageChange: true,     
      nextPageAfterVerification: nextIndex, 
    });
  }

  verifySubmitNewProjectForm() {
    this.setState({
      creatingNewProjectErrors: null,
      verifySubmitNewProjectForm: true,
    });
  }

  async submitNewProjectForm() {
    console.log("SUBMITTING");

    await this.setState({
      creatingNewProject: true,

    })

    var response = await _fetch('projects/new/submitFinal', 'POST', this.props.setErrorCode, {}, false, 1000);
    if(response.errors) {

      console.log(response);
      this.setState({
        creatingNewProjectErrors: response.errors,
        //creatingNewProject: false,
        //verifySubmitNewProjectForm: false,
      })
      return;
    }



    this.setState({
      newlyCreatedProjectId: response.project_id,
      creatingNewProjectSuccess: true,
      creatingNewProjectErrors: null,
      creatingNewProject: false,
      verifySubmitNewProjectForm: false,
    })
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
    if(this.formPages[index] === undefined) return <FormLoadingSkeleton/>
    return this.formPages[index].component();
  }

  checkFormIsComplete() {
    console.log(this.state.formPageProgress);
    for(var fp of this.state.formPageProgress) {
      if(fp !== "saved") {
        return false;
      }
    }
    return true;
  }

  render() {
    //console.log(this.state.data);

    var formIsComplete = this.checkFormIsComplete();
    var lastPage = this.state.currentFormPageIndex === (this.formPages.length - 1);

    if(this.state.currentFormPageIndex) var formPath = this.getFormPagePathname();

    if(this.state.creatingNewProjectSuccess) {
      return <Redirect to={"/projects/" + this.state.newlyCreatedProjectId + "/dashboard"}/>
    }

    return (
      <form id="new-project-form" className={(this.state.formErrors ? "errors" : "") + (this.state.formErrorShake ? "shake" : "") + (this.state.saving ? " saving" : "") + (this.state.loading ? " loading" : "")} ref={this.ref} onSubmit={this.state.isSaved ? null : (e) => this.submitFormPage(e)}  >

        <Modal 
           isOpen={this.state.formHelpContent || this.state.verifyFormPageChange || this.state.verifySubmitNewProjectForm ? true : false}
           contentLabel="Hello there"
           onRequestClose={this.handleCloseModal.bind(this)}
           className={"modal" + (this.state.verifyFormPageChange || this.state.verifySubmitNewProjectForm ? " verify-back" : "")}
           overlayClassName="modal-overlay"
           app={this.ref}

        >
          {
            this.state.verifyFormPageChange
            ? <div>
                <p>You have unsaved changes. {
                  this.state.nextPageAfterVerification === (this.state.currentFormPage - 1)
                  ? "Are you sure you want to go back to the previous page?"
                  : "Are you sure you want to jump to this page?" }
                  </p>
                <div className="verify-back-row">
                  <button className="annotate-button grey-button" onClick={() => this.setState({ verifyFormPageChange: false })}>No</button>
                  <button className="annotate-button" onClick={() => this.gotoFormPage(this.state.nextPageAfterVerification)}>Yes</button>
                </div>
              </div>
            : (this.state.verifySubmitNewProjectForm
              ? ( this.state.creatingNewProject
                ? 
                  <div>
                    { !this.state.creatingNewProjectErrors && <div className="creating-new-project"><i className="fa fa-cog fa-spin"></i>Creating new project...</div>}
                    
                    { this.state.creatingNewProjectErrors && 
                      <div>
                        <div className="form-notice form-errors">
                          <i className="fa fa-times"></i>An unexpected error occured:
                          <ul>
                            {this.state.creatingNewProjectErrors.map((err, index) =>
                              <li>{err.message || JSON.stringify(err)}</li>
                            )}
                          </ul>                          
                        </div>                      
                        <button className="annotate-button grey-button" onClick={() => this.setState({ creatingNewProjectErrors: null, creatingNewProject: false, verifySubmitNewProjectForm: false })}><i className="fa fa-chevron-left"></i>Back</button>
                      </div>
                    }
                  </div>
                : <div>
                    <p>Are you ready to create the project?</p>
                    <div className="verify-back-row">
                      <button className="annotate-button grey-button" onClick={() => this.setState({ verifySubmitNewProjectForm: false })}>No</button>
                      <button className="annotate-button gold-stripey-button" onClick={() => this.submitNewProjectForm()}>Create Project</button>
                    </div> 
                  </div>
                )
              : this.state.formHelpContent
              )
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
                gotoFormPage={this.verifyFormPageChange.bind(this, index)}
                pathname={page.pathname}
                key={index}
                pageProgress={this.state.formPageProgress[index]}
                active={index === this.state.currentFormPageIndex}
                ready={this.state.formPageProgress[index] !== "not_started"}/>
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
                    { this.state.loading && <FormLoadingSkeleton page={formPath}/> }
                   
                </section>
              </CSSTransition>
            </TransitionGroup>

            </div>      
             
        </main> 
        <div className={"new-project-submit-row" + (this.state.userIsModifying ? " disabled" : "")}>
          <div className="container">
            <button type="button" onClick={() => this.verifyFormPageChange((this.state.currentFormPageIndex - 1))} className={"annotate-button new-project-button grey-button" + (this.state.currentFormPageIndex === 0 ? " disabled" : "")}><i className="fa fa-chevron-left"></i>Back</button>
            

           


           
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

              {lastPage 
                ? <button type="button" onClick={() => this.verifySubmitNewProjectForm()}  className={"annotate-button new-project-button gold-stripey-button " + ((this.state.isSaved && formIsComplete) ? "" : "disabled")}>Create Project</button>
                :
                 <button type="button" onClick={() => this.verifyFormPageChange(this.state.currentFormPageIndex + 1)}  className={"annotate-button new-project-button " + (this.state.isSaved ? "" : "disabled")}>Next<i className="fa fa-chevron-right after"></i></button>

              }
              </div> 
          </div>
        </div>
       
      </form>
    )
  }
}
//  { lastPage && <button onClick={() => this.submitFormPage()} className="annotate-button new-project-button">Create project</button> }
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