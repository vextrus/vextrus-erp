# Register and Login Script for Vextrus ERP
$authUrl = "http://localhost:3001/api/v1/auth"

Write-Host "=== Vextrus ERP Authentication ===" -ForegroundColor Cyan
Write-Host ""

# Register user
Write-Host "1. Registering test user..." -ForegroundColor Yellow
$registerBody = @{
    email = "test@vextrus.com"
    username = "testuser"
    password = "Test123!@#"
    firstName = "Test"
    lastName = "User"
    organizationId = "26eae102-fb1a-4295-980d-55525c9376e3"
    phone = "01712345678"
} | ConvertTo-Json -Depth 10

try {
    $registerResponse = Invoke-RestMethod -Uri "$authUrl/register" -Method Post -Body $registerBody -ContentType "application/json" -ErrorAction SilentlyContinue
    Write-Host "   User registered successfully" -ForegroundColor Green
    Write-Host "   User ID: $($registerResponse.userId)" -ForegroundColor Gray
} catch {
    if ($_.Exception.Response.StatusCode -eq 409 -or $_.Exception.Message -like "*Conflict*") {
        Write-Host "   User already exists (this is OK)" -ForegroundColor Yellow
    } else {
        Write-Host "   Registration issue: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Login
Write-Host "2. Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = "test@vextrus.com"
    password = "Test123!@#"
} | ConvertTo-Json -Depth 10

try {
    $loginResponse = Invoke-RestMethod -Uri "$authUrl/login" -Method Post -Body $loginBody -ContentType "application/json"

    Write-Host "   Login successful" -ForegroundColor Green
    Write-Host ""
    Write-Host "=== JWT TOKEN ===" -ForegroundColor Cyan
    Write-Host $loginResponse.accessToken -ForegroundColor White
    Write-Host ""
    Write-Host "=== REFRESH TOKEN ===" -ForegroundColor Cyan
    Write-Host $loginResponse.refreshToken -ForegroundColor Gray
    Write-Host ""
    Write-Host "=== Apollo Sandbox Headers ===" -ForegroundColor Cyan
    Write-Host "Copy this into Apollo Sandbox Headers tab:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "{" -ForegroundColor White
    Write-Host "  ""Authorization"": ""Bearer $($loginResponse.accessToken)""," -ForegroundColor White
    Write-Host "  ""X-Tenant-ID"": ""default""" -ForegroundColor White
    Write-Host "}" -ForegroundColor White
    Write-Host ""
    Write-Host "Token expires in: $($loginResponse.expiresIn) seconds" -ForegroundColor Gray

    # Save to file
    $tokenInfo = @"
Authorization: Bearer $($loginResponse.accessToken)
X-Tenant-ID: default

Apollo Sandbox JSON:
{
  "Authorization": "Bearer $($loginResponse.accessToken)",
  "X-Tenant-ID": "default"
}

Access Token:
$($loginResponse.accessToken)

Refresh Token:
$($loginResponse.refreshToken)

Expires in: $($loginResponse.expiresIn) seconds
"@

    $tokenInfo | Out-File -FilePath "jwt-token.txt" -Encoding UTF8
    Write-Host "Token saved to: jwt-token.txt" -ForegroundColor Green

} catch {
    Write-Host "   Login failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Open Apollo Sandbox: http://localhost:3014/graphql" -ForegroundColor White
Write-Host "2. Click Headers tab at the bottom" -ForegroundColor White
Write-Host "3. Paste the JSON above" -ForegroundColor White
Write-Host "4. Run your GraphQL queries" -ForegroundColor White
Write-Host ""
