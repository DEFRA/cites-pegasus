[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=defragovuk_Defra-APHA-CITES&metric=bugs&token=dbe3b4423a37991718cea22912c4d7eb04fc0ffb)](https://sonarcloud.io/summary/new_code?id=defragovuk_Defra-APHA-CITES)

CITES Application Portal

# Environment variables
(Be sure to describe any environment variables here by maintaining a list like this)

| name                                     | description                                            | required | default |            valid                 | notes |
|------------------------------------------|--------------------------------------------------------|----------|---------|----------------------------------|-------|
| NODE_ENV                                 | Node environment                                       |    no    | local   | local, dev, test, snd, pre, prod |       |
| PORT                                     | Port number                                            |    no    | 8080    |                                  |       |
| ADDRESS_LOOKUP_API_CERT_NAME             | Name of certificate to use for address lookup service  |    yes   |         |                                  |       |
| ADDRESS_LOOKUP_BASE_URL                  | URL to use for address lookup API                      |    yes   |         |                                  |       |
| AUTHORITY_URL                            |                                                        |    yes   |         |                                  |       |
| CIDM_ACCOUNT_MANAGEMENT_URL              | CIDM link for managing the user account                |    yes   |         |                                  |       |
| CIDM_API_DISCOVERY_URLCIDM_CALLBACK_URL  | URL to use for communicating with the CIDM API         |    yes   |         |                                  | Must be registered with CIDM |
| CIDM_POST_LOGOUT_REDIRECT_URL            | URL for CIDM to redirect to after the user logs out    |    no    |         |                                  | Must be registered with CIDM |
| DYNAMICS_BASE_URL                        | URL to use for communicating with the Dynamics API     |    yes   |         |                                  |       |
| DYNAMICS_API_PATH                        | URL suffix to use for the Dynamics API                 |    yes   |         |                                  |       |
| KNOWN_AUTHORITY                          | Known authority for communicating with Dynamics        |    yes   |         |                                  |       |
| GOVPAY_CALLBACK_URL                      | URL to send to Govpay for them to redirect back to     |    yes   |         |                                  |       |
| GOVPAY_PAYMENTS_URL                      | URL to use for communicating with the Govpay API       |    yes   |         |                                  |       |
| KEY_VAULT_NAME                           | Name of our Azure Key Vault                            |    yes   |         |                                  |       |
| KEY_VAULT_URI                            | URL to use for communicating with our Azure Key Vault  |    yes   |         |                                  |       |
| REDIS_HOSTNAME                           | Hostname of Azure Redis Cache instance                 |    yes   |         |                                  |       |
| REDIS_PARTITION                          | Partition to use within Azure Redis Cache              |    yes   |         |                                  |       |
| REDIS_PORT                               | Port number for communication with Azure Redis Cache   |    yes   |         |                                  |       |
| SESSION_CACHE_TTL                        | Session timeout in milliseconds                        |    yes   |         |                                  |       |
| ENABLE_SPECIES_WARNING                   | Enable species warning message on scientific name page |    no    | false   |                                  |       |
| ENABLE_DRAFT_SUBMISSION                  | Enable the save and retrieve of draft sumbissions      |    no    | false   |                                  |       |
| ENABLE_FILTER_SUBMITTED_BY             | Enable the filter to allow the user to view submissions from all users | no | false |                          |       |



# Prerequisites

Node v16+

# Running the application

First build the application using:

`$ npm run build`

This will just build the 'govuk-frontend' and 'custom' sass

Now the application is ready to run:

`$ node index.js`

## What is this?

A website to capture CITES permit applications

## Getting started

Clone this repo and run the application as described above

Check the server is running by pointing your browser to `http://localhost:8080` or whatever port you have in .env

## Project structure

Here's the default structure for your project files.

* **bin** (build tasks)
* **client** (client sass code)
* **config** (config and cache settings)
* **server**
  * **content** (This is for the replaceable text content)
  * **plugins**
  * **public**  
    * **static** (Put all static assets in here)
    * **build** (This contains the build output files (js/css etc.))
  * **routes**
  * **services** (Such as dynamics api code)
  * **views**
  * index.js (Exports a function that creates a server)
* **test**
* README.md
* index.js (startup server)

## Config

The configuration file for the server is found at `config/config.js`.
This is where to put any config and all config should be read from the environment.
The final config object should be validated using joi and the application should not start otherwise.

A table of environment variables should be maintained in this README as above.

## Plugins

Plugins live in the `server/plugins` directory.

## Views

The [vison](https://github.com/hapijs/vision) plugin is used for template rendering support.

The template engine used is nunjucks inline with the GDS Design System with support for view caching, layouts, partials and helpers.

## Static files

The [Inert](https://github.com/hapijs/inert) plugin is used for static file and directory handling in hapi.js.
Put all static assets in `server/public/static`.

Any build output should write to `server/public/build`. This path is in the `.gitignore` and is therefore not checked into source control.

## Routes

Incoming requests are handled by the server via routes. 
Each route describes an HTTP endpoint with a path, method, and other properties.

Routes are found in the `server/routes` directory and loaded using the `server/plugins/router.js` plugin.

Hapi supports registering routes individually or in a batch.
Each route file can therefore export a single route object or an array of route objects.

A single route looks like this:

```js
{
  method: 'GET',
  path: '/hello-world',
  options: {
    handler: (request, h) => {
      return 'hello world'
    }
  }
}
```

There are lots of [route options](http://hapijs.com/api#route-options), here's the documentation on [hapi routes](http://hapijs.com/tutorials/routing)

## Tasks

Build tasks are created using simple shell scripts or node.js programs.
The default ones are found in the `bin` directory.

The task runner is simply `npm` using `npm-scripts`.

We chose to use this for simplicity but there's nothing to stop you adding `gulp`, `grunt` or another task runner if you prefer. 

The predefined tasks are:

- `npm run build` (Runs all build sub-tasks)
- `npm run build:css` (Builds the client-side sass)
- `npm run lint` (Runs the lint task using standard.js)
- `npm run unit-test` (Runs the `lab` tests in the `/test` folder)
- `npm test` (Runs the `lint` task then the `unit-tests`)

### Resources

For more information around using `npm-scripts` as a build tool:

- http://substack.net/task_automation_with_npm_run
- http://ponyfoo.com/articles/choose-grunt-gulp-or-npm
- http://blog.keithcirkel.co.uk/why-we-should-stop-using-grunt/
- http://blog.keithcirkel.co.uk/how-to-use-npm-as-a-build-tool/

## Testing

Automated testing is not included in this application yet.
