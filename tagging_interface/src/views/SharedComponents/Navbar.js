import React from "react";
import { Link, Switch, Route, withRouter } from "react-router-dom";
import {Component} from 'react';
import logo from 'favicon.png'
import $ from 'jquery';

import ProfileIcon from './ProfileIcon';
import BASE_URL from 'globals/base_url';


//  $("#invitations-menu > *").click(function(e) {
//    $invitationsButton.focus();
//  });

// The navbar, which appears at the top of the page.
class Navbar extends Component {

  constructor(props) {
    super(props);
  }


  componentDidUpdate() {
    // Make sure the invitations menu stays open when clicking a child of it
    // Probably better to do this without jquery but oh well
    $("#invitations-menu > *").prop('onclick', null).off('click');
    $("#invitations-menu > *").click(function(e) {
      $("#invitations-button").focus();
    });
  }

 

  render() {
    
    if(this.props.user && this.props.user.project_invitations) {
      var invitations = this.props.user.project_invitations;
      var outstandingInvitationNum = 0;
      for(var inv of invitations) {
        if(!inv.accepted && !inv.declined) outstandingInvitationNum++;
      }
    }


    return (
      <nav id="navbar">
        <div className="navbar-left">
          <div id="logo">
            <Link to={BASE_URL}>             
              <img src={logo}/> <span className="text">Redcoat</span>         
            </Link>
          </div>
          { this.props.user && 
            <div className="dropdown-menu">
              <button>Projects</button>
              <ul className="dropdown-menu-items">
                <li><Link to={"" + BASE_URL + "projects"}>Projects list</Link></li>
                <li><Link to={"" + BASE_URL + "projects/new"}>New project</Link></li>
              </ul>
            </div>
          }
   
        </div>
        <div className="navbar-centre"></div>
        <div className="navbar-right">

          { this.props.user && 

            <div className={"dropdown-menu invitations" + (outstandingInvitationNum === 0 ? " inactive": "")} id="invitations-menu">
              <button id="invitations-button"><i className="fa fa-envelope"></i>{outstandingInvitationNum > 0 && <span className="invites-count" id="invites-count">{outstandingInvitationNum}</span>}</button>

              { this.props.user.project_invitations && invitations.length > 0 ? 

                <ul className="dropdown-menu-items">
                {invitations.map((invite, index) => 

                  <li key={index}>
                    <span className="invite">
                      <span className="link">{invite.inviting_user_username}</span> has invited you to annotate <span className="link">{invite.project_name}</span>.

                      { !invite.accepted && !invite.declined && !invite.pending &&
                        <div className="invite-form">
                          <button className="accept" onClick={() => this.props.acceptInvitation(index)}>Accept</button>
                          <button className="decline" onClick={() => this.props.declineInvitation(index)}>Decline</button>
                        </div>                        
                      }
                      {
                        invite.pending && 
                        <div className="invite-form-loading">
                          <span><i className="fa fa-cog fa-spin"></i>&nbsp;Loading...</span>
                        </div>
                      }

                      { invite.accepted && 

                        <div className="invite-form-accepted">
                          <span><i className="fa fa-check"></i>&nbsp;Invitation accepted! <Link to={"" + BASE_URL + "projects/" + invite.project_id + "/dashboard"}>(Go to project)</Link></span>
                        </div>
                      }
                      { invite.declined && 
                      <div className="invite-form-declined">
                        <span><i className="fa fa-close"></i>&nbsp;Invitation declined.</span>
                      </div>
                      }
                    </span>
                  </li>
                  

                 )

                }
                </ul>

                :
                <ul className="dropdown-menu-items">
                  <li><span className="invite">You have no active invitations.</span></li>
                </ul>
              }

            </div>


          }


          { this.props.user &&



            <div className="dropdown-menu">
              <button className="flex"><ProfileIcon user={this.props.user}/><span>Logged in as {this.props.user.username}</span></button>
              <ul className="dropdown-menu-items">
                <li><Link to={"" + BASE_URL + "profile"}>Profile</Link></li>
                <li><Link to={"" + BASE_URL + "logout"}>Logout</Link></li>
              </ul>
            </div>
          }

          { !this.props.user && 



            <div className="dropdown-menu log-in">
              <button>Not logged in&nbsp;&nbsp;<i className="fa fa-xs fa-chevron-down"></i></button>
              <ul className="dropdown-menu-items">
                <li><Link to={"" + BASE_URL + "login"}>Login</Link></li>
                <li><Link to={"" + BASE_URL + "register"}>Register</Link></li>
              </ul>
            </div>
          }

          {!this.props.loading && <div className="dropdown-menu short">
            <Link to={"" + BASE_URL + "features"}>v2.0a</Link>
          </div> }
        </div>
        {!this.props.loading && <header className="decorative-bar"></header>}
      </nav>
    )
  }
}

export default Navbar;