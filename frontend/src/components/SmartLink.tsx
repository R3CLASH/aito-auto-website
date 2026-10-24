import Link from 'next/link';
import { isExternal } from '@/lib/format';

/** Internal links use next/link, external ones a plain anchor. */
export default function SmartLink({ href, className, children, newTab }: {
  href: string;
  className?: string;
  children: React.ReactNode;
  newTab?: boolean;
}) {
  if (isExternal(href) || newTab) {
    return (
      <a className={className} href={href} target={newTab || /^https?:/.test(href) ? '_blank' : undefined} rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return <Link className={className} href={href || '/'}>{children}</Link>;
}
