import type { BridgeEvent } from '../shared/events';

export interface StreamParser {
  /** Reçoit un morceau de stdout, renvoie les événements des lignes complètes. */
  push(chunk: string): BridgeEvent[];
}

export function createStreamParser(sessionId: string): StreamParser {
  // stdout arrive par morceaux arbitraires : on garde la fin de ligne incomplète ici.
  let buffer = '';

  return {
    push(chunk) {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      return lines.flatMap((line) => parseLine(line.trim(), sessionId));
    },
  };
}

function parseLine(line: string, sessionId: string): BridgeEvent[] {
  if (!line) return [];
  let msg: Record<string, unknown>;
  try {
    msg = JSON.parse(line);
  } catch {
    console.warn('[cli-bridge] ligne non JSON ignorée :', line.slice(0, 200));
    return [];
  }

  if (msg.type === 'stream_event') {
    const event = msg.event as { type?: string; delta?: { type?: string; text?: string } } | undefined;
    if (event?.type === 'content_block_delta' && event.delta?.type === 'text_delta' && event.delta.text) {
      return [{ type: 'text-delta', sessionId, text: event.delta.text }];
    }
    return [];
  }

  if (msg.type === 'assistant') {
    // Avec --include-partial-messages, chaque bloc terminé arrive dans son propre message assistant.
    const content = (msg.message as { content?: unknown } | undefined)?.content;
    if (!Array.isArray(content)) return [];
    return content
      .filter((block) => block?.type === 'tool_use' && typeof block.name === 'string')
      .map((block) => ({ type: 'tool-use', sessionId, name: block.name, input: block.input ?? {} }));
  }

  if (msg.type === 'result') {
    const result = typeof msg.result === 'string' ? msg.result : undefined;
    const costUsd = typeof msg.total_cost_usd === 'number' ? msg.total_cost_usd : undefined;
    const end: BridgeEvent = { type: 'turn-end', sessionId, result, ...(costUsd !== undefined && { costUsd }) };
    if (msg.is_error) {
      return [{ type: 'error', sessionId, message: result ?? String(msg.subtype ?? 'erreur inconnue') }, end];
    }
    return [end];
  }

  // system/*, rate_limit_event… : pas utiles au renderer pour l'instant.
  return [];
}
