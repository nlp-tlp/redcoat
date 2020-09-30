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
        hierarchy_preset: "None",
      },
      
      
      preset_is_modified: false,

    }

    this.selectLabelRef = React.createRef();
    this.selectRef = React.createRef();
  }

  componentDidMount() {
    this.setState({
      data: this.props.data
    })
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

  componentDidMount() {
    this.setState({
      data: this.props.data,
      preset_is_modified: (this.props.data.hierarchy_preset.indexOf("(modified)") > 0),
     }); 
  }

  componentDidUpdate(prevProps, prevState) {

    // if(!_.isEqual(this.props.data, this.state.data) && _.isEqual(prevState.data, this.state.data)) {
    //  this.setState({
    //   data: { ...this.props.data}
    //  });            
    // } 

    // if(!_.isEqual(this.props.data, this.state.data) && !_.isEqual(prevState.data, this.state.data)) {
    //   console.log('updating', this.state.data)
    //   this.props.updateFormPageData(this.state.data);
    // } 
  }

  async setModified(entity_hierarchy) {
    if(this.state.preset_is_modified) {
      this.props.updateFormPageData(this.state.data);
      return;
    }
    // if(this.state.selectedPreset === "None") {
    //   var modifiedPresetName = "Custom"
    // } else {
    //   var modifiedPresetName = hierarchyPresets[this.state.selectedPreset]['name'];
    //   modifiedPresetName += " (modified)";
    // }

    //console.log('modified')
    

    await this.setState({
      data: { ...this.state.data, hierarchy_preset: this.state.data.hierarchy_preset === "None" ? "Custom" : (this.state.data.hierarchy_preset + " (modified)")},
      preset_is_modified: true,
    });
    console.log(this.state.data.hierarchy_preset);
    this.props.updateFormPageData(this.state.data);

    //this.props.updateFormPageData(this.state.data);
  }

  changePreset(e) {

    function getPreset(preset_name) {
      if(preset_name === "None") {
        return {
          name: "None",
          entities: new Array(),
          hierarchy: [],
          descriptions: {},
        }
      }
      console.log(preset_name, "X");
      for(var preset of hierarchyPresets) {
        if(preset.name === preset_name) {
          return {
            name: preset.name,
            entities: preset.entities,
            hierarchy: txt2json(slash2txt(preset.entities), preset.entities, preset.descriptions).children,
            descriptions: preset.descriptions || {},
          }
        }
      }
    }

    var value = e.target.value;
    var preset = getPreset(value);
    console.log(preset.entities);
    console.log(preset.hierarchy);
    this.selectRef.current.blur();

    this.setState({
      data: {
        entity_hierarchy: preset.hierarchy,
        hierarchy_preset: preset.name,
      },
      preset_is_modified: false,
    }, () => {
      this.props.updateFormPageData(this.state.data);
      window.scrollTo({
        top: this.selectLabelRef.current.offsetTop + 140,
        left: 0,
        behavior: 'smooth'
      });
    })
  }

  render() {
    //console.log(this.state.data.entity_hierarchy);

    var help = (<div>
        <h2>Entity Hierarchy</h2>
        <p>Please define your entity hierarchy.</p>
        <p>You may create new categories by entering them in the form below. To specify a parent category, place a space before the child category. The categories are visualised in the Category Hierarchy, which you may also use to create your hierarchy if you prefer. You may also select from a list of presets, such as the standard 4-class Named Entity Recognition model.</p>
      </div>
    )

    function getPresetName(preset) {
      return preset['name']// + " (" + preset['entities'].length + " entity classes)";
    }


    return (
      <div>
        <h2>Entity Hierarchy <NewProjectFormHelpIcon onClick={() => this.props.toggleFormHelp(help)} /></h2>

        {!this.props.loading && 
        <div className="form-group no-padding">
          <label ref={this.selectLabelRef} >Preset</label>
          <select onChange={(e) => this.changePreset(e)} ref={this.selectRef} value={this.state.data.hierarchy_preset}  >
            <option value="None">None</option>
            { hierarchyPresets.map((preset, index) => <option value={getPresetName(preset)} key={index}>{getPresetName(preset)} </option> ) }
          
            { this.state.preset_is_modified && <option value={this.state.data.hierarchy_preset}>{this.state.data.hierarchy_preset}</option> }
          </select>
        </div>
        }

        <div className="category-hierarchy-wrapper min-height">
        {!this.props.loading && 
        <ModifiableCategoryHierarchy
              items={ this.state.data.entity_hierarchy || [] }  
              preset={this.state.selectedPreset}                       
              visible={true}   
              limitHeight={true}
              setModified={this.setModified.bind(this)}
        />
        }
        </div>


      </div>
    )
  }
}


export default NewProjectEntityHierarchy;