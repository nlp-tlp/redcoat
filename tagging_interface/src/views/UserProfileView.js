import React from "react";
import {Component} from "react";
import { TwitterPicker } from 'react-color';

import { Link } from "react-router-dom";
import getCookie from 'functions/getCookie'
import _ from 'underscore';

// A list of icon options from FontAwesome that the user can choose from
const iconOptions = [
  "user", "anchor", "automobile", "asterisk", "bath", "battery", "binoculars", "bicycle", "bomb", "bullhorn", "child", "cubes", "female", "diamond", "cogs", "coffee", "fax", "flag", "fire-extinguisher", "flash", "fire", "male", "heart", "gift", "globe", "legal", "leaf", "microphone", "paw", "rocket", "magnet", "star", "space-shuttle", "trophy", "umbrella"
]

const colourOptions = 
["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#cddc39", "#ffeb3b", "#ffc107", "#ff9800", "#ff5722", "#795548", "#eee", "#ccc", "#aaa", "#888", "#444", "#222"]


class UserProfileView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: {                   // The user is stored in both this.state and this.props (from App.js).
        profile_icon: {         // Unsaved changes will be stored in this.state.
          foreground: "#aaa",   // Changes that are saved are pushed up to App.js in the saveChanges function.
          background: "#eee",
          icon: 'user',
        },
        
      }
    }
  }

  // When this component is updated via App.js, check whether the user profile has been updated.
  // If it has, set this user to props.user.
  componentDidUpdate(prevProps, prevState) {
    if(!_.isEqual(prevProps.user, this.props.user) && !_.isEqual(this.props.user, this.state.user)) {
      console.log('sidsp')
      this.setState({
        user: this.props.user,
      });
    }
  }

  componentWillMount() {
    if(this.props.user) {
      this.setState({
        user: this.props.user,
      });
    }
  }

  // Submit the changes (which are saved in the state) to the API.
  saveChanges() {
    var t = this;
    console.log('saving')
    const csrfToken = getCookie('csrf-token');
    const fetchConfigPOST = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'csrf-token': csrfToken,
      },
      dataType: "json",
      body: JSON.stringify(this.state.user.profile_icon),  
    };

    this.setState({
      saving: true, 
    }, () => {
      fetch('http://localhost:3000/api/users/set_profile_icon', fetchConfigPOST) // TODO: move localhost out
      .then((response) => {
        if(response.status !== 200) {
          throw new Error(response.status);
        }  
        return response.text()
      })
      .then((data) => {

        var d = JSON.parse(data);       
        t.props.setUserProfileIcon(d.profile_icon);

        this.setState({
          saving: false,
        });
      }).catch((err) => {
        this.props.setErrorCode(parseInt(err.message));
      });
    });
  }

  // Set the foreground colour
  handleForegroundColourChange(colour) {
    var user = this.state.user;
    user.profile_icon.foreground = colour.hex;
    this.setState({
      user: user,
    })
  }

  // Set the background colour
  handleBackgroundColourChange(colour) {
    console.log('hello')
    var user = this.state.user;
    user.profile_icon.background = colour.hex;
    this.setState({
      user: user,
    })
  }

  // Set the icon
  setIcon(icon) {
    if(iconOptions.indexOf(icon) === -1) return;
    var user = this.state.user;
    user.profile_icon.icon = icon;
    this.setState({
      user: user,
    }, () => { console.log(this.state.user.profile_icon.icon)})
  }

  render() {
    return (
      <div id="user-profile-page">


        
        <section className="form-section">

          <h3>Profile icon</h3>

          <div className="flex-columns align-center">

            <div className="flex-column">
              <div className="profile-icon-preview">
                <div className="circle-icon profile-icon extra-large box-shadow" style={{'background': this.state.user.profile_icon.background}}><i className={"profile-icon-i fa fa-" + this.state.user.profile_icon.icon} style={{'color': this.state.user.profile_icon.foreground}}></i></div>
              </div>
            </div>

            <div className="flex-column vertical-align-top">
              <h4>Foreground colour</h4>
              <TwitterPicker
                colors={colourOptions}
                color={ this.state.user.profile_icon.foreground }
                onChangeComplete={ this.handleForegroundColourChange.bind(this) }
              />
            
              <h4>Background colour</h4>
              <TwitterPicker
                colors={colourOptions}
                color={ this.state.user.profile_icon.background }
                onChangeComplete={ this.handleBackgroundColourChange.bind(this) }
              />
            </div>
          
            <div className="flex-column vertical-align-top">
              <h4>Icon</h4>
              <div className="icon-options">
                { iconOptions.map((icon, index) => <div onClick={() => this.setIcon(icon)} className={"icon-option" + (icon === this.state.user.profile_icon.icon ? " active" : "")}><i class={"fa fa-" + icon}></i></div>)}
              </div>

            </div>
          </div>
          <div className="form-save-row">
            <a className="annotate-button submit-button" onClick={this.saveChanges.bind(this)} ><i class="fa fa-save"></i>Save</a>
          </div>
      </section>
    </div>

    )
  }
}


export default UserProfileView