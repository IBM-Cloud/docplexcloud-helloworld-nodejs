 // Licensed under the Apache License. See footer for details.
 /*eslint-env node*/

//For docloud node client
var docloud = require("docplexcloud-nodejs-api");
var fs = require('fs');
var client;
//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

//---Deployment Tracker---------------------------------------------------------
require("cf-deployment-tracker-client").track();

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();
var docplexcloudservice;
var docplexcloudURL;
var docplexcloudClientId;

//get all services in vcap
//if we're in CF or Bluemix, don't need to specify services manually
if (process.env.VCAP_SERVICES) {
    appEnv = cfenv.getAppEnv();
// otherwise, specify the service values when creating the appEnv
} else {
    try {
        appEnv = cfenv.getAppEnv({
            vcap: {
                services: require('./vcap-local.json')
            }
        });
    } catch (e) {
        console.error(e);
    }
}

// initialize the client SDK
var credentials = appEnv.getServiceCreds("DOcplexcloud-service");
client = docloud({
    url: credentials.url,
    clientId: credentials.client_id
});

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function () {
    // print a message when the server starts listening
    console.log("server starting on " + appEnv.url);
});

/**
 * Launches a solve for the specified data files.
 * <br>The id of the job created for the solve process is provided with the id field of the JSon object
 * returned with the Http response. This id can later be used by the cliend for requesting info for this job
 * with the './job/:jobid' entry point or delete the job with the '/delete/:jobid' entry point.
 * @param files array of filenames relative to the /resources directory.
 * @param req the Http request object.
 * @param res the Http response object.
 */
function solve(files, req, res) {
  // Response will be returning JSon data.
  res.setHeader('Content-Type', 'application/json');
  var attachments = [];
  files.map(function (file) {
      attachments.push({
          name: file,
          stream: fs.createReadStream('resources/' + file)
      });
  });
  client.execute({
        logstream: process.stdout,
        parameters: {"oaas.TIME_LIMIT": 3 * 60 * 1000},
        attachments: attachments
    })
    .on('created', function (jobid) {
        res.writeHead("200");
        res.write(JSON.stringify({ id: jobid }));
        res.end();
    })
    .on('processed', function (jobid) {
        console.log(jobid + " processed");
        client.downloadAttachment(jobid, 'solution.json', fs.createWriteStream('resources/solution.json'))
          .then(function () {
              return client.downloadLog(jobid, fs.createWriteStream('resources/solution.log'))
          });
    })
    .on('interrupted', function (jobid) {
        console.log("job was interrupted :"+jobid);
    })
    .on('failed', function (jobid) {
        console.log("job has failed :"+jobid);
    })
    .on('error', function (error) {
        console.log(error);
        res.status(500).send({
            error: true,
            message: error.message
        });
    });
  console.log('works');
}



/**
 * Entry point for solving the Warehouse problem, sending two file attachments.
 */
app.post('/solveWarehouse', function (req, res) {
 solve(['warehouse_cloud.mod', 'warehouse_cloud.dat'], req, res);
});

/**
 * Entry point for getting info for the job with the specified jobid.
 * Request triggered every half a second after launching a solve to get updates on the solve process.
 * See function waitJobCompletion in client.js.
 */
app.get('/job/:jobid', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  client.getJob(req.params.jobid).then(function (job) {
      res.writeHead(200);
      res.write(JSON.stringify(job));
      res.end();
  }, function (err) {
      res.send("500",err);
  });
});

/**
 * Entry point for deleting all jobs.
 * Request triggered when clicking on the 'Delete all the jobs' button.
 */
app.delete('/deleteAll', function (req, res) {
  res.setHeader('Content-Type', 'text/html');
  client.deleteJobs()
   .then(function (results) {
     console.log("deleted");
     res.send("200");
     res.end();

   }, function (err) {
     res.send("500", err);
     res.end();
   });
});

//
//
// Following entry points are not invoked from the web client sample but illustrate how
// other job management features could be implemented.
//
//

/**
 * Entry point for solving the Diet problem.
 * Request triggered when clicking on the 'Solve a problem' button.
 */
app.post('/solveDiet', function (req, res) {
  solve(['diet.lp'], req, res);
});

/**
 * Entry point for solving the Steelmill problem, sending two file attachments
 * instead of one as for the Diet problem.
 */
app.post('/solveSteelmill', function (req, res) {
 solve(['steelmill.mod', 'steelmill.dat'], req, res);
});


/**
 * Entry point for listing current jobs.
 */
app.get('/jobList', function (req, res) {
  var jobList = {};
  //the job list from docplexcloud client api
  var jobs = client.listJobs();
  //process the promise output, to get the job ids
  jobs.then(function (results) {
      if (results.length === 0) {
          res.write('You currently have no jobs');
          res.end();
      }
      else {
          for (job = 0; job < results.length; job++) {
              console.log('job list : ' + results[job]._id);
              jobList[job] = results[job]._id;
          }
          //format the output response to html
          res.writeHead(200, {
              'Content-Type': 'application/json'
              , 'Transfer-Encoding': 'chunked'
          });
          res.write(JSON.stringify(jobList));
          res.end();
          console.log("joblist : sent");
      }
      //in case the response fails
  }, function (err) {
      console.log('job list ko' + err);
      res.setHeader('Content-Type', 'application/json');
      res.write("No Jobs to display");
      res.end();
  });
});

/**
 * Entry point for deleting a job with the specified jobid.
 * The job id is returned with the result of solve requests '/solveDiet' or '/solveSteelmill'.
 */
app.delete('/delete/:jobid', function (req, res) {
   res.setHeader('Content-Type', 'text/html');
   client.deleteJob(req.params.jobid)
     .then(function (results) {
         console.log("deleted");
         res.send("200");
         res.end();

     }, function (err) {
       res.send("500",err);
       res.end();
   });
 });

/**
 * Downloads a job attachment.
 * This function is invoked from the entry points<ul>
 *   <li>'/download/:jobid/:attid'</li>
 *   <li>'/downloadSolution/:jobid'</li>
 *   <li>'/getSolution/:jobid'</li>
 * </ul>
 * @param jobid the id of the job as returned with the solve entry points.
 * @param attid the id of the job attachment to download. This id can be retrieved from a call
 * to the '/job/:jobid' entry point, which returns job info, including an array of attachment objects with their ids.
 * @param req the Http request object.
 * @param res the Http response object.
 * @param asAFile if true, the file is retured as a file attachment. Otherwise, the content of the file
 * is given with the response body.
 */
function downloadAttachment(jobid, attid, req, res, asAFile) {
  var mimetype = attid.includes('.json') && 'application/json' || 'text/plain';
  res.setHeader('Content-type', mimetype);
  if (asAFile) {
      res.setHeader('Content-disposition', 'attachment; filename=' + attid);
  }
  client.downloadAttachment(jobid, attid, res).then(function () {
 }, function (err) {
      res.send("500",err);
      res.end();
  });
}

/**
 * Entry point for downloading the attachment with the attid id for the job with the jobid id.
 * See documentation of the downloadAttachment function for more details on the id attributes.
 */
app.get('/download/:jobid/:attid', function(req, res){
  downloadAttachment(req.params.jobid, req.params.attid, req, res, true);
});

/**
 * Entry point for downloading the solution attachment as a file for the job with the jobid id.
 * See documentation of the downloadAttachment function for more details on the job id.
 */
app.get('/downloadSolution/:jobid', function(req, res){
     downloadAttachment(req.params.jobid, 'solution.json', req, res, true);
});

/**
 * Entry point for downloading the solution attachment for the job with the jobid id.
 * The solution file content is provided with the body of the Http response.
 * See documentation of the downloadAttachment function for more details on the job id.
 */
app.get('/getSolution/:jobid', function(req, res){
   res.setHeader('Content-type', 'application/json');
   downloadAttachment(req.params.jobid, 'solution.json', req, res);
});

/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
