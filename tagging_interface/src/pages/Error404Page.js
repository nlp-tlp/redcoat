import React from "react";
import {Component} from "react";

class Error404Page extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <main class="error-page">

        <h1>404: Page not found.</h1>
        <p>The page you were looking for does not appear to exist.</p>


      </main>
    )
  }
}

export default Error404Page