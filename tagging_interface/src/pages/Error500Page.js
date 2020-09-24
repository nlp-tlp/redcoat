import React from "react";
import {Component} from "react";

class Error500Page extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <main class="error-page">
        <h1>500: Internal server error.</h1>
        <p>An unexpected error has occurred.</p>
      </main>
    )
  }
}

export default Error500Page