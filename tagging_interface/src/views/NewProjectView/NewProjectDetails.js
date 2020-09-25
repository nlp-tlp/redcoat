import React from "react";
import {Component} from "react";
import NewProjectFormHelpIcon from 'views/NewProjectView/NewProjectFormHelpIcon';

// Set up project details page.
// (project title, description, data)
class NewProjectDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projectName: '',
      projectDescription: '',
    }
  }

  updateProjectName(e) {
    var value = e.target.value;
    if(value.trim().length === 0) value = '';
    this.setState({
      projectName: value,
    });
  }

  updateProjectDescription(e) {
    var value = e.target.value;
    if(value.trim().length === 0) value = '';
    this.setState({
      projectDescription: value,
    });
  }

  render() {

    var dataHelp = (<div>
        <h2>Data</h2>
        <p>Please upload your data using the form. The data may be in one of two formats: </p>
        <p>
          <ul>
            <li><b>Raw data</b>: The dataset must be saved as a .txt file. Each token within your data must be separated by a space, and each document must be on a new line.</li>
            <li><b>Already labelled data</b>: The dataset must be saved as a .json file, in the same format as Redcoat annotation files.</li>
          </ul>
        </p>
      </div>
    )


    return (
      <div>

        <div className="flex-columns flex-columns-2">

          <div className="flex-column">
            <h2>Project details</h2>
            <div className="form-group">
              <label>Project name</label>
              <input placeholder="Project name" value={this.state.projectName} onChange={(e) => this.updateProjectName(e)}></input>
            </div>
            <div className="form-group">
              <label>Project description (optional)</label>
              <textarea placeholder="Project description" value={this.state.projectDescription} onChange={(e) => this.updateProjectDescription(e)}></textarea>
            </div>

          </div>
          <div className="flex-column">
            <h2>Data <NewProjectFormHelpIcon onClick={() => this.props.toggleFormHelp(dataHelp)} /></h2>
            

            <div className="upload-form-container">
              <div className="upload-form"></div>

            </div>
          </div>
        </div>


      </div>
    )
  }
}


export default NewProjectDetails;