import fs from 'fs';
import path from 'path';

const MODELS_DIR = path.join(process.cwd(), 'models');
const DATA_DIR = path.join(process.cwd(), 'data');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDir(MODELS_DIR);
ensureDir(DATA_DIR);

export type FieldDef = {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'relation';
  required?: boolean;
  default?: any;
  unique?: boolean;
  relation?: { model: string; field: string };
};

export type ModelDef = {
  name: string;
  table?: string;
  fields: FieldDef[];
  ownerField?: string;
  rbac?: Record<string, string[]>; // role -> permissions
};

export function saveModel(model: ModelDef) {
  ensureDir(MODELS_DIR);
  const file = path.join(MODELS_DIR, `${model.name}.json`);
  fs.writeFileSync(file, JSON.stringify(model, null, 2), 'utf-8');
}

export function listModels(): ModelDef[] {
  ensureDir(MODELS_DIR);
  const files = fs.readdirSync(MODELS_DIR).filter((f) => f.endsWith('.json'));
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(MODELS_DIR, f), 'utf-8')));
}

export function loadModel(name: string): ModelDef | null {
  const file = path.join(MODELS_DIR, `${name}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

// Data storage per table as a simple JSON array
export function dataFileFor(table: string) {
  ensureDir(DATA_DIR);
  return path.join(DATA_DIR, `${table}.json`);
}

export function readData(table: string) {
  const file = dataFileFor(table);
  if (!fs.existsSync(file)) return [] as any[];
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as any[];
}

export function writeData(table: string, rows: any[]) {
  const file = dataFileFor(table);
  fs.writeFileSync(file, JSON.stringify(rows, null, 2), 'utf-8');
}
