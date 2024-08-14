import React from 'react';
import {Component} from 'react';

import CategoryHierarchy from 'views/SharedComponents/CategoryHierarchy';



function generateEmptyTable() {
  var n = 15;
  var arr = new Array(n).fill(0);
  

  function stringOfRandomLength(minlen, maxlen) {
    var s = '';
    for(var i = 0; i < minlen + Math.floor(Math.random() * maxlen); i++) {
      s += 'x';
    }
    return s;
  }

  return (
    <table className="project-page-table">
      <tbody>
       { arr.map((x, i) => 
        <tr> 
          <td><span className="inner"><span className="st">{stringOfRandomLength(30, 70)}</span></span></td>
          <td><span className="inner"><span className="st">{stringOfRandomLength(30, 70)}</span></span></td>
        </tr>
      ) }
    </tbody>
  </table>
  )  
}


// function getColourIndex(row, colourIndexes) {
//   var s = row.split('/');
//   var base_class = s.length > 1 ? s[0] : s;
//   return colourIndexes[base_class] + 1
// }

// function getRowName(row) {
//   var s = row.split('/');
//   var rowName = s.length > 1 ? s[s.length - 1] : s;
//   var spacing = '';
//   for(var i = 1; i < s.length; i++) {
//     spacing += " - ";
//   }
//   return spacing + rowName;
// }

class CategoryHierarchyPage extends Component {
  constructor(props) {
    super(props);
  }



  render() {
    console.log(this.props.data, this.props.loading, 'xxx');
    return ( 
      <main className="project-page">

        <h2>Entity Hierarchy</h2>

        <div className="category-hierarchy-wrapper">
          { this.props.loading && generateEmptyTable() }


          { ! this.props.loading &&  <CategoryHierarchy
              items={this.props.data.children}                         
              visible={true}   
              draggable={false}
              displayOnly={true}  
              tableForm={true}
          

          />
          }
          
        </div>

       



      </main>
    )
  }
}

export default CategoryHierarchyPage;