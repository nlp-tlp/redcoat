import React from "react";
import {Component} from "react";
import NewProjectFormHelpIcon from 'views/NewProjectView/NewProjectFormHelpIcon';
import _ from 'underscore';


class FileUploadForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      file: null,
      filename: null,
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(!_.isEqual(prevState.filename, this.state.filename)) {
      this.props.updateFile(this.state.file);
    }
  }

  async updateFile(e) {
    console.log(e.target.files[0]);
    if(!e.target.files[0]) return;

    this.setState({
      file: e.target.files[0],
      filename: e.target.files[0].name,
    });
  }

  render() {
    return (
      <div className="upload-form-container">
        <div className={"upload-form " + (this.props.savedFileMetadata ? "saved" : "")  + (this.props.hasError ? "error" : "")}>

          <input required={!this.props.savedFileMetadata} type="file" id="upload-dataset" name="upload-dataset" onChange={(e) => this.updateFile(e)}/>
          <label htmlFor="upload-dataset">

            { this.props.saving
            ? <span className="center"><i className="form-icon fa fa-cog fa-spin"></i>Uploading...</span>
            : (this.props.hasError              
              ? <span className="center"><i className="form-icon fa fa-times"></i>An error occurred while uploading<br/><em>{this.state.filename}</em>.</span>
              : (this.props.savedFileMetadata 
                ? (
                    <span>
                      
                      <span className="center"><em>{this.props.savedFileMetadata[0][1]}</em> uploaded successfully.</span>
                      <table className="file-metadata">
                        { this.props.savedFileMetadata.slice(1, this.props.savedFileMetadata.length).map((item, index) => 
                          <tr><td>{item[0]}:</td><td>{item[1]}</td></tr>                    
                        )}
                      </table>

                    </span>
                  )
                : (this.state.filename              
                  ? (<span><i className="form-icon fa fa-check"></i>Ready to upload <em>{this.state.filename}</em>.</span>)
                  : <span><i className="form-icon fa fa-upload"></i>Click here to upload a dataset.</span>
                )
              )
            )
            }
          </label>

          
        </div>                
      </div>


    )
  }
}

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
    this.justMounted = true; // Set to false on first update
  }


  componentDidMount() {
    if(this.props.data) {
      console.log('modified 1')
      this.setState({
        data: this.props.data,
      })
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(!this.justMounted && !_.isEqual(prevState.data, this.state.data)) {
      this.props.updateFormPageData(this.state.data, { reset_form: false });
    }   
    this.justMounted = false; 
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
          <li><b>Already labelled data</b>: The dataset must be saved as a .json file, in the same format as Redcoat annotation files.</li>
        </ul>
        
      </div>
    )


    return (
      <div>

        <div className="flex-columns flex-columns-2">

          <div className="flex-column">
            <h2>Project details</h2>

            <div className={"form-group" + (this.props.errorPaths.has("project_name") ? " error" : "") }>
              <label>Project name</label>
              <input required
                     maxLength={100}
                     placeholder="Project name"
                     value={this.state.data.project_name}
                     onChange={(e) => this.updateProjectName(e)}/>
            </div>

            <div className={"form-group" + (this.props.errorPaths.has("project_description") ? " error" : "") }>
              <label>Project description (optional)</label>
              <textarea maxLength={1000}
                        placeholder="Project description"
                        value={this.state.data.project_description}
                        onChange={(e) => this.updateProjectDescription(e)}/>
            </div>

          </div>
          <div className="flex-column">
            <h2>Data <NewProjectFormHelpIcon onClick={() => this.props.toggleFormHelp(dataHelp)} /></h2>
            

            <FileUploadForm 
              saving={this.props.saving && !this.props.savedFileMetadata}
              hasError={this.props.uploadFormHasError}
              updateFile={this.updateDataset.bind(this)}
              savedFileMetadata={this.props.savedFileMetadata}

            />
          </div>
        </div>


      </div>
    )
  }
}


export default NewProjectDetails;