import { CodeBlockLanguage } from "../types";

/**
 * Language configuration with compiler/interpreter details
 */
export interface LanguageConfig {
  command: string;
  args?: string[];
  fileExtension: string;
  needsCompilation: boolean;
  compileCommand?: string;
  compileArgs?: (sourceFile: string, outputFile: string) => string[];
  runArgs?: (file: string) => string[];
  supportsStdin?: boolean;
}

export const LANGUAGE_CONFIGS: Record<CodeBlockLanguage, LanguageConfig> = {
  [CodeBlockLanguage.JAVASCRIPT]: {
    command: "node",
    fileExtension: ".js",
    needsCompilation: false,
    runArgs: (file) => [file],
    supportsStdin: true,
  },

  [CodeBlockLanguage.PYTHON]: {
    command: "python3",
    fileExtension: ".py",
    needsCompilation: false,
    runArgs: (file) => [file],
    supportsStdin: true,
  },
};
