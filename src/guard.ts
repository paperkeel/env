export const DEFAULT_KEY_PREFIX = "replace_default_key_";
export const DEFAULT_KEY_HEX_LENGTH = 256;
export const LEGACY_DEFAULT_KEY = "__REPLACE_IN_INFISICAL__";

export function isDefaultKey(value: unknown): value is string {
	return (
		value === LEGACY_DEFAULT_KEY ||
		(typeof value === "string" && value.startsWith(DEFAULT_KEY_PREFIX))
	);
}

export function throwIfDefaultKey(value: string, keyName = "secret"): string {
	if (isDefaultKey(value)) {
		throw new Error(`${keyName} is a default key. Replace it in Infisical.`);
	}
	return value;
}

export const isPlaceholder = isDefaultKey;
export const assertReplaced = throwIfDefaultKey;
