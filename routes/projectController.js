/**
 * 项目模块对应的二级路由
 */

const express = require("express");
const router = express.Router();

// 引入业务层方法
const {
  createProject,
  getUserProjects,
  updateProject,
  deleteProject,
  findProjectById,
  getProjectDetail
} = require("../services/projectService");

const { formatResponse } = require("../utils/tools");
const { ValidationError } = require("../utils/errors");

/**
 * @swagger
 * /project:
 *   post:
 *     summary: 创建新项目
 *     tags: [Project]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               // 添加需要的字段
 *     responses:
 *       200:
 *         description: 项目创建成功
 */
router.post("/", async function (req, res, next) {
  try {
    const result = await createProject(req.body);
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
 *     tags: [Project]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 成功获取项目列表
 */
router.get("/user/:userId", async function (req, res) {
  const result = await getUserProjects(req.params.userId);
  res.send(formatResponse(0, "", result));
});

/**
 * @swagger
 * /project/{id}:
 *   get:
 *     summary: 根据 id 查找项目（包含聊天记录）
 *     tags: [Project]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 项目ID
 *     responses:
 *       200:
 *         description: 成功获取项目信息
 */
router.get("/:id", async function (req, res) {
  const result = await getProjectDetail(req.params.id);
  res.send(formatResponse(0, "", result));
});

/**
 * @swagger
 * /project/{id}:
 *   patch:
 *     summary: 根据 id 修改项目
 *     tags: [Project]
 *     parameters:
 *       - in: path
 *         name: id
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
 *               // 添加需要更新的字段
 *     responses:
 *       200:
 *         description: 成功更新项目信息
 */
router.patch("/:id", async function (req, res) {
  const result = await updateProject(req.params.id, req.body);
  res.send(formatResponse(0, "", result));
});

/**
 * @swagger
 * /project/{id}:
 *   delete:
 *     summary: 根据 id 删除项目
 *     tags: [Project]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 项目ID
 *     responses:
 *       200:
 *         description: 成功删除项目
 */
router.delete("/:id", async function (req, res) {
  const result = await deleteProject(req.params.id);
  res.send(formatResponse(0, "", result));
});

module.exports = router; 