import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function MarkdownMessage({ message }) {
  return (
    <div className="message-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
        {message}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownMessage;
