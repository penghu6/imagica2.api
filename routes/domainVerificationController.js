const express = require('express');
const router = express.Router();
const { checkDomainResolution, formatResponse } = require('../utils/tools');

// 验证域名是否正确解析到指定的目标地址
router.get('/verify', async function(req, res) {
    const { domain, target } = req.query;
    try {
        const isResolvedCorrectly = await checkDomainResolution(domain, target);
        res.send(formatResponse(0, "域名解析验证完成", { isResolvedCorrectly }));
    } catch (error) {
        res.status(500).send(formatResponse(-1, "域名解析验证失败", { error: error.message }));
    }
});

module.exports = router;
