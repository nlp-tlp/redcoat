import React from 'react';
import {Component} from 'react';
import { PieChart } from 'react-minimal-pie-chart';


class ProjectDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,

      data: {
        numDocGroupsAnnotated: 999,
        totalDocGroups: 9999,

        avgAgreement: 0.5,

        avgTimePerDocument: 15,
      }
    }
  }


  componentWillMount() {
    var t = this;
    window.setTimeout(() => {


    
    t.setState({
      loading: false,
      data: {
        numDocGroupsAnnotated: 700,
        totalDocGroups: 1200,

        avgAgreement: 0.5,
        avgTimePerDocument: 15,
      }
      
    })
    }, 100);
    // Query api for project

  }



  render() {
    return (
     
      <div id="projects-dashboard" className={this.state.loading ? "loading" : ""}>
        <div className="dashboard-key-items">
          <div className="dashboard-item">
            <div className="flex-wrapper">
              <div>
                <div className="name"># Annotated</div>
                <div className="value"><span class="st st-darker">{ this.state.data.numDocGroupsAnnotated } / { this.state.data.totalDocGroups }</span></div>
              </div>

              <div class="pieChart">

                { this.state.loading && 
                <PieChart
                  data={[
                    { value: 0, color: "rgb(109, 201, 34)"},
                    { value: 1, color: "rgba(0, 0, 0, 0)"}, // sneaky 
                  ]}
                  background={"#d5d5d5"}
                  lineWidth={18}
                  startAngle={270}
                />
                }
                { !this.state.loading && 
                  <PieChart
                  data={[
                    { value: (this.state.data.numDocGroupsAnnotated), color: "rgb(109, 201, 34)"},
                    { value: (this.state.data.totalDocGroups - this.state.data.numDocGroupsAnnotated), color: "rgba(0, 0, 0, 0)"}, // sneaky 
                  ]}
                  background={"#d5d5d5"}
                  animate={true}
                  animationDuration={500}
                  lineWidth={18}
                  startAngle={270}
                />



                }



              </div>
            </div>

          </div>
          <div className="dashboard-item">
            <div className="name">Avg. agreement</div>
            <div className="value"><span class="st st-darker"> { this.state.data.avgAgreement } </span></div>
          </div>
          <div className="dashboard-item">
            <div className="name">Avg. time per document</div>
            <div className="value"><span class="st st-darker">{ this.state.data.avgTimePerDocument } seconds</span></div>
          </div>
        </div>

        <div className="dashboard-white-boxes">
          <div className="dashboard-item col-2">
            <div className="inner">
              <h3>Activity</h3>
              <p><span class="st">Hello I am an activity graph</span></p>
            </div>
          </div>
          <div className="dashboard-item col-2">
            <div className="inner">
              <h3>Another box</h3>
              <p><span class="st">Some content for the box</span></p>
            </div>
          </div>
          <div className="dashboard-item col-1">
            <div className="inner">
              <h3>Something else</h3>
              <p><span class="st">bip</span></p>
            </div>
          </div>
          <div className="dashboard-item col-2">
            <div className="inner">
              <h3>Noot noot</h3>
              <p><span class="st">it's pingu</span></p>
            </div>
          </div>
          <div className="dashboard-item col-1">
            <div className="inner">
              <h3>Noot noooot</h3>
              <p><span class="st">it's another pingu</span></p>
            </div>
          </div>
          <div className="dashboard-item col-2">
            <div className="inner">
              <h3>bip</h3>
              <p><span class="st">yee</span></p>
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
      <li className={this.props.view === this.props.name ? "active" : ""} onClick={() => this.props.setView(this.props.name)}><i className={"fa fa-" + this.props.icon}></i>{ this.props.name }</li>
    )
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
          <ProjectViewSidenav view={this.state.view} setView={this.setView.bind(this)}/>
          { currentView }
        </div>     
      </div>
    )
  }
}


export default ProjectView;