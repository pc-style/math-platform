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
import { MathContent } from "@/components/MathContent";

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
  const [hintUsed, setHintUsed] = useState(false);
  const { validate } = useChallengeValidation();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { playSuccess, playFailure, playLevelUp } = useSoundManager();

  useEffect(() => {
    if (challenge && challenge.starterCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFiles({
        html: challenge.starterCode.html,
        css: challenge.starterCode.css,
        js: challenge.starterCode.js || "",
      });
      setHintUsed(false);
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
    if (!challenge || isSubmitting) return;

    setIsSubmitting(true);
    setValidationStatus("idle");
    window.dispatchEvent(
      new CustomEvent("learn:challengeAttempt", { detail: { challengeId: challenge._id, slug } }),
    );

    let passed = false;

    if (challenge.type === "theory") {
      passed = true;
    } else {
      const result = validate(iframeRef.current, challenge.validation?.rules || []);
      passed = result.passed;
      if (!passed) {
        playFailure();
        setValidationStatus("failure");
        setFeedbackMessage(result.failedRule?.hint || "Something isn't quite right. Try again!");
        window.dispatchEvent(
          new CustomEvent("learn:challengeFailure", {
            detail: { challengeId: challenge._id, slug },
          }),
        );
      }
    }

    if (passed) {
      playSuccess();
      setValidationStatus("success");
      setFeedbackMessage(`Victory! +${challenge.xpReward} XP.`);

      const userId = user?.userId;
      let xpEarnedForQuests = challenge.xpReward;
      if (userId) {
        const beforeLevel = Math.floor((user?.xp ?? 0) / 1000) + 1;
        const result = await completeChallenge({ userId, challengeId: challenge._id });
        xpEarnedForQuests = result?.xpEarned ?? 0;
        const afterLevel = Math.floor((result?.newXp ?? user?.xp ?? 0) / 1000) + 1;
        if (result?.xpAwarded && afterLevel > beforeLevel) {
          setTimeout(() => playLevelUp(), 450);
        }
      } else {
        setFeedbackMessage("Victory! Sign in to save progress and XP.");
      }

      window.dispatchEvent(
        new CustomEvent("learn:challengeSuccess", {
          detail: {
            challengeId: challenge._id,
            slug,
            xpEarned: xpEarnedForQuests,
            usedHint: hintUsed,
          },
        }),
      );

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
          onHintReveal={() => setHintUsed(true)}
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
          <div className="flex-1 overflow-y-auto p-8 glass rounded-2xl border border-white/10">
            <MathContent
              content={challenge.theoryContent || challenge.description}
              className="prose-lg"
              slug={challenge.slug}
            />
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
