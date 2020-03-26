import { Logger } from 'embark-logger';
import { Callback, Embark } from 'embark-core';
import AnalyzeController from './controllers/analyze';
import StatusController from './controllers/status';
import ListController from './controllers/list';
import ReportController from './controllers/report';
import * as fs from 'fs';
import {
  CompilationInputs,
  CompilationResult,
  Environment,
  UuidArgs,
  ReportArgs
} from './types';
import { OptionDefinition } from 'command-line-args';
import * as util from 'util';
import { FORMAT_OPT, CLI_USAGE, CLI_OPTS } from './cli';

const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
require('dotenv').config();

const COMMAND_REGEX = /(?<=verify ?)(.*|\S+)/g;

export default class EmbarkMythX {
  private compilationInputs: CompilationInputs = {};
  private compilationResult?: CompilationResult;
  private logger: Logger;
  constructor(private embark: Embark) {
    this.logger = embark.logger;

    // Register for compilation results
    embark.events.on(
      'contracts:compiled:solc',
      (compilationResult: CompilationResult) => {
        for (const sourcePath of Object.keys(compilationResult.sources)) {
          this.compilationInputs[sourcePath] = {
            content: fs.readFileSync(sourcePath, 'utf8')
          };
        }
        this.compilationResult = compilationResult;
      }
    );

    this.registerConsoleCommands();
  }

  private determineEnv(): Environment {
    const env: Environment = {
      apiKey: process.env.MYTHX_API_KEY,
      username: process.env.MYTHX_USERNAME,
      password: process.env.MYTHX_PASSWORD,
      apiUrl: process.env.MYTHX_API_URL
    };

    if (!env.username) {
      env.username = process.env.MYTHX_ETH_ADDRESS; // for backwards compatibility
    }

    const { username, password, apiKey } = env;

    if (!(username && password) && !apiKey) {
      throw new Error(
        'No authentication credentials could be found. Unauthenticated use of MythX has been discontinued. Sign up for a free a account at https://mythx.io/ and set the MYTHX_API_KEY environment variable.'
      );
    }

    if (username && password && !apiKey) {
      throw new Error(
        'You are attempting to authenticate with username/password auth which is no longer supported by mythxjs. Please use MYTHX_API_KEY instead.'
      );
    }

    if (!(username && password && apiKey)) {
      throw new Error(
        'You must supply MYTHX_USERNAME, MYTHX_PASSWORD, and MYTHX_API_KEY environment variables in order to authenticate.'
      );
    }

    return env;
  }

  private determineArgs(argv: string[]) {
    const mainDefinitions = [{ name: 'command', defaultOption: true }];
    return commandLineArgs(mainDefinitions, { stopAtFirstUnknown: true, argv });
  }

  private registerConsoleCommands() {
    this.embark.registerConsoleCommand({
      description:
        "Run MythX smart contract analysis. Run 'verify help' for command usage.",
      matches: (cmd: string) => COMMAND_REGEX.test(cmd),
      usage: 'verify [options] [contracts]',
      process: async (cmd: string, callback: Callback<string>) => {
        // @ts-ignore
        const cmdName = cmd
          .match(COMMAND_REGEX)[0]
          .split(' ')
          .filter(a => a);

        try {
          const env = this.determineEnv();
          const main = this.determineArgs(cmdName);
          const argv = main._unknown ?? main.command ?? [];
          const statusDefinitions: OptionDefinition[] = [
            {
              name: 'uuid',
              type: String,
              defaultOption: true,
              group: 'options'
            }
          ];

          switch (main.command) {
            case 'report':
              statusDefinitions.push(FORMAT_OPT);
              const reportArgs = commandLineArgs(statusDefinitions, {
                argv
              }) as ReportArgs;

              const reportController = new ReportController(env, this.logger);
              await reportController.run(
                reportArgs?.options?.uuid.toLowerCase(),
                reportArgs?.options?.format,
                this.compilationInputs
              );

              break;

            case 'list':
              const listController = new ListController(env, this.logger);
              const list = await listController.run();
              this.logger.info(list);
              break;

            case 'status':
              const statusArgs = commandLineArgs(statusDefinitions, {
                argv
              }) as UuidArgs;

              const statusController = new StatusController(env, this.logger);
              const status = await statusController.run(
                statusArgs?.options?.uuid?.toLowerCase()
              );

              this.logger.info(util.inspect(status));
              break;

            case 'help':
              this.logger.info(commandLineUsage(CLI_USAGE));
              break;

            default:
              const args = commandLineArgs(CLI_OPTS, { argv, camelCase: true });

              const analyzeController = new AnalyzeController(
                env,
                this.logger,
                this.embark.pluginConfig
              );
              await analyzeController.runAll(
                this.compilationResult as CompilationResult,
                this.compilationInputs,
                args
              );

              break;
          }
        } catch (e) {
          return callback(e);
        }

        return callback(null);
      }
    });
  }
}
