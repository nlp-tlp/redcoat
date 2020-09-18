import React from "react";
import {Component} from "react";

import { Redirect, Link, BrowserRouter, Route, Switch, withRouter } from 'react-router-dom'
import { TransitionGroup, CSSTransition } from "react-transition-group";



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

class HomePageRegister extends Component {
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
          <form action="/redcoat/register" method="post">
            <input type="hidden" name="_csrf" value="8tb7dlyN-cJPwiKjIFeZEZLfXxm-UvBvEPGc"/>
            <div>
              <label>Username</label>
              <input type="text" name="username" autofocus="autofocus" placeholder="Username"/>
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
              <div><Link class="back-button" to="/"><i class="fa fa-chevron-left"></i>&nbsp;&nbsp; Back</Link></div>
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

class HomePageLogin extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div class="user-form form-box">
        <div class="header">
          <h1>Login</h1>
        </div>
        <div class="body">
          <form action="/redcoat/login" method="post">
            <input type="hidden" name="_csrf" value="JoYK9F5f-Z2AbKePiJC15tqlyBNs61sAb1Pk"/>
            <div>
              <label>Username</label>
              <input type="text" name="username" autofocus="autofocus" required="required" placeholder="Username"/>
            </div>
            <div>
              <label>Password</label>
              <input type="password" name="password" required="required" placeholder="Password"/>
            </div><a class="forgot-password-link" href="/redcoat/forgot_password">Forgot password?</a>
            <div class="buttons">
              <div><Link class="back-button" to="/"><i class="fa fa-chevron-left"></i>&nbsp;&nbsp; Back</Link></div>
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

class HomePageMain extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="homepage-main">
        <h1 id="h1-welcome" data-content="Redcoat">Redcoat</h1>
        <h2 id="h2-byline" data-content="Collaborative Annotation Tool">Collaborative Annotation Tool</h2>
        <div class="buttons"><Link to="/register">
            <div class="button" id="register-button">
              <h2>
               Register
              </h2>
            </div></Link><Link to="/login">
            <div class="button" id="login-button">
              <h2>
                Login
              </h2>
            </div></Link></div>
        </div>

      )


  }
}

class HomePage extends Component {
  constructor(props) {
    super(props);
  }
  render() {

    var location = this.props.location;
    console.log(location);

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
                 
                <Route path="/login"    component={HomePageLogin} />     
                <Route path="/register" component={HomePageRegister} />  
                <Route path="/"         component={HomePageMain} />       
                
              </Switch>
            </section>
          </CSSTransition>
        </TransitionGroup>

      </section>
      

    )
  }
}


export default withRouter(HomePage);