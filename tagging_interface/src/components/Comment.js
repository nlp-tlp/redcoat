import React from 'react';
import {Component} from 'react';

import formatDate from '../functions/formatDate'

class Comment extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="comment-box">
        <div className="comment-left">                  
          <div className="circle-icon profile-icon"></div>
        </div>
        <div className="comment-right">
          <div className={"comment-author st"}>{this.props.author}<span className="comment-date st">{formatDate(this.props.date)}</span></div>
          <div className="comment-text st st-block">{this.props.text}</div>
          {this.props.document && <blockquote className="comment-document st">{this.props.document}</blockquote>}
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
  }

  onSubmit(e) {
    console.log(this.state.comment);
    e.preventDefault();

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
            <div className="circle-icon profile-icon"></div>
          </div>
          <div className="comment-right margin-right">
            <div className="comment-text">
              <textarea name="comment-input" className="comment-input" placeholder="Write a comment..." onChange={this.setComment.bind(this)} value={this.state.comment}></textarea>



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