import React from "react";
import {Component} from "react";
import { Link } from 'react-router-dom';

import BASE_URL from 'globals/base_url';
import _fetch from 'functions/_fetch';

class HomeViewResetPassword extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      errorMessage: null,
      password: '',
      passwordConfirmation: '',
      success: false,
    }
  }

  handlePasswordChange(e) {
    this.setState({
      password: e.target.value,
    })
  }

  handlePasswordConfirmationChange(e) {
    this.setState({
      passwordConfirmation: e.target.value,
    })
  }


  async submitForm(e) {
    e.preventDefault();    

    if(this.state.password !== this.state.passwordConfirmation) {
      this.setState({
        errorMessage: "Password and password confirmation do not match.",
      });
      return;
    }

    var postBody = {
      password: this.state.password,
    }

    await this.setState({
      errorMessage: null,
      loading: true,
    });
    
    var d = await _fetch('users/reset_password/' + this.props.token, 'POST', this.props.setErrorCode, postBody);
    console.log("D:", d);
    if(!d.error) { // Not using status codes as they are intercepted by _fetch
      this.setState({
        success: true,
        loading: false,
      })
    } else {      
      this.setState({
        errorMessage: d.error,
        password: '',
        loading: false,
      });
    }
  }

  render() {
    return (
      <div class={"user-form form-box" + (this.state.loading ? " loading" : "")}>
        <div class="header">
          <h1>Reset Password</h1>
        </div>
        <div class="body">

          <div className="loading-message"><i className="fa fa-spinner fa-spin"></i>Loading...</div>
          
          { this.state.errorMessage && <div className="error-message"><span className="error">Error: </span>{this.state.errorMessage}.</div>}
          
          { this.state.success
            ? <div>
                <div className="form-notice form-success">Your password has been reset.</div>
                <div class="buttons"><Link class="back-button" to={BASE_URL + "login"}><i class="fa fa-chevron-left"></i>&nbsp;&nbsp; Login</Link></div>
              </div>
            : <form onSubmit={this.submitForm.bind(this)}>
              <div>
                <label>Password</label>
                <input id="input-password" type="password" name="password" autoFocus="autofocus" required="required" value={this.state.password} onChange={this.handlePasswordChange.bind(this)} />
              </div>
              <div>
                <label>Password confirmation</label>
                <input id="input-password-confirmation" type="password" name="password" required="required" value={this.state.passwordConfirmation} onChange={this.handlePasswordConfirmationChange.bind(this)} />
              </div>
              <div class="buttons">
                <div><Link class="back-button" to={BASE_URL + "login"}><i class="fa fa-chevron-left"></i>&nbsp;&nbsp; Back</Link></div>
                <div>
                  <input type="submit" value="Reset password"/>
                </div>
              </div>
            </form>
          }
        </div>
      </div>
    )
  }
}

export default HomeViewResetPassword;