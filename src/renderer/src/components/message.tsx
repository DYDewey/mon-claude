import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

// Sans rehype-raw, react-markdown échappe le HTML brut : Claude ne peut pas injecter de balises.
export function Markdown({ text }: { text: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
      {text}
    </ReactMarkdown>
  );
}
