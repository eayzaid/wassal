import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, className = '' }) => {
  const sanitizedHtml = useMemo(() => {
    if (!content) return '';
    try {
      const rawHtml = marked.parse(content, { async: false, breaks: true, gfm: true }) as string;
      return DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'strike',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
          'hr', 'a', 'span'
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      });
    } catch {
      return content;
    }
  }, [content]);

  return (
    <div
      className={`prose prose-sm max-w-none text-wassal-plum/90 font-sans space-y-2 leading-relaxed break-words
        [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-wassal-plum [&_h1]:font-heading [&_h1]:mt-3 [&_h1]:mb-1
        [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-wassal-plum [&_h2]:font-heading [&_h2]:mt-2.5 [&_h2]:mb-1
        [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-wassal-plum [&_h3]:font-heading [&_h3]:mt-2 [&_h3]:mb-0.5
        [&_p]:text-xs [&_p]:sm:text-sm [&_p]:leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:text-xs [&_ul]:sm:text-sm
        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_ol]:text-xs [&_ol]:sm:text-sm
        [&_li]:leading-normal
        [&_blockquote]:border-l-4 [&_blockquote]:border-wassal-sage [&_blockquote]:pl-3 [&_blockquote]:py-1 [&_blockquote]:italic [&_blockquote]:text-wassal-slate
        [&_pre]:bg-wassal-bg/80 [&_pre]:p-3 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-wassal-border [&_pre]:my-2
        [&_code]:font-mono [&_code]:text-xs [&_code]:bg-wassal-bg [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:border [&_code]:border-wassal-border
        [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:border-none
        [&_a]:text-wassal-green-ink [&_a]:underline [&_a]:font-medium hover:[&_a]:text-wassal-plum
        [&_hr]:border-wassal-border [&_hr]:my-3
        ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};
