#  Nx Repository

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ Your new, shiny [Nx workspace](https://nx.dev) is ready ✨.

[Learn more about this workspace setup and its capabilities](https://nx.dev/docs/technologies/typescript/introduction?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created. Now, let's get you up to speed!

🚀 If you haven't connected to Nx Cloud yet, [complete your setup here](https://cloud.nx.app/get-started). Get faster builds with remote caching, distributed task execution, and self-healing CI. [See how your workspace can benefit](#nx-cloud).

## Generate a library

```sh
npx nx g @nx/js:lib packages/pkg1 --publishable --importPath=@my-org/pkg1
```

## Run tasks

To build the library use:

```sh
npx nx run pkg1:build
```

To run any task with Nx use:

```sh
npx nx run <project-name>:<target>
```

These targets are either [inferred automatically](https://nx.dev/docs/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/docs/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Versioning and releasing

To version and release the library use

```
npx nx release
```

Pass `--dry-run` to see what would happen without actually releasing the library.

[Learn more about Nx release &raquo;](https://nx.dev/docs/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Keep TypeScript project references up to date

Nx automatically updates TypeScript [project references](https://www.typescriptlang.org/docs/handbook/project-references.html) in `tsconfig.json` files to ensure they remain accurate based on your project dependencies (`import` or `require` statements). This sync is automatically done when running tasks such as `build` or `typecheck`, which require updated references to function correctly.

To manually trigger the process to sync the project graph dependencies information to the TypeScript project references, run the following command:

```sh
npx nx sync
```

You can enforce that the TypeScript project references are always in the correct state when running in CI by adding a step to your CI job configuration that runs the following command:

```sh
npx nx sync:check
```

[Learn more about nx sync](https://nx.dev/reference/nx-commands#sync)

## Nx Cloud

Nx Cloud ensures a [fast and scalable CI](https://nx.dev/nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/docs/features/ci-features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/docs/features/ci-features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/docs/features/ci-features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/docs/features/ci-features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Set up CI (non-Github Actions CI)

**Note:** This is only required if your CI provider is not GitHub Actions.

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/docs/features/ci-features?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/docs/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## 🔗 Learn More

- [Nx Documentation](https://nx.dev/docs)
- [Crafting Your Workspace Tutorial](https://nx.dev/docs/getting-started/tutorials/crafting-your-workspace)
- [Module Boundaries](https://nx.dev/docs/features/enforce-module-boundaries)
- [Releasing Packages](https://nx.dev/docs/features/manage-releases)
- [Nx Plugins](https://nx.dev/docs/concepts/nx-plugins)
- [Nx Cloud](https://nx.dev/nx-cloud)

## 💬 Community

Join the Nx community:

- [Discord](https://go.nx.dev/community)
- [X (Twitter)](https://twitter.com/nxdevtools)
- [LinkedIn](https://www.linkedin.com/company/nrwl)
- [YouTube](https://www.youtube.com/@nxdevtools)
- [Blog](https://nx.dev/blog)




bondgrid2
├─ .nx
├─ .prettierignore
├─ .prettierrc
├─ apps
│  ├─ api
│  │  ├─ eslint.config.mjs
│  │  ├─ jest.config.cts
│  │  ├─ package.json
│  │  ├─ src
│  │  │  ├─ assets
│  │  │  └─ main.ts
│  │  ├─ tsconfig.app.json
│  │  ├─ tsconfig.json
│  │  ├─ tsconfig.spec.json
│  │  └─ webpack.config.js
│  ├─ api-e2e
│  │  ├─ .spec.swcrc
│  │  ├─ eslint.config.mjs
│  │  ├─ jest.config.cts
│  │  ├─ package.json
│  │  ├─ src
│  │  │  ├─ api
│  │  │  │  └─ api.spec.ts
│  │  │  └─ support
│  │  │     ├─ global-setup.ts
│  │  │     ├─ global-teardown.ts
│  │  │     └─ test-setup.ts
│  │  └─ tsconfig.json
│  ├─ web
│  │  ├─ .swcrc
│  │  ├─ eslint.config.mjs
│  │  ├─ index.d.ts
│  │  ├─ jest.config.cts
│  │  ├─ next-env.d.ts
│  │  ├─ next.config.js
│  │  ├─ package.json
│  │  ├─ public
│  │  │  └─ favicon.ico
│  │  ├─ specs
│  │  │  └─ index.spec.tsx
│  │  ├─ src
│  │  │  ├─ app
│  │  │  │  ├─ api
│  │  │  │  │  └─ hello
│  │  │  │  ├─ global.css
│  │  │  │  ├─ page.module.css
│  │  │  │  └─ page.tsx
│  │  │  ├─ components
│  │  │  │  ├─ graph
│  │  │  │  └─ ui
│  │  │  ├─ features
│  │  │  │  ├─ auth
│  │  │  │  ├─ dashboard
│  │  │  │  ├─ graph
│  │  │  │  ├─ import
│  │  │  │  ├─ people
│  │  │  │  ├─ relationships
│  │  │  │  ├─ search
│  │  │  │  └─ settings
│  │  │  ├─ hooks
│  │  │  ├─ lib
│  │  │  ├─ services
│  │  │  ├─ stores
│  │  │  ├─ styles
│  │  │  └─ types
│  │  ├─ tsconfig.json
│  │  └─ tsconfig.spec.json
│  └─ web-e2e
│     ├─ eslint.config.mjs
│     ├─ package.json
│     ├─ playwright.config.mts
│     ├─ src
│     │  └─ example.spec.ts
│     └─ tsconfig.json
├─ eslint.config.mjs
├─ jest.config.ts
├─ jest.preset.js
├─ nx.json
├─ package-lock.json
├─ package.json
├─ packages
├─ README.md
├─ tsconfig.base.json
└─ tsconfig.json

``````
```
bondgrid2
├─ .agents
├─ .nx
├─ .prettierignore
├─ .prettierrc
├─ apps
│  ├─ api
│  │  ├─ eslint.config.mjs
│  │  ├─ jest.config.cts
│  │  ├─ package.json
│  │  ├─ src
│  │  │  ├─ app.ts
│  │  │  ├─ assets
│  │  │  ├─ config
│  │  │  │  └─ env.ts
│  │  │  ├─ database
│  │  │  │  └─ neo4j.ts
│  │  │  ├─ main.ts
│  │  │  ├─ middleware
│  │  │  │  ├─ error.middleware.ts
│  │  │  │  └─ notFound.middleware.ts
│  │  │  ├─ modules
│  │  │  │  ├─ audit
│  │  │  │  │  ├─ audit.controller.ts
│  │  │  │  │  ├─ audit.repository.ts
│  │  │  │  │  ├─ audit.service.ts
│  │  │  │  │  ├─ audit.types.ts
│  │  │  │  │  └─ index.ts
│  │  │  │  ├─ auth
│  │  │  │  │  ├─ auth.controller.ts
│  │  │  │  │  ├─ auth.middleware.ts
│  │  │  │  │  ├─ auth.repository.ts
│  │  │  │  │  ├─ auth.schema.ts
│  │  │  │  │  ├─ auth.service.ts
│  │  │  │  │  ├─ auth.types.ts
│  │  │  │  │  └─ index.ts
│  │  │  │  ├─ dashboard
│  │  │  │  │  ├─ dashboard.controller.ts
│  │  │  │  │  ├─ dashboard.repository.ts
│  │  │  │  │  ├─ dashboard.service.ts
│  │  │  │  │  ├─ dashboard.types.ts
│  │  │  │  │  └─ index.ts
│  │  │  │  ├─ events
│  │  │  │  │  ├─ event.controller.ts
│  │  │  │  │  ├─ event.repository.ts
│  │  │  │  │  ├─ event.schema.ts
│  │  │  │  │  ├─ event.service.ts
│  │  │  │  │  ├─ event.types.ts
│  │  │  │  │  └─ index.ts
│  │  │  │  ├─ graph
│  │  │  │  ├─ organizations
│  │  │  │  │  ├─ index.ts
│  │  │  │  │  ├─ organization.controller.ts
│  │  │  │  │  ├─ organization.repository.ts
│  │  │  │  │  ├─ organization.schema.ts
│  │  │  │  │  ├─ organization.service.ts
│  │  │  │  │  └─ organization.types.ts
│  │  │  │  ├─ people
│  │  │  │  │  ├─ index.ts
│  │  │  │  │  ├─ people.controller.ts
│  │  │  │  │  ├─ people.index.ts
│  │  │  │  │  ├─ people.repository.ts
│  │  │  │  │  ├─ people.schema.ts
│  │  │  │  │  ├─ people.service.ts
│  │  │  │  │  ├─ people.types.ts
│  │  │  │  │  └─ people.validation.ts
│  │  │  │  ├─ relationships
│  │  │  │  │  ├─ index.ts
│  │  │  │  │  ├─ relationship.constants.ts
│  │  │  │  │  ├─ relationship.controller.ts
│  │  │  │  │  ├─ relationship.errors.ts
│  │  │  │  │  ├─ relationship.registry.ts
│  │  │  │  │  ├─ relationship.repository.ts
│  │  │  │  │  ├─ relationship.resolver.ts
│  │  │  │  │  ├─ relationship.schema.ts
│  │  │  │  │  ├─ relationship.service.ts
│  │  │  │  │  ├─ relationship.types.ts
│  │  │  │  │  └─ relationship.validation.ts
│  │  │  │  └─ uploads
│  │  │  │     ├─ cloudinary.service.ts
│  │  │  │     ├─ index.ts
│  │  │  │     ├─ multer.ts
│  │  │  │     ├─ upload.controller.ts
│  │  │  │     ├─ upload.service.ts
│  │  │  │     └─ upload.types.ts
│  │  │  ├─ types
│  │  │  │  ├─ express.d.ts
│  │  │  │  └─ streamifier.d.ts
│  │  │  └─ utils
│  │  │     └─ cookies.ts
│  │  ├─ tsconfig.app.json
│  │  ├─ tsconfig.json
│  │  ├─ tsconfig.spec.json
│  │  └─ webpack.config.js
│  ├─ api-e2e
│  │  ├─ .spec.swcrc
│  │  ├─ eslint.config.mjs
│  │  ├─ jest.config.cts
│  │  ├─ package.json
│  │  ├─ src
│  │  │  ├─ api
│  │  │  │  └─ api.spec.ts
│  │  │  └─ support
│  │  │     ├─ global-setup.ts
│  │  │     ├─ global-teardown.ts
│  │  │     └─ test-setup.ts
│  │  └─ tsconfig.json
│  ├─ web
│  │  ├─ .swc
│  │  │  └─ plugins
│  │  │     └─ windows_x86_64_23.0.0
│  │  ├─ .swcrc
│  │  ├─ eslint.config.mjs
│  │  ├─ index.d.ts
│  │  ├─ jest.config.cts
│  │  ├─ next-env.d.ts
│  │  ├─ next.config.js
│  │  ├─ package.json
│  │  ├─ postcss.config.mjs
│  │  ├─ public
│  │  │  └─ favicon.ico
│  │  ├─ specs
│  │  │  └─ index.spec.tsx
│  │  ├─ src
│  │  │  ├─ app
│  │  │  │  ├─ admin-signup
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ api
│  │  │  │  │  └─ hello
│  │  │  │  ├─ app
│  │  │  │  │  ├─ audit-log
│  │  │  │  │  │  └─ page.tsx
│  │  │  │  │  ├─ dashboard
│  │  │  │  │  │  └─ page.tsx
│  │  │  │  │  ├─ events
│  │  │  │  │  │  └─ page.tsx
│  │  │  │  │  ├─ network
│  │  │  │  │  │  └─ page.tsx
│  │  │  │  │  ├─ people
│  │  │  │  │  │  └─ page.tsx
│  │  │  │  │  └─ settings
│  │  │  │  │     └─ page.tsx
│  │  │  │  ├─ auth.module.css
│  │  │  │  ├─ global.css
│  │  │  │  ├─ login
│  │  │  │  │  └─ page.tsx
│  │  │  │  ├─ page.module.css
│  │  │  │  └─ page.tsx
│  │  │  ├─ components
│  │  │  │  ├─ form
│  │  │  │  │  ├─ AvatarUpload.tsx
│  │  │  │  │  └─ PasswordInput.tsx
│  │  │  │  ├─ graph
│  │  │  │  │  ├─ GraphCanvas.tsx
│  │  │  │  │  ├─ GraphControls.tsx
│  │  │  │  │  ├─ GraphToolbar.tsx
│  │  │  │  │  └─ GraphViewport.tsx
│  │  │  │  └─ ui
│  │  │  │     └─ ConfirmationDialog.tsx
│  │  │  ├─ features
│  │  │  │  ├─ auth
│  │  │  │  ├─ dashboard
│  │  │  │  ├─ graph
│  │  │  │  ├─ import
│  │  │  │  ├─ people
│  │  │  │  ├─ relationships
│  │  │  │  ├─ search
│  │  │  │  └─ settings
│  │  │  ├─ global.d.ts
│  │  │  ├─ hooks
│  │  │  ├─ lib
│  │  │  ├─ services
│  │  │  │  ├─ audit.api.ts
│  │  │  │  ├─ auth.api.ts
│  │  │  │  ├─ dashboard.api.ts
│  │  │  │  ├─ events.api.ts
│  │  │  │  ├─ filter.service.ts
│  │  │  │  ├─ organizations.api.ts
│  │  │  │  ├─ people.api.ts
│  │  │  │  └─ relationships.api.ts
│  │  │  ├─ stores
│  │  │  ├─ styles
│  │  │  ├─ types
│  │  │  └─ utils
│  │  │     ├─ password.ts
│  │  │     └─ people-import-export.ts
│  │  ├─ tsconfig.json
│  │  └─ tsconfig.spec.json
│  └─ web-e2e
│     ├─ eslint.config.mjs
│     ├─ package.json
│     ├─ playwright.config.mts
│     ├─ src
│     │  └─ example.spec.ts
│     └─ tsconfig.json
├─ eslint.config.mjs
├─ jest.config.ts
├─ jest.preset.js
├─ nx.json
├─ package-lock.json
├─ package.json
├─ packages
│  ├─ shared-types
│  │  ├─ eslint.config.mjs
│  │  ├─ jest.config.cts
│  │  ├─ package.json
│  │  ├─ project.json
│  │  ├─ README.md
│  │  ├─ src
│  │  │  ├─ index.ts
│  │  │  └─ lib
│  │  │     ├─ audit.ts
│  │  │     ├─ common.ts
│  │  │     ├─ enums.ts
│  │  │     ├─ event.ts
│  │  │     ├─ organization.ts
│  │  │     ├─ person.ts
│  │  │     └─ relationship.ts
│  │  ├─ tsconfig.json
│  │  ├─ tsconfig.lib.json
│  │  └─ tsconfig.spec.json
│  └─ shared-utils
│     ├─ eslint.config.mjs
│     ├─ jest.config.cts
│     ├─ package.json
│     ├─ project.json
│     ├─ README.md
│     ├─ src
│     │  ├─ index.ts
│     │  └─ lib
│     │     ├─ shared-utils.spec.ts
│     │     └─ shared-utils.ts
│     ├─ tsconfig.json
│     ├─ tsconfig.lib.json
│     └─ tsconfig.spec.json
├─ README.md
└─ tsconfig.base.json

```