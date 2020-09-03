import React from "react";
import styled from "styled-components";
import { Link, Switch, Route, withRouter } from "react-router-dom";
import { TransitionGroup, CSSTransition } from "react-transition-group";



import Error404Page from './pages/Error404Page';

import {Component} from 'react';

const BASE_URL = "/"






// class Container extends Component {

// 	render () {
// 	  var location = this.props.location;
// 	  return (
// 	    <div className="transition-wrapper">
// 	      <TransitionGroup className="transition-group">
// 	        <CSSTransition
// 	          key={location.key}
// 	          timeout={{ enter: 100, exit: 100 }}
// 	          classNames="fade"
// 	        >

// 	          <section className="route-section">
// 	            <Switch location={location}>
// 	            <Route        path="/projects/:id/tagging"  render={(p) => <TaggingInterfaceTemplate {...this.state} pageComponent={<TaggingInterface project_id={p.match.params.id} />}/>} /> 
// 	            <Route        path="/projects/:id"          render={(p) => <ProjectViewTemplate {...this.state} pageTitle="Project View" pageComponent={ <ProjectView project_id={p.match.params.id}/> } />} />     
// 	            <Route        path="/projects"              render={( ) => <MainTemplate {...this.state} pageTitle="Projects" pageComponent={ <ProjectListPage/> } />} />     
// 	            <Route        path="/setup-project"         render={( ) => <MainTemplate {...this.state} pageTitle="Setup project" pageComponent={ <SetupProjectPage/> } />} />     

// 	            <Route        path="/features"              render={( ) => <MainTemplate {...this.state} pageTitle="Features" pageComponent={ <FeaturesPage/> } />} />     
// 	            <Route  exact path="/"                      render={( ) => <MainTemplate {...this.state} pageTitle="" pageComponent={ <HomePage/> } />} />
// 	            <Route                                      render={( ) => <MainTemplate {...this.state} pageTitle="" pageComponent={ <Error404Page/> } />} /> />
// 	          </Switch>
// 	          </section>


	          
// 	        </CSSTransition>
// 	      </TransitionGroup>
// 	    </div>
// 	  );
// 	}
// }

// export default withRouter(Container);
