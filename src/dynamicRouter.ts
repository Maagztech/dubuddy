import express, { Request, Response } from "express";
import { ModelDef } from "./modelStore";
import { v4 as uuidv4 } from "uuid";
import { enforce } from "./rbac";
import { verifyToken } from "./auth";
import prisma from "./prismaClient";

export function registerModelRoutes(app: express.Express, model: ModelDef) {
  const table = model.table || model.name.toLowerCase() + "s";
  const base = `/api/${table}`;
  const router = express.Router();

  // require auth for all CRUD ops so RBAC can read req.user
  router.use(verifyToken);

  // Create
  router.post(
    "/",
    enforce(model, "create"),
    async (req: Request, res: Response) => {
      const id = uuidv4();
      const ownerId = model.ownerField ? (req as any).user?.id : undefined;
      const created = await prisma.modelRecord.create({
        data: {
          id,
          model: model.name,
          data: JSON.stringify(req.body),
          ownerId,
        } as any,
      });
      // parse data before returning
      (created as any).data = JSON.parse((created as any).data);
      res.status(201).json(created);
    }
  );

  // List
  router.get(
    "/",
    enforce(model, "read"),
    async (req: Request, res: Response) => {
      const rows = await prisma.modelRecord.findMany({
        where: { model: model.name } as any,
      });
      const parsed = rows.map((r: any) => ({
        ...r,
        data: JSON.parse(r.data),
      }));
      res.json(parsed);
    }
  );

  // Get by id
  router.get(
    "/:id",
    enforce(model, "read"),
    async (req: Request, res: Response) => {
      const row = await prisma.modelRecord.findUnique({
        where: { id: req.params.id } as any,
      });
      if (!row) return res.status(404).json({ error: "Not found" });
      (row as any).data = JSON.parse((row as any).data);
      res.json(row);
    }
  );

  // Update
  router.put(
    "/:id",
    // load existing record so ownership can be checked by RBAC middleware
    async (req: Request, res: Response, next) => {
      const existing = await prisma.modelRecord.findUnique({
        where: { id: req.params.id } as any,
      });
      if (!existing) return res.status(404).json({ error: "Not found" });
      (req as any).recordOwner = existing.ownerId;
      // attach existing data for handler
      (req as any).existingRecord = existing;
      next();
    },
    enforce(model, "update"),
    async (req: Request, res: Response) => {
      const existing = (req as any).existingRecord;
      const merged = {
        ...(existing.data ? JSON.parse(existing.data as string) : {}),
        ...(req.body || {}),
      };
      const updated = await prisma.modelRecord.update({
        where: { id: req.params.id } as any,
        data: { data: JSON.stringify(merged) },
      });
      (updated as any).data = JSON.parse((updated as any).data);
      res.json(updated);
    }
  );

  // Delete
  router.delete(
    "/:id",
    async (req: Request, res: Response, next) => {
      const existing = await prisma.modelRecord.findUnique({
        where: { id: req.params.id } as any,
      });
      if (!existing) return res.status(404).json({ error: "Not found" });
      (req as any).recordOwner = existing.ownerId;
      next();
    },
    enforce(model, "delete"),
    async (req: Request, res: Response) => {
      const deleted = await prisma.modelRecord.delete({
        where: { id: req.params.id } as any,
      });
      res.json({ success: true, deleted });
    }
  );

  app.use(base, router);
  console.log(`Registered routes for ${model.name} at ${base}`);
}
