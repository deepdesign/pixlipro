/**
 * Code Sandbox Utilities
 * 
 * Provides safe execution of user-provided JavaScript code for animations.
 * Uses Function constructor with limited scope and whitelisted functions.
 */

/**
 * Whitelist of allowed Math functions
 */
const ALLOWED_MATH_FUNCTIONS = [
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
  'pow', 'sqrt', 'exp', 'log', 'log10', 'log2',
  'abs', 'ceil', 'floor', 'round', 'max', 'min',
  'random', 'PI', 'E', 'SQRT2', 'SQRT1_2', 'LN2', 'LN10',
  'LOG2E', 'LOG10E'
];

/**
 * Helper function for linear interpolation
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Helper function for smoothstep easing
 */
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Create a safe execution context for animation code
 */
function createSafeContext(variables: Record<string, any>): Record<string, any> {
  // Create Math object with only whitelisted functions
  const safeMath: Record<string, any> = {
    PI: Math.PI,
    E: Math.E,
    SQRT2: Math.SQRT2,
    SQRT1_2: Math.SQRT1_2,
    LN2: Math.LN2,
    LN10: Math.LN10,
    LOG2E: Math.LOG2E,
    LOG10E: Math.LOG10E,
  };

  // Add whitelisted Math functions
  for (const funcName of ALLOWED_MATH_FUNCTIONS) {
    if (funcName in Math && typeof (Math as any)[funcName] === 'function') {
      safeMath[funcName] = (Math as any)[funcName].bind(Math);
    } else if (funcName in Math) {
      safeMath[funcName] = (Math as any)[funcName];
    }
  }

  return {
    Math: safeMath,
    lerp,
    smoothstep,
    ...variables,
  };
}

/**
 * Execute a code function safely
 * 
 * @param code - JavaScript function code as string
 * @param variables - Variables to make available in the execution context
 * @param timeout - Maximum execution time in milliseconds (default: 100ms)
 * @returns The result of executing the code
 * @throws Error if code execution fails or times out
 */
export function executeCodeFunction(
  code: string,
  variables: Record<string, any> = {},
  timeout: number = 100
): any {
  try {
    // Create safe context
    const context = createSafeContext(variables);

    // Wrap code in a function that returns the result
    // This allows both expression mode and full function mode
    const wrappedCode = code.trim().startsWith('function') || code.trim().startsWith('(')
      ? code // Already a function
      : `function(t, phase) { return ${code}; }`; // Wrap expression

    // Create function with limited scope
    const func = new Function(
      ...Object.keys(context),
      `"use strict"; return (${wrappedCode});`
    );

    // Execute with timeout
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Code execution timeout'));
      }, timeout);

      try {
        const result = func(...Object.values(context));
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  } catch (error) {
    throw new Error(`Code execution failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Execute a code function synchronously (for simple expressions)
 * Note: This should only be used for simple, fast operations
 */
export function executeCodeFunctionSync(
  code: string,
  variables: Record<string, any> = {}
): any {
  try {
    const context = createSafeContext(variables);

    const wrappedCode = code.trim().startsWith('function') || code.trim().startsWith('(')
      ? code
      : `function(t, phase) { return ${code}; }`;

    const func = new Function(
      ...Object.keys(context),
      `"use strict"; return (${wrappedCode});`
    );

    return func(...Object.values(context));
  } catch (error) {
    throw new Error(`Code execution failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Validate code function syntax
 */
export function validateCodeFunction(code: string): { valid: boolean; error?: string } {
  try {
    // Try to parse the code
    const wrappedCode = code.trim().startsWith('function') || code.trim().startsWith('(')
      ? code
      : `function(t, phase) { return ${code}; }`;

    // Use Function constructor to validate syntax
    new Function(wrappedCode);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

