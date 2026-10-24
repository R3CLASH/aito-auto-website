export default function Plate({ text, band = 'FIN', size, className = '', style }: {
  text: string;
  band?: string;
  size?: 'lg' | 'xl';
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={`plate ${size || ''} ${className}`} style={style}>
      <i>{band}</i>
      <b>{text}</b>
    </span>
  );
}
