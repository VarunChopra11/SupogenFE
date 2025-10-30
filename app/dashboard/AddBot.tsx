"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Wallet } from "lucide-react";

function AddBot() {
  return (
    <Link href="/addbot" className="inline-flex">
      <Button variant="outline" className="cursor-pointer gap-2">
        <Wallet className="h-4 w-4 opacity-80" />
        Add Agent To Server
      </Button>
    </Link>
  );
}

export default AddBot;
