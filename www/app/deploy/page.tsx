import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";

export default function DeployPage() {
  return (
    <div className="w-full max-w-screen-lg mx-auto m-2 p-4">
      <h1 className="text-2xl font-black">githost.xyz</h1>
      <div className="mt-8">
        <Input placeholder="Enter your repository URL" className="mt-4" />
        <Button className="mt-4">Deploy</Button>
      </div>
    </div>
  );
}
