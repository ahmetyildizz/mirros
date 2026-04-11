import { requireAuth, clearSession } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";

export async function POST() {
  const user = await requireAuth().catch(() => null);
  
  if (user) {
    await createAuditLog({
      action: "LOGOUT",
      entityType: "USER",
      entityId: user.id,
      resource: `User ${user.username} logged out`,
      userId: user.id
    });
  }

  await clearSession();
  return NextResponse.json({ ok: true });
}
