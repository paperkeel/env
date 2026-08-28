# @paperkeel/env

This internal Bearfire package adds Bearfire defaults to [T3 Env](https://github.com/t3-oss/t3-env) and [Zod 4](https://zod.dev/).

It works with our [Infisical infrastructure-as-code system](https://github.com/paperkeel/infisical-iac). That system manages secret contracts and syncs secrets to application environments. This package validates those values at runtime and rejects Infisical placeholder values.

This package is not intended or supported for external use.

## Attribution

This package builds on [`@t3-oss/env-core`](https://github.com/t3-oss/t3-env) and [`zod`](https://github.com/colinhacks/zod). We thank their maintainers and contributors. Both packages remain peer dependencies and are not bundled.

## Install

Authenticate to GitHub Packages with `read:packages`, then install the package.

Add the GitHub Packages registry to `.npmrc`:

```ini
@paperkeel:registry=https://npm.pkg.github.com
```

```bash
pnpm add @paperkeel/env @t3-oss/env-core zod
```

## Node

```ts
import { createBearfireEnv, secret } from "@paperkeel/env";
import { z } from "zod";

export const env = createBearfireEnv({
	server: {
		DATABASE_URL: z.url(),
		BETTER_AUTH_SECRET: secret("BETTER_AUTH_SECRET"),
	},
	runtimeEnv: process.env,
});
```

## Cloudflare Workers

Workers receive variables through request bindings. Supply those bindings as `runtimeEnv` during request handling.

```ts
import { createRequestEnv, secret } from "@paperkeel/env";

const getEnv = createRequestEnv({
	server: { SHARED_KEY: secret("SHARED_KEY") },
});

export default {
	fetch(_request: Request, bindings: Env) {
		const env = getEnv(bindings);
		return new Response(env.SHARED_KEY.length.toString());
	},
};
```

The helper validates one time for each Worker bindings object.

## Guard only

```ts
import { isDefaultKey, throwIfDefaultKey } from "@paperkeel/env/guard";
```

The guard rejects `replace_default_key_` values and the legacy Infisical placeholder.
