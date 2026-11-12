// Obsidian: the docs' Shiki theme. Five muted hues on #0B0B0E, no Honey. Each is at least 4.5:1
// on the code background (tests/shiki-theme.test.ts computes it).
const CMT = '#82827F'
const STR = '#E3CFA6'
const KW = '#9FC3E6'
const KEY = '#C9B8EC'
const NUM = '#E8B98C'

export const obsidian = {
  name: 'obsidian',
  type: 'dark',
  colors: { 'editor.background': '#0B0B0E', 'editor.foreground': '#D6D6D2' },
  tokenColors: [
    {
      name: 'comments and punctuation continuations',
      scope: ['comment', 'punctuation.definition.comment', 'punctuation.separator.continuation', 'punctuation.separator.key-value', 'punctuation.terminator'],
      settings: { foreground: CMT },
    },
    { name: 'strings', scope: ['string', 'string.quoted', 'punctuation.definition.string', 'string.regexp'], settings: { foreground: STR } },
    {
      name: 'keywords, commands, function names',
      scope: ['keyword', 'keyword.control', 'keyword.operator.new', 'storage', 'storage.type', 'storage.modifier', 'support.function', 'entity.name.function', 'entity.name.command', 'meta.function-call'],
      settings: { foreground: KW },
    },
    {
      name: 'property names, object keys, option flags',
      scope: ['support.type.property-name', 'meta.object-literal.key', 'entity.name.tag.yaml', 'variable.other.property', 'variable.parameter.option', 'string.unquoted.argument.shell', 'meta.property-name'],
      settings: { foreground: KEY },
    },
    {
      name: 'numbers, constants, variables',
      scope: ['constant', 'constant.numeric', 'constant.language', 'constant.character', 'variable', 'variable.other.normal.shell', 'support.constant', 'punctuation.definition.variable'],
      settings: { foreground: NUM },
    },
  ],
}
