import { describe, expect, it } from "vitest";
import {
	DEFAULT_KEY_PREFIX,
	isDefaultKey,
	LEGACY_DEFAULT_KEY,
	throwIfDefaultKey,
} from "../src/guard.js";

describe("default key guard", () => {
	it("detects current and legacy default keys", () => {
		expect(isDefaultKey(`${DEFAULT_KEY_PREFIX}${"a".repeat(256)}`)).toBe(true);
		expect(isDefaultKey(LEGACY_DEFAULT_KEY)).toBe(true);
		expect(isDefaultKey("a-real-value")).toBe(false);
	});

	it("returns a replaced value", () => {
		expect(throwIfDefaultKey("a-real-value", "API_KEY")).toBe("a-real-value");
	});

	it("throws without exposing the value", () => {
		expect(() => throwIfDefaultKey(`${DEFAULT_KEY_PREFIX}abcdef`, "API_KEY")).toThrow(
			"API_KEY is a default key. Replace it in Infisical."
		);
	});
});
