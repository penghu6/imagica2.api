const express = require('express');
const router = express.Router();
const { checkDomainResolution, formatResponse, checkSSLStatus } = require('../utils/tools');
const { Client } = require('acme-client');
const fs = require('fs');
const path = require('path');
const { createPrivateKey, createCsr } = require('acme-client').crypto;
const dns = require('dns').promises; // 引入 DNS 模块并使用 Promise 接口
const forge = require('node-forge');

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

// 检查域名的 SSL 证书状态
router.get('/check-ssl-status', async function(req, res) {
    const { domain } = req.query;
    try {
        const sslStatus = await checkSSLStatus(domain);
        res.send(formatResponse(0, "SSL 证书状态检查完成", { sslStatus }));
    } catch (error) {
        res.status(500).send(formatResponse(-1, "SSL 证书状态检查失败", { error: error.message }));
    }
});

/**
 * 生成并返回 DNS 信息
 * @param {string} domain - 需要生成 DNS 挑战的域名
 */
router.get('/apply-ssl-certificate', async function(req, res) {
    const { domain } = req.query;
    const accountKeyPath = path.join(__dirname, '../public/key/accountKey.pem');

    try {
        // 检查文件是否存在
        if (!fs.existsSync(accountKeyPath)) {
            console.error('Account key file not found at:', accountKeyPath);
            return res.status(404).send('Account key file not found.');
        }

        const accountKey = fs.readFileSync(accountKeyPath, 'utf8');
        const client = new Client({
            directoryUrl: 'https://acme-staging-v02.api.letsencrypt.org/directory',
            accountKey: accountKey,
            accountUrl: 'https://acme-staging-v02.api.letsencrypt.org/acme/acct/170165993'
        });

        // 使用新的.crypto API 创建 CSR
        const { privateKey, csr } = await createCsr({
            commonName: domain
        });

        // 创建订单并获取 DNS 挑战
        const order = await client.createOrder({
            identifiers: [{ type: 'dns', value: domain }]
        });

        const authorizations = await client.getAuthorizations(order);
        const dnsChallenge = authorizations[0].challenges.find(c => c.type === 'dns-01');
        if (!dnsChallenge) {
            throw new Error('DNS-01 challenge not available');
        }
        const result1 = await client.getOrder(order);
        console.log("result1",result1);
        // 查询 NS 记录
        const nsRecords = await dns.resolveNs(domain);
        const nsInfo = nsRecords.map(ns => {
            return {
                name: "DNS 服务器",
                host: ns,
                site: "" // 如果有特定网站可以在这里添加
            };
        });

        // 构造返回的 JSON 结构
        const result = {
            domain: domain,
            type: "CNAME",
            digHost: `_acme-challenge.${domain}`,
            host: `_acme-challenge.${domain.split('.').slice(0, -2).join('.')}`,
            hostValue: `${dnsChallenge.token}.${domain}`,
            costTime: null,
            dnsServer: null,
            valid: null,
            recordList: null,
            ns: nsInfo
        };

        res.send(formatResponse(0, "生成并返回 DNS 信息成功", [result]));

    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).send('Account key file not found.');
        }
        res.status(500).send(formatResponse(-1, "获取 DNS 失败", { error: error.message }));
    }
});

/**
 * 验证 DNS 记录
 * @param {string} domain - 需要验证的域名
 */
router.get('/verify-dns', async function(req, res) {
    const { domain } = req.query;

    const accountKeyPath = path.join(__dirname, '../public/key/accountKey.pem');
    const accountKey = fs.readFileSync(accountKeyPath, 'utf8');

    const client = new Client({
        directoryUrl: 'https://acme-staging-v02.api.letsencrypt.org/directory', 
        accountKey: accountKey,
        accountUrl: 'https://acme-staging-v02.api.letsencrypt.org/acme/acct/170165993'
    });

    let dnsChallenge = null;  // 初始化变量以在 catch 块中使用
    let keyAuthorization = null;  // 初始化关键授权变量

    try {
        // 创建订单
        const order = await client.createOrder({
            identifiers: [{ type: 'dns', value: domain }]
        });

        // 获取授权
        const authorizations = await client.getAuthorizations(order);

        // 查找 DNS-01 挑战
        dnsChallenge = authorizations[0].challenges.find(c => c.type === 'dns-01');
        if (!dnsChallenge) {
            throw new Error('DNS-01 challenge not available');
        }

        // 获取挑战的关键授权
        keyAuthorization = await client.getChallengeKeyAuthorization(dnsChallenge);

        // 验证 DNS 挑战
        await client.verifyChallenge({ identifier: { type: 'dns', value: domain }, challenge: dnsChallenge });
        await client.completeChallenge(dnsChallenge);
        await client.waitForValidStatus(dnsChallenge);

        // 构造成功返回的数据
        const challengeDetails = {
            type: dnsChallenge.type,
            host: `_acme-challenge.${domain}.`,
            value: keyAuthorization
        };

        res.send(formatResponse(0, "DNS 验证成功", challengeDetails));
    } catch (error) {
        // 构造失败时的返回数据，包括挑战信息（如果可用）
        const challengeDetails = dnsChallenge ? {
            type: dnsChallenge.type,
            host: `_acme-challenge.${domain}.`,
            value: keyAuthorization  // 使用之前尝试获取的 keyAuthorization
        } : {};

        res.status(500).send(formatResponse(-1, "DNS 验证失败", {
            error: error.message,
            challengeDetails: challengeDetails
        }));
    }
});

/**
 * 申请 SSL 证书
 * @param {string} domain - 需要申请证书的域名
 */
router.get('/finalize-ssl-certificate', async function(req, res) {
    const { domain } = req.query;

    const accountKeyPath = path.join(__dirname, '../public/key/accountKey.pem');
    const accountKey = fs.readFileSync(accountKeyPath, 'utf8');

    const client = new Client({
        directoryUrl: 'https://acme-staging-v02.api.letsencrypt.org/directory', // 使用 staging 环境的 URL
        accountKey: accountKey,
        accountUrl: 'https://acme-staging-v02.api.letsencrypt.org/acme/acct/170165993'
    });

    try {
        // 生成一个新的密钥对
        const keys = forge.pki.rsa.generateKeyPair(2048);

        // 创建一个新的证书请求 (CSR)
        const csr = forge.pki.createCertificationRequest();
        csr.publicKey = keys.publicKey;
        csr.setSubject([{
            name: 'commonName',
            value: domain
        }]);

        // 签名 CSR
        csr.sign(keys.privateKey);

        // 将 CSR 转换为 PEM 格式
        const csrPem = forge.pki.certificationRequestToPem(csr);

        // 创建订单
        const order = await client.createOrder({
            identifiers: [{ type: 'dns', value: domain }]
        });

        // 获取挑战
        const authorizations = await client.getAuthorizations(order);
        const dnsChallenge = authorizations[0].challenges.find(c => c.type === 'dns-01');

        // 确认 DNS 挑战已经被验证
        await client.verifyChallenge({ identifier: { type: 'dns', value: domain }, challenge: dnsChallenge });
        await client.completeChallenge(dnsChallenge);
        await client.waitForValidStatus(dnsChallenge);

        // 完成订单并获取证书
        const cert = await client.finalizeOrder({
            order,
            csr: csrPem
        });

        res.send(formatResponse(0, "SSL 证书申请成功", { certificate: cert }));
    } catch (error) {
        res.status(500).send(formatResponse(-1, "SSL 证书申请失败", { error: error.message }));
    }
});

// 封装账户密钥的读取和保存逻辑
async function ensureAccountKeyExists(accountKeyPath) {
    if (!fs.existsSync(accountKeyPath)) {
        const privateKey = await createPrivateKey();
        fs.writeFileSync(accountKeyPath, privateKey, 'utf8');
        return privateKey;
    }
    return fs.readFileSync(accountKeyPath, 'utf8');
}

router.get('/register-account', async function(req, res) {
    const accountKeyPath = path.join(__dirname, '../public/key/accountKey.pem');

    try {
        const accountKey = await ensureAccountKeyExists(accountKeyPath);

        const client = new Client({
            directoryUrl: 'https://acme-staging-v02.api.letsencrypt.org/directory',
            accountKey: accountKey
        });

        const account = await client.createAccount({
            termsOfServiceAgreed: true,
            contact: ['mailto:qq201105831@gmail.com']
        });
        const accountUrl = client.getAccountUrl();
        console.log("Account URL:", account);
        console.log("Account URL123:", accountUrl);
        res.send(formatResponse(0, "ACME 账户注册成功", { accountUrl: accountUrl }));
    } catch (error) {
        console.error("Error registering ACME account:", error);
        res.status(500).send(formatResponse(-1, "ACME 账户注册失败", { error: error.message }));
    }
});

module.exports = router;
