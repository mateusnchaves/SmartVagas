import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "animate-entrada rounded-2xl border border-slate-200/80 bg-white p-4 shadow-cartao sm:p-5",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2 className={cn("text-base font-bold tracking-tight text-slate-900", className)} {...props} />
  );
}
