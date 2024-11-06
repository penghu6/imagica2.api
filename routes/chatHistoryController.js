const express = require("express");
const router = express.Router();
const { formatResponse } = require("../utils/tools");
const chatHistoryDao = require('../dao/chatHistoryDao');
const ChatHistoryModel = require('../models/chatHistoryModel');
const {
  createProjectService,
  getProjectChatHistory
} = require("../services/projectService");

/**
 * @swagger
 * /chat-history/{projectId}:
 *   get:
 *     summary: 获取项目的聊天记录
 *     tags: [ChatHistory]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: 项目ID
 *     responses:
 *       200:
 *         description: 成功获取聊天记录
 */
router.get("/:projectId", async function (req, res) {
  try {
    const result = await getProjectChatHistory(req.params.projectId);
    res.send(formatResponse(0, "", result));
  } catch (error) {
    res.send(formatResponse(1, error.message, null));
  }
});

/**
 * @swagger
 * /chat-history/{projectId}:
 *   post:
 *     summary: 保存项目的聊天记录
 *     tags: [ChatHistory]
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
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     content:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [assistant, user]
 *     responses:
 *       200:
 *         description: 聊天记录保存成功
 */
router.post("/:projectId", async function (req, res) {
  try {
    const result = await chatHistoryDao.saveMessages(req.params.projectId, req.body.messages);
    res.send(formatResponse(0, "聊天记录保存成功", result));
  } catch (error) {
    res.send(formatResponse(1, error.message, null));
  }
});

/**
 * @swagger
 * /chat-history/{projectId}:
 *   delete:
 *     summary: 删除项目的聊天记录
 *     tags: [ChatHistory]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: 项目ID
 *     responses:
 *       200:
 *         description: 聊天记录删除成功
 */
router.delete("/:projectId", async function (req, res) {
  try {
    const result = await ChatHistoryModel.deleteOne({ project: req.params.projectId });
    res.send(formatResponse(0, "聊天记录删除成功", result));
  } catch (error) {
    res.send(formatResponse(1, error.message, null));
  }
});

module.exports = router;
