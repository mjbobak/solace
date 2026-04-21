import { normalizeTaxAdvantagedBuckets } from '../constants/taxAdvantagedBuckets';
import { DEFAULT_EMERGENCY_FUND_BALANCE } from '../constants/yearSettings';
import type {
  AnnualAdjustment,
  AnnualAdjustmentTotals,
  CreateAnnualAdjustmentInput,
  CreateIncomeComponentInput,
  CreateIncomeOccurrenceInput,
  CreateIncomeSourceInput,
  CreateRecurringIncomeVersionInput,
  IncomeComponent,
  IncomeOccurrence,
  IncomeProjectionTotals,
  IncomeYearSettings,
  IncomeSource,
  IncomeYearProjection,
  ProjectedIncomeComponent,
  ProjectedIncomeSource,
  RecurringIncomeVersion,
  TaxAdvantagedBucketEntry,
  TaxAdvantagedInvestments,
  UpdateAnnualAdjustmentInput,
  UpdateIncomeComponentInput,
  UpdateIncomeOccurrenceInput,
  UpdateRecurringIncomeVersionInput,
  UpdateIncomeYearSettingsInput,
  UpdateIncomeSourceInput,
} from '../types/income';

const API_BASE = '/api/incomes';

function transformTaxAdvantagedBucketEntries(
  entries: Array<Record<string, unknown>> | null | undefined,
): TaxAdvantagedBucketEntry[] {
  return normalizeTaxAdvantagedBuckets(
    (entries ?? []).map((entry) => ({
      bucketType: entry.bucket_type as TaxAdvantagedBucketEntry['bucketType'],
      annualAmount: Number(entry.annual_amount ?? 0),
    })),
  );
}

function serializeTaxAdvantagedBucketEntries(
  entries: TaxAdvantagedBucketEntry[],
): Array<Record<string, unknown>> {
  return normalizeTaxAdvantagedBuckets(entries).map((entry) => ({
    bucket_type: entry.bucketType,
    annual_amount: entry.annualAmount,
  }));
}

function transformTaxAdvantagedInvestments(
  data: Record<string, unknown> | null | undefined,
): TaxAdvantagedInvestments {
  return {
    entries: transformTaxAdvantagedBucketEntries(
      (data?.entries as Array<Record<string, unknown>> | undefined) ?? [],
    ),
    lockedTotal: Number(data?.locked_total ?? 0),
    spendableTotal: Number(data?.spendable_total ?? 0),
    total: Number(data?.total ?? 0),
  };
}

function transformNullableId(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return Number(value);
}

function transformTotals(
  data: Record<string, unknown>,
): IncomeProjectionTotals {
  return {
    committedGross: Number(data.committed_gross ?? 0),
    committedCashNet: Number(data.committed_cash_net ?? 0),
    committedNet: Number(data.committed_net ?? 0),
    plannedGross: Number(data.planned_gross ?? 0),
    plannedCashNet: Number(data.planned_cash_net ?? 0),
    plannedNet: Number(data.planned_net ?? 0),
  };
}

function transformAnnualAdjustment(
  data: Record<string, unknown>,
): AnnualAdjustment {
  return {
    id: Number(data.id),
    year: Number(data.year),
    label: String(data.label),
    effectiveDate: String(data.effective_date),
    status: data.status as AnnualAdjustment['status'],
    amount: Number(data.amount ?? 0),
    createdAt: String(data.created_at),
    updatedAt: String(data.updated_at),
  };
}

function transformAnnualAdjustmentTotals(
  data: Record<string, unknown> | null | undefined,
): AnnualAdjustmentTotals {
  return {
    committed: Number(data?.committed ?? 0),
    planned: Number(data?.planned ?? 0),
  };
}

function transformSource(data: Record<string, unknown>): IncomeSource {
  return {
    id: Number(data.id),
    name: String(data.name),
    isActive: Boolean(data.is_active),
    sortOrder: Number(data.sort_order ?? 0),
    createdAt: String(data.created_at),
    updatedAt: String(data.updated_at),
  };
}

function transformComponent(data: Record<string, unknown>): IncomeComponent {
  return {
    id: Number(data.id),
    sourceId: Number(data.source_id),
    componentType: data.component_type as IncomeComponent['componentType'],
    componentMode: data.component_mode as IncomeComponent['componentMode'],
    label: data.label ? String(data.label) : null,
    createdAt: String(data.created_at),
    updatedAt: String(data.updated_at),
  };
}

function transformVersion(
  data: Record<string, unknown>,
): RecurringIncomeVersion {
  return {
    id: Number(data.id),
    componentId: Number(data.component_id),
    startDate: String(data.start_date),
    endDate: data.end_date ? String(data.end_date) : null,
    grossAmount: Number(data.gross_amount),
    netAmount: Number(data.net_amount),
    periodsPerYear: Number(data.periods_per_year),
    createdAt: String(data.created_at),
    updatedAt: String(data.updated_at),
  };
}

function transformOccurrence(data: Record<string, unknown>): IncomeOccurrence {
  return {
    id: Number(data.id),
    componentId: Number(data.component_id),
    status: data.status as IncomeOccurrence['status'],
    plannedDate: String(data.planned_date),
    paidDate: data.paid_date ? String(data.paid_date) : null,
    grossAmount: Number(data.gross_amount),
    netAmount: Number(data.net_amount),
    createdAt: String(data.created_at),
    updatedAt: String(data.updated_at),
  };
}

function transformYearSettings(
  data: Record<string, unknown>,
): IncomeYearSettings {
  return {
    year: Number(data.year),
    taxAdvantagedBuckets: transformTaxAdvantagedBucketEntries(
      (data.tax_advantaged_buckets as
        | Array<Record<string, unknown>>
        | undefined) ?? [],
    ),
    emergencyFundBalance: Number(
      data.emergency_fund_balance ?? DEFAULT_EMERGENCY_FUND_BALANCE,
    ),
    primaryRunwaySourceId: transformNullableId(data.primary_runway_source_id),
    secondaryRunwaySourceId: transformNullableId(
      data.secondary_runway_source_id,
    ),
    createdAt: String(data.created_at),
    updatedAt: String(data.updated_at),
  };
}

function transformProjectedComponent(
  data: Record<string, unknown>,
): ProjectedIncomeComponent {
  return {
    ...transformComponent(data),
    totals: transformTotals(data.totals as Record<string, unknown>),
    currentVersion: data.current_version
      ? transformVersion(data.current_version as Record<string, unknown>)
      : null,
    versions: ((data.versions as Array<Record<string, unknown>>) ?? []).map(
      transformVersion,
    ),
    occurrences: (
      (data.occurrences as Array<Record<string, unknown>>) ?? []
    ).map(transformOccurrence),
  };
}

function transformProjectedSource(
  data: Record<string, unknown>,
): ProjectedIncomeSource {
  return {
    ...transformSource(data),
    totals: transformTotals(data.totals as Record<string, unknown>),
    components: ((data.components as Array<Record<string, unknown>>) ?? []).map(
      transformProjectedComponent,
    ),
  };
}

async function request<T>(
  path: string,
  init?: RequestInit,
  transform?: (data: Record<string, unknown>) => T,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    const raw = await response.text();
    let message = raw || response.statusText;

    try {
      const parsed = JSON.parse(raw) as { detail?: unknown };
      if (typeof parsed.detail === 'string' && parsed.detail.trim()) {
        message = parsed.detail;
      } else if (Array.isArray(parsed.detail) && parsed.detail.length > 0) {
        message = parsed.detail
          .map((item) => {
            if (!item || typeof item !== 'object') {
              return null;
            }

            const detailItem = item as { loc?: unknown; msg?: unknown };
            const field = Array.isArray(detailItem.loc)
              ? detailItem.loc
                  .filter(
                    (part) =>
                      typeof part === 'string' || typeof part === 'number',
                  )
                  .join('.')
              : null;
            const msg =
              typeof detailItem.msg === 'string' ? detailItem.msg : null;
            return field && msg ? `${field}: ${msg}` : msg;
          })
          .filter((entry): entry is string => Boolean(entry))
          .join('; ');
      }
    } catch {
      // Plain-text error response; keep existing message.
    }

    throw new Error(message || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json();
  return transform ? transform(data) : (data as T);
}

function serializeRecurringVersionInput(
  input: UpdateRecurringIncomeVersionInput,
) {
  const body: Record<string, unknown> = {};

  if (input.startDate !== undefined) {
    body.start_date = input.startDate;
  }
  if (input.endDate !== undefined) {
    body.end_date = input.endDate;
  }
  if (input.grossAmount !== undefined) {
    body.gross_amount = input.grossAmount;
  }
  if (input.netAmount !== undefined) {
    body.net_amount = input.netAmount;
  }
  if (input.periodsPerYear !== undefined) {
    body.periods_per_year = input.periodsPerYear;
  }

  return body;
}

function serializeOccurrenceInput(input: UpdateIncomeOccurrenceInput) {
  const body: Record<string, unknown> = {};

  if (input.status !== undefined) {
    body.status = input.status;
  }
  if (input.plannedDate !== undefined) {
    body.planned_date = input.plannedDate;
  }
  if (input.paidDate !== undefined) {
    body.paid_date = input.paidDate;
  }
  if (input.grossAmount !== undefined) {
    body.gross_amount = input.grossAmount;
  }
  if (input.netAmount !== undefined) {
    body.net_amount = input.netAmount;
  }

  return body;
}

function serializeAnnualAdjustmentInput(
  input: CreateAnnualAdjustmentInput | UpdateAnnualAdjustmentInput,
) {
  const body: Record<string, unknown> = {};

  if ('year' in input && input.year !== undefined) {
    body.year = input.year;
  }
  if (input.label !== undefined) {
    body.label = input.label;
  }
  if (input.effectiveDate !== undefined) {
    body.effective_date = input.effectiveDate;
  }
  if (input.status !== undefined) {
    body.status = input.status;
  }
  if (input.amount !== undefined) {
    body.amount = input.amount;
  }

  return body;
}

export const incomeApiService = {
  async getYearProjection(year: number): Promise<IncomeYearProjection> {
    return request(`/projection?year=${year}`, undefined, (data) => ({
      year: Number(data.year),
      totals: transformTotals(data.totals as Record<string, unknown>),
      emergencyFundBalance: Number(
        data.emergency_fund_balance ?? DEFAULT_EMERGENCY_FUND_BALANCE,
      ),
      primaryRunwaySourceId: transformNullableId(data.primary_runway_source_id),
      secondaryRunwaySourceId: transformNullableId(
        data.secondary_runway_source_id,
      ),
      taxAdvantagedInvestments: transformTaxAdvantagedInvestments(
        (data.tax_advantaged_investments as Record<string, unknown> | null) ??
          null,
      ),
      annualAdjustmentTotals: transformAnnualAdjustmentTotals(
        (data.annual_adjustment_totals as Record<string, unknown> | null) ??
          null,
      ),
      annualAdjustments: (
        (data.annual_adjustments as Array<Record<string, unknown>>) ?? []
      ).map(transformAnnualAdjustment),
      sources: ((data.sources as Array<Record<string, unknown>>) ?? []).map(
        transformProjectedSource,
      ),
    }));
  },

  async createAnnualAdjustment(
    input: CreateAnnualAdjustmentInput,
  ): Promise<AnnualAdjustment> {
    return request(
      '/annual-adjustments',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serializeAnnualAdjustmentInput(input)),
      },
      transformAnnualAdjustment,
    );
  },

  async updateAnnualAdjustment(
    adjustmentId: number,
    input: UpdateAnnualAdjustmentInput,
  ): Promise<AnnualAdjustment> {
    return request(
      `/annual-adjustments/${adjustmentId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serializeAnnualAdjustmentInput(input)),
      },
      transformAnnualAdjustment,
    );
  },

  async deleteAnnualAdjustment(adjustmentId: number): Promise<void> {
    await request<void>(`/annual-adjustments/${adjustmentId}`, {
      method: 'DELETE',
    });
  },

  async listSources(): Promise<IncomeSource[]> {
    const response = await fetch(`${API_BASE}/sources`);
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    const data = (await response.json()) as Array<Record<string, unknown>>;
    return data.map(transformSource);
  },

  async createSource(input: CreateIncomeSourceInput): Promise<IncomeSource> {
    return request(
      `/sources`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: input.name,
          is_active: input.isActive ?? true,
          sort_order: input.sortOrder ?? 0,
        }),
      },
      transformSource,
    );
  },

  async updateSource(
    sourceId: number,
    input: UpdateIncomeSourceInput,
  ): Promise<IncomeSource> {
    return request(
      `/sources/${sourceId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: input.name,
          is_active: input.isActive,
          sort_order: input.sortOrder,
        }),
      },
      transformSource,
    );
  },

  async deleteSource(sourceId: number): Promise<void> {
    await request<void>(`/sources/${sourceId}`, { method: 'DELETE' });
  },

  async createComponent(
    sourceId: number,
    input: CreateIncomeComponentInput,
  ): Promise<IncomeComponent> {
    return request(
      `/sources/${sourceId}/components`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          component_type: input.componentType,
          component_mode: input.componentMode,
          label: input.label ?? null,
        }),
      },
      transformComponent,
    );
  },

  async updateComponent(
    componentId: number,
    input: UpdateIncomeComponentInput,
  ): Promise<IncomeComponent> {
    return request(
      `/components/${componentId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          component_type: input.componentType,
          component_mode: input.componentMode,
          label: input.label ?? null,
        }),
      },
      transformComponent,
    );
  },

  async createRecurringVersion(
    componentId: number,
    input: CreateRecurringIncomeVersionInput,
  ): Promise<RecurringIncomeVersion> {
    return request(
      `/components/${componentId}/versions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serializeRecurringVersionInput(input)),
      },
      transformVersion,
    );
  },

  async updateRecurringVersion(
    versionId: number,
    input: UpdateRecurringIncomeVersionInput,
  ): Promise<RecurringIncomeVersion> {
    return request(
      `/versions/${versionId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serializeRecurringVersionInput(input)),
      },
      transformVersion,
    );
  },

  async deleteRecurringVersion(versionId: number): Promise<void> {
    await request<void>(`/versions/${versionId}`, { method: 'DELETE' });
  },

  async createOccurrence(
    componentId: number,
    input: CreateIncomeOccurrenceInput,
  ): Promise<IncomeOccurrence> {
    return request(
      `/components/${componentId}/occurrences`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serializeOccurrenceInput(input)),
      },
      transformOccurrence,
    );
  },

  async deleteOccurrence(occurrenceId: number): Promise<void> {
    await request<void>(`/occurrences/${occurrenceId}`, { method: 'DELETE' });
  },

  async updateOccurrence(
    occurrenceId: number,
    input: UpdateIncomeOccurrenceInput,
  ): Promise<IncomeOccurrence> {
    return request(
      `/occurrences/${occurrenceId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serializeOccurrenceInput(input)),
      },
      transformOccurrence,
    );
  },

  async updateYearSettings(
    year: number,
    input: UpdateIncomeYearSettingsInput,
  ): Promise<IncomeYearSettings> {
    return request(
      `/year-settings/${year}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(input.taxAdvantagedBuckets !== undefined
            ? {
                tax_advantaged_buckets: serializeTaxAdvantagedBucketEntries(
                  input.taxAdvantagedBuckets,
                ),
              }
            : {}),
          ...(input.emergencyFundBalance !== undefined
            ? { emergency_fund_balance: input.emergencyFundBalance }
            : {}),
          ...(input.primaryRunwaySourceId !== undefined
            ? { primary_runway_source_id: input.primaryRunwaySourceId }
            : {}),
          ...(input.secondaryRunwaySourceId !== undefined
            ? { secondary_runway_source_id: input.secondaryRunwaySourceId }
            : {}),
        }),
      },
      transformYearSettings,
    );
  },
};
