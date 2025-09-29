import axios, { Method } from "axios";

export async function httpRequest<T = any>(method: Method, endpoint: string, data?: any): Promise<T> {
  try {
    const response = await axios({
      method,
      url: `${endpoint}`,
      data,
    });
    return response.data;
  } catch (error: any) {
    console.error(`HTTP ${method} ${endpoint} failed:`, error.message);
    throw error;
  }
}
