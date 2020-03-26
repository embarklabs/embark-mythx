import { Logger } from 'embark-logger';
import { Environment } from '../types';
import Client from '../client';

export default abstract class Controller {
  protected client: Client;
  constructor(env: Environment, protected logger: Logger) {
    this.client = new Client(env);
  }

  protected async login() {
    this.logger.info('Authenticating MythX user...');
    return this.client.authenticate();
  }
}
