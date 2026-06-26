/**
 * Logger utilities for CLI output
 */

import chalk from 'chalk';

export const logger = {
  info(message: string) {
    console.log(chalk.blue('ℹ'), message);
  },

  success(message: string) {
    console.log(chalk.green('✓'), message);
  },

  warning(message: string) {
    console.log(chalk.yellow('⚠'), message);
  },

  error(message: string) {
    console.error(chalk.red('✗'), message);
  },

  dim(message: string) {
    console.log(chalk.dim(message));
  },

  bold(message: string) {
    console.log(chalk.bold(message));
  },

  header(message: string) {
    console.log();
    console.log(chalk.bold.cyan(message));
    console.log(chalk.dim('─'.repeat(50)));
  },
};

export function step(num: number, message: string) {
  console.log(chalk.cyan(`${num}.`), message);
}

export function divider() {
  console.log(chalk.dim('─'.repeat(50)));
}
