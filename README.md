# DOcplexcloud NodeJS Sample

[![Deploy to Bluemix](https://deployment-tracker.mybluemix.net/stats/3133b73c73c7d9b58158b28dbfa4975f/button.svg)](https://bluemix.net/deploy?repository=https://github.com/IBM-Bluemix/docplexcloud-helloworld-nodejs.git)

IBM Decision Optimization on Cloud for Bluemix (DOcplexcloud) allows you to solve optimization problems on the cloud without installing or configuring a solver. We handle the connection so that you can jump into coding faster.

This sample shows how you can build a simple Node.js application that will use [Decision Optimization on Cloud for Bluemix Service](https://console.ng.bluemix.net/catalog/services/decision-optimization/)

It demonstrates how to use the [Node.js Client](https://www.npmjs.com/package/docplexcloud-nodejs-api) to submit a problem to the IBM Decision Optimization on Cloud service, and retrieve the results.

Some buttons have been added to enable interaction with DOcplexcloud:

 - submit the `diet.lp` problem to DOcplexcloud
 - you can consult the solution and the job details
 - download the solution file
 - delete all your existing jobs.
 
 You can also benefit from code samples, to go further.



### Running the app on Bluemix
1. Create a Bluemix Account

    [Sign up](http://www.ibm.com/cloud-computing/bluemix/) for Bluemix, or use an existing account.

2. Download and install the [Cloud-foundry CLI](https://github.com/cloudfoundry/cli) tool

3. Clone the app to your local environment from your terminal using the following command

   ```
   git clone https://github.com/IBM-Bluemix/docplexcloud-helloworld-nodejs.git
   ```

4. cd into this newly created directory

5. Edit the `manifest.yml` file and change the `<application-name>` and `<application-host>` from `DOcplexcloud-app` to something unique.

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

6. Connect to Bluemix in the command line tool and follow the prompts to log in.

	```
	cf api https://api.ng.bluemix.net
	cf login
	```
7. Create the Decision Optimization for IBM Bluemix service.

   ```
   cf create-service docplexcloud ODSTRIAL DOcplexcloud-service
   ```

8. Push the application to Bluemix.

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
