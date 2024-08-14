import React from "react";

import "./stylesheets/stylesheet.scss";
import { Component } from "react";

import { Redirect, Link, BrowserRouter, Route, Switch } from "react-router-dom";
import BASE_URL from "./globals/base_url";

import getCookie from "./functions/getCookie";

import ScrollToTop from "./functions/ScrollToTop";

// Components
import Navbar from "./views/SharedComponents/Navbar";

// Views
import TaggingInterfaceView from "./views/TaggingInterfaceView";
import FeaturesPage from "./views/FeaturesPage";
import ProjectListView from "./views/ProjectListView";
import ProjectView from "./views/ProjectView";
import HomeView from "./views/HomeView";
import NewProjectView from "./views/NewProjectView";
import UserProfileView from "./views/UserProfileView";

// Error views
import Error401Redirect from "./views/Errors/Error401Redirect";
import Error404Page from "./views/Errors/Error404Page";
import Error403Page from "./views/Errors/Error403Page";
import Error500Page from "./views/Errors/Error500Page";

import ErrorClearer from "./views/SharedComponents/ErrorClearer";

import redcoatMan from "./images/redcoat-1-grey.png";

import _fetch from "./functions/_fetch";

// Config for all API fetch requests
const fetchConfigGET = {
  method: "GET",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  credentials: "include",
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
        <main className="container">{this.props.pageComponent}</main>
      </div>
    );
  }
}

// A template component that renders the majority of the pages.
class ProjectListTemplate extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <header className="bg-header">
          <div id="header-project-details" className="title">
            <h1>{this.props.pageTitle}</h1>
            <div class="right">
              <Link className="button" to={BASE_URL + "projects/new"}>
                <i class="fa fa-plus-circle"></i>New project
              </Link>
            </div>
          </div>
        </header>
        <main className="container">{this.props.pageComponent}</main>
      </div>
    );
  }
}

// A template component for the tagging interface, which is almost the same as MainTemplate but without the <main> container.
class TaggingInterfaceTemplate extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <div>{this.props.pageComponent}</div>;
  }
}

class LoadingScreen extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div
        className={
          "loading-screen" + (this.props.fadingOut ? " fading-out" : "")
        }
      >
        <div className="background background-under"></div>
        <div className="background background-over"></div>
        <span>
          <i className="fa fa-cog fa-spin"></i>Loading...
        </span>
      </div>
    );
  }
}

// A template component for the project dashboard.
class ProjectViewTemplate extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return <div>{this.props.pageComponent}</div>;
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
    );
  }
}

class Logout extends Component {
  constructor(props) {
    super(props);
  }

  componentWillMount() {
    this.props.logout();
  }

  render() {
    return <Redirect to={BASE_URL} />;
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
    };
  }

  clearErrorCode() {
    this.setState({
      errorCode: null,
    });
  }

  setErrorCode(errorCode) {
    this.setState(
      {
        errorCode: errorCode,
        user: errorCode === 401 ? null : this.state.user, // Delete user info if 401, which means user is not logged in
      },
      () => {
        console.log(this.state.user, this.state.errorCode);
      },
    );
  }

  // Update the project title and author
  setProject(title, author) {
    this.setState({
      projectTitle: title,
      projectAuthor: author,
    });
  }

  async getUserData() {
    var d = await _fetch(
      "users/userData",
      "GET",
      this.setErrorCode.bind(this),
      555,
    );

    await this.setState({
      user: d.user,
      loading: false,
      loadingFadeOut: true,
    });

    window.setTimeout(() => this.setState({ loadingFadeOut: false }), 500);
  }

  // set the data for the currently logged-in user
  // Called by the homepage (after logging in)
  setUserData(user) {
    this.setState({
      user: user,
    });
  }

  // Log out.
  async logout() {
    if (!this.state.user) return;
    await this.setState({
      user: null,
      //loggingOut: true,
    });

    var d = await _fetch("users/logout", "GET", this.setErrorCode.bind(this));

    this.setState({
      user: null,
    });
  }

  // Update this component's user profile icon.
  setUserProfileIcon(profileIcon) {
    var user = this.state.user;
    user.profile_icon = profileIcon;
    console.log(profileIcon);
    this.setState({
      user: user,
    });
  }

  async acceptInvitation(index) {
    console.log("accept");
    var invitations = this.state.user.project_invitations;

    invitations[index].pending = true;
    await this.setState({
      invitations: invitations,
    });

    var invitation_id = invitations[index]._id;
    var d = await _fetch(
      "projects/invitations/" + invitation_id + "/accept",
      "POST",
      this.setErrorCode,
      {},
      null,
      555,
    );

    invitations[index].accepted = true;
    invitations[index].pending = false;
    this.setState({
      invitations: invitations,
    });
  }

  async declineInvitation(index) {
    console.log("decline");
    var invitations = this.state.user.project_invitations;

    invitations[index].pending = true;
    await this.setState({
      invitations: invitations,
    });

    var invitation_id = invitations[index]._id;
    var d = await _fetch(
      "http://localhost:3000/api/projects/invitations/" +
        invitation_id +
        "/decline",
      "POST",
      this.setErrorCode,
      {},
      null,
      555,
    );

    invitations[index].declined = true;
    invitations[index].pending = false;
    this.setState({
      invitations: invitations,
    });
  }

  // When mounted, determine the logged in user.
  componentWillMount() {
    this.getUserData();
  }

  render() {
    return (
      <div
        id="app"
        className={
          (this.state.loading ? "loading" : "") +
          (this.state.loggingOut ? " logging-out" : "")
        }
      >
        <BrowserRouter>
          <ScrollToTop />

          <ErrorClearer clearErrorCode={this.clearErrorCode.bind(this)} />

          {(this.state.loading || this.state.loadingFadeOut) && (
            <LoadingScreen fadingOut={this.state.loadingFadeOut} />
          )}

          {!this.state.loading && (
            <div className="fade-in">
              <Navbar
                user={this.state.user}
                loading={this.state.loading}
                acceptInvitation={this.acceptInvitation.bind(this)}
                declineInvitation={this.declineInvitation.bind(this)}
              />

              {!this.state.errorCode && (
                <Switch>
                  <PrivateRoute
                    user={this.state.user}
                    path={BASE_URL + "projects/:id/tagging"}
                    render={(p) => (
                      <TaggingInterfaceTemplate
                        {...this.state}
                        pageComponent={
                          <TaggingInterfaceView
                            projectTitle={this.state.projectTitle}
                            projectAuthor={this.state.projectAuthor}
                            setProject={this.setProject.bind(this)}
                            project_id={p.match.params.id}
                            user={this.state.user}
                            setErrorCode={this.setErrorCode.bind(this)}
                          />
                        }
                      />
                    )}
                  />
                  <PrivateRoute
                    user={this.state.user}
                    path={BASE_URL + "projects/new"}
                    render={() => (
                      <NewProjectView
                        setErrorCode={this.setErrorCode.bind(this)}
                      />
                    )}
                  />
                  <PrivateRoute
                    user={this.state.user}
                    path={BASE_URL + "projects/:id"}
                    render={(p) => (
                      <ProjectViewTemplate
                        {...this.state}
                        pageTitle="Project View"
                        pageComponent={
                          <ProjectView
                            project_id={p.match.params.id}
                            setProject={this.setProject.bind(this)}
                            projectTitle={this.state.projectTitle}
                            projectAuthor={this.state.projectAuthor}
                            user={this.state.user}
                            setErrorCode={this.setErrorCode.bind(this)}
                          />
                        }
                      />
                    )}
                  />
                  <PrivateRoute
                    user={this.state.user}
                    path={BASE_URL + "projects"}
                    render={() => (
                      <ProjectListTemplate
                        {...this.state}
                        pageTitle="Projects"
                        pageComponent={
                          <ProjectListView
                            setProject={this.setProject.bind(this)}
                            setErrorCode={this.setErrorCode.bind(this)}
                          />
                        }
                      />
                    )}
                  />
                  <PrivateRoute
                    user={this.state.user}
                    path={BASE_URL + "profile"}
                    render={() => (
                      <MainTemplate
                        {...this.state}
                        pageTitle="User Profile"
                        pageComponent={
                          <UserProfileView
                            user={this.state.user}
                            setUserProfileIcon={this.setUserProfileIcon.bind(
                              this,
                            )}
                            setErrorCode={this.setErrorCode.bind(this)}
                          />
                        }
                      />
                    )}
                  />
                  <Route
                    path={BASE_URL + "features"}
                    component={() => (
                      <MainTemplate
                        {...this.state}
                        pageTitle="Features"
                        pageComponent={<FeaturesPage />}
                      />
                    )}
                  />
                  <Route
                    path={BASE_URL + "logout"}
                    render={() => <Logout logout={this.logout.bind(this)} />}
                  />
                  <Route
                    path={BASE_URL}
                    render={() =>
                      this.state.user && !this.state.loggingOut ? (
                        <Redirect to={BASE_URL + "projects"} />
                      ) : (
                        <HomeView
                          setUserData={this.setUserData.bind(this)}
                          setErrorCode={this.setErrorCode.bind(this)}
                        />
                      )
                    }
                  />
                  <Route
                    render={() => (
                      <MainTemplate
                        {...this.state}
                        pageTitle=""
                        pageComponent={<Error404Page />}
                      />
                    )}
                  />{" "}
                  />
                </Switch>
              )}

              {this.state.errorCode === 401 && (
                <Error401Redirect
                  clearErrorCode={this.clearErrorCode.bind(this)}
                />
              )}
              {this.state.errorCode === 403 && <Error403Page />}
              {this.state.errorCode === 404 && <Error404Page />}
              {this.state.errorCode === 500 && <Error500Page />}
            </div>
          )}
        </BrowserRouter>

        {!this.state.loading && <Footer />}
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
  <Route
    {...rest}
    render={(p) => {
      var { user, ...other } = rest;
      return rest.user ? rest.render(p) : <Redirect to={BASE_URL + "login"} />;
    }}
  />
);

export default App;

// Old code
/* 
<div className="submit-annotations-container">
  <button className="submit-annotations-button" onClick={this.submitAnnotations.bind(this)}>Submit annotations <i className="fa fa-chevron-right"></i></button>
</div>
*/
