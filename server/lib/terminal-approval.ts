import readline from 'node:readline';
import type { JoinRequest } from '../routes/join';

/** Settles once the prompt shown last is answered, so prompts wait for each other. */
let queue: Promise<unknown> = Promise.resolve();
let warnedNoTerminal = false;

function ask({ deviceName, ip }: JoinRequest, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve: (allowed: boolean) => void): void => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const finish = (allowed: boolean): void => {
      signal.removeEventListener('abort', onAbort);
      rl.close();
      resolve(allowed);
    };
    // The request expired or was replaced; end the prompt line so the log continues below it.
    const onAbort = (): void => {
      process.stdout.write('\n');
      finish(false);
    };
    signal.addEventListener('abort', onAbort, { once: true });
    // In a prompt, Ctrl+C reaches readline instead of the process; stop qrup as usual.
    rl.on('SIGINT', (): void => {
      process.stdout.write('\n');
      rl.close();
      process.kill(process.pid, 'SIGINT');
    });
    rl.question(`"${deviceName}" (${ip}) wants to connect. Allow? [y/N] `, (line: string): void =>
      finish(['y', 'yes'].includes(line.trim().toLowerCase())),
    );
  });
}

/**
 * Asks the person at the computer whether a device may connect, one prompt at a time; only `y`
 * or `yes` allows it. Without an interactive terminal it denies every request.
 */
export function approveInTerminal(request: JoinRequest, signal: AbortSignal): Promise<boolean> {
  if (!process.stdin.isTTY) {
    if (!warnedNoTerminal) {
      console.warn('Join requests need an interactive terminal; denying them.');
      warnedNoTerminal = true;
    }
    return Promise.resolve(false);
  }
  const answer = queue.then((): boolean | Promise<boolean> =>
    signal.aborted ? false : ask(request, signal),
  );
  // The next prompt waits a tick, so the decision is logged before it.
  queue = answer.then(
    (): Promise<void> => new Promise((resolve): unknown => setImmediate(resolve)),
  );
  return answer;
}
