import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Home, Search, Users, UserRoundPlus, Baby, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const stepTransition = {
  duration: 0.28,
  ease: [0.23, 1, 0.32, 1],
};

const stepVariants = {
  enter: { opacity: 0, x: 24, scale: 0.985 },
  center: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -20, scale: 0.985 },
};

function StepContainer({ stepKey, children }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        variants={stepVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={stepTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function Onboarding({
  currentUser,
  families,
  onComplete,
}) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [familyQuery, setFamilyQuery] = useState("");
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [spouseName, setSpouseName] = useState("");
  const [childrenNames, setChildrenNames] = useState([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredFamilies = useMemo(() => {
    const q = familyQuery.trim().toLowerCase();
    if (!q) return families.slice(0, 8);
    return families
      .filter((family) => family.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [families, familyQuery]);

  const exactFamilyMatch = useMemo(() => {
    const q = familyQuery.trim().toLowerCase();
    if (!q) return null;
    return families.find((f) => f.name.trim().toLowerCase() === q) ?? null;
  }, [families, familyQuery]);

  const canCreateFamily = role === "parent" && familyQuery.trim().length >= 3 && !exactFamilyMatch;
  const canJoinExistingFamily = role === "child" && !!exactFamilyMatch;
  const canGoToStep3 = !!selectedFamily || canCreateFamily || canJoinExistingFamily;

  const addChildField = () => setChildrenNames((prev) => [...prev, ""]);
  const removeChildField = (index) =>
    setChildrenNames((prev) => prev.filter((_, i) => i !== index));
  const updateChildField = (index, value) =>
    setChildrenNames((prev) => prev.map((name, i) => (i === index ? value : name)));

  const handleComplete = async () => {
    if (!role) return;
    const familyName = selectedFamily?.name || exactFamilyMatch?.name || familyQuery.trim();
    if (!familyName) return;
    setIsSubmitting(true);
    try {
      await onComplete({
        role,
        familyName,
        spouseName,
        childrenNames,
        displayName: currentUser?.name || "Utente",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-7 text-center">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-2">
            Configurazione iniziale
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Benvenuto su DILIHUB</h1>
          <p className="mt-2 text-muted-foreground">
            Ti facciamo entrare nella tua famiglia in pochi passaggi.
          </p>
        </div>

        <div className="mb-8 h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: "33%" }}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={stepTransition}
          />
        </div>

        <Card className="p-6 sm:p-8">
          <StepContainer stepKey={`step-${step}`}>
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">Sei un genitore o un figlio?</h2>
                  <p className="text-muted-foreground mt-2">
                    Questa scelta ci aiuta a personalizzare i permessi e il flusso.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    className={cn(
                      "rounded-2xl border p-5 text-left transition-[transform,border-color,background-color] duration-150 ease-out-strong hover:-translate-y-0.5 active:scale-[0.97]",
                      role === "parent"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40",
                    )}
                    onClick={() => setRole("parent")}
                  >
                    <Users className="w-5 h-5 mb-3 text-primary" />
                    <p className="font-semibold">Genitore</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Gestisco la famiglia e posso invitare altri membri.
                    </p>
                  </button>

                  <button
                    className={cn(
                      "rounded-2xl border p-5 text-left transition-[transform,border-color,background-color] duration-150 ease-out-strong hover:-translate-y-0.5 active:scale-[0.97]",
                      role === "child"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40",
                    )}
                    onClick={() => setRole("child")}
                  >
                    <Baby className="w-5 h-5 mb-3 text-primary" />
                    <p className="font-semibold">Figlio</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Partecipo alla famiglia con i permessi assegnati.
                    </p>
                  </button>
                </div>

                <div className="flex justify-end">
                  <Button disabled={!role} onClick={() => setStep(2)}>
                    Continua
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">Qual è la tua famiglia?</h2>
                  <p className="text-muted-foreground mt-2">
                    Cerca una famiglia esistente, oppure creala se sei un genitore.
                  </p>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-9 h-11"
                    placeholder="Es. Rossi, Bianchi, De Luca"
                    value={familyQuery}
                    onChange={(e) => {
                      setFamilyQuery(e.target.value);
                      setSelectedFamily(null);
                    }}
                  />
                </div>

                {filteredFamilies.length > 0 && (
                  <div className="space-y-2">
                    {filteredFamilies.map((family) => (
                      <button
                        key={family.id}
                        className={cn(
                          "w-full text-left rounded-xl border p-3 transition-[transform,background-color,border-color] duration-150 ease-out-strong active:scale-[0.99]",
                          selectedFamily?.id === family.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40",
                        )}
                        onClick={() => {
                          setSelectedFamily(family);
                          setFamilyQuery(family.name);
                        }}
                      >
                        <p className="font-medium">{family.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {family.members?.parents?.length || 0} genitori, {family.members?.children?.length || 0} figli
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {role === "child" && !exactFamilyMatch && familyQuery.trim().length > 0 && (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    Come figlio puoi solo entrare in una famiglia esistente.
                  </p>
                )}

                {canCreateFamily && (
                  <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    Nessuna famiglia trovata. Continuando, la creerai come genitore.
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Indietro
                  </Button>
                  <Button disabled={!canGoToStep3} onClick={() => setStep(role === "parent" ? 3 : 99)}>
                    {role === "parent" ? "Continua" : "Completa accesso"}
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">Aggiungi coniuge e figli</h2>
                  <p className="text-muted-foreground mt-2">
                    Puoi farlo ora o in seguito, ma è utile per iniziare con i permessi giusti.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome coniuge</label>
                  <Input
                    placeholder="Es. Sara Rossi"
                    value={spouseName}
                    onChange={(e) => setSpouseName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Figli</label>
                  {childrenNames.map((name, index) => (
                    <div key={`child-${index}`} className="flex gap-2">
                      <Input
                        placeholder={`Nome figlio ${index + 1}`}
                        value={name}
                        onChange={(e) => updateChildField(index, e.target.value)}
                      />
                      {childrenNames.length > 1 && (
                        <Button
                          variant="outline"
                          onClick={() => removeChildField(index)}
                        >
                          Rimuovi
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="secondary" onClick={addChildField}>
                    <UserRoundPlus className="w-4 h-4 mr-1" />
                    Aggiungi figlio
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Indietro
                  </Button>
                  <Button onClick={handleComplete} disabled={isSubmitting}>
                    <Check className="w-4 h-4 mr-1" />
                    {isSubmitting ? "Salvataggio..." : "Entra in DILIHUB"}
                  </Button>
                </div>
              </div>
            )}

            {step === 99 && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Home className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold">Pronto, ci siamo</h2>
                  <p className="text-muted-foreground mt-2">
                    Ti stiamo collegando alla tua famiglia su DILIHUB.
                  </p>
                </div>
                <div className="flex justify-center">
                  <Button onClick={handleComplete} disabled={isSubmitting}>
                    {isSubmitting ? "Salvataggio..." : "Vai alla dashboard"}
                  </Button>
                </div>
              </div>
            )}
          </StepContainer>
        </Card>
      </div>
    </div>
  );
}
