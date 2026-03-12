import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  LuChevronDown,
  LuChevronRight,
  LuEllipsis,
  LuPlus,
  LuPencil,
  LuTrash2,
} from 'react-icons/lu';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Modal } from '@/shared/components/Modal';
import { usePlanningYearSelection } from '@/shared/hooks/usePlanningYearSelection';
import { formatCurrency } from '@/shared/utils/currency';
import {
  formatDateOnly,
  getTodayDateOnly,
  parseDateOnly,
  toDateOnlyString,
} from '@/shared/utils/dateOnly';

import { incomeApiService } from '../services/incomeApiService';
import type {
  CreateIncomeOccurrenceInput,
  CreateRecurringIncomeVersionInput,
  IncomeOccurrence,
  IncomeYearProjection,
  ProjectedIncomeComponent,
  ProjectedIncomeSource,
  RecurringIncomeVersion,
} from '../types/income';
import { getComponentDisplayName } from '../types/income';

import { IncomeSummary } from './IncomeSummary';

interface AddSourceModalSubmit {
  sourceName: string;
  grossAmount: number;
  netAmount: number;
  periodsPerYear: number;
  startDate: string;
}

interface AddBonusModalSubmit {
  existingBonusComponentId: number | null;
  label: string;
  occurrence: CreateIncomeOccurrenceInput;
}

interface EditBonusModalSubmit {
  componentId: number;
  label: string;
  occurrence: CreateIncomeOccurrenceInput;
}

type ModalState =
  | { type: 'add-source' }
  | { type: 'rename-source'; source: ProjectedIncomeSource }
  | { type: 'add-version'; component: ProjectedIncomeComponent }
  | {
      type: 'edit-version';
      component: ProjectedIncomeComponent;
      version: RecurringIncomeVersion;
    }
  | { type: 'add-bonus'; source: ProjectedIncomeSource }
  | {
      type: 'edit-bonus';
      component: ProjectedIncomeComponent;
      occurrence: IncomeOccurrence;
    };

export interface IncomeViewHandle {
  openAddIncomeModal: () => void;
}

interface ActionMenuPosition {
  top: number;
  left: number;
}

const EMPTY_PROJECTION_TOTALS = {
  committedGross: 0,
  committedNet: 0,
  plannedGross: 0,
  plannedNet: 0,
  committedDeductions: {
    federalTax: 0,
    stateTax: 0,
    fica: 0,
    retirement: 0,
    healthInsurance: 0,
    other: 0,
    total: 0,
  },
  plannedDeductions: {
    federalTax: 0,
    stateTax: 0,
    fica: 0,
    retirement: 0,
    healthInsurance: 0,
    other: 0,
    total: 0,
  },
};

function isPositiveNumber(value: string): boolean {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'Present';
  }

  return formatDateOnly(value, 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatNetRangeSummary(component: ProjectedIncomeComponent): string {
  if (!component.currentVersion) {
    return formatCurrency(component.totals.plannedNet);
  }

  return `${formatCurrency(component.currentVersion.netAmount)} net x ${component.currentVersion.periodsPerYear}`;
}

function getSourceComposition(source: ProjectedIncomeSource): string {
  const labels = source.components.map((component) =>
    getComponentDisplayName(component),
  );

  return labels.length > 0 ? labels.join(' • ') : 'No components yet';
}

function getOccurrenceEventDate(occurrence: IncomeOccurrence): string {
  return occurrence.paidDate ?? occurrence.plannedDate;
}

function isAddBonusModalSubmit(
  payload: AddBonusModalSubmit | EditBonusModalSubmit,
): payload is AddBonusModalSubmit {
  return 'existingBonusComponentId' in payload;
}

function isEditBonusModalSubmit(
  payload: AddBonusModalSubmit | EditBonusModalSubmit,
): payload is EditBonusModalSubmit {
  return 'componentId' in payload;
}

function getDefaultChangeStartDate(
  component: ProjectedIncomeComponent,
  selectedYear: number,
): string {
  if (component.currentVersion?.endDate) {
    const nextDate = parseDateOnly(component.currentVersion.endDate);
    nextDate.setDate(nextDate.getDate() + 1);
    return toDateOnlyString(nextDate);
  }

  const today = new Date();
  if (today.getFullYear() === selectedYear) {
    return toDateOnlyString(today);
  }

  return `${selectedYear}-01-01`;
}

const statusClasses: Record<IncomeOccurrence['status'], string> = {
  actual:
    'bg-green-100 text-green-800 border border-green-200 dark:bg-green-950/30 dark:text-green-200',
  expected:
    'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-200',
};

interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddSourceModalSubmit) => Promise<void>;
}

const AddSourceModal: React.FC<AddSourceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const today = getTodayDateOnly();
  const [sourceName, setSourceName] = useState('');
  const [grossAmount, setGrossAmount] = useState('');
  const [netAmount, setNetAmount] = useState('');
  const [periodsPerYear, setPeriodsPerYear] = useState('26');
  const [startDate, setStartDate] = useState(today);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSourceName('');
    setGrossAmount('');
    setNetAmount('');
    setPeriodsPerYear('26');
    setStartDate(today);
    setIsSaving(false);
  }, [isOpen, today]);

  const handleSubmit = async () => {
    if (!sourceName.trim()) {
      return;
    }

    if (
      !isPositiveNumber(grossAmount) ||
      !isPositiveNumber(netAmount) ||
      !isPositiveNumber(periodsPerYear) ||
      !startDate
    ) {
      toast.error('Enter a start date and positive amounts before saving.');
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit({
        sourceName: sourceName.trim(),
        grossAmount: Number(grossAmount),
        netAmount: Number(netAmount),
        periodsPerYear: Number(periodsPerYear),
        startDate,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Income Source">
      <div className="space-y-4">
        <Input
          label="Income source"
          value={sourceName}
          onChange={(event) => setSourceName(event.target.value)}
          placeholder="Acme Corp"
          required
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Gross per pay period"
            type="number"
            min="0.01"
            step="0.01"
            value={grossAmount}
            onChange={(event) => setGrossAmount(event.target.value)}
            required
          />
          <Input
            label="Net per pay period"
            type="number"
            min="0.01"
            step="0.01"
            value={netAmount}
            onChange={(event) => setNetAmount(event.target.value)}
            required
          />
          <Input
            label="Pay periods per year"
            type="number"
            min="1"
            step="1"
            value={periodsPerYear}
            onChange={(event) => setPeriodsPerYear(event.target.value)}
            required
          />
          <Input
            label="Effective start date"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSaving}
            disabled={
              !sourceName.trim() ||
              !startDate ||
              !isPositiveNumber(grossAmount) ||
              !isPositiveNumber(netAmount) ||
              !isPositiveNumber(periodsPerYear)
            }
          >
            Save Source
          </Button>
        </div>
      </div>
    </Modal>
  );
};

interface RenameSourceModalProps {
  isOpen: boolean;
  source: ProjectedIncomeSource | null;
  onClose: () => void;
  onSubmit: (sourceId: number, name: string) => Promise<void>;
}

const RenameSourceModal: React.FC<RenameSourceModalProps> = ({
  isOpen,
  source,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(source?.name ?? '');
    setIsSaving(false);
  }, [isOpen, source]);

  const handleSubmit = async () => {
    if (!source || !name.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit(source.id, name.trim());
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rename Income Source">
      <div className="space-y-4">
        <Input
          label="Income source name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Acme Corp"
          required
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSaving}
            disabled={!name.trim() || name.trim() === source?.name}
          >
            Save Name
          </Button>
        </div>
      </div>
    </Modal>
  );
};

interface AddVersionModalProps {
  isOpen: boolean;
  component: ProjectedIncomeComponent | null;
  version?: RecurringIncomeVersion | null;
  selectedYear: number;
  onClose: () => void;
  onSubmit: (
    targetId: number,
    input: CreateRecurringIncomeVersionInput,
  ) => Promise<void>;
}

const AddVersionModal: React.FC<AddVersionModalProps> = ({
  isOpen,
  component,
  version,
  selectedYear,
  onClose,
  onSubmit,
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [grossAmount, setGrossAmount] = useState('');
  const [netAmount, setNetAmount] = useState('');
  const [periodsPerYear, setPeriodsPerYear] = useState('26');
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = Boolean(version);

  useEffect(() => {
    if (!component) {
      return;
    }
    if (version) {
      setStartDate(version.startDate);
      setEndDate(version.endDate ?? '');
      setGrossAmount(String(version.grossAmount));
      setNetAmount(String(version.netAmount));
      setPeriodsPerYear(String(version.periodsPerYear));
    } else {
      setStartDate(getDefaultChangeStartDate(component, selectedYear));
      setEndDate('');
      setGrossAmount(String(component.currentVersion?.grossAmount ?? ''));
      setNetAmount(String(component.currentVersion?.netAmount ?? ''));
      setPeriodsPerYear(String(component.currentVersion?.periodsPerYear ?? 26));
    }
    setIsSaving(false);
  }, [component, selectedYear, version]);

  const handleSubmit = async () => {
    if (!component) {
      return;
    }

    if (
      !startDate ||
      !isPositiveNumber(grossAmount) ||
      !isPositiveNumber(netAmount) ||
      !isPositiveNumber(periodsPerYear)
    ) {
      toast.error('Enter a start date and positive amounts before saving.');
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit(version?.id ?? component.id, {
        startDate,
        endDate: endDate || null,
        grossAmount: Number(grossAmount),
        netAmount: Number(netAmount),
        periodsPerYear: Number(periodsPerYear),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Compensation Change' : 'Add Compensation Change'}
    >
      <div className="space-y-4">
        <div className="surface-subtle p-4">
          <p className="text-sm font-semibold text-app">
            {component ? getComponentDisplayName(component) : 'Recurring pay'}
          </p>
          <p className="mt-1 text-sm text-muted">
            {isEditing
              ? 'Update the effective range and pay details for this recurring version.'
              : 'Adding a new version will auto-close the prior active version on the day before the new start date.'}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Effective start date"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            required
          />
          <Input
            label="Effective end date"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
          <Input
            label="Pay periods per year"
            type="number"
            min="1"
            step="1"
            value={periodsPerYear}
            onChange={(event) => setPeriodsPerYear(event.target.value)}
            required
          />
          <Input
            label="Gross per pay period"
            type="number"
            min="0.01"
            step="0.01"
            value={grossAmount}
            onChange={(event) => setGrossAmount(event.target.value)}
            required
          />
          <Input
            label="Net per pay period"
            type="number"
            min="0.01"
            step="0.01"
            value={netAmount}
            onChange={(event) => setNetAmount(event.target.value)}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSaving}
            disabled={
              !startDate ||
              !isPositiveNumber(grossAmount) ||
              !isPositiveNumber(netAmount) ||
              !isPositiveNumber(periodsPerYear)
            }
          >
            {isEditing ? 'Save Changes' : 'Save Change'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

interface AddBonusModalProps {
  isOpen: boolean;
  source: ProjectedIncomeSource | null;
  component?: ProjectedIncomeComponent | null;
  occurrence?: IncomeOccurrence | null;
  onClose: () => void;
  onSubmit: (
    targetId: number,
    payload: AddBonusModalSubmit | EditBonusModalSubmit,
  ) => Promise<void>;
}

const AddBonusModal: React.FC<AddBonusModalProps> = ({
  isOpen,
  source,
  component,
  occurrence,
  onClose,
  onSubmit,
}) => {
  const bonusComponents = useMemo(
    () => source?.components.filter((component) => component.componentMode === 'occurrence') ?? [],
    [source],
  );
  const isEditing = Boolean(component && occurrence);
  const [componentChoice, setComponentChoice] = useState('new');
  const [label, setLabel] = useState('Annual bonus');
  const [status, setStatus] = useState<IncomeOccurrence['status']>('expected');
  const [plannedDate, setPlannedDate] = useState(getTodayDateOnly());
  const [paidDate, setPaidDate] = useState('');
  const [grossAmount, setGrossAmount] = useState('');
  const [netAmount, setNetAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (component && occurrence) {
      setComponentChoice(String(component.id));
      setLabel(component.label ?? 'Bonus');
      setStatus(occurrence.status);
      setPlannedDate(occurrence.plannedDate);
      setPaidDate(occurrence.paidDate ?? '');
      setGrossAmount(String(occurrence.grossAmount));
      setNetAmount(String(occurrence.netAmount));
      setIsSaving(false);
      return;
    }

    const defaultChoice = bonusComponents.length > 0 ? String(bonusComponents[0].id) : 'new';
    setComponentChoice(defaultChoice);
    setLabel(bonusComponents[0]?.label ?? 'Annual bonus');
    setStatus('expected');
    setPlannedDate(getTodayDateOnly());
    setPaidDate('');
    setGrossAmount('');
    setNetAmount('');
    setIsSaving(false);
  }, [bonusComponents, component, isOpen, occurrence]);

  const buildOccurrencePayload = (): CreateIncomeOccurrenceInput => ({
    status,
    plannedDate,
    paidDate: status === 'actual' ? paidDate || plannedDate : null,
    grossAmount: Number(grossAmount),
    netAmount: Number(netAmount),
  });

  const handleSubmit = async () => {
    if (isEditing && component && occurrence) {
      setIsSaving(true);
      try {
        await onSubmit(occurrence.id, {
          componentId: component.id,
          label: label.trim(),
          occurrence: buildOccurrencePayload(),
        });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (!source) {
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit(source.id, {
        existingBonusComponentId:
          componentChoice === 'new' ? null : Number(componentChoice),
        label: label.trim(),
        occurrence: buildOccurrencePayload(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Bonus Event' : 'Add Bonus'}
    >
      <div className="space-y-4">
        {!isEditing && (
          <label>
            <span className="form-label">Bonus component</span>
            <select
              className="form-input"
              value={componentChoice}
              onChange={(event) => setComponentChoice(event.target.value)}
            >
              {bonusComponents.map((component) => (
                <option key={component.id} value={component.id}>
                  {getComponentDisplayName(component)}
                </option>
              ))}
              <option value="new">Create new bonus component</option>
            </select>
          </label>
        )}

        {!isEditing && componentChoice === 'new' && (
          <Input
            label="Bonus label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Annual bonus"
            required
          />
        )}

        {isEditing && component && (
          <>
            <Input
              label="Bonus label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Annual bonus"
              required
            />
            <div className="surface-subtle p-4">
              <p className="text-sm font-semibold text-app">
                {getComponentDisplayName(component)}
              </p>
              <p className="mt-1 text-sm text-muted">
                Update the bonus label and event details for this income stream.
              </p>
            </div>
          </>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="form-label">Status</span>
            <select
              className="form-input"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as IncomeOccurrence['status'])
              }
            >
              <option value="expected">Expected</option>
              <option value="actual">Actual</option>
            </select>
          </label>
          <Input
            label="Planned date"
            type="date"
            value={plannedDate}
            onChange={(event) => setPlannedDate(event.target.value)}
            required
          />
          {status === 'actual' && (
            <Input
              label="Paid date"
              type="date"
              value={paidDate}
              onChange={(event) => setPaidDate(event.target.value)}
            />
          )}
          <Input
            label="Gross amount"
            type="number"
            min="0"
            step="0.01"
            value={grossAmount}
            onChange={(event) => setGrossAmount(event.target.value)}
            required
          />
          <Input
            label="Net amount"
            type="number"
            min="0"
            step="0.01"
            value={netAmount}
            onChange={(event) => setNetAmount(event.target.value)}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSaving}
            disabled={!label.trim() || !grossAmount || !netAmount || !plannedDate}
          >
            {isEditing ? 'Save Changes' : 'Save Bonus'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export const IncomeView = React.forwardRef<IncomeViewHandle>((_, ref) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projection, setProjection] = useState<IncomeYearProjection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [expandedSources, setExpandedSources] = useState<Set<number>>(
    () => new Set(),
  );
  const [openActionMenuSourceId, setOpenActionMenuSourceId] = useState<
    number | null
  >(null);
  const [actionMenuPosition, setActionMenuPosition] =
    useState<ActionMenuPosition | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const actionMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const currentYear = new Date().getFullYear();
  const {
    availableYears: planningYears,
    selectedYear,
    setSelectedYear,
  } = usePlanningYearSelection({
    searchParams,
    setSearchParams,
    fallbackYear: currentYear,
  });

  const loadProjection = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await incomeApiService.getYearProjection(selectedYear);
      setProjection(response);
    } catch (error) {
      console.error('Failed to load income projection:', error);
      toast.error('Failed to load income data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    void loadProjection();
  }, [loadProjection]);

  useEffect(() => {
    if (openActionMenuSourceId === null) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setOpenActionMenuSourceId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openActionMenuSourceId]);

  useEffect(() => {
    if (openActionMenuSourceId === null || !actionMenuTriggerRef.current) {
      return;
    }

    const updatePosition = () => {
      if (!actionMenuTriggerRef.current) {
        return;
      }

      const rect = actionMenuTriggerRef.current.getBoundingClientRect();
      setActionMenuPosition({
        top: rect.bottom + 8,
        left: rect.right,
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [openActionMenuSourceId]);

  useImperativeHandle(ref, () => ({
    openAddIncomeModal: () => setModalState({ type: 'add-source' }),
  }));

  const versionModalState =
    modalState?.type === 'add-version' || modalState?.type === 'edit-version'
      ? modalState
      : null;
  const bonusModalState =
    modalState?.type === 'add-bonus' || modalState?.type === 'edit-bonus'
      ? modalState
      : null;

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  const handleAddSource = async (payload: AddSourceModalSubmit) => {
    try {
      const source = await incomeApiService.createSource({
        name: payload.sourceName,
      });
      const component = await incomeApiService.createComponent(source.id, {
        componentType: 'base_pay',
        componentMode: 'recurring',
        label: 'Base pay',
      });
      await incomeApiService.createRecurringVersion(component.id, {
        startDate: payload.startDate,
        grossAmount: payload.grossAmount,
        netAmount: payload.netAmount,
        periodsPerYear: payload.periodsPerYear,
      });

      toast.success('Income source added');
      setModalState(null);
      await loadProjection();
    } catch (error) {
      console.error('Failed to create income source:', error);
      toast.error('Failed to create income source');
      throw error;
    }
  };

  const handleAddVersion = async (
    componentId: number,
    input: CreateRecurringIncomeVersionInput,
  ) => {
    try {
      await incomeApiService.createRecurringVersion(componentId, input);
      toast.success('Compensation change saved');
      setModalState(null);
      await loadProjection();
    } catch (error) {
      console.error('Failed to create recurring version:', error);
      toast.error('Failed to save compensation change');
      throw error;
    }
  };

  const handleUpdateVersion = async (
    versionId: number,
    input: CreateRecurringIncomeVersionInput,
  ) => {
    try {
      await incomeApiService.updateRecurringVersion(versionId, input);
      toast.success('Compensation change updated');
      setModalState(null);
      await loadProjection();
    } catch (error) {
      console.error('Failed to update recurring version:', error);
      toast.error('Failed to update compensation change');
      throw error;
    }
  };

  const handleRenameSource = async (sourceId: number, name: string) => {
    try {
      await incomeApiService.updateSource(sourceId, { name });
      toast.success('Income source renamed');
      setModalState(null);
      await loadProjection();
    } catch (error) {
      console.error('Failed to rename income source:', error);
      toast.error('Failed to rename income source');
      throw error;
    }
  };

  const handleAddBonus = async (
    sourceId: number,
    payload: AddBonusModalSubmit,
  ) => {
    try {
      let componentId = payload.existingBonusComponentId;
      if (!componentId) {
        const component = await incomeApiService.createComponent(sourceId, {
          componentType: 'bonus',
          componentMode: 'occurrence',
          label: payload.label || 'Bonus',
        });
        componentId = component.id;
      }

      await incomeApiService.createOccurrence(componentId, payload.occurrence);
      toast.success('Bonus saved');
      setModalState(null);
      await loadProjection();
    } catch (error) {
      console.error('Failed to create bonus occurrence:', error);
      toast.error('Failed to save bonus');
      throw error;
    }
  };

  const handleUpdateBonus = async (
    occurrenceId: number,
    input: EditBonusModalSubmit,
  ) => {
    try {
      await incomeApiService.updateComponent(input.componentId, {
        label: input.label || 'Bonus',
      });
      await incomeApiService.updateOccurrence(occurrenceId, input.occurrence);
      toast.success('Bonus updated');
      setModalState(null);
      await loadProjection();
    } catch (error) {
      console.error('Failed to update bonus occurrence:', error);
      toast.error('Failed to update bonus');
      throw error;
    }
  };

  const handleMarkBonusActual = async (occurrence: IncomeOccurrence) => {
    try {
      await incomeApiService.updateOccurrence(occurrence.id, {
        status: 'actual',
        paidDate: occurrence.paidDate ?? occurrence.plannedDate,
      });
      toast.success('Bonus marked as actual');
      await loadProjection();
    } catch (error) {
      console.error('Failed to mark bonus as actual:', error);
      toast.error('Failed to update bonus');
    }
  };

  const handleDeleteVersion = async (
    component: ProjectedIncomeComponent,
    version: RecurringIncomeVersion,
  ) => {
    const label = getComponentDisplayName(component);
    if (
      !window.confirm(
        `Delete the ${label} compensation change from ${formatDate(version.startDate)} to ${formatDate(version.endDate)}?`,
      )
    ) {
      return;
    }

    try {
      await incomeApiService.deleteRecurringVersion(version.id);
      toast.success('Compensation change deleted');
      await loadProjection();
    } catch (error) {
      console.error('Failed to delete recurring version:', error);
      toast.error('Failed to delete compensation change');
    }
  };

  const handleDeleteBonus = async (
    component: ProjectedIncomeComponent,
    occurrence: IncomeOccurrence,
  ) => {
    const label = getComponentDisplayName(component);
    if (
      !window.confirm(
        `Delete the ${label} event scheduled for ${formatDate(occurrence.paidDate ?? occurrence.plannedDate)}?`,
      )
    ) {
      return;
    }

    try {
      await incomeApiService.deleteOccurrence(occurrence.id);
      toast.success('Bonus deleted');
      await loadProjection();
    } catch (error) {
      console.error('Failed to delete bonus occurrence:', error);
      toast.error('Failed to delete bonus');
    }
  };

  const handleDeleteSource = async (source: ProjectedIncomeSource) => {
    if (!window.confirm(`Delete income source "${source.name}"?`)) {
      return;
    }

    try {
      await incomeApiService.deleteSource(source.id);
      toast.success('Income source deleted');
      await loadProjection();
    } catch (error) {
      console.error('Failed to delete income source:', error);
      toast.error('Failed to delete income source');
    }
  };

  const handleVersionModalSubmit = async (
    targetId: number,
    input: CreateRecurringIncomeVersionInput,
  ) => {
    if (versionModalState?.type === 'edit-version') {
      await handleUpdateVersion(targetId, input);
      return;
    }

    await handleAddVersion(targetId, input);
  };

  const handleBonusModalSubmit = async (
    targetId: number,
    payload: AddBonusModalSubmit | EditBonusModalSubmit,
  ) => {
    if (bonusModalState?.type === 'edit-bonus') {
      if (isEditBonusModalSubmit(payload)) {
        await handleUpdateBonus(targetId, payload);
      }
      return;
    }

    if (isAddBonusModalSubmit(payload)) {
      await handleAddBonus(targetId, payload);
    }
  };

  const sources = projection?.sources ?? [];
  const toggleSourceExpansion = (sourceId: number) => {
    setExpandedSources((previous) => {
      const next = new Set(previous);
      if (next.has(sourceId)) {
        next.delete(sourceId);
      } else {
        next.add(sourceId);
      }
      return next;
    });
  };
  const closeActionMenu = () => {
    setOpenActionMenuSourceId(null);
    setActionMenuPosition(null);
    actionMenuTriggerRef.current = null;
  };

  return (
    <section className="space-y-6" aria-label="Income management">
      <IncomeSummary
        year={selectedYear}
        availableYears={planningYears}
        onYearChange={handleYearChange}
        totals={projection?.totals ?? EMPTY_PROJECTION_TOTALS}
      />

      {isLoading && !projection ? (
        <div className="surface-card py-16 text-center text-muted">
          Loading income plan...
        </div>
      ) : sources.length === 0 ? (
        <div className="surface-card space-y-4 py-14 text-center">
          <div>
            <p className="text-lg font-semibold text-app">No income data yet</p>
            <p className="mt-2 text-sm text-muted">
              Start by adding an income source and the first recurring pay
              version.
            </p>
          </div>
          <div className="flex justify-center">
            <Button onClick={() => setModalState({ type: 'add-source' })}>
              Add Income Source
            </Button>
          </div>
        </div>
      ) : (
        <div className="surface-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="border-b section-divider bg-gray-50/80 text-left">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Income Stream
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Components
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Current Mix
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Planned Net
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Committed Net
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => {
                  const recurringComponents = source.components.filter(
                    (component) => component.componentMode === 'recurring',
                  );
                  const bonusComponents = source.components.filter(
                    (component) => component.componentMode === 'occurrence',
                  );
                  const isExpanded = expandedSources.has(source.id);

                  return (
                    <React.Fragment key={source.id}>
                      <tr className="border-b section-divider align-top hover:bg-gray-50/60">
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            className="flex items-start gap-3 text-left"
                            onClick={() => toggleSourceExpansion(source.id)}
                          >
                            <span className="mt-0.5 rounded-full border border-app p-1 text-muted">
                              {isExpanded ? (
                                <LuChevronDown className="h-4 w-4" />
                              ) : (
                                <LuChevronRight className="h-4 w-4" />
                              )}
                            </span>
                            <span>
                              <span className="block text-sm font-semibold text-app">
                                {source.name}
                              </span>
                              <span className="mt-1 block text-xs text-muted">
                                Expand to review pay history and bonus events
                              </span>
                            </span>
                          </button>
                        </td>
                        <td className="px-4 py-4 text-sm text-muted">
                          {source.components.length} total
                          <div className="mt-1 text-xs">
                            {recurringComponents.length} recurring,{' '}
                            {bonusComponents.length} bonus
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-muted">
                          {getSourceComposition(source)}
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-semibold text-app">
                          {formatCurrency(source.totals.plannedNet)}
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-semibold text-app">
                          {formatCurrency(source.totals.committedNet)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <div
                              className="relative"
                            >
                              <button
                                type="button"
                                className="icon-button rounded-full border border-app p-2"
                                onClick={(event) => {
                                  const button = event.currentTarget;
                                  setOpenActionMenuSourceId((current) => {
                                    if (current === source.id) {
                                      actionMenuTriggerRef.current = null;
                                      setActionMenuPosition(null);
                                      return null;
                                    }

                                    actionMenuTriggerRef.current = button;
                                    const rect = button.getBoundingClientRect();
                                    setActionMenuPosition({
                                      top: rect.bottom + 8,
                                      left: rect.right,
                                    });
                                    return source.id;
                                  });
                                }}
                                title={`More actions for ${source.name}`}
                                aria-label={`More actions for income source ${source.name}`}
                                aria-haspopup="menu"
                                aria-expanded={openActionMenuSourceId === source.id}
                              >
                                <LuEllipsis className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="border-b section-divider bg-gray-50/40">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="space-y-5">
                              <div>
                                <div className="mb-3 flex items-center justify-between">
                                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                                    Recurring Pay
                                  </h4>
                                </div>
                                {recurringComponents.length === 0 ? (
                                  <div className="rounded-xl border border-dashed border-app p-4 text-sm text-muted">
                                    No recurring components tracked for this source.
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto rounded-xl border border-app bg-white">
                                    <table className="w-full text-sm">
                                      <thead className="border-b section-divider bg-gray-50/80 text-left text-muted">
                                        <tr>
                                          <th className="px-4 py-3">Component</th>
                                          <th className="px-4 py-3">Active Range</th>
                                          <th className="px-4 py-3">Current Pay</th>
                                          <th className="px-4 py-3 text-right">Planned Net</th>
                                          <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {recurringComponents.map((component) => (
                                          <React.Fragment key={component.id}>
                                            <tr className="border-b section-divider align-top">
                                              <td className="px-4 py-3 font-medium text-app">
                                                {getComponentDisplayName(component)}
                                              </td>
                                              <td className="px-4 py-3 text-muted">
                                                {component.currentVersion
                                                  ? `${formatDate(component.currentVersion.startDate)} to ${formatDate(component.currentVersion.endDate)}`
                                                  : 'No active version'}
                                              </td>
                                              <td className="px-4 py-3 text-muted">
                                                {formatNetRangeSummary(component)}
                                              </td>
                                              <td className="px-4 py-3 text-right font-semibold text-app">
                                                {formatCurrency(component.totals.plannedNet)}
                                              </td>
                                              <td className="px-4 py-3">
                                                <div className="flex justify-end">
                                                  <Button
                                                    variant="secondary"
                                                    className="px-3 py-2 text-xs"
                                                    onClick={() =>
                                                      setModalState({
                                                        type: 'add-version',
                                                        component,
                                                      })
                                                    }
                                                  >
                                                    Add Change
                                                  </Button>
                                                </div>
                                              </td>
                                            </tr>
                                            {component.versions.map((version) => (
                                              <tr
                                                key={version.id}
                                                className="border-b section-divider bg-gray-50/70 text-xs text-muted"
                                              >
                                                <td className="px-4 py-2 pl-10">
                                                  History
                                                </td>
                                                <td className="px-4 py-2">
                                                  {formatDate(version.startDate)} to{' '}
                                                  {formatDate(version.endDate)}
                                                </td>
                                                <td className="px-4 py-2">
                                                  {formatCurrency(version.netAmount)} net x{' '}
                                                  {version.periodsPerYear}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                  {formatCurrency(version.grossAmount)} gross
                                                </td>
                                                <td className="px-4 py-2">
                                                  <div className="flex justify-end gap-2">
                                                    <button
                                                      type="button"
                                                      className="icon-button rounded-full border border-app p-2 text-app transition-colors hover:bg-white"
                                                      onClick={() =>
                                                        setModalState({
                                                          type: 'edit-version',
                                                          component,
                                                          version,
                                                        })
                                                      }
                                                      title={`Edit ${getComponentDisplayName(component)} change`}
                                                      aria-label={`Edit ${getComponentDisplayName(component)} change`}
                                                    >
                                                      <LuPencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                      type="button"
                                                      className="icon-button rounded-full border border-app p-2 text-danger transition-colors hover:bg-white"
                                                      onClick={() =>
                                                        void handleDeleteVersion(
                                                          component,
                                                          version,
                                                        )
                                                      }
                                                      title={`Delete ${getComponentDisplayName(component)} change`}
                                                      aria-label={`Delete ${getComponentDisplayName(component)} change`}
                                                    >
                                                      <LuTrash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                  </div>
                                                </td>
                                              </tr>
                                            ))}
                                          </React.Fragment>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>

                              <div>
                                <div className="mb-3 flex items-center justify-between">
                                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                                    Bonus Events
                                  </h4>
                                </div>
                                {bonusComponents.length === 0 ? (
                                  <div className="rounded-xl border border-dashed border-app p-4 text-sm text-muted">
                                    No bonuses tracked for this source yet.
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto rounded-xl border border-app bg-white">
                                    <table className="w-full text-sm">
                                      <thead className="border-b section-divider bg-gray-50/80 text-left text-muted">
                                        <tr>
                                          <th className="px-4 py-3">Bonus</th>
                                          <th className="px-4 py-3">Status</th>
                                          <th className="px-4 py-3">Event Date</th>
                                          <th className="px-4 py-3 text-right">Net</th>
                                          <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {bonusComponents.flatMap((component) =>
                                          component.occurrences.map((occurrence) => (
                                            <tr
                                              key={`${component.id}-${occurrence.id}`}
                                              className="border-b section-divider"
                                            >
                                              <td className="px-4 py-3 font-medium text-app">
                                                {getComponentDisplayName(component)}
                                              </td>
                                              <td className="px-4 py-3">
                                                <span
                                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusClasses[occurrence.status]}`}
                                                >
                                                  {occurrence.status}
                                                </span>
                                              </td>
                                              <td className="px-4 py-3 text-muted">
                                                {formatDate(
                                                  getOccurrenceEventDate(occurrence),
                                                )}
                                              </td>
                                              <td className="px-4 py-3 text-right font-semibold text-app">
                                                {formatCurrency(occurrence.netAmount)}
                                              </td>
                                              <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                  {occurrence.status === 'expected' ? (
                                                    <Button
                                                      variant="secondary"
                                                      className="px-3 py-2 text-xs"
                                                      onClick={() =>
                                                        handleMarkBonusActual(
                                                          occurrence,
                                                        )
                                                      }
                                                    >
                                                      Mark Actual
                                                    </Button>
                                                  ) : (
                                                    <span className="text-xs text-muted">
                                                      Recorded
                                                    </span>
                                                  )}
                                                  <button
                                                    type="button"
                                                    className="icon-button rounded-full border border-app p-2 text-app transition-colors hover:bg-gray-50"
                                                    onClick={() =>
                                                      setModalState({
                                                        type: 'edit-bonus',
                                                        component,
                                                        occurrence,
                                                      })
                                                    }
                                                    title={`Edit ${getComponentDisplayName(component)} event`}
                                                    aria-label={`Edit ${getComponentDisplayName(component)} event`}
                                                  >
                                                    <LuPencil className="h-3.5 w-3.5" />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    className="icon-button rounded-full border border-app p-2 text-danger transition-colors hover:bg-red-50"
                                                    onClick={() =>
                                                      void handleDeleteBonus(
                                                        component,
                                                        occurrence,
                                                      )
                                                    }
                                                    title={`Delete ${getComponentDisplayName(component)} event`}
                                                    aria-label={`Delete ${getComponentDisplayName(component)} event`}
                                                  >
                                                    <LuTrash2 className="h-3.5 w-3.5" />
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                          )),
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddSourceModal
        isOpen={modalState?.type === 'add-source'}
        onClose={() => setModalState(null)}
        onSubmit={handleAddSource}
      />

      <RenameSourceModal
        isOpen={modalState?.type === 'rename-source'}
        source={modalState?.type === 'rename-source' ? modalState.source : null}
        onClose={() => setModalState(null)}
        onSubmit={handleRenameSource}
      />

      <AddVersionModal
        isOpen={versionModalState !== null}
        component={versionModalState?.component ?? null}
        version={versionModalState?.type === 'edit-version' ? versionModalState.version : null}
        selectedYear={selectedYear}
        onClose={() => setModalState(null)}
        onSubmit={handleVersionModalSubmit}
      />

      <AddBonusModal
        isOpen={bonusModalState !== null}
        source={bonusModalState?.type === 'add-bonus' ? bonusModalState.source : null}
        component={bonusModalState?.type === 'edit-bonus' ? bonusModalState.component : null}
        occurrence={bonusModalState?.type === 'edit-bonus' ? bonusModalState.occurrence : null}
        onClose={() => setModalState(null)}
        onSubmit={handleBonusModalSubmit}
      />

      {openActionMenuSourceId !== null &&
        actionMenuPosition &&
        projection?.sources &&
        createPortal(
          (() => {
            const activeSource =
              projection.sources.find(
                (source) => source.id === openActionMenuSourceId,
              ) ?? null;

            if (!activeSource) {
              return null;
            }

            return (
              <div
                ref={actionMenuRef}
                className="fixed z-[70] min-w-[180px] overflow-hidden rounded-xl border border-app bg-white shadow-lg"
                style={{
                  top: actionMenuPosition.top,
                  left: actionMenuPosition.left,
                  transform: 'translateX(calc(-100% + 2.5rem))',
                }}
                role="menu"
                aria-label={`Actions for ${activeSource.name}`}
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-app transition-colors hover:bg-gray-50"
                  onClick={() => {
                    closeActionMenu();
                    setModalState({
                      type: 'rename-source',
                      source: activeSource,
                    });
                  }}
                  role="menuitem"
                >
                  <LuPencil className="h-4 w-4" />
                  Rename
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-app transition-colors hover:bg-gray-50"
                  onClick={() => {
                    closeActionMenu();
                    setModalState({
                      type: 'add-bonus',
                      source: activeSource,
                    });
                  }}
                  role="menuitem"
                >
                  <LuPlus className="h-4 w-4" />
                  Add Bonus
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-danger transition-colors hover:bg-red-50"
                  onClick={() => {
                    closeActionMenu();
                    void handleDeleteSource(activeSource);
                  }}
                  role="menuitem"
                >
                  <LuTrash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            );
          })(),
          document.body,
        )}
    </section>
  );
});

IncomeView.displayName = 'IncomeView';
