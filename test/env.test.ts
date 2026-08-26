import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import { createBearfireEnv, createRequestEnv, secret } from "../src/index.js";

describe("Bearfire environment validation", () => {
	it("accepts a replaced server secret", () => {
		const env = createBearfireEnv({
			server: { API_KEY: secret("API_KEY") },
			runtimeEnv: { API_KEY: "a-real-value" },
		});
		expect(env.API_KEY).toBe("a-real-value");
		expectTypeOf(env.API_KEY).toEqualTypeOf<string>();
	});

	it("rejects a default server secret", () => {
		expect(() =>
			createBearfireEnv({
				server: { API_KEY: secret("API_KEY") },
				runtimeEnv: { API_KEY: `replace_default_key_${"a".repeat(256)}` },
			})
		).toThrow("API_KEY is a default key");
	});

	it("validates Worker request bindings", () => {
		const getEnv = createRequestEnv({
			server: { API_KEY: secret("API_KEY") },
		});
		const env = getEnv({ API_KEY: "worker-value" });
		expect(env.API_KEY).toBe("worker-value");
	});

	it("caches validated Worker request bindings", () => {
		const getEnv = createRequestEnv({
			server: { API_KEY: secret("API_KEY") },
		});
		const bindings = { API_KEY: "worker-value" };
		expect(getEnv(bindings)).toBe(getEnv(bindings));
	});

	it("rejects secret schemas in client variables", () => {
		expect(() =>
			createBearfireEnv({
				clientPrefix: "PUBLIC_",
				client: { PUBLIC_API_KEY: secret("PUBLIC_API_KEY") },
				runtimeEnv: { PUBLIC_API_KEY: "client-value" },
			})
		).toThrow("Client variable PUBLIC_API_KEY cannot use secret().");
	});

	it("rejects wrapped secret schemas in client variables", () => {
		expect(() =>
			createBearfireEnv({
				clientPrefix: "PUBLIC_",
				client: { PUBLIC_API_KEY: secret("PUBLIC_API_KEY").optional() },
				runtimeEnv: {},
			})
		).toThrow("Client variable PUBLIC_API_KEY cannot use secret().");
	});

	it("rejects lazy secret schemas in client variables", () => {
		expect(() =>
			createBearfireEnv({
				clientPrefix: "PUBLIC_",
				client: { PUBLIC_API_KEY: z.lazy(() => secret("PUBLIC_API_KEY")) },
				runtimeEnv: { PUBLIC_API_KEY: "client-value" },
			})
		).toThrow("Client variable PUBLIC_API_KEY cannot use secret().");
	});

	it("rejects secret schemas in shared variables", () => {
		expect(() =>
			createBearfireEnv({
				clientPrefix: "PUBLIC_",
				shared: { PUBLIC_API_KEY: secret("PUBLIC_API_KEY") },
				runtimeEnv: { PUBLIC_API_KEY: "client-value" },
			})
		).toThrow("Shared variable PUBLIC_API_KEY cannot use secret().");
	});
});
