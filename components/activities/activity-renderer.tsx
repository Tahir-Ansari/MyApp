"use client";

import type { Activity } from "@/lib/curriculum/types";
import { ClassifyActivity } from "./classify-activity";
import { MatchingActivity } from "./matching-activity";
import { OrderingActivity } from "./ordering-activity";
import { ScenarioActivity } from "./scenario-activity";
import { TerminalActivity } from "./terminal-activity";

export const ACTIVITY_LABELS: Record<Activity["type"], string> = {
  ordering: "Ordering",
  matching: "Matching",
  classify: "Sorting",
  scenario: "Troubleshooting",
  terminal: "Simulated terminal",
};

interface Props {
  activity: Activity;
  completed: boolean;
  onComplete: () => void;
  onAttempt?: () => void;
}

export function ActivityRenderer({ activity, ...rest }: Props) {
  switch (activity.type) {
    case "ordering":
      return <OrderingActivity activity={activity} {...rest} />;
    case "matching":
      return <MatchingActivity activity={activity} {...rest} />;
    case "classify":
      return <ClassifyActivity activity={activity} {...rest} />;
    case "scenario":
      return <ScenarioActivity activity={activity} {...rest} />;
    case "terminal":
      return <TerminalActivity activity={activity} {...rest} />;
  }
}

export function activityInstructions(activity: Activity): string | undefined {
  return activity.type === "scenario" ? undefined : activity.instructions;
}
