module.exports = {
	promptForAdminAccount: function() {
		var prompt = require('prompt');

		var schema = {
		properties: {
		  name: {
		    pattern: /^[a-zA-Z\s\-]+$/,
		    message: 'Name must be only letters, spaces, or dashes',
		    required: true
		  },
		  password: {
		    hidden: true
		  }
		}
		};

		prompt.start();
		prompt.message = ">"
		prompt.delimiter = " "

		console.log("Please enter a username and password for the Administrator account.\nOnly the Administrator will be able to create a project and view statistics while the annotation is underway.\n")

		prompt.get(['Username:', 'Password:'], function (err, result) {
		// 
		// Log the results. 
		// 
		console.log('Command-line input received:');
		console.log('  Username: ' + result["Username:"]);
		console.log('  Password: ' + result["Password:"]);
		});
	}
}