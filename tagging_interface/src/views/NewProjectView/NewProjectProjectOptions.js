import React from 'react';
import {Component} from 'react';
import NewProjectFormHelpIcon from 'views/NewProjectView/NewProjectFormHelpIcon';

class NewProjectProjectOptions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: {
        hierarchy_permissions: "",
      }
    }
  }

  componentDidMount() {
    this.setState({
      data: this.props.data,
    })
    //this.props.updateFormPageData(this.state.data);
  }

  changeOverlap(e) {
    var value = e.target.value;
    this.setState({
      data: {...this.state.data, overlap: value}
    })
  }

  render() {
    var help = (<div>
        <h2>Project Options</h2>
        <p>Please specify the options of this project.
          <ul>
            <li><b>Hierarchy permissions</b>: If allowed, your annotators will be able to add categories as they appear, or delete ones that aren not relevant. This option is useful if you aren't sure whether your category hierarchy covers every possible category in your dataset. </li>
            <li><b>Overlap</b>: The number of times each document will be annotated. More overlap can result in a more robust set of results, but requires longer annotation time. You can mark your project as "complete" at any time.</li>            
          </ul>

        </p>
      </div>
    )

    var overlap = this.state.data.overlap;
    var num_users = this.state.data.num_users;

    return (
      <div>
        <h2>Project Options <NewProjectFormHelpIcon onClick={() => this.props.toggleFormHelp(help)} /></h2>

        <div className="form-group">
          <label>To what extent should annotators be able to modify the category hierarchy?</label>
          <select value={this.state.data.hierarchy_permissions} required>
            <option disabled hidden value="">Click to select</option>
            <option value="no_modification">No modifications allowed.</option>
            <option value="create_edit_only">Annotators can create new categories.</option>
            <option value="full_permission">Annotators can create, delete and rename categories.</option>
          </select>
        </div>
        <div className="form-group" style={{'margin-top': '40px'}}>

          <label>How many times should a document be annotated before annotation is considered complete?</label>
          <div className="input-range-group">
            <div className="inner">
              <div className="input-range-summary">
                <p><span className="num">{overlap}</span> annotation{overlap > 1 ? "s" : ""}/document<br/></p>
                <p className="small">Each annotator labels approximately <span className="avg">{(1 / num_users * overlap * 100).toFixed(2)}</span>% of the corpus.</p>
              </div>
              <div class="input-range-container">
                <div class="left">1</div>
                <input id="input-overlap" name="input-overlap" type="range" min="1" max={num_users} onChange={(e) =>this.changeOverlap(e)} value={overlap} onKeyDown={(e)=> e.keyCode == 13 ? e.preventDefault(): ''}/>
                <div class="right">{num_users}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default NewProjectProjectOptions;