import axios, { Method } from "axios";
import { refreshChainItTokenData } from "../engine";

export async function httpRequest<T = any>(
  method: Method,
  endpoint: string,
  data?: Record<string, any>,
  headers?: Record<string, any>,
  refreshSession: boolean = false
): Promise<T> {
  try {
    let updatedHeaders = { ...headers };
    if (refreshSession) {
      const response = await refreshAuthToken();
      updatedHeaders = {
        ...updatedHeaders,
        Authorization: `Bearer ${response.accessToken}`,
        "Bit-Token": response.bitToken,
      };
    }
    const response = await axios({
      method,
      url: `${endpoint}`,
      data,
      headers: updatedHeaders,
    });
    return response.data;
  } catch (error: any) {
    console.error(`HTTP ${method} ${endpoint} failed:`, error.message);
    throw error;
  }
}

export async function refreshAuthToken(): Promise<any> {
  try {
    console.log("Execute Refresh Token Api");
    const { url, method, body, headers } = await refreshChainItTokenData();
    const response = await axios({
      method,
      url,
      data: body,
      headers,
    });
    return response.data;
  } catch (error: any) {
    console.error(`Refresh Token Api Failed:`, error.message);
    throw error;
  }
}
