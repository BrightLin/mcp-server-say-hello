#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * 定义工具模板
 */
const SayHelloArgsSchema = z.object({
  // 定义工具参数
  name: z.string().describe('用户名字'),
});

/**
 * MCP协议基础服务框架
 * 该框架提供协议核心处理流程，开发者可在此扩展自定义工具
 */
class SayHelloMCPService {
  public server: Server;

  constructor() {
    // 初始化MCP服务器实例
    this.server = new Server(
      {
        name: 'mcp-service-say-hello',
        version: '1.0.0',
        description: '输出say-hello的简单的mcp服务',
        metadata: {
          systemProtection: false, // 系统级保护
          supportedPlatforms: [], // 平台列表
        },
      },
      {
        capabilities: {
          tools: {}, // 声明使用工具，需要在setRequestHandler注册工具
        },
      },
    );

    // 注册工具
    this.registerTool();
    // 注册工具处理handler
    this.registerToolHandler();
  }

  registerTool() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'say_hello',
            description: '向用户问好的工具',
            inputSchema: zodToJsonSchema(SayHelloArgsSchema),
          },
        ],
      };
    });
  }

  registerToolHandler() {
    // 注册CallTool handler，处理工具调用请求
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;
        switch (name) {
          case 'say_hello':
            return {
              content: [
                {
                  type: 'text',
                  text: `Hi，你好啊，${(args as any).name}`,
                },
              ],
              isError: false,
            };

          default:
            return {
              content: [{ type: 'text', text: `不支持的工具: ${name}` }],
              isError: true,
            };
        }
      } catch (error) {
        return {
          content: [
            { type: 'text', text: `服务异常: ${(error as Error).message}` },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * 启动服务
   */
  async start() {
    try {
      // 使用stdio传输方式，启动服务
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.log('✅MCP服务已启动');
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
