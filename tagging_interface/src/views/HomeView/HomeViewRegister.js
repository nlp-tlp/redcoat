import React from "react";
import {Component} from "react";
import { Link, Redirect } from 'react-router-dom';

import BASE_URL from 'globals/base_url';
import _fetch from 'functions/_fetch';

class HomeViewRegister extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      passwordConfirmation: '',
      email: '',

      success: false,
      errorMessage: null,
      loading: false,
    }
  }

  handleUsernameChange(e) {
    this.setState({
      username: e.target.value,
    })
  }

  handleEmailChange(e) {
    this.setState({
      email: e.target.value,
    })
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
      username: this.state.username,
      email: this.state.email,
      password: this.state.password,
    }

    await this.setState({
      errorMessage: null,
      loading: true,
    });
    
    var d = await _fetch('users/register', 'POST', this.props.setErrorCode, postBody);
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
        passwordConfirmation: '',
        loading: false,
      });
    }
  }


  render() {
    if(this.state.success) {
      return <Redirect to={BASE_URL + "projects"}/>;
    }
    return (
      <div class={"user-form form-box" + (this.state.loading ? " loading" : "")}>
        <div class="header">
          <h1>Register</h1>
        </div>
        <div class="body">

          <div className="loading-message"><i className="fa fa-spinner fa-spin"></i>Loading...</div>
          
          { this.state.errorMessage && <div className="error-message"><span className="error">Error: </span>{this.state.errorMessage}.</div>}


          <div className="loading-message"><i className="fa fa-spinner fa-spin"></i>Loading...</div>
          <form onSubmit={this.submitForm.bind(this)}>
            <div>
              <label>Username</label>
              <input onChange={this.handleUsernameChange.bind(this)} value={this.state.username} type="text" name="username" autoFocus="autofocus" placeholder="Username" required="required"/>
            </div>
            <div>
              <label>Email</label>
              <input onChange={this.handleEmailChange.bind(this)} type="email" name="email" placeholder="Email" required="required"/>
            </div>
            <div>
              <label>Password</label>
              <input id="input-password" type="password" name="password" required="required" value={this.state.password} onChange={this.handlePasswordChange.bind(this)} />
 
              <label>Password confirmation</label>
              <input id="input-password-confirmation" type="password" name="password" required="required" value={this.state.passwordConfirmation} onChange={this.handlePasswordConfirmationChange.bind(this)} />
            </div>
            <div class="buttons">
              <div><Link class="back-button" to={BASE_URL}><i class="fa fa-chevron-left"></i>&nbsp;&nbsp; Back</Link></div>
              <div>
                <input type="submit" value="Register"/>
              </div>
            </div>
          </form>
        </div>
      </div>
    )
  }
}

export default HomeViewRegister;