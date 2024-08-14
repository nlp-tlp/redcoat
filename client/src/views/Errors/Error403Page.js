import React from "react";
import {Component} from "react";

class Error403Page extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <main class="error-page">
        <h1>403: Access denied.</h1>
        <p>You do not have permission to access the requested page.</p>
      </main>
    )
  }
}

export default Error403Page