import React from 'react';
import logo from './favicon.png'
import './stylesheets/stylesheet.scss';
import {Component} from 'react';

var data = {
  hello: 5,
  hi: 7
}

class MainWindow extends Component {
  constructor(props) {
    super(props);
  }

  render() {

    return (
      <div>Hello I am the tagging window</div>

    )

  }
}

function App() {
  return (
    <div className="App">
      <header>
        <div class="title">
          <img src={logo} class="logo"></img>
          Redcoat - Annotation Interface (WIP)
        </div>
      </header>      
      <MainWindow data={data}/>      
    </div>
  );
}


export default App;
