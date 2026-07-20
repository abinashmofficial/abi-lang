if exists("b:current_syntax")
  finish
endif

syn keyword abiKeyword class func print input return if else while for in and or not public private protected import export from const let interface implements extends new async await throw try catch finally this db_connect db_create db_update db_delete db_fetch dd
syn keyword abiConstant true false null
syn match abiClass "\b[A-Z][a-zA-Z0-9_]*\b"
syn match abiNumber "\b\d\+\(\.\d\+\)\?\b"
syn region abiString start='"' end='"' contains=abiEscape
syn region abiString start="'" end="'" contains=abiEscape
syn region abiString start="`" end="`" contains=abiEscape
syn match abiEscape "\\." contained
syn match abiComment "#.*"
syn match abiComment "//.*"

hi def link abiKeyword Keyword
hi def link abiConstant Constant
hi def link abiClass Type
hi def link abiNumber Number
hi def link abiString String
hi def link abiEscape Special
hi def link abiComment Comment

let b:current_syntax = "abi"
