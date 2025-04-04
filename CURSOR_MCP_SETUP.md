# Setting up AWS MCP Server with Cursor

This guide helps you connect the AWS MCP Server to Cursor, allowing Claude to interact directly with AWS services.

## Prerequisites

1. AWS CLI installed and configured with credentials
2. aws-mcp-server installed and working
3. Cursor IDE

## Setup Steps

### 1. Configure Cursor MCP Settings

1. Open Cursor settings
2. Navigate to the "Model Context Protocol" settings
3. Add a new MCP server with the following configuration:

```json
{
  "mcpServers": {
    "aws-cli": {
      "command": "C:\\Users\\Geral\\aws-mcp-server\\venv\\Scripts\\python.exe",
      "args": ["-m", "aws_mcp_server"],
      "cwd": "C:\\Users\\Geral\\aws-mcp-server",
      "permissions": ["fs:read", "shell:execute"]
    }
  }
}
```

### 2. Start the AWS MCP Server

Run the aws-mcp-server in a terminal:

```
cd C:\Users\Geral\aws-mcp-server
venv\Scripts\activate
python -m aws_mcp_server
```

### 3. Verify Connection

Once configured correctly, Claude should be able to interact with AWS services through the MCP connection.

## Troubleshooting

1. **Connection Issues**: Make sure the AWS MCP server is running before using Cursor
2. **Permission Errors**: Ensure your AWS credentials have the necessary permissions
3. **Path Errors**: Verify the path to Python and aws-mcp-server are correct in the configuration

## Example Commands

Once connected, you can ask Claude to run commands like:

- "List my S3 buckets"
- "Show my running EC2 instances" 
- "Create a new S3 bucket named test-bucket" 