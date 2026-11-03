type MessageTree = Record<string, unknown>;

type MessageValues = Record<string, string | number>;

function resolvePath(messages: MessageTree, path: string): unknown {
  return path.split(".").reduce<unknown>((value, segment) => {
    if (!value || typeof value !== "object") {
      return undefined;
    }

    return (value as MessageTree)[segment];
  }, messages);
}

function formatMessage(template: string, values?: MessageValues) {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}

export function getMessage(
  messages: unknown,
  path: string,
  fallback: string,
  values?: MessageValues,
) {
  if (!messages || typeof messages !== "object") {
    return formatMessage(fallback, values);
  }

  const resolved = resolvePath(messages as MessageTree, path);
  if (typeof resolved !== "string") {
    return formatMessage(fallback, values);
  }

  return formatMessage(resolved, values);
}
