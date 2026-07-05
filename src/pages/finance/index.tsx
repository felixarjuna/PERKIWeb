import Template from "~/components/template";

/**
 * Placeholder until the finance dashboard (Notion-backed) ships.
 * The data plumbing lives in the `finances` tRPC router.
 */
export default function Finance() {
  return (
    <Template subtitle="Our family wealth tracker." title="Finance">
      <div className="flex justify-center">
        <h1 className="absolute top-1/2 animate-pulse font-reimbrandt text-3xl sm:text-4xl">
          Coming Soon ...
        </h1>
      </div>
    </Template>
  );
}
