import { EmailOptions, HttpMethod, NodeType, SendEmail } from "../../../types";
import { httpRequest, resolveTemplate, sendEmail } from "../../../utils";

type ActionHandler = (node: any, context: any) => Promise<any>;

export const actionHandlers: Record<string, ActionHandler> = {
  [NodeType.SEND_EMAIL]: async (config, context) => {
    const { from, to, subject, message }: SendEmail = config;
    const resolvedBody: EmailOptions = resolveTemplate({ from, to, subject, message }, context);
    const res = await sendEmail(resolvedBody);
    return { success: true, ...res };
  },

  [NodeType.SEND_HTTP_REQUEST]: async (config, context) => {
    const { url, method = HttpMethod.GET, headers = {}, params = {}, body = {} } = config;
    const resolvedBody = resolveTemplate(body, context);
    const res = await httpRequest(method, url, resolvedBody, headers);
    console.log("=====>res", res);
    return { success: true, status: "success", response: res };
  },

  [NodeType.UPDATE_DATABASE]: async (config, context) => {
    return { success: true, updated: true };
  },
};
