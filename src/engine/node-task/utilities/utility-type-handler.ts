import _ from "lodash";
import { CodeBlockRule, DataObject, NodeType, UtilityMap } from "../../../types";
import { executeCodeBlock, resolveTemplate } from "../../../utils";

export type UtilityTypeHandler<T extends keyof UtilityMap> = (
  data: any,
  rules: UtilityMap[T],
  context: Record<string, any>
) => Promise<string | number | DataObject>;

export const utilityTypeHandlers: {
  [K in keyof UtilityMap]: UtilityTypeHandler<K>;
} = {
  [NodeType.CODE_BLOCK]: async (data, rules: CodeBlockRule, context) => {
    const { expression, language } = rules;
    const codeToExecute = expression;

    if (!codeToExecute) {
      throw new Error("No code or expression provided");
    }

    const execContext = {
      ...context,
      data,
      // input: data, // Here data is prev output
      _,
    };
    const resolvedCode = resolveTemplate(codeToExecute, execContext, true);
    const result = await executeCodeBlock(resolvedCode, language);

    return result;
  },
};
