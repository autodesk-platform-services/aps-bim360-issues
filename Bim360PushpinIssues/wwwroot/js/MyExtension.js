/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by APS Partner Development
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////


// *******************************************
// My Extension
// *******************************************
function MyExtension(viewer, options) {
  Autodesk.Viewing.Extension.call(this, viewer, options);
  this.viewer = viewer;
  this.panel = null; // create the panel variable
  this.containerId = null;
  this.hubId = null;
  this.issues = null;
  this.pushPinExtension = null;
}

MyExtension.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
MyExtension.prototype.constructor = MyExtension;

MyExtension.prototype.load = async function () {
  if (this.viewer.toolbar) {
    // Toolbar is already available, create the UI
    this.createUI();
  } else {
    // Toolbar hasn't been created yet, wait until we get notification of its creation
    this.onToolbarCreatedBinded = this.onToolbarCreated.bind(this);
    this.viewer.addEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
    var op = {
      hideRfisButton: true,
      hideFieldIssuesButton: true,
    };
    await this.viewer.loadExtension('Autodesk.BIM360.Extension.PushPin', op);
    this.pushPinExtension = this.viewer.getExtension('Autodesk.BIM360.Extension.PushPin');
  }
  return true;
};

MyExtension.prototype.onToolbarCreated = function () {
  this.viewer.removeEventListener(Autodesk.Viewing.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
  this.onToolbarCreatedBinded = null;
  this.createUI();
};

//  button of load issues
MyExtension.prototype.loadIssueButton = function () {
  var _this = this;
  var loadIssuesBtn = new Autodesk.Viewing.UI.Button('loadIssuesBtn');
  loadIssuesBtn.onClick = function (e) {
    // check if the panel is created or not
    if (_this.panel == null) {
      _this.panel = new MyIssuePanel(_this.viewer,
        _this.viewer.container,
        'MyIssuePanel',
        'BIM 360 Issues');
    }
    // show/hide docking panel
    _this.panel.setVisible(!_this.panel.isVisible());
    // if panel is NOT visible, exit the function
    if (!_this.panel.isVisible()) return;
    // ok, it's visible, let's load the issues
    _this.loadIssues();
  };
  loadIssuesBtn.addClass('loadIssuesBtn');
  loadIssuesBtn.setToolTip('Show Issues');
  this.subToolbar.addControl(loadIssuesBtn);
}

//  button of new issues 
MyExtension.prototype.createIssueButton = function () {
  var _this = this;
  var createIssuesBtn = new Autodesk.Viewing.UI.Button('createIssuesBtn');
  createIssuesBtn.onClick = function (e) {
    if (!this.pushPinExtension) {
      _this.createIssue(); // show issues
    }
  };
  createIssuesBtn.addClass('createIssuesBtn');
  createIssuesBtn.setToolTip('Create Issues');
  this.subToolbar.addControl(createIssuesBtn);
}

MyExtension.prototype.createUI = function () {
  // SubToolbar
  this.subToolbar = (this.viewer.toolbar.getControl("MyAppToolbar") ?
    this.viewer.toolbar.getControl("MyAppToolbar") :
    new Autodesk.Viewing.UI.ControlGroup('MyAppToolbar'));
  this.viewer.toolbar.addControl(this.subToolbar);

  this.loadIssueButton();
  this.createIssueButton();

};


//get issue list from APS
MyExtension.prototype.getIssuesList = async function () {
  var _this = this;
  const selNode = getSelectedNodeData();
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `api/project/${selNode.projectId}/container/${selNode.containerId}/issues/${selNode.itemUrn}/${selNode.versionNum}`,
      type: 'GET',
      success: (data) => {
        resolve(data)
      }, error: (error) => {
        alert('Cannot get issue'); 
        reject(error)
      }
    });
  })
}

//send payload data to server, to create issue 
MyExtension.prototype.createIssueImpl = async function (containerId,data) {
  var _this = this;
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `api/container/${containerId}/issues`,
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ payload: data }),
      success: (data) => { 
        resolve(data)
      }, error: (error) => {
        _this.pushPinExtension.pushPinManager.removeItemById('0');
        alert('Cannot create issue');
        reject(error)
      }
    });
  })
}

//load issues to APS Viewer
MyExtension.prototype.loadIssues = async function () {
  var _this = this;
  var allIssues = await this.getIssuesList();
  if (_this.panel) _this.panel.removeAllProperties();

  //filter with specific document of the model （One file item may contain 2D view, 2D sheet, 3D model etc)
  const loadedDocument = _this.viewer.model.getDocumentNode();
  allIssues = allIssues.filter(i =>
    i.linkedDocuments && (i.linkedDocuments[0].details.viewable.guid == loadedDocument.data.guid)
  )
  if (allIssues.length > 0) {
    this.pushPinExtension.removeAllItems();
    this.pushPinExtension.showAll();
    var pushpinDataArray = [];

    allIssues.forEach(function (issue) {
      const dateCreated = moment(issue.createdAt);

      // add the pushpin
      if (issue.linkedDocuments == null || issue.linkedDocuments.length == 0) {
        alert(`No Pushpin Data with this Issue ${issue.id}! Check the source data!`);
        return;
      }
      // show issue on panel
      if (_this.panel) {
        _this.panel.addProperty('Title', issue.title, 'Issue ' + issue.displayId);
        _this.panel.addProperty('CreatedAt Version', 'V ' + issue.linkedDocuments[0].createdAtVersion, 'Issue ' + issue.displayId);
        _this.panel.addProperty('Created At', dateCreated.format('MMMM Do YYYY, h:mm a'), 'Issue ' + issue.displayId);
        _this.panel.addProperty('Assigned to', issue.assignee, 'Issue ' + issue.displayId);
      }

      var pushpinData = issue.linkedDocuments[0]; //currently, linked with one document only.

      pushpinDataArray.push({
        type: 'issues',
        id: issue.id,
        label: issue.title,
        status: issue.status,
        position: pushpinData.details.position,
        objectId: pushpinData.details.objectId,
        viewerState: pushpinData.details.viewerState
      });
    })
    this.pushPinExtension.loadItems(pushpinDataArray);
  }
  else {
    if (_this.panel) _this.panel.addProperty('No issues found', 'Use create issues button');
  }
}

//create one issue
MyExtension.prototype.createIssue = function () {
  var _this = this;
  var issueLabel = prompt("Enter issue title: ");
  if (issueLabel === null) return;

  // prepare to end creation...
  this.pushPinExtension.pushPinManager.addEventListener('pushpin.created', (e) => {

    _this.pushPinExtension.pushPinManager.removeEventListener('pushpin.created', arguments.callee);
    _this.pushPinExtension.endCreateItem();

    var newIssue = e.value.itemData;
    
    if (newIssue === null) return; // safeguard 

    const selNode = getSelectedNodeData();
    const loadedDocument = _this.viewer.model.getDocumentNode();

    var payload = {
      title: newIssue.label,
      status: 'open',
      issueSubtypeId: '', //will hard-coded on server side.
      linkedDocuments: [
        {
          type: 'TwoDVectorPushpin',
          urn: selNode.itemUrn,
          createdAtVersion: 1,
          details: {
            viewable: {
              name:loadedDocument.data.name,
              guid:loadedDocument.data.guid,
              is3D:loadedDocument.data.role=='3d',
              viewableId:loadedDocument.data.viewableID
              },
            position: newIssue.position,
            objectId: newIssue.objectId,
            viewerState: newIssue.viewerState
          }
        }
      ]
    };
    _this.createIssueImpl(selNode.containerId,payload); 
  
  });  

  // start asking for the push location
  _this.pushPinExtension.startCreateItem({ label: issueLabel, status: 'open', type: 'issues' });
}

MyExtension.prototype.unload = function () {
  this.viewer.toolbar.removeControl(this.subToolbar);
  return true;
};

Autodesk.Viewing.theExtensionManager.registerExtension('MyExtension', MyExtension);


// *******************************************
// My Issue Panel
// *******************************************
function MyIssuePanel(viewer, container, id, title, options) {
  this.viewer = viewer;
  Autodesk.Viewing.UI.PropertyPanel.call(this, container, id, title, options);
}
MyIssuePanel.prototype = Object.create(Autodesk.Viewing.UI.PropertyPanel.prototype);
MyIssuePanel.prototype.constructor = MyIssuePanel;


// *******************************************
// Helper functions
// *******************************************
function getSelectedNodeData() {
  const jsTreeInstance = $('#userHubs').jstree(true);
  const node = jsTreeInstance.get_selected(true)[0];

  if (node.type == 'versions') {

    var node_data = {
      projectId: '',
      containerId: '',
      itemUrn: '',
      versionNum: 1
    }

    for (var i = 0; i < node.parents.length; i++) {
      const p_node = jsTreeInstance.get_node(node.parents[i]);
      if (p_node.data && p_node.data.projectId) node_data.projectId = p_node.data.projectId;
      if (p_node.data && p_node.data.containerId) node_data.containerId = p_node.data.containerId;
      if (p_node.data && p_node.data.itemUrn) node_data.itemUrn = p_node.data.itemUrn;
      if (p_node.data && p_node.data.versionNum) node_data.itemUrn = p_node.data.versionNum;
    }

    return node_data;
  } else {
    alert('Please select a version firstly!');
    return;
  }
}
