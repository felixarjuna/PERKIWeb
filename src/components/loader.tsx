import { Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

interface ILoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly message: string;
}

export default function Loader(props: ILoaderProps) {
  return (
    <div
      className={cn(
        "type-body-sm flex items-center justify-center gap-2 text-muted-foreground",
        props.className
      )}
      role="status"
    >
      <Loader2 aria-hidden="true" className="size-4 motion-safe:animate-spin" />
      <p>{props.message}</p>
    </div>
  );
}
