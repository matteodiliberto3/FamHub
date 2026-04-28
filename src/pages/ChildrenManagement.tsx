// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { UserRoundPlus, Search, Link2, Mail, Users } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/AuthContext';
import {
  createChildProfile,
  linkAccountToChild,
  listAccountsAsync,
  listChildrenByFamilyAsync,
  searchAccountsByEmailAsync,
} from '@/lib/onboarding-store';

export default function ChildrenManagement() {
  const { familyProfile } = useAuth();
  const [newChildName, setNewChildName] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
  const [selectedChildId, setSelectedChildId] = useState('');
  const [children, setChildren] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  const isParent = familyProfile?.role === 'parent';
  const familyId = familyProfile?.familyId;
  useEffect(() => {
    let isMounted = true;
    if (!familyId) {
      setChildren([]);
      return undefined;
    }

    const loadChildren = async () => {
      try {
        const rows = await listChildrenByFamilyAsync(familyId);
        if (isMounted) setChildren(rows);
      } catch (error) {
        console.error('Cannot load children:', error);
      }
    };
    loadChildren();
    return () => {
      isMounted = false;
    };
  }, [familyId]);

  useEffect(() => {
    let isMounted = true;
    const loadAccounts = async () => {
      try {
        const rows = await listAccountsAsync();
        if (isMounted) setAccounts(rows);
      } catch (error) {
        console.error('Cannot load accounts:', error);
      }
    };
    loadAccounts();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadSearch = async () => {
      try {
        const rows = await searchAccountsByEmailAsync(accountSearch);
        if (isMounted) setSearchResults(rows);
      } catch (error) {
        console.error('Cannot search accounts:', error);
      }
    };
    loadSearch();
    return () => {
      isMounted = false;
    };
  }, [accountSearch]);

  const accountsIndex = useMemo(() => {
    const map = new Map();
    accounts.forEach((acc) => map.set(acc.accountId, acc));
    return map;
  }, [accounts]);

  const handleAddChild = async () => {
    if (!familyId || !newChildName.trim()) return;
    await createChildProfile({ familyId, name: newChildName });
    const refreshed = await listChildrenByFamilyAsync(familyId);
    setChildren(refreshed);
    setNewChildName('');
  };

  const handleLinkAccount = async (accountId) => {
    if (!selectedChildId) return;
    await linkAccountToChild({ childId: selectedChildId, accountId });
    if (!familyId) return;
    const refreshed = await listChildrenByFamilyAsync(familyId);
    setChildren(refreshed);
  };

  if (!isParent) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Gestione Figli"
          subtitle="Solo i genitori possono gestire e collegare gli account dei figli."
        />
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            Se sei un figlio, questa sezione non e disponibile per il tuo profilo.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gestione Figli"
        subtitle="Aggiungi i figli, cerca gli account nel database e collega piu accessi allo stesso profilo."
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="p-5 xl:col-span-1">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <UserRoundPlus className="w-4 h-4 text-primary" />
            Nuovo figlio
          </h2>
          <div className="space-y-3">
            <Input
              placeholder="Nome figlio"
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
            />
            <Button onClick={handleAddChild} className="w-full">
              Aggiungi figlio
            </Button>
          </div>
        </Card>

        <Card className="p-5 xl:col-span-2">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Figli in famiglia
          </h2>
          {children.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun figlio registrato.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`text-left rounded-xl border p-4 transition-colors ${
                    selectedChildId === child.id ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <p className="font-medium">{child.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {child.linkedAccountIds?.length || 0} account collegati
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(child.linkedAccountIds || []).slice(0, 2).map((accountId) => {
                      const account = accountsIndex.get(accountId);
                      return (
                        <Badge key={accountId} variant="secondary" className="text-[11px]">
                          {account?.email || accountId}
                        </Badge>
                      );
                    })}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          Cerca account per email
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            className="md:col-span-2"
            placeholder="Es. figlio@gmail.com"
            value={accountSearch}
            onChange={(e) => setAccountSearch(e.target.value)}
          />
          <Input
            disabled
            value={
              selectedChildId
                ? children.find((c) => c.id === selectedChildId)?.name || ''
                : ''
            }
            placeholder="Seleziona prima un figlio"
          />
        </div>

        <div className="mt-4 space-y-2">
          {searchResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nessun account trovato con questa email.
            </p>
          ) : (
            searchResults.map((account) => (
              <div
                key={account.accountId}
                className="rounded-xl border border-border p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{account.displayName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3" />
                    {account.email}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!selectedChildId}
                  onClick={() => handleLinkAccount(account.accountId)}
                >
                  <Link2 className="w-3.5 h-3.5 mr-1" />
                  Collega
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

