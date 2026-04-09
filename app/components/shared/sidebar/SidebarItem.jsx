'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarItem({ icon, text, href, alert }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <li className="relative flex items-center">
      <Link
        href={href}
        className={`
          group flex items-center gap-2 py-2 px-3 my-1 rounded-md cursor-pointer
          transition-all duration-200
          ${isActive ? "bg-sidebar-accent text-white" : "text-sidebar-primary hover:bg-sidebar-accent/50"}
        `}
      >
        {/* Icon */}
        <span className="text-xl">{icon}</span>

        {/* Text — auto hides when collapsed due to group-based styling */}
        <span className="font-medium whitespace-nowrap transition-all duration-200">
          {text}
        </span>

        {/* Alert Dot (optional) */}
        {alert && (
          <span className="absolute right-3 h-2 w-2 rounded-full bg-red-500"></span>
        )}
      </Link>
    </li>
  );
}