# ProjectNotes Supabase MCP Server Startup Script
# This script starts the Supabase MCP server for the current project

Write-Host "Starting Supabase MCP Server for ProjectNotes..." -ForegroundColor Green

# Load environment variables from .trae/env file
$envFile = Join-Path $PSScriptRoot "env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
            Write-Host "Loaded: $name" -ForegroundColor Yellow
        }
    }
}

# Start the MCP server
try {
    Write-Host "Launching Supabase MCP Server..." -ForegroundColor Cyan
    npx -y @supabase/mcp-server-supabase --project-ref=$env:SUPABASE_PROJECT_REF
}
catch {
    Write-Host "Error starting MCP server: $_" -ForegroundColor Red
    exit 1
}

Write-Host "MCP Server started successfully!" -ForegroundColor Green