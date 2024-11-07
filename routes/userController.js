/**
 * 用户模块对应的二级路由
 */

const express = require("express");
const router = express.Router();

// 引入业务层方法
const userService = require("../services/userService");

const { formatResponse, analysisToken } = require("../utils/tools");
const { ValidationError } = require("../utils/errors");

/**
 * @swagger
 * /user/register:
 *   post:
 *     summary: 用户注册
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 注册成功
 */
router.post("/register", async function (req, res, next) {
  try {
    const result = await userService.registerUser(req.body);
    res.send(formatResponse(0, "注册成功", result));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: 用户登录
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 登录成功
 *       400:
 *         description: 邮箱或密码错误
 */
router.post("/login", async function (req, res, next) {
  try {
    const result = await userService.loginUser(req.body.email, req.body.password);
    res.send(formatResponse(0, "登录成功", result));
  } catch (error) {
    next(new ValidationError("邮箱或密码错误"));
  }
});

/**
 * @swagger
 * /user:
 *   get:
 *     summary: 获取所有用户
 *     tags: [User]
 *     responses:
 *       200:
 *         description: 成功获取用户列表
 */
router.get("/", async function (req, res) {
  const result = await userService.findAllUsers();
  res.send(formatResponse(0, "", result));
});

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: 根据 id 查找用户
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 成功获取用户信息
 */
router.get("/:id", async function (req, res) {
  const result = await userService.findUserById(req.params.id);
  res.send(formatResponse(0, "", result));
});

/**
 * @swagger
 * /user/{id}:
 *   patch:
 *     summary: 根据 id 修改用户
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
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
 *         description: 成功更新用户信息
 */
router.patch("/:id", async function (req, res) {
  const result = await userService.updateUser(req.params.id, req.body);
  res.send(formatResponse(0, "", result));
});

/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     summary: 根据 id 删除用户
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 成功删除用户
 */
router.delete("/:id", async function (req, res) {
  const result = await userService.deleteUser(req.params.id);
  res.send(formatResponse(0, "", result));
});

module.exports = router;
