# PERKIWeb

Welcome to PERKIWeb. The PERKI Aachen platform to inform the members, so we could pray together, know what is happening in our fellowship,
sneak peak to our schedule, and share what we learn from the service.

## Tech stack

The current tech stack for this project is [T3 Stack](https://create.t3.gg/) created with the `create-t3-app` command. We are using [Next.js](https://nextjs.org) (App Router) as React Framework, [Auth.js / NextAuth v5](https://authjs.dev) for Authentication, [Drizzle](https://orm.drizzle.team/) as ORM (Object Relational Mapping), [Tailwind CSS](https://tailwindcss.com) v4 for styling, and [tRPC](https://trpc.io) v11 for end-to-end type safe APIs. Package manager is [pnpm](https://pnpm.io).

## Testing

```bash
pnpm check            # lint + typecheck + unit/integration tests (no database needed)
pnpm test:e2e:db      # start a throwaway Postgres in Docker
pnpm test:e2e         # build the app and run the Playwright end-to-end suite
pnpm test:e2e:db:down # stop the throwaway Postgres
```

Tests never use the database in `.env`. Integration tests use an in-memory Postgres (PGlite), and the end-to-end tests refuse to run against anything other than a local database. CI runs both suites on every push and pull request.

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## Deployment

The project is currently deployed on [Vercel](https://create.t3.gg/en/deployment/vercel).

## Contributors

`@felixarjuna`: full stack dev.
`@rickyjonathan`: ui/ux dev.

If anything happen, please contact one of us for further information.

