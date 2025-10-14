import { HttpMethod, NodeType } from "../../../types";
import { httpRequest, resolveTemplate } from "../../../utils";

type ActionHandler = (node: any, context: any) => Promise<any>;

export const actionHandlers: Record<string, ActionHandler> = {
  [NodeType.SEND_EMAIL]: async (config, context) => {
    const { url, method = HttpMethod.POST, body = {} } = config;
    const resolvedBody = resolveTemplate(body, context);
    const res = await httpRequest(method, url, resolvedBody);
    return { success: true, status: res.status, ...res };
  },

  [NodeType.SEND_HTTP_REQUEST]: async (config, context) => {
    const { url, method = HttpMethod.GET, headers = {}, params = {}, body = {} } = config;
    const resolvedBody = resolveTemplate(body, context);
    const res = await httpRequest(method, url, resolvedBody);
    return { success: true, status: res.status, ...res };
  },

  [NodeType.UPDATE_DATABASE]: async (config, context) => {
    return { success: true, updated: true };
  },
};
