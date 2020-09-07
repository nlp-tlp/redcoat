var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/redcoat-db-dev', function(err, db) {
  if(err) { console.log("\x1b[31m" + err.message); }
});



var Document = require('../document');
var DocumentAnnotation = require('../document_annotation');

var DocumentGroup = require('../document_group');
var DocumentGroupAnnotation = require('../document_group_annotation');




DocumentGroup.find({}, function(err, docgroups) {
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

	console.log(documentIds);
	Document.collection.insertMany(singleDocuments, function(err, ds) {
		if(err) { console.log(err, "<<"); }
		console.log("Inserted", singleDocuments.length, "documents.");

		DocumentGroupAnnotation.find({}, function(err, dgas) {
			console.log(dgas[0])

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

			DocumentAnnotation.collection.insertMany(singleDAs, function(err, ds) {
				if(err) { console.log(err); }
				console.log("Inserted", singleDAs.length, "document annotations.");

				process.exit();
			});

		});


	});


	
})


