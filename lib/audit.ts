import { db } from "./db";
import { AuditAction, TargetType } from "@prisma/client";
import { headers } from "next/headers";

interface AuditLogOptions {
  action: AuditAction;
  entityType?: TargetType;
  entityId?: string;
  resource?: string;
  details?: any;
  oldValue?: string;
  newValue?: string;
  userId?: string;
  tx?: any; // For transactions
}

export async function createAuditLog(options: AuditLogOptions) {
  const {
    action,
    entityType,
    entityId,
    resource,
    details,
    oldValue,
    newValue,
    userId,
    tx = db,
  } = options;

  let ipAddress: string | undefined;
  let userAgent: string | undefined;

  try {
    // Next.js headers function might throw if called outside of request scope
    const headersList = await headers();
    ipAddress = headersList.get("x-forwarded-for") || undefined;
    userAgent = headersList.get("user-agent") || undefined;
  } catch (e) {
    // Silent fail if not in request scope
  }

  return await tx.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      resource,
      details,
      oldValue,
      newValue,
      userId,
      ipAddress,
      userAgent,
    },
  });
}
