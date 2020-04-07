import Controller from '.';
import { Environment, Format } from '../types';
import { Logger } from 'embark-logger';
import { CompilationInputs } from '../types';
import * as path from 'path';
import chalk from 'chalk';
import Analysis from '../analysis';

const eslintCliEngine = require('eslint').CLIEngine;
const SourceMappingDecoder = require('remix-lib/src/sourceMappingDecoder');

enum Severity {
  High = 2,
  Medium = 1
}

export default class ReportController extends Controller {
  private decoder: any;
  constructor(env: Environment, logger: Logger) {
    super(env, logger);

    this.decoder = new SourceMappingDecoder();
  }

  public async run(
    uuid: string,
    format: Format,
    inputs: CompilationInputs,
    analysis: Analysis | null = null,
    doLogin = true
  ) {
    if (!uuid) {
      throw new Error("Argument 'uuid' must be provided.");
    }

    if (doLogin) {
      await this.login();
    }
    const issues = await this.client.getReport(uuid);

    this.render(issues, format, inputs, analysis);
  }

  public async render(
    issues: any,
    format: Format,
    inputs: CompilationInputs,
    analysis: Analysis | null = null
  ) {
    this.logger.info(
      `Rendering ${analysis?.contractName ?? ''} analysis report...`
    );

    const functionHashes = analysis?.getFunctionHashes() ?? {};

    const data = { functionHashes, sources: { ...inputs } };

    const uniqueIssues = this.formatIssues(data, issues);

    if (uniqueIssues.length === 0) {
      this.logger.info(
        chalk.green(
          `✔ No errors/warnings found for contract: ${analysis?.contractName}`
        )
      );
    } else {
      const formatter = this.getFormatter(format);
      const output = formatter(uniqueIssues);
      this.logger.info(output);
    }
  }

  /**
   * @param {string} name - formatter name
   * @returns {object} - ESLint formatter module
   */
  private getFormatter(name: Format) {
    const custom = ['text'];
    let format: string = name;

    if (custom.includes(name)) {
      format = path.join(__dirname, '../formatters/', name + '.js');
    }

    return eslintCliEngine.getFormatter(format);
  }

  /**
   * Turn a srcmap entry (the thing between semicolons) into a line and
   * column location.
   * We make use of this.sourceMappingDecoder of this class to make
   * the conversion.
   *
   * @param {string} srcEntry - a single entry of solc sourceMap
   * @param {Array} lineBreakPositions - array returned by the function 'mapLineBreakPositions'
   * @returns {object} - line and column location
   */
  private textSrcEntry2lineColumn(srcEntry: string, lineBreakPositions: any) {
    const ary = srcEntry.split(':');
    const sourceLocation = {
      length: parseInt(ary[1], 10),
      start: parseInt(ary[0], 10)
    };
    const loc = this.decoder.convertOffsetToLineColumn(
      sourceLocation,
      lineBreakPositions
    );
    // FIXME: note we are lossy in that we don't return the end location
    if (loc.start) {
      // Adjust because routines starts lines at 0 rather than 1.
      loc.start.line++;
    }
    if (loc.end) {
      loc.end.line++;
    }
    return [loc.start, loc.end];
  }

  /**
   * Convert a MythX issue into an ESLint-style issue.
   * The eslint report format which we use, has these fields:
   *
   * - column,
   * - endCol,
   * - endLine,
   * - fatal,
   * - line,
   * - message,
   * - ruleId,
   * - severity
   *
   * but a MythX JSON report has these fields:
   *
   * - description.head
   * - description.tail,
   * - locations
   * - severity
   * - swcId
   * - swcTitle
   *
   * @param {object} issue - the MythX issue we want to convert
   * @param {string} sourceCode - holds the contract code
   * @param {object[]} locations - array of text-only MythX API issue locations
   * @returns {object} eslint - issue object
   */
  private issue2EsLint(issue: any, sourceCode: string, locations: any) {
    const swcLink = issue.swcID
      ? 'https://swcregistry.io/docs/' + issue.swcID
      : 'N/A';

    const esIssue = {
      mythxIssue: issue,
      mythxTextLocations: locations,
      sourceCode,

      fatal: false,
      ruleId: swcLink,
      message: issue.description.head,
      severity: Severity[issue.severity] || 1,
      line: -1,
      column: 0,
      endLine: -1,
      endCol: 0
    };

    let startLineCol;
    let endLineCol;

    const lineBreakPositions = this.decoder.getLinebreakPositions(sourceCode);

    if (locations.length) {
      [startLineCol, endLineCol] = this.textSrcEntry2lineColumn(
        locations[0].sourceMap,
        lineBreakPositions
      );
    }

    if (startLineCol) {
      esIssue.line = startLineCol.line;
      esIssue.column = startLineCol.column;

      esIssue.endLine = endLineCol.line;
      esIssue.endCol = endLineCol.column;
    }

    return esIssue;
  }

  /**
   * Gets the source index from the issue sourcemap
   *
   * @param {object} location - MythX API issue location object
   * @returns {number} - source index
   */
  private getSourceIndex(location: any) {
    const sourceMapRegex = /(\d+):(\d+):(\d+)/g;
    const match = sourceMapRegex.exec(location.sourceMap);
    // Ignore `-1` source index for compiler generated code
    return match ? match[3] : '0';
  }

  /**
   * Converts MythX analyze API output item to Eslint compatible object
   * @param {object} report - issue item from the collection MythX analyze API output
   * @param {object} data - Contains array of solidity contracts source code and the input filepath of contract
   * @returns {object} - Eslint compatible object
   */
  private convertMythXReport2EsIssue(report: any, data: any) {
    const { sources, functionHashes } = data;
    const results: { [key: string]: any } = {};

    /**
     * Filters locations only for source files.
     * Other location types are not supported to detect code.
     *
     * @param {object} location - locations to filter
     * @returns {object} - filtered locations
     */
    const textLocationFilterFn = (location: any) =>
      location.sourceType === 'solidity-file' &&
      location.sourceFormat === 'text';

    report.issues.forEach((issue: any) => {
      const locations = issue.locations.filter(textLocationFilterFn);
      const location = locations.length ? locations[0] : undefined;

      let sourceCode = '';
      let sourcePath = '<unknown>';

      if (location) {
        const sourceIndex = parseInt(this.getSourceIndex(location) ?? 0, 10);
        // if DApp's contracts have changed, we can no longer guarantee our sources will be the
        // same as at the time of submission. This should only be an issue when getting a past
        // analysis report (ie verify report uuid), and not during a just-completed analysis (ie verify)
        const fileName = Object.keys(sources)[sourceIndex];

        if (fileName) {
          sourcePath = path.basename(fileName);
          sourceCode = sources[fileName].content;
        }
      }

      if (!results[sourcePath]) {
        results[sourcePath] = {
          errorCount: 0,
          warningCount: 0,
          fixableErrorCount: 0,
          fixableWarningCount: 0,
          filePath: sourcePath,
          functionHashes,
          sourceCode,
          messages: []
        };
      }

      results[sourcePath].messages.push(
        this.issue2EsLint(issue, sourceCode, locations)
      );
    });

    for (const key of Object.keys(results)) {
      const result = results[key];

      for (const { fatal, severity } of result.messages) {
        if (this.isFatal(fatal, severity)) {
          result.errorCount++;
        } else {
          result.warningCount++;
        }
      }
    }

    return Object.values(results);
  }

  private formatIssues(data: any, issues: any) {
    const eslintIssues = issues
      .map((report: any) => this.convertMythXReport2EsIssue(report, data))
      .reduce((acc: any, curr: any) => acc.concat(curr), []);

    return this.getUniqueIssues(eslintIssues);
  }

  private isFatal(fatal: any, severity: any) {
    return fatal || severity === 2;
  }

  private getUniqueMessages(messages: any) {
    const jsonValues = messages.map((m: any) => JSON.stringify(m));
    const uniqueValues = jsonValues.reduce((acc: any, curr: any) => {
      if (acc.indexOf(curr) === -1) {
        acc.push(curr);
      }

      return acc;
    }, []);

    return uniqueValues.map((v: any) => JSON.parse(v));
  }

  private calculateErrors(messages: any) {
    return messages.reduce(
      (acc: any, { fatal, severity }: any) =>
        this.isFatal(fatal, severity) ? acc + 1 : acc,
      0
    );
  }

  private calculateWarnings(messages: any) {
    return messages.reduce(
      (acc: any, { fatal, severity }: any) =>
        !this.isFatal(fatal, severity) ? acc + 1 : acc,
      0
    );
  }

  private getUniqueIssues(issues: any) {
    return issues.map(({ messages, ...restProps }: any) => {
      const uniqueMessages = this.getUniqueMessages(messages);
      const warningCount = this.calculateWarnings(uniqueMessages);
      const errorCount = this.calculateErrors(uniqueMessages);

      return {
        ...restProps,
        messages: uniqueMessages,
        errorCount,
        warningCount
      };
    });
  }
}
