import { and, asc, desc, eq, gt } from "drizzle-orm";
import { db } from "../client";
import {
  goals,
  goalStages,
  goalStageTasks,
  goalTaskLogs,
  goalMeasurements,
  type Goal,
  type GoalStage,
  type GoalStageTask,
} from "../schema/goals";

// numeric 列在 pg 驱动里以字符串返回，这里统一转成 number|null。
function num(v: string | null): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export interface TaskDTO {
  id: string;
  orderIndex: number;
  name: string;
  dailyTarget: number;
  dailyUnit: string;
  icon: string;
  checkedDays: string[];
}

export interface StageDTO {
  id: string;
  orderIndex: number;
  name: string;
  focus: string;
  startDate: string;
  endDate: string;
  milestoneValue: number | null;
  icon: string;
  tasks: TaskDTO[];
}

export interface GoalDTO {
  id: string;
  title: string;
  kind: string;
  startLevel: string;
  startValue: number | null;
  targetValue: number | null;
  valueUnit: string | null;
  direction: string;
  startDate: string;
  deadline: string;
  status: string;
  currentValue: number | null;
  stages: StageDTO[];
}

function toStageDTO(s: GoalStage, tasks: TaskDTO[]): StageDTO {
  return {
    id: s.id,
    orderIndex: s.orderIndex,
    name: s.name,
    focus: s.focus,
    startDate: s.startDate,
    endDate: s.endDate,
    milestoneValue: num(s.milestoneValue),
    icon: s.icon,
    tasks,
  };
}

/** 列出用户全部目标，附阶段与阶段打卡、最新测量值。 */
export async function listGoalsWithStages(userId: string): Promise<GoalDTO[]> {
  const gs = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(desc(goals.createdAt));
  if (gs.length === 0) return [];

  const stages = await db
    .select()
    .from(goalStages)
    .where(eq(goalStages.userId, userId))
    .orderBy(asc(goalStages.orderIndex));

  const tasks = await db
    .select()
    .from(goalStageTasks)
    .where(eq(goalStageTasks.userId, userId))
    .orderBy(asc(goalStageTasks.orderIndex));

  const taskLogs = await db
    .select()
    .from(goalTaskLogs)
    .where(eq(goalTaskLogs.userId, userId));

  const measures = await db
    .select()
    .from(goalMeasurements)
    .where(eq(goalMeasurements.userId, userId))
    .orderBy(desc(goalMeasurements.measuredOn));

  const logsByTask = new Map<string, string[]>();
  for (const l of taskLogs) {
    const arr = logsByTask.get(l.taskId) ?? [];
    arr.push(l.logDate);
    logsByTask.set(l.taskId, arr);
  }
  const tasksByStage = new Map<string, GoalStageTask[]>();
  for (const tk of tasks) {
    const arr = tasksByStage.get(tk.stageId) ?? [];
    arr.push(tk);
    tasksByStage.set(tk.stageId, arr);
  }
  const latestByGoal = new Map<string, number>();
  for (const m of measures) {
    if (!latestByGoal.has(m.goalId)) {
      const v = num(m.value);
      if (v != null) latestByGoal.set(m.goalId, v);
    }
  }
  const stagesByGoal = new Map<string, GoalStage[]>();
  for (const s of stages) {
    const arr = stagesByGoal.get(s.goalId) ?? [];
    arr.push(s);
    stagesByGoal.set(s.goalId, arr);
  }

  const toTaskDTO = (tk: GoalStageTask): TaskDTO => ({
    id: tk.id,
    orderIndex: tk.orderIndex,
    name: tk.name,
    dailyTarget: tk.dailyTarget,
    dailyUnit: tk.dailyUnit,
    icon: tk.icon,
    checkedDays: (logsByTask.get(tk.id) ?? []).sort((a, b) => b.localeCompare(a)),
  });

  return gs.map((g) => ({
    id: g.id,
    title: g.title,
    kind: g.kind,
    startLevel: g.startLevel,
    startValue: num(g.startValue),
    targetValue: num(g.targetValue),
    valueUnit: g.valueUnit,
    direction: g.direction,
    startDate: g.startDate,
    deadline: g.deadline,
    status: g.status,
    currentValue: latestByGoal.get(g.id) ?? num(g.startValue),
    stages: (stagesByGoal.get(g.id) ?? []).map((s) =>
      toStageDTO(s, (tasksByStage.get(s.id) ?? []).map(toTaskDTO)),
    ),
  }));
}

export async function createGoal(data: {
  userId: string;
  title: string;
  kind: string;
  startLevel: string;
  startValue: number | null;
  targetValue: number | null;
  valueUnit: string | null;
  direction: string;
  startDate: string;
  deadline: string;
}): Promise<Goal> {
  const rows = await db
    .insert(goals)
    .values({
      userId: data.userId,
      title: data.title,
      kind: data.kind,
      startLevel: data.startLevel,
      startValue: data.startValue?.toString() ?? null,
      targetValue: data.targetValue?.toString() ?? null,
      valueUnit: data.valueUnit,
      direction: data.direction,
      startDate: data.startDate,
      deadline: data.deadline,
    })
    .returning();
  return rows[0];
}

export async function goalBelongsToUser(goalId: string, userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: goals.id })
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

export async function deleteGoalForUser(goalId: string, userId: string): Promise<boolean> {
  const rows = await db
    .delete(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)))
    .returning({ id: goals.id });
  return rows.length > 0;
}

export interface NewStageTask {
  orderIndex: number;
  name: string;
  dailyTarget: number;
  dailyUnit: string;
  icon: string;
}

export interface NewStage {
  orderIndex: number;
  name: string;
  focus: string;
  startDate: string;
  endDate: string;
  milestoneValue: number | null;
  icon: string;
  tasks: NewStageTask[];
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function insertStagesWithTasks(
  tx: Tx,
  userId: string,
  goalId: string,
  stages: NewStage[],
): Promise<GoalStage[]> {
  if (stages.length === 0) return [];
  const stageRows = await tx
    .insert(goalStages)
    .values(
      stages.map((s) => ({
        userId,
        goalId,
        orderIndex: s.orderIndex,
        name: s.name,
        focus: s.focus,
        startDate: s.startDate,
        endDate: s.endDate,
        // 兼容旧列：存该阶段首个子任务的量，纯展示无副作用。
        dailyTarget: s.tasks[0]?.dailyTarget ?? 1,
        dailyUnit: s.tasks[0]?.dailyUnit ?? "次",
        milestoneValue: s.milestoneValue?.toString() ?? null,
        icon: s.icon,
      })),
    )
    .returning();

  // 按 orderIndex 对齐插入的阶段，写入其子任务。
  const stageByOrder = new Map(stageRows.map((r) => [r.orderIndex, r.id]));
  const taskValues = stages.flatMap((s) => {
    const stageId = stageByOrder.get(s.orderIndex)!;
    return s.tasks.map((tk) => ({
      userId,
      goalId,
      stageId,
      orderIndex: tk.orderIndex,
      name: tk.name,
      dailyTarget: tk.dailyTarget,
      dailyUnit: tk.dailyUnit,
      icon: tk.icon,
    }));
  });
  if (taskValues.length > 0) {
    await tx.insert(goalStageTasks).values(taskValues);
  }
  return stageRows;
}

/** 首次写入阶段（目标新建后）。 */
export async function insertStages(
  userId: string,
  goalId: string,
  stages: NewStage[],
): Promise<GoalStage[]> {
  if (stages.length === 0) return [];
  return db.transaction((tx) => insertStagesWithTasks(tx, userId, goalId, stages));
}

/**
 * 重拆：保留 orderIndex < fromOrder 的历史阶段，删除其余（连带子任务/打卡 cascade），
 * 再写入新的剩余阶段（orderIndex 从 fromOrder 起）及其子任务。事务保证原子。
 */
export async function replaceRemainingStages(
  userId: string,
  goalId: string,
  fromOrder: number,
  newStages: NewStage[],
): Promise<GoalStage[]> {
  return db.transaction(async (tx) => {
    await tx
      .delete(goalStages)
      .where(
        and(
          eq(goalStages.goalId, goalId),
          eq(goalStages.userId, userId),
          gt(goalStages.orderIndex, fromOrder - 1),
        ),
      );
    return insertStagesWithTasks(tx, userId, goalId, newStages);
  });
}

/** 校验子任务归属，防止越权打卡他人任务。 */
export async function taskBelongsToUser(taskId: string, userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: goalStageTasks.id })
    .from(goalStageTasks)
    .where(and(eq(goalStageTasks.id, taskId), eq(goalStageTasks.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

/** 子任务打卡（幂等）。 */
export async function checkInTask(data: {
  userId: string;
  goalId: string;
  stageId: string;
  taskId: string;
  logDate: string;
}): Promise<void> {
  await db
    .insert(goalTaskLogs)
    .values(data)
    .onConflictDoNothing({ target: [goalTaskLogs.taskId, goalTaskLogs.logDate] });
}

export async function undoTaskCheckIn(data: {
  userId: string;
  taskId: string;
  logDate: string;
}): Promise<void> {
  await db
    .delete(goalTaskLogs)
    .where(
      and(
        eq(goalTaskLogs.taskId, data.taskId),
        eq(goalTaskLogs.userId, data.userId),
        eq(goalTaskLogs.logDate, data.logDate),
      ),
    );
}

/** 手动记录当前数值（同日覆盖）。 */
export async function recordMeasurement(data: {
  userId: string;
  goalId: string;
  measuredOn: string;
  value: number;
}): Promise<void> {
  await db
    .insert(goalMeasurements)
    .values({
      userId: data.userId,
      goalId: data.goalId,
      measuredOn: data.measuredOn,
      value: data.value.toString(),
    })
    .onConflictDoUpdate({
      target: [goalMeasurements.goalId, goalMeasurements.measuredOn],
      set: { value: data.value.toString() },
    });
}

export async function setGoalStatus(
  goalId: string,
  userId: string,
  status: string,
): Promise<void> {
  await db
    .update(goals)
    .set({ status })
    .where(and(eq(goals.id, goalId), eq(goals.userId, userId)));
}
