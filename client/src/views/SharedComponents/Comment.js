import React from 'react';
import {Component} from 'react';
import BASE_URL from 'globals/base_url';
import formatDate from 'functions/formatDate'
import { Link } from 'react-router-dom'

// text={comment.text} date={comment.created_at} author={comment.author} document={comment.document_string}

class Comment extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="comment-box">
        <div className="comment-left">    
          <div className="circle-icon profile-icon" style={{'background': this.props.user_profile_icon.background}}><i className={"profile-icon-i fa fa-" + this.props.user_profile_icon.icon} style={{'color': this.props.user_profile_icon.foreground}}></i></div>
        </div>
        <div className="comment-right">
          <div className={"comment-author st"}>{this.props.author}<span className="comment-date st">{formatDate(this.props.created_at)}</span></div>
          {!this.props.hideDocumentString && 
            <blockquote className="comment-document st">
              <span className="document-string">{this.props.document_string}</span>
              <Link to={BASE_URL + "projects/" + this.props.project_id + "/annotations/curation?docId=" + this.props.document_id}><i class="fa fa-external-link"></i></Link>
            </blockquote>}
          <div className="comment-text st st-block">{this.props.text}</div>
          
        </div>
      </div>
    )
  }
}

class CommentInput extends Component {
  constructor(props) {
    super(props);
    this.state = {
      comment: '',
    }
    this.inputRef = React.createRef();
  }

  componentDidUpdate(prevProps, prevState) {
    if(prevProps.open != this.props.open && this.props.open) {
      this.inputRef.current.focus();
    }

  }

  onSubmit(e) {
    e.preventDefault();

    if(this.state.comment.length === 0) return;

    this.props.submitComment(this.state.comment, () => {
      this.setState({
        comment: '',
      })
    })    
    return;
  }

  setComment(e) {
    this.setState({
      comment: e.target.value
    })
  }

  render() {
    return (
      <form className="comment-input-box" onSubmit={this.onSubmit.bind(this)}>
        <div className="comment-box">
          <div className="comment-left">     
            { this.props.user_profile_icon &&              
            <div className="circle-icon profile-icon" style={{'background': this.props.user_profile_icon.background}}><i className={"profile-icon-i fa fa-" + this.props.user_profile_icon.icon} style={{'color': this.props.user_profile_icon.foreground}}></i></div>
            }
          </div>
          <div className="comment-right margin-right">
            <div className="comment-text">
              <textarea ref={this.inputRef} name="comment-input" className="comment-input" placeholder="Write a comment..." onChange={this.setComment.bind(this)} value={this.state.comment} maxlength="10000" ></textarea>



            </div> 

          </div>     
           

        </div>
        <div className="submit-comment-wrapper"><button className="submit-comment"><i class="fa fa-send"></i></button></div>
      </form>
    )
  }
}

export { Comment };
export { CommentInput };