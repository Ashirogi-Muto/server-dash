import { cn } from "@/lib/utils";
import React from "react";

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    orientation?: "vertical" | "horizontal" | "both";
}

export function ScrollArea({ children, className, orientation = "vertical", ...props }: ScrollAreaProps) {
    return (
        <div
            className={cn(
                "minimal-scrollbar",
                orientation === "vertical" && "overflow-y-auto overflow-x-hidden",
                orientation === "horizontal" && "overflow-x-auto overflow-y-hidden",
                orientation === "both" && "overflow-auto",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
