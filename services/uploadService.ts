import JSZip from 'jszip'; // 导入 JSZip
import fs from 'fs';
import path from 'path';
import { createExtractorFromData } from 'node-unrar-js'; // 导入 createExtractorFromData
import { ignorFile }from "../utils/consts"

class UploadService {
    constructor() {}

    async unzipFiles(filePath: string): Promise<void> {
        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            throw new Error('文件不存在: ' + filePath); // 直接抛出错误
        }

        // 获取文件扩展名
        const extname = path.extname(filePath);
        const outputDir = path.dirname(filePath); // 获取文件的目录
        fs.mkdirSync(outputDir, { recursive: true }); // 确保目录存在

        try {
            if (extname === '.zip') {
                // 处理 ZIP 文件
                const data = fs.readFileSync(filePath);
                const zip = new JSZip();
                const zipContent = await zip.loadAsync(data); // 加载 ZIP 内容

                // 遍历 ZIP 文件中的每个文件
                for (const fileName of Object.keys(zipContent.files)) {
                    // 检查是否在忽略列表中
                    if (ignorFile.some(pattern => pattern.test(fileName))) {
                        continue; // 忽略该文件
                    }

                    const file = zipContent.files[fileName];

                    // 检查文件是否是目录
                    if (file.dir) {
                        const dirPath = path.join(outputDir, fileName);
                        fs.mkdirSync(dirPath, { recursive: true }); // 创建目录
                    } else {
                        const fileData = await file.async('nodebuffer'); // 获取文件内容
                        const filePathToWrite = path.join(outputDir, fileName);
                        fs.mkdirSync(path.dirname(filePathToWrite), { recursive: true }); // 确保文件所在目录存在
                        fs.writeFileSync(filePathToWrite, fileData); // 保存解压缩后的文件
                    }
                }
            } else if (extname === '.rar') {
                // 处理 RAR 文件
                const buf = Uint8Array.from(fs.readFileSync(filePath)).buffer
                const extractor = await createExtractorFromData({ data: buf }); // 使用 createExtractorFromData 创建解压缩器
                const list = extractor.getFileList(); // 获取文件列表
                const fileHeaders = [...list.fileHeaders];
                for (const fileHeader of fileHeaders) {
                    // 检查是否在忽略列表中
                    if (ignorFile.some(pattern => pattern.test(fileHeader.name))) {
                        continue; // 忽略该文件
                    }

                    const filePathToWrite = path.join(outputDir, fileHeader.name);
                    // 检查文件是否是目录
                    if (fileHeader.flags.directory) {
                        // 如果是目录，创建目录
                        fs.mkdirSync(filePathToWrite, { recursive: true }); // 确保目录存在
                    } else {
                        // 如果是文件，提取文件内容
                        const extracted = extractor.extract({ files: [fileHeader.name] }); // 解压缩文件
                        const files = [...extracted.files];
                        // 检查提取结果
                        if (files.length > 0 && files[0].extraction) {
                            const fileData = files[0].extraction; // 获取文件内容
                            fs.mkdirSync(path.dirname(filePathToWrite), { recursive: true }); // 确保文件所在目录存在
                            fs.writeFileSync(filePathToWrite, fileData); // 保存解压缩后的文件
                        } else {
                            throw new Error(`提取文件失败: ${fileHeader.name}`);
                        }
                    }
                }
            } else {
                throw new Error('不支持的文件类型: ' + extname); // 直接抛出错误
            }

            // 删除压缩文件
            fs.unlinkSync(filePath);
            console.log('解压缩完成，已删除压缩文件:', filePath);
        } catch (error: any) {
            throw new Error('解压缩过程中发生错误: ' + error.message); // 直接抛出错误
        }
    }
}

export default UploadService; 