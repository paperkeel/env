import {
	createEnv,
	type CreateEnv,
	type DefaultCombinedSchema,
	type EnvOptions as CoreEnvOptions,
	type StandardSchemaDictionary,
	type StandardSchemaV1,
} from "@t3-oss/env-core";
import { z } from "zod";
import { isDefaultKey } from "./guard.js";

export * from "./guard.js";

const secretSchemas = new WeakSet<object>();

export function secret(keyName = "secret") {
	const schema = z
		.string()
		.min(1, `${keyName} is required.`)
		.refine((value): boolean => !isDefaultKey(value), {
			message: `${keyName} is a default key. Replace it in Infisical.`,
		});
	secretSchemas.add(schema);
	return schema;
}

type ValidationIssue = {
	message?: string;
	path?: readonly PropertyKey[];
};

function defaultValidationError(issues: readonly ValidationIssue[]): never {
	const messages = issues.map((issue) => {
		const path = issue.path?.map(String).join(".");
		return path ? `${path}: ${issue.message ?? "invalid value"}` : issue.message ?? "invalid value";
	});
	throw new Error(`Invalid environment variables:\n${messages.join("\n")}`);
}

type EnvOptions = {
	emptyStringAsUndefined?: boolean;
	onValidationError?: (issues: readonly ValidationIssue[]) => never;
	[key: string]: unknown;
};

const callCreateEnv = createEnv as unknown as (options: EnvOptions) => unknown;

function createBearfireEnvInternal(options: EnvOptions): unknown {
	const client = options.client;
	if (client && typeof client === "object") {
		for (const [name, schema] of Object.entries(client)) {
			if (schema && typeof schema === "object" && secretSchemas.has(schema)) {
				throw new Error(`Client variable ${name} cannot use secret().`);
			}
		}
	}
	return callCreateEnv({
		emptyStringAsUndefined: true,
		onValidationError: defaultValidationError,
		...options,
	});
}

export const createBearfireEnv = createBearfireEnvInternal as unknown as typeof createEnv;

type RuntimeEnv = Record<string, string | boolean | number | undefined>;

type RequestEnvOptions<
	TPrefix extends string | undefined,
	TServer extends StandardSchemaDictionary,
	TClient extends StandardSchemaDictionary,
	TShared extends StandardSchemaDictionary,
	TExtends extends Array<Record<string, unknown>>,
	TFinalSchema extends StandardSchemaV1<{}, {}>,
> = Omit<
	CoreEnvOptions<TPrefix, TServer, TClient, TShared, TExtends, TFinalSchema>,
	"runtimeEnv" | "runtimeEnvStrict"
>;

/** Create one validator and cache its result for each Worker bindings object. */
export function createRequestEnv<
	TPrefix extends string | undefined,
	TServer extends StandardSchemaDictionary = NonNullable<unknown>,
	TClient extends StandardSchemaDictionary = NonNullable<unknown>,
	TShared extends StandardSchemaDictionary = NonNullable<unknown>,
	const TExtends extends Array<Record<string, unknown>> = [],
	TFinalSchema extends StandardSchemaV1<{}, {}> = DefaultCombinedSchema<TServer, TClient, TShared>,
>(
	options: RequestEnvOptions<TPrefix, TServer, TClient, TShared, TExtends, TFinalSchema>
): (runtimeEnv: RuntimeEnv) => CreateEnv<TFinalSchema, TExtends> {
	const cache = new WeakMap<object, CreateEnv<TFinalSchema, TExtends>>();
	return (runtimeEnv) => {
		const cached = cache.get(runtimeEnv);
		if (cached) return cached;

		const validated = createBearfireEnvInternal({
			...(options as EnvOptions),
			runtimeEnv,
		}) as CreateEnv<TFinalSchema, TExtends>;
		cache.set(runtimeEnv, validated);
		return validated;
	};
}
