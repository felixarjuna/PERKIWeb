"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import AddTakeawayForm from "./add-takeaway-form";
import DocsImport from "./docs-import";

/** Writers write one takeaway; staff can also import them from the Docs. */
export default function NewTakeaway({
  canImport,
  username,
}: {
  canImport: boolean;
  username: string;
}) {
  if (!canImport) {
    return <AddTakeawayForm username={username} />;
  }
  return (
    <Tabs className="w-full" defaultValue="manual">
      <TabsList className="mb-6 grid w-full grid-cols-2 sm:w-fit">
        <TabsTrigger value="manual">Manual</TabsTrigger>
        <TabsTrigger value="docs">Import from Docs</TabsTrigger>
      </TabsList>
      <TabsContent value="manual">
        <AddTakeawayForm username={username} />
      </TabsContent>
      <TabsContent value="docs">
        <DocsImport />
      </TabsContent>
    </Tabs>
  );
}
