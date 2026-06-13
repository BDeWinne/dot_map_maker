import type { SystemConnection } from "./ConnectionTypes";
import type { SystemData } from "../galaxy/NodeSystem";

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  messageKey: string;
  nodeId?: string;
  connectionId?: string;
  ownerId?: string;
  detail?: string;
}

export interface MapValidationInput {
  systems: SystemData[];
  connections: SystemConnection[];
}

export function validateMap(input: MapValidationInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { systems, connections } = input;
  const byId = new Map<string, SystemData>();

  const idCounts = new Map<string, number>();
  for (const sys of systems) {
    idCounts.set(sys.id, (idCounts.get(sys.id) ?? 0) + 1);
    byId.set(sys.id, sys);
    if (!sys.name?.trim()) {
      issues.push({
        severity: "warning",
        code: "empty_name",
        messageKey: "validation.emptyName",
        nodeId: sys.id,
      });
    }
  }

  for (const [id, count] of idCounts) {
    if (count > 1) {
      issues.push({
        severity: "error",
        code: "duplicate_id",
        messageKey: "validation.duplicateId",
        nodeId: id,
        detail: String(count),
      });
    }
  }

  const connIds = new Map<string, number>();
  for (const conn of connections) {
    connIds.set(conn.id, (connIds.get(conn.id) ?? 0) + 1);
    if (!byId.has(conn.from)) {
      issues.push({
        severity: "error",
        code: "missing_from",
        messageKey: "validation.missingFrom",
        connectionId: conn.id,
        nodeId: conn.from,
      });
    }
    if (!byId.has(conn.to)) {
      issues.push({
        severity: "error",
        code: "missing_to",
        messageKey: "validation.missingTo",
        connectionId: conn.id,
        nodeId: conn.to,
      });
    }
  }

  for (const [id, count] of connIds) {
    if (count > 1) {
      issues.push({
        severity: "error",
        code: "duplicate_conn",
        messageKey: "validation.duplicateConn",
        connectionId: id,
        detail: String(count),
      });
    }
  }

  const connected = new Set<string>();
  for (const conn of connections) {
    connected.add(conn.from);
    connected.add(conn.to);
  }

  for (const sys of systems) {
    const adv = sys.adventure;
    if (!adv?.unlockRequires?.length) continue;
    for (const reqId of adv.unlockRequires) {
      if (!byId.has(reqId)) {
        issues.push({
          severity: "error",
          code: "bad_unlock_ref",
          messageKey: "validation.badUnlockRef",
          nodeId: sys.id,
          detail: reqId,
        });
      }
    }
  }

  const capitalsByOwner = new Map<string, string[]>();
  for (const sys of systems) {
    if (!sys.isCapital || !sys.owner || sys.owner === "none") continue;
    const list = capitalsByOwner.get(sys.owner) ?? [];
    list.push(sys.id);
    capitalsByOwner.set(sys.owner, list);
  }
  for (const [ownerId, ids] of capitalsByOwner) {
    if (ids.length > 1) {
      issues.push({
        severity: "warning",
        code: "multi_capital",
        messageKey: "validation.multiCapital",
        ownerId,
        detail: ids.join(", "),
      });
    }
  }

  if (systems.length > 1) {
    for (const sys of systems) {
      if (!connected.has(sys.id)) {
        issues.push({
          severity: "warning",
          code: "orphan_node",
          messageKey: "validation.orphanNode",
          nodeId: sys.id,
        });
      }
    }
  }

  return issues;
}
