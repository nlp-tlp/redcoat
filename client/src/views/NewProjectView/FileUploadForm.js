import React from "react";
import {Component} from "react";
import _ from 'underscore';

class FileUploadForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      file: null,
      filename: null,
      errorCleared: false, // Whether the current form error has been cleared
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(!_.isEqual(prevState.filename, this.state.filename)) {
      this.props.updateFile(this.state.file);
    }    
    if((prevProps.hasError !== this.props.hasError) && this.props.hasError) {
      this.setState({
        errorCleared: false,
      })
    }
  }

  async updateFile(e) {
    console.log(e.target.files[0]);
    if(!e.target.files[0]) return;

    this.setState({
      file: e.target.files[0],
      filename: e.target.files[0].name,
      errorCleared: true,
    }, () => {
      this.props.updateFile(this.state.file);
    });
  }

  render() {
    return (
      <div className="upload-form-container">
        <div className={"upload-form " + (this.props.file_metadata ? "saved" : "")  + ((this.props.hasError && !this.state.errorCleared) ? "error" : "")}>

          <input required={!this.props.file_metadata} type="file" id="upload-dataset" name="upload-dataset" onChange={(e) => this.updateFile(e)}/>
          <label htmlFor="upload-dataset">

            { this.props.saving
            ? <span className="center"><i className="form-icon fa fa-cog fa-spin"></i>Uploading...</span>
            : ((this.props.hasError && !this.state.errorCleared)              
              ? <span className="center"><i className="form-icon fa fa-times"></i>An error occurred while uploading<br/><em>{this.state.filename}</em>.</span>
              : (this.props.file_metadata 
                ? (
                    <span>                      
                      <span className="center"><em>{this.props.file_metadata[0][1]}</em> uploaded successfully.</span>
                      <table className="file-metadata">
                        <tbody>
                        { this.props.file_metadata.slice(1, this.props.file_metadata.length).map((item, index) => 
                          <tr key={index}><td>{item[0]}:</td><td>{item[1]}</td></tr>                    
                        )}
                        </tbody>
                      </table>
                    </span>
                  )
                : (this.state.filename              
                  ? (<span><i className="form-icon fa fa-check"></i>Ready to upload <em>{this.state.filename}</em>.</span>)
                  : <span><i className="form-icon fa fa-upload"></i>Click here to upload a {this.props.name ? this.props.name : 'dataset'}.</span>
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

export default FileUploadForm;