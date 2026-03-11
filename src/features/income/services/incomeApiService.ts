import type {
  CreateIncomeComponentInput,
  CreateIncomeOccurrenceInput,
  CreateIncomeSourceInput,
  CreateRecurringIncomeVersionInput,
  DeductionBreakdown,
  IncomeComponent,
  IncomeOccurrence,
  IncomeProjectionTotals,
  IncomeSource,
  IncomeYearProjection,
  ProjectedIncomeComponent,
  ProjectedIncomeSource,
  RecurringIncomeVersion,
  UpdateIncomeOccurrenceInput,
  UpdateRecurringIncomeVersionInput,
  UpdateIncomeSourceInput,
} from '../types/income';

const API_BASE = '/api/incomes';

function transformDeductions(
  data: Record<string, unknown> | null | undefined,
): DeductionBreakdown | null {
  if (!data) {
    return null;
  }

  return {
    federalTax: Number(data.federal_tax ?? 0) || undefined,
    stateTax: Number(data.state_tax ?? 0) || undefined,
    fica: Number(data.fica ?? 0) || undefined,
    retirement: Number(data.retirement ?? 0) || undefined,
    healthInsurance: Number(data.health_insurance ?? 0) || undefined,
    other: Number(data.other ?? 0) || undefined,
  };
}

function transformDeductionTotals(data: Record<string, unknown>) {
  return {
    federalTax: Number(data.federal_tax ?? 0),
    stateTax: Number(data.state_tax ?? 0),
    fica: Number(data.fica ?? 0),
    retirement: Number(data.retirement ?? 0),
    healthInsurance: Number(data.health_insurance ?? 0),
    other: Number(data.other ?? 0),
    total: Number(data.total ?? 0),
  };
}

function transformTotals(data: Record<string, unknown>): IncomeProjectionTotals {
  return {
    committedGross: Number(data.committed_gross ?? 0),
    committedNet: Number(data.committed_net ?? 0),
    plannedGross: Number(data.planned_gross ?? 0),
    plannedNet: Number(data.planned_net ?? 0),
    committedDeductions: transformDeductionTotals(
      data.committed_deductions as Record<string, unknown>,
    ),
    plannedDeductions: transformDeductionTotals(
      data.planned_deductions as Record<string, unknown>,
    ),
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

function transformVersion(data: Record<string, unknown>): RecurringIncomeVersion {
  return {
    id: Number(data.id),
    componentId: Number(data.component_id),
    startDate: String(data.start_date),
    endDate: data.end_date ? String(data.end_date) : null,
    grossAmount: Number(data.gross_amount),
    netAmount: Number(data.net_amount),
    periodsPerYear: Number(data.periods_per_year),
    deductions: transformDeductions(
      (data.deductions as Record<string, unknown> | null) ?? null,
    ),
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
    deductions: transformDeductions(
      (data.deductions as Record<string, unknown> | null) ?? null,
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
    const detail = await response.text();
    throw new Error(detail || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json();
  return transform ? transform(data) : (data as T);
}

function serializeDeductions(deductions: DeductionBreakdown | null | undefined) {
  if (!deductions) {
    return null;
  }

  return {
    federal_tax: deductions.federalTax ?? null,
    state_tax: deductions.stateTax ?? null,
    fica: deductions.fica ?? null,
    retirement: deductions.retirement ?? null,
    health_insurance: deductions.healthInsurance ?? null,
    other: deductions.other ?? null,
  };
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
  if (input.deductions !== undefined) {
    body.deductions = serializeDeductions(input.deductions);
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
  if (input.deductions !== undefined) {
    body.deductions = serializeDeductions(input.deductions);
  }

  return body;
}

export const incomeApiService = {
  async getYearProjection(year: number): Promise<IncomeYearProjection> {
    return request(`/projection?year=${year}`, undefined, (data) => ({
      year: Number(data.year),
      totals: transformTotals(data.totals as Record<string, unknown>),
      sources: ((data.sources as Array<Record<string, unknown>>) ?? []).map(
        transformProjectedSource,
      ),
    }));
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
};
