export default function LinkText({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-link underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  );
}
