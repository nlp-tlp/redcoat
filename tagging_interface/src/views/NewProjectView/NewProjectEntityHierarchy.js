import React from "react";
import {Component} from "react";
import NewProjectFormHelpIcon from 'views/NewProjectView/NewProjectFormHelpIcon';

import hierarchyPresets from 'views/NewProjectView/functions/hierarchy_presets';
import { slash2txt, txt2json } from 'views/NewProjectView/functions/hierarchy_helpers';

import _ from 'underscore';

import { ModifiableCategoryHierarchy } from 'views/SharedComponents/CategoryHierarchy';

// Setup project entity hierarchy page.
class NewProjectEntityHierarchy extends Component {
  constructor(props) {
    super(props);

    this.state = {
      entity_hierarchy: [],
      selectedPreset: "None",
      hierarchyModified: false,
      hierarchyModifiedPreset: null,

    }

    this.selectLabelRef = React.createRef();
    this.selectRef = React.createRef();
  }

  componentDidMount() {
    
    if(this.props.prevState) {
      console.log("Loading state:", this.props.prevState)
      this.setState(this.props.prevState);
    } else {
      this.setState({
        entity_hierarchy: this.props.entity_hierarchy,
        selectedPreset: "None",
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(!_.isEqual(prevState.entity_hierarchy, this.state.entity_hierarchy)) {
      this.props.saveData(this.state.entity_hierarchy);
      this.props.setModified();
    }    
  }

  setModified() {
    if(this.state.selectedPreset === "None") {
      var modifiedPresetName = "Custom"
    } else {
      var modifiedPresetName = hierarchyPresets[this.state.selectedPreset]['name'];
      modifiedPresetName += " (modified)";
    }
    

    


    this.setState({
      hierarchyModified: true,
      hierarchyModifiedPreset: modifiedPresetName,
    })
  }

  changePreset(e) {
    var value = e.target.value;
    var hierarchy;
    if(value === "None") {
      hierarchy = [];
    } else {
      var index = parseInt(value);
      var hierarchy = txt2json(slash2txt(hierarchyPresets[index]['entities']), hierarchyPresets[index]['entities'], hierarchyPresets[index]['descriptions']).children;
    }
    this.selectRef.current.blur();

    this.setState({
      entity_hierarchy: hierarchy,
      selectedPreset: value,
      hierarchyModified: false,
    }, () => {
      window.scrollTo({
        top: this.selectLabelRef.current.offsetTop + 140,
        left: 0,
        behavior: 'smooth'
      });
    })
  }

  render() {

    var help = (<div>
        <h2>Entity Hierarchy</h2>
        <p>Please define your entity hierarchy.</p>
        <p>You may create new categories by entering them in the form below. To specify a parent category, place a space before the child category. The categories are visualised in the Category Hierarchy, which you may also use to create your hierarchy if you prefer. You may also select from a list of presets, such as the standard 4-class Named Entity Recognition model.</p>
      </div>
    )

    return (
      <div>
        <h2>Entity Hierarchy <NewProjectFormHelpIcon onClick={() => this.props.toggleFormHelp(help)} /></h2>

        <div className="form-group no-padding">
          <label ref={this.selectLabelRef} >Preset</label>
          <select onChange={(e) => this.changePreset(e)} ref={this.selectRef} value={this.state.hierarchyModified ? this.state.selectedPreset + "_" : this.state.selectedPreset}  >
            <option value="None">None</option>
            { hierarchyPresets.map((preset, index) => <option value={index} index={index}>{preset['name'] + " (" + preset['entities'].length + " entity classes)"} </option> ) }
          
            { this.state.hierarchyModified && <option value={this.state.selectedPreset + "_"}>{this.state.hierarchyModifiedPreset}</option> }
          </select>
        </div>

        <div className="category-hierarchy-wrapper min-height">
        <ModifiableCategoryHierarchy
              items={ this.state.entity_hierarchy }                         
              visible={true}   
              draggable={false}
              displayOnly={true}
              limitHeight={true}
              setModified={this.setModified.bind(this)}
        />
        </div>

      </div>
    )
  }
}


export default NewProjectEntityHierarchy;