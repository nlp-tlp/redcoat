var _ = require('underscore');


// Calculate agreement score using Michael's jaccard based method.
// Has two components: labelScore, i.e. how closely each annotator's labels align (regardless of spans), and
// spanScore, i.e. how closely each annotator's spans align (regardless of labels).
// I bet I could do this in like 20 lines in python :'(
module.exports = function(tokens, labels) {

  function mean(arr) {
    return arr.reduce((a, b) => a + b) / arr.length;
  }

  // Calculate the label-level scores by calculating the jaccard index between the labels of each token, across each annotator with every
  // other annotator.
  function calculateLabelScore(tokens, labels) {

    // Initialise labelSets, an array like [ [ set(annotator 1's labels for token 1), set(annotator 2's labels for token 1) ...], ...  ]
    labelSets = new Array(tokens.length).fill(null) // [ [ set(annotator 1's labels for token 1)   ]  ]
    for(var token_idx in tokens) {
      labelSets[token_idx] = new Array();
    }

    for(var annotator_idx in labels) {
      for(var token_idx in tokens) {
        labelSets[token_idx][annotator_idx] = new Set();
      }      
    }

    // Build the label sets array. Kind of like zip in python I guess
    for(var annotator_idx in labels) {      
      for(var token_idx in labels[annotator_idx]) {        

        var bioTagAndLabels = labels[annotator_idx][token_idx];

        var bioTag       = bioTagAndLabels[0];
        if(bioTagAndLabels.length === 1) continue;
        var labelClasses = bioTagAndLabels[1];

        for(var label of labelClasses) {
          labelSets[token_idx][annotator_idx].add(label)
        }        
      }
    }

    // Calculate the token-level jaccard scores  
    var jaccard_scores = new Array();
    for(var token_idx in labelSets) {

      var token_jaccard_scores = new Array();

      for(var i = 0; i < labelSets[token_idx].length; i++) {

        var myLabels = labelSets[token_idx][i];
        for(var j = i + 1; j < labelSets[token_idx].length; j++) {
          var theirLabels = labelSets[token_idx][j];

          var union = _.union(Array.from(myLabels), Array.from(theirLabels));
          var intersect = _.intersection(Array.from(myLabels), Array.from(theirLabels));

          if(union.length > 0) {
            var jaccard_index = intersect.length / union.length;
            token_jaccard_scores.push(jaccard_index);
          }
        }

      }
      if(token_jaccard_scores.length > 0) {
        jaccard_scores.push(mean(token_jaccard_scores));
      }
      
    }
    console.log("Token jaccard scores:", jaccard_scores);
    return jaccard_scores.length > 0 ? mean(jaccard_scores) : 1.0; // If jaccard scores is empty, there were no labels i.e. complete agreement    
  }

  // Calculate the span score by calculating the jaccard index of each the spans (regardless of label) across annotators.
  function calculateSpanScore(tokens, labels) {

    var DocumentAnnotation = require('../document_annotation');

    mentions = new Array(labels.length);
    for(var i in labels) {
      mentions[i] = new Array();
    }

    for(var annotator_idx in labels) {
      var mentionsJSON = DocumentAnnotation.toMentionsJSON(labels[annotator_idx], tokens);
      for(var m of mentionsJSON.mentions) {
        var s = m.start;
        var e = m.end;
        mentions[annotator_idx].push(s + "_" + e);
      }      
    }
    //console.log("Mentions:\n", mentions)

    var jaccard_scores = new Array();
    for(var i = 0; i < mentions.length - 1; i++) {
      
      var myMentions = mentions[i];
      
      for(var j = i + 1; j < mentions.length; j++) {
        var theirMentions = mentions[j];
        var union = _.union(Array.from(myMentions), Array.from(theirMentions));
        var intersect = _.intersection(Array.from(myMentions), Array.from(theirMentions));
        
        var jaccard_index = union.length === 0 ? 0 : intersect.length / union.length;     

        //console.log(myMentions, theirMentions, jaccard_index)            
        jaccard_scores.push(jaccard_index);
      }
    }

    return mean(jaccard_scores);
  }

  labelScore = calculateLabelScore(tokens, labels);
  spanScore  = calculateSpanScore(tokens, labels);
  
  finalScore = (labelScore + spanScore) / 2;

  for(var annotator_idx in labels) {
    console.log("Annotator " + (parseInt(annotator_idx) + 1) + ":", getNicelyFormattedLabels(tokens, labels[annotator_idx]));
  }
  

  console.log("Label / span / final score:", labelScore.toFixed(2), spanScore.toFixed(2), finalScore.toFixed(2), "\n");

  return finalScore;


}



// Print the labels nicely
function getNicelyFormattedLabels(tokens, labels) {
  var s = '';
  var currentLabels = '';
  for(var i in tokens) {
    var token = tokens[i];
    if(labels[i].length === 1) {

      if(currentLabels) {
        s += ": (" + "\x1b[36m" + currentLabels + "\x1b[0m" + ")] "
        currentLabels = '';
      }

      s += token + " ";
      continue;
    }
    if(labels[i][0] === "B-") {
      if(currentLabels) {
        s += ": (" + "\x1b[36m" + currentLabels + "\x1b[0m" + ")] "
        currentLabels = '';
      }
      s += "["
      currentLabels = labels[i][1].join(', ');
    }
    s += token + " ";
    if((parseInt(i) === tokens.length - 1) && currentLabels) {
      s += ": (" + "\x1b[36m" + currentLabels + "\x1b[0m" + ")] "
    }

  }
  return s;
}
