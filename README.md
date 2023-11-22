# Redcoat - Collaborative Annotation Tool for Hierarchical Entity Typing

Redcoat is a lightweight web-based annotation tool for labelling entity recognition data.

## Dependencies

-   NodeJS (v16.16.0) and NPM (v8.11.0)
-   MongoDB v4.2.24

Note that later versions of the above packages may work, but have not been tested.

## How to install

First, ensure [Mongodb](https://www.mongodb.com/try/download/community) is installed. On the Community Server page, download version 4.2.24 for your operating system (Windows x64, MSI for most users). Once it has been installed, open a new terminal window, and run Mongodb:

    $ mongod

You'll need to keep this terminal window open while running Redcoat.

Then, in a new terminal window, clone this repository into a folder and navigate there by running the commands:

    $ git clone https://github.com/Michael-Stewart-Webdev/redcoat.git
    $ cd redcoat

If you are running Redcoat for the first time, navigate to the `tagging_interface` folder, install the required dependencies, and build the interface:

    $ cd tagging_interface
    $ npm install
    $ npm run build

Next, navigate back to the root directory of this repository and install Redcoat's dependencies using `npm`\*:

    $ cd ..
    $ npm install

The Redcoat server may be run using the command:

    $ npm run production

You may then visit the server in your browser by visiting `http://localhost:5000`.

#### Note for Windows users - possible problems

If you attempt to run 'mongod' in your terminal and Windows does not recognise the command, navigate to the location in which mongod.exe is installed (for me it was C:\Program Files\MongoDB\Server\4.2\bin), open a power shell window, and run `mongod`. If that doesn't work, try `.\mongod`.

When attempting to run `mongod` in your terminal, you may receive an error message along the lines of "NonExistentPath: Data directory C:\data\db not found". If this happens, you'll need to create an empty folder in your C drive called "data" and a folder called "db" inside that folder.

If you are using Windows and encounter many errors when attempting `npm install`, it may be necessary to install the Windows Build Tools by running the command in an _administrative_ power shell terminal:

    $ npm install --global --production windows-build-tools@4.0.0

After installing the build tools, run `npm install` again followed by `npm start`. If an error appears again during `npm install`, I found that `npm start` still works. (will need to look into this, but it is specific to Windows at least)

### (Optional) using Sendgrid to manage emails

If you have a Sendgrid account, and would like the server to be able to use your Sendgrid account to send out automated emails upon the creation of an annotation project, you must first export your sendgrid api key as an environment variable. For example:

    $ export SENDGRID_API_KEY="<your sendgrid api key>"

You'll then need to restart Redcoat (terminate the process and run `npm run production` again) for the changes to take effect.

## Using Docker

You can deploy the application using the provided docker-compose file. First, build the redcoat image, from the redcoat folder:

```
docker build -t redcoat:latest .
```

Then:

```
docker-compose up -d
```
