import React from 'react';
import {Component} from 'react';


class FeaturesPage extends Component {

  constructor(props) {
    super(props);
  }

  render() {

    return (
	    <article className="features-list">

			<h2>List of current features (v1.0, 5 April 2019)</h2>

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
		</article>
    )
  }
}



export default FeaturesPage;