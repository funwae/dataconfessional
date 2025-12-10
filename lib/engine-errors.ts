// Error handling and user-friendly error messages for engine operations

export class EngineError extends Error {
  constructor(
    message: string,
    public code: EngineErrorCode,
    public userMessage: string,
    public recoveryAction?: string
  ) {
    super(message);
    this.name = 'EngineError';
  }
}

export enum EngineErrorCode {
  OLLAMA_NOT_REACHABLE = 'OLLAMA_NOT_REACHABLE',
  MODEL_MISSING = 'MODEL_MISSING',
  TIMEOUT = 'TIMEOUT',
  RUNTIME_ERROR = 'RUNTIME_ERROR',
  OOM = 'OOM',
  PROMPT_TOO_LARGE = 'PROMPT_TOO_LARGE',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Parse error from Rust backend and convert to user-friendly message
 */
export function parseEngineError(error: any): EngineError {
  const errorString = error?.toString() || String(error);

  // Check for specific error patterns
  if (errorString.includes('Failed to connect to Ollama') ||
      errorString.includes('connection refused') ||
      errorString.includes('Ollama is not available')) {
    return new EngineError(
      errorString,
      EngineErrorCode.OLLAMA_NOT_REACHABLE,
      "The booth can't reach your local AI engine. Make sure Ollama is installed and running, then retry.",
      "Open engine setup"
    );
  }

  if (errorString.includes('missing') && errorString.includes('model')) {
    return new EngineError(
      errorString,
      EngineErrorCode.MODEL_MISSING,
      "This engine pack is missing one or more models. Reinstall the pack to fix this.",
      "Repair this pack"
    );
  }

  if (errorString.includes('timeout') || errorString.includes('took too long')) {
    return new EngineError(
      errorString,
      EngineErrorCode.TIMEOUT,
      "This question took too long to answer. Try a shorter question, or simplify the data summary.",
      undefined
    );
  }

  if (errorString.includes('OOM') || errorString.includes('out of memory') || errorString.includes('resource limit')) {
    return new EngineError(
      errorString,
      EngineErrorCode.OOM,
      "The model ran into a resource limit on your machine. Try switching to a lighter engine pack in settings.",
      "Open engine settings"
    );
  }

  if (errorString.includes('context') && errorString.includes('too large')) {
    return new EngineError(
      errorString,
      EngineErrorCode.PROMPT_TOO_LARGE,
      "The data summary is too large. Try reducing the amount of data or splitting into smaller questions.",
      undefined
    );
  }

  // Default unknown error
  return new EngineError(
    errorString,
    EngineErrorCode.UNKNOWN,
    "An unexpected error occurred. Check the engine settings for more details.",
    "Open engine settings"
  );
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(error: any): string {
  if (error instanceof EngineError) {
    return error.userMessage;
  }

  const parsed = parseEngineError(error);
  return parsed.userMessage;
}

/**
 * Get recovery action suggestion
 */
export function getRecoveryAction(error: any): string | undefined {
  if (error instanceof EngineError) {
    return error.recoveryAction;
  }

  const parsed = parseEngineError(error);
  return parsed.recoveryAction;
}

