"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Bot, Wallet } from "lucide-react";

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
