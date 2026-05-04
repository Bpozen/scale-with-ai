export interface AgentConfig {
  name: string;
  trigger: 'daily' | 'weekly' | 'manual';
  cron?: string;
}

export interface AgentResult {
  success: boolean;
  itemsProcessed: number;
  errors: string[];
}
