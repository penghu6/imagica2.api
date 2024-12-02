import { Request, Response } from 'express';
import { Controller, Post, Get, Put } from '../decorators/controller';
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
 *           enum: [file, folder]
 *         path:
 *           type: string
 *         children:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FileStructure'
 *     ProjectShare:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: 分享记录ID
 *         projectId:
 *           type: string
 *           description: 项目ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         isActive:
 *           type: boolean
 *           description: 是否有效
 *     ProjectShareWithProject:
 *       allOf:
 *         - $ref: '#/components/schemas/ProjectShare'
 *         - type: object
 *           properties:
 *             project:
 *               $ref: '#/components/schemas/IProjectResult'
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
     *   get:
     *     summary: 获取用户的所有项目
     *     tags: [Projects]
     *     parameters:
     *       - in: query
     *         name: userId
     *         required: true
     *         description: 用户ID
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
     *                 code:
     *                   type: number
     *                   example: 0
     *                 msg:
     *                   type: string
     *                   example: 获取项目列表成功
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/IProjectResult'  # 假设 IProjectResult 是项目的结构
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
     *                 msg:
     *                   type: string
     *                   example: 用户ID不能为空
     */
    @Get('/user')
    async getUserProjects(req: Request) {
        try {
            const userId = req.query.userId as string; // 从查询参数中获取用户ID
            if (!userId) {
                return formatResponse(1, '用户ID不能为空');
            }
            const projects = await this.projectService.getUserProjects(userId);
            return formatResponse(0, '获取项目列表成功', projects);
        } catch (error: any) {
            return formatResponse(1, error.message);
        }
    }

    /**
     * @swagger
     * /api/projects/detail:
     *   get:
     *     summary: 获取项目详情
     *     tags: [Projects]
     *     parameters:
     *       - in: query
     *         name: projectId
     *         required: true
     *         description: 项目ID
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
     *                 code:
     *                   type: number
     *                   example: 0
     *                 msg:
     *                   type: string
     *                   example: 获取项目详情成功
     *                 data:
     *                   $ref: '#/components/schemas/IProjectResult'  # 假设 IProjectResult 是项目详情的结构
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
     *                 msg:
     *                   type: string
     *                   example: 项目ID不能为空
     *       404:
     *         description: 项目未找到
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 code:
     *                   type: number
     *                   example: 1
     *                 msg:
     *                   type: string
     *                   example: 项目未找到
     */
    @Get('/detail')
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

    /**
     * @swagger
     * /api/projects/{projectId}/updateFiles:
     *   put:
     *     summary: 更新项目文件
     *     tags: [Projects]
     *     parameters:
     *       - in: path
     *         name: projectId
     *         required: true
     *         description: 项目ID
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               data:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     name:
     *                       type: string
     *                       description: 文件或目录的名称
     *                     type:
     *                       type: string
     *                       enum: [file, directory]
     *                       description: 文件或目录的类型
     *                     path:
     *                       type: string
     *                       description: 文件或目录的路径
     *                     content:
     *                       type: string
     *                       description: 文件内容（仅在类型为 file 时提供）
     *                     children:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/FileStructure'  # 如果有子文件夹
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
     *                   example: 更新项目文件成功
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
     *                   example: 数据格式不正确
     */
    @Put('/:projectId/updateFiles')
    async updateProjectFiles(req: Request, res: Response) {
        try {
            const projectId = req.params.projectId;
            const { data } = req.body; // 获取传入的数据

            if (!data || !Array.isArray(data)) {
                return res.status(400).json(formatResponse(-1, '数据格式不正确'));
            }

            await this.projectService.updateProjectFiles(projectId, data);
            return formatResponse(0, '更新项目文件成功');
        } catch (error: any) {
            return res.status(500).json(formatResponse(-1, error.message));
        }
    }

    /**
     * @swagger
     * /api/projects/{projectId}/share:
     *   post:
     *     summary: 创建项目分享
     *     description: 创建一个项目的分享链接，任何人都可以通过该链接查看项目
     *     tags: [Projects]
     *     parameters:
     *       - in: path
     *         name: projectId
     *         required: true
     *         schema:
     *           type: string
     *         description: 项目ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               userId:
     *                 type: string
     *                 description: 当前用户ID
     *     responses:
     *       200:
     *         description: 创建分享成功
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
     *                   example: 创建分享成功
     *                 data:
     *                   $ref: '#/components/schemas/ProjectShare'
     */
    @Post('/:projectId/share')
    async createShare(req: Request) {
        try {
            const share = await this.projectService.createProjectShare(
                req.params.projectId
            );
            return formatResponse(0, '创建分享成功', share);
        } catch (error: any) {
            return formatResponse(1, error.message);
        }
    }

    /**
     * @swagger
     * /api/projects/shared:
     *   get:
     *     summary: 获取用户分享的项目列表
     *     description: 获取当前用户分享出去的所有项目列表
     *     tags: [Projects]
     *     parameters:
     *       - in: query
     *         name: userId
     *         required: true
     *         schema:
     *           type: string
     *         description: 当前用户ID
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
     *                   example: 获取分享列表成功
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/ProjectShareWithProject'
     */
    @Get('/shared')
    async getSharedProjects(req: Request) {
        try {
            const shares = await this.projectService.getSharedProjects(req.query.userId as string);
            return formatResponse(0, '获取分享列表成功', shares);
        } catch (error: any) {
            return formatResponse(1, error.message);
        }
    }

    /**
     * @swagger
     * /api/projects/shared/{shareId}/delete:
     *   post:
     *     summary: 删除项目分享
     *     description: 取消项目的分享，删除后他人将无法通过分享链接访问项目
     *     tags: [Projects]
     *     parameters:
     *       - in: path
     *         name: shareId
     *         required: true
     *         schema:
     *           type: string
     *         description: 分享ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               userId:
     *                 type: string
     *                 description: 当前用户ID
     *     responses:
     *       200:
     *         description: 删除成功
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
     *                   example: 删除分享成功
     */
    @Post('/shared/:shareId/delete')
    async deleteShare(req: Request) {
        try {
            await this.projectService.deleteProjectShare(
                req.params.shareId
            );
            return formatResponse(0, '删除分享成功');
        } catch (error: any) {
            return formatResponse(1, error.message);
        }
    }

    /**
     * @swagger
     * /api/projects/shared/{shareId}:
     *   get:
     *     summary: 获取分享的项目
     *     description: 通过分享ID获取项目信息，任何人都可以访问
     *     tags: [Projects]
     *     parameters:
     *       - in: path
     *         name: shareId
     *         required: true
     *         schema:
     *           type: string
     *         description: 分享ID
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
     *                   example: 获取成功
     *                 data:
     *                   $ref: '#/components/schemas/IProjectResult'
     */
    @Get('/shared/:shareId')
    async getSharedProject(req: Request) {
        try {
            const project = await this.projectService.getSharedProject(req.params.shareId);
            return formatResponse(0, '获取成功', project);
        } catch (error: any) {
            return formatResponse(1, error.message);
        }
    }
} 