import React from 'react';

import './stylesheets/stylesheet.scss';
import {Component} from 'react';

import { Redirect, Link, BrowserRouter, Route, Switch } from 'react-router-dom'

import getCookie from './functions/getCookie';

import ScrollToTop from './functions/ScrollToTop';

import Container from './Container';
import Navbar from './components/Navbar';

import TaggingInterface from './pages/TaggingInterface';
import FeaturesPage from './pages/FeaturesPage';
import ProjectListPage from './pages/ProjectListPage';
import ProjectView from './pages/ProjectView';
import HomePage from './pages/HomePage';
import Error404Page from './pages/Error404Page';
import SetupProjectPage from './pages/SetupProjectPage';

// Config for all API fetch requests
const fetchConfigGET = {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};


// A template component that renders the majority of the pages.
class MainTemplate extends Component {

  constructor(props) {
    super(props);
  }

  render() {

    return (
      <div>
        
        <header className="bg-header">
            <div id="header-project-details" className="title">
              <h1>{this.props.pageTitle}</h1>
            </div>
          </header>
        <main className="container">
          { this.props.pageComponent }
        </main>
      </div>
    )
  }
}




// A template component for the tagging interface, which is almost the same as MainTemplate but without the <main> container.
class TaggingInterfaceTemplate extends Component {

  constructor(props) {
    super(props);
  }

  render() {

    return (
      <div>
        { this.props.pageComponent }
      </div>
    )
  }
}







// A template component for the project dashboard.
class ProjectViewTemplate extends Component {

  constructor(props) {
    super(props);
  }

  render() {

    return (
      <div>
        { this.props.pageComponent }
      </div>
    )
  }
}

// The app, which routes everything and renders the pages.
class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      pageTitle: "Redcoat",
      username: null,
    }
  }

  // When mounted, determine the logged in user.
  componentWillMount() {

    // The express server will save the username into a cookie so that the front-end client can be 'logged in' immediately.
    // Check if the cookie exists. If not, query the API for the logged in user.
    // API is necessary because it is possible to disable cookies.
    const username = getCookie('username');
    if(username !== undefined) {
      console.log('Username from cookie:', username)
      this.setState({
        username: username,
      });
      return;
    }
    console.log("Username not found in cookie, querying API");


    this.setState({
      loading: true,

    }, () => {

      window.setTimeout( () => {

      fetch('http://localhost:3000/pageData', fetchConfigGET) // TODO: move localhost out
      .then(response => response.text())
      .then((data) => {
        console.log(data);
        var d = JSON.parse(data);
        this.setState({
          username: d.username,
          loading: false
        })
      }); 
    }, 1);
    });
  }



  render() {
    return (    

      <div id="app" className={this.state.loading ? "loading" : ""}>
        <BrowserRouter>

          <ScrollToTop/>
          <Navbar username={this.state.username} />          

          <Switch>
          <Route        path="/projects/:id/tagging"  render={(p) => <TaggingInterfaceTemplate {...this.state} pageComponent={<TaggingInterface project_id={p.match.params.id} />}/>} /> 
          <Route        path="/projects/:id"          render={(p) => <ProjectViewTemplate {...this.state} pageTitle="Project View" pageComponent={ <ProjectView project_id={p.match.params.id}/> } />} />     
          <Route        path="/projects"              render={( ) => <MainTemplate {...this.state} pageTitle="Projects" pageComponent={ <ProjectListPage/> } />} />     
          <Route        path="/setup-project"         render={( ) => <MainTemplate {...this.state} pageTitle="Setup project" pageComponent={ <SetupProjectPage/> } />} />     

          <Route        path="/features"              render={( ) => <MainTemplate {...this.state} pageTitle="Features" pageComponent={ <FeaturesPage/> } />} />     
          <Route  exact path="/"                      render={( ) => <MainTemplate {...this.state} pageTitle="" pageComponent={ <HomePage/> } />} />
          <Route                                      render={( ) => <MainTemplate {...this.state} pageTitle="" pageComponent={ <Error404Page/> } />} /> />
        </Switch>


            
        </BrowserRouter>
      </div>      
    );
  }
}






export default App;

// Old code
/* 
<div className="submit-annotations-container">
  <button className="submit-annotations-button" onClick={this.submitAnnotations.bind(this)}>Submit annotations <i className="fa fa-chevron-right"></i></button>
</div>
*/