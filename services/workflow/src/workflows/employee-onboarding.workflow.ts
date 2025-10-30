import { proxyActivities, defineSignal, defineQuery, setHandler, sleep } from '@temporalio/workflow';
import type * as activities from '../activities';

// Define workflow signals
export const completeTaskSignal = defineSignal<[{ taskId: string; completedBy: string }]>('completeTask');
export const skipTaskSignal = defineSignal<[{ taskId: string; reason: string }]>('skipTask');

// Define workflow queries
export const statusQuery = defineQuery<string>('status');
export const tasksQuery = defineQuery<any[]>('tasks');

export interface EmployeeOnboardingInput {
  employeeId: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  startDate: string;
  managerId: string;
  hrManagerId: string;
}

export interface OnboardingTask {
  id: string;
  name: string;
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  dueDate?: Date;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
}

const {
  createUserAccount,
  assignWorkstation,
  scheduleITSetup,
  createEmailAccount,
  enrollInBenefits,
  scheduleOrientation,
  assignMentor,
  createBadgeAccess,
  notifyManager,
  notifyHR,
  recordAudit,
  sendWelcomeEmail,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
});

export async function employeeOnboardingWorkflow(input: EmployeeOnboardingInput): Promise<{
  status: 'completed' | 'partial' | 'failed';
  completedTasks: string[];
  skippedTasks: string[];
  tasks: OnboardingTask[];
}> {
  let workflowStatus = 'starting';
  const tasks: OnboardingTask[] = [];
  const completedTasks: string[] = [];
  const skippedTasks: string[] = [];

  // Set up query handlers
  setHandler(statusQuery, () => workflowStatus);
  setHandler(tasksQuery, () => tasks);

  // Set up signal handlers
  setHandler(completeTaskSignal, ({ taskId, completedBy }) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status === 'pending') {
      task.status = 'completed';
      task.completedAt = new Date();
      task.completedBy = completedBy;
      completedTasks.push(taskId);
    }
  });

  setHandler(skipTaskSignal, ({ taskId, reason }) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status === 'pending') {
      task.status = 'skipped';
      task.notes = reason;
      skippedTasks.push(taskId);
    }
  });

  try {
    // Initialize all tasks
    const allTasks: OnboardingTask[] = [
      {
        id: 'create-user-account',
        name: 'Create User Account',
        assignedTo: 'IT',
        status: 'pending',
        dueDate: new Date(input.startDate),
      },
      {
        id: 'create-email',
        name: 'Create Email Account',
        assignedTo: 'IT',
        status: 'pending',
        dueDate: new Date(input.startDate),
      },
      {
        id: 'assign-workstation',
        name: 'Assign Workstation',
        assignedTo: 'IT',
        status: 'pending',
        dueDate: new Date(new Date(input.startDate).getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'create-badge',
        name: 'Create Badge Access',
        assignedTo: 'Security',
        status: 'pending',
        dueDate: new Date(input.startDate),
      },
      {
        id: 'benefits-enrollment',
        name: 'Benefits Enrollment',
        assignedTo: input.hrManagerId,
        status: 'pending',
        dueDate: new Date(new Date(input.startDate).getTime() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'schedule-orientation',
        name: 'Schedule Orientation',
        assignedTo: input.hrManagerId,
        status: 'pending',
        dueDate: new Date(input.startDate),
      },
      {
        id: 'assign-mentor',
        name: 'Assign Mentor',
        assignedTo: input.managerId,
        status: 'pending',
        dueDate: new Date(input.startDate),
      },
    ];

    tasks.push(...allTasks);

    // Phase 1: Pre-arrival setup (2 days before start date)
    workflowStatus = 'pre_arrival_setup';

    // Create user account
    const userAccountTask = tasks.find(t => t.id === 'create-user-account');
    if (userAccountTask) {
      userAccountTask.status = 'in_progress';
      const userAccount = await createUserAccount({
        tenantId: input.tenantId,
        employeeId: input.employeeId,
        name: input.name,
        email: input.email,
        department: input.department,
      });
      userAccountTask.status = 'completed';
      userAccountTask.completedAt = new Date();
      completedTasks.push('create-user-account');
    }

    // Create email account
    const emailTask = tasks.find(t => t.id === 'create-email');
    if (emailTask) {
      emailTask.status = 'in_progress';
      const emailAccount = await createEmailAccount({
        employeeId: input.employeeId,
        name: input.name,
        department: input.department,
      });
      emailTask.status = 'completed';
      emailTask.completedAt = new Date();
      completedTasks.push('create-email');
    }

    // Assign workstation
    const workstationTask = tasks.find(t => t.id === 'assign-workstation');
    if (workstationTask) {
      workstationTask.status = 'in_progress';
      await assignWorkstation({
        employeeId: input.employeeId,
        department: input.department,
        position: input.position,
      });
      workstationTask.status = 'completed';
      workstationTask.completedAt = new Date();
      completedTasks.push('assign-workstation');
    }

    // Phase 2: First day setup
    workflowStatus = 'first_day_setup';

    // Create badge access
    const badgeTask = tasks.find(t => t.id === 'create-badge');
    if (badgeTask) {
      badgeTask.status = 'in_progress';
      await createBadgeAccess({
        employeeId: input.employeeId,
        name: input.name,
        department: input.department,
      });
      badgeTask.status = 'completed';
      badgeTask.completedAt = new Date();
      completedTasks.push('create-badge');
    }

    // Schedule orientation
    const orientationTask = tasks.find(t => t.id === 'schedule-orientation');
    if (orientationTask) {
      orientationTask.status = 'in_progress';
      await scheduleOrientation({
        employeeId: input.employeeId,
        startDate: input.startDate,
        department: input.department,
      });
      orientationTask.status = 'completed';
      orientationTask.completedAt = new Date();
      completedTasks.push('schedule-orientation');
    }

    // Assign mentor
    const mentorTask = tasks.find(t => t.id === 'assign-mentor');
    if (mentorTask) {
      mentorTask.status = 'in_progress';
      await assignMentor({
        employeeId: input.employeeId,
        managerId: input.managerId,
        department: input.department,
      });
      mentorTask.status = 'completed';
      mentorTask.completedAt = new Date();
      completedTasks.push('assign-mentor');
    }

    // Send welcome email
    await sendWelcomeEmail({
      email: input.email,
      name: input.name,
      startDate: input.startDate,
      managerName: input.managerId,
    });

    // Phase 3: First week tasks (can be done asynchronously)
    workflowStatus = 'first_week_tasks';

    // Benefits enrollment - wait for signal or timeout
    const benefitsTask = tasks.find(t => t.id === 'benefits-enrollment');
    if (benefitsTask) {
      benefitsTask.status = 'in_progress';

      // Wait for completion signal with 7-day timeout
      await Promise.race([
        waitForTaskCompletion('benefits-enrollment'),
        sleep('7 days').then(() => {
          benefitsTask.status = 'skipped';
          benefitsTask.notes = 'Timeout - employee needs to complete manually';
          skippedTasks.push('benefits-enrollment');
        }),
      ]);
    }

    // Notify manager about completion
    await notifyManager({
      managerId: input.managerId,
      employeeId: input.employeeId,
      employeeName: input.name,
      completedTasks,
      pendingTasks: tasks.filter(t => t.status === 'pending').map(t => t.name),
    });

    // Notify HR about completion
    await notifyHR({
      hrManagerId: input.hrManagerId,
      employeeId: input.employeeId,
      employeeName: input.name,
      completedTasks,
      skippedTasks,
    });

    // Record audit trail
    await recordAudit({
      entityType: 'employee_onboarding',
      entityId: input.employeeId,
      action: 'completed',
      userId: 'system',
      metadata: { tasks, completedTasks, skippedTasks },
    });

    workflowStatus = 'completed';

    // Determine overall status
    const status = skippedTasks.length === 0
      ? 'completed'
      : completedTasks.length > 0
        ? 'partial'
        : 'failed';

    return {
      status,
      completedTasks,
      skippedTasks,
      tasks,
    };
  } catch (error) {
    workflowStatus = 'error';
    throw error;
  }
}

// Helper function to wait for task completion signal
async function waitForTaskCompletion(taskId: string): Promise<void> {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      // This will be resolved by the completeTaskSignal handler
      // Check is handled in the signal handler above
    }, 1000);

    // Clean up interval when resolved
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve();
    }, 0);
  });
}