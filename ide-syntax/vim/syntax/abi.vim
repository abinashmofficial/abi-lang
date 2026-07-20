if exists("b:current_syntax")
  finish
endif

syn keyword abiKeyword class func print input return if else while for in and or not public private protected import export from const let interface implements extends new async await throw try catch finally this
syn keyword abiConstant true false null
syn match abiNumber "\b\d\+\(\.\d\+\)\?\b"
syn region abiString start='"' end='"' contains=abiEscape
syn region abiString start="'" end="'" contains=abiEscape
syn region abiString start="`" end="`" contains=abiEscape
syn match abiEscape "\\." contained
syn match abiComment "#.*"
syn match abiComment "//.*"

hi def link abiKeyword Keyword
hi def link abiConstant Constant
hi def link abiNumber Number
hi def link abiString String
hi def link abiEscape Special
hi def link abiComment Comment

let b:current_syntax = "abi"
