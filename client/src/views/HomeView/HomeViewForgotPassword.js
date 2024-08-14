import React from "react";
import {Component} from "react";
import { Link } from 'react-router-dom';

import BASE_URL from 'globals/base_url';
import _fetch from 'functions/_fetch';

class HomeViewForgotPassword extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      errorMessage: null,
      email: '',
      success: false,
    }
  }

  handleEmailChange(e) {
    this.setState({
      email: e.target.value,
    })
  }


  async submitForm(e) {
    e.preventDefault();    

    var postBody = {
      email: this.state.email,
    }



    await this.setState({
      errorMessage: null,
      loading: true,
    });
    
    var d = await _fetch('users/forgot_password', 'POST', this.props.setErrorCode, postBody);
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
          <h1>Forgot Password</h1>
        </div>
        <div class="body">

          <div className="loading-message"><i className="fa fa-spinner fa-spin"></i>Loading...</div>
          { this.state.errorMessage && <div className="error-message"><span className="error">Error: </span>{this.state.errorMessage}.</div>}
          
          { this.state.success
            ? <div>
                <div className="form-notice form-success">An email has been sent to your email address with instructions on how to reset your password.</div>
                <div class="buttons"><Link class="back-button" to={BASE_URL + "login"}><i class="fa fa-chevron-left"></i>&nbsp;&nbsp; Back</Link></div>
              </div>
            : <form onSubmit={this.submitForm.bind(this)}>
              <div>
                <label>Email address</label>
                <input type="email" name="email" autoFocus="autofocus" required="required" placeholder="Username or email" value={this.state.email} onChange={this.handleEmailChange.bind(this)} />
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

export default HomeViewForgotPassword;