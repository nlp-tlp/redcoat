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

import Auth from "./functions/Auth"

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


class LoadingScreen extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className={"loading-screen" + (this.props.fadingOut ? " fading-out" : "") }>
        <div className="background background-under"></div>
        <div className="background background-over"></div>
        <span><i className="fa fa-cog fa-spin"></i>Loading...</span>

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

      loading: true,
      loadingFadeOut: false,

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
    window.setTimeout( () => {
    fetch('http://localhost:3000/userData', fetchConfigGET) // TODO: move localhost out
    .then(response => response.text())
    .then((data) => {
      console.log(data);
      var d = JSON.parse(data);

      this.setState({
        user: d.user,
        loading: false,
        loadingFadeOut: true,
      }, () => {
        window.setTimeout(() => this.setState({loadingFadeOut: false}), 500);
      })
    });
  }, 200);
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

    
    this.getUserData();
      


    // The express server will save the username into a cookie so that the front-end client can be 'logged in' immediately.
    // Check if the cookie exists. If not, query the API for the logged in user.
    // API is necessary because it is possible to disable cookies.
    // const username = getCookie('username');
    // if(username !== undefined) {
    //   console.log('Username from cookie:', username)
    //   this.setState({
    //     username: username,
    //   });
    //   return;
    // }
    // console.log("Username not found in cookie, querying API");


  }



  render() {





    return (    

      <div id="app" className={this.state.loading ? "loading" : ""}>
        <BrowserRouter>

          <ScrollToTop/>
          



          { (this.state.loading || this.state.loadingFadeOut) && <LoadingScreen fadingOut={this.state.loadingFadeOut}/>}
          {!this.state.loading &&

            <div className="fade-in">
            <Navbar user={this.state.user} loading={this.state.loading} />  

            <Switch>
            <PrivateRoute user={this.state.user} path="/projects/:id/tagging" render={(p) => 
              <TaggingInterfaceTemplate {...this.state} pageComponent={
                <TaggingInterface 
                  projectTitle={this.state.projectTitle}
                  projectAuthor={this.state.projectAuthor}
                  setProject={this.setProject.bind(this)}
                  project_id={p.match.params.id}
                  user={this.state.user}/>}
                />}
              /> 
            <PrivateRoute user={this.state.user} path="/projects/:id" render={(p) => 
              <ProjectViewTemplate {...this.state} pageTitle="Project View" pageComponent={ 
                <ProjectView
                  project_id={p.match.params.id}
                  setProject={this.setProject.bind(this)}
                  projectTitle={this.state.projectTitle}
                  projectAuthor={this.state.projectAuthor}
                  user={this.state.user} /> }
                />}
              />     


            <PrivateRoute user={this.state.user} path="/projects" render={ () =>
              <MainTemplate {...this.state} pageTitle="Projects" pageComponent={
                <ProjectListPage setProject={this.setProject.bind(this)}/> } />} />    
            

            <PrivateRoute user={this.state.user} path="/setup-project" render={( ) =>
              <MainTemplate {...this.state} pageTitle="Setup project" pageComponent={ 
                <SetupProjectPage/> }
                  />} />  

            <PrivateRoute user={this.state.user} path="/profile"  render={( ) => 
              <MainTemplate {...this.state} pageTitle="User Profile" pageComponent={ 
                <UserProfilePage user={this.state.user} setUserProfileIcon={this.setUserProfileIcon.bind(this)}/> } />} />     



            <Route path="/features" component={ () =>
              <MainTemplate {...this.state} pageTitle="Features" pageComponent={ 
                <FeaturesPage/> } />} />     
            
            <Route exact path="/"   render={( ) =>               
                <HomePage/> } />
            <Route                  render={( ) => 
              <MainTemplate {...this.state} pageTitle="" pageComponent={ 
                <Error404Page/> } />} /> />



          </Switch>

          </div>
        }


            
        </BrowserRouter>
        {!this.state.loading && <Footer/>}
      </div>      
    );
  }
}



/*

    var publicRoutes = [

      {
        path: "/projects/:id/tagging",
        template: TaggingInterfaceTemplate,
        component: TaggingInterface,
        componentProps: {
          projectTitle: this.state.projectTitle,
          projectAuthor: this.state.projectAuthor,
          setProject: this.setProject.bind(this),
          project_id: p.match.params.id,
          user: this.state.user,
        }
      },
      {
        path: "/projects/:id/tagging",
        template: MainTemplate,
        component: ProjectListPage,
        componentProps: {
          setProject: this.setProject.bind(this),
        }
      }
    ];

*/

const PrivateRoute = ({ component: Component, ...rest }) => (
  <Route {...rest} render={(p) => {
    var {user, ...other} = rest;
    return rest.user
      ? rest.render(p)
      : <Redirect to='/login' />
  
  }
  } />
)



export default App;

// Old code
/* 
<div className="submit-annotations-container">
  <button className="submit-annotations-button" onClick={this.submitAnnotations.bind(this)}>Submit annotations <i className="fa fa-chevron-right"></i></button>
</div>
*/