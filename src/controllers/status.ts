import Controller from '.';
import { Environment } from '../types';
import { Logger } from 'embark-logger';

export default class StatusController extends Controller {
  /* eslint-disable @typescript-eslint/no-useless-constructor */
  constructor(env: Environment, logger: Logger) {
    super(env, logger);
  }

  public async run(uuid: string) {
    if (!uuid) {
      throw new Error("Argument 'uuid' must be provided.");
    }

    await this.login();
    return this.client.getAnalysisStatus(uuid);
  }
}
