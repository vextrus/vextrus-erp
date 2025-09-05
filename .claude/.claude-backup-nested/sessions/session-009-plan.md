# Session 009: Project Management Module - Database & API Foundation

**Date**: Ready to Start
**Phase**: 2 - Core Business Modules
**Module**: Project Management (Part 1 of 3)
**Status**: 📋 PLANNED

## 🎯 Session Objectives

This session focuses on building the database foundation and API layer for the Project Management module, which is the cornerstone of the construction ERP system.

### Primary Goals
1. Extend database schema for comprehensive project management
2. Implement Work Breakdown Structure (WBS) support
3. Create task management with dependencies
4. Build resource allocation system
5. Add Bangladesh-specific RAJUK workflow fields
6. Implement weather impact tracking for monsoon planning

## 📋 Implementation Plan

### Step 1: Module Structure Setup (30 minutes)

#### 1.1 Create Module Directory Structure
```bash
# Create the module structure
mkdir -p src/modules/projects/{components,services,hooks,types,validations,utils}
mkdir -p src/modules/projects/components/{cards,forms,tables,charts}
mkdir -p src/app/api/v1/{projects,tasks,milestones,resources}
```

#### 1.2 Module Files to Create
```
src/modules/projects/
├── components/
│   ├── cards/
│   │   ├── ProjectCard.tsx
│   │   ├── TaskCard.tsx
│   │   └── MilestoneCard.tsx
│   ├── forms/
│   │   ├── ProjectForm.tsx
│   │   ├── TaskForm.tsx
│   │   └── ResourceAllocationForm.tsx
│   ├── tables/
│   │   ├── ProjectsTable.tsx
│   │   ├── TasksTable.tsx
│   │   └── ResourcesTable.tsx
│   └── charts/
│       ├── GanttChart.tsx
│       ├── ResourceChart.tsx
│       └── ProgressChart.tsx
├── services/
│   ├── project.service.ts
│   ├── task.service.ts
│   ├── milestone.service.ts
│   ├── resource.service.ts
│   └── gantt.service.ts
├── hooks/
│   ├── useProjects.ts
│   ├── useTasks.ts
│   ├── useResources.ts
│   └── useGanttData.ts
├── types/
│   └── index.ts
├── validations/
│   ├── project.validation.ts
│   ├── task.validation.ts
│   ├── milestone.validation.ts
│   └── resource.validation.ts
└── utils/
    ├── wbs.utils.ts
    ├── critical-path.utils.ts
    ├── gantt.utils.ts
    └── resource-leveling.utils.ts
```

### Step 2: Database Schema Extension (45 minutes)

#### 2.1 Update Prisma Schema
```prisma
// Add to prisma/schema.prisma

// Extend existing Project model
model Project {
  // ... existing fields ...
  
  // Project Management Fields
  wbsCode             String?
  projectType         ProjectType      @default(CONSTRUCTION)
  contractType        ContractType     @default(FIXED_PRICE)
  
  // Timeline
  plannedStartDate    DateTime
  plannedEndDate      DateTime
  actualStartDate     DateTime?
  actualEndDate       DateTime?
  baselineStartDate   DateTime?
  baselineEndDate     DateTime?
  
  // Progress & Status
  overallProgress     Float            @default(0)
  scheduleVariance    Float            @default(0)
  costVariance        Float            @default(0)
  priority            ProjectPriority  @default(MEDIUM)
  riskLevel           RiskLevel        @default(MEDIUM)
  
  // RAJUK Specific (Bangladesh)
  rajukApprovalNumber String?
  rajukSubmissionDate DateTime?
  rajukApprovalDate   DateTime?
  rajukStatus         RajukStatus      @default(NOT_SUBMITTED)
  rajukRemarks        String?          @db.Text
  
  // Weather Impact (Monsoon Planning)
  monsoonImpactFactor Float            @default(1.0)
  weatherDelayDays    Int              @default(0)
  lastWeatherUpdate   DateTime?
  
  // Relationships
  phases              ProjectPhase[]
  tasks               Task[]
  milestones          Milestone[]
  resources           ProjectResource[]
  dependencies        ProjectDependency[]
  workCalendar        WorkCalendar?
  
  @@index([wbsCode])
  @@index([plannedStartDate, plannedEndDate])
  @@index([organizationId, status])
}

// New Models for Project Management

model ProjectPhase {
  id                  String           @id @default(cuid())
  projectId           String
  project             Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  name                String
  description         String?          @db.Text
  sequenceNumber      Int
  wbsCode             String
  
  plannedStartDate    DateTime
  plannedEndDate      DateTime
  actualStartDate     DateTime?
  actualEndDate       DateTime?
  
  progress            Float            @default(0)
  status              PhaseStatus      @default(NOT_STARTED)
  
  budget              Decimal          @db.Decimal(15, 2)
  actualCost          Decimal          @default(0) @db.Decimal(15, 2)
  
  tasks               Task[]
  
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt
  
  @@unique([projectId, sequenceNumber])
  @@unique([projectId, wbsCode])
}

model Task {
  id                  String           @id @default(cuid())
  organizationId      String
  organization        Organization     @relation(fields: [organizationId], references: [id])
  projectId           String
  project             Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  phaseId             String?
  phase               ProjectPhase?    @relation(fields: [phaseId], references: [id])
  parentTaskId        String?
  parentTask          Task?            @relation("SubTasks", fields: [parentTaskId], references: [id])
  subTasks            Task[]           @relation("SubTasks")
  
  // Task Details
  wbsCode             String
  title               String
  description         String?          @db.Text
  taskType            TaskType
  priority            TaskPriority     @default(MEDIUM)
  status              TaskStatus       @default(NOT_STARTED)
  
  // Timeline
  plannedStartDate    DateTime
  plannedEndDate      DateTime
  actualStartDate     DateTime?
  actualEndDate       DateTime?
  duration            Int              // in days
  
  // Effort & Progress
  estimatedHours      Float
  actualHours         Float            @default(0)
  remainingHours      Float            @default(0)
  progress            Float            @default(0)
  
  // Critical Path
  isCritical          Boolean          @default(false)
  totalFloat          Int              @default(0) // in days
  freeFloat           Int              @default(0) // in days
  
  // Dependencies
  predecessors        TaskDependency[] @relation("PredecessorTask")
  successors          TaskDependency[] @relation("SuccessorTask")
  
  // Assignments & Resources
  assignments         TaskAssignment[]
  resources           TaskResource[]
  
  // Constraints
  constraintType      TaskConstraint   @default(AS_SOON_AS_POSSIBLE)
  constraintDate      DateTime?
  
  createdBy           String?
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt
  deletedAt           DateTime?
  
  @@index([organizationId])
  @@index([projectId, wbsCode])
  @@index([projectId, status])
  @@index([plannedStartDate, plannedEndDate])
}

model TaskDependency {
  id                  String           @id @default(cuid())
  predecessorId       String
  predecessor         Task             @relation("PredecessorTask", fields: [predecessorId], references: [id], onDelete: Cascade)
  successorId         String
  successor           Task             @relation("SuccessorTask", fields: [successorId], references: [id], onDelete: Cascade)
  
  dependencyType      DependencyType   @default(FINISH_TO_START)
  lagTime             Int              @default(0) // in days (can be negative for lead)
  
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt
  
  @@unique([predecessorId, successorId])
}

model Milestone {
  id                  String           @id @default(cuid())
  projectId           String
  project             Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  name                String
  description         String?          @db.Text
  type                MilestoneType    @default(PROJECT)
  
  targetDate          DateTime
  actualDate          DateTime?
  status              MilestoneStatus  @default(PENDING)
  
  // Payment Milestone
  isPaymentMilestone  Boolean          @default(false)
  paymentPercentage   Float?
  paymentAmount       Decimal?         @db.Decimal(15, 2)
  
  // Deliverables
  deliverables        String[]
  
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt
  
  @@index([projectId, targetDate])
}

model ProjectResource {
  id                  String           @id @default(cuid())
  organizationId      String
  organization        Organization     @relation(fields: [organizationId], references: [id])
  projectId           String
  project             Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  resourceType        ResourceType
  resourceCategory    ResourceCategory
  name                String
  code                String?
  
  // Quantity & Cost
  totalQuantity       Float
  allocatedQuantity   Float            @default(0)
  availableQuantity   Float            @default(0)
  unit                String
  costPerUnit         Decimal          @db.Decimal(15, 2)
  totalCost           Decimal          @db.Decimal(15, 2)
  
  // For Human Resources
  employeeId          String?
  employee            Employee?        @relation(fields: [employeeId], references: [id])
  skillLevel          SkillLevel?
  
  // For Equipment
  equipmentId         String?
  equipment           Equipment?       @relation(fields: [equipmentId], references: [id])
  
  // Utilization
  plannedHours        Float?
  actualHours         Float            @default(0)
  utilizationRate     Float            @default(0)
  
  // Assignments
  taskResources       TaskResource[]
  assignments         TaskAssignment[]
  
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt
  
  @@index([organizationId])
  @@index([projectId, resourceType])
  @@unique([projectId, code])
}

model TaskResource {
  id                  String           @id @default(cuid())
  taskId              String
  task                Task             @relation(fields: [taskId], references: [id], onDelete: Cascade)
  resourceId          String
  resource            ProjectResource  @relation(fields: [resourceId], references: [id])
  
  quantity            Float
  hours               Float?
  startDate           DateTime
  endDate             DateTime
  
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt
  
  @@unique([taskId, resourceId])
}

model TaskAssignment {
  id                  String           @id @default(cuid())
  taskId              String
  task                Task             @relation(fields: [taskId], references: [id], onDelete: Cascade)
  resourceId          String
  resource            ProjectResource  @relation(fields: [resourceId], references: [id])
  userId              String?
  user                User?            @relation(fields: [userId], references: [id])
  
  role                AssignmentRole   @default(ASSIGNEE)
  assignedHours       Float
  actualHours         Float            @default(0)
  
  startDate           DateTime
  endDate             DateTime
  
  status              AssignmentStatus @default(ASSIGNED)
  
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt
  
  @@unique([taskId, resourceId])
}

model WorkCalendar {
  id                  String           @id @default(cuid())
  projectId           String           @unique
  project             Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  name                String
  workingDays         Int[]            // [1,2,3,4,5] for Mon-Fri
  workingHours        Json             // {"start": "09:00", "end": "18:00"}
  holidays            Holiday[]
  
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt
}

model Holiday {
  id                  String           @id @default(cuid())
  calendarId          String
  calendar            WorkCalendar     @relation(fields: [calendarId], references: [id], onDelete: Cascade)
  
  name                String
  date                DateTime
  type                HolidayType      @default(PUBLIC)
  
  @@unique([calendarId, date])
}

model ProjectDependency {
  id                  String           @id @default(cuid())
  projectId           String
  project             Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  dependentProjectId  String
  dependentProject    Project          @relation(fields: [dependentProjectId], references: [id])
  
  dependencyType      ProjectDependencyType
  description         String?
  
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt
  
  @@unique([projectId, dependentProjectId])
}

// Enums
enum ProjectType {
  CONSTRUCTION
  INFRASTRUCTURE
  RESIDENTIAL
  COMMERCIAL
  INDUSTRIAL
  RENOVATION
}

enum ContractType {
  FIXED_PRICE
  TIME_AND_MATERIAL
  COST_PLUS
  UNIT_PRICE
}

enum ProjectPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
  VERY_HIGH
}

enum RajukStatus {
  NOT_SUBMITTED
  SUBMITTED
  UNDER_REVIEW
  QUERY_RAISED
  QUERY_RESOLVED
  APPROVED
  REJECTED
  REVISION_REQUIRED
}

enum PhaseStatus {
  NOT_STARTED
  IN_PROGRESS
  ON_HOLD
  COMPLETED
  CANCELLED
}

enum TaskType {
  PLANNING
  DESIGN
  PROCUREMENT
  CONSTRUCTION
  INSPECTION
  TESTING
  DOCUMENTATION
  MILESTONE
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TaskStatus {
  NOT_STARTED
  IN_PROGRESS
  ON_HOLD
  COMPLETED
  CANCELLED
  DEFERRED
}

enum TaskConstraint {
  AS_SOON_AS_POSSIBLE
  AS_LATE_AS_POSSIBLE
  MUST_START_ON
  MUST_FINISH_ON
  START_NO_EARLIER_THAN
  START_NO_LATER_THAN
  FINISH_NO_EARLIER_THAN
  FINISH_NO_LATER_THAN
}

enum DependencyType {
  FINISH_TO_START    // FS
  START_TO_START     // SS
  FINISH_TO_FINISH   // FF
  START_TO_FINISH    // SF
}

enum MilestoneType {
  PROJECT
  PHASE
  PAYMENT
  DELIVERY
  APPROVAL
  REGULATORY
}

enum MilestoneStatus {
  PENDING
  ACHIEVED
  DELAYED
  CANCELLED
}

enum ResourceType {
  HUMAN
  EQUIPMENT
  MATERIAL
  SUBCONTRACTOR
}

enum ResourceCategory {
  LABOR
  MACHINERY
  TOOLS
  RAW_MATERIAL
  CONSUMABLE
}

enum SkillLevel {
  JUNIOR
  MID_LEVEL
  SENIOR
  EXPERT
}

enum AssignmentRole {
  ASSIGNEE
  REVIEWER
  APPROVER
  OBSERVER
}

enum AssignmentStatus {
  ASSIGNED
  IN_PROGRESS
  COMPLETED
  REASSIGNED
}

enum HolidayType {
  PUBLIC
  COMPANY
  PROJECT_SPECIFIC
}

enum ProjectDependencyType {
  BLOCKS
  DEPENDS_ON
  RELATED_TO
}
```

#### 2.2 Run Database Migration
```bash
# Generate migration
npx prisma migrate dev --name add-project-management-models

# Generate Prisma client
npx prisma generate
```

### Step 3: API Implementation (1 hour)

#### 3.1 Project APIs
```typescript
// src/app/api/v1/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { apiHandler } from '@/lib/api/handler'
import { withAuth } from '@/lib/auth/middleware'
import { createProjectSchema, projectQuerySchema } from '@/modules/projects/validations/project.validation'
import { ProjectService } from '@/modules/projects/services/project.service'

const projectService = new ProjectService()

export const GET = withAuth(
  apiHandler({
    async handler(req: NextRequest, session) {
      const searchParams = req.nextUrl.searchParams
      const query = projectQuerySchema.parse({
        page: searchParams.get('page') || '1',
        limit: searchParams.get('limit') || '20',
        status: searchParams.get('status'),
        priority: searchParams.get('priority'),
        search: searchParams.get('search'),
      })
      
      const projects = await projectService.listProjects(
        session.organizationId,
        query
      )
      
      return NextResponse.json({
        success: true,
        data: projects.data,
        meta: projects.meta,
      })
    },
  })
)

export const POST = withAuth(
  apiHandler({
    async handler(req: NextRequest, session) {
      const body = await req.json()
      const data = createProjectSchema.parse(body)
      
      const project = await projectService.createProject({
        ...data,
        organizationId: session.organizationId,
        createdBy: session.userId,
      })
      
      return NextResponse.json({
        success: true,
        data: project,
      }, { status: 201 })
    },
  })
)
```

#### 3.2 Task APIs
```typescript
// src/app/api/v1/tasks/route.ts
export const GET = withAuth(
  apiHandler({
    async handler(req: NextRequest, session) {
      const searchParams = req.nextUrl.searchParams
      const projectId = searchParams.get('projectId')
      
      const tasks = await taskService.listTasks(
        session.organizationId,
        projectId
      )
      
      return NextResponse.json({
        success: true,
        data: tasks,
      })
    },
  })
)

export const POST = withAuth(
  apiHandler({
    async handler(req: NextRequest, session) {
      const body = await req.json()
      const data = createTaskSchema.parse(body)
      
      // Validate project belongs to organization
      await projectService.validateProjectAccess(
        data.projectId,
        session.organizationId
      )
      
      // Check for circular dependencies
      if (data.predecessorIds?.length) {
        await taskService.validateDependencies(
          data.projectId,
          data.predecessorIds
        )
      }
      
      const task = await taskService.createTask({
        ...data,
        organizationId: session.organizationId,
      })
      
      // Recalculate critical path
      await projectService.calculateCriticalPath(data.projectId)
      
      return NextResponse.json({
        success: true,
        data: task,
      }, { status: 201 })
    },
  })
)
```

#### 3.3 Gantt Chart API
```typescript
// src/app/api/v1/projects/[id]/gantt/route.ts
export const GET = withAuth(
  apiHandler({
    async handler(req: NextRequest, { params }, session) {
      const projectId = params.id
      
      // Validate access
      await projectService.validateProjectAccess(
        projectId,
        session.organizationId
      )
      
      // Get Gantt data
      const ganttData = await ganttService.getGanttData(projectId)
      
      return NextResponse.json({
        success: true,
        data: {
          project: ganttData.project,
          phases: ganttData.phases,
          tasks: ganttData.tasks,
          dependencies: ganttData.dependencies,
          milestones: ganttData.milestones,
          resources: ganttData.resources,
          calendar: ganttData.calendar,
        },
      })
    },
  })
)
```

### Step 4: Service Layer Implementation (45 minutes)

#### 4.1 Project Service
```typescript
// src/modules/projects/services/project.service.ts
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma'
import { CriticalPathService } from './critical-path.service'
import { WBSService } from './wbs.service'

export class ProjectService {
  private criticalPath = new CriticalPathService()
  private wbs = new WBSService()
  
  async createProject(data: CreateProjectInput) {
    return await prisma.$transaction(async (tx) => {
      // Create project
      const project = await tx.project.create({
        data: {
          ...data,
          wbsCode: this.wbs.generateProjectCode(data.organizationId),
        },
      })
      
      // Create default phases
      const phases = await this.createDefaultPhases(tx, project.id)
      
      // Create work calendar
      await this.createWorkCalendar(tx, project.id)
      
      // Initialize RAJUK tracking if needed
      if (data.requiresRajukApproval) {
        await this.initializeRajukWorkflow(tx, project.id)
      }
      
      return project
    })
  }
  
  async calculateCriticalPath(projectId: string) {
    // Get all tasks and dependencies
    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        predecessors: true,
        successors: true,
      },
    })
    
    // Calculate using CPM algorithm
    const criticalPath = this.criticalPath.calculate(tasks)
    
    // Update tasks with critical path info
    await prisma.$transaction(
      criticalPath.map(task => 
        prisma.task.update({
          where: { id: task.id },
          data: {
            isCritical: task.isCritical,
            totalFloat: task.totalFloat,
            freeFloat: task.freeFloat,
          },
        })
      )
    )
    
    return criticalPath
  }
  
  async updateProjectProgress(projectId: string) {
    // Calculate weighted progress based on tasks
    const tasks = await prisma.task.findMany({
      where: { projectId },
      select: {
        estimatedHours: true,
        progress: true,
      },
    })
    
    const totalHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0)
    const weightedProgress = tasks.reduce(
      (sum, t) => sum + (t.estimatedHours * t.progress),
      0
    )
    
    const overallProgress = totalHours > 0 
      ? (weightedProgress / totalHours) 
      : 0
    
    await prisma.project.update({
      where: { id: projectId },
      data: { overallProgress },
    })
    
    return overallProgress
  }
  
  async checkWeatherImpact(projectId: string) {
    // Get project location and dates
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        location: true,
        plannedStartDate: true,
        plannedEndDate: true,
      },
    })
    
    // Check monsoon period (June-September in Bangladesh)
    const monsoonMonths = [5, 6, 7, 8] // 0-indexed
    const startMonth = project.plannedStartDate.getMonth()
    const endMonth = project.plannedEndDate.getMonth()
    
    let impactFactor = 1.0
    let delayDays = 0
    
    // Calculate impact if project overlaps with monsoon
    if (monsoonMonths.some(m => m >= startMonth && m <= endMonth)) {
      impactFactor = 1.2 // 20% productivity reduction
      delayDays = Math.floor(
        (project.plannedEndDate - project.plannedStartDate) / 
        (1000 * 60 * 60 * 24) * 0.1
      ) // 10% additional days
    }
    
    await prisma.project.update({
      where: { id: projectId },
      data: {
        monsoonImpactFactor: impactFactor,
        weatherDelayDays: delayDays,
        lastWeatherUpdate: new Date(),
      },
    })
    
    return { impactFactor, delayDays }
  }
  
  private async createDefaultPhases(tx: any, projectId: string) {
    const defaultPhases = [
      { name: 'Planning & Design', sequenceNumber: 1, duration: 30 },
      { name: 'Procurement', sequenceNumber: 2, duration: 20 },
      { name: 'Site Preparation', sequenceNumber: 3, duration: 15 },
      { name: 'Foundation', sequenceNumber: 4, duration: 25 },
      { name: 'Structure', sequenceNumber: 5, duration: 60 },
      { name: 'Finishing', sequenceNumber: 6, duration: 45 },
      { name: 'Handover', sequenceNumber: 7, duration: 10 },
    ]
    
    let startDate = new Date()
    
    return await Promise.all(
      defaultPhases.map(async (phase) => {
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + phase.duration)
        
        const created = await tx.projectPhase.create({
          data: {
            projectId,
            name: phase.name,
            sequenceNumber: phase.sequenceNumber,
            wbsCode: `${projectId}.${phase.sequenceNumber}`,
            plannedStartDate: startDate,
            plannedEndDate: endDate,
            status: 'NOT_STARTED',
            budget: 0,
          },
        })
        
        startDate = new Date(endDate)
        return created
      })
    )
  }
}
```

#### 4.2 Task Service
```typescript
// src/modules/projects/services/task.service.ts
export class TaskService {
  async createTask(data: CreateTaskInput) {
    return await prisma.$transaction(async (tx) => {
      // Generate WBS code
      const wbsCode = await this.generateWBSCode(
        tx,
        data.projectId,
        data.phaseId,
        data.parentTaskId
      )
      
      // Create task
      const task = await tx.task.create({
        data: {
          ...data,
          wbsCode,
          duration: this.calculateDuration(
            data.plannedStartDate,
            data.plannedEndDate
          ),
        },
      })
      
      // Create dependencies
      if (data.predecessorIds?.length) {
        await this.createDependencies(tx, task.id, data.predecessorIds)
      }
      
      // Assign resources
      if (data.resourceIds?.length) {
        await this.assignResources(tx, task.id, data.resourceIds)
      }
      
      return task
    })
  }
  
  async validateDependencies(
    projectId: string,
    taskId: string,
    predecessorIds: string[]
  ) {
    // Check for circular dependencies
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    
    async function hasCycle(currentId: string): Promise<boolean> {
      visited.add(currentId)
      recursionStack.add(currentId)
      
      const dependencies = await prisma.taskDependency.findMany({
        where: { predecessorId: currentId },
        select: { successorId: true },
      })
      
      for (const dep of dependencies) {
        if (!visited.has(dep.successorId)) {
          if (await hasCycle(dep.successorId)) {
            return true
          }
        } else if (recursionStack.has(dep.successorId)) {
          return true
        }
      }
      
      recursionStack.delete(currentId)
      return false
    }
    
    // Check each predecessor
    for (const predId of predecessorIds) {
      if (await hasCycle(predId)) {
        throw new Error('Circular dependency detected')
      }
    }
    
    return true
  }
}
```

### Step 5: Validation Schemas (30 minutes)

```typescript
// src/modules/projects/validations/project.validation.ts
import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  projectType: z.enum([
    'CONSTRUCTION',
    'INFRASTRUCTURE',
    'RESIDENTIAL',
    'COMMERCIAL',
    'INDUSTRIAL',
    'RENOVATION'
  ]),
  contractType: z.enum([
    'FIXED_PRICE',
    'TIME_AND_MATERIAL',
    'COST_PLUS',
    'UNIT_PRICE'
  ]),
  plannedStartDate: z.string().datetime(),
  plannedEndDate: z.string().datetime(),
  budget: z.number().positive(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  requiresRajukApproval: z.boolean().default(false),
  rajukApprovalNumber: z.string().optional(),
  location: z.string(),
  clientId: z.string().cuid(),
})

// src/modules/projects/validations/task.validation.ts
export const createTaskSchema = z.object({
  projectId: z.string().cuid(),
  phaseId: z.string().cuid().optional(),
  parentTaskId: z.string().cuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  taskType: z.enum([
    'PLANNING',
    'DESIGN',
    'PROCUREMENT',
    'CONSTRUCTION',
    'INSPECTION',
    'TESTING',
    'DOCUMENTATION'
  ]),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  plannedStartDate: z.string().datetime(),
  plannedEndDate: z.string().datetime(),
  estimatedHours: z.number().positive(),
  predecessorIds: z.array(z.string().cuid()).optional(),
  resourceIds: z.array(z.string().cuid()).optional(),
  constraintType: z.enum([
    'AS_SOON_AS_POSSIBLE',
    'AS_LATE_AS_POSSIBLE',
    'MUST_START_ON',
    'MUST_FINISH_ON'
  ]).default('AS_SOON_AS_POSSIBLE'),
  constraintDate: z.string().datetime().optional(),
})
```

### Step 6: Testing (30 minutes)

```typescript
// __tests__/api/projects.test.ts
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import { prisma } from '@/lib/prisma'

describe('Project Management API', () => {
  let organizationId: string
  let projectId: string
  let token: string
  
  beforeAll(async () => {
    // Setup test data
    const org = await prisma.organization.create({
      data: { name: 'Test Org' }
    })
    organizationId = org.id
    
    // Get auth token
    token = await getTestToken(organizationId)
  })
  
  afterAll(async () => {
    // Cleanup
    await prisma.organization.delete({
      where: { id: organizationId }
    })
  })
  
  test('creates project with WBS structure', async () => {
    const response = await fetch('/api/v1/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Construction Project',
        projectType: 'CONSTRUCTION',
        plannedStartDate: '2024-01-01T00:00:00Z',
        plannedEndDate: '2024-12-31T23:59:59Z',
        budget: 1000000,
      }),
    })
    
    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.data.wbsCode).toBeDefined()
    projectId = data.data.id
  })
  
  test('creates task with dependencies', async () => {
    const task1 = await createTask(projectId, {
      title: 'Site Preparation',
      taskType: 'CONSTRUCTION',
      estimatedHours: 100,
    })
    
    const task2 = await createTask(projectId, {
      title: 'Foundation Work',
      taskType: 'CONSTRUCTION',
      estimatedHours: 200,
      predecessorIds: [task1.id],
    })
    
    expect(task2.predecessors).toHaveLength(1)
  })
  
  test('calculates critical path', async () => {
    const response = await fetch(
      `/api/v1/projects/${projectId}/critical-path`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    )
    
    const data = await response.json()
    expect(data.data.criticalTasks).toBeDefined()
    expect(data.data.projectDuration).toBeGreaterThan(0)
  })
  
  test('enforces multi-tenant isolation', async () => {
    const otherOrgToken = await getTestToken('other-org-id')
    
    const response = await fetch(
      `/api/v1/projects/${projectId}`,
      {
        headers: { 'Authorization': `Bearer ${otherOrgToken}` },
      }
    )
    
    expect(response.status).toBe(404)
  })
  
  test('handles RAJUK workflow', async () => {
    const response = await fetch(
      `/api/v1/projects/${projectId}/rajuk`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionDate: '2024-01-15T00:00:00Z',
          approvalNumber: 'RAJUK/2024/001',
        }),
      }
    )
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.data.rajukStatus).toBe('SUBMITTED')
  })
})
```

## 📊 Success Metrics

By the end of Session 009, we should have:

✅ **Database**
- 15+ new models for project management
- Comprehensive WBS structure support
- Task dependency tracking
- Resource allocation tables
- RAJUK workflow fields

✅ **APIs**
- Project CRUD operations
- Task management endpoints
- Milestone tracking
- Resource allocation APIs
- Gantt chart data endpoint
- Critical path calculation

✅ **Business Logic**
- WBS code generation
- Task dependency validation
- Critical path algorithm
- Resource conflict detection
- Weather impact calculation
- Progress tracking

✅ **Testing**
- Unit tests for all services
- API endpoint tests
- Multi-tenant isolation tests
- Dependency validation tests
- >80% code coverage

## 🚧 Common Challenges & Solutions

### Challenge 1: Circular Dependencies
**Solution**: Implement cycle detection algorithm before creating dependencies

### Challenge 2: WBS Code Generation
**Solution**: Use hierarchical numbering system (1.1, 1.1.1, etc.)

### Challenge 3: Critical Path Calculation
**Solution**: Implement CPM algorithm with forward and backward pass

### Challenge 4: Resource Over-allocation
**Solution**: Check resource availability before assignment

### Challenge 5: Multi-tenant Data Isolation
**Solution**: Always include organizationId in queries and validate access

## 📚 Resources & References

- [Critical Path Method (CPM)](https://www.projectmanager.com/blog/critical-path-method)
- [Work Breakdown Structure](https://www.workbreakdownstructure.com/)
- [Gantt Chart Best Practices](https://www.gantt.com/best-practices)
- [RAJUK Building Approval Process](http://www.rajukdhaka.gov.bd/)
- [Bangladesh Weather Patterns](https://www.bmd.gov.bd/)

## 🎯 Next Session Preview

**Session 010: Business Logic & Real-time**
- Implement task dependency algorithms
- Build critical path calculation engine
- Create resource leveling system
- Add Socket.io for real-time updates
- Implement weather impact calculations
- Build notification system

---

**Session 009 Status**: READY TO IMPLEMENT
**Estimated Duration**: 3-4 hours
**Prerequisites**: Phase 1 complete, Docker services running
**Success Rate**: High with systematic approach

---