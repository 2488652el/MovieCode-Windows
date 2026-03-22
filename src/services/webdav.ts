/**
 * WebDAV 服务增强
 * 支持双向同步媒体库
 */

import axios, { AxiosInstance } from 'axios';

export interface WebDAVConfig {
  url: string;
  username: string;
  password: string;
  basePath?: string;
}

export interface WebDAVFile {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: Date;
  contentType?: string;
}

export interface WebDAVResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// WebDAV 客户端
export class WebDAVClient {
  private client: AxiosInstance;
  private basePath: string;

  constructor(config: WebDAVConfig) {
    this.basePath = config.basePath || '/';
    
    this.client = axios.create({
      baseURL: config.url,
      timeout: 30000,
      auth: {
        username: config.username,
        password: config.password,
      },
      headers: {
        'Content-Type': 'application/xml;charset=utf-8',
      },
    });
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<WebDAVResponse<{ server: string }>> {
    try {
      const res = await this.client.request({
        method: 'OPTIONS',
        url: '/',
      });
      const server = res.headers['dav'] || 'WebDAV Server';
      return { success: true, data: { server } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 列出目录内容
   */
  async listDirectory(path: string): Promise<WebDAVResponse<WebDAVFile[]>> {
    try {
      const res = await this.client.request({
        method: 'PROPFIND',
        url: path,
        headers: {
          Depth: '1',
        },
        data: `<?xml version="1.0" encoding="utf-8"?>
          <D:propfind xmlns:D="DAV:">
            <D:prop>
              <D:displayname/>
              <D:getcontentlength/>
              <D:getlastmodified/>
              <D:getcontenttype/>
              <D:resourcetype/>
            </D:prop>
          </D:propfind>`,
      });

      const files = this.parseWebDAVResponse(res.data, path);
      return { success: true, data: files };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 创建目录
   */
  async createDirectory(path: string): Promise<WebDAVResponse<void>> {
    try {
      await this.client.request({
        method: 'MKCOL',
        url: path,
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 删除文件/目录
   */
  async delete(path: string): Promise<WebDAVResponse<void>> {
    try {
      await this.client.request({
        method: 'DELETE',
        url: path,
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 上传文件
   */
  async uploadFile(path: string, content: Blob | string): Promise<WebDAVResponse<void>> {
    try {
      await this.client.request({
        method: 'PUT',
        url: path,
        data: content,
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 下载文件
   */
  async downloadFile(path: string): Promise<WebDAVResponse<Blob>> {
    try {
      const res = await this.client.request({
        method: 'GET',
        url: path,
        responseType: 'blob',
      });
      return { success: true, data: res.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 复制文件
   */
  async copyFile(source: string, destination: string): Promise<WebDAVResponse<void>> {
    try {
      await this.client.request({
        method: 'COPY',
        url: source,
        headers: {
          Destination: destination,
        },
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 移动文件
   */
  async moveFile(source: string, destination: string): Promise<WebDAVResponse<void>> {
    try {
      await this.client.request({
        method: 'MOVE',
        url: source,
        headers: {
          Destination: destination,
        },
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(path: string): Promise<WebDAVResponse<WebDAVFile>> {
    try {
      const res = await this.client.request({
        method: 'PROPFIND',
        url: path,
        headers: {
          Depth: '0',
        },
        data: `<?xml version="1.0" encoding="utf-8"?>
          <D:propfind xmlns:D="DAV:">
            <D:prop>
              <D:displayname/>
              <D:getcontentlength/>
              <D:getlastmodified/>
              <D:getcontenttype/>
              <D:resourcetype/>
            </D:prop>
          </D:propfind>`,
      });

      const files = this.parseWebDAVResponse(res.data, path);
      return { success: true, data: files[0] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 递归扫描目录中的媒体文件
   */
  async scanMediaFiles(path: string, extensions: string[] = ['.mp4', '.mkv', '.avi', '.mov', '.wmv']): Promise<WebDAVResponse<WebDAVFile[]>> {
    try {
      const mediaFiles: WebDAVFile[] = [];
      await this.scanDirectoryRecursive(path, mediaFiles, extensions);
      return { success: true, data: mediaFiles };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async scanDirectoryRecursive(
    path: string,
    results: WebDAVFile[],
    extensions: string[]
  ): Promise<void> {
    const response = await this.listDirectory(path);
    if (!response.success || !response.data) return;

    for (const file of response.data) {
      if (file.type === 'directory') {
        // 跳过 . 和 ..
        if (file.name !== '.' && file.name !== '..') {
          await this.scanDirectoryRecursive(file.path, results, extensions);
        }
      } else {
        // 检查是否为媒体文件
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (extensions.includes(ext)) {
          results.push(file);
        }
      }
    }
  }

  /**
   * 解析 WebDAV 响应
   */
  private parseWebDAVResponse(xml: string, basePath: string): WebDAVFile[] {
    const files: WebDAVFile[] = [];
    
    // 简单的 XML 解析
    const hrefRegex = /<D:href>([^<]+)<\/D:href>/g;
    const propRegex = /<D:prop>([\s\S]*?)<\/D:prop>/g;
    
    let match;
    const hrefs: string[] = [];
    
    while ((match = hrefRegex.exec(xml)) !== null) {
      hrefs.push(decodeURIComponent(match[1]));
    }

    const props = [];
    while ((match = propRegex.exec(xml)) !== null) {
      props.push(match[1]);
    }

    hrefs.forEach((href, index) => {
      const prop = props[index] || '';
      const isDir = prop.includes('<D:collection/>') || prop.includes('<D:collection>');
      const name = href.split('/').pop() || href;
      
      // 跳过自身目录
      if (name === '' || (index === 0 && href === basePath)) return;

      const getcontentlengthMatch = prop.match(/<D:getcontentlength>([^<]+)<\/D:getcontentlength>/);
      const getlastmodifiedMatch = prop.match(/<D:getlastmodified>([^<]+)<\/D:getlastmodified>/);
      const getcontenttypeMatch = prop.match(/<D:getcontenttype>([^<]+)<\/D:getcontenttype>/);

      files.push({
        path: href,
        name: name,
        type: isDir ? 'directory' : 'file',
        size: getcontentlengthMatch ? parseInt(getcontentlengthMatch[1]) : undefined,
        lastModified: getlastmodifiedMatch ? new Date(getlastmodifiedMatch[1]) : undefined,
        contentType: getcontenttypeMatch ? getcontenttypeMatch[1] : undefined,
      });
    });

    return files;
  }
}

// WebDAV 管理器
class WebDAVManager {
  private clients: Map<string, WebDAVClient> = new Map();

  addServer(name: string, config: WebDAVConfig): WebDAVClient {
    const client = new WebDAVClient(config);
    this.clients.set(name, client);
    return client;
  }

  getClient(name: string): WebDAVClient | undefined {
    return this.clients.get(name);
  }

  removeServer(name: string): void {
    this.clients.delete(name);
  }

  listServers(): string[] {
    return Array.from(this.clients.keys());
  }
}

export const webdavManager = new WebDAVManager();
export default webdavManager;
