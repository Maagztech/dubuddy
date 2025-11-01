import pkg from "@prisma/client";

// Some environments or generated clients can lead to editor/type mismatches
// with named exports; use a safe fallback and cast to any to avoid TS complaints
const PrismaClientCtor: any =
  (pkg as any).PrismaClient ||
  (pkg as any).default?.PrismaClient ||
  (pkg as any).default ||
  (pkg as any);

const prisma = new PrismaClientCtor();
export default prisma;
