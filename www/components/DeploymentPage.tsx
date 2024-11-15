"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Github,
  Terminal,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

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
  error?: string;
}

export function EnhancedBuildSimulator() {
  const [isBuilding, setIsBuilding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<BuildLog[]>([]);
  const [repoUrl, setRepoUrl] = useState("");
  const [deploymentId, setDeploymentId] = useState("");
  const [status, setStatus] = useState<DeploymentStatus | null>(null);

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">GitHost Dashboard</h1>
      <div className="max-w-screen-lg mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Github className="mr-2" />
              Deploy Repository
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="repo-url">Repository URL</Label>
                <div className="flex gap-x-3">
                  <Input
                    id="repo-url"
                    placeholder="https://github.com/user/repo"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    disabled={isBuilding}
                  />
                {/* </div> */}
                <Button
                  onClick={handleSubmit}
                  disabled={isBuilding}
                  className=""
                >
                  {isBuilding ? (
                    <>
                      <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                      Building...
                    </>
                  ) : status?.status === "completed" ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Build Complete
                    </>
                  ) : (
                    "Start Build"
                  )}
                </Button></div>
              </div>
            </div>
          </CardContent>
          {status?.status === "completed" && (
            <CardFooter>
              <Button
                onClick={handleVisitSite}
                className="w-full"
                variant="outline"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Visit Site
              </Button>
            </CardFooter>
          )}
        </Card>
        <Card className="mt-5">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Terminal className="mr-2" />
              Build Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {status?.queuePosition !== null && (
              <div>
                <Label>Queue Status</Label>
                <div className="flex flex-col mt-1 text-sm text-muted-foreground">
                  <p>Position: {status?.queuePosition}</p>
                  <p>Jobs ahead:{status?.jobsAhead}</p>
                  <p>Total queued:{status?.totalQueuedJobs}</p>
                </div>
              </div>
            )}
            <div>
              <div className="flex justify-between mb-2">
                <Label>Build Progress</Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
            <div>
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
                    [{new Date(log.timestamp).toLocaleTimeString()}]{" "}
                    {log.message}
                  </div>
                ))}
                {status?.error && (
                  <div className="text-red-400">[Error] {status.error}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
