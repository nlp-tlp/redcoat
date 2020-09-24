import React from "react";
import {Component} from "react";
import { Redirect, Link, BrowserRouter, Route, Switch, withRouter } from 'react-router-dom'
import Modal from 'react-modal';

import { TransitionGroup, CSSTransition } from "react-transition-group";
import Error404Page from '../pages/Error404Page';

Modal.setAppElement('body')


class SetupProjectFormHelpIcon extends Component {
  constructor(props) {
    super(props);
  }


  render() {
    return (
      <span className="form-help" onClick={this.props.onClick} ><i className="fa fa-info-circle fa-xxs"></i></span>
    )
  }
}

class SetupProjectDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projectName: '',
      projectDescription: '',
    }
  }

  updateProjectName(e) {
    var value = e.target.value;
    if(value.trim().length === 0) value = '';
    this.setState({
      projectName: value,
    });
  }

  updateProjectDescription(e) {
    var value = e.target.value;
    if(value.trim().length === 0) value = '';
    this.setState({
      projectDescription: value,
    });
  }

  render() {

    var dataHelp = (<div>
        <h2>Data</h2>
        <p>Please upload your data using the form below.</p>
        <p>The dataset must be saved as a .txt file. Each token within your data must be separated by a space, and each document must be on a new line.</p>
      </div>
    )


    return (
      <div>

        <div className="flex-columns flex-columns-2">

          <div className="flex-column">
            <h2>Project details</h2>
            <div className="form-group">
              <label>Project name</label>
              <input placeholder="Project name" value={this.state.projectName} onChange={(e) => this.updateProjectName(e)}></input>
            </div>
            <div className="form-group">
              <label>Project description (optional)</label>
              <textarea placeholder="Project description" value={this.state.projectDescription} onChange={(e) => this.updateProjectDescription(e)}></textarea>
            </div>

          </div>
          <div className="flex-column">
            <h2>Data <SetupProjectFormHelpIcon onClick={() => this.props.toggleFormHelp(dataHelp)} /></h2>
            

            <div className="upload-form-container">
              <div className="upload-form"></div>

            </div>
          </div>
        </div>


      </div>
    )
  }
}

class SetupProjectEntityHierarchy extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <h2>Entity Hierarchy</h2>
        <p>Please determine the entity categories in your data using the form below.</p>
      </div>
    )
  }
}

class SetupProjectAutomaticTagging extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <h2>Automatic Tagging</h2>
        <p>Redcoat can automatically annotate terms according to a dictionary, helping to save annotation time. These annotations can be adjusted by your annotators when necessary.</p>
      </div>
    )
  }
}


class SetupProjectAnnotators extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <h2>Annotators</h2>
        <p></p>
      </div>
    )
  }
}


class SetupProjectProjectOptions extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <h2>Project Options</h2>
        <p></p>
      </div>
    )
  }
}



class SetupProjectHeaderItem extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className={"item " + (this.props.currentPathname === this.props.pathname ? "active": "") + (this.props.ready ? "" : " disabled")}><Link to={this.props.pathname}>{this.props.name}</Link></div>
    )
  }
}

class SetupProjectPage extends Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.state = {
      loading: false,
      data: {},


      formPages: [
        {
          name: "Project details & data",
          pathname: "/projects/new",
          ready: true,
        },
        {
          name: "Entity hierarchy",
          pathname: "/projects/new/entity-hierarchy",
          ready: true,
        },
        {
          name: "Automatic tagging",
          pathname: "/projects/new/automatic-tagging",
          ready: false,
        },
        {
          name: "Annotators",
          pathname: "/projects/new/annotators",
          ready: false,
        },
        {
          name: "Project options",
          pathname: "/projects/new/project-options",
          ready: false,
        },
      ],

      currentFormPageIndex: 0,

      formHelpContent: null,
    }

    

  }

  componentDidMount() {
    this.updateCurrentFormPageIndex();
  }

  componentDidUpdate(prevProps) {    
    if(this.props.location !== prevProps.location) {
      this.updateCurrentFormPageIndex();
    }
  }

  toggleFormHelp(formHelpContent) {
    this.setState({
      formHelpContent: formHelpContent,
    })
  }

  updateCurrentFormPageIndex() {  
    var location = this.props.location;
    var currentPathname = location.pathname;

    this.setState({
      currentFormPageIndex: this.getFormPageIndex(currentPathname),
    }, () => {
      console.log(this.state.currentFormPageIndex)
    })
  }

  // Get the name, pathname and ready JSON obj from this.state.formPages that correspond to the current path name.
  getFormPageIndex(currentPathname) {
    console.log(currentPathname)
    for(var i in this.state.formPages) {
      var formPage = this.state.formPages[i];
      if(currentPathname === formPage.pathname) return parseInt(i);
    }
  }

  submitFormPage() {
    this.gotoNextFormPage();
  }

  gotoPrevFormPage() {
    if(this.state.currentFormPageIndex === 0) return;
    var prevIndex = this.state.currentFormPageIndex - 1;
    this.props.history.push(this.state.formPages[prevIndex]);
  }

  gotoNextFormPage() {
    if(this.state.currentFormPageIndex === (this.state.formPages.length - 1)) return;
    var nextIndex = this.state.currentFormPageIndex + 1;
    this.props.history.push(this.state.formPages[nextIndex]);
  }

  handleCloseModal() {
    this.setState({
      formHelpContent: null,
    })
  }

  render() {
    var location = this.props.location;    
    var currentPathname = location.pathname;    

    var lastPage = this.state.currentFormPageIndex === (this.state.formPages.length - 1);



    return (
      <div id="new-project-form" ref={this.ref} >

        <Modal 
           isOpen={this.state.formHelpContent ? true : false}
           contentLabel="Hello there"
           onRequestClose={this.handleCloseModal.bind(this)}
           className="modal"
           overlayClassName="modal-overlay"
           app={this.ref}
        >
          {this.state.formHelpContent}
        </Modal>


        <header className="bg-header">
          <div id="header-project-details" className="title">
            <h1>New project</h1>
          </div>
        </header>
        
        <header className="new-project-header">
          <div className="container flex-container">
            { this.state.formPages.map((page, index) => 
              <SetupProjectHeaderItem name={page.name} pathname={page.pathname} currentPathname={currentPathname} ready={page.ready}/>
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
                    <SetupProjectEntityHierarchy loading={this.state.loading} data={this.state.data.entity_hierarchy} />} /> 
                  <Route path="/projects/new/automatic-tagging" render={() =>
                    <SetupProjectAutomaticTagging loading={this.state.loading} data={this.state.data.automatic_tagging} />} /> 
                  <Route path="/projects/new/annotators" render={() =>
                    <SetupProjectAnnotators loading={this.state.loading} data={this.state.data.annotators} />} />
                  <Route path="/projects/new/project-options" render={() =>
                    <SetupProjectProjectOptions loading={this.state.loading} data={this.state.data.project_options}  />} />
                  <Route exact path="/projects/new" render={() =>
                    <SetupProjectDetails loading={this.state.loading} data={this.state.data.project_details} toggleFormHelp={this.toggleFormHelp.bind(this)} />} /> 
                  <Route render={() => <Error404Page />} />   
                </Switch>
              </section>
            </CSSTransition>
          </TransitionGroup>
          </div>          
        </main> 
        <div className="new-project-submit-row">
          <div className="container">
            <button onClick={() => this.gotoPrevFormPage()} className={"annotate-button new-project-button grey-button" + (this.state.currentFormPageIndex === 0 ? " disabled" : "")}><i className="fa fa-chevron-left"></i>Back</button>
            

            { lastPage && <button onClick={() => this.submitFormPage()} className="annotate-button new-project-button">Create project</button> }
            { !lastPage && 
            <button onClick={() => this.submitFormPage()} className="annotate-button new-project-button">Save & Next<i className="fa fa-chevron-right after"></i></button> }
          </div>
        </div>
       
      </div>
    )
  }
}

export default withRouter(SetupProjectPage);