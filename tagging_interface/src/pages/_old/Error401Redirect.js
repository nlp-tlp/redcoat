import React from "react";
import {Component} from "react";
import { Redirect } from 'react-router-dom'


class Error401Redirect extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.clearErrorCode();
  }

  render() {
    return (
      <Redirect to="/login"/>
    )
  }
}

export default Error401Redirect