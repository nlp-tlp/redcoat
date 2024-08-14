import React from 'react';
import {Component} from 'react';

class ProfileIcon extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		var user = this.props.user;
		if(!user) {
			return (
				<div className={"circle-icon profile-icon " + (this.props.size || "small")}style={{'background': "#ddd"}}></div>
			)

		}
		return (
			<div className={"circle-icon profile-icon " + (this.props.size || "small")}style={{'background': user.profile_icon ? user.profile_icon.background : "#ddd"}}>
				<i className={"profile-icon-i fa fa-" + (user.profile_icon ? user.profile_icon.icon : "user")} style={{'color': user.profile_icon ? user.profile_icon.foreground : "#666"}}></i>
            </div>
        )
	}

}

export default ProfileIcon;
