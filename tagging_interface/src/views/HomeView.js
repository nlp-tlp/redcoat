import React from "react";
import {Component} from "react";
import BASE_URL from 'globals/base_url';

import { Redirect, Link, BrowserRouter, Route, Switch, withRouter } from 'react-router-dom'
import { TransitionGroup, CSSTransition } from "react-transition-group";
import getCookie from 'functions/getCookie';


var lipsumStr = "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id, lorem. Maecenas nec odio et ante tincidunt tempus. Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante. Etiam sit amet orci eget eros faucibus tincidunt. Duis leo. Sed fringilla mauris sit amet nibh. Donec sodales sagittis magna. Sed consequat, leo eget bibendum sodales, augue velit cursus nunc,";
var lipsum = lipsumStr.split(". ")

function getRandomString() {
  var arr = []
  for(var i = 0; i < 200; i++) {
    arr.push(lipsum[Math.floor(Math.random() * lipsum.length)] + ". ")
  }
  return arr.join("")
}

function getNextWord(i) {
  return lipsum[i] + " ";
}



class LettersBackground extends Component {
  constructor(props) {
    super(props);
    this.state = {
      characters: getRandomString(),
    }
    this.characterChangeFn = null;
  }

  changeCharacters() {
    this.setState({
      characters: getRandomString(),
    })
  }

  componentWillUnmount() {
    window.clearInterval(this.characterChangeFn);
  }

  componentWillMount() {
    this.characterChangeFn = window.setInterval(this.changeCharacters.bind(this), 1000);
    // Was originally rotating chars but seems unnecessary
  }

  render() {
    return (
      <div className="letters-background">
        {this.state.characters}
      </div>
    )
  }
}

class HomeViewRegister extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div class="user-form form-box">
        <div class="header">
          <h1>Register</h1>
        </div>
        <div class="body">
          <div className="loading-message"><i className="fa fa-spinner fa-spin"></i>Loading...</div>
          <form action="/redcoat/register" method="post">
            <div>
              <label>Username</label>
              <input type="text" name="username" autoFocus="autofocus" placeholder="Username"/>
            </div>
            <div>
              <label>Email</label>
              <input type="email" name="email" placeholder="Email" required="required"/>
            </div>
            <div>
              <label>Password</label>
              <input id="password" type="password" name="password" placeholder="Password" required="required"/>
              <label>Password confirmation</label>
              <input id="password_confirmation" type="password" name="password_confirmation" required="required" placeholder="Password confirmation"/>
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

  submitForm(e) {
    e.preventDefault();
    console.log(e);
    const csrfToken = getCookie('csrf-token');

    const fetchConfigPOST = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'csrf-token': csrfToken,
      },
      dataType: "json",
      body: JSON.stringify({
        email: this.state.email,
        password: this.state.password,
      }),  
      credentials: 'include',
    };


    this.setState({
      errorMessage: null,
      loading: true,
    }, () => 

      window.setTimeout( () => {

        fetch('http://localhost:3000/api/users/login', fetchConfigPOST) // TODO: move localhost out
        .then(async (response) => {
          if(response.status !== 200) {
            var d = await response.json();
            throw new Error(d.message);      
          }          
          return response.text()
        })
        .then((data) => {
          try {
            var d = JSON.parse(data);
          } catch(err) {
            console.log(err, d);
            throw new Error("An unexpected error has occured")
          }
          
          this.props.setUserData(d);          
        }).catch((err) => {
          this.setState({
            errorMessage: err.message,
            password: '',
            loading: false,
          });
        })
      }, 1)
    );

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

class HomeViewForgotPassword extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div class="user-form form-box">
        <div class="header">
          <h1>Forgot Password</h1>
        </div>
        <div class="body">
          <form action="/redcoat/forgot_password" method="post">
            <input type="hidden" name="_csrf" value="oOFHs5QK-_YPdUWgNII3vfrQ_erXv2dwFmz8"/>
            <div>
              <label>Email</label>
              <input type="email" name="email" placeholder="Email" required="required" autoFocus="autofocus"/>
            </div>
            <div class="buttons">
              <div><Link class="back-button" to={BASE_URL + "login"}><i class="fa fa-chevron-left"></i>&nbsp;&nbsp; Back</Link></div>
              <div>
                <input type="submit" value="Reset password"/>
              </div>
            </div>
          </form>
        </div>
      </div>
    )
  }
}

class HomeViewMain extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="homepage-main">
        <h1 id="h1-welcome" data-content="Redcoat">Redcoat</h1>
        <h2 id="h2-byline" data-content="Collaborative Annotation Tool">Collaborative Annotation Tool</h2>
        <div class="buttons"><Link to={BASE_URL + "register"}>
            <div class="button" id="register-button">
              <h2>
               Register
              </h2>
            </div></Link><Link to={BASE_URL + "login"}>
            <div class="button" id="login-button">
              <h2>
                Login
              </h2>
            </div></Link></div>
        </div>

      )


  }
}

class HomeView extends Component {
  constructor(props) {
    super(props);
  }
  render() {

    var location = this.props.location;

    return (
    
      <section id="welcome">
        <LettersBackground/>

        <TransitionGroup className="transition-group">
          <CSSTransition
          key={location.key}
          timeout={{ enter: 400, exit:400 }}
          classNames="fade"
          >
            <section className="route-section homepage-route-section">
             <Switch location={location}>
                 
                <Route path="/login"    render={() => <HomeViewLogin setUserData={this.props.setUserData}/> } />     
                <Route path="/register" component={HomeViewRegister} />  
                <Route path="/forgot_password" component={HomeViewForgotPassword} />  
                <Route path="/"         component={HomeViewMain} />       
                
              </Switch>
            </section>
          </CSSTransition>
        </TransitionGroup>

      </section>
      

    )
  }
}


export default withRouter(HomeView);