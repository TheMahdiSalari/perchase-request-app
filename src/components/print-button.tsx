"use client";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton() {
    return (
        <Button variant="outline" className="gap-2 no-print ml-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            چاپ
        </Button>
    )
}