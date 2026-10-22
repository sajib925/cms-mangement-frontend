import {ReactNode} from "react";
import { cn } from "@/lib/utils.ts";


interface Props {
  className?: string;
  children: string | ReactNode
}

export const Title = ({className, children = "Social Icons"}: Props) => {
  return <h1 className={cn('text-[14px] font-bold leading-[18px]', className)}>{children}</h1>
}