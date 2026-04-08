import Header from '@/app/components/landing/header';
export default function SiteLayout({ children }) {
    return (
        <div className="dark:bg-[#101828] flex flex-col flex-1">
            <Header />
            <div className="isolate flex-1 flex flex-col">{children}</div>
            <footer className="py-8 text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Persona AI. All rights reserved.
            </footer>
        </div>
    );
}