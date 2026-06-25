$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:8000/"
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Output "Serving $PWD at $prefix"
while ($true) {
    $context = $listener.GetContext()
    $request = $context.Request
    $path = $request.Url.AbsolutePath.TrimStart('/')
    if ($path -eq '') { $path = 'index.html' }
    $file = Join-Path $PWD $path
    if (Test-Path $file) {
        $bytes = [System.IO.File]::ReadAllBytes($file)
        $context.Response.ContentLength64 = $bytes.Length
        $ext = [System.IO.Path]::GetExtension($file)
        switch ($ext) {
            '.html' { $context.Response.ContentType = 'text/html' }
            '.css'  { $context.Response.ContentType = 'text/css' }
            '.js'   { $context.Response.ContentType = 'application/javascript' }
            '.json' { $context.Response.ContentType = 'application/json' }
            '.png'  { $context.Response.ContentType = 'image/png' }
            '.jpg'  { $context.Response.ContentType = 'image/jpeg' }
            default { $context.Response.ContentType = 'application/octet-stream' }
        }
        $context.Response.OutputStream.Write($bytes,0,$bytes.Length)
    } else {
        $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $context.Response.StatusCode = 404
        $context.Response.ContentLength64 = $buffer.Length
        $context.Response.OutputStream.Write($buffer,0,$buffer.Length)
    }
    $context.Response.Close()
}
