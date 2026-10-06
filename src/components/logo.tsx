import { cn } from "@/lib/utils";

/** Marca: um "P" de estacionamento num quadrado azul. */
export function LogoMarca({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#1e40af" />
      <rect x="1" y="1" width="30" height="30" rx="8" fill="none" stroke="white" strokeOpacity="0.22" />
      <path
        d="M12 24V8h5.6a5.2 5.2 0 0 1 0 10.4H12"
        fill="none"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ className, texto = true }: { className?: string; texto?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-extrabold tracking-tight", className)}>
      <LogoMarca />
      {texto && <span>Smart Vagas</span>}
    </span>
  );
}
