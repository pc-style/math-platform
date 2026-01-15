"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CodeEditor } from "@/components/learn/CodeEditor";
import { CodePreview } from "@/components/learn/CodePreview";
import { ChallengeCard } from "@/components/learn/ChallengeCard";
import { ValidationFeedback } from "@/components/learn/ValidationFeedback";
import { useChallengeValidation } from "@/hooks/useChallengeValidation";

export default function ChallengePage() {
  const params = useParams();
  const slug = params.slug as string;

  const challenge = useQuery(api.challenges.getBySlug, { slug });
  const user = useQuery(api.users.getUserDetails);
  const completeChallenge = useMutation(api.challenges.complete);

  const [files, setFiles] = useState({ html: "", css: "", js: "" });
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js">("html");
  const [validationStatus, setValidationStatus] = useState<"idle" | "success" | "failure">("idle");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const { validate } = useChallengeValidation();

  useEffect(() => {
    if (challenge) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFiles({
        html: challenge.starterCode.html,
        css: challenge.starterCode.css,
        js: challenge.starterCode.js || "",
      });
    }
  }, [challenge]);

  const handleCodeChange = (value: string | undefined) => {
    setFiles((prev) => ({ ...prev, [activeTab]: value || "" }));
    setValidationStatus("idle");
  };

  const handleRun = () => {
    // CodePreview automatically updates via props
    setValidationStatus("idle");
  };

  const handleSubmit = async () => {
    const iframe = document.querySelector("iframe") as HTMLIFrameElement;
    if (!challenge) return;

    const result = validate(iframe, challenge.validation.rules);

    if (result.passed) {
      setValidationStatus("success");
      setFeedbackMessage(`Congratulations! You've earned ${challenge.xpReward} XP.`);

      const userId = user?.userId;
      if (!userId) {
        setFeedbackMessage("You must be logged in to save progress.");
        setValidationStatus("failure");
        return;
      }

      await completeChallenge({
        userId,
        challengeId: challenge._id,
      });
    } else {
      setValidationStatus("failure");
      setFeedbackMessage(result.failedRule?.hint || "Something is not right.");
    }
  };

  if (!challenge) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        Loading challenge...
      </div>
    );
  }

  return (
    <main className="flex h-screen bg-background overflow-hidden p-4 gap-4">
      {/* Sidebar - Challenge Info */}
      <div className="w-[400px] h-full">
        <ChallengeCard
          title={challenge.title}
          description={challenge.description}
          hints={challenge.hints}
          difficulty={challenge.difficulty}
          xpReward={challenge.xpReward}
          onRun={handleRun}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Main Content - Editor & Preview */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex-1">
          <CodeEditor
            files={files}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onChange={handleCodeChange}
          />
        </div>
        <div className="h-[300px]">
          <CodePreview html={files.html} css={files.css} js={files.js} />
        </div>
      </div>

      <ValidationFeedback
        status={validationStatus}
        message={feedbackMessage}
        onAnimationComplete={() => {
          if (validationStatus === "success") {
            // Next level logic could go here
          }
        }}
      />
    </main>
  );
}
