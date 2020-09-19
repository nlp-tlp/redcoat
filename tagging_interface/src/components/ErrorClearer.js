import React from "react";
import {Component} from "react";
import { withRouter } from 'react-router-dom'

// A class whose sole purpose is to clear any errors on the App component
// whenever the user navigates to a different page.
// Without this, the error message will never go away.
// This component has to go inside the router (which is why this isn't part of the App component).
class ErrorClearer extends Component {
  constructor(props) {
    super(props);
  }

  componentDidUpdate(prevProps) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      console.log('clearing');
      this.props.clearErrorCode();
    }
  }

  render() {
    return (<div></div>)
  }
}

export default withRouter(ErrorClearer)