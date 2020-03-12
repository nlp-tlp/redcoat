# Redcoat - Collaborative Annotation Tool for Hierarchical Entity Typing

Redcoat is a lightweight web-based annotation tool for labelling entity recognition data.


## Dependencies

- NodeJS and NPM
- MongoDB version 4 or later

## How to install


First, ensure MongoDB is installed [Mongodb](https://www.mongodb.com/download-center). Open a new terminal window, and run Mongodb:

    $ mongod

Then, clone this repository into a folder and navigate there by running the commands:

    $ git clone https://github.com/Michael-Stewart-Webdev/redcoat.git
    $ cd redcoat

Next, install Redcoat's dependencies using `npm`\*:

    $ npm install

Redcoat may be run using the command:

    $ npm start

You may then visit the server in your browser by visiting `localhost:3000`.

#### Note for Windows users

If you are using Windows and encounter many errors when attempting `npm install`, it may be necessary to install the Windows Build Tools by running the command in an *administrative* power shell terminal:

    $ npm install --global --production windows-build-tools@4.0.0

After installing the build tools, run `npm install` again followed by `npm start`. 

### (Optional) using Sendgrid to manage emails

If you have a Sendgrid account, and would like the server to be able to use your Sendgrid account to send out automated emails upon the creation of an annotation project, you must first export your sendgrid api key as an environment variable. For example:

    $ export SENDGRID_API_KEY="<your sendgrid api key>"
	
You'll then need to restart Redcoat (terminate the process and run `npm run production` again) for the changes to take effect.






