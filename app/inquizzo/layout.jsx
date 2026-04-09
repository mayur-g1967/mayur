import ProtectedRoute from '@/app/components/shared/provider/ProtectedRoute';

export default function InquizzoLayout({ children }) {
    return (
        <ProtectedRoute>
            {children}
        </ProtectedRoute>
    );
}
