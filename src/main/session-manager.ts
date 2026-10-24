import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { BridgeEvent } from '../shared/events';
import { buildClaudeArgs } from './claude-args';
import { createStreamParser } from './stream-parser';

export interface SessionManagerOptions {
  /** Exécutable à lancer (par défaut `claude`, trouvé via le PATH). */
  command?: string;
  /** Arguments placés avant ceux de claude (sert aux tests avec un faux claude). */
  prefixArgs?: string[];
}

export class SessionManager {
  private sessions = new Map<string, ChildProcessWithoutNullStreams>();
  /** Sessions dont on a demandé l'interruption : leur prochain `result` est en erreur, c'est normal. */
  private interrupting = new Set<string>();

  constructor(
    private emit: (event: BridgeEvent) => void,
    private options: SessionManagerOptions = {},
  ) {}

  /** Lance une session dans `cwd` et renvoie son identifiant. */
  start(cwd: string, resumeId?: string): string {
    const sessionId = resumeId ?? randomUUID();
    const command = this.options.command ?? 'claude';
    const args = [...(this.options.prefixArgs ?? []), ...buildClaudeArgs({ sessionId, resume: !!resumeId })];

    const child = spawn(command, args, { cwd, windowsHide: true });
    this.sessions.set(sessionId, child);

    const parser = createStreamParser(sessionId);
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      for (const event of parser.push(chunk)) {
        if (this.interrupting.has(sessionId)) {
          if (event.type === 'error') continue;
          if (event.type === 'turn-end') this.interrupting.delete(sessionId);
        }
        this.emit(event);
      }
    });

    // On garde la fin de stderr pour expliquer un éventuel plantage.
    let stderrTail = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk: string) => {
      stderrTail = (stderrTail + chunk).slice(-2000);
    });

    child.on('error', (err: NodeJS.ErrnoException) => {
      this.sessions.delete(sessionId);
      const message =
        err.code === 'ENOENT'
          ? `Commande « ${command} » introuvable. Claude Code est-il installé et dans le PATH ?`
          : `Impossible de lancer claude : ${err.message}`;
      this.emit({ type: 'error', sessionId, message });
    });

    child.on('exit', (code) => {
      // Une session arrêtée volontairement a déjà été retirée de la Map.
      if (!this.sessions.delete(sessionId)) return;
      if (code !== 0) {
        this.emit({ type: 'error', sessionId, message: `claude s'est arrêté (code ${code}). ${stderrTail.trim()}` });
      }
    });

    return sessionId;
  }

  send(sessionId: string, text: string): void {
    const child = this.sessions.get(sessionId);
    if (!child) {
      this.emit({ type: 'error', sessionId, message: 'Session inconnue ou arrêtée.' });
      return;
    }
    const line = JSON.stringify({ type: 'user', message: { role: 'user', content: text } });
    child.stdin.write(line + '\n');
  }

  /** Arrête la réponse en cours ; la session reste ouverte et se souvient du début. */
  interrupt(sessionId: string): void {
    const child = this.sessions.get(sessionId);
    if (!child) return;
    this.interrupting.add(sessionId);
    const line = JSON.stringify({ type: 'control_request', request_id: randomUUID(), request: { subtype: 'interrupt' } });
    child.stdin.write(line + '\n');
  }

  stop(sessionId: string): void {
    const child = this.sessions.get(sessionId);
    if (!child) return;
    this.sessions.delete(sessionId);
    this.interrupting.delete(sessionId);
    killTree(child);
  }

  stopAll(): void {
    for (const id of [...this.sessions.keys()]) this.stop(id);
  }

  has(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }
}

function killTree(child: ChildProcessWithoutNullStreams): void {
  // Sous Windows, kill() ne tue pas les sous-processus (hooks, serveurs MCP) : taskkill /T le fait.
  if (process.platform === 'win32' && child.pid) {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true });
  } else {
    child.kill();
  }
}
