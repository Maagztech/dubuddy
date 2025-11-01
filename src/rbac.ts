import { Request, Response, NextFunction } from "express";
import { ModelDef } from "./modelStore";

type CRUD = "create" | "read" | "update" | "delete" | "all";

function hasPermission(model: ModelDef, role: string, op: CRUD) {
  const rbac = model.rbac || {};
  const perms = rbac[role] || [];
  if (perms.includes("all")) return true;
  return perms.includes(op);
}

export function enforce(model: ModelDef, op: CRUD) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Missing user" });
    const role = user.role;
    if (role === "Admin") return next();

    if (!hasPermission(model, role, op)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // ownership enforcement for update/delete
    if ((op === "update" || op === "delete") && model.ownerField) {
      const ownerField = model.ownerField;
      const id = req.params.id;
      // assume data is attached to req by route handler as req.recordOwner (if available)
      const ownerId = (req as any).recordOwner;
      if (ownerId && ownerId !== user.id && role !== "Admin") {
        return res.status(403).json({ error: "Forbidden - not owner" });
      }
    }

    return next();
  };
}
