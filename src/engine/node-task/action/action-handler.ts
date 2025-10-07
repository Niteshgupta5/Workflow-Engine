import { ActionName, HttpMethod } from "../../../types";
import { httpRequest, resolveTemplate } from "../../../utils";

type ActionHandler = (node: any, context: any) => Promise<any>;

export const actionHandlers: Record<string, ActionHandler> = {
  [ActionName.SEND_EMAIL]: async (action, context) => {
    const { url, method = HttpMethod.POST, body = {} } = action.params;

    const resolvedBody = resolveTemplate(body, context);
    const res = await httpRequest(method, url, resolvedBody);

    return { success: true, status: res.status };
  },

  [ActionName.SEND_HTTP_REQUEST]: async (action, context) => {
    const { url, method = HttpMethod.GET, headers = {}, params = {}, body = {} } = action.params;

    const resolvedBody = resolveTemplate(body, context);
    const res = await httpRequest(method, url, resolvedBody);

    return { success: true, data: res.data };
  },

  [ActionName.UPDATE_DATABASE]: async (action, context) => {
    // Example only
    return { success: true, updated: true };
  },
};
