import React from "react";
import { Link, Switch, Route, withRouter } from "react-router-dom";
import {Component} from 'react';
import logo from '../favicon.png'

import ProfileIcon from './ProfileIcon';

const BASE_URL = "/"

// The navbar, which appears at the top of the page.
class Navbar extends Component {
  render() {

    return (
      <nav id="navbar">
        <div className="navbar-left">
          <div id="logo">
            <Link to="/">             
              <img src={logo}/> <span class="text">Redcoat</span>         
            </Link>
          </div>
          { this.props.user && 
            <div className="dropdown-menu">
              <button>Projects</button>
              <ul className="dropdown-menu-items">
                <li><Link to={"" + BASE_URL + "projects"}>Projects list</Link></li>
                <li><Link to={"" + BASE_URL + "setup-project"}>Setup project</Link></li>
              </ul>
            </div>
          }
   
        </div>
        <div className="navbar-centre"></div>
        <div className="navbar-right">



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
              <button>Not logged in</button>
              <ul className="dropdown-menu-items">
                <li><Link to={"" + BASE_URL + "login"}>Login</Link></li>
                <li><Link to={"" + BASE_URL + "register"}>Register</Link></li>
              </ul>
            </div>
          }

          <div className="dropdown-menu short">
            <Link to={"" + BASE_URL + "features"}>v1.0</Link>
          </div>
        </div>
        <header className="decorative-bar"></header>
      </nav>
    )
  }
}

export default Navbar;