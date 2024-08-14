import React from "react";
import {Component} from "react";
import BASE_URL from 'globals/base_url';

import { Redirect, Link, BrowserRouter, Route, Switch, withRouter } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from "react-transition-group";
import getCookie from 'functions/getCookie';

import HomeViewLogin from 'views/HomeView/HomeViewLogin';
import HomeViewRegister from 'views/HomeView/HomeViewRegister';
import HomeViewForgotPassword from 'views/HomeView/HomeViewForgotPassword';
import HomeViewResetPassword from 'views/HomeView/HomeViewResetPassword';

import _fetch from 'functions/_fetch';

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
                 
                <Route path={BASE_URL + "login"}              render={() => <HomeViewLogin setErrorCode={this.props.setErrorCode} setUserData={this.props.setUserData}/> } />     
                <Route path={BASE_URL + "register"}           render={() => <HomeViewRegister setErrorCode={this.props.setErrorCode} /> } />  
                <Route path={BASE_URL + "forgot_password"}    render={() => <HomeViewForgotPassword setErrorCode={this.props.setErrorCode} /> } />  
                <Route path={BASE_URL + "reset_password/:id"} render={(p) => <HomeViewResetPassword token={p.match.params.id} setErrorCode={this.props.setErrorCode} /> } />  
                <Route exact path={BASE_URL + "reset_password"}     render={() => <Redirect to={BASE_URL}/> } />  

                <Route path={BASE_URL}         component={HomeViewMain} />       
                
              </Switch>
            </section>
          </CSSTransition>
        </TransitionGroup>

      </section>
      

    )
  }
}


export default withRouter(HomeView);
