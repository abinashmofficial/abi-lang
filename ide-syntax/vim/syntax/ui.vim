if exists("b:current_syntax")
  finish
endif

runtime! syntax/html.vim
unlet b:current_syntax

syn keyword uiKeyword component load import inject render export from
syn match uiDirective "@include\s*([^\)]*)"
syn match uiDirective "@plugin\s*([^\)]*)"
syn region uiScriptBlock start="<script\s\+setup>" end="</script>" contains=@htmlJavaScript
syn region uiExprBlock start="{{" end="}}" contains=@htmlJavaScript
syn region uiCodeBlock start="<%" end="%>" contains=@htmlJavaScript

hi def link uiKeyword Keyword
hi def link uiDirective PreProc
hi def link uiScriptBlock Special
hi def link uiExprBlock Special
hi def link uiCodeBlock Special

let b:current_syntax = "ui"
