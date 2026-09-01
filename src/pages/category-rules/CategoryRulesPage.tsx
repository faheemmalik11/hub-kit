import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Combobox } from "../../ui/combobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { ErrorState, TableSkeleton, readableErrorMessage } from "../../components/feedback/query-states";
import { cn } from "../../lib/class-names";
import type {
  AssignmentRuleRow,
  BwaBlock,
  CategoryDirection,
  CategoryRecord,
  CategoryRulesAdapter,
  NewAssignmentRule,
  NewCategory,
} from "../../adapters/category-rules";
import { englishCategoryRulesLabels, type CategoryRulesLabels } from "./labels";

const NONE = "__none";
const BWA_BLOCKS: BwaBlock[] = ["revenue", "cost_of_goods", "costs", "neutral", "taxes", "special_case"];

export interface CategoryRulesPageProps {
  adapter: CategoryRulesAdapter;
  labels?: CategoryRulesLabels;
}

export function CategoryRulesPage({ adapter, labels = englishCategoryRulesLabels }: CategoryRulesPageProps) {
  const [tab, setTab] = useState("categories");

  return (
    <div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{labels.title}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{labels.subtitle}</p>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="categories">{labels.tabCategories}</TabsTrigger>
          <TabsTrigger value="rules">{labels.tabRules}</TabsTrigger>
        </TabsList>
        <TabsContent value="categories" className="mt-4">
          <CategoriesTab adapter={adapter} labels={labels} />
        </TabsContent>
        <TabsContent value="rules" className="mt-4">
          <RulesTab adapter={adapter} labels={labels} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CategoriesTab({ adapter, labels }: { adapter: CategoryRulesAdapter; labels: CategoryRulesLabels }) {
  const categoriesQuery = adapter.useCategories();
  const [dialogState, setDialogState] = useState<"new" | CategoryRecord | null>(null);

  const sorted = useMemo(() => [...categoriesQuery.data].sort((a, b) => a.sortOrder - b.sortOrder), [categoriesQuery.data]);
  const byId = useMemo(() => new Map(sorted.map((c) => [c.id, c])), [sorted]);

  async function archive(category: CategoryRecord) {
    try {
      await adapter.archiveCategory(category.id);
      toast.success(labels.archivedToast);
    } catch (error) {
      toast.error(readableErrorMessage(error, ""));
    }
  }

  async function move(category: CategoryRecord, direction: "up" | "down") {
    try {
      await adapter.moveCategory(category.id, direction);
    } catch (error) {
      toast.error(readableErrorMessage(error, ""));
    }
  }

  return (
    <div>
      <div className="flex justify-end">
        <Button size="sm" className="gap-2" onClick={() => setDialogState("new")}>
          <Plus className="size-4" /> {labels.newCategoryButton}
        </Button>
      </div>

      {categoriesQuery.error ? (
        <div className="mt-4">
          <ErrorState error={categoriesQuery.error} onRetry={() => {}} />
        </div>
      ) : categoriesQuery.loading ? (
        <div className="mt-4">
          <TableSkeleton rows={8} columns={5} />
        </div>
      ) : (
        <div className="mt-4 overflow-hidden overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>{labels.columnCode}</TableHead>
                <TableHead>{labels.columnName}</TableHead>
                <TableHead>{labels.columnBlock}</TableHead>
                <TableHead>{labels.columnDirection}</TableHead>
                <TableHead className="w-[140px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((category) => {
                const parent = category.parentId ? byId.get(category.parentId) : null;
                return (
                  <TableRow key={category.id} className={cn(!category.isActive && "opacity-60")}>
                    <TableCell className="font-mono text-sm text-muted-foreground">{category.code}</TableCell>
                    <TableCell className="font-medium text-foreground">
                      {parent && <span className="text-muted-foreground">{parent.name} › </span>}
                      {category.name}
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {category.isCatchall && <Badge tone="muted">{labels.catchallBadge}</Badge>}
                        {category.isExcludedFromPnl && <Badge tone="muted">{labels.excludedBadge}</Badge>}
                        {!category.isActive && <Badge tone="muted">{labels.inactiveBadge}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{labels.block[category.bwaBlock]}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{category.direction === "incoming" ? labels.directionIncoming : labels.directionOutgoing}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <button type="button" title={labels.moveUp} className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => move(category, "up")}>
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button type="button" title={labels.moveDown} className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => move(category, "down")}>
                          <ArrowDown className="size-3.5" />
                        </button>
                        <button type="button" title={labels.editButton} className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setDialogState(category)}>
                          <Pencil className="size-3.5" />
                        </button>
                        <button type="button" title={labels.archiveButton} className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => archive(category)}>
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    {labels.emptyCategories}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {dialogState && (
        <CategoryDialog
          category={dialogState === "new" ? null : dialogState}
          categories={sorted}
          adapter={adapter}
          labels={labels}
          onClose={() => setDialogState(null)}
        />
      )}
    </div>
  );
}

function Badge({ tone, children }: { tone: "muted"; children: ReactNode }) {
  void tone;
  return <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">{children}</span>;
}

function CategoryDialog({
  category,
  categories,
  adapter,
  labels,
  onClose,
}: {
  category: CategoryRecord | null;
  categories: CategoryRecord[];
  adapter: CategoryRulesAdapter;
  labels: CategoryRulesLabels;
  onClose: () => void;
}) {
  const [code, setCode] = useState(category?.code ?? "");
  const [name, setName] = useState(category?.name ?? "");
  const [parentId, setParentId] = useState(category?.parentId ?? NONE);
  const [bwaBlock, setBwaBlock] = useState<BwaBlock>(category?.bwaBlock ?? "costs");
  const [bwaLine, setBwaLine] = useState(category?.bwaLine ?? "");
  const [direction, setDirection] = useState<CategoryDirection>(category?.direction ?? "incoming");
  const [note, setNote] = useState(category?.note ?? "");
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    if (!code.trim() || !name.trim() || !bwaLine.trim()) return;
    const input: NewCategory = {
      code: code.trim(),
      name: name.trim(),
      parentId: parentId === NONE ? null : parentId,
      bwaBlock,
      bwaLine: bwaLine.trim(),
      direction,
      note: note.trim() || null,
    };
    setIsSaving(true);
    try {
      if (category) await adapter.updateCategory(category.id, input);
      else await adapter.createCategory(input);
      toast.success(labels.savedToast);
      onClose();
    } catch (e) {
      toast.error(labels.saveFailed(readableErrorMessage(e, "")));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? labels.editCategoryTitle : labels.newCategoryTitle}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{labels.fieldCode}</Label>
              <Input value={code} onChange={(event) => setCode(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{labels.fieldName}</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{labels.fieldParent}</Label>
            <Combobox
              value={parentId}
              onValueChange={setParentId}
              options={[{ value: NONE, label: labels.parentNone }, ...categories.filter((c) => c.id !== category?.id).map((c) => ({ value: c.id, label: c.name }))]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{labels.fieldBlock}</Label>
              <Combobox value={bwaBlock} onValueChange={(v) => setBwaBlock(v as BwaBlock)} options={BWA_BLOCKS.map((b) => ({ value: b, label: labels.block[b] }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{labels.fieldDirection}</Label>
              <Combobox
                value={direction}
                onValueChange={(v) => setDirection(v as CategoryDirection)}
                options={[
                  { value: "incoming", label: labels.directionIncoming },
                  { value: "outgoing", label: labels.directionOutgoing },
                ]}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{labels.fieldLine}</Label>
            <Input value={bwaLine} onChange={(event) => setBwaLine(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{labels.fieldNote}</Label>
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {labels.cancel}
          </Button>
          <Button onClick={save} disabled={isSaving || !code.trim() || !name.trim() || !bwaLine.trim()}>
            {isSaving ? labels.saving : labels.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RulesTab({ adapter, labels }: { adapter: CategoryRulesAdapter; labels: CategoryRulesLabels }) {
  const rulesQuery = adapter.useRules();
  const [newRuleOpen, setNewRuleOpen] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-end gap-4">
        <Button size="sm" className="gap-2" onClick={() => setNewRuleOpen(true)}>
          <Plus className="size-4" /> {labels.newRuleButton}
        </Button>
      </div>

      <p className="mt-4 max-w-3xl rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">{labels.rulesHint}</p>

      {rulesQuery.error ? (
        <div className="mt-6">
          <ErrorState error={rulesQuery.error} onRetry={() => {}} />
        </div>
      ) : rulesQuery.loading ? (
        <div className="mt-6">
          <TableSkeleton rows={6} columns={4} />
        </div>
      ) : rulesQuery.data.length === 0 ? (
        <div className="mt-6 rounded-xl border border-border bg-card px-4 py-12 text-center">
          <p className="text-sm font-medium text-foreground">{labels.emptyRules}</p>
          <p className="mt-1 text-xs text-muted-foreground">{labels.emptyRulesHint}</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableBody>
              {rulesQuery.data.map((rule) => (
                <RuleRow key={rule.id} rule={rule} adapter={adapter} labels={labels} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {newRuleOpen && <RuleDialog adapter={adapter} labels={labels} onClose={() => setNewRuleOpen(false)} />}
    </div>
  );
}

function RuleRow({ rule, adapter, labels }: { rule: AssignmentRuleRow; adapter: CategoryRulesAdapter; labels: CategoryRulesLabels }) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function toggleActive(active: boolean) {
    try {
      await adapter.setRuleActive(rule.id, active);
    } catch (error) {
      toast.error(readableErrorMessage(error, ""));
    }
  }

  async function confirmDelete() {
    try {
      await adapter.deleteRule(rule.id);
      toast.success(labels.deletedToast);
      setDeleteOpen(false);
    } catch (error) {
      toast.error(readableErrorMessage(error, ""));
    }
  }

  return (
    <TableRow className={cn(!rule.isActive && "opacity-60")}>
      <TableCell className="font-medium text-foreground">{rule.categoryLabel}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1.5">
          {rule.scopeChips.map((chip, i) => (
            <span key={i} className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
              {chip.label}: {chip.value}
            </span>
          ))}
        </div>
      </TableCell>
      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{rule.note ?? "—"}</TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => toggleActive(!rule.isActive)} className="text-xs font-medium text-muted-foreground hover:text-foreground">
            {rule.isActive ? labels.deactivateButton : labels.activateButton}
          </button>
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogTrigger asChild>
              <button type="button" title={labels.deleteButton} className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="size-3.5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{labels.deleteDialogTitle}</AlertDialogTitle>
                <AlertDialogDescription>{labels.deleteDialogDescription}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{labels.deleteCancel}</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {labels.deleteConfirm}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

function RuleDialog({ adapter, labels, onClose }: { adapter: CategoryRulesAdapter; labels: CategoryRulesLabels; onClose: () => void }) {
  const categoryOptionsQuery = adapter.useCategoryOptions();
  const supplierOptionsQuery = adapter.useSupplierOptions();
  const propertyOptionsQuery = adapter.usePropertyOptions();
  const companyOptionsQuery = adapter.useCompanyOptions();

  const [categoryId, setCategoryId] = useState("");
  const [supplierId, setSupplierId] = useState(NONE);
  const [propertyId, setPropertyId] = useState(NONE);
  const [companyId, setCompanyId] = useState(NONE);
  const [referencePattern, setReferencePattern] = useState("");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    if (!categoryId) return;
    const input: NewAssignmentRule = {
      categoryId,
      supplierId: supplierId === NONE ? null : supplierId,
      propertyId: propertyId === NONE ? null : propertyId,
      companyId: companyId === NONE ? null : companyId,
      referencePattern: referencePattern.trim() || null,
      note: note.trim() || null,
    };
    setIsSaving(true);
    try {
      await adapter.createRule(input);
      toast.success(labels.ruleCreated);
      onClose();
    } catch (e) {
      toast.error(labels.saveFailed(readableErrorMessage(e, "")));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{labels.newRuleTitle}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{labels.fieldCategory}</Label>
            <Combobox value={categoryId} onValueChange={setCategoryId} options={categoryOptionsQuery.data.map((c) => ({ value: c.id, label: c.label }))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{labels.fieldSupplier}</Label>
            <Combobox value={supplierId} onValueChange={setSupplierId} options={[{ value: NONE, label: labels.supplierAny }, ...supplierOptionsQuery.data.map((s) => ({ value: s.id, label: s.name }))]} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{labels.fieldProperty}</Label>
            <Combobox
              value={propertyId}
              onValueChange={setPropertyId}
              options={[{ value: NONE, label: labels.propertyAny }, ...propertyOptionsQuery.data.map((p) => ({ value: p.id, label: p.name ? `${p.code} · ${p.name}` : p.code }))]}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{labels.fieldCompany}</Label>
            <Combobox value={companyId} onValueChange={setCompanyId} options={[{ value: NONE, label: labels.companyAny }, ...companyOptionsQuery.data.map((c) => ({ value: c.id, label: `${c.code} · ${c.name}` }))]} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{labels.fieldReferencePattern}</Label>
            <Input value={referencePattern} onChange={(event) => setReferencePattern(event.target.value)} placeholder={labels.fieldReferencePatternPlaceholder} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{labels.fieldNote}</Label>
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {labels.cancel}
          </Button>
          <Button onClick={save} disabled={isSaving || !categoryId}>
            {isSaving ? labels.saving : labels.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
