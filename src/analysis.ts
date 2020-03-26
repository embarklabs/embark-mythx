import {
  Args,
  CompiledContract,
  CompiledSources,
  CompilationInputs,
  FunctionHashes
} from './types';
import { replaceLinkedLibs } from './utils';
import * as path from 'path';
import { Data } from './client';

const TOOL_NAME = 'embark-mythx';

export default class Analysis {
  constructor(
    public contract: CompiledContract,
    public sources: CompiledSources,
    public inputs: CompilationInputs,
    public contractName: string,
    public contractFileName: string
  ) {}

  /**
   * Formats data for the MythX API
   */
  public getRequestData(args: Args) {
    const data: Data = {
      contractName: this.contractName,
      bytecode: replaceLinkedLibs(this.contract.evm.bytecode.object),
      sourceMap: this.contract.evm.bytecode.sourceMap,
      deployedBytecode: replaceLinkedLibs(
        this.contract.evm.deployedBytecode.object
      ),
      deployedSourceMap: this.contract.evm.deployedBytecode.sourceMap,
      sourceList: [],
      analysisMode: args.options?.mode,
      toolName: TOOL_NAME,
      noCacheLookup: args.options?.noCacheLookup,
      sources: {},
      mainSource: path.basename(this.contractFileName)
    };

    for (const key of Object.keys(this.sources)) {
      const ast = this.sources[key].ast;
      const source = this.inputs[key].content;

      const contractName = path.basename(key);

      data.sourceList.push(contractName);

      data.sources[contractName] = { ast, source };
    }

    return data;
  }

  /**
   * Returns dictionary of function signatures and their keccak256 hashes
   * for all contracts.
   *
   * Same function signatures will be overwritten
   * as there should be no distinction between their hashes,
   * even if such functions defined in different contracts.
   *
   * @returns {object} Dictionary object where
   *                   key is a hex string first 4 bytes of keccak256 hash
   *                   and value is a corresponding function signature.
   */
  public getFunctionHashes() {
    const hashes: FunctionHashes = {};

    for (const [signature, hash] of Object.entries(
      this.contract.evm.methodIdentifiers
    )) {
      hashes[hash] = signature;
    }
    return hashes;
  }
}
