# View and create BIM 360 Issues

![Platforms](https://img.shields.io/badge/platform-Windows|MacOS-lightgray.svg)
![.NET](https://img.shields.io/badge/.NET%20Core-3.1-blue.svg)
[![License](http://img.shields.io/:license-MIT-blue.svg)](http://opensource.org/licenses/MIT)

[![Authentication v2](https://img.shields.io/badge/Authentication-v2-green.svg)](https://aps.autodesk.com/en/docs/oauth/v2/overview/)
[![Data Management API](https://img.shields.io/badge/Data%20Management-v1-green.svg)](https://aps.autodesk.com/en/docs/data/v2/overview/)
[![BIM360 Admin API](https://img.shields.io/badge/BIM360%20Admin%20API-v1-green.svg)](https://aps.autodesk.com/en/docs/bim360/v1/reference/http/admin-v1-projects-projectId-users-GET/)
[![Viewer 7](https://img.shields.io/badge/Viewer-v7-green.svg)](https://aps.autodesk.com/en/docs/viewer/v7/overview/)
[![BIM 360 Issue API](https://img.shields.io/badge/BIM%20360%20Issue%20API%20V2-v2-green.svg)](https://aps.autodesk.com/en/docs/bim360/v1/reference/http/issues-v2-users-me-GET/)

![Intermediate](https://img.shields.io/badge/Level-Intermediate-blue.svg)

# Description

This sample demonstrates how to read and create BIM 360 **Issues** which links with document (also called pushpin issue), by **Issues API** and **Autodesk.BIM360.Extension.PushPin** extension of APS Viewer.  

## Thumbnail

![thumbnail](/thumbnail.png)

## Live version

(TBD)

# Setup

## Prerequisites

1. **BIM 360 Account**: must be Account Admin to add the app integration. [Learn about provisioning](https://forge.autodesk.com/blog/bim-360-docs-provisioning-forge-apps).
2. **APS Account**: Learn how to create a APS Account, activate subscription and create an app at [this blog](https://aps.autodesk.com/blog/bim-360-docs-provisioning-forge-apps). 
3. **Visual Studio**: Either Community 2017+ (Windows) or Code (Windows, MacOS).
4. **.NET Core** basic knowledge with C#
5. **JavaScript** basic knowledge with **jQuery**


## Running locally

Clone this project or download it. It's recommended to install [GitHub desktop](https://desktop.github.com/). To clone it via command line, use the following (**Terminal** on MacOSX/Linux, **Git Shell** on Windows):

    git clone https://github.com/autodesk-forge/aps-bim360-pushpin-issues

**Visual Studio** (Windows):

Right-click on the project, then go to **Debug**. Adjust the settings as shown below. 

![](Bim360PushpinIssues/wwwroot/img/readme/visual_studio_settings.png) 

**Visual Sutdio Code** (Windows, MacOS):

Open the folder, at the bottom-right, select **Yes** and **Restore**. This restores the packages (e.g. Autodesk.Forge) and creates the launch.json file. See *Tips & Tricks* for .NET Core on MacOS.

In [.env](./env) file, input the information below 
```text 
    APS_CLIENT_ID = "your id here",
    APS_CLIENT_SECRET =  "your secret here",
    APS_CALLBACK_URL = "http://localhost:3000/api/auth/callback"
```

Run the app. Open `http://localhost:3000` to view the documents on BIM360. It may be required to **Enable my BIM 360 Account** (see app top-right). 

### Usage

1. Navigate to specific document in the documents tree. Click it. The APS Viewer will load the corresponding document. Two custom buttons are created.
2. Click button with the icon _exclamation-triangle_, it will fetch all issues that are linked with this document. The corresponding issues will be rendered in the viewer. Some properties of the issues will be displayed in the custom panel.
3. Click button with the icon _pencil_, it will ask tne end user to input the _title_ of a new issue. After confirmation, it will ask the user to select an object in the scene (if 2D view, only position). The code will create an new issue based on the parameters of the documents and pushpin. Note: to make it simpler, this sample harded-coded the required parameter (issueSubTypeId) with "Design". 

## Deployment

To deploy this application to Heroku, the **Callback URL** for APS must use your `.herokuapp.com` address. After clicking on the button below, at the Heroku Create New App page, set your Client ID, Secret and Callback URL for APS.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

Watch [this video](https://www.youtube.com/watch?v=Oqa9O20Gj0c) on how deploy samples to Heroku.

# Further Reading

Documentation:

- [BIM 360 API](https://developer.autodesk.com/en/docs/bim360/v1/overview/) and [App Provisioning](https://aps.autodesk.com/blog/bim-360-docs-provisioning-forge-apps)
- [Data Management API](https://developer.autodesk.com/en/docs/data/v2/overview/)
- [Viewer](https://developer.autodesk.com/en/docs/viewer/v6)
- [View BIM 360 Models](https://tutorials.autodesk.io/tutorials/hubs-browser/)
- [Retrieve Issues](https://aps.autodesk.com/en/docs/bim360/v1/tutorials/issuesv2/retrieve-issues-v2/)
- [Create Issues](https://aps.autodesk.com/en/docs/bim360/v1/tutorials/issuesv2/create-issues-v2/)

Blogs:

- [APS Blog](https://aps.autodesk.com/categories/bim-360-api)
- [Field of View](https://fieldofviewblog.wordpress.com/) 

### Tips & Tricks

This sample uses .NET Core and works fine on both Windows and MacOS, see [this tutorial for MacOS](https://github.com/augustogoncalves/dotnetcoreheroku).

### Troubleshooting

1. **Cannot see my BIM 360 projects**: Make sure to provision the APS App Client ID within the BIM 360 Account, [learn more here](https://aps.autodesk.com/en/docs/bim360/v1/tutorials/getting-started/manage-access-to-docs/). This requires the Account Admin permission.

2. **error setting certificate verify locations** error: may happen on Windows, use the following: `git config --global http.sslverify "false"`

## License

This sample is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT). Please see the [LICENSE](LICENSE) file for full details.

## Written by

Augusto Goncalves [@augustomaia](https://twitter.com/augustomaia)

Migrated by Xiaodong Liang[@coldwood](https://twitter.com/coldwood).

[APS Partner Development](http://aps.autodesk.com)
