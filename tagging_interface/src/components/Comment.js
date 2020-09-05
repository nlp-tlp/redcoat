import React from 'react';
import {Component} from 'react';

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
          <div className={"comment-author st"}>{this.props.author}<span className="comment-date">{this.props.date}</span></div>
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
  }

  render() {
    return (
      <div className="comment-box">
        <div className="comment-left">                  
          <div className="circle-icon profile-icon"></div>
        </div>
        <div className="comment-right">
          <div className="comment-text st st-block"><textarea className="comment-input" placeholder="Write a comment..."></textarea></div>          
        </div>
      </div>
    )
  }
}

export { Comment };
export { CommentInput };