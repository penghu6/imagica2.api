import { Controller, Delete, Get, Patch, Post } from '../decorators/controller';
import { Request, Response } from 'express';
import  ProjectService  from '../services/projectService';
import { BaseController } from './baseController';

@Controller()
export class ProjectController extends BaseController {
    private projectService: ProjectService;

    constructor() {
        super();
        this.projectService = new ProjectService();
    }

    /**
     * 创建新项目
     */
    @Post('/')
    async createProject(req: Request) {
        return await this.projectService.createProject(req.body);
    }

    /**
     * 获取用户的所有项目
     */
    @Get('/user/:userId')
    async getUserProjects(req: Request) {
        return await this.projectService.getUserProjects(req.params.userId);
    }

    /**
     * 根据ID获取项目
     */
    @Get('/:id')
    async getProject(req: Request) {
        return await this.projectService.findProjectById(req.params.id);
    }

    /**
     * 更新项目
     */
    @Patch('/:id')
    async updateProject(req: Request) {
        return await this.projectService.updateProject(req.params.id, req.body);
    }

    /**
     * 删除项目
     */
    @Delete('/:id')
    async deleteProject(req: Request) {
        return await this.projectService.deleteProject(req.params.id);
    }
}
