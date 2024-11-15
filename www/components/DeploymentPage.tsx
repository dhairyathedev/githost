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
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@clerk/nextjs";

interface BuildLog {
  id: string;
  timestamp: string;
  type: "info" | "error" | "success" | "system";
  message: string;
}

interface DeploymentStatus {
  id: string;
  state: string;
  status: string;
  progress: number;
  queuePosition: number | null;
  jobsAhead: number;
  totalQueuedJobs: number;
  logs: BuildLog[];
  error?: string; // Add this line
}

export function EnhancedBuildSimulator() {
  const [isBuilding, setIsBuilding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<BuildLog[]>([]);
  const [repoUrl, setRepoUrl] = useState("");
  const [deploymentId, setDeploymentId] = useState("");
  const [status, setStatus] = useState<DeploymentStatus | null>(null);
  const { user } = useUser();

  useEffect(() => {
    if (deploymentId) {
      const eventSource = new EventSource(
        `${process.env.NEXT_PUBLIC_API_URL}/status/${deploymentId}/live`
      );

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setStatus(data);
        setProgress(data.progress);
        setLogs(data.logs || []);

        if (data.status === "completed" || data.status === "failed") {
          eventSource.close();
          setIsBuilding(false);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
      };

      return () => {
        eventSource.close();
      };
    }
  }, [deploymentId]);

  const handleSubmit = async () => {
    if (!repoUrl) {
      alert("Please enter a repository URL");
      return;
    }

    const id = uuidv4();
    setDeploymentId(id);
    setIsBuilding(true);
    setProgress(0);
    setLogs([]);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upload`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            title: `Deployment ${id}`,
            repoUrl,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to start deployment");
      }
    } catch (error) {
      console.error("Deployment error:", error);
      setIsBuilding(false);
      setLogs((prev) => [
        ...prev,
        {
          id: deploymentId,
          timestamp: new Date().toISOString(),
          type: "error",
          message: "Failed to start deployment",
        },
      ]);
    }
  };

  const handleVisitSite = () => {
    if (deploymentId) {
      window.open(`https://${deploymentId}.githost.xyz`, "_blank");
    }
  };

  return (
    <div className="w-full">
      <div>
        <h1 className="text-3xl text-center font-bold my-5">
          {user?.fullName}'s Workspace
        </h1>
      </div>

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Deploy Your Repository</CardTitle>
          <CardDescription>
            Deploy your Git repository to Githost
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {status?.queuePosition !== null && (
            <div className="space-y-2">
              <Label>Queue Status</Label>
              <div className="text-sm text-muted-foreground">
                <p>Position in queue: {status?.queuePosition}</p>
                <p>Jobs ahead: {status?.jobsAhead}</p>
                <p>Total queued jobs: {status?.totalQueuedJobs}</p>
              </div>
            </div>
          )}

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
                <div
                  key={index}
                  className={`${
                    log.type === "error"
                      ? "text-red-400"
                      : log.type === "success"
                      ? "text-green-400"
                      : log.type === "system"
                      ? "text-blue-400"
                      : "text-green-400"
                  }`}
                >
                  [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                </div>
              ))}
              {status?.error && (
                <div className="text-red-400">[Error] {status.error}</div>
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
              <div className="flex items-center">
                <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                Building...
              </div>
            ) : status?.status === "completed" ? (
              <div className="flex items-center">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Build Complete
              </div>
            ) : (
              "Start Build"
            )}
          </Button>
          {status?.status === "completed" && (
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
