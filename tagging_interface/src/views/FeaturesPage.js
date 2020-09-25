import React from 'react';
import {Component} from 'react';


class FeaturesPage extends Component {

  constructor(props) {
    super(props);
  }

  render() {

    return (
	    <article className="features-list">

	    	<h2>Version 2.0 - List of features (19 September 2020)</h2>

	    	<p>Redcoat underwent a significant revision for Version 2.0, bringing a wide array of new features including:</p>

	    	<ul>
	    		<li><b>Overall</b>
		    		<ul>
		    			<li>The front-end has been completely rebuilt in React. Redcoat now feels significantly more responsive as a result.</li>
		    		</ul>
		    	</li>
	    		<li><b>Project dashboard</b>
	    			<ul>
	    				<li><b>Key information</b>: The dashboard now shows key information at the top such as number of annotations, average agreement score, and average time per doc (which is still a work in progress).</li>
	    				<li><b>Entity frequencies</b>: A chart showing the number of mentions of each entity, which dynamically updates as annotators annotate the project.</li>
	    				<li><b>Activity</b>: A chart showing the activity of each annotator.</li>
	    				<li><b>Annotations/document</b>: A waffle chart showing the number of times each document has been annotated.</li>
	    				<li><b>Comments</b>: A list of all comments made about the project, with links to the corresponding documents in the new Curation Interface.</li>
	    			</ul>
	    		</li>
	    		<li><b>Curation interface</b>
	    			<ul>
	    				<li>The curation interface visualises all of the annotations made by each annotator and allows each annotator to comment on each doc using the comments window on the right.</li>
	    				<li>The compiled labels are displayed at the bottom of the annotators' annotations when more than one user has annotated the document.</li>
	    				<li>Documents can be searched and sorted in a similar manner to the annotation interface.</li>
	    			</ul>
	    		</li>
	    		<li><b>Annotation interface</b>
	    			<ul>
	    				<li>Annotators may navigate back to previous documents and update them as necessary.</li>
	    				<li>Annotators can search for specific documents via the search field at the top.</li>
	    				<li>Annotators can choose the number of documents per page - it is no longer fixed at 10.</li>
	    				<li>The categories in the category hierarchy can be dragged and dropped so that annotators can essentially rebind the hotkeys for each category when desired.</li>
	    				<li>Multiple tokens can be selected at once by holding Ctrl.</li>
	    				<li>Users can write comments on any document (visible by anyone also annotating the project) via the comments button at the bottom of each document.</li>
	    				<li>Users may specify their confidence via the Confidence buttons on the right (still a work in progress).</li>
	    				<li>There is a screenshot button at the bottom of each document which automatically saves a screenshot of the doc to a .png file.</li>
	    				<li>The save button has been moved to the top.</li>
	    				<li>The overall design of the interface has changed significantly to make it feel more polished.</li>  				
	    			</ul>
	    		</li>
	    		<li><b>Projects page</b>
	    			<ul>
	    				<li>The projects page has also changed in appearance, and now has a more streamlined look.</li>
	    				<li>There are fewer controls over searching/filtering etc - those may be implemented again later.</li>
	    			</ul>
	    		</li>
	    		<li><b>User profile</b>
	    			<ul>
	    				<li>There is now a User profile page.</li>
	    				<li>Users may customise their profile icon - the background, foreground and icon can be changed. These icons will appear on any comments the user makes on any projects.</li>
	    			</ul>
	    		</li>
	    		<li><b>Other changes</b>
	    			<ul>
	    				<li>Annotator agreement is now calculated whenever a document annotation is saved. The agreement metric is a jaccard-based similarity metric that incorporates both token similarity and span similarity (will be discussed in a future paper).</li>
	    			</ul>
	    		</li>
	    	</ul>


			<h2>Version 1.0 - List of features (5 April 2019)</h2>

			<p>Below is a list of features that are currently present in Redcoat.</p>

			<ul>
				<li> Project Setup page
					<ul>
						<li>Create annotation projects for Entity Recognition on the Setup Project page</li>
						<li>Automatic tokenisation of data, with summary of number of tokens/documents</li>
						<li>Create a concept hierarchy via an interactive tree, or alternatively via text input</li>
						<li>Multiple built-in hierarchies: NER, FIGER, Mining</li>
						<li>New project and associated data is persistent across refreshes</li>
					</ul>
				</li>
				<li>Projects page
					<ul>
						<li>Sort, search, and filter projects</li>
						<li>Detailed project summary</li>
					</ul>
				</li>
				
				<li>Annotation interface
					<ul>
						<li>Annotate projects via an intuitive user interface</li>
						<li>Keyboard support on the annotation interface (hotkeys, selection with arrow keys)</li>
						<li>Wikipedia summary of words in the annotation interface</li>
						<li>Search/filter category hierarchy to quickly find the relevant entity category	</li>
					</ul>
				</li>
			</ul>		

			<h3>Attributions</h3>
			<p>The pencil icon on the tagging interface was made by <a href="https://www.flaticon.com/authors/icongeek26" title="Icongeek26">Icongeek26</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a>.</p>
			<p>The Krippendorff Alpha agreement metric calculation was found on GitHub: <a href="https://github.com/tanbt/krippendorff-alpha">https://github.com/tanbt/krippendorff-alpha</a>.</p>
		</article>

    )
  }
}



export default FeaturesPage;