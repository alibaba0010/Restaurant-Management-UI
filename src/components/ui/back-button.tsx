"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  className?: string;
  label?: string;
  href?: string;
}

export function BackButton({
  className,
  label = "Go Back",
  href,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "flex items-center gap-2 text-muted-foreground hover:text-accent p-0 hover:bg-transparent mb-4",
        className
      )}
      onClick={handleBack}
    >
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
      <span>{label}</span>
    </Button>
  );
}
