# Status Embark plugin for MythX
![Running MythX analyses in Status Embark](https://raw.githubusercontent.com/embarklabs/embark-mythx/4808bfe3a07ab871670da4859594080ec7276aba/screenshot.png)

[![GitHub license](https://img.shields.io/github/license/flex-dapps/embark-mythx.svg)](https://github.com/embarklabs/embark-mythx/blob/master/LICENSE)
![npm](https://img.shields.io/npm/v/embark-mythx.svg)

This plugin brings MythX to Status Embark. Simply call verify from the Embark console and embark-mythx sends your contracts off for analysis. It is inspired by [sabre](https://github.com/b-mueller/sabre) and uses its source mapping and reporting functions.

This project was bootstrapped with [TSDX](https://github.com/jaredpalmer/tsdx).

## QuickStart

1. Create a `.env` file in the root of your project and provide your MythX API Key. Free MythX accounts can be created at https://dashboard.mythx.io/#/registration. Once an account is created, generate an API key at https://dashboard.mythx.io/#/console/tools.

```json
MYTHX_USERNAME="<mythx-username>"
MYTHX_PASSWORD="<password>"
MYTHX_API_KEY="<mythx-api-key>"
```

> **NOTE:** `MYTHX_ETH_ADDRESS` has been deprecated in favour of `MYTHX_USERNAME` and will be removed in future versions. As of version 2.0, `MYTHX_API_KEY` is also required. Please update your .env file or your environment variables accordingly.

`MYTHX_USERNAME` may be either of:
* MythX User ID (assigned by MythX API to any registered user);
* Ethereum address, if user account is associated with an address;
* A verified email address, if the user account is associated with an email address, and that address has been verified by visiting the verification link in the verification email sent by the MythX API each time when user email is set or modified in the MythX settings.

For more information, please see the [MythX API Login documentation](https://api.mythx.io/v1/openapi#operation/login).

2. Run `verify [options] [contracts]` in the Embark console. When the call returns, it will look something like this:

```bash
Embark (development) > verify
Authenticating MythX user...
Running MythX analysis...
Analysis job submitted: https://dashboard.mythx.io/#/console/analyses/9a294be9-8656-416a-afbc-06cb299f5319
Analyzing Bank in quick mode...
Analysis job submitted: https://dashboard.mythx.io/#/console/analyses/0741a098-6b81-43dc-af06-0416eda2a076
Analyzing Hack in quick mode...
Retrieving Bank analysis results...
Retrieving Hack analysis results...
Rendering Bank analysis report...

Bank.sol
  18:12  error    persistent state read after call               https://swcregistry.io/docs/SWC-107
  14:28  warning  A call to a user-supplied address is executed  https://swcregistry.io/docs/SWC-107
   1:0   warning  A floating pragma is set                       https://swcregistry.io/docs/SWC-103

✖ 3 problems (1 error, 2 warnings)

Rendering Hack analysis report...

Hack.sol
  1:0  warning  A floating pragma is set  https://swcregistry.io/SWC-registry/docs/SWC-103

✖ 1 problem (0 errors, 1 warning)

Done!
```
## Installation

0. Install this plugin from the root of your Embark project:

```bash
$ npm i embark-mythx
# or
$ npm i flex-dapps/embark-mythx
```

1. Add `embark-mythx` to the `plugins` section of your `embark.json` file. To have the plugin permanently ignore one or multiple contracts, add them to the configuration:

```json
"plugins": {
  "embark-mythx": {
    "ignore": ["Ownable", "Migrations"]
  }
}
``` 

## Usage
The following usage guide can also be obtained by running `verify help` in the Embark console.

```bash
Available Commands

  verify <options> [contracts]    Runs MythX verification. If array of contracts are specified, only those contracts will be analysed. 
  verify report [--format] uuid   Get the report of a completed analysis.                                                              
  verify status uuid              Get the status of an already submitted analysis.                                                     
  verify list                     Displays a list of the last 20 submitted analyses in a table.                                        
  verify help                     Display this usage guide.                                                                            

Examples

  verify --mode full SimpleStorage ERC20                                Runs a full MythX verification for the SimpleStorage and ERC20 contracts only. 
  verify status 0d60d6b3-e226-4192-b9c6-66b45eca3746                    Gets the status of the MythX analysis with the specified uuid.                 
  verify report --format stylish 0d60d6b3-e226-4192-b9c6-66b45eca3746   Gets the status of the MythX analysis with the specified uuid.                 

Verify options

  -m, --mode string        Analysis mode. Options: quick, standard, deep (default: quick).               
  -o, --format string      Output format. Options: text, stylish, compact, table, html, json (default:   
                           stylish).                                                                     
  -c, --no-cache-lookup    Deactivate MythX cache lookups (default: false).                              
  -d, --debug              Print MythX API request and response.                                         
  -l, --limit number       Maximum number of concurrent analyses (default: 10).                          
  -t, --timeout number         Timeout in secs to wait for analysis to finish (default: smart default based  
                           on mode).   
```

### Example Usage

```bash
# Quick analysis on all contracts in project
$ verify

# 'ERC20' and 'Ownable' full analysis
$ verify --mode full ERC20 Ownable

# Check status of previous or ongoing analysis
$ verify status ef5bb083-c57a-41b0-97c1-c14a54617812

# Get list of 20 previous analyses
$ verify list
```

## `embark-mythx` Development

Contributions are very welcome! If you'd like to contribute, the following commands will help you get up and running. The library was built using [TSDX](https://github.com/jaredpalmer/tsdx), so these commands are specific to TSDX.

### `npm run start` or `yarn start`

Runs the project in development/watch mode. `embark-mythx` will be rebuilt upon changes. TSDX has a special logger for you convenience. Error messages are pretty printed and formatted for compatibility VS Code's Problems tab.

<img src="https://user-images.githubusercontent.com/4060187/52168303-574d3a00-26f6-11e9-9f3b-71dbec9ebfcb.gif" width="600" />

Your library will be rebuilt if you make edits.

### `npm run build` or `yarn build`

Bundles the package to the `dist` folder.
The package is optimized and bundled with Rollup into multiple formats (CommonJS, UMD, and ES Module).

<img src="https://user-images.githubusercontent.com/4060187/52168322-a98e5b00-26f6-11e9-8cf6-222d716b75ef.gif" width="600" />

### `npm test` or `yarn test`

Runs the test watcher (Jest) in an interactive mode.
By default, runs tests related to files changed since the last commit.
