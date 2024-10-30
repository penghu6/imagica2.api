/**
 * 构建记录模块对应的二级路由
 */

const express = require("express");
const router = express.Router();

// 引入业务层方法
const {
  createBuildService,
  getProjectBuildsService,
  updateBuildService,
  deleteBuildService,
  findBuildByIdService
} = require("../services/buildService");

const { formatResponse } = require("../utils/tools");
const { ValidationError } = require("../utils/errors");

/**
 * @swagger
 * /build:
 *   post:
 *     summary: 创建新构建记录
 *     tags: [Build]
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
 *         description: 构建记录创建成功
 */
router.post("/", async function (req, res, next) {
  try {
    const result = await createBuildService(req.body);
    res.send(formatResponse(0, "构建记录创建成功", result));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /build/project/{projectId}:
 *   get:
 *     summary: 获取项目的所有构建记录
 *     tags: [Build]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: 项目ID
 *     responses:
 *       200:
 *         description: 成功获取构建记录
 */
router.get("/project/:projectId", async function (req, res) {
  const result = await getProjectBuildsService(req.params.projectId);
  res.send(formatResponse(0, "", result));
});

/**
 * @swagger
 * /build/{id}:
 *   get:
 *     summary: 根据 id 查找构建记录
 *     tags: [Build]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 构建记录ID
 *     responses:
 *       200:
 *         description: 成功获取构建记录
 */
router.get("/:id", async function (req, res) {
  const result = await findBuildByIdService(req.params.id);
  res.send(formatResponse(0, "", result));
});

/**
 * @swagger
 * /build/{id}:
 *   patch:
 *     summary: 根据 id 修改构建记录
 *     tags: [Build]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 构建记录ID
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
 *         description: 成功更新构建记录
 */
router.patch("/:id", async function (req, res) {
  const result = await updateBuildService(req.params.id, req.body);
  res.send(formatResponse(0, "", result));
});

/**
 * @swagger
 * /build/{id}:
 *   delete:
 *     summary: 根据 id 删除构建记录
 *     tags: [Build]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 构建记录ID
 *     responses:
 *       200:
 *         description: 成功删除构建记录
 */
router.delete("/:id", async function (req, res) {
  const result = await deleteBuildService(req.params.id);
  res.send(formatResponse(0, "", result));
});

module.exports = router; 