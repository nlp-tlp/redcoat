# annotation-tool

Redcoat is a lightweight web-based annotation tool for labelling entity recognition data.


## Dependencies

- NodeJS
- MongoDB version 4 or later

## How to install

Setting up Redcoat on a server is simple. First, clone this repository into a folder, and then install the requirements using `npm`:

$ npm install

Before starting the server, please ensure MongoDB is up and running correctly on the default port (27017). 

Redcoat may be run using the command:

$ npm run production

You may then visit the server in your browser by either visiting `localhost:3000` (if you are running Redcoat on your own computer) or `<your server's ip address>:3000` (if you are running Redcoat on a remote server).

### (Optional) using Sendgrid to manage emails

If you have a Sendgrid account, and would like the server to be able to use your Sendgrid account to send out automated emails upon the creation of an annotation project, you must first export your sendgrid api key as an environment variable. For example:

$ export SENDGRID_API_KEY="<your sendgrid api key>"
	
You'll then need to restart Redcoat (terminate the process and run `npm run production` again) for the changes to take effect.






