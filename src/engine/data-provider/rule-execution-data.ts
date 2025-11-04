import { HttpMethod, SendHttpRequestConfig } from "../../types";

export const getRuleExecutionData = async (ruleId: string): Promise<SendHttpRequestConfig> => ({
  url: `https://develop-api.chainit.online/rule-engine/v1/rule/evaluate?ruleId=${ruleId}`,
  method: HttpMethod.GET,
  headers: {
    "Bit-Token": `${process.env.CHAINIT_BIT_TOKEN}`,
    Authorization: `Bearer ${process.env.CHAINIT_API_KEY}`,
  },
  body: {},
});
