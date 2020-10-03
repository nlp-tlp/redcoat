import React from "react";
import {Component} from "react";
import NewProjectFormHelpIcon from 'views/NewProjectView/NewProjectFormHelpIcon';
import _ from 'underscore';

import FileUploadForm from './FileUploadForm';

// Set up project details page.
// (project title, description, data)
class NewProjectDetails extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: {
        project_name: '',
        project_description: '',  
        dataset: null,
      },
    }
  }


  componentDidMount() {
    this.setState({
      data: this.props.data,
    });
    // if(this.props.data) {
    //   console.log('modified 111')
    //   this.setState({
    //     data: this.props.data,
    //   }, () => {
    //     console.log(this.state.data, this.props.data, "<<")
    //   })
    // }
  }

  componentDidUpdate(prevProps, prevState) {
    // if(!_.isEqual(this.props.data, this.state.data) && _.isEqual(prevState.data, this.state.data)) {
    //   this.setState({
    //     data: this.props.data,
    //   });
    // }

    if(!_.isEqual(this.props.data, this.state.data) && !_.isEqual(prevState.data, this.state.data)) {
      this.props.updateFormPageData(this.state.data, { reset_form: false });
    }   
  }

  updateProjectName(e) {
    var value = e.target.value;
    if(value.trim().length === 0) value = '';
    this.setState({
      data: { ...this.state.data, project_name: value }
    });
  }

  updateProjectDescription(e) {
    var value = e.target.value;
    if(value.trim().length === 0) value = '';
    this.setState({
      data: { ...this.state.data, project_description: value }
    });
  }

  updateDataset(file) {
    this.setState({
      data: { ...this.state.data, dataset: file }
    }, () => {
      console.log('changed')
      this.props.updateFormPageData(this.state.data, { reset_form: true });
    })
  }

  render() {

    var dataHelp = (<div>
        <h2>Data</h2>
        <p>Please upload your data using the form. The data may be in one of two formats: </p>
        
        <ul>
          <li><b>Raw data</b>: The dataset must be saved as a .txt file. Each token within your data must be separated by a space, and each document must be on a new line.</li>
          <li>(Coming soon): <b>Already labelled data</b>: The dataset must be saved as a .json file, in the same format as Redcoat annotation files.</li>
        </ul>
        
      </div>
    )
    //console.log(this.state.data);
    return (
      <div>

        <div className="flex-columns flex-columns-2">

          <div className="flex-column">
            <h2>Project details</h2>

            <div className={"form-group" + (this.props.errorPaths.has("project_name") ? " error" : "") }>
              <label>Project name</label>
              <input required
                     onKeyDown={(e)=> e.keyCode == 13 ? e.preventDefault(): ''}
                     maxLength={100}
                     placeholder="Project name"
                     value={this.state.data.project_name || ''}
                     onChange={(e) => this.updateProjectName(e)}/>
            </div>

            <div className={"form-group" + (this.props.errorPaths.has("project_description") ? " error" : "") }>
              <label>Project description (optional)</label>
              <textarea maxLength={1000}
                        placeholder="Project description"
                        value={this.state.data.project_description || ''}
                        onChange={(e) => this.updateProjectDescription(e)}/>
            </div>

          </div>
          <div className="flex-column">
            <h2>Data <NewProjectFormHelpIcon onClick={() => this.props.toggleFormHelp(dataHelp)} /></h2>
            

            <FileUploadForm 
              saving={this.props.saving && !this.props.data.file_metadata}
              hasError={this.props.errorPaths && this.props.errorPaths.has("dataset")}
              updateFile={this.updateDataset.bind(this)}
              file_metadata={this.props.data.file_metadata}

            />
          </div>
        </div>


      </div>
    )
  }
}


export default NewProjectDetails;