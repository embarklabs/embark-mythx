import Controller from '.';
import { Environment } from '../types';
import { Logger } from 'embark-logger';
import { formatDistance } from 'date-fns';
const AsciiTable = require('ascii-table');

export default class ListController extends Controller {
  /* eslint-disable @typescript-eslint/no-useless-constructor */
  constructor(env: Environment, logger: Logger) {
    super(env, logger);
  }

  public async run() {
    await this.login();
    const list = await this.client.getAnalysesList();
    const analyses = list.analyses.map((a: any) => {
      return {
        Mode: a.analysisMode,
        Contract: a.mainSource,
        Vulnerabilities: Object.entries(a.numVulnerabilities)
          .map(([level, num]) => `${level}: ${num}`)
          .join(', '),
        Submitted: formatDistance(new Date(a.submittedAt), new Date()) + ' ago',
        UUID: a.uuid
      };
    });
    const table = AsciiTable.factory({
      title: 'Past analyses',
      heading: Object.keys(analyses[0]),
      rows: Object.values(analyses).map(analysis =>
        Object.values(analysis as any[])
      )
    });
    return table.toString();
  }
}
