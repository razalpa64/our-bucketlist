export type Toast = { id: number; kind: "success" | "error" | "info"; text: string };

type Listener = (t: Toast) => void;
const listeners = new Set<Listener>();
let nextId = 1;

export function onToast(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function toast(text: string, kind: Toast["kind"] = "info") {
  const t = { id: nextId++, kind, text };
  listeners.forEach((fn) => fn(t));
}
