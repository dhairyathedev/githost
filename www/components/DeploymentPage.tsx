"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";

const buildSteps = [
  "Initializing build environment",
  "Cloning repository",
  "Installing dependencies",
  "Compiling source code",
  "Running tests",
  "Optimizing assets",
  "Generating static files",
  "Configuring deployment",
  "Deploying to CDN",
  "Updating DNS records",
];

export function EnhancedBuildSimulator() {
  const [isBuilding, setIsBuilding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [repoUrl, setRepoUrl] = useState("");
  const [subdomain, setSubdomain] = useState("");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBuilding && progress < 100) {
      interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 100 / 300; // 100% over 30 seconds
          if (newProgress >= 100) {
            setIsBuilding(false);
            return 100;
          }
          return newProgress;
        });

        if (Math.random() < 0.2) {
          // 20% chance to generate a log every 100ms
          const randomStep =
            buildSteps[Math.floor(Math.random() * buildSteps.length)];
          setLogs((prev) => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] ${randomStep}`,
          ]);
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isBuilding, progress]);

  const handleSubmit = () => {
    if (!repoUrl || !subdomain) {
      alert(
        "Please fill in both the repository URL and subdomain/deployment ID."
      );
      return;
    }
    setIsBuilding(true);
    setProgress(0);
    setLogs([
      `[${new Date().toLocaleTimeString()}] Starting build for ${repoUrl}`,
    ]);
  };

  const handleVisitSite = () => {
    window.open(`https://${subdomain}.vercel.app`, "_blank");
  };

  return (
    <div className="w-full">
      <div>
        <h1 className="text-3xl text-center font-bold my-5">Githost Dashboard</h1>
      </div>

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Build Simulator</CardTitle>
          <CardDescription>Simulate a deployment build process</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="repo-url">Repository URL</Label>
              <Input
                id="repo-url"
                placeholder="https://github.com/user/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                disabled={isBuilding}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain / Deployment ID</Label>
              <Input
                id="subdomain"
                placeholder="my-app or deployment-123"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                disabled={isBuilding}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Build Progress</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          <div className="space-y-2">
            <Label>Build Logs</Label>
            <div className="bg-black text-green-400 p-4 rounded-md h-64 overflow-y-auto font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
              {progress === 100 && (
                <div className="text-blue-400 mt-2">
                  [Build Complete] Deployment available at: https://{subdomain}
                  .vercel.app
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleSubmit}
            disabled={isBuilding}
            className="w-full sm:w-auto"
          >
            {isBuilding ? (
              <div>
                <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                Building...
              </div>
            ) : progress === 100 ? (
              <div>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Build Complete
              </div>
            ) : (
              "Start Build"
            )}
          </Button>
          {progress === 100 && (
            <Button
              onClick={handleVisitSite}
              className="w-full sm:w-auto"
              variant="outline"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit Site
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
