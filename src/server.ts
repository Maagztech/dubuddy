import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";

import { saveModel, listModels, loadModel, ModelDef } from "./modelStore";
import { loginHandler, verifyToken } from "./auth";
import { registerModelRoutes } from "./dynamicRouter";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// serve admin UI
app.use("/", express.static(path.join(process.cwd(), "public")));

// Auth
app.post("/auth/login", loginHandler);

// Admin: publish model
app.post("/admin/publish", verifyToken, (req, res) => {
  const user = (req as any).user;
  if (!user || user.role !== "Admin")
    return res.status(403).json({ error: "Only Admin can publish" });
  const model = req.body as ModelDef;
  if (!model || !model.name)
    return res.status(400).json({ error: "Invalid model" });
  // default table
  if (!model.table) model.table = model.name.toLowerCase() + "s";
  saveModel(model);
  // register routes dynamically
  registerModelRoutes(app, model);
  res.json({ ok: true, model });
});

// list models
app.get("/models", (req, res) => {
  res.json(listModels());
});

// get model
app.get("/models/:name", (req, res) => {
  const m = loadModel(req.params.name);
  if (!m) return res.status(404).json({ error: "Not found" });
  res.json(m);
});

// on startup, auto-register existing models
const models = listModels();
models.forEach((m) => registerModelRoutes(app, m));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
