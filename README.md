# @bearfire-dev/env

Use T3 Env and Zod 4 with Bearfire defaults. The package has no bundled runtime dependencies.

## Install

Authenticate to GitHub Packages with `read:packages`, then install the package.

Add the GitHub Packages registry to `.npmrc`:

```ini
@bearfire-dev:registry=https://npm.pkg.github.com
```

```bash
pnpm add @bearfire-dev/env @t3-oss/env-core zod
```

## Node

```ts
import { createBearfireEnv, secret } from "@bearfire-dev/env";
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
import { createRequestEnv, secret } from "@bearfire-dev/env";

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
import { isDefaultKey, throwIfDefaultKey } from "@bearfire-dev/env/guard";
```

The guard rejects `replace_default_key_` values and the legacy Infisical placeholder.
