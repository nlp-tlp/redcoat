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
      loading: true,
      showingSuggestions: false,
      userSearchResults: null,
      userSuggestions: [],
      searchTerm: '',
    }
  }

  async componentDidMount() {
    console.log('x', this.props.data);

    await this.setState({
      data: this.props.data,
    });
    
    // var recentUsers = await this.queryRecentUsers();

    var suggestedUsers = this.props.data.suggested_users;
    this.setState({
      loading: false,
      data: this.props.data,
      userSuggestions: suggestedUsers,
      userSearchResults: suggestedUsers.length > 0 ? suggestedUsers : null,
      showingSuggestions: suggestedUsers.length > 0 ? true : false,
    });
  }

  // async queryRecentUsers() {
  //   var d = await _fetch('http://localhost:3000/api/projects/new/getSuggestedUsers', 'GET', this.props.setErrorCode, false, false, 200);
  //   return Promise.resolve(d.users);
  // }

  async queryAPI() {
    await this.setState({
      loading: true,
    })
    if(this.state.searchTerm.length === 0) {
      
      this.setState({
        loading: false,
        userSearchResults: this.state.userSuggestions.length > 0 ? this.state.userSuggestions : null,
        showingSuggestions: this.state.userSuggestions.length > 0 ? true : false,
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
      loading: false,
      userSearchResults: result,
      showingSuggestions: false,
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

  // Check whether the specified user has been added to this.state.data.users.
  alreadyAddedUser(user) {
    for(var u of this.state.data.users) {
      if(user.username && u.username === user.username) {
        return true;
      }
      if(user.email && u.email === user.email) {
        return true;
      }
    }
    return false;
  }

  // Remove the user at the specified index
  removeUser(index) {
    var users = [...this.state.data.users];
    users.splice(index, 1);
    this.setState({
      data: {
        ...this.state.data,
        users: users,
      }
    }, () => this.props.updateFormPageData(this.state.data));
  }

  // Adds the user to this.state.data.users (i.e. puts them in the table on the right).
  addUser(user) {
    var users = [...this.state.data.users];
    users.push(user);

    this.setState({
      data: {
        ...this.state.data,
        users: users,
      }
    }, () => this.props.updateFormPageData(this.state.data));

    return null;


  }


  // Highlight the row at the specified index via the delete-hover class (makes it go red).
  deleteHighlightRow(index) {
    document.getElementById("annotator-num-" + index).classList.add('delete-hover');
  }
  // Remove the highlighting.
  removeHighlightRow() {
    var eles = document.getElementsByClassName("annotator");
    for(var ele of eles) {
      ele.classList.remove("delete-hover");
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
    //console.log(this.state.data.users, this.state.userSearchResults, this.state.searchTerm.length);

    return (
      <div>

        <h2>Annotators <NewProjectFormHelpIcon onClick={() => this.props.toggleFormHelp(help)} /></h2>




        <div className="flex-columns flex-columns-2">


          <div className={"flex-column flex-column-33" + (this.state.loading ? " loading-prevent-action" : "")}>



            <div className="annotators-box">
              <div className="annotators-box-header">Annotator lookup</div>
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
                      <div className="not-searched-yet">Enter a username or email address above to search for annotators.</div>
                    }

                    { (this.state.userSearchResults && this.state.userSearchResults.length === 0) &&
                      <div className="no-search-results">No results found.</div>
                    }

                    { (this.state.userSearchResults && this.state.userSearchResults.length > 0) &&
                      <div className="search-results-found">

                        { this.state.showingSuggestions
                          ? <h4>Suggestions ({this.state.userSearchResults.length})</h4>
                          : <h4>Search results ({this.state.userSearchResults.length})</h4>
                        }


                        
                        { this.state.userSearchResults.map((user, index) => 
                          <div className="annotator search-result">
                              <UserDetails user={user}/>
                              {
                                this.alreadyAddedUser(user)
                                ? <div className="annotate-button user-added">Added<i className="right fa fa-check"></i></div>
                                : <div className="annotate-button" onClick={this.addUser.bind(this, user)}>Add <i className="right fa fa-chevron-right"></i></div>
                              }
                              
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
              <div className="annotators-box-header">Annotators to invite</div>
              <div className="annotators-box-body">

                <div className="annotators-box-list ">

                  { this.state.data.users.map((user, index) => 
                      <div className="annotator" id={"annotator-num-" + index}>
                        <UserDetails user={user}/>
                        { index > 0 && 
                        <span className="delete-button-container"><span className="delete-button" 
                              onClick={this.removeUser.bind(this, index)}
                              onMouseEnter={() => this.deleteHighlightRow(index)} onMouseLeave={this.removeHighlightRow}


                              ><i className="fa fa-trash"></i></span></span>
                        }
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