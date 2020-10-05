import Annotation from './Annotation';

// Sets up an array to store the annotations with the same length as docGroup.
// Prepopulate the annotations array with the automaticAnnotations if available (after converting them to BIO).
// This could be either the dictionary-based annotations or the annotations that the user has previously entered.
//
// oneDocument = whether this is only being passed one doc but multiple annotations i.e. curation interface
function initAnnotationsArray(documents, automaticAnnotations, searchTerm, oneDocument) {

  console.log(searchTerm, "<SEARCHTERM")
  console.log(documents)
  console.log(automaticAnnotations);
  console.log('---')

  var repeatedDocs = new Array();
  if(oneDocument) {
    for(var i in automaticAnnotations) {
      repeatedDocs.push(documents[0]);
    }
    documents = repeatedDocs;
  }

  if(searchTerm) {
    var searchTermArray = searchTerm.split(' ');
  }

  //console.log(documents, "<");
  //console.log(automaticAnnotations, "<");

  var annotations = new Array(documents.length);
  for(var doc_idx in documents) {
    annotations[doc_idx] = new Array(documents[doc_idx].length);


    var searchIdx = 0;
    for(var token_idx in documents[doc_idx]) {
      annotations[doc_idx][token_idx] = new Annotation(documents[doc_idx][token_idx], parseInt(token_idx));

      // If a search term is present (i.e. user is in search mode), adjust the highlighting of the annotation
      // so that it displays the searched portion of the token differently        
      if(searchTerm) {
        var token = documents[doc_idx][token_idx];
        var foundIdx = token.indexOf(searchTermArray[searchIdx]);
        if(foundIdx >= 0) {
          annotations[doc_idx][token_idx].setHighlighting(foundIdx, foundIdx + searchTermArray[searchIdx].length - 1);
          searchIdx++;
        } else {
          searchIdx = 0;
        }        
      }
    }

    
  }

  if(!automaticAnnotations) return annotations;

  //console.log(this.state.documents, "<")

  // Load annotations from the automaticAnnotations array if present.
  for(var doc_idx in automaticAnnotations) {
    if(!automaticAnnotations[doc_idx]) continue;
    for(var mention_idx in automaticAnnotations[doc_idx]['mentions']) {


      var mention = automaticAnnotations[doc_idx]['mentions'][mention_idx];
      var start = mention['start'];
      var end = mention['end'];

      for(var label_idx in mention['labels']) {
        var label = mention['labels'][label_idx];

        for(var k = start; k < end; k++) {
          var bioTag = k === start ? 'B' : "I";

          //console.log(annotations[doc_idx], k, automaticAnnotations[doc_idx]['mentions'])
          annotations[doc_idx][k].addLabel(bioTag, label, documents[doc_idx].slice(start, end).join(' '), start, end - 1)


        }
      }
    }        
  }
  return annotations;
}

export default initAnnotationsArray;