import path from "path";
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

  [CodeBlockLanguage.TYPESCRIPT]: {
    command: "ts-node",
    fileExtension: ".ts",
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

  [CodeBlockLanguage.PHP]: {
    command: "php",
    fileExtension: ".php",
    needsCompilation: false,
    runArgs: (file) => [file],
    supportsStdin: true,
  },

  [CodeBlockLanguage.RUBY]: {
    command: "ruby",
    fileExtension: ".rb",
    needsCompilation: false,
    runArgs: (file) => [file],
    supportsStdin: true,
  },

  [CodeBlockLanguage.GO]: {
    command: "go",
    fileExtension: ".go",
    needsCompilation: false,
    runArgs: (file) => ["run", file],
    supportsStdin: true,
  },

  [CodeBlockLanguage.RUST]: {
    command: "rustc",
    fileExtension: ".rs",
    needsCompilation: true,
    compileCommand: "rustc",
    compileArgs: (src, out) => [src, "-o", out],
    runArgs: (file) => [file],
    supportsStdin: true,
  },

  [CodeBlockLanguage.JAVA]: {
    command: "javac",
    fileExtension: ".java",
    needsCompilation: true,
    compileCommand: "javac",
    compileArgs: (src) => [src],
    runArgs: (file) => {
      const className = path.basename(file, ".java");
      return ["java", "-cp", path.dirname(file), className];
    },
    supportsStdin: true,
  },

  [CodeBlockLanguage.C]: {
    command: "gcc",
    fileExtension: ".c",
    needsCompilation: true,
    compileCommand: "gcc",
    compileArgs: (src, out) => [src, "-o", out],
    runArgs: (file) => [file],
    supportsStdin: true,
  },

  [CodeBlockLanguage.CPP]: {
    command: "g++",
    fileExtension: ".cpp",
    needsCompilation: true,
    compileCommand: "g++",
    compileArgs: (src, out) => [src, "-o", out, "-std=c++17"],
    runArgs: (file) => [file],
    supportsStdin: true,
  },

  [CodeBlockLanguage.CSHARP]: {
    command: "csc",
    fileExtension: ".cs",
    needsCompilation: true,
    compileCommand: "csc",
    compileArgs: (src, out) => [`/out:${out}.exe`, src],
    runArgs: (file) => ["mono", `${file}.exe`],
    supportsStdin: true,
  },

  [CodeBlockLanguage.KOTLIN]: {
    command: "kotlinc",
    fileExtension: ".kt",
    needsCompilation: true,
    compileCommand: "kotlinc",
    compileArgs: (src, out) => [src, "-include-runtime", "-d", `${out}.jar`],
    runArgs: (file) => ["java", "-jar", `${file}.jar`],
    supportsStdin: true,
  },

  [CodeBlockLanguage.SHELL]: {
    command: "bash",
    fileExtension: ".sh",
    needsCompilation: false,
    runArgs: (file) => [file],
    supportsStdin: true,
  },

  [CodeBlockLanguage.PERL]: {
    command: "perl",
    fileExtension: ".pl",
    needsCompilation: false,
    runArgs: (file) => [file],
    supportsStdin: true,
  },
};
