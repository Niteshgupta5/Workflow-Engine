import { HttpMethod, SendHttpRequestConfig } from "../../types";

export const getRuleExecutionData = async (ruleId: string, userId: string): Promise<SendHttpRequestConfig> => ({
  url: `${process.env.BIT_CORE_SERVER_URL}/rule-engine/v1/rule/evaluate?ruleId=${ruleId}&userId=${userId}`,
  method: HttpMethod.GET,
  headers: {
    "Bit-Token": `${process.env.CHAINIT_BIT_TOKEN}`,
    Authorization: `Bearer ${process.env.CHAINIT_API_KEY}`,
  },
  body: {},
});

export const getVipMembershipInviteData = async (email: string): Promise<SendHttpRequestConfig> => ({
  url: `${process.env.BIT_CORE_SERVER_URL}/users/v1/end-user/invites`,
  method: HttpMethod.POST,
  headers: {
    "Bit-Token": `${process.env.CHAINIT_BIT_TOKEN}`,
    Authorization: `Bearer ${process.env.CHAINIT_API_KEY}`,
    "X-Organization-Id": "00000000-0000-0000-0000-000000000000",
  },
  body: {
    appName: "chainit",
    type: "MEMBERSHIP",
    email,
    lastName: "{{ $.input.firstName }}",
    firstName: "{{ $.input.lastName }}",
    orgId: "00000000-0000-0000-0000-000000000000",
    roleIds: [17],
    jobTitle: "MEMBERSHIP",
    groupIds: ["d5fdacf6-7932-4ba1-a8ba-2b7fb5407219"], // VIP Group ID
  },
});

export const getPepCheckInviteData = async (email: string): Promise<SendHttpRequestConfig> => ({
  url: `${process.env.BIT_CORE_SERVER_URL}/users/v1/end-user/invites`,
  method: HttpMethod.POST,
  headers: {
    "Bit-Token": `${process.env.CHAINIT_BIT_TOKEN}`,
    Authorization: `Bearer ${process.env.CHAINIT_API_KEY}`,
    "X-Organization-Id": "00000000-0000-0000-0000-000000000000",
  },
  body: {
    type: "MEMBERSHIP",
    email,
    orgId: "00000000-0000-0000-0000-000000000000",
    addons: [
      {
        addonType: "PEP_CHECK",
      },
    ],
    appName: "KYC",
    roleIds: [17],
    groupIds: ["7dc6184e-2839-425d-8b69-200714b3a1a1"],
    jobTitle: "",
    lastName: "{{ $.input.firstName }}",
    firstName: "{{ $.input.lastName }}",
  },
});

export const refreshChainItTokenData = async (): Promise<SendHttpRequestConfig> => ({
  url: `${process.env.BIT_CORE_SERVER_URL}/users/v1/admin/auth/refresh-token`,
  method: HttpMethod.POST,
  headers: {
    "Bit-Token": `${process.env.CHAINIT_BIT_TOKEN}`,
    Authorization: `Bearer ${process.env.CHAINIT_API_KEY}`,
  },
  body: {
    clientId: `${process.env.BIT_CORE_CLIENT_ID}`,
    refreshToken: `${process.env.BIT_CORE_REFRESH_TOKEN}`,
    platform: "ADMIN_PORTAL",
  },
});
