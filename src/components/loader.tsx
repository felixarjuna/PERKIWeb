import { Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

interface ILoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly message: string;
}

export default function Loader(props: ILoaderProps) {
  return (
    <div
      className={cn(
        "flex animate-pulse items-center justify-center gap-1 sm:gap-2",
        props.className,
      )}
    >
      <Loader2 className="size-4 animate-spin sm:size-5" />
      <p className="font-reimbrandt text-sm tracking-wider sm:text-lg">
        {props.message}
      </p>
    </div>
  );
}
