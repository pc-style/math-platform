"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CodeEditor } from "@/components/learn/CodeEditor";
import { CodePreview } from "@/components/learn/CodePreview";
import { ChallengeCard } from "@/components/learn/ChallengeCard";
import { ValidationFeedback } from "@/components/learn/ValidationFeedback";
import { SortingVisualizer } from "@/components/learn/interactive/SortingVisualizer";
import { BoxModelPlayground } from "@/components/learn/interactive/BoxModelPlayground";
import { useChallengeValidation } from "@/hooks/useChallengeValidation";
import { useSoundManager } from "@/hooks/useSoundManager";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export default function ChallengePage() {
  const params = useParams();
  const slug = params.slug as string;

  const challenge = useQuery(api.challenges.getBySlug, { slug });
  const user = useQuery(api.users.getUserDetails);
  const completeChallenge = useMutation(api.challenges.complete);

  const [files, setFiles] = useState({ html: "", css: "", js: "" });
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js">("html");
  const [validationStatus, setValidationStatus] = useState<"idle" | "success" | "failure">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const { validate } = useChallengeValidation();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { playSuccess, playFailure } = useSoundManager();
  const lastStatusRef = useRef<"idle" | "success" | "failure">("idle");

  useEffect(() => {
    if (challenge && challenge.starterCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFiles({
        html: challenge.starterCode.html,
        css: challenge.starterCode.css,
        js: challenge.starterCode.js || "",
      });
    }
  }, [challenge]);

  useEffect(() => {
    if (validationStatus === lastStatusRef.current) return;

    if (validationStatus === "success") {
      playSuccess();
    }

    if (validationStatus === "failure") {
      playFailure();
    }

    lastStatusRef.current = validationStatus;
  }, [validationStatus, playFailure, playSuccess]);

  const handleCodeChange = (value: string | undefined) => {
    setFiles((prev) => ({ ...prev, [activeTab]: value || "" }));
    setValidationStatus("idle");
  };

  const handleRun = () => {
    // CodePreview automatically updates via props
    setValidationStatus("idle");
  };

  const handleSubmit = async () => {
    if (!challenge || isSubmitting) return;

    setIsSubmitting(true);
    setValidationStatus("idle");

    let passed = false;

    if (challenge.type === "theory") {
      passed = true;
    } else {
      const result = validate(iframeRef.current, challenge.validation?.rules || []);
      passed = result.passed;
      if (!passed) {
        setValidationStatus("failure");
        setFeedbackMessage(result.failedRule?.hint || "Something isn't quite right. Try again!");
      }
    }

    if (passed) {
      setValidationStatus("success");
      setFeedbackMessage(`Congratulations! You've earned ${challenge.xpReward} XP.`);

      const userId = user?.userId;
      if (!userId) {
        setFeedbackMessage("You must be logged in to save progress.");
        setValidationStatus("failure");
        setIsSubmitting(false); // Ensure submitting state is reset
        return;
      }

      await completeChallenge({
        userId,
        challengeId: challenge._id,
      });

      setIsSubmitting(false);
    } else {
      setIsSubmitting(false);
    }
  };

  if (!challenge) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        Loading challenge...
      </div>
    );
  }

  const isTheory = challenge.type === "theory";
  const isSortingVisualizer = slug === "sorting-visualizer";
  const isBoxModelPlayground = slug === "box-model-playground";
  const isInteractive = isSortingVisualizer || isBoxModelPlayground;

  return (
    <main className="flex h-screen bg-background overflow-hidden p-4 gap-4">
      {/* Sidebar - Challenge Info */}
      <div className="w-[400px] h-full">
        <ChallengeCard
          title={challenge.title}
          description={challenge.description}
          hints={challenge.hints || []}
          difficulty={challenge.difficulty}
          xpReward={challenge.xpReward}
          onRun={isTheory ? () => {} : handleRun}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4 h-full overflow-hidden">
        {isInteractive ? (
          <div className="flex-1 overflow-hidden">
            {isSortingVisualizer ? <SortingVisualizer /> : null}
            {isBoxModelPlayground ? <BoxModelPlayground /> : null}
          </div>
        ) : isTheory ? (
          <div className="flex-1 overflow-y-auto p-8 glass rounded-2xl border border-white/10 prose prose-invert prose-lg max-w-none">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {challenge.theoryContent || challenge.description}
            </ReactMarkdown>
          </div>
        ) : (
          <>
            <div className="flex-1">
              <CodeEditor
                files={files}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onChange={handleCodeChange}
              />
            </div>
            <div className="h-[300px]">
              <CodePreview ref={iframeRef} html={files.html} css={files.css} js={files.js} />
            </div>
          </>
        )}
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
