# Change log
# [2.0.0](https://github.com/embarklabs/embark-mythx/compare/v2.0.0...v1.0.3) (2020-04-02)


### Bug Fixes

* **issues:** Fixed issue list not matching the list of issues in the MythX dashboard.
* **sources:** Fixed an issue where we no longer need to send all compiled contracts (that may be mutually exclusive) to each MythX analysis.

### Features

* **libs:** Now using [`mythxjs`](https://github.com/ConsenSys/mythxjs) instead of `armlet` (deprecated) to communicate with the MythX API.
* **refactor:** Complete refactor, with many of the changes focussing on basing off [`sabre`](https://github.com/b-mueller/sabre).


### BREAKING CHANGES

* The `--full` CLI option is now obsolete and will no have any effect. Please use `--mode full` instead.
* Authentication to the MythX service now requires that the MYTHX_API_KEY environment variable is set, either in a `.env` file located in your project's root, or directly in an environment variable.

[bug]: https://github.com/ethereum/web3.js/issues/3283