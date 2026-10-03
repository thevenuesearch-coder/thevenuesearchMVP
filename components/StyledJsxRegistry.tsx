'use client';

import { useState, type ReactNode } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { StyleRegistry, createStyleRegistry } from 'styled-jsx';

/*
 * Several components (venue page, room cards/modal, enquiry) style
 * themselves with <style jsx>. In the App Router that CSS is only
 * written to the page when the component hydrates, so on a slow
 * phone the server-rendered HTML shows the venue page UNSTYLED and
 * everything then jumps into place (this was the ~0.49 Cumulative
 * Layout Shift on venue pages).
 *
 * This is the registry from the Next.js docs: it collects the
 * styled-jsx CSS during server rendering and inlines it into the
 * HTML, so the first paint is already styled. No styles change.
 */
export default function StyledJsxRegistry({
  children,
}: {
  children: ReactNode;
}) {
  const [registry] = useState(() => createStyleRegistry());

  useServerInsertedHTML(() => {
    const styles = registry.styles();

    registry.flush();

    return <>{styles}</>;
  });

  return (
    <StyleRegistry registry={registry}>{children}</StyleRegistry>
  );
}
