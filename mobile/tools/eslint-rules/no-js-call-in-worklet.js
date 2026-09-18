// Rule rationale: docs/mobile/architecture-book/lint-format.md (Worklet safety)
//
// A worklet may only call functions that were themselves workletized. Calling a
// plain JS function from the UI thread throws at runtime ("Tried to
// synchronously call a non-worklet function"), and nothing else catches it:
// TypeScript cannot see a string directive, and Jest runs the Reanimated mocks
// on the JS thread, where the call succeeds. Only a device does — which is why
// the rule exists.

const WORKLET_CALLBACK_CALLEES = new Set([
  "createWorkletRuntime",
  "runOnUI",
  "scheduleOnUI",
  "useAnimatedProps",
  "useAnimatedReaction",
  "useAnimatedScrollHandler",
  "useAnimatedStyle",
  "useDerivedValue",
  "useFrameCallback",
  "useWorkletCallback",
  "withDecay",
  "withSpring",
  "withTiming",
])

// Gesture builder callbacks (`Gesture.Pan().onUpdate(…)`) run on the UI thread.
const WORKLET_CALLBACK_METHODS = new Set([
  "onBegin",
  "onChange",
  "onEnd",
  "onFinalize",
  "onStart",
  "onTouchesCancelled",
  "onTouchesDown",
  "onTouchesMove",
  "onTouchesUp",
  "onUpdate",
])

const FUNCTION_TYPES = new Set([
  "ArrowFunctionExpression",
  "FunctionDeclaration",
  "FunctionExpression",
])

function hasWorkletDirective(node) {
  const body = node.body
  if (!body || body.type !== "BlockStatement") {
    return false
  }
  return body.body.some(
    (statement) =>
      statement.type === "ExpressionStatement" &&
      (statement.directive === "worklet" ||
        (statement.expression.type === "Literal" &&
          statement.expression.value === "worklet")),
  )
}

function calleeName(node) {
  if (node.callee.type === "Identifier") {
    return node.callee.name
  }
  if (
    node.callee.type === "MemberExpression" &&
    !node.callee.computed &&
    node.callee.property.type === "Identifier"
  ) {
    return node.callee.property.name
  }
  return null
}

// A function literal handed to `useAnimatedStyle(…)`, `onUpdate(…)`, or to an
// object passed to one of them (`useAnimatedScrollHandler({ onScroll })`).
function isWorkletCallbackArgument(node) {
  let argument = node
  let parent = node.parent
  if (parent?.type === "Property" && parent.value === node) {
    argument = parent.parent
    parent = argument.parent
  }
  if (
    parent?.type !== "CallExpression" ||
    !parent.arguments.includes(argument)
  ) {
    return false
  }
  const name = calleeName(parent)
  return (
    name !== null &&
    (WORKLET_CALLBACK_CALLEES.has(name) || WORKLET_CALLBACK_METHODS.has(name))
  )
}

function findVariable(scope, name) {
  for (let current = scope; current; current = current.upper) {
    const variable = current.variables.find((entry) => entry.name === name)
    if (variable) {
      return variable
    }
  }
  return null
}

function declaredFunction(definition) {
  if (definition.type === "FunctionName") {
    return definition.node
  }
  if (
    definition.type === "Variable" &&
    definition.node.init &&
    FUNCTION_TYPES.has(definition.node.init.type)
  ) {
    return definition.node.init
  }
  return null
}

function importSource(definition) {
  return definition.type === "ImportBinding"
    ? definition.parent.source.value
    : null
}

function importedName(definition) {
  const specifier = definition.node
  if (specifier.type === "ImportSpecifier") {
    return specifier.imported.name
  }
  return null
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow calling non-worklet functions from worklets (UI-thread crash).",
    },
    schema: [
      {
        type: "object",
        properties: {
          // { "<module>": true | ["<exported name>", …] } — `true` blesses the
          // whole module, a list blesses only those names.
          safeImports: {
            type: "object",
            additionalProperties: {
              oneOf: [
                { type: "boolean" },
                { type: "array", items: { type: "string" } },
              ],
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      localNotWorklet:
        '"{{name}}" runs on the UI thread here but is not a worklet — add the "worklet" directive to its body.',
      unsafeImport:
        '"{{name}}" is imported from "{{source}}" and called on the UI thread — make it a worklet and add it to the safeImports allowlist in eslint.config.js.',
    },
  },
  create(context) {
    const safeImports = context.options[0]?.safeImports ?? {}
    const sourceCode = context.sourceCode
    const workletDepth = []

    function isWorkletSafeImport(source, name) {
      const allowed = safeImports[source]
      if (allowed === true) {
        return true
      }
      return Array.isArray(allowed) && name !== null && allowed.includes(name)
    }

    function enterFunction(node) {
      workletDepth.push(
        workletDepth.at(-1) === true ||
          hasWorkletDirective(node) ||
          isWorkletCallbackArgument(node),
      )
    }

    function exitFunction() {
      workletDepth.pop()
    }

    return {
      ArrowFunctionExpression: enterFunction,
      "ArrowFunctionExpression:exit": exitFunction,
      FunctionDeclaration: enterFunction,
      "FunctionDeclaration:exit": exitFunction,
      FunctionExpression: enterFunction,
      "FunctionExpression:exit": exitFunction,
      CallExpression(node) {
        if (workletDepth.at(-1) !== true || node.callee.type !== "Identifier") {
          return
        }
        const name = node.callee.name
        const variable = findVariable(sourceCode.getScope(node), name)
        const definition = variable?.defs.at(0)
        if (!definition) {
          return
        }
        const source = importSource(definition)
        if (source !== null) {
          if (!isWorkletSafeImport(source, importedName(definition))) {
            context.report({
              node,
              messageId: "unsafeImport",
              data: { name, source },
            })
          }
          return
        }
        const target = declaredFunction(definition)
        if (target && !hasWorkletDirective(target)) {
          context.report({ node, messageId: "localNotWorklet", data: { name } })
        }
      },
    }
  },
}
