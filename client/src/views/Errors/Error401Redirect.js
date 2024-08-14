import React from "react";
import {Component} from "react";
import { Redirect } from 'react-router-dom'
import BASE_URL from 'globals/base_url';

class Error401Redirect extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.clearErrorCode();
  }

  render() {
    return (
      <Redirect to={BASE_URL + "login"}/>
    )
  }
}

export default Error401Redirect
