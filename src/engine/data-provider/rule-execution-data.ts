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

export const getVipMembershipInviteData = async (email?: string): Promise<SendHttpRequestConfig> => ({
  url: `${process.env.BIT_CORE_SERVER_URL}/users/v1/end-user/invites`,
  method: HttpMethod.POST,
  headers: {
    "Bit-Token": `${process.env.CHAINIT_BIT_TOKEN}`,
    Authorization: `Bearer ${process.env.CHAINIT_API_KEY}`,
    "X-Organization-Id": "{{ $.input.orgId }}",
  },
  body: {
    appName: "chainit",
    type: "MEMBERSHIP",
    email: email ?? "{{ $.input.email }}",
    lastName: "{{ $.input.firstName }}",
    firstName: "{{ $.input.lastName }}",
    orgId: "{{ $.input.orgId }}",
    roleIds: [17],
    jobTitle: "MEMBERSHIP",
    groupIds: ["d5fdacf6-7932-4ba1-a8ba-2b7fb5407219"], // VIP Group ID
  },
});

export const getPepCheckInviteData = async (email?: string): Promise<SendHttpRequestConfig> => ({
  url: `${process.env.BIT_CORE_SERVER_URL}/users/v1/end-user/invites`,
  method: HttpMethod.POST,
  headers: {
    "Bit-Token": `${process.env.CHAINIT_BIT_TOKEN}`,
    Authorization: `Bearer ${process.env.CHAINIT_API_KEY}`,
    "X-Organization-Id": "{{ $.input.orgId }}",
  },
  body: {
    type: "MEMBERSHIP",
    email: email ?? "{{ $.input.email }}",
    orgId: "{{ $.input.orgId }}",
    addons: [
      {
        addonType: "PEP_CHECK",
      },
    ],
    appName: "KYC",
    roleIds: [17],
    // groupIds: ["7dc6184e-2839-425d-8b69-200714b3a1a1"], // For Admin org
    groupIds: ["d6f51e8a-f9ac-4cf5-85dd-44365bc0a25a"], // Customers Group ID for 1 rutvik test org
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

export const getBeingIdData = async (userId: string) => ({
  url: `${process.env.BIT_CORE_SERVER_URL}/users/v1/end-user/users/${userId}/being-id`,
  method: HttpMethod.GET,
  headers: {
    "Bit-Token": `${process.env.CHAINIT_BIT_TOKEN}`,
    Authorization: `Bearer ${process.env.CHAINIT_API_KEY}`,
  },
  body: {},
});
