const FAMILIES_KEY = "dilihub-families";
const PROFILES_KEY = "dilihub-user-profiles";
const CHILDREN_KEY = "dilihub-children";
const ACCOUNTS_KEY = "dilihub-accounts";

function readJson(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function listFamilies() {
  return readJson(FAMILIES_KEY, []);
}

export function saveFamilies(families) {
  writeJson(FAMILIES_KEY, families);
}

export function getProfile(userId) {
  const profiles = readJson(PROFILES_KEY, {});
  return profiles[userId] ?? null;
}

export function saveProfile(userId, profile) {
  const profiles = readJson(PROFILES_KEY, {});
  profiles[userId] = profile;
  writeJson(PROFILES_KEY, profiles);
  return profile;
}

export function upsertFamily({
  familyName,
  role,
  currentUserName,
  spouseName,
  childrenNames,
}) {
  const families = listFamilies();
  const normalizedName = familyName.trim().toLowerCase();
  const existing = families.find(
    (f) => f.name.trim().toLowerCase() === normalizedName,
  );

  const cleanChildren = (childrenNames || [])
    .map((name) => name.trim())
    .filter(Boolean);

  if (existing) {
    if (role === "parent") {
      const nextParents = new Set(existing.members.parents || []);
      if (currentUserName) nextParents.add(currentUserName);
      if (spouseName) nextParents.add(spouseName);
      const nextChildren = new Set(existing.members.children || []);
      cleanChildren.forEach((child) => nextChildren.add(child));
      existing.members = {
        parents: Array.from(nextParents),
        children: Array.from(nextChildren),
      };
    }
    saveFamilies(families);
    return existing;
  }

  const newFamily = {
    id: crypto.randomUUID(),
    name: familyName.trim(),
    createdDate: new Date().toISOString(),
    members: {
      parents:
        role === "parent"
          ? [currentUserName, spouseName].filter(Boolean)
          : [],
      children: role === "parent" ? cleanChildren : [],
    },
  };

  saveFamilies([newFamily, ...families]);
  return newFamily;
}

export function listChildren() {
  return readJson(CHILDREN_KEY, []);
}

export function listChildrenByFamily(familyId) {
  return listChildren().filter((child) => child.familyId === familyId);
}

export function createChildProfile({ familyId, name }) {
  const children = listChildren();
  const normalized = name.trim().toLowerCase();
  const existing = children.find(
    (child) =>
      child.familyId === familyId && child.name.trim().toLowerCase() === normalized,
  );
  if (existing) return existing;

  const child = {
    id: crypto.randomUUID(),
    familyId,
    name: name.trim(),
    linkedAccountIds: [],
    createdDate: new Date().toISOString(),
  };
  writeJson(CHILDREN_KEY, [child, ...children]);
  return child;
}

export function listAccounts() {
  return readJson(ACCOUNTS_KEY, []);
}

export function registerLoginAccount({
  accountId,
  email,
  displayName,
  provider = "google",
}) {
  const accounts = listAccounts();
  const existing = accounts.find((acc) => acc.accountId === accountId);
  const payload = {
    accountId,
    email: email?.trim().toLowerCase() || `${accountId}@local.dilihub.app`,
    displayName: displayName || "Utente",
    provider,
    lastSeenAt: new Date().toISOString(),
  };

  if (existing) {
    Object.assign(existing, payload);
    writeJson(ACCOUNTS_KEY, accounts);
    return existing;
  }

  writeJson(ACCOUNTS_KEY, [payload, ...accounts]);
  return payload;
}

export function searchAccountsByEmail(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return listAccounts()
    .filter((acc) => acc.email.includes(q))
    .slice(0, 20);
}

export function linkAccountToChild({ childId, accountId }) {
  const children = listChildren();
  const child = children.find((c) => c.id === childId);
  if (!child) return null;
  const next = new Set(child.linkedAccountIds || []);
  next.add(accountId);
  child.linkedAccountIds = Array.from(next);
  writeJson(CHILDREN_KEY, children);
  return child;
}
