import React from "react";
import {Component} from "react";

// The form help icon, which can be clicked to pop up the modal.
class NewProjectFormHelpIcon extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <span className="form-help" onClick={this.props.onClick} ><i className="fa fa-info-circle fa-xxs"></i><span className="info">Info</span></span>
    )
  }
}

export default NewProjectFormHelpIcon;