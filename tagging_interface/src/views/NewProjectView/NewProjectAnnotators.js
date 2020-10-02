import React from 'react';
import {Component} from 'react';
import NewProjectFormHelpIcon from 'views/NewProjectView/NewProjectFormHelpIcon';
import ProfileIcon from 'views/SharedComponents/ProfileIcon';
import formatDate from 'functions/formatDate'
import _fetch from 'functions/_fetch';

function strIsEmail(str) {
  return str.indexOf("@") > 0 && str.split("@").length === 2;
}

class UserDetails extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    var user = this.props.user;
    return (
      <span className="user-details">
        <ProfileIcon user={user.is_registered ? user : null}/>
        <span>
          <div className="annotator-username">{user.is_registered ? user.username : user.email}</div>
          <div className="annotator-registration-date">{user.is_registered ? "Joined on " + formatDate(user.created_at, { no_hours: true }) : "Not yet registered"}</div>
        </span>
      </span>

    )
  }
}

class NewProjectAnnotators extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: {
        users: [],
      },
      userSearchResults: null,
      searchTerm: '',
    }
  }

  componentDidMount() {
    console.log('x', this.props.data);
    this.setState({
      data: this.props.data,
      userSearchResults: null,
    });
  }

  async queryAPI() {
    if(this.state.searchTerm.length === 0) {
      this.setState({
        userSearchResults: null,
      })
      return;
    }

    var searchTerm = this.state.searchTerm
    var isEmail = strIsEmail(searchTerm);

    var d = await _fetch('http://localhost:3000/api/projects/new/searchUsers?searchTerm=' + searchTerm + "&isEmail=" + isEmail, 'GET', this.props.setErrorCode, false, false, 200);

    var result = d.users;
    if(isEmail && d.users.length === 0) {
      result = [{
        is_registered: false,
        email: searchTerm,
      }];
    }
    this.setState({
      userSearchResults: result,
    });
  }

  // Update the search term in the input box.
  changeSearchTerm(e) {
    var value = e.target.value; 
    this.setState({
      searchTerm: value,
    })
  }

  submitViaEnter(e) {
    console.log(e, "EEE");
    e.preventDefault();
    this.queryAPI();
  }
  onKeyDown(e) {
    if(e.keyCode === 13) {
      e.preventDefault();
      this.queryAPI();
    }
  }


  render() {
    var help = (<div>
        <h2>Annotators</h2>
        <p>Please specify the annotators of this project.</p>
      </div>
    )

    /*
      If input search length < 3, clear search results so that there is nothing in the box
      If input search length >= 3 and input[:3] !== apiSearchTerm[:3], set apiSearchTerm to input and query API for search results
      Search results = for loop over api search results to check for matches if input search length > 3



    */
    console.log(this.state.data.users, this.state.userSearchResults);

    return (
      <div>

        <h2>Annotators <NewProjectFormHelpIcon onClick={() => this.props.toggleFormHelp(help)} /></h2>




        <div className="flex-columns flex-columns-2">


          <div className="flex-column flex-column-33">



            <div className="annotators-box">
              <div className="annotators-box-header">Add new annotator</div>
              <div className="annotators-box-body">
                <div className="input-row">
                  <input id="annotator-name"
                    placeholder="Username or email address"
                    value={this.state.searchTerm} 
                    onKeyDown={(e) => this.onKeyDown(e)} onChange={this.changeSearchTerm.bind(this)}>

                  </input>
                  <button onClick={this.queryAPI.bind(this)} className="annotate-button" type="button"><i className="fa fa-search"></i>Search</button>
                </div>


                <div className="annotators-box-list search-results">

                    { this.state.userSearchResults === null && 
                      <div className="not-searched-yet">Enter a search term above to search for annotators.</div>
                    }

                    { (this.state.userSearchResults && this.state.userSearchResults.length === 0) &&
                      <div className="no-search-results">No results found.</div>
                    }

                    { (this.state.userSearchResults && this.state.userSearchResults.length > 0) &&
                      <div className="search-results-found">
                        <h4>Search results ({this.state.userSearchResults.length})</h4>
                        
                        { this.state.userSearchResults.map((user, index) => 
                          <div className="annotator search-result">
                              <UserDetails user={user}/>
                              <button className="annotate-button" type="button">Add <i className="right fa fa-chevron-right"></i></button>
                          </div>                
                        )}
                      
                        
                      </div>
                    }
                </div>




              </div>
            </div>
          </div>

          <div className="flex-column flex-column-66">
            <div className="annotators-box">
              <div className="annotators-box-header">Annotators</div>
              <div className="annotators-box-body">

                <div className="annotators-box-list ">

                  { this.state.data.users.map((user, index) => 
                      <div className="annotator">
                        <UserDetails user={user}/>
                      </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    )
  }
}

export default NewProjectAnnotators;