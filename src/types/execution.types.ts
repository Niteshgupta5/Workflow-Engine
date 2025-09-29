export interface CreateExecutionRecord {
  workflow_id: string;
  trigger_id: string;
  status: string;
  context: any;
}
