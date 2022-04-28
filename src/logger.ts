import debugLib from 'debug';

// debugLib.enable('*');

const debugLogger = debugLib('pmm');

export function info(message: string) {
  console.log(`🎁  ${message}`);
}

export function debug(formatter: any, ...args: any[]) {
  debugLogger(formatter, ...args);
}
