import React from 'react';
import {Component} from 'react';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import styled from 'styled-components';
import _ from 'underscore';

const numEntityColours = 12;

class NewCategoryButton extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <li className="new-category">
        <span className="inner-container">
          <span className={"category-name" + (this.props.disabled ? " disabled" : "")} onClick={this.props.newItem} ><i className="fa fa-plus"></i>New Category</span>
        </span>
      </li>
    )
  }
}

// A single category in the category hierarchy tree.
class Category extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isHovered: false,
      name: '',
    }
    this.nameInputRef = React.createRef();

    this.changeNameTimeoutFn = null;
    this.nameCanUpdateTimeoutFn = null;
    this.nameCanUpdate = true; // Whether the name can be updated via props
  }

  componentDidMount() {
    if(this.props.item.name.length === 0) {
      this.nameInputRef.current.focus();
    }
    this.setState({
      name: this.props.item.name.slice(),
    })
  }

  componentDidUpdate(prevProps, prevState) {
    if((prevProps.item.name !== this.state.name) && (prevState.name === this.state.name) && this.nameCanUpdate) {
      this.setState({
        name: this.props.item.name.slice(),
      })
    }
  }

  componentWillUnmount() {
    if(this.changeNameTimeoutFn) window.clearTimeout(this.changeNameTimeoutFn);
    if(this.nameCanUpdateTimeoutFn) window.clearTimeout(this.nameCanUpdateTimeoutFn);  
  }

  setHovered(hovered) {
    this.setState({
      isHovered: hovered
    })
  }


  // The parent component will only update 1 second after the user stops typing.
  itemNameChange(e, path) {
    var name = e.target.value;

    function nameCanUpdate() {
      this.nameCanUpdate = true;
    }

    //console.log(e, path);
    this.setState({
      name: name,
    }, () => {
      if(this.changeNameTimeoutFn) window.clearTimeout(this.changeNameTimeoutFn);
      this.changeNameTimeoutFn = window.setTimeout( this.props.itemNameChange, 1000, name, path);

      this.nameCanUpdate = false;
      if(this.nameCanUpdateTimeoutFn) window.clearTimeout(this.nameCanUpdateTimeoutFn);      
      this.nameCanUpdateTimeoutFn = window.setTimeout( nameCanUpdate.bind(this), 1000);

      this.props.userIsModifying();

    });
    //this.props.itemNameChange(e, path)
  }
  render() {
    var item = this.props.item;
    var index = this.props.index;
    var children = this.props.item.children;
    var colorId = item.colorId;
    var modifiable = this.props.modifiable;

    var path = this.props.path; 

    if(this.props.colorByIndex) {
      colorId = index;
    }

    // If this component has any children, render each of them.
    if(children) {
      var childItems = (
        <ul className={this.props.open ? "" : "hidden"}>
          { children.map((item, index) => (
            <Category key={index}
                      item={item}
                      open={this.props.openedItems.has(item.full_name)}
                      isTopLevelCategory={false}
                      path={this.props.path.concat([index])}

                      openedItems={this.props.openedItems}
                      onClick={this.props.onClick}
                      hotkeyMap={this.props.hotkeyMap}
                      hotkeyChain={this.props.hotkeyChain}                      
                      applyTag={this.props.applyTag}
                      colorByIndex={this.props.colorByIndex}
                      modifiable={this.props.modifiable}
                      itemNameChange={this.props.itemNameChange}
                      itemDescChange={this.props.itemDescChange}
                      deleteItem={this.props.deleteItem}
                      newItem={this.props.newItem}         
                      userIsModifying={this.props.userIsModifying}             
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

        <span className="left">
        
         {(children || modifiable) && <span className={"open-button" + (children ? "" : " no-children-yet") + (item.name.length > 0 ? "" : " hidden")} onClick={() => this.props.onClick(item.full_name)}><i className={"fa fa-chevron-" + (this.props.open ? "up" : "down")}></i></span>}

        <span className={"category-name" + (hasHotkey ? " has-hotkey" :"") + (modifiable ? " modifiable" :"") + (this.props.hotkeyChain === hotkeyStr ? " hotkey-active" : "")}
              data-hotkey-id={hotkeyStr} onClick={this.props.applyTag ? () => this.props.applyTag(this.props.item.full_name) : null}>
            { modifiable ? <input required onKeyDown={(e)=> e.keyCode == 13 ? e.preventDefault(): ''} className={this.state.name.length === 0 ? "empty" : (this.props.errorEntityNames && this.props.errorEntityNames.has(item.full_name) ? " error" : "")}
                placeholder="(no name)" ref={this.nameInputRef} maxLength={50}
                value={this.state.name} onChange={(e) => this.itemNameChange(e, path)} /> : item.name}
        </span>
        
        </span>
        <span className="right">
        { <span className={"description" + (modifiable ? " modifiable" : "")}>
          {modifiable ? <input maxLength={100} onKeyDown={(e)=> e.keyCode == 13 ? e.preventDefault(): ''} value={item.description || ""} onChange={(e) => this.props.itemDescChange(e, path)} placeholder="(no description)"/> : (item.description || "") }
        </span>}
        </span>
        { modifiable && <span className="delete-button-container"><span className="delete-button" onClick={() => {this.setHovered(false); this.props.deleteItem(path)}} onMouseEnter={() => this.setHovered(true)} onMouseLeave={() => this.setHovered(false)}><i className="fa fa-trash"></i></span></span>}
      </span>      
    )


    // This component will render differently depending on whether it is a top-level category or not.
    // Top level categories have the drag handle, which requires a different configuration on the wrapper and li.
    if(this.props.isTopLevelCategory) {


      if(this.props.draggable) {
        return (
          <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
            {(provided, snapshot) => (
              <li  ref={provided.innerRef} {...provided.draggableProps} className={"draggable " + (snapshot.isDragging ? "dragging": "not-dragging") + " color-" + ((parseInt(colorId) % numEntityColours) + 1) + (this.state.isHovered ? " delete-hover" : "")}>
                <div {...provided.dragHandleProps} className="drag-handle-container"><span className="drag-handle"></span></div>
                
                { content }
                { childItems }


                { this.props.open && this.props.modifiable && <ul><NewCategoryButton newItem={() => this.props.newItem(path)}/></ul>}
                
              </li>              
            )}
          </Draggable>
        )
      } else {
        return (
          <li className={" color-" + ((parseInt(colorId) % numEntityColours) + 1) + (this.state.isHovered ? " delete-hover" : "")}>
            { content }
            { childItems }  
            { this.props.open && this.props.modifiable && <ul><NewCategoryButton newItem={() => this.props.newItem(path)}/></ul>}              
          </li>
        )
      }


    } else {
      return (
        <li className={(this.state.isHovered ? " delete-hover" : "")}>
          { content }
          { childItems }
          { this.props.open && this.props.modifiable && <ul><NewCategoryButton newItem={() => this.props.newItem(path)}/></ul>}
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

      orderedByCookie: false, // Save whether the order has been loaded from cookie (only gets set once)
    }
    this.onDragEnd = this.onDragEnd.bind(this);
  }

  // When this component's items changes (should be when a new docGroup has been requested), setup a new itemOrder state.
  // (which defaults to ascending order e.g. 0, 1, 2, 3, 4 ...)
  componentDidUpdate(prevProps, prevState) {
    var itemOrder = setupItemOrder(this.props.items);

  

    if(!_.isEqual(prevProps.items, this.props.items)) {

      var orderedItems = this.props.items;
      var orderedByCookie = this.state.orderedByCookie;

      if(this.props.itemOrder && !orderedByCookie) {
        if(this.props.itemOrder) itemOrder = this.props.itemOrder;
        orderedItems = getOrderedItems(this.props.items, itemOrder);
        orderedByCookie = true;
      }

      this.setState({
        orderedByCookie: orderedByCookie,
        openedItems: new Set(),
        orderedItems: orderedItems,
        itemOrder: itemOrder,
      });      
    }
  }

  componentWillMount() {
    var itemOrder = setupItemOrder(this.props.items);
    //console.log(this.props.itemOrder,' <XZXX')
    

    //var orderedItems = this.props.items;

    //if(this.props.itemOrder) {
    //  itemOrder = this.props.itemOrder;
    //  orderedItems = getOrderedItems(this.props.items, itemOrder);
    //}
    //console.log(orderedItems);

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

    this.props.initHotkeyMap(orderedItems, () => {
      this.setState({
        itemOrder: itemOrder,
        orderedItems: orderedItems,
      }, () => {
        if(this.props.saveDragSettings) this.props.saveDragSettings(itemOrder);

      });
    });
  }

  
  render() {

    var items       = this.state.orderedItems;
    var openedItems = this.state.openedItems;



    return (
      <div id="category-hierarchy-tree" className={(this.props.visible ? "" : "hidden") + (this.props.displayOnly ? " display-only" : "") + (this.props.tableForm ? " table-form" : "")}>
        <DragDropContext onDragEnd={this.onDragEnd}>
          <Droppable droppableId="droppable">
            {(provided, snapshot) => (
              <ul
                {...provided.droppableProps}
                className={"draggable-list" + (snapshot.isDraggingOver ? " dragging" : "")}
                ref={provided.innerRef}

              >
                {this.props.displayOnly && <li className="header-row"><span className="inner-container"><span className="category-name">Entity Class</span><span className="description">Description</span></span></li>}
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
                            itemNameChange={this.props.itemNameChange}
                            path={[index]}
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

class ModifiableCategoryHierarchy extends Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [],
      openedItems: new Set(),   
      errorEntityNames: new Set(),
      userIsModifying: false, // Whether the user is currently entering a name/description
    }
    this.userIsModifyingFn = null;
  }

  componentDidMount() {
    this.setState({
      items: this.props.items,
    })
  }
  componentDidUpdate(prevProps, prevState) {


    if(!_.isEqual(this.props.items, this.state.items) && _.isEqual(prevState.items, this.state.items)) {
     this.setState({
      items: this.props.items,
      openedItems: new Set(),
      errorEntityNames: this.props.errorEntityNames,
     });      
    } 

    if(this.props.errorEntityNames !== this.state.errorEntityNames) {
      this.setState({
        errorEntityNames: this.props.errorEntityNames,
      })
    }



    // if(!_.isEqual(this.props.items, this.state.items) && !_.isEqual(prevState.items, this.state.items)) {
    //   //this.props.updateFormPageData(this.state.data);
    //   this.props.updateHierarchy(this.state.items);
    // } 
  }


  // componentDidUpdate(prevProps, prevState) {
    
  //   if(!_.isEqual(prevState.items, this.state.items) && this.state.items.length > 0) {      
  //     this.props.updateHierarchy(this.state.items);
  //   }
  //   //if(!_.isEqual(prevProps.items, this.props.items) && !_.isEqual(prevProps.preset, this.props.preset)) {
  //   if(!_.isEqual(prevProps.items, this.props.items) && _.isEqual(prevState.items, this.state.items)) {
  //     this.setState({
  //       openedItems: new Set(),
  //       items: this.props.items,
  //     });
  //   }
  // }

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
  async onDragEnd(result) {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    var before = this.state.items;
    const items = reorder(
      this.state.items,
      result.source.index,
      result.destination.index
    );

    //this.props.updateHierarchy(items);
    await this.setState({
      items: items,
    });
    this.props.updateHierarchy(this.state.items)
    //if(this.props.saveDragSettings) this.props.saveDragSettings()
  }



  // Create a new item at the specified path.
  newItem(path) {

    var items = this.state.items;

    if(path.length > 0) {
      var currentItems = items;
      for(var i = 0; i < path.length - 1; i++) {
        var index = path[i];
        currentItems = currentItems[index].children;
      }

      var parentItem = currentItems[path[path.length - 1]];

      var children = parentItem.children;
      if(!children) {
        parentItem.children = new Array();
      }
      var newItem = {
        name: "",
        description: "",
        colorId: parentItem.colorId,
        full_name: parentItem.full_name + "/",
      }
      parentItem.children.push(newItem)
    }
    else {
      var newItem = {
        name: "",
        description: "",
        colorId: (this.state.items.length + 1),
        full_name: "",
        id: this.state.items.length + 1,
      }
      items.push(newItem);
    }



    
    
    this.setState({
      items: items,
    }, () => {
      this.props.markModified();
      console.log('created new item', this.state.items)
      //this.props.updateHierarchy(this.state.items);
    });
  }

  

  userIsModifying() {

    function userStoppedModifying() {
      this.setState({
        userIsModifying: false,
      }, () => {
        this.props.userIsModifying(false)
      })
    }

    //this.props.markModified();

    if(this.userIsModifyingFn) window.clearTimeout(this.userIsModifyingFn);
    this.userIsModifyingFn = window.setTimeout(userStoppedModifying.bind(this), 1000);

    this.setState({
      userIsModifying: true,
    }, () => {
      this.props.userIsModifying(true);
    })
  }

  // Change the name of an item.
  // This is possible via the path, which is the path of indexes of the item name to be changed e.g. 
  // [0, 1] means the first item in the tree, and then the second item inside that one.
  itemNameChange(name, path) {
    var t0 = performance.now()

    var newName = name;

    var items = this.state.items;
    var currentItems = items;
    for(var i = 0; i < path.length - 1; i++) {
      var index = path[i];
      currentItems = currentItems[index].children;
    }
    
    // Update the item name
    var item = currentItems[path[path.length - 1]];

    item.name = newName;

    // If this item is open, remove it from the opened items set and add the updated name later.
    var open = false;
    var openedItems = this.state.openedItems;
    if(this.state.openedItems.has(item.full_name)) {
      open = true;
      openedItems.delete(item.full_name);      
    }
    
    // Update the full name as well
    var full_name_s = item.full_name.split('/');
    full_name_s[full_name_s.length - 1] = newName;
    item.full_name = full_name_s.join('/');

    if(open) openedItems.add(item.full_name);
    


    this.setState({
      items: items,
      openedItems: openedItems,
    }, () => {
      var t1 = performance.now()
      console.log(t1-t0)
      this.props.markModified();

      //his.props.updateHierarchy(this.state.items);
    });
  }

  // Change the item description of the corresponding item, same as above.
  itemDescChange(e, path) {
    var newDesc = e.target.value;

    var items = this.state.items;
    var currentItems = items;
    for(var i = 0; i < path.length - 1; i++) {
      var index = path[i];
      currentItems = currentItems[index].children;
    }
    
    // Update the item name
    var item = currentItems[path[path.length - 1]];    
    item.description = newDesc;
    this.setState({
      items: items,
    }, () => {
      this.props.markModified();
      //this.props.updateHierarchy(this.state.items);
    })

  }

  // Delete the item at the specified path.
  async deleteItem(path) {

    var items = this.state.items;
    var currentItems = items;
    if(path.length > 1) {
      for(var i = 0; i < path.length - 1; i++) {
        var index = path[i];
        var deleteRef = currentItems[index];
        currentItems = currentItems[index].children;

      }      
    }


    // Remove the item from openedItems
    var openedItems = this.state.openedItems;    
    var item = currentItems[path[path.length - 1]];
    openedItems.delete(item.full_name);

    currentItems.splice(path[path.length - 1], 1);
    if(currentItems.length === 0 && path.length > 1) { delete deleteRef.children; }

    await this.setState({
      items: items,
      openedItems: openedItems,
    })
    this.props.markModified();
    //this.props.updateHierarchy(this.state.items);
  }


  render() {
    var items       = this.state.items;
    var openedItems = this.state.openedItems;

    return (
      <div id="category-hierarchy-tree" className="table-form display-only" >
        <ul>
          <li className="header-row"><span className="inner-container"><span className="left"><span className="category-name">Entity Class</span></span><span className="right"><span className="description">Description</span></span><span className="delete-button-container"><span className="delete-button"></span></span></span></li>
        </ul>

        <DragDropContext onDragEnd={this.onDragEnd.bind(this)}>
          <Droppable droppableId="droppable">
            {(provided, snapshot) => (

              <ul className={"draggable-list reversed-stripes " + (this.props.limitHeight ? "limit-height" : "") + (snapshot.isDraggingOver ? " dragging" : "") + (this.state.userIsModifying ? " drag-disabled": "")}
                {...provided.droppableProps}
                ref={provided.innerRef}
              >


                {items.map((item, index) => (
                  <Category 
                    key={index}
                    item={item}
                    index={index}
                    onClick={this.toggleCategory.bind(this)}
                    open={openedItems.has(item.name)} 
                    openedItems={this.state.openedItems} 
                    isTopLevelCategory={true}
                    draggable={true}
                    colorByIndex={true}
                    modifiable={true}
                    itemNameChange={this.itemNameChange.bind(this)}
                    itemDescChange={this.itemDescChange.bind(this)}
                    deleteItem={this.deleteItem.bind(this)}
                    newItem={this.newItem.bind(this)}
                    errorEntityNames={this.state.errorEntityNames}
                    userIsModifying={this.userIsModifying.bind(this)}

                    path={[index]}
                  />
                ))}

                {provided.placeholder}
                
                <NewCategoryButton newItem={() => this.newItem([])}/>
                
            </ul>
          )}
        </Droppable>
        </DragDropContext>

     


      </div>
    )
  }
}

export default CategoryHierarchy;
export { ModifiableCategoryHierarchy };