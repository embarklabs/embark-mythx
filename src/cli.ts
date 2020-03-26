import * as chalk from 'chalk';
import { Format, Mode, ALL_CONTRACTS } from './types';

export const FORMAT_OPT = {
  name: 'format',
  alias: 'o',
  type: String,
  defaultValue: Format.Stylish,
  typeLabel: '{underline string}',
  description:
    'Output format. Options: text, stylish, compact, table, html, json (default: stylish).',
  group: 'options'
};

export const CLI_OPTS = [
  // tslint:disable-next-line: max-line-length
  {
    name: 'mode',
    alias: 'm',
    type: String,
    defaultValue: Mode.Quick,
    typeLabel: '{underline string}',
    description:
      'Analysis mode. Options: quick, standard, deep (default: quick).',
    group: 'options'
  },
  FORMAT_OPT,
  {
    name: 'no-cache-lookup',
    alias: 'c',
    type: Boolean,
    defaultValue: false,
    description: 'Deactivate MythX cache lookups (default: false).',
    group: 'options'
  },
  {
    name: 'debug',
    alias: 'd',
    type: Boolean,
    defaultValue: false,
    description: 'Print MythX API request and response.',
    group: 'options'
  },
  {
    name: 'limit',
    alias: 'l',
    type: Number,
    defaultValue: 10,
    description: 'Maximum number of concurrent analyses (default: 10).',
    group: 'options'
  },
  {
    name: 'contracts',
    type: String,
    multiple: true,
    defaultValue: ALL_CONTRACTS,
    defaultOption: true,
    description: 'List of contracts to submit for analysis (default: all).',
    group: 'options'
  },
  {
    name: 'timeout',
    alias: 't',
    type: Number,
    description:
      'Timeout in secs to wait for analysis to finish (default: smart default based on mode).',
    group: 'options'
  },

  // deprecated
  {
    name: 'initial-delay',
    alias: 'i',
    type: Number,
    defaultValue: 0,
    description:
      '[DEPRECATED] Time in seconds before first analysis status check (default: 0).',
    group: 'deprecated'
  },
  // obsolete
  {
    name: 'full',
    alias: 'f',
    type: Boolean,
    description:
      '[OBSOLETE] Perform full instead of quick analysis (not available on free MythX tier).',
    group: 'obsolete'
  }
];

export const CLI_COMMANDS = [
  {
    name: 'verify',
    typeLabel: '{italic <options> [contracts]}',
    description:
      'Runs MythX verification. If array of contracts are specified, only those contracts will be analysed.'
  },
  {
    name: 'verify report',
    type: String,
    typeLabel: '{italic [--format] uuid}',
    description: 'Get the report of a completed analysis.'
  },
  {
    name: 'verify status',
    type: String,
    typeLabel: '{italic uuid}',
    description: 'Get the status of an already submitted analysis.'
  },
  {
    name: 'verify list',
    description: 'Displays a list of the last 20 submitted analyses in a table.'
  },
  {
    name: 'verify help',
    type: Boolean,
    defaultValue: false,
    description: 'Display this usage guide.'
  }
];

export const header =
  'Smart contract security analysis with MythX\n\n' +
  // tslint:disable: no-trailing-whitespace
  chalk.blueBright(`         ::::::: \`          :::::::\`      \`\`\`   \`\`\`                     \`\`        \`\`     \`\`\`         
         +++++++\`          +++++++\`      ...\` \`...              .\`     ..        \`.\`   \`.\`          
         \`\`\`:+++///:   -///+++/\`\`\`       ..\`. .\`..  \`\`    \`\`  \`\`..\`\`   ..\`\`\`\`     \`.. \`.\`           
            -++++++/   :++++++:          .. .\`. ..  \`.\`   .\`   \`.\`     ..\` \`..      ...             
                /++/   :+++              .. ..\` ..   ..  ..     .\`     ..   \`.     \`...\`            
            \`\`\`\`////\`\`\`:///.\`\`\`          ..     ..    .\` .\`     .\`     ..   \`.    \`.\` \`.\`           
            -+++\`  \`+++-   +++:          ..     ..    \`...      ..\`\`   ..   \`.   \`.\`   \`..          
            .:::\`  \`:::.   :::.          \`\`     \`\`     ..\`      \`\`\`\`   \`\`   \`\`  \`\`      \`\`\`         
                                                     \`\`..                                           
                                                      \`                                             
`);
// tslint:enable: no-trailing-whitespace

export const CLI_USAGE = [
  {
    header: 'embark-mythx',
    content: header,
    raw: true
  },
  {
    header: 'Available Commands',
    content: Array.from(new Set(CLI_COMMANDS.values())).map(command => {
      return {
        name: `${command.name} ${command.typeLabel || ''}`,
        summary: command.description
      };
    })
  },
  {
    header: 'Examples',
    content: [
      {
        name: 'verify --mode full SimpleStorage ERC20',
        summary:
          'Runs a full MythX verification for the SimpleStorage and ERC20 contracts only.'
      },
      {
        name: 'verify status 0d60d6b3-e226-4192-b9c6-66b45eca3746',
        summary:
          'Gets the status of the MythX analysis with the specified uuid.'
      },
      {
        name:
          'verify report --format stylish 0d60d6b3-e226-4192-b9c6-66b45eca3746',
        summary:
          'Gets the status of the MythX analysis with the specified uuid.'
      }
    ]
  },
  {
    header: 'Verify options',
    hide: ['contracts'],
    optionList: CLI_OPTS,
    group: ['options']
  }
];
