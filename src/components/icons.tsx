import type { SVGProps } from 'react';

const base = (d: React.ReactNode) => (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
    {d}
  </svg>
);

export const IconSearch = base(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
export const IconSpark = base(<path d="M12 3l2.2 5.6L20 9.5l-4.5 3.9L17 19l-5-3-5 3 1.5-5.6L4 9.5l5.8-.9z" />);
export const IconShield = base(<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" />);
export const IconCompare = base(<><path d="M8 3v18M16 3v18" /><path d="M4 8h4M16 16h4M4 14h4M16 10h4" /></>);
export const IconStar = base(<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" />);
export const IconFilter = base(<path d="M4 5h16l-6 7.5V19l-4 2v-8.5z" />);
export const IconX = base(<path d="M6 6l12 12M18 6 6 18" />);
export const IconPlus = base(<path d="M12 5v14M5 12h14" />);
export const IconTrash = base(<><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>);
export const IconBack = base(<path d="M15 5l-7 7 7 7" />);
export const IconUsers = base(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.5 3.2-5.5 6.5-5.5s5.9 2 6.5 5.5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.6c2 .7 3.2 2.5 3.5 5.4" /></>);
export const IconSwap = base(<><path d="M7 4 3 8l4 4M3 8h14" /><path d="m17 20 4-4-4-4M21 16H7" /></>);
export const IconWand = base(<><path d="M4 20 16 8M14 6l4 4" /><path d="M19 3v4M17 5h4M6 3v3M4.5 4.5h3" /></>);
export const IconCheck = base(<path d="m5 12 5 5 9-10" />);
export const IconEdit = base(<><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></>);
export const IconChart = base(<><path d="M4 20V4M4 20h16" /><path d="m7 15 4-4 3 3 5-6" /></>);
export const IconCopy = base(<><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>);
