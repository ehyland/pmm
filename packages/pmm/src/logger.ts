import debugLib from 'debug';
import kleur from 'kleur';

// debugLib.enable('*');

const debugLogger = debugLib('pmm');

export function friendly(message: string) {
  process.stderr.write(`🎁  ${message}\n`);
}

export function userError(message: string) {
  process.stderr.write(kleur.bgRed(`⚠️  ${message}`) + '\n');
}

export function info(message: string) {
  process.stderr.write(`${message}\n`);
}

export function debug(formatter: any, ...args: any[]) {
  debugLogger(formatter, ...args);
}
