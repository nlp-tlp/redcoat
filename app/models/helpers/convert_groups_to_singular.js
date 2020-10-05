// A script to convert all document groups etc in the database to singular docs.
// Only needs to be called once 

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/redcoat-db-dev', function(err, db) {
  if(err) { console.log("\x1b[31m" + err.message); }
});

async function convert() {


	var Document = require('../document');
	var DocumentAnnotation = require('../document_annotation');

	var DocumentGroup = require('../document_group');
	var DocumentGroupAnnotation = require('../document_group_annotation');

	/*Document.find({}, function(err, docs) {
						function saveDocs(docs, next) {
							console.log(docs.length);
							if(docs.length === 0) next();
							var d = docs.pop();

							d.save(function(err, savedDoc) {
								if(err) console.log(err);
								//console.log(savedDoc.document_string, docs.length);
								saveDocs(docs, next);
							})
						}
						saveDocs(docs, function() {
							console.log('done');
							process.exit();
						})
					});*/
					
					

	var docgroups = await DocumentGroup.find({})
	console.log(docgroups.length);

	var singleDocuments = new Array();


	var documentIds = {};

	for(var i in docgroups) {

		var docgroup = docgroups[i];

		for(var doc_idx in docgroup.documents) {

			var id = mongoose.Types.ObjectId();
			var doc = docgroup.documents[doc_idx];
			var times_annotated = docgroup.times_annotated;
			var document_index = docgroup.document_indexes[doc_idx];
			var project_id = docgroup.project_id;
			var last_recommended = docgroup.last_recommended;

			var singleDocument = new Document({
				_id: id,
				tokens: doc,
				times_annotated: times_annotated,
				document_index: document_index,
				project_id: project_id,
				last_recommended: last_recommended,
			});
			singleDocuments.push(singleDocument);
			if(!documentIds[docgroup._id]) documentIds[docgroup._id] = new Array();
			documentIds[docgroup._id].push(id);		
		}
	}

	//console.log(documentIds);
	try { 
		var ds = await Document.collection.insertMany(singleDocuments);
	} catch(err) {
		console.log(err);
	}
	//if(err) { console.log(err, "<<"); }
	console.log("Inserted", singleDocuments.length, "documents.");

	var dgas = await DocumentGroupAnnotation.find({})
		//console.log(dgas[0])

	var singleDAs = [];

	for(var i in dgas) {

		var dga = dgas[i];

		for(var doc_idx in dga.labels) {

			var singleDA = new DocumentAnnotation({
				labels: dga.labels[doc_idx],
				user_id: dga.user_id,
				document_id: documentIds[dga.document_group_id][doc_idx],
				created_at: dga.created_at,
				updated_at: dga.updated_at,
				project_id: dga.project_id,
			})
			singleDAs.push(singleDA);
		}


	}
	console.log(singleDAs.length);
	
	for(var i in singleDAs) {
		try { 
			await DocumentAnnotation.collection.insertOne(singleDAs[i]);
			console.log(i, " (ok)");
		} catch(err) {
			console.log(i, " (error)");
		}
	}
	console.log("Added das");

	//process.exit()
	
	/*try {
		var ds = await DocumentAnnotation.collection.insertMany(singleDAs)
	} catch(err) {
		console.log(err);
	}*/
	
	
	console.log("Inserted", singleDAs.length, "document annotations.");
	
	var docs = await Document.find({});
	for(var i in docs) {
		try {
			await docs[i].save();	
			console.log(i, " (ok)");
		} catch(err) {
			console.log(i, " (error)");
		}
		console.log(i, '/', docs.length);
	}


	// Forcefully save each one to ensure they validate, and so that the document strings get added
	//process.exit();
	/*Document.find({}, function(err, docs) {
		function saveDocs(docs, next) {
			if(docs.length === 0) next();
			var d = docs.pop();

			d.save(function(err, savedDoc) {
				if(err) console.log(err);
				//console.log(savedDoc.document_string, docs.length);
				saveDocs(docs, next);
			})
		}
		saveDocs(docs, function() {
			console.log('done');
			process.exit();
		})
	});*/


	process.exit();


	




		
	
}

async  function fixUsers() {

	var User = require('../user');
	var DocumentAnnotation = require('../document_annotation');
	
	var users = await User.find({});
	//console.log(users);
	
	for(user of users) {
		console.log(user.username);
		var documentAnnotations = await DocumentAnnotation.find({user_id: user._id});
		var docAnnIds = [];
		for(var da of documentAnnotations) {
			docAnnIds.push(da._id);
		}
		console.log(docAnnIds.length, " annotations");
		user.docgroups_annotated = docAnnIds;
		user.recent_projects = [];
		try {
			await user.save();
		} catch(err) {
			console.log(err);
		}
	}
	process.exit();
}

async function calculateAgreements() {
	var Document = require('../document');
	var docs = await Document.find({});
	for(i in docs) {
		
		var agreement = await docs[i].updateAgreementAsync();
		console.log(i, '/', docs.length, '| Agreement: ', agreement);
	}
	process.exit();
}

//convert();
//fixUsers();
calculateAgreements();


