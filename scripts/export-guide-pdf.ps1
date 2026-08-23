param(
  [string]$InputPath = "TECHNICAL_INTERVIEW_GUIDE_AR.md",
  [string]$HtmlPath = "TECHNICAL_INTERVIEW_GUIDE_AR.print.html"
)

$ErrorActionPreference = "Stop"
$lines = Get-Content -LiteralPath $InputPath -Encoding UTF8
$body = New-Object System.Collections.Generic.List[string]
$inCode = $false
$inList = $false
$inTable = $false
$tableHeaderDone = $false

function Encode([string]$text) {
  return [System.Net.WebUtility]::HtmlEncode($text)
}

function Inline([string]$text) {
  $value = Encode $text
  $value = [regex]::Replace($value, '`([^`]+)`', '<code>$1</code>')
  $value = [regex]::Replace($value, '\*\*([^*]+)\*\*', '<strong>$1</strong>')
  return $value
}

function Close-List {
  if ($script:inList) {
    $script:body.Add('</ul>')
    $script:inList = $false
  }
}

function Close-Table {
  if ($script:inTable) {
    $script:body.Add('</tbody></table>')
    $script:inTable = $false
    $script:tableHeaderDone = $false
  }
}

foreach ($line in $lines) {
  if ($line -match '^```') {
    Close-List
    Close-Table
    if ($inCode) { $body.Add('</code></pre>'); $inCode = $false }
    else { $body.Add('<pre><code>'); $inCode = $true }
    continue
  }

  if ($inCode) {
    $body.Add((Encode $line))
    continue
  }

  if ($line -match '^\|(.+)\|\s*$') {
    Close-List
    $cells = $Matches[1].Split('|') | ForEach-Object { $_.Trim() }
    if (($cells | Where-Object { $_ -notmatch '^:?-{3,}:?$' }).Count -eq 0) {
      $tableHeaderDone = $true
      continue
    }
    if (-not $inTable) {
      $body.Add('<table><thead>')
      $body.Add('<tr>' + (($cells | ForEach-Object { '<th>' + (Inline $_) + '</th>' }) -join '') + '</tr>')
      $body.Add('</thead><tbody>')
      $inTable = $true
    } else {
      $body.Add('<tr>' + (($cells | ForEach-Object { '<td>' + (Inline $_) + '</td>' }) -join '') + '</tr>')
    }
    continue
  }

  Close-Table

  if ($line -match '^---\s*$') {
    Close-List
    $body.Add('<hr>')
  } elseif ($line -match '^(#{1,6})\s+(.+)$') {
    Close-List
    $level = $Matches[1].Length
    $body.Add("<h$level>$(Inline $Matches[2])</h$level>")
  } elseif ($line -match '^>\s?(.*)$') {
    Close-List
    $body.Add('<blockquote>' + (Inline $Matches[1]) + '</blockquote>')
  } elseif ($line -match '^\s*-\s+(.+)$') {
    if (-not $inList) { $body.Add('<ul>'); $inList = $true }
    $body.Add('<li>' + (Inline $Matches[1]) + '</li>')
  } elseif ([string]::IsNullOrWhiteSpace($line)) {
    Close-List
  } else {
    Close-List
    $body.Add('<p>' + (Inline $line) + '</p>')
  }
}

Close-List
Close-Table
if ($inCode) { $body.Add('</code></pre>') }

$html = @"
<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>الدليل التقني لمشروع Platinum</title>
<style>
  @page { size: A4; margin: 17mm 15mm 18mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #152033; background: #fff; font-family: "Segoe UI", Tahoma, Arial, sans-serif; font-size: 12px; line-height: 1.75; }
  h1, h2, h3, h4 { color: #073b6f; page-break-after: avoid; break-after: avoid-page; }
  h1 { font-size: 28px; text-align: center; margin: 20px 0 8px; padding-bottom: 14px; border-bottom: 3px solid #0ba8cc; }
  h2 { font-size: 20px; margin: 24px 0 10px; padding: 7px 12px; border-right: 5px solid #11b4d5; background: #eef9fc; border-radius: 6px; }
  h3 { font-size: 16px; margin: 20px 0 8px; border-bottom: 1px solid #d6e5ed; padding-bottom: 4px; }
  h4 { font-size: 14px; }
  p { margin: 5px 0 9px; }
  ul { margin: 4px 0 12px; padding-right: 24px; }
  li { margin: 2px 0; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0 18px; page-break-inside: avoid; }
  th, td { border: 1px solid #cbdbe5; padding: 7px 9px; text-align: right; vertical-align: top; }
  th { color: #fff; background: #087da4; }
  tr:nth-child(even) td { background: #f5fafc; }
  code { direction: ltr; unicode-bidi: embed; font-family: Consolas, monospace; color: #075985; background: #eef6fa; border-radius: 4px; padding: 1px 4px; }
  pre { direction: ltr; text-align: left; white-space: pre-wrap; color: #eaf7ff; background: #102335; border-right: 5px solid #11b4d5; border-radius: 8px; padding: 12px; page-break-inside: avoid; }
  pre code { color: inherit; background: transparent; padding: 0; }
  blockquote { margin: 12px 0; padding: 10px 14px; color: #42566b; background: #f2f8fb; border-right: 4px solid #19aac8; }
  hr { border: 0; border-top: 1px solid #cbdbe5; margin: 22px 0; }
  strong { color: #102a43; }
</style>
</head>
<body>
$($body -join "`n")
</body>
</html>
"@

[System.IO.File]::WriteAllText((Join-Path (Get-Location) $HtmlPath), $html, [System.Text.UTF8Encoding]::new($false))
