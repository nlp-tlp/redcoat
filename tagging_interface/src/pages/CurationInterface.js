import React from 'react';
import {Component} from 'react';
import _ from 'underscore';

import ControlBar from '../components/ControlBar';

import getCookie from '../functions/getCookie';

import initAnnotationsArray from '../functions/tagging_interface/initAnnotationsArray';
import Annotation from '../functions/tagging_interface/Annotation';
import {Comment, CommentInput} from '../components/Comment';
import ProfileIcon from '../components/ProfileIcon';

import {Word, Sentence} from '../components/tagging_interface/documentComponents';



// Config for all API fetch requests
const fetchConfigGET = {
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};



class CurationInterface extends Component {
	constructor(props) {
		super(props);
		this.state = {

			documentId: null,
			documents: [],			
			annotations: [],
			comments: [],

			userHasAnnotated: [],

			annotatorAgreement: null,

			pageNumber: 1,
			totalPages: 1,
			recentlySaved: false,
			changesMade: false,
			
			searchTerm: null,
			sortBy: "Annotations",

			entityColourMap: {},

			loading: {
				querying: true,
				saving: false,
			}
		}
		this.commentBoxRef = React.createRef();
	}

	componentWillMount() {
		console.log("Loading state:", this.props.prevState)
		if(this.props.prevState) {
			this.setState(this.props.prevState);
		} else {
			this.queryAPI();
		}
	}

	componentDidUpdate(prevProps, prevState) {
		if(!_.isEqual(prevState, this.state)) {
			console.log("state updated");
			this.props.saveState(this.state);
		}	
		
	}



	async queryAPI() {

		await this.setState({
			loading: {
				querying: true,
				saving: false,
			}
		})

		var queryString = 'http://localhost:3000/projects/' + this.props.project_id + "/curation?pageNumber=" + this.state.pageNumber + "&sortBy=" + this.state.sortBy;
		if(this.state.searchTerm) {
			queryString += "&searchTerm=" + this.state.searchTerm;
		}

		fetch(queryString, fetchConfigGET)
		.then(response => response.text())
      	.then((data) => {
      		console.log(data, "xxx<<<");
      		var d = JSON.parse(data);

      		var userHasAnnotated = new Array();
      		for(var a of d.annotations) {
      			console.log(a)
      			userHasAnnotated.push((a !== null));
      		}

      		console.log("EE", userHasAnnotated);
      		this.setState({
      			documentId: d.documentId,
      			tokens: d.tokens,

      			annotations: initAnnotationsArray([d.tokens], d.annotations, this.state.searchTerm, true), //fix
      			comments: d.comments,
      			users: d.users,

      			userHasAnnotated: userHasAnnotated,

      			annotatorAgreement: d.annotatorAgreement,

      			entityColourMap: this.initEntityColourMap(d.categoryHierarchy.children),

      			pageNumber: d.pageNumber,
      			totalPages: d.totalPages,

      			loading: {
      				querying: false,
      				saving: false,
      			}
      		}, () => { console.log("XXXXXXXXXXXXX", this.state.annotations) })
      	});



	}


	// Search all documents for a specific search term.
	searchDocuments(searchTerm) {
		this.setState({
			pageNumber: 1,
			searchTerm: searchTerm 
		}, this.queryAPI);   
	}

	submitAnnotations() {
		return null;
	}

	loadPreviousPage() {
		if(this.state.loading.querying) return;
		if(this.state.pageNumber === 1) return;
		this.setState({
			pageNumber: this.state.pageNumber - 1,
		}, this.queryAPI)
	}

	loadNextPage() {
		if(this.state.loading.querying) return;
		if(this.state.pageNumber >= this.state.totalPages) return;
		this.setState({
			pageNumber: this.state.pageNumber + 1,
		}, this.queryAPI)

	}

	goToPage(pageNumber) {
		if(this.state.loading.querying) return;
		if(pageNumber < 1 || pageNumber > this.state.totalPages) return;
		this.setState({
			pageNumber: pageNumber,
		}, this.queryAPI);
	}

	setSortBy(e) {
		var sortBy = e.target.value;

		this.setState({
			sortBy: sortBy,
		}, this.queryAPI)
	}

	// Initialise the entity colour map, which maps entity_class: colour_index, e.g. "Item": 1. Passed to the Word components to colour
	// their labels accordingly.
	initEntityColourMap(categoryHierarchy) {
		var entityColourMap = {}
		for(var ec_idx in categoryHierarchy) {
		  var entityClass = categoryHierarchy[ec_idx];
		  entityColourMap[entityClass.name] = entityClass.colorId + 1;
		}
		return entityColourMap;
	}


	submitComment(message, next) {
		var t = this;
		console.log("Message:", message);

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
		    text: message,
		    documentId: this.state.documentId,
		  }),  
		};

		fetch('http://localhost:3000/projects/' + this.props.project_id + '/comments/submit', fetchConfigPOST) // TODO: move localhost out
		.then(response => response.text())
		.then((data) => {
		  console.log(data);
		  try { 
		    var d = JSON.parse(data);		    

		    var comments = this.state.comments;
		    comments.push(d.comment);


		    this.setState({
		       comments: comments,
		    }, () => {
		    	next();
		    	t.commentBoxRef.current.scrollTop = t.commentBoxRef.current.scrollHeight;
		    });
		  } catch(err) {
		    console.log("ERROR:", err);
		    next();
		  }      
		});

	}

	render() {
		return (

			<div id="tagging-interface">
				<div id="sentence-tagging" className="curation-page">
					<ControlBar
	                  pageNumber = {this.state.pageNumber}
	                  totalPages = {this.state.totalPages}
	                  totalPagesAvailable = {this.state.totalPages}
	                  recentlySaved={this.state.recentlySaved}
	                  changesMade={this.state.changesMade}
	                  querying={this.state.loading.querying}
	                  saving={this.state.loading.saving}
	                  inSearchMode={this.state.searchTerm}

	                  showSortBy={true}
                  	  sortBy={this.state.sortBy}
                  	  sortByOptions={["Annotations", "Creation date", "Agreement"]}
                  	  setSortBy={this.setSortBy.bind(this)}


	                  searchDocuments={this.searchDocuments.bind(this)}
	                  submitAnnotations={this.submitAnnotations.bind(this)}
	                  loadPreviousPage={this.loadPreviousPage.bind(this)}
	                  loadNextPage={this.loadNextPage.bind(this)}
	                  goToPage={this.goToPage.bind(this)}

	                  curationPage={true}
	                />

	                {
                    	(!this.state.loading.querying && !this.state.tokens) && 
                    	<div className="loading-message no-results-found">No results found.</div>
                  	}

                  	<div className="curation-interface-inner">
                  		<div className="document-window" id="sentence-tagging">

                  			
                  			  <div className="agreement-score">
                  			  <span className="name">Agreement:</span>
                  			  	{ this.state.annotatorAgreement && <span className="value">{(this.state.annotatorAgreement * 100).toFixed(2)}%</span>}
                  			  	{ !this.state.annotatorAgreement && <span className="value na">N/A</span>}
                  			  </div>

                  			{
		          			this.state.annotations.map((annotations, index) => 
		          				<CurationDocumentContainer
		          					user={this.state.users[index] || null}
		          					index={index}
		          					tokens={this.state.tokens}
		          					annotations={this.state.annotations[index]}
		          					entityColourMap={this.state.entityColourMap}
				                	displayOnly={true}
		          				/>
		          			)}


                  		</div>
                  		<div className="comments-pane">

				            <div className="comments-wrapper">
				            	{ this.props.user && 

				            	<div className="comments-inner">


				            		<h3 className={this.state.comments.length === 0 ? "hidden" : ""}>Comments {this.state.comments.length > 0 && "(" + this.state.comments.length + ")"}</h3>

				            		{this.state.comments.length === 0 && <div className="no-comments-yet">No comments yet.</div>}
				                	<div className="comments-even-more-inner" ref={this.commentBoxRef}>
				                  	{ this.state.comments.map((comment, i) => <Comment index={i} {...comment} hideDocumentString={true} />) }
				                	</div>
				                	<CommentInput user_profile_icon={this.props.user.profile_icon} submitComment={this.submitComment.bind(this)}/>
				                	

				              	</div>
				              	}
				            </div>
						          
						
                  		</div>
                  	</div>

				</div>


			</div>

		)
	}
}


class CurationDocumentContainer extends Component {
	constructor(props) {
		super(props);
	}

	render() {

		return (
			<div className="document-container">
          		<div className="document-wrapper">
	          		<div className={"curation-document" + (this.props.user ? "" : " not-yet-annotated")}>
	          			<div className="user-row">
	          				<ProfileIcon user={this.props.user}/><span className="username">{this.props.user && this.props.user.username}</span> 

	          			</div>
		          		<div className="sentence display-only">		          		

		              		<Sentence 
				                index={this.props.index}
				                words={this.props.tokens}              
				                annotations={this.props.annotations}  
				                entityColourMap={this.props.entityColourMap}

				                displayOnly={true}
				              />				            
		          		
		          		</div>
		          	</div>
		       	</div>
		    </div>



		)
	}
}

export default CurationInterface