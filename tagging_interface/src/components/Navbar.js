import React from "react";
import { Link, Switch, Route, withRouter } from "react-router-dom";
import {Component} from 'react';
import logo from '../favicon.png'

const BASE_URL = "/"

// The navbar, which appears at the top of the page.
class Navbar extends Component {
  render() {
    return (
      <nav id="navbar">
        <div className="navbar-left">
          <div id="logo">
            <Link to="/">
              <span className="inner">
                <span className="img">
                  <img src={logo}/>
                </span>
                <span>Redcoat</span>
              </span>
            </Link>
          </div>         
        </div>
        <div className="navbar-centre"></div>
        <div className="navbar-right">


          { this.props.username && 
            <div className="dropdown-menu">
              <button>Projects</button>
              <ul className="dropdown-menu-items">
                <li><Link to={"" + BASE_URL + "projects"}>Projects list</Link></li>
                <li><Link to={"" + BASE_URL + "setup-project"}>Setup project</Link></li>
              </ul>
            </div>
          }

          { this.props.username &&

            <div className="dropdown-menu">
              <button>Logged in as {this.props.username}</button>
              <ul className="dropdown-menu-items">
                <li><Link to={"" + BASE_URL + "profile"}>Profile</Link></li>
                <li><Link to={"" + BASE_URL + "logout"}>Logout</Link></li>
              </ul>
            </div>
          }

          { !this.props.username && 



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
      </nav>
    )
  }
}

export default Navbar;