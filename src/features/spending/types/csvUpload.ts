/**
 * CSV upload and preview types
 */

export interface ParsedTransaction {
  row_number: number;
  account: string;
  account_name: string;
  transaction_date: string | null;
  post_date: string;
  description: string;
  amount: number;
  chase_category: string | null;
  is_filtered: boolean;
  filter_reason: string | null;
  validation_errors: string[];
}

export interface CsvParseResult {
  transactions: ParsedTransaction[];
  total_count: number;
  import_count: number;
  filtered_count: number;
  error_count: number;
  parse_errors: string[];
}

export interface CsvUploadConfirm {
  transactions: ParsedTransaction[];
  import_batch_id: string;
}
