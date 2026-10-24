import Image from 'next/image';
import { Fragment } from 'react';

/** Renders Strapi's "Rich text (Blocks)" JSON. */
type Node = any;

function Inline({ nodes }: { nodes: Node[] }) {
  return (
    <>
      {(nodes || []).map((n, i) => {
        if (n.type === 'link') {
          const ext = /^https?:/.test(n.url);
          return (
            <a key={i} href={n.url} target={ext ? '_blank' : undefined} rel={ext ? 'noopener noreferrer' : undefined}>
              <Inline nodes={n.children} />
            </a>
          );
        }
        let el: React.ReactNode = n.text;
        if (typeof el === 'string' && el.includes('\n')) {
          el = el.split('\n').map((part: string, j: number, arr: string[]) => (
            <Fragment key={j}>{part}{j < arr.length - 1 ? <br /> : null}</Fragment>
          ));
        }
        if (n.code) el = <code>{el}</code>;
        if (n.bold) el = <strong>{el}</strong>;
        if (n.italic) el = <em>{el}</em>;
        if (n.underline) el = <u>{el}</u>;
        if (n.strikethrough) el = <s>{el}</s>;
        return <Fragment key={i}>{el}</Fragment>;
      })}
    </>
  );
}

function BlockNode({ node }: { node: Node }) {
  switch (node.type) {
    case 'heading': {
      const L = Math.min(Math.max(node.level || 2, 2), 4);
      const Tag = (`h${L}`) as 'h2' | 'h3' | 'h4';
      return <Tag><Inline nodes={node.children} /></Tag>;
    }
    case 'list': {
      const Tag = node.format === 'ordered' ? 'ol' : 'ul';
      return <Tag>{node.children.map((li: Node, i: number) => <li key={i}><Inline nodes={li.children} /></li>)}</Tag>;
    }
    case 'quote':
      return <blockquote><Inline nodes={node.children} /></blockquote>;
    case 'code':
      return <pre><code>{node.children?.map((c: Node) => c.text).join('')}</code></pre>;
    case 'image': {
      const img = node.image;
      if (!img?.url) return null;
      const url = img.url.replace(/^https?:\/\/[^/]+(?=\/uploads\/)/, '');
      return <Image src={url} alt={img.alternativeText || ''} width={img.width || 1200} height={img.height || 800} sizes="(max-width: 800px) 100vw, 760px" style={{ width: '100%', height: 'auto', marginTop: 16 }} />;
    }
    default:
      return <p><Inline nodes={node.children} /></p>;
  }
}

export default function RichText({ content, className = 'prose' }: { content: Node[] | null | undefined; className?: string }) {
  if (!content?.length) return null;
  return <div className={className}>{content.map((n, i) => <BlockNode key={i} node={n} />)}</div>;
}
