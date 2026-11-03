export const EDITOR_DEMO_CONTENT = `
<h1>Welcome to Cortex Editor</h1>
<p>This is a <strong>Notion-grade</strong> editor built with Tiptap and your Cortex design system. It supports all the features you need for academic writing and note-taking.</p>

<h2>✨ Features</h2>
<ul>
  <li><strong>Rich Text Formatting</strong> — Bold, italic, underline, strikethrough, highlight, and more</li>
  <li><strong>Keyboard Shortcuts</strong> — Press <code>⌘B</code> for bold, <code>⌘I</code> for italic, etc.</li>
  <li><strong>Slash Commands</strong> — Type <code>/</code> to access quick commands</li>
  <li><strong>Context Menu</strong> — Right-click for more formatting options</li>
  <li><strong>Code Blocks</strong> — With syntax highlighting support</li>
</ul>

<h2>📝 Try It Out</h2>
<p>Start typing below, or try these features:</p>

<h3>Task Lists</h3>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true">Create a beautiful editor</li>
  <li data-type="taskItem" data-checked="true">Add slash commands</li>
  <li data-type="taskItem" data-checked="false">Build something amazing</li>
</ul>

<h3>Code Block</h3>
<pre><code class="language-typescript">// Example TypeScript code
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

function createNote(title: string): Note {
  return {
    id: crypto.randomUUID(),
    title,
    content: "",
    createdAt: new Date(),
  };
}</code></pre>

<h3>Blockquote</h3>
<blockquote>
  <p>"The only way to do great work is to love what you do." — Steve Jobs</p>
</blockquote>

<p>Now it's your turn! Start editing and explore all the features.</p>
`;
