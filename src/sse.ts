#!/usr/bin/env node

import http from 'node:http';
import { z } from 'zod';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

const port = 8120;

/**
 * MCP协议基础服务框架
 * 该框架提供协议核心处理流程，开发者可在此扩展自定义工具
 */
class SayHelloMCPService {
  public server: McpServer;

  constructor() {
    // 初始化MCP服务器实例
    this.server = new McpServer(
      {
        name: 'mcp-service-say-hello',
        version: '1.0.0',
      },
      {
        instructions: 'Call the "say_hello" tool with the user name to greet.',
        capabilities: {
          tools: {}, // 声明使用工具，需要在setRequestHandler注册工具
        },
      },
    );

    // 注册工具
    this.registerTool();
  }

  registerTool() {
    this.server.tool(
      'say_hello',
      '向用户问好的工具',
      {
        // 定义工具参数
        name: z.string().describe('用户名字'),
      },
      async ({ name }: { name: string }) => {
        return {
          content: [
            {
              type: 'text',
              text: `Hi，你好啊，${name}，这是来自MCP hello服务的问候。`,
            },
          ],
          isError: false,
        };
      },
    );
  }

  /**
   * 启动服务（基于HTTP服务器）
   */
  async start() {
    try {
      // 存储当前活跃的SSE连接
      const activeTransports = new Map<string, SSEServerTransport>();

      // 创建HTTP服务器
      const server = http.createServer(async (req, res) => {
        console.log(`received a request: [${req.method}] ${req.url}`);
        // 添加CORS头
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        const url = new URL(
          req.url ?? '',
          `http://${req.headers.host ?? 'unknown'}`,
        );
        let pathMatch = false;
        function match(method: string, path: string): boolean {
          if (url.pathname === path) {
            pathMatch = true;
            return req.method === method;
          }
          return false;
        }
        function textResponse(status: number, text: string) {
          res.setHeader('Content-Type', 'text/plain');
          res.statusCode = status;
          res.end(`${text}\n`);
        }

        if (req.method === 'OPTIONS') {
          // 处理预检请求
          res.writeHead(200);
          res.end();
          return;
        }

        if (match('GET', '/sse')) {
          const transport = new SSEServerTransport('/messages', res);
          activeTransports.set(transport.sessionId, transport);
          res.on('close', () => {
            activeTransports.delete(transport.sessionId);
          });
          await this.server.connect(transport);
          console.log('GET /sse', transport.sessionId);
        } else if (
          match('POST', '/messages') ||
          match('OPTIONS', '/messages')
        ) {
          console.log('POST /messages');
          const sessionId = url.searchParams.get('sessionId') ?? '';
          const transport = activeTransports.get(sessionId);
          if (transport) {
            await transport.handlePostMessage(req, res);
          } else {
            textResponse(
              400,
              `No transport found for sessionId '${sessionId}'`,
            );
          }
        } else if (pathMatch) {
          textResponse(405, 'Method not allowed');
        } else {
          textResponse(404, 'Page not found');
        }
      });

      server.listen(port, () => {
        console.log(`✅ MCP服务已启动（SSE模式）: http://localhost:${port}/`);
      });
    } catch (error) {
      console.error('❌服务启动失败:', error);
      process.exit(1);
    }
  }
}

// ---------- 使用示例 ----------
// 创建服务实例
const service = new SayHelloMCPService();

// 启动服务
service.start();
