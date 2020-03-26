import { Logger } from 'embark-logger';
import {
  CompilationInputs,
  CompilationResult,
  Args,
  ALL_CONTRACTS,
  Environment,
  Mode,
  Format,
  CompiledSource,
  CompiledContract
} from '../types';
import * as chalk from 'chalk';
import Analysis from '../analysis';
import Controller from '.';
import * as util from 'util';
import ReportController from './report';

const asyncPool = require('tiny-async-pool');

export default class AnalyzeController extends Controller {
  constructor(
    private env: Environment,
    protected logger: Logger,
    private pluginConfig: any
  ) {
    super(env, logger);
  }

  public async runAll(
    compilationResult: CompilationResult,
    compilationInputs: CompilationInputs,
    args: Args
  ) {
    this.checkArgs(args);
    await this.login();

    this.logger.info('Running MythX analysis...');

    const ignore = this.pluginConfig.ignore ?? [];
    const analyses = this.splitCompilationResult(
      compilationInputs,
      compilationResult
    )
      .filter(analysis => !ignore.includes(analysis.contractName))
      .filter(analysis => {
        if (
          args.options?.contracts?.length === 1 &&
          args.options?.contracts[0] === ALL_CONTRACTS
        ) {
          return true;
        }
        return (args.options?.contracts as string[]).includes(
          analysis.contractName
        );
      });

    if (analyses.length === 0) {
      return this.logger.warn(
        'No contracts to analyse. Check command contract filter and plugin ignore (in embark.json).'
      );
    }

    // Run concurrent analyses based on limit arg
    await asyncPool(
      args.options.limit,
      analyses,
      async (analysis: Analysis) => {
        return this.run(analysis, args);
      }
    );

    this.logger.info('Done!');
  }

  private async run(analysis: Analysis, args: Args) {
    try {
      const data = analysis.getRequestData(args);

      if (args.options?.debug) {
        this.logger.info('-------------------');
        this.logger.info('MythX Request Body:\n');
        this.logger.info(util.inspect(data, false, null, true));
      }

      const { uuid } = await this.client.submitDataForAnalysis(data);

      this.logger.info(
        'Analysis job submitted: ' +
          chalk.yellow('https://dashboard.mythx.io/#/console/analyses/' + uuid)
      );

      this.logger.info(
        `Analyzing ${analysis.contractName} in ${args.options.mode} mode...`
      );

      let initialDelay;
      let timeout;

      if (args.options.mode === 'quick') {
        initialDelay = 20 * 1000;
        timeout = 180 * 1000;
      } else if (
        args.options.mode === 'standard' ||
        args.options.mode === 'full'
      ) {
        initialDelay = 900 * 1000;
        timeout = 1800 * 1000;
      } else {
        initialDelay = 2700 * 1000;
        timeout = 5400 * 1000;
      }

      if (args.options?.timeout) {
        timeout = args.options.timeout;
      }

      await this.client.awaitAnalysisFinish(uuid, initialDelay, timeout);

      this.logger.info(
        `Retrieving ${analysis.contractName} analysis results...`
      );

      const reportController = new ReportController(this.env, this.logger);
      return reportController.run(
        uuid,
        args?.options?.format,
        analysis.inputs,
        analysis,
        false
      );
    } catch (err) {
      // cannot rethrow here as we are stuck in a concurrent pool of parallel
      // API requests that may potentially all fail after the initial error
      this.logger.error(`Error analyzing contract: ${err.message}`);
    }
  }

  private checkArgs(args: Args) {
    if (args.obsolete?.full) {
      throw new Error(
        'The --full,f option is now OBSOLETE. Please use --mode full instead.'
      );
    }

    if (args.deprecated?.initialDelay) {
      this.logger.warn(
        'The --initial-delay,i option is DEPRECATED and will be removed in future versions.'
      );
    }

    if (!Object.values(Mode).includes(args.options.mode)) {
      throw new Error(
        'Invalid analysis mode. Available modes: quick, standard, deep.'
      );
    }

    if (!Object.values(Format).includes(args.options.format)) {
      throw new Error(
        `Invalid output format. Available formats: ${Object.values(Format).join(
          ', '
        )}.`
      );
    }
  }

  private splitCompilationResult(
    compilationInputs: CompilationInputs,
    compilationResult: CompilationResult
  ): Analysis[] {
    const compilationResults: Analysis[] = [];
    const inputFilePaths = Object.keys(compilationInputs ?? {});
    const multipleContractDefs: { [inputFilePath: string]: string[] } = {};
    for (const inputFilePath of inputFilePaths) {
      if (
        compilationResults.some(analysis =>
          Object.keys(analysis.sources).includes(inputFilePath)
        )
      ) {
        continue;
      }
      let contractName;
      let contract;
      const contractList = compilationResult.contracts[inputFilePath];
      const sources: { [key: string]: CompiledSource } = {};

      for (const [compiledContractName, compiledContract] of Object.entries(
        contractList
      )) {
        const sourcesToInclude = Object.keys(
          JSON.parse(compiledContract.metadata).sources
        );
        const sourcesFiltered = Object.entries(
          compilationResult.sources
        ).filter(([, { ast }]) => sourcesToInclude.includes(ast.absolutePath));

        // TODO: Use Object.fromEntries when lib can target CommonJS or min node
        // version supports ES6
        sourcesFiltered.forEach(([key, value]) => {
          sources[key] = value;
        });

        if (
          // in the case of only 1 contract (this is the only supported MythX case anyway)
          !contract ||
          // in the case where there are multiple contracts are defined in one contract file
          // this is currently NOT supported by MythX, but we can try to handle it
          compiledContract.evm?.bytecode?.object?.length >
            contract.evm?.bytecode?.object?.length
        ) {
          contract = compiledContract;
          contractName = compiledContractName;

          // when there are multiple contract definitions in one contract file,
          // add the file and contract names to a dictionary to later display a
          // warning to the user that MythX may not support this
          if (contract) {
            if (!multipleContractDefs[inputFilePath]) {
              multipleContractDefs[inputFilePath] = [];
            }
            multipleContractDefs[inputFilePath].push(compiledContractName);
          }
        }
      }
      compilationResults.push(
        new Analysis(
          contract as CompiledContract,
          sources,
          compilationInputs,
          contractName as string,
          inputFilePath
        )
      );
    }

    for (const [inputFilePath, contractNames] of Object.entries(
      multipleContractDefs
    )) {
      this.logger.warn(
        `Contract file '${inputFilePath}' contains multiple contract definitions ('${contractNames.join(
          "', '"
        )}'). MythX may not support this case and therefore the results produced may not be correct.`
      );
    }

    return compilationResults;
  }
}
