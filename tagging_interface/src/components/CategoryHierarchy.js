import React from 'react';
import {Component} from 'react';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import styled from 'styled-components';
import _ from 'underscore';

// A single category in the category hierarchy tree.
class Category extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    var item = this.props.item;
    var index = this.props.index;
    var children = this.props.item.children;

    // If this component has any children, render each of them.
    if(children) {
      var childItems = (
        <ul className={this.props.open ? "" : "hidden"}>
          { children.map((item, index) => (
            <Category key={index}
                      item={item}
                      open={this.props.openedItems.has(item.full_name)}
                      openedItems={this.props.openedItems}
                      onClick={this.props.onClick}
                      hotkeyMap={this.props.hotkeyMap}
                      hotkeyChain={this.props.hotkeyChain}
                      isTopLevelCategory={false}
                      applyTag={this.props.applyTag}
            />)) }
        </ul>
      );
    } else {
      var childItems = '';
    }

    // Determine whether this category has a hotkey (by checking hotkeyMap).
    // Also determine hotkeyStr (for example '12' for 'item/pump').
    if(this.props.hotkeyMap) {
      var hasHotkey = this.props.hotkeyMap.hasOwnProperty(this.props.item.full_name)
      var hotkeyStr = hasHotkey ? this.props.hotkeyMap[this.props.item.full_name].join('') : '';
    } else {
      hasHotkey = false;
      hotkeyStr = '';
    }
    

    var content = (
      <span className="inner-container">
        
         {children && <span className="open-button" onClick={() => this.props.onClick(item.full_name)}><i className={"fa fa-chevron-" + (this.props.open ? "up" : "down")}></i></span>}
       
        <span className={"category-name" + (hasHotkey ? " has-hotkey" :"") + (this.props.hotkeyChain === hotkeyStr ? " hotkey-active" : "")}
              data-hotkey-id={hotkeyStr} onClick={this.props.applyTag ? () => this.props.applyTag(this.props.item.full_name) : null}>             

          {item.name}
        </span>
      </span>      
    )


    // This component will render differently depending on whether it is a top-level category or not.
    // Top level categories have the drag handle, which requires a different configuration on the wrapper and li.
    if(this.props.isTopLevelCategory) {


      if(this.props.draggable) {
        return (
          <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
            {(provided, snapshot) => (
              <li ref={provided.innerRef} {...provided.draggableProps} className={"draggable " + (snapshot.isDragging ? "dragging": "not-dragging") + " color-" + (item.colorId + 1)}>
                <div {...provided.dragHandleProps} className="drag-handle-container"><span className="drag-handle"></span></div>
                
                { content }
                { childItems }
                
              </li>
            )}
          </Draggable>
        )
      } else {
        return (
          <li className={" color-" + (item.colorId + 1)}>
            { content }
            { childItems }                
          </li>
        )
      }


    } else {
      return (
        <li>
          { content }
          { childItems }
        </li>
      )
    }
  }
}



// https://codesandbox.io/s/k260nyxq9v?file=/index.js:154-2795
// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

// Retrieve a list of ordered items based on an order array.
function getOrderedItems(items, order) {
  var orderedItems = new Array(items.length);
  for(var i = 0; i < order.length; i++) {
    orderedItems[i] = items[order[i]];
  }
  return orderedItems;
}

function setupItemOrder(items) {
  var itemOrder = new Array(items.length);
  for(var i = 0; i < itemOrder.length; i++) {
    itemOrder[i] = i;
  }
  return itemOrder;
}


// The category hierarchy (on the left).
class CategoryHierarchy extends Component {
  constructor(props) {
    super(props);
    this.state = {
      itemOrder: [],      // An array that maintains the ordering of the top-level categories.
                          // e.g. [0, 1, 3, 2]
      orderedItems: [],
      openedItems: new Set(),    // An set keep track of the items that have been open (indexed by name).
    }
    this.onDragEnd = this.onDragEnd.bind(this);
  }

  // When this component's items changes (should be when a new docGroup has been requested), setup a new itemOrder state.
  // (which defaults to ascending order e.g. 0, 1, 2, 3, 4 ...)
  componentDidUpdate(prevProps, prevState) {
    var itemOrder = setupItemOrder(this.props.items);
    if(!_.isEqual(prevProps.items, this.props.items)) {
      this.setState({
        openedItems: new Set(),
        orderedItems: this.props.items,
        itemOrder: itemOrder,
      });      
    }
  }

  componentWillMount() {
    var itemOrder = setupItemOrder(this.props.items);

    this.setState({
      openedItems: new Set(),
      orderedItems: this.props.items,
      itemOrder: itemOrder,
    });   
  }

  // Open or close a category.
  // It's pretty awkward that this function is necessary. It would be ideal to store 'open' as a state variable inside the Category and Subcategory
  // components, but that results in the wrong categories being open when the top-level categories are moved around.
  // Storing them in the openedItems array in this component's state allows for the opened categories to be maintained when the user
  // drags a category from one place to another.
  // full_name should be the full name of the category, e.g. item/pump/centrifugal_pump, which are unique.
  toggleCategory(full_name) {
    var openedItems = this.state.openedItems;    

    if(openedItems.has(full_name)) {
      openedItems.delete(full_name);
    } else {
      openedItems.add(full_name);
    }

    this.setState({
      openedItems: openedItems
    })
  }

  // When the user has finished dragging a category, determine the new item order and save this order to the state.
  onDragEnd(result) {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    const itemOrder = reorder(
      this.state.itemOrder,
      result.source.index,
      result.destination.index
    );

    var orderedItems = getOrderedItems(this.props.items, itemOrder)

    this.props.initHotkeyMap(orderedItems, () =>
      this.setState({
        itemOrder: itemOrder,
        orderedItems: orderedItems,
      })
    );
  }

  
  render() {

    var items       = this.state.orderedItems;
    var openedItems = this.state.openedItems;



    return (
      <div id="category-hierarchy-tree" className={(this.props.visible ? "" : "hidden") + (this.props.displayOnly ? " display-only" : "")}>
        <DragDropContext onDragEnd={this.onDragEnd}>
          <Droppable droppableId="droppable">
            {(provided, snapshot) => (
              <ul
                {...provided.droppableProps}
                className={"draggable-list" + (snapshot.isDraggingOver ? " dragging" : "")}
                ref={provided.innerRef}

              >
                {this.props.displayOnly && <li className="header-row"><span className="inner-container"><span className="category-name">Category</span><span className="description">Description</span></span></li>}
                {items.map((item, index) => (
                  <Category 
                            key={index}
                            item={item}
                            index={index}
                            onClick={this.toggleCategory.bind(this)}
                            open={openedItems.has(item.name)} 
                            openedItems={this.state.openedItems} 
                            hotkeyMap={this.props.hotkeyMap}
                            hotkeyChain={this.props.hotkeyChain}
                            isTopLevelCategory={true}
                            applyTag={this.props.applyTag}
                            draggable={this.props.draggable}
                  />
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    );
  }
}

export default CategoryHierarchy;