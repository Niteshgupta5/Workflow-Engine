import { NodeTemplateDTO, TriggerType } from "../types";

export const TriggerRegistry: Record<TriggerType, NodeTemplateDTO> = {
  [TriggerType.WEBHOOK]: {
    id: "2e2f2b4b-a281-45e5-a431-1d3c5deb8d77",
    name: "Webhook",
    description: "Webhook Trigger",
    type: TriggerType.WEBHOOK,
    category_id: "00000000-0000-0000-0000-000000000005",
  },
  [TriggerType.EVENT]: {
    id: "cf9a2faa-a6f4-470f-8dd9-8a23ddec8943",
    name: "Event",
    description: "Event Trigger",
    type: TriggerType.EVENT,
    category_id: "00000000-0000-0000-0000-000000000005",
  },
  [TriggerType.SCHEDULE]: {
    id: "ad35ca49-30fe-4b34-8b12-155bc3f0630e",
    name: "Schedule",
    description: "Schedule Trigger",
    type: TriggerType.SCHEDULE,
    category_id: "00000000-0000-0000-0000-000000000005",
  },
  [TriggerType.HTTP_REQUEST]: {
    id: "83c8d238-b97b-4dac-a6c1-6407e152c6da",
    name: "Http Request",
    description: "Http Request Trigger",
    type: TriggerType.HTTP_REQUEST,
    category_id: "00000000-0000-0000-0000-000000000005",
  },
};
