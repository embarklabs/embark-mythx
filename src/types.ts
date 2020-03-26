export const ALL_CONTRACTS = '_ALL_';

export interface Environment {
  apiKey?: string;
  username?: string;
  password?: string;
  apiUrl?: string;
}

export enum Mode {
  Quick = 'quick',
  Full = 'full',
  Standard = 'standard',
  Deep = 'deep'
}

export enum Format {
  Text = 'text',
  Stylish = 'stylish',
  Compact = 'compact',
  Table = 'table',
  Html = 'html',
  Json = 'json'
}

export interface Args {
  options: {
    mode: Mode;
    format: Format;
    noCacheLookup: boolean;
    debug: boolean;
    limit: number;
    contracts: string | string[];
    uuid: string;
    timeout: number;
  };
  deprecated?: {
    initialDelay: number;
  };
  obsolete?: {
    full: boolean;
  };
}

export interface UuidArgs {
  options: {
    uuid: string;
  };
}

export interface ReportArgs {
  options: {
    uuid: string;
    format: Format;
  };
}

export interface CompilationInput {
  content: string;
}

export interface CompilationInputs {
  [filePath: string]: CompilationInput;
}

export interface CompilationResult {
  contracts: CompiledContracts;
  sources: CompiledSources;
  solidityFileName: string;
  compiledContractName?: string;
}

export interface CompiledContracts {
  [filePath: string]: CompiledContractList;
}

export interface CompiledContractList {
  [className: string]: CompiledContract;
}

export interface CompiledContract {
  abi: any[];
  devdoc: {
    methods: object;
  };
  evm: {
    bytecode: {
      sourceMap: string;
      object: string;
    };
    deployedBytecode: {
      sourceMap: string;
      object: string;
    };
    methodIdentifiers: {
      [signature: string]: string;
    };
  };
  metadata: string;
  userdoc: {
    methods: object;
  };
}

export interface CompiledSources {
  [filePath: string]: CompiledSource;
}

export interface CompiledSource {
  ast: any;
  id: number;
  legacyAST: any;
}

export interface FunctionHashes {
  [hash: string]: string;
}

export interface CompiledData {
  compiled: CompilationResult;
  contract: CompiledContract;
  contractName: string;
  functionHashes: FunctionHashes;
}
