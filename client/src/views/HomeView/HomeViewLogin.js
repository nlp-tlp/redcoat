import React from "react";
import {Component} from "react";
import { Link } from 'react-router-dom';

import BASE_URL from 'globals/base_url';
import _fetch from 'functions/_fetch';

class HomeViewLogin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: '',
      error: null,
      errorMessage: null,
    }
  }

  handleUsernameChange(e) {
    this.setState({
      email: e.target.value,
    })
  }

  handlePasswordChange(e) {
    this.setState({
      password: e.target.value,
    })
  }

  async submitForm(e) {
    e.preventDefault();

    var postBody = {
      email: this.state.email,
      password: this.state.password,
    }



    await this.setState({
      errorMessage: null,
      loading: true,
    })

    
    var d = await _fetch('users/login', 'POST', this.props.setErrorCode, postBody);
    console.log("D:", d);
    if(!d.error) { // Not using status codes as they are intercepted by _fetch
      this.props.setUserData(d); 
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
          <h1>Login</h1>
        </div>
        <div class="body">
          <div className="loading-message"><i className="fa fa-spinner fa-spin"></i>Loading...</div>
          { this.state.errorMessage && <div className="error-message"><span className="error">Error: </span>{this.state.errorMessage}.</div>}
          
          <form onSubmit={this.submitForm.bind(this)} method="post">
            <div>
              <label>Username or email</label>
              <input type="text" name="email" autoFocus="autofocus" required="required" placeholder="Username or email" value={this.state.email} onChange={this.handleUsernameChange.bind(this)} />
            </div>
            <div>
              <label>Password</label>
              <input type="password" name="password" required="required" placeholder="Password" value={this.state.password} onChange={this.handlePasswordChange.bind(this)} />
            </div><Link class="forgot-password-link" to={BASE_URL + "forgot_password"}>Forgot password?</Link>
            <div class="buttons">
              <div><Link class="back-button" to={BASE_URL}><i class="fa fa-chevron-left"></i>&nbsp;&nbsp; Back</Link></div>
              <div>
                <input type="submit" value="Login"/>
              </div>
            </div>
          </form>

        </div>
      </div>
    )
  }
}

export default HomeViewLogin;