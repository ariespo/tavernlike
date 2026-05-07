import type { VarsPatch } from './types';

export function parseVarsBlock(raw: string): VarsPatch {
  const trimmed = raw.trim();
  if (!trimmed) return { merge: {} };
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { merge: parsed as Record<string, any> };
    }
    return { merge: {} };
  } catch {
    return { merge: {} };
  }
}

export function applyVarsPatch(
  existing: Record<string, any>,
  patch: VarsPatch,
): Record<string, any> {
  return deepMerge(existing, patch.merge);
}

function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = out[key];
    if (Array.isArray(sv)) {
      out[key] = [...sv];
    } else if (sv && typeof sv === 'object' && tv && typeof tv === 'object' && !Array.isArray(tv)) {
      out[key] = deepMerge(tv, sv);
    } else {
      out[key] = sv;
    }
  }
  return out;
}
