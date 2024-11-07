import { IProjectParam } from '../case/model/project/IProject';
import { Controller, Get, Post } from '../decorators/controller';
import ProjectService from '../services/projectService';
import { formatResponse } from '../utils/tools';
import { BaseController } from './baseController';
import { Request } from 'express';

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: 项目管理相关接口
 * 
 * components:
 *   schemas:
 *     ProjectParam:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - owner
 *       properties:
 *         name:
 *           type: string
 *           description: 项目名称
 *         description:
 *           type: string
 *           description: 项目描述
 *         type:
 *           type: string
 *           enum: [react, vue, html, nextjs]
 *           description: 项目类型
 *         owner:
 *           type: string
 *           description: 项目所有者ID
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: 项目标签
 *         status:
 *           type: string
 *           enum: [development, completed]
 *           description: 项目状态
 */

@Controller('projects')
export class ProjectController extends BaseController {
    private projectService: ProjectService;
  constructor() {
    super();
    this.projectService = new ProjectService();
    // 调试日志
    //console.log('HomeController 路由:', Reflect.getMetadata('routes', this.constructor));
  }

  /**
   * @swagger
   * /api/projects/create:
   *   post:
   *     summary: 创建新项目
   *     tags: [Projects]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ProjectParam'
   *     responses:
   *       200:
   *         description: 创建成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 0
   *                 msg:
   *                   type: string
   *                   example: 创建项目成功
   *                 data:
   *                   $ref: '#/components/schemas/IProjectResult'
   */
  @Post('/create')
  async createProject(param: IProjectParam) {
    try {
      const project = await this.projectService.createProject(param);
      return formatResponse(0, '创建项目成功', project);
    } catch (error: any) {
      return formatResponse(1, error.message);
    }
  }

  /**
   * @swagger
   * /api/projects/user:
   *   post:
   *     summary: 获取用户的所有项目
   *     tags: [Projects]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *                 description: 用户ID
   *     responses:
   *       200:
   *         description: 获取成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 0
   *                 msg:
   *                   type: string
   *                   example: 获取项目列表成功
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/IProjectResult'
   */
  @Post('/user')
  async getUserProjects(userId: string) {
    try {
      const projects = await this.projectService.getUserProjects(userId);
      return formatResponse(0, '获取项目列表成功', projects);
    } catch (error: any) {
      return formatResponse(1, error.message);
    }
  }

  /**
   * @swagger
   * /api/projects/detail:
   *   post:
   *     summary: 获取项目详情
   *     tags: [Projects]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               projectId:
   *                 type: string
   *                 description: 项目ID
   *     responses:
   *       200:
   *         description: 获取成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 code:
   *                   type: number
   *                   example: 0
   *                 msg:
   *                   type: string
   *                   example: 获取项目详情成功
   *                 data:
   *                   $ref: '#/components/schemas/IProjectResult'
   */
  @Post('/detail')
  async getProject(projectId: string) {
    try {
      const project = await this.projectService.findProjectById(projectId);
      return formatResponse(0, '获取项目详情成功', project);
    } catch (error: any) {
      return formatResponse(1, error.message);
    }
  }

  /**
   * @swagger
   * /api/projects/update:
   *   post:
   *     summary: 更新项目信息
   *     tags: [Projects]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               projectId:
   *                 type: string
   *                 description: 项目ID
   *               param:
   *                 $ref: '#/components/schemas/ProjectParam'
   *     responses:
   *       200:
   *         description: 更新成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   */
  @Post('/update')
  async updateProject(projectId: string, param: Partial<IProjectParam>) {
    try {
      const project = await this.projectService.updateProject(projectId, param);
      return formatResponse(0, '更新项目成功', project);
    } catch (error: any) {
      return formatResponse(1, error.message);
    }
  }

  /**
   * @swagger
   * /api/projects/delete:
   *   post:
   *     summary: 删除项目
   *     tags: [Projects]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               projectId:
   *                 type: string
   *                 description: 项目ID
   *     responses:
   *       200:
   *         description: 删除成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   */
  @Post('/delete')
  async deleteProject(projectId: string) {
    try {
      const result = await this.projectService.deleteProject(projectId);
      return formatResponse(0, '删除项目成功', { success: result });
    } catch (error: any) {
      return formatResponse(1, error.message);
    }
  }

} 