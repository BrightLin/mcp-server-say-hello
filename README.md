# MCP Say Hello Server

Node.js server implementing Model Context Protocol (MCP) for greeting operations with personalized messages.

## Features

- Provides personalized greeting messages
- Supports name input parameter validation using Zod schema
- Detailed error handling and response formatting
- Standard MCP protocol compliance for tool registration and request processing

## Tools

### say_hello

**Description**: Greets the user with a personalized message.

**Input Parameters**:

```json
{
  "name": {
    "type": "string",
    "description": "Name of the person to greet"
  }
}
```

**Response**:
- Success: Returns a greeting message with the provided name
- Failure: Returns error information

## Usage Examples

### With Claude Desktop or Trae CN

#### Docker Configuration

No docker configuration.

#### NPX Configuration

```json
{
  "mcpServers": {
    "say-hello": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-server-say-hello"
      ]
    }
  }
}
```

or install globally:

```bash
npm install -g mcp-server-say-hello
```

and then:

```json
{
  "mcpServers": {
    "say-hello": {
      "command": "mcp-server-say-hello"
    }
  }
}
```

### local run as sse server mode

```bash
npm install
npm run build
node dist/sse.js
```

## AIGC prompt examples

```
you：我叫Bright，请向我问好
```

![image](https://github.com/user-attachments/assets/eaa16fb4-7dbe-40d7-a1e2-4523ac42e821)

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.
