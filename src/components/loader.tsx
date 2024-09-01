import { Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

interface ILoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly message: string;
}

export default function Loader(props: ILoaderProps) {
  return (
    <div
      className={cn(
        "flex animate-pulse items-center justify-center gap-2 text-base sm:text-xl",
        props.className,
      )}
    >
      <Loader2 className="aspect-square h-4 animate-spin sm:h-6" />
      <p className="font-reimbrandt">{props.message}</p>
    </div>
  );
}
