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

using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Autodesk.Forge;
using Newtonsoft.Json.Linq;
using RestSharp;
using System.Text;
using System.Net;
using System.Collections.Generic;
using System.Web;

namespace Bim360PushpinIssues.Controllers
{
    public class Bim360PushpinIssues : ControllerBase
    {
        //NO SDK with Admin or Issue API yet. Add the native restful endpoints.
        private const string BASE_URL = "https://developer.api.autodesk.com";
        private const string GET_POST_ISSUE = "/issues/v2/containers/{containerId}/issues";
        private const string GET_ISSUE_SUB_TYPES = "/issues/v2/containers/{containerId}/issue-types?include=subtypes";
        private const string GET_PROJECT_USERS = "/bim360/admin/v1/projects/{projectId}/users";
 
        [HttpGet]
        [Route("api/project/{projectId}/container/{containerId}/issues/{itemUrn}/{versionNum}")]
        public async Task<JArray> GetIssuesAsync(string projectId, string containerId, string itemUrn,int versionNum )
        {
            IRestResponse issuesResponse = await GetIssuesAsync(containerId, itemUrn);
            IRestResponse projectUsersResponse = await GetProjectUsers(projectId);
            dynamic issuesOfAllocuments = JObject.Parse(issuesResponse.Content); 

            //get user list of the project, in order to get the first name and last name of the user by Id
            dynamic userJsonRes = JObject.Parse(projectUsersResponse.Content);
            dynamic users = userJsonRes.results;
            foreach (dynamic issue in issuesOfAllocuments.results)
            {
                issue.assignee = "Not yet assigned"; // default value?
                foreach (dynamic user in users)
                {
                    if (user.autodeskId == issue.assignedTo)
                    {
                        issue.assignee = string.Concat(user.firstName, user.lastName);
                    }
                }
            } 
            return issuesOfAllocuments.results;
        }

        [HttpPost]
        [Route("api/container/{containerId}/issues")]
        public async Task<IActionResult> CreateIssuesAsync(string containerId, [FromBody]JObject payload)
        {
            //the valid json data for creating issue is the value of payload.
            JObject data = payload["payload"] as JObject;

            // for this sample, hard-code a sub type: "Design"
            //find id of subtype "Design"
            IRestResponse issueSubTypesResponse = await GetIssueSubTypesAsync(containerId);
            dynamic issueTypes = JObject.Parse(issueSubTypesResponse.Content);
            string subTypeId = string.Empty;
            foreach (dynamic type in issueTypes.results)
            {
                if (type.title == "Design") // ngType we're looking for
                {
                    foreach (dynamic subType in type.subtypes)
                    {
                        if (subType.title == "Design") // ngSubtype we're looking for
                        {
                            subTypeId = subType.id; break; // stop looping subtype...
                        }
                    }
                }
            }
            // double check we got it
            if (string.IsNullOrWhiteSpace(subTypeId)) return BadRequest();
            // and replace on the data
            data["issueSubtypeId"] = subTypeId; 
            // now create new issues
            IRestResponse issueResponse = await PostIssuesAsync(containerId,data);

            return (issueResponse.StatusCode == HttpStatusCode.Created ? (IActionResult)Ok() : (IActionResult)BadRequest(issueResponse.Content));
        }

        public async Task<IRestResponse> GetIssuesAsync(string containerId, string itemUrn)
        {
            Credentials credentials = await Credentials.FromSessionAsync(base.Request.Cookies, Response.Cookies);

            RestClient client = new RestClient(BASE_URL);
            RestRequest request = new RestRequest(GET_POST_ISSUE, RestSharp.Method.GET);
            request.AddParameter("containerId", containerId, ParameterType.UrlSegment);
            request.AddParameter("filter[linkedDocumentUrn]", itemUrn, ParameterType.QueryString);
            request.AddHeader("Authorization", "Bearer " + credentials.TokenInternal);
            return await client.ExecuteAsync(request);
        }

        public async Task<IRestResponse> GetProjectUsers(string projectId)
        {
            Credentials credentials = await Credentials.FromSessionAsync(base.Request.Cookies, Response.Cookies);

            RestClient client = new RestClient(BASE_URL);
            RestRequest request = new RestRequest(GET_PROJECT_USERS, RestSharp.Method.GET);
            request.AddParameter("projectId", projectId.Replace("b.", string.Empty), ParameterType.UrlSegment);
            request.AddParameter("limit", 100, ParameterType.QueryString);
            request.AddHeader("Authorization", "Bearer " + credentials.TokenInternal);
            return await client.ExecuteAsync(request);
        }

        public async Task<IRestResponse> PostIssuesAsync(string containerId, JObject data)
        {
            Credentials credentials = await Credentials.FromSessionAsync(base.Request.Cookies, Response.Cookies);

            RestClient client = new RestClient(BASE_URL);
            RestRequest request = new RestRequest(GET_POST_ISSUE, RestSharp.Method.POST);
            request.AddParameter("containerId", containerId, ParameterType.UrlSegment);
            request.AddHeader("Authorization", "Bearer " + credentials.TokenInternal);
            request.AddHeader("Content-Type", "application/json");
            request.AddParameter("application/json", Newtonsoft.Json.JsonConvert.SerializeObject(data), ParameterType.RequestBody);
            return await client.ExecuteAsync(request);
        }

        public async Task<IRestResponse> GetIssueSubTypesAsync(string containerId)
        {
            Credentials credentials = await Credentials.FromSessionAsync(base.Request.Cookies, Response.Cookies);

            RestClient client = new RestClient(BASE_URL);
            RestRequest request = new RestRequest(GET_ISSUE_SUB_TYPES, RestSharp.Method.GET);
            request.AddParameter("containerId", containerId, ParameterType.UrlSegment);
            request.AddHeader("Authorization", "Bearer " + credentials.TokenInternal);
            return await client.ExecuteAsync(request);
        }


    }
}