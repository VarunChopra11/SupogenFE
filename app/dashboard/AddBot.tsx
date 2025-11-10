"use client";

import { Bot } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function AddBot() {
  return (
    <Link href="/addbot" className="inline-flex">
      <Button variant="outline" className="cursor-pointer gap-2">
        <Bot />
        Add Agent To Server
      </Button>
    </Link>
  );
}

export default AddBot;
