/**
 * Income API service for backend communication.
 */

import type { IncomeEntry, EffectiveDateRange } from '../types/income';

const API_BASE = '/api/incomes';

// ========== Helper Functions ==========

/**
 * Transform backend response to frontend IncomeEntry type.
 */
function transformIncomeResponse(data: Record<string, unknown>): IncomeEntry {
  return {
    id: `INC-${String(data.id).padStart(4, '0')}`,
    stream: data.stream,
    type: data.type,
    frequency: data.frequency || undefined,
    receivedDate: data.received_date || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    effectiveRanges: (
      data.effective_ranges as Array<Record<string, unknown>>
    ).map((range) => ({
      id: `INC-${String(data.id).padStart(4, '0')}-range-${String(
        range.id,
      ).padStart(3, '0')}`,
      startDate: range.start_date,
      endDate: range.end_date || null,
      grossAmount: range.gross_amount,
      netAmount: range.net_amount,
      periods: range.periods,
      deductions: range.deductions
        ? {
            federalTax: range.deductions.federal_tax,
            stateTax: range.deductions.state_tax,
            fica: range.deductions.fica,
            retirement: range.deductions.retirement,
            healthInsurance: range.deductions.health_insurance,
            other: range.deductions.other,
          }
        : undefined,
    })),
  };
}

/**
 * Transform frontend IncomeEntry to backend create payload.
 */
function transformIncomeCreate(
  entry: Omit<IncomeEntry, 'id' | 'createdAt' | 'updatedAt'>,
): Record<string, unknown> {
  return {
    stream: entry.stream,
    type: entry.type,
    frequency: entry.frequency || null,
    received_date: entry.receivedDate || null,
    effective_ranges: entry.effectiveRanges.map((range) => ({
      start_date: range.startDate,
      end_date: range.endDate,
      gross_amount: range.grossAmount,
      net_amount: range.netAmount,
      periods: range.periods,
      deductions: range.deductions
        ? {
            federal_tax: range.deductions.federalTax,
            state_tax: range.deductions.stateTax,
            fica: range.deductions.fica,
            retirement: range.deductions.retirement,
            health_insurance: range.deductions.healthInsurance,
            other: range.deductions.other,
          }
        : null,
    })),
  };
}

// ========== API Functions ==========

export const incomeApiService = {
  /**
   * Fetch all income entries.
   */
  async getAllIncomes(): Promise<IncomeEntry[]> {
    const response = await fetch(API_BASE);
    if (!response.ok) {
      throw new Error(`Failed to fetch incomes: ${response.statusText}`);
    }
    const data = await response.json();
    return data.map(transformIncomeResponse);
  },

  /**
   * Fetch single income by ID.
   */
  async getIncomeById(id: string): Promise<IncomeEntry> {
    const numericId = parseInt(id.replace('INC-', ''), 10);
    const response = await fetch(`${API_BASE}/${numericId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch income ${id}: ${response.statusText}`);
    }
    const data = await response.json();
    return transformIncomeResponse(data);
  },

  /**
   * Create new income entry.
   */
  async createIncome(
    entry: Omit<IncomeEntry, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<IncomeEntry> {
    const payload = transformIncomeCreate(entry);
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to create income: ${response.statusText}`);
    }
    const data = await response.json();
    return transformIncomeResponse(data);
  },

  /**
   * Update income entry (metadata only, not ranges).
   */
  async updateIncome(
    id: string,
    updates: Partial<IncomeEntry>,
  ): Promise<IncomeEntry> {
    const numericId = parseInt(id.replace('INC-', ''), 10);
    const payload: Record<string, unknown> = {};
    if (updates.stream !== undefined) payload.stream = updates.stream;
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.frequency !== undefined) payload.frequency = updates.frequency;
    if (updates.receivedDate !== undefined)
      payload.received_date = updates.receivedDate;

    const response = await fetch(`${API_BASE}/${numericId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to update income ${id}: ${response.statusText}`);
    }
    const data = await response.json();
    return transformIncomeResponse(data);
  },

  /**
   * Delete income entry.
   */
  async deleteIncome(id: string): Promise<void> {
    const numericId = parseInt(id.replace('INC-', ''), 10);
    const response = await fetch(`${API_BASE}/${numericId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete income ${id}: ${response.statusText}`);
    }
  },

  /**
   * Add new effective range to existing income.
   */
  async addEffectiveRange(
    incomeId: string,
    range: Omit<EffectiveDateRange, 'id'>,
  ): Promise<IncomeEntry> {
    const numericId = parseInt(incomeId.replace('INC-', ''), 10);
    const payload = {
      start_date: range.startDate,
      end_date: range.endDate,
      gross_amount: range.grossAmount,
      net_amount: range.netAmount,
      periods: range.periods,
      deductions: range.deductions
        ? {
            federal_tax: range.deductions.federalTax,
            state_tax: range.deductions.stateTax,
            fica: range.deductions.fica,
            retirement: range.deductions.retirement,
            health_insurance: range.deductions.healthInsurance,
            other: range.deductions.other,
          }
        : null,
    };

    const response = await fetch(`${API_BASE}/${numericId}/ranges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Failed to add effective range: ${response.statusText}`);
    }

    // Re-fetch full income to get updated state
    return this.getIncomeById(incomeId);
  },

  /**
   * Update existing effective range.
   */
  async updateEffectiveRange(
    incomeId: string,
    rangeId: string,
    updates: Partial<EffectiveDateRange>,
  ): Promise<IncomeEntry> {
    const numericRangeId = parseInt(rangeId.split('-range-')[1], 10);
    const payload: Record<string, unknown> = {};
    if (updates.startDate !== undefined) payload.start_date = updates.startDate;
    if (updates.endDate !== undefined) payload.end_date = updates.endDate;
    if (updates.grossAmount !== undefined)
      payload.gross_amount = updates.grossAmount;
    if (updates.netAmount !== undefined) payload.net_amount = updates.netAmount;
    if (updates.periods !== undefined) payload.periods = updates.periods;
    if (updates.deductions !== undefined) {
      payload.deductions = {
        federal_tax: updates.deductions.federalTax,
        state_tax: updates.deductions.stateTax,
        fica: updates.deductions.fica,
        retirement: updates.deductions.retirement,
        health_insurance: updates.deductions.healthInsurance,
        other: updates.deductions.other,
      };
    }

    const response = await fetch(`${API_BASE}/ranges/${numericRangeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(
        `Failed to update effective range: ${response.statusText}`,
      );
    }

    // Re-fetch full income to get updated state
    return this.getIncomeById(incomeId);
  },

  /**
   * Delete effective range.
   */
  async deleteEffectiveRange(
    incomeId: string,
    rangeId: string,
  ): Promise<IncomeEntry> {
    const numericRangeId = parseInt(rangeId.split('-range-')[1], 10);
    const response = await fetch(`${API_BASE}/ranges/${numericRangeId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(
        `Failed to delete effective range: ${response.statusText}`,
      );
    }

    // Re-fetch full income to get updated state
    return this.getIncomeById(incomeId);
  },

  /**
   * Delete all income entries for a given stream name.
   */
  async deleteIncomeStream(streamName: string): Promise<void> {
    const response = await fetch(
      `${API_BASE}/stream/${encodeURIComponent(streamName)}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || 'Failed to delete income stream');
    }
  },
};
