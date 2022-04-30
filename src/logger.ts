import debugLib from "debug";
import kleur from "kleur";

// debugLib.enable('*');

const debugLogger = debugLib("pmm");

export function friendly(message: string) {
  console.log(`🎁  ${message}`);
}

export function userError(message: string) {
  console.log(kleur.bgRed(`⚠️  ${message}`));
}

export function info(message: string) {
  console.log(message);
}

export function debug(formatter: any, ...args: any[]) {
  debugLogger(formatter, ...args);
}
