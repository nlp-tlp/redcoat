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
import UserProfilePage from './pages/UserProfilePage';

import redcoatMan from './images/redcoat-1-grey.png'

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

class Footer extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <footer>
        <div className="footer-logo"></div>
        <h2>Redcoat</h2>
        <p>Built by the NLP-TLP team at UWA.</p>

      </footer>

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

      // Store the current project title and author so that they don't awkwardly reload between component changes
      projectTitle: null,
      projectAuthor: null,

      setProject: this.setProject.bind(this),

      user: null, // stores 'username' and 'profile icon'
    }
  }

  // Update the project title and author
  setProject(title, author) {
    this.setState({
      projectTitle: title,
      projectAuthor: author,
    })
  }

  getUserData() {
    fetch('http://localhost:3000/userData', fetchConfigGET) // TODO: move localhost out
    .then(response => response.text())
    .then((data) => {
      console.log(data);
      var d = JSON.parse(data);
      this.setState({
        user: {
          username: d.username,
          profile_icon: d.profile_icon,
        },
        loading: false
      })
    });
  }

  // Update this component's user profile icon.
  setUserProfileIcon(profileIcon) {
    var user = this.state.user;
    user.profile_icon = profileIcon;
    console.log(profileIcon);
    this.setState({
      user: user,
    })

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
      this.getUserData();
      

    });
  }



  render() {
    return (    

      <div id="app" className={this.state.loading ? "loading" : ""}>
        <BrowserRouter>

          <ScrollToTop/>
          <Navbar user={this.state.user} />          

          <Switch>
          <Route        path="/projects/:id/tagging"  render={(p) => <TaggingInterfaceTemplate {...this.state} pageComponent={<TaggingInterface projectTitle={this.state.projectTitle} projectAuthor={this.state.projectAuthor} setProject={this.setProject.bind(this)} project_id={p.match.params.id} user={this.state.user} />}/>} /> 
          <Route        path="/projects/:id"          render={(p) => <ProjectViewTemplate {...this.state} pageTitle="Project View" pageComponent={ <ProjectView project_id={p.match.params.id} setProject={this.setProject.bind(this)}  projectTitle={this.state.projectTitle} projectAuthor={this.state.projectAuthor} user={this.state.user} /> }  />} />     
          <Route        path="/projects"              render={( ) => <MainTemplate {...this.state} pageTitle="Projects" pageComponent={ <ProjectListPage setProject={this.setProject.bind(this)}/> } />} />     
          <Route        path="/setup-project"         render={( ) => <MainTemplate {...this.state} pageTitle="Setup project" pageComponent={ <SetupProjectPage/> } />} />     

          <Route        path="/features"              render={( ) => <MainTemplate {...this.state} pageTitle="Features" pageComponent={ <FeaturesPage/> } />} />     
          <Route        path="/profile"               render={( ) => <MainTemplate {...this.state} pageTitle="User Profile" pageComponent={ <UserProfilePage user={this.state.user} setUserProfileIcon={this.setUserProfileIcon.bind(this)}/> } />} />     
          <Route  exact path="/"                      render={( ) => <MainTemplate {...this.state} pageTitle="" pageComponent={ <HomePage/> } />} />
          <Route                                      render={( ) => <MainTemplate {...this.state} pageTitle="" pageComponent={ <Error404Page/> } />} /> />
        </Switch>


            
        </BrowserRouter>
        <Footer/>
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