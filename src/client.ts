import { Environment, CompilationInputs, FunctionHashes } from './types';
import { Client as MythXClient } from 'mythxjs';

export interface Data {
  contractName: string;
  bytecode: string;
  sourceMap: any;
  deployedBytecode: string;
  deployedSourceMap: any;
  sourceList: string[];
  analysisMode: string;
  toolName: string;
  noCacheLookup: boolean;
  sources: Sources | CompilationInputs;
  mainSource: string;
  functionHashes?: FunctionHashes;
}

interface Sources {
  [key: string]: {
    ast: any;
    source: string;
  };
}

export default class Client {
  private mythXClient: MythXClient;
  constructor(env: Environment) {
    const { apiUrl, username, password, apiKey } = env;
    this.mythXClient = new MythXClient(
      username,
      password,
      undefined,
      apiUrl,
      apiKey
    );
  }

  public failAnalysis(reason: string, status: string) {
    throw new Error(
      reason +
        ' ' +
        'The analysis job state is ' +
        status.toLowerCase() +
        ' and the result may become available later.'
    );
  }

  public async awaitAnalysisFinish(
    uuid: string,
    initialDelay: number,
    timeout: number
  ) {
    const statuses = ['Error', 'Finished'];

    let state = await this.mythXClient.getAnalysisStatus(uuid);

    if (statuses.includes(state.status)) {
      return state;
    }

    const timer = (interval: number) =>
      new Promise(resolve => setTimeout(resolve, interval));

    const maxRequests = 10;
    const start = Date.now();
    const remaining = Math.max(timeout - initialDelay, 0);
    const inverted = Math.sqrt(remaining) / Math.sqrt(285);

    for (let r = 0; r < maxRequests; r++) {
      const idle = Math.min(
        r === 0 ? initialDelay : (inverted * r) ** 2,
        start + timeout - Date.now()
      );

      // eslint-disable-next-line no-await-in-loop
      await timer(idle);

      if (Date.now() - start >= timeout) {
        this.failAnalysis(
          `User or default timeout reached after ${timeout / 1000} sec(s).`,
          state.status
        );
      }

      // eslint-disable-next-line no-await-in-loop
      state = await this.mythXClient.getAnalysisStatus(uuid);

      if (statuses.includes(state.status)) {
        return state;
      }
    }

    this.failAnalysis(
      `Allowed number (${maxRequests}) of requests was reached.`,
      state.status
    );
  }

  public async authenticate() {
    return this.mythXClient.login();
  }

  public async submitDataForAnalysis(data: Data) {
    return this.mythXClient.analyze(data);
  }

  public async getReport(uuid: string) {
    return this.mythXClient.getDetectedIssues(uuid);
  }

  public async getApiVersion() {
    return this.mythXClient.getVersion();
  }

  public async getAnalysesList() {
    return this.mythXClient.getAnalysesList();
  }

  public async getAnalysisStatus(uuid: string) {
    return this.mythXClient.getAnalysisStatus(uuid);
  }
}
