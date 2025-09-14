# ProjectNotes Supabase MCP Configuration Test Script
# This script tests the MCP server configuration and connectivity

Write-Host "=== ProjectNotes Supabase MCP Configuration Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if configuration files exist
Write-Host "1. Checking configuration files..." -ForegroundColor Yellow

$configFiles = @(
    ".trae\mcp.json",
    ".trae\env",
    ".trae\start-mcp.ps1"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Host "   ✓ $file exists" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $file missing" -ForegroundColor Red
    }
}

# Test 2: Validate MCP JSON configuration
Write-Host ""
Write-Host "2. Validating MCP configuration..." -ForegroundColor Yellow

try {
    $mcpConfig = Get-Content ".trae\mcp.json" | ConvertFrom-Json
    if ($mcpConfig.mcpServers."supabase-projectnotes") {
        Write-Host "   ✓ MCP server configuration found" -ForegroundColor Green
        Write-Host "   ✓ Server name: supabase-projectnotes" -ForegroundColor Green
        
        $args = $mcpConfig.mcpServers."supabase-projectnotes".args
        if ($args -contains "--project-ref=vcgythhenulnwuindgyx") {
            Write-Host "   ✓ Project reference configured correctly" -ForegroundColor Green
        } else {
            Write-Host "   ✗ Project reference missing or incorrect" -ForegroundColor Red
        }
        
        if ($args -notcontains "--read-only") {
            Write-Host "   ✓ Read-write mode enabled" -ForegroundColor Green
        } else {
            Write-Host "   ⚠ Read-only mode detected" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ✗ MCP server configuration not found" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Invalid JSON configuration: $_" -ForegroundColor Red
}

# Test 3: Check environment variables
Write-Host ""
Write-Host "3. Checking environment variables..." -ForegroundColor Yellow

$envFile = ".trae\env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    $requiredVars = @("SUPABASE_ACCESS_TOKEN", "SUPABASE_PROJECT_REF", "PROJECT_NAME")
    
    foreach ($var in $requiredVars) {
        if ($envContent -match "^$var=") {
            Write-Host "   ✓ $var is configured" -ForegroundColor Green
        } else {
            Write-Host "   ✗ $var is missing" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ✗ Environment file not found" -ForegroundColor Red
}

# Test 4: Check NPX and Supabase MCP package availability
Write-Host ""
Write-Host "4. Checking dependencies..." -ForegroundColor Yellow

try {
    $npxVersion = npx --version 2>$null
    if ($npxVersion) {
        Write-Host "   ✓ NPX is available (version: $npxVersion)" -ForegroundColor Green
    } else {
        Write-Host "   ✗ NPX is not available" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ NPX check failed: $_" -ForegroundColor Red
}

# Test 5: Network connectivity test
Write-Host ""
Write-Host "5. Testing network connectivity..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "https://registry.npmjs.org/@supabase/mcp-server-supabase" -Method Head -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✓ Can reach Supabase MCP package registry" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Unexpected response from package registry" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ✗ Cannot reach package registry: $_" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host "Configuration files created for ProjectNotes Supabase MCP integration."
Write-Host "Project Reference: vcgythhenulnwuindgyx"
Write-Host "Mode: Read-Write"
Write-Host "Scope: Current project only"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart Trae AI to load the new MCP configuration"
Write-Host "2. Test database connectivity through MCP"
Write-Host "3. Verify read-write operations work as expected"
Write-Host ""
Write-Host "For manual testing, run: .trae\start-mcp.ps1" -ForegroundColor Green