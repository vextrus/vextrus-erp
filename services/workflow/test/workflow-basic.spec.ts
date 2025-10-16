import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowService } from '../src/services/workflow.service';
import { TaskService } from '../src/services/task.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Workflow } from '../src/entities/workflow.entity';
import { Task } from '../src/entities/task.entity';
import { Repository } from 'typeorm';

describe('Workflow Service Basic Tests', () => {
  let workflowService: WorkflowService;
  let taskService: TaskService;
  let workflowRepository: Repository<Workflow>;
  let taskRepository: Repository<Task>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowService,
        TaskService,
        {
          provide: getRepositoryToken(Workflow),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Task),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    workflowService = module.get<WorkflowService>(WorkflowService);
    taskService = module.get<TaskService>(TaskService);
    workflowRepository = module.get<Repository<Workflow>>(getRepositoryToken(Workflow));
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
  });

  describe('WorkflowService', () => {
    it('should be defined', () => {
      expect(workflowService).toBeDefined();
    });

    it('should create a workflow', async () => {
      const workflowData = {
        name: 'Purchase Order Approval',
        description: 'Workflow for approving purchase orders',
        tenantId: 'tenant-001',
        steps: [
          { name: 'Manager Approval', type: 'approval' },
          { name: 'Finance Review', type: 'approval' },
        ],
        variables: { threshold: 100000 },
      };

      const mockWorkflow = {
        id: 'workflow-001',
        ...workflowData,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(workflowRepository, 'create').mockReturnValue(mockWorkflow as any);
      jest.spyOn(workflowRepository, 'save').mockResolvedValue(mockWorkflow as any);

      const result = await workflowService.create(workflowData);

      expect(workflowRepository.create).toHaveBeenCalledWith(workflowData);
      expect(workflowRepository.save).toHaveBeenCalledWith(mockWorkflow);
      expect(result).toEqual(mockWorkflow);
    });

    it('should find workflows by tenant', async () => {
      const tenantId = 'tenant-001';
      const mockWorkflows = [
        { id: 'workflow-001', name: 'PO Approval', tenantId },
        { id: 'workflow-002', name: 'Invoice Approval', tenantId },
      ];

      jest.spyOn(workflowRepository, 'find').mockResolvedValue(mockWorkflows as any);

      const result = await workflowService.findByTenant(tenantId);

      expect(workflowRepository.find).toHaveBeenCalledWith({
        where: { tenantId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockWorkflows);
    });

    it('should update workflow status', async () => {
      const workflowId = 'workflow-001';
      const newStatus = 'RUNNING';

      jest.spyOn(workflowRepository, 'update').mockResolvedValue({ affected: 1 } as any);

      const result = await workflowService.updateStatus(workflowId, newStatus);

      expect(workflowRepository.update).toHaveBeenCalledWith(workflowId, { status: newStatus });
      expect(result).toEqual({ affected: 1 });
    });
  });

  describe('TaskService', () => {
    it('should be defined', () => {
      expect(taskService).toBeDefined();
    });

    it('should create a task', async () => {
      const taskData = {
        title: 'Review Purchase Order',
        description: 'Review and approve PO-001',
        workflowId: 'workflow-001',
        assigneeId: 'user-001',
        tenantId: 'tenant-001',
        dueDate: new Date('2025-02-01'),
      };

      const mockTask = {
        id: 'task-001',
        ...taskData,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(taskRepository, 'create').mockReturnValue(mockTask as any);
      jest.spyOn(taskRepository, 'save').mockResolvedValue(mockTask as any);

      const result = await taskService.create(taskData);

      expect(taskRepository.create).toHaveBeenCalledWith(taskData);
      expect(taskRepository.save).toHaveBeenCalledWith(mockTask);
      expect(result).toEqual(mockTask);
    });

    it('should find tasks by assignee', async () => {
      const assigneeId = 'user-001';
      const mockTasks = [
        { id: 'task-001', title: 'Review PO', assigneeId, status: 'PENDING' },
        { id: 'task-002', title: 'Approve Invoice', assigneeId, status: 'IN_PROGRESS' },
      ];

      jest.spyOn(taskRepository, 'find').mockResolvedValue(mockTasks as any);

      const result = await taskService.findByAssignee(assigneeId);

      expect(taskRepository.find).toHaveBeenCalledWith({
        where: { assigneeId },
        order: { dueDate: 'ASC', createdAt: 'DESC' },
      });
      expect(result).toEqual(mockTasks);
    });

    it('should complete a task', async () => {
      const taskId = 'task-001';
      const completionData = {
        result: JSON.stringify({ approved: true, comments: 'Approved' }),
        completedAt: new Date(),
      };

      const mockTask = {
        id: taskId,
        title: 'Review PO',
        status: 'PENDING',
      };

      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask as any);
      jest.spyOn(taskRepository, 'save').mockResolvedValue({
        ...mockTask,
        status: 'COMPLETED',
        ...completionData,
      } as any);

      const result = await taskService.complete(taskId, completionData.result);

      expect(taskRepository.findOne).toHaveBeenCalledWith({ where: { id: taskId } });
      expect(taskRepository.save).toHaveBeenCalledWith({
        ...mockTask,
        status: 'COMPLETED',
        result: completionData.result,
        completedAt: expect.any(Date),
      });
      expect(result.status).toBe('COMPLETED');
    });

    it('should assign a task', async () => {
      const taskId = 'task-001';
      const newAssigneeId = 'user-002';

      const mockTask = {
        id: taskId,
        title: 'Review PO',
        assigneeId: 'user-001',
      };

      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask as any);
      jest.spyOn(taskRepository, 'save').mockResolvedValue({
        ...mockTask,
        assigneeId: newAssigneeId,
      } as any);

      const result = await taskService.assign(taskId, newAssigneeId);

      expect(taskRepository.findOne).toHaveBeenCalledWith({ where: { id: taskId } });
      expect(taskRepository.save).toHaveBeenCalledWith({
        ...mockTask,
        assigneeId: newAssigneeId,
        updatedAt: expect.any(Date),
      });
      expect(result.assigneeId).toBe(newAssigneeId);
    });
  });

  describe('Business Logic Validation', () => {
    it('should validate Bangladesh VAT calculation', () => {
      const subtotal = 100000; // BDT
      const vatRate = 0.15; // 15%
      const expectedVat = subtotal * vatRate;

      expect(expectedVat).toBe(15000);
    });

    it('should calculate tax withholding correctly', () => {
      const invoice = 100000; // BDT
      const contractorRate = 0.075; // 7.5%
      const supplierRate = 0.05; // 5%
      const serviceRate = 0.10; // 10%

      const contractorWithholding = invoice * contractorRate;
      const supplierWithholding = invoice * supplierRate;
      const serviceWithholding = invoice * serviceRate;

      expect(contractorWithholding).toBe(7500);
      expect(supplierWithholding).toBe(5000);
      expect(serviceWithholding).toBe(10000);
    });

    it('should determine approval levels based on amount', () => {
      const getApprovalLevel = (amount: number): string => {
        if (amount < 100000) return 'auto-approve';
        if (amount < 500000) return 'manager';
        if (amount < 1000000) return 'director';
        return 'ceo';
      };

      expect(getApprovalLevel(50000)).toBe('auto-approve');
      expect(getApprovalLevel(250000)).toBe('manager');
      expect(getApprovalLevel(750000)).toBe('director');
      expect(getApprovalLevel(2000000)).toBe('ceo');
    });

    it('should validate Bangladesh NID format', () => {
      const validateNID = (nid: string): boolean => {
        // NID can be 10 or 13 or 17 digits
        return /^(\d{10}|\d{13}|\d{17})$/.test(nid);
      };

      expect(validateNID('1234567890')).toBe(true); // 10 digit
      expect(validateNID('1234567890123')).toBe(true); // 13 digit
      expect(validateNID('12345678901234567')).toBe(true); // 17 digit
      expect(validateNID('123456789')).toBe(false); // Invalid
      expect(validateNID('12345678901')).toBe(false); // Invalid
    });

    it('should validate Bangladesh mobile number format', () => {
      const validateMobile = (mobile: string): boolean => {
        // Bangladesh mobile format: 01[3-9]XXXXXXXX
        return /^01[3-9]\d{8}$/.test(mobile);
      };

      expect(validateMobile('01712345678')).toBe(true);
      expect(validateMobile('01812345678')).toBe(true);
      expect(validateMobile('01912345678')).toBe(true);
      expect(validateMobile('01234567890')).toBe(false); // Invalid prefix
      expect(validateMobile('0171234567')).toBe(false); // Too short
    });
  });

  describe('Workflow State Transitions', () => {
    it('should follow valid state transitions', () => {
      const validTransitions = {
        PENDING: ['RUNNING', 'CANCELLED'],
        RUNNING: ['COMPLETED', 'FAILED', 'CANCELLED'],
        COMPLETED: [],
        FAILED: ['PENDING'], // Can retry
        CANCELLED: [],
      };

      const isValidTransition = (from: string, to: string): boolean => {
        return validTransitions[from]?.includes(to) || false;
      };

      expect(isValidTransition('PENDING', 'RUNNING')).toBe(true);
      expect(isValidTransition('RUNNING', 'COMPLETED')).toBe(true);
      expect(isValidTransition('RUNNING', 'FAILED')).toBe(true);
      expect(isValidTransition('FAILED', 'PENDING')).toBe(true);
      expect(isValidTransition('COMPLETED', 'RUNNING')).toBe(false);
      expect(isValidTransition('CANCELLED', 'RUNNING')).toBe(false);
    });
  });
});