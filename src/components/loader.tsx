import { Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

interface ILoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly message: string;
}

export default function Loader(props: ILoaderProps) {
  return (
    <div
      className={cn(
        "flex animate-pulse items-center justify-center gap-2 text-base",
        props.className,
      )}
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      <p>{props.message}</p>
    </div>
  );
}
