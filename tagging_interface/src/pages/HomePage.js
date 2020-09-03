import React from "react";
import {Component} from "react";

import { Link } from "react-router-dom";

class HomePage extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div>
        <p>Hello I am a homepage</p>
        <p><Link to="/projects">projects page</Link></p>


      </div>

    )
  }
}


export default HomePage