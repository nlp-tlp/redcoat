# Redcoat - Collaborative Annotation Tool for Hierarchical Entity Typing

Redcoat is a lightweight web-based annotation tool for labelling entity recognition data.


## Dependencies

- NodeJS and NPM
- MongoDB version 4 or later

## How to install

First, clone the repository into a folder and navigate there by running the commands:

    $ git clone https://github.com/Michael-Stewart-Webdev/redcoat.git
    $ cd redcoat

If you are using Windows, install the build tools by running the command in an *administrative* power shell terminal:

    $ npm install --global --production windows-build-tools@4.0.0

Then install Redcoat's dependencies using `npm` (in a non-administrative terminal):

    $ npm install

Install [Mongodb](https://www.mongodb.com/download-center), open a new terminal window, and run Mongodb:

    $ mongod

Redcoat may be run using the command:

    $ npm run production

You may then visit the server in your browser by visiting `localhost:3000`.

### (Optional) using Sendgrid to manage emails

If you have a Sendgrid account, and would like the server to be able to use your Sendgrid account to send out automated emails upon the creation of an annotation project, you must first export your sendgrid api key as an environment variable. For example:

    $ export SENDGRID_API_KEY="<your sendgrid api key>"
	
You'll then need to restart Redcoat (terminate the process and run `npm run production` again) for the changes to take effect.






