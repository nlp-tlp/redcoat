import React from 'react';
import {Component} from 'react';
import { PieChart } from 'react-minimal-pie-chart';
import { Redirect, Link, BrowserRouter, Route, Switch, withRouter } from 'react-router-dom'
import { TransitionGroup, CSSTransition } from "react-transition-group";

class ProjectDashboard extends Component {
  constructor(props) {
    super(props);
  }


  componentWillMount() {

    // Query api for project

  }



  render() {
    return (
     
      <div id="projects-dashboard">
        <div className="dashboard-key-items">
          <div className="dashboard-item">
            <div className="flex-wrapper">
              <div>
                <div className="name"># Annotated</div>
                <div className="value">727 / 1300</div>
              </div>

              <div class="pieChart">
                <PieChart
                  data={[
                    { value: 727, color: "rgb(109, 201, 34)"},
                    { value: 1300-727, color: "rgba(0, 0, 0, 0)"}, // sneaky 
                  ]}
                  background={"#d5d5d5"}
                  animate={true}
                  animationDuration={500}
                  lineWidth={18}
                  startAngle={270}
                />
              </div>
            </div>

          </div>
          <div className="dashboard-item">
            <div className="name">Avg. agreement</div>
            <div className="value">0.6</div>
          </div>
          <div className="dashboard-item">
            <div className="name">Avg. time per document</div>
            <div className="value">15 sec</div>
          </div>
        </div>

        <div className="dashboard-white-boxes">
          <div className="dashboard-item col-2">
            <div className="inner">
              <h3>Activity</h3>
              <p>Hello I am an activity graph</p>
            </div>
          </div>
          <div className="dashboard-item col-1">
            <div className="inner">
              <h3>Annotator agreement</h3>
              <p>0.3 :(</p>
            </div>
          </div>
          <div className="dashboard-item col-1">
            <div className="inner">
              <h3>Something else</h3>
              <p>bip</p>
            </div>
          </div>
          <div className="dashboard-item col-2">
            <div className="inner">
              <h3>Noot noot</h3>
              <p>it's pingu</p>
            </div>
          </div>
        </div>



      </div>    
      
    )
  }
}



class ProjectViewSidenav extends Component {
  constructor(props) {
    super(props);
  }



  render() {
    /* old 
    <div className="project-card">
      <div className="project-icon"><div className="inner">PO</div></div>
      <div>
        <div className="project-name">Project one</div>
        <div className="project-creator">Created by <span className="creator-name">someone</span></div>
      </div>
    </div>



    <div className="go-back"><Link to="/projects"><i class="fa fa-chevron-left"></i>Projects</Link></div>

    */

    return (
      <nav id="project-view-sidenav">

        
        

        <ul className="sidenav-items">
          <ProjectViewSidenavButton {...this.props} name="Dashboard" icon="bar-chart"/>
          <ProjectViewSidenavButton {...this.props} name="Annotations" icon="list-alt"/>
          <ProjectViewSidenavButton {...this.props} name="Category hierarchy" icon="tree"/>
          <ProjectViewSidenavButton {...this.props} name="Invitations" icon="envelope"/>
          <ProjectViewSidenavButton {...this.props} name="Settings" icon="wrench"/>
        </ul>

      </nav>
    )
  }
}

class ProjectViewSidenavButton extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <li className={this.props.view === this.props.name ? "active" : ""}>
        <Link to={"/projects/" + this.props.project_id + "/" + this.props.name.replace(" ", "-").toLowerCase()}><i className={"fa fa-" + this.props.icon}></i>{ this.props.name }</Link>
      </li>
    )
  }
}

class EmptyThing extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return ( <div>Hello I am empty lol</div> )
  }
}

class ProjectView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      view: "Dashboard",
      projectTitle: "Project one"
    }
  }

  // Set the view of the ProjectView to the specified view.
  setView(view) {
    this.setState({
      view: view,
    })
  }

  render() {

    var location = this.props.location;
    var currentView;
    switch(this.state.view) {
      case "Dashboard": currentView = <ProjectDashboard project_id={this.props.project_id} />; break;
    }

    return (
      <div>
        <header className="bg-header">
            <div id="header-project-details" className="title">
              <h1>{this.state.projectTitle}</h1>
            </div>
          </header>
        <div id="project-view">
          <ProjectViewSidenav project_id={this.props.project_id} view={this.state.view} setView={this.setView.bind(this)}/>


          <TransitionGroup className="transition-group">
          <CSSTransition
          key={location.key}
          timeout={{ enter: 300, exit:300 }}
          classNames="fade"
          >

            <section className="route-section">
              <Route path="/projects/:id/dashboard"           render={(p) => <ProjectDashboard {...this.state} />} />     
              <Route path="/projects/:id/annotations"         render={(p) => <EmptyThing {...this.state} />} />     
              <Route path="/projects/:id/category-hierarchy"  render={(p) => <EmptyThing {...this.state} />} />     
              <Route path="/projects/:id/invitations"         render={(p) => <EmptyThing {...this.state} />} />     
              <Route path="/projects/:id/settings"            render={(p) => <EmptyThing {...this.state} />} />   
            </section>  
          </CSSTransition>
          </TransitionGroup>

        </div>     
      </div>
    )
  }
}


export default withRouter(ProjectView);