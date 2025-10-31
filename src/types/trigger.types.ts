import { EventName, HttpMethod, TriggerType } from "./enums";

export interface CreateTriggerRecord {
  workflow_id: string;
  name?: string;
  type: TriggerType;
  configuration: TriggerConfiguration;
}

export interface UpdateTriggerRecord {
  name?: string;
  type: TriggerType;
  configuration?: Partial<TriggerConfiguration>;
}

export interface AuthConfig {
  type: string;
  username?: string;
  password?: string;
  header_key?: string;
  header_value?: string;
}

export interface TriggerConfiguration {
  [TriggerType.WEBHOOK]?: {
    method: HttpMethod;
    endpoint: string;
    authentication?: AuthConfig;
    mockData?: unknown;
  };
  [TriggerType.SCHEDULE]?: {
    cron_expression: string;
    timezone?: string;
    method: HttpMethod;
    endpoint: string;
    authentication?: AuthConfig;
    mockData?: unknown;
  };
  [TriggerType.EVENT]?: {
    event_name: EventName;
    method: HttpMethod;
    endpoint: string;
    authentication?: AuthConfig;
    mockData?: unknown;
  };
  [TriggerType.HTTP_REQUEST]?: {
    method: HttpMethod;
    endpoint: string;
    authentication?: AuthConfig;
    mockData?: unknown;
  };
}
