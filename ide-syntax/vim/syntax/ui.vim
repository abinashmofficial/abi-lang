if exists("b:current_syntax")
  finish
endif

runtime! syntax/html.vim
unlet b:current_syntax

syn match uiDirective "@include\s*([^\)]*)"
syn match uiDirective "@plugin\s*([^\)]*)"
syn region uiCodeBlock start="<%" end="%>" contains=@htmlJavaScript

hi def link uiDirective PreProc
hi def link uiCodeBlock Special

let b:current_syntax = "ui"
