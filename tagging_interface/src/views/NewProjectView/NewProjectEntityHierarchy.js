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
      data: {
        entity_hierarchy: [],
      },
      
      selectedPreset: "None",
      hierarchyModified: false,
      hierarchyModifiedPreset: null,

    }

    this.selectLabelRef = React.createRef();
    this.selectRef = React.createRef();
    this.justMounted = true;
  }

  componentDidMount() {
    
    // if(this.props.prevState) {
    //   console.log("Loading state:", this.props.prevState)
    //   this.setState(this.props.prevState);
    // } else {
    //   this.setState({
    //     entity_hierarchy: this.props.entity_hierarchy,
    //     selectedPreset: "None",
    //   });
    // }
  }

  componentDidUpdate(prevProps, prevState) {

    if(!_.isEqual(this.props.data, this.state.data) && _.isEqual(prevState.data, this.state.data)) {
     this.setState({
      data: { ...this.props.data}
     });            
    } 

    if(!this.justMounted && !_.isEqual(this.state.data, prevState.data)) {
      this.props.updateFormPageData(this.state.data); 
    }    
    this.justMounted = false; 

  }

  async setModified(entity_hierarchy) {
    if(this.state.selectedPreset === "None") {
      var modifiedPresetName = "Custom"
    } else {
      var modifiedPresetName = hierarchyPresets[this.state.selectedPreset]['name'];
      modifiedPresetName += " (modified)";
    }

    //console.log('modified')
    

    await this.setState({
      data: {
        entity_hierarchy: entity_hierarchy,
      },

      hierarchyModified: true,
      hierarchyModifiedPreset: modifiedPresetName,
    });

    this.props.updateFormPageData(this.state.data);
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
      data: {
        entity_hierarchy: hierarchy,
      },
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
    console.log(this.state.data.entity_hierarchy);

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
              items={ this.state.data.entity_hierarchy }  
              preset={this.state.selectedPreset}                       
              visible={true}   
              limitHeight={true}
              setModified={this.setModified.bind(this)}
        />
        </div>

      </div>
    )
  }
}


export default NewProjectEntityHierarchy;