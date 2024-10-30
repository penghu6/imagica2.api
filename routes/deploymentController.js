/**
 * 部署记录模块对应的二级路由
 */

const express = require("express");
const router = express.Router();

// 引入业务层方法
const {
  createDeploymentService,
  getProjectDeploymentsService,
  updateDeploymentService,
  deleteDeploymentService,
  findDeploymentByIdService
} = require("../services/deploymentService");

const { formatResponse } = require("../utils/tools");
const { ValidationError } = require("../utils/errors");

/**
 * @swagger
 * /deployment:
 *   post:
 *     summary: 创建新部署记录
 *     tags: [Deployment]
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
 *         description: 部署记录创建成功
 */
router.post("/", async function (req, res, next) {
  try {
    const result = await createDeploymentService(req.body);
    res.send(formatResponse(0, "部署记录创建成功", result));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /deployment/project/{projectId}:
 *   get:
 *     summary: 获取项目的所有部署记录
 *     tags: [Deployment]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: 项目ID
 *     responses:
 *       200:
 *         description: 成功获取部署记录
 */
router.get("/project/:projectId", async function (req, res) {
  const result = await getProjectDeploymentsService(req.params.projectId);
  res.send(formatResponse(0, "", result));
});

/**
 * @swagger
 * /deployment/{id}:
 *   get:
 *     summary: 根据 id 查找部署记录
 *     tags: [Deployment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 部署记录ID
 *     responses:
 *       200:
 *         description: 成功获取部署记录
 */
router.get("/:id", async function (req, res) {
  const result = await findDeploymentByIdService(req.params.id);
  res.send(formatResponse(0, "", result));
});

/**
 * @swagger
 * /deployment/{id}:
 *   patch:
 *     summary: 根据 id 修改部署记录
 *     tags: [Deployment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 部署记录ID
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
 *         description: 成功更新部署记录
 */
router.patch("/:id", async function (req, res) {
  const result = await updateDeploymentService(req.params.id, req.body);
  res.send(formatResponse(0, "", result));
});

/**
 * @swagger
 * /deployment/{id}:
 *   delete:
 *     summary: 根据 id 删除部署记录
 *     tags: [Deployment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 部署记录ID
 *     responses:
 *       200:
 *         description: 成功删除部署记录
 */
router.delete("/:id", async function (req, res) {
  const result = await deleteDeploymentService(req.params.id);
  res.send(formatResponse(0, "", result));
});

module.exports = router; 