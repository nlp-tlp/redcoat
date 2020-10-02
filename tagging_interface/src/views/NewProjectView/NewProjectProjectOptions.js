import React from 'react';
import {Component} from 'react';
import NewProjectFormHelpIcon from 'views/NewProjectView/NewProjectFormHelpIcon';

class NewProjectProjectOptions extends Component {
  constructor(props) {
    super(props);
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

    return (
      <div>
        <h2>Project Options <NewProjectFormHelpIcon onClick={() => this.props.toggleFormHelp(help)} /></h2>

        <div className="form-group">
          <label>To what extent should annotators be able to modify the category hierarchy?</label>
          <select>
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
                <p><span className="num">1</span> annotation/document<br/></p>
                <p className="small">Each annotator labels approximately <span className="avg">10</span>% of the corpus.</p>
              </div>
              <div class="input-range-container">
                <div class="left">1</div>
                <input id="input-overlap" name="input-overlap" type="range" min="1" max="10" onKeyDown={(e)=> e.keyCode == 13 ? e.preventDefault(): ''}/>
                <div class="right">10</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default NewProjectProjectOptions;