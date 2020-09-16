import React from 'react';
import {Component} from 'react';

import ProfileIcon from '../components/ProfileIcon';

function generateEmptyTable() {
  var n = 15;
  var arr = new Array(n).fill(0);
  

  function stringOfRandomLength(minlen, maxlen) {
    var s = '';
    for(var i = 0; i < minlen + Math.floor(Math.random() * maxlen); i++) {
      s += 'x';
    }
    return s;
  }

  return (
    <table className="project-page-table">
      <tbody>
       { arr.map((x, i) => 
        <tr> 
          <td><span className="inner"><span className="st">{stringOfRandomLength(30, 70)}</span></span></td>
          <td><span className="inner"><span className="st">{stringOfRandomLength(30, 70)}</span></span></td>
        </tr>
      ) }
    </tbody>
  </table>
  )  
}

class InvitationsTable extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <table className="project-page-table">
        <tbody>
         { this.props.data.active_users.length > 0 && <tr><td colspan="2"><span className="inner row-divider">Active</span></td></tr>}
         { this.props.data.active_users.map((user, i) => 
          <tr>

            <td>
              <span className="inner">
                <ProfileIcon user={user}/>
                <span>{user.email} ({user.username})</span>
              </span>
            </td>
          </tr>
        ) }

         { this.props.data.pending_invitations.length > 0 && <tr><td colspan="2"><span className="inner row-divider">Pending invitations</span></td></tr>}
         { this.props.data.pending_invitations.map((user, i) => 
          <tr>

            <td>
              <span className="inner">
                <ProfileIcon user={user.profile_icon ? user : null}/>
                <span>{user.email} {user.username ? ("(" + user.username + ")") : ""})</span>
              </span>
            </td>
          </tr>
        ) }
        </tbody>
      </table>

    )
  }
}

class InvitationsPage extends Component {
  constructor(props) {
    super(props);
  }



  render() {    
    return ( 
      <main className="project-page">

        <h2>Annotators</h2>

        <div className="wrapper">
          { this.props.loading && generateEmptyTable() }
          { !this.props.loading && <InvitationsTable data={this.props.data}/> }
          
        </div>
      </main>
    )
  }
}

export default InvitationsPage;