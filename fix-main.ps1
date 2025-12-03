# Fix main.js to use process.execPath instead of 'node'
$file = "c:\Users\law\Documents\JuglonProject\RFID-NDC123-tag-for-laboratory-pc\client\main.js"
$content = Get-Content $file -Raw

# Replace the spawn line and add ELECTRON_RUN_AS_NODE
$content = $content -replace "loggerProcess = spawn\('node', \[loggerPath\],", "loggerProcess = spawn(process.execPath, [loggerPath],"
$content = $content -replace "NODE_PATH: nodeModulesPath\s+}\s+}\);", "ELECTRON_RUN_AS_NODE: '1',`r`n      NODE_PATH: nodeModulesPath`r`n    }`r`n  });"

Set-Content $file $content -NoNewline
Write-Host "Fix applied successfully"
