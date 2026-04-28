// @ts-nocheck
const STORAGE_KEY = "base44-local-db";
const AUTH_STORAGE_KEY = "base44-local-auth-user";

const initialDb = {
  Transaction: [],
  PermissionRequest: [],
  FamilyEvent: [],
  BudgetRequest: [],
  ShoppingList: [],
};

function readDb() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...initialDb };
  try {
    return { ...initialDb, ...JSON.parse(raw) };
  } catch {
    return { ...initialDb };
  }
}

function writeDb(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function sortByField(items, sortExpr) {
  if (!sortExpr) return items;
  const desc = sortExpr.startsWith("-");
  const field = desc ? sortExpr.slice(1) : sortExpr;
  return [...items].sort((a, b) => {
    const av = a[field] ?? "";
    const bv = b[field] ?? "";
    if (av < bv) return desc ? 1 : -1;
    if (av > bv) return desc ? -1 : 1;
    return 0;
  });
}

function createEntityApi(entityName) {
  return {
    async list(sortExpr, limit = 50) {
      const db = readDb();
      return sortByField(db[entityName], sortExpr).slice(0, limit);
    },
    async create(data) {
      const db = readDb();
      const record = {
        id: crypto.randomUUID(),
        created_date: new Date().toISOString(),
        ...data,
      };
      db[entityName] = [record, ...(db[entityName] || [])];
      writeDb(db);
      return record;
    },
    async update(id, data) {
      const db = readDb();
      db[entityName] = (db[entityName] || []).map((item) =>
        item.id === id ? { ...item, ...data } : item,
      );
      writeDb(db);
      return db[entityName].find((item) => item.id === id);
    },
    async delete(id) {
      const db = readDb();
      db[entityName] = (db[entityName] || []).filter((item) => item.id !== id);
      writeDb(db);
      return { success: true };
    },
  };
}

function readAuthUser() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeAuthUser(user) {
  if (!user) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export const base44 = {
  auth: {
    async me() {
      const user = readAuthUser();
      if (user) return user;
      // Keep local project usable without remote auth.
      const defaultUser = {
        id: "local-user",
        role: "admin",
        name: "Local User",
        email: "local-user@dilihub.app",
        provider: "google",
      };
      writeAuthUser(defaultUser);
      return defaultUser;
    },
    logout(redirectUrl) {
      writeAuthUser(null);
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    },
    redirectToLogin(returnUrl) {
      // Independent local app: no external login provider.
      // We keep users in-app and restore a default local session.
      writeAuthUser({
        id: "local-user",
        role: "admin",
        name: "Local User",
        email: "local-user@dilihub.app",
        provider: "google",
      });
      if (returnUrl) {
        window.location.href = returnUrl;
      }
    },
  },
  entities: {
    Transaction: createEntityApi("Transaction"),
    PermissionRequest: createEntityApi("PermissionRequest"),
    FamilyEvent: createEntityApi("FamilyEvent"),
    BudgetRequest: createEntityApi("BudgetRequest"),
    ShoppingList: createEntityApi("ShoppingList"),
  },
};

