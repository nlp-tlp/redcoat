import React from "react";
import {Component} from "react";
import NewProjectFormHelpIcon from 'views/NewProjectView/NewProjectFormHelpIcon';
import _ from 'underscore';

import FileUploadForm from './FileUploadForm';

class NewProjectAutomaticTagging extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: {
        use_automatic_tagging: 'not-defined',
        dataset: null,
      },      
    }
    this.selectRef = React.createRef();
  }

  componentDidMount() {
    this.setState({
      data: this.props.data,
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if(!_.isEqual(this.props.data, this.state.data) && 
      (!_.isEqual(prevState.data, this.state.data) || (this.state.data.dataset && (!_.isEqual(prevState.data.dataset.name, this.state.data.dataset.name))))) {
      console.log('changed')
      this.props.updateFormPageData(this.state.data, { reset_form: true });
    }  
  }

  updateUseAutomaticTagging(e) {
    var value = e.target.value;
    this.selectRef.current.blur();

    this.setState({
      data: {
        ...this.state.data,
        use_automatic_tagging: value,
      }
    })
  }


  updateDataset(file) {
    this.setState({
      data: { ...this.state.data, dataset: file }
    }, () => {
      console.log('changed')
      this.props.updateFormPageData(this.state.data, { reset_form: true });
    });
  }


  render() {

    var help = (<div>
        <h2>Automatic Tagging</h2>
        <p>Redcoat can automatically annotate terms according to a dictionary, helping to save annotation time. These annotations can be adjusted by your annotators when necessary.</p>
        <p>To use automatic tagging, you can upload a CSV file where each row is a (term, entity type), e.g.</p>
        <code>
          car,Vehicle<br/>
          running around,Activity<br/>
          left leg,Body_part/Leg<br/>
        </code>
        <p>In the example above, "car" will be automatically labelled as a Vehicle, "running around" as an Activity, and "left leg" as a Body_part/Leg.</p>
        <p>Note that the entity types must appear in your entity hierarchy, which is defined on the previous page.</p>
          
      </div>
    )

    return (
      <div>
        <h2>Automatic Tagging <NewProjectFormHelpIcon onClick={() => this.props.toggleFormHelp(help)} /></h2>

        <div className="form-group">
          <label htmlFor="use-automatic-tagging">Use automatic tagging?</label>
          <select name="use-automatic-tagging"
                  onChange={this.updateUseAutomaticTagging.bind(this)}
                  id="use-automatic-tagging"
                  value={this.state.data.use_automatic_tagging}
                  ref={this.selectRef}>
            <option disabled hidden value="not-defined">Click to select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div className="form-group">

          { (this.state.data.use_automatic_tagging === "yes") && 

          <FileUploadForm 
                saving={this.props.saving && !this.props.data.file_metadata}
                hasError={this.props.errorPaths && this.props.errorPaths.has("automatic_tagging")}
                updateFile={this.updateDataset.bind(this)}
                file_metadata={this.props.data.file_metadata}
                name={"dictionary"}

          />
        }
        </div>



      </div>
    )
  }
}

export default NewProjectAutomaticTagging;