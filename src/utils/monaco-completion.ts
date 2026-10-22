
export const HTML_SNIPPETS = [
  { label: "h1", snippet: "<h1>$0</h1>", detail: "Heading 1 Tag" },
  { label: "h2", snippet: "<h2>$0</h2>", detail: "Heading 2 Tag" },
  { label: "h3", snippet: "<h3>$0</h3>", detail: "Heading 3 Tag" },
  { label: "h4", snippet: "<h4>$0</h4>", detail: "Heading 4 Tag" },
  { label: "div", snippet: "<div>$0</div>", detail: "HTML Div Container" },
  { label: "span", snippet: "<span>$0</span>", detail: "Inline Span Tag" },
  { label: "p", snippet: "<p>$0</p>", detail: "Paragraph Tag" },
  { label: "a", snippet: '<a href="$1">$0</a>', detail: "Anchor Tag" },
  { label: "btn", snippet: '<button type="button">$0</button>', detail: "Button Tag" },
  { label: "button", snippet: '<button type="button">$0</button>', detail: "Button Tag" },
  { label: "img", snippet: '<img src="$1" alt="$2" />', detail: "Image Tag" },
  { label: "input", snippet: '<input type="$1" placeholder="$2" />', detail: "Input Field" },
  { label: "ul", snippet: "<ul>\n\t<li>$0</li>\n</ul>", detail: "Unordered List" },
  { label: "ol", snippet: "<ol>\n\t<li>$0</li>\n</ol>", detail: "Ordered List" },
  { label: "li", snippet: "<li>$0</li>", detail: "List Item" },
  { label: "section", snippet: "<section>\n\t$0\n</section>", detail: "Section Tag" },
  { label: "form", snippet: '<form action="$1">\n\t$0\n</form>', detail: "Form Tag" },
]

export const CSS_SNIPPETS = [
  { label: "flex", snippet: "display: flex;\njustify-content: $1;\nalign-items: $2;", detail: "Flexbox Layout" },
  { label: "grid", snippet: "display: grid;\ngrid-template-columns: $1;", detail: "Grid Layout" },
  { label: "center", snippet: "display: flex;\njustify-content: center;\nalign-items: center;", detail: "Center Align Flex" },
  { label: "align-items", snippet: "align-items: center;", detail: "Align Items Center" },
  { label: "justify-content", snippet: "justify-content: space-between;", detail: "Justify Space Between" },
  { label: "margin", snippet: "margin: $1;", detail: "Margin" },
  { label: "padding", snippet: "padding: $1;", detail: "Padding" },
  { label: "background", snippet: "background-color: $1;", detail: "Background Color" },
  { label: "color", snippet: "color: $1;", detail: "Text Color" },
  { label: "font-size", snippet: "font-size: $1px;", detail: "Font Size" },
  { label: "border", snippet: "border: 1px solid $1;", detail: "Border" },
  { label: "border-radius", snippet: "border-radius: $1px;", detail: "Border Radius" },
]

export const JS_SNIPPETS = [
  { label: "doc", snippet: "document.$0", detail: "Document Object" },
  { label: "qs", snippet: "document.querySelector('$1');", detail: "Query Selector" },
  { label: "qsa", snippet: "document.querySelectorAll('$1');", detail: "Query Selector All" },
  { label: "getid", snippet: "document.getElementById('$1');", detail: "Get Element By Id" },
  { label: "getclass", snippet: "document.getElementsByClassName('$1');", detail: "Get Elements By Class Name" },
  { label: "addEv", snippet: "$1.addEventListener('$2', (e) => {\n\t$0\n});", detail: "Event Listener" },
  { label: "clg", snippet: "console.log($1);", detail: "Console Log" },
  { label: "fun", snippet: "function $1($2) {\n\t$0\n}", detail: "Function Statement" },
  { label: "afun", snippet: "const $1 = ($2) => {\n\t$0\n};", detail: "Arrow Function" },
  { label: "async", snippet: "const $1 = async ($2) => {\n\t$0\n};", detail: "Async Arrow Function" },
  { label: "try", snippet: "try {\n\t$0\n} catch (error) {\n\tconsole.error(error);\n}", detail: "Try-Catch Block" },
  { label: "fetch", snippet: "fetch('$1')\n\t.then(res => res.json())\n\t.then(data => {\n\t\t$0\n\t});", detail: "Fetch API" },
  { label: "setTimeout", snippet: "setTimeout(() => {\n\t$0\n}, $1);", detail: "Set Timeout" },
]

export const TAILWIND_CLASSES = [
  // Layout & Flexbox/Grid
  { label: "flex", detail: "display: flex;" },
  { label: "inline-flex", detail: "display: inline-flex;" },
  { label: "grid", detail: "display: grid;" },
  { label: "hidden", detail: "display: none;" },
  { label: "block", detail: "display: block;" },
  { label: "inline-block", detail: "display: inline-block;" },
  { label: "flex-col", detail: "flex-direction: column;" },
  { label: "flex-row", detail: "flex-direction: row;" },
  { label: "items-center", detail: "align-items: center;" },
  { label: "items-start", detail: "align-items: flex-start;" },
  { label: "items-end", detail: "align-items: flex-end;" },
  { label: "justify-center", detail: "justify-content: center;" },
  { label: "justify-between", detail: "justify-content: space-between;" },
  { label: "justify-around", detail: "justify-content: space-around;" },
  { label: "gap-1", detail: "gap: 0.25rem;" },
  { label: "gap-2", detail: "gap: 0.5rem;" },
  { label: "gap-3", detail: "gap: 0.75rem;" },
  { label: "gap-4", detail: "gap: 1rem;" },
  { label: "gap-6", detail: "gap: 1.5rem;" },
  { label: "gap-8", detail: "gap: 2rem;" },

  // Spacing (Padding & Margin)
  { label: "p-0", detail: "padding: 0px;" },
  { label: "p-1", detail: "padding: 0.25rem;" },
  { label: "p-2", detail: "padding: 0.5rem;" },
  { label: "p-3", detail: "padding: 0.75rem;" },
  { label: "p-4", detail: "padding: 1rem;" },
  { label: "p-6", detail: "padding: 1.5rem;" },
  { label: "px-2", detail: "padding-left/right: 0.5rem;" },
  { label: "px-4", detail: "padding-left/right: 1rem;" },
  { label: "py-2", detail: "padding-top/bottom: 0.5rem;" },
  { label: "py-4", detail: "padding-top/bottom: 1rem;" },
  { label: "m-auto", detail: "margin: auto;" },
  { label: "mx-auto", detail: "margin-left/right: auto;" },
  { label: "mb-2", detail: "margin-bottom: 0.5rem;" },
  { label: "mb-4", detail: "margin-bottom: 1rem;" },

  // Sizing
  { label: "w-full", detail: "width: 100%;" },
  { label: "w-screen", detail: "width: 100vw;" },
  { label: "w-auto", detail: "width: auto;" },
  { label: "h-full", detail: "height: 100%;" },
  { label: "h-screen", detail: "height: 100vh;" },

  // Typography & Colors
  { label: "text-xs", detail: "font-size: 0.75rem;" },
  { label: "text-sm", detail: "font-size: 0.875rem;" },
  { label: "text-base", detail: "font-size: 1rem;" },
  { label: "text-lg", detail: "font-size: 1.125rem;" },
  { label: "text-xl", detail: "font-size: 1.25rem;" },
  { label: "text-2xl", detail: "font-size: 1.5rem;" },
  { label: "font-normal", detail: "font-weight: 400;" },
  { label: "font-medium", detail: "font-weight: 500;" },
  { label: "font-semibold", detail: "font-weight: 600;" },
  { label: "font-bold", detail: "font-weight: 700;" },
  { label: "text-center", detail: "text-align: center;" },
  { label: "text-left", detail: "text-align: left;" },
  { label: "text-white", detail: "color: #ffffff;" },
  { label: "text-black", detail: "color: #000000;" },
  { label: "text-red-500", detail: "color: #ef4444;" },
  { label: "text-blue-600", detail: "color: #2563eb;" },
  { label: "text-gray-500", detail: "color: #6b7280;" },

  // Backgrounds & Borders
  { label: "bg-white", detail: "background-color: #ffffff;" },
  { label: "bg-black", detail: "background-color: #000000;" },
  { label: "bg-transparent", detail: "background-color: transparent;" },
  { label: "bg-gray-100", detail: "background-color: #f3f4f6;" },
  { label: "bg-blue-600", detail: "background-color: #2563eb;" },
  { label: "border", detail: "border-width: 1px;" },
  { label: "border-gray-200", detail: "border-color: #e5e7eb;" },
  { label: "rounded", detail: "border-radius: 0.25rem;" },
  { label: "rounded-md", detail: "border-radius: 0.375rem;" },
  { label: "rounded-lg", detail: "border-radius: 0.5rem;" },
  { label: "rounded-xl", detail: "border-radius: 0.75rem;" },
  { label: "rounded-full", detail: "border-radius: 9999px;" },
  { label: "shadow-sm", detail: "box-shadow: 0 1px 2px;" },
  { label: "shadow-md", detail: "box-shadow: 0 4px 6px;" },
  { label: "shadow-lg", detail: "box-shadow: 0 10px 15px;" },

  // Transitions & Cursor
  { label: "transition-all", detail: "transition-property: all;" },
  { label: "duration-200", detail: "transition-duration: 200ms;" },
  { label: "cursor-pointer", detail: "cursor: pointer;" },
]

export function registerCustomFallbackCompletions(monaco: any) {
  if (!monaco || !monaco.languages) return

  const triggerChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-".split("")

  // HTML + Tailwind Fallback
  monaco.languages.registerCompletionItemProvider("html", {
    triggerCharacters: triggerChars,
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }

      // 1. HTML Snippets
      const tagSuggestions = HTML_SNIPPETS.map((item) => ({
        label: item.label,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: item.snippet,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: item.detail,
        range,
      }))

      // 2. Tailwind Classes
      const tailwindSuggestions = TAILWIND_CLASSES.map((item) => ({
        label: item.label,
        kind: monaco.languages.CompletionItemKind.Enum,
        insertText: item.label,
        detail: `Tailwind: ${item.detail}`,
        range,
      }))

      return { suggestions: [...tagSuggestions, ...tailwindSuggestions] }
    },
  })

  // CSS Fallback
  monaco.languages.registerCompletionItemProvider("css", {
    triggerCharacters: triggerChars,
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }

      const suggestions = CSS_SNIPPETS.map((item) => ({
        label: item.label,
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: item.snippet,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: item.detail,
        range,
      }))

      return { suggestions }
    },
  })

  // JS Fallback
  monaco.languages.registerCompletionItemProvider("javascript", {
    triggerCharacters: triggerChars,
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }

      const suggestions = JS_SNIPPETS.map((item) => ({
        label: item.label,
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: item.snippet,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: item.detail,
        range,
      }))

      return { suggestions }
    },
  })
}