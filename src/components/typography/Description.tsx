import { ReactNode } from "react";
import { cn } from "@/lib/utils.ts";

interface Props {
  className?: string;
  children: string | ReactNode;
}

export const Description = ({ className, children = "Popup Builder" }: Props) => {
  return <p className={cn("text-[12px] font-medium leading-[16px]", className)}>{children}</p>;
};
