// @ts-nocheck
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const FAMILIES_KEY = 'dilihub-families';
const PROFILES_KEY = 'dilihub-user-profiles';
const CHILDREN_KEY = 'dilihub-children';
const ACCOUNTS_KEY = 'dilihub-accounts';

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

export async function getProfileAsync(userId) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('app_users')
      .select('role,family_id,display_name')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      onboardingCompleted: Boolean(data.family_id),
      role: data.role || null,
      familyId: data.family_id || null,
      displayName: data.display_name || null,
    };
  }
  return getProfile(userId);
}

export async function saveProfileAsync(userId, profile, options = {}) {
  if (isSupabaseConfigured && supabase) {
    const normalizedEmail =
      options.email?.trim().toLowerCase() || `${userId}@local.dilihub.app`;
    const payload = {
      id: userId,
      email: normalizedEmail,
      provider: options.provider || 'google',
      role: profile.role || 'child',
      family_id: profile.familyId || null,
      display_name: profile.displayName || 'Utente',
      last_seen_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('app_users').upsert(payload);
    if (error) throw error;
  }
  return saveProfile(userId, profile);
}

function toUiFamily(family, parentsCount = 0, childrenCount = 0) {
  return {
    id: family.id,
    name: family.name,
    createdDate: family.created_at || new Date().toISOString(),
    members: {
      parents: Array.from({ length: parentsCount }, (_, i) => `parent-${i}`),
      children: Array.from({ length: childrenCount }, (_, i) => `child-${i}`),
    },
  };
}

async function listFamiliesFromSupabase() {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data: families, error } = await supabase
    .from('families')
    .select('id,name,created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const familyIds = (families || []).map((f) => f.id);
  if (familyIds.length === 0) return [];

  const [{ data: users, error: usersError }, { data: children, error: childrenError }] = await Promise.all([
    supabase.from('app_users').select('family_id,role').in('family_id', familyIds),
    supabase.from('child_profiles').select('family_id').in('family_id', familyIds),
  ]);
  if (usersError) throw usersError;
  if (childrenError) throw childrenError;

  const parentCounts = {};
  (users || []).forEach((u) => {
    if (u.family_id && u.role === 'parent') {
      parentCounts[u.family_id] = (parentCounts[u.family_id] || 0) + 1;
    }
  });

  const childCounts = {};
  (children || []).forEach((c) => {
    if (c.family_id) {
      childCounts[c.family_id] = (childCounts[c.family_id] || 0) + 1;
    }
  });

  return families.map((f) => toUiFamily(f, parentCounts[f.id] || 0, childCounts[f.id] || 0));
}

export async function listFamiliesAsync() {
  try {
    const remoteFamilies = await listFamiliesFromSupabase();
    if (remoteFamilies) return remoteFamilies;
  } catch (error) {
    console.error('listFamiliesAsync fallback to local:', error);
  }
  return listFamilies();
}

export async function upsertFamily({
  familyName,
  role,
  currentUserName,
  spouseName,
  childrenNames,
  currentUserId,
  currentUserEmail,
  currentUserProvider = 'google',
}) {
  if (isSupabaseConfigured && supabase) {
    const normalizedName = familyName.trim().toLowerCase();
    const { data: existingFamilies, error: findError } = await supabase
      .from('families')
      .select('id,name,created_at')
      .ilike('name', familyName.trim());

    // During first onboarding, policies might temporarily block listing families.
    // We keep onboarding flowing by treating this as "no visible families".
    if (findError && findError.code !== '42501') throw findError;

    let family = (existingFamilies || []).find((f) => f.name.trim().toLowerCase() === normalizedName) || null;

    if (!family) {
      const newFamilyId = crypto.randomUUID();
      const { error: createError } = await supabase
        .from('families')
        .insert({ id: newFamilyId, name: familyName.trim() });
      if (createError) throw createError;
      family = {
        id: newFamilyId,
        name: familyName.trim(),
        created_at: new Date().toISOString(),
      };
    }

    const { error: userError } = await supabase.from('app_users').upsert({
      id: currentUserId,
      email: (currentUserEmail || `${currentUserId}@local.dilihub.app`).trim().toLowerCase(),
      display_name: currentUserName || 'Utente',
      provider: currentUserProvider,
      role,
      family_id: family.id,
      last_seen_at: new Date().toISOString(),
    });
    if (userError) throw userError;

    // NOTE: We do not create placeholder spouse rows in app_users.
    // app_users is self-owned by authenticated identity and RLS forbids creating other users.

    const cleanChildren = (childrenNames || []).map((v) => v.trim()).filter(Boolean);
    if (role === 'parent' && cleanChildren.length > 0) {
      for (const childName of cleanChildren) {
        await createChildProfile({ familyId: family.id, name: childName });
      }
    }

    const refreshed = await listFamiliesFromSupabase();
    if (refreshed) saveFamilies(refreshed);
    return toUiFamily(family);
  }

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

export async function listChildrenByFamilyAsync(familyId) {
  if (isSupabaseConfigured && supabase) {
    const { data: children, error } = await supabase
      .from('child_profiles')
      .select('id,name,family_id,created_at,child_account_links(user_id)')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (children || []).map((child) => ({
      id: child.id,
      familyId: child.family_id,
      name: child.name,
      linkedAccountIds: (child.child_account_links || []).map((l) => l.user_id),
      createdDate: child.created_at,
    }));
  }
  return listChildrenByFamily(familyId);
}

export async function createChildProfile({ familyId, name }) {
  if (isSupabaseConfigured && supabase) {
    const trimmed = name.trim();
    const { data: existing, error: existingError } = await supabase
      .from('child_profiles')
      .select('id,name,family_id,created_at')
      .eq('family_id', familyId)
      .ilike('name', trimmed);
    if (existingError) throw existingError;
    const exact = (existing || []).find((c) => c.name.trim().toLowerCase() === trimmed.toLowerCase());
    if (exact) {
      return {
        id: exact.id,
        familyId: exact.family_id,
        name: exact.name,
        linkedAccountIds: [],
        createdDate: exact.created_at,
      };
    }

    const { data: created, error } = await supabase
      .from('child_profiles')
      .insert({ family_id: familyId, name: trimmed })
      .select('id,name,family_id,created_at')
      .single();
    if (error) throw error;
    return {
      id: created.id,
      familyId: created.family_id,
      name: created.name,
      linkedAccountIds: [],
      createdDate: created.created_at,
    };
  }

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

export async function listAccountsAsync() {
  if (isSupabaseConfigured && supabase) {
    let data = null;
    let error = null;
    const rpcResult = await supabase.rpc('get_my_family_member_accounts', { search_query: '' });
    data = rpcResult.data;
    error = rpcResult.error;
    if (error) {
      const fallback = await supabase
        .from('app_users')
        .select('id,email,display_name,provider,last_seen_at')
        .order('last_seen_at', { ascending: false });
      data = fallback.data;
      error = fallback.error;
    }
    if (error) throw error;
    const mapped = (data || []).map((acc) => ({
      accountId: acc.id,
      email: acc.email,
      displayName: acc.display_name,
      provider: acc.provider,
      lastSeenAt: acc.last_seen_at,
    }));
    writeJson(ACCOUNTS_KEY, mapped);
    return mapped;
  }
  return listAccounts();
}

export async function registerLoginAccount({
  accountId,
  email,
  displayName,
  provider = 'google',
}) {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('app_users').upsert({
      id: accountId,
      email: email?.trim().toLowerCase() || `${accountId}@local.dilihub.app`,
      display_name: displayName || 'Utente',
      provider,
      last_seen_at: new Date().toISOString(),
    });
    if (error) throw error;
  }

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

export async function searchAccountsByEmailAsync(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  if (isSupabaseConfigured && supabase) {
    let data = null;
    let error = null;
    const rpcResult = await supabase.rpc('get_my_family_member_accounts', { search_query: q });
    data = rpcResult.data;
    error = rpcResult.error;
    if (error) {
      const fallback = await supabase
        .from('app_users')
        .select('id,email,display_name,provider,last_seen_at')
        .ilike('email', `%${q}%`)
        .limit(20);
      data = fallback.data;
      error = fallback.error;
    }
    if (error) throw error;
    return (data || []).map((acc) => ({
      accountId: acc.id,
      email: acc.email,
      displayName: acc.display_name,
      provider: acc.provider,
      lastSeenAt: acc.last_seen_at,
    }));
  }
  return searchAccountsByEmail(query);
}

export async function linkAccountToChild({ childId, accountId }) {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.rpc('link_account_to_child_secure', {
      child_profile_id: childId,
      user_account_id: accountId,
    });
    if (error) throw error;
    return { id: childId };
  }

  const children = listChildren();
  const child = children.find((c) => c.id === childId);
  if (!child) return null;
  const next = new Set(child.linkedAccountIds || []);
  next.add(accountId);
  child.linkedAccountIds = Array.from(next);
  writeJson(CHILDREN_KEY, children);
  return child;
}

