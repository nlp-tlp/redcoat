import React from 'react';
import {Component} from 'react';
import { Link } from 'react-router-dom'
import formatDate  from 'functions/formatDate';
import { PieChart } from 'react-minimal-pie-chart';

import _fetch from 'functions/_fetch';


class ProjectsTable extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (<div></div>)




  }
}

class ProjectListView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: {
        projects: this.getDummyProjects(),
        numUserInvolvedIn: null,
        numCreatedByUser: null,       
        numDocGroupsAnnotated: 0,
        totalDocGroups: 1,
      },
      view: "All projects", // "All projects" or "Your projects"
      loading: true,

    }
  }

  // Get some dummy projects for the first load, so that the table looks nice.
  getDummyProjects() {

    function randomString(minLength, maxLength) {
      var result = '';
      var randomLength = minLength + Math.floor(Math.random() * (maxLength - minLength))
      for(var i = 0; i < randomLength; i++ ) {
        result += 'x'
      }
      return result;
  }

    function randomName() {
      return randomString(5, 20);
    }

    function randomDesc() {
      var x = Math.random();
      if(x < 0.5) return null;
      return randomString(20, 50);
    }

    var dummyProjects = [];
    for(var i = 0; i < 10; i++) {
      dummyProjects.push({
        name:         randomName(),
        description:  randomDesc(),
        total_users:  0,
        created_at:   null,
        icon_name:    "",
      })
    }
    return dummyProjects;
  }

  // Query the API when this component is mounted.
  // Once done, set this.state.data to the returned projects, numUserInvolvedIn, and numCreatedByUser.
  async componentWillMount() {
    this.props.setProject(null, null); // Reset the current project in the sidenav

    var d = await _fetch('projects/', 'GET', this.props.setErrorCode, 1)

    this.setState({
      data: d,
      loading: false
    })
  }

  // Set this component's view to the specified view.
  // Should be either "All projects" or "Your projects".
  setView(view) {
    this.setState({
      view: view,
      loading: true,
      
    }, () => {
      window.setTimeout( () => {
        this.setState({
          
          loading: false,
        })
      }, 100); // Simulate lag ?

    })
  }



  render() {
    return (
      <div id="projects-table-wrapper">

        <div id="projects-table-header">            
          <div className={"row-button" + (this.state.view === "All projects"  ? " active" : "")} onClick={ () => this.setView('All projects') }>All projects <span className="counter">{ this.state.data.numUserInvolvedIn }</span></div>
          <div className={"row-button" + (this.state.view === "Your projects" ? " active" : "")} onClick={ () =>  this.setView('Your projects') }>Your projects <span className="counter">{ this.state.data.numCreatedByUser }</span></div>
        </div>

        <div id="projects-table" className={this.state.loading ? "loading" : ""}>
        
        { this.state.data.projects.filter(project => (this.state.view === "Your projects" ? project.userIsCreator : true)).map((project, i) => 
          
            <div className="row" index={i}>
              <div className="col-name-desc">


                <div className="projects-table-pie">
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
                      { value: (project.numDocGroupsAnnotated), color: "rgb(109, 201, 34)"},
                      { value: (project.totalDocGroups - project.numDocGroupsAnnotated), color: "rgba(0, 0, 0, 0)"}, // sneaky 
                    ]}
                    background={"#d5d5d5"}
                    animate={true}
                    animationDuration={500}
                    lineWidth={18}
                    startAngle={270}
                  />
                  }
                </div>




                <div className="name-desc-row">
                  <div className="project-name"><Link to={'/projects/' + project._id + '/dashboard'}>{ project.name}</Link></div>
                  {project.description && <div className="project-description">{ project.description }</div> }
                  <div className="project-creator">Created by <span className="creator-name">{ project.creator }</span></div>
                </div>
              </div>
              <div className="col-date">
                <span className="project-created-at">Created on {formatDate(project.created_at)}</span>
              </div>
              <div className="col-stats">
                <span className="project-total-comments" title={"This project has " + project.total_comments + " comments."}><i class="fa fa-comment"></i> <span className="comment-count">{project.total_comments}</span></span>
                <span className="project-total-users"    title={"This project has " + project.total_users + " users."}><i class="fa fa-user"></i> <span className="user-count">{project.total_users}</span></span>
              </div>
            </div>      
          )
        }
        </div>
      </div>  
    )
  }
}


export default ProjectListView;