import { ActionName, HttpMethod } from "../../../types";
import { httpRequest } from "../../../utils";

type ActionHandler = (node: any, context: any) => Promise<any>;

export const actionHandlers: Record<string, ActionHandler> = {
  [ActionName.SEND_EMAIL]: async (action, context) => {
    const { url, method = HttpMethod.POST, body = {} } = action.params;

    const resolvedBody = resolveValue(body, context);
    const res = await httpRequest(method, url, resolvedBody);

    return { success: true, status: res.status };
  },

  [ActionName.SEND_HTTP_REQUEST]: async (action, context) => {
    const { url, method = HttpMethod.GET, headers = {}, params = {}, body = {} } = action.params;

    const resolvedBody = resolveValue(body, context);
    const res = await httpRequest(method, url, resolvedBody);

    return { success: true, data: res.data };
  },

  [ActionName.UPDATE_DATABASE]: async (action, context) => {
    // Example only
    return { success: true, updated: true };
  },
};

function resolvePath(obj: any, path: string) {
  return path.split(".").reduce((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return acc[part];
    }
    return undefined;
  }, obj);
}

function resolveValue(value: any, context: any) {
  return JSON.parse(
    JSON.stringify(value).replace(/\{\{(.*?)\}\}/g, (_, expr) => {
      const key = expr.trim();
      if (key.startsWith("$.")) return resolvePath(context, key.slice(2)) ?? "";
      return context[key] ?? "";
    })
  );
}
