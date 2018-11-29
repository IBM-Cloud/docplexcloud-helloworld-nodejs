# Decision Optimization for IBM Cloud Getting Started Sample
## Introduction

Decision Optimization for IBM Cloud (DOcplexcloud) allows  to solve optimization problems on the cloud.

This sample shows how you can build a simple Node.js application that use the [Decision Optimization for IBM Cloud](https://cloud.ibm.com/catalog/services/decision-optimization/). It demonstrates how to use the [Node.js Client](https://www.npmjs.com/package/docplexcloud-nodejs-api) to submit a problem to the optimization solver engine (CPLEX)  , get the results and monitor your jobs.

There are two ways to deploy the sample to Bluemix, automatically in one click or by cloning the sample to your local environment

## Automatically deploy the sample
Note that you need to have an IBM Cloud account. 
[Sign up](http://www.ibm.com/cloud-computing/bluemix/) for Bluemix, or use an existing account.

Click the button below:

[![Deploy to IBM Cloud](https://deployment-tracker.mybluemix.net/stats/3133b73c73c7d9b58158b28dbfa4975f/button.svg)](https://bluemix.net/deploy?repository=https://github.com/IBM-Bluemix/docplexcloud-helloworld-nodejs.git)

Then just follow IBM Cloud instructions during & after deployment

## Deploy the sample step by step
Note that you need to have a IBM Cloud account. 
[Sign up](http://www.ibm.com/cloud-computing/) for IBM Cloud, or use an existing account.


### Running the app on Bluemix

1. Download and install the [Cloud-foundry CLI](https://github.com/cloudfoundry/cli) tool

2. Clone the app to your local environment from your terminal using the following command

   ```
   git clone https://github.com/IBM-Cloud/docplexcloud-helloworld-nodejs.git
   ```

3. cd into this newly created directory

4. Edit the `manifest.yml` file and change the `<application-name>` and `<application-host>` from `DOcplexcloud-app` to something unique.

	```
    applications:
    - name: DOcplexcloud-app
      host: DOcplexcloud-app
      memory: 256M
      - services:
        - DOcplexcloud-service
	```

  The host you use will determinate your application url initially, e.g. `<application-host>.mybluemix.net`.  
  **Note:** If you use a name other than `DOcplexcloud-service` for the service name, you need to update this in the `app.js` file.

5. Connect to Bluemix in the command line tool and follow the prompts to log in.

	```
	cf api https://api.ng.bluemix.net
	cf login
	```
6. Create the Decision Optimization for IBM Cloud service.

   ```
   cf create-service docplexcloud ODSTRIAL DOcplexcloud-service
   ```

7. Push the application to Bluemix.

   ```
   cf push
   ```

### Run the app locally

1. To work locally on your machine, copy the file ```vcap-local.template.json``` to ```vcap-local.json```:

   ```
   cp vcap-local.template.json vcap-local.json
   ```

2. Replace the credentials with values from your service

   ```
   {
     "docplexcloud" : [ {
       "name" : "DOcplexcloud-service",
       "label" : "docplexcloud",
       "plan" : "ODSTRIAL",
       "credentials" : {
         "url" : "YOUR_BASE_URL",
         "client_id" : "XXX",
         "subscriptionId" : "YYY"
       }
     } ]
   }
   ```
3. Install the server dependencies

   ```
   npm install
   ```
  
4. Start the server
 
   ```
   node app.js
   ```

  The server starts locally, for instance on

  	 http://localhost:6002


## License

This sample is delivered under the Apache License Version 2.0. See [License.txt](License.txt).

## Privacy Notice

The DOcplexcloud NodeJS Sample web application includes code to track deployments to Bluemix and other Cloud Foundry platforms. The following information is sent to a Deployment Tracker service on each deployment:

    Application Name (application_name)
    Space ID (space_id)
    Application Version (application_version)
    Application URIs (application_uris)

This data is collected from the VCAP_APPLICATION environment variable in IBM Bluemix and other Cloud Foundry platforms. This data is used by IBM to track metrics around deployments of sample applications to IBM Bluemix. Only deployments of sample applications that include code to ping the Deployment Tracker service will be tracked.


## Disabling Deployment Tracking

Deployment tracking can be disabled by removing require("cf-deployment-tracker-client").track(); from the beginning of the app.js file.
