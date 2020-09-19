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
import Error403Page from './pages/Error403Page';
import Error401Redirect from './pages/Error401Redirect';
import ErrorClearer from './components/ErrorClearer';
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
  },
  credentials: 'include',
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

class Logout extends Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    this.props.logout()    
  }

  render() {
    return (<Redirect to="/"/>)
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

      loggingOut: false,

      user: null, // stores 'username' and 'profile icon'

      errorCode: null, // 401, 403, 404 etc
    }
  }

  clearErrorCode() {
    this.setState({
      errorCode: null,
    })
  }

  setErrorCode(errorCode) {
    this.setState({
      errorCode: errorCode,
      user: errorCode === 401 ? null : this.state.user, // Delete user info if 401, which means user is not logged in
    }, () => {
      console.log(this.state.user, this.state.errorCode);
    })
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
    fetch('http://localhost:3000/api/users/userData', fetchConfigGET) // TODO: move localhost out
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

  // set the data for the currently logged-in user
  // Called by the homepage (after logging in)
  setUserData(user) {
    this.setState({
      user: user,
    })
  }

  // Log out.
  async logout() {
    if(!this.state.user) return;
    await this.setState({
      user: null,
      //loggingOut: true,
    });

    window.setTimeout( () => 

    fetch('http://localhost:3000/api/users/logout', fetchConfigGET)
    .then(response => response.text())
    .then((data) => {
      console.log("Logged out")
      this.setState({
        //loggingOut: false,
        user: null,
      })
    }), 2);    
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
  }

  render() {

    return (    

      <div id="app" className={(this.state.loading ? "loading" : "") + (this.state.loggingOut ? " logging-out" : "")}>
        

        <BrowserRouter>

          <ScrollToTop/>
          

          <ErrorClearer clearErrorCode={this.clearErrorCode.bind(this)}/>

          { (this.state.loading || this.state.loadingFadeOut) && <LoadingScreen fadingOut={this.state.loadingFadeOut}/>}

          {!this.state.loading && 

            <div className="fade-in">
              <Navbar user={this.state.user} loading={this.state.loading} />  

              {!this.state.errorCode && <Switch>
              <PrivateRoute user={this.state.user} path="/projects/:id/tagging" render={(p) => 
                <TaggingInterfaceTemplate {...this.state} pageComponent={
                  <TaggingInterface 
                    projectTitle={this.state.projectTitle}
                    projectAuthor={this.state.projectAuthor}
                    setProject={this.setProject.bind(this)}
                    project_id={p.match.params.id}
                    user={this.state.user}

                    setErrorCode={this.setErrorCode.bind(this)}

                    />}

                    
                  />}
                /> 
              <PrivateRoute user={this.state.user} path="/projects/:id" render={(p) => 
                <ProjectViewTemplate {...this.state} pageTitle="Project View" pageComponent={ 
                  <ProjectView
                    project_id={p.match.params.id}
                    setProject={this.setProject.bind(this)}
                    projectTitle={this.state.projectTitle}
                    projectAuthor={this.state.projectAuthor}
                    user={this.state.user} 

                    setErrorCode={this.setErrorCode.bind(this)}

                    /> }

                    
                  />}
                />     


              <PrivateRoute user={this.state.user} path="/projects" render={ () =>
                <MainTemplate {...this.state} pageTitle="Projects" pageComponent={
                  <ProjectListPage setProject={this.setProject.bind(this)} setErrorCode={this.setErrorCode.bind(this)}/> } />} />    
              

              <PrivateRoute user={this.state.user} path="/setup-project" render={( ) =>
                <MainTemplate {...this.state} pageTitle="Setup project" pageComponent={ 
                  <SetupProjectPage/> }
                    />} />  

              <PrivateRoute user={this.state.user} path="/profile"  render={( ) => 
                <MainTemplate {...this.state} pageTitle="User Profile" pageComponent={ 
                  <UserProfilePage user={this.state.user} setUserProfileIcon={this.setUserProfileIcon.bind(this)} setErrorCode={this.setErrorCode.bind(this)}/> } />} />     



              <Route path="/features" component={ () =>
                <MainTemplate {...this.state} pageTitle="Features" pageComponent={ 
                  <FeaturesPage/> } />} />     
              
              <Route path="/logout" render={ () => <Logout logout={this.logout.bind(this)}/> } />
              <Route path="/"   render={( ) =>            
                  this.state.user && !this.state.loggingOut
                  ? <Redirect to="/projects"/>
                  : <HomePage setUserData={this.setUserData.bind(this)}/> }  />
              <Route                  render={( ) => 
                <MainTemplate {...this.state} pageTitle="" pageComponent={ 
                  <Error404Page/> } />} /> />





            </Switch> }

            { this.state.errorCode === 401 && <Error401Redirect clearErrorCode={this.clearErrorCode.bind(this)}/> }    
            { this.state.errorCode === 403 && <Error403Page/> } 

            

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