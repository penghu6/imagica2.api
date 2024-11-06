/**
 * 项目模块对应的二级路由
 */

const express = require("express");
const router = express.Router();
const { formatResponse } = require("../utils/tools");
const projectService = require('../services/projectService');

/**
 * @swagger
 * /project:
 *   post:
 *     summary: 创建新项目
 */
router.post("/", async function (req, res, next) {
  try {
    const result = await projectService.createProject(req.body);
    res.send(formatResponse(0, "项目创建成功", result));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /project/user/{userId}:
 *   get:
 *     summary: 获取用户的所有项目
 */
router.get("/user/:userId", async function (req, res, next) {
  try {
    const result = await projectService.getUserProjects(req.params.userId);
    res.send(formatResponse(0, "", result));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /project/{id}:
 *   get:
 *     summary: 根据 id 查找项目（包含聊天记录）
 */
router.get("/:id", async function (req, res, next) {
  try {
    const result = await projectService.getProjectDetail(req.params.id);
    res.send(formatResponse(0, "", result));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /project/{id}:
 *   patch:
 *     summary: 根据 id 修改项目
 */
router.patch("/:id", async function (req, res, next) {
  try {
    const result = await projectService.updateProject(req.params.id, req.body);
    res.send(formatResponse(0, "", result));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /project/{id}:
 *   delete:
 *     summary: 根据 id 删除项目
 */
router.delete("/:id", async function (req, res, next) {
  try {
    const result = await projectService.deleteProject(req.params.id);
    res.send(formatResponse(0, "", result));
  } catch (error) {
    next(error);
  }
});

module.exports = router; 