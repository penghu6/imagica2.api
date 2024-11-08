import { Controller, Get } from '../decorators/controller';
import { BaseController } from './baseController';
import { Request, Response } from 'express';
import { checkDomainResolution, formatResponse, checkSSLStatus } from '../utils/tools';
import { Client, crypto } from 'acme-client';
import fs from 'fs';
import path from 'path';
import dns from 'dns';

const { createPrivateKey, createCsr } = crypto;
const dnsPromises = dns.promises;

interface DNSInfo {
    name: string;
    host: string;
    site: string;
}

interface DNSResult {
    domain: string;
    type: string;
    digHost: string;
    host: string;
    hostValue: string;
    costTime: number | null;
    dnsServer: string | null;
    valid: boolean | null;
    recordList: any[] | null;
    ns: DNSInfo[];
}

/**
 * @swagger
 * tags:
 *   name: DomainSSL
 *   description: 域名SSL证书相关接口
 */
@Controller('domain-ssl')
export class DomainSslController extends BaseController {
    /**
     * @swagger
     * /api/domain-ssl/verify:
     *   get:
     *     summary: 验证域名解析
     *     tags: [DomainSSL]
     *     parameters:
     *       - name: domain
     *         in: query
     *         required: true
     *         schema:
     *           type: string
     *       - name: target
     *         in: query
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: 域名解析验证结果
     */
    @Get('/verify')
    async verifyDomain(req: Request) {
        const domain = req.query.domain as string;
        const target = req.query.target as string;
        if (typeof domain !== 'string' || typeof target !== 'string') {
            throw new Error('域名和目标地址必须是字符串类型');
        }

        try {
            const isResolvedCorrectly = await checkDomainResolution(domain, target);
            return formatResponse(0, "域名解析验证完成", { isResolvedCorrectly });
        } catch (error: any) {
            throw new Error(`域名解析验证失败: ${error.message}`);
        }
    }

    /**
     * @swagger
     * /api/domain-ssl/check-ssl-status:
     *   get:
     *     summary: 检查SSL证书状态
     *     tags: [DomainSSL]
     *     parameters:
     *       - name: domain
     *         in: query
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: SSL证书状态
     */
    @Get('/check-ssl-status')
    async checkSslStatus(req: Request, res: Response) {
        const { domain } = req.query as { domain: string };
        try {
            const sslStatus = await checkSSLStatus(domain);
            res.send(formatResponse(0, "SSL 证书状态检查完成", { sslStatus }));
        } catch (error: any) {
            res.status(500).send(formatResponse(-1, "SSL 证书状态检查失败", { error: error.message }));
        }
    }

    /**
     * @swagger
     * /api/domain-ssl/apply-ssl-certificate:
     *   get:
     *     summary: 申请SSL证书
     *     tags: [DomainSSL]
     *     parameters:
     *       - name: domain
     *         in: query
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: DNS信息
     */
    @Get('/apply-ssl-certificate')
    async applySslCertificate(req: Request, res: Response) {
        const { domain } = req.query as { domain: string };
        const accountKeyPath = path.join(__dirname, '../public/key/accountKey.pem');

        try {
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

            // createCsr 返回的是一个数组 [privateKey, csr]
            const [privateKeyBuffer, csrBuffer] = await createCsr({
                commonName: domain
            });

            const privateKey = privateKeyBuffer.toString();
            const csr = csrBuffer.toString();

            const order = await client.createOrder({
                identifiers: [{ type: 'dns', value: domain }]
            });

            const authorizations = await client.getAuthorizations(order);
            const dnsChallenge = authorizations[0].challenges.find(c => c.type === 'dns-01');

            if (!dnsChallenge) {
                throw new Error('DNS-01 challenge not available');
            }

            const result1 = await client.getOrder(order);
            console.log("result1", result1);

            const nsRecords = await dnsPromises.resolveNs(domain);
            const nsInfo: DNSInfo[] = nsRecords.map(ns => ({
                name: "DNS 服务器",
                host: ns,
                site: ""
            }));

            const result: DNSResult = {
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

        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return res.status(404).send('Account key file not found.');
            }
            res.status(500).send(formatResponse(-1, "获取 DNS 失败", { error: error.message }));
        }
    }

    private async ensureAccountKeyExists(accountKeyPath: string): Promise<string> {
        if (!fs.existsSync(accountKeyPath)) {
            const privateKeyBuffer = await createPrivateKey();
            const privateKey = privateKeyBuffer.toString();
            fs.writeFileSync(accountKeyPath, privateKey, 'utf8');
            return privateKey;
        }
        return fs.readFileSync(accountKeyPath, 'utf8');
    }

    /**
     * @swagger
     * /api/domain-ssl/register-account:
     *   get:
     *     summary: 注册ACME账户
     *     tags: [DomainSSL]
     *     responses:
     *       200:
     *         description: ACME账户注册结果
     */
    @Get('/register-account')
    async registerAccount(req: Request, res: Response) {
        const accountKeyPath = path.join(__dirname, '../public/key/accountKey.pem');

        try {
            const accountKey = await this.ensureAccountKeyExists(accountKeyPath);

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
        } catch (error: any) {
            console.error("Error registering ACME account:", error);
            res.status(500).send(formatResponse(-1, "ACME 账户注册失败", { error: error.message }));
        }
    }
}
