// Motor del bot — decide qué responder ante cada mensaje entrante.
//
// Reglas:
//   1. Si la conversación está en `handed_off`, el bot NO interviene
//   2. Si está en medio de un flow (currentNodeId !== null + nodo es `menu`),
//      la entrada del usuario se interpreta como selección de opción
//   3. Si no hay flow activo, buscamos un Flow con trigger que matchee
//      (orden de prioridad: keyword > regex > default > fallback)
//   4. Si nada matchea, devolvemos null (no respondemos)
//
// El engine es PURO: recibe { conversation, incomingBody }, devuelve
// { reply, nextConversationState }. No toca DB ni Baileys directamente —
// el caller (messageHandler) hace la persistencia y el envío.

import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

type ConversationWithFlow = Prisma.ConversationGetPayload<{
  include: { currentFlow: { include: { nodes: true } } };
}>;

export type EngineResult =
  | {
      // El bot tiene algo que responder. Puede ser texto solo, o texto +
      // marcar handoff (delegar al humano).
      type: "reply";
      body: string;
      nextNodeId: string | null;
      handoff: boolean;
      flowId: string | null;
    }
  | {
      // Nada que responder — silencio.
      type: "silence";
    };

export async function decideReply(
  conversation: ConversationWithFlow,
  incomingBody: string,
): Promise<EngineResult> {
  // 1. Handed-off: el bot calla.
  if (conversation.status === "handed_off" || conversation.status === "closed") {
    return { type: "silence" };
  }

  // 2. En medio de un menú: evalúa selección.
  if (conversation.currentNodeId && conversation.currentFlow) {
    const node = conversation.currentFlow.nodes.find((n) => n.id === conversation.currentNodeId);
    if (node && node.type === "menu") {
      const opts = parseOptions(node.options);
      const trimmed = incomingBody.trim();
      // Match por value exacto (típicamente "1", "2") o por label case-insensitive.
      const chosen =
        opts.find((o) => o.value === trimmed) ||
        opts.find((o) => o.label.toLowerCase() === trimmed.toLowerCase());

      if (chosen && chosen.nextNodeId) {
        const next = conversation.currentFlow.nodes.find((n) => n.id === chosen.nextNodeId);
        if (next) return nodeToResult(next, conversation.currentFlow.id);
      }
      // Si no matchea ninguna opción, repetimos el menú.
      return {
        type: "reply",
        body: `No entendí esa opción. Por favor responde con el número de tu elección:\n\n${node.body}`,
        nextNodeId: node.id,
        handoff: false,
        flowId: conversation.currentFlow.id,
      };
    }
  }

  // 3. Sin contexto: arranca un flow según el mensaje.
  const flow = await pickFlow(incomingBody);
  if (!flow || !flow.startNodeId) return { type: "silence" };

  const startNode = await prisma.flowNode.findUnique({ where: { id: flow.startNodeId } });
  if (!startNode) return { type: "silence" };

  return nodeToResult(startNode, flow.id);
}

// Selecciona el flow a disparar según el body entrante.
async function pickFlow(body: string) {
  const flows = await prisma.flow.findMany({ where: { isActive: true } });
  const normalized = body.trim().toLowerCase();

  // Prioridad 1: keyword:X exacto
  for (const f of flows) {
    if (f.trigger.startsWith("keyword:")) {
      const keyword = f.trigger.slice("keyword:".length).toLowerCase();
      if (normalized === keyword || normalized.includes(keyword)) return f;
    }
  }
  // Prioridad 2: regex:...
  for (const f of flows) {
    if (f.trigger.startsWith("regex:")) {
      try {
        const re = new RegExp(f.trigger.slice("regex:".length), "i");
        if (re.test(body)) return f;
      } catch {
        /* regex inválida: ignorar */
      }
    }
  }
  // Prioridad 3: default
  const def = flows.find((f) => f.trigger === "default");
  if (def) return def;
  // Prioridad 4: fallback
  return flows.find((f) => f.trigger === "fallback") ?? null;
}

function nodeToResult(node: { id: string; type: string; body: string }, flowId: string): EngineResult {
  if (node.type === "handoff") {
    return {
      type: "reply",
      body: node.body,
      nextNodeId: null,
      handoff: true,
      flowId,
    };
  }
  if (node.type === "end") {
    return {
      type: "reply",
      body: node.body,
      nextNodeId: null,
      handoff: false,
      flowId,
    };
  }
  // menu o message: dejamos al usuario en este nodo esperando input siguiente.
  return {
    type: "reply",
    body: node.body,
    nextNodeId: node.id,
    handoff: false,
    flowId,
  };
}

// Las opciones se guardan como JSON; las parseamos defensivamente.
type ParsedOption = { label: string; value: string; nextNodeId?: string };

function parseOptions(raw: Prisma.JsonValue | null): ParsedOption[] {
  if (!Array.isArray(raw)) return [];
  const out: ParsedOption[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) continue;
    const obj = item as Record<string, unknown>;
    out.push({
      label: String(obj.label ?? ""),
      value: String(obj.value ?? ""),
      nextNodeId: typeof obj.nextNodeId === "string" ? obj.nextNodeId : undefined,
    });
  }
  return out;
}
