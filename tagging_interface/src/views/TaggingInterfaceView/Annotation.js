import _ from 'underscore';

// A class to store an annotation for a single token.
// Seemed more logical to put all the annotation logic in one class rather than sticking it in the TaggingInterface component.
// Each sentence will have one Annotation object per token.
// Properties:
/* 
   token: the token e.g. 'centrifugal'
   tokenIndex: the index of the token in the sentence
   bioTag: the BIO tag ('B', 'I' or 'O')
   entityClasses: the array of entity classes AKA labels (e.g. ['Item', 'Item/Pump'])   
   spanText: the text of the span that this annotation is within (e.g. 'centrifugal pump')
   spanStartIdx: the start index of the span this annotation is in, e.g. 0 if it starts at the first word of the sentence
   spanEndIdx: the end index as above, e.g. 1,
*/
class Annotation {
  constructor(token, tokenIndex) {
    this.token = token;
    this.tokenIndex = tokenIndex;
    this.bioTag = "O";    
    this.highlighting = null;
  }

  // Adds the specified entityClass to this annotation.
  // bioTag: The bioTag, e.g. "B" or "I",
  // entityClass: The entity class, e.g. "Item/Pump"
  // text: The text of the span that this annotation is inside, e.g. "centrifugal pump".
  // spanStartIdx, spanEndIdx: self explanatory (as above)
  // nextAnnotation: The Annotation object for the next token in the sentence.
  //                 When called during the dictionary annotation tagging, nextAnnotation is not necessary.
  // Returns whether the label of this annotation was modified at all.
  addLabel(bioTag, entityClass, spanText, spanStartIdx, spanEndIdx) {
    
    if(this.entityClasses === undefined) this.entityClasses = new Array();

    var alreadyHasLabel = this.entityClasses.indexOf(entityClass) !== -1;
    if(this.bioTag === bioTag && this.spanText === spanText && this.spanStartIdx === spanStartIdx && this.spanEndIdx === spanEndIdx && alreadyHasLabel) {
      return false;
    }

    // Adjust the span.
    this.bioTag = bioTag;
    this.spanText = spanText;
    this.spanStartIdx = spanStartIdx;
    this.spanEndIdx = spanEndIdx;

    // Add the entityClass to the entityClasses array for this Annotation.
    // If it is already there, don't add it again.
    if(!alreadyHasLabel) {
      this.entityClasses.push(entityClass);
    }
    return true;
  
    // If the nextAnnotation is from the same mention (AKA span) as this one, and does not have exactly the same labels after
    // the new class has been appended to this annotation's entityClasses, change its BIO tag to B.
    // This is the part that ensures mentions are split up when the user changes the label of token(s) inside that mention.
    // if(nextAnnotation) {
    //   if(this.sameMention(nextAnnotation) && !this.sameEntityClasses(nextAnnotation) && nextAnnotation.hasLabel()) {
    //     console.log("Changing bio tag to B")
    //     nextAnnotation.changeBioTag("B");
    //     nextAnnotation.setSpanStartIdx(spanEndIdx + 1)          
    //   }
    // }

    // If the previous annotation is from the same mention as this one, and now no longer has the same labels,
    // adjust the spanEndIdx to be the start of this new span -1.
    // This ensures the tags are rendered correctly in the browser.
    // Note that this seems to get called multiple times when applying tags because they are applied in reverse order,
    // but the spanEndIdx will be set as below for the next annotation anyway so that shouldn't be an issue.
    // if(prevAnnotation) {
    //   if(this.sameMention(prevAnnotation) && !this.sameEntityClasses(prevAnnotation) && prevAnnotation.hasLabel()) {  
    //     prevAnnotation.setSpanEndIdx(spanStartIdx - 1);
    //   }
    // }
  }

  // Removes all the labels from this annotation and resets the bioTag to "O".
  removeAllLabels() {
    delete this.entityClasses;
    delete this.spanText;
    delete this.spanStartIdx;
    delete this.spanEndIdx;
    this.bioTag = "O";
  }

  // Simple function to determine whether this annotation is in the same mention as another annotation.
  sameMention(otherAnnotation) {
    return otherAnnotation.spanStartIdx === this.spanStartIdx && otherAnnotation.spanEndIdx === this.spanEndIdx;
  }

  // Determine whether this annotation has the same labels as another annotation.
  sameEntityClasses(otherAnnotation) {
    return _.isEqual(this.entityClasses, otherAnnotation.entityClasses);
  }

  // Removes a specific label from this annotation.
  // If it was the last label, reset this annotation's bioTag to "O" and delete the entityClasses and other properties.
  removeLabel(entityClass) {
    var index = this.entityClasses.indexOf(entityClass);
    if(index === -1) {
      console.log("Warning: tried to remove an entity class from an annotation that did not exist.")
      return;
    }
    this.entityClasses.splice(index, 1);
    if(this.entityClasses.length === 0) {
      this.bioTag = "O";
      delete this.entityClasses;
      delete this.spanText;
      delete this.spanStartIdx;
      delete this.spanEndIdx;
    }
  }

  // Change the bio tag of this annotation to another bio tag.
  changeBioTag(bioTag) {
    this.bioTag = bioTag;
  }

  // Returns whether this annotations has a label.
  hasLabel() {
    return this.bioTag !== "O";
  }

  // Determines whether this annotation is the last of its type in the given span.
  isLastInSpan() {
    return this.spanEndIdx === this.tokenIndex;
  }

  setSpanStartIdx(spanStartIdx) {
    this.spanStartIdx = spanStartIdx;
  }

  setSpanEndIdx(spanEndIdx) {
    this.spanEndIdx = spanEndIdx;
  }

  // Set the highlighting array (for search mode).
  setHighlighting(startIdx, endIdx) {
    this.highlighting = [startIdx, endIdx];
  }

  // Prints this annotation nicely to the console (for debugging).
  prettyPrint() {
    console.log("Token:    ", this.token);
    console.log("BIO Tag:  ", this.bioTag)
    console.log("Span:     ", this.spanText)
    console.log("StartIdx: ", this.spanStartIdx)
    console.log("EndIdx: ", this.spanEndIdx)
    console.log("Classes:  \n", this.entityClasses);
    console.log('\n');
  }
}


export default Annotation;