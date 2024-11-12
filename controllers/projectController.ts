import { Request, Response } from 'express';
import { Controller, Post, Get } from '../decorators/controller';
import ProjectService from '../services/projectService';
import { formatResponse } from '../utils/tools';
import { BaseController } from './baseController';
import { IProjectParam } from '../case/model/project/IProject';

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
 *     FileStructure:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [file, directory]
 *         path:
 *           type: string
 *         children:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FileStructure'
 */

@Controller('projects')
export class ProjectController extends BaseController {
    private projectService: ProjectService;

    constructor() {
        super();
        this.projectService = new ProjectService();
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
    async createProject(req: Request) {
        try {
            const param = req.body;
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
    async getUserProjects(req: Request) {
        try {
            const userId = req.body.userId;
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
    async getProject(req: Request) {
        try {
            const projectId = req.query.projectId as string;
            if (!projectId) {
                return formatResponse(1, '项目ID不能为空');
            }
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
     *             properties:
     *               projectId:
     *                 type: string
     *                 description: 项目ID
     *               param:
     *                 type: object
     *                 properties:
     *                   name:
     *                     type: string
     *                     description: 项目名称
     *                   description:
     *                     type: string
     *                     description: 项目描述
     *                   type:
     *                     type: string
     *                     enum: [react, vue, html, nextjs]
     *                     description: 项目类型
     *                   owner:
     *                     type: string
     *                     description: 项目所有者ID
     *                   tags:
     *                     type: array
     *                     items:
     *                       type: string
     *                     description: 项目标签
     *                   status:
     *                     type: string
     *                     enum: [development, completed]
     *                     description: 项目状态
     *             required:
     *               - projectId
     *     responses:
     *       200:
     *         description: 更新成功
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 code:
     *                   type: number
     *                   example: 0
     *                 message:
     *                   type: string
     *                   example: 更新项目成功
     *                 data:
     *                   $ref: '#/components/schemas/IProjectResult'
     *       400:
     *         description: 请求参数错误
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 code:
     *                   type: number
     *                   example: 1
     *                 message:
     *                   type: string
     *                   example: 项目ID不能为空
     *                 data:
     *                   type: object
     */
    @Post('/update')
    async updateProject(req: Request) {
        try {
            const projectId = req.body.projectId;
            const param = req.body.param as Partial<IProjectParam>;
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
    async deleteProject(req: Request) {
        try {
            const projectId = req.body.projectId;
            const result = await this.projectService.deleteProject(projectId);
            return formatResponse(0, '删除项目成功', { success: result });
        } catch (error: any) {
            return formatResponse(1, error.message);
        }
    }

    /**
     * @swagger
     * /api/projects/{userId}/{projectId}/structure:
     *   get:
     *     summary: 获取项目目录结构
     *     tags: [Projects]
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: projectId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: 获取成功
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/FileStructure'
     */
    @Get('/:userId/:projectId/structure')
    async getProjectStructure(req: Request, res: Response) {
        try {
            const { userId, projectId } = req.params;
            const structure = await this.projectService.getProjectStructure(userId, projectId);
            res.json(formatResponse(0, '获取成功', structure));
        } catch (error: any) {
            res.status(500).json(formatResponse(-1, '获取项目结构失败', { error: error.message }));
        }
    }

    /**
     * @swagger
     * /api/projects/{userId}/{projectId}/file:
     *   get:
     *     summary: 获取文件内容
     *     tags: [Projects]
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *       - in: path
     *         name: projectId
     *         required: true
     *         schema:
     *           type: string
     *       - in: query
     *         name: path
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: 获取成功
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 content:
     *                   type: string
     */
    @Get('/:userId/:projectId/file')
    async getFileContent(req: Request, res: Response) {
        try {
            const { userId, projectId } = req.params;
            const { path: filePath } = req.query;
            
            if (!filePath) {
                return res.status(400).json(formatResponse(-1, '文件路径不能为空'));
            }

            const content = await this.projectService.getFileContent(
                userId,
                projectId,
                filePath as string
            );
            
            res.json(formatResponse(0, '获取成功', { content }));
        } catch (error: any) {
            res.status(500).json(formatResponse(-1, '获取文件内容失败', { error: error.message }));
        }
    }
} 