import { cn } from "../../lib/utils";

export const Separator = ({ className }: React.HTMLAttributes<HTMLDivElement>) => {
  return <div className={cn("h-[1px] w-40 bg-light-green-default", className)} />;
};