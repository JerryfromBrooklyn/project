import json
import os
import sys
import subprocess
from pathlib import Path

# MCP Server Information
MCP_SERVER_PATH = Path(r"C:\Users\Geral\aws-mcp-server")
PYTHON_PATH = MCP_SERVER_PATH / "venv" / "Scripts" / "python.exe"

def start_mcp_server():
    """Start the AWS MCP server in the background"""
    try:
        process = subprocess.Popen(
            [str(PYTHON_PATH), "-m", "aws_mcp_server"],
            cwd=str(MCP_SERVER_PATH),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        print("Started AWS MCP Server")
        return process
    except Exception as e:
        print(f"Error starting MCP server: {e}")
        return None

def test_aws_connection():
    """Test AWS connection by running a simple command"""
    try:
        # Test with AWS S3 list buckets command
        aws_cmd = ["aws", "s3", "ls"]
        result = subprocess.run(aws_cmd, capture_output=True, text=True)
        print("AWS Connection Test:")
        print(result.stdout)
        
        if result.stderr:
            print("Errors:")
            print(result.stderr)
    except Exception as e:
        print(f"Error testing AWS connection: {e}")

if __name__ == "__main__":
    print("Starting AWS MCP Client...")
    server_process = start_mcp_server()
    
    if server_process:
        # Wait a moment for server to initialize
        import time
        time.sleep(2)
        
        # Test AWS connection
        test_aws_connection()
        
        print("\nPress Enter to stop the server...")
        input()
        server_process.terminate()
        print("Server stopped.")
    else:
        print("Failed to start MCP server.") 