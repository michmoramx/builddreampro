import type { Entity } from "./ops-core";
import { projectMath, todayChicago } from "./ops-core";

export function dailyReport(records: Entity[]) {
  const date = todayChicago();
  const tasks = records.filter(r => r.kind === "task" && !r.data.done);
  const followUps = records.filter(r => r.kind === "contact" && !["won", "lost"].includes(r.data.stage));
  const projects = records.filter(r => r.kind === "project");
  return {
    company: "Build Dreams MM", date, timezone: "America/Chicago", currency: "USD",
    moneyUnit: "cents", recordMode: "company",
    counts: { openTasks: tasks.length, overdueTasks: tasks.filter(r => r.data.due < date).length, openFollowUps: followUps.length, projects: projects.length },
    tasks: tasks.sort((a,b) => a.data.due.localeCompare(b.data.due)).slice(0,50).map(r => ({id:r.id,title:r.data.title,owner:r.data.owner,due:r.data.due,overdue:r.data.due<date,projectId:r.data.projectId})),
    followUps: followUps.sort((a,b) => a.data.nextDue.localeCompare(b.data.nextDue)).slice(0,50).map(r => ({id:r.id,name:r.data.name,owner:r.data.owner,stage:r.data.stage,nextDue:r.data.nextDue,service:r.data.service})),
    projects: projects.slice(0,50).map(r => ({id:r.id,title:r.data.title,status:r.data.status,owner:r.data.owner,...projectMath(r,records)})),
    limit: 50,
    policy: "Read-only. Amounts reflect recorded payments and costs, not bank balances. No outreach, purchases, agreement acceptance or payments. Missing data is unknown; do not invent progress."
  };
}
