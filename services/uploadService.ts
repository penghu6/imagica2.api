import JSZip from 'jszip'; // 导入 JSZip
import fs from 'fs';
import path from 'path';

class UploadService {
    constructor() {}

    async unzipFiles(filePath: string): Promise<void> {
        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            throw new Error('文件不存在: ' + filePath); // 直接抛出错误
        }

        // 获取文件扩展名
        const extname = path.extname(filePath);
        if (extname !== '.zip') {
            throw new Error('该文件不是 ZIP 文件'); // 直接抛出错误
        }

        try {
            // 读取 ZIP 文件
            const data = fs.readFileSync(filePath);
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(data); // 加载 ZIP 内容

            // 获取 outputDir 为 filePath 去掉最后一个斜杠后面的内容
            const outputDir = path.dirname(filePath); // 获取文件的目录
            fs.mkdirSync(outputDir, { recursive: true }); // 确保目录存在

            // 遍历 ZIP 文件中的每个文件
            for (const fileName of Object.keys(zipContent.files)) {
                const file = zipContent.files[fileName];

                // 检查文件是否是目录
                if (file.dir) {
                    // 如果是目录，创建目录
                    const dirPath = path.join(outputDir, fileName);
                    fs.mkdirSync(dirPath, { recursive: true }); // 确保目录存在
                } else {
                    // 如果是文件，获取文件内容并写入
                    const fileData = await file.async('nodebuffer'); // 获取文件内容
                    const filePath = path.join(outputDir, fileName);
                    fs.mkdirSync(path.dirname(filePath), { recursive: true }); // 确保文件所在目录存在
                    fs.writeFileSync(filePath, fileData); // 保存解压缩后的文件
                }
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